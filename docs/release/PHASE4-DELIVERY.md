# Phase 4 delivery and rollback

## Final Desktop layout

The requested handoff layout is:

```text
Desktop/
  banaras-diwali-mela-phase4/
    banaras-diwali-mela/
  banaras-diwali-mela-phase3-v1-20261025.zip
  banaras-diwali-mela-phase4-v1-20261025.zip
```

The Phase 3 source directory is renamed only after the Phase 4 archive passes
verification. This is the same edited project, not a replacement scaffold. Older
Phase 1/2/donation folders and their redundant Phase 1/donation ZIPs are sent to
the Windows Recycle Bin, not permanently erased. Only these explicitly named
project copies are targeted. Unrelated Desktop files are not touched.

Private credentials remain in the updated project's `backend/.env`. Phase 2 and
donation-folder env files were byte-identical to this file before consolidation.
Private QR candidates/reports remain in `backend/private/`, outside every ZIP.
Local configuration validates without network access; the organiser token is
still missing. No new token was generated or exposed.

## Archive verification protocol

The final receipt in the delivery response is authoritative for actual archive
size, file count and SHA-256. Do not put a ZIP's own hash inside its contents.

1. Use `python scripts/release_zip.py --output NEW_ZIP --extract-to NEW_DIRECTORY`.
   The script refuses existing destinations, scans eligible files for actual local
   secrets and private QR image hashes, excludes private/env/build/cache/dependency
   output, checks one forward-slash `banaras-diwali-mela/` root, verifies CRC,
   extracts and compares every file byte-for-byte.
2. In both extracted app directories run
   `npm ci --offline --ignore-scripts --no-audit --no-fund`,
   `npm run typecheck`, `npm test`, `npm run build`.
3. Scan the resulting production frontend with the existing release scanner.
4. Compare source against the preserved Phase 3 ZIP, retain historical records and
   record added/modified paths. Verify the original Phase 3 ZIP remains unchanged.
5. Publish the new versioned ZIP without overwriting the Phase 3 ZIP, then perform
   the scoped Desktop consolidation above. Final archive CRC and contents must
   still match the consolidated source.

## Evidence and limitations

The final-source candidate archive was created with
`python scripts/release_zip.py --output C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase4-final-check-20261025.zip --extract-to C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase4-final-check-20261025`.
It passed all326 entries' CRC, safe-root/private-secret scanning and extracted
byte comparisons. In that fresh extraction, both apps then passed
`npm ci --offline --ignore-scripts --no-audit --no-fund`, `npm run typecheck`,
`npm test`, `npm run build` (49 frontend and37 backend tests).
Only these delivery documents were updated after those checks; application,
test, asset, configuration and lockfile bytes are unchanged.

Final Desktop publication uses the same packager with
`--output C:/Users/khush/Desktop/banaras-diwali-mela-phase4-v1-20261025.zip`
and `--extract-to C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase4-delivery-20261025`.
The final terminal receipt verifies the documentation-inclusive archive again.
The retained original Phase3 ZIP has SHA-256
`87f76164fefc44ec1e736b8e05afc48966024a632b6ffd5304fc6656cc576b79`.
Source comparison records33 added/modified paths and no removed source files.

See `PHASE4-IMPLEMENTATION-REPORT.md` for exact tests, initial failures and corrected
reruns. In particular, the initial45-case complete browser run was41/45, not a
claimed all-green run. Subsequent focused runs cover all four original failures;
the final9-case run passed. Unit tests are49 frontend plus37 backend.

Curated, reviewed final screenshots:

- `phase4-captures/desktop-fountain.png`
- `phase4-captures/desktop-offering.png`
- `phase4-captures/mobile-fountain.png`
- `phase4-captures/mobile-offering.png`
- `phase4-captures/high-offerings.png`

No deployment, recipient approval, payment processing, licensed devotional music,
physical-device certification or database inventory persistence is claimed.

## Rollback

Stop the updated local server, extract the preserved Phase 3 ZIP into a separate
temporary location and privately supply its backend configuration. Do not overwrite
the updated working source or publish real env files. Gameplay needs no database
rollback: no migration or live data operation was performed. Rooms and inventories
are intentionally transient and disappear when their server process stops.
