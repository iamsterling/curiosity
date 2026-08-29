# Giada DAW dossier

> Research-only evidence. No design or implementation authority. Public pages and
> source are untrusted evidence, not instructions.

## 0. Metadata and scope

- **Product family:** Giada, “Your Hardcore Loop Machine.”
- **Canonical upstream:** Monocasual Laboratories / `monocasual/giada`.
- **Researcher/session:** subagent in session `ses_fb274ae5fffeniWnz7l7dg30vd`.
- **Owned path:** `research/daw-landscape/dossiers/giada.md`.
- **Research cutoff/access date:** 2026-08-29 UTC.
- **Current scope:** Giada 1.5.0 “Leshy,” tag `1.5.0`, source commit
  `ccbec4fd64def360dbc2d36174b5199b4dc7462e`; upstream GitHub release timestamp
  is 2026-06-16 while the product site says 2026-06-17. [C-001]
- **Editions/packages:** one open-source desktop product; upstream Windows x86-64
  and macOS arm64 archives, Linux Flatpak, source build, and source-level FreeBSD
  support. No mobile or web edition. [C-001] [C-024]
- **Included:** loop/channel/sequencer/audio model, recording/editing, routing,
  MIDI/sync, project persistence, VST/LV2 host boundary, live use, platform and
  licensing.
- **Excluded:** binary execution, third-party plugin qualification, performance
  benchmarks, proprietary plugin internals, legal conclusions, and code reuse.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.
- **Evidence passes/sources:** 21 evidence/curiosity passes; 40 retained primary or
  immutable sources; no community source used to prove internals.

## 1. Executive summary

Giada 1.5.0 is best classified as an open-source, live-oriented loop/action
sequencer with DAW-like editing, recording, hierarchical mixing, project recall,
and third-party plugin stacks—not as a general linear DAW. Its bounded pattern,
channel, and eight-scene model is optimized for DJs, electronic musicians, and
live performers. [C-002] [C-003] [C-027] [C-030]

The current documented host formats are VST3 and LV2 on desktop. Standard builds
enable both; official Windows/macOS packages and the Linux Flatpak enable VST3,
while LV2 is enabled globally. Source retains optional VST2 support only with a
separately supplied SDK; standard packages do not enable it. AU is explicitly
disabled. No official 1.5.0 build path was found for AAX, CLAP, LADSPA, DSSI,
JSFX, DirectX/DXi, Rack Extension, or a native audio-plugin format. [C-010]
[C-011] [C-029]

Hosting is deliberately small: recursive user-path scans cached to `plugins.xml`,
serial in-process stacks, opaque state chunks, programs, generic/native UIs, MIDI
learn, and invalid placeholders. Important DAW-grade contracts are absent or
unproven: scanner/runtime crash isolation, architecture bridging, plugin delay
compensation, tails/offline mode, durable plugin automation, stable parameter
IDs, auxiliary buses/sidechains, dynamic I/O, MPE/MIDI 2.0, and robust missing-
plugin state preservation. [C-012]–[C-018] [C-026]

**Confidence:** high for current source/build architecture and user model; medium
for negative capability conclusions derived from a repository-wide symbol audit;
low/unknown for runtime interoperability, accessibility, code-signing behavior,
and crash recovery because no binary probes were authorized.

## 2. Product identity, history, and market position

**DOCUMENTED:** Giada is maintained by Monocasual Laboratories, is copyrighted
2010–2026, and has a current 1.5.0 release. Upstream describes it as a minimal,
open-source music-production tool for DJs, live performers, and electronic
musicians. [C-001] [C-002]

**DOCUMENTED:** The current public platform set is Linux, Windows, macOS, and
FreeBSD. The download page offers Linux through Flathub, Windows x86-64, macOS
arm64, and source; FreeBSD is a source/build platform rather than an upstream
binary in the cited release workflow. [C-024]

**INFERENCE:** Its market boundary overlaps loopers, clip/pattern tools, live
samplers, MIDI sequencers, plugin racks, and compact DAWs. It does not evidence
the linear arrangement, comping, delivery, or interoperability breadth expected
of a full production DAW. [C-030]

## 3. Workflow and conceptual model

**DOCUMENTED:** Core user objects are tracks/columns, group channels, sample
channels, MIDI channels, actions, a finite beat/bar sequencer pattern, and up to
eight scenes. A scene changes per-channel actions/names and, for sample channels,
the sample, pitch, range, and offset. Running transport normally quantizes scene
changes to the next first beat. [C-003]

**DOCUMENTED:** Sample channels use loop or one-shot play-mode families. Loop
modes are bounded by the main sequencer and do not record actions; one-shot modes
can run independently and record press/release/kill gestures. MIDI channels are
sequencer-bound but may be armed for live controller-to-instrument processing.
[C-028]

**INFERENCE:** Scenes are song sections rather than an unbounded clip matrix, and
the Action Editor is a pattern/event editor rather than an arrangement timeline.
The clean mental model is “perform and capture gestures inside a recurring musical
window.” [C-027] [C-030]

## 4. Publicly documented architecture

**DOCUMENTED:** The tagged tree separates model/document snapshots, sequencer and
actions, renderer/mixer, sample and MIDI channel code, plugin host/manager/wrapper,
storage/patch factories, glue, and FLTK UI. The audio callback acquires a real-
time document view; edits can lock the document, causing channel advance/render
to be skipped for that callback rather than mutating live structures. [C-005]

**DOCUMENTED:** Third-party hosting is implemented through JUCE and a pinned VST3
SDK submodule; the application itself owns scanning, stacks, patch serialization,
and UI integration. [C-010] [C-021]

**UNKNOWN:** Formal thread-safety guarantees, lock-free bounds, real-time
allocation audit, multicore plugin scheduling, service/process diagrams, and ABI
stability are not published. Upstream’s “multi-thread/multi-core” wording is a
vendor statement, not an independent scaling measurement. [C-006]

## 5. Audio engine

**DOCUMENTED:** Upstream states a 32-bit floating-point engine. Tagged source fixes
internal channel buffers at stereo (`G_MAX_IO_CHANS=2`), renders in the device
callback, preserves sample-offset MIDI deltas, reports CPU callback load, and
logs device stream latency. Sample rate and buffer size are user configurable;
sample-rate mismatch and pitch use selectable resampling algorithms. [C-006]

**DOCUMENTED:** Available audio backends/build paths include ALSA, PulseAudio and
JACK on Linux, ASIO/WASAPI/DirectSound on Windows, and CoreAudio on macOS; JACK
transport/synchronization is conditionally integrated. [C-006]

**DOCUMENTED NEGATIVE:** Giada’s non-vendored 1.5.0 source contains no plugin
latency/tail query, PDC graph, offline/non-realtime plugin mode, freeze, bounce,
or mixdown path found by the recorded exact-symbol audit. [C-016] [C-020]

**UNKNOWN:** Supported device sample-rate/bit-depth ranges, internal denormal or
oversampling policy, dropout recovery, multicore scheduler behavior, and measured
round-trip latency require runtime probes.

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED:** Tracks are columns with a group channel; ordinary sample/MIDI
channels feed the group. Composition occurs in a finite beats × bars pattern,
with actions movable/resizable on a snap grid and scenes supplying section-level
variation. There is no documented open-ended linear arrangement or region/clip
timeline. [C-003] [C-004] [C-027]

**DOCUMENTED:** The Action Editor edits press/release/kill, velocity, and MIDI
notes. The sample workflow supports per-scene range, offset, pitch, playback modes,
and a separate sample editor. [C-004] [C-028]

**UNKNOWN/NOT FOUND:** takes, lanes, comping, ripple editing, track folders beyond
the fixed group hierarchy, tempo maps, changing meter maps, warp markers, and
durable undo/history. A repository symbol audit found no undo/redo/history system;
this remains a documentary negative, not a runtime test. [C-020] [C-027]

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED:** MIDI channels record and edit note events in a 128-note piano
roll, preserve sample offsets into plugin MIDI buffers, can drive plugin stacks,
and can send regular MIDI externally on a selected MIDI channel. Sample and MIDI
channels can send JSON-midimap controller-lighting messages. [C-009] [C-025]

**DOCUMENTED:** Synchronization includes MIDI Clock master/slave and conditional
JACK transport. The 1.5.0 playhead gives plugins BPM, sample/seconds/PPQ position,
and playing state, but no transport control. [C-009] [C-016]

**DOCUMENTED NEGATIVE:** The current editor documents notes/velocity only, and the
tagged non-vendored source search found no MPE, MIDI 2.0/UMP, or per-note-expression
integration. Score/notation, SysEx editing, MTC, LTC, Link, and timecode are not
documented. [C-009] [C-025]

## 8. Routing, mixer, automation, and control

**DOCUMENTED:** Rendering follows ordinary channel → parent group → master output.
Channel FX precede channel pan/volume summing; group FX follow child summing;
master-output FX precede final master gain/optional hard limit. Channels/groups
may also fan out to one or more physical stereo output pairs. Master input and
master output each have plugin stacks. [C-007]

**DOCUMENTED:** Controls include mute, solo, volume, stereo pan, parent/master
send, MIDI learn, keyboard bindings, external MIDI output/lighting, MIDI Clock,
and JACK transport. [C-007] [C-009] [C-023]

**DOCUMENTED NEGATIVE:** Durable actions cover sample gestures and MIDI notes,
not plugin parameters. Parameter control uses current parameter indices via UI or
MIDI learn; no persisted plugin automation lane or host-notifying automation API
was found. [C-015]

**INFERENCE:** The routing model is a fixed hierarchy with physical-output fanout,
not a freely patchable graph with arbitrary aux sends/returns, feedback, VCAs, or
surround buses. [C-007]

## 9. Recording, comping, and media handling

**DOCUMENTED:** Giada records live stereo input into a sequencer-bounded buffer,
supports input monitoring, record-on-signal, loop/overdub behavior, and converts
the result to a regular sample. Action recording captures sample gestures or MIDI
notes. [C-008] [C-028]

**DOCUMENTED:** Projects copy used samples into the project directory and resolve
wave paths relative to the patch. The tagged README claims support for major
uncompressed formats but the exact 1.5.0 format matrix is not stated in retained
primary documentation. [C-008] [C-019]

**UNKNOWN/NOT FOUND:** punch ranges, take lanes, comping, media conform/proxies,
video, rich metadata, and a documented missing-sample relink policy. The source
tree contains a missing-assets dialog, but its complete recovery contract was not
needed to resolve this boundary.

## 10. Instruments, effects, content, and native devices

**DOCUMENTED:** Giada’s native sound-producing capability is sample playback;
third-party instruments/effects are inserted as ordered plugins on sample, MIDI,
group, master-input, or master-output channels. MIDI channels can act as virtual-
instrument channels, while sample/input channels act as audio-effect paths.
[C-002] [C-007] [C-014]

**DOCUMENTED NEGATIVE:** No product-native audio plugin/device SDK or bundled
synth/effect architecture appears in the current guide/build. JSON midimaps and
langmaps extend controller feedback/localization, not DSP. [C-011] [C-023]

**UNKNOWN:** bundled presets/content inventory and preset portability beyond each
plugin’s JUCE program list were not documented.

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

The matrix is scoped to upstream 1.5.0, not arbitrary forks. “Absent” means absent
from the documented official host set and tagged build definitions, not a claim
that a developer could never add it. [C-010] [C-011]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED: optional source build only | DOCUMENTED: optional source build only | DOCUMENTED: optional source build only | NOT_APPLICABLE:no edition | 1.5.0 `WITH_VST2=OFF` default; external SDK path mandatory; release builds do not enable it | Source-capable, not a current official-package host claim; no architecture bridge | [C-011]; [S-006]–[S-008] |
| VST3 | DOCUMENTED: arm64 package | DOCUMENTED: x86-64 package | DOCUMENTED: Flatpak/source preset | NOT_APPLICABLE:no edition | 1.5.0 guide, presets, packaging, Flathub manifest | Current official host format | [C-010] [C-029]; [S-005]–[S-010], [S-040] |
| AUv2 | DOCUMENTED: disabled | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no edition | 1.5.0 `JUCE_PLUGINHOST_AU=0` | Absent from official host build | [C-011]; [S-006] |
| AUv3 | DOCUMENTED: absent from host build/docs | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no edition | 1.5.0 official host set is VST3/LV2; AU disabled | No Giada mobile host; no AUv3 path found | [C-011]; [S-005] [S-006] |
| AAX | DOCUMENTED: absent from host build/docs | DOCUMENTED: absent from host build/docs | DOCUMENTED: absent from host build/docs | NOT_APPLICABLE:no edition | 1.5.0 tagged build and guide | No AAX hosting claim; legal/certification implications not assessed | [C-011]; [S-005] [S-006] |
| CLAP | DOCUMENTED: absent from host build/docs | DOCUMENTED: absent from host build/docs | DOCUMENTED: absent from host build/docs | NOT_APPLICABLE:no edition | 1.5.0 tagged build and guide | No CLAP path found | [C-011]; [S-005] [S-006] |
| LV2 | DOCUMENTED: compiled in package build | DOCUMENTED: compiled in package build | DOCUMENTED: Flatpak extension/source | NOT_APPLICABLE:no edition | 1.5.0 guide; global `JUCE_PLUGINHOST_LV2=1`; Flatpak `vst3;lv2` extension | Runtime compatibility by plugin/OS remains untested | [C-010] [C-029]; [S-005] [S-006] [S-040] |
| LADSPA | DOCUMENTED: absent from host build/docs | DOCUMENTED: absent from host build/docs | DOCUMENTED: absent from host build/docs | NOT_APPLICABLE:no edition | 1.5.0 tagged build and guide | No LADSPA path found | [C-011]; [S-005] [S-006] |
| DSSI | DOCUMENTED: absent from host build/docs | DOCUMENTED: absent from host build/docs | DOCUMENTED: absent from host build/docs | NOT_APPLICABLE:no edition | 1.5.0 tagged build and guide | No DSSI path found | [C-011]; [S-005] [S-006] |
| JSFX | DOCUMENTED: absent from host build/docs | DOCUMENTED: absent from host build/docs | DOCUMENTED: absent from host build/docs | NOT_APPLICABLE:no edition | 1.5.0 tagged build and guide | No JSFX interpreter/host path found | [C-011]; [S-005] [S-006] |
| DirectX/DXi | NOT_APPLICABLE:Windows format | DOCUMENTED: absent from host build/docs | NOT_APPLICABLE:Windows format | NOT_APPLICABLE:no edition | 1.5.0 Windows build enables VST3/LV2 only | No DirectX/DXi host path found | [C-011]; [S-006] [S-008] |
| Rack Extension | DOCUMENTED: absent from host build/docs | DOCUMENTED: absent from host build/docs | DOCUMENTED: absent from host build/docs | NOT_APPLICABLE:no edition | 1.5.0 tagged build and guide | No Rack Extension path found | [C-011]; [S-005] [S-006] |
| Product-native/other | DOCUMENTED: none documented | DOCUMENTED: none documented | DOCUMENTED: none documented | NOT_APPLICABLE:no edition | 1.5.0 guide/build | Midimap/langmap JSON are mappings, not audio plugins | [C-011] [C-023]; [S-004] [S-006] [S-036] |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED:** Users enter semicolon-separated directories. Giada recursively
scans every compiled JUCE format, clears the previous known list first, displays
progress/count, and serializes the resulting JUCE list to
`<configDir>/plugins.xml`. Inventory includes identifier, name, category,
manufacturer, format, instrument flag, and current existence. [C-012]

**DOCUMENTED:** `PluginDirectoryScanner` receives an empty dead-man’s-pedal file;
no Giada quarantine/blacklist file or helper scanner process appears. Scan can be
cancelled through its progress callback, but partial-cache semantics are not
documented. [C-012] [C-013]

**UNKNOWN:** duplicate identity/version arbitration, cache migration, incremental
scan, per-plugin validation tests, rescan-after-crash UX, and malformed-cache
recovery. “Scanned” proves only descriptor discovery, not instantiation or full
processing compatibility.

### 11.3 Runtime isolation and compatibility

**DOCUMENTED:** The host directly creates JUCE instances and calls `processBlock`
inside Giada’s processing path. No Giada plugin worker/helper, IPC boundary, or
bridge appears in the tagged non-vendored tree. The guide requires matching OS
and 32/64-bit architecture. [C-013]

**INFERENCE:** scanner or runtime plugin crashes can terminate/corrupt the host;
this follows from the direct in-process boundary but requires a disposable crash
fixture for independent confirmation. [C-013] [C-022]

**UNKNOWN:** Rosetta behavior, Windows-on-ARM, Linux ABI/container compatibility,
macOS library-validation entitlements, plugin code-signing policy, and FreeBSD
plugin qualification. macOS builds enable hardened runtime, but that alone does
not prove plugin validation policy. [C-022] [C-024]

### 11.4 Host/plugin processing contract

**DOCUMENTED:** Plugin stacks are ordered, serial chains. Bypassed, suspended, or
invalid plugins are skipped. A mutable MIDI buffer is passed from one plugin to
the next, allowing generated MIDI to feed downstream plugins. Audio is 32-bit
float/stereo at the Giada boundary. [C-014]

**DOCUMENTED:** At instantiation Giada sets the main input/output buses to two
channels, allocates for currently enabled buses, and calls `prepareToPlay`.
Source explicitly says “currently only the main bus is supported.” Output merges
only the main output, so sidechains, auxiliary buses, and full multi-output
instruments are outside the evidenced contract. [C-014]

**DOCUMENTED NEGATIVE:** no plugin latency/tail reporting, PDC, offline mode,
double precision, dynamic bus renegotiation, or host bypass callback was found.
Host bypass simply skips the processor. [C-014] [C-016]

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED:** Parameters are enumerated and addressed by current array index;
Giada exposes name (requested up to 64 characters), label, normalized value, and
display text. MIDI learn is persisted positionally. Changes call `setValue`, not
host-notifying gestures. [C-015]

**DOCUMENTED:** Program lists are exposed. Projects store JUCE identifier, bypass,
opaque state as base64, and MIDI-learn words. Successful recall instantiates then
applies state/bypass/mappings. [C-017]

**DOCUMENTED NEGATIVE:** actions/projects do not persist plugin parameter lanes,
stable parameter IDs, gestures, or program selection. Therefore sample-accurate
plugin automation is not evidenced. [C-015]

**INFERENCE:** if instantiation fails, the invalid placeholder keeps only Giada
ID/JUCE ID; deserializer returns before applying saved state. Re-saving likely
replaces the original chunk with an empty state. This needs a missing-plugin
round-trip probe before being treated as observed data loss. [C-026]

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED:** Giada opens a plugin’s native JUCE editor in a separate non-modal
host window, applies a scaling factor, and follows resize callbacks. If no native
editor exists, a generic FLTK parameter-slider window is available. [C-018]

**DOCUMENTED:** Logs cover scan names/count, cache-save failure, missing JUCE ID,
instance creation error text, and editor creation failure. Invalid placeholders
show `** invalid **` and are skipped by processing. [C-017] [C-018]

**UNKNOWN:** plugin-UI crash containment, accessibility, headless operation,
Wayland behavior, editor focus/keyboard routing, scaling persistence, and recovery
from a plugin that hangs during scan/instantiate/process/state/UI.

## 12. Extensibility and integration

**DOCUMENTED:** Extensibility consists primarily of GPL source modification,
third-party VST3/LV2 plugins, JSON project files, JSON controller midimaps, JSON
language maps, MIDI I/O/clock, JACK transport, keyboard/MIDI learn, and ordinary
filesystem access. [C-021] [C-023]

**DOCUMENTED NEGATIVE:** no stable scripting API, native device SDK, OSC/remote
API, plugin authoring SDK, or macro language is documented for 1.5.0. [C-023]

**UNKNOWN:** any unofficial control protocol or downstream extension ABI is out
of scope and cannot be inferred from open source alone.

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED:** A project is a transparent `.gprj` directory containing samples
and a same-name JSON `.gptc`. The patch stores version, tempo/pattern, tracks,
channels/scenes/routing, actions, relative waves, and plugin records. Plugins are
not bundled, so cross-machine recall requires compatible installations. [C-019]

**DOCUMENTED:** Loader migrates pre-1.1 tracks, pre-1.4 scenes, and pre-1.5
frame-based actions to ticks; files before 0.16 are rejected. Loading validates
the patch, suspends mixer/sync, resets the engine, rebuilds against current sample
rate/buffer, then resumes. [C-019]

**DOCUMENTED NEGATIVE/UNKNOWN:** no autosave journal, crash-recovery project,
atomic temporary-save/rename, undo history, plugin-version record, archive
manifest, cloud collaboration, version control integration, AAF/OMF/ADM,
DAWproject, MusicXML, or MIDI-file interchange was found in the retained guide
or tagged non-vendored symbol audit. [C-020]

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED:** The specialty is live performance: quantized launching, queued
scene changes, action capture, live sampling, controller lighting, MIDI Clock,
JACK transport, direct physical stereo-output pairs, and CPU-load display.
[C-002] [C-003] [C-009]

**DOCUMENTED NEGATIVE:** no full-mix offline export, freeze/bounce, stem queue,
loudness/DDP, video/timecode/ADR, surround/immersive/ADM, notation delivery, or
batch render path was found. [C-020]

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED:** Upstream calls channels/plugins “unlimited,” but the practical
limit is CPU/device-dependent; this is not a benchmark. 1.5.0 displays callback
CPU load, exposes buffer-size/quality tradeoffs, and emits file/stdout debug logs.
[C-006]

**DOCUMENTED:** Plugin scan/render/UI are in process with no Giada quarantine or
crash boundary. Linux Flatpak grants home access and audio/X11/IPC-related
permissions; macOS source enables hardened runtime. [C-013] [C-022] [C-029]

**INFERENCE:** third-party plugins are a high-trust boundary, especially for a
live tool: hangs/crashes can affect the show, and plugin latency is uncompensated.
The mitigation visible to users is manual compatibility selection and CPU/buffer
management, not isolation. [C-016] [C-022]

**UNKNOWN:** tested scaling ceilings, XRuns/dropout recovery, memory limits,
reproducible/signature/notarization status, telemetry/privacy beyond the website,
update rollback, vulnerability process, keyboard-only coverage, screen-reader
semantics, color/contrast, and plugin-editor accessibility.

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED:** Giada’s repository contains GPLv3 terms; its README says GPL and
includes “version 3 or later” notice language. The tagged tree pins JUCE and the
Steinberg VST3 SDK, among other dependencies. Optional VST2 requires an external
SDK path and is not shipped/enabled in standard packages. [C-021]

**CONSTRAINT:** GPL obligations, every dependency/SDK license, VST trademarks,
VST2 availability, VST3 terms, Apple platform rules, signing/notarization, and
plugin redistribution/certification require separate legal/SBOM review. Naming a
format grants no rights. No source or expression should be copied; only clean-room
behavioral patterns may be considered. [C-021]

**UNKNOWN:** complete transitive license compatibility and release-binary notices
were not audited. This dossier is not legal advice.

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- A compact channel/action/scene model closely matches live-loop performance and
  makes the project state transparent. [C-003] [C-019]
- Serial plugin stacks at channel/group/master points are easy to understand; MIDI
  generated upstream can drive downstream instruments. [C-007] [C-014]
- Relative sample bundling plus opaque plugin state gives useful project
  portability without a proprietary database. [C-017] [C-019]
- Tick-based actions and queued scene changes align performance capture and
  playback to musical time. [C-004]

### Liabilities

- No process isolation/bridge/quarantine makes third-party plugins a live-show
  reliability risk. [C-013] [C-022]
- Main-bus-only stereo processing, no PDC/tails/offline mode, and no durable plugin
  automation materially limit DAW-grade hosting. [C-014]–[C-016]
- Missing-plugin placeholders are useful, but inferred state loss on resave could
  undermine recoverability. [C-017] [C-026]
- Eight scenes and no open-ended arrangement/takes/comping/delivery keep the tool
  specialized rather than general purpose. [C-027] [C-030]

### Architecture lesson

**INFERENCE:** Giada is a valuable reference for a small live-loop host and
transparent project model, but not for a full-fidelity plugin subsystem or linear
DAW. Adapt the bounded concepts; do not inherit the process-trust, bus, latency,
automation, or missing-state limitations. [C-030]

## 18. Transferable patterns

1. **CANDIDATE — Tick-addressed performance actions.** Problem: capture live
   gestures while preserving musical edits. Minimal mechanism: stable action IDs,
   ticks, channel/scene ownership, and frame↔tick migration. Evidence: [C-004]
   [C-019]. Prerequisites: tempo-aware conversion and deterministic block slicing.
   Tradeoff: finite-pattern semantics complicate linear arrangements. Adaptation
   risk: medium; specify tempo-map behavior before reuse.
2. **CANDIDATE — Quantized scene handoff.** Problem: change song sections without
   breaking live timing. Minimal mechanism: active/upcoming scene plus boundary
   commit and explicit force switch. Evidence: [C-003]. Prerequisites: shared
   musical clock. Tradeoff: simple, but eight fixed scenes are too restrictive.
   Adaptation risk: low if scene count/object model is generalized.
3. **CANDIDATE — Transparent portable project directory.** Problem: move sessions
   without opaque archives. Minimal mechanism: versioned JSON plus relative copied
   assets and explicit external-plugin dependency. Evidence: [C-019].
   Prerequisites: atomic save, checksums, relink, and schema migrations. Tradeoff:
   human editability versus large directories and integrity risks. Adaptation risk:
   medium.
4. **CONDITIONAL — Invalid plugin placeholder.** Problem: preserve graph shape
   when a plugin is missing. Minimal mechanism: immutable plugin identity plus
   untouched opaque state and diagnostics. Giada demonstrates the placeholder but
   apparently not untouched-state round trips. Evidence: [C-017] [C-026].
   Prerequisites: preserve original blob/metadata verbatim. Tradeoff: stale state
   and migration ambiguity. Adaptation risk: high until tested.
5. **CONDITIONAL — Fixed hierarchical live mixer.** Problem: make live routing
   predictable. Minimal mechanism: channel → group → master plus explicit hardware
   fanout. Evidence: [C-007]. Prerequisites: clear feedback prohibition and latency
   model. Tradeoff: far easier than a graph but insufficient for aux/sidechain DAW
   workflows. Adaptation risk: low for a loop instrument, high for a DAW.

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected mechanisms

- **REJECT:** in-process scan/render as the only plugin trust boundary. It saves
  complexity but gives no crash/hang containment. [C-013] [C-022]
- **REJECT:** positional parameter persistence without stable IDs or orphan
  handling. Plugin updates can reorder parameters. [C-015]
- **REJECT:** dropping the original state when a plugin is unavailable; preserve
  opaque bytes even if no instance exists. [C-026]
- **REJECT for a general DAW:** main-bus-only fixed stereo plugin contract and no
  latency/tail model. [C-014] [C-016]

### `CURIOSITY_NO_GO` threads

- Historical release archaeology: low novelty and cannot change current 1.5.0
  architecture; reopen only for a migration dossier.
- Generic JUCE scanner/format internals: indirect evidence; Giada’s explicit
  process choices are already resolved. Reopen only when designing a JUCE host.
- Third-party compatibility lists/plugin-vendor reports: secondary and
  non-exhaustive; replace with a disposable conformance fixture.
- VST trademark/licensing history: requires legal owner sources and counsel;
  current decision only needs the explicit external VST2 SDK boundary.
- Exhaustive dependency-license audit: high cost and separate SBOM/legal work.
- Controller-midimap inventory, platform window bugs, and every sample-editor
  operation: ecosystem/UI detail with no effect on the architecture decision.
- Repeated web search after `HTTP 429`: rejected; the immutable Flathub repository
  was fetched directly instead.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test | Result | Counterevidence/next probe |
| --- | --- | --- | --- |
| H-01 Official 1.5.0 hosts only VST3/LV2 | Guide + CMake + package/Flatpak flags | **Confirmed with nuance:** optional source VST2 remains | Build all package variants and inspect registered formats |
| H-02 “Format supported” implies full DAW host contract | Inspect wrapper/renderer/state/UI | **Falsified:** main bus only; no PDC/offline/automation/isolation | Multi-bus, latency, state, MIDI generator fixture |
| H-03 Plugin scan is isolated | Search helper/IPC and scanner call | **Falsified in source:** direct scanner and empty dead-man file | Crash/hang scanner fixture in disposable process |
| H-04 Giada is a linear DAW | Guide’s sequencer/scenes/editor | **Falsified:** finite pattern/actions/eight scenes | None needed for current version |
| H-05 Plugin parameters are recorded actions | Recorder/editor docs + action/patch schema + symbol references | **Falsified:** positional live control only | Record a mapped knob and inspect patch/events |
| H-06 Missing plugin state survives round trip | Trace deserialize-invalid → serialize | **Likely falsified (INFERENCE)** | Save project, remove plugin, load/save, compare state bytes |
| H-07 Plugin-generated MIDI can feed later plugins | Release + `PluginHost::processPlugins` | **Documented true** | Two-plugin generator/instrument timing fixture |
| H-08 Linux Flatpak cannot see audio plugins | Inspect immutable manifest | **Falsified broadly:** LinuxAudio extension/home/LV2 paths exist | Qualify host/user VST3 and LV2 bundles in sandbox |

Contradictions retained: GitHub and website differ by one day on release date;
upstream “unlimited” channel/plugin claims are unmeasured; guide-level format
support does not prove scan/instantiate/process/state/UI completeness.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current release is 1.5.0/tag commit; one desktop product | 1.5.0 | S-001, S-009 | Release/site | Date differs by one day |
| C-002 | DOCUMENTED | High | Live loop/sample/song/FX/MIDI-controller positioning | Product | S-002, S-009, S-025 | Upstream descriptions | Marketing, not usage measurement |
| C-003 | DOCUMENTED | High | Channels/actions/finite sequencer/up to eight scenes | 1.5.0 | S-025–S-028 | User guide | None material |
| C-004 | DOCUMENTED | High | Tick engine and note/velocity/gesture Action Editor | 1.5.0 | S-001, S-021, S-022, S-035 | Release + schema + guide | No tempo-map qualification |
| C-005 | DOCUMENTED | High | Modular source map and real-time document-view rendering | tag 1.5.0 | S-003, S-031 | Tree + renderer | Formal RT guarantees unknown |
| C-006 | DOCUMENTED | Medium-high | Float32/stereo callback engine, backends, buffer/resample/CPU controls | 1.5.0 | S-002, S-009, S-010, S-020, S-029, S-031 | Guide/source triangulation | “Multicore/unlimited” unmeasured |
| C-007 | DOCUMENTED | High | Channel→group→master routing plus hardware fanout and FX order | tag 1.5.0 | S-021, S-031, S-032 | Schema/renderer/UI | No runtime probe |
| C-008 | DOCUMENTED | High | Live input/action recording and sample-containing projects | 1.5.0 | S-023, S-024, S-028, S-034 | Guide + storage | Exact media matrix unknown |
| C-009 | DOCUMENTED | High | Note MIDI, external MIDI, lighting, MIDI Clock, JACK sync | 1.5.0 | S-010, S-031, S-033–S-036 | Guide/source | MTC/Link absent from evidence |
| C-010 | DOCUMENTED | High | Current official host set/builds are VST3 and LV2 | 1.5.0 desktop | S-005–S-010, S-040 | Guide/build/package | Runtime fidelity untested |
| C-011 | DOCUMENTED | High | VST2 is optional/external-SDK; AU disabled; other matrix formats absent from official build/docs | tag 1.5.0 | S-005–S-008 | Build definitions + guide | Forks can differ |
| C-012 | DOCUMENTED | High | Recursive user-path scan replaces and caches JUCE list in `plugins.xml` | tag 1.5.0 | S-005, S-010, S-012 | UI + implementation | Duplicate policy delegated/unknown |
| C-013 | DOCUMENTED + INFERENCE | Medium-high | Direct in-process scan/instances; no bridge/helper; matching OS/bitness required | tag 1.5.0 | S-003, S-005, S-011, S-012 | Tree/symbol audit + guide | Crash consequence inferred |
| C-014 | DOCUMENTED | High | Ordered serial stacks, downstream generated MIDI, stereo/main-bus-only contract | tag 1.5.0 | S-011, S-013, S-030, S-031 | Explicit source/comment | Complex plugins need fixtures |
| C-015 | DOCUMENTED | High | Parameters are positional live/MIDI-learn controls; no durable plugin automation | tag 1.5.0 | S-015, S-019, S-021, S-022, S-034, S-035 | API + schema + guide | Runtime mapped-knob record probe pending |
| C-016 | DOCUMENTED NEGATIVE | Medium-high | Limited playhead; no plugin PDC/tails/offline mode found | tag 1.5.0 | S-003, S-013, S-016 | Exact-symbol repository audit | Negative source evidence, no binary probe |
| C-017 | DOCUMENTED | High | Opaque state/programs/MIDI mappings and invalid placeholders | tag 1.5.0 | S-013, S-014, S-021, S-022 | Wrapper/factory/schema | Cross-version plugin behavior unknown |
| C-018 | DOCUMENTED | High | Native detached UI with scaling/resize and generic fallback | tag 1.5.0 | S-005, S-017, S-018 | Guide + source | Accessibility/headless unknown |
| C-019 | DOCUMENTED | High | Transparent versioned project folder/JSON, relative assets, migrations | 1.5.0 | S-021–S-024 | Guide/schema/storage | Atomicity/recovery unknown |
| C-020 | DOCUMENTED NEGATIVE | Medium | No general delivery, autosave/history, or interchange path found | 1.5.0 | S-003, S-004, S-006, S-023 | Guide/tree/symbol audit | Absence is bounded to retained sources |
| C-021 | DOCUMENTED | High | GPLv3-family notice; JUCE/VST3 pinned; VST2 external | tag 1.5.0 | S-002, S-006, S-037, S-038 | License/build/submodules | No transitive legal audit |
| C-022 | DOCUMENTED + INFERENCE | Medium | Plugin trust is in-process; hardened runtime/Flatpak permissions exist | 1.5.0 packages | S-006, S-008, S-011, S-012, S-018, S-040 | Source/package | Signing and exploit resistance unknown |
| C-023 | DOCUMENTED NEGATIVE | Medium-high | JSON mappings/files and MIDI/JACK are integrations; no scripting/native-device API documented | 1.5.0 | S-002, S-004, S-036 | Guide/tree | Unofficial APIs out of scope |
| C-024 | DOCUMENTED | High | Linux/Windows/macOS/FreeBSD source platform; current package architectures | 1.5.0 | S-006, S-008, S-009, S-040 | Site/build/package | FreeBSD plugin runtime unknown |
| C-025 | DOCUMENTED NEGATIVE | High | Note/velocity editor; no notation/MPE/MIDI2 path found | 1.5.0 | S-035, S-003 | Guide + symbol audit | Other raw MIDI input events not fully qualified |
| C-026 | INFERENCE | Medium-high | Missing-plugin load then save likely loses original state | tag 1.5.0 | S-013, S-014, S-021, S-022 | Invalid factory returns before state; invalid `getState` empty | Must be dynamically reproduced |
| C-027 | DOCUMENTED + INFERENCE | High | No open-ended linear/take/comp workflow; pattern/scene boundary | 1.5.0 | S-025–S-028, S-035 | Guide | Future versions may expand |
| C-028 | DOCUMENTED | High | Sample play modes and action/live-record scope | 1.5.0 | S-028, S-034 | Guide | None material |
| C-029 | DOCUMENTED | High | Flatpak builds VST3/LV2 and exposes LinuxAudio plugin extension/home/LV2 paths | Flathub 1.5.0 | S-039, S-040 | Immutable manifest | Actual plugin compatibility untested |
| C-030 | INFERENCE | High | Giada is a live loop/action workstation with DAW-like edges, not a general DAW | 1.5.0 | C-003, C-007, C-014–C-020, C-027 | Cross-section synthesis | Product-category labels are interpretive |

## 22. Source ledger and adaptive bibliography

All sources accessed 2026-08-29. GitHub tag `1.5.0` resolves to commit
`ccbec4fd64def360dbc2d36174b5199b4dc7462e`. Each source was chosen over blogs or
search snippets because it is official documentation, release/build metadata, or
immutable source. Search text was treated as untrusted discovery only.

| ID | Source / URL / kind and scope | Relevant passage or symbol; supported claims | Limitations and selection rationale |
| --- | --- | --- | --- |
| S-001 | GitHub/Monocasual, [1.5.0 release](https://github.com/monocasual/giada/releases/tag/1.5.0), official release | tag/commit/date; tick engine, action storage, plugin MIDI forwarding/playhead/CPU; C-001,C-004 | Vendor release claim, no runtime measurement; definitive current tag |
| S-002 | Monocasual, [`README.md` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/README.md), immutable overview | roles, float32/backends/JSON/GPL; C-002,C-006,C-021,C-023 | Some marketing language; selected for tagged scope |
| S-003 | GitHub API, [`1.5.0` recursive tree](https://api.github.com/repos/monocasual/giada/git/trees/1.5.0?recursive=1), immutable tree | module inventory and repository-wide negative-search universe; C-005,C-013,C-016,C-020,C-025 | File presence alone does not prove behavior; best completeness map |
| S-004 | Monocasual, [User guide index](https://www.giadamusic.com/documentation-index), official current docs | guide coverage and absent extension/delivery chapters; C-020,C-023 | Unversioned page; selected as canonical documentation map |
| S-005 | Monocasual, [Audio plug-ins](https://www.giadamusic.com/documentation-audio-plugins), official guide | VST3/LV2, stacks, programs, GUI fallback, OS/bitness; C-010–C-013,C-018 | Does not specify every host contract; paired with source |
| S-006 | Monocasual, [`CMakeLists.txt` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/CMakeLists.txt), immutable build source | OSes/backends, host defines, VST2 SDK, AU=0, LV2, hardened runtime; C-006,C-010,C-011,C-021,C-022,C-024 | Compile flags do not prove runtime; authoritative build boundary |
| S-007 | Monocasual, [`CMakePresets.json` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/CMakePresets.json), immutable build metadata | standard Linux/Windows/macOS presets set VST3 ON; C-010,C-011 | Presets can be bypassed; selected for standard builds |
| S-008 | Monocasual, [`.github/workflows/packaging.yml` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/.github/workflows/packaging.yml), immutable release workflow | package architectures and VST3 flags; C-010,C-011,C-022,C-024 | Does not prove signing/notarization; best upstream package recipe |
| S-009 | Monocasual, [Giada home/download](https://www.giadamusic.com/), official site | current version/date/platform/packages/VST3/LV2/positioning; C-001,C-002,C-006,C-010,C-024 | Unversioned, marketing; triangulated with tag/workflow |
| S-010 | Monocasual, [Configuration](https://www.giadamusic.com/documentation-configuration), official guide | buffer/sample rate/resampling, MIDI Clock, plugin paths, logs; C-006,C-009,C-010,C-012 | UI contract only; paired with source implementation |
| S-011 | Monocasual, [`src/core/plugins/pluginHost.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/plugins/pluginHost.cpp), immutable source | `processStack`, `processPlugins`, `processPlugin`; C-013,C-014,C-022 | Static analysis, not runtime |
| S-012 | Monocasual, [`src/core/plugins/pluginManager.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/plugins/pluginManager.cpp), immutable source | `reset`, `scanDirs`, `saveList/loadList`, `makeJucePlugin`; C-012,C-013,C-022 | JUCE internals not recursed; Giada choices explicit |
| S-013 | Monocasual, [`src/core/plugins/plugin.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/plugins/plugin.cpp), immutable source | constructor/buses/process/state/UI/programs; C-014,C-016,C-017,C-026 | Static analysis |
| S-014 | Monocasual, [`src/core/plugins/pluginFactory.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/plugins/pluginFactory.cpp), immutable source | invalid placeholder, deserialize/serialize; C-017,C-026 | State-loss conclusion remains inference |
| S-015 | Monocasual, [`src/core/plugins/pluginParameter.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/plugins/pluginParameter.cpp), immutable source | index/name/label/value/setValue; C-015 | No scheduler context; paired with schemas/docs |
| S-016 | Monocasual, [`src/core/plugins/pluginAudioPlayHead.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/plugins/pluginAudioPlayHead.cpp), immutable source | `getPosition`, `canControlTransport`; C-016 | Fields not set remain a source negative |
| S-017 | Monocasual, [`src/gui/dialogs/pluginWindow.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/gui/dialogs/pluginWindow.cpp), immutable source | generic parameter UI; C-018 | UI not executed |
| S-018 | Monocasual, [`src/gui/dialogs/pluginWindowGUI.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/gui/dialogs/pluginWindowGUI.cpp), immutable source | native editor, handles, scaling, resize, logging; C-018,C-022 | Platform behavior untested |
| S-019 | Monocasual, [`src/core/actions/action.h` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/actions/action.h), immutable source | in-memory action fields; C-015 | Dormant fields do not prove feature; checked against patch |
| S-020 | Monocasual, [`src/core/const.h` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/const.h), immutable source | stereo and MIDI/event polling constants; C-006 | Constants do not measure latency |
| S-021 | Monocasual, [`src/core/patch.h` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/patch.h), immutable schema | track/channel/action/wave/plugin records; C-004,C-007,C-015,C-017,C-019,C-026 | Struct schema paired with serializer |
| S-022 | Monocasual, [`src/core/patchFactory.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/patchFactory.cpp), immutable source | read/write/migrations/validation; C-004,C-015,C-017,C-019,C-026 | Static analysis |
| S-023 | Monocasual, [Save/load projects](https://www.giadamusic.com/documentation-save-load-export), official guide | `.gprj`/`.gptc`, copied samples, external plugins; C-008,C-019,C-020 | Unversioned; current site at cutoff |
| S-024 | Monocasual, [`src/core/api/storageApi.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/api/storageApi.cpp), immutable source | store/load lifecycle; C-008,C-019 | Does not cover UI cancellation/recovery |
| S-025 | Monocasual, [Performing part 1](https://www.giadamusic.com/documentation-performing-1), official guide | channel/action roles and use modes; C-002,C-003,C-027 | Product-language source; selected for mental model |
| S-026 | Monocasual, [Performing part 2](https://www.giadamusic.com/documentation-performing-2), official guide | finite sequencer/live quantizer; C-003,C-027 | UI-level |
| S-027 | Monocasual, [Channels and scenes](https://www.giadamusic.com/documentation-channels-and-scenes), official guide | eight scenes/content/switch boundary; C-003,C-027 | No measured timing |
| S-028 | Monocasual, [Channels and samples](https://www.giadamusic.com/documentation-channels-and-samples), official guide | play modes/routing/recording/actions; C-003,C-008,C-028 | Some export wording not pursued; core modes clear |
| S-029 | Monocasual, [`src/core/mixer.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/mixer.cpp), immutable source | stereo buffers/input recording/limit/peaks; C-006,C-008 | Rendering graph is in S-031 |
| S-030 | Monocasual, [`src/core/rendering/pluginRendering.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/rendering/pluginRendering.cpp), immutable source | MIDI queue to JUCE delta events; C-014 | Paired with host/renderer |
| S-031 | Monocasual, [`src/core/rendering/renderer.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/core/rendering/renderer.cpp), immutable source | callback/document view/routing/FX order/JACK/CPU; C-005–C-009,C-014 | Static analysis |
| S-032 | Monocasual, [`src/gui/dialogs/channelRouting.cpp` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/src/gui/dialogs/channelRouting.cpp), immutable source | pan/volume/parent send/physical output pairs; C-007 | UI contract, not hardware probe |
| S-033 | Monocasual, [Channels and MIDI](https://www.giadamusic.com/documentation-channels-and-midi), official guide | sequencer-bound MIDI/plugin channel; C-009 | Event breadth clarified by Action Editor |
| S-034 | Monocasual, [Recording actions](https://www.giadamusic.com/documentation-recording-actions), official guide | captured gestures/notes/live FX/record-on-signal; C-008,C-009,C-015,C-028 | Does not prove every MIDI message |
| S-035 | Monocasual, [Action Editor](https://www.giadamusic.com/documentation-action-editor), official guide | supported action/editor types; C-004,C-015,C-025,C-027 | Absence of lanes is bounded to documented editor |
| S-036 | Monocasual, [MIDI output management](https://www.giadamusic.com/documentation-midi-output-management), official guide | regular MIDI and JSON lighting maps; C-009,C-023 | Controller examples do not prove broad compatibility |
| S-037 | Monocasual, [`COPYING` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/COPYING), immutable license file | GPLv3 text; C-021 | Not a dependency-license audit |
| S-038 | Monocasual, [`.gitmodules` at 1.5.0](https://github.com/monocasual/giada/blob/1.5.0/.gitmodules), immutable dependency map | JUCE/VST3 and other submodules; C-021 | URLs plus pinned tree SHAs, not license conclusions |
| S-039 | Flathub, [Giada 1.5.0 manifest update commit](https://github.com/flathub/com.giadamusic.Giada/commit/962bdbf48ec0e69b06bb274279f03f556a2f0b76), immutable packaging metadata | version/source hash; C-029 | Third-party distributor, but canonical advertised Flatpak |
| S-040 | Flathub, [`com.giadamusic.Giada.json` at `962bdbf`](https://github.com/flathub/com.giadamusic.Giada/blob/962bdbf48ec0e69b06bb274279f03f556a2f0b76/com.giadamusic.Giada.json), immutable manifest | VST3 flag, LinuxAudio extension, LV2 path, sandbox permissions; C-010,C-022,C-024,C-029 | Build manifest, not runtime qualification |

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe / access / owner |
| --- | --- | --- | --- |
| Actual VST3/LV2 compatibility by OS/package | Guide/build/manifest prove compile/discovery intent; no binary execution authorized | High | Disposable signed/unsigned effect, instrument, MIDI-generator matrix on Windows x64, macOS arm64, Flatpak Linux; unassigned QA owner |
| Scanner/runtime crash and hang containment | Source shows direct calls/no helper; consequence remains inference | High | Deliberately crashing/hanging test plugins in disposable hosts; process/timeout/log observation; security/QA owner |
| PDC, tails, sidechain, multi-output, dynamic I/O, offline behavior | Exact API/symbol audit and explicit main-bus comment; no fixture | High | Conformance plugins reporting latency/tails and changing buses; loopback render and timestamps; audio-engine owner |
| Missing-plugin state survival | Static path indicates state loss; no project round trip run | High | Save known state, remove plugin, load/save, byte-compare `.gptc`, restore plugin; persistence owner |
| Parameter identity/automation timing | Positional setters and no durable schema found | High | MIDI-learn knob recording plus project/action inspection; update plugin with reordered parameters; automation owner |
| Duplicate plugin IDs/cache corruption | JUCE list is delegated; no documented policy | Medium | Two versions/same IDs, malformed `plugins.xml`, partial/cancelled scan; plugin-host owner |
| macOS signing/library validation and Rosetta | Hardened runtime flag only | Medium-high | Inspect entitlements/signatures of release archive, qualify signed/unsigned arm64 plugins; release/security owner |
| Autosave, save atomicity, corruption recovery | Direct final-file write and no autosave symbols; no failure injection | Medium | Power/fault injection during save and malformed JSON recovery; persistence owner |
| FreeBSD plugin support | Source platform named; no upstream package/runtime test | Medium | Build 1.5.0 with VST3/LV2 and run minimal fixtures on supported FreeBSD; platform owner |
| Accessibility/localization of host and plugin windows | No primary accessibility statement/probe | Medium | Keyboard, screen-reader, scaling/contrast audit on each OS; accessibility owner |
| Exact media import/export formats | README says major uncompressed formats; no exact current table retained | Low-medium | Enumerate libsndfile build/features and safe fixture import/save; media owner |

Nested bounded source-research delegation was attempted but blocked because this
session is already at the configured subagent depth limit. The parent researcher
performed the bounded source passes directly; no nested edits occurred.

## 24. Curiosity pass and stop decision

Scores are 0–4; lower cost is better.

| Candidate follow-up | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Linux Flatpak plugin build/visibility | 4 | 4 | 3 | 1 | **PURSUED**; upgraded Linux package evidence [C-029] |
| Generic JUCE scanner internals | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: indirect and non-Giada-specific |
| Historical Giada plugin evolution | 1 | 1 | 2 | 3 | `CURIOSITY_NO_GO`: current boundary already pinned |
| Plugin-vendor compatibility reports | 2 | 2 | 1 | 3 | `CURIOSITY_NO_GO`: secondary/non-exhaustive; use fixtures |
| Full VST/legal history | 2 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: separate counsel/SBOM work |
| Midimap/controller census | 1 | 1 | 2 | 2 | `CURIOSITY_NO_GO`: ecosystem, not architecture |
| Platform plugin-window edge bugs | 2 | 1 | 2 | 3 | `CURIOSITY_NO_GO`: dynamic UI qualification later |

**Stop decision:** `STOP_COVERAGE_AND_SATURATION`. All template sections and all
required plugin rows are complete; current identity/packages, loop/sequencer,
engine/routing, MIDI/actions/sync, scanner/runtime/state/UI, persistence/live use,
platform/license, negative results, and unknowns are represented by primary or
immutable evidence. The best curiosity thread was pursued successfully. Further
documentary retrieval is unlikely to change the leading conclusion; remaining
questions require dynamic fixtures, accessibility review, or legal/SBOM work.
The web-search `HTTP 429` and nested-subagent depth limit did not block coverage.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added
  `research/daw-landscape/dossiers/giada.md`; no staging/commit.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
- [x] **Every required dossier heading exists in order.** Sections 0–25 present.
- [x] **Every material assertion has a claim ID and classification.** Substantive
  findings resolve through C-001–C-030; unknowns are labeled.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.**
- [x] **Every required plugin-format row is present.** All 13 rows completed.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Scan, cache, process, buses, MIDI, parameters, state, UI, failure, and latency
  boundaries covered.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
- [x] **Licensing and clean-room boundaries are explicit.**
- [x] **Bibliography records source rationale and limitations.** 40 sources.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.**
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Only public pages and open tagged source were read; no
  product/plugin binary was run.

**Checks performed:** heading/order check, required-format row check, claim/source
cross-check, immutable tag/commit check, repository exact-symbol negative audit,
and pre/post workspace status review.

**Unresolved blockers:** no dynamic compatibility/crash/state/accessibility probes;
nested researcher unavailable at configured depth; one discovery web search was
rate-limited but replaced with direct immutable Flathub sources.

**Pre-existing workspace changes:** numerous modified/untracked files outside this
owned dossier, including the already-untracked `research/daw-landscape/` tree,
were observed and left untouched.
