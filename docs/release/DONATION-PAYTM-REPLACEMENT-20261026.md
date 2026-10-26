# Owner-authorised Paytm QR replacement — 26 October 2026

## Decision and scope

The user explicitly supplied their own replacement Paytm image and requested
working donations. The actual file `C:/Users/khush/Downloads/paytmqr.jpeg` was
independently decoded offline: its payee matches **shreeramdiwalimela@ptyes** and
its name matches Khushdeep Anand, ignoring case. This supersedes the old candidate's
mismatch, not historical evidence or bank ownership/settlement verification.

**Implemented/Tested:** approved original crop, server/client byte verification,
payee display, real clipboard copy, amount-prefilled UPI links outside demo mode,
pending-only reference recording. **Not tested:** any real payment, bank account
lookup/ownership certification, physical banking-app scan or public deployment.

## Original and crop evidence

- Original:788x1280 JPEG, unchanged; SHA256
  `f2947b53820ba1b3a6ccfcef7406d004453d8f5440da816983a529d8ba8dc162`.
- Lossless pixel crop `(150,496,638,985)`,488x489 PNG; no resizing, binarisation,
  module redraw, logo overlay or substitute QR generation.
- Public `backend/assets/donation-paytm-qr.png`, SHA256
  `3d0887baef035c36ad1fb8ca4a404a96975abd4c81e393ee6a2a6e35d8776f14`.
- Original and crop decode identically. Quiet area:53 pixels on each side, more
  than four modules at source scale. Published PNG pixels match the original
  JPEG's decoded crop pixels.
- QR contains only `pa` and `pn`: **no amount or currency is encoded**. The deep
  link explicitly adds selected amount/INR; scanning the unmodified code requires
  entering the amount in the UPI app, as explained by the UI.
- Analysis-only320/256/240/200px previews all decode to the same original payload.
- Full poster/profile photo and raw reports stay under `backend/private/`, outside
  public/release output. The original poster hash is also rejected by the release
  scanner even if renamed. Only the approved crop ships.

Executed:

```powershell
python scripts/verify_paytm_qr.py C:/Users/khush/Downloads/paytmqr.jpeg --tools C:/Users/khush/AppData/Local/Temp/opencode/donation-qr-tools --report backend/private/paytm-verification-20261026.json --owner-authorised --publish
```

Result: payee/name match, original/crop match, all scaled decodes pass, no fixed
amount, encoded currency null. Owner publication approval is explicit; bank account
ownership remains unverified. No UPI URI was opened and no money was sent.

## Safety boundary and behaviour

- Shared DONATION config contains intended name/ID, approved hashes, owner approval
  and `bankOwnershipVerified=false`. Historical mismatch evidence is retained.
- `/api/payment-qr` serves only the approved PNG after SHA256 verification. Missing
  or altered bytes return404. This read-only asset needs no database; demo mode
  still refuses real QR serving.
- Frontend requires current matching server proof and recipient/hashes, then
  hashes the actual PNG before enabling QR/copy/open-UPI. Legacy flags alone,
  mismatched payee/hash, failed image or demo mode cannot enable instructions.
  Fetch timeout, abort and Blob URL cleanup are bounded per panel.
- Main donation and beggar support share the same DonationPanel. Demo sessions
  retain no real QR/name/payment link. Copy reports success only after clipboard
  success and offers honest failure text. Tests never click payment deep links.
- Suggested₹21/₹51/₹101 remain; references still accept only₹21/₹31/₹51. UI explains
  that₹101 can be sent externally but cannot receive a reference record here. No
  schema extension or fake₹101 receipt was added.
- Donation references use the approved public donation target, independently of
  rental-recipient enablement, but still require configured storage and all existing
  amount/UTR/contact/duplicate/rate validation. Every new record starts
  `pending_verification`. Only protected organiser reconciliation may mark verified.
- Fresh defaults use the approved ID. Existing live database settings were not
  rewritten. Legacy rental settings pairing this QR with another recipient are
  disabled in public config; admin settings reject an incorrect QR/payee pairing.
- Without storage, non-demo QR instructions can work but reference recording
  returns503; no fake receipt is offered. Deployment/production readiness is separate.

## Executed tests

- Frontend typecheck/tests: **56/56**,20 files. Backend: **39/39**,6 files.
- Backend tests include actual PNG hash, missing-store503, altered-file404, guarded
  recipient settings, non-demo pending references through an isolated in-memory
  store, duplicate prevention and protected review. No live Supabase writes.
- `npm run test:e2e -- e2e/donation-redesign.spec.ts e2e/commerce.spec.ts e2e/phase12.spec.ts`
  from frontend: **12/12**,2.7m. Approved UI uses a controlled non-demo config and
  real asset; reference POST targets only the isolated demo server and displays
  TEMPORARY DEMO/pending, never claimed live persistence.
- `npm run test:e2e -- e2e/phase2.spec.ts e2e/phase3.spec.ts e2e/phase4.spec.ts e2e/phase5.spec.ts e2e/donation-redesign.spec.ts`:
  **20/20**,4.0m after QR integration, including rooms, NPC/beggar, cameras/photo,
  inventory/offerings/fountain sound and the complete audio experience.
- `python -m unittest discover -s scripts -p test_paytm_qr.py`: **1/1**; exact crop
  hash/dimensions, private-poster exclusion and public-crop allowance.
- Decoder checks on actual browser-rendered QR captures:240x241 desktop,240x241
  portrait,240x242 landscape and206x206 on a320px screen; **all four match** the
  original payload. Curated UI evidence is in `paytm-captures/`.

No bank-app transaction, financial settlement or independent account-ownership
verification is inferred from these tests. The original image is preserved.
