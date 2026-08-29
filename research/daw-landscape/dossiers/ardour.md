# Ardour DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Ardour |
| Canonical upstream | Ardour Community / Ardour developers, `ardour.org` and `Ardour/ardour` |
| Researcher/session ID | `ses_fb26cdc70ffexEYHiKsR96mSNm` |
| Owned path | `research/daw-landscape/dossiers/ardour.md` |
| Research date and cutoff | 2026-08-29 UTC |
| Current release | Ardour 9.8, released 2026-08-23; source tag 9.8 points to commit `22ed8656c2533e325322ff11831448e5123e0d4b` [C-001] |
| Editions/builds | One Ardour product family; official ready-to-run packages and user-built source are distinct. Some bundled plugins are available only in official builds. Build switches can change hosted formats. [C-002] |
| Platforms | Desktop Linux, macOS, Windows. No mobile or browser edition was identified. [C-001] |
| Included | Current open-source Ardour, official 9.8 release/docs, immutable 9.8 source, desktop plugin hosting |
| Excluded | Harrison Mixbus; old Ardour behavior except migration context; binary execution; proprietary plugin internals; legal advice |
| Completion | `COMPLETE_WITH_UNKNOWNS` |

No runtime probes were performed, so this dossier contains no `OBSERVED` claims. Official documentation proves what upstream documents; source citations describe the tagged implementation, not every distributor's build flags.

## 1. Executive summary

Ardour 9.8 is a maintained, GPL-licensed, cross-platform DAW whose open source provides unusually strong architecture evidence. A session combines a linear region/playlist timeline with a non-linear cue/clip surface. Tracks and buses form a routable graph, and each process cycle is scheduled across a main real-time worker and helper workers according to graph dependencies. [C-001] [C-003] [C-005]

Plugin hosting is broad but deliberately non-uniform. The 9.8 source enables VST3 by default on all three desktop OS families, AUv2 and Mac VST2 on macOS, Windows VST2 on Windows, Linux VST2 on Linux, and contains common LV2/LADSPA hosting. VST2, VST3, and AUv2 normally use separate scanner executables, XML caches, architecture-specific blacklists, scan logs, timeout/cancel paths, and targeted recovery actions. LV2 is indexed on every startup; LADSPA discovery directly loads modules in the Ardour process. [C-011] [C-012] [C-013]

Scanning isolation is not runtime sandboxing. The tagged host calls plugin wrappers synchronously as graph processors, with no Ardour process sandbox or bitness bridge evidenced. A plugin fault can therefore plausibly terminate or corrupt the host, although an OS or plugin format could add boundaries not visible here. This is an `INFERENCE`, not a runtime observation. [C-014]

The strongest transferable patterns are: immutable, versioned XML session state written via temporary-file rename; graph-topology scheduling; scanner subprocesses plus diagnosable cache/blacklist state; explicit audio/MIDI pin maps and sidechains; and an unknown-processor placeholder that preserves missing plugin state and I/O shape. Major unknowns are untested format conformance, plugin tail/offline fidelity, AUv3 and the other unimplemented/unmentioned matrix formats, MPE/MIDI 2.0, runtime crash containment, signing policy, and accessibility. [C-015] [C-018] [C-019] [C-029] [C-030] [C-031] [C-033]

Overall confidence is **high** for tagged source architecture and documented user surfaces, **medium** for official-package format parity, and **low/unknown** for third-party interoperability fidelity without a qualification harness.

## 2. Product identity, history, and market position

Ardour is the upstream open-source DAW from which this dossier takes its identity. The current official release page names 9.8 and dates it 2026-08-23; the annotated source tag was created 2026-08-20 and resolves to the immutable commit named in metadata. Official ready-to-run packages target Linux, macOS, and Windows, while source builds are explicitly unsupported by the download service. [C-001]

The product targets recording, editing, mixing, soundtrack, MIDI, and live/non-linear cue workflows. It is not split into feature-priced Ardour editions, but official builds and arbitrary source builds are not equivalent: compile-time switches can remove VST2/VST3 and some bundled plugins are official-build-only. [C-002]

Mixbus is a related downstream product but is excluded. Source branches contain Mixbus conditionals; none of those conditionals are treated as Ardour product behavior here.

## 3. Workflow and conceptual model

The fundamental document is a filesystem-backed **Session** containing routes, sources, regions, playlists, locations, tempo map, controls, plugin state, and undo history. The user-visible editing model is non-destructive and region-based on a linear timeline, with track playlists supporting alternatives/takes. Ardour also exposes clip libraries, a cue grid, follow actions, and mixing between linear and non-linear workflows. [C-003]

Tracks and buses are both route-like signal objects. Processors, including plugins and sends, are ordered within routes; explicit connections between routes, hardware, applications, and network endpoints form the session graph. [C-004] [C-007]

Ardour is neither notation-first nor tracker-first. The current manual documents piano-roll/list MIDI editing and a cue grid, but this pass did not establish a score editor, tracker pattern model, or full notation interchange. [C-010] [C-030]

## 4. Publicly documented architecture

The 9.8 source tree separates core libraries (`libs/ardour`, temporal, MIDI, panners, surfaces, backends), the desktop frontend, headless/session utilities, Lua session tooling, plugin-format wrappers and UIs, scanner helpers, bundled LV2 plugins, and data/control-surface resources. [C-004]

`Session` owns the engine-facing project model. `Graph` creates one main process thread and zero or more helpers based on the configured DSP-thread count. A graph chain records dependency edges, initial nodes, and terminal nodes. Workers pop ready nodes, and a node's completion activates dependent nodes; the process callback waits until all terminal nodes complete. [C-005]

Backend selection is modular at build time (`jack`, `alsa`, `portaudio`, `coreaudio`, and `pulseaudio` are named by the build system). Exact backend packaging by each official OS package was not independently verified. [C-006]

Threading outside the DSP graph includes a disk/buffer "butler," MIDI I/O, GUI, scanner child processes, and context-specific Lua execution. The Lua manual states GUI actions/hooks run in GUI-thread contexts, session scripts in the main audio callback, and DSP scripts on DSP threads. [C-005] [C-020]

## 5. Audio engine

Routes and I/O plugins are graph nodes. Independent ready routes can execute in parallel, while processors inside a route are invoked by that route's `roll`/`no_roll` path. **INFERENCE:** practical parallelism is constrained by routing dependencies and serial processor chains; an alternative is that internal plugins may parallelize themselves. [C-005]

The engine's sample rate and block size come from the active backend. The source supports in-place and out-of-place plugin processing, reusable buffer sets, freewheeling/faster-than-real-time export, and explicit real-time allocation diagnostics. The official feature page documents real-time and faster-than-real-time export, but not bit-depth or oversampling guarantees. [C-006] [C-015] [C-022]

Latency compensation uses read-ahead. Plugin inserts query signal/max latency, configure delay buffers, and notify the owning route when effective latency changes. The manual explains deadline pressure and xruns; the source notes that changing plugin latency may click and that per-stream latency is not represented. A plugin-sidechain code comment still calls out missing delayline work, so exact sidechain PDC is not claimed. [C-008] [C-015]

Ardour reports performance and plugin DSP timing through performance meters and per-plugin CPU profiling. Scaling limits are resource-bound rather than fixed product limits in the official feature statement. [C-028]

`UNKNOWN`: native oversampling policy, plugin-tail scheduling, dropout concealment beyond xrun handling, and bit-exact equivalence between real-time and offline plugin rendering. [C-033]

## 6. Tracks, timeline, clips, and editing

Ardour documents unlimited mono, stereo, and multichannel tracks/buses subject to CPU/disk resources; overlapping layered regions; destructive and non-destructive track modes; unlimited undo/redo that can persist across sessions; fades, gain, time stretching, transient tools, tempo/meter rulers, sections, and playlists. [C-003] [C-004]

The cue subsystem adds audio/MIDI clips, launch properties, follow actions, recording, and a workflow that can coexist with the linear editor. Ardour 9.8 also records clips with count-in and retains pre-boundary material for later slip adjustment. [C-003] [C-009]

Playlist alternatives and layered regions provide take-management primitives. The sources reviewed did not establish a single "swipe comping" abstraction or frozen-track implementation, so those details remain `UNKNOWN` rather than inferred from playlists or bounce. [C-030]

## 7. MIDI, sequencing, notation, and expression

The current manual documents MIDI tracks/regions, piano-roll and list editors, note/chord/velocity/patch editing, quantize/transpose, step entry, MIDI automation, pitch bend/aftertouch, MIDI tracer, hardware configuration, MIDI clock, MTC, and transport-master concepts. Ardour 9.8 adds session-level and per-track keys/scales with opt-in visualization and input correction. [C-010]

Plugins can expose MIDI input/output pins, receive immediate events, and participate in MIDI sidechains. Lua DSP processors can also declare MIDI input and process MIDI data in their callback. [C-015] [C-020]

`UNKNOWN`: MPE semantics, per-note expression mapping, MIDI 2.0/UMP support, sample-accurate MIDI output guarantees, SysEx persistence limits, score editing, and MusicXML import/export. Targeted manual/source searches found no decisive current statement; a conformance probe is required. [C-030]

## 8. Routing, mixer, automation, and control

Ardour exposes matrix-style routing between tracks, buses, hardware, other applications, and network endpoints, with sends, inserts, returns, subgroups, foldback, monitor section, VCAs, panners, and arbitrary multichannel layouts. Dedicated or manually added plugin sidechain ports accept audio or MIDI and are fed by host-created send processors. [C-007]

Automation supports track- or region-associated data and Write/Touch-style modes. The official feature page calls it sample accurate. Source code shows a more useful nuance: VST3 values are sent with offsets inside a block, while other plugin paths may split processing at automation events unless fixed-size processing prevents it. Full per-format fidelity still requires testing. [C-016]

Control boundaries include generic MIDI learn/maps, multiple named hardware protocols, OSC, WebSockets, an HTTP control surface, and Lua. Current release notes also show active OSC and hardware-surface maintenance. [C-023]

Feedback routing policy and immersive channel-layout limits were not established in the retained sources. [C-031]

## 9. Recording, comping, and media handling

Recording supports per-track arm, tape-style master transport, layered/non-layered modes, monitoring choices, punch, loop recording, wet recording points, and Stop & Forget. Sessions retain recorded/imported media as sources and expose regions/playlists non-destructively. [C-009]

Ardour 9.8 documents crash recovery for active audio recording with at most five seconds of loss; partial FLAC/BWF content is recovered into a new file while retaining the original. The source records pending session and capture logs, reconstructs regions, and writes recovery metadata. [C-009]

Session media includes raw audio and MIDI under `interchange/`, peaks, analysis data, exports, and a dead-sounds area. The source also creates session plugin-state and external-asset directories. [C-021]

Video import, thumbnail timeline, external monitor/server topologies, frame locking, and remux/export are documented. Proxy/conform, BWF metadata breadth, and relinking edge cases remain `UNKNOWN`. [C-022]

## 10. Instruments, effects, content, and native devices

Ardour ships built-in/bundled LV2 effects, instruments, and utilities; exact inventory is build-dependent and some plugins are official-build-only. Plugins, sends, inserts, and Lua DSP scripts all appear as processors in a route's processor box. [C-027]

The generic editor can add an on-screen keyboard for instruments. Plugin output presets and pin maps support multi-output instrument configurations, while user presets and host/plugin private state are format-specific. [C-015] [C-017]

There is no evidence of a separate proprietary native binary plugin SDK. Lua DSP is the documented product-native extension format; bundled native processing is represented largely through LV2 and internal processors. [C-027]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

Cells describe current 9.8 source/build evidence, not independent execution. `UNKNOWN` means the targeted official manual and 9.8 source review did not establish support; it is not an unsupported claim.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no edition | 9.8 source enables Mac VST, Windows VST, or LXVST by target; each can be compiled out | Current hosting exists, but VST2 SDK redistribution/new-license constraints make clean-room adoption legally constrained | C-011, C-024; S-005, S-009, S-021 |
| VST3 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no edition | 9.8 enables VST3 unless `--no-vst3`; OS-specific paths in plugin manager | Scanner and runtime wrapper present on all desktop targets | C-011, C-012; S-005, S-009 |
| AUv2 | DOCUMENTED | NOT_APPLICABLE:Apple API | NOT_APPLICABLE:Apple API | NOT_APPLICABLE:no edition | macOS build defines AudioUnit support; source names AUv2 scanner/cache/blacklist | AU in generic manual; immutable source specifically establishes AUv2 | C-011, C-012; S-005, S-009, S-011 |
| AUv3 | UNKNOWN | NOT_APPLICABLE:Apple API | NOT_APPLICABLE:Apple API | NOT_APPLICABLE:no edition | No AUv3 path identified in targeted current manual/9.8 tree review | Do not equate generic "AU" text with AUv3 | C-029; S-007, S-011 |
| AAX | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no edition | No AAX host path identified in targeted current manual/9.8 tree review | Avid SDK/certification analysis would be separate | C-029; S-007, S-012 |
| CLAP | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no edition | No CLAP host path identified in targeted current manual/9.8 tree review | Requires explicit source or runtime evidence | C-029; S-007, S-012 |
| LV2 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no edition | Official features say LV2 all platforms; common source host and bundled LV2 modules | Audio/MIDI, custom or Ardour generic UI; unconditional startup indexing | C-011, C-013; S-003, S-009, S-011 |
| LADSPA | DOCUMENTED:source | DOCUMENTED:source | DOCUMENTED | NOT_APPLICABLE:no edition | Common 9.8 plugin manager scans `.dylib`, `.dll`, `.so`; manual calls LADSPA supported | Audio effects only; host-generated UI; official prebuilt parity on macOS/Windows not probed | C-011, C-013; S-004, S-009, S-011 |
| DSSI | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no edition | No DSSI host path identified in targeted current manual/9.8 tree review | Absence is not proof of unsupported behavior | C-029; S-007, S-012 |
| JSFX | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no edition | No JSFX host path identified in targeted current manual/9.8 tree review | No Reaper compatibility claim | C-029; S-007, S-012 |
| DirectX/DXi | NOT_APPLICABLE:non-Windows API | UNKNOWN | NOT_APPLICABLE:non-Windows API | NOT_APPLICABLE:no edition | No DirectX/DXi host path identified for Windows | Requires explicit Windows package/runtime probe | C-029; S-007, S-012 |
| Rack Extension | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no edition | No Rack Extension host path identified in targeted current manual/9.8 tree review | Proprietary ecosystem not implied | C-029; S-007, S-012 |
| Product-native/other | DOCUMENTED:Lua DSP | DOCUMENTED:Lua DSP | DOCUMENTED:Lua DSP | NOT_APPLICABLE:no edition | Current Lua manual and 9.8 source; bundled processors/LV2 are build-dependent | Lua DSP declares I/O, parameters and callbacks; API documented as subject to change | C-020, C-027; S-005, S-019 |

### 11.2 Discovery, scanning, validation, and recovery

VST2, VST3, and AUv2 discovery normally launches `ardour-vst-scanner`, `ardour-vst3-scanner`, or `ardour-au-scanner` as a child process. Scanners write format-specific XML cache files; invalid, missing, changed, corrupt, or architecture-mismatched cache entries are rejected and rescanned. If a scanner helper is missing and no cache exists, source code can fall back to scanning in the host process. [C-012]

The host writes architecture-specific blacklist files for VST2/VST3/AUv2, pre-blacklists before risky scanning, removes entries after success, and retains per-plugin scan results. It also persists an XML scan log. The Plugin Manager exposes discover/update, selected/faulty/all rescan, ignore, hide, favorites, stale-log cleanup, cache/path preferences, and statuses including incompatible 32/64-bit mismatch. [C-012]

VST2 discovery de-duplicates by format and unique ID, rejecting conflicting paths. Ardour can conceal VST2 when a creator/name-equivalent VST3 exists, and LADSPA when an LV2 equivalent exists; this is presentation policy, not state migration proof. [C-025]

LV2 discovery is unconditional at startup according to the manual and uses the in-process LV2 discovery API in the plugin manager. LADSPA discovery directly opens each shared library and calls its descriptor function. Neither receives the same scanner-process containment evidenced for VST/AU. [C-013]

### 11.3 Runtime isolation and compatibility

**INFERENCE:** successfully scanned VST2/VST3/AUv2/LV2/LADSPA plugins execute in Ardour's process. The generic `PluginInsert` invokes wrapper `connect_and_run` methods synchronously on graph workers, and no runtime broker is present in the reviewed module map. A plausible alternative is an OS/format implementation adding an unseen process boundary. [C-014]

No Ardour runtime sandbox, per-plugin crash restart, or 32/64-bit bridge is documented. Architecture mismatch is surfaced as `Incompatible`, which is evidence for rejection rather than bridging. Safe mode can suppress VST scans/all loaded plugins, but it is recovery, not containment. [C-012] [C-014]

Code-signing, notarization, Rosetta/architecture translation, Windows compatibility modes, and malicious-plugin threat controls remain `UNKNOWN`. [C-031]

### 11.4 Host/plugin processing contract

The host models audio and MIDI channel counts, instruments/effects, no-input generators, sidechain pins, multiple output configurations, plugin replication where needed, fixed/reconfigurable I/O, in-place safety, input/output/thru maps, immediate events, and dynamic latency. [C-015]

Host-side pin mapping can hide extra inputs with silence, split one stream to multiple plugin pins, replicate some plugins, or reject impossible arrangements. Dedicated and manually created sidechains carry audio or MIDI. VST3 discovery records main/aux audio and MIDI bus counts. [C-015]

Automation is not a single cross-format guarantee: source provides in-block offsets to VST3 and splits cycles for eligible other plugins; the official UI claim is sample-accurate automation. MPE, MIDI 2.0, per-note expression, dynamic bus changes during processing, plugin tail handling, and exact offline behavior are unqualified. [C-016] [C-030] [C-033]

### 11.5 Parameters, automation, state, presets, and project recall

Ardour creates controls from plugin parameter descriptors, preserving labels/ranges/defaults, input/output direction, automatable flags, inline controls, numeric property automation, and format-specific bypass. Unsupported/non-numeric properties can remain non-automatable. [C-015]

Session XML stores plugin type, unique ID, instance count, configured I/O, custom sinks/outputs, input/output/thru maps, sidechain state, format-private state, and each automation control. External plugin state files can be tied to insert IDs in the session plugin-state directory. [C-018]

When loading cannot instantiate a plugin, `UnknownProcessor` retains the original XML, display name/type, saved I/O shape, and sidechain state. It preserves routing shape by pass-through/silencing behavior, allowing later saves without throwing away unknown state. This is stronger than merely displaying a missing-plugin warning. [C-019]

Preset management exists in the UI and plugin insert propagates preset-set values, but preset file locations, cross-OS migration, asset relocation, and per-format bank/program fidelity remain `UNKNOWN`. [C-033]

### 11.6 UI, diagnostics, and failure modes

Ardour can host a plugin-provided custom UI or build a generic UI. The generic UI supports common controls, host/plugin bypass, automation style, instrument keyboard, CPU profile, transfer/phase/spectrum analysis, and a bottom-pane presentation. Users can force generic controls even when a custom UI exists. [C-017]

The Plugin Manager provides searchable scan state and failure diagnostics. Scanner timeout/cancel paths terminate the child and remove partial cache files. `Error`, `Stale`, `Incompatible`, `Concealed`, and missing counts distinguish failure classes. [C-012]

Custom-UI detach/embedding differences, DPI scaling, accessibility semantics inside third-party UIs, headless plugin UI behavior, and crash recovery after a plugin fails during processing remain `UNKNOWN`. [C-031]

## 12. Extensibility and integration

Lua exposes much of the C++ session object model through constrained contexts: editor actions, GUI hooks, per-cycle session scripts, per-route DSP scripts, console, and the headless `luasession` tool. DSP scripts declare possible I/O, MIDI input and automatable parameters. Scripts are stored in the session, cannot load external Lua modules, and use separate interpreters/APIs to separate GUI and real-time authority. The manual still labels the API/prototyping surface subject to change. [C-020]

Lua is not a security sandbox: official examples include filesystem writes and launching external applications as use cases. Treat installed scripts as trusted code even though real-time method exposure is restricted. [C-020] [C-031]

Control integration includes MIDI maps/learn, OSC, WebSockets, HTTP, and named hardware protocols. The stability/versioning guarantees of those APIs, and any third-party C++ binary extension ABI, are `UNKNOWN`. [C-023] [C-031]

## 13. Project format, persistence, interoperability, and collaboration

A session directory contains one or more `.ardour` XML snapshots, `.bak`, persistent history, UI metadata, raw audio/MIDI, exports, peaks, analysis, and unused media. It stores routing, tempo/meter, tracks, buses, regions, plugins and their state. The manual states that sessions back to 2.8 generally load, while unsupported old data can be skipped. [C-021]

State writes are serialized under locks, written to a temporary XML file, then atomically renamed over the target after backing up the prior snapshot. Pending autosaves are separate, explicit saves retain history, older state versions are backed up before migration, and future major versions are rejected. [C-021]

Missing plugins use durable placeholders [C-019]. Missing media has dedicated dialogs in the source tree, but relinking semantics were not researched deeply enough to claim. Session archives, templates, route-state import/export and "only used assets" paths exist in source; format-specific external plugin asset portability remains `UNKNOWN`. [C-018] [C-032]

Interchange includes stem export and AAF import of fades, volume/pan automation, and multichannel tracks/regions. A basic, incomplete PTF/PTX importer covers audio placement and MIDI notes for selected historical Pro Tools versions. OMF is described but not claimed as directly imported. [C-022]

No built-in cloud collaboration, project version-control protocol, DAWproject, ADM session exchange, or guaranteed forward compatibility was established. [C-032]

## 14. Delivery, live, post-production, and specialized workflows

Export supports WAV, AIFF, CAF, BWF, FLAC, Ogg/Vorbis, MP3, multichannel files, simultaneous formats/sample rates, stems, CUE/TOC, real-time/faster-than-real-time operation, and post-export loudness/frequency analysis. [C-022]

Post workflows include video timeline/monitoring/remux, timecode/transport masters, LTC improvements in 9.8, and frame-granular locking. Live-oriented boundaries include cue launching/follow actions, OSC/control surfaces, and flexible monitoring/routing. [C-003] [C-022] [C-023]

`UNKNOWN`: DDP authoring, ADM/immersive deliverables, ADR management, show-control guarantees, and loudness-standard compliance certification. [C-031]

## 15. Performance, reliability, security, and accessibility

The graph scheduler parallelizes dependency-ready route nodes across configured process workers. Disk/buffer work is delegated to a butler thread; MIDI has its own I/O thread. Performance meters, per-plugin timing, xruns, scan logs and source-level real-time-allocation checks are diagnosability strengths. [C-005] [C-028]

Reliability mechanisms include scanner subprocesses for VST/AU, cache/blacklist recovery, pending-state recording recovery, snapshot backups/history, and unknown plugin placeholders. These do not contain faults in an already instantiated in-process plugin. [C-009] [C-012] [C-014] [C-019]

The plugin and Lua boundaries accept third-party executable code with broad host/session authority. No runtime permission model, plugin sandbox, signature allowlist, telemetry behavior, reproducible official-build attestation, or rollback mechanism was established. [C-031]

The release includes multiple translations, but keyboard/screen-reader accessibility and third-party UI accessibility were not established. These remain consequential `UNKNOWN`s. [C-031]

## 16. Licensing, ecosystem, and implementation constraints

Ardour source files state GPL version 2 or, at the user's option, later; the official site publishes GPLv2 terms. Distribution of a derivative or covered combined work can trigger source, notice, and same-license obligations. This dossier does not decide whether any proposed adaptation is derivative; obtain legal review. [C-024]

Clean-room lessons may be adapted as independently implemented mechanisms, but Ardour code, UI expression, assets, names/trademarks, and bundled third-party code must not be copied merely because the repository is public. Dependencies and bundled plugins can carry their own licenses. [C-024]

Steinberg's current official FAQ says the VST3 SDK is MIT-licensed with copyright/license notice retention. It also says VST2 SDK files such as `aeffect.h`/`aeffectx.h` may not be redistributed, and binary distribution of a VST2 plugin/host is allowed only if the developer signed the VST2 agreement before October 2018. A new DAW should not infer VST2 distribution rights from Ardour's existing implementation. [C-024]

AU and platform signing/notarization obligations, AAX licensing/certification, Rack Extension terms, and use of format trademarks require separate owner documentation and legal review. [C-029] [C-031]

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** Open, immutable source exposes a coherent session/route graph and real-time scheduler; routing and pin maps are explicit; scanner state is diagnosable and recoverable; session writes and missing-plugin placeholders prioritize durability; Lua and remote surfaces provide several extension levels. [C-005] [C-007] [C-012] [C-018] [C-019] [C-020]

**Liabilities.** Scanner subprocesses may create a false sense of runtime isolation; LADSPA/LV2 discovery has weaker process isolation; the full plugin contract varies by format; source/build options complicate support matrices; scripting APIs are unstable; GPL and VST2 constraints limit direct reuse. [C-002] [C-013] [C-014] [C-016] [C-020] [C-024]

**Reference suitability.** Ardour is a high-value architectural reference for graph scheduling, persistence, and diagnosability. It is not evidence that every accepted plugin behaves correctly, nor a safe code donor for a differently licensed clean-room implementation. [C-014] [C-024] [C-033]

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Support | Prerequisites and tradeoffs | Adaptation risk |
| --- | --- | --- | --- | --- | --- |
| CANDIDATE | Parallel real-time routing | Immutable graph snapshot; predecessor counts; ready queue; terminal barrier per block | C-005 | RT-safe queues, topology validation, bounded workers; dependency chains limit speedup | Medium |
| CANDIDATE | Unsafe plugin discovery | One scanner child per risky candidate, timeout, parse-only cache, pre-blacklist and persistent diagnostics | C-012 | Hardened IPC/schema, OS process controls; startup complexity | Medium |
| CANDIDATE | Missing plugins destroy sessions | Opaque state-preserving placeholder with saved I/O and sidechain shape | C-018, C-019 | Versioned state envelopes and stable identities; pass-through can change sound | Low |
| CANDIDATE | Flexible buses/sidechains | Typed audio/MIDI pins plus persisted input/output/thru maps and explicit sends | C-007, C-015 | Cycle detection, PDC, dynamic reconfiguration; high UI complexity | Medium |
| CANDIDATE | Crash-safe project saves | Versioned XML-like state, temp write, fsync/rename discipline, prior-version backup and pending recovery | C-021 | Transactional asset handling still needed; XML is not mandatory | Low |
| CONDITIONAL | User automation/extensibility | Context-specific interpreters with narrow GUI/RT APIs and embedded scripts | C-020 | Capability model, quotas, signing/trust UX; scripts can still be hostile | High |
| CONDITIONAL | Duplicate-format migration UX | Conceal old format when stable vendor/name identity matches new format | C-025 | Requires stronger identity and state migration than names alone | High |

These are mechanisms, not copied Ardour implementation or protected UI expression.

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** Treat scanner subprocesses as sufficient plugin sandboxing. Runtime calls remain in-process in the reviewed architecture. Reopen only if a current runtime broker is documented. [C-014]
- **REJECTED:** Use creator/name matching as automatic VST2-to-VST3 state migration. Ardour's evidence establishes concealment, not equivalent identity or state compatibility. [C-025]
- **REJECTED:** Add VST2 to a new product because Ardour hosts it. Steinberg's current licensing statement blocks new unlicensed binary distribution. [C-024]
- **REJECTED:** Promise generic "sample-accurate plugin automation" from one format logo. Scheduling paths differ and plugin acceptance is untested. [C-016]
- `CURIOSITY_NO_GO`: CLAP/AAX/AUv3/DSSI/JSFX/DirectX/Rack Extension implementation hunt. Current manual and immutable tree did not expose host paths; another absence search has low expected value. Reopen on an upstream release claim or source module. [C-029]
- `CURIOSITY_NO_GO`: exhaustive built-in plugin inventory. It is build/package-specific and does not change the architecture decision. [C-027]
- `CURIOSITY_NO_GO`: UI visual catalog and keyboard shortcut census. Low architecture value; accessibility needs a dedicated audit instead. [C-031]
- `CURIOSITY_NO_GO`: old AATranslator compatibility. The documentation is historical and third-party; use stems/AAF tests if interchange becomes a prototype target. [C-022]

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and countersearch | Result | Later discriminating probe |
| --- | --- | --- | --- |
| H-01: Ardour 9.8 uses dependency-aware multicore route scheduling | Read immutable graph construction, ready queue, workers, terminal completion | Supported at source level [C-005] | Instrument a synthetic branched graph and compare worker traces |
| H-02: Plugin scanning is process-isolated | Read manager launch/fallback paths for every format | Partly supported: VST2/VST3/AUv2 normally separate; fallback, LV2, LADSPA are in process [C-012] [C-013] | Crash/hang fixtures per format and cache state inspection |
| H-03: Plugin runtime is sandboxed | Search tree for brokers and inspect `PluginInsert::connect_and_run` | Not supported; in-process runtime is the leading inference [C-014] | Crash a disposable plugin instance under process tracing |
| H-04: "Supported" means full host-contract fidelity | Compare format names with buses, automation, PDC, state, UI and failure evidence | Falsified as a documentary shortcut [C-015] [C-016] [C-033] | Automated conformance matrix per plugin/OS/build |
| H-05: Missing plugins preserve recall data | Inspect plugin state and immutable unknown-processor implementation | Supported [C-018] [C-019] | Remove/reinstall fixture plugin and byte-compare opaque state |
| H-06: VST3 is enabled on all desktop builds | Inspect target-independent 9.8 build flag and OS search paths | Supported for default source configuration, not every package [C-011] | Query official binaries and scan known fixtures on three OSes |
| H-07: AU means AUv2 and AUv3 | Inspect scanner/cache names and manual terminology | Falsified; AUv2 evidenced, AUv3 remains unknown [C-011] [C-029] | Install signed AUv2/AUv3 fixtures on disposable macOS host |
| H-08: Plugin acceptance stages are equivalent | Separate path found, scanned, indexed, instantiated, rendered, automated, restored | Falsified by design; each is a distinct gate [C-012] [C-015] [C-018] | Record outcomes independently in qualification harness |

No contradiction was found between the 9.8 release tag and current release page. The main tension is marketing-level "sample accurate automation for everything" versus format-specific source paths; the dossier retains both and narrows the architecture conclusion.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Ardour 9.8 is current at cutoff, released 2026-08-23 for Linux/macOS/Windows; tag resolves to immutable commit | Official/current | S-001, S-002, S-006 | Release and tag metadata agree | No package execution |
| C-002 | DOCUMENTED | High | Official and source builds differ; plugin formats are compile-time selectable and some bundled plugins official-only | 9.8 build/distribution | S-002, S-005, S-011 | Direct download/build/manual statements | Exact official flags not published in retained sources |
| C-003 | DOCUMENTED | High | Session workflow combines linear regions/playlists with cue clips/non-linear launching | Current UX | S-003, S-010, S-022 | Official feature/manual sections | No workflow usability observation |
| C-004 | DOCUMENTED | High | Tracks/buses/processors/routes form the main user and source module model | Current/9.8 | S-003, S-007, S-022 | Features plus module/session contents | Internal object map summarized, not exhaustive |
| C-005 | DOCUMENTED | High | Graph chains schedule dependency-ready route nodes across a main RT worker and helpers, completing at terminal nodes | Commit `22ed865...` | S-008 | Direct source | Runtime scaling not measured |
| C-006 | DOCUMENTED | Medium | Audio backends and build flags are modular; engine takes backend block size/sample rate | 9.8 source | S-005, S-017 | Build options and session initialization | Official package backend set unknown |
| C-007 | DOCUMENTED | High | Matrix routing and host-managed audio/MIDI sidechains use explicit ports/sends/pin maps | Current/9.8 | S-003, S-015, S-016 | Manual and source align | Feedback/cycle limits not covered |
| C-008 | DOCUMENTED | High | Ardour uses read-ahead latency compensation and plugin inserts update route latency/delay buffers | Current/9.8 | S-014, S-016 | Manual plus direct source | Sidechain/per-stream caveats |
| C-009 | DOCUMENTED | High | Recording supports punch/loop/layers and 9.8 crash recovery with at most five seconds documented loss | 9.8/current | S-001, S-003, S-017 | Release, feature and recovery source | No destructive crash probe |
| C-010 | DOCUMENTED | Medium | Current MIDI surface includes detailed note editing/sync and 9.8 key/scale support | Current | S-001, S-010 | Manual TOC plus release details | MPE/MIDI 2.0 not established |
| C-011 | DOCUMENTED | High | 9.8 source supports VST2 target variants, VST3 all desktop targets, AUv2 macOS, LV2/LADSPA common hosting | 9.8 source/build | S-003, S-005, S-009, S-011 | Build macros and manager paths | Official binary parity not observed |
| C-012 | DOCUMENTED | High | VST2/VST3/AUv2 use helper scanners, caches, blacklists, logs, timeout/cancel and rescan UX | 9.8/current | S-009, S-012 | Direct source plus manual UX | Host-process fallback exists |
| C-013 | DOCUMENTED | High | LV2 indexes unconditionally at startup and LADSPA discovery directly loads modules; no equivalent helper evidenced | 9.8/current | S-009, S-012 | Explicit manual/source behavior | LV2 library internals not exhaustively traced |
| C-014 | INFERENCE | Medium-high | Instantiated plugins run in Ardour's process without an Ardour runtime sandbox/bridge | Commit `22ed865...` | S-007, S-016 | Generic wrapper called on graph worker; no broker module | OS/format could hide a boundary; no process trace |
| C-015 | DOCUMENTED | High | Plugin insert negotiates typed I/O, maps, sidechains, latency, bypass, replication and dynamic configurations | Commit `22ed865...` | S-015, S-016 | Manual and direct source | Per-format implementation may be incomplete |
| C-016 | DOCUMENTED | High | VST3 gets intra-block parameter offsets; other eligible paths split cycles; marketing claims sample accuracy | Current/9.8 | S-003, S-016 | Source narrows broad feature claim | Plugin compliance untested; fixed blocks constrain splitting |
| C-017 | DOCUMENTED | High | Host can show custom or generated plugin UIs with inline controls, profiling, analysis and instrument keyboard | Current | S-011, S-013 | Manual | Scaling/detach/accessibility unknown |
| C-018 | DOCUMENTED | High | Session plugin state includes stable identity, private state, I/O maps, sidechain, automation and external state IDs | Commit `22ed865...` | S-016, S-017 | Direct serialization source | Binary/private state portability is format-specific |
| C-019 | DOCUMENTED | High | Missing plugin placeholder preserves opaque state, I/O shape and sidechain connections | Commit `22ed865...` | S-018 | Direct source | Restoration after reinstall not dynamically tested |
| C-020 | DOCUMENTED | High | Lua supports actions/hooks/session/DSP/console/headless contexts with embedded scripts and context-specific threading/API limits | Current | S-019 | Official manual | API explicitly unstable; security sandbox not promised |
| C-021 | DOCUMENTED | High | Session is a versioned filesystem bundle with snapshots/history/assets; save uses backup plus temp-file rename and pending recovery | Current/9.8 | S-017, S-022 | Manual and direct source | Filesystem durability/fync details not fully traced |
| C-022 | DOCUMENTED | Medium-high | Export/video/stems/AAF/basic Pro Tools import support post/interchange workflows | Current docs | S-003, S-010, S-023 | Official pages | Some importer text/tests are historical |
| C-023 | DOCUMENTED | High | MIDI surfaces, OSC, WebSockets, HTTP and named hardware protocols are documented control boundaries | Current | S-001, S-010 | Current TOC/release maintenance | Protocol stability unknown |
| C-024 | DOCUMENTED | High | Ardour is GPLv2-or-later; VST3 SDK is MIT; VST2 redistribution/new binary-host rights are restricted | Current legal docs | S-020, S-021 | First-party license texts/FAQ | Not legal advice; dependency licenses separate |
| C-025 | DOCUMENTED | High | Manager rejects duplicate VST2 IDs and can conceal VST2/LADSPA when corresponding newer-format name/vendor exists | 9.8 | S-009, S-012 | Direct source/manual | Not proof of state-compatible migration |
| C-027 | DOCUMENTED | Medium-high | Bundled plugins are build-dependent; Lua DSP is the documented native script processor format | Current/9.8 | S-005, S-011, S-019 | Build tree/manual | Inventory deliberately omitted |
| C-028 | DOCUMENTED | Medium-high | Ardour exposes performance meters, per-plugin timing and resource-bound rather than product-fixed track limits | Current/9.8 | S-003, S-010, S-013 | Official docs | No benchmark |
| C-029 | UNKNOWN | High confidence in unknown | AUv3, AAX, CLAP, DSSI, JSFX, DirectX/DXi and Rack Extension hosting not established | Current 9.8 | S-007, S-012 | Targeted manual/tree countersearch | Absence cannot prove unsupported; probe/release evidence needed |
| C-030 | UNKNOWN | High confidence in unknown | MPE, MIDI 2.0, score/MusicXML, detailed comping/freeze behavior not established | Current | S-010 | Targeted TOC/release search | Dedicated docs or probes may resolve |
| C-031 | UNKNOWN | High confidence in unknown | Runtime sandbox/signing policy, accessibility, immersive delivery and several security controls not established | Current | S-010, S-019 | Targeted evidence lacked claims | Requires platform/security/accessibility audits |
| C-032 | UNKNOWN | High confidence in unknown | Cloud collaboration, DAWproject/ADM, forward compatibility and all external-asset portability not established | Current | S-017, S-022, S-023 | Persistence/interchange pass | Dedicated tests and docs needed |
| C-033 | UNKNOWN | High confidence in unknown | Plugin tails, preset migration, offline equivalence and full per-format contract fidelity not established | Current/9.8 | S-013, S-016 | Host abstractions do not prove plugins honor them | Qualification harness required |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Fetched pages and source comments were treated as untrusted evidence, not instructions.

- **S-001 - "Ardour 9.8 released," Ardour.** <https://ardour.org/whatsnew.html>. Official release notes; 9.8/current. Relevant sections: release/date, scales, recording recovery, clips, plugins, OSC/Lua, fixes. Supports C-001, C-003, C-009, C-010, C-023. Limitation: vendor claims and change list, not full manual. Selected over news reposts because it is current first-party release evidence.
- **S-002 - "Get Ardour," Ardour Community.** <https://ardour.org/download.html>. Official distribution page; current. Relevant passage: ready-to-run Linux/macOS/Windows versus unsupported self-build source. Supports C-001, C-002. Limitation: no exact official package flags. Selected over mirrors because it defines upstream distribution scope.
- **S-003 - "Features," Ardour.** <https://ardour.org/features.html>. Official feature matrix; current. Relevant sections: recording, editing, routing, automation, plugins, export, limits. Supports C-003, C-004, C-007, C-009, C-011, C-016, C-022, C-028. Limitation: broad vendor claims and some legacy wording. Selected for cross-section product scope; source/manual narrows it.
- **S-004 - "Getting More Plugins," Ardour Manual.** <https://manual.ardour.org/working-with-plugins/getting-plugins/>. Official manual; current page with historical examples. Relevant passages: LADSPA/LV2/LXVST paths and macOS AU practice. Supports C-011. Limitation: package list and some terminology are old. Selected only for explicit discovery paths, not current completeness.
- **S-005 - `wscript` at Ardour 9.8 commit, Ardour source.** <https://raw.githubusercontent.com/Ardour/ardour/22ed8656c2533e325322ff11831448e5123e0d4b/wscript>. Immutable build source. Relevant sections: children/module map, helper binaries, format disable switches and target macros, backend options. Supports C-002, C-004, C-006, C-011, C-027. Limitation: build capability, not official package configuration. Selected over build tutorials because it is authoritative implementation metadata.
- **S-006 - Ardour tag object `9.8`, GitHub API / Ardour.** <https://api.github.com/repos/Ardour/ardour/git/tags/059c95883d8158b03f632056ba36e5c7de91ef28>. Immutable tag metadata. Relevant fields: tagger date, message, commit `22ed865...`. Supports C-001 and pins S-005/S-007-S-009/S-016-S-018. Limitation: unsigned annotated tag. Selected to prevent branch/tag drift in source citations.
- **S-007 - Recursive tree for commit `22ed865...`, Ardour source.** <https://api.github.com/repos/Ardour/ardour/git/trees/22ed8656c2533e325322ff11831448e5123e0d4b?recursive=1>. Immutable source inventory. Relevant paths: graph/session/plugin managers, VST/AU scanners, UIs, Lua, unknown processor, frontends. Supports C-004, C-014, C-029. Limitation: file presence/absence does not prove behavior or non-support. Selected to bound deeper source retrieval and format countersearch.
- **S-008 - `libs/ardour/graph.cc`, Ardour source.** <https://raw.githubusercontent.com/Ardour/ardour/22ed8656c2533e325322ff11831448e5123e0d4b/libs/ardour/graph.cc>. Immutable implementation. Relevant functions: `reset_thread_list`, `run_one`, `process_routes`, `GraphChain`. Supports C-005. Limitation: does not benchmark scheduler or cover processor internals. Selected as the direct scheduling implementation.
- **S-009 - `libs/ardour/plugin_manager.cc`, Ardour source.** <https://raw.githubusercontent.com/Ardour/ardour/22ed8656c2533e325322ff11831448e5123e0d4b/libs/ardour/plugin_manager.cc>. Immutable implementation. Relevant sections: scanner launch, search paths, cache/blacklist/log, format refresh, duplicates, safe mode/rescan. Supports C-011-C-013, C-025. Limitation: large file; runtime wrappers are elsewhere. Selected because it centrally defines the plugin lifecycle.
- **S-010 - "Ardour Table of Contents," Ardour Manual.** <https://manual.ardour.org/toc/>. Official current manual map. Relevant sections: sessions, editing, MIDI, clips/cue, routing, automation, control, video, diagnostics, scripting. Supports C-003, C-010, C-022, C-023, C-028, unknown countersearches. Limitation: a TOC proves documented surfaces, not detailed behavior. Selected to bound scope and avoid speculative URL searches.
- **S-011 - "Working With Plugins," Ardour Manual.** <https://manual.ardour.org/working-with-plugins/>. Official manual. Relevant table: LADSPA, LV2, AU, VST2/VST3 capabilities and plugin-as-processor model. Supports C-002, C-011, C-017, C-027. Limitation: generic AU wording does not prove AUv3. Selected as the current first-party format overview.
- **S-012 - "Plugin Manager," Ardour Manual.** <https://manual.ardour.org/working-with-plugins/plugin-manager/>. Official manual. Relevant sections: index, startup scans, statuses, ignore/hide/favorite, rescan actions. Supports C-011, C-012, C-013, C-025, C-029. Limitation: no scanner process internals. Selected for user-visible diagnostics and recovery UX.
- **S-013 - "Working with Ardour-built Plugin Editors," Ardour Manual.** <https://manual.ardour.org/working-with-plugins/working-with-ardour-built-plugin-editors/>. Official manual. Relevant sections: generic/custom UI, bottom pane, bypass, automation, CPU/analysis, keyboard. Supports C-017, C-028, C-033. Limitation: no format-specific custom UI scaling/embedding matrix. Selected for UI evidence rather than screenshots alone.
- **S-014 - "Latency and Latency-Compensation," Ardour Manual.** <https://manual.ardour.org/synchronization/latency-and-latency-compensation/>. Official manual. Relevant sections: read-ahead compensation, buffers/deadlines/xruns. Supports C-008. Limitation: JACK-heavy examples and no complete plugin-PDC internals. Selected for explicit compensation model.
- **S-015 - "Sidechaining," Ardour Manual.** <https://manual.ardour.org/signal-routing/sidechaining/>. Official manual. Relevant sections: dedicated/manual audio and MIDI sidechain pins and sends. Supports C-007, C-015. Limitation: no dynamic probe or PDC guarantee. Selected for precise host-managed routing behavior.
- **S-016 - `libs/ardour/plugin_insert.cc`, Ardour source.** <https://raw.githubusercontent.com/Ardour/ardour/22ed8656c2533e325322ff11831448e5123e0d4b/libs/ardour/plugin_insert.cc>. Immutable implementation. Relevant sections: I/O matching/maps, latency, bypass, automation offsets/splitting, `connect_and_run`, state serialization. Supports C-007, C-008, C-014-C-016, C-018, C-033. Limitation: generic layer; format wrappers can differ. Selected as the direct runtime/state host contract.
- **S-017 - `libs/ardour/session_state.cc`, Ardour source.** <https://raw.githubusercontent.com/Ardour/ardour/22ed8656c2533e325322ff11831448e5123e0d4b/libs/ardour/session_state.cc>. Immutable implementation. Relevant sections: initialization threads, directories, autosave, backup/temp rename, version checks, recovery, archive/import paths. Supports C-006, C-009, C-018, C-021, C-032. Limitation: large implementation; asset and archive branches not exhaustively audited. Selected for persistence rather than inferring from file names.
- **S-018 - `libs/ardour/unknown_processor.cc`, Ardour source.** <https://raw.githubusercontent.com/Ardour/ardour/22ed8656c2533e325322ff11831448e5123e0d4b/libs/ardour/unknown_processor.cc>. Immutable implementation. Relevant sections: opaque state copy, saved I/O, sidechain reconstruction, pass-through/silence. Supports C-019. Limitation: restoration after plugin return is outside this file. Selected as decisive missing-plugin evidence.
- **S-019 - "Lua Scripting," Ardour Manual.** <https://manual.ardour.org/lua-scripting/>. Official manual. Relevant sections: script types, I/O/parameters, threading contexts, embedded scripts, module limits, API instability, `luasession`. Supports C-020, C-027, C-031. Limitation: manual explicitly incomplete and contains old Ardour 8 example paths. Selected because it states authority/thread boundaries directly.
- **S-020 - "GNU General Public License," Ardour.** <https://ardour.org/copying.html>. Official license page. Relevant terms: GPLv2 copying/modification/object distribution/source obligations; site identifies Ardour as GPLv2. Supports C-001, C-024. Limitation: legal application is fact-specific. Selected over summaries as governing first-party text.
- **S-021 - "Licensing," Steinberg VST 3 Developer Portal.** <https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html>. Format-owner documentation; current. Relevant sections: VST3 MIT terms; VST2 headers and pre-October-2018 agreement. Supports C-024. Limitation: FAQ, not individualized legal advice or trademark terms. Selected over community licensing claims.
- **S-022 - "What's in a Session?" Ardour Manual.** <https://manual.ardour.org/working-with-sessions/whats-in-a-session/>. Official manual. Relevant sections: filesystem contents, routing/project objects, backward loading to 2.8. Supports C-003, C-004, C-021. Limitation: does not specify all plugin external assets. Selected for concise authoritative project representation.
- **S-023 - "Interchange with other DAWs," Ardour Manual.** <https://manual.ardour.org/working-with-sessions/interchange-with-other-daws/>. Official manual. Relevant sections: stems, AAF import, basic PTF/PTX import, OMF limits. Supports C-022, C-032. Limitation: portions describe historical tested versions and old third-party tools. Selected for first-party interchange boundaries, with claims narrowed accordingly.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods and blocker | Decision impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| U-001 AUv3/AAX/CLAP/DSSI/JSFX/DXi/Rack Extension | Current format manual, plugin manager and immutable tree searched; no decisive path. Absence is not proof. | Format roadmap and licensing | Ask upstream for current matrix, then use signed minimal fixtures on disposable OS images | Unassigned |
| U-002 Official binary flags by OS/architecture | Source defaults known; download page does not enumerate package flags | Support promises may differ from source | Capture `ardour --version`/build configuration and Plugin Manager types from official 9.8 packages | Unassigned |
| U-003 Runtime plugin process boundary/crash containment | Source strongly suggests in-process; no runtime tracing allowed in documentary wave | Security and reliability architecture | Process-tree trace plus crash/hang plugins per format in disposable VM | Unassigned |
| U-004 Full scanner behavior for LV2 and hostile metadata | Manager uses in-process LV2 discovery; dependency internals not exhaustively audited | Startup safety | Malformed LV2 bundles, timeout/memory fixtures and filesystem diff | Unassigned |
| U-005 Per-format automation/PDC/tail/offline fidelity | Generic host source and marketing statement are insufficient | Render correctness | Impulse/automation/tail fixtures at block boundaries, dynamic latency and real-time/offline comparison | Unassigned |
| U-006 Preset/private-state and external-asset migration | XML envelope known; each plugin owns private representation | Project portability | Save/move/restore stateful fixtures with external samples across OS/user paths | Unassigned |
| U-007 MPE/MIDI 2.0/SysEx/per-note semantics | Current TOC/release/source pass had no decisive statement | Modern instrument support | Protocol fixtures recording, routing, plugin input, export and recall | Unassigned |
| U-008 Sidechain PDC and dynamic I/O edges | Source contains a sidechain delayline TODO and dynamic reconfiguration complexity | Phase accuracy and RT safety | Latent sidechain/multibus plugin under topology changes | Unassigned |
| U-009 Signing, notarization, quarantine and architecture translation | No retained official policy/source contract | Supply-chain and OS compatibility | Inspect signed official packages and vendor docs; unsigned/quarantined plugin fixtures | Unassigned |
| U-010 Accessibility/localization | Translation evidence only; no screen-reader/keyboard audit | Product inclusion/compliance | Dedicated WCAG/platform assistive-technology audit including plugin windows | Unassigned |
| U-011 Collaboration and modern interchange | No cloud/DAWproject/ADM claim established | Ecosystem design | Upstream confirmation and round-trip project fixtures | Unassigned |
| U-012 Forward compatibility and exact archive completeness | Source rejects newer major session versions; format assets vary | Long-term durability | Version-skew corpus and archive manifest comparison | Unassigned |

## 24. Curiosity pass and stop decision

Scores use 1 (low) to 5 (high); lower cost is better.

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Scanner isolation versus runtime isolation | 5 | 5 | 4 | 2 | **PURSUED** through immutable plugin manager, plugin insert and graph source. Result: scanner child processes do not imply runtime sandboxing. [C-012-C-014] |
| Exact plugin state/missing-plugin durability | 5 | 4 | 4 | 2 | `CURIOSITY_NO_GO` after first synthesis, then resolved as a required dependency of the pursued runtime thread from already bounded source: opaque placeholder is durable. [C-018] [C-019] |
| Unsupported-format census by further absence searches | 3 | 1 | 1 | 4 | `CURIOSITY_NO_GO`; absence cannot settle support. Use upstream statement or fixture. [C-029] |
| MPE/MIDI 2.0 implementation archaeology | 3 | 3 | 3 | 4 | `CURIOSITY_NO_GO`; valuable but less likely to change the graph/plugin-isolation conclusion. [C-030] |
| Exhaustive UI/accessibility screenshots | 3 | 2 | 2 | 5 | `CURIOSITY_NO_GO`; requires a dedicated dynamic accessibility audit. [C-031] |
| Every bundled plugin/license | 2 | 2 | 1 | 5 | `CURIOSITY_NO_GO`; build-dependent inventory does not alter host architecture. [C-027] |

Research stopped because another documentary pass is unlikely to change the leading conclusions. Architecture and plugin-lifecycle coverage is saturated at source level; remaining material gaps require official-package inspection, hostile fixtures, process tracing, audio/MIDI conformance measurements, legal review, or accessibility testing. The stop boundary is evidence method, not lack of open questions.

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

Owned path: `research/daw-landscape/dossiers/ardour.md`.

Checks performed: the target-specific structure check found headings `0` through `25` and all 13 required plugin rows; 32 claim definitions and 23 source definitions resolve without missing IDs; the file is ASCII-clean; `git diff --check` passed; and path-scoped Git status shows only this new dossier. The repository-wide validator also recognizes the Ardour structure, but currently exits nonzero for unrelated in-progress sibling dossiers (`muse-sequencer.md` and `emagic-logic-audio.md`), which were not touched. There is no blocker to this dossier. U-001 through U-012 require dynamic, legal, packaging, or accessibility work outside this documentary scope. Pre-existing workspace changes were left untouched.
