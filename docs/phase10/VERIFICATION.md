# Phase 10 — correction and release verification

## Scope and provenance

Baseline: `banaras-diwali-mela-phase9.zip` (211 files, passed ZIP integrity check). Removed only the unintended three 3D characters, their animation/scene component, interaction/dialogue, collision circles, CSS, unit test, browser test, and two character-specific images. Preserved the player avatar, Phase 9 follow camera, water shader and reflection toggle, Ferris-wheel timer fix, all other rides, Aarti, fireworks, bazaar, audio, backend, migration, lockfiles and assets. `docs/phase9/` remains historical; images there do not describe the current scene. Screenshots in this directory are fresh captures of the corrected scene.

The project contains **15 unique `.opencode/skills/<name>/SKILL.md` directories**; each path and `name`/`description` frontmatter was verified. No dedicated project-local `caveman` skill exists. `token-efficient-coding` already documents concise Caveman-style notes and was preserved; no duplicate skill was added. No new dependency was installed beyond `npm ci` from the existing lockfiles.

## Playwright server investigation

The Phase 9 report included a 9-pass/17-fail browser run with `ERR_CONNECTION_REFUSED`, as well as a separate 25-pass/1-fail run with a real wheel-timing assertion. These are different failure classes, not 17 proven product regressions. The Phase 9 Playwright config allowed optional reuse of externally managed servers and started `npm run dev` wrappers, including a backend file watcher; the exact cause of that earlier frontend-server exit was not captured. Phase 10 removes server reuse and launches direct, single-process backend (`node --import tsx src/server.ts`) and frontend (`node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort`) commands. Playwright waits for the backend health endpoint and frontend URL (up to 120 s each) before opening tests. After the focused run both ports were free. The complete run below kept both services available for every test and shut them down normally. This demonstrates stability here; it does not retroactively establish why the earlier process died.

## Exact checks (Windows, local Edge/SwiftShader)

Commands run in `frontend/` and `backend/` respectively unless specified otherwise:

| Command | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` (each app) | Passed; frontend 114 packages, backend 141 packages |
| `npm run typecheck` (each app) | Passed |
| `npm test` (each app) | Frontend 14 files / 28 tests passed, including restored walkable ghat; backend 2 files / 11 tests passed |
| `npm run build` (each app) | Passed; frontend Vite warns that the scene chunk exceeds 500 kB (998.79 kB minified / 263.30 kB gzip) |
| `npm run test:e2e -- e2e/phase10.spec.ts e2e/world.spec.ts --reporter=line` (frontend) | 4 passed; fresh screenshots, controls, no character encounter, desktop and mobile |
| `npm run test:e2e -- --reporter=line` (frontend) | **26 passed / 0 failed (11.9 min)** with fresh Playwright-managed servers; includes Aarti/audio, fireworks, both rides, boats, stalls, vendor/contribution and organiser flows, touch controls, diagnostics, and the Phase 10 checks |
| Production `vite preview` smoke check (Edge/SwiftShader) | Built site entered and animated; no caveman scene marker or prompt, zero page exceptions |
| Lint | No lint script/config exists in either package; not run |

The browser tests are emulated Edge/SwiftShader tests, **not** physical mobile GPU benchmarks. Legacy browser tests wrote into earlier docs folders; 35 historical image files were restored byte-for-byte from the supplied Phase 9 ZIP afterward. The Phase 10 images are `desktop-overview.png`, `open-ghat.png`, `ferris-wheel.png`, `riverfront.png`, `mobile-portrait.png` and `mobile-landscape.png`. Visual review confirms an open ghat with no added characters; the ordinary player avatar and Aarti performers remain by design.

## Remaining work for Phase 11 / deployment

- Initial camera still crops part of the Ferris wheel; the approach view shows it. Desktop audio controls occupy significant space. Reflections, fireworks silhouettes and distant architecture are stylised; none was redesigned in this correction phase.
- No physical-phone profiling was performed. Software WebGL results cannot establish device FPS or memory improvement, though removing the character scene removes its meshes and frame callbacks.
- The bundled recording is an original demo chime, **not** Aarti/bhajan music. Playback remains user initiated. No live Supabase deployment or recipient/payment verification was provided. Contributions begin pending manual review; submitting a UTR is not proof of payment. Do not enable real payments without verified persistence, account details and security review.
