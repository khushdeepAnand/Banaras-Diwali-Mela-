# Phase 6 website readiness — not deployed

26 October 2026. User portal: `https://banarasdiwalimela.kesug.com`.
Provider, plan, portal technology and control over additional hostnames are unknown.
No live configuration, DNS, TLS, hosting, database or payment change was made.

## Implemented: source-verified production architecture

- React/TypeScript entry `frontend/src/main.tsx`, BrowserRouter without basename;
  App route `/`. Vite default asset base `/`; build output `frontend/dist`.
- Express entry `backend/src/server.ts`; build `backend/dist/server.js`; `npm start`
  runs Node. Backend serves API, not frontend static files or SPA fallbacks.
- Process health `/api/health`. REST root `/api` includes public-config, stalls,
  contributions, applications, payment-qr and protected admin routes. Health is not
  proof of database/auth/payment readiness.
- Public `VITE_API_BASE_URL` is prepended before `/api`; blank means same-origin.
  `API_PROXY_TARGET` is development-only. Production requires an actual proxy.
- Native WS upgrade `/api/room-socket` on the same Node server; browser derives
  HTTPS/WSS origin from the page, independent of the REST variable.
- Four humans per room; one process owns ephemeral rooms and inventories. Resume
  reservation 20 seconds. Restart discards rooms. No multi-worker/load-balancing
  ownership support is added. Supabase commerce does not persist these sessions.
- Local audio URLs use Vite BASE_URL, supplied WAV/MP3 files under `/audio/`.
  Correct media MIME and byte ranges remain hosting responsibilities. Phase 6
  gallery is independent static `/gallery/*`, loaded only by compatibility UI.
- Backend QR asset remains `backend/assets/donation-paytm-qr.png`, beside dist,
  with unchanged byte/recipient safeguards. No real payment verification is claimed.

## Recommended topology

Portal ordinary HTTPS link to a dedicated game hostname at `/`. Use a subdomain
only if provider confirms capability and organiser approves it. Do not assume any
particular nested `kesug.com` hostname can be created. Serve static frontend and
proxy `/api/*`, including exact WS upgrade path, to **one persistent Node process**.
Terminate TLS at the approved proxy, preserve Origin and upgrade headers, restrict
upstream access and configure only verified proxy-hop trust. Keep REST base blank.

No `/mela/` support is claimed. Router basename, Vite base, REST/WS prefixes and
static fallback must be migrated/tested together under separate scope/approval.

## Environment names only

Runtime backend: `PORT`, `NODE_ENV`, `DEMO_MODE`, `REALTIME_ORIGINS`,
`TRUST_PROXY_HOPS`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (preferred) or legacy
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_TOKEN`. Conflicting secret aliases fail.
Production fails closed without persistent commerce configuration and organiser
authentication; it rejects demo storage. Public build: `VITE_API_BASE_URL`.
Development proxy: `API_PROXY_TARGET`. Optional management-only
`SUPABASE_ACCESS_TOKEN` is not required by runtime and must not ship to browsers.
No values are provided, requested in chat or included in archives.

## Tested locally versus blocked

Local typecheck, unit, build, isolated Edge/WebSocket results are recorded in
`PHASE6-IMPLEMENTATION-REPORT.md`, not inferred as production evidence.

**Blocked:** provider/plan/portal technology; approved hostname/control; persistent
Node/one-worker support; same-origin reverse proxy and WSS; certificate ownership;
timeouts/MIME/range/cache/CSP configuration; private production environment and
organiser access validation; separately approved live storage/security verification;
physical-phone audio/share/performance and organiser-supervised bank-app QR review.

**Not Implemented:** deployment, portal edits, path migration, infrastructure,
certificate/DNS edits, live database writes or payment changes. Public website
connection and native phone share are not claimed verified.

## Verification and rollback

Use the read-only health/media commands and browser 101/capacity/reconnect checklist
in `WEBSITE-INTEGRATION-PLAN.md` after approval. Build/test locally first. Verify
fresh-tab silence, invitation confirmation, fallback gallery, touch and actual PNG.
Health 200 and HTTPS do not prove every subsystem works.

Keep prior approved frontend/backend artifacts and untouched Phase 5 ZIP. Drain or
stop the new process, restore prior artifacts and approved configuration, restart
one Node owner behind unchanged routes. Inform guests rooms/inventories reset.
No schema rollback is needed: Phase 6 adds no migration or live data mutation.
