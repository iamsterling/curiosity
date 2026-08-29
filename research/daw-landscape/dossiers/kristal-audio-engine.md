# KRISTAL Audio Engine DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** KRISTAL Audio Engine, bounded to the historical product and its official 2004 reference-manual snapshot. The exact final executable version/build is **UNKNOWN**. [C-001] [C-039]
- **Canonical vendor/upstream:** Kreatives.org; the official manual names Paul Sellars and Matthias Juwan. [C-001]
- **Researcher/session:** `ses_fb271e964ffetgV7U8byodd5D6`
- **Owned path:** `research/daw-landscape/dossiers/kristal-audio-engine.md`
- **Research date and cutoff:** 2026-08-29 UTC.
- **Status at cutoff:** historical/discontinued. The official site says commercial licensing, support, and its public download ended on 2019-01-01. [C-004]
- **Edition/license scope:** one evidenced desktop product; freeware for personal, educational, and non-commercial use, with historical commercial licensing no longer offered by the official site. No separate editions were found in the retained first-party evidence. [C-004]
- **Platform scope:** the retained manual is Windows-specific (MME, a Windows global VST folder, Windows-style paths) and documents ASIO/MME devices. Exact supported Windows releases and any other platform builds are **UNKNOWN**. [C-030] [C-039]
- **Included:** the main mixer/engine application, KRISTAL Waver, KRISTAL LiveIN, bundled effects, legacy VST-effect hosting, `.kristal` projects, and the narrowly evidenced K2/Studio One succession statement.
- **Excluded:** Studio One architecture and current compatibility; binary inspection; reverse engineering; undocumented module or project-file internals; user-forum anecdotes; and claims of code reuse or architectural inheritance.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.

## 1. Executive summary

KRISTAL is decision-relevant less as a full modern DAW than as a small, explicitly modular recorder/host. Its main application is a fixed 16-channel mixer; four input slots load source modules, principally the Waver audio sequencer/recorder or LiveIN external-input module. A Waver can contain 16 audio tracks, and four Wavers make 64 arrangement tracks theoretically available, but only 16 source channels can connect to the mixer at one time. [C-002] [C-006] [C-007]

The engine is documented as 32-bit floating point, block-processing, and capable of 44.1–192 kHz subject to hardware. ASIO supplies low-latency multichannel I/O; MME is stereo and high-latency, with host-set record/playback buffers. The manual does not establish multicore scheduling, plugin delay compensation, oversampling, or a distinct offline engine. [C-003] [C-012] [C-013] [C-025]

Third-party hosting is narrowly documented as legacy VST **effects** in two channel insert slots and three master slots on the evidenced Windows product. KRISTAL scans a registered global VST folder on startup when enabled, its application `Plugins` directory, and up to three assigned folders. It offers detached custom or generic editor windows, program selection, activation, and `.fxp`/`.fxb` preset exchange. Exact VST generation, instruments, state recall, automation, plugin identity, latency/tail reporting, sidechains, multiple buses, validation, quarantine, bridging, isolation, crash recovery, and missing-plugin behavior remain **UNKNOWN**. [C-010] [C-017] [C-018] [C-019] [C-020] [C-021] [C-026]

The official site calls Studio One the successor, says it was developed by KristalLabs with PreSonus after the K2 project, and stated in 2019 that Studio One versions could import `.kristal` projects. That supports product succession and an exchange path only; code lineage and architectural influence are not evidenced. [C-005] [C-033]

**Overall confidence:** high for the user-visible 2004 manual surface and 2019 discontinuation notice; medium for mapping generic contemporaneous “VST” terminology to a VST2-era row; low/unknown for proprietary internals and full host-contract behavior.

## 2. Product identity, history, and market position

The official manual describes KRISTAL Audio Engine as a multitrack recorder, **audio** sequencer, and mixer for recording, mixing, and mastering digital audio, with beginners explicitly named as an intended audience. [C-001]

The retained evidence establishes a 2004 manual snapshot, but not the original release date, exact last build, sales history, installed base, or competitive position. Those items remain **UNKNOWN** rather than inferred from third-party listings. [C-039]

The official news page provides the bounded lineage:

- K2 was the codename for a music-production tool developed by KristalLabs. [C-005]
- In 2009, the page said Studio One was developed by KristalLabs in cooperation with PreSonus and was formerly code-named K2. [C-005]
- In 2019, the page called Studio One KRISTAL's successor and said `.kristal` songs could be imported. [C-005]
- The same 2019 notice ended KRISTAL commercial licensing/support and removed the public download. [C-004]

These are vendor historical statements, not independent evidence of implementation reuse. [C-033]

## 3. Workflow and conceptual model

KRISTAL's mental model is a modular desktop shell organized around a mixer. The main application owns the mixing console, while recording/arrangement and live external input are loaded into four “KRISTAL PlugIn” source slots. [C-002] [C-006]

Waver supplies a linear, audio-only arrangement. Its core visible objects are tracks, audio parts, folder parts, locators, a time ruler, and a pool named by the manual. Parts refer to parent audio files through start offset and length and add non-destructive mute/lock/transparency, fades, and gain. Overlapping mono/stereo parts on a track mix together. [C-008] [C-038]

LiveIN instead routes an external microphone/instrument source into mixer processing in real time. This makes recording/arrangement and live-through processing sibling source roles rather than modes of one track object. [C-011]

No scenes, clip launcher, tracker grid, notation model, MIDI-note editor, browser/mobile workflow, or user-programmable graph is documented in the retained corpus. Their presence or absence is **UNKNOWN**; the phrase “audio sequencer” must not be expanded to mean MIDI sequencing. [C-009]

## 4. Publicly documented architecture

The publicly documented architecture is user-visible rather than an implementation disclosure:

1. the main KRISTAL application provides the mixer;
2. four mixer input slots select Waver or LiveIN source modules;
3. a source module exposes a separate editor window;
4. source outputs feed up to 16 fixed mixer channels;
5. channel/master insert positions host VST effects; and
6. one selected audio device receives the stereo master output. [C-002] [C-006] [C-007] [C-010]

“PlugIn” is overloaded in the documentation. A **KRISTAL PlugIn** is a source application such as Waver or LiveIN, while a **VST effect Plug-In** is an effect loaded in a mixer insert. No public module ABI, SDK, or evidence that Waver/LiveIN are VST binaries was retained. [C-002] [C-027]

Whether modules or VSTs run in-process, how the graph is scheduled, how worker/audio threads are divided, and how project or plugin objects are represented internally are proprietary evidence gaps. A separate editor window does not prove a separate process. [C-025]

## 5. Audio engine

- The official feature descriptions specify a 32-bit floating-point engine and hardware-dependent sample rates of 44.1, 48, 88.2, 96, and 192 kHz. [C-003] [C-014]
- Mixing and effects operate in blocks. For ASIO, block size is controlled by the driver; for MME, KRISTAL controls block size and separate input/output buffer counts. [C-013]
- The manual gives MME latency as record/playback buffer count multiplied by block size and describes ASIO latency as normally at or below 10 ms; this is vendor documentation, not a measurement. [C-013]
- Disk pre-load caches Waver material ahead of playback. Part-volume/fade edits may not become audible until the preload interval plus output latency. “No Pre-Load” reads directly from disk and is cautioned against with small blocks. [C-013]
- ASIO ports may be individually activated. Only two inputs and outputs are active by default. [C-012]
- ASIO and MME devices can both appear, but the manual warns that combining them in one project is not synchronized. [C-012]
- A performance meter reports estimated processor use; the manual recommends staying below about 75% and reducing effects/tracks or creating a mixdown when playback breaks up. [C-024]

Plugin delay compensation, tail handling, multicore scheduling, denormal handling, resampling quality, internal summing layout beyond the stereo master, oversampling, dropout recovery, deterministic/offline scheduling, and engine logs are **UNKNOWN**. [C-021] [C-025]

## 6. Tracks, timeline, clips, and editing

Each Waver arrangement has up to 16 parallel tracks containing mono and/or stereo audio parts. Parts can be imported or recorded; overlapping parts mix. Start, source offset, length, fade-in/out, and gain are editable without renaming or necessarily modifying the parent file. [C-008]

The ruler supports seconds, raw sample frames, or bars/beats/16ths/remainder, plus left/right locators. KRISTAL documents clip fades/crossfades, folder parts, lock/mute/transparency, and unlimited undo/redo. [C-008] [C-016] [C-038]

Four Waver instances make 64 arrangement tracks theoretically possible, but the mixer accepts only 16 simultaneous channels. This is a capacity distinction, not evidence for a 64-channel mixer. [C-007]

Takes, lanes, comping, grouping semantics beyond Waver folder parts, tempo-map editing, meter changes, ripple modes, time stretching/warping, elastic audio, and persistent edit-history recovery are **UNKNOWN**. [C-036]

## 7. MIDI, sequencing, notation, and expression

The retained official sources document an **audio** sequencer and audio tracks. They do not document MIDI recording/editing, a piano roll, instruments, score notation, pattern sequencing, SysEx, MIDI clock/MTC, MPE, per-note expression, or MIDI 2.0. All are **UNKNOWN** for the historical product rather than asserted unsupported. [C-009]

Bars-and-beats display establishes a musical time ruler, not a MIDI event model or tempo-editing architecture. [C-038]

## 8. Routing, mixer, automation, and control

The fixed mixer has 16 channel strips and a stereo master. A mono input receives pan; a stereo input receives left/right balance. Channels expose gain, meters with clip indication/reset, mute, solo, EQ, and effects. [C-010]

Four source slots load Waver or LiveIN. A normal one-Waver arrangement maps its 16 tracks directly to the 16 mixer channels; multiple Wavers do not increase the simultaneous mixer-channel count. One selected audio output receives the stereo master. [C-006] [C-007] [C-010]

The product summary documents two VST insert slots per channel and three master-effect slots. [C-010]

Auxiliary buses, sends/returns, groups, VCAs, folders as mixer containers, feedback routes, sidechains, surround/immersive layouts, automation lanes or write modes, control surfaces, MIDI parameter mapping, OSC/remotes, and sample-accurate automation are **UNKNOWN**. [C-021] [C-034] [C-035]

## 9. Recording, comping, and media handling

Waver owns hard-disk recording, editing, and arranging. The package description documents multichannel recording via ASIO/MME and ASIO input monitoring; track controls accept imported files or new recordings. [C-015]

The documented media/export set is WAVE, AIFF, FLAC, and Ogg Vorbis, with mixdown at 16/24/32-bit output depth. Audio parts retain an offset into a parent file, supporting a non-destructive media-reference model at the UI level. [C-014] [C-023]

Punch and cycle behavior beyond the existence of locators/cycle references, take retention, comping, record-file naming, media-copy/collect, missing-media relink, sample-rate conversion policy, metadata, proxies, conform, and video are **UNKNOWN**. [C-036]

## 10. Instruments, effects, content, and native devices

The package includes KristalMultiDelay, KristalChorus, KristalReverb, and Kristalizer. The manual presents these in the same VST-effect workflow as third-party effects. [C-029]

The product-native source modules are Waver and LiveIN. No sampler, synthesizer, MIDI instrument, device chain/rack, modulation system, macro layer, content library, or third-party KRISTAL-module authoring SDK is documented in the retained evidence. Those boundaries are **UNKNOWN**. [C-027] [C-040]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

The matrix is deliberately historical. `DOCUMENTED` for the VST2 row means the 2004 manual directly documents generic legacy VST effects and VST program/bank files; the exact API generation is not named and the VST2 mapping remains an inference. [C-017]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `UNKNOWN`: no historical macOS build evidenced | `DOCUMENTED`: legacy VST effects; exact API generation unnamed | `UNKNOWN`: no historical Linux build evidenced | `UNKNOWN`: outside evidenced desktop scope | 2004 manual snapshot | Effects in channel/master inserts; `.fxp`/`.fxb`; instruments and complete VST2 contract `UNKNOWN` | [C-017] [C-020]; S-007, S-009 |
| VST3 | `UNKNOWN`: not documented | `UNKNOWN`: not documented in retained historical sources | `UNKNOWN`: not documented | `UNKNOWN`: not documented | 2004 manual/2019 discontinuation boundary | Absence from retained manual is not proof of non-support in every build | [C-039]; S-001, S-002 |
| AUv2 | `UNKNOWN`: no build/hosting evidence | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | Historical scope | No Audio Unit host contract evidenced | [C-039]; S-001–S-010 |
| AUv3 | `UNKNOWN`: no build/hosting evidence | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | Historical scope | No AUv3 host contract evidenced | [C-039]; S-001–S-010 |
| AAX | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | Historical scope | No AAX host contract evidenced | [C-039]; S-001–S-010 |
| CLAP | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | Historical/discontinued scope | No CLAP host contract evidenced | [C-039]; S-001–S-010 |
| LV2 | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | Historical scope | No LV2 host contract evidenced | [C-039]; S-001–S-010 |
| LADSPA | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | Historical scope | No LADSPA host contract evidenced | [C-039]; S-001–S-010 |
| DSSI | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | Historical scope | No DSSI host contract evidenced | [C-039]; S-001–S-010 |
| JSFX | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | Historical scope | No JSFX host contract evidenced | [C-039]; S-001–S-010 |
| DirectX/DXi | `UNKNOWN`: not documented | `UNKNOWN`: no retained official evidence despite Windows scope | `UNKNOWN`: not documented | `UNKNOWN`: not documented | Historical scope | No DirectX/DXi contract evidenced | [C-039]; S-001–S-010 |
| Rack Extension | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | `UNKNOWN`: not documented | Historical scope | No Rack Extension contract evidenced | [C-039]; S-001–S-010 |
| Product-native/other | `UNKNOWN`: no macOS build evidenced | `DOCUMENTED`: four source slots load bundled Waver/LiveIN; bundled effects are listed | `UNKNOWN`: no Linux build evidenced | `UNKNOWN`: outside evidenced desktop scope | 2004 manual snapshot | No third-party KRISTAL-module SDK/ABI evidenced | [C-002] [C-006] [C-027] [C-029]; S-003, S-005, S-007 |

### 11.2 Discovery, scanning, validation, and recovery

KRISTAL can scan the Windows-registered global VST folder on startup when the option is checked. It also searches the application's `Plugins` directory and up to three user-nominated VST folders. Effects then appear in a selection list opened from a `No FX` insert field. [C-018]

The retained documentation does not define recursive traversal, file extensions, cache location/lifetime, incremental or manual rescan, plugin validation, duplicate identity, shell plugins, ordering, blacklist/quarantine, scan timeouts, failure logs, or recovery after a scan crash. These remain **UNKNOWN**. [C-021]

### 11.3 Runtime isolation and compatibility

The manual does not document in-process versus helper-process execution, sandboxing, crash containment, watchdogs, 32/64-bit bridging, CPU-architecture compatibility, code-signing checks, or compatibility modes. All are **UNKNOWN**. A detached editor window and startup scanning provide no process-isolation evidence. [C-019] [C-025]

### 11.4 Host/plugin processing contract

The directly evidenced contract is an **audio effect** placed in one of two channel inserts or three master inserts, processed in the engine block size, and activatable/deactivatable from the mixer. [C-010] [C-013] [C-017] [C-020]

Instrument instantiation, MIDI/event input/output, sidechains, multiple audio buses, multi-output, dynamic I/O, MPE/MIDI 2.0, sample-accurate automation, parameter gestures, plugin latency/tail reporting, host compensation, bypass semantics beyond the documented activation control, suspend, and headless/offline behavior are **UNKNOWN**. [C-021] [C-040]

### 11.5 Parameters, automation, state, presets, and project recall

KRISTAL opens a plug-in's custom editor when supplied, otherwise builds a generic parameter editor. It exposes the plug-in's programs, previous/next program controls, and `.fxp` individual preset/`.fxb` bank load/save. [C-019] [C-020]

Parameter IDs, normalized ranges, text formatting, host automation, state chunks, project serialization of plugin state, external asset references, missing-plugin placeholders, migration, plugin replacement, preset path conventions, and recovery after failed restore are **UNKNOWN**. `.kristal` project save/load alone does not prove any of these behaviors. [C-026]

### 11.6 UI, diagnostics, and failure modes

Effect editors are separate windows that can be opened/closed; a preference can keep them above mixer/Waver windows. Custom and generic editor paths are documented. Scaling, DPI behavior, keyboard focus, accessibility, headless operation, multiple editor instances, and UI-crash isolation are **UNKNOWN**. [C-019]

The engine-level performance meter and mixer clip indicators are the only retained diagnostics. Plugin-specific CPU attribution, scan reports, crash reports, disabled-plugin UX, and actionable failure messages are **UNKNOWN**. [C-024]

## 12. Extensibility and integration

VST effects and the built-in KRISTAL source-module slots are the only evidenced extension points. No public scripting language, macro API, command/action API, controller SDK, remote API, protocol API, or third-party KRISTAL-module SDK/ABI was found in the retained official pages. Their existence is **UNKNOWN**. [C-027]

An external audio-editor application can be selected in preferences, establishing an application handoff, but its round-trip, file-locking, and update semantics are not documented in the retained pages. [C-023]

## 13. Project format, persistence, interoperability, and collaboration

KRISTAL loads/saves project files and preferences name the extension `.kristal`; the last project can reopen automatically at startup. The file representation, schema, atomicity, autosave, backup, crash recovery, version migration, forward/backward compatibility, embedded versus referenced media, and missing dependency behavior are **UNKNOWN**. [C-022] [C-026]

Waver's part model visibly references parent audio files by offset/length, which is consistent with non-destructive media references, but it does not disclose how those references are encoded or relinked. [C-008] [C-023]

Waver documents AES31 export. Audio mixdown supports WAVE, AIFF, FLAC, and Ogg Vorbis at the documented bit depths. A 2019 vendor notice said Studio One versions, including then-free Studio One Prime, could continue work with `.kristal` songs; this was not dynamically tested and must not be projected onto current Studio One versions. [C-005] [C-014] [C-016]

AAF, OMF, MIDI-file, MusicXML, ADM, DAWproject, archive/collect, stems-as-a-project package, cloud collaboration, and version-control semantics are **UNKNOWN**. [C-037]

## 14. Delivery, live, post-production, and specialized workflows

KRISTAL documents mixdown to 16/24/32-bit WAVE, AIFF, FLAC, or Ogg Vorbis files. Muted Waver parts are excluded from mixdown. [C-014] [C-028]

LiveIN is the specialized live-through workflow: external audio enters the mixer and can be processed through VST effects and channel EQ in real time, with ASIO recommended for low latency. [C-011] [C-012]

Batch export, loudness standards, DDP, video/timecode/ADR, broadcast metadata, surround/immersive/ADM, show control, and a dedicated performance set model are **UNKNOWN**. [C-035]

## 15. Performance, reliability, security, and accessibility

The documented resource controls are block size, MME record/playback buffers, disk pre-load, ASIO-port enablement, and a global performance meter. The manual links overload symptoms to excessive tracks/effects and recommends mixdown as a workload reduction. [C-013] [C-024]

Documented hard limits include 16 mixer channels, four KRISTAL source slots, two channel effect slots, three master effect slots, and 16 tracks per Waver instance. [C-003] [C-007] [C-010]

Crash containment, automatic recovery, rollback, update signing, plugin trust prompts, malware scanning, telemetry/privacy, localization inventory, keyboard-only operation, screen-reader support, color/contrast accessibility, and tested hardware matrices are **UNKNOWN**. No security assurance should be inferred from freeware status or the former official download. [C-031]

## 16. Licensing, ecosystem, and implementation constraints

The official manual labels KRISTAL freeware for personal, educational, and non-commercial use. The official site says commercial licensing and support were discontinued in 2019 and no longer provides a public download. Those statements do not grant source-code, redistribution, SDK, trademark, or derivative-work rights. [C-004] [C-032]

The manual describes VST and ASIO as Steinberg proprietary standards/trademarks. No retained evidence establishes which SDK agreement KRISTAL used, whether any license survives for new distribution, or whether the bundled effects/modules can be redistributed. Those are legal/archival unknowns requiring rights-holder records, not reverse engineering. [C-032]

The product's fixed host surface may be studied as behavior and documentation, but proprietary code, assets, project schemas, and module ABIs must not be copied or guessed. “VST support” also conveys no current trademark, SDK, certification, or compatibility right. [C-025] [C-032]

This section is descriptive research, not legal advice.

## 17. Strengths, liabilities, and architecture lessons

**Evidence-backed strengths**

- The mixer/source-module boundary is unusually explicit and small: recorder/sequencer and live input are replaceable source roles rather than entangled with every mixer strip. [C-002] [C-006]
- Waver's file-referencing parts and separate mixer make the destructive/non-destructive and arrangement/mixing boundaries legible. [C-008] [C-023]
- Block/preload/buffer controls expose concrete latency-versus-stability tradeoffs to the user. [C-013]
- A generic editor provides a fallback when a VST effect lacks a custom UI. [C-019]

**Liabilities or historical limits**

- The fixed 16-channel mixer bottlenecks the theoretically larger multi-Waver arrangement. [C-007]
- ASIO/MME combination is documented as unsynchronized. [C-012]
- The retained host contract is effects-only and shallow by modern interoperability criteria; most identity, bus, state, latency, validation, isolation, and failure semantics are unknown. [C-021] [C-026]
- Discontinuation, withdrawal of the public download, and unknown project/plugin recovery semantics limit KRISTAL's value as a durability reference. [C-004] [C-026]

These points assess architecture-reference value, not overall product quality.

## 18. Transferable patterns

### TP-1 — Source applications feeding a stable mixer contract

- **Problem:** keep distinct creation/ingest workflows from bloating the central mixer.
- **Minimal mechanism:** a small source-module contract with audio outputs and an editor, connected through bounded slots to a stable mixer. [C-002] [C-006]
- **Prerequisites:** explicit channel-count negotiation, lifecycle/state ownership, real-time safety, diagnostics, and project migration—most of which KRISTAL does not publicly document. [C-025] [C-027]
- **Tradeoffs:** clear separation and simpler UX versus fixed-slot/channel bottlenecks and cross-module coordination.
- **Adaptation risk:** medium; copy only the abstract separation, not proprietary interfaces or UI expression.
- **Disposition:** `CANDIDATE`.

### TP-2 — Non-destructive audio parts as source-range views

- **Problem:** edit arrangement timing without rewriting source files.
- **Minimal mechanism:** a part references a parent asset with start offset/length and carries gain/fades/attributes. [C-008] [C-023]
- **Prerequisites:** durable asset identity, relinking, transactional save, and missing-media UX; KRISTAL evidence does not resolve these. [C-026]
- **Tradeoffs:** low-cost edits and source preservation versus dependency-management burden.
- **Adaptation risk:** low at the abstract pattern level.
- **Disposition:** `CANDIDATE`.

### TP-3 — Custom plugin UI with generic fallback

- **Problem:** preserve usability when a plugin has no proprietary editor.
- **Minimal mechanism:** open the custom editor when present; otherwise render host controls from exposed parameters. [C-019]
- **Prerequisites:** stable parameter identity/text/range metadata, focus/accessibility behavior, and state/automation semantics. [C-021] [C-026]
- **Tradeoffs:** broad usability versus imperfect representation of plugin-specific workflows.
- **Adaptation risk:** medium because modern DPI, accessibility, and cross-process UI constraints are absent from the evidence.
- **Disposition:** `CONDITIONAL`.

### TP-4 — Make latency/stability controls explainable

- **Problem:** users need to understand glitches versus response time.
- **Minimal mechanism:** expose block/buffer/preload settings with units and a calculable latency model. [C-013]
- **Prerequisites:** device-reported latency, safe defaults, PDC integration, and modern automatic tuning.
- **Tradeoffs:** transparency versus user complexity and configuration errors.
- **Adaptation risk:** low for the explanatory model, high if copying historical manual tuning literally.
- **Disposition:** `CONDITIONAL`.

## 19. Rejected patterns and CURIOSITY_NO_GO

| Pattern/thread | Evidence or gap | Decision rationale | Reopen condition |
| --- | --- | --- | --- |
| Fixed 16-channel mixer as a modern ceiling | Four Wavers can hold 64 theoretical tracks but only 16 mixer channels connect concurrently. [C-007] | `REJECT`: artificial routing/scaling bottleneck. | Only for a deliberately constrained appliance with measured UX benefits. |
| Unsynchronized mixed driver families | ASIO+MME are documented as not in sync. [C-012] | `REJECT`: timing ambiguity at the device boundary. | A modern aggregate-device design with measured synchronization. |
| Infer module ABI from the word “PlugIn” | No SDK/ABI or binary model is documented. [C-027] | `CURIOSITY_NO_GO`: high risk of inventing proprietary internals. | Public SDK/engineering documentation from the rights holder. |
| Claim a complete VST2 host contract | Only effect inserts, scanning paths, editors, programs, and preset files are documented. [C-017]–[C-021] | `CURIOSITY_NO_GO`: format acceptance is not full interoperability. | Lawful disposable qualification harness plus version-pinned fixtures. |
| Infer MIDI support from “sequencer” | Official wording is “audio sequencer”; retained track model is audio parts. [C-009] | `CURIOSITY_NO_GO`: semantic overreach. | A versioned official MIDI manual/release note. |
| Reverse-engineer `.kristal` or binaries | Format/module internals are unpublished in retained evidence. [C-025] [C-026] | `CURIOSITY_NO_GO`: outside clean-room documentary authority. | Public schema/API or separately authorized clean-room study. |
| Broad secondary review/forum harvesting | Official manual already resolves visible operation; forums are closed and secondary claims cannot establish internals. [C-004] | `CURIOSITY_NO_GO`: low marginal architectural evidence. | A precise contradiction needing triangulation. |
| Treat Studio One as proof of shared architecture | Official page proves succession/import only. [C-005] [C-033] | `CURIOSITY_NO_GO`: no code/internals evidence. | First-party engineering history or public source showing a concrete inherited mechanism. |
| Historical installer execution | Public official download was withdrawn; no execution was required. [C-004] | `CURIOSITY_NO_GO`: unnecessary trust and licensing risk. | Later authorized disposable interoperability plan with lawful fixture provenance. |

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and counterevidence search | Outcome |
| --- | --- | --- |
| H-1: KRISTAL is a monolithic sequencer with an attached mixer. | Compared official “What is,” components, mixer, and Waver pages. | **Falsified:** the manual explicitly assigns mixing to the main application and sequencing/live input to source modules. [C-002] |
| H-2: four 16-track Wavers yield a 64-channel mixer. | Checked the mixer input-slot passage for simultaneous connection limits. | **Falsified:** 64 arrangement tracks are theoretical; only 16 channels connect simultaneously. [C-007] |
| H-3: “audio sequencer” proves MIDI sequencing. | Looked for MIDI objects in the retained conceptual/arrangement pages. | **Not supported:** only audio parts/tracks are documented; MIDI remains `UNKNOWN`. [C-009] |
| H-4: the host accepts legacy VST effects. | Checked effect installation, startup scan, insert selection, editor, programs, and `.fxp/.fxb`. | **Supported at documented UI level.** Exact API generation and runtime fidelity remain `UNKNOWN`. [C-017]–[C-020] |
| H-5: accepting a VST means full host-contract support. | Separately tested documentation for scanning, instantiation, buses/events, UI, state, latency, isolation, and recovery. | **Falsified as an evidence claim:** only scan paths, effect inserts, editors, programs, activation, and preset files are established. [C-021] [C-026] |
| H-6: detached plugin editors imply sandboxing. | Checked preferences/effects wording for process or crash boundary. | **Falsified as an inference:** window placement is documented; process isolation is not. [C-019] [C-025] |
| H-7: KRISTAL compensates plugin latency because ASIO is low latency. | Compared driver-latency and plugin-host sections. | **Not supported:** device latency is documented; plugin latency reporting/PDC are `UNKNOWN`. [C-013] [C-021] |
| H-8: `.kristal` project save proves reliable plugin recall. | Compared project preference and VST preset pages. | **Not supported:** project files and explicit preset files are documented separately; serialization/recovery remain `UNKNOWN`. [C-022] [C-026] |
| H-9: Studio One shares KRISTAL's architecture. | Examined official succession/K2/import statements and attempted a bounded nested first-party lineage check. | **Not supported:** only product succession and import are established; nested search was blocked by session depth. [C-005] [C-033] |

**Later safe dynamic probes (not performed):** with a lawfully obtained, hash-pinned historical installer and disposable offline Windows VM, distinguish file discovery, list appearance, instantiation, custom/generic UI, audio processing, preset exchange, project save/reload, missing plugin, bad binary, declared latency, and crash behavior using purpose-built non-malicious VST2 fixtures. Such a probe requires separate authority and licensing review.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | KRISTAL is described as a multitrack recorder, audio sequencer, and mixer; the official 2004 manual names Paul Sellars and Matthias Juwan. | 2004 manual snapshot | S-002, S-003 | Direct title/byline/product description. | Exact release date/final build not established. |
| C-002 | DOCUMENTED | High | The main application provides the mixer; audio sequencing and live input are separate KRISTAL PlugIns, Waver and LiveIN. | 2004 manual snapshot | S-003, S-004, S-005, S-006 | Direct architecture description and UI component list. | Says nothing about binary ABI/processes. |
| C-003 | DOCUMENTED | High | Headline engine limits are 16 mixer tracks, 32-bit floating point, 44.1–192 kHz, four KRISTAL slots, two channel VST inserts, and three master VST inserts. | Official historical feature list | S-001, S-003 | Direct feature list, triangulated across product page/manual. | Hardware limits sample rates; “tracks” is clarified by C-007. |
| C-004 | DOCUMENTED | High | Product was freeware for personal/educational/non-commercial use; official commercial licensing/support/download ended 2019-01-01. | Historical license/status | S-001, S-003 | Direct license paragraph and dated notice. | Full historical license text and prior commercial terms unavailable. |
| C-005 | DOCUMENTED | High | Official page identifies K2 as KristalLabs' project, Studio One as K2 developed with PreSonus and KRISTAL's successor, and states `.kristal` import. | Official 2007/2009/2019 notices | S-001 | Direct vendor historical statements. | Current import support and implementation lineage not tested. |
| C-006 | DOCUMENTED | High | Four mixer input slots select Waver or LiveIN and expose the selected module's editor window. | 2004 manual-scope mixer | S-005 | Direct “Audio Inputs” section. | Third-party modules/ABI not documented. |
| C-007 | DOCUMENTED | High | Each Waver has up to 16 tracks; four instances make 64 theoretical tracks, but only 16 can connect to the mixer simultaneously. | 2004 manual-scope mixer/Waver | S-005, S-006, S-010 | Direct capacity explanation, triangulated with arrangement page. | Does not state useful performance at maximum. |
| C-008 | DOCUMENTED | High | Waver is a linear non-destructive audio arrangement whose parts carry source offsets/length, fades/gain/attributes and can overlap/mix on mono/stereo tracks. | Waver arrangement | S-003, S-006, S-010 | Direct feature and arrangement descriptions. | Internal storage representation unknown. |
| C-009 | UNKNOWN | High | MIDI sequencing, notation, expression, SysEx, clock/MTC, MPE, and MIDI 2.0 are not established by retained evidence. | Historical product | S-003, S-006, S-010 | Official sources repeatedly scope Waver to audio; no retained MIDI documentation. | Absence from selected pages is not proof of no feature. |
| C-010 | DOCUMENTED | High | Mixer has 16 mono/stereo strips, stereo master, pan/balance, mute/solo, metering, EQ, two channel inserts, and three master inserts. | 2004 manual-scope mixer | S-001, S-003, S-005 | Direct product/mixer sections. | No evidence of buses/sends/sidechains. |
| C-011 | DOCUMENTED | High | LiveIN routes external audio through channel EQ and VST effects in real time. | 2004 manual-scope LiveIN role | S-003, S-005 | Direct descriptions. | Monitoring path and round-trip measurements unknown. |
| C-012 | DOCUMENTED | High | ASIO offers multichannel low-latency I/O; MME is stereo/high-latency; mixed ASIO/MME devices are not synchronized; ASIO ports can be enabled individually. | Historical Windows audio setup | S-008, S-009 | Direct ASIO/MME and channel-setup sections. | Vendor characterization, not independent measurement. |
| C-013 | DOCUMENTED | High | Mixing/effects are block-based; MME has separate record/playback buffers and a stated latency formula; disk preload delays edit audibility. | Historical engine preferences | S-009 | Direct Audio Setup sections. | ASIO latency depends on driver/hardware. |
| C-014 | DOCUMENTED | High | Supported rates are 44.1/48/88.2/96/192 kHz; files include WAVE/AIFF/FLAC/Ogg; mixdown depths include 16/24/32 bit. | Historical feature/preferences | S-003, S-009 | Direct lists. | Codec variants, float/integer output semantics unknown. |
| C-015 | DOCUMENTED | High | Waver documents multichannel hard-disk recording via ASIO/MME and ASIO input monitoring. | Waver package | S-003, S-010 | Direct included-plugin feature list and track-source description. | Punch/takes/record naming unknown. |
| C-016 | DOCUMENTED | High | Waver documents unlimited undo/redo, clip fades/crossfades, and AES31 export. | Waver package | S-003 | Direct feature list. | AES31 profile/fidelity and undo persistence unknown. |
| C-017 | INFERENCE | Medium | The documented 2004 generic “VST effects” host with `.fxp/.fxb` is appropriately treated as VST2-era effects support, but the exact API generation is unnamed. | Windows, 2004 manual snapshot | S-002, S-007 | Assumptions: 2004 manual scope and VST program/bank workflow; alternative: documentation may use “VST” generically across an unspecified generation. | No SDK/version string or binary probe retained. |
| C-018 | DOCUMENTED | High | KRISTAL can scan the registered global VST folder at startup, its application Plugins directory, and up to three assigned VST folders. | Windows historical host | S-007, S-009 | Direct install/preferences sections. | Recursion/cache/rescan/validation unknown. |
| C-019 | DOCUMENTED | High | VST editors are detached windows; host opens custom UI when supplied or creates a generic editor; always-on-top is configurable. | Historical VST UI | S-007, S-009 | Direct effects/preferences descriptions. | No process, scaling, accessibility, or crash-isolation evidence. |
| C-020 | DOCUMENTED | High | Host exposes programs, previous/next program, activation, and `.fxp`/`.fxb` load/save. | Historical VST effects | S-007 | Direct effects tutorial. | Project-state and automation semantics unknown. |
| C-021 | UNKNOWN | High | Validation/cache/duplicates/quarantine, process isolation/bridging, event and multi-bus contracts, PDC/tails, dynamic I/O, offline behavior, and plugin diagnostics are unresolved. | Historical VST host | S-007, S-009 | Targeted official sections do not specify them. | Requires versioned engineering docs or lawful probes. |
| C-022 | DOCUMENTED | High | Projects use `.kristal`; save/load and reopen-last-project are documented. | Historical project UX | S-001, S-003, S-009 | Direct feature/preference/news text. | Schema, atomic save, compatibility unknown. |
| C-023 | INFERENCE | Medium-high | Waver's offset/length parent-file parts evidence a non-destructive media-reference model at UI level. | Waver arrangement | S-009, S-010 | Parent-file language plus external-editor preference. | Encoding, asset identity, and relinking unknown. |
| C-024 | DOCUMENTED | High | Global performance meter reports processor percentage; manual suggests staying below ~75% and reducing tracks/effects or mixing down after interruptions. | Historical mixer | S-005 | Direct Performance Meter section. | Accuracy and sampling method unknown. |
| C-025 | UNKNOWN | High | Process boundaries, threading/scheduling, graph internals, memory model, and proprietary module implementation are not publicly established by retained sources. | Historical architecture | S-003–S-010 | User manual exposes behavior, not implementation. | Public engineering material could change this. |
| C-026 | UNKNOWN | High | Plugin state serialization, missing-plugin handling, autosave/crash recovery, migrations, and project schema are unresolved. | `.kristal` and VST recall | S-001, S-007, S-009 | Project and preset existence do not prove recall contract. | Requires schema docs or authorized tests. |
| C-027 | UNKNOWN | High | No public third-party KRISTAL-module SDK/ABI or scripting/controller API is established. | Extensibility | S-003–S-006 | Retained manual names built-in modules only. | Absence from selected pages is not definitive. |
| C-028 | DOCUMENTED | High | Mixdown supports documented bit depths/formats and excludes muted parts. | Historical delivery | S-003, S-010 | Feature list plus part attribute semantics. | Full render path and plugin-tail behavior unknown. |
| C-029 | DOCUMENTED | High | Bundled effects are KristalMultiDelay, Kristalizer, KristalChorus, and KristalReverb. | Package contents | S-003, S-007 | Direct lists, triangulated. | Internal architecture/licensing not disclosed. |
| C-030 | DOCUMENTED | High | Retained product documentation is Windows-specific and covers MME, ASIO, a Windows global VST folder, and `C:\Program Files\Vstplugins` example. | Platform evidence | S-007, S-008, S-009 | Direct platform terminology. | Exact Windows versions and exclusivity unknown. |
| C-031 | UNKNOWN | High | Crash recovery, signing/update security, telemetry/privacy, localization, and accessibility are not established. | Reliability/security/accessibility | S-001–S-010 | No retained relevant first-party sections. | Dedicated archived support/legal/accessibility pages could discriminate. |
| C-032 | INFERENCE | High | Freeware/use permission and naming VST/ASIO do not establish source, redistribution, SDK, certification, or trademark rights. | Licensing constraint | S-001, S-003, S-007, S-008 | Bounded legal-architecture inference from narrow documented license/trademark text. | Not legal advice; full agreements absent. |
| C-033 | UNKNOWN | High | Studio One code reuse and architectural influence from KRISTAL/K2 are not established; only succession/development/import statements are documented. | Product lineage | S-001 | No engineering/source evidence in retained primary page. | First-party engineering history could resolve. |
| C-034 | UNKNOWN | High | Host/mixer automation and sample-accurate parameter changes are unresolved. | Mixer/VST host | S-005, S-007, S-010 | Controls are documented without automation model. | Dedicated automation manual could resolve. |
| C-035 | UNKNOWN | High | Sends/returns, buses, groups/VCAs, sidechains, surround, feedback, and remote control are unresolved. | Routing/control | S-005 | Mixer page documents fixed strips/master only. | Absence is not proof of unsupported behavior. |
| C-036 | UNKNOWN | High | Take lanes, comping, punch details, warping, tempo-map editing, metadata, relink, and video are unresolved. | Recording/editing/media | S-003, S-010 | Retained recording/arrangement features do not cover them. | Additional official manual pages might resolve low-value details. |
| C-037 | UNKNOWN | High | Interchange beyond AES31 and audio mixdown, plus collaboration/version control, is unresolved. | Project exchange | S-001, S-003 | Only AES31/audio/Studio One import are named. | Dedicated release notes could add formats. |
| C-038 | DOCUMENTED | High | Waver ruler can show seconds, samples, or bars/beats and provides left/right locators. | Waver timeline | S-010 | Direct Time Ruler section. | Tempo-map authorship/sync not established. |
| C-039 | UNKNOWN | High | Exact final binary version/build, original release date, complete OS matrix, and support history are unresolved. | Product provenance | S-001, S-002 | Official retained pages give manual/discontinuation dates but no final build metadata. | Archived download metadata/release notes could resolve. |
| C-040 | UNKNOWN | High | VST instruments and product-native synthesizers/samplers are not established. | Instrument hosting/content | S-003, S-007 | Official workflow repeatedly says VST effects. | Absence is not definitive without complete manual/release notes. |

## 22. Source ledger and adaptive bibliography

All retained sources are public first-party pages under the official Kreatives.org KRISTAL site. Access date for each is **2026-08-29**. The live historical manual was preferred to reposted PDFs, search snippets, download aggregators, and user reports because it preserves publisher provenance and readable section context. Fetched/search text was treated as untrusted evidence, never instructions.

### S-001 — KRISTAL Audio Engine product/news page

- **Publisher/title/URL:** Kreatives.org, “KRISTAL Audio Engine,” https://www.kreatives.org/kristal/
- **Kind/scope:** official historical product page and dated news; feature strip plus 2007, 2009, 2012, and 2019 notices.
- **Relevant passages:** 16 tracks/32-bit/44.1–192 kHz/insert-slot feature strip; “KRISTAL licensing discontinued!”; K2 preregistration; “PreSonus/KristalLabs unveiled Studio One!”
- **Claims:** C-003–C-005, C-022, C-031–C-033, C-037, C-039.
- **Limitations:** mutable live page, marketing/news wording, no build manifest or engineering detail; Studio One links may no longer preserve historical targets.
- **Selection rationale:** only retained first-party source directly covering discontinuation and the vendor-stated K2/Studio One succession/import boundary.

### S-002 — KRISTAL Audio Engine Reference Manual: Welcome

- **Publisher/title/URL:** Kreatives.org; Paul Sellars & Matthias Juwan, “KRISTAL Audio Engine Reference Manual: Welcome,” https://kreatives.org/kristal/manual/eng/welcome.html
- **Kind/scope:** official 2004 manual landing page.
- **Relevant passage:** author byline, navigation to product definition/UI/recording/mixdown, copyright 2004.
- **Claims:** C-001, C-017, C-039.
- **Limitations:** landing page contains little behavior and does not provide build metadata in body text.
- **Selection rationale:** anchors authorship/date/provenance for the linked manual corpus.

### S-003 — What is KRISTAL Audio Engine?

- **Publisher/title/URL:** Kreatives.org, “What is KRISTAL Audio Engine?”, https://kreatives.org/kristal/manual/eng/whatis.html
- **Kind/scope:** official 2004 manual overview.
- **Relevant passage:** “designed as a modular system”; main application mixer versus separate audio-sequencer/live-input PlugIns; complete key-feature, bundled-module/effect, file-format, AES31, and freeware lists.
- **Claims:** C-001–C-004, C-008–C-010, C-014–C-016, C-022, C-027–C-030, C-032, C-036–C-040.
- **Limitations:** feature summary does not establish deep host/runtime semantics; “VST” generation unnamed.
- **Selection rationale:** highest-density first-party statement of identity, modular boundary, limits, media, and license.

### S-004 — KRISTAL User Interface Overview

- **Publisher/title/URL:** Kreatives.org, “KRISTAL User Interface Overview,” https://kreatives.org/kristal/manual/eng/components.html
- **Kind/scope:** official UI map.
- **Relevant passage:** Mixer, Transport Panel, Channel EQ, Waver, and LiveIN component list.
- **Claims:** C-002, C-025.
- **Limitations:** diagram/navigation rather than operational detail; no process implication.
- **Selection rationale:** corroborates the user-visible component decomposition without relying on screenshots as implementation evidence.

### S-005 — The KRISTAL Mixer

- **Publisher/title/URL:** Kreatives.org, “The KRISTAL Mixer,” https://kreatives.org/kristal/manual/eng/mixer.html
- **Kind/scope:** official mixer reference.
- **Relevant passage:** four source slots, Waver/LiveIN selection, theoretical 64 versus simultaneous 16 tracks, editor button, output selection, CPU meter, channel strips, stereo master.
- **Claims:** C-002, C-006, C-007, C-010–C-012, C-024, C-025, C-027, C-034, C-035.
- **Limitations:** omits buses/automation and does not disclose graph/process internals.
- **Selection rationale:** decisive primary source for recorder/mixer/module boundaries and the 16-versus-64 contradiction check.

### S-006 — KRISTAL Waver

- **Publisher/title/URL:** Kreatives.org, “KRISTAL Waver,” https://kreatives.org/kristal/manual/eng/waver/waver.html
- **Kind/scope:** official sequencer-module overview.
- **Relevant passage:** Waver is the audio-sequencer PlugIn and main recording/editing/arranging workspace; links toolbar, arrangement, track controls, audio parts, pool.
- **Claims:** C-002, C-006–C-009, C-025, C-027.
- **Limitations:** conceptual overview; detailed recording operations are outside this retained page set.
- **Selection rationale:** pins Waver ownership and prevents the main mixer from being mischaracterized as the sequencer.

### S-007 — Using VST Effects

- **Publisher/title/URL:** Kreatives.org, “Using VST Effects,” https://kreatives.org/kristal/manual/eng/tutorial/effects.html
- **Kind/scope:** official VST-effects tutorial.
- **Relevant passage:** channel/master insert effects; global/application/three assigned folders; effect selection; custom/generic editors; programs; activate; `.fxp`/`.fxb`.
- **Claims:** C-017–C-021, C-026, C-029, C-030, C-032, C-034, C-040.
- **Limitations:** calls format only “VST”; no instrument, bus, state, latency, process, validation, or failure contract.
- **Selection rationale:** strongest first-party host-surface evidence and preferable to format-logo inference.

### S-008 — ASIO vs. MME

- **Publisher/title/URL:** Kreatives.org, “ASIO vs. MME,” https://kreatives.org/kristal/manual/eng/tutorial/asio.html
- **Kind/scope:** official Windows driver explanation.
- **Relevant passage:** ASIO multichannel/low latency/high rates; MME stereo/high latency; combined ASIO/MME not synchronized.
- **Claims:** C-012, C-030, C-032.
- **Limitations:** qualitative vendor documentation, not measured performance or scheduler detail.
- **Selection rationale:** direct primary evidence for platform and driver/synchronization boundaries.

### S-009 — Preferences

- **Publisher/title/URL:** Kreatives.org, “Preferences,” https://kreatives.org/kristal/manual/eng/preferences.html
- **Kind/scope:** official application/audio/VST/device settings reference.
- **Relevant passage:** `.kristal` reopen; external editor; block size; separate MME buffers and formula; sample rates; preload; ASIO ports; startup global-folder scan; three VST folders; editor always-on-top.
- **Claims:** C-013, C-014, C-017–C-023, C-025, C-026, C-030.
- **Limitations:** no scan-cache/validation detail and no project schema or plugin-state recall description.
- **Selection rationale:** only retained primary page describing block processing, latency math, scanning trigger, and project extension together.

### S-010 — The Waver Arrangement

- **Publisher/title/URL:** Kreatives.org, “The Waver Arrangement,” https://kreatives.org/kristal/manual/eng/waver/arrangement.html
- **Kind/scope:** official Waver arrangement reference.
- **Relevant passage:** part name/attributes/start/offset/length/fades/volume; time units/locators; 16 tracks; direct mixer correspondence; mono/stereo parts; overlap mix; import or record.
- **Claims:** C-007–C-009, C-015, C-023, C-028, C-036, C-038.
- **Limitations:** no persistence schema, media relinking, tempo-map, comping, or recording-detail contract.
- **Selection rationale:** primary evidence for the non-destructive clip model and arrangement-to-mixer mapping.

**Negative retrieval results retained:** the configured web-search integration returned HTTP 429 during initial discovery; a direct HTTPS fetch of the `kristal.kreatives.org` manual index failed, while the same first-party manual was accessible under `kreatives.org`. Search-result text was used only to locate the official pages and was not cited. A bounded nested lineage researcher was attempted after synthesis but could not launch because the session was already at the configured subagent-depth limit; it produced no evidence.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted methods / available evidence | Blocker and impact | Safest next discriminating probe | Required access/fixture | Owner |
| --- | --- | --- | --- | --- | --- |
| Exact final version/build, release chronology, and complete OS matrix | Official page/manual/date/platform terminology; initial search was rate-limited. [C-039] | No retained first-party release manifest; weakens exact version/platform comparisons. | Locate an archived official download page, checksums, release notes, or signed metadata. | Public web archive only; no installer execution. | Unassigned |
| KRISTAL-module ABI, process model, graph, and scheduler | Modular UI/manual pages reviewed. [C-025] [C-027] | User documentation does not disclose internals; affects architecture transfer confidence. | Seek first-party developer/engineering documentation or patent that explicitly names KRISTAL internals. | Public primary document. | Unassigned |
| Exact VST generation and effect/instrument scope | Effects/preference pages, 2004 manual date, `.fxp/.fxb`. [C-017] [C-040] | Format called only “VST”; VST2 mapping is inferential. | Archived official requirements/release notes or an authorized version-string probe. | Version-pinned official artifact or primary metadata. | Unassigned |
| Scanning cache, identity, duplicates, validation, blacklist, and rescan | Startup scan/path settings reviewed. [C-018] [C-021] | Manual stops at path scan; affects robust-host comparison. | Authorized disposable VM with purpose-built good/duplicate/invalid plugins, recording each state transition. | Lawful installer plus non-malicious VST2 fixtures. | Unassigned |
| Plugin execution isolation, bridging, and crash containment | Effects/UI/preferences checked; only window behavior found. [C-019] [C-025] | Window/process conflation risk; major reliability unknown. | First-party engineering docs, otherwise an authorized process/crash probe in a disposable VM. | Lawful historical binary and safe crash fixture. | Unassigned |
| Audio/MIDI/event buses, sidechains, multi-output, dynamic I/O, and instruments | Mixer/effects/manual overview reviewed. [C-021] [C-040] | Effects-insert surface is insufficient to establish host contract. | Version-pinned capability fixtures separately testing effect, synth, MIDI, sidechain, and multi-output entry points. | Authorized harness and lawful plugins. | Unassigned |
| Plugin latency/tails, PDC, bypass/suspend, and offline render | Driver latency and activation/mixdown pages compared. [C-013] [C-021] | Device latency is not plugin compensation; affects timing/render conclusions. | Impulse/tail/latency fixtures with real-time and mixdown comparison. | Authorized disposable audio test environment. | Unassigned |
| Plugin/project state, missing plugin, assets, migration, recovery | `.kristal` and `.fxp/.fxb` docs compared. [C-022] [C-026] | Separate save features do not prove recall; affects project durability. | Save/reopen/remove/replace/corrupt-plugin matrix with byte-independent behavioral assertions. | Lawful installer/plugins and disposable projects; no format reverse engineering. | Unassigned |
| `.kristal` schema, atomic save, autosave, backup, media relink | Project preference and Waver parent-file model reviewed. [C-023] [C-026] | Proprietary schema undisclosed; affects portability/recovery. | First seek public format/import specification; otherwise behavioral missing-media/save-interruption tests under separate authority. | Public spec or authorized disposable fixture. | Unassigned |
| Automation, MIDI, sync, comping, and advanced editing | Overview/mixer/Waver arrangement reviewed. [C-009] [C-034] [C-036] | Selected manual pages may not be exhaustive; lower decision relevance for this modular-host dossier. | Archived full manual index/release notes targeted by named feature. | Public archived documentation. | Unassigned |
| Studio One code or architecture inheritance | Official K2/Studio One/successor/import notice reviewed; nested bounded check blocked by depth limit. [C-005] [C-033] | Product succession does not establish implementation influence. | First-party engineering retrospective or public source history naming a concrete inherited component. | Public primary evidence; no decompilation. | Unassigned |
| Security, updates, privacy, accessibility, localization | Product/manual pages reviewed. [C-031] | No dedicated retained documentation; prevents assurance claims. | Archived official legal/support/accessibility pages, if any. | Public web archive. | Unassigned |

## 24. Curiosity pass and stop decision

After each two-source pass, findings and contradictions were synthesized before another retrieval. Scores use 1 (low) to 5 (high); for **cost**, 1 is low cost and 5 is high cost.

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Disposition |
| --- | ---: | ---: | ---: | ---: | --- |
| Bounded first-party KristalLabs/K2/Studio One lineage check | 5 | 4 | 4 | 3 | **Pursued:** nested no-edit researcher launch attempted; blocked by configured subagent-depth limit. Existing S-001 supports only succession/import. |
| Historical VST licensing-agreement reconstruction | 3 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: product-specific rights cannot be established from generic format history; seek rights-holder records only if implementation is proposed. |
| Secondary reviews/forum anecdotes for host failures | 2 | 2 | 2 | 2 | `CURIOSITY_NO_GO`: cannot prove proprietary internals; official manual already saturates visible behavior. |
| Additional low-level Waver tutorial pages | 2 | 2 | 1 | 2 | `CURIOSITY_NO_GO`: may add editing commands but is unlikely to alter modular/plugin architecture conclusions. |
| Binary/project-file reverse engineering | 4 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: outside lawful clean-room documentary scope and unnecessary for this wave. |
| Historical installer execution | 3 | 3 | 3 | 5 | `CURIOSITY_NO_GO`: withdrawn official download, licensing/trust risk, and dynamic work belongs in a separately approved harness. |
| Broad Studio One comparison | 3 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: separate roster product; would invite unsupported influence claims. |

**Stop decision:** stop on **depth-budget exhaustion plus evidentiary saturation**. Five passes retained two first-party pages each. The resulting corpus resolves identity, module/mixer/recorder boundaries, block/driver behavior, audio arrangement, VST discovery/UI/preset surface, project extension, discontinuation, and bounded succession. Another documentary page is unlikely to resolve the highest-impact unknowns—process isolation, module ABI, VST identity/state/PDC, project schema, or code lineage—which require rights-holder engineering material or separately authorized behavioral probes. The failed nested check yielded no source and did not justify broadening scope.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created `research/daw-landscape/dossiers/kristal-audio-engine.md`; no other path was written, staged, or committed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0 distinguishes the 2004 manual snapshot, unknown final build, historical Windows evidence, and 2019 discontinuation.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all 11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive sections cite C-001–C-040; the register classifies each.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Section 21 maps claims to S-001–S-010 and states reasoning/limits.
- [x] **Every required plugin-format row is present.** All 13 required rows appear in section 11.1 with no blank cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover scan paths, runtime gaps, processing, UI, presets/state, and diagnostics.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Vendor claims, the VST2-era inference, and proprietary gaps are separately labeled.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 limits freeware/VST/trademark conclusions and forbids rights inference.
- [x] **Bibliography records source rationale and limitations.** Section 22 gives URL, kind/scope, passage, claims, limitations, and selection rationale per source.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24 record pursued/rejected threads and reopening conditions.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary web retrieval only; no binaries/plugins were downloaded or run.

**Checks performed:** governing-file/template comparison; heading-order review; 13-row plugin-matrix review; claim-to-source mapping review; unknown/probe review; assigned-path status check. **Concise result:** complete with explicit historical and proprietary unknowns. **Unresolved blockers:** exact final build/OS list, deep host/state/runtime behavior, project schema/recovery, and engineering lineage. **Pre-existing workspace changes:** numerous unrelated modified/untracked paths were visible before dossier creation and were left untouched.
