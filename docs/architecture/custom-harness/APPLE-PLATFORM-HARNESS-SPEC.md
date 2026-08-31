# Apple-platform harness specification

**Status:** Implementation specification; not release, security, distribution,
or platform qualification authority.

**Decision source:**
[`research/harnesses/SYNTHESIS.md`](../../../research/harnesses/SYNTHESIS.md)

**Implementation baseline:** repository commit `4d43cde` plus the uncommitted
Apple-platform synthesis dated 2026-08-30.

## 1. Objective

Curiosity SHALL use one project-owned semantic kernel across iPhone, iPad, and
macOS while keeping lifecycle, provider custody, filesystem access, process
supervision, distribution, and presentation in exact platform hosts.

The first implementation tranche SHALL establish a portable, fail-closed
platform capability profile. It SHALL NOT claim macOS support, add a macOS app
target, widen mobile capabilities, or qualify a desktop effect host.

## 2. Normative invariants

1. Every admitted durable run MUST carry one exact Apple platform profile ID.
2. A run capability ceiling MUST be selected from that profile and MUST NOT be
   inferred from an operating-system name elsewhere in the runtime.
3. Profile capability lists MUST be sorted, unique, immutable, and drawn from a
   closed versioned vocabulary.
4. iPhone, iPad, and sandboxed-macOS profiles MUST NOT admit process, Git,
   general filesystem, external-harness, sandbox-execution, or unattended
   background capabilities.
5. A macOS workstation profile MUST start with the same bounded baseline. It MAY
   add an eligible desktop capability only when the host supplies a distinct
   qualification evidence ID for that capability.
6. Supplying qualification evidence MUST NOT make a capability eligible on a
   profile where it is prohibited.
7. Provider route readiness remains a separate runtime decision. The presence
   of `provider.generate` in a ceiling permits route selection; it does not prove
   that a provider is connected.
8. Tool dispatch MUST intersect the action request with the selected profile's
   capability ceiling. The model, UI, and tool implementation cannot widen it.
9. Unknown profiles, capabilities, malformed evidence IDs, duplicate
   qualifications, and ineligible qualifications MUST fail closed with typed
   errors.
10. The existing native journal catalog digest MUST remain unchanged in this
    tranche. A profile-aware catalog identity requires a separate catalog
    migration because schema v15 pins `active_catalog_digest`.

## 3. Version 1 profiles

| Profile ID          | Runtime family | Baseline capabilities                 | Qualification-eligible capabilities |
| ------------------- | -------------- | ------------------------------------- | ----------------------------------- |
| `iphone`            | `ios`          | `documents.read`, `provider.generate` | none                                |
| `ipad`              | `ios`          | `documents.read`, `provider.generate` | none                                |
| `macos-sandboxed`   | `macos`        | `documents.read`, `provider.generate` | none                                |
| `macos-workstation` | `macos`        | `documents.read`, `provider.generate` | exact desktop set below             |

The workstation qualification-eligible set is:

- `background.unattended`
- `external-harness.invoke`
- `filesystem.mutation`
- `filesystem.read`
- `git.mutation`
- `git.read`
- `process.execution`
- `sandbox.execution`

Eligibility is not qualification. Each capability requires its own reviewed
host implementation, denial path, lifecycle behavior, cancellation behavior,
and raw evidence before its evidence ID may enter the project-owned
`applePlatformQualificationEvidence` registry. Caller-supplied strings that are
not in that registry enable nothing and fail with
`APPLE_PLATFORM_QUALIFICATION_UNAVAILABLE`.

## 4. Portable contract

The platform policy belongs in `@curiosity/authority`. It has no React Native,
Node, Bun, Swift, Rust, or Effect dependency.

```ts
type ApplePlatformProfileId =
  "iphone" | "ipad" | "macos-sandboxed" | "macos-workstation";

interface ApplePlatformQualification {
  readonly capability: ApplePlatformCapability;
  readonly evidenceId: string;
}

interface ApplePlatformCapabilityProfile {
  readonly schemaVersion: 1;
  readonly profileId: ApplePlatformProfileId;
  readonly runtimeFamily: "ios" | "macos";
  readonly capabilityCeiling: readonly ApplePlatformCapability[];
  readonly qualifications: readonly ApplePlatformQualification[];
}
```

`createApplePlatformCapabilityProfile` is the only constructor. It validates
profile identity, qualification eligibility, evidence identity against the
project-owned registry, ordering, and uniqueness before returning a deeply
frozen value. The registry is empty until an exact desktop host capability is
implemented and qualified.

## 5. iOS host selection

The universal iOS application SHALL select exactly one mobile profile before
constructing the durable authority:

```text
React Native reports tablet idiom -> ipad
React Native reports phone idiom  -> iphone
anything else                     -> fail closed
```

The selected profile SHALL be passed to:

- durable run admission, which records `platformProfileId` and the profile
  capability ceiling;
- the native tool kernel, which uses the same ceiling when checking action
  grants; and
- future capability hosts through the same explicit composition boundary.

iPhone and iPad have identical version 1 capabilities. Their separate IDs
preserve truthful durable evidence and allow future resource-budget differences
without changing semantic law.

## 6. Durable run contract

The durable chat workflow version SHALL advance from `1` to `2`. Its input gains
the selected `platformProfileId`:

```ts
interface DurableChatRunInputV2 extends ChatTurnPayload {
  readonly agentId: string;
  readonly kind: "chat.turn";
  readonly platformProfileId: ApplePlatformProfileId;
  readonly schemaVersion: 1;
}
```

The payload schema version remains `1` because the chat payload itself is
unchanged. The workflow contribution version advances because run semantics and
durable input changed.

Admission and relaunch reconciliation MUST use the same configured profile.
Replaying an already-created run remains idempotent by `runId`; the profile does
not create a second run.

Frontier response transport MAY publish bounded transient deltas for the exact
active physical call. The mobile host exposes only the decoded `text` prefix of
an exact `kind: "final"` agent-step envelope, correlates it through physical
call ID and durable run ID, and removes the subscription at step termination.
These deltas are presentation hints: action, question, no-go, foreign-call,
malformed, oversized, and late events cannot become transcript state. The UI
replaces provisional text with the journal-projected terminal assistant message
or removes it on failure.

### 6.1 Bounded mobile delegation

The mobile composition MAY expose `agent.delegate` only to the qualified
`generalist` and `orchestrator` primary roles. The operator may select exactly
those two primary roles; subagent roles remain child-only compatibility
identities.

The version 1 mobile delegation profile is deliberately narrower than the
portable parity ceiling:

- at most two children are admitted by one root run;
- delegation depth is exactly one;
- every child has a fresh context containing its immutable role policy and one
  normalized task contract, not the parent transcript or project memory;
- child authority is fixed to `provider.generate`, with no document, mutation,
  process, network, Git, question, gate, or further-delegation tool;
- lineage, child key, run and execution IDs, role, budget, capability ceiling,
  and initial task state are committed in the parent transition before the
  child becomes runnable;
- terminal child results are projected back to the parent as bounded untrusted
  evidence in allocation order; child stream deltas never enter the parent
  transcript; and
- root cancellation transactionally fences every active descendant and returns
  every dispatched descendant call for physical cancellation.

Mixed child and ordinary tool allocations in one model proposal fail closed.
Unknown/disallowed child roles, malformed task contracts, depth or child-count
excess, and capability widening create no child. The existing mobile catalog
identity remains byte-for-byte unchanged pending the migration in Section 8;
the exact visible `agent.delegate` definition is instead captured in each
durable provider request snapshot.

### 6.2 Exact operator-selected role routes

Every one of the eight role identities has an independent operator-selected
frontier model preference. The preference is non-secret native configuration;
provider credentials remain outside Hermes. Role identity does not encode route
identity: the planner supplies the current role to a separate selection port,
which resolves one exact provider, route, model, adapter, and selection-policy
identity before the physical call is allocated.

There is no implicit default and no “first model” selection. The native provider
actor MUST verify the configured model against its current authenticated
provider catalog both when configuration changes and when a call resolves. A
missing preference, disconnected provider, or stale model fails
`PROVIDER_ROUTE_UNAVAILABLE` and dispatches no alternate model. Changing a
preference affects only a later selection; an allocated call retains its exact
durable route snapshot. The settings surface exposes all eight mappings and the
composer exposes the mapping for the selected primary role.

## 7. macOS boundary

This tranche defines macOS policy data only. It does not create a Mac host.

The selected future host shape is a dedicated `apps/macos` AppKit application
using React Native macOS to execute the same portable TypeScript authority. Its
Xcode project will expose separate `CuriosityMacSandboxed` and
`CuriosityMacWorkstation` targets so workstation-only services are not linked
into the sandboxed product accidentally. Mac Catalyst and “Designed for iPad”
execution are not these profiles.

Implementation is dependency-blocked rather than implied by this selection.
[Expo documents](https://docs.expo.dev/modules/additional-platform-support/)
macOS as experimental out-of-tree support requiring React Native macOS and
explicit per-module AppKit support, and the
[latest stable React Native macOS release](https://github.com/microsoft/react-native-macos/releases/tag/v0.81.8)
observed on 2026-08-30 is `0.81.8`, while
[`apps/mobile/package.json`](../../../apps/mobile/package.json) uses React Native
`0.86.3`. No unsupported runtime-version split will be added only to create a
nominal target.

Before a future `macos-workstation` host supplies any qualification evidence ID,
the implementation MUST provide a focused specification and executable evidence
for:

- signed distribution artifact and update boundary;
- executable identity and minimal launch environment;
- root-anchored, use-time filesystem containment;
- inherited descriptor and credential closure;
- descendant process cancellation and relaunch reconciliation;
- Git backend provenance and mutation rollback;
- external protocol request, receipt, and cancellation identity; and
- sandbox negative tests whenever malicious-code confinement is claimed.

One aggregate `desktop-qualified` flag is prohibited.

## 8. Catalog migration constraint

`mobileAgentCatalogIdentity.profile` currently contributes to the digest passed
to native journal open. Native schema v15 rejects an active digest mismatch.
Changing the profile string from its current iPadOS value would therefore make
existing journals unavailable rather than migrate them.

This tranche MUST leave that catalog identity unchanged. A later migration MUST:

1. define old- and new-digest compatibility rules;
2. preserve historical event catalog digests;
3. fence active attempts before switching the active digest;
4. atomically install the new active digest; and
5. prove relaunch and rollback behavior on a populated physical-device journal.

## 9. Acceptance matrix

| ID      | Binary acceptance check                                                               | Owner                   | Executable evidence                            |
| ------- | ------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------- |
| APF-001 | All four exact IDs construct deterministic, frozen profiles.                          | `@curiosity/authority`  | `apple-platform-capability-profile.test.ts`    |
| APF-002 | Unknown profiles and malformed or duplicate qualification records fail closed.        | `@curiosity/authority`  | `apple-platform-capability-profile.test.ts`    |
| APF-003 | iPhone, iPad, and sandboxed Mac reject every desktop-only qualification.              | `@curiosity/authority`  | `apple-platform-capability-profile.test.ts`    |
| APF-004 | Workstation Mac receives no desktop capability without per-capability evidence.       | `@curiosity/authority`  | `apple-platform-capability-profile.test.ts`    |
| APF-005 | Unregistered workstation evidence fails and enables no desktop capability.            | `@curiosity/authority`  | `apple-platform-capability-profile.test.ts`    |
| APF-006 | iOS idiom selection maps only phone to `iphone` and tablet to `ipad`.                 | mobile composition      | `mobile-platform-profile.test.mjs`             |
| APF-007 | New and reconciled durable runs persist the configured profile and exact ceiling.     | mobile admission        | `durable-agent-admission.test.mjs`             |
| APF-008 | The native read-tool kernel receives the same profile ceiling.                        | mobile composition      | type check plus existing tool-kernel fixture   |
| APF-009 | Portable authority verification remains green.                                        | `@curiosity/authority`  | `bun run verify`                               |
| APF-010 | Mobile type, lint, unit, export, and local-bundle checks remain green.                | mobile composition      | `bun run verify`                               |
| APF-011 | No catalog digest or native journal ABI/schema change occurs.                         | native journal boundary | source diff and native schema fixture          |
| APF-012 | A pending question accepts one eligible-actor answer and resumes its exact run.       | native journal boundary | native Rust question-to-terminal fixture       |
| APF-013 | Wrong-actor, stale, duplicate-conflict, and answer-as-approval attempts fail shut.    | native journal boundary | native Rust control fixtures                   |
| APF-014 | A binding gate binds payload plus actual proposal revision and dispatch receipt.      | native journal boundary | native Rust gate/dispatch fixtures             |
| APF-015 | Gate denial resumes the exact run and can reconcile to typed terminal failure.        | native journal boundary | native Rust denial-to-terminal fixture         |
| APF-016 | Operator question and gate controls call only coarse native operations.               | mobile composition      | mobile control and surface fixtures            |
| APF-017 | An organization view exposes controls only for its included durable run IDs.          | mobile composition      | `agent-activity-scope.test.mjs`                |
| APF-018 | Uncomposed prompt commands reject before durable admission and UI entry is disabled.  | mobile composition      | durable client and workstation command tests   |
| APF-019 | Exact frontier final-text deltas render transiently without creating transcript fact. | mobile composition      | frontier-step, broker, durable-client fixtures |
| APF-020 | Only generalist and orchestrator are operator-selectable primary roles.               | mobile composition      | composer and durable-client fixtures           |
| APF-021 | A bounded delegate proposal atomically commits exact child lineage and fixed ceiling. | shared/mobile kernel    | agent-kernel and mobile-planner fixtures       |
| APF-022 | A child receives fresh task context, no parent transcript, and no tools.              | mobile planner          | `mobile-agent-planner.test.mjs`                |
| APF-023 | Terminal child results reach the parent in allocation order as untrusted evidence.    | mobile planner          | `mobile-agent-planner.test.mjs`                |
| APF-024 | Root cancellation fences active descendants and returns their physical calls.         | native journal boundary | native Rust descendant-cancellation fixture    |
| APF-025 | Every role resolves only its operator-selected live model; absent/stale routes fail.  | native provider routing | route, provider-boundary, and planner fixtures |

### 9.1 D03 / APF-025 qualification record — 2026-08-30

The deterministic Apple-host portion of D03 is qualified in source and fixtures:

- native configuration stores an independent non-secret preference for each of
  the eight closed role IDs and validates every write and resolution against the
  authenticated live catalog;
- the JavaScript boundary accepts only the exact provider, route, model, and
  `apple-operator-role-route-v1` selection-policy tuple;
- planner fixtures prove that role identity is supplied separately from route
  selection, and routing fixtures prove that missing or malformed selections
  dispatch no provider call and never promote Apple to the primary route;
- the provider settings surface exposes all eight role mappings and the composer
  exposes the selected primary role's mapping; and
- repository `bun run verify` passed after an authority-package build and
  web production build. A Release simulator build also installed and launched,
  and manual visual evidence showed the composer model selector.

This does **not** qualify a credential-backed provider call, automated model
selection interaction, physical-device behavior, background behavior, macOS, or
distribution. Those claims remain unavailable. D03's repository-level
`QUALIFIED` status therefore must not be read as Apple live-provider or release
qualification.

### 9.2 Next applicable ESSENTIAL gap

The next Apple-profile ESSENTIAL gap is D01's connected primary conversation
path. Its durable admission, exact route allocation, streaming presentation,
terminal projection, and fail-closed unavailable-route paths are implemented,
but no credential-backed call was available for this qualification run.

The bounded acceptance check is: select one authenticated live model for the
`generalist` role, submit one operator turn, and prove that the prior durable
allocation, physical call, transient deltas, and one terminal assistant
projection all carry the same exact route; then make that selection stale and
prove `PROVIDER_ROUTE_UNAVAILABLE` with zero alternate calls. Until credentialed
evidence exists, the connected branch is truthfully unavailable rather than
passing. Physical-device and lifecycle qualification remain separate H11 work.

## 10. Deferred work

- A signed macOS application target and distribution-profile decision.
- Catalog-digest migration to a neutral Apple catalog identity.
- Durable Apple sidecar jobs.
- Cross-device journal synchronization and conflict authority.
- Desktop process, Git, mutation, external-protocol, and sandbox hosts.
- A React Native macOS release compatible with the repository's React Native
  runtime, followed by explicit AppKit support for every required Expo/native
  module.

These items MUST NOT be described as implemented by the platform profile slice.
