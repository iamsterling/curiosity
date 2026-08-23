# Existing retrieval and memory systems: reverse-engineering record

**Date:** 2026-08-18
**Method:** clean-room repository inspection; no runtime state, external service,
or undocumented host behavior was inspected. Facts below cite current source;
inferences and unknowns are labelled.

## Question and boundary

This record maps the existing Curiosity retrieval, capture, Ledger, evidence,
and reasoning-adjacent systems so they can eventually converge on the single
evidence substrate designed in [ADR 0041](../decisions/0041-unified-retrieval-memory-evidence-substrate.md).
It does not authorize that implementation. The runtime constitution keeps the
unified substrate design-only and assigns canonical Ledger ownership to the
plugin (`apps/runtime/AGENTS.md:17-21`). ADR 0041 likewise says that its accepted
design neither modifies Ledger v1 nor authorizes implementation
(`apps/runtime/docs/decisions/0041-unified-retrieval-memory-evidence-substrate.md:300-312`).

## Component and interface map

### 1. Retrieval runtime (`@curiosity/runtime`)

- **Public boundaries.** The package exports general runtime, query-only,
  admin, and owned-snapshot-query entrypoints
  (`apps/runtime/package.json:6-17`). The authoritative query exports are
  `apps/runtime/src/query.ts#createQueryRuntime` and
  `apps/runtime/src/query.ts#queryRuntimeCapabilities`; their option shapes are
  `apps/runtime/src/index.ts#RuntimeOptions` and
  `apps/runtime/src/index.ts#QueryRuntimeOptions`. The compatibility-only
  `query.d.ts` redirects to the query module without duplicating shapes.
- **Query admission and routing.** `createQueryRuntime` requires the exact
  `researcher` role, workspace, operation, and constant-time-equivalent query
  capability before calling `createRuntime.webSearch`
  (`apps/runtime/src/index.ts:315-350`). `createRuntime.webSearch` validates a
  closed request, then routes either to the SearXNG adapter or the native local
  corpus ABI (`apps/runtime/src/index.ts:90-129,186-266`).
- **Repository search.** `createSearxngGatewayAdapter` sends a bounded POST to a
  fixed endpoint and returns `{title,url,content,provenance,trust}` plus bounded
  partial failures (`apps/runtime/src/repository-search.ts:5-49,208-255,260-313`).
  Every result is explicitly `trust: "untrusted-search-result"`; provenance is
  only `['searxng-gateway', ...provider labels]`
  (`apps/runtime/src/repository-search.ts:217-222`). It is a transient candidate,
  not a captured or validated memory record.
- **M2 local corpus authority.** Native `initialize` creates `format.json`,
  content-addressed objects, snapshot records, commits, refs, tombstones, and a
  lexical projection (`apps/runtime/native/src/corpus.rs:350-381`). `import`
  verifies one pinned fixture manifest and exact object bytes, then writes an
  immutable-ish record, commit, and imported ref
  (`apps/runtime/native/src/corpus.rs:438-518`). `activate` rebuilds the
  projection before publishing `refs/visible.json`; withdrawal/deletion writes
  a tombstone and removes visibility/projection
  (`apps/runtime/native/src/corpus.rs:536-613`).
- **M2 retrieval.** `lexical_query` authorizes before reading visibility,
  rejects a tombstoned snapshot, verifies the activation commit, record,
  projection, and object digests, then performs deterministic lexical scoring
  (`apps/runtime/native/src/corpus.rs:689-777`). Its response contains snapshot,
  document/version/source URL, passage, analyzer, and score, but no capture,
  assertion, policy, authorization-snapshot, coverage, or uncertainty envelope.
- **M4/M6 owned capture.** `createOwnedCrawlAdmin` is a separate TypeScript job
  and filesystem path. It has job/event/idempotency records, a fixed synthetic
  HTTPS origin, exact manifest/robots/content checks, a caller safeguard, and
  generated snapshot/citation records (`apps/runtime/src/admin.ts:6-24,106-159,
180-230`). Snapshot documents preserve URL, media type, byte length, SHA-256,
  capture ID, extracted text, and a citation `{captureId,url,sha256}`
  (`apps/runtime/src/admin.ts:199-211`).
- **M6 projection/query.** The owned crawl persists full snapshot JSON and a
  distinct lexical projection (`apps/runtime/src/admin.ts:213-230`).
  `createOwnedSnapshotQuery.search` checks query capability, tombstone,
  snapshot state, analyzer, and projection digest, then returns scored document
  IDs and citations (`apps/runtime/src/owned-query.ts:9-30`). It does not hydrate
  or validate assertions and calls the snapshot `inactive_candidate`.

### 2. Plugin search adapter

- `createSearchDefinitions` exposes `web_search` and its compatibility alias,
  both described as bounded, untrusted evidence candidates
  (`apps/plugin/opencode2/src/features/search/index.ts:36-66`).
- In runtime mode, `createRuntimeSearchExecutor` opens
  `@curiosity/runtime/query`, supplies the repository state/capability and a
  researcher principal, and projects successful results into tool content
  (`apps/plugin/opencode2/src/features/search/runtime-adapter.ts:367-466`).
- This is the implemented cross-package seam. It is query-only: no result from
  this path is committed into EventCapture, Ledger evidence, or the development
  evidence substrate by the adapter itself. Tool hooks retain only bounded
  metadata/digests, not search result bodies (see below).

### 3. Ledger v1: current lifecycle authority

- `Ledger.open` stores schema version 1 and hash-linked event files under
  `.opencode/opencode2-config/ledger/v1/events`, replaying every event and
  rejecting sequence, predecessor, or digest mismatch
  (`apps/plugin/opencode2/src/features/ledger/index.ts:259-326`).
- The event envelope records sequence, aggregate, type, time, actor, data,
  previous digest, and digest (`apps/plugin/opencode2/src/features/ledger/index.ts:84-95`).
  Replay materializes intent, work, claim, evidence, approval, resolution, fact,
  and capture-gap views (`apps/plugin/opencode2/src/features/ledger/index.ts:132-257`).
- Ledger evidence is task-completion evidence, not retrieved knowledge. An
  `EvidenceInput` binds kind, intent/criterion/work/execution, environment/input/
  output digests, status, captured event IDs, observation time, optional expiry,
  and producer (`apps/plugin/opencode2/src/features/ledger/index.ts:56-83`).
  `submitEvidence` requires current criterion revision, non-expired passing
  status, and existing EventCapture IDs before appending
  (`apps/plugin/opencode2/src/features/ledger/index.ts:516-533`).
- Facts preserve statement, provenance, digest, and explicitly **no** authority
  (`apps/plugin/opencode2/src/features/ledger/domain.ts:97,163-175`;
  `apps/plugin/opencode2/src/features/ledger/index.ts:534-544`).
- Context projection injects only bounded, revision-bound Ledger intent/claim/
  evidence metadata. Evidence bodies are locators and digests labelled
  `trusted-metadata`, not trusted content
  (`apps/plugin/opencode2/src/features/ledger/index.ts:331-405`;
  `apps/plugin/opencode2/src/features/hooks/context-projection.ts:151-210`).
- **Current authority limit.** Material transitions such as intent capture,
  activation, reconciliation, and claim release fail with
  `PERSISTENCE_AUTOMATION_UNSUPPORTED`
  (`apps/plugin/opencode2/src/features/ledger/index.ts:407-424,509-515,584-617`).
  The atomic store deliberately refuses leased replacement publication because
  the current filesystem boundary cannot bind publication to the lease
  (`apps/plugin/opencode2/src/platform/persistence/atomic-store.ts:121-139`).

### 4. EventCapture and Loop reasoning-adjacent records

- `EventCapture` stores one envelope per host/tool event under
  `.opencode/opencode2-config/capture/v1/events`, plus sequence gaps. The envelope
  keeps IDs, lineage/correlation fields, source kind, taint, host/plugin versions,
  watermark, and **payload digest**, but not the payload itself
  (`apps/plugin/opencode2/src/features/hooks/event-capture.ts:7-40,48-65,79-130`).
- Tool hooks intentionally replace arguments and results with
  `"not-retained"`; general host events are captured with the `redact`
  disposition, which hashes `null` rather than the raw payload
  (`apps/plugin/opencode2/src/features/hooks/open-code-hooks.ts:81-120`;
  `apps/plugin/opencode2/src/features/hooks/event-capture.ts:66-77`).
- `LoopJournal` preserves execution causation and progress mechanics: claim and
  dispatch digests, deterministic iteration/prompt IDs, budgets, evidence and
  Ledger cursors, terminal event IDs, child IDs, capture watermark, compaction
  references, breaker state, and stop reason
  (`apps/plugin/opencode2/src/features/loop-engine/journal.ts:4-49,73-153`).
- A proposed resolution can carry sanitized `rationale` and evidence IDs
  (`apps/plugin/opencode2/src/features/ledger/index.ts:157-163,558-560`), but this
  is not a transcript or a general reasoning trace. **Finding:** current source
  preserves reasoning _lineage and selected rationale_, not Curiosity's full
  reasoning content. Whether more reasoning content should be retained is a
  policy/product decision, not derivable from this repository.

### 5. Development-only unified-evidence slice

- The plugin contains an internal, uncomposed evidence implementation. Its
  feature registration is a no-op and its exports are explicitly absent from
  the package root ABI (`apps/plugin/opencode2/src/features/evidence/index.ts:1-6`).
  `createDevelopmentHarness` wires only an in-memory transactional authority,
  local HMAC anchor emulator, disposable encrypted filesystem custody, lexical
  projection, query, tombstone, and reconciler
  (`apps/plugin/opencode2/src/features/evidence/development-harness.ts:26-97`).
- The codec already models orthogonal custody, derivation, assertion, query
  eligibility, authorization freshness, and deletion dimensions, plus the nine
  ADR 0041 relationship types and layered identities
  (`apps/plugin/opencode2/src/features/evidence/domain.ts:3-62,79-128,152-235`).
- `SynchronousIngest` implements the test protocol
  `LOCAL_PREPARED -> EXTERNAL_APPENDED -> LOCAL_COMMITTED`, deterministic
  idempotency, separate raw/derived identities and receipts, exact extracted
  spans, and commit-time anchor revalidation
  (`apps/plugin/opencode2/src/features/evidence/ingest.ts:7-59,130-178,180-289`).
- `createQuery` authorizes before projection reads, validates custody and anchor
  evidence during hydration, rechecks revision/eligibility immediately before
  envelope creation, and discloses cursor, projection/auth snapshots, as-of,
  coverage, exclusions, partial state, and failures
  (`apps/plugin/opencode2/src/features/evidence/query.ts:48-67,69-198,200-265,
305-325`). `BlockingReconciler.run` traverses authority, receipts, projection,
  tombstones, anchor restrictions, and seeded dangling references without
  promoting records (`apps/plugin/opencode2/src/features/evidence/reconciliation.ts:6-103`).
- This slice is executable specification evidence, not current product storage:
  its authority is process memory (`apps/plugin/opencode2/src/features/evidence/ingest.ts:61-88`),
  configuration rejects production claims, and its own diagnostic disclaims
  production persistence/continuity/tamper evidence
  (`apps/plugin/opencode2/src/features/evidence/configuration.ts:18-38`).

## Data flows

### Live web-search flow

```text
researcher tool call
  -> plugin createRuntimeSearchExecutor
  -> @curiosity/runtime createQueryRuntime (principal/capability gate)
  -> fixed SearXNG adapter
  -> bounded untrusted result + provider labels/partial failures
  -> plugin JSON tool response
  -> EventCapture tool envelope/digest only
```

There is no implemented edge from the returned candidate to immutable captured
bytes, assertion validation, Ledger evidence, or durable memory.

### M2 local-corpus flow

```text
admin capability -> pinned fixture import -> content-addressed objects
  + snapshot record + import commit/ref
  -> activate -> deterministic lexical projection + visible ref
query capability -> verify visible commit/record/projection/objects
  -> lexical passages with source URL
```

The authority is a separate canonical-file corpus, not Ledger v1.

### M4/M6 owned-snapshot flow

```text
admin capability -> queued foreground crawl job -> fixed synthetic HTTPS cell
  -> manifest/robots/body checks -> extracted snapshot + capture citations
  -> caller safeguard -> snapshot file + lexical projection
query capability + explicit snapshot ID -> tombstone/projection checks
  -> scored document IDs + citations
```

This duplicates M2's storage/query concepts using different files, schemas, and
entrypoints, and remains disconnected from Ledger lifecycle evidence.

### Plugin lifecycle evidence flow

```text
host/tool events -> EventCapture envelopes + gaps
  -> Ledger evidence references event IDs and digests
  -> resolution references evidence IDs
  -> reconciliation (currently fail-closed for material publication)
  -> bounded Ledger metadata projected into model context

claim/dispatch -> LoopJournal -> terminal event/evidence/capture cursors
```

### Development unified-evidence flow

```text
fixture request -> in-memory LOCAL_PREPARED
  -> local HMAC anchor append
  -> encrypted raw + separately encrypted derived object receipts
  -> LOCAL_COMMITTED + exact spans
  -> in-memory lexical projection
  -> authorization/custody/anchor/final-state checks
  -> evidence envelope
```

This is the closest source-level seam to ADR 0041, but it is deliberately not
composed with runtime retrieval or durable Ledger v1.

## Duplications and convergence seams

| Concern             | Existing copies                                                                                                                                                   | Seam / risk                                                                                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lifecycle authority | M2 refs/commits/tombstones; M6 snapshot/job/tombstone files; Ledger v1 events; development `InMemoryTransactionalAuthority`                                       | Canonical Ledger v2 must replace, not synchronize, lifecycle truth. ADR 0024 requires exclusive cutover, never dual-write (`apps/plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md:79-108,482-510`). |
| Capture identity    | M6 URL+digest-derived capture IDs; EventCapture host-event IDs; development layered capture/representation/span IDs                                               | Names share “capture” but represent different things. Migration must not collapse observation events, acquisitions, content, occurrences, or spans.                                                                                |
| Content custody     | M2 plaintext content-addressed objects; M6 snapshot JSON containing extracted text; EventCapture digest-only envelopes; development encrypted raw/derived objects | No common receipt contract exists in product code. M2/M6 custody does not satisfy Ledger v2 encryption/anchor gates.                                                                                                               |
| Lexical projection  | Native M2 `current.json`; M6 projection per snapshot; development in-memory token index                                                                           | All are rebuildable candidates, but their tokenization, snapshot identity, integrity proof, response schemas, and activation rules differ.                                                                                         |
| Authorization       | M2/M6 admin/query hash files; plugin researcher/workspace envelope; fixture principal/purpose policy                                                              | Capability possession is not yet a versioned principal/tenant/purpose authorization snapshot with revocation freshness and final delivery gate.                                                                                    |
| Provenance          | SearXNG provider labels; M2 source URL/version/digest; M6 citation; EventCapture lineage/taint; Ledger producer/event refs; development layered IDs/spans         | A future adapter can map these into candidate fields, but none alone establishes truth or authority.                                                                                                                               |
| Time/freshness      | request deadline; M6 job attempts; EventCapture watermark; Ledger event/observed/expiry times; development capture/as-of/valid-time fields                        | Clocks and semantics are not unified; retrieval responses mostly omit freshness and coverage.                                                                                                                                      |
| Uncertainty         | provider partial failures; Ledger facts with authority `none`; development assertion states/partial response                                                      | Runtime local results expose no assertion confidence/dispute/unknown-coverage semantics. Do not convert rank score into confidence.                                                                                                |
| Reasoning           | EventCapture payload digest; Loop causation/cursors; Ledger resolution rationale                                                                                  | There is no durable, policy-approved reasoning object linked by `decision_based_on`. Raw reasoning retention is intentionally absent, so “preserve reasoning” requires an explicit bounded schema and privacy policy.              |

The lowest-risk architectural seam is the provider-neutral query boundary:
retain runtime adapters as candidate producers, then add an explicit capture and
validation boundary owned by the future exclusive Ledger/custody substrate.
Existing M2/M6 indexes can only become disposable projections after their
authoritative records are migrated and verified; relabelling current files as
Ledger evidence would create a second authority.

## Constraints and open questions

1. **No implementation authority.** Both accepted substrate ADRs are design-only.
   Production persistence remains disabled until all Ledger v2 gates pass
   (`apps/plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md:688-725`).
2. **Current host cannot prove material fencing.** Existing fail-closed
   diagnostics are safety behavior, not a missing call to bypass
   (`apps/plugin/opencode2/docs/architecture/current-state.md:3-7`).
3. **Retrieval boundaries must remain provider-neutral and untrusted.** The
   fixed SearXNG adapter is a source adapter, not an authority; its AGPL service
   relationship and repository license boundaries must remain explicit
   (`apps/runtime/AGENTS.md:8-12`).
4. **Identity migration is unresolved.** Exact canonicalization and mappings for
   M2 document/version, M6 snapshot/capture, EventCapture event, Ledger evidence,
   and development substrate IDs are not defined. Hash equality cannot decide
   source or occurrence identity.
5. **Reasoning scope is unresolved.** Source proves that full tool/host payloads
   and raw reasoning are not retained. Unknown: whether the requirement means
   decision rationale, hypothesis lineage, rejected alternatives, model-hidden
   chain of thought, or all policy-permitted artifacts. The last category must
   not be inferred and may be unavailable by design.
6. **Authority migration is unresolved.** Ledger v1's closed schema cannot host
   capture/authorization/deletion/validation state
   (`apps/plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md:17-37`).
   Exact v1 freeze, mapping, anchor genesis, and one-way cutover remain gated.
7. **Storage and security are unresolved.** SQLite binding/profile, filesystem
   hard-link/sync behavior, production encryption and key custody, continuity
   provider, retention/hold/backup/erasure periods, and named owners remain
   blocking decisions (same ADR, lines 693-725).
8. **Evaluation migration is unresolved.** M2 and M6 have rights-cleared pinned
   fixtures, but no approved cross-system fixture maps retrieval candidates,
   contradictory assertions, decisions, tombstones, and reasoning lineage in a
   single test cell.

## Confidence and negative findings

- **High confidence:** component boundaries, current schemas, filesystem paths,
  APIs, and fail-closed behavior above are directly supported by source.
- **High confidence:** there is no composed production path from web/local search
  results into the development unified-evidence slice; the evidence registration
  is a no-op and search adapters do not import it.
- **High confidence:** full Curiosity reasoning content is not preserved by
  EventCapture or LoopJournal; only digests, lineage/mechanics, selected bounded
  metadata, and optional resolution rationale are represented.
- **Medium confidence inference:** the internal evidence slice is intended as an
  executable design/acceptance scaffold for ADRs 0041/0024. Its names and
  semantics align, but no source comment declares that complete historical
  intent.
- **Unknown:** runtime state may contain records not inspected here. Repository
  policy prohibits committing runtime state, and this review intentionally did
  not inspect external state roots, credentials, services, or user configuration.

## Inspection and verification commands

Repository inspection used `find`, `git status --short`, targeted source reads,
and targeted `rg` searches for `memory`, `retrieval`, `evidence`, `provenance`,
`authority`, `uncertainty`, `capture`, and `reasoning`. The artifact should be
checked with:

```sh
git diff --check -- apps/runtime/docs/research/reverse-engineering-retrieval-memory-systems-2026-08-18.md
git diff -- apps/runtime/docs/research/reverse-engineering-retrieval-memory-systems-2026-08-18.md
git status --short
```

No product behavior changed, so runtime/plugin build and test suites are not
required to establish this documentation-only result.
