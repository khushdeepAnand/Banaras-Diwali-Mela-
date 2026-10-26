---
name: playwright-visual-qa
description: "Use when adding or running Playwright tests, validating desktop and mobile browser behaviour, capturing WebGL screenshots, checking console errors, or reporting visual QA evidence."
---

# Playwright Visual QA

## Purpose

Verify the live WebGL world with existing browser-test conventions, not mocks or hand-written claims. Report concise, evidence-backed results.

## When to use

Use for `frontend/e2e/*.spec.ts`, `playwright.config.ts`, browser regression checks and release evidence. Skip unit-only work with no browser behaviour. Token rule: run the focused spec first; expand only on failure or release.

## Workflow

1. Read `playwright.config.ts` and the closest existing spec before writing a test.
2. Run from `frontend/`. The config starts Vite on `127.0.0.1:5174` via `webServer`; do not start a second dev server. On Windows it uses installed Edge; elsewhere install Chromium once with `npx playwright install chromium`.
3. Use the existing base URL, `--enable-webgl`, SwiftShader launch flags and 1280x720 desktop viewport. Create a separate context for mobile: 390x844, `isMobile`, `hasTouch`, device scale factor 2.
4. Drive real input. Use `page.keyboard`, `page.mouse` and CDP `Input.dispatchTouchEvent`; the joystick test must observe `gotpointercapture`. Synthetic `dispatchEvent` is not enough.
5. Wait for observable state: coordinates, prompt visibility, selected option, canvas size. Avoid arbitrary long sleeps except where the existing test needs a render settle.
6. Capture screenshots under `test-results/` only. Treat `pageerror` and console `error` messages as failures.
7. Report the exact command, spec, pass/fail counts and screenshot paths. Keep failure output limited to the failing assertion and relevant console line.

## Project rules

- Do not weaken or delete existing assertions to make a regression pass.
- Preserve the low/high DPR check, the bazaar six-stall approach test and the touch joystick test.
- A screenshot is evidence, not a performance benchmark; SwiftShader colours and frame rate differ from real hardware.
- Do not commit `test-results/` or `playwright-report/`; both are ignored.
- New visual tests should assert one meaningful behaviour, not a long brittle script.
- If the browser is missing or the port is occupied, fix the environment rather than skipping the test.

## Failure cases

Tests that pass by mocking WebGL, fixed waits masking a broken prompt, ignored page errors, screenshots taken before the canvas settles, port 5174 conflicts, and reports that claim "all passing" without a command are failures. Flaky retries are not proof of correctness.

## Verification

Run `npm run test:e2e -- e2e/world.spec.ts` for the focused world check, then `npm run test:e2e` for the full suite. Review generated screenshots. Run `npm run typecheck` if test code changed.

## Completion criterion

The relevant spec passes with exact counts, desktop and mobile captures are reviewed, no page or console errors are present, and the report states what was actually run and what remains unverified.
