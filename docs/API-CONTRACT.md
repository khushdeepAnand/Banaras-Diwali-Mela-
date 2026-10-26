# API contract (Phase 12)

Base path: `/api`. JSON success responses have `{ "data": ... }`; errors have `{ "error": { "code": "MACHINE_READABLE", "message": "Safe human-readable text" } }`. HTTP status codes carry outcome; do not rely on message text for program logic.

## Implemented routes

| Route | Access and semantics |
| --- | --- |
| `GET /api/health` | Public liveness, `200 { "data": { "status": "ok" } }`; not database readiness. Query parameters rejected |
| `GET /api/public-config` | Public mode, fees and enabled recipient configuration; database errors return 503 |
| `GET /api/payment-qr` | Public only when Supabase recipient instructions explicitly enabled; 404 when disabled, 503 without storage |
| `POST /api/contributions` | Validated amount **integer INR rupees** 21/31/51, UTR and optional contact. 201 only after store write; status pending_verification, never payment confirmation |
| `POST /api/applications` | Validated stall/vendor/contact/products/duration; backend snapshots fee in integer rupees, pending application, 201 after write |
| `GET /api/applications/:reference?email=...` | Unguessable reference plus matching applicant email; returns public status fields only. Wrong email/reference 404 |
| `POST /api/applications/:reference/payment` | Matching email plus UTR; conditional pending-review update, cannot overwrite verified/rejected records |
| `GET /api/stalls` | Approved, verified, published, unexpired public vendor fields; excludes contacts/UTR |
| `GET /api/admin/records` | Server-authorised organiser; includes private applicant/reconciliation data |
| `PUT /api/admin/settings` | Server-authorised organiser; validated recipient and fee settings |
| `PATCH /api/admin/applications/:reference` | Server-authorised organiser; approval, manual verification, publication are separate |
| `PATCH /api/admin/contributions/:reference` | Server-authorised organiser; manual verified/rejected state |

## Security and failure semantics

All organiser endpoints require the server's configured `Authorization: Bearer <ADMIN_API_TOKEN>`. Missing organiser configuration returns 503; absent/wrong token returns 401. No frontend state grants permissions. Zod schemas in `backend/src/commerce.ts` are the request field contract; unknown submission/admin fields are rejected. Reference path format is `BDMC-` or `BDMS-` plus 12 uppercase hexadecimal characters.

All API responses are no-store. Invalid JSON/schema/reference yields 400, duplicates 409, oversized JSON (>16 KiB) 413, grouped abuse limits 429 with Retry-After, unavailable persistence 503, unknown routes 404, unexpected errors 500 with no internals. A transport timeout can be ambiguous after a write; do not resubmit a new payment or assume it failed financially. Retry the same reference and reconcile duplicates with the organiser.

Demo mode is explicit, non-production and temporary; responses/UI label it. Unconfigured mode never promises persistence. Financial fields remain integer **rupees**, preserving the existing schema; no paise migration or processor was introduced. Submitted references are not proof of settlement. Only independent recipient-account reconciliation permits manual verification. See [phase12/STAGING.md](phase12/STAGING.md) for same-origin HTTPS deployment, secrets, live-database checks and payment safeguards. No live connection has been verified here.
