---
name: audio-asset-management
description: "Use when adding or changing festival audio, browser autoplay handling, user-initiated playback, loops, sound controls, fallbacks, or licensed audio assets."
---

# Audio and Asset Management

## Purpose

Deliver optional festival sound without autoplay surprises, stuck loops or licensing debt. The experience starts silent with a quiet synthesized tone; preserve that control.

## When to use

Use for `AudioContext`, toggles, music, ambience, effects and audio files. Skip visual-only timing. Token rule: read the sound code in `App.tsx` and the specific asset only.

## Workflow

1. Read the sound state and `toggleSound` in `App.tsx`, plus `public/` for existing audio. Record current behaviour: off by default, click-only creation, low gain, closed on toggle-off.
2. Define the source and lifecycle: one-shot, loop, crossfade or ambient bed. Note its volume ceiling, duration and licence.
3. Start or resume only from a user gesture. Handle `AudioContext` creation and `resume()` rejection; leave the UI off on failure.
4. Reuse one context and one source per role. Fade gain, then stop and disconnect nodes.
5. Add a visible control with `aria-pressed` and a text label that reflects actual state. Do not rely on an icon alone.
6. Clean up on unmount and when the tab is hidden. Never leave a loop running after the player leaves.

## Project rules

- No autoplay, no sound before the user enables it, and no hidden audio on page load.
- Keep default gain modest. The tone is about 0.012; louder music needs an explicit mix decision.
- Prefer original or clearly licensed local files. Record the source and licence in `docs/` when adding third-party audio; do not download assets automatically.
- Use browser-supported formats with a fallback, and handle a missing file without breaking the scene.
- Do not add an audio library for a simple loop. The Web Audio API is sufficient.
- Synthesized nodes must be stopped and disconnected; audio buffers should not be re-fetched on every toggle.

## Failure cases

Sound starting on load, a suspended context that never resumes, duplicate oscillators after StrictMode remount, an audible click at start/stop, a loop surviving unmount, a toggle whose label disagrees with the sound, unlicensed files, and a 404 breaking the HUD are failures.

## Verification

In a browser, enable sound by click, toggle off, enable again, navigate away and remount. Confirm no sound on fresh load and no console errors. Test on mobile touch. Run `npm run typecheck` and relevant tests after code changes.

## Completion criterion

Audio is silent by default, starts only after a gesture, loops and stops cleanly, exposes an accurate control, has a documented licence for every added file, and leaves no orphan node or context after unmount.
