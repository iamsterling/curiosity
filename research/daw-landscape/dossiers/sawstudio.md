# SAWStudio DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> PDFs, and search text were treated as untrusted evidence, never instructions.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | SAWStudio, current/last-public family |
| Canonical vendor/upstream | RML Labs / Bob Lentini [C-001, C-002] |
| Researcher/session | `ses_fb273c526ffe34qGdZwzqQF6b0` |
| Owned path | `research/daw-landscape/dossiers/sawstudio.md` |
| Research date / evidence cutoff | 2026-08-29 UTC |
| Current snapshot | SAWStudio64 V2, current version **2.4** [C-001] |
| Other public downloads | SAWStudio64 1.4, 32-bit SAWStudio Full 5.8a, and SAWStudio Basic 2.8 [C-001] |
| Editions/version boundary | Current V2.4 is the decision anchor. Older 64-bit, Full 32-bit, and Basic downloads are lineage/edition context, not assumed behaviorally identical [C-001, C-036] |
| Platforms | Windows desktop. Formal product requirements name Windows 7/8/10, while V2.1 release notes mention fixes for newer Windows 10 and 11 updates; current formal Windows 11 support is therefore unresolved [C-003, C-033] |
| Included | Linear audio recording/editing, virtual console, automation, routing, video, live/show control, persistence/recovery, controllers, networking, SAW native FX, DirectX, VST2/VSTi, and VST3 hosting |
| Excluded | SAC and Midi WorkShop except documented integration boundaries; installer/binary execution; decompilation; private code/SDKs; independent performance validation; procurement or legal conclusions |
| Evidence mode | Documentary only; no `OBSERVED` runtime claims |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

## 1. Executive summary

- **DOCUMENTED:** SAWStudio64 V2.4 is the current public download in a Windows-only family whose user-visible model combines a linear, region-based MultiTrack with a tightly linked virtual console. The product targets recording, music, film/video sound, broadcast, and theatre/show-control work [C-001, C-002, C-004].
- **DOCUMENTED / contradiction:** Current marketing describes 120 input tracks, but the V2 manual's detailed signal-flow chapter specifies 72 input modules, six returns, and 24 outputs. The authoritative runtime capacity is unresolved and must not be normalized away [C-005].
- **DOCUMENTED:** The architecture-relevant editing model uses non-destructive Regions/MT Entries linked to external sound files, eight take/edit layers per input track, real-time SoftEdge crossfades, live/offline streaming automation, configurable routing, and persistent EDL undo history [C-006, C-007, C-011, C-027].
- **DOCUMENTED vendor architecture claim:** The manual describes a 24-bit internal path, on-the-fly source assembly, per-channel source buffers, priority multithreading, and assembly-language DSP. These statements establish what RML Labs documents, not independently measured quality or complete proprietary internals [C-008, C-009].
- **DOCUMENTED hosting headline:** Current V2 documents VST2/VSTi, VST3, DirectX, and SAW native FX on Windows. VST3 arrived as a USD 100 paid V2.0 update in July 2025. VST3 requires one manually authored `.ini` link per plug-in instead of disk scanning; VST2 accepts a direct folder placement or optional `.ini`; DirectX discovery is system-wide [C-017–C-020, C-036].
- **DOCUMENTED hosting depth:** The host exposes ordered pre-fader, post-fader, and final-resolution patches, custom plug-in windows, bypass automation, VST instruments, as many as 64 VST output channels, VST Time Info, presets/EDL state, reported-latency compensation and an override, plus warnings for plug-ins that change buffer size [C-012, C-021–C-023].
- **UNKNOWN:** No retained public source resolves plug-in process isolation, sandboxing, crash containment, architecture bridging, signature policy, validation/blacklisting/quarantine, duplicate identity, complete sidechain and bus semantics, MPE/MIDI 2.0, stable parameter identity, tail reporting, dynamic I/O, missing-plug-in placeholders, or full state migration [C-024–C-026].
- **DOCUMENTED:** Recovery is unusually explicit: up to 99 complete EDL undo levels, crash/power-loss recovery, file re-pathing, forced engine shutdown, header repair, and V2.0/V2.4 recovery paths for overlong WAV recordings [C-010, C-027, C-035].
- **Confidence:** High for current version/download identity, public workflow, routing, persistence, affirmative plug-in formats, manual discovery, PDC limitations, video/show control, and controller/network surfaces. Medium for product capacity because official sources conflict. Low or `UNKNOWN` for proprietary runtime boundaries, modern OS qualification, security/accessibility, and licensing.

## 2. Product identity, history, and market position

**DOCUMENTED.** RML Labs expands SAW as “Software Audio Workshop” and presents SAWStudio as a serious Windows audio workstation combining virtual mixing with hard-disk editing. Named use cases include music production, full-length motion-picture sound, theatre automation, broadcast, video, and game-audio production [C-002; S-002, S-005].

**DOCUMENTED.** The public download page identifies SAWStudio64 V2.4 as current, while preserving SAWStudio64 1.4, Full 32-bit 5.8a, and Basic 2.8. V2 release notes state that 64-bit 1.0 began with 32-bit features through 5.7 and that VST3 entered in the USD 100 V2.0 paid update in July 2025 [C-001, C-033, C-036; S-003, S-004]. A current V2.4 release plus V2.1–2.4 fixes is evidence of public maintenance, though no release date for V2.4 is printed [C-033].

**DOCUMENTED.** The current product page contrasts Full and Basic: Full is listed with 120 input/24 output tracks, video, six libraries, eight layers, Show Control, TCP/IP, SAC-Link, channel recall, and multi-CPU awareness; Basic lists 24 inputs, eight outputs, one library, one layer, and omits those advanced surfaces [C-036; S-002]. Hosting parity across these legacy/current editions is not specified.

## 3. Workflow and conceptual model

**DOCUMENTED.** The principal mental model is a hardware-studio analogue: a linear MultiTrack recorder/editor linked bidirectionally to several views of a virtual console. Tracks contain MT Entries; each entry references a Region, and a Region references source sound-file data. Input tracks hold media, return/output tracks carry routing and automation, and dedicated Video and Control tracks add post-production and show-control objects [C-004, C-006; S-002, S-005].

**DOCUMENTED.** Each input track has eight layers, with only the top layer active. Layers can hold takes or alternate edits and can be switched during playback; the manual cautions that switching temporarily stops processing threads and can require more latency in dense sessions [C-006; S-005, pp. 86–108]. Select, Automation, and Offset modes alter how timeline gestures operate. Function keys preserve as many as 24 multi-window workspaces [C-004, C-007].

**INFERENCE.** SAWStudio's composition boundary is “external media → Region → timeline entry → track/channel → routed output,” rather than clips owning media or a project embedding assets. A plausible alternative is to call Region and MT Entry interchangeable because the manual sometimes does so; its glossary and library/import behavior nevertheless support a source-reference versus placement distinction [C-006, C-027].

## 4. Publicly documented architecture

**DOCUMENTED (vendor description).** Public documentation exposes a live engine that gathers source data from disk or an optional RAM cache, converts it to an internal 24-bit stereo format, maintains an independent source buffer per channel, applies routing/processing, and uses priority multithreaded and hand-coded assembly routines. A source-load meter and MultiTrack-load meter separately expose disk/RAM preparation and real-time processing pressure [C-008, C-010; S-002, S-005, pp. 10, 88–89, 169–184].

**DOCUMENTED.** User-visible extension boundaries are SAW native FX, DirectX, VST2/VSTi, VST3, MIDI-control templates, optional Midi WorkShop, SAC shared-memory links, DirectShow video, and TCP/IP host/slave/remote modes [C-015–C-020, C-029, C-030].

**UNKNOWN.** The retained sources do not disclose executable/process topology, real-time thread allocation, lock-free structures, graph representation, memory-safety boundaries, IPC for plug-ins, sandbox design, project schema, or ABI versioning. “Priority multithreaded” and “assembly language” do not establish those details [C-025].

## 5. Audio engine

**DOCUMENTED.** The MultiTrack's internal path is stated as 24-bit; destination resolution can be 16, 20, or 24 bit with selectable dither. Documented sample-rate choices include common rates from 8.2 to 192 kHz, pull-up/down rates, and a custom 3,000–400,000 Hz setting. Nonmatching source files are converted during playback, while BuildMix can instead apply a single final conversion [C-009; S-005, pp. 14–16, 248–253].

**DOCUMENTED.** Standard buffer sizes run from 64 to 4096 samples with one to ten input/output preload buffers. Driver choices include Windows Multimedia/MME, WDM-compatible Multimedia, ASIO, and the documented but “under development” DWave mode. ASIO buffer size is driver-controlled [C-010; S-002, S-005, pp. 42–43, 271–276].

**DOCUMENTED.** Reported VST latency is compensated by absorbing initial blank buffers. Bypass is backward-compensated during playback; live unpatch is not and requires stop/restart. Plug-in latency reaches live inputs and may stop the engine. Users can inspect/override a plug-in's reported value per EDL/preset. Buffer-size-changing plug-ins trigger a title-bar diagnostic naming the first plug-in/channel, but can cause live-input drift [C-012; S-005, pp. 137, 193–198]. This is a narrower, limitation-rich PDC contract, not proof of comprehensive graph-wide compensation.

**DOCUMENTED.** BuildMix can render a new sound file, current track/layer, multiple device outputs, or FX-owned output; track export offers unprocessed or processed solid WAV files. Real-time and BuildMix SRC quality are separately selectable [C-014]. Oversampling policy, tail queries, render determinism, general freeze semantics, and multicore scheduling policy remain **UNKNOWN** [C-025, C-026].

**DOCUMENTED reliability controls.** MT/Src load meters can stop playback at saturation, and a Break-key forced shutdown attempts to stop engine threads after a driver/engine lock [C-010].

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED.** SAWStudio uses a linear timeline with input, return, output, video, and control tracks. Regions are reusable links to source audio; MT Entries are their placements. Edits include split, trim, move/copy, insert/overwrite, ripple-like deletion variants, slip-within-boundaries, reverse, vari-speed/pitch, grouping, zero-cross location, and sample-level waveform drawing [C-004, C-006].

**DOCUMENTED.** SoftEdge extends entry boundaries non-destructively and renders a real-time -6 dB overlap without preprocessing stem files. Eight layers support take storage and manual composite building; Multi-Take Loop and Multi-Take Layer Loop recording place timestamped takes or advance layers automatically [C-006, C-013]. There is no distinct modern take-lane/comp swipe model documented; comping is manual via layers and copy operations.

**DOCUMENTED.** Tempo maps permit tempo, signature, and measure-count changes; timeline display can be Time, SMPTE/MTC, Sample, or Tempo. Vari-speed changes duration and pitch together, while “Vari-Pitch” still changes duration according to the manual. Algorithmic elastic-audio quality independent of pitch is **UNKNOWN** [C-006].

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED.** Core SAWStudio generates/reads MTC, generates SMPTE LTC, sends MIDI Control Track commands (program, bank, note, and arbitrary hex/decimal/ASCII strings), receives controller data, and maps physical surfaces through `.MCT` templates. VST instruments can select a hardware or Midi WorkShop virtual input port, expose multiple outputs, and receive VST Time Info for tempo synchronization [C-015, C-022, C-030; S-005, pp. 145–150, 197–214, 268–271].

**DOCUMENTED boundary.** The View menu exposes Midi WorkShop only when the add-on is installed. The retained SAWStudio manual does not establish a built-in piano roll, notation editor, or full MIDI sequence-track model [C-015].

**UNKNOWN.** MIDI-file import/export, SysEx recording as timeline data, plug-in MIDI output, event-bus limits, sample-accurate event delivery, MPE/per-note expression, and MIDI 2.0 are not specified [C-026]. Control-surface MIDI and arbitrary command strings are not evidence for those music-sequencing contracts.

## 8. Routing, mixer, automation, and control

**DOCUMENTED.** The detailed signal-flow chapter describes 72 input modules, six return/aux modules, and 24 outputs, while the current overview claims 120 inputs. Inputs provide reorderable EQ/dynamics/pre-FX order, pre/post FX, six stereo sends, channel keying from self or another input, mute/solo/fader/pan, surround pan, and multiple output assignments. Outputs can address hardware directly or act as subgroups routed to direct outputs [C-005, C-011].

**DOCUMENTED.** Up to ten discrete surround destinations can be fed by eight XY nodes plus separate center/sub sends; templates can represent 5.1, 7.1, quad, or custom layouts [C-011]. This is not evidence of ADM/immersive object metadata.

**DOCUMENTED.** Automation is described as streaming, writeable live or stopped, editable by range/type, slope-controlled, displayable over waveforms, and offsettable without flattening relative moves. Defaults and automation save in EDLs; external controller templates can write automation [C-007]. The vendor's “down-to-the-sample” language is documentary, not an independent timing measurement.

**UNKNOWN.** Arbitrary third-party plug-in sidechain exposure, feedback graph rules beyond documented output restrictions, VCA identity versus “VCA type” subgroup behavior, OSC, automation parameter IDs/text/ranges, and sample-accurate third-party parameter delivery are unresolved [C-026].

## 9. Recording, comping, and media handling

**DOCUMENTED.** MultiTrack recording supports immediate record, simultaneous record/play, manual and marked-area punch, Record Ready, retake-to-start/cursor/all, loop takes, layer loop takes, stereo/mono device sources, channel sources, and input monitoring. Tape-style monitor switching, pre/post processing record taps, up to six headphone mixes, loopback latency adjustment, and SAC channel/record-bus sources are described [C-013, C-029].

**DOCUMENTED.** Accepted audio is 16/20/24-bit PCM mono/stereo WAV, 32-bit float mono/stereo WAV, and 16/20/24-bit mono/stereo AIFF/AIF. Library Views can link media in place or import/copy it; the File View exposes missing/orphaned media and re-path/rename operations [C-014, C-027].

**DOCUMENTED.** V2.0 added 64-bit file pointers and internal recovery for overlong WAV recordings; V2.4 added an opt-in “Ignore Audio Data Length For All New File Opens” recovery path for corrupt size fields. Header repair and region splitting can salvage data into legal-sized files [C-035].

**UNKNOWN.** BWF/iXML metadata depth, proxy/conform systems, automatic sample-rate conform policy beyond SRC, and a manifest-based collect/archive format are not specified. Save-and-trim/extract are the documented consolidation mechanisms [C-028].

## 10. Instruments, effects, content, and native devices

**DOCUMENTED.** The product includes native SAWStudio API effects and manual chapters for native Equalizer and Echo/Delay modules. Native effects are real-time, non-destructive, automatable, and have dedicated preset formats. The console also contains built-in five-band EQ, gate, compressor, aux processing, dither, and soft clipping [C-020; S-005, pp. 169–193].

**DOCUMENTED.** The SAWStudio API is a proprietary native plug-in boundary described as passing application/processing information and supporting automation. No public SDK package, ABI version policy, or third-party authoring license was retained [C-020, C-032].

**DOCUMENTED boundary.** VST instruments/soft synths are hosted, but Midi WorkShop is a separate optional add-on. No bundled sampler/synth inventory or modular device-rack system is established [C-015, C-022].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` below means the retained official affirmative set did not resolve support; it is not a dynamic rejection result. `NOT_APPLICABLE` reflects the documented Windows-only product boundary [C-003, C-024].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **NOT_APPLICABLE:** no macOS edition | **DOCUMENTED:** VST2x/VSTi | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | Current V2 manual; legacy 32/64 variants also described generally, exact parity `UNKNOWN` | Direct `.dll` in `VST_Plugins` or optional `.ini`; own GUI required | C-017, C-021; S-002, S-005 |
| VST3 | **NOT_APPLICABLE:** no macOS edition | **DOCUMENTED:** supported | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | SAWStudio64 V2.0+; current 2.4 | Paid V2 update; required per-plug-in `.ini`; Waves shell support | C-018, C-036; S-004, S-005 |
| AUv2 | **NOT_APPLICABLE:** no macOS edition | **NOT_APPLICABLE:** Apple format / Windows-only host | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | No in-scope edition | No host claim | C-003, C-024 |
| AUv3 | **NOT_APPLICABLE:** no macOS edition | **NOT_APPLICABLE:** Apple format / Windows-only host | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | No in-scope edition | No host claim | C-003, C-024 |
| AAX | **NOT_APPLICABLE:** no macOS edition | **UNKNOWN:** no affirmative host evidence | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | Current affirmative set inspected | No formal rejection/runtime probe | C-024; S-002, S-005 |
| CLAP | **NOT_APPLICABLE:** no macOS edition | **UNKNOWN:** no affirmative host evidence | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | Current affirmative set inspected | No formal rejection/runtime probe | C-024; S-002, S-005 |
| LV2 | **NOT_APPLICABLE:** no macOS edition | **UNKNOWN:** no affirmative host evidence | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | Current affirmative set inspected | No formal rejection/runtime probe | C-024; S-002, S-005 |
| LADSPA | **NOT_APPLICABLE:** no macOS edition | **UNKNOWN:** no affirmative host evidence | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | Current affirmative set inspected | No formal rejection/runtime probe | C-024; S-002, S-005 |
| DSSI | **NOT_APPLICABLE:** no macOS edition | **UNKNOWN:** no affirmative host evidence | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | Current affirmative set inspected | No formal rejection/runtime probe | C-024; S-002, S-005 |
| JSFX | **NOT_APPLICABLE:** no macOS edition | **UNKNOWN:** no affirmative host evidence | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | Current affirmative set inspected | No formal rejection/runtime probe | C-024; S-002, S-005 |
| DirectX/DXi | **NOT_APPLICABLE:** no macOS edition | **DOCUMENTED:** DirectX effects; DXi subtype `UNKNOWN` | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | Current V2 manual | System-wide discovery; “DirectX” does not resolve DXi instruments | C-019; S-002, S-005 |
| Rack Extension | **NOT_APPLICABLE:** no macOS edition | **UNKNOWN:** no affirmative host evidence | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | Current affirmative set inspected | No host claim | C-024; S-002, S-005 |
| Product-native/other | **NOT_APPLICABLE:** no macOS edition | **DOCUMENTED:** SAWStudio native API FX | **NOT_APPLICABLE:** no Linux edition | **NOT_APPLICABLE:** no mobile/web edition | Current V2 manual | Proprietary native API; public authoring/licensing terms `UNKNOWN` | C-020, C-032; S-005 |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED.** VST2 plug-ins can sit directly in the application `VST_Plugins` directory. If they must remain elsewhere, an optional one-line `.ini` points to the `.dll`. VST3 does not use a disk scan: each plug-in requires a one-line `.ini` in `VST_Plugins`, whose filename controls the displayed FX Choices name. The VST3 path can point anywhere, including nested default locations [C-017, C-018].

**DOCUMENTED.** Waves VST3 shells use a special `vst3s` marker and exact shell member name; one link is created for each desired member. V2.3 fixed very long nested paths and V2.4 fixed `.ini` parsing for names containing periods [C-018]. DirectX installs system-wide and appears automatically [C-019].

**INFERENCE.** VST3 `.ini` files function as a user-maintained allowlist and naming layer. A plausible alternative is to call them a catalog rather than discovery because the host still opens the target binary; in either case, no broad disk scanner is involved [C-018].

**UNKNOWN.** Binary validation, cache/keying, duplicate IDs, version replacement, malformed/hanging plug-in timeout, blacklist/quarantine, crash-safe scan process, per-item disable, rescan UX, and diagnostic logs are undocumented [C-024]. Manual inclusion is not validation or containment.

### 11.3 Runtime isolation and compatibility

**DOCUMENTED.** SAWStudio64 and V2 are 64-bit applications, and the example VST3 path names `x86_64-win`. Release notes expand VST output capacity and fix specific VST/VST3 behavior [C-003, C-022, C-023].

**UNKNOWN.** In-process versus out-of-process execution, per-instance/shared sandboxing, crash containment, 32↔64-bit bridging, x86↔Arm translation, signature enforcement, Windows quarantine policy, memory limits, and compatibility modes are not stated [C-025]. A plug-in's ability to stop the engine and plug-in-specific crash fixes are failure evidence, not proof of process topology.

### 11.4 Host/plugin processing contract

**DOCUMENTED.** Plug-ins occupy ordered pre-fader, post-fader, or output final-resolution patch lists and may be inserted/reordered during playback. Pre/post patches process the internal 24-bit path and permit buffer-size changes; final-resolution patches run after dither/soft clipping and prohibit size changes. Patch bypass is automatable [C-021].

**DOCUMENTED.** VST instruments accept a selected MIDI input port, can be recorded from their mixer channel, receive VST Time Info, and can assign sequential SAW tracks to as many as 64 output channels. V2 fixes include VST synth multi-output handling and time-info compatibility [C-022].

**DOCUMENTED.** Latency compensation and buffer-size-change limitations are described in Section 5 [C-012].

**UNKNOWN.** Complete audio/event bus enumeration, arbitrary sidechain buses, mono/stereo/surround negotiation, MIDI output, note expression, MPE/MIDI 2.0, sample-accurate event/parameter delivery, tail reporting, bypass versus suspend, offline-call flags, dynamic I/O, in-place processing, and headless operation are unspecified [C-026]. The console's native dynamics key input does not prove third-party sidechain support.

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED.** FX bypass is automatable; the automation View Filter can isolate FX automation. DirectX and VST plug-ins expose built-in presets when supplied, plus SAWStudio `.dxp`/`.vsp` preset files. EDLs preserve patched plug-ins/settings/window positions, while channel templates can carry FX and parameter state [C-007, C-023].

**DOCUMENTED negative/fix evidence.** V2.0 fixed VST/VST3 state saving when a window had not moved, adjusted VST3 settings saves and bypass automation, and enlarged the VST settings buffer; 1.1a/1.1b had already expanded support for very large setting data. V1.4 fixed crashes involving FX automation with reordered plug-ins [C-023, C-033].

**UNKNOWN.** Stable parameter IDs, normalized ranges/display text, gesture semantics, sample accuracy, state-chunk schema/limits, external asset references, format migration, same-plug-in VST2↔VST3 substitution, and missing/unlicensed plug-in placeholders are not documented [C-026].

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED.** Only VST plug-ins supplying their own graphic interface are listed/usable. Plug-in windows can be kept on top or have that status cancelled; their position and visibility save in EDLs. Patch windows expose order and bypass, while the title bar identifies the first buffer-size-changing plug-in and channel [C-012, C-021].

**DOCUMENTED failure evidence.** Release notes mention VST state, automation, multi-output, time-info, path, Waves shell, and FX-reorder crash fixes [C-018, C-022, C-023, C-033]. These establish prior failure modes, not incidence or present conformance.

**UNKNOWN.** Generic editor fallback, HiDPI scaling, keyboard/focus mediation, accessibility propagation, multiple editors, window recovery, plug-in crash UX, rejected-load diagnostics, and safe-mode session opening are not specified [C-024–C-026].

## 12. Extensibility and integration

**DOCUMENTED.** Integration surfaces include SAW native FX, VST/DirectX, Midi WorkShop, `.MCT` controller templates, automation preset files, command-line session/preferences/workspace loading, SAC-Link, Control Track MIDI/serial commands, and TCP/IP host/slave/video-slave/remote modes [C-015, C-020, C-029, C-030].

**DOCUMENTED.** MIDI controller templates use a virtual lookup-table model so hardware commands can map to console, transport, and editing functions without program changes/restart. The manual lists Mackie Control/HUI, BCF2000, MotorMix, TranzPort, AlphaTrack, and older digital mixers [C-030].

**UNKNOWN.** No retained source establishes general scripting, a public command API, OSC, native SDK distribution, ABI stability, third-party certification, or extension-store governance [C-032]. TCP/IP commands are a closed documented list and the manual warns unsupported commands can produce undesirable EDL results [C-029].

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED.** An `.edl` stores session information including automation, mixer configuration, Regions, and sound-file links, but not audio data. Default values, automation, routing, plug-in state, window placement, libraries, and other session state are documented as saved in EDLs [C-023, C-027].

**DOCUMENTED.** Auto EDL Undo creates complete background EDLs before many edits, supports up to 99 levels, persists timestamped histories beyond application restarts, and offers last-undo/history recovery after crash or power loss. Some mixer changes do not auto-snapshot, so a manual snapshot key is provided [C-027]. Missing media can be automatically re-pathed to the EDL drive or found through as many as ten alternate paths [C-027].

**DOCUMENTED.** Save-and-trim copies only used audio with selectable handles; Extract Session creates new per-track files/EDL from a range; Save and Re-Path moves the session boundary. Legacy 32-bit EDL import carries Regions, entries, mute, volume, and pan but not effects/markers. Blend Session can merge media/automation/control/video, but not FX plug-in data [C-028].

**UNKNOWN.** EDL schema/versioning, forward compatibility, atomic saves, checksums, merge/conflict semantics, missing-plug-in placeholders, cloud collaboration, source control suitability, and AAF/OMF/ADM/MusicXML/DAWproject interchange are not documented [C-026, C-028]. Audio track export is the clearest open handoff.

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED.** BuildMix exports mono/stereo outputs per active output device at selected rate/resolution/dither, while track export creates processed or unprocessed WAV stems. Region export and video audio extraction provide additional delivery paths [C-014]. DDP, loudness-target workflows, and ADM are **UNKNOWN** [C-028].

**DOCUMENTED.** The DirectShow Video Track arranges clips on the audio timeline, supports frame stepping/scrubbing, audio extraction, DV conversion/render/capture, and SMPTE-aware operation. Vendor documentation describes a single-engine relationship intended to keep video tied to audio position; no independent sync test was performed [C-016].

**DOCUMENTED.** Control Track commands can stop/cue/preload/play, wait until wall-clock time, send MIDI/serial commands, and trigger SAC scenes. Show Control sequences independent EDLs with continue/preload/wait/stop and MIDI-trigger behavior. TCP/IP can synchronize/remote as many as eight machines; SAC-Link uses shared-memory buffers and can record as many as 120 SAC sources [C-029].

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED.** Formal requirements list SAWStudio64 for Windows 7/8/10 64-bit, 2 GB minimum RAM, and MME/WDM/ASIO hardware. The V2.1 fix for newer Windows 10/11 updates supplies practical Windows 11 evidence but not a formal current support matrix [C-003, C-033].

**DOCUMENTED.** Capacity evidence includes 24 stereo audio devices, 64 VST outputs, RAM-bounded Region count, load meters, optional Region/PeakData memory caches, high/real-time priority modes, and forced engine shutdown [C-010, C-034]. Vendor speed/quality claims are not benchmarks.

**DOCUMENTED risk.** The manual contains dated tuning advice to run as Administrator, disable Windows Update/services, enable insecure guest logons/SMB1, disable password-protected sharing, and grant `Everyone` full drive permissions. Those are vendor-documented historical instructions, not acceptable modern security recommendations; a new DAW should explicitly reject them [C-031; S-005, pp. 24–40].

**DOCUMENTED limited usability support.** Context-sensitive help, many keyboard shortcuts, multi-monitor layouts, workspace presets, and multi-language hot-key guidance exist [C-032].

**UNKNOWN.** Code signing, installer provenance, plug-in trust boundaries, telemetry/privacy, update rollback, CVE process, localization coverage, screen-reader semantics, keyboard-only completeness, color-contrast conformance, and accessibility certification are not established [C-031, C-032].

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED.** VST3 was sold as a paid V2.0 update; current and legacy demos/manuals are public. SAWStudio native FX, Midi WorkShop, SAC, controller templates, VST/DirectX, Windows drivers, and DirectShow form the surrounding ecosystem [C-001, C-015, C-020, C-029, C-036].

**UNKNOWN.** Product EULA, activation count, transfer rights, offline use, SDK terms, SAW native plug-in authoring/redistribution rights, and trademark/certification terms were not available in retained evidence [C-032].

**INFERENCE / clean-room constraint.** SAWStudio's documented ability to host VST2/VST3/DirectX grants no SDK, trademark, redistribution, compatibility, signing, or certification rights to another DAW. VST2 is a discontinued licensing concern, and all format-owner terms require an independent current review. Proprietary assembly, UI, EDL representation, native ABI, and DSP must not be copied [C-032]. This is not legal advice.

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED / INFERENCE:** The Region/entry/track separation, external-media links, eight layers, and Save-and-Trim/Extract operations form a clear non-destructive editing and consolidation model [C-006, C-027, C-028].
- **DOCUMENTED:** Routing, live monitoring, six aux mixes, multi-output rendering, surround, Control/Video tracks, Show Control, and TCP/IP make the product unusually broad for studio, post, and theatre workflows [C-011, C-013, C-016, C-029].
- **DOCUMENTED:** Recovery mechanisms are explicit and operator-visible: persistent full-EDL undo, re-pathing, forced shutdown, file-header repair, and long-WAV salvage [C-010, C-027, C-035].
- **DOCUMENTED:** Plug-in documentation goes beyond format names by spelling out manual discovery, GUI requirements, patch positions, PDC limits, buffer-change warnings, multi-output, state/presets, and known fixes [C-012, C-017–C-023].

### Liabilities / risks

- **CONTRADICTION:** Official sources disagree on 120 versus 72 input tracks/modules [C-005].
- **DOCUMENTED:** VST3 setup is manual and filename/path based, Waves shells need hand-authored member links, and only custom-GUI VST plug-ins load [C-018, C-021]. This increases configuration and diagnostics burden.
- **DOCUMENTED / UNKNOWN:** PDC has live-unpatch/live-input limits, while isolation, validation, deep bus/event semantics, and missing-plug-in durability are unknown [C-012, C-024–C-026].
- **DOCUMENTED risk:** Formal platform documentation lags Windows 11, and the manual includes obsolete/insecure system-tuning advice [C-003, C-031, C-033].
- **UNKNOWN:** Licensing, accessibility, signing, privacy, modern update policy, and open interchange remain unclear [C-028, C-031, C-032].

**Architecture lesson.** SAWStudio is valuable as a public interaction/persistence reference—especially Regions, live console linkage, show control, and recovery—not as evidence that its proprietary Windows/assembly implementation or manual plug-in catalog should be replicated [C-004, C-006, C-027, C-029, C-032].

## 18. Transferable patterns

| Pattern | Problem | Minimal clean-room mechanism | Support | Prerequisites / tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Region versus placement identity | Repeated media edits should not duplicate source data | Immutable media source plus reusable range object plus timeline placement identity | C-006, C-027 | Needs stable IDs, relinking, handles, and migration; do not copy EDL representation | **CANDIDATE** |
| Layer-based take preservation | Multiple takes/edits need fast comparison | Fixed or dynamic track layers with one active comp and non-destructive copy-up | C-006, C-013 | Live switching must be lock-free/glitch-safe; modern comp UI may be preferable | **CONDITIONAL** |
| Explicit signal-flow positions | Generic inserts hide processing intent | Typed pre-EQ/pre-fader/post-fader/final-output nodes with visible ordering | C-011, C-021 | More graph complexity; final-resolution restrictions need validation | **CANDIDATE** |
| Visible latency exception handling | Incorrect plug-in reports break sync | Show reported latency, allow scoped override, identify buffer-changing instances | C-012 | Overrides can mask plug-in defects; require fixture tests and provenance | **CANDIDATE** |
| Persistent project snapshots | A crash should not erase unsaved work | Versioned incremental/full snapshots with timestamps and independent recovery browser | C-027 | Full copies consume storage; atomicity and pruning must be designed | **CANDIDATE** |
| Recovery-first media tooling | Long live recordings and moved files fail in atypical ways | Header inspection/repair, non-destructive salvage, alternate-path search, split recovery | C-027, C-035 | Must never mutate originals without backup; format limits need tests | **CANDIDATE** |
| Timeline-native show control | Theatre needs deterministic cues beyond audio clips | Typed cue/stop/preload/wait/external-command events plus playlist of sessions | C-029 | Safety, authorization, dry-run, redundancy, and audit requirements are substantial | **CONDITIONAL** |
| Saved operator workspaces | Dense desktop tools need task-specific layouts | Named/versioned window-layout presets with keyboard recall | C-004 | Accessibility and multi-display migration need explicit handling | **CANDIDATE** |
| Explicit plug-in allowlist | Broad scans cause clutter and supply-chain exposure | User-approved catalog with canonical path, identity, hash, status, and rescan controls | C-018, C-024 | SAW's hand-authored `.ini` is too fragile; adapt the goal, not the mechanism | **CONDITIONAL** |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** Hand-authored one-line `.ini` files as the primary modern VST3 discovery UX. They provide selection control but lack documented validation, stable identity, diagnostics, and automated migration [C-018, C-024].
- **REJECTED:** Requiring custom VST graphics as a condition of instantiation. A robust host should provide a generic parameter editor and headless path [C-021, C-026].
- **REJECTED:** Treating automatic latency compensation as complete PDC. Live unpatch, live inputs, buffer-size changes, and unreported latency are explicitly exceptional [C-012].
- **REJECTED:** Treating “priority multithreaded assembly” or vendor performance language as an architecture prescription or benchmark [C-008].
- **REJECTED:** Dated operating-system changes that disable updates, enable SMB1/insecure guest access, or grant broad drive permissions [C-031].
- **REJECTED:** Destructive sample drawing without automatic undo as a default edit path [C-006, C-027].
- **REJECTED:** Inferring sandboxing from manual cataloging, 64-bit code, or prior crash fixes [C-024, C-025].
- **CURIOSITY_NO_GO:** Runtime process-tree/crash-fixture study—highest technical value, but outside the documentary/no-execution scope and current source budget.
- **CURIOSITY_NO_GO:** Full/Basic/legacy plug-in parity—moderate comparison value, but unlikely to change the current V2 architecture conclusion without executing old builds.
- **CURIOSITY_NO_GO:** Exhaustive controller-template inventory—high duplication and low marginal architecture value after the template mechanism was established [C-030].
- **CURIOSITY_NO_GO:** Corporate/market-share history—does not resolve the decision-critical engine, persistence, or host contracts.
- **CURIOSITY_NO_GO:** Forum anecdotes about specific plug-ins—lower authority and cannot establish current internals without controlled reproduction.
- **CURIOSITY_NO_GO:** Reverse engineering EDLs or binaries—prohibited and unnecessary for the documentary decision.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / check | Documentary result | Status / next discriminator |
| --- | --- | --- |
| H1: The current public build is legacy 1.4 | Download page separately lists current V2.4 and legacy 1.4 | **REFUTED** [C-001] |
| H2: Current SAWStudio hosts only VST2/DirectX | V2.0+ explicitly adds VST3 | **REFUTED** [C-018] |
| H3: VST3 support implies normal folder scanning | Manual says `.ini` is required specifically to avoid scanning disks | **REFUTED** [C-018] |
| H4: Accepted VST means a generic editor exists | Manual says only VST plug-ins with their own graphic UI are listed/usable | **REFUTED** [C-021] |
| H5: PDC makes live patch changes transparent | Bypass is compensated, but unpatch during playback is not; restart is required | **REFUTED as blanket claim** [C-012] |
| H6: VST3 implies full host-contract fidelity | Some discovery, state, outputs, timing, and PDC are documented; sidechains, expression, sample accuracy, isolation, tails, and dynamic I/O remain unknown | **PARTIAL ONLY** [C-018, C-022–C-026] |
| H7: Current capacity is unambiguously 120 inputs | Product overview says 120; detailed manual says 72 | **CONTRADICTED / unresolved** [C-005] |
| H8: Windows 11 is formally supported | V2.1 fixes Win10/11 updates, but requirements stop at Win10 | **INCONCLUSIVE** [C-003, C-033] |
| H9: EDLs are self-contained | Glossary says EDL stores links, not sound-file data; trim/extract are separate | **REFUTED** [C-027, C-028] |
| H10: A missing plug-in retains a durable placeholder/state | No retained source describes that behavior | **UNKNOWN** [C-026] |
| H11: Plug-ins run in a separate process | No process-boundary evidence | **UNKNOWN** [C-025] |
| H12: MIDI control proves MPE/MIDI 2.0 note expression | No such music-event contract is documented | **REFUTED inference / UNKNOWN capability** [C-015, C-026] |

**Accepted → discovered → instantiated → full contract check:**

1. **Format accepted:** documented for VST2/VSTi, VST3, DirectX, and SAW native FX [C-017–C-020].
2. **Discovered/cataloged:** documented through VST2 folder/optional link, required VST3 link, and system DirectX registration [C-017–C-019].
3. **Instantiated:** documented in ordered FX patches; VST instruments and multi-output paths are described [C-021, C-022].
4. **Full contract works:** not established; significant bus/event, parameter, isolation, recovery, tail, missing-plug-in, and dynamic-I/O semantics remain `UNKNOWN` [C-024–C-026].

No product or plug-in was executed, so there are no `OBSERVED` claims.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | **DOCUMENTED** | High | Public downloads list SAWStudio64 V2.4 as current plus 64-bit 1.4, Full 32-bit 5.8a, and Basic 2.8 | Cutoff snapshot | S-003, S-004 | Direct version/download labels | V2.4 date not printed |
| C-002 | **DOCUMENTED** | High | SAWStudio is RML Labs' Windows audio workstation for studio, music, post, broadcast, and theatre workflows | Product identity | S-001, S-002, S-005 | Official product/manual descriptions | Intended-use claims do not measure adoption/quality |
| C-003 | **DOCUMENTED / UNKNOWN** | High | Formal SAWStudio64 requirements name Win7/8/10 64-bit; V2.1 fixes newer Win10/11 updates, leaving formal Win11 support unresolved | Platform | S-002, S-004, S-005 | Direct requirements and release note | A fix is not a support matrix |
| C-004 | **DOCUMENTED** | High | Workflow links a linear MultiTrack, multiple console views, and saved operator workspaces | User model | S-002, S-005 | Direct overview/navigation | Internal graph not implied |
| C-005 | **DOCUMENTED contradiction** | High | Product overview says 120 input tracks; detailed V2 signal flow says 72 input, 6 return, 24 output modules | Current capacity | S-002, S-005 | Two official first-party sources | Runtime capacity/edition mapping unresolved |
| C-006 | **DOCUMENTED** | High | Regions/MT Entries link external audio, eight layers preserve takes/edits, and SoftEdge performs non-destructive real-time crossfades | Editing | S-002, S-005 | Manual glossary/edit chapters | Sample drawing is separately destructive |
| C-007 | **DOCUMENTED** | High | Streaming automation can be written live/offline, edited/filtered/offset, controller-written, and saved with defaults in EDLs | Automation | S-002, S-005 | Direct automation chapters | Timing precision is vendor documentary claim |
| C-008 | **DOCUMENTED** | Medium-high | Vendor describes 24-bit on-the-fly engine, per-channel source buffers, priority multithreading, and assembly DSP | Public architecture | S-002, S-005 | Direct engine/signal-flow text | Not independent implementation/performance validation |
| C-009 | **DOCUMENTED** | High | Internal path is 24-bit; output is 16/20/24-bit with dither; sample rates include common/pull rates and custom 3k–400k | Audio format | S-005 | Direct menu/bit-resolution chapters | Hardware/driver support can limit actual rates |
| C-010 | **DOCUMENTED** | High | Buffers are 64–4096 samples with 1–10 preloads; MME/WDM/ASIO/DWave, load meters, and forced shutdown are documented | Engine operation | S-002, S-005 | Direct setup/menu text | No comparative latency/reliability measurements |
| C-011 | **DOCUMENTED** | High | Mixer exposes typed input/return/output flow, six auxes, subgroups, multi-destination routing, and up to ten surround destinations | Routing | S-002, S-005 | Detailed signal-flow chapter | Input count contradiction C-005 |
| C-012 | **DOCUMENTED** | High | VST reported latency is compensated with explicit live-unpatch/live-input/buffer-change limitations and per-instance override/diagnostic | Plug-in timing | S-005 | Direct VST latency sections | Does not prove complete graph-wide PDC |
| C-013 | **DOCUMENTED** | High | Recording supports SRP, punch, retake, loop/layer takes, monitoring, channel/device taps, and aux headphone mixes | Recording | S-005 | Record chapters | Hardware/driver-dependent latency |
| C-014 | **DOCUMENTED** | High | BuildMix/track/region export and WAV/AIFF import support are documented with rate/resolution options | Media/delivery | S-005 | File and MixDown chapters | Not open project interchange |
| C-015 | **DOCUMENTED / UNKNOWN** | High | Core supports MIDI control/MTC/Control Track and VST instrument input; Midi WorkShop is optional; built-in notation/piano-roll sequencing not established | MIDI boundary | S-003, S-005 | Manual View/MIDI chapters | Absence is not proof of no hidden capability |
| C-016 | **DOCUMENTED** | High | DirectShow Video Track supports timeline clips, frame control, extraction, conversion/render/capture, and audio-position linkage | Video/post | S-002, S-005 | Direct video chapter | Vendor sync claims not independently tested |
| C-017 | **DOCUMENTED** | High | VST2/VSTi are hosted via direct `VST_Plugins` placement or optional path `.ini` | Windows VST2 | S-002, S-005 | Direct installation instructions | Exact legacy/current edition parity unknown |
| C-018 | **DOCUMENTED** | High | VST3 is supported in V2.0+ through required per-plug-in `.ini`, including Waves shells; later releases fix paths/periods/buffer automation | Windows VST3 | S-004, S-005 | Direct release/manual text | No scan/validation mechanism documented |
| C-019 | **DOCUMENTED** | High | DirectX plug-ins install system-wide and automatically appear | Windows DirectX | S-005 | Direct installation text | DXi subtype not resolved |
| C-020 | **DOCUMENTED / UNKNOWN** | High | SAWStudio has a native FX API and native effects; public authoring SDK/ABI terms not retained | Native extension | S-002, S-005 | Direct API/effects text | Proprietary internals/terms unknown |
| C-021 | **DOCUMENTED** | High | Plug-ins occupy ordered pre/post/final patches, support bypass/hot patching/window recall, and VST requires its own GUI | Host placement/UI | S-005 | Direct Effects/Signal Flow chapters | Headless/generic UI unknown |
| C-022 | **DOCUMENTED** | High | VST instruments accept MIDI/Time Info, can be recorded, and can expose up to 64 output channels | Instrument contract | S-004, S-005 | Direct VST/release text | Sidechains/dynamic I/O/event output unknown |
| C-023 | **DOCUMENTED** | High | EDL/presets retain FX settings/window state; releases enlarged state buffers and fixed state/automation/reorder failures | Plug-in state | S-004, S-005 | Preset/manual plus fixes | Missing plug-in and migration semantics unknown |
| C-024 | **UNKNOWN** | High that evidence is absent | Validation, cache, duplicate identity, blacklist/quarantine, timeout, rescan and scan recovery are undocumented | Discovery safety | S-004, S-005 | Relevant install/release sections inspected | Manual links are not validation |
| C-025 | **UNKNOWN** | High that evidence is absent | Plug-in process isolation, sandboxing, crash containment, bridging, signing, and runtime topology are undisclosed | Runtime/security | S-002, S-004, S-005 | Architecture/hosting/fix sources inspected | Crash evidence cannot identify topology |
| C-026 | **UNKNOWN** | High that evidence is absent | Deep host contract—sidechains, bus/event semantics, MPE/MIDI2, parameter identity/sample accuracy, tails, dynamic I/O, missing placeholders/migration—is unresolved | Interoperability | S-004, S-005 | Positive host features checked against required contract | Fixture matrix/vendor spec needed |
| C-027 | **DOCUMENTED** | High | EDL stores session links/state but not audio; up to 99 persistent undo snapshots, crash recovery, missing-file re-pathing and file tools exist | Persistence/recovery | S-005 | Glossary, undo, File menu | Atomicity/schema unknown |
| C-028 | **DOCUMENTED / UNKNOWN** | High | Trim/extract, legacy import and WAV stem handoff are documented; FX blending and open interchange/collaboration are limited or unknown | Interoperability | S-005 | File/MixDown chapters | No AAF/OMF/ADM/etc. claim found |
| C-029 | **DOCUMENTED** | High | Control/Show tracks, MIDI/serial commands, up-to-eight TCP/IP peers and SAC shared-memory links support live/show workflows | Live/network | S-002, S-005 | Direct show/TCP/SAC chapters | Security/authentication model unknown |
| C-030 | **DOCUMENTED** | High | `.MCT` lookup-table templates map named physical controllers to console/transport/edit functions | Control surfaces | S-002, S-005 | Direct controller chapter | No general public controller SDK terms |
| C-031 | **DOCUMENTED / UNKNOWN** | High | Manual contains obsolete high-risk Windows tuning guidance; signing/privacy/update/security policies remain unknown | Security | S-005 | Direct setup text | Guidance is recorded, not endorsed |
| C-032 | **UNKNOWN / INFERENCE** | High | Accessibility conformance and product/native-SDK license terms are unresolved; hosting grants no rights to another product | Accessibility/legal | S-001–S-005 | Relevant public sources inspected plus clean-room boundary | Not legal advice |
| C-033 | **DOCUMENTED** | High | V2.1–2.4 fix Win update crashes and VST3 buffer/path/name issues; V2.0 includes multiple state/automation fixes | Maintenance | S-004 | Direct version history | No release dates except V2.0 July 2025 |
| C-034 | **DOCUMENTED** | Medium-high | Sources state 24 stereo devices, 64 VST outputs, and RAM-bounded Regions | Scaling | S-004, S-005 | Direct requirement/release/Regions text | Input-track contradiction remains C-005 |
| C-035 | **DOCUMENTED** | High | V2.0/V2.4 add overlong-WAV pointer/header recovery and salvage workflow | Long recording recovery | S-004 | Direct release notes | Recovery success not independently observed |
| C-036 | **DOCUMENTED / UNKNOWN** | High | VST3 was a paid V2.0 update; Full/Basic feature differences are published, but hosting entitlement/parity is not | Editions | S-002, S-004 | Product table/release note | Current sales/license details missing |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Official RML Labs statements establish what the vendor documents, not independent performance, reliability, compatibility, or security.

### S-001 — RML Labs home

- **Publisher / kind:** RML Labs; official vendor identity page.
- **URL:** https://rmllabs.com/MainSite/index.html
- **Scope:** Current vendor/product-line identity at cutoff.
- **Relevant passage/section:** “Developer Of The SAWStudio And SAC Product Lines”; Bob Lentini identity.
- **Claims:** C-002, C-032.
- **Limitations:** No version, platform, architecture, or license details.
- **Selection rationale:** Canonical provenance anchor, preferable to directories or secondary biographies.

### S-002 — SAWStudio product page

- **Publisher / kind:** RML Labs; official product overview and edition comparison.
- **URL:** https://rmllabs.com/MainSite/sawstudio.html
- **Scope:** Current public SAWStudio family overview.
- **Relevant passage/section:** Console, Workspace, MultiTrack, Automation, Engine, FX/VST3, Video, Control Track, TCP/IP, controllers, requirements, Full/Basic chart.
- **Claims:** C-002–C-008, C-010–C-011, C-016–C-020, C-029–C-030, C-032, C-036.
- **Limitations:** Promotional source; capacity conflicts with the detailed manual; performance/SRC/sync language is not independent measurement.
- **Selection rationale:** Densest current official family/edition/workflow statement; triangulated with S-004/S-005.

### S-003 — Product Downloads

- **Publisher / kind:** RML Labs; official download/version index.
- **URL:** https://rmllabs.com/MainSite/product-dwnlds.html
- **Scope:** Publicly available current and legacy product builds/manuals at cutoff.
- **Relevant passage/section:** SAWStudio 64 Bit V2 current 2.4; 64-bit 1.4; Full 32-bit 5.8a; Basic 2.8; Midi WorkShop versions.
- **Claims:** C-001, C-015, C-036.
- **Limitations:** No release dates, license terms, compatibility tests, or edition-hosting matrix.
- **Selection rationale:** Strongest current version anchor, preferable to inferred filenames or search snippets.

### S-004 — SAWStudio64 Latest Release Info, through V2.4

- **Publisher / kind:** RML Labs / Bob Lentini; official release-notes PDF, 11 pages.
- **URL:** https://rmllabs.com/MainSite/Downloads/Info_SAWStudio64_V2_4.pdf
- **Scope:** SAWStudio64 1.0–2.4; V2.0 dated July 2025.
- **Relevant passage/section:** V2.0 VST3 `.ini`/Waves shell/state/large-WAV changes; V2.1 Windows 10/11 fix; V2.2 VST3 buffer automation; V2.3 paths; V2.4 periods and WAV salvage; 1.1–1.4 VST/state/output/time-info fixes.
- **Claims:** C-001, C-003, C-012, C-018, C-022–C-024, C-025–C-026, C-033–C-036.
- **Limitations:** Changelog is not a full current specification and fixes do not prove present conformance. PDF local SHA-256: `9bafa45455be9f88e4896726c2abaa48855b1625682e2408d11fe7328d8e9caa`.
- **Selection rationale:** Only version-pinned primary origin for VST3 introduction and current maintenance.

### S-005 — SAWStudio64 V2 User Manual

- **Publisher / kind:** RML Labs / Bob Lentini; official 342-page V2 manual (copyright 2019, helpfile Version 2.0 with later VST3 material).
- **URL:** https://rmllabs.com/MainSite/Downloads/Manual_SAWStudio64_V2.pdf
- **Scope:** SAWStudio64 V2 user-visible architecture and operations.
- **Relevant passage/section:** Product Overview; bit resolution; setup/buffers; EDL/undo; MultiTrack/Regions/Layers/Automation; Effects and VST; Video; routing/signal flow; SMPTE/MTC; BuildMix; TCP/IP/controllers/SAC; menus.
- **Claims:** C-002–C-032, C-034.
- **Limitations:** Contains legacy Windows advice and internal inconsistencies; public behavior/architecture claims are not source code or qualification results. PDF local SHA-256: `7457b83170222527ce0527313af0b6137300336278ab654db43d0e1630767a95`.
- **Selection rationale:** Canonical and by far most detailed primary source; preferable to promotional summaries or forum recollection.

### Negative and inaccessible results retained

- Local `pdftotext` extraction could not run because the command was unavailable; both PDFs were read successfully through the approved PDF parser instead.
- Web search returned HTTP 429 and contributed no retained evidence.
- Internet Archive CDX requests returned HTTP 400 and contributed no evidence.
- No public official license/EULA or native SDK terms were established within the bounded source set.
- No retained official source resolved runtime isolation, scan validation, deep host ABI semantics, missing-plug-in behavior, formal Windows 11 support, or accessibility conformance.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| 120 versus 72 inputs | Compared current product page with V2 detailed signal flow; conflict remains | Scaling model and edition identity | Vendor clarification or launch V2.4 demo and count routable input modules in a disposable VM | Public/vendor or authorized lab; unassigned |
| Formal Windows 11 support | Requirements and V2.1 notes inspected | Deployment baseline | Obtain current signed support matrix or test clean Win11 images across supported audio drivers | Vendor/lab; unassigned |
| VST2/VST3/DX entitlement by edition | Full/Basic chart and manuals omit host rows | Product comparison and qualification matrix | Vendor response or same fixtures in V2, legacy Full, and Basic demos | Authorized disposable VMs; unassigned |
| Discovery validation/cache/quarantine | Installation/release sections describe paths only | Reliability and supply-chain safety | Use valid, duplicate-ID, malformed, hanging, and crashing signed fixtures; record UI/files/logs | Disposable Windows VM; unassigned |
| Plug-in isolation/bridging/signing | No process/security source | Crash containment and architecture migration | Observe process tree/modules, then crash a safe fixture and test architecture mismatches | Authorized lab; unassigned |
| Sidechain/bus/event contract | Native keying and VST multi-output are partial | Interoperability fidelity | Capability-coded VST2/VST3 effects/instruments with aux input, MIDI out, dynamic buses, and multichannel layouts | Lawful custom fixtures; unassigned |
| MPE/MIDI 2.0/sample timing | Controller/MTC/VST Time Info docs do not address note expression | Modern instrument support | Timestamped note-expression/MIDI 2.0 fixtures via hardware and Midi WorkShop paths | Authorized lab; unassigned |
| Parameter identity/sample accuracy | Automation docs omit third-party ABI detail | Durable automation | Stable-ID/renamed/stepped/log parameter fixture with dense automation and reopen/render checks | Fixture harness; unassigned |
| Latency/tails/offline parity | PDC limits documented; tails/offline flags absent | Timing/render correctness | Impulse and long-tail fixtures across live, bypass/unpatch, BuildMix, and changed buffers | Audio analysis lab; unassigned |
| Plug-in state/missing placeholders | EDL/state fixes inspected; absence behavior not stated | Project durability | Save unique state/assets, remove/upgrade/reorder VST2/VST3, reopen, restore, and compare round trip | Disposable project copies; unassigned |
| EDL schema/atomicity/compatibility | Documentary clean-room boundary; no file inspection | Recovery/migration design | Seek vendor schema/spec first; otherwise behavioral save/crash/version round trips without reverse engineering | Vendor/lab; unassigned |
| Licensing/SDK terms | Official retained pages lacked terms; budget exhausted | Legal feasibility | Counsel-led retrieval of current EULA and format-owner/native SDK terms | Legal owner; unassigned |
| Security/privacy/accessibility | Manual and pages lack current policies/conformance | Release acceptance | Vendor security/privacy/accessibility statements plus keyboard/screen-reader/contrast audit in sandbox | Security/accessibility owners; unassigned |

## 24. Curiosity pass and stop decision

The decision was framed before retrieval: determine which SAWStudio workflow, engine, persistence, extension, and host patterns are evidenced well enough for clean-room comparison. Six evidence passes were budgeted, with at most two decision-critical sources per pass. Sufficient coverage required every template section and format row, current identity, deep hosting distinctions, contradictions, source rationale, and explicit unknowns.

Scores are 1 (low) to 5 (high); cost 5 is most expensive.

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Current platform/maintenance status | 5 | 4 | 3 | 2 | **Pursued best thread:** V2.1–2.4 notes found Win10/11, VST3, path/state, and recovery fixes; formal Win11 status remained contradictory [C-003, C-033] |
| Runtime isolation/crash containment | 5 | 5 | 5 | 5 | **CURIOSITY_NO_GO:** requires execution or engineering disclosure |
| Capacity contradiction | 4 | 4 | 3 | 4 | **CURIOSITY_NO_GO:** two primary sources exhausted; runtime/vendor response required |
| Current EULA/native SDK terms | 5 | 4 | 4 | 4 | **CURIOSITY_NO_GO:** no retained official terms and source budget exhausted; legal owner next |
| Deep parameter/state fixture matrix | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** belongs to later interoperability prototype wave |
| Exhaustive legacy edition history | 2 | 2 | 2 | 4 | **CURIOSITY_NO_GO:** low probability of changing current architecture conclusion |
| Forum failure anecdotes | 2 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** low authority without controlled reproduction |

**Gaps after synthesis:** formal Windows 11 qualification, exact V2 capacity, edition hosting parity, isolation/validation, deep host semantics, missing dependencies, licensing, security/privacy, and accessibility. **Contradictions:** 120 versus 72 inputs; formal requirements stop at Windows 10 while release notes mention Windows 11 fixes. Repeated official material otherwise saturated the same user-visible model.

**Stop decision:** **STOP—coverage achieved with explicit unknowns; source budget exhausted and marginal documentary evidence is nonpositive.** Six bounded passes are complete. Further web discovery produced rate/access failures or duplicate official material and is unlikely to resolve proprietary runtime behavior. The next qualifying work is vendor clarification or a lawful disposable interoperability/security fixture matrix, not more unbounded searching.

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

**Owned path:** `research/daw-landscape/dossiers/sawstudio.md`.

**Checks performed:** template heading/matrix audit; claim/source resolution audit; official-source contradiction audit; documentary accepted→discovered→instantiated→full-contract check; unknown/next-probe audit; curiosity/stop audit; exclusive-path workspace check.

**Concise result:** SAWStudio64 V2.4 is documented comprehensively enough for comparative synthesis, with strong evidence for its console/timeline, Region/layer, recovery, show-control, and manual VST/DirectX hosting patterns. Completion remains `COMPLETE_WITH_UNKNOWNS` because modern platform qualification, capacity, isolation, deep host semantics, licensing, security, privacy, and accessibility are unresolved.

**Unresolved blockers:** HTTP 429 search throttling; Archive CDX HTTP 400; unavailable local `pdftotext`; source budget exhaustion; proprietary/runtime-only questions; inaccessible license terms.

**Workspace safety:** Pre-existing unrelated modifications were observed and left untouched. No file was staged or committed.
