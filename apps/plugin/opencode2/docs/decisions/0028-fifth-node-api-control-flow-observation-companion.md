# ADR 0028: Fifth Node-API control-flow observation companion

**Status:** Accepted 2026-08-20 as documentation authority for isolated v2
qualification only; normal plugin authority and the prior approval remain
unchanged

## Context

Numbering was checked against `docs/decisions/`: ADR 0027 is the highest
numbered plugin decision, so 0028 is the next available number. Runtime ADR 0058
adds a fifth observation artifact to close a control-flow evidence gap in the
test-only Node-API qualification.

## Decision

Accept [runtime ADR 0058](../../../../runtime/docs/decisions/0058-fifth-node-api-control-flow-observation-artifact.md)
and the [Node-API SDK v2 specification](../../../../runtime/docs/specifications/legacy-memory-node-api-sdk-v2.md)
as the only plugin-side authority for this addition. ADR 0027 is superseded only
for its four-artifact and same-information-schema assumptions.

The `control_flow_observation` artifact may be loaded only by dedicated,
isolated Bun qualification children. The test shim must reject it in every
normal-artifact path. The lock-resolved OpenCode beta-17595 probe and its
verifier-temp empty-registration plugin must load only the hash-bound normal
artifact; they must never receive the observation path, hash, bytes, profile, or
execute envelope. The artifact is absent from plugin source, package exports,
`files`, assets, `dist`, bundles, provenance, install/release candidates, and
normal Promise/Effect composition.

Plugin acceptance requires the complete runtime v2 gates, the exact ten
per-request counters and concurrency isolation, at-most-one raw settlement
invocation under fake-adapter success/failure/panic and static call-site tests
for every profile, pairwise inequality of five artifact hashes, and binary
absence of every observation marker from the normal artifact.
`settlementAttempts` records only the `DeferredSettlement` claim and adapter
admission before envelope construction; Promise observation records the host
outcome. Observation-envelope results cannot be used to claim normal-artifact
binary equivalence; normal parity remains established only by the normal
artifact against the unchanged independent oracles.

The v1 approval remains immutable and insufficient. A v2 candidate requires a
new root-user statement and a distinct single-path approval-only commit adding
only:

```text
apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v2.json
```

Phase A remains compile/static-inspection only and creates five canonical
per-profile receipts plus the immutable candidate aggregate. Phase B is only the
approval handoff. Only afterward may Phase C reproduce the approval-bound
artifacts/per-profile receipts and execute the fake-adapter and all other runtime
gates. Phase A binds fake-adapter source/vector digests and statically checks the
sole adapter-owned raw settlement invocation site, but executes no fake vector.
Only after every Phase C verdict is known and true may Phase C atomically write
the separate successful acceptance receipt referencing candidate and approval
digests. Failure leaves that receipt absent. Until all Phase C gates pass, status
is `candidate/not-qualified`.

## Preserved prohibitions

ADR 0027's platform, host, dependencies, two-export boundary, confinement,
packaging absence, empty-registration OpenCode exception, Ledger/EventCapture
authority, M2/M6, release, and production prohibitions remain unchanged. This
decision grants no normal plugin composition, persistence, shadow influence,
migration, cutover, SDK distribution, or same-process unload claim.

## References

[Runtime ADR 0058](../../../../runtime/docs/decisions/0058-fifth-node-api-control-flow-observation-artifact.md),
[plugin ADR 0027](0027-private-node-api-sdk-qualification-companion.md),
[runtime ADR 0057](../../../../runtime/docs/decisions/0057-private-node-api-sdk-qualification.md), and
[plugin ADR 0024](0024-durable-ledger-v2-and-capture-authority.md).
