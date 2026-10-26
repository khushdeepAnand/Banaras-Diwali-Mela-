---
name: asset-integration
description: "Use when supplied asset folders or files must be inspected, compared for duplicates or conflicts, licence-checked, format-validated, selectively merged, or integrated without overwriting working code."
---

# Asset Integration

## Purpose

Bring outside assets into the mela safely. Integrate only what is needed, with provenance, and leave working code intact.

## When to use

Use when merging a folder, zip, model pack, texture set or image drop. Do not use for procedural geometry needing no imported file. Token rule: inventory first, read metadata, and open only candidates.

## Workflow

1. Record the source path and `git status`. Identify untracked work that must not be overwritten.
2. Inventory name, size, extension, dimensions, duration and hash. Group duplicates.
3. Check licences and provenance. Mark each file usable, needs attribution, or unverified. Unknown licence means do not ship it.
4. Compare with existing assets and imports; prefer existing files and note case, format and visual conflicts.
5. Plan each file as keep, copy, rename, convert or discard; preserve originals.
6. Copy only selected files to the correct location; update imports or public paths; add attribution notes to `docs/` if required.
7. Validate supported formats. GLB/GLTF and common images are safe; KTX2 needs an existing loader and fallback.

## Project rules

- No runtime remote asset URLs. Assets belong in `frontend/public/` or imported from `src/`, never fetched from a random host.
- Preserve case and avoid spaces in filenames. Windows may hide case mismatches that fail on Linux hosts.
- Do not overwrite `favicon.svg`, existing screenshots or source files merely because names collide. Rename or reject the incoming file.
- Keep source art and intermediate files out of the shipped bundle unless explicitly needed.
- Large textures and models need a performance review; follow `webgl-performance`.
- Do not add a loader or dependency for one unverified file without checking the existing Three.js setup.

## Failure cases

Blind overwrite, duplicate assets with different casing, an unlicensed texture, a model whose units or origin break placement, a huge PNG where WebP is appropriate, a missing attribution, and code changed to fit an asset that should have been rejected are failures. Also reject partial merges that leave broken imports.

## Verification

Run `npm run typecheck`, the relevant tests and `npm run build` in `frontend/` (and backend if touched). Open the scene and confirm the asset appears at the intended scale and material. Inspect the diff to confirm no unrelated file changed.

## Completion criterion

Only needed files were added, each has a known licence, duplicates and conflicts are resolved explicitly, imports resolve, the scene renders correctly, and no working code or original asset was overwritten without a recorded reason.
