# Phase 8 — GitHub, integration and staging preparation

## Current continuation — free-hosting preparation and safe consolidation

27 October 2026. **Locally verified preparation only; no public deployment.**
This section supersedes the historical paid-host recommendation and old output paths
below. Original reports are retained as historical evidence, not fresh test claims.

### Source and backup identity

Initial active source was `C:/Users/khush/Desktop/banaras-diwali-mela-phase8/banaras-diwali-mela`.
All 436 files in the original Phase 8 ZIP exactly matched the active working files;
the main working tree was clean, HEAD and live remote main both
`ce2ad5bb55c7366767764ed17348c9e15e8d5d24`. Both package versions remain 0.1.0.
Phase 7 main was `39a6755f08c1005d698ba9afc6e1875249b7c0b5`, verified ancestor of active HEAD.
No checkout, reset or source replacement was used. Active Git metadata is preserved.
`git fsck --full` found no corrupt objects; six dangling blobs were reported and left
untouched. Older Git metadata is also retained privately, including unreachable objects.

Final designated parent: `C:/Users/khush/Desktop/Banaras-Diwali-Mela-Release`:
- Active source: `banaras-diwali-mela/` (includes its original `.git`).
- Original Phase 7: `banaras-diwali-mela-phase7-v1-20261026.zip`, 135760483 bytes,
  SHA-256 `26e62aebd21ad5bff138d9ecba03b022e014d9d0154daeaed6afc062af54e048`.
- Latest: `banaras-diwali-mela-latest.zip`, with matching `.zip.sha256`.
- Phase 7 also retains its original matching `.zip.sha256`.

The request's Phase 7 expected hash ended in `52bd9eb1fe67b0cee5c6fb5`; that does not
match the archive. Actual bytes match the original sidecar and both delivery receipts.
Owner authorised using the verified original archive after this discrepancy was raised.
No archive bytes or Phase 7 sidecar were changed to hide it.
Original Phase 8 ZIP was 136724467 bytes, SHA-256
`aa7b610ead54f8fb80e5e1803ed3797d5c7a58b1512bd9eb1fe67b0cee5c6fb5`.
Both originals passed CRC and path safety; Phase 8's 436 files matched working bytes.

The latest ZIP's final size/hash and final Git publication result are recorded after
packaging in `private/PHASE8-FINAL-DELIVERY-RECEIPT.md` in the active working project,
the adjacent checksum sidecar, and the owner handoff. A ZIP cannot contain its own
final hash/size without a circular dependency; these external receipts are authoritative.
The private receipt itself is intentionally not in the ZIP or GitHub.

### Scope and preservation

Added `render.free.yaml` (Free, Node, single-instance, manual, same-origin), a Python
policy regression check and required-file packaging guard. Existing paid `render.yaml`
is unchanged byte-for-byte. All runtime code, gameplay, locks, assets, QR, migrations
and reconnect/four-player rules are unchanged. README and all five Phase 8 reports are
updated. Current runbook documents no-card/no-upgrade account gates and official limits.

Desktop was inventoried before changes. Older Phase 5/6 folders contained private
files not in their ZIPs, including an old backend env file: preserved only as inert,
ignored local historical content, never installed as the active runtime `.env`.
Every distinct non-generated file from Phase 5/6/7 folders (including old `.git`), all
entries of Phase 4/5/6/7/8 ZIPs, receipts and sidecars were mapped to either an identical
current file or a hash-addressed historical blob. Initial preservation check: **3170
entries, 378 stored unique blobs, 246773048 blob bytes**, all byte-verified.
Manifest: `private/workspace-preservation/manifest.json`; blobs in its `blobs/` sibling.
This is not another extracted runnable project. The manifest records original paths,
hashes, sizes and restore locations; no secret values are printed or published.
Private preservation data is excluded from GitHub and latest ZIP. Keep the active
folder to retain private local history; the public source ZIP is not a private-data backup.

Proposed keep/move/delete list was printed before destructive cleanup. Cleanup only
proceeds after final latest ZIP verification and preservation re-verification:
- Move active folder, original Phase 7 ZIP and its sidecar into the designated parent.
- Keep exactly one latest ZIP and sidecar there.
- Remove superseded Phase 4/5/6/original Phase 8 ZIPs and old Phase 8 sidecar, whose
  file contents were retained in the verified historical store; no unique bytes lost.
- Remove obsolete Phase 5/6/7 folder copies after all non-generated files are retained;
  remove empty Phase 8 wrapper and loose receipts after verified preservation.
- Old dependency/build/test-result/cache directories may be discarded only after the
  observed clean-extraction installs/tests/builds. Active dependencies/builds may stay
  inside the one active project. No unrelated files or directories are targeted.
Actual operations and final workspace entries are recorded in the final private receipt.

### Fresh actual commands and results (this continuation)

| Location / command | Observed result |
| --- | --- |
| frontend `npm run typecheck` | PASS |
| frontend `npm test` | 65/65, 23 files, 1.77 s |
| frontend `npm run build` | PASS; existing >500 kB chunk warning |
| backend `npm run typecheck` | PASS |
| backend `npm test` | 49/49, 9 files, 20.82 s; includes API/real WS/deployment/restart |
| backend `npm run build` | PASS |
| root `python -m unittest discover -s scripts -p 'test_*.py' -v` | 8/8, 0.526 s; release/audio/QR/security/free-config |
| Python PyYAML + jsonschema against live official Render schema | Both paid/free YAML PASS |
| frontend `npm run test:e2e -- --config playwright.staging.config.ts` | 2/2, 17.3 s, compiled local HTTPS/WSS; Git OpenSSL added to PATH |
| both apps `npm audit --json` | Both exit 0, zero reported vulnerabilities |
| clean-extraction both apps `npm ci --offline --ignore-scripts --no-audit --no-fund` | PASS; 114 frontend / 143 backend packages, 24/19 s |
| clean-extraction both apps typecheck/test/build | All PASS; frontend 65/65 (1.27 s), backend 49/49 (18.55 s) |
| initial build-gate `python scripts/release_zip.py --output TEMP_ZIP --extract-to NEW_TEMP_DIR` | 438 files, CRC/path/exclusions/secret scans/extraction and every intended byte comparison PASS |

New policy test uses already-installed release-tool PyYAML; no runtime dependency was
added. Existing Three CJS deprecations and large scene chunk warning remain. No check
above failed. Historical browser failures below are not erased; full ordinary 71-case
browser suite was **not rerun** here. Only relevant deployment browser tests ran.
Final Git payload/history scans, archive validation, public secret-value scan and
post-move checks are recorded in the final delivery receipt with actual results.

### Hosting findings and remaining manual work

Official Render free/WS/Blueprint docs were read live: free native Node + same-port WS
is supported. Free plan has 0.1 CPU/512 MB, idle spin-down after 15 minutes without inbound
HTTP/WS messages, roughly one-minute wake, 750 shared workspace hours/month, arbitrary
restarts, ephemeral disk, no persistent disks/shell, bandwidth/build quotas and suspension.
**A free instance is not sufficient to guarantee Rs 0 on a card-backed workspace**:
overage billing can occur. Use no payment method; stop if payment, upgrade, unavailable
free capacity or inadequate CPU/RAM blocks staging. No account settings were verified.
No uptime, real-host performance or persistent-room guarantee is made.

Owner must establish a non-billable free account, select `render.free.yaml` explicitly,
assign hostname, set exact REALTIME_ORIGINS privately, deploy only Free, and run live
TLS/WSS/proxy/reconnect/restart/media/demo/wake tests. Keep Supabase absent, payments
disabled and the existing InfinityFree portal untouched. Paid rollout, production,
physical-device QA and live database work are outside this completed local preparation.

---
## Historical initial Phase 8 implementation (retained evidence)

Inspection started 26 October 2026; release work continued 27 October 2026.
**No public staging deployment or production change is claimed.**
Staging URL: **BLOCKED / none**. Deployment timestamp: **not applicable**.

## Source and independent GitHub verification

Source ZIP: `banaras-diwali-mela-phase7-v1-20261026.zip`, 417 files, single
`banaras-diwali-mela/` root, SHA-256
`26e62aebd21ad5bff138d9ecba03b022e014d9d0154daeaed6afc062af54e048`.
The sidecar matches. CRC, path traversal checks and extraction into a new Phase 8
directory passed. Both app package versions remain **0.1.0**, locks preserved.
Phase 7 source/ZIP are unchanged read-only inputs.

Read README, Phase 7 gaps/implementation/handoff, website plan, source configuration,
API/server/room/static assumptions, examples, package scripts, migration hardening,
release scanner, tests and exclusions before implementation.

Direct inspection of the original working copy and remote, not its receipts:

```text
git status --short
git log -5 --oneline
git remote -v
git rev-parse HEAD
git ls-remote origin refs/heads/main
gh repo view khushdeepAnand/Banaras-Diwali-Mela- --json nameWithOwner,visibility,defaultBranchRef,url,isEmpty
```

Observed repository PUBLIC, non-empty, default/current branch **main**, HTTPS remote
`https://github.com/khushdeepAnand/Banaras-Diwali-Mela-.git`, clean Phase 7 working
tree, HEAD/remote **`39a6755f08c1005d698ba9afc6e1875249b7c0b5`**. History contains
that documentation commit and root application commit
`ba9b6f9db5ff4cd46acc495a9d5375ce0d677714`.

After fetching history into the fresh ZIP copy, GitHub recursive tree API returned
all 417 files without truncation. Every extracted file was hashed with Git's blob
format and matched its actual remote object SHA. Frontend, backend, tests, both
migrations, scripts, documentation, examples and lockfiles are present. Only then
was the verified history/index attached to the unchanged ZIP source.
No history repair, blind checkout, forced push or overwrite was needed. The earlier
empty-repository claim is not reproducible now; its historic cause is unknown, not
invented as a cache/auth explanation.

`python scripts/audit_git_history.py` initially inspected **2 reachable commits /
417 distinct blobs**, with no detected credential/private/generated-path findings.
Largest blob: licensed `temple-deeparadhana.mp3`, **15554120 bytes**. Bundled audio
and historical curated screenshots explain repository size; no dependencies, generated
builds or unnecessary ZIP archives were present. Historical screenshots are retained
to preserve evidence, not misrepresented as fresh Phase 8 captures. No detected
history exposure requires rotation; pattern scanning cannot prove no possible secret exists.

## Hosting/access decision

Compared current official Render and Railway documentation/pricing. Selected a paid
Render Node web service in Singapore, one instance/process, frontend + REST + WS on
one origin. Starter-sized current plan ID `0.5c-512mb` is $7/month compute plus any
workspace/usage charges; Hobby currently includes 5 GB egress/500 build minutes.
See runbook for price caveats, Railway comparison and dated official URLs.
Free sleep/restarts/quotas are unsuitable as a reliability guarantee for ephemeral rooms.

No provider credentials (`RENDER_API_KEY`, `RENDER_API_TOKEN`, `RAILWAY_TOKEN`,
`RAILWAY_API_TOKEN`) were present; no Render/Railway/Docker CLI was found. Only
presence booleans, never values, were inspected. Provisioning, paid budget approval,
GitHub host integration and a generated service hostname require owner action.
No provider resources were created, and no public staging URL is invented.

Public portal DNS read-only lookup returned A **185.27.134.178**. A Windows curl
HEAD attempt did **not** verify HTTPS: `curl: (56) schannel: server closed abruptly
(missing close_notify)`. This is an observed client/endpoint transport failure, not
proof of portal outage, valid certificate, ownership or backend hosting support.
InfinityFree support lookup returned HTTP 404 and a search request HTTP error;
exact plan capability remains unverified. No Node/WS support is assumed, and the
backend is not targeted there. No DNS, nameserver, TLS, portal or live DB setting changed.

## Necessary, reversible changes

- `backend/src/config.ts`: default-off `STAGING_DEMO` and `SERVE_FRONTEND`.
  Production demo is permitted only by explicit staging opt-in, DEMO_MODE=true,
  no Supabase URL/key and existing private organiser auth. Ordinary production
  validation remains fail-closed. HTTPS room origins remain mandatory in production.
- `backend/src/app.ts`: explicit demo selection and opt-in static mounting after API.
- `backend/src/static.ts`: serves built public folders/index, HTTP SPA fallback,
  MIME/ranges, hashed cache policy, strict script CSP, anti-frame and staging noindex.
  Missing API/assets, dotfiles and source maps do not become index HTML. No CORS widened.
- `backend/.env.example`, `deploy/staging/.env.example`: safe names/placeholders only.
- `.node-version`, `render.yaml`: tested Node pin, paid Singapore one-instance manual
  deployment, safe build/start/health commands, generated private token, no DB/DNS hook.
- `backend/test/deployment.test.ts`, `backend/test/restart.test.ts`: guard/static/demo
  safety and truthful room loss on owner replacement.
- `frontend/playwright.staging.config.ts`, `frontend/e2e-staging/`: compiled-server
  loopback HTTPS/WSS tests, dynamic temporary self-signed certificate and native proxy.
- `scripts/audit_git_history.py`: read-only full-history blob/private-path scanning.
- `deploy/portal-link.html`: accessible scoped, inert-by-default portal integration.
- README and website plan point to current Phase 8 instructions; historical reports remain.
- Phase 8 gaps/runbook/matrix/rollback/report provide source-backed handoff and gates.

No gameplay, artwork, audio, payment recipient/QR, migration or DB contract changes.
No new runtime packages, alias credentials, account system, second room owner or
separate cross-origin backend are introduced. No production environment is edited.

## Fresh checks — observed, not copied from Phase 7

Windows PowerShell, Node 24.18.0, npm 11.16.0, Python 3.12.10 and installed Edge /
SwiftShader. Initial `npm ci --offline --ignore-scripts --no-audit --no-fund` succeeded
in both apps: frontend 114/backend 143 packages; npm reported approximately 1 minute
each under concurrent load (exact install wall duration was not separately captured).

| Baseline command | Exit/result | Observed duration |
| --- | --- | --- |
| frontend `npm run typecheck` | 0, PASS | 3.381 s |
| frontend `npm test` | 0, 65/65, 23 files | 1.71 s Vitest / 2.578 s wall |
| frontend `npm run build` | 0, PASS | 2.137 s wall |
| backend `npm run typecheck` | 0, PASS | 3.379 s |
| backend `npm test` | 0, 44/44, 7 files | 18.40 s Vitest / 19.245 s wall |
| backend `npm run build` | 0, PASS | 0.753 s |
| root `python -m unittest discover -s scripts -p "test_*.py"` | 0, 7/7 | 0.453 s |
| frontend/backend `npm audit --json` | both 0, zero reported vulnerabilities at all levels | Audit wall duration not captured |
| Python official Render schema validation of render.yaml | 0, PASS | Not account/provisioning validation |

Baseline production bundle: entry 378.03 kB (119.84 gzip), CSS 35.61 (8.46), lazy
scene 1018.27 (269.96). Existing large-chunk warning and Three Clock/shadow/CJS
deprecations remain; no gameplay assets were removed to reduce size.
No hardware FPS, physical phone, cross-device thermal or real native-share delivery
claim is made. Public host performance/latency is NOT TESTED.

### Failures retained honestly

The first updated backend suite ran while software-rendered browser QA was also
active: **46/48 passed, 2 failed**, 30.60 s. Both failures were existing room movement
polls (group-offer travel and private session-gift travel). Typecheck passed; build
was deliberately not run after that failed suite. No movement assertions or limits
were weakened. `npm test -- test/rooms.test.ts` then passed **13/13**, 46.85 s,
without changing room/gameplay source; backend build passed. Resource contention
is a hypothesis, not a proven cause. Final serial results are recorded below.

New targeted `npm test -- test/deployment.test.ts test/restart.test.ts` passed
**5/5**, 0.892 s; backend typecheck and build passed. These directly verify static
serving, immutable/media cache/ranges, no private/map fallback, explicit staging
guards, demo QR refusal/pending references/auth denial, and fresh-owner resume rejection.

Initial compiled HTTPS browser command
`npm run test:e2e -- --config playwright.staging.config.ts` passed **2/2**, **34.7 s**.
It exercised the actual compiled server, same-origin frontend/CSP, actual first frame,
media/HTTP fallback/privacy, WSS capacity/isolation and foreign-Origin rejection.
This used a generated local self-signed certificate with test-only trust bypass, not
a public certificate. Later expanded playback/export/resume assertions are rerun below.

## Verification scope and live status

PASS: observed ZIP/GitHub match, baseline local builds/units, initial schema/dependency/
history scans and compiled local HTTPS/WSS smoke above. FAIL: explicitly recorded
transient tests/transport probes, never hidden. BLOCKED: provider signup/billing/
credential access, Linux host build, assigned URL, actual public TLS/WSS/proxy,
portal link and public staging QA. NOT TESTED: physical phones, actual host load/RTT,
live Supabase outbound/RLS/persistence, bank-app settlement and operational rollback.

Supabase staging credentials are deliberately absent. No migration or live data write
is necessary for disposable staging. Existing SQL files remain but must not be applied
blindly. Phase 8 makes no payment activation; demo references are pending and ephemeral.
Secrets never enter VITE variables, reports or committed examples. Trust proxy remains
conservatively 0 until the actual provider forwarding chain is verified; shared-edge
throttle limits and rolling-deploy room resets are explicit operational limitations.

## Plan comparison, rollback and next actions

The traceable requirements matrix is `PHASE8-REQUIREMENTS-MATRIX.md`, with inspected
source/tests, statuses, remaining work and deployment blockers. No reference-site
optional idea is smuggled into implementation. Rollback is in `PHASE8-ROLLBACK-PLAN.md`:
maintenance/drain, restore complete same-origin build + approved staging config,
announce room loss, verify before restoring only the portal anchor. No destructive
Git history or database rollback is required.

Owner: approve paid budget, create a new Render staging service, connect GitHub,
set exact assigned origin and private token, verify runtime/region/proxy, run live
gates, then authorise the minimal portal link. Do not send secrets in chat.
Agent after access: inspect actual build/logs, execute public TLS/WSS/media/gameplay
checks, record verified URL/commit/time, and assist with the approved portal addition.
Production blockers: unresolved QA failures, provider/host verification, public
security/operational drills, separate DB security review if used, physical-phone QA
and explicit production/payment approval. Do not promote staging automatically.

Final serial gates, Git publication and clean-extraction/archive receipts follow.

## Full browser run — failures not hidden

Fresh `npm run test:e2e` collected **71** cases and completed in **23.0 minutes**:
**66 passed, 5 failed**, exit **1**, no retries. Failed cases:

- `bazaar.spec.ts`: six-stall traversal exceeded its 180-second test timeout at Reset.
- `commerce.spec.ts`: published vendor approach prompt was not found within 20 seconds.
- `phase3.spec.ts`: cancel expected teal but observed saffron; failure snapshot showed
  the welcome screen, consistent with page state having reset, not proof of its cause.
- `phase7-social.spec.ts`: chaat approach missed the prompt; snapshot coordinates
  X5.9/Z15.5 were beyond the stall's intended approach.
- Historical `phase8.spec.ts`: Aarti notice missing after approach; snapshot X-9.8/Z3.0.

These are observed test failures, not declared application fixes or proven browser
limitations. Runtime/frontend gameplay files and existing assertions remain unchanged.
The broad run overlapped implementation and some other checks, so it cannot establish
a stable final-source all-green gate. Source is now frozen for serial reruns of all
five affected specs. Results follow; the original 66/71 result is retained regardless.
Expected WebGL/lazy-import fault-injection errors, old Three warnings, unmatched route
warning and a Vite teardown WS `ECONNABORTED` were also observed. No public load test ran.

This run measured renderer counts (Edge/SwiftShader, 1280×720 input DPR2, fireworks off):
low **613 calls / 64924 triangles**, medium **636 / 93056**, high **922 / 112868**.
These are bounded software-renderer workload counts, not hardware FPS or India latency.

Final backend checks run without an active browser suite: typecheck exit0 **6.450 s**,
`npm test` exit0 **49/49**, 9 files, **20.58 s Vitest / 26.214 s wall**, build exit0
**1.106 s**. New deployment/restart tests and all original room tests pass in this run.

## Serial recovery — original assertions preserved

On 27 October, with runtime source frozen and no concurrent browser suite:

```text
npm run test:e2e -- e2e/bazaar.spec.ts e2e/commerce.spec.ts e2e/phase3.spec.ts e2e/phase7-social.spec.ts e2e/phase8.spec.ts
```

passed **14/14**, **5.6 minutes**, exit **0**, no retries, including all five previously
failed cases. No original frontend, gameplay or browser-test file was changed to
obtain this result. This is not a claim that a subsequent full 71-case suite passed;
the initial 66/71 run and intermittent behaviour remain documented. An uninterrupted
full serial gate on the host candidate is recommended before production promotion.

Byte comparison against the source ZIP confirmed **125** protected frontend source,
public audio/gallery, shared rules, SQL migrations, package manifests/locks and QR
files are unchanged. The original Phase 7 ZIP checksum still matches its sidecar.
Staged diff whitespace check passed. The expanded Git payload scan passed **435 files**
and **11** ignore probes; Python release tests passed **7/7**, **1.102 s**. New exclusions
reject HAR files, TLS private-key/certificate containers and Git backup bundles in
addition to existing env/private/generated exclusions. Public example files remain allowed.

Expanded compiled-server HTTPS/WSS rerun:
`npm run test:e2e -- --config playwright.staging.config.ts` passed **2/2**, **18.4 s**,
exit **0**. Includes actual photo/souvenir PNG preview, rangoli PNG preview, user-gesture
native audio playback/pause under CSP, two then four simultaneous room members,
fifth rejection, separate room, socket close/resume and rejected foreign Origin.
`phase8-evidence/compiled-https-journey.png` is an actual local capture and was reviewed.
`load-metrics.json` records one local run: response end **12.3 ms**, DOMContentLoaded
**355.4 ms**, load event end **355.6 ms**, scene observed after entry **1761.1 ms**.
The last metric includes the test's entry action/waits, not an isolated GPU timing.
These timings are not public network latency or a physical-device benchmark.

Final frontend checks after browser QA: typecheck exit0 **1.895 s**; unit tests
exit0 **65/65**, 23 files, **2.69 s Vitest / 6.610 s wall**; production build exit0
**3.956 s**, with entry/CSS/lazy-scene sizes unchanged from baseline. Fresh frontend
`npm audit --json` again returned exit0, zero reported vulnerabilities on 27 October.
No source maps are emitted by the default build. Runtime/OS advisories and actual
host patch level still need review before a public deployment; npm audit is not that review.

## Final clean-extraction gate

Executed:

```text
python scripts/release_zip.py --output C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase8-gate-20261027.zip --extract-to C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase8-gate-20261027
```

PASS, exit0: **436 files**, **136722787 bytes**, SHA-256
`f2457e18bcdad5f8abd37af10bf564b6e4a8350c3bc0f34c645a955bc6064b99`.
Safe single root, CRC, forbidden/env/key/HAR exclusions, required Phase 8 files,
secret scan and every extracted byte comparison passed. This is a verification
archive before final documentation receipts, not the final Desktop artifact.

In each app of this fresh extraction, commands were
`npm ci --offline --ignore-scripts --no-audit --no-fund`, `npm run typecheck`,
`npm test`, `npm run build`. All exited **0**:

| App | Install | Typecheck | Unit/API/WS tests | Build |
| --- | --- | --- | --- | --- |
| Frontend | 114 packages, 28.747 s | 5.354 s | 65/65, 2.69 s Vitest / 4.201 s wall | 3.613 s |
| Backend | 143 packages, 16.357 s | 11.409 s | 49/49, 18.44 s Vitest / 20.110 s wall | 1.172 s |

Frontend output matches the working build's asset names and sizes. Source maps:
zero. All **22** built frontend files passed credential scanning. Final source payload
scan: **436 files / 11 ignore probes**, PASS. Python release/audio/QR/security tests:
**7/7**, **0.521 s**, exit0. Backend `npm audit --json` was repeated on 27 October:
exit0, zero reported vulnerabilities, as with frontend. No lockfile/dependency change.

Only documentation receipts may change after this gate. The final Desktop release
is a **staging-preparation candidate**, not a production/live-staging certificate.
Its exact SHA-256, Git HEAD and verified remote status are recorded in the adjacent
delivery receipt and final response, avoiding self-referential archive/commit hashes.
The final archive is reopened, CRC/path/secret checked, extracted and byte compared
again. Provider access and live verification remain BLOCKED; original intermittent
suite failures remain recorded even though every failed case passed serial recovery.

## Verified Phase 8 GitHub publication

Normal fast-forward publication succeeded on 27 October after local/clean-extraction
gates: **`a8301bc76bf634ef282572373003f7b1e162ee98`**, branch **main**, at
https://github.com/khushdeepAnand/Banaras-Diwali-Mela- . Immediately before committing,
fetched origin/main still matched the inspected Phase 7 baseline; no unknown remote
work was overwritten. No force push or history rewrite occurred.

GitHub API readback returned **436 files**, non-truncated. Every remote Git blob hash
matched the corresponding local file. `render.yaml`, static server, portal template,
new tests, runbook/report/matrix/rollback and both existing SQL migrations are present.
Root now also includes `.node-version`, `deploy` and `render.yaml`. All **3 reachable
commits / 445 distinct blobs** passed the full-history private-path/credential scan.
No detected secrets require rotation; public test-only credentials must never be
reused for a live service. The repository discrepancy is resolved by direct evidence.

A documentation-only follow-up records this observed result without rewriting the
published application commit. Its final HEAD and Desktop ZIP hash are emitted in
the adjacent delivery receipt/final response and verified again against GitHub.
This avoids claiming a commit contains its own hash or a ZIP contains its own checksum.
No provider deployment, automatic production promotion or live portal change is implied
by a GitHub push. Public staging URL and deployment timestamp remain **none / BLOCKED**.
