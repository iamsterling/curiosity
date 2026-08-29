# Tenacity DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** Tenacity, the Audacity-derived FLOSS multitrack audio editor/recorder. Audacity itself is excluded except where Tenacity's own sources identify fork/rebase lineage.
- **Canonical upstream:** Tenacity Team, `codeberg.org/tenacityteam/tenacity`. The GitHub repository is a mirror that says pull requests are ignored and carries no GitHub releases. [C-001, C-002]
- **Researcher/session:** `ses_fb273c428ffebn12TUxnMZyejj` (subagent assignment).
- **Owned path:** `research/daw-landscape/dossiers/tenacity.md`.
- **Evidence cutoff / access date:** 2026-08-29 UTC.
- **Release scope:** latest stable **Tenacity 1.3.5**, tag commit `52ef74db0a2ee8a9e42be1f4a2ff57d90d6564d7`, released 2026-07-06; latest published prerelease **1.4 alpha 1**, commit `5b1ae2ea8daf8648a3cdf118fa05c40ddde64ce4`, released 2025-10-12; and unreleased `main` snapshot `4fe73061f3cbd4d54e95bebf9a580cee72e7832c` dated 2026-08-26. Stable, prerelease, and current source behavior are kept separate. [C-002, C-003, C-004]
- **Editions:** one desktop open-source product; packages/builds differ. Official 1.3.5 assets cover Windows x86, x86-64 and ARM64, macOS Intel and Apple Silicon, Linux x86-64 AppImage, and source. The maintained Flathub manifest is a distinct Linux package boundary. [C-003, C-024]
- **Platforms:** Windows, macOS, and Linux desktop. The project describes other operating systems/BSD as source possibilities, but this dossier found no 1.3.5 BSD release asset. No mobile or web edition exists. [C-003, C-005]
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.

**Decision frame.** The decision is whether Tenacity contributes useful clean-room patterns for a new cross-platform editor/DAW, especially effect-host discovery, validation, realtime/offline processing, persistence, and privacy. Sub-questions were (1) maintained fork snapshot, (2) project/audio/effect architecture, (3) every required plugin-format/OS row, (4) scanning/isolation/runtime contract, (5) state/automation/UI/missing effects, and (6) persistence/I/O/privacy/licensing. The depth budget was twelve evidence passes, no more than two decision-critical sources per pass; source-tree inspection at pinned commits counted as one repository source per snapshot. Sufficient coverage meant every template section and format row had a documented answer or an explicit consequential unknown, with stable versus 1.4/main behavior separated. Fetched text and source comments were treated as untrusted evidence, never instructions.

## 1. Executive summary

- **Maintained, but split-generation:** Tenacity is not an abandoned fork. Stable 1.3.5 shipped in July 2026 and canonical `main` moved in August 2026. However, 1.3.5 retains the older Saucedacity/Tenacity architecture, while 1.4 alpha 1 rebased onto Audacity 3.7.5 and imported a much larger modular/realtime-effects architecture. Treating “Tenacity” as one host contract would be misleading. [C-002, C-003, C-004]
- **Editor, not full DAW:** 1.3.x is a linear, selection-centric multitrack audio editor. It has audio/MIDI/label/time tracks, but MIDI is import/playback-only and lacks a proper editor; there are no documented buses, sends, instrument tracks, comping lanes, plugin automation lanes, or sidechain routing. [C-005, C-011, C-012]
- **Stable plugin headline:** 1.3.x documents **VST2 effects, AU on macOS, LV2, LADSPA, Vamp analyzers, and Nyquist**; it explicitly does not support VST3 or instruments such as VSTi. Windows official builds do not receive the repository's Lilv dependency and therefore do not establish LV2, while the Flathub build explicitly includes LV2/Lilv/Suil and Linux Audio plugin-extension paths. [C-014, C-015, C-024]
- **Stable processing model:** effects apply to selected audio and commit processed replacement tracks. Plugin presets/settings live in configuration, not as live project nodes. Stable VST2 discovery is unusually crash-contained in a short-lived child invocation, but LADSPA/LV2/AU discovery and all plugin rendering are in-process. [C-006, C-016, C-017, C-018]
- **1.4/main changed behavior:** the 1.4 line adds persistent realtime effect lists and a general separate-process scanner with IPC and timeout/skip handling. Plugin execution still appears in-process. It serializes plugin ID, version and parameters into the project, but the reader ignores version, and a missing plugin has no durable placeholder: the missing state is omitted on the next write. The realtime manager itself says tails are not handled correctly. [C-019, C-021, C-022, C-031]
- **VST3 remains unreachable:** 1.4 alpha 1 release notes say VST3 is disabled pending SDK/build-system integration; the pinned alpha and current `main` force `VST3 OFF`. Source files inherited by the rebase do not equal a reachable feature. [C-004, C-023]
- **Privacy/security:** Tenacity says telemetry, update checking, error-report sending, and online-service features were removed. Stable source contains a specific telemetry-removal marker. Nevertheless, native plugins execute with the host's privileges; the official Flatpak grants host filesystem and network sharing (the latter documented as needed for local IPC), so “privacy-friendly” is not a plugin sandbox guarantee. [C-025, C-026]
- **Architecture recommendation:** adapt the **provider registry + explicit disabled/invalid stubs + disposable scan process** pattern, but reject live native-code execution without a runtime fault boundary and reject dropping missing-plugin state. Prototype plugin identity, versioned opaque state, tail/latency semantics, and package-specific discovery before claiming compatibility. Confidence is **high** on release/build/source facts, **medium** on static in-process/runtime conclusions, and **low/unknown** on untested third-party interoperability. [C-017, C-019, C-021, C-030, C-031]

## 2. Product identity, history, and market position

Tenacity describes itself as an easy-to-use, cross-platform multitrack audio editor/recorder developed by volunteers. Its intended breadth includes musicians recording real instruments, podcast editing, and academic signal analysis rather than a single music-production niche. It is FLOSS and has no commercial edition segmentation. [C-001, C-005]

The project says it began as an Audacity fork after privacy/CLA/telemetry controversies. Its stable README welcomes users of Audacium and Saucedacity and says those forks' themes were preserved. The release archive says Saucedacity 1.1 beta 2 rebased on Audacity 3.0.4, and Tenacity's first stable 1.3 restarted development from the Saucedacity 1.3-alpha codebase. This establishes provenance, not identical behavior to any current Audacity release. [C-001, C-003]

Tenacity 1.4 alpha 1 is a second lineage breakpoint: its release notes call out a completed rebase onto Audacity 3.7.5 and explicitly classify realtime effects, beats/bars, native Opus/WavPack, and toolbar changes as “From Audacity.” Tenacity-specific removal of networking and its own packaging/theme work sit on top. Current `main` remains on this 1.4 generation, but no 1.4 stable release existed at cutoff. [C-004, C-034]

Maintenance evidence is strong: stable 1.3.5 addressed libexpat vulnerabilities, restored macOS packages, added Windows ARM and native ASIO support, and welcomed a returning maintainer; canonical `main` was updated three days before cutoff. The limited volunteer schedule disclosed in release notes remains a capacity risk, not evidence of discontinuation. [C-002, C-003, C-029]

## 3. Workflow and conceptual model

The mental model is a single linear timeline and one selection at a time. A project contains tracks; audio, MIDI and label tracks contain clips, while a time track contains speed-control points and is limited to one per project. Audio tracks expose mute, solo, pan and gain. There are no scenes, clip launcher, tracker grid, notation view, modular patching surface, or browser/mobile model. [C-005]

Stable effects are selection actions: choose audio, invoke an effect, set parameters, and apply it. The host can preview some effects in realtime, but the ordinary 1.3.x model is not a saved insert chain. The optional old “Effects Rack” source is behind a disabled experimental flag, so its presence is not stable reachability. [C-006]

The 1.4 generation adds saved realtime effect lists to tracks/channel groups and the project, creating an editor-plus-insert model. It still does not document a general bus graph, instruments, sidechains, or automation lanes. [C-021, C-031]

## 4. Publicly documented architecture

Stable 1.3.5 is a C++/wxWidgets desktop executable with PortAudio/PortMidi, SQLite project storage, built-in and loadable provider modules, format-specific effect adapters, importers/exporters, and a configuration-backed plugin registry. The build options compile VST2 and LADSPA by default, LV2 only when LV2/Lilv/Suil are found, AU only on Darwin, and Nyquist unconditionally in 1.3.x. [C-007, C-014]

The stable provider architecture has `ModuleManager`, `PluginManager`, descriptors with provider/path/valid/enabled/type/capability fields, and `pluginregistry.cfg`. Provider discovery yields candidate paths; registration instantiates adapters and persists descriptors. This is inherited architecture visible in Tenacity's pinned code, not a claim of Tenacity-original design. [C-007, C-017]

The 1.4 rebase splits more code into libraries (`lib-module-manager`, `lib-realtime-effects`, `lib-vst`, `lib-lv2`, `lib-audio-unit`, etc.). A dedicated child mode of the Tenacity executable validates discovered plugins over local IPC. Realtime effect state and processing remain application-library objects. [C-019, C-021]

**Bounded inference:** stable non-VST scanner paths and all runtime adapters load native libraries in the application process; 1.4 isolates scanning but not rendering. No source path located a render-service process, shared-memory audio transport, architecture bridge, or per-plugin sandbox. An alternative is an unlocated platform-specific boundary, so runtime isolation remains a static-code inference pending a process-observation probe. [C-018, C-030]

## 5. Audio engine

PortAudio provides device I/O; the manual lists WASAPI, CoreAudio, ALSA and cross-platform JACK as host examples and documents a default 512-sample suggested buffer. Project sample format is selectable as 16-bit, 24-bit, or 32-bit float; default project rate is 48 kHz in the 1.3 manual, and the product advertises arbitrary-rate editing and up to 32-bit float. Realtime and high-quality/offline sample-rate conversion/dither settings are distinct. [C-008]

Recording/playback uses callback/worker-thread code and float processing buffers. Stable effect application is an offline transaction: it duplicates selected input tracks, processes blocks, and replaces project tracks only on success. VST2 has a configurable block size (default 8192), optional latency compensation enabled by default, and reports no tail (`GetTailSize()` returns zero). [C-006, C-020]

The 1.4 realtime path creates effect instances, exchanges settings between UI/worker contexts, processes float blocks, and discards leading latency samples. Its manager contains an explicit “needs to handle tails” comment. This is evidence of a known incomplete tail contract, not complete plugin delay compensation. No public evidence established inter-track PDC, dynamic graph rescheduling, host oversampling, freeze, multicore plugin scheduling, or dropout recovery beyond recording-dropout labels. [C-021, C-031]

Export performs a mixdown (mono, stereo, or an advanced channel choice). There is no documented freeze/bounce object; applying effects or exporting is the render path. [C-010, C-011]

## 6. Tracks, timeline, clips, and editing

Stable track types are audio (`WaveTrack`), MIDI (`NoteTrack`), label, and time. Clips can be added, moved, cut, copied, pasted, duplicated, sample-edited, muted/soloed/panned/gained at track level, and viewed as waveform/spectrogram/multiview. A single selection can span one or more tracks. Cut lines and movement of neighboring clips are optional. [C-005]

Project edits are undoable and imported audio is represented in project storage; applying an effect writes replacement project audio rather than overwriting the imported source file in place. Effects are therefore destructive to the project timeline but reversible through project undo until history is discarded. [C-006, C-009]

No stable take lanes, comping, folder tracks, scene clips, clip launcher, or notation editor were documented. Punch-and-roll is a recording workflow, not take comping. Stable time manipulation is through effects and the single time track; 1.4 alpha adds beats/bars and newer snapping. [C-004, C-009, C-030]

## 7. MIDI, sequencing, notation, and expression

The 1.3 manual is unusually explicit: MIDI can be imported, one MIDI clip can be managed per track, and MIDI can be played after setup; support is “not good,” and a proper MIDI editor is future work. Source has MIDI file import/export and MIDI output, while `MIDI_IN` and note stretching are disabled experimental options. [C-012]

There is no documented MIDI recording, piano roll, notation, pattern sequencer, instrument-plugin hosting, MPE/per-note expression, MIDI 2.0, or sample-accurate MIDI/plugin event routing. VST2 adapter MIDI counts stay zero, VST synths are rejected, and LV2 Instrument/MIDI plugin classes are skipped. [C-020, C-030]

## 8. Routing, mixer, automation, and control

Stable routing is track-centric: mute, solo, pan, gain, device I/O, overdub playback, and export mixdown. The evidence did not locate user-visible buses, sends/returns, folders/VCAs, feedback routing, sidechains, or surround/immersive buses. “Advanced mixing” at export should not be confused with a persistent mixer graph. [C-005, C-011, C-030]

Audio-clip volume envelopes and the time-track speed envelope are timeline automation-like controls. Plugin `SupportsAutomation()` in 1.3 feeds command/macro parameter handling; it does not establish DAW automation lanes. The 1.4 realtime state supports live/static parameter changes and bypass, but no source/manual evidence showed timestamped or sample-accurate parameter automation. [C-013, C-021, C-030]

Control extension is through keyboard shortcuts, macros/commands, Nyquist, and experimental `mod-script-pipe`; no documented MIDI control-surface mapping, OSC, EuCon, or remote app was found. [C-027, C-030]

## 9. Recording, comping, and media handling

Documented recording includes selectable device/channels, overdub, software playthrough, recording to a new track, input monitoring, sound-activated recording, timer recording, punch-and-roll with pre-roll/crossfade, and dropout detection that writes labels. More than two input channels become separate mono tracks; two channels form one stereo track. [C-009]

No take lanes or comping model was documented. Media are copied into the SQLite project as sample blocks, with temporary/autosave storage used for unsaved-project recovery. Label tracks can round-trip as text-like label data and can map to Matroska chapters. Asset relinking, proxies, conform, video, and production metadata beyond ordinary audio tags/labels are unestablished. [C-009, C-010, C-011, C-030]

## 10. Instruments, effects, content, and native devices

Stable source contains many built-in generators, analyzers and processors (gain/normalize, EQ/filter, dynamics, pitch/speed/tempo, noise reduction, reverb, repair, spectral tools, etc.) plus shipped Nyquist `.ny` effects. The inventory is architecture-relevant because built-ins and third-party adapters share effect interfaces, but it is not a bundled-instrument ecosystem. [C-013]

Nyquist is both a built-in scripting language and an effect-plugin format. Stable builds require it; 1.4/main make it a default-on build option. Vamp is analyzer-oriented. There are no native samplers, synth racks, instrument tracks, modulators, macro racks, or packaged sound library documented. [C-013, C-014]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`DOCUMENTED:YES/NO` means official manual/build/source evidence within the named scope; it is not an interoperability certification. `SOURCE-CONDITIONAL` means reachable only when dependencies/build options permit it. Official binaries were not executed.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED:YES | DOCUMENTED:YES | DOCUMENTED:YES | NOT_APPLICABLE:no edition | 1.3.x manual; default-on `VST2`; platform path code | Effects only; no VSTi. Windows ARM 1.3.5 expected native-ARM plugins only and was explicitly untested. No architecture bridge found. | C-014, C-020; S-003, S-005, S-009 |
| VST3 | DOCUMENTED:NO | DOCUMENTED:NO | DOCUMENTED:NO | NOT_APPLICABLE:no edition | 1.3 manual says unsupported; 1.4 alpha and current `main` force OFF | Rebased VST3 source is **inherited but unreachable**. | C-023; S-004, S-006, S-007, S-012 |
| AUv2 | DOCUMENTED:generic AU; INFERENCE:AUv2 | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no edition | Manual says AU macOS only; Darwin build and synchronous AudioComponent host | Code mechanism is consistent with desktop AUv2, but the manual does not version its “AU” claim. No runtime qualification performed. | C-014, C-020; S-005, S-009 |
| AUv3 | UNKNOWN | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no edition | Generic “AU” wording does not identify AUv3 | No explicit AUv3 extension discovery/async-instantiation contract found; safest status is unknown, not implied support. | C-030; S-005, S-009 |
| AAX | DOCUMENTED:NO | DOCUMENTED:NO | DOCUMENTED:NO | NOT_APPLICABLE:no edition | Absent from exhaustive supported-format manual list and provider/build tree | No Avid host path. | C-028; S-005, S-009 |
| CLAP | DOCUMENTED:NO | DOCUMENTED:NO | DOCUMENTED:NO | NOT_APPLICABLE:no edition | Same scope | No CLAP provider/build option. | C-028; S-005, S-009 |
| LV2 | DOCUMENTED:YES / SOURCE-CONDITIONAL | DOCUMENTED:NO in official vcpkg packages; custom build UNKNOWN | DOCUMENTED:YES | NOT_APPLICABLE:no edition | LV2 requires LV2/Lilv/Suil; vcpkg excludes Lilv on Windows; Flathub includes all three | Instrument/MIDI classes skipped. macOS/Linux source default only when dependencies found. | C-014, C-024; S-005, S-006, S-013 |
| LADSPA | DOCUMENTED:YES | DOCUMENTED:YES | DOCUMENTED:YES | NOT_APPLICABLE:no edition | Default-on build and manual | macOS scanner searches `*.so` despite candidate-extension code mentioning `.dylib`; Windows has no default path and relies on `LADSPA_PATH`/installed path. | C-014, C-016; S-005, S-009 |
| DSSI | DOCUMENTED:NO | DOCUMENTED:NO | DOCUMENTED:NO | NOT_APPLICABLE:no edition | Exhaustive list/tree | LADSPA support does not imply DSSI synth/OSC hosting. | C-028; S-005, S-009 |
| JSFX | DOCUMENTED:NO | DOCUMENTED:NO | DOCUMENTED:NO | NOT_APPLICABLE:no edition | Exhaustive list/tree | No JSFX runtime. | C-028; S-005, S-009 |
| DirectX/DXi | NOT_APPLICABLE:no host on macOS | DOCUMENTED:NO | NOT_APPLICABLE:no host on Linux | NOT_APPLICABLE:no edition | Exhaustive list/tree | No DirectX/DXi provider. | C-028; S-005, S-009 |
| Rack Extension | DOCUMENTED:NO | DOCUMENTED:NO | DOCUMENTED:NO | NOT_APPLICABLE:no edition | Exhaustive list/tree | Proprietary Reason format not hosted. | C-028; S-005, S-009 |
| Product-native/other | DOCUMENTED:Nyquist, Vamp | DOCUMENTED:Nyquist, Vamp | DOCUMENTED:Nyquist, Vamp | NOT_APPLICABLE:no edition | 1.3 manual/build; Vamp conditional on SDK, present in official manifests | Nyquist effects/scripting; Vamp analysis only. Experimental binary modules are a separate unstable extension boundary. | C-013, C-014, C-027; S-005, S-009 |

### 11.2 Discovery, scanning, validation, and recovery

Stable 1.3.x loads `pluginregistry.cfg`, discovers provider modules, checks known paths, creates disabled/invalid stubs for new candidates, and records descriptor identity, path, vendor/version, enabled/valid state, effect type, realtime and command-automation capability. The Manage Plugins dialog exposes name/state/path and filters all/new/enabled/disabled. A missing or invalid known plugin is disabled. No distinct quarantine or signed blacklist is documented. [C-016, C-017]

Stable paths are format-specific: VST2 uses `VST_PATH` plus platform defaults/registry and recursively scans bundles/DLLs/shared objects; LADSPA uses `LADSPA_PATH` and platform directories; LV2 uses `LV2_PATH` plus Lilv's world; AU enumerates AudioComponents; Nyquist scans `.ny`; Vamp delegates to its SDK loader. Duplicate handling is mainly provider+path/URI based; the code explicitly permits multiple providers to claim the same path, and stubs defer the choice until registration. Shell VST sub-IDs are scanned individually. [C-016, C-017]

Stable VST2 registration reinvokes the Tenacity executable synchronously for each candidate and parses a bounded descriptor record from stdout, so a VST crash during VST discovery is separated from the main process. LADSPA directly `dlopen`/loads candidates in the scanner process (the main app in 1.3), and no equivalent stable child path was found for LV2/AU. [C-018]

In 1.4, startup registration sends each provider/path to `AsyncPluginValidator`; it launches the same executable in a plugin-host mode, communicates by IPC, records disconnect/invalid results, supports a timeout/Skip action, and registers failed stubs as disabled/invalid. This is scan-time crash containment only. [C-019]

The Flathub package adds Linux Audio plugin-extension directories and sets `LADSPA_PATH`, `VST_PATH`, `VST3_PATH`, and an `LV2_PATH` wrapper. The VST3 path does not overcome Tenacity's forced-off VST3 build. Package manifests are therefore part of the effective discovery contract. [C-024]

### 11.3 Runtime isolation and compatibility

Plugin processing instances are created as native objects and called from effect/realtime processing code. No render subprocess, sandbox RPC, bitness bridge, Rosetta policy, or cross-architecture loader was located. Therefore **runtime execution is inferred in-process** for supported native plugins. A runtime crash can plausibly terminate the editor; this was not dynamically tested. [C-018, C-019, C-030]

Windows ARM release notes expect only native ARM plugins and explicitly say the aspect was untested. Separate Intel/Apple Silicon macOS packages exist, but no documented plugin-architecture bridge exists. macOS 1.3.5 applications are unsigned and require user intervention to launch; plugin code-signing/notarization validation behavior is unknown. [C-003, C-030]

Flatpak is an application sandbox, not a plugin process sandbox. Its manifest grants host filesystem access and network sharing and mounts plugin extensions, so a loaded native plugin shares substantial application authority. [C-024, C-026]

### 11.4 Host/plugin processing contract

Stable VST2 accepts replacing-capable non-synth plugins and fixes its MIDI input/output counts to zero. LV2 skips InstrumentPlugin and MIDIPlugin classes; remaining LV2 atom/MIDI ports are parsed, but end-to-end MIDI routing was not qualified. AU enumerates effect, generator, mixer, music-effect and panner component types, but Tenacity's effect-only workflow and no-instrument policy remain the product boundary. [C-020]

Adapters expose fixed audio input/output counts and process float blocks. Stable effects render the selection offline; realtime capability is used for preview and, only in 1.4, saved insert lists. No documented sidechain bus mapping, multiple-output routing, dynamic I/O renegotiation, MPE/note expression, or MIDI 2.0 exists. [C-006, C-020, C-030]

VST2, LV2 and AU expose optional latency use, enabled by default; stable offline processing consumes reported latency. Stable VST2 reports no tail, and 1.4 realtime processing explicitly has incomplete tail handling. Host bypass/suspend exists in 1.4's realtime state/instances. Sample-accurate plugin automation is unknown/unsupported by evidence. [C-020, C-021, C-031]

### 11.5 Parameters, automation, state, presets, and project recall

Stable adapters expose parameter names/values and generic controls; VST2 can save chunks with parameter fallback, AU saves class-info property lists and factory/user presets, and LV2 uses control values/state/presets. These live in plugin settings/preset configuration. Because stable project effects are rendered into replacement audio, reopening the project does not need the plugin to reproduce already-applied audio; there is no stable missing-insert placeholder problem. [C-006, C-020]

This does **not** mean stable has project automation. The “automatable” descriptor indicates command/macro parameter support, not a timestamped envelope. Parameter IDs, ranges and text are adapter-specific and were not dynamically checked for migration stability. Asset-reference behavior is unknown. [C-013, C-030]

The 1.4 realtime project XML writes effect active state, plugin ID, plugin version, and serialized name/value parameters. On read, version is ignored. If the plugin ID cannot resolve, the code leaves `mPlugin` null; the missing-plugin dialog warns the project may sound different, and `WriteXML` returns without writing that state. Thus it diagnoses a missing effect but does not preserve a durable placeholder through resave. [C-022]

### 11.6 UI, diagnostics, and failure modes

VST2 can use the plugin's custom editor or a generic parameter UI and exposes host options for UI use, block size and latency. AU can use Audio Unit UIs; LV2 uses Suil for supported native/external UIs; LADSPA has generic controls. UI embedding/detachment details, DPI/scaling correctness, headless operation, accessibility of third-party UIs, and editor resize behavior were not qualified. [C-020, C-030]

Diagnostics include plugin scan progress, logs/error strings, valid/enabled state, failed paths, timeout/Skip in 1.4, and a missing-realtime-plugin warning. There is no documented per-plugin crash report/restart or runtime recovery. Alpha 1 also intentionally lacked Tenacity themes, had incomplete preference migration, and warned against critical data; current `main` has subsequent theme work but no released qualification. [C-004, C-019, C-022, C-034]

## 12. Extensibility and integration

Nyquist is the supported native scripting/effect language. External programs can drive commands through `mod-script-pipe` using named pipes; macros/batch commands and configurable key bindings provide additional action automation. [C-027]

Binary modules are experimental, require restart to enable, have no stable interface, and can be marked Ask/Enabled/Disabled/Failed/New. The manual warns that `mod-script-pipe` does not sanitize inputs and should not be exposed in a production/remote-server setting. No stable public controller SDK, OSC API, or semantic-versioned extension ABI was found. [C-027, C-030]

The provider/module source is useful as an implementation reference under its license, but inherited names/comments and an unstable ABI mean it should be studied as behavior, not copied as a compatibility promise. [C-032]

## 13. Project format, persistence, interoperability, and collaboration

Stable projects use `.aup3`, backed by SQLite. Project storage contains XML project structure and SQLite sample blocks; history changes trigger autosave, and unsaved-project recovery uses a persistent temporary directory. The project code recognizes recovered state and supports automatic recovery. [C-010]

The source retains a legacy `.aup` importer. The exact backward/forward compatibility matrix, migrations across all Tenacity/Saucedacity/Audacium snapshots, and behavior when opening a 1.4 realtime-effects project in 1.3 are not documented here. Preference files are not safely interchangeable; the manual specifically warns not to copy plugin registry/settings files when manually migrating preferences. [C-010, C-030]

Native import/export covers common PCM/FLAC/MP3/Ogg/Matroska and other audio paths, raw data, labels and MIDI; optional FFmpeg broadens codecs/formats. 1.3.5 ships separate FFmpeg 7.1.5 libraries for Windows x86/x64, not ARM. Matroska can import PCM/FLAC and chapters and export PCM/FLAC with label tracks as chapters. Export can mix mono, stereo or selected channel layouts. [C-011]

No AAF, OMF, ADM/BWF production workflow, MusicXML, DAWproject, cloud collaboration, project version control, or collect/archive workflow was documented. `.aup3` appears self-contained for audio but plugin presets/assets and 1.4 missing effect state remain portability risks. [C-022, C-030]

## 14. Delivery, live, post-production, and specialized workflows

Tenacity's strengths are waveform/spectral editing, recording, signal analysis, podcast-style production, labels/chapters, macros, and ordinary audio-file delivery. Export Multiple and timer-record auto-export support batch-like delivery. [C-005, C-009, C-011]

It is not documented as a live-performance host, post-production interchange workstation, notation environment, video editor, DDP authoring tool, show-control system, or immersive/ADM mixer. Loudness and analysis effects do not establish those end-to-end workflows. [C-028, C-030]

## 15. Performance, reliability, security, and accessibility

The product supports up to 32-bit float audio, configurable device buffers, separate realtime/high-quality conversion, and dropout labels. No supported maximum track count, multicore scaling model, plugin CPU budget, disk-streaming benchmark, or deterministic realtime guarantee was found. [C-008, C-030]

Reliability mechanisms include transactional offline effect replacement, undo/autosave/recovery, scan invalidation, VST scan subprocesses in stable, and generalized scan subprocesses in 1.4. Runtime plugin crash containment is absent/unknown. The 1.3.5 release was initiated by libexpat vulnerability fixes and provides hashes/PGP signatures, but macOS app bundles are unsigned. Update/rollback orchestration is not documented. [C-006, C-019, C-029]

Tenacity claims telemetry and online service removal. The static source review found no telemetry/update/error-upload module, but local IPC/network-library declarations and third-party FFmpeg/plugins mean absence of application telemetry is not proof of zero possible network traffic. The Flathub permission set is broad. [C-025, C-026]

The project documents keyboard editing, screen-reader and narration support and maintains translations through Weblate. Third-party plugin UI accessibility remains plugin-dependent and untested. [C-033]

## 16. Licensing, ecosystem, and implementation constraints

Tenacity source and the 1.3 manual state **GNU GPL version 2 or later**. Stable manifests identify `GPL-2.0-or-later`; current `main` adds a default-on `GPL3` build option while the source license remains “or later.” The manual is CC-BY 4.0 and the website has its own MIT-et-al. boundary; neither changes application-code licensing. This is descriptive, not legal advice. [C-026]

Stable VST2 hosting does not use the discontinued proprietary VST2 SDK header: its pinned `aeffectx.h` identifies itself as GPL-2-or-later VeSTige-derived compatibility code. That reduces one redistribution dependency but does not grant trademark/certification rights or prove complete VST2 compatibility. [C-026, C-032]

VST3 is not currently build-reachable; alpha/main cite unresolved SDK/build-system integration. AU depends on Apple's desktop frameworks and macOS. LV2/LADSPA/Vamp depend on their libraries and package availability; official Windows manifests omit Lilv. AAX, Rack Extension and other proprietary ecosystems are not integrated. ASIO 1.3.5 support is a driver/build boundary, not evidence that ASIO SDK redistribution terms were independently cleared for every downstream package. [C-023, C-024, C-026, C-028]

Clean-room adaptation must use public behavior/specifications or independently authored interfaces and comply with Tenacity/GPL and each format/platform's current terms. Naming a format does not grant SDK, trademark, signing, redistribution, or certification rights. [C-032]

## 17. Strengths, liabilities, and architecture lessons

**Strengths**

- A small, inspectable editor architecture with transactional offline effects and self-contained SQLite audio projects. [C-006, C-010]
- Explicit provider descriptors, registry caching, disabled/invalid stubs, and user-visible plugin state/path management. [C-017]
- Separate-process VST2 scanning in stable and generalized IPC validation in 1.4, demonstrating a practical evolutionary path. [C-018, C-019]
- Clear separation between stable old-generation behavior and an experimental rebase rather than silently claiming feature parity. [C-003, C-004]
- Strong privacy posture at the application-feature level and accessible, cross-platform desktop scope. [C-025, C-033]

**Liabilities**

- Stable 1.3 is effect-application centric, not a durable realtime plugin host; MIDI and routing are far below full-DAW needs. [C-006, C-012, C-030]
- Plugin format support varies by package despite generic website wording; Windows LV2 is a prominent example. [C-014, C-024]
- Native plugin execution lacks a runtime crash/security boundary and architecture bridging. [C-018, C-030]
- 1.4 ignores saved plugin version, drops unresolved realtime effect state on resave, and admits incomplete tail handling. [C-022, C-031]
- VST3 source presence after rebase is misleading unless build reachability is checked. [C-023]

**Lesson:** source-tree feature inventory must be qualified at four gates—compiled, discovered, validated, and functionally routed/persisted. Tenacity supplies examples of each gate failing independently. [C-014, C-019, C-023, C-030]

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites/tradeoffs/adaptation risk |
| --- | --- | --- | --- | --- |
| CANDIDATE | A malformed plugin crashes startup | Enumerate paths in parent; instantiate/inspect one candidate in a disposable child; return a versioned descriptor over bounded IPC; timeout and mark invalid | C-018, C-019 | Child must have least privilege and deterministic teardown; scanning isolation is not runtime isolation. |
| CANDIDATE | Repeated scans are slow and opaque | Persist provider, stable ID/path, version, validity, enablement and capabilities; expose Manage Plugins with new/enabled/disabled/failed states | C-017 | Cache invalidation and duplicate identity require stronger version/hash rules than path alone. |
| CANDIDATE | Offline edits must be failure-atomic | Process cloned/project-transaction output and replace source tracks only after success | C-006 | Costs temporary disk/memory; preserve undo and cancellation semantics. |
| CONDITIONAL | One project file should aid recovery/portability | SQLite container with sample blocks, structural XML, autosave and recovery state | C-010 | Needs schema migration, corruption tooling, incremental backup strategy and forward-compatibility policy. |
| CONDITIONAL | Editor wants realtime effects without full DAW graph | Attach ordered effect lists to track/channel group and project master; exchange immutable settings snapshots with audio worker | C-021 | Must add complete latency/tail handling, automation timestamps, missing-plugin placeholders and runtime isolation. |
| CANDIDATE | Privacy claims must be testable | Compile without telemetry/update/upload modules and document every remaining network permission (including local IPC) | C-025, C-026 | Plugins/codecs can still network; permissions and runtime probes must be audited separately. |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT:** treating “source files exist” as support. VST3 source exists after the rebase while the build forcibly disables it. Reopen only when a released build enables it and a format-level qualification suite passes. [C-023]
- **REJECT:** path-only plugin identity as the durable project key. Provider/path IDs and an ignored saved version are insufficient for migration and duplicates. Reopen after component/class identity and version/state migration are specified. [C-017, C-022]
- **REJECT:** dropping unresolved plugin nodes on save. The 1.4 path warns but does not retain a placeholder. [C-022]
- **REJECT:** equating scan-process isolation with safe hosting. Runtime remains native/in-process by evidence. [C-019, C-030]
- `CURIOSITY_NO_GO`: exhaustive Codeberg issue mining—lower authority than pinned source for architecture, high duplicate/anecdote cost; reopen for one reproducible failure signature.
- `CURIOSITY_NO_GO`: installing 1.3.5/alpha or arbitrary plugins—outside documentary/safety scope; the next phase should use disposable signed/owned fixtures.
- `CURIOSITY_NO_GO`: AUv3 assumption from generic “AU” wording—would overclaim; reopen with a minimal AUv3 fixture and process observation on supported macOS.
- `CURIOSITY_NO_GO`: a legal opinion on VST/ASIO trademarks and SDK grants—outside research authority; counsel/format-owner review is the correct owner.
- `CURIOSITY_NO_GO`: enumerate every FFmpeg codec and every native effect—unlikely to change the plugin-host architecture decision.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Result | Evidence/counterevidence | Later discriminating probe |
| --- | --- | --- | --- |
| H1: Tenacity is an unmaintained 2021 fork. | **FALSIFIED** | 1.3.5 in 2026 and current main activity. [C-002, C-003] | None needed for cutoff. |
| H2: Stable 1.3.5 is essentially the 1.4/Audacity-3.7.5 host. | **FALSIFIED** | Stable and alpha tags have materially different trees/realtime/state/scanner models. [C-003, C-004, C-019, C-021] | Open identical fixture projects in both generations. |
| H3: “Supports VST” means current VST3. | **FALSIFIED** | Stable manual says VST2/no VST3; alpha/main force VST3 off. [C-023] | Wait for released enabling commit. |
| H4: All official desktop packages have the same LV2 support. | **FALSIFIED** | Lilv excluded on Windows; Flathub explicitly bundles LV2 stack. [C-024] | Inspect built feature report on each signed/released package. |
| H5: Plugin scanning and execution are both isolated. | **PARTLY FALSIFIED / runtime inference** | Scan child exists; processing instances are called in application libraries. [C-018, C-019] | Observe process tree and deliberately crash an owned test plugin. |
| H6: 1.4 preserves missing-plugin state. | **FALSIFIED statically** | unresolved `mPlugin` causes `WriteXML` to skip the effect. [C-022] | Save/reopen a fixture with a temporarily removed plugin and compare `.aup3` XML. |
| H7: “Automatable” means sample-accurate timeline automation. | **NOT PROVED** | Stable command-parameter automation and 1.4 static/live settings exist; no automation lane/timestamp path found. [C-013, C-030] | Automate a ramp fixture and inspect per-block/sample events. |
| H8: Format accepted ⇒ scanned ⇒ instantiated ⇒ full contract. | **FALSIFIED as equivalence** | Build flags, dependency gates, candidate stubs, validators, effect-only filtering, state and tail gaps are independent. [C-014, C-017, C-020, C-023, C-031] | Qualification matrix per format/OS/architecture with scan, render, UI, latency, state and failure cases. |

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Canonical Tenacity is a volunteer FLOSS cross-platform multitrack editor/recorder fork; Codeberg is upstream and GitHub is a mirror. | Product identity | S-001, S-008, S-014 | Direct upstream descriptions. | Marketing does not measure runtime quality. |
| C-002 | DOCUMENTED | High | Project is maintained at cutoff; canonical main updated 2026-08-26 and repository is not archived. | Maintenance | S-001, S-007 | API metadata + pinned commit. | Commit activity does not measure maintainer capacity. |
| C-003 | DOCUMENTED | High | Stable 1.3.5 released 2026-07-06 at pinned commit with Win/macOS/Linux assets; lineage ran through Saucedacity and older Audacity rebases. | Stable/history | S-002, S-003, S-005 | Release archive and source tag. | Exact delta from every ancestor not reconstructed. |
| C-004 | DOCUMENTED | High | 1.4 alpha 1 rebased on Audacity 3.7.5, imported realtime effects/beats-bars/etc., removed networking, and disclosed missing/disabled features. | Prerelease lineage | S-004, S-006 | Direct release notes + tag. | Alpha is not stable; main evolved after it. |
| C-005 | DOCUMENTED | High | Linear timeline has audio/MIDI/label/time tracks and clips; one selection; target uses span editing/recording/analysis. | 1.3 workflow | S-008, S-010 | Stable manual. | Manual incompleteness possible. |
| C-006 | DOCUMENTED | High | Stable effects process selected audio via copied output tracks and success-only replacement; effects rack is disabled experimental. | 1.3 effects | S-005, S-009 | Manual + source transaction/process flow. | Preview can run realtime; does not make saved inserts. |
| C-007 | DOCUMENTED | High | Stable architecture is C++/wxWidgets with PortAudio/PortMidi, SQLite, provider modules and plugin registry. | 1.3 source | S-005 | Build/source map. | “Monolithic” process boundary partly inferred. |
| C-008 | DOCUMENTED | High | Device hosts, default buffer/rate/sample formats and distinct realtime/offline conversion are documented. | 1.3 audio | S-008, S-012 | Stable manual/website. | Device-specific compliance untested. |
| C-009 | DOCUMENTED | High | Monitoring, overdub, sound activation, timer, punch-and-roll and dropout labels are present; no take comping documented. | Recording | S-005, S-012 | Preferences + source menus. | Absence of comping is documentation/source negative. |
| C-010 | DOCUMENTED | High | `.aup3` uses SQLite/sample blocks with autosave/recovery; legacy `.aup` importer exists. | Persistence | S-005 | Pinned project code. | Full migration matrix unknown. |
| C-011 | DOCUMENTED | High | Audio/raw/labels/MIDI and Matroska/FFmpeg import-export workflows are supported; export mixes audio. | I/O | S-003, S-011, S-012 | Manual + release FFmpeg scope. | Complete codec list not enumerated. |
| C-012 | DOCUMENTED | High | MIDI is import/single-clip/playback oriented with no proper editor; input/advanced expression not established. | MIDI | S-005, S-010 | Manual explicit limitation + experimental flags. | Nightly/custom MIDI builds may differ. |
| C-013 | DOCUMENTED | Medium-High | Stable has clip/time envelopes and command-parameter automation but no evidenced plugin automation lanes. | Automation | S-005, S-012 | Source/manual distinction. | Later dynamic UI could reveal more; none documented. |
| C-014 | DOCUMENTED | High | Stable supported families are VST2, macOS AU, dependency-gated LV2, LADSPA, Vamp and Nyquist. | Formats/builds | S-005, S-008, S-009, S-012 | Manual + CMake/provider paths. | Generic website omits packaging nuance. |
| C-015 | DOCUMENTED | High | 1.3 manual explicitly excludes instrument plugins and says VST3 unsupported. | Stable host boundary | S-009, S-012 | Direct manual. | No dynamic test. |
| C-016 | DOCUMENTED | High | Stable discovers per-format paths; VST scans in child invocations; LADSPA has notable OS path/extension constraints. | Scan paths | S-005 | Pinned provider code. | AU/LV2 OS behavior not executed. |
| C-017 | DOCUMENTED | High | Plugin registry caches descriptors and enabled/valid/new states; duplicates are path/provider oriented and failures become disabled/invalid. | Registry | S-005 | PluginManager source. | No robust content hash/class migration. |
| C-018 | INFERENCE | Medium-High | Stable VST scan is separate-process, other stable scans and all runtime rendering are in-process. | Process boundary | S-005 | Positive child code only for VST scan; direct native adapters for runtime. | Unlocated platform boundary is plausible alternative; probe needed. |
| C-019 | DOCUMENTED + INFERENCE | High scan / Medium runtime | 1.4 validates candidates in a child via IPC/timeout; no render-process path found. | 1.4 scanner/runtime | S-006 | Async validator/PluginHost and direct realtime instances. | Runtime half is static inference. |
| C-020 | DOCUMENTED | High | Effect adapters expose audio block/parameter/preset/latency/UI functions; synth/MIDI classes are rejected; VST2 tail is zero. | Plugin contract | S-005, S-006 | Adapter source. | Sidechain/dynamic I/O absent rather than explicitly prohibited. |
| C-021 | DOCUMENTED | High | 1.4 has persistent realtime track/project effect lists, settings exchange, bypass/suspend and latency discard. | 1.4 realtime | S-004, S-006 | Release + realtime libraries. | Alpha quality and PDC completeness not implied. |
| C-022 | DOCUMENTED | High | 1.4 saves ID/version/parameters, ignores version on read, warns on missing effects, and omits unresolved state when writing. | 1.4 recall | S-006 | Direct XML/missing-dialog source. | Dynamic round trip not run. |
| C-023 | DOCUMENTED | High | VST3 is disabled in stable, alpha and current main despite inherited source. | VST3 | S-004, S-006, S-007, S-012 | Explicit release/CMake/manual. | Future release may change. |
| C-024 | DOCUMENTED | High | Effective package support differs: Windows manifest omits Lilv; Flathub includes LV2 stack/plugin extension paths and broad permissions. | Packaging | S-005, S-006, S-013 | Pinned manifests. | Third-party distro packages may differ. |
| C-025 | DOCUMENTED | High | Tenacity states telemetry, update checking, error upload and online-service features were removed. | Privacy | S-004, S-005 | Release + source marker. | Not an independent packet capture. |
| C-026 | DOCUMENTED + INFERENCE | High facts / Medium security | Application is GPL-2.0-or-later; Flatpak shares network/host filesystem; native plugins inherit host authority. | License/security | S-005, S-007, S-008, S-013 | Licenses/manifests + in-process inference. | No legal opinion; runtime privileges not observed. |
| C-027 | DOCUMENTED | High | Nyquist, macros and experimental unsanitized `mod-script-pipe` are extension boundaries; binary module ABI is unstable. | Extensibility | S-009, S-012 | Direct manual. | External unofficial modules excluded. |
| C-028 | DOCUMENTED | Medium-High | AAX, CLAP, DSSI, JSFX, DXi and Rack Extensions are not supported in scoped builds. | Negative formats | S-005, S-009 | Exhaustive manual list + provider/build-tree negative search. | A later unseen branch could add one; current pins do not. |
| C-029 | DOCUMENTED | High | 1.3.5 addressed dependency vulnerabilities, publishes hashes/signatures, and ships unsigned macOS app bundles. | Release security | S-003 | Direct release notes. | No independent signature verification or binary audit. |
| C-030 | UNKNOWN | Low | Full runtime sandboxing, bridges, sidechains, multi-output, sample-accurate automation, UI scaling/headless behavior and several migration limits are unqualified. | Host depth | S-005, S-006, S-009 | Negative documentary/code search. | Needs owned-fixture dynamic tests. |
| C-031 | DOCUMENTED | High | 1.4 realtime manager says tail handling is wrong/incomplete. | 1.4 processing | S-006 | Direct source comment and return path. | Exact audible failures need testing. |
| C-032 | DOCUMENTED | High | VST2 compatibility header is GPL VeSTige-derived; clean-room/trademark/SDK rights are not granted by format naming. | Licensing boundary | S-005 | Header/license + research contract. | Legal counsel required for product decisions. |
| C-033 | DOCUMENTED | Medium-High | Keyboard, screen-reader/narration support and localization are project goals/features. | Accessibility | S-005, S-008 | README/website. | No independent accessibility audit. |
| C-034 | DOCUMENTED + INFERENCE | High facts / Medium readiness | Current main remains active, still forces VST3 off, has post-alpha theme work and default-on GPL3 build option, but is unreleased. | Main at cutoff | S-001, S-007 | Pinned main code/log. | Theme readiness inferred from changes, not release qualification. |

## 22. Source ledger and adaptive bibliography

- **S-001 — Canonical Codeberg repository metadata.** Tenacity Team, `https://codeberg.org/api/v1/repos/tenacityteam/tenacity`; API metadata; canonical current repository; accessed 2026-08-29. Relevant fields: description, `default_branch: main`, `archived: false`, update timestamp, website, original Saucedacity URL. Supports C-001, C-002, C-034. **Limitation:** mutable metadata and activity do not prove release quality. **Selection rationale:** canonical upstream is preferable to GitHub mirror/search snippets.
- **S-002 — Canonical release collection.** Tenacity Team, `https://codeberg.org/api/v1/repos/tenacityteam/tenacity/releases?limit=20`; release archive; 2021-2026 lineage; accessed 2026-08-29. Relevant entries: v1.3 first stable (“development was restarted using Saucedacity's codebase”), Saucedacity v1.1b2 (Audacity 3.0.4 rebase), and release chronology. Supports C-003. **Limitation:** release-author narrative, not independent history. **Selection rationale:** preserves project-origin wording and dates better than secondary fork histories.
- **S-003 — Tenacity 1.3.5 release.** Tenacity Team, `https://codeberg.org/tenacityteam/tenacity/releases/tag/v1.3.5`; official release notes/assets; stable 1.3.5; accessed 2026-08-29. Relevant sections: New, Changes, Fixes, FFmpeg, Hashes and Verification, Other Notes. Supports C-003, C-011, C-029. **Limitation:** Windows ARM plugins explicitly untested; no plugin matrix. **Selection rationale:** authoritative current-stable platform/security evidence.
- **S-004 — Tenacity 1.4 alpha 1 release.** Tenacity Team, `https://codeberg.org/tenacityteam/tenacity/releases/tag/v1.4-alpha1`; official prerelease notes; accessed 2026-08-29. Relevant sections: rebase on Audacity 3.7.5, networking removals, Known Issues, From Audacity, Way Forward. Supports C-004, C-021, C-023, C-025. **Limitation:** alpha claims do not establish stable behavior and predate current main. **Selection rationale:** direct boundary between inherited/reachable/missing behavior.
- **S-005 — Tenacity 1.3.5 immutable source.** Tenacity Team, commit `52ef74db0a2ee8a9e42be1f4a2ff57d90d6564d7`, `https://codeberg.org/tenacityteam/tenacity/src/commit/52ef74db0a2ee8a9e42be1f4a2ff57d90d6564d7/`; source; stable. Key locations: [`CMakeLists.txt` 600-676](https://codeberg.org/tenacityteam/tenacity/src/commit/52ef74db0a2ee8a9e42be1f4a2ff57d90d6564d7/CMakeLists.txt#L600-L676), [`vcpkg.json` 1-29](https://codeberg.org/tenacityteam/tenacity/src/commit/52ef74db0a2ee8a9e42be1f4a2ff57d90d6564d7/vcpkg.json#L1-L29), [`PluginManager.cpp` 706-729 and 1325-1407](https://codeberg.org/tenacityteam/tenacity/src/commit/52ef74db0a2ee8a9e42be1f4a2ff57d90d6564d7/src/PluginManager.cpp#L706-L729), [`VSTEffect.cpp` 383-489 and 492-737](https://codeberg.org/tenacityteam/tenacity/src/commit/52ef74db0a2ee8a9e42be1f4a2ff57d90d6564d7/src/effects/VST/VSTEffect.cpp#L383-L489), [`LadspaEffect.cpp` 227-389](https://codeberg.org/tenacityteam/tenacity/src/commit/52ef74db0a2ee8a9e42be1f4a2ff57d90d6564d7/src/effects/ladspa/LadspaEffect.cpp#L227-L389), [`LoadLV2.cpp` 124-303](https://codeberg.org/tenacityteam/tenacity/src/commit/52ef74db0a2ee8a9e42be1f4a2ff57d90d6564d7/src/effects/lv2/LoadLV2.cpp#L124-L303), [`Effect.cpp` 1212-1397](https://codeberg.org/tenacityteam/tenacity/src/commit/52ef74db0a2ee8a9e42be1f4a2ff57d90d6564d7/src/effects/Effect.cpp#L1212-L1397), project/SQLite files, and [`aeffectx.h` 1-23](https://codeberg.org/tenacityteam/tenacity/src/commit/52ef74db0a2ee8a9e42be1f4a2ff57d90d6564d7/src/effects/VST/aeffectx.h#L1-L23). Supports C-003, C-006, C-007, C-009, C-010, C-012, C-013, C-014, C-016, C-017, C-018, C-020, C-024, C-025, C-026, C-028, C-030, C-032, C-033. **Limitation:** static review, inherited comments can be stale, official binaries not reproduced. **Selection rationale:** immutable implementation/build origin outranks generic website feature badges.
- **S-006 — Tenacity 1.4 alpha 1 immutable source.** Tenacity Team, commit `5b1ae2ea8daf8648a3cdf118fa05c40ddde64ce4`, `https://codeberg.org/tenacityteam/tenacity/src/commit/5b1ae2ea8daf8648a3cdf118fa05c40ddde64ce4/`; source; alpha. Key locations: [`CMakeLists.txt` 674-759](https://codeberg.org/tenacityteam/tenacity/src/commit/5b1ae2ea8daf8648a3cdf118fa05c40ddde64ce4/CMakeLists.txt#L674-L759), [`AsyncPluginValidator.cpp` 57-63 and 219-232](https://codeberg.org/tenacityteam/tenacity/src/commit/5b1ae2ea8daf8648a3cdf118fa05c40ddde64ce4/libraries/lib-module-manager/AsyncPluginValidator.cpp#L57-L63), [`PluginHost.cpp` 30-74 and 184-205](https://codeberg.org/tenacityteam/tenacity/src/commit/5b1ae2ea8daf8648a3cdf118fa05c40ddde64ce4/libraries/lib-module-manager/PluginHost.cpp#L30-L74), [`PluginStartupRegistration.cpp` 152-207 and 210-315](https://codeberg.org/tenacityteam/tenacity/src/commit/5b1ae2ea8daf8648a3cdf118fa05c40ddde64ce4/src/PluginStartupRegistration.cpp#L152-L207), [`RealtimeEffectState.cpp` 720-827](https://codeberg.org/tenacityteam/tenacity/src/commit/5b1ae2ea8daf8648a3cdf118fa05c40ddde64ce4/libraries/lib-realtime-effects/RealtimeEffectState.cpp#L720-L827), [`RealtimeEffectManager.cpp` 150-177](https://codeberg.org/tenacityteam/tenacity/src/commit/5b1ae2ea8daf8648a3cdf118fa05c40ddde64ce4/libraries/lib-realtime-effects/RealtimeEffectManager.cpp#L150-L177), and missing-plugin dialog. Supports C-019-C-023, C-031. **Limitation:** prerelease source; no dynamic execution. **Selection rationale:** pins the exact rebase-generation behavior instead of importing claims from Audacity documentation.
- **S-007 — Current main immutable snapshot.** Tenacity Team, commit `4fe73061f3cbd4d54e95bebf9a580cee72e7832c`, `https://codeberg.org/tenacityteam/tenacity/src/commit/4fe73061f3cbd4d54e95bebf9a580cee72e7832c/`; source; 2026-08-26. Relevant [`CMakeLists.txt` 701-799](https://codeberg.org/tenacityteam/tenacity/src/commit/4fe73061f3cbd4d54e95bebf9a580cee72e7832c/CMakeLists.txt#L701-L799) and unchanged realtime/plugin modules. Supports C-002, C-023, C-026, C-034. **Limitation:** unreleased and head commit is a translation change. **Selection rationale:** necessary to test whether alpha-known VST3/build gaps had changed by cutoff.
- **S-008 — Tenacity website and immutable 1.3 manual index.** Tenacity Team/Community, rendered `https://tenacityaudio.org/` / `https://tenacityaudio.org/docs/`; manual origin pinned to `1.3.x` commit `63fa9e00c0bf8b733faadc2bf0f4069ff084e022`, [`source/index.md` 29-60](https://codeberg.org/tenacityteam/tenacity-manual/src/commit/63fa9e00c0bf8b733faadc2bf0f4069ff084e022/source/index.md#L29-L60); official site/manual; accessed 2026-08-29. Relevant sections: Features, Getting Correct Version, Welcome, License. Supports C-001, C-005, C-008, C-014, C-026, C-033. **Limitation:** feature summary is not package-specific; the homepage itself remains mutable. **Selection rationale:** official user-facing scope, pinned to its source and cross-checked against application source.
- **S-009 — Effects, Plugins, and Modules.** Tenacity Community, rendered `https://tenacityaudio.org/docs/_content/Effects_Plugins_and_Modules.html`; immutable origin [`source/_content/Effects_Plugins_and_Modules.md` 8-61](https://codeberg.org/tenacityteam/tenacity-manual/src/commit/63fa9e00c0bf8b733faadc2bf0f4069ff084e022/source/_content/Effects_Plugins_and_Modules.md#L8-L61), commit `63fa9e00c0bf8b733faadc2bf0f4069ff084e022`; official stable manual; 1.3.x; accessed 2026-08-29. Relevant sections: Effects, Plugins, Modules; exact list VST2/AU/LV2/LADSPA/Vamp/Nyquist and “VSTi not supported.” Supports C-006, C-014, C-015, C-027, C-028. **Limitation:** no OS/build matrix beyond AU. **Selection rationale:** most explicit supported-format statement.
- **S-010 — Editing Part 1: The Concepts.** Tenacity Community, rendered `https://tenacityaudio.org/docs/_content/Editing_Part_1.html`; immutable origin [`source/_content/Editing_Part_1.md` 6-79](https://codeberg.org/tenacityteam/tenacity-manual/src/commit/63fa9e00c0bf8b733faadc2bf0f4069ff084e022/source/_content/Editing_Part_1.md#L6-L79), commit `63fa9e00c0bf8b733faadc2bf0f4069ff084e022`; stable manual; accessed 2026-08-29. Relevant sections: Clips, Track, Audio/MIDI Tracks, Time Tracks, Selections. Supports C-005, C-012. **Limitation:** conceptual, not implementation detail. **Selection rationale:** primary user-model evidence.
- **S-011 — Importing and Exporting.** Tenacity Community, rendered `https://tenacityaudio.org/docs/_content/Importing_and_Exporting.html`; immutable origin [`source/_content/Importing_and_Exporting.md` 1-122](https://codeberg.org/tenacityteam/tenacity-manual/src/commit/63fa9e00c0bf8b733faadc2bf0f4069ff084e022/source/_content/Importing_and_Exporting.md#L1-L122), commit `63fa9e00c0bf8b733faadc2bf0f4069ff084e022`; stable manual; accessed 2026-08-29. Relevant sections: Audio, Matroska, Raw, Exporting, FFmpeg. Supports C-011. **Limitation:** page contains TODOs and does not enumerate every codec. **Selection rationale:** authoritative workflow/format boundary without inferring from filenames alone.
- **S-012 — Preferences.** Tenacity Community, rendered `https://tenacityaudio.org/docs/_content/Preferences.html`; immutable origin [`source/_content/Preferences.md` 44-617](https://codeberg.org/tenacityteam/tenacity-manual/src/commit/63fa9e00c0bf8b733faadc2bf0f4069ff084e022/source/_content/Preferences.md#L44-L617), commit `63fa9e00c0bf8b733faadc2bf0f4069ff084e022`; stable manual; accessed 2026-08-29. Relevant sections: Devices, Recording, MIDI Devices, Quality, Import/Export, Effects, Modules. Supports C-008-C-015, C-023, C-027. **Limitation:** some MIDI panels are nightly-only and manual may lag packages. **Selection rationale:** captures user-reachable build and behavior qualifications.
- **S-013 — Flathub Tenacity manifest.** Flathub/Tenacity maintainers, commit `c7dae39eca7a4c9f61808340fe4a16df8f8175d1`, `https://github.com/flathub/org.tenacityaudio.Tenacity/blob/c7dae39eca7a4c9f61808340fe4a16df8f8175d1/org.tenacityaudio.Tenacity.yaml`; immutable packaging manifest for tag v1.3.5/commit `52ef...`; accessed 2026-08-29. Relevant sections: `finish-args`, `add-extensions`, LV2/Lilv/Suil modules, Tenacity source and wrapper. Supports C-024, C-026. **Limitation:** Flatpak only; permissions do not prove use. **Selection rationale:** resolves package-specific Linux plugin discovery/privacy better than generic upstream docs.
- **S-014 — GitHub mirror metadata and empty release endpoint.** Tenacity Team mirror, `https://api.github.com/repos/tenacityteam/tenacity` and `https://api.github.com/repos/tenacityteam/tenacity/releases?per_page=10`; mirror metadata/negative release result; accessed 2026-08-29. Relevant fields: mirror description points to Codeberg; GitHub release response `[]`. Supports C-001 and the negative-result record. **Limitation:** mirror timestamps may reflect synchronization and are not canonical release evidence. **Selection rationale:** prevents accidental citation of the wrong upstream.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted method / blocker | Impact | Safest next probe | Required fixture/access | Owner |
| --- | --- | --- | --- | --- | --- |
| Exact format/OS contents of each 1.3.5 binary | Release assets, CMake, vcpkg and Flathub inspected; binaries not executed | Matrix can distinguish source/package but not prove loaded providers | Record About/build-feature report and scan one owned no-op effect per format on each package | Disposable Win/mac/Linux VMs; release hashes; owned plugins | Unassigned qualification team |
| AUv3 support | Manual only says AU; source uses desktop AudioComponent path; no AUv3-specific qualification | Avoids falsely claiming modern AU extensions | Build an owned AUv2 and AUv3 pair; inspect scan/instantiate/process and process boundary | Supported macOS Intel/Apple Silicon, signed fixtures | Unassigned Apple interop owner |
| Runtime crash containment | Static source found scan child but direct runtime instances; no binaries run | Core security/reliability decision | Crash/hang an owned plugin during scan, UI open, offline render and realtime playback; observe host/process recovery | Disposable VMs and deterministic fault plugin | Unassigned security/interop owner |
| Sidechain, multi-output, dynamic I/O and events | Adapter port counts reviewed; no route/UI contract found | Determines DAW-grade host viability | Use owned multi-bus effect/instrument/event fixtures and enumerate host buses | Per-format conformance fixtures | Unassigned plugin-contract owner |
| Automation timing/identity | Command/static settings found; no envelope/timestamp path | Prevents sample-accurate claim | Ramp one parameter, record callback event offsets, save/reopen after reorder/version change | Instrumented owned plugin/project | Unassigned automation owner |
| Latency/tail correctness | Stable VST tail=0; alpha source marks tail TODO; no audio probe | Can truncate reverb/delay and misalign tracks | Impulse fixture with known latency/tail in offline and realtime paths | Owned deterministic effect, loopback comparator | Unassigned audio-engine owner |
| Missing-plugin durability in current main | Alpha/main source path reviewed; dynamic `.aup3` round trip not run | Potential silent state loss | Save project, remove plugin, reopen/resave, restore plugin, compare sound/XML | Disposable main build + owned plugin | Unassigned persistence owner |
| Project migration/corruption behavior | SQLite/autosave/import code inspected; no version corpus or fuzzing | Project durability decision | Open/save a bounded corpus across 1.3.5, alpha/main; inject interrupted writes and missing blocks | Synthetic projects, disposable copies | Unassigned persistence owner |
| UI scaling/headless/accessibility | Adapter UI code and generic manual reviewed; no runtime UI | Affects cross-platform quality/accessibility | Test native/generic editors at DPI scales and no-display render; accessibility-tree audit | GUI/headless VMs, owned editors | Unassigned UI owner |
| Privacy at runtime | Source/manifest reviewed; no packet capture; plugins/codecs can network | Validates privacy positioning | Offline-by-default packet capture during startup/scan/import/export with no third-party network plugins | Disposable VM, local DNS/proxy, owned media | Unassigned privacy owner |

Negative results retained: web search returned HTTP 429 in the initial discovery pass; canonical URLs were then used directly. The GitHub mirror had no releases. A first Flathub manifest request used the wrong `.yml` suffix and returned 404; repository contents identified `.yaml`. Searches found no provider/build path for AAX, CLAP, DSSI, JSFX, DXi, or Rack Extensions, no released VST3 enablement, and no runtime plugin process/bridge.

## 24. Curiosity pass and stop decision

Candidate follow-ups were scored 0-5 on **decision relevance / expected value / novelty / cost** (lower cost is better):

1. **Package-specific plugin reachability (Flathub/Windows manifests): 5/5/4/1 — pursued.** It changed the LV2 matrix and privacy interpretation. [C-024, C-026]
2. **Immutable origin for rendered manual claims: 4/4/2/1 — pursued in the final self-audit loop.** The dedicated `1.3.x` manual branch was pinned at `63fa9e00c0bf8b733faadc2bf0f4069ff084e022`; S-008-S-012 now retain immutable source links.
3. AUv3 dynamic qualification: 5/5/4/5 — `CURIOSITY_NO_GO`; high value but requires binary fixtures/macOS execution outside documentary budget.
4. Runtime crash/latency/tail plugin probes: 5/5/5/5 — `CURIOSITY_NO_GO`; highest next-phase value, but explicitly belongs to disposable interoperability prototypes.
5. Full issue-tracker mining: 3/2/2/4 — `CURIOSITY_NO_GO`; likely anecdotal duplicates after source/release saturation.
6. Every codec/native-effect inventory: 1/1/1/4 — `CURIOSITY_NO_GO`; would not change the architecture decision.
7. Format trademark/SDK legal opinion: 4/3/3/5 — `CURIOSITY_NO_GO`; legal authority absent; route to counsel/format owners.

**Synthesis gaps/contradictions:** generic website language says VST/LV2/AU, while stable manual narrows VST to VST2 and package manifests narrow Windows LV2; source contains VST3 classes while builds force them off; 1.4 has a missing-plugin warning while its writer drops unresolved state; latency compensation exists while tails are explicitly incomplete. These are resolved as scope distinctions, not averaged into one support claim.

**Stop decision:** stop for **coverage plus documentary saturation** after canonical release metadata, three immutable application-source snapshots, an immutable stable-manual snapshot, and immutable Flathub packaging evidence. All required sections/format rows are covered, stable versus prerelease/main is explicit, and remaining high-value questions require dynamic owned-plugin fixtures rather than more web searching. The planned documentary pass budget was reached concurrently with coverage; repeated source paths were duplicative and marginal documentary evidence became nonpositive for the leading conclusions.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created `research/daw-landscape/dossiers/tenacity.md`; repository checks below confirm no other authored workspace edit.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0 distinguishes 1.3.5, 1.4 alpha 1 and current main, packages, desktop OSes, and Audacity exclusion.
- [x] **Every required dossier heading exists in order.** Sections 0-25 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive sections cite C-001-C-034; classifications are in section 21.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Section 21 resolves claims; section 23 gives methods/blockers/probes.
- [x] **Every required plugin-format row is present.** VST2, VST3, AUv2, AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, Rack Extension, and product-native/other are in 11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2-11.6 cover paths, registry, scanners, isolation, buses/events, latency/tails, UI, state and failure.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Claim classes and stable/alpha/main boundaries are explicit.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16; no legal advice or compatibility grant.
- [x] **Bibliography records source rationale and limitations.** Section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Only public text/source was read; no product/plugin binaries or installers were run.

**Checks performed:** heading/row/claim-source review; pinned commit/release verification; stable-vs-alpha/main diff review; package-manifest triangulation; negative provider/build search; final repository status/diff check. **Unresolved blockers:** no dynamic plugin corpus, no AUv3 fixture, no package feature report, no counsel. **Pre-existing workspace changes:** left untouched. **Owned path:** `research/daw-landscape/dossiers/tenacity.md`.
