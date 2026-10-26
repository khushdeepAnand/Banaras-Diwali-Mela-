# Phase 4A · Night atmosphere and Ganga Aarti

## Baseline

The supplied Phase 3B.3 ZIP was extracted and compared against the working copy before editing. It already had keyboard/touch movement, six interactive stalls, a working Ferris wheel, a procedural water shader and six orderly rows of instanced diyas. The diya placement was mostly uniform; the river had no floating diya geometry; there was no Aarti attraction. The Sound button produced only a 110 Hz oscillator and the ZIP included no authorised devotional recording.

## Changes

- `frontend/src/world/AartiScene.tsx`, `aarti.ts`: compact raised riverside dais at x=-6, z≈2.05 with three animated stylised priests, handheld tiered lamps, garlands, brief smoke on high, one/two local lights and a nearby label. Platform collision leaves the central river route and side passages open. Reduced-motion preference limits movement.
- `frontend/src/world/DiyaField.tsx`, `BazaarScene.tsx`: retain the original instanced terrace rows, add deliberate path and Aarti audience lighting, subtle instanced flame halos, sparse floating river diyas and a few stall counter lamps. Low graphics uses fewer instances.
- `frontend/src/world/NightSky.tsx`, `MelaScene.tsx`, `GangaRiver.tsx`: inexpensive cool twilight gradient, measured ambient/directional colour and gentle near-bank warm shader shimmer (not true per-lamp reflections).
- `frontend/src/components/useCeremonyAudio.ts`, `App.tsx`, `style.css`, `frontend/public/audio/*`: one persistent HTML audio element with explicit play/pause, volume, mute and missing-file feedback. The bundled original demo WAV is **not** a Ganga Aarti recording; see `frontend/public/audio/README.md` and `docs/AARTI.md` for replacing it lawfully.
- `frontend/src/world/environment.ts`: small collision boundary around the new dais; no other map expansion.
- Unit tests: `aarti.test.ts`, `DiyaField.test.ts`, `useCeremonyAudio.test.ts`. Browser test: `frontend/e2e/aarti.spec.ts`; existing stall test sound-control locator updated for the new labelled control. `README.md`, `docs/PLAYABLE-WORLD.md`, and `docs/AARTI.md` updated.

## Checks actually run

From `frontend/`, using Node 24 and the existing npm lockfile:

| Command | Result |
| --- | --- |
| `npm ci` | Succeeded; 115 packages installed, 0 reported vulnerabilities. |
| `npm run typecheck` | Passed. |
| `npm test` | Passed: 18 tests in 8 files. |
| `npm run build` | Passed, with the pre-existing large 3D-chunk warning (~956 kB / 253 kB gzip). |
| `CI=1 npm run test:e2e` | Passed: 9 Chromium tests, including six-stall and Ferris wheel regressions, desktop/mobile Aarti approach, continuing lamp animation, audio playback/error handling and restored movement. |

The browser logged existing Three.js deprecation warnings but tests captured no new page errors. A deliberately missing audio file produced visible fallback text while the WebGL world stayed available. Backend checks were not run because backend files were not modified. No real-device frame-time or audio-licence test was performed.

## Actual browser captures

- [Overall desktop · market, ghats, river and ceremony](overall-mela-desktop.png)
- [Desktop approach to animated ceremony](aarti-close-desktop.png)
- [Desktop Aarti with river behind](aarti-river-desktop.png)
- [Overall mobile riverside](overall-mela-mobile.png)
- [Mobile ceremony and usable controls](aarti-mobile.png)
- [Dense market diyas and night lighting](diya-night-market-desktop.png)
- [Riverfront diya density from spawn](diya-riverfront-desktop.png)
- [Mobile market route from the wheel](market-from-wheel-mobile.png)

Captures come from the running Chromium/SwiftShader WebGL app, not illustrations. The ceremony and lamps read clearly on approach; the stylised figures, shader reflections and demo chime are explicitly placeholders for a fuller production-grade experience. Do not describe the chime as an authorised devotional recording. Fireworks, boat rides, payments and backend integration remain out of scope.
