# Phase 8 rollback plan

No live deployment or portal change has occurred. This is an execution plan for the
owner after an approved staging deployment, not evidence that rollback was exercised
against Render or InfinityFree.

## Before deployment

1. Record current service URL/ID, source commit, build ID, region, instance count and
   non-secret configuration. Keep secret backups only in the provider/private vault.
2. Preserve the unchanged Phase 7 ZIP and checksum. Remote Phase 7 baseline is
   `39a6755f08c1005d698ba9afc6e1875249b7c0b5`; initial application commit is
   `ba9b6f9db5ff4cd46acc495a9d5375ce0d677714`.
3. Download the existing portal HTML/CSS privately before editing its entry section.
4. Keep automatic deployments OFF. Snapshot the last working Phase 8 **same-origin**
   build once tested; it is a better operational rollback than an API-only Phase 7 build.

## Trigger and isolate

Rollback on leaked configuration, unexpected real payment controls, missing assets,
unrecoverable WebGL/loading regressions, Origin acceptance errors, or room failures.
Hide/restore the portal game link first. For a paid Render service enable maintenance
in the dashboard if needed, notify testers and stop new joins. Never expose tokens
in an incident report. If a real secret is discovered in Git/history/logs, revoke it
through its owner, replace it privately, and audit impact; deleting one file is not rotation.

## Restore service

1. In Render **Deploys**, choose the recorded last-known-good same-origin build and
   select rollback/redeploy. Review the target source SHA and current environment
   before confirming; build rollback does not necessarily restore env changes.
2. Restore only approved staging variables. Maintain `NODE_ENV=production`,
   `STAGING_DEMO=true`, `DEMO_MODE=true`, no DB credentials, private organiser token,
   exact HTTPS origins and one process/instance. Do not reuse production secrets.
3. Expect all rooms and demo records/session inventory to reset on process replacement.
   Browser-local journey stamps remain browser-local. Test resume rejection and a
   new room join; never tell visitors that room state persisted.
4. Rerun health, HTML/invitation refresh, WSS capacity/isolation/Origin, audio ranges,
   image/photo/rangoli and payment-disabled checks before re-enabling any portal link.

Render's rolling deploy machinery can briefly overlap old/new instances even when
steady-state count is one. In-memory rooms are not shared across them. Use an
announced maintenance/drain window; this project does not claim seamless room
migration or zero-downtime multiplayer. Do not solve this with uncontrolled replicas.

If no working Phase 8 artifact exists, suspend the failed staging service and leave
the portal unchanged. Phase 7 is API-only and rejects production demo by default;
do not roll only code back to Phase 7 while expecting Phase 8 env/static support.
Restore a complete previously approved topology or stay offline. No force-push,
destructive Git reset or database rollback is required.

## Restore portal

Restore the exact previous anchor/notice and only the scoped `.mela-staging-entry`
style addition from the private page backup. Do not replace unrelated sections,
nameservers, DNS, domain registration or certificates. Verify mobile/keyboard
navigation and the original portal still work. Never link to unverified staging.

## Database and payment boundary

Phase 8 adds no migration, table or live mutation. No SQL rollback is necessary.
Do not drop records/tables, rerun migration 001, change approved QR bytes/recipient,
enable payments or alter live Supabase settings as part of operational rollback.
Future DB-backed staging requires its own approved backup/security/rollback review.
