# Worker security model

All three Workers in this repo (`r2-uploader`, `upload-proxy`, and the
`scripts/r2-fetch-worker.js` deployed via `scripts/wrangler-uploader.toml`)
write to the **same** production R2 bucket `komplexaci-media` and are bound
to **public** Cloudflare routes:

| Worker | Route |
|---|---|
| `workers/r2-uploader` | `upload.komplexaci.cz/*` |
| `workers/upload-proxy` | `r2upload.komplexaci.cz/*` |
| `scripts/r2-fetch-worker.js` | `upload.komplexaci.cz/*` (conflicts with the above; pick one) |

Because all three share the bucket the public CDN (`cdn.komplexaci.cz`) serves
from, the **weakest endpoint is the bucket's effective security level**.

## What changed

Prior versions had two hard-fail issues:

1. `r2-uploader` had **no authentication at all**. Anyone on the internet
   could PUT/DELETE/GET arbitrary R2 keys.
2. `upload-proxy` used a **hardcoded secret** (`komplexaci-upload-2024`) that
   was committed to the repo and easy to guess.

The current code:

- Authenticates every non-OPTIONS / non-`/health` request against an
  `UPLOAD_SECRET` Wrangler secret (constant-time compared, fail-closed if not
  configured).
- Rejects R2 keys that don't match an allow-list (`roms|bios|covers|saves`
  prefix, only known content extensions, no `..` / NUL / `%2e%2e`).
- Caps simple-PUT bodies at 4 GiB (multipart parts are R2-side capped).
- Removes the GET escape hatch from `r2-uploader` (the public CDN already
  serves reads).
- For the URL-fetch Worker, restricts source URLs to https-only and a
  hostname allow-list (`myrient.erista.me`, `archive.org`).

## Required operator actions

If you have any of these Workers deployed, you **must** rotate / set the
secret before traffic flows again:

```sh
# r2-uploader (Bearer token, sent as: Authorization: Bearer <secret>)
cd workers/r2-uploader
npx wrangler secret put UPLOAD_SECRET
# paste a 32+ byte random value, e.g. `openssl rand -hex 32`
npx wrangler deploy

# upload-proxy (sent as: X-Upload-Secret: <secret>)
cd ../upload-proxy
npx wrangler secret put UPLOAD_SECRET
npx wrangler deploy

# r2-fetch-worker (Bearer token; same scheme as r2-uploader)
cd ../../scripts
npx wrangler secret put UPLOAD_SECRET --config wrangler-uploader.toml
npx wrangler deploy --config wrangler-uploader.toml
```

If you don't actually use any of these endpoints (you've been uploading via
`wrangler r2 object put` directly, which uses your Cloudflare API auth, not
the Worker), the safest move is to delete the deployed Workers entirely:

```sh
npx wrangler delete --name r2-uploader
npx wrangler delete --name komplexaci-upload-proxy
```

That removes the public attack surface completely. R2 access via wrangler CLI
keeps working unchanged.

## Route conflict warning

`workers/r2-uploader/wrangler.toml` and `scripts/wrangler-uploader.toml` both
target `upload.komplexaci.cz/*`. Whichever was deployed most recently wins.
Pick one and delete or repoint the other before redeploying — see the route
declared in each `wrangler.toml`.

## Why these endpoints are still risky even with the secret

A Wrangler secret is a long-lived bearer token. If it leaks (accidentally
checked in, exfiltrated from CI, etc.) you have to rotate it everywhere.
Stronger options if these Workers stay long term:

- Cloudflare Access in front of the route (zero-trust JWT auth)
- Per-request signed URLs (short-lived HMAC tokens)
- mTLS with a private CA

Treat the current secret-based auth as the **minimum** baseline.
