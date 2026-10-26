# Ganga Aarti and Dev Deepawali night · Phase 4A

## Play and placement

Install with `cd frontend && npm ci`, then `npm run dev` and select **Enter the ghat**. From spawn (0, 10.5), walk left to roughly x=-6, then down the steps toward z=3.6. The ceremony runs without interaction. Its compact raised platform occupies x≈-10.05…-1.95, z≈1.3…2.8, leaving the direct central path (x=0) and access around both ends open. `world/aarti.ts` defines the approach marker and simplified rectangular platform collision. The Ferris wheel, six stalls, and river boundary are unchanged. A small contextual label identifies the ceremony within viewing distance; it is not a modal gate.

## Animation, light and performance

`world/AartiScene.tsx` creates three stylised priests, handheld multi-tier brass-style lamps, emissive flames, a sandstone dais and garlanded poles. One render-loop callback moves their arms in staggered arcs and adds a slight body sway. High graphics adds restrained transparent smoke and uses two short-range ceremony lights; low uses one short-range light and no smoke. Reduced-motion preference reduces the amplitude and speed rather than freezing the ceremony.

`world/DiyaField.tsx` extends the original six instanced step rows with ordered walkway/edge groups, an audience line, and 12 low / 27 high floating river diyas. Position helpers sample `groundHeight(z)` for every ghat diya and keep floating bowls just above the water at y=-0.11. Bowls, halos and flames are instanced; their shared materials flicker gently, and the river group bobs subtly. Market counters carry a few additional decorative diyas. `GangaRiver.tsx` adds a limited warm near-bank shimmer to its existing procedural shader. **These are stylised highlights, not accurate reflections of individual lights.** A small gradient sky dome and measured cool ambient / warm directional balance maintain depth without new shadow casters.

## Audio is a demo placeholder

The ZIP contains **no authorised Ganga Aarti or bhajan recording**. `frontend/public/audio/aarti-placeholder.wav` is an original, short generated bell-and-drone demo fixture, explicitly labelled in the UI. The original waveform contains no external recording or copyrighted sample; see its [asset note](../frontend/public/audio/README.md). The existing synthetic oscillator has been removed. `components/useCeremonyAudio.ts` manages a single persistent HTML audio element: explicit play/pause, volume, mute, autoplay rejection, missing-file feedback and cleanup on unmount. No sound begins automatically and the scene works in silence.

To use a real recording, obtain documented distribution rights, replace the local audio file (or update `AARTI_AUDIO_URL` to an authorised source), adjust `DEMO_AUDIO_LABEL`, and confirm the MIME type, loop choice, attribution, mobile playback and CSP/hosting behavior. The same audio hook can support a later bhajan playlist without changing the 3D world. Do not describe the bundled fixture as a real ceremony recording.

## Verification and limitations

Unit tests cover navigation and deliberate diya placement, plus audio configuration. Browser checks cover active lamp movement, desktop/mobile approach and collision, actual audio playback after a gesture, volume, mute/pause, missing-file handling, the six stalls, riverfront and Ferris wheel regression. Captures are in [`phase4a/`](phase4a/) and were taken from the running app.

Known limits: the low-poly figures and shader reflections are artistic approximations; no spatial audio or licensed chant is included. The simplified collision does not raycast every canopy or tiny decorative item. Real-device frame-time and audio-licence checks remain necessary before launch. Fireworks, boat rides and payments are outside this phase.
