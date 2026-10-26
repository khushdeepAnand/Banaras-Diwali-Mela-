# Incremental development plan

Target for public launch: **8 November 2026**; dates and scope remain subject to testing, assets, operational readiness and payment-account approvals.

1. **Foundation (this phase):** independently runnable apps; starter screen; validated config; health endpoint; automated checks. No world, financial operations or persistence.
2. **First interactive vertical slice (in progress):** original procedural ghat and river scene, desktop/mobile movement, simple collision and quality presets. Browser/device performance and accessibility fallback still need measurement and validation. No donation or booking UI.
3. **Phase 3A, decorative bazaar:** six approachable stalls, procedural vendors and goods, interaction panel and demonstration prices. This is frontend-only; it is not a rental or shopping workflow. Real-device performance measurements and camera-obstruction improvements remain open before more attractions.
4. **Data and identity:** provision Supabase, create migrations, database constraints and access policies; choose vendor/admin authentication; integration tests against a test database. Define staff provisioning and revocation before granting access.
5. **Vendor booking workflow:** stalls and prices from backend, atomic reservation with expiry policy, pending booking, duplicate payment-reference defense and authorized manual verification with audit history. Test concurrent attempts and stale reservations.
6. **Donations and administration:** official QR publishing only after account ownership is established; pending submissions; bank/account reconciliation by authorized staff; verification/rejection audit trail; reporting and operational runbooks. Never equate a screenshot/reference with a confirmed payment.
7. **Festival expansion and launch hardening:** original rides, audio, aarti and environmental effects; browser/device and accessibility testing; security review, backups, monitoring and deployments. Stage rollout before public launch.

Each step should deliver one tested, honest user path before expanding the scene or adding more workflows.
