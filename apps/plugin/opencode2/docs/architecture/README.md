# Plugin architecture index

This is the current index for `@iamsterling/opencode2-config`. Status claims are
scope-qualified by the repository [capability catalog](../../../../../docs/status/capabilities.json)
and its [generated human view](../../../../../docs/status/current.md). Those
reporting surfaces summarize implementation, evidence, and decision authority;
they are not lifecycle authority and cannot grant persistence, publication, or
production authority.

## Current records

- [Current state](current-state.md) — composed package behavior, disabled
  capabilities, internal scaffolding, and fail-closed boundaries.
- [Release-candidate acceptance](release-candidate-acceptance.md) — local
  acceptance constraints; not evidence of external publication.
- [Real-host probes](../operations/real-host-probes.md) — exact host probe
  boundary.
- [Removed daemon tombstone](../operations/daemon-deprecation.md) — negative
  assertion for the retired compatibility daemon.
- [Foundation preflight](preflight-2026-08-12.md) — immutable historical
  snapshot, never current authority.

`src/plugin/plugin.ts` is the composition root. It composes only
`pluginConfigFeature`, `hookFoundationFeature`, and `structuredToolsFeature`.
The package entrypoint exports the default plugin; optional private runtime
search is conditional and does not make `@curiosity/runtime` a published
dependency.

## Decision chronology

Historical decisions remain preserved at their original paths. A later decision
or this index may supersede a claim, but does not rewrite the earlier bytes.

- ADRs [0001](../decisions/0001-brand-new-identity-and-state.md),
  [0002](../decisions/0002-private-git-distribution.md),
  [0003](../decisions/0003-provenance-import-boundary.md), and
  [0004](../decisions/0004-native-v1-import-and-contract-authority.md) record
  identity, distribution, provenance, and imported-contract foundations. ADR
  0002 is superseded by ADR 0031.
- ADRs [0005](../decisions/0005-product-identity.md),
  [0006](../decisions/0006-compiled-esm.md),
  [0007](../decisions/0007-composition-root.md),
  [0008](../decisions/0008-ledger-authority.md), and
  [0009](../decisions/0009-assets.md) define product, build, composition,
  authority, and asset boundaries. ADR 0008 is superseded by ADR 0012.
- ADR [0010](../decisions/0010-loop-compat.md) is preserved historical
  compatibility authority and is superseded by
  [ADR 0013](../decisions/0013-legacy-loop-retirement.md). ADRs
  [0011](../decisions/0011-native-loop-primitives.md),
  [0012](../decisions/0012-ledger-native-product.md), and 0013 define native
  loop ownership, sole Ledger authority, and retired imported surfaces.
- ADRs [0014](../decisions/0014-release-candidate-authority-and-fencing.md),
  [0015](../decisions/0015-next-17430-plugin-abi.md),
  [0016](../decisions/0016-darwin-real-host-confinement-oracle.md),
  [0017](../decisions/0017-engineering-intent-commands.md),
  [0018](../decisions/0018-plugin-owned-agent-default.md), and
  [0019](../decisions/0019-beta-17519-plugin-abi.md) preserve fencing, ABI,
  confinement, command, and agent history. Their own status/supersession text
  controls; ADR 0025 supersedes the active older host pins.
- ADRs [0020](../decisions/0020-m3-custom-tool-host-preflight.md),
  [0021](../decisions/0021-m3-effect-runtime-search-adapter.md),
  [0022](../decisions/0022-m7-private-opencode-adapter.md),
  [0024](../decisions/0024-durable-ledger-v2-and-capture-authority.md), and
  [0025](../decisions/0025-beta-17595-plugin-abi.md) cover host
  characterization, search, the superseded M7 host profile, design-only Ledger
  v2, and the active beta-17595 ABI pin.
- ADRs [0026](../decisions/0026-rust-native-legacy-memory-parity-companion.md),
  [0027](../decisions/0027-private-node-api-sdk-qualification-companion.md),
  and [0028](../decisions/0028-fifth-node-api-control-flow-observation-companion.md)
  authorize only their stated private/test evidence seams.
- [ADR 0029](../decisions/0029-controlled-phase-core-concurrency-companion.md)
  is documentation authority for replacement schema-v3 SDK-v2 concurrency
  evidence only; it creates no fixture, candidate, approval, or qualification.
- [ADR 0030](../decisions/0030-closed-sdk-v2-tool-policy-companion.md)
  adopts the closed SDK-v2 tool/environment policy at the plugin boundary. The
  checked-in receipt history remains contradictory/unqualified and grants no
  normal composition or authority transfer.
- [ADR 0031](../decisions/0031-registry-ready-package-and-black-box-proof.md)
  makes the plugin registry-ready and supersedes ADR 0002. Its isolated
  loopback proof does not publish an artifact or authorize cutover/deployment.
