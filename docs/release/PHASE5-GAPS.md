# Phase 5 audio gap checklist

Audit: 26 October 2026. Existing project matches all326 files in the verified
Phase4 ZIP (SHA256 `7fbf1d5703adfc630fa28541cabadb633c3a16007e8cd807dbaaf49f6b60eb17`).
No Git repository exists. Baseline frontend49/backend37 tests, both typechecks
and both builds passed. Private env files are not read into reports or archives.

| Requirement | Inspected baseline | Narrow change |
| --- | --- | --- |
| One music player | App uses one HTML audio element and useFestivalAudio; useCeremonyAudio is historical/unused | Extend existing hook; extract its UI into KashiRadio |
| Real music | Only a correctly labelled demo chime; four missing placeholders | Bundle only reviewed file-specific licences; document Ganga Aarti gap |
| Player features | Previous/play/pause/next, volume/mute; pause currently restarts the file; no seek/progress | Add truthful media-event state, resume, progress/seek, categories/credits and compact dock |
| Ambience/SFX | None | Original reproducible synthesis; one opt-in Web Audio context, three bounded ambience loops, two effect voices |
| Lifecycle | Existing media cleanup; no hidden-tab pause or stale play request guard | Add cancellation, hidden-tab/manual resume, StrictMode cleanup and bounded source cleanup |
| Preferences | No audio storage | Persist volume/mute only, never autoplay/playing state; storage failures are nonfatal |
| Reference | Public Diwali HTML/browser identifies YouTube radio, expandable list, seek/time, transport and close | Reuse interaction ideas, not source code/assets; safe external YouTube link, no hidden/audio-only embed |
| Website | No provider/domain/deployment config; same-origin API/WS, persistent Node owner | Integration plan only; subdomain recommended, path mount requires further router work |

The user confirms melachaloge.online is **reference only** and will supply their
own URL/provider later. No repository/asset reuse permission was supplied.

Research found self-published Wikimedia recordings: Om Navashivam (Yann, CC BY-SA4.0)
and Thakil/Nadaswaram (Vis M, CC BY4.0). Review exact file URLs/credit before download.
The Santoshi Aarti file has a CC0 tag but an externally sourced commercial-performer
recording: do not infer uploader authority or bundle it. No verified Ganga Aarti
recording has been supplied. Search integration was cancelled; direct source pages
and provider terms remain available. No audio-generation service is available;
original elementary-wave/noise synthesis can supply clearly labelled project audio.

## Final gap check

- Tested: four playable tracks, categories/credit links, one music element,
  pause/resume/seek, loading/cancellation/error recovery, volume/mute, safe preferences,
  silence on reload and native hidden-handler/unmount cleanup.
- Tested: three original ambience loops, independent controls, two-voice effect cap
  and actual accepted gift/offering/fountain sounds through Phase4 keyboard/touch flows.
- Tested before QR extension:37 focused browser regressions,55 frontend and37 backend
  tests, both typechecks/builds,2 asset-integrity and3 release-policy tests.
- Tested after the owner QR request:56 frontend and39 backend tests,12 donation/
  commerce/security browser cases and20 audio/gameplay/QR cases. Original/crop and
  four browser-rendered QR decodes all match the intended payee.
- Fixed: one-pixel landscape overlap, occluded mobile music toggle and an evidenced
  pre-existing public-config/organiser-error race. Original assertions were retained;
  a deterministic race regression was added.
- Blocked: actual Ganga Aarti rights, own website URL/provider, real-device listening,
  organiser production configuration and physical bank-app/ownership review. The
  replacement QR was subsequently supplied, decoded and owner-authorised; non-demo
  QR/copy/open-UPI controls now work for that approved asset.
- Not implemented: YouTube embedding, production deployment, path-mount migration,
  remote visitors' unsolicited sounds or a server-synchronised music timeline.
