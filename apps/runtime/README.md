# curiosity-retrieval

Private, independent home for Curiosity web-search and retrieval architecture,
provider evaluation, deployment research, and benchmarking records.

This repository currently contains documentation only. It was split from
[`iamsterling/opencode2-config`](https://github.com/iamsterling/opencode2-config)
so retrieval decisions can evolve without coupling them to the OpenCode plugin,
Ledger, or Loop implementation.

## Contents

- [`docs/decisions/`](docs/decisions/) — architecture decisions; each ADR's own
  status distinguishes accepted decisions from proposals
- [`docs/research/`](docs/research/) — research index
- [`docs/research/products/`](docs/research/products/) — canonical live product
  research records
- [`docs/research/benchmarks/`](docs/research/benchmarks/) — canonical live
  benchmark records
- [`docs/research/cross-product-web-search-synthesis-2026-08-17.md`](docs/research/cross-product-web-search-synthesis-2026-08-17.md)
  — dated synthesis of the current product and benchmark inventory
- [`provenance/origin.md`](provenance/origin.md) — transfer and attribution record

Any `products.zip` archive is excluded from the canonical inventory; the live
`docs/research/products/` directory is authoritative.

ADR status is per document. ADR 0020 is **Accepted** for repository
implementation with deployment pending; ADRs 0021 and 0022 are **Proposed** and
do not authorize implementation, crawling, corpus acquisition, or deployment.

## Boundaries

Search/retrieval documentation belongs here. Curiosity execution records,
Ledger/Loop design, generic research, implementation, credentials, runtime
state, and deployment state do not.
