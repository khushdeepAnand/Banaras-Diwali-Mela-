# Phase 4 gameplay implementation report

## Scope and provenance

Work started in the existing Desktop `banaras-diwali-mela-phase3/banaras-diwali-mela`
project, not a fresh scaffold. Before changes, all 309 eligible source, documentation
and asset files matched `banaras-diwali-mela-phase3-v1-20261025.zip` byte-for-byte.
`git status --short` reported no Git repository. Existing private configuration and
donation candidate assets remain private. Phase 2 and donation-folder `.env` files
were compared privately and are byte-identical to Phase 3's backend `.env`.
No credential values, live Supabase calls, SQL, payment activation, payment attempt,
infrastructure change or deployment formed part of this work.

The historical README contains older Phase 13 claims. They are not current live
verification. The Phase 3 archive includes Phase 3 source and browser/unit tests,
but no separate Phase 3 implementation report. The original phase documents,
skills and historical captures are retained.

## Status

| Feature or gate | Status | Evidence / limitation |
| --- | --- | --- |
| Three distinct stall gift interactions | Tested | New rules tests and Phase 4 keyboard/touch browser flows |
| Bounded session inventory | Tested | Caps, immutable updates, cooldowns, empty inventory and rejected actions tested |
| Flower and diya offering loop | Tested | Real acquisition, consumption, visible scene event counts in both camera modes |
| Smooth offshore downstream trajectory | Tested | Finite, continuous, bank-clear trajectory sampled throughout its lifetime |
| Personal ignition and spark fountain | Tested | Acquisition, ignition/effect lifetime, consumption and cooldown rules |
| Shared effects and private inventories | Tested | Two real browser visitors and backend native-WebSocket integration test |
| Richer background fireworks | Tested | Existing show/particle tests passed; desktop/mobile captures reviewed; no hardware FPS claim |
| Sound for the personal fountain | Not implemented | No suitable effect asset is supplied; current fountain is visual. Existing music controls remain unchanged |
| Database inventory persistence | Not implemented | Deliberately session-only; no schema or commerce coupling |
| Existing Phase 1–3 regressions | Tested | Four-player/capacity/isolation/reconnect, NPC/beggar, wardrobe, camera/photo, map and donation checks passed on focused reruns |
| Recipient/QR verification and real donations | Blocked | Existing decoded payee mismatch; payment/QR/copy/open safeguards unchanged |
| Physical-device performance / production hosting | Blocked | No physical device or deployed HTTPS/WSS environment verified |

## Stall interactions and inventory

Existing eight approach points, native stall dialog, sample products/prices and
published vendor kiosks remain. Three built-in stalls additionally give free virtual
session gifts:

- **Phool Gali:** marigold offering, maximum three held.
- **Deep Jyoti:** clay diya, maximum three held; virtual spark fountain, maximum one.
- **Ghat Chaat:** imagined tamatar chaat tasting and permanent-in-session tasting stamp,
  maximum one. It is a keepsake, not a real meal, purchase, score multiplier or payment.

Each gift has a name, description, outcome, collection count and clear no-money
explanation. Collection has a shared 1.2-second debounce. Caps prevent unbounded
stockpiling. Names/IDs are allowlisted; published vendors cannot grant arbitrary
items. Gifts does not replace or alter real commerce records.

**Gifts** beside the map control opens inventory and directions. Native buttons and dialog
focus/Escape support keyboard and touch. Movement stops while either dialog is open.
Existing E-key/touch stall prompts are reused. Collection validation now shares the
existing 2.25-unit stall approach radius, rather than exposing a prompt at a position
where collection would be refused.

## Ganga offerings

The offering marker is on walkable central steps at **X0/Z1.15**. Its E/tap prompt opens
inventory with explicit flower/diya choices. The rule function validates position,
item, inventory, cooldown, ride state and effect capacity before decrementing. A
failed or duplicate request consumes nothing. Successful actions publish one event
and a confirmation message; available inventory immediately reflects the authoritative
result. Closing a panel does not cancel an already accepted offering.

The existing Ganga stays unchanged: plane X +/-90, Z -85.5..-0.5, Y -0.17, with small
wave displacement. Its shader noise translates toward -X/+Z, but there is no defined
hydrological current. The explicitly stylized offering current therefore travels
toward **-X**, not a claimed real-world river direction. The path starts offshore
at Z-1.25 and eases to an offshore lane below Z-2.35 rather than following shader
noise back into the bank. Over 32 seconds X travels from0 to-15.36. This avoids the
Aarti platform, shore terrain and the inspected ferry/cruise routes. Release height
eases into the water during1.2 seconds; mild bob, yaw and tilt follow, then the float
shrinks out over its last2.5 seconds. Reduced motion removes decorative bob/tilt.

Leaf/flower and clay/flame instances use the existing scene palette and primitive
materials. Decorative bobbing lamps are preserved and are not counted as offerings.
Temporary events expire; meshes are pooled rather than created for each offering.

## Personal firecracker and background show

Deep Jyoti supplies a **virtual festival spark fountain**, not a real explosive or
purchase. At **X0/Z7**, E/tap opens its Light action. The visual emitter is offset
to X0/Z4.8 so it is in front of, not inside, the walking visitor. The existing east
beggar at X24/Z12.2 remains untouched. Initial east-side locations were rejected
after screenshots revealed pavilion and beggar billboard occlusion. The final
central positions preserve those existing features while giving the effects clear views.

An accepted event has a0.9-second ignition, then a short warm particle fountain,
and disappears after4.2 seconds. One shared bounded light is visible only during
the effect in medium/high quality; low uses emissive sparks without an extra active
light. Per-visitor cooldown is8 seconds. At most two personal effects may coexist
in a room. Empty inventory, cooldown, riding, invalid location or exhausted effect
capacity rejects without consumption. No real-world preparation or ignition
instructions are presented. Existing camera code and renderer are not replaced.

Background fireworks reuse the existing cue schedule, shapes, quality counts,
texture, toggles and cleanup. Per-particle palettes, varied burst scale, curved
launch motion, depth spread and light lateral drift increase variety without
increasing particle counts, adding a second renderer or changing river materials.
Existing quiet intervals remain. Decorative updates stop in hidden tabs.

## Multiplayer and failure handling

The existing Node HTTP server owns rooms and accepts native WebSocket upgrades.
The shared world/protocol version is2. Gameplay extends this same socket; no new
transport, package, database table or external service was introduced.

- Each guest owns a private inventory and cooldown state. Welcome/reconnect and
  action acknowledgements send that state only to its owner.
- Snapshots contain bounded public events and a server timestamp, never inventory
  or reconnect tokens. Clients derive event age using server time, including late
  joins. Other rooms receive none of these events.
- Strict Zod messages allow only known actions/items, monotonic safe-integer
  sequence/request numbers and no client event coordinates, particle counts,
  inventory values or claimed owner IDs.
- Server validates real room membership, authoritative location/ride state,
  inventory, cooldown and room capacity. Mutation and event creation occur
  synchronously in one Node process. Replayed request IDs never consume twice.
- Existing1KiB messages,20 messages/second/socket, four visitors,32 rooms, heartbeat,
  reconnect reservations and slow-connection limits remain.
- Inventory survives the existing20-second reconnect grace, but not explicit leave,
  expired sessions, page reload or server restart. Solo inventory stays separate
  from room inventory and is not silently uploaded or copied when joining.
- Client locks simultaneous requests and reconciles authoritative replies/reconnects.
  After six seconds without acknowledgement, actions remain locked until a late
  reply or reconnect reconciles inventory. A real-server delayed-frame browser test
  verifies this path. No optimistic consumption is used in rooms.

Production still requires one continuously running Node owner with same-origin
HTTPS/WSS upgrades. Static-only hosting and multiple replicas without shared room
ownership are not supported. No production deployment is claimed.

## Performance and cleanup

- 24 maximum live gameplay events per room; offerings32s, fountains4.2s.
- Three fixed instanced offering families;120 petal instances maximum,24 bowls and
 24 flames. No per-offering material, timer, listener or animation callback.
- One fixed Points buffer for up to two fountains:192 particles low,320 medium,
 480 high; reduced motion uses32 total. Existing background pools remain605/1012/1705
 particles across low/medium/high, below combined budgets of1200 low/4000 high.
- Memoized geometry/directions, reused transforms and pose target; buffer mutation
 in one existing R3F frame callback. Empty effects are hidden. No new canvas or loop.
- Manually created buffer geometry and background sprite/materials are disposed;
 declarative R3F resources retain normal automatic cleanup. Reduced-motion listener
 and acknowledgement timeout have cleanup.
- Hidden tabs skip personal animation work; absolute event ages prevent stale
 effects restarting on return. Existing DPR/shadow/quality settings remain.
- Software-rendered browser captures are not mobile FPS, thermal or GPU-memory proof.

## Executed checks

Commands run from the indicated app directory, unless otherwise noted. Test servers
use the existing isolated demo backend and explicitly clear live credentials.

| Command | Result observed |
| --- | --- |
| Baseline frontend `npm run typecheck`; `npm test`; `npm run build` | Passed;44 tests/18 files; entry325.70kB, lazy scene1012.31kB |
| Baseline backend `npm run typecheck`; `npm test`; `npm run build` | Passed;36 tests/6 files |
| Baseline `npm run test:e2e -- e2e/phase3.spec.ts e2e/phase2.spec.ts` | Interrupted before results; no baseline pass claimed |
| First updated frontend `npm run typecheck`; `npm test` | Failed: wrong test import `clearSegment` from environment.ts, gameplay.test.ts:3/62. Fixed import to actual shared world module |
| Updated frontend `npm run typecheck`; `npm test`; `npm run build` | Passed;49 tests/19 files; later final rerun recorded below |
| Updated backend `npm run typecheck`; `npm test` | Passed;37 tests/6 files, including native WebSocket gameplay authority |
| Initial Phase2/3 regression command, output phase4-regression.log |5 passed/2 failed. Source edits caused HMR during this run; it is not clean release evidence. Four-client room became unavailable; immediate support reopen assertion also failed under slow raster timing |
| First `npm run test:e2e -- e2e/phase4.spec.ts` |0/3 passed: software-raster movement overshoot; collection range mismatch. Corrected shared range and reused Phase2 test-only5Hz raster accommodation |
| Second `npm run test:e2e -- e2e/phase4.spec.ts` |**3/3 passed**,1.7m: keyboard, real CDP touch, both cameras, gifts/consumption, fountain lifecycle and two-room-client shared visibility |
| Root `python -m unittest discover -s scripts -p test_release_zip.py` |**3/3 passed** |
| Root Python ZIP comparison + existing release secret scanner | Baseline matched; updated eligible source scan passed; actual local secret values were not printed |
| Full `npm run test:e2e` | **41 passed/4 failed**,29.1m; failures and subsequent resolutions below. Not a claimed all-green full run |

The new browser tests and final Phase3 tests use a test-only5Hz software-raster
accommodation. The inherited four-client test now uses2Hz to prevent five SwiftShader
contexts starving native socket heartbeats. No assertions or runtime limits were
weakened. They drive real movement, native dialogs, CDP touch,
scene buffers and native WebSockets; they do not mock WebGL or grant inventory through
test hooks. This accommodation says nothing about real-device frame rate.

### Final verification and visual evidence

The full run's four failures were investigated, not deleted:

- Bazaar touch: added tasting description also matched a substring selector for
  the existing product. The product assertion now requires its exact name, matching
  the desktop test. Both six-stall and mobile bazaar tests subsequently passed.
- Desktop music: a fixed dropdown top offset covered its own toggle when the
  toolbar wrapped. Gifts was moved beside the map, and dropdowns now anchor below
  the actual header height. The original open/close/visibility assertion passed.
- Four-client disconnect: software raster load starved other connections. The
  existing test-only raster cap was lowered from5Hz to2Hz; the complete four-client
  capacity, isolation, appearance, movement, disconnect/reconnect/leave case passed
  in30.3 seconds. Server capacity/heartbeat/security logic was not loosened.
- Photo: timed out while capturing presets under software-renderer load. The
  existing raster accommodation was reused at5Hz; original nonblank PNG, download,
  presets, zoom and camera restoration assertions passed in6.6 seconds.

Final commands and observed results:

| Exact command / directory | Result |
| --- | --- |
| Frontend `npm run test:e2e -- e2e/phase4.spec.ts e2e/phase2.spec.ts e2e/phase3.spec.ts e2e/bazaar.spec.ts e2e/phase11.spec.ts e2e/donation-redesign.spec.ts e2e/world.spec.ts e2e/phase1.spec.ts e2e/commerce.spec.ts e2e/phase12.spec.ts` |26 passed/1 failed,8.7m. Only remaining failure was the music offset, fixed afterward |
| Frontend `npm run test:e2e -- e2e/phase11.spec.ts e2e/phase4.spec.ts e2e/phase1.spec.ts e2e/world.spec.ts` |**9/9 passed**,2.5m, after the final CSS fix. Includes all four Phase4 cases, real delayed acknowledgement, reduced-motion touch, first/third cameras and high/low offering rendering |
| Frontend `npm run typecheck`; `npm test`; `npm run build` |**Passed**,49 tests/19 files. Final entry335.56kB, lazy scene1017.45kB; inherited >500kB warning remains |
| Backend `npm run typecheck`; `npm test`; `npm run build` |**Passed**,37 tests/6 files, including authoritative gameplay/native sockets |
| Root `python -m unittest discover -s scripts -p test_release_zip.py` |**3/3 passed** |
| Backend `node --env-file=.env --import tsx --input-type=module -e ...` importing only `loadConfig()` | Local format/pairing valid; database configured; organiser token absent; zero network requests. Values never printed |
| Checkpoint `python scripts/release_zip.py --output C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase4-checkpoint-20261025.zip --extract-to C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase4-checkpoint-20261025` |120-second command deadline exceeded after ZIP/extraction; independent319-entry CRC check passed and all319 files existed. Not treated as a complete packager pass |
| Checkpoint fresh extraction, both apps: `npm ci --offline --ignore-scripts --no-audit --no-fund`; `npm run typecheck`; `npm test`; `npm run build` |**Passed**;114/143 packages installed;49 frontend and37 backend tests. This checkpoint predates final marker/CSS/acknowledgement refinements; final archive receipt is separate |
| Final-source candidate: `python scripts/release_zip.py --output C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase4-final-check-20261025.zip --extract-to C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase4-final-check-20261025` |**Passed**;326 files, CRC, safe root, private/secret exclusions and extracted source-byte comparison |
| Final-source clean extraction, both apps: `npm ci --offline --ignore-scripts --no-audit --no-fund`; `npm run typecheck`; `npm test`; `npm run build` |**Passed**;114/143 packages;49 frontend and37 backend tests; both production builds. Only delivery documentation was updated afterward |
| Source frontend production build: existing `release_zip.scan()` over every file in `frontend/dist` |**Passed**, actual local secret-value and private-image checks |

No unresolved observed test failure remains after targeted fixes/reruns. The complete
suite was not rerun as one final all-green46-case command; the earlier45-case run
and subsequent focused results are deliberately reported separately. Three.js
Clock/CJS/removed-PCFSoftShadowMap warnings remain unsuppressed. No missing browser
or package-install blocker occurred.

Reviewed actual final desktop/mobile flower and fountain screenshots, plus the
high-quality offering capture. Curated screenshots are in
`docs/release/phase4-captures/`; these show real WebGL, not design mockups. The
mobile fountain capture uses reduced motion and is deliberately restrained. Earlier
obscured east-side captures are not presented as final evidence. No physical FPS,
thermal or complete GPU-memory leak certification is claimed.

Final archive integrity, clean extraction, source-byte/secret checks and Desktop
consolidation are recorded in `PHASE4-DELIVERY.md`. ZIP hashes are emitted at delivery
rather than embedded inside their own archive.

## Files changed

Added: `backend/src/shared/gameplay.ts`,
`frontend/src/components/useGameplay.ts`, `frontend/src/components/CollectionPanel.tsx`,
`frontend/src/world/GameplayEffects.tsx`, `frontend/src/world/gameplay.test.ts`,
`frontend/e2e/phase4.spec.ts`, `docs/release/PHASE4-GAPS.md`, this report.
Also added: `frontend/e2e/raster.ts`, `docs/release/PHASE4-DELIVERY.md` and five
curated screenshots under `docs/release/phase4-captures/`.

Modified: `backend/src/rooms.ts`, `backend/src/shared/world.ts`, `backend/src/shared/network.ts`,
`backend/test/rooms.test.ts`, `frontend/src/components/useRoom.ts`,
`frontend/src/components/StallPanel.tsx`, `frontend/src/App.tsx`,
`frontend/src/world/MelaScene.tsx`, `frontend/src/world/FireworkShow.tsx`,
`frontend/src/world/bazaar.ts`, `frontend/src/style.css`, `frontend/e2e/bazaar.spec.ts`,
`frontend/e2e/phase2.spec.ts`, `frontend/e2e/phase3.spec.ts`, `scripts/release_zip.py`,
`docs/PLAYABLE-WORLD.md`, `docs/release/FUTURE-PHASES.md`, `README.md`.

No application source, test, historical report, asset, dependency, lockfile, migration
or feature was removed. Final release-file list and Desktop consolidation are
recorded with the archive receipt; generated logs/dependencies/builds are excluded.

## Known limitations and next phase

Session inventory is intentionally not persistent. Personal fountains currently
have no dedicated sound. River motion is stylized, not a hydrological simulation.
The inherited large Three.js chunk and Clock/CJS/shadow deprecation warnings remain.
Physical device memory/thermal/performance, browser differences and production
networking still need launch QA.

1. **Phase5 audio:** obtain licensed bhajan/Aarti recordings with distribution rights,
   add restrained original/licensed ambience and optional fountain sound, and test
   gesture/autoplay/volume/mute/hidden-tab cleanup on physical phones.
2. **Donation verification:** obtain original provider QR whose decoded recipient
   matches the intended recipient, plus independent ownership/alias verification
   and explicit enablement approval. Do not alter the recipient to match the wrong QR.
3. **Hosting/domain:** select one persistent Node HTTP/WebSocket host, domain and TLS;
   privately supply missing organiser configuration. Verify same-origin HTTPS/WSS,
   restart/reconnect/capacity and operational controls before production.
4. **Final launch QA:** finish any failed browser cases, real-device low/high/mobile
   landscape, camera collision/photo/download, NPC/beggar, four-player/isolation,
   unavailable storage, accessibility and secret/QR exclusion checks. Do not call
   this production-ready until these external gates are genuinely satisfied.
