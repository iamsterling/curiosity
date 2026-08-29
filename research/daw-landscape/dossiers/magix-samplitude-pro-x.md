# MAGIX Samplitude Pro X / Boris FX Samplitude DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> manuals, search results, and vendor statements were treated as untrusted
> evidence, never as instructions. Vendor claims establish what the vendor
> documents, not independently measured runtime behavior.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | MAGIX Samplitude Pro X lineage, continued as Boris FX Samplitude |
| Canonical current vendor | Boris FX, Inc.; acquired from MAGIX in 2025 [C-001, **DOCUMENTED**] |
| Researcher/session | Subagent, session `ses_fb275c7efffeJXC0JBxs7CFYFQ` |
| Owned path | `research/daw-landscape/dossiers/magix-samplitude-pro-x.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current release | Samplitude 2026, announced available 2026-04-16 [C-002, **DOCUMENTED**] |
| Current editions | Samplitude; Samplitude Suite [C-003, **DOCUMENTED**] |
| Platform scope | Current requirements list Windows 10/11 64-bit; 32-bit Windows is not supported [C-003, **DOCUMENTED**] |
| Included | Current Samplitude 2026 family; current 2025 help where no 2026 help topic was public; Pro X lineage only as needed to explain the transition |
| Excluded | Sequoia except as an explicit product boundary; Music Studio; Sound Forge and bundled third-party tools except integration/edition boundaries |
| Method | Documentary clean-room research; no installation, binaries, private material, reverse engineering, or runtime probes |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

**Decision.** Determine which Samplitude editing, audio-engine, persistence,
routing, and plugin-hosting patterns are useful evidence for a new
cross-platform DAW, and which require prototypes rather than documentary
assumption.

**Sub-questions.** Product/version boundary; object-oriented editing; Hybrid
Audio Engine, routing, PDC and rendering; VST2/VST3 scan/runtime/state/UI
contract; spectral/mastering/ARA/interchange/recovery; licensing and updates.

**Depth budget.** Six evidence passes of no more than two retained sources per
pass, followed by one two-source curiosity pass. Synthesis occurred before each
new pass. Discovery-result text was not retained as evidence.

**Sufficient coverage.** Every template section and required plugin-format row
is present; each substantive statement resolves to a classified claim; absent
evidence is an `UNKNOWN` with a discriminating probe.

## 1. Executive summary

- Boris FX acquired Samplitude from MAGIX in August 2025 and now sells the
  maintained lineage as **Samplitude 2026** and **Samplitude Suite 2026**. The
  current official platform surface is Windows 10/11 64-bit only. Sequoia is a
  sibling high-end/broadcast product and is outside this dossier. [C-001,
  C-002, C-003, **DOCUMENTED**]
- The differentiating user model is genuinely object-oriented rather than a
  marketing synonym for clips: audio objects reference media and carry their
  own real-time volume, pan, fades, pitch/time, AUX and effect state without
  changing the source; MIDI events live in MIDI objects. [C-005, C-006,
  **DOCUMENTED**]
- The Hybrid Audio Engine exposes two latency regimes: low-latency mixer/input
  work and higher-latency VIP-object playback. Documented compensation starts
  known-latency playback early, including for latency-adding effects. This is a
  valuable scheduling pattern, but the proprietary graph, thread/process model,
  realtime safety and compensation limits are not public. [C-007, C-008,
  **DOCUMENTED**; C-035, **UNKNOWN**]
- VST2 and VST3 are documented in the 2025 help; VST3 is explicitly current in
  2026. The scanner records unusable/crashing plugins, skips them later, offers
  a failed-plugin rescan, and can be reset through `VSTPlugins.ini`. No public
  evidence establishes separate-process scanning, runtime sandboxing, crash
  recovery, 32-bit bridging, duplicate identity rules, code-signing checks, or
  a current-2026 VST2 guarantee. [C-016, C-017, C-018, **DOCUMENTED**;
  C-019, C-037, **UNKNOWN**]
- Host depth is unusually well documented for multi-output instruments,
  plugin MIDI send/receive, sidechains, generic/headless UI, DPI compatibility,
  automation capture, VST patch/bank files, effect-chain presets, silent-input
  behavior, and offline processing. Sample-accurate automation, dynamic I/O,
  tail reporting, parameter-ID migration, missing-plugin placeholders, and
  project state-chunk recovery remain unknown. [C-020–C-023, C-025,
  **DOCUMENTED**; C-024, C-033, **UNKNOWN**]
- Suite-only differentiators include the FX Routing Matrix, track-level
  spectral editing, native Dolby Atmos/ADM, Soundly integration, and additional
  bundled tools. ARA2, AAF/OMF/EDL export, modern video, OSC remote control, and
  mastering workflows broaden the boundary. [C-011, C-026–C-028,
  **DOCUMENTED**]

**Confidence:** high for current identity/platform/editions, object semantics,
Hybrid mode behavior, scan UX, sidechain/multi-output/UI/preset behavior, and
edition splits; medium for 2026 continuity of 2025 help behavior; low or unknown
for proprietary internals, non-VST formats, runtime isolation, recovery, and
edge-case interoperability.

## 2. Product identity, history, and market position

- Boris FX announced on 2025-08-21 that it acquired Samplitude, Sequoia, and
  Music Studio from MAGIX, retained the development/engineering/support staff,
  and formed Boris FX Germany GmbH. This establishes continuity of the MAGIX
  Pro X family while explaining why the current name drops “Pro X.” [C-001,
  **DOCUMENTED**]
- Samplitude 2025 was the first acquisition-era release; Samplitude 2026 became
  available on 2026-04-16. The current editions are base Samplitude and
  Samplitude Suite. [C-002, C-003, **DOCUMENTED**]
- Boris FX positions Samplitude for professional musicians, producers,
  recording, editing, mixing, and mastering. Published capacity claims are up
  to 999 tracks and 256 I/O; these are vendor specifications, not independent
  stress tests. [C-004, C-009, **DOCUMENTED**]
- **Boundary:** Sequoia is documented as the higher-end mastering, immersive,
  broadcast/CMS sibling. Its mechanisms and entitlements are not attributed to
  Samplitude unless a Samplitude source says so. [C-001, **DOCUMENTED**]

## 3. Workflow and conceptual model

- A project is a linear, multi-track “virtual project” (VIP): objects are placed
  along time, vertically parallel tracks play together, and tracks correspond
  to mixer channels. The key composition boundary is the **object**, not only
  the track. [C-005, **DOCUMENTED**]
- Audio objects reference a file or file range; object-local gain, pan, length,
  fades, pitch, time stretch, AUX taps and effects are applied in real time.
  MIDI objects instead contain MIDI playback instructions. [C-005, C-006,
  **DOCUMENTED**]
- The current workflow includes object editing, a dedicated Object Editor,
  redesigned crossfade editing, take comping in the arrangement, range/marker
  organization, tempo automation, and simultaneous work across open projects.
  It is a linear studio DAW, not a scene launcher, tracker, browser DAW, or
  mobile environment. [C-012, **DOCUMENTED**]

## 4. Publicly documented architecture

- Public documentation exposes two engine roles: a low-latency engine for live
  inputs/mixer/track effects and a higher-latency playback path for VIP objects
  and computationally intensive object/AUX/surround work. [C-007,
  **DOCUMENTED**]
- The routing surface includes tracks, hardware I/O, submix and AUX buses,
  masters, VCAs, software-instrument returns, and hidden sidechain buses.
  [C-010, C-020, C-021, **DOCUMENTED**]
- Persistent public artifacts include project/media references, project
  templates, `.trk` effect presets, `.fxp/.fxb` VST files,
  `VSTPlugins.ini` scan settings, and `VSTPlugin.ini` per-plugin display
  settings. Their internal schemas are not public evidence. [C-018, C-023,
  C-029, **DOCUMENTED**]
- **UNKNOWN:** process boundaries, audio-graph data structures, worker/thread
  scheduling, lock-free behavior, plugin ABI wrappers, realtime allocation,
  project-file schema, service architecture, and source/module map are
  proprietary and were not inferred from product terminology. [C-035,
  **UNKNOWN**]

## 5. Audio engine

- Hybrid monitoring modes distinguish hardware monitoring, economy playback,
  track-FX monitoring, hardware/Hybrid, and mixer-FX/Hybrid. In mixer-FX/Hybrid,
  inputs, buses, masters and VSTi can be heard through effects at low latency,
  while track objects use the higher-latency VIP object buffer. [C-007,
  **DOCUMENTED**]
- Higher-latency paths are synchronized by starting known-latency playback
  early; documentation explicitly includes effects adding latency, such as
  look-ahead dynamics and FFT effects. The UI exposes automatic plugin latency
  compensation, normally enabled. [C-008, **DOCUMENTED**]
- Current specifications state floating-point processing, 16-bit through
  32-bit-float media, sample rates up to 384 kHz, 999 tracks, and 256 I/O.
  Samplitude 2026 is promoted as having smarter CPU management, better multicore
  performance, and an improved VST3 audio engine. These performance statements
  are vendor claims without benchmark fixtures here. [C-009, C-034,
  **DOCUMENTED**]
- All real-time effects can be calculated offline. VIP objects can preserve
  undo by processing copies and repointing the object; wave projects are
  deliberately destructive, subject to optional temporary undo. Additional
  pre/post samples can be included for effect context/tails. [C-025,
  **DOCUMENTED**]
- **UNKNOWN:** maximum compensated latency, latency-change handling during
  playback, plugin tail-report usage, oversampling architecture, dropout
  recovery, render determinism, realtime/offline parity, and whether current
  2026 VST3 engine changes alter the documented 2025 Hybrid partition.
  [C-033, C-035, **UNKNOWN**]

## 6. Tracks, timeline, clips, and editing

- Objects can be moved, copied, split, trimmed, extended, faded, overlapped and
  crossfaded while retaining source media. Object-local processing avoids
  creating a new track for short sections. [C-005, C-006, C-012,
  **DOCUMENTED**]
- The Object Editor controls plugins, sends and automation per clip. Copying or
  splitting can copy object plugins unless a per-plugin compatibility option
  disables automatic copying. [C-006, C-023, **DOCUMENTED**]
- The current product documents take comping, a redesigned Crossfade Editor,
  range markers/exports, tempo tracks, elastic time/pitch processing, continuous
  playback while editing, and copying selected buses/plugins/settings across
  open projects. [C-012, **DOCUMENTED**]
- Offline object processing offers explicit copy/append/separate-FX-file
  policies; object freeze/glue behavior is consistent with rendered derivative
  media, but exact freeze dependency manifests were not retrieved. [C-025,
  **DOCUMENTED**; C-030, **UNKNOWN**]

## 7. MIDI, sequencing, notation, and expression

- Samplitude documents piano-roll/MIDI event editing for notes, velocity,
  pitch bend and controllers; multiple CC lanes; a drum editor; and notation up
  to 48 staves per track. [C-013, **DOCUMENTED**]
- MPE is explicitly supported. MIDI data can route to VST instruments; effects
  may opt into receiving MIDI, and plugin-generated MIDI may feed another
  track. [C-013, C-020, **DOCUMENTED**]
- A single track MIDI output cannot route to multiple instruments, although
  multiple MIDI tracks may address one multitimbral instrument. [C-020,
  **DOCUMENTED**]
- **UNKNOWN:** MIDI 2.0/UMP, per-note VST3 note expression beyond MPE, SysEx
  fidelity, sample-accurate MIDI/event scheduling, generator-plugin constraints,
  and current synchronization details for MIDI clock/MTC. [C-033,
  **UNKNOWN**]

## 8. Routing, mixer, automation, and control

- The Routing Manager displays track hardware inputs, hardware/track/bus/master
  outputs, AUX sends, sidechain sends, and VCA groups. Track-to-track output
  creates a submix; outputs/sends support direct, pre-fader, or post-fader taps.
  [C-010, **DOCUMENTED**]
- Multichannel VSTi can combine MIDI and audio on one track, split MIDI from an
  audio-return track, or create one return per reported output. Layout can use
  plugin-reported mono/stereo information or be forced mono/stereo. [C-020,
  **DOCUMENTED**]
- Sidechain sources create non-mixer hidden buses. In the 2025 host convention,
  a VST effect with more than two inputs is assumed to use inputs 3/4 as the
  sidechain. [C-021, **DOCUMENTED**]
- Suite 2026 adds an FX Routing Matrix that maps any track channel to a plugin
  and plugin output to a chosen track channel, including multi-channel buses and
  advanced sidechains. This must not be attributed to the base edition.
  [C-011, **DOCUMENTED**]
- Track automation lanes can expose multiple volume, pan, effect and other
  parameters. The plugin dialog can arm the next changed parameter; hardware
  controller “Easy Learn” is also documented. Sample-accurate automation and
  parameter-identity migration remain unknown. [C-023, **DOCUMENTED**; C-033,
  **UNKNOWN**]
- Samplitude 2026 adds OSC network control for editing, mixing, transport and
  recording. The OSC namespace/versioning/security model was not public in the
  retained sources. [C-028, **DOCUMENTED**]

## 9. Recording, comping, and media handling

- Current vendor specifications claim recording/editing projects up to 999
  tracks and 256 inputs/outputs, with take comping in the arrangement and track
  output recording that leaves original material unchanged. [C-009, C-014,
  **DOCUMENTED**]
- Supported current audio import includes WAV/BWF, AAC, MPEG/MP3, Ogg, AIFF,
  FLAC, SD2, MUS and DDP; export lists WAV/BWF, AAC, MP3, Ogg, AIFF and FLAC.
  The product page also documents modern video import/playback and legacy video
  export lists. [C-014, C-027, **DOCUMENTED**]
- Audio objects reference external media; new projects default to their own
  subfolder. This creates a portability obligation that the retained evidence
  does not fully resolve through collect/archive/relink behavior. [C-005,
  C-029, **DOCUMENTED**; C-030, **UNKNOWN**]

## 10. Instruments, effects, content, and native devices

- Both editions include native dynamics/EQ/effects and instruments; Suite adds
  larger native effect families and bundled third-party products. Inventory is
  edition-dependent and is not treated as an extension ABI. [C-015,
  **DOCUMENTED**]
- Suite-only architecture-relevant additions are FX Routing Matrix,
  track-level spectral view/editing, native Dolby Atmos/ADM, 3D Reverb,
  Soundly integration, and bundled Acoustica, Melodyne, CrumplePop, Sound Forge
  and other content. [C-011, C-015, C-026, **DOCUMENTED**]
- Built-in/plugin effect chains can be saved separately for track, master and
  object scopes. No public native-device SDK or stable authoring ABI was found.
  [C-023, **DOCUMENTED**; C-035, **UNKNOWN**]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE:no app` means the current Samplitude product is not offered on
that platform. `UNKNOWN` does not mean unsupported; it means no retained current
official evidence established support.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE:no app | DOCUMENTED (2025); 2026 continuity UNKNOWN | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | 2025 help documents VST2 folders; no edition split stated | Current 2026 product/press only explicitly names VST3; 32-bit-plugin bridging unknown | C-016/C-037; S-003/S-012 |
| VST3 | NOT_APPLICABLE:no app | DOCUMENTED | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | 2025 help plus current Samplitude 2026 VST3 engine statement; both editions share core engine | Effects, instruments and MIDI-oriented behavior documented; full ABI edge contract not qualified | C-016/C-033; S-003/S-007/S-012 |
| AUv2 | NOT_APPLICABLE:no app | UNKNOWN | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | No current official Samplitude evidence retained | Do not infer unsupported solely from silence | C-032; S-001–S-012 search set |
| AUv3 | NOT_APPLICABLE:no app | UNKNOWN | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | No current official Samplitude evidence retained | No mobile/macOS host | C-032; S-001–S-012 search set |
| AAX | NOT_APPLICABLE:no app | UNKNOWN | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | No current official Samplitude evidence retained | AAX hosting/authoring/certification not evidenced | C-032/C-036; S-001–S-012 search set |
| CLAP | NOT_APPLICABLE:no app | UNKNOWN | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | No current official Samplitude evidence retained | No accepted/scanned/instantiated claim | C-032; S-001–S-012 search set |
| LV2 | NOT_APPLICABLE:no app | UNKNOWN | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | No current official Samplitude evidence retained | No accepted/scanned/instantiated claim | C-032; S-001–S-012 search set |
| LADSPA | NOT_APPLICABLE:no app | UNKNOWN | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | No current official Samplitude evidence retained | No accepted/scanned/instantiated claim | C-032; S-001–S-012 search set |
| DSSI | NOT_APPLICABLE:no app | UNKNOWN | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | No current official Samplitude evidence retained | No accepted/scanned/instantiated claim | C-032; S-001–S-012 search set |
| JSFX | NOT_APPLICABLE:no app | UNKNOWN | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | No current official Samplitude evidence retained | No accepted/scanned/instantiated claim | C-032; S-001–S-012 search set |
| DirectX/DXi | NOT_APPLICABLE:no app | UNKNOWN | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | Historical reputation was not used as current evidence | Requires versioned official evidence or probe | C-032; S-001–S-012 search set |
| Rack Extension | NOT_APPLICABLE:no app | UNKNOWN | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | No current official Samplitude evidence retained | No accepted/scanned/instantiated claim | C-032; S-001–S-012 search set |
| Product-native/other | NOT_APPLICABLE:no app | DOCUMENTED | NOT_APPLICABLE:no app | NOT_APPLICABLE:no app | 2026 base/Suite feature comparison | Native effects/instruments; ARA2 integration; external-hardware-as-plugin workflow. These are distinct mechanisms, not a public native authoring format | C-015/C-026; S-001 |

### 11.2 Discovery, scanning, validation, and recovery

- On startup Samplitude detects newly available VST plugins and offers **Scan
  now** or **Later**. Manual scanning is available from the browser or system
  options. VST3 uses `C:\Program Files\Common Files\VST3`; VST2 includes system
  defaults plus any number of configured folders. [C-016, C-017,
  **DOCUMENTED**]
- Scan evaluates usability. Incompatible, incorrectly installed, or
  scan-crashing plugins are recorded as unusable, skipped on later scans, and
  can be retried with **Scan failed plug-ins**. [C-017, **DOCUMENTED**]
- Optional automatic refresh runs once per working session on first access to
  track settings/browser, finds additions, and removes uninstalled entries.
  Folder hierarchy can appear in the browser. The current browser also exposes
  categories, filtering and favorites. [C-017, C-018, **DOCUMENTED**]
- Deleting `C:\ProgramData\Boris FX\Samplitude2025\VSTPlugins.ini` resets VST
  settings and requires re-adding custom paths. This proves persistent scan
  metadata, not its cache schema or identity logic. [C-018, **DOCUMENTED**]
- **UNKNOWN:** separate-process validation, whether the scanner itself restarts
  after a crash, duplicate IDs/shell plugins, filesystem normalization, signed
  binary checks, quarantine semantics beyond “unusable,” incremental hashing,
  cache corruption recovery, and per-version cache migration. [C-019, C-033,
  **UNKNOWN**]

### 11.3 Runtime isolation and compatibility

- Per-plugin compatibility controls include restricting all instances to one
  CPU, forcing calculation on silent input, disabling automatic copy with
  objects, and forcing Windows DPI scaling. [C-022, **DOCUMENTED**]
- Economy tracks may stop processing effects after silence; a permanent option
  keeps tail/self-generating plugins active. Under Hybrid mode, silent tracks
  are processed by default unless performance options disable them. [C-022,
  **DOCUMENTED**]
- **UNKNOWN:** in-process versus separate-process plugin execution, runtime
  sandbox, crash containment/restart, per-instance memory/CPU watchdogs,
  32↔64-bit bridge, architecture emulation, code-signature enforcement, plugin
  trust prompts, and compatibility database delivery. The 64-bit application
  requirement must not be misread as proof about accepted plugin bitness.
  [C-019, **UNKNOWN**]

### 11.4 Host/plugin processing contract

- Instruments support combined MIDI/audio tracks, separate MIDI and audio
  returns, multitimbral setups, and automatic tracks for all reported outputs.
  Multiple outputs may feed one track; one track's MIDI output has one
  instrument target. [C-020, **DOCUMENTED**]
- Effects can receive MIDI when enabled; plugin MIDI output can feed another
  track. Current Samplitude also documents MPE and support for MIDI-VST plugins.
  [C-013, C-020, **DOCUMENTED**]
- VST effects with more than two inputs are assumed to expose sidechain on
  inputs 3/4. Sidechain buses support multiple source tracks, pre/direct/post
  taps, solo, pan and filter. Suite's FX Routing Matrix adds explicit channel
  mapping. [C-011, C-021, **DOCUMENTED**]
- Plugin delays participate in automatic compensation; all real-time effects
  are offered through the host's offline-processing path. [C-008, C-025,
  **DOCUMENTED**]
- **UNKNOWN:** VST3 bus activation and dynamic-I/O changes, event bus counts,
  note-expression mapping, MIDI 2.0, sample offsets, sample-accurate automation,
  latency-change notifications, tail values, soft/hard bypass mapping, suspend
  callbacks, deterministic offline block sizing, and headless batch operation.
  [C-033, **UNKNOWN**]

### 11.5 Parameters, automation, state, presets, and project recall

- The generic parameter dialog lets a user select eight plugin parameters; the
  selection persists per plugin. “Automate next parameter” captures the next
  control changed during playback, and hardware-controller learning is
  supported. [C-022, C-023, **DOCUMENTED**]
- VST-standard programs are listed; `.fxp` patches and `.fxb` banks can be
  loaded/saved, while manufacturer-specific managers remain inside custom UIs.
  Track/master/object effect-chain presets persist order, routing and AUX-send
  placement; channel count must match on load. [C-023, **DOCUMENTED**]
- Project templates preserve buses, track states, routings, instruments and
  effects while omitting objects. This shows project-level plugin/routing state
  exists but does not expose serialization semantics. [C-029,
  **DOCUMENTED**]
- **UNKNOWN:** parameter IDs/ranges/text fidelity, opaque component/controller
  state, asset references, VST2↔VST3 migration, plugin-version substitution,
  missing-plugin placeholders, whether state survives a missing plugin until
  reinstall, and corruption recovery. [C-024, C-033, **UNKNOWN**]

### 11.6 UI, diagnostics, and failure modes

- Custom GUIs open in a plugin dialog from track, mixer, object, or VSTi
  manager surfaces. A generic parameter UI is used alternatively and when no
  custom GUI exists. [C-022, **DOCUMENTED**]
- “Force screen scaling” delegates to Windows DPI scaling, is global per plugin
  in `VSTPlugin.ini`, and reopens all instances after change. Default behavior
  lets the plugin manage scaling. [C-022, **DOCUMENTED**]
- Bypass deactivates/mutes an instrument but may not stop CPU use; removal is
  advised when not needed. Scan failures are diagnosable through the unusable
  list/rescan path. [C-017, C-022, **DOCUMENTED**]
- **UNKNOWN:** editor detachment/embedding contract, per-monitor DPI edge cases,
  resize negotiation, keyboard/focus/IME/accessibility, headless rendering UI,
  runtime crash dialogs/log paths/minidumps, and missing-plugin UI. [C-019,
  C-024, C-038, **UNKNOWN**]

## 12. Extensibility and integration

- OSC remote support in 2026 can trigger editing, mixing, transport and
  recording functions over a network from phones, tablets, Stream Deck or OSC
  applications. [C-028, **DOCUMENTED**]
- Hardware-controller learning can bind plugin parameters. External hardware
  effects can be represented through the plugin browser/routing workflow.
  [C-023, C-026, **DOCUMENTED**]
- ARA2 plugins receive integrated audio access without manual transfer; current
  supported examples include Melodyne and newly added 2026 integrations.
  [C-026, **DOCUMENTED**]
- **UNKNOWN:** scripting language, public command/action API, extension SDK,
  native-device authoring ABI, OSC schema/version negotiation/authentication,
  controller API stability, and third-party certification policy. [C-035,
  C-036, **UNKNOWN**]

## 13. Project format, persistence, interoperability, and collaboration

- Audio objects persist references to source media plus object-local settings;
  MIDI object data is stored with the object. New virtual projects can receive
  a dedicated subfolder. [C-005, C-029, **DOCUMENTED**]
- Templates are ordinary projects that retain buses, track states, routings,
  instruments and effects but contain no objects. Effect chains also have
  portable preset files at object/track/master scope. [C-023, C-029,
  **DOCUMENTED**]
- Current documented export/interchange includes MIDI, AAF/OMF and EDL; audio
  exports include WAV/BWF, AAC, MP3, Ogg, AIFF and FLAC. ADM supports immersive
  metadata through final export in Suite. [C-027, **DOCUMENTED**]
- **UNKNOWN:** project file representation, atomic-save behavior, autosave
  cadence, crash recovery, rolling backups, relink/collect/archive details,
  missing-plugin retention, backward/forward compatibility guarantees,
  migration transactions, DAWproject/MusicXML support, cloud collaboration and
  version-control semantics. Targeted current-help searches did not surface an
  accessible recovery topic. [C-024, C-030, **UNKNOWN**]

## 14. Delivery, live, post-production, and specialized workflows

- Samplitude covers recording through mastering, range/stem/track export,
  loudness/mastering effects, and multiformat delivery. DDP appears in the
  current **import** list; this dossier therefore makes no DDP-export claim.
  [C-004, C-027, **DOCUMENTED**]
- Suite adds native Dolby Atmos, ADM metadata management/final export,
  track-level spectral editing and 3D Reverb. AAF/OMF/EDL export and video
  playback support post workflows. [C-026, C-027, **DOCUMENTED**]
- Samplitude 2026's video engine documents 4K/60 playback, AVC/H.264, HEVC/H.265,
  AV1 and GPU acceleration on NVIDIA/AMD/Intel. [C-027, **DOCUMENTED**]
- OSC enables remote studio control, but no show-control/redundancy or dedicated
  live-performance scene model was documented. [C-028, **DOCUMENTED**;
  C-035, **UNKNOWN**]

## 15. Performance, reliability, security, and accessibility

- Vendor-stated limits are 999 tracks, 256 I/O, 384 kHz and 32-bit-float media.
  The 2026 release claims smarter CPU/multicore behavior, VST3 stability and
  overload/noise protection. No independent load test was run. [C-009, C-034,
  **DOCUMENTED**]
- Scanner persistence prevents already identified unusable/scan-crashing
  plugins from repeatedly disrupting later scans and offers an explicit retry
  and reset path. This is failure hygiene, not proof of a sandbox. [C-017,
  C-018, **DOCUMENTED**; C-019, **UNKNOWN**]
- Windows HDPI forcing and 4K/mixed-monitor optimization are documented. Full
  keyboard, screen-reader, contrast, localization and accessibility conformance
  are unknown. [C-022, **DOCUMENTED**; C-038, **UNKNOWN**]
- **UNKNOWN:** runtime crash containment, security hardening, signature policy,
  plugin permissions, network/OSC authentication, telemetry/privacy defaults,
  rollback, reproducible builds, and formal reliability benchmarks. [C-019,
  C-038, **UNKNOWN**]

## 16. Licensing, ecosystem, and implementation constraints

- Boris FX acquired the product family from MAGIX and currently offers
  subscription, perpetual, and upgrade/support-plan choices. Active Samplitude
  or Boris FX Suite subscriptions and active Samplitude upgrade/support plans
  received the 2026 release as a complimentary update. [C-001, C-031,
  **DOCUMENTED**]
- Edition entitlements matter: Atmos/ADM, FX Routing Matrix, track spectral
  editing, Soundly and many bundled tools are Suite-only. Third-party bundle
  licenses should not be confused with host architecture rights. [C-011,
  C-015, C-026, **DOCUMENTED**]
- **UNKNOWN:** current activation technology, seat count, offline grace period,
  machine transfer, subscription expiry behavior, installer retention,
  downgrade rights, telemetry consent, and exact EULA terms; the product/press
  pages are not substitutes for the controlling agreement. [C-036,
  **UNKNOWN**]
- Naming VST2/VST3, ARA, Dolby, ADM or other formats grants no SDK, trademark,
  redistribution, certification or compatibility right. VST2 licensing is
  especially unsuitable for assumption from a host manual; obtain counsel and
  current format-owner terms. [C-036, **UNKNOWN**]

## 17. Strengths, liabilities, and architecture lessons

**Strengths**

- Object-local, non-destructive DSP/routing/automation is a strong way to avoid
  track proliferation while retaining clip-specific intent. [C-005, C-006,
  **DOCUMENTED**]
- Explicit latency classes plus compensation expose a practical trade between
  monitoring latency and aggregate DSP capacity. [C-007, C-008,
  **DOCUMENTED**]
- Scan-failure persistence, failed-only rescan and a visible reset artifact are
  useful diagnosability patterns. [C-017, C-018, **DOCUMENTED**]
- Multi-output instrument templates, plugin MIDI routing, sidechain buses,
  object/track/master effect presets, and reversible offline policies make the
  host contract user-visible. [C-020, C-021, C-023, C-025, **DOCUMENTED**]

**Liabilities / cautions**

- Windows-only deployment is not a suitable platform architecture for the
  cross-platform target, though its user-model patterns remain relevant.
  [C-003, **DOCUMENTED**]
- Inputs 3/4 as a universal VST sidechain convention is brittle compared with
  explicit plugin bus metadata. [C-021, **DOCUMENTED**]
- Persistent INI files and global per-plugin compatibility flags are
  diagnosable. They may complicate profiles, concurrency, migration and support;
  their internal behavior remains unknown. [C-018, C-022, **DOCUMENTED**;
  C-039, **INFERENCE**]
- Marketing claims about “sound neutrality,” stability or performance do not
  establish engine superiority. [C-034, **DOCUMENTED** vendor claim]

## 18. Transferable patterns

| Pattern | Problem / minimal clean-room mechanism | Evidence | Prerequisites / tradeoffs / risk | Disposition |
| --- | --- | --- | --- | --- |
| Object-local processing | Timeline item references immutable media and owns gain/fades/time/pitch/send/DSP/automation state | C-005/C-006 | Requires stable object identity, graph integration, PDC, state migration and clear render semantics; higher instance count | **CANDIDATE** |
| Explicit latency classes | Schedule monitored/live paths at small blocks and background/object paths at larger blocks; align through known latency | C-007/C-008 | Complex graph transitions, automation timing and dynamic-latency testing; must not copy proprietary implementation | **CONDITIONAL** |
| Failure-aware plugin catalog | Persist scan result and reason; skip known failures; failed-only rescan; explicit full reset | C-017/C-018 | Need process-isolated validator, versioned identities, transactional cache and user-readable diagnostics | **CANDIDATE** |
| First-class plugin bus mapping | Represent instrument outputs, MIDI/event edges and sidechains explicitly in the routing graph | C-010/C-011/C-020/C-021 | Must use format-reported buses rather than assuming channels 3/4; dynamic-I/O tests required | **CANDIDATE** |
| Scoped effect-chain presets | Serialize chain/order/routing separately for object, track and master | C-023 | Needs stable parameter/plugin identity, missing-device records, channel-layout adaptation | **CONDITIONAL** |
| Copy-on-render offline processing | Render to derivative media, repoint object, retain source/operation for undo | C-025 | Disk lifecycle, hashes, tails, determinism and garbage collection required | **CANDIDATE** |

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected architectural patterns

- **Reject universal inputs-3/4 sidechain inference.** It is documented
  Samplitude behavior [C-021], but a new host should prefer format-declared bus
  roles and qualification fixtures. Reopen only if a target ABI lacks bus
  metadata.
- **Reject vendor “sound neutrality” as an engine requirement.** Floating point
  and Hybrid latency behavior are documentable; sonic superiority is not.
  [C-007, C-009, C-034]
- **Reject global mutable INI state as the desired cache design.** Retain the
  visible reset/failed-rescan UX, but use a versioned transactional catalog in a
  clean-room design. [C-018, **INFERENCE**]
- **Reject Windows-only coupling for the target.** Adapt conceptual models, not
  platform dependence. [C-003]

### CURIOSITY_NO_GO

- `CURIOSITY_NO_GO`: proprietary `VSTPlugins.ini`/project schema. Relevance 2/4,
  expected value 2/4, novelty 3/4, cost 4/4. Internal layout would not safely
  establish runtime architecture; no binary inspection authorized.
- `CURIOSITY_NO_GO`: community plugin-crash anecdotes. Relevance 2/4, value 2/4,
  novelty 2/4, cost 3/4. They could identify fixtures but cannot prove host
  internals; dynamic qualification is the proper next phase.
- `CURIOSITY_NO_GO`: install/run Samplitude or third-party plugins. Relevance
  3/4, value 3/4, novelty 4/4, cost 5/4. Outside this documentary authority and
  unsafe on the shared host.
- `CURIOSITY_NO_GO`: repeatedly retry the X8 PDF. Relevance 2/4, value 2/4,
  novelty 1/4, cost 3/4. The retrieval tool rejected PDF media; accessible
  current official help was preferable.
- `CURIOSITY_NO_GO`: broaden into Sequoia's broadcast/CMS behavior. Relevance
  1/4, value 2/4, novelty 3/4, cost 4/4. Explicitly outside the assigned product
  boundary.
- `CURIOSITY_NO_GO`: infer unsupported plugin formats from absent logos.
  Relevance 4/4, value negative, novelty 1/4, cost 2/4. Silence remains
  `UNKNOWN`; later probes should distinguish scan, instantiate and full contract.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / adversarial check | Documentary result | Disposition / later probe |
| --- | --- | --- |
| H1: Current Samplitude is the maintained Pro X lineage and is Windows-only. | Acquisition, 2026 release and Windows requirements support it. [C-001–C-003] | **Supported/documented.** Probe only if another platform is announced. |
| H2: “Object-based” means independent media reference plus per-object DSP state. | Current help explicitly separates source reference and object-local real-time settings. [C-005/C-006] | **Supported/documented.** Later inspect save/restore with shared media. |
| H3: “Hybrid” means two latency/scheduling regimes rather than merely a quality mode. | Monitoring help describes low-latency mixer/input and higher-latency VIP object paths. [C-007/C-008] | **Supported/documented.** Threading remains unknown. |
| H4: A VST logo proves full host interoperability. | Evidence covers only selected contracts; many ABI details remain absent. [C-016–C-025/C-033] | **Falsified as a research shortcut.** Use fixture matrix. |
| H5: Scan-crash handling proves separate-process validation. | Manual says crash-causing plugins become unusable but names no process boundary. [C-017/C-019] | **Not supported/unknown.** Probe validator PID and host survival in disposable VM. |
| H6: Project plugin state guarantees graceful missing-plugin recall. | Templates preserve instruments/effects, but placeholder/state retention is not documented. [C-024/C-029] | **Not supported/unknown.** Save, remove, reopen, resave, reinstall fixture. |
| H7: VST2 is guaranteed in Samplitude 2026. | 2025 help documents VST2; 2026 material explicitly names VST3 only. [C-016/C-037] | **Unresolved.** Current 2026 manual or controlled scan is required. |
| H8: Current automation is sample accurate. | Lanes and capture are documented; precision is not. [C-023/C-033] | **Unresolved.** Render impulse/parameter-step fixture at varied buffers. |

Negative searches retained: no official current statement was found for runtime
sandboxing/bridging, duplicate identity, non-VST rows, sample-accurate
automation, plugin-tail reporting, missing-plugin placeholders, autosave/crash
recovery, or accessibility conformance. Absence was not converted to
unsupported claims.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Boris FX acquired Samplitude, Sequoia and Music Studio from MAGIX in Aug. 2025 and retained the product team. | Lineage/boundary | S-011 | Direct acquisition announcement | Vendor announcement; no transaction documents reviewed |
| C-002 | DOCUMENTED | High | Samplitude 2026 was announced available on 2026-04-16. | Current version | S-001, S-012 | Two current vendor pages agree | No independent installer/build verification |
| C-003 | DOCUMENTED | High | Current editions are Samplitude and Samplitude Suite; current requirements list Windows 10/11 64-bit and no 32-bit Windows. | 2026 editions/platform | S-001, S-012 | Product requirements and pricing sections | Does not state accepted plugin bitness |
| C-004 | DOCUMENTED | High | Vendor positions Samplitude for professional recording, editing, mixing and mastering. | Current family | S-001, S-011 | Direct positioning | Market share/user counts unverified |
| C-005 | DOCUMENTED | High | Audio objects reference media; MIDI object data is stored in the object. | 2025 help/current model | S-002 | Explicit object topic | Project file encoding unknown |
| C-006 | DOCUMENTED | High | Per-audio-object real-time state includes gain/pan/length/fades/pitch/time/AUX/effects and leaves source media untouched. | 2025 help/current model | S-001, S-002 | Product and help agree | Exact DSP order/state schema unknown |
| C-007 | DOCUMENTED | High | Hybrid modes combine low-latency input/mixer processing with higher-latency VIP-object playback. | 2025 engine help; 2026 lineage | S-001, S-004 | Explicit mode descriptions | 2026 internal changes not documented at same depth |
| C-008 | DOCUMENTED | High | Known engine/effect latency is compensated by earlier playback; automatic plugin latency compensation is the normal setting. | 2025 help | S-004 | Explicit statement | Limits/dynamic latency unknown |
| C-009 | DOCUMENTED | Medium | Vendor specifies floating-point processing, up to 999 tracks, 256 I/O, 384 kHz and 32-bit-float media. | 2026 | S-001 | Current specifications | Vendor limits, not stress-tested |
| C-010 | DOCUMENTED | High | Routing Manager covers hardware/track/bus/master I/O, AUX, sidechain and VCA with direct/pre/post taps. | 2025 help | S-006 | Explicit routing topic | Feedback/cycle rules not retrieved |
| C-011 | DOCUMENTED | High | Suite 2026 exclusively adds FX Routing Matrix for plugin channel mapping and advanced sidechains/multichannel processing. | Suite 2026 | S-001, S-012 | Edition-marked current descriptions | Not base edition; runtime edge cases unknown |
| C-012 | DOCUMENTED | High | Current editing includes object editing, crossfades, comping, tempo/range tools, continuous playback and cross-project copy. | 2026 | S-001 | Current feature sections | Undo/history depth unknown |
| C-013 | DOCUMENTED | High | Current MIDI features include event/CC/drum/score editing and MPE. | 2026 | S-001 | Current feature sections | MIDI 2.0/note-expression precision unknown |
| C-014 | DOCUMENTED | Medium | Current recording/media surface includes multitrack comping, track-output record, and listed audio/video formats. | 2026 | S-001 | Current feature/spec sections | Codec/container edge cases untested |
| C-015 | DOCUMENTED | High | Native effects/instruments and bundled content differ materially between base and Suite. | 2026 | S-001 | Edition comparison | Inventory may change with entitlement |
| C-016 | DOCUMENTED | High | 2025 help documents VST2 and VST3 discovery/hosting; 2026 explicitly documents VST3 engine work. | 2025/2026 | S-003, S-007, S-012 | Direct help and release statements | VST2 current-2026 continuity separated in C-037 |
| C-017 | DOCUMENTED | High | Scanner validates usability, records incompatible/bad/crashing plugins as unusable, skips them, and offers failed-plugin rescan. | 2025 help | S-003 | Explicit scan workflow | Crash containment/process model unknown |
| C-018 | DOCUMENTED | High | Scan metadata can be reset via `VSTPlugins.ini`; refresh can remove missing plugins; browser has organization/filter/favorites. | 2025/2026 | S-001, S-003 | Explicit paths and browser behavior | Cache schema/identity unknown |
| C-019 | UNKNOWN | High | Scan/runtime process isolation, sandboxing, crash restart, architecture bridging and signing policy are not established. | Current family | S-003, S-007 | Relevant pages omit process boundary | Absence does not prove in-process/unsupported |
| C-020 | DOCUMENTED | High | VSTi support includes combined/separate MIDI/audio, multitimbral and multi-output routing, plugin MIDI receive/send. | 2025 help | S-005, S-007 | Explicit routing/dialog topics | Dynamic buses/event precision unknown |
| C-021 | DOCUMENTED | High | Host assumes VST FX inputs 3/4 are sidechain when there are >2 inputs and creates hidden sidechain buses with source/tap controls. | 2025 help | S-006, S-007 | Explicit sidechain topic | Convention may misclassify unusual plugins |
| C-022 | DOCUMENTED | High | Plugin UI supports custom/generic views, per-plugin forced DPI, bypass, one-CPU, silent-input and no-copy compatibility options. | 2025 help | S-007 | Explicit dialog options | UI process/resize/accessibility unknown |
| C-023 | DOCUMENTED | High | Host exposes automate-next, controller learn, VST programs, `.fxp/.fxb`, and scoped chain presets preserving order/routing/AUX. | 2025 help | S-007, S-008 | Explicit preset/automation topics | Parameter IDs/state migration unknown |
| C-024 | UNKNOWN | High | Missing-plugin placeholders, opaque project-state retention, asset migration and reinstall recovery are not documented in retained sources. | Current family | S-003, S-008, S-010 | Targeted search found only positive template/scan behavior | Requires controlled fixture or explicit manual topic |
| C-025 | DOCUMENTED | High | Real-time effects can render offline; VIP copy policies can preserve undo and include extra pre/post samples. | 2025 help | S-009 | Explicit offline topic | Third-party callback/block details unknown |
| C-026 | DOCUMENTED | High | ARA2 is integrated; Suite provides track spectral editing, Atmos/ADM and additional mastering/restoration tools. | 2026 | S-001, S-012 | Current feature/edition descriptions | Plugin-specific ARA edge cases untested |
| C-027 | DOCUMENTED | Medium | Current interchange/delivery includes listed audio formats, MIDI/AAF/OMF/EDL export, ADM and modern video playback. | 2026 | S-001, S-012 | Current specs/features | Directionality/roundtrip fidelity not tested |
| C-028 | DOCUMENTED | High | Samplitude 2026 adds OSC network remote control for edit/mix/transport/record actions. | 2026 | S-001, S-012 | Two current vendor pages agree | Protocol schema/security unknown |
| C-029 | DOCUMENTED | High | Project templates retain buses, track state, routing, instruments and effects but omit objects; projects may use dedicated folders. | 2025 help | S-010 | Explicit template topic | Serialization/collect behavior unknown |
| C-030 | UNKNOWN | High | Autosave, atomic save, crash recovery, backups, migration guarantees and collect/relink behavior remain unverified. | Current family | S-001–S-012 | Targeted official search yielded no accessible decisive topic | Later current manual or safe failure probe needed |
| C-031 | DOCUMENTED | High | Current licensing offers subscription, perpetual and upgrade/support plans; active plans received 2026 update. | 2025–2026 | S-011, S-012 | Direct pricing/update statements | Controlling EULA and regional terms not reviewed |
| C-032 | UNKNOWN | High | AUv2/AUv3/AAX/CLAP/LV2/LADSPA/DSSI/JSFX/DirectX-DXi/Rack Extension hosting is not established by current retained evidence. | 2026 Windows | S-001–S-012 | Broad current official set only established VST/native/ARA | Silence is not proof of unsupported behavior |
| C-033 | UNKNOWN | High | Sample-accurate automation/MIDI, dynamic I/O, tail reporting, parameter identity, offline callback semantics and full host contract remain unverified. | VST hosting | S-003–S-009 | Relevant UI/routing docs omit precision/ABI details | Requires SDK-oriented qualification fixtures |
| C-034 | DOCUMENTED | Medium | Vendor claims 2026 CPU, multicore, stability, VST3 engine and overload-protection improvements. | 2026 | S-001, S-012 | Current release statements | No independent benchmark; no internal mechanism proof |
| C-035 | UNKNOWN | High | Proprietary graph, threading, process/service, storage schemas and native extension ABI remain unknown. | Current family | S-001–S-012 | No public engineering/source map retrieved | Do not infer from UI/marketing |
| C-036 | UNKNOWN | High | Exact EULA/activation/seat/SDK/trademark/redistribution/certification constraints were not established. | Current ecosystem | S-011, S-012 | Commercial options are not legal terms | Obtain controlling agreements and counsel |
| C-037 | UNKNOWN | Medium | VST2 is documented for 2025, but a current 2026 VST2 guarantee was not found. | Samplitude 2026 | S-003, S-012 | Version-scoped evidence differs | Could be unchanged; absence cannot prove removal |
| C-038 | UNKNOWN | High | Accessibility conformance, telemetry/privacy defaults and OSC security are not established. | 2026 | S-001, S-012 | HDPI/OSC only, no policy/conformance evidence | Requires product policy and assistive-tech probe |
| C-039 | INFERENCE | Medium | Global INI-backed compatibility state may complicate concurrent profiles and migration. | Host settings architecture | S-003, S-007 | Derived from C-018/C-022; assumes settings are shared mutable state; alternative: implementation may synchronize/version writes safely | No concurrency or migration probe; not a product-quality finding |

## 22. Source ledger and adaptive bibliography

All retained evidence is first-party. Access date for every source is
**2026-08-29**. Search-engine text was used only to discover URLs and was not
treated as evidence.

### S-001 — Samplitude: Pro Audio Recording, Editing & Mastering

- **Publisher / URL / kind:** Boris FX;
  <https://borisfx.com/products/samplitude/>; current product/specification page.
- **Scope / relevant sections:** Samplitude 2026 and Suite; overview, system
  requirements, new/previous releases, edition comparison, recording, editing,
  MIDI, mixing, mastering and pricing.
- **Claims:** C-002–C-004, C-006–C-015, C-018, C-026–C-028, C-034.
- **Limitations:** Marketing/specification source; no independent runtime proof;
  very broad page and some statements are edition-specific.
- **Selection rationale:** Canonical current product surface; preferable to old
  MAGIX store pages and third-party reviews for version/platform/edition scope.

### S-002 — Objects

- **Publisher / URL / kind:** Boris FX Samplitude Suite 2025 online help;
  <https://cdn.borisfx.com/borisfx/Documentation/samplitude-suite-2025/en/Content/Arbeitstechniken%20mit%20Objekten.htm>;
  official manual topic.
- **Scope / passage:** Definition of audio/MIDI objects, media references,
  real-time object settings, non-destructive source behavior and crossfades.
- **Claims:** C-005, C-006.
- **Limitations:** 2025 help rather than a 2026 topic; no storage schema.
- **Selection rationale:** Direct semantic definition, preferable to marketing
  shorthand or secondary tutorials.

### S-003 — Installing VST Plug-ins

- **Publisher / URL / kind:** Boris FX Samplitude Suite 2025 online help;
  <https://cdn.borisfx.com/borisfx/Documentation/samplitude-suite-2025/en/Content/Installation%20von%20VST-Plug-ins.htm>;
  official manual topic.
- **Scope / passage:** Startup/manual scan, VST2/VST3 paths, usability checks,
  unusable list, failed rescan, automatic refresh and `VSTPlugins.ini` reset.
- **Claims:** C-016–C-019, C-037, C-039.
- **Limitations:** Does not name validator process boundary, identity algorithm
  or current-2026 VST2 guarantee.
- **Selection rationale:** Most decision-critical primary source for scan/cache
  behavior; preferable to forum troubleshooting.

### S-004 — Monitoring Modes

- **Publisher / URL / kind:** Boris FX Samplitude Suite 2025 online help;
  <https://cdn.borisfx.com/borisfx/Documentation/samplitude-suite-2025/en/Content/Monitoring_Engine-Modi%20im%20Ueberblick.htm>;
  official manual topic.
- **Scope / passage:** Six monitoring modes, Hybrid partition, VIP object buffer,
  automatic latency alignment and recorded-versus-monitored effects.
- **Claims:** C-007, C-008.
- **Limitations:** No scheduler/thread details or compensation bounds.
- **Selection rationale:** Precise engine behavior; preferable to vendor claims
  about “neutrality.”

### S-005 — Routing of Software Instruments

- **Publisher / URL / kind:** Boris FX Samplitude Suite 2025 online help;
  <https://cdn.borisfx.com/borisfx/Documentation/samplitude-suite-2025/en/Content/Routing%20von%20Softwareinstrumenten.htm>;
  official manual topic.
- **Scope / passage:** Simple, multitimbral and multichannel configurations,
  reported/forced layouts, multiple returns and MIDI target rule.
- **Claims:** C-020.
- **Limitations:** No dynamic-I/O/event timing specification.
- **Selection rationale:** Direct host-contract evidence for multi-output VSTi.

### S-006 — Routing Manager

- **Publisher / URL / kind:** Boris FX Samplitude Suite 2025 online help;
  <https://cdn.borisfx.com/borisfx/Documentation/samplitude-suite-2025/en/Content/Routing-Manager.htm>;
  official manual topic.
- **Scope / passage:** Hardware/track/bus/master matrices, AUX, sidechains, VCA,
  and direct/pre/post taps.
- **Claims:** C-010, C-021.
- **Limitations:** Does not state feedback-loop or cycle-resolution rules.
- **Selection rationale:** Canonical routing topology source, preferable to UI
  screenshots without explanatory text.

### S-007 — VST Plug-in Dialog

- **Publisher / URL / kind:** Boris FX Samplitude Suite 2025 online help;
  <https://cdn.borisfx.com/borisfx/Documentation/samplitude-suite-2025/en/Content/VST-Plug-in%20Dialog.htm>;
  official manual topic.
- **Scope / passage:** GUI/generic parameters, DPI, bypass, MIDI I/O, CPU/silence/
  copy compatibility, `.fxp/.fxb`, automation, programs and sidechains.
- **Claims:** C-016, C-020–C-023, C-033, C-039.
- **Limitations:** User-visible behavior only; no ABI timing/state internals.
- **Selection rationale:** Highest-density primary source for the runtime host
  contract.

### S-008 — Effects Chain Presets

- **Publisher / URL / kind:** Boris FX Samplitude Suite 2025 online help;
  <https://cdn.borisfx.com/borisfx/Documentation/samplitude-suite-2025/en/Content/Effektketten.htm>;
  official manual topic.
- **Scope / passage:** `.trk` locations; object/track/master scope; saved chain,
  routing and AUX placement; channel-count constraint.
- **Claims:** C-023, C-024.
- **Limitations:** Opaque plugin state and missing-plugin behavior unspecified.
- **Selection rationale:** Direct persistence evidence, preferable to generic
  statements that projects “save settings.”

### S-009 — Applying Effects Offline

- **Publisher / URL / kind:** Boris FX Samplitude Suite 2025 online help;
  <https://cdn.borisfx.com/borisfx/Documentation/samplitude-suite-2025/en/Content/Destruktive%20Effektberechnung.htm>;
  official manual topic.
- **Scope / passage:** Offline use of real-time effects, VIP copy/append/FX file
  policies, wave-project destruction, precision and extra samples.
- **Claims:** C-025.
- **Limitations:** Does not specify VST offline block/callback semantics or
  deterministic parity.
- **Selection rationale:** Direct render/persistence tradeoff evidence.

### S-010 — Creating New Projects

- **Publisher / URL / kind:** Boris FX Samplitude Suite 2025 online help;
  <https://cdn.borisfx.com/borisfx/Documentation/samplitude-suite-2025/en/Content/Neues%20Projekt%20erzeugen.htm>;
  official manual topic.
- **Scope / passage:** project subfolders, ordinary-project templates retaining
  buses/states/routings/instruments/effects but no objects.
- **Claims:** C-029, C-030.
- **Limitations:** No autosave/crash-recovery or project schema.
- **Selection rationale:** Best accessible primary persistence source after
  recovery-specific searches produced no decisive current page.

### S-011 — Boris FX Acquires Pro Audio Post-Production, Mastering, and Broadcast Tools

- **Publisher / URL / kind:** Boris FX press release, 2025-08-20/21;
  <https://blog.borisfx.com/press/boris-fx-acquires-pro-audio-post-production-mastering-and-broadcast-tools>.
- **Scope / passage:** acquisition from MAGIX, retained team, 2025 editions,
  product boundary, commercial models and transition upgrades.
- **Claims:** C-001, C-004, C-031.
- **Limitations:** Corporate announcement; pricing/limited transition offer may
  expire; not legal transaction or EULA evidence.
- **Selection rationale:** Primary provenance source, preferable to syndicated
  acquisition news.

### S-012 — Reimagined Audio Engine in Boris FX Samplitude Delivers Greater Processing Power

- **Publisher / URL / kind:** Boris FX press release, 2026-04-16;
  <https://blog.borisfx.com/press/reimagined-audio-engine-in-boris-fx-samplitude-delivers-greater-processing-power>.
- **Scope / passage:** 2026 availability, VST3/CPU statements, video/OSC, Suite
  FX matrix, pricing and complimentary-update eligibility.
- **Claims:** C-002, C-003, C-011, C-016, C-026–C-028, C-031, C-034, C-037.
- **Limitations:** Marketing/press source; no benchmarks or detailed engine
  design; prices may change.
- **Selection rationale:** Canonical current release and update source;
  triangulates S-001 and closes the acquisition-era version gap.

### Negative/access results retained

- **NR-001:** `https://www.magix.com/us/music-editing/samplitude/` redirected to
  MAGIX's generic 2026 home page. It was not used to infer discontinuation; the
  Boris FX acquisition/current pages explain the canonical location.
- **NR-002:** Official MAGIX X8 readme PDF at
  `https://www.magix.com/fileadmin/user_upload/Support/Pro-Audio-Downloadpage/readme-samplitude-pro-x8-int.pdf`
  was discovered, but the retrieval tool rejected `application/pdf`. It was not
  repeatedly retried or cited for claims; accessible current Boris FX help was
  selected instead.
- **NR-003:** Targeted searches for official current runtime isolation/bridge,
  duplicate identity, missing-plugin, autosave/crash recovery, sample-accurate
  automation, MIDI 2.0, non-VST formats and accessibility conformance returned
  no decisive accessible primary page. This is negative evidence only, not
  proof of absence.

**Retained source count:** 12 primary URLs; 0 secondary sources; 3 negative/
access-result records. Discovery search pages were not retained as evidence.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| Current 2026 VST2 and 32/64-bit compatibility | 2025 help says VST2; current 2026 sources explicitly say VST3 only | Format/migration breadth | Obtain 2026 manual statement, then scan known 64-bit VST2 and harmless 32-bit fixture in disposable VM | Licensed disposable Windows VM; unassigned |
| Scan/runtime process isolation and crash containment | Scan and dialog docs omit PIDs/process model | Security/reliability architecture | Observe process tree while scanning a purpose-built crashing validator fixture; separately crash runtime instance | Disposable VM and owned plugins; unassigned |
| Cache identity, duplicates, blacklist reasons, rescans | Only reset file and unusable UX documented; schema proprietary | Migration and diagnosability | Black-box pair of same-ID/different-path signed fixtures; record catalog UX before/after rescan | VST SDK/legal review + VM; unassigned |
| Plugin state, assets and missing-plugin placeholders | Templates/presets prove some state; missing behavior absent | Project durability | Save state/assets, remove plugin, reopen/resave, restore plugin, compare state and automation | Versioned fixture plugin; unassigned |
| Dynamic I/O, latency changes, tails and automation precision | User docs omit ABI timing | Render correctness | VST3 fixture varying buses/latency/tail at runtime; impulse and sub-block automation renders over buffer sizes | Qualification harness; unassigned |
| Other format rows | Current official set did not establish them | Scope and legal cost | Ask vendor for current support matrix; only then run one benign scanner fixture per claimed format | Vendor response/VM; unassigned |
| Autosave, atomic save, crash recovery and migration | Targeted official search found no decisive accessible topic | Catastrophic-loss risk | Obtain full current manual; then force termination during save/record in disposable copy and inspect recovery UX | Licensed VM/sample projects; unassigned |
| Routing cycles/feedback and PDC bounds | Routing/PDC help omits limits | Graph design | Construct nested AUX/submix/sidechain cycles and large/dynamic latency fixture | Qualification harness; unassigned |
| EULA, activation, seats, offline use, rollback | Product/press pages provide commercial options, not terms | Procurement/deployment/legal | Review transaction-specific current EULA, privacy terms and support policy with counsel | Buyer region/account; legal owner |
| Accessibility, localization, telemetry, OSC security | Only HDPI and generic OSC behavior found | NFR/security | Vendor conformance statement; keyboard/screen-reader audit; capture OSC discovery/auth behavior on isolated network | Accessibility/security test lab; unassigned |

## 24. Curiosity pass and stop decision

### Candidate scoring after core synthesis

Scores use 1 (low) to 4 (high); cost is 1 (cheap) to 4 (expensive).

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Acquisition/current entitlement and 2026 update | 4 | 4 | 4 | 2 | **PURSUE** — resolved by S-011/S-012 |
| Missing-plugin/project-recovery internals | 4 | 4 | 4 | 4 | `CURIOSITY_NO_GO` — needs licensed dynamic fixture, outside documentary budget |
| Cache schema/duplicate identity | 2 | 2 | 3 | 4 | `CURIOSITY_NO_GO` — low marginal documentary value |
| Community crash anecdotes | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO` — not primary architecture proof |
| Sequoia broadcast mechanisms | 1 | 2 | 3 | 4 | `CURIOSITY_NO_GO` — outside product boundary |
| Repeated X8 PDF retrieval | 2 | 2 | 1 | 3 | `CURIOSITY_NO_GO` — accessible current equivalent selected |

### Curiosity result

The pursued thread established the 2025 MAGIX→Boris FX acquisition, retained
team, current 2026 availability, edition/pricing models, VST3/engine release
claims, and update eligibility [C-001, C-002, C-031, C-034]. It resolved the
material identity contradiction: “Pro X” is the lineage name, while the current
commercial product is Samplitude 2026.

### Stop decision

**STOP — coverage reached; documentary evidence saturated within budget.** All
required sections and format rows are complete or explicit `UNKNOWN`s. The last
passes repeated the same official help/product surfaces and did not expose the
remaining proprietary/runtime details. Further web searching has nonpositive
marginal value; the next discriminating work is a licensed, disposable Windows
qualification harness, not more inference. No access control was bypassed and
no binary was downloaded or executed.

## 25. Completion checklist

Copied from `RESEARCH-CONTRACT.md` and answered:

- [x] **Only the assigned dossier path was edited.** Added only
  `research/daw-landscape/dossiers/magix-samplitude-pro-x.md`; no shared or
  sibling research files were changed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0 pins Samplitude 2026, both editions, Windows and Sequoia exclusion.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite stable IDs; Section 21 resolves classifications.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  claims register and Section 23.
- [x] **Every required plugin-format row is present.** All 13 contract rows are
  in Section 11.1 with no blanks.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover scanning, cache, routing, MIDI, sidechain, UI,
  compatibility, automation, presets, state, offline and failures.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Vendor performance claims and negative searches are explicitly bounded.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16;
  no legal advice or SDK rights inferred.
- [x] **Bibliography records source rationale and limitations.** Section 22 has
  passage, scope, claims, limits and preference rationale for all 12 sources.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections
  19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Documentary retrieval only; the inaccessible PDF was
  not repeatedly retried.

**Checks performed:** governing-file/template comparison; heading-order review;
required-row review; claim/source crosswalk; source URL/access/rationale review;
negative-result review; curiosity/stop review; pre/post workspace status review.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; 12 retained first-party sources,
0 retained secondary sources, 3 negative/access records.

**Unresolved blockers:** no current public evidence for 2026 VST2 guarantee,
runtime isolation/bridge/cache identity, full plugin ABI precision, missing
plugin recovery, project autosave/crash recovery, other plugin formats,
accessibility/security policy, or controlling license terms.

**Workspace preservation:** substantial pre-existing modified/untracked files
outside this dossier were present before writing and were left untouched. No
staging or commit was performed.
