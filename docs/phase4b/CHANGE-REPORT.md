# Phase 4B implementation report

## Implemented

- Animated multi-direction Ganga shader with layered ripples, bounded broken warm highlights and near-shore colour. Floating diyas remain instanced and bob slightly above the surface. These are shader **approximations**, not physically accurate reflections. Existing temples, six stalls, Ferris wheel, Aarti, keyboard and touch movement remain.
- 38-second automatically repeating fireworks sequence: coloured bursts, falling gold, deliberately traced lotus petals, a symbolic arch/bow/lamp Shri Ram-inspired devotional formation, finale and pause. Bounded geometry is updated in place; low graphics renders fewer points. Use the fireworks toggle; reduced-motion starts with the show disabled.
- Single HTML media element and reusable `useFestivalAudio` hook. User-initiated play/pause/previous/next, volume/mute and status; failed/absent tracks do not stop the world. Portrait controls expand via **Music +**. Original demo chime is labelled as such, not as Aarti. Ambient audio is not implemented.
- Time-based swinging pendulum at left lower ghat with four visible seats, boarding marker, camera follow, safe exit/reset and collision around its supports. The original Ferris wheel state machine remains.
- Small ferry and larger roofed scenic cruise, both with seating, shore boarding markers, cosine out-and-back water routes, follow cameras and safe dock exit/reset. Ferry route lasts 26 s; cruise route lasts 42 s. Boats reset to their starting dock on Exit rather than physically returning in real time. No passenger capacity or physics simulation.

## Audio recordings still required

Only `frontend/public/audio/aarti-placeholder.wav` is bundled: it is an original demo chime. Supply **authorised** recordings as `frontend/public/audio/ganga-aarti.mp3`, `bhajan-1.mp3`, `bhajan-2.mp3` and `devotional-background.mp3`, then set each matching `available` flag to `true` and replace the placeholder title in `frontend/src/components/useFestivalAudio.ts`. Verify public streaming/distribution rights and attribution. Optional licensed river, bell and festival ambience are not included or played. No automatic downloads or copyrighted songs are embedded.

## Changed files

`frontend/src/App.tsx`, `frontend/src/style.css`, `frontend/src/world/MelaScene.tsx`, `GangaRiver.tsx`, `DiyaField.tsx`, `Player.tsx`, `environment.ts`; new `FireworkShow.tsx`, `fireworks.ts`, `PendulumRide.tsx`, `pendulum.ts`, `RiverBoats.tsx`, `boats.ts`, `components/useFestivalAudio.ts`, matching unit tests and `e2e/phase4b.spec.ts`. Updated existing Aarti and bazaar browser tests for the new music controls. Backend unchanged.

## Verification and limits

Run from `frontend`: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e -- --workers=1 --reporter=line`. macOS Node 24.21.0 was used via `.nvm/versions/node/v24.21.0/bin`. Results: install succeeded (115 packages, 0 vulnerabilities); typecheck passed; 24/24 unit tests passed; production build passed (Vite warned the Three.js scene chunk exceeds 500 kB); final full Playwright suite **14/14 passed** in Chromium with SwiftShader. After that suite, a cruise camera obstruction revealed by screenshot inspection was fixed and its ferry/cruise browser test passed again (1/1). River shading is stylised: no real-time planar reflections, dynamic fireworks-to-water lighting or real audio ambience. Bright regular highlights may still appear near the far water horizon in some camera angles; the sky/river composition remains simplified. Wide-screen high graphics can be costly on software WebGL. Backend tests were not run because backend source was untouched.

## Browser screenshots

All captures below are from the running Chromium 3D scene, not concept art: `desktop-fireworks.png`, `water-floating-diyas.png`, `pendulum-rest.png`, `pendulum-motion.png`, `pendulum-riding.png`, `ferry-in-motion.png`, `cruise-view.png`, `mobile-portrait.png` and `aarti-retained.png`. Frames capture an instant of the animation rather than the whole ride.
