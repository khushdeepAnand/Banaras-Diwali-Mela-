# Phase 13 ZIP verification

Final output: `/Users/khushdeep/Downloads/banaras-diwali-mela-phase13.zip`.
Source remains intact at `/Users/khushdeep/Downloads/banaras-diwali-mela`.

## Packaging commands

From the project root, preflight packaging/extraction:

```sh
python3 scripts/release_zip.py --output /private/var/folders/7k/_6bnn64s3j947vkvkdsgqm5r0000gp/T/opencode/phase13-preflight.zip --extract-to /private/var/folders/7k/_6bnn64s3j947vkvkdsgqm5r0000gp/T/opencode/phase13-preflight-extract
```

From each freshly extracted `backend/` and `frontend/` directory:

```sh
export PATH=/Users/khushdeep/.nvm/versions/node/v24.22.1/bin:$PATH
npm ci --no-audit --no-fund
npm run typecheck
npm test
npm run build
```

Final packaging after verification-report update:

```sh
python3 scripts/release_zip.py --output /Users/khushdeep/Downloads/banaras-diwali-mela-phase13.zip --extract-to /private/var/folders/7k/_6bnn64s3j947vkvkdsgqm5r0000gp/T/opencode/phase13-final-extract
```

The same extraction/build commands are used on the final extraction. The packaging
script refuses overwrite, scans source for credential patterns and exact local secret
values, validates required paths, checks CRC, extracts into a new directory and
SHA256-compares every archive file with source. The final digest is emitted outside
the archive; embedding the ZIP's own hash in its contents would be self-referential.

## Results

- Preflight archive: **245 files**, one correct root; CRC, fresh extraction, secret
  scan and SHA256 byte comparison of all files **passed**.
- From preflight extraction: clean `npm ci`, both typechecks, backend **25/25** tests,
  frontend **30/30** tests and both production builds **passed**.
- Baseline byte comparison: all Phase 12 paths retained, both lockfiles and migrations,
  all 16 skills and supplied assets preserved. No scene/source redesign.
- Real env files, credential values, node_modules, build outputs and caches excluded.
- Frontend source/build credential scans passed; retained scene-chunk/deprecation
  warnings are documented, not hidden or treated as failures.
- Final handoff is gated on the final packaging script completing successfully,
  including CRC/extraction/byte checks. Final archive size/SHA256 and the post-package
  extraction-build result are reported alongside the delivered ZIP rather than
  embedded self-referentially. No archive is delivered if that gate fails.
