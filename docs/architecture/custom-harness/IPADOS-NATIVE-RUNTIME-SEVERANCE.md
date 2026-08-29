# iPadOS native runtime severance

Research date: 2026-08-29  
Status: **Accepted decomposition; N0–N2 implemented, N3 tool-free route in qualification. Not release authority.**  
Target: a self-contained Curiosity iPad app with no Mac, LAN server, Bun process,
or loopback HTTP dependency. Remote model and search providers may be optional
capabilities, never hidden prerequisites.

## Decision served

Replace the current mobile-to-Mac client/server arrangement with a bundled local
runtime while preserving Curiosity's canonical authority, event, capability,
attempt, and projection behavior.

This is not a request to make an iPad pretend to be macOS. The product must work
without the Mac, but capabilities that depend on arbitrary child processes, Git
worktrees, or a desktop toolchain must become explicitly unavailable or be
replaced by typed app-native operations.

## Evidence language and legal boundary

- **Documented** means established by inspected project source, an Apple primary
  source, or the installed Apple SDK.
- **Inference** is an architectural conclusion drawn from documented evidence.
- **Unknown** requires an implementation spike, benchmark, or physical-device
  test. Unknown never means available.

The reverse-engineering scope was limited to project-owned source and public
Apple interfaces. No access control was bypassed, no protected implementation
was copied, and undocumented Apple behavior is not treated as fact.

## Executive decision

Use the React Native app's existing Hermes runtime for Curiosity's portable,
deterministic TypeScript semantics, and use bundled Swift/Rust code only for
platform primitives:

1. **Extract the authority from the host.** Command decisions, the static plugin
   catalog, prompt assembly, reactions, workflows, delegation, attempt policy,
   and projections become a platform-neutral module. They remain one semantic
   implementation shared with the desktop harness.
2. **Delete transport from the product path.** Mobile calls a local
   `CuriosityClient`; it does not call an in-process HTTP server and does not
   require `EXPO_PUBLIC_CURIOSITY_URL`.
3. **Replace the mandatory supervisor with a capability host.** On iPad the host
   is an in-process set of typed Swift/Rust adapters. Unsupported desktop
   capabilities have stable unavailable diagnostics and are not emulated.
4. **Use a native durable journal, not a generic JS SQL escape hatch.** A coarse,
   versioned transaction ABI owns SQLite connection details and atomic writes;
   the TypeScript authority remains the only component allowed to request domain
   transitions.
5. **Use Foundation Models as one explicit provider route.** It is suitable for
   bounded summarization, extraction, classification, tagging, titles, and
   drafting. It is not a silent replacement for the main reasoning agent.
6. **Reach the main model through an explicit account broker or not at all.** A
   later native HTTPS adapter may call a separately designed Curiosity account
   broker. The iPad holds only a broker session in native Keychain custody;
   provider credentials and AI SDK adapters remain server-side. The Mac is never
   that gateway. See accepted ADR-019.
7. **Reuse the existing Rust lexical query core.** Its no-default-features crate
   compiles for `aarch64-apple-ios`; publication in the mobile app still needs a
   separate runtime decision and iOS qualification.

The recommended architecture intentionally does **not** rewrite all semantic
behavior in Swift or Rust. Such a rewrite would create a second Curiosity kernel
without evidence that Hermes is the bottleneck. “Native” here means local,
bundled, and backed by public iPad APIs—not “rewrite deterministic product logic
in the platform language.”

## Current dependency graph

The current Mac dependency is a composition of five distinct concerns:

| Current concern         | Evidence                                                                                                                                                  | Disposition                                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile HTTP client      | `apps/mobile/src/curiosity-api.ts` calls only `session` and `chat`; `workspace-screen.tsx` defaults to `http://10.1.0.121:3000`.                          | Replace with local `CuriosityClient`; retain an HTTP implementation only as a development/optional adapter.                                  |
| Next/Bun dashboard host | `apps/web/app/api/curiosity/**` loads `@curiosity/custom-harness/dashboard/node`.                                                                         | Remove from the iPad product path. It remains a desktop presentation adapter.                                                                |
| Authority and semantics | `apps/custom-harness/src/kernel`, `plugins`, `semantics`, and `projection`.                                                                               | Keep one implementation; extract Node/Bun dependencies behind ports.                                                                         |
| Durable journal         | `EventJournal` and its subordinate journals depend on `bun:sqlite`; schema v15 has 21 domain/control tables plus indexes and immutable-snapshot triggers. | Re-host behind a native coarse transaction ABI. Preserve schema behavior and migration evidence; do not bridge arbitrary SQL to React.       |
| Provider gateway        | The provider-neutral `TextGenerator` port is implemented by Node-oriented AI SDK packages.                                                                | Keep the port; add Swift Foundation Models and optional Swift `URLSession` provider adapters.                                                |
| Research                | Search/fetch contracts are provider-neutral, but current HTTP and runtime wrappers use Node networking and Bun FFI.                                       | Implement bounded `URLSession` fetch; make search provider-specific; bind read-only Rust lexical query directly.                             |
| Capability host         | `SupervisorClient` spawns a Rust binary for workspace, Git, and process calls and is mandatory at harness startup.                                        | Replace with an optional `CapabilityHost` receipt. iPad app-document operations are native; process and worktree operations are unavailable. |
| TUI/distribution        | Go Bubble Tea, Bun binary wrapper, executable materializer, and terminal adapters.                                                                        | Exclude from the app. They are presentations/distribution mechanisms, not product semantics.                                                 |

The runtime startup requirement is the immediate structural defect: even a chat
configuration with no process profiles must spawn the supervisor. Capability
availability must be data, not a condition for constructing the authority.

## Options considered

| Option                                                        | Verdict       | Reason                                                                                                                                                               |
| ------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bundle Bun and the existing binaries, then call loopback HTTP | **Reject**    | iPad apps are sandboxed, dynamic executable behavior is constrained, and this preserves accidental transport and process boundaries.                                 |
| Rewrite the entire harness in Swift                           | **Reject**    | Duplicates mature command/workflow semantics and their test oracle; couples product law to Apple UI/provider frameworks.                                             |
| Rewrite the entire harness in Rust now                        | **Defer**     | Technically possible but high-risk and unnecessary before measuring Hermes. It would require parity for every plugin, workflow, attempt, projection, and error code. |
| Keep the Mac as an always-on authority                        | **Reject**    | Directly violates the product decision and leaves offline launch, durability, privacy, and availability dependent on another device.                                 |
| Portable TypeScript authority plus native ports               | **Recommend** | Smallest architecture that severs the Mac while preserving one semantic implementation and using native APIs where they add real capability.                         |

## Target ownership

```text
React Native views and hooks
          |
   LocalCuriosityClient
   session / submit / cancel / answer / status
          |
  Portable Curiosity authority (Hermes, one serialized runner)
  commands, catalog, reactions, workflows, attempts, projections
       |                 |                    |
 NativeJournalPort   GenerationPort       CapabilityHost
 Rust/SQLite ABI     Swift actors         typed Swift/Rust tools
       |             |         |          |       |        |
 app ledger    Foundation Models  HTTPS  Files  lexical  Apple APIs
                                  model          query
```

### React Native and Hermes

React composes the UI and observes projections. It does not own canonical events,
pending attempts, provider sessions, or tool completion. A singleton serialized
runner outside React state owns the portable authority. React component remounts
must not reset the journal or provider attempt state.

The portable import closure must contain no `node:`, `bun:`, terminal, Next,
filesystem, or AI SDK module. Required replacements include:

- `createHash`, HMAC, timing-safe comparison, UUID, and secure random behind a
  `CryptoPort`;
- `Buffer.byteLength` behind one UTF-8 byte-count primitive;
- `performance.now` and wall time behind explicit clocks;
- concrete `EventJournal` behind `JournalPort`;
- concrete `SupervisorClient` behind optional `CapabilityHost`; and
- provider/research implementations behind their existing contracts.

Effect may remain in the portable closure only after a Metro/Hermes build and
physical-device execution test proves the exact version works. Polyfilling Node
to make the old closure bundle is prohibited.

### Native journal

Use a bundled Rust static library with SQLite, called through one Swift/Expo
module and a narrow C ABI. The ABI should expose coarse operations such as admit,
allocate, authorize dispatch, complete, cancel, answer, and query projection—not
`executeSQL(string)`.

Required properties:

- one Swift actor or equivalent serialized owner per database;
- caller-owned bounded UTF-8 request/response buffers and explicit ABI version;
- no retained Swift/Rust pointers across calls;
- schema migration and hash-chain verification before readiness;
- WAL and synchronization settings asserted on every connection;
- interruption reconciliation identical to the current attempt semantics;
- app-private `Application Support` storage with an explicit Data Protection and
  backup policy; and
- no provider credentials, security-scoped bookmarks, or model secrets in the
  event body.

Rust owns transaction mechanics and validates the requested transition shape. It
does not invent commands, approve gates, select tools, retry providers, or mark
semantic work complete.

### Generation providers

#### On-device route

Foundation Models is available from iOS/iPadOS 26 and must be runtime-gated using
`SystemLanguageModel.availability`. The adapter is a Swift actor because sessions
are stateful, requests must not overlap accidentally, cancellation and app
lifecycle are native concerns, and Apple can invoke multiple tools in parallel.

The first route is deliberately **tool-free**. It supports bounded tasks where
the kernel supplies all facts and asks for text or a constrained structure:

- title and label generation;
- summarization and explicit compaction candidates;
- classification, extraction, and tagging;
- draft/rewrite assistance; and
- deterministic-schema planning that still requires kernel validation.

If the portable gateway supplies a nonempty tool list, v1 returns
`FOUNDATION_MODEL_TOOL_BRIDGE_UNAVAILABLE`. Apple's automatic `Tool.call` path
must not execute an app effect before Curiosity durably allocates and authorizes
the exact tool call. A later bridge must prove one of these designs:

1. a kernel-driven structured step loop that emits a tool proposal, awaits a
   governed result, and resumes generation; or
2. a Foundation Models `Tool` whose `call` method blocks on a durable Curiosity
   broker before any effect is performed.

No direct Swift tool is allowed to mutate a Craft document. Agent edits still
dispatch the same `EditorKernel` commands used by human input.

#### Main-agent route

The main advanced-reasoning route remains provider-neutral and explicit. Under
accepted ADR-019, a Swift `URLSession` streaming adapter calls one reviewed
Curiosity account broker over HTTPS. Native Keychain owns only the revocable
broker session; provider secrets and AI SDK adapters remain server-side and are
never exposed to Hermes.

When the cloud route is unavailable, Curiosity reports that route unavailable.
It does not silently substitute the smaller on-device model and claim equivalent
work. The app still opens local content, loads history, performs deterministic
commands, searches local indexed material, and offers the explicitly labelled
on-device route.

#### On-device memory curator

Under accepted ADR-020, Foundation Models may extract, compact, and rerank
bounded local memory through a dedicated structured host. The portable authority
validates every proposal, owns sensitivity and retention policy, and alone
admits memory events. Deterministic local retrieval runs before model reranking;
the model never scans the archive or writes SQLite. The 4,096-token local limit
is treated as total input plus output with a conservative safety reserve.

#### Core ML route

Core ML is a later adapter, not the severance foundation. A bundled custom model
is considered only after a named model, license, conversion recipe, tokenizer,
memory/power profile, output contract, and physical-device quality suite pass.
Core ML offers model control and CPU/GPU/Neural Engine scheduling but transfers
model-size, lifecycle, sampling, and quality ownership to this project.

### Capability translation

| Existing action/capability                            | iPad owner                                                                | Initial status                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| `chat.turn`, thread/session projections               | Portable authority + native journal                                       | **Build**                                               |
| semantic commands, gates, questions, finite workflows | Portable authority; RN presents questions/gates                           | **Build**                                               |
| `provider.generate` without tools                     | Swift Foundation Models or explicit HTTPS route                           | **Build**                                               |
| child delegation                                      | Portable scheduler using available generation routes                      | **Defer** until provider cancellation/fencing passes    |
| `workspace.read/list/glob/search`                     | App-container/document workspace adapter; Rust may perform bounded search | **Build** for app-owned roots                           |
| `workspace.write/patch/delete`                        | Coordinated document adapter with digest preconditions and user gates     | **Build later**                                         |
| local lexical corpus query                            | Existing `apps/runtime/native` C ABI, statically linked                   | **Candidate; compile proven, iOS behavior unqualified** |
| `fetch.web`                                           | Bounded Swift `URLSession` adapter with redirect/address/size policy      | **Build later**                                         |
| `search.web`                                          | Explicit hosted search provider or owned index                            | **Unavailable until configured**                        |
| `process.run`                                         | None                                                                      | **Unavailable on iPad**                                 |
| Git status/diff/worktree/ref mutation                 | None initially; a future typed libgit implementation is a new capability  | **Unavailable/deferred**                                |
| arbitrary dynamic plugins or downloaded code          | None                                                                      | **Prohibited**                                          |
| Craft mutations                                       | Existing `EditorKernel` command/transaction boundary                      | **Keep; never bypass**                                  |

The document workspace is not an unrestricted Unix root. Its authority can cover
the app container and user-selected Files locations while their security scope is
active. Path containment, coordinated reads/writes, provider conflicts, and
bookmark restoration require native tests.

### Lifecycle and backgrounding

- A scene transition to background first persists in-flight local state, then
  cancels or fences provider/tool operations that cannot safely continue.
- Background execution is opportunistic through system APIs, never assumed.
- Relaunch reconciles every dispatched-but-unsettled attempt before accepting a
  new command that overlaps its resource.
- Streaming events carry runtime, turn, action, and generation identity so stale
  events cannot update a remounted React view.
- Memory pressure may discard provider sessions and projections, never canonical
  events. A new model session is rebuilt from bounded kernel-owned context.

## Mobile API cutover

Preserve the UI-facing shape while changing its implementation:

```ts
interface CuriosityClient {
  session(threadId?: string): Promise<CuriositySession>;
  submit(
    input: CuriositySubmit,
    onDelta?: (text: string) => void,
  ): Promise<CuriosityTurn>;
  cancel(turnId: string): Promise<void>;
  status(): Promise<CuriosityRuntimeStatus>;
}
```

1. Make `useCuriosityWorkspace` depend on `CuriosityClient`, not a URL-derived
   return type.
2. Keep `createHttpCuriosityClient` for desktop integration tests.
3. Add `createLocalCuriosityClient` over the portable authority and native ports.
4. Select local unconditionally in the iPad product build.
5. After no-server acceptance passes, remove the hardcoded LAN address,
   `EXPO_PUBLIC_CURIOSITY_URL` product selection, server URL chrome,
   `NSLocalNetworkUsageDescription`, and local-network ATS exception.

“Online” must be split into meaningful state: local runtime ready, on-device
model available, main provider reachable, and research provider available. A
healthy local app is not “offline” merely because the Mac is absent.

## Migration tranches and binary acceptance

### N0 — Client seam

- [x] Mobile session and submit behavior passes unchanged against an injected
      HTTP client and an in-memory local fake.
- [x] No UI component reads a server URL or calls `fetch` directly.

### N1 — Portable authority

- [x] The production mobile import graph has zero `node:`, `bun:`, Next, TUI,
      supervisor-client, and AI-SDK imports.
- [x] Golden command fixtures produce the same acknowledgements, canonical event
      bodies/digests, terminal statuses, and thread/message projections in Bun
      and Hermes. Physical-device evidence:
      [N1–N3 acceptance, 2026-08-29](evidence/ipados-native-n1-n3-2026-08-29.md).
- [x] Missing capability host does not prevent startup; dependent actions fail
      with their stable unavailable code.

### N2 — Native journal

- [x] Create thread, complete a scripted turn, force-terminate, relaunch, and
      recover the same projection on a physical iPad.
- [ ] Crash injection around allocation, dispatch marking, completion, and
      checkpoint proves no fabricated success and preserves delivery ambiguity.
- [ ] Schema mismatch, hash-chain corruption, migration failure, and storage
      protection failure prevent runtime readiness.

### N3 — Foundation Models

- [ ] Physical-device status reports every availability reason without crashing
      on unsupported devices, disabled Apple Intelligence, unsupported language,
      or unavailable model assets.
- [ ] Cancellation, context overflow, guardrail refusal, app backgrounding, and
      stale stream events settle to explicit journal states.
- [ ] Representative summarization/extraction/classification fixtures record
      quality, first-response latency, completion latency, memory, thermal state,
      and OS/model version. No unmeasured number becomes a budget.
- [ ] A request containing tools fails closed until the governed bridge passes.

### N4 — Native tools

- [ ] App-owned read/list/glob/search reject traversal, symlink escape, excessive
      output, unsupported encodings, stale scope, and cancellation.
- [ ] Mutations require exact content preconditions, coordinated atomic
      publication, one durable attempt, and explicit ambiguous-delivery recovery.
- [ ] `process.run` and Git/worktree requests return stable unavailability; no
      hidden fallback reaches the Mac.

### N5 — No-Mac product cutover

- [ ] With the Mac powered off and local network denied, a cold-launched physical
      iPad can load history, create a thread, complete an available on-device
      turn, cancel a turn, relaunch, and recover state.
- [ ] The app bundle and runtime logs contain no required LAN URL, loopback
      server, spawned supervisor, Bun binary, or Go TUI path.
- [x] Local-network permission text and ATS local-network exceptions are absent.
- [ ] Craft agent mutations, when enabled, yield the same canonical document
      bytes and undo behavior as equivalent human commands.

### N6 — Optional main agent

- [ ] The route is visibly distinct from the on-device model and never selected
      as a silent fallback in either direction.
- [ ] Secrets are absent from source, bundle resources, logs, events, and crash
      reports; credential deletion makes the route unavailable immediately.
- [ ] Provider dispatch, cancellation, ambiguous delivery, usage state, and
      restart reconciliation preserve current gateway semantics.

### N7 — Governed on-device memory

- [ ] Bounded structured curation can extract, supersede, compact, and rerank
      local memory without direct journal writes or network access.
- [ ] Every active memory retains source-message provenance, policy version,
      sensitivity, retention, and optimistic version identity.
- [ ] Secret-like, stale, malformed, unknown-source, and unauthorized-disclosure
      fixtures perform zero active-memory mutation or frontier transmission.
- [ ] Context preflight enforces the total local input-plus-output envelope, and
      background/relaunch tests preserve resumable idempotent curation jobs.

### N8 — Native agent harness

- [ ] Project-owned workflow, action, attempt, gate, child, budget, no-progress,
      and recovery semantics execute from the portable authority with desktop
      golden parity.
- [ ] On-device and frontier models return the same bounded step proposal; no
      adapter owns a hidden loop, tool effect, retry, or fallback.
- [ ] Every native/provider effect has a prior durable action, exact attempt
      generation, immutable input digest, capability/resource grant, and gate
      receipt when required.
- [ ] Graph transitions, forks, joins, questions, gates, cancellation, children,
      background interruption, and relaunch recovery pass on a physical iPad.

## Consequential ADRs required by tranche

1. **Mobile authority profile:** [ADR-016](decisions/ADR-016-ipados-local-authority-profile.md)
   supersedes ADR-001's mandatory child-supervisor
   rule for the iPad profile while retaining one application authority and
   fail-closed capabilities. The desktop profile remains unchanged. **Accepted.**
2. **Native journal ABI and durability:** proposed
   [ADR-017](decisions/ADR-017-ipados-native-journal-abi.md) records the selected
   mobile-owned ABI, schema compatibility, and Data Protection policy. Crash,
   VFS, migration, backup, and release qualification remain open.
3. **Foundation Models route:** proposed
   [ADR-018](decisions/ADR-018-ipados-foundation-models-route.md) records the
   implemented transcript, availability, cancellation, error, and no-tools
   boundary. Quality, safety, performance, and release qualification remain
   open.
4. **Runtime iOS reuse:** the `apps/runtime` constitution currently grants no
   other-platform release. Statically linking its lexical query code requires a
   separately reviewed iOS authority and qualification; a successful compile is
   not that authority.
5. **Optional cloud provider:** choose authentication, privacy disclosure,
   provider protocol, usage reporting, and whether any account gateway exists.
   Proposed [ADR-019](decisions/ADR-019-ipados-explicit-generation-routes.md)
   selects an explicit account broker, native broker-session custody, and
   server-side AI SDK adapters.
6. **On-device memory:** proposed
   [ADR-020](decisions/ADR-020-ipados-governed-memory-curation.md) defines
   structured model proposals, authority-owned admission, bounded retrieval,
   frontier disclosure, and the total-context envelope.
7. **Native agent graph:** proposed
   [ADR-021](decisions/ADR-021-ipados-durable-agent-graph-kernel.md) selects a
   portable kernel-driven step loop, coarse journal ABI v2, governed native
   actions, bounded child graphs, and journal-owned lifecycle recovery.

## Unknowns and explicit no-go decisions

### Unknowns requiring spikes

- Foundation Models representative-task quality, memory, and thermals on
  Sterling's actual iPad configuration. Availability, one bounded streamed
  completion, and cancellation were measured on iPadOS 27 on 2026-08-29; one
  completion sample is not a performance distribution or budget.
- Whether Expo module events are sufficient for bidirectional provider streaming
  and cancellation or whether this runtime needs a TurboModule/JSI boundary.
- Exact SQLite VFS and Data Protection behavior under force termination, device
  lock, File Provider coordination, and storage pressure.
- Provider-specific authorization terms, broker enrollment flows, account
  recovery, and revocation behavior.

### `CURIOSITY_NO_GO`

- **No** claim that Foundation Models replaces the advanced main agent. Apple
  explicitly characterizes it as a device-scale model, not a world-knowledge or
  advanced-reasoning model.
- **No** bundled Bun server, loopback HTTP server, downloaded executable/plugin,
  or arbitrary process runner.
- **No** fake shell, Git, build, or test parity implemented by prompting a model.
- **No** automatic native-model/cloud-model substitution that changes capability
  while retaining the same label.
- **No** direct Foundation Models tool execution before durable Curiosity
  allocation and final-sink authorization.
- **No** mobile durability, provider, retrieval, or release claim from a compile
  check alone.

## Research findings and confidence

| Finding                                                                                                                                   | Label                                                    | Confidence                |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------- |
| Foundation Models runs on-device/offline, supports structured generation, stateful sessions, and app-defined tools.                       | **Documented**                                           | High                      |
| It is a 3B, 2-bit device-scale model and is not intended for world knowledge or advanced reasoning.                                       | **Documented**                                           | High                      |
| Availability must be checked at runtime and depends on Apple Intelligence support and environment.                                        | **Documented**                                           | High                      |
| Foundation Models starts at iOS/iPadOS 26.                                                                                                | **Documented** by Apple WWDC and installed SDK interface | High                      |
| Tool calls can be parallel; context, language, safety, and model-version changes are normal adapter concerns.                             | **Documented**                                           | High                      |
| Core ML is Apple's deployment route for chosen model assets and schedules over CPU, GPU, and Neural Engine.                               | **Documented**                                           | High                      |
| A public iPad app must be self-contained, use public APIs, remain sandboxed, and cannot download/execute code that changes functionality. | **Documented**                                           | High                      |
| The existing no-default-features Rust runtime crate is source-compatible with the `aarch64-apple-ios` target.                             | **Documented** by local compile check                    | High for compilation only |
| Portable TypeScript semantics plus native ports is lower risk than a whole-kernel rewrite.                                                | **Inference**                                            | High                      |
| The on-device model will satisfy Curiosity's bounded helper tasks on the target iPad.                                                     | **Unknown** until representative device evaluation       | Unknown                   |

## Primary-source bibliography

1. [Apple, “Meet the Foundation Models framework,” WWDC25 session 286](https://developer.apple.com/videos/play/wwdc2025/286/).
   Selected because it is Apple's direct statement of model size, intended task
   class, offline behavior, availability, structured generation, sessions, and
   tool calling. It is preferable to third-party launch summaries.
2. [Apple, “Deep dive into the Foundation Models framework,” WWDC25 session 301](https://developer.apple.com/videos/play/wwdc2025/301/).
   Selected for context-window recovery, model-version nondeterminism,
   unsupported-language behavior, dynamic schemas, and parallel tool calls.
3. [Apple, “Discover machine learning & AI frameworks on Apple platforms,” WWDC25 session 360](https://developer.apple.com/videos/play/wwdc2025/360/).
   Selected as the accessible primary comparison of Foundation Models and Core
   ML. Apple's Core ML overview page was not text-readable in this research
   environment, so it was not used as evidence.
4. [Apple, App Review Guidelines, sections 2.5.1–2.5.4](https://developer.apple.com/app-store/review/guidelines/).
   Selected for public-API, self-contained-bundle, container, executable-code,
   and background-execution constraints.
5. [Apple Platform Security, “Security of runtime process in iOS, iPadOS, and visionOS”](https://support.apple.com/guide/security/security-of-runtime-process-sec15bfe098e/web).
   Selected for the platform sandbox, private home directory, entitlement,
   background-processing, and executable-memory model.
6. Installed Xcode 27 SDK,
   `FoundationModels.framework/Modules/FoundationModels.swiftmodule/arm64e-apple-ios.swiftinterface`.
   Selected as the exact local public interface used to confirm iOS 26
   availability declarations. It is environment evidence, not a web citation.

## Stop decision

**Coverage reached.** Every required Mac-host responsibility has a local owner,
an explicit optional remote owner, or a stable unavailable disposition.
Additional reading cannot answer the remaining material questions; they require
Hermes, SQLite, Foundation Models, and physical-iPad spikes. Research therefore
stops at architecture saturation rather than speculating about runtime quality.
