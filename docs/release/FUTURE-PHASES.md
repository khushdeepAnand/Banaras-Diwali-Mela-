# Approved future requirements — NOT implemented by Phase 1

Phase 0 audit remains the roadmap and is preserved verbatim. This companion records
the user's additional explicit requirements; none is completed by Phase 1 scenery,
navigation, browser screenshots or existing decorative stall displays.

- **Phase 2:** four real visitors in the same shared room; separate independently
  roaming NPCs including beggars. E near a beggar must open the Phase 6 donation panel.
  Decorative figures and browser-local state are not multiplayer.
- **Phase 3:** remove the unwanted mouth object from the controlled third-person
  character; improve player and remote character hair, facial detail, clothing and
  suitable accessories. First/third-person switching, clothing customisation, photo mode.
- **Phase 4:** interactive stalls, bounded virtual inventory, collecting flowers/diyas
  and offering them to Ganga with visible downstream travel; improved fireworks and
  a bounded personal virtual firecracker. Existing bobbing diyas are not offerings.
- **Phase 5:** licensed bhajans and improved festival ambience, with rights evidence.
- **Phase 6:** one consistent optional donation component, reused for beggar interaction.
  Requested caption: **“dedo yaawwrr cmon”**. Independently verify intended recipient
  and QR before changing UPI ID, QR or payment settings. No public donation enablement
  is authorised by Phase 1; existing backend commerce security remains unchanged.
- **Phase 7:** regression, security, real mobile/desktop, staging and production
  verification. Deployment and live database/payment operations need explicit approval.

Physical-device performance, live Supabase/RLS state, licensed audio and verified
recipient/QR remain external release gates, not inferred from local tests.

## Phase 4 implementation supplement

The roadmap above is historical. Phase 4 now adds free stall gifts, bounded session
inventory, downstream flower/diya offerings, shared personal spark fountains and
background firework variety. See [the implementation report](PHASE4-IMPLEMENTATION-REPORT.md)
and [gap checklist](PHASE4-GAPS.md) for actual tests and remaining gates. No persistent
inventory, licensed devotional music, recipient verification or deployment is implied.

## Phase 5 implementation supplement

Kashi Radio now combines credited CC devotional/temple recordings with original
meditative compositions, independent original ambience and bounded personal gameplay
sounds. See `PHASE5-AUDIO-REPORT.md` for actual tests and limitations, and
`AUDIO-ASSET-PROVENANCE.md` for recording-specific rights. Actual Ganga Aarti,
physical bank-app/payee review, physical-device certification and website hosting/
deployment approval remain external gates, not inferred from this audio release.

The owner-supplied replacement Paytm QR was subsequently decoded and matched to
the intended ID; approved non-demo QR/copy/open-UPI instructions now work with
server/client byte checks. See `DONATION-PAYTM-REPLACEMENT-20261026.md`. This is not
bank ownership or settlement certification, and references remain manual review.
