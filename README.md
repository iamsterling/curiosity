# Curiosity

Curiosity is a monorepo containing plugin, runtime, application, documentation,
and workspace-package source. Canonical repository status statements are
maintained in the [machine-readable catalog](docs/status/capabilities.json) and
rendered into the generated blocks below and the
[generated detail view](docs/status/current.md). Non-generated prose covers
navigation, verification, contribution, provenance, and licensing guidance.

## Catalog policy

<!-- status:policy:start -->
> This report describes validated repository state; it grants no lifecycle or release authority.

- **Current:** Current requires implemented local source, sufficient local evidence, local decision authority, delivery, and applicable local qualification for the declared scope.
- **Experimental:** Experimental is bounded to conditional, internal, or test-only delivery and cannot establish a consequential claim.
- **Deferred:** Deferred is disabled with an explicit blocker and a NO-GO verdict.
- **Retired:** Retired is a guarded negative assertion that a former surface is absent.
- **Fail-closed unknowns:** Unknown or contradictory consequential state fails closed.
- **Consequential claims:** Wave 2 mechanically forbids publication, production enablement or readiness, and deployment enablement or readiness.
<!-- status:policy:end -->

## Workspace map

<!-- status:workspace:start -->
| Path | Package | Role | Visibility |
| --- | --- | --- | --- |
| `apps/custom-harness` | `@curiosity/custom-harness` | Independent authority harness workspace | private |
| `apps/plugin/opencode2` | `@iamsterling/opencode2-config` | Plugin package workspace | registry-ready; publication unknown |
| `apps/runtime` | `@curiosity/runtime` | Runtime package workspace | private |
| `apps/web` | `web` | Starter application workspace | private |
| `apps/docs` | `docs` | Starter application workspace | private |
| `packages/ui` | `@repo/ui` | Starter library workspace | private |
| `packages/eslint-config` | `@repo/eslint-config` | Workspace configuration package | private |
| `packages/typescript-config` | `@repo/typescript-config` | Workspace configuration package | private |
<!-- status:workspace:end -->

## Capability matrix

<!-- status:status:start -->
| Capability | Scope | Availability | Production | Publication | Deployment | Qualification | Status | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [Independent harness vertical slice](docs/status/current.md#custom-harness-vertical-slice) | harness / package / repository, development / platforms: darwin-arm64 | enabled | disabled | unpublished | disabled | qualified | **Current** | GO — Current only for the declared scope and validated local facets. |
| [Plugin identity and agent configuration](docs/status/current.md#plugin-identity-config) | plugin / package / repository, development | conditional | disabled | unknown | disabled | unqualified | **Experimental** | CONDITIONAL — Experimental and bounded to the declared non-consequential scope. |
| [Context and tool observation capture](docs/status/current.md#plugin-hooks-event-capture) | plugin / package / repository, development | conditional | disabled | unknown | disabled | unqualified | **Experimental** | CONDITIONAL — Experimental and bounded to the declared non-consequential scope. |
| [Ledger and native-loop tool registration](docs/status/current.md#plugin-structured-tools) | plugin / package / repository, development | conditional | disabled | unknown | disabled | unqualified | **Experimental** | CONDITIONAL — Experimental and bounded to the declared non-consequential scope. |
| [Ledger lifecycle boundary](docs/status/current.md#plugin-ledger-authority) | plugin / package / repository, development | conditional | disabled | unknown | disabled | unqualified | **Experimental** | CONDITIONAL — Experimental and bounded to the declared non-consequential scope. |
| [Lifecycle and material write boundary](docs/status/current.md#plugin-authoritative-writes) | plugin / package / — | disabled | disabled | not-applicable | disabled | unqualified | **Deferred** | NO-GO — Deferred, disabled, and blocked from consequential use. |
| [Fail-closed lifecycle guards](docs/status/current.md#plugin-lifecycle-guards) | plugin / package / repository, development | conditional | disabled | unknown | disabled | unqualified | **Experimental** | CONDITIONAL — Experimental and bounded to the declared non-consequential scope. |
| [Mechanical real-host capability report](docs/status/current.md#plugin-capability-report) | plugin / package / repository, development, test | conditional | disabled | unknown | disabled | unqualified | **Experimental** | CONDITIONAL — Experimental and bounded to the declared non-consequential scope. |
| [Composed web-search surfaces](docs/status/current.md#plugin-search-surface) | plugin / package / development, test | conditional | disabled | unknown | disabled | conditional | **Experimental** | CONDITIONAL — Experimental and bounded to the declared non-consequential scope. |
| [Optional private runtime search profile](docs/status/current.md#plugin-private-runtime-search) | plugin / private-profile / development, test, private-release / platforms: darwin-arm64 | disabled | disabled | unpublished | disabled | unqualified | **Deferred** | NO-GO — Deferred, disabled, and blocked from consequential use. |
| [Registry packaging readiness](docs/status/current.md#plugin-registry-readiness) | plugin / package / repository, test | conditional | disabled | unknown | disabled | unqualified | **Experimental** | CONDITIONAL — Experimental and bounded to the declared non-consequential scope. |
| [Engineering-intent scaffolding](docs/status/current.md#plugin-engineering-intent) | plugin / repository / development, test | disabled | disabled | not-applicable | disabled | conditional | **Experimental** | CONDITIONAL — Experimental and bounded to the declared non-consequential scope. |
| [Development evidence scaffolding](docs/status/current.md#plugin-evidence-scaffolding) | plugin / repository / development, test | disabled | disabled | not-applicable | disabled | conditional | **Experimental** | CONDITIONAL — Experimental and bounded to the declared non-consequential scope. |
| [Orchestration and handoff scaffolding](docs/status/current.md#plugin-orchestration-scaffolding) | plugin / repository / development, test | disabled | disabled | not-applicable | disabled | conditional | **Experimental** | CONDITIONAL — Experimental and bounded to the declared non-consequential scope. |
| [Runtime M1 stateless core](docs/status/current.md#runtime-m1) | runtime / package / repository, development | enabled | disabled | unpublished | disabled | qualified | **Current** | GO — Current only for the declared scope and validated local facets. |
| [Runtime M2 local corpus state](docs/status/current.md#runtime-m2) | runtime / package / repository, development | enabled | disabled | unpublished | disabled | qualified | **Current** | GO — Current only for the declared scope and validated local facets. |
| [Runtime M3 query boundary](docs/status/current.md#runtime-m3) | runtime / package / repository, development | enabled | disabled | unpublished | disabled | qualified | **Current** | GO — Current only for the declared scope and validated local facets. |
| [Runtime M4 owned-crawl job operation](docs/status/current.md#runtime-m4) | runtime / repository / repository, test | enabled | disabled | unpublished | disabled | qualified | **Current** | GO — Current only for the declared scope and validated local facets. |
| [Runtime M5 repository gateway adapter](docs/status/current.md#runtime-m5) | runtime / repository / repository, test | enabled | disabled | unpublished | disabled | qualified | **Current** | GO — Current only for the declared scope and validated local facets. |
| [Runtime M6 fixed synthetic cell](docs/status/current.md#runtime-m6) | runtime / repository / repository, test | enabled | disabled | unpublished | disabled | qualified | **Current** | GO — Current only for the declared scope and validated local facets. |
| [Runtime M7 immutable historical artifact](docs/status/current.md#runtime-m7-historical) | runtime / private-profile / private-release / platforms: darwin-arm64 | enabled | disabled | unpublished | disabled | qualified | **Current** | GO — Current only for the declared scope and validated local facets. |
| [Runtime M7 current source candidate](docs/status/current.md#runtime-m7-current) | runtime / private-profile / private-release / platforms: darwin-arm64 | disabled | disabled | unpublished | disabled | unqualified | **Deferred** | NO-GO — Deferred, disabled, and blocked from consequential use. |
| [Unified retrieval and validated-memory design](docs/status/current.md#runtime-unified-evidence) | runtime / design / — | disabled | disabled | not-applicable | disabled | unqualified | **Deferred** | NO-GO — Deferred, disabled, and blocked from consequential use. |
| [Legacy-memory Node-API SDK v2 qualification](docs/status/current.md#runtime-sdk-v2) | runtime / test-only / test | disabled | disabled | unpublished | disabled | contradictory | **Deferred** | NO-GO — Deferred, disabled, and blocked from consequential use. |
| [Web, docs, and UI starter scaffolds](docs/status/current.md#starter-scaffolds) | scaffolds / repository / development | conditional | disabled | unpublished | disabled | unqualified | **Experimental** | CONDITIONAL — Experimental and bounded to the declared non-consequential scope. |
| [Legacy loop runtime boundary](docs/status/current.md#retired-legacy-runtime) | plugin / retired / — | absent | disabled | not-applicable | disabled | not-required | **Retired** | RETIRED — Retired under guarded negative-source contracts. |
| [Legacy loop daemon boundary](docs/status/current.md#retired-daemon) | plugin / retired / — | absent | disabled | not-applicable | disabled | not-required | **Retired** | RETIRED — Retired under guarded negative-source contracts. |
| [Legacy marker protocol and local agent boundary](docs/status/current.md#retired-marker-agent) | plugin / retired / — | absent | disabled | not-applicable | disabled | not-required | **Retired** | RETIRED — Retired under guarded negative-source contracts. |
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
