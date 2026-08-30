# ARM64 Apple-platform DAW architecture synthesis

> Corrected research synthesis for a native ARM64 product spanning
> Apple-silicon macOS, iPadOS, and iOS on iPhone. This is not implementation,
> procurement, security-acceptance, App Store, or legal authority. Evidence
> cutoff: 2026-08-29 UTC.

## 0. Corrected decision boundary

The 81-dossier corpus remains useful because it covers workflow, engine,
persistence, failure, and interoperability patterns broadly. The product target
is now narrower:

- native ARM64 only;
- Apple-silicon macOS, iPadOS, and iPhone;
- one project model across all product surfaces;
- AUv3 as the only initial third-party DSP format that can span every surface;
- AUv2 and VST3 as macOS-only compatibility formats; and
- no initial Intel build, Rosetta host mode, architecture bridge, Windows,
  Linux, Android, or browser product.

CLAP, LV2, AAX, LADSPA, DSSI, JSFX, DirectX/DXi, and Rack Extension remain
research context, not initial host commitments. VST2 remains a conditional
macOS-only goal: preserve its adapter seam, but do not implement or ship it
until an entity-specific legal/provenance gate approves the work.

Labels:

- **DOCUMENTED CORPUS PATTERN** — public behavior supported by cited dossier
  claims; it does not prove shared internals.
- **ARCHITECTURE RECOMMENDATION** — a clean-room inference for this product.
- **UNKNOWN / PROTOTYPE REQUIRED** — the corpus cannot establish runtime or
  legal correctness.

## 1. Executive decision

Build one **local-first, versioned DAW domain and audio engine** with adaptive
macOS, iPad, and iPhone shells. Timeline, launcher, mixer, touch controls, and
optional modular or score editors should be synchronized projections over the
same project and typed signal graph—not separate product files or engines.

Compile graph mutations away from the realtime callback into immutable
processing snapshots. Use capability profiles to adapt screen layout, available
I/O, memory/CPU budgets, and plug-in availability without deleting unsupported
objects. A project opened on a less-capable device must retain unavailable
tracks, routes, plug-in state, automation, and assets while using a rendered
fallback where possible.

Treat Audio Units and macOS VST3 plug-ins as untrusted dependencies:

1. discover and validate them outside the main DAW process where the platform
   permits;
2. preserve identity, opaque state, I/O shape, automation, and rendered fallback;
3. use isolated runtime workers by default on macOS and platform extension
   containment on iPadOS/iOS;
4. never auto-substitute AUv2, AUv3, and VST3 solely because names/vendors match;
   and
5. qualify every OS/format pair independently.

The implementation order is **AUv3 vertical slice first**, then macOS AUv2, then
macOS VST3, followed by a legally gated macOS VST2 decision. This maximizes
shared behavior across Mac, iPad, and iPhone before adding desktop-only
compatibility paths.

## 2. Product and workflow architecture

### 2.1 One domain, adaptive surfaces

**DOCUMENTED CORPUS PATTERN.** Live and Bitwig share track/mixer state across
linear and launcher workflows; Logic combines linear regions, Live Loops,
patterns, score, comping, and touch-oriented iPad workflows; Loopy Pro combines
clips, arranger, mixer, AU hosting, actions, and customizable touch controls.
([Ableton C-004](dossiers/ableton-live.md#21-claims-register),
[Bitwig C-005](dossiers/bitwig-studio.md#21-claims-register),
[Logic C-003](dossiers/apple-logic-pro.md#21-claims-register),
[Loopy Pro C-004–C-009](dossiers/loopy-pro.md#21-claims-register))

**ARCHITECTURE RECOMMENDATION.** Core durable objects should include `Project`,
`Timeline`, `Track`, `Clip`, `MediaAsset`, `SignalNode`, `Port`, `Route`,
`AutomationLane`, `PluginDependency`, `PluginInstance`, `RenderArtifact`, and
`Snapshot`. Every object has a stable ID independent of view, device, or plug-in
format.

Surface profiles:

| Surface | Product profile |
| --- | --- |
| Apple-silicon Mac | Full editing/mixing, multiwindow workflows, broad hardware I/O, AUv3/AUv2/VST3 hosting, conditional VST2, and offline/batch rendering. |
| iPad | Full project fidelity with touch-first arrangement/mixing, AUv3 hosting, hardware audio/MIDI, adaptive multiwindow/external-display behavior where supported. |
| iPhone | Same project schema and audio engine semantics, compact performance/capture/edit surfaces, AUv3 hosting subject to device resources. |

Feature presentation may differ; persistence semantics may not. Logic's partial
Mac/iPad roundtrip and disabled incompatible plug-ins show why capability
differences must be explicit rather than inferred from a common file extension.
([Logic C-028, C-031](dossiers/apple-logic-pro.md#21-claims-register))

### 2.2 Touch, keyboard, pointer, and accessibility

**ARCHITECTURE RECOMMENDATION.** Commands must be input-modality independent.
Gestures, keyboard shortcuts, pointer actions, MIDI mappings, and accessibility
actions should invoke the same undoable command layer. iPhone must not receive a
scaled-down Mac UI; it needs compact navigation, performance, capture, and
focused editing projections over the same objects.

Host controls and generated plug-in parameter editors must expose labels,
values, grouping, focus order, and actions through Apple accessibility APIs.
Third-party custom UI accessibility is a separate boundary and cannot be
promised by the host. Live and Logic document both accessibility work and gaps,
supporting an explicit host/custom-UI distinction. ([Ableton C-031](dossiers/ableton-live.md#21-claims-register),
[Logic C-035](dossiers/apple-logic-pro.md#21-claims-register))

## 3. Audio engine and realtime model

### 3.1 Typed graph and immutable snapshots

**DOCUMENTED CORPUS PATTERN.** Ardour publicly exposes dependency-ready graph
scheduling, explicit audio/MIDI routing, sidechains, latency propagation, and
dynamic configurations. Logic documents that a live track and dependent signal
path can form a single-thread critical path. ([Ardour C-005, C-007–C-008,
C-015](dossiers/ardour.md#21-claims-register),
[Logic C-034](dossiers/apple-logic-pro.md#21-claims-register))

**ARCHITECTURE RECOMMENDATION.** Keep mutable project/control state off the
audio callback. Validate and compile changes into an immutable graph snapshot,
then publish it atomically at a render boundary. Ports are typed for audio,
events, sidechain, parameter, clock, and control. The engine must reject illegal
cycles/layouts before publication.

### 3.2 Scheduling profiles

Use one scheduling model with platform-specific resource budgets:

- monitored/armed paths receive the smallest supported device quantum;
- playback-only paths may use safe lookahead/buffering;
- disk, waveform, analysis, and project serialization run off the realtime path;
- offline render is a distinct execution profile over the same graph semantics;
- plug-in IPC/extension lifecycle never blocks the audio callback; and
- diagnostics expose the longest serial path, deadline load, xruns, worker
  state, disk pressure, and memory pressure.

Smaller iPhone/iPad budgets may cap simultaneous live nodes or choose rendered
fallbacks, but cannot silently alter routing, automation, latency, or saved
state.

### 3.3 Latency, tails, and rendering

PDC must cover tracks, buses, sends/returns, sidechains, bypass state, and
dynamic latency changes. A low-latency monitoring mode may trade global
alignment for responsiveness only with a visible state and deterministic bounce
behavior. Live, Logic, and Ardour document full-path compensation concerns,
while their remaining tail/dynamic details reinforce the need for fixtures.
([Ableton C-022, C-025](dossiers/ableton-live.md#21-claims-register),
[Logic C-024, C-040](dossiers/apple-logic-pro.md#21-claims-register),
[Ardour C-008](dossiers/ardour.md#21-claims-register))

Freeze/bounce artifacts require source/dependency fingerprints, plug-in version
and format, latency, tail policy, render settings, and visible stale state.

### 3.4 Mobile lifecycle

**UNKNOWN / PROTOTYPE REQUIRED.** Documentary evidence does not select the
correct handling for every iPad/iPhone interruption, route change, sample-rate
change, memory warning, extension termination, background transition, or device
loss.

**ARCHITECTURE RECOMMENDATION.** Platform events enter a non-realtime lifecycle
coordinator that can quiesce, rebuild, checkpoint, and resume the graph. The
project journal and latest valid render snapshot must survive host or AUv3
extension termination.

## 4. Plug-in architecture corrected for Apple ARM64

### 4.1 Format strategy

| Format | macOS ARM64 | iPadOS | iPhone | Initial disposition |
| --- | --- | --- | --- | --- |
| AUv3 | **MUST** | **MUST** | **MUST** | Primary cross-device plug-in format and first vertical slice. |
| AUv2 | **MUST for compatibility** | Not applicable | Not applicable | macOS-only adapter; native ARM64 components only. |
| VST3 | **SHOULD** | Not applicable | Not applicable | macOS-only compatibility adapter after AU paths. |
| VST2 | **CONDITIONAL** | Not applicable | Not applicable | macOS-only compatibility goal after entity-specific legal/provenance approval; native ARM64 only. |
| CLAP | Later decision | Not applicable | Not applicable | Technically relevant on macOS but adds no cross-device reach. |
| Other surveyed formats | No | No | No | Preserve architectural seams; no initial product commitment. |

Logic documents AUv2/AUv3 on Mac and AUv3 on iPad; Live documents AUv2/AUv3
on Mac; Loopy Pro documents AUv3 instrument/effect/MIDI hosting on iOS.
([Logic C-012, C-021–C-022](dossiers/apple-logic-pro.md#21-claims-register),
[Ableton C-014](dossiers/ableton-live.md#21-claims-register),
[Loopy Pro C-019–C-021](dossiers/loopy-pro.md#21-claims-register))

VST3 remains valuable for Mac session compatibility and vendor coverage, but it
cannot be the cross-device canonical dependency. LUNA explicitly recommends
VST3 over AU for its Windows/macOS portability; in this corrected Apple-only
target, the analogous portability priority is AUv3 across Mac/mobile.
([LUNA C-014–C-015, C-022](dossiers/universal-audio-luna.md#21-claims-register))

VST2 remains materially relevant to the requested legacy ecosystem, but current
hosts increasingly treat it as disabled, translated, or legacy compatibility.
The architecture should reserve a format adapter and placeholder identity while
the qualification plan's G0 review decides whether this entity may build and
distribute a native ARM64 host. ([Cubase C-003–C-004, C-026–C-027](dossiers/steinberg-cubase.md#21-claims-register),
[Ardour C-024](dossiers/ardour.md#21-claims-register))

### 4.2 Native ARM64 policy

- Ship only native ARM64 application, engine, scanner, workers, and plug-in
  adapters.
- On macOS, reject Intel-only AU/VST bundles with a stable diagnostic and render
  fallback; do not launch the DAW under Rosetta.
- Do not build a 32-bit or x86_64 bridge.
- Record plug-in architecture in dependency identity and support bundles.

Logic demonstrates that Rosetta and ARA modes can create product capability
cliffs, while Bitwig documents architecture-specific host complexity. Avoiding
translation is an intentional product constraint, not an assumption that all
Mac plug-ins are already native. ([Logic C-019–C-020, C-039](dossiers/apple-logic-pro.md#21-claims-register),
[Bitwig C-019–C-020](dossiers/bitwig-studio.md#21-claims-register))

### 4.3 Discovery and execution boundaries

**macOS:** scan AUv2, AUv3, VST3, and any approved VST2 adapter in disposable
helper processes with timeouts, cancellation, cache versioning, duplicate
detection, crash attribution, and reset/rescan UX. Run third-party DSP in
isolated ARM64 workers by default. AUv2, VST3, and approved VST2 require
host-designed worker containment; AUv3 process semantics still require
qualification rather than inference from framework defaults.

**iPad/iPhone:** discover installed AUv3 App Extensions through platform APIs;
there is no arbitrary VST/AUv2 folder scan. Treat extension launch, suspension,
termination, memory limits, and UI availability as explicit lifecycle states.

Logic documents AU failure containment on Apple silicon but leaves exact
process/IPC choices unknown. That is evidence for the outcome, not an
implementation blueprint. ([Logic C-017–C-018, C-040](dossiers/apple-logic-pro.md#21-claims-register))

### 4.4 Identity and cross-device dependency rules

`PluginDependency` stores:

- format and platform scope;
- manufacturer/type/subtype or format-native stable component ID;
- bundle/package identifier and code architecture;
- version and display metadata;
- instrument/effect/MIDI role;
- declared I/O and parameter metadata;
- opaque state and external-asset references;
- automation and routing; and
- latest validated render fallback.

Do not infer equivalence between AUv2, AUv3, VST3, and VST2 variants.
Cross-format replacement is a user-authorized migration that must pass state and
audible-equivalence fixtures. Matching AUv3 identities across Mac, iPad, and
iPhone may enable direct recall only after the vendor pair passes the
qualification plan.

### 4.5 Missing and unavailable plug-ins

If a Mac project uses AUv2, VST3, or an approved VST2 adapter that is unavailable
on mobile, the mobile surface must:

1. preserve the complete placeholder and source automation/routing;
2. play the most recent validated rendered fallback if available;
3. mark the track as non-live/non-editable at that dependency;
4. permit unrelated edits without deleting opaque state; and
5. restore live processing when reopened on a capable Mac.

Logic's iPad behavior and bounce guidance demonstrate this product problem;
Ardour and Reason demonstrate durable placeholder mechanisms. ([Logic C-028–C-029](dossiers/apple-logic-pro.md#21-claims-register),
[Ardour C-018–C-019](dossiers/ardour.md#21-claims-register),
[Reason C-020](dossiers/reason-studios-reason.md#21-claims-register))

## 5. Project durability and cross-device portability

Use one versioned package schema across Mac, iPad, and iPhone. The package
contains a manifest, project object records, automation, opaque plug-in state,
media references or collected media, render artifacts, migrations, and an
append-only recovery journal.

Requirements:

- stable IDs must not depend on filesystem paths or UI indexes;
- save through validated temporary output, `fsync`, and atomic replacement;
- retain automatic snapshots and a last-known-good manifest;
- classify assets as embedded, package-relative, external-authorized, cloud
  mirrored, or missing;
- preserve external-file authorization metadata without making it the only
  locator;
- support collect/consolidate before transfer;
- maintain a capability manifest and structured portability report; and
- cloud/iCloud sync must be optional over a complete local journal.

Ardour and REAPER document versioned projects, backups, relative media, and
collection; Loopy Pro documents project bundles, continuously saved workspace,
save points, Files-visible backup, and AU-store export constraints.
([Ardour C-018–C-021](dossiers/ardour.md#21-claims-register),
[REAPER C-035–C-037](dossiers/cockos-reaper.md#21-claims-register),
[Loopy Pro C-029–C-030](dossiers/loopy-pro.md#21-claims-register))

## 6. Extension and integration boundary

Binary audio plug-ins, automation/control scripts, hardware control, and project
interchange are separate extension planes.

- Audio DSP: AUv3 across surfaces; AUv2/VST3 and conditionally VST2 on Mac.
- Commands/control: versioned capability-scoped object API, undo transactions,
  subscriptions, and no realtime execution by default.
- Hardware: MIDI/MPE, controller mappings, clock/sync, and surface feedback.
- Interchange: adapter-based audio/MIDI/DAWproject/AAF-style import/export only
  where product requirements justify it, always with a loss report.

Max for Live, ReaScript, Ardour Lua, and Pro Tools scripting demonstrate the
value of separating product automation from binary DSP formats.
([Ableton C-026](dossiers/ableton-live.md#21-claims-register),
[REAPER C-027–C-031](dossiers/cockos-reaper.md#21-claims-register),
[Ardour C-020](dossiers/ardour.md#21-claims-register),
[Pro Tools C-021](dossiers/avid-pro-tools.md#21-claims-register))

## 7. Apple-target architecture requirements

| ID | Requirement | Binary acceptance signal |
| --- | --- | --- |
| AAR-001 | One project schema shall round-trip across Mac, iPad, and iPhone. | A capability-limited device can open/edit/save without deleting unsupported objects. |
| AAR-002 | All shipped executables and plug-in workers shall be native ARM64. | Intel/32-bit fixtures are rejected without Rosetta or state loss. |
| AAR-003 | One typed graph/domain shall back all surface-specific views. | Equivalent commands produce identical persisted graph state on every surface. |
| AAR-004 | Graph changes shall compile off-thread to immutable realtime snapshots. | Playback edits allocate/lock neither callback nor extension render path. |
| AAR-005 | Device/session interruptions shall be coordinated and recoverable. | Route, sample-rate, foreground, interruption, and extension-loss fixtures resume or checkpoint deterministically. |
| AAR-006 | PDC shall include buses, sends, sidechains, bypass, and dynamic latency. | Impulse fixtures align across realtime, monitored, freeze, and offline paths. |
| AAR-007 | AUv3 shall be qualified separately on macOS, iPadOS, and iPhone. | Every applicable OS/device matrix passes all lifecycle gates. |
| AAR-008 | AUv2, VST3, and any approved VST2 adapter shall remain macOS-only dependency types. | Mobile roundtrip preserves placeholders and fallback renders without substitution. |
| AAR-009 | AUv2/AUv3/VST3/VST2 variants shall never auto-substitute by name. | Migration requires a validated mapping and explicit user action. |
| AAR-010 | macOS scanning shall occur outside the main DAW process. | Scan crash/hang/malformed fixtures cannot crash or block the DAW. |
| AAR-011 | Third-party runtime failure shall preserve graph and project state. | Extension/worker crash restarts, bypasses, or falls back without deleting the node. |
| AAR-012 | Missing plug-ins shall be durable placeholders. | Remove/open/edit/resave/restore reproduces original state, automation, and routes. |
| AAR-013 | Every unavailable live dependency should have a provenance-tracked render fallback. | A mobile device plays the validated fallback and reports staleness. |
| AAR-014 | Project saves shall be atomic, versioned, and locally recoverable. | Fault injection leaves a valid old or new snapshot on every surface. |
| AAR-015 | Plug-in and project external assets shall survive authorized move/relink workflows. | Moved/missing/restored asset fixtures retain identity and user intent. |
| AAR-016 | Host and generated parameter UI shall support keyboard, touch, and Apple accessibility APIs. | Automated and manual accessibility gates pass on all surfaces. |
| AAR-017 | Resource policy shall adapt without changing project semantics. | Low-memory/thermal fixtures reduce live capacity visibly and preserve saved state. |
| AAR-018 | Format support shall be gated separately for discovery, instantiate, process, render, state, migration, UI, and recovery. | Release metadata claims only the gates passed per OS. |
| AAR-019 | Extension APIs shall be versioned, capability-scoped, and non-realtime by default. | An extension cannot block audio or access undeclared capabilities. |
| AAR-020 | SDK, signing, entitlement, App Store, trademark, and distribution decisions shall be pinned. | No adapter ships without an approved provenance/terms record. |

## 8. Rejected and conditional patterns

- **Reject Intel/Rosetta compatibility as an initial requirement.** It multiplies
  host modes and defeats the native ARM64 boundary.
- **Reject an unconditional VST2 commitment.** It is macOS-only in this product,
  cannot reach iPad/iPhone, and has unresolved entity-specific rights. Preserve
  the seam and run the legal/provenance gate before implementation. ([Cubase C-003–C-004,
  C-026–C-027](dossiers/steinberg-cubase.md#21-claims-register),
  [Ardour C-024](dossiers/ardour.md#21-claims-register))
- **Reject VST3 as the canonical project dependency.** It is a Mac adapter, not
  a mobile format.
- **Reject assumed AUv2↔AUv3 state equivalence.** The formats and process models
  require separate fixtures.
- **Reject silent object deletion on a capability-limited device.** Preserve
  placeholders and fallbacks.
- **Reject cloud-only saves.** Local projects and recovery must work without an
  account or network.
- **Reject one giant shared third-party process.** A single fault must not remove
  unrelated plug-ins or the host.
- **Conditional:** AUv2/VST3 and approved VST2 isolated workers add IPC cost but
  are preferred if deadline and state-replay prototypes pass.
- **Conditional:** CLAP on macOS can be revisited after AU/VST3 quality and
  ecosystem demand are measured.

## 9. Prototype handoff

Highest-value prototypes are now Apple-specific:

1. AUv3 effect/instrument/state/UI vertical slice on Mac, iPad, and iPhone;
2. AUv3 extension termination, state replay, and mobile interruption recovery;
3. macOS AUv2 and VST3 isolated ARM64 worker with shared-memory realtime IPC;
4. Mac-only plug-in placeholder/render fallback roundtrip through iPad/iPhone;
5. sample-accurate automation, PDC, tails, and offline equivalence;
6. atomic package save under process/filesystem interruption; and
7. accessible generated plug-in UI across Mac, iPad, and iPhone; and
8. entity-specific VST2 G0 review, followed by a native ARM64 Mac slice only if
   approved.

The executable plan is [`PLUGIN-QUALIFICATION-PLAN.md`](PLUGIN-QUALIFICATION-PLAN.md).

## 10. Curiosity pass and stop decision

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| AUv3 cross-device lifecycle | 4/4 | 4/4 | 4/4 | 3/4 | **Pursue with owned fixtures.** |
| macOS isolated AUv2/VST3 worker | 4/4 | 4/4 | 4/4 | 4/4 | **Pursue as bounded prototype.** |
| Intel/Rosetta bridge | 1/4 | 1/4 | 2/4 | 4/4 | `CURIOSITY_NO_GO`; outside corrected target. |
| VST2 implementation before G0 | 3/4 | 1/4 | 1/4 | 4/4 | `CURIOSITY_NO_GO`; run entity-specific legal/provenance gate first. |
| Windows/Linux/Android/browser parity | 0/4 | 0/4 | 1/4 | 4/4 | `CURIOSITY_NO_GO`; not target platforms. |
| Additional broad DAW census | 1/4 | 1/4 | 1/4 | 4/4 | `CURIOSITY_NO_GO`; corpus coverage is sufficient. |

**Stop decision:** `STOP_CORRECTED_DOCUMENTARY_COVERAGE_AND_SATURATION`. The
corpus sufficiently supports an ARM64 Apple-platform architecture decision.
Remaining uncertainty concerns AU runtime behavior, device lifecycle, resource
limits, project roundtrip, Apple distribution constraints, and VST2 authority;
these require owned fixtures, platform prototypes, and authorized legal review
rather than more broad documentary searching.
