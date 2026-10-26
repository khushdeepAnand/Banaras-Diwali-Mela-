# Phase 1 — world, navigation, visual polish and performance

24 October 2026. Local implementation only; single-player. No deployment, live database
access, schema change, payment setting change or later-phase feature implementation.

## Source and rollback

Authoritative input: `C:\Users\khush\Downloads\banaras-diwali-mela-phase0-audit.zip`.
SHA-256: `7dbfc4358ca93905cdc2d2d660581fe3b0d0e4b4ea8189977e85fb3a192c9bf8`.
Extracted into a new Desktop Phase 1 folder; older Desktop source was not overwritten.
Rollback ZIP copied and hash-verified at
`C:\Users\khush\AppData\Local\Temp\opencode\banaras-phase1-rollback-20261024`.
Original Downloads audit ZIP stays untouched. Phase 0 report and all 16 project skills
are preserved. No Git repository/history existed. Local rollback storage is not an
off-device backup; retain the original audit ZIP independently.

## Baseline contract inspected before edits

- Walk rectangle X -21..21, Z 0.7..18.5; spawn (0,10.5); terrace sampler rises 0.48
  per 3 Z units, caps at 3.36. Ground is procedural box geometry, not a physics mesh.
- Four pillars at X -16,-8,8,20 / Z13.5; stalls X -16,-9.6,-3.2,3.2,9.6,16 at
  Z16.65; two kiosks X +/-20.4. All eight approach points use Z14.5.
- Wheel board (15.5,8.35), exit (15.5,8.6); pendulum board (-16.5,9.1), exit
  (-16.5,9.3); ferry dock (4,1.15), cruise dock (17,1.15); Aarti viewing (-6,3.65).
- Camera originally X +/-20.5, Z1..19.2; yaw/pitch drag, adaptive FOV, smoothed follow.
  Walking uses <=0.12-unit substeps with frame delta capped at **0.2s** in actual
  source (some historical docs/skills incorrectly say 0.05s). Preserved that behaviour.
- Actual DPR caps 1.25/1.5/1.6 low/medium/high; high-only 512 shadow map, not the 1024
  stated in older docs. Keyboard and captured-pointer touch joystick already exist.
- Baseline Windows Node 24.18.0 / npm 11.16.0 / Python 3.12.10. Both `npm ci
  --no-audit --no-fund` succeeded with unchanged lockfiles. Backend npm noted an
  unapproved esbuild install script; tests/build/tsx still worked. No dependency added.

## Implementation and changed files

- `frontend/src/world/environment.ts`: walk bounds X +/-30, Z0.7..22; matching camera
  limits, shared ghat width62, pavilion post exclusions, finite-coordinate guard.
  Stall collision is now bounded in depth, allowing the new rear market bypass.
- `GhatArchitecture.tsx`, `GhatDetails.tsx`: genuinely wider walkable terraces, extended
  upper landing to Z24, relocated perimeter walls/curbs, full-width paving. Removed
  98 redundant high-quality individual stone-seam meshes; existing instanced paving
  already provides joints. Existing temples remain, now approached through a forecourt.
- `FestivalPromenades.tsx` (new): distinct open west/east mandapas with varied roofs,
  edge rails, warm lamp accents, forecourt inlays and two-sided route signs. Repeated
  stone/posts/rails and emissive accents use two instanced box meshes. No new lights,
  shadows, imported assets, render targets or dependencies. Texture cleanup included.
- `navigation.ts` (new): shared actual-world route polylines used by both physical
  paving and SVG map; real stall, ride/dock, Aarti, pavilion and court coordinates.
- `components/Minimap.tsx` (new), `App.tsx`, `style.css`: compact collapsible SVG map,
  player position and **actual avatar heading**, boundary/path and landmark markers,
  vendor-aware kiosk names. Updates reuse existing ~5Hz telemetry, never another
  render loop/3D scene. River rides report actual pose and explicitly label off-map
  travel; the arrow clamps only at the map edge. Map hides behind open tool menus
  and dialogs, defaults collapsed on short screens, and preserves gameplay controls.
- `Player.tsx`, `MelaScene.tsx`: expanded camera bounds, new scene module and third
  heading telemetry argument; reset clears avatar heading as well as position/yaw.
  Existing ride cameras, controls, quality, Aarti/audio/fireworks and commerce retained.
- `GangaRiver.tsx`: corrected reflection view-angle normal to world Y-up (previously
  Z-up). Existing inexpensive stylised highlights, water height and shader retained;
  these are not physically accurate object reflections.
- `environment.test.ts`: old outer-wall assertions moved to the actual new boundary.
  `navigation.test.ts` adds sampled routes, flood-fill connectivity, all destinations,
  map math/heading, finite inputs and slow-frame pavilion collision regression checks.
- `e2e/phase1.spec.ts`, `e2e/phase1-profile.spec.ts`: real keyboard route tour,
  minimap movement/reset/collapse and control hit-testing across three compact sizes;
  temporary-in-browser WebGL call/triangle instrumentation (no production debug UI).
- `scripts/release_zip.py`, `scripts/test_release_zip.py`: exclude **all private
  directories and organiser-prefixed media** from release; remove obsolete requirement to ship organiser QR.
  Inspection also found a historical QR copy and organiser-account screenshot in
  `docs/phase5`; both remain local but are now excluded from the release archive.
  Local backend/private file remains intact. Existing API QR access/recipient guard
  is untouched. A release recipient must provision any approved private QR separately.
- `backend/test/commerce.test.ts`: all original assertions retained; when a clean
  extraction has no private QR, create exclusive temporary JPEG boundary bytes for
  the existing transport-gating test and remove them after the test. This fixture
  is not a decodable image/payment QR. Backend production source remains byte-identical.
- Documentation: this report, current playable-world supplement, future-phase ledger.

Playable bounding area grows from 747.6 to 1278 square world units (+71% before
obstacle subtraction). Connected side walks X +/-24 join the river edge, main
cross-aisle, eight stall approaches and rear court at Z20.5. Pavilion access branches
avoid their collidable columns. No fake vendor locations or invented interactions.

## Verification log

Commands run from indicated package directory unless stated. Test servers use the
existing isolated in-memory demo backend on3101 and Vite5174. No live Supabase calls.

| Stage | Command | Actual result |
| --- | --- | --- |
| Baseline frontend | `npm run typecheck`; `npm test`; `$env:NODE_ENV='production'; npm run build` | PASS; 14 files/30 tests; build PASS |
| Baseline backend | `npm run typecheck`; `npm test`; `npm run build` | PASS; 4 files/25 tests; build PASS |
| Baseline browser | `npm run test:e2e -- e2e/world.spec.ts e2e/phase1-profile.spec.ts` | PASS 3/3, 1.6m; keyboard, touch, before captures/workload |
| New route regression, first run | `npm run typecheck`; `npm test` | Typecheck PASS; one new route failed at (-25.65,10.5): crossed pavilion post clearance. Fixed real path with central access branches; no assertion weakened |
| Updated frontend | `npm run typecheck`; `npm test`; `$env:NODE_ENV='production'; npm run build` | PASS; 15 files/35 tests; build PASS |
| Focused updated browser | `npm run test:e2e -- e2e/phase1.spec.ts e2e/phase1-profile.spec.ts e2e/world.spec.ts` | PASS 5/5, 2.4m |
| Full browser suite | `npm run test:e2e` | PASS **33/33**, 20.4m; all original30 plus3 new; no retries |
| Final backend | `npm run typecheck`; `npm test`; `npm run build` | PASS 4 files/25 tests, including unchanged QR authorisation assertions |
| Root smoke | `node scripts/smoke_backend.mjs` with test mode and live credentials cleared | PASS: compiled liveness, unavailable persistence, organiser fail-closed, JSON404, redacted unsafe startup |
| Root packaging tests | `python -m unittest discover -s scripts -p test_release_zip.py` | PASS 2/2; env/generated/private/organiser-media exclusions and required source/examples/skills |
| Clean source verification | Both packages: `npm ci --offline --ignore-scripts --no-audit --no-fund`; `npm run typecheck`; `npm test`; `npm run build` (frontend NODE_ENV=production) | PASS: frontend35/backend25, both builds. No private QR in clean copy; transport fixture cleaned up after test |
| Final source frontend | `npm run typecheck`; `npm test`; `$env:NODE_ENV='production'; npm run build` | PASS 15 files/35 tests; production build PASS |
| Final browser subset, after both camera fixes | `npm run test:e2e -- e2e/phase1.spec.ts e2e/phase1-profile.spec.ts e2e/world.spec.ts` | PASS **5/5**, 2.7m; all three workload budgets asserted; fresh desktop/portrait/landscape captures inspected |

Archive validation receipt is emitted by the release command below and reported at delivery. Baseline checks had
no application failures. A diagnostic read of a nonexistent `diyaLayout.test.ts`
failed; actual relevant tests were inspected instead. This was not a test failure.
Initial normal `npm ci --no-audit --no-fund` attempts in both clean temporary copies
timed out after120s while reifying cached packages. Retrying explicitly offline with
scripts disabled succeeded (backend31s/frontend24s); lockfiles unchanged. This was an
installation-environment limitation, not an application test failure.

Screenshot review after the full run caught a rear-bypass camera passing through
stall roofs, plus new layout captures taken before the 3D scene had rendered. Final
camera clearance now stays on the rear side when following a player behind the
market, and in front of canopies when following a river-side player even if the
candidate camera is beyond the canopy's footprint; route tests cover both rules.
New layout tests wait for real Aarti frame
telemetry before capture. Full33 suite above preceded this small camera correction;
the complete affected world/navigation/profile subset is rerun after it. Existing
original-suite assertions were not weakened or removed.

## Measured workload and budgets

Edge Chromium on Windows, headless SwiftShader, desktop1280x720, device scale2,
stationary spawn, fireworks explicitly off, low/medium/high existing DPR caps.
Browser instrumentation wraps actual WebGL draw calls and samples ten recent rendered
frames after six seconds at each tier; the final test clears samples per tier and
waits for at least12 fresh frames. Maximum counters include shadow passes.
These counters measure workload, **not GPU time, FPS or physical-device performance**.

| Tier | Before calls / triangles | Final calls / triangles |
| --- | --- | --- |
| low | 610 / 56,372 | 608 / 60,932 |
| medium | 631 / 82,832 | 636 / 87,812 |
| high | 976 / 102,764 | 919 / 107,000 |

Targets based on this same measured scene: calls <=baseline+40; triangles <=baseline
times1.2. All focused samples meet those targets. Counters vary with wheel culling;
this is not a universal budget for every scene position/firework cue.
Production lazy scene: 999.57kB ->1002.28kB (+2.71kB); gzip263.52 ->264.46kB.
Entry JS297.59 ->302.66kB. The >500kB chunk warning remains; no threshold suppressed.
Three Clock, PCFSoftShadowMap and CJS deprecation warnings remain pre-existing.

Real desktop60FPS / midrange phone30FPS / p95<=50ms are **unverified goals**, not
achieved results. Physical phones/GPUs, Safari/Firefox, sustained ten-minute thermal
tests and memory-disposal soak require real hardware and remain release gates.

## Limitations and preserved future work

Collision is still point/footprint based, not a physics engine; ground snaps to
terraces. Grid/route sampling proves the specified contract, not every imaginable
camera angle. Decorative close geometry may occlude the follow camera at some angles.
Distant banks remain scenery and are not advertised as playable. Minimap is an
orientation aid, not routing/teleportation or an accessibility substitute for 3D.
Markers use accessible SVG titles, with compact shared legends; no pathfinding UI.

All Phase2–7 requirements remain deferred in `FUTURE-PHASES.md` and the untouched
Phase0 roadmap, including real multiplayer/NPCs, mouth-object/character work,
camera modes/clothing/photo, inventory/offerings/personal effects, licensed bhajans,
beggar donation reuse/caption and independently verified recipient/QR. No public
donations, production mutations, payment configuration changes or deployment occurred.

## Capture comparison

Current evidence is under `phase1-captures/` next to this report. The desktop spawn
pair uses the same1280x720/high/scale2/fireworks-off setup: baseline
`before-desktop-high.png` and updated `after-desktop-high.png`. The new scene retains
the wheel/Aarti/river composition, adds legible route inlays and the true-coordinate
map; river highlights remain stylised. Wheel rotation varies between captures.

`east-promenade.png` shows actual exploration beyond the old X21 wall, with pavilion,
edge lamps and rails. `temple-forecourt.png` shows the reachable rear route, existing
temples and new signs with the avatar visible after camera correction. Portrait and
landscape captures show the rendered scene and unobscured joystick/reset/toolbar;
the open landscape map intentionally uses extra space and can be collapsed. Older
`before-mobile.png` is a baseline touch-test pose, not an identical-camera visual
benchmark. All captures were inspected; none is hardware-performance evidence.

No screenshots of private organiser/payment assets were added to current evidence.
Historical organiser media is retained locally but excluded by packaging rules.

## Release gate and Desktop cleanup

Target: `C:\Users\khush\Desktop\banaras-diwali-mela-phase1-v1-20261024.zip`.
Run from project root:

```powershell
python scripts/release_zip.py --output C:\Users\khush\Desktop\banaras-diwali-mela-phase1-v1-20261024.zip --extract-to C:\Users\khush\AppData\Local\Temp\opencode\banaras-phase1-v1-extracted
```

The existing stdlib packager scans eligible source, enforces one
`banaras-diwali-mela/` root and safe paths, verifies every ZIP CRC, extracts into a
new directory, scans extracted files, and compares every extracted file byte-for-byte
with source. Its JSON receipt supplies exact file count, size and SHA256 at delivery.
Do not publish any failing output. Private organiser assets, real envs, dependencies,
caches, browser test output and builds are excluded. The production bundle is also
scanned separately before handoff. Repeat both package typechecks/tests/builds on
the clean extraction; no live service credentials are needed.

Only after that gate succeeds, move the two superseded Desktop source directories
and three old project ZIPs into
`C:\Users\khush\AppData\Local\Temp\opencode\banaras-phase1-rollback-20261024\desktop-originals`.
This removes obsolete Desktop copies without destroying possible user work. Keep
the Phase1 working folder and new versioned ZIP on Desktop. The Downloads Phase0
audit ZIP and its hash-verified rollback copy must remain unchanged.
