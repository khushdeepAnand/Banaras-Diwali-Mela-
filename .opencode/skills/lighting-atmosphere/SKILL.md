---
name: lighting-atmosphere
description: "Use when tuning Banaras Diwali Mela night lighting, warm diya glow, temple illumination, fog, exposure, restrained bloom, or visual hierarchy."
---

# Lighting and Atmosphere

## Purpose

Create a warm, nocturnal Dev Deepawali mood while keeping the scene legible and inexpensive. Light should guide the eye from the player, to the diyas, along the ghat, then to temples and the river.

## When to use

Use for light rigs, emissive glow, fog, background colour, exposure and atmosphere. Do not use for world layout or GLSL internals. Token rule: read the lighting block in `MelaScene.tsx` and only the affected materials; do not rebuild the scene to change a colour.

## Workflow

1. Read `MelaScene.tsx`, `DiyaField.tsx`, `GhatArchitecture.tsx` and the relevant section of `docs/PLAYABLE-WORLD.md`.
2. State the hierarchy: player path brightest, diyas as small warm accents, temples as soft silhouettes, river highlights as the distant focal band.
3. Adjust the existing hemisphere, ambient and single warm directional light before adding anything. Keep the palette around the current warm amber, sandstone and blue-night values.
4. Use emissive materials and tone-mapped false flames for glow. Do not create one point light per diya.
5. Tune fog and background together so distant architecture fades rather than turning into a flat wall.
6. Check low then high quality. Shadows belong to high only, with the existing single 1024 shadow map.

## Project rules

- The current scene has no post-processing. Do not install a bloom library inside a lighting task. If bloom is later approved, make it subtle: high threshold, small radius, reduced resolution, and off in low mode.
- Keep one shadow-casting directional light. The bazaar may keep at most its existing small high-quality point light.
- Flames and lamps must not blow out to white; preserve the warm orange core and visible stone.
- Do not change UI colours to match the scene; HUD contrast is governed by `responsive-game-ui`.
- Avoid lights that appear only at certain camera angles or flicker with frame rate.

## Failure cases

Crushed black shadows, overexposed flames, a flat grey ghat, visible shadow acne, light leaking through walls, fog hiding the main attraction, and point-light count growth are failures. Also reject atmosphere changes that make the stall prompts or HUD unreadable.

## Verification

Run `npm run typecheck` and the focused Playwright tests. Inspect desktop and mobile screenshots at both quality settings. Check that the river, diyas and temple silhouettes are distinguishable from spawn and from the bazaar.

## Completion criterion

The night scene has a clear warm-to-cool hierarchy, both quality modes remain readable, no new light-count or shadow-map cost was added without approval, and screenshots show no blown highlights or crushed blacks.
