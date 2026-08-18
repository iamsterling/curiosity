# Stage-2 strict boundary design

## Trust model

`decisions` is orchestrator-authored semantic input. `authority` is supplied by
the trusted caller and contains only policy status, parallel permission, and
context revalidation references. `contract` is an untrusted proposal. Provider
and model overlays are applied outside this compiler; they are not contract,
tool-limit, policy, or authority fields.

The decoder validates a value before traversing it, rejects unknown keys at
every object, and has no v1 extension points. It accumulates stable diagnostics
without using free-text keyword scans as a security boundary.

## Contract

V1 uses `schemaVersion`, `contractId`, positive `revision`, a closed task class,
objective and invariant, optional set-like scope/non-goals/assumptions, units,
one dependency list, contexts, criteria, optional retry/tool limits/parallel
groups, conditional handback, and the fixed external-completion marker.

Mutation units own exact repository-relative POSIX paths. Read-only units carry
explicit locators, never owned artifacts. Dependencies alone define ordering.
Parallel groups are descriptive proposals authorized only by
`authority.parallelAuthorized`.

## Canonical form

Object keys are lexically sorted. The following arrays are set-like and sorted
by their stable value or ID: scope, non-goals, assumptions, units, writable
artifacts, read-only locators, forbidden surfaces, dependencies, contexts,
criteria, parallel groups and their unit IDs, capabilities, evidence references,
retry fact/instruction lists, and authority revalidations. Context `quote` text
and criterion evidence `methods` are semantically ordered and retain order.
Empty optional fields are omitted only where their schema explicitly permits
absence. Required empty collections are rejected, not omitted. SHA-256 is over
the canonical contract JSON only.

## Result and authority

The only statuses are `proposal`, `blocked`, and `denied`. Invalid proposals are
denied with shape/semantic diagnostics; policy denial adds the dedicated policy
diagnostic. A proposal includes contract, canonical JSON, digest, and diagnostics.
The handback schema requests report fields. Its status is worker report state,
not approval, completion, or lifecycle authority.
