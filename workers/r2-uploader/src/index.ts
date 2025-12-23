// R2 Uploader Worker - supports small files and multipart for large files

interface Env {
  CDN_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // === MULTIPART UPLOAD (for files > 100MB) ===

    // Step 1: Create multipart upload
    // POST /mpu/create/path/to/file.chd
    if (request.method === "POST" && path.startsWith("/mpu/create/")) {
      const key = path.replace("/mpu/create/", "");
      if (!key) return new Response("Missing key", { status: 400 });

      const upload = await env.CDN_BUCKET.createMultipartUpload(key);
      return Response.json({ uploadId: upload.uploadId, key });
    }

    // Step 2: Upload part
    // PUT /mpu/part/path/to/file.chd?uploadId=xxx&part=1
    if (request.method === "PUT" && path.startsWith("/mpu/part/")) {
      const key = path.replace("/mpu/part/", "");
      const uploadId = url.searchParams.get("uploadId");
      const partNum = parseInt(url.searchParams.get("part") || "0");

      if (!key || !uploadId || !partNum) {
        return new Response("Missing key, uploadId, or part", { status: 400 });
      }

      const upload = env.CDN_BUCKET.resumeMultipartUpload(key, uploadId);
      const part = await upload.uploadPart(partNum, request.body!);
      return Response.json({ part: partNum, etag: part.etag });
    }

    // Step 3: Complete multipart upload
    // POST /mpu/complete/path/to/file.chd?uploadId=xxx
    // Body: {"parts":[{"part":1,"etag":"xxx"},{"part":2,"etag":"yyy"}]}
    if (request.method === "POST" && path.startsWith("/mpu/complete/")) {
      const key = path.replace("/mpu/complete/", "");
      const uploadId = url.searchParams.get("uploadId");

      if (!key || !uploadId) {
        return new Response("Missing key or uploadId", { status: 400 });
      }

      const { parts } = await request.json() as { parts: { part: number; etag: string }[] };
      const upload = env.CDN_BUCKET.resumeMultipartUpload(key, uploadId);
      const result = await upload.complete(parts.map(p => ({ partNumber: p.part, etag: p.etag })));
      return Response.json({ success: true, key: result.key });
    }

    // Abort multipart upload
    // DELETE /mpu/abort/path/to/file.chd?uploadId=xxx
    if (request.method === "DELETE" && path.startsWith("/mpu/abort/")) {
      const key = path.replace("/mpu/abort/", "");
      const uploadId = url.searchParams.get("uploadId");

      if (!key || !uploadId) {
        return new Response("Missing key or uploadId", { status: 400 });
      }

      const upload = env.CDN_BUCKET.resumeMultipartUpload(key, uploadId);
      await upload.abort();
      return Response.json({ success: true, aborted: key });
    }

    // === SIMPLE UPLOAD (for files < 100MB) ===

    // PUT /path/to/file.ext
    if (request.method === "PUT") {
      const key = path.slice(1);
      if (!key) return new Response("Missing key", { status: 400 });

      await env.CDN_BUCKET.put(key, request.body, {
        httpMetadata: { contentType: request.headers.get("Content-Type") || "application/octet-stream" },
      });
      return new Response(`Put ${key} successfully!`);
    }

    // GET /path/to/file.ext
    if (request.method === "GET" && path !== "/") {
      const key = path.slice(1);
      const obj = await env.CDN_BUCKET.get(key);
      if (!obj) return new Response("Not found", { status: 404 });
      return new Response(obj.body, {
        headers: { "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream" },
      });
    }

    // DELETE /path/to/file.ext
    if (request.method === "DELETE") {
      const key = path.slice(1);
      if (!key) return new Response("Missing key", { status: 400 });
      await env.CDN_BUCKET.delete(key);
      return new Response(`Deleted ${key}`);
    }

    return Response.json({
      usage: {
        small_files: "PUT /path/to/file (< 100MB)",
        large_files: {
          step1: "POST /mpu/create/path/to/file -> {uploadId}",
          step2: "PUT /mpu/part/path/to/file?uploadId=xxx&part=N (repeat for each 95MB chunk)",
          step3: "POST /mpu/complete/path/to/file?uploadId=xxx with {parts:[{part,etag}...]}"
        }
      }
    }, { status: 405 });
  },
};
