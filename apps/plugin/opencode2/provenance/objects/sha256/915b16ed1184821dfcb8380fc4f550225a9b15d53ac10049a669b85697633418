# Stage-2 corrective acceptance contract

The compiler is a pure trust boundary for already-made decisions. Its input is
exactly `{ decisions, authority, contract }`: semantic decisions, a trusted
out-of-band mechanical-authority envelope, and proposed
`handoff-contract/v1` content. No contract field can grant authority.

Binary acceptance checks:

- Every JSON-shaped input returns a result and never an incidental exception.
- Unknown versions return only `HANDOFF_SCHEMA_VERSION_UNSUPPORTED`; malformed
  v1 values return stable diagnostics with paths.
- Every object is closed and every string, collection, integer, enum, ID, path,
  context, criterion, limit, retry, and handback value is bounded.
- Writable paths are exact repository-relative POSIX paths: drive-prefixed,
  authority/scheme, absolute, backslash, alias, traversal, equality, and
  ancestor/descendant forms fail.
- `dependencies` is the only graph; IDs and pairs are unique, references exist,
  self-edges and cycles fail, and parallel groups require external authority and
  contain no unmet or writable-path dependency.
- Stale summaries require a matching out-of-band revalidation reference.
- Every proposal has at least one verifiable criterion. Behavioral criteria carry
  non-empty, normalized, distinct red and green evidence; other task classes use
  class-appropriate oracles or a structured rationale. Review contracts are
  read-only and accept only goal, criterion, artifact, and invariant context.
- Retry semantics are closed by failure class; unchanged replay is available
  only for transport/provider failures.
- Policy denial returns `denied` with `HANDOFF_POLICY_DENIED` and no contract.
  Blocking ambiguity returns `blocked`, at least one bounded question, and no
  implementation/mutation proposal.
- Valid proposals require immutable
  `completionAuthority: "external-loop-evidence"`; worker status is report data
  and grants no lifecycle authority.
- Canonical JSON sorts field keys and set-like arrays while preserving ordered
  arrays. Equivalent set/key order has the same SHA-256 digest; ordered changes
  do not.
- Fixtures A–H, reviewer probes, bounded mutations, self-checks, full verify,
  clean-clone verify, integrity checks, scope diff, and remote CI pass.

Non-goals: execution, worker/provider/model selection, routing, scheduling,
state or lifecycle mutation, persistence, policy inference, semantic judgment,
OpenSpec mutation, completion decisions, installer activation, and release.
