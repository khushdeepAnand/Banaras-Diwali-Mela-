# Phase 8 staging runbook

## Current decision — strict Rs 0 disposable staging (27 October 2026)

**This section supersedes the historical paid recommendation below. NOT DEPLOYED.**
Select **`render.free.yaml`**, NOT the default `render.yaml`. The paid file is preserved
byte-for-byte for historical rollback/reference; using it is not authorised here.
No new gameplay, packages, SQL, live database, payment, portal or DNS changes.

Official docs re-read during this continuation:
- https://render.com/docs/free
- https://render.com/docs/websocket
- https://render.com/docs/blueprint-spec
- https://render.com/schema/render.yaml.json

Free native Node web services accept inbound WS on the same public HTTP port, with
managed TLS. Documented free compute is 0.1 CPU / 512 MB, single instance. This is
protocol-compatible with disposable demo staging, **not proven adequate or reliable
for this app under real host load**. Both YAML files pass the official JSON Schema;
this is not provider/account validation or a Linux deployment test.

### Mandatory no-spend gates

1. Use a free Hobby workspace with **no payment method**, no paid resources and no
   paid environment groups. If the account has billing enabled, do not provision
   until the owner supplies a genuinely non-billable account. A free instance alone
   does NOT prevent overage charges on a card-backed workspace.
2. Dashboard must show Free compute and zero payable total. Refuse card collection,
   paid account verification, compute upgrades, extra build minutes/bandwidth purchases,
   persistent disks, databases, add-ons and paid workspace upgrades. Stop and report
   if Free/Singapore is unavailable or payment is required. No fallback to paid.
3. Where available, set pipeline spend limit to zero, disable automatic upgrades and
   review usage alerts. These account settings cannot be enforced by this YAML and
   have **not** been verified in any account. Never use keepalive traffic to bypass sleep.

750 free instance hours are shared per workspace/calendar month. At exhaustion,
services suspend. Free HTTP/WS traffic consumes included bandwidth and build minutes.
With no payment method, bandwidth exhaustion suspends free services; build exhaustion
blocks new builds. With a payment method, supplementary usage may be billed: stop.
Check current dashboard allowances before creation; do not infer unlimited free usage.
High service-initiated public traffic can also cause suspension. Free rollback retains
only the two most recent previous deploys; free SSH/shell and persistent disks are absent.

### Free provisioning instructions — owner action, not performed

1. Read the no-spend gates. Connect the intended GitHub repository privately and select
   the reviewed final main commit. Create a **new** Blueprint with path
   `render.free.yaml`; the Blueprint path is customisable during setup. Do not sync
   either YAML onto an unknown existing service. Check the unique service name.
2. If the dashboard cannot use the alternative Blueprint path, create a **new free
   Node web service manually** using exactly the build/start/health/env settings from
   that file. Do not rename, substitute or select the paid default file.
3. Keep one process/instance, manual deploys and repository root. Frontend/API/socket
   share the assigned provider hostname; there is no separate static-site resource.
   Read the actual assigned HTTPS hostname in the dashboard and set REALTIME_ORIGINS
   to that exact origin, without slash, path or wildcard. It is intentionally unset
   (`sync: false`), never guessed. If creation starts an early build before assignment,
   do not regard it as approved; correct origin before the first successful start.
4. Keep NODE_ENV=production, DEMO_MODE=true, STAGING_DEMO=true, SERVE_FRONTEND=true,
   VITE_API_BASE_URL blank and TRUST_PROXY_HOPS=0. Keep generated ADMIN_API_TOKEN private,
   never in VITE variables. Remove all inherited Supabase/management/production secrets;
   omit all database credentials. Existing environment matrix below still applies.
5. Build/start/health are identical to the retained paid configuration. Port comes from
   Render; do not add workers, autoscaling, payment resources, SQL hooks or a second origin.
   Verify the pinned Node patch is still supported before public use; no pin was changed.
6. Deploy manually only after all gates pass; inspect Linux build/runtime logs. If
   memory/CPU is insufficient, free registration is unavailable, or billing is requested,
   **stop**. Do not upgrade. This preparation makes no host capacity guarantee.
7. Run the existing live checklist below (public TLS/WSS, four players/fifth rejection,
   origins, reconnect, restart, media, demo QR refusal, CSP). Test wake-from-idle and
   quota/suspension messaging too. Keep the InfinityFree portal and its files untouched
   in this phase, even after staging tests. Portal edits require separate approval.

### Sleep and recovery contract

After 15 minutes without inbound HTTP or WS messages, free services spin down; a new
HTTP/WS request wakes them, typically in about one minute. Render may restart them at
any time. Room membership, resume tokens and demo records are in memory and are lost
on process replacement; ephemeral disk writes are lost too. Existing four-player and
reconnect behaviour is unchanged: reconnect can resume only while its owner survives;
after replacement, join a fresh room. Do not promise an invitation restores a dead room.
No new persistent store or gameplay workaround is added. A free service is unsuitable
for reliable event operation/production, but can be trialled as disposable demo staging.

### Current local gate

Fresh frontend/backend checks: 65/65 and 49/49; both typechecks/builds pass. Python
checks: 8/8, including free-config policy. Compiled loopback HTTPS/WSS: 2/2 (17.3 s).
Clean-extraction offline installs, both typechecks, 65/49 tests and builds pass.
On Windows, local TLS test needs Git's OpenSSL on PATH, e.g. PowerShell:
`$env:PATH = 'C:\Program Files\Git\usr\bin;' + $env:PATH`.
No public hostname, account eligibility, zero-bill setting, Linux execution or physical
device was verified. Full historical browser suite was not rerun in this continuation.

---
## Historical first Phase 8 runbook (retained audit evidence; NOT current provisioning instructions)

Status: **prepared locally, NOT deployed**. No verified public staging URL or
deployment timestamp exists. No provider account, billing approval, CLI session or
Render/Railway API credential is available. Do not publish a speculative game link.

## Decision and current official evidence

Researched 26 October 2026. Prices are USD, subject to provider changes, taxes and
owner approval; these are not an authorised purchase or guaranteed capacity quote.

| Concern | Render | Railway |
| --- | --- | --- |
| Node/process | Native Node web service; `.node-version` supported, current default 24.22.1; persistent process | Native Express/Node via Railpack, GitHub/CLI or Docker; persistent service |
| WS/TLS | Native inbound WS, managed HTTPS/WSS; no fixed WS duration or provider connection cap, compute constrained | WS over HTTP/1.1, managed TLS 1.2/1.3; WS exempt from HTTP duration/idle limits; documented 10,000 concurrent edge connections |
| Region for India | Singapore available; proximity is a reason to choose it, not a measured India RTT | Singapore (`asia-southeast1-eqsg3a`) available; no measured India RTT |
| Recommended paid tier | Hobby workspace $0 + 0.5c-512mb compute $7/month; 1 CPU/2 GB $25 if measurements require it | Hobby $5/month including $5 usage; consumption above that billed, not a flat all-inclusive $5 service |
| Free limitations | 15-minute idle spin-down, ~1-minute wake, 750 workspace free hours/month, restarts/suspension; unsuitable for reliable session ownership | Trial $5 credit/30 days; Free $1 monthly credit, limited resources; not unlimited free hosting |
| Bandwidth/builds | Hobby: 5 GB/month then $0.15/GB; 500 standard build minutes then $5/1000; WS output counts | Services egress $0.05/GB; CPU ~$20/vCPU-month and RAM ~$10/GB-month metered by second; plan build limits vary |
| Secrets/domains | Private env UI, automatic onrender.com hostname, custom domains/TLS, Git deployment | Private variables, generated Railway hostname, custom domains/TLS, GitHub/CLI |
| Sleep/restarts | Paid compute avoids free idle sleep; maintenance/deploys still restart processes | Disable optional Serverless/app sleeping; otherwise sleep after ~5–10 idle minutes, possible initial 502 |
| Operations | Health checks, logs, restart, rollback; Hobby retains 5 builds/7-day logs per pricing page | Deployment logs, health checks, redeploy/rollback; Hobby 7-day logs; rolling instances still reset room memory |
| Limits here | Application itself caps 4 visitors/room, 32 rooms, 128 sockets; no scaling added | Same application limits; provider's higher cap does not raise them |

**Selected:** one **paid Render Node web service in Singapore**, one instance and
one Node process, serving built frontend + API + WS at a single provider hostname.
This has a predictable starting compute cost and avoids CORS, separate WS origins,
a second proxy service and speculative InfinityFree changes. Owner may approve a
different capable host later; no platform lock-in or new gameplay dependency is added.

Official references consulted:

- https://render.com/docs/web-services
- https://render.com/docs/websocket
- https://render.com/docs/free
- https://render.com/pricing
- https://render.com/docs/node-version
- https://render.com/docs/blueprint-spec
- https://render.com/schema/render.yaml.json
- https://docs.railway.com/guides/express
- https://docs.railway.com/networking/public-networking/specs-and-limits
- https://docs.railway.com/reference/regions
- https://docs.railway.com/reference/app-sleeping
- https://railway.com/pricing

Render's official JSON Schema validated `render.yaml` locally with installed
PyYAML/jsonschema. This is schema validation, not authenticated account provisioning,
region availability, actual Linux build verification or successful deployment.

## Architecture and preservation

Keep `banarasdiwalimela.kesug.com` on InfinityFree. It hosts the existing portal,
not this Node room owner. An ordinary portal link will target the verified game
origin only after staging passes. No iframe, DNS/nameserver migration or new
subdomain is assumed. A provider-generated hostname needs no portal DNS change.

Node serves `frontend/dist` only when `SERVE_FRONTEND=true`; otherwise existing API-only
behaviour remains. Build backend to `backend/dist/server.js`; run
`node backend/dist/server.js` from root or `npm start` in backend. Express binds the
provider `PORT` and owns health `/api/health` and upgrade `/api/room-socket`.
Static `/assets`, `/audio`, `/gallery` have proper MIME/range support. Missing assets,
API paths, dotfiles and source maps do not fall through to HTML. HTML revalidates;
hashed Vite assets use immutable caching. API/auth responses remain no-store.

REST `VITE_API_BASE_URL` stays blank; WS already derives page HTTPS/WSS origin.
No production Vite proxy or cross-origin CORS is required or added. SPA HTTP fallback
works, including refresh of `/?room=...`; the only supported frontend route remains
`/` with query invitations. Arbitrary new React routes are not invented by fallback.
Unmatched client routes remain outside supported navigation.

Render terminates TLS and forwards HTTP/WS to the same process. Existing Origin
validation and heartbeat remain. No automatic external HTTPS redirect is added in
Express; verify the provider's redirect/certificate behaviour after provisioning.

## Environment matrix

Use the provider's private variable interface, never public files. Sanitized template:
`deploy/staging/.env.example`. Root `.node-version` pins locally tested Node 24.18.0;
owner must review current supported security patches before public staging or production. Lockfiles
remain unchanged; tested npm is 11.16.0. Host Linux/runtime execution is not yet tested.

| Variable | Staging policy / purpose |
| --- | --- |
| `PORT` | Injected by provider (Render defaults 10000); do not expose a second listener |
| `NODE_ENV` | `production` for compiled Express runtime and production frontend build |
| `DEMO_MODE` | `true` only for disposable staging |
| `STAGING_DEMO` | New explicit opt-in, `true`; requires production runtime, DEMO_MODE=true, **no Supabase URL/key**, and private valid organiser token |
| `SERVE_FRONTEND` | New static-serving opt-in, `true`; refuses startup if frontend index is absent |
| `REALTIME_ORIGINS` | Exact verified game HTTPS origin(s), comma-separated; no wildcard/path/trailing slash |
| `ADMIN_API_TOKEN` | Host-generated random 32+ character secret; Blueprint generates 256-bit value; never print or reuse production token |
| `TRUST_PROXY_HOPS` | Conservative `0`; forwarded headers ignored until actual proxy chain/overwrite semantics are verified; shared edge IPs can share REST throttling |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Empty/absent for staging demo; remove inherited production variables or startup fails |
| `GROUP_DIYA_THRESHOLD`, `GROUP_DIYA_WINDOW_MS` | Existing bounded settings, default 3 / 30000 |
| `VITE_API_BASE_URL` | Blank public build value; never a server secret |
| `API_PROXY_TARGET` | Local Vite tests only, not a hosted production proxy |
| `SUPABASE_ACCESS_TOKEN` | Optional management-script secret, not runtime; do not put it on staging |

No existing production gate is silently weakened: without explicit STAGING_DEMO,
production still refuses demo storage and requires Supabase + organiser credentials.
Staging demo always uses ephemeral records and refuses `/api/payment-qr`. Do not enter
real contacts/payment references in public staging. Never interpret demo references as
payments. Approved QR/recipient/audio bytes are unchanged. No database migration is
created or run. A future real staging DB needs separate credentials, schema inspection,
owner approval and a separate payment-disabled configuration review before use.

`TRUST_PROXY_HOPS=0` is safe against spoofed forwarding but can reduce multi-user
submission throughput behind a shared edge. Determine the exact trusted chain with
provider support before changing it; do not assume `1` or `true`. Raw WS upgrade
limits currently use socket IP rather than Express proxy trust; monitor shared-edge
limits. This is a known operational limit, not grounds to disable rate limiting.

## Owner provisioning steps — billing approval required

1. Sign in to Render privately, confirm the paid compute/bandwidth budget and region.
   Do not send tokens through chat. Connect GitHub access to the intended repository.
2. Create a **new** Blueprint from this repository using `render.yaml`; inspect its
   exact commit before approval. Do not sync it onto an unknown existing service.
   The service is paid, Singapore, one instance, manual deploys, no DB or migration hook.
3. Select a unique staging service name. Read its assigned `.onrender.com` hostname
   from the dashboard. Set REALTIME_ORIGINS to that exact HTTPS origin before the
   first successful deploy. The Blueprint intentionally prompts instead of guessing.
4. Review every variable against the matrix. Remove inherited Supabase/management/
   production secrets. Keep the generated organiser token private. Keep manual
   deployments and a single process/instance; no autoscaling or PM2 cluster.
5. Use repository root, not backend-only root. Build command from `render.yaml`:

   ```sh
   npm ci --prefix frontend --include=dev --no-audit --no-fund && npm ci --prefix backend --include=dev --no-audit --no-fund && npm run build --prefix frontend && npm run build --prefix backend
   ```

   Start: `node backend/dist/server.js`. Health: `/api/health`. No pre-deploy SQL.
6. Deploy the reviewed commit manually; inspect build/runtime logs, without copying
   env values, tokens, socket payloads or private records into public reports.
7. Run every live gate below. Record the actual URL, commit, timestamp, results,
   host runtime versions, region and latency. A green health check alone is insufficient.
8. Only after passing, prepare the portal link. No custom domain is needed initially.
   Resolve the existing InfinityFree dashboard warning with support before any DNS
   action. Neither successful DNS resolution nor an HTTPS portal proves hostname control.

## Reproduce local gates

In each app: `npm ci --offline --ignore-scripts --no-audit --no-fund` where cache is
available, otherwise `npm ci`; then `npm run typecheck`, `npm test`, `npm run build`.
Frontend: `npm run test:e2e` (isolated Vite + demo backend, ports 5174/3101).
After both builds, frontend:
`npm run test:e2e -- --config playwright.staging.config.ts`.
The latter uses the real compiled server, port 3102, plus a loopback-only TLS proxy
on 5176. It generates an expiring self-signed certificate outside the repository;
OpenSSL is required. Certificate trust is bypassed **only** for this local test.
It is not evidence for public certificates, DNS, edge proxy behaviour or hardware FPS.

Root checks: Python release tests, `python scripts/github_safety.py` after staging,
`python scripts/audit_git_history.py`, and `npm audit --json` in both apps.
Do not run the two browser configurations simultaneously: avoid shared test-result
cleanup and resource contention. Use the exact existing room tests without weakened assertions.

## Live gates and manual verification

Set `$game` only after the owner supplies the actual approved staging origin:

```powershell
$game = 'https://ACTUAL-VERIFIED-STAGING-HOST'
curl.exe --fail --head "$game/"
curl.exe --fail --silent --show-error "$game/api/health"
curl.exe --fail --silent --show-error "$game/api/public-config"
curl.exe --fail --head "$game/?room=ABCDEF1234"
curl.exe --fail --head "$game/audio/river-loop.wav"
curl.exe --fail --head "$game/gallery/riverfront.png"
curl.exe --fail --dump-header - --range 0-127 --output NUL "$game/audio/temple-deeparadhana.mp3"
```

Confirm valid public certificate, HTTP-to-HTTPS redirect, health exactly
`{"data":{"status":"ok"}}`, demo=true, blank/disabled payment recipient, QR 404,
safe JSON errors, no source maps/dotfiles/secrets, media MIME and actual 206 ranges.
Never use `-k` or disable certificate validation for the real host.

| Gate | Local evidence | Live initial status |
| --- | --- | --- |
| Compiled homepage, invitation refresh, HTTP SPA fallback, media MIME/ranges | deployment tests / HTTPS browser tests | BLOCKED: no service |
| Public TLS certificate/redirect/custom domain | Local self-signed proxy is not proof | BLOCKED |
| Native WSS, Origin rejection, two/four clients, fifth rejection, isolation/resume | real sockets + local compiled HTTPS tests | BLOCKED |
| Restart loses ephemeral rooms/records and clients rejoin truthfully | restart unit test + existing room UI | BLOCKED; do an owner-controlled staging restart and verify fresh join |
| Welcome/loading/fallback, cameras, photo, NPCs/stalls, gifts, journey/reset, rangoli, social/group and radio | full existing suite plus compiled smoke | BLOCKED |
| QR/manual review, auth denial, validation/rate limits/privacy | backend + demo browser suites | BLOCKED; no real money |
| No critical console/network errors and measured load times | local captures/observed tests only | BLOCKED; save HAR privately/redact before sharing |
| Physical-phone touch/share/audio/thermal behaviour | No physical device supplied | NOT TESTED |
| Supabase outbound connectivity/RLS/persistence | No staging DB used | NOT TESTED; needs separate staging project/approval |
| Host logs, alerting, restart, manual rollback and budget alerts | Blueprint health path prepared | BLOCKED |

After deployment, test Chrome/Edge and a physical phone; record browser/device/network,
initial load/first-frame timings and requests rather than inferring them from bundle
size. Disable automatic deploys during QA. Rendering FPS/thermal/audio/native-share
claims require actual hardware observations. See the requirements matrix for limits.

## Portal integration

Portal source/account access is unavailable. `deploy/portal-link.html` is **inert by
default**, with a disabled staging notice and an inactive template. Back up the
existing page and stylesheet privately. In its existing entry/navigation section,
insert the scoped style and disabled notice if useful. After all live gates pass,
replace the notice with the template's anchor, substitute the verified HTTPS origin,
and remove the template wrapper. Label stays **Enter the Virtual Mela**, minimum
44px target, visible keyboard focus, same-tab navigation, no iframe or scripts.
Never publish the literal placeholder or point the public portal at failed staging.
After separate production approval, change only that anchor href to the verified
production origin. Rollback removes/restores only this addition, not the whole portal.
