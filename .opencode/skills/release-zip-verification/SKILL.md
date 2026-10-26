---
name: release-zip-verification
description: "Use when producing or checking a Banaras Diwali Mela release archive, running pre-release builds and tests, verifying archive integrity and project root, excluding secrets and caches, or writing a release report."
---

# Release Zip Verification

## Purpose

Produce a clean archive with the correct root, verified source, current evidence and no secrets or build debris.

## When to use

Use for release packaging, phase archives and handoff checks; not ordinary edits. Token rule: reuse unchanged build/test output; report exact results and archive facts, not logs.

## Workflow

1. Confirm scope and branch state with `git status`. Do not silently include unrelated untracked work.
2. Verify both apps from the repository root: `npm run typecheck`, `npm test`, `npm run build` in `frontend/` and `backend/`. Run `npm run test:e2e` in `frontend/`.
3. Regenerate screenshots only for intentional visual changes and update `docs/` references.
4. Build a clean staging directory named `banaras-diwali-mela/`. Include source, README, docs, lockfiles, `.env.example`, configs and `.opencode/skills` when developer setup ships. Exclude `node_modules/`, `dist/`, `coverage/`, `test-results/`, `playwright-report/`, `.git/`, logs, caches and every real `.env`.
5. Scan staging for secret patterns and forbidden directories before archiving.
6. Create the zip from the staging parent so the archive has one `banaras-diwali-mela/` root. Prefer forward-slash paths.
7. List the archive and extract it to a fresh temporary directory. Verify expected files, the root folder, file count and that no forbidden path is present.
8. Run typecheck and build from the extraction if release-critical, then delete it.

## Project rules

- Never include a service-role key, `.env`, `.env.local`, logs, screenshots from `test-results/` or `node_modules`.
- Keep `package-lock.json` for both apps; do not regenerate it as part of packaging.
- Existing phase zips use the single root `banaras-diwali-mela/`; preserve that convention.
- Do not claim tests or screenshots are current unless they were run for this release.
- Do not edit application source just to make the archive look tidy.
- Report archive path, size, file count and SHA-256, plus exact test and build outcomes.

## Failure cases

A zip containing the repository's parent folder, a second nested root, `node_modules`, `.env`, a stale screenshot presented as new, a broken lockfile, or "build passed" without a command is a failure. Also reject backslash-only names or an archive that cannot reopen.

## Verification

Check the archive listing and extraction tree, scan for forbidden names and secret-like strings, confirm the root folder, and run a smoke build from the extraction. Cross-check the release report against actual command output.

## Completion criterion

The archive has one correct root, contains only intended files, excludes secrets and caches, extracts cleanly, matches verified build/test evidence, and the report states archive facts and any unverified limitation.
