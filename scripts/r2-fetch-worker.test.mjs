// End-to-end tests for the r2-fetch-worker (SSRF-protected URL→R2 proxy).
//
// Critical security guarantees pinned:
//   - Bearer auth required (iteration 1)
//   - URL host must be on a static allow-list (iteration 1, fixes original SSRF)
//   - URL must be https:// only
//   - Destination R2 key must match the allow-list
//   - Upstream errors don't leak / panic

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import worker from './r2-fetch-worker.js';

const SECRET = 'test-secret-32-bytes-of-entropy-aaaa';

function bearer(secret = SECRET) {
  return { Authorization: `Bearer ${secret}` };
}

function makeMockBucket() {
  const puts = [];
  return {
    puts,
    put: vi.fn(async (key, body, opts) => {
      puts.push({ key, body, contentType: opts?.httpMetadata?.contentType ?? '' });
      return { key };
    }),
  };
}

function makeEnv(secret = SECRET) {
  return {
    CDN_BUCKET: makeMockBucket(),
    UPLOAD_SECRET: secret,
  };
}

function makePostRequest(payload, headers = bearer()) {
  return new Request('https://upload.komplexaci.cz/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

describe('r2-fetch-worker: method routing', () => {
  it('rejects non-POST methods', async () => {
    const env = makeEnv();
    for (const method of ['GET', 'PUT', 'DELETE', 'OPTIONS']) {
      const res = await worker.fetch(new Request('https://x.com/', { method }), env);
      expect(res.status).toBe(405);
    }
  });
});

describe('r2-fetch-worker: auth', () => {
  it('rejects request without Authorization header', async () => {
    const req = makePostRequest({ url: 'https://myrient.erista.me/x', key: 'roms/ps1/x.zip' }, {});
    const res = await worker.fetch(req, makeEnv());
    expect(res.status).toBe(401);
  });

  it('rejects request with wrong Bearer secret', async () => {
    const req = makePostRequest({ url: 'https://myrient.erista.me/x', key: 'roms/ps1/x.zip' }, bearer('wrong'));
    const res = await worker.fetch(req, makeEnv());
    expect(res.status).toBe(401);
  });

  it('rejects when UPLOAD_SECRET is unset on the server', async () => {
    const req = makePostRequest({ url: 'https://myrient.erista.me/x', key: 'roms/ps1/x.zip' });
    const res = await worker.fetch(req, makeEnv(''));
    expect(res.status).toBe(500);
  });

  it('rejects when UPLOAD_SECRET is too short (< 16 chars)', async () => {
    const req = makePostRequest({ url: 'https://myrient.erista.me/x', key: 'roms/ps1/x.zip' });
    const res = await worker.fetch(req, makeEnv('tooshort'));
    expect(res.status).toBe(500);
  });
});

describe('r2-fetch-worker: body parsing', () => {
  it('rejects malformed JSON', async () => {
    const req = makePostRequest('{not valid json');
    const res = await worker.fetch(req, makeEnv());
    expect(res.status).toBe(400);
  });
});

describe('r2-fetch-worker: URL host allow-list (the SSRF fix)', () => {
  beforeEach(() => {
    // Stub fetch — these tests should reject BEFORE the upstream fetch happens.
    vi.stubGlobal('fetch', vi.fn(async () => new Response('should not have been called')));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const blockedUrls = [
    'http://myrient.erista.me/x',           // http:// rejected, only https
    'https://attacker.com/x.zip',           // not on allow-list
    'https://attacker.com/?host=myrient',   // can't trick via query string
    'https://localhost/x',                  // not on allow-list
    'https://192.168.1.1/x',                // not on allow-list
    'https://internal.cluster.local/x',     // not on allow-list
    'https://x@myrient.erista.me.attacker.com/x',  // hostname is the attacker domain
    'ftp://myrient.erista.me/x',            // wrong scheme
    'file:///etc/passwd',                   // wrong scheme
    'javascript:alert(1)',                  // not a valid URL anyway
    '',                                     // empty
    'not a url',
  ];

  for (const url of blockedUrls) {
    it(`rejects ${JSON.stringify(url)}`, async () => {
      const req = makePostRequest({ url, key: 'roms/ps1/foo.zip' });
      const env = makeEnv();
      const res = await worker.fetch(req, env);
      expect(res.status).toBe(400);
      expect(env.CDN_BUCKET.put).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  }

  it('accepts the documented allow-listed hosts', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('rom-bytes', {
      status: 200,
      headers: { 'content-type': 'application/zip', 'content-length': '9' },
    })));

    for (const host of ['myrient.erista.me', 'archive.org']) {
      const env = makeEnv();
      const req = makePostRequest({ url: `https://${host}/path/to/file.zip`, key: 'roms/ps1/foo.zip' });
      const res = await worker.fetch(req, env);
      expect(res.status).toBe(200);
      expect(env.CDN_BUCKET.put).toHaveBeenCalledTimes(1);
    }
  });
});

describe('r2-fetch-worker: key allow-list', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('rom-bytes', { status: 200 })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const badKeys = [
    'games.json',                        // not under allowed prefix
    'evil.html',
    'roms/game.exe',                     // disallowed extension
    'roms/../bios/scph5501.bin',         // ../ literally in body
    '/roms/ps1/foo.zip',                 // leading slash
    '%2e%2e/etc/passwd',
    'roms\0/ps1/foo.zip',                // NUL
    '',
  ];

  for (const key of badKeys) {
    it(`rejects key ${JSON.stringify(key)}`, async () => {
      const req = makePostRequest({ url: 'https://myrient.erista.me/x', key });
      const env = makeEnv();
      const res = await worker.fetch(req, env);
      expect(res.status).toBe(400);
      expect(env.CDN_BUCKET.put).not.toHaveBeenCalled();
    });
  }
});

describe('r2-fetch-worker: upstream error handling', () => {
  it('returns 502 when upstream fetch fails (non-2xx)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not found', { status: 404 })));
    const req = makePostRequest({ url: 'https://myrient.erista.me/missing.zip', key: 'roms/ps1/foo.zip' });
    const env = makeEnv();
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(502);
    expect(env.CDN_BUCKET.put).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('returns 500 (no internal leak) when upstream throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('SECRET_DETAIL_should_not_leak'); }));
    const req = makePostRequest({ url: 'https://myrient.erista.me/foo.zip', key: 'roms/ps1/foo.zip' });
    const env = makeEnv();
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).not.toContain('SECRET_DETAIL_should_not_leak');
    vi.unstubAllGlobals();
  });
});

describe('r2-fetch-worker: happy path', () => {
  it('streams upstream body to R2 with correct key + content-type', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('rom-bytes', {
      status: 200,
      headers: { 'content-type': 'application/zip', 'content-length': '9' },
    })));

    const env = makeEnv();
    const req = makePostRequest({
      url: 'https://myrient.erista.me/path/to/file.zip',
      key: 'roms/ps1/foo.zip',
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    expect(env.CDN_BUCKET.put).toHaveBeenCalledTimes(1);
    expect(env.CDN_BUCKET.puts[0].key).toBe('roms/ps1/foo.zip');
    expect(env.CDN_BUCKET.puts[0].contentType).toBe('application/zip');

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.key).toBe('roms/ps1/foo.zip');
    vi.unstubAllGlobals();
  });
});
