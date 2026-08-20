# ADR 0058: Fifth Node-API control-flow observation artifact

**Status:** Accepted 2026-08-20 as documentation authority for one new v2
candidate and qualification only; no artifact is approved or qualified by this
decision

## Context

Numbering was checked against `docs/decisions/`: ADR 0057 is the highest
numbered runtime decision, so 0058 is the next available number. ADR 0057 and
the Node-API SDK v1 contract require four hash-distinct artifacts but require
their qualification-information schema to be identical. That makes transport
results observable, but does not independently prove the per-request control
flow or the single-attempt deferred-settlement boundary.

The existing v1 approval is immutable historical evidence for its exact
candidate. It is insufficient for the design in this decision and must not be
edited, extended, or treated as approval of a fifth artifact.

## Decision

Adopt [legacy memory Node-API SDK v2](../specifications/legacy-memory-node-api-sdk-v2.md)
as the complete contract for a replacement candidate. This decision narrowly
supersedes ADR 0057 only where ADR 0057 requires exactly four artifacts and the
same qualification-information schema for every artifact. All other ADR 0057
dependency, platform, host, protocol, export, ABI/import, confinement,
packaging, authority, and prohibition requirements remain in force.

V2 adds one hash-distinct artifact selected only by
`sdk_probe="control_flow_observation"`. It retains exactly the two exports but
has distinct qualification-information bytes and returns a two-line
`header-json LF exact-parity-bytes` execute envelope. Its counters are owned by
one request and are exactly `inputCopyOperations`, `inputBytesCopied`,
`asyncWorkCreateAttempts`, `asyncWorkCreateSuccesses`,
`asyncWorkQueueAttempts`, `asyncWorkQueueSuccesses`, `workerCallbackEntries`,
`dispatcherInvocations`, `completionCallbackEntries`, and
`settlementAttempts`. `inputBytesCopied` is bounded from zero through 1,048,576;
the other nine are zero or one. No process-global or per-environment counter is
permitted.

Every build profile must route Promise settlement through one private
`DeferredSettlement` state machine. Its only transition is
`Unattempted -> Attempted`, performed as settlement-adapter admission before
observation-envelope construction. `settlementAttempts` counts only that claim;
it does not prove a raw call or host outcome. Resolve/reject failure or panic
cannot reopen the gate and cannot be retried. Direct raw deferred settlement
outside that adapter is prohibited. Fake-adapter and static tests prove at most
one raw invocation, including failure and panic paths, for all five profiles.
Phase A binds fake-adapter source/vector digests and statically proves the sole
raw settlement invocation site is inside the adapter; it does not execute those
tests. Phase C alone executes them, and Promise observation proves the
host-visible outcome.

Static review is closed by two private qualification tools: a separately pinned
`syn` AST scanner that cannot change the five artifact dependency graph, and a
Darwin Node-API guard-page fixture compiled and inspected in Phase A but loaded
only in Phase C. Production and fake settlement compile the same injectable
core. Scanner source/closure/normalization/output and guard
source/toolchain/recipe/import/export/artifact digests are approval material.

The observation artifact may be loaded only in isolated Bun qualification child
processes. It is forbidden from the OpenCode probe, generated test plugin,
plugin package, normal plugin composition, install/release inputs, and every
normal execution path. Its envelope is deliberately not the v1 execute result;
it cannot establish or be cited as normal-artifact binary equivalence.

Qualification requires five canonical schema-v3 per-profile receipts and an
immutable approval-bound candidate aggregate binding all five artifacts, their
qualification and execute schemas, counter-source and increment-site digests,
exclusive cfg, compiler/linker/environment/import receipts, pairwise hash
inequality, and normal-artifact string absence. Phase C emits a separate
acceptance receipt that references candidate and approval digests and records
clean reproduction and executable gates; it is not byte-equal to the candidate
aggregate. Rebuilt artifacts and per-profile receipts must match approval.
Phase C runs all executable gates before atomically publishing that successful
receipt as its final action. Any failure leaves the successful receipt absent;
temporary diagnostics outside committed evidence are permitted but cannot use
the successful receipt path or kind.

## Approval and acceptance

The exact new approval path is:

```text
apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v2.json
```

Qualification has two executable phases separated by a non-executable approval
handoff:

1. **Phase A — candidate generation:** clean, static-only generation of all
   five artifacts and schema-v3 receipts. It may compile and inspect but may not
   load, execute, invoke OpenCode, write an approval record, or claim qualified.
2. **Approval handoff:** after the complete v2 candidate and receipts are
   committed and their exact digests are presented, a new explicit root-user
   statement may authorize clean acceptance. A distinct, single-path,
   approval-only commit adds only the v2 approval path; its parent must already
   contain the candidate. No prior statement or v1 approval carries forward.
3. **Phase C — clean acceptance:** a new clean target reproduces approved
   artifacts and per-profile receipts before any load, runs the complete v2
   executable gates, and only after every verdict is known and true atomically
   writes the distinct successful acceptance receipt. Failure writes no
   successful receipt. History or approved-byte mismatch requires a new
   candidate, statement, and approval-only commit.

Acceptance is binary: every v2 gate passes, five artifact hashes are pairwise
unequal, settlement attempts remain at most one under all injected outcomes,
observation counters satisfy their exact path invariants without cross-request
leakage, the observation strings are absent from the normal artifact, and all
inherited v1 regression, confinement, packaging-absence, and authority reports
remain unchanged.

## Non-goals and stop conditions

This decision does not load, approve, qualify, package, compose, install,
release, or deploy an addon. It grants no persistence, shadow influence,
authority transfer, migration, M2/M6 change, public SDK, normal plugin
composition, broad Node support, or production claim. The existing sole
OpenCode probe continues to load only the normal artifact.

Stop for another decision on any new export, dependency, protocol/parity byte or
diagnostic change, non-request-scoped observation, observation use outside its
isolated Bun children, new import/dylib/platform/host, retained JavaScript state,
write/network capability, package surface, or authority change.

## References

[Runtime ADR 0057](0057-private-node-api-sdk-qualification.md),
[plugin ADR 0028](../../../plugin/opencode2/docs/decisions/0028-fifth-node-api-control-flow-observation-companion.md),
[Node-API SDK v2](../specifications/legacy-memory-node-api-sdk-v2.md), and
[plugin ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md).
