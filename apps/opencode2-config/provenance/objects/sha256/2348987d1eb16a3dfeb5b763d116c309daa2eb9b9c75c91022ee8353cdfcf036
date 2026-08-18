# Handoff compiler — current proposal boundary

## Current

This Stage-2 skill compiles already-made decisions into a provider-neutral planning proposal. It is a pure validation library with no persistence or execution integration. Generated contracts are proposals; loop lifecycle and evidence authority remain external.

Invoke `/compile-handoff <task-or-reference>` after the caller supplies the decision input. The command returns a proposal or stable diagnostics only.

## Schema

The compiler input is exactly `{ decisions, authority, contract }`. `authority`
is trusted out-of-band input with only policy status, parallel permission, and
digest-bound context revalidations. The proposed contract cannot grant those
permissions.

`handoff-contract/v1` is closed and bounded. Applicable contract fields are
`schemaVersion`, `contractId`, `revision`, `taskClass`, `objective`, `invariant`,
`scope`, `nonGoals`, `assumptions`, `units`, `dependencies`, `contexts`,
`criteria`, `retry`, `toolLimits`, `parallelGroups`, `handback`, and the fixed
`completionAuthority: "external-loop-evidence"` marker.

A unit is either mutation work with exact repository-relative POSIX
`writableArtifacts`, or read-only work with `readOnlyLocators`. Paths reject
normalization aliases, traversal, absolute forms, backslashes, duplicates, and
ancestor overlap. The single dependency graph has unique IDs and edges, valid
unit references and statuses, and no self-edge or cycle. Parallel groups need
out-of-band permission and cannot contain an internal dependency.

Context references have closed source, provenance, trust, freshness, and
treatment enums plus bounded locators and content. Stale summaries require a
matching context ID and SHA-256 digest in out-of-band authority. Criteria have a
structured observable, closed oracle, and task-appropriate evidence; behavioral
work requires explicit ordered red and green methods. Retry fields are closed by
failure class. Tool limits contain only positive numeric bounds and closed
capabilities. Handback contains report-field requirements only, conditionally
including criterion evidence when criteria exist.

## Diagnostics

`HANDOFF_SCHEMA_VERSION_UNSUPPORTED`, `HANDOFF_SHAPE_INVALID`,
`HANDOFF_BLOCKING_AMBIGUITY`, `HANDOFF_OWNERSHIP_CONFLICT`,
`HANDOFF_DEPENDENCY_MISSING`, `HANDOFF_DEPENDENCY_CYCLE`,
`HANDOFF_PARALLEL_UNAUTHORIZED`, `HANDOFF_CONTEXT_INVALID`,
`HANDOFF_CONTEXT_STALE`, `HANDOFF_CRITERION_UNVERIFIABLE`,
`HANDOFF_EVIDENCE_KIND_MISMATCH`, `HANDOFF_COMPLETION_AUTHORITY_VIOLATION`, and
`HANDOFF_POLICY_DENIED` carry a separate exact `path`.

## Examples

Fixtures A–H cover a small documentation/configuration correction, a behavioral
bug, externally authorized mixed units, sequential research then integration,
blocking ambiguity, read-only adversarial review, invalid diagnostic families,
and canonical equivalence/difference. A blocked result contains questions and no
contract. A denied policy or invalid proposal contains diagnostics and no
contract. A valid proposal includes canonical contract JSON and its SHA-256
digest.

## Non-goals

The compiler is not an orchestrator, scheduler, lifecycle owner, semantic judge, or workflow framework. It does not set provider/model values, infer policy, or grant completion.

## Stage-3 seam

An external integration may pass its decisions to `compileHandoff(input)` and consume the immutable proposal and diagnostics. It remains responsible for execution, evidence collection, lifecycle updates, and any repository policy enforcement.
