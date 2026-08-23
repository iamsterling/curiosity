# Current plugin state

Status in this document is qualified by capability and scope. The canonical
machine-readable report is [`docs/status/capabilities.json`](../../../../../docs/status/capabilities.json);
it reports source/evidence/decision facts but is not lifecycle authority.

## Composed plugin scope

**Current — package composition on the pinned OpenCode beta-17595 ABI.** One
`Plugin.define` composition root installs plugin-owned agent configuration, one
context hook, tool before/after hooks, one abortable event subscription, and the
structured Ledger/native-loop tool surface. Search definitions are composed;
the private runtime backend is conditional and the external live endpoint state
is unknown. Registration cleanup is reverse-ordered; duplicate project roots
are silently suppressed and receive no-op cleanup.

EventCapture is observation-only. Captured data never becomes lifecycle truth by
being captured, rendered in docs, or listed in the status catalog.

## Ledger authority and disabled writes

**Current — lifecycle authority doctrine and bounded Ledger v1 implementation.**
Ledger is the sole lifecycle authority. Native Loop Engine owns only execution
causation, deterministic prompt metadata, budgets, interruption requests, and
ambiguity stops; it does not own objectives, criteria, evidence truth,
dependency truth, completion, or archive authority.

**Deferred / disabled — authoritative material transitions without proven
fencing.** The exact host/filesystem boundary cannot atomically bind the current
token and epoch to publication. Activation, material claims, reconcile, archive,
and Loop continuation therefore reject with stable diagnostics. Observation
capture may publish only within its non-authoritative scope.

`src/platform/real-host/index.ts#capabilityReport` is the mechanical source used
by doctor, product gates, and tests. It reports reload, interrupt, compaction,
child lineage, concurrent setup/writer election, and authoritative persistence
as disabled. Unknown host versions disable every capability with the stable
version-mismatch code.

## Search and private runtime scope

**Experimental — conditional search delivery.** `web_search` and the deprecated
`formerhuman_search` alias return bounded untrusted evidence candidates. Local
tests cover the fixed adapter contracts; they do not prove an external endpoint,
deployment, or production availability.

The `@curiosity/runtime/query` adapter is an optional private profile, requires
explicit controlled plugin identity and query authority, exposes no admin
surface, and never falls back. Its Darwin arm64 release evidence does not make
the private runtime a normal plugin dependency or public package surface.

## Internal scaffolding

**Experimental — implemented but uncomposed.** Engineering-intent profiles,
controller/admission/observation modules, development evidence custody/query/
reconciliation, orchestration contracts, handoff compilation, external-record
contracts, and local-effect boundaries have focused tests but no production
composition authority. The `/bug`, `/feature`, and `/secure` markdown assets are
ordinary model prompts, not trusted command callbacks. No `engineering_*` tool
is registered and production GitHub/consequential local writes remain disabled.

## Deferred and retired

**Deferred:** trusted command-origin callbacks, confidential secure pursuit,
durable engineering replay/publication, unified retrieval/Ledger evidence
implementation, production/public crawling, public runtime/package delivery,
and every broader platform or deployment claim.

**Retired (not Deferred):** the imported loop runtime, mutable state authority,
daemon/scheduler, state tool, marker protocol, and `opencode-loop-local` agent are
absent and protected by characterization/security tests. `/loop-*` names remain
only as thin native migration aliases or stable unsupported diagnostics.

ADR 0031 establishes registry readiness through local pack and isolated loopback
registry proof only. Actual publication, external registry state, global
installation cutover, and deployment remain unknown and unauthorized.

The [2026-08-12 foundation preflight](preflight-2026-08-12.md) is an immutable
historical snapshot preserved at its baseline bytes; it is not current authority.
