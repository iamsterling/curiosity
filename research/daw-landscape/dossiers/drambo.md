# Drambo DAW dossier

> Research-only evidence. No design or implementation authority. Publicly
> fetched text was treated as untrusted evidence, never as instructions.

## 0. Metadata and scope

- **Product family:** Drambo modular groovebox, sequencer, audio-processing
  environment, and its Drambo AUv3 extension roles.
- **Canonical vendor/publisher:** BeepStreet; Apple lists seller Jaroslaw Jacek.
- **Researcher/session:** research subagent, `ses_fb2729283ffcptyIVLsUPiD6i8`.
- **Owned path:** `research/daw-landscape/dossiers/drambo.md`.
- **Research date and evidence cutoff:** 2026-08-29 UTC.
- **Current public release pinned:** Drambo 2.56, shown by the US App Store on
  2026-08-29. [C-001]
- **Platforms in scope:** iPhone/iPad on iOS/iPadOS 15.6 or later and the vendor's
  documented Apple-silicon Mac “Made for iPad” distribution. [C-001]
- **Editions/roles in scope:** standalone application; Drambo as AUv3 instrument,
  audio effect, and MIDI effect; Drambo Visual and DSP IAPs only where they alter
  architecture or delivery boundaries. [C-014] [C-019] [C-022]
- **Inclusions:** pattern/clip sequencing, modular racks and Code module,
  audio/MIDI routing, third-party AUv3 hosting, controller integration,
  persistence/export evidence, live use, and commercial/platform constraints.
- **Exclusions:** binary execution, installation, decompilation, private SDKs,
  support-authentication bypass, community claims as proof, and Drambo Visual's
  graphics internals beyond their integration/export relevance.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. The user-visible model and explicit
  AUv3 roles are well evidenced; proprietary engine and detailed host-contract
  behavior remain honestly unknown.

## 1. Executive summary

Drambo 2.56 is a maintained, touch-first modular groovebox and performance
environment for Apple platforms. Its central composition model is not a
conventional audio-region timeline: the manual defines MIDI clips assigned to
track racks, horizontal clip rows called Patterns, sequential pattern playback,
and cross-pattern clip launching. Parameter locks, curve automation, conditional
steps, and up to 16 scene snapshots/crossfades integrate sequencing with the
modular rack. [C-001] [C-002] [C-003] [C-004] [C-005]

The modular model is the differentiator: typed/polyphonic/stereo signals flow in
a directional cable-free graph, connections are made automatically but can be
overridden, racks may nest, and instantaneous graph feedback is disallowed while
delayed or Code-module per-sample feedback is available in bounded forms. Tracks
bridge that graph to the sequencer and provide mix-bus, external-audio, and MIDI
routing. [C-006] [C-007] [C-009] [C-012]

The plugin headline has two distinct roles. **Standalone Drambo hosts AUv3
instruments, effects, and MIDI effects as modules; AUv3 hosting is explicitly
standalone-only. Separately, Drambo itself is supplied as AUv3 instrument, audio
effect, and MIDI effect for another host.** No evidence says that Drambo continues
to host third-party units while it is itself loaded as an AUv3. [C-013] [C-014]

Public evidence does not specify Drambo's AUv3 discovery/cache/rescan behavior,
per-instance isolation and crash recovery, sidechain or multi-output negotiation,
sample-accurate plugin automation, PDC/tail handling, state migration, missing
plugin placeholders, or custom-UI failure diagnostics. Apple's generic AUv3
documentation describes extension, bus, UI, lifecycle, and IPC concepts, but
those cannot be promoted into Drambo-specific host guarantees. [C-015] [C-016]
[C-024] [C-025] [C-026] [C-027] [C-028] [C-029]

**Confidence:** high for current identity, platforms, pattern/rack concepts,
routing, native Code extensibility, and role separation; medium for current
numeric limits because first-party pages conflict; low/unknown for proprietary
audio-engine and full AUv3 interoperability contracts. [C-030] [C-039]

## 2. Product identity, history, and market position

**DOCUMENTED:** BeepStreet presents Drambo as a modular groovebox and
audio-processing environment for composition, sound design, sampling,
performance, and experimentation. Apple lists copyright 2020, seller Jaroslaw
Jacek, and a current 2.56 release dated at the research cutoff; the release notes
include new functionality and fixes, establishing maintained status. [C-001]
[C-002] [C-036]

**DOCUMENTED:** The current audience/workflow positioning spans self-contained
track production, live performance, modular instrument/effect construction,
hardware/AUv3 sequencing, and use inside another AUv3-capable host. The product
is commercial, with a US App Store price and optional IAPs rather than a public
open-source edition. [C-002] [C-022]

**UNKNOWN:** No primary source in the bounded set establishes a predecessor
lineage, market share, enterprise/pro edition split, Android/Windows/Linux
edition, or formal long-term support policy. The platform scope is therefore
limited to the Apple devices explicitly enumerated by the vendor. [C-001]

## 3. Workflow and conceptual model

**DOCUMENTED:** A clip is a MIDI sequence assigned to a track; a horizontal row
of clips is a Pattern. Patterns can play top-to-bottom to make a song, or a
performer can launch clips from different patterns. This makes the primary model
pattern/launcher-oriented rather than a linear audio-region arrangement.
[C-003] [C-023]

**DOCUMENTED:** “Scene” has a different meaning from Pattern: up to 16 scenes
store parameter snapshots that can be crossfaded in real time. Morph groups can
also drive many parameters from one control. [C-004]

**DOCUMENTED:** A Track is a rack that joins sequencer/launcher behavior to the
modular graph. The Main rack can contain Track racks; racks/modules may nest and
can be saved at several preset levels. [C-006] [C-007] [C-017]

**UNKNOWN:** The current exact clip/pattern step ceiling is not safely resolved:
first-party surfaces state 128 steps for a clip, 256 steps per pattern, and older
manual values, while current marketing uses different inventory limits. Numeric
claims are preserved by source rather than reconciled. [C-039]

## 4. Publicly documented architecture

**DOCUMENTED:** The public module graph is directional. Modules generate or
process signals, required connections are inferred when modules are inserted,
connections can be changed, signal/output types are color-coded, and modules can
contain racks. MIDI sockets connect only to MIDI sockets; other documented signal
types can be cross-connected. [C-006]

**DOCUMENTED:** The Code module is the only source that reveals processing
implementation detail: its C-like expression scripts are compiled to bytecode or
run by an AST interpreter optimized for SIMD; block/vector and per-sample modes
exist; nodes retain state between blocks. [C-012]

**UNKNOWN:** The proprietary application's process map, audio callback ownership,
threading/scheduler, multicore policy, storage schema, graph compilation, memory
allocation discipline, and service boundaries are not publicly described in the
retained material. The Code engine disclosure does not establish the
implementation of the rest of Drambo. [C-030]

## 5. Audio engine

**DOCUMENTED:** Drambo advertises polyphonic stereo processing, audio-rate
modulation, and up to 16 voices per modular instrument rack in current product
material. The modular manual says stereo/polyphony propagate through connected
modules and recommends converting polyphonic signals to mono to save CPU.
[C-006] [C-008]

**DOCUMENTED:** The ordinary module graph has no instantaneous feedback path;
selected delay/rack mechanisms provide delayed feedback. The newer Code module
can implement single-sample feedback in its slower per-sample mode, which is a
local scripted mechanism rather than evidence of arbitrary graph cycles.
[C-009] [C-012]

**DOCUMENTED:** Tracks expose external audio input/output and nine mix buses.
Drambo Visual can perform high-quality background rendering of synchronized
audio and video, but that IAP-specific path does not prove a general offline
audio renderer for ordinary projects. [C-007] [C-019]

**UNKNOWN:** Supported sample-rate set, internal bit depth/precision, buffer-size
rules, device changes, multicore scheduling, general offline render, plugin delay
compensation, tail capture, freeze/bounce, oversampling policy, dropout recovery,
and engine diagnostics are not specified. The Code module's `sampleRate` variable
only exposes the active rate to that module. [C-030]

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED:** The current App Store listing describes a 16-track sequencer.
Manual pages define MIDI clips, pattern rows, clip launcher/song playback,
clip-length and speed settings, immediate or bar-quantized launch, clip/pattern
drag-copy/reorder, and step/piano-roll editing. [C-003] [C-005] [C-008]

**DOCUMENTED:** Editing includes note/chord entry, gate length, velocity, offset,
retrigger, cycle/components, transpose/shift/copy/paste, stepped and smooth curve
automation, per-step locks, polymeter/polyrhythm, and pattern time signatures.
The v2.56 notes extend the pattern numerator to 16. [C-005] [C-036]

**DOCUMENTED:** A user-visible Undo control can clear scoped clip, pattern,
sequence, bars, automation, scene, or all-project clips and can issue panic. This
documents an undo interaction, not durable history or recovery guarantees.
[C-005]

**UNKNOWN:** A separate waveform/audio-clip timeline, destructive versus
non-destructive audio editing, take lanes, comping, grouping, warping, ripple
editing, edit-history depth, and navigation limits are not documented in the
bounded sources. [C-031]

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED:** The sequencer supports polyphonic notes/chords, direct and
auto-advance step entry, live clip recording, simultaneous multitrack sequence
recording, piano roll, note preview, parameter locks, probability/conditions,
jump/transpose actions, gate/velocity/offset/retrigger/cycle editors, and
automation curves. Version 2.56 adds a scale-aware generative MIDI module with
separate trigger/pitch loops and copy-to-clip. [C-005] [C-036]

**DOCUMENTED:** MIDI input can be filtered by channel 1–16/any and note, routed
always/current-track/never, and paired with audio/MIDI mute behavior. MIDI learn,
conditional mappings, ranges, reusable standalone controller profiles,
bidirectional LED/motor-fader feedback, and optional controller initialization/
uninitialization SysEx are documented. [C-007] [C-010] [C-037]

**DOCUMENTED:** External clock can gate transport, current release notes mention
incoming MIDI-clock synchronization improvements, and current product material
states MIDI controller, hardware sequencing, MIDI CC, and Ableton Link support.
[C-011] [C-036]

**UNKNOWN:** Score/notation, MTC, MIDI 2.0/UMP, MPE/per-note expression semantics,
general SysEx recording/editing, and the sample accuracy of MIDI/event delivery
are not established. The documented SysEx use is limited to controller-profile
initialization messages. [C-038]

## 8. Routing, mixer, automation, and control

**DOCUMENTED:** Track audio can come from track input, one of nine mix buses, or
external input. Each track exposes up to three output targets, each selectable as
track output, one of nine mix buses, or external output. A documented older
template uses eight ordinary tracks, two sends, and master; tracks can be assigned
to three independent solo groups. [C-007]

**DOCUMENTED:** Track MIDI receive/channel/note policies and audio/MIDI mute styles
make event and audio routing explicit. Controller mappings are per project or,
for standalone UI/track modules, reusable profiles; AUv3 mode has no direct MIDI
port access for those profiles. [C-007] [C-010] [C-014]

**DOCUMENTED:** Native parameters support step locks, stepped/smooth Bézier
automation, MIDI mapping, Morph groups, and scene snapshot crossfades. [C-004]
[C-005] [C-010]

**UNKNOWN:** Feedback between arbitrary tracks, VCA/folder objects, surround/
immersive layouts, OSC, control-surface APIs, plugin sidechains/multiple outputs,
hosted-plugin parameter identity, and sample-accurate plugin automation are not
documented. The no-instant-feedback statement applies to the modular graph and
must not be generalized to every possible bus topology without a probe. [C-009]
[C-026] [C-027]

## 9. Recording, comping, and media handling

**DOCUMENTED:** Standalone Drambo is marketed for sampling/resampling, processing
microphone/external input, and recording MIDI into clips. Track input policies
support always-active or current-track-only external audio processing. [C-018]

**DOCUMENTED FORMAT BOUNDARY:** Apple's AUv3 guide says Audio Unit app extensions
perform real-time generation/processing and cannot perform recording. This is a
generic format-owner constraint on Drambo's AUv3 role, not a limitation on
standalone Drambo. [C-015]

**UNKNOWN:** Audio punch/loop recording behavior, monitoring latency, take
management, comping, supported audio-file formats/bit depths, sample asset
collection/relinking, metadata, proxies, conform, and ordinary video handling are
not described. Drambo Visual has separate image/video/camera inputs but is not
evidence of a conventional audio-post media model. [C-019] [C-031]

## 10. Instruments, effects, content, and native devices

**DOCUMENTED:** Current first-party pages describe more than 140 or more than 150
modules, including oscillators, samplers, physical modeling, filters, envelopes,
LFOs, effects, mixers, sequencers, MIDI processors, math, Audio Units, modulators,
and rack modules. The conflicting counts prevent a single exact current inventory
claim. [C-008] [C-039]

**DOCUMENTED:** Native modules/racks support automatic patching, nesting,
polyphonic stereo signal propagation, multiple modulators per parameter, bypass,
module/rack/track presets, Morphs, and compact rack views. [C-006] [C-009]
[C-017]

**DOCUMENTED:** The Code module is a native authoring mechanism for custom audio
effects, synthesizers, modulators, pitch processors, and math. It creates typed
inputs/outputs and parameters from script declarations; vector and per-sample
modes have explicit performance/feedback tradeoffs. It is not documented as a
general native-binary SDK. [C-012]

**DOCUMENTED:** Drambo Visual is an optional IAP that adds modular graphics,
audio-reactive control, reusable Visual Racks, HDMI output, and synchronized
audio/video export. [C-019] [C-022]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

“UNKNOWN” means no affirmative support or rejection statement was obtained; it
does not mean unsupported. “Plugin” role and “host” role are kept separate.
[C-013] [C-014] [C-033]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN:iOS/iPadOS; NOT_APPLICABLE:web | 2.56; no first-party VST2 statement found | UNKNOWN; no inference from omission | C-033 / S-001, S-007, S-008 |
| VST3 | UNKNOWN | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN:iOS/iPadOS; NOT_APPLICABLE:web | 2.56; no first-party VST3 statement found | UNKNOWN; no inference from omission | C-033 / S-001, S-007, S-008 |
| AUv2 | UNKNOWN | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN:iOS/iPadOS; NOT_APPLICABLE:web | 2.56; first-party wording specifically identifies hosted AUv3 categories | UNKNOWN; AUv3 evidence is not AUv2 evidence | C-033 / S-001, S-007 |
| AUv3 | DOCUMENTED:Apple-silicon Made-for-iPad standalone host | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | DOCUMENTED:iPhone/iPad standalone host; NOT_APPLICABLE:web | 2.56/current product page | Standalone hosts instrument, effect, MIDI-effect AUv3 modules. Separately Drambo is an AUv3 instrument/effect/MIDI effect. Hosting is standalone-only. | C-013, C-014 / S-001, S-007 |
| AAX | UNKNOWN | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN:iOS/iPadOS; NOT_APPLICABLE:web | 2.56; no first-party AAX statement found | UNKNOWN; no inference from omission | C-033 / S-001, S-007, S-008 |
| CLAP | UNKNOWN | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN:iOS/iPadOS; NOT_APPLICABLE:web | 2.56; no first-party CLAP statement found | UNKNOWN; no inference from omission | C-033 / S-001, S-007, S-008 |
| LV2 | UNKNOWN | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN:iOS/iPadOS; NOT_APPLICABLE:web | 2.56; no first-party LV2 statement found | UNKNOWN; no inference from omission | C-033 / S-001, S-007, S-008 |
| LADSPA | UNKNOWN | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN:iOS/iPadOS; NOT_APPLICABLE:web | 2.56; no first-party LADSPA statement found | UNKNOWN; no inference from omission | C-033 / S-001, S-007, S-008 |
| DSSI | UNKNOWN | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN:iOS/iPadOS; NOT_APPLICABLE:web | 2.56; no first-party DSSI statement found | UNKNOWN; no inference from omission | C-033 / S-001, S-007, S-008 |
| JSFX | UNKNOWN | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN:iOS/iPadOS; NOT_APPLICABLE:web | 2.56; no first-party JSFX statement found | UNKNOWN; Code module is not JSFX | C-012, C-033 / S-012 |
| DirectX/DXi | UNKNOWN | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN:iOS/iPadOS; NOT_APPLICABLE:web | 2.56; no first-party DX/DXi statement found | UNKNOWN; no inference from omission | C-033 / S-001, S-007, S-008 |
| Rack Extension | UNKNOWN | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN:iOS/iPadOS; NOT_APPLICABLE:web | 2.56; no first-party Rack Extension statement found | UNKNOWN; Drambo rack modules are not Reason Rack Extensions | C-006, C-033 / S-004 |
| Product-native/other | DOCUMENTED:native modules/racks/Code in standalone; Drambo AUv3 roles | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | DOCUMENTED:iPhone/iPad native modules/racks/Code and Drambo AUv3 roles; NOT_APPLICABLE:web | 2.56/current Code manual | Native module/rack preset system and Code expression engine; not a public binary plugin format | C-012, C-014 / S-001, S-012 |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED:** Hosted AUv3 instruments, effects, and MIDI effects appear as
Drambo modules in standalone mode. [C-013]

**UNKNOWN:** Discovery triggers, AudioComponent enumeration, first-launch scan,
validation, caching, duplicate identity, blacklist/quarantine, rescan UX,
signature checks, version replacement, and failed-scan recovery are not described.
The official DSP module reference was not text-readable and the bounded
first-party forum search returned no usable result. [C-024]

### 11.3 Runtime isolation and compatibility

**DOCUMENTED FORMAT CONTEXT:** Apple's AUv3 architecture uses app extensions,
system-mediated host/extension communication, restricted extension APIs, and
render-resource lifecycle calls. Apple's archived guide also distinguishes a
containing app from the host. [C-015]

**INFERENCE:** This supplies an OS-level extension boundary, but it does not prove
how Drambo chooses in/out-of-process loading on each supported OS version, whether
one failed unit affects others, or whether Drambo restores/quarantines a crashed
instance. [C-016]

**UNKNOWN:** Drambo-specific process placement, crash containment/restart,
architecture bridging, memory/CPU limits, compatibility modes, and behavior for
unsigned, invalid, or incompatible AUv3s. Apple-silicon/iOS 15.6+ compatibility is
documented only at product-platform level. [C-001] [C-025]

### 11.4 Host/plugin processing contract

**DOCUMENTED:** The accepted categories named by Drambo are AUv3 instrument,
effect, and MIDI effect. Apple generically defines Audio Unit extension input and
output bus arrays, render-resource allocation/deallocation, MIDI-responsive unit
types, optional UI, and real-time rendering. [C-013] [C-015]

**UNKNOWN:** Drambo's handling of hosted-unit sidechains, auxiliary/multiple
outputs, bus layouts, mono/stereo negotiation, dynamic I/O, MPE/MIDI 2.0, event
timing accuracy, latency/tails, PDC, bypass/suspend, offline rendering, and
sample-accurate parameter changes. The bus counts and sidechain/multi-output
behavior exposed by Drambo itself in each of its three AUv3 roles are also
undocumented. Native three-target track routing and native module bypass do not
establish either AUv3 contract. [C-026] [C-027]

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED:** Native parameters can be locked, automated, morphed, and MIDI
mapped; mappings save per project. Drambo supports rack/module/track presets.
[C-004] [C-005] [C-010] [C-017]

**UNKNOWN:** The sources do not explicitly extend those guarantees to hosted
AUv3 parameter address identity, ranges/text, gesture handling, sample accuracy,
factory/user presets, full-state serialization, external asset bookmarks,
version migration, missing-plugin placeholders, or later relink/recovery. Nor do
they describe how Drambo's own AUv3 roles serialize their project/rack state into
another host. [C-027] [C-028]

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED FORMAT CONTEXT:** Apple permits AUv3 extensions with or without a UI
and documents a remote/container-view relationship plus UI/audio-unit load-order
independence. This is generic format behavior. [C-015]

**UNKNOWN:** Drambo-specific custom/generic UI selection, embedding/detachment,
scaling, keyboard focus, headless behavior, UI teardown/reopen, failure banners,
logs, plugin CPU meters, safe mode, and diagnostics are not documented. The
official support path requests reproduction steps, device/OS/interface, and the
problem project by email; that is support intake, not host diagnostics or crash
recovery. [C-021] [C-029]

## 12. Extensibility and integration

**DOCUMENTED:** Extensibility includes nested reusable racks/presets, a Code DSP
expression engine, MIDI learn, project mappings, standalone controller profiles
with bidirectional feedback/conditions/SysEx initialization, hardware MIDI/CC,
Ableton Link, and Drambo's three AUv3 plugin roles. [C-010] [C-011] [C-012]
[C-014] [C-017]

**DOCUMENTED:** The Code engine exposes typed audio/gate/time/pitch/velocity
inputs, typed outputs, generated parameters, stateful standard-library nodes,
tempo/sample-rate variables, and block/per-sample execution. No native binary,
file, network, UI-widget, or package API is documented. [C-012]

**UNKNOWN:** A public SDK/API stability policy, scripting access to project
objects, OSC/remote API, command/action API, third-party Code package signing,
and author/distribution licenses for Code/rack presets were not found. [C-035]

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED:** MIDI mappings save per project; project templates can preserve
mappings; mapping profiles persist across standalone sessions; modules/racks/
tracks have preset layers. Support asks users to attach a failing project, which
confirms a transferable project artifact but says nothing about representation.
[C-017]

**UNKNOWN:** Project serialization format, atomic saves, autosave cadence,
automatic restart restoration, undo persistence, crash recovery, schema version,
backward/forward compatibility, migration, missing AUv3 placeholders, asset
collection/relinking, archive/collect, and source-control suitability. [C-028]
[C-032]

**UNKNOWN:** No retained first-party source specifies ordinary audio/stem, MIDI,
AAF, OMF, ADM, MusicXML, DAWproject, or project-exchange import/export, cloud
collaboration, or version control. Drambo Visual's synchronized audio/video
export is a documented optional-specialty path and must not be generalized to
the base project. [C-019] [C-032]

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED:** Live operation is first-class: arbitrary clip launching with
quantization, pattern-song playback, scene crossfading, Morph controls, XY/UI
modules, track mute/solo, and bidirectional controller feedback. [C-004] [C-010]

**DOCUMENTED:** Drambo Visual adds a resizable live projector, external HDMI
display, lower-resolution/frame-rate preview, and high-quality background export
of synchronized audio and video. [C-019]

**UNKNOWN:** Base-app mix/master formats, stem/batch export, loudness/true peak,
DDP, timecode/ADR, video-post interchange, surround/immersive/ADM, show-control
protocols, and redundant live recovery are not documented. [C-030] [C-032]

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED:** The modular manual recommends poly-to-mono conversion to reduce
CPU. The Code module says vector processing is near native-module performance and
per-sample execution is approximately 2–5 times slower. Current v2.56 notes list
sample-rate-related pitch fixes and rare crash fixes; these are maintenance
evidence, not reliability guarantees. [C-008] [C-012] [C-036]

**DOCUMENTED:** Support is email-based and asks for reproduction steps, device,
OS, interface, and affected project. Apple shows developer-declared “Data Not
Collected” and says the developer has not declared supported accessibility
features; the vendor says UI layout scales to device size/orientation. [C-020]
[C-021] [C-034]

**DOCUMENTED FORMAT CONTEXT / UNKNOWN PRODUCT DETAIL:** Apple documents restricted
APIs and system-mediated IPC for app extensions, but Drambo's host trust model,
plugin entitlements, per-unit resource accounting, malicious-plugin boundary,
signing verification, telemetry implementation, secure update, rollback, and
notarization behavior are not specified. [C-015] [C-016] [C-025]

**UNKNOWN:** Maximum project/rack/module complexity, device-specific performance,
thermal behavior, memory-pressure recovery, deterministic render, plugin crash
containment, localization beyond the App Store's English listing, VoiceOver/
keyboard access, and formal accessibility conformance. [C-020] [C-030]

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED:** Drambo is commercial App Store software: the US listing showed
$24.99, IAPs, and Family Sharing at cutoff. Drambo Visual is a separately
purchased expansion requiring Drambo. [C-022]

**DOCUMENTED FORMAT CONTEXT:** AUv3 is an Apple app-extension format with host,
extension, containing-app, bus, UI, and extension-point requirements. Naming or
supporting AUv3 does not itself convey App Store, trademark, signing, SDK, or
redistribution rights. [C-015]

**UNKNOWN:** The end-user license, Code/rack preset redistribution terms,
third-party module/source licenses, trademark permissions, SDK agreement details,
certification requirements, and rights for bundled technology are outside the
obtained evidence. No legal conclusion is offered. [C-035]

**IMPLEMENTATION CONSTRAINT:** A cross-platform design cannot treat Drambo's
AUv3-only documented hosting surface or Made-for-iPad Mac distribution as proof
for VST3/CLAP/AAX support or portable plugin architecture. [C-001] [C-033]

## 17. Strengths, liabilities, and architecture lessons

| Assessment | Classification and evidence | Architecture relevance |
| --- | --- | --- |
| Tight sequencer/rack integration | **DOCUMENTED:** clips target modular track racks; locks, automation, scenes, and morphs share the composition surface. [C-003] [C-004] [C-007] | Strong reference for lowering mode switches between composition and sound design. |
| Legible modularity | **DOCUMENTED:** directional flow, automatic connections, nesting, typed/color-coded signals, and deliberate no-instant-feedback rule. [C-006] [C-009] | Strong reference for graph usability; trades away arbitrary cycles. |
| Dual standalone/extension roles | **DOCUMENTED:** standalone hosts AUv3; Drambo separately operates as three AUv3 types. [C-013] [C-014] | Useful packaging pattern only if role boundaries remain explicit. |
| Expressive live control | **DOCUMENTED:** clip launch, scene/Morph crossfade, conditional sequencing, MIDI mapping, and feedback profiles. [C-004] [C-005] [C-010] | Strong touch/live workflow reference. |
| Native safe-ish DSP authoring surface | **DOCUMENTED/INFERENCE:** Code uses a bounded expression engine rather than a documented native binary API; formal sandboxing is not proven. [C-012] | Useful constrained-extension pattern with performance/expressiveness tradeoffs. |
| Narrow documented plugin ecosystem | **DOCUMENTED:** only AUv3 hosting is affirmatively documented. Other formats are unknown, not proven absent. [C-013] [C-033] | Poor direct reference for cross-platform format breadth. |
| Thin interoperability/recovery evidence | **UNKNOWN:** PDC, multi-bus, state, missing plugins, scan recovery, export, and crash containment lack first-party detail. [C-024] [C-025] [C-026] [C-027] [C-028] [C-032] | Requires prototypes before adopting any host-contract assumption. |
| Mobile constraints and numeric drift | **DOCUMENTED/UNKNOWN:** Apple-only platform and conflicting current/older module/step/voice values. [C-001] [C-039] | Versioned capability manifests are preferable to prose inventories. |

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Support | Prerequisites / tradeoffs / adaptation risk |
| --- | --- | --- | --- | --- |
| CANDIDATE | Sound design and sequencing live in separate modes | Make a track an explicit graph container and the target of launcher clips/events | C-003, C-007, C-023 | Needs stable object IDs and graph/sequence transactions; avoid copying UI expression. |
| CANDIDATE | Patch cables become visually dense on touch screens | Directional ordered graph with type-aware auto-connection and visible override | C-006, C-009 | Sacrifices arbitrary cycles; provide explicit delayed feedback and clear diagnostics. |
| CONDITIONAL | One performance gesture must reshape many controls | First-class scene snapshots and morph groups over stable parameter identities | C-004, C-005 | Interpolation law, discrete parameters, automation precedence, and plugin identity need formal contracts. |
| CANDIDATE | Hardware mapping is repetitive and one-way | Project mappings plus reusable controller profiles, feedback, and conditional layers | C-010, C-037 | Requires MIDI ownership, loop suppression, device identity, and conflict resolution. |
| CONDITIONAL | Users need custom DSP without loading native binaries | Typed DSP expression DSL with vector default and explicit per-sample mode | C-012 | Requires verifier, time/memory budgets, deterministic state/versioning, and strong licensing docs; Drambo's safety guarantees are unknown. |
| CONDITIONAL | Product should work standalone and inside hosts | Package host application and plugin extensions as distinct roles with explicit capability reduction | C-013, C-014, C-015 | Never imply nested hosting; state, I/O, recording, MIDI-port, and lifecycle differences must be user-visible. |
| CONDITIONAL | Audio and visuals need synchronized performance output | Share modulation/timing signals and provide live projector plus background A/V render | C-019 | Optional specialty; GPU scheduling, export determinism, and platform scope require separate architecture. |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** equating “supports AUv3” with full scanning, multi-bus, PDC,
  automation, state, UI, and recovery fidelity. The evidence establishes accepted
  categories only. Reopen after a version-pinned interoperability harness.
  [C-013] [C-024] [C-026] [C-027] [C-028] [C-029]
- **REJECTED:** treating Drambo's plugin role as evidence that it hosts plugins
  recursively. Current evidence says hosting is standalone-only. [C-014]
- **REJECTED:** treating Pattern rows as scenes. Manual terminology makes scenes
  parameter snapshots/crossfade targets. [C-003] [C-004]
- **REJECTED:** inferring current numeric limits by reconciling conflicting
  marketing/manual values. Reopen with an official versioned capability table or
  safe UI probe. [C-039]
- **REJECTED:** inferring Drambo-specific plugin isolation or recovery from
  Apple's generic extension IPC model. Reopen with host diagnostics or crash
  probes. [C-016] [C-025]
- **CURIOSITY_NO_GO:** broad crawling of the BeepStreet forum after its bounded
  search routes returned no usable result; low provenance/version precision and
  high cost.
- **CURIOSITY_NO_GO:** community tutorials, Reddit, App Store-history mirrors,
  and user anecdotes; they can locate probes but cannot establish proprietary
  host contracts.
- **CURIOSITY_NO_GO:** installation and binary execution; explicitly outside this
  documentary wave and unnecessary for honest `UNKNOWN` entries.
- **CURIOSITY_NO_GO:** exhaustive Drambo Visual shader internals; outside the DAW
  architecture decision except for integrated signals/live/export.
- **CURIOSITY_NO_GO:** inferring non-AUv3 formats are unsupported merely because
  official pages omit them. The proper classification is `UNKNOWN`. [C-033]

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary result | Counterevidence/limit | Later discriminating probe |
| --- | --- | --- | --- |
| H1: Drambo's primary composition model is pattern/launcher + modular track rack, not a conventional audio timeline | **SUPPORTED/DOCUMENTED.** [C-003] [C-007] [C-023] | Separate current audio-clip facilities could exist but were not documented. | Create/record/import audio and inspect whether it becomes a clip, sampler asset, or rack signal. |
| H2: “Scene” means a clip row | **FALSIFIED.** Pattern is a horizontal clip row; scenes are parameter snapshots. [C-003] [C-004] | Terminology could evolve in later versions. | Version-pinned UI terminology check. |
| H3: Drambo both hosts and is an AUv3 with identical capabilities | **FALSIFIED.** Hosting is standalone-only; controller profiles also lose direct MIDI-port access in AUv3. [C-010] [C-014] | Exact AUv3 capability reduction beyond these facts is unknown. | Compare standalone vs all three AUv3 roles using the same project fixture. |
| H4: An AUv3 logo proves a complete host contract | **FALSIFIED/UNKNOWN.** Accepted categories are documented; deeper contract is not. [C-013] [C-024]–[C-029] | Generic Apple APIs identify possible buses/UI/state surfaces, not Drambo behavior. | Automated matrix: discover → validate → instantiate → render → automate → save/reload → fail/recover. |
| H5: Generic app-extension IPC proves per-plugin crash containment in Drambo | **FALSIFIED AS AN INFERENCE.** [C-015] [C-016] [C-025] | OS implementation and host choices vary by platform/version. | Crash/hang one disposable AUv3 and record process, audio, UI, project, and relaunch behavior. |
| H6: Native track outputs prove AUv3 sidechains/multi-output | **FALSIFIED AS AN INFERENCE.** [C-007] [C-026] | Host may support them, but no retained source says so. | Sidechain effect and 4/8/16-output instrument fixtures with dynamic bus changes. |
| H7: Current numeric module/step limits are consistent | **FALSIFIED.** First-party values conflict. [C-039] | Some statements use different objects/versions. | Inspect 2.56 UI and obtain versioned vendor clarification. |
| H8: Code module is equivalent to a native plugin SDK | **FALSIFIED.** It is a typed expression DSP environment; no native binary/package API is documented. [C-012] | It is still a meaningful native-device extension point. | Test state/version/error/resource behavior with bounded scripts. |

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current public release is 2.56; iOS 15.6+ iPhone/iPad and vendor-documented Apple-silicon Made-for-iPad Mac are supported. | Cutoff 2026-08-29 | S-001, S-007 | Apple metadata pins version; vendor pins Mac route. | Apple storefront itself displayed iPhone/iPad, so Mac scope relies on vendor page. |
| C-002 | DOCUMENTED | High | Drambo is positioned as modular groovebox, audio processor, sequencer, studio, and live sound-design environment. | Current family | S-001, S-002, S-007 | Direct vendor/store descriptions. | Positioning is vendor claim, not independent quality measurement. |
| C-003 | DOCUMENTED | High | Clips are MIDI sequences assigned to tracks; horizontal rows are Patterns; patterns sequence into songs or mix for live launch. | Manual conceptual model | S-002, S-003, S-010 | Direct definitions. | Core pages date 2022; later additive features could exist. |
| C-004 | DOCUMENTED | High | Up to 16 scenes store parameter snapshots for crossfading; Morphs control many parameters. | Manual/current product | S-001, S-003 | Direct first-party statements. | Interpolation/discrete-parameter semantics unspecified. |
| C-005 | DOCUMENTED | High | Sequencer supports step/piano-roll editing, locks, curves, conditions/actions, live/multitrack MIDI recording, and detailed step editors. | User-visible sequencing | S-001, S-003, S-013, S-014 | Multiple first-party pages triangulate. | Sample accuracy and history depth unspecified. |
| C-006 | DOCUMENTED | High | Modules/racks form a directional, automatically connected but overridable, nested, typed/color-coded polyphonic-stereo graph. | Native modular graph | S-001, S-004 | Direct descriptions. | Exact graph compiler/scheduler unknown. |
| C-007 | DOCUMENTED | High | Track racks bridge sequencing and graph; expose external I/O, nine mix buses, three output targets, MIDI filters/receive policy, and solo/mute behavior. | Track/mixer model | S-009 | Direct settings descriptions. | Page dates 2022; present maxima may differ. |
| C-008 | DOCUMENTED | Medium | Current listings document 16 tracks, up to 16 voices/rack, and more than 140/150 modules depending on first-party page. | Current marketing scope | S-001, S-007 | Values preserved per source. | Inventory values conflict; see C-039. |
| C-009 | DOCUMENTED | High | General graph disallows instant feedback; delayed feedback is supported; Code per-sample mode permits local single-sample feedback. | Native graph/Code | S-001, S-004, S-012 | Different mechanisms explicitly separated. | Does not prove track-bus feedback policy. |
| C-010 | DOCUMENTED | High | MIDI mapping supports project mappings, standalone persistent profiles, feedback, conditions, ranges; profiles are unavailable in AUv3 due to MIDI-port access. | v2.40+ mapping | S-006 | Direct versioned manual. | Host-delivered AUv3 MIDI remains separate. |
| C-011 | DOCUMENTED | Medium-high | Hardware MIDI/CC, controller support, MIDI clock, and Ableton Link are documented. | Standalone/current | S-001, S-006, S-007, S-014 | Product/manual/release evidence. | MTC and event timing precision unknown. |
| C-012 | DOCUMENTED | High | Code module uses a C-like expression engine compiled to bytecode or AST/SIMD execution with vector/per-sample modes, typed I/O/params, and stateful nodes. | Current Code manual | S-012 | Direct architecture disclosure. | Does not characterize whole engine or prove sandboxing. |
| C-013 | DOCUMENTED | High | Standalone Drambo hosts AUv3 instruments, effects, and MIDI effects as modules. | Current standalone | S-001, S-007 | Explicit category and edition statements. | No deeper contract implied. |
| C-014 | DOCUMENTED | High | Drambo separately ships as AUv3 instrument, audio effect, and MIDI effect; third-party hosting is standalone-only. | Current extension roles | S-001, S-006, S-007 | Vendor and Apple listing agree. | Exact host compatibility/state/I/O limits unknown. |
| C-015 | DOCUMENTED | High for generic format, not product | Apple documents AUv3 extension types, optional UI, buses/render resources, lifecycle/IPC, restricted APIs, and no recording by an Audio Unit extension. | Apple AUv3/app-extension model | S-015, S-016 | Format-owner primary docs. | Archived 2017 docs; not Drambo runtime proof. |
| C-016 | INFERENCE | High | Generic AUv3 IPC/restrictions cannot establish Drambo-specific isolation, crash recovery, or lifecycle UX. | Evidence boundary | S-015, S-016 | Product evidence is silent; plausible alternative is different host/process handling by OS/version. | Needs dynamic process/crash probe. |
| C-017 | DOCUMENTED | High | Drambo has project mappings/templates, persistent profiles, and module/rack/track preset scopes; support accepts project artifacts. | Persistence surfaces | S-001, S-006, S-009, S-019 | Direct first-party text. | File representation/durability unknown. |
| C-018 | DOCUMENTED | Medium-high | Standalone use includes sampling/resampling and external/microphone audio processing. | Product workflow | S-001, S-009 | Vendor features plus track input settings. | Detailed recorder/media contract absent. |
| C-019 | DOCUMENTED | High | Optional Drambo Visual integrates modular graphics, live HDMI/projector output, and background high-quality synchronized A/V export. | Visual IAP | S-001, S-018 | Direct expansion page. | Does not prove base-app audio export. |
| C-020 | DOCUMENTED | High | Apple reports developer-declared no data collection and no declared accessibility features. | Store disclosure | S-007 | App Store disclosure. | Not independent audit; disclosure may change. |
| C-021 | DOCUMENTED | High | Support requests repro/device/OS/interface/project by email; 2.56 release notes contain crash and sample-rate fixes. | Current support/reliability evidence | S-007, S-019 | Direct support/release sources. | Not diagnostics, containment, or SLA evidence. |
| C-022 | DOCUMENTED | High | US price was $24.99 plus IAP at cutoff; Family Sharing shown; Visual requires an IAP. | US commercial terms | S-007, S-018 | Store/vendor primary evidence. | Prices/availability vary; not full EULA. |
| C-023 | INFERENCE | High | Drambo's principal user model is pattern/launcher sequencing integrated with modular track racks, not a conventional audio timeline. | Architecture interpretation | S-003, S-004, S-009 | Direct object definitions support interpretation. | A later/undocumented audio-clip workflow could coexist. |
| C-024 | UNKNOWN | High that documentation is missing | AUv3 discovery, scan/validation, cache, duplicate identity, blacklist/quarantine, rescan, and failed-scan recovery are undocumented. | Drambo 2.56 host | S-001, S-005, S-008, S-017 | Product/manual/module reference/sitemap/forum attempts checked. | Absence is not unsupported behavior; dynamic probe required. |
| C-025 | UNKNOWN | High that documentation is missing | Host process placement, sandbox choice, crash containment/restart, bridging, resource limits, and compatibility modes are undocumented. | Drambo AUv3 host | S-015, S-016, S-017 | Generic Apple facts cannot fill product gap. | Requires process and fault-injection probes. |
| C-026 | UNKNOWN | High that documentation is missing | Hosted AUv3 sidechain, multi-output, channel-layout, dynamic-I/O, MPE/MIDI2, and timing behavior—and the buses Drambo exposes in its own AUv3 roles—are undocumented. | Host and extension roles | S-001, S-009, S-015, S-017 | Track routing and generic AU buses are insufficient. | Requires fixture matrix in both directions. |
| C-027 | UNKNOWN | High that documentation is missing | Hosted-plugin parameter identity/text/ranges, sample-accurate automation, latency/tails, PDC, bypass/suspend, and offline render, plus corresponding Drambo-extension reporting, are undocumented. | Host and extension roles | S-003, S-014, S-015, S-017 | Native automation is not plugin-contract evidence. | Requires automation/latency/tail render fixtures in both roles. |
| C-028 | UNKNOWN | High that documentation is missing | AUv3 state/preset serialization, assets, migration, missing-plugin placeholders, relink, and Drambo-AUv3 host recall are undocumented. | Host and plugin roles | S-006, S-008, S-017 | Project mapping evidence does not describe plugin state. | Save/reload/version/remove/reinstall probes required. |
| C-029 | UNKNOWN | High that documentation is missing | Hosted UI mode/scaling/headless lifecycle, error reporting, logs, safe mode, and plugin failure diagnostics are undocumented. | Drambo AUv3 host | S-015, S-017, S-019 | Apple permits UI variants; support email is not runtime diagnostics. | UI/failure matrix required. |
| C-030 | UNKNOWN | High that documentation is missing | Main-engine sample rates/precision, buffers, threading, multicore, general offline render/PDC, dropout handling, and diagnostics are undocumented. | Proprietary engine | S-001, S-004, S-012 | Code details are local, not whole-engine evidence. | Vendor engineering docs or instrumented safe probe required. |
| C-031 | UNKNOWN | High that documentation is missing | Audio timeline clips, punch/loop audio recording, monitoring, takes/comping, file formats, warping, and asset relink are undocumented. | Recording/media | S-001, S-009, S-014 | Sampling claims and MIDI recording do not establish audio DAW facilities. | Import/record/edit fixture required. |
| C-032 | UNKNOWN | High that documentation is missing | Project format, autosave/crash recovery, migrations, archives, ordinary audio/stem/MIDI interchange, and collaboration are undocumented. | Persistence/delivery | S-006, S-008, S-019 | Sparse project evidence and visual export do not establish these. | Controlled save/corrupt/version/export probes required. |
| C-033 | UNKNOWN | High that affirmative evidence is absent | No retained first-party evidence establishes Drambo hosting VST2/3, AUv2, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DX/DXi, or Rack Extension. | Format matrix | S-001, S-007, S-008 | Official surface affirmatively names AUv3 only. | Omission is not proof of rejection/unsupported status. |
| C-034 | DOCUMENTED | Medium | Vendor says UI scales to device sizes/orientations. | User interface | S-001 | Direct vendor statement. | Not accessibility conformance or independent measurement. |
| C-035 | UNKNOWN | High that evidence is missing | Full EULA, preset/Code redistribution terms, third-party licenses, SDK/trademark/certification terms were not obtained. | Legal/ecosystem | S-007, S-015 | Store terms and format docs are partial. | Counsel/vendor license review required; no legal advice offered. |
| C-036 | DOCUMENTED | High | 2.56 adds a generative MIDI module and pattern numerator extension and lists MIDI-clock, sample-rate, automation, and crash fixes. | Release 2.56 | S-007 | Current App Store release notes. | Vendor release claim, not reproduced. |
| C-037 | DOCUMENTED | High | Controller profiles can send initialization/uninitialization SysEx to selected outputs. | Standalone MIDI mapping | S-006 | Direct manual procedure. | Does not establish general SysEx sequencing/recording. |
| C-038 | UNKNOWN | High that documentation is missing | Score, MTC, MIDI 2.0/UMP, MPE/per-note semantics, general SysEx editing, and event sample accuracy are undocumented. | MIDI/expression | S-001, S-006, S-014 | Relevant manual/product pages checked. | Absence is not proof of unsupported behavior. |
| C-039 | UNKNOWN | High | Exact current module and clip/pattern-step ceilings cannot be reconciled across first-party pages. | Versioned limits | S-001, S-004, S-007 | Values may describe versions or different objects; no versioned capability table found. | Safe 2.56 UI probe/vendor clarification required. |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Vendor claims establish what the vendor
documents, not independent runtime performance.

- **S-001 — “Drambo.”** BeepStreet. <https://www.beepstreet.com/ios/drambo>.
  Current official product page; sections “Groovebox,” “Perform,” “Supported
  devices and platforms,” “Features,” and “You can use Drambo as.” Supports
  C-001–C-002, C-004–C-006, C-008–C-009, C-011, C-013–C-014, C-017–C-019,
  C-030, C-033–C-034, C-038–C-039. Limitations: marketing prose, no version label
  or host-contract detail, internally inconsistent step/module counts. Selected
  as canonical current vendor scope, preferable to reviews/tutorials.
- **S-002 — “What is Drambo.”** BeepStreet Drambo docs.
  <https://www.beepstreet.com/drambo-docs/>. Official manual landing page;
  groovebox and modular-environment definitions. Supports C-002–C-003. Limitation:
  overview and partially older prose. Selected for canonical terminology.
- **S-003 — “Groovebox.”** BeepStreet Drambo docs.
  <https://www.beepstreet.com/drambo-docs/groovebox.html>. Official conceptual
  page; clip/track/Pattern definitions, locks, automation, components, scenes,
  piano roll. Supports C-003–C-005, C-023, C-027. Limitation: last-modified 2022;
  not a current limit table. Preferable to community explanations.
- **S-004 — “Modular processing — introduction.”** BeepStreet Drambo docs.
  <https://www.beepstreet.com/drambo-docs/modular-processing-introduction.html>.
  Official graph/signal/rack page. Supports C-006, C-008–C-009, C-023, C-030,
  C-039. Limitation: 2022 values (over 120 modules/eight voices) conflict with
  current pages. Selected for precise public graph semantics, not current counts.
- **S-005 — “Drambo DSP Modules Reference.”** BeepStreet Drambo docs.
  <https://www.beepstreet.com/drambo-docs/drambo-dsp-modules.html>. Official
  client-rendered reference; text retrieval yielded only table headings. Supports
  the negative method behind C-024. Limitation: inaccessible module rows; not
  retried indefinitely. Selected because it was the most likely first-party
  source for AU module detail; retained to explain the blocker.
- **S-006 — “MIDI mapping.”** BeepStreet Drambo docs.
  <https://www.beepstreet.com/drambo-docs/midi-mapping.html>. Official v2.40
  mapping/profile guide; project storage, standalone-only profiles, feedback,
  conditions, SysEx. Supports C-010–C-011, C-014, C-017, C-028, C-032, C-037–C-038.
  Limitation: one embedded Reddit link was ignored; no general MIDI-event spec.
  Selected as current versioned primary guidance.
- **S-007 — “Drambo — Modular groovebox, synth & fx.”** Apple App Store.
  <https://apps.apple.com/us/app/drambo/id1469365718>. First-party distribution
  metadata and vendor-supplied description/release notes; version 2.56, date,
  price, OS, roles, current limits, privacy/accessibility disclosures, fixes.
  Supports C-001–C-002, C-007–C-008, C-011, C-013–C-014, C-020–C-022, C-033,
  C-035–C-036, C-039. Limitations: US storefront, mutable, vendor declarations,
  “22h ago” relative date. Selected to pin current release/commerce metadata.
- **S-008 — official Drambo docs sitemap.** BeepStreet.
  <https://www.beepstreet.com/drambo-docs/sitemap.xml>. Official page inventory
  and modification dates. Supports bounded negative searches for C-024, C-028,
  C-032–C-033. Limitation: absence of a page is not absence of behavior. Selected
  to bound manual coverage rather than guess undocumented URLs.
- **S-009 — “Track rack.”** BeepStreet Drambo docs.
  <https://www.beepstreet.com/drambo-docs/tracks.html>. Official track/routing
  settings, nine buses, three targets, external I/O, MIDI filters, solo/mute.
  Supports C-007, C-017–C-018, C-023, C-026, C-031. Limitation: 2022 default
  template is not a current maximum. Selected for precise user-visible routing.
- **S-010 — “Song arranger / clip launcher.”** BeepStreet Drambo docs.
  <https://www.beepstreet.com/drambo-docs/song-arranger-clip-launcher.html>.
  Official pattern/clip playback, quantization, and editing page. Supports
  C-003–C-004. Limitation: sparse and last-modified 2022. Selected to triangulate
  the launcher model.
- **Unnumbered negative retrieval — “Beta.”** BeepStreet Drambo docs.
  <https://www.beepstreet.com/drambo-docs/beta.html>. Official page now redirects
  conceptually to Code module and provides no release chronology. Negative result
  only. Limitation: no historical content. Selected as a bounded attempt to find
  first-party release details; retained rather than silently dropped.
- **S-012 — “Code module.”** BeepStreet Drambo docs.
  <https://www.beepstreet.com/drambo-docs/code-module.html>. Official expression
  engine architecture, execution modes, typed I/O/parameters, standard library,
  feedback, and performance notes. Supports C-009, C-012, C-030, C-033. Limitation:
  says nothing about whole-app engine or formal sandbox; prompt-like AI suggestion
  was ignored as untrusted source text. Selected as unusually concrete primary
  architecture evidence.
- **S-013 — “User interface overview.”** BeepStreet Drambo docs.
  <https://www.beepstreet.com/drambo-docs/user-interface-overview.html>. Official
  gestures/Undo/panic/clear operations. Supports C-005. Limitation: screenshots
  and short gesture list, no persistence semantics. Selected to bound editing
  and user-visible history claims.
- **S-014 — “Sequencer.”** BeepStreet Drambo docs.
  <https://www.beepstreet.com/drambo-docs/sequencer.html>. Official transport,
  sync, recording, clip config, edit, and editor page. Supports C-005, C-011,
  C-027, C-031, C-038. Limitation: MIDI-focused and last-modified 2022. Selected
  over tutorial videos for precise first-party operations.
- **S-015 — “Audio Unit.”** Apple, archived *App Extension Programming Guide*.
  <https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/AudioUnit.html>.
  Format-owner documentation for AU extension roles, optional UI, buses, render
  lifecycle, and no-recording boundary. Supports C-015–C-016, C-025–C-027,
  C-029, C-035. Limitation: archived/updated 2017 and generic, never proof of
  Drambo's implementation. Selected as primary format origin.
- **S-016 — “Understand How an App Extension Works.”** Apple, archived *App
  Extension Programming Guide*.
  <https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/ExtensionOverview.html>.
  Format-owner extension lifecycle, IPC, containing/host app distinction, and
  restricted APIs. Supports C-015–C-016, C-025. Limitation: generic and archived;
  examples include non-audio extensions. Selected only to define the evidence
  boundary, preferable to claims about undocumented process behavior.
- **S-017 — bounded official-forum search attempt.** BeepStreet forum,
  <https://forum.beepstreet.com/search.json?q=%22multi-output%22%20AUv3%20order%3Alatest>
  plus an alternate `/api/search` route. Retrieval returned an empty search
  payload and 404 respectively. Supports negative methods for C-024–C-029.
  Limitation: no passage, author, or version evidence; not used affirmatively.
  Selected as the one best curiosity thread after official manuals were silent;
  stopped rather than crawl community posts.
- **S-018 — “Drambo Visual.”** BeepStreet.
  <https://www.beepstreet.com/ios/dvisual>. Official expansion page; modular
  visual/audio integration, projector/HDMI, background synchronized A/V export,
  IAP availability. Supports C-019, C-022. Limitation: product marketing and an
  optional graphics expansion. Selected to bound the only explicit export path.
- **S-019 — “Support / report a problem.”** BeepStreet Drambo docs.
  <https://www.beepstreet.com/drambo-docs/support.html>. Official support intake
  requirements. Supports C-017, C-021, C-029, C-032. Limitation: no diagnostic or
  recovery behavior. Selected to avoid inventing a troubleshooting system.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / available evidence | Blocker and decision impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| C-024 discovery/scan/cache/recovery | Product page, dynamic module reference, sitemap, bounded official-forum query | No usable first-party host workflow; affects diagnosability and startup architecture | Disposable iOS/iPadOS/macOS test accounts; known-good, duplicate-ID, invalid, removed, upgraded AUv3 fixtures; screen/log capture | Unassigned |
| C-025 isolation/crash/lifecycle | Apple generic extension docs plus product/support pages | Generic IPC cannot establish Drambo containment; affects fault domains and project safety | Instrument process tree where lawful; crash/hang/CPU/memory fixtures; record audio/UI/project/relaunch outcomes | Unassigned |
| C-026 buses/sidechain/multi-output/events | Track routing, explicit AUv3 categories, generic Apple bus APIs | Native routing is not either direction's AU contract evidence; affects graph model | Host mono/stereo, sidechain, 4/8/16-output and MIDI fixtures; then load each Drambo AUv3 role in a reference host and inspect exposed buses/events | Unassigned |
| C-027 automation/PDC/tails/render | Native locks/curves and generic AU render APIs | No hosted-unit or Drambo-extension parameter/latency contract; affects timing and deterministic export | Parameter ramps, known-latency/tail units, bypass/suspend, live/render alignment; inspect Drambo AUv3 latency/tail/parameter behavior in a reference host | Unassigned |
| C-028 state/presets/missing plugins | Project mapping/preset evidence, sitemap/forum attempts | No AU state or missing-dependency semantics; affects durable recall | Save/reload across app/plug-in version, rename/remove/reinstall, external asset, corrupt state, Drambo-as-AUv3 host recall | Unassigned |
| C-029 UI/diagnostics/failure | Apple optional UI/load order and BeepStreet support intake | No Drambo host UI/failure contract; affects accessibility/support burden | Custom/generic/headless units; resize/rotate/background/close/reopen; failed UI/render and safe-relaunch capture | Unassigned |
| C-030 engine internals | Modular and Code manuals, current release notes | Whole-engine precision/threading/render behavior proprietary; affects RT architecture | Vendor clarification or noninvasive loopback/latency/CPU/render tests across rates, buffers, tracks, voices | Unassigned |
| C-031 recording/media | Sampling claims, track external input, MIDI recording manual | No audio-timeline/comping/file-format documentation; affects DAW scope | Import/record/punch/loop/edit/relink common WAV/AIFF/CAF fixtures and inspect object/asset model | Unassigned |
| C-032 projects/export/recovery | Project mappings/templates, support attachment, visual export, sitemap | No format/autosave/migration/interchange specification; affects portability/recovery | Versioned save/copy/force-quit/corrupt/low-storage tests; enumerate export UI; stem/MIDI/asset archive fixture | Unassigned |
| C-033 non-AUv3 formats | Official current platform/product/manual surface | Omission cannot prove rejection; low impact for iOS, high for cross-platform analogy | Vendor support-matrix request; do not attempt incompatible binaries | Unassigned |
| C-035 licensing | App Store commerce and Apple generic developer docs | Full EULA/redistribution terms absent; affects ecosystem design | Obtain current EULA/privacy/third-party notices and format agreements; qualified legal review | Unassigned |
| C-038 advanced MIDI/expression | Sequencer/mapping/product pages | No score/MTC/MIDI2/MPE/general SysEx spec; affects event model | Version-pinned MPE, UMP/MIDI2, MTC, SysEx recording/playback and timing fixtures | Unassigned |
| C-039 numeric limits | Conflicting official pages | Version/object ambiguity; affects capacity planning only, not core model | Inspect 2.56 UI and request vendor versioned limits; preserve raw values | Unassigned |

## 24. Curiosity pass and stop decision

Scores use 1 (low) to 5 (high); cost 5 is most expensive.

| Candidate thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Official manual pages for tracks/sequencer/routing/Code | 5 | 5 | 4 | 2 | **PURSUED:** materially established object, graph, routing, recording, and native-extension boundaries. |
| Current App Store metadata/release notes | 4 | 4 | 3 | 2 | **PURSUED:** pinned 2.56/platform/price/current limits/fixes. |
| Apple AUv3 format-owner docs | 5 | 4 | 4 | 2 | **PURSUED:** bounded generic role/lifecycle/UI/bus facts and prevented product-specific overclaim. |
| Official forum query for multi-output/sidechain/PDC | 5 | 3 | 4 | 3 | **PURSUED AS BEST FINAL GAP:** no usable result; saturation increased. |
| Broad forum crawl | 3 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** weak version/author provenance, high duplicate/anecdote risk. |
| Community videos/Reddit/tutorials | 2 | 2 | 2 | 4 | **CURIOSITY_NO_GO:** may demonstrate UI but cannot prove internals; dynamic harness is safer. |
| App Store-history mirrors | 2 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** secondary mutable copies; current official listing was sufficient. |
| Install/run/fault-inject Drambo and AUv3s | 5 | 5 | 5 | 5 | **CURIOSITY_NO_GO for this wave:** explicitly deferred to a disposable interoperability prototype. |
| Deep Drambo Visual graphics internals | 1 | 2 | 4 | 4 | **CURIOSITY_NO_GO:** outside audio-architecture decision except the documented integration/export edge. |

**Gaps/contradictions after synthesis:** host-contract depth remains absent; module,
voice, and step wording differs across current and older first-party pages; Apple
extension documentation is generic/archived; base-project export/persistence is
not described. These are visible in C-024–C-033 and C-039 rather than filled from
memory.

**Stop decision:** `STOP_COVERAGE_SATURATION`. Every required dossier section and
plugin row is complete; the leading architecture conclusions are supported by
multiple first-party pages; the highest-value additional first-party query
returned no usable evidence; further documentary searching has nonpositive
marginal value and repeated-duplicate risk. The unresolved AUv3, engine, project,
and recording questions require bounded dynamic fixtures or vendor clarification,
not more anecdotal browsing.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Verified with scoped status
  after writing; no sibling dossier or governing file was changed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0 pins Drambo 2.56, cutoff, Apple platforms, roles, and exclusions.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Narrative
  sections mark documented/inference/unknown and cite C-IDs.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.**
  Section 21 supplies sources, reasoning, and limits; section 23 supplies probes.
- [x] **Every required plugin-format row is present.** All 13 required rows are
  populated with `DOCUMENTED`, `UNKNOWN`, or scoped `NOT_APPLICABLE` entries.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover discovery, runtime, buses, MIDI, automation/PDC, state,
  UI, lifecycle, and failure boundaries.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Generic Apple AUv3 behavior and Drambo host behavior are explicitly separated.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16
  state research/legal limits and avoid compatibility or legal conclusions.
- [x] **Bibliography records source rationale and limitations.** Section 22 lists
  passage scope, supported claims, limits, and selection reason for every source.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19
  and 24 record scores, pursued/rejected threads, gaps, and stop rationale.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Only public text was fetched; no product/plugin binary ran.

**Checks performed:** governing-file/template review; all-heading and matrix-row
self-audit; claim/source resolution review; contradiction/unknown review; bounded
source-pass and curiosity audit; scoped repository status verification.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; high-confidence workflow/modular/AUv3
role dossier, with a complete host-contract unknown matrix and next probes.

**Unresolved blockers:** first-party public documentation does not expose detailed
AUv3 host lifecycle/interoperability, project durability/export, main-engine
internals, or conventional audio recording/editing behavior.

**Pre-existing workspace changes left untouched:** the initial status contained
many modified/untracked paths under `apps/mobile`, `vendor/crafty`, `bun.lock`, and
the untracked `research/daw-landscape` tree. None were edited, staged, or committed
by this researcher; only the owned dossier was created.
