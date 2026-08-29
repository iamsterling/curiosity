# Zrythm DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** Zrythm digital audio workstation.
- **Canonical upstream:** Alexandros Theodotou / Zrythm project, with the canonical repository at `gitlab.zrythm.org` and official release artifacts mirrored through the `zrythm/zrythm` GitHub releases page. [C-001] [C-002]
- **Researcher/session:** research specialist, `ses_fb274b0cbffdcRUUD94m9dmY8w`.
- **Owned path:** `research/daw-landscape/dossiers/zrythm.md`.
- **Research date / cutoff:** 2026-08-29 UTC.
- **Current release scope:** prerelease `v2.0.0-alpha.2`, published 2026-07-28 UTC for GNU/Linux, macOS, and Windows; its pinned changelog is dated 2026-07-29. [C-002]
- **Historical comparison:** stable v1 `1.0.0` (2024-11-21) is used only to bound the rewrite and legacy plugin capabilities. It is not treated as the current architecture. [C-003]
- **Edition scope:** public source plus official alpha artifacts. Source contains installer/trial build switches, but no current feature-by-edition matrix was established; edition-specific enablement is therefore `UNKNOWN`. [C-004]
- **Platform scope:** desktop GNU/Linux, macOS, and Windows. No mobile or web Zrythm product was established. [C-002] [C-042]
- **Inclusions:** public workflow, engine, graph, recording, persistence, extension, plugin-hosting, licensing, trademark, and v1-to-v2 transition evidence.
- **Exclusions:** binary/installer/plugin execution; private infrastructure; proprietary code; performance or format-conformance claims not established by public evidence; legal advice.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. The open source supports an unusually deep documentary architecture review, but the named current release is alpha and several release paths remain explicitly unfinished. [C-004] [C-039]

## 1. Executive summary

Zrythm v2 is a cross-platform, linear music-production DAW in an active C++23/Qt/QML/JUCE rewrite. Its public source exposes a UUID-based project model, directed acyclic DSP graph, parallel scheduler, latency preroll/compensation, RT/non-RT recording boundary, format-specific plugin adapters, and schema-validated project persistence. This makes it a useful clean-room reference for architecture boundaries, not evidence of production maturity. [C-005] [C-007] [C-008] [C-009] [C-011] [C-027]

The current plugin headline is **VST3, CLAP, LV2, LADSPA, and AudioUnit**, with important platform qualifications. Discovery executes plugin code in a scanner child process with timeout and blacklist/cache handling, but normal JUCE and CLAP rendering calls the plugin in the DAW process. Scanner isolation must not be described as a runtime sandbox. [C-017] [C-020] [C-021] [C-034]

The host boundary goes beyond format names: source covers audio and MIDI/event ports, multiple buses/sidechains, parameter IDs and bidirectional synchronization, native/generic UI paths, plugin latency, and inline state recall. Fidelity is incomplete: CLAP transport is passed as null, parameter events are emitted at offset zero, per-note expression is not implemented, some callbacks are stored but not acted upon, and dynamic-I/O behavior is unresolved. [C-022] [C-023] [C-024] [C-025] [C-026]

The v1/v2 distinction is decisive. v1 documented VST2, DSSI, SoundFonts, JSFX history, and optional Carla bridging/sandboxing; v2 expressly lists VST2, DSSI, SoundFonts, and bridging among features not yet ported. Automatic backup recovery and serializable undo are also currently stubbed despite legacy/manual text that describes them. [C-006] [C-018] [C-019] [C-029] [C-040]

Current licensing is AGPL-3.0-or-later with Section 7 trademark conditions and file-level REUSE notices. The project records a GPLv3-or-later to AGPLv3-or-later transition in 2019. Theodotou owns the Zrythm marks; no public evidence of a project ownership sale or wholesale copyright assignment was found. [C-036] [C-037] [C-038]

**Overall confidence:** high for tag-pinned source structure and explicitly unfinished paths; medium for release-asset platform scope; low for exact binary build flags, format conformance, AU generation, missing-plugin UX, accessibility, and production reliability. [C-004] [C-026] [C-035]

## 2. Product identity, history, and market position

The upstream describes Zrythm as a DAW for professionals and beginners, emphasizing editing, automation, mixing, chords, plugins, and file formats. That is a project statement, not an independently measured market-position claim. [C-001]

The stable v1 lineage reached `1.0.0` on 2024-11-21. The first official v2 alpha arrived on 2026-05-30 as a complete rewrite from C/GTK/Meson to C++23/Qt6/QML/CMake with JUCE; alpha.2 followed in late July 2026. [C-002] [C-003] [C-007]

Official alpha.2 release metadata exposes artifacts for Linux, macOS, and Windows. The pinned README also gives build instructions for all three. Mobile/web products and a current edition comparison were not found. [C-002] [C-004] [C-042]

The v2 schema calls itself unstable and the README enumerates substantial v1 functionality still awaiting porting. **INFERENCE:** the current product is best classified as an architecture-relevant prerelease rather than a mature replacement for v1. A plausible alternative is that selected alpha workflows are already stable enough for some users; no dynamic qualification was performed. [C-004] [C-006] [C-039]

## 3. Workflow and conceptual model

The current documented user model is a project containing a linear timeline, tracks, lanes, and audio/MIDI/chord clips. Track types in source include instrument, audio, MIDI, master, chord, marker, modulator, audio/MIDI buses and groups, and folders. [C-005]

README-level features include clip looping/cloning, adaptive snapping, multiple lanes, piano-roll velocity editing, audio gain/fades, audio/MIDI recording with takes, a chord workflow, plugin browser, and undoable actions. Alpha.2 adds a chord pad/editor/suggestion path, tempo/time-signature objects, musical-mode audio time stretch, and pencil/eraser/cut/ramp/audition tools. [C-005] [C-012]

The broad v1 clip-linking/stretching and bounce workflows remain listed as unported even though alpha.2 added one narrower offline musical-mode stretch path. These statements are compatible if “musical mode” is treated as a partial capability rather than full v1 parity. [C-006] [C-040]

Source includes a scenes/clip-launcher architecture, but current release notes and README do not establish a released clip-launching UX. Tracker, notation, post-production, browser, mobile, and video mental models are not established for v2. [C-013] [C-015]

## 4. Publicly documented architecture

The v2 rewrite uses C++23, Qt/QML, and JUCE. The pinned tree separates actions, commands, controllers, DSP, engine/session, GUI, plugins/scanner, project/arrangement/track structures, undo, and utilities. [C-007]

Model objects are registry-owned and UUID-referenced. A project composes track/arrangement state, tempo/transport, plugin factories, audio pool, graph builder, engine, and UI state; commands/operators mediate undoable changes while controllers handle operations such as save/load and transport navigation. [C-005] [C-027]

The processing topology is an explicit DSP graph. The graph validates cycles, the dispatcher calls it an acyclic directed graph, and the scheduler maintains dependency counts, an MPMC ready queue, realtime worker threads, and optional macOS audio workgroups. [C-008]

The source also contains an `engine-process` program and GUI launch code, but this dossier did not establish that alpha.2 deploys the entire audio engine out of process by default. This process-topology question is separate from the source-evident in-process plugin adapter calls. [C-010] [C-021]

## 5. Audio engine

The engine takes sample rate and block length from the active hardware interface and runs the graph from a JUCE audio callback. Graph worker count defaults from available cores and is capped; exact scaling and deadline behavior were not measured. [C-008] [C-010]

Graph nodes expose individual and route playback latency. The collection propagates latency toward trigger nodes, realtime start applies a latency preroll, and offline render uses the same scheduler with realtime privileges disabled and a preroll equal to maximum route latency. [C-009]

The plugin adapters use 32-bit float buffers; CLAP sets `data32` and no `data64`. That does not prove an immutable engine-wide precision contract. Supported device sample-rate ranges, internal summing precision, variable-block guarantees, oversampling, dropout recovery, and hard realtime performance remain **UNKNOWN**. [C-010]

An asynchronous graph renderer processes a selected range in blocks and supports cancellation/progress. Full user-facing freeze, general bounce, and stem export are not current parity features according to the README. [C-006] [C-009] [C-015]

## 6. Tracks, timeline, clips, and editing

Current source and release documentation establish audio, MIDI, and chord clips on a tick/sample-aware linear arrangement with lanes, loop markers, fades/gain, tempo/time-signature objects, and undoable editing tools. [C-005] [C-012]

Audio musical mode uses offline Rubber Band processing to follow project tempo. The source also contains content/time-warp abstractions, but complete elastic editing, clip linking, arbitrary bounce, and v1-equivalent stretching remain explicitly incomplete. [C-006] [C-012]

Takes are documented at feature level and recording modes are represented in the current source. Comp-lane selection semantics, ripple editing, destructive-editor boundaries, source versioning, and navigation at large-project scale were not established. [C-011] [C-026]

## 7. MIDI, sequencing, notation, and expression

The current product documents MIDI recording, type 0/1 MIDI-file support, piano-roll editing, note velocity, chord clips/pad, tempo/time-signature maps, and MIDI-capable instrument/effect chains. [C-005] [C-012]

JUCE-hosted plugins receive and can produce timestamped MIDI buffers. CLAP can pass timestamped raw MIDI/SysEx when the first note port supports the MIDI dialect, or convert note on/off events to CLAP note events. [C-022] [C-023]

The CLAP conversion path explicitly lacks unique note IDs and can drop CC, pitch-bend, aftertouch, and other non-note data when raw MIDI is unavailable. Product-wide MPE/per-note expression, MIDI 2.0, notation, MTC, and external clock guarantees remain **UNKNOWN**. [C-013] [C-023]

## 8. Routing, mixer, automation, and control

Tracks, processors, ports, faders, plugins, and hardware endpoints are composed into the DAG. Source track types include buses/groups/folders; plugin audio buses are represented as main or sidechain ports, and cycles are rejected by graph validation. [C-005] [C-008] [C-022] [C-023]

The parameter model combines a base value, automation, and modulation, then reports only changed values to format adapters. Values returning from plugin UIs cross to the main thread through atomics and a timer. [C-014] [C-024]

There is a source-visible automation/modulation mechanism, but the release README says broad v1 “automate anything,” CV-modulator/macro, aux-send, signal-group, direct-anywhere routing, and device-binding workflows are not yet fully ported. Therefore model capability must not be conflated with complete released UX. [C-006] [C-014] [C-040]

Feedback routing policy beyond DAG rejection, VCA semantics, surround/immersive layouts, OSC, control-surface APIs, and current synchronization support remain **UNKNOWN**. [C-013] [C-026]

## 9. Recording, comping, and media handling

Current architecture documentation separates an RT capture path from non-RT materialization: the audio thread writes preallocated per-track SPSC ring buffers, a main-thread timer drains packets, and the materializer creates/extends clips inside undo macros. Full buffers increment a drop counter rather than blocking. [C-011]

The model supports audio and MIDI recording with lanes/takes. Source contains monitor modes and punch-window splitting, but the current README still lists punch in/out as not ported; released punch behavior is therefore **UNKNOWN** pending a fixture. [C-006] [C-011] [C-040]

The current headline limits import to WAV audio and type 0/1 MIDI. Audio files live in a project pool. Relinking, collect/archive, media metadata, proxies, conform, video, and broad codec support are either unported or **UNKNOWN**. [C-006] [C-012] [C-030]

## 10. Instruments, effects, content, and native devices

Alpha.2 changed bundled Faust plugins from generated VST3/CLAP bundles to internal plugins. The pinned registry defines compressor, distortion, flanger, gate, filters, noise, EQ, limiter, phaser, delay, synth, wah, and reverb devices. [C-016]

Internal plugins use the same descriptor/browser boundary and participate in project serialization, while implementation is compiled into Zrythm rather than discovered as an external bundle. [C-016] [C-025]

SoundFont SFZ/SF2 support is explicitly listed as not yet ported. Content packaging, sampler depth, preset migration, macro racks, and third-party native-device SDK stability are **UNKNOWN**. [C-006] [C-026]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

This matrix is bounded to `v2.0.0-alpha.2`; v1 evidence appears only in notes. `UNKNOWN` is not a synonym for unsupported. [C-017] [C-018] [C-019] [C-042]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED:not ported in v2 alpha | DOCUMENTED:not ported in v2 alpha | DOCUMENTED:not ported in v2 alpha | NOT_APPLICABLE:no product | v2 alpha.2 README; v1.0.0 comparison | v1 documented VST2 and optional Carla/32-bit bridges; legacy path code in v2 is not an active format registration | C-018, C-019; S-002–S-004 |
| VST3 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no product | v2 alpha.2 README, JUCE build definition, adapter | Active JUCE host; exact release-binary flags not independently inspected | C-017, C-022; S-002, S-004, S-006 |
| AUv2 | UNKNOWN:exact AU generation | NOT_APPLICABLE:Apple host format | NOT_APPLICABLE:Apple host format | NOT_APPLICABLE:no product | v2 documents “AudioUnit” and scans `.component` locations | Desktop AudioUnit family is active on macOS; no explicit AUv2 conformance label retained | C-017, C-026; S-004, S-006 |
| AUv3 | UNKNOWN:exact AU generation | NOT_APPLICABLE:Apple host format | NOT_APPLICABLE:Apple host format | NOT_APPLICABLE:no product | No explicit AUv3 statement | Do not infer AUv3 from generic AudioUnit support | C-026; S-002, S-004 |
| AAX | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no product | No qualifying current evidence | No Avid SDK/certification rights implied | C-042; S-002, S-004 |
| CLAP | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no product | v2 alpha.2 README and native CLAP host | Active custom adapter; contract limitations in §§11.3–11.5 | C-017, C-023–C-025; S-002, S-007 |
| LV2 | DOCUMENTED:default UNIX build | UNKNOWN:source default off on MSVC | DOCUMENTED:default UNIX build | NOT_APPLICABLE:no product | README plus `ZRYTHM_WITH_JUCE_LV2_HOSTING=${UNIX}` | Generic README claim conflicts with the MSVC build limitation; Windows artifact enablement unresolved | C-017, C-026; S-002, S-004 |
| LADSPA | UNKNOWN:platform gate excludes Apple | UNKNOWN:platform gate excludes Windows | DOCUMENTED | NOT_APPLICABLE:no product | README, JUCE compile definition, protocol platform gate | Linux is the supported source path; exact macOS/Windows binary behavior not probed | C-017, C-026; S-002, S-004 |
| DSSI | DOCUMENTED:not ported in v2 alpha | DOCUMENTED:not ported in v2 alpha | DOCUMENTED:not ported in v2 alpha | NOT_APPLICABLE:no product | v2 README; v1.0.0 comparison | v1 supported DSSI via Carla; stale enum/path code does not prove active v2 hosting | C-018, C-019; S-002–S-004 |
| JSFX | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no product | v1 changelog mentions JSFX; v2 has legacy enum/path but no active format mapping | Current registration/instantiation path not established | C-018, C-042; S-003, S-004 |
| DirectX/DXi | NOT_APPLICABLE:Windows plugin family | UNKNOWN | NOT_APPLICABLE:Windows plugin family | NOT_APPLICABLE:no product | No qualifying current evidence | Audio-driver support must not be confused with DXi hosting | C-042; S-002, S-004 |
| Rack Extension | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no product | No qualifying current evidence | No Reason SDK/certification rights implied | C-042; S-002, S-004 |
| Product-native/other | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no product | v2 internal Faust registry | Internal Faust devices active; SFZ/SF2 explicitly not yet ported | C-006, C-016; S-002, S-004 |

### 11.2 Discovery, scanning, validation, and recovery

At startup the manager adds JUCE default formats plus CLAP, installs a custom out-of-process scanner, loads a `known_plugins.xml` cache, prunes missing absolute-path entries, and scans configured/default per-format paths recursively. [C-017] [C-020]

The scan loop runs on a worker thread, but each candidate's format probe is delegated to a reusable child process. A candidate scan has a six-second coordinator timeout; an empty result is added to the JUCE blacklist. The child logs to a temporary file and exits on lost coordination or its own one-minute timeout. [C-020]

The cache stores JUCE plugin descriptions and supports modification-time rescans for CLAP. User-visible cache invalidation, duplicate-identity resolution, signature validation, quarantine history, blacklist removal UX, and crash-safe partial-scan recovery were not established. [C-020] [C-026]

### 11.3 Runtime isolation and compatibility

**INFERENCE:** normal v2 plugin processing is in-process. `JucePlugin` owns an `AudioPluginInstance` and directly calls `processBlock`; `ClapPlugin` loads the library and directly calls the plugin proxy's `process`. A plausible alternative is an unreconciled external-engine deployment mode, but no v2 per-plugin runtime process boundary was found. [C-021]

The active plugin variant contains JUCE, CLAP, and internal Faust implementations. `PluginConfiguration` still serializes a legacy `bridgeMode`, but its custom-host type is marked unimplemented and current construction does not route through Carla. [C-019] [C-021]

Therefore scan-process failure containment does not contain crashes, hangs, memory corruption, or priority inversions during normal plugin rendering. Architecture bridging, process-per-plugin modes, restart after render crash, and compatibility translation are not active/documented v2 capabilities. [C-019] [C-034]

### 11.4 Host/plugin processing contract

The JUCE adapter enumerates enabled audio buses and maps the main bus separately from additional sidechain buses; it creates MIDI input/output when declared, prepares at the engine sample rate/block limit, processes 32-bit audio plus timestamped MIDI, and reports plugin latency. [C-022]

The CLAP adapter enumerates multiple audio and note ports, maps nonzero audio ports as sidechains, uses 32-bit buffers, supports plugin thread-pool/timer/log/state/preset callbacks, and reads latency on activation. It passes `nullptr` transport, treats only the first note port's dialect as decisive, lacks per-note IDs, and does not establish output note-event forwarding. [C-023]

CLAP input MIDI/SysEx preserves sample offsets in the raw-MIDI path. Host parameter changes, however, are emitted as CLAP events at time zero, and JUCE parameters are set once before each `processBlock`; full sample-accurate parameter automation is not established. [C-024]

Tail reporting, deterministic offline-mode signaling, suspend semantics, arbitrary surround layouts, MIDI 2.0, dynamic audio/note-port reconfiguration, and complete CLAP restart/callback handling remain **UNKNOWN** or source-marked future work. [C-013] [C-023] [C-026]

### 11.5 Parameters, automation, state, presets, and project recall

JUCE parameters are matched by hosted parameter ID and mapped to normalized, toggle, or stepped Zrythm parameters. CLAP parameters retain `clap_id`, range/default/flags, and automatable metadata. Both adapters synchronize only changed values and prevent one-cycle feedback loops. [C-022] [C-023] [C-024]

Plugin state is serialized as base64 inside project JSON: JUCE uses `getStateInformation`/`setStateInformation`; CLAP uses its state streams. During load, state is staged until the instance is initialized, then parameters are read back. [C-025]

Gesture-aware automation suppression is documented as future work. Stable parameter migration across plugin upgrades, preset asset references, missing-plugin placeholder round trips, state corruption recovery, and identity collisions remain **UNKNOWN**. [C-024] [C-026]

### 11.6 UI, diagnostics, and failure modes

JUCE native editors are placed in a host top-level window; CLAP can use embedded or floating X11, Cocoa, or Win32 GUI APIs and handles size/show/hide requests. Plugins without native UIs use a generic parameter editor. [C-022] [C-023]

Instantiation failures emit an error and leave the plugin marked failed; project load waits up to 30 seconds for asynchronous JUCE instances. Scan and runtime paths log warnings/errors, and CLAP exposes a host log callback. [C-020] [C-022] [C-023] [C-025]

HiDPI correctness, headless operation, native-editor accessibility, detached-window persistence, missing-plugin UI, quarantine explanations, and recovery after a render-time crash remain **UNKNOWN**. [C-026] [C-035]

## 12. Extensibility and integration

The primary current extension boundary is third-party audio plugins plus compiled internal Faust devices. Public source exposes factories, descriptors, commands/actions, and QML-facing objects, but that is not a stable external application SDK. [C-007] [C-016] [C-017]

The official manual states that the former GNU Guile scripting interface is disabled and deprecated and that a replacement framework had not been selected. The v2 changelog also removes Guile. Consequently there is no documented current general-purpose scripting API. [C-031]

Controller binding is listed as not yet ported. OSC/remote APIs, extension ABI/versioning promises, macros, and third-party native-device authoring are **UNKNOWN**. [C-006] [C-026] [C-031]

## 13. Project format, persistence, interoperability, and collaboration

A Zrythm project is a directory with a `project.zpj` file and audio pool. The v2 file is zstd-compressed JSON with document/app/schema versions, title/date, project data, UI state, and an undo-history field. UUID-indexed registries are deserialized before references; an embedded JSON Schema is enforced on load. [C-027]

Save writes audio-pool data, serializes JSON, writes a temporary project file, and replaces the destination. Save-side schema failure is currently caught and logged rather than aborting; load rejects invalid JSON and future major versions. Older-major migration is only a warning/TODO, and the schema labels v2 alpha unstable. [C-028]

The undo-history key currently serializes an empty object and deserialization is a TODO. Autosave and backup-directory creation are compiled out/stubbed, and newer-backup discovery returns `nullopt` immediately. Thus automatic backup recovery and serializable undo are not active merely because legacy/manual text describes them. [C-029] [C-040]

External plugin state is inline base64, while audio remains in the project pool. Missing-plugin preservation/relink, collection of plugin-owned external assets, cross-machine device mapping, corruption recovery, and lossless v1 migration remain **UNKNOWN**. [C-025] [C-026] [C-030]

Type 0/1 MIDI and WAV are current headline formats. AAF, OMF, ADM, MusicXML, DAWproject, cloud collaboration, version control, and project exchange with other DAWs were not established. [C-012] [C-032]

## 14. Delivery, live, post-production, and specialized workflows

Source contains an offline graph renderer and current manuals retain mixdown/MIDI export text, but the README explicitly lists stem export as not yet ported. Current alpha.2 release enablement, codec matrix, metadata fidelity, and faster-than-realtime guarantees were not dynamically qualified. [C-006] [C-009] [C-015] [C-040]

DDP, loudness delivery, batch export, video/timecode/ADR, surround/immersive/ADM, show control, and production live-performance recovery are **UNKNOWN**. [C-015]

The distinctive specialty is music composition around MIDI/audio clips, chords/scales, tempo-aware editing, and an inspectable modular signal graph—not post or live-show operation. [C-005] [C-012] [C-039]

## 15. Performance, reliability, security, and accessibility

Source documents hardware-accelerated Qt Quick UI, SIMD-oriented DSP, graph worker threads, RT/non-RT recording queues, CPU-load measurement, sanitizers, tests, and benchmarks. These are engineering mechanisms, not independent scalability or reliability results. [C-008] [C-011] [C-033]

The scanner child process and timeouts reduce discovery risk, while runtime plugins remain in-process. Third-party plugin code therefore shares the runtime trust boundary, and adapter comments acknowledge that plugin calls may allocate or lock. [C-020] [C-021] [C-034]

Track/plugin/graph limits, CPU scaling, xrun policy, memory limits, plugin crash recovery, update rollback, binary signing/notarization verification, telemetry/privacy, screen-reader behavior, keyboard completeness, and accessibility conformance are **UNKNOWN**. [C-033] [C-035]

The README documents multiple UI languages. Localization breadth does not establish accessibility. [C-033] [C-035]

## 16. Licensing, ecosystem, and implementation constraints

The pinned license applies AGPL version 3 or later plus Section 7 terms governing Zrythm marks. REUSE/SPDX notices show that incorporated files and dependencies can carry additional licenses; any reuse requires a file-by-file provenance audit. [C-036]

The project changelog records an important GPLv3-or-later to AGPLv3-or-later change in the `0.5.162` release dated 2019-07-14. This is a licensing transition, not evidence that copyright ownership itself transferred. [C-037] [C-038]

The trademark policy says “Zrythm” and its logo are registered UK trademarks of Alexandros Theodotou. It permits truthful reference and limited distribution of unaltered copies, while modified products generally cannot retain the marks without permission except for enumerated cases. [C-036] [C-038]

Principal source files attribute copyright to Theodotou; incorporated portions identify other named holders such as Raw Material Software and Robin Gareus. No public sale, corporate acquisition, contributor copyright assignment requirement, or wholesale consolidation of all copyrights was found. That negative result is **UNKNOWN**, not proof that no private agreement exists. [C-038]

VST3, AudioUnit, AAX, CLAP, LV2, LADSPA, and discontinued VST2 each have independent SDK, trademark, redistribution, signing, or certification constraints outside Zrythm's license. Naming or observing a format grants no implementation right. Exact format-owner terms were not re-researched in this product dossier and require separate legal qualification. [C-042]

## 17. Strengths, liabilities, and architecture lessons

**Strengths:** open, tag-pinned source; explicit DAG and parallel scheduler; shared realtime/offline graph model; scanner process isolation; deep JUCE/CLAP adapters; UUID/schema project model; and clearly separated RT/non-RT recording. [C-007] [C-008] [C-009] [C-011] [C-020] [C-022] [C-023] [C-027]

**Liabilities:** alpha schema and incomplete migration; in-process runtime plugins; incomplete CLAP transport/expression/parameter timing; no active v2 bridge; stubbed backup and undo persistence; and stale manual sections that can be mistaken for current behavior. [C-004] [C-019] [C-021] [C-023] [C-024] [C-028] [C-029] [C-040]

**INFERENCE:** Zrythm is a strong source-level reference for decomposing a modern DAW, but a weak sole baseline for shipping-grade interoperability or project durability. A later prototype should test the patterns independently rather than copy code or assume alpha behavior is a contract. [C-039]

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Support | Prerequisites, tradeoffs, adaptation risk |
| --- | --- | --- | --- | --- |
| CANDIDATE | Parallelize dependent DSP safely | Validate a DAG, maintain dependency counts, and dispatch ready nodes through a bounded RT worker pool | C-008 | Requires graph-swap protocol, cycle UX, deadline tests, priority policy, and independent implementation |
| CANDIDATE | Align realtime and offline results | Reuse the graph scheduler with a non-realtime mode and latency preroll | C-009 | Must define tails, offline plugin flags, cancellation, deterministic state, and export semantics |
| CANDIDATE | Reduce plugin-scan blast radius | Run candidate metadata probes in a disposable child with timeout, cache, blacklist, and diagnostics | C-020 | Add per-candidate restart, hang kill, cache fingerprints, quarantine UX, and signature policy |
| CONDITIONAL | Normalize heterogeneous plugin parameters | Stable format ID + normalized range + changed-value tracker + one-cycle feedback guard | C-022–C-024 | Current design is block-rate for host changes and lacks gesture suppression; sample-accurate events need a different queue |
| CANDIDATE | Keep plugin state project-portable | Store opaque format state inline with explicit plugin identity/version metadata | C-025 | Needs size limits, corruption isolation, external-asset manifests, encryption/privacy review, and missing-plugin placeholders |
| CANDIDATE | Cross an RT recording boundary | Preallocate per-track SPSC slots; drain/materialize clips on a non-RT thread | C-011 | Needs overrun policy, durability during long takes, disk streaming, testable clock discontinuities, and crash salvage |
| CONDITIONAL | Make project structure inspectable | Versioned, schema-validated JSON plus UUID registries and pooled media | C-027–C-030 | Alpha source shows migration/recovery gaps; require transactional save, enforced validation, migrations, backups, and unknown-field policy |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT:** calling the scanner subprocess a plugin sandbox. It only contains discovery; JUCE/CLAP rendering is in-process. [C-020] [C-021] [C-034]
- **REJECT:** carrying a serialized `bridgeMode` as evidence of active bridging. Current custom hosting is unimplemented and bridging is listed as unported. [C-019] [C-021]
- **REJECT:** treating format registration as full interoperability. CLAP is accepted/scanned/instantiated, yet transport, per-note expression, parameter timing, and dynamic-I/O paths remain incomplete. [C-023] [C-024] [C-026]
- **REJECT:** shipping an unstable schema without migrations, backup recovery, and missing-device preservation. [C-026] [C-028] [C-029]
- **REJECT:** copying source expression. Only behavior and boundaries may inform an independent clean-room design; licenses and provenance still apply. [C-036]
- `CURIOSITY_NO_GO` — exact alpha release-binary flags: source defaults are visible, but artifact inspection/build qualification is required and unlikely to alter the central v2 conclusion.
- `CURIOSITY_NO_GO` — AUv2 versus AUv3: generic AudioUnit evidence is insufficient; pursue only with an explicit upstream statement or macOS fixture.
- `CURIOSITY_NO_GO` — community compatibility lists: useful for fixture discovery but unable to establish host internals.
- `CURIOSITY_NO_GO` — exhaustive native-device inventory: low decision value relative to engine/plugin boundaries.
- `CURIOSITY_NO_GO` — installer execution or arbitrary third-party plugins: unnecessary and outside the documentary safety boundary.

## 20. Falsifiable hypotheses and adversarial checks

1. **H1 supported:** v2 is a rewrite, not a continuation of the v1 plugin stack. Language/UI/build changes and the “not yet ported” list agree. [C-003] [C-006] [C-007]
2. **H2 supported:** plugin discovery and plugin rendering have different process boundaries. Scanner child-process code contrasts with direct JUCE/CLAP process calls. [C-020] [C-021]
3. **H3 falsified:** “CLAP support” implies a complete modern host contract. Transport is null, host parameter events use offset zero, per-note IDs are absent, and restart/callback work remains incomplete. [C-023] [C-024]
4. **H4 falsified:** serialized bridge/autosave/undo fields prove active capabilities. Bridge hosting is unimplemented; backup paths and undo serialization are stubs. [C-019] [C-021] [C-029]
5. **H5 supported with limits:** the graph has source-level PDC. Latency values propagate and both realtime/offline paths preroll, but independent impulse tests and cumulative-route edge cases were not run. [C-009]
6. **H6 contradicted/documentation drift:** live/manual text describes external plugin-state directories, automatic backups, and stem export while v2 source/README uses inline state and marks backup/stem parity incomplete. [C-025] [C-029] [C-040]
7. **H7 unresolved:** missing plugins retain an inert placeholder and state through resave. No qualifying path was found; a remove/reopen/resave/reinstall fixture is required. [C-026]
8. **Later dynamic probes:** qualify accepted → scanned → instantiated → rendered → automated → state-restored separately for each OS/format; inject scan/render crash and hang fixtures; test sidechain/multi-output/dynamic-I/O/latency/tail/offline/MPE; corrupt projects; remove plugins/assets; and compare realtime/offline output. No such probe was run here. [C-026] [C-034] [C-041]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Zrythm is an upstream-described DAW for professionals and beginners, maintained by the Zrythm project/Theodotou. | Product identity | S-002, S-012 | Direct README/repository/trademark evidence | Intended audience is a vendor statement |
| C-002 | DOCUMENTED | High | `v2.0.0-alpha.2` is the current release at cutoff, published 2026-07-28 with Linux/macOS/Windows assets; pinned changelog date is 2026-07-29. | Release/platform | S-001, S-002 | Official release metadata and immutable changelog | One-day metadata/changelog discrepancy retained |
| C-003 | DOCUMENTED | High | v1 `1.0.0` dates to 2024-11-21; v2 alpha.1 is a complete C/GTK-to-C++23/Qt/QML/JUCE rewrite. | Lineage | S-002, S-003 | Immutable changelogs | Does not establish migration compatibility |
| C-004 | DOCUMENTED | High | Current v2 is prerelease with unstable schema, unfinished v1 parity, and no established edition matrix. | Maturity/editions | S-002, S-010 | Explicit alpha/schema warnings and unported list | Selected workflows may work better than status implies |
| C-005 | DOCUMENTED | High | Current model is a linear project with typed tracks, lanes, and audio/MIDI/chord clips plus editing/chord/tempo features. | Workflow | S-002, S-009 | README, release notes, track model | Released UI completeness not dynamically tested |
| C-006 | DOCUMENTED | High | VST2, DSSI, SoundFonts, bridging, backups, serializable undo, stems, and several routing/editing/control workflows are not yet ported from v1. | v2 alpha.2 | S-002 | Explicit README list | Some source scaffolding/partial features exist |
| C-007 | DOCUMENTED | High | Source uses C++23/Qt/QML/JUCE and separates actions, controllers, DSP, engine, GUI, plugins, structures, and undo. | v2 architecture | S-002, S-004 | Immutable source/module map | Module boundaries do not alone prove deployment topology |
| C-008 | DOCUMENTED | High | DSP uses a cycle-validated DAG and dependency-driven parallel realtime worker scheduler. | v2 engine | S-008 | Direct graph/scheduler source | No performance measurement |
| C-009 | DOCUMENTED | High | Graph nodes expose route latency; realtime and offline paths apply latency preroll, and offline render reuses the scheduler. | v2 PDC/render | S-008 | Direct engine/graph renderer paths | Conformance/cumulative-route fixtures not run |
| C-010 | UNKNOWN | Low | Engine-wide precision, device ranges, variable-block guarantees, scaling, oversampling, and dropout policy are unknown. | Audio engine | S-008 | Adapter float paths are narrower than engine contract | Next probe: device/impulse/load fixtures |
| C-011 | DOCUMENTED | High | Recording uses preallocated RT per-track SPSC buffers drained/materialized on non-RT thread; takes are documented, while released punch parity is contradictory. | v2 recording | S-002, S-009 | Current architecture doc/source plus README | Architecture doc can lead released UI; punch remains unqualified |
| C-012 | DOCUMENTED | Medium | Current release documents piano roll, velocity, chord/tempo tools, MIDI type 0/1, WAV import, and offline musical-mode stretch. | Editing/MIDI/media | S-002 | README/changelog | No fidelity testing |
| C-013 | UNKNOWN | Low | Product-wide MPE, per-note expression, MIDI 2.0, notation, MTC, and clock guarantees are unknown. | MIDI/expression | S-002, S-007, S-009 | CLAP limitations do not answer all product paths | Next probe: official contract plus fixtures |
| C-014 | DOCUMENTED | Medium | Source parameter flow combines base value, automation, modulation, changed-value detection, and plugin synchronization; released broad automation/routing UX is incomplete. | Automation/control | S-002, S-006, S-007, S-009 | Source mechanism plus explicit unported list | Do not infer full UI or sample accuracy |
| C-015 | UNKNOWN | Low | Current mixdown codec/export enablement and post/live/video/immersive delivery are not established; stems are explicitly unported. | Delivery | S-002, S-008, S-011 | Renderer/manual text conflicts with release parity list | Next probe: alpha UI and export fixtures |
| C-016 | DOCUMENTED | High | Alpha.2 compiles a registry of internal Faust effects/instrument rather than generated VST3/CLAP bundles. | Native devices | S-002, S-004 | Changelog and registry/CMake list | Shipped-artifact inventory not inspected |
| C-017 | DOCUMENTED | High | Current source/release documents VST3, CLAP, LV2, LADSPA, and AudioUnit hosting with platform/build qualifications. | v2 plugin formats | S-002, S-004 | README plus build flags/format manager | Exact artifact flags and AU generation unknown |
| C-018 | DOCUMENTED | High | v1.0.0 documented LV2, CLAP, VST2, VST3, AU, LADSPA, DSSI, SoundFonts and optional sandboxing/bridging; changelog also records JSFX. | v1 legacy | S-003 | Immutable v1 tag | Binary enablement for every platform not proven |
| C-019 | DOCUMENTED | High | VST2, DSSI, SoundFonts, and optional sandboxing/bridging are not active v2 parity features. | v2 alpha.2 | S-002, S-004 | Explicit unported list; active adapter variant excludes Carla | Legacy enums/config fields remain |
| C-020 | DOCUMENTED | High | Discovery uses a scanner child process, timeout, recursive paths, XML cache, missing-file pruning, and blacklist for empty results. | v2 scanning | S-004, S-005 | Direct manager/coordinator/subprocess source | User-facing quarantine/rescan UX unknown |
| C-021 | INFERENCE | High | Normal JUCE/CLAP rendering is in-process and no active v2 bridge adapter is wired. | v2 runtime | S-004, S-006, S-007 | Direct object ownership/library calls and active variant | External whole-engine deployment remains unresolved |
| C-022 | DOCUMENTED | High | JUCE adapter covers enabled audio buses/sidechains, MIDI I/O, parameter IDs/ranges, latency, native UI, processing, and state. | VST3/AU/LV2/LADSPA via JUCE | S-006 | Direct adapter source | JUCE wrapper behavior not independently qualified |
| C-023 | DOCUMENTED | High | CLAP adapter covers audio/note ports, GUI, timers/log/thread pool/state/presets/latency but passes no transport and has note/event limitations. | CLAP | S-007 | Direct host callbacks and process path | Dynamic ports and output note events unresolved |
| C-024 | DOCUMENTED | High | Host parameter updates are block-offset zero/not fully sample-accurate; feedback prevention exists; gesture suppression is future work. | Plugin automation | S-006, S-007, S-009 | Direct event timestamps/JUCE calls and parameter doc | Plugin-originated events may have their own timing |
| C-025 | DOCUMENTED | High | JUCE and CLAP opaque state is base64-encoded inline in project JSON and applied after instance initialization. | Project recall | S-006, S-007, S-010 | Direct serialization/load paths | Plugin-owned external assets not covered |
| C-026 | UNKNOWN | Low | Dynamic-I/O completeness, tails/offline flags, preset migration, missing-plugin placeholders, external assets, identity collisions, recovery UX, and advanced UI fidelity are unknown. | Plugin contract | S-004–S-010 | No qualifying complete paths found | Requires format fixtures and failure injection |
| C-027 | DOCUMENTED | High | `.zpj` is zstd-compressed, schema-validated, versioned JSON with UUID registries, project/UI state, and pooled media. | v2 project format | S-010, S-011 | Direct saver/loader/schema and manual | Schema is unstable |
| C-028 | DOCUMENTED | High | Save writes temp then replaces, save-side validation failure only warns, load enforces schema/future-major rejection, and old-major migration is TODO. | v2 persistence | S-010 | Direct source | Filesystem atomicity not established |
| C-029 | DOCUMENTED | High | Automatic backup creation/discovery and undo command persistence are currently stubbed/disabled. | v2 recovery | S-002, S-010 | Explicit TODO/`#if 0`/empty serializers | Legacy manual says otherwise |
| C-030 | DOCUMENTED | Medium | Audio lives in a project pool; cross-machine relink/collect/corruption behavior is unknown. | Media portability | S-010, S-011 | Saver/pool/manual structure | Legacy manual may not match v2 details |
| C-031 | DOCUMENTED | High | GNU Guile scripting is disabled/deprecated and removed from v2 dependencies; no replacement API is documented. | Extensibility | S-002, S-011 | Manual notice and changelog | Internal QML/C++ surfaces are not external scripting APIs |
| C-032 | UNKNOWN | Low | AAF/OMF/ADM/MusicXML/DAWproject/cloud/version-control interchange is unknown; only MIDI/WAV headline support is current. | Interchange/collaboration | S-002, S-011 | No qualifying positive evidence | Absence from retained sources is not proof of no support |
| C-033 | DOCUMENTED | Medium | Source advertises Qt Quick acceleration, SIMD DSP, load measurement, worker threads, tests/sanitizers, and localization; measured limits remain unknown. | Performance/NFR | S-002, S-004, S-008 | Direct engineering/config evidence | No independent benchmark or reliability study |
| C-034 | DOCUMENTED | High | Scanner isolation does not contain in-process render failures. | Security/reliability | S-005–S-007 | Different process boundaries directly evidenced | Whole-engine process mode unresolved |
| C-035 | UNKNOWN | Low | Signing verification, update/rollback, telemetry/privacy, accessibility, and HiDPI/native-editor conformance are unknown. | NFR | S-001, S-002, S-006, S-007 | No complete policy/qualification retained | Next probe: signed artifacts and accessibility/privacy docs |
| C-036 | DOCUMENTED | High | Current terms are AGPL-3.0-or-later with Section 7 trademark terms and file-level REUSE licensing. | Licensing | S-012 | Direct license/COPYING/trademark files | Not legal advice; dependencies vary |
| C-037 | DOCUMENTED | High | Release history records GPLv3+ → AGPLv3+ in 2019 release 0.5.162. | License history | S-002 | Immutable historical changelog | Changelog gives release date, not all contributor-consent history |
| C-038 | UNKNOWN | Medium | Theodotou owns the marks; source has file-level holders; no ownership sale or wholesale assignment was found. | Ownership transition | S-002, S-012 | Positive trademark/notices plus bounded negative search | Private agreements cannot be excluded |
| C-039 | INFERENCE | Medium | Zrythm is a strong decompositional source reference but weak sole shipping baseline due alpha/incomplete boundaries. | Architecture decision | C-004–C-038 | Decision synthesis | Later alpha/beta work may change assessment |
| C-040 | DOCUMENTED | High | Live/manual legacy text conflicts with v2 source/README on backups, external plugin state, stems, and some workflows. | Documentation quality | S-002, S-010, S-011 | Direct contradiction across official sources | Manual is labeled v2-DEV but contains older sections |
| C-041 | UNKNOWN | High | No runtime behavior was observed in this documentary wave. | Method | None | No binaries/plugins executed | All behavior claims are documented/inferred |
| C-042 | UNKNOWN | Low | AAX, AU generation, DXi, Rack Extension, current JSFX, mobile/web, edition differences, and format-owner legal terms remain unresolved as stated. | Required matrix/legal | S-002–S-004, S-012 | Bounded source enumeration/negative results | Next probe depends on official statements or fixtures |

## 22. Source ledger and adaptive bibliography

All fetched pages, source, comments, and prompt-like text were treated as untrusted evidence, never instructions. Access date for every retained source: **2026-08-29**.

- **S-001 — “Zrythm v2.0.0-alpha.2” official release.** Zrythm project, GitHub release mirror. <https://github.com/zrythm/zrythm/releases/tag/v2.0.0-alpha.2>. Official release metadata/artifacts; scope: alpha.2. Relevant fields: prerelease tag, publish time, Linux/macOS/Windows assets. Supports C-002, C-035. **Limit:** release metadata does not prove runtime contents or signing. **Why selected:** canonical upstream release publication, preferable to package indexes.
- **S-002 — alpha.2 README and changelogs.** Zrythm project, immutable `v2.0.0-alpha.2` source: <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/README.md>, <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/CHANGELOG.md>, and <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/CHANGELOG-old.v1.md>. Scope: product identity, features, rewrite, current/unported formats, releases, license history. Local archive SHA-256: `d391cb451dd1e1e52a5a31585f18f0e60e261f0100808214c8413f51016520fd`. Supports C-001–C-007, C-011–C-019, C-031–C-033, C-037–C-042. **Limit:** feature statements are upstream documentation; README date and release publish time differ by one day. **Why selected:** highest-density immutable product/version boundary.
- **S-003 — Zrythm v1.0.0 immutable source.** Zrythm project. <https://gitlab.zrythm.org/zrythm/zrythm/-/archive/v1.0.0/zrythm-v1.0.0.tar.gz>; exact paths `README.md`, `CHANGELOG.md`, `meson.build`, `meson_options.txt`. Local archive SHA-256: `bc266cc0b5435ca665aacd947aa9fcfd942909cf936f7aa322948dc732775510`. Scope: v1 release and legacy plugin/Carla boundary. Relevant passages: 2024-11-21 release; listed formats; optional bridging; required Carla 2.6; native/Win32/GNU-Linux bridge collection. Supports C-003, C-018, C-019, C-042. **Limit:** source options do not prove every distributed binary. **Why selected:** official immutable v1 evidence, preferable to a stale mutable manual.
- **S-004 — v2 build, format registration, paths, and internal registry.** Zrythm project, immutable alpha.2 files: <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/CMakeLists.txt>, <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/ext/CMakeLists.txt>, <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/src/gui/backend/plugin_manager.cpp>, <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/src/gui/backend/plugin_protocol_paths.cpp>, and <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/cmake/FaustPlugins.cmake>. Supports C-007, C-016, C-017, C-019–C-021, C-026, C-033, C-042. **Limit:** legacy enums/paths coexist with active registration and must not be treated as implementations. **Why selected:** resolves actual build/registration paths beyond format logos.
- **S-005 — out-of-process scanner source set.** Zrythm project, immutable alpha.2: <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/src/plugins/out_of_process_scanner.cpp>, <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/src/plugins/plugin_scan_manager.cpp>, and <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/src/plugins/plugin-scanner/plugin_scanner_subprocess.cpp>. Relevant sections: child launch/IPC, six-second candidate timeout, recursive scan, blacklist, worker lifecycle/log. Supports C-020, C-026, C-034. **Limit:** no process probe or UX review. **Why selected:** exact origin for scanner isolation; prevents conflation with runtime sandboxing.
- **S-006 — JUCE plugin-host adapter.** Zrythm project, immutable alpha.2: <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/src/plugins/juce_plugin.cpp> and `juce_plugin.h`. Relevant sections: async instantiation, buses/sidechains, MIDI, parameter mapping, `processBlock`, latency, editor, state. Supports C-014, C-021, C-022, C-024–C-026, C-034, C-035. **Limit:** adapter source is not VST3/AU/LV2/LADSPA conformance testing. **Why selected:** highest-value common-host contract source.
- **S-007 — CLAP format and runtime adapter.** Zrythm project, immutable alpha.2: <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/src/plugins/CLAPPluginFormat.cpp>, <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/src/plugins/clap_plugin.cpp>, and `clap_plugin.h`. Relevant sections: discovery identity, library load, audio/note ports, events, host extensions, GUI, latency, state, TODOs. Supports C-013, C-014, C-021, C-023–C-026, C-034, C-035. **Limit:** no independent CLAP fixture; some TODOs may change after tag. **Why selected:** native adapter reveals fidelity hidden by a generic “CLAP supported” claim.
- **S-008 — graph, engine, and offline renderer source set.** Zrythm project, immutable alpha.2: `src/dsp/graph.h`, `graph_scheduler.h`, `graph_dispatcher.h`, `graph_node.cpp`, `engine.cpp`, and `graph_renderer.cpp` under <https://gitlab.zrythm.org/zrythm/zrythm/-/tree/v2.0.0-alpha.2/src/dsp>. Supports C-008–C-010, C-015, C-033. **Limit:** code was not built, instrumented, or benchmarked. **Why selected:** direct primary evidence for DAG, parallelism, latency, realtime/offline convergence.
- **S-009 — workflow, recording, and parameter architecture.** Zrythm project, immutable alpha.2: <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/src/structure/tracks/track.h>, <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/doc/dev/recording_architecture.md>, <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/doc/dev/parameter_infrastructure.md>, and `doc/dev/undo_system.md`. Supports C-005, C-011, C-013, C-014, C-024, C-033. **Limit:** architecture docs can describe intended/source behavior ahead of released UX. **Why selected:** maintained upstream design prose cross-checked against current code.
- **S-010 — project persistence and plugin-state source set.** Zrythm project, immutable alpha.2: `src/controllers/project_saver.cpp`, `project_loader.cpp`, `project_json_serializer.cpp`, `src/undo/undo_stack.cpp`, `src/gui/backend/project_session.cpp`, `src/plugins/plugin.h`, and `data/schemas/README.md` under <https://gitlab.zrythm.org/zrythm/zrythm/-/tree/v2.0.0-alpha.2>. Supports C-004, C-025–C-030, C-040. **Limit:** source path review does not prove filesystem behavior or corrupt-input safety. **Why selected:** exact origin for format, validation, backup, undo, and inline-state conclusions.
- **S-011 — current official v2-DEV manual and pinned manual source.** Zrythm project. <https://manual.zrythm.org/en/index.html>, <https://manual.zrythm.org/en/scripting/overview.html>, <https://manual.zrythm.org/en/projects/project-structure.html>, <https://manual.zrythm.org/en/projects/saving-loading.html>, and corresponding `doc/user` files in the alpha.2 tag. Scope: v2-DEV manual, last-updated marker 2026-03-25, with older passages retained. Supports C-015, C-027, C-030–C-032, C-040. **Limit:** backup/external-state/stem text conflicts with v2 source/README and is not used as sole current proof. **Why selected:** official user documentation, retained principally to expose documentation drift and the scripting deprecation.
- **S-012 — current license and trademark terms.** Zrythm project, immutable alpha.2: <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/COPYING>, <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/LICENSES/LicenseRef-ZrythmLicense.txt>, <https://gitlab.zrythm.org/zrythm/zrythm/-/blob/v2.0.0-alpha.2/TRADEMARKS.md>, and file-level SPDX notices. Supports C-001, C-036, C-038, C-042. **Limit:** not legal advice; public files cannot exclude private ownership agreements. **Why selected:** governing primary terms, preferable to store summaries or third-party license databases.

**Negative-result log:**

- **N-001:** two web searches for v1 documentation returned HTTP 429; no snippets were retained as evidence.
- **N-002:** the guessed legacy manual URL `https://manual.zrythm.org/en/plugins-files/plugins/index.html` returned 404. The corrected live root was v2-DEV, not a version-pinned v1 manual.
- **N-003:** current source enumeration found legacy protocol enums, paths, and `bridgeMode`, but no active v2 VST2/DSSI/JSFX adapter or Carla runtime wiring. This negative evidence was not generalized beyond the pinned tag. [C-019] [C-021] [C-042]
- **N-004:** no official public acquisition, ownership-sale, or wholesale copyright-assignment record was found in retained release, repository, license, trademark, and contribution evidence. [C-038]
- **N-005:** a read-only nested source-inspection attempt was unavailable because subagent depth was limited; local immutable-source inspection completed the bounded task instead.

## 23. Unknowns and next discriminating probes

| Unknown | Attempts/blocker | Decision impact | Safest next probe | Access/fixture; owner |
| --- | --- | --- | --- | --- |
| Exact release-binary format/build flags [C-017, C-026] | Source defaults and artifact names reviewed; binaries not inspected/run | OS matrix and procurement | Reproducibly build tag and inspect format manager on each OS | Disposable Linux/macOS/Windows VMs; unassigned |
| AUv2 vs AUv3 [C-026, C-042] | Generic AudioUnit and `.component` evidence only | Apple ecosystem scope | Obtain explicit upstream matrix, then scan known AUv2/AUv3 fixtures | macOS fixture; unassigned |
| External engine topology [C-010, C-021] | `engine-process` source exists; default deployment not resolved | Crash/security boundary | Inspect packaged process tree and IPC under safe empty project | Disposable desktop VM; unassigned |
| Missing plugin/state durability [C-026] | Serializer and failure paths reviewed; no placeholder contract found | Project longevity | Save/remove/reopen/resave/reinstall and byte-compare opaque state | Synthetic plugins/project; unassigned |
| Dynamic I/O, tails, offline flags [C-023, C-026] | Adapter source reviewed; callbacks incomplete/absent | Host fidelity | Exercise dynamic-bus, tail, suspend, restart, and offline fixtures | VST3/CLAP fixtures; unassigned |
| Sample-accurate automation/expression [C-013, C-024] | Source shows parameter time zero and no note IDs | Musical correctness | Ramp/impulse event-offset and MPE fixture with captured outputs | Synthetic plugin; unassigned |
| Runtime crash/hang containment [C-021, C-034] | Direct in-process calls evidenced; no unsafe probe run | Security/reliability | Inject benign crash/hang plugins during scan and render in disposable VM | Non-malicious fixtures; unassigned |
| PDC correctness [C-009] | Source paths traced; no measurements | Mix alignment | Serial/parallel route impulse tests with changing plugin latency | Synthetic delay plugin; unassigned |
| Backup/undo/migration [C-028, C-029] | Stubs/TODOs found; alpha schema unstable | Data-loss risk | Do not qualify until implementation lands; then crash-save/corpus tests | Versioned project corpus; unassigned |
| Current export/interchange [C-015, C-032] | Renderer plus stale manual found; stems unported | Delivery/product fit | Inspect alpha UI and render known project to every offered format | Disposable project; unassigned |
| Accessibility/privacy/signing [C-035] | No complete official qualification retained | NFR/compliance | Review signed artifacts, update/privacy notices, keyboard/screen-reader paths | Platform tools and policy; unassigned |
| Ownership consolidation [C-038] | Public license/trademark/repository history checked; private agreements inaccessible | License diligence | Ask upstream for authoritative copyright/assignment statement | Maintainer/legal response; unassigned |

## 24. Curiosity pass and stop decision

Scores are 1–5; higher relevance/value/novelty is better, while **cost 5 is most expensive**.

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Immutable v1 plugin/bridge comparison | 5 | 5 | 4 | 2 | **Pursued** via S-003; it prevented v1 Carla/VST2/DSSI capability from being misattributed to v2 |
| Exact binary build flags | 3 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: source qualification is enough for the architecture decision; artifacts need a later build/runtime wave |
| AU generation conformance | 4 | 3 | 3 | 4 | `CURIOSITY_NO_GO`: material but requires an explicit upstream statement or macOS fixture |
| Missing-plugin placeholder UX | 4 | 3 | 3 | 5 | `CURIOSITY_NO_GO`: no qualifying documentary path; dynamic fixture is the discriminating method |
| Community compatibility reports | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: cannot prove host internals and risks version conflation |
| Ownership rumors/secondary histories | 2 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: primary license/trademark/repository evidence is preferable; private transfer cannot be disproved by more broad search |

**Gaps after synthesis:** exact binary flags, AU generation, missing-plugin preservation, whole-engine process topology, and release-grade export/NFR behavior. **Contradictions retained:** release publish date versus changelog date; v2 README versus live/manual backup/state/stem text; source punch/automation scaffolding versus the unported-feature list; generic LV2 claim versus MSVC build default. [C-002] [C-011] [C-017] [C-029] [C-040]

**Stop decision:** stop for **coverage, saturation, budget exhaustion, and nonpositive marginal documentary evidence**. Every required section and plugin row is complete; release/lineage, architecture, graph, recording, scanning, runtime, host contract, persistence, licensing/trademark, contradictions, and consequential unknowns are represented. The final v1 tag pass changed the version-bound conclusion; further web retrieval is unlikely to change it. Remaining high-value questions need official maintainer statements or bounded disposable fixtures, not indefinite search. [C-039] [C-041]

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Owned path: `research/daw-landscape/dossiers/zrythm.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See §0 and C-001–C-004.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive sections cite the classified register in §21.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See §§21–23.
- [x] **Every required plugin-format row is present.** All 13 rows appear in §11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** See §§11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Vendor statements are bounded; inferences and unknowns are explicit; there are no `OBSERVED` claims. [C-041]
- [x] **Licensing and clean-room boundaries are explicit.** See §§0, 16, 18, and 22.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Only public pages and source archives were read; no installer or plugin was run.

**Checks performed:** governing-file/template comparison; section/subsection order; matrix row count; claim/source cross-reference; negative-result retention; immutable archive hashes; contradiction/saturation/curiosity/stop review; whitespace check; owned-path status review.

**Verification result:** PASS — final mechanical validation confirmed sections 0–25 and 11.1–11.6 in order; 42/42 claim declarations and 12/12 source declarations resolve; all 13 required plugin rows and 12 contract checks are present; whitespace is clean; the owned path remains unstaged.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; 12 retained primary source records, 42 classified claims, 5 negative-result records, and 12 prioritized next probes.

**Unresolved blockers:** web-search HTTP 429; missing immutable v1 manual; no dynamic qualification; exact artifact flags, AU generation, missing-plugin behavior, whole-engine topology, accessibility/signing/privacy, and ownership consolidation remain unresolved.

**Pre-existing workspace changes:** the DAW-landscape research tree and unrelated workspace paths already contained untracked/modified work. All sibling/shared files were left untouched. No staging or commit was performed.
