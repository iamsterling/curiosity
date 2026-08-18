# Retrieval research

No standalone product-agent research report was found in the searched source
workspace or terminal artifacts at transfer time. That is a historical transfer
statement, not a claim about this repository's current inventory. The
transferred ADR summarizes the decision evidence available then; it is not a
substitute for primary reports.

## Canonical live inventories

- [Product research](products/) contains the canonical live product records.
- [Benchmark research](benchmarks/) contains the canonical live benchmark
  records.

As of 2026-08-17 the directories contain 172 product reports and 6 benchmark
reports. These are actual file counts, not a claim of an exhaustive market
survey; the landscape is broad and methodical but never literally exhaustive.

Any `products.zip` archive is excluded from the canonical inventory and must not
be used in place of the live directories. Records should preserve sources,
dates, methods, and uncertainty.

## Current dossier

- [DeepSeek Harness lessons for a complementary runtime
  (2026-08-17)](deepseek-harness-companion-runtime-boundary-2026-08-17.md)
  identifies the official developer-preview artifact and `rc.7` release, then
  studies its interfaces only to define a clean boundary for a separate
  companion runtime. It explicitly rejects harness replacement, duplicated
  orchestration, and harness-like runtime modularity.
- [Cross-product public-web search synthesis
  (2026-08-17)](cross-product-web-search-synthesis-2026-08-17.md) integrates the
  product and benchmark inventories, records cross-product contradictions, and
  recommends a local single-node/native-OpenCode-first distribution sequence.
- [Owned public-web search for Curiosity: research and architecture dossier
  (2026-08-17)](owned-public-web-search-architecture-2026-08-17.md) maps the
  transferred OpenCode search/Curiosity flow, surveys the agent-search and
  build-from-scratch stack, defines clean-room boundaries, and recommends a
  gated path from an empty local runtime through bounded corpus cells. Its
  linked ADR remains **Proposed**, not accepted.

No inventory report or synthesis is a paid/live comparative benchmark, vendor
superiority finding, corpus acquisition, or implementation/deployment record.
Transfer history remains authoritative in [`provenance/`](../../provenance/).
