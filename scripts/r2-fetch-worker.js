/**
 * Cloudflare Worker to fetch a file from URL and store in R2
 * Deploy with: npx wrangler deploy scripts/r2-fetch-worker.js --name r2-uploader
 *
 * Usage: POST https://r2-uploader.<your-subdomain>.workers.dev
 * Body: { "url": "https://example.com/file.chd", "key": "roms/ps1/game.chd" }
 */

export default {
  async fetch(request, env) {
    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('POST { "url": "...", "key": "..." }', { status: 405 });
    }

    try {
      const { url, key } = await request.json();

      if (!url || !key) {
        return new Response('Missing url or key', { status: 400 });
      }

      console.log(`Fetching ${url} -> ${key}`);

      // Fetch the file with browser-like headers
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
        }
      });

      if (!response.ok) {
        return new Response(`Failed to fetch: ${response.status}`, { status: 502 });
      }

      // Get content type
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // Stream directly to R2
      await env.CDN_BUCKET.put(key, response.body, {
        httpMetadata: { contentType }
      });

      return new Response(JSON.stringify({
        success: true,
        key,
        size: response.headers.get('content-length')
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  }
};
