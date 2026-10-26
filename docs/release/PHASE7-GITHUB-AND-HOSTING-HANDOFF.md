# Phase 7 GitHub and hosting handoff

## GitHub status and public payload

Target: https://github.com/khushdeepAnand/Banaras-Diwali-Mela-
Remote: `https://github.com/khushdeepAnand/Banaras-Diwali-Mela-.git`, branch `main`.
The repository was confirmed empty using both `git ls-remote` and
`gh repo view --json isEmpty,defaultBranchRef,nameWithOwner,url` before initialisation.
Local Git was initialised only inside the new Phase 7 working copy. Original inputs
were not modified. The final commit/push receipt is recorded below after verification.

### Verified first-push receipt

Initial application commit: `ba9b6f9db5ff4cd46acc495a9d5375ce0d677714`.
Normal `git push -u origin main` succeeded with configured local credentials after
all local gates. An immediate pre-push `git ls-remote origin` again returned no refs.
Remote `refs/heads/main` matched that exact SHA after pushing. No force-push, remote
overwrite, credential URL, hosting deployment or production change was performed.

GitHub's recursive tree API confirmed **417 files**, matching the scanned local
Git payload exactly, not a truncated tree. Root structure: `.gitignore`, `.opencode`,
`README.md`, `backend`, `docs`, `frontend`, `scripts`. Source, tests, both lockfiles,
both SQL migrations and safe examples are present; forbidden/private/generated/env
paths are absent. The exact payload and built frontend passed credential scanning.
A subsequent documentation-only receipt commit records this result without rewriting
the initial commit. Use `git rev-parse HEAD` and `git ls-remote origin refs/heads/main`
to identify that final receipt commit; its actual SHA is also included in the delivery
message. This avoids an impossible self-referential commit hash inside its own text.

Only intended public source, tests, SQL migrations, assets, documentation, lockfiles
and safe `.env.example` files belong in Git. `.gitignore` excludes real env files,
private folders/owner images, archives, dependencies, builds, browser artifacts and
caches. `python scripts/github_safety.py` scans the exact Git payload using the
release scanner, verifies source/migrations and tests ignore rules. No scanner can
prove the absence of every possible secret; review any future assets before staging.

### Public asset review

- `backend/assets/donation-paytm-qr.png` is the previously owner-approved public
  crop, SHA-256 `3d0887baef035c36ad1fb8ca4a404a96975abd4c81e393ee6a2a6e35d8776f14`.
  It is intentionally public, not a secret. Original posters, profile images and
  raw owner reports are not included. Existing hash/recipient/payment guards remain.
- Audio licences, attribution URLs and original-composition records remain in
  `frontend/public/audio/CREDITS.md`, the manifest and audio provenance report.
- Public gallery and historical screenshots are application/UI evidence; owner-only
  `organiser-*` images and `private/` directories are excluded. No new personal images
  were introduced. Historical technical reports contain no runtime credentials.
  Two live synthetic business-record references and their correlation marker were
  redacted from the public historical Phase 13 report. Originals remain in the
  untouched Phase 6 baseline; no live records were altered.
- This repository has no supplied project-wide open-source licence. Do not infer
  redistribution rights from GitHub visibility. Bundled third-party terms still apply.

## Required architecture, not a deployment

The existing portal is `https://banarasdiwalimela.kesug.com`. The supplied InfinityFree
dashboard and HTTPS URL do **not** establish Node, reverse-proxy, hostname control
or WebSocket support. No hosting account was accessed and no panel/DNS/TLS setting
was changed. Do not upload the repository root, backend secrets or source ZIP into
a public document root.

Source-confirmed topology:

- Vite build: `frontend/dist` at an approved origin's `/`, BrowserRouter without basename.
- Express build/entry: `backend/dist/server.js`, `npm start`, health `/api/health`.
- Native WebSocket upgrade: `/api/room-socket`, owned by the same Node HTTP server.
- REST prepends public `VITE_API_BASE_URL` before `/api`; blank is recommended.
- WS derives protocol/host from the page independently of the REST variable.
- Development `API_PROXY_TARGET` is not a production proxy or CORS solution.
- Four humans per in-memory room, one process/worker/replica, reconnect reservation
  20 seconds. Restart loses rooms and session inventory; browser stamps remain local.

Prefer a dedicated game hostname at `/`, conditional on actual owner/provider control.
Do not assume `game.banarasdiwalimela.kesug.com` is available. If this plan cannot run
Node and same-origin WS upgrades, approve a separate capable game host and link to it
from the portal. PHP/static hosting alone cannot run this backend. Do not silently
mount at `/mela/`; router, asset base and API/socket prefixes need coordinated testing.

## Owner hosting-panel checklist

These are the steps to perform **after separate deployment approval**. Exact panel
labels beyond the supplied screenshot remain provider-dependent.

1. Open the existing InfinityFree account and select this portal account. Record its
   provider plan and document root privately. Back up current public files/config.
2. Ask provider support whether this exact plan permits a persistent supported Node
   process, port binding, one worker, restarts, HTTP/1.1 WebSocket upgrades, proxy
   routing, heartbeat-compatible idle timeouts, and private environment injection.
   File Manager, Website Builder and Script Installer do not answer these questions.
3. Investigate the dashboard's subdomain/DNS warning with support. Confirm hostname
   ownership and available DNS records without changing them. Do not click a DNS
   repair/setup action until its exact impact is approved.
4. If unsupported, stop. Select an approved Node-capable game host; leave the existing
   portal intact. Confirm its static and API/WS routes can share one HTTPS origin.
5. On the approved host, configure one persistent backend process with host-injected
   private runtime variables, an unprivileged working directory, log redaction and
   graceful restart. Build both apps with their lockfiles. Deploy backend `dist`,
   package files/dependencies and `backend/assets/donation-paytm-qr.png` outside the
   public document root. Use Node 24 compatible with the existing toolchain.
6. Use File Manager only for the approved static document root: upload the **contents**
   of `frontend/dist`, not its parent project. Keep an atomic rollback copy privately.
   If this portal root is still serving another site, do not overwrite it: use the
   separately approved game origin instead.
7. Configure static SPA fallback to `/index.html` for frontend routes only. Missing
   `/api/*`, `/assets/*`, `/audio/*` and `/gallery/*` must not return index HTML.
   Apache `.htaccess` can implement static fallback only if enabled; it does not add
   a persistent Node process or WS proxy. Confirm provider support first.
8. Configure TLS for the approved game origin; proxy `/api/*` to the one Node owner.
   Preserve browser Origin and WS Upgrade/Connection headers, use upstream HTTP/1.1,
   disable socket buffering and protect upstream direct access. Set trusted proxy
   hops to the actual chain only. HTTPS pages must use WSS, not mixed-content WS.
9. Serve WAV/MP3 with correct MIME and range responses; cache hashed assets immutably,
   revalidate HTML and unversioned media, never cache auth/API/socket responses.
   Test CSP with same-origin assets/WS and blob previews; do not allow arbitrary scripts.
10. Verify below. Only then add an ordinary labelled game link in the portal. Do not
    use Website Builder to replace the existing portal or silently embed an iframe.

Conditional Apache static-root example (review provider support and existing rules
before applying; this does not configure an API/WS proxy):

```apache
RewriteEngine On
RewriteRule ^(?:api|assets|audio|gallery)(?:/|$) - [L]
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^ index.html [L]
```

The approved `/api` proxy must be configured separately and take precedence over
static fallback. Without that capability, stop rather than claiming multiplayer
deployment. Do not paste these rules over an unrelated portal's `.htaccess`.

## Environment names, never real values

Backend: `PORT`, `NODE_ENV`, `DEMO_MODE`, `TRUST_PROXY_HOPS`, `REALTIME_ORIGINS`,
`SUPABASE_URL`, `SUPABASE_SECRET_KEY` (preferred) or `SUPABASE_SERVICE_ROLE_KEY`
(legacy alternative), `ADMIN_API_TOKEN`, `GROUP_DIYA_THRESHOLD`, `GROUP_DIYA_WINDOW_MS`.
Optional management-only `SUPABASE_ACCESS_TOKEN` is not needed at runtime.
Public frontend build: `VITE_API_BASE_URL` only. Local dev/test: `API_PROXY_TARGET`.
No server key or organiser token belongs in a `VITE_` variable.

Production requires persistent Supabase commerce and organiser authentication; demo
storage is rejected. Configure existing project privately. Inspect migration state;
apply 001 only if absent, then 002, never rerun 001 after 002. No Phase 7 schema
change is required. Live auth/RLS/storage verification needs separate approval.
Do not modify donation recipient, QR, payment flags or live configuration during setup.

## Verification templates

Local, from each app: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`.
Frontend: `npm run test:e2e`. Root: Python release tests and Git payload scan.
After authorised deployment, replace the placeholder with the approved game host:

```powershell
$game = 'https://APPROVED-GAME-HOST'
curl.exe --fail --silent --show-error "$game/api/health"
curl.exe --fail --head "$game/"
curl.exe --fail --head "$game/audio/river-loop.wav"
curl.exe --fail --dump-header - --range 0-1023 --output NUL "$game/audio/temple-deeparadhana.mp3"
```

Health 200 is process liveness, not payment/storage readiness. Inspect browser Network
for WSS 101 at `/api/room-socket`; test four-person capacity, fifth rejection,
room isolation, invitation confirmation, reconnect, appearance and private inventory.
Three successful distinct-session diya offerings must produce one shared group cue.
Test emote spam/expiry, storage reset/failure, touch rangoli and actual PNG exports.
Check no mixed content, secrets or private room details enter exports. Test actual
phone sharing/audio/downloads separately; desktop automation is not phone certification.

## Safe Git commands and reconciliation

If push is blocked, rerun the payload scan and all gates before:

```powershell
git remote get-url origin
git ls-remote origin
gh repo view khushdeepAnand/Banaras-Diwali-Mela- --json isEmpty,defaultBranchRef,nameWithOwner,url
git status --short
git push -u origin main
git rev-parse HEAD
git ls-remote origin refs/heads/main
gh api repos/khushdeepAnand/Banaras-Diwali-Mela-/contents --jq '.[].name'
```

Do not run the push if remote has unexpected content. Fetch and inspect its history
before reconciling; never force-push or overwrite remote work. Use configured keyring
credentials or `gh auth login` locally; never paste tokens into chat or a remote URL.

## Rollback and remaining gates

Keep approved prior frontend/backend artifacts and unchanged Phase 6 ZIP. Drain/stop
the new process, restore prior artifacts and approved configuration, restart one Node
owner behind unchanged routes. Announce transient room/inventory reset. Phase 7 adds
no database migration. The local journey key is independent; older clients ignore it.
Never use deployment rollback to change donation enablement/recipient values.

Blocked pending provider confirmation: exact plan/process/WS/proxy/hostname/TLS
capabilities and the dashboard DNS warning. Also pending: owner-approved host and
deployment, private production organiser/Supabase checks, actual-phone native sharing,
audio, sustained GPU/thermal testing and physical bank-app QR review. No production
hosting, DNS, TLS, portal, database or payment change was made in this task.
