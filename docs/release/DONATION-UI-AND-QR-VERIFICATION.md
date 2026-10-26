# Donation UI and QR verification

24–25 October 2026. Focused UI/safety update on the completed Phase2 source.
**Design implemented; payment activation BLOCKED by a decoded payee mismatch.**
No deployment, live database request/write, schema/RLS/permission edit, financial
transaction, account modification or payment enablement was performed.

## 1. Baseline, source and rollback

- Source: untouched Desktop `banaras-diwali-mela-phase2-v1-20261024.zip`, SHA256
  `de75e4890cc7752fd9b88970e6e626b266d7b219ca7b4807676adac53820e870`.
- Phase2 tracked text matched that ZIP before edits. Its working folder remains
  intact, including the user's newly added `.env`. Phase0/1/2 reports and skills
  are retained unchanged; their historical payment claims are not new verification.
- New working root:
  `C:\Users\khush\Desktop\banaras-diwali-mela-donation-ui\banaras-diwali-mela`.
  The backend env was copied privately into this new working copy, not into assets.
- Rollback: stop the new local backend and use the preserved Phase2 folder, or
  extract its ZIP into a new directory. No database rollback is necessary or run.
- No identified reference-mela website screenshot was available in the project or
  supplied with this turn. The supplied QR poster **was** inspected; the design
  follows the user's written teal/gold/festival requirements, not a claimed visual
  comparison with an unavailable website screenshot.

## 2. Actual QR result — NOT verified for the intended UPI ID

Original: `C:\Users\khush\Downloads\JioFinance QR Payment Poster.png`,1227x1282.
It visually matches the newly supplied attachment: JioFinance, Khushdeep Anand,
printed `shreeramdiwalimela@ptyes`.

Original SHA256:
`51adf81b52394ab832825d8a71c46f672cb59a9c86ffc6f414812ca2df467662`.

**ZXing-C++3.1.1 decoded one QR from the original.** The encoded `pn` is
`Khushdeep Anand`, but encoded `pa` is a **different numeric @jio address**, not
`shreeramdiwalimela@ptyes`. The full decoded payee and provider transaction IDs are
retained only in local `backend/private/donation-qr-verification.json` and
`backend/private/qr-check-reproduced.json`; they and the image are excluded from
release/public output. No equivalence of the two aliases or account ownership is
inferred. Printed text does not override the decoded address.

Decoded parameters:

| Parameter | Actual result |
| --- | --- |
| scheme/action | `upi://pay` |
| `pa` | DOES NOT MATCH intended `shreeramdiwalimela@ptyes`; full value private |
| `pn` | `Khushdeep Anand` — name matches the poster, not proof of ownership |
| `cu` | `INR` |
| `am` | Empty; no fixed amount encoded |
| `mam` | `0` |
| `mc` | `0000` |
| `tn`, `url` | Empty |
| `tid`, `tr` | Non-empty provider transaction parameters; retained in private report |

No payment was sent, URI opened or account queried. A decoder match is a payload
check, **not financial verification**. Current decision: withhold the QR and payment
actions. The intended ID above is used exactly, including `diwalimela` spelling;
the decoded alternative is never substituted as the intended public recipient.

### Lossless candidate extraction

- Original saved privately as `backend/private/donation-poster-candidate.png`.
- PIL integer crop `(left300, top420, right930, bottom1034)`,630x614, saved as
  `backend/private/donation-qr-candidate.png` (PNG). No module redraw/generation,
  thresholding, recolouring, icon overlay, resampling or reconstruction was applied
  to the candidate. Pixel bytes were compared with the same original-image crop.
- Crop SHA256:
  `ef280fd49776b4db41ce74caf8c4e30db4e507840e83acf2ab2fb98067e6eaee`.
- Complete code and original quiet area retained. Dark-pixel margins left/top/
  right/bottom are52/44/50/46 pixels (approximately at least four module widths).
- Both original and crop decoded to the **same exact payload**.
- Analysis-only in-memory resized previews at320/256/240/200px wide all decoded to
  that same payload. These did not replace/edit the candidate. No actual on-screen
  banking-app or physical-phone scan is claimed, and none is shown publicly.
- Reproduction tool `scripts/verify_donation_qr.py` reads the original, checks crop
  and decoded parameters, and writes only to a NEW private report path. It generates
  **no QR**. Exit2 intentionally refuses a mismatched recipient.

Executed command:

```powershell
python scripts/verify_donation_qr.py backend/private/donation-poster-candidate.png --tools C:\Users\khush\AppData\Local\Temp\opencode\donation-qr-tools --report backend/private/qr-check-reproduced.json
```

Result: decoded, identical crop payload, all four resize checks true,
`recipient_matches=false`, `fixed_amount=null`, instructions disabled. This expected
nonzero mismatch result is **not** presented as a verified payment QR.
ZXing-C++ was installed only as an isolated analysis wheel under the approved Temp
tools directory; Pillow was already installed. No app dependency/lockfile changed.

## 3. One shared donation experience

- Existing `CommercePortal` keeps its native modal, focus/close/Escape lifecycle,
  config fetch, error handling and pending-reference state. Its contribution branch
  renders a single reusable `DonationPanel` for both the main entry and beggars.
- Deep teal surface, warm-gold selected amounts, original inline diya accent,
  readable editorial heading, centered card, clear verification status, white
  non-QR placeholder, explicit intended-recipient labels and Back to Mela footer.
  No poster is presented as a finished page. No fake QR pattern or generated code.
- Scrollable native dialog with scoped CSS, mobile wrapping, >=44px new action
  targets and visible focus. Tests cover1280x800,390x844,844x390 and320x640 without
  horizontal overflow. Current curated captures in `donation-captures/` were inspected.
- Suggested choices **₹21/₹51/₹101** are clearly not payment requests. No custom
  amount: the existing API/database permit only₹21/₹31/₹51 references. ₹101 is
  explicitly suggestion-only and cannot be submitted; legacy₹31 remains available
  through the separate reference-amount selector. No schema change or false support.
- Copy-UPI control is present but **disabled**, with visible explanation; no Open
  UPI/payment link or candidate image is rendered. The current mismatch cannot safely
  fulfil operational copy/scan/payment acceptance gates. No clipboard success is
  fabricated. Implementing payment actions remains blocked, not silently completed.
- Live donation reference submission is paused in this UI while mismatch remains.
  Explicit isolated demo mode retains existing reference regression flows for
  supported amounts, labelled LOCAL DEMO ONLY/no payment. A201 or reference result
  remains pending/manual review, never received/paid/settled.

### Server-side safety

`backend/src/shared/donation.ts` is the sole public intended-recipient/evidence/
suggestion configuration used by server and UI. It contains no private payload,
transaction IDs or credentials. `qrVerified=false`, `instructionsEnabled=false` and
`qrStatus=payee-mismatch` cannot be overridden by an old accepting/enabled flag.
The public config includes this summary. New UI ignores legacy payee/QR links even
when an older server/configuration says accepting=true.

`/api/payment-qr` now refuses serving the **legacy or candidate image** with a JSON
404 once storage middleware permits the request; unavailable storage still fails
closed. No enabled payment route was added. Existing DB recipient/settings, default
commerce amounts, admin permissions, migrations and runtime secrets were NOT changed.
The old QR-success transport test was intentionally strengthened to require refusal
even after a legacy enabled setting; original authentication/recipient-guard checks
remain. This is a safety behaviour change, not deletion of tests to hide a failure.

Release scanner still excludes all private/env/generated files and now rejects the
original/candidate image hashes even if an image is renamed into a public/release
path. Private poster, crop and full verification reports remain local only.

## 4. Beggar/Phase2 preservation

Phase2 App/NPC/proximity/input/room code is unchanged. Existing E/tap hint opens
the same CommercePortal/DonationPanel and shows exactly **dedo yaawwrr cmon** in a
prominent gold caption. Main/beggar entries use the same intended-payee data and
blocked card. Existing single-modal state, movement pause, close/Escape, menu guards,
and nearest-target logic remain; no following/nagging/payment gate added.

Actual four-browser native-WebSocket tests reran successfully, including capacity,
movement/facing, isolation, reconnect and leave. The inherited test-only5Hz software
raster cap is unchanged; no physical-device performance claim. World, minimap,
player model, multiplayer/NPC implementation, rides and audio are not redesigned.
No Phase3 or broad feature phase started.

## 5. Credentials check

Original Phase2 `backend/.env` contains nonempty `SUPABASE_URL` and
`SUPABASE_SECRET_KEY`; legacy fallback is empty. A private copy was made in the new
working root. `loadConfig()` with Node's explicit env-file loading passed local
URL/key-format/pairing checks. **ADMIN_API_TOKEN is missing.** No organiser token
was generated, printed or configured by this task.

No credential values appear in source, output, reports or ZIP. No live Supabase
authentication, project identity, permissions, tables/RLS or persistence was tested;
format/presence is not authenticity. All automated servers clear live credentials
and use isolated demo/mocked storage. Before production, supply an organiser token
privately and verify storage separately under appropriate approval. This task does
not enable production or payments merely because keys were added.

New local credentials file (excluded from ZIP):
`C:\Users\khush\Desktop\banaras-diwali-mela-donation-ui\banaras-diwali-mela\backend\.env`.
The original Phase2 credential file remains untouched.

## 6. Exact files changed

Added:
- `backend/src/shared/donation.ts`
- `backend/test/donation.test.ts`
- `frontend/src/components/DonationPanel.tsx`
- `frontend/src/components/DonationPanel.test.tsx`
- `frontend/src/donation.css`
- `frontend/e2e/donation-redesign.spec.ts`
- `scripts/verify_donation_qr.py`
- This report and curated non-payment screenshots in `docs/release/donation-captures/`.

Modified:
- `backend/src/app.ts` — public evidence and stricter QR refusal only.
- `backend/test/commerce.test.ts` — stronger blocked-QR expectation; no private fixture.
- `frontend/src/components/CommercePortal.tsx` — shared child/header, supported demo references.
- `frontend/src/components/commerceApi.ts` — optional public evidence type.
- `frontend/src/main.tsx` — scoped donation stylesheet import.
- `scripts/release_zip.py` — required new source/report files and candidate-image hash guard.
- `scripts/test_release_zip.py` — explicit private candidate checks and renamed-content guard.
- `README.md` — current donation status/setup link.

Untracked private env/candidate/evidence files stay outside the release. No package
manifests/lockfiles, world/multiplayer/NPC source, migrations or skill files changed.

## 7. Executed checks

PowerShell on Windows; Node24.18.0/npm11.16.0/Python3.12.10. No baseline failure.

| Check | Exact command | Actual result |
| --- | --- | --- |
| Both baseline installs | `npm ci --offline --ignore-scripts --no-audit --no-fund` | PASS; frontend114/backend143 packages |
| Baseline frontend | `npm run typecheck`; `npm test`; `$env:NODE_ENV='production'; npm run build` | PASS38 tests, typecheck/build |
| Baseline backend, credentials cleared | `npm run typecheck`; `npm test`; `npm run build` | PASS33 tests, typecheck/build |
| Updated frontend | `npm run typecheck`; `npm test`; `$env:NODE_ENV='production'; npm run build` | PASS40 tests/17 files; typecheck/build |
| Updated backend, credentials cleared | `npm run typecheck`; `npm test`; `npm run build` | PASS35 tests/6 files; typecheck/build |
| Donation/commerce/security/Phase2 browsers | `npm run test:e2e -- e2e/donation-redesign.spec.ts e2e/commerce.spec.ts e2e/phase12.spec.ts e2e/phase2.spec.ts` | **12/12 PASS**,1.8m; real four-client test17.3s; NPC/beggar desktop+touch14.4s |
| Packaging policy | `python -m unittest discover -s scripts -p test_release_zip.py` | **3/3 PASS**, including renamed candidate rejection |
| World/map/controls browsers | `npm run test:e2e -- e2e/world.spec.ts e2e/phase1.spec.ts` | **4/4 PASS**,1.0m; expanded route, map heading/reset, layout, keyboard and real captured-pointer touch controls |
| QR checks | Reproduction command in section2 | Decodes successfully; recipient check intentionally BLOCKED; no fixed amount; all four resized decode tests pass |
| Credentials | Node `--env-file=backend/.env` + `loadConfig()` only | Format/pairing PASS; admin token missing; no network |

Final archive/extraction receipt is recorded at delivery. **16 targeted browser
cases passed across the two commands above.** The complete38-case browser suite is not advertised as rerun here:
this focused task reruns donation, security, real multiplayer/NPC and relevant world
tests; unrelated long historical scene-capture specs are unchanged and not rerun.
The full Phase2 baseline's36-case result remains historical, not new evidence.

Before packaging,70 protected Phase2 world/App/room/commerce/schema/dependency/
skill/report files matched the original Phase2 archive byte-for-byte. Eligible
source/docs/assets and the production frontend passed the secret/candidate-image
scanner. The original supplied poster's SHA256 remains unchanged.

Frontend entry315.38kB; lazy scene1006.95kB (same minified size as Phase2). The
existing >500kB scene warning and Three deprecations remain unsuppressed. No new
application dependency, render loop, light or effect. No physical-device FPS or
ten-minute thermal testing, live database/recipient ownership or on-device UPI scan.

## 8. Release and outstanding blockers

New ZIP target: `C:\Users\khush\Desktop\banaras-diwali-mela-donation-ui-v1-20261025.zip`.
Use existing `scripts/release_zip.py` after checks for CRC/safe single-root/fresh
extraction/source-byte and secret/private verification. Exact final hash/count/size
are emitted by the packager and supplied at delivery, avoiding self-reference.
No private original/crop/env or generated dependencies/builds/test output belongs
in that ZIP. Install/typecheck/test/build the clean extraction as an additional gate.

**To unblock:** obtain an original provider-generated QR whose decoded `pa` matches
`shreeramdiwalimela@ptyes`, or independent evidence establishing the intended alias
mapping/account ownership. Supply verification/distribution approval and re-audit
the asset/config/route/copy/open actions explicitly. Do not simply change visible
text, substitute the other decoded address, flip a flag, redraw QR modules, update
live settings or treat this disabled UI as a working donation/payment processor.
