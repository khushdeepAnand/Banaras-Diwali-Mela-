# Phase 8: integration and verification

## Inputs and provenance

- The supplied Desktop `banaras-diwali-mela-final.zip` was extracted as the authoritative application. It includes both package lockfiles, the SQL migration, API tests, browser tests, setup docs and historical screenshots.
- The Phase 7 work folder has **exactly the same 163 nongenerated source/assets files** as the ZIP (SHA-256 comparison); its large `node_modules` and generated `dist` are not distributable changes. Nothing unique to merge.
- The other Downloads folder has the same 163 source/assets files except `style.css`, `MelaScene.tsx`, `Player.tsx`, `GangaRiver.tsx`. Its CSS removes the existing short-screen controls; rejected. Its higher DPR and shadow maps increase cost without evidence of benefit; rejected. Its water shader repeats expensive per-fragment sine hashing and introduces an unused 3D noise function; rejected. Its narrower wheel camera trigger informed the decision to retain the ZIP's existing full-wheel framing until browser captures could be compared; no unsafe wholesale replacement.
- No new music, third-party images, models, licensing documents or additional migrations were present. The included WAV is labelled an original demo chime, **not** devotional music; see `frontend/public/audio/README.md`. The organiser's existing QR image remains private, not published from the frontend.

## Changes

- Replaced the row of plain boxes behind the market with instanced sandstone-coloured façades, lit and dark openings, cornices, and balconies. The same walking geometry, market entry and kiosk assignments remain.
- Widened follow-camera clearance around the edges of the existing market canopies: the earlier off-centre Ferris-wheel approach could place the camera under a roof. A regression assertion covers that boundary; `ferris-wheel.png` now shows the entire wheel from a safe approach rather than a clipped distant view.
- Added stepped masonry to the opposite bank and instanced warm bank lights. Raised and widened the far façade windows and corrected the tapered temple silhouettes. Removed the flat translucent haze box; distance fog still handles perspective.
- The existing animated multi-directional water shader now warps ghat/Aarti reflections with moving surface waves and adds subtle, broken opposite-bank glints. The original boat wakes and low/medium/high shader detail settings remain.
- Added `frontend/e2e/phase8.spec.ts`, capturing this build at named desktop and touch viewports. This supplements, rather than replaces, the earlier test suite.
- Repeated props share instanced geometry and a few materials; 42/88 opposite-bank lamps use one draw call instead of separate meshes. No new runtime package, service, animation loop, credential, or API change.

## Checks (Node 24.21.0; local macOS Chromium / SwiftShader)

| Command (run from its directory) | Actual result |
| --- | --- |
| `frontend: npm ci --no-audit --no-fund` | Completed, 115 packages |
| `backend: npm ci --no-audit --no-fund` | Completed, 142 packages |
| `frontend: npm run typecheck` | Passed |
| `backend: npm run typecheck` | Passed |
| `frontend: npm test` | 14 files / 27 tests passed |
| `backend: npm test` | 2 files / 11 tests passed |
| `frontend: npm run build` | Passed; Vite warns about scene chunk >500 kB |
| `backend: npm run build` | Passed |
| `frontend: npm run test:e2e -- e2e/phase8.spec.ts e2e/phase8-diagnostics.spec.ts --reporter=list` | 3 passed: desktop scene, two touch sizes, and no captured page/console/network errors |
| `frontend: npm run test:e2e -- --reporter=list` | **24 passed / 0 failed (12.1 min)** on the final scene and camera source. An earlier full run was 22 passed / 1 failed because the new capture test walked into the existing Aarti collision boundary before moving sideways; the route was fixed. An earliest standalone capture test had an escaped-regex mistake returning NaN. Both failures were test-only. |
| `frontend: npm run test:e2e -- e2e/phase8.spec.ts e2e/wheel.spec.ts --reporter=line` | 4 passed after the final camera-clearance change, including desktop/mobile wheel boarding and new screenshots |
| Lint | No lint script/configuration exists in either package; no lint command to run |

Screenshots in this directory were captured from the running **updated** application by Playwright: `desktop-riverfront.png`, `river-reflections.png`, `ganga-aarti.png`, `ghats-architecture.png`, `ferris-wheel.png`, `pendulum.png`, `fireworks.png`, `market-stalls.png`, `mobile-portrait.png`, and `mobile-landscape.png`. The original ZIP's comparison images remain under `docs/phase6/final/`. These are emulated browser viewports, **not** physical-device testing. The desktop screenshots show warmer, wave-broken river highlights and a longer lit far bank; the market view is the most useful comparison for the new façade details. These are still stylised procedural graphics, not optical reflections or a photorealistic reconstruction.

The existing browser tests write into historical `docs/phase4b`, `docs/phase5` and `docs/phase6/final` paths; 25 overwritten historical PNGs were restored byte-for-byte from the supplied ZIP after the final test run. Only `docs/phase8` screenshots represent this release. The pendulum and wheel evidence was retaken from unobstructed viewpoints; a final targeted Phase 8 capture run passed 2/2 after this evidence-only change.

### Local software-renderer timing

After the full browser suite, `node frontend/benchmark-phase8.mjs /path/to/zip-equivalent/frontend` launched one Vite server at a time, with Chromium SwiftShader at 1280×720, DPR 1, one active tab, 2 s warm-up and approximately 4 s of `requestAnimationFrame` samples per setting. The supplied Phase 7 folder is SHA-256 identical to the ZIP source and provided the baseline. Observations (one sample per setting, not stable GPU profiling):

| Scene | Quality | Frames / observed elapsed time | Median frame interval | 95th percentile |
| --- | --- | --- | --- | --- |
| ZIP baseline | Low | 25 / 3.00 s | 116.6 ms | 333.3 ms |
| Phase 8 | Low | 29 / 3.63 s | 116.7 ms | 383.2 ms |
| ZIP baseline | High | 13 / 3.90 s | 333.2 ms | 333.3 ms |
| Phase 8 | High | 13 / 4.02 s | 333.3 ms | 350.0 ms |

The low median remained essentially unchanged; both high-quality scenes are very slow in software rendering. These short single-run samples cannot establish equivalent real-GPU performance or a statistically significant speed difference. Test on physical mobile GPUs before choosing a production default; touch sessions currently select Low and desktop selects High. The scene's production JS chunk is 998.61 kB minified / 263.25 kB gzipped.

## Limitations and production blockers

- Realistic scene-wide reflected geometry, authentic Aarti/bhajan recordings, and physical-device GPU profiling remain unverified/unavailable. The water is a shader approximation; instance reuse avoids increasing draw calls for each new lamp. Do not infer a production FPS improvement from SwiftShader or the browser-test runtime.
- The Chromium run emits Three.js deprecation **warnings** for `THREE.Clock` and `PCFSoftShadowMap`; inspect any actual console errors or failed network requests separately before production.
- Live Supabase storage, manual UTR verification, approved recipient details, payment enablement, HTTPS deployment and server-only credentials must be configured and audited by the organiser. Browser tests exercise only the isolated demo backend. ₹21/₹31/₹51 amount checks, organiser permissions, migrations and pending-manual-review rules were not modified.
- The only supplied audio is a demo chime; obtain explicitly licensed devotional audio and update labels before presenting any as a real Aarti or bhajan. Playback continues to require user action.
