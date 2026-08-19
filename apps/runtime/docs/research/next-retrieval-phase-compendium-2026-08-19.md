# Next Curiosity Retrieval phase: six-track research compendium

**Date:** 2026-08-19
**Status:** concise research synthesis; no implementation, dependency, corpus,
credential, crawl, persistence, deployment, benchmark, or cutover authority.

This compendium preserves the decision-bearing facts, inferences, and unknowns
from six completed tracks. Detailed dossiers remain canonical where linked.
Facts describe cited evidence; inferences are Curiosity design conclusions;
unknowns remain owner/research work. No live service was exercised for this
synthesis.

## 1. Direct MCP and source connectors

**Facts.** MCP supplies generic discovery, resources/tools, schemas, structured
results, cancellation, progress, and HTTP authorization, but no Curiosity search,
evidence, coverage, ranking, corpus, or action-authority semantics. OAuth resource
indicators bind token audience; they do not establish content truth. Current
OpenCode research found no safe public call-scoped child-tool/result handoff and
therefore supports receipts only, not claimed execution.

**Inference.** Curiosity should own a direct MCP client/configuration plane rather
than import OpenCode configuration. Strategic indexed and ACL-sensitive sources
need native connectors where revision/ACL/deletion/incremental/coverage semantics
cannot survive MCP. Harness MCP remains a separate authenticated receipt boundary.

**Unknowns.** Approved OAuth grants/broker, local process sandbox, first source,
connector SDK, source-by-source selection, and production limits.

Primary evidence: [MCP 2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28),
[RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html),
[RFC 8707](https://www.rfc-editor.org/rfc/rfc8707.html). Detailed records:
[MCP tools dossier](products/model-context-protocol-tools.md) and
[OpenCode receipt requirement](opencode-mcp-host-capability-requirement-2026-08-19.md).

## 2. Owned-web acquisition control plane

**Facts.** RFC 9309 defines robots parsing while explicitly denying that robots
is access authorization. Sitemaps and feeds are discovery formats, not custody or
permission. PostgreSQL documents `SKIP LOCKED` as useful for queue-like tables but
not as fairness, lease, or exactly-once semantics. SQLite WAL permits concurrent
readers with one writer and has explicit checkpoint/recovery behavior.

**Inference.** The initial single-node profile can use a closed SQLite event and
control model with short fenced leases and no transaction across network work,
while preserving a logical PostgreSQL migration seam. Acquisition operational
state must not become Ledger evidence/lifecycle authority.

**Unknowns.** Canonical URL policy, scheduling rates/fairness, lease/retry/recrawl
values, SQLite durability/backup profile, scale measurements, and PostgreSQL
migration trigger.

Primary evidence: [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html),
[Sitemaps protocol](https://www.sitemaps.org/protocol.html),
[RFC 4287](https://www.rfc-editor.org/rfc/rfc4287.html),
[SQLite WAL](https://www.sqlite.org/wal.html), and
[PostgreSQL 18 locking](https://www.postgresql.org/docs/18/explicit-locking.html).
Detailed records: [PostgreSQL control-plane dossier](products/postgresql-search-substrate.md)
and [v3 discovery decision evidence](retrieval-v3-owned-web-decision-2026-08-19.md).

## 3. Fetch, immutable capture, and safe extraction

**Facts.** HTTP redirects create new target requests; URI, DNS/address, TLS,
transfer/content encoding, and media handling are separate safety decisions.
WARC records can preserve target, time, protocol metadata, payload/block digests,
and content. Captured active content is untrusted bytes, not executable authority.

**Inference.** Every redirect needs renewed URL/DNS/SSRF/TLS policy. Independent
wire/decoded/ratio/time/MIME caps must precede immutable CAS+WARC commit.
Extraction should be networkless, resource-bounded, versioned, and produce
reproducible passage selectors with prompt-injection/quarantine labels. Rendering
is an optional later isolated derivative path.

**Unknowns.** Network allow/deny policy, TLS baseline, caps, accepted MIME/parser
matrix, exact WARC profile, encryption/key custody, quarantine operators, renderer
need, and parser-specific security qualification.

Primary evidence: [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986.html),
[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html),
[RFC 9264](https://www.rfc-editor.org/rfc/rfc9264.html), and
[WARC format description](https://www.loc.gov/preservation/digital/formats/fdd/fdd000236.shtml).
Architecture baseline: [owned-search dossier](owned-public-web-search-architecture-2026-08-17.md).

## 4. Lexical index and query projection

**Facts.** Tantivy is an embedded third-party MIT search library organized around
immutable segments, commit-gated manifests, snapshot readers, analyzers, BM25,
deletes, and merges. Its index does not provide Curiosity custody, rights,
authorization, passage lineage, or lifecycle truth. Its project benchmarks do not
predict this corpus.

**Inference.** A Tantivy-backed projection can be replaceable if Curiosity owns
the manifest, immutable generation, analyzer/ranking versions, passage identity,
tombstone watermark, hydration, and final authorization. Full rebuild and atomic
generation rollback should precede sharding; clean-room specification should not
copy Tantivy formats or implementation.

**Unknowns.** Dependency/license/security approval, schema/analyzers, BM25 and
diversity/freshness policy, representative quality/latency/storage results,
generation retention, and sharding threshold/topology.

Primary evidence: [Tantivy 0.26.1 docs](https://docs.rs/tantivy/0.26.1/tantivy/)
and [peeled release commit](https://github.com/quickwit-oss/tantivy/tree/d8f4c0b703120ed98f06297724dc1522df6019b9)
(`0.26.1` annotated tag object
`0093923d94157d9f1f63a292bb504bb8db401f2a`).
Detailed record: [Tantivy dossier](products/tantivy.md).

## 5. Corpus governance and initial cell

**Facts.** Public accessibility, robots allowance, dataset inclusion, and an
“open data” label do not grant underlying page copyrights. Common Crawl's terms
preserve third-party rights and its public corpus has deletion/freshness/control
properties unsuitable as Curiosity authority. Repository software licenses do
not automatically license every hosted page or user contribution.

**Inference.** Admission must bind source/revision scope, rights and terms
evidence, purpose, ACL, robots/origin policy, retention, takedown, erasure, holds,
and named reviewers. The first cell should be a narrow allowlist of official
Curiosity/OpenCode/MCP and explicitly approved dependency sources. Common Crawl
should remain deferred, including as a seed.

**Unknowns.** Legal/privacy operators, approved live seeds and terms, excerpt and
retention limits, jurisdictional analysis, sensitive/illegal-content response,
takedown SLA, and backup/hold policy.

Primary evidence: [Common Crawl Terms](https://commoncrawl.org/terms-of-use),
[Common Crawl FAQ](https://commoncrawl.org/faq), and
[GitHub Terms](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service).
Detailed record: [Common Crawl dossier](products/common-crawl.md).

## 6. Evaluation and SearXNG transition

**Facts.** SearXNG is federated metasearch, not an owned crawl/corpus/index; it is
AGPL-3.0-or-later third-party software and current live relevance/coverage are
unmeasured here. Standard retrieval metrics require a frozen corpus/query set and
judgments; pooled judgments have explicit unjudged and assessor-bias limits.
ADRs 0051–0052 retain SearXNG now and prohibit runtime fallback after a future
qualified cutover.

**Inference.** Offline rights-cleared, freshness, safety, resilience, and ABI
suites should precede blinded pooled judgments, shadow, canary, and cutover.
SearXNG must not seed corpus acquisition or query selection. Its tagged candidates
may participate in blinded qrels pooling for a frozen independent query set, but
cannot alter corpus membership, acquisition, or serving indexes. Runtime fallback
must be distinguished from a bounded operator-controlled rollback to a
prequalified whole deployment; credentials/config/executable removal follows
closure of that window.

**Unknowns.** Judgment owners, query set, pooling depth, relevance/latency/cost
thresholds, shadow/canary cohort and duration, rollback criteria/window, legal
review, and production cutover/removal authority.

Primary evidence: [SearXNG repository/license](https://github.com/searxng/searxng),
[TREC pooling overview](https://trec.nist.gov/data/qrels_eng/), and
[BEIR](https://arxiv.org/abs/2104.08663). Detailed records:
[SearXNG dossier](products/searxng.md), [benchmark inventory](README.md), and
[cross-product synthesis](cross-product-web-search-synthesis-2026-08-17.md).

## Program conclusion

The six tracks support the narrow program selected by
[ADR 0052](../decisions/0052-next-retrieval-source-and-owned-web-specification-program.md).
They do not establish production thresholds or authorize a crawl. Contradictions
are retained rather than averaged: PostgreSQL is the researched scale-oriented
control-plane recommendation while SQLite is the selected initial local profile;
Tantivy patterns are useful while dependency adoption remains unapproved; and
SearXNG remains operational although it is rejected as the target foundation.
