# Phase 12 verification

Authoritative input: `C:\Users\khush\Desktop\banaras-diwali-mela-phase11.zip`, extracted into a new `Temp\opencode\phase12\banaras-diwali-mela` workspace. The temporary Phase 11 work folder was not used. Read Phase 11's verification before changes. Its **27/27** browser result is inherited evidence, not this phase's result.

## Changes and preservation

- `backend/src/{config,server}.ts`: validated production configuration, safe startup failures, explicit proxy trust and signal shutdown.
- `backend/src/{app,commerce,store}.ts`: no-store responses, bounded inputs, grouped abuse limits, safe body/error responses, guarded public payment updates, duplicate demo UTR handling, checked database updates/settings and paged reads.
- `backend/package-lock.json`: retained, with **only `node_modules/body-parser` metadata** updated 2.3.0 → 2.4.0. Necessary compatible security fix for GHSA-27r3-jxmh-p828. `backend/package.json` unchanged; no direct dependency added. Frontend lockfile unchanged.
- `backend/migrations/002_staging_hardening.sql`: additive constraints/indexes, reduced service privileges and metadata-only audit triggers. 001 unchanged; no business records deleted or migrated here.
- `frontend/src/components/{commerceApi,CommercePortal}.tsx/ts`: API timeouts/malformed-response rejection and API-base-aware QR URL. Existing success/manual-review semantics preserved.
- `backend/test/staging.test.ts`, frontend API tests and `frontend/e2e/phase12.spec.ts`: failure, security, persistence and compressed-body regression coverage.
- `frontend/e2e/aarti.spec.ts`: movement-loop boundaries now continue at equality to satisfy their existing **strict** arrival assertions. No assertion, timeout, test or feature removed or weakened.
- `.env.example`, API/schema documentation, staging runbook and verification scripts updated. All 15 original skills preserved; dedicated workflow-only Caveman skill added (16 total).

Byte comparison against the input ZIP confirms all existing `frontend/src/world/`, `frontend/public/`, backend QR asset, migration 001 and original skill files are unchanged. App.tsx/style.css and existing attractions were not modified. No character/game content was introduced. Historical screenshots overwritten by capture tests are restored from the authoritative ZIP after browser testing; no historic image is presented as new Phase 12 evidence.

## Executed checks

Windows, Node 24.18.0, npm 11.16.0. Commands below run in the stated directories.

| Directory | Exact command | Actual result |
| --- | --- | --- |
| `frontend/` | `npm ci --no-audit --no-fund` | Passed; 114 packages |
| `backend/` | `npm ci --no-audit --no-fund` | Passed; 141 packages from baseline before targeted security update |
| `backend/` | `npm update body-parser --ignore-scripts --no-audit --no-fund` | One installed package changed; only one lock entry changed |
| `frontend/` | `npm run typecheck` | Passed |
| `backend/` | `npm run typecheck` | Passed on final backend code |
| `frontend/` | `npm test` | **14 files / 30 tests passed** |
| `backend/` | `npm test` | **3 files / 22 tests passed** on final backend code |
| `frontend/` | `npm run build` | Passed; scene 999.57 kB minified / 263.52 kB gzip; main 297.59 kB / 93.81 kB gzip |
| `backend/` | `npm run build` | Passed on final backend code |
| Both apps | `npm audit --omit=dev` and `npm audit` | Frontend 0 vulnerabilities. Backend initially 1 high in body-parser; after compatible update **0 vulnerabilities**, including dev dependencies |
| Repository root | `node scripts/smoke_backend.mjs` | Passed compiled HTTP liveness, unavailable storage/organiser fail-closed, JSON API 404 and redacted invalid-production startup |
| `frontend/` | `npm run test:e2e -- --reporter=line` (first run) | **29 passed / 1 failed**, 8.2 minutes; mobile Aarti loop stopped at rounded X = -2.3 before asserting X < -2.3 |
| `frontend/` | `npm run test:e2e -- --reporter=line` (final run) | **30 passed / 0 failed**, 8.3 minutes, no retries |

The final full run starts fresh demo backend/Vite servers after the backend security update. All 27 inherited browser tests and 3 new Phase 12 tests run; no retry configuration added. New browser tests cover contribution failure/retry, stall persistence failure/retry, incorrect organiser token and failed public configuration. Unit coverage additionally exercises every organiser endpoint, unconfigured/partial production environments, private fields, duplicate UTRs, guarded payment writes, malformed/oversized/compressed requests, network/DB errors and zero-row PATCHes.

No lint script/configuration exists, so lint was not run. Vite retains the existing >500 kB scene-chunk warning. Three.js emits existing CJS/Clock/shadow-map deprecation warnings. These are not build/test errors and do not establish physical-device performance.

## SQL evidence: syntax only, no database execution

No Supabase credentials were present. No live connection, migration application, DB role/RLS test, deployment or real payment verification occurred. No PostgreSQL server or Docker runtime was available. Adapter transport success/error tests use mocks; demo storage is per-process memory, not durable storage.

Installed the **external QA tool only**, not a project/runtime dependency:

```powershell
python -m pip install --target 'C:\Users\khush\AppData\Local\Temp\opencode\phase12-sql-tools' pglast
$env:PYTHONPATH='C:\Users\khush\AppData\Local\Temp\opencode\phase12-sql-tools'
@'
from pathlib import Path
from pglast import parse_sql, parse_plpgsql
for path in [*Path('backend/migrations').glob('*.sql'), Path('docs/phase12/VERIFY-DATABASE.sql')]:
    text = path.read_text(encoding='utf-8')
    print(path, 'SQL statements:', len(parse_sql(text)), 'PL/pgSQL bodies:', len(parse_plpgsql(text)))
'@ | python -
```

Passed: 001 **11 statements / 0 procedural bodies**, 002 **20 / 2**, verification SQL **3 / 1**. PostgreSQL/PL/pgSQL parsing does **not** prove table permissions, triggers or constraints execute correctly. The organiser must apply/test on staging using [STAGING.md](STAGING.md) and the rolled-back SQL checks before enabling collection.

## Packaging gate

`scripts/release_zip.py` scans source credential patterns, excludes real `.env` files, dependencies/builds/caches/logs, verifies required files and one forward-slash `banaras-diwali-mela/` root, checks ZIP CRC, extracts into a new directory and byte-compares every file. Source and built frontend scans found no service-role JWTs, secret keys or private-key patterns. Public supplied QR/payee details and explicitly test-only tokens are not live credentials. Pattern scanning cannot certify arbitrary secrets that were never supplied; no live secrets were configured in this workspace.

Final packaging command (repository root):

```powershell
python scripts/release_zip.py --output 'C:\Users\khush\Desktop\banaras-diwali-mela-phase12.zip' --extract-to 'C:\Users\khush\Desktop\banaras-diwali-mela-phase12'
```

Its successful output records actual archive file count, bytes and SHA-256 in the final delivery report. Fresh-extraction `npm ci --no-audit --no-fund`, `npm run typecheck`, `npm test`, `npm run build` in each app and `node scripts/smoke_backend.mjs` are the final delivery checks, reported after archiving; no unexecuted extraction build is claimed here. The verified extraction at `Desktop/banaras-diwali-mela-phase12/banaras-diwali-mela/` is retained as the latest working Phase 12 baseline; the original temporary inspection workspace is not the handoff baseline.

## Remaining staging blockers

Requires live credentials and organiser action: apply/validate migrations, execute RLS/audit tests, verify durable storage across restart, configure HTTPS/proxy/token rotation/backups/gateway limits, approve privacy/retention, independently verify the supplied recipient/QR and reconcile any genuine payments. Keep payment instructions disabled until those steps pass. Shared-token auth is not individual staff identity. Physical GPU/mobile/accessibility checks and licensed devotional audio remain outstanding. See the practical staging checklist; this release is not launch/deployment certification.
