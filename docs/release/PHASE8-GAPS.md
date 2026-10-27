# Phase 8 inspection and boundaries

## Current free-hosting continuation (27 October 2026)

**NOT DEPLOYED.** Current instructions use `render.free.yaml`, never the retained paid
default. See current runbook before reading historical decisions below.

- Free Node/WS protocol support is documented, not a guarantee of adequate 0.1 CPU /
  512 MB capacity or reliable sessions. Sleep, restarts, quotas and ephemeral room/demo
  loss are expected. A card-backed account may bill overages; strict Rs 0 requires no
  payment method and no paid upgrade/add-on. Account eligibility/settings remain unverified.
- No provider credentials or live hostname are used. Exact WS origin must be set only
  after real assignment. No public TLS/WSS, Linux host, edge proxy, physical device,
  long-running load/idle test, actual free bill or live rollback has been verified.
- Latest local results: frontend 65/65, backend 49/49, Python 8/8, both typechecks/builds,
  clean offline reinstall/build/test and compiled local HTTPS/WSS 2/2. Existing large
  chunk/Three deprecation warnings remain. Full ordinary browser suite was not rerun;
  prior intermittent failures remain in the historical report rather than being hidden.
- Phase 7 hash in the user request conflicted with the actual ZIP, sidecar and receipts.
  Owner authorised proceeding with verified original bytes; actual SHA-256 is
  26e62aebd21ad5bff138d9ecba03b022e014d9d0154daeaed6afc062af54e048.
- Older private env/QR documents and differing history were found and preserved in an
  ignored, inert local historical store. They must never enter GitHub, runtime env or
  the latest ZIP. Keep the active folder to retain that private content. Public packaging
  excludes it deliberately; hashes and mapping enable byte-verified recovery locally.
- Final archive hash/size cannot be embedded in that same archive; matching sidecars,
  final handoff and local `private/PHASE8-FINAL-DELIVERY-RECEIPT.md` hold final values,
  final commit/readback, actual cleanup and archive-verification results.
- No production DNS, portal files, payments, live Supabase values, migrations or gameplay
  changed. No claim of production readiness is made. Owner must stop if free signup or
  service capacity is blocked rather than purchase resources.

---
## Historical initial Phase 8 inspection

Source: Phase 7 ZIP, 417 files, SHA-256
`26e62aebd21ad5bff138d9ecba03b022e014d9d0154daeaed6afc062af54e048`.
Checksum sidecar matches; ZIP CRC, safe paths and single root passed before extraction
into a new Phase 8 directory. Both app package versions are `0.1.0`.

Independent Git and authenticated GitHub API inspections show PUBLIC repository,
default/current branch main, remote SHA `39a6755f08c1005d698ba9afc6e1875249b7c0b5`.
Every ZIP file matches its remote Git blob hash. Two commits exist; the repository
is not empty or an unrelated initialisation. No history repair or overwrite is needed.
The earlier empty-repository report is contradicted by current direct evidence;
its historical cause cannot be established. Git history is attached only after byte
verification, without checking out or overwriting ZIP-derived files.

Baseline actually rerun: frontend typecheck, 65 tests, build; backend typecheck,
44 tests, build. Exact results are recorded in the Phase 8 report. Locks unchanged.

Current source gaps:

1. Express serves API only; a single same-origin game service needs safe static/SPA
   serving. REST and WS already share page origin; no CORS expansion is necessary.
2. `NODE_ENV=production` rejects demo storage. Secure disposable staging needs an
   explicit fail-closed demo opt-in that forbids Supabase credentials and still
   requires organiser authentication and HTTPS room origins. Production defaults
   must remain unchanged. Add only supported, documented settings, not aliases.
3. No provider/runbook/portal integration artifact or full-history scanner exists.

Selected architecture: one paid Render Node web service in Singapore, static
frontend + Express + native WS on one port; InfinityFree portal remains untouched.
Provider comparison and dated official references are in the staging runbook.
Paid provisioning requires owner billing approval; no service is created implicitly.
No Render/Railway credentials or CLIs were found. No live staging URL is available.

No new gameplay, database migrations, live DB writes, DNS/TLS/portal changes or
payment activation. Preserve gameplay, lockfiles, QR and audio bytes. All live
checks remain BLOCKED until a host is provisioned and reachable.

## Disposition on 27 October

GitHub discrepancy is resolved by direct live source/blob evidence, without history
repair. Same-origin static serving, isolated staging demo guards, native Render
configuration, portal template, history/key/HAR exclusions, tests and runbooks are
prepared. Frontend 65/backend 49/Python 7 pass in final fresh extraction. Full browser
run was 66/71; every failed case passed an unchanged serial 14/14 recovery run, and
compiled HTTPS/WSS/CSP/export/audio smoke passed 2/2. No all-green full rerun is claimed.
Live host/signup/billing/access, public TLS/WSS, portal authorisation, proxy validation,
runtime patch review and physical-device/production checks remain external gates.
