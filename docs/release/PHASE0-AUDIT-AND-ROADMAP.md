# Banaras Diwali Mela — Phase 0 audit and implementation roadmap

**Audit date:** 24 October 2026. **Deadline:** before 8 November 2026; confirm launch
timezone. **Decision:** suitable development baseline, **not yet a verified public
release of the requested expanded/multiplayer experience**. Phase 1 is not authorised
or started by this report. P0 = launch safety/correctness gate; P1 = core experience;
P2 = optional polish. A feature may be deferred explicitly, never advertised as working.

## 1. Baseline, scope and evidence rules

- Project: `/Users/khushdeep/Downloads/banaras-diwali-mela`.
- Both package manifests: version `0.1.0`; README describes Phase 13. No Git metadata
  or commit: `git status --short` returned “not a git repository”.
- All **245** files in the Phase 13 archive matched the working source byte-for-byte
  before this audit. Phase 13 archive SHA256:
  `fc0e3ba6f579b44e47963358e78b1072f51ed447c2ada6773da7a06ba4d90760`.
  This establishes source identity, **not current live-database correctness**.
- Stack retained: React/TypeScript/Vite, Three/R3F/Drei; Express/TypeScript; backend
  HTTPS Supabase Data API via `fetch`, not a Supabase SDK. No WebSocket server/client,
  Supabase Realtime subscription, guest-auth service or multiplayer room schema found.
- Read both efficiency skills and relevant security/browser/release skills. All 16
  skill files and existing documentation/configuration preserved. Active security
  skill has historical assumptions (“No Supabase project exists”, Auth-based roles,
  paise model) that do not describe this shared-token, integer-rupee application;
  follow actual source and approved architecture, not those stale factual assertions.
- Only this new documentation file is added inside the project. Application source,
  tests, dependencies, lockfiles, real env file, skills, migrations and existing docs
  are not edited. Builds/tests regenerate ignored outputs only. No package install,
  SQL, production mutation, payment enablement, deployment or external-user contact.
- Phase 13 reports claim live migrations/RLS/restart persistence and disclose the
  contribution harness. Those are **historical claims**, not re-executed Phase 0 checks.
  No live Supabase requests are made in this audit: avoid metered service access and
  side effects without new approval. No private business records or secrets printed.
- Public reference homepage fetched read-only: explorable fair, stalls/activities and
  optional support are high-level inspiration only. No reference code/assets copied.

## 2. Fresh verification results

macOS; installed Node **24.22.1**, npm **11.19.1**. Commands use:

```sh
export PATH=/Users/khushdeep/.nvm/versions/node/v24.22.1/bin:$PATH
export SUPABASE_URL='' SUPABASE_SECRET_KEY='' SUPABASE_SERVICE_ROLE_KEY=''
export SUPABASE_ACCESS_TOKEN='' ADMIN_API_TOKEN='' NODE_ENV=test DEMO_MODE=false
```

These are shell-only overrides, not edits to `.env`. Browser tests explicitly start
their own demo backend on 3101 and Vite on 5174, never the existing live-connected
local server. Test mutations affect only that per-process in-memory demo store.

| Directory/check | Exact command or method | Fresh result |
| --- | --- | --- |
| backend | `npm run typecheck` | PASS |
| frontend | `npm run typecheck` | PASS |
| backend | `npm test` | PASS: 4 files, **25 tests**; local API/security and mocked transport |
| frontend | `npm test` | PASS: 14 files, **30 tests** |
| backend | `npm run build` | PASS |
| frontend | `NODE_ENV=production npm run build` | PASS; 297.59 kB entry JS, 999.57 kB lazy scene JS; warning over 500 kB |
| both | `npm ls --all --json` | PASS: no dependency problems reported |
| both | `npm audit --audit-level=low` | PASS: 0 known vulnerabilities including dev dependencies; not a security proof |
| both lockfiles | Compare package.json dependency/devDependency ranges with lockfile root | PASS; lockfileVersion=3, no range mismatch |
| root | `node scripts/smoke_backend.mjs` with credentials cleared | PASS: compiled liveness, unavailable storage, auth fail-closed, JSON 404, redacted unsafe production startup |
| frontend | `npm run test:e2e` | PASS: **30/30**, 14.7 minutes, isolated demo/Chromium/SwiftShader; no live DB writes |
| source/public assets/dist | Existing `scripts/release_zip.py` scanner, pattern + exact local secret-value comparison | PASS; 245 eligible baseline files and frontend bundle scanned; no credential exposure detected |
| baseline identity | Python ZIP SHA256 and byte comparison against working source | PASS; no changed/missing Phase 13 archived file |
| live Supabase/RLS/persistence | NOT RUN | Requires explicit live-access approval; historical report is not current proof |
| four-client/fifth-client/isolation/reconnect/photo/clothing/inventory/offering | NOT IMPLEMENTED; runtime tests NOT RUN | No such application features/tests exist |
| Safari, Firefox, physical phones/GPUs, public HTTPS/domain, real payee/QR | NOT VERIFIED | No physical/device/provider/recipient evidence supplied |

Execution notes: first frontend build inherited NODE_ENV=test and produced larger
test-mode React chunks; the explicit production rerun above is the audited output.
An initial frontend dependency-list output redirect had a mistyped temporary path;
corrected rerun passed. Neither issue changed source/dependencies. Existing Three.js
Clock/PCF shadow/CJS deprecation warnings remain; no warnings suppressed or tests weakened.
Fresh `frontend/test-results/phase8/desktop-riverfront.png` and `mobile-portrait.png`
were reviewed: scene, river/ceremony and controls render. These ignored captures are
not hardware-performance evidence and are not added to historical documentation.

## 3. Current capability inventory mapped to Phases 0–7

“Source present” is not the same as live verified. Browser verification below refers
only to the isolated baseline suite once its final result is recorded in section 2.

| Phase | Existing source/capabilities | Partial or missing | Main evidence |
| --- | --- | --- | --- |
| 0 Safety | Zod boundaries, server-only DB adapter, fail-closed production config, shared organiser bearer, input caps, no-store responses, tests/release scanner, private env excluded | No Git rollback history; live state not rechecked; no deployment proof | `backend/src/{config,app,store}.ts`, `backend/test`, `scripts/*`, `.gitignore` |
| 1 World | Procedural ghats/temples/river/diya/Aarti, scenic banks, six main stalls plus two kiosks, wheel/pendulum/ferry/cruise, desktop/touch controls, low/medium/high quality, bounded collisions/reset | No minimap/wayfinding map; distant banks decorative and not explorable; world expansion and physical-device budgets not established | `MelaScene.tsx`, `GhatArchitecture.tsx`, `GangaRiver.tsx`, `ScenicRiverfront.tsx`, `environment.ts`, `bazaar.ts` |
| 2 Multiplayer/crowds | Local player avatar; three animated Aarti priest figures, separate scene decorations | No real visitors, rooms/codes, guest IDs, presence, transport, reconnect, server movement validation, roaming NPCs or crowd collision | `Player.tsx`, `AartiScene.tsx`; complete source/dependency search, backend route inventory |
| 3 Character/photo | Fixed third-person follow camera, drag yaw/pitch, collision clearance, adaptive FOV, ride cameras, single procedural outfit | No first-person switch, selectable clothing/accessories, photo UI/export/zoom/presets. Playwright screenshots are QA output, not visitor photo capture | `Player.tsx:81–120`, `RideCamera.ts`, `App.tsx` |
| 4 Interactions | Eight approachable decorative/sample stalls, item descriptions/illustrative prices, optional published vendor kiosks; pre-existing floating diya bob/sway; scheduled fireworks with quality/reduced-motion controls | No item acquisition/inventory, distinct games/actions, flower offering, user-released downstream diya, personal firecracker/cooldown/action authority | `StallPanel.tsx`, `StallGoods.tsx`, `DiyaField.tsx:70–84`, `FireworkShow.tsx` |
| 5 Audio | One gesture-started audio element; play/pause/next/previous/volume/mute, error/autoplay fallback; original demo WAV; visual Aarti | Four playlist entries unavailable; no licensed bhajan/Aarti recordings or ambient mix. Audio README describes older hook/button labels | `useFestivalAudio.ts`, `App.tsx:152,183–194`, `frontend/public/audio/README.md` |
| 6 Optional donation | Separate closeable contribution dialog, welcome/in-world access; festival remains free; ₹21/31/51 strict references, pending manual review, organiser review; no gateway claimed | Requested new UPI not configured in source defaults/QR guard; recipient/QR unverified; no separate URL, though a panel already meets the requirement | `CommercePortal.tsx`, `commerceApi.ts`, `backend/src/{app,commerce}.ts` |
| 7 Release | Existing unit/API/E2E suites, production builds, ZIP validation tool, HTTPS runbooks, graceful shutdown | No checked-in provider/container/proxy/CI/IaC deployment config; no supplied domain/hosting details, public URL, TLS/WS/physical-device proof | `docs/phase13`, `docs/phase12/STAGING.md`, `backend/src/server.ts`, `vite.config.ts` |

Walk bounds are currently X −21..21, Z 0.7..18.5 (`environment.ts`); the broad scenic
riverfront does not imply playable streets. Floating diya X movement is a bounded
sine sway around a fixed Z, **not net downstream travel or an offering interaction**.
Only the first two published vendors map to world kiosks (`kioskStalls`); others may
appear in the directory but have no dedicated world placement. Anonymous exploration
exists without login, but this does not establish a durable guest identity.

### API/data boundary inventory

- GET `/api/health` (process liveness only), `/api/public-config` (reads DB settings),
  `/api/payment-qr` (only when payment instructions enabled), `/api/stalls`.
- POST `/api/contributions`, `/api/applications`; GET application reference requires
  matching email; POST its `/payment` requires matching email and guarded state.
- Organiser GET `/api/admin/records`, PUT `/api/admin/settings`, PATCH application
  and contribution reference: constant-time server bearer check; no client-role trust.
  Token is React memory, not local/session storage. No visitor Supabase Auth exists.
- `001_mela_commerce.sql`: settings, contributions, applications; allowed ₹ amounts,
  case-insensitive per-table UTR uniqueness, RLS and initial grants. `002` revokes
  browser/PUBLIC grants, narrows service role to SELECT/INSERT/UPDATE, adds input
  checks/indexes and metadata-only update audit table/trigger; audit API is read-only.
  No permissive browser policies or multiplayer tables defined. Input checks are
  created NOT VALID; current live validation status is not inferred from files.
- Secret/service-role keys stay backend-only. New key uses apikey, legacy fallback
  also Bearer. Conflicting aliases rejected. `NODE_ENV=production` rejects demo,
  missing DB/admin config and insecure URL. Optional management token is not runtime-required.
- Vite proxies `/api` locally; no wildcard CORS. Same-origin HTTPS proxy is the current
  production design. `VITE_API_BASE_URL` is public build-time data, never a secret.

## 4. Prioritised findings and launch gates

| ID/priority | Observed evidence and impact | Required disposition (future phase, not performed here) |
| --- | --- | --- |
| F01 **P0 before enabling donations** | `backend/src/commerce.ts:18`, migration001 seed and `app.ts:124` bundle-recipient guard use a legacy identity, not intended `shreeramdiwalemela@ptyes`. Original QR has not been independently decoded/approved. Backend defaults disabled; live value not rechecked | Phase6: organiser confirms ownership/payee and supplies approved QR/provenance; then update validated server config and QR binding deliberately. Do not merely substitute a frontend string, regenerate QR from an assumption, or rerun 001 |
| F02 **P0 secret lifecycle** | `backend/.env` is 0600, correctly ignored; nonempty temporary management-token entry remains. Its validity/revocation unknown; source/bundle scan clean | Organiser checks revocation and removes obsolete local entry; keep backend runtime secret/admin token in provider vault only. No token printed/revoked/edited in Phase0 |
| F03 **P0 claimed multiplayer scope** | No transport, room schema/auth or server state; Player is local only | Phase2 required before any four-player marketing/launch. Four rendered NPCs or four tabs with independent state are not multiplayer. Otherwise explicitly release as single-player |
| F04 **P0 launch verification** | No domain/provider configuration; current live RLS/constraints/persistence and TLS are unverified in this audit | Obtain scoped access/approval; staging first, non-destructive live metadata checks, authorise any persistence QA separately; production smoke/readiness and organiser launch approval |
| F05 **P1; P0 at material public traffic** | GET `/stalls` calls paginated `listApplications()` selecting all private rows in backend memory before filtering; `/public-config` and `/stalls` have no route throttle. Rate buckets for writes/admin are per-process/in-memory | Bound/public-project DB reads, pagination/field projection, selective published filtering, capacity tests and host/WAF limits. Avoid making commerce tables browser-readable to optimise |
| F06 **P1 performance gate** | Lazy scene ~999.57 kB minified (263.52 gzip); many individual meshes/lights; instancing and DPR caps already help. Fireworks have 11 cues × 55/92/155 points, continuously updating active bursts. No hardware baseline | Profile before expanding; budget geometry/lights/particles/avatars/NPCs, cap effects, avoid per-frame React state; physical midrange-phone test is P0 before broad mobile claim |
| F07 **P0 if donations enabled; otherwise deferred** | Uniqueness is per contribution/application table, not across both; schema does not establish cross-workflow settlement evidence; manual verification is organiser action | Reconcile across both flows, add tests and an approved minimal atomic enforcement design if reference workflow retained; never infer verified from UTR. No automatic processor exists |
| F08 **P1 review consistency** | Organiser updates perform read then full-record PATCH; concurrent reviewers can overwrite each other's state; shared token identifies backend/shared organiser, not an individual | Preserve shared-token model; document single reviewer, add version/state compare-and-set tests if concurrent review needed. Do not introduce a full auth rewrite unnecessarily |
| F09 **P1 content/claim gap** | Only original demo chime ships; four unavailable tracks; stall panels are decorative; no photo/clothes/inventory/offering/minimap | Implement explicitly approved P1 scope or label/defer honestly; obtain music rights before adding recordings |
| F10 **P1 least-privilege follow-up** | Migration002 grants settings INSERT although current runtime reads/updates an already-seeded row; audit is correctly read-only. Phase13 service-role SQL also expects that broad settings INSERT | Assess narrowing in an approved future migration/test change, not by rerunning 001 or weakening RLS; no active exposure proved from this unused service privilege |
| F11 **P1 operational/rollback** | No Git history; historical docs point to archives the user now requests removing. Existing audio README points to older hook/button. Supabase skill contains stale assumptions | New audited ZIP + intact working folder preserve current source; establish versioned off-device backup/Git with approval. Mark old docs historical; revise only in implementation phase. Private QR must never be statically hosted |

No hardcoded secret value was detected by the audited scanner. No exploitable admin
bypass was demonstrated. These are bounded audit findings, not certification against
all vulnerabilities. Applicant email+unguessable reference is the existing lookup
capability, not strong user authentication; keep URLs/query emails out of access logs.

## 5. Dependency-aware implementation plan

Estimates are **focused engineering hours**, one experienced engineer with services
available; not calendar promises. Phases1–7 total approximately **72–130 h (9–16 days)**,
plus external approval/device/hosting delays. A 2–3 day full-feature guarantee is not
credible. Preserve all existing tests/skills/assets and backend commerce boundaries.

### Phase 0 — safety baseline (this report)

- Existing/verified: source identity, installed dependency/lock consistency, fresh local
  checks and secret scan. Partial: live claims reviewed, not rerun. Missing: launch evidence.
- P0: approve scope, capture rollback baseline, classify risks; report only. Depends on
  existing project access; no new service/credential needed. Risk: running “verification”
  scripts that mutate DB or mistaking software WebGL for real hardware.
- Acceptance: new report complete, original-file hashes unchanged, fresh ZIP validates;
  deletions limited to explicitly authorised old project archives. Automated: hash/ZIP
  checks; manual: organiser reviews priorities and approves next phase. Effort: ~3–5 h.

### Phase 1 — bounded world/navigation expansion (**P1**, selective scenery **P2**; 8–16 h)

- Existing: scene/river/lighting/stalls/rides and collision helpers. Partial: readable
  labels/quality modes, scenic-but-inaccessible banks. Missing: minimap, routes and
  agreed playable expansion. Proposed modules: `environment.ts`, `bazaar.ts`,
  `MelaScene.tsx`, ghats/scenery, `App.tsx`, new navigation/minimap component and tests.
- Dependencies: approved map/performance budgets in Phase0; freeze authoritative
  walk/collision/spawn contract before Phase2. External: target phone/desktop/browser
  list, accessible-route landmarks; no paid asset purchase without approval.
- Risks: scenery outside collisions, lost ride approach, expanded camera clipping,
  extra lights/draw calls. Reuse current instancing; no scene/engine replacement.
- Acceptance: all existing eight stall prompts and four rides remain reachable and
  escapable; map marker follows actual X/Z and rotation; every route stays within
  agreed collision bounds; reset returns spawn; zero collision tunnelling at low FPS.
  Proposed performance target for approval: median ≥30 FPS/p95 frame ≤50ms on chosen
  midrange phone at low, desktop ≥60 FPS target; measure, do not promise from screenshots.
- Tests: pure-boundary/obstacle/ground-height regression; desktop and portrait/landscape
  joystick/prompt/map E2E; physical device route tour and sustained 10-minute scene run.

### Phase 2 — four real visitors and living crowds (**P1**, safety rules **P0**; 20–36 h)

- Existing: no networked gameplay; local player/animated priests can be reused visually.
  Partial: only browser-local controls/positions. Missing: every room/guest/network
  authority/reconnection/crowd system. Proposed: new backend room/session/transport
  modules with Zod messages, hooks/remote-player rendering, `Player.tsx` integration,
  shared/versioned pure world-rules contract, backend build/test updates. Keep commerce
  adapter and organiser auth separate; do not broadcast applicant/payment data.
- Dependencies: Phase1 map freeze and host decision **before** transport selection.
  Guest identity should be server-issued opaque short-lived identity/reconnect proof,
  not client-provided admin/room role; no accounts or public chat needed for MVP.
- **Transport evaluation, not a purchase/installation decision:** current Express
  backend makes a small authoritative WebSocket room layer a credible default **if**
  host supports long-lived sockets and one room-owning process. One minimal server
  dependency would require Phase2 approval. If host is serverless/static-only, evaluate
  private Supabase Realtime Broadcast + a trusted backend coordinator and atomic room
  admission; Presence alone neither enforces four slots nor validates movement.
  Do not pick Realtime just because the commerce DB is Supabase. Postgres Changes is
  not a 10Hz movement log. Avoid writing movement frames to business/database tables.
- Official limits page inspected: Free 200 concurrent connections/100 events per sec;
  Pro 500/500; Presence calls limited to 5/client/30sec. Events include fanout. Four
  clients each sending 10Hz to three peers could imply ~40 ingress+120 delivery events/s
  before other messages, above the documented Free 100/s envelope. Treat as a sizing
  example, **not measured quota or billing**; batching one authoritative room snapshot
  at 10Hz (~40 deliveries/s) reduces traffic. Confirm actual project plan/limits,
  message accounting, spend cap, expected simultaneous rooms and host WS support.
- Realtime alternative needs private channels, short-lived verified membership/JWT,
  narrow `realtime.messages` policies and public-channel restriction after approval;
  never expose service/secret keys or loosen commerce RLS. Auth policy caching and
  token expiry/revocation must be considered. No such policies/config were changed.
- Authority: atomic maximum four guests including racing joins; high-entropy invite
  codes, room-scoped sessions, heartbeat/expiry, finite bounded input vectors/yaw,
  elapsed-time speed and collision validation. Client prediction reconciled to server;
  do not trust absolute teleports, peer IDs, clothing IDs or action rewards. Single
  process MVP explicitly limited; horizontal scale requires shared admission/room ownership.
- Proposed measurable budgets: input max20 messages/s/client, snapshots10Hz, payload
  ≤1KiB/client, heartbeat10s, stale cleanup≤30s, reconnect grace20s with slot reservation;
  tune against measured host/network. Reject oversize/nonfinite/replayed/unauthorised
  messages; origin/session checks and per-IP/session room-join abuse controls.
- NPCs: separate `npc:` IDs, bounded count/routes, no occupancy consumption, local or
  deterministic server-clock simulation as agreed; avoid static obstacles and users,
  no NPC positions masquerading as real visitors. Cosmetic-only crowd can be deferred.
- Acceptance/tests: four **separate browser contexts** share positions/yaw; fifth and
  simultaneous admission races never exceed four; a second room sees no first-room
  state/actions; forging IDs/codes/reconnect tokens fails; offline/reconnect retains
  correct slot or clearly explains expiry; stale avatar gone≤30s; backend restart
  rebootstrap is explicit. Unit fake-clock admission/rate/movement/reconnect tests,
  four/five-context E2E, forged raw transport clients, packet-loss/high-latency/manual
  two-device checks and sustained four-player load. Transport/host choice is a blocker.

### Phase 3 — camera, clothing and actual photo capture (**P1**, extra outfits **P2**; 10–18 h)

- Existing: third-person avatar, camera collision, ride camera and drag look. Partial:
  zoom-like adaptive FOV, not user photo zoom. Missing: mode switch, curated wardrobe,
  photo capture/export/scenic presets. Proposed: camera-mode/controller interface around
  `Player.tsx`/`RideCamera.ts`, avatar appearance IDs, photo overlay/export helper;
  `App.tsx`/mobile UI, tests. Do not rewrite player/world hierarchy unnecessarily.
- Dependencies: Phase1 collision/camera rules; Phase2 appearance/mode event contract
  if multiplayer launch. External: approved simple original clothing designs and
  target mobile download/share behaviour; no proprietary reference assets.
- Risks: first-person seeing own head, clipping near walls, ride-mode conflicts,
  canvas readback black frames/CORS taint, allocating large buffers, photos leaking UI.
  Render/read capture on request; do not globally enable costly framebuffer retention
  without measurement. Guest appearance IDs must be allowlisted and bounded.
- Acceptance: 20 first/third-person switches walking/near walls/on ride entry/exit
  produce no exceptions, control loss or geometry clipping; 2–3 approved clothing
  choices visibly change the avatar (and remote avatar if multiplayer); export a
  nonblank PNG of actual scene at stated dimensions after explicit tap, with tested
  mobile fallback. Zoom/presets restore gameplay camera; user decides HUD inclusion.
- Tests: camera transition/state tests; real PNG byte signature/dimensions/non-uniform
  pixel assertion and visible selected outfit; desktop/touch and iOS/Android manual
  export, gesture/cancel, repeated capture/memory checks. QA screenshots do not count.

### Phase 4 — visible stall actions, inventory and offerings (**P1**, extra games/effects **P2**; 14–24 h)

- Existing: decorative goods/panels, fixed pool of bobbing diya, bounded scheduled show.
  Partial: content distinct by stall, not distinct gameplay. Missing: virtual acquisition,
  inventory, offering action/downstream travel, safe personal firecracker. Proposed:
  typed action/item catalogue and reducer, `StallPanel.tsx`, offering renderer linked
  to current river coordinates, `DiyaField.tsx`/firework pool extension; room authority
  and tests when multiplayer selected. Virtual items remain free/nonredeemable.
- Dependencies: Phase1 safe interaction points/current direction; Phase2 event IDs and
  authority; Phase3 input/modal mode compatibility. External: agree 2–3 MVP stall
  actions and downstream direction, inventory lifetime/refresh behaviour; no new service.
- Risks: action replay/duplication, two clients consuming same event, per-frame React
  renders, unbounded objects, remote effects bypassing reduced-motion controls.
- Acceptance: each enabled stall action visibly grants/uses one named virtual item or
  changes scene; replaying an action ID does not duplicate rewards; inventory bounded
  (proposed20 entries) and meaningfully displayed. Flower/diya release consumes exactly
  one item; downstream position advances monotonically along agreed current, not a
  sine oscillation; TTL≤30s/max32 active offerings per room initially. Personal effect
  is virtual/nonharmful, bounded, cancel-safe, at most one/user and server cooldown
  (proposed5s); effects respect local motion/off settings. No trading/real purchases.
- Tests: reducer/idempotency/limits, server forged/replayed action tests, movement/TTL
  math, two-client action agreement; visual item acquisition/release/E2E; four-client
  effect-spam performance and physical-mobile sustained run. Extra stall mini-games
  and denser firecrackers are deferrable, never substitutes for item integrity.

### Phase 5 — licensed sound/atmosphere (**P1**, layered ambience **P2**; 4–8 h plus rights delay)

- Existing: single-element user-gesture controls and original demo chime; Aarti scene.
  Partial: playlist UI includes unavailable recordings. Missing: authorised bhajans/music,
  optional ambience and complete rights manifest. Proposed: approved local audio files,
  playlist metadata/hook updates and provenance docs, small optional master-mix control.
- Dependencies: Phase0 asset-rights decision; Phase4 effect sounds only after action
  limits. External: organiser-supplied distribution/streaming permission and codec-ready
  recordings; otherwise retain accurately labelled original chime/silent experience.
- Risks: unlicensed copying, autoplay blocks, overlapping sources/network/memory cost.
- Acceptance/tests: no sound before gesture; play/pause/track/volume/mute observable
  and persistent during scene use as specified; missing/blocked asset never prevents
  movement; no uncontrolled overlap after20 next/previous operations, portal closes,
  visibility changes or reconnect. Rights file per shipped recording, proper cache/
  codec response; unit hooks + browser audio tests + real Safari/iOS/Android gestures.

### Phase 6 — separate optional donations (**P1**, payment safety **P0**; 4–8 h plus recipient approval)

- Existing: closeable optional dialog, clear pending/manual review, validation/admin
  and private QR route. Partial: same commerce component handles rentals/donations;
  no direct donation URL but panel already satisfies page-or-panel scope. Missing:
  confirmed intended recipient/QR and public-enabled-flow QA. Proposed: reuse/separate
  contribution panel; optional `/support` route only if approved, clear back navigation;
  server recipient/QR binding and approved settings update; tests. No gateway dependency.
- Dependencies: organiser confirms `shreeramdiwalemela@ptyes`, payee name and actual QR
  match; Phase7 staging, live-write approval and review/privacy procedures. A new UPI
  string alone is not account ownership evidence and does not authorise QR generation.
- Risks: legacy QR/recipient mismatch, wrong amount/account, public private-file exposure,
  fake success, double reference use across rentals/contributions and concurrent review.
- Acceptance: donation visit never gates entering/free play; close/back returns to
  same mela state and does not leave controls held. Approved QR decoded independently
  to same intended UPI/payee; no payment/secret assets copied indiscriminately into public
  directory. If approval absent, disabled/informational panel and no pay link/QR exposure.
  Valid reference persists before 201, pending only; duplicate/invalid/error paths
  return honest failures; authorised independent reconciliation only sets verified.
- Tests: navigation/focus/touch, amount/duplicate/503/no-false-receipt, admin denial,
  cross-flow reference handling and concurrent review; approved staging persistence/
  restart and browser-role denials. Do not send real money or mark test payments settled.

### Phase 7 — regression, HTTPS staging and controlled launch (**P0**; 12–20 h plus access)

- Existing: tests/builds/secret scanner and deployment instructions. Partial: no provider-
  executable configuration or public URL proof. Missing: real-device matrix, selected
  host/domain/DNS/TLS/WS configuration, production smoke/rollback drill. Proposed:
  host-specific minimal deploy/proxy config, room health/readiness/observability if
  selected, new E2E/security/load tests, release docs/screenshots and final ZIP.
- Dependencies: all selected feature gates, hosting/domain access, verified secrets,
  scoped data tests, rights/recipient decision and explicit production approval.
- Risks: SPA fallback swallowing `/api`, exposed root/private files, absent WS upgrades,
  unsafe proxy trust, shard-dependent limits, quotas/expenses, no backup/restore.
- Acceptance/tests: existing55 unit/API and30 browser cases preserved plus new phase
  cases; agreed real Safari/Chrome/Firefox and iOS/Android devices pass chosen flows.
  Stage under HTTPS; `/api` errors remain JSON/status-correct, organiser auth forwarded,
  static/private/env probes denied, assets MIME/cache correct, all public bundles scanned.
  Verify DNS/certificate/HTTP→HTTPS, room transport Origin/auth/WS upgrades, reconnect/
  four-player isolation/load and provider health. Health!=DB readiness. Production
  smoke defaults read-only; any write QA needs separate authorisation. Fresh ZIP CRC,
  extraction/install/typecheck/build/tests and source digest; screenshots dated/current;
  rollback rehearsed. No public launch if any selected P0 gate fails.

## 6. Critical path, smallest credible scope and sprint schedule

**Full roadmap order:** Phase0 approval → Phase1 stable movement/collision/map →
Phase2 transport/host proof + guest admission → validated movement/reconnect →
Phase3 camera/appearance → Phase4 shared actions/inventory/effects → Phase7 integrated
QA/staging/production approval. Phase5 rights and Phase6 recipient/hosting decisions
can be gathered alongside engineering, but are not assumed complete. Host compatibility
and a minimal Phase2 prototype should be decided early, not after cosmetic expansion.

**Recommended 2–3 day option:** release the existing, explicitly **single-player**
experience with verified P0 fixes/hosting/mobile checks; retain rides/river/Aarti/stalls,
gesture-started original chime, and donation disabled until independently approved.
Defer expanded world, multiplayer, wardrobe, photo, inventory/offerings and new audio
until their tests pass. This is the smallest credible scope, **not fulfilment of all
requested features**. If four real visitors are mandatory, reject this scope and
extend the sprint or allocate additional engineers; never label NPCs as multiplayer.

| Day | Safety-first 3-day reduced-scope proposal | Mandatory-four-player alternative |
| --- | --- | --- |
| Day1 | Approve scope; revoke obsolete token; choose host/domain, devices, privacy and recipient path; fix only approved P0 defects; stage current app; establish rollback/perf baseline | Freeze current world (no expansion); confirm WS/Realtime quotas/host; build and test authoritative four-slot guest admission + movement contract |
| Day2 | HTTPS/proxy/secret checks, authorised DB metadata/integrity checks; desktop/touch/manual device QA; optional confirmed donation staging only; preserve existing regression suite | Input/snapshot reconciliation, isolation, reconnect/expiry, forged message/rate tests, four/five-context QA; no wardrobe/offerings/music expansion |
| Day3 | Full regression/security/physical-device gate; staging soak, fresh archive/screenshots; rehearse rollback; organiser go/no-go and public read-only smoke after authorised deployment | Fix failures; latency/spam/mobile/staging WS tests; deploy only if all selected gates pass. At ~32–56h for rooms+release, this is high-risk for one person and may need more days |

Two days leaves insufficient room for failed device/DNS/realtime tests; keep Day3 as
verification, not a bucket for unfinished features. Aim for staging by 5 November and
go/no-go by 6 November, retaining 7 November as a buffer, subject to organiser timezone
and availability. If critical evidence is missing, slip scope/date, not security/tests.

## 7. User decisions and external prerequisites

1. **Approve a scope:** single-player fast launch vs mandatory four-player release;
   select which P1 features may defer. Confirm success metrics and launch timezone.
2. **Hosting/domain:** provider/account/domain name, DNS manager, backend socket support,
   one-process room ownership vs scale, expected visitors/rooms and budget. Supply
   access via provider/secret manager or local secure mechanism, never chat secrets.
3. **Supabase:** existing project only; confirm plan/Realtime quotas/spend cap if using
   that transport. Approve read-only live inspection and separately scoped staging
   write/rollback tests when implementation begins. Do not rerun001 after002.
4. **Secrets:** confirm temporary management-token revocation; runtime key/admin token
   secured and rotated as needed. No new secret values are requested in this report.
5. **Recipient:** independently verify intended UPI/payee/QR; choose donation-only
   panel vs optional route, reconciliation operator, privacy/retention/legal policy.
   Leave donations disabled if any uncertainty; original QR must not be assumed reusable.
6. **Experience/content:** approve bounded map,2–3 interactions, inventory lifetime,
   room expiry/NPC behaviour, clothing designs and photo HUD/download behaviour.
   Supply licensed music/rights or approve silent/original-chime launch.
7. **QA/operations:** target physical devices/browser matrix, mobile FPS/network budget,
   backup/restore responsibility, monitoring/alerts/abuse limits and launch sign-off.

## 8. Release checklist and rollback

- [ ] Selected scope and deferments approved; no feature claims exceed evidence.
- [ ] Room-cap/isolation/abuse/reconnect gates pass if multiplayer selected; no secrets
  or commerce/private records in room payloads; no unapproved public channels.
- [ ] Camera/photo/clothing/action/inventory/offering/audio gates above pass for
  selected features, plus existing world/ride/vendor regressions.
- [ ] Intended recipient/QR approved or donation remains disabled; no fake settlement.
- [ ] Live DB constraints/RLS/organiser permissions rechecked under explicit approval;
  business records preserved; backups and restore rehearsal documented.
- [ ] Real phones/GPUs/browser matrix, reduced motion, keyboard/dialog accessibility,
  slow network, performance budgets and four-client load (if selected) pass.
- [ ] HTTPS/DNS/proxy/WS/rate limits/secrets/private-file exclusions and public smoke pass.
- [ ] Current screenshots/report/ZIP CRC+extraction+build checks and secure handover.
- [ ] Organiser explicitly authorises production; rollback owner and trigger agreed.

Rollback strategy: keep the intact working project and existing older source backup;
the fresh Desktop audit ZIP preserves this entire current baseline with report, despite
requested old-ZIP cleanup. Before implementation, make a separate versioned/off-device
copy or Git baseline with approval; env secrets stay outside archives in secure storage.
Stage feature flags/small reversible releases. Revert app/static build+compatible
runtime config first; disable only affected feature/payment instructions with organiser
authorisation. Drain/restart room service, inform visitors of reconnect/reset; never
restore stale duplicate membership or verified payment state from browser caches.
Database changes should be additive/versioned/backed up; do not reset/drop/reapply001
or loosen RLS as a rollback. Preserve audit/business rows; any data restore/repair needs
explicit owner approval and rehearsal. No rollback was executed in Phase0.

## 9. Delivery, cleanup and unverified facts

New ZIP target: `/Users/khushdeep/Desktop/banaras-diwali-mela-phase0-audit.zip`.
Use existing `python3 scripts/release_zip.py --output <target> --extract-to <new-temp-dir>`:
single root, complete source/assets/skills/examples, no real env/node_modules/dist/
caches. Verify CRC, fresh extraction, secret scans and per-file byte comparison before
handoff or deleting any older archive. Archive hash is reported outside its contents
to avoid self-reference. Final packaging result belongs in the delivery response.

Per explicit user cleanup request, remove **only** these identified old project ZIPs
after new archive validation; do not delete source folders, skills, unrelated archives
or the new ZIP:

- `/Users/khushdeep/Downloads/banaras-diwali-mela-phase12.zip`
- `/Users/khushdeep/Downloads/banaras-diwali-mela-phase13.zip`
- `/Users/khushdeep/Desktop/banaras-diwali-mela-phase8.zip`
- `/Users/khushdeep/Desktop/banaras-diwali-mela-final.zip`

Filename searches of Downloads/Desktop found those four. Do not assume unrelated
archives elsewhere belong to this project. Old archive links in historical reports
will no longer resolve after requested cleanup; their source/report files are retained.
The agent-created temporary Phase13 preflight ZIP, if still present under the approved
OpenCode temporary directory, is also an old project archive eligible for scoped cleanup;
no temporary directories or unrelated ZIPs are recursively deleted.

Unverified: current live database/project identity/migration state/record integrity;
management-token revocation; actual account/QR recipient; domain/host/public service
status; Realtime entitlement/cost/concurrency; licensed external recordings; physical
hardware FPS and browser compatibility outside fresh emulated Chromium; target traffic,
new guest policy, scope approvals and implementation estimates under real conditions.
No full live persistence test or actual public-enabled donation test was run in Phase0.

### Public research sources (read only)

- https://melachaloge.online — high-level experience text only.
- https://supabase.com/docs/guides/realtime/limits — published limits, not project quota.
- https://supabase.com/docs/guides/realtime/authorization — private-channel/RLS/JWT design.

**Stop here.** No Phase1 application implementation, database/payment/configuration
change or deployment is authorised by completing this audit.
