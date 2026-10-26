# Phase 4 gap checklist

Authoritative root: Desktop/banaras-diwali-mela-phase3/banaras-diwali-mela.
Before changes, all 309 eligible source/document/asset files matched the Phase 3
ZIP byte-for-byte. No Git metadata exists. Private backend configuration exists in
both Phase 2 and Phase 3; values were not printed or sent to a service.

Baseline executed: frontend typecheck, 44 unit tests and production build passed;
backend typecheck, 36 tests and production build passed. Baseline Phase 2/3 browser
command was interrupted, so no browser baseline pass is claimed.

| Requirement | Inspected baseline | Planned responsible files |
| --- | --- | --- |
| Stall actions | Eight approach prompts; panels only list illustrative prices | components/StallPanel.tsx, App.tsx, shared/gameplay.ts |
| Inventory | No gameplay inventory; commerce is unrelated | shared/gameplay.ts, components/useGameplay.ts |
| River offerings | Decorative bobbing lamps only | world/GameplayEffects.tsx, App.tsx, shared/gameplay.ts |
| River direction | Plane X +/-90, Z -85.5..-0.5, Y -0.17; shader noise translates toward -X/+Z; no hydrological current specified | shared/gameplay.ts: explicit stylized -X current, offshore lane at Z <= -1.25 |
| Personal firecracker | Background show only | shared/gameplay.ts, world/GameplayEffects.tsx, App.tsx |
| Richer background show | Bounded deterministic cues, quality tiers, existing toggle | world/FireworkShow.tsx |
| Shared effects | Authoritative WebSocket rooms, no gameplay protocol | backend/src/rooms.ts, components/useRoom.ts |
| Existing visitors/NPC/camera/photo | Implemented in Phase 2/3; retained | Existing unit/browser regressions |
| Donation safety | Payee mismatch; QR/payment disabled; shared beggar panel | Retain unchanged; donation/network regression tests |
| Packaging/consolidation | Four folders, three ZIPs; private files must survive | scripts/release_zip.py, verified final consolidation |

Session inventory must remain separate from database commerce. No schema or live
Supabase changes are needed. Final outcomes and exact verification belong in
PHASE4-IMPLEMENTATION-REPORT.md.

## Implementation results

- Tested: free flower/diya/fountain collection and tasting stamp rules; per-item caps,
  collect/offer cooldowns, invalid location/ride/item rejection, duplicate protection
  and mutation only after success. Shared stall radius now matches existing prompts.
- Tested: complete flower and diya browser loops, both camera modes, real CDP touch,
  personal ignition/effect expiry, and two-browser shared visibility/private inventory.
- Tested: server membership/proximity validation and reconnect inventory in native
  WebSocket integration. No database inventory was invented.
- Implemented: richer existing fireworks, fixed instance/particle pools, reduced
  motion and hidden-tab safeguards. Visual and broad regression results belong in
  the implementation report, not inferred from source.
- Preserved: existing world, NPC, visitor, camera, photo, rides, commerce and donation
  code paths. Visual review moved new markers to the clear central steps (X0/Z1.15)
  and central celebration pad (X0/Z7), away from pavilion/beggar camera occlusion.
- Final verification: 49 frontend and 37 backend unit tests passed, both typechecks
  and production builds passed; final focused browser run 9/9 passed. Earlier
  27-case run passed26 and exposed the music-panel overlap, subsequently fixed and
  retested. The initial complete45-case run passed41; exact failures/results are
  retained in the implementation report. No remaining observed failure is hidden.
- Blocked/not implemented: licensed music and fountain sound, recipient/QR approval,
  physical-device certification, durable inventory and actual deployment.
