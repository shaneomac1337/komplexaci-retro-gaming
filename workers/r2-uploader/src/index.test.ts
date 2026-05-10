// End-to-end tests for the r2-uploader Worker's fetch handler.
//
// These tests exercise the full request pipeline: auth, OPTIONS preflight,
// key validation, Content-Length cap, and R2 binding interaction (mocked).
// Cover the security guarantees added across iterations 1, 8, 18.

import { describe, it, expect, vi, beforeEach } from "vitest";
import worker from "./index";

// Minimal R2Bucket mock — captures puts so tests can assert on them.
function makeMockBucket() {
  const puts: Array<{ key: string; body: unknown; contentType: string }> = [];
  const bucket = {
    puts,
    put: vi.fn(async (key: string, body: unknown, opts?: { httpMetadata?: { contentType?: string } }) => {
      puts.push({ key, body, contentType: opts?.httpMetadata?.contentType ?? "" });
      return { key };
    }),
    get: vi.fn(),
    delete: vi.fn(),
    createMultipartUpload: vi.fn(async (key: string) => ({ uploadId: "test-upload-id", key })),
    resumeMultipartUpload: vi.fn(),
  };
  return bucket;
}

const SECRET = "test-secret-32-bytes-of-entropy-aaaa";

function makeEnv(secret: string = SECRET) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CDN_BUCKET: makeMockBucket() as any,
    UPLOAD_SECRET: secret,
  };
}

function bearer(secret: string = SECRET): Record<string, string> {
  return { Authorization: `Bearer ${secret}` };
}

describe("r2-uploader: auth", () => {
  it("rejects request without Authorization header", async () => {
    const req = new Request("https://upload.komplexaci.cz/roms/ps1/foo.zip", {
      method: "PUT",
      body: "x",
      headers: { "Content-Length": "1" },
    });
    const res = await worker.fetch(req, makeEnv());
    expect(res.status).toBe(401);
  });

  it("rejects request with wrong secret", async () => {
    const req = new Request("https://upload.komplexaci.cz/roms/ps1/foo.zip", {
      method: "PUT",
      body: "x",
      headers: { ...bearer("wrong-secret"), "Content-Length": "1" },
    });
    const res = await worker.fetch(req, makeEnv());
    expect(res.status).toBe(401);
  });

  it("rejects when UPLOAD_SECRET is unset on the server", async () => {
    const req = new Request("https://upload.komplexaci.cz/roms/ps1/foo.zip", {
      method: "PUT",
      body: "x",
      headers: { ...bearer(), "Content-Length": "1" },
    });
    const env = makeEnv("");  // server misconfig
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(500);
  });

  it("rejects when UPLOAD_SECRET is too short", async () => {
    const req = new Request("https://upload.komplexaci.cz/roms/ps1/foo.zip", {
      method: "PUT",
      body: "x",
      headers: { ...bearer(), "Content-Length": "1" },
    });
    const env = makeEnv("short");  // < 16 chars
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(500);
  });
});

describe("r2-uploader: CORS preflight", () => {
  it("returns 204 + CORS headers without auth (preflight is unauthenticated by spec)", async () => {
    const req = new Request("https://upload.komplexaci.cz/roms/ps1/foo.zip", {
      method: "OPTIONS",
      headers: { Origin: "https://komplexaci.cz" },
    });
    const res = await worker.fetch(req, makeEnv());
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://komplexaci.cz");
    expect(res.headers.get("Vary")).toBe("Origin");
  });
});

describe("r2-uploader: simple PUT", () => {
  let env: ReturnType<typeof makeEnv>;
  beforeEach(() => {
    env = makeEnv();
  });

  it("rejects keys outside the allow-list", async () => {
    const req = new Request("https://upload.komplexaci.cz/games.json", {
      method: "PUT",
      body: "{}",
      headers: { ...bearer(), "Content-Length": "2" },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    expect(env.CDN_BUCKET.put).not.toHaveBeenCalled();
  });

  it("URL parser normalizes ../ before isValidKey runs (cannot escape the prefix)", async () => {
    // /roms/../bios/foo.bin gets normalized to /bios/foo.bin by `new URL()`.
    // The destination still lands inside the allow-list (bios/), so this
    // doesn't escape — but verify the captured key is the normalized one,
    // not the original.
    const req = new Request("https://upload.komplexaci.cz/roms/../bios/scph5501.bin", {
      method: "PUT",
      body: "x",
      headers: { ...bearer(), "Content-Length": "1" },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    expect(env.CDN_BUCKET.puts[0].key).toBe("bios/scph5501.bin");
    expect(env.CDN_BUCKET.puts[0].key).not.toContain("..");
  });

  it("rejects keys not under any allow-listed prefix", async () => {
    // Even after URL normalization, a key outside the allow-list is rejected.
    const req = new Request("https://upload.komplexaci.cz/etc/passwd", {
      method: "PUT",
      body: "x",
      headers: { ...bearer(), "Content-Length": "1" },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    expect(env.CDN_BUCKET.put).not.toHaveBeenCalled();
  });

  it("rejects when Content-Length is missing (iteration-8 fix)", async () => {
    const req = new Request("https://upload.komplexaci.cz/roms/ps1/foo.zip", {
      method: "PUT",
      body: "x",
      headers: bearer(),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(411);
    expect(env.CDN_BUCKET.put).not.toHaveBeenCalled();
  });

  it("rejects when Content-Length is non-numeric (iteration-8 fix)", async () => {
    const req = new Request("https://upload.komplexaci.cz/roms/ps1/foo.zip", {
      method: "PUT",
      body: "x",
      headers: { ...bearer(), "Content-Length": "abc" },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(411);
    expect(env.CDN_BUCKET.put).not.toHaveBeenCalled();
  });

  it("rejects when Content-Length exceeds the cap", async () => {
    const huge = String(5 * 1024 * 1024 * 1024);  // 5 GiB > 4 GiB cap
    const req = new Request("https://upload.komplexaci.cz/roms/ps1/foo.zip", {
      method: "PUT",
      body: "x",
      headers: { ...bearer(), "Content-Length": huge },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(413);
    expect(env.CDN_BUCKET.put).not.toHaveBeenCalled();
  });

  it("accepts a well-formed PUT and writes to R2 with the Content-Type", async () => {
    const req = new Request("https://upload.komplexaci.cz/roms/ps1/foo.zip", {
      method: "PUT",
      body: "rom-bytes",
      headers: { ...bearer(), "Content-Length": "9", "Content-Type": "application/zip" },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    expect(env.CDN_BUCKET.put).toHaveBeenCalledTimes(1);
    expect(env.CDN_BUCKET.puts[0].key).toBe("roms/ps1/foo.zip");
    expect(env.CDN_BUCKET.puts[0].contentType).toBe("application/zip");
  });
});

describe("r2-uploader: read paths NOT exposed", () => {
  it("does not handle GET for arbitrary keys (iteration-1 removal)", async () => {
    const req = new Request("https://upload.komplexaci.cz/roms/ps1/foo.zip", {
      method: "GET",
      headers: bearer(),
    });
    const res = await worker.fetch(req, makeEnv());
    // Falls through to the usage / 405 handler — point is that R2.get is never called.
    expect(res.status).toBe(405);
  });
});

describe("r2-uploader: multipart create", () => {
  it("requires auth", async () => {
    const req = new Request("https://upload.komplexaci.cz/mpu/create/roms/ps1/foo.zip", {
      method: "POST",
    });
    const res = await worker.fetch(req, makeEnv());
    expect(res.status).toBe(401);
  });

  it("validates the key", async () => {
    const req = new Request("https://upload.komplexaci.cz/mpu/create/games.json", {
      method: "POST",
      headers: bearer(),
    });
    const res = await worker.fetch(req, makeEnv());
    expect(res.status).toBe(400);
  });

  it("issues an uploadId for a valid key", async () => {
    const env = makeEnv();
    const req = new Request("https://upload.komplexaci.cz/mpu/create/roms/ps1/big.bin", {
      method: "POST",
      headers: bearer(),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const body = await res.json() as { uploadId: string; key: string };
    expect(body.uploadId).toBe("test-upload-id");
    expect(body.key).toBe("roms/ps1/big.bin");
  });
});
