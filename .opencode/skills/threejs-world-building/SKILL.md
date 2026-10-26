---
name: threejs-world-building
description: "Use when composing or changing the Banaras Diwali Mela 3D scene, camera placement, geometry and material reuse, spatial layout, or attraction visibility."
---

# Three.js World Building

## Purpose

Keep the procedural ghat, riverfront, temples and bazaar readable, correctly placed and cheap to render. Build the world as a deliberate composition, not an accumulating pile of meshes.

## When to use

Use for scene-graph changes, new world objects, layout, camera framing and visibility of attractions. Do not use for shader internals, lighting-only tuning, or particle systems; load the matching focused skill instead. Token rule: read only the files named here plus direct imports.

## Workflow

1. Read `docs/PLAYABLE-WORLD.md`, `frontend/src/world/MelaScene.tsx`, `environment.ts` and the component being changed.
2. Establish coordinates before modelling. The Ganga is toward negative z; the walkable ghat is roughly x -21..21 and z 0.7..18.5; spawn is (0, 10.5); bazaar stalls occupy the upper terrace around z 15..18.5.
3. Plan three layers: foreground diyas and player path, midground terraces and temples, background far temples and skyline. Check the view from spawn and from the bazaar.
4. Reuse shared geometries, materials, colours and typed configuration. Use `instancedMesh` for repeated objects instead of one mesh per copy.
5. Keep one `<Canvas>` in `MelaScene` and preserve its memoization. Add new world parts inside the existing scene; do not create a second renderer or camera rig.
6. Seat objects with `groundHeight(z)` and update `OBSTACLES`/walk bounds if a new object is solid.

## Project rules

- No remote models or textures at runtime. Prefer original procedural geometry, consistent with `GhatArchitecture.tsx`.
- Low quality omits shadow maps and uses fewer decorative instances; high quality is the only mode with shadows.
- Keep the follow camera in `Player.tsx`. World-building must not fight it with per-frame camera overrides.
- Preserve the water plane at y -0.17 and the fog range; do not hide the river behind solid geometry.
- More than roughly 100 repeated small objects should be instanced or merged.

## Failure cases

Floating steps, objects intersecting the player path, z-fighting between terrace layers, temples that block the spawn sightline, and duplicate materials/geometries are defects. Also reject new obstacles that are not reflected in collision and attractions that are invisible from the intended viewpoint.

## Verification

Run `npm run typecheck` and `npm test` in `frontend/`. Run the focused Playwright world test with `npm run test:e2e -- e2e/world.spec.ts`. Inspect desktop and mobile screenshots, then toggle low/high quality. Check the console for page errors.

## Completion criterion

The attraction is identifiable from the intended path, both quality modes render correctly, movement and collision still work, no console errors appear, and no unrelated scene behaviour changed.
