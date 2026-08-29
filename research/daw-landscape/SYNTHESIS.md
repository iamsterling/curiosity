# Cross-product DAW architecture synthesis

> Research synthesis, not implementation, procurement, security-acceptance, or
> legal authority. Product behavior may be clean-room adapted only at the level
> of abstract mechanisms. Evidence cutoff: 2026-08-29 UTC.

## 0. Decision and evidence state

The governed corpus contains 81 structurally complete product-family dossiers.
This synthesis answers the decision in [`DECISION-FRAME.md`](DECISION-FRAME.md):
what architecture a new cross-platform DAW should use, which recurring patterns
should be adapted or rejected, and which unknowns require bounded prototypes.

Labels used below:

- **DOCUMENTED CORPUS PATTERN** — supported by cited dossier claims across more
  than one product family. It documents public behavior, not shared internals.
- **ARCHITECTURE RECOMMENDATION** — a clean-room design inference from those
  patterns; alternatives remain possible.
- **UNKNOWN / PROTOTYPE REQUIRED** — documentary evidence cannot establish the
  required runtime or legal result.

## 1. Executive decision

Build a **local-first, versioned project system over one typed signal graph**.
Expose that graph through synchronized timeline, launcher, mixer, and optional
modular/notation views rather than implementing separate engines. Compile graph
edits off the audio thread into immutable processing snapshots. Schedule normal
paths across a real-time worker pool while treating armed/monitored paths as an
explicit low-latency critical path.

Treat third-party plug-ins as **untrusted, replaceable dependencies**:

1. scan and validate outside the DAW process;
2. preserve stable identity, opaque state, I/O shape, automation, and a rendered
   fallback even when a plug-in is unavailable;
3. default third-party runtime to isolated workers, with explicit compatibility
   modes rather than one hidden execution policy; and
4. qualify format support through separate acceptance, scan, instantiate,
   realtime, offline, state, migration, and fault-containment gates.

For a desktop-first product, prioritize **VST3 on Windows/macOS/Linux** and
**AUv2 on macOS**. Add **AUv3** when the macOS ecosystem or an iOS product is in
scope, and **CLAP** as the next portable desktop adapter. Keep VST2 behind an
entity-specific legal/provenance gate; do not promise it merely because legacy
hosts still load it. Treat LV2 as a later Linux/open-ecosystem adapter. Do not
plan AAX, Rack Extension, JSFX, DirectX/DXi, LADSPA, or DSSI as initial general
host formats.

## 2. Cross-product findings

### 2.1 Workflow and user model

**DOCUMENTED CORPUS PATTERN.** Linear arrangement remains the common backbone,
but successful products add alternate projections: Live shares tracks/mixer
between Arrangement and Session clips; Bitwig has separate Arranger/Launcher
data with per-track arbitration; Logic combines regions, Live Loops, pattern,
score, and comping; Reason links track panels to rack routing; energyXT exposes
graph, sequencer, and mixer projections. ([Ableton C-004](dossiers/ableton-live.md#21-claims-register),
[Bitwig C-005](dossiers/bitwig-studio.md#21-claims-register),
[Logic C-003](dossiers/apple-logic-pro.md#21-claims-register),
[Reason C-009](dossiers/reason-studios-reason.md#21-claims-register),
[energyXT C-028](dossiers/energyxt.md#21-claims-register))

**ARCHITECTURE RECOMMENDATION.** Keep one durable object model and permit
multiple projections. Core objects should be `Project`, `Timeline`, `Track`,
`Clip`, `MediaAsset`, `SignalNode`, `Port`, `Route`, `AutomationLane`,
`PluginInstance`, `RenderArtifact`, and `Snapshot`. A view must not own hidden
signal state that another view cannot persist or diagnose.

### 2.2 Audio graph, scheduling, and latency

**DOCUMENTED CORPUS PATTERN.** Public/open evidence supports typed dependency
graphs, explicit routing stages, and deadline-sensitive parallel work. Ardour
schedules dependency-ready route nodes across real-time workers; LMMS queues
ready acyclic mixer channels; Logic documents a serial live path that can
bottleneck one thread; Live exposes buffer-deadline and per-track load behavior.
([Ardour C-005](dossiers/ardour.md#21-claims-register),
[LMMS C-006](dossiers/lmms.md#21-claims-register),
[Logic C-034](dossiers/apple-logic-pro.md#21-claims-register),
[Ableton C-006](dossiers/ableton-live.md#21-claims-register))

**ARCHITECTURE RECOMMENDATION.** Use a control-plane graph compiler and an
immutable real-time snapshot. Schedule topologically, expose the longest serial
critical path, and distinguish:

- monitored/armed low-latency work;
- safely buffered playback work;
- disk read/write workers;
- offline render workers; and
- plug-in IPC workers.

PDC must cover tracks, buses, sends/returns, sidechains, and bypass state. A
user-visible reduced-latency mode may trade alignment for monitoring latency,
but the trade must be explicit. ([Ableton C-022](dossiers/ableton-live.md#21-claims-register),
[Logic C-024](dossiers/apple-logic-pro.md#21-claims-register),
[Ardour C-008](dossiers/ardour.md#21-claims-register))

### 2.3 Editing, clips, automation, and rendering

**DOCUMENTED CORPUS PATTERN.** Reference-based clips, takes/comping, linked or
aliased material, typed automation, freeze, and offline render recur, but exact
tail and automation semantics vary. Live explicitly differentiates Session and
Arrangement freeze behavior; Audition distinguishes destructive waveform
operations from nondestructive multitrack edits; Rosegarden retains performance
timing separately from notation quantization. ([Ableton C-005](dossiers/ableton-live.md#21-claims-register),
[Audition C-004](dossiers/adobe-audition.md#21-claims-register),
[Rosegarden C-004](dossiers/rosegarden.md#21-claims-register))

**ARCHITECTURE RECOMMENDATION.** Model edits as operations over durable object
IDs and source ranges. Destructive media transforms must create a new version or
require an explicit destructive command. Freeze/bounce artifacts need provenance,
dependency fingerprints, tail policy, and deterministic invalidation.

### 2.4 MIDI, expression, notation, and synchronization

**DOCUMENTED CORPUS PATTERN.** MIDI sequencing is common, while notation,
MPE/per-note expression, MIDI 2.0, SysEx, and event fidelity are uneven. Logic
and Rosegarden demonstrate that score/pattern/performance representations need
more structure than a flattened MIDI file; Bitwig demonstrates per-note
expression and polyphonic modulation at device boundaries. ([Logic C-008](dossiers/apple-logic-pro.md#21-claims-register),
[Rosegarden C-003–C-004](dossiers/rosegarden.md#21-claims-register),
[Bitwig C-023](dossiers/bitwig-studio.md#21-claims-register))

**ARCHITECTURE RECOMMENDATION.** Use timestamped typed events with stable note
identity and extensible expression payloads. Keep notation semantics and
performance timing as related but distinct data. Convert to MIDI 1, MIDI 2/UMP,
or format-specific events only at adapters.

### 2.5 Routing, mixing, delivery, and interchange

**DOCUMENTED CORPUS PATTERN.** Mature products expose route taps, sidechains,
multi-output instruments, buses, sends, control protocols, stems, and bounded
interchange. Format exchange is routinely lossy: Cubase documents DAWproject
object mappings, Logic documents bounded AAF/FCPXML/ADM exchange, and Audition
documents OMF/FCP XML/archive behavior. ([Ableton C-012](dossiers/ableton-live.md#21-claims-register),
[Cubase C-022–C-023](dossiers/steinberg-cubase.md#21-claims-register),
[Logic C-031](dossiers/apple-logic-pro.md#21-claims-register),
[Audition C-025–C-026](dossiers/adobe-audition.md#21-claims-register))

**ARCHITECTURE RECOMMENDATION.** Represent channel layouts, main/aux/event
ports, sidechains, and route taps explicitly. Interchange adapters must produce
a machine-readable loss report and rendered fallbacks; no external format
should become the internal project model.

### 2.6 Plug-in lifecycle and reliability

**DOCUMENTED CORPUS PATTERN.** Mature hosts expose scan databases, rescan/reset,
failure states, diagnostics, and recovery, yet accepted format support does not
prove full runtime conformance. Live suppresses repeated scan crashes; Studio
One uses an external VST scanner and recovery UI; Ardour uses helper scanners,
caches, blacklists, logs, and timeouts; Logic exposes compatibility and quit
counts. ([Ableton C-016–C-017](dossiers/ableton-live.md#21-claims-register),
[Studio One C-016–C-018](dossiers/presonus-studio-one.md#21-claims-register),
[Ardour C-012](dossiers/ardour.md#21-claims-register),
[Logic C-015](dossiers/apple-logic-pro.md#21-claims-register))

**DOCUMENTED CORPUS PATTERN.** Runtime policies range from native/in-process to
shared or dedicated workers. Bitwig exposes five hosting modes, REAPER exposes
native/shared/dedicated/bridge modes, and Apple documents Logic containment of
AU failures on Apple silicon. ([Bitwig C-015–C-016](dossiers/bitwig-studio.md#21-claims-register),
[REAPER C-019](dossiers/cockos-reaper.md#21-claims-register),
[Logic C-017](dossiers/apple-logic-pro.md#21-claims-register))

**ARCHITECTURE RECOMMENDATION.** Always isolate scanning. Default third-party
DSP to a separate worker with shared-memory audio/event transport. Offer
per-instance isolation for unknown/faulting plug-ins, grouped workers for proven
compatibility/performance, and in-process execution only for trusted built-ins
or an explicit compatibility override. Worker failure must never remove the
project node or its opaque state.

### 2.7 Project durability and portability

**DOCUMENTED CORPUS PATTERN.** Durable products separate project metadata from
media and plug-in binaries, retain backups, and preserve unavailable dependencies.
Ardour uses a versioned bundle, snapshots, backup plus temporary-file rename,
and missing-plug-in placeholders; REAPER exposes text projects, backup/version
saves, relative paths, and media collection; Reason preserves missing VST state;
Rosegarden demonstrates both atomic replacement and the danger of resaving when
audio/plugins are unavailable. ([Ardour C-018–C-021](dossiers/ardour.md#21-claims-register),
[REAPER C-035–C-037](dossiers/cockos-reaper.md#21-claims-register),
[Reason C-020](dossiers/reason-studios-reason.md#21-claims-register),
[Rosegarden C-022–C-023, C-033](dossiers/rosegarden.md#21-claims-register))

**ARCHITECTURE RECOMMENDATION.** Use a versioned manifest with stable IDs,
content-addressed or checksummed media references, opaque plug-in state, and
append-only recovery metadata. Save through validated temporary output,
`fsync`, atomic replacement, and retained snapshots. A missing dependency must
round-trip without discarding identity, state, automation, I/O shape, or assets.

### 2.8 Extension and control boundaries

**DOCUMENTED CORPUS PATTERN.** Strong products separate realtime binary plug-ins
from scripting/control extensions: Max for Live exposes a bounded object model;
REAPER separates ReaScript, JSFX, and native extensions; Ardour separates Lua
actions/hooks/DSP contexts; Pro Tools exposes an external certificate-validated
scripting SDK. ([Ableton C-026](dossiers/ableton-live.md#21-claims-register),
[REAPER C-027–C-031](dossiers/cockos-reaper.md#21-claims-register),
[Ardour C-020](dossiers/ardour.md#21-claims-register),
[Pro Tools C-021](dossiers/avid-pro-tools.md#21-claims-register))

**ARCHITECTURE RECOMMENDATION.** Provide a versioned command/object API with
capabilities, stable IDs, subscriptions, undo transactions, and explicit
threading rules. Scripts must not run on the audio thread by default. Native DSP
authoring is a distinct ABI and should not be exposed until its compatibility
and security model is sustainable.

### 2.9 Accessibility, observability, and security

**DOCUMENTED CORPUS PATTERN.** Host accessibility and third-party editor
accessibility are separate boundaries. Live documents screen-reader support and
known gaps; Audition publishes platform accessibility reports; Logic documents
ongoing VoiceOver work. Resource meters and per-plug-in diagnostics recur in
Live, LUNA, Ardour, and REAPER. ([Ableton C-031](dossiers/ableton-live.md#21-claims-register),
[Audition C-031](dossiers/adobe-audition.md#21-claims-register),
[Logic C-035](dossiers/apple-logic-pro.md#21-claims-register),
[LUNA C-025](dossiers/universal-audio-luna.md#21-claims-register),
[Ardour C-028](dossiers/ardour.md#21-claims-register))

**ARCHITECTURE RECOMMENDATION.** Make the entire host operable by keyboard and
platform accessibility APIs. Supply an accessible generated parameter editor
when a custom plug-in UI is unusable. Expose graph critical path, deadline load,
disk load, plug-in worker health, latency, xruns, scan status, and recovery logs.

### 2.10 Collaboration and local/cloud state

**DOCUMENTED CORPUS PATTERN.** BandLab demonstrates revisions, invitations,
forks, and recovery, but also documents device-local takes, cookie-local MIDI
mappings, internet-dependent saves, and manual reconstruction after sync failure.
([BandLab C-005–C-008, C-021–C-023, C-030](dossiers/bandlab-studio.md#21-claims-register))

**ARCHITECTURE RECOMMENDATION.** Keep a complete local journal and make cloud
sync optional. Classify every state object as project-durable, user-profile,
device-local cache, or ephemeral. Never leave takes, mappings, or plug-in state
implicitly local without export/recovery UX.

## 3. Architecture requirements

| ID | Requirement | Acceptance signal |
| --- | --- | --- |
| AR-001 | One versioned domain model shall back timeline, launcher, mixer, and graph views. | An edit in any view round-trips identically through all others. |
| AR-002 | Signal nodes and ports shall be typed for audio, events, parameters, sidechains, and control. | Invalid routes fail before publication to the audio thread. |
| AR-003 | Graph mutation shall compile off-thread to an immutable realtime snapshot. | Structural edits during playback neither lock nor allocate on the callback. |
| AR-004 | Scheduling shall expose monitored and buffered paths plus the graph critical path. | Diagnostics identify the serial bottleneck under a reproducible overload. |
| AR-005 | PDC shall include tracks, buses, sends/returns, sidechains, bypass, and latency changes. | Impulse fixtures align for realtime and offline paths. |
| AR-006 | Freeze/render artifacts shall record dependencies, latency, tails, and invalidation state. | A changed dependency visibly invalidates and safely rebuilds the artifact. |
| AR-007 | Plug-in scanning shall run outside the DAW process with timeout, cancellation, cache versioning, and failure attribution. | Crash/hang/malformed fixtures cannot crash or indefinitely block the DAW. |
| AR-008 | Runtime workers shall support isolated, grouped, and explicit compatibility modes. | A worker crash removes no project state and can be restarted or bypassed. |
| AR-009 | Plug-in identity shall retain format, vendor, stable component ID, architecture, version, role, and I/O/state metadata. | Duplicates and upgrades resolve deterministically with an auditable decision. |
| AR-010 | Missing plug-ins shall remain durable placeholders. | Remove, open, edit, resave, restore, and recover identical state/automation/routes. |
| AR-011 | Project saves shall be versioned, atomic, recoverable, and independent of installed plug-in binaries. | Fault injection at every save boundary leaves a valid prior or new snapshot. |
| AR-012 | Media shall use stable IDs plus relink, collect, checksum, and rendered-fallback workflows. | Moved/missing/restored media survives project round trips without silent substitution. |
| AR-013 | Interchange shall be adapter-based and emit a structured loss report. | Unsupported objects are rendered, mapped, or explicitly reported—never silently dropped. |
| AR-014 | Script/control APIs shall be versioned, capability-scoped, undo-aware, and non-realtime by default. | Extensions cannot block the callback or access undeclared capabilities. |
| AR-015 | Host controls and generated plug-in parameter UIs shall meet keyboard and accessibility-API requirements. | Automated accessibility audit covers the host and generic editor. |
| AR-016 | Cloud features shall preserve a complete local journal and explicit state-class boundaries. | Offline edits recover and later reconcile without losing takes, mappings, or plug-in state. |
| AR-017 | Format claims shall be gated separately for accept, scan, instantiate, process, render, state, migration, and failure recovery. | Release metadata names only the gates that pass the qualification corpus. |
| AR-018 | Third-party code shall be treated as untrusted at scan, UI, DSP, and state-load boundaries. | Security tests exercise malformed metadata/state and worker fault containment. |
| AR-019 | Built-in devices shall use a private, versioned internal interface distinct from public plug-in adapters. | Internal ABI changes do not alter project-level device identity or state migration. |
| AR-020 | Format/SDK/trademark/distribution decisions shall have a provenance and legal gate. | No adapter ships without pinned terms, counsel/owner decision, and artifact provenance. |

## 4. Plug-in format roadmap

Assumption: first release is a 64-bit desktop DAW for Windows, macOS, and Linux.
If iOS becomes a release target, AUv3 becomes mandatory for that product and the
desktop matrix must not be projected onto it.

| Format | Initial disposition | Rationale |
| --- | --- | --- |
| VST3 | **MUST / first adapter** | Cross-platform current host evidence; rich typed buses/events/state; current SDK repository is MIT. Product conformance still requires fixtures. ([Cubase C-012, C-015–C-017, C-025](dossiers/steinberg-cubase.md#21-claims-register)) |
| AUv2 | **MUST on macOS** | Material installed ecosystem and documented current hosting in Logic, Live, Ardour, and LUNA. ([Logic C-012](dossiers/apple-logic-pro.md#21-claims-register), [Ableton C-014](dossiers/ableton-live.md#21-claims-register), [Ardour C-011](dossiers/ardour.md#21-claims-register)) |
| AUv3 | **SHOULD on macOS; MUST on iOS** | Current Logic/Live support and mandatory extension model for modern iOS hosts; process/state semantics differ from AUv2 and need separate qualification. ([Logic C-012, C-040](dossiers/apple-logic-pro.md#21-claims-register), [Ableton C-014](dossiers/ableton-live.md#21-claims-register)) |
| CLAP | **SHOULD / second portable adapter** | Current cross-platform adoption and polyphonic modulation evidence in Bitwig and REAPER; still smaller than VST3/AU coverage in this corpus. ([Bitwig C-010, C-023](dossiers/bitwig-studio.md#21-claims-register), [REAPER C-017](dossiers/cockos-reaper.md#21-claims-register)) |
| VST2 | **CONDITIONAL, legal gate before engineering commitment** | Still loaded by major hosts, often as legacy/disabled/translated compatibility, while format-owner terms and redistribution rights are constrained. ([Cubase C-003–C-004, C-026–C-027](dossiers/steinberg-cubase.md#21-claims-register), [Ardour C-024](dossiers/ardour.md#21-claims-register), [LMMS C-033](dossiers/lmms.md#21-claims-register)) |
| LV2 | **CONDITIONAL Linux/open-ecosystem phase** | Strong open-host evidence in Ardour/Rosegarden, but host-contract breadth and packaging vary. ([Ardour C-011–C-013](dossiers/ardour.md#21-claims-register), [Rosegarden C-011–C-017](dossiers/rosegarden.md#21-claims-register)) |
| AAX | **DO NOT HOST initially** | AAX is the Pro Tools host boundary with program, signing, and iLok obligations, not a general cross-DAW requirement. ([Pro Tools C-012–C-013, C-024](dossiers/avid-pro-tools.md#21-claims-register)) |
| LADSPA/DSSI | **DO NOT HOST initially** | Legacy Linux value does not justify first-release lifecycle/state/UI complexity; preserve adapter seams. |
| DirectX/DXi | **DO NOT HOST** | Legacy Windows-specific path with weak portability and modern ecosystem value. |
| JSFX | **DO NOT HOST as a compatibility claim** | REAPER-specific processor/script ecosystem; create an independent native DSP script only if product requirements justify it. ([REAPER C-031](dossiers/cockos-reaper.md#21-claims-register)) |
| Rack Extension | **DO NOT HOST** | Proprietary Reason ecosystem and distribution model. ([Reason C-023–C-030](dossiers/reason-studios-reason.md#21-claims-register)) |

## 5. Rejected and conditional patterns

- **Reject one in-process trust domain for arbitrary third-party code.** It gives
  low IPC cost but unacceptable crash/security blast radius.
- **Reject “supports format X” as an interoperability acceptance criterion.**
  Scan, instantiate, render, state, migration, UI, latency, and recovery are
  separate gates. ([Logic C-042](dossiers/apple-logic-pro.md#21-claims-register),
  [REAPER C-056](dossiers/cockos-reaper.md#21-claims-register))
- **Reject silent deletion of unavailable dependencies.** Preserve placeholders
  and rendered fallbacks.
- **Reject direct overwrite before validating a new project file.** Traverso's
  public path writes the live file before making its backup, exposing a failure
  window. ([Traverso C-026](dossiers/traverso-daw.md#21-claims-register))
- **Reject cloud-only durability.** A network or account failure must not make
  local work unsaveable.
- **Reject VST2 implementation by historical popularity alone.** Require an
  entity-specific rights decision; this document is not legal advice.
- **Conditional:** per-plug-in processes improve containment but need realtime
  IPC, state replay, UI hosting, latency, and resource prototypes.
- **Conditional:** a public native-device SDK can deepen an ecosystem but creates
  a long-lived ABI, security, compatibility, and support obligation.

## 6. Prototype handoff and remaining unknowns

Documentary research cannot select the final IPC topology, worker granularity,
automation timing implementation, state replay protocol, or VST2 legal path.
Those decisions move to [`PLUGIN-QUALIFICATION-PLAN.md`](PLUGIN-QUALIFICATION-PLAN.md).

Highest-value unresolved prototypes:

1. shared-memory realtime plug-in worker with crash/hang recovery;
2. VST3 and AUv2/AUv3 bus/event/state/latency/tail conformance;
3. missing-plug-in save/resave/restore durability;
4. sample-accurate automation and dynamic-latency changes across buffer sizes;
5. atomic project save with injected process/filesystem failures; and
6. accessible generic plug-in editor plus custom-editor focus/scaling boundary.

## 7. Curiosity pass and stop decision

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Runtime plug-in worker topology | 4/4 | 4/4 | 4/4 | 4/4 | **Pursue as prototype**, not more documentary search. |
| VST3/AU contract edge cases | 4/4 | 4/4 | 3/4 | 3/4 | **Pursue with owned fixtures.** |
| VST2 rights for the implementing entity | 4/4 | 4/4 | 2/4 | 4/4 | **Route to counsel/format owner before code.** |
| Exhaustive additional DAW census | 1/4 | 1/4 | 1/4 | 4/4 | `CURIOSITY_NO_GO`; 81 families cover every decision dimension. |
| More vendor architecture inference | 2/4 | 1/4 | 1/4 | 4/4 | `CURIOSITY_NO_GO`; proprietary internals remain unknown. |
| Copy project schemas or protected UI expression | 0/4 | 0/4 | 0/4 | 4/4 | `CURIOSITY_NO_GO`; outside clean-room authority. |

**Stop decision:** `STOP_DOCUMENTARY_COVERAGE_AND_SATURATION`. All 81 roster
targets satisfy the dossier contract, recurring architecture patterns are
represented across mainstream, open-source, post, tracker/modular, cloud,
mobile, and historical families, and remaining decision-critical uncertainty is
runtime/legal rather than documentary. Further broad searching has nonpositive
marginal value.
