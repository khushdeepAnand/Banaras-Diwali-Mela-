# Phase 6.2 final captures

These are new screenshots from the running Vite application, taken by `frontend/e2e/phase6-final.spec.ts` with Chromium and software WebGL. Desktop screenshots are 2560×1440; mobile uses a 390×844 touch viewport at 2× device scale. The original `docs/phase6/baseline-*.png` files are retained unchanged for comparison.

Scenes: `desktop-riverfront.png`, `water-closeup.png`, `ganga-aarti.png`, `market-stalls.png`, `ferris-wheel.png`, and `mobile-portrait.png`.

## Visual comparison

- **River and water:** The baseline river has dark, mostly uniform horizontal bands. The final close-up and riverfront show irregular, softly broken amber pools near the diya-lit bank, with visible variation in the surface rather than a continuous bright stripe.
- **Skyline:** The baseline far bank is mostly repeated block silhouettes. The final has visibly varied temple spires, domes, heights, and warm window accents. It remains outside the walking area.
- **Aarti:** The baseline view is a distant view from spawn. The final frame approaches the dais and shows the three priests, their moving lamps, canopy and garlands, and the ceremony notice without covering the controls.
- **Market:** The baseline `baseline-market-stalls.png` is actually a river-facing spawn view. The final `market-stalls.png` faces the bazaar and shows the decorated counters, products, signs, and entry arch.
- **Mobile:** Compared with the earlier portrait world capture in `docs/phase5/mobile-world.png`, the final touch view keeps the joystick and reset separate from the top controls, the river and skyline visible, and removes a foreground support that blocked the centre of the screen.

These images demonstrate composition, not photorealistic or screen-space reflections. Fireworks positions and animations vary by capture time.
