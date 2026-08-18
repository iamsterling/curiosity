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
- **Proposed:** [ADR 0021: stage an owned public-web search plane](decisions/0021-owned-public-web-search.md)
- **Proposed:** [ADR 0022: installable local-first search runtime](decisions/0022-installable-search-runtime.md)

## M2 design and schema

- [D4 candidate snapshot manifest schema](schemas/d4-candidate-snapshot-manifest.schema.json)
- [Canonical-file state design](design/canonical-file-state.md)

ADRs 0025–0028 accept bounded dependency-free M2. ADRs 0029–0030 add the private
query package and M3 adapter boundary. ADRs 0031–0032 authorize only the bounded
M5 repository adapter; production, M4, M6, M7, crawl, generic fetch, packaging,
  publication, and deployment remain NO-GO. ADRs 0034–0038 additionally accept
  one M4 operation and one exact repository-only M6 synthetic cell; public and
  production crawl remain NO-GO.

## Research

See the [research index](research/README.md). New evidence should distinguish
product requirements, provider comparisons, deployment constraints, and
repeatable benchmark results.

Canonical live inventories are [product research](research/products/) and
[benchmark research](research/benchmarks/). Any `products.zip` archive is not
part of the canonical inventory.

The dated [cross-product synthesis](research/cross-product-web-search-synthesis-2026-08-17.md)
integrates those inventories without replacing their individual source records.
