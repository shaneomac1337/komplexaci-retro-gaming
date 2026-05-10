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

## Dependency advisories — triage

`npm audit` will surface advisories. Production runtime (the bundle
shipped to browsers) was hit by **one** real one — already patched:

- `@remix-run/router` < 1.23.2 — *React Router XSS via Open Redirects*
  (GHSA-2w69-qvjg-hvjx, CVSS 8.0). Fixed by bumping `react-router-dom`
  to 6.30.3 (`@remix-run/router` 1.23.2). Already applied to
  `package-lock.json`.

The remaining advisories are **dev / build tooling only** and do not
ship to end users:

| Package | Severity | Why it doesn't reach production |
|---|---|---|
| `vite` | HIGH (path traversal, fs.deny bypass, WS file read) | Affects only the dev server (`npm run dev`). Never expose `localhost:5173` on a public network. |
| `undici` (via `wrangler` / `miniflare`) | HIGH (smuggling, CRLF, etc.) | Wrangler is a CLI you run locally; not on the request path of any production Worker. |
| `esbuild` (via `wrangler`) | MODERATE (dev server CORS) | Bundled with wrangler dev, same scope. |
| `picomatch` | HIGH (glob mismatch, ReDoS) | Build-time glob matching only. |
| `postcss` | MODERATE (CSS Stringify XSS) | Only triggers on attacker-controlled CSS strings at build time — none here. |
| `brace-expansion` | MODERATE (ReDoS) | DOS class, build-time. |
| `uuid@13` | MODERATE (v3/v5/v6 buffer bounds) | Package is in `package.json` but never imported in `src/`; even if it were, only v3/v5/v6 generation is affected. |

Cleanups (optional, all require breaking-change `--force` upgrades):

```sh
# Force upgrade to vite 8 / wrangler 4.85 / uuid 14 — review changelogs first:
npm audit fix --force
```

If you don't actively use a deployed `r2-uploader` Worker, deleting it
also removes the wrangler/miniflare dev-tooling exposure (you'd no longer
need `wrangler` installed at all):

```sh
npx wrangler delete --name r2-uploader
npx wrangler delete --name komplexaci-upload-proxy
npm uninstall wrangler
```

## Ongoing automated defense

Five GitHub Actions workflows in `.github/workflows/` keep the repo's
security posture from drifting:

| Workflow | Triggers | Catches |
|---|---|---|
| `security.yml` | every push/PR + Mon 06:00 UTC | new dep CVEs, unsigned packages, type errors, lint warnings |
| `codeql.yml` | every push/PR + Mon 07:00 UTC | DOM XSS, open redirects, path injection, insecure crypto |
| `gitleaks.yml` | every push/PR | accidentally committed secrets (only scans the diff so historical strings don't keep firing) |
| `scorecard.yml` | push to master + Tue 06:00 UTC | OpenSSF security best-practice scoring (branch protection, pinned actions, etc.) |
| `dependabot.yml` (bot config) | weekly Mon 06:00 Europe/Prague | auto-PRs new versions of npm + GitHub Actions; security workflow then verifies the bumped lockfile |

All actions in those workflows are pinned to immutable commit SHAs (with
the version comment kept fresh by Dependabot) so a malicious retag of an
upstream action can't silently land in CI.

## harden-runner: audit → block transition

`step-security/harden-runner` currently runs in `egress-policy: audit`
on all four workflows. That mode logs every outbound network connection
the runner makes (npm registry, action downloads, sigstore, GitHub API,
etc.) without blocking anything. Switching it to `block` would refuse
any destination not on a static allow-list — strong supply-chain
defense, but breaks the workflow if the allow-list is incomplete.

The intended transition:

1. Let the workflows run on master + cron for ~2 weeks. Each run records
   its actual egress destinations to the StepSecurity dashboard at
   `https://app.stepsecurity.io/github/<org>/<repo>/actions/runs/<run-id>`
   (linked from the **Harden Runner** tab on each workflow run).

2. Open the dashboard and copy the captured destinations into a
   per-workflow `allowed-endpoints` value, e.g.:

   ```yaml
   - uses: step-security/harden-runner@a5ad31d6...  # v2.19.1
     with:
       egress-policy: block
       allowed-endpoints: >
         api.github.com:443
         registry.npmjs.org:443
         github.com:443
         objects.githubusercontent.com:443
         # ...
   ```

3. Push and watch the run. If a legit step now fails because its host
   isn't on the list, add it. Once the run is green, `block` is in
   effect and a future malicious dep trying to phone home to a
   non-listed destination is silently denied.

Doing this only matters once the workflows have meaningful trust
(e.g. running on PRs from outside contributors) — for the current
single-maintainer setup, the audit-mode visibility alone is enough.

## Browser response headers

`vercel.json` sets the following defense-in-depth headers on every
response served from the Vercel edge:

| Header | Value | What it does |
|---|---|---|
| `Cross-Origin-Opener-Policy` | `same-origin` | Required for SharedArrayBuffer (EmulatorJS threading); also isolates the browsing context. |
| `Cross-Origin-Embedder-Policy` | `credentialless` | Same — required for SAB. |
| `X-Content-Type-Options` | `nosniff` | Prevents browsers from MIME-sniffing responses (defense against script-injection via `Content-Type` confusion). |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Don't leak the full URL (incl. query) to third parties. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Lock the browser to HTTPS for one year. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` | Disable unused powerful APIs by policy. |

A `Content-Security-Policy` is **not** set. EmulatorJS loads JS from
`cdn.emulatorjs.org`, instantiates WASM from blob URLs, uses inline
styles, and pulls cores/BIOS/ROM bytes cross-origin. Writing a CSP
strict enough to add value but lax enough not to break the emulator
takes careful per-route work (the play page would need a different
policy than browse/home). If/when added, start with report-only
(`Content-Security-Policy-Report-Only`) and watch the violations
before enforcing.

