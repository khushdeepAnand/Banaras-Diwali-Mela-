# Phase 6 — launch experience and deployment readiness

26 October 2026. Work is confined to a new Phase 6 copy. Phase 5 ZIP/folder are
preserved. The `(1)` filename in the brief is absent; the actual supplied ZIP is
`banaras-diwali-mela-phase5-v1-20261026.zip`, SHA-256
`12caa415f8c67ed3a5449ec389d276e36283165d19970c83959bcf966a4cd17c`.
All 364 archive files match the source folder. Neither folder is a Git repository.
Installed project Caveman, token-efficient-coding, responsive-game-ui,
webgl-performance, playwright-visual-qa and release-zip-verification instructions
were read before implementation. No dependencies or lockfiles are changed.

## Implemented

- Existing intro retains the night/teal/gold identity, with a Hinglish invitation,
  browser/free-entry explanation, four SVG activity highlights, explicit sound and
  silent actions and help before entry. Short screens scroll inside safe areas.
- Sound entry invokes the existing single music element from the click itself;
  saved mute/volume preferences remain authoritative. Playback denial is visible
  in the existing radio and does not block entry. No new autoplay effect exists.
- One lazy scene import and one renderer remain. Indeterminate native progress
  reports preparation truthfully until the first actual rendered frame. No timer
  percentage, duplicate asset prefetch or premature 100% is introduced.
- Four shortcuts extend the existing minimap with actual approach coordinates,
  highlighted destinations, map-relative directions and existing-proximity arrival
  cues. They never teleport or move the player. Collisions/input remain unchanged.
- Validated invitation URLs contain only the public ten-character room code.
  Backend/client share the identical uppercase-hex rule. Query links prefill only;
  users explicitly confirm Join. No auto-created room or resume/admin token URL.
  Copy, native share, WhatsApp and selectable-link fallbacks share this same URL.
- Existing capture bridge supplies the rendered PNG. A bounded native 2D canvas
  adds website branding and optional Dev Deepawali 2026 frame. A new scene preset
  includes river/ghats/lights. Preview precedes explicit download. File share is
  feature-detected with honest fallback. Bitmap, canvas and Blob URLs are cleaned.
- SceneError now offers independent verified static screenshots, compatibility
  advice, portal/share links and explicit page retry. Real context loss unmounts
  the renderer and uses the recoverable fallback. No automatic retry loop exists.
- Auto quality reduces only after two consecutive five-second windows below
  24 FPS, with a 30-second cooldown, no upgrades and no oscillation. Manual quality
  disables sampling. Existing real low/medium/high reductions remain unchanged.
- Integration plan now uses the supplied portal URL and source-confirmed Node,
  REST/WS/static/media architecture, provider gates, verification and rollback.

## Tested (executed, not inferred)

Windows, PowerShell, installed Edge headless/SwiftShader. Executed
toolchain: Node 24.18.0, npm 11.16.0, Python 3.12.10; host CPU Intel Core
i5-12500H. The CPU description does not identify a tested physical GPU.
Baseline and updated commands in each app: `npm ci --offline --ignore-scripts --no-audit --no-fund`,
`npm run typecheck`, `npm test`, `npm run build`. Installs succeed: frontend 114,
backend 143 packages. Baseline frontend 56/backend 39 tests pass. Updated frontend
61 tests in 22 files and backend 39 tests in 6 files pass; both builds/typechecks pass.

- Frontend `npm run test:e2e -- e2e/phase1-profile.spec.ts` before edits: 1/1 pass.
- Frontend `npm run test:e2e -- e2e/phase6-launch.spec.ts`: 9/9 pass, 1.1 minutes.
  Actual local playback, explicit permission denial, delayed real lazy chunk,
  fresh independent mobile invitation/join, copy/native-unavailable paths,
  invalid/unavailable rooms, walking/arrival, real framed PNG, processing failure,
  deliberately unsupported WebGL and real WEBGL_lose_context recovery are exercised.
  Expected renderer errors from deliberate unsupported-WebGL injection are not
  represented as unexpected gameplay errors.
- Root `python -m unittest discover -s scripts -p "test_*.py"`: 6/6 pass
  (release policy, audio integrity and approved QR/private-image policy).

Frontend `npm run test:e2e`: **63/63 passed**, 17.4 minutes, no retries. This is the
complete collected suite, including existing Phase 4/5 and long historical scenic
and ride cases. Final review then corrected loading text bleeding behind the
welcome panel, a landscape map-toggle/header overlap, frame-checkbox target height,
stale help text and cleanup of hidden dialogs/audio after scene failure. No world
geometry, backend state or existing gameplay assertion was changed by that cleanup.
An extra lazy-import failure/manual-retry test and positive invite-clipboard check
were added. The first affected-path run passed 29/30, with the four-client case
timing out. A diagnostic `--grep "four independent" --trace on --repeat-each=2`
confirmed the timeout; its first repetition failed and the outer 480-second shell
limit interrupted the second. It is not counted as passing.

Trace proof: the short-height rule also matched 360x480 portrait, placing the map
over Visitor tools; the unfinished click logged `<aside class="minimap" ...>
intercepts pointer events`. This was an introduced layout regression, not a room
capacity or reconnect failure. A narrow short-portrait override places the map
left of the toolbar. A new 360x480 case checks real center-point hit targets for
Together, camera and Visitor tools; no existing assertion was removed or weakened.

Final command from frontend:

```powershell
npm run test:e2e -- e2e/phase6-launch.spec.ts e2e/phase3.spec.ts e2e/phase5.spec.ts e2e/phase1.spec.ts e2e/world.spec.ts e2e/phase2.spec.ts e2e/phase4.spec.ts
```

**30/30 passed**, 4.4 minutes, without retries, after the evidenced fix. Includes all
10 final launch cases, real four-client capacity/isolation/reconnect/appearance,
Phase 4/5, both camera modes, PNG capture and actual CDP touch input. Final frontend
typecheck, 61 tests and production build were then rerun successfully. The complete
63-case run predates final UI cleanup; it is not misrepresented as a second full
64-case run. The final 30-case gate covers every affected path and the added case.

Regression coverage: environment/landmarks (`phase1`, `phase8`, `aarti`); NPC/beggar,
four-player capacity/isolation/reconnect/appearance (`phase2`); wardrobe, cameras,
photo/PNG (`phase3`); bounded gifts, downstream offerings and personal fountain
(`phase4`, `bazaar`); fireworks/boats/pendulum/wheel (`phase4b`, `wheel`); radio,
credits, mute/volume/lifecycle (`phase5`, `aarti`); donation QR safeguards, vendor
publication and isolated auth/storage failures (`donation-redesign`, `commerce`,
`phase12`, backend tests). No automated test makes live Supabase mutations or
establishes production database/RLS/auth health.

Expected fault-injection renderer errors remain visible. The broad run also logged
a development WS proxy `ECONNABORTED` during room-client teardown; related room
tests passed. Existing Clock/shadow warnings and the intentional unmatched test
route warning remain. One operator invocation mistakenly ran the three npm checks
at the repository root, which has no package.json: ENOENT. The same actual scripts
were rerun successfully from `frontend/`; this was not an application regression.

The existing approved QR/audio assets, auth/config/commerce, gameplay rules and
movement code, manifests and lockfiles were compared against the Phase 5 ZIP:
all 33 protected files are byte-identical. An actual release scanner run over
eligible source and the production frontend passed; it is repeated at packaging.

## Performance evidence and limits

Baseline same-machine draw-call/triangle maximum samples at spawn with fireworks
off, Edge/SwiftShader, 1280x720 viewport, DPR 2 input (runtime tier caps apply):
low 604 / 64,816; medium 637 / 93,068; high 913 / 112,760.
`phase6-captures/before-workload.json` records the executed probe. These are renderer
workload counts, **not hardware FPS**. No actual phone/GPU/thermal benchmark exists.
Post-change full-suite probe: low 604 / 64,816; medium 636 / 93,056;
high 915 / 112,784. See `phase6-captures/after-workload.json`. Workload is effectively
unchanged (small dynamic crowd variation), not a claimed FPS improvement. This
probe precedes the final UI/cleanup-only corrections, which add no geometry.

Baseline production assets: entry 352.41 kB (gzip 111.86), lazy scene 1017.45 kB
(269.67), CSS 30.34 kB (7.34). Final app build: entry 362.95 kB (115.34),
scene 1018.27 kB (269.96), CSS 34.07 kB (8.09). The large lazy chunk and existing
Three Clock/CJS/shadow deprecation warnings remain visible. No scene/gameplay
feature is removed to improve counts. Photos cap the long edge at 1920 pixels;
gallery assets load only for fallback. Hosting compression/cache guidance is
documented, not represented as configured on a public server.

## Blocked and Not Implemented

**Blocked:** hosting provider/plan/portal technology and approved game hostname;
Node/WS/proxy/TLS capability confirmation; privately supplied production environment
and separately authorised storage/auth verification; physical-device audio/mute,
native sharing, downloads and sustained GPU/thermal checks; physical bank-app QR
review; rights-cleared actual Ganga Aarti recording. Existing licensed/original
audio and donation recipient/QR bytes/safeguards are preserved.

**Not Implemented:** deployment, portal editing, DNS/TLS/hosting/database/payment
changes, `/mela/` path migration, multi-process ownership or new persistent data.
No native iOS/Android share delivery or WhatsApp delivery is claimed tested.

Phase 7 work remains separate: full stamp-card progression, persistent activity
rewards, rangoli editor, new mini-games/emotes, large finale, Akash Deep lantern
event and sponsorship/payment systems. No such systems are added here.

## File inventory and release

Added:

```text
docs/release/PHASE6-GAPS.md
docs/release/PHASE6-IMPLEMENTATION-REPORT.md
docs/release/PHASE6-WEBSITE-READINESS.md
docs/release/phase6-captures/before-workload.json
docs/release/phase6-captures/after-workload.json
frontend/e2e/phase6-launch.spec.ts
frontend/public/gallery/README.md
frontend/public/gallery/riverfront.png
frontend/public/gallery/temple-court.png
frontend/src/components/LaunchExperience.tsx
frontend/src/components/photoFinish.ts
frontend/src/components/sharing.test.ts
frontend/src/components/sharing.ts
frontend/src/launch.css
frontend/src/world/adaptiveQuality.ts
frontend/src/world/phase6.test.ts
```

Modified:

```text
README.md
backend/src/rooms.ts
backend/src/shared/network.ts
docs/release/WEBSITE-INTEGRATION-PLAN.md
frontend/e2e/aarti.spec.ts
frontend/e2e/bazaar.spec.ts
frontend/e2e/commerce.spec.ts
frontend/e2e/donation-redesign.spec.ts
frontend/e2e/phase1-profile.spec.ts
frontend/e2e/phase1.spec.ts
frontend/e2e/phase10.spec.ts
frontend/e2e/phase11.spec.ts
frontend/e2e/phase2.spec.ts
frontend/e2e/phase3.spec.ts
frontend/e2e/phase4.spec.ts
frontend/e2e/phase4b.spec.ts
frontend/e2e/phase5.spec.ts
frontend/e2e/phase6-final.spec.ts
frontend/e2e/phase8-diagnostics.spec.ts
frontend/e2e/phase8.spec.ts
frontend/e2e/wheel.spec.ts
frontend/e2e/world.spec.ts
frontend/src/App.test.tsx
frontend/src/App.tsx
frontend/src/components/Minimap.tsx
frontend/src/components/RoomPanel.tsx
frontend/src/components/VisitorPanels.tsx
frontend/src/components/useRoom.ts
frontend/src/main.tsx
frontend/src/world/CaptureBridge.tsx
frontend/src/world/MelaScene.tsx
frontend/src/world/navigation.ts
frontend/src/world/visitorView.ts
scripts/release_zip.py
```

Removed: none. Existing E2E entry locators now select **Enter Silently**; every
prior gameplay assertion remains. The existing photo test explicitly reviews the
preview and clicks download before retaining its original PNG/nonblank checks.

Final curated captures, added under `docs/release/phase6-captures/`:

```text
welcome-desktop.png
welcome-390x844.png
welcome-844x390.png
loading.png
map-360x480.png
map-390x844.png
map-844x390.png
photo-390x844.png
mobile-invitation.png
photo-preview.png
watermarked-photo.png
webgl-fallback.png
```

Actual final welcome, compact portrait/landscape map and watermarked PNG were
visually reviewed; fallback/phone photo layout was also reviewed. Short maps and
photo panels intentionally scroll; no physical phone/native share certification
is inferred. Historical gallery provenance is in `frontend/public/gallery/README.md`.

## Tested: release and clean extraction

Root command:

```powershell
python scripts/release_zip.py --output C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase6-verify-20261026.zip --extract-to C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase6-verify-20261026
```

Passed: 392 files, 131,613,676 bytes; SHA-256
`b9dc262bea923fee010a6bd207c144e1fdb2ac058f6715af5bd1020272a85914`.
This is the **verification** archive, before this final documentation-only receipt.
CRC, safe single root/forward-slash paths, forbidden/private/env exclusion, secret
scan and every extracted source-byte comparison all passed.

From each app in the fresh extraction:

```powershell
npm ci --offline --ignore-scripts --no-audit --no-fund
npm run typecheck
npm test
npm run build
```

Both installs, both typechecks, frontend **61/61**, backend **39/39** and both
production builds passed. Frontend output hashes/sizes match the working build.
Root release/audio/QR tests passed **6/6**. No real env/private file, dependency,
build output, browser trace/result, log or cache ships in the archive.

Final publication path:
`C:/Users/khush/Desktop/banaras-diwali-mela-phase6-v1-20261026.zip`.
It is created only after the gates above. The same packager rechecks its final
documentation-inclusive contents and extracts them to a separate new delivery
directory. Final ZIP size/count/SHA-256 are emitted in the terminal delivery
receipt, outside the ZIP to avoid a self-referential hash. The Phase 5 ZIP is never
overwritten. Only this report changes after the verified app/test/asset bytes.

Archive must retain one
`banaras-diwali-mela/` root, source/tests/docs/lockfiles/assets/example configuration
and installed project skills; exclude real env/private files, dependencies, builds,
browser output, logs and caches. All local project and extraction gates have passed;
provider-specific and physical-device launch blockers above remain explicit.
