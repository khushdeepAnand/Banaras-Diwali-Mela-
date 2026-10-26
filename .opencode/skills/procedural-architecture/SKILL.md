---
name: procedural-architecture
description: "Use when building Banaras-inspired ghats, temple silhouettes, facades, balconies, stepped masonry, varied buildings, instanced repeats, or efficient distant scenery."
---

# Procedural Architecture

## Purpose

Extend the original Banaras-inspired architecture with believable stepped masonry, temple profiles and layered riverfront buildings, without importing models or multiplying draw calls.

## When to use

Use for new terraces, temples, facades, balconies, lamps, background buildings and architectural variation. Do not use for the water shader, particle effects or general lighting. Token rule: open `GhatArchitecture.tsx`, `environment.ts` and only the helper files you will edit.

## Workflow

1. Read `GhatArchitecture.tsx`, `environment.ts`, `MelaScene.tsx` and `docs/PLAYABLE-WORLD.md`.
2. Match the existing coordinate system. Terraces rise in `STEP_DEPTH` and `STEP_HEIGHT` increments; use `groundHeight(z)` to seat every base.
3. Choose a silhouette first: ghat steps, temple tower, facade block or balcony. Then add two or three details that read at gameplay distance; skip tiny trim that cannot be seen.
4. Reuse the sandstone palette and shared dimensions. Vary scale, height, roof profile and setback, not material identity.
5. Use `useMemo` for deterministic arrays and `instancedMesh` for repeated railings, lamps, windows or distant blocks.
6. Place distant scenery beyond the walk bounds, use simpler geometry, and keep shadows limited to close high-quality objects.

## Project rules

- Deterministic output only. Do not call `Math.random()` during render; use a fixed seed or an explicit array.
- Keep the foreground ghat within x -22..22. Do not cover the river view or the central bazaar aisle.
- New solid volumes on the walkable terrace require matching collision updates in `environment.ts` and tests.
- Use box, cylinder, cone, torus and sphere primitives already in the project. No external GLB downloads.
- High quality may add stone seams; low quality must still read as stepped masonry.
- Avoid z-fighting by offsetting coplanar trim by a small, deliberate amount.

## Failure cases

Floating buildings, steps that do not match `groundHeight`, repeated silhouettes that look copy-pasted, distant blocks merging into one mass, excessive overdraw, temples blocking the player or camera, and collision footprints that disagree with visible geometry are failures.

## Verification

Run `npm run typecheck`, `npm test`, and `npm run test:e2e -- e2e/world.spec.ts`. Inspect spawn, riverfront and bazaar views at both quality levels. Check that the walk bounds still contain the player and that no new mesh intersects the path.

## Completion criterion

The new architecture is grounded, identifiable at gameplay distance, varied enough to avoid obvious repetition, visible from its intended viewpoint, and free of collision, z-fighting and console regressions.
