# Plugin-native implementation goal

**Status:** Active — 2026-08-25

## Objective

Implement the project-owned
[plugin-native kernel specification](PLUGIN-NATIVE-SPEC.md) in the independent
custom harness, preserve sealed Effect authority and adapter independence, and
finish with linked raw verification evidence before any commit, push, rebase, or
merge.

## Binary acceptance criteria

- [x] **PNG-01 — ABI v2:** stock plugins use exact manifests and narrow
      contributions; startup validation and catalog identity are deterministic
      and fail closed.
- [x] **PNG-02 — Durable reaction/action spine:** committed events drive
      idempotent bounded reactions and durably allocated generic actions; crash
      boundaries are tested.
- [x] **PNG-03 — Generic chat/provider path:** chat semantics, completion, and
      failure live in the chat plugin; the kernel contains no chat command or
      event literals; provider streaming is interpreted by a generic gateway.
- [x] **PNG-04 — Native policy/context:** versioned agents, system messages,
      bounded durable context, deterministic overflow, provenance, and exact
      prompt snapshot digests are implemented.
- [x] **PNG-05 — Semantic intelligence:** native observations, Ledger, and
      evidence schemas/reducers/projections are durable, replayable, and cannot
      approve or complete by assertion.
- [x] **PNG-06 — Content and read tools:** static skills, authenticated prompt
      commands, read-only tools, and bounded search proposals exist behind typed
      capability gates and taint handling.
- [x] **PNG-07 — Governed execution:** attempt snapshots, physical-call
      accounting, cancellation, generation fencing, gates, and final-sink
      checks protect every enabled provider/tool action.
- [x] **PNG-08 — Workflows and orchestration:** finite native workflows and
      delegation proposals run only through kernel attempts, child ceilings,
      budgets, cancellation, and terminal checks.
- [x] **PNG-09 — Qualification truth:** unavailable or unqualified mutation,
      Git, sandbox, remote, production, publication, deployment, and mobile
      surfaces remain fail closed and accurately reported.
- [x] **PNG-10 — Repository verification:** focused tests, custom-harness
      verification, inventory, status, root verification, and diff checks pass,
      except only independently evidenced pre-existing blockers that cannot be
      changed without violating scope.

## Non-goals during implementation

- Committing, pushing, rebasing, merging, publishing, deploying, or modifying
  `origin/main` before PNG-01 through PNG-10 are evidenced complete.
- Weakening accepted ADRs, tests, capability status, or architecture checks to
  obtain a green result.
- Copying OpenCode2 authority, persistence, prompts, schemas, or host callbacks.
- Claiming sandbox, production, hard-reset durability, live-provider delivery,
  or cross-platform support without its required qualification evidence.

## Required evidence

| Criterion | Required evidence                                                                             | Current evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PNG-01    | Catalog unit tests, architecture checks, public catalog projection, full package verification | `tests/plugin-catalog.test.ts`; `tests/architecture.test.ts`; `tests/authority.test.ts`; `bun run --cwd apps/custom-harness verify` — 24 Bun and 2 Rust tests passed                                                                                                                                                                                                                                                                                                   |
| PNG-02    | Reaction/action unit, idempotency, replay, and crash-boundary tests                           | `tests/action-reaction.test.ts`; package verification — interrupted reaction reclaim and allocated-call delivery uncertainty passed                                                                                                                                                                                                                                                                                                                                    |
| PNG-03    | Kernel literal/import architecture check and provider/chat acceptance tests                   | `tests/architecture.test.ts`; `tests/chat.test.ts`; `kernel/provider-gateway.ts`; package verification — 28 Bun and 2 Rust tests passed                                                                                                                                                                                                                                                                                                                                |
| PNG-04    | Agent/context unit tests and exact provider request capture                                   | `tests/prompt-assembler.test.ts`; `tests/prompt-context.test.ts`; `tests/action-reaction.test.ts`; package verification — 33 Bun and 2 Rust tests passed                                                                                                                                                                                                                                                                                                               |
| PNG-05    | Reducer replay, authority-negative, and projection rebuild tests                              | `tests/intelligence-projections.test.ts`; focused suite — replay equality, unknown-version denial, redaction, and non-authority assertions passed                                                                                                                                                                                                                                                                                                                      |
| PNG-06    | Schema, capability-denial, bounds, taint, and command-path tests                              | `tests/content-tools.test.ts`; package verification — 38 Bun and 2 Rust tests passed; network/search and read-tool actions deny before dispatch                                                                                                                                                                                                                                                                                                                        |
| PNG-07    | Attempt, accounting, cancellation, fencing, gate, stale-receipt, and sink tests               | `tests/attempt-governance.test.ts`; `tests/action-reaction.test.ts`; package verification — 41 Bun and 2 Rust tests passed; exact gate binding, immutable snapshots, explicit `UNKNOWN` usage, restart delivery certainty, generation fencing, stale-receipt quarantine, and concurrent cancellation verified                                                                                                                                                          |
| PNG-08    | Budget, no-progress, child-ceiling, cancellation, and terminal workflow tests                 | `tests/workflow-orchestration.test.ts`; package verification — 45 Bun and 2 Rust tests passed; immutable step records, deterministic no-progress failure, inherited child ceilings, ancestry cancellation, and kernel-only terminal events verified                                                                                                                                                                                                                    |
| PNG-09    | Capability/status guards and negative readiness tests                                         | `tests/qualification-status.test.ts`; `kernel/capability-status.ts`; package verification — 47 Bun and 2 Rust tests passed; candidate-only lifecycle, stable unavailability reasons, disabled supervisor capabilities, and zero-write rejection for deferred command surfaces verified                                                                                                                                                                                 |
| PNG-10    | Raw final command output and scoped diff evidence                                             | `bun run verify` at repository root — inventory (112 test files; 91 required), status (28 capabilities), all 8 Turbo package verifiers, and executable runtime-plugin contract passed; custom harness passed 47 Bun and 2 Rust tests; staged implementation/config diff check passed with immutable qualification captures and Markdown hard-break records excluded; generated Cargo-home artifact removed and staged inventory contains no build/cache/runtime output |

## Progress protocol

Update a criterion only after its implementation phase and required checks
complete. A planning note, source presence, generated report, or model assertion
is not completion evidence.
