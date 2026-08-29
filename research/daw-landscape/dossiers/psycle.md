# Psycle DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** Psycle Modular Music Creation Studio.
- **Canonical upstream:** Psycle project on SourceForge.
- **Researcher/session:** subagent, `ses_fb274aeb2ffeXqakv0mhrF1F5h`.
- **Owned path:** `research/daw-landscape/dossiers/psycle.md`.
- **Research date / cutoff:** 2026-08-29 UTC.
- **Version scope:** last public binary found is `1.12.5alpha-2` for Windows x86/x64 (2024-04-14); SourceForge's default stable download remains `1.12.0`; source scope is immutable SVN revision 12005 (2025-05-08). [C-002] [C-003]
- **Edition/platform scope:** one free/open-source family; Windows binaries are documented. SourceForge also labels the project Linux, but a current full Linux GUI release was not established. No macOS, mobile, or web product was established. [C-005] [C-006]
- **Inclusions:** tracker/sequencer, machine graph, C engine and legacy Windows host boundaries, native/Lua machines, public plugin-host source, and song persistence.
- **Exclusions:** third-party `cpsycle-lib` forks; dynamic execution; installer/plugin probing; private internals; independent conformance or performance claims.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. Evidence is sufficient for the architecture comparison, but release enablement and many modern host-contract details remain unknown. [C-004] [C-037]

## 1. Executive summary

Psycle's documented differentiator is a tracker-style pattern sequencer coupled to a freely wired machine graph rather than a conventional track-strip-first DAW. The official project describes its own plugin API, VST2, a tracker sampler, routable Machine View, and internal mixer/master machines; the current source makes the graph, sequencer, sampler, plugin, audio-driver, and persistence boundaries inspectable. [C-001] [C-007] [C-008]

The deepest documented third-party boundary is legacy VST2. Current source shows scanning/caching, instruments versus effects, audio I/O counts, MIDI in/out, event-offset rendering, parameters/programs, embedded custom editors, program-chunk or parameter-array recall, and optional opposite-bitness loading through the separately installed jBridge proxy. [C-017] [C-018] [C-019] [C-022] [C-028] [C-029] [C-030]

This is not a modern sandbox model: normal VST2 loading is source-evidently direct library loading, while any process boundary is delegated to jBridge. Psycle-native crash containment, scanner quarantine, blacklisting, VST3, plugin delay compensation, and a complete sidechain/multi-bus/dynamic-I/O contract remain unknown. [C-020] [C-021] [C-027] [C-037]

PSY3 is a versioned chunked song format containing sequence/pattern content, machines and graph wiring, plugin identity/state, instruments, and samples. Missing-plugin placeholder/relink behavior and recovery semantics were not established. [C-023] [C-030] [C-031] [C-038]

**Overall confidence:** high for public source structure and VST2/PSY3 code paths; medium for what is enabled in the 2024 alpha installers; low for unsupported-format conclusions, current release support, and undocumented runtime behavior. [C-004] [C-016] [C-027]

## 2. Product identity, history, and market position

The official project calls Psycle a music tracker in the FastTracker 2 / Impulse Tracker tradition combined with plugin modularity. It identifies advanced end users, developers, and desktop end users as audiences and records project registration on 2000-09-04. [C-001]

The binary lineage is unusually split: SourceForge's default download designates `1.12.0`, while its official file feed lists later x86 and x64 `1.12.5alpha-2` installers dated 2024-04-14. [C-002]

The source is not simply abandoned: revisions 12000–12005 in May 2025 migrated projects toward Visual Studio 2022 and fixed build configuration. Whether users receive supported releases, security fixes, or a stable post-1.12.0 channel is nevertheless **UNKNOWN** because no post-alpha release/support policy was found and the community website was inaccessible. [C-003] [C-004]

Windows is the only full current product platform evidenced by public installers. SourceForge's project-level “Linux, Windows” label and Debian/source modules do not establish parity or a current packaged Linux GUI; macOS/mobile/web products were not found. [C-005] [C-006]

## 3. Workflow and conceptual model

The user model combines reusable tracker patterns with a sequence and a separate machine graph. Official screenshots label tracker-like patterns and routing in Machine View; current PSY3 code separately persists sequence tracks, pattern events, machines, and connections. [C-007] [C-023]

Sequence entries can represent patterns, samples, or markers. Pattern events carry track, PPQ-tick offset, note, instrument, machine, volume, command, and parameter fields. [C-012] [C-023]

Machines are generators, effects, mixers, samplers, or utility devices connected by wires; pattern events target machines rather than requiring one fixed instrument/effect strip per tracker track. [C-007] [C-014] [C-015]

Conventional linear audio-clip editing, takes/lanes, comping, warping, notation, and post workflows are **UNKNOWN**, not inferred absent merely because the inspected source centers patterns and machines. [C-034]

## 4. Publicly documented architecture

Immutable revision 12005 exposes modules for the C implementation (`cpsycle`), legacy Windows application (`psycle`), audio drivers, core/helpers/player, native plugins, build systems, and Debian packaging. [C-008]

Within the C audio module, public files separate connections/wires, machines/factory/proxy, player/sequencer/patterns, audio/event drivers, samplers, plugin catchers, VST2/LADSPA/LV2/Lua adapters, presets, and PSY2/PSY3/song I/O. The Windows host separately exposes MFC UI, ASIO/WASAPI/DirectSound/WaveOut drivers, VST2.4 and LADSPA hosts, Lua host, machine view, mixer, MIDI, and rendering UI. [C-008] [C-010] [C-016]

The module map documents source boundaries, not runtime process boundaries. Thread scheduling, lock-free behavior, multicore topology, and whether the C and legacy host paths are all present in the public alpha binaries remain **UNKNOWN**. [C-009]

## 5. Audio engine

The source documents a directed connection model with input/output sockets, per-incoming-wire volume, master and mixer machines, audio recorder/file-output paths, and Windows ASIO, WASAPI, DirectSound, and WaveOut backends. [C-010] [C-014]

The VST2 adapter sets the plugin sample rate, requests 32-bit processing precision, sets a nominal block size of 512, starts/stops processing, and renders subranges around tracker events. This is evidence about the VST2 adapter, not a claim that the entire engine always runs fixed 512-sample buffers. [C-017] [C-028]

Documentary evidence did not establish supported device sample-rate ranges, engine-wide numerical precision, variable-block guarantees, multicore scheduling, plugin delay compensation, latency/tail reporting, freeze, oversampling, dropout recovery, or a distinct faster-than-real-time render path. These remain **UNKNOWN**. [C-011]

## 6. Tracks, timeline, clips, and editing

The PSY3 model stores multiple named sequence tracks with ordered pattern, sample, and marker entries, reposition offsets, and track heights. Patterns have names, tracker tracks, lengths, time signatures, PPQ resolution, and event lists. [C-012] [C-023]

The source tree also contains pattern block selection, commands, sequence commands/editor support, and WAV/XM/IT-related I/O surfaces, but the exact user-facing undo/history and destructive versus non-destructive edit contract was not established. [C-024] [C-038]

Takes, lanes, comping, grouping, ripple modes, elastic audio, and clip-version history are **UNKNOWN**. [C-034]

## 7. MIDI, sequencing, notation, and expression

Current source includes MIDI input, MIDI-file loading and song export, 16 VST MIDI-channel columns, tracker note-on/off/velocity generation, CC events, all-notes-off/all-sound-off on stop, and VST-generated MIDI returned to the sequencer input path. [C-012] [C-029]

Pattern “tweak” commands address machine parameters. The VST2 host divides work at event offsets before applying changes, but its host callback reports `kVstAutomationUnsupported`; therefore this is documented pattern-event control, not conventional VST automation-lane support. [C-028]

Notation, MPE/per-note expression, MIDI 2.0, SysEx guarantees, MTC, and detailed clock synchronization are **UNKNOWN**. [C-013]

## 8. Routing, mixer, automation, and control

Machine connections are explicit input/output wire sockets, and PSY3 persists graph endpoints, connection state, incoming gain, machine bypass/mute/pan, graph coordinates, parameter mappings, and bus designation. The official project also shows internal mixer/master routing. [C-014] [C-030]

Pattern events can change parameters, bypass, mute, and pan. VST2 timing exposes sample position, PPQ position, tempo, bar start, time signature, playing/transport-changed flags, and samples-to-next-clock. [C-028] [C-029]

Aux sends, feedback-cycle policy, sidechains, surround/immersive layouts, VCA/folders, OSC, control-surface APIs, and DAW-style read/touch/latch/write automation are **UNKNOWN**. [C-037]

## 9. Recording, comping, and media handling

Official evidence says a song can be recorded fully or partly to WAV. Current source contains audio-recorder/file-output machines and WAV I/O, plus loaders/exporters for MIDI, XM, IT modules, and EXS24-related sample data. [C-010] [C-024]

Source presence does not establish every format's released-build enablement or fidelity. Input monitoring, punch/loop recording, take comping, video, metadata, proxy media, asset collection, and relinking are **UNKNOWN**. [C-034] [C-038]

## 10. Instruments, effects, content, and native devices

The current plugin catcher registers XM Sampler, classic Sampler, Dummy, Mixer, Duplicator, Duplicator2, and Audio Recorder internally; the source and official project also expose Master and tracker-style sample playback. [C-015]

Psycle has a documented native binary plugin API and source-visible Lua machine/plugin facilities. LADSPA and LV2 adapters also exist in current C source behind build flags. [C-001] [C-016]

The bundled binary-plugin inventory, factory presets/content licensing, modulation system, macro model, and exact devices shipped in each installer are **UNKNOWN**. [C-016]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means no qualifying evidence established the requested host boundary; it does not mean unsupported. `NOT_APPLICABLE` is used only where no Psycle product was documented for that platform. [C-006] [C-027]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE:no documented macOS product | DOCUMENTED | UNKNOWN | NOT_APPLICABLE:no documented product | Official project plus r12005 host source; x86/x64 1.12.5 alpha installers | VST2.4; normal direct load; optional jBridge; release-qualified Linux host unknown | C-001, C-017–C-022, C-028–C-030; S-001, S-008–S-010 |
| VST3 | NOT_APPLICABLE:no documented macOS product | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no documented product | No VST3-named implementation in the two enumerated r12005 host trees | Evidence scarcity; absence from enumerated trees is not proof of non-support | C-027; S-006, S-007 |
| AUv2 | NOT_APPLICABLE:no documented macOS product | NOT_APPLICABLE:Apple host format/no macOS product | NOT_APPLICABLE:Apple host format | NOT_APPLICABLE:no documented product | None found | No applicable Psycle platform was documented | C-006, C-027 |
| AUv3 | NOT_APPLICABLE:no documented macOS product | NOT_APPLICABLE:Apple host format/no macOS product | NOT_APPLICABLE:Apple host format | NOT_APPLICABLE:no documented product | None found | No applicable Psycle platform was documented | C-006, C-027 |
| AAX | NOT_APPLICABLE:no documented macOS product | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no documented product | None found | Evidence scarcity; no AAX claim made | C-027 |
| CLAP | NOT_APPLICABLE:no documented macOS product | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no documented product | None found | Evidence scarcity | C-027 |
| LV2 | NOT_APPLICABLE:no documented macOS product | DOCUMENTED:source boundary; UNKNOWN:public-build enablement | DOCUMENTED:source boundary; UNKNOWN:full-product release | NOT_APPLICABLE:no documented product | r12005 C engine has LV2 plugin/parameter and scan paths behind `PSYCLE_USE_LV2` | Source implementation is not release/runtime qualification | C-016, C-027; S-006, S-009 |
| LADSPA | NOT_APPLICABLE:no documented macOS product | DOCUMENTED:source boundary; UNKNOWN:public-build enablement | DOCUMENTED:source boundary; UNKNOWN:full-product release | NOT_APPLICABLE:no documented product | r12005 C and Windows host trees contain LADSPA adapters | Host source present; released enablement/conformance unknown | C-016, C-027; S-006, S-007, S-009 |
| DSSI | NOT_APPLICABLE:no documented macOS product | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no documented product | None found | Evidence scarcity | C-027 |
| JSFX | NOT_APPLICABLE:no documented macOS product | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no documented product | None found | Evidence scarcity | C-027 |
| DirectX/DXi | NOT_APPLICABLE:no documented macOS product | UNKNOWN | NOT_APPLICABLE:Windows plugin family | NOT_APPLICABLE:no documented product | DirectSound driver source exists, but that is not DXi-host evidence | Do not conflate audio backend with plugin hosting | C-010, C-027; S-007 |
| Rack Extension | NOT_APPLICABLE:no documented macOS product | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no documented product | None found | Evidence scarcity; no trademark/SDK rights implied | C-027 |
| Product-native/other | NOT_APPLICABLE:no documented macOS product | DOCUMENTED | DOCUMENTED:source boundary; UNKNOWN:full-product release | NOT_APPLICABLE:no documented product | Own binary plugin API, Lua machines; current source adapters | Native binary and Lua scan paths; bundled/released inventory unknown | C-001, C-015, C-016, C-018; S-001, S-006, S-009 |

### 11.2 Discovery, scanning, validation, and recovery

The current C catcher accepts configured multi-path strings separated by semicolons or commas. It recursively scans architecture-specific native and VST2 directories and LADSPA directories; Lua and LV2 tasks are nonrecursive. Scan tasks test candidate modules, emit start/end/file/progress signals, support user abort, rebuild the registry, and persist/load a plugin cache. [C-018]

Native and VST2 scan tasks distinguish 32-bit and 64-bit paths; opposite-bitness VST scanning is added when `plugins.usejbridge` is enabled. Shell sub-plugins receive an index, and project lookup type-checks cached identities. [C-018] [C-019]

Duplicate selection, cache invalidation criteria, explicit validation subprocesses, blacklist/quarantine, code-signature checks, retry UX, and crash-safe rescan behavior are **UNKNOWN**. [C-021]

### 11.3 Runtime isolation and compatibility

**INFERENCE:** normal VST2 operation is in-process because source loads the plugin library and calls `VSTPluginMain`/`main` directly. A plausible alternative for specific plugins is the separately enabled jBridge path. [C-020]

On Windows, optional jBridge code reads `HKLM\Software\JBridge`, selects `Proxy32` or `Proxy64`, detects bootstrap wrappers, resolves `BridgeMain`, and can ask the proxy to load an opposite-bitness plugin path. This documents bridge integration, not jBridge's internal process/security guarantees. [C-019]

Psycle-native sandboxing, process-per-plugin modes, crash restart, architecture translation without jBridge, and host/plugin trust policy are **UNKNOWN**. [C-021]

### 11.4 Host/plugin processing contract

VST2 source distinguishes synth generators from effects, reports plugin-declared input/output counts, provides 16 MIDI channels, sends notes/CCs and receives MIDI, supplies transport/tempo/time-signature data, and performs 32-bit processing. [C-017] [C-029]

Tracker parameter events can split processing at their event offsets. However, the host reports VST automation unsupported, and sample-accurate automation as a general host guarantee was not established. [C-028] [C-037]

Sidechain bus negotiation, true multi-bus/multi-output routing semantics, MPE/MIDI 2.0, latency/tail reporting, plugin delay compensation, suspend, offline mode, dynamic I/O, and deterministic bypass semantics are **UNKNOWN**. [C-037]

### 11.5 Parameters, automation, state, presets, and project recall

The VST2 adapter enumerates parameters and programs/banks and exposes normalized values through Psycle machine parameters. Pattern tweak events address those parameters. [C-017] [C-028]

For project recall, VST2 saves the current program and either a plugin-provided chunk or every parameter value; load restores the matching representation. Presets can include parameter values, a chunk, and VST magic/unique-ID/version metadata. [C-030]

PSY3 saves a module basename plus shell index, machine-specific state, mappings, and graph data. The catcher's fallback name substitutions for a few legacy plugins document migration special cases, not a general migration framework. [C-030] [C-031]

External asset-reference semantics, stable parameter-ID migration, missing-plugin placeholders, round-trip preservation while missing, and recovery from corrupt plugin state are **UNKNOWN**. [C-031] [C-038]

### 11.6 UI, diagnostics, and failure modes

VST2 custom editors are opened against a host-provided handle, queried for dimensions, idled, resizable through the host callback, and closed by the adapter. A generic parameter surface is implied by exposed machine parameters, but headless behavior and DPI/scaling guarantees were not established. [C-022]

The scanner emits progress/file signals and VST metadata probing catches Windows structured exceptions around metadata extraction. That is not process isolation and does not establish containment of arbitrary scan/render crashes. [C-018] [C-021]

User-facing failure messages, logs, quarantine/blacklist UX, missing-plugin UI, custom-editor detachment, accessibility, and HiDPI behavior are **UNKNOWN**. [C-021] [C-031] [C-036]

## 12. Extensibility and integration

Psycle documents its own binary plugin API, and current source includes native module scanning plus Lua plugin/host, editor, GUI, MIDI-input binding, and DSP helper surfaces. [C-001] [C-016]

LADSPA and LV2 adapters are source-visible extension boundaries, but build enablement and compatibility stability for public binaries are not established. [C-016]

An SDK compatibility policy, semantic versioning, external scripting documentation, controller API, OSC/remote API, and third-party certification/trademark rights are **UNKNOWN**. [C-027]

## 13. Project format, persistence, interoperability, and collaboration

The current saver writes a versioned `PSY3`/`SONG` chunk container. Chunks cover metadata (`INFO`), song settings (`SNGI`), sequence tracks (`SEQD`), patterns (`PATD` plus extended events), machines (`MACD`), instruments, samples, and virtual generators. [C-023]

Machine records include type, module basename/shell index, bypass/mute/pan, graph coordinates, connections/gains, edited name, machine-specific state, wire mapping, parameter mapping, and bus state. VST state is embedded through the machine-specific path. [C-030]

Current source also contains PSY2 conversion/loading, PSY3 loading/saving, XM import/export, MIDI import/export, IT loading, WAV I/O, and EXS24 loading surfaces. Presence establishes implementation scope only, not fidelity or public-build enablement. [C-024]

Autosave, crash recovery, undo-history persistence, corruption tolerance, backward/forward compatibility guarantees, asset collection, missing-dependency preservation, AAF/OMF/ADM/MusicXML/DAWproject interchange, and collaboration/version control are **UNKNOWN**. [C-031] [C-038]

## 14. Delivery, live, post-production, and specialized workflows

Official evidence supports full or partial WAV recording/rendering, and current source includes audio-recorder/file-output paths. [C-010]

Batch export, loudness metering, DDP, video/timecode/ADR, surround/immersive/ADM, show control, and documented live-performance recovery are **UNKNOWN**. [C-035]

The architecture-relevant specialty is modular tracker composition: patterns address a freely routed machine graph, including samples and plugin generators/effects. [C-007]

## 15. Performance, reliability, security, and accessibility

Public source shows an exclusive-lock abstraction, scan abort/progress signals, Windows exception handling around VST metadata extraction, and an optional external jBridge compatibility path. These do not establish real-time safety, sandboxing, or fault recovery. [C-018] [C-019] [C-021]

Maximum tracks/machines, CPU scaling, multicore scheduling, latency compensation, crash containment, update/rollback, binary signing/notarization, telemetry/privacy, localization beyond project metadata, keyboard/screen-reader accessibility, and tested hardware/OS matrices are **UNKNOWN**. [C-009] [C-011] [C-036]

## 16. Licensing, ecosystem, and implementation constraints

SourceForge labels the project GPLv2 and Public Domain. Inspected current C files state redistribution/modification under GPL version 2 or, at the user's option, any later version. Exact component-by-component provenance must therefore be audited rather than treating the whole mixed tree as one uniform grant. [C-026]

VST2 support is documented behavior, not evidence that a new implementer can obtain or redistribute Steinberg's discontinued VST2 SDK. jBridge is a separate third-party dependency whose license and process guarantees were not researched here. [C-019] [C-027]

No format name in this dossier grants trademark, SDK, redistribution, signing, certification, or compatibility rights. Legal qualification remains outside this research scope. [C-027]

## 17. Strengths, liabilities, and architecture lessons

**Strengths:** the pattern/graph separation is unusually explicit; open source exposes graph, host, and persistence boundaries; PSY3 co-locates machine graph and plugin state; and VST2 handling covers more than format discovery. [C-007] [C-008] [C-017] [C-023] [C-030]

**Liabilities:** the public plugin center of gravity is VST2, normal loading appears in-process, opposite-bitness support depends on jBridge, and modern interoperability/recovery features remain undocumented. [C-019] [C-020] [C-021] [C-027] [C-037]

**INFERENCE:** Psycle is a valuable clean-room reference for modular tracker object boundaries and durable graph serialization, but a weak sole reference for a current cross-platform plugin host. Alternative interpretation: uninspected code or builds may support more formats; that possibility is why unsupported-format claims remain unknown. [C-032]

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Support | Prerequisites/tradeoffs/adaptation risk |
| --- | --- | --- | --- | --- |
| CANDIDATE | Decouple note/pattern organization from signal flow | Stable machine IDs plus an explicit directed wire graph, with patterns targeting machines | C-007, C-014, C-023 | Requires cycle policy, graph validation, latency model, and UI discoverability; do not copy Psycle UI/expression |
| CANDIDATE | Preserve a modular song durably | Versioned, size-delimited chunks for sequence, patterns, machines, connections, state, and assets | C-023, C-030 | Needs unknown-chunk preservation, migrations, integrity checks, and missing-device placeholders not evidenced here |
| CONDITIONAL | Keep scans responsive and reusable | Configurable paths, per-format tasks, progress/file signals, abort, and persisted metadata cache | C-018 | Must add isolated qualification, cache fingerprints, quarantine, diagnostics, and duplicate policy |
| CONDITIONAL | Bridge legacy plugin architectures | Explicit opt-in compatibility provider with separate 32/64 paths | C-019 | Third-party dependency, security/process uncertainty, licensing, and obsolete VST2 ecosystem |
| CONDITIONAL | Schedule tracker control precisely | Divide render work at event offsets before applying parameter/note events | C-028 | Generalize to validated sample offsets and a documented automation model; current VST automation callback is unsupported |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT:** direct in-process loading as the only qualification/runtime mode. A plugin can execute during scanning and normal loading; metadata exception handling is not crash containment. Reopen only if a disposable probe demonstrates a separate-process mode not found in the source. [C-020] [C-021]
- **REJECT:** file-basename/shell-index identity as a sufficient modern plugin identity. PSY3 persistence and catch lookup show this legacy mechanism, while collision/migration behavior is unknown. Reopen only with compatibility fixtures. [C-018] [C-030] [C-031]
- **REJECT:** infer “unsupported” from absent VST3/CLAP/etc. names. The enumerated trees provide negative evidence, not proof. [C-027]
- `CURIOSITY_NO_GO` — audio scheduler deep dive: relevant but would not change the plugin-format or graph conclusion within this documentary budget. [C-009]
- `CURIOSITY_NO_GO` — exhaustive LADSPA/LV2 conformance: source boundaries are visible, but released enablement needs builds/probes rather than more filename reading. [C-016]
- `CURIOSITY_NO_GO` — historical community-manual recovery: the community site was inaccessible, and current immutable source was preferable.
- `CURIOSITY_NO_GO` — third-party `cpsycle-lib`: not canonical product/release evidence.
- `CURIOSITY_NO_GO` — installer execution: unnecessary and prohibited by the research contract.

## 20. Falsifiable hypotheses and adversarial checks

1. **H1 supported:** Psycle's primary composition model is tracker patterns plus a separate machine graph. Official description/screenshots and PSY3 boundaries agree. [C-001] [C-007] [C-023]
2. **H2 refined:** VST2 is the strongest documented third-party boundary; native/Lua are also first-class, while LADSPA/LV2 are source-visible with release enablement unknown. [C-016] [C-017] [C-027]
3. **H3 falsified:** “The project has had no maintenance since the old stable release.” Official SVN shows 2024 build/jBridge work and 2025 Visual Studio migration commits. [C-003] [C-019]
4. **H4 falsified:** “Pattern parameter changes imply full VST automation.” The source segments rendering for tweaks but explicitly reports VST automation unsupported. [C-028]
5. **H5 supported as inference only:** normal VST2 loads in-process. The loader calls the binary entry directly; jBridge is a separate optional path. A later dynamic process probe could still find configuration not inspected here. [C-020]
6. **Counterevidence search:** no VST3-named adapter appeared in either current C audio or legacy Windows host enumeration; this narrows discovery but cannot prove unsupported status. [C-027]
7. **Later safe probes:** in a disposable Windows VM, qualify accepted/scanned/instantiated/rendered/state-restored separately for VST2 x86/x64, bridged VST2, LADSPA, and LV2; inject scan/render crashes; move/rename plugins; reload missing state; measure event offsets and latency. No probe was run here. [C-021] [C-031] [C-037]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Psycle is a tracker plus plugin modularity with its own API, VST2, and tracker sampler. | Official project identity | S-001 | Direct project description | Vendor/upstream documentation, not independent runtime test |
| C-002 | DOCUMENTED | High | Last public binary found is 1.12.5alpha-2 x86/x64 dated 2024-04-14; default stable download is 1.12.0. | SourceForge files at cutoff | S-001, S-002 | Artifact names/dates and default download | “Latest” channel semantics are inconsistent |
| C-003 | DOCUMENTED | High | Official source advanced through r12005 on 2025-05-08 with VS2022 migration/build fixes. | SVN trunk | S-003, S-004 | Immutable revision/log | Source activity does not prove supported binary release |
| C-004 | UNKNOWN | Low | Current stable-release/support/maintenance policy after the 2024 alpha is unknown. | Product status at cutoff | S-001–S-004 | Website inaccessible; no policy/release located | Next probe: maintainer statement or signed release notes |
| C-005 | DOCUMENTED | High | Public 1.12.5 alpha installers are Windows x86/x64. | Binary artifacts | S-002 | PE installer titles explicitly identify architectures | No installer execution performed |
| C-006 | UNKNOWN | Low | Full current Linux GUI parity/release and any macOS/mobile/web product are unknown; only project-level Linux metadata/source packaging was found. | Platforms | S-001, S-003 | Metadata is broader than binary evidence | Next probe: official packaged release/build instructions |
| C-007 | DOCUMENTED | High | User model combines tracker patterns, sequence, and routable machine graph. | Product/current source | S-001, S-006, S-011 | Official screenshots plus persisted object boundaries | UX details not dynamically observed |
| C-008 | DOCUMENTED | High | Source separates C engine, Windows host, drivers, core/helpers/player, plugins, build, and packaging modules. | r12005 | S-003, S-006, S-007 | Immutable tree | Module presence is not deployment topology |
| C-009 | UNKNOWN | Low | Threading, multicore scheduling, process topology, and real-time synchronization guarantees are unknown. | Audio architecture | S-003, S-006 | Not resolved within budget | Next probe: scheduler/player source review plus instrumentation |
| C-010 | DOCUMENTED | Medium | Source/public page expose graph routing, recorder/file output, WAV rendering, and Windows ASIO/WASAPI/DirectSound/WaveOut backends. | Official source/product | S-001, S-006, S-007 | Named implementations and official screenshot | Build/runtime enablement not tested |
| C-011 | UNKNOWN | Low | Engine sample-rate range, precision guarantee, block model, multicore, PDC, latency/tails, freeze, oversampling, and dropout policy are unknown. | Audio engine | S-006, S-010 | VST adapter details do not answer engine-wide contract | Next probe: engine docs/source and latency fixture |
| C-012 | DOCUMENTED | High | Sequence/pattern and MIDI source covers pattern/sample/marker entries, MIDI input/import/export, and tracker event fields. | r12005 | S-006, S-011 | Direct source sections | User-facing completeness not tested |
| C-013 | UNKNOWN | Low | Notation, MPE, MIDI 2.0, SysEx guarantees, and MTC are unknown. | MIDI/expression | S-006, S-010 | No qualifying positive evidence | Absence from inspected files is not proof |
| C-014 | DOCUMENTED | High | Machines connect through explicit sockets/wires with persisted gain, bypass/mute/pan, positions, mappings, and bus state. | r12005/PSY3 | S-001, S-006, S-011 | Direct serializer and official graph view | Feedback and latency policy unknown |
| C-015 | DOCUMENTED | High | Current catcher registers XM Sampler, Sampler, Dummy, Mixer, two Duplicators, and Audio Recorder; Master is source/officially visible. | r12005 | S-001, S-006, S-009 | Direct registration and source inventory | Shipped binary inventory unknown |
| C-016 | DOCUMENTED | Medium | Native binary, Lua, LADSPA, and LV2 adapter/scan code exists; LADSPA/LV2 public-build enablement is unknown. | r12005 source | S-006, S-007, S-009 | Compile-guarded implementation | Do not equate source with released conformance |
| C-017 | DOCUMENTED | High | VST2 adapter loads effects, classifies synth/FX, exposes I/O/parameters/programs, sets sample rate, 32-bit precision, and nominal 512 block size. | r12005 C VST2 | S-010 | Direct functions/dispatch | No independent plugin qualification |
| C-018 | DOCUMENTED | High | Catcher has configurable multi-path tasks, recursive rules, module tests, progress/abort, architecture keys, shell indices, and persisted cache. | r12005 C catcher | S-009 | Direct scan/cache functions | Duplicate/cache invalidation UX unknown |
| C-019 | DOCUMENTED | High | Optional Windows jBridge uses registry Proxy32/Proxy64, bootstrap detection, and BridgeMain for cross-bitness scan/load paths. | r11998/r12005 | S-005, S-008–S-010 | Direct source | jBridge internals/license/security not established |
| C-020 | INFERENCE | Medium | Normal VST2 is in-process because the host directly loads the library and invokes its entry; jBridge is the alternative. | r12005 VST2 | S-010 | Assumes no unseen wrapper around shown loader | Dynamic process inspection could refine |
| C-021 | UNKNOWN | Low | Native sandboxing, scan isolation, quarantine/blacklist, crash restart, and signing policy are unknown. | Plugin reliability/security | S-009, S-010 | Exception catch/progress are not isolation | Next probe: crash fixture in disposable VM |
| C-022 | DOCUMENTED | High | VST2 custom editors open on a host handle, report size, idle/resize, and close. | r12005 VST2 UI | S-010 | Direct editor functions/callback | DPI, detachment, headless behavior unknown |
| C-023 | DOCUMENTED | High | PSY3 is versioned/chunked and stores metadata, song/sequence/pattern, machine, instrument, sample, and virtual-generator data. | r12005 PSY3 | S-006, S-011 | Direct header/chunk writers | Loader compatibility not tested |
| C-024 | DOCUMENTED | Medium | Current source contains PSY2/PSY3, XM, MIDI, IT, WAV, and EXS24-related I/O implementations. | r12005 source | S-006 | Immutable file inventory | Fidelity and build enablement unknown |
| C-025 | UNKNOWN | Low | Project migration, external asset, missing dependency, and collaboration guarantees are unknown. | Persistence/interchange | S-006, S-011 | Not resolved by saver alone | Superseded by focused C-031/C-038 probes |
| C-026 | DOCUMENTED | High | SourceForge labels GPLv2/Public Domain; inspected C files state GPLv2-or-later. | Licensing metadata/files | S-001, S-008–S-011 | Direct notices | Mixed component provenance needs audit; not legal advice |
| C-027 | UNKNOWN | Low | VST3, AU, AAX, CLAP, DSSI, JSFX, DXi, and Rack Extension hosting are not established; LV2/LADSPA release scope is incomplete. | Required matrix | S-006, S-007 | Negative tree enumeration only | Absence is not proof of unsupported behavior |
| C-028 | DOCUMENTED | High | Pattern tweaks segment VST2 rendering at event offsets, while host automation callback returns unsupported. | r12005 VST2 | S-010 | Direct event loop/callback | General sample-accurate automation not established |
| C-029 | DOCUMENTED | High | VST2 handles MIDI input/output, notes/CCs, 16 channels, I/O counts, and transport/tempo/time-signature data. | r12005 VST2 | S-010 | Direct adapter/callback | MPE, sidechains, dynamic buses unknown |
| C-030 | DOCUMENTED | High | VST state saves chunk or parameters/program; PSY3 saves module basename/shell index, machine state, graph, mappings, and bus state. | r12005 VST2/PSY3 | S-009–S-011 | Coupled adapter and serializer | Asset/missing-plugin durability unknown |
| C-031 | UNKNOWN | Low | Missing-plugin placeholder, relink UI, round-trip state preservation, and general migration behavior are unknown. | Project recall | S-009, S-011 | Empty lookup and special substitutions do not show recovery object | Next probe: remove/rename fixture and resave |
| C-032 | INFERENCE | Medium | Psycle is a strong modular-tracker/persistence reference but weak sole reference for a current cross-platform host. | Architecture decision | C-007–C-031 | Decision synthesis | More build qualification could improve host assessment |
| C-034 | UNKNOWN | Low | Linear clip/take/comp/warp, notation, video, advanced recording/editing, and asset relinking are unknown. | Workflow/media | S-001, S-006, S-007 | Not established in retained evidence | Next probe: official manual or safe UI review |
| C-035 | UNKNOWN | Low | Batch/loudness/DDP/video/ADR/surround/immersive/show-control delivery is unknown. | Delivery | S-001, S-006 | WAV output alone is insufficient | Next probe: official render manual/UI |
| C-036 | UNKNOWN | Low | Scaling limits, signing/update policy, telemetry/privacy, accessibility, localization, and tested platform matrix are unknown. | NFR | S-001–S-004 | No qualifying policy/test evidence | Next probe: release/support and accessibility docs |
| C-037 | UNKNOWN | Low | Sidechains, multi-bus/dynamic I/O, latency/tails/PDC, suspend/offline, MPE, and full sample-accurate automation remain unknown. | Plugin contract | S-010 | Basic I/O/events do not prove advanced contract | Next probe: format fixtures and engine instrumentation |
| C-038 | UNKNOWN | Low | Autosave, crash recovery, persistent undo, corruption tolerance, compatibility guarantees, archives, and collaboration are unknown. | Persistence | S-006, S-011 | Saver format alone is insufficient | Next probe: loader/recovery docs and fixtures |

## 22. Source ledger and adaptive bibliography

All fetched content was treated as untrusted evidence, never as instructions. Access date for every retained source: **2026-08-29**.

- **S-001 — “Psycle Modular Music Creation Studio.”** Psycle project / SourceForge. <https://sourceforge.net/projects/psycle/>. Official project page; current mutable metadata. Scope: project family. Relevant passages: tracker plus plugin modularity; own API/VST2/sampler; feature screenshots; stable download; OS/audience/license metadata. Supports C-001, C-002, C-006, C-007, C-010, C-014, C-015, C-026. **Limit:** vendor/upstream claims and aggregate platform metadata. **Why selected:** canonical project page, preferable to download mirrors and reviews.
- **S-002 — official Psycle file RSS.** Psycle project / SourceForge. <https://sourceforge.net/projects/psycle/rss?path=/>. Official artifact metadata. Scope: public file history. Relevant items: `PsycleInstallerx64-1.12.5apha-2.exe` and `PsycleInstallerx86-1.12.5alpha-2.exe`, 2024-04-14; older stable artifacts. Supports C-002, C-005. **Limit:** filename typo and no release-quality statement. **Why selected:** direct artifact dates/architectures, preferable to third-party catalogs.
- **S-003 — trunk tree at r12005.** Psycle project / SourceForge SVN. <https://sourceforge.net/p/psycle/code/12005/tree/trunk/>. Immutable source tree. Scope: 2025-05-08. Relevant entries: build systems, `cpsycle`, Debian, Windows `psycle`, drivers/core/helpers/player/plugins, COPYING. Supports C-003, C-006, C-008. **Limit:** file presence is not runtime enablement. **Why selected:** immutable canonical module map.
- **S-004 — official SVN commit log.** Psycle project / SourceForge. <https://sourceforge.net/p/psycle/code/HEAD/log/>. Official history view. Scope: revisions through r12005. Relevant entries: 2025 VS2022/build commits and 2024 configuration/jBridge/build commits. Supports C-003, C-004. **Limit:** mutable HEAD view; cited revisions are individually immutable. **Why selected:** establishes maintenance chronology.
- **S-005 — revision r11998 “jbridge.”** Psycle project / SourceForge SVN. <https://sourceforge.net/p/psycle/code/11998/>. Immutable commit. Scope: 2024-04-14. Relevant passage: adds `jbridgeenabler.c/.h`. Supports C-019. **Limit:** commit title alone does not establish semantics. **Why selected:** origin of the current bridge files.
- **S-006 — C audio source tree at r12005.** Psycle project / SourceForge SVN. <https://sourceforge.net/p/psycle/code/12005/tree/trunk/cpsycle/audio/src/>. Immutable tree. Scope: current C engine. Relevant entries: graph, sequencer, MIDI, samplers, VST2/LADSPA/LV2/Lua, presets, PSY2/PSY3, XM/IT/WAV/EXS24 I/O. Supports C-007–C-016, C-023, C-024, C-027. **Limit:** broad inventory, not behavioral qualification. **Why selected:** highest-density current official module evidence.
- **S-007 — Windows host source tree at r12005.** Psycle project / SourceForge SVN. <https://sourceforge.net/p/psycle/code/12005/tree/trunk/psycle/src/psycle/host/>. Immutable tree. Scope: legacy/full Windows host. Relevant entries: VST2.4, LADSPA, Lua, machine/mixer UI, ASIO/WASAPI/DirectSound/WaveOut, MIDI, render, FileIO. Supports C-008, C-010, C-016, C-027. **Limit:** many files last changed before the current alpha; build inclusion unverified. **Why selected:** separates Windows host evidence from the C engine.
- **S-008 — `jbridgeenabler.c` at r12005.** Psycle project / SourceForge SVN. <https://sourceforge.net/p/psycle/code/12005/tree/trunk/cpsycle/audio/src/jbridgeenabler.c>. Immutable source. Scope: Windows VST2 bridge helper. Relevant functions: registry proxy lookup, bootstrap detection, `BridgeMain`. Supports C-019, C-026. **Limit:** does not disclose jBridge internals. **Why selected:** exact primary evidence for bridge mechanics.
- **S-009 — `plugincatcher.c` at r12005.** Psycle project / SourceForge SVN. <https://sourceforge.net/p/psycle/code/12005/tree/trunk/cpsycle/audio/src/plugincatcher.c>. Immutable source. Scope: current discovery/cache. Relevant functions: scan-task initialization, multi-path scan, candidate tests, cache load/save, shell/path lookup, internal registration. Supports C-015, C-016, C-018, C-019, C-021, C-030, C-031. **Limit:** no UI screenshots or process probe. **Why selected:** exact scan and identity origin.
- **S-010 — `vstplugin.c` at r12005.** Psycle project / SourceForge SVN. <https://sourceforge.net/p/psycle/code/12005/tree/trunk/cpsycle/audio/src/vstplugin.c>. Immutable source. Scope: current C VST2 host. Relevant functions: init/test/work/event processing, metadata, I/O, load/save-specific, editor, timing callback, direct/jBridge load. Supports C-011, C-017, C-020–C-022, C-028–C-030, C-037. **Limit:** no independent runtime qualification; helper interface file not exhaustively audited. **Why selected:** highest-value plugin-contract primary source.
- **S-011 — `psy3saver.c` at r12005.** Psycle project / SourceForge SVN. <https://sourceforge.net/p/psycle/code/12005/tree/trunk/cpsycle/audio/src/psy3saver.c>. Immutable source. Scope: current PSY3 serializer. Relevant functions: header/chunk writers, sequence/pattern/machine/connection/state/mapping/instrument/sample serialization. Supports C-007, C-012, C-014, C-023, C-030, C-031, C-038. **Limit:** saver alone cannot prove loader recovery/compatibility. **Why selected:** exact origin for persistence claims.

**Negative-result log:**

- **N-001:** both web searches returned HTTP 429; no snippets were used as evidence.
- **N-002:** `https://psycle.pastnotecut.org/` returned a transport error; maintenance/manual claims therefore stayed unknown.
- **N-003:** GitHub repository search found no repository clearly attributable as canonical upstream; a 2026 third-party `cpsycle-lib` extraction was excluded.
- **N-004:** SourceForge readme/changelog download URLs redirected to generic landing pages and did not expose their text; repeated retries were rejected.
- **N-005:** no VST3-named adapter appeared in S-006 or S-007. This was retained only as negative discovery evidence, never converted to “unsupported.” [C-027]

## 23. Unknowns and next discriminating probes

| Unknown | Attempts/blocker | Decision impact | Safest next probe | Access/fixture; owner |
| --- | --- | --- | --- | --- |
| Stable/current support status [C-004] | Project page/feed/log checked; website inaccessible; alpha/stable signals conflict | Procurement/maintenance risk | Obtain official maintainer release/support statement | Public statement; unassigned |
| Full platform/build matrix [C-006] | Windows artifacts found; Linux only aggregate metadata/source | Cross-platform suitability | Reproducible official build/package audit in disposable hosts | Windows/Linux build VMs; unassigned |
| Scheduler/PDC/latency [C-009, C-011] | Outside final source budget; no manual | Core engine choice | Review scheduler and measure impulse/latency fixtures | Source audit + synthetic plugins; unassigned |
| Scan/runtime containment [C-021] | Source shows direct testing/loading, no qualifying process docs | Security/reliability critical | Crash/hang plugins during scan and render in disposable VM | Non-malicious test VST2s; unassigned |
| Advanced VST2 contract [C-037] | Adapter inspected; no sidechain/latency fixture | Interoperability fidelity | Test sidechain, multi-output, dynamic I/O, latency/tail, offline, event offsets | VST2 conformance fixtures; unassigned |
| LADSPA/LV2 release enablement [C-016] | Compile-guarded code found; no package/runtime qualification | Format matrix | Inspect official build flags, then instantiate known-good fixtures | Reproducible builds; unassigned |
| Missing plugins/state durability [C-031] | Saver/catcher inspected; loader/recovery UI not resolved | Project longevity | Save, remove/rename plugin, reopen/resave/reinstall and compare state | Disposable project/plugin; unassigned |
| Recovery/compatibility [C-038] | Saver inspected; autosave/loader policy not covered | Data-loss/migration risk | Versioned PSY2/PSY3 corpus, corruption and crash-save tests | Historical fixtures; unassigned |
| Modern formats [C-027] | Current trees enumerated; absence not proof | Ecosystem breadth | Maintainer/build configuration statement before runtime probing | Official config/docs; unassigned |
| Accessibility/security/privacy [C-036] | No qualifying official policy found | NFR/legal risk | Official accessibility, signing/update, and privacy review | Product owner response; unassigned |

## 24. Curiosity pass and stop decision

Candidate scoring used 1–5 (higher is better except cost, where 5 means cheap):

| Thread | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| VST2 state/UI/processing plus PSY3 persistence | 5 | 5 | 5 | 3 | **Pursued** through S-010/S-011; changed the conclusion from name-level support to a substantial legacy host contract |
| Audio scheduler/threading/PDC | 4 | 4 | 4 | 2 | `CURIOSITY_NO_GO`: important but too broad for remaining documentary budget |
| LADSPA/LV2 conformance | 3 | 3 | 3 | 2 | `CURIOSITY_NO_GO`: requires build/runtime qualification |
| Historical manual recovery | 3 | 3 | 2 | 2 | `CURIOSITY_NO_GO`: primary site inaccessible; current immutable source preferred |
| Third-party forks/mirrors | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: weak provenance and scope drift |

**Stop decision:** stop for **coverage plus budget exhaustion and diminishing marginal evidence**. Every required heading and plugin row is complete; the machine graph, patterns, audio/source module map, native devices, VST2 discovery/runtime/state/UI, jBridge/bitness, PSY3 persistence, status/platform/license, and material unknowns are represented. Further documentary retrieval is unlikely to change the leading conclusion; remaining high-value questions require bounded build/runtime fixtures rather than more broad search. No contradiction is hidden: stable `1.12.0`, public `1.12.5alpha-2`, and later source activity describe different channels. [C-002] [C-003] [C-004]

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Owned path: `research/daw-landscape/dossiers/psycle.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See §0 and C-001–C-006.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Sections cite the claims register; synthesis tables cite supporting claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See §§21–23.
- [x] **Every required plugin-format row is present.** All 13 contract rows appear in §11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** See §§11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Classifications are explicit; vendor claims are bounded.
- [x] **Licensing and clean-room boundaries are explicit.** See §16 and §22.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** No installer/plugin was run; only public pages/source were read.

**Checks performed:** governing-file/template comparison; full matrix row count; claim/source cross-reference review; negative-result retention; immutable revision pinning; read-only workspace status before writing and after dossier creation.

**Verification result:** Psycle has 26/26 ordered required headings, 13/13 plugin rows, 37/37 defined claim IDs, 11/11 defined source IDs, no unresolved claim/source references, and no whitespace errors. The repository-wide validator reported `STRUCTURE_OK: 8`, `INVALID: 1`, `MISSING: 72`; its sole error is the pre-existing incomplete `dossiers/zynewave-podium.md`, not this dossier.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; 11 retained official/immutable source records, 37 claims (21 documented, 2 inference, 14 unknown), 5 negative-result records, and 10 prioritized next probes.

**Unresolved blockers:** official website inaccessible; web search rate-limited; readme/changelog text not retrievable through SourceForge redirects; no dynamic qualification; uncertain release enablement for Linux/LADSPA/LV2 and no complete modern plugin/recovery/NFR contract.

**Pre-existing workspace changes:** numerous unrelated modified/untracked paths existed before this dossier was created, including the governing DAW-landscape files; all were left untouched. No staging or commit was performed.
