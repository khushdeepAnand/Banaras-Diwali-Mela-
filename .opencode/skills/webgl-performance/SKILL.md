---
name: webgl-performance
description: "Use when profiling GPU cost, reducing draw calls or shader complexity, fixing WebGL memory leaks or disposal, tuning device pixel ratio and mobile quality, or measuring scene performance."
---

# WebGL Performance

## Purpose

Protect frame time and memory. Measure before and after; do not trade a feature for an unmeasured guess.

## When to use

Use for renderer settings, draw calls, shader cost, instancing, texture memory, disposal, DPR, quality tiers and performance reports. Do not use for unrelated UI work. Token rule: profile the changed path; add no permanent debug UI and do not dump full traces.

## Workflow

1. Record a baseline: scene, quality, viewport, browser, GPU and the observed frame time or renderer counters.
2. Read `MelaScene.tsx`, the affected world component and `docs/PLAYABLE-WORLD.md`. Note the existing budget: low caps DPR at 1.25, high at 1.75; low disables shadows; the lazy 3D chunk is roughly 923 kB minified and 245 kB gzip.
3. Use `renderer.info` temporarily, browser performance tooling or a short local probe to count draw calls, triangles, geometries and textures. Remove temporary instrumentation before finishing.
4. Attack the largest cost first: duplicate geometry, per-frame allocation, excessive transparent overdraw, shadow casters, high-frequency shader work, then DPR.
5. Prefer instancing, shared materials, merged static geometry and visibility culling over adding a new optimisation library.
6. Verify disposal by toggling quality and remounting the canvas, then compare memory and draw calls.

## Project rules

- One canvas and one renderer. Keep the existing lazy import of `MelaScene`.
- Do not raise DPR, shadow resolution or light count without a measured reason and a mobile check.
- No geometry, vectors, arrays or materials allocated inside `useFrame`.
- Dispose generated CanvasTextures, materials and geometries on unmount; R3F handles its own primitives but not manually created resources.
- Keep the low tier genuinely cheaper, not just a label.
- Software-rendered Playwright captures are not a frame-rate benchmark. State that limitation in reports.

## Failure cases

Rising GPU memory after quality toggles, draw calls that grow with bursts, shader recompilation on every render, texture leaks, an FPS claim from SwiftShader, hidden-tab animation continuing, and "optimisations" that change the scene silhouette are failures. A single fast desktop result does not prove mobile performance.

## Verification

Run the app in a real browser, compare low/high and desktop/mobile viewports, and repeat a quality toggle plus remount. Check console for WebGL warnings and page errors. Run `npm run typecheck` and relevant tests after changes.

## Completion criterion

The measured frame time or draw-call count improves or stays within budget, memory returns to baseline after remount, low quality remains the cheaper path, and the final report names the device, viewport and measurement method.
