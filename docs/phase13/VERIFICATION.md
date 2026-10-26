# Phase 13 final release-candidate verification

**Outcome:** existing Supabase integrated; migrations, database security and synthetic
persistence verified live. Application checks passed. **Not deployed; public payment
instructions disabled.** A submitted UTR is never settlement evidence.

## 1. Baseline and changed files

Baseline: `banaras-diwali-mela-phase12.zip`, extracted into
`/Users/khushdeep/Downloads/banaras-diwali-mela`. The older folder remains at sibling
`banaras-diwali-mela-pre-phase13-backup`; it was not deleted or merged blindly.
No Git repository exists. All Phase 12 files remain present. Both lockfiles,
migrations 001/002, all 16 project skills, world code, public assets, private QR,
audio and historical screenshots remain byte-identical to Phase 12.

| Changed/added paths | Reason |
| --- | --- |
| `backend/src/config.ts`, `app.ts`, `store.ts` | New server-only secret-key support, legacy compatibility, deterministic alias precedence/conflict rejection, public-key rejection, correct apikey-vs-JWT transport |
| `backend/test/release.test.ts` | Three config/key/wiring regression tests |
| `backend/package.json`, `backend/.env.example` | Explicit env-file startup and documented runtime/optional temporary management variables |
| `frontend/playwright.config.ts` | Clear inherited Supabase credentials in isolated demo test subprocess |
| `frontend/e2e/{commerce,phase4b,phase6-final,phase8,phase10,phase11}.spec.ts` | Send screenshots to ignored test-results instead of overwriting historical reports; no assertions weakened |
| `scripts/check_supabase.mjs` | Read-only, redacted live Data API/readiness diagnostic |
| `scripts/verify_database.mjs` | Confirm project identity; execute exact SQL checks and actual browser-role denials; no migrations |
| `scripts/verify_live.mjs` | Explicit labelled live-write QA, restart persistence, organiser protection, failure handling; loopback-only contribution harness |
| `scripts/smoke_backend.mjs` | Isolate new credential alias during no-credentials compiled API smoke test |
| `scripts/release_zip.py` | Detect exact local credentials including management token; require Phase 13 files; retain existing CRC/extraction/byte verification |
| `README.md`, `docs/phase13/*` | Current setup, executed evidence, migration history and remaining launch gates |

The private `backend/.env` contains actual local credentials and a generated organiser
token from **32 random bytes**; it is not source or a deliverable. No secret values
were printed. Packaging excludes it and compares local credential values against
eligible source/assets. The temporary management token is not passed to spawned
backend processes and is not required in production.

## 2. Existing Supabase connection and migrations — LIVE

- Management API project lookup confirmed the configured URL matches the existing
  dashboard project **Diwali Mela** (requested “Diwali mela”, capitalization only).
  Project status: ACTIVE_HEALTHY. No second project was created.
- Read-only preflight found **zero public business tables**, so no existing public
  records required repair or deletion. Other Supabase internal schemas were untouched.
- Applied the exact `backend/migrations/001_mela_commerce.sql`, then exact
  `002_staging_hardening.sql`, through HTTPS Management API SQL execution. Each
  returned HTTP 201/success. **001 was not reapplied after 002.**
- Executed exact `docs/phase12/VERIFY-DATABASE.sql` and
  `docs/phase13/VERIFY-SERVICE-ROLE.sql` successfully; synthetic SQL rows rolled back.
- Validated `mela_contribution_input` and `mela_application_input` successfully.
- Immediately after migrations/checks: settings=1, contributions=0, applications=0,
  audit=0. No destructive resets, business-table drops, truncation or cleanup used.
- Ran exact `docs/phase13/PREFLIGHT-DATABASE.sql` again during final verification.
  Public grants summary returned 11 rows; no private record payloads were logged.

Migration command/SQL execution record: [MIGRATIONS.md](MIGRATIONS.md). Live API
readiness now returns health=200, public-config=200, mode=supabase, demo=false,
applicationsOpen=true, accepting=false. All four private Data API tables are
reachable by the backend key (HTTP 206 for a count-only limit=0 request).
`/api/health` alone is **only liveness**, never database readiness.

## 3. Database and organiser security — LIVE plus LOCAL regression

- RLS=true on settings, contributions, applications and audit.
- Actual `SET LOCAL ROLE anon` and `authenticated` SQL tests denied SELECT, INSERT,
  UPDATE and DELETE on each private table (32 denied operations total). Both roles
  have rolbypassrls=false. This is actual database-role testing, not a browser JWT
  session or mocked RLS test.
- Existing migration service grants verified: SELECT/INSERT/UPDATE on business
  tables; no DELETE/TRUNCATE/REFERENCES/TRIGGER; audit SELECT only, no API writes.
- Case-insensitive duplicate UTR, invalid amounts, application checks and metadata
  audit triggers passed the existing rollback verification SQL. Both new input
  constraints are now validated, not merely NOT VALID.
- Valid organiser bearer retrieved the actual test application/contribution after
  restart. All four organiser route types denied missing/wrong tokens (401).
- Wrong applicant email returned 404; public lookup omitted email, phone, vendorName,
  UTR and requestHash. Synthetic stall never appeared in the public directory.
- Authorised rejection of the labelled QA application generated a service_role audit
  event with changed field `status`. No contacts/UTRs copied into audit payloads.
- Isolated invalid-key Data API failure returned generic 503 for readiness and
  application creation, without success data, credentials or internal details.
- Local tests also cover malformed/oversized/compressed bodies, throttling, guarded
  public payment updates, database failures, private caching and fail-closed startup.

One **verification-script defect** was found: UPDATE of audit's GENERATED ALWAYS id
failed SQL validation before checking permission. The denial probe now uses the
ordinary `occurred_at` column with `WHERE false`; rerun passed. This was not a live
schema/security defect and no grant or policy was loosened.

## 4. Real persistent workflows — LIVE, with explicit contribution test seam

Command: `node --env-file=backend/.env scripts/verify_live.mjs --confirm-live-test-writes`.
All eight grouped checks passed. Labelled records retained, not deleted:

| Table | Reference | Final state |
| --- | --- | --- |
| mela_applications | Redacted for public distribution | Synthetic QA record; rejected by authorised QA review; pending_payment; unpublished |
| mela_contributions | Redacted for public distribution | Synthetic QA record; ₹21; pending_verification |

Phase 7 publication note: live record references and their correlation identifier
were removed from this public report. The original historical report remains in
the unchanged private Phase 6 baseline archive. No live record was edited.

Application: real production backend POST returned 201; independent Supabase read
confirmed persisted values/authoritative fee; duplicate 409 and invalid duration 400;
wrong-email lookup 404; correct lookup privately redacted. Both records survived an
actual compiled production backend **process stop and restart**, verified through
organiser API and independent database reads.

**Contribution qualification:** normal backend correctly returned 503 while payment
instructions are disabled. A separate **loopback-only harness** used the unmodified
HTTP handler and real Supabase adapter, overriding only its settings read in memory
to permit a clearly synthetic reference. It returned 201 only after the live write;
independent DB read confirmed amount/status; case-insensitive duplicate returned 409;
invalid amount returned 400. Supabase payment settings were never enabled/changed.
No public frontend, QR or public contribution collection was enabled. This proves
the HTTP persistence path under a controlled test seam, **not a publicly enabled or
recipient-approved payment workflow**. No payment record was marked verified.

## 5. Payment status and remaining organiser actions

No gateway, webhook, automatic settlement or real payment was verified. No funds
were sent. Supplied QR/name/UPI were preserved without asserting ownership. Recipient
enabled=false remains stored in Supabase. Contributions remain pending manual review.

Before public instructions: independently decode/check original QR; confirm payee
name, UPI ownership and amounts in a trusted payment app; approve receipt/privacy/legal
terms and retention; assign reconciliation operator. Only actual bank/UPI ledger
evidence permits marking a real payment verified. Reconcile references across
contributions and rentals manually. The synthetic records above are not real payments.

Revoke the temporary management token in Supabase Account → Access Tokens, then
remove its line from the private local `.env`. Keep runtime secret/admin token in a
password manager/provider secret manager; never in frontend or archive. If backup
restore, retention and operator procedures are not yet agreed, do so before launch.

## 6. Exact commands and results

Environment: macOS, Node **24.22.1**, npm **11.19.1**. Shell PATH prefix used:
`export PATH=/Users/khushdeep/.nvm/versions/node/v24.22.1/bin:$PATH`.

| Directory | Exact command | Actual result |
| --- | --- | --- |
| backend | `npm ci --no-audit --no-fund` | Passed, 142 packages; npm install-script policy warnings |
| frontend | `npm ci --no-audit --no-fund` | Passed, 115 packages; npm install-script policy warning |
| backend | `npm run typecheck` | Passed, rerun after live checks |
| backend | `npm test` | Passed: 4 files, 25 tests, rerun after live checks |
| backend | `npm run build` | Passed, rerun after live checks |
| frontend | `npm run typecheck` | Passed, rerun after live checks |
| frontend | `npm test` | Passed: 14 files, 30 tests, rerun after live checks |
| frontend | `npm run build` | Passed, rerun after live checks |
| both | `npm audit --omit=dev --audit-level=low` | Passed, 0 production vulnerabilities |
| both | `npm audit --audit-level=low` | Passed, 0 vulnerabilities including dev dependencies |
| root | `node scripts/smoke_backend.mjs` | Passed compiled health/unavailable storage/auth/JSON404/redacted unsafe production startup |
| frontend | `npm run test:e2e` | First invocation tool timeout at 120s after 3 passes; not counted as full pass |
| frontend | `npm run test:e2e` | Second invocation, unlimited tool timeout: **30/30 passed, 13.5 minutes** |
| root | `node --env-file=backend/.env scripts/check_supabase.mjs` | Initial exit2: tables missing, honest readiness503; after migrations exit0: all tables reachable, readiness200, paymentInstructionsEnabled=false |
| root | `node --env-file=backend/.env scripts/verify_database.mjs` | First run found probe SQL identity-column issue; fixed probe, final rerun passed both exact SQL files, RLS, validated constraints and all browser-role denials |
| root | `node --env-file=backend/.env scripts/verify_live.mjs --confirm-live-test-writes` | Passed eight live grouped checks; two labelled QA records retained |
| root | `node --check scripts/verify_live.mjs` | Passed |
| root | `node --check scripts/verify_database.mjs` | Passed |
| root | `node --check scripts/check_supabase.mjs` | Passed |

Unit/API store-transport tests are **mocked/local**, not live evidence. Browser suite
uses an isolated demo backend (3101), Vite (5174), Chromium/SwiftShader, not the live
database. Its simulated database failures and synthetic verified demo listing are
not real payments. No assertions were deleted/weakened.

Browser checks cover desktop/mobile controls, camera, river/ghats/diya/Aarti,
fireworks, wheel/pendulum, ferry/cruise, market interactions, audio/autoplay fallback,
contribution/application/error UI and organiser denials. Reviewed fresh desktop and
mobile captures at `frontend/test-results/phase8/{desktop-riverfront,mobile-portrait}.png`.
These disposable outputs are excluded from the ZIP. Physical phones/GPUs remain
unverified. Existing Three.js deprecation and 999.57 kB scene-chunk warnings remain;
no unrelated architecture/visual rewrite was used to suppress warnings.

## 7. Packaging and deployment

Final archive target: `/Users/khushdeep/Downloads/banaras-diwali-mela-phase13.zip`.
Packaging uses `scripts/release_zip.py`: single `banaras-diwali-mela/` root, complete
source/assets/docs/migrations/tests/lockfiles/skills/examples; excludes real `.env*`,
node_modules, dist, caches, reports, logs and Git. Source and frontend bundles scanned
for secret patterns plus exact local runtime/admin/management credential values.
Archive creation checks CRC, freshly extracts, scans again and SHA256-compares every
extracted file to source. Archive metadata/digest is emitted separately, avoiding a
self-referential archive hash. See [ZIP-VERIFICATION.md](ZIP-VERIFICATION.md) for the
final packaging/extracted-build commands and evidence.

Deployment status: **prepared, not attempted**. No hosting account/domain or deployment
permissions supplied; no website or staging HTTPS deployment is claimed. Follow
[LAUNCH.md](LAUNCH.md): same-origin HTTPS static frontend plus `/api` Express proxy,
provider secrets, NODE_ENV=production, DEMO_MODE=false, provider PORT, verified proxy
trust only. Never statically serve backend/private or the repository root.

Remaining public-launch gates: recipient/QR approval and controlled enabled-flow QA;
physical hardware/network/accessibility review; staging host/domain/secrets and HTTPS
smoke tests; gateway rate limits, privacy/retention, backup/restore/alerts and organiser
launch approval. No public production deployment is authorised by this release.
