# Phase 7 implementation and verification

26 October 2026. Work is confined to a fresh Phase 7 extraction. Phase 5/6 inputs
remain unchanged. Source ZIP SHA-256 is recorded in `PHASE7-GAPS.md`, created before
implementation. No packages or lockfiles were changed.

## Implemented

- Optional five-stamp Kashi Journey extends shared successful gameplay results.
  Room gifts/offering/fountain/tasting wait for server acknowledgement. A valid
  server wheel pose grants the room ride stamp; solo waits for actual riding.
  Stamps are idempotent activity IDs, with no duplicate inventory/reward system.
- Native, keyboard/touch-accessible dialog shows icons, completion, progress and
  next activity. Full completion gives a quiet thank-you and souvenir action.
- Version-1 browser storage validates shape, version, allowlisted IDs and size,
  strips extra fields, deduplicates and safely resets unknown/malformed versions.
  No older journey schema exists to migrate. Inventory remains session-only.
  Reset requires confirmation; storage failure uses memory with an explanation.
  Cross-tab storage events update the feature; no accounts or DB tables were added.
- Room owner counts distinct successful diya-offering session IDs in a bounded
  first-offering-anchored window. Defaults: three guests, 30 seconds; validated
  server configuration supports 2–4 guests and 1–120 seconds. One event per window.
  Replays/failed actions never contribute. Resume retains identity/cooldown.
- Shared, short golden celebration and five allowlisted preset greeting cues have
  bounded retention and four-second per-guest cooldown. No free-text chat, executable
  input, arbitrary asset URLs or new animation rig. Visual cues are the deliberate
  fallback for existing models. Reduced-motion mode removes the glow; no flashing,
  particles, extra light or renderer allocation is added.
- Existing vendors gain short respectful dialogue. Chaat uses the existing successful
  session tasting and cap, not a fake button stamp. Demonstration prices remain
  illustrative. No commerce/payment API or recipient changes were made.
- Rangoli uses bounded eight-fold strokes, five colours, two decorative starters,
  blank design, undo, clear, reset, normalized resize-safe drawing and DPR ≤2 with
  a 1024-pixel backing cap. Real pointer capture supports mouse/touch/stylus through
  one code path. Keyboard petal addition is available. PNG preview/download/share
  stays local. URLs, resize observer, pointer state and temporary canvas are cleaned.
- Existing actual-world photo flow optionally adds an allowlisted local journey
  summary, website watermark and Dev Deepawali 2026 branding. PNG long edge remains
  ≤1920; no DOM, room code, token, contribution or organiser data enters export.
- Initial Git safety tooling, exclusions, README and provider-gated hosting handoff.

## Executed checks so far

Windows PowerShell, installed Edge headless/SwiftShader. Baseline installs used
`npm ci --offline --ignore-scripts --no-audit --no-fund` in both apps: 114/143 packages.
Baseline frontend typecheck, 61 tests/22 files (1.65 s), build passed. Backend
typecheck, 39 tests/6 files (6.08 s), build passed. Pre-edit browser command:
`npm run test:e2e -- e2e/phase6-launch.spec.ts`: 10/10, 52.0 s.

Updated frontend `npm run typecheck`, `npm test`, `npm run build`: passed;
65 tests/23 files, 1.57 s. Updated backend same commands: passed;
43 tests/7 files, 17.03 s. Backend tests include real WS group success, duplicate
requests, reconnect, isolation, emote allowlist/cooldown/expiry and pure window rules.
Root `python -m unittest discover -s scripts -p "test_*.py"`: 6/6, 0.556 s.

First new browser invocation failed at collection due to an extra parenthesis in
the test's pixel sampler. Fixed test syntax, no application assertion weakened.
`npm run test:e2e -- e2e/phase7.spec.ts`: 5/5, 31.9 s. Covers storage validation,
reload/reset/failure, real mouse/CDP touch symmetry, undo, viewport resize, PNG,
native-unavailable fallback, URL revocation, souvenir allowlist/privacy and keyboard
greeting cooldown. Full regression and final packaging receipts follow below.

## Preservation and limits

Original scene geometry, networking capacity/security, player appearance, camera,
music, adaptive quality, first-frame/error handling, invitation safeguards, QR asset,
approved recipient and commerce rules remain. Existing suites are not weakened.
Phase 4 browser tests now additionally check genuine marigold/fountain/offering
stamps; the wheel test additionally checks its genuine ride stamp.

No hardware FPS improvement is claimed. Scene chunk remains 1018.27 kB (269.96 gzip),
unchanged in size; UI entry grows from 362.95 to 377.77 kB (115.34 to 119.77 gzip).
After the final bounded-drawing correction, entry is 377.89 kB (119.83 gzip).
CSS grows from 34.07 to 35.54 kB. Existing Three Clock/shadow/CJS warnings and lazy
chunk warning remain. Software-rendered browser tests do not certify physical GPU
performance. The rangoli surface has bounded storage, not unlimited drawing history.

Local stamps can be edited and are not payment proof or server-verified achievements.
Distinct room visitors means distinct server session IDs, not verified real people;
fresh sessions cannot be linked without accounts, deliberately outside scope.
Drawings are not persisted after closing rangoli. No online UGC upload is added.

## Blocked / not implemented

Blocked: provider plan, Node/WS/proxy/hostname control, dashboard DNS warning,
production organiser/Supabase review, physical-device share/audio/GPU/thermal and
bank-app QR checks. No native share delivery or WhatsApp phone test is claimed.
Not implemented: deployment, DNS/TLS/portal/database/payment changes, accounts,
persistent inventory, new tables, multi-server rooms, free-text chat, finale,
Akash Deep lantern event, sponsorship or new payment systems.

## Broad regression and final source checks

`npm run test:e2e` passed **69/69**, **13.8 minutes**, no retries. This includes
the complete existing Phase 6 and supported historical suites, four independent
room contexts, isolation/reconnect/appearance, NPC/beggar, wardrobe/camera/photo,
all six stalls, gifts/fountain/offerings, fireworks/boats/pendulum/wheel, radio,
donation/commerce/security, actual CDP touch input and new Phase 7 cases.
Expected renderer errors from deliberate WebGL/lazy-import fault injection remain
visible; they are not unhandled normal-play errors. Existing unmatched-test-route
and Three deprecation warnings remain.

The full run measured renderer workload: low **604 calls / 64816 triangles**,
medium **632 / 93008**, high **915 / 112784**, Edge/SwiftShader, 1280×720,
input DPR 2, fireworks off. Evidence: `phase7-captures/workload.json`. These are
workload counts, not hardware FPS or a fresh physical-device performance claim.

Final small corrections after broad-run collection: wheel acknowledgement resets
only on another valid ride so a reset journey can earn a later genuine ride;
rangoli avoids reallocating its unchanged backing size and avoids per-point mirror
array generation. A defensive guard handles a second touch clearing an active stroke.
New backend test confirms one wheel acknowledgement per valid ride, not per pose.
The final focused browser gate covers these affected paths separately below; the
69-case run is not misrepresented as a second full final-source run.

Final working-copy commands (wall times include npm startup):

| App | `npm run typecheck` | `npm test` | `npm run build` |
| --- | --- | --- | --- |
| Frontend | passed, 1.771 s | 65/65, 23 files, 6.514 s wall / 1.83 s Vitest | passed, 2.423 s |
| Backend | passed, 1.761 s | 44/44, 7 files, 26.394 s wall / 21.69 s Vitest | passed, 0.734 s |

Python release/audio/QR/security tests now pass **7/7**, 0.549 s, including a new
GitHub-token/credential-URL rejection test. Initial expanded scans rejected two
existing public `user:password` URL rejection fixtures. Exact fixture/path exceptions
were added, not blanket test exemptions; real credential-like strings still fail.
`git diff --cached --check` reports pre-existing whitespace/CRLF in untouched
historical capture/world/audio-manifest files. Those baseline bytes were preserved;
this optional formatting check is not claimed clean.

## Public distribution review

No baseline file is deleted. Approved QR, all audio/gallery bytes, both manifests
and lockfiles, payment/auth/store modules and SQL migrations remain unchanged.
The public historical Phase 13 verification report redacts two live synthetic
business references and a correlation marker; its original remains in the untouched
Phase 6 ZIP. Reviewed historical contribution/application screenshots contain
explicit local/demo or example.test data, not actual owner contacts. No original
poster/profile image or raw owner-only report is published.

## Preliminary clean extraction

`python scripts/release_zip.py --output C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase7-verification-20261026.zip --extract-to C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase7-verification-20261026`
passed: 407 files, 131644000 bytes, SHA-256
`65116e7b128275a200ae6ce9340ba20e21de70c5f3ffeaf362540b2e36ac0e08`.
CRC, safe root, exclusions, secret scan and all extracted bytes passed.
In each extracted app, offline npm ci, typecheck, tests and build passed:
frontend 65/65 (2.48 s), backend 43/43 (17.69 s). This preliminary archive predates
the final small corrections and public report redaction; it is not the delivered ZIP.
Final-source clean-extraction and publication receipts follow after the final gates.

## Final focused browser evidence

`npm run test:e2e -- e2e/phase7.spec.ts e2e/phase7-social.spec.ts e2e/phase2.spec.ts e2e/phase4.spec.ts`
passed **14/14**, **3.0 minutes**, no retries. Includes actual three independent
protocol clients collecting/using validated diya inventory, a fourth rendered room
observer, one shared celebration, greeting cue/expiry and reduced-motion styling.
Also includes genuine chaat tasting, cap enforcement and refresh preserving the
local stamp but not session inventory. These two new social/chaat tests were added
after the earlier 69-case collection; total available collection is now 71 cases.

Visual review found faint old footer text showing through the souvenir summary.
The summary background is now opaque. The complete Phase 6 launch suite plus Phase 7
then passed: `npm run test:e2e -- e2e/phase7.spec.ts e2e/phase6-launch.spec.ts`,
**15/15**, **1.5 minutes**. Final frontend typecheck (1.576 s), 65 tests
(1.74 s Vitest / 2.636 s wall), build (2.791 s) passed after that correction.
Final entry gzip is 119.82 kB; scene and CSS sizes remain as above.

Native dialog first-focus initially scrolled the journey to its bottom action.
An explicit top close button now keeps initial focus near the heading; opaque
journey/rangoli backgrounds prevent underlying loading/HUD text bleeding through.
Responsive browser assertions now require the heading in view at 390×844, 844×390
and 800×540. The final rerun receipt is appended below.

Second clean-source verification archive: 411 files, 132893892 bytes, SHA-256
`fcc15f1b44f156325e5a8cbabeec0bf64e8b31963dfac948e99b4d755c9e2d96`.
Offline clean installs, typechecks, tests and builds passed again: frontend 65/65
(1.25 s), backend 44/44 (18.16 s). Wall seconds: frontend install 20.445,
typecheck 3.239, tests 2.271, build 2.073; backend install 15.101,
typecheck 3.404, tests 19.642, build 0.685. This predates only final dialog-focus/CSS
polish and documentation/screenshots; the delivered archive has its own final gate.

Final UI command `npm run test:e2e -- e2e/phase7.spec.ts` passed **5/5**, **32.9 s**,
with the heading-in-viewport assertions and unchanged genuine pointer/export tests.
Reviewed final portrait/landscape journey, portrait rangoli, actual souvenir PNG
and shared room cue. Curated captures are in `phase7-captures/`; ordinary browser
results remain ignored. Short layouts scroll inside the dialog; the top close
button and Escape remain available. No physical-phone certification is inferred.

## Final packaging gate

`python scripts/release_zip.py --output C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase7-packaging-gate-20261026.zip --extract-to C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase7-packaging-gate-20261026`
passed for final application source: **417 files**, **135758603 bytes**, SHA-256
`88946417af008cc47c505f63ae32bef94fdeb99cd4da9677a3fdc04f64e586fe`.
CRC, single root, forward-slash/safe paths, forbidden/private/env exclusions, secret
scan and every extracted byte match passed. Final clean extraction commands in
each app: `npm ci --offline --ignore-scripts --no-audit --no-fund`,
`npm run typecheck`, `npm test`, `npm run build`.

| App | Install | Typecheck | Tests | Build |
| --- | --- | --- | --- | --- |
| Frontend | 114 packages, 12.573 s | passed, 2.960 s | 65/65, 1.20 s Vitest / 2.230 s wall | passed, 1.974 s |
| Backend | 143 packages, 8.737 s | passed, 2.808 s | 44/44, 18.03 s Vitest / 19.102 s wall | passed, 0.792 s |

Final frontend output: entry **378.03 kB / 119.84 gzip**, CSS **35.61 / 8.46**,
unchanged lazy scene size **1018.27 / 269.96**. Final publication may add only
documentation receipts after this gate; application/test/asset bytes must match
this verified extraction. The delivery ZIP is created at a new Desktop Phase 7
path only after these gates and Git safety checks, then independently CRC/extraction
and byte-verified again. Its final hash is emitted outside the ZIP, avoiding a
self-referential archive hash.

`python scripts/github_safety.py` has passed the exact staged 417-file payload,
including index/worktree byte equality, source/migrations and seven ignore probes.
Python release/audio/QR/security tests passed 7/7 (0.360 s). The intended remote
was rechecked with both Git and GitHub CLI immediately before initial-commit
preparation and still had no commits. No force-push or credential-bearing URL is used.

## GitHub publication receipt

Initial application commit **`ba9b6f9db5ff4cd46acc495a9d5375ce0d677714`** was normally
pushed to **`main`** at **https://github.com/khushdeepAnand/Banaras-Diwali-Mela-**.
The remote was rechecked empty immediately before pushing. Remote branch SHA
matched local HEAD. GitHub recursive tree API returned all **417** intended files,
exactly matching the scanned local tree; no forbidden paths were present.
The final production frontend's **22 files** also passed the secret scanner.
Only public technical documentation receipts change after the final extraction
gate and initial source commit. A follow-up documentation commit records actual
push evidence without amending/overwriting the published initial history.

Source/tests/assets/configs and lockfiles in the delivered archive must match the
final verified extraction; the release tool additionally verifies the final archive's
own CRC, paths, secrets and extracted bytes. No real `.env`, dependency folder,
build output, browser trace/result, private poster or raw owner report ships.
The original Phase 6 ZIP SHA-256 remains
`8a5be9f382548871216575d7d116a841f49f728d62e58bb7038fc85efaae3f46`.
The Phase 5 baseline was not modified.
