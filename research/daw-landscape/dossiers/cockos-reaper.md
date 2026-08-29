# Cockos REAPER DAW dossier

> Research-only evidence. No design or implementation authority. Public clean-room sources only.

## 0. Metadata and scope

- **Product family:** Cockos REAPER.
- **Canonical vendor:** Cockos Incorporated.
- **Researcher/session:** research subagent, `ses_fb275c821ffdDs3Cxg4nuiq2F3`.
- **Owned path:** `research/daw-landscape/dossiers/cockos-reaper.md`.
- **Research date/evidence cutoff:** 2026-08-29 UTC.
- **Current evidence pin:** REAPER 7.79, released 2026-08-17; current hosted guide 7.79a, August 2026. **DOCUMENTED** [C-001; S-001; S-002; S-005].
- **Editions/licensing scope:** Cockos documents one feature version, sold under discounted and commercial use-based licenses rather than feature editions. **DOCUMENTED** [C-002; S-003; S-004].
- **Platforms:** Windows, macOS, and Linux desktop builds; no REAPER mobile or browser product is in scope. **DOCUMENTED** [C-001; S-001; S-003].
- **Included:** current REAPER; its universal track/routing, render/PDC, plugin-hosting, project, ReaScript, JSFX, OSC, VST extension, and compiled Extension SDK boundaries.
- **Excluded:** installer/binary execution; reverse engineering; unpublished internals; independent performance claims; implementation details of third-party SWS/ReaPack packages; standalone ReaPlugs as a separate product; WINE behavior; and legal advice.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.
- **Claim convention:** every substantive assertion below cites a claim register entry classified `DOCUMENTED`, `INFERENCE`, or `UNKNOWN`. There are no `OBSERVED` claims because no product or plugin was executed.

## 1. Executive summary

- **DOCUMENTED — universal track model:** ordinary tracks can combine audio, MIDI, video, instruments, effects, folders/buses, and up to 128 audio channels plus 128 MIDI buses; a distinct master-track role remains. [C-003; C-004]
- **INFERENCE — model consequence:** role-fluid tracks reduce forced track-type conversion in complex routing, at the cost of denser validation and UI. [C-048; C-057]
- **DOCUMENTED — visible graph:** sends/receives, nested folders, routing matrix/wiring view, FX pin maps, pre/post send taps, parallel chains, and feedback routing form a highly exposed user graph. PDC is disabled on feedback paths. [C-004; C-008]
- **DOCUMENTED — scheduler boundary:** Cockos documents one real-time audio-device thread and anticipative/asynchronous FX work that can use other cores, with live-FX multiprocessing and per-track compatibility switches. Exact graph partitioning, work stealing, lock discipline, and global mix precision remain **UNKNOWN**. [C-006; C-009; C-046; C-047]
- **DOCUMENTED — broad host list:** Cockos lists VST2, VST3/ARA, LV2, CLAP, JSFX, Windows DX, and macOS AU. **UNKNOWN:** the current documentation does not distinguish AUv2 from AUv3 and does not establish AAX, LADSPA, DSSI, or Rack Extension support. [C-013–C-015; C-065]
- **DOCUMENTED — recovery/isolation:** VST bridging offers automatic, shared separate-process, per-plugin dedicated-process, and native-only choices; projects can open with all FX offline. Exact defaults, Linux/ARM behavior, non-VST isolation, and state recovery after bridge failure remain **UNKNOWN**. [C-019; C-026; C-059]
- **DOCUMENTED — durable but dependency-bearing persistence:** `.RPP` is text, media is normally referenced rather than embedded, MIDI is stored in-project, relative paths and media collection are available, and missing FX stay named but unavailable. **UNKNOWN:** automatic state-preserving rebind is not documented. [C-035–C-037; C-062]
- **DOCUMENTED — layered extensibility:** actions, ReaScript, JSFX, OSC, compiled native extensions, and Cockos-specific VST/CLAP integration expose progressively more power. **UNKNOWN:** no native-extension/plugin capability sandbox is documented. [C-027–C-034; C-064]
- **DOCUMENTED — licensing headline:** REAPER is proprietary commercial software; the Cockos extension mini-SDK, current VST3 SDK, CLAP, and LV2 source artifacts have permissive terms, while VST2 is discontinued and AAX requires Avid agreements/tooling/signing. **UNKNOWN — legal review required:** trademark, certification, and third-party redistribution rights are separate. [C-041–C-045; C-067]
- **Confidence:** high for user-visible REAPER 7.79 behavior and published extension contracts; medium for product-wide per-OS interpretation of Cockos’s unqualified format list; low/unknown for proprietary scheduler internals and unqualified edge-case interoperability.

## 2. Product identity, history, and market position

- **DOCUMENTED:** REAPER 7.79 was actively maintained at the cutoff and Cockos offered native downloads for Windows, macOS, and Linux across several CPU/OS generations. [C-001]
- **DOCUMENTED:** Cockos positions the same product version for personal through professional studio use and documents recording, editing, arranging, mixing, mastering, MIDI, audio, and video workflows. This is vendor positioning, not market-share evidence. [C-002; C-005]
- **UNKNOWN:** a complete historical lineage, installed-base ranking, revenue, and comparative market position were not needed to resolve the architecture decision and were not researched. The safest next source would be versioned Cockos release archives; such history would not change the current host contract. [C-069]

## 3. Workflow and conceptual model

- **DOCUMENTED:** a project is a linear timeline of tracks containing media items/takes, automation envelopes, tempo/signature data, markers, and regions. Multiple projects can be open in tabs; subprojects can be inserted/rendered into a parent. [C-005; C-038]
- **DOCUMENTED:** ordinary tracks are intentionally role-fluid: the same track can hold audio/MIDI/video, host instruments/effects, record input or processed output, route to hardware/other tracks, and act as a nested folder/bus. [C-003; C-004]
- **DOCUMENTED:** items support split/trim/slip/stretch/pitch/fades, take FX, overlapping takes, fixed lanes, comping, grouping, ripple editing, and non-destructive spectral edits. [C-005]
- **INFERENCE:** REAPER’s conceptual center is an editable timeline plus a user-visible multichannel graph rather than separate rigid audio/instrument/aux track classes. The plausible alternative is to model folders/master and item/take FX as distinct special objects even though ordinary tracks share one user role. [C-048]

## 4. Publicly documented architecture

- **DOCUMENTED process boundaries:** native processing normally occurs in the REAPER process; selected bridged VSTs can run in an external shared bridge or one dedicated bridge process. Compiled extensions enter through `ReaperPluginEntry`; ReaScript and JSFX are embedded runtimes. [C-019; C-027; C-028; C-030]
- **DOCUMENTED execution boundaries:** VST2 UI/state/action callbacks can overlap audio processing except for the documented `effSetChunk` exclusion; JSFX `@gfx` is separate from audio processing and requires explicit synchronization for shared data. [C-031; C-034]
- **DOCUMENTED storage boundaries:** projects/configuration are line-oriented text at the product level, while plugin state can be supplied by plugin APIs and is not documented as semantically open. [C-024; C-035]
- **UNKNOWN:** proprietary graph compilation, dependency scheduling, worker queues, allocator/lock strategy, realtime safety enforcement, crash journal, bridge protocol, and global internal mix precision. Public sources describe behavior and extension interfaces, not these internals. [C-046; C-047]

## 5. Audio engine

- **DOCUMENTED graph/routing:** tracks default to stereo but can expose up to 128 channels; sends/receives, parent routing, hardware I/O, plugin pin maps, serial/parallel FX, and multichannel master routing form the audio graph. [C-003; C-004]
- **DOCUMENTED buffers/threading:** the hardware block size is configurable; the guide describes a single audio-device real-time thread, anticipative FX work performed asynchronously, optional live-FX multiprocessing, media buffering, and per-track disabling of buffering/anticipation for incompatible plugins. [C-006]
- **DOCUMENTED PDC:** enabled by default, selectable per chain/per FX/ignored, shown per track, and implemented by reading media ahead while monitored input remains delayed. Master hardware-output compensation is available; feedback routing disables PDC. [C-008]
- **DOCUMENTED render/freeze:** rendering can be offline or limited to realtime, use a chosen render block size and anticipative processing, disable silence auto-bypass, and add configured tails. Freeze produces mono/stereo/multichannel media, removes online FX/receives, and supports nested reversible freeze history. [C-007]
- **DOCUMENTED performance controls:** plugin/chain oversampling, silence auto-bypass, muted/silent-track processing reductions, PDC-threshold bypass while record-armed, and temporary oversampling bypass while armed are exposed. [C-009]
- **UNKNOWN:** automatic plugin-tail query/use, hard engine limits below published routing maxima, sample-rate-change transition protocol, dropout recovery internals, deterministic offline equivalence, scheduler algorithm, and full-engine accumulator precision. Cockos documents 64-bit JSFX processing and double `ReaSample` in the extension SDK, but these do not prove every mixer path is double precision. [C-022; C-046; C-047]

## 6. Tracks, timeline, clips, and editing

- **DOCUMENTED:** the timeline supports media items and takes, non-destructive item edits, take/item FX, fixed lanes and comping, grouping, ripple modes, stretch markers, tempo/time-signature changes, regions, markers, spectral edits, and undo/alternate redo paths. [C-005; C-036]
- **DOCUMENTED:** tracks can be nested as folders; folders combine visual organization with parent/child bussing, while VCA groups provide control grouping without requiring the same audio route. [C-004]
- **UNKNOWN:** a formal public object schema, invariant set for edits under tempo changes, and forward-compatible semantic model for every `.RPP` token are not published. [C-070]

## 7. MIDI, sequencing, notation, and expression

- **DOCUMENTED:** REAPER records/edits MIDI items in arrange and piano-roll/editor views, supports CC lanes, quantize/humanize/step recording, hardware MIDI I/O, SysEx media, MIDI clock, MTC/LTC generation/sync, and JACK transport on Linux. [C-010]
- **DOCUMENTED:** tracks expose up to 128 MIDI buses; JSFX can opt into 16 of them and send/receive MIDI or variable-length SysEx at sample offsets inside a block. [C-003; C-030]
- **DOCUMENTED:** MusicXML is listed among readable/writeable formats; score/notation editing exists in the MIDI editor, but this dossier found no complete notation interchange contract. [C-010; C-039]
- **UNKNOWN:** no current-guide match established MIDI 2.0/UMP or a product-level MPE/per-note-expression contract. MIDI 1 channel techniques may carry MPE-like data, but that is not equivalent to documented semantic support. [C-011]

## 8. Routing, mixer, automation, and control

- **DOCUMENTED:** sends can tap post-fader/post-pan, pre-fader/post-FX, or pre-fader/pre-FX; the routing matrix, track wiring, pin maps, nested folders, VCAs, and channel mapping expose signal flow. REAPER can sidechain through extra track channels even when a format lacks dedicated sidechain buses. [C-004; C-021]
- **DOCUMENTED:** track/item/take controls and plugin parameters can have envelopes; parameters can be mapped to MIDI/OSC learn, parameter modulation, and UI controls. VST2 sample-accurate parameter events require the opt-in Cockos extension, while JSFX publishes sample-accurate automation. [C-023; C-032; C-034]
- **DOCUMENTED:** actions can bind to keyboard, toolbar, MIDI, OSC, mouse input, or scripts. Two-way OSC uses `.ReaperOSC` mappings; native control-surface extensions are supported. [C-027; C-029; C-033]
- **UNKNOWN:** universal sample-accurate automation across VST3/AU/CLAP/LV2, automation-ID migration after plugin replacement, control conflict arbitration, and OSC authentication/encryption. [C-060; C-061; C-063]

## 9. Recording, comping, and media handling

- **DOCUMENTED:** any track can record audio/MIDI input or processed output; input monitoring can be with/without FX; punch, loop, layered/take recording, fixed-lane comping, multichannel files, multiple disks, and redundant recording paths are documented. [C-012]
- **DOCUMENTED:** media remains external to `.RPP` by default; Save As can collect/copy/move media into a project directory, relative paths are available, and offline/missing media can be managed. [C-035; C-037]
- **DOCUMENTED:** the technical page lists broad audio/video/MIDI/MusicXML read/write and metadata support; render can embed metadata and images in applicable formats. [C-039]
- **UNKNOWN:** AAF, OMF, ADM/BWF immersive exchange, DAWproject, cloud collaboration, and full conform/proxy semantics were not established by retained sources. [C-049]

## 10. Instruments, effects, content, and native devices

- **DOCUMENTED:** REAPER includes Cockos Rea effects/instruments and hundreds of JSFX; JSFX is a source-form EEL2 audio/MIDI plugin system with parameters, named pins, custom UI, state, and host APIs. [C-025; C-030–C-032]
- **DOCUMENTED:** FX chains can be track, input/record, item/take, monitoring, serial, parallel, or container-based; monitoring FX are outside renders and not stored in the project. [C-072]
- **INFERENCE:** native content is primarily processor/script/preset oriented rather than a closed monolithic device ecosystem. The alternative is to treat Cockos effects and JSFX as a native ecosystem despite their relatively open file/API surfaces. [C-050]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

Cockos’s technical page lists supported desktop formats product-wide and adds explicit OS qualifiers only for DX and AU. Cells below preserve that published scope; omission is not converted into “unsupported.” [C-013; C-014]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED: supported | DOCUMENTED: supported | DOCUMENTED: supported | NOT_APPLICABLE: no REAPER mobile/web product | 7.79; one edition | Legacy VST up to 2.4; VST2 owner discontinued it in 2022 | C-002, C-013, C-034, C-044 / S-003, S-013, S-016 |
| VST3 | DOCUMENTED: supported | DOCUMENTED: supported | DOCUMENTED: supported | NOT_APPLICABLE: no REAPER mobile/web product | 7.79; one edition | ARA supported only through 64-bit VST3 in retained guide | C-002, C-013, C-014 / S-003, S-005 |
| AUv2 | UNKNOWN: Cockos says generic AU only | NOT_APPLICABLE: Cockos says AU is macOS-only | NOT_APPLICABLE: Cockos says AU is macOS-only | NOT_APPLICABLE: no REAPER mobile/web product | 7.79 generic AU evidence only | Apple says AUv2 and AUv3 are distinct; version-specific host support unresolved | C-014, C-045, C-065 / S-003, S-005, S-020 |
| AUv3 | UNKNOWN: Cockos says generic AU only | NOT_APPLICABLE: Cockos says AU is macOS-only | NOT_APPLICABLE: Cockos says AU is macOS-only | NOT_APPLICABLE: no REAPER mobile/web product | 7.79 generic AU evidence only | No Cockos AUv3 statement found; do not infer from “AU” | C-014, C-045, C-065 / S-003, S-005, S-020 |
| AAX | UNKNOWN: absent from Cockos list | UNKNOWN: absent from Cockos list | UNKNOWN: absent from Cockos list | NOT_APPLICABLE: no REAPER mobile/web product | No positive 7.79 evidence | Avid documents AAX for its own hosts under controlled SDK/signing terms | C-015, C-043 / S-003, S-019 |
| CLAP | DOCUMENTED: supported | DOCUMENTED: supported | DOCUMENTED: supported | NOT_APPLICABLE: no REAPER mobile/web product | 7.79; one edition | Paths/rescan documented; CLAP may request Cockos extension context | C-013, C-017, C-028 / S-003, S-005, S-008 |
| LV2 | DOCUMENTED: supported | DOCUMENTED: supported | DOCUMENTED: supported | NOT_APPLICABLE: no REAPER mobile/web product | 7.79; one edition | Paths/rescan/name handling documented; Linux described as especially relevant, not exclusive | C-013, C-017 / S-003, S-005 |
| LADSPA | UNKNOWN: absent from Cockos list | UNKNOWN: absent from Cockos list | UNKNOWN: absent from Cockos list | NOT_APPLICABLE: no REAPER mobile/web product | No positive 7.79 evidence | Omission is not proof of non-support | C-015 / S-003, S-005 |
| DSSI | UNKNOWN: absent from Cockos list | UNKNOWN: absent from Cockos list | UNKNOWN: absent from Cockos list | NOT_APPLICABLE: no REAPER mobile/web product | No positive 7.79 evidence | Omission is not proof of non-support | C-015 / S-003, S-005 |
| JSFX | DOCUMENTED: supported/native | DOCUMENTED: supported/native | DOCUMENTED: supported/native | NOT_APPLICABLE: no REAPER mobile/web product | 7.79; one edition | REAPER-native EEL2 source plugin format | C-013, C-030–C-032 / S-003, S-009–S-011 |
| DirectX/DXi | NOT_APPLICABLE: Cockos says Windows-only | DOCUMENTED: DX/DXi effects/instruments | NOT_APPLICABLE: Cockos says Windows-only | NOT_APPLICABLE: no REAPER mobile/web product | 7.79; one edition | Enable/disable and scan/rescan controls documented | C-013, C-017 / S-003, S-005 |
| Rack Extension | UNKNOWN: absent from Cockos list | UNKNOWN: absent from Cockos list | UNKNOWN: absent from Cockos list | NOT_APPLICABLE: no REAPER mobile/web product | No positive 7.79 evidence | No inference from generic extension terminology | C-015 / S-003, S-007 |
| Product-native/other | DOCUMENTED: Rea effects, native extensions, video processor | DOCUMENTED: Rea effects, native extensions, ReWire/ReaRoute boundaries | DOCUMENTED: Rea effects and native extensions; ReaRoute is Windows-only | NOT_APPLICABLE: no REAPER mobile/web product | 7.79; one edition | Compiled extensions are host extensions, not ordinary DSP plugin format; JSFX has its own row | C-025, C-027–C-029 / S-003, S-005, S-007, S-008 |

### 11.2 Discovery, scanning, validation, and recovery

- **DOCUMENTED VST:** user/system paths, subfolder scans, startup scan for new/updated plugins, disable-startup-scan, and manual rescan including prior scan failures. VST3 should use separate/system directories. [C-016]
- **DOCUMENTED LV2/CLAP/DX/JSFX:** LV2 and CLAP expose path/rescan controls; DX has enable/startup scan/rescan; JSFX is loaded from the resource `Effects` hierarchy after restart. [C-017]
- **DOCUMENTED cache/discovery state:** `reaper-vstplugins.ini` and `reaper-dxplugins.ini` store installed-plugin information. VST path order and identical names can suppress one result, while the FX browser can show/prioritize duplicate formats. Renaming with `#` or global filters is a visibility control; no quarantine semantics are documented. [C-018; C-058]
- **UNKNOWN:** scanner process isolation, validation protocol, timeout/crash policy, blacklist/quarantine persistence, cryptographic identity, code-signature policy, duplicate stable IDs, cache schema/versioning, and failure diagnostics beyond rescan/recovery UI. [C-058]

### 11.3 Runtime isolation and compatibility

- **DOCUMENTED for VST bridging:** `Automatic`, shared `Separate process`, per-plugin `Dedicated process`, and `Native only` are configurable per plugin. Dedicated mode contains a plugin crash to its bridge at higher CPU cost; shared mode can lose all plugins in that bridge. Same-bitness 64-bit VSTs can be bridged to firewall the main process. [C-019]
- **DOCUMENTED UI compatibility:** bridged UI can be embedded in the wrapper or placed in a separate window; VST compatibility toggles cover reset, state/undo, channel-change notification, automation-notification policy, HiDPI, and “buggy plugin” mode. [C-020; C-024]
- **DOCUMENTED failure controls:** projects can open with all FX offline; Cockos also exposes immediate termination on corrupt process heap. [C-026; C-040]
- **UNKNOWN:** exact `Automatic` heuristic beyond bitness, Linux bridge availability, Apple-silicon/Intel and Windows ARM translation, isolation for VST3/AU/CLAP/LV2/DX, IPC/state replay, crash-loop suppression, and code-signing/notarization enforcement. [C-059; C-064]

### 11.4 Host/plugin processing contract

| Dimension | Documented boundary | Consequential unknown |
| --- | --- | --- |
| Audio I/O | Up to 128 track channels, arbitrary pin maps, VST2 dynamic I/O, generated multi-output routes, VST3 bus-count request [C-021] | Per-format bus negotiation, hot-change behavior, inactive/speaker arrangements |
| MIDI/events | Instruments/effects, track MIDI buses, 16 JSFX buses, sample-offset JSFX MIDI/SysEx [C-010; C-030] | MIDI 2.0/UMP, generic MPE semantics, per-format event bus limits |
| Sidechains | Extra track channels/pin mapping; REAPER has no dedicated VST3 sidechain buses [C-021] | Exact VST3/AU/CLAP/LV2 bus activation mapping |
| Processing order | Serial/parallel chains, pre/post sends, anticipative vs realtime distinction [C-004; C-006] | Scheduler ordering guarantees across graph edits and feedback |
| Automation | Generic envelopes/mapping; JSFX sample-accurate; VST2 opt-in Cockos sample-offset extension [C-023; C-032; C-034] | Universal sample accuracy, gesture coalescing, offline equivalence [C-060] |
| Latency/tails | Host PDC controls/display and configured render tails [C-008; C-022] | Per-format latency-change timing and automatic tail reporting/use |
| Bypass/suspend | Per-FX bypass/offline, silence auto-bypass, muted/silent CPU controls [C-009; C-024] | Hard/soft bypass semantics, plugin suspend callbacks, state during offline |
| Offline render | Realtime-limited or faster-than-realtime, block-size and anticipation options [C-007] | Plugin offline flags, deterministic block partition, bit-identical output |

### 11.5 Parameters, automation, state, presets, and project recall

- **DOCUMENTED:** parameters can expose envelopes, aliases, mapped controls, MIDI/OSC learn, modulation, preset defaults, wet/dry, bypass, and automation-notification compatibility policies. [C-023]
- **DOCUMENTED:** REAPER normally saves full plugin state; compatibility options include minimal undo state, avoiding undo-state loads, VST bank state, and preserving pin maps with presets. VST2 exposes chunk concurrency rules and Cockos extensions for named values/ranges/text. [C-024; C-034]
- **DOCUMENTED JSFX:** slider state is automatic; `@serialize` persists custom state in compact 32-bit representation and can load referenced assets. [C-031]
- **UNKNOWN:** opaque state encoding inside `.RPP`, stable parameter identity across plugin versions/formats, external asset relinking, preset portability, migration contracts, state-size bounds, and exact missing-plugin state retention/rebind. [C-061; C-062]

### 11.6 UI, diagnostics, and failure modes

- **DOCUMENTED:** plugin vendor UI or REAPER generic UI, docking/floating, wrapper controls, selected embedded TCP/MCP UIs, bridge UI embedding, keyboard-routing options, HiDPI compatibility, CPU/PDC meters, and recovery-mode opening are exposed. [C-020; C-025; C-026; C-040]
- **DOCUMENTED:** “Disable FX windows when rendering” permits no visible UI during render; JSFX can explicitly request UI-closed idle callbacks. This does not establish that every third-party plugin is headless-safe. [C-025; C-031]
- **DOCUMENTED missing plugin behavior:** a missing FX remains listed but unavailable; the guide suggests remove/replace or reinstall/insert. [C-026]
- **UNKNOWN:** automatic stateful reconnection after reinstall is not promised by retained documentation. [C-062]
- **UNKNOWN:** exhaustive scan logs, crash dumps, plugin-level restart/state replay, UI accessibility/scaling across all formats, headless contract, and user-visible blacklist diagnostics. [C-058; C-062; C-064; C-066]

## 12. Extensibility and integration

- **DOCUMENTED ReaScript:** EEL2 and Lua 5.4 are embedded; Python 2.7–3.x is external/architecture-matched. Scripts call actions and most Extension API functions, can run deferred/modeless, bind to controls, manage undo, and persist global or project key/value state. [C-027]
- **DOCUMENTED native extensions:** C++ extensions can register actions/hooks, control surfaces, project import/config sections, PCM sources/sinks, editors, preference pages, and APIs callable by extensions/ReaScript. They can access audio/file/hardware/SRC/time-stretch services. [C-028]
- **DOCUMENTED JSFX:** EEL2 source plugins expose sample/block/audio/MIDI/UI/state sections, host placement/pin APIs, atomic synchronization, and project audio export. [C-030–C-032]
- **DOCUMENTED control:** actions, MIDI learn, OSC pattern files, and a compiled control-surface API provide external control layers. [C-029; C-033]
- **DOCUMENTED product-specific plugin integration:** VST2 and CLAP can request REAPER host/context APIs; these are Cockos extensions, not portable baseline-format guarantees. [C-028; C-034]
- **DOCUMENTED:** Cockos warns that ReaScripts can crash REAPER. [C-027]
- **UNKNOWN:** formal ABI support windows, capability permissions, extension signing, package manager trust, script filesystem/network restrictions, event subscription versus polling guarantees, and deprecation policy. [C-064]

## 13. Project format, persistence, interoperability, and collaboration

- **DOCUMENTED:** `.RPP` is text and contains track/media/settings information; MIDI is stored in-project, while audio remains external. `.RPP-bak` keeps a prior save and optional `.RPP-UNDO` persists undo history. [C-035; C-036]
- **DOCUMENTED:** projects can use relative paths, Save As can create a project directory and collect media, configurations can be exported/imported, and REAPER can run portably from removable media. [C-037]
- **DOCUMENTED:** subprojects, multiple project tabs, project templates, track templates, and versioned saves are available. [C-038]
- **INFERENCE:** text persistence improves inspectability, diffability, and recovery, but plugin chunks and external assets remain opaque/dependency-bearing. Plain text alone is not semantic version-control compatibility. [C-051]
- **UNKNOWN:** complete grammar/schema, backward/forward compatibility guarantees, deterministic serialization, automatic missing-plugin rebind, concurrent collaboration, merge semantics, AAF/OMF/ADM/DAWproject support, and archive verification. [C-049; C-052]

## 14. Delivery, live, post-production, and specialized workflows

- **DOCUMENTED:** render supports tracks/regions/items, arbitrary channel count/rate/depth/quality, queues, batch conversion, wildcards, dither/noise shaping, peak/LUFS normalization, true-peak limiting, metadata, HTML statistics, and region-render matrices. [C-007; C-039]
- **DOCUMENTED:** video decode/encode, timecode generation/sync, surround/multichannel panning up to 128 channels, ReaRoute on Windows, ReWire options, and NINJAM/ReaStream special-use plugins are published. [C-039]
- **UNKNOWN:** certified immersive/ADM workflows, DDP, ADR-specific management, show-control guarantees, live redundancy, delivery conformance certification, and current ReWire ecosystem viability. [C-071]

## 15. Performance, reliability, security, and accessibility

- **DOCUMENTED performance:** anticipative processing, live-FX multiprocessing, performance/RT CPU meters, per-FX CPU, longest realtime block, buffering, oversampling, silence auto-bypass, and per-track compatibility toggles are exposed. Vendor “industry-leading” claims are not treated as benchmarks. [C-006; C-009; C-040]
- **DOCUMENTED reliability:** dedicated/shared bridge tradeoffs, FX-offline recovery mode, backups, persistent undo, missing-media handling, and corrupt-heap termination exist. [C-019; C-026; C-036; C-040]
- **DOCUMENTED limited accessibility evidence:** font-size adjustment and at least one screen-reader-oriented automatable control are described. [C-053]
- **UNKNOWN accessibility:** comprehensive accessibility conformance is not established. [C-066]
- **UNKNOWN security/privacy:** no plugin/script sandbox permissions, OSC authentication, extension signing policy, telemetry/privacy behavior, auto-update rollback policy, or supply-chain verification was found in retained sources. [C-063; C-064]
- **INFERENCE:** in-process plugins/extensions should therefore be treated as trusted native code. [C-068]
- **UNKNOWN scalability:** published channel/device maxima do not establish stable performance at those maxima or under arbitrary graph/plugin loads. [C-054]

## 16. Licensing, ecosystem, and implementation constraints

- **DOCUMENTED product terms:** REAPER is proprietary licensed software with one feature version; discounted/commercial qualification depends on use/revenue, and a key may be installed on multiple machines but used on one at a time. New licenses at cutoff covered updates through 8.99. [C-002; C-041]
- **DOCUMENTED Cockos SDK terms:** `reaper_plugin.h` carries permissive zlib-style source terms and an as-is disclaimer. Its versioned C++ ABI and MSVC-compatible win32 requirement are implementation constraints, not an ABI stability warranty. [C-028; C-042]
- **DOCUMENTED format-source terms:** current VST3 SDK and CLAP use MIT licenses; LV2’s repository uses ISC-style terms. These govern retrieved SDK/repository material only. [C-042]
- **DOCUMENTED ecosystem constraints:** Steinberg discontinued VST2; AAX SDK access is click-through and commercial AAX needs Avid tooling/license and iLok signing. [C-044; C-043]
- **UNKNOWN:** **LEGAL REVIEW REQUIRED** for Apple AU terms, format trademarks/logos, compatibility certification, plugin redistribution, GPL interactions in optional ecosystem packages, signing/notarization obligations, patents, and any old VST2 SDK rights. Do not copy historical proprietary SDK material or infer rights from REAPER’s support. [C-067]

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED:** one flexible track/routing model supports heterogeneous media and multichannel graphs without forcing aux/instrument track conversion. [C-003; C-004]
- **INFERENCE:** explicit pin maps, routing views, PDC controls, render choices, and process modes make compatibility tradeoffs inspectable and user-correctable. [C-007; C-008; C-019–C-021; C-057]
- **INFERENCE:** text projects, media collection, recovery-open, and layered backups create diagnosability and portability advantages without closing plugin dependencies. [C-026; C-035–C-037; C-051]
- **INFERENCE:** extension layers from actions/scripts through DSP scripting to native C++ allow a capability/cost choice. [C-027–C-034; C-057]

### Liabilities

- **INFERENCE:** documented name/path-order duplicate behavior can be ambiguous; users may need compatibility and process-mode expertise. [C-018; C-055]
- **DOCUMENTED:** feedback routes sacrifice PDC, input monitoring remains delayed by compensated processing, and dedicated isolation costs CPU. [C-008; C-019]
- **UNKNOWN:** many format-specific contracts are not published at the depth needed to promise universal automation, dynamic I/O, tails, state migration, UI, or crash recovery. [C-022; C-060–C-062; C-066]
- **INFERENCE:** powerful in-process native extensions and unsandboxed network/script surfaces increase trust and support burden unless a new design adds explicit permissions/isolation. [C-068]

### Architecture lesson

**INFERENCE:** the strongest reference pattern is not “support many formats”; it is combining a uniform host graph with observable routing, layered compatibility controls, recovery paths, and multiple extension trust levels. A new DAW should preserve those separations while replacing undocumented heuristics with testable capability contracts. [C-057]

## 18. Transferable patterns

**INFERENCE:** the following are clean-room candidate mechanisms derived from the documented behaviors, not copies of REAPER implementation. [C-057]

| Problem | Minimal clean-room mechanism | Support | Prerequisites/tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Rigid track types obstruct routing | One ordinary track object with media/event lanes, N audio channels, event buses, sends, folder parent, and FX stages | C-003, C-004 | Strong validation/UI; master/monitor remain special; complexity can overwhelm | Medium | CANDIDATE |
| Hidden plugin bus wiring | User-visible host-channel↔plugin-pin matrix plus route generator | C-021 | Per-format bus adapter and persistent stable identities | Medium | CANDIDATE |
| Realtime thread overload | Mark eligible graph partitions for look-ahead asynchronous processing while keeping live paths synchronous | C-006, C-034 | Latency model, dependency analysis, realtime-safe queues | High | CONDITIONAL |
| Plugin crashes take down host | Per-plugin selectable in-process/shared-worker/dedicated-worker execution with explicit cost | C-019 | IPC audio/event/state protocol and crash replay | High | CANDIDATE |
| Corrupt project/plugin prevents open | Recovery-open with all extensions offline, then staged re-enable | C-026 | Preserve opaque state without executing it | Low | CANDIDATE |
| Projects are hard to inspect/recover | Versioned text manifest plus external media and explicit collect/relative-path workflow | C-035–C-037 | Canonical serialization, schema migrations, binary-state envelopes | Medium | CANDIDATE |
| One extension API cannot balance safety/power | Actions → managed scripts → DSP DSL → native SDK, each with explicit trust/capability tier | C-027–C-034 | Permissions, signing, versioning, diagnostics | High | CANDIDATE |
| “Format support” hides partial contracts | Per-format capability registry and qualification matrix for scan/instantiate/process/events/UI/state/recovery | C-013–C-024 | Automated plugin fixtures on every OS/architecture | Medium | CANDIDATE |
| Offline and realtime behavior diverge | Publish render block/tail/automation policy and offer realtime fallback | C-007; C-022 | Deterministic scheduling tests; plugin offline hints | Medium | CONDITIONAL |

No protected expression, source code, or UI design is proposed for copying.

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected mechanisms

- **REJECT:** equating a format name with a complete host contract. Cockos’s own VST2 document shows subset semantics and optional extensions. [C-034; C-056]
- **REJECT:** using display name/path order as the only duplicate identity. The guide documents collision/suppression behavior but not stable identity. [C-018; C-055]
- **REJECT:** adopting VST2 as a new architectural baseline. It remains a compatibility target but is owner-discontinued. [C-044]
- **REJECT:** giving native extensions unrestricted in-process access by default without trust UI, signing, permissions, and recovery. REAPER documents power but not a sandbox. [C-028; C-064; C-068]
- **REJECT:** assuming text projects are self-contained or semantically mergeable. Media and plugin dependencies remain external/opaque. [C-035; C-051]

### `CURIOSITY_NO_GO`

- `CURIOSITY_NO_GO` — independent performance rankings: decision relevance 2/5, expected value 2/5, novelty 2/5, cost 5/5. Vendor-independent benchmarks require controlled builds/hardware/projects and cannot establish architecture internals.
- `CURIOSITY_NO_GO` — community reports of plugin blacklists/crashes: 4/5, 2/5, 3/5, 4/5. Anecdotes cannot prove current scanner policy; use fault-injection fixtures instead.
- `CURIOSITY_NO_GO` — infer AUv2/AUv3 from plugin filenames/user screenshots: 4/5, 2/5, 2/5, 3/5. Cockos’s generic AU wording remains ambiguous; a runtime matrix or Cockos clarification is discriminating.
- `CURIOSITY_NO_GO` — reverse engineer `.RPP` opaque plugin chunks or bridge IPC: 5/5, 3/5, 5/5, 5/5. Outside the clean-room/safety boundary; public API and controlled behavior tests suffice.
- `CURIOSITY_NO_GO` — enumerate every SWS/ReaPack package: 2/5, 2/5, 2/5, 5/5. Ecosystem inventory would not change the native extension trust boundary.
- `CURIOSITY_NO_GO` — trademark/certification conclusions from SDK licenses: 4/5, 1/5, 2/5, 4/5. Requires current legal review, not technical inference.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test/counterevidence | Result |
| --- | --- | --- |
| H1: REAPER requires separate audio/instrument/aux track types | S-003/S-005 say any track can mix/record audio and MIDI, host instruments, and route/folder | **Supported as false:** ordinary tracks are role-fluid [C-003] |
| H2: every plugin runs out of process by default | S-005 documents native main-process mode and optional per-plugin bridging | **False** [C-019] |
| H3: “VST2 supported” means full VST 2.4 | S-013 explicitly says REAPER implements a subset plus extensions | **False** [C-034] |
| H4: every supported format has sample-accurate automation | Only JSFX and opt-in Cockos VST2 extension are explicit | **Not established; likely false as universal claim** [C-023; C-032; C-034] |
| H5: `.RPP` is a self-contained session bundle | S-005 says audio remains external and Save As must collect media | **False** [C-035; C-037] |
| H6: generic “AU” proves both AUv2 and AUv3 | Apple distinguishes generations; Cockos does not | **Failed/UNKNOWN** [C-045; C-065] |
| H7: failed scan means permanently blacklisted | Manual says rescan checks prior failures but gives no quarantine contract | **Not established** [C-016; C-058] |
| H8: feedback routing retains normal PDC | Guide explicitly says PDC is disabled with feedback routing | **False** [C-008] |
| H9: missing plugin automatically rebinds with full state after reinstall | Guide only preserves an unavailable list entry and suggests reinstall/insert | **UNKNOWN** [C-062] |
| H10: accepting a plugin format proves scan→instantiate→process→UI→state→recovery | Retained docs expose different evidence for each stage and many gaps | **False as a research method** [C-056] |

**Later dynamic probes:** for each format/OS/architecture, use lawful minimal fixtures to distinguish (1) discovered, (2) scanned, (3) instantiated, (4) realtime processed, (5) offline rendered, (6) multi-I/O/events/automation/latency/tail handled, (7) UI opened/headless, (8) state recalled after version/missing dependency, and (9) crash contained. Record hashes, paths, REAPER build, process tree, logs, and round-trip state; do not use untrusted production plugins.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current release is 7.79 (2026-08-17) with Windows, macOS, Linux builds and stated OS/CPU bands | 7.79 cutoff | S-001, S-002, S-003 | Direct vendor pages | Future releases; beta ARM64EC qualified |
| C-002 | DOCUMENTED | High | One feature version; discounted/commercial licenses differ by use, not features | Current sales | S-003, S-004 | Direct Cockos wording | EULA not retrieved |
| C-003 | DOCUMENTED | High | Any ordinary track can mix audio/MIDI/video and expose up to 128 audio channels/128 MIDI buses | 7.79 | S-003, S-005 | Product page + guide | Master remains special |
| C-004 | DOCUMENTED | High | Tracks serve route/folder/bus roles with sends, receives, matrices, pin maps, VCAs, and nested folders | 7.79 | S-003, S-005 | User-visible operations | Formal graph model unpublished |
| C-005 | DOCUMENTED | High | Linear project workflow includes items/takes/lanes/comping/editing/regions and multiple project tabs | 7.79 | S-003, S-005 | Guide chapters 2–12 | Not a full object schema |
| C-006 | DOCUMENTED | High | One device RT thread is supplemented by asynchronous anticipative processing and optional live-FX multiprocessing | 7.79 | S-005, S-013 | Guide 22.6.2/22.12; VST host API | Scheduler algorithm unknown |
| C-007 | DOCUMENTED | High | Render/freeze expose offline/realtime, block, anticipation, tail, channel-count, and reversible freeze controls | 7.79 | S-003, S-005 | Guide 6.17/22.6.8 | Tail is configured; reporting unknown |
| C-008 | DOCUMENTED | High | PDC is default, configurable/displayed, reads media ahead, delays monitoring, and is disabled for feedback | 7.79 | S-003, S-005 | Guide 6.15 | Plugin report protocol not fully stated |
| C-009 | DOCUMENTED | High | Oversampling, silence auto-bypass, mute/silence CPU controls, and record-arm compatibility controls exist | 7.79 | S-003, S-005 | Technical page + preferences | Behavior varies by plugin |
| C-010 | DOCUMENTED | High | MIDI edit/record, CC, step/quantize, SysEx media, hardware I/O, clock/MTC/LTC/JACK sync are documented | 7.79 | S-003, S-005 | Technical/guide | No MIDI 2.0 claim |
| C-011 | UNKNOWN | High | Product-level MIDI 2.0/UMP and MPE/per-note-expression semantics were not established | 7.79 | S-005, S-010 | Negative term search + MIDI 1 byte API | Absence is not non-support; probe needed |
| C-012 | DOCUMENTED | High | Any track can record audio/MIDI input or processed output with punch/loop/takes/multichannel/monitoring | 7.79 | S-003, S-005 | Product page + guide | Hardware-dependent maxima |
| C-013 | DOCUMENTED | High | Cockos lists VST2, VST3, LV2, CLAP, DX-Windows, AU-macOS, and JSFX | 7.79 | S-003, S-005 | Current product-wide list | Per-format depth differs |
| C-014 | DOCUMENTED | High | ARA is documented for 64-bit VST3, not AU/RTAS; generic AU version is unspecified | 7.79 | S-005 | Guide 10.12 and FX list | AUv2/v3 unresolved |
| C-015 | UNKNOWN | High | AAX, LADSPA, DSSI, and Rack Extension support is not established | 7.79 | S-003, S-005, S-019 | Omitted from positive list; no inference | Dynamic/vendor clarification needed |
| C-016 | DOCUMENTED | High | VST paths, startup new/updated scan, subfolders, disable switch, and rescan of prior failures are exposed | 7.79 | S-005, S-014 | Guide 1.19; format-owner paths | Scanner internals unknown |
| C-017 | DOCUMENTED | High | LV2/CLAP path/rescan, DX enable/scan/rescan, and JSFX resource-folder install are documented | 7.79 | S-005 | Guide 1.19/6.21/22.10 | Per-OS paths incomplete |
| C-018 | DOCUMENTED | Medium | VST/DX cache files and duplicate display/path-order behavior are documented | 7.79 | S-005 | Guide 1.20/6.9 | Duplicate wording is internally ambiguous |
| C-019 | DOCUMENTED | High | VST automatic/shared separate/dedicated/native modes and CPU/crash tradeoffs are documented | 7.79 | S-003, S-005 | Guide 16.18 | Other formats/Linux unknown |
| C-020 | DOCUMENTED | High | Bridge UI embedding and VST compatibility modes are exposed | 7.79 | S-005 | Guide 6.10/16.18 | OS/architecture matrix incomplete |
| C-021 | DOCUMENTED | High | Host exposes arbitrary pin mapping, generated multi-output/16-channel MIDI routes, VST2 dynamic I/O, VST3 bus request | 7.79 | S-005, S-013 | Guide + VST2 developer doc | Other format bus contracts unknown |
| C-022 | UNKNOWN | High | Generic plugin tail reporting/use and precise dynamic latency-change timing were not documented | 7.79 | S-003, S-005, S-013 | PDC/tail settings do not prove reports | Test fixtures required |
| C-023 | DOCUMENTED | High | Generic parameter envelopes/mapping exist; JSFX and opt-in VST2 sample-offset automation are explicit | 7.79 | S-003, S-005, S-011, S-013 | Separate format contracts | Does not establish other formats’ timing |
| C-024 | DOCUMENTED | Medium | Full/minimal/VST-bank/undo/preset compatibility controls exist | 7.79 | S-005, S-013 | Guide compatibility pages | Plugin-specific behavior |
| C-025 | DOCUMENTED | High | Vendor/generic/floating/docked/selected embedded UIs and headless render controls exist | 7.79 | S-005, S-009 | Guide 6/22; JSFX ref | Universal headless safety unknown |
| C-026 | DOCUMENTED | High | Recovery opens all FX offline and a missing FX stays listed but unavailable | 7.79 | S-001, S-005 | Guide 6.16/6.20 | Automatic rebind not stated |
| C-027 | DOCUMENTED | High | ReaScript offers EEL2/Lua/Python, actions/API, deferred UI, bindings, undo, and persistence | Current docs | S-006 | Official developer doc | Script sandbox/version policy unknown |
| C-028 | DOCUMENTED | High | Native SDK registers host services/actions/importers/media/control/API; CLAP can request REAPER context | SDK HEAD | S-007, S-008 | Official page + pinned header | ABI stability/sandbox unknown |
| C-029 | DOCUMENTED | High | OSC and native control-surface APIs provide configurable external control | Current docs | S-003, S-007, S-012 | Official docs | Network security unspecified |
| C-030 | DOCUMENTED | High | JSFX is on-the-fly EEL2 DSP/MIDI with up to 256 sliders, 64 sample channels, and declared pins | Current docs | S-003, S-009 | Official reference | REAPER-native, not portable standard |
| C-031 | DOCUMENTED | High | JSFX lifecycle/state/UI-thread/atomic boundaries are explicit; serialized custom state uses compact 32-bit values | Current docs | S-009, S-011 | Official reference | User code can still race |
| C-032 | DOCUMENTED | High | JSFX exposes sample-offset MIDI, 16 buses, automation notification, pin/channel and placement host APIs | Current docs | S-003, S-010, S-011 | Official reference | Track has 128 buses; JSFX sees 16 |
| C-033 | DOCUMENTED | High | OSC is two-way mapped network control for actions, FX learn, and control-surface messages | Current docs | S-012 | Official OSC page | Security/version contract not stated |
| C-034 | DOCUMENTED | High | REAPER implements a VST2.4 subset; documents concurrency, dynamic I/O/params, optional sample-accurate/context extensions | VST2 in current REAPER | S-013 | Official Cockos developer doc | Does not define VST3 contract |
| C-035 | DOCUMENTED | High | `.RPP` is text; audio media is referenced externally; MIDI is stored in project | 7.79 | S-005 | Guide 1.25/MIDI chapter | Opaque plugin state remains |
| C-036 | DOCUMENTED | High | Prior-save backup, optional persistent undo, autosave/version saves, and alternate redo paths exist | 7.79 | S-005 | Guide 1.25/12/22 | Recovery guarantees untested |
| C-037 | DOCUMENTED | High | Relative paths, media collection, config export/import, and portable installation support portability | 7.79 | S-003, S-005 | Product page + guide | External plugin/assets remain |
| C-038 | DOCUMENTED | High | Multiple tabs, subprojects, project/track templates, and versioned saves are available | 7.79 | S-005 | Guide 12 | Collaboration not implied |
| C-039 | DOCUMENTED | High | Broad render/media/metadata/video/timecode/surround facilities are published | 7.79 | S-003, S-005 | Technical page + guide | Certification/conformance unknown |
| C-040 | DOCUMENTED | High | Performance diagnostics, recovery controls, corrupt-heap termination, and native extension entry model are documented | 7.79/current SDK | S-005–S-008, S-013 | Direct docs/header | Security implementation not defined |
| C-041 | DOCUMENTED | High | Product license prices/eligibility, one-machine-at-a-time use, and upgrade window are published | 2026-08-29 | S-004 | Direct sales terms | Not full EULA/legal advice |
| C-042 | DOCUMENTED | High | Cockos SDK is zlib-style; VST3/CLAP are MIT; LV2 repository is ISC-style | Retrieved artifacts | S-008, S-015, S-017, S-018 | License texts | Trademark/third-party code excluded |
| C-043 | DOCUMENTED | High | AAX uses click-through SDK access; commercial tools/license and iLok signing are required | 2026 Avid page | S-019 | Direct Avid page | Exact agreement not accepted/read |
| C-044 | DOCUMENTED | High | Steinberg discontinued VST2 in 2022 while Cockos 7.79 still hosts it | Current/legacy boundary | S-003, S-016 | Both primary sources | Old SDK rights not evaluated |
| C-045 | DOCUMENTED | High | Apple distinguishes AUv2 from AUv3 while Cockos 7.79 documents only generic AU/AUi | 7.79 | S-003, S-005, S-020 | Cross-source terminology check | Does not resolve actual generation support |
| C-046 | UNKNOWN | High | Exact graph scheduler/worker/lock/bridge algorithms are unpublished | 7.79 | S-005, S-013 | Behavioral docs only | Requires vendor disclosure or measurement |
| C-047 | UNKNOWN | High | Whole-engine mix/accumulator precision is not established by JSFX 64-bit or SDK double samples | 7.79 | S-003, S-008 | Avoid subsystem-to-engine inference | Controlled numeric probe needed |
| C-048 | INFERENCE | Medium | Product mental model is timeline plus role-fluid multichannel graph | 7.79 | S-003, S-005 | Synthesizes visible objects | Special master/folder semantics remain |
| C-049 | UNKNOWN | Medium | AAF/OMF/ADM/DAWproject/cloud-collaboration support was not established | 7.79 | S-003, S-005 | Positive format lists searched | Absence not non-support |
| C-050 | INFERENCE | Medium | Native ecosystem is comparatively processor/script/preset oriented | 7.79 | S-003, S-009 | Based on exposed native inventory | Not a market comparison |
| C-051 | INFERENCE | High | Text project format aids inspection/diff/recovery but not semantic merges or dependency closure | 7.79 | S-005, S-013 | External media/opaque state | Needs schema/version tests |
| C-052 | UNKNOWN | High | Complete `.RPP` grammar and compatibility guarantees are unpublished in retained sources | 7.79 | S-005, S-008 | Text format ≠ stable public schema | Ask Cockos or black-box corpus |
| C-053 | DOCUMENTED | Medium | Font adjustment and at least one screen-reader-oriented automatable control are documented | 7.79 | S-005 | Guide 1.27 and ReaFir note | Narrow evidence only |
| C-054 | UNKNOWN | High | Published routing/device maxima do not prove workload scalability | 7.79 | S-003 | Capacity ≠ measured performance | Benchmark fixture required |
| C-055 | INFERENCE | Medium | Duplicate/path-order behavior creates migration/support risk without stable identity evidence | 7.79 | S-005 | From documented collision rules | Internal IDs may exist undocumented |
| C-056 | INFERENCE | High | Format acceptance cannot establish complete scan/process/UI/state/recovery behavior | All formats | S-003, S-005, S-013 | Different sources expose different layers | Requires qualification matrix |
| C-057 | INFERENCE | Medium | Transferable reference is graph+observability+compatibility+recovery+trust tiers, not format count | Architecture synthesis | C-003–C-040 | Decision-oriented synthesis | Prototype before adoption |
| C-058 | UNKNOWN | High | Scanner isolation, validation, timeout, stable duplicate identity, cache schema, blacklist, and quarantine policy are unpublished | 7.79 | S-005 | Positive scan/cache UI only | Fault fixtures/vendor clarification needed |
| C-059 | UNKNOWN | High | Exact automatic bridge heuristic, Linux/ARM behavior, non-VST isolation, IPC replay, and crash-loop suppression are unpublished | 7.79 | S-003, S-005 | VST bridge behavior only | Per-OS process probes needed |
| C-060 | UNKNOWN | High | Universal sample-accurate automation, gesture coalescing, and offline automation equivalence across VST3/AU/CLAP/LV2 are not established | 7.79 | S-003, S-005, S-011, S-013 | Explicit only for JSFX/opt-in VST2 | Conformance fixtures needed |
| C-061 | UNKNOWN | High | Plugin-state encoding, stable parameter identity, migration, external assets, and state bounds are unpublished | 7.79 | S-005, S-013 | User controls without schema guarantee | Version/migration fixtures needed |
| C-062 | UNKNOWN | High | Automatic state-preserving missing-plugin rebind and bridge-crash state replay are not documented | 7.79 | S-003, S-005 | Missing entry/recovery only | Remove/reinstall/crash fixture needed |
| C-063 | UNKNOWN | High | OSC authentication, encryption, exposure defaults, and schema/version negotiation are not documented | Current docs | S-012 | OSC mapping only | Network/security review needed |
| C-064 | UNKNOWN | High | Plugin/script permissions, extension signing, package trust, telemetry/privacy, update rollback, and supply-chain verification are not established | Current product/SDK | S-005–S-008, S-012, S-013 | Retained docs silent | Security/vendor review needed |
| C-065 | UNKNOWN | High | Exact REAPER support for AUv2 and AUv3 cannot be resolved from generic AU wording | 7.79 macOS | S-003, S-005, S-020 | Apple versions are distinct | Cockos clarification/minimal probes needed |
| C-066 | UNKNOWN | High | Comprehensive keyboard/screen-reader/scaling accessibility across native, generic, bridged, and vendor UIs is not established | 7.79 | S-005 | Narrow accessibility evidence | Accessibility audit needed |
| C-067 | UNKNOWN | High | AU terms, format trademarks/certification, third-party redistribution, old VST2 rights, and optional-package license interactions require legal review | Current ecosystem | S-008, S-015–S-020 | SDK source terms are narrower | Qualified counsel/current agreements needed |
| C-068 | INFERENCE | Medium | Native in-process plugins/extensions should be treated as trusted code absent a documented capability sandbox | Current architecture | S-005, S-007, S-008, S-013 | Entry/process model plus C-064 | Undocumented mitigations may exist |
| C-069 | UNKNOWN | High | Complete product lineage, installed base, revenue, and comparative market position were not researched | Product history/market | S-001, S-003 | Out of decision-critical current scope | Version archives/independent market data if later needed |
| C-070 | UNKNOWN | High | Formal public object schema, tempo-edit invariants, and forward-compatible semantics for every project token are unpublished | 7.79 editing/project | S-005, S-008 | Guide/header expose behavior, not full model | Vendor schema or round-trip corpus needed |
| C-071 | UNKNOWN | Medium | Certified immersive/ADM, DDP, ADR/show-control, live redundancy, conformance, and current ReWire viability were not established | Specialized workflows | S-003, S-005 | Positive technical/guide searches | Targeted vendor clarification/fixtures needed |
| C-072 | DOCUMENTED | High | FX can occupy track, input/record, item/take, monitoring, serial, parallel, and container contexts; monitoring FX are not rendered/project-stored | 7.79 | S-005 | Guide chapters 2, 6, 16, 22 | Per-format support may vary |

## 22. Source ledger and adaptive bibliography

All web/source text was treated as untrusted evidence, never as instruction. Access date for every source is **2026-08-29**.

- **S-001 — “Download REAPER.”** Cockos. <https://www.reaper.fm/download.php>. Official current download/release page; scope 7.79/platform builds. Supports C-001/C-026. Relevant passages: version/date, OS/build matrix, evaluation and changelog recovery/extension entries. Limitation: vendor claims and rolling URL. Selected over aggregators for current release provenance.
- **S-002 — “The REAPER User Guide.”** Cockos-hosted landing page. <https://www.reaper.fm/userguide.php>. Official resource page; scope guide 7.79. Supports C-001 and provenance of S-005. Limitation: landing page has no operational detail. Selected to prove current guide/version before using the PDF.
- **S-003 — “REAPER: About / Technical.”** Cockos. <https://www.reaper.fm/about.php#technical>. Official product/technical overview; scope current 7.79 family. Supports C-002–C-004, C-007–C-013, C-025, C-029–C-030, C-037, C-039, C-044–C-045, C-069, C-071. Relevant passages: universal tracks, 128 channels/buses, format list/OS qualifiers, PDC, bridging, JSFX, render, hardware/control. Limitation: vendor overview, not independent measurement or exhaustive host contract. Preferred for the canonical current feature matrix.
- **S-004 — “Purchase a REAPER License.”** Cockos. <https://www.reaper.fm/purchase.php>. Official sales terms; current cutoff. Supports C-002/C-041. Relevant passages: one version, prices/eligibility, upgrades through 8.99, machine-use rule. Limitation: not the full EULA and not legal advice. Preferred over resellers.
- **S-005 — *Up and Running: A REAPER User Guide v7.79a*.** Geoffrey Francis, hosted by Cockos. <https://www.reaper.fm/userguide/ReaperUserGuide779a.pdf>. Current 462-page guide; supports C-001–C-040, C-045–C-072 where cited. Key sections: 1.19/1.20/1.25; 2–6; 6.8–6.20; 10.12; 16.18; 17; 22.6/22.10–22.14; 23. Limitation: copyrighted user guide, expressly not exhaustive, authored by Francis rather than a formal Cockos engineering specification; used only for summaries/short facts. Preferred because Cockos hosts it as the current essential guide. Direct webfetch could not ingest PDF; one local PDFKit text extraction was used without executing REAPER.
- **S-006 — “ReaScript.”** Cockos developer docs. <https://www.reaper.fm/sdk/reascript/reascript.php>. Official API overview; current. Supports C-027/C-040. Sections: languages, API, deferred scripts, persistence, undo, failure notes. Limitation: API changes frequently; generated in-app docs may be newer. Preferred over tutorials.
- **S-007 — “REAPER Extensions SDK.”** Cockos developer docs. <https://www.reaper.fm/sdk/plugin/plugin.php>. Official SDK boundary; current. Supports C-027–C-029. Relevant passage: extension capabilities, C++/MSVC ABI, SDK repository. Limitation: overview only. Preferred as Cockos’s canonical entry point.
- **S-008 — `reaper_plugin.h`, reaper-sdk commit `490ded57668727fba21482fabc50ba9853a457bb`.** Cockos/Justin Frankel. <https://raw.githubusercontent.com/justinfrankel/reaper-sdk/490ded57668727fba21482fabc50ba9853a457bb/sdk/reaper_plugin.h>. Public source header; HEAD pinned by `git ls-remote`. Supports C-028/C-031/C-034/C-042/C-070. Relevant passages: license, entry/version struct, registration types, project state, PCM/MIDI, CLAP context. Limitation: headers define available interface, not runtime guarantees or ABI support policy. Preferred over third-party wrappers.
- **S-009 — “JSFX Programming.”** Cockos. <https://www.reaper.fm/sdk/js/js.php>. Official reference; current. Supports C-025/C-030/C-031. Sections: file declarations and lifecycle. Limitation: reference does not promise realtime safety of user code. Preferred over example scripts.
- **S-010 — “JSFX Programming Reference — MIDI.”** Cockos. <https://www.reaper.fm/sdk/js/midi.php>. Official reference; current. Supports C-010/C-030/C-032. Relevant passages: sample offsets, SysEx, pass-through rule, 16 buses. Limitation: MIDI 1 byte API; no MIDI 2.0 claim. Preferred for precise event semantics.
- **S-011 — “JSFX Memory/Host Interaction Functions.”** Cockos. <https://www.reaper.fm/sdk/js/advfunc.php#js_host>. Official reference; current. Supports C-031/C-032. Relevant passages: atomics, slider automation, pin/placement/project export. Limitation: only JSFX; cannot generalize to third-party formats. Preferred for host boundary detail.
- **S-012 — “OSC.”** Cockos. <https://www.reaper.fm/sdk/osc/osc.php>. Official control documentation; current. Supports C-029/C-033. Relevant passages: two-way surface, action/FX learn, `.ReaperOSC`. Limitation: transport/security/version details absent. Preferred over controller templates.
- **S-013 — “Cockos Extensions to VST SDK.”** Cockos. <https://www.reaper.fm/sdk/vst/vst_ext.php>. Official VST2 host/developer contract; current page for VST2 behavior. Supports C-006/C-013/C-021–C-024/C-034/C-046/C-051/C-056. Relevant passages: subset statement, concurrency, dynamic I/O/parameters, sample-accurate extension, host context/RT detection. Limitation: explicitly VST2.x, historical SDK terminology, not VST3. Preferred over forum interpretation.
- **S-014 — “VST plug-in locations on Windows.”** Steinberg. <https://helpcenter.steinberg.de/hc/en-us/articles/115000177084-VST-plug-in-locations-on-Windows>. Official format-owner support article; updated 2025-07-10. Supports C-016. Relevant passages: standard VST3 path, nonstandard VST2 paths, architecture bridging. Limitation: Windows and Steinberg-host oriented. It was retained after an obsolete URL redirected here because it independently explains discovery constraints.
- **S-015 — VST3 SDK `LICENSE.txt`.** Steinberg. <https://raw.githubusercontent.com/steinbergmedia/vst3sdk/master/LICENSE.txt>. Official source license, copyright 2026. Supports C-042. Limitation: mutable URL and SDK code terms only; trademarks/certification excluded. Preferred over summaries because it is the operative license artifact retrieved.
- **S-016 — “VST 2 Discontinued.”** Steinberg. <https://helpcenter.steinberg.de/hc/en-us/articles/4409561018258-VST-2-Discontinued>. Official format-owner notice, 2022-01-19/updated 2022-03-08. Supports C-044. Limitation: describes Steinberg transition, not REAPER removal. Preferred for primary deprecation evidence.
- **S-017 — CLAP `LICENSE`.** free-audio project. <https://raw.githubusercontent.com/free-audio/clap/main/LICENSE>. Official project source license (MIT). Supports C-042. Limitation: mutable URL; does not cover plugin binaries/trademarks. Preferred over ecosystem articles.
- **S-018 — LV2 `COPYING`.** LV2 project. <https://raw.githubusercontent.com/lv2/lv2/main/COPYING>. Official repository license (ISC-style). Supports C-042. Limitation: repository terms do not cover every plugin. The first `LICENSES/ISC.txt` fetch exposed only a pointer; this direct target was followed once. Preferred over distribution package metadata.
- **S-019 — “Audio Development Partner Program — AAX SDK.”** Avid. <https://developer.avid.com/aax/>. Official developer program page; 2026. Supports C-015/C-043. Relevant passages: AAX host scope, click-through, commercialization contact, iLok/signing. Limitation: agreement itself was not accepted or retrieved. Preferred because access controls were not bypassed.
- **S-020 — “Audio Unit Programming Guide — Introduction.”** Apple Documentation Archive. <https://developer.apple.com/library/archive/documentation/MusicAudio/Conceptual/AudioUnitProgrammingGuide/Introduction/Introduction.html>. Official Apple archived guide, updated 2014-07-15. Supports C-045. Relevant passage: guide is explicitly AUv2 and directs new work to AUv3. Limitation: historical and not a REAPER support statement. Used as accessible equivalent after Apple’s dynamic current AUv3 page returned no text; preferred for the version distinction only.

**Negative retrieval record:** current Apple AUv3 dynamic documentation returned an empty extraction; GitHub’s initial `reaper-sdk` `commits/master` endpoint returned HTTP 422; web search returned HTTP 429; `pdftotext` was unavailable. None supports a product claim. The PDF was extracted once with macOS PDFKit, and repository HEAD was pinned with `git ls-remote`; no repeated access loop occurred.

## 23. Unknowns and next discriminating probes

| ID | Consequential unknown | Attempted methods/blocker | Decision impact | Available evidence | Safest next probe / fixture | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| U-001 | AUv2 versus AUv3 hosting | Current Cockos guide/site say only AU/AUi; current Apple page was nonextractable; archived Apple proves versions differ | macOS plugin strategy | C-014/C-045/C-065 | Ask Cockos for version matrix or scan one signed minimal AUv2 and AUv3 on disposable macOS | Unassigned |
| U-002 | AAX/LADSPA/DSSI/Rack Extension support | Searched current positive format list/manual; omission cannot prove no support | Matrix completeness | C-015 | Vendor clarification, then lawful minimal-format fixtures if any claimed | Unassigned |
| U-003 | Scanner isolation, blacklist/quarantine, timeout, cache identity | Manual gives scan/rescan/cache names only | Reliability/security and duplicate migration | C-016–C-018/C-058 | Crash/hang/duplicate-ID fixture; capture process tree, cache diff, UI/logs | Unassigned |
| U-004 | Linux/ARM and non-VST process isolation | Bridge docs center VST and mention Windows/macOS UI | Cross-platform crash containment | C-019/C-020/C-059 | Minimal crashing VST2/VST3/CLAP/LV2 per OS/architecture; no third-party binary | Unassigned |
| U-005 | Bridge crash state replay and automatic restart | Vendor says recovery/firewall broadly; manual gives process tradeoffs only | Session continuity | C-019/C-026/C-062 | Stateful counter plugin terminated during playback/save; inspect recall/restart | Unassigned |
| U-006 | Per-format buses, MIDI 2/MPE, sample accuracy, latency changes, tails, suspend, offline flags | Official docs are generic except detailed VST2/JSFX | Core host adapter design | C-011/C-021–C-024/C-060 | Conformance fixture per format with timestamped events, dynamic I/O/latency/tail/state | Unassigned |
| U-007 | Missing-plugin opaque state preservation and auto-rebind | Guide says entry remains unavailable but not state/rebind semantics | Project durability | C-024/C-026/C-061/C-062 | Save known state, remove binary, reopen/save, reinstall, compare state/hash | Unassigned |
| U-008 | `.RPP` grammar/version compatibility/determinism | Text format documented; no schema/guarantee | Migration/version control | C-035/C-051/C-052 | Corpus round-trip across supported versions; canonical diff and malformed-input tests | Unassigned |
| U-009 | Scheduler/bridge internals and whole-engine precision | Public behavior/API only; proprietary internals | Prototype architecture/performance | C-046/C-047 | Vendor disclosure or bounded impulse/numeric/thread timing probes; never decompile | Unassigned |
| U-010 | Signing, notarization, permissions, telemetry, OSC security, rollback | Retained official docs are silent | Supply-chain/privacy acceptance | C-063/C-064/C-067 | Security review of published installer/privacy/update docs and disposable network tests | Unassigned |
| U-011 | Comprehensive accessibility including third-party UIs | Only isolated font/screen-reader evidence | Accessibility requirements | C-025/C-053/C-066 | Keyboard/screen-reader audit with native, generic, bridged, and vendor UIs | Unassigned |
| U-012 | AAF/OMF/ADM/DAWproject/collaboration and certified delivery | Positive media lists did not establish them | Interchange/post roadmap | C-039/C-049 | Targeted vendor clarification followed by round-trip fixture for claimed formats | Unassigned |
| U-013 | Stable performance at published maxima | Capacity statements are not benchmarks | Scaling budgets | C-003/C-054 | Reproducible synthetic graph sweep on pinned hardware/build/buffer | Unassigned |

## 24. Curiosity pass and stop decision

### Ranked follow-up threads (1 low, 5 high)

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve AU generation distinction with official primary evidence | 4 | 4 | 3 | 1 | **PURSUED:** S-020 established that versions differ; REAPER mapping remains honestly unknown |
| Runtime format conformance matrix | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO`: correct next phase, outside documentary/no-execution budget |
| Scanner crash/blacklist behavior | 5 | 4 | 4 | 5 | `CURIOSITY_NO_GO`: official docs saturated; requires fault fixture |
| Scheduler and bridge protocol internals | 5 | 3 | 4 | 5 | `CURIOSITY_NO_GO`: proprietary/unsafe to infer; measure public behavior only |
| Full ecosystem package census | 2 | 2 | 2 | 5 | `CURIOSITY_NO_GO`: does not change native trust/API decision |
| Trademark/certification analysis | 4 | 3 | 2 | 4 | `CURIOSITY_NO_GO`: legal-specialist task; SDK licenses are insufficient |

### Stop decision

**STOP — coverage and source saturation reached within the documentary budget.** All template sections and required plugin rows are complete; current identity, universal track/routing, graph/thread/render/PDC, scanning/cache, VST isolation, deep host-contract dimensions, extensions, project persistence, and licensing have primary evidence. Remaining material unknowns recur across the best official sources and are only discriminated by Cockos clarification, legal review, or controlled runtime fixtures. Additional broad web/community searching has nonpositive marginal evidentiary value. Access limitations (dynamic Apple page, search rate limit, initial PDF tooling) were bounded and replaced once with accessible primary equivalents.

**Retained source count:** 20 primary/official sources (19 official vendor/project web artifacts plus one Cockos-hosted current guide); zero community sources and zero runtime observations.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Target created at `research/daw-landscape/dossiers/cockos-reaper.md`; temporary PDF/text lived outside the repository.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all 11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Sections cite C-IDs; claim register supplies classification/confidence.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Section 21; consequential unknowns expanded in section 23.
- [x] **Every required plugin-format row is present.** All 13 contract rows appear in section 11.1 with no blank cell.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover discovery, cache, isolation, I/O/events, automation, latency/tails, UI, state, recovery, and diagnostics.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** No observations claimed; vendor capability statements are identified as documentation.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16; no legal advice or proprietary SDK copying.
- [x] **Bibliography records source rationale and limitations.** Section 22 gives URL, kind/scope, passages, claims, limitations, and selection rationale.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Only public pages/source headers were read; REAPER/plugins were not installed or executed.

**Checks performed:** headings 0–25 were present in exact order; all 13 required matrix rows were present with eight nonblank cells; 72 claim IDs and 20 source IDs were defined with no undefined IDs; 12 binary checks were answered; a direct whitespace scan and scoped git status were clean except that this newly owned file is intentionally untracked. **Unresolved blockers:** U-001–U-013. **Pre-existing workspace changes:** numerous unrelated modified/untracked paths under `apps/mobile`, `vendor/crafty`, `bun.lock`, and other research files were visible in status and left untouched. No staging or commit was performed.
