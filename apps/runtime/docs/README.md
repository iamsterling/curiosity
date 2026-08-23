# Architecture and research index

## Plans

- [Complementary runtime implementation plan](plans/complementary-runtime-implementation-plan.md)
  — planning artifact only; it does not authorize implementation or deployment

## Decisions

- **Accepted:** [ADR 0020: provider-neutral bounded web search](decisions/0020-provider-neutral-web-search.md)
- **Accepted:** [ADR 0023: stateless M1 Rust core and Bun shim](decisions/0023-stateless-m1-runtime.md)
- **Accepted:** [ADR 0024: M1 verification and GO](decisions/0024-m1-verification-and-go.md)
- **Accepted:** [ADR 0025: M2 initial local test snapshot](decisions/0025-m2-initial-local-test-snapshot.md)
- **Accepted:** [ADR 0026: M2 foundational durable-state boundary](decisions/0026-m2-foundational-durable-state-boundary.md)
- **Accepted:** [ADR 0027: M2 contract, ABI, and authority](decisions/0027-m2-contract-abi-and-authority.md)
- **Accepted:** [ADR 0028: M2 verification and GO](decisions/0028-m2-verification-and-go.md)
- **Accepted:** [ADR 0029: M3 query authority and source contract](decisions/0029-m3-query-authority-and-source-contract.md)
- **Accepted:** [ADR 0030: M3 verification and GO](decisions/0030-m3-verification-and-go.md)
- **Accepted (repository only; production NO-GO):** [ADR 0031: M5 SearXNG gateway D6](decisions/0031-m5-searxng-gateway-d6.md)
- **Accepted:** [ADR 0032: M5 no-new-dependency D8](decisions/0032-m5-no-new-dependency-d8.md)
- **Accepted (repository GO; production NO-GO):** [ADR 0033: M5 verification](decisions/0033-m5-verification-and-repository-go.md)
- **Accepted:** [ADR 0034: M4 D5A owned-crawl jobs](decisions/0034-m4-d5a-owned-crawl-job-semantics.md)
- **Accepted (repository local only):** [ADR 0035: M6 local fetch D6](decisions/0035-m6-repository-local-fetch-d6.md)
- **Accepted (exact synthetic cell):** [ADR 0036: M6 owned-cell D7](decisions/0036-m6-owned-synthetic-cell-d7.md)
- **Accepted (M4 GO):** [ADR 0037: M4 verification](decisions/0037-m4-verification-and-go.md)
- **Accepted (repository GO; production/public NO-GO):** [ADR 0038: M6 verification](decisions/0038-m6-verification-and-repository-go.md)
- **Accepted (exact private Darwin arm64 profile GO; all broader release gates NO-GO):** [ADR 0039: private local release profile](decisions/0039-private-local-darwin-arm64-release-profile.md) and [ADR 0040: M7 verification](decisions/0040-m7-private-profile-verification-and-go.md)
- **Proposed:** [ADR 0021: stage an owned public-web search plane](decisions/0021-owned-public-web-search.md)
- **Proposed:** [ADR 0022: installable local-first search runtime](decisions/0022-installable-search-runtime.md)
- **Accepted (design only; not implementation authority):** [ADR 0041: unified retrieval and validated memory evidence substrate](decisions/0041-unified-retrieval-memory-evidence-substrate.md)
- **Proposed:** [ADR 0043: Curiosity Retrieval bounded contexts and contracts](decisions/0043-curiosity-retrieval-bounded-contexts-and-contracts.md)
- **Proposed:** [ADR 0044: source surfaces, connectors, and retrieval modes](decisions/0044-source-surfaces-connectors-and-retrieval-modes.md)
- **Proposed:** [ADR 0045: epistemic records and bitemporal memory](decisions/0045-epistemic-records-and-bitemporal-memory.md)
- **Proposed:** [ADR 0046: retrieval authority, security, and MCP boundary](decisions/0046-retrieval-authority-security-and-mcp-boundary.md)
- **Proposed:** [ADR 0047: investigation, ranking, and stopping semantics](decisions/0047-investigation-ranking-and-stopping-semantics.md)
- **Proposed:** [ADR 0048: retrieval migration, topology, and qualification](decisions/0048-retrieval-migration-topology-and-qualification.md)
- **Accepted (narrow reversible internal-contract implementation only; production NO-GO):** [ADR 0049: reversible Curiosity Retrieval contract tranche](decisions/0049-reversible-retrieval-contract-tranche.md)
- **Accepted (removable development composition only; production NO-GO):** [ADR 0050: development-only RetrieveInformation composition](decisions/0050-development-retrieve-information-composition.md)
- **Accepted (reversible Retrieval v3 development tranche only; crawl/persistence/cutover NO-GO):** [ADR 0051: reversible Retrieval v3 development tranche](decisions/0051-reversible-retrieval-v3-development-tranche.md)
- **Accepted (architecture/specification only; implementation/dependency/crawl/persistence/cutover/production NO-GO):** [ADR 0052: next retrieval source and owned-web specification program](decisions/0052-next-retrieval-source-and-owned-web-specification-program.md)
- **Conditionally accepted (fixture-only removable qualification under a trusted stable operator-root precondition; advisory cleanliness unresolved; no live fetch, canonical Ledger implementation, index, release, or production authority):** [ADR 0053: fixture-only owned-web SQLite qualification](decisions/0053-fixture-only-owned-web-sqlite-qualification.md)
- **Accepted (reader-only clean-room lexical qualification; no builder, publication, serving, dependency, corpus, release, or production authority):** [ADR 0054: clean-room owned lexical reader qualification](decisions/0054-clean-room-owned-lexical-reader-qualification.md)
- **Accepted (exact removable private lexical builder/publication qualification implementation GO; no dependency, integration, serving, release, live/production input, or production authority):** [ADR 0055: owned lexical builder and atomic publication contract](decisions/0055-owned-lexical-builder-and-atomic-publication.md)
- **Accepted (removable private legacy-parity implementation only; plugin authority/persistence/integration/cutover/production unchanged):** [ADR 0056: Rust-native legacy memory parity tranche](decisions/0056-rust-native-legacy-memory-parity.md)
- **Accepted (exact private Darwin/Bun/OpenCode test-only Node-API qualification with one verifier-temp empty-registration test plugin; no normal plugin composition, package surface, authority transfer, release, or production):** [ADR 0057: private Node-API SDK qualification](decisions/0057-private-node-api-sdk-qualification.md)
- **Accepted (documentation authority for a fifth isolated control-flow observation artifact and a new v2 candidate/approval only):** [ADR 0058: fifth Node-API control-flow observation artifact](decisions/0058-fifth-node-api-control-flow-observation-artifact.md)
- **Accepted (documentation authority for separate actual-addon isolation and controlled shared-core interleaving evidence in a replacement schema-v3 SDK-v2 candidate only):** [ADR 0059: controlled phase-core concurrency evidence](decisions/0059-controlled-phase-core-concurrency-evidence.md)
- **Accepted (documentation authority for replacement SDK-v2 tool/environment policy only; no candidate approval or qualification):** [ADR 0060: closed SDK-v2 tool and environment policy](decisions/0060-closed-sdk-v2-tool-and-environment-policy.md)
- **Moved / Accepted at canonical location:** [ADR 0024: durable Ledger v2 and
  capture authority](../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md)
  ([provenance stub](decisions/moved-durable-ledger-v2-and-capture-authority.md))

## M2 design and schema

- [D4 candidate snapshot manifest schema](schemas/d4-candidate-snapshot-manifest.schema.json)
- [Canonical-file state design](design/canonical-file-state.md)

M1–M3 have bounded repository completion under ADRs 0023–0030. ADRs 0031–0033
close only the M5 repository adapter. ADRs 0034/0037 close M4 for exactly
`build_owned_crawl_snapshot`; ADRs 0035/0036/0038 close M6 for only the fixed
local project-CA synthetic cell. ADRs 0039/0040 close M7 only for the immutable
private Darwin arm64 archive bound to source commit `0dfc71d`; ADR 0040 is a
later documentation commit, not the artifact source. Thus M1–M7 repository or
exact private-profile work is complete only within those scopes. Production and
public deployment, M5-live, M6-crawl, generic fetch/public crawl, package/public
publication, signing, notarization, and all other platforms remain NO-GO. ADR
0055's internal qualification-generation publication is the narrow exception.
ADR 0041 and canonical plugin ADR 0024 add accepted unified-substrate and Ledger
durability designs only; they do not widen those implementation or production
authorities. ADRs 0049–0051 authorize only their enumerated removable development
tranches and do not accept ADRs 0043–0048 generally. ADR 0052 accepts only its
architecture and native specification program; it grants no implementation,
dependency, live-fetch, persistence, deployment, cutover, or production authority.
ADR 0053 conditionally adds only a network-denied, project-fixture qualification
simulation under its trusted stable operator-root precondition; its pinned proof
adapter observes no real Ledger and grants no canonical authority.
ADR 0054 supersedes only ADR 0052's Tantivy implementation choice. It preserves
the projection/governance contract and authorizes only a dependency-free,
internal reader qualification over hand-authored immutable fixtures.
ADR 0055 authorizes implementation only of its exact removable private,
project-authored builder and atomic publication qualification. It does not
authorize dependencies, acquisition/Ledger integration, `OwnedSnapshotPort`,
serving, live/production inputs, fallback, deployment, or production claims.
ADR 0056 separately authorizes only side-effect-free Rust parity against the
plugin's unchanged JavaScript oracle. Ledger v1 remains sole lifecycle
authority; EventCapture is observation-only; evidence metadata is authoritative
only through Ledger; and the development evidence slice remains uncomposed and
non-authoritative. Persistence, integration, migration, v2 activation,
Node-API/export, M2/M6 authority change, and production remain NO-GO.
ADR 0057 is the only Node-API exception: a separate test-only crate and plugin
test shim may qualify unchanged ADR 0056 protocol bytes on pinned Darwin arm64,
Bun 1.3.14, and lock-resolved OpenCode beta-17595. Exactly one verifier-temp,
empty-registration OpenCode test plugin may load and execute once; it grants no
normal plugin composition or authority. Any later composition decision must be
plugin-first.
ADR 0058 narrowly replaces its four-artifact/schema-sameness rule with one fifth
request-scoped observation artifact. That artifact is Bun-child-only, never
OpenCode/package/release input, and requires a new v2 candidate and approval.
ADR 0059 narrows concurrency claims: actual-addon widths prove request-local
isolation only, while a non-addon standalone fixture may prove prescribed
shared-core schedules only in Phase C. The two verdicts remain independent; the
fixture is absent from all package and release surfaces.
ADR 0060 closes replacement-candidate tool and environment policy only. It does
not approve or qualify a candidate. Checked-in SDK-v2 approval and receipt files
are preserved historical evidence; their supersession chain and observed policy
conflicts make the aggregate current claim contradictory and unqualified.
Receipt presence, including a matching candidate digest, cannot promote status.

## SDK v2 adjudication

**Deferred / NO-GO.** Legacy-memory Node-API SDK v2 is contradictory and
unqualified. Historical approvals and receipts remain immutable at their
original paths, but none is current normal-composition, package, release,
persistence, or production authority. A coherent fresh candidate, exact platform
qualification, valid approval topology, and a separate plugin-first authority
decision would be required before any broader claim.

## Specifications

- [Curiosity Retrieval internal contracts v3](specifications/curiosity-retrieval-contracts-v3.md)
- [Retrieval source access v1](specifications/retrieval-source-access-v1.md)
- [Owned-web control, capture, and extraction v1](specifications/owned-web-control-capture-extraction-v1.md)
- [Owned-web lexical index and query v1](specifications/owned-web-lexical-query-v1.md)
- [Curiosity-owned lexical reader format and query v1](specifications/owned-lexical-reader-format-v1.md)
- [Curiosity-owned lexical builder and publication v1](specifications/owned-lexical-builder-publication-v1.md)
- [Legacy memory parity v1](specifications/legacy-memory-parity-v1.md)
- [Legacy memory Node-API SDK v1](specifications/legacy-memory-node-api-sdk-v1.md)
- [Legacy memory Node-API SDK v2](specifications/legacy-memory-node-api-sdk-v2.md)
- [Retrieval corpus governance and admission v1](specifications/retrieval-corpus-governance-v1.md)
- [Retrieval evaluation and SearXNG cutover v1](specifications/retrieval-evaluation-searxng-cutover-v1.md)

The ADR/specification set is the repository-native workflow. OpenSpec is not used.
Normative requirements constrain later proposals and grant implementation only
where an accepted ADR explicitly says so; they never imply production authority.

## Research

See the [research index](research/README.md). New evidence should distinguish
product requirements, provider comparisons, deployment constraints, and
repeatable benchmark results.

Canonical live inventories are [product research](research/products/) and
[benchmark research](research/benchmarks/). Any `products.zip` archive is not
part of the canonical inventory.

The dated [cross-product synthesis](research/cross-product-web-search-synthesis-2026-08-17.md)
integrates those inventories without replacing their individual source records.
