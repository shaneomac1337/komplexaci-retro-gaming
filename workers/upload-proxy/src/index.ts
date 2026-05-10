// Upload Proxy Worker for R2
// Accepts PUT requests and stores files in R2 bucket
//
// SECURITY: Auth is via the UPLOAD_SECRET Wrangler secret (NOT a hardcoded
// constant — that prior version was committed to source). Set with:
//   cd workers/upload-proxy && npx wrangler secret put UPLOAD_SECRET
// Use a 32+ byte random value (e.g. `openssl rand -hex 32`).
// Header: X-Upload-Secret: <value>

import { isValidKey, safeCompareSecrets, SIMPLE_PUT_MAX_BYTES } from "../../shared/validators";

interface Env {
  BUCKET: R2Bucket;
  UPLOAD_SECRET: string;
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

        // Require a parseable Content-Length so the size cap can't be bypassed
        // by omitting the header or sending Transfer-Encoding: chunked.
        const lenHeader = request.headers.get("Content-Length");
        const len = lenHeader ? parseInt(lenHeader, 10) : NaN;
        if (!Number.isFinite(len) || len < 0) {
          return new Response("Content-Length required", { status: 411 });
        }
        if (len > SIMPLE_PUT_MAX_BYTES) {
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
