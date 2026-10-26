---
name: animation-interactions
description: "Use when animating the ferris wheel, pendulum, cruise, ferry, camera controls, collision boundaries, animation timing, or interaction prompts in the mela."
---

# Animation and Interactions

## Purpose

Make moving attractions and player interactions feel deliberate and reliable. Animation must be frame-rate independent, paused correctly, and coordinated with collision and UI prompts.

## When to use

Use for ferris wheels, pendulums, cruise or ferry motion, camera behaviour, interaction timing and prompts. Do not use for pure lighting or architecture. Token rule: read `Player.tsx`, `environment.ts`, `App.tsx` and the single attraction file involved.

## Workflow

1. Read `Player.tsx`, `environment.ts`, `App.tsx`, `bazaar.ts` and `docs/PLAYABLE-WORLD.md`.
2. Define the motion contract: pivot, axis, period, amplitude, phase and what the player can inspect. Write it as constants.
3. Drive motion with one `useFrame` per system. Use elapsed time or a clamped delta; never use `setInterval` for 3D motion.
4. Keep camera control in `Player.tsx`. Moving attractions must not write to the camera unless they are an explicit camera sequence.
5. Define interaction ranges and prompts in the same style as `nearestStall`; show one clear prompt and pause movement while a dialog is open.
6. Check collisions and clearance at every phase of motion. If a moving object crosses the walkway, update `environment.ts` and tests rather than letting the player clip through.

## Project rules

- Clamp frame delta to 0.05 seconds, matching the player loop.
- Ferris wheel and pendulum pivots must be anchored to `groundHeight`; check rotating clearance against temples, stalls and the camera.
- Cruise and ferry paths stay on the river side (negative z) unless a dock is explicitly modelled. Docking must not teleport the player.
- Do not add React state updates inside `useFrame` for motion. Refs and buffer updates only.
- StrictMode mounts effects twice in development; every loop, listener and timer needs a matching cleanup.
- Existing touch pointer capture and keyboard handling in `App.tsx` are contracts; do not bypass them.

## Failure cases

Double animation loops after remount, motion that speeds up with frame rate, camera fights, player movement while a panel is open, prompts that stay visible after leaving range, animations that tunnel through collision boundaries, and ferris-wheel cabins that detach from the rim are failures.

## Verification

Run `npm run typecheck`, `npm test`, and the focused world and bazaar Playwright tests. Exercise E and prompt clicks, Escape, Reset and touch input. Watch one full motion cycle at low and high quality.

## Completion criterion

Each attraction completes a clean cycle, prompts appear and disappear at the correct range, movement pauses during dialogs, collision remains valid at all phases, and no duplicate loops or console errors occur after remount.
