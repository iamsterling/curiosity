# ADR 0059: Controlled phase-core concurrency evidence

**Status:** Accepted 2026-08-20 as documentation authority for a replacement
schema-v3 SDK-v2 candidate only; this decision does not implement or execute a
fixture and does not approve or qualify any candidate

## Context

Numbering was checked against `docs/decisions/`: ADR 0058 is the highest
numbered runtime decision, so 0059 is the next available number.

The SDK v2 observation addon currently exercises widths 1, 2, 8, and 32 in Bun.
Those executions can prove request-local counter and parity-result isolation
while requests are concurrently visible to the host. They cannot prove that Bun
scheduled entry, worker, and completion callbacks in a prescribed interleaving.
Profile completion and lifecycle counts cannot close that evidence gap either.

The source scanner also needs a narrower evidence statement. The ten counter
mutation AST nodes and their immediate control-flow parents are the mutation
receipt evidence. The nine recorder call sites are a separate inventory with
separate cardinality and digest binding. Scanner transport prefixes are not part
of either normalized digest grammar.

## Decision

Amend the [legacy memory Node-API SDK v2 specification](../specifications/legacy-memory-node-api-sdk-v2.md)
with two independent concurrency verdicts:

1. `concurrencyIsolated` comes only from actual observation-addon executions at
   widths 1, 2, 8, and 32. It proves request-local counter vectors and parity
   suffixes under host-visible concurrency, not barrier scheduling.
2. `controlledPhaseCoreInterleaving` comes only from a standalone native
   Phase-C fixture at the same widths. The fixture barrier-controls the
   prescribed entry/worker/completion permutations and proves the shared phase
   and counter core under those schedules, not Bun's natural schedule.

The fixture is not a Node-API addon, JavaScript module, SDK profile, or one of
the five qualification artifacts. It compiles the exact shared phase/counter
core used by the real entry, worker, and completion callback call sites; a copy,
facade with duplicated transitions, or test-only reimplementation fails.

The exact three production phase functions require a controller parameter. Real
addon callbacks pass a zero-sized, zero-state no-op controller; the fixture
passes its harness-owned synchronization controller to those same functions.
A fixture-only facade or copied transition fails. The explicit fixture
controller is the sole exception to the no-shared-state rule, owns
synchronization state and transcript events only, and owns or receives no
request counters, parity bytes, results, or settlement state. Static,
thread-local, per-environment, filesystem, network, environment-variable, and
JavaScript coordination are forbidden. After all fixture work completes, the
controller closes and emits exactly one closed transcript to standard output;
partial or streaming transcripts are not evidence.

Phase A may compile and statically inspect the fixture but may not execute it.
The schema-v3 candidate and approval bind the shared phase-core source, the AST
digest inventory for the three real callback-to-core call sites, and fixture
source, build recipe, artifact, and transcript-schema digests. Phase C alone
executes the fixture and records `controlledPhaseCoreInterleaving`; the verdict
may never be inferred from profile, child, Promise, or lifecycle counts.

The scanner's canonical mutation receipt has exactly ten rows derived from the
actual field-mutation AST nodes and their immediate control-flow parents. Its
canonical recorder inventory has exactly nine separately digested rows and
enforces the expected symbols and cardinalities. Canonical digest rows omit the
scanner-output routing prefixes; raw scanner output remains independently
bound.

## Required gates

Candidate/static tests must fail on a copied core, a missing or extra mutation
or recorder call site, a changed callback-to-core call site, any forbidden
coordination mechanism, controller ownership of counters/results, addon or
Node-API linkage, a sixth profile, or fixture/package/release inclusion. Scanner
tests must distinguish mutation-node evidence from recorder-call-site evidence
and prove the prefix-free digest grammar.

Phase C must run every prescribed permutation at widths 1, 2, 8, and 32, accept
only one schema-valid closed transcript per fixture process after completion,
and independently run the actual observation-addon width matrix. Missing,
duplicate, open, early, malformed, or mismatched transcripts fail. Both
`concurrencyIsolated` and `controlledPhaseCoreInterleaving` must be independently
recorded true before an acceptance receipt can be published.

Packaging-absence tests must prove the fixture source, build recipe, executable,
transcript, controller markers, and digests are absent from package exports,
`files`, assets, `dist`, bundles, provenance, generated OpenCode plugins,
install/release candidates, and every normal runtime path.

## Non-goals and stop conditions

This decision does not implement, compile, load, execute, approve, qualify,
package, compose, install, release, commit, or deploy anything. It grants no
Node-API profile, JavaScript coordination, production scheduler claim, normal
plugin composition, persistence, authority transfer, M2/M6 change, or inference
about Bun callback order.

Stop for another decision if the fixture needs Node-API, an additional artifact
or export, a second shared-state exception, retained counters/results, another
coordination channel, package surface, or production authority.

## References

[Runtime ADR 0058](0058-fifth-node-api-control-flow-observation-artifact.md),
[plugin ADR 0029](../../../plugin/opencode2/docs/decisions/0029-controlled-phase-core-concurrency-companion.md),
[Node-API SDK v2](../specifications/legacy-memory-node-api-sdk-v2.md), and
[runtime ADR 0057](0057-private-node-api-sdk-qualification.md).
