# Phase 8 traceable requirements matrix

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
