/**
 * Cloudflare Worker: fetch a file from an allow-listed URL and store it in R2.
 *
 * Deploy: npx wrangler deploy --config scripts/wrangler-uploader.toml
 *
 * SECURITY:
 *  - Requires Bearer auth against the UPLOAD_SECRET Wrangler secret.
 *      cd scripts && npx wrangler secret put UPLOAD_SECRET --config wrangler-uploader.toml
 *    Use a 32+ byte random value (e.g. `openssl rand -hex 32`).
 *  - Source URL host is restricted to a static allow-list (Myrient, etc.) to
 *    prevent the Worker from being used as an open proxy / data-laundering
 *    endpoint that abuses Cloudflare egress + R2 storage on the operator's tab.
 *  - Destination R2 key is constrained to known content prefixes so the Worker
 *    cannot overwrite trust-bearing assets like games.json or the BIOS files.
 *
 * Usage: POST { "url": "https://myrient.erista.me/...", "key": "roms/ps1/foo.chd" }
 * Header: Authorization: Bearer <UPLOAD_SECRET>
 */

const ALLOWED_URL_HOSTS = new Set([
  'myrient.erista.me',
  'archive.org',
]);

const KEY_ALLOWLIST =
  /^(roms|bios|covers|saves)\/[A-Za-z0-9._/-]+\.(chd|cue|bin|zip|z64|n64|v64|sfc|smc|nes|gb|gbc|gba|jpg|jpeg|png|webp|json)$/;

function isValidKey(key) {
  if (!key || typeof key !== 'string' || key.length > 512) return false;
  if (key.includes('..') || key.includes('\0') || key.startsWith('/')) return false;
  if (key.includes('%2e%2e') || key.includes('%2E%2E')) return false;
  return KEY_ALLOWLIST.test(key);
}

function isValidSourceUrl(raw) {
  if (typeof raw !== 'string' || raw.length > 2048) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  if (!ALLOWED_URL_HOSTS.has(parsed.hostname)) return null;
  return parsed;
}

// Hash both sides with SHA-256 before comparison so the comparison is
// length-independent (raw bytewise compare leaks the secret's length via
// the early-return on length mismatch).
async function safeCompareSecrets(a, b) {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const [aHash, bHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const av = new Uint8Array(aHash);
  const bv = new Uint8Array(bHash);
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('POST { "url": "...", "key": "..." } with Authorization: Bearer <secret>', { status: 405 });
    }

    const expected = env.UPLOAD_SECRET;
    if (!expected || expected.length < 16) {
      return new Response('Server misconfigured: UPLOAD_SECRET not set', { status: 500 });
    }
    const header = request.headers.get('Authorization') || '';
    const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!(await safeCompareSecrets(presented, expected))) {
      return new Response('Unauthorized', { status: 401 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response('Invalid JSON body', { status: 400 });
    }

    const sourceUrl = isValidSourceUrl(payload?.url);
    if (!sourceUrl) {
      return new Response('Source URL must be https and host-allow-listed', { status: 400 });
    }

    const key = payload?.key;
    if (!isValidKey(key)) {
      return new Response('Invalid destination key', { status: 400 });
    }

    try {
      const response = await fetch(sourceUrl.href, {
        headers: {
          'User-Agent': 'komplexaci-r2-fetch/1.0',
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        return new Response(`Upstream fetch failed: ${response.status}`, { status: 502 });
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      await env.CDN_BUCKET.put(key, response.body, {
        httpMetadata: { contentType },
      });

      return new Response(JSON.stringify({
        success: true,
        key,
        size: response.headers.get('content-length'),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Fetch-and-store failed:', err);
      return new Response('Fetch-and-store failed', { status: 500 });
    }
  },
};
