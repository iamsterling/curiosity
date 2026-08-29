# Radium DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** Radium, described upstream as a music editor and DAW with a tracker-like graphical/text editor. [C-001]
- **Canonical vendor/upstream:** Kjetil S. Matheussen / `radium.dog`; canonical public source is `kmatheussen/radium`. [C-001] [C-002]
- **Researcher/session:** research specialist, `ses_fb274af0fffe6F9hpkH450Ig4x`.
- **Owned path:** `research/daw-landscape/dossiers/radium.md`.
- **Research date / cutoff:** 2026-08-29 UTC.
- **Current release scope:** Radium `7.5.78`, released 2026-04-11; immutable tag commit `ad23ca84824e90326df9fe527c02d376c40c5cfc`, authored `2026-04-11T12:18:10+02:00`. [C-002]
- **Edition scope:** one product family distributed as public source plus demo/beta and full builds. Full access is sold or supplied to subscribers, but the downloaded program does not expire with the subscription; source shows a demo restriction after two simultaneous VST/VST3/AU instances. [C-004] [C-045]
- **Platform scope:** the documented product boundary is desktop: Windows 8+, Linux with glibc 2.34+, macOS x86 11+, and macOS arm64 14+ for the current branch. Mobile/web matrix cells are outside that documented boundary, not proof that no related code could exist. [C-003]
- **Inclusions:** current public product/manual, tagged source, editor/sequencer/mixer/audio-engine boundaries, persistence, scripting/integration, and third-party hosting.
- **Exclusions:** installers and binaries; plug-in execution or conformance probes; proprietary/non-public information; exhaustive bundled-content inventory; independent performance, security, or accessibility certification.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. Documentary coverage is sufficient for comparison, while runtime isolation, architecture bridging, advanced plug-in contracts, recovery, and accessibility remain unresolved. [C-027] [C-032] [C-036] [C-041]

## 1. Executive summary

Radium's architecture-relevant differentiator is a three-way separation: reusable editor **Blocks**, arranged **Seqblocks** on **Seqtracks**, feed a modular audio graph that can also be viewed as generated mixer strips. The editor combines tracker text with graphical notes/effects and an optional piano roll rather than requiring a conventional linear clip editor. [C-006] [C-007] [C-008]

The public engine is unusually inspectable. Its internal block defaults to 64 frames but is configurable, graph-ready `SoundProducer` nodes are scheduled by dependency across worker and player threads, and source plus official documentation evidence graph-wide latency compensation. Song/block/range rendering switches hosted processors to non-realtime mode and captures the same mixer output path. [C-009] [C-010] [C-011] [C-012] [C-013]

Current format evidence is broad but uneven. VST2, VST3, and LADSPA are documented on Linux/macOS/Windows; generic AU is documented on macOS; LV2 is documented on Linux/macOS and explicitly disabled on Windows. The AUv2/AUv3 subtype is not identified. A source file labeled “Example plugin” is insufficient to establish CLAP hosting. [C-020] [C-021] [C-022]

Plug-in handling goes well beyond logos: the JUCE formats use a separate `radium_plugin_scanner` process, disk description/registry caches, persistent blacklist markers, duplicate selection rules, in-process runtime creation, MIDI/audio processing, custom or generic UI, parameters, latency/tails, non-realtime mode, programs, and serialized state. LADSPA has a separate direct-library host. Missing plug-ins are replaced by a built-in `Pipe`; preservation of the absent plug-in's opaque state through a save/reload cycle is unknown. [C-023]–[C-033]

Projects are textual `.rad` files combining named records and versioned hash serialization for blocks, sequencer, mixer, instruments, and plug-in state. Automatic backups, overwrite `.bak` files, and best-effort crash emergency saves are documented, but backup rotation, restart discovery, corruption recovery, and durable missing-plug-in relinking are not. [C-034] [C-035] [C-036]

**Overall confidence:** high for release identity, public source mechanics, editor concepts, and basic host paths; medium for edition behavior and format/platform enablement; low for conformance, runtime fault containment, advanced bus/automation behavior, recovery guarantees, and accessibility because no binary probe was permitted. [C-002] [C-020] [C-027] [C-032] [C-041]

## 2. Product identity, history, and market position

The official site calls Radium a “music editor with a new type of interface” and a DAW for recording, editing, and mixing audio. It positions the editor between piano-roll and tracker workflows: more data density than a piano roll, but graphical editing in addition to tracker-style text. [C-001]

Development began in 1999 from ideas explored while extending OctaMED on Amiga in 1997–1999; the first public version appeared in 2000, followed by Linux, Windows, and macOS ports. The 2026 release and tagged source establish continuing maintenance at the cutoff. [C-001] [C-002]

The platform floor is explicit, as is the full-build access model. The official download page nevertheless contradicts itself on macOS maturity: one passage says it should probably no longer be considered beta, while another calls the macOS download a beta. Current macOS support status is therefore **UNKNOWN** beyond the documented OS floors and the vendor's stated performance/stability caveats. [C-003] [C-004] [C-005]

## 3. Workflow and conceptual model

A **Block** is the reusable editor object analogous to a tracker pattern. A **Seqtrack** is a sequencer track; a **Seqblock** places either an editor Block or an audio file on a suitable Seqtrack. The playlist is a textual view of the current Seqtrack, while the sequencer supplies the arrangement view. [C-006]

Editor Blocks contain note tracks and timing tracks. Notes and effects can be edited graphically or as text; an optional piano roll, non-destructive Lines Per Beat changes, per-track/global swing, tempo automation, and microtonality are documented. [C-007]

The signal-flow model is not fixed to the arrangement tracks. Radium calls sound-producing and processing objects “Instruments,” exposes them in a modular mixer graph, and derives conventional mixer strips from those graph objects. Creating an instrument from the editor, mixer, or audio Seqtrack consequently creates the corresponding strip. [C-008]

**INFERENCE:** this makes Radium a hybrid tracker/arranger/modular workstation rather than a tracker with a merely decorative mixer. The alternative interpretation—that the graph is only a presentation layer—is contradicted by its explicit wiring, sidechain construction, persisted mixer state, and graph scheduler. [C-040]

## 4. Publicly documented architecture

The immutable tag exposes separate directories/modules for editor/common data, sequencer, Qt/OpenGL UI, mixer UI, MIDI, audio engine, plug-in host/JUCE, API, embedded Scheme, platform backends, crash reporter, and build/package code. These are source-module boundaries, not proof that every module runs in its own process. [C-009]

The only established plug-in process boundary is scanning: the main application starts `radium_plugin_scanner`/`.exe`, which loads candidates to produce XML descriptions. Runtime JUCE instances are created through `AudioPluginFormatManager` inside the application path, while LADSPA libraries are directly loaded by its native adapter. [C-009] [C-024] [C-026]

The audio graph is represented by `SoundProducer` objects and active links. Readiness follows input dependencies, processing releases downstream dependencies, and worker threads share the ready queue with the player thread. [C-011]

Proprietary deployment details do not apply to the public core, but binary packaging, OS services, signing/notarization, and any undisclosed release-only changes remain **UNKNOWN** because source inspection was not paired with binary qualification. [C-041]

## 5. Audio engine

Radium initializes the internal audio block size to 64 frames and reads the persisted `audio_block_size` setting at startup. Preferences expose 64 through 8192 frames; source states the value cannot change after startup, and device/JACK paths require hardware buffers to be at least and generally divisible by the internal size. This refutes the initial hypothesis that 64 is immutable. [C-010]

For each internal block, multicore setup counts active input links, queues zero-dependency `SoundProducer` nodes, and queues a target when its final active dependency completes. The configurable CPU count defaults to the platform's ideal thread count within a compile-time maximum; no benchmark was run. [C-011]

Graph latency compensation is enabled by default. Each producer accumulates plug-in and highest-input latency, and links delay lower-latency branches to the highest active input path. The documented maximum compensated latency is 1000 ms; hosted JUCE and LADSPA adapters report latency into this graph. [C-012]

Offline export selects the whole song, current Block, or range; puts hosted processors into non-realtime mode; enables JACK freewheel or the non-JACK saving thread; plays the selected scope through the mixer; and writes interleaved floating-point output with libsndfile. This establishes a common mixer path, not deterministic conformance for every plug-in. [C-013]

The inspected JUCE processing path uses `float` channel buffers. Engine-wide accumulator precision, supported sample-rate limits, oversampling policy, freeze semantics, dropout recovery, denormal policy across all modules, and reproducible performance limits are **UNKNOWN**. [C-014]

## 6. Tracks, timeline, clips, and editing

The editor/sequencer split supports reusable Blocks, editor Seqtracks, audio-file Seqtracks, moving/copying/multi-selecting Seqblocks, effect and tempo automation, loop markers, and separate editor- versus sequencer-timing modes. When the first Seqtrack is audio, sequencer timing is mandatory. [C-006] [C-007]

Audio Seqtracks can insert files and record them; the source also exposes sample-rate conversion and stretch/speed automation surfaces, but fidelity and exact destructive/non-destructive guarantees were not dynamically tested. [C-015]

The manual's “unlimited undo/redo” claim is retained as vendor documentation, not independently measured capacity. Conventional takes/lanes, comping, track folders/groups, ripple editing, clip versioning, and a comprehensive edit-history persistence model are **UNKNOWN**. [C-007] [C-042]

## 7. MIDI, sequencing, notation, and expression

Radium documents MIDI sequencing and recording, hardware input configuration, MIDI Learn, piano-roll and tracker note entry, velocity/pitch/effect automation, microtonality, and timing sent to external plug-ins. JACK Transport can receive Radium timing when Radium is time master; the manual says Radium does not take its timing from JACK Transport. [C-007] [C-016]

The JUCE host sends note on/off, aftertouch-like velocity changes, and raw three-byte MIDI at block offsets; it receives plug-in MIDI with sample positions and forwards events at bounded offsets. However, plug-in-emitted messages longer than three bytes are explicitly filtered, so plug-in SysEx output is not forwarded by this path. [C-016] [C-017]

Hardware MIDI APIs include a separate SysEx send surface, but full SysEx input/output round-trip behavior, MPE/per-note expression, MIDI 2.0, score/notation, MTC, and external clock-slave behavior remain **UNKNOWN**. Their absence from the focused manual/source search was not converted into non-support. [C-018]

## 8. Routing, mixer, automation, and control

The modular mixer wires instruments, processors, buses, patchbays, sends/receives, and system I/O. Mixer strips are generated views of graph objects rather than a second routing model. The manual demonstrates a multi-input sidechain by routing two `Patchbay8` modules into an included SC3 LADSPA processor. [C-008]

Parameters can be automated graphically in editor tracks or sequencer tracks, recorded from a slider/MIDI controller, edited as FX text, or driven by modulators. MIDI Learn is centrally configurable. These are product-level automation capabilities; they do not by themselves establish sample-accurate third-party parameter delivery. [C-007] [C-028] [C-032]

Source-visible integration includes JACK timing, NSM session hooks, and API calls to create OSC servers/methods and send OSC messages. Controller-profile stability, OSC schema compatibility, feedback-cycle policy, VCA/folder semantics, and surround/immersive layout policy are **UNKNOWN**. [C-037] [C-038]

## 9. Recording, comping, and media handling

Audio Seqtracks expose record controls, configurable channel/source routing, and sequencer punch-in/out. The sample player can also record internal or external audio to a newly created file, and recording latency can incorporate device and graph latency. [C-015]

Offline output is libsndfile-backed and lets the UI choose format, channel count, resampling quality, and post-recording duration. The retained evidence did not establish a canonical exhaustive import/export codec list or metadata fidelity. [C-013] [C-015]

Input-monitoring modes, loop-take management, comping, media pools, conform/proxy workflows, video, BWF metadata, collect/archive, and robust asset relinking are **UNKNOWN**. [C-038] [C-042]

## 10. Instruments, effects, content, and native devices

Official documentation lists built-in instruments/effects, granular synthesis, modulators, sampler/sample player, multiband compression, more than 100 included LADSPA plug-ins, an embedded Faust development environment, and Pure Data on Linux. The manual describes realtime Faust compilation while editing. [C-019]

Native mixer utilities include buses, pipes, patchbays, sends/receives, audio Seqtrack processors, and system I/O; these share the `SoundPlugin`/`SoundProducer` graph boundary with hosted plug-ins. [C-008] [C-009]

The exact factory-device/content inventory, preset licensing, content download/version policy, and compatibility of user-authored Faust/Pd material were not exhaustively audited. [C-038] [C-044]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means the current evidence did not establish the requested boundary; it does not mean unsupported. “AU” is not silently expanded into AUv2 or AUv3. [C-021]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no documented product | 7.5.78 official matrix and immutable host source; demo instance cap applies | JUCE scan/runtime plus old-song compatibility path | C-020, C-023–C-031, C-045; S-002, S-006–S-010 |
| VST3 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no documented product | 7.5.78 official matrix and immutable host source; demo instance cap applies | JUCE scan/runtime; program-list code is disabled for current VST3 path | C-020, C-023–C-031, C-045; S-002, S-006–S-009 |
| AUv2 | UNKNOWN:generic AU only | NOT_APPLICABLE:Apple host format | NOT_APPLICABLE:Apple host format | NOT_APPLICABLE:no documented product | 7.5.78 says “AU” without subtype | Scanner/runtime map generic AudioUnit/AU; subtype not proven | C-020, C-021; S-002, S-006, S-007, S-009 |
| AUv3 | UNKNOWN:generic AU only | NOT_APPLICABLE:Apple host format | NOT_APPLICABLE:Apple host format | NOT_APPLICABLE:no documented product | 7.5.78 says “AU” without subtype | No qualifying AUv3-specific host evidence | C-021; S-002, S-006, S-007 |
| AAX | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no documented product | No current official/source host claim found | Bundled JUCE client code is not Radium host evidence | C-021; S-003, S-006, S-007 |
| CLAP | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no documented product | Incomplete file labeled “Example plugin”; absent from retained build registration | Not production hosting evidence | C-022; S-015 |
| LV2 | DOCUMENTED | DOCUMENTED:no host enabled | DOCUMENTED | NOT_APPLICABLE:no documented product | 7.5.78 official matrix/source | Source enables Linux/macOS and explicitly disables Windows | C-020, C-023–C-031; S-002, S-006–S-009 |
| LADSPA | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no documented product | 7.5.78 official matrix/manual/source | Separate direct-library host; bundled set documented | C-020, C-023, C-026, C-028, C-029; S-002, S-004, S-010 |
| DSSI | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no documented product | No qualifying current claim found | Evidence scarcity; LADSPA must not be generalized to DSSI | C-021; S-002, S-003 |
| JSFX | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no documented product | No qualifying current claim found | Evidence scarcity | C-021; S-002, S-003 |
| DirectX/DXi | NOT_APPLICABLE:Windows format | UNKNOWN | NOT_APPLICABLE:Windows format | NOT_APPLICABLE:no documented product | No qualifying current host claim found | Windows audio backends are not DXi evidence | C-021; S-002, S-003 |
| Rack Extension | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no documented product | No qualifying current host claim found | No SDK/trademark rights implied | C-021, C-044; S-002, S-003 |
| Product-native/other | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no documented product | 7.5.78 manual/source | FaustDev on all via interpreter, optional LLVM by platform; Pure Data Linux; Scheme/Python APIs | C-019, C-037; S-001, S-002, S-004, S-013 |

### 11.2 Discovery, scanning, validation, and recovery

On macOS, source recursively searches `/Library/Audio/Plug-Ins/VST`, `VST3`, and `Components`; on Linux/Windows it recursively scans configurable VST paths with a 30-second continue prompt. LV2 discovery uses Lilv world enumeration on enabled platforms. LADSPA uses `LADSPA_PATH` or platform/default directories including the bundled `ladspa` directory. [C-023]

Each JUCE candidate container is loaded by the separate scanner to create XML `PluginDescription` records. SHA-1-derived files under Radium's scanned-plug-ins directory cache descriptions and registry entries; registry hashes retain type/name, path, creator/category, I/O counts, file size, and modification time. Cache-clear/rescan functions preserve blacklist files while deleting other registry files. [C-024]

Before population, a container is pessimistically blacklisted; successful or non-crash-terminal completion removes that marker. Missing/invalid scanner output and user-selected timeout cancellation can retain the blacklist, and users may explicitly “Open anyway.” This is scan crash containment, not runtime containment. [C-024]

If multiple files provide the same container identity, Radium warns and chooses the first usable container; cache paths are adjusted when the same container appears under multiple paths. The adequacy of identity collision handling across vendors/architectures is untested. [C-025]

### 11.3 Runtime isolation and compatibility

**INFERENCE:** normal JUCE-hosted plug-ins execute in Radium's process because the application creates `AudioPluginInstance` objects and directly calls `processBlock`; the separate child process is confined to description scanning. LADSPA is more directly documented as in-process through `QLibrary`, descriptor instantiation, and direct `run` calls. [C-026]

No process-per-plug-in mode, runtime crash restart, x86/arm or 32/64-bit bridging, Rosetta policy, plug-in signature/notarization enforcement, filesystem/network sandbox, or compatibility-mode matrix was established. Those trust and compatibility properties remain **UNKNOWN**. [C-027]

### 11.4 Host/plugin processing contract

The JUCE adapter enables buses, derives aggregate channel counts, calls `prepareToPlay(sample_rate, block_size)`, processes float audio plus a MIDI buffer, accepts/produces MIDI, and forwards plug-in MIDI at reported sample offsets. It exposes instruments/effects through a shared `SoundPluginType`. LADSPA separately connects audio/control ports and runs one or two handles according to channel adaptation. [C-028]

The host reads plug-in latency and tail length, integrates latency into the graph, provides bypass, and calls `setNonRealtime` for export. The graph also carries transport/tempo/time-signature position to JUCE processors with input latency subtracted. [C-012] [C-029]

Source enumerates multiple input/output buses and flattens their channels, while the manual shows a LADSPA multi-input sidechain. Dynamic bus changes after instantiation, semantic sidechain-bus preservation, arbitrary multi-output routing, sample-accurate parameter automation, MPE/MIDI 2.0, and suspend/resume conformance remain **UNKNOWN**. [C-032]

### 11.5 Parameters, automation, state, presets, and project recall

JUCE parameters are enumerated with index-prefixed names, normalized values, labels, and display text. Host callbacks connect these parameters to editor/sequencer automation, MIDI Learn, modulators, and bypass. Stable cross-version parameter IDs and sample-accurate delivery are not established. [C-028] [C-032]

Project state stores the plug-in's full state block, current-program state, current program number, and a JUCE identifier string. Reload checks identifier compatibility, restores full/program state, and warns if the saved program index no longer exists. Program enumeration is deliberately disabled for VST3 in this source because of the bundled JUCE version, although opaque state still exists. [C-030]

When a named plug-in cannot be found, Radium logs the problem and creates a built-in `Pipe`. Whether the original opaque state and identity survive subsequent save/reload for later relinking is **UNKNOWN**; a `Pipe` is therefore not treated as a qualified durable placeholder. [C-033] [C-036]

### 11.6 UI, diagnostics, and failure modes

If a hosted processor has a custom editor, Radium creates it; otherwise it creates a generic parameter editor. The containing window adds bypass, always-on-top, keyboard-grab, A/B, optional virtual keyboard, scaling transform, and a Windows DPI-awareness toggle. Editor deletion is delayed to work around observed plug-in teardown crashes. [C-031]

Diagnostics include scan progress, timeouts, scanner launch/parse errors, blacklist state, duplicate-provider warnings, incompatible-state warnings, program-index warnings, and plugin-name attribution in the crash reporter. These mechanisms do not prove runtime fault isolation. [C-024] [C-025] [C-027] [C-030] [C-043]

Detached-editor semantics beyond the top-level plug-in window, headless rendering behavior, accessibility of third-party editors, per-plug-in scaling guarantees, hang recovery, and corrupt-state containment remain **UNKNOWN**. [C-027] [C-032] [C-041]

## 12. Extensibility and integration

Radium officially advertises Scheme and Python scripting. The bundled scripting documentation identifies S7 Scheme and Python 2, with Python missing APIs that use dynamic vector/function types; scripts can be bound to keys. The source also exposes a large generated API, OSC server/method/send calls, and NSM session scripts. [C-037]

FaustDev and Linux Pure Data are user-programmable sound-device boundaries rather than general native binary SDKs. Source availability permits lawful behavioral study, but API/ABI stability, third-party certification, semantic versioning, deprecation policy, and support for modern Python are **UNKNOWN**. [C-019] [C-037] [C-038]

## 13. Project format, persistence, interoperability, and collaboration

`.rad` saves begin as a `RADIUM SONG` document and use textual named records plus versioned `HASH MAP` blocks. Current song persistence covers editor Blocks/windows, sequencer state, mixer graph, audio/MIDI instruments, comments, timing/mixer policy, and hosted plug-in state. The loader contains explicit older-song compatibility branches, but no blanket forward/backward guarantee is claimed. [C-030] [C-034]

Automatic backups use a configurable interval and fixed `<song>_automatic_backup.rad` path, skip unchanged/no-undo/demo/unsaved/recording situations, and can be configured to avoid saving while playing. Atomic replacement first copies the prior target to `.bak`, replacing any earlier `.bak`. The crash reporter may create an emergency song but explicitly warns that it may be malformed. [C-035]

Restart-time crash-recovery discovery, backup rotation/retention, corruption repair, concurrent-save behavior, durable missing-plug-in round trips, asset collection, and migration guarantees remain **UNKNOWN**. [C-036]

No qualifying evidence established AAF, OMF, ADM, MusicXML, DAWproject, cloud collaboration, built-in version control, or cross-DAW project exchange. NSM integration is documented as a Linux session boundary, not cloud collaboration or a generic interchange format. [C-037] [C-038]

## 14. Delivery, live, post-production, and specialized workflows

Radium can render the song, current Block, or selected range through its mixer with selectable file format, channels, resampling quality, and post-recording length. The official site also documents frame-accurate playback synchronization with external systems and JACK transport time-master operation. [C-013] [C-016]

Its specialty is tracker-density composition combined with graphical curves, audio Seqtracks, and a modular graph. [C-001] [C-006] [C-008]

Batch queues, stem-set manifests, loudness targets, DDP, video/timecode/ADR, conform, surround/immersive/ADM delivery, show-control redundancy, and performance-set recovery are **UNKNOWN**. [C-038]

## 15. Performance, reliability, security, and accessibility

Documented reliability mechanisms include dependency-aware multicore processing, configurable CPU count, latency bounds, scanner process containment, persistent blacklisting, disk caches, atomic save replacement, automatic backups, and best-effort emergency saves. None was independently stress-tested. [C-011] [C-012] [C-024] [C-035]

Runtime plug-ins appear in-process, so the scanner boundary does not remove the render-time trust boundary. Runtime crash/hang containment, resource quotas, architecture bridging, signing policy, secure update/rollback, and malicious plug-in resistance remain **UNKNOWN**. [C-026] [C-027] [C-041]

The crash dialog says a report is sent only when the user presses **SEND**, anonymously, only with visible/editable details, and names running third-party plug-ins as possible causes. That is source evidence for this crash-report path, not a complete telemetry/privacy audit. [C-043]

The macOS maturity contradiction is preserved. Screen-reader semantics, keyboard-only completeness, reduced-motion support, localization coverage, tested high-DPI behavior, and formal accessibility conformance are **UNKNOWN**. [C-005] [C-031] [C-041]

## 16. Licensing, ecosystem, and implementation constraints

The repository contains the GNU GPL version 2 license text, while representative Radium source headers state GPL version 2 or, at the user's option, any later version. Bundled JUCE, LV2, codec, LADSPA, and other dependencies have their own notices; component-level provenance must not be flattened into one unqualified statement. [C-039]

The open source is useful for clean-room architectural understanding, but this dossier does not authorize copying protected code, UI assets, manuals, or third-party SDK material. Any adaptation must use independently authored mechanisms and satisfy the applicable licenses. [C-039] [C-044]

VST2, VST3, Audio Unit, LV2, LADSPA, CLAP, AAX, and other names here describe evidence only. They do not grant SDK access, trademark use, redistribution, signing, notarization, compatibility, or certification rights. Exact current format-owner obligations were not researched in this product-bounded pass and remain **UNKNOWN**. [C-044]

## 17. Strengths, liabilities, and architecture lessons

**Strengths:** Radium cleanly separates reusable composition Blocks, arrangement instances, and signal-flow objects; makes the modular graph primary while generating familiar strips; exposes a dependency scheduler and graph-wide latency model; uses a separate scanner plus durable registry/blacklist state; and routes offline rendering through the mixer with explicit non-realtime notification. [C-006] [C-008] [C-011]–[C-013] [C-024]

**Liabilities:** normal runtime hosting appears in-process; format breadth includes legacy VST2/LADSPA; AU subtype and CLAP status are unclear; dynamic I/O, sidechain fidelity, sample-accurate automation, MPE, and bridging are unqualified; and the `Pipe` fallback is not proven to preserve missing state. [C-021] [C-022] [C-026] [C-027] [C-032] [C-033] [C-036]

**INFERENCE:** Radium is a strong clean-room reference for hybrid tracker/arranger/graph object boundaries, dependency scheduling, scan quarantine, and textual graph persistence, but not a sufficient sole reference for a hardened modern plug-in host or post-production DAW. A plausible alternative is that untested binaries or JUCE defaults provide stronger behavior; that possibility is why the relevant findings remain unknown rather than negative claims. [C-040]

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Support | Prerequisites, tradeoffs, and adaptation risk |
| --- | --- | --- | --- | --- |
| CANDIDATE | Reuse musical material without coupling it to signal flow | Stable composition object, arrangement-instance object, and separately identified graph node | C-006, C-008 | Requires explicit ownership, lifetime, tempo mapping, and missing-device semantics; do not copy Radium expression/UI |
| CANDIDATE | Offer modular routing and conventional mixing without two sources of truth | Treat graph nodes/edges as canonical and generate mixer strips from them | C-008 | Needs cycle rules, layout persistence, channel-role metadata, latency, and accessibility |
| CANDIDATE | Parallelize a real-time graph safely | Count active dependencies, queue roots, release downstream nodes when the final dependency completes | C-011 | Requires bounded queues, RT-safe graph mutation, deterministic cycle rejection, overload policy, and measurement |
| CANDIDATE | Compensate latency across arbitrary routing | Propagate cumulative producer latency and delay lower-latency inputs at merge points | C-012 | Requires dynamic latency invalidation, bounded memory, bypass/tail rules, and tests for feedback/send paths |
| CONDITIONAL | Contain discovery failures | Use a short-lived scanner, pessimistic persistent blacklist, metadata cache, timeout choices, and explicit retry | C-024, C-025 | Scanner protocol must be authenticated/validated locally; add hang kill, cache fingerprinting, architecture identity, and diagnostics |
| CANDIDATE | Keep offline and realtime paths behaviorally aligned | Render through the canonical graph while notifying processors of non-realtime mode | C-013, C-029 | Requires deterministic clocking, tail policy, cancellation, progress, and plug-in conformance fixtures |
| CONDITIONAL | Make projects inspectable and recoverable | Textual/versioned object records, atomic replace, one prior-file backup, periodic backup | C-034, C-035 | Add schema migrations, integrity checks, unknown-field preservation, rotation, recovery UI, and asset manifests |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT:** treating a separate scanner as runtime sandboxing. Runtime creation and processing remain in the application path. Reopen only if process inspection or maintainer documentation establishes a runtime mode not found here. [C-024] [C-026] [C-027]
- **REJECT:** representing a missing plug-in only as a generic pass-through without proven opaque-state preservation. Reopen after a remove/open/save/reinstall fixture demonstrates durable relinking. [C-033] [C-036]
- **REJECT:** expanding generic “AU” to AUv2 or AUv3. Reopen with subtype-specific official/build/runtime evidence. [C-021]
- **REJECT:** claiming CLAP support from `Clap_plugin.cpp`; it identifies itself as an example, has incomplete callbacks, and was not found in retained build registration. [C-022]
- **REJECT:** describing the engine as permanently fixed at 64 frames. The value is a configurable startup setting. [C-010]
- `CURIOSITY_NO_GO` — architecture-bridging hunt: high relevance, but documentary evidence saturated; requires controlled x86/arm and 32/64 fixtures. [C-027]
- `CURIOSITY_NO_GO` — exhaustive format-name search for AAX/DSSI/JSFX/DXi/Rack Extension: low expected value after official matrix and immutable tree enumeration; absence would still not prove non-support. [C-021]
- `CURIOSITY_NO_GO` — complete built-in LADSPA/content inventory: product inventory, not architecture-changing evidence. [C-019]
- `CURIOSITY_NO_GO` — installer/binary execution: prohibited and unnecessary for this documentary wave.
- `CURIOSITY_NO_GO` — deep accessibility inference from Qt/JUCE widgets: toolkit presence cannot establish end-to-end accessibility. [C-041]

## 20. Falsifiable hypotheses and adversarial checks

1. **H1 supported:** Radium's primary model is not a single tracker grid; it separates Blocks, Seqblocks/Seqtracks, and a modular mixer graph. Manual concepts and persisted architecture agree. [C-006] [C-008] [C-034]
2. **H2 falsified:** “The engine always uses a fixed 64-frame block.” Source initializes 64 but reads a configurable startup value and exposes multiple preferences. [C-010]
3. **H3 refined:** “Plug-ins are out-of-process.” Discovery is out-of-process for JUCE formats; runtime is in-process by source-based inference, and LADSPA is directly in-process. [C-024] [C-026]
4. **H4 supported with scope limits:** graph-wide latency compensation and non-realtime export are implemented, but no runtime fixture established correctness for dynamic latency, feedback, or every format. [C-012] [C-013] [C-029] [C-032]
5. **H5 rejected:** generic AU evidence identifies AUv2/AUv3. Neither official matrix nor inspected registration names a subtype. [C-021]
6. **H6 rejected:** the CLAP example establishes accepted/scanned/instantiated/rendered CLAP hosting. It does not establish any of those stages. [C-022]
7. **Host-contract adversarial check:** format accepted/discovered is evidenced by the official matrix and path registration; candidate scanning by the scanner; instantiation by `createPluginInstance`; audio/MIDI/state/UI/latency by adapter paths. Dynamic I/O, semantic sidechains, sample-accurate automation, MPE/MIDI 2.0, runtime recovery, and conformance remain separately unknown. [C-020] [C-023] [C-024] [C-028]–[C-032]
8. **Later safe probes:** in disposable OS/architecture VMs, test each stage independently with known-good and fault-injection fixtures; measure event offsets and latency; change buses/latency at runtime; crash/hang scan and render; save/remove/resave/reinstall plug-ins; and inspect accessibility trees. No dynamic probe was run here. [C-027] [C-032] [C-036] [C-041]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Radium is a maintained tracker-like graphical/text music editor and DAW whose lineage began in 1999, with first public release in 2000. | Product identity/history | S-001 | Direct official description/history | Vendor positioning, not market-share measurement |
| C-002 | DOCUMENTED | High | Current release is 7.5.78 dated 2026-04-11 at tag commit `ad23ca8…`. | Cutoff identity | S-001, S-003 | Official news plus immutable tag/commit metadata | No binary signature verification |
| C-003 | DOCUMENTED | High | The official current product boundary documents desktop builds with floors of Windows 8+, Linux glibc 2.34+, macOS x86 11+, and macOS arm64 14+. | Platforms | S-002 | Direct requirements | Requirements do not prove all hardware configurations; mobile/web is only outside the documented boundary |
| C-004 | DOCUMENTED | High | Demo/beta and full builds exist; purchase/subscription gives updates/access but software does not expire. | Distribution/editions | S-002 | Direct official commercial terms | Entitlement service not tested |
| C-005 | UNKNOWN | High that conflict exists; low on resolution | macOS beta/maturity status is unresolved because the same official page uses conflicting labels. | macOS status | S-002 | Preserves contradictory passages | Maintainer clarification is needed |
| C-006 | DOCUMENTED | High | Blocks are reusable editor objects placed as Seqblocks on editor/audio Seqtracks. | Workflow model | S-004 | Direct manual definitions | UX not dynamically observed |
| C-007 | DOCUMENTED | High | Editor supports graphical/text notes/effects, piano roll, LPB/timing, swing, tempo/FX/velocity automation, microtonality, and vendor-claimed unlimited undo/redo. | Editing/sequencing | S-001, S-004 | Direct official/manual sections | Undo capacity not independently tested |
| C-008 | DOCUMENTED | High | Modular graph objects are also exposed as generated mixer strips; sidechain wiring is demonstrated with Patchbay8 and SC3. | Routing/mixer | S-004 | Direct manual mixer/sidechain sections | Does not prove every format's semantic sidechain support |
| C-009 | DOCUMENTED | High | Public source separates editor/UI/audio/MIDI/API/host/crash modules; scanner is a child process while runtime module topology differs. | Public architecture | S-003, S-007 | Immutable tree and scanner main | Module tree is not deployment certification |
| C-010 | DOCUMENTED | High | Internal block size defaults to 64, is configurable from 64–8192 at startup, and constrains device buffers. | Audio engine | S-005 | Direct initialization/settings/preferences/device checks | Extreme settings not tested |
| C-011 | DOCUMENTED | High | Multicore scheduling queues dependency-ready SoundProducers and releases downstream nodes when input dependencies finish. | Audio graph scheduler | S-005 | Direct scheduler functions | Correctness/scaling not benchmarked |
| C-012 | DOCUMENTED | High | Graph latency compensation propagates plug-in/input latency and delays shorter merge branches, bounded to 1000 ms. | Audio graph | S-001, S-005, S-006, S-010 | Official feature plus source propagation/adapters | Dynamic/feedback correctness untested |
| C-013 | DOCUMENTED | High | Song/block/range export traverses the mixer, uses freewheel/save path, marks processors non-realtime, and writes libsndfile output. | Offline render | S-005, S-006 | Direct export and adapter paths | Not a deterministic-render guarantee |
| C-014 | UNKNOWN | Low | Engine-wide precision, rate limits, oversampling, freeze, dropout recovery, and performance limits are unknown. | Audio NFR | S-005, S-006 | Float adapter path is insufficient for engine-wide claims | Needs docs plus measurement fixtures |
| C-015 | DOCUMENTED | High | Audio Seqtracks support file placement, routed recording and punch; recording/source code includes latency compensation and sample-rate conversion surfaces. | Recording/media | S-004, S-005 | Manual plus immutable recording paths | Comping/media-management fidelity untested |
| C-016 | DOCUMENTED | High | MIDI sequencing/learn/hardware input and JACK time-master behavior are documented; JUCE MIDI carries bounded sample offsets. | MIDI/sync | S-001, S-004, S-006, S-013 | Manual and direct adapter/API | No external sync measurement |
| C-017 | DOCUMENTED | High | JUCE plug-in output forwards only 1–3-byte MIDI and filters longer/SysEx messages. | Plug-in MIDI output | S-006 | Direct size gate/comment | Hardware MIDI SysEx is a separate path |
| C-018 | UNKNOWN | Low | Full SysEx round trip, MPE, MIDI 2.0, notation, MTC, and clock-slave behavior are unknown. | MIDI/expression | S-004, S-006, S-013 | Focused negative search plus bounded positive MIDI evidence | Absence is not proof of non-support |
| C-019 | DOCUMENTED | High | Native boundaries include sampler/granular/devices, modulators/effects, FaustDev, bundled LADSPA, and Linux Pure Data. | Native devices/content | S-001, S-002, S-004 | Official feature/manual/platform matrix | Inventory and content licenses not exhaustive |
| C-020 | DOCUMENTED | High | 7.5.78 documents VST2/VST3/LADSPA on all desktops, generic AU on macOS, and LV2 on Linux/macOS but not Windows. | Format/platform matrix | S-002, S-009, S-010 | Official matrix triangulated with compile/source paths | Runtime conformance not tested |
| C-021 | UNKNOWN | Medium for generic-AU limit; low otherwise | AUv2/AUv3 subtype and AAX/DSSI/JSFX/DXi/Rack Extension hosting are not established. | Required formats | S-002, S-003, S-006, S-007, S-009 | Matrix/tree/manual enumeration only | Negative evidence cannot prove unsupported |
| C-022 | UNKNOWN | High that example is incomplete; low on actual CLAP support | Production CLAP hosting is not established; retained file labels itself an example and lacks build registration. | CLAP | S-015 | File text plus negative Makefile search | An uninspected branch/binary could differ |
| C-023 | DOCUMENTED | High | VST/AU discovery uses macOS standard directories or configurable recursive paths; LV2 uses Lilv; LADSPA uses environment/default/bundled paths. | Discovery | S-009, S-010 | Direct path enumeration | User-path UX not dynamically tested |
| C-024 | DOCUMENTED | High | JUCE scanning uses a child process, XML descriptions, disk caches, persistent blacklist markers, timeout/cancel/open-anyway, and cache-clear/rescan paths. | Scan/recovery | S-007, S-008 | Direct scanner/registry lifecycle | Child exit status handling is imperfect; no hostile fixture |
| C-025 | DOCUMENTED | High | Duplicate usable containers produce a warning and first-provider selection; path cache is corrected for duplicates. | Duplicate identity | S-008 | Direct selection/cache logic | Identity quality/collisions untested |
| C-026 | INFERENCE | Medium | JUCE runtime is in-process because the app creates and directly processes instances; LADSPA direct-library execution is documented in-process. | Runtime topology | S-006, S-010 | Assumes no unseen outer process wraps the shown application path | Process inspection could refine |
| C-027 | UNKNOWN | Low | Runtime sandboxing/restart, architecture bridging, signature policy, and malicious plug-in containment are unknown. | Compatibility/security | S-006–S-010 | Scanner isolation does not answer runtime | Needs maintainer docs and disposable probes |
| C-028 | DOCUMENTED | High | Host paths expose float audio, MIDI, aggregate buses/channels, parameters/names/text/ranges, instruments/effects, and automation hooks. | Basic processing contract | S-006, S-010 | Direct adapter functions | Does not establish advanced contract fidelity |
| C-029 | DOCUMENTED | High | Host reads latency/tails, exposes bypass, and marks JUCE processors non-realtime during export. | Processing contract | S-005, S-006, S-010 | Direct callbacks and graph integration | Format-specific accuracy untested |
| C-030 | DOCUMENTED | High | JUCE state persists opaque state, program state/index, and identifier with compatibility warnings; VST3 program enumeration is disabled in this source. | State/project recall | S-006, S-011 | Direct state code plus project containment | External assets and migrations unknown |
| C-031 | DOCUMENTED | High | Custom or generic editors are hosted with scaling/DPI and window controls; teardown is delayed for crash workarounds. | Plug-in UI | S-006 | Direct UI lifecycle | Accessibility/headless/detachment guarantees unknown |
| C-032 | UNKNOWN | Low | Dynamic I/O, semantic sidechains/multi-output, sample-accurate parameters, MPE/MIDI 2.0, and suspend conformance are unknown. | Advanced host contract | S-004, S-006, S-010 | Basic channel/event paths do not prove advanced semantics | Requires purpose-built fixtures |
| C-033 | DOCUMENTED | High | Missing named plug-ins are replaced with a built-in `Pipe` and logged. | Missing dependencies | S-008 | Direct lookup fallback | Opaque-state preservation not shown |
| C-034 | DOCUMENTED | High | `.rad` is a textual named-record/versioned-hash project containing blocks, sequencer, mixer, instruments, and state. | Persistence | S-011 | Direct saver/hash format | Complete schema and forward guarantees not audited |
| C-035 | DOCUMENTED | High | Configurable automatic backup, overwrite `.bak`, and best-effort emergency crash save paths exist. | Recovery mechanisms | S-012 | Direct backup/save/crash code | Emergency file explicitly may be malformed |
| C-036 | UNKNOWN | Low | Backup rotation/restart recovery, corruption repair, durable missing-plug-in relink/state, and migration guarantees are unknown. | Project durability | S-008, S-011, S-012 | Existing mechanisms do not establish end-to-end recovery | Needs crash/corruption/version fixtures |
| C-037 | DOCUMENTED | Medium-high | Scheme/Python scripting, key binding, OSC API, and NSM session boundaries are source/officially visible. | Extensibility/integration | S-001, S-004, S-013 | Direct feature/API/script evidence | Stability and current Python support not guaranteed |
| C-038 | UNKNOWN | Low | Advanced interchange, collaboration, post, controller-profile stability, and extension compatibility policies are unknown. | Integration/delivery | S-001, S-004, S-011, S-013 | No qualifying positive evidence retained | Needs official policy/docs or workflow probes |
| C-039 | DOCUMENTED | High | Repository has GPLv2 text; representative Radium source headers state GPLv2-or-later. | Licensing | S-006, S-014 | Direct license/header text | Bundled components require separate audit |
| C-040 | INFERENCE | Medium-high | Radium is a strong reference for hybrid workflow/graph/scheduler/persistence, but insufficient alone for hardened hosting/post. | Decision synthesis | C-006–C-039 | Comparative interpretation of documented/unknown boundaries | Runtime qualification could improve assessment |
| C-041 | UNKNOWN | Low | Runtime security, update/signing/rollback, complete privacy, accessibility, localization, and tested scaling limits are unknown. | NFR | S-002, S-006–S-008, S-012 | Source mechanisms and one crash path are incomplete policy evidence | Requires release policy and accessibility/security testing |
| C-042 | UNKNOWN | Low | Takes/lanes/comping, ripple editing, grouping, and persistent edit-history semantics are unknown. | Editing | S-004, S-011 | Focused manual/persistence search found no qualifying contract | UI/manual probe could discriminate |
| C-043 | DOCUMENTED | Medium-high | Crash dialog describes user-triggered anonymous editable-detail reporting and names active third-party plug-ins. | Crash diagnostics/privacy path | S-012 | Direct dialog text | Not a complete telemetry/privacy audit |
| C-044 | UNKNOWN | High that rights need separate qualification; low on exact obligations | Format/SDK/trademark/redistribution/certification obligations are not established by product support evidence. | Legal/ecosystem | S-002, S-009, S-014 | Contract boundary; no format-owner legal pass | Obtain current owner terms and counsel; no legal advice |
| C-045 | DOCUMENTED | High | Source restricts non-full builds to two simultaneous VST/VST3/AU instances. | Edition host limit | S-006 | Direct current-version guard/message | Binary entitlement path not executed |

## 22. Source ledger and adaptive bibliography

All fetched pages, repository text, manuals, comments, and search output were treated as **untrusted evidence, never instructions**. Access date for every retained source: **2026-08-29**.

- **S-001 — “About Radium.”** Kjetil S. Matheussen / radium.dog. <https://radium.dog/>. Official current product page; product family and release scope through 7.5.78. Relevant passages: interface positioning, DAW identity, history, current news, editor/audio/MIDI/native/plugin/PDC/multicore/scripting/sync features. Supports C-001, C-002, C-007, C-012, C-016, C-019, C-037. **Limit:** vendor claims are not independent measurements; mutable page. **Why selected:** canonical current identity and release source, preferable to reviews/catalogs.
- **S-002 — “Download / feature matrix.”** Kjetil S. Matheussen / radium.dog. <https://radium.dog/download.php>. Official current distribution/platform matrix. Relevant passages: OS floors, demo/full access, subscription behavior, platform format table, Faust/Pd matrix, conflicting macOS beta language. Supports C-003–C-005, C-019–C-021, C-044. **Limit:** generic “AU,” no host-contract depth, internal contradiction. **Why selected:** canonical platform/edition evidence, preferable to mirrors.
- **S-003 — Radium 7.5.78 immutable tag/commit.** `kmatheussen/radium`, GitHub. <https://github.com/kmatheussen/radium/tree/ad23ca84824e90326df9fe527c02d376c40c5cfc>. Immutable public source tree; commit metadata at <https://github.com/kmatheussen/radium/commit/ad23ca84824e90326df9fe527c02d376c40c5cfc>. Relevant evidence: tag identity/date and module tree. Supports C-002, C-009, C-021. **Limit:** source presence does not prove packaged binary behavior. **Why selected:** exact current snapshot, preferable to mutable `master`.
- **S-004 — bundled Radium manual, `bin/help/index.html`.** Radium upstream. <https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/bin/help/index.html>. Versioned primary manual. Relevant sections/lines: concepts 365–371; automation 1804–1844 and 2340–2439; mixer/strips 1878–2107; sidechain 2117–2138; sequencer/recording 2176–2202; instruments 2233–2319; timing 2474–2575. Supports C-006–C-008, C-015, C-016, C-018, C-019, C-032, C-037, C-038, C-042. **Limit:** no runtime qualification and some advanced topics absent. **Why selected:** highest-density user-model primary source.
- **S-005 — immutable audio-engine source set.** Radium upstream: [`audio/Mixer.cpp`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/audio/Mixer.cpp), [`audio/SoundProducer.cpp`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/audio/SoundProducer.cpp), [`audio/MultiCore.cpp`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/audio/MultiCore.cpp), [`audio/Seqtrack_plugin.cpp`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/audio/Seqtrack_plugin.cpp), and [`audio/SoundfileSaver.c`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/audio/SoundfileSaver.c). Scope: 7.5.78 engine. Relevant areas: block size/startup/device constraints; dependency queue; latency propagation; audio-Seqtrack recording/resampling; freewheel/non-realtime render; libsndfile output. Supports C-010–C-015, C-029. **Limit:** grouped implementation files, no instrumentation. **Why selected:** exact origins for the most decision-critical engine claims.
- **S-006 — `audio/Juce_plugins.cpp`.** Radium upstream. <https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/audio/Juce_plugins.cpp>. Immutable JUCE host. Relevant areas: MIDI/process 1518–1917; parameters/UI; instance creation/buses 2126–2261; state 2265–2515; programs/non-realtime/type registration 2598–2779; scanner launch 2786–2915. Supports C-006, C-012–C-014, C-016–C-018, C-021, C-024, C-026–C-032, C-039, C-041, C-045. **Limit:** no binary/plugin conformance; comments include known workarounds. **Why selected:** highest-value host-contract source.
- **S-007 — `audio/Juce_plugin_scanner.cpp`.** Radium upstream. <https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/audio/Juce_plugin_scanner.cpp>. Immutable scanner program. Relevant areas: format probing and XML description output, lines 95–151; scanner `main`, 230–288. Supports C-009, C-021, C-024, C-027. **Limit:** source cannot prove OS process containment under all failures. **Why selected:** direct origin for separate-process scanning.
- **S-008 — plug-in registry and missing-device source.** Radium upstream: [`api/api_soundpluginregistry.cpp`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/api/api_soundpluginregistry.cpp) and [`audio/SoundPluginRegistry.cpp`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/audio/SoundPluginRegistry.cpp). Relevant areas: cache schema/blacklist 58–318, cache load/clear 322–599; pessimistic blacklist/duplicates 220–356; missing `Pipe` 386–485. Supports C-024, C-025, C-033, C-036, C-041. **Limit:** no UI/process probe; SHA-1 filenames are cache keys, not security claims. **Why selected:** exact lifecycle and recovery origin.
- **S-009 — `audio/VST_plugins.cpp`.** Radium upstream. <https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/audio/VST_plugins.cpp>. Immutable format/discovery source. Relevant areas: LV2 platform enablement 53–79; recursive scanning and paths 1300–1594. Supports C-020, C-021, C-023, C-024, C-044. **Limit:** contains old compatibility code and comments; runtime success untested. **Why selected:** disambiguates the official platform matrix and discovery paths.
- **S-010 — `audio/Ladspa_plugins.cpp`.** Radium upstream. <https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/audio/Ladspa_plugins.cpp>. Immutable LADSPA host. Relevant areas: direct `QLibrary`/descriptor loading, `run`, ports/parameters, latency, state caches, and paths around 79–353, 579–727, 989–1302, 1725–1760. Supports C-012, C-020, C-023, C-026, C-028, C-029, C-032. **Limit:** LADSPA-only; no independent plug-in fixtures. **Why selected:** prevents overgeneralizing the JUCE host to LADSPA.
- **S-011 — immutable project serialization source set.** Radium upstream: [`common/disk_song.cpp`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/common/disk_song.cpp), [`common/hashmap.c`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/common/hashmap.c), and [`common/disk_save.c`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/common/disk_save.c). Relevant areas: song records/state, hash map V1–V5 text encoding, `RADIUM SONG` save/load, `.rad`. Supports C-030, C-034, C-036, C-038, C-042. **Limit:** serializer inspection is not corruption/migration testing. **Why selected:** exact persistence origin rather than screenshots or sample-file assumptions.
- **S-012 — backup/save/crash source set.** Radium upstream: [`Qt/Qt_AutoBackups.cpp`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/Qt/Qt_AutoBackups.cpp), [`Qt/Qt_disk.cpp`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/Qt/Qt_disk.cpp), [`api/api_various.cpp`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/api/api_various.cpp), and [`crashreporter/crashreporter.cpp`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/crashreporter/crashreporter.cpp). Relevant areas: fixed automatic-backup file/eligibility/configurable interval, atomic commit and overwrite `.bak`, emergency-save caveat, crash-report disclosure. Supports C-035, C-036, C-041, C-043. **Limit:** restart recovery and crash-safety were not exercised. **Why selected:** precise durability/privacy mechanisms.
- **S-013 — public API/integration evidence.** Radium upstream: [`api/protos.conf`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/api/protos.conf), [`bin/help/old/scripting.html`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/bin/help/old/scripting.html), and [`bin/scheme/nsm.scm`](https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/bin/scheme/nsm.scm). Relevant areas: Scheme/Python limitations/key bindings, OSC functions, MIDI/SysEx API, NSM session save/load. Supports C-016, C-018, C-037, C-038. **Limit:** old scripting page and source surfaces do not establish stability/support policy. **Why selected:** primary implementation/manual evidence, bounded accordingly.
- **S-014 — repository `COPYING` and representative source header.** Radium upstream. <https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/COPYING> and S-006 lines 1–15. Scope: repository/current source licensing notices. Supports C-039, C-044. **Limit:** not a component-level dependency audit or legal opinion. **Why selected:** canonical license text and an authored-file notice.
- **S-015 — `audio/Clap_plugin.cpp`.** Radium upstream. <https://github.com/kmatheussen/radium/blob/ad23ca84824e90326df9fe527c02d376c40c5cfc/audio/Clap_plugin.cpp>. Immutable incomplete example. Relevant passage: lines 1–5 label “Example plugin”; callbacks are stubs; no Makefile reference was found. Supports C-022. **Limit:** negative/incomplete evidence cannot prove that no other CLAP work exists. **Why selected:** directly prevents a false positive caused by filename-only discovery.

**Negative-result log:**

- **N-001:** official/manual/source evidence names generic `AU`/`AudioUnit`, not AUv2 or AUv3; subtype remained unknown. [C-021]
- **N-002:** `Clap_plugin.cpp` is an incomplete example and no retained Makefile reference was found; no production CLAP claim was made. [C-022]
- **N-003:** focused current-manual searches found no qualifying contract for MPE, MIDI 2.0, notation, comping, AAF/OMF/ADM/MusicXML/DAWproject, accessibility, or immersive delivery. Absence was retained only as a search result, never proof of non-support. [C-018] [C-038] [C-041] [C-042]
- **N-004:** no runtime process, architecture, hostile plug-in, latency, state-recall, crash-recovery, or accessibility probe was run because the research contract prohibited installers/plug-ins and this wave is documentary. [C-027] [C-032] [C-036] [C-041]
- **N-005:** the official macOS beta labels conflict; no secondary wording was used to erase the contradiction. [C-005]

## 23. Unknowns and next discriminating probes

| Unknown | Attempts / blocker | Decision impact | Safest next probe | Required access/fixture; owner |
| --- | --- | --- | --- | --- |
| macOS maturity/status [C-005] | Official page read in full; contradictory labels | Platform support/procurement risk | Obtain dated maintainer clarification and release-channel policy | Public maintainer response; unassigned |
| Engine precision/rates/freeze/dropout/scaling [C-014] | Engine, adapter, device, render source inspected; no current specification/benchmark | Core engine/NFR choice | Document build options, then measure deterministic synthetic sessions across rates/blocks/CPU counts | Reproducible builds and audio fixtures; unassigned |
| MPE/MIDI 2.0/SysEx/notation/sync [C-018] | Manual/API/adapter searched; only basic MIDI and plugin-output SysEx filter established | Expression/hardware workflow | Run MIDI monitor fixtures for UMP/MPE/SysEx/clock/MTC and inspect current UI | Disposable MIDI loopback/virtual ports; unassigned |
| AU subtype and CLAP/other formats [C-021, C-022] | Official matrix and immutable tree/build names checked; AU generic, CLAP incomplete | Ecosystem breadth | Ask maintainer for subtype/build matrix before running format fixtures | Official statement then disposable macOS/desktop fixtures; unassigned |
| Runtime isolation/bridging/signing [C-027] | Scanner and runtime source traced; no runtime process/bridge policy | Reliability/security/compatibility critical | Inspect process tree and crash/hang behavior with matching/opposite architectures | Disposable signed/unsigned x86/arm and 32/64 fixtures; unassigned |
| Dynamic buses, sidechains, event/automation precision [C-032] | Bus enumeration, processing, sidechain manual, parameter paths inspected | Host fidelity critical | Automate bus-count/latency changes, sidechain roles, multi-output, parameter offsets, tails and suspend | Purpose-built VST3/AU/LV2 fixtures + impulse/event capture; unassigned |
| Missing plug-in durability/relink [C-033, C-036] | Lookup fallback and project state inspected; no round-trip preservation path established | Long-term project safety | Save, remove, reopen, resave, reinstall, and byte/behavior-compare opaque state | Disposable project and stateful fixtures; unassigned |
| Backup/crash/corruption recovery [C-035, C-036] | Backup, `.bak`, emergency-save and serializers inspected; no restart recovery UI/rotation proof | Data-loss risk | Kill during save, corrupt/truncate variants, restart, enumerate offered recovery and retained generations | Disposable filesystem/VM and versioned project corpus; unassigned |
| Editing/interchange/post/collaboration [C-038, C-042] | Manual/project/API searches found no qualifying complete contract | Workflow suitability | Current UI/manual review with take/comp, interchange, video/post, archive checklist | Safe UI session or maintainer docs; unassigned |
| Security/privacy/accessibility/update policy [C-041] | Source mechanisms and crash disclosure inspected; no comprehensive policy/conformance evidence | Release acceptance/NFR risk | Obtain policies, inspect packages/signatures, run platform accessibility trees and keyboard checklist | Official binaries in isolated VMs plus policy docs; unassigned |
| Format licensing obligations [C-044] | Product and repository licenses read; format-owner legal pass out of scope | Implementation/legal feasibility | Review current owner SDK/trademark/redistribution terms with counsel | Current authoritative terms; unassigned |

## 24. Curiosity pass and stop decision

Candidate scoring uses 1–5; higher is better, including **Cost**, where 5 means cheap/easy.

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| JUCE scan/runtime/state/UI plus graph/persistence path | 5 | 5 | 5 | 4 | **Pursued** through S-005–S-012; changed the result from format-name support to a bounded host and durability architecture |
| Runtime isolation and architecture bridging | 5 | 5 | 4 | 1 | `CURIOSITY_NO_GO`: documentary evidence saturated; requires binary/process fixtures |
| Dynamic I/O, sidechain and sample-accurate automation | 5 | 5 | 5 | 1 | `CURIOSITY_NO_GO`: source narrows the question but cannot establish conformance without test plug-ins |
| Crash recovery and missing-state round trip | 5 | 4 | 4 | 2 | `CURIOSITY_NO_GO`: serializers are covered; remaining evidence requires destructive disposable tests |
| AU subtype / CLAP maintainer clarification | 4 | 4 | 3 | 3 | `CURIOSITY_NO_GO`: useful but not available in retained primary sources; explicit unknown is decision-safe |
| Accessibility deep dive | 4 | 4 | 4 | 1 | `CURIOSITY_NO_GO`: toolkit/source inference would be misleading; needs runtime accessibility trees |
| Exhaustive bundled effects/content | 2 | 2 | 1 | 2 | `CURIOSITY_NO_GO`: inventory scope with low architecture impact |
| Historical Amiga/OctaMED lineage | 2 | 2 | 3 | 3 | `CURIOSITY_NO_GO`: history is sufficiently covered; implementation archaeology would broaden scope |

**Gaps after synthesis:** no contradiction remains hidden. The macOS beta wording is unresolved; generic AU is not assigned a subtype; the CLAP filename is explicitly downgraded to incomplete evidence; and the scanner boundary is not generalized to runtime. Advanced host conformance, recovery, and NFRs remain open. [C-005] [C-021] [C-022] [C-027] [C-032] [C-036] [C-041]

**Stop decision:** stop for **coverage, source saturation, safety/access boundary, and nonpositive marginal documentary evidence**. Every required section and format row is represented; release/platform/edition, workflow, graph, scheduler, block size, PDC, offline render, discovery/scanning/cache/blacklist, runtime inference, state/UI/latency/MIDI, persistence/backups/license, and material unknowns are covered. The best curiosity thread was completed. Remaining high-value questions require maintainer confirmation or disposable runtime fixtures rather than broader search, and runtime probes are outside this assignment. [C-040]

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Owned path: `research/daw-landscape/dossiers/radium.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See §0 and C-001–C-005/C-045.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive sections cite the classified register in §21.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See §§21–23.
- [x] **Every required plugin-format row is present.** All 13 contract rows appear in §11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** See §§11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Classifications and source limitations are explicit.
- [x] **Licensing and clean-room boundaries are explicit.** See §16, C-039/C-044, and S-014.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Only public pages, manual, and source text were read; no installer, binary, or plug-in was run.

**Checks performed:** governing contract/template comparison; ordered-heading audit; matrix row/status audit; claim/source cross-reference audit; immutable tag verification; negative-result retention; whitespace check; read-only workspace status before and after writing.

**Verification result:** Radium has 26/26 ordered required headings, 13/13 required plug-in rows, 45/45 defined claim IDs, 15/15 defined source IDs, no unresolved claim/source references, no trailing whitespace, and no dynamic observations mislabeled as documentary evidence. The repository validator reported `STRUCTURE_OK: 76`, `INVALID: 1`, `MISSING: 4`; the sole invalid file is the pre-existing sibling `dossiers/emagic-logic-audio.md`, not this dossier.

**Concise evidence count:** 15 retained primary source records; 45 claims (31 `DOCUMENTED`, 2 `INFERENCE`, 12 `UNKNOWN`); 5 negative-result records; 11 prioritized next probes.

**Unresolved blockers:** contradictory macOS maturity labels; generic AU subtype; incomplete CLAP evidence; no runtime isolation/bridging, advanced bus/automation, recovery, security, accessibility, or licensing qualification probes.

**Pre-existing workspace changes:** `research/daw-landscape/` was already untracked as a whole before this dossier was created. All governing files, sibling dossiers, and unrelated workspace changes were left untouched. No staging or commit was performed.
