---
name: threejs-shaders
description: "Use when editing GLSL for the animated Ganga, multi-scale ripples, broken light reflections, shader debugging, GPU-safe fallbacks, or shader quality levels."
---

# Three.js Shaders

## Purpose

Maintain the stylised Ganga shader: animated water with layered ripples and broken warm highlights, at a cost that still runs on modest mobile GPUs. Shader beauty must not come from unbounded loops or per-pixel noise.

## When to use

Use for `frontend/src/world/GangaRiver.tsx`, GLSL changes, water motion, reflection highlights or shader quality tiers. Do not use for general material colours, lights or scene layout. Token rule: inspect the shader component and its uniforms only; do not re-read the whole world.

## Workflow

1. Read `GangaRiver.tsx`, `MelaScene.tsx` and `docs/PLAYABLE-WORLD.md`. Record the current plane, uniform names and animation cost.
2. Define the visual target in one sentence: broad river motion, small ripples, and sparse broken reflections. Keep these as separate frequency scales.
3. Implement with simple `sin`/`pow` expressions. Reuse `uTime`; avoid texture fetches, dynamic loops and expensive noise unless measured.
4. Keep vertex displacement small (well under 0.1 units) so the plane does not clip the ghat or player.
5. Update uniforms in one `useFrame` using `clock.elapsedTime`; allocate nothing inside the frame callback.
6. For a low/high split, reduce frequency layers or highlight density in low mode while preserving the same palette and motion direction.

## Project rules

- The current shader is a plain `shaderMaterial` with inline GLSL; keep it self-contained unless a documented need justifies `onBeforeCompile`.
- Water is stylised, not physically accurate. Do not claim real reflections or add reflection render targets without a performance review.
- Guard `pow` and `sqrt` inputs against negative values; NaN produces black or flashing water.
- Do not introduce a post-processing dependency for water. Use emissive colour and highlight shaping.
- `SceneError` already handles renderer startup failure; do not silently replace a failed shader with an unverified fallback.
- Dispose generated textures/materials and avoid recompiling shaders on every quality toggle.

## Failure cases

Shader compile errors, a frozen or black river, uniform updates that stop after remount, harsh banding, aliasing from ultra-high frequencies, transparent sorting artefacts, and quality-specific NaNs are all failures. So is a shader that pushes frame time beyond the `webgl-performance` budget.

## Verification

Run `npm run typecheck`, `npm test`, and the focused Playwright world test. Confirm the water animates in a real browser, inspect console shader errors, and capture desktop plus mobile screenshots. Compare low and high settings.

## Completion criterion

Water animates smoothly in both quality modes, highlights remain broken and warm rather than a solid glow, no shader or console errors occur, and the measured render cost stays within the agreed budget.
