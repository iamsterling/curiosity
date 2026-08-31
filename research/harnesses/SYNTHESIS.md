# Curiosity Apple-platform harness synthesis

> Research synthesis only. This document recommends a direction; it does not
> grant architecture, implementation, capability, release, security, or App
> Store acceptance.

- **Decision date:** 2026-08-30
- **Harness evidence cutoff:** 2026-08-24 UTC
- **Apple-platform implementation point:** repository commit `4d43cde`,
  2026-08-30
- **Platforms:** iPhone, iPad, and macOS
- **Inputs:** the 21 dossiers governed by
  [RESEARCH-CONTRACT.md](RESEARCH-CONTRACT.md),
  [DECISION-FRAME.md](DECISION-FRAME.md), the accepted architecture under
  [`docs/architecture/custom-harness/`](../../docs/architecture/custom-harness/),
  and the current universal iOS product target.
- **Result:** `BUILD_DIRECTLY_SHARED_KERNEL_SEPARATE_HOSTS`.
- **Lifecycle follow-up:**
  [Canonical durable agent lifecycle synthesis](AGENT-LIFECYCLE-SYNTHESIS.md)
  applies this architecture to admission, questions, gates, recovery, context,
  memory, and terminal projection.

## 1. Executive decision

1. **Keep the direct-build decision.** No reviewed harness is suitable as a
   substrate or fork on any of the three platforms without retaining a second
   loop, retry owner, tool dispatcher, writer, approval path, provider path, or
   completion authority.
2. **Share semantic law, not an assumed host.** iPhone, iPad, and Mac should
   consume the same project-owned command semantics, catalog identities,
   reducers, context contracts, journal operations, receipt schemas, and golden
   fixtures. UI, lifecycle, provider custody, file access, process supervision,
   and distribution remain platform-host responsibilities.
3. **Treat iPhone and iPad as one iOS runtime family with different presentation
   and resource budgets.** The current app is an iOS target with tablet support;
   neither device is a daemon or Unix workstation. Process, shell, Git CLI,
   dynamic plugins, and arbitrary downloaded code remain unavailable.
4. **Treat macOS as an exact capability profile, not an automatic superset.** A
   sandboxed Mac app starts from the same deny-by-default capability set as the
   mobile app. A separately distributed workstation profile may add process,
   Git, broader filesystem, and external-protocol adapters only after each exact
   binary, entitlement, supervisor, cancellation, and path boundary qualifies.
5. **Every installation owns its local authority and journal.** An iPhone or iPad
   never depends on an always-on Mac. A Mac is not an implicit remote authority,
   fallback provider, or background executor. Cross-device synchronization is a
   separate unresolved protocol decision.
6. **External harness interoperability is Mac-only by default and
   non-authoritative.** A reviewed macOS process adapter may speak a versioned
   protocol to Claude Code, Codex, OpenCode, Zed/ACP, or another harness for a
   concrete interoperability need. The peer returns evidence or tool receipts;
   it never receives Curiosity's writer, gate authority, retry authority, or
   completion authority.

No weighted total is reported. Every substrate/fork candidate fails a hard gate
or retains a consequential unknown. Platform names do not cure those failures.

## 2. Evidence and confidence register

| ID    | Finding                                                                                                                                                                                                                      | Classification                                                               | Confidence | Evidence                                                                                                                                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AP-01 | Every reviewed complete harness owns at least one concern assigned to Curiosity's sole authority.                                                                                                                            | **DOCUMENTED**                                                               | High       | The 21 dossier claim registers and the per-harness table below.                                                                                                                                                   |
| AP-02 | Curiosity's current mobile product is a universal iOS target, not a macOS target.                                                                                                                                            | **DOCUMENTED**                                                               | High       | [`apps/mobile/app.json`](../../apps/mobile/app.json): `platforms: ["ios"]`, `supportsTablet: true`.                                                                                                               |
| AP-03 | The accepted iPad/mobile design prohibits Mac dependency, daemon assumptions, process/Git parity, and silent provider fallback.                                                                                              | **DOCUMENTED**                                                               | High       | [iPadOS native runtime severance](../../docs/architecture/custom-harness/IPADOS-NATIVE-RUNTIME-SEVERANCE.md) and [native agent harness](../../docs/architecture/custom-harness/IPADOS-NATIVE-AGENT-HARNESS.md).   |
| AP-04 | Accepted platform policy requires exact capability allowlists and fail-closed readiness instead of OS-name inheritance.                                                                                                      | **DOCUMENTED**                                                               | High       | [ADR-006](../../docs/architecture/custom-harness/decisions/ADR-006-extensions-sandbox-platforms.md).                                                                                                              |
| AP-05 | The earlier macOS Effect/toolchain qualification did not pass and does not qualify process, Git, provider, or desktop authority behavior.                                                                                    | **DOCUMENTED**                                                               | High       | [Q1-E02 result](../../docs/architecture/custom-harness/qualification/q1/evidence/Q1-E02/RESULT.md) and [Q1 candidate matrix](../../docs/architecture/custom-harness/qualification/q1/Q1-E01-candidate-matrix.md). |
| AP-06 | The current mobile implementation has a project-owned portable authority, coarse Rust/SQLite journal ABI, frontier-primary loop, read-only tools, durable recovery, exact cancellation, and distinct question/gate controls. | **DOCUMENTED** for repository structure and tests; not release qualification | High       | Repository commit `4d43cde` plus the uncommitted Apple-platform slice; `packages/curiosity-authority/`, `apps/mobile/src/local-curiosity-runtime.ts`, and mobile/native tests.                                    |
| AP-07 | Sharing the semantic kernel and fixtures is lower-risk than maintaining independent desktop and mobile authorities.                                                                                                          | **INFERENCE**                                                                | High       | AP-01, AP-05, AP-06; duplicate authorities create parity, migration, and replay ambiguity without adding a required platform capability.                                                                          |
| AP-08 | One UI/runtime host across iOS and macOS is neither required nor established.                                                                                                                                                | **INFERENCE**                                                                | High       | AP-02 and AP-04. The stable boundary is the client/kernel/native-port contract, not React, Expo, Catalyst, AppKit, or a terminal host.                                                                            |
| AP-09 | iPhone and iPad can share the same authority composition while using different navigation and work budgets.                                                                                                                  | **INFERENCE**                                                                | High       | They share the current iOS bundle and native boundaries; presentation size and lifecycle opportunity do not need separate semantic law.                                                                           |
| AP-10 | The exact macOS distribution profile is unresolved and changes which process, filesystem, Git, update, and sandbox claims can qualify.                                                                                       | **UNKNOWN**                                                                  | N/A        | No accepted record selects a sandboxed-store, Catalyst, notarized workstation, or other exact Mac product profile.                                                                                                |
| AP-11 | Cross-device event synchronization, conflict ownership, credential transfer, and remote cancellation are unresolved.                                                                                                         | **UNKNOWN**                                                                  | N/A        | No reviewed dossier or accepted Apple-platform record qualifies a Curiosity multi-device writer/sync protocol.                                                                                                    |
| AP-12 | Foundation Models availability, quality, memory cost, and background behavior must be qualified per device/OS/model; no Apple route is inherited across the three platform profiles.                                         | **DOCUMENTED** for runtime gating; **UNKNOWN** for complete matrix           | High / N/A | [iPadOS intelligence architecture](../../docs/architecture/custom-harness/IPADOS-INTELLIGENCE-ARCHITECTURE.md) and installed-SDK evidence cited there.                                                            |

## 3. Corrected authority recommendation

The original synthesis named one concrete desktop Effect authority. The later
mobile severance and implementation demonstrate a more portable project-owned
boundary. For a three-platform product, preserve the **single-authority
invariant** but stop making one JavaScript framework or one host process the
cross-platform identity.

Recommended shared ownership:

```text
Project-owned semantic kernel
  commands · role/catalog policy · context contracts · run reducers
  action/gate/question rules · capability intersection · terminal predicates
                              |
                    coarse journal operations
                              |
          project-owned Rust/SQLite transaction implementation
                              |
        exact platform provider and capability-host adapters
```

`@curiosity/authority` is the current strongest candidate for that shared
semantic kernel because it already runs in the iOS bundle without Node/Bun
imports. Recommending it for macOS would require an authorized architecture
update and desktop parity migration; this research document does not silently
supersede ADR-001. The alternative—retaining an Effect desktop authority and a
separate mobile authority indefinitely—should be treated as temporary migration
debt, not the target architecture.

### Shared invariants on every Apple platform

- One serialized authority and one canonical writer per local installation.
- The same command, event, run, action, attempt, gate, question, and receipt
  identities.
- Exact provider allocation before one physical send; hidden retries and silent
  fallback remain prohibited.
- Capability sets only narrow from the exact platform profile through run,
  child, action, grant, and final sink.
- UI, Apple Intelligence, external harnesses, tools, and background callbacks
  cannot approve gates or establish user authority.
- Relaunch reconciles durable attempts before overlapping work continues.
- Platform-unavailable operations return typed unavailability; they are not
  translated into prose success.
- Semantic parity is proven with shared canonical fixtures. Capability parity is
  never inferred between iPhone, iPad, and Mac.

## 4. Platform profiles

### 4.1 iPhone profile

The iPhone uses the universal iOS bundle and the same portable authority/native
journal composition as iPad. Its distinct concerns are presentation and tighter
resource qualification, not different semantics.

- Compact, one-column navigation and short foreground interaction loops.
- App-container and explicitly user-selected document roots only.
- Frontier-primary conversational/agent work; Apple Intelligence remains a
  bounded sidecar and is runtime-gated.
- No process runner, shell, Git CLI, external harness process, local daemon, or
  dynamic extension loader.
- Background work is opportunistic. Suspension first persists and fences; it
  never implies unattended completion.
- Lower initial concurrency, context, memory, thermal, and output budgets than
  iPad until physical fixtures justify increases.

### 4.2 iPad profile

The iPad uses the same authority and capability family as iPhone with a
workstation-oriented presentation.

- Multi-column project/collection/item navigation, keyboard/trackpad commands,
  and Activity projections remain UI concerns.
- App-owned and user-selected document reads may be broader in presentation but
  not in authority.
- No process, shell, Git CLI, arbitrary plugin, or Mac dependency.
- Multitasking, scene backgrounding, memory pressure, external display, and
  relaunch must preserve the same durable attempt and cancellation rules.
- Larger concurrency or context budgets are optional profile values, never
  semantic differences.

### 4.3 macOS sandboxed-app profile

This profile starts from mobile-like denial rather than assuming desktop power.

- Same semantic kernel, journal ABI, provider routing, static catalog, and
  read-only projection model.
- Filesystem access is limited to the app container and exact user-granted roots
  until security-scoped persistence and coordinated access qualify.
- Process, Git, terminal, external harness, update, and sandbox-dependent tools
  remain unavailable by default.
- Windowing, menus, keyboard commands, drag/drop, and multi-window restoration
  are presentation adapters and never canonical authority.

### 4.4 macOS workstation profile

This is a separate qualification target, not a flag that widens the sandboxed
profile.

- It may add a Rust-supervised process host, Git adapter, root-anchored workspace
  operations, and reviewed external-protocol peers.
- Each added capability requires exact executable identity, launch environment,
  path containment, inherited-handle controls, process-tree cancellation,
  receipt bounds, and distribution/update evidence.
- Reviewed external tools remain cooperative TCB components, not proof of
  malicious-code confinement.
- Untrusted execution remains denied without an exact qualified sandbox backend
  and negative escape tests.
- Current Q1 records do not qualify this profile; it must be rebuilt from the
  shared-kernel boundary rather than inherited from the old desktop harness.

### 4.5 Capability matrix

`QUALIFY` means eligible for focused implementation/acceptance work, not already
released or security-qualified.

| Capability                  | iPhone                            | iPad                                 | macOS sandboxed                   | macOS workstation                        |
| --------------------------- | --------------------------------- | ------------------------------------ | --------------------------------- | ---------------------------------------- |
| Local threads, runs, replay | Shared kernel + native journal    | Shared kernel + native journal       | Shared kernel + native journal    | Shared kernel + native journal           |
| Frontier provider route     | Exact native HTTPS route          | Exact native HTTPS route             | Exact reviewed route              | Exact reviewed route                     |
| Questions and binding gates | Coarse native control operations  | Coarse native control operations     | Shared-kernel contract only       | Shared-kernel contract only              |
| Apple sidecar inference     | Runtime-gated; qualify per device | Runtime-gated; qualified slices only | Runtime-gated; no inherited claim | Runtime-gated; no inherited claim        |
| App/document reads          | `QUALIFY` bounded roots           | `QUALIFY` bounded roots              | `QUALIFY` bounded roots           | `QUALIFY` root-anchored workspaces       |
| File mutation               | Deferred, digest/gate bound       | Deferred, digest/gate bound          | Deferred, digest/gate bound       | `QUALIFY` with rollback/reconciliation   |
| Process/shell               | Unavailable                       | Unavailable                          | Unavailable by default            | `QUALIFY` exact profiles only            |
| Git/worktrees               | Unavailable                       | Unavailable                          | Unavailable by default            | `QUALIFY` exact backend only             |
| External harness process    | Unavailable                       | Unavailable                          | Unavailable by default            | Conditional reviewed protocol peer       |
| Dynamic in-process plugins  | Prohibited                        | Prohibited                           | Prohibited                        | Prohibited                               |
| Untrusted execution         | Prohibited                        | Prohibited                           | Prohibited absent sandbox         | Prohibited absent exact sandbox          |
| Background/unattended work  | Opportunistic only                | Opportunistic only                   | Explicit lifecycle qualification  | Explicit lifecycle/service qualification |

## 5. Re-evaluation of all 21 harnesses

`REJECT` below applies to substrate and fork. `ADAPT` preserves only the named
pattern in project-owned expression. A Mac interoperability note is conditional
on the workstation profile passing its own qualification.

| Target and snapshot                                      | Apple-platform substrate/fork                | iPhone/iPad disposition                                                             | macOS bounded disposition                                                                    | Evidence                                                     |
| -------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Aider `5dc9490…`; stable `0.86.2`                        | `REJECT` — G-01/G-05                         | Adapt repository-map/context ideas only; no Python/process host.                    | Adapt repository-map and explicit edit-format patterns; no loop reuse.                       | `aider.md` C-030,C-031,C-038,C-039                           |
| Amp CLI `0.0.1787616161-g9dff10`; proprietary core       | `REJECT/DEFER` — consequential unknowns      | Adapt typed thread/executor identity only; hosted authority is not mobile fallback. | Protocol use remains deferred until proprietary enforcement and custody are bounded.         | `amp.md` C-005,C-018,C-022,C-027,C-034,C-035                 |
| Claude Code `2.1.243`; public tree `8b6ef81…`            | `REJECT` — unknown G-01/G-03/G-11            | No local runtime; public event shapes may inform fixtures.                          | Conditional reviewed process peer; adapt capability discovery and correlated events.         | `claude-code.md` C-028,C-029,C-030,C-040,C-047               |
| Cline CLI `3.0.58`; SDK `0.0.79`; VS Code `4.1.15`       | `REJECT` — G-01/G-07                         | Adapt typed host/agent messages only.                                               | IDE/process interoperability is conditional and non-authoritative.                           | `cline.md` C-006,C-027,C-028                                 |
| Continue `5522c6f…`; CLI `1.5.47`                        | `REJECT` — G-01/G-05                         | Adapt provider-neutral contracts after independent qualification.                   | Conditional protocol/tool peer; reuse no loop or hidden provider path.                       | `continue.md` C-036,C-037                                    |
| Crush `v0.91.0` / `41cdd18…`                             | `REJECT` — G-01/G-05/G-10                    | Adapt lifecycle/persistence lessons; terminal/TCP host is unavailable.              | Reject unauthenticated authority TCP and safe-prefix shell policy.                           | `crush.md` C-037,C-038,C-039,C-044,C-045                     |
| Cursor Agent `2026.08.11-e8db854`                        | `REJECT/DEFER` — proprietary unknowns        | Adapt durable run/workspace handoff as a UI pattern only.                           | Remote handoff may be a future protocol; no proprietary enforcement claim is inherited.      | `cursor-agent.md` C-016,C-023,C-025,C-026,C-040              |
| DeepSeek Harness `dsh-v0.1.1-rc.2` / `b150a55…`          | `REJECT` — G-01/G-07                         | Adapt ordered immutable overlays and interruption evidence.                         | Same pattern; no extension runtime adoption.                                                 | `deepseek-harness.md` C-030,C-031,C-032,C-034                |
| Gemini CLI `812f7a2…`; stable `0.56.0`                   | `REJECT` — G-01/G-05                         | Adapt validate/build/authorize/execute/result stages only.                          | Conditional reviewed process peer; reject implicit permissive modes.                         | `gemini-cli.md` C-029,C-030,C-031                            |
| GitHub Copilot CLI `1.0.80` / `ef627e1…`                 | `REJECT/DEFER` — proprietary unknowns        | Adapt public event/protocol shapes only.                                            | Conditional protocol evidence only; closed defaults are not qualification.                   | `github-copilot-cli.md` C-030,C-031,C-032,C-039              |
| Goose `f9ac24c…`; release `1.47.0` separate              | `REJECT` — G-01/G-05/G-09                    | Adapt generation fencing and final-sink policy.                                     | Conditional peer only after gate and provider-send boundaries are externally enforced.       | `goose.md` C-026,C-027,C-028,C-029,C-031                     |
| Kimi CLI `1.49.0` / `cbc15c0…`                           | `REJECT` — G-01/G-07                         | Adapt typed wire and source-scoped approval lifecycle as schemas.                   | Conditional process protocol; UI output remains non-authoritative.                           | `kimi-cli.md` C-016,C-019,C-032,C-034,C-035                  |
| OpenAI Codex `4ef1d4b…`; stable `rust-v0.149.1` separate | `REJECT` — G-01/G-05                         | Adapt lifecycle RPC, reader/writer admission, and monotone capabilities.            | Strong protocol-pattern candidate; conditional external peer, never provider/tool authority. | `openai-codex.md` C-033,C-034,C-035,C-036,C-037              |
| OpenCode `v1.18.22` / `47b6b6f…`                         | `REJECT` — G-01/G-05/G-07                    | Behavioral reference only; removing OpenCode cannot alter the app.                  | Replaceable host adapter or process peer; adapt final-sink and event/projection mechanics.   | `opencode.md` C-009,C-038,C-039,C-040,C-041                  |
| OpenHands SDK `1.43.1`, four-repository snapshot         | `REJECT` — G-01/G-03/G-07                    | Adapt typed append-ledger and approval-response event patterns.                     | Hosted/process use remains non-authoritative; reject exactly-once automation claims.         | `openhands.md` C-022,C-029,C-030,C-031,C-032,C-036           |
| Pi `v0.84.3` / `4e58f32…`                                | `REJECT` — G-01/G-05/G-07                    | Adapt fail-closed tool validation and parent-linked transcript projections.         | Same patterns; no in-process untrusted extensions.                                           | `pi.md` C-033,C-034,C-035,C-036,C-037                        |
| Pydantic AI Harness `v0.24.0`; core `v2.33.0`            | `REJECT` — G-01; strongest builder challenge | Python runtime is unavailable and `Agent.run()` retains loop authority.             | Adapt inspectable static composition and unknown-effect frontiers; no substrate.             | `pydantic-ai-harness.md` C-006,C-007,C-019,C-027,C-029,C-030 |
| Qwen Code `22bb5e8…`; stable `0.22.0`                    | `REJECT` — G-01/G-05                         | Adapt request/authority/execution/evidence stages.                                  | Same pattern plus conditional process interoperability.                                      | `qwen-code.md` C-030,C-031,C-032                             |
| SWE-agent `3ea751c…`                                     | `REJECT` — G-01/G-07                         | Adapt action/observation evidence envelopes; no shell.                              | Reject shell blocklists and trajectory re-execution as recovery.                             | `swe-agent.md` C-025,C-026,C-027,C-029,C-030                 |
| Trae Agent `e839e55…`                                    | `REJECT` — G-01/G-05/G-07                    | Adapt normalized provider and step evidence only.                                   | Same patterns; no provider/loop adoption.                                                    | `trae-agent.md` C-014,C-015,C-022,C-023                      |
| Zed `5631830…`; ACP `9bc7ac7…`; registry `c62ab72…`      | `REJECT` as substrate                        | Adapt capability-negotiation schemas only; no external process assumption.          | Best bounded interoperability pattern for a workstation process boundary.                    | `zed-agent.md` C-028,C-029,C-030,C-032                       |

## 6. Product and lifecycle consequences

### Local-first does not mean shared-writer

An iPhone, iPad, and Mac may each own a local journal. The current evidence does
not authorize merging those journals or allowing one device to commit for
another. A future sync design must define immutable identity, user
authentication, conflict ownership, provider/action attempt custody, gate
ownership, cancellation propagation, deletion, and recovery before enabling
cross-device writes.

Until then:

- exporting or displaying another device's history is read-only evidence;
- opening the same project on two devices does not imply one distributed run;
- a Mac cannot complete an iPhone/iPad run merely because it has broader tools;
- provider sessions stay in the native credential owner for that installation;
  and
- no background callback on any platform becomes semantic authority.

### Feature asymmetry is intentional

The same command may be admitted on Mac and denied on iPhone because the exact
Mac capability profile is ready. That is semantic parity: both installations
apply the same policy to different truthful capability sets. Pretending that an
iPad has shell/Git parity, or that a sandboxed Mac automatically has workstation
authority, would be behavioral divergence.

## 7. Recommended implementation sequence

1. **Freeze a platform-neutral kernel contract.** Canonicalize command, catalog,
   context, run, action, attempt, question, gate, cancellation, terminal, and
   replay fixtures under `@curiosity/authority`.
2. **Converge desktop semantics.** Port or wrap the existing desktop/custom
   harness so Mac uses the same kernel contract and journal operations instead
   of retaining an indefinitely separate authority implementation.
3. **Keep one universal iOS runtime composition.** iPhone and iPad select
   presentation/resource profiles, not different semantic owners.
4. **Build a read-only macOS base profile first.** Prove local journal, provider
   routing, cancellation, relaunch, and projection parity before adding desktop
   effects.
5. **Select the exact Mac distribution profile.** Decide sandboxed app versus
   workstation distribution before qualifying filesystem, process, Git,
   external protocol, update, and sandbox boundaries.
6. **Add Mac capabilities one at a time.** Each capability gets an independent
   manifest, readiness probe, fixture, denial path, and rollback/removal test.
7. **Add harness interoperability last.** Prefer a versioned ACP/Codex-style
   process protocol with capability negotiation and correlated evidence. No
   external peer receives application authority.
8. **Design cross-device sync separately.** Do not overload provider transport,
   CloudKit, shared files, or a Mac companion into an undeclared authority
   protocol.

## 8. Platform qualification matrix

Shared semantic fixtures are necessary but not sufficient. Each platform needs
physical evidence for its host boundary.

| Profile           | Required discriminating evidence                                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iPhone            | Cold launch and migration; background/suspend/terminate/relaunch; memory pressure; thermal and battery bounds; compact navigation; exact OAuth callback; provider and document cancellation; unsupported-device Apple-model denial.                                       |
| iPad              | All iPhone durability checks plus multitasking/scene transitions, keyboard/trackpad, external display, document-provider coordination, larger-context limits, and sustained frontier/read-tool loops.                                                                     |
| macOS sandboxed   | Signing/entitlements, container and user-selected roots, bookmark restoration, sleep/App Nap/termination, multi-window restoration, provider custody, update behavior, and negative tests proving unavailable process/Git paths remain denied.                            |
| macOS workstation | Exact distribution artifact, supervisor identity, environment/descriptor closure, root-anchored paths, descendant process termination, Git backend provenance, external-protocol cancellation, receipt bounds, and sandbox readiness where stronger isolation is claimed. |
| All profiles      | Same canonical event/projection outputs, one physical provider send, stale-result fencing, cancellation replay, failure terminalization, catalog digest, capability narrowing, and removal of every optional adapter without state corruption.                            |

## 9. Curiosity pass and stop decision

The highest-value thread was whether all three Apple platforms should share one
host or only one kernel. The pass compared the current universal iOS target,
mobile severance architecture, exact-platform capability policy, and failed Mac
qualification record.

**Result:** share the kernel/contracts and preserve separate hosts. A common UI
technology may still be selected, but it has no bearing on semantic or capability
authority and therefore cannot change the harness decision.

The remaining highest-value unknown is the exact macOS distribution profile.
It cannot be resolved from harness reverse engineering; it requires a product
choice followed by a signed prototype and capability-specific qualification.
It is recorded as `DEFER_MACOS_PROFILE_SELECTION`, not guessed.

Rejected follow-ups:

- `CURIOSITY_NO_GO` — reopening all 21 harnesses for newer versions: version
  drift cannot remove their structural competing-authority role without a named
  contrary change.
- `CURIOSITY_NO_GO` — choosing a mobile substrate because it has a cloud mode:
  remote availability does not establish Curiosity authority, custody, replay,
  or cancellation semantics.
- `CURIOSITY_NO_GO` — treating Catalyst, React Native macOS, Expo, AppKit, or a
  terminal as the architecture decision: those are replaceable presentation and
  host choices.
- `CURIOSITY_NO_GO` — enabling ACP/MCP/CLI peers on iPhone or iPad by analogy to
  macOS: the required external process boundary is absent.
- `CURIOSITY_NO_GO` — inferring Mac workstation capabilities from the failed Q1
  record or from OS documentation alone.

**Stop decision:** `STOP_ARCHITECTURE_SATURATION_PLATFORM_QUALIFICATION_REQUIRED`.
Coverage is sufficient for the direct-build/shared-kernel decision. Further
general harness research would not change the hard-gate result. Work should
resume only for the exact Mac profile decision, a named interoperability peer,
cross-device sync, or a failed platform fixture that challenges a shared
invariant.

## 10. Bibliography rationale

- **The 21 local dossiers** are retained because each pins its own source and
  artifact ledger, claim register, adversarial limits, and snapshot. They are the
  primary evidence for harness behavior and competing authority.
- **[DECISION-FRAME.md](DECISION-FRAME.md)** supplies the five options, hard
  gates, comparison dimensions, and stop rule; it prevents platform enthusiasm
  from bypassing authority failures.
- **[ADR-006](../../docs/architecture/custom-harness/decisions/ADR-006-extensions-sandbox-platforms.md)** is preferred for platform capability policy because it explicitly requires exact allowlists and fail-closed readiness.
- **[ADR-011](../../docs/architecture/custom-harness/decisions/ADR-011-direct-build-and-host-decoupling.md)** establishes direct build and replaceable hosts after the original research.
- **[iPadOS native runtime severance](../../docs/architecture/custom-harness/IPADOS-NATIVE-RUNTIME-SEVERANCE.md)** is the primary local source for mobile ownership, no-Mac operation, native ports, and lifecycle constraints.
- **[iPadOS intelligence architecture](../../docs/architecture/custom-harness/IPADOS-INTELLIGENCE-ARCHITECTURE.md)** and **[native agent harness](../../docs/architecture/custom-harness/IPADOS-NATIVE-AGENT-HARNESS.md)** define the frontier-primary/Apple-sidecar boundary and durable mobile loop.
- **[Q1-E02](../../docs/architecture/custom-harness/qualification/q1/evidence/Q1-E02/RESULT.md)** and the **[Q1 candidate matrix](../../docs/architecture/custom-harness/qualification/q1/Q1-E01-candidate-matrix.md)** are retained because they prevent an unsupported Mac qualification claim.
- **[`apps/mobile/app.json`](../../apps/mobile/app.json)** and repository commit
  `4d43cde` establish the current implementation point; passing repository tests
  demonstrate implemented structure, not production or security acceptance.

No new mutable web source was needed. The retained Apple primary-source and
installed-SDK evidence is already cited in the accepted platform documents. A
new external search would not resolve the product-owned Mac distribution choice
or qualify a physical host boundary.
