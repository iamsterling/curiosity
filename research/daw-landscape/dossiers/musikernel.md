# MusiKernel DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** MusiKernel / MusiKernel 2 public source, with Stargate DAW included only as the evidenced successor line.
- **Canonical vendor/upstream:** the original `j3ffhubb/musikernel` endpoint is no longer public. The surviving upstream is `stargatedaw/stargate`; the last MusiKernel-branded tree available for inspection is a third-party source backup and is qualified accordingly. [C-001] [C-002]
- **Researcher/session:** subagent in session `ses_fb274ae64ffe7jlek6DTzShR5O`.
- **Owned path:** `research/daw-landscape/dossiers/musikernel.md`.
- **Research date/evidence cutoff:** 2026-08-29 UTC.
- **Pinned snapshots:**
  - last explicitly MusiKernel-branded version found: **MusiKernel 2 16.05.8**; release date 2020-11-11 comes from the secondary LibreAV index, while source content is pinned to backup commit `fb9c6dec70ddc5bdf5e410399583774ce1af9bd1`; [C-001]
  - earliest retained Stargate release examined: `release-21.09.4`, commit `ca880260545126b5438cae25a6a42d8f1d8e05d1`; [C-002]
  - latest Stargate release: **24.02.2**, tag commit `43dfd5ccd676fde64ab61d524573903b769c5e2d`, published 2024-01-29; [C-003]
  - latest reachable default-branch source: `3b7e1d9b00128e90ed60b8964dd948a91f29e5c6`, committed 2024-06-22, with source metadata `24.07.1` but no matching release tag. [C-003]
- **Editions:** one open-source desktop product; DAW and basic wave-editor hosts are included. No paid/feature editions were found. [C-003] [C-005]
- **Platforms:** released Stargate 24.02.2 assets cover Linux x86-64, Windows x64, and macOS Intel/Apple Silicon. Broader Linux ARM/Raspberry Pi and architecture portability are source/project intent, not release qualification. [C-028]
- **Included:** workflow, current/last source architecture, internal plugins, plugin-host boundaries, project persistence, build/release/license state, and the bounded lineage evidence.
- **Excluded:** dynamic execution, binary installation, private/deleted upstream material, independent performance qualification, and unrelated forks or merely similar names.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`—the architecture/plugin-host questions are covered, while original MusiKernel provenance, maintenance status, several recovery behaviors, and advanced interoperability remain explicitly unknown.

## 1. Executive summary

MusiKernel 2 16.05.8 and the surviving Stargate source share a distinctive pattern-oriented DAW architecture: a PyQt user interface, C real-time engine, compiled-in native instruments/effects, track plugin racks, and a directory project format. A secondary release index places “MusiKernel 2,” transitional “MusiKernel Stargate,” and Stargate tags in one release sequence; close source similarity supports direct succession, but deletion of the original repository prevents an immutable parent-history proof. The lineage conclusion is therefore **INFERENCE**, not fact. [C-001] [C-002] [C-034]

The decision-critical differentiator is deliberate rejection of third-party plugin hosting. Pinned Stargate documentation says all plugins use the internal format and explicitly says third-party formats are unsupported; the source tree contains no scanner, binary loader, bridge, or external-format adapter. VST2/VST3, AU, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DX/DXi, and Rack Extension hosting are therefore absent from the documented current contract. [C-015] [C-017]

The current reachable engine is a separate subprocess controlled by the Python UI over UDP, with native plugins sharing that engine process. Tracks are scheduled across workers according to a persisted routing order and bus-dependency counters. The native contract is stereo main input, stereo sidechain, stereo output, MIDI/automation lists, indexed numeric parameters, and in-tree PyQt UIs. [C-006] [C-007] [C-016] [C-018] [C-019]

Architecturally important liabilities are the absence of a host latency-report field or PDC primitive, no missing-native-plugin placeholder, no external-plugin compatibility path, and unsigned/unnotarized release instructions that ask users to override platform warnings. Maintenance is also uncertain: the repository is unarchived, but the latest release and default-branch commit are from 2024. [C-004] [C-009] [C-021] [C-030]

**Overall confidence:** high for pinned Stargate source behavior and native-only hosting; medium for the mirrored MusiKernel 2 snapshot; medium-low for direct pre-2021 lineage; low/unknown for runtime quality, old upstream release assets, and behavior not represented in public source.

## 2. Product identity, history, and market position

The MusiKernel 2 backup identifies itself as an all-in-one DAW and instrument/effect suite and embeds version `musikernel2` / `16.05.8`. LibreAV attributes it to `j3ffhubb`, GPL-3, and dates 16.05.8 to 2020-11-11. Because the backup was uploaded in 2024 without original git history, its versioned content is usable evidence but its provenance is not independently immutable. [C-001]

LibreAV lists MusiKernel 2 releases followed by “MusiKernel Stargate” 21.08–21.09 releases at the historical Stargate repository location. The surviving `release-21.09.4` tree calls itself Stargate, and current history begins with a 2021 file drop rather than a preserved MusiKernel parent. Shared module concepts and source structure make direct succession the leading explanation; a clean repository-history proof remains unavailable. No other successor name is included. [C-002] [C-034]

Stargate describes itself as an all-in-one, innovation-first DAW/plugin suite focused on pattern-based electronic music and a curated, portable, low-resource experience. Its design-principles document describes a one-person development assumption rather than a large commercial ecosystem. These are upstream positioning statements, not market-share or independent performance evidence. [C-005]

The latest official release is 24.02.2 (2024-01-29); main later reached source metadata 24.07.1. GitHub reports the repository as public and unarchived at cutoff, but neither a 2025/2026 default-branch release nor a maintenance commitment was found. Status is therefore **public and unarchived, with current maintenance unknown**, not confidently “active” or “discontinued.” [C-003] [C-004]

## 3. Workflow and conceptual model

The DAW is a linear, pattern/item-oriented sequencer rather than a scene launcher, tracker grid, notation system, or modular patching environment. A sequencer item can combine audio regions, notes, MIDI CC, and pitch-bend data. Copied items remain shared references unless the user creates a new take. [C-005] [C-010]

Each of 32 hybrid audio/MIDI tracks maps to a plugin rack. A project can contain up to 20 songs/sequences; songs share track racks and the item pool while retaining per-song arrangement and automation data in the current format. Timeline markers cover loop/render regions, text, tempo points, and tempo ranges. [C-010] [C-033]

The separate basic wave-editor host reuses project, audio-pool, and native-effect infrastructure but does not constitute a full destructive editor or post-production suite. [C-005] [C-026]

## 4. Publicly documented architecture

At pinned main, the source map is explicit:

1. `sgui/`: Python/PyQt presentation and native plugin widgets;
2. `sglib/`: non-Qt business logic, project models, file formats, and IPC APIs;
3. `stargate-engine`: a GNU89 C audio/MIDI/DSP executable;
4. UDP request/notification transport between UI and engine;
5. directory-based project and per-instance native-plugin state files. [C-006] [C-016] [C-023]

The current launcher always starts `stargate-engine` as a subprocess and supports graceful stop, forced kill, and restart. The engine also monitors the UI process. Current build files package the engine executable on all three desktop systems. An older debugging paragraph says macOS/Windows use an engine shared library; that statement conflicts with reachable main and is treated as stale documentation, not current architecture. [C-006] [C-037]

Inside the engine, the DAW and wave editor are host tables sharing global audio/MIDI, pool, IPC, and worker facilities. Native plugins are statically registered descriptors, not discoverable binaries. [C-016] [C-018]

The MusiKernel 2 mirror contains the earlier equivalent split—PyQt5 application, C engine, liblo/OSC, worker threads, native plugin registry—and also retains selectable separate-engine/in-process-library modes. That mixed mode is historical MusiKernel evidence and must not be projected onto reachable Stargate main. [C-034] [C-037]

## 5. Audio engine

The default engine sample type is 32-bit float; a source compile switch can select double precision, but it is disabled at the pin. PortAudio hardware streams use float32. Hardware settings offer 44.1, 48, 88.2, 96, and 192 kHz requests and configurable buffers; availability depends on the selected device. [C-008] [C-038]

For each callback period, the audio thread wakes worker threads, copies period/tempo state, participates as worker zero, and waits for completion. Workers claim tracks from a route-sorted pool. Downstream buses use counters and spin waiting until all upstream routes have arrived; the main track is processed after workers complete. Audio, MIDI, and sidechain sends are represented separately. [C-007] [C-011]

Offline rendering warms native plugins, switches the selected song to play mode with looping disabled, runs the DAW graph, and writes stereo 32-bit float WAV. It supports per-track stem files and optional normalization. Render ends at the selected beat; there is no native-plugin tail report in the descriptor. Freeze and adaptive dropout recovery were not found; bounce/glue and stem-render operations are the evidenced render mechanisms. [C-019] [C-026]

No plugin-latency field/callback, delay-compensation node, or PDC term exists in the pinned descriptor/graph. **INFERENCE:** automatic plugin delay compensation is absent. A plugin could internally delay itself, but that cannot align arbitrary parallel host routes and is not host PDC. [C-009]

Diagnostics include actual hardware latency logging, MIDI-buffer overflow warnings, route deadlock messages, engine logs, benchmark mode, single-thread mode, and developer profiler/debugger commands. No independent dropout, scaling, or real-time safety measurement was performed. [C-031]

## 6. Tracks, timeline, clips, and editing

Tracks accept audio and MIDI simultaneously. Items can contain multiple audio objects plus notes/CC/pitch bend; editing includes draw/select/erase/split, region copy/insert, linked copies, unlink/new take, piano-roll editing, audio start/end/fade handles, volume, and time/pitch stretch. [C-010]

Per-file effects affect all uses of a source; per-item effects affect one placement. Stretch infrastructure includes Rubber Band, SBSMS, SoundTouch, and Paulstretch-related paths/caches. [C-026]

Take groups are alternate item identities and recording outputs, not documented comp lanes. There is no evidence for lane-based comping, score/notation, scene clips, ripple modes, video timeline, or persistent branch/version history. Those functions remain `UNKNOWN` rather than inferred from generic DAW terminology. [C-014] [C-036]

## 7. MIDI, sequencing, notation, and expression

The project model stores 16 MIDI channels, note on/off, CC, and pitch bend. MIDI-file import accepts notes, CC, pitch wheel, and tempo changes and logs other events as ignored. Hardware input handles note on/off, CC, and pitch bend; aftertouch handling is commented out. [C-012]

Native notes additionally persist per-note pan, attack, decay, sustain, release, and fine pitch. These values are delivered through the internal note event contract and edited as product-native expression. They are not evidence of MPE or MIDI 2.0. [C-012]

No reachable DAW implementation or manual statement was found for notation, MPE, MIDI 2.0, SysEx workflow, channel/poly pressure, program change, MIDI clock, MTC, MMC, or Ableton Link. Vendored Mido parsing capabilities do not establish DAW exposure. These remain consequential `UNKNOWN/NO_IMPLEMENTATION_FOUND`, not a blanket protocol certification claim. [C-013]

## 8. Routing, mixer, automation, and control

The routing matrix allows audio, dedicated stereo sidechain, and MIDI routes among tracks; it supports effects buses and sends. Cycles/feedback are not documented as supported, and route sorting implies a directed dependency graph. [C-011]

Mixer processing is modular: an audio send creates a mixer slot, and the last rack slot may hold Simple Fader, SG Channel, or Wide Mixer rather than a fixed channel strip. There are no documented folders/VCAs, surround/immersive buses, or dynamic channel layouts. [C-011] [C-022]

Automation points bind the project-unique plugin UID and numeric port, with beat, 0–127 value, break flag, and an inert persisted curve field. The editor can insert smoothed points at 1/64-note spacing; the engine translates event times to sample offsets and applies them at matching samples. This supports sample-offset native automation, but not an external-plugin sample-accurate contract. [C-019] [C-020] [C-037]

MIDI learn maps one CC to up to five native controls with per-mapping low/high ranges. Internal UDP/OSC-like messages are not documented as a stable public remote-control API. No external control-surface SDK was found. [C-020] [C-027]

## 9. Recording, comping, and media handling

Audio inputs can be named, record-armed, monitored through a selected rack, routed to tracks, and recorded separately. MIDI devices can be armed/routed by channel. Recording supports overdub and creates item takes; the UI explicitly rejects loop recording. Punch recording and lane comping were not found. [C-014]

The browser recognizes WAV, AIFF/AIF, and FLAC; import/conversion utilities normalize other supported libsndfile paths to project WAV as needed. Recorded, copied sample, glued, stretch, cache, and temporary folders are part of the project directory model. MP3/Ogg conversion depends on external ffmpeg/avconv/lame-style tools rather than the DAW render writer. [C-023] [C-026]

Projects are designed to copy newly added audio under the project folder for cross-platform portability, but no general conform/proxy/video/metadata/asset-relink workflow was found. A stale uncalled `check_audio_files()` function would delete missing references, calls undefined methods, and is not shipped behavior; current missing-media UI/recovery remains unknown. [C-025] [C-037]

## 10. Instruments, effects, content, and native devices

Reachable Stargate main registers 18 compiled-in native types: Sampler1, VA1, FM1, MultiFX, SG Delay, SG EQ, Simple Fader, SG Reverb, TriggerFX, Sidechain Compressor, SG Channel, X-Fade, SG Compressor, SG Vocoder, SG Limiter, Wide Mixer, Nabu, and Pitch Glitch. Sampler1 can import SFZ instruments; SFZ is content/instrument definition, not a hosted plugin format. [C-022]

Each track has ten serial rack positions and sixteen send-associated positions. Instruments pass audio through, permitting layers and audio processing in the same rack. Nabu/MultiFX provide modular effect configurations, while mixer and sidechain devices reuse the same native descriptor family. [C-011] [C-022] [C-033]

The MusiKernel 2 16.05.8 mirror instead contains Euphoria, Ray-V/Ray-V2, Way-V, Modulex, and named mixer/effect modules. This inventory is historical snapshot evidence, not a claim that old projects load directly in current Stargate. [C-034]

Native plugin authoring is curated source integration: Python/PyQt UI, GNU89 C DSP, reusable widget/DSP libraries, repository review, tests, and compatibility responsibility. It is not a loadable SDK ecosystem. [C-027]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`DOCUMENTED: unsupported` means the pinned Stargate manual expressly rejects third-party plugin formats. The MusiKernel mirror has no explicit equivalent manual sentence, so its matching negative source search is an inference, not additional documentary proof. [C-015] [C-035]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED: unsupported | DOCUMENTED: unsupported | DOCUMENTED: unsupported | NOT_APPLICABLE:no target | Stargate main `3b7e1d9`; MK2 mirror has no loader | Explicitly rejected design example; no scan/instantiate contract | C-015, C-035 / S-001, S-005 |
| VST3 | DOCUMENTED: unsupported | DOCUMENTED: unsupported | DOCUMENTED: unsupported | NOT_APPLICABLE:no target | Stargate main `3b7e1d9`; MK2 mirror has no loader | Covered by “3rd party plugin formats”; no VST3 module | C-015, C-035 / S-001, S-005 |
| AUv2 | DOCUMENTED: unsupported | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no target | Stargate main `3b7e1d9` | No AU host or macOS exception | C-015 / S-001 |
| AUv3 | DOCUMENTED: unsupported | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no target | Stargate main `3b7e1d9` | No app-extension host/mobile target | C-015 / S-001 |
| AAX | DOCUMENTED: unsupported | DOCUMENTED: unsupported | NOT_APPLICABLE:no Linux AAX host target | NOT_APPLICABLE:no target | Stargate main `3b7e1d9` | No AAX host/certification boundary | C-015 / S-001 |
| CLAP | DOCUMENTED: unsupported | DOCUMENTED: unsupported | DOCUMENTED: unsupported | NOT_APPLICABLE:no target | Stargate main `3b7e1d9` | No CLAP discovery/ABI | C-015 / S-001 |
| LV2 | DOCUMENTED: unsupported | DOCUMENTED: unsupported | DOCUMENTED: unsupported | NOT_APPLICABLE:no target | Stargate main `3b7e1d9`; MK2 mirror has no loader | No LV2 world/bundle scan | C-015, C-035 / S-001, S-005 |
| LADSPA | DOCUMENTED: unsupported | DOCUMENTED: unsupported | DOCUMENTED: unsupported | NOT_APPLICABLE:no target | Stargate main `3b7e1d9`; MK2 mirror has no loader | Internal descriptor resembles a small native ABI but is not LADSPA hosting | C-015, C-016, C-035 / S-001, S-005 |
| DSSI | DOCUMENTED: unsupported | DOCUMENTED: unsupported | DOCUMENTED: unsupported | NOT_APPLICABLE:no target | Stargate main `3b7e1d9`; MK2 mirror has no loader | No DSSI host/UI bridge | C-015, C-035 / S-001, S-005 |
| JSFX | DOCUMENTED: unsupported | DOCUMENTED: unsupported | DOCUMENTED: unsupported | NOT_APPLICABLE:no target | Stargate main `3b7e1d9` | No JSFX interpreter/importer | C-015 / S-001 |
| DirectX/DXi | NOT_APPLICABLE:non-Windows | DOCUMENTED: unsupported | NOT_APPLICABLE:non-Windows | NOT_APPLICABLE:no target | Stargate main `3b7e1d9` | No COM/DX host | C-015 / S-001 |
| Rack Extension | DOCUMENTED: unsupported | DOCUMENTED: unsupported | DOCUMENTED: unsupported | NOT_APPLICABLE:no target | Stargate main `3b7e1d9` | No Reason Rack Extension host/SDK boundary | C-015 / S-001 |
| Product-native/other | DOCUMENTED: internal native | DOCUMENTED: internal native | DOCUMENTED: internal native | NOT_APPLICABLE:no target | Stargate main `3b7e1d9`; MK2 mirror `fb9c6de` | Statically registered C DSP + in-tree PyQt UI; SFZ is Sampler1 content only | C-016, C-022, C-034 / S-001, S-005 |

### 11.2 Discovery, scanning, validation, and recovery

External discovery paths, scanning, validation, caches, duplicate identity, blacklists, quarantine, and rescan UX are `NOT_APPLICABLE` because no external binary format is accepted. The native type table and UI table are compile-time registries; project instance UIDs index state files. [C-015] [C-016] [C-017]

The word “sandbox” in MusiKernel 2 refers to an elevated Linux audio-engine launch workaround, not plugin scanning or isolation. No plugin blacklist/bridge behavior should be inferred from it. [C-035]

### 11.3 Runtime isolation and compatibility

All native DSP instances execute in the shared C engine process. The current UI/engine subprocess boundary allows engine restart and protects the UI process from an engine crash, but it does not contain one native plugin from other plugins or the audio graph. There is no per-plugin process, architecture bridge, compatibility mode, or plugin code-signing check. [C-006] [C-018]

Because native code is compiled with the application for each target architecture, cross-architecture runtime bridging is avoided rather than solved. [C-018] [C-028]

### 11.4 Host/plugin processing contract

The native descriptor exposes instantiate, connect numeric control port, load/configure, set value/CC map, run, panic, stop, offline-prep, and cleanup callbacks. `run` receives a fixed stereo input, stereo sidechain, stereo output, MIDI list, automation list, optional peak meter, and MIDI-channel filter; it supports replacing and mixing modes. [C-016] [C-019]

Instruments and effects share the contract. Native note events carry channel, note, velocity, pan, ADSR expression, fine pitch, and sample offset. Route-level MIDI and sidechain paths are implemented. No multi-output instrument bus, arbitrary bus topology, dynamic I/O, host latency/tail report, parameter text conversion, suspend callback, or externally specified bypass semantics exists in the descriptor. The rack `power` flag gates processing; offline rendering calls `offline_render_prep`. [C-009] [C-019]

### 11.5 Parameters, automation, state, presets, and project recall

Parameter identity is `(plugin instance UID, numeric port)`. Engine range hints provide min/default/max; UI port maps separately provide names/widgets. Project state serializes numeric port values, arbitrary plugin configuration records, and CC mappings into per-instance text files. [C-016] [C-020]

Preset banks serialize port/configuration values; factory banks are present for VA1 and FM1 and user banks are supported. Sampler state can reference project audio-pool UIDs. Minor-format migrations exist at project level. [C-020] [C-024]

A missing state file produces a warning and defaults. An unknown native type has no inert placeholder: fixed engine/UI arrays have no documented preservation path. **INFERENCE:** corrupt/newer type IDs may fail rather than round-trip. There is no external missing-plugin migration because external plugins are never hosted. [C-021]

### 11.6 UI, diagnostics, and failure modes

Native plugin UIs are PyQt widgets integrated with the rack/mixer; plugin-development rules prohibit pop-up windows by default. There is no external custom-editor embedding, detachment, scaling, or headless adapter contract. [C-020] [C-027]

Failures surface through local logs, engine IPC retry/error messages, state-file warnings, and whole-engine restart/kill controls. There is no scan report, per-plugin crash attribution, quarantine view, or bridge diagnostic because those layers do not exist. [C-017] [C-018] [C-031]

## 12. Extensibility and integration

The only supported plugin extension mechanism is upstream source contribution into the monorepo after design discussion. The plugin API document calls itself usable but work-in-progress and requires long-lived compatibility within a major release. This is a source-level extension point, not a stable binary SDK. [C-027]

Internal APIs separate UI calls (`sglib.api`), IPC messages, models, and the C descriptor. There are no documented user scripts, macro language, public remote app, controller SDK, plugin binary SDK, or versioned external command/action API. Internal UDP messages must not be presented as a stable public protocol. [C-027]

Sampler1’s SFZ import, MIDI-file import, audio conversion utilities, PortAudio/PortMIDI hardware APIs, and project text files are integrations, but none grants compatibility/trademark/redistribution rights for a third-party plugin format. [C-012] [C-022] [C-027]

## 13. Project format, persistence, interoperability, and collaboration

The project is a directory headed by a version marker. Subtrees include `audio/` pools, copied samples, recordings, stretch/glue/cache files; `projects/plugins/` per-instance states; and `projects/daw/` songs, items, tracks, automation, routing, MIDI routing, takes, notes, and playlist JSON. Most DAW records are line-oriented text. [C-023]

In-session undo/redo records before/after file text. Explicit timestamped/named backups are bzip2 tar archives of the `projects/` subtree and can be restored through a recovery UI with a path-traversal guard. Because audio is outside that archived subtree, these backups are not self-contained project archives; manually copying the entire project directory is the documented portability mechanism. [C-024]

The code contains targeted old-format migrations and blocks opening projects marked newer than the running version. Project principles promise compatibility within a major version and allow breaks across major versions; that is upstream policy/intent, not an independently tested matrix. [C-024]

MIDI import is evidenced for notes/CC/pitch bend/tempo. No source/manual evidence was found for MIDI export, MusicXML, AAF, OMF, ADM, DAWproject, cloud collaboration, project merging, or version-control semantics. Missing-media relink and unknown-native-plugin placeholder behavior remain unresolved. [C-025] [C-036]

## 14. Delivery, live, post-production, and specialized workflows

Mix delivery consists of selected-region stereo float-WAV rendering, per-track stems, normalization, and optional external MP3/Ogg conversion. The basic wave editor can export edits/effects. [C-026]

No public evidence was found for DDP, loudness compliance, batch render queues, AAF/OMF conform, video/timecode/ADR, surround/immersive/ADM, show control, clip-launch performance, or redundant live playback. These are `UNKNOWN/NO_IMPLEMENTATION_FOUND`, not claimed exclusions from every historical build. [C-036]

## 15. Performance, reliability, security, and accessibility

Reachable static limits include 32 tracks, 20 songs, ten rack plus sixteen send slots per track, 1,000 native plugin instances, stereo native buses, 200 queued native events, and at most sixteen workers; hardware configuration normally clamps an explicit thread setting to eight. Limits are implementation constants, not measured usable capacity. [C-033]

The project states low-end Raspberry Pi/old-laptop and 720p–4K goals, but no independent benchmark was run. Source contains C/Python tests and developer benchmark/Valgrind/GDB/perf tooling, but pinned main has no GitHub Actions workflow and no observed coverage result in this dossier. [C-031]

Whole-engine process separation, restart, rotating logs, user-home path redaction, backup recovery, and safe tar extraction are reliability/security mechanisms. Native plugins remain trusted code in the engine; local UDP IPC has no documented authentication model. [C-006] [C-018] [C-024] [C-031]

Release 24.02.2 publishes SHA-256 checksums, but project instructions acknowledge absent Apple and Windows signing credentials and direct users to override Gatekeeper/SmartScreen. Signing, notarization, and automatic rollback are not evidenced. [C-030]

Qt widgets and extensive keyboard shortcuts exist, but no screen-reader/accessibility audit is public. Translation is effectively disabled: `_` is an identity function, deprecated `_gettext()` is uncalled, and no catalogs are present. No telemetry implementation was found, but an exhaustive privacy audit was out of scope; accessibility, localization, and telemetry policy remain `UNKNOWN` except for those reachable facts. [C-032] [C-037]

## 16. Licensing, ecosystem, and implementation constraints

Both the Stargate upstream and MusiKernel 2 backup carry GNU GPL version 3 text; Stargate README/API metadata identify GPL-3.0. Dependency licenses must still be reviewed separately before redistribution; this dossier does not provide legal advice. [C-029]

The internal plugin model avoids external SDK/license/certification dependencies. Conversely, naming VST/AU/AAX/CLAP/LV2 or any other format in this dossier grants no trademark, SDK, redistribution, certification, or compatibility right. [C-015] [C-029]

Clean-room use is limited to architectural facts and abstract mechanisms from public source/docs. Do not copy source expression, UI assets, presets, names, or plugin DSP; any adaptation must be independently implemented and license-reviewed. [C-029]

## 17. Strengths, liabilities, and architecture lessons

**Evidence-backed strengths**

- The UI/business/engine split is unusually legible, and current subprocess control gives a useful whole-engine recovery boundary. [C-006]
- Compiled-in native devices produce a small deterministic compatibility surface with no scan/bridge matrix. [C-015] [C-017] [C-018]
- Hybrid items and tracks combine pattern reuse with audio/MIDI editing, while multiple songs share assets/racks. [C-005] [C-010]
- Audio/MIDI/sidechain routing and plugin-based mixer channels reuse a single graph/device abstraction. [C-011]
- Plain directory state, project-local samples, targeted migrations, and explicit backups are inspectable and portable. [C-023] [C-024]

**Evidence-backed liabilities**

- Native-only design is unsuitable as the sole reference for a DAW whose decision frame prioritizes broad third-party interoperability. [C-015]
- No host PDC mechanism was found; parallel routing and future latency-producing devices would require a graph-level redesign. [C-009]
- Fixed stereo/native type arrays constrain dynamic buses, multichannel/immersive work, and graceful unknown-device recall. [C-019] [C-021]
- Restore archives omit audio assets; missing-media relink is unresolved. [C-024] [C-025]
- Unsigned/unnotarized distribution and uncertain maintenance are product trust/continuity liabilities independent of DSP quality. [C-004] [C-030]

**Architecture lesson:** reducing ecosystem breadth can materially simplify portability, state, and failure handling, but it does not solve the interoperability decision posed by this research program. The useful reference is the clear native device/graph separation, not the rejection of external hosting itself. [C-015] [C-016]

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Support | Prerequisites/tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Keep non-real-time UI logic out of audio engine | Separate UI process, typed model/API layer, narrow local IPC, restartable engine | C-006 | IPC versioning, failure/reconnect state, platform process lifecycle | Medium; stale docs show boundary drift | CANDIDATE |
| Schedule routed tracks in parallel | Topologically ordered track pool, explicit upstream counters, audio thread joins workers | C-007 | Acyclic graph policy, bounded waits, RT-safe synchronization | High; spin waits/deadlock logging need redesign | CONDITIONAL |
| Make native device state inspectable | Stable instance UID + numeric port IDs + config records + project-local state files | C-016, C-020, C-023 | Schema/version migration and unknown-device preservation | Medium; numeric-only identities need metadata discipline | CANDIDATE |
| Reuse one graph for audio, MIDI, and key input | Typed route edges and a dedicated sidechain bus | C-011, C-019 | Clear cycle, bus-layout, latency, and event-order contracts | Medium | CANDIDATE |
| Preserve repeatable pattern edits | Shared item pool with explicit unlink/new-take operation | C-010 | Clear reference identity and user feedback | Low | CANDIDATE |
| Reduce plugin scan risk for built-ins | Compile curated native devices in-tree and test as application code | C-015, C-027 | Does not replace required external plugin hosting | High if mistaken for ecosystem strategy | CONDITIONAL |

## 19. Rejected patterns and CURIOSITY_NO_GO

**Rejected as architecture patterns**

- **Reject native-only hosting as the target interoperability strategy.** It conflicts with the downstream cross-platform plugin-host decision even though it simplifies deployment. Reopen only if product scope explicitly abandons external plugins. [C-015]
- **Reject graph execution without PDC.** A new host must model reported latency before adopting parallel route scheduling. [C-009]
- **Reject unknown-device failure instead of an inert placeholder.** Durable projects should preserve identity/state even when implementation is unavailable. [C-021]
- **Reject project backup that excludes media as the only recovery mechanism.** It may remain a lightweight settings backup, but not be labeled collect/archive. [C-024]
- **Reject unsigned-warning bypass as a release strategy.** Reopen only for developer/nightly builds with explicit threat communication. [C-030]

**CURIOSITY_NO_GO threads**

- `CURIOSITY_NO_GO`: backup forks/scraped GitHub mirrors beyond S-005—lower authority and no expected architectural novelty.
- `CURIOSITY_NO_GO`: further attempts to retrieve deleted `j3ffhubb/musikernel` after HTTP/git 404 and unavailable old tag refs—repeated access boundary; an archive with provenance would reopen it.
- `CURIOSITY_NO_GO`: evaluate upstream “revolutionary CPU efficiency” claims—no independent measurement and not needed for structural conclusions.
- `CURIOSITY_NO_GO`: external format SDK/licensing deep dive—the product explicitly does not host those formats; perform this at cross-product synthesis, not here.
- `CURIOSITY_NO_GO`: inspect demo/sample-pack content—no likely effect on engine/plugin-host architecture.
- `CURIOSITY_NO_GO`: dynamic installation/build/run—outside the documentary clean-room wave and unnecessary for source coverage.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Test and counterevidence search | Result |
| --- | --- | --- |
| H1: Stargate is a directly evidenced MusiKernel successor | Checked old upstream endpoint, exact historical tag/API paths, earliest current history/tag, LibreAV sequence, and source similarity | **Partially supported, not proven.** Secondary release sequence + architecture support inference; original parent history is absent. [C-002] |
| H2: Current host is native-only | Read manual/design principles; searched current tree and build for every required format, scanner, bridge, sandbox, blacklist, and quarantine | **Supported.** Third-party formats explicitly unsupported; only static native registry exists. [C-015] [C-017] |
| H3: UI and engine are separate processes | Read architecture/launcher/build files; searched contradictory docs | **Supported at main.** Stale debugging text says shared library on macOS/Windows, but reachable launcher/build packages subprocess engine. [C-006] [C-037] |
| H4: Native automation is sample-offset delivered | Traced persisted points → engine period tick → per-sample native event handling | **Supported for internal format.** It does not prove external-format automation. [C-019] [C-020] |
| H5: Host provides PDC | Searched descriptor, graph, docs, terms, latency/tail fields | **Falsified at source level with high-confidence inference.** Hardware latency logging exists, host PDC primitive does not. [C-009] |
| H6: Missing devices/media survive as placeholders | Traced state/type tables and missing-media function/callers | **Falsified for a documented placeholder; runtime failure remains untested.** Missing-media cleanup function is dead. [C-021] [C-025] |

External-format acceptance stages at the pin are deliberately distinct:

| Stage | External formats | Product-native format |
| --- | --- | --- |
| Format accepted | No—documented unsupported | Yes—compiled type ID [C-015] [C-016] |
| Scanned/validated | Not applicable | No scan; compile/test/review path [C-017] [C-027] |
| Instantiated | No | Yes—descriptor instantiate from type ID [C-016] |
| Full host contract | No | Bounded stereo/MIDI/automation/state/UI contract only; no PDC/dynamic I/O/tail report [C-009] [C-019] |

Later dynamic probes should corrupt a native type ID, remove a sampler/audio asset, crash a native DSP path, and measure route/automation timing. None was executed here.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | Medium | Mirrored source identifies MusiKernel 2 16.05.8; LibreAV dates it 2020-11-11 and attributes old upstream | MK2 snapshot | S-004, S-005 | Embedded version files + secondary release index | Mirror lacks original history/tags; original URL is 404 |
| C-002 | INFERENCE | Medium-low | MusiKernel 2 → transitional MusiKernel Stargate → Stargate is the leading direct-lineage explanation | Product lineage | S-001, S-004, S-005, S-006 | Release sequence and unusually close architecture/source concepts | No immutable parent relation; current earliest commit is a file drop |
| C-003 | DOCUMENTED | High | Latest release is 24.02.2/tag `43dfd5c`; main `3b7e1d9` has 24.07.1 metadata but no release tag | Stargate | S-001, S-002 | Git refs, metadata, official release object | 24.07.1 must not be called released |
| C-004 | UNKNOWN | High | Repository is public/unarchived, but current maintenance status is unknown after 2024 release/main activity | Cutoff status | S-003 | Metadata proves state/dates, not maintainer intent | Repository `pushed_at` can include non-main activity |
| C-005 | DOCUMENTED | High | Pattern/item-oriented electronic-music DAW with hybrid items/tracks, shared racks, and wave editor | Stargate main | S-001 | User manual/readme | Upstream positioning is not market measurement |
| C-006 | DOCUMENTED | High | Reachable main uses Python/PyQt UI and business layer with restartable C engine subprocess over UDP | Stargate main | S-001 | Source README, launcher, build, IPC | Older debug text conflicts and is treated stale |
| C-007 | DOCUMENTED | High | Worker pool schedules route-sorted tracks using bus dependency counters; audio thread participates and joins | Stargate main | S-001 | `worker.c`, `daw.c`, `route.c`, `track.c` | No runtime scalability measurement |
| C-008 | DOCUMENTED | High | Default DSP/hardware stream is float32; selectable hardware/render sample rates exist | Stargate main | S-001 | Compiler/audio/UI/render source | Double is compile intent, not default release behavior |
| C-009 | INFERENCE | High | Reachable host lacks automatic plugin delay compensation | Stargate main | S-001 | No latency field/callback or graph compensation after exhaustive search | Self-delaying plugin is possible but not route PDC |
| C-010 | DOCUMENTED | High | Items combine audio/note/CC/PB; copied items share identity until unlinked/new take | Stargate main | S-001 | Manual and model source | No comp-lane claim |
| C-011 | DOCUMENTED | High | Routing supports typed audio, stereo sidechain, and MIDI edges; mixer channels are native plugins | Stargate main | S-001 | Manual and route/track source | Feedback/cycle policy not documented |
| C-012 | DOCUMENTED | High | MIDI model supports notes, CC, pitch bend, 16 channels, and native per-note pan/ADSR/fine pitch | Stargate main | S-001 | MIDI model/UI/engine | Native expression is not MPE/MIDI 2.0 |
| C-013 | UNKNOWN | Medium | No DAW implementation was found for MPE, MIDI 2.0, SysEx workflow, pressure, program change, or sync protocols | Stargate main | S-001 | Systematic source/manual negative search | Vendored libraries contain generic protocol code |
| C-014 | DOCUMENTED | High | Audio/MIDI arm, input monitoring, overdub, and takes exist; loop recording is explicitly unsupported | Stargate main | S-001 | Recording UI/model source | Punch and comp lanes unknown |
| C-015 | DOCUMENTED | High | Stargate supports only internal plugins and explicitly does not support third-party plugin formats | Stargate main | S-001 | User manual + design principles | Does not alone prove every historical build |
| C-016 | DOCUMENTED | High | Native plugins use fixed compiled type IDs and a C descriptor with numeric ports/lifecycle callbacks | Stargate main | S-001 | `plugin.h`, `plugin.c` | API document calls evolution work-in-progress |
| C-017 | DOCUMENTED | High | External scanning/cache/blacklist/quarantine/rescan are not applicable; native registry is compile-time | Stargate main | S-001 | Explicit native-only policy + no loader/scanner modules | Negative tree search bounded to pin |
| C-018 | DOCUMENTED | High | Native instances share engine process; UI-engine separation is whole-engine containment, not per-plugin sandbox | Stargate main | S-001 | Launcher + descriptor call path | Dynamic crash propagation not tested |
| C-019 | DOCUMENTED | High | Native run contract is fixed stereo input/sidechain/output with MIDI/automation, replacing/mixing, and offline prep | Stargate main | S-001 | Descriptor and track run source | No dynamic/multibus or latency/tail callbacks |
| C-020 | DOCUMENTED | High | State/presets use plugin UID, numeric ports, config records and CC maps; automation points bind UID+port | Stargate main | S-001 | Models/UI/engine loaders | Parameter textual identity is UI-side, not descriptor contract |
| C-021 | INFERENCE | Medium-high | Unknown native types have no inert placeholder and likely fail rather than round-trip | Stargate main | S-001 | Fixed unguarded engine/UI arrays | Exact corruption failure not dynamically probed |
| C-022 | DOCUMENTED | High | Stargate main contains 18 named compiled devices; SFZ is Sampler1 content, not plugin hosting | Stargate main | S-001 | UI/engine registries | Inventory may differ in tags |
| C-023 | DOCUMENTED | High | Project is a structured directory of text/JSON state, plugin files, audio pools, and local media/cache folders | Stargate main | S-001 | Project model constants/create/open | Atomicity/fsync behavior not investigated |
| C-024 | DOCUMENTED | High | In-session file-history undo, targeted migrations, project-subtree backups, and guarded recovery exist | Stargate main | S-001 | Project/history/recovery source | Backup omits audio subtree; policy not full compatibility proof |
| C-025 | UNKNOWN | High | Reachable missing-media relink/recovery behavior is unknown; apparent cleanup function is dead | Stargate main | S-001 | No callers + undefined called methods | Dynamic missing-file probe needed |
| C-026 | DOCUMENTED | High | Region render emits float WAV/stems; audio editing/stretch and external MP3/Ogg conversion paths exist | Stargate main | S-001 | Render/UI/project source | No loudness/DDP/batch evidence |
| C-027 | DOCUMENTED | High | Extensibility is curated in-tree Python/PyQt+C source contribution, not runtime binary/script SDK | Stargate main | S-001 | Plugin development docs/source map | Internal IPC is not promised stable public API |
| C-028 | DOCUMENTED | High | 24.02.2 assets cover Linux x86-64, Windows x64, macOS x86-64/arm64; source targets broader architectures | Release/source | S-001, S-002 | Official assets and build files | Source target is not release qualification |
| C-029 | DOCUMENTED | High | Stargate and mirrored MusiKernel 2 are GPL-3.0 works | Family | S-001, S-003, S-005 | README/license/API metadata | Dependency licensing not exhaustively audited |
| C-030 | DOCUMENTED | High | Release has checksums but docs acknowledge absent Apple/Windows signing credentials and warning overrides | Stargate release/docs | S-001, S-002 | Release body + install docs | Actual binary signatures were not inspected |
| C-031 | DOCUMENTED | High | Logs, redaction, restart, tests and debug/benchmark tooling exist; no CI/performance result was observed | Stargate main | S-001 | Source/docs/.github tree | Upstream performance claims are not measurements |
| C-032 | UNKNOWN | Medium | Accessibility, telemetry policy, and localization quality are not established; reachable translation is disabled | Stargate main | S-001 | No audit/policy; identity translator and no catalogs | Absence search is not a complete privacy audit |
| C-033 | DOCUMENTED | High | Reachable constants set 32 tracks, 20 songs, 10 rack+16 send slots, 1,000 plugin pool, max 16 workers | Stargate main | S-001 | Source constants | Usable capacity may be lower/higher by future version |
| C-034 | DOCUMENTED | Medium | MK2 mirror has PyQt5+C, OSC/liblo, workers, native registry, and earlier named plugin set | MK2 16.05.8 mirror | S-005 | Pinned mirrored tree | Lower-authority backup; no original provenance |
| C-035 | INFERENCE | Medium-high | MK2 mirrored snapshot has no external plugin host; “sandbox” is engine privilege mode, not plugin sandbox | MK2 16.05.8 mirror | S-005 | Exhaustive format/module search and setting context | No explicit old manual statement; mirror completeness assumed |
| C-036 | UNKNOWN | Medium-high | Advanced interchange, cloud/live/post/immersive workflows were not evidenced | Pinned public line | S-001, S-005 | Manual/source negative search | Historical or unindexed behavior could exist |
| C-037 | DOCUMENTED | High | Pinned tree contains stale/inert artifacts: shared-library debug statement, unused automation curve, dead missing-audio cleanup, dead gettext path | Stargate main | S-001 | Reachability/caller checks and explicit comments | “Dead” is scoped to pinned source, not every build flag/history |
| C-038 | DOCUMENTED | High | PortAudio/PortMIDI provide hardware abstraction; audio file browser accepts WAV/AIF/AIFF/FLAC | Stargate main | S-001 | Manual/constants/source | Device/codec availability remains platform dependent |

## 22. Source ledger and adaptive bibliography

### S-001 — Stargate upstream at pinned main

- **Publisher/title:** Stargate DAW upstream, `stargatedaw/stargate` source tree.
- **URL/pin:** <https://github.com/stargatedaw/stargate/tree/3b7e1d9b00128e90ed60b8964dd948a91f29e5c6>
- **Kind/scope:** immutable primary source; reachable post-release main, metadata 24.07.1.
- **Accessed:** 2026-08-29.
- **Relevant passages:** `README.md`; `src/README.md` architecture/layout; `docs/UserManual/en/**`; `docs/project_design_principles.md`; `docs/developing-plugins.md`; `src/engine/include/plugin.h`; `src/engine/src/{plugin.c,worker.c,daw/*,stargate.c}`; `src/sglib/models/**`; `src/sgui/**`; build/install/debugging files; `LICENSE`.
- **Claims:** C-002, C-003, C-005–C-033, C-036–C-038.
- **Limitations:** source was statically inspected, not built/run; some docs are stale; negative searches are pin-bounded; source metadata is not a release.
- **Selection rationale:** highest-authority surviving source and the only artifact capable of resolving process, engine, project, and host contracts. Preferable to README mirrors, package indexes, or user reports.

### S-002 — Official Stargate 24.02.2 release

- **Publisher/title:** Stargate DAW 24.02.2 release metadata/assets.
- **URLs/pin:** <https://github.com/stargatedaw/stargate/releases/tag/release-24.02.2>; tag tree <https://github.com/stargatedaw/stargate/tree/43dfd5ccd676fde64ab61d524573903b769c5e2d>; API <https://api.github.com/repos/stargatedaw/stargate/releases/latest>.
- **Kind/scope:** primary official release object and immutable tag commit.
- **Accessed:** 2026-08-29.
- **Relevant passage:** release name/date, platform assets, changelog, and SHA-256 checksum block.
- **Claims:** C-003, C-028, C-030.
- **Limitations:** GitHub marks release object `immutable:false`; binary assets were not downloaded or signature-inspected. Commit/tag pin stabilizes source, not mutable metadata.
- **Selection rationale:** authoritative release/platform evidence; preferable to package-manager listings.

### S-003 — GitHub repository metadata

- **Publisher/title:** GitHub API metadata for `stargatedaw/stargate`.
- **URL:** <https://api.github.com/repos/stargatedaw/stargate>
- **Kind/scope:** primary platform metadata, mutable as of access date.
- **Accessed:** 2026-08-29.
- **Relevant fields:** `archived:false`, `disabled:false`, `default_branch:main`, public visibility, GPL-3.0 SPDX, repository dates.
- **Claims:** C-004, C-029.
- **Limitations:** stars/updates/push dates change and do not prove active maintenance or default-branch content.
- **Selection rationale:** authoritative for GitHub repository state; preferable to search snippets.

### S-004 — LibreAV MusiKernel index

- **Publisher/title:** LibreAV.org, “MusiKernel.”
- **URL:** <https://libreav.org/software/musikernel>
- **Kind/scope:** secondary software/release index; MusiKernel through transitional 2021 naming.
- **Accessed:** 2026-08-29.
- **Relevant passage:** developer/source/license fields and one sequence listing MusiKernel 2 16.05.7/16.05.8 followed by “MusiKernel Stargate” 21.08–21.09 releases.
- **Claims:** C-001, C-002.
- **Limitations:** mutable secondary source; old GitHub links now 404 or redirect namespace assumptions; cannot prove git ancestry.
- **Selection rationale:** retained only because the original upstream is unavailable and it preserves the clearest public transitional release sequence. Search snippets were not retained as evidence.

### S-005 — MusiKernel 2 16.05.8 source backup

- **Publisher/title:** FORARTfe, “MusiKernel2 — v16.05.8 sources backup.”
- **URL/pin:** <https://github.com/FORARTfe/MusiKernel2/tree/fb9c6dec70ddc5bdf5e410399583774ce1af9bd1>
- **Kind/scope:** immutable third-party source mirror; embedded MusiKernel 2 16.05.8 content.
- **Accessed:** 2026-08-29.
- **Relevant passages:** README, version files, GPL license, `src/pydaw` engine/UI/plugin/project tree, build scripts.
- **Claims:** C-001, C-002, C-029, C-034–C-036.
- **Limitations:** uploaded in 2024 as a file dump with no original tags/history; mirror completeness and provenance cannot be independently guaranteed.
- **Selection rationale:** only accessible public code for the last explicitly MusiKernel-branded snapshot; preferable to screenshots or binary reverse engineering.

### S-006 — Early retained Stargate tag

- **Publisher/title:** Stargate upstream `release-21.09.4` tree.
- **URL/pin:** <https://github.com/stargatedaw/stargate/tree/ca880260545126b5438cae25a6a42d8f1d8e05d1>
- **Kind/scope:** immutable primary tag, 2021-09-19.
- **Accessed:** 2026-08-29.
- **Relevant passage:** `src/meta.json` identifies `stargate` / `21.09.4`; README identifies Stargate.
- **Claims:** C-002.
- **Limitations:** does not preserve pre-2021 parent history and contradicts LibreAV’s transitional display name rather than disproving the index.
- **Selection rationale:** earliest decision-critical retained tag for adversarial lineage testing.

**Negative source/access results retained:** `https://github.com/j3ffhubb/musikernel` returned HTTP 404; exact historical `stargateaudio/stargate` tag/release API paths returned 404; current release API for 21.09.4 returned 404; GitHub release page 3 returned an empty array; one discovery search was HTTP 429; nested source help was unavailable because the subagent-depth limit was reached. None was promoted to affirmative evidence.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods/blocker | Impact | Available evidence | Safest next probe / fixture | Owner |
| --- | --- | --- | --- | --- | --- |
| Immutable pre-2021 lineage/provenance | Old upstream and historical API/tag refs return 404; mirror lacks history | Determines confidence in direct source ancestry | Secondary release sequence + structural similarity | Locate a cryptographically pinned Software Heritage/Internet Archive git snapshot or maintainer statement; compare object IDs | Unassigned |
| Current maintenance/discontinuation | Checked release/default branch and repo archived status; intent not stated | Affects suitability as maintained reference | Public/unarchived; last release/main 2024 | Ask upstream or find dated roadmap/release statement; do not infer from stars | Unassigned |
| Unknown native type failure and project round-trip | Static table has no placeholder; no binary run allowed | Project durability across versions/corruption | Fixed arrays and unguarded lookup | Disposable build; edit copied project type ID; capture UI/engine logs and verify state preservation | Unassigned |
| Missing audio relink/recovery | Traced code; only apparent cleanup is dead | Media durability and recovery UX | Audio pool paths/local copies; no reachable relinker | Disposable project with removed/moved source and local sample; record prompts/logs/state changes | Unassigned |
| PDC/timing correctness | Descriptor/graph search found no mechanism | Parallel mix phase/timing | High-confidence no-PDC inference | Two-path impulse fixture with known-delay native test device in clean fork/harness | Unassigned |
| Automation timing/curve semantics | Static tick path traced; no output measured | Sample accuracy and interpolation | Sample-offset dispatch; UI 1/64 smoothing; inert curve field | Render step/ramp fixture and inspect sample transition indices | Unassigned |
| Crash containment on released platforms | Current source says subprocess; stale docs say shared library | Reliability/security boundary | Current launcher/build package executable | Launch signed-off disposable build on each OS; crash engine and observe UI/restart/project state | Unassigned |
| Accessibility/localization | No audit/catalogs; no UI execution | Inclusive use and synthesis comparison | Qt widgets/shortcuts, disabled translation path | Keyboard-only + screen-reader audit on disposable build; catalog check | Unassigned |
| Advanced MIDI/sync/interchange | Source/manual negative search only | Hardware/post/collaboration suitability | Basic MIDI import/events | Protocol fixtures for SysEx/pressure/clock/MTC and import/export corpus | Unassigned |
| Build/test reproducibility | No CI workflow/result; no execution in documentary wave | Confidence in reachable code | Build scripts/tests/tooling | Reproducible container/macOS/Windows builds at both pins; record raw test output | Unassigned |

## 24. Curiosity pass and stop decision

Candidate follow-ups were scored 1 (low) to 5 (high):

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Recover immutable pre-2021 git ancestry | 4 | 3 | 5 | 5 | `CURIOSITY_NO_GO`: access/budget boundary; would improve history confidence but not change current host architecture |
| Dynamically test unknown native type/missing media | 5 | 5 | 4 | 4 | `CURIOSITY_NO_GO`: highest future value, but dynamic probes are outside this documentary wave |
| Inspect more source mirrors | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: likely duplicates with weaker provenance |
| Benchmark low-end performance | 3 | 3 | 4 | 5 | `CURIOSITY_NO_GO`: vendor claims require a controlled later benchmark |
| Deep-audit dependency licenses | 3 | 3 | 2 | 5 | `CURIOSITY_NO_GO`: necessary before redistribution, not for this architecture dossier |
| Search further for external plugin formats | 1 | 0 | 0 | 2 | `CURIOSITY_NO_GO`: explicit manual statement plus source saturation |

**Pursued curiosity thread:** the best in-frame documentary thread was the MusiKernel 2 backup comparison. It confirmed the last branded version, native-only structure, historical process modes, and plugin inventory while preserving the mirror-provenance limitation. [C-001] [C-034] [C-035]

**Gaps/contradictions after final synthesis:** lineage lacks immutable ancestry; stale shared-library debugging text conflicts with current subprocess source; source metadata 24.07.1 is newer than latest release; missing-audio cleanup and gettext code are dead; project policy promises exceed dynamically verified behavior. All are visible in claims/unknowns rather than silently resolved. [C-002] [C-003] [C-025] [C-037]

**Stop decision:** stop for **coverage plus saturation**. Every required heading and plugin row is complete; process/engine/UI/project/native-host behavior is pinned; release/platform/license state is covered; and another public-source pass is unlikely to alter the leading architecture conclusions. Remaining high-value questions require unavailable provenance or disposable dynamic fixtures. Marginal documentary evidence is nonpositive within budget.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added only `research/daw-landscape/dossiers/musikernel.md`; no sibling/index/governing file was changed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See §0 and §2.
- [x] **Every required dossier heading exists in order.** Headings 0–25 are present.
- [x] **Every material assertion has a claim ID and classification.** Sections cite C-IDs; §21 classifies each claim.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See §§21–23.
- [x] **Every required plugin-format row is present.** All 13 rows appear in §11.1 with no blanks.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** §§11.2–11.6 cover discovery, isolation, processing, state, UI, and failures.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Labels and counterevidence are explicit in §§20–23.
- [x] **Licensing and clean-room boundaries are explicit.** See §16.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Public source/docs were statically inspected; no product binary or installer was run.

**Checks performed:** heading/order review; matrix row/count review; claim-to-source review; immutable commit/tag verification; systematic source searches for every required plugin format, PDC/latency, scanning/isolation/bridging, advanced MIDI/sync, persistence/recovery, signing, and accessibility; owned-path/git-diff review.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`. Plugin-hosting conclusion is high confidence; pre-2021 lineage and several dynamic recovery/timing behaviors remain unresolved.

**Unresolved blockers:** deleted original upstream/history; mirror-only MusiKernel 2 source; documentary-wave prohibition on dynamic qualification; no public accessibility/build result.

**Workspace hygiene:** pre-existing workspace changes were left untouched; no staging or commit was performed.
