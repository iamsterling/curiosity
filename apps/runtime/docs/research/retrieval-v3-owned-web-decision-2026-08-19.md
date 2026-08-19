# Retrieval v3 owned-web architecture decision evidence

**Scope:** source-backed decision record; no crawl or production qualification.

## Facts

- RFC 9309 standardizes robots exclusion parsing and matching, while also stating
  that robots rules are not access authorization ([RFC 9309 §§1,2.2.2,2.3](https://www.rfc-editor.org/rfc/rfc9309)).
- Sitemap XML declares URLs and optional metadata; a sitemap is a discovery hint,
  not evidence that a URL is authorized, live, or captured
  ([Sitemaps protocol](https://www.sitemaps.org/protocol.html)).
- Atom represents feeds and entries with stable identifiers and links
  ([RFC 4287 §§4.1.1,4.1.2](https://www.rfc-editor.org/rfc/rfc4287)).
- The repository M6 query reads one explicitly selected inactive snapshot,
  verifies its projection digest, returns capture citations, and honors M6
  tombstones (`src/owned-query.ts`). M6's accepted fixture remains repository-only
  and blocks production/public crawl (`docs/decisions/0036-m6-owned-synthetic-cell-d7.md`,
  `docs/decisions/0038-m6-verification-and-repository-go.md`).

## Inferences and decision

- **Inference:** discovery, policy, attempts, custody, and serving projection need
  separate identities and transitions; neither a discovered link nor successful
  response is evidence until a capture receipt commits.
- **Decision:** v3 uses a faithful anti-corruption port over M6 snapshot semantics
  rather than importing filesystem/query implementation into the retrieval domain.
  It emits only capture-anchored evidence references and bounded declared snapshot
  coverage. The query request is bound to its configured snapshot and successful
  evidence repeats the validated projection snapshot in leg and item provenance.
  Acquisition is a pure event reducer with no network or persistence.
- **Decision:** the first future qualification cell is official Curiosity,
  OpenCode, MCP, and explicitly approved dependency technical sources. Rights,
  robots, origin policy, and seed approval remain independent gates.
- **Decision:** qualification may support a later SearXNG replacement proposal,
  never a hidden dual path or runtime fallback. No cutover is authorized here.
