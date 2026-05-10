# Security

## Reporting a vulnerability

If you believe you've found a security issue in this repository, please
**do not** file a public GitHub issue. Instead:

- Open a [private security advisory](https://github.com/shaneomac1337/komplexaci-retro-gaming/security/advisories/new)
  on this repository, **or**
- If you don't have a GitHub account, use GitHub's responsible-disclosure
  channel.

Include enough information to reproduce: affected file/route, the request
or input that triggers the issue, and the observed behavior. A proof-of-
concept is helpful but not required.

I'll acknowledge receipt within a few days and keep you updated as the fix
progresses.

## What's in scope

- The application code in this repository (`src/`, `workers/`, `scripts/`)
- The deployed site at `komplexaci.cz` (and subdomains)
- The Cloudflare Workers at `upload.komplexaci.cz` and
  `r2upload.komplexaci.cz` (auth required for writes — see
  [`workers/SECURITY.md`](workers/SECURITY.md))

## What's out of scope

- The third-party emulator runtime served from `cdn.emulatorjs.org`
  (report upstream to [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS))
- ROMs, BIOS files, and game cover images served from
  `cdn.komplexaci.cz` (these are read-only public content)
- Denial-of-service / rate-limit issues (handled at the Cloudflare edge)
- Self-XSS / clickjacking on the dev server (`npm run dev` is for
  local use only and never exposed publicly)

## Engineering details

For Cloudflare Worker auth, the R2 key allow-list, response headers,
and dev-tooling dependency triage, see
[`workers/SECURITY.md`](workers/SECURITY.md).

The CI workflow in [`.github/workflows/security.yml`](.github/workflows/security.yml)
runs `npm audit`, `tsc`, and `eslint` on every push, PR, and weekly
schedule against `master`.
