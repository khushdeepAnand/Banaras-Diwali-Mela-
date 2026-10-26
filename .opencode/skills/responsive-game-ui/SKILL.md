---
name: responsive-game-ui
description: "Use when adjusting the desktop or mobile HUD, portrait and landscape layouts, touch controls, safe areas, accessibility, interaction feedback, or scene obstruction."
---

# Responsive Game UI

## Purpose

Keep the HUD usable without covering the ghat. Desktop, touch and landscape layouts must expose the same core actions: enter, move, look, reset, change graphics, toggle sound and open a stall.

## When to use

Use for `frontend/src/style.css`, `App.tsx`, `MobileControls.tsx`, `StallPanel.tsx`, layout and accessibility. Do not use for 3D scene geometry. Token rule: inspect the relevant CSS block and component; do not rewrite the style sheet.

## Workflow

1. Read `style.css`, `App.tsx`, `MobileControls.tsx` and `StallPanel.tsx`, plus existing Playwright mobile tests.
2. Map HUD zones: topbar with safe-area padding, bottom-left scene label, bottom-right desktop hint, centered stall prompt, bottom mobile joystick and actions.
3. Preserve the current breakpoints: coarse pointer for touch controls, `max-width: 650px` for compact type, `max-height: 550px` for short landscape.
4. Keep interaction targets at least about 44 px and visible on both themes of the scene. Do not rely on hover.
5. Check overlay order and pointer events: the canvas must receive look drags, controls must receive taps, and prompts must not block movement.
6. Test portrait 390x844, landscape 844x390 and a small desktop 800x540.

## Project rules

- Use `100dvh` and safe-area insets; keep the experience non-scrolling while preserving an accessible intro on short screens.
- `touch-action: none` belongs on the viewport and joystick, not the whole document.
- Preserve native `<dialog>` focus behaviour in `StallPanel`; Escape and the close button must remain available.
- Labels must stay meaningful: Graphics, Sound, Reset, Close stall panel, Movement joystick.
- On mobile, the scene label hides when the stall prompt appears; keep that rule to avoid overlap.
- Do not place a control over the player's central walking view or the bazaar panel.

## Failure cases

Joystick under the home indicator, toolbar wrapping off-screen, prompt hidden behind mobile actions, canvas drags blocked by overlays, body scroll/zoom on touch, focus escaping the dialog, and identical desktop/mobile layouts forced into portrait are failures. So is a control that exists only on hover.

## Verification

Run `npm run typecheck` and the world and bazaar Playwright tests, including real CDP touch input. Inspect screenshots at portrait, landscape and small desktop sizes. Tab through controls and confirm visible focus. Check no console errors.

## Completion criterion

Every core action is reachable on desktop and touch, the HUD stays inside safe areas, the scene remains visible and draggable, dialogs keep focus, and portrait and landscape screenshots show no overlap or clipped controls.
