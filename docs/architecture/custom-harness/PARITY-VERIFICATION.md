# OpenCode2 Behavioral Parity Verification

Date: 2026-08-27  
Profile: trusted-local-single-user, Darwin arm64, repository/development  
Governing specification: `OPENCODE2-BEHAVIORAL-PARITY-SPEC.md`  
Qualification ledger: `PARITY-QUALIFICATION.json`

## Verdict: PASS

`PAR-AC01` through `PAR-AC30` pass for the bounded native behavioral-parity
scope. All 32 dependency rows have the disposition and terminal status recorded
in the governing specification. This is not a production, publication,
deployment, sandbox, broad Git-mutation, remote-access, or stochastic-output
qualification.

## Observed verification

- `git diff --check`: exit 0.
- `bun run check-types`: exit 0.
- `bun run lint`: exit 0, including Go formatting/module verification/vet,
  Rust formatting/clippy with warnings denied, and architecture verification.
- `bun run build`: exit 0 for the Rust supervisor, Go Bubble Tea client, and
  TypeScript package.
- `bun run test`: exit 0 with 169 Bun tests, 3 Rust tests, and both Go packages
  passing.
- Repository `bun run verify`: exit 0 with all eight Turbo verification tasks
  successful and the executable runtime-plugin contract passing.
- Post-build Node reader smoke: a schema-v15 thread projected through
  `dist/thread-projections-node.js`; outer event schema 99 failed closed with
  `THREAD_PROJECTION_UNAVAILABLE`.
- `apps/custom-harness/tests/child-restart-boundaries.test.ts` killed the worker
  with `SIGKILL` while each of the six required SQLite transaction callbacks was
  open, asserted rollback, and recovered without duplicate physical child calls
  or result delivery.
- Darwin distribution tests proved receipt-before-selection ordering,
  receipt-bound rollback, failure-before-cutover behavior, and retained-binary
  startup. The installer fsyncs selected files, receipts, and complete directory
  chains before atomic launcher replacement.

## Independent review

Independent review session `ses_fbc89e2e3ffet7YmL4BA67z5u8` performed repeated
read-only adversarial passes over the implementation and evidence. After
remediation and exact-tree rechecks, its final result was:

> No open P0/P1/P2 findings.

The final pass specifically rechecked canonical event lineage and hash binding,
legacy migration, root-scoped failure handling, workflow cancellation,
transaction-boundary restart recovery, active-turn native cancellation,
outer-schema reader rejection, and crash-durable receipt-bound rollback.

## Host and authority disposition

The accepted source-host pin remains `0.0.0-beta-17595`; the current source pin
is `0.0.0-beta-18138`. The resolved disposition is
`SOURCE_HOST_RETIRED_NATIVE_INDEPENDENT`: the native harness imports neither
OpenCode host package and passed the isolated host-free build/start check.

All provider output, tool output, imported observations, and projection views
remain non-authoritative. Only authenticated commands and kernel reconciliation
change canonical state.
