# Website integration plan — approval required, not deployed

**Phase 8 update:** the current prepared topology is a single Render Node service
serving frontend/API/WS via explicit `SERVE_FRONTEND`, with a strictly isolated
`STAGING_DEMO` production-runtime opt-in. No public deployment is claimed. Use
`PHASE8-STAGING-RUNBOOK.md` and `PHASE8-ROLLBACK-PLAN.md` for current steps; the
Phase 6 source description below remains historical. InfinityFree/portal/DNS remain
unchanged. Ordinary production still rejects demo storage unless the new explicit
staging-only guard is enabled with no DB credentials and private organiser auth.

26 October 2026, updated for Phase 6. The user supplied the HTTPS portal URL:
`https://banarasdiwalimela.kesug.com`. Hosting provider, plan, portal technology,
account architecture and Node/WebSocket support are not confirmed. The name alone
does not establish any hosting capability or permission to create subdomains.
`melachaloge.online` remains reference-only.
Do not infer hosting from the reference site's Cloudflare beacon or reuse its DNS,
assets, backend or settings. No DNS/TLS/production credential/infrastructure change
or deployment was performed.

## Existing production entry points

- Frontend: `frontend/src/main.tsx`, React BrowserRouter and App route `/`;
  `npm run build` emits static `frontend/dist`. Vite's default base is `/`.
- Backend: `backend/src/server.ts`; `npm run build` emits `backend/dist/server.js`;
  `npm start` runs Node. `npm run start:local` explicitly loads private `.env` for
  local use; ordinary `start` expects the host's injected environment.
- One Express HTTP server also owns `ws` upgrades at **`/api/room-socket`**.
  `/api/health` is the process-liveness endpoint, not a payment/database certificate.
- Development proxy in `frontend/vite.config.ts` forwards `/api` including WS to
  `API_PROXY_TARGET` or local3001. This proxy does not exist in the production build.
- REST: `VITE_API_BASE_URL` is a public optional origin/prefix; blank means `/api`
  on the page origin. WS uses **page protocol/host and root `/api/room-socket`**,
  independently of that variable. Setting only the REST variable does not configure
  a separate WS origin or add CORS support.
- Audio uses `import.meta.env.BASE_URL` and same-origin local files. External credit
  links do not load a provider iframe or third-party audio into the game.

## Recommended initial shape: dedicated game subdomain

Use an organiser-approved hostname such as `game.YOUR-DOMAIN` (placeholder only).
Prefer a dedicated subdomain only if the provider confirms control and support.
Do not assume `game.banarasdiwalimela.kesug.com` can be provisioned. If the portal
plan cannot provide it, select an independently approved game hostname/host.
Serve frontend at `/` on that hostname. Reverse-proxy its `/api/*` HTTP and exact
room-socket upgrade path to one persistent Node process. Keep REST's public base
blank. Add the exact game HTTPS origin to `REALTIME_ORIGINS`.

The website portal can add an ordinary, labelled **Enter the free virtual mela**
HTTPS link to the approved game origin. The portal technology is unknown, so no
CMS/plugin-specific integration or live portal edit is claimed. This avoids changing React routing,
API prefixes and existing photo/download/camera controls. Do not silently embed it
in a sandboxed iframe: audio gestures, downloads, navigation/new-tab credits, CSP,
mobile viewport and accessible focus need separate testing. A simple portal link
is the safest first integration. No link has been installed in the real portal.

### Host capability gate

The host must support a **continuously running Node HTTP process with native
WebSocket upgrades**, connection idle timeout compatible with heartbeats, and
same-origin HTTPS/WSS routing. Static-only hosting or request-only serverless
functions cannot run the current room owner. Rooms are process-memory state;
four visitors per room, reconnect grace20s. Restart loses rooms and inventories.
Do not enable multiple workers/replicas/autoscaling without an approved shared
room ownership/router design. Do not claim persistent inventory from Supabase.

If the existing portal host is static-only, a separately approved persistent Node
host plus a same-origin reverse proxy is needed. Host capability is **Blocked**
until the provider/plan is supplied. No provider-specific deployment is assumed.

## Alternative: game under a path

A path such as `/mela/` is **Not implemented/verified** in the current app. Vite
asset base alone is insufficient: BrowserRouter currently has no basename, and
App matches `/`, while REST/WS deliberately use root `/api`.

Before approving a path mount:

1. Check whether the portal already owns root `/api` routes.
2. Add and test a consistent Vite base plus BrowserRouter basename, static fallback
   to `/mela/index.html`, audio paths and direct-navigation behaviour.
3. Either reserve root `/api` for this backend or implement a coordinated explicit
   REST/WS prefix on client, server, origin checks, proxy and tests. Do not rely on
   only `VITE_API_BASE_URL` or expose an arbitrary client WS endpoint.
4. Retest rooms, reconnect, assets, photo downloads, deep links and error routes.

This plan does not make those routing changes without the actual portal details.

## Reverse proxy requirements (provider-neutral)

- Static frontend with SPA fallback; correct WAV `audio/wav` and MP3 `audio/mpeg`
  content types and byte-range responses for long-track progress/seeking.
- Exact root `/api/room-socket`: HTTP/1.1 upstream, preserve WebSocket Upgrade and
  Connection headers, pass the browser Origin unchanged, and avoid buffering WS.
- Other `/api/*`: forward method/body/status without rewriting public payment
  settings or logging credentials. Set reasonable existing request/body/timeouts.
- TLS terminates at the approved proxy; browser uses HTTPS and WSS, never mixed
  content. Protect the upstream from direct public access before trusting forwarded
  headers. Forwarded proxy-hop settings must match the real chain.
- Do not cache authenticated API responses, room traffic or sensitive records.
  Cache versioned static assets; choose an invalidation strategy for unversioned
  audio filenames when changing audio content. No remote audio hotlink is needed.
- Test CSP with same-origin scripts/styles/media/WS and the existing image/blob
  photo previews. Do not add blanket third-party script or YouTube permissions.

## Environment names — never values

| Name | Visibility / purpose |
| --- | --- |
| `PORT` | Backend listener; host injects or organiser selects |
| `NODE_ENV=production` | Backend fail-closed production validation |
| `DEMO_MODE=false` | Demo records forbidden for production |
| `REALTIME_ORIGINS` | Backend exact comma-separated HTTPS browser origins, no wildcard/path/trailing slash |
| `TRUST_PROXY_HOPS` | Backend;0 unless real trusted proxy chain is established |
| `SUPABASE_URL` | Backend persistent-commerce endpoint; configured privately |
| `SUPABASE_SECRET_KEY` | Preferred backend-only secret, never Vite/browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy alternative only; conflicting aliases rejected |
| `ADMIN_API_TOKEN` | Backend-only organiser authentication, currently missing locally; supply privately before production |
| `SUPABASE_ACCESS_TOKEN` | Optional temporary management verification; not needed by runtime; do not deploy unnecessarily |
| `VITE_API_BASE_URL` | Public frontend build value; blank recommended for same-origin `/api`; never a secret |
| `API_PROXY_TARGET` | Development/test proxy only; not production routing |

No real `.env` ships in the ZIP. Existing credentials were not changed. The later
owner-authorised Paytm replacement now matches the intended UPI ID; see
`DONATION-PAYTM-REPLACEMENT-20261026.md`. Deploy `backend/assets/donation-paytm-qr.png`
beside the built backend, not inside dist. Its SHA256 is checked server-side and
again before the client displays it. Never substitute an unchecked image or infer
bank settlement from QR matching, HTTPS, credentials or a submitted reference.

## Approval, build and verification sequence

1. Organiser confirms provider/plan, portal technology, intended game host/path,
   deployment access scope, proxy topology and rollback owner. No secrets in chat.
2. Review this plan against that host. Obtain explicit deployment approval.
3. In both apps: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`.
   Frontend: `npm run test:e2e -- e2e/phase5.spec.ts e2e/phase4.spec.ts e2e/phase2.spec.ts e2e/phase3.spec.ts e2e/donation-redesign.spec.ts`.
   Use isolated test servers, not production records, for automated tests.
4. Upload static `frontend/dist` to the approved static origin. Run built backend
   using host-injected production variables and `npm start`. Configure the approved
   persistent process, shutdown/restart and reverse proxy; do not expose server keys.
5. Verify public `/api/health`, local/static/audio assets, byte ranges, HTTPS/WSS
   upgrade101, exact Origin rejection, four-player capacity, isolation, reconnect,
   appearance, gifts/offerings/fountain and no mixed content or leaked values.
6. Verify fresh-load silence, actual physical-phone audio gesture/resume/mute,
   quiet mix/headphones, background/foreground/manual resume, credits, missing
   assets, camera/photo and touch layout. Avoid real payment transactions.
7. Independently validate live storage/auth without changing schema or payment
   settings unless separately authorised. Health200 does not prove persistence.
8. Record deployed URLs, approved build hash and actual results before claiming
   deployment. This task prepares that evidence format but does not deploy.

## Rollback

Keep the untouched Phase 5 ZIP and any approved deployed build privately identifiable.
Stop/drain the new Node owner, restore previous static/backend artifacts, restore
the prior approved non-secret configuration and restart behind the same HTTPS/WSS
routes. Expect transient room/inventory loss and tell visitors to rejoin. No
database rollback is required for Phase 6: no migrations or live writes were made.
Do not restore unverified donation flags or replace the intended recipient.

## Current decision

**Implemented:** local radio/ambience preparation and integration audit.
**Blocked:** actual host/domain/Node capability confirmation and organiser token.
**Not implemented:** path-mounted routing, provider-specific infrastructure, DNS/TLS
changes or deployment. **Approval required** before all production work.

## Phase 6 verification commands (templates, not executed against production)

After separate deployment approval, replace the placeholder with the approved
game origin. These read-only probes do not establish payment or database readiness:

```powershell
$game = 'https://APPROVED-GAME-HOST'
curl.exe --fail --silent --show-error "$game/api/health"
curl.exe --fail --silent --show-error "$game/api/public-config"
curl.exe --fail --head "$game/"
curl.exe --fail --head "$game/audio/river-loop.wav"
curl.exe --fail --head "$game/audio/om-navashivam.mp3"
curl.exe --fail --dump-header - --range 0-1023 --output NUL "$game/audio/temple-deeparadhana.mp3"
```

Expect health 200 with `data.status` equal to `ok`; inspect runtime mode separately
in public-config (health itself does not return mode). Expect HTML at `/`, WAV `audio/wav`, MP3
`audio/mpeg`, and an actual 206/Content-Range for media range requests. Verify
`/?room=VALID-CODE` opens the same SPA with a validated, unconnected invitation;
the ten-character code shown is public room access, not organiser authentication.

From a browser at the approved game origin, use Together to create a disposable
test room. Browser Network must show **101** for `/api/room-socket` using **wss:**.
Test an independently opened invitation, four-human capacity, fifth rejection,
isolation, reconnect within 20 seconds and rejection of an unapproved Origin.
Do not print handshake payloads or resume tokens. Clear the test rooms by leaving.

Source verification: `commerceApi.ts` builds `${VITE_API_BASE_URL}/api${path}`.
The variable is an optional origin/prefix **before** `/api`, not the complete API
endpoint. Blank is recommended. `useRoom.ts` independently uses page origin and
root `/api/room-socket`; there is no production Vite proxy, Express static mount,
automatic CORS layer or alternate WS-origin environment variable.

Serve hashed `/assets/*` with long immutable caching and Brotli/gzip negotiation.
Serve index HTML with revalidation; do not cache API/auth/socket responses. Audio
and gallery filenames are not content-hashed: use revalidation or short lifetimes
and explicit invalidation, not immutable caching across replacements. Avoid double
compressing already compressed media. Verify cache headers at the actual host.

Provider gate: static SPA/query fallback; persistent supported Node runtime;
single worker/replica; port binding; process restart/log redaction; TLS certificate
for approved hostname; HTTPS-to-Node routing; HTTP/1.1 WS upgrades and heartbeat
idle limits; correct Origin forwarding; configured trusted proxy hops; media range
support/MIME; injected private runtime variables; atomic artifact rollback.
Static PHP-only plans or short-lived serverless invocations alone cannot own rooms.

See `PHASE6-WEBSITE-READINESS.md` for current confirmed versus blocked status.
