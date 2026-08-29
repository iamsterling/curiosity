# OpenMPT DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** OpenMPT (Open ModPlug Tracker).
- **Canonical upstream:** OpenMPT Project / OpenMPT Project Developers and Contributors.
- **Researcher/session:** research subagent, session `ses_fb274aed7ffectN74YF9385GfR`.
- **Owned path:** `research/daw-landscape/dossiers/openmpt.md`.
- **Research date and cutoff:** 2026-08-29 UTC.
- **Current stable product scope:** OpenMPT 1.32.11.00, released 2026-08-15. The official installer targets Windows 7 SP1 or newer and installs supported x86, amd64, ARM, and ARM64 builds; portable-build OS floors vary. Wine 1.8+ is documented, but there is no native macOS or Linux OpenMPT edition in the examined release. [C-001]
- **Edition scope:** one free OpenMPT desktop product; installer, portable, legacy-compatible, and experimental RETRO packages are packaging/build variants rather than feature-priced editions. The stable 1.32.11.00 feature set is the decision scope; 1.33 development snapshots are excluded. [C-001]
- **Included:** tracker/module/sample/instrument model; mixer, offline render, and delay behavior; VST 1/2, VST3, DirectX DMO, built-ins, and all required negative plugin-format rows; scanning/cache/bridge/isolation; audio/MIDI/I/O/automation/state/UI/missing-plugin handling; project/interchange/recovery; libopenmpt and licensing boundaries.
- **Excluded:** executing OpenMPT or third-party plugins; validating vendor binaries; exhaustive legacy-format fidelity tests; legal advice; libopenmpt as a separate DAW; OpenMPT 1.33 development behavior.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.

## 1. Executive summary

OpenMPT is a maintained, Windows-native tracker whose persisted composition model is a module containing reusable patterns, ordered sequences, samples, optional instruments, and plugin slots. Pattern channels are simultaneous event lanes rather than conventional audio tracks; one event per channel can sound at a time, so chords occupy multiple channels. MPTM is the high-fidelity OpenMPT project format, while IT/XM/S3M/MOD trade capability for tracker interchange. [C-001] [C-003] [C-004]

Plugin hosting is deliberately narrower than a modern cross-platform DAW. OpenMPT 1.32.11.00 hosts VST 1.x/2.x and Windows DirectX Media Object effects, plus product-native processors; VST3 is explicitly unsupported, and the immutable host dispatcher contains no AU, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, or Rack Extension implementation. VST scanning has a persistent cache and failed-initialization recovery. Runtime plugins normally execute in-process when architecture-compatible; the bridge is automatic across x86/amd64 bitness and optional per plugin for containment. [C-013] [C-014] [C-015] [C-033] [C-034]

The VST contract is stereo-centric. The host accepts I/O-change notifications, but connects only the first stereo pins, disables additional inputs, folds extra outputs into stereo, and has no implemented sidechain bus. It uses VST 32-bit processing and variable frame counts. The tagged source reads plugin-reported latency but contains no mixer consumer or compensation delay path; the high-confidence conclusion is that OpenMPT 1.32.11.00 has no plugin delay compensation. [C-016] [C-017] [C-035] [C-036]

Project recall is comparatively durable inside OpenMPT extensions: plugin identity, opaque state, program, mix data, and channel assignments are serialized; unavailable plugins retain slot data and trigger a missing-plugin report. Strict IT/XM compatibility export intentionally removes plugins and automation. External MPTM samples reduce duplication but create mutable path dependencies. Autosave generations and overwrite backups exist. [C-020] [C-021] [C-032] [C-038]

The most transferable ideas are the explicit module object graph, forward-only plugin routing, crash-marker-assisted scan recovery, state-preserving missing-plugin slots, per-instance versus shared bridge policy, compatibility export, and render-to-sample workflow. Do **not** copy the absence of PDC, stereo fold-down of extra buses, name-only plugin fallback, or security-mitigation disabling as defaults. Confidence is **high** for identity, format support, state, scanning, bridge, stereo I/O, and persistence; **medium-high** for the no-PDC inference; and **low/unknown** for ARM plugin compatibility, sample-accurate automation, tail reporting, code-sign validation, multicore scheduling, and MPE/MIDI 2.0. [C-017] [C-027] [C-028]

**Recommendation:** treat OpenMPT as a strong clean-room reference for tracker data/persistence and failure-tolerant legacy VST2 hosting, not as a complete reference for a contemporary cross-platform plugin contract. Prototype latency compensation, multiple buses, sample-accurate events, and durable plugin identity independently.

## 2. Product identity, history, and market position

**DOCUMENTED —** OpenMPT 1.32.11.00 is the stable release at cutoff and was published on 2026-08-15. Official packages cover current Windows architectures and older-Windows compatibility variants; the source is publicly available. [C-001] [C-002]

**DOCUMENTED —** The project describes OpenMPT as Open ModPlug Tracker and maintains the same playback code family as libopenmpt. The current release includes tracker/playback/module-loader fixes, demonstrating active maintenance rather than a frozen historical artifact. [C-002] [C-024]

**INFERENCE —** Its market position is a specialist free tracker and module authoring environment, not a conventional multitrack recording DAW. This follows from the official module/pattern workflow and product presentation; no independent market-share claim was retained. [C-003]

**DOCUMENTED —** There are no commercial feature tiers in scope. x86/amd64/ARM/ARM64, portable, RETRO, and legacy packages differ by target/runtime packaging, not documented project capability tier. [C-001]

## 3. Workflow and conceptual model

**DOCUMENTED —** The project/session is a **module** (also “track” or “song”) with global settings, patterns, one or more order lists/sequences, samples, instruments, and plugins. A pattern is a table of rows over channels; each channel has note, instrument, volume, and effect columns. A pattern can be referenced repeatedly or from multiple sequences. [C-003]

**DOCUMENTED —** A channel is the nearest equivalent to a sequencer track, but it carries one event at a time. Chords require events on multiple channels. Tracker time is expressed through rows and ticks, with tempo/effect commands embedded in pattern data rather than a separate clip/automation timeline. [C-003] [C-019]

**DOCUMENTED —** Samples are direct sound sources. Instruments are an optional layer mapping one or more samples across keys with envelopes and can instead target an instrument plugin. MOD/S3M primarily use samples; XM/IT/MPTM support the richer instrument layer, with format-specific restrictions. [C-005]

**DOCUMENTED —** MPTM is IT-derived and adds multiple sequences, parameter-control events, custom tuning, fractional tempo, tempo swing, and global resampling settings. MPTM is the recommended full-fidelity authoring format; IT is recommended when broad tracker compatibility is more important. [C-004]

**UNKNOWN —** No scenes/clip launcher, take lanes, conventional track regions, or modular patching canvas was found. Their absence from the examined tracker model is architecture-relevant, but no claim is made about every auxiliary UI command. [C-031]

## 4. Publicly documented architecture

**DOCUMENTED (immutable source) —** At tag `OpenMPT-1.32.11.00` / commit `6b8bae0dc341ada3ad689e8d79e006241920185c`, the public repository separates the Windows tracker/UI and VST host under `mptrack/`, bridge executable/protocol under `pluginBridge/`, module loading/mixing/plugin abstraction under `soundlib/`, DSP under `sounddsp/`, and the cross-platform playback API under `libopenmpt/` and `doc/libopenmpt/`. [C-006]

**DOCUMENTED (immutable source) —** `soundlib/plugins/PluginManager.cpp` conditionally dispatches VST and DMO implementations and registers product-native processors. `soundlib/Load_it.cpp` owns OpenMPT plugin chunks; `soundlib/Sndfile.cpp` instantiates and restores slots; `mptrack/Vstplug.cpp` implements the VST2 host callback, processing, events, UI, and I/O. [C-006] [C-013] [C-020]

**DOCUMENTED —** A fresh scan first attempts the bridge process, with a possible native fallback when the bridge is unavailable or errors and the user permits fallback. The runtime bridge is a distinct process boundary. Architecture-compatible runtime instances otherwise default to the OpenMPT process. [C-015] [C-033]

**UNKNOWN —** Public evidence did not establish a complete audio-thread scheduler, multicore partitioning strategy, lock-free graph model, device-service architecture, internal sample-mix precision, or transactional storage model. [C-028]

## 5. Audio engine

**DOCUMENTED —** Sample playback is resampled to the output rate. Global and per-instrument interpolation choices include no interpolation, linear, cubic, and 8-tap sinc variants; an Amiga-oriented resampler and format compatibility choices preserve legacy replay character. Configurable ramping reduces clicks at sample starts/stops and during volume changes. [C-007]

**DOCUMENTED (immutable source) —** VST processing is explicitly requested at 32-bit precision. Calls receive variable frame counts bounded by the host mix buffer. Mono plugin input is formed from stereo; extra VST outputs are folded into stereo. [C-016] [C-036]

**INFERENCE, high confidence —** OpenMPT 1.32.11.00 does not implement plugin delay compensation. The plugin abstraction exposes `GetLatency()`, VST returns `AEffect.initialDelay`, and DMO can query latency, but exhaustive tagged-source searches found no mixer/scheduler call site or compensating delay path. A differently named private mechanism is a plausible but unsupported alternative. [C-017]

**DOCUMENTED —** Offline stream export supports selectable rate/channel count/bit depth or bitrate, dither, normalization, pattern-channel stems, instrument stems, marker cues, and render-to-sample. “Slow Render” throttles for disk-streaming/incompatible plugins; buffer clearing prerenders silence. [C-008] [C-037]

**INFERENCE —** Render-to-sample is a tracker-native bounce mechanism, not a full freeze lifecycle: no automatic source disable, reversible freeze graph, or dependency record was documented. [C-008]

**UNKNOWN —** Engine oversampling, multicore scheduling, dropout counters, realtime CPU meters, and deterministic realtime/offline equivalence remain unestablished. [C-028]

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED —** Pattern channels are vertical event lanes; rows represent time and four subcolumns carry note, instrument, volume/effect, and effect data. Patterns are reusable sequence entries, not continuous audio clips. MPTM can use multiple sequences; format limits govern row/channel behavior. [C-003] [C-004]

**DOCUMENTED —** Pattern editing includes note/effect entry and commands for tempo, global/channel properties, pitch, volume, and plugin automation. The sample editor performs waveform cut/paste/draw, normalization, resampling, destructive pitch shift/time stretch, loop/cue editing, and local undo/redo. [C-009]

**DOCUMENTED —** OpenMPT is not a general MIDI editor and has no native staff view; MIDI import/export are conversion tools with explicit fidelity loss. [C-010]

**UNKNOWN —** Conventional audio regions, slip edits, crossfades between clips, ripple modes, take lanes, comping, elastic audio, grouped edits, and project-wide nonlinear history were not evidenced. [C-031] [C-032]

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED —** MIDI input can record notes into the pattern editor. OpenMPT supports plugin and external-device routing through a built-in MIDI Input / Output plugin, including multiple instances/devices, chained MIDI processors, and recording plugin MIDI output back into tracker editors. [C-010]

**DOCUMENTED —** Instruments select one of 16 MIDI channels or derive it from the pattern channel modulo 16, and may send program changes. Imported MIDI handles documented subsets of CC, RPN, SysEx, GM/XG behavior, and embedded/adjacent soundfonts. MIDI export maps instruments to tracks/channels at 480 PPQ but loses tracker-only volume/pitch behavior. [C-010]

**DOCUMENTED —** The MIDI model includes note on/off, pitch bend, channel and polyphonic aftertouch, CC, program/bank concepts, and SysEx. Plugin parameters can be MIDI-mapped. [C-010] [C-019]

**UNKNOWN —** MPE profiles/zones, MIDI 2.0/UMP, per-note controllers beyond MIDI 1 poly-aftertouch, MIDI-CI, sample-accurate MIDI event scheduling, MTC, and a documented clock master/slave contract were not found. [C-027]

## 8. Routing, mixer, automation, and control

**DOCUMENTED —** A module has 250 plugin slots. A slot routes audio and MIDI either to the master or to one higher-numbered slot. The monotonic slot rule creates an acyclic forward graph; no feedback route is exposed. Slots can be master processors. [C-011]

**DOCUMENTED —** A pattern channel may assign one effect plugin for sample output, followed by a plugin chain. An instrument plugin assigned to an instrument supersedes the channel effect for that instrument. Host mix controls include gain, bypass, dry/wet and phase variants, master assignment, and silence-based auto-suspend. [C-011]

**DOCUMENTED —** Automation is pattern data: XM/IT use smooth MIDI macro commands and MPTM uses Parameter Control events. GUI changes can be recorded while following song; external MIDI can map to plugin parameters. [C-019]

**DOCUMENTED/INFERENCE —** No current sidechain bus is implemented; immutable source connects only stereo input/output pins and comments that sidechain support is future work. Extra outputs are summed into stereo rather than independently routed. [C-016] [C-036]

**UNKNOWN —** Sends/returns independent of slot chains, folders, VCAs, control-surface protocols, OSC, surround/immersive buses, sample-accurate parameter queues, feedback handling, and automation conflict/edit-lane semantics remain unestablished. [C-027]

## 9. Recording, comping, and media handling

**DOCUMENTED —** OpenMPT is sample/module-centric and loads and edits many sample-file types, with additional codecs supplied by Windows Media Foundation. Samples are normally embedded in modules; MPTM can keep waveform data external while retaining loop/vibrato/pan metadata internally. [C-005] [C-021] [C-025]

**DOCUMENTED —** MIDI notes and plugin-emitted MIDI can be recorded into pattern data. Audio can be rendered into a sample slot. [C-008] [C-010]

**UNKNOWN —** The examined evidence does not establish conventional live audio recording, input monitoring, punch/loop takes, take management, comping, video, conform, proxies, BWF metadata, or an automatic asset-collect/relink package. Safest interpretation: OpenMPT is sample/module-centric rather than a multitrack recorder. [C-032]

## 10. Instruments, effects, content, and native devices

**DOCUMENTED —** Native sound sources/processors include the sample player, MPTM/S3M OPL3 emulation, DigiBooster and SymMOD echo emulations, an LFO generator, Windows DMO wrappers/built-ins, and a MIDI Input / Output plugin. [C-012]

**DOCUMENTED —** Sample instruments support multisample key maps, volume/pan/pitch or filter envelopes, loops/sustain loops, tuning, and format-specific playback behavior. Plugin instruments are selected by the same instrument layer and receive note/MIDI configuration. [C-005]

**DOCUMENTED —** Native/plugin presets differ: VST uses factory programs and FXP/FXB; sample/instrument assets use tracker/sample formats such as ITI, XI, SFZ, ITS, WAV, and FLAC as applicable. [C-005] [C-018]

**UNKNOWN —** There is no evidence of a general user-authored native-device SDK, modular rack format, or content marketplace contract. [C-026]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `NOT_APPLICABLE:no native edition` | `DOCUMENTED`: VST 1.x/2.x effects/instruments; native same-architecture runtime; automatic opposite x86/amd64 bitness bridge | `NOT_APPLICABLE:no native edition`; Wine is documented but not a native Linux host contract | `NOT_APPLICABLE:no edition` | OpenMPT 1.32.11.00; x86/amd64 explicitly documented; ARM/ARM64 app builds exist but practical third-party VST/bridge compatibility is `UNKNOWN` | Supported on Windows. Variable blocks, 32-bit process precision, stereo pins; extra outputs fold down. | [C-001] [C-013] [C-015] [C-016]; S-001, S-005, S-006, S-011 |
| VST3 | `NOT_APPLICABLE:no native edition` | `DOCUMENTED:not supported` | `NOT_APPLICABLE:no native edition` | `NOT_APPLICABLE:no edition` | FAQ current through 2026-05; immutable 1.32.11.00 dispatcher | Third-party VST2 shell workaround is not native support and was not qualified. | [C-013]; S-006, S-011 |
| AUv2 | `NOT_APPLICABLE:no native edition` | `DOCUMENTED:not implemented in tagged host dispatcher` | `NOT_APPLICABLE:no native edition` | `NOT_APPLICABLE:no edition` | OpenMPT 1.32.11.00 source tag | No AU host path. | [C-013]; S-011 |
| AUv3 | `NOT_APPLICABLE:no native edition` | `DOCUMENTED:not implemented in tagged host dispatcher` | `NOT_APPLICABLE:no native edition` | `NOT_APPLICABLE:no edition` | OpenMPT 1.32.11.00 source tag | No AUv3 host path. | [C-013]; S-011 |
| AAX | `NOT_APPLICABLE:no native edition` | `DOCUMENTED:not implemented in tagged host dispatcher` | `NOT_APPLICABLE:no native edition` | `NOT_APPLICABLE:no edition` | OpenMPT 1.32.11.00 source tag | No AAX host path. | [C-013]; S-011 |
| CLAP | `NOT_APPLICABLE:no native edition` | `DOCUMENTED:not implemented in tagged host dispatcher` | `NOT_APPLICABLE:no native edition` | `NOT_APPLICABLE:no edition` | OpenMPT 1.32.11.00 source tag | No CLAP host path. | [C-013]; S-011 |
| LV2 | `NOT_APPLICABLE:no native edition` | `DOCUMENTED:not implemented in tagged host dispatcher` | `NOT_APPLICABLE:no native edition` | `NOT_APPLICABLE:no edition` | OpenMPT 1.32.11.00 source tag | No LV2 host path. | [C-013]; S-011 |
| LADSPA | `NOT_APPLICABLE:no native edition` | `DOCUMENTED:not implemented in tagged host dispatcher` | `NOT_APPLICABLE:no native edition` | `NOT_APPLICABLE:no edition` | OpenMPT 1.32.11.00 source tag | No LADSPA host path. | [C-013]; S-011 |
| DSSI | `NOT_APPLICABLE:no native edition` | `DOCUMENTED:not implemented in tagged host dispatcher` | `NOT_APPLICABLE:no native edition` | `NOT_APPLICABLE:no edition` | OpenMPT 1.32.11.00 source tag | No DSSI host path. | [C-013]; S-011 |
| JSFX | `NOT_APPLICABLE:no native edition` | `DOCUMENTED:not implemented in tagged host dispatcher` | `NOT_APPLICABLE:no native edition` | `NOT_APPLICABLE:no edition` | OpenMPT 1.32.11.00 source tag | No JSFX host path. | [C-013]; S-011 |
| DirectX/DXi | `NOT_APPLICABLE:no native edition` | `DOCUMENTED`: registered DirectX Media Object audio effects and built-in DMOs; `UNKNOWN` for DXi instruments | `NOT_APPLICABLE:no native edition` | `NOT_APPLICABLE:no edition` | OpenMPT 1.32.11.00 Windows source/tag | Current source enumerates DirectShow audio-effect DMO category, not a DXi instrument category. DMO bitness/bridge behavior is `UNKNOWN`. | [C-034]; S-005, S-011 |
| Rack Extension | `NOT_APPLICABLE:no native edition` | `DOCUMENTED:not implemented in tagged host dispatcher` | `NOT_APPLICABLE:no native edition` | `NOT_APPLICABLE:no edition` | OpenMPT 1.32.11.00 source tag | No Rack Extension host path. | [C-013]; S-011 |
| Product-native/other | `NOT_APPLICABLE:no native edition` | `DOCUMENTED`: internal sample/OPL engines, built-in DSP/LFO/MIDI I/O; not a third-party SDK | `NOT_APPLICABLE:no native edition` | `NOT_APPLICABLE:no edition` | OpenMPT 1.32.11.00 | Native devices are linked into the host and persisted as module plugins/instruments where applicable. | [C-012]; S-011, S-013, S-016 |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED —** Properly registered DMOs and built-ins appear automatically. VSTs are added by selecting DLL files or recursively scanning a user-selected folder. Known entries can be removed and tagged; the list can filter by name, vendor, or tags. No fixed global VST search path is required. [C-014]

**DOCUMENTED (immutable source) —** `plugin.cache` stores path/shell identity, VST IDs, a path CRC, vendor, category/instrument flags, bridge settings, and detected binary architecture. Exact path plus shell child deduplicates registration; module recall uses name, IDs, and shell ID, with native-architecture preference. [C-014] [C-038]

**DOCUMENTED —** A fresh VST scan sets a `FailedPlugin` marker before loading and clears it on success. On the next launch, OpenMPT asks whether to retry a plugin that crashed during initialization. Scanning first tries modern and legacy bridge processes, but can fall back to native loading when the bridge is unavailable or errors and the user permits fallback. Initialization exceptions are reported, folder scanning can be cancelled, and missing binary paths can be removed from the registry. [C-033]

**UNKNOWN —** There is no evidenced code-signature/notarization check, vendor validator, formal quarantine database, content-hash invalidation, scan timeout, or deterministic duplicate-ID chooser. The path CRC distinguishes paths; it is not documented as a binary-integrity hash. [C-027]

### 11.3 Runtime isolation and compatibility

**DOCUMENTED —** Architecture-compatible VST instances default in-process. The bridge is mandatory when a plugin cannot run natively (explicitly 32-bit versus 64-bit) and can be forced for a crash-prone plugin. [C-015]

**DOCUMENTED —** Default bridge isolation is one process per plugin instance. “Share Bridge between all Instances” co-locates instances of one plugin for plugins that require process sharing and faster startup; one crash can then affect all shared instances. A bridge crash should stop plugin audio without terminating OpenMPT. [C-015]

**DOCUMENTED —** Bridging adds latency and many bridged plugins can make low-latency processing impractical. A broken-plugin compatibility mode disables DEP, Large Address Awareness, and 64-bit ASLR in the bridge, reducing protection. [C-015] [C-022]

**UNKNOWN —** ARM↔x86 emulation/bridging, DMO bridging, per-plugin memory/CPU limits, IPC authentication, and hostile-plugin containment were not established. Runtime bridge isolation is fault containment, not a demonstrated security sandbox. [C-027]

### 11.4 Host/plugin processing contract

**DOCUMENTED —** VST effects and instruments receive audio and MIDI/event data. OpenMPT advertises stereo speaker arrangements, connects only the first two pins, disables additional pins, and folds extra output channels into stereo. Mono input is derived from the stereo input. [C-016] [C-036]

**DOCUMENTED —** The host accepts `audioMasterIOChanged` and reallocates plugin buffers, so dynamic reported channel-count changes are noticed, but the exposed route remains stereo. Processing uses variable `numFrames` up to the host block limit and VST 32-bit process precision. [C-035]

**DOCUMENTED/INFERENCE —** No sidechain bus is exposed, and there is no PDC despite reading VST/DMO latency. This makes parallel dry/wet routing and lookahead processors timing-sensitive. [C-016] [C-017]

**DOCUMENTED —** Bypass removes a plugin from processing; auto-suspend stops plugins after several seconds of no input/output and may be disabled for discontinuity-sensitive plugins. A process exception caught in-process automatically bypasses the plugin. [C-011] [C-022]

**UNKNOWN —** Sample-accurate event queues, event ordering at block boundaries, MPE/MIDI 2.0, tail-length reporting, suspend/resume exactness, denormal handling, offline flags, and realtime/offline determinism remain unqualified. [C-027]

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED —** OpenMPT can enumerate/select plugin parameters and programs, set normalized parameter values, show a generic editor, and load/save/copy VST FXP/FXB programs or banks. [C-018]

**DOCUMENTED —** Parameter changes from the plugin GUI can be recorded as smooth MIDI macro commands in XM/IT or MPTM Parameter Control events. External MIDI mapping can target parameters. Automation is part of tracker patterns, not a separate lane system. [C-019]

**DOCUMENTED (immutable source) —** Module `FX00…F255` chunks store plugin identity/info, opaque plugin data, default program, dry/wet data, and other mix metadata; `CHFX` stores channel assignments. Live instances refresh state before save. [C-020]

**DOCUMENTED —** On load, OpenMPT matches name + IDs + shell child (with weaker fallbacks), instantiates, then restores parameters/state. If unavailable, the slot data remains and a missing-plugin prompt lists unique identities; subsequent saves retain valid unavailable slots. This is a state-preserving placeholder, though successful future migration is not dynamically proven. [C-020] [C-038]

**DOCUMENTED —** Strict IT/XM compatibility export removes plugin list/configuration, instrument plugin assignments, and automation commands. Full plugin recall therefore depends on OpenMPT extensions, preferably MPTM. [C-032]

**UNKNOWN —** Stable parameter IDs across plugin versions, parameter ranges/units/text guarantees, asset dependency manifests, plugin-state size limits, state migration versions, preset portability, and recovery from corrupt chunks are unqualified. [C-027]

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED —** OpenMPT hosts custom VST GUIs in a plugin window and supplies a generic all-parameter GUI when a plugin has none. Plugin-requested resizing is handled when the host editor is resizable. Windows can be reduced to title bars; keyboard input may be passed to a plugin. [C-018]

**DOCUMENTED —** Diagnostics include scan progress, initialization-exception reports, remembered scan crash, missing-plugin lists, process-exception bypass, and crash-dump guidance. Bridged crashes have narrower expected impact than in-process crashes. [C-022] [C-033]

**DOCUMENTED —** OpenMPT stops rendering completely on stop; it asks VSTs to clear buffers when resuming, but noncompliant plugins may emit stale tails. Export can prerender up to 20 seconds of silence to flush state and can throttle for disk-streaming plugins. [C-037]

**UNKNOWN —** DPI scaling rules for third-party editors, detachable versus embedded semantics, headless instantiation, UI state persistence, accessibility of plugin UIs, scan logs suitable for automation, and guaranteed crash recovery of unsaved plugin edits remain unestablished. [C-027]

## 12. Extensibility and integration

**DOCUMENTED —** OpenMPT itself is open source. libopenmpt exposes a cross-platform C/C++ module-decoder API that renders modules to PCM, and is developed in the same repository as the tracker playback code. [C-006] [C-024]

**DOCUMENTED —** Integration surfaces include VST1/2/DMO hosting, MIDI I/O and mappings, tracker MIDI macros, module/sample/instrument file formats, audio/MIDI export, and the built-in MIDI routing plugin. [C-010] [C-013] [C-019]

**UNKNOWN —** No stable tracker scripting API, controller SDK, OSC/remote API, native-device authoring SDK, or documented semantic-version contract for project extensions was identified. Source availability is not equivalent to a supported extension API. [C-026]

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED —** OpenMPT reads and writes MOD, S3M, XM, IT, MPTM, and imports MIDI; numerous legacy module formats are import/read-only and internally converted with possible loss. MPTM is the native full-feature format; IT is the broader legacy exchange choice. [C-004]

**DOCUMENTED —** Plugin state and routes are OpenMPT extensions and survive normal extended saves/missing binaries, but are stripped by strict compatibility export. MPTM external samples persist paths plus module-side metadata rather than waveform data. [C-020] [C-021] [C-032]

**DOCUMENTED —** Saving can create an overwrite backup. Autosave stores changed open tracks at a configured interval, keeps a configured generation count/location, reports failure, and disables itself after failure. [C-021]

**DOCUMENTED —** Export covers PCM/lossless/lossy streams, MIDI, OPL data where applicable, and compatibility-clean IT/XM. MIDI conversion is explicitly not lossless. [C-008] [C-010]

**UNKNOWN —** No AAF, OMF, ADM, MusicXML, DAWproject, cloud collaboration, version-control merge format, transactional journal, automatic plugin-asset collection, or robust external-sample relinker was documented. No claim of unsupported behavior is made beyond the examined export surface. [C-029] [C-030]

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED —** Delivery features center on audio stream export with rate/depth/dither, normalization, tags, cues, selection/subsong/repeat limits, channel/instrument stems, and render-to-sample. OPL modules can export VGM/VGZ/DRO; MIDI stems support remix workflows. [C-008]

**DOCUMENTED —** The tracker specializes in compact module/chiptune/game-music workflows, format-compatible replay, reusable patterns, subsongs/sequences, samples, and OPL synthesis. [C-003] [C-004] [C-012]

**UNKNOWN —** DDP, loudness targets, video/ADR, timecode, surround/immersive/ADM delivery, show control, set-list performance, and live redundancy are not established. [C-029]

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED —** 64-bit OpenMPT removes the 4 GB address-space constraint for samples/plugins, but many opposite-bitness plugins incur bridge overhead; users with many 32-bit plugins are advised to run 32-bit OpenMPT. [C-001] [C-015]

**DOCUMENTED —** Reliability controls include autosave generations, overwrite backups, scan-crash remembrance, bridge-first scanning with possible native fallback, optional runtime bridge isolation, caught-process exception bypass, missing-plugin state retention, and export workarounds. [C-020] [C-021] [C-022] [C-033]

**DOCUMENTED —** The trust boundary is mixed: same-architecture VSTs default in-process; bridges contain many crashes but add latency; compatibility mode can disable DEP/LAA/ASLR. libopenmpt deliberately avoids enumerating untrusted system DMOs. [C-015] [C-022] [C-024]

**DOCUMENTED —** Some format limits are explicit: extended IT can reach 127 channels and XM 128, while compatibility export lowers limits. Plugin slots are fixed at 250. [C-004] [C-011]

**UNKNOWN —** No benchmarked scaling, multicore model, memory guard, plugin CPU quota, signed-plugin policy, telemetry/privacy statement, WCAG/accessibility conformance, screen-reader matrix, localization coverage, or tested ARM plugin matrix was established. [C-028] [C-030]

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED —** The tagged root `LICENSE` is the BSD 3-Clause license: source and binary redistribution/modification are allowed with notice/disclaimer conditions, and project/contributor names may not endorse derived products without permission. [C-023]

**DOCUMENTED —** libopenmpt shares the repository/playback code family but is a decoder API, not a grant to reuse OpenMPT branding or third-party content/plugins. [C-024]

**INFERENCE/legal caution —** OpenMPT’s BSD license does not grant VST/DirectX SDK, trademark, plugin-binary, sample, preset, or module-content rights. A new host must independently satisfy current format-owner terms and dependency notices. This is not legal advice. [C-023]

**DOCUMENTED —** VST3 is not implemented, so a third-party VST2 shell does not change OpenMPT’s native licensing or compatibility claim. DMO hosting relies on Windows registration/COM and is unavailable as the same contract in libopenmpt. [C-013] [C-034]

**UNKNOWN —** A complete transitive third-party-license audit and current VST2 SDK provenance were outside this architecture pass. [C-030]

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED:** explicit, compact module graph with reusable patterns/sequences and embedded samples/instruments supports portable tracker projects. [C-003] [C-004]
- **DOCUMENTED:** MPTM separates full-fidelity authoring from compatibility-clean export, making loss visible. [C-032]
- **DOCUMENTED:** VST scan cache, failed-scan marker, per-instance bridge, and preserved missing-plugin state provide pragmatic resilience for legacy plugins. [C-014] [C-015] [C-020] [C-033]
- **DOCUMENTED:** render-to-sample and channel/instrument stem export fit tracker workflows without requiring conventional audio tracks. [C-008]
- **DOCUMENTED:** shared playback code plus a narrow cross-platform libopenmpt decoder boundary avoids conflating editor/plugin hosting with safe decoding. [C-024]

### Liabilities

- **INFERENCE, high confidence:** lack of PDC compromises timing through latent/parallel paths. [C-017]
- **DOCUMENTED:** stereo-only connection/fold-down discards independently routable extra VST outputs and sidechains. [C-016] [C-036]
- **DOCUMENTED:** VST3 and modern cross-platform plugin formats are absent. [C-013]
- **DOCUMENTED:** cross-bitness bridges cost latency; compatibility mode can weaken exploit mitigations. [C-015] [C-022]
- **DOCUMENTED:** name/ID fallback can substitute a different plugin binary; strict interchange removes plugin state. [C-032] [C-038]
- **UNKNOWN:** sample-accurate automation, tails, modern expression, signed validation, multicore scheduling, and ARM plugin compatibility remain unqualified. [C-027] [C-028]

### Architecture lesson

OpenMPT is most useful as a reference for tracker object models, module persistence, and bounded legacy-host recovery. A new DAW should retain explicit failures and portability modes while supplying a richer graph, stable identities, PDC, independent buses, sample-accurate events, and a stronger default trust boundary.

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites | Tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Reuse musical structure compactly | Immutable/reusable pattern objects referenced by ordered sequences; channels carry row events | [C-003] [C-004] | Tracker-oriented editor and deterministic format semantics | Efficient and inspectable; less natural for freeform audio regions | Medium: tracker assumptions can leak into a general DAW | `CANDIDATE` |
| Make interchange loss explicit | Native rich format plus a validator/compatibility export that enumerates removed features | [C-004] [C-032] | Feature-capability model and deterministic conversion report | Two fidelity levels; user confusion if warnings are weak | Low | `CANDIDATE` |
| Recover from scanner crash | Write “currently scanning” marker before initialization; clear only after success; ask before retry | [C-033] | Durable settings and separate scanner process | A stale marker can false-positive after forced shutdown | Low | `CANDIDATE` |
| Preserve unavailable dependencies | Keep plugin identity, opaque state, route, and parameters when binary is absent; report one actionable missing item | [C-020] | Versioned state envelope and non-destructive project loader | Opaque state may be uninspectable or malicious | Medium | `CANDIDATE` |
| Balance isolation and inter-instance needs | Per-instance worker by default; explicit shared worker per plugin family | [C-015] | IPC bridge, architecture adapters, failure UI | IPC latency; shared mode expands blast radius | High: security model must be stronger than crash-only isolation | `CONDITIONAL` |
| Prevent routing cycles cheaply | Allow plugin output only to a later topological slot | [C-011] | Ordered slot graph | Simple, deterministic; restricts arbitrary graph edits/feedback | Low | `CANDIDATE` for simple modes |
| Commit/bounce tracker material | Offline render directly into an internal sample asset | [C-008] | Deterministic offline render and asset provenance | Becomes destructive without source linkage/versioning | Medium | `CONDITIONAL` |
| Reduce duplicate sample storage | Optional external waveform reference while storing playback metadata in-project | [C-021] | Content IDs, path relinking, collect/package workflow | Mutable and missing external files | High unless upgraded to content-addressed assets | `CONDITIONAL` |

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected product mechanisms

- **REJECT:** consume plugin latency without graph compensation. Evidence: no consumer at immutable tag. Reopen only if a later release adds documented PDC. [C-017]
- **REJECT:** silently fold all extra plugin outputs into stereo. It preserves sound presence but destroys independent routing. [C-036]
- **REJECT:** disable DEP/LAA/ASLR as an ordinary compatibility default. If retained at all, isolate it behind explicit risk acknowledgement and stronger OS containment. [C-015] [C-022]
- **REJECT:** name-only or ID-only plugin substitution without a visible migration decision and content/version fingerprint. [C-038]
- **REJECT:** adding proprietary features as hidden extensions to interchange formats. OpenMPT’s own compatibility history shows why a native extension container is safer. [C-032]
- **REJECT:** present third-party VST3 shell translation as native VST3 support. [C-013]

### CURIOSITY_NO_GO research threads

- `CURIOSITY_NO_GO`: OpenMPT 1.33 development builds — not stable at cutoff and would blur the decision scope.
- `CURIOSITY_NO_GO`: third-party `vst3shell` qualification — outside the native host contract; would require executing untrusted plugins.
- `CURIOSITY_NO_GO`: exhaustive legacy importer-by-importer fidelity — low novelty after the conversion boundary was established.
- `CURIOSITY_NO_GO`: DXi COM archaeology — current dispatcher clearly enumerates DMO audio effects, and historical DXi behavior would not change the current architecture conclusion.
- `CURIOSITY_NO_GO`: opaque plugin-state reverse engineering — plugin-controlled/proprietary and unnecessary once the state envelope was established.
- `CURIOSITY_NO_GO`: full codec inventory — delivery architecture is already represented.
- `CURIOSITY_NO_GO`: full transitive dependency-license audit — belongs to procurement/legal review, not this product dossier.
- `CURIOSITY_NO_GO`: independent market-share ranking — low decision value and no suitable primary measurement.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Result | Evidence and counterevidence |
| --- | --- | --- |
| H1: primary model is module → sequences/orders → patterns/rows/channels plus samples/instruments | **SUPPORTED** | Official Basics and Module Formats describe precisely this object graph. [C-003] [C-004] |
| H2: current host supports VST2/VST3 and legacy DirectX | **PARTLY FALSIFIED** | VST1/2 and DMO effects are supported; VST3 is explicitly not supported; DXi instruments were not found. [C-013] [C-034] |
| H3: plugin latency and multi-I/O are narrower than mainstream DAWs | **SUPPORTED** | No PDC consumer; stereo pins; extra outputs fold down; sidechain future-work comment. [C-016] [C-017] [C-036] |
| H4: module persistence embeds plugin state but portability depends on format/binaries/assets | **SUPPORTED** | FX/CHFX chunks, missing placeholders, compatibility stripping, and optional external samples. [C-020] [C-021] [C-032] |
| H5: libopenmpt is playback/library boundary, not full tracker host | **SUPPORTED** | Official API is module-to-PCM; source suppresses untrusted DMO enumeration outside tracker. [C-024] |
| “Format accepted” versus full contract | **ADVERSE RESULT** | VST2 is accepted/scanned/instantiated, but PDC, sidechains, independent outputs, sample-accurate automation, tails, and modern expression are absent or unknown. [C-016] [C-017] [C-027] |
| Scanner assumed in-process | **FALSIFIED** | Immutable source explicitly scans fresh VSTs separately; ordinary native runtime remains in-process. [C-033] |
| Manual’s broad “DirectX plugin” label implies DXi | **NOT PROVEN** | Source enumerates DirectShow audio-effect DMOs only. [C-034] |

Later safe probes should use disposable test fixtures: an impulse-through-latency VST2, multi-output synthetic VST2, dynamic-I/O VST2, automation timestamp logger, state/missing/replacement fixture, scanner-crash fixture, and x86/amd64/ARM build matrix. No such binaries were run in this documentary wave.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Stable OpenMPT is 1.32.11.00 (2026-08-15); Windows installer covers x86/amd64/ARM/ARM64, Windows 7 SP1+, with package-specific floors and Wine support; no native non-Windows edition. | Stable desktop at cutoff | S-001, S-002 | Official release/download | Wine is not a native edition; ARM plugin behavior not implied. |
| C-002 | DOCUMENTED | High | OpenMPT is actively maintained, public-source Open ModPlug Tracker software. | Product identity | S-001, S-002, S-011 | Release and repository | No independent popularity/market-share claim. |
| C-003 | DOCUMENTED | High | Module model comprises globals, patterns, sequences/orders, samples, instruments, plugins; channels are one-event tracker lanes. | Current manual | S-003 | Direct manual definitions | Auxiliary views do not alter persisted model. |
| C-004 | DOCUMENTED | High | MOD/S3M/XM/IT/MPTM are editable module families; MPTM is richest; many legacy formats are read-only conversions; MIDI import/export is lossy. | Current manual | S-004, S-010 | Direct format/export docs | Runtime fidelity not independently measured. |
| C-005 | DOCUMENTED | High | Samples are sound sources; instruments map samples/envelopes or plugins; OPL/sample behavior is format-specific. | Current manual | S-003, S-013 | Direct docs | Exact per-format limits omitted where not decision-critical. |
| C-006 | DOCUMENTED | High | Public source separates tracker/VST host, bridge, sound library/DSP, and libopenmpt API trees. | Tag 1.32.11.00 | S-011 | Immutable paths | Does not prove runtime threading. |
| C-007 | DOCUMENTED | High | Sample engine resamples/interpolates and ramps; compatibility resamplers preserve legacy character. | Current manual | S-009 | Mixer documentation | Internal arithmetic precision unknown. |
| C-008 | DOCUMENTED | High | Offline export supports common streams, dither/rate/depth, normalize, cues, channel/instrument stems, slow render, and render-to-sample. | Current manual | S-010 | Direct docs | Shared/master effect treatment of stems not tested. |
| C-009 | DOCUMENTED | High | Pattern and sample editing are tracker/waveform based; sample transforms are destructive with local undo/redo. | Current manual | S-003, S-013 | Direct docs | No complete undo architecture was inspected. |
| C-010 | DOCUMENTED | High | MIDI input/output, 16-channel instrument routing, selected CC/RPN/SysEx import, lossy 480-PPQ export, and no staff view/general MIDI editor are documented. | Current manual | S-004, S-006, S-016 | Direct docs | MPE/MIDI2 not established. |
| C-011 | DOCUMENTED | High | 250 plugin slots form forward-only audio/MIDI chains to higher slots/master; channel/instrument routing and mix controls are explicit. | Current manual | S-007 | Direct docs | No arbitrary graph/feedback. |
| C-012 | DOCUMENTED | High | Native devices include sample/OPL engines and built-in DSP, LFO, DMO, and MIDI I/O plugins. | Current/tagged | S-011, S-013, S-016 | Source registration + docs | Not a third-party native-device SDK. |
| C-013 | DOCUMENTED | High | Host dispatcher supports VST1/2 and DMO/built-ins; VST3 is explicitly unsupported; no required modern/other format implementations exist at tag. | OpenMPT 1.32.11.00 | S-005, S-006, S-011 | Manual plus complete tagged dispatcher | “No implementation” is version-scoped, not perpetual. |
| C-014 | DOCUMENTED | High | Manual file/folder scan, persistent plugin cache, path/shell dedupe, IDs/vendor/category/arch/bridge metadata, and search tags are implemented. | OpenMPT 1.32.11.00 | S-005, S-011 | Manual and source | No code-sign validation demonstrated. |
| C-015 | DOCUMENTED | High | Same-arch VST normally runs in-process; x86/amd64 mismatch auto-bridges; forced/per-instance/shared bridge modes trade containment against latency/blast radius; compatibility mode weakens mitigations. | Windows VST1/2 | S-001, S-005, S-006, S-011 | Manual + source | ARM cross-architecture support unknown. |
| C-016 | DOCUMENTED | High | VST contract connects stereo pins, disables extra pins, lacks current sidechain, and folds extra outputs; audio/MIDI are chained. | Tag 1.32.11.00 | S-007, S-011 | Source process path | Some plugin-specific hacks may vary. |
| C-017 | INFERENCE | Medium-high | OpenMPT 1.32.11.00 has no plugin delay compensation despite reading reported latency. | Tag 1.32.11.00 | S-011 | Exhaustive `GetLatency`/`initialDelay` source searches found no consumer/delay path | A differently named hidden mechanism is possible; dynamic impulse probe remains. |
| C-018 | DOCUMENTED | High | Host supports custom/generic plugin UI, parameter/program controls, resize request, and FXP/FXB preset/bank operations. | Current manual/tag | S-007, S-008, S-011 | Direct UI docs/source | DPI/headless/accessibility unknown. |
| C-019 | DOCUMENTED | High | Plugin automation is recorded in patterns via XM/IT smooth MIDI macros or MPTM Parameter Control events; MIDI mapping and plugin MIDI record exist. | Current manual | S-008, S-016 | Direct docs | Sample accuracy unknown. |
| C-020 | DOCUMENTED | High | Plugin identity, opaque state, program/mix data and channel assignment persist; missing binaries preserve slots/state and are reported. | Extended IT/XM/MPTM saves | S-010, S-011 | Source save/load paths | Future successful replacement not dynamically tested. |
| C-021 | DOCUMENTED | High | MPTM may externally reference mutable sample waveforms; autosave generations and overwrite backups are configurable. | Current manual | S-013, S-015 | Direct docs | Relinking/collect workflow unknown. |
| C-022 | DOCUMENTED | High | Reliability/security controls include bridge containment, exception bypass, crash marker/dumps, but native plugins share host trust and compatibility can disable mitigations. | Current/tagged | S-005, S-006, S-011 | Manual/source | No hostile-plugin security evaluation. |
| C-023 | DOCUMENTED | High | OpenMPT root code is BSD 3-Clause with notice/disclaimer/no-endorsement conditions. | Tag 1.32.11.00 | S-011 | Root LICENSE | Dependencies/content have separate rights. |
| C-024 | DOCUMENTED | High | libopenmpt is a cross-platform C/C++ module-to-PCM decoder in the same repository, current 0.8.9 at cutoff; tracker-only DMO enumeration is excluded from library boundary. | 2026-08-29 | S-001, S-002, S-011, S-012 | Official site/source | It is not the full editor/plugin host. |
| C-025 | DOCUMENTED | High | OpenMPT is sample/module-centric; audio delivery and MIDI recording exist. | Current manual | S-010, S-013, S-016 | Direct docs | Does not prove conventional live audio recording. |
| C-026 | UNKNOWN | Medium | Stable scripting, native-device SDK, OSC/remote/controller API were not located. | Current product | S-003, S-011, S-016 | Manual/source surface reviewed | Absence search cannot prove no hidden/undocumented API; inspect developer docs. |
| C-027 | UNKNOWN | High as unknown | Sample-accurate automation/MIDI, tails, MPE/MIDI2, code-sign validation, advanced bus semantics, headless/DPI guarantees are unqualified. | Plugin host | S-005 through S-011, S-016 | Required areas searched | Dynamic fixtures and deeper API traces needed. |
| C-028 | UNKNOWN | High as unknown | Thread scheduler, multicore model, engine precision, dropout diagnostics, and oversampling are not established. | Audio engine | S-009, S-011 | Manual plus source keyword review | Deeper code analysis/dynamic profiling required. |
| C-029 | UNKNOWN | High as unknown | Professional interchange/collaboration/live/post features beyond documented audio/MIDI/module exports are not established. | Current product | S-004, S-010 | Export surface reviewed | Absence is not formal unsupported claim. |
| C-030 | UNKNOWN | High as unknown | External-sample relinking/collect, accessibility conformance, ARM plugin matrix, and transitive license obligations remain unresolved. | Current product/ecosystem | S-001, S-011, S-013 | Relevant surfaces reviewed | Separate qualification/audit needed. |
| C-031 | UNKNOWN | Medium | Conventional clips/takes/comping and nonlinear arrangement facilities were not found in tracker conceptual docs. | Workflow | S-003, S-004 | Official model reviewed | Auxiliary features could exist; safe product probe needed. |
| C-032 | DOCUMENTED | High | Compatibility export strips plugin configuration/assignments and automation from IT/XM; full fidelity belongs in MPTM/extensions. | Current manual | S-004, S-010 | Direct export table | Exact effects of every extension not repeated here. |
| C-033 | DOCUMENTED | High | Fresh VST scan first tries modern/legacy bridge processes, but can fall back to native loading; folder scan is cancellable, marks the in-progress path, reports exceptions, and prompts after a previous initialization crash. | Tag 1.32.11.00 | S-011 | `Mptrack.cpp`, `PluginManager.cpp`, `Vstplug.cpp`, scan dialog | Timeout and hostile scanner containment unknown; fallback weakens isolation. |
| C-034 | DOCUMENTED | High | Current DirectX support enumerates Windows DirectShow audio-effect DMOs; DXi instrument hosting was not found; libopenmpt omits untrusted DMO enumeration. | Tag 1.32.11.00 | S-005, S-011 | Registry category/source dispatcher | Matrix keeps DXi explicitly unknown. |
| C-035 | DOCUMENTED | High | VST I/O-change callback reallocates buffers; processing precision is 32-bit and block lengths may vary. | Tag 1.32.11.00 | S-006, S-011 | FAQ and source | Exposed route remains stereo. |
| C-036 | DOCUMENTED | High | VST output channels beyond stereo are summed/folded into the first stereo pair. | Tag 1.32.11.00 | S-011 | Direct process loop | Does not provide independent multi-out buses. |
| C-037 | DOCUMENTED | High | Stop halts rendering; stale plugin tails can reappear; export offers silence preroll and slow rendering workarounds. | Current manual | S-006, S-010 | Direct docs | No tail-report contract. |
| C-038 | DOCUMENTED | High | Recall ranks name+ID+shell, then weaker ID/name matches, preferring native architecture and rewriting loaded identity. | Tag 1.32.11.00 | S-011 | `PluginManager.cpp` matching | Collision/substitution risk; no content hash. |

## 22. Source ledger and adaptive bibliography

All web/repository text was treated as untrusted evidence, not instructions. Access date for every source: **2026-08-29**.

- **S-001 — “Download.”** Publisher: OpenMPT Project. URL: <https://openmpt.org/download>. Kind: official current download/system matrix. Scope: OpenMPT 1.32.11.00. Relevant passages: stable release/date; Windows/Wine floors; x86/amd64/ARM/ARM64 packages; 32/64 plugin guidance; BSD link; source/libopenmpt links. Claims: C-001, C-002, C-015, C-024. Limitations: product documentation, not independent runtime testing. Selection rationale: authoritative cutoff identity and architecture packaging; preferable to search snippets or mirrors.
- **S-002 — “OpenMPT 1.32.11.00 released.”** Publisher: OpenMPT Project. URL: <https://openmpt.org/openmpt-1-32-11-00-released>. Kind: official release note. Scope: 2026-08-15 release. Relevant passage: maintenance fixes and linked matching libopenmpt updates. Claims: C-001, C-002, C-024. Limitations: delta only. Rationale: pins maintained status and date; preferable to third-party version databases.
- **S-003 — “Manual: Basics,” revision 4818.** Publisher: OpenMPT Wiki/Project. Immutable URL: <https://wiki.openmpt.org/index.php?title=Manual:_Basics&oldid=4818>. Kind: official manual. Scope: conceptual model. Relevant sections: Nomenclature; Modules; MDI/tabs. Claims: C-003, C-005, C-009, C-026, C-031. Limitations: page last edited 2025-03-26. Rationale: primary definitions; preferable to tracker tutorials.
- **S-004 — “Manual: Module formats,” revision 4901.** Publisher: OpenMPT Wiki/Project. Immutable URL: <https://wiki.openmpt.org/index.php?title=Manual:_Module_formats&oldid=4901>. Kind: official manual. Scope: editable/imported formats. Relevant sections: MOD/S3M/XM/IT/MPTM/MIDI; Choosing; read-only formats. Claims: C-004, C-005, C-010, C-029, C-032. Limitations: format summary, not byte-level spec or differential playback test. Rationale: authoritative interchange boundary.
- **S-005 — “Manual: Plugin Manager,” revision 4881.** Publisher: OpenMPT Wiki/Project. Immutable URL: <https://wiki.openmpt.org/index.php?title=Manual:_Plugin_Manager&oldid=4881>. Kind: official manual. Scope: current plugin registration/bridge UI. Relevant sections: list/new/scan/remove; Plugin Bridge. Claims: C-013, C-014, C-015, C-022, C-034. Limitations: omits cache schema/scanner implementation. Rationale: authoritative user contract; source S-011 fills implementation-sensitive gaps.
- **S-006 — “Manual: Frequently Asked Questions,” revision 5011.** Publisher: OpenMPT Wiki/Project. Immutable URL: <https://wiki.openmpt.org/index.php?title=Manual:_Frequently_Asked_Questions&oldid=5011>. Kind: official FAQ. Scope: 2026-05-09. Relevant sections: plugin chaining; variable buffers; bitness bridge; stop/tails; VST3; MIDI/module limitations; crash dumps. Claims: C-004, C-010, C-013, C-015, C-035, C-037. Limitations: troubleshooting statements, not complete host contract. Rationale: directly answers VST3/bitness/tail questions.
- **S-007 — “Manual: General,” revision 4909.** Publisher: OpenMPT Wiki/Project. Immutable URL: <https://wiki.openmpt.org/index.php?title=Manual:_General&oldid=4909>. Kind: official manual. Scope: routing/plugin setup. Relevant sections: Channel Setup; Plugin Setup; Mix Settings. Claims: C-011, C-016, C-018. Limitations: UI describes I/O only as none/mono/stereo; tagged source resolves hidden multi-output fold-down. Rationale: authoritative routing semantics.
- **S-008 — “Manual: Plugin Window,” revision 4880.** Publisher: OpenMPT Wiki/Project. Immutable URL: <https://wiki.openmpt.org/index.php?title=Manual:_Plugin_Window&oldid=4880>. Kind: official manual. Scope: UI/presets/automation/MIDI. Claims: C-018, C-019. Limitations: no DPI/headless/accessibility contract. Rationale: best primary UI and recording source.
- **S-009 — “Manual: Setup/Mixer,” revision 4762.** Publisher: OpenMPT Wiki/Project. Immutable URL: <https://wiki.openmpt.org/index.php?title=Manual:_Setup/Mixer&oldid=4762>. Kind: official manual. Scope: sample mixer. Relevant sections: resampling/ramping/legacy. Claims: C-007, C-028. Limitations: no PDC/threading detail; that negative result motivated S-011. Rationale: primary mixer controls, preferable to forum descriptions.
- **S-010 — “Manual: Saving and exporting,” revision 5038.** Publisher: OpenMPT Wiki/Project. Immutable URL: <https://wiki.openmpt.org/index.php?title=Manual:_Saving_and_exporting&oldid=5038>. Kind: official manual. Scope: current through 2026-08-15. Relevant sections: saving, stream render/plugin quirks, MIDI, compatibility export, portability. Claims: C-004, C-008, C-010, C-020, C-029, C-032, C-037. Limitations: does not define plugin chunk binary layout. Rationale: authoritative persistence/delivery surface.
- **S-011 — OpenMPT source tag `OpenMPT-1.32.11.00`, commit `6b8bae0dc341ada3ad689e8d79e006241920185c`.** Publisher: OpenMPT Project. Repository/tag: <https://github.com/OpenMPT/openmpt/tree/OpenMPT-1.32.11.00>. Kind: immutable public source and license. Key paths/passages: `LICENSE`; `soundlib/plugins/PluginManager.cpp` lines 184-210, 320-418, 457-577, 607-718; `soundlib/plugins/PluginManager.h` lines 24-52, 104-150; `mptrack/Mptrack.cpp` lines 2344-2456; `mptrack/SelectPluginDialog.cpp` lines 412-475; `mptrack/Vstplug.cpp` lines 526-578, 992-1105, 1531-1611; `mptrack/Vstplug.h` latency/I/O accessors; `soundlib/plugins/PlugInterface.h` latency/state interface; `soundlib/Load_it.cpp` lines 2120-2290; `soundlib/Sndfile.cpp` lines 730-815; `pluginBridge/*` process/state transport. Claims: C-002, C-006, C-012 through C-024, C-026 through C-028, C-033 through C-038. Limitations: source interpretation, no build/execution; negative PDC conclusion remains inference. Rationale: exact release provenance and the only primary evidence for scan/cache/state/I/O/PDC internals; preferable to mutable branch or community reports.
- **S-012 — “libopenmpt and openmpt123.”** Publisher: OpenMPT Project. URL: <https://lib.openmpt.org/libopenmpt/>. Kind: official library product page/news. Scope: current at cutoff, including 0.8.9 security update. Claims: C-024. Limitations: high-level API boundary, not full ABI manual. Rationale: canonical statement that libopenmpt decodes modules to PCM and shares the repository.
- **S-013 — “Manual: Samples,” revision 4983.** Publisher: OpenMPT Wiki/Project. Immutable URL: <https://wiki.openmpt.org/index.php?title=Manual:_Samples&oldid=4983>. Kind: official manual. Scope: sample model/assets/editing. Claims: C-005, C-009, C-012, C-021, C-025, C-030. Limitations: no broken-path relinker/collect behavior. Rationale: authoritative external-sample boundary.
- **Unnumbered negative retrieval — “Manual: Setup/General,” revision 4788.** Publisher: OpenMPT Wiki/Project. Immutable URL: <https://wiki.openmpt.org/index.php?title=Manual:_Setup/General&oldid=4788>. Kind: official manual/negative retrieval. Scope: general options. Claims: none material. Limitations: selected via an imprecise recovery link and did **not** contain autosave details. Rationale: retained negative result rather than silently discarding; S-015 is the accessible correct source.
- **S-015 — “Manual: Setup/Paths / Auto Save,” revision 4904.** Publisher: OpenMPT Wiki/Project. Immutable URL: <https://wiki.openmpt.org/index.php?title=Manual:_Setup/Paths_/_Auto_Save&oldid=4904>. Kind: official manual. Scope: paths, backups, autosave. Claims: C-021. Limitations: no crash-journal guarantee. Rationale: canonical recovery settings, replacing the unnumbered nonresponsive retrieval.
- **S-016 — “Manual: MIDI Reference,” revision 4896.** Publisher: OpenMPT Wiki/Project. Immutable URL: <https://wiki.openmpt.org/index.php?title=Manual:_MIDI_Reference&oldid=4896>. Kind: official manual. Scope: MIDI input/output and built-in routing. Claims: C-010, C-012, C-019, C-025, C-027. Limitations: includes general MIDI background; only OpenMPT Setup sections were treated as implementation evidence. Rationale: canonical device/plugin routing source.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / available evidence | Blocker and impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| PDC dynamic behavior | Manual search; exhaustive tagged `GetLatency`, `initialDelay`, mixer-delay source searches; no consumer found | Negative-source inference, not execution; affects phase/timing architecture | Disposable VST2 impulse-delay fixture on dry/parallel/serial routes; measure exported samples | Unassigned audio-host qualifier |
| Sample-accurate automation/MIDI | Plugin-window/pattern docs and event source reviewed | No timestamp/offset guarantee; affects modulation accuracy | VST2 event logger recording sample offsets during realtime/offline render | Unassigned interoperability lab |
| Tail reporting and offline equivalence | Stop/export workaround docs reviewed | No tail-length API/host contract found; affects truncation | Synthetic infinite/finite-tail VST2 and export boundary tests | Unassigned interoperability lab |
| ARM/ARM64 VST and bridging | ARM app packages and source architecture enum found; manuals only specify 32/64 bridging | Third-party binaries/toolchains unavailable; affects platform promise | Signed benign ARM64 VST2 plus x86/amd64 controls on Windows ARM | Unassigned platform qualifier |
| DMO/DXi bitness/instruments | Registry category and DMO source dispatcher inspected | DXi category absent; no runtime probe | Benign registered DMO and DXi fixtures on x86/amd64; observe enumeration/instantiation | Unassigned Windows qualifier |
| Scan validation/security | Cache/crash-marker/scanner source reviewed | No signing, timeout, validator, or quarantine contract found | Scanner fault-injection fixture: hang, crash, malformed PE, duplicate IDs | Unassigned security lab |
| Missing-plugin migration fidelity | Save/load/match source reviewed | No real replacement/version matrix; ID/name fallback risk | Save state, remove binary, resave, restore old/new/colliding binaries, byte/behavior compare | Unassigned persistence lab |
| External sample relink/collect | MPTM external-sample manual reviewed | No path relocation/package contract found; portability risk | Move project/assets across drives; inspect relative/absolute paths and UI recovery | Unassigned persistence lab |
| Multicore/threading/internal precision | Mixer manual and source layout/keyword searches | Deep scheduler analysis exceeded budget; performance decisions blocked | Focused source audit plus profiler under deterministic module/plugin loads | Unassigned engine researcher |
| Conventional audio recording/comping | Basics, sample, export and MIDI manuals reviewed | No authoritative recorder workflow found | Safe UI/manual qualification; no third-party plugin needed | Unassigned workflow researcher |
| Accessibility/localization/privacy | Current release/manual surfaces reviewed | No conformance or telemetry statement retained | Dedicated accessibility/privacy documentation search and UI audit | Unassigned quality researcher |
| Format/dependency legal obligations | Root BSD license read | Transitive SDK/dependency/content rights out of scope | Counsel-led SBOM/license and trademark review, especially any VST2 provenance | Unassigned legal/procurement owner |

## 24. Curiosity pass and stop decision

### Ranked candidate follow-ups

Scores are 1–5; higher relevance/value/novelty is better, while lower cost is better.

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Immutable tagged source for PDC, state, I/O, scan/cache | 5 | 5 | 5 | 3 | **PURSUED**; changed conclusions on scanning, PDC, multi-output, placeholders |
| Dynamic VST2 conformance fixture suite | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO` in documentary wave; requires binary execution/test harness |
| ARM plugin matrix | 4 | 4 | 4 | 5 | `CURIOSITY_NO_GO`; no safe fixtures/hardware in scope |
| DXi historical/category investigation | 3 | 2 | 2 | 3 | `CURIOSITY_NO_GO`; current source already bounds DMO host path |
| More official UI/manual pages | 2 | 2 | 1 | 2 | `CURIOSITY_NO_GO`; duplicate/saturation threshold reached |
| Community plugin compatibility reports | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO`; cannot prove host architecture and likely version-specific |
| Full dependency-license audit | 3 | 3 | 3 | 5 | `CURIOSITY_NO_GO`; separate legal/procurement decision |

### Gaps, contradictions, and negative results

- Search text was treated as untrusted discovery evidence and never cited as a claim source.
- One web search for mixer/PDC evidence returned HTTP 429; direct official manual URLs were available, so no retry loop was pursued.
- Lexicographically tailing remote tags initially failed to reveal the OpenMPT tag; a bounded exact ref query found `OpenMPT-1.32.11.00` at the cited commit.
- `Manual:_Setup/General` did not contain autosave details; the unnumbered negative result records that attempt and the correct official page is S-015.
- Initial scanner hypothesis was corrected: fresh scanning is bridge-first but may fall back to native loading; ordinary native runtime remains in-process.
- “DirectX plugins” in the user manual was narrowed by source to registered DirectShow audio-effect DMOs; DXi stays explicit rather than inferred.
- UI “mono/stereo” language and source multi-output buffers are reconciled by the source’s fold-down implementation, not treated as a contradiction.

### Stop decision

**STOP — coverage and saturation reached.** Every required heading and plugin row has an evidence-backed result or explicit unknown. The highest-value source thread resolved the material architecture questions; subsequent manual passes added recovery/MIDI detail without changing leading conclusions. Remaining questions require dynamic fixtures, deeper engine profiling, platform hardware, or legal review. More documentary searching has nonpositive expected marginal evidence within the assigned scope and depth budget.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created `research/daw-landscape/dossiers/openmpt.md`; no sibling/governing file was modified.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0 pins OpenMPT 1.32.11.00, 2026-08-15, Windows/Wine, packaging variants, and exclusions.
- [x] **Every required dossier heading exists in order.** Sections 0 through 25 are present, including 11.1–11.6.
- [x] **Every material assertion has a claim ID and classification.** Substantive findings cite C-001 through C-038; synthesis labels documented/inference/unknown.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Section 21 maps sources/reasoning/limits; Sections 23–24 retain blockers and probes.
- [x] **Every required plugin-format row is present.** VST2, VST3, AUv2, AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, Rack Extension, and product-native/other are explicit.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Scanning/cache/identity/isolation/I/O/MIDI/automation/state/UI/PDC/render/failure are covered.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Source-derived no-PDC remains an inference; advanced contract gaps remain unknown.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 and C-023/C-024 distinguish BSD code, libopenmpt, SDK/content/trademark rights, and no legal advice.
- [x] **Bibliography records source rationale and limitations.** Section 22 includes passages, scope, claims, limits, and preference rationale for S-001–S-013 and S-015–S-016, plus the unnumbered negative retrieval.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24 rank/preserve pursued and rejected threads.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Only public pages and public immutable source were read; no OpenMPT/plugin binary was built or run.

**Owned path:** `research/daw-landscape/dossiers/openmpt.md`.

**Checks performed:** governing-file review; all-heading/matrix/source/claim/unknown/curiosity/checklist audit; immutable tag/commit verification; pre/post workspace status comparison; no-stage/no-commit check.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; decision-critical plugin and persistence behavior is source-cited, with dynamic qualification deferred.

**Unresolved blockers:** dynamic PDC/event/tail/migration tests, ARM/DXi fixtures, deep engine scheduler analysis, accessibility/privacy review, and dependency/legal audit.

**Pre-existing workspace changes:** numerous modified/untracked paths outside this dossier were present before research, including the untracked `research/daw-landscape/` tree; all were left untouched.
