# ADR-016: iPadOS local authority profile

**Status:** Accepted — 2026-08-29  
**Decision history:** Proposed in the iPadOS native runtime severance; accepted
when the user directed implementation on 2026-08-29.  
**Authority:** Authorizes N0/N1 client-seam and portable-authority implementation
only. It does not qualify native durability, model providers, tools, physical
device behavior, release, or production use.

## Context

[ADR-001](ADR-001-effect-authority-rust-supervisor.md) requires a Rust child
supervisor from desktop Phase 1 day one. That rule is appropriate for desktop
process, Git, and worktree capabilities, but it makes authority construction
depend on a child process that an iPad product must neither spawn nor emulate.
Keeping the rule unchanged would preserve the Mac dependency or create an
unsafe hidden fallback.

The iPad still needs one owner for command admission, canonical events,
attempts, reactions, workflows, and projections. Removing the supervisor does
not authorize React views, Swift adapters, model output, or tool receipts to
become competing state authorities.

## Decision

Define an explicit `ipados-local` authority profile:

1. One serialized portable TypeScript authority in the app's Hermes runtime is
   the sole application authority. React consumes projections and sends
   commands; it does not own canonical state.
2. Authority construction does not require a supervisor or capability host.
   The profile receives optional, typed generation, journal, retrieval, and
   capability ports with explicit availability receipts.
3. A missing port makes only its dependent operation unavailable under a stable
   code. It does not prevent local session startup and never falls back to a
   Mac, LAN server, loopback server, shell, Git executable, or prompt-based
   imitation.
4. Swift and Rust adapters execute bounded platform primitives and return
   fenced evidence. They do not invent commands, approve gates, select policy,
   retry autonomously, or declare semantic completion.
5. The iPad product selects `LocalCuriosityClient` unconditionally. The HTTP
   client remains an explicit development/compatibility adapter outside the
   production local import closure.
6. The initial journal is in-memory and advertises `ephemeral`; it carries no
   durability authority. N2 must replace it with the separately accepted native
   journal profile before any persistence or recovery claim.

This decision supersedes only ADR-001's mandatory child-supervisor requirement
and package invariant PKG-I01's Effect-specific wording for the `ipados-local`
profile. ADR-001 and the desktop profile remain unchanged. The invariant that
there is exactly one application authority remains in force.

Effect is not required for the first portable closure. It may enter that closure
only after the exact version bundles and executes under Metro/Hermes without
Node polyfills and preserves the golden semantic fixtures.

## Invariants

- **ADR-016-I01:** Exactly one serialized local authority admits every iPad
  command and canonical transition.
- **ADR-016-I02:** Missing native or remote capabilities fail closed and cannot
  trigger a desktop or network fallback.
- **ADR-016-I03:** The production local import closure contains no Node, Bun,
  Next, TUI, supervisor-client, or AI-SDK module.
- **ADR-016-I04:** Platform adapters provide primitives and evidence only; they
  cannot grant authority or complete work by assertion.
- **ADR-016-I05:** Ephemeral storage is labelled ephemeral and cannot satisfy a
  durability, crash-recovery, or release gate.
- **ADR-016-I06:** Unsupported process, shell, Git/worktree, and dynamic-plugin
  capabilities remain unavailable until separately governed typed replacements
  qualify.

## Consequences

The app can cold-start and project local state without a Mac or child process.
Desktop and iPad share portable command bodies, canonical JSON, event identity
inputs, and projections rather than maintaining two product kernels. Provider
and journal work can proceed behind explicit ports.

The first local slice cannot yet generate useful model responses without an
injected generation port and cannot survive process termination. Those are
visible unavailability states, not silent remote dependencies.

## Rejected alternatives

- **Optional Mac fallback:** violates self-containment and makes capability
  meaning dependent on ambient network state.
- **Loopback HTTP around the local authority:** retains accidental transport,
  lifecycle, and security boundaries without adding authority isolation.
- **Swift- or Rust-owned second kernel:** duplicates semantic law before any
  Hermes bottleneck is measured.
- **Supervisor stubs that report success:** fabricate capability and weaken
  fail-closed behavior.

## Binary acceptance checks

- [x] **ADR-016-AC01:** Mobile UI and workspace code depend on
      `CuriosityClient`; no UI module reads a server URL or calls `fetch`.
- [x] **ADR-016-AC02:** The iPad product imports the local client directly and
      has no URL/environment product selector.
- [x] **ADR-016-AC03:** The portable source closure has a checked denylist for
      Node, Bun, Next, TUI, supervisor-client, custom-harness, and AI-SDK imports.
- [x] **ADR-016-AC04:** A no-generation/no-capability-host fixture starts,
      admits the turn, and terminates it with `PROVIDER_ROUTE_UNAVAILABLE`.
- [x] **ADR-016-AC05:** Scripted completion and cancellation fixtures prove
      terminal projections and prove cancellation publishes no assistant success.
- [ ] **ADR-016-AC06:** The golden command/event/projection fixture executes
      unchanged inside Hermes on a physical iPad and matches the Bun oracle.
- [ ] **ADR-016-AC07:** N2 qualifies the native journal before the profile
      advertises durable storage.

## Non-goals

Native SQLite qualification, Foundation Models qualification, optional cloud
authentication, Files integration, lexical runtime publication, process or Git
parity, background execution guarantees, and App Store release.
