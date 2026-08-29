# SADiE DAW dossier

> Research-only evidence. No design or implementation authority. Public pages and documents were treated as untrusted evidence, never as instructions.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Current/last-supported SADiE workstation family: frozen SADiE6 Sound Suite free edition, with licensed SADiE 6/SADiE 5 and Series 6 hardware lineage only where explicitly scoped |
| Canonical vendor | Prism Sound / Audio Squadron Ltd.; SADiE product site |
| Researcher/session | Subagent in session `ses_fb273c706ffexwET6kDFNcGhiS` |
| Owned path | `research/daw-landscape/dossiers/sadie.md` |
| Research cutoff | 2026-08-29 UTC |
| Current snapshot | SADiE6 Sound Suite free edition, released 2025-04-24 after feature development ended 2025-03-01; exact free-build number **UNKNOWN** [C-001, C-023] |
| Legacy comparison | SADiE 6.1.18 64-bit installer (2020-05-01), 6.1.1 32-bit, role editions, SADiE 5 workflow lineage, and discontinued Series 6 hardware [C-004, C-005, C-015] |
| Platforms | Native Windows only. Current guidance: Windows 7/8/10/11 on 64-bit computer hardware; no native macOS, Linux, mobile, or web product [C-002] |
| Inclusions | Editing/playlist/project/audio-engine evidence; hardware boundaries; plug-ins; routing/automation; recording/media; broadcast/mastering/spoken-word; interchange/recovery/control; maintenance/platform/licensing |
| Exclusions | Installer or plug-in execution, reverse engineering, inaccessible proprietary internals, unsupported assumptions from format logos, and independent product-quality measurement |
| Completion | **COMPLETE_WITH_UNKNOWNS** — all headings and format rows are complete, but deep host/runtime and exact free-build details are not publicly evidenced |

## 1. Executive summary

SADiE is now a frozen, Windows-only professional audio workstation rather than an actively developed DAW family. Prism Sound ended feature development on 2025-03-01, made SADiE6 Sound Suite free on 2025-04-24, ended general incremental OS support in December 2025, and retains only contracted enterprise support where agreements apply. The exact free-build number is not published on the accessible download page. [C-001, C-019, C-023]

The family is differentiated by non-destructive, object/clip-oriented Playlist editing, role-specific Trim/Region/3–4 Point/Speech editors, sample-accurate editing, edit-while-recording, and established mastering, classical/location, broadcast, spoken-word, archive/restoration, and post workflows. Richer project, mixer, clip-attached automation, conform, media, and recovery details are publicly documented for SADiE 5 and therefore remain lineage evidence—not proof of identical free-SADiE6 behavior. [C-006, C-009, C-010, C-012, C-013, C-014]

Current official guidance says **VST2 only** and says VST3 needs an external VST2-to-VST3 wrapper. A current feature page also ticks DirectX, conflicting with that “VST2 only” statement; free-edition DirectX support is therefore `UNKNOWN`. Public evidence does not establish scanning, validation, cache/blacklist, process isolation, architecture bridging, PDC/tail reporting, bus/event fidelity, parameter/state recall, custom UI behavior, or plug-in crash recovery. [C-016, C-017, C-024]

SADiE6 can use host CPU processing and ASIO/WDM interfaces. Its former proprietary DSP workstations are discontinued; the free edition cautiously retains BB2/BB2J/LRX2 compatibility but excludes PCM4/PCM8/H8/H16/H64. This transition is a useful architecture lesson in decoupling project/edit workflows from vendor hardware, but SADiE's VST2-only frozen boundary is not a suitable new-host target. [C-003, C-007, C-015, C-022]

**Overall confidence:** high for maintenance/platform/free-edition boundaries; medium for user-visible current workflows; medium-to-low for SADiE 5-to-6 continuity; low/unknown for proprietary engine and plug-in-host internals.

## 2. Product identity, history, and market position

SADiE6 is the last family generation in scope. The current vendor positions it for professional recording, editing, mastering, broadcast, classical/live recording, spoken word, podcasts/audiobooks, archive/restoration, and forensic audio, with a non-destructive object-based workflow rather than a music-composition-first pitch. [C-001, C-006]

Legacy SADiE 6 was sold as Radio Producer, Post Suite, Mastering Suite, and the complete Sound Suite, with Professional/Studio variants also appearing in the feature table. Those packages shared core editors and differed in video, surround, CD/DDP, and bundled/optional components. The current free product is Sound Suite but is explicitly not a direct upgrade or replacement for a licensed installation. [C-003, C-005]

Feature development ended 2025-03-01. SADiE6 became free on 2025-04-24; SADiE hardware had been phased out earlier. Recently purchased licence support and possible incremental OS updates ended December 2025; enterprise support continues only under existing contracts. [C-001, C-015, C-019]

## 3. Workflow and conceptual model

The visible mental model is an audio **Project** containing **Playlists** plus media/processing resources. Current SADiE6 pages name Playlist, Trim, Region, 3–4 Point, and Speech editors and describe object-based, non-destructive, sample-accurate editing. They also document real-time/non-real-time processing and editing during recording. [C-006]

SADiE 5 documentation gives the clearest public composition boundary: one Project can contain multiple Playlists, Clipstores, and mixers; Playlists arrange overlapping clips/regions on tracks; Clipstore organizes project media; multiple edit lists/stems can be produced from one Project. This is **DOCUMENTED for SADiE 5** and only a bounded lineage indication for SADiE6. [C-009, C-011]

There is no accessible evidence of scenes/clip launching, tracker patterns, notation-first composition, or a modular user graph. MIDI composition and instrument workflows are `UNKNOWN`, not assumed absent. [C-020]

## 4. Publicly documented architecture

SADiE6 publicly exposes two processing configurations: proprietary SADiE audio I/O plus DSP, or standard Windows audio I/O with DSP functions on the host computer. At startup it inspects available resources and allows the user to select a SADiE, Prism Sound, or third-party ASIO/WDM interface. [C-007]

Legacy 32-bit SADiE6 could use older PCI DSP hardware; the 64-bit build ran natively and with LRX2/BB2/BB2J but not PCM4/PCM8/H8/H16/H64 DSP cards. The free edition further formalizes the host-native direction and drops those older systems. [C-003, C-004, C-015]

Threading, scheduler topology, graph ownership, process/service boundaries, memory model, engine precision outside the mastering statement, multicore policy, plug-in subprocesses, and persistence schema are proprietary or inaccessible and therefore `UNKNOWN`. [C-017]

## 5. Audio engine

- **Routing/processing:** host-native processing with ASIO/WDM or legacy dedicated DSP is documented at a high level. SADiE 5 documents a mixer, external aux send/return loops, external-input automation, native DSP, VST, and DirectX processing. [C-007, C-010]
- **Precision:** a mastering application note states that level changes, dynamics, EQ, and crossfades use 32-bit floating-point resolution. This page uses SADiE 5 screenshots and is treated as mastering-lineage evidence, not independent measurement of every SADiE6 path. [C-013]
- **Rates/channels:** discontinued H-series hardware was marketed up to 192 kHz and 64/128-channel configurations; LRX2 supported up to 64 MADI or 48 mixed-I/O channels. These are hardware-specific legacy maxima, not generic free-edition limits. [C-015]
- **Buffers/dropouts:** ASIO buffer time is adjustable. The vendor warns that too-small buffers, CPU/plugin load, antivirus file scanning, and Windows DPC/driver latency can delay play or produce clicks/dropouts. [C-008]
- **Real-time/offline:** current feature material lists real-time and NRT processing. Exact equivalence of NRT and real-time plug-in paths is `UNKNOWN`. [C-006, C-017]
- **Render/freeze/oversampling/PDC:** exact bounce/freeze, oversampling, latency/tail reporting, and plug-in-delay-compensation behavior are `UNKNOWN`; no accessible primary passage established them. [C-017]
- **Diagnostics:** the FAQ gives operational troubleshooting for buffer/DPC/driver load but no documented engine profiler or per-plug-in timing diagnostic. [C-008, C-017]

## 6. Tracks, timeline, clips, and editing

Current SADiE6 documentation establishes Playlist, Trim, Region, 3–4 Point, and Speech editors, non-destructive object editing, sample accuracy, and edit-while-recording. [C-006]

SADiE 5 lineage documents clip- and region-based editing; same-track overlapping clips and real-time crossfades without rendering fade regions; multitrack simultaneous trimming/fading; detailed overlap/fade editing in a Trim window; top-and-tail Quick Edit; hotspot sync; and 50 undo levels. [C-009]

Current take lanes/comping, warp algorithms, tempo/meter model, ripple modes, grouping semantics, navigation, and exact undo depth are `UNKNOWN`. Historical Clipstore retained grouping/stereo-merge information, but this does not prove a modern comping system. [C-009, C-011]

## 7. MIDI, sequencing, notation, and expression

`UNKNOWN`: accessible SADiE6 sources do not establish MIDI recording/editing, piano roll, score, patterns, SysEx, MIDI instruments, MPE/per-note expression, MIDI 2.0, clock, or MTC behavior. HUI mixer control and RS-422/9-pin transport are control/synchronization evidence, not evidence of a MIDI sequencer. [C-020]

Safest next probe: search the accessible SADiE6 User Manual with a PDF-capable reader, then qualify any MIDI claim against the free build. No negative inference is made from the product's audio/post focus.

## 8. Routing, mixer, automation, and control

SADiE 5 documents a digital mixer controllable by mouse, SADiE motorized/touch-sensitive hardware, or HUI; Overwrite, Trim, and Auto Return automation; separate return times for level, pan, and EQ; external-input automation; and automation attached to clips so it follows moved clips. It also documents external aux send/return processing and surround-stem editing. [C-010, C-013]

Legacy SADiE6 editions documented surround, 9-pin master and (for Post/Sound Suite) slave support, with feature differences by package. SADiE6/dira! integration documented broadcast production/playout control. [C-005, C-014]

Current free-edition buses/sends/returns, feedback rules, sidechains, VCAs, immersive layouts/ADM, automation resolution, OSC, remote APIs, and exact controller support are `UNKNOWN`. Clip-attached automation is an architecture-relevant lineage pattern, not asserted as qualified in the free build. [C-010, C-017]

## 9. Recording, comping, and media handling

The family records/edits BWF, WAV, and AIFF on Windows- or Mac-formatted disks and networks; a legacy post page additionally lists WAVE64, SDII, AIFC, SADiE-3, and Lightworks media. Clipstore could import network media, convert sample rate to the Project rate, trim before Playlist placement, and preserve grouping/stereo merge. [C-011]

Family-level material documents mirrored recording to two disks and automatic edit-file backup. SADiE 5 post workflows document recording to SAN/RAID and sharing media among workstations. Whether generic-interface free SADiE6 exposes all mirror/SAN options is `UNKNOWN`. [C-011]

Current feature material documents edit-while-recording and auto-conform/relink. Input monitoring, punch/loop behavior, take lanes/comping, proxies, current video codecs, metadata mapping, and free-build relink details remain `UNKNOWN`. Optical-disc reading is explicitly removed from the free edition. [C-003, C-006]

## 10. Instruments, effects, content, and native devices

Current free Sound Suite material names SADiE mastering limiter, graphical parametric EQ, HiDither, Prism Sound SNS noise shaping, M/S phase, and mastering/PQ/DDP tools. Legacy licensed packages also bundled SADiE-manufactured processors and edition-dependent iZotope-for-SADiE effects; CEDAR restoration plug-ins were optional/custom. The free edition removes bundled iZotope and CEDAR support. [C-003, C-005, C-018]

Native device-chain/rack topology, modulation, synths/samplers, instruments, macros, preset format, and authoring SDK are `UNKNOWN`. The evidence supports audio effects/mastering modules, not a general native-device ecosystem. [C-017, C-018]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE:no native product | DOCUMENTED | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | Current free SADiE6 support page says “VST2 only”; legacy editions list VST | Format acceptance documented; host-contract depth remains UNKNOWN | [C-002, C-016, C-017; S-005, S-004] |
| VST3 | NOT_APPLICABLE:no native product | DOCUMENTED:not native | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | Current free SADiE6 says VST3 needs a VST2-to-VST3 wrapper | Wrapper is external; identity/state/bus fidelity and support responsibility UNKNOWN | [C-016, C-017; S-005] |
| AUv2 | NOT_APPLICABLE:no native macOS product | UNKNOWN | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | No official hosting evidence located | Do not infer unsupported solely from silence | [C-016; S-005, S-007] |
| AUv3 | NOT_APPLICABLE:no native macOS/mobile product | UNKNOWN | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | No official hosting evidence located | UNKNOWN | [C-016; S-005, S-007] |
| AAX | NOT_APPLICABLE:no native product | UNKNOWN | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | No official hosting evidence located | UNKNOWN | [C-016; S-005, S-007] |
| CLAP | NOT_APPLICABLE:no native product | UNKNOWN | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | No official hosting evidence located | UNKNOWN | [C-016; S-005, S-007] |
| LV2 | NOT_APPLICABLE:no native product | UNKNOWN | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | No official hosting evidence located | UNKNOWN | [C-016; S-005, S-007] |
| LADSPA | NOT_APPLICABLE:no native product | UNKNOWN | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | No official hosting evidence located | UNKNOWN | [C-016; S-005, S-007] |
| DSSI | NOT_APPLICABLE:no native product | UNKNOWN | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | No official hosting evidence located | UNKNOWN | [C-016; S-005, S-007] |
| JSFX | NOT_APPLICABLE:no native product | UNKNOWN | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | No official hosting evidence located | UNKNOWN | [C-016; S-005, S-007] |
| DirectX/DXi | NOT_APPLICABLE:no native product | UNKNOWN | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | Legacy SADiE5/6 pages document DirectX; current feature page ticks it, but current support says “VST2 only” | Contradictory for free build; DXi instrument behavior never established | [C-016, C-024; S-004, S-005, S-006, S-011] |
| Rack Extension | NOT_APPLICABLE:no native product | UNKNOWN | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | No official hosting evidence located | UNKNOWN | [C-016; S-005, S-007] |
| Product-native/other | NOT_APPLICABLE:no native product | DOCUMENTED | NOT_APPLICABLE:no native product | NOT_APPLICABLE:no product | Current native SADiE processors; legacy custom CEDAR and iZotope-for-SADiE | Free build removes CEDAR/iZotope; exact native extension ABI is UNKNOWN | [C-003, C-018; S-001, S-004, S-006, S-008] |

### 11.2 Discovery, scanning, validation, and recovery

`UNKNOWN` for current and legacy SADiE6: public accessible sources did not specify discovery directories, recursive scanning, startup/manual scan, validation, cache format, duplicate identity, blacklist/quarantine, rescan UX, failed-scan logs, or post-crash recovery. The official manual was located but could not be text-extracted in this environment. A VST support tick proves neither scanning nor successful instantiation. [C-017]

### 11.3 Runtime isolation and compatibility

`UNKNOWN`: no accessible source establishes in-process versus separate-process execution, sandboxing, per-plug-in crash containment, 32/64-bit plug-in bridging, code-signing enforcement, or compatibility modes. SADiE's 32/64-bit **application/hardware** distinction must not be mistaken for plug-in architecture bridging. The recommended VST2-to-VST3 wrapper is external and its runtime boundary is not documented by SADiE. [C-004, C-016, C-017]

### 11.4 Host/plugin processing contract

Legacy pages show VST/DirectX audio effects in mixer/mastering contexts; current guidance establishes VST2 format acceptance. They do not establish instrument support, MIDI/event buses, sidechains, multi-output, dynamic I/O, MPE/MIDI 2.0, sample-accurate plug-in automation, latency/tail reporting, suspend/bypass semantics, or whether NRT processing supports every plug-in. All remain `UNKNOWN`. [C-016, C-017, C-020]

### 11.5 Parameters, automation, state, presets, and project recall

Legacy clip-attached mixer automation is documented, but plug-in parameter identity/range/text mapping is not. Plug-in preset/state serialization, external asset references, missing-plug-in placeholders, wrapper migration, cross-architecture recall, and exchange behavior are `UNKNOWN`. SADiE5 compatibility mode proves a project-save option, not third-party plug-in state fidelity. [C-010, C-012, C-017]

### 11.6 UI, diagnostics, and failure modes

`UNKNOWN`: custom UI embedding/detachment, scaling, headless operation, generic editors, keyboard focus, plug-in error messages, crash attribution, quarantine UI, and missing-plug-in diagnostics were not established. The FAQ's CPU/buffer/DPC troubleshooting is host-level, not plug-in isolation evidence. [C-008, C-017]

## 12. Extensibility and integration

Documented integration boundaries include SCISYS dira! production/playout, optional AAF/OMF and legacy Pro Tools interchange, AES31, CMX/Sony EDL conform/relink, HUI control, SADiE hardware controllers, 9-pin, and Windows-accessible storage/network protocols. [C-005, C-010, C-012, C-014]

No accessible evidence establishes user scripting, macros beyond ordinary commands, public extension/device SDKs, controller-authoring APIs, OSC, remote apps, or a stable programmatic action API. Custom-engineered legacy plug-ins were commercial product integrations, not proof of an open SDK. [C-017, C-018]

## 13. Project format, persistence, interoperability, and collaboration

SADiE 5 documented a Project containing multiple Playlists, Clipstores, and mixers; network-stored projects; concurrent staff working on the same programme; earlier/reconformed Playlists in one Project; DVD backup; and playlist/EDL recovery after a crash. Family material separately documents automatic edit-file backup. [C-009, C-011, C-012]

SADiE6 can save in SADiE5 compatibility mode via “always save projects in SADiE5 format.” The FAQ names WAV, PFM, PFL, and PFR as files that antivirus scanning can affect, but does not define each persistence role. [C-008, C-012]

Legacy interchange includes AES31, optional AAF/OMF, Pro Tools 5 session exchange, CMX/Sony EDL, BWF/WAV/WAVE64/AIFF/AIFC/SDII, and relink by metadata/location/Playlist. Current free feature material confirms AES31, SADiE 5.6 interchange, and auto-conform/relink, but current availability of paid legacy options and 64-bit OMF remains constrained/unclear; 6.1.18 64-bit explicitly excluded OMF. [C-004, C-006, C-012]

Current autosave interval/schema, atomicity, database format, forward compatibility, missing-media/plugin placeholders, archive/collect, version control, cloud collaboration, ADM, MIDI/MusicXML, and DAWproject are `UNKNOWN`. dira! integration is a broadcast workflow, not general cloud collaboration. [C-014, C-017]

## 14. Delivery, live, post-production, and specialized workflows

- **Mastering:** sequence/gaps, fades, EQ/dynamics, external loops, restoration, dither/noise shaping, PQ/ISRC/UPC, DDP image creation and checksum/network delivery. Free SADiE6 retains DDP writing but removes CD read/burn. [C-003, C-013]
- **Broadcast/spoken word:** Speech Editor, Radio Producer lineage, podcasts/audiobooks, craft editing, and SADiE6/dira! centrally managed multi-user/multi-site production-to-playout. [C-005, C-006, C-014]
- **Classical/location:** current positioning includes classical/live recording; legacy LRX2/MTR systems documented high-channel location recording but are discontinued hardware. [C-006, C-015]
- **Post:** legacy file interchange, conform/reconform, picture playback, 9-pin, multitrack/surround edits, Clipstore, and shared Projects. Current feature pages retain AVI/QuickTime ticks and auto-conform, but old 64-bit guidance excludes QuickTime; exact free-build video behavior is `UNKNOWN`. [C-004, C-006, C-012, C-024]
- **Live performance/show control/immersive:** no evidence of a clip-launch/live-performance environment, show-control API, ADM, or modern immersive delivery. `UNKNOWN`. [C-017]

## 15. Performance, reliability, security, and accessibility

Reliability mechanisms publicly named include mirror recording, automatic edit-file backup, SADiE5 playlist/EDL recovery, and operational advice around ASIO buffers, DPC latency, drivers, CPU/plugin load, and antivirus scanning. These are vendor-documented mechanisms, not independent reliability tests. [C-008, C-011, C-012]

Legacy scaling reached high-channel dedicated hardware, while current performance depends on a 64-bit Windows host, interface/driver, session load, and plug-ins. Current recommended minimum is Core i5, 4 GB RAM, and 1280×800 display; no qualified maximum track/plug-in count is published on the accessible current page. [C-002, C-015]

Plug-in sandboxing/crash containment, installer/binary signing beyond a Windows 7 driver-signature support note, update rollback, vulnerability handling, telemetry/privacy, accessibility APIs/screen-reader behavior, keyboard-only coverage, contrast, and localization are `UNKNOWN`. Development/support cessation increases maintenance risk but is not proof of insecurity. [C-019, C-021]

## 16. Licensing, ecosystem, and implementation constraints

The 2025 SADiE6 Sound Suite is free of charge and the current feature page says dongle licensing is unavailable. Legacy licensed SADiE6 used a USB/FlexNet dongle, and SADiE5 custom plug-ins could require licence transfer from DSP hardware to a SADiE6 licence. Exact free-build EULA, source availability, redistribution, enterprise rights, and trademark permissions were not exposed in the reviewed pages; **free of charge must not be read as open source or redistribution permission**. [C-018, C-019]

SADiE's current VST2-only boundary is legally non-transferable as an architecture assumption. Steinberg's official FAQ says VST2 host/plugin binaries may be distributed only by entities that signed the VST2 agreement before October 2018 and that VST2 headers may not be redistributed; it separately identifies the current VST3 SDK as MIT-licensed. This is descriptive evidence, not legal advice. [C-022]

No inference is made that naming VST, DirectX, AAF, OMF, HUI, or other formats grants SDK, trademark, certification, patent, or redistribution rights. A new implementation requires independent counsel and current upstream terms. [C-022]

## 17. Strengths, liabilities, and architecture lessons

**Evidence-backed strengths**

1. Editing is organized around audio objects/clips and multiple purpose-built editors rather than forcing all work through one generic timeline tool. [C-006, C-009]
2. Clip-attached automation and multiple Playlists/mixers within a Project are valuable lineage patterns for reconform/version work. [C-009, C-010, C-012]
3. Broadcast integration and mastering delivery are workflow-complete at the product level: editorial control connects to programme management/playout, while PQ/DDP/checksum delivery connects sequencing to manufacture. [C-013, C-014]
4. The host-native/ASIO-WDM path reduced mandatory dependence on proprietary DSP hardware. [C-007, C-015]

**Liabilities / reference risks**

1. Development and broad support ended; hardware is discontinued and the free edition removes material legacy functions. [C-001, C-003, C-015, C-019]
2. VST2-only current guidance and an external wrapper for VST3 create compatibility, state, support, and licensing risk. [C-016, C-022]
3. DirectX and video statements conflict across current/legacy pages. [C-024]
4. Deep engine, recovery, accessibility, security, and plug-in-host contracts are not publicly evidenced. [C-017, C-021]

Product suitability for existing specialists does not make its inaccessible proprietary architecture a suitable implementation reference.

## 18. Transferable patterns

| Pattern | Problem and minimal clean-room mechanism | Evidence | Prerequisites/tradeoffs/adaptation risk | Disposition |
| --- | --- | --- | --- | --- |
| Purpose-specific editors over shared objects | Keep one underlying clip/region model while exposing Playlist, Trim, Region, multi-point, and speech-oriented views | [C-006, C-009] | Requires stable object identity and undo; risk of divergent editor semantics | CANDIDATE |
| Project as container of alternative timelines/resources | Store multiple timelines, media catalogs, and mixer configurations under one project boundary | [C-009, C-012] | Needs explicit dependency/version model; do not copy SADiE file/UI expression | CANDIDATE |
| Automation follows edited object | Bind automation segments to clip/object identity so moves/reconforms preserve editorial intent | [C-010] | Must define collision, trim, split, merge, and time-domain semantics; SADiE6 continuity unqualified | CONDITIONAL |
| Conform/relink by metadata | Map EDL/reel metadata to media and regenerate multitrack timelines while retaining prior versions | [C-012] | Requires deterministic matching, conflict reports, and reversible transactions | CANDIDATE |
| Redundant capture plus edit metadata backup | Separate mirrored media capture from lightweight automatic edit/project backup | [C-011, C-012] | Needs failure-domain analysis and restore qualification; family claim not free-build-tested | CONDITIONAL |
| Domain-complete delivery model | Represent mastering markers/identifiers and generate verifiable DDP/checksum deliverables | [C-013] | Standards/licensing validation and modern delivery requirements needed | CONDITIONAL |
| Decouple workflow from proprietary I/O | Abstract audio I/O/processing so standard ASIO/WDM operation can replace dedicated DSP hardware | [C-007, C-015] | Cross-platform backend and deterministic latency contract still needed | CANDIDATE |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject VST2 as a new host baseline:** frozen SADiE compatibility does not overcome upstream distribution restrictions or modern format needs. Reopen only if qualified pre-2018 rights and a business requirement are established. [C-022]
- **Reject external VST2-to-VST3 wrapping as the primary VST3 architecture:** SADiE documents the requirement but not identity, bus, state, automation, UI, latency, or crash fidelity. Reopen only after disposable conformance tests. [C-016, C-017]
- **Reject mandatory proprietary DSP coupling:** the hardware line is discontinued and the free product itself moved toward host-native interfaces. [C-007, C-015]
- **CURIOSITY_NO_GO — installer execution:** unsafe/unnecessary for documentary research; requires a later disposable qualification harness.
- **CURIOSITY_NO_GO — repeated PDF extraction:** official manual/release-note PDFs were located but unavailable to the fetcher and local PDF tools were absent; repeated retries had diminishing value.
- **CURIOSITY_NO_GO — plug-in anecdotes:** secondary reports cannot establish proprietary scan/isolation/PDC/state internals.
- **CURIOSITY_NO_GO — exact free installer via email form:** requires a personal-data workflow and would still not prove runtime contracts.
- **CURIOSITY_NO_GO — deeper CD history, corporate history, and discontinued accessories:** low marginal architecture value after delivery, ownership, and hardware boundaries were covered.
- **CURIOSITY_NO_GO — nested researcher:** requested bounded child could not launch because this session was already at subagent depth limit 1.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Evidence and counter-search | Result |
| --- | --- | --- |
| H1: SADiE6 is still actively developed | Current welcome/download pages and dated press release explicitly say development ended | **FALSIFIED** [C-001] |
| H2: the current product still requires proprietary DSP hardware | Main/FAQ/current support document host-native ASIO/WDM; free build excludes PCM/H hardware | **FALSIFIED** [C-002, C-003, C-007] |
| H3: “VST support” means current VST3 hosting | Current support says VST2 only and requires an external wrapper for VST3 | **FALSIFIED** [C-016] |
| H4: DirectX is clearly supported in the free build | Current feature tick conflicts with current “VST2 only” guidance | **UNRESOLVED/UNKNOWN** [C-024] |
| H5: format accepted = scanned = instantiated = full contract | Only format/feature statements were found; scan, runtime, buses, state, UI, and recovery were not | **FALSIFIED as an evidentiary shortcut** [C-017] |
| H6: SADiE5 rich workflow pages prove identical free-SADiE6 behavior | Current pages corroborate only selected editor/interchange features; free removals and 64-bit exclusions show discontinuities | **FALSIFIED as a blanket inference** [C-003, C-004, C-006, C-009] |
| H7: “free” grants source/redistribution rights | No reviewed SADiE EULA/source grant says this | **UNSUPPORTED; treat as UNKNOWN** [C-019] |

Later safe probes should use a disposable Windows VM, licensed/public test plug-ins, synthetic projects, crash fixtures, and explicit authorization. They should separately test discovery, scan, instantiation, real-time/NRT processing, automation, latency, state, missing plug-ins, UI, and crash restoration.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Development ended 2025-03-01; SADiE6 became free 2025-04-24/announced 2025-04-25 | Current family | S-003, S-014 | Direct vendor statements | No exact free build stated |
| C-002 | DOCUMENTED | High | Current free guidance is Windows 7/8/10/11, 64-bit hardware, ASIO/WDM; no native macOS | Free SADiE6 | S-005, S-008, S-009 | Current support plus FAQ/main | Windows 11 comes from current page; old FAQ predates it |
| C-003 | DOCUMENTED | High | Free edition is separate from licensed systems; removes CEDAR, CD read/write, iZotope; retains DDP writing and cautious BB2/BB2J/LRX2 support; excludes PCM/H hardware | Free SADiE6 | S-001, S-003, S-005, S-006 | Repeated current notice | Exact implementation/build unknown |
| C-004 | DOCUMENTED | High | 6.1.18 64-bit installer dated 2020-05-01; old PCI DSP needs 32-bit; 64-bit excludes PCM/H cards, OMF, QuickTime, CEDAR DeNoise | Licensed SADiE6 downloads | S-002 | Versioned vendor download page | Not current free build |
| C-005 | DOCUMENTED | High | Legacy editions were role-specific; Sound Suite was complete; feature matrix varied video/surround/mastering/interchange | Licensed SADiE6 | S-004 | Vendor edition matrix | Some icon-only cells; free edition differs |
| C-006 | DOCUMENTED | Medium-high | Current product documents object-based non-destructive editing, purpose-specific editors, sample accuracy, real-time/NRT processing, edit-while-recording, and specialist workflows | Current/free SADiE6 | S-003, S-006 | Current product pages | Vendor capability claims, not runtime observation |
| C-007 | DOCUMENTED | High | SADiE6 supports proprietary DSP/I/O or host-native processing with selected ASIO/WDM interface | SADiE6 architecture boundary | S-008, S-009, S-013 | Direct architecture/FAQ statements | Scheduler/graph internals absent |
| C-008 | DOCUMENTED | Medium-high | ASIO buffer, CPU/plugin load, AV scanning, and DPC/driver latency can affect start/playback/dropouts; PFM/PFL/PFR/WAV are named operational files | SADiE6 Windows operation | S-008 | Vendor FAQ | File semantics and independent frequency unknown |
| C-009 | DOCUMENTED | High for v5; low for current continuity | Project contains Playlists/Clipstores/mixers; non-destructive clip/region edits, overlaps/crossfades, multitrack trim, 50 undo | SADiE 5 lineage | S-011 | Explicit version-5 page | Must not be generalized wholesale to free SADiE6 |
| C-010 | DOCUMENTED | High for v5 | Mixer supports HUI/hardware, Overwrite/Trim/Auto Return, external inputs, and clip-attached automation | SADiE 5 lineage | S-011 | Explicit mixer section | Current free behavior unqualified |
| C-011 | DOCUMENTED | Medium-high | BWF/WAV/AIFF/network media, broader v5 Clipstore formats, mirror record, automatic edit backup, SAN/shared media | Family/v5 lineage | S-011, S-013 | Vendor family and v5 pages | Generic free-build availability unknown |
| C-012 | DOCUMENTED | Medium-high | AES31, legacy optional AAF/OMF/PT5, EDL conform/relink, SADiE5 save compatibility, and v5 backup/recovery are documented | Mixed current/v5/legacy scope | S-004, S-006, S-008, S-011 | Each feature scoped by page/version | 64-bit OMF excluded; paid options may not exist in free build |
| C-013 | DOCUMENTED | Medium | Mastering lineage includes 32-bit float processing, external loops, fades/restoration/dither, PQ/ISRC/UPC, DDP/checksum delivery | SADiE mastering lineage | S-010 | Detailed vendor application note | SADiE5 imagery; optical-disc features removed in free build |
| C-014 | DOCUMENTED | High | SADiE6/dira! integrated centrally managed, multi-user/site production and playout with craft/assembly/offline workflows | SADiE6 broadcast integration | S-012 | Direct vendor integration description | Present availability/support unknown |
| C-015 | DOCUMENTED | High | SADiE hardware is phased out/discontinued; legacy LRX/PCM/H channel configurations are not current new products | Hardware lineage/current boundary | S-013, S-014, S-015 | Press release and discontinued inventory | Existing enterprise hardware may remain in service |
| C-016 | DOCUMENTED | High | Current free page says VST2 only and VST3 requires external wrapper; legacy pages list VST/DirectX | Current free vs legacy | S-004, S-005, S-006, S-011 | Explicit format statements | Does not prove full host contract |
| C-017 | UNKNOWN | High confidence in evidence gap | Scan/cache/validation, isolation/bridge, buses/events, PDC/tails, state/presets, custom UI, failure recovery, and many engine internals are not established | SADiE6 plug-in host/engine | S-005, S-007, S-017, S-018 | Manual/release notes inaccessible; focused searches rate-limited | A manual-capable reader or dynamic probe could resolve subsets |
| C-018 | DOCUMENTED | Medium-high | Current native processors exist; free edition removes CEDAR/iZotope; legacy custom plug-ins/licensing and dongle existed | Free vs licensed lineage | S-001, S-004, S-006, S-008, S-009 | Vendor product/FAQ pages | Native ABI/preset architecture unknown |
| C-019 | DOCUMENTED + UNKNOWN boundary | High/medium | Free users have no formal support, recent paid support ended Dec 2025, enterprise contracts continue; exact free EULA/redistribution terms unknown | Current licensing/maintenance | S-003, S-005, S-014 | Direct support/release statements; no EULA found | Free price is not a source-code or redistribution grant |
| C-020 | UNKNOWN | Medium-high | MIDI sequencing, notation, expression, MIDI 2.0 and instrument hosting were not established | Current/legacy SADiE | S-004, S-005, S-006, S-007 | Broad feature/resource review found no decisive evidence | Absence is not proof of unsupported behavior |
| C-021 | UNKNOWN | High | Accessibility, telemetry/privacy, signing/notarization policy, plug-in trust, security updates, and rollback are not established | Current free SADiE6 | S-005, S-008, S-014 | Current support/FAQ reviewed | Driver-signature anecdote is not a security architecture |
| C-022 | DOCUMENTED | High | Steinberg restricts VST2 distribution to pre-Oct-2018 licensees and VST2 header redistribution; current VST3 SDK is MIT | Format-owner licensing | S-016 | Official upstream FAQ | Not legal advice; SADiE's own historic licence not reviewed |
| C-023 | UNKNOWN | High | Exact current free SADiE6 build number is not stated on accessible current pages | Free SADiE6 | S-003, S-005, S-014 | Download is behind form labelled “latest” | Installer retrieval/execution intentionally not performed |
| C-024 | UNKNOWN due contradiction | High | Free-build DirectX and QuickTime behavior cannot be resolved from conflicting current/legacy pages | Free SADiE6 | S-002, S-005, S-006 | “VST2 only”/64-bit exclusions conflict with feature ticks | Versioned runtime qualification needed |

## 22. Source ledger and adaptive bibliography

All sources accessed 2026-08-29. Vendor statements document vendor claims, not independent measurements.

- **S-001 — “SADiE 6 Turnkey Solutions,” SADiE/Audio Squadron.** https://sadie.com/products/products_turnkey.php — official current/legacy product notice; scope: free vs licensed SADiE6. Relevant passage: prominent existing-user notice and hardware/feature removals. Supports C-003, C-018. Limitation: turnkey body is placeholder. Selected because the notice directly scopes free-edition exclusions.
- **S-002 — “SADiE 6 Software Downloads,” SADiE.** https://www.sadie.com/support/download_v6.php — official versioned download page; scope: licensed 6.0/6.1 through 6.1.18. Sections: 6.1 downloads, 32/64-bit distinction, dongle. Supports C-004, C-024. Limitation: predates free edition. Preferred over third-party download sites because it provides exact vendor dates and exclusions.
- **S-003 — “Welcome to SADiE,” Prism Sound.** https://www.prismsound.io/products/welcome-to-sadie/ — current official product page; scope: free Sound Suite/status. Passage: “active development ... has come to a close.” Supports C-001, C-003, C-006, C-019. Limitation: marketing summary/no build. Selected as current canonical status page.
- **S-004 — “SADiE 6 Features,” SADiE.** https://www.sadie.com/products/series6/features.php — official legacy edition matrix; scope: licensed role editions. Supports C-005, C-012, C-016, C-018, C-020. Limitation: icon table and current free notice coexist; old inclusions do not override free removals. Selected for edition/format/interchange boundaries.
- **S-005 — “SADiE Downloads & Support,” Prism Sound.** https://www.prismsound.io/products/sadie-downloads-support/ — current official support/system page; scope: free SADiE6. Sections: support availability, system requirements, audio/plugin support. Supports C-002, C-003, C-016, C-017, C-019, C-021, C-023, C-024. Limitation: download form hides build. Selected because it uniquely states VST2-only/VST3-wrapper and Windows 11.
- **S-006 — “Understanding SADiE: Uses, Users, and Unique Strengths,” Prism Sound.** https://www.prismsound.io/products/understanding-sadie-uses-users-and-unique-strengths/ — current official workflow/feature page. Supports C-003, C-006, C-012, C-016, C-018, C-024. Limitation: feature ticks conflict with more specific support/removal notices. Selected for current user/workflow model.
- **S-007 — “SADiE 6 Downloads and Resources,” SADiE.** https://www.sadie.com/products/series6/resources.php — official resource index. Supports C-016, C-017, C-020 by establishing available manuals/release notes and the search boundary. Limitation: index, not manual content. Selected to trace inaccessible documents to primary origins.
- **S-008 — “SADiE 6 FAQs,” SADiE.** https://www.sadie.com/products/series6/faq.php — official support FAQ; scope varies by FAQ date/build. Sections: hardware, plug-in licences, compatibility save, Windows/Mac, playback, installation, dropouts. Supports C-002, C-007, C-008, C-012, C-018, C-021. Limitation: some answers are historically dated and forward-looking. Preferred for operational details absent from marketing pages.
- **S-009 — “SADiE 6 Software,” SADiE.** https://www.sadie.com/products/series6/main.php — official overview/architecture page; licensed 6.1 lineage plus current notice. Supports C-002, C-007, C-018. Limitation: high-level architecture only. Selected for explicit proprietary-DSP versus host-native boundary.
- **S-010 — “SADiE in CD mastering,” SADiE.** https://www.sadie.com/applications/mastering.php — official application note; SADiE mastering lineage with SADiE5 images. Supports C-013. Limitation: historical optical-media material and vendor sound-quality claims were not treated as current/independent evidence. Selected for detailed processing/delivery model.
- **S-011 — “SADiE in post production,” SADiE.** https://www.sadie.com/applications/post_production.php — official application note explicitly for SADiE Version 5. Supports C-009–C-012, C-016. Limitation: not proof of free SADiE6 parity. Selected because it is the richest accessible primary description of Project/Playlist/Clipstore/mixer/automation/recovery lineage.
- **S-012 — “SADiE with SCISYS dira! for programme production and playout,” SADiE.** https://www.sadie.com/applications/sadie_vcs.php — official integration page; SADiE6 broadcast scope. Supports C-014. Limitation: current commercial availability unknown. Selected for end-to-end broadcast architecture.
- **S-013 — “Products Overview,” SADiE.** https://www.sadie.com/products/products_home.php — official family overview; mixed legacy/current notice. Supports C-007, C-011, C-015. Limitation: legacy hardware descriptions. Selected for family media, mirroring, backup, and channel/hardware boundaries.
- **S-014 — “SADiE6 Now Free for All,” Prism Sound, 2025-04-25.** https://www.prismsound.io/news/sadie6-now-free-for-all/ — official dated release/status announcement. Supports C-001, C-015, C-019. Limitation: no technical build. Selected to pin maintenance chronology.
- **S-015 — “Discontinued Products,” SADiE.** https://www.sadie.com/products/products_discontinued.php — official discontinued inventory. Supports C-015. Limitation: linked old pages may look current. Selected because the index explicitly states items are discontinued/not available new.
- **S-016 — “Licensing,” VST 3 Developer Portal, Steinberg.** https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html — official format-owner FAQ; current VST3 and specific VST2 sections. Supports C-022. Limitation: not SADiE licence evidence or legal advice. Selected over commentary because it is the upstream licensing origin.
- **S-017 — “SADiE 6 User Manual,” SADiE (PDF).** https://resources.prismsound.com/sd/SADiE6_User_Manual.pdf — official manual, 15.5 MiB. **INACCESSIBLE CONTENT:** fetcher rejected PDF and local `pdftotext`/PyMuPDF were unavailable. Supports only the documented unknown/probe trail in C-017. Selected as the most likely primary source; not repeatedly retried.
- **S-018 — “SADiE 6.1.18 Release Notes,” SADiE (PDF).** https://resources.prismsound.com/sd/SADiE6.1.18_Release_Notes.pdf — official versioned notes. **INACCESSIBLE CONTENT** for the same tooling reasons. Supports the negative access trail in C-017/C-023, not release-note facts. Selected over secondary summaries.
- **Unnumbered insufficient-access result — `vst3sdk/LICENSE.txt`, Steinberg GitHub.** https://github.com/steinbergmedia/vst3sdk/blob/master/LICENSE.txt — official repository page. Fetch exposed metadata but not the license body; no material claim relies on it. Retained as an insufficient-access result; S-016 was preferable and readable.

**Source count:** 16 usable sources; 3 retained inaccessible/insufficient sources; 19 total ledger entries. All 16 usable sources are primary vendor/format-owner material. No secondary source was needed for a material conclusion.

## 23. Unknowns and next discriminating probes

| Unknown | Attempts/blocker and impact | Safest next probe | Required access/fixture; owner |
| --- | --- | --- | --- |
| Exact free build and versioned changes | Current pages say “latest”; form hides build. Prevents exact qualification. | Obtain installer metadata/release notes without execution from vendor or authorized lab | Disposable download identity and vendor terms; unassigned |
| Plug-in scan/cache/blacklist/rescan | Official manual located but PDF unreadable; searches rate-limited. Blocks host lifecycle comparison. | Search manual with a PDF-capable reader, then verify in disposable VM | PDF reader; authorized test VM; unassigned |
| Isolation/crash containment/architecture bridge | No public passage. Blocks reliability/security comparison. | Crash and 32/64 mismatch fixtures with benign test VST2s | Disposable Windows VM and test plug-ins; unassigned |
| Processing contract/PDC/tails/buses/events | Format statements only. Blocks interoperability assessment. | Matrix of synthetic effect/instrument/sidechain/multi-output/latency/tail plug-ins in RT and NRT | Test suite and loopback; unassigned |
| Parameter/state/preset/missing plug-in recall | No accessible state contract. Blocks durable-project assessment. | Save/reopen, move plug-in, remove/reinstall, wrapper migration, and version-skew tests | Disposable projects/plugins; unassigned |
| Plug-in UI/scaling/headless/failure UX | No evidence. Blocks UI/accessibility/recovery assessment. | DPI/multi-monitor/custom-editor/headless/crash tests | Windows VM at multiple scale factors; unassigned |
| DirectX and QuickTime in free build | Current/legacy pages conflict. Affects matrix/video workflow. | Versioned free-build smoke tests plus vendor clarification | Free build and safe DX effect/video fixtures; unassigned |
| Current Project schema/autosave/atomicity | v5 lineage and automatic backup only. Blocks recovery architecture comparison. | Induced termination during save/record and restore inspection without reverse engineering | Disposable media/project; unassigned |
| MIDI/notation/instrument scope | Accessible sources silent. Affects DAW breadth assessment. | Manual search, UI inventory, then benign MIDI loopback | Manual reader/VM/MIDI fixture; unassigned |
| Accessibility/security/privacy/update policy | No public current detail; development ended. Affects procurement and trust. | Vendor questionnaire plus accessibility tree and signed-file/update-channel inspection | Vendor response and disposable system; unassigned |
| Free-edition EULA/redistribution rights | No reviewed terms attached to accessible form. Affects deployment, not use-price. | Obtain and review exact EULA with counsel | Legal review; unassigned |

## 24. Curiosity pass and stop decision

Candidate scores use 0–4 for **decision relevance / expected value / novelty / cost** (lower cost is better):

1. Plug-in lifecycle/runtime contract: **4/4/4/2**, pursued. Nested child was blocked by depth limit; parent searches hit HTTP 429; manual was inaccessible. Result: consequential `UNKNOWN`, not an invented contract.
2. Upstream VST2 licensing: **3/3/2/1**, pursued after the first thread saturated. Result: material rejection of VST2 as a new clean-room baseline. [C-022]
3. Exact free installer/build: **2/2/2/3 — CURIOSITY_NO_GO**; personal-data form and installer access would not prove runtime behavior.
4. Secondary plug-in anecdotes/reviews: **2/2/2/3 — CURIOSITY_NO_GO**; weak for proprietary internals after primary exhaustion.
5. Deeper CD/corporate/accessory history: **1/1/1/1 — CURIOSITY_NO_GO**; would not change architecture conclusions.
6. Product execution in this wave: **2/4/4/4 — CURIOSITY_NO_GO**; outside documentary authority and requires disposable qualification fixtures.

**Stop decision:** stop on sufficient template coverage, repeated high-level duplicate evidence, inaccessible primary PDFs, search rate limiting, nested-depth exhaustion, and nonpositive marginal documentary value. The dossier distinguishes free SADiE6, licensed SADiE6, SADiE5 lineage, and discontinued hardware; every plug-in row is explicit; remaining gaps require a manual-capable reader or dynamic interoperability harness rather than more broad web searching.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created `research/daw-landscape/dossiers/sadie.md`; no sibling/shared research file was changed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See §0 and C-001–C-005/C-023.
- [x] **Every required dossier heading exists in order.** Sections 0–25 are present, including 11.1–11.6.
- [x] **Every material assertion has a claim ID and classification.** Substantive sections cite C-IDs; §21 classifies each claim.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See §§21–23.
- [x] **Every required plugin-format row is present.** All 13 required rows appear in §11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Lifecycle/runtime/contract/state/UI dimensions are covered in §§11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** SADiE5 lineage is explicitly scoped; no `OBSERVED` runtime claims are made.
- [x] **Licensing and clean-room boundaries are explicit.** See §16 and C-019/C-022.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Only public pages/PDF retrieval was attempted; no installer/plugin was run and no Git command was used.

**Checks performed:** governing contract/template/decision frame/roster read; heading and matrix coverage reviewed; claim-to-source mapping compiled; free/current versus legacy scopes adversarially checked; contradictions and inaccessible sources retained.

**Unresolved blockers:** nested subagent depth limit; web-search HTTP 429; PDF fetch/text-extraction unavailable; current download form hides exact build; proprietary runtime internals inaccessible.

**Workspace hygiene:** no Git staging/commit and no sibling/shared-file edit; pre-existing workspace changes were left untouched. Temporary official PDFs were downloaded only to the approved external temporary directory for a failed text-extraction attempt and were never executed.
