# Research: Generated Crafty Repo Config

## Findings

- Existing Spec Kit support is markdown/JSON only; no executable spec-kit CLI or scripts are present.
- Discovery is centralized in `@crafty/api`, which makes it the safest generation source.
- Shared build-config stubs were removed; generated Crafty runtime config should continue to live under `.crafty` rather than a package workspace.
- Existing `.crafty` paths are already used for generated output, so config artifacts should live under the same repo-level dot directory.

## Decisions

- Generate config explicitly through `generateConfig`/`config` rather than as a side effect of `discover`.
- Do not execute `.crafty/config.ts` in the MVP; generated TypeScript is an editable handoff artifact.
- Include reasons in the manifest so users and agents can debug classifications without reading heuristics.

## Open Questions Deferred

- Whether `.crafty/manifest.json` should be committed or regenerated in CI.
- How user-authored config execution should be sandboxed later.
