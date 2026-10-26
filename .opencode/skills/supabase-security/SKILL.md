---
name: supabase-security
description: "Use when adding or reviewing Supabase integration, server-side validation, environment secrets, organiser authorization, migrations, contribution status, UTR manual review, or payment verification."
---

# Supabase Security

## Purpose

Protect money, data and organiser actions. The frontend is untrusted; the backend is the authority. No Supabase project exists; define the boundary before code.

## When to use

Use for database access, auth, roles, contributions, bookings, UTR review, payment state and migrations. Token rule: read the design/API docs, `backend/src/config.ts` and only the endpoint or migration under review.

## Workflow

1. Read the proposed model and API contract. Confirm whether the task is design, migration or endpoint work.
2. Define the actor, operation, allowed states and authoritative amount before writing SQL or HTTP.
3. Validate every request with Zod at the HTTP boundary. Use integer paise; never trust client totals, roles or status.
4. Put Supabase access only in the backend. Read credentials from server environment variables; validate them in `config.ts`; fail closed if absent.
5. Verify Supabase Auth tokens server-side and resolve roles from the database. Never accept a role from the request body.
6. Use transactions and constraints for stall reservation, contribution status and payment review. Audit every organiser action.
7. Add RLS/least-privilege policies appropriate to the connection mode, then test both allowed and denied paths.

## Project rules

- Never expose a service-role key through Vite, `frontend/.env`, client code or a built bundle. Only `VITE_*` values are public.
- `payment_submissions` starts pending. A submitted UTR or screenshot requests manual review; it never proves settlement.
- Only an authorised backend action after independent account reconciliation may set verified. Rejected and expired states remain explicit.
- Enforce uniqueness and idempotency for payment references in the correct account/context. Normalise references before comparison.
- Do not mark any unverified payment as paid, and do not show "paid" in the UI from client state.
- Add no database connection, migration or auth package unless the task asks.
- Commit neither `.env` files nor secrets. Keep `.env.example` values non-sensitive.

## Failure cases

Service-role keys in frontend env or bundle, client-supplied organiser roles, amount or status trusted from the browser, RLS disabled on a public table, an unverified UTR marked paid, missing authorization tests, and a migration that cannot be rolled back are release blockers.

## Verification

Search the diff and built frontend for secret names and service-role patterns. Run backend `npm run typecheck`, `npm test` and `npm run build`. Exercise unauthorised, wrong-role and replayed requests. Review migration constraints and audit coverage.

## Completion criterion

Secrets remain server-only, authorization is enforced server-side, every payment begins pending and cannot become paid without review, denials are tested, and no unverified contribution is represented as completed.
