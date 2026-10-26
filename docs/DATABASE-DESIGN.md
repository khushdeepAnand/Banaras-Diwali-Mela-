# Proposed database design (not provisioned)

> Historical foundation proposal, not the current schema. Phase 5 implemented `mela_settings`, `mela_contributions` and `mela_applications`; Phase 12 adds metadata-only `mela_audit_events`. See `backend/migrations/` and [phase12/STAGING.md](phase12/STAGING.md). The statements below describe the original proposal, not the current repository or a live provisioned database.

Supabase PostgreSQL is proposed; **no database, tables, migrations, policies, or credentials exist yet**. Refine this model and test its invariants before implementation.

- `users`: identity linked to an authentication provider; vendor/admin roles must be server-authorized, not self-assigned. Define staff onboarding and revocation before enabling admin operations.
- `stalls`: stable identifier, display information, availability and authoritative rental price in paise. Price history or immutable booking snapshots must preserve historical amounts.
- `bookings`: vendor, stall, price snapshot, reservation expiry, and state (pending, verified, rejected, expired). A partial unique index or dedicated reservation record must prevent two active claims on one stall; changes must be transactional, including expiration handling.
- `donations`: donor details (minimize personal data), amount in paise, pending/verified/rejected state and timestamps.
- `payment_submissions`: target donation or booking, payment reference, submitted time, and review state. Normalize reference identifiers and enforce a uniqueness rule within the appropriate receiving account/context; do not mark payment verified on submission.
- `payment_audit`: append-only actor, action, target, timestamp and reason for each administrative review/verification change. Restrict modifications and retain evidence according to a documented retention policy.
- `event_settings`: approved official QR destinations and event parameters; prevent unauthorized edits and publish only verified account information.

Before any public financial workflow: define foreign keys, check constraints (positive amounts and legal states), uniqueness and transactions, reservation TTL behavior, least-privilege access/RLS, backups, retention and an account-reconciliation procedure. Screenshots and user-entered references are not proof of settlement.
