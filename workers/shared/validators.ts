// Shared security validators for Cloudflare Workers that write to the
// `komplexaci-media` R2 bucket.
//
// IMPORTANT: There is a JavaScript copy of these validators in
// `scripts/r2-fetch-worker.js`. Keep both implementations in sync — if you
// tighten the regex or change the comparison here, mirror the change there.

// Allow-listed object key prefixes / extensions. R2 keys are flat strings,
// so "path traversal" here means overwriting other prefixes — anchor the
// regex and only allow the curated content extensions we actually serve.
export const KEY_ALLOWLIST =
  /^(roms|bios|covers|saves)\/[A-Za-z0-9._/-]+\.(chd|cue|bin|zip|z64|n64|v64|sfc|smc|nes|gb|gbc|gba|jpg|jpeg|png|webp|json)$/;

/** Hard cap on a single PUT body. R2 enforces its own per-PUT ceiling. */
export const SIMPLE_PUT_MAX_BYTES = 4 * 1024 * 1024 * 1024; // 4 GiB

/**
 * Validate a candidate R2 key against the allow-list and reject obvious
 * traversal / encoding tricks. Returns true iff the key is safe to use.
 */
export function isValidKey(key: string): boolean {
  if (!key || key.length > 512) return false;
  if (key.includes("..") || key.includes("\0") || key.startsWith("/")) return false;
  if (key.includes("%2e%2e") || key.includes("%2E%2E")) return false;
  return KEY_ALLOWLIST.test(key);
}

/**
 * Constant-time secret comparison via SHA-256 of both inputs. Hashing first
 * makes the comparison length-independent (a raw bytewise compare with an
 * early-return on length mismatch leaks the secret's length via timing).
 */
export async function safeCompareSecrets(a: string, b: string): Promise<boolean> {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const [aHash, bHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const av = new Uint8Array(aHash);
  const bv = new Uint8Array(bHash);
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}
