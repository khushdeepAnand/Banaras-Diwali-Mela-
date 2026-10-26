# Phase 9 verification — 23 October 2026 (Windows / Edge Chromium, SwiftShader)

## Baseline and changes

The supplied `banaras-diwali-mela-phase8.zip` is the baseline; it passed the ZIP integrity check and was extracted to `Desktop/banaras-diwali-mela`. It did not contain `Cavemen.tsx` or `.opencode/skills/`. The 15 skill guides found in the older local project were consulted as relevant and copied into the extracted project before that older project was deleted. Three original procedural 3D characters, a distance-limited encounter/dialogue UI, collision clearance, a slightly wider follow camera, adjusted water glints, and a software-renderer-safe Ferris boarding timer were added. Existing attractions, commerce, migration and audio systems remain. No external assets or new runtime dependencies were added.

## Actual commands / outcomes

Run from `frontend` unless noted:

| Command | Outcome |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm test` | 15 files / 28 tests passed |
| `npm run build` | Passed; main JS 1,210.14 kB minified / 336.25 kB gzip; large-chunk warning |
| `backend: npm run build` | Passed (includes TypeScript build) |
| `backend: npm test` | 2 files / 11 tests passed |
| `REUSE_EXISTING_TEST_SERVERS=1 npm run test:e2e -- e2e/phase9.spec.ts --reporter=list` | 2 passed: keyboard, touch, dialogue, wave, close; screenshots refreshed |
| `REUSE_EXISTING_TEST_SERVERS=1 PHASE9_CAPTURE=1 npm run test:e2e -- e2e/phase8.spec.ts --reporter=list` | Desktop scene and attraction captures passed; touch test failed at navigation when reused frontend server died |
| `PHASE9_CAPTURE=1 npm run test:e2e -- e2e/phase8.spec.ts --grep "updated touch layouts" --reporter=list` | 1 passed; both mobile screenshots refreshed |
| `npm run test:e2e -- --reporter=list` | **9 passed / 17 failed**: frontend test server stopped responding during the run; the 17 failures were `ERR_CONNECTION_REFUSED` at `page.goto`, not assertions about the scene |
| `REUSE_EXISTING_TEST_SERVERS=1 npm run test:e2e -- e2e/phase8-diagnostics.spec.ts e2e/commerce.spec.ts --reporter=list` | 2 passed / 3 failed: diagnostics and demo contribution passed; vendor application timed out before `pending_payment`; the frontend then stopped responding for two later tests. Do not count commerce as verified end-to-end. |

Additional results recorded during the initial implementation (without reused servers):

| Command | Outcome |
| --- | --- |
| `npm ci --no-audit --no-fund` in frontend and backend | Installed 114 and 141 packages, respectively |
| `npm run typecheck`; `npm test`; `npm run build` in both packages | Passed: frontend 28/28 unit tests, backend 11/11; final frontend build warns about its >500 kB main chunk |
| `npm run test:e2e -- --reporter=line` | **25 passed / 1 failed** (10.2 min). Only failure: wheel stuck in `boarding` after 8 seconds on slow SwiftShader frames. The wall-time timer was corrected afterwards. This is not a passing full suite. |
| `npm run test:e2e -- e2e/wheel.spec.ts --reporter=line` | **2 passed** after the timer correction, desktop and mobile |
| `npm run test:e2e -- e2e/phase9.spec.ts --reporter=line` | **2 passed**: three rendered guests, E/tap encounter, wave, Escape/close, CDP joystick and landscape layout |
| `npm run test:e2e -- e2e/aarti.spec.ts --reporter=line` | **3 passed** after handling software-renderer movement overshoot in the test route |
| `npm run test:e2e -- e2e/aarti.spec.ts e2e/commerce.spec.ts --reporter=line` | **6 passed / 1 failed** before the Aarti test-route correction; vendor application passed in this run |
| `$env:PHASE9_CAPTURE='1'; npm run test:e2e -- e2e/phase8.spec.ts --reporter=line` | Initially **2 passed**, generating Phase 9 views. Later recapture passed mobile but timed out on the long desktop path; don't count the recapture as passed. |
| Production build preview in headless Edge | The built app displayed three animated guests on the canvas; zero page exceptions. Browser-emulated, not a physical phone. |

There is no configured lint command. Historical screenshots overwritten by the legacy E2E suite under `docs/phase4b`, `docs/phase5` and `docs/phase6/final` were restored from the Phase 8 ZIP. `docs/phase9/` holds the new overview, Ferris wheel, water, Aarti, fireworks, market, cavemen, dialogue, portrait, landscape and additional captures. Browser-emulated touch sizes and software rendering **do not** establish physical phone performance. The cavemen screenshot shows all three characters on the actual ghat; the test checks proximity prompts, keyboard E, touch tap, reaction, Escape and close.

## Remaining limits

- A completely passing full browser suite has **not** been established. One full run here passed 25/26; the one failing wheel timer was fixed and its two focused browser tests passed. Another attempted run recorded above lost the frontend test server and cannot verify the affected application tests. Check test-server stability and repeat the full suite before deploying.
- At the initial viewpoint the Ferris wheel remains partly outside frame; the nearby Ferris-wheel screenshot shows it intact. Desktop audio controls still take substantial screen space. Water and skyline remain stylised approximations, not physical reflections or a complete architectural reconstruction.
- The original demo chime is not authentic Aarti audio. Licensed recording, physical mobile GPU testing, live Supabase/persistence configuration, approved recipient/payment verification and production security review remain required. A UTR is pending manual review, never proof of payment.
