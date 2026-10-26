# Phase 2 — real rooms, independent crowd and optional support

24 October 2026. Implementation/evidence log; final executed results below must be
checked before handoff. No live Supabase calls, migrations, payment configuration,
deployment or physical-device verification are authorised or performed here.

## Baseline and rollback

Phase 1 ZIP preserved on Desktop, SHA256
`c7a50db9032e1d45ccdfa339a37e08e7a0540642dbf688152fbebc0a5bd62213`.
The Phase1 working folder and original Downloads Phase0 ZIP are untouched. A second
hash-verified Phase1 rollback ZIP is in
`C:\Users\khush\AppData\Local\Temp\opencode\banaras-phase2-rollback-20261024`.
Phase2 uses a separate `Desktop\banaras-diwali-mela-phase2\banaras-diwali-mela` folder.
All project skills and Phase0/Phase1 reports are preserved as historical evidence.

Baseline rerun: both `npm ci --offline --ignore-scripts --no-audit --no-fund`, both
typechecks/tests/builds passed (frontend35, backend25). Browser command
`npm run test:e2e -- e2e/phase1-profile.spec.ts e2e/world.spec.ts`: **3/3 passed**,1.5m.
Windows Node24.18.0/npm11.16.0; Edge headless SwiftShader; not physical hardware FPS.
Baseline calls/triangles at spawn, fireworks off,1280x720/scale2:
low603/60,872; medium632/87,764; high919/107,000.

## Transport decision and infrastructure boundaries

Existing architecture is one Express/Node HTTP server and server-only Supabase Data
API adapter. There was no room service, browser Realtime client, room-auth service
or verified private Realtime configuration. No credentials, enabled services,
project quotas, hosting provider or live database state were assumed verified.

Use **native browser WebSocket + `ws` on the existing HTTP server**, not Supabase
Postgres position writes. The sole added runtime dependency is `ws`; `@types/ws` is
development-only (`ws`8.22.0 / `@types/ws`8.18.2 in the lockfile). Writing a custom WebSocket framing server or adding a complete
Realtime/auth/schema stack would be less safe and larger. No frontend dependency.
Supabase Broadcast would still need an authoritative membership coordinator, private
channel auth and verified service quotas; none is established here. See the Phase0
transport evaluation. Commerce continues to use its existing Supabase integration.

**Production dependency:** one continuously running Node process supporting HTTP
upgrades, behind same-origin HTTPS/WSS. Static-only/serverless request handlers are
not sufficient. One process owns all rooms in memory; do not enable cluster workers,
multiple replicas or autoscaling without a separately approved shared room router.
Process restart intentionally loses transient rooms; clients explain expiry/rejoin.
This has not been deployed or verified with any external hosting provider.

### Limits, lifecycle and security

- Four human guests per room, including disconnected reservations. Maximum32 rooms,
 128 open sockets. Admission is synchronous/atomic within the single Node process.
- Random40-bit room invite codes; opaque UUID guests; random256-bit reconnect secret.
  Secret is sent once per welcome over the socket, retained only in page memory;
  server stores its SHA256, compares fixed-length hashes with timing-safe equality.
  It never appears in URLs, room snapshots, browser storage, logs or reports.
- Same-open-tab reconnect grace20s. Presence disappears on socket close; reservation
  stays until grace expires. Full page reload loses the memory-only secret; either
  use a free slot or wait for the old reservation. Explicit Leave releases immediately.
- Auth/first join deadline5s; heartbeat every5s, missed pong terminates by about10s.
  Grace cleanup bounds orphan retention to about30s after a silent network failure.
- Snapshots10Hz (100ms), <=4 public visitor poses; local telemetry <=5Hz. Up to40
  room snapshot deliveries/s for four guests, excluding bounded join/correction
  messages. No per-frame database traffic and no commerce records in room payloads.
- Messages max1KiB, max20/s/socket, monotonic safe-integer sequence numbers, strict
  Zod objects and finite bounded heading. Before-join actions, replay, unknown fields,
  claimed IDs/room membership, binary/malformed/oversized messages are rejected.
- Server validates walking speed with a bounded1.5-unit credit bucket (4.5units/s),
  every collision segment at0.08-unit intervals and actual shared world bounds.
  Ground height is server-derived. Invalid moves correct the local visitor; they
  are not broadcast as accepted teleports. Reset returns to the approved spawn.
- Native ride entry must be within2.4units of its real boarding area. Off-ground
  poses are only accepted during that admitted ride, inside its geometric envelope,
  with bounded speed. Walk/exit returns to the server's fixed exit, not a supplied
  coordinate. Ride poses are validated observations of the existing local ride,
  not a server-synchronised mechanical ride simulation. Independent ride animation
  phases can differ between visitors; see limitations.
- Exact Origin allowlist, no wildcard, no missing/null Origin; no compression. Rate
  limits on upgrades30/IP/min, capped2048 expiring IP buckets; outbound buffered
  data above64KiB closes the slow connection. No global public room listing.
- Origin validation prevents browser cross-site use, not raw-client impersonation;
  room invite capability, independent session tokens and server validation remain
  necessary. Public hosting also needs WAF/TLS/connection abuse controls. Socket
  rate limiting uses the TCP peer, not arbitrary X-Forwarded-For; shared-proxy IP
  aggregation must be considered before material traffic. No proxy trust invented.
- Empty rooms/reservations are removed; close clears sockets, timers and upgrade
  listeners. Idle walking state expires after600ms without accepted movement data.

## `.env` path and running locally

The working copy has a locally created, ignored placeholder file at:

```text
C:\Users\khush\Desktop\banaras-diwali-mela-phase2\banaras-diwali-mela\backend\.env
```

Fill `SUPABASE_URL` and **one** backend-only key: preferably `SUPABASE_SECRET_KEY`,
otherwise `SUPABASE_SERVICE_ROLE_KEY`. Supply a random32+character `ADMIN_API_TOKEN`
for organiser access. Never put these in frontend env, a `VITE_*` variable, code or
chat. `SUPABASE_ACCESS_TOKEN` is not needed at runtime; do not add a management token
for ordinary operation. No secret values are supplied in this release.

Multiplayer itself does not need Supabase credentials. With default `DEMO_MODE=false`
and no database configuration, commerce remains safely unavailable while rooms work.
Do not enable demo mode or payments in production. The release deliberately omits
all real env files. After extracting, copy `backend/.env.example` to `backend/.env`
privately and fill it locally.

```powershell
# terminal1, backend/
npm ci
npm run build
npm run start:local
# terminal2, frontend/
npm ci
npm run dev
```

`start:local` explicitly loads the backend `.env`. The existing plain `dev`/`start`
commands expect externally injected process environment instead. Never assume an
env file is loaded by every script. Local frontend defaults to5173, backend3001;
tests use isolated5174/3101 and explicitly clear database credentials.

`REALTIME_ORIGINS` is an exact comma-separated browser-origin list in the backend
example; local localhost/127.0.0.1:5173/5174 defaults work. Production startup rejects
non-HTTPS origins: set it to the actual frontend origin, e.g. `https://mela.example`.
Do not use wildcard, paths or trailing slash. Vite proxies `/api` including WebSocket
upgrades locally; production must route that path to the same Node room owner.

Example reverse-proxy **requirements**, not an applied deployment:

```nginx
location /api/room-socket {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header Origin $http_origin;
    proxy_read_timeout 75s;
}
```

Serve TLS on the proxy, forward other `/api` requests using the existing commerce
runbook, expose only built frontend assets, never the repository/private/env files.
Production still requires the existing Supabase/admin fail-closed configuration.

## Four-client reproduction

Open four independent browsers/contexts at the same frontend origin. Enter the ghat,
choose Together/Multiplayer, Create room on one, and privately share its code. Join
the other three with that code; each should show4/4 and three blue visitor figures.
Close the room panel to move. A fifth join reports full. Leave frees a slot; network
drop removes visible presence and reserves its slot20s. Same-tab reconnect restores
the UUID/position. Another created code is isolated. If service is unavailable,
close the panel and explore solo; no fake visitor simulation is substituted.

Automated actual-browser test: `npm run test:e2e -- e2e/phase2.spec.ts` from frontend.
The multi-client case uses real separate contexts, native sockets, keyboard movement
and interpolated render telemetry from real scene instances. It does not mock sockets
or synthesise three visitors. Backend room tests also use real WebSocket connections.
For this shared software-rendered test machine only, the multi-client harness caps
browser requestAnimationFrame requests at5Hz and uses360x480/low viewports to bound
concurrent raster cost. Application/WebGL/native socket/validation paths remain real;
the production application is NOT capped. This is explicitly not a four-phone FPS
benchmark. Standard single-client world/profile/mobile tests remain uncapped.

## NPCs and optional support

Ordinary crowd limits4/6/8 at low/medium/high, separate `npc:` identities, two routed
loops through the market, river edge and expanded side/court paths. Speeds0.65..1.17,
varied pauses,10Hz bounded AI updates, walkable/segment guards, yielding/detours
around visitors and beggars, separation from other NPCs and reversal on blockage.
NPCs are **local cosmetic simulations**, not human room members and not synchronised
shared NPC authority. They cannot grant items or assert payment state.

Two stationary, respectfully styled support-seeking NPCs have neutral shawls and an
"Optional support" sign/ring: (-12,10.8) and(24,12.2), away from choke points/ride
sweeps. Configure their small count/locations with the `BEGGARS` array in `crowd.ts`;
radius is `BEGGAR_RADIUS`1.9. Closest eligible target wins; ties use stable IDs. Only
one contextual optional Donate prompt appears; existing ride/stall prompts take
priority. Keyboard E and mobile tap both open **the original CommercePortal**, not
a second payment implementation. Its exact caption is `dedo yaawwrr cmon`.

Input is cleared/frozen while the donation dialog is open; close/Escape returns to
gameplay. No interaction can open through another modal/menu, repeated input creates
no duplicate dialog. Donation remains optional; the world is never payment-gated.
Recipient/QR remain unverified. UPI/QR API guards, disabled defaults and pending-only
manual-review rules are unchanged. Intended `shreeramdiwalemela@ptyes` is NOT activated.
No private QR is supplied in the archive or regenerated; configuration must remain
disabled until recipient and QR are independently verified in an authorised phase.

Local orange visitor, blue remote visitors, muted ordinary crowd and neutral shawled
support NPCs share the existing single scene. Crowd/remote bodies use one instanced
box geometry/material plus small shared signs/rings; no per-character renderer or
new light/shadow system. Remote positions/facing are exponentially interpolated
using refs; walking/idle drives simple limbs. No hair, face/clothes editor, camera
mode, photo, inventory, offerings, personal fireworks or new audio work was added.

## Changed files

- Backend: `src/rooms.ts` (new), `src/shared/{world,network}.ts` (new),
  `src/{server,config}.ts`, `.env.example`, manifests/lockfile for `ws`/types,
  `test/rooms.test.ts` (new). Existing commerce/database source stays unchanged.
- Frontend: `components/{useRoom,RoomPanel}.tsx/ts` (new),
  `world/{CrowdScene,crowd}.tsx/ts` and `crowd.test.ts` (new),
  `App.tsx`, `CommercePortal.tsx` (caption prop only), `style.css`,
  `world/{MelaScene,Player,environment,aarti,ride,pendulum}.tsx/ts`, `vite.config.ts`,
  `e2e/phase2.spec.ts` (new). Collision rules are extracted without changed Phase1
  geometry into a pure shared module under backend/src/shared; only that pure module
  is imported by frontend, never server config, DB adapters or keys.
- Release: this report, release required-file checks and current curated captures.

## Verification log (actual commands/results)

- Baseline commands/results recorded above. No baseline application failure.
- First implementation typecheck caught a Windows case-resolution conflict between
  `crowd.ts` and `Crowd.tsx`; renderer renamed `CrowdScene.tsx`, no assertion removed.
- `backend npm run typecheck; npm test; npm run build`: passed; final suite
  **33 tests in5 files**, including8 new real-socket/world/origin cases. All25 original
  commerce/security tests retained.
- `frontend npm run typecheck; npm test; NODE_ENV=production npm run build`: passed;
 38 tests. A new NPC-tour assertion initially required >10 Z-span although the lower
  route is Z1..10.5; corrected to>9, retaining per-NPC wide-X and ten-minute guards.
- Initial focused browser run (`phase2`, `phase1-profile`, `phase1`): **4 passed,
 1 failed**,5.4m. NPC/beggar desktop+mobile, map/routes/layout and workload passed;
  four-context proof failed during later scene startup before shared-motion proof.
  This is recorded as a failure, not passing multiplayer evidence.
- Final frontend `npm run typecheck; npm test; NODE_ENV=production npm run build`:
  PASS **38 tests in16 files**, strict typecheck and production build.
- Both packages `npm audit --audit-level=low`: PASS,0 known vulnerabilities. This
  is a dependency advisory check, not a general security certification.
- Root `python -m unittest discover -s scripts -p test_release_zip.py`: PASS2/2.
- Root `node scripts/smoke_backend.mjs` with live credentials cleared: PASS compiled
  liveness, unavailable persistence, organiser fail-closed, JSON404, redacted unsafe
  production startup. No live storage calls or mutations.
- Bounded four-client proof: `npm run test:e2e -- e2e/phase2.spec.ts -g 'four independent'`:
  **1/1 PASS**,37.6s total (33.2s test). Actual four clients, movement/facing, capacity,
  isolation, drop/reconnect ID and leave verified, no mocked socket responses.
- Full-suite and final archive outcomes are appended after execution; no passing
  full-suite result is inferred from focused checks.
- First full run: `npm run test:e2e` — **35 passed,1 failed**,24.9m. All33 existing
  regression cases passed, including world/map/touch/ride/audio/commerce security.
  Four-client and offline-solo cases passed. The new mobile support case overshot
  the real1.9-unit proximity boundary (X-14.3 versus beggar X-12), then correctly
  found no tap prompt. Test now re-centres with real short keyboard nudges and
  reasserts proximity before tapping; no assertion was weakened or removed.
- Final focused rerun: `npm run test:e2e -- e2e/phase2.spec.ts` — **3/3 PASS**,1.1m.
  Includes real four-context proof (37.9s), NPC/support desktop+mobile/menu guards,
  and actual browser-offline solo movement. Updated captures were inspected.
- Final backend rerun after tightening rejected-move idle state:
  `npm run typecheck; npm test; npm run build` — PASS33/33. Invalid moves now set
  moving=false in the correction; the existing real-socket assertion covers it.
- A fresh complete36-case rerun is performed after these corrections; result is
  recorded at completion below. No further application features are added.
- **FINAL FULL SUITE:** `npm run test:e2e` — **36/36 PASS**,12.3m, no retries.
  This clean run includes all33 preserved cases plus the3 Phase2 cases. Real
  four-context membership/movement/facing/capacity/isolation/reconnect/leave passed
  in18.6s; NPC/support keyboard+mobile/menu guards passed in14.2s; offline solo
  fallback passed in3.5s. All existing ride/stall/Aarti/audio/fireworks/minimap,
  mobile pointer-capture and commerce regression assertions passed unchanged.
- Clean release-copy verification (281 eligible files; no real env/private/assets
  credentials): both packages `npm ci --offline --ignore-scripts --no-audit --no-fund`,
  `npm run typecheck`, `npm test`, `npm run build` (frontend NODE_ENV=production):
  **PASS38 frontend/33 backend**, both strict typechecks/builds. Installs40s backend,
  47s frontend. The private transport test fixture was removed after the backend test.

Investigation: a repeat with unbounded contexts again failed during later scene
startup (3.9m); a separate-GPU-process trial at small low-quality viewports timed out
at6m. Neither is passing four-client evidence. The machine reports16 logical CPUs,
15.7GiB RAM; after those trials4.4GiB was free. Software-render startup and socket
resets were observed; no physical-device/network performance conclusion follows.
The bounded test-hardware frame scheduler is used to check whether concurrent
software raster load is the blocker without changing application/network state.
With only the harness raster rate bounded, all four clients passed. Final full-suite
source includes that cancellation-safe, test-only scheduler, a real unavailable-service
case using browser offline mode, and desktop/mobile support-menu interaction guards.

### Workload, rate and resource evidence

Uncapped existing profile case in the full suite (1280x720/scale2, fireworks off):

| Tier | Phase2 starting calls / triangles | Phase2 after calls / triangles |
| --- | --- | --- |
| low | 603 / 60,872 | 604 / 61,628 |
| medium | 632 / 87,764 | 636 / 88,724 |
| high | 919 / 107,000 | 922 / 108,116 |

All original Phase1 workload assertions remain and pass: calls <=650/671/1016,
triangles <=67,646/99,398/123,316 approximately. Wheel culling changes small samples;
do not interpret tiny counter differences as FPS gains/losses. See `phase2-captures/`.
The real production application has no5Hz raster cap. Existing DPR/shadow settings,
fireworks limits, reduced-motion preference and lazy scene import remain intact.

Entry JS302.66 ->311.61kB (gzip98.72kB); lazy scene1002.28 ->1006.95kB
(gzip265.93kB). The existing >500kB scene warning is retained, not suppressed.
Pre-existing Three Clock/PCF-shadow/CJS deprecations remain.

Network rate is bounded by one existing <=5Hz local telemetry emitter and one10Hz
server snapshot timer; no second player render loop. Backend real-socket tests
exercise socket count/guest count returning to0, room expiry and slot reuse. Browser
tests assert removal of rendered remote slots on disconnect/leave and identity
restoration on reconnect. Renderer slots are fixed at3, snapshot lists capped at4,
NPC arrays4/6/8, bodies/geometry instanced, generated sign texture disposed on
unmount; no per-visitor scene or growing actor collection. Long-running GPU heap/
thermal/device soaks remain unverified; bounded lifecycle tests are not a GPU-memory
certification. Ten-minute NPC checks are **simulated**6000x0.1s pure route/avoidance
steps, checking every position plus each NPC's travelled distance and broad route
coverage, not a real-time10-minute hardware performance run.

The authoritative movement contract remains the Phase1 expanded world. Collision,
ground, pillar/pavilion and stall consistency tests run alongside NPC tests. Humans
are not solid griefing obstacles to each other; NPCs yield/detour rather than
consuming visitor capacity or blocking core interactions.

### Preservation and archive gates

Before packaging,23 critical commerce/migration/audit/skill files were compared
byte-for-byte with the Phase1 ZIP and passed. Eligible source/docs/assets and the
production frontend were secret-scanned. `backend/.env` exists locally and is
excluded. Phase0/Phase1 reports and all16 skills are untouched; production commerce
`app.ts`, `store.ts`, `commerce.ts` and both migrations are unchanged.

New versioned output target:
`C:\Users\khush\Desktop\banaras-diwali-mela-phase2-v1-20261024.zip`.
After checks, use the existing stdlib packager from root:

```powershell
python scripts/release_zip.py --output C:\Users\khush\Desktop\banaras-diwali-mela-phase2-v1-20261024.zip --extract-to C:\Users\khush\AppData\Local\Temp\opencode\banaras-phase2-v1-extracted
```

It requires the new room/shared/NPC/client/test/report files, verifies every CRC,
single safe root, fresh extraction, secret scan and byte-identical source extraction.
Real envs/private organiser media, dependencies, caches, test output and builds are
excluded. Exact archive size/count/SHA256 are emitted by the script at delivery.
Verify fresh extracted frontend/backend installs, typechecks, tests and builds too.

Rollback: stop the local Phase2 process; return to the untouched Desktop Phase1
working folder, or extract the preserved Phase1 ZIP into a new directory. Keep any
real `.env` only in secure local storage and configure the chosen backend privately.
There is no database rollback: no schema/data/payment change was made. Rooms are
transient and disappear on server stop. No old ZIP or original working source is
deleted by Phase2 delivery.

## Risks and remaining external gates

No live Supabase/Reatime quota/service checks, physical phones/GPUs, Safari/Firefox,
public HTTPS/WSS hosting or production load verification. Headless screenshots and
draw counts are not FPS/thermal or two-device networking proof. Single-process room
state is intentionally ephemeral. No cross-process admission/distributed recovery.
Ride observations are bounded/validated but native ride machinery is not shared
server simulation. Walk prediction is locally responsive; rejected moves correct
to the last server-accepted pose, which may be visible under packet loss/collision.
NPCs are lightweight waypoint characters, not navmesh/physics agents; route/avoidance
simulation and browser tours bound the claim, not every possible crowd arrangement.

Phase3–7 stay pending. Beggar support was explicitly authorised for Phase2 here;
the wider donation verification/enablement work remains deferred. Do not treat the
caption, a submitted UTR or an API201 as verified settlement.
