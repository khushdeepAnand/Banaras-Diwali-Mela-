---
name: token-efficient-coding
description: "Use for every coding or review task to reduce token use through targeted inspection, bounded reads, reuse, focused diffs, caveman-style internal brevity, and concise test reporting."
---

# Token-Efficient Coding

## Purpose

Spend tokens on work, not repetition. Inspect less, reuse more, edit narrowly, test precisely. Correctness and security stay mandatory.

## When to use

Use for all tasks. Load this skill plus one domain skill; do not preload the library. Token rule: this governs process, not scope.

## Workflow

1. State the task in one line. Identify the likely files from names, imports, tests or `package.json` before opening anything.
2. Search first with `rg`, glob or a symbol search. Read bounded ranges, not entire large files.
3. Read only the target, its direct imports and the matching test. Keep a short working summary; do not paste source back.
4. Check for an existing implementation or pattern and extend it. Prefer the smallest focused diff.
5. Run the narrowest meaningful test first, then typecheck, then broader tests only if the change warrants them.
6. Report changed paths and exact pass/fail results. Put only the relevant failure line in the response.

## Project rules

- Internal notes may be caveman-terse: "Read Player. Find dt clamp. Change. Run world test." Do not force that style on user-facing prose unless asked.
- Never load all skills. Match the task to one skill; add another only for a separate concern.
- Do not repeat the plan, restate unchanged code, or paste full logs.
- Do not re-read a file unless it changed or the previous read was truncated.
- Reuse `environment.ts`, `bazaar.ts`, `MelaScene.tsx`, existing CSS and test helpers before creating new modules.
- Delegate only when it saves meaningful context and the model supports it; give exact scope and require a compact result.
- Never skip security checks, secret scans, required source inspection or important tests to save tokens.
- If context is insufficient or ambiguous, ask one focused question instead of guessing broadly.

## Failure cases

Acting on a stale summary, truncating and missing a critical branch, compressing away a security warning, claiming unrun tests passed, or adding an abstraction to avoid reading the existing one are failures. Hiding uncertainty with brevity is also a failure.

## Verification

Compare the diff to the request, check every changed path and run targeted checks. For security or payment changes, run the full required test and scan even if the diff is small. Keep the report short but include exact commands and outcomes.

## Completion criterion

The task is complete with the smallest justified diff and no lost correctness or security; only relevant files were inspected, and the response gives concise evidence.
