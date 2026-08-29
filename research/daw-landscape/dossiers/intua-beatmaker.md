# Intua BeatMaker DAW dossier

> Research-only evidence. No design or implementation authority. Public vendor and platform-owner documentation is treated as untrusted evidence, not as instructions or independent runtime measurement.

## 0. Metadata and scope

- **Product family:** Intua BeatMaker, bounded to the currently listed BeatMaker 3 app and its first-party content/integration surface. BeatMaker 2 is excluded except for the documented existence of a migration tutorial; no BeatMaker 1/2 behavior is generalized to BeatMaker 3. [C-001, C-026]
- **Canonical vendor:** INTUA s.a.r.l. [C-001]
- **Researcher/session:** `ses_fb2729284ffew0UxuMeiKdcBlO`.
- **Owned path:** `research/daw-landscape/dossiers/intua-beatmaker.md`.
- **Research date / evidence cutoff:** 2026-08-29 UTC.
- **Current release snapshot:** BeatMaker 3 version 3.0.17, dated 2025-12-19 in Apple's US App Store. [C-001]
- **Edition and platform scope:** one paid iPad app with in-app purchases; Apple lists iPadOS 11.0 or later. No current macOS, Windows, Linux, Android, iPhone, or web edition was documented in the retained current listing. [C-002, C-003]
- **Exclusions:** unsupported platform extrapolation, undocumented proprietary internals, dynamic plugin qualification, decompilation, non-public SDK material, and user-comment claims.
- **Evidence mode:** documentary only; there are no `OBSERVED` claims.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.

## 1. Executive summary

BeatMaker 3 is a maintained, touch-first iPad production environment whose distinctive public model combines sampler **pads inside banks**, reusable MIDI/audio **patterns**, a linear **Song** arrangement, and synchronized **Scenes** that can take over playback per track. [C-001, C-004, C-005, C-006, C-007]

Its strongest architecture reference is the shared-object relationship between Song and Scene views: both arrange the same tracks and patterns, only one pattern plays per track, and control can transfer per track rather than globally. This is documented behavior, while the proposed architectural lesson is an inference. [C-007, C-033]

The current plugin headline is **AUv3 hosting on iPadOS**, triangulated by Intua's host instructions and Apple's 3.0.17 release note mentioning AUv3 stability work. Intua also documents IAA and Audiobus integrations. Installed compatible targets are listed automatically; Audio Unit UI is shown with BeatMaker; effects and pad/layer parameters are automatable; and Audio Unit parameters/presets are saved in sessions and banks. IAA/Audiobus application state instead requires manual external save/recall. [C-018, C-019, C-020, C-021, C-022, C-023]

Confidence is **high** for current identity and the visible composition model, **medium** for currently functioning IAA/Audiobus behavior because its detailed page predates 3.0.17, and **low/unknown** for plugin isolation, multi-output, sidechain, latency/tails, sample-accurate automation, missing-plugin recovery, dynamic I/O, project schema, and real-time engine internals. [C-024, C-027, C-035]

**Recommendation:** adapt the dual linear/live arrangement and explicit per-track takeover concept only as a clean-room candidate; prototype host-state completeness, latency, multi-bus behavior, and failure recovery independently rather than treating the format name “AUv3” as a complete host contract. [C-033, C-034]

## 2. Product identity, history, and market position

- **DOCUMENTED — C-001:** Apple lists BeatMaker 3 by INTUA as version 3.0.17 released 2025-12-19; the release note names sample-crossfade, malformed-MIDI-file import, AUv3-stability, and general stability fixes. This is evidence of maintenance through that date, not a promise of future maintenance. [S-002]
- **DOCUMENTED — C-002:** the current Apple record is an iPad app requiring iPadOS 11.0+. Intua's older product copy still says an iPhone version is “coming soon”; no current iPhone edition was found, so that sentence is treated as stale intent rather than availability. [S-001, S-002]
- **DOCUMENTED — C-003:** Apple lists a US price of $24.99 plus in-app purchases; Intua presents the product for beat production, sampling, live performance, sequencing, mixing, and export. Price is storefront- and date-specific. [S-001, S-002]
- **INFERENCE — C-031:** the combination of pad performance, deep sampling, Scenes, and a conventional timeline positions BeatMaker 3 between groovebox/sampler and mobile DAW workflows. Alternative interpretation: it is a DAW with a pad-centric input surface rather than a separate groovebox category. [S-001, S-003, S-006]

## 3. Workflow and conceptual model

- **DOCUMENTED — C-004:** a session is the project/song boundary and contains tempo, banks, patterns, sequences, effects, and references to audio samples. Four main views cover Performance, Editor, Sequencer, and Mixer. [S-003]
- **DOCUMENTED — C-005:** a session can contain up to 128 banks, organized as 16 groups of eight; each bank can contain up to 128 pad instruments and is controlled by a corresponding track. A pad may contain samples and/or control an external Audio Unit/application. [S-003, S-007]
- **DOCUMENTED — C-006:** a pattern groups notes and automated parameters and is reusable on the linear Song timeline. Removing a timeline occurrence does not delete the underlying pattern. [S-003, S-006]
- **DOCUMENTED — C-007:** Song and Scene use the same tracks and patterns. A scene has at most one pattern per track; scene/pattern launch is synchronized to a configurable division; only one pattern per track plays at once; and each track can be taken over from Song, Scene, a working pattern, or stop behavior. A scene can be pasted into Song. [S-006]
- **DOCUMENTED — C-008:** bank, audio, AUX, and output tracks participate in sequencing. Audio files can be dropped onto audio-track timelines or scene slots; audio patterns expose waveforms and live stretch, while MIDI patterns expose notes and MIDI parameters. [S-006]

## 4. Publicly documented architecture

- **DOCUMENTED — C-035:** public documentation establishes user-visible sessions, tracks, patterns, routing, plugin insertion, and persistence behavior, but does not state process, class, thread, scheduler, database, or serialization boundaries. [S-001, S-003, S-006, S-007]
- **UNKNOWN — C-009:** proprietary engine modules, graph representation, render-thread topology, service boundaries, storage schema, and crash-recovery architecture remain unknown. The official product page, current store record, HTML manual index, Quickstart, Sequencer, and plugin-control article were checked; none discloses these internals. A plausible hypothesis is an iOS-native in-app graph, but an alternative could include vendor-specific helper/services, so no architecture claim is made. [S-001–S-007]

## 5. Audio engine

- **DOCUMENTED — C-010:** Intua advertises simultaneous multitrack audio recording, USB-interface input/output routing, disk streaming for samples, internal resampling, and ZPlane Elastique live time-stretch/pitch-shift. Song export and separated stems are documented. [S-001]
- **DOCUMENTED — C-012:** the product page says each track and pad has a channel with unlimited effects and “up to 8 sends”; its detailed specification says four sends for instrument/audio tracks; the Sequencer manual exposes eight send parameters to automation. These version-unclear vendor statements conflict, so the exact current send count is not resolved. [S-001, S-006]
- **UNKNOWN — C-011:** supported sample-rate/bit-depth matrix, internal precision, buffer constraints, multicore scheduling, plugin delay compensation, tail handling, offline-versus-real-time render equivalence, oversampling, dropout policy, freeze, and engine diagnostics are not established by retained sources. Impact: these omissions prevent using BeatMaker 3 as evidence for a production render engine contract. [S-001, S-006]

## 6. Tracks, timeline, clips, and editing

- **DOCUMENTED — C-006:** Song is a vertical-track, horizontal-time sequencer with move, resize, split, repeat, duplicate, merge, loop, grid quantization, and multi-selection operations on pattern occurrences. [S-006]
- **DOCUMENTED — C-008:** tracks include Banks, Audio, and AUX; audio files can become timeline or Scene content, and audio patterns can open the sample editor/live stretch path. [S-006]
- **DOCUMENTED — C-013:** the sample editor offers trim, cut/copy/paste, normalize, silence, reverse, fades/crossfade, loop points, tempo/signature editing, undo/redo, recording, time stretch, and pitch shift. [S-001]
- **UNKNOWN — C-027:** takes/lanes/comping, ripple editing, clip slip semantics, grouped editing, immutable source-media rules, edit-decision persistence, and complete history/version behavior were not documented in the retained pages. [S-001, S-006]

## 7. MIDI, sequencing, notation, and expression

- **DOCUMENTED — C-014:** BeatMaker 3 documents CoreMIDI, virtual MIDI, MIDI-file import, class-compliant USB MIDI controllers, Ableton Link, piano-roll note editing, recording quantize/overdub/partial undo, pitch bend, modulation, velocity editing, and MIDI control of compatible hosted targets. [S-001, S-002, S-006, S-007]
- **DOCUMENTED — C-007:** Scene launch and pattern switching are quantized; per-track takeover allows linear and live sequencing to coexist. [S-006]
- **UNKNOWN — C-015:** MPE/per-note expression, MIDI 2.0/UMP, SysEx, score/notation, MTC transmit/receive, sample-accurate MIDI delivery, chase behavior, and timestamp/jitter guarantees are not established. The tutorial index names a MIDI Audio Units article but its title alone is insufficient to claim that contract. [S-005]

## 8. Routing, mixer, automation, and control

- **DOCUMENTED — C-012:** every track/pad is documented as having a mixer channel; bank/audio/AUX/main tracks are visible in the sequencer; track routing, USB multichannel I/O, effects, and sends are documented, subject to the unresolved four-versus-eight-send contradiction. [S-001, S-003, S-006]
- **DOCUMENTED — C-022:** track automation can address volume, pan, eight send parameters, loaded-effect control parameters, and active pad/layer parameters. Automation can be drawn/edited on tracks or within MIDI/audio patterns; drawing follows grid quantization. [S-006]
- **DOCUMENTED — C-017:** performance macros and “smart binding”/CoreMIDI controller mapping are vendor-documented, and the manual index contains dedicated external-MIDI and controller-routing pages. Exact binding persistence and feedback behavior were not retrieved. [S-001, S-004]
- **UNKNOWN — C-024:** sidechain buses, feedback-routing policy, surround/immersive layouts, VCA/folder semantics, OSC/remote API, automation interpolation, write modes, and sample accuracy are not established. [S-001, S-006]

## 9. Recording, comping, and media handling

- **DOCUMENTED — C-010:** simultaneous audio-track recording, input gain/noise gate, microphone/instrument sample recording, USB class-compliant audio interfaces, and disk streaming are documented. [S-001]
- **DOCUMENTED — C-013:** looped pattern recording supports pre-roll, quantize, overdub, note erase, and take/partial undo; audio editing and sample manipulation are integrated. [S-001, S-003]
- **DOCUMENTED — C-026:** Intua documents opening audio files and ZIP archives from other apps, Dropbox, AirDrop, iTunes USB File Sharing, Files.app/computer backup articles, Music Library import, MIDI import, and stem export. Exact supported audio codecs/bit depths are not stated in the retained passages. [S-001, S-005]
- **UNKNOWN — C-036:** punch recording, take-lane comping, broadcast metadata, media relinking UX, proxy/conform workflows, video media, and precise codec/container support remain unknown. [S-001, S-005]

## 10. Instruments, effects, content, and native devices

- **DOCUMENTED — C-016:** the native instrument model includes a drum machine, 128-key keyboard sampler, multi-sample keygroups, velocity layers, up to 32 voices, pad/layer routing, one-shot/hold/loop triggers, envelopes, filters, two keyboard-sampler LFOs, legato/glide, exclusive groups, slicing/chopping, and per-pad pitch/reverse/autoscaling controls. [S-001]
- **DOCUMENTED — C-017:** Intua lists 14 included effects, unlimited effect slots per tracks/pads, track/pattern automation, macros, presets, and first-party/in-app sound content. “Unlimited” is a vendor functional claim subject to device resources, not a measured scaling guarantee. [S-001, S-006]
- **UNKNOWN — C-027:** native preset/package schema, macro modulation rate, modulation graph topology, content integrity/versioning, and missing-content recovery are not public in retained evidence. [S-001]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` desktop cells mean no BeatMaker 3 edition was documented for that OS; they do **not** characterize the format itself. `UNKNOWN` mobile cells mean the reviewed official material did not establish support; absence from the manual is not treated as proof of rejection. [C-002, C-025]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN | BM3 3.0.17; official pages name AUv3/IAA/Audiobus, not VST2 | No negative qualification performed | C-002, C-025; S-001, S-002, S-007 |
| VST3 | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN | Same | No negative qualification performed | C-002, C-025; S-001, S-002, S-007 |
| AUv2 | NOT_APPLICABLE:no documented macOS edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN | Official evidence specifically says AUv3 | Do not generalize AUv3 to AUv2 | C-002, C-025; S-001, S-002 |
| AUv3 | NOT_APPLICABLE:no documented macOS edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | DOCUMENTED:iPadOS | 3.0.17 release note names AUv3 stability; Intua documents loading/control | Instruments/effects documented; deep contract partly unknown | C-018, C-020–C-024; S-001, S-002, S-006, S-007 |
| AAX | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN | No named evidence | No negative qualification performed | C-002, C-025 |
| CLAP | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN | No named evidence | No negative qualification performed | C-002, C-025 |
| LV2 | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN | No named evidence | No negative qualification performed | C-002, C-025 |
| LADSPA | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN | No named evidence | No negative qualification performed | C-002, C-025 |
| DSSI | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN | No named evidence | No negative qualification performed | C-002, C-025 |
| JSFX | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN | No named evidence | No negative qualification performed | C-002, C-025 |
| DirectX/DXi | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN | No named evidence | No negative qualification performed | C-002, C-025 |
| Rack Extension | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | UNKNOWN | No named evidence | No negative qualification performed | C-002, C-025 |
| Product-native/other | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | NOT_APPLICABLE:no documented edition | DOCUMENTED:iPadOS | IAA, Audiobus 3, and Intua native effects/content are named | IAA/Audiobus are app-routing integrations, not evidence of desktop plugin formats | C-017, C-019; S-001, S-007 |

### 11.2 Discovery, scanning, validation, and recovery

- **DOCUMENTED — C-020:** the pad Plugin tab is automatically populated with compatible installed plugins/apps by selected type; targets can also be dragged from the Browser's Plugins page onto a pad. This proves user-visible enumeration, not custom filesystem scanning. [S-007]
- **UNKNOWN — C-024:** discovery paths, Audio Unit registration mechanics, scan timing, validation, cache, duplicate identity, blacklist/quarantine, signing checks, rescan UX, and failure diagnostics are not described. [S-007]

### 11.3 Runtime isolation and compatibility

- **DOCUMENTED — C-021:** each pad can control an Audio Unit or IAA/Audiobus app; BeatMaker establishes audio and MIDI connections, and compatible targets accepting MIDI can be played from its keyboard/performance view. [S-007]
- **UNKNOWN — C-024:** in-process versus extension/helper process placement, sandbox boundaries, crash containment, architecture bridging, resource limits, compatibility modes, suspension, and recovery after plugin failure are not established. No inference is made from generic AUv3 platform architecture to BeatMaker's runtime policy. [S-007]

### 11.4 Host/plugin processing contract

- **DOCUMENTED — C-018:** Intua documents AUv3 instruments and effects; its product specification places external AUv3/IAA effects in track/pad effect chains. [S-001, S-007]
- **DOCUMENTED — C-021:** basic audio and conditional MIDI-input connectivity is documented. [S-007]
- **UNKNOWN — C-024:** audio bus counts/layouts, AUv3 multi-output, effect sidechain, MIDI output, MIDI-processing AUs beyond the unexamined tutorial title, MPE, MIDI 2.0, parameter-event timing, offline safety, dynamic I/O, latency/tail reporting, bypass/suspend semantics, and sample-accurate automation remain unknown. [S-005, S-007]

### 11.5 Parameters, automation, state, presets, and project recall

- **DOCUMENTED — C-022:** loaded effect parameters appear in the automation selector and may be recorded/drawn/edited; the editor displays the selected parameter's value range. This does not establish stable parameter IDs, units/text, gesture semantics, or sample accuracy. [S-006]
- **DOCUMENTED — C-023:** Audio Unit parameters and presets are automatically saved in BeatMaker sessions and banks. IAA/Audiobus apps manage their own configuration, which users must save and recall manually. [S-007]
- **UNKNOWN — C-024:** opaque/full state serialization, factory/user preset identity, referenced assets, missing-plugin placeholders, migration across plugin versions, state corruption recovery, and exact bank-versus-session precedence are not documented. [S-007]

### 11.6 UI, diagnostics, and failure modes

- **DOCUMENTED — C-021:** Audio Unit UI shares the screen with BeatMaker; IAA/Audiobus targets behave as separate apps reached through an icon. [S-007]
- **DOCUMENTED — C-018:** 3.0.17's release note reports “various stability improvements with AUv3 plugins,” documenting maintenance attention but neither the prior failures nor a containment guarantee. [S-002]
- **UNKNOWN — C-024:** detachable UI, resizing/scaling, keyboard/focus/accessibility behavior, headless operation, per-plugin diagnostics, crash reports, safe mode, replacement/remapping, and missing-plugin UI are not established. [S-002, S-007]

## 12. Extensibility and integration

- **DOCUMENTED — C-014:** public integration surfaces include CoreMIDI/virtual MIDI, class-compliant controllers, Ableton Link, USB audio, AUv3, IAA, Audiobus 3, iOS file-sharing surfaces, and audio/MIDI exchange with other environments. [S-001, S-004, S-005]
- **UNKNOWN — C-028:** no retained official source documents a public scripting language, command/action API, native-device SDK, plugin-author SDK, OSC API, public project schema, or third-party control-surface extension API. Absence from these pages is not proof none exists; a vendor confirmation would discriminate. [S-001, S-004, S-005]

## 13. Project format, persistence, interoperability, and collaboration

- **DOCUMENTED — C-004:** the session boundary stores composition state and references to audio samples; banks are separately loadable/savable according to the official tutorial index. [S-003, S-005]
- **DOCUMENTED — C-023:** Audio Unit parameters/presets are saved in sessions and banks, while IAA/Audiobus app configuration is external and manually recalled. [S-007]
- **DOCUMENTED — C-026:** MIDI import, audio/ZIP opening, Music Library import, Dropbox, AirDrop, iTunes USB File Sharing, Files.app and computer backup workflows, and stem/audio export are publicly listed. The tutorial index also names BeatMaker 2 project/preset import. [S-001, S-005]
- **UNKNOWN — C-027:** project container/schema, embedded-versus-referenced asset rules beyond the Quickstart's word “references,” collect/archive behavior, autosave, crash recovery, atomic save, migrations, backward/forward compatibility, missing-plugin/sample placeholders, AAF/OMF/ADM/MusicXML/DAWproject, cloud collaboration, and version control remain unknown. [S-003, S-005, S-007]

## 14. Delivery, live, post-production, and specialized workflows

- **DOCUMENTED — C-007:** quantized Scene/pattern launch, per-track takeover, and Song coexistence form the documented live-performance path. [S-006]
- **DOCUMENTED — C-010:** full mixes and separated stems can be exported for reuse/remastering in another studio environment. [S-001]
- **UNKNOWN — C-011:** batch export, render normalization/dither, loudness targets, DDP, video/timecode delivery, ADR, surround/immersive/ADM, and show-control guarantees are not documented. The transport may display SMPTE-format time, but display alone does not prove post-production timecode synchronization. [S-003]

## 15. Performance, reliability, security, and accessibility

- **DOCUMENTED — C-001:** 3.0.17 names AUv3, malformed-MIDI import, sample-crossfade, and general stability work. [S-002]
- **DOCUMENTED — C-029:** Apple's listing says usage and diagnostic data may be collected without linking it to identity; the developer has not declared supported accessibility features in Apple's accessibility field. These are developer/store declarations, not an independent privacy or accessibility audit. [S-002]
- **UNKNOWN — C-011:** track/voice/plugin scaling under load, CPU/memory controls, thermal behavior, dropouts, recovery, rollback, telemetry details, signing/notarization enforcement, plugin trust boundaries, localization quality, and tested-device limits for 3.0.17 remain unknown. [S-001, S-002]

## 16. Licensing, ecosystem, and implementation constraints

- **DOCUMENTED — C-003:** BeatMaker 3 is commercially distributed through Apple's App Store with in-app purchases; the listing identifies INTUA as seller and copyright holder. [S-002]
- **DOCUMENTED — C-030:** the current store listing identifies INTUA as seller and copyright holder. This research names products/formats descriptively only and grants no implementation rights. [S-002]
- **UNKNOWN — C-037:** the product EULA's implementation-relevant clauses, AUv3/IAA/Audiobus trademark or SDK obligations, content-pack licenses, source/SDK grants, and redistribution/certification terms were not analyzed. A separate legal review is required; this dossier is not legal advice. [S-001, S-002]

## 17. Strengths, liabilities, and architecture lessons

- **INFERENCE — C-031 (strength):** bank/pad immediacy plus reusable patterns and a conventional arrangement offers a short path from performance to complete song without duplicating the composition model. Assumption: documented shared objects behave consistently in current 3.0.17; alternative: the model may create hidden mode complexity in practice. [C-004–C-008]
- **INFERENCE — C-033 (strength):** per-track Song/Scene takeover is a valuable architecture pattern because live improvisation need not replace the whole linear transport. Prerequisite: ownership and quantized transition states must be explicit. [C-007]
- **INFERENCE — C-032 (liability):** AU state is host-persisted but IAA/Audiobus state is external/manual, creating heterogeneous recall durability. Alternative: disciplined external preset management may be acceptable for live workflows. [C-023]
- **INFERENCE — C-034 (liability):** an iPad-only product and a host contract documented mainly at UI level make BeatMaker 3 a weak direct reference for cross-platform plugin execution, diagnostics, and project migration. [C-002, C-024, C-027]

## 18. Transferable patterns

| Pattern | Problem / minimal mechanism | Evidence | Prerequisites and tradeoffs | Disposition |
| --- | --- | --- | --- | --- |
| Shared Song/Scene objects | Arrange one set of tracks/patterns in linear and scene matrices; expose explicit per-track playback owner/takeover | C-006, C-007, C-033 | Quantized transitions, visible ownership, deterministic stop/play semantics; mode complexity risk | CANDIDATE |
| Hierarchical sampler surface | Session → bank/track → pad/instrument → layers, with pad-local sound shaping/routing | C-004, C-005, C-016 | Scalable navigation and stable identities; large hierarchy can hide state | CANDIDATE |
| Unified automation selector | Surface mixer, send, effect, pad, and layer parameters through one automation chooser/editor | C-022 | Stable parameter IDs/ranges and migration are required but undocumented here | CONDITIONAL |
| Explicit external-state boundary | Mark which hosted targets are saved by the host and which require external recall | C-023, C-032 | Must add missing-dependency diagnostics and transactional recall for a robust DAW | CONDITIONAL |
| Mobile file-ingress palette | Browser-mediated import plus Files/AirDrop/USB/cloud paths and stem export | C-026 | Requires collect/archive, permissions, and relink semantics absent from evidence | CONDITIONAL |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** copying BeatMaker UI, terminology, protected assets, or undocumented project structures. Public behavior may inform clean-room requirements only. [C-030]
- **REJECTED:** treating an “AUv3 supported” statement as proof of multi-output, sidechain, latency compensation, sample-accurate automation, isolation, or complete state recovery. [C-024]
- **REJECTED:** host-external manual IAA/Audiobus recall as a durability target; it is useful evidence of a boundary, not a preferred project guarantee. [C-023, C-032]
- **CURIOSITY_NO_GO:** old forum/user-comment crash anecdotes — version-unclear, non-primary, and unable to prove current internals.
- **CURIOSITY_NO_GO:** exhaustive BeatMaker 1/2 history — outside the current-family decision except the bounded migration unknown.
- **CURIOSITY_NO_GO:** broad tutorial/video review — lower expected value than the official manual pages already retrieved.
- **CURIOSITY_NO_GO:** proprietary binary/project reverse engineering — prohibited and unnecessary for this documentary wave.
- **CURIOSITY_NO_GO:** generic Apple AU architecture used to fill BeatMaker-specific gaps — platform rules cannot establish this host's policies without qualification.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / check | Documentary result | Status / later probe |
| --- | --- | --- |
| H1: Song and Scene own separate pattern copies | Manual says they share tracks/patterns and use takeover | **FALSIFIED**; inspect identity/state transitions dynamically only if architecture prototype needs it [C-007] |
| H2: “128 banks of 128 pads” is marketing error | Quickstart explains 128 banks and up to 128 instruments per bank | **FALSIFIED as simple error**; hierarchy is documented [C-005] |
| H3: current AUv3 support is only stale 2017 copy | 3.0.17 release note names AUv3 stability changes | **SUPPORTED against staleness concern**, not full-contract proof [C-018] |
| H4: all external target state is session-contained | IAA/Audiobus state must be saved/recalled externally | **FALSIFIED** [C-023] |
| H5: supported send count is unambiguous | Official sources say four, up to eight, and expose eight automation parameters | **CONTRADICTED**; qualify current UI dynamically [C-012] |
| H6: accepted/listed/loaded means complete host contract | Sources establish listing/loading/basic connections only | **REJECTED**; independently test instantiate, render, buses, timing, state, failure, and recovery [C-020–C-024] |
| H7: unsupported format rows can be negative claims | Official material's silence is insufficient | **FALSIFIED**; retain `UNKNOWN` [C-025] |

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current listed release is BeatMaker 3.0.17 (2025-12-19), with named stability fixes | US App Store snapshot | S-002 | Current platform-owner listing | No future-maintenance guarantee |
| C-002 | DOCUMENTED | High | Current documented edition is iPad/iPadOS 11+; no other current edition found | 3.0.17 | S-001, S-002 | Apple compatibility field preferred over stale copy | Does not prove future plans |
| C-003 | DOCUMENTED | High | Commercial paid app with IAP; intended as full production studio | US storefront/current family | S-001, S-002 | Direct listings | Price can vary |
| C-004 | DOCUMENTED | High | Session/project and four-view model | Manual/Quickstart | S-003 | Direct definitions | UI docs updated 2022 |
| C-005 | DOCUMENTED | High | 128 banks, 16×8 grouping, up to 128 pad instruments/bank | Manual/Quickstart | S-003, S-007 | Direct definitions | Resource limits untested |
| C-006 | DOCUMENTED | High | Patterns hold notes/automation and are reused in Song | Manual | S-003, S-006 | Direct behavior | Internal identity unknown |
| C-007 | DOCUMENTED | High | Shared Song/Scene objects, one playing pattern/track, quantized takeover | Manual | S-006 | Direct behavior | Current runtime not observed |
| C-008 | DOCUMENTED | High | Bank/audio/AUX sequencing and audio-pattern editing | Manual | S-006 | Direct behavior | Exact file formats unknown |
| C-009 | UNKNOWN | High | Proprietary module/process/thread/storage architecture unavailable | Current family | S-001–S-007 | Searched official surfaces | Vendor disclosure or safe tracing needed |
| C-010 | DOCUMENTED | Medium | Multitrack recording, USB I/O, streaming, stretch/resample, stem export | Product claims | S-001 | Direct vendor specifications | Not independently measured |
| C-011 | UNKNOWN | High | Engine precision, scheduling, PDC, render and scaling contracts unavailable | 3.0.17 | S-001, S-002, S-006 | No retained passage | Dynamic harness/vendor docs needed |
| C-012 | DOCUMENTED | High | Mixer/effects/sends documented, but send count conflicts | Version-unclear docs | S-001, S-006 | Contradiction retained | Four versus eight unresolved |
| C-013 | DOCUMENTED | Medium | Pattern recording and sample editor capabilities | Product/manual | S-001, S-003 | Direct lists | Not dynamically qualified |
| C-014 | DOCUMENTED | High | Core/virtual MIDI, controllers, import, Link and MIDI editing | Current family | S-001, S-002, S-006, S-007 | Triangulated official docs | Timing guarantees unknown |
| C-015 | UNKNOWN | High | MPE, MIDI 2.0, SysEx, notation and detailed sync contract unavailable | 3.0.17 | S-005, S-006 | Index/manual checked | Tutorial title not enough |
| C-016 | DOCUMENTED | Medium | Detailed native sampler/pad/modulation capability set | Product specification | S-001 | Vendor functional list | Scaling/implementation unknown |
| C-017 | DOCUMENTED | Medium | Native effects, macros, content and controller mapping exist | Current family | S-001, S-004, S-006 | Official lists/index | “Unlimited” not measured |
| C-018 | DOCUMENTED | High | AUv3 hosting remains relevant in 3.0.17 | iPadOS | S-001, S-002, S-007 | Current release note + host docs | Contract incomplete |
| C-019 | DOCUMENTED | Medium | IAA and Audiobus integrations are documented | iPadOS/version-unclear | S-001, S-007 | Official docs | Detailed page updated 2020 |
| C-020 | DOCUMENTED | High | Compatible installed targets auto-list; plugin browser and pad loading exist | Host UI | S-007 | Direct instructions | Scan/validation internals unknown |
| C-021 | DOCUMENTED | High | Pad hosting, basic audio/MIDI connection, and UI behavior | AU/IAA/Audiobus | S-007 | Direct instructions | Bus/layout details absent |
| C-022 | DOCUMENTED | High | Effect/pad/layer/mixer automation is exposed | Manual | S-006 | Direct parameter list | Sample accuracy/ID stability unknown |
| C-023 | DOCUMENTED | High | AU state saved in sessions/banks; external app state manual | AU vs IAA/Audiobus | S-007 | Explicit save warning | Missing/corrupt state unknown |
| C-024 | UNKNOWN | High | Deep host contract and failure handling unavailable | 3.0.17 | S-002, S-005–S-007 | Targeted official review | Requires dynamic matrix/vendor docs |
| C-025 | UNKNOWN | High | No defensible mobile support conclusion for other required formats | 3.0.17 iPadOS | S-001, S-002, S-007 | Silence is not negative evidence | Vendor confirmation needed |
| C-026 | DOCUMENTED | Medium | Import/export/transfer/backup surfaces are publicly listed | Current family/version-unclear | S-001, S-005 | Official specifications/index | Workflow details not all retrieved |
| C-027 | UNKNOWN | High | Project schema, collect/relink, recovery and migration semantics unavailable | 3.0.17 | S-003, S-005, S-007 | Targeted docs checked | Dynamic fixtures/vendor docs needed |
| C-028 | UNKNOWN | Medium | Public scripting/device SDK/action APIs not established | Current family | S-001, S-004, S-005 | No retained documentation | Absence not proof |
| C-029 | DOCUMENTED | High | Store privacy/accessibility declarations as stated | Apple listing | S-002 | Direct fields | Not an audit |
| C-030 | DOCUMENTED | High | Current store identifies INTUA as seller/copyright holder | Current listing | S-002 | Direct store metadata | Grants no implementation rights |
| C-031 | INFERENCE | Medium | Product bridges groovebox/sampler and DAW workflows | Product model | C-004–C-008, C-016 | Bounded synthesis | Category labels subjective |
| C-032 | INFERENCE | High | External/manual app state weakens recall durability | IAA/Audiobus | C-023 | Direct consequence | User discipline can mitigate |
| C-033 | INFERENCE | High | Per-track linear/live takeover is transferable | Sequencing architecture | C-007 | Minimal clean-room mechanism | UX complexity risk |
| C-034 | INFERENCE | High | Product is a weak direct model for cross-platform plugin internals | Cross-platform decision | C-002, C-024, C-027 | Platform/depth mismatch | Still strong workflow reference |
| C-035 | DOCUMENTED | High | Docs expose behavior, not implementation internals | Public evidence set | S-001–S-007 | Source-content boundary | No source-code evidence |
| C-036 | UNKNOWN | High | Exact codecs, metadata, video, relink and comping behavior unavailable | 3.0.17 | S-001, S-005 | No retained detailed passage | Safe fixture test needed |
| C-037 | UNKNOWN | High | Product/format SDK, trademark, content and redistribution terms were not analyzed | Implementation/legal boundary | S-001, S-002 | Public product/store pages are insufficient | Counsel review required |

## 22. Source ledger and adaptive bibliography

- **S-001 — “BeatMaker 3.”** INTUA. <https://intua.net/beatmaker3/>. Official product/specification page; version/date not stated; accessed 2026-08-29. Relevant sections: Overview, Detailed specifications, Compatibility, Technologies. Supports C-002–C-003, C-005, C-010–C-019, C-026, C-030. **Limitations:** marketing claims are not measurements; compatibility text includes stale iPhone/iOS 9.3 wording and internally conflicting send counts. **Selection rationale:** canonical first-party feature/platform surface; preferred over reviews.
- **S-002 — “BeatMaker 3.”** Apple App Store / developer listing. <https://apps.apple.com/us/app/beatmaker-3/id1060317024>. Platform-owner storefront metadata; version 3.0.17; accessed 2026-08-29. Relevant passages: What's New, Compatibility, Information, Privacy, Accessibility. Supports C-001–C-003, C-014, C-018, C-024, C-029–C-030, C-037. **Limitations:** developer-supplied description can be stale; storefront price/availability varies; no runtime qualification. **Selection rationale:** strongest primary/current release and platform evidence.
- **S-003 — “Quickstart guide.”** INTUA BeatMaker Support, updated 2022-06-28. <https://intua.zendesk.com/hc/en-us/articles/210181326-Quickstart-guide>. Official HTML manual; accessed 2026-08-29. Relevant passages: Main concepts; Session, banks and patterns; Basic sequencing; Saving. Supports C-004–C-006, C-012–C-014, C-027. **Limitations:** introductory and older than 3.0.17. **Selection rationale:** accessible official substitute for the unreadable PDF and clearest object definitions.
- **S-004 — “User's manual.”** INTUA BeatMaker Support. <https://intua.zendesk.com/hc/en-us/sections/115001015143-User-s-manual>. Official documentation index; accessed 2026-08-29. Relevant passage: complete 12-article manual map, including Effects, Macros, MIDI, file exchange, advanced settings, and controller routing. Supports C-017, C-028. **Limitations:** titles establish topic coverage, not detailed behavior. **Selection rationale:** bounded source map used to avoid broad searching.
- **S-005 — “BeatMaker 3 Tutorials.”** INTUA BeatMaker Support. <https://intua.zendesk.com/hc/en-us/categories/115000805963-BeatMaker-3-Tutorials>. Official tutorial index; accessed 2026-08-29. Relevant entries: backup, session/bank save, audio tracks, AU control, MIDI AU, automation, sends, BeatMaker 2 import. Supports C-015, C-024, C-026–C-028, C-036. **Limitations:** article titles alone do not prove detailed semantics. **Selection rationale:** primary bounded inventory for persistence/integration topics.
- **S-006 — “Sequencer View.”** INTUA BeatMaker Support, updated 2021-07-12. <https://intua.zendesk.com/hc/en-us/articles/210181486-Sequencer-View>. Official HTML manual; accessed 2026-08-29. Relevant sections: Sequencer basics, Song mode, Track Automations, Scene mode, Pattern Editor. Supports C-006–C-008, C-012, C-014–C-015, C-017, C-022, C-024. **Limitations:** older than current release and not runtime-observed. **Selection rationale:** highest-density primary source for pad/bank/scene/pattern/song/audio and automation semantics.
- **S-007 — “How to control an Audio Units plugin or external application.”** INTUA BeatMaker Support, updated 2020-07-08. <https://intua.zendesk.com/hc/en-us/articles/115003472606-How-to-control-an-Audio-Units-plugin-or-external-application>. Official tutorial; accessed 2026-08-29. Relevant passages: plugin selection/listing, loading, audio/MIDI connection, UI, save warning. Supports C-005, C-018–C-025, C-027, C-035. **Limitations:** predates 3.0.17; comments were ignored as untrusted secondary anecdotes. **Selection rationale:** most direct first-party host-contract evidence; preferable to forums/videos.
- **Negative/access result — “BM3 Manual” PDF.** INTUA. <https://intua.net/downloads/BM3_Manual.pdf>. Official PDF; accessed/downloaded 2026-08-29, but inaccessible for claim extraction and not used for claims. **Access failure and limitation:** web fetch rejected `application/pdf`; local `pdftotext` was unavailable. Per contract, retrieval was not repeatedly retried; accessible official HTML articles S-003/S-006/S-007 were used instead. **Selection rationale:** recorded to preserve the access boundary and prevent invented page citations.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Decision impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| U-01 Engine/process/thread graph [C-009, C-011] | Official product, store, manual and tutorials checked; proprietary internals absent | High for real-time architecture | Vendor engineering disclosure or later black-box timing/load harness on disposable iPad | Unassigned |
| U-02 Plugin isolation, crash containment, scanning/validation [C-024] | Targeted official plugin article; no process/failure contract | High for reliability/security | Disposable signed test AUv3 that can hang/crash plus process/log observation; no production device | Unassigned |
| U-03 Multi-output, sidechain, MIDI out, dynamic I/O, latency/tails [C-024] | Product/manual name basic connections only | High for host fidelity | Purpose-built AUv3 matrix fixtures with known buses, latency, tails, and dynamic layouts | Unassigned |
| U-04 Parameter identity, sample accuracy and state fidelity [C-022–C-024] | Automation and save behavior documented, representation omitted | High for durable projects | Write/read automation impulse and versioned state fixtures; compare real-time/offline output | Unassigned |
| U-05 Missing-plugin/sample recovery and project schema [C-027] | Session references and save warning found; no schema/recovery docs | High for portability | Create lawful fixture, remove plugin/sample, reopen copy, archive/relink, record diagnostics | Unassigned |
| U-06 Exact file/codec/export/backup behavior [C-026, C-036] | Product and tutorial index only; depth budget ended | Medium | Retrieve two named official file/backup articles or use synthetic codec/file fixtures | Unassigned |
| U-07 Current IAA/Audiobus viability [C-019] | Detailed official page is from 2020; current store copy repeats support but may be stale | Medium | Vendor confirmation, then safe current-iPad launch/recall fixture | Unassigned |
| U-08 MPE/MIDI 2.0/SysEx/timing [C-015] | Sequencer/manual index checked; no contract | Medium | Vendor response or deterministic virtual-MIDI fixtures | Unassigned |
| U-09 Accessibility and controller feedback [C-017, C-029] | Apple has no developer-declared accessibility features; detailed controller page not retrieved | Medium | VoiceOver/keyboard/controller audit on disposable setup | Unassigned |
| U-10 Exact licensing/SDK obligations [C-037] | Product/store copyright reviewed; legal terms not analyzed | High before shipping compatibility | Counsel review of current vendor/platform/format agreements | Unassigned |

## 24. Curiosity pass and stop decision

Scores use 1 (low) to 4 (high); cost is 1 (cheap) to 4 (expensive).

| Candidate thread | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| AUv3 loading/UI/state contract | 4 | 4 | 4 | 2 | **PURSUED:** S-007; materially established enumeration, connection, UI and split persistence model |
| Song/Scene/audio takeover semantics | 4 | 4 | 3 | 1 | **PURSUED as core coverage:** S-006 |
| Detailed file/backup articles | 3 | 3 | 2 | 1 | **CURIOSITY_NO_GO:** index-level coverage is enough for architecture triage; exact behavior moved to U-06 |
| Current IAA runtime qualification | 3 | 3 | 2 | 4 | **CURIOSITY_NO_GO:** requires dynamic execution outside documentary wave |
| Forum crash/missing-plugin anecdotes | 2 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** weak, version-unclear evidence |
| BeatMaker 1/2 lineage | 1 | 1 | 2 | 3 | **CURIOSITY_NO_GO:** out of current scope except migration probe |
| Proprietary internals/reverse engineering | 3 | 2 | 3 | 4 | **CURIOSITY_NO_GO:** unsafe/prohibited and unnecessary |

The predeclared bounded nested AUv3 discovery could not launch because the current session was already at the configured subagent-depth limit; no nested agent edited files. The parent pursued the same official source directly.

**Stop decision:** `STOP — COVERAGE WITH BUDGET/ACCESS BOUNDARY`. Every required heading and plugin-format row is complete; product identity, composition model, sampler/routing surface, current AUv3 headline, persistence split, files/export/controller surface, maintenance, and licensing boundary are represented. Searches saturated on the same official product/manual surfaces, the PDF had a recorded tool-access failure with HTML equivalents available, and remaining questions require vendor disclosure, two narrowly named support pages, legal analysis, or dynamic fixtures. Another broad documentary pass is unlikely to change the leading workflow conclusions; it could only refine explicitly logged unknowns.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Post-write path-limited status/diff check performed; no sibling/shared file was edited.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and 11.1–11.6 present.
- [x] **Every material assertion has a claim ID and classification.** Substantive assertions use C-001–C-037; metadata/process statements are not product claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Claims register and Section 23.
- [x] **Every required plugin-format row is present.** Thirteen required rows in Section 11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Explicit classifications throughout.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0, 16, and 19.
- [x] **Bibliography records source rationale and limitations.** Section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary HTTP retrieval only; no product/plugin binaries executed.

**Checks performed:** governing-file read; official-source URL retrieval; two-source-per-pass synthesis; format-row count; heading-order check; claim/source audit; path-limited git status/diff; no stage/commit.

**Unresolved blockers:** official BM3 Manual PDF text extraction unavailable; subagent-depth prevented nested discovery; proprietary internals and deep host/runtime contracts unavailable; dynamic qualification intentionally deferred.

**Pre-existing workspace changes left untouched:** the pre-write `git status --short` showed numerous modified/untracked files under `apps/mobile/`, `vendor/crafty/`, `bun.lock`, and the already-untracked `research/daw-landscape/` tree. None was staged, reverted, or edited by this researcher.
