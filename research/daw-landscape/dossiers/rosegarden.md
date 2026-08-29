# Rosegarden DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Rosegarden |
| Canonical upstream | Rosegarden Development Team / rosegardenmusic.com |
| Researcher/session | `ses_fb274af6effeFC4eBQ0yIzRX7k` |
| Owned path | `research/daw-landscape/dossiers/rosegarden.md` |
| Research date / evidence cutoff | 2026-08-29 UTC |
| Current release | Rosegarden 26.06 “Laura,” released 2026-06-03 |
| Immutable source scope | Tag `26.06`, commit `6c315d2d753cfe83d50ebe40a140973f527bf195` |
| Editions | One upstream desktop application; no feature-tiered editions documented |
| Platforms | Linux only |
| Included | Current upstream 26.06 documentation and source; MIDI, notation, audio, persistence, interchange, control, and native plugin-host paths |
| Excluded | Distro patches; development after the pinned commit; non-Linux ports; third-party plugin/wrapper internals; standalone synth internals; unsafe binary/plugin execution; procurement or legal conclusions |
| Dynamic probes | None; no `OBSERVED` claims |
| Completion | `COMPLETE_WITH_UNKNOWNS` |

**DOCUMENTED — C-001, C-002.** The official release index, release notes, immutable build metadata, and tag metadata agree on the scoped release and Linux-only product boundary. [S-001, S-002, S-003, S-004]

## 1. Executive summary

**DOCUMENTED — C-002, C-003, C-004.** Rosegarden is best understood as a maintained Linux composition environment led by MIDI sequencing and notation, with a linear track/segment arrangement and matrix, score, and event editors. Audio is intentionally described upstream as “basic support,” so Rosegarden is a stronger reference for notation/MIDI integration than for modern cross-platform audio production. [S-001, S-005, S-006, S-007]

**DOCUMENTED — C-005, C-011, C-015, C-017.** Current source uses ALSA for MIDI and JACK for audio. Its native plugin hosts are LADSPA, DSSI, and optional-build LV2. Scanning and DSP execute in Rosegarden’s process; a DSSI custom editor may be a separate `QProcess`, but this does not isolate DSP, while LV2 UIs are instantiated through the host UI path. LV2 support is substantial: Atom MIDI, Patch properties, Worker, presets/state, arbitrary audio-port connections, latency reporting, and frame-offset MIDI delivery are represented. [S-004, S-013, S-014, S-015]

**INFERENCE — C-013, C-014.** The pinned source contains no native VST2, VST3, AUv2, AUv3, AAX, CLAP, JSFX, DirectX/DXi, or Rack Extension host implementation. “VST” appears only as a category for LADSPA/DSSI-presented wrappers. Scoped searches also found no persistent scan cache, quarantine, validator, plugin-process sandbox, architecture bridge, or native rescan workflow. Absence searches are bounded evidence, so those formats are reported as `UNKNOWN/no native implementation found`, not impossible. [S-013]

**DOCUMENTED — C-020, C-021, C-022, C-023, C-025, C-032, C-033.** `.rg` projects are gzipped UTF-8 XML and serialize plugin identity, program, bypass, ports, configuration, and LV2 state. Missing plugins are skipped and reported in a deduplicated warning set rather than retained as active placeholders. Autosave/recovery and `.rgp` collection exist, but generic LV2 asset collection is unproven. WAV export is fixed stereo, JACK-dependent, and captured during playback rather than a documented faster-than-real-time render. Saving a project after loading without available audio can discard audio/plugin data, which is an important durability liability. [S-017, S-018, S-019]

**Confidence:** high for release, platform, open-source implementation paths, current limits, persistence, and native host formats; medium for bounded negative findings; low where only a dynamic interoperability fixture can discriminate. The major unknowns are plugin tails, sample-accurate plugin-parameter automation, suspend, dynamic I/O renegotiation, MPE/MIDI 2.0/UMP, plugin-specific offline behavior, and generic LV2 asset portability. [C-019, C-024, C-031, C-034]

## 2. Product identity, history, and market position

**DOCUMENTED — C-001, C-002.** Rosegarden 26.06 is the current stable upstream release as of the cutoff. Upstream describes it as a Linux music-composition/editing environment based on a MIDI sequencer, with rich notation knowledge and basic digital-audio support, aimed at composers, musicians, students, and small/home studios. [S-001, S-002, S-003]

**DOCUMENTED — C-027.** The source lineage is copyright 2000–2026 and GPL version 2 or later. [S-004, S-021]

**DOCUMENTED — C-029.** The legacy HTML handbook’s revision history ends at 1.7.0 (May 2008) and is therefore retained only as historical lineage—e.g., it dates the first Rosegarden-4 public release to 2001—not as current 26.06 behavior. [S-012]

**INFERENCE — C-028.** The product is actively maintained, but some public prose is not release-versioned. Current source and release metadata take precedence over the tour/FAQ when quantitative or build details conflict. [S-002, S-004, S-008, S-010]

## 3. Workflow and conceptual model

**DOCUMENTED — C-003.** The primary mental model is a linear composition containing tracks and time-positioned segments. A track is connected through an Instrument to a MIDI device, audio instrument, or soft-synth instrument. Users arrange segments in the main view and open matrix (piano-roll), notation, or event editors; real-time, step, computer-keyboard, and mouse note entry are documented. [S-005, S-006, S-016]

**DOCUMENTED — C-004.** Notation is not merely a rendering of Standard MIDI File data: the notation model stores presentation/structure beyond MIDI, and notation quantization can tidy score representation while retaining original performance timing. This dual representation is Rosegarden’s most decision-relevant differentiator. [S-007]

**DOCUMENTED — C-003, C-008.** The “Studio” stores MIDI devices, banks, programs, controllers, and connections. Controller/velocity/pitch-bend/pressure rulers expose MIDI-event editing alongside tempo, meter, markers, loops, and transport synchronization. [S-006, S-020]

**UNKNOWN — C-034.** No scene launcher, tracker, take-lane/comping model, clip-warping contract, or post-production conform model was established. The safe interpretation is a linear arranger with MIDI/audio segments, not a clip-launching or post workstation. [S-005, S-013]

## 4. Publicly documented architecture

**DOCUMENTED — C-005.** The 26.06 application is open C++/Qt source. `SoundDriverFactory` chooses `AlsaDriver` when available and falls back to `DummyDriver`; the latter explicitly permits no-sound operation so the GUI remains usable for notation. `AlsaDriver` owns the JACK audio-driver integration. Qt 5 is the default build, with Qt 6 enabled by `USE_QT6`. [S-004, S-014]

**DOCUMENTED — C-006.** Audio uses float sample buffers, JACK callbacks, ring buffers, and dedicated pthread-based reader/writer/mixer work with attempted FIFO scheduling and a normal-scheduling fallback. Plugins receive a block start time and fixed-size host buffers through the common `RunnablePluginInstance` interface. [S-014]

**DOCUMENTED — C-012, C-015.** Plugin enumeration starts on a `QThread`, but remains inside the application process. Factories discover and load LADSPA/DSSI shared libraries or query a Lilv world for LV2; the audio mixer constructs plugin objects and calls their `run()` methods directly. [S-013, S-014, S-015]

**UNKNOWN — C-019.** A complete scheduling graph, multicore policy, real-time safety proof, lock-freedom audit, and plugin-specific thread contract were not established. Source comments identify both intended RT-safe paths and known locking/crash concerns, so no stronger guarantee is warranted. [S-014, S-015]

## 5. Audio engine

**DOCUMENTED — C-005, C-006.** JACK supplies the audio callback, sample rate, block size, physical/application routing, transport, xrun reporting, and audio availability boundary. Audio files, synths, and insert plugins are mixed in float blocks; underrun/failure codes exist for disk, instrument, and bus paths. [S-004, S-014, S-020]

**DOCUMENTED — C-007.** Current model limits are 16 audio instruments, 24 soft-synth instruments, five non-synth inserts per plugin container, and at most 16 total buses including bus 0/master. The mixer UI offers 0/2/4/8 submasters, while the model accepts a total bus count through 16; wording that treats the model clamp as 16 submasters would be off by one. [S-016]

**DOCUMENTED — C-018.** LADSPA, DSSI, and LV2 latency output ports named `latency` or `_latency` contribute to per-instrument totals. Rosegarden combines plugin/JACK latency, computes a maximum path latency, and shifts sequenced event times by the per-path difference. [S-014, S-015]

**DOCUMENTED — C-025.** WAV export creates two channels at the active sequencer sample rate and receives left/right samples from the JACK-generated mix during play/stop export. It excludes external physical/standalone synth audio unless separately routed/captured outside this exporter. [S-019]

**UNKNOWN — C-019.** Engine precision beyond float processing, oversampling, plugin tails, freeze, faster-than-real-time bounce, deterministic offline rendering, multicore plugin scheduling, and a formal dropout-recovery policy remain unproven. [S-014, S-019]

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED — C-003, C-009.** Tracks contain or reference time-positioned MIDI or audio segments. The official tour documents creating, moving, resizing, snapping, repeating, splitting, transposing, and quantizing segments, with common matrix/notation/event-editor interaction and undo/redo. [S-005, S-008]

**INFERENCE — C-036.** Audio arrangement edits are predominantly non-destructive because segments reference files and derived time-stretched files are created separately; destructive file deletion is an explicit, warned operation. This does not prove a modern elastic-audio/warp system. [S-019]

**UNKNOWN — C-034.** Takes, lanes, comping, ripple modes, edit groups, playlists, clip envelopes, and a formal version-history model beyond command undo were not established. A later probe should not equate loop recording with comping without a saved-project fixture. [S-005, S-017]

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED — C-004, C-008.** Rosegarden supports MIDI recording/editing, matrix and event views, score editing/printing, controller rulers, velocity, pitch bend, channel pressure, key pressure, SysEx handling, named device banks/programs, MIDI Clock, MMC, MTC, and JACK transport integration. ALSA sequencer infrastructure supplies MIDI I/O and scheduling. [S-006, S-007, S-010, S-020]

**DOCUMENTED — C-010.** Standard MIDI File and MusicXML import/export are wired into current application actions; LilyPond export/preview/print is the principal high-quality notation-delivery path. [S-019]

**UNKNOWN — C-019.** Scoped source searches found no exact implementation tokens for MPE, MIDI 2.0, or UMP. Per-note expression semantics, profiles/property exchange, and MIDI-CI therefore remain unknown rather than unsupported. [S-013]

## 8. Routing, mixer, automation, and control

**DOCUMENTED — C-007.** Audio instruments can take record-input or submaster input, route to master/submasters, expose mono/stereo handling, and host five pre-fader inserts; buses are plugin containers too. JACK can expose fader and submaster outputs. LV2 adds explicit connections between plugin audio ports and instrument/channel buffers, enabling sidechain-like and extra-output mappings. [S-015, S-016]

**DOCUMENTED — C-008.** MIDI control rulers edit controller, velocity, pitch-bend, and pressure events. The external-controller port supports Rosegarden-native mappings plus explicit Korg nanoKONTROL2 and Akai MPK mini IV handlers. TranzPort is disabled by default in 26.06 and marked for possible removal; LIRC is optional. [S-002, S-004, S-020]

**UNKNOWN — C-019.** A sample-accurate timeline automation contract for audio/plugin parameters was not found. Port values and LV2 Patch parameters can be set and serialized, but this does not establish timestamped automation, touch/latch/write modes, parameter text conversion, VCAs, feedback routing, surround, or immersive buses. [S-015, S-020]

## 9. Recording, comping, and media handling

**DOCUMENTED — C-009.** MIDI and audio recording are present; JACK defines recorded WAV sample rate, and audio may be arranged alongside MIDI. The audio manager’s current UI admits WAV directly and, when its importer helper is available, lists FLAC, Ogg, and MP3 conversion/import paths. Missing audio triggers a locate/adjust-audio-path workflow. [S-008, S-010, S-019]

**DOCUMENTED — C-023.** Autosave is disabled while playing or recording, and recovery prompts distinguish saved and untitled projects. Existing project saves are staged through a temporary file before replacing the target. [S-017, S-018]

**UNKNOWN — C-034.** Punch/loop details, take retention, comping, proxies, conform, video, rich media metadata, and embedded asset relinking were not qualified. No exact source token for a video workflow was found in the scoped search. [S-013, S-019]

## 10. Instruments, effects, content, and native devices

**DOCUMENTED — C-011.** Rosegarden hosts DSSI/LV2 instruments and LADSPA/DSSI/LV2 effects and can drive standalone ALSA MIDI synths. The same mixer/insert architecture applies to soft-synth instruments. [S-004, S-009, S-013]

**INFERENCE — C-026.** No product-native DSP/device format comparable to a proprietary rack was found. Bundled device definitions, presets, notation resources, and controller mappings are content/configuration rather than a native binary plugin SDK. [S-004, S-013]

**UNKNOWN — C-034.** A current inventory of bundled synthesis, sampling, modulation, macro, or rack devices was not established because no native-device architecture was evidenced and inventory would not change the decision. [S-004]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

Non-Linux cells are `NOT_APPLICABLE` because the scoped product is Linux-only. “No native implementation found” is a bounded source inference, not proof that a third-party wrapper can never expose the format through LADSPA/DSSI. [C-002, C-014]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `UNKNOWN` | `NOT_APPLICABLE:desktop-only` | 26.06 source | **INFERENCE:** no native VST2 host found; names ending “ VST” are only categorized when already presented via LADSPA/DSSI wrappers | C-014; S-013 |
| VST3 | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `UNKNOWN` | `NOT_APPLICABLE:desktop-only` | 26.06 source | **INFERENCE:** no native implementation/dependency found | C-014; S-013 |
| AUv2 | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Apple format/Linux product` | `NOT_APPLICABLE:desktop-only` | Product/platform scope | No native implementation expected or found | C-002, C-014; S-004, S-013 |
| AUv3 | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Apple format/Linux product` | `NOT_APPLICABLE:desktop-only` | Product/platform scope | No native implementation expected or found | C-002, C-014; S-004, S-013 |
| AAX | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `UNKNOWN` | `NOT_APPLICABLE:desktop-only` | 26.06 source | **INFERENCE:** no native implementation/dependency found | C-014; S-013 |
| CLAP | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `UNKNOWN` | `NOT_APPLICABLE:desktop-only` | 26.06 source | **INFERENCE:** no native implementation/dependency found | C-014; S-013 |
| LV2 | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `DOCUMENTED` | `NOT_APPLICABLE:desktop-only` | 26.06; optional build, LV2 ≥1.18/Lilv | Native effects/instruments; deep state, UI, Atom, Patch, Worker, latency and audio-port support | C-011, C-017; S-004, S-011, S-015 |
| LADSPA | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `DOCUMENTED` | `NOT_APPLICABLE:desktop-only` | 26.06 required build dependency | Native effects; shared-library discovery and generic controls | C-011, C-012; S-004, S-013 |
| DSSI | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `DOCUMENTED` | `NOT_APPLICABLE:desktop-only` | 26.06 required build dependency | Native instruments/effects; MIDI/program/configuration and optional external editor | C-011, C-015; S-004, S-013, S-014 |
| JSFX | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `UNKNOWN` | `NOT_APPLICABLE:desktop-only` | 26.06 source | **INFERENCE:** no native implementation found | C-014; S-013 |
| DirectX/DXi | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Windows format/Linux product` | `NOT_APPLICABLE:desktop-only` | Product/platform scope | No native implementation expected or found | C-002, C-014; S-004, S-013 |
| Rack Extension | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `UNKNOWN` | `NOT_APPLICABLE:desktop-only` | 26.06 source | **INFERENCE:** no native implementation found | C-014; S-013 |
| Product-native/other | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:Linux-only` | `NOT_APPLICABLE:no product-native plugin format documented` | `NOT_APPLICABLE:desktop-only` | 26.06 source | Standalone ALSA synths are external MIDI applications, not native plugins | C-026; S-004, S-009, S-013 |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED — C-012.** `AudioPluginManager` starts an enumeration `QThread`. DSSI is queried before LADSPA to suppress duplicate dual-interface plugins. LADSPA and DSSI honor `LADSPA_PATH`/`DSSI_PATH` or Linux default/user directories, load `*.so` descriptors, and build identifiers from type, library path, and label. A basename/label similarity fallback supports moved libraries. LV2 delegates world loading/discovery to Lilv and uses plugin URIs as identity. [S-013, S-015]

**DOCUMENTED — C-012.** `ROSEGARDEN_PLUGIN_BLACKLIST` is a regular expression matched against LADSPA/DSSI library paths before loading. Load/descriptor failures are printed with the candidate path; flushing the path before `dlopen` helps identify the last plugin before a scan crash. [S-013]

**INFERENCE — C-013.** No persistent scan cache, quarantine database, validation subprocess, architecture bridge, or user-facing rescan implementation was found in the pinned tree. The DSSI “program cache” is per-instance program enumeration, not a persistent scan cache. [S-013]

### 11.3 Runtime isolation and compatibility

**DOCUMENTED — C-015.** Scan-time `dlopen`, plugin construction, and DSP `run()` calls occur in the Rosegarden process. A `QThread` is not a crash-containment process, so a plugin fault can terminate the host. No DSP sandbox or per-plugin process is represented. [S-013, S-014]

**DOCUMENTED — C-015.** A DSSI custom GUI executable is found beside the plugin and launched with `QProcess`, communicating via OSC. That boundary isolates the editor executable only. LV2 UI descriptors are instantiated by the host and may be embedded/contained as Qt/GTK2/external UI widgets; the host supplies parent, resize, options, scale-factor, URID, idle, and external-UI features. [S-014, S-015]

**UNKNOWN — C-019.** Architecture bridging, code-signing/notarization enforcement, compatibility modes, per-plugin permissions, and recovery after a DSP crash are not documented. [S-013, S-014]

### 11.4 Host/plugin processing contract

**DOCUMENTED — C-016.** The common host contract is fixed-block float audio with explicit input/output buffers, control ports, program selection, configuration, bypass, latency, silence, optional MIDI/event delivery, and optional plugin-generated audio sources. Inserts are serial and pre-fader; mono/stereo adaptation duplicates or combines channels under documented source rules. [S-013, S-014]

**DOCUMENTED — C-017.** LV2 recognizes audio, control, and Atom ports; marks Atom MIDI/Patch support; delivers MIDI with frame offsets inside the current block; supplies bounded/nominal/min/max block options; invokes Worker response/end-run; and persists arbitrary extra audio-port connections. This supports instruments, effects, sidechain-like input, and extra/multi-output routing within Rosegarden’s instrument/channel model. [S-015]

**DOCUMENTED — C-018.** LADSPA/DSSI/LV2 latency ports feed path compensation. Bypass state is host-managed; LV2 `silence()` deactivates/reactivates the instance. [S-014, S-015]

**UNKNOWN — C-019.** Tail reporting, formal suspend semantics, dynamic port renegotiation, sample-accurate control-parameter automation, note expression/MPE, MIDI 2.0 events, and a plugin-specific offline-render contract were not established. [S-013, S-015]

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED — C-016, C-020.** LADSPA/DSSI descriptors provide port identity, names, ranges, defaults, and display hints. Projects serialize the structured plugin identifier, label, bypass, program, changed control-port values, and configuration key/value pairs. DSSI configuration is opaque to the project layer. [S-013, S-017]

**DOCUMENTED — C-017, C-020.** LV2 adds URI identity, control ranges/hints, Patch-readable/writable typed properties, preset discovery/load/save, Lilv state capture/restore, and serialized audio-port connections/parameter values. State is converted to a string, base64-encoded, and stored as plugin configuration in `.rg`. [S-015, S-017]

**DOCUMENTED — C-021.** During load, a missing plugin is skipped. Its human-readable label is added to a `std::set` for deduplicated warnings; no active placeholder instance retains its slot/state. Old numeric LADSPA IDs and an LV2 compatibility marker are migration aids, but not a missing-plugin preservation model. [S-013, S-017]

**UNKNOWN — C-024.** Whether every plugin’s external state assets survive save/package/move is unknown. Generic LV2 state can contain path assets, while `.rgp` collection recognizes referenced audio and `configure key="load"` assets; no general Lilv asset-copy integration was found. [S-015, S-018]

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED — C-015.** Generic host controls are available without a custom plugin editor. DSSI editors can detach into their own process; LV2 UI support includes scaling, resize, idle, GTK2 containment, and external UI. The 26.06 release specifically improved GTK2 handling and disables the Editor button when JACK is unavailable. [S-002, S-009, S-014, S-015]

**DOCUMENTED — C-012, C-021, C-033.** Diagnostics include candidate-path scan output, `dlopen`/descriptor/instantiate warnings, missing-plugin aggregation, JACK availability messages, buffer overflow/underrun/xrun paths, and a warning that resaving after no-audio load can lose audio/plugin state. [S-013, S-014, S-017, S-019]

**UNKNOWN — C-019.** UI behavior under plugin hangs, DPI combinations, headless server operation, deterministic crash recovery, and automatic quarantine/restart were not dynamically tested. [S-014, S-015]

## 12. Extensibility and integration

**DOCUMENTED — C-037.** Public extension boundaries include the open GPL source, LADSPA/DSSI/LV2 plugin APIs, Rosegarden device (`.rgd`) files for MIDI bank/program definitions, MIDI control surfaces, optional LIRC, JACK routing/transport, ALSA MIDI, and file interchange. [S-004, S-006, S-009, S-011, S-020, S-021]

**INFERENCE — C-026.** No stable general-purpose scripting language, macro SDK, application plugin ABI, or remote-control API was found. OSC is used for DSSI editor communication, not evidenced as a supported general automation API. Open C++ source is adaptable but is not itself a versioned extension contract. [S-013, S-014]

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED — C-022.** `.rg` is gzipped UTF-8 XML with explicit application and `1.7.0` file-format fields. It stores composition/tracks/segments/events, studio/devices/instruments/buses, audio references, configuration, appearance, and plugin state. Overwrites are first written to a neighboring temporary file; the old file is then removed and the temporary file renamed, reducing partial-write risk but not proving fully atomic replacement. [S-017]

**DOCUMENTED — C-023.** Autosave defaults to 60 seconds in the document path, writes only after modification, and is suppressed while playing/recording. Startup/open recovery can offer a newer autosave for named or untitled work. Undo/history is command-based; normal saves mark the document-saved point. [S-017, S-018]

**DOCUMENTED — C-021, C-033.** Missing audio can invoke a locate/rebase workflow. Missing plugins are warnings and skipped rather than preserved placeholders. Loading without JACK/audio and then resaving can lose active audio/plugin data, so degraded-mode editing is not persistence-safe. [S-017, S-019]

**DOCUMENTED — C-032.** `.rgp` packages collect audio referenced by audio segments, rewrite project audio paths, collect plugin `load` configuration files, optionally accept extra files, and use tar/gzip plus FLAC/WavPack tooling. The line-oriented XML rewriting is narrow and does not establish generic LV2 asset portability. [S-018]

**DOCUMENTED — C-010.** Current source provides MIDI and MusicXML import/export, `.rgp` import/export, and LilyPond, Csound, Mup, and WAV export. [S-019]

**INFERENCE — C-030.** Scoped exact-token searches found no AAF, OMF, ADM, DAWproject, or cloud-collaboration/version-control implementation in 26.06. Stems, backward/forward compatibility guarantees, and collaborative merge semantics remain undocumented. [S-013]

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED — C-004, C-010, C-025.** Specialized strengths are score preparation through LilyPond, MIDI/MusicXML interchange, and JACK-connected Linux workflows. WAV delivery is a stereo playback capture that requires JACK and includes Rosegarden audio and synth-plugin tracks. [S-007, S-009, S-019]

**INFERENCE — C-030.** No native loudness-delivery, DDP, video/ADR, surround/immersive, ADM, broadcast conform, or show-control contract was found. Generic occurrences of “loudness” in panning math were rejected as false positives. [S-013]

**UNKNOWN — C-019.** Batch export, stem export, true offline render, render tails, and live-performance failover remain unqualified. JACK can route Rosegarden into other Linux tools, but external composition of tools is not equivalent to native delivery support. [S-009, S-019]

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED — C-006, C-007.** Performance mechanisms include JACK callbacks, read-ahead/ring buffers, background audio threads, optional FIFO scheduling, path-latency compensation, dormant/empty instrument handling, and underrun/xrun diagnostics. Current fixed resource limits are explicit in section 5. [S-014, S-016, S-020]

**DOCUMENTED/INFERENCE — C-013, C-015.** The dominant plugin trust boundary is weak: discovery calls `dlopen` and DSP executes in-process. A regex blacklist can avoid known files, and a separate DSSI editor can protect the host from some editor failures, but there is no evidenced DSP crash containment or quarantine. [S-013, S-014]

**DOCUMENTED — C-035.** Qt translation infrastructure is present, and the current FAQ names English plus recently available Polish, German, and French translations. [S-004, S-010]

**UNKNOWN — C-031.** Formal accessibility conformance, screen-reader semantics, keyboard-only completion, high-contrast qualification, telemetry/privacy policy, signed-update/rollback model, supply-chain verification, and supported hardware maxima were not established. No exact signing/notarization/telemetry implementation token was found in the scoped source search. [S-013]

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED — C-027.** Rosegarden source headers grant GPL version 2 or later; `COPYING` contains GPLv2. This is a copyleft source license and requires legal review before code reuse in a differently licensed product. This dossier gives no legal advice. [S-004, S-021]

**DOCUMENTED — C-005, C-011.** Ecosystem dependencies are Linux, Qt, ALSA, JACK/PipeWire-JACK compatibility, LADSPA, DSSI/liblo/LRDF, and optional LV2/Lilv; LilyPond and packaging/audio conversion tools support surrounding workflows. Qt 5 is the default build despite the FAQ’s Qt 6 wording. [S-004, S-010, S-011]

**INFERENCE — C-014, C-026.** Because no native VST/AU/AAX/CLAP host is in scope, their SDK, trademark, signing, redistribution, and certification obligations were not analyzed. Naming a format or receiving it through a wrapper would not grant native compatibility or licensing rights. [S-013]

**Clean-room boundary.** Only public documentation and public immutable source were inspected. No proprietary binary was decompiled, no installer/plugin was run, and no protected UI/manual/source expression should be copied into a new implementation; transferable patterns below are abstract mechanisms only. [C-027]

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED — C-003, C-004:** unusually coherent composition model across MIDI performance, matrix editing, and notation, including separate notation/performance timing. [S-005, S-007]
- **DOCUMENTED — C-005:** a deliberate no-sound fallback keeps notation editing available when the sound stack fails. [S-014]
- **DOCUMENTED — C-017, C-018:** LV2 support goes beyond enumeration to state, UI, Worker, Patch, events, connections, and delay compensation. [S-015]
- **DOCUMENTED — C-022, C-023:** inspectable compressed XML, staged saving, autosave, and recovery provide understandable durability mechanisms. [S-017, S-018]
- **DOCUMENTED — C-008, C-010:** strong Linux MIDI synchronization, named devices, score export, and open interchange relative to the product’s focus. [S-006, S-019, S-020]

### Liabilities

- **DOCUMENTED/INFERENCE — C-013, C-015:** plugin scan and DSP faults share the host process; the blacklist is preventive configuration, not containment. [S-013, S-014]
- **DOCUMENTED — C-021, C-033:** missing plugins are discarded from the active model, and no-audio resave can discard dependencies rather than preserve opaque placeholders. [S-017]
- **DOCUMENTED/UNKNOWN — C-032, C-024:** `.rgp` collection is useful but asset handling is narrow; generic LV2 state portability is unproven. [S-018]
- **DOCUMENTED — C-007, C-025:** fixed instrument/insert limits and real-time stereo export constrain larger production workflows. [S-016, S-019]
- **INFERENCE — C-014, C-030:** narrow host-format and delivery breadth makes Rosegarden a poor direct reference for a cross-platform commercial DAW’s interoperability surface. [S-013]

**Architecture lesson.** Rosegarden is a valuable clean-room reference for notation/MIDI dual representation, Linux graph integration, explicit plugin abstractions, and transparent persistence. Its scan isolation, dependency preservation, asset collection, and render pipeline should not be adopted unchanged. [C-004, C-013, C-021, C-024, C-025]

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites | Tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Preserve expressive score without damaging performance | Store performance timing and notation/display timing as related but distinct properties; quantize notation view independently | C-004 | Event IDs, reversible transforms, notation model | Consistency rules and edit propagation are complex; do not copy Rosegarden data structures | `CANDIDATE` |
| Keep editing available when hardware/audio is absent | Capability-oriented dummy engine that preserves the complete project model while disabling playback | C-005, C-033 | Strict model/engine separation | Rosegarden’s resave-loss behavior must be corrected with opaque dependency retention | `CONDITIONAL` |
| Normalize multiple plugin APIs | Small runtime interface for block run, ports, events, state, bypass, and latency, with per-format adapters | C-011, C-016, C-017 | Versioned host contracts and conformance fixtures | Lowest-common-denominator pressure; must add isolation and richer bus/event contracts | `CONDITIONAL` |
| Compensate heterogeneous processing paths | Aggregate latency per serial/path node, compute graph maximum, shift source events/audio by path deficit | C-018 | Stable graph, latency-change notifications | Dynamic latency and feedback graphs need stronger algorithms | `CANDIDATE` |
| Make projects inspectable and recoverable | Versioned text model inside compression, temp-file staging, autosave identity, recovery prompts | C-022, C-023 | Schema migration and durable filesystem API | Compression obscures diffs; Rosegarden’s remove-then-rename is not fully atomic | `CANDIDATE` |
| Support custom plugin UI without making UI mandatory | Generic host controls plus optional external/embedded custom UI adapters | C-015 | Parameter/state separation from UI | Separate UI process does not contain DSP; toolkit bridges add risk | `CONDITIONAL` |
| Move projects with external assets | Traverse typed asset references into a manifest; rewrite only via parsed schema/state APIs | C-024, C-032 | Format-aware asset contracts, hashing, collision policy | Rosegarden’s string matching is an anti-pattern; generic plugin assets remain hard | `CONDITIONAL` |

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected mechanisms

- **REJECT — in-process scan/DSP as the only plugin mode (C-013, C-015):** failure containment is inadequate for a broad third-party ecosystem. Reopen only if a deliberately trusted low-latency mode accompanies a safer default. [S-013, S-014]
- **REJECT — skip missing plugins without opaque placeholders (C-021):** it weakens project durability and round-trip migration. Reopen only for an explicit destructive “clean dependencies” command. [S-017]
- **REJECT — line-oriented XML asset rewriting (C-024, C-032):** brittle, key-specific collection cannot establish complete portability. Use schema-aware manifests and plugin-state asset callbacks. [S-018]
- **REJECT — equating wrapper taxonomy with native format support (C-014):** a LADSPA/DSSI plugin whose name ends in “ VST” does not prove a VST host contract. [S-013]
- **REJECT — fixed stereo real-time playback capture as the sole render architecture (C-025):** it cannot represent stems, arbitrary channel layouts, deterministic offline rendering, or external-tail policy. [S-019]

### `CURIOSITY_NO_GO` threads

- `CURIOSITY_NO_GO` — third-party VST-wrapper internals: outside the native Rosegarden boundary; high licensing/variant cost and cannot prove a native contract. Reopen for a separately scoped wrapper dossier.
- `CURIOSITY_NO_GO` — distro-specific patches and development branches: would weaken the pinned 26.06 comparison. Reopen for deployment qualification on a named distribution.
- `CURIOSITY_NO_GO` — feature claims from the 2008 handbook: superseded and explicitly historical. Reopen only for lineage research.
- `CURIOSITY_NO_GO` — plugin crash anecdotes/community reports: dynamic behavior needs controlled fixtures, not untriangulated reports. Reopen in a disposable plugin-crash harness.
- `CURIOSITY_NO_GO` — legal deep dive on VST/AAX/AU: no native host implementation was found, so it cannot change this product conclusion. Reopen if product scope adds those formats.
- `CURIOSITY_NO_GO` — exhaustive bundled preset/instrument inventory: low architecture novelty and no native-device contract was found.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and counterevidence search | Result | Later discriminating probe |
| --- | --- | --- | --- |
| H1: 26.06 is current and maintained | Official home/source/release pages plus immutable tag/build version | **Supported** (C-001) | None needed for cutoff |
| H2: Rosegarden is cross-platform because it uses Qt | Check official platform statement and ALSA/JACK build paths | **Falsified**; Linux-only (C-002, C-005) | Attempt only in a separate port-feasibility study |
| H3: Native plugin support extends beyond LADSPA/DSSI/LV2 | Search factories, build dependencies, class/symbol names, UI, serialization, and required format tokens | **Not supported; bounded negative** (C-011, C-014) | Build-format conformance fixture if a hidden adapter is alleged |
| H4: Enumeration on `QThread` sandboxes scan crashes | Trace process creation and `dlopen` path | **Falsified**; thread only, same process (C-012, C-015) | Crash-on-descriptor plugin in disposable VM |
| H5: Separate DSSI GUI implies separate DSP | Trace DSSI instance construction/run and GUI `QProcess` | **Falsified**; editor only is separate (C-015) | Process-tree and crash probes |
| H6: LV2 support is only format enumeration | Trace ports/events/state/preset/Worker/UI/latency/connection code | **Falsified**; deep contract exists (C-017, C-018) | LV2 conformance suite for correctness |
| H7: Missing plugins are preserved as placeholders | Trace XML load when identifier lookup fails | **Falsified**; skipped with deduplicated warning (C-021) | Save/reopen missing-plugin fixture to quantify loss |
| H8: WAV export is an offline render | Trace UI prerequisites and exporter sample path | **Falsified**; JACK/playback-controlled fixed stereo capture (C-025) | Wall-clock comparison and tail fixture |
| H9: Public documentation is internally current | Compare FAQ/tour statements with 26.06 CMake/model constants | **Falsified in part**; Qt and limits conflict (C-028) | None; prefer immutable source |
| H10: `.rgp` generically collects LV2 assets | Trace packager asset discovery and Lilv state save paths | **Unresolved/negative evidence**; only audio and `load` assets are explicit (C-024) | LV2 state plugin with external sample, package/move/reopen |

The checks distinguish **format accepted**, **plugin discovered**, **plugin instantiated**, and **full host contract**: source proves discovery and direct instantiation for three formats, while full interoperability remains plugin/feature-specific and requires dynamic fixtures. [C-011, C-012, C-016, C-017, C-019]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | `DOCUMENTED` | High | Current stable release is 26.06 “Laura,” released 2026-06-03; pinned commit/tag is `6c315d…` / `26.06` | Upstream at cutoff | S-001, S-002, S-003, S-004 | Official pages, CMake, CHANGELOG, and immutable tag agree | Local tag metadata is not a runtime probe |
| C-002 | `DOCUMENTED` | High | Rosegarden is Linux-only, MIDI/notation-led, with basic audio and one upstream edition | 26.06 family | S-001, S-004, S-010 | Official identity/platform statements | Future ports excluded |
| C-003 | `DOCUMENTED` | High | Linear track/segment arranger with matrix, notation, and event editors and multiple MIDI entry modes | User workflow | S-005, S-006, S-016 | Tour plus source model | Tour is unversioned; only qualitative claims retained |
| C-004 | `DOCUMENTED` | High | Notation stores structure/presentation beyond MIDI and can quantize notation without losing performance timing | Notation model | S-007 | Direct official statement | Exact internal representation not independently tested |
| C-005 | `DOCUMENTED` | High | ALSA provides MIDI, JACK audio, and DummyDriver enables no-sound notation GUI operation | 26.06 build/runtime architecture | S-004, S-009, S-010, S-011, S-014, S-020 | CMake, README, official integration/dependency context, and factory/runtime source | PipeWire-JACK behavior not dynamically tested |
| C-006 | `DOCUMENTED` | Medium | Engine paths use float blocks, JACK callback/ring buffers, and pthread audio work with attempted FIFO scheduling | 26.06 source | S-014, S-020 | Direct types/calls | No full RT-safety or multicore proof |
| C-007 | `DOCUMENTED` | High | 16 audio instruments, 24 soft synths, five inserts, and 16 total buses including master; UI offers up to eight submasters | 26.06 source | S-016 | Current constants and mixer actions | Model/UI maximum wording differs |
| C-008 | `DOCUMENTED` | High | MIDI device studio, controller rulers, MIDI Clock/MMC/MTC/JACK sync, and named control-surface handlers exist | 26.06 | S-002, S-006, S-020 | Release notes, official tour, and source | Hardware interoperability untested |
| C-009 | `DOCUMENTED` | Medium | MIDI/audio recording and segment arrangement exist; audio references support missing-file location and derived processing | 26.06 | S-008, S-019 | Tour and source | Takes/comping/warp remain unknown |
| C-010 | `DOCUMENTED` | High | MIDI and MusicXML import/export plus LilyPond, Csound, Mup, WAV, and `.rgp` pathways exist | 26.06 | S-002, S-007, S-019 | Official notation workflow and current actions/classes | Round-trip fidelity not measured |
| C-011 | `DOCUMENTED` | High | Native hosts are LADSPA, DSSI, and optional-build LV2 | 26.06 Linux | S-002, S-004, S-009, S-011, S-013 | Release notes, official synth workflow, factories, and build dependencies | Wrappers are outside native boundary |
| C-012 | `DOCUMENTED` | High | Same-process QThread enumeration; LADSPA/DSSI paths, regex blacklist, descriptors, structured identities; Lilv/URI LV2 discovery | 26.06 | S-013, S-015 | Direct discovery code | Lilv’s own external cache behavior is outside host evidence |
| C-013 | `INFERENCE` | Medium-high | No Rosegarden persistent scan cache, quarantine, validation process, DSP sandbox, architecture bridge, or rescan UX was found | Pinned source search | S-013 | Scoped symbol/path search and direct lifecycle trace | Absence is bounded; external Lilv/distro facilities possible |
| C-014 | `INFERENCE` | High | No native VST2/VST3/AU/AAX/CLAP/JSFX/DXi/Rack Extension implementation was found; VST taxonomy is indirect wrapper categorization | Pinned source search | S-013 | Exact token/class/dependency searches plus complete factory set | Cannot exclude external wrappers |
| C-015 | `DOCUMENTED` | High | Plugin DSP is in-process; DSSI custom GUI may be a separate process; LV2 UI loads through host UI code | 26.06 | S-002, S-009, S-013, S-014, S-015 | Release/UI context plus direct construction/run/QProcess/UI instantiate paths | GTK toolkit module separation is not process isolation |
| C-016 | `DOCUMENTED` | High | Common host contract includes block audio, ports, programs/config, bypass, latency, silence, and optional events/audio sources | 26.06 | S-013, S-014 | Runtime interface and adapters | Per-format completeness varies |
| C-017 | `DOCUMENTED` | High | LV2 supports state/presets, Patch parameters, Atom MIDI, Worker, extra audio-port connections, UI features, and frame offsets | 26.06 optional LV2 build | S-015 | Direct LV2 database/instance/UI paths | Not a conformance test of every plugin |
| C-018 | `DOCUMENTED` | High | Plugin latency is aggregated into path latency and sequenced events are shifted by maximum-path deficit | 26.06 | S-014, S-015 | Latency ports, mixer aggregation, sequencer shift | Dynamic latency-change timing untested |
| C-019 | `UNKNOWN` | Low | Tails, sample-accurate plugin-parameter automation, suspend, dynamic I/O, MPE/MIDI 2/UMP, and plugin-specific offline behavior are unresolved | 26.06 host contract | S-013, S-015, S-019 | Targeted searches and source trace did not establish contracts | Needs dynamic/spec fixtures |
| C-020 | `DOCUMENTED` | High | Projects serialize plugin identifier, label, bypass, program, ports/config; LV2 also stores state, parameters, and connections | `.rg` 26.06 | S-015, S-017 | XML serialization and LV2 save code | External assets are separate |
| C-021 | `DOCUMENTED` | High | Missing plugins are skipped and deduplicated for warning, not retained as active placeholders | `.rg` load | S-017 | Explicit loader branch and set | Later resave loss needs dynamic quantification |
| C-022 | `DOCUMENTED` | High | `.rg` is gzipped UTF-8 versioned XML; overwrite uses temp-write, remove, rename | 26.06 project | S-010, S-017 | FAQ plus source | Remove-then-rename is not proven atomic |
| C-023 | `DOCUMENTED` | High | Autosave defaults to 60 seconds, skips play/record, and supports named/untitled recovery prompts | 26.06 | S-017, S-018 | Current settings/save/recovery code | UI fallback elsewhere mentions 300 seconds; effective path not dynamically checked |
| C-024 | `UNKNOWN` | Medium | `.rgp` collects referenced audio and `load` assets, but generic LV2 asset portability is unproven | 26.06 packaging | S-015, S-018 | Highest-value curiosity trace | Needs plugin asset fixture |
| C-025 | `DOCUMENTED` | High | WAV export is fixed stereo at current sample rate, JACK-required, and controlled by playback | 26.06 | S-019 | UI and exporter code | Exact file encoding depends on build path; external JACK audio excluded |
| C-026 | `INFERENCE` | Medium | Extensibility is standards/source/device-file based; no stable general scripting/application-extension SDK was found | 26.06 | S-004, S-013, S-020 | Scoped search plus source map | Internal actions are not a public SDK |
| C-027 | `DOCUMENTED` | High | Rosegarden is GPL version 2 or later; `COPYING` contains GPLv2 | 26.06 source | S-004, S-021 | README/source headers/license file | No legal advice or dependency-license audit |
| C-028 | `INFERENCE` | High | FAQ/tour prose conflicts with immutable 26.06 source on Qt default and some limits; source controls current claims | Public docs vs source | S-004, S-008, S-010 | Direct contradiction | FAQ may describe maintainers’ preferred builds |
| C-029 | `DOCUMENTED` | High | Legacy handbook revision history ends at 1.7.0, May 2008 and is historical only | Historical context | S-012 | Explicit revision page | Not evidence for 26.06 behavior |
| C-030 | `INFERENCE` | Medium-high | No AAF/OMF/ADM/DAWproject, video, loudness-delivery, or DDP implementation was found | Pinned source search | S-013 | Exact-token scoped negative search | External-tool workflows remain possible |
| C-031 | `UNKNOWN` | Low | Accessibility conformance, signed updates/rollback, and telemetry/privacy behavior are unresolved | Product operations | S-013 | No current primary contract found | Requires UI audit and release/distribution study |
| C-032 | `DOCUMENTED` | High | `.rgp` packages collect referenced audio and plugin `load` assets, rewrite project audio paths, accept optional extras, and use tar/gzip plus FLAC/WavPack tooling | 26.06 packaging | S-018 | Direct packager implementation | Narrow line-oriented extraction does not prove generic plugin-asset portability |
| C-033 | `DOCUMENTED` | High | Loading without audio/JACK can make audio/plugins unavailable and resaving can lose their data/settings | 26.06 project load | S-017 | Explicit user warning | Exact loss surface not probed |
| C-034 | `UNKNOWN` | Low-medium | Takes/comping, clip warp, ripple/versioning, native-device inventory, video/conform, stems, and similar modern DAW contracts are unresolved | 26.06 | S-005, S-013, S-019 | No sufficient current contract retained | Some isolated feature code may exist without full workflow |
| C-035 | `DOCUMENTED` | Medium | Translation infrastructure exists; FAQ names English, Polish, German, and French availability | 26.06 era | S-004, S-010 | Translation files and current FAQ | Completeness/quality not assessed |
| C-036 | `INFERENCE` | Medium-high | Audio arrangement is predominantly non-destructive: time stretch creates a derived file, while permanent source-file deletion is explicit and warned | 26.06 audio editing | S-019 | Direct derived-file and irreversible-delete paths | Does not prove a modern elastic-audio/warp contract or cover every edit |
| C-037 | `DOCUMENTED` | High | Public extension/integration boundaries include open GPL source, LADSPA/DSSI/LV2, `.rgd` device files, control surfaces/LIRC, JACK/ALSA, and file interchange | 26.06 | S-004, S-006, S-009, S-011, S-020, S-021 | Official source, workflow/dependency docs, runtime protocols, and license | These boundaries are not a stable general application-plugin or scripting SDK |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29 UTC. Website/source text is treated as untrusted evidence, never instructions. Immutable source links pin the exact commit where practical.

**S-001 — “Rosegarden” home page.** Rosegarden Development Team. <https://www.rosegardenmusic.com/>. Official current product/release page; current-release and product-position scope. Relevant passages: “3 June 2026,” “Rosegarden 26.06,” Linux, MIDI sequencer, notation, basic audio, intended users. Supports C-001, C-002. Limitation: vendor description, not independent measurement. Selected over secondary summaries because it is canonical and current.

**S-002 — “ROSEGARDEN 26.06 RELEASED.”** Rosegarden Development Team. <https://www.rosegardenmusic.com/wiki/dev:26.06>. Official release notes, 26.06. Relevant sections: title; LV2 fixes/minimum/optional build; GTK2/editor behavior; MusicXML; TranzPort. Supports C-001, C-008, C-010, C-011, C-015. Limitation: change list, not complete architecture. Selected to triangulate the source tag and date.

**S-003 — “Rosegarden source downloads.”** Rosegarden Development Team. <https://www.rosegardenmusic.com/getting/source/>; alternate immutable repository <https://github.com/tedfelix/rosegarden-official/tree/6c315d2d753cfe83d50ebe40a140973f527bf195>. Official release/source index plus pinned public mirror. Relevant passage: “current stable release is 26.06”; local tag metadata reports tag date 2026-06-03 and commit `6c315d…`. Supports C-001. Limitation: mirror/tag metadata does not prove binary provenance for distro packages. Selected to bind claims to an immutable tree.

**S-004 — Rosegarden 26.06 `README.md`, `CHANGELOG`, and `CMakeLists.txt`.** Rosegarden Development Team. [README](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/README.md#L1-L17), [build/runtime/license](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/README.md#L59-L132), [CMake](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/CMakeLists.txt#L9-L10), [dependencies](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/CMakeLists.txt#L123-L240), [release notes](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/CHANGELOG#L1-L22). Immutable source/build metadata. Supports C-001, C-002, C-005, C-011, C-026, C-027, C-028, C-035, C-037. Limitation: build-time evidence, not a runtime distribution matrix. Selected because it resolves FAQ ambiguity.

**S-005 — “Tour 1: Editing.”** Rosegarden Development Team. <https://www.rosegardenmusic.com/tour/editing/>. Official unversioned tour. Relevant passages: track overview, segments, matrix/notation/event editors, entry modes, undo/redo. Supports C-003, C-034. Limitation: unversioned marketing/tutorial prose; no numeric claims retained. Selected for user-visible conceptual model.

**S-006 — “Tour 2: MIDI.”** Rosegarden Development Team. <https://www.rosegardenmusic.com/tour/midi/>. Official unversioned tour. Relevant passages: Studio devices/banks/programs/controllers, `.rgd` sharing, control rulers. Supports C-003, C-008, C-037. Limitation: “over 100” inventory not retained. Selected for intended MIDI workflow.

**S-007 — “Tour 3: Notation.”** Rosegarden Development Team. <https://www.rosegardenmusic.com/tour/notation/>. Official unversioned tour. Relevant passages: notation data beyond MIDI, heuristic quantization retaining performance timing, LilyPond print. Supports C-004, C-010. Limitation: internal representation is not specified. Selected because it states the key differentiator directly.

**S-008 — “Tour 4: Audio.”** Rosegarden Development Team. <https://www.rosegardenmusic.com/tour/audio/>. Official unversioned tour. Relevant passages: audio segment arranging, mixer/routing, five inserts, LADSPA. Supports C-009 and documents the conflicting “eight submasters” wording used in C-028. Limitation: stale relative to current source; numeric limits do not control. Selected to preserve rather than hide the contradiction.

**S-009 — “Tour 5: Synths” and “Tour 7: Integration.”** Rosegarden Development Team. <https://www.rosegardenmusic.com/tour/synths/> and <https://www.rosegardenmusic.com/tour/integration/>. Official unversioned tour set. Relevant passages: DSSI custom GUI, standalone ALSA synths, JACK routing/transport ecosystem. Supports C-005, C-011, C-015, C-037. Limitation: predates current LV2 implementation details. Selected for public workflow intent, not current host completeness.

**S-010 — “Frequently Asked Questions for Rosegarden 10.02 and Later.”** Rosegarden Development Team. <https://rosegardenmusic.com/wiki/frequently_asked_questions>. Official wiki, modified 2026-03-02. Relevant sections: Linux-only; ALSA/JACK; gzipped XML; localization. Supports C-002, C-005, C-022, C-028, C-035. Limitation: title spans many releases and incorrectly generalizes Qt 6 for the pinned default. Selected to expose the contradiction and corroborate platform/project format.

**S-011 — “Get Dependencies.”** Rosegarden Development Team. <https://rosegardenmusic.com/wiki/dev:get_dependencies>. Official developer wiki, modified 2026-01-20. Relevant table: Qt5/Qt6, ALSA, JACK, LADSPA, DSSI, Lilv/LV2 1.18; GTK2 note. Supports C-005, C-011, C-037. Limitation: distro package names vary and GTK wording is not process isolation. Selected as current human-readable dependency context, secondary to CMake.

**S-012 — “Rosegarden Revision History.”** Rosegarden Development Team. <https://www.rosegardenmusic.com/doc/en/rosegarden-revhistory.html>. Official legacy handbook page. Relevant passage: 1.7.0—May 2008; first public Rosegarden-4 release—June 2001. Supports C-029. Limitation: historical and unversioned against 26.06; no current behavior claims. Selected only to bound lineage after the guessed PDF URL returned 404.

**S-013 — Plugin discovery/identity immutable source bundle.** Rosegarden Development Team. [factory set](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/PluginFactory.cpp#L43-L114), [LADSPA paths/blacklist/discovery](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/LADSPAPluginFactory.cpp#L586-L800), [DSSI paths/discovery](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/DSSIPluginFactory.cpp#L251-L407), [enumeration thread](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/gui/studio/AudioPluginManager.cpp#L42-L145), [identity](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/PluginIdentifier.cpp#L21-L60). Immutable implementation source. Supports C-011–C-016, C-019, C-026, C-030, C-031, C-034. Limitation: negative searches are bounded to this tree; external wrappers/libraries excluded. Selected because it is the origin of host-format claims.

**S-014 — Plugin/audio runtime and process-boundary source bundle.** Rosegarden Development Team. [runtime interface](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/RunnablePluginInstance.h#L33-L103), [mixer instantiation](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/AudioInstrumentMixer.cpp#L176-L247), [serial DSP](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/AudioInstrumentMixer.cpp#L1185-L1307), [DSSI editor process](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/gui/studio/AudioPluginOSCGUI.cpp#L37-L76), [DummyDriver selection](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/SoundDriverFactory.cpp#L29-L59), [audio threads](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/AudioProcess.cpp#L106-L188). Supports C-005, C-006, C-015, C-016, C-018. Limitation: static inspection, no fault/performance probe. Selected to distinguish thread, process, UI, and DSP boundaries.

**S-015 — LV2 implementation source bundle.** Rosegarden Development Team. [database/ports](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/LV2PluginDatabase.cpp#L69-L229), [features/ports/latency](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/LV2PluginInstance.cpp#L143-L339), [state/presets/Patch](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/LV2PluginInstance.cpp#L481-L683), [serialized state/connections/parameters](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/LV2PluginInstance.cpp#L929-L1061), [events/run/Worker](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/LV2PluginInstance.cpp#L1093-L1297), [UI features/scaling](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/gui/studio/AudioPluginLV2GUIWindow.cpp#L120-L270). Supports C-012, C-015, C-017–C-020, C-024. Limitation: presence of host code does not prove every LV2 plugin interoperates. Selected for full-contract evidence beyond format logos.

**S-016 — Limits/routing immutable source bundle.** Rosegarden Development Team. [instrument counts](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/base/Instrument.h#L39-L72), [insert count](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/base/PluginContainer.h#L25-L46), [bus clamp](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/base/Studio.cpp#L380-L424), [mixer UI submasters](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/gui/studio/AudioMixerWindow2.cpp#L107-L111), [master adjustment](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/gui/studio/AudioMixerWindow2.cpp#L463-L524). Supports C-003, C-007. Limitation: model maximum may exceed GUI menu. Selected over tour prose because it is current and exact.

**S-017 — Project/plugin persistence immutable source bundle.** Rosegarden Development Team. [gzip UTF-8](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/document/GzipFile.cpp#L26-L60), [temp/save/XML](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/document/RosegardenDocument.cpp#L1150-L1364), [plugin XML](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/base/AudioPluginInstance.cpp#L81-L151), [missing-plugin branch](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/document/RoseXmlHandler.cpp#L1885-L2010), [no-audio resave warning](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/document/RosegardenDocument.cpp#L1701-L1725). Supports C-020–C-023, C-033. Limitation: no round-trip probe. Selected as direct durability evidence.

**S-018 — Autosave and project-packaging source bundle.** Rosegarden Development Team. [60-second/default autosave](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/document/RosegardenDocument.cpp#L181-L191), [autosave behavior](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/document/RosegardenDocument.cpp#L323-L356), [transport suppression](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/gui/application/RosegardenMainWindow.cpp#L8281-L8317), [packaged assets](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/gui/general/ProjectPackager.cpp#L221-L469). Supports C-023, C-024, C-032. Limitation: packaging parser is implementation-specific and generic LV2 assets remain unknown. Selected as the highest-value portability thread.

**S-019 — Media/edit/export/interchange source bundle.** Rosegarden Development Team. [current import/export actions](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/gui/application/RosegardenMainWindow.cpp#L811-L828), [audio import filters](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/gui/dialogs/AudioManagerDialog.cpp#L721-L750), [derived stretch file](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/AudioFileTimeStretcher.cpp#L52-L69), [permanent-delete warning](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/gui/dialogs/AudioManagerDialog.cpp#L939-L972), [WAV prerequisite/workflow](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/gui/application/RosegardenMainWindow.cpp#L5563-L5603), [exporter contract](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/WAVExporter.h#L36-L91), [two-channel output](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/WAVExporter.cpp#L36-L61). Supports C-009, C-010, C-019, C-025, C-034, C-036. Limitation: menus/classes do not prove interchange fidelity or every audio edit’s non-destructive behavior. Selected to bound media handling and delivery precisely.

**S-020 — Synchronization/control source bundle.** Rosegarden Development Team. [JACK transport/callbacks](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/JackDriver.cpp#L855-L1105), [MIDI clock/MMC/MTC modes](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/AlsaDriver.cpp#L4682-L4823), [external-controller contract](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/src/sound/ExternalController.h#L36-L115). Supports C-005, C-006, C-008, C-026, C-037. Limitation: no hardware probe. Selected for direct protocol/control evidence.

**S-021 — Rosegarden license files.** Rosegarden Development Team / Free Software Foundation. [README grant](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/README.md#L296-L308), [`COPYING`](https://github.com/tedfelix/rosegarden-official/blob/6c315d2d753cfe83d50ebe40a140973f527bf195/COPYING#L1-L40). Primary license notice/text for 26.06. Supports C-027, C-037. Limitation: not a legal opinion and not a dependency-license inventory. Selected over third-party license databases.

### Negative/access-results log

- A nested exploration request failed with `Subagent depth limit reached (1)`; parent source inspection completed the same bounded gap.
- Targeted web searches encountered HTTP 429 rate limiting; retained official/immutable sources already covered the claims, so search snippets were not used.
- A guessed `rosegarden-handbook.pdf` URL returned 404. The accessible official HTML revision-history page S-012 replaced it; the PDF was not retried.
- Scoped exact-token searches at the pinned commit returned no native loci for the non-LADSPA/DSSI/LV2 formats, MPE/MIDI 2.0/UMP, AAF/OMF/ADM/DAWproject, video, DDP, signing/notarization, or telemetry. False substring matches (icons, words such as “example,” and panning “apparent loudness”) were rejected.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / available evidence | Blocker and impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| Plugin tails | Traced runtime interface, latency, bypass/silence, WAV exporter; no tail API found | Absence search cannot prove truncation; affects bounce correctness | Disposable impulse/reverb LADSPA/DSSI/LV2 fixtures; stop/export and measure retained tail | Unassigned |
| Sample-accurate plugin-parameter automation | Traced control ports, Patch values, controller rulers, serialized values; no timestamped plugin-param timeline contract found | Static setters are not automation; architecture-critical | Automation fixture with abrupt control changes at known sample offsets; inspect rendered transition | Unassigned |
| Suspend/dynamic I/O/offline plugin contract | Traced activate/deactivate, `silence`, ideal channel count, fixed block options, WAV path | No formal lifecycle/renegotiation API found; affects host abstraction | Plugins that request dynamic ports/latency and offline mode; log callbacks in disposable build | Unassigned |
| MPE/MIDI 2.0/UMP | Exact-token and event-path searches; ALSA MIDI 1.x and pressure paths found | Negative source result only; affects expression model | Record/play MPE fixture and inspect channel/per-note preservation; separate UMP capability build study | Unassigned |
| Generic LV2 asset portability | Pursued source trace through Lilv state and `.rgp`; only audio and `load` assets explicit | Plugin state may reference samples/IRs outside package | LV2 state plugin with external file; save `.rg`, package `.rgp`, move to clean account, reopen and hash assets | Unassigned |
| Missing-plugin round-trip loss | Loader explicitly skips; serialization only emits assigned plugins | Exact data loss after resave not measured | Create project with stateful plugin, remove plugin, load/save/reinstall, compare XML/state/audio | Unassigned |
| Scan/crash recovery | Same-process QThread/`dlopen` proved; blacklist exists | No dynamic crash probe; determines practical diagnosability | Disposable VM with descriptor-crash, instantiate-crash, DSP-crash, and hang plugins; capture restart behavior | Unassigned |
| Submaster/model limit semantics | Model accepts 16 total buses; UI offers up to eight submasters | Loaded files with 9–15 submasters not tested | Hand-author valid `.rg` with 15 submasters, load/save and inspect mixer/JACK ports | Unassigned |
| Accessibility | Keyboard shortcuts/tooltips and Qt UI exist; no conformance statement/audit retained | Source presence does not prove assistive usability | AX/AT-SPI tree audit, keyboard-only task suite, screen-reader walkthrough on named distro | Unassigned |
| Update/signing/privacy | Scoped source search found no signing/notarization/telemetry tokens | Distro delivery may own these boundaries | Study one named distro package/repository and network trace in disposable VM | Unassigned |

## 24. Curiosity pass and stop decision

Scores are 1–5; higher relevance/value/novelty is better, while higher cost is worse.

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision/result |
| --- | ---: | ---: | ---: | ---: | --- |
| Generic LV2 asset portability through `.rgp` | 5 | 5 | 4 | 2 | **PURSUED.** Traced Lilv state and packager. Result: referenced audio and `load` assets documented (C-032); generic LV2 collection remains `UNKNOWN` (C-024). |
| Sample-accurate plugin-parameter automation | 5 | 5 | 3 | 5 | `CURIOSITY_NO_GO`: requires dynamic audio fixture; static search saturated. |
| Scan/DSP crash containment behavior | 5 | 5 | 2 | 5 | `CURIOSITY_NO_GO`: source already establishes same-process boundary; behavioral severity needs disposable crash plugins. |
| Tail and stop/export behavior | 4 | 4 | 3 | 4 | `CURIOSITY_NO_GO`: no documentary contract; only render probes discriminate. |
| MPE/MIDI 2.0 support | 4 | 4 | 3 | 4 | `CURIOSITY_NO_GO`: exact-token negative result; needs hardware/virtual MIDI fixture. |
| 9–15 submaster load behavior | 3 | 3 | 3 | 3 | `CURIOSITY_NO_GO`: ambiguity is visible but does not change the leading architecture lesson. |
| Exhaustive historical/manual reconciliation | 1 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: stale-document archaeology cannot change 26.06 conclusions. |

**Stop decision — COVERAGE + SATURATION + NONPOSITIVE MARGINAL DOCUMENTARY EVIDENCE.** Every required heading and plugin row is populated; identity/platform/release, workflow, engine, plugin lifecycle, persistence, interchange, licensing, contradictions, negative results, and unknowns have primary evidence. The highest-value remaining documentary thread was pursued and bounded. Repeated source searches produced duplicates or absence, while remaining consequential gaps require dynamic fixtures. The nested-agent limit, earlier 429s, and one 404 did not block coverage because accessible official and immutable equivalents were retained. Research stops at `COMPLETE_WITH_UNKNOWNS`; the next phase should be bounded interoperability probes, not more broad web search.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created `research/daw-landscape/dossiers/rosegarden.md`; no shared/sibling file was changed by this research session.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See section 0 and C-001/C-002.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and subsections 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive sections use `DOCUMENTED`, `INFERENCE`, or `UNKNOWN`; there are no `OBSERVED` claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See claims register and section 23.
- [x] **Every required plugin-format row is present.** All 13 required rows appear in section 11.1, with no blank status cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover discovery, identity, runtime, buses/events, UI, state, latency, assets, and failure behavior.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Claim classifications and source limitations are explicit; negative source searches are bounded inferences.
- [x] **Licensing and clean-room boundaries are explicit.** See sections 0 and 16, C-027, and S-021.
- [x] **Bibliography records source rationale and limitations.** S-001–S-021 include scope, passages, limitations, and selection rationale.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Research used public pages, immutable public source, static text inspection, and read-only metadata commands only.

**Owned path:** `/Volumes/dev/curiosity/research/daw-landscape/dossiers/rosegarden.md`
**Checks performed:** heading/order audit; required-format row audit; claim/source cross-reference audit; stale-document conflict audit; scoped negative-token audit; owned-path/workspace status audit.
**Concise result:** `COMPLETE_WITH_UNKNOWNS`; 37 claim IDs and 21 retained primary-source entries; no dynamic observations.
**Unresolved blockers:** consequential unknowns in section 23 require disposable runtime fixtures; none blocks documentary completion.
**Workspace:** extensive pre-existing modified and untracked files were recorded before writing and left untouched; no staging or commit was performed.
