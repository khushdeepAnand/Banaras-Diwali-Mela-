# Phase 6 gap checklist

Audit: 26 October 2026, before implementation. Working copy:
`Desktop/banaras-diwali-mela-phase6/banaras-diwali-mela`.
The supplied Phase 5 folder and ZIP remain untouched. The `(1)` ZIP named in the
brief is absent; the supplied non-suffixed ZIP exists. Neither source nor copy is
a Git repository (`git status --short` reports no repository).
The source folder matches all 364 files in the supplied Phase 5 ZIP byte-for-byte.
Source ZIP SHA-256:
`12caa415f8c67ed3a5449ec389d276e36283165d19970c83959bcf966a4cd17c`.

Read Phase 5 audio/gaps/provenance, website plan, both donation reports, source
entry points, scene/player/capture, navigation, audio hooks, room client/server,
configuration, tests and release scanner. Baseline checks executed in the copy:
frontend typecheck, 56 tests and build pass; backend typecheck, 39 tests and build
pass. Frontend JS: entry 352.41 kB, scene 1017.45 kB; CSS 30.34 kB.

| Area | Confirmed baseline | Phase 6 gap |
| --- | --- | --- |
| Entry | Existing atmospheric intro; free entry, no autoplay | Explicit sound/silent actions, highlights, help and short-phone scroll |
| Loading | Lazy scene chunk; procedural scene, Suspense text/null | Truthful phase indicator through first rendered frame, recoverable failure |
| Navigation | Shared geometry/path map; proximity prompts and collision walking | Four selectable map destinations with directions and arrival; no teleport needed |
| Rooms | Ten uppercase hex codes, four humans, isolated rooms, 20s resume reservation | Validated invite URL, copy/native/WhatsApp, fresh-tab prefill; explicit join only |
| Photos | One next-frame PNG bridge, presets, Blob preview/share/download | Branding/frame, preview before download, bounded output and composition |
| Compatibility | Minimal SceneError, no gallery/retry/context-loss UI | Non-WebGL fallback, explicit bounded retry, static verified gallery and portal link |
| Quality | Touch/CPU-based initial tier, real low-tier reductions, no adaptive sampling | Sustained-only optional downgrade, manual override; no software-FPS claims |
| Audio | One music element; gesture-only WebAudio, mute/volume, hidden-tab cleanup | Reuse APIs for sound entry; silent entry remains silent |
| Production | React `/`, Vite dist, Express Node, `/api/health`, `/api/room-socket` | Update supplied portal URL, provider gates and verification; no deployment |
| Release | Vitest, Edge Playwright, stdlib archive/secret scanner | Phase 6 tests/reports, full regression, clean extraction gate |

Preserve QR bytes/recipient/safeguards, Supabase/auth, inventory and all gameplay.
No live database writes, production changes, new dependencies or Phase 7 systems.
Physical mobile/audio/GPU and native device share remain separate launch gates.

## Final gap disposition

- **Implemented:** welcome/sound/silent/help, truthful first-frame loading,
  four existing-map activity guides, validated explicit-join invitations,
  copy/native/WhatsApp fallbacks, bounded framed/watermarked photo preview,
  independent static fallback with explicit retry, sustained-only Auto quality,
  updated website architecture/provider/rollback documentation.
- **Tested:** baseline and updated typechecks/builds/unit tests, complete 63-case
  collected browser suite, real four-client capacity/isolation/reconnect and
  appearance, actual rendered PNG and native media playback, intentional failure
  paths, mobile layout and release-policy tests. Final affected-path and extracted
  archive gates are recorded precisely in `PHASE6-IMPLEMENTATION-REPORT.md`.
- **Blocked:** provider/plan/portal technology and approved hostname, Node/WSS/TLS
  routing capabilities, privately configured production storage/auth review,
  actual-device audio/share/download/GPU/thermal QA, physical bank-app QR review,
  adequately rights-cleared actual Ganga Aarti recording.
- **Not Implemented:** deployment, portal/DNS/TLS/hosting/database/payment changes,
  `/mela/` migration, automatic player travel, multi-server rooms and all Phase 7+
  features. Guidance deliberately reuses normal walking, not a second movement
  system. Native mobile/WhatsApp delivery and production connectivity are not
  claimed tested.

See `PHASE6-IMPLEMENTATION-REPORT.md` and `PHASE6-WEBSITE-READINESS.md` for evidence
and limitations. A local release candidate is not a live deployment certificate.
