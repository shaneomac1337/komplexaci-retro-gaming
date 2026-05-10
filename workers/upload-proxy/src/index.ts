// Upload Proxy Worker for R2
// Accepts PUT requests and stores files in R2 bucket
//
// SECURITY: Auth is via the UPLOAD_SECRET Wrangler secret (NOT a hardcoded
// constant — that prior version was committed to source). Set with:
//   cd workers/upload-proxy && npx wrangler secret put UPLOAD_SECRET
// Use a 32+ byte random value (e.g. `openssl rand -hex 32`).
// Header: X-Upload-Secret: <value>

interface Env {
  BUCKET: R2Bucket;
  UPLOAD_SECRET: string;
}

const KEY_ALLOWLIST =
  /^(roms|bios|covers|saves)\/[A-Za-z0-9._/-]+\.(chd|cue|bin|zip|z64|n64|v64|sfc|smc|nes|gb|gbc|gba|jpg|jpeg|png|webp|json)$/;

const SIMPLE_PUT_MAX_BYTES = 4 * 1024 * 1024 * 1024; // 4 GiB

function isValidKey(key: string): boolean {
  if (!key || key.length > 512) return false;
  if (key.includes("..") || key.includes("\0") || key.startsWith("/")) return false;
  if (key.includes("%2e%2e") || key.includes("%2E%2E")) return false;
  return KEY_ALLOWLIST.test(key);
}

// Hash both sides with SHA-256 before comparison so the comparison is
// length-independent (raw bytewise compare leaks the secret's length via
// the early-return on length mismatch).
async function safeCompareSecrets(a: string, b: string): Promise<boolean> {
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // Remove leading slash

    // Health endpoint — no auth, no body, no key disclosure.
    if (request.method === "GET" && key === "health") {
      return new Response("OK", { status: 200 });
    }

    // Auth check — fail closed if secret isn't configured.
    const expected = env.UPLOAD_SECRET;
    if (!expected || expected.length < 16) {
      return new Response("Server misconfigured: UPLOAD_SECRET not set", { status: 500 });
    }
    const presented = request.headers.get("X-Upload-Secret") || "";
    if (!(await safeCompareSecrets(presented, expected))) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (request.method === "PUT") {
      if (!isValidKey(key)) {
        return new Response("Invalid key", { status: 400 });
      }

      try {
        const body = request.body;
        if (!body) {
          return new Response("Missing body", { status: 400 });
        }

        const lenHeader = request.headers.get("Content-Length");
        const len = lenHeader ? parseInt(lenHeader, 10) : NaN;
        if (Number.isFinite(len) && len > SIMPLE_PUT_MAX_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }

        await env.BUCKET.put(key, body, {
          httpMetadata: {
            contentType: request.headers.get("Content-Type") || "application/octet-stream",
          },
        });

        return new Response(JSON.stringify({ success: true, key }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        // Avoid leaking error internals to caller; log to Worker tail instead.
        console.error("Upload failed:", error);
        return new Response("Upload failed", { status: 500 });
      }
    }

    return new Response("Method not allowed. Use PUT to upload.", { status: 405 });
  },
};
