# Phase 5 — Kashi Radio and original festival ambience

26 October 2026. Implemented in the existing Phase4 project, not a new scaffold.
All326 archived baseline files matched `banaras-diwali-mela-phase4-v1-20261025.zip`
before editing. Baseline SHA-256:
`7fbf1d5703adfc630fa28541cabadb633c3a16007e8cd807dbaaf49f6b60eb17`.
Git status reported no repository. Private backend configuration is preserved.
No package, dependency, lockfile, migration, backend networking or world geometry
was changed. No production deployment, DNS/TLS change, live Supabase mutation or
payment attempt was performed. A later explicit owner request authorised the new
technically matched Paytm QR and local payment-instruction changes; see
`DONATION-PAYTM-REPLACEMENT-20261026.md` for that evidence and safety boundary.

## Honest status

| Deliverable | Status | Evidence / limitation |
| --- | --- | --- |
| One integrated Kashi Radio | Tested | Existing single music element; selector/categories, resume, seek/progress, loading/error, previous/next, volume/mute, minimisation |
| Two real devotional/temple recordings | Tested | File-specific CC grants reviewed; exact downloaded hashes preserved; native browser decodes and plays both |
| Original meditative music | Tested | Two reproducible compositions, not demo chimes or authentic traditional performances |
| Original river/bells/crowd ambience | Tested | Three bounded native loops; independent level/mute and world-zone gain targets |
| Personal gameplay sound effects | Tested | Gift, offering and fountain sources observed during real Phase4 keyboard/touch flows; no sound for failed/duplicate actions |
| Audio lifecycle / preference safety | Tested | Fresh silence, cancellation, native node caps/cleanup, hidden-tab handler, unmount, safe level/mute storage and no stored autoplay |
| Public audio attribution inventory | Implemented | `AUDIO-ASSET-PROVENANCE.md`, public `audio/CREDITS.md`, manifest with hashes/licences/source URLs |
| Website integration plan | Implemented | Actual entry points, same-origin API/WS, host gates, path limitations and approval/rollback steps documented |
| Actual Ganga Aarti / further Diwali recordings | Blocked | No adequately verified suitable recording selected; explicit unavailable selector, no missing-file fetch |
| User's own hosting/domain confirmation | Blocked | User says reference-only; their public URL/provider will be supplied later |
| YouTube embedded player | Not Implemented | Safe external search link instead; no hidden/audio-only player, download or runtime third-party requests |
| Production deployment / real-device sound certification | Not Implemented | Requires approval, host details and physical-device listening/background tests |
| Replacement donation QR / copy / open-UPI | Tested | Original file supplied later; payload and image hashes match; non-demo instructions enabled. No bank settlement/ownership certification |

## 1. Reference and rights audit

Inspected the public homepage and Diwali HTML at `https://melachaloge.online/diwali/`.
Its radio exposes a collapsible dock, expandable playlist, previous/play/next,
seek/time display, volume and a YouTube container. A real Edge browser exposed five
playlist labels including Ghar More Pardesiya and identified the dock as YouTube
radio. A subsequent list-toggle interaction timed out; complete reference playback
was not claimed verified. Public reference code/audio was not copied into the game.
The user explicitly confirmed this site is reference-only, not their own repository
or an audio reuse authorisation.

Search integration returned cancellation errors. Direct Wikimedia file/licence pages,
Pixabay's licence summary and official YouTube player requirements were still
reviewed. Two Commons recordings with explicit creator self-licensing were selected:

- **Om Navashivam**, Yann (Yann Forget), with Fulvio314/Mitar audio revisions;
  selected **CC BY-SA4.0**, official MP3 transcode, unchanged here except filename.
- **Thakil & Nadaswaram during temple Deeparadhana**, Vis M, own work;
  **CC BY4.0**, official MP3 transcode, unchanged here except filename.

Credits, source revision links, licence links, changes and ShareAlike requirements
ship with the files and appear in the player. These are not labelled Ganga Aarti or
Banaras field recordings. This is reliance on published recording grants, not
independent legal/performer-identity certification or creator endorsement.

The Santoshi Aarti candidate was rejected despite a CC0 tag because its credited
commercial performer/external collection did not establish uploader licensing
authority; it is also not Ganga Aarti. A generic Pixabay royalty-free label was not
treated as permission for standalone downloadable redistribution. No reference-site,
YouTube or protected streaming-service recording was downloaded or rebundled.

See `AUDIO-ASSET-PROVENANCE.md` for the full inventory, links and rejected candidates.

## 2. Original audio and playlist

No audio-generation service/tool is available in this environment. Instead,
`scripts/prepare_phase5_audio.py` uses only standard-library oscillators and seeded
noise to generate original assets with bounded peaks, quiet edges and reproducible
PCM output. No sample, voice, lyric, artist imitation or field recording is used.

- Sandhya:32-second soft meditative drone with layered fundamental/fifth/octave tones.
- Deep ki lau:48-second quiet original melody over that texture.
- Three24-second environmental buffers: river-like filtered noise, soft synthesized
  bells and abstract distant crowd-like noise. The latter contains no intelligible speech.
- Brief gift feedback, offering-water swish and4.2-second fountain ignition/pops.

These are labelled original synthesis, not authentic tanpura, devotional singing,
actual river recordings or a live Aarti. Generated assets ship under CC0 to the
extent rights exist and may be waived. No public-domain assertion is made about
third-party recordings. The historical demo WAV and unused `useCeremonyAudio.ts`
remain intact but are not used as the finished radio programme.

Ten new audio files total **24,434,277 bytes**, including the15.55MB long temple
recording. They are static same-origin files, not imported into JS or prefetched
on entry. Music loads only after Play/selection. The long recording needs correct
media MIME/range delivery in production; no provider configuration is assumed.

## 3. One player and independent environment mix

`useFestivalAudio` still owns the same App-mounted HTML music element. Kashi Radio
replaces its control markup, not the media system. Four playable tracks have
descriptive categories. The fifth Ganga Aarti option explains the rights gap and
does not request a fabricated file. Previous/next skip that unavailable entry.

Pause resumes at the existing elapsed time, rather than resetting the file. Native
metadata/time events drive duration/progress and seeking; unavailable metadata
disables seek. Loading can be cancelled, stale promise failures are ignored after
track change/unmount, and blocked/missing audio offers a retry without breaking
the scene. Track changes and Play require explicit gestures, never mount effects.

Music retains its own volume/mute. Ambience and festival effects each have separate
enable, volume and mute controls. Only `{volume, muted}` preferences are stored in
three scoped localStorage keys. Track choice, playback intent, credentials and
personal information are not persisted. Denied/corrupt storage falls back safely.
Reload is silent even when the previous visit had enabled audio.

The existing Music+ control opens the radio; Music− is the sticky dock-header
minimise control when expanded, so a mobile popup cannot cover its own toggle.
The selector, seek and transport remain keyboard accessible. A scrollable mobile
card stays above the joystick at390x844,844x390,800x540 and800x600. Gifts/map are
temporarily hidden while the expanded panel occupies their area and return after
minimising; no inventory capability is removed. Desktop retains a compact right
dock below the real header height. No second music player/iframe was introduced.

## 4. Ambience, effects and lifecycle

`FestivalSound` lazily creates one AudioContext only from an explicit environment
enable gesture. Three cached, decoded buffers feed three looping sources. River
gain rises near the actual low-Z river steps; crowd gain rises toward the high-Z
bazaar. Gain targets ease over0.6 seconds. Bells remain restrained. Music is not
silently enabled with ambience, nor ambience with music.

`useGameplay` calls one stable optional callback only after an accepted authoritative
room reply or successful solo action. Collect, offer and fountain actions select
the corresponding local effect. Invalid/duplicate actions produce no effect.
Fountain audio has its ignition followed by soft noise/pops; no real-world explosive
instructions, purchase or additional network message is introduced.

At most two brief effect sources coexist; a150ms debounce rejects sound spam.
Decoded cache is limited to six fixed environment/effect files; no per-frame audio
creation, per-particle sounds, JS audio timer loop or new dependency. At48kHz mono,
the six decoded buffers are approximately14.8MB of float data (calculated ceiling,
not a measured device-memory benchmark). Source endings disconnect and release
voices. Layer stop/unmount stops/disconnects sources; final disposal aborts pending
fetches, clears buffers, removes listeners and closes the context. Async cancellation
tokens prevent an old enable request starting sound after disable/unmount.

Hidden-tab handling pauses music, stops environment sources and suspends their
context. Returning does not auto-resume; another explicit action is required.
Browser lifecycle tests exercise this handler with a controlled visibility event
while using real Web Audio, not an actual physical-phone app switch. Physical mobile
interruption, listening loudness and device-specific policies remain launch QA.

Audio is personal/local: other room visitors still see shared visual effects, but
their actions do not trigger unsolicited sound on your device. Authoritative reply
latency can delay a local sound. There is no positional audio or server-synchronised
music timeline. Camera/photo/graphics changes do not duplicate the music element or
environment context. Native StrictMode/unmount tests verify that lifecycle boundary.

## 5. Donation/security and late QR request

The user later authorised a replacement Paytm QR and supplied the original file
`C:/Users/khush/Downloads/paytmqr.jpeg`. Its decoded recipient matches
`shreeramdiwalimela@ptyes`; name matches Khushdeep Anand. A lossless original-pixel
crop is now served through a server hash guard and checked again in the browser
before QR/copy/open-UPI controls become available. Demo mode and legacy/mismatched
proofs stay blocked. References stay pending manual review, with existing amount,
duplicate, auth and rate rules. No live settings/schema, payment, bank ownership
check or settlement operation occurred. See the dedicated Paytm replacement report
for crop/hash/decode evidence and subsequent tests. Historical evidence is retained.

Regression testing also exposed a **pre-existing** CommercePortal race: the initial
public-config response cleared a newer organiser-denial error after its async
request completed. `refreshConfig` now clears old errors when the request begins,
not when its response arrives. A deterministic held-response browser regression
verifies that a newer denied-auth message remains visible. Authentication, settings,
donation safeguards and server validation were not weakened or changed.

## 6. Exact executed checks and observed results

Windows/Node/npm versions use the installed project environment. Browser tests use
the existing isolated demo backend, never live credentials. Logs for the final
browser run are in approved Temp `opencode/phase5-e2e-20261026.log`, not the release.

| Directory / exact command | Observed result |
| --- | --- |
| Root `git status --short` and Python archive/source comparison | No Git repository; all326 baseline archived files matched |
| Baseline frontend `npm run typecheck`; `npm test`; `npm run build` | Passed;49 tests/19 files |
| Baseline backend same three commands | Passed;37 tests/6 files |
| Root `python scripts/prepare_phase5_audio.py --fetch-reviewed-cc` | Passed; eight originals plus two reviewed CC MP3s, hashes/levels manifest written |
| Frontend `npm run typecheck`; `npm test` during implementation | Passed;55 tests/20 files |
| Frontend `npm run test:e2e -- e2e/phase5.spec.ts` initial |4/4 passed before adding the short-screen case |
| Frontend `npm run test:e2e -- e2e/phase5.spec.ts e2e/phase4.spec.ts e2e/aarti.spec.ts e2e/phase11.spec.ts` |12 passed/1 failed: panel bottom295 vs joystick top294 in landscape, phase5.spec.ts:136. Reduced the height budget; did not weaken the assertion |
| Frontend `npm run test:e2e -- e2e/phase5.spec.ts` rerun |5/5 passed after the landscape correction |
| Broad command below, first attempt |34 passed/2 failed: mobile radio covered its original Music− toggle; NPC/beggar test timed out on the same control. Moved the expanded toggle into the sticky radio header |
| Broad command below, second attempt |35 passed/1 failed: organiser error disappeared in the pre-existing config-response race, phase12.spec.ts:43. Narrow root fix plus deterministic regression added |
| Broad command below, final attempt |**37/37 passed**,7.2 minutes, no retries advertised |
| Audio-only frontend `npm run typecheck`; `npm test`; `npm run build` |**Passed**,55 tests/20 files; entry349.18kB, lazy scene1017.45kB, CSS29.84kB |
| Audio-only backend same three commands |**Passed**,37 tests/6 files |
| Root `python -m unittest discover -s scripts -p test_phase5_audio.py` |**2/2 passed**, actual asset hashes, PCM bounds/quiet edges, manifest/credit fields |
| Root `python -m unittest discover -s scripts -p test_release_zip.py` |**3/3 passed**, existing private/generated/secret-asset exclusion policies |
| After owner-authorised QR changes, frontend `npm run typecheck`; `npm test` |**Passed56 tests/20 files** |
| After owner-authorised QR changes, backend `npm run typecheck`; `npm test` |**Passed39 tests/6 files** |
| Frontend `npm run test:e2e -- e2e/donation-redesign.spec.ts e2e/commerce.spec.ts e2e/phase12.spec.ts` |**12/12 passed**,2.7m; QR, clipboard, UPI URI and pending-reference safeguards |
| Frontend `npm run test:e2e -- e2e/phase2.spec.ts e2e/phase3.spec.ts e2e/phase4.spec.ts e2e/phase5.spec.ts e2e/donation-redesign.spec.ts` |**20/20 passed**,4.0m after QR integration; audio and earlier gameplay preserved |
| Root `python -m unittest discover -s scripts -p test_paytm_qr.py` |**1/1 passed** |
| Final frontend `npm run typecheck`; `npm test`; `npm run build` after QR integration |**Passed56 tests/20 files**; entry352.41kB, lazy scene1017.45kB, CSS30.34kB |
| Final backend same three commands after QR integration |**Passed39 tests/6 files** |
| Root `python scripts/release_zip.py --output C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase5-verify-20261026.zip --extract-to C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase5-verify-20261026` |**Passed**,364 source/assets/docs files; CRC, safe single root, secret/private exclusion and every extracted source-byte comparison |
| Fresh extraction, both apps: `npm ci --offline --ignore-scripts --no-audit --no-fund`; `npm run typecheck`; `npm test`; `npm run build` |**Passed**,114/143 packages installed;56 frontend and39 backend tests; both builds |
| Existing release scanner over every production frontend file |**Passed**; no actual local secret value or private poster asset leaked |

Exact final broad browser command (frontend):

```powershell
npm run test:e2e -- e2e/phase5.spec.ts e2e/phase4.spec.ts e2e/phase2.spec.ts e2e/phase3.spec.ts e2e/donation-redesign.spec.ts e2e/world.spec.ts e2e/phase11.spec.ts e2e/aarti.spec.ts e2e/bazaar.spec.ts e2e/phase12.spec.ts e2e/commerce.spec.ts e2e/phase1.spec.ts e2e/phase8-diagnostics.spec.ts
```

These37 cases cover the audio experience, real media progress/resume and a simulated
permission rejection with recovery, native ambience/effect caps/cleanup, real touch,
both cameras, inventory/offerings/fountain sounds, four-player capacity/isolation/
reconnect/appearance, wardrobe/photo/zoom, NPC/beggar captions, optional donation,
unavailable persistence/auth, scenery loading and input. The complete historical
browser suite with all long scenic-capture/ride cases was not rerun in Phase5.
Existing2Hz/5Hz test-only software-raster accommodations remain documented; they
do not mock WebGL or alter runtime room/security rules. No physical FPS is claimed.

Actual desktop/mobile/landscape radio captures were reviewed. Final curated images
are in `docs/release/phase5-captures/`. Native decoding/playback and generated PCM
levels are evidence of working audio paths, not subjective listening certification.
Known Three Clock/CJS/shadow deprecations and the >500kB scene-chunk warning remain.
The intentional unmount browser test also warns that its temporary test route has
no matching App route; no production route was added for the test.

## 7. Changed files and release

Added: `frontend/src/components/KashiRadio.tsx`, `festivalSound.ts`,
`festivalSound.test.ts`, `useFestivalSound.ts` (same components directory),
`frontend/src/radio.css`, `frontend/e2e/audioProbe.ts`, `frontend/e2e/phase5.spec.ts`,
`scripts/prepare_phase5_audio.py`, `scripts/test_phase5_audio.py`,
`frontend/public/audio/CREDITS.md`, `frontend/public/audio/phase5-manifest.json`,
the ten audio files listed in that manifest, this report, `PHASE5-GAPS.md`,
`AUDIO-ASSET-PROVENANCE.md`, `WEBSITE-INTEGRATION-PLAN.md` and final capture images.

Modified: `frontend/src/App.tsx`, `frontend/src/main.tsx`,
`frontend/src/components/useFestivalAudio.ts`, `useFestivalAudio.test.ts`,
`useGameplay.ts`, `CommercePortal.tsx` (same components directory),
`frontend/e2e/aarti.spec.ts`, `frontend/e2e/phase4.spec.ts`,
`frontend/e2e/phase12.spec.ts`, `frontend/public/audio/README.md`,
`scripts/release_zip.py`, `README.md`, `docs/release/FUTURE-PHASES.md`.
No historical source asset, report, lockfile or feature was removed.

Additional owner-requested QR changes: `backend/assets/donation-paytm-qr.png`,
`backend/src/shared/donation.ts`, `backend/src/app.ts`, `backend/src/commerce.ts`,
`backend/test/donation.test.ts`, `backend/test/commerce.test.ts`,
`frontend/src/components/DonationPanel.tsx`, `DonationPanel.test.tsx`, `commerceApi.ts`
(same components directory), `frontend/src/donation.css`,
`frontend/e2e/donation-redesign.spec.ts`, `scripts/verify_paytm_qr.py`,
`scripts/test_paytm_qr.py`, the replacement report and curated donation images.
Full poster and raw decoder reports remain private and do not ship.

Release uses the existing secret/private-image scanner, CRC/single-root extraction
and every-file byte comparison. A fresh extracted build/test gate follows; the
terminal delivery receipt records actual ZIP size/file count/SHA-256 without a
self-referential hash inside the ZIP. User approved one renamed Phase5 working
folder plus unchanged Phase4 rollback and new Phase5 ZIP, recycling older Phase3
only after verification. No original Phase4 ZIP is overwritten.

The fresh-extraction gate above has passed for final application/test/asset bytes.
Only delivery documentation was updated afterward. Final publication command is
`python scripts/release_zip.py --output C:/Users/khush/Desktop/banaras-diwali-mela-phase5-v1-20261026.zip --extract-to C:/Users/khush/AppData/Local/Temp/opencode/banaras-phase5-delivery-20261026`;
its separate terminal receipt rechecks the documentation-inclusive archive.
There are61 added/modified release paths compared with Phase4 and no removed source
files. Backend private env/posters/reports remain only in the updated working folder.

## 8. Remaining launch gates

1. Perform organiser-supervised physical bank-app scan/payee/amount review before
   public launch. The replacement is now decoded and owner-authorised, but no bank
   ownership/settlement or real-money test is claimed by this build.
2. Supply/clear actual Ganga Aarti and further desired devotional recordings with
   recording/composition/performance rights and attribution evidence. Do not copy
   the reference playlist or label another recording as Ganga Aarti.
3. Review the real-device audio mix, loop quality, iOS/Safari/Android permissions,
   OS backgrounding/headphones, downloads and thermal/performance limits.
4. Provide own public portal URL and hosting provider/plan; confirm persistent Node
   and same-origin HTTPS/WSS support, organiser token and proxy topology. Review
   `WEBSITE-INTEGRATION-PLAN.md`, approve deployment separately, then execute and
   verify it. Path-mounted routing is not implemented by this phase.
