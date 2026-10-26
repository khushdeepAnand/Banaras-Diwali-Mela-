---
name: react-typescript-engineering
description: "Use when changing React components or hooks, TypeScript types, state management, reusable UI, render behaviour, or animation loop lifecycles in the Banaras Diwali Mela frontend."
---

# React and TypeScript Engineering

## Purpose

Keep the React 19 and strict TypeScript frontend predictable, typed and free of duplicate loops. Reuse existing patterns.

## When to use

Use for components, hooks, effects, state, props, typing and lifecycle fixes. Do not use for pure GLSL or CSS-only work. Token rule: read the component, its direct imports and the matching test; do not scan the repository for a local change.

## Workflow

1. Read `frontend/src/App.tsx`, the component involved and its test. Confirm where state belongs: `App` owns entry, quality, sound, reset, selected stall and HUD telemetry; `Player` owns its frame-local movement state.
2. Type the data at the boundary. Reuse `Position`, `GameInput`, `BazaarStall` and `StallKind`; avoid `any` and unnecessary assertions. The project uses `strict`, `noUnusedLocals` and `noUnusedParameters`.
3. Keep high-frequency values in refs. The telemetry callback already throttles to about 5 Hz; do not set React state every frame.
4. Preserve stable props into `memo(MelaScene)`. Inline objects, arrays or callbacks that change each render can rebuild expensive scene parts.
5. Put cleanup beside every subscription, timer, audio node and pointer capture. React StrictMode mounts effects twice in development.
6. Prefer the existing native dialog, router and CSS over new libraries. Add no dependency for a local component concern.

## Project rules

- R3F hooks (`useFrame`, `useThree`) must stay inside the `<Canvas>` tree.
- Do not create a second animation loop; one `useFrame` per system, with refs and clamped delta.
- Keep keyboard handling aware of focused inputs and buttons; do not steal movement keys from UI.
- `MelaScene` is memoized and lazily imported; preserve both unless a measured reason exists.
- State must not mutate refs owned by another component.
- Use existing test helpers and `renderToStaticMarkup` for entry-screen tests; add unit tests near the source.

## Failure cases

Duplicate effects after StrictMode remount, stale closures, missing effect dependencies, state updates from `useFrame`, remounting the canvas because of unstable props, non-null assertions that hide null DOM, and types widened to `any` are failures. Also reject new global state for a value already owned by `App` or `Player`.

## Verification

Run `npm run typecheck` and `npm test` in `frontend/`. For behaviour changes, run the focused Playwright spec. Check that the entry screen, dialog, keyboard, touch and quality switching still work. Report exact failures, not a vague summary.

## Completion criterion

The change is strictly typed, uses existing ownership and patterns, produces no duplicate loops or render churn, passes typecheck and targeted tests, and leaves the existing component contracts intact.
