# Phase 8 traceable requirements matrix

## Current free-hosting / cleanup continuation (27 October 2026)

This table supersedes historical paid-host and old-path decisions below. Local-only
preparation is not production readiness. Final receipt is local
`private/PHASE8-FINAL-DELIVERY-RECEIPT.md`; archive hashes also live in adjacent sidecars.

| Requirement | Evidence / result | Remaining gate |
| --- | --- | --- |
| Correct current source | Original Phase 8 ZIP's 436 files exactly match clean main at ce2ad5bb55c7366767764ed17348c9e15e8d5d24; initial live remote matches | Final publication readback in receipt |
| Preserve original Phase 7 | 135760483 bytes; actual SHA-256 26e62aebd21ad5bff138d9ecba03b022e014d9d0154daeaed6afc062af54e048; sidecar/receipts agree; owner accepted request-hash correction | Rechecked during final packaging |
| Preserve unique historical/private work | 3170 mapped entries; 378 historical blobs; verified content-addressed ignored private store, including old Git metadata | Keep active folder for private history; excluded from public ZIP |
| Single designated workspace, two ZIP roles | Banaras-Diwali-Mela-Release with active project, original Phase 7, latest and two sidecars; proposed cleanup printed | Actual entries/operations in receipt |
| Free same-origin Node/API/WS | Separate render.free.yaml; plan free, one instance, manual; paid YAML unchanged; both pass official schema | Free account eligibility/Linux build/host capacity not verified |
| Strict zero-spend | No-card workspace required, no upgrades/add-ons; account limits and stop conditions in runbook | Account UI and any verification/payment prompt are manual blockers |
| Demo/no live DB/payments/secrets | Existing fail-closed runtime preserved; demo QR 404 and backend auth guards; no Supabase variables in YAML; only blank VITE_API_BASE_URL | Exact origin after real hostname; token private |
| Preserve four-player/reconnect/gameplay | No runtime or gameplay files changed; 49 backend tests and 2 compiled HTTPS/WSS tests pass | Public WSS/idle/restart/phone QA not performed |
| Actual local validation | Frontend 65/65; backend 49/49; Python 8/8; both typechecks/builds; clean-extraction reinstall/tests/builds; zero npm audit findings | Full ordinary browser suite not rerun; historical failures retained |
| Latest ZIP complete and safe | Existing release packager plus free-YAML required-file guard; CRC/path/exclusion/extraction/byte checks | Final hash/size/verification recorded outside self-referential archive |
| Git safety | No checkout/reset/force push; initial remote readback matches; source changes only | Actual final commit/push/readback in receipt |
| Portal/DNS/live deployment untouched | No provider provisioning, portal or DNS/payment/database operation | NOT DEPLOYED, no public URL |

---
## Historical initial Phase 8 matrix

Scope: original user goals and implemented Phase 7 additions, not a new reference-site
feature backlog. “Complete (local)” means source exists and local evidence is available;
it does not certify the unprovisioned public host or physical devices. Exact fresh
Phase 8 execution/failures are in the implementation report; historical receipts
alone are not test evidence. The live result for every hosted feature is BLOCKED
until the approved staging URL exists.

| Requirement | Inspected implementation / runnable evidence | Current status | Remaining work | Phase 8 blocker? |
| --- | --- | --- | --- | --- |
| Expanded ghats/environment/landmarks | `world/MelaScene.tsx`, `FestivalPromenades.tsx`, `navigation.ts`; phase1/8 and profile specs | Complete (local implementation) | Hosted first-frame/visual check; physical GPU limits | Public QA blocked |
| Roaming NPCs and beggars | `world/CrowdScene.tsx`, `crowd.ts`; crowd unit tests, phase2 spec | Complete (local implementation) | Hosted/phone movement and interaction review | Public QA blocked |
| Four simultaneous visitors | `backend/src/rooms.ts`, `shared/network.ts`; real WS unit tests and compiled HTTPS/WSS browser smoke | Complete (local capacity proof) | Hosted four-client capacity, region latency and host limits | Yes, live gate |
| Firecrackers/player-triggered effects | `shared/gameplay.ts`, `world/GameplayEffects.tsx`, `FireworkShow.tsx`; gameplay/fireworks units and phase4/4b specs | Partial | Personal virtual fountain and background show/toggle exist; a new player-launched sky-firework editor/event is not claimed | No new feature in Phase 8 |
| Clothing customisation | shared `appearance.ts`, `VisitorPanels.tsx`, avatar parts; phase3 units/spec | Complete (local implementation) | Hosted appearance sync and real-device visual QA | Public QA blocked |
| Interactive stalls and bounded rewards | `StallPanel.tsx`, `bazaar.ts`, `shared/gameplay.ts`; bazaar/gameplay units, bazaar/phase4/phase7-social specs | Complete (local implementation); initial failures passed unchanged serial rerun | Full clean serial host-candidate gate and public QA; no fake commerce | Public QA blocked; flakiness retained in report |
| First/third-person camera | `world/Player.tsx`, `visitorView.ts`; camera collision/phase3 units and phase3 spec | Complete (local implementation) | Hosted touch/camera review | Public QA blocked |
| Photo mode and download | `CaptureBridge.tsx`, `VisitorPanels.tsx`, `photoFinish.ts`; phase3/6/7 and compiled HTTPS smoke | Complete (local implementation) | Physical-phone native share/download behaviour | Device QA before production |
| Ganga flowers/diya offerings | shared gameplay rules + `GameplayEffects.tsx`; actual WS rule tests and phase4 spec | Complete (local implementation) | Hosted successful-use visual/network check | Public QA blocked |
| Domain/HTTPS/hosting/portal integration | `render.yaml`, `static.ts`, local TLS config, portal snippet | Partial / BLOCKED | Provision paid service, validate public TLS/WSS, verify final URL, then authorise portal link; no DNS speculation | Yes |
| Correct owner QR/payment safety | unchanged approved QR + `shared/donation.ts`, `DonationPanel.tsx`; QR/Python/donation tests, demo QR 404 | Complete (local safeguards), bank settlement not verified | Physical bank-app/owner review; never enable payments as staging setup | Real payment activation blocked |
| Licensed devotional music/audio | `public/audio/CREDITS.md`, manifest/provenance, `useFestivalAudio.ts`, `festivalSound.ts`; audio units, phase5 spec and compiled playback smoke | Partial | Bundled credited/original tracks exist; authentic rights-cleared Ganga Aarti still unavailable; phone audio unverified | Authentic recording optional; phone QA before production |
| Donation interaction/requested caption | `components/dialogue.ts` starts with `dedo yaawwrr cmon`; shared DonationPanel via App/CommercePortal, phase2/3 specs | Complete (local implementation) | Hosted optional/non-coercive flow; no real-money test | Public QA blocked |
| Avatar mouth clipping/appearance | `world/avatarParts.ts` removes intersecting legacy scarf; `phase3.test.ts`, appearance allowlist and wardrobe tests | Partial | Structural fix exists and is unit-tested; no exhaustive all-poses/device clipping certification | Visual QA, not new avatar work |
| Multiplayer stability | bounded sequence/request validation, heartbeat, isolation, resume grace; `rooms.test.ts`, `restart.test.ts`, compiled WSS smoke | Partial | Fresh intermittent movement-test failures tracked; public restart/proxy/load/maintenance verification; memory intentionally resets | Yes, QA + host verification |
| Mobile/keyboard/accessibility | `MobileControls.tsx`, native dialogs, CSS and pointer capture; world/phase1/3/4/6/7 specs | Partial | Emulated touch/keyboard tests, not physical device or full accessibility audit | Phone QA before production |
| Truthful loading/recoverable fallback | `LaunchExperience.tsx`, lazy MelaScene, error/context-loss boundary, static gallery; phase6-launch specs | Complete (local implementation) | Hosted slow-load/recovery/error review | Public QA blocked |
| Local journey/reset | `journey.ts`, `useJourney.ts`, JourneyPanel; journey unit and phase7 storage/reset tests | Complete (local implementation) | Hosted browser storage failures/private browsing; editable local-only data, not achievements | Public QA blocked |
| Rangoli brush/PNG | `rangoli.ts`, RangoliPanel; symmetry unit, actual mouse/CDP touch phase7 tests and compiled export smoke | Complete (local implementation) | Real stylus/phone memory/download checks; drawing is not persisted on close | Device QA before production |
| Souvenir/privacy/share | actual photo bridge + allowlisted activity text in photoFinish; phase7 privacy/export tests | Complete (local implementation) | Native device delivery not tested; no room codes/tokens included | Device QA before production |
| Emotes/group celebration | `shared/social.ts`, room authority, SocialPanel; social/room tests and phase7-social real-client spec | Complete (local implementation) | Hosted group timing/reduced-effects check; visual fallback, not skeletal animation | Public QA blocked |
| Supabase/auth/security/privacy | validated config, protected API, store adapter; commerce/staging/donation tests, migrations 001/002 retained | Partial / live NOT VERIFIED | Demo has no DB credentials; separate staging DB/RLS/auth/outbound checks need approval; no migrations run | Yes for DB-backed production, not demo staging |
| Release reproducibility/GitHub | ZIP CRC/SHA + all 417 remote blob comparisons, full-history scanner, lockfiles, release tool | Complete for inspected Phase 7 source; Phase 8 final receipt in report | Final payload/history scan, committed artifacts, clean extraction and release SHA receipt | Yes, release gate |
| Monitoring/operations/rollback | health path, safe generic errors, Render manual deployments, Phase8 rollback plan | Partial / BLOCKED live | Budget/health alerts, actual log retention/access, restart/rollback drill, trusted proxy chain and edge throttling review | Yes for production readiness |

No optional reference-site finale, lantern launch, sponsorship, new payments,
leaderboards, free-text chat, accounts, new physics or multi-server room ownership is
introduced. They are not hidden Phase 8 acceptance conditions.
