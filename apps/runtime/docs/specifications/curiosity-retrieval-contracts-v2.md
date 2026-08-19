# Curiosity Retrieval internal contracts v2

**Status:** reversible development-only specification under ADR 0050; no
production, persistence, migration, connector, action, or package-ABI authority.
ADRs 0043–0048 remain proposed.

## Request and authority

`curiosity.retrieval/retrieve-information-request/v2` is transport neutral and
closed. It carries a host-owned `authenticatedContextRef`, never credentials or a
caller-invented principal; purpose; bounded question; explicit `validAsOf` and
`knownAsOf`; exactly two bounded legs with surface selector, `LIVE`/`INDEXED` mode,
required/optional obligation, and result quota; and aggregate leg/result/UTF-8/node
budgets plus deadline. Unknown fields, non-own/symbol/prototype keys, invalid modes,
duplicate/missing surfaces, credential-shaped context references, and exceeded
aggregate limits fail closed with `RETRIEVE_INFORMATION_*` diagnostics.

The injected policy port resolves the context reference to a development decision
and authority reference before either adapter can read. The request cannot carry a
grant, token, credential, policy decision, or action capability. A second injected
delivery check runs after memory candidate selection/hydration. Only after that
ALLOW does the memory adapter re-read current custody, assertion, query eligibility,
authorization freshness, validation currency, and deletion/tombstone state and
construct deliverable items. Denial
returns no result bodies and bounded existence-independent diagnostics.

Deadline checks run before and after every awaited authority, leg, hydration hook,
and final-delivery/finalization operation. The injected monotonic clock determines
elapsed budget; wall time supplies actual source observation and final delivery
`asOf` timestamps. Expiry starts no later leg, delivers no item, preserves completed
and not-started leg reports, and stops as `DEADLINE_EXHAUSTED`.

## Results, strata, and stopping

The report discriminates four non-decodable-as-each-other result kinds:

- `source-observation`: bounded untrusted web observation and opaque source-native
  rank labels;
- `custodied-evidence`: committed capture, representation, span, and receipt refs;
- `remembered-belief`: evidence plus immutable belief/evidence-set and validation
  refs (contract vocabulary; not emitted by the development adapter); and
- `active-assertion`: remembered-belief metadata plus an assertion ID and explicit
  `ACTIVE` lifecycle state.

Closed per-kind fields prevent a web observation from decoding as evidence or an
evidence record from decoding as a belief/assertion. Results are grouped into
separate comparable strata by leg and epistemic kind. No global order or universal
score, confidence, quality, or trust scalar exists. Native labels occur only in
the web stratum and are opaque there.

Each leg separately reports mode, obligation, coverage, freshness, bounded failure
codes, observed count, and post-policy `deliveredItems`. SearXNG LIVE coverage is
always measurement `UNKNOWN` and never `COMPLETE`; a web failure requires
`PARTIAL`. Failure always prohibits `COMPLETE`. The development-memory fixture is
`MEASURED`/`COMPLETE`/current only without failures; source/lifecycle failures are
`UNKNOWN`/`PARTIAL`/unknown, while output-only truncation is measured/current but
partial. Unknown scope is never promoted to exhaustive absence. The report discloses partiality, residual uncertainty, and
a closed stopping reason. Diagnostics contain codes and references only—never
credentials, unrestricted metadata, result bodies, or raw chain-of-thought.

Output-budget policy measures the **entire final report**, including envelope,
legs, strata, failures, uncertainty, keys, values, arrays, and items. UTF-8 size is
the exact compact `JSON.stringify` byte length. Structural nodes count every
container and scalar value plus every object key. For each candidate prefix in
declared leg and source-native item order, Curiosity constructs and measures the
complete report, including any truncation failure. It selects the largest whole-
item prefix satisfying result-count, whole-report UTF-8, and whole-report node
limits. No item body is partially serialized. Exact limits are inclusive.

If the ordinary zero-item two-leg report cannot fit, Curiosity emits the minimal
valid `OUTPUT_BUDGET_EXHAUSTED` report with no legs or strata and one fixed
uncertainty. Request minima of 2,048 UTF-8 bytes and 32 structural nodes are a
conservative bound for that closed envelope with maximum allowed identifiers; the
returned report is measured again before decoding. Global report byte/node/result
decoder limits apply independently.

Any failed required leg suppresses all strata and stops with
`REQUIRED_LEG_UNAVAILABLE`. An optional failure preserves safely authorized
successful strata, but remains partial with explicit uncertainty. Projection,
hydration, hook, and final-state exceptions map to stable `MEMORY_*_UNAVAILABLE`
codes without exception text. Composition also catches rejecting web `retrieve`,
memory `prepare`, and memory `finalize` ports—including adapter mismatch throws—and
maps them to `WEB_RETRIEVE_UNAVAILABLE`, `MEMORY_PREPARE_UNAVAILABLE`, or
`MEMORY_FINALIZE_UNAVAILABLE`. Delivery authorization still runs unless deadline
expiry makes another await impermissible.

Report decoding is semantically closed: denial has no legs or strata and requires
the exact diagnostic/stopping/uncertainty tuple; OK reports require the two unique
surface/mode pairs, linked unique strata, surface-compatible epistemic kinds,
matching delivered counts, coherent partiality/stopping, and observations no later
than final `asOf`.

## Adapters and compatibility

`SearxngLiveAdapter` accepts only an explicitly injected SearXNG-shaped transport.
There is no default transport or import of the production HTTPS implementation.
It preserves existing candidate, provider-label, partial-failure, and unknown
coverage semantics as source observations without changing current search code.

`DevelopmentMemoryIndexedAdapter` uses a project-authored fixture port mirroring
the plugin development-evidence semantics. Runtime deliberately does not import
plugin infrastructure: canonical Ledger and custody dependencies point the other
way and direct reuse would make runtime domain policy depend on plugin storage and
harness lifecycle. The fixture contract therefore proves committed evidence,
active assertion metadata, orthogonal eligibility/authorization/validation/
deletion state, hydration, and final tombstone/revocation suppression without
claiming production continuity or custody.

V1 frame/contracts remain intact. V2 can map a v1 discovery candidate only to a
`source-observation`; v1 evidence may map to `custodied-evidence` only when all v2
lifecycle fields are independently supplied by the authorized memory port. No v1
candidate can promote to evidence, belief, or assertion. Package exports, current
`web_search`/`formerhuman_search`, runtime `webSearch`, and production behavior are
unchanged.
