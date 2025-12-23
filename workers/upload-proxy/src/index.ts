// Upload Proxy Worker for R2
// Accepts PUT requests and stores files in R2 bucket

interface Env {
  BUCKET: R2Bucket;
}

const UPLOAD_SECRET = "komplexaci-upload-2024"; // Simple auth

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // Remove leading slash

    // Check auth header
    const auth = request.headers.get("X-Upload-Secret");
    if (auth !== UPLOAD_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (request.method === "PUT") {
      if (!key) {
        return new Response("Missing key in path", { status: 400 });
      }

      try {
        const body = request.body;
        if (!body) {
          return new Response("Missing body", { status: 400 });
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
        return new Response(`Upload failed: ${error}`, { status: 500 });
      }
    }

    if (request.method === "GET" && key === "health") {
      return new Response("OK", { status: 200 });
    }

    return new Response("Method not allowed. Use PUT to upload.", { status: 405 });
  },
};
