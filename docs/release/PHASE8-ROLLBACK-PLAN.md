# Phase 8 rollback plan

## Current free-staging / consolidation rollback (27 October 2026)

No public deployment occurred. Do not provision paid `render.yaml` as a rollback.
Leave that historical file unchanged; choose only `render.free.yaml` for a new free
service after account/no-spend gates. If Free fails, stop rather than upgrade.

- Before any future free deployment, retain the full tested same-origin commit/build
  and private config separately. Render Free retains only two previous deploys; no
  SSH/shell, persistent disk or permanent artifact retention is assumed.
- If an eventual staging service malfunctions, stop public testing and manually deploy
  the last tested same-origin commit on **Free** or suspend/remove that new free staging
  service. Verify the dashboard does not select a paid plan. Announce total room/demo
  state loss; clients may need a fresh room. Never restore credentials from old env files.
- Verify actual host HTTPS/WSS/demo/Origin/capacity and restart behaviour before testing
  resumes. These operational steps have not been performed against a real host.
- No portal edit or DNS change occurred in this phase, so none needs rolling back.
  Do not touch InfinityFree files as part of a staging failure.
- Workspace consolidation is content-preserving: original Phase 7 ZIP remains unchanged;
  historical files map through `private/workspace-preservation/manifest.json`. For a
  selected original entry, read its `retained` field: `active:PATH` means identical bytes
  under the active root; `blob:SHA256` means `private/workspace-preservation/blobs/SHA256`.
  Verify bytes against `sha256`, then copy to a **new private recovery directory** using
  the recorded original path. ZIP origins use `archive.zip:entry`; recover the entry,
  not an executable ZIP. Never restore over the active tree or activate a historic env.
  Historical Git metadata is recorded the same way. Latest public ZIP deliberately
  excludes this private store; retain the active project for local/private history.
- Original obsolete ZIP compression bytes are not retained: their entries are retained
  exactly. Only the required original Phase 7 archive has byte-for-byte ZIP preservation.
- Git rollback requires a new reviewed revert commit, never reset/force-push. Source
  rollback does not recover lost in-memory rooms. No SQL/data rollback is required.

---
## Historical initial Phase 8 operational plan

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
