# First playable world

## Phase 4 session gifts supplement

Approach Phool Gali, Deep Jyoti or Ghat Chaat and press E/tap the existing stall
prompt for free virtual gifts. Open **Gifts** to inspect counts and directions.
Offer a flower or diya at the central steps (X0/Z1.15); light your personal virtual
spark fountain at the central celebration pad (X0/Z7). Both points have ground markers
and E/tap prompts. Room visitors see accepted effects; inventories remain private
and session-only. Neither gifts nor displayed sample prices initiate payments.
See [Phase 4 implementation and evidence](release/PHASE4-IMPLEMENTATION-REPORT.md).

## Current Phase 1 supplement (24 October 2026)

The sections below this supplement describe the historical first-playable baseline.
Current source has **X -30..30 / Z0.7..22** walk bounds, spawn **(0,10.5)**, a 62-wide
ground mesh with the top terrace extended to Z24, and camera X -29.5..29.5 /
Z1..22.4. The terrace sampler still caps at3.36. Existing rides, eight stall approach
points and Aarti remain in their original positions.

Walk the lamp-marked east/west side routes at X +/-24, visit the open pavilions at
(+/-27,8.5), and reach the temple forecourt/rear market bypass at Z20.5. Pavilion
columns have collision footprints. Perimeter walls/rails moved outside the expanded
walk rectangle. Repeated new decoration is instanced; no additional dynamic lights.

**Map:** the collapsible SVG map shows real paths/landmarks, your position and avatar
facing (not camera direction). River is at the top, temples at the bottom. Published
vendors only replace the existing two kiosk markers. A boat ride beyond the map is
explicitly labelled; the map does not invent more walkable land. Short screens start
collapsed; Show map reopens it. Tool menus and modal panels take precedence.

Actual current graphics caps are DPR1.25/1.5/1.6, high-only512 shadow map. Player
delta is capped at0.2s with <=0.12-unit collision substeps. These values supersede
the older 1.75/1024/50ms descriptions below. Reduced-motion/firework behaviour,
existing input/audio controls, backend and payment security are retained.

See [Phase 1 evidence and limitations](release/PHASE1-IMPLEMENTATION.md) and
[future phases still pending](release/FUTURE-PHASES.md). Physical-device performance
and follow-camera occlusion at every decorative corner are not certified.

The frontend generates the ghat, stone terraces, temples, river and ~165/330 diyas locally using Three.js geometry and a procedural water shader. No external assets or runtime downloads. The flame cones use emissive instancing with gentle shared flicker; these are *not* hundreds of point lights. The river shader uses animated bands of warm highlights, not physically accurate reflections.

## Controls

- Select **Enter the ghat**; the initial view faces the river.
- Desktop: W/A/S/D or arrows move relative to the camera. Drag the scene to rotate/tilt the follow camera. Keyboard input is ignored when editing or focusing UI controls and cleared on window blur.
- Touch: left joystick moves; drag open scene space to look (a second finger may drag while holding the joystick). Reset restores the spawn and camera. Browser page gestures are disabled only within the full-screen viewport.
- Audio starts **paused**. A visitor can play/pause, mute and adjust the volume of an original local demo chime; it is **not** a devotional recording. The single HTML audio element persists across scene rerenders, and missing files display an error without stopping the world. See [`AARTI.md`](AARTI.md) for replacement with authorised audio.
- Graphics: low caps DPR at 1.25, omits shadow maps and stone seams and halves the step diyas; high caps DPR at 1.75 and enables a single directional 1024² shadow map. Both use ambient/hemisphere fill, fog, a sky gradient, one sun light and limited local Aarti lighting. Diya bowls, flames and halos are instanced, not hundreds of real-time lights. The scene is imported lazily; Vite and R3F manage canvas resize and teardown.
- The lower-left scene label exposes rounded x/z position and camera angle; it helps users orient themselves and makes movement observable in browser tests.

## Collision and camera

`environment.ts` defines an x/z walk rectangle (inside the river edge and enclosing walls), a six-rise terrace height sampler, and four pillar exclusion circles. Movement advances in small substeps with axis sliding so it does not tunnel through pillars at ordinary frame times. Frame delta is capped at 50 ms, acceleration is damped, and any invalid position resets to spawn. The player's height snaps to each terrace step; there is no jumping or falling. The camera follows smoothly and is clamped to avoid the enclosing walls/ground; complex geometry is not raycast for camera obstruction.

**Known limitations:** the simplified collision has no per-mesh collision and cannot navigate behind the temples; terrace transitions are abrupt, and camera obstruction by decorative geometry can still occur at some angles. Stylized water does not reflect individual objects. There is no non-WebGL interactive fallback, no spatial audio, no accessibility alternative to the 3D navigation, and no measured mobile frame-rate guarantee. Graphics changes rebuild some scene components; do not treat this as a calibrated device benchmark. Browser/device checks are necessary before public release.

The production build still reports a large lazy-loaded 3D chunk (approximately 956 kB minified / 253 kB gzip in Phase 4A) containing the renderer. This is a download cost even in low mode; measure real-device startup and frame times before adding more assets or effects. The current Three/R3F dependency combination also logs deprecation warnings for `THREE.Clock` and `PCFSoftShadowMap` in development; browser tests found no page errors, but these warnings remain.

## Browser captures

The Playwright browser tests capture the running WebGL scene, not a design mockup: [desktop, high graphics](scene-desktop.png) and [mobile portrait](scene-mobile.png). The touch test sends actual browser touch input through Chromium's DevTools protocol, checks that the joystick receives `gotpointercapture`, moves the character and drags the camera with a second finger; synthetic `dispatchEvent` alone does not establish pointer capture. Screenshots are generated on Windows using Microsoft Edge's headless WebGL renderer with SwiftShader, so colors and performance can differ on real hardware.
