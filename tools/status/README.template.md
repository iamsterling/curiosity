# Curiosity

Curiosity is a monorepo containing plugin, runtime, application, documentation,
and workspace-package source. Canonical repository status statements are
maintained in the [machine-readable catalog](docs/status/capabilities.json) and
rendered into the generated blocks below and the
[generated detail view](docs/status/current.md). Non-generated prose covers
navigation, verification, contribution, provenance, and licensing guidance.

## Catalog policy

<!-- status:policy:start -->
{{POLICY_BLOCK}}
<!-- status:policy:end -->

## Workspace map

<!-- status:workspace:start -->
{{WORKSPACE_TABLE}}
<!-- status:workspace:end -->

## Capability matrix

<!-- status:status:start -->
{{STATUS_TABLE}}
<!-- status:status:end -->

## Setup and component documentation

Install the pinned workspace dependencies without changing the lockfile:

```sh
bun install --frozen-lockfile --ignore-scripts
```

Then start at the boundary you intend to change:

- [Plugin README](apps/plugin/opencode2/README.md) and
  [architecture index](apps/plugin/opencode2/docs/architecture/README.md)
- [Runtime README](apps/runtime/README.md) and
  [runtime architecture index](apps/runtime/docs/README.md)
- `apps/web`, `apps/docs`, and `packages/ui` only for starter-scaffold work

## Verification entry points

The root tasks are non-recursive and use the reviewed Turbo graph so every
authoritative workspace is covered once:

```sh
bun run test
bun run verify
bun run inventory:check
bun run status:check
bun run --cwd apps/plugin/opencode2 verify
bun run --cwd apps/plugin/opencode2 verify:linux
bun run --cwd apps/runtime verify
```

The plugin `verify` task is portable and never invokes the Darwin real-host
suite. `verify:linux` fails closed off Linux; the separate `verify:darwin`
profile requires Darwin arm64 plus `CURIOSITY_TRUSTED_DARWIN_MANUAL=1` and is
reserved for the reviewed manual lane.

See [verification tiers and CI operation](docs/verification/README.md) for the
portable Linux, fail-closed network namespace, trusted foreground Darwin, CI
cadence, aggregate required-gate, platform limits, and NO-GO boundaries.

`status:write` is the explicit maintainer command for regenerating the canonical
root README and `docs/status/current.md`. CI uses check mode and never rewrites
tracked files. Catalog and source guards require separate reviewed edits and are
never updated by `status:write`.

## Contributor starting points

- Status truth: `docs/status/capabilities.json`, `docs/status/schema.json`, and
  `tools/status/`
- Plugin composition: `apps/plugin/opencode2/src/plugin/plugin.ts`
- Mechanical host capability report:
  `apps/plugin/opencode2/src/platform/real-host/index.ts`
- Runtime package boundaries: `apps/runtime/package.json`, `apps/runtime/src/`,
  and `apps/runtime/native/`
- Consequential decisions: each component's `docs/decisions/` index

Behavior changes require a focused failing test before the smallest root-cause
fix. Do not weaken lifecycle guards or infer authority from docs, catalogs,
receipts, package metadata, or generated output.

## Provenance and licensing

The plugin preserves its OpenCode Loop import attribution and reproducible
manifests under [`apps/plugin/opencode2/provenance/`](apps/plugin/opencode2/provenance/)
and is licensed under its [MIT license](apps/plugin/opencode2/LICENSE). Runtime
origin and transfer history reside in
[`apps/runtime/provenance/`](apps/runtime/provenance/). Third-party fixtures,
tools, research inputs, and dependencies retain their own recorded licenses;
there is no repository-wide license grant that overrides component records.
