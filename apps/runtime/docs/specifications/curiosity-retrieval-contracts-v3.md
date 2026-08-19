# Curiosity Retrieval internal contracts v3

**Status:** reversible development-only specification under ADR 0051. No live
crawl, persistence, public ABI, production serving, or cutover authority.

## Closed request and surfaces

The closed v3 request selects exactly one of three profiles: `OWNED_WEB`,
`OWNED_WEB_MEMORY`, or `OWNED_WEB_MEMORY_MCP`. They contain respectively one,
two, or three unique legs in fixed order. Registered source-neutral references are
`surface:owned-web:v1` (`INDEXED`, capture-anchored snapshot),
`surface:curiosity-memory:v1` (`INDEXED`, lifecycle-checked memory), and
`surface:authorized-mcp:v1` (`LIVE`, host-receipt-only). Unknown fields,
non-ordinary prototypes/symbol keys, credential-shaped references, invalid modes,
unregistered/reordered/duplicate surfaces, and aggregate-bound violations fail
closed. Capability manifests describe mechanics only and convey no authority.
`deadlineUnixMs` has an inclusive maximum horizon of 60,000 milliseconds after
actual orchestration start. `knownAsOf` is semantic context and does not define
the operational deadline. Max+1 fails before timer creation, preventing platform
timer overflow or clamping.

Initial authority runs before every adapter read. Final delivery authority runs
only after every candidate preparation, hydration, lifecycle recheck, and adapter
finalization has settled. It is the final await: bounded composition, closed
decoding, and return are synchronous afterward. Every awaited authority or adapter
port is raced against remaining monotonic time and receives an abort signal.
Denial discloses no source existence or bodies. Exceptions become stable codes
without exception text.

## Results and delivery

Owned M6 results are `custodied-evidence` only when the anti-corruption port
supplies capture, representation, span, and receipt anchors. Memory emits only its
fixture's independently proven evidence/assertion kind. MCP emits only untrusted
`source-observation` records with bounded host-receipt provenance. It cannot become
evidence, belief, or assertion. Strata remain separate by leg and epistemic kind;
there is no global score, confidence, quality, trust scalar, or cross-stratum
ordering.

Every leg reports mode, obligation, measured/unknown coverage, declared owned-cell
scope where available, freshness, bounded failures, and delivered count. Required
failure suppresses all strata; optional failure preserves authorized successful
strata and explicit uncertainty. Deadlines surround awaited ports and stop later
work. The largest deterministic whole-item prefix whose **entire report** fits
aggregate count, UTF-8, and structural-node budgets is returned. Exact bounds are
inclusive; otherwise a minimal typed output-budget envelope is used. Empty means
no eligible result in the disclosed view, never global absence.

## MCP compatibility receipt

The v3 MCP surface is harness-receipt-only. It does not define or accept direct
MCP client provenance, and a direct result MUST NOT be relabeled as a host
receipt. A distinct direct-MCP source-observation surface, closed provenance
decoder, and later retrieval-contract version are required before direct MCP can
be implemented; see [source access v1](retrieval-source-access-v1.md).

The bridge is disabled unless explicitly feature flagged. An intent binds request,
authenticated context, session, agent, message, parent call, canonical input
SHA-256, nonce, and expiry. The receipt identity is a full SHA-256 over canonical
intent/context/nonce and result settlement. The adapter accepts only an opaque
bridge consumer capability and atomically consumes by the expected bindings; the
private receipt value is not a public contract or constructor input. Reuse,
forgery, context mismatch, absence, expiry, and collisions fail closed.
`MODEL_MEDIATED` is always disclosed. Current OpenCode hooks cannot safely
handoff bounded content without unrestricted-result scraping, so no hook wiring or
MCP call exists in this tranche and the adapter reports `MCP_UNSUPPORTED` without
a captured receipt.

## Acquisition kernel and compatibility

The pure reducer models corpus-cell registration; seed/sitemap/feed/link discovery;
robots; frontier/politeness; fetch attempt/settlement; committed capture;
tombstone; and projection manifest. Event replay is idempotent, event-ID payload
collision fails closed, and illegal ordering is rejected. Its exact event decoder
rejects unknown fields/types, symbols, accessors, unsafe prototypes, and stable ID
collisions. Ports are domain-only; there is no network or durable implementation.

Request/report decoding traverses descriptors before byte measurement, so hostile
getters and `toJSON` never execute. Total delivered items are globally bounded,
originating request bounds are applied during delivery decoding, and item IDs are
unique. Provenance surface, capture, receipt, host receipt, and owned projection
anchors must agree. Owned search receives the declared snapshot reference and
reports the validated projection snapshot on both its leg and items.

Every accepted object property is an enumerable own data property. Arrays must
have the ordinary array prototype, an inspected bounded length, and exactly one
enumerable own indexed data property for every index; sparse arrays are rejected
before serialization. Declared, observed, and delivered counts are bounded
nonnegative integers. Thus an owned zero-document projection can report
`MEASURED`/`COMPLETE` with zero results. `no_answer` requires an empty result
array; a contradictory body is never projected and reports
`OWNED_SNAPSHOT_MALFORMED` without source content or exception text.

V1/v2 files and behavior are unchanged. Package exports and current
`web_search`/`formerhuman_search` behavior are unchanged. SearXNG remains in place
until a separate qualification and cutover decision; after a future cutover the
decision is no runtime fallback.
