# Qtractor DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Qtractor |
| Canonical upstream | Rui Nuno Capela (`rncbc`), `qtractor.org`, and `rncbc/qtractor` |
| Researcher/session ID | `ses_fb26e5bedffeaonjBGsZ7T405w` |
| Owned path | `research/daw-landscape/dossiers/qtractor.md` |
| Research date and cutoff | 2026-08-29 UTC |
| Current release in scope | Qtractor 1.6.2, released 2026-07-15; source pinned to commit `a037350ff81ec1cd0a5394aa2907f732e8d5b217` [C-001] |
| Editions/builds | No product-edition tiers were established. Source features and distribution binaries are not equivalent because plugin formats and integrations are dependency- and build-gated. [C-002] [C-037] |
| Platforms | Upstream target is Linux desktop. PipeWire is addressed through its JACK compatibility layer, not an evidenced native PipeWire backend. No upstream macOS, Windows, mobile, or browser edition was established. [C-002] [C-007] |
| Included | Current upstream product, immutable 1.6.2 source, Linux audio/MIDI architecture, plugin lifecycle, persistence, and NSM |
| Excluded | Distribution-specific build flags and patches; binary/plugin execution; unofficial ports; proprietary plugin internals; exhaustive UI or bundled-content inventory; legal advice |
| Completion | `COMPLETE_WITH_UNKNOWNS` |

No runtime probes were performed, so this dossier contains no `OBSERVED` claims. `DOCUMENTED` source claims describe the pinned implementation or upstream documentation. They do not establish that every distributor enabled every optional feature or that every third-party plugin interoperates correctly.

## 1. Executive summary

Qtractor 1.6.2 is a maintained, GPL-2.0-or-later Linux desktop audio/MIDI sequencer organized around two infrastructure-specific engines: JACK handles audio, transport, timebase, latency callbacks, and freewheel export; ALSA Sequencer handles MIDI ports, capture, queued playback, clock, SPP, MMC, and SysEx. The session is a linear, non-destructive arrangement of audio and MIDI tracks and overlapping clips, with buses, serial plugin chains, automation curves, a piano-roll editor, recording/takes, and a traditional tape-style transport. [C-001] [C-003] [C-004] [C-005] [C-006]

The audio callback divides a JACK period into at most 64-frame stripes, updates time and MIDI-plugin data, and visits tracks and their plugin chains in order. JACK supplies the callback thread, while ALSA MIDI has dedicated input/output queue threads and LV2 can use a worker thread. No dependency-aware multicore graph scheduler is evidenced. [C-004] [C-005]

The source can host LADSPA, DSSI, Linux-native VST2, VST3, CLAP, and LV2, but each is conditionally compiled and dependency-gated. Therefore source capability is not a guarantee for every 1.6.2 binary package. Inventory scanning for LADSPA/DSSI/VST2/VST3/CLAP normally runs through `qtractor_plugin_scan`, with per-format caches, a persistent blacklist, a temporary pre-scan blacklist, crash detection, and scanner restart. LV2 is the important exception: its type is opened in the main process during inventory. [C-013] [C-014] [C-015]

Scanner separation is not DSP isolation. Successfully instantiated plugins are invoked directly inside Qtractor's ordered plugin chain; no runtime broker, sandbox, architecture bridge, or per-plugin crash restart appears in the reviewed path. This in-process-runtime conclusion is a bounded `INFERENCE` because no process trace was performed. [C-016] [C-017]

Persistence is XML-based for `.qtr`/`.qts` sessions and `.qtt` templates, with ZIP-backed `.qtz` archives, relative/collected assets, configurable backups, an autosave file with startup recovery, plugin private state and automation, and an NSM 1.0 client. A consequential liability is that failed plugin instantiation only emits "plugin not found"; no opaque missing-plugin placeholder is appended, so a later save can discard that unavailable plugin's state. [C-023] [C-026] [C-027] [C-028] [C-029]

Overall confidence is **high** for pinned source architecture and build capability, **medium** for upstream user-visible features, **low/unknown** for distribution-binary parity and full plugin conformance, and **unknown** for several non-functional properties that require dynamic qualification. [C-002] [C-034] [C-035]

## 2. Product identity, history, and market position

Upstream describes Qtractor as a C++/Qt audio/MIDI multitrack sequencer for Linux, oriented toward the personal home studio. The official download page identifies 1.6.2 as the latest release at the cutoff and dates it 2026-07-15. The release commit was authored 2026-07-14, changes build metadata to 1.6.2, and is the immutable source boundary used here. [C-001] [C-002]

The source copyright range begins in 2005, but this pass did not reconstruct a complete product history or market-share position. Active 2026 releases and repository activity establish maintenance, not adoption or commercial standing. [C-001]

No paid/free edition matrix was found in the official product, download, build, or source evidence. That remains `UNKNOWN`, not proof that no distribution has ever packaged variants. [C-037]

## 3. Workflow and conceptual model

The primary model is one session/document with a linear time axis, tempo/time-signature map, markers, audio and MIDI buses, audio and MIDI tracks, overlapping clips, automation curves, files, mixer state, and connection state. Audio and MIDI tracks are distinct types rather than one universal track type. [C-003] [C-023]

Editing is non-destructive and non-linear within this tape-style timeline: users arrange overlapping clips and apply move, cut, copy, split, merge, fades, gain, normalization, looping, time stretch, pitch shift, and export/freeze operations. Loop recording creates takes. [C-003] [C-008]

Qtractor is not evidenced as scene/clip-launching, tracker-pattern, notation-first, or modular-node-first. Piano-roll MIDI editing is documented, but score notation and scene launching remain unestablished rather than asserted absent. [C-009] [C-036]

## 4. Publicly documented architecture

The pinned application is a Qt/C++ process with a `qtractorSession` aggregate, JACK `qtractorAudioEngine`, ALSA Sequencer `qtractorMidiEngine`, typed tracks and buses, clips, plugin lists, file/media managers, and an XML document layer. A separate executable, `qtractor_plugin_scan`, provides inventory-time process separation for five plugin formats. [C-004] [C-013] [C-014]

The JACK callback is the main audio executive. It acquires a session lock, prepares and monitors buses, processes MIDI managers, divides each period into 64-frame stripes, invokes session processing, commits output buses, handles recording, and synchronizes the MIDI output thread. `qtractorSession::process` then iterates all tracks in list order; a plugin list similarly invokes active plugins in list order using alternating buffers. [C-004] [C-005] [C-017]

ALSA MIDI input and output are explicit worker threads around the sequencer API and queues. LV2 Worker uses a separate worker thread and JACK ring buffers when that extension is compiled. These specialized workers do not establish parallel scheduling of the main route graph. [C-006] [C-021]

## 5. Audio engine

JACK is a mandatory build/runtime dependency and provides sample rate, period size, process callback, xrun notification, graph/port callbacks, transport synchronization, optional timebase-master behavior, latency ranges, and freewheel state. Qtractor rejects a process callback larger than its allocated buffer and internally strips normal and export processing into blocks no larger than 64 frames. [C-005]

Freewheel export is a distinct non-real-time path, but it reuses session, track, MIDI-manager, plugin, bus, and file-writing mechanisms. This is evidence of a faster-than-real-time path, not proof that every plugin produces bit-equivalent real-time/offline output or reports tails correctly. [C-005] [C-034]

Plugin latency is summed for each active chain. When track latency compensation is enabled, the audio engine finds the maximum participating track-chain latency and offsets processing; JACK I/O latency ranges are also queried. Exact compensation through every bus, sidechain-like insert, MIDI path, and dynamic-latency transition remains unqualified. [C-025] [C-033]

The main track and plugin loops are serial in the reviewed callback. `UNKNOWN`: internal mix accumulation precision beyond the build's 32-bit-float optimization statement, denormal policy, oversampling, dropout concealment, deterministic export, tail scheduling, and practical scaling limits. [C-004] [C-033]

## 6. Tracks, timeline, clips, and editing

Qtractor documents unlimited audio/MIDI tracks and overlapping clips subject to resources, non-destructive editing, unlimited undo/redo, clip fades/crossfades, per-clip gain, normalize/export, tempo and time-signature maps, markers, and automation curves using hold, linear, or spline modes. [C-008]

Audio clips support optional WSOLA-like or Rubber Band time stretch, Rubber Band pitch shift, and libsamplerate conversion. These capabilities are build-dependent where optional libraries are involved. [C-008] [C-013]

Loop recording/takes are documented and take metadata is represented in track/clip state. Detailed lane display, swipe comping, edit groups, ripple editing, version branches, and freeze cache invalidation behavior were not established in this pass. [C-008] [C-036]

## 7. MIDI, sequencing, notation, and expression

ALSA Sequencer provides duplex ports, scheduled queue playback, capture, direct monitoring/pass-through, and event handling for notes, key pressure, controllers, RPN/NRPN, 14-bit controls, program changes, channel pressure, pitch bend, and SysEx. MIDI Clock, SPP, MMC, capture quantization, metronome, and queue-drift correction are present. [C-006] [C-009]

The user-facing MIDI model includes SMF format 0/1, clips, a matrix/piano-roll editor, drum mode, instrument definitions (`.ins`, SoundFont names, MIDNAM), controller learn/mapping, bank/program selection, step input, and SysEx setups. [C-009]

`UNKNOWN`: MIDI 2.0/UMP, a complete MPE/per-note-expression contract, score/notation editing, MusicXML, articulation maps, and sample-accurate external MIDI guarantees. VST3 and CLAP modules carry timestamped event offsets, but those format-specific paths do not prove end-to-end expression or timing conformance. [C-032] [C-034]

## 8. Routing, mixer, automation, and control

Qtractor has input/output buses, built-in mixer/monitoring, a connection patchbay with persistence, per-track/bus plugin chains, audio/MIDI insert pseudo-plugins, aux sends, and JACK/ALSA external connections. Current release history documents cycle prevention for audio aux-send ordering and warnings for audio self-connections. [C-010] [C-012]

Track and plugin parameters can own automation curves and MIDI-controller mappings. The audio executive evaluates track curves at each internal stripe, while format wrappers enqueue current values into their processing contracts. **INFERENCE:** the general automation scheduler has at best 64-frame control points in this architecture; VST3/CLAP support for timestamp fields does not by itself establish arbitrary sample-accurate host automation. [C-024]

Transport/control integration includes JACK transport master/slave and timebase, MIDI Clock/SPP/MMC, configurable keyboard/MIDI shortcuts, and experimental OSC action mapping when compiled. Feedback policy, surround/immersive routing, VCA/folder semantics, and a stable remote API are `UNKNOWN`. [C-005] [C-006] [C-030] [C-036]

## 9. Recording, comping, and media handling

Audio and MIDI tracks support record arm, monitoring, count-in, punch/loop workflows, and loop takes. Audio capture writes through track input buses, while MIDI capture enters through ALSA Sequencer and can be quantized or passed through. [C-006] [C-011]

Upstream documents Ogg Vorbis, playback-only MP3, WAV, FLAC, AIFF, and the broader libsndfile set; SMF 0/1 is the MIDI interchange boundary. Optional codecs and resampling/time-stretch libraries make exact package capability build-dependent. [C-011] [C-013]

Sessions reference media files and archives can collect referenced assets through the document layer, including special handling for SFZ sample references. `UNKNOWN`: robust missing-media relinking, BWF metadata breadth, conform/proxy/video workflows, and destructive crash recovery during active recording. [C-027] [C-036]

## 10. Instruments, effects, content, and native devices

The principal device model is an ordered plugin list on tracks and bus inputs/outputs. MIDI tracks can route instrument plugin audio to an audio bus. Qtractor also implements host-native pseudo-plugins for audio/MIDI inserts, aux sends, and MIDI control; these are internal mechanisms, not a public third-party native plugin SDK. [C-012] [C-017]

Format hosts cover effects and instruments where the format exposes MIDI/note input. DSSI, VST2, VST3, CLAP, and LV2 have instrument/event paths; LADSPA is audio/control only. Bundled content, synthesis inventory, samplers, racks/macros, and preset-library breadth were deliberately not inventoried because they do not change the architecture conclusion. [C-018] [C-019] [C-020] [C-021] [C-022]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

Cells describe upstream 1.6.2 documentation and pinned source capability. `DOCUMENTED:source-conditional` means the host exists but can be disabled or removed by missing dependencies; it does not guarantee a given released binary. `UNKNOWN` is not an unsupported claim.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE:no upstream edition | NOT_APPLICABLE:no upstream edition | DOCUMENTED:source-conditional | NOT_APPLICABLE:no upstream edition | 1.6.2 build option, VeSTige/SDK checks, scanner and host | Linux-native VST2; VST2 licensing/SDK rights require separate current legal review | C-013, C-014, C-018, C-031; S-004, S-005, S-013, S-015 |
| VST3 | NOT_APPLICABLE:no upstream edition | NOT_APPLICABLE:no upstream edition | DOCUMENTED:source-conditional | NOT_APPLICABLE:no upstream edition | 1.6.2 default-on option and bundled SDK path | Main/default audio/event buses, state, parameters, GUI, latency are implemented; full bus fidelity untested | C-013, C-014, C-019; S-005, S-013, S-016 |
| AUv2 | NOT_APPLICABLE:no upstream macOS edition | NOT_APPLICABLE:Apple API | NOT_APPLICABLE:Apple API | NOT_APPLICABLE:no upstream edition | Linux-only upstream scope | No Apple host claim | C-002, C-032; S-001, S-004 |
| AUv3 | NOT_APPLICABLE:no upstream macOS edition | NOT_APPLICABLE:Apple API | NOT_APPLICABLE:Apple API | NOT_APPLICABLE:no upstream edition | Linux-only upstream scope | No Apple host claim | C-002, C-032; S-001, S-004 |
| AAX | NOT_APPLICABLE:no upstream macOS edition | NOT_APPLICABLE:no upstream Windows edition | UNKNOWN:no host path found | NOT_APPLICABLE:no upstream edition | Targeted 1.6.2 build/tree review | No support or Avid licensing/certification conclusion | C-032; S-004, S-005, S-012 |
| CLAP | NOT_APPLICABLE:no upstream edition | NOT_APPLICABLE:no upstream edition | DOCUMENTED:source-conditional | NOT_APPLICABLE:no upstream edition | 1.6.2 default-on option; upstream release includes CLAP 1.2.9 | Audio/note ports, params, GUI, state, latency, restart/rescan callbacks; conformance untested | C-013, C-014, C-020; S-002, S-005, S-013, S-017 |
| LV2 | NOT_APPLICABLE:no upstream edition | NOT_APPLICABLE:no upstream edition | DOCUMENTED:source-conditional | NOT_APPLICABLE:no upstream edition | 1.6.2 option plus liblilv and extension checks | Richest extension surface; inventory opens in host process rather than scanner child | C-013, C-015, C-021; S-005, S-012, S-018 |
| LADSPA | NOT_APPLICABLE:no upstream edition | NOT_APPLICABLE:no upstream edition | DOCUMENTED:source-conditional | NOT_APPLICABLE:no upstream edition | 1.6.2 option/header check, scanner and runtime wrapper | Audio/control, generic host UI, optional latency control output convention | C-013, C-014, C-022; S-005, S-013, S-019 |
| DSSI | NOT_APPLICABLE:no upstream edition | NOT_APPLICABLE:no upstream edition | DOCUMENTED:source-conditional | NOT_APPLICABLE:no upstream edition | 1.6.2 option/header/liblo checks, scanner and runtime wrapper | LADSPA-derived audio/control plus ALSA MIDI, programs/configure, optional external OSC GUI | C-013, C-014, C-022; S-005, S-013, S-020 |
| JSFX | NOT_APPLICABLE:no upstream edition | NOT_APPLICABLE:no upstream edition | UNKNOWN:no host path found | NOT_APPLICABLE:no upstream edition | Targeted 1.6.2 build/tree review | No Reaper/JSFX compatibility claim | C-032; S-004, S-005, S-012 |
| DirectX/DXi | NOT_APPLICABLE:no upstream edition | NOT_APPLICABLE:no upstream Windows edition | NOT_APPLICABLE:Windows API | NOT_APPLICABLE:no upstream edition | Linux-only upstream scope | No Windows host edition | C-002, C-032; S-001, S-004 |
| Rack Extension | NOT_APPLICABLE:no upstream edition | NOT_APPLICABLE:no upstream edition | UNKNOWN:no host path found | NOT_APPLICABLE:no upstream edition | Targeted 1.6.2 build/tree review | No proprietary Reason ecosystem claim | C-032; S-004, S-005, S-012 |
| Product-native/other | NOT_APPLICABLE:no upstream edition | NOT_APPLICABLE:no upstream edition | DOCUMENTED:pseudo-plugins | NOT_APPLICABLE:no upstream edition | 1.6.2 source | Audio/MIDI inserts, aux sends, and MIDI-control inserts are internal; no public native binary SDK evidenced | C-012; S-012, S-014 |

### 11.2 Discovery, scanning, validation, and recovery

The factory constructs per-format search paths from preferences, environment variables, and Linux defaults. It recursively inventories candidate libraries/bundles, canonicalizes default paths, and writes separate `*_scan.cache` files. Search variables include `LADSPA_PATH`, `DSSI_PATH`, `VST2_PATH`, `LXVST_PATH`, `VST_PATH`, `VST3_PATH`, `CLAP_PATH`, and `LV2_PATH`. [C-014]

LADSPA, DSSI, VST2, VST3, and CLAP candidates are sent to a long-lived `qtractor_plugin_scan` child over standard input. The helper loads each candidate and emits a compact descriptor containing format, name, audio/MIDI/control counts, GUI/state/realtime flags, filename, index, and unique ID. This is inventory/instantiation probing, not a complete rendering validator. [C-014]

Before an uncached candidate is sent, its path is written to a temporary blacklist. On abnormal child exit the factory restarts the scanner and leaves that path in the temporary file for recovery; successful submission removes the file. A persistent user/inventory blacklist is loaded and saved separately. The code waits three seconds for output, but does not establish robust containment of a still-running hung scanner. Cache reuse checks that the candidate path still exists, but content hashes, signatures, and a documented duplicate-identity policy beyond canonical path de-duplication were not established. [C-014] [C-034]

LV2 is scanned differently: the factory explicitly bypasses the child, opens the LV2 type through liblilv in the Qtractor process, and then caches its metadata. Thus the scanner's crash boundary is format-specific. [C-015]

### 11.3 Runtime isolation and compatibility

**INFERENCE:** instantiated third-party plugins execute inside the Qtractor process. The generic chain directly calls format wrapper `process` methods; wrappers directly invoke LADSPA/DSSI callbacks, VST2 `processReplacing`, VST3 `IAudioProcessor::process`, CLAP `plugin->process`, or LV2 `lilv_instance_run`. No runtime broker is present in the reviewed modules. A hidden boundary supplied by an external library is a plausible alternative but is not evidenced here. [C-016] [C-017]

No per-plugin runtime sandbox, crash restart, 32/64-bit bridge, alternate-architecture host, signature allowlist, or quarantine after a processing crash was established. Scanner restart and blacklisting protect later inventory scans, not a live session. [C-016] [C-035]

### 11.4 Host/plugin processing contract

The generic host represents audio channel counts, MIDI/event presence, control inputs/outputs, plugin instances, active state, ordered processing, intermediate buffers, latency, MIDI-manager attachment, programs, configurations, and custom/generic editors. Audio channel adaptation can create multiple instances for some fixed-I/O plugins and supplies dummy input/output buffers where format counts exceed track channels. [C-017]

Format depth is uneven. VST2 handles audio, MIDI events, programs/chunks, editor and latency; VST3 handles aggregate default audio/event buses, timestamped note events, process context, parameter queues, state, editor and latency; CLAP handles audio/note ports, MIDI/note events, params, GUI, state, latency, restart and selected rescan callbacks; LV2 covers audio/control/MIDI/Atom/CV ports, Worker, state/files, presets/programs, time/position, patch, multiple UI types and buffer options; DSSI adds MIDI synth callbacks, programs/configure and OSC UI over LADSPA. [C-018] [C-019] [C-020] [C-021] [C-022]

`UNKNOWN`: named sidechain and auxiliary-bus semantics across formats, arbitrary multi-bus activation, dynamic I/O while rolling, CLAP note-expression completeness, MPE/MIDI 2.0, tail reporting, suspend semantics, exact bypass equivalence, and real-time/offline equivalence. Format API calls in source are necessary but not sufficient conformance evidence. [C-034]

### 11.5 Parameters, automation, state, presets, and project recall

Generic plugin state stores format, relative/search-path filename, index/unique ID where applicable, label/alias, preset, active state, private configuration blobs, parameter values, MIDI mappings, automation curve file, direct-access parameter, selected editor type, and window positions. VST2 chunks, VST3 component state, CLAP state streams, LV2 state/files, and DSSI configuration are translated through this envelope. [C-023]

Automation curves are attached to parameter subjects. VST3 parameter queues and CLAP events can carry offsets, but ordinary host parameter updates shown in the wrappers use offset zero within each 64-frame stripe. Full sample-accurate automation is therefore not claimed. [C-024]

If plugin creation fails during load, Qtractor emits a "plugin not found" message and does not append a substitute node. **INFERENCE:** because later saves enumerate only instantiated list entries, resaving can discard the unavailable plugin's serialized state, mappings, and automation. There is no evidenced missing-plugin placeholder or automatic relink. [C-026]

Cross-version state migration, replacement mapping, external plugin asset portability beyond LV2 path handling, and preset interchange fidelity remain `UNKNOWN`. [C-034]

### 11.6 UI, diagnostics, and failure modes

Qtractor has a generic parameter editor and conditionally supports VST2 custom editor embedding, VST3 `IPlugView`, CLAP X11/Wayland GUI APIs, LV2 Qt/GTK/X11/external UIs, and DSSI external OSC editors. Current 1.6.2 adds an always-on-top editor preference and changes LV2 editor-type selection behavior. [C-018] [C-019] [C-020] [C-021] [C-022]

Diagnostics include scanner stderr, inventory progress, cache files, persistent and temporary blacklists, missing-plugin messages, and format-specific debug/warning paths. The retained sources do not establish a consolidated scan-log browser, structured crash report, plugin safe mode, custom-UI accessibility, DPI behavior across every UI API, or recovery after a plugin fails during processing. [C-014] [C-035]

## 12. Extensibility and integration

Qtractor's documented integration boundaries are JACK audio/transport/session, ALSA Sequencer MIDI, NSM OSC session lifecycle, MIDI learn/control maps, configurable keyboard/MIDI shortcuts, instrument definition files, and experimental OSC action mapping. [C-005] [C-006] [C-029] [C-030]

No general scripting language, public native-device SDK, stable extension ABI, web API, or capability sandbox was established. Plugin formats and external JACK/ALSA/NSM clients are the primary evidenced extensibility mechanisms. [C-030] [C-038]

## 13. Project format, persistence, interoperability, and collaboration

Qtractor's document layer names `.qtr` default sessions, `.qts` regular sessions, `.qtt` templates, and `.qtz` archives. Sessions/templates are XML DOM documents whose root serializes properties, engines/buses/connections, tempo map, files, tracks, clips, plugins, controllers, and automation references. `.qtz` uses the ZIP helper to collect a `.qts` document and referenced assets under an archive prefix, then extracts to a directory when opened. [C-027]

Autosave writes a temporary `.auto-save.qts` outside active playback/recording and stores its path/original filename in user settings for startup recovery. Configurable save-time backup/versioning renames the prior session before writing. The document save itself opens the target with truncate and writes XML directly; no temp-file plus atomic-rename transaction was found. Therefore power-loss atomicity remains `UNKNOWN` despite backup and autosave layers. [C-028] [C-033]

Plugin state and automation are persisted [C-023], but missing plugin nodes are not preserved [C-026]. Archive collection improves portability, yet external plugin assets, absent media relinking, forward compatibility, schema migration guarantees, and corrupted-archive recovery are unqualified. [C-034] [C-036]

Documented interchange includes audio formats through libsndfile/optional codecs, SMF 0/1, plugin preset/state mechanisms, track mixdown/render/freeze, and collected archives. No AAF, OMF, ADM, DAWproject, MusicXML, cloud collaboration, or native version-control workflow was established. [C-011] [C-036]

## 14. Delivery, live, post-production, and specialized workflows

Delivery mechanisms include audio/MIDI track export, mixdown/render/merge/freeze, clip export, and JACK freewheel rendering. Live-oriented boundaries include JACK transport/timebase, loop/take recording, MIDI Clock/SPP/MMC, controller mapping, and external JACK/ALSA routing. [C-005] [C-006] [C-008]

`UNKNOWN`: loudness-standard measurement, DDP, ADM/immersive output, video/timecode post, ADR, batch render farms, show control, and deterministic headless rendering. No retained source justified inferring these from generic export or transport support. [C-036]

## 15. Performance, reliability, security, and accessibility

Performance mechanisms include JACK real-time callbacks, fixed 64-frame internal stripes, optional SSE/fast-math compilation, audio-buffer background work, ALSA MIDI queue threads, LV2 Worker, CLAP thread-pool callbacks, plugin auto-deactivation, and freewheel export. No benchmark or maximum-project qualification was performed. [C-004] [C-005] [C-006] [C-020] [C-021]

Reliability mechanisms include scanner child processes for five formats, cache/blacklist recovery, session backups, autosave recovery, archive warnings, and engine/session deactivation on close. Liabilities include in-process plugin runtime, in-process LV2 discovery, direct-truncate document writes, and no missing-plugin placeholder. [C-014] [C-015] [C-016] [C-026] [C-028]

Third-party plugins and DSSI/LV2 external UIs are executable-code trust boundaries. No plugin permission model, runtime sandbox, signature/notarization policy, malicious-plugin hardening contract, telemetry/privacy statement, update rollback, or reproducible-build attestation was established. [C-035]

Translations exist in the source/product, but keyboard-only completeness, screen-reader semantics, contrast certification, and accessibility of third-party editors remain `UNKNOWN`. [C-035]

## 16. Licensing, ecosystem, and implementation constraints

The upstream README and source notices license Qtractor under GNU GPL version 2 or later. Distribution or derivative-use consequences are fact-specific; this dossier provides no legal advice. Independently reimplementing public mechanisms is distinct from copying Qtractor code, UI expression, assets, or trademarks. [C-031]

Dependencies and format SDKs have separate terms. In particular, Qtractor's VST2/VeSTige implementation does not grant a new product the right to obtain, redistribute, or ship Steinberg VST2 SDK material. VST3, CLAP, LV2, LADSPA, DSSI, JACK, ALSA, Qt, codec libraries, and optional UI libraries each require current license and redistribution review. [C-031]

The GPL boundary makes Qtractor valuable as an inspectable architecture reference but not an unrestricted code donor for a differently licensed product. Format names also do not grant compatibility marks or certification. [C-031]

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** Qtractor exposes a compact Linux-native division between JACK audio and ALSA MIDI; uses a fixed internal processing quantum independent of a larger JACK period; separates risky inventory probing for five formats; persists diagnosable caches/blacklists; implements unusually broad Linux plugin formats; and provides layered XML, archive, backup, autosave, and NSM persistence. [C-004] [C-005] [C-006] [C-013] [C-014] [C-027] [C-028] [C-029]

**Liabilities.** Plugin capability is build-dependent; LV2 inventory and all instantiated DSP share the host process; main track/plugin processing is serial; automation is not established as sample-accurate; session writes are not evidenced as atomic; and unavailable plugins have no state-preserving placeholder. [C-002] [C-004] [C-015] [C-016] [C-024] [C-026] [C-033]

**Reference suitability.** Qtractor is a high-value reference for a focused Linux workstation, process-isolated scanning, fixed internal quantum, and transparent multi-format wrappers. It is not evidence that these wrappers satisfy every format contract, nor that Linux-specific JACK/ALSA partitioning should be copied into a cross-platform core. [C-034]

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites and tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Large device buffer weakens control timing | Subdivide backend periods into a small fixed engine quantum while retaining one outer callback | C-005, C-024 | Correct offset accounting, bounded CPU overhead, plugin block-size contracts, loop splits | Medium | **CANDIDATE** |
| Plugin inventory can crash/hang the DAW | Scanner child, per-candidate pre-blacklist, persistent blacklist, cache, abnormal-exit detection, restart | C-014 | Hardened IPC/schema, explicit hang timeout, content-based invalidation, one-candidate fault attribution | Medium | **CANDIDATE** |
| Platform services have different timing models | Keep audio callback/transport and queued MIDI I/O behind separate engine boundaries synchronized by session time | C-004, C-005, C-006 | Cross-platform backend abstraction and a single timing authority | Medium | **CONDITIONAL** |
| Portable projects need both editable and collected forms | Human-readable project state plus optional asset-collecting archive | C-027 | Transactional staging, path normalization, malicious-archive defenses, asset manifests | Low/medium | **CANDIDATE** |
| Session recovery has several failure windows | Periodic recoverable autosave plus versioned prior-save backups | C-028 | Atomic write/rename and asset transactions still required | Low | **CANDIDATE** |
| Heterogeneous apps need coordinated lifecycle | Protocol client reports open/save/dirty/progress/GUI state while retaining its own project format | C-029 | Version negotiation, authenticated local transport, deterministic save completion | Medium | **CANDIDATE** |
| CPU can be saved on inactive chains | Auto-deactivate eligible plugins and explicitly reactivate on state/routing changes | C-017 | Tail/activity detection, instruments/sidechains exclusions, click-free transitions | High | **CONDITIONAL** |

These are independently implementable mechanisms, not copied source or protected UI expression.

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** Treat an out-of-process scanner as a plugin sandbox. Runtime DSP is still in-process. Reopen only if a runtime broker is introduced and evidenced. [C-014] [C-016]
- **REJECTED:** Drop unresolved plugin nodes on load. A modern project format should preserve opaque state and I/O identity for later relink. [C-026]
- **REJECTED:** Use direct truncate-and-write as the only project commit mechanism. Backups/autosave help but do not make the active write atomic. [C-028] [C-033]
- **REJECTED:** Advertise every source-enabled format as present in every binary. Dependency and build gates make that unsupported. [C-002] [C-013]
- **REJECTED:** Infer sample-accurate automation from VST3/CLAP timestamp structures. Ordinary parameter updates are aligned to the host's internal stripes in the reviewed path. [C-024]
- `CURIOSITY_NO_GO`: locate unofficial macOS/Windows ports. They are outside the canonical upstream product boundary and cannot establish supported editions. [C-002]
- `CURIOSITY_NO_GO`: exhaustive distro package flag census. It would date quickly; a later qualification matrix should record the exact binaries under test. [C-002] [C-013]
- `CURIOSITY_NO_GO`: enumerate bundled presets, themes, translations, and instruments. Low architecture value.
- `CURIOSITY_NO_GO`: infer AAX/JSFX/Rack Extension support from generic searches. The pinned build and plugin factory define the relevant source boundary. [C-032]
- `CURIOSITY_NO_GO`: retry inaccessible old manuals indefinitely. Current official pages and immutable source provide stronger version-scoped evidence; old UX detail is non-discriminating.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and countersearch | Result | Later discriminating probe |
| --- | --- | --- | --- |
| H-01: Qtractor uses one unified Linux media backend | Compare mandatory build dependencies and both engine implementations | **Falsified.** JACK audio and ALSA Sequencer MIDI are separate engines synchronized through session time. [C-004] [C-005] [C-006] | Trace callback/queue timing under tempo and buffer changes |
| H-02: PipeWire is a native audio backend | Search build/source for PipeWire API and compare upstream release wording | **Falsified for pinned source.** Only JACK API is evidenced; PipeWire references are PipeWire/JACK compatibility. [C-007] | Run a PipeWire JACK build and inspect loaded client libraries |
| H-03: all plugin scanning is process-isolated | Trace factory scanner paths by format | **Falsified.** Five formats use the helper; LV2 opens in the main process. [C-014] [C-015] | Crash/hang fixtures for every format and cache-state inspection |
| H-04: scanner isolation also contains runtime faults | Follow plugin list into each format's process callback | **Falsified at source-architecture level.** Runtime is inferred in-process. [C-016] [C-017] | Process trace plus deterministic crashing plugin fixture |
| H-05: format acceptance implies a complete host contract | Separate discovery, scan, type creation, instance creation, render, event, state, UI, latency, and recall evidence | **Falsified as a shortcut.** Implemented depth differs by format and remains unqualified dynamically. [C-018]-[C-022] [C-034] | Automated conformance suite by format/build |
| H-06: plugin automation is sample-accurate | Inspect internal block loop and wrapper parameter offsets | **Not established.** Main curves update per at-most-64-frame stripe; normal VST3/CLAP parameter updates use offset zero. [C-024] | Render stepped/ramped automation and locate transitions sample-by-sample |
| H-07: missing plugins retain project recall data | Follow failed `loadPlugin` through list append and later save enumeration | **Falsified.** No placeholder is appended; state loss on resave is the leading inference. [C-026] | Remove a fixture plugin, load/save, then XML-diff and reinstall |
| H-08: backups make session saves atomic | Inspect backup path and document write path | **Falsified as a guarantee.** Backup exists, but XML is written with truncate rather than temp-file rename. [C-028] [C-033] | Fault injection at each save/asset operation |
| H-09: source format enablement proves release-binary support | Compare CMake options with dependency checks and official package information | **Falsified.** Capability is conditional and package flags are not published in retained evidence. [C-002] [C-013] | Capture About/build report and scan fixtures for each tested package |

The adversarial distinction is retained throughout: a candidate path can be found, cached, blacklisted, described, instantiated, processed, automated, serialized, and restored at separate gates. Success at one gate does not establish the next. [C-014] [C-034]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Qtractor 1.6.2 is the current upstream release at cutoff, dated 2026-07-15 and pinned to release commit `a037350...` authored 2026-07-14 | Current/release | S-001, S-002, S-003, S-004, S-005 | Official release page, commit metadata, and version source agree | Commit is unsigned; no tarball hash verification |
| C-002 | DOCUMENTED | High | Upstream targets Linux desktop; optional dependency/build gates mean source capability and distribution binaries can differ; no upstream non-Linux edition is documented | Product/platform/build | S-001, S-002, S-004, S-005 | Official identity and direct build options | Unofficial ports/distros excluded; exact binary flags unobserved |
| C-003 | DOCUMENTED | High | Session model is a linear tape-style audio/MIDI multitrack arrangement with distinct track types, clips, buses, tempo map, markers, files, plugins and automation | 1.6.2/current | S-001, S-004, S-009 | Product features and session serializer align | UX quality not observed |
| C-004 | DOCUMENTED | High | Architecture separates JACK audio and ALSA MIDI engines; the main session/audio processing loops visit tracks serially | Commit `a037350...` | S-005, S-007, S-008, S-009 | Mandatory dependencies and direct process loops | Plugin/library internal parallelism can still occur |
| C-005 | DOCUMENTED | High | JACK supplies sample rate, buffer, process/xrun/transport/timebase/latency/freewheel paths; engine processes in up-to-64-frame stripes and supports freewheel export | Commit `a037350...` | S-004, S-005, S-007 | Direct callbacks and process/export loops | No runtime timing or export-equivalence test |
| C-006 | DOCUMENTED | High | ALSA Sequencer supplies dedicated input/output threads, queues, MIDI capture/playback, SysEx, Clock, SPP, MMC and drift handling | Commit `a037350...` | S-004, S-005, S-008 | Direct source and upstream feature list | External MIDI timing not measured |
| C-007 | INFERENCE | High | PipeWire support is bounded to JACK compatibility rather than a native backend | Current/1.6.2 Linux | S-002, S-004, S-005, S-007 | Source requires/calls JACK only; upstream history says PipeWire/JACK and `pipewire-jack` | A distributor could patch another backend; no process trace |
| C-008 | DOCUMENTED | Medium-high | Editing includes non-destructive clips, overlaps, undo/redo, fades, gain, normalize, stretch/pitch, tempo map, markers, loop takes and export/freeze | Current/source-capability | S-001, S-004, S-005 | Official features plus optional dependency gates | Detailed comping/freeze semantics unreviewed |
| C-009 | DOCUMENTED | High | MIDI surface includes SMF 0/1, piano roll, instrument definitions, controller mapping, bank/programs and SysEx | Current/1.6.2 | S-001, S-004, S-008 | Official features and event implementation | MPE/MIDI 2.0/notation not established |
| C-010 | DOCUMENTED | Medium-high | Mixer/routing uses buses, patchbay persistence, sends/inserts and external JACK/ALSA connections with cycle/self-route mitigations | Current | S-001, S-002, S-007, S-009, S-014 | Feature/release statements plus engine/plugin model | Full feedback and surround policy unknown |
| C-011 | DOCUMENTED | Medium-high | Recording/media support includes armed audio/MIDI tracks, monitoring, punch/loop/takes, libsndfile/optional codecs and SMF | Current/source-capability | S-001, S-004, S-005, S-007, S-008 | Official features and engine capture paths | Exact package codec matrix and crash recovery untested |
| C-012 | DOCUMENTED | High | Host-native pseudo-plugins include audio/MIDI inserts, aux sends and MIDI control; they are not a public third-party SDK | 1.6.2 | S-012, S-014 | Factory and plugin type branches | Native module inventory not exhaustive |
| C-013 | DOCUMENTED | High | 1.6.2 source conditionally hosts LADSPA, DSSI, VST2, VST3, CLAP and LV2; dependency checks can disable formats | 1.6.2 source builds | S-004, S-005, S-006 | Direct build options/checks and target source | Official binary flags not retained or observed |
| C-014 | DOCUMENTED | High | LADSPA/DSSI/VST2/VST3/CLAP use helper scanning with search paths, per-format text cache, pre-scan/persistent blacklist, abnormal-exit detection and helper restart | Commit `a037350...` | S-006, S-012, S-013 | Build target, factory `QProcess`, scanner `main` | Three-second read wait is not robust hang containment; no content hash evidenced |
| C-015 | DOCUMENTED | High | LV2 inventory bypasses the helper and opens/types plugins through liblilv in the host process before caching | Commit `a037350...` | S-012, S-018 | Explicit factory special case and LV2 host | liblilv internals not traced |
| C-016 | INFERENCE | Medium-high | Instantiated plugin DSP runs in Qtractor's process without a Qtractor runtime sandbox or architecture bridge | Commit `a037350...` | S-014-S-020 | Direct generic/format calls and no broker in reviewed boundary | No process trace; an external library could hide a boundary |
| C-017 | DOCUMENTED | High | Plugin lists process active nodes serially with typed audio/MIDI/control metadata, buffers, programs, active state, latency and per-format calls | Commit `a037350...` | S-014-S-020 | Generic chain and wrappers | Full contract differs by format/plugin |
| C-018 | DOCUMENTED | High | VST2 host implements Linux-native audio, MIDI events, programs, chunks/FXB/FXP, custom editor and latency | Commit `a037350...` | S-013, S-015 | Scanner descriptor plus runtime wrapper | VST2 SDK/legal and plugin conformance separate |
| C-019 | DOCUMENTED | High | VST3 host implements default audio/event bus inventory, process context, timestamped events, parameter queues, component state, GUI and latency | Commit `a037350...` | S-013, S-016 | Direct wrapper | Named aux/sidechain and all dynamic bus behavior untested |
| C-020 | DOCUMENTED | High | CLAP host implements audio/note ports, events, params, GUI, state, latency and selected restart/rescan/thread callbacks | Commit `a037350...`; CLAP 1.2.9 | S-002, S-013, S-017 | Release and direct wrapper | Thread-pool and note-expression conformance untested |
| C-021 | DOCUMENTED | High | LV2 host implements audio/control/MIDI/Atom/CV, Worker, state/files, presets/programs, time/patch/options and several UI types behind build gates | Commit `a037350...` | S-005, S-018 | Build option matrix and direct wrapper | Feature breadth does not prove every plugin works |
| C-022 | DOCUMENTED | High | LADSPA handles audio/control and a latency-named output; DSSI adds ALSA MIDI synth callbacks, programs/configure and optional OSC GUI | Commit `a037350...` | S-013, S-019, S-020 | Direct scanner/runtime wrappers | Generic UI and fixed API limits; no dynamic probe |
| C-023 | DOCUMENTED | High | Plugin/session XML stores identity/path/index, alias, preset, private state, values, controllers, automation and editor state | Commit `a037350...` | S-009, S-010, S-014-S-020 | Generic serializer plus format state snapshots | Private-state portability is format/plugin-specific |
| C-024 | INFERENCE | Medium-high | General plugin automation is quantized to at-most-64-frame stripes rather than proven sample-accurate | Commit `a037350...` | S-007, S-009, S-014, S-016, S-017 | Curves update at stripe start; ordinary VST3/CLAP parameter events use offset zero | MIDI events have offsets; no rendered automation probe |
| C-025 | DOCUMENTED | Medium-high | Chain latency is accumulated and optional track compensation offsets against the maximum chain; JACK I/O latency is queried | Current/1.6.2 | S-002, S-007, S-008, S-014-S-019 | Release history and direct latency methods | Complete graph/sidechain PDC unqualified |
| C-026 | INFERENCE | High | Failed plugin load has no placeholder; resaving can discard the missing plugin's opaque state and automation | Commit `a037350...` | S-014 | Failed creation logs without append; save enumerates list only | Not dynamically tested; original file remains intact until save |
| C-027 | DOCUMENTED | High | `.qtr`/`.qts`/`.qtt` are XML session/template forms and `.qtz` is a ZIP-backed collected archive | Commit `a037350...` | S-002, S-009, S-010, S-011 | Extension constants, DOM serializer and archive path | Forward/schema compatibility not specified |
| C-028 | DOCUMENTED | High | Configurable backups and recoverable autosave exist; the document writer opens and truncates the target XML directly | Commit `a037350...` | S-010, S-011 | Direct save/backup/autosave paths | Atomicity remains C-033 and requires power-loss fault injection |
| C-029 | DOCUMENTED | High | Optional NSM client implements API 1.0 announce, open/save, dirty/clean, progress/message, and optional-GUI lifecycle | Commit `a037350...` | S-005, S-021 | Build gate and OSC paths | NSM server reliability/security outside scope |
| C-030 | DOCUMENTED | High | Integration includes JACK/ALSA, MIDI learn/shortcuts, NSM and experimental OSC actions | Current/1.6.2 | S-001, S-004, S-005, S-021 | Official and direct build/protocol boundaries | Protocol stability and remote security unqualified |
| C-031 | DOCUMENTED | High | Qtractor is GPL-2.0-or-later; dependencies, SDKs, trademarks and plugin redistribution require separate review | Current/1.6.2 | S-001, S-004, S-005, S-014-S-021 | Upstream license statement and source notices | Not legal advice; no dependency license audit |
| C-032 | UNKNOWN | High confidence in unknown | AAX, JSFX and Rack Extension hosting; MIDI 2.0/MPE and AU outside absent Apple edition were not established | Current 1.6.2 | S-001, S-004, S-005, S-012, S-013 | Targeted build/factory/scanner review found no paths | Absence is not proof; release or runtime fixture could resolve |
| C-033 | UNKNOWN | High confidence in unknown | Complete PDC, save atomicity, internal precision, tails, oversampling, dropout policy and deterministic offline equivalence are unqualified | 1.6.2 | S-005, S-007, S-010, S-011, S-014-S-020 | Narrow mechanisms exist without complete guarantees | Requires source expansion and fault/render tests |
| C-034 | UNKNOWN | High confidence in unknown | Full per-format discovery, instantiation, buses/events, automation, UI, state, migration and recovery conformance is untested | 1.6.2 builds/plugins | S-012-S-020 | Source APIs do not prove third-party behavior | Qualification harness required |
| C-035 | UNKNOWN | High confidence in unknown | Runtime hardening, signing, malicious-plugin containment, telemetry/privacy, update rollback, accessibility and reproducible packaging are unresolved | Current product/packages | S-001-S-021 | Retained evidence makes no complete guarantees | Dedicated package/security/accessibility audit required |
| C-036 | UNKNOWN | High confidence in unknown | Notation, modern comping depth, video/post, immersive delivery, cloud collaboration, advanced interchange and missing-media recovery are unresolved | Current product | S-001, S-002, S-004, S-009-S-011 | Product/persistence pass lacked decisive support claims | Targeted docs or runtime workflows needed |
| C-037 | UNKNOWN | High confidence in unknown | No paid/free product-edition tiers were established | Current product | S-001, S-002, S-004, S-005 | Official product/release and immutable build evidence were checked | Silence is not proof no distribution or historical tier ever existed |
| C-038 | UNKNOWN | High confidence in unknown | No general scripting language, public native-device SDK, stable extension ABI, web API, or capability sandbox was established | Current product | S-001, S-004, S-005, S-012 | Product, build and extension factory boundaries were checked | Dedicated upstream documentation could resolve an omitted interface |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29 UTC. Fetched pages, source, comments, and prompt-like text were treated as untrusted evidence, not instructions. S-004 through S-021 are immutable commit-pinned artifacts, giving 18 pinned artifacts among 21 retained primary sources.

| ID | Title / publisher / URL | Kind and version scope | Relevant passage or section; supported claims | Limitations and selection rationale |
| --- | --- | --- | --- | --- |
| S-001 | "What's Qtractor?" and features, Qtractor upstream, <https://qtractor.org/> | Official current product page | Linux/JACK/ALSA/home-studio identity, features, formats, GPL; C-001-C-003, C-008-C-011, C-030-C-032, C-037, C-038 | Vendor-authored and partly broad; retained as canonical product scope, narrowed by pinned source |
| S-002 | "Downloads and Change Log," Qtractor upstream, <https://qtractor.org/qtractor-downloads.html> | Official releases/change log through 1.6.2 | 1.6.2 date/change list; CLAP 1.2.9; archives, PipeWire/JACK, latency and routing history; C-001, C-007, C-010, C-020, C-025, C-027, C-037 | Long rolling history and vendor claims; selected over mirrors for first-party release identity/context |
| S-003 | Commit `a037350...`, GitHub API / rncbc, <https://api.github.com/repos/rncbc/qtractor/commits/a037350ff81ec1cd0a5394aa2907f732e8d5b217> | Immutable release-commit metadata and patch | Author date, release message, tree, 1.6.2 metadata changes; C-001 | Unsigned commit and one host mirror; retained to pin every source artifact |
| S-004 | `README`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/README> | Immutable upstream overview at 1.6.2 | Product/platform/features/dependencies/formats/configuration/GPL; C-001-C-003, C-005-C-013, C-030-C-032, C-037, C-038 | Feature list is not dynamic qualification; preferable to an outdated manual for current source scope |
| S-005 | root `CMakeLists.txt`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/CMakeLists.txt> | Immutable build configuration at 1.6.2 | Version; mandatory JACK/ALSA/libsndfile; optional plugin/integration flags and LV2 subfeatures; C-001, C-002, C-004-C-008, C-013, C-021, C-029-C-033 | Capability/defaults, not actual distributor flags; selected as authoritative build boundary |
| S-006 | `src/CMakeLists.txt`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/CMakeLists.txt> | Immutable target manifest at 1.6.2 | Main executable, `qtractor_plugin_scan` executable, conditional format sources/libraries; C-013, C-014 | Build target does not prove successful package execution; selected to confirm process/module boundary |
| S-007 | `src/qtractorAudioEngine.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorAudioEngine.cpp> | Immutable audio implementation | JACK callbacks, 64-frame stripes, serial session calls, buses, freewheel, latency and transport; C-004, C-005, C-007, C-010, C-011, C-024, C-025, C-033 | Large source and no runtime trace; selected as direct audio executive |
| S-008 | `src/qtractorMidiEngine.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorMidiEngine.cpp> | Immutable MIDI implementation | ALSA queues/threads, events, SysEx, Clock/SPP/MMC, capture, drift, plugin latency; C-004, C-006, C-009, C-011, C-025 | No external-device timing test; selected as direct MIDI executive |
| S-009 | `src/qtractorSession.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorSession.cpp> | Immutable session implementation | Track/process loops, engine ownership, tempo/map/files/tracks/buses/curves XML; C-003, C-004, C-010, C-023, C-027, C-036 | Does not contain every clip/file schema; selected for root aggregate and serial scheduling |
| S-010 | `src/qtractorDocument.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorDocument.cpp> | Immutable document/archive implementation | Extension constants, XML load/save, ZIP extract/collect, asset aliasing, direct truncate write; C-023, C-027, C-028, C-033 | ZIP helper internals not separately retained; selected for decisive persistence transaction boundary |
| S-011 | `src/qtractorMainForm.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorMainForm.cpp> | Immutable application lifecycle implementation | Format selection, load/save, backups, autosave/recovery, archive warnings, NSM/JACK session integration; C-027, C-028, C-036 | UI-heavy file; selected because recovery orchestration is not in document class |
| S-012 | `src/qtractorPluginFactory.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorPluginFactory.cpp> | Immutable plugin inventory/factory implementation | Search paths, formats, cache, blacklist, scanner process/restart, LV2 exception, pseudo-plugins; C-012-C-015, C-030, C-032, C-034 | Inventory does not prove runtime conformance; selected as central lifecycle controller |
| S-013 | `src/qtractor_plugin_scan.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractor_plugin_scan.cpp> | Immutable scanner-helper implementation | Candidate loading/descriptor probing and output for LADSPA/DSSI/VST2/VST3/CLAP; C-014, C-018-C-022, C-032, C-034 | Scanner instantiates enough code to be unsafe, but no malformed-fixture test; selected for exact scan depth |
| S-014 | `src/qtractorPlugin.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorPlugin.cpp> | Immutable generic host implementation | Serial chain, buffers, state/params/controllers/curves, latency, missing-plugin load path, pseudo state; C-012, C-016, C-017, C-023-C-026, C-030, C-033 | Generic layer cannot establish format-specific fidelity; selected for common runtime and recall contract |
| S-015 | `src/qtractorVst2Plugin.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorVst2Plugin.cpp> | Immutable VST2 wrapper | Audio/MIDI process, programs, chunks/FXB/FXP, parameters, editor, latency; C-016-C-018, C-023, C-025, C-031, C-034 | Does not supply current SDK rights or conformance evidence; selected as direct host path |
| S-016 | `src/qtractorVst3Plugin.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorVst3Plugin.cpp> | Immutable VST3 wrapper | Buses/events/process context, parameter queues/offsets, state, editor, latency; C-016, C-017, C-019, C-023-C-025, C-034 | Default-bus aggregate is not complete multi-bus proof; selected for direct contract evidence |
| S-017 | `src/qtractorClapPlugin.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorClapPlugin.cpp> | Immutable CLAP wrapper | Audio/note/events, params, state, GUI, latency, host restart/rescan/thread extensions; C-016, C-017, C-020, C-023-C-025, C-034 | Extension callbacks vary in completeness and were not dynamically tested; selected as direct contract evidence |
| S-018 | `src/qtractorLv2Plugin.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorLv2Plugin.cpp> | Immutable LV2 wrapper | liblilv discovery/runtime, ports, Worker, state paths, presets, Atom/time/patch, UIs and latency; C-015-C-017, C-021, C-023, C-025, C-034 | Very broad conditional file; no plugin-fixture test; selected for richest host surface and process exception |
| S-019 | `src/qtractorLadspaPlugin.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorLadspaPlugin.cpp> | Immutable LADSPA wrapper | Port/instance adaptation, direct run, activate/deactivate, control hints, latency output; C-016, C-017, C-022, C-023, C-025, C-034 | LADSPA is limited by format; selected as direct minimal host contract |
| S-020 | `src/qtractorDssiPlugin.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorDssiPlugin.cpp> | Immutable DSSI wrapper | LADSPA base, ALSA events, synth callbacks, programs/configure, external OSC GUI; C-016, C-017, C-022, C-023, C-031, C-034 | Optional liblo/editor executable behavior untested; selected as direct DSSI extension contract |
| S-021 | `src/qtractorNsmClient.cpp`, Qtractor source, <https://raw.githubusercontent.com/rncbc/qtractor/a037350ff81ec1cd0a5394aa2907f732e8d5b217/src/qtractorNsmClient.cpp> | Immutable NSM client at API 1.0 | Announce, open/save, dirty/clean, progress/message, loaded and optional GUI OSC paths; C-029-C-031, C-035 | Does not assess server, transport authentication, or distributed save atomicity; selected as direct protocol boundary |

**Retrieval failures retained for transparency:** web search was rate-limited with HTTP 429; an attempted manual retrieval returned HTTP 500; guessed documentation/source paths and release-tag API requests returned HTTP 404. None was used to support a claim. The accessible official pages, immutable release commit, and pinned source artifacts made repeated retries lower-value than direct source inspection.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods and available evidence | Blocker and decision impact | Safest next probe / required access | Owner |
| --- | --- | --- | --- | --- |
| Exact format set in official/distro 1.6.2 binaries | Official download/product pages and CMake dependency gates reviewed | No retained build manifest per binary; impacts support matrix and test scope | In disposable Linux VMs, capture About/build flags and scan one benign fixture per format for each exact package | Unassigned |
| Full plugin conformance and crash containment | Factory, scanner, generic host and six wrappers traced | Source calls do not prove third-party behavior; high impact on host architecture | Purpose-built open fixtures covering scan crash/hang, instantiate, audio/event buses, automation, state, UI, latency, tail and runtime crash | Unassigned |
| Missing-plugin round-trip data loss | Failed load and save enumeration traced; leading inference is state loss | No dynamic XML diff; high project-durability impact | Save fixture session, remove plugin, load/save copy, diff XML, reinstall and test restoration | Unassigned |
| Save/asset transaction durability | Backup, autosave, XML truncate and archive paths traced | No fsync/atomicity/fault-injection evidence; high data-loss impact | Filesystem fault harness that interrupts XML, MIDI revision, media collect and ZIP stages | Unassigned |
| Automation precision | 64-frame stripe loop and zero-offset normal parameter paths traced | No rendered transition measurement; medium/high DSP-contract impact | Render impulses/steps/ramps at non-stripe boundaries for each format and compare sample positions | Unassigned |
| Complete PDC, tails and offline equivalence | Chain sum, max-track offset, JACK latency and freewheel path inspected | Sidechains/dynamic latency/tails not completely represented; high mix correctness impact | Synthetic latency-changing, aux-route and long-tail fixtures in real-time and freewheel modes | Unassigned |
| MPE/MIDI 2.0/note expression | ALSA event types plus VST3/CLAP event paths searched | No explicit product contract; medium roadmap impact | Source-owner clarification followed by MIDI 1 MPE and UMP fixtures if claimed | Unassigned |
| Accessibility/security/package policy | Official pages and pinned code searched | No complete policy or dynamic audit; high product-risk impact | Keyboard/screen-reader/UI audit plus package signature/update/telemetry and hostile-plugin threat assessment | Unassigned |
| Advanced interchange/post/collaboration | Feature, persistence and export surfaces reviewed | No decisive AAF/OMF/ADM/DAWproject/video/cloud evidence; medium scope impact | Targeted current documentation request; only prototype formats selected by product requirements | Unassigned |

## 24. Curiosity pass and stop decision

| Rank | Candidate thread | Decision relevance | Expected value | Novelty | Cost | Disposition/result |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Does missing-plugin load preserve opaque state? | Very high | High | High | Low | **Pursued.** Direct generic host tracing found no placeholder; state loss on resave is the leading inference. [C-026] |
| 2 | Qualify six formats dynamically | Very high | Very high | Medium | Very high | `CURIOSITY_NO_GO` for documentary wave; move to disposable conformance harness. [C-034] |
| 3 | Prove save atomicity under power loss | High | High | Medium | High | `CURIOSITY_NO_GO` for documentary wave; requires fault injection. [C-028] [C-033] |
| 4 | Census every distro's plugin flags | Medium | Medium | Low | High and perishable | `CURIOSITY_NO_GO`; qualify only selected shipping binaries. [C-002] [C-013] |
| 5 | Recover old manual details | Low/medium | Low | Low | Medium due access failures | `CURIOSITY_NO_GO`; current pinned source is more discriminating |
| 6 | Inventory UI/content/presets | Low | Low | Low | Medium | `CURIOSITY_NO_GO`; does not change architecture selection |

Research stopped because all required dossier dimensions and plugin rows have evidence-backed or explicit unknown outcomes; the highest-value documentary curiosity thread was resolved; 21 primary sources include the direct engine, persistence, scanner, generic host, every supported-format wrapper, and NSM boundary; and remaining high-value questions require binary fixtures, fault injection, accessibility testing, or legal/package review. Documentary coverage is saturated for the scoped architecture decision, not for interoperability certification.

## 25. Completion checklist

- [x] Only the assigned dossier path was edited.
- [x] Identity, edition, version/date, OS scope, and exclusions are explicit.
- [x] Every required dossier heading exists in order.
- [x] Every material assertion has a claim ID and classification.
- [x] Every claim resolves to source IDs or a fully described `UNKNOWN`.
- [x] Every required plugin-format row is present.
- [x] Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.
- [x] Facts, vendor documentation, inferences, and unknowns are not conflated.
- [x] Licensing and clean-room boundaries are explicit.
- [x] Bibliography records source rationale and limitations.
- [x] Curiosity pass and `CURIOSITY_NO_GO` decisions are present.
- [x] No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.

Owned path: `research/daw-landscape/dossiers/qtractor.md`.

Checks performed: required-heading order, 13-row plugin matrix, claim/source resolution, 21-source count with 18 commit-pinned artifacts, classification labels, access-failure disclosure, curiosity/stop rule, and path-scoped Git diff/status.

Concise result: `COMPLETE_WITH_UNKNOWNS`. The dossier establishes the JACK/ALSA split, serial 64-frame engine, conditional six-format Linux host, five-format scanner boundary, in-process runtime, persistence/recovery model, GPL boundary, and next dynamic probes.

Unresolved blockers: none for documentary completion. Binary parity, conformance, fault tolerance, accessibility, security policy, and legal/SDK decisions remain explicitly outside documentary proof.

Pre-existing workspace changes outside the owned path were left untouched.
