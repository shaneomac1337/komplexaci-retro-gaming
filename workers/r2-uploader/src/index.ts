// R2 Uploader Worker - supports small files and multipart for large files
//
// SECURITY: All write paths require Bearer auth against the UPLOAD_SECRET
// Wrangler secret. Set with:
//   cd workers/r2-uploader && npx wrangler secret put UPLOAD_SECRET
// Use a 32+ byte random value (e.g. `openssl rand -hex 32`).
//
// All keys are validated against an allow-list regex; reads are intentionally
// not exposed because the public CDN already serves R2 content.

interface Env {
  CDN_BUCKET: R2Bucket;
  UPLOAD_SECRET: string;
}

// Allow-listed object key prefixes / extensions. R2 keys are flat strings, so
// path traversal here means overwriting other prefixes — anchor the regex.
const KEY_ALLOWLIST =
  /^(roms|bios|covers|saves)\/[A-Za-z0-9._/-]+\.(chd|cue|bin|zip|z64|n64|v64|sfc|smc|nes|gb|gbc|gba|jpg|jpeg|png|webp|json)$/;

// Hard cap on a single PUT body (multipart parts are independently capped at
// 5 GiB by R2 itself, this is just for the simple-PUT path).
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

async function authorize(request: Request, env: Env): Promise<Response | null> {
  const expected = env.UPLOAD_SECRET;
  if (!expected || expected.length < 16) {
    // Fail closed when the operator hasn't configured a strong secret.
    return new Response("Server misconfigured: UPLOAD_SECRET not set", { status: 500 });
  }
  const header = request.headers.get("Authorization") || "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!(await safeCompareSecrets(presented, expected))) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight — keep restrictive: only the upload host itself.
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("Origin") || "",
          "Access-Control-Allow-Methods": "PUT, POST, DELETE",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Max-Age": "600",
          "Vary": "Origin",
        },
      });
    }

    // Every non-preflight request must authenticate.
    const authError = await authorize(request, env);
    if (authError) return authError;

    // === MULTIPART UPLOAD (for files > 100MB) ===

    // Step 1: Create multipart upload
    if (request.method === "POST" && path.startsWith("/mpu/create/")) {
      const key = path.replace("/mpu/create/", "");
      if (!isValidKey(key)) return new Response("Invalid key", { status: 400 });

      const upload = await env.CDN_BUCKET.createMultipartUpload(key);
      return Response.json({ uploadId: upload.uploadId, key });
    }

    // Step 2: Upload part
    if (request.method === "PUT" && path.startsWith("/mpu/part/")) {
      const key = path.replace("/mpu/part/", "");
      const uploadId = url.searchParams.get("uploadId");
      const partNum = parseInt(url.searchParams.get("part") || "0");

      if (!isValidKey(key)) return new Response("Invalid key", { status: 400 });
      if (!uploadId || !partNum) {
        return new Response("Missing uploadId or part", { status: 400 });
      }

      const upload = env.CDN_BUCKET.resumeMultipartUpload(key, uploadId);
      const part = await upload.uploadPart(partNum, request.body!);
      return Response.json({ part: partNum, etag: part.etag });
    }

    // Step 3: Complete multipart upload
    if (request.method === "POST" && path.startsWith("/mpu/complete/")) {
      const key = path.replace("/mpu/complete/", "");
      const uploadId = url.searchParams.get("uploadId");

      if (!isValidKey(key)) return new Response("Invalid key", { status: 400 });
      if (!uploadId) return new Response("Missing uploadId", { status: 400 });

      const { parts } = await request.json() as { parts: { part: number; etag: string }[] };
      const upload = env.CDN_BUCKET.resumeMultipartUpload(key, uploadId);
      const result = await upload.complete(parts.map(p => ({ partNumber: p.part, etag: p.etag })));
      return Response.json({ success: true, key: result.key });
    }

    // Abort multipart upload
    if (request.method === "DELETE" && path.startsWith("/mpu/abort/")) {
      const key = path.replace("/mpu/abort/", "");
      const uploadId = url.searchParams.get("uploadId");

      if (!isValidKey(key)) return new Response("Invalid key", { status: 400 });
      if (!uploadId) return new Response("Missing uploadId", { status: 400 });

      const upload = env.CDN_BUCKET.resumeMultipartUpload(key, uploadId);
      await upload.abort();
      return Response.json({ success: true, aborted: key });
    }

    // === SIMPLE UPLOAD (for files < 100MB) ===

    if (request.method === "PUT") {
      const key = path.slice(1);
      if (!isValidKey(key)) return new Response("Invalid key", { status: 400 });

      // Require a parseable Content-Length so the size cap can't be bypassed
      // by omitting the header or sending Transfer-Encoding: chunked. Clients
      // that genuinely don't know the size up front should use the multipart
      // upload endpoints, which R2 caps per-part at its own ceiling.
      const lenHeader = request.headers.get("Content-Length");
      const len = lenHeader ? parseInt(lenHeader, 10) : NaN;
      if (!Number.isFinite(len) || len < 0) {
        return new Response("Content-Length required for simple PUT", { status: 411 });
      }
      if (len > SIMPLE_PUT_MAX_BYTES) {
        return new Response("Payload too large; use multipart", { status: 413 });
      }

      await env.CDN_BUCKET.put(key, request.body, {
        httpMetadata: { contentType: request.headers.get("Content-Type") || "application/octet-stream" },
      });
      return new Response(`Put ${key} successfully!`);
    }

    // GET intentionally NOT exposed — public CDN serves reads.
    // DELETE on top-level keys intentionally NOT exposed — use wrangler CLI.

    return Response.json({
      usage: {
        small_files: "PUT /<allowlisted-key> with Authorization: Bearer <secret> (< 100MB recommended, 4GB hard cap)",
        large_files: {
          step1: "POST /mpu/create/<key> -> {uploadId}",
          step2: "PUT /mpu/part/<key>?uploadId=xxx&part=N (95MB chunks)",
          step3: "POST /mpu/complete/<key>?uploadId=xxx with {parts:[{part,etag}...]}",
        },
        notes: "Reads via public CDN; deletes via wrangler CLI.",
      },
    }, { status: 405 });
  },
};
