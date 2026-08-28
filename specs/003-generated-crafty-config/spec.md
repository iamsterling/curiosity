# Feature Spec: Generated Crafty Repo Config

## Problem

Crafty can infer project structure, but teams need PayloadCMS-style, repo-local configuration that explains and stabilizes that inference. Users should not hand-write config before Crafty works; Crafty should generate sane dotfiles, then let teams edit them when heuristics need an override.

## Target Users

- **Primary**: Developers opening Crafty in an existing React/Next/Vite repo.
- **Secondary**: AI agents and CI jobs that need deterministic discovery metadata.

## User Stories

1. As a developer, I can run one command/API method and get repo-level `.crafty` config artifacts.
2. As a developer, I can inspect `.crafty/config.ts` and see typed Payload-style collection objects.
3. As a developer, I can inspect `.crafty/manifest.json` and see what Crafty discovered and why.
4. As an agent, I can call the public `crafty.*` API to generate config without importing internal packages.

## MVP Scope

- Typed config model for collections, discovery, workbench, preview, codegen, hooks, and plugins.
- Config generation into `.crafty/config.ts`, `.crafty/manifest.json`, and `.crafty/generated.d.ts`.
- Public API method for generating config artifacts.
- CLI command for repo-level config generation.
- Tests covering generated file paths, typed collection content, manifest content, and CLI output.

## Non-goals

- Executing arbitrary user-authored TypeScript config.
- Runtime plugin execution.
- Auth/access control.
- Remote registry sync or cloud persistence.

## Acceptance Criteria

- Spec Kit artifacts exist for the feature.
- `@crafty/api` exposes typed config generation and writes all expected dotfiles.
- `@crafty/api` exposes the config generation through the public facade.
- `@crafty/cli` exposes a command that generates config from a workspace root.
- Generated `.crafty/config.ts` uses exported `CraftyConfig` and `CraftyCollection` types.
- Generated `.crafty/manifest.json` includes discovered collections and reasons.
- Relevant package typecheck/test/build commands pass.

## Risks

- Config generation can become overengineered if it tries to execute user code in the MVP.
- Side-effecting discovery would surprise API consumers, so generation should be explicit.
- Generated dotfiles must avoid test/build cache noise while still being useful to commit.

## Success Demo

1. Run `crafty config <workspace-root>`.
2. Open `.crafty/config.ts` and see Payload-style collection objects for screens, shared components, components, and primitives.
3. Open `.crafty/manifest.json` and see discovered entries plus classification reasons.
4. Import `CraftyConfig` from `@crafty/api` and get type-safe config editing.
