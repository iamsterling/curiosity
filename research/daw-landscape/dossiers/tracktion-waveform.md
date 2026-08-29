# Tracktion Waveform DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Tracktion Waveform Pro 14 and Waveform Free 14; OEM and purchasable Free expansions noted only where they change an architecture-relevant capability |
| Canonical vendor/upstream | Tracktion Software Corporation |
| Researcher/session | Subagent, session `ses_fb275c7f8fferKxH8E6tb0qf55` |
| Owned path | `research/daw-landscape/dossiers/tracktion-waveform.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current product snapshot | Waveform 14 family as presented by Tracktion on the cutoff date; no exact 14.x build number was published in the retained pages [C-001] |
| Editions | Free, OEM (comparison/manual context), Pro; Free feature expansions: Recording Engineer, MIDI Producer, Synth Pack, DJ Mix Tools, Pro Video, Launcher, Multi Channel [C-002] |
| Current released desktop platforms | macOS 13+ on 64-bit Intel or Apple Silicon; Windows 10/11 64-bit. The v14 pages say Linux is “coming soon,” so there was no current released Linux v14 build evidenced at cutoff [C-001] [C-030] |
| Mobile/web | No Waveform 14 mobile or web edition is in scope or evidenced [C-030] |
| Included | Workflow, user-visible engine/routing/render behavior, editing, MIDI, recording, devices, third-party hosting, persistence, control/scripting, public Tracktion Engine boundary, and licensing |
| Excluded | StageBox and Tracktion plug-ins as standalone products; proprietary source/binaries; installer execution; unsafe plug-ins; historical Linux versions except as ambiguity context; Tracktion Engine behavior not traceable to Waveform |
| Evidence mode | Public lawful clean-room documentary research. No product installation, binary inspection, or runtime observation. Fetched/search/repository text was treated as untrusted evidence, never as instructions. |
| Retained sources | 12, all primary: Tracktion product/manual/developer/legal material, pinned Tracktion repositories, and Steinberg's format-owner licensing FAQ |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

## 1. Executive summary

- **DOCUMENTED:** Waveform 14 retains Tracktion's distinctive Edit-centric, predominantly single-window model: browser/actions at the side, timeline in the middle, and a left-to-right inline mixer that visually completes each track's input → clips → plug-ins → master flow. One track type can contain audio, MIDI, step, or nested Edit clips. A conventional vertical mixer also exists. [C-003] [C-004]
- **DOCUMENTED:** Its strongest architecture reference is the Rack Type/Rack Instance split. A shared rack definition contains an arbitrary audio/MIDI/modulation graph; per-track instances map I/O and levels. Racks support parallel/serial paths, per-input sidechains, automatic multi-output wrapping, presets/state, and up to 64 audio inputs and outputs, but cannot be nested. [C-014]
- **DOCUMENTED:** The current family hosts VST2 and VST3 on its released macOS/Windows products and generically advertises Audio Unit on macOS. The exact AUv2/AUv3 product contract is not stated. Cmajor patches are documented on Windows and Apple-Silicon macOS without an edition restriction. Current Linux-format evidence is stranded by the absence of a released v14 Linux build. [C-015] [C-020] [C-030]
- **DOCUMENTED:** Discovery is unusually well exposed: format paths, automatic new-plug-in detection, per-format scans, validation, aliases/tags/favourites/thumbnails, red/deactivated failed-initialization entries, and re-enabling after a crash. Scan isolation defaults to one separate process. Waveform Pro additionally offers opt-in, per-plug-in runtime sandboxing in a separate process; the vendor says a crash deactivates the plug-in rather than the host. [C-016] [C-017]
- **DOCUMENTED with vendor-claim limitation:** Tracktion claims a rewritten, multi-core engine with PDC in all routing configurations. The UI exposes core count, optional 64-bit summing, low-latency monitoring, freeze points, background/offline or 1× render, stems, and multi-channel output. No independent qualification was performed. [C-007] [C-008]
- **DOCUMENTED boundary:** Waveform Free is built on the separately published Tracktion Engine, but the SDK provides no application UI and “most,” not necessarily all, features. The public SDK is GPLv3-or-later/commercial and requires separate JUCE licensing. It is useful evidence for lineage and candidate mechanisms, not proof that Waveform 14 Pro or every shipped path matches repository version 3.5.0. [C-005] [C-006] [C-026]
- **Major unknowns:** architecture bridging/Rosetta behavior, signing/notarization policy for hosted code, AU generation, Free sandbox availability, sample-accurate third-party automation, native missing-plug-in placeholder/relink UX, plug-in GUI scaling/headless behavior, exact native Edit extension, MIDI 2.0, accessibility contract, and support for formats not affirmatively documented. [C-025] [C-029]
- **Confidence:** high for product identity, current OS scope, visible workflow, racks, scan/sandbox UI, render options, scripting, and SDK licensing; medium for edition boundaries where comparison-page checkmarks were lost in text extraction; low/unknown for proprietary scheduling internals and unqualified host-contract edge cases.

## 2. Product identity, history, and market position

- **DOCUMENTED:** Tracktion's current pages identify Waveform Pro 14 and Waveform Free 14. Pro is a paid one-time license; Free is zero-price with paid feature expansions. Both pages target music creation/production; the Free page additionally presents band recording, electronic production, podcast, singer-songwriter, and house-of-worship workflows. [C-001] [C-002]
- **DOCUMENTED:** The current released targets are 64-bit macOS 13+ (Intel and Apple Silicon) and 64-bit Windows 10/11. “Linux coming soon” is a roadmap statement, not a release. [C-001] [C-030]
- **DOCUMENTED:** The manual retains historical “T6/T7” terminology and the public SDK says more than fifteen years of development underlie the engine, establishing lineage but not a release-by-release product chronology. [C-005] [C-006]
- **UNKNOWN:** No decision-critical need justified a separate historical chronology pass. The exact launch dates and naming transitions from Tracktion DAW to Waveform were not established; this does not affect the current host architecture decision.

## 3. Workflow and conceptual model

- **DOCUMENTED:** A **Project** is a folder/media boundary that can contain multiple **Edits**. An Edit is the song/session workspace; copying an Edit gives lightweight revision variants that continue to share source media. [C-004] [C-022]
- **DOCUMENTED:** The Edit tab combines Browser/Actions, Arrangement, inline Mixer, and transport. Context-sensitive Actions and the Detail Editor operate on the selected clip, track, plug-in, rack, or automation point. Waveform 14 replaced the old lower properties panel with top menus, a bottom transport, and side Actions/Detail views. [C-003]
- **DOCUMENTED:** There is one general track kind. A track can hold Audio, MIDI, Step, or Edit clips; an Edit clip embeds another Edit as a block. Signal flow is presented left-to-right on the same screen. [C-004]
- **DOCUMENTED:** The primary model is linear, but an optional Launcher adds scenes, clip slots, recording, launch modes, follow actions, and Link/controller integration. It supplements rather than replaces the arrangement. [C-002] [C-004]
- **INFERENCE:** The visible object-and-action model reduces mode switching and makes routing inspectable. A plausible alternative is that large sessions still rely on the separate vertical mixer/layout presets; no usability study was performed. [C-003]

## 4. Publicly documented architecture

- **DOCUMENTED product surface:** Waveform exposes an audio engine, per-Edit graph/routing, configurable processing cores, render paths, plug-in scan-process choice, and optional Pro sandbox process. The proprietary application process topology, scheduler details, sandbox IPC, persistence schema, and service boundaries are not published in the retained product documentation. [C-007] [C-016] [C-017] [C-025]
- **DOCUMENTED SDK boundary:** Tracktion Engine 3.5.0 is a C++20 JUCE module split into `tracktion::core` primitives, `tracktion::graph` lock-free multithreaded processing nodes, and the high-level `tracktion::engine` Edit model. Its manifest says Waveform Free is built on it and that most features are present, but the SDK supplies no application UI. [C-005] [C-006]
- **DOCUMENTED SDK snapshot only:** The pinned public source contains an Edit node builder, graph nodes for plug-ins/racks/aux/ARA/MIDI/audio, a lock-free multithreaded node player, and background renderer. This is architectural evidence for the SDK snapshot, not a claim that Waveform 14 ships commit `0d55ef0…` unchanged. [C-026]
- **UNKNOWN:** No source maps Waveform Pro 14 to an immutable engine commit or enumerates proprietary deltas. Treat any class-for-feature correspondence as a hypothesis requiring vendor confirmation or later black-box qualification. [C-025]

## 5. Audio engine

- **DOCUMENTED/vendor claim:** Both Free and Pro pages describe a rewritten engine with reduced CPU load, “perfect PDC in all routing configurations,” and improved high-core-count use. The manual exposes selectable core count and optional 64-bit summing (default off). [C-007]
- **DOCUMENTED:** Buffer size is user-configurable through the audio-device setup; lower values reduce monitoring latency while increasing CPU/dropout risk. Low-latency mode can temporarily reduce the buffer and disable the highest-latency plug-ins until a configured monitoring-latency ceiling is met. [C-007]
- **DOCUMENTED:** PDC can be disabled for playback, bypassed latency plug-ins can be removed to reduce delay, and a Freeze Point renders everything before its chain position while leaving later processing live. Freeze is unavailable inside clips, racks, or the master chain. [C-007] [C-008]
- **DOCUMENTED:** Export can render faster than real time/background or at 1× for hardware inserts; it supports per-track files, mono/stereo/5.1/7.1/Edit layouts, sample rate/bit depth, dither, silence trim, peak/RMS normalization, MIDI export, and plug-in pass-through choices. [C-008]
- **DOCUMENTED SDK snapshot only:** SDK graph node properties accumulate plug-in-reported latency, latency-balance bypass paths, shift automation timing, and use a lock-free multithreaded player; render parameters include block size, rate, bit depth, tails, layouts, plug-in inclusion, and real-time/offline mode. [C-026]
- **UNKNOWN:** Product scheduling strategy, block segmentation rules, graph rebuild behavior, denormal policy, dropout recovery, oversampling policy, render determinism, and correctness of dynamic-latency changes were not independently qualified. “Perfect PDC” remains a vendor claim. [C-029]

## 6. Tracks, timeline, clips, and editing

- **DOCUMENTED:** The timeline can show bars/beats, time, or frames and carries tempo and marker tracks. Arrangement objects include audio, MIDI, step, nested Edit, group, linked, launcher, and arranger-section clips. [C-004] [C-009]
- **DOCUMENTED:** Audio editing includes move/slip/trim/stretch, split, duplicate, fades/crossfades/pitch fades, clip gain/pan/mute/channel selection, reverse, merge/render, ripple-like marked-region deletion, grouping, linking, Warp Time, real-time/offline time-stretch choices, ARA, clip effects, and offline clip-layer effects. [C-009]
- **DOCUMENTED:** Splits, fades, grouping, and many clip transforms are non-destructive. Explicit source-file edits and renders are destructive/committing operations; linked clips share source-affecting edits but not split/fade edits. [C-009]
- **DOCUMENTED:** Folder clips can represent and rearrange regions across contained tracks. The Arranger Track offers named sections and move/copy operations. Track snapshots and multiple Edits provide alternate states/revisions. [C-009] [C-022]
- **UNKNOWN:** There is no documented source-control merge model for Edits, and exact undo coverage for every destructive media operation is not established.

## 7. MIDI, sequencing, notation, and expression

- **DOCUMENTED:** Waveform provides recording, inline piano-roll editing, step entry/clips, velocity and controller lanes, quantize/groove/humanize/randomize/strum/chord/pattern tools, MIDI loop recording/comping, and a Pro MIDI Event List for notes, CC, program change, aftertouch, pitch wheel, channel pressure, and editable SysEx. [C-011]
- **DOCUMENTED:** Per-note controller curves are drawn over selected notes. The comparison/manual claim note expression/MPE, and built-in 4OSC/Wavetable instruments expose MPE pressure, timbre, and bend. [C-011]
- **DOCUMENTED:** Hardware MIDI I/O, aliases/patch names, virtual inputs, QWERTY input, MIDI learn, MIDI Clock/MTC output, external MTC chase, MMC send/receive, timecode offset, and Ableton Link are documented. [C-011] [C-013]
- **UNKNOWN:** MIDI 2.0/UMP, external-plug-in per-note expression fidelity, note-ID preservation, score/notation editing, MusicXML, and sample-accurate event delivery are not established. The SDK's MPE/event pipeline does not prove the full Waveform host contract. [C-025] [C-029]

## 8. Routing, mixer, automation, and control

- **DOCUMENTED:** Each track's inline mixer is a reorderable plug-in chain with default Volume & Pan and Level Meter devices; a conventional vertical mixer is optional. Master plug-ins process the full mix. [C-003] [C-012]
- **DOCUMENTED:** Folder tracks are organizational/VCA-like controls through which no audio passes; Submix tracks pass and process child audio. Aux Send/Return plug-ins create buses, with pre/post-fader behavior determined by chain placement. Racks handle arbitrary series/parallel, sidechain, and multi-I/O graphs. [C-012] [C-014]
- **DOCUMENTED:** Waveform 14 Pro/Multi Channel supports configurable device buses, multi-channel files, track/clip/rack/plug-in paths, and mono/stereo/5.1/7.1/custom output. Feedback routing rules beyond documented rack connections are unknown. [C-012]
- **DOCUMENTED:** Track and clip automation target volume, pan, master, sends, and plug-in parameters. Curves support points/curvature/shapes, bypass, scale/skew, read/touch/latch/write, relative/scale clip curves, nested automation tracks, recording from hardware, and smoothing/simplification. Pro/selected expansions gate the newer clip-automation features. [C-013]
- **DOCUMENTED:** Control surfaces include factory mappings, MIDI/OSC custom surfaces, MIDI learn, import/exportable maps, scripted surfaces, JavaScript controller configuration, and Link. [C-013] [C-021]
- **UNKNOWN:** There is no published sample-accurate automation guarantee, OSC API stability/versioning contract, or complete feedback-cycle policy. [C-029]

## 9. Recording, comping, and media handling

- **DOCUMENTED:** Audio/MIDI inputs are assigned directly to tracks; input meters, arming, monitoring, calibration, punch-on-the-fly, loop/take recording, multitrack assignment, and up to four inputs on one track are described. [C-010]
- **DOCUMENTED:** Loop recording stacks takes in a clip; users choose an active take, unpack takes to tracks, swipe phrases, flatten, or form comp groups from arbitrary tracks and render the comp to a new/replacement track. [C-010]
- **DOCUMENTED:** Import supports common PCM/compressed formats and loop metadata; source-file copy policy is configurable. Archives consolidate referenced media, while automatic project/Edit backups explicitly do not back up source audio. [C-022]
- **DOCUMENTED:** Video import transcodes a working copy and extracts audio while retaining the original video as source. [C-023]
- **UNKNOWN:** Proxy/cache invalidation, long-recording recovery, metadata round-trip breadth, and missing-media relink heuristics are not fully documented.

## 10. Instruments, effects, content, and native devices

- **DOCUMENTED:** Free 14 lists 14 audio effects, 8 MIDI effects, 11 utilities, and 4 instruments; Pro lists 38 audio effects, 10 MIDI effects, 11 utilities, and 10 instruments plus bundled third-party content. Inventory varies by edition/bundle. [C-002]
- **DOCUMENTED:** Architecture-relevant native device types include ordinary chain plug-ins, Freeze Point, Insert, Aux Send/Return, channel/patch utilities, samplers/synths, MIDI effects, clip effects/layers, modifiers, macros, Rack Types/Instances, rack faceplates, and rack macro parameters. Faceplates and rack macros are Pro-only. [C-014]
- **DOCUMENTED:** Cmajor `.cmajorpatch` effects/instruments are compiled on load and inserted like plug-ins on Windows and Apple-Silicon macOS, with no edition restriction; errors appear on the plug-in slot. [C-020]
- **UNKNOWN:** Native device ABI/API stability and third-party authoring support beyond Cmajor patches and general external formats are not specified for Waveform.

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

Current-version scope is Waveform 14 at the cutoff. `UNKNOWN` means no sufficiently specific current official statement was found; it does **not** mean unsupported. Generic “AU” evidence cannot safely be split into AUv2 and AUv3. [C-015] [C-025] [C-030]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **DOCUMENTED** | **DOCUMENTED** | **NOT_APPLICABLE:** no released v14 Linux build at cutoff | **NOT_APPLICABLE:** no Waveform 14 mobile/web edition | Free page says VST; current manual explicitly labels “VST (VST2)” paths and DAWproject VST2 state; manual does not gate the format by edition | Host acceptance is documented; full contract still requires qualification | [C-015] S-002 S-005 |
| VST3 | **DOCUMENTED** | **DOCUMENTED** | **NOT_APPLICABLE:** no released v14 Linux build at cutoff | **NOT_APPLICABLE:** no Waveform 14 mobile/web edition | Free page and current manual explicitly name VST3; manual does not gate by edition | ARA2 can use VST3 on current desktop products; edge-contract fidelity unknown | [C-015] [C-020] S-002 S-005 S-006 |
| AUv2 | **UNKNOWN:** generic AU only | **NOT_APPLICABLE:** Apple Audio Unit format | **NOT_APPLICABLE:** Apple Audio Unit format/no current Linux build | **NOT_APPLICABLE:** no Waveform mobile edition | Free page/manual advertise “AU”/“AudioUnit,” not generation | Do not silently reinterpret generic AU as AUv2 | [C-015] [C-025] S-002 S-005 |
| AUv3 | **UNKNOWN:** SDK source has AUv3 scan handling, but product docs do not claim the generation | **NOT_APPLICABLE:** Apple Audio Unit format | **NOT_APPLICABLE:** Apple Audio Unit format/no current Linux build | **NOT_APPLICABLE:** no Waveform mobile edition | Tracktion Engine is not sufficient product evidence | A safe macOS v14 probe is required | [C-025] [C-026] S-005 S-010 |
| AAX | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:** no Waveform mobile/web edition | No current official Waveform claim found | AAX naming/licensing alone does not imply host support | [C-025] S-005 S-007 |
| CLAP | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:** no released v14 Linux build at cutoff | **NOT_APPLICABLE:** no Waveform mobile/web edition | SDK's DAWproject XML vocabulary mentions `ClapPlugin`, but no Waveform host claim exists | Interchange schema token is not host acceptance | [C-025] [C-026] S-010 |
| LV2 | **UNKNOWN:** current manual says an LV2 path may appear depending on build/platform | **UNKNOWN:** same | **NOT_APPLICABLE:** no released v14 Linux build at cutoff | **NOT_APPLICABLE:** no Waveform mobile/web edition | Current manual is conditional and product pages omit LV2 | Retained evidence cannot pin OS/edition | [C-015] [C-025] S-005 |
| LADSPA | **NOT_APPLICABLE:** current manual calls it Linux-only | **NOT_APPLICABLE:** current manual calls it Linux-only | **NOT_APPLICABLE:** no released v14 Linux build at cutoff | **NOT_APPLICABLE:** no Waveform mobile/web edition | Manual retains Linux-only LADSPA path from broader/cross-version documentation | Revisit when v14 Linux ships | [C-015] [C-030] S-005 S-001 S-002 |
| DSSI | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:** no released v14 Linux build at cutoff | **NOT_APPLICABLE:** no Waveform mobile/web edition | No current official Waveform statement found | Absence from manual is not proof of rejection | [C-025] S-005 |
| JSFX | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:** no released v14 Linux build at cutoff | **NOT_APPLICABLE:** no Waveform mobile/web edition | No current official Waveform statement found | No compatibility claim | [C-025] S-005 |
| DirectX/DXi | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:** Windows-specific family/no current Linux build | **NOT_APPLICABLE:** no Waveform mobile/web edition | No current official Waveform statement found | Historical support was not projected into v14 | [C-025] S-005 |
| Rack Extension | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:** no released v14 Linux build at cutoff | **NOT_APPLICABLE:** no Waveform mobile/web edition | No current official Waveform statement found | Waveform “Racks” are its own container, not Reason Rack Extensions | [C-014] [C-025] S-005 |
| Product-native/other | **DOCUMENTED:** Cmajor only on Apple Silicon; ARA integration on Intel/Apple Silicon macOS | **DOCUMENTED:** Cmajor and ARA | **NOT_APPLICABLE:** current Cmajor note says no Linux and no v14 Linux release | **NOT_APPLICABLE:** no Waveform mobile/web edition | Cmajor has no edition restriction; ARA is all editions on macOS/Windows; rack/clip/native devices are internal, not binary plug-in formats | Cmajor is a patch format; ARA is an integration protocol, not a substitute for format support | [C-020] S-005 S-006 |

### 11.2 Discovery, scanning, validation, and recovery

- **DOCUMENTED:** Users configure paths per exposed format; Waveform can automatically notice newly installed plug-ins, prompt to scan, scan new/updated entries by format, drag in a plug-in file directly, clear/remove entries, remove missing files, and reveal the binary location. [C-016]
- **DOCUMENTED:** The list stores format, category, manufacturer, version, ARA flag, alias, tags, update metadata, visibility, thumbnail, sandbox selection, and disabled state. Aliases/tags/favourites are user-organized; clearing the list loses those associations. [C-016]
- **DOCUMENTED:** Validation can target the selected entry or an arbitrary file. Failed initialization places a red, deactivated entry at the bottom; a plug-in switched off after crashing gets a warning marker and can be re-enabled. [C-016]
- **DOCUMENTED:** Scanning defaults to a single separate process; main-process parallel scanning exists only as a troubleshooting option. This is scan crash containment, not runtime isolation. [C-016]
- **UNKNOWN:** Cache file format, duplicate-resolution UX, hash/signature checks, quarantine persistence, scan timeout policy, and diagnostic detail are unpublished. The SDK snapshot's identity fallback chain is not a guaranteed Waveform contract. [C-025] [C-026]

### 11.3 Runtime isolation and compatibility

- **DOCUMENTED:** Pro's optional sandbox runs selected plug-ins in a process separate from the application. It is off by default, adds overhead, needs the Edit reopened after changes, and is marketed as deactivating a crashed plug-in rather than closing the host. [C-017]
- **UNKNOWN:** Free/OEM runtime sandbox entitlement is not established. The manual says the option appears only in supporting editions; only Pro affirmatively advertises it. [C-017] [C-025]
- **UNKNOWN:** Per-plug-in versus shared sandbox topology, IPC transport, audio/MIDI buffering, GUI process ownership, hang detection, state-recovery transaction, security hardening, entitlement/signature checks, and whether a sandbox restarts automatically are not documented. [C-025]
- **UNKNOWN:** No current source establishes 32→64-bit bridging, Intel plug-in hosting inside the Apple-Silicon application, Rosetta policy, or cross-architecture UI bridging. The app itself supports Intel and Apple Silicon; that fact does not answer plug-in bridging. [C-001] [C-025]

### 11.4 Host/plugin processing contract

- **DOCUMENTED:** Racks carry audio, MIDI, and modifier connections; can wrap multi-output instruments; expose named sidechain inputs from audio/submix tracks; support up to 64 audio channels each way; and persist routing/state as presets. [C-014]
- **DOCUMENTED:** Plug-ins can be track, master, clip, rack, or offline clip-layer processors. Hardware Insert requires 1× render. ARA receives transport/loop context; v14 additionally advertises chord/global context and use of ARA as a stretch mode. [C-008] [C-009] [C-020]
- **DOCUMENTED SDK snapshot only:** The public wrapper passes sample-positioned MIDI within processing blocks, obtains latency/tail and buses from JUCE instances, persists bus layout, can route MPE, and processes fine-grain automation in sub-blocks. [C-026]
- **UNKNOWN:** Sample-accurate automation, MIDI 2.0, note-expression translation for every external format, dynamic-I/O graph rebuild, suspend policy, bypass equivalence, tail completion in every render, sidechain bus naming/fallback, and offline-mode notification fidelity require dynamic tests. [C-029]

### 11.5 Parameters, automation, state, presets, and project recall

- **DOCUMENTED:** Host-visible parameters can be selected for quick controls, automation, MIDI mappings, rack macros/modifiers, and faceplates. Faceplates can show parameter names and formatted text; plug-in/rack presets preserve settings, connections, and embedded faceplate images. [C-013] [C-014] [C-018]
- **DOCUMENTED:** Native project saving/autosave and racks retain plug-in state. DAWproject export explicitly embeds VST2/VST3/AU state, but does not carry plug-in automation, sends, or bus routing. [C-018] [C-019] [C-022]
- **DOCUMENTED SDK snapshot only:** External state uses plug-in chunks plus program and bus-layout data; identifiers include format/native IDs/file information and compatibility fallbacks. Native IDs are used where possible, while historical compatibility constrains parameter-ID changes. [C-026]
- **UNKNOWN:** Product-level parameter-ID migration across format/vendor updates, normalized-range/text edge cases, preset asset relinking, cross-architecture state compatibility, and duplicate identities are not qualified. [C-025] [C-029]
- **UNKNOWN native recall / DOCUMENTED DAWproject failure:** Native missing-plug-in placeholder, retained state, relink, and later recovery UI are undocumented. On DAWproject import, the current manual says an unavailable plug-in is silently dropped. [C-019] [C-025]

### 11.6 UI, diagnostics, and failure modes

- **DOCUMENTED:** Third-party editors open in their own windows (single- or double-click configurable) and can be assigned to a display. Native devices generally render controls in Actions/properties; rack windows can show graph, stack, faceplate, or a designated plug-in's native editor. [C-018]
- **DOCUMENTED:** The host exposes scan validation, blacklist/deactivation, crash-disable/re-enable status, logs, crash reports, optional diagnostic upload, and Pro sandboxing. Cmajor compilation errors appear in the plug-in slot. [C-016] [C-017] [C-020] [C-027]
- **UNKNOWN:** Plug-in GUI embedding versus detachment beyond the documented separate window, DPI scaling, resize negotiation, headless operation, keyboard/focus/accessibility behavior, remote GUI behavior in a sandbox, and crash-state replay are not specified. [C-025]

## 12. Extensibility and integration

- **DOCUMENTED:** The macro editor combines built-in/basic/advanced actions with JavaScript loops and conditions. Actions use a `Waveform.*` command surface; macros can run from shortcuts, menus, or custom action boards and import/export as `.Waveformscript` XML files. [C-021]
- **DOCUMENTED:** Control integration includes MIDI learn, custom MIDI/OSC surfaces, import/exportable mappings, scripted surfaces whose script can be revealed, factory controller profiles, a JavaScript controller API, MMC/MTC/Clock, and Ableton Link. [C-013] [C-021]
- **DOCUMENTED boundary:** Tracktion Engine is a separate C++ SDK for building applications, not a Waveform extension API. Cmajor is the documented in-product patch authoring/hosting path. [C-006] [C-020]
- **UNKNOWN:** Stability/versioning/security boundaries of the Waveform JavaScript API, third-party package/distribution mechanism, filesystem/network permissions, and whether general UI extensions can be authored are not documented. [C-025]

## 13. Project format, persistence, interoperability, and collaboration

- **DOCUMENTED:** A Project owns media and multiple Edit documents. v14 marketing says project management no longer uses `.tracktion` project files. The current manual instead describes a project folder with a `.Waveform` project index and an Edit filename spelled `.tractionedit`; because the manual is in progress and this spelling conflicts with older conventions, the exact current Edit extension is low-confidence. [C-022]
- **DOCUMENTED:** Autosave is on by default. Periodic backups cover project/Edit data, not source audio; Edit or whole-project restore is exposed. Multiple Edits and Track Snapshots provide user-level versions, but are not distributed version control. [C-022]
- **DOCUMENTED:** Archives consolidate referenced media into `.zip`/`.trkarch`-accepted packages; Free can import but not create archives. Source-copy/rename policy is configurable, and external references can break when moved. [C-022]
- **DOCUMENTED:** DAWproject import creates a new Edit and extracts embedded media; export embeds audio and VST2/VST3/AU state. Tracks/clips/tempo/time signatures/markers/basic mixer state travel, but automation, sends/buses, step/Edit clips, pitch/time stretch, groove, and quantize do not. [C-019]
- **DOCUMENTED:** Legacy Mackie `.prj` and RADAR imports are present. MIDI/audio stems are export paths. [C-019] [C-008]
- **UNKNOWN:** AAF, OMF, ADM, MusicXML, collaboration/cloud merge, forward/backward compatibility guarantees, schema publication, and native missing-dependency recovery are not established. [C-025]

## 14. Delivery, live, post-production, and specialized workflows

- **DOCUMENTED:** Delivery includes mono/stereo/surround file render, per-track stems, WAV/MP3 and other choices shown in the render UI, metadata, dither, silence removal, peak/RMS normalization, and 1× hardware-insert render. [C-008]
- **DOCUMENTED:** Pro/Multi Channel supports 5.1/7.1/custom multi-channel capture, files, plug-ins, racks, mixing, and render. No ADM/immersive-delivery schema was documented. [C-012]
- **DOCUMENTED:** Free/OEM can import/play one video with timecode; Pro/Pro Video supports multiple videos and H.264/H.265 render or audio replacement. [C-023]
- **DOCUMENTED:** Launcher scenes/slots/follow actions and Link/controller mappings support live/nonlinear performance, though Waveform remains an arrangement DAW rather than a dedicated show host. [C-002] [C-004]
- **UNKNOWN:** DDP, batch render queue UI, LUFS delivery in the Waveform product (the public SDK has LUFS parameters), ADR, broadcast conform, ADM, and show-control safety are not established. [C-025] [C-026]

## 15. Performance, reliability, security, and accessibility

- **DOCUMENTED:** User controls include core count, optional 64-bit summing, buffer size, background stretching, pooled/shared playback memory options, low-latency mode, track freeze, scan-process isolation, Pro runtime sandboxing, and logs/crash reports. [C-007] [C-008] [C-016] [C-017]
- **DOCUMENTED:** Crashed plug-ins can be disabled/re-enabled; failed initialization is blacklisted/deactivated. Autosave and periodic document backups reduce project-data loss, but source media needs separate backup. [C-016] [C-022]
- **DOCUMENTED:** Optional usage/crash diagnostics exist. The optional AI Assistant sends the user's message plus described project context to the selected external provider using the user's API key; sensitive context should not be submitted. [C-027]
- **UNKNOWN:** Sandbox hardening, exploit containment, plug-in signing/quarantine, notarization, update rollback, telemetry retention details beyond linked policies, formal scaling limits, tested maximum tracks/plug-ins, accessibility API/screen-reader conformance, and localization coverage are not established. [C-025] [C-027]

## 16. Licensing, ecosystem, and implementation constraints

- **DOCUMENTED:** Tracktion's terms grant purchased software a personal, non-exclusive, non-transferable license subject to an applicable product EULA. Free availability is not an open-source grant. The retained terms do not include the Waveform-specific EULA text. [C-024]
- **DOCUMENTED:** Tracktion Engine 3.5.0 is dual-licensed GPLv3-or-later/commercial. It is separate from JUCE; distributors need an appropriate Tracktion Engine license and an appropriate JUCE license. Bundled third-party components retain listed licenses. [C-006] [C-024]
- **DOCUMENTED:** Steinberg's current VST3 SDK is MIT-licensed. Steinberg says VST2 SDK files may not be redistributed and binary VST2 host/plug-in distribution is allowed only to entities that signed the VST2 license before October 2018. [C-024]
- **DOCUMENTED clean-room limit:** Public SDK structure can inform minimal patterns, but proprietary Waveform UI/code/assets and undocumented behavior cannot be copied or asserted. Naming VST, AU, AAX, CLAP, or another format does not grant SDK, trademark, redistribution, signing, or certification rights.
- **UNKNOWN/not legal advice:** Waveform's exact EULA, Tracktion's legacy VST2 license status, Audio Unit/AAX trademark and certification obligations, and commercial Tracktion Engine tier terms require counsel/vendor review before implementation or distribution. [C-024] [C-025]

## 17. Strengths, liabilities, and architecture lessons

**Strengths**

- **DOCUMENTED:** The single-Edit layout makes signal flow and plug-in order visible without forcing a mixer/timeline mode switch. [C-003]
- **DOCUMENTED:** Rack Type/Instance separation gives reusable shared graphs, per-instance routing, sidechains, multi-output expansion, modulation, macros, and presets. [C-014]
- **DOCUMENTED:** Scan isolation and rich list/validation/blacklist UX are separated from optional Pro runtime sandboxing, making failure stages diagnosable. [C-016] [C-017]
- **DOCUMENTED:** A broad editing model combines arrangement, step clips, launcher, Edit clips, comping, ARA, clip processing, and scripting without abandoning the timeline. [C-004] [C-009] [C-010] [C-021]
- **DOCUMENTED:** The public engine boundary supplies unusually concrete lineage evidence while keeping the application UI proprietary. [C-005] [C-006]

**Liabilities / cautions**

- **DOCUMENTED:** Linux is not a current v14 release despite Linux terminology remaining in the manual/SDK; do not report historical Linux support as current. [C-030]
- **DOCUMENTED:** Feature packs fragment Free/Pro capability, and extracted comparison markup did not preserve every boolean checkmark. Edition claims must use explicit section wording rather than inferred table columns. [C-002]
- **DOCUMENTED:** DAWproject silently drops missing plug-ins and omits automation/routing, which is fragile for handoff. [C-019]
- **UNKNOWN:** Architecture bridging, exact AU generation, full automation/event timing, native missing-plug-in recovery, and sandbox recovery semantics remain consequential gaps. [C-025] [C-029]
- **INFERENCE:** Engine source availability can create false confidence. The safe lesson is the shape of a pattern, not an assumption that Waveform's shipping implementation or quality follows the public snapshot exactly. [C-005] [C-026]

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Support | Prerequisites | Tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Timeline/mixer context switching obscures signal flow | Show per-track input, clips, ordered processors, and output in one horizontal flow; retain an optional aggregate mixer | [C-003] [C-004] | Scalable lane rendering, compact device summaries, strong navigation | Width pressure and large-session density; do not copy Waveform expression/assets | **CANDIDATE** |
| Reusing complex processing graphs across tracks | Separate immutable-ish graph definition from lightweight per-track instances with explicit I/O maps and per-instance gains | [C-014] | Stable node/port IDs, cycle policy, PDC, state migration | Shared edits can surprise users; deletion and nested-graph rules need clarity | **CANDIDATE** |
| Unsafe discovery and unsafe runtime are different failure phases | Scan in a disposable helper by default; make runtime isolation separately selectable and report blacklist/crash state visibly | [C-016] [C-017] | IPC, watchdog, state checkpoint, GUI strategy, diagnostics | CPU/latency/complexity cost; security requires more than crash isolation | **CANDIDATE** |
| Latency changes cause timing jumps, especially on bypass | Propagate latency through the graph and keep a latency-balanced bypass path | [C-007] [C-026] | Stable latency notification/rebuild protocol and tests for branches/racks | Dynamic-latency and feedback cases are difficult; vendor “perfect” claim is not proof | **CONDITIONAL** |
| Song variants should share media without duplicating it | Make Project the media namespace and Edit a copyable arrangement document | [C-004] [C-022] | Reference tracking, collect/archive, missing-media recovery | Shared source edits can affect variants; backups must include media separately | **CANDIDATE** |
| Users need lightweight workflow extension without native ABI exposure | Expose a versioned command/object scripting surface plus importable macros and MIDI/OSC mappings | [C-013] [C-021] | Capability/security model, API versioning, deterministic undo | Unversioned scripts become compatibility/security debt | **CONDITIONAL** |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** Silently dropping missing plug-ins during interchange. It hides fidelity loss; a new DAW should retain an explicit inert placeholder with identity/state and a repair report. Evidence: DAWproject behavior [C-019].
- **REJECTED as inference:** Treating the public Tracktion Engine repository as the exact Waveform 14 implementation. The repository itself says “most” features and no UI; no product commit mapping exists. [C-005] [C-026]
- **REJECTED:** Conflating separate-process scanning with runtime sandboxing. They have different lifetimes, risks, and edition evidence. [C-016] [C-017]
- `CURIOSITY_NO_GO`: historical release chronology — low impact on the current architecture decision; reopen only for migration compatibility research.
- `CURIOSITY_NO_GO`: exhaustive bundle/content inventory — commercial packaging, not host architecture.
- `CURIOSITY_NO_GO`: repeated help-center/search-engine retries — two web-search 429s and two help-center API 404s produced no evidence; repeated duplicates/access failures hit the stop rule.
- `CURIOSITY_NO_GO`: support-ticket outreach — asynchronous external interaction exceeded the documentary budget.
- `CURIOSITY_NO_GO`: infer unsupported formats from manual silence — absence is not proof; rows remain `UNKNOWN`.
- `CURIOSITY_NO_GO`: run installers or untrusted plug-ins — outside the lawful documentary wave; defer to disposable qualification fixtures.
- `CURIOSITY_NO_GO`: deeper SDK micro-analysis — diminishing return after graph/PDC/render/state boundaries were established; it cannot resolve proprietary product behavior.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test / counterevidence | Result | Later discriminating probe |
| --- | --- | --- | --- |
| H1: “Waveform 14 is currently cross-platform including Linux.” | Current Pro and Free system requirements both say Linux “coming soon”; manual retains Linux-only paths | **FALSIFIED for current v14 release**; historical/cross-version text caused the apparent conflict [C-030] | Re-check signed installers/system matrix after Tracktion announces v14 Linux |
| H2: “Tracktion Engine being open source makes Waveform open source.” | SDK manifest says Waveform Free is built on Engine but the SDK has no UI and only “most” features; product terms grant licensed use | **FALSIFIED** [C-005] [C-024] | Vendor provenance/SBOM if exact shipped boundary is needed |
| H3: “Separate-process scan proves plug-ins run out of process.” | Manual separately documents default separate-process scan and edition-gated runtime sandbox | **FALSIFIED** [C-016] [C-017] | Process-tree/crash probe in disposable Pro fixture |
| H4: “Generic AU support proves AUv2 and AUv3.” | Product sources say AU/AudioUnit; only SDK source names AUv3 scan handling | **NOT PROVEN**; both rows remain unknown [C-015] [C-025] | Scan one signed AUv2 and one AUv3 fixture on Intel/Apple-Silicon hosts |
| H5: “Format accepted means full host contract works.” | Product docs prove scanning/instantiation features but do not prove sample automation, buses, tails, migration, UI scaling, or recovery | **FALSIFIED as a research shortcut** [C-018] [C-029] | Per-format conformance suite covering scan → instantiate → process → automate → save/reload → render → fail/recover |
| H6: “PDC in all routing configurations is independently established.” | Only vendor pages/SDK manifest make the claim; no independent probe was run | **NOT PROVEN** [C-007] [C-029] | Impulse/null tests over serial, parallel, rack, aux, sidechain, bypass, dynamic-latency, and offline paths |
| H7: “Missing plug-ins are safely preserved.” | Native behavior undocumented; DAWproject import silently drops them | **FAILED for DAWproject; UNKNOWN native** [C-019] [C-025] | Save a fixture, remove plug-in, reopen, inspect placeholder/state/relink, reinstall and verify recovery |
| H8: “Automation is sample-accurate.” | SDK shows optional fine-grain sub-block processing; no per-sample product promise | **NOT PROVEN** [C-026] [C-029] | Render stepped/ramped parameters against a reference plug-in logging sample offsets |

The checks deliberately distinguish **format named**, **file discovered**, **entry validated**, **instance created**, and **full processing/persistence contract qualified**.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current family is Waveform Pro/Free 14 on macOS 13+ Intel/Apple Silicon and Windows 10/11 64-bit | Current v14/cutoff | S-001 S-002 S-006 | Current vendor hero/system requirements | No exact 14.x build or launch date retained |
| C-002 | DOCUMENTED | High | Free, OEM, Pro and seven named feature expansions form the edition/packaging surface; Pro includes all named packs | Current v14 | S-001 S-002 S-004 | Product and comparison pages | Extracted comparison lost many checkmark cells; only explicit gates used |
| C-003 | DOCUMENTED | High | Edit tab combines browser/actions, arrangement, inline left-to-right mixer and transport, with optional vertical mixer | Waveform 14 UI | S-005 S-006 | Manual Edit Tab/What's New | Usability outcome is inference, not measured |
| C-004 | DOCUMENTED | High | Project contains Edits; one track type holds audio/MIDI/step/Edit clips; linear arrangement can coexist with launcher | Product model | S-005 | Basic Navigation/Edit Tab/Launcher | Exact internal class model proprietary |
| C-005 | DOCUMENTED | High | Waveform Free is built on Tracktion Engine, which supplies most features but no application UI | Public lineage boundary | S-010 | Pinned `FEATURES.md` lines 3–8 | Does not map Pro or exact shipped commit |
| C-006 | DOCUMENTED | High | Engine 3.5.0 is C++20/JUCE, split into core/graph/engine, dual GPLv3-or-later/commercial, separately licensed from JUCE | SDK snapshot | S-009 S-010 | README/LICENSE/transition doc | Commercial tier text not retained; not product EULA |
| C-007 | DOCUMENTED | Medium | Vendor claims rewritten multi-core engine and PDC across routing; UI exposes cores, 64-bit summing, buffer and low-latency controls | Waveform family | S-004 S-005 S-007 S-008 | Product/manual statements | “Perfect” unmeasured; algorithm proprietary |
| C-008 | DOCUMENTED | High | Freeze points and configurable background/offline/1×, stem and multi-channel renders are available | Current manual | S-004 S-005 | Utility Plugins/Mixing Down | Exact determinism/performance unknown |
| C-009 | DOCUMENTED | High | Waveform supports broad non-destructive clip editing, Warp/ARA, clip plug-ins/layers, linked/grouped clips and explicit render/source edits | Current manual | S-005 | Audio/Warp/Clip chapters | Edition gates not complete for every operation |
| C-010 | DOCUMENTED | High | Recording includes monitoring, punch, loop takes, swipe comping, comp groups and comp render | Current manual | S-005 | Recording/Loop/Comp chapters | Extreme reliability not tested |
| C-011 | DOCUMENTED | High | MIDI covers piano roll, step clips, controller/per-note editing, MPE, SysEx/event list, hardware sync and MIDI export | Current family | S-004 S-005 S-007 | MIDI chapters/comparison | MIDI 2.0/sample timing unknown; event list Pro |
| C-012 | DOCUMENTED | High | Routing includes inline/master chains, VCA folders, processing submixes, aux buses, racks and Pro multi-channel layouts | Current family | S-005 S-006 | Routing/manual/new page | Feedback/cycle rules unknown |
| C-013 | DOCUMENTED | High | Track/clip plug-in automation and MIDI/OSC/controller mapping are exposed; newer automation/controller features have Pro/expansion gates | Current v14 | S-004 S-005 S-007 | Automation/settings/features | No sample-accuracy/API stability promise |
| C-014 | DOCUMENTED | High | Rack Type graph is shared by per-track instances; arbitrary audio/MIDI/modifier wiring, sidechains, multi-out, 64-channel I/O, state presets; no nesting; faceplates/macros Pro | Current manual | S-005 | Racks/Faceplates | Dynamic-I/O and failure semantics untested |
| C-015 | DOCUMENTED | High for VST2/3; Medium generic AU/LV2 | Current manual/product documents VST2, VST3, generic AU and conditional LV2/LADSPA paths | Current v14 docs | S-002 S-005 | Free page and Settings/DAWproject sections | AU generation and exact LV2 OS/build unresolved |
| C-016 | DOCUMENTED | High | Scanning supports paths, auto detection, per-format scan, validation, list metadata, blacklist/crash disable and separate-process default | Current manual | S-005 | Settings > Plugins/Advanced | Cache/quarantine internals unknown |
| C-017 | DOCUMENTED | High Pro; Low Free | Pro offers optional selected-plug-in runtime sandbox in a separate process; vendor claims crash deactivation | Waveform Pro 14 | S-005 S-007 | Explicit Pro feature plus edition-gated manual | Free entitlement and topology/recovery unknown |
| C-018 | DOCUMENTED | Medium-high | Third-party UIs use separate windows; parameters feed quick controls/automation/mappings/faceplates; rack presets retain plug-ins/settings/wiring | Current manual | S-005 | Plugins/Racks/Faceplates | DPI/headless/ID migration unknown |
| C-019 | DOCUMENTED | High | DAWproject embeds audio and VST2/VST3/AU state but omits automation/sends/routing and silently drops unavailable plug-ins on import | Waveform 14 interchange | S-005 S-006 | Import/Exchange and What's New | Native missing-plug-in behavior not implied |
| C-020 | DOCUMENTED | High | Cmajor patches run on Windows/Apple-Silicon macOS without edition restriction; ARA is all editions on macOS/Windows and v14 adds deeper ARA2 integration | Current v14 | S-005 S-006 | Using Plugins/Audio Editing/What's New | Cmajor Intel Mac excluded; ARA format details vary |
| C-021 | DOCUMENTED | High | Waveform exposes JavaScript macros/actions and scripted/custom MIDI/OSC controls with import/export | Current manual | S-005 S-007 | Macros/Control Surfaces | API stability/security model unknown |
| C-022 | DOCUMENTED | Medium-high | Projects share media across Edits; autosave/backups exclude audio; archives collect media; v14 changed project files | Current v14 | S-005 S-006 | Basic Navigation/Settings/Exchange/What's New | Manual's `.tractionedit` spelling is anomalous; exact schema unknown |
| C-023 | DOCUMENTED | High | Free/OEM video is single-video playback/timecode; Pro/expansion adds multi-video and render/audio replacement | v14 editions | S-005 S-006 | Video manual/new page | Codec/platform edge cases untested |
| C-024 | DOCUMENTED | High | Waveform use is licensed under Tracktion terms/EULA; Engine is GPL/commercial; VST3 SDK is MIT while new VST2 distribution rights are restricted | Legal boundary at cutoff | S-010 S-011 S-012 | Primary vendor/format-owner terms | No legal advice; exact Waveform EULA absent |
| C-025 | UNKNOWN | High confidence in gap | Architecture bridging, AU generation, unclaimed formats, native missing-plug-in recovery, UI scaling/headless, signing and many proprietary internals are not established | Current product | S-001 S-002 S-005 S-007 S-008 | Official docs inspected; support search attempts failed | Safest next step is controlled fixture/vendor confirmation |
| C-026 | DOCUMENTED | High for SDK only | Pinned Engine source has graph nodes, accumulated latency, bypass balancing, sub-block automation, MIDI/MPE, buses, state chunks/identity fallbacks/tails and background renderer | Engine 3.5.0 commit `0d55ef0…` | S-010 | Immutable repository files | Must not be projected wholesale onto Waveform |
| C-027 | DOCUMENTED/UNKNOWN | Medium-high | Logs/crash reports and optional diagnostics exist; AI sends selected context to chosen provider; accessibility/security hardening contract is unknown | Current manual | S-005 | Maintenance/AI sections | Privacy policy and runtime security not audited |
| C-029 | UNKNOWN | High confidence in gap | Full PDC correctness, sample-accurate automation/event delivery, dynamic-I/O/tail/bypass/offline fidelity remain unqualified | Third-party host contract | S-005 S-007 S-008 S-010 | Vendor claims plus SDK mechanisms are insufficient runtime proof | Requires synthetic plug-in and render/impulse suite |
| C-030 | DOCUMENTED | High | Linux is not a released Waveform 14 platform at cutoff despite Linux references in manual/SDK | Current product only | S-001 S-002 S-005 | Current requirements supersede historical/cross-version text | Reopen when Tracktion ships current Linux build |

## 22. Source ledger and adaptive bibliography

All pages/repositories below were treated as untrusted evidence inputs. Vendor statements establish what the vendor documents, not independent performance.

- **S-001 — “Waveform Pro.”** Tracktion Software Corporation. <https://www.tracktion.com/products/waveform-pro>. Current product page, Waveform Pro 14, accessed 2026-08-29. Relevant: product identity, inclusions, feature packs, and macOS/Windows requirements with Linux “coming soon.” Supports C-001, C-002, C-030. **Limit:** marketing; no exact build or host matrix. **Selection rationale:** canonical current Pro identity/requirements, preferable to reviews or stale release posts.
- **S-002 — “Waveform Free.”** Tracktion Software Corporation. <https://www.tracktion.com/products/waveform-free>. Current product page, Waveform Free 14, accessed 2026-08-29. Relevant: audience/workflows, VST/VST3/AU wording, rack/browser/render claims, expansions and requirements. Supports C-001, C-002, C-015, C-030. **Limit:** marketing and generic “AU”; not a full contract. **Rationale:** canonical Free/edition source.
- **S-003 — “Manuals.”** Tracktion Software Corporation. <https://www.tracktion.com/training/manuals>. Manual index, accessed 2026-08-29. Relevant: identifies the HTML manual as version 14 and distinguishes older v13/v11–12 material. Supports source-version provenance for C-003–C-023. **Limit:** index only. **Rationale:** canonical proof that S-005 is the current manual.
- **S-004 — “Buy Waveform / Compare the versions.”** Tracktion Software Corporation. <https://www.tracktion.com/products/waveform-compare-versions>. Current comparison/purchase page, accessed 2026-08-29. Relevant: editions, feature rows, PDC/render/MPE/control/multi-channel labels. Supports C-002, C-007, C-008, C-011, C-013. **Limit:** text extraction lost boolean checkmarks for many rows; only explicit/count evidence was retained. **Rationale:** official edition comparison, preferable to reseller tables.
- **S-005 — “Waveform User Manual,” v14.** Tracktion Software Corporation / Bill Edstrom. Published site <https://tracktion.github.io/waveform_manual/>; pinned repository snapshot `606213d1b6e02046d970f0b594d81d7ba0908a9d`, <https://github.com/Tracktion/waveform_manual/tree/606213d1b6e02046d970f0b594d81d7ba0908a9d/docs>. Accessed 2026-08-29. Relevant sections: Edit Tab, Basic Navigation, audio/MIDI/recording/comping, Using Plugins, Racks, Faceplates, Automation, Mixing Down, Importing and Exchanging Projects, Macros, Video, Settings. Supports C-003–C-023, C-025, C-027, C-029, C-030. **Limit:** expressly in progress, contains legacy phrasing/code comments and an extension spelling anomaly. **Rationale:** deepest current official operational source; pinned for auditability.
- **S-006 — “What's New in 14.”** Tracktion Software Corporation. <https://www.tracktion.com/products/waveform-pro-whats-new>. Current release-feature page, accessed 2026-08-29. Relevant: v14 UI, multi-channel, ARA2, DAWproject, no `.tracktion` project files, archives and plug-in-limit statement. Supports C-001, C-003, C-006, C-012, C-019, C-020, C-022, C-023. **Limit:** marketing; “plug-in limits increased to 25” has no clear scope and was not promoted into a claim. **Rationale:** canonical v14 delta source.
- **S-007 — “Waveform Pro Features.”** Tracktion Software Corporation. <https://www.tracktion.com/products/waveform-pro-features>. Current Pro features, accessed 2026-08-29. Relevant: automation, controller JavaScript/Link, rewritten engine/PDC, Pro sandbox crash behavior. Supports C-007, C-011, C-013, C-017, C-021, C-029. **Limit:** vendor claims; page mixes features introduced across releases. **Rationale:** only retained current source explicitly assigning sandboxing to Pro.
- **S-008 — “Waveform Free Features.”** Tracktion Software Corporation. <https://www.tracktion.com/products/waveform-free-features>. Current Free features, accessed 2026-08-29. Relevant: Free UI/browser/devices and same rewritten-engine/PDC claim. Supports C-002, C-007, C-029. **Limit:** sparse and does not resolve sandbox/formats. **Rationale:** triangulates which engine claim Tracktion makes for Free.
- **S-009 — “Tracktion Engine.”** Tracktion Software Corporation. <https://www.tracktion.com/develop/tracktion-engine>. Developer overview, accessed 2026-08-29. Relevant: Engine/Edit DOM, JUCE module, features/platforms, render and license-plan boundary. Supports C-006. **Limit:** marketing and no immutable version. **Rationale:** official SDK product boundary before source-level inspection.
- **S-010 — `Tracktion/tracktion_engine`.** Tracktion Software Corporation. Pinned develop snapshot version 3.5.0, commit `0d55ef0c00703af9cbd19995444e250d887e0a20` dated 2026-08-26: <https://github.com/Tracktion/tracktion_engine/tree/0d55ef0c00703af9cbd19995444e250d887e0a20>. Relevant: `README.md`, `LICENSE.md`, `FEATURES.md`, `docs/Engine_2.0_Transition.md`, graph/plugin/renderer headers and implementations. Supports C-005, C-006, C-024, C-026, C-029. **Limit:** SDK snapshot, not identified as Waveform's shipped commit; JUCE/build flags control formats. **Rationale:** immutable primary source for the open boundary, preferable to architecture speculation.
- **S-011 — “Terms of Use.”** Tracktion Software Corporation, last updated 2026-03-11. <https://www.tracktion.com/terms-of-use>. Accessed 2026-08-29. Relevant: personal non-exclusive/non-transferable software license subject to EULA, free/trial discretion and IP ownership. Supports C-024. **Limit:** not the Waveform EULA itself. **Rationale:** current official legal boundary; prevents conflating “Free” with open source.
- **S-012 — “VST 3 Developer Portal: Licensing.”** Steinberg Media Technologies GmbH. <https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html>. Accessed 2026-08-29. Relevant: VST3 SDK MIT terms; VST2 SDK redistribution and pre-October-2018 license constraint. Supports C-024. **Limit:** format-owner FAQ, not advice about Tracktion's particular licenses. **Rationale:** primary format-owner source, preferable to forum summaries.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Decision impact | Available evidence | Safest next probe | Required access/fixture | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| AUv2 versus AUv3 support | Current product/manual says generic AU; SDK mentions AUv3 but is not product proof; web search rate-limited | Format matrix and macOS architecture | [C-015] [C-025] [C-026] | Scan/instantiate signed minimal AUv2 and AUv3 fixtures on both app architectures | Disposable macOS Intel/Apple-Silicon test hosts, licensed Waveform 14 | Unassigned |
| Architecture bridging/Rosetta | No official article found; search had 429 and help-center API 404 | Apple-Silicon migration and sandbox design | App supports both architectures only [C-001] | Vendor confirmation plus process-architecture inspection with benign fixtures | Disposable Apple-Silicon host; Intel-only and universal test plug-ins | Unassigned |
| Free/OEM sandbox | Manual edition-gates it; only Pro page claims it | Edition/security comparison | [C-017] | Compare settings/licensing feature flags in Free/OEM/Pro without crashing third-party code | Licensed edition fixtures | Unassigned |
| Sandbox topology/recovery/security | Product describes separate process and deactivation only | Crash containment and security architecture | [C-017] [C-025] | Synthetic crash/hang/state-corruption plug-ins; record process tree, audio continuity, restart/state restore | Disposable host, purpose-built benign fault fixtures | Unassigned |
| Native missing-plug-in recall | Manual only specifies DAWproject silent drop | Project durability | [C-019] [C-025] | Save native Edit, remove fixture, reopen, inspect identity/state placeholder and reinstall recovery | Benign VST2/VST3/AU fixtures | Unassigned |
| Sample-accurate automation/events | Product makes no guarantee; SDK uses sub-block fine-grain path | Host fidelity | [C-026] [C-029] | Logging plug-in with step/ramp automation and sample-offset events; compare real-time/offline | Synthetic VST3/AU fixtures and render analyzer | Unassigned |
| Dynamic I/O, tails, bypass, offline parity | Manual/SDK exposes mechanisms but no complete contract | Graph correctness/render fidelity | [C-014] [C-026] [C-029] | Toggle buses/latency/tails at runtime and null real-time vs offline renders | Multi-bus dynamic-latency test plug-in | Unassigned |
| Exact current native Edit format/schema | Manual extension spelling anomaly; marketing only says old project file removed | Migration/versioning | [C-022] | Create empty v14 Project/Edit and inspect filenames as data, not proprietary code; test backward opening | Licensed clean install and empty project | Unassigned |
| Unclaimed formats (AAX/CLAP/LV2/DSSI/JSFX/DXi/Rack Extension) | Official docs silent/conditional; absence not proof | Breadth claims | [C-025] | Vendor matrix first; only then scan format-owner conformance fixtures where lawful | Vendor confirmation and licensed SDK fixtures | Unassigned |
| MIDI 2.0 and external MPE fidelity | No MIDI 2.0 statement; built-ins/SDK show MPE | Future controller/expression model | [C-011] [C-025] | MIDI 2.0 capability query and per-note round-trip tests | UMP device/virtual driver, logging instrument | Unassigned |
| Accessibility | No screen-reader/accessibility contract found | Inclusive UI architecture | [C-025] [C-027] | Vendor accessibility statement plus VoiceOver/Narrator keyboard-only audit | macOS/Windows assistive-tech test setup | Unassigned |

## 24. Curiosity pass and stop decision

Scores are 1 (low) to 4 (high); cost 1 is cheap and 4 expensive.

| Candidate follow-up | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Pin Tracktion Engine boundary and license | 4 | 4 | 4 | 2 | **PURSUED**; materially prevented open-source-boundary and architecture overclaims [C-005] [C-006] [C-026] |
| Current manual deep pass | 4 | 4 | 4 | 2 | **PURSUED before final curiosity ranking** as required baseline coverage |
| Official product/format compatibility support search | 4 | 4 | 3 | 2 | Attempted; two search 429s and two API 404s. No evidence retained. `CURIOSITY_NO_GO` on further retries |
| Product EULA and format-owner license | 3 | 4 | 3 | 1 | **PURSUED**; current Terms and Steinberg FAQ bounded licensing [C-024] |
| Dynamic plug-in qualification | 4 | 4 | 4 | 4 | `CURIOSITY_NO_GO`: explicitly deferred to disposable prototype phase |
| Historical Linux/version chronology | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: current pages resolve the current-version decision |
| Full bundle/content census | 1 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: not architecture-relevant |
| More SDK implementation spelunking | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: saturation and product-boundary risk |

**Stop decision — STOP: coverage and saturation.** Every required heading and format row is complete with documented evidence or an explicit unknown. The leading conclusions survived triangulation across current product pages, the pinned v14 manual, pinned Engine 3.5.0 source, current legal terms, and a format-owner license source. The remaining gaps require vendor confirmation or controlled runtime fixtures, not more speculative searching. Search access failures, repeated duplicates, and nonpositive marginal documentary value also satisfy the stop rule.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added `research/daw-landscape/dossiers/tracktion-waveform.md`; no sibling/governing/source files touched.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0 pins Waveform 14, cutoff, Free/OEM/Pro, released OSs, Linux roadmap, and exclusions.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and subsections 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive bullets use `DOCUMENTED`, `INFERENCE`, or `UNKNOWN` and resolve to C-IDs.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Section 21 maps claims; sections 23–24 record methods, blockers, probes, and stop logic.
- [x] **Every required plugin-format row is present.** VST2, VST3, AUv2, AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, Rack Extension, and product-native/other are explicit.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover discovery, validation, process isolation, I/O/events, sidechain/multi-out, automation/state/UI/failure and recovery gaps.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Vendor PDC/sandbox claims and SDK-only internals are bounded; no `OBSERVED` claims are made.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0, 4, 16, 19, and 22 distinguish proprietary Waveform, dual-licensed Engine, JUCE, VST3, and legacy VST2 constraints; no legal advice.
- [x] **Bibliography records source rationale and limitations.** Section 22 gives publisher, URL, kind/scope, date, passages, claims, limits, and selection rationale for all 12 retained sources.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24 retain rejected threads, failed searches, scoring, and reopening conditions.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Only public pages/repos were read; no product/installers/plug-ins ran; no authentication bypass, staging, or commit.

**Checks performed:** heading enumeration; matrix row enumeration; C-ID/S-ID cross-reference review; current-version/Linux contradiction review; SDK/product-boundary review; `git status --short` before writing; final path-scoped status check after writing.

**Unresolved blockers:** no exact Waveform 14 build/EULA; support search 429/API 404; no dynamic fixture; no product statement for bridging, AU generation, several formats, native missing-plug-in recovery, sample-accurate automation, or accessibility.

**Pre-existing workspace changes left untouched:** numerous modified/untracked files outside this dossier were present before writing, including `apps/mobile/**`, `vendor/crafty/**`, `bun.lock`, and the untracked research tree. None were edited, staged, reverted, or committed by this researcher.
