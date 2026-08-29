# Bespoke Synth DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** Bespoke / Bespoke Synth, a software modular synthesizer and modular DAW.
- **Canonical upstream:** Ryan Challinor and the BespokeSynth GitHub organization; official site at `bespokesynth.com`. [C-001]
- **Researcher/session:** research specialist, `ses_fb274af15ffd47mMwg2E6UULpc`.
- **Owned path:** `research/daw-landscape/dossiers/bespoke-synth.md`.
- **Research date / cutoff:** 2026-08-29 UTC.
- **Stable-release scope:** `v1.3.0`, immutable commit `1d0f0429d9b56f1b120b0b95f0a173cc02787e53`, published 2024-12-22, with official macOS, Windows, and Linux artifacts. [C-002]
- **Current-source scope:** immutable main snapshot `626ae10bebee7a0f3bac71ed1e778acfd4a21423`, committed 2026-08-27 UTC. It is newer than the stable release and is not treated as a released version. Pinned plugin-host dependency: JUCE 7.0.12 at `4f43011b96eb0636104cb3e433894cda98243626`. [C-003]
- **Edition/platform scope:** the official free, Plus, and Pro offerings use identical files; payment changes the donation amount, not features. Desktop macOS, Windows, and Linux are included. No mobile or web product was established. [C-002]
- **Inclusions:** official workflow/reference material; immutable stable and current source; graph/audio scheduling; sequencing, recording, control, scripting, persistence, licenses, and detailed plugin-host paths.
- **Exclusions:** installer or plugin execution; proprietary binary inspection; third-party community behavior reports; exhaustive device inventory; legal advice; and claims that current-main code is stable-release behavior.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. The open implementation supports a decision-quality architecture analysis, but artifact-level format qualification and several advanced runtime contracts remain unknown. [C-008] [C-025] [C-032] [C-039]

## 1. Executive summary

Bespoke's defining model is a live-patchable canvas of small modules rather than tracks arranged primarily against one global timeline. Audio, notes, pulses, modulation/UI controls, and special-purpose relationships are patched explicitly; song-scale organization is itself supplied by modules such as `songbuilder`, snapshots, loopers, note/sample canvases, and sequencers. This makes Bespoke a strong clean-room reference for graph-first composition and for treating arrangement mechanisms as composable graph nodes. [C-004] [C-005] [C-009]

The stable engine processes a dependency-ordered list of audio sources sequentially inside the device callback while holding a global audio mutex. Cycles are detected and marked, but no special feedback-delay or latency-compensation model was established. Buffers are float, fixed-size in the inspected path, and can be globally oversampled by duplicating input samples and averaging output subsamples. This is transparent and compact, but not evidence of multicore scheduling, plugin delay compensation, or a production offline-render contract. [C-006] [C-007] [C-008]

Plugin hosting is substantially deeper than a format-name claim. Stable/current build configuration enables VST3 and LV2 on all three desktop platforms; VST2 is opt-in with an external SDK and explicitly called a non-FOSS build. AU, LADSPA, and the other required formats are not enabled by the inspected source configuration. Scanning defaults to an external worker process with a dead-man file, editable scan paths through JUCE's plugin manager, and an XML known-plugin cache; instantiated plugins then run in the main process. [C-018] [C-019] [C-020] [C-022]

Stable v1.3.0 provides stereo plugin audio output, sample-offset MIDI input, limited plugin MIDI output (note on/off and CC), playhead delivery, stable parameter IDs where available, custom/generic editor windows, state/program serialization, and Bespoke preset files. Current main adds manually created stereo output cables and persists their count, up to 16 stereo pairs; that delta is not release- or fixture-qualified. Sidechains, PDC, tails, architecture bridging, dynamic I/O, complete MIDI-event output, and runtime crash recovery remain unknown. [C-023] [C-024] [C-025] [C-026] [C-027]

Projects use `.bsk` files containing a JSON layout string followed by versioned binary module state. Saves are temp-first but copy the temporary file to the target rather than proving an atomic replacement. Autosave is triggered before spawning a module and is intended to rotate ten files; the ordering of prune-before-save appears able to leave eleven until the next autosave. Missing plugin state is consumed and logged rather than preserved by a documented placeholder, which is a durability liability. [C-029] [C-030] [C-031] [C-032]

**Overall confidence:** high for source-visible stable architecture, format enablement, scan/runtime boundaries, and persistence; medium for current-main multi-output semantics; low for official binary composition and all untested interoperability/recovery behavior. [C-003] [C-024] [C-039]

## 2. Product identity, history, and market position

The official site says Bespoke began in 2011 as Ryan Challinor's personal music-software project. It describes the product as a software modular synthesizer and a DAW-like environment optimized for jamming and exploration rather than a global timeline. [C-001]

The product is maintained in public: stable `v1.3.0` was published on 2024-12-22, and the inspected main commit is dated 2026-08-27 UTC. The latter shows source activity, not a newer stable release or support commitment. [C-002] [C-003]

The official site offers macOS, Windows, and Linux builds and states that free, Plus, and Pro are the same files with different charitable donation amounts. There is therefore one functional desktop edition in this dossier. No iOS, Android, browser, or hosted-cloud edition was found. [C-002]

Its market position is unusual: it can host plugins and record/render audio, but its principal value proposition is a customizable modular performance/composition environment rather than a conventional linear studio replacement. [C-001] [C-004]

## 3. Workflow and conceptual model

Users create modules on an unbounded, pan/zoom canvas and connect compatible outlets to targets. Modules can be spawned from menus, typing, or an existing loose cable; patches can be split or inserted while audio is live. The resulting project boundary is a module graph plus each module's state, not a fixed hierarchy of project → tracks → clips → inserts. [C-004] [C-005]

Composition mechanisms are modules. Examples include step, Euclidean, circular, note-canvas, and drum sequencers; note and audio loopers; snapshots; a sample arranging canvas; and `songbuilder`, which stores control-value scenes and sequences them for specified bar counts. [C-009]

This supports exploratory and performance-oriented construction: the musician can assemble a workflow while it is sounding, and can add a song-mode organizer only when needed. **INFERENCE:** the benefit is architectural plurality; the cost is that navigation, routing, state ownership, and large-project legibility shift from fixed DAW conventions to the patch author. [C-038]

## 4. Publicly documented architecture

The public C++ tree separates the application/audio callback (`MainComponent`, `ModularSynth`), drawable modules and containers, typed patch cables, audio/note/pulse/modulation interfaces, transport and scale services, MIDI/OSC, Python scripting, plugin scan/instance/editor code, persistence streams, and a large registry of native modules. [C-005]

Audio modules implement source/receiver interfaces and are placed into an ordered source list. Other cable categories deliver notes, pulses, control/modulation, grids, and special typed references. Module creation, layout, and state are separate operations, which is reflected in project serialization. [C-005] [C-029]

The source documents a monolithic desktop application with an external helper only for plugin scanning. No service-oriented backend, distributed render process, or general plugin worker runtime was established. [C-020] [C-022]

## 5. Audio engine

`MainComponent` forwards the device callback to `ModularSynth::AudioOut`. The engine identifies that callback thread, takes a global named audio mutex, advances transport, then calls each ordered audio source's `Process` method serially. Dependency arrangement places upstream sources before receivers; after 1,000 unsuccessful ordering passes, remaining cycle members are appended and implicated cables are marked as circular. [C-006]

The inspected engine uses `float` channel buffers and asserts a fixed relationship among device buffer size, internal buffer size, and the global oversampling factor. Global oversampling multiplies the internal sample rate/buffer size, duplicates input samples, and averages groups of output samples. Selected native synth voices also expose local oversampling. [C-007]

The audio preference surface allows device, sample-rate, buffer, channel, and oversampling choices, but supported ranges depend on the selected device. The always-on global record buffer captures the first two output channels. [C-007] [C-015]

Multicore graph execution, plugin delay compensation, reported plugin latency/tails, a dedicated faster-than-real-time render path, freeze, deterministic dropout recovery, and a formal feedback-delay rule are **UNKNOWN**. The visible serial loop and cycle marking do not establish those contracts. [C-008]

## 6. Tracks, timeline, clips, and editing

Bespoke does not require conventional tracks. Time-bearing content lives in modules: `notecanvas` is a looping piano-roll-like canvas with recording, quantization, MIDI import/export, and movable notes; `samplecanvas` is a sample arranging view; `notelooper`, `playsequencer`, and related modules store repeating patterns; `songbuilder` sequences scenes of targeted control values. [C-009]

Audio can also be organized with loopers, a looper recorder, a clip launcher, sample players, and a multitrack recorder. These are graph nodes with their own buffers and save-state revisions rather than one unified clip/take model. [C-009] [C-015]

Conventional track folders, edit groups, take lanes, comping, ripple/slip modes, elastic-audio warping, clip-version history, and a project-wide non-destructive edit contract are **UNKNOWN**. The presence of a module named `takerecorder` does not resolve this: official tooltip text marks it abandoned/possibly broken. [C-010]

## 7. MIDI, sequencing, notation, and expression

The native note model carries time, pitch, velocity, voice index, and modulation data. The product provides many pattern generators and processors, MIDI controllers and output, 14-bit CC support in v1.3.0, MIDI-clock input/output, MIDI-file import/export in `notecanvas`, and computer-keyboard input. [C-011]

Expression-oriented modules expose pitch bend, mod wheel/slide, pressure, voice assignment, MPE smoothing/tweaking, and expression visualization. The plugin bridge maps per-voice modulation to MIDI channels and sends pitch wheel, configurable mod-wheel CC, and channel pressure. Ableton Link and MIDI clock provide tempo/beat synchronization surfaces. [C-011]

Notation, score exchange, MIDI 2.0/UMP, per-note controller interoperability beyond the documented MIDI-1/MPE-oriented mapping, complete SysEx handling, and MTC are **UNKNOWN**. [C-012]

## 8. Routing, mixer, automation, and control

Audio routing is direct graph patching, augmented by `send`, `audiorouter`, `splitter`, `panner`, `effectchain`, input/output, and feedback modules. Source ordering is recomputed from audio connections and cycles are surfaced visually. There is no requirement that routing pass through a fixed channel strip. [C-005] [C-006] [C-013]

Control is similarly modular: sliders can receive modulators; snapshots store and blend sets of control values; `controlrecorder` records control changes; curve/LFO/step modules generate modulation; `songbuilder` scenes set targeted controls. MIDI-controller mappings support binding, scaling, toggling, pages, feedback, and 14-bit controls, while OSC input mapping and an OSC output module expose remote control. [C-013]

Documented synchronizers include Ableton Link and MIDI clock. Conventional bus/return/folder/VCA semantics, surround or immersive channel models, host-wide read/touch/latch/write automation lanes, generalized sidechain buses, and latency-aware feedback remain **UNKNOWN**. [C-014]

## 9. Recording, comping, and media handling

The engine keeps a configurable always-on stereo record buffer; “write audio” writes the retained material as 16-bit stereo WAV. The official reference describes the default user workflow as writing the last 30 minutes. A multitrack recorder can capture synchronized graph inputs and bounce tracks for mixing in an external DAW. Samplers, sample canvas/browser, loopers, drum players, and capture modules provide additional recording and playback surfaces. [C-015]

The project can embed substantial module buffers in `.bsk` state, which explains the documentation warning that autosaving projects with large samples can be slow. [C-015] [C-030]

Punch recording, production take management/comping, consolidated media pools, proxies, video, metadata, archive/collect, robust missing-media relinking, and a documented broad import/export codec matrix are **UNKNOWN**. [C-016]

## 10. Instruments, effects, content, and native devices

The official generated reference enumerates more than 190 modules across instruments/sequencers, note effects, synths, audio effects, modulators, pulses, chain effects, and utilities. Architecture-relevant examples include oscillator/FM/drum/physical-model synths, samplers and granular devices, effects and effect chains, loopers, audio/control routers, scenes/snapshots, recording modules, Link/MIDI/OSC, scripting, and controller integrations. [C-017]

Native devices are statically registered C++ module types. Prefabs and module presets compose/configure those types. Python provides a separate live-coding/control boundary. [C-017] [C-028]

Factory-content completeness, preset compatibility policy, and a stable external native-device SDK/ABI are **UNKNOWN**. [C-041]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`DOCUMENTED:not enabled` means the inspected stable/current source configuration and its pinned JUCE manager do not register that host format. It does not claim that no fork or future version could add it. Official artifact composition is separated from source capability. [C-018] [C-019] [C-039]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED:source-configurable; UNKNOWN:official artifact | DOCUMENTED:source-configurable; UNKNOWN:official artifact | DOCUMENTED:source-configurable; UNKNOWN:official artifact | NOT_APPLICABLE:no product | v1.3.0/current CMake; identical editions | Requires `BESPOKE_VST2_SDK_LOCATION`; build warns “non FOSS”; exact packaged support unverified | C-018, C-036, C-039; S-004, S-005 |
| VST3 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no product | v1.3.0/current source; JUCE 7.0.12 | Explicitly enabled; scan/instantiate contract inspected, not conformance-tested | C-018, C-020–C-027; S-004–S-006 |
| AUv2 | DOCUMENTED:not enabled | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no product | v1.3.0/current source; JUCE default macro | `JUCE_PLUGINHOST_AU` is not enabled and defaults to 0 | C-019; S-004–S-006 |
| AUv3 | DOCUMENTED:not enabled | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no product | Same as AUv2 | No AU host is registered; no mobile product | C-019; S-004–S-006 |
| AAX | DOCUMENTED:not enabled | DOCUMENTED:not enabled | NOT_APPLICABLE:no Linux AAX host scope established | NOT_APPLICABLE:no product | v1.3.0/current source manager | No AAX host adapter is registered; no SDK/certification right implied | C-019; S-004–S-006 |
| CLAP | DOCUMENTED:not enabled | DOCUMENTED:not enabled | DOCUMENTED:not enabled | NOT_APPLICABLE:no product | v1.3.0/current source; pinned JUCE | No CLAP adapter in the configured manager | C-019; S-004–S-006 |
| LV2 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no product | v1.3.0/current source; README | Explicitly enabled; JUCE 7.0.12 registers LV2 on all three desktop OSes | C-018, C-020–C-027; S-004–S-006 |
| LADSPA | NOT_APPLICABLE:JUCE adapter is Linux/BSD | NOT_APPLICABLE:JUCE adapter is Linux/BSD | DOCUMENTED:not enabled | NOT_APPLICABLE:no product | v1.3.0/current source | Explicit `JUCE_PLUGINHOST_LADSPA=0` | C-019; S-004–S-006 |
| DSSI | DOCUMENTED:not enabled | DOCUMENTED:not enabled | DOCUMENTED:not enabled | NOT_APPLICABLE:no product | v1.3.0/current source manager | No DSSI adapter is registered | C-019; S-004–S-006 |
| JSFX | DOCUMENTED:not enabled | DOCUMENTED:not enabled | DOCUMENTED:not enabled | NOT_APPLICABLE:no product | v1.3.0/current source manager | No JSFX interpreter/adapter is registered | C-019; S-004–S-006 |
| DirectX/DXi | NOT_APPLICABLE:Windows plugin family | DOCUMENTED:not enabled | NOT_APPLICABLE:Windows plugin family | NOT_APPLICABLE:no product | v1.3.0/current source manager | DirectSound audio-device support is not DXi hosting | C-019; S-004–S-006 |
| Rack Extension | DOCUMENTED:not enabled | DOCUMENTED:not enabled | DOCUMENTED:not enabled | NOT_APPLICABLE:no product | v1.3.0/current source manager | No Rack Extension host boundary; no SDK/trademark right implied | C-019; S-004–S-006 |
| Product-native/other | DOCUMENTED:native modules, prefabs, presets, Python | DOCUMENTED:native modules, prefabs, presets, Python | DOCUMENTED:native modules, prefabs, presets, Python | NOT_APPLICABLE:no product | v1.3.0/current, identical editions | Extensibility exists, but no stable third-party native binary plugin ABI was documented | C-017, C-028; S-003–S-005 |

### 11.2 Discovery, scanning, validation, and recovery

Bespoke creates a JUCE format manager and known-plugin list. Its plugin-manager window wraps JUCE's list component, provides path/options UI, and supplies `vst/deadmanspedal.txt`. The default “Avoid crashes” mode launches the current executable as a JUCE child worker; a selectable “Within process” mode calls the format scanner directly. Worker loss fails the current scan item without turning runtime instances into child processes. [C-020]

Scanned descriptions are returned as XML. Bespoke persists the known list in `vst/found_vsts.xml`, reloads it on first use, and writes it when the manager closes. The plugin spawn menu can suppress same-name duplicates according to the configurable preference order (default `VST3;VST;AudioUnit;LV2`) or show all formats when that preference is blank. It also records recent plugin identifiers. [C-021]

The dead-man mechanism supplies scan-crash blacklisting through JUCE, but quarantine policy, signatures, timeout handling for a hung plugin, duplicate identity beyond same displayed name, cache fingerprint semantics, and recovery after repeated crashes were not independently qualified. [C-020] [C-025]

### 11.3 Runtime isolation and compatibility

**INFERENCE:** normal plugin execution is in-process. Bespoke synchronously creates a JUCE `AudioPluginInstance`, retains it in the module, and invokes its `processBlock` inside the main audio-source loop. The only explicit child process in the inspected host path is the scanner. No runtime sandbox, per-plugin process, architecture bridge, or automatic plugin restart was found. [C-022]

The plugin instance and its editor therefore share the application's fault domain. VST2 build-time SDK selection is not an architecture bridge, and no Rosetta/WOW64 equivalent compatibility contract was established. [C-022] [C-025]

### 11.4 Host/plugin processing contract

On load, stable v1.3.0 enables buses, reads total input/output channels and bus layouts, prepares the plugin with Bespoke's sample rate/block size, and supplies a playhead. It passes a `juce::AudioBuffer<float>` and `MidiBuffer` to `processBlock`. Incoming note times become sample offsets; pitch bend, CC, and channel pressure are generated from Bespoke modulation. The playhead reports sample position and transport-derived musical time. [C-023]

Stable v1.3.0 copies at most two plugin output channels to the graph. Plugin-produced MIDI is decoded after processing, but only note-on, note-off, and CC are forwarded through the module's note outlet; other output event classes are not forwarded by this path. Disabled modules pass their input onward as a bypass. [C-023]

Current main adds a user-controlled number of additional stereo output cables and flattens consecutive plugin output channels into those pairs, capped at 16 stereo pairs. It saves the requested extra-output count and restores the cables. This is meaningful multi-output progress, but output buses are not presented with stable bus identities/names and the user manually chooses cable count; dynamic bus changes and non-stereo layouts remain unqualified. [C-024]

Sidechain input exposure, auxiliary buses, sample-accurate parameter automation guarantees, MIDI 2.0/note-expression transport, plugin latency/tail reporting, PDC, suspend, offline mode, deterministic bypass, and robust dynamic I/O are **UNKNOWN**. [C-025]

### 11.5 Parameters, automation, state, presets, and project recall

Bespoke enumerates plugin parameters and creates normalized sliders on demand. It uses JUCE hosted parameter IDs when available and otherwise falls back to parameter indices; older projects can use display names. Parameter gestures can make large-plugin parameters discoverable, but project-wide automation-lane semantics are not established. [C-026]

Project save captures both general plugin state and current-program state, plus which parameter controls are exposed. `.vstp` preset files store the same state classes and use JUCE's temporary-file replacement helper. On recall, Bespoke identifies the plugin through JUCE's identifier string and has a bounded compatibility fallback that removes part of the identifier hash. [C-026]

If a plugin cannot instantiate, the host logs an error and labels it “not loaded.” The state bytes are read but not retained in a documented placeholder; a later save with no instance writes no plugin state. Thus missing-plugin round-trip preservation is not provided by the inspected path. Relink UX and migration across incompatible plugin versions remain **UNKNOWN**. [C-027]

### 11.6 UI, diagnostics, and failure modes

The “open” control requests the plugin's custom editor; if none exists, Bespoke creates a JUCE generic parameter editor in a separate resizable document window. The module also exposes selected parameters, preset selection/save, volume, and panic controls. [C-027]

Scan mode and progress are exposed through the plugin manager; scan crashes can be isolated by the worker/dead-man path. Runtime creation failures are logged with JUCE's error string, and missing instances are visibly labeled. Custom-editor scaling/DPI behavior, headless operation, editor-crash containment, corrupt-state recovery, and detailed per-plugin diagnostics are **UNKNOWN**. [C-020] [C-025] [C-027]

## 12. Extensibility and integration

Python live coding can generate notes and control modules. Saved scripts are hashed with SHA-256; unknown hashes pause execution, show an explicit trust warning, and cannot run until each script is approved and recorded in a local allow list. This is a useful load-time trust gate, not a Python sandbox: the warning itself acknowledges that a malicious script could affect the computer. [C-028]

MIDI/OSC mapping, OSC output, Ableton Link, MIDI clock, configurable controller-layout JSON, Push 2/Move helpers, and MTS-ESP/tuning dependencies provide hardware/protocol integration. Prefabs and module presets package native graph configurations. [C-011] [C-013] [C-017]

No stable native binary module SDK/ABI, extension-process boundary, semantic compatibility policy, or restricted scripting capability model was documented. Source-level C++ additions require working within the GPL project and rebuilding it. [C-028] [C-036] [C-041]

## 13. Project format, persistence, interoperability, and collaboration

`.bsk` save state begins with a serialized JSON layout containing modules, UI-layer modules, positions/relationships, and zoom locations, followed by binary state for the two module containers. Modules and controls carry individual save-state revisions; the loader validates revisions and includes compatibility handling for older 32-bit saves. `.bskt` is treated as a template. [C-029]

Saving locks the audio thread, writes the whole state to a fixed temporary path, then copies that file to the destination. This is temp-first protection against building the target incrementally, but the source does not establish atomic replacement or concurrent-save safety. [C-030]

When enabled, autosave runs before spawning a new module and writes timestamped `.bsk` files under `savestate/autosave`. The implementation names a ten-slot limit and deletes older excess files before writing the new save. **INFERENCE:** with exactly ten existing files, it deletes none and then writes an eleventh, so the practical steady-state can be eleven files until the next prune. [C-030] [C-031]

Automatic crash-session restoration, journal replay, persistent undo, corruption recovery, forward compatibility, general missing-module/plugin placeholders, deterministic asset relinking, archive/collect, DAWproject/AAF/OMF/ADM/MusicXML exchange, cloud collaboration, and merge-friendly version control are **UNKNOWN**. MIDI import/export and WAV recording are narrower module-level interchange features. [C-032]

## 14. Delivery, live, post-production, and specialized workflows

Bespoke's specialty is live construction and performance: patches remain editable while playing; scenes, snapshots, loop capture/overdub, retroactive stereo recording, controller mapping, and Link/MIDI synchronization support improvisation. Audio can be written from the global buffer or bounced from the multitrack recorder as WAV. [C-033]

Batch/stem export policy, loudness targets, mastering/DDP, video/timecode/ADR, post conform, surround/immersive/ADM, cue/show control, and render-farm delivery are **UNKNOWN**. The “clapboard” synchronization tone is a utility, not a documented post-production subsystem. [C-040]

## 15. Performance, reliability, security, and accessibility

Reliability mechanisms visible in source include an external-process scan option, dead-man scan file, temp-first project writes, rotating autosaves, runtime/plugin mutexes, Windows crash stack collection, general stack/backtrace and system-stat logs, and plugin panic. Python state has an explicit user trust gate. [C-020] [C-028] [C-030] [C-034]

The build disables JUCE app-usage reporting and curl, and includes an optional macOS hardened-runtime/codesigning path. These facts do not prove the privacy, signing, notarization, update, or supply-chain properties of official artifacts. Plugin instances remain in-process, and UI operations that take the global audio mutex may contend with the audio callback. [C-022] [C-034] [C-035]

No supported project-size ceiling, real-time deadline guarantee, multicore scaling model, runtime plugin crash recovery, rollback/update policy, complete telemetry/privacy statement, screen-reader conformance, keyboard-only conformance, or accessibility audit was found. Translated tooltip resources exist, but localization completeness is unknown. [C-035]

## 16. Licensing, ecosystem, and implementation constraints

The site and README call Bespoke GPLv3; source-file headers say GPL version 3 or, at the user's option, any later version. This dossier does not resolve the legal significance of that wording difference. Clean-room use should extract architectural ideas, not copy source expression, and any direct reuse requires a competent license review. [C-036]

Pinned JUCE 7.0.12 offers GPLv3 or commercial tiered licensing; its `juce_audio_basics`, `juce_audio_devices`, `juce_core`, and `juce_events` modules are separately identified as ISC. The embedded VST3 SDK license permits GPLv3 or Steinberg's proprietary VST3 terms and separately points to trademark/logo usage guidelines. Bespoke's GPL project can use the GPL paths, but this is not legal advice. [C-036]

VST2 is materially different: Bespoke requires the builder to provide `BESPOKE_VST2_SDK_LOCATION` and labels the result a non-FOSS build. Naming or implementing VST2 support does not establish that a new developer can obtain, use, or redistribute the discontinued SDK. [C-036] [C-039]

The direct build manifest includes JUCE, Python/pybind11, Ableton Link, jsoncpp, tuning-library, MTS-ESP, readerwriterqueue, exprtk, and bundled device/DSP/UI helpers. Available bundled notices identify GPLv3 for xwax; MIT for Freeverb, scalable-font2, and Ableton Move/Push helpers; BSD-2-Clause text for Leathers; and zlib-style terms for NanoVG. A checked `psmove/COPYING` is malformed HTML, several gitlink license files were not present, and no reliable consolidated SBOM/NOTICE closes all transitive obligations. [C-037]

## 17. Strengths, liabilities, and architecture lessons

**Strengths:** the graph is the user model and the engine model; connection categories are explicit; source ordering is understandable; arrangement, automation, control, recording, and synchronization are composable modules; persistence co-locates layout with versioned module state; plugin scanning distinguishes qualification from execution; and scripting has a visible trust decision. [C-005] [C-006] [C-009] [C-020] [C-028] [C-029]

**Liabilities:** one global callback lock and serial graph loop limit scaling; cycle marking is not a complete feedback contract; project saves pause audio and are not proven atomic; missing plugin state is not preserved; normal plugin runtime is in-process; stable plugin audio output is stereo; and advanced latency/bus/recovery behavior is unknown. [C-006] [C-008] [C-022] [C-023] [C-025] [C-027] [C-030]

**INFERENCE:** Bespoke is a high-value clean-room reference for a graph-first instrument/DAW and for small, inspectable module/persistence boundaries, but a poor sole reference for production-scale scheduling, durable missing-dependency handling, or a complete modern plugin host. Current-main multi-output work improves breadth without yet resolving those deeper contracts. [C-024] [C-038]

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Support | Prerequisites, tradeoffs, and adaptation risk |
| --- | --- | --- | --- | --- |
| CANDIDATE | Let users invent workflows instead of choosing fixed tracks | Typed module nodes plus explicit audio/note/pulse/control/special edges | C-004, C-005 | Needs stable IDs, graph validation, search/navigation, accessibility, and a latency/cycle policy; do not copy UI/source expression |
| CANDIDATE | Keep arrangement optional in a modular system | Scene, snapshot, sequence, looper, and canvas nodes that target ordinary graph controls | C-009, C-013 | Requires deterministic transport/state ownership and discoverable composition boundaries |
| CANDIDATE | Persist heterogeneous nodes durably | Human-inspectable topology header plus per-node versioned opaque state | C-029 | Add integrity checks, atomic replacement, unknown-node preservation, migrations, and asset manifests absent here |
| CONDITIONAL | Protect the main app during discovery | External scanner worker, dead-man record, cache, explicit rescan/path UI | C-020, C-021 | Add timeouts, structured quarantine reasons, fingerprints, code-signature policy, and disposable fixtures |
| CONDITIONAL | Gate executable project content | Content hash allow list plus explicit per-script approval before any loaded script executes | C-028 | Approval is not sandboxing; use capability restriction and provenance in a new system |
| CONDITIONAL | Expose plugin multi-output in a free graph | One primary pair plus user-created stereo output endpoints persisted by count | C-024 | Must replace positional pairs with stable bus IDs, layouts, dynamic-I/O transactions, and migration tests |
| CONDITIONAL | Capture improvisation continuously | Bounded rolling stereo buffer with explicit “write recent audio” action | C-015 | Requires privacy/storage controls, dropout diagnostics, configurable formats, and crash-safe writes |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT:** one global mutex and serial source loop as an assumed production-scale scheduler. It is transparent but does not provide multicore, deadline, or priority-inversion guarantees. Reopen only with measured scaling prototypes. [C-006] [C-008]
- **REJECT:** cycle detection/visual marking as a complete feedback model. A new DAW needs explicit delay, causality, latency, and state semantics. [C-006] [C-014]
- **REJECT:** consuming missing-plugin state without a state-preserving placeholder. It risks destructive resave and blocks durable project exchange. [C-027]
- **REJECT:** treating scan-process isolation as runtime sandboxing. Instantiated plugins are still in the application process. [C-020] [C-022]
- **REJECT:** temp-first copy as sufficient proof of atomic project save. Reopen after filesystem/failure-injection qualification. [C-030]
- **REJECT:** format names as evidence of full host compatibility. Source acceptance, scan success, instantiation, processing, state recall, and advanced contracts remain separate gates. [C-018] [C-025] [C-039]
- `CURIOSITY_NO_GO` — dynamic multi-output/sidechain/PDC fixtures: highest runtime value, but outside the documentary/no-binary wave. [C-025]
- `CURIOSITY_NO_GO` — packaged VST2 inspection: pipeline library variables and artifact composition were unavailable; binary qualification would exceed scope. [C-039]
- `CURIOSITY_NO_GO` — exhaustive accessibility/localization audit: important but unlikely to change the graph/plugin decision within the remaining budget. [C-035]
- `CURIOSITY_NO_GO` — nested research delegation: unavailable at the current subagent-depth limit; no evidence claim depends on it.

## 20. Falsifiable hypotheses and adversarial checks

1. **H1 supported:** Bespoke is graph-first rather than timeline-first. Official positioning, basic patching documentation, and source object boundaries agree. [C-001] [C-004] [C-005]
2. **H2 supported:** the stable engine is a sequential dependency-ordered callback graph protected by a global mutex. The callback, sort, and cycle paths are explicit. [C-006]
3. **H3 falsified:** “plugin support means only VST.” Stable/current configuration explicitly enables VST3 and LV2; VST2 is conditional. [C-018]
4. **H4 falsified:** “Bespoke hosts Audio Units on macOS because JUCE can.” Bespoke does not enable the AU macro, whose pinned JUCE default is zero. [C-019]
5. **H5 supported:** default scan execution is external while normal plugin rendering is in-process. The scanner child protocol and synchronous instance/process path are distinct. [C-020] [C-022]
6. **H6 refined by version:** stable v1.3.0 limits plugin output to stereo; current main adds up to 16 manually exposed stereo pairs. The current code retains a stale comment saying multi-output is unsupported, but the surrounding implementation and stable-to-current diff contradict that comment. [C-023] [C-024]
7. **H7 supported:** plugin MIDI output is not a complete event bridge. The inspected stable/current loop forwards only note-on/off and CC. [C-023]
8. **H8 falsified:** “`.bsk` is simply JSON.” It starts with JSON topology but appends binary container/module state. [C-029]
9. **H9 refined:** project saving is temp-first, but atomic replacement is not established because the temporary file is copied to the target. [C-030]
10. **H10 supported as inference:** the named ten-slot autosave can temporarily retain eleven due to prune-before-write ordering. A filesystem probe would discriminate exact JUCE file-timestamp behavior. [C-031]
11. **Later safe probes:** in disposable macOS/Windows/Linux hosts, separately test format accepted → scan completed → instance created → audio/MIDI rendered → editor opened → state restored; then test scan/runtime crash/hang, missing/resaved plugin state, sidechains, multi-output layouts, dynamic I/O, latency/tails/PDC, event offsets, and corrupted `.bsk` writes. No dynamic probe was run. [C-025] [C-032] [C-039]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Bespoke began in 2011 and is positioned as a modular synth/DAW optimized for jamming and exploration over a global timeline. | Product family | S-001 | Direct official description | Vendor positioning, not comparative measurement |
| C-002 | DOCUMENTED | High | Stable v1.3.0 was published 2024-12-22 for macOS/Windows/Linux; all paid/free offerings use identical files. | Stable release/editions | S-001, S-002 | Official site and release assets | Artifact internals were not executed/inspected |
| C-003 | DOCUMENTED | High | Current source snapshot is commit `626ae10...` dated 2026-08-27 UTC; stable remains v1.3.0; JUCE is pinned at `4f43011...` (7.0.12). | Cutoff source scope | S-002, S-005, S-006 | Immutable commits/gitlink | Current source is not released behavior |
| C-004 | DOCUMENTED | High | User workflow is a live-patchable canvas of modules with optional song/timeline mechanisms. | Workflow | S-001, S-003, S-004 | Official basics and reference | UX quality not dynamically observed |
| C-005 | DOCUMENTED | High | Source separates modules and typed audio/note/pulse/control/special connections; the audio graph is explicit. | Stable architecture | S-004 | Interfaces, patch cables, factory/module tree | Full type inventory not reproduced here |
| C-006 | DOCUMENTED | High | Audio sources are dependency-ordered and processed serially in the callback under a global mutex; cycles are detected/marked and unresolved nodes retained. | v1.3.0 engine | S-004 | `AudioOut` and dependency functions | No scheduling benchmark; cycle sound semantics incomplete |
| C-007 | DOCUMENTED | High | Engine buffers are float and fixed-size in the inspected path; global oversampling duplicates inputs and averages output subsamples. | v1.3.0 engine | S-004 | Callback, globals, preferences | Device ranges and audio quality not measured |
| C-008 | UNKNOWN | Low | Multicore scheduling, PDC, latency/tail handling, offline rendering, freeze, dropout recovery, and formal feedback delay are unknown. | Audio engine | S-004 | Not established by callback/source inventory | Next probe: scheduler review plus timing fixtures |
| C-009 | DOCUMENTED | High | Sequencers, note/sample canvases, loopers, snapshots, and songbuilder provide module-scoped editing/arrangement. | Stable workflow | S-003, S-004 | Generated reference plus module state | Not a conventional track model |
| C-010 | UNKNOWN | Low | Takes/lanes/comping, ripple editing, elastic warping, clip history, and a unified non-destructive edit contract are unknown. | Editing | S-003, S-004 | Relevant module reference inspected | Absence from selected docs is not universal proof |
| C-011 | DOCUMENTED | High | Bespoke provides rich MIDI-1 sequencing/control, MPE-oriented modulation, 14-bit CC, MIDI clock, MIDI-file canvas I/O, and Ableton Link. | Stable MIDI/sync | S-002–S-004 | Release/reference/source | Interoperability not fixture-tested |
| C-012 | UNKNOWN | Low | Notation, MIDI 2.0/UMP, complete SysEx, MTC, and broader per-note expression interoperability are unknown. | MIDI/notation | S-003, S-004 | No qualifying contract located | Next probe: protocol fixtures and maintainer docs |
| C-013 | DOCUMENTED | High | Routing/control modules, snapshots, control recording, modulation, MIDI binding/feedback, and OSC expose graph-level routing and automation. | Stable routing/control | S-003, S-004 | Reference and module source | No DAW automation-lane claim |
| C-014 | UNKNOWN | Low | Conventional buses/returns/folders/VCAs, surround/immersive, sidechains, and latency-aware feedback are unknown. | Mixer/routing | S-003, S-004 | Graph routing alone is insufficient | Next probe: routing fixtures and engine contract |
| C-015 | DOCUMENTED | High | A rolling stereo buffer writes recent output as 16-bit WAV; multitrack and sample/looper modules provide additional capture. | Stable recording | S-003, S-004 | Reference plus writer source | Recording integrity not measured |
| C-016 | UNKNOWN | Low | Production comping, media pool/proxy/video/metadata, archive/collect, relinking, and broad codec guarantees are unknown. | Media | S-003, S-004 | Not resolved in evidence budget | Next probe: media fixture corpus |
| C-017 | DOCUMENTED | High | More than 190 native modules span sequencing, synthesis, effects, modulation, pulse, control, recording, and utilities; module types are statically registered C++. | Stable native ecosystem | S-001, S-003, S-004 | Official count/reference and static registry | Inventory/version packaging not independently checked |
| C-018 | DOCUMENTED | High | Stable/current builds enable VST3 and LV2 on desktop; VST2 is conditional on an external SDK. | Source format capability | S-004–S-006 | Bespoke macros plus JUCE format conditions | Official artifact flags remain unknown |
| C-019 | DOCUMENTED | High | AU and LADSPA are disabled; AAX, CLAP, DSSI, JSFX, DXi, and Rack Extension are not registered by the inspected source manager. | Required matrix | S-004–S-006 | Exhaustive configured format-manager path | Does not bind forks/future versions |
| C-020 | DOCUMENTED | High | Default scan uses an external child worker; in-process mode is selectable; a dead-man file and JUCE plugin-list UI support recovery/rescan. | Stable scan path | S-004, S-006 | Scanner and JUCE list component | Hang timeout/quarantine UX unqualified |
| C-021 | DOCUMENTED | High | Known plugins persist to XML; displayed same-name duplicates can be filtered by format preference; recent identifiers are recorded. | Stable discovery/cache | S-004 | `VSTLookup`, title bar, preferences | Identity collision/cache invalidation not qualified |
| C-022 | INFERENCE | High | Normal plugin instances execute in Bespoke's process; scan isolation does not extend to runtime. | Stable/current runtime | S-004, S-005 | Direct synchronous creation and `processBlock`; no runtime worker in path | OS process inspection could confirm |
| C-023 | DOCUMENTED | High | Stable v1.3.0 prepares float plugin processing, supplies playhead/sample-offset MIDI, copies at most stereo output, and forwards only plugin note-on/off/CC output. | v1.3.0 host contract | S-004 | Direct stable plugin source | No third-party fixture qualification |
| C-024 | DOCUMENTED | Medium | Current main adds persisted user-created outputs routing up to 16 consecutive stereo pairs. | Commit `626ae10...` | S-005 | Stable/current diff and current source | Stale comment conflicts; not release/runtime qualified |
| C-025 | UNKNOWN | Low | Sidechains, arbitrary buses/layouts, dynamic I/O, MIDI 2.0, sample-accurate automation, latency/tails/PDC, suspend/offline, runtime restart, and bridging are unknown. | Advanced host contract | S-004–S-006 | Basic process path does not establish advanced features | Requires synthetic plugin fixtures |
| C-026 | DOCUMENTED | High | Hosted parameter IDs/index fallback, normalized sliders, state/program chunks, exposed controls, and `.vstp` presets are persisted. | Stable plugin state | S-004 | Direct save/load and parameter code | Version migration/runtime recall untested |
| C-027 | DOCUMENTED | High | Custom/generic detached editors and error labels/logs exist; missing plugin state is consumed and omitted on subsequent save rather than preserved by a placeholder. | Stable plugin UI/recall | S-004 | Direct editor and save/load branches | Relink UX and corrupt-state behavior unknown |
| C-028 | DOCUMENTED | High | Python live coding is available; loaded script text is hash-gated through explicit trust approval before execution. | Stable scripting/security | S-003, S-004 | Trust checks, allow list, warning UI | Approval is not sandboxing |
| C-029 | DOCUMENTED | High | `.bsk` contains JSON topology followed by versioned binary container/module state; `.bskt` is a template. | Stable persistence | S-004 | Direct save/load streams | Full schema and forward compatibility not specified |
| C-030 | DOCUMENTED | High | Project saves write a fixed temp file then copy to target; autosave runs before module spawn and uses a named ten-file pruning threshold. | Stable persistence/recovery | S-003, S-004 | Direct save/autosave code and tooltip | Atomic replacement and exact cap not established |
| C-031 | INFERENCE | Medium | Pruning before writing can leave eleven autosaves when ten existed before the save. | v1.3.0 autosave | S-004 | Direct loop ordering and index bounds | Filesystem/timestamp probe could refine |
| C-032 | UNKNOWN | Low | Automatic crash restore, journal/undo recovery, corruption tolerance, general migration/placeholders, archive/exchange, and collaboration are unknown. | Project durability | S-003, S-004 | Save path alone is insufficient | Requires failure/version corpus |
| C-033 | DOCUMENTED | Medium | Live patching, scenes, snapshots, loop capture, controllers, Link/clock, and WAV output support performance-oriented work. | Live/delivery | S-001, S-003, S-004 | Official positioning/reference/source | No show-critical reliability test |
| C-034 | DOCUMENTED | High | Source includes scan isolation, autosaves, crash/system logs, Python trust, disabled JUCE usage reporting/curl, and optional macOS hardened signing. | Stable NFR mechanisms | S-004 | Direct source/build flags | Artifact deployment not verified |
| C-035 | UNKNOWN | Low | Scaling limits, deadline guarantees, runtime crash recovery, updates/rollback, artifact signing/privacy, and accessibility are unknown. | NFR | S-001–S-005 | No qualifying policy/test evidence | Next probe: artifact and accessibility audits |
| C-036 | DOCUMENTED | High | Bespoke says GPLv3 while headers say GPLv3-or-later; JUCE/VST3 offer GPLv3 paths; VST2 is external and labeled non-FOSS. | Licensing | S-001, S-004–S-006 | Direct licenses/build text | Not legal advice; wording needs counsel |
| C-037 | UNKNOWN | Medium | A complete artifact-specific dependency/SBOM/license closure is unknown despite identifiable direct dependencies and several bundled notices. | Dependency licensing | S-005, S-006 | Missing gitlink licenses and malformed notice | Next probe: reproducible artifact SBOM/legal review |
| C-038 | INFERENCE | High | Bespoke is a strong graph/workflow/persistence reference but insufficient alone for production scheduling and modern plugin durability. | Architecture decision | S-001–S-006 | Synthesis of C-004–C-037 | Prototypes may alter suitability |
| C-039 | UNKNOWN | Low | Exact plugin formats and advanced contracts present in official v1.3.0/Nightly binary artifacts are unknown. | Release artifacts | S-002, S-004, S-005 | Build flags/source capability do not prove artifact composition | Next probe: signed artifact manifest or disposable qualification |
| C-040 | UNKNOWN | Low | Batch/stem export, loudness/mastering/DDP, video/timecode/ADR, post conform, surround/immersive/ADM, show control, and render-farm delivery are unknown. | Delivery/post | S-003, S-004 | WAV output and a clapboard utility do not establish advanced delivery | Next probe: official render docs and export fixtures |
| C-041 | UNKNOWN | Low | Factory-content completeness, preset compatibility policy, and a stable external native-device SDK/ABI are unknown. | Native ecosystem | S-001, S-003, S-004 | Static module registration and prefabs do not establish a third-party ABI | Next probe: maintainer API/compatibility statement |

## 22. Source ledger and adaptive bibliography

All fetched pages, repository files, comments, and prompt-like text were treated as **untrusted evidence**, never instructions. Access date for every source: **2026-08-29**.

- **S-001 — “Bespoke.”** Ryan Challinor / Bespoke Synth. <https://www.bespokesynth.com/>. Official product page; current mutable web source. Scope: product identity, origin, positioning, platforms, editions, open-source/license claim, module count, and downloads. Relevant passages: “modular DAW,” less global-timeline focus, project begun in 2011, Mac/Windows/Linux, GPLv3, identical free/Plus/Pro files. Supports C-001, C-002, C-004, C-017, C-033, C-036, C-041. **Limit:** vendor claims, no runtime qualification. **Why selected:** canonical product/edition source, preferable to stores or reviews.
- **S-002 — “bespoke 1.3.0” release and API metadata.** BespokeSynth GitHub organization. <https://github.com/BespokeSynth/BespokeSynth/releases/tag/v1.3.0> and <https://api.github.com/repos/BespokeSynth/BespokeSynth/releases/tags/v1.3.0>. Official release metadata. Scope: stable v1.3.0. Relevant passages: non-prerelease status, commit `1d0f042...`, publication `2024-12-22T19:24:42Z`, Linux/macOS/Windows assets, new modules, 14-bit CC, module presets, snapshots, bypass changes. Supports C-002, C-003, C-011. **Limit:** assets were not executed; GitHub page's relative date omits year in rendered text, so API timestamp was retained. **Why selected:** canonical release origin and artifact list.
- **S-003 — “Bespoke Synth Reference.”** Bespoke Synth. <https://www.bespokesynth.com/docs/index.html>. Official generated module/reference documentation. Scope: stable/current public user concepts. Relevant sections: basics/patching/saving; category and module entries for note/sample canvases, loopers, multitrack recorder, snapshots, songbuilder, MIDI/OSC, MPE modules, Link, script, plugin, and native synth/effects. Supports C-004, C-009–C-017, C-028, C-030, C-033, C-040, C-041. **Limit:** generated from tooltip material and not explicitly versioned; some entries self-identify abandoned/WIP behavior. **Why selected:** highest-density official user-facing workflow source.
- **S-004 — Bespoke Synth source at v1.3.0 commit `1d0f0429d9b56f1b120b0b95f0a173cc02787e53`.** BespokeSynth GitHub organization. <https://github.com/BespokeSynth/BespokeSynth/tree/1d0f0429d9b56f1b120b0b95f0a173cc02787e53>. Immutable open-source snapshot. Scope: stable architecture. Decision-critical files/sections: `README.md`; root and `Source/CMakeLists.txt`; `ModularSynth.cpp` callback/dependencies/save/autosave/recording; patch/audio interfaces; `VSTScanner.cpp`; `VSTPlugin.cpp`; `VSTWindow.cpp`; `ScriptModule.cpp`; `ModuleFactory.cpp`; module/control persistence. Supports C-003–C-041 except current-only C-024. **Limit:** documentary code reading, no compilation/execution; broad snapshot grouped under one source ID to keep claims traceable to one immutable origin. **Why selected:** authoritative stable implementation, preferable to mutable main or commentary.
- **S-005 — Bespoke Synth source at commit `626ae10bebee7a0f3bac71ed1e778acfd4a21423`.** BespokeSynth GitHub organization. <https://github.com/BespokeSynth/BespokeSynth/tree/626ae10bebee7a0f3bac71ed1e778acfd4a21423>. Immutable current-main snapshot at cutoff. Scope: post-v1.3.0 deltas and current build/dependency manifest. Decision-critical files/sections: `Source/VSTPlugin.cpp/.h` multi-output and state revision 4; CMake host macros; `.gitmodules` and gitlinks; licenses. Supports C-003, C-018, C-019, C-022, C-024–C-027, C-034, C-036, C-037, C-039. **Limit:** not a stable release; current multi-output code contains a stale contradictory comment and was not tested. **Why selected:** only primary source able to discriminate current host evolution from stable behavior.
- **S-006 — JUCE 7.0.12 at commit `4f43011b96eb0636104cb3e433894cda98243626`.** JUCE / Raw Material Software. <https://github.com/juce-framework/JUCE/tree/4f43011b96eb0636104cb3e433894cda98243626>. Immutable pinned dependency. Scope: format-manager conditions, scan/list/dead-man behavior, and licensing used by Bespoke. Relevant files: `juce_audio_processors.h`, `juce_AudioPluginFormatManager.cpp`, plugin-list/scanner utilities, `LICENSE.md`, embedded VST3 and LV2 SDK licenses. Supports C-003, C-018–C-020, C-025, C-034, C-036, C-037. **Limit:** JUCE capability does not prove Bespoke enablement or runtime conformance; only Bespoke-enabled paths were used. **Why selected:** exact pinned framework origin, preferable to current JUCE documentation.

**Negative-result log:**

- **N-001:** no installer, release binary, or third-party plugin was executed; all runtime/conformance conclusions therefore remain documentary.
- **N-002:** pipeline library variables and artifact manifests needed to determine whether official v1.3.0/Nightly binaries contain VST2 were inaccessible. Source configurability was not promoted to artifact support. [C-039]
- **N-003:** no Bespoke or JUCE build enablement was found for AU, LADSPA, AAX, CLAP, DSSI, JSFX, DXi, or Rack Extension. This establishes the inspected source configuration only, not all forks/future versions. [C-019]
- **N-004:** no code path querying plugin latency/tails or implementing PDC, sidechain labels, runtime process isolation, architecture bridging, or dynamic bus transactions was established in the bounded plugin pass. These remain unknown rather than unsupported. [C-025]
- **N-005:** current multi-output implementation conflicts with its inherited “until we support multi output” comment. The surrounding added cables, state, channel loop, and stable/current diff outweigh the comment, but confidence is medium. [C-024]
- **N-006:** the dependency snapshot lacks several submodule license files; `libs/psmove/COPYING` contains captured GitHub HTML rather than a usable license. A complete license bill of materials was not recoverable. [C-037]
- **N-007:** nested research was unavailable because the session was already at the configured subagent-depth limit. No claim was filled from memory as a substitute.

## 23. Unknowns and next discriminating probes

| Unknown | Attempts/blocker | Decision impact | Safest next probe | Required access/fixture; owner |
| --- | --- | --- | --- | --- |
| Official artifact formats [C-039] | Release metadata and source flags checked; artifact build variables unavailable | Platform/ecosystem commitment | Obtain signed/reproducible build manifest, then enumerate formats without loading untrusted plugins | CI provenance/artifact SBOM; unassigned |
| Sidechains, buses, dynamic I/O [C-025] | Stable/current host paths compared; only flat channels/manual stereo outputs established | Core graph/plugin model | Use synthetic VST3/LV2 fixtures with named buses, layouts, and runtime changes | Disposable hosts/plugins; unassigned |
| Latency, tails, PDC, offline [C-008, C-025] | No qualifying query/compensation path found | Mix correctness/render architecture | Impulse/tail plugins at parallel paths; inspect reported latency and offline flags | Instrumented fixtures; unassigned |
| Runtime crash/hang recovery [C-022, C-025] | Scan worker found; runtime remains in-process | Security/reliability critical | Crash and hang a non-malicious fixture during create/editor/process/state | Disposable VM and fixture; unassigned |
| Current multi-output semantics [C-024] | Immutable diff reviewed; no release/dynamic test; stale comment conflicts | Determines bus representation lesson | Qualify mono/stereo/surround/multiple buses and save/reload cable identities | Current build plus synthetic plugin; unassigned |
| Missing plugin durability [C-027] | Save/load branches show state consumption/no placeholder | Project longevity/data loss | Save, remove plugin, load/resave, restore plugin, byte-compare state | Disposable project/plugin; unassigned |
| Project failure recovery [C-030–C-032] | Save/autosave source reviewed; no crash corpus | Data-loss risk | Kill at each save phase; corrupt/truncate; test autosave discovery and count | Fault-injection filesystem harness; unassigned |
| Version migration [C-029, C-032] | Per-module revisions found; no compatibility corpus/policy | Long-lived project viability | Open/save historical `.bsk` corpus across tagged versions | Public fixtures/builds; unassigned |
| Editing/media/delivery breadth [C-010, C-016, C-040] | Official reference searched; modular features found, production contracts absent | Product-scope comparison | Bounded UI/doc audit followed by media/take/export fixtures | Disposable app/build; unassigned |
| Native extension stability [C-041] | Static module registry, prefabs, presets, and Python reviewed; no SDK/ABI policy found | Ecosystem and migration risk | Request maintainer API/compatibility statement before prototyping | Public statement; unassigned |
| Signing, privacy, accessibility [C-035] | Build flags inspected; official artifact/policy audit absent | Release/NFR acceptance | Verify signatures/notarization/update endpoints; keyboard/screen-reader test | Official artifacts and accessibility harness; unassigned |
| Dependency/license closure [C-037] | Manifest, gitlinks, available notices, JUCE/VST3 licenses reviewed | Redistribution/clean-room risk | Produce reproducible CycloneDX/SPDX SBOM and counsel-reviewed license mapping per artifact | Full recursive checkout/build; unassigned |

## 24. Curiosity pass and stop decision

Scoring uses 0–3; higher cost means more expensive.

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Direct dependency/license closure | 3 | 3 | 2 | 1 | **Pursued:** build manifest, gitlinks, available notices, JUCE/VST3 terms; result changed conclusion to explicit incomplete SBOM closure [C-037] |
| Dynamic multi-output/sidechain/PDC qualification | 3 | 3 | 3 | 3 | `CURIOSITY_NO_GO`: highest runtime value but outside documentary/no-binary authority |
| Packaged VST2 artifact composition | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: inaccessible pipeline variables and artifact qualification required [C-039] |
| Accessibility/localization audit | 1 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: unlikely to change the leading architecture conclusion within budget [C-035] |

**Coverage check:** all 26 ordered headings and all 13 required plugin-format rows are present. Identity/version/platform/edition, workflow, public architecture, audio scheduling, editing/sequencing, MIDI/control, recording/native devices, scan/runtime/plugin state/UI, scripting, persistence/recovery, delivery/NFR, licensing, patterns, claims, sources, negative results, unknowns, and follow-ups are represented.

**Saturation check:** stable and current immutable source agree on the graph, scan, format, persistence, and licensing fundamentals. The final current-main pass changed only the plugin multi-output/version conclusion; the license pass exposed incomplete dependency closure. Repeated source enumeration would not answer the remaining high-value runtime questions.

**Stop decision:** stop for **sufficient coverage, curiosity-budget exhaustion, repeated documentary saturation, and nonpositive marginal evidence**. The remaining discriminators require signed artifact provenance or bounded disposable runtime fixtures, not broader searching. Completion is `COMPLETE_WITH_UNKNOWNS`, not blocked. [C-025] [C-032] [C-037] [C-039]

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Owned path: `research/daw-landscape/dossiers/bespoke-synth.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See §0 and C-001–C-003.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive sections cite the classified claims register.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See §§21–23.
- [x] **Every required plugin-format row is present.** All 13 contract rows appear in §11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** See §§11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** `DOCUMENTED`, `INFERENCE`, and `UNKNOWN` are explicit; no `OBSERVED` runtime claim is made.
- [x] **Licensing and clean-room boundaries are explicit.** See §16 and C-036–C-037.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Only public pages, metadata, licenses, and source were read; no installer/plugin was run.

**Checks performed:** governing contract/template comparison; stable/current source diff; required matrix row count; claim/source cross-reference review; explicit unknown/negative-result review; cutoff and immutable-commit verification; heading-order check; whitespace check; and read-only workspace-status comparison.

**Verification result:** this dossier has 26/26 ordered headings, 6/6 plugin subsections, 13/13 required format rows with eight nonblank cells each, 41/41 contiguous claim IDs, 6/6 defined source IDs, 12/12 copied binary checks, no unresolved claim/source references, and no whitespace errors. The shared validator reported `STRUCTURE_OK: 58`, `INVALID: 2`, `MISSING: 21`; its two errors concern the pre-existing incomplete `muse-sequencer.md` and `emagic-logic-audio.md`, not this dossier.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; six retained primary source records, 41 claims (26 documented, 3 inference, 12 unknown), seven negative-result records, and twelve next probes.

**Unresolved blockers:** official artifact build flags; runtime plugin qualification; current-main release qualification; PDC/latency/tail/sidechain/dynamic-I/O contracts; crash/missing-plugin recovery; complete dependency SBOM; signing/privacy/accessibility evidence.

**Pre-existing workspace changes:** unrelated modified/untracked paths existed before this dossier was created and were left untouched. No staging or commit was performed.
