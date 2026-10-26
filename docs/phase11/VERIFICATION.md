# Phase 11 visual polish and verification

Baseline: supplied `banaras-diwali-mela-phase10.zip`, extracted to an isolated working directory. No runtime dependencies, backend endpoints, payment settings or migrations were changed. All 15 project-local skill guides remain in `.opencode/skills/`. No character feature was added.

## Visible differences from Phase 10

- **Overview:** the Ferris wheel rim fits in the desktop 1280 × 720 spawn view; the river, Aarti and skyline remain visible. The market's long overhead support wire no longer bisects the sky. A projection and camera-clearance unit test protects the view; the camera blends back into normal follow behaviour as the visitor walks. The Phase 10 overview cropped the wheel. At the separate wheel approach the rim may extend beyond the screen, as it did previously; the new promise is the initial overview, not every possible camera position.
- **HUD:** desktop Music controls are collapsed by default and expand on request. Contribute, stalls, vendors, graphics, fireworks and Reset remain directly accessible in one top row. Keyboard, touch and landscape UI continue to work. The audio test now exercises opening the panel before controlling audio; it still asserts playback, mute, volume, track failure and persistence across quality changes.
- **River and ceremony:** the existing Ganga shader uses its already-calculated noise to break golden highlights more irregularly; the prominent Aarti lamp column is slightly stronger, and far-bank highlights no longer use a periodic sine stripe. A small warm Aarti canopy trim and slightly restrained ambient fill improve focus without adding a light, reflection render target or bloom.
- **Architecture and fireworks:** alternating temple spire heights and four instanced haveli rooftop silhouettes vary the skyline. Firework sprites are smaller/softer; all original cue timings and formations remain. The screenshot shows a burst, not independent proof of recognisable lotus or Shri Ram formations.

Fresh running-app images in this directory: `desktop-overview.png`, `ferris-wheel.png`, `river-reflections.png`, `ganga-aarti.png`, `fireworks.png`, `market-stalls.png`, `mobile-portrait.png`, `mobile-landscape.png`, plus `ghats-architecture.png`, `pendulum.png` and `audio-controls-open.png`. Phase 10 images remain the unchanged comparison set. Captures use headless Edge/SwiftShader and emulated viewports, not a physical phone.

## Exact checks (Windows, installed Node/npm)

All frontend commands run in `frontend/`; backend commands run in `backend/`.

| Command | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` in each app | Passed; 114 frontend and 141 backend packages from existing lockfiles |
| `npm run typecheck` in each app | Passed |
| `npm test` in each app | Frontend **14 files / 29 tests passed**; backend **2 files / 11 tests passed** |
| `npm run build` in each app | Passed. Vite warned: scene JS **999.57 kB minified / 263.52 kB gzip**, above 500 kB warning threshold; main JS 297.27 kB minified / 93.71 kB gzip |
| `$env:PHASE11_CAPTURE='1'; npm run test:e2e -- e2e/phase11.spec.ts e2e/phase8.spec.ts --reporter=line` | **3 passed**; generated the required new screenshots. An earlier attempt was interrupted by a server restart; only the completed run is counted. |
| `npm run test:e2e -- --reporter=line` | Final run: **27 passed / 0 failed (8.3 min)**. Covers world, audio/Aarti, fireworks, wheel, pendulum, both boats, stalls, vendors, contributions, organiser actions, touch, landscape and diagnostic network/console checks. |
| Lint | No lint script/configuration in either package; not run |

Earlier full attempts failed intermittently in camera-route tests under slow software WebGL: one ferry approach overshot its dock, a later run timed out on several long-held movement/visual-capture steps, and another stopped a wheel approach 1.0 unit from the target. The route tests now use short keyboard or real CDP touch presses (and retain their original boarding/return and position assertions); slow-renderer timeout allowances were raised where necessary. The final full run above passed without retries. These results do not prove the UI runs smoothly on a physical device.

### Software-renderer sample, not a device benchmark

One Edge/SwiftShader 1280 × 720 DPR-1 sample per quality, ~1.2 s warm-up and up to ~3.5 s of `requestAnimationFrame` intervals (not GPU timestamps):

| Scene | Quality | Frames / elapsed | Median interval | P95 interval |
| --- | --- | --- | --- | --- |
| Phase 10 | Low | 25 / 3,310 ms | 141 ms | 167 ms |
| Phase 11 | Low | 25 / 2,835 ms | 108 ms | 166 ms |
| Phase 10 | High | 10 / 3,871 ms | 421 ms | 490 ms |
| Phase 11 | High | 11 / 3,803 ms | 382 ms | 392 ms |

Single short runs are noisy and cannot establish an FPS improvement; High remains very slow on software rendering. The wider opening view draws more scene, but reuse of existing lighting/noise and one instanced rooftop batch avoids large additional per-object costs. No physical-device or WebGL memory profiling was available.

## Remaining production blockers

Physical mobile GPU testing and real-browser accessibility review remain. The bundled audio is only an original demo chime, **not** authentic devotional music; playback requires user action. Live Supabase persistence, authorised organiser configuration, verified recipient details and independent UTR/payment reconciliation must be completed before real contributions are enabled. A submitted UTR is pending manual review, not proof of payment. Historic Playwright capture tests wrote into older phase directories; 41 overwritten historical images were restored byte-for-byte from the Phase 10 ZIP after the final suite.
