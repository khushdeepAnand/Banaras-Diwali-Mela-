# Phase 6.2 verification

From the updated project (Node.js 24.21.0, existing npm lockfiles):

| Check | Result |
| --- | --- |
| Frontend `npm run typecheck` | Passed |
| Frontend `npm test` | 14 test files, 27 tests passed |
| Frontend `npm run build` | Passed; Vite warns about a >500 kB scene chunk |
| Backend `npm run typecheck` | Passed |
| Backend `npm test` | 2 test files, 11 tests passed |
| Backend `npm run build` | Passed |
| Browser screenshot capture `npm run test:e2e -- e2e/phase6-final.spec.ts` | 3 passed; six new PNGs saved under this directory |
| Targeted commerce + world `npm run test:e2e -- e2e/commerce.spec.ts e2e/world.spec.ts` | 6 passed with an isolated test backend |
| Final full Playwright `npm run test:e2e -- --reporter=list` | 21 passed, 0 failed (9.6 minutes); Aarti, market, rides, fireworks, commerce, world, mobile and final captures included |

The ZIP's saved `frontend/test-results` recorded `ERR_CONNECTION_REFUSED` on port 5174. Vite was not reachable on that port during that run; Playwright now launches it explicitly from the frontend directory on `127.0.0.1:5174`, with a fresh, isolated demo backend on port 3101 for each test run (the normal development API remains on port 3001). Reusing an old demo backend made published vendors from earlier test runs occupy the limited kiosk slots. Browser tests use one worker because concurrent SwiftShader WebGL scenes can starve animation frames and time out screenshots. A capped real-frame delta plus collision substeps keeps walking responsive on slower software GPUs.

The two stale frontend unit assertions were updated to account for the deliberate 14/32 floating-diya counts and to check actual skyline building footprints rather than the old Z-only distance rule. Browser audio assertions account for the looping 12-second demo track and allow the software renderer to settle after switching quality; the track itself is unchanged. No packages or lockfile versions were changed. The Supabase SQL migration, server-only credentials, organiser access control, payment manual review, stalls, rides, fireworks and audio remain in place.

Inspected and retained the eight updated scene files: `GhatDetails.tsx`, `GhatArchitecture.tsx`, `GangaRiver.tsx`, `NightSky.tsx`, `ScenicRiverfront.tsx`, `DiyaField.tsx`, `AartiScene.tsx` and `BazaarScene.tsx`. Only type errors in materials, a reversed reflection viewing direction, overly faint reflection masking, and a mobile-obscuring market support needed scene edits. The original five baseline PNGs and the supplied migration, API/security code, package versions and lockfiles are byte-for-byte unchanged from the supplied ZIP.

The Supabase migration and security controls were preserved and covered by local backend tests; this verification did **not** deploy or run against a live Supabase instance or enable real payments.

The earlier `docs/phase4b/` and `docs/phase5/` screenshots were restored byte-for-byte from the supplied archive after browser tests, which write to those historical paths. Only the six new images in `docs/phase6/final/` represent this delivery's final visual captures.
