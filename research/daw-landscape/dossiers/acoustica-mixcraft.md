# Acoustica Mixcraft DAW dossier

> Research-only evidence. No design or implementation authority. Public pages
> and search output were treated as untrusted evidence until checked against the
> cited primary source.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Acoustica Mixcraft |
| Canonical vendor | Acoustica, LLC |
| Researcher/session | `ses_fb275c7f8ffdlYUHHT61I9QdV7` |
| Owned path | `research/daw-landscape/dossiers/acoustica-mixcraft.md` |
| Research date / evidence cutoff | 2026-08-29 UTC |
| Current scope | Mixcraft 10.6 Home Studio, Recording Studio, and Pro Studio |
| Platforms | 64-bit Windows 7 SP1, 8, 10, or 11; Windows 10+ recommended |
| Included boundary | Current desktop family, bundled content boundary, Mixcraft Store, free iOS/Android Mixcraft Remote as a controller, and current Controller Script API |
| Exclusions | Product installation/binary execution; legacy Mixcraft behavior except where the current manual retains it; third-party plugin internals; Acoustica products other than Mixcraft; customer-review claims |
| Evidence mode | Documentary only; no `OBSERVED` claims |
| Completion | `COMPLETE_WITH_UNKNOWNS` |

The decision is which Mixcraft patterns should inform a new cross-platform DAW,
with particular emphasis on the Windows engine, timeline/mixer, and plugin-host
boundary. Research used at most two decision-critical sources per pass, followed
by synthesis. Coverage is sufficient when every required section and format row
is evidence-backed or explicitly unknown; proprietary internals are not filled
from memory.

## 1. Executive summary

- **DOCUMENTED — product headline.** Mixcraft 10.6 is a maintained, Windows-only
  family with a 16-track Home edition, unlimited-track Recording/Pro editions,
  a linear audio/MIDI timeline, one shared clip-launching Performance Panel, a
  one-video-track editing surface, and score/step/piano-roll MIDI views.
  [C-001, C-002, C-003, C-017]
- **DOCUMENTED — mixer/engine headline.** Public controls expose WaveRT, ASIO,
  and Wave back ends, high-priority audio-mixing threads, track-correlated mixer
  channels, sends/submixes/output buses, plugin multi-output child tracks,
  three sidechain tap positions, and automatic plugin delay compensation across
  all mixer channels, including sidechains and instrument-output sends.
  [C-005, C-006, C-007, C-013]
- **DOCUMENTED — plugin headline.** Current primary documentation establishes
  Windows VST2/VSTi and VST3 effect/instrument hosting. Mixcraft 10 is 64-bit but
  loads 32-bit plugins in a shell; a problematic 64-bit VST2 can optionally run
  in a separate-process Safe Mode. The manager exposes bitness/type/output count,
  enabled/disabled, recently-crashed, and unable-to-load views. [C-018, C-020,
  C-021, C-022, C-023]
- **UNKNOWN — plugin limits.** Current AUv2/AUv3, AAX, CLAP, LV2, LADSPA, DSSI,
  JSFX, DirectX/DXi, and Rack Extension hosting is not established. Neither are
  default process placement, VST3 isolation, scan-cache/duplicate identity,
  automatic quarantine, sample-accurate automation, dynamic I/O, state-chunk
  representation, plugin tails, or missing-plugin placeholders. [C-019, C-024,
  C-027]
- **DOCUMENTED — durability/interchange.** Backups on save, interval autosave,
  project/media collection to folder or ZIP, MIDI Type 1 export, bar-one-aligned
  stem export, and common audio/video delivery are documented. Semantic session
  interchange and collaboration are not. [C-028, C-029]

**Recommendation.** Treat Mixcraft as a useful public reference for an
approachable hybrid timeline/launcher model, user-visible plugin diagnostics,
explicit sidechain taps, multi-output child channels, and opt-in failure
containment. Do not use it as evidence for proprietary scheduling/storage
internals or a complete VST contract. Prototype plugin identity/state/failure
behavior independently, prefer current VST3 licensing, and do not assume a new
VST2 implementation is licensable. [C-008, C-024, C-027, C-032]

**Confidence:** high for current identity, editions, workflow, and named UI
contracts; medium for the breadth of VST behavior because evidence is vendor
documentation rather than qualification; low for undisclosed internals and
non-VST status.

## 2. Product identity, history, and market position

- **DOCUMENTED.** Acoustica identifies Mixcraft 10.6 as its current Windows DAW,
  says the first Mixcraft release was in 2004, and positions it for beginners and
  professionals across recording, loop composition, MIDI, mixing, video, and
  live clip playback. [C-001, C-002]
- **DOCUMENTED.** The current family is Home Studio, Recording Studio, and Pro
  Studio. Home is capped at 16 tracks and eight Performance Panel sets;
  Recording/Pro have unlimited tracks. Pro alone adds stem separation, Track
  Regions, advanced audio/MIDI output recording and routing, integrated
  Melodyne, and audio-to-MIDI. [C-003]
- **DOCUMENTED.** The minimum platform is 64-bit Windows 7 SP1/8/10/11; Windows
  10+, 8 GB RAM, a quad-core CPU, and ASIO hardware are recommended. Melodyne
  requires Windows 10+, and stem separation requires AVX. [C-001, C-033]

## 3. Workflow and conceptual model

- **DOCUMENTED.** The primary model is a project with a horizontal linear
  timeline of typed tracks and audio/MIDI clips. Track and clip controls feed a
  mixer in which each ordinary track has a corresponding channel. [C-004,
  C-005]
- **DOCUMENTED.** One Performance Panel can coexist with the timeline. It is a
  track-by-set grid for audio/MIDI clips, allows one playing clip per track, and
  reuses normal track volume/pan/mute/solo. [C-004]
- **DOCUMENTED.** One video track can hold video, stills, and text. Pro Track
  Regions provide arrangement-level selection/move/copy of clips and automation.
  [C-003, C-017]
- **INFERENCE.** Reusing the same track/mixer objects for timeline and launched
  clips reduces duplicated routing concepts. Assumption: the documented shared
  controls reflect shared user objects; a plausible alternative is separate
  internal playback paths hidden behind one UI. [C-004, C-008]

## 4. Publicly documented architecture

- **DOCUMENTED.** Mixcraft 10 is a native 64-bit Windows application. The manual
  exposes audio-engine thread priority, driver selection, mixer/channel objects,
  VST scan settings, a 32-bit plugin shell, and separate-process Safe Mode for
  64-bit VST2. [C-006, C-023]
- **DOCUMENTED.** The user-visible audio graph contains ordinary audio and
  instrument tracks, submix parents/children, send tracks, output buses,
  multi-output instrument children, preview, and master. [C-005]
- **UNKNOWN.** Source language, core frameworks, internal graph representation,
  task scheduler, lock/memory model, worker topology, SIMD, mix precision,
  render graph, undo journal, project schema, plugin IPC, and crash supervisor
  are proprietary or not publicly documented in retrieved primary sources.
  A later clean Windows harness—not reverse engineering—is the discriminating
  method for behavioral questions. [C-008]

## 5. Audio engine

- **DOCUMENTED.** User-selectable Windows paths are WaveRT (called “Core Audio
  (Wave RT)” in the manual, not Apple Core Audio), ASIO, and legacy Wave. WaveRT
  offers exclusive mode; ASIO selects one device; Wave exposes buffer count and
  size. The engine can run audio-mixing threads at high system priority.
  [C-006]
- **DOCUMENTED.** The UI allows device-supported rates up to 192 kHz; the Wave
  path documents up to 24-bit recording. Lower buffers/latency trade responsiveness
  against gaps/clicks. A CPU meter, display throttling, and track freeze are
  troubleshooting controls. [C-006, C-033]
- **DOCUMENTED.** Mixer Delay Compensation automatically covers plugin and
  instrument latency on all mixer channels, explicitly including instrument
  output sends and sidechains. This depends on correct plugin reporting.
  [C-007]
- **DOCUMENTED.** Mixdown can clear residual plugin audio buffers, and an option
  validates every plugin output sample to prevent invalid values from breaking
  later processing, at a CPU cost. [C-020]
- **UNKNOWN.** Internal floating-point precision, maximum channel layout,
  multicore dependency scheduling, real-time/offline code-path equivalence,
  dynamic latency updates, plugin-tail treatment, oversampling, dropout policy,
  and deterministic rendering are not documented. [C-008, C-024]

## 6. Tracks, timeline, clips, and editing

- **DOCUMENTED.** Visible track types include audio, virtual instrument/MIDI,
  video/text, send, submix, output bus, master, vocoder, and multi-output
  instrument child tracks. [C-005]
- **DOCUMENTED.** Audio clips reference imported or recorded WAV/AIF/MP3/OGG/WMA
  media and support non-destructive left/right selection, polarity, normalization,
  reverse, overlap crossfades, and FlexAudio edge-drag time stretching. An
  external editor can intentionally change an original destructively or work on
  a copy. [C-009]
- **DOCUMENTED.** Projects support time or beat rulers, snap, project tempo/key,
  tempo automation, loop/punch regions, clip/automation copy-paste, and Pro-only
  Track Regions. [C-003, C-009, C-014]
- **UNKNOWN.** Ripple modes, edit groups beyond linked tracks, playlists,
  take-group identity, swipe comping, clip versioning, and persistent edit
  history are not established. [C-010, C-028]

## 7. MIDI, sequencing, notation, and expression

- **DOCUMENTED.** Instrument clips carry 16-channel MIDI note, velocity,
  pitch-bend, and controller data; the product exposes piano-roll, step, and score
  editors, step recording, quantization-oriented editing, external MIDI outputs,
  channel routing to multitimbral instruments, and Standard MIDI File Type 1
  export. [C-003, C-011, C-029]
- **DOCUMENTED.** “High Precision MIDI Timing” is described as improving record
  timestamps from about ±1 ms to ±0.1 ms. Mixcraft can transmit MIDI clock and
  status messages to selected output ports/channels. [C-011]
- **DOCUMENTED.** Pro can pass MIDI output from a generator plugin to the next
  instrument and route/record advanced MIDI/audio outputs. Effects can receive
  MIDI from a selected track. [C-025]
- **UNKNOWN.** MPE/per-note expression, MIDI 2.0/UMP, SysEx recording/editing,
  MIDI input-clock slave, MTC, sample-accurate plugin event delivery, and
  expression persistence are not documented. [C-012]

## 8. Routing, mixer, automation, and control

- **DOCUMENTED.** Track and mixer channels correlate one-to-one; send, output
  bus, preview, and master channels are grouped on the mixer’s right. Submix and
  multi-output parents own child channels. Channel strips expose fader, pan, EQ,
  inserts, arm/solo/mute, and optional sends/instrument controls. [C-005]
- **DOCUMENTED.** Sidechain-capable VST effects can select an audio or SubMix
  source at **Dry** (before source level/EQ/inserts), **Pre-Fader** (after EQ and
  inserts), or **Post-Fader** (also after fader). Inserts process top-to-bottom.
  [C-013]
- **DOCUMENTED.** Recording/Pro expose volume, pan, sends, tempo, and all
  host-reported plugin/instrument parameters in independent automation lanes;
  curves may be linear/logarithmic/exponential and can be edited, copied,
  controller-recorded, or shown/hidden without disabling playback. Home limits
  curved automation to volume/pan and lacks plugin parameter automation.
  [C-003, C-014]
- **DOCUMENTED.** Native control boundaries include generic MIDI mapping,
  Mackie Control/compatible surfaces, linked/cascaded surfaces, selected
  controller integrations, the free networked Mixcraft Remote, and JavaScript
  controller scripts. [C-030]
- **UNKNOWN.** Feedback-routing rules, VCA objects, surround/immersive channel
  layouts, OSC, EuCon, automation thinning/gesture semantics, and stable plugin
  parameter identity are not documented. [C-015, C-034]

## 9. Recording, comping, and media handling

- **DOCUMENTED.** Mixcraft can record several hardware devices/inputs
  simultaneously, monitor through the engine, and monitor inserts while recording
  dry. Pro “Record Effect/Source” can instead record plugin output. [C-010,
  C-025]
- **DOCUMENTED.** Per-track Takes, Overdub, and Replace modes combine with loop
  and punch recording. Takes/Overdub create lanes; Takes mutes earlier passes;
  punch only mutes the replaced time range. [C-010]
- **DOCUMENTED.** New audio can be WAV, OGG, or FLAC by preference; current clip
  import documentation names WAV/AIF/MP3/OGG/WMA. Project collection can gather
  used sounds, video, and recordings into a folder or ZIP. [C-009, C-028]
- **UNKNOWN.** Swipe comping, proxy/conform workflows, BWF/iXML metadata,
  arbitrary plugin-owned sample collection, and automatic missing-media relink
  algorithms are not documented. [C-027, C-028]

## 10. Instruments, effects, content, and native devices

- **DOCUMENTED.** All current editions advertise more than 7,500 loops, sound
  effects, and samples; Recording includes 16 instruments/36 effects and Pro
  advertises 24 instruments/more than 50 effects. The comparison page itemizes
  Acoustica instruments/samplers plus third-party bundles; Pro adds Melodyne,
  Cherry Audio instruments/effects, Voltage Modular Ignite, Pianissimo, and
  further processors. [C-016]
- **DOCUMENTED.** Effects form ordered chains with host bypass and chain presets.
  Instrument presets can layer instruments/effects, split key/velocity ranges,
  transpose, pan, set volume, and expose outputs. Shareable `.instrument` presets
  require the same dependent VSTi/synths. [C-026]
- **DOCUMENTED.** The integrated Store distributes additional instruments,
  effects, loops, presets, kits, templates, scripts, and other content; some
  products require internet/account access. [C-016, C-031]
- **UNKNOWN.** No public native DSP/device SDK or documented native device ABI
  was found. “Internal Mixcraft plug-in” is a manager category, not an authoring
  contract. [C-018, C-030]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` in non-Windows columns means the current Mixcraft DAW host is
not published for that platform; the iOS/Android Remote controls the Windows DAW
and is not a plugin host. `UNKNOWN` on Windows means targeted current official
manual/product/site searches found no explicit support or rejection statement;
absence is not treated as proof. [C-001, C-019]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE: no current macOS host | DOCUMENTED | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: Remote is control-only | Mixcraft 10.6 family; manager is in Home/Recording/Pro | VST effects/VSTi; 32/64-bit; 64-bit VST2 has optional separate-process Safe Mode | C-003, C-018, C-023; S-002–S-005 |
| VST3 | NOT_APPLICABLE: no current macOS host | DOCUMENTED | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: Remote is control-only | Mixcraft 10.6 family; manager is in Home/Recording/Pro | Effects and instruments; no VST3 Safe Mode documented | C-003, C-018, C-024; S-002–S-006 |
| AUv2 | NOT_APPLICABLE: no current macOS host | UNKNOWN | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: no Mixcraft mobile/web DAW host | Current official search did not resolve | No Windows AU host statement found | C-019; S-022 |
| AUv3 | NOT_APPLICABLE: no current macOS host | UNKNOWN | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: no Mixcraft mobile/web DAW host | Current official search did not resolve | Remote app is not AUv3 hosting evidence | C-019, C-030; S-001, S-022 |
| AAX | NOT_APPLICABLE: no current macOS host | UNKNOWN | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: no Mixcraft mobile/web DAW host | Current official search did not resolve | No AAX host statement found | C-019; S-022 |
| CLAP | NOT_APPLICABLE: no current macOS host | UNKNOWN | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: no Mixcraft mobile/web DAW host | Current official search did not resolve | No CLAP host statement found | C-019; S-022 |
| LV2 | NOT_APPLICABLE: no current macOS host | UNKNOWN | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: no Mixcraft mobile/web DAW host | Current official search did not resolve | No LV2 host statement found | C-019; S-022 |
| LADSPA | NOT_APPLICABLE: no current macOS host | UNKNOWN | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: no Mixcraft mobile/web DAW host | Current official search did not resolve | No LADSPA host statement found | C-019; S-022 |
| DSSI | NOT_APPLICABLE: no current macOS host | UNKNOWN | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: no Mixcraft mobile/web DAW host | Current official search did not resolve | No DSSI host statement found | C-019; S-022 |
| JSFX | NOT_APPLICABLE: no current macOS host | UNKNOWN | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: no Mixcraft mobile/web DAW host | Current official search did not resolve | No JSFX host statement found | C-019; S-022 |
| DirectX/DXi | NOT_APPLICABLE: no current macOS host | UNKNOWN | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: no Mixcraft mobile/web DAW host | Current official search did not resolve | Current “DirectX” manual references are video codec/DirectShow-related, not audio plugin hosting | C-019; S-007, S-020, S-022 |
| Rack Extension | NOT_APPLICABLE: no current macOS host | UNKNOWN | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: no Mixcraft mobile/web DAW host | Current official search did not resolve | No Rack Extension host statement found | C-019; S-022 |
| Product-native/other | NOT_APPLICABLE: no current macOS host | DOCUMENTED: internal Mixcraft plugins; ReWire host in Recording/Pro | NOT_APPLICABLE: no current Linux host | NOT_APPLICABLE: no Mixcraft mobile/web DAW host | Mixcraft 10.6; ReWire excluded from Home | “Internal Mixcraft plug-in” manager type and ReWire devices; neither is a public native plugin SDK | C-003, C-018, C-030; S-002, S-003, S-005, S-006 |

### 11.2 Discovery, scanning, validation, and recovery

- **DOCUMENTED.** Mixcraft can load VST/VST3 at launch, scan configured VST/VSTi
  folders, re-scan all VSTs, auto-search for candidate VST directories, or accept
  a dragged VST2 DLL and copy/install it while adding its directory to the search
  path. [C-020]
- **DOCUMENTED.** The manager records type, manufacturer, bitness, status, last
  use, output count, category, and description; categories include Recently Used,
  Recently Crashed, Disabled, Effects, Instruments, and Unable to Load. Users can
  enable/disable/rename entries and make collections. [C-021]
- **DOCUMENTED.** `%programdata%\Acoustica\Mixcraft\VSTIgnore.ini` can exclude a
  named DLL at restart. The manual says “two files” can exclude plugins but names
  only this one; the second is unknown. [C-022]
- **UNKNOWN.** Fixed VST3 locations, cache file/schema/invalidation, duplicate
  identity and shell sub-plugin identity, scan-process isolation, timeout,
  cryptographic validation, automatic blacklist/quarantine policy, and automatic
  rescan after update are not documented. Recently Crashed is a diagnostic view,
  not proof of automatic quarantine. [C-024]

### 11.3 Runtime isolation and compatibility

- **DOCUMENTED.** Mixcraft 10 is native 64-bit; older 32-bit effects/instruments
  load automatically in a “shell.” Acoustica warns they may be less stable.
  [C-023]
- **DOCUMENTED.** A 64-bit VST2 may be manually set to `Enabled (Safe Mode)`,
  which runs it in a separate process so it cannot corrupt Mixcraft memory.
  [C-023]
- **UNKNOWN.** Default VST2/VST3 process placement, per-instance/per-plugin/shared
  helper topology, shell IPC, helper restart, crash-state checkpointing, VST3
  isolation, 32-bit shell crash scope, architecture bridge limits, code-signing
  checks, and compatibility modes are not documented. [C-024]
- **DOCUMENTED WITH LIMIT.** “Validate All Output Samples” guards downstream DSP
  against invalid numeric plugin output; it is not plugin-format validation or
  malware isolation. [C-020]

### 11.4 Host/plugin processing contract

- **DOCUMENTED.** Effects may receive MIDI from a selected track; sidechain-aware
  VST effects receive a chosen Dry/Pre/Post audio source; instruments can expose
  multiple audio outputs and multitimbral channels; Pro can route plugin MIDI
  output to another instrument and record effect/instrument output. [C-013,
  C-025]
- **DOCUMENTED.** Host PDC is claimed across every mixer channel, sidechain, and
  instrument-output send when plugin latency is correctly reported. [C-007]
- **UNKNOWN.** Maximum bus/channel counts, event buses, note expression, MIDI 2.0,
  sample-accurate automation/events, dynamic I/O changes, latency-change
  notification, tail reporting, suspend semantics, offline callbacks, denormal
  policy, and bypass type are not documented. [C-012, C-015, C-024]

### 11.5 Parameters, automation, state, presets, and project recall

- **DOCUMENTED.** Recording/Pro list all host-reported plugin/instrument
  parameters for lane automation and can record/edit curves. Home lacks plugin
  parameter automation. [C-003, C-014]
- **DOCUMENTED.** Host UI offers active/bypass, factory/user preset selection,
  user preset save/delete, `.fxb` bank loading, chain presets, and layered
  `.instrument` presets. [C-026]
- **UNKNOWN.** Stable parameter IDs, normalized ranges/display text, automation
  precision, plugin state-chunk serialization, preset migration, external asset
  references, missing-plugin placeholders, state retained while missing, VST2 ↔
  VST3 migration, and recovery after helper failure are not documented.
  [C-015, C-027]

### 11.6 UI, diagnostics, and failure modes

- **DOCUMENTED.** Plugin editor windows can be shown/hidden, several may remain
  open, and Mixcraft supplies a host header with active control, preset controls,
  assignments, and stereo meter. Per-plugin auto-scale can follow Windows monitor
  scale at some sharpness/compatibility cost. [C-026]
- **DOCUMENTED.** Users can inspect Recently Crashed/Unable to Load/Disabled,
  enable troubleshooting logging during playback, show/clear/ZIP/upload logs,
  bypass suspected plugins, enable VST2 Safe Mode, re-scan, or ignore a DLL.
  [C-021, C-022, C-023, C-033]
- **UNKNOWN.** Headless operation, generic editor fallback, native-vs-generic UI
  selection, DPI negotiation beyond bitmap scaling, crash dumps/symbolication,
  scan progress details, actionable error codes, and missing-plugin UI are not
  documented. [C-024, C-027]

## 12. Extensibility and integration

- **DOCUMENTED.** Mixcraft 10 exposes a JavaScript Controller Script API for MIDI
  hardware workflows, with an integrated editor, MIDI monitor, and console log.
  All editions list the API and custom hotkeys. [C-003, C-030]
- **DOCUMENTED.** Generic MIDI learn/control, Mackie Control-style surfaces,
  selected scripted controllers, and Mixcraft Remote provide control integration.
  Recording/Pro also host ReWire clients. [C-003, C-030]
- **UNKNOWN.** No general project scripting API, audio-DSP SDK, public native
  device SDK, OSC/WebSocket protocol, project object model, or API stability/
  sandbox/versioning promise was found. [C-030, C-034]

## 13. Project format, persistence, interoperability, and collaboration

- **DOCUMENTED.** Saving creates a project folder with the project and associated
  audio; each save creates a backup subfolder entry. Mixcraft 10.5+ supports
  interval autosave, optionally during playback with possible interruption.
  `.mx10template` stores reusable project setup. [C-028]
- **DOCUMENTED.** “Copy Project Files To” gathers used project sounds, videos,
  and recordings into a folder or ZIP. This does not state that third-party
  plugin-owned assets are discovered. [C-028]
- **DOCUMENTED.** Interchange is MIDI Type 1 plus flattened stems/common media;
  stem files begin at bar one for deterministic alignment. [C-029]
- **UNKNOWN.** Project schema/extension, atomic save, forward/backward guarantees,
  migration rules, undo/history persistence, missing-plugin/media placeholders,
  AAF/OMF/ADM/MusicXML/DAWproject, cloud collaboration, and version-control
  semantics are not documented in retained sources. [C-027, C-028, C-029]

## 14. Delivery, live, post-production, and specialized workflows

- **DOCUMENTED.** Audio delivery covers WAV/FLAC/MP3/OGG/WMA, tagged/CD-marker
  splits, stem export in Recording/Pro, and audio-CD burning. Video delivery is
  AVI/WMV/MP4. [C-003, C-017, C-029]
- **DOCUMENTED.** Performance Panel supports live audio/MIDI clip launching and
  grid-controller use; the same clips can be used for loop-based composition.
  [C-004]
- **DOCUMENTED.** Video supports one timeline track, stills/text, transitions,
  visual-effect automation, preview, and scoring against normal audio/MIDI tracks.
  [C-017]
- **UNKNOWN.** DDP, batch queues, loudness compliance, ADR, picture conform,
  SMPTE/timecode, surround/Atmos-native beds/objects, ADM, show control, and
  redundant live playback are not established. A vendor video showing use with
  a third-party Atmos tool is not native Atmos evidence. [C-034]

## 15. Performance, reliability, security, and accessibility

- **DOCUMENTED.** Current requirements are modest but edition features impose
  constraints: 64-bit Windows, 4 GB minimum RAM, Windows 10+ for bundled
  Melodyne, and AVX for stem separation. [C-001, C-033]
- **DOCUMENTED.** Reliability controls include CPU display, adjustable latency/
  buffers, high-priority engine threads, freeze, interval autosave, save backups,
  plugin output-value validation, logs, manager crash/load categories, manual
  ignore, 32-bit shell, and opt-in 64-bit VST2 Safe Mode. [C-006, C-020–C-023,
  C-028, C-033]
- **DOCUMENTED.** Updates may install automatically, ask first, or never install;
  store ownership can be resynchronized. Internet is required for some bundled
  plugins, updates, and Store functions. [C-031, C-033]
- **UNKNOWN.** Maximum tested tracks/plugins, multicore scaling, update signing/
  rollback, installer hardening, plugin permissions, network surface of Remote,
  telemetry in the desktop app, privacy of uploaded logs, screen-reader/keyboard
  accessibility, and accessibility conformance are not established. [C-024,
  C-034]

## 16. Licensing, ecosystem, and implementation constraints

- **DOCUMENTED.** Mixcraft is commercially sold by Acoustica; the current store
  offers one-time purchase and 12-month rent-to-own. Mixcraft 10.6 is described
  as a free update to Mixcraft 10 owners. Detailed EULA terms were not available
  in the retained pages. [C-031]
- **DOCUMENTED.** The current VST3 SDK is MIT-licensed; Steinberg says commercial
  binary hosts/plugins are permitted while retaining copyright/license notices.
  VST usage guidelines are optional. [C-032]
- **DOCUMENTED.** Steinberg says VST2 SDK files must not be redistributed and only
  developers who signed the VST2 agreement before October 2018 may distribute a
  VST2 plugin/host. Mixcraft’s compatibility is not a license grant to a new DAW.
  [C-032]
- **UNKNOWN.** Mixcraft machine count, transfer, offline activation, educational
  terms, generated-output rights, bundled-loop redistribution, third-party bundle
  sublicenses, and Controller Script API license were not established. [C-031,
  C-034]
- **Clean-room constraint.** This dossier supports behavioral requirements only.
  It grants no right to copy Mixcraft UI/expression, inspect proprietary binaries,
  redistribute SDKs/content, use marks, or claim format compatibility without
  qualification. [C-008, C-032]

## 17. Strengths, liabilities, and architecture lessons

**Strengths (documented product behavior):**

1. A single approachable track model spans linear editing, mixer, live clips,
   and lightweight video. [C-004, C-005, C-017]
2. Routing is unusually explicit in public user docs: Dry/Pre/Post sidechains,
   multi-output child tracks, per-channel PDC, and Pro plugin-output recording.
   [C-007, C-013, C-025]
3. Plugin operations are visible and diagnosable through typed metadata,
   crash/load categories, ignore controls, logs, 32-bit compatibility, and
   optional VST2 process isolation. [C-020–C-023]
4. Project folders, backups/autosave, collection ZIPs, and bar-one stems provide
   practical durability and handoff. [C-028, C-029]

**Liabilities / reference limits:**

1. Windows-only product evidence does not answer cross-platform host behavior.
   [C-001]
2. Current non-VST format status and much of the deep host contract remain
   unknown; “supports VST3” is not sufficient interoperability proof. [C-019,
   C-024, C-027]
3. Safe Mode is specifically documented for 64-bit VST2, not a family-wide
   sandbox. The 32-bit shell preserves legacy compatibility but adds an old ABI
   and undocumented failure boundary. [C-023, C-024]
4. Interchange is primarily rendering/MIDI rather than semantic project exchange.
   [C-029]
5. Public architecture documentation stops at user-visible controls; it is a
   poor source for scheduler/storage implementation decisions. [C-008]

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites | Tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Timeline/live concepts diverge | Reuse one typed track/mixer channel for linear and launched clips; enforce one launched clip per track | C-004, C-005 | Shared transport/routing identity | Simpler mental model; launcher flexibility is constrained | Medium | CANDIDATE |
| Sidechain source ambiguity | Offer named Dry, Pre-Fader, and Post-Fader taps with textual signal meaning | C-013 | Explicit channel stage model, PDC | More graph edges and cycle validation | Low | CANDIDATE |
| Instrument output explosion | Represent additional instrument buses as collapsible child channels and optionally create all | C-005, C-020, C-025 | Stable bus identity and channel persistence | UI/automation migration when buses change | Medium | CANDIDATE |
| Plugin failure diagnosis | Manager states for disabled/recently crashed/unable to load plus searchable metadata and logs | C-021, C-022, C-033 | Durable scan registry and diagnostics model | Privacy, stale status, support burden | Medium | CANDIDATE |
| Risky plugin containment | Per-plugin selectable helper-process mode, clearly limited by supported format | C-023, C-024 | IPC, state checkpoint, latency/event bridge | CPU/RAM/latency and more failure modes | High; prototype rather than copy | CONDITIONAL |
| Bad numeric output poisons graph | Optional per-sample finite-value validation at trust boundaries | C-020 | Fast validation and diagnostics | CPU cost; may mask plugin bugs | Low | CANDIDATE |
| Cross-DAW handoff loses placement | Export selected tracks from bar one with silence and choices for FX/automation/pan/fader | C-029 | Offline render and naming policy | Large files; loses semantic edits | Low | CANDIDATE |
| User preset portability | Store host-level layered instrument/effect presets with explicit dependency requirements | C-026 | Stable plugin identity/state | Missing-dependency and migration complexity | Medium | CONDITIONAL |

These are behavioral abstractions only; no Mixcraft code, assets, protected prose,
or private schema is proposed for copying.

## 19. Rejected patterns and CURIOSITY_NO_GO

| Pattern/thread | Evidence / decision rationale | Reopen condition | Decision |
| --- | --- | --- | --- |
| Ship a new VST2 host because Mixcraft does | Steinberg restricts distribution to pre-Oct-2018 licensees; legacy value does not outweigh legal/ABI risk [C-032] | Qualified counsel plus demonstrable existing license | `CURIOSITY_NO_GO` |
| Treat Safe Mode as universal sandbox | Manual limits it to selectable 64-bit VST2; VST3/default process behavior unknown [C-023, C-024] | Current primary source or dynamic process probe | `CURIOSITY_NO_GO` |
| Infer DirectX audio hosting from DirectX text | Current references are video decoder/codec paths [C-019] | Explicit current Acoustica audio-plugin statement | `CURIOSITY_NO_GO` |
| Infer unsupported formats from manual silence | Contract forbids absence-as-proof; official search produced no explicit matrix [C-019] | Vendor matrix or clean fixture probe | `CURIOSITY_NO_GO` |
| Reverse engineer project/cache/helper binaries | Outside public clean-room authority and unnecessary in documentary wave [C-008, C-024, C-027] | Never under this research contract | `CURIOSITY_NO_GO` |
| Exhaustively inventory every bundled preset/loop | Edition counts and architecture-relevant boundaries are already documented [C-016] | Content packaging becomes a decision gate | `CURIOSITY_NO_GO` |
| OCR/reconstruct the signal-flow image | Textual sidechain/mixer sources already resolve decision-critical taps; image retrieval did not expose labels | Accessible official text or alt description | `CURIOSITY_NO_GO` |
| Deep-audit controller API methods | It cannot change the plugin/engine conclusion in this wave [C-030] | Controller API becomes an implementation candidate | `CURIOSITY_NO_GO` |

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test / counterevidence | Result |
| --- | --- | --- |
| H1: Current Mixcraft is cross-platform | Current product/system requirements and all current editions | **FAILED:** current DAW is Windows-only [C-001] |
| H2: “VST3 support” establishes full host interoperability | Compared format statements with manager, sidechain, PDC, I/O, automation, state, and failure docs | **FAILED:** format acceptance is documented; many contract dimensions remain unknown [C-018, C-024, C-027] |
| H3: Safe Mode isolates every plugin | Read manager scope closely | **FAILED:** explicitly 64-bit VST2 only [C-023] |
| H4: Recently Crashed proves quarantine | Searched manager/preferences/troubleshooting for automatic disable/quarantine | **FAILED:** status category exists; policy/action is unknown [C-021, C-024] |
| H5: Re-scan proves a cache | Searched preferences/troubleshooting for cache representation/invalidation | **FAILED:** scanning is documented; cache is unknown [C-020, C-024] |
| H6: PDC excludes sidechains/multi-output sends | Read mixer PDC scope | **FAILED:** those paths are explicitly included [C-007] |
| H7: DirectX text establishes DirectX audio effects | Compared current DirectX passages | **FAILED:** passages concern video codecs; audio hosting remains unknown [C-019] |
| H8: Project collection guarantees plugin sample collection | Compared collection wording with plugin preset dependencies | **FAILED:** project media are named; arbitrary plugin assets are not [C-027, C-028] |

**Later safe dynamic probes (unassigned):** use disposable signed/known fixtures to
separately test (1) file discovery, (2) scan recognition, (3) instantiation, and
(4) full processing. The matrix should include VST2/VST3 effects/instruments,
32/64-bit bridge, sidechain/multi-output/event buses, parameter-ID reorder,
latency/tail/dynamic I/O, offline render, custom/generic/headless UI, state and
external assets, missing-plugin save/reopen/reinstall, deliberate scan/runtime
crash, and helper-process observation. No such probe was run here.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Mixcraft 10.6 is the current 64-bit Windows family: Home, Recording, Pro | 10.6 at cutoff | S-001, S-002, S-021 | Current product/store and system requirements agree | Vendor page; no installation probe |
| C-002 | DOCUMENTED | High | Acoustica dates Mixcraft’s initial release to 2004 and targets approachable music/video production | Family/history | S-001 | Direct vendor history/positioning | Market praise is marketing, not measurement |
| C-003 | DOCUMENTED | High | Edition gates: Home 16 tracks/8 sets; Recording/Pro unlimited; automation/routing/content features differ; Pro-only advanced tools | 10.6 editions | S-002 | Official comparison is the best edition matrix | Matrix may change after cutoff |
| C-004 | DOCUMENTED | High | Linear timeline and one Performance Panel share typed tracks; one launched clip per track | 10.x/10.6 | S-001, S-018 | Manual plus current product page | Internal playback unobserved |
| C-005 | DOCUMENTED | High | Tracks correlate to mixer channels; graph exposes sends, submixes, output buses, master, and multi-out children | 10.x | S-009 | Direct mixer description | Signal-flow diagram labels were inaccessible |
| C-006 | DOCUMENTED | High | WaveRT/ASIO/Wave, latency/buffer controls, up to 192 kHz, Wave up to 24-bit, and high-priority mix threads are exposed | 10.x Windows | S-006, S-007 | Preferences and troubleshooting | Does not establish internal mix precision |
| C-007 | DOCUMENTED | Medium | Automatic plugin delay compensation covers all mixer channels, instrument-output sends, and sidechains | Mixcraft 10 | S-009 | Direct vendor statement | Depends on plugin report; no runtime measurement |
| C-008 | UNKNOWN | High | Internal graph, scheduler, threading topology, precision, storage schema, IPC, and crash supervisor are undisclosed | Proprietary internals | S-003, S-006, S-008, S-009 | User docs expose controls, not implementation | Safest probe is behavioral harness/vendor engineering disclosure |
| C-009 | DOCUMENTED | High | Audio clips support named non-destructive edits, crossfade, reverse, and FlexAudio; external editing may be destructive | 10.x | S-014 | Direct audio-clip manual | Algorithm quality and history unknown |
| C-010 | DOCUMENTED | High | Multi-input recording, monitoring, Takes/Overdub/Replace lanes, loop, and punch are available | 10.x | S-015 | Direct recording manual | Swipe comping not stated |
| C-011 | DOCUMENTED | High | MIDI uses 16-channel note/velocity/controller/pitch-bend data; high-precision recording and MIDI clock output are documented | 10.x | S-006, S-016, S-017 | Direct manual sections | Timing is vendor-described, not measured |
| C-012 | UNKNOWN | High | MPE, MIDI 2.0, SysEx, MTC, input clock, and sample-accurate event behavior are not established | Current family | S-006, S-016, S-017 | Targeted current MIDI sources omit explicit contract | Absence is not unsupported proof |
| C-013 | DOCUMENTED | High | VST sidechains use audio/SubMix Dry, Pre-Fader, or Post-Fader taps; inserts are top-to-bottom | 10.x Recording/Pro | S-002, S-010 | Comparison gates sidechain; manual defines taps | Bus negotiation/dynamic changes unknown |
| C-014 | DOCUMENTED | High | Recording/Pro automate host-reported plugin parameters in editable lanes/curves; Home lacks plugin automation | 10.6 | S-002, S-011 | Edition matrix plus automation manual | “All parameters” is vendor-facing enumeration |
| C-015 | UNKNOWN | High | Parameter IDs/ranges/text, sample accuracy, gestures/thinning, and dynamic list migration are undocumented | Plugin automation | S-011 | UI behavior does not specify ABI semantics | Requires controlled plugin fixture |
| C-016 | DOCUMENTED | High | Family bundles 7,500+ media items and edition-specific instruments/effects; Store extends content | 10.6 | S-001, S-002, S-021 | Current comparison/store | Inventory/licensing may change |
| C-017 | DOCUMENTED | High | One video track supports common clips/stills/text/effects; audio/video render formats are named | 10.x/10.6 | S-013, S-020 | Direct video and mixdown manual | Not professional conform/timecode evidence |
| C-018 | DOCUMENTED | High | Current third-party hosting explicitly covers Windows VST2/VSTi and VST3 effects/instruments; manager also labels internal plugins | 10.x/10.6 | S-003, S-004, S-005, S-006 | Multiple current manual sections triangulate | Does not prove every plugin works |
| C-019 | UNKNOWN | High | AUv2/AUv3/AAX/CLAP/LV2/LADSPA/DSSI/JSFX/DirectX-DXi/Rack Extension status is unresolved on Windows | 10.6 | S-004, S-005, S-007, S-020, S-022 | Current sources positively name VST; official search found no explicit matrix | Silence is not unsupported proof |
| C-020 | DOCUMENTED | High | Configured folders, auto-scan/re-scan, launch loading, dragged DLL install, auto outputs, buffer reset, and output-sample validation are available | 10.x | S-004–S-007 | Preferences/effect/instrument/troubleshooting agree | Scan cache/process not described |
| C-021 | DOCUMENTED | High | Manager exposes metadata plus disabled/recently-crashed/unable-to-load and collections | 10.x; all editions manager | S-002, S-003 | Direct manager and edition matrix | Status semantics/automatic action unknown |
| C-022 | DOCUMENTED | Medium | `VSTIgnore.ini` manually excludes DLLs; manual inconsistently mentions a second file without naming it | 10.x Windows | S-007 | Exact troubleshooting passage | Second file unknown; may be stale documentation |
| C-023 | DOCUMENTED | High | 32-bit plugins load in a shell; optional Safe Mode runs 64-bit VST2 separately | Mixcraft 10 64-bit | S-003–S-005, S-007 | Effects/instruments/manager/troubleshooting agree | Helper topology and VST3 isolation unknown |
| C-024 | UNKNOWN | High | Default process placement, cache/identity, automatic quarantine, signing, helper recovery, dynamic I/O/tails, and deep diagnostics are undisclosed | Plugin runtime | S-003, S-006, S-007 | No primary contract found; site search saturated | Requires vendor confirmation and clean fixtures |
| C-025 | DOCUMENTED | High | Effects accept track MIDI; instruments expose multi-outs/channels; Pro routes plugin MIDI and records plugin outputs | 10.x Pro where gated | S-002, S-004, S-005 | Current manual and comparison | Event precision and bus limits unknown |
| C-026 | DOCUMENTED | High | Host UI offers show/hide, bypass, scaling, `.fxb`, user/chain presets, and layered `.instrument` presets | 10.x | S-003–S-005 | Direct hosting pages | Factory formats and state encoding unknown |
| C-027 | UNKNOWN | High | Plugin state chunks/assets, missing placeholders, migration, and missing/reinstalled recall are undocumented | Project/plugin persistence | S-005, S-012 | Presets require dependencies; project docs do not define missing behavior | Clean save/remove/reopen/reinstall probe needed |
| C-028 | DOCUMENTED | High | Project folders, save backups, interval autosave, templates, and collect-to-folder/ZIP are available | 10.5+ / 10.6 | S-006, S-012, S-021 | Current manual/store | Atomicity/schema/version compatibility unknown |
| C-029 | DOCUMENTED | High | MIDI Type 1 and bar-one stems/common audio/video provide interchange/delivery | 10.x; stems Recording/Pro | S-002, S-012, S-013 | Comparison plus manual | No semantic AAF/OMF/etc. evidence |
| C-030 | DOCUMENTED | High | JavaScript controller scripts, MIDI surfaces, Remote, hotkeys, and ReWire are integration boundaries | 10/10.6 | S-001, S-002, S-005, S-006, S-019 | Current product/manual | Not a general scripting/plugin SDK |
| C-031 | DOCUMENTED | Medium | Commercial one-time/RTO purchase exists; some plugins/updates/Store need internet; detailed EULA unavailable | 10.6 store | S-001, S-021 | Official product/store | Machine/transfer/content rights unknown |
| C-032 | DOCUMENTED | High | Current VST3 SDK is MIT; new VST2 distribution requires a pre-Oct-2018 signed license and SDK files are non-redistributable | Format-owner legal boundary | S-023 | Steinberg primary licensing FAQ | Not legal advice; trademarks/other SDKs separate |
| C-033 | DOCUMENTED | High | Requirements, freeze/CPU/logging, autosave, update choices, and manager controls are public reliability constraints | 10.6 Windows | S-001, S-003, S-006, S-007, S-015, S-021 | Multiple current primary pages | Scaling and recovery not independently tested |
| C-034 | UNKNOWN | High | Surround/immersive, post conform, app security/privacy, update signing, rollback, accessibility, and detailed license rights are unresolved | Current family | S-001, S-006, S-020, S-021 | No decision-grade primary statements retrieved | Requires vendor docs, accessibility audit, legal review |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Vendor claims establish what the vendor
documents, not independent runtime performance.

- **S-001 — “Introducing Mixcraft 10.6,” Acoustica.**
  <https://acoustica.com/products/mixcraft>. Kind: current official product page;
  scope: 10.6 family. Relevant: edition identity, Windows requirements, 2004
  lineage, headline workflow/content, Remote, internet constraints. Claims:
  C-001, C-002, C-004, C-016, C-030, C-031, C-033. Limit: promotional wording;
  “almost universal” plugin support was not used as a format claim. Selected as
  the canonical current identity page over reviews/resellers.
- **S-002 — “Mixcraft 10.6 — Compare,” Acoustica.**
  <https://acoustica.com/products/mixcraft-10-compare>. Kind: official edition
  matrix; scope: Home/Recording/Pro 10.6. Relevant: track/set caps, automation,
  sidechain, ReWire, stems, content, Pro routing/tools. Claims: C-001, C-003,
  C-013, C-014, C-016, C-021, C-025, C-029, C-030. Limit: checkmark matrix does
  not describe deep behavior. Preferred to store prose for edition differences.
- **S-003 — “Plug-In Manager,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/plug-in-manager>. Kind: official
  manual. Relevant: VST2/VST3/internal types, metadata, crash/load categories,
  disable/collections, auto-scale, 64-bit VST2 Safe Mode. Claims: C-018,
  C-021, C-023, C-026, C-033. Limit: no scan/cache implementation or VST3
  isolation. Selected as the most direct manager/isolation source.
- **S-004 — “Using Effects,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/using-effects>. Kind: official manual.
  Relevant: VST/VST3 effects, 32-bit shell, DLL/folder discovery, chains, MIDI
  input, UI, presets/`.fxb`. Claims: C-018, C-020, C-023, C-025, C-026. Limit:
  positively names formats but does not say they are the only effect formats.
- **S-005 — “Using Virtual Instruments,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/using-virtual-instruments>. Kind:
  official manual. Relevant: VSTi/VST3 described as the only third-party
  instrument formats, 32-bit shell, multi-outs/channels, layered presets,
  `.instrument` path/dependencies, Pro MIDI source/record source, ReWire/external
  MIDI. Claims: C-018, C-020, C-023, C-025–C-027, C-030. Limit: “only” is scoped
  to instruments, not effects.
- **S-006 — “Preferences,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/preferences>. Kind: official manual.
  Relevant: audio drivers/threads/rates/buffers, autosave/backups, MIDI timing,
  surfaces, VST scan/rescan/options, output validation, logs, updates. Claims:
  C-006, C-011, C-020, C-024, C-028, C-030, C-033. Limit: contains some stale
  wording (for example a Mixcraft 9 executable reference); treated narrowly.
- **S-007 — “Troubleshooting,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/troubleshooting>. Kind: official
  manual. Relevant: latency/freeze/CPU, formats, VST folders, `VSTIgnore.ini`,
  32-bit shell, DirectX video codecs, controller limits. Claims: C-006, C-019,
  C-020, C-022–C-024, C-033. Limit: says “two files” but names one; no cache
  contract. Preferred to forum posts because it is vendor documentation.
- **S-008 — “Mixcraft Audio Signal Flow,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/mixcraft-audio-signal-flow>. Kind:
  official manual image page. Relevant: confirms an official signal-flow diagram
  exists. Claim: C-008. Limit: fetched representation exposed no diagram labels;
  it was not interpreted or reconstructed. Retained to document the access gap.
- **S-009 — “Mixer Tab,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/mixer-tab>. Kind: official manual.
  Relevant: one-to-one tracks/channels, bus/child layout, channel controls, PDC
  scope. Claims: C-005, C-007, C-008. Limit: “perfect time” is vendor language;
  no measured latency data. Preferred to the inaccessible diagram for text.
- **S-010 — “Effects Sidechaining,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/effects-sidechaining>. Kind: official
  manual. Relevant: declared sidechain capability, Dry/Pre/Post definitions,
  source types, top-down inserts, UI behavior. Claims: C-013, C-025. Limit: no
  bus negotiation/dynamic-I/O details. Selected for exact textual tap semantics.
- **S-011 — “Track Automation,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/track-automation>. Kind: official
  manual. Relevant: plugin parameter enumeration, lanes, curve editing/recording,
  copy, tempo. Claims: C-014, C-015. Limit: no ABI identity/sample-accuracy
  contract. Preferred to feature-list wording.
- **S-012 — “Loading and Saving Projects,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/loading-and-saving-projects>. Kind:
  official manual. Relevant: folders, backups, templates, collection ZIP, MIDI
  export. Claims: C-027–C-029. Limit: project schema/plugin recall not described.
- **S-013 — “Mixing Down to Audio and Video Files,” Acoustica Mixcraft 10 User
  Guide.** <https://acoustica.com/mixcraft-10-manual/mixing-down-to-audio-and-video-files>.
  Kind: official manual. Relevant: formats, stems, FX/automation options, bar-one
  alignment. Claims: C-017, C-029. Limit: semantic exchange is flattened.
- **S-014 — “Audio Clips,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/audio-clips>. Kind: official manual.
  Relevant: media formats, non-destructive properties, crossfade/reverse/stretch,
  external destructive edit. Claim: C-009. Limit: no algorithm/quality details.
- **S-015 — “Recording Audio Tracks,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/recording-audio-tracks>. Kind: official
  manual. Relevant: multitrack recording, monitoring, lanes/modes/loop/punch,
  dry-vs-effect recording. Claims: C-010, C-025, C-033. Limit: no swipe-comp
  model. Selected over quick-start summaries.
- **S-016 — “MIDI Basics,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/midi-basics>. Kind: official manual.
  Relevant: note/channel/velocity/pitch/controller model. Claims: C-011, C-012.
  Limit: introductory MIDI 1.x surface, not an exhaustive protocol matrix.
- **S-017 — “Appendix 4: Transmitting MIDI Clock/Sync to External Devices,”
  Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/appendix-4>. Kind: official manual.
  Relevant: MIDI clock/status output ports/channels. Claims: C-011, C-012.
  Limit: does not establish clock input, MTC, or measured jitter.
- **S-018 — “Performance Panel,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/performance-panel>. Kind: official
  manual. Relevant: one panel, audio/MIDI grid, one clip per track, shared track
  controls/controllers. Claim: C-004. Limit: launch quantization/recovery depth
  not retrieved. Selected for conceptual model.
- **S-019 — “The Mixcraft 10 Controller Script API,” Acoustica Mixcraft 10 User
  Guide.** <https://acoustica.com/mixcraft-10-manual/the-mixcraft-10-controller-script-api>.
  Kind: official manual. Relevant: JavaScript, integrated editor, MIDI monitor,
  console. Claim: C-030. Limit: method-level API/license/stability not audited.
- **S-020 — “Video Tracks and Editing,” Acoustica Mixcraft 10 User Guide.**
  <https://acoustica.com/mixcraft-10-manual/video-tracks-and-editing>. Kind:
  official manual. Relevant: one video track, media/stills, editing/effects.
  Claims: C-017, C-019, C-034. Limit: not a post-production architecture source.
- **S-021 — “Mixcraft 10.6 Pro Studio,” Acoustica Store.**
  <https://store.acoustica.com/bundles/mixcraft-10-pro-studio>. Kind: official
  current store page. Relevant: version, current bundle/system/internet needs,
  one-time price and RTO. Claims: C-001, C-016, C-028, C-031, C-033. Limit:
  customer reviews were excluded; no detailed EULA link. Selected for current
  commercial/bundle boundary.
- **S-022 — “Search Results” for combined Mixcraft format query, Acoustica.**
  <https://acoustica.com/search?q=Mixcraft%20DirectX%20DXi%20AAX%20AU%20CLAP%20LV2>.
  Kind: official-site search, negative discovery evidence only. Relevant: no
  explicit current non-VST support page surfaced. Claim: C-019. Limit: search
  relevance is broad and may ignore terms; cannot prove unsupported status.
  Retained to show the attempted method, not as behavior evidence.
- **S-023 — “Licensing,” Steinberg VST 3 Developer Portal.**
  <https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html>.
  Kind: current format-owner licensing FAQ. Relevant: VST3 MIT obligations and
  binary distribution; VST2 pre-Oct-2018 agreement and non-redistributable SDK
  files. Claim: C-032. Limit: not legal advice and not Mixcraft-specific.
  Preferred to blogs and old license summaries.

**Retained negative/access results:**

- `NR-001`: official PDF User Guide returned unsupported `application/pdf` to
  the fetcher; accessible official HTML sections were used instead.
- `NR-002`: guessed official `https://acoustica.com/eula.html` returned 404; no
  EULA terms were inferred.
- `NR-003`: several web-search discovery requests returned HTTP 429; this limited
  broad discovery but not the official manual passes.
- `NR-004`: official site search produced no explicit current non-VST matrix;
  format rows remain `UNKNOWN`, not unsupported.
- `NR-005`: the one bounded nested researcher request failed with `Subagent depth
  limit reached (1)`; no nested edit occurred, and the parent pursued the same
  narrow gap directly.
- `NR-006`: official signal-flow diagram labels were image-only in the fetched
  representation; textual mixer/sidechain pages were selected instead.
- `NR-007`: the GitHub HTML wrapper for the VST3 SDK license did not expose the
  raw license body in fetched text; S-023 is the retained format-owner source.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / available evidence | Blocker and decision impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| Internal engine graph, precision, scheduler, realtime/offline topology | Preferences, mixer, signal-flow page, PDC docs [C-006–C-008] | Proprietary; high impact on engine design | Ask Acoustica for public engineering material; otherwise compare behavior in a disposable impulse/CPU/render harness | Unassigned |
| Non-VST format status | Current product/manual/site combined search; only VST/VST3 explicit [C-018, C-019] | No support matrix; affects ecosystem scope | Vendor-support confirmation plus harmless known-format fixtures on a disposable Windows VM | Unassigned |
| Scan cache, identity, duplicate/shell handling, quarantine | Manager/preferences/troubleshooting and negative search [C-020–C-024] | User docs stop at UX; high durability/diagnostic impact | Snapshot only public filesystem/process behavior before/after scan using signed fixtures; force duplicate IDs and controlled scan crash | Unassigned |
| Runtime isolation/helper topology and recovery | Safe Mode and 32-bit shell text [C-023, C-024] | Separate process only explicit for 64-bit VST2 | Observe process tree and controlled fixture crash; do not inspect binaries | Unassigned |
| Full bus/event/latency/tail/automation contract | Sidechain, multi-out, PDC, lanes [C-007, C-013–C-015, C-025] | Format logo insufficient; central interoperability risk | Instrumented VST2/VST3 fixtures reporting buses, dynamic latency/tail, parameter reorder, MIDI/event timestamps, offline callbacks | Unassigned |
| Plugin state, external assets, missing/reinstalled plugin behavior | Preset/project/collect pages [C-026–C-028] | No placeholder/state description; high project-durability impact | Save known state/assets; remove plugin; reopen/save; reinstall; compare user-visible state and audio without reading private format | Unassigned |
| Project schema/version compatibility/atomicity | Save/backups/autosave/collection [C-028] | Public docs omit representation and forward/back guarantees | Vendor documentation request; behavior-only cross-version open/save with synthetic projects | Unassigned |
| MPE/MIDI 2.0/SysEx/MTC/clock input | MIDI/manual/controller passes [C-011, C-012] | Protocol matrix absent; medium controller architecture impact | Vendor support matrix, then known-message virtual MIDI fixture | Unassigned |
| Surround/immersive, timecode, conform, loudness/post | Product/video/export docs [C-017, C-029, C-034] | No native claims; affects post-production suitability | Vendor confirmation; only prototype if this market enters scope | Unassigned |
| Accessibility, telemetry/privacy, update signing/rollback, Remote security | Product/preferences/store/footer review [C-033, C-034] | App-specific policies absent; release/security gate | Vendor accessibility/security/privacy docs; keyboard/screen-reader audit; network threat model with permission | Unassigned |
| Detailed product/content/controller-script license terms | Store page, 404 EULA attempt, VST owner docs [C-031, C-032, C-034] | Rights cannot be inferred; procurement/legal impact | Obtain purchase-displayed EULA and each bundled-content/API license; qualified counsel review | Unassigned |

## 24. Curiosity pass and stop decision

Scores use 1–5; higher relevance/value/novelty is better, while higher cost is
worse. Only the best in-frame thread that could change an architecture conclusion
was pursued.

| Rank | Candidate follow-up | Relevance | Expected value | Novelty | Cost | Decision/result |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Resolve current non-VST formats, especially DirectX/DXi | 5 | 5 | 4 | 2 | **PURSUED.** Nested spawn unavailable; direct official search/manual comparison saturated without explicit evidence. Rows remain UNKNOWN. |
| 2 | Obtain detailed current Acoustica EULA | 3 | 3 | 3 | 4 | `CURIOSITY_NO_GO`: guessed official URL 404; rights require purchase/legal access and do not change host architecture today. |
| 3 | Extract image-only signal-flow diagram | 3 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: text sources resolved decision-critical taps; image labels would add little. |
| 4 | Audit every Controller Script API method | 2 | 2 | 3 | 3 | `CURIOSITY_NO_GO`: controller extensibility is bounded; method inventory cannot resolve engine/plugin decisions. |
| 5 | Exhaustively enumerate bundled devices/content | 1 | 1 | 1 | 4 | `CURIOSITY_NO_GO`: current counts/edition boundaries are sufficient. |
| 6 | Install Mixcraft and crash plugins now | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO`: explicitly outside documentary authority; defer to disposable qualification phase. |
| 7 | Research historical DirectX support in old Mixcraft | 2 | 2 | 3 | 3 | `CURIOSITY_NO_GO`: current status is the decision boundary; history cannot prove current behavior. |

**Gaps/contradictions at final synthesis:** the manual says two plugin-ignore
files but names one; the signal graph is image-only; the effect page positively
names VST/VST3 while only the instrument page says “only”; the product’s
“almost universal” marketing is broader than the documented matrix. These are
preserved rather than harmonized.

**Stop decision:** stop on **sufficient coverage plus documentary saturation**.
Every template heading and plugin row is complete; current product/workflow/
edition, mixer, VST lifecycle, content, video/live/control/interchange, and
licensing boundaries have primary evidence. Additional official searches
produced duplicates, broad irrelevant results, rate limits, or inaccessible
details, and another documentary pass is unlikely to change the leading
conclusions. Remaining high-value questions require vendor confirmation or
bounded clean-room runtime fixtures, not more web searching.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added only
  `research/daw-landscape/dossiers/acoustica-mixcraft.md`; no staging/commit.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0 pins 10.6, three editions, Windows, cutoff, and exclusions.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and
  subsections 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive
  sections use `DOCUMENTED`, `INFERENCE`, or `UNKNOWN` and cite C-IDs.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  claims register, source ledger, and Section 23 probes.
- [x] **Every required plugin-format row is present.** All 13 rows are populated;
  no blank status cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover scan, manager, ignore, bridge/isolation, I/O, PDC,
  automation, UI, presets/state, diagnostics, and failures.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  No `OBSERVED` claim was made; vendor performance claims are bounded.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 covers
  commercial limits, VST3/VST2 owner terms, and no compatibility grant.
- [x] **Bibliography records source rationale and limitations.** Section 22
  includes passage/section purpose, supported claims, limits, and preference.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19
  and 24 record pursued/rejected threads and reopening conditions.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** No product/plugin installer or binary was downloaded/run.

**Checks performed:** governing frame/contract/template read; official current
identity and edition triangulation; required format-row audit; claim-to-source
resolution audit; two-source-per-pass research loop; negative-result retention;
heading order review; read-only `git status --short` before editing.

**Concise result:** complete current Mixcraft 10.6 documentary dossier with deep
VST2/VST3 user-contract evidence and explicit proprietary/non-VST unknowns.

**Unresolved blockers:** nested-research depth limit, search HTTP 429s, unsupported
PDF fetch, image-only signal-flow labels, absent detailed EULA, and no public
full plugin-host contract. These do not block `COMPLETE_WITH_UNKNOWNS`.

**Pre-existing workspace changes left untouched:** numerous modified/untracked
paths outside this dossier were present (including `apps/mobile/`, `vendor/crafty/`,
`bun.lock`, and the untracked research tree). None was altered, staged, or
committed by this researcher.
