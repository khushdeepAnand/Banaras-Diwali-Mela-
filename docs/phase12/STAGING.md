# Phase 12 staging runbook

This is engineering preparation, **not a live deployment or payment certification**.
The Phase 11 world, rides, audio, assets and visual settings are unchanged.
Current test evidence: [VERIFICATION.md](VERIFICATION.md). Earlier reports are historical.

## Status and inspected gaps

| Area | Status |
| --- | --- |
| World, desktop/mobile interactions | Existing functionality retained; see executed browser checks in verification |
| Contribution/application validation and error UI | Local/demo and mocked transport tests; no claim of durable live storage |
| Supabase adapter | Implemented; server-only service key, bounded requests, duplicate/error mapping, checked updates, paged reads |
| Migration 001 | Preserved byte-for-byte; inspected and syntax-parsed, not applied here |
| Migration 002 / RLS / audit | Added, syntax-parsed only; requires staging database execution and permission tests |
| Organiser protection | Server bearer-token checks on all four organiser endpoints; missing/wrong credentials tested |
| Payment | Disabled by default; every submitted reference starts pending manual review; no gateway/webhook integration |
| Stall persistence | Demo memory and mocked PostgREST tested; live persistence requires credentials and restart verification |
| HTTPS deployment / physical GPU / accessibility | Requires organiser environment and manual checks; not deployed here |

Verified gaps addressed: unchecked zero-row PATCH, missing/invalid settings fallback, public payment update overwriting administrative fields, demo stall-reference uniqueness mismatch, reference-path throttle bypass, unvalidated production configuration, malformed API success handling, request timeout, private-response caching and explicit oversized-body responses. Added database input checks, time-order indexes, least-privilege grants and metadata-only update auditing. No database structure was replaced.

## 1. Install and local startup

Use Node 24 and npm 11. Run `npm ci --no-audit --no-fund` separately in `frontend/` and `backend/`. Both lockfiles are retained and authoritative. No new application dependencies were added. The backend lockfile's single `body-parser` entry was updated from 2.3.0 to compatible 2.4.0 to fix high-severity compressed-body DoS advisory GHSA-27r3-jxmh-p828; the frontend lockfile remains byte-identical. Install from the **Phase 12** lockfiles, not Phase 11's vulnerable transitive version.

For a world-only session, run `npm run dev` in both directories. Open http://localhost:5173. Commerce is unavailable without storage; the world remains playable.

For an explicitly temporary local demo, in a backend PowerShell terminal:

```powershell
$env:DEMO_MODE='true'
$env:ADMIN_API_TOKEN=(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")
npm run dev
```

The token is for this backend instance, never a frontend build variable. Copy it privately into Organiser access if testing. Do not record it in screenshots. Demo data disappears on restart; no real funds should be sent.

## 2. Environment configuration

Backend `.env.example` contains **names/defaults only**. Create `backend/.env` locally or configure provider secrets; never archive it. `npm run dev` does not load this file automatically. Alternatives: export variables or build and run `node --env-file=.env dist/server.js` from `backend/`.

| Variable | Where / required value |
| --- | --- |
| `PORT` | Backend, default 3001 |
| `NODE_ENV` | Backend, `production` for staging/production |
| `DEMO_MODE` | Backend, `false`; production explicitly refuses demo mode |
| `SUPABASE_URL` | Backend, project's HTTPS origin, no credentials/path/query |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend secret manager only; paired with URL |
| `ADMIN_API_TOKEN` | Backend secret; generate at least 32 random bytes, minimum 32 characters |
| `TRUST_PROXY_HOPS` | Backend, default 0; exact trusted proxy count only after blocking direct backend access and overwriting forwarding headers |
| `VITE_API_BASE_URL` | Public build-time frontend value; blank recommended for same-origin `/api`. If absolute, use the same public HTTPS origin without `/api` suffix |
| `API_PROXY_TARGET` | Local Vite proxy only; default http://127.0.0.1:3001; not a production API setting |

Production fails before listening for missing DB/organiser settings, partial database configuration, invalid ports/proxy count, insecure Supabase URL or demo mode. Startup messages intentionally omit configuration values. `/api/health` is liveness only, not a database readiness claim. Probe `/api/public-config` too: missing schema/failed DB yields 503, not a fake successful connection.

## 3. Supabase migration and access

1. Create/select an organiser-owned **staging** Supabase project; keep service credentials out of Vite and version control. Back up any existing database first.
2. Apply `backend/migrations/001_mela_commerce.sql`, then `002_staging_hardening.sql`, in the SQL editor as the migration owner. Existing 001 tables/data/settings are preserved. Do not reapply 001 after 002: 001's broad service grant would undo least-privilege hardening.
3. 002 is transactional and repeatable. New checks are `NOT VALID`: they protect new/updated rows but do not discard legacy records. Review violations, correct only verified bad data with a backup, then run:

```sql
alter table public.mela_contributions validate constraint mela_contribution_input;
alter table public.mela_applications validate constraint mela_application_input;
```

4. Run [VERIFY-DATABASE.sql](VERIFY-DATABASE.sql) in staging. It checks RLS/grants, uniqueness, validation and auditing inside a rolled-back transaction. **Not executed here.** Also use Supabase's anonymous/authenticated REST clients to confirm private tables cannot be read/written. Do not add permissive public RLS policies.
5. Configure backend credentials; submit staging records, verify them directly in tables, restart the backend and confirm they remain. Exercise duplicate UTRs, wrong applicant email, expired/unpublished vendors, failed DB connection and all unauthorised organiser endpoints.
6. Update triggers append only table/id/time/DB-role/changed-field names to `mela_audit_events`. No contacts, UTRs or secret values are copied. This is shared-token/backend attribution, **not individual organiser identity or a payment receipt**. Audit records are read-only for the service role. Define retention and backup access with the organiser.

**Rollback:** Prefer rolling back application code first; 002 is additive and compatible with Phase 11. If required, drop only its three named `mela_audit_update` triggers, its two named input constraints and two named indexes using the SQL editor. Preserve the audit table and business rows; do not drop tables. Do not loosen RLS/browser privileges to recover service. Rehearse rollback on staging and retain backups. No rollback or migration was applied here.

## 4. Organiser access

The existing shared bearer-secret model is retained, not replaced by fake login or client-side hiding. Only `Authorization: Bearer ...` on the server authorises `/api/admin/records`, settings PUT, application PATCH and contribution PATCH. Token remains in React memory and is discarded on closing the portal; it is not saved to browser storage. Use trusted HTTPS only; restrict organiser network access at the proxy where possible. Rotate through the secret manager and restart backend to revoke old tokens. Separate individual identities/roles are not implemented; do not share the token broadly.

In-memory abuse limits group submissions across paths (12 per IP/15 min), lookups (60), and organiser requests (120). Forwarding headers are untrusted by default. Limits reset at restart and are per process; before public multi-instance launch configure gateway/WAF shared limits, especially organiser failed authentication and public writes. Tune limits for shared-network visitors, never disable server validation.

## 5. HTTPS deployment architecture

Use the existing split build behind **one public HTTPS origin**:

- Build backend with `npm run typecheck`, `npm test`, `npm run build` in `backend/`; run `npm start` with production secrets.
- Build frontend with `npm run typecheck`, `npm test`, `npm run build` in `frontend/`; serve **only `frontend/dist/`** as static files. Never serve the repository root or `backend/private/`.
- Route `/api/` to Express **before** any SPA fallback; preserve methods, headers, full `/api/...` path and backend status codes. Unknown API routes must remain JSON 404, never HTML 200.
- For non-API page routes, serve actual static files then `index.html` for React Router. Missing asset files should be 404, not SPA HTML. Keep hashed assets cacheable; do not cache API responses or index.html across releases.
- Keep `backend/private/organiser-jiofinance.jpeg` alongside `dist/` in the backend release: the protected QR route resolves that existing file from `backend/private/`, not `dist/private/`.
- Terminate TLS with valid certificates, redirect HTTP to HTTPS, configure HSTS after validating HTTPS, and prevent direct public access to the backend port. Forward `Authorization` unchanged. Set proxy request body limit to at most 16 KiB (or preserve backend JSON 413), adequate 15-second API timeout, and safe request logs without bodies/query emails/auth headers.
- No wildcard CORS is enabled. This release supports same-origin deployment; a separate API origin needs an explicitly reviewed allowlist/preflight configuration, not `*`. Rebuild frontend after public Vite variables change. Vite's dev proxy and `vite preview` are not production hosting.
- SIGINT/SIGTERM drain HTTP connections with a ten-second shutdown ceiling. Configure service restart, health checks, redacted logs and database backups in your chosen host. No provider/domain/account is assumed or provisioned.

## 6. Contributions and rental payment safety

The supplied recipient name, UPI alias and original QR remain unchanged and **disabled by default**. Public payee details are not service credentials. The QR is served only after server settings explicitly enable it in Supabase mode. Its path is tied to the existing payee details; clear that path when changing the recipient. HTTPS QR/payment URLs are organiser configuration, never a verified processor.

Before enabling instructions, the organiser must independently decode the supplied QR, verify account ownership and the payee shown by UPI apps, check that the alias/link and ₹21/₹31/₹51 or rental amount are correct, confirm consent/legal/privacy requirements and persistent storage, and assign a reconciliation operator. Test with clearly labelled staging records; **do not send money to prove a test passed**.

Keep recipient `enabled=false` until those checks are complete. Every submitted UTR remains `pending_verification`; submission is not settlement. Only after checking the actual recipient bank/UPI ledger (amount, payee, UTR, date and duplication **across contributions and rentals**) may an authorised organiser mark verified. No webhook, automated payment confirmation, refund processing or guaranteed stall reservation exists. Do not request PINs, OTPs or banking passwords. Configure applicant data retention and restricted review access before collecting real personal information.

## 7. Practical staging gate (organiser)

- [ ] Configure staging HTTPS origin, static SPA hosting and `/api` routing; no repository/private assets publicly browsable.
- [ ] Generate/secure organiser token; wrong/missing token fails on all organiser routes. Rotate and confirm old token fails.
- [ ] Apply both migrations in order; run DB verification script and live RLS denial checks; validate new constraints after checking legacy rows.
- [ ] Confirm `/api/health` 200 and `/api/public-config` healthy with payments disabled. Break DB credentials temporarily: submissions show failure, not receipts; restore and restart.
- [ ] Submit a stall application, confirm authoritative fee/private fields in DB, restart and check persistence. Wrong email must not retrieve status. Approve, submit a **test** UTR, manually mark the test record verified and publish; only then should it appear in Vendors. Unpublish/reject and test expiry.
- [ ] Submit a test contribution in a controlled staging session only after recipient checks; confirm pending status and duplicate protection. Do not equate submission with payment. Reset instructions to disabled after testing.
- [ ] Check audit events for organiser changes, without sensitive values; verify API errors/logs contain no credentials or applicant payloads.
- [ ] Run all documented tests/builds and browser suite; inspect desktop, portrait/landscape touch, rides, stalls, fireworks, audio and network errors.
- [ ] Test physical phones/GPUs, slow network, keyboard/dialog accessibility and licensed audio needs. Software-renderer results are not device performance proof.
- [ ] Configure gateway abuse limits, privacy/retention, backup restore rehearsal, alerts and rollback procedure.
- [ ] Approve recipient, reconciliation process and launch policy separately. Phase 13 owns final launch readiness.

## Remaining limits

No live credentials, migrations, RLS execution, deployment or actual payment reconciliation were available here. Database SQL parsing is not execution. Shared-token auth is not user-account management. Local rate limits are not distributed DDoS protection. Paged organiser reads are not a transactionally consistent snapshot during concurrent writes; use a single reviewer for reconciliation and refresh before changes. The existing large 3D scene bundle and software-WebGL performance need real-device checks; the bundled audio remains a demo chime, not licensed devotional music.
