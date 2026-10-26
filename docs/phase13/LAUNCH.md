# Phase 13 release candidate — launch runbook

Use the **existing `Diwali mela` Supabase project**. Do not create another project.
Its actual dashboard display name was confirmed as **Diwali Mela** (capital M).
Migrations 001/002 are now applied there. Do not run 001 again on that project.
Phase 12 reports are historical, not live evidence. Current results belong in
[VERIFICATION.md](VERIFICATION.md). Preserve business records and payment settings.

## 1. Configure locally (macOS)

The agent created `backend/.env` with mode 0600 and a token from 32 random bytes.
It is local only, ignored and excluded from release archives. On a fresh extraction,
copy `backend/.env.example` to `backend/.env`, run `chmod 600 backend/.env`, and
generate the token directly into that file with a local script/password manager;
never print or send it in chat. Set `NODE_ENV=production`, `DEMO_MODE=false`.

1. In Supabase Dashboard select **Diwali mela**, confirm **Settings → General**
   name/project reference. Match the reference with the project URL.
2. Copy the project HTTPS origin from **Connect** or **Settings → Data API** into
   `SUPABASE_URL` in `backend/.env`.
3. From **Settings → API Keys**, copy the server-only `sb_secret_...` value into
   `SUPABASE_SECRET_KEY`. Leave `SUPABASE_SERVICE_ROLE_KEY` blank. A legacy
   `service_role` key can instead use `SUPABASE_SERVICE_ROLE_KEY` with the secret
   variable blank. Never use an anon/publishable key or a `VITE_*` secret.
4. Save the file without sharing it. Keep `PORT=3001`, `TRUST_PROXY_HOPS=0`
   locally. Do not change proxy trust until topology is verified.
5. In `backend/`: `npm ci --no-audit --no-fund`, `npm run build`, then
   `npm run start:local`. This explicit command loads `.env`; plain `npm start`
   uses the shell/provider environment. Shell variables override env-file values.
6. In `frontend/`: `npm ci --no-audit --no-fund`, then `npm run dev`.
   Open http://localhost:5173. No frontend Supabase credentials are needed.

The preferred secret variable wins only when the legacy alias is blank or identical.
Different nonempty aliases fail startup. Secret keys use only `apikey`; legacy keys
also use JWT Bearer. Missing/partial/unsafe production configuration fails before
listening; storage never silently falls back to demo. Configuration errors omit values.

## 2. Inspect before migrating — manual SQL Editor actions

HTTPS Data API credentials do **not** allow arbitrary SQL execution. The release used
a temporary, locally configured `SUPABASE_ACCESS_TOKEN` to call the Supabase Management
API and confirm project identity before SQL execution. This is not a backend runtime
credential: revoke it in Account → Access Tokens after verification and remove its
line from the private local file. Never include it in frontend/provider runtime secrets.
No Postgres password is required. The manual workflow below is an alternative for
future environments, not an instruction to rerun migrations on the verified project.

1. Confirm the dashboard name/reference as above. If this project contains real data,
   take an available database backup/export first. An existing production project
   must not be treated as disposable staging. Do not reset or drop anything.
2. Open **SQL Editor → New query**. Run [PREFLIGHT-DATABASE.sql](PREFLIGHT-DATABASE.sql).
   Inspect table names, counts, constraints, indexes, grants and audit triggers.
   These are counts/metadata, not business-row exports. Share only this nonsecret
   metadata and execution status, never credentials or applicant records.
3. If all commerce tables are absent and unrelated tables do not conflict, run
   `backend/migrations/001_mela_commerce.sql` once, then
   `backend/migrations/002_staging_hardening.sql`.
   If 001's schema already exists, verify it matches the file and run **only 002**
   if needed. A partial/mismatched schema requires investigation before proceeding.
   **Never rerun 001 after 002**: its broad grants undo hardening.
4. Run `docs/phase12/VERIFY-DATABASE.sql` unchanged, followed by
   [VERIFY-SERVICE-ROLE.sql](VERIFY-SERVICE-ROLE.sql). Capture actual SQL success
   or error messages. Both roll back synthetic rows; sequence gaps are harmless.
   On error, roll back an open failed transaction before investigating. Do not
   loosen policies/grants to make verification pass.
5. After reviewing any legacy violations, validate the two input constraints:
   `alter table public.mela_contributions validate constraint mela_contribution_input;`
   and `alter table public.mela_applications validate constraint mela_application_input;`.
   Preserve bad legacy rows until the organiser authorises a verified repair.

## 3. Live checks (after credentials and schema verification)

`/api/health` proves process liveness **only**. `/api/public-config` must return
`mode=supabase`, `demo=false`, `applicationsOpen=true` after an actual settings read.
A DB failure must yield a generic 503 without a success receipt or private details.

Repeat the read-only connection check from the repository root with
`node --env-file=backend/.env scripts/check_supabase.mjs` after building the backend.
It prints only HTTP/error codes, counts and readiness flags. Exit 2 means tables or
database readiness are unavailable; exit 1 means config/network failure. It does not
apply SQL or prove the dashboard project name, RLS grants, or payment settlement.

With an optional temporary management token configured locally, repeat the SQL-only
checks with `node --env-file=backend/.env scripts/verify_database.mjs`. It verifies
the dashboard name against the configured URL, runs the exact preflight and both
verification SQL files, tests actual anon/authenticated role denials, and checks
validated constraints/RLS. It never applies migrations or alters existing records;
synthetic SQL writes roll back, but identity sequence values can advance.

`node --env-file=backend/.env scripts/verify_live.mjs --confirm-live-test-writes`
is an **explicit live-write QA command**, not part of normal startup. Run only after
project/schema confirmation. It leaves labelled synthetic records, starts/stops an
isolated loopback production backend and checks real persistence. Its contribution
test uses a separate loopback-only injected settings read to allow a synthetic UTR
through the real HTTP handler and live adapter **without changing Supabase settings**.
The normal backend still rejects contribution submissions with payments disabled.
This harness is not proof of a publicly enabled contribution/payment flow. Do not
send money, mark synthetic payments verified, or rerun casually on an active project.

- Submit an application labelled `PHASE13 QA ONLY`, using an `example.test` email
  and synthetic contact information. Confirm `mela_applications` in Table Editor,
  stop/restart the backend, then re-query through the backend and database.
- Check invalid input 400, wrong email 404, missing/wrong organiser bearer 401,
  authorised records 200, and all four unauthorised organiser operations denied.
  Public responses must omit contact/vendor name/UTR/hash and unpublished listings.
- Contributions stay disabled until the organiser independently confirms the
  existing QR, recipient name and UPI ID. Do not enable instructions just for QA
  on a public/real-data project. Until that gate, a full live contribution POST is
  **blocked**, not passed. After approval, use a labelled synthetic UTR, amount 21,
  31 or 51, verify pending status in Supabase, restart, verify persistence, then
  test duplicate UTR 409 and invalid amount 400. Send **no money**.
- Never mark synthetic payment records verified. Audit can be tested by rejecting
  a clearly labelled QA application, not by inventing settlement evidence.
- Verify anon/authenticated database denials through SQL/catalog checks plus
  browser-role Data API tests where safe credentials are available. Do not add
  public policies. Backend service grants are SELECT/INSERT/UPDATE on business
  tables and SELECT only on audit; no DELETE or TRUNCATE.
- Only deliberately break credentials on an isolated local backend, not the live
  service. Confirm generic 503 and restore locally. No real data deletions; retain
  labelled QA rows unless the organiser separately authorises scoped cleanup.

## 4. Deployment and payment gates

Deployment is **not authorised or assumed**. No host, domain or repository is
provisioned. Follow [Phase 12 HTTPS topology](../phase12/STAGING.md#5-https-deployment-architecture):
one HTTPS origin, static `frontend/dist`, `/api/` proxy to Express before SPA
fallback, private backend port/files, forwarded Authorization, safe logs, no wildcard
CORS. Install/build both apps from lockfiles. Use provider secrets, `NODE_ENV=production`,
`DEMO_MODE=false`, provider `PORT`, and verified proxy hops. Include `backend/private`
with compiled backend but never serve it statically. Leave `VITE_API_BASE_URL` blank
for this same-origin topology. Stage and smoke-test HTTPS before requesting public launch.

Payments are manual review only: UTR is not proof, no verified gateway/webhook exists.
Preserve the supplied payee details without assuming ownership or correctness. The
organiser must independently decode/confirm QR and UPI recipient, verify amounts,
assign a reconciliation operator, and approve privacy/retention, backups, legal terms,
gateway abuse limits and rollback. Keep `recipient.enabled=false` until approval.
Only real bank/UPI evidence permits manual verification, never a submitted reference.
Check duplicate settlement references across contributions **and** rentals manually.

Browser-emulated mobile/SwiftShader checks are not physical-device performance proof.
Test real phones/GPUs, audio gestures, slow networks and keyboard accessibility before
launch. The retained scene bundle is large; no redesign or unrelated optimisation is
part of this release. Public production deployment requires explicit organiser approval.
