# ADR 0048: retrieval migration, topology, and qualification

**Status:** Proposed recommendation — 2026-08-18; design only, not
implementation, production-persistence, or irreversible-migration authority

## Context

M2 and M6 maintain separate local corpus/snapshot authorities; Ledger v1 owns the
current plugin lifecycle; EventCapture stores host/tool envelope digests; and the
uncomposed evidence slice is development-only. Relabelling or dual-writing these
stores would create conflicting truth. Canonical migration rules belong to
[plugin ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md),
which selects an exclusive one-way Ledger v2 cutover but leaves exact mappings
and production gates unresolved.

This delivery decision closes the recommendation set formed by the
[context map](0043-curiosity-retrieval-bounded-contexts-and-contracts.md),
[source modes](0044-source-surfaces-connectors-and-retrieval-modes.md),
[epistemic records](0045-epistemic-records-and-bitemporal-memory.md),
[security](0046-retrieval-authority-security-and-mcp-boundary.md), and
[investigation semantics](0047-investigation-ranking-and-stopping-semantics.md).

## Decision

Ledger v2 is the exclusive future lifecycle authority, exactly as ADR 0024
requires. This runtime ADR does not duplicate or weaken that decision. There is
no dual-write, shadow authority, v1 fallback, filesystem discovery, reverse
transition, or read-repair promotion. Before the irreversible barrier, all work
uses disposable candidate roots and leaves current authority unchanged. After
the barrier, uncertainty fails closed and never resumes v1.

Migration uses explicit typed adapters:

- **M2:** map document/version/source URL, immutable objects, snapshot commits,
  visibility, projection records, and tombstones to proposed source/revision/
  content/occurrence/capture/representation/projection/tombstone records. Existing
  hash or visibility state is evidence for mapping, not automatic validation.
- **M6:** map crawl job/event, capture citation, snapshot/document, projection,
  and tombstone records. Its `captureId` becomes a legacy acquisition locator
  until canonical capture identity is proven; extracted snapshot text requires a
  distinct representation receipt.
- **Ledger v1:** verify the full hash-linked closed-schema history and map intent,
  work, claim, evidence, fact, approval, resolution, and gaps without treating
  task evidence or authority-`none` facts as retrieved truth.
- **EventCapture:** preserve event identity, lineage, taint, watermark, and
  payload digest as observation metadata. Do not invent absent payload bytes or
  map a host event to a content capture merely because both say “capture.”
- **Development evidence slice:** use only as executable contract/fixture input;
  its in-memory authority, local anchor emulator, and disposable custody produce
  no production continuity or migration evidence.

Every mapping emits source kind/ID, target kind/ID, mapping-policy version,
input/output digests, preserved namespaced legacy metadata, uncertainty, and
blocking findings. Ambiguous identity, absent bytes, unknown schema, corruption,
or changing input blocks; it never guesses. Two clean reruns must produce equal
canonical inventories and mapping digests before an anchored genesis may be
proposed under ADR 0024.

The selected topology is local-first: one qualified local root, one Ledger v2
database, adjacent qualified encrypted object custody, one serialized writer,
replaceable local projections, and one configured continuity-anchor adapter.
Network filesystems, replicated writers, and server/cluster operation are out of
scope. A **server profile is deferred**, not implied by MCP or connector use; it
requires its own tenancy, network, availability, consistency, and threat-model
ADR.

Deliver the smallest reversible tranche first: documentation and versioned
rights-cleared mapping/contract fixtures plus a read-only deterministic migration
analyzer against copied roots. It may generate reports and disposable candidate
state only. It must not freeze writers, enter `MIGRATING`, append genesis, enable
persistence/serving, or mutate authoritative roots. Any later tranche requires a
separate accepted implementation ADR and qualification evidence.

## Invariants

- Exactly one lifecycle authority exists at every point; candidate roots and
  projections are never authority.
- No migration maps by name or hash alone, invents missing payloads, or promotes
  candidates/facts into active assertions.
- The v1-to-v2 authority barrier is one-way and remains controlled by ADR 0024.
- Local-first does not mean production-qualified or offline-authorized.
- Every tranche is reversible until a separately approved irreversible cutover.

## Implementation boundaries

These are delivery recommendations only. They do not authorize analyzer code,
production persistence, writer freeze, data copying, credential use, external
anchor writes, schema creation, serving, or irreversible migration. Existing M2,
M6, Ledger v1, EventCapture, and development evidence files remain untouched.

## Qualification gates

A later implementation proposal must pass binary gates before cutover:

1. frozen, rights-cleared fixtures cover every source model and ambiguous/absent/
   corrupt/changing cases with stable diagnostics;
2. two clean read-only runs yield identical canonical mappings/inventories;
3. identity non-flattening, bitemporal, uncertainty, extension round-trip, and
   no-promotion tests pass;
4. unauthorized analyzer/retrieval paths perform zero protected reads and final
   delivery race tests pass;
5. crash, fencing, custody, encryption, continuity, tombstone, backup/restore,
   reconciliation, and production policy gates from ADR 0024 pass on every
   supported profile;
6. independent review finds no dual-write, fallback, filesystem authority
   discovery, secret disclosure, or hidden server profile; and
7. named owners separately approve the irreversible freeze/anchor-genesis/
   `MIGRATING`/`V2_LIVE` ceremony and retained rollback evidence.

## Consequences

Legacy data can be accounted for without pretending equivalent schemas or
quietly creating a second authority. Delivery is slower because production
cutover waits for deterministic maps and all Ledger v2 gates; this is the
intended safety tradeoff.

## Rejected alternatives

- **Dual-write or shadow v2:** creates divergent lifecycle truth.
- **Fallback to v1 after migration starts:** crosses the irreversible barrier.
- **Treat M2/M6 files as projections without migration:** loses custody and
  lifecycle provenance.
- **Import EventCapture digests as content:** invents bytes not retained.
- **Promote the development harness:** it has no production authority evidence.
- **Start with a server:** expands tenancy and failure domains before local
  semantics qualify.

## Unresolved owner decisions

- Ledger owner: exact v2 schema, canonical mappings, freeze/genesis ceremony, and
  retained v1 policy.
- Runtime/M2/M6 owners: source identity canonicalization and fixture inventories.
- Security/privacy/legal owners: production custody, keys, anchor, retention,
  holds, erasure, and migration-data handling.
- Operations/product owners: supported local profile, budgets, diagnostics,
  release thresholds, and whether/when to propose a server profile.

## Evidence and references

- The reverse-engineering record identifies all current authority copies and
  convergence risks
  (`apps/runtime/docs/research/reverse-engineering-retrieval-memory-systems-2026-08-18.md:242-295`).
- Plugin ADR 0024 mandates `V1_LIVE -> MIGRATING -> V2_LIVE`, deterministic clean
  reruns, anchored genesis, and no fallback
  (`apps/plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md:482-510`).
- Its production persistence and implementation remain blocked on all gates
  (`apps/plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md:688-725`).
- ADR 0041 selects local synchronous Phase 0–1 and defers server/cluster modes
  (`apps/runtime/docs/decisions/0041-unified-retrieval-memory-evidence-substrate.md:217-233,283-298`).
