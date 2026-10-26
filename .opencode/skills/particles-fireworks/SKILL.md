---
name: particles-fireworks
description: "Use when adding or changing Diwali fireworks, lotus and Shri Ram-inspired formations, trails, particle lifetimes, smoke, bounded particle counts, or effect cleanup."
---

# Particles and Fireworks

## Purpose

Add bounded, Banaras-specific fireworks that clean up completely. Effects are accents, not the main scene.

## When to use

Use for bursts, trails, smoke, sparkles and timed sequences. Do not use for GLSL, lighting or architecture. Token rule: inspect the scene and effect file only.

## Workflow

1. Read `MelaScene.tsx`, `webgl-performance` constraints, and `DiyaField.tsx` for the instancing pattern already used.
2. Choose one or two respectful motifs: a radial lotus, a soft temple-lamp bloom, or an abstract bow-and-arrow arc. Do not render text, portraits or religious figures as particles.
3. Define the burst lifecycle: launch, expand, trail decay, smoke fade, removal. Use a fixed pool with per-particle birth time, position, velocity, colour and life.
4. Implement with a single `Points` or instanced system per effect family. Update buffer attributes in `useFrame`; allocate nothing per frame.
5. Integrate as an opt-in trigger or a restrained timed sequence after entry. Keep the default view uncluttered.
6. Dispose geometry, materials, generated textures and event listeners on unmount. Stop updates when the tab is hidden or the player is inactive.

## Project rules

- Hard caps: at most about 4,000 live particles in high quality and 1,200 in low. Reject designs that spawn particles without recycling.
- One draw call per particle family is the target. Trails must reuse a ring buffer or line segments, not create meshes.
- Use additive blending sparingly and keep smoke low-opacity. Avoid full-screen overdraw.
- Do not add a particle dependency without a measured need. The current scene uses plain Three.js and R3F.
- No point lights per spark. No remote sprites or textures.
- Respect `prefers-reduced-motion` where the effect is decorative, and provide a way to omit it without breaking the scene.

## Failure cases

Unbounded arrays that grow after each burst, particles that never die, frame spikes at launch, GPU memory growth after quality changes, smoke obscuring the HUD, colours washing out the river, and effects continuing in a hidden tab are failures. Also reject formations that are culturally careless or read as text at distance.

## Verification

Run `npm run typecheck`, `npm test` and the focused Playwright world test. Trigger the effect repeatedly, switch low/high, remount the scene, and watch console errors and memory. Capture one desktop and one mobile frame at peak.

## Completion criterion

The sequence reads clearly, stays within the particle and draw-call caps, returns to a clean scene after the burst, survives remount and quality changes without leaks, and does not degrade the existing playable world.
