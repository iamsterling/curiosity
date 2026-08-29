# Image-Line FL Studio desktop DAW dossier

> Research-only evidence. No design or implementation authority. Public,
> clean-room documentary research; fetched material was treated as untrusted
> evidence, not as instructions.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Image-Line FL Studio desktop |
| Canonical vendor | Image-Line NV, Belgium |
| Researcher/session | Research subagent; session `ses_fb275c847ffer8zRXfcS5keR3s` |
| Owned path | `research/daw-landscape/dossiers/image-line-fl-studio.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current release pinned | FL Studio 2026 / 26, through 2026.1.5 (2026-08-18) |
| Editions | Fruity Edition, Producer Edition, Signature Bundle, All Plugins Edition |
| Desktop platforms | Windows 10/11 on Intel/AMD; macOS 10.15+ on Intel or Apple Silicon |
| Included | Desktop DAW, native devices/wrappers, third-party desktop plugin hosting, Lifetime Free Updates lineage, desktop controller/scripting and project interchange |
| Excluded | FL Studio Mobile as a DAW, FL Studio Web, mobile/web hosting, installer/binary execution, reverse engineering, private SDKs, and legal conclusions |
| Completion | **COMPLETE_WITH_UNKNOWNS** |
| Evidence posture | No `OBSERVED` claims; vendor documentation establishes the public contract, not independent runtime conformance |

The cutoff release and platform/CPU floor are **DOCUMENTED** [C-001]. The
edition boundary is **DOCUMENTED** [C-002]. Linux and Windows-on-ARM are not
treated as supported desktop targets: Image-Line says Windows ARM may run but
is untested, unoptimized, and unsupported [C-001]. Mobile is deliberately
excluded even where the desktop bundle contains an “FL Studio Mobile Rack.”

## 1. Executive summary

- **DOCUMENTED — distinctive user model.** FL Studio separates four default
  identity axes: a project-wide Channel Rack of instruments/generators;
  Patterns containing note/step/automation data across those Channels;
  multi-purpose Playlist lanes arranging Pattern, Audio, and Automation Clips;
  and Mixer tracks addressed primarily by Channels, not Playlist lanes
  [C-004, C-005]. **INFERENCE:** this orthogonality, plus optional Track Mode,
  is a more accurate architectural description than calling every lane a
  conventional DAW track [C-006].
- **DOCUMENTED — host headline.** All editions advertise VST2, VST3, generic
  Audio Unit, and CLAP hosting. The detailed current matrix establishes
  VST1/2, VST3, and CLAP on Windows/macOS, plus generic 64-bit AU on macOS
  [C-002, C-012]. The AU documentation does not distinguish AUv2 from AUv3,
  so version-specific rows remain **UNKNOWN** [C-013].
- **DOCUMENTED — scanning and compatibility.** Fast scan lists binaries;
  Verify opens and classifies plugins, captures unique VST identities,
  bitness and ports, and records OK/Error. Rescan controls cover verified and
  errored plugins. The Plugin Database is a user-curated preset/metadata layer
  and can combine VST2/VST3 or 32/64-bit variants [C-010, C-011]. No public
  quarantine, blacklist, scanner-process, or code-signature policy was found.
- **DOCUMENTED — runtime.** Non-bridged plugins execute inside FL Studio;
  bridged VST plugins execute in a separate process. Windows automatically
  bridges a 32-bit VST into the current 64-bit host; native Apple-Silicon FL
  bridges Intel VSTs, while Rosetta mode emulates host and plugins [C-014,
  C-015]. The vendor says a bridged-plugin crash is *less likely* to crash FL,
  not that failure is fully contained [C-014].
- **DOCUMENTED — host contract depth.** Wrapper controls expose published
  parameters/CC, MIDI ports, sidechain and multi-I/O mapping, latency and
  manual correction, render-mode notification, fixed-buffer compatibility,
  per-plugin threading/smart-disable settings, GUI focus/scaling, presets and
  channel state [C-016, C-017]. **UNKNOWN:** sample-accurate third-party
  automation, tail reporting, dynamic-I/O callback semantics, MIDI 2.0, MPE
  negotiation, parameter-ID migration, and missing-plugin opaque-state
  survival [C-018].
- **DOCUMENTED — durability limits.** Cross-machine recall requires the same
  or newer FL version and matching plugin format/version/license. `.flp`
  stores project/plugin settings but not samples; zipped loop packages bundle
  FL-managed samples, not plugin binaries or samples privately managed by a
  plugin. A missing instrument becomes an empty Channel; a crashing plugin can
  be skipped or removed from a recovered copy [C-019, C-024].
- **DOCUMENTED — commercial lineage.** Lifetime Free Updates applies to the
  owned edition and included-at-purchase plugins for as long as FL Studio is
  developed, but not to every future plugin or higher edition. Image-Line
  describes the promise as 27 years old at cutoff [C-003].

**Overall confidence:** high for the public workflow, edition, format,
scanning, wrapper, routing, and license contract; medium for cross-version
recall because plugin behavior is third-party-dependent; low/unknown for
proprietary process topology, scanner containment, exact timing fidelity,
binary project internals, security controls, and accessibility [C-018,
C-028].

## 2. Product identity, history, and market position

FL Studio is a maintained Image-Line desktop music-production DAW. The
cutoff release is FL Studio 2026 / 26.1.5, dated 2026-08-18, on Windows and
macOS [C-001]. The current commercial family is Fruity, Producer, Signature,
and All Plugins [C-002]. Image-Line's edition manual describes Fruity and
Producer as the two core-function levels, with higher bundles chiefly adding
native plugins; the current comparison also gives Fruity eight Audio Clips
but reserves audio recording and fuller audio workflows for Producer and up
[C-002].

Image-Line documents Lifetime Free Updates as a 27-year practice and release
material says “since 1998.” The bounded lineage established here is therefore
the continuous update promise, not an independently reconstructed chronology
of every FruityLoops/FL Studio rename [C-003]. An attempted official `/history/`
page yielded no historical content, so the detailed early product chronology
is **UNKNOWN** rather than sourced from secondary retrospectives [C-031].

The product is positioned for pattern/piano-roll composition, beat making,
recording, arrangement, mixing, sound design, and delivery. This is a scope
description derived from the documented feature set, not a market-share or
quality ranking [C-002, C-004, C-005, C-022, C-025].

## 3. Workflow and conceptual model

### Core object model

1. **Channel Rack.** Holds instruments and internal automation generators.
   Every Pattern accesses the same project-wide Channel set. Each Channel can
   have step data and a Piano-roll score and routes audio to a Mixer track
   [C-004].
2. **Pattern.** A Pattern may contain Step Sequencer, Piano-roll, and
   automation/event data spanning multiple Channels. It is not necessarily
   “one instrument” [C-004].
3. **Playlist.** Arranges Pattern Clips, Audio Clips, and Automation Clips on
   multi-purpose lanes. Any clip type can appear on any lane and clips can
   overlap [C-005].
4. **Mixer.** Receives Channel and external-input audio independently of the
   Playlist lane on which a clip is shown. Inserts form routing/effect
   destinations; the Master is the usual final output [C-007].
5. **Track Mode.** Dropping an instrument/sample on a Playlist header can bind
   Instrument/Audio Channel ↔ Playlist Track ↔ Mixer track for a conventional
   one-to-one workflow [C-005].

**INFERENCE:** Pattern identity, Playlist placement, and audio-routing identity
are orthogonal by default, while Track Mode is an opt-in relational view over
them. A plausible alternative is that modern users experience Track Mode as
the primary model; the current manual nevertheless calls unbound Playlist
tracks the default, so the orthogonal interpretation is retained [C-006].

Automation Clips are themselves Channel-hosted internal controllers, not
Pattern-bound events, although recorded automation initially becomes
Pattern-bound Event Data and can be converted [C-017]. Patcher adds a nested,
user-visible modular graph, but it does not prove the shape of FL Studio's
proprietary global engine graph [C-023, C-028].

## 4. Publicly documented architecture

Public documentation establishes these boundaries only:

- **DOCUMENTED:** native and third-party wrappers sit between plugins and FL
  Studio; non-bridged plugins run inside FL Studio, bridged VSTs outside it in
  a separate process [C-014].
- **DOCUMENTED:** Patcher exposes a nested graph with audio, event, and
  parameter edges. Same-depth modules can process concurrently and deeper
  columns sequentially; latency is shown and compensated within Patcher
  [C-023].
- **DOCUMENTED:** user controls enable multithreaded generator and Mixer
  processing, per-plugin threading, an audio-thread priority, and “Safe
  overloads” behavior [C-008].
- **UNKNOWN:** engine graph representation, worker-pool design, lock-free
  strategy, thread count/affinity, bridge IPC, bridge granularity, scanner
  process, crash-restart protocol, autosave transactionality, `.flp` schema,
  and service/backend architecture. These are not inferred from UI labels
  [C-028].

## 5. Audio engine

- **Graph and precision — DOCUMENTED.** All audio passes through the Mixer;
  current documentation states that 32-bit float is the native mix-engine
  format [C-007, C-008]. This is a vendor statement, not an independent null
  test.
- **Device APIs — DOCUMENTED.** Windows uses ASIO or standard Windows drivers;
  macOS uses Core Audio. Native interface ASIO is preferred over FL Studio
  ASIO, which is a WASAPI-backed compatibility layer [C-008].
- **Buffers/real time — DOCUMENTED.** Buffer length trades latency against
  underrun risk. FL exposes an underrun counter, audio-thread priority, Safe
  Overloads, triple-buffering options on Windows, and separate multithreaded
  generator/Mixer switches [C-008]. Some driver/options bypass the underrun
  counter; rendered glitches are not classified as live underruns [C-008].
- **Scheduling — DOCUMENTED boundary.** User-visible controls and Patcher
  depth columns establish controllable concurrency, but exact scheduler
  internals remain **UNKNOWN** [C-008, C-023, C-028].
- **PDC — DOCUMENTED.** Automatic Plugin Delay Compensation handles reported
  instrument/effect latency, inter-track routing, multi-I/O, and sidechains.
  Manual track offsets and persistent per-plugin overrides handle missing or
  incorrect reports. Manual PDC cannot provide the chain location needed by
  automation compensation, for which a two-track workaround is documented
  [C-009].
- **Suspend/render — DOCUMENTED.** Smart Disable can suspend inactive plugins
  during live playback and is disabled during render; incompatible long-tail
  or time-based plugins can opt out. Offline render can notify third-party
  plugins and offers tail leave/wrap/cut [C-016, C-025].
- **UNKNOWN:** internal accumulation precision beyond the stated native
  32-bit-float format, denormal policy, oversampling policy, deterministic
  render guarantees, realtime safety enforcement, and third-party tail-report
  consumption [C-018, C-028].

## 6. Tracks, timeline, clips, and editing

The Playlist sequences Pattern, Audio, and Automation Clips on flexible lanes;
Clip type and Mixer destination are not fixed by lane unless Track Mode is
used [C-005]. Pattern Clips can drive many Channels and Mixer tracks. Audio
Clips are disk-backed project objects; Automation Clips are spline/step/LFO
controllers; Patterns hold note/step/event material [C-004, C-005, C-017].

Current documentation covers audio-clip gain/pan/pitch, resize/stretch,
normalization, grouped Playlist tracks, overlapping clips, multiple time
signatures, and ghost-note views across overlapping Patterns [C-001, C-020].
Loop recording produces separate Audio Clips or Edison regions, and users
compile takes by consolidation/bounce [C-022]. A dedicated swipe-comp lane
model was not found and is **UNKNOWN**, not declared absent.

Playlist placement and clip operations are project-level edits, but the exact
destructive/non-destructive boundary for every native audio editor, source-file
mutation rules, edit-decision persistence, ripple modes, and take-lane state
model were not fully established [C-028].

## 7. MIDI, sequencing, notation, and expression

- **DOCUMENTED:** Step Sequencer and Piano roll record/edit note data; note
  properties include velocity, release velocity, pan, pitch, Mod X/Y, start,
  and duration. Sixteen note-color groups map to wrapper-visible MIDI channels
  [C-020].
- **DOCUMENTED:** native slide/portamento and per-note behavior are richer than
  the generic wrapper path and explicitly do not apply to VST instruments.
  Wrapper options can send release velocity, pitch-bend range, 128 CC
  parameters, and Mod X as polyphonic aftertouch [C-017, C-020, C-030].
- **DOCUMENTED:** hardware MIDI input/output, MIDI Clock master/slave, generic
  and scripted controllers, MIDI-file import/export, and raw SysEx callbacks
  in controller scripts exist [C-020, C-021, C-025].
- **UNKNOWN:** MIDI 2.0/UMP, formal MPE zone/profile negotiation, VST3 note
  expression mapping, arbitrary SysEx recording/playback in projects, and
  sample-accurate event delivery [C-018].
- A full notation/score-layout system and MusicXML interchange were not
  established. MIDI/score-sheet affordances are not treated as proof of a
  notation workstation [C-028].

## 8. Routing, mixer, automation, and control

The Mixer documents 500 stereo inserts, a utility Current track, Master, ten
effect slots per insert, internal sends, direct device outputs, and multiple
external inputs [C-007]. Inserts can form groups/subgroups. Sends are
post-fader by default; Fruity Send can tap a pre-fader point. The routing UI
prevents a source from selecting an invalid feedback destination [C-007].

Every audible send also exposes a sidechain path; setting its audible level to
zero yields sidechain-only routing. Wrapper input mapping assigns sidechained
Mixer sources to multi-input plugin buses, and output mapping fans a plugin's
outputs to following Mixer tracks [C-016]. FL Studio documents discrete
hardware-output arrangements for 5.1/7.1, not a native immersive/object bus
model [C-007]. VCAs and formal folder-bus semantics were not established.

Automation Clips can target native or published third-party parameters, use
curves/steps/LFOs, link one-to-many or many-to-one, and initialize controls at
song start [C-017]. Hardware links support pickup/takeover and persistent
global mappings. FL Studio Remote supplies a Wi-Fi control surface; Python
MIDI scripts provide deeper bidirectional hardware integration [C-020,
C-021]. Sample-accurate plugin automation is **UNKNOWN** [C-018].

## 9. Recording, comping, and media handling

Producer Edition or higher is required for external audio recording. External
and internal audio enter Mixer tracks; all available interface inputs can be
armed concurrently. Pickup points include direct external input, pre-effects,
post-effects, post-EQ, post-level/pan, and post-mute. Monitoring can be off,
armed-only, or always-on [C-022].

Playlist recording writes Audio Clips to disk; Edison records into memory and
can mark loop passes as regions. Loop recording creates multiple passes, while
consolidation/bounce compiles selected material [C-022]. Native-interface ASIO
is recommended because FL Studio ASIO can introduce alignment jitter; global
and per-input compensation controls exist [C-008, C-009, C-022].

The Browser searches configured locations for media. `.flp` records paths;
zipped loop packages or project data folders can collect FL-managed samples.
Samples privately referenced by third-party plugins are not collected
automatically [C-024]. Detailed metadata conform, proxy, broadcast-wave,
video-conform, and asset-hash behavior are **UNKNOWN** [C-028].

## 10. Instruments, effects, content, and native devices

Image-Line's native format is an enhanced proprietary plugin standard with
native right-click automation/linking and per-note slide/legato capabilities
[C-030]. Native and third-party devices are both presented through wrappers,
but only VST-hosted wrappers expose certain VST-specific compatibility tabs
[C-014, C-017]. Edition bundles differ substantially in instruments/effects;
those inventory differences do not change the documented third-party format
support [C-002, C-012].

Patcher is the architecture-relevant native container: it can host instruments
and effects as an instrument or effect, route audio/events/parameters, expose
selected parameters to custom Control Surfaces, compensate internal latency,
and save reusable graph presets [C-023]. Its graph and native expressive
features are useful references but proprietary format details and authoring
SDK are **UNKNOWN** [C-028].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN:not documented` means the official current format list supplied no
positive row-specific evidence; omission alone is not treated as proof of
rejection. Mobile/web is out of this dossier's product boundary.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **DOCUMENTED:** 64-bit VST1/2 | **DOCUMENTED:** 64-bit native; 32-bit VST can auto-bridge | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** excluded product boundary | All editions; FL 2026/26 | Instruments/effects; standard + custom VST2 paths; VST2 upstream discontinued | C-002, C-012, C-015, C-027; S-001, S-014, S-015, S-025 |
| VST3 | **DOCUMENTED:** 64-bit | **DOCUMENTED:** 64-bit native; official locations also document legacy 32-bit binaries | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** excluded product boundary | All editions; FL 2026/26 | Instruments/effects; system locations; current VST3 SDK license separately reviewed | C-002, C-012, C-027; S-001, S-014, S-015, S-026 |
| AUv2 | **UNKNOWN:** generic 64-bit AU is documented, but the manual does not name AUv2 | **NOT_APPLICABLE:** Apple/macOS format | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** excluded product boundary | Generic AU in all editions; version split unstated | `.component` location documented; AU MIDI output unsupported; do not infer v2 label | C-012, C-013; S-001, S-014, S-015 |
| AUv3 | **UNKNOWN:** generic 64-bit AU is documented, but AUv3 is not named | **NOT_APPLICABLE:** Apple/macOS format | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** excluded product boundary | Generic AU in all editions; version split unstated | No Audio Unit extension/app-host contract found | C-012, C-013; S-001, S-014, S-015 |
| AAX | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** excluded product boundary | No edition/version evidence | Current official format list omits AAX; omission is not a runtime probe | C-013; S-015 |
| CLAP | **DOCUMENTED:** 64-bit system location | **DOCUMENTED:** system location | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** excluded product boundary | All editions; introduced in FL Studio 2024.1, current in 2026/26 | Instruments/effects documented generally; format-specific deep contract sparse | C-002, C-012, C-018; S-001, S-014, S-015 |
| LV2 | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** excluded product boundary | No edition/version evidence | Current official format list omits LV2 | C-013; S-015 |
| LADSPA | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** excluded product boundary | No edition/version evidence | Current official format list omits LADSPA | C-013; S-015 |
| DSSI | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** excluded product boundary | No edition/version evidence | Current official format list omits DSSI | C-013; S-015 |
| JSFX | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** excluded product boundary | No edition/version evidence | Current official format list omits JSFX | C-013; S-015 |
| DirectX/DXi | **UNKNOWN:** no current positive support evidence | **UNKNOWN:** stale Wrapper wording mentions VST/DX, but current format list omits DX/DXi | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** excluded product boundary | No reliable current edition/version evidence | Contradictory/stale-reference boundary; do not claim current hosting | C-013; S-012, S-015 |
| Rack Extension | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** excluded product boundary | No edition/version evidence | Current official format list omits Rack Extension | C-013; S-015 |
| Product-native/other | **DOCUMENTED:** Image-Line proprietary native format | **DOCUMENTED:** Image-Line proprietary native format | **NOT_APPLICABLE:** no supported desktop Linux product | **NOT_APPLICABLE:** mobile excluded | All editions, but included native devices vary by bundle | Enhanced native automation/per-note functions; no public authoring SDK established | C-002, C-012, C-030; S-001, S-015, S-021 |

### 11.2 Discovery, scanning, validation, and recovery

- **Paths — DOCUMENTED.** VST1/2 can use extra search paths; VST3, AU, and
  CLAP use documented system locations. Plugin binaries are not installed into
  the FL Studio native-plugin folder [C-010, C-012].
- **Modes — DOCUMENTED.** Fast scan lists binaries. Verify opens plugins,
  classifies Synth/Effect, records 32/64-bit and I/O ports, and may block on a
  plugin popup. Status is OK/Error [C-010].
- **Identity — DOCUMENTED.** Fast VST scans rely on filename; Verify captures
  unique IDs that survive file renaming. This is why verified scans are
  recommended before project exchange [C-010, C-011].
- **Duplicates — DOCUMENTED.** Optional database combinations merge VST2/VST3
  presets (preferring VST3) or 32/64-bit variants; the selected wrapper bitness
  determines which binary loads [C-011].
- **Cache/database — DOCUMENTED.** The user Plugin Database contains `.fst`
  default state, `.nfo` metadata, and optional thumbnail, organized into
  Installed and user Favorites. Removing a favorite does not uninstall the
  plugin [C-011].
- **Recovery — DOCUMENTED.** Controls rescan previously verified plugins and
  plugins with errors. Apple-Silicon and Rosetta modes require separate
  verified inventories [C-010, C-015].
- **UNKNOWN:** blacklist/denylist, quarantine, signature/notarization
  enforcement, scan timeouts, scanner process isolation, transactional cache,
  duplicate-ID collision policy, and unattended/headless validation [C-018,
  C-028].

### 11.3 Runtime isolation and compatibility

Non-bridged plugins run inside FL Studio. “Make bridged” runs a VST in a
separate process. It can isolate memory, bridge Windows bitness, improve the
chance that a plugin crash does not take down FL Studio, or enable scaling;
the vendor also warns of CPU overhead and possible reduced plugin stability
[C-014]. This is opt-in for architecture-matched VSTs and automatic for
Windows cross-bitness [C-014, C-015].

Current FL Studio is 64-bit-only. Windows can bridge 32-bit VSTs. macOS accepts
only 64-bit VST/AU plugins. Native Apple-Silicon FL process-bridges Intel VSTs;
macOS handles AU translation, while Rosetta mode emulates the Intel host and
plugins. Each mode has a distinct verified plugin inventory [C-015].

**UNKNOWN:** whether bridges are per instance, binary, vendor, or architecture;
IPC transport; realtime scheduling across the bridge; CLAP separation;
automatic bridge restart; state checkpoint frequency; and whether scan-time
instantiation shares the runtime bridge [C-018, C-028].

### 11.4 Host/plugin processing contract

- **Audio I/O — DOCUMENTED.** Wrapper controls discover and map multiple
  inputs/outputs. Effects consume sidechained Mixer sources; outputs can map to
  subsequent Mixer tracks. “Process inactive inputs and outputs” covers
  plugins that mislabel active buses [C-016].
- **Sidechain — DOCUMENTED.** Mixer sidechain-only links are inaudible until a
  plugin input consumes them. Auto-map orders sidechains by source track;
  manual indexes/offsets are available [C-016].
- **MIDI/events — DOCUMENTED.** Instrument wrappers receive notes, CC,
  pitch-bend range, release velocity and optional poly-aftertouch; wrapper
  MIDI ports connect plugins/hardware. AU MIDI output is explicitly unsupported
  [C-016, C-020].
- **Latency — DOCUMENTED.** Reported plugin latency feeds APDC through
  sidechains and multi-I/O; incorrect reports can be overridden per plugin or
  Mixer track [C-009].
- **Buffers/threading — DOCUMENTED.** Default variable-size buffers can be
  replaced with fixed-size compatibility modes; plugin threading and Smart
  Disable can be disabled per plugin [C-008, C-016].
- **Offline — DOCUMENTED.** Wrapper can notify plugins of rendering mode;
  compatibility guidance allows disabling notification if render fails
  [C-016, C-025].
- **UNKNOWN:** sample-accurate automation/event offsets, tail-length reporting,
  bypass vs suspend semantics, dynamic bus renegotiation callbacks, headless
  render behavior, MIDI 2.0/MPE, CLAP note-expression/modulation, and exact
  silence/sleep contracts [C-018].

### 11.5 Parameters, automation, state, presets, and project recall

Published plugin parameters appear in Current Project/Wrapper lists, can use
Last Tweaked, link to hardware, and drive Automation Clips. Automation points
use normalized 0–1 values with curves/steps; Wrapper change notifications feed
Last Tweaked and optional undo history [C-017]. Parameter unit/text fidelity,
stable IDs across plugin updates, and sample accuracy are **UNKNOWN** [C-018].

Wrapper facilities include plugin preset browsing, VST FXP/FXB import/export,
FL `.fst` preset/channel state, a temporary spare state, per-plugin wrapper
options, GUI settings in favorite presets, and project-stored plugin settings
[C-017, C-024]. The public docs do not identify whether opaque chunks,
parameter snapshots, or both are persisted for each format [C-018].

A missing instrument is replaced with an empty Channel and warned; exact-name,
format/version, verified identity and architecture determine recovery
[C-019]. Because state survival after opening and re-saving such a project is
not documented, do not overwrite the sole copy. Native trial plugins have
separate licensing risk, and collaborators should bounce unavailable devices
to audio [C-002, C-024].

### 11.6 UI, diagnostics, and failure modes

- **UI — DOCUMENTED.** Plugin editors can be shown/hidden, embedded in the
  wrapper, detached, moved across displays, DPI-marked, dimension-scaled, or
  externally windowed when bridged. Focus priority, keyboard forwarding, GUI
  invalidation/idle, and update-when-hidden are configurable [C-017].
- **Failure compatibility — DOCUMENTED.** Controls include fixed buffers,
  time-offset mode, transport reset, All Notes Off, inactive-I/O processing,
  rendering notification, thread disable, Smart Disable disable, and GUI
  refresh options [C-016, C-017].
- **Diagnostics — DOCUMENTED.** Scan status identifies Error; load can be
  skipped with ESC; Diagnostics can remove a crashing plugin from a copied
  recovered project; autosave backups are available [C-010, C-019, C-029].
- **Crash modes — DOCUMENTED boundary.** In-process plugins may crash the host;
  bridged VSTs are *less likely* to do so but can themselves become less stable
  or steal focus/audio-device access [C-014].
- **UNKNOWN:** automatic quarantine, plugin-host watchdog, bridge restart,
  per-plugin crash dumps, state replay, UI headless mode, code-signature policy,
  and deterministic recovery after mid-session crash [C-018, C-028].

## 12. Extensibility and integration

FL Studio's documented extension boundary is primarily controller-oriented.
Python MIDI scripts are plain-text, event-driven, bidirectional integrations
with modules for Playlist, Channels, Mixer, Patterns, arrangements, UI,
transport, devices, plugins, and general state. They receive raw MIDI, SysEx,
notes, CC and pressure and can be reloaded/tested in a Script Output
interpreter [C-021]. Generic MIDI and preconfigured controllers coexist with
scripts; FL Studio Remote supplies a configurable Wi-Fi surface [C-020,
C-021].

Patcher/VFX Script extend project-contained event/parameter graphs [C-023].
This evidence does **not** establish a general native audio-plugin SDK, arbitrary
audio-thread scripting, project-file API, or stable ABI. Script sandboxing,
permissions, Python runtime version, compatibility guarantees, package trust,
and resource limits are **UNKNOWN** [C-028].

## 13. Project format, persistence, interoperability, and collaboration

- **Formats — DOCUMENTED.** `.flp` stores notes/sequencing and settings for
  instruments, effects, Channels and project objects; sample files remain
  external. FL `.zip`/zipped loop packages include `.flp` plus FL-managed
  samples, not plugin binaries or samples privately referenced inside
  third-party plugins [C-024].
- **Compatibility — DOCUMENTED.** Newer FL opens older projects; older FL
  cannot open projects saved by newer versions. Windows/macOS project files are
  compatible when required plugin builds and formats match [C-024, C-026].
- **Third parties — DOCUMENTED.** Use matching VST/VST3/CLAP format/version on
  both platforms and verified scans; AU is not automatically matched to VST.
  Bounce unavailable plugins to audio [C-024]. One Apple-Silicon page says
  “VST” as the only cross-platform format, while the newer dedicated sharing
  guidance explicitly lists VST, VST3, and CLAP; the dedicated sharing page is
  retained as the current scoped rule [C-024].
- **Missing dependencies — DOCUMENTED.** Missing instruments become empty
  Channels; missing samples are red and searched in configured folders. A
  crashing plugin can be skipped or removed from a recovered copy [C-019].
- **Backups — DOCUMENTED.** Configurable local autosaves, sequential Save New
  Version, and FL Cloud project backups exist. Cloud backup stores one copy per
  project name rather than continuous versioned synchronization [C-029].
- **UNKNOWN:** `.flp` schema/versioning, atomic-save strategy, state survival
  through missing-plugin open/save, merge/version-control semantics, AAF/OMF,
  ADM, DAWproject, MusicXML, and collaborative conflict resolution [C-018,
  C-028].

## 14. Delivery, live, post-production, and specialized workflows

Offline rendering exports WAV, MP3, OGG, FLAC, M4A and MIDI, supports mono or
stereo audio, configurable tails, dithering, interpolation, split Mixer-track
stems, Playlist-track exports, marker metadata, PDC trimming, and optional
insert/Master effects [C-025]. Command-line rendering can batch projects.
External hardware must be recorded into the project before offline rendering
[C-025].

Playlist Performance Mode triggers clip columns; the product includes video
playback/visualization at edition-dependent levels [C-001, C-002]. Discrete
5.1/7.1 monitoring can be assembled with hardware outputs [C-007].

No primary evidence in scope established DDP authoring, ADR, conform, AAF/OMF,
ADM/object-based immersive delivery, show-control guarantees, or a dedicated
broadcast/video-post timeline. These remain **UNKNOWN**, not claimed absent
[C-028].

## 15. Performance, reliability, security, and accessibility

Performance controls include buffer size, audio-thread priority, Safe
Overloads, generator/Mixer multithreading, per-plugin threading, Smart Disable,
Patcher performance views, bridge bitness, plugin-performance diagnostics,
freeze/consolidation, and offline rendering [C-008, C-014, C-023, C-025].
Reliability mechanisms include local backups, project recovery by plugin
removal, error rescans, fixed-buffer compatibility, manual PDC, parallel FL
versions, and older installers [C-009, C-010, C-019, C-026, C-029].

Plugin trust is broad: Verify opens third-party code, normal plugins execute
inside the DAW, and separate-process bridging is optional/format-limited
[C-010, C-014]. No public sandbox, entitlement, code-signature, quarantine,
scanner-isolation, permission, or telemetry contract was found [C-028].

UI scaling, detachable windows, themes, and multi-touch are documented, but
screen-reader semantics, keyboard-only completeness, WCAG conformance,
reduced-motion behavior, and accessibility testing are **UNKNOWN** [C-017,
C-028]. Localization breadth and privacy/telemetry defaults were not qualified.

## 16. Licensing, ecosystem, and implementation constraints

- **FL license — DOCUMENTED.** One personal license covers Windows and macOS
  and multiple computers only when the licensee is the sole user. Sharing or
  unattended use by others is prohibited [C-026].
- **Activation/update — DOCUMENTED.** Online account unlock and offline regkey
  unlock exist. One installer serves all editions; entitlement unlocks the
  edition and plugins. Older/parallel versions are available [C-026].
- **Lifetime Free Updates — DOCUMENTED.** Future FL versions for the owned
  edition and updates to included-at-purchase plugins are free for as long as
  Image-Line develops FL Studio. New plugins may be paid or assigned to higher
  editions; LFU is not “everything forever” [C-003].
- **VST — DOCUMENTED boundary.** Steinberg marks VST2 discontinued, while FL
  Studio still hosts it. The current upstream VST3 SDK `master` license fetched
  at cutoff is MIT. Neither fact grants trademark, certification,
  redistribution, patent, third-party component, or compatibility rights
  [C-027].
- **UNKNOWN/legal review required.** AU, CLAP, AAX, format trademarks,
  redistributable SDK pieces, signing/notarization, certification, and any
  private Image-Line agreements. This dossier is not legal advice [C-027,
  C-028].

## 17. Strengths, liabilities, and architecture lessons

### Evidence-backed strengths

- Orthogonal Pattern/Channel/Playlist/Mixer identities support dense pattern
  reuse and flexible arrangement, while Track Mode offers a conventional
  linked view [C-004, C-005, C-006].
- The wrapper centralizes compatibility, parameter exposure, routing, PDC,
  GUI, preset, render and troubleshooting controls [C-016, C-017].
- Verified identity, explicit rescans, user-curated plugin database, and
  format/bitness combination policies make plugin discovery inspectable
  [C-010, C-011].
- Separate-process VST bridging is available as a targeted compatibility/crash
  tool rather than mandatory overhead [C-014, C-015].
- Patcher demonstrates a reusable nested audio/event/parameter graph with a
  custom surface and visible latency/performance information [C-023].
- LFU reduces host-version fragmentation for licensed users, though plugin and
  edition dependencies remain [C-003, C-026].

### Evidence-backed liabilities and risks

- The default orthogonal model can confuse users expecting one track to own
  media, instrument, mixer, and automation identity [C-005, C-006].
- Normal third-party code runs in-process; bridging is VST-specific and only
  probabilistically contains crashes [C-014]. Scanner isolation/quarantine is
  not documented [C-028].
- Missing instruments become empty Channels, and opaque state survival after
  missing-instance re-save is unknown [C-019].
- Cross-platform recall is format/version/license-dependent; AU does not map to
  VST and plugin-owned assets are not collected [C-024].
- Generic AU documentation does not distinguish AUv2/AUv3, and the current
  support list leaves many required formats unresolved [C-013].
- Many host-contract details needed for conformance remain documentary
  unknowns and need controlled probes [C-018].

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Support | Prerequisites | Tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Reuse musical phrases across instruments | Separate instrument identity, reusable pattern identity, and arrangement instances | C-004, C-005 | Stable object IDs and explicit routing | Powerful but cognitively harder than one universal track | **CANDIDATE** |
| Serve both pattern and linear users | Optional linked Track Mode over orthogonal core objects | C-005, C-006 | Bidirectional lifecycle/rename/delete rules | Hidden coupling and deletion ambiguity must be surfaced | **CANDIDATE** |
| Make plugin discovery diagnosable | Two-tier fast/verified scan; explicit OK/Error, type, bitness, ports, rescan controls | C-010 | Safe disposable scanner and stable plugin identity | Verification executes untrusted code; FL scanner isolation is unknown | **CONDITIONAL** |
| Keep plugin selection user-curated | Separate installed inventory from favorite preset/metadata database | C-011 | Portable metadata schema and rebuild path | Duplicate/version drift; thumbnails/presets can stale | **CANDIDATE** |
| Centralize compatibility policy | Per-plugin wrapper for threading, sleep, buffers, GUI, I/O, latency and render mode | C-016, C-017 | Versioned settings and reset/audit UX | Switch proliferation can become support folklore | **CANDIDATE** |
| Contain selected unstable/legacy plugins | Optional separate-process hosting with explicit cost/status | C-014, C-015 | Robust IPC, watchdog, checkpoint/restart design | FL evidence does not establish deterministic containment or restart | **CONDITIONAL** |
| Support arbitrary plugin buses | Explicit sidechain-only links plus auto/manual multi-I/O mapping | C-016 | Stable bus identity, PDC graph integration | Index/offset mappings are fragile under dynamic I/O | **CANDIDATE** |
| Repair bad latency reports | Automatic PDC plus per-instance/track and remembered per-plugin offsets | C-009 | Visible latency provenance and test fixture | Manual values age as plugins update | **CANDIDATE** |
| Reuse complex device chains | Nested audio/event/parameter graph with a separately designed control surface | C-023 | Graph serialization, latency, validation, cycle policy | Can hide complexity and increase support burden | **CANDIDATE** |
| Recover projects blocked by plugins | Skip-on-load, autosaves, and non-destructive recovered-copy creation | C-019, C-029 | Immutable original, structured diagnostics | Removing plugins loses behavior; placeholders would be safer | **CONDITIONAL** |
| Reduce paid host-version fragmentation | Long-lived entitlement to host updates, edition-scoped | C-003, C-026 | Sustainable business model and migration discipline | Does not solve third-party/plugin/OS obsolescence | **CONDITIONAL** |

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected adaptation patterns

- **Do not copy “empty Channel” as the primary missing-plugin model.** It
  provides visibility but no documented opaque-state placeholder guarantee.
  Prefer an inert, serializable placeholder retaining identity, buses,
  parameters, state bytes, automation links, and diagnostics [C-019].
- **Do not make in-process hosting the only/default trust policy without an
  isolation plan.** FL's bridge is useful evidence, but its “less likely” crash
  containment is not a guarantee [C-014].
- **Do not infer host conformance from a format logo/list.** FL's own wrapper
  exposes numerous compatibility modes and unresolved sample-accuracy/tail/I/O
  questions [C-012, C-016, C-018].
- **Do not expose offset-only multi-I/O identities without durable bus IDs.**
  FL's indexes are usable but dynamic-I/O migration behavior is unknown
  [C-016, C-018].
- **Do not reproduce proprietary UI expression, native format, `.flp` layout,
  scripts, or assets.** Only abstract mechanisms are candidates [C-028].

### CURIOSITY_NO_GO

- `CURIOSITY_NO_GO — AUv2/AUv3 distinction:` high relevance but expected
  documentary yield fell below the chosen automation thread; Image-Line only
  says generic 64-bit AU. Reopen with an explicit Image-Line AU version matrix
  or disposable AUv2/AUv3 fixtures.
- `CURIOSITY_NO_GO — bridge topology/restart:` high decision value but high
  cost and likely proprietary. Reopen with vendor engineering disclosure or a
  process-tree/crash harness in a disposable environment.
- `CURIOSITY_NO_GO — DirectX/DXi status:` current support page omits it while
  Wrapper wording mentions DX; discovery was rate-limited. Reopen only for a
  Windows legacy-compatibility decision.
- `CURIOSITY_NO_GO — .flp binary internals:` outside the documentary need and
  risks crossing the clean-room boundary. Reopen only with public vendor schema
  documentation; do not reverse engineer.
- `CURIOSITY_NO_GO — exhaustive native-plugin inventory:` low architectural
  novelty; edition comparison already establishes bundle variability.
- `CURIOSITY_NO_GO — FL Studio Mobile/Web:` expressly outside the roster
  boundary.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test / countersearch | Result | Adversarial limit / later probe |
| --- | --- | --- | --- |
| H1: Playlist tracks own instrument and Mixer identity by default | Compare Channel Rack, Playlist and Mixer manuals | **Falsified.** Lanes are multi-purpose and unbound by default; Track Mode creates links [C-004–C-006] | Create/delete/rename linked Track Mode objects and record lifecycle behavior |
| H2: Every edition hosts the same third-party formats | Compare edition page with format manual | **Supported for advertised VST2/VST3/AU/CLAP** [C-002, C-012] | Instantiate one instrument/effect per format in every licensed edition |
| H3: “AU support” proves AUv2 and AUv3 | Search official format/install pages for version terms | **Not supported; UNKNOWN** [C-013] | Scan known AUv2 component and AUv3 app extension on current macOS |
| H4: Verified scan is only a filename crawl | Read Plugin Manager/install docs | **Falsified.** Verify opens, classifies, records bitness/I/O and unique IDs [C-010] | Observe scanner processes, timeout, crash, quarantine and cache updates |
| H5: All hosted plugins run in-process | Read Wrapper/bridging docs | **Falsified.** Default non-bridged is in-process; bridged VST is separate-process [C-014] | Map process granularity and crash/restart behavior |
| H6: Separate process guarantees host survival | Adversarially read vendor wording | **Falsified as a guarantee.** Vendor says “less likely” [C-014] | Crash/hang one instance under each bridge mode |
| H7: VST2/VST3/AU/CLAP names imply complete equivalent contracts | Compare wrapper, AU limitations, format docs | **Falsified.** AU lacks MIDI output; format-specific timing/state details remain unknown [C-016, C-018] | Differential bus/event/automation/state/render suite |
| H8: APDC covers routed plugin graphs | Read PDC manual for sidechain/multi-I/O | **Supported for reported latency** [C-009] | Impulse tests with correct, absent, wrong and dynamically changing reports |
| H9: third-party automation is sample-accurate | Exact official search plus automation/wrapper manuals | **UNKNOWN.** No promise found; final searches hit HTTP 429 [C-018] | Timestamped gain/parameter test at multiple PPQs/buffers/render modes |
| H10: project ZIP is self-contained | Read Browser/share guidance | **Falsified.** No plugin binaries or plugin-private assets [C-024] | Inventory archive and restore on a clean machine |
| H11: missing plugins persist as stateful placeholders | Read missing-files/recovery docs | **Falsified as a documented claim.** Missing instrument becomes empty Channel [C-019] | Open copy, save, reinstall exact plugin and compare recovered state/automation |
| H12: LFU grants every future plugin | Compare marketing and LFU manual exception | **Falsified.** Edition/included plugins are scoped; later devices can be paid/higher-tier [C-003] | Entitlement test is account-specific; no need for architecture decision |

The key adversarial distinction remains explicit: **format accepted** does not
prove **scan succeeds**; successful scan does not prove **instantiate/render**;
instantiation does not prove **automation, buses, latency, state, UI, crash,
offline, migration, and recovery** fidelity [C-010, C-012, C-016, C-018].

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Cutoff release is FL Studio 2026/26.1.5 (2026-08-18); supported desktop targets are Windows 10/11 Intel/AMD and macOS 10.15+ Intel/Apple Silicon. | Current desktop/cutoff | S-003, S-004 | Release log + requirements | Windows ARM may run but is unsupported; no Linux product |
| C-002 | DOCUMENTED | High | Current editions are Fruity, Producer, Signature and All Plugins; bundle/core-audio capabilities differ, while advertised third-party hosting is in all editions. | Current commercial desktop | S-001 | Current edition table | Product page may change after cutoff |
| C-003 | DOCUMENTED | High | LFU covers future FL versions for the owned edition and included-at-purchase plugins, not every future plugin; promise is 27 years old and conditional on continued development. | License/update lineage | S-002, S-029 | Manual resolves marketing shorthand | Vendor promise, not escrow or solvency guarantee |
| C-004 | DOCUMENTED | High | Channel Rack is a shared instrument/generator set; Patterns span Channels and contain step, Piano-roll and automation data. | Workflow | S-005 | Direct manual statement | No internal storage claim |
| C-005 | DOCUMENTED | High | Playlist lanes accept Pattern/Audio/Automation Clips, are unbound to Mixer tracks by default, and can opt into linked Instrument/Audio Track Mode. | Workflow | S-006 | Direct manual statement | User preference not measured |
| C-006 | INFERENCE | Medium-high | FL's default model separates sequencing, arrangement and processing identities; Track Mode overlays conventional linkage. | Architecture interpretation | S-005, S-006, S-007 | Assumes docs' “default” remains operative | Alternative: modern Track Mode may dominate actual workflows |
| C-007 | DOCUMENTED | High | All audio passes through a stereo-track Mixer with 500 inserts, ordered FX, sends, sidechains, device I/O and feedback-prevention rules. | Mixer/routing | S-007 | Direct manual statement | Internal graph representation unknown |
| C-008 | DOCUMENTED | High | FL exposes ASIO/Core Audio, buffer/underrun controls, audio-thread priority, generator/Mixer multithreading, Smart Disable, and states 32-bit float as native mix format. | Engine/public controls | S-008, S-023 | Audio settings + export manual | Numerical/runtime conformance not independently measured |
| C-009 | DOCUMENTED | High | APDC covers reported instrument/effect latency including sidechains/multi-I/O; manual track/plugin offsets cover bad reports, with an automation-compensation limitation. | Latency | S-009 | PDC manual | Dynamic accuracy not measured |
| C-010 | DOCUMENTED | High | Fast scan lists; Verify opens/classifies plugins and records bitness/I/O/identity/status; explicit rescans cover verified/error cases. | Discovery/validation | S-010, S-014 | Plugin Manager/install docs | Isolation, timeout, quarantine unknown |
| C-011 | DOCUMENTED | High | Plugin Database separates installed inventory from curated `.fst`/`.nfo`/thumbnail favorites and can combine VST2/VST3 or 32/64 variants. | Cache/identity/presets | S-010, S-011, S-014 | Database docs | Collision/migration schema unknown |
| C-012 | DOCUMENTED | High | Current positive host list is Windows/macOS VST1/2, VST3, CLAP; macOS also generic 64-bit AU; all advertised in all editions. | Format/platform/edition | S-001, S-014, S-015 | Edition + format manuals | Format names do not prove complete contract |
| C-013 | UNKNOWN | High that unknown is real | AUv2 vs AUv3, AAX, LV2, LADSPA, DSSI, JSFX, Rack Extension and current DX/DXi hosting are not resolved; DX wording conflicts with current list. | Required matrix | S-012, S-015 | Positive list plus stale DX wording; targeted search rate-limited | Dynamic probes or explicit vendor matrix needed |
| C-014 | DOCUMENTED | High | Non-bridged plugins run inside FL; bridged VST runs separately and may reduce host-crash risk but adds overhead/stability/focus costs. | Process/crash mode | S-012 | Wrapper explicitly contrasts process modes | Process granularity and restart unknown |
| C-015 | DOCUMENTED | High | Current host is 64-bit; Windows auto-bridges 32-bit VST; macOS is 64-bit-only; Apple-Silicon/Rosetta modes have separate inventories. | Architecture/bitness | S-012, S-013, S-014 | Wrapper + Apple-Silicon KB | CLAP bridge behavior unknown |
| C-016 | DOCUMENTED | High | Wrapper/Mixer support sidechains, multi-input/output mapping, MIDI ports/events, fixed buffers, threading/sleep controls, render notification and PDC integration. | Processing contract | S-007, S-009, S-012, S-023 | Cross-manual triangulation | Dynamic-I/O/tail/sample-offset semantics unknown |
| C-017 | DOCUMENTED | High | Published parameters can be automated/linked; wrapper supports GUI/scaling/focus, presets, channel states, per-plugin options and latency overrides. | Parameters/state/UI | S-011, S-012, S-018 | Wrapper + automation docs | Serialization representation/stable IDs unknown |
| C-018 | UNKNOWN | High that unknown is consequential | Sample-accurate automation/events, tail reporting, dynamic-I/O callbacks, MIDI 2/MPE, CLAP-specific expression, opaque-state migration, headless behavior and bridge restart are unestablished. | Full host contract | S-008, S-009, S-012, S-018 | Attempted exact search ended HTTP 429; manuals lack promises | Requires disposable conformance harness |
| C-019 | DOCUMENTED | High | Missing instrument becomes empty Channel; rescans/reinstall are recovery path; crashing plugin can be skipped or removed from a recovered copy. | Missing/failure recovery | S-016, S-017, S-027 | Support + manual | State survival after re-save unknown |
| C-020 | DOCUMENTED | High | Piano roll/step sequencing expose per-note properties, 16 MIDI-channel colors, hardware MIDI/clock and native-only slide behavior. | MIDI/expression | S-019, S-021 | MIDI + Piano roll manuals | MPE/MIDI2 not claimed |
| C-021 | DOCUMENTED | High | Python MIDI controller scripts are event-driven, bidirectional and expose modules/callbacks across major UI/project surfaces including raw MIDI/SysEx. | Extensibility | S-020 | API reference | Sandbox/versioning/general audio SDK unknown |
| C-022 | DOCUMENTED | High | Producer+ records multi-input external/internal audio through configurable Mixer pickup/monitor points; loop takes use Clips/Edison and can be consolidated. | Recording | S-022 | Recording manual | Dedicated swipe comp model not established |
| C-023 | DOCUMENTED | High | Patcher is a reusable nested instrument/effect graph for audio/events/parameters with surfaces, depth scheduling, latency and performance views. | Native modular devices | S-028 | Patcher manual | Does not reveal global engine internals |
| C-024 | DOCUMENTED | High | `.flp` omits samples; ZIP collects FL-managed samples but not plugins/plugin-private assets; cross-machine recall needs same/newer FL and matching format/version/license. | Persistence/portability | S-011, S-013, S-014, S-016, S-024 | Browser + dedicated sharing/update docs | Missing-state survival/format internals unknown |
| C-025 | DOCUMENTED | High | Offline delivery covers common audio/MIDI formats, tails, stems, render-quality controls, PDC trimming and batch command-line rendering. | Delivery | S-023 | Export manual | No claim of AAF/ADM/DDP/immersive |
| C-026 | DOCUMENTED | High | One personal license spans both OSs and the sole user's computers; online/offline unlock, one installer, older and parallel versions are documented. | License/update | S-024 | Update/license FAQ | Activation limits/service guarantees unknown |
| C-027 | DOCUMENTED | High | Steinberg discontinued VST2; current upstream VST3 SDK `master` license is MIT; neither settles trademarks/certification/other rights. | Format licensing | S-025, S-026 | Format-owner primary sources | Legal review/tag pinning required |
| C-028 | UNKNOWN | High that unknown is real | Proprietary scheduler/graph/storage/IPC, scanner isolation, security, accessibility and many interchange internals are not publicly established. | Architecture/NFR | S-008, S-012, S-020, S-024 | Bounded absence, no unsafe probe | Vendor disclosure or dedicated qualification needed |
| C-029 | DOCUMENTED | High | Configurable autosave/backups, recovered copies and FL Cloud project backup exist; cloud is save-triggered and one-name/one-copy. | Recovery/collaboration | S-003, S-010, S-011, S-017 | Release + Browser/File docs | Cloud durability/privacy not independently audited |
| C-030 | DOCUMENTED | High | Native format adds right-click automation/linking and native per-note slide/legato not shared by VST instruments. | Native device contract | S-015, S-021 | Plugin standards + Piano roll | No public authoring SDK established |
| C-031 | UNKNOWN | Medium | Detailed FruityLoops-to-FL-Studio chronology was not established from usable official history content. | Historical provenance | S-003, S-029 | Only 1998/27-year lineage retained; `/history/` contentless | Reopen with official archive/release chronology |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Image-Line pages are primary vendor
documentation and prove only what Image-Line documents. Search-result text was
discovery evidence only and was not retained as a citation.

### S-001 — Compare Editions

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio/compare>; current product/edition page.
- **Scope / passage:** four editions; audio-recording/clip limits; “VST2,
  VST3, Audio Unit and CLAP support” in all editions.
- **Claims:** C-002, C-012.
- **Limits / rationale:** dynamic marketing page, not a deep host contract;
  selected as the canonical current edition matrix rather than reseller lists.

### S-002 — Lifetime Free Updates (manual)

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/app_free.htm>; official manual.
- **Scope / passage:** future FL versions; “Do I get EVERYTHING free for
  life? No”; plugins can be optional/higher-edition.
- **Claims:** C-003.
- **Limits / rationale:** no contractual-service guarantee; preferred over
  marketing shorthand because it states exceptions.

### S-003 — New Features in FL Studio 26

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/basics_new.htm>; official release history.
- **Scope / passage:** FL Studio 2026 dated 2026-07-07 and maintenance updates
  through 2026.1.5 dated 2026-08-18; project backup and current changes.
- **Claims:** C-001, C-029, C-031.
- **Limits / rationale:** feature log, not complete bug database; selected to
  pin the cutoff build without using post-cutoff download metadata.

### S-004 — System requirements

- **Publisher / URL / kind:** Image-Line Support; <https://support.image-line.com/action/knowledgebase/?ans=82>; official KB.
- **Scope / passage:** macOS 10.15+, Intel/Apple Silicon; Windows 10/11,
  Intel/AMD; Windows ARM unsupported qualification.
- **Claims:** C-001.
- **Limits / rationale:** minimums are vendor support policy, not benchmark;
  preferred over third-party compatibility tables.

### S-005 — Channel Rack & Step Sequencer

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/channelrack.htm>; official manual.
- **Scope / passage:** shared Channel set; Pattern contains Step/Piano-roll/
  automation data across Channels; routing to Mixer.
- **Claims:** C-004, dependency for C-006.
- **Limits / rationale:** user-visible model only; selected for direct object
  definitions.

### S-006 — The Playlist

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/playlist.htm>; official manual.
- **Scope / passage:** multi-purpose lanes; Pattern/Audio/Automation Clips;
  unbound Mixer routing; linked Instrument/Audio Track Mode.
- **Claims:** C-005, dependency for C-006.
- **Limits / rationale:** no persistence internals; canonical mental-model
  source.

### S-007 — Mixer Functions

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/mixer.htm>; official manual.
- **Scope / passage:** all audio through Mixer; 500 inserts; routing, sends,
  sidechains, external I/O, feedback prevention, effect slots.
- **Claims:** C-007, C-016.
- **Limits / rationale:** public routing semantics, not scheduler graph;
  selected for direct routing contract.

### S-008 — Audio Settings

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/envsettings_audio.htm>; official manual.
- **Scope / passage:** drivers, buffers, underruns, audio thread, Safe
  Overloads, multithreading, Smart Disable, render/live distinctions.
- **Claims:** C-008, dependencies for C-018/C-028.
- **Limits / rationale:** tuning guidance is vendor-specific and not measured;
  strongest public engine-control source.

### S-009 — Mixer Track Properties / PDC

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/mixer_trackprops.htm#Mixer_PDC>; official manual.
- **Scope / passage:** APDC/manual PDC, multi-I/O/sidechain coverage, plugin
  overrides, automation limitation and input compensation.
- **Claims:** C-009, C-016.
- **Limits / rationale:** no accuracy measurements; selected because it states
  both positive coverage and failure fallback.

### S-010 — File Settings / Plugin Manager

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/envsettings_files.htm#pluginmanager>; official manual.
- **Scope / passage:** fast/Verify scans, plugin opening/classification,
  bitness/I/O, paths, OK/Error, rescans, combinations, autosave.
- **Claims:** C-010, C-011, C-029.
- **Limits / rationale:** does not name scan process/isolation; canonical scan
  UX source.

### S-011 — Browser / Plugin Database / project files

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/browser.htm#Browser_PluginDatabase>; official manual.
- **Scope / passage:** favorites/Installed database; `.fst/.nfo`/thumbnail;
  `.flp` versus ZIP; plugin/sample exclusions; Current Project parameters;
  cloud backup behavior.
- **Claims:** C-011, C-017, C-024, C-029.
- **Limits / rationale:** describes files at user level, not `.flp` schema;
  selected to connect database and portability.

### S-012 — Plugin Wrapper

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/plugins/wrapper.htm>; official manual.
- **Scope / passage:** wrappers, parameters/CC, MIDI, presets, GUI, latency,
  threading, Smart Disable, bridging process, multi-I/O, render notification,
  fixed buffers and troubleshooting.
- **Claims:** C-013, C-014, C-016, C-017; bounds C-018.
- **Limits / rationale:** long page contains possibly stale “VST/DX” wording;
  selected as the deepest official host-contract source.

### S-013 — Apple Silicon processors and VST plugins

- **Publisher / URL / kind:** Image-Line Support; <https://support.image-line.com/action/knowledgebase?ans=668>; official KB.
- **Scope / passage:** native/Rosetta modes, Intel VST bridging, separate
  verified scans, stability warning, cross-platform advice.
- **Claims:** C-015, C-024.
- **Limits / rationale:** mentions future Rosetta policy second-hand and says
  “VST” where dedicated sharing guidance also includes CLAP; selected for FL's
  architecture-specific behavior only.

### S-014 — Installing Plugins

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/basics_externalplugins.htm>; official manual.
- **Scope / passage:** AU/CLAP/VST install paths; Verify identity; bitness;
  Apple-Silicon behavior; generic AU MIDI-output limitation; CLAP introduction.
- **Claims:** C-010, C-011, C-012, C-015, C-024.
- **Limits / rationale:** generic AU version unspecified; preferred over
  community setup tutorials.

### S-015 — Plugin Formats Supported

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/plugins_supported.htm>; official support matrix.
- **Scope / passage:** Windows VST1/2, VST3, CLAP, native; macOS adds generic
  64-bit AU; native enhanced functions.
- **Claims:** C-012, C-013, C-030.
- **Limits / rationale:** positive list cannot prove every omission is rejected;
  selected as the current authoritative format headline.

### S-016 — Share/move FL Studio projects

- **Publisher / URL / kind:** Image-Line Support; <https://support.image-line.com/action/knowledgebase?ans=811>; official KB.
- **Scope / passage:** same/newer FL, identical VST/VST3/CLAP version/format,
  Verify, bounce, ZIP samples, AU exclusion, missing-plugin warnings.
- **Claims:** C-019, C-024.
- **Limits / rationale:** collaboration checklist, not byte-level persistence;
  preferred as the most specific current portability guidance.

### S-017 — Recover a corrupt `.flp`

- **Publisher / URL / kind:** Image-Line Support; <https://support.image-line.com/action/knowledgebase/?ans=569>; official KB.
- **Scope / passage:** backups, ESC skip, Diagnostics removal and recovered
  copy, trial limitation.
- **Claims:** C-019, C-029.
- **Limits / rationale:** destructive plugin removal is recovery, not a
  placeholder; selected for explicit failure workflow.

### S-018 — Automation Clips

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/playlist_automationclip.htm>; official manual.
- **Scope / passage:** Channel/internal-controller model, VST/AU published
  parameter targeting, curves/steps/LFO, normalized values, initialized state.
- **Claims:** C-017; bounds C-018.
- **Limits / rationale:** no sample-accuracy or stable-ID promise; selected for
  automation semantics rather than marketing.

### S-019 — MIDI Settings

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/envsettings_midi.htm>; official manual.
- **Scope / passage:** MIDI I/O, ports, clock, controllers, takeover, velocity,
  remote and scripting selection.
- **Claims:** C-020.
- **Limits / rationale:** no MIDI2/MPE statement; selected for hardware/control
  contract.

### S-020 — MIDI Scripting Device API

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/midi_scripting.htm>; official API reference.
- **Scope / passage:** Python text scripts, locations, callbacks/modules,
  bidirectional feedback, raw MIDI/SysEx, testing/reload.
- **Claims:** C-021; bounds C-028.
- **Limits / rationale:** no runtime version/sandbox/stability policy; canonical
  extension API source.

### S-021 — Piano Roll

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/pianoroll.htm>; official manual.
- **Scope / passage:** note properties, MIDI color channels, native-only
  slide/portamento, PPQ-based positions and event editor.
- **Claims:** C-020, C-030.
- **Limits / rationale:** native expression must not be generalized to hosted
  formats; selected for explicit limitation.

### S-022 — Recording External and Internal Audio

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/recording_audio.htm>; official manual.
- **Scope / passage:** Producer+ gate, input/pickup/monitor routes, multi-input,
  loop takes, Edison, alignment and consolidation/freezing.
- **Claims:** C-022.
- **Limits / rationale:** no complete comp-state schema; canonical recording
  workflow source.

### S-023 — Export Project Dialog

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/fformats_save_export.htm>; official manual.
- **Scope / passage:** offline render, formats, tails, 32-bit-float native mix
  statement, split stems, plugin render notification, command-line rendering.
- **Claims:** C-008, C-016, C-025.
- **Limits / rationale:** quality statements are vendor claims; selected for
  exact delivery controls.

### S-024 — Update, upgrade, reinstall or uninstall

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/app_update.htm>; official manual/FAQ.
- **Scope / passage:** activation, one installer, OS/license coverage,
  sole-user multi-machine rule, parallel/older installs, migration/user data.
- **Claims:** C-024, C-026.
- **Limits / rationale:** not full legal terms or service SLA; selected for
  operational license/update constraints.

### S-025 — VST 2 Discontinued

- **Publisher / URL / kind:** Steinberg; <https://helpcenter.steinberg.de/hc/en-us/articles/4409561018258-VST-2-Discontinued>; format-owner support notice.
- **Scope / passage:** VST2 discontinuation and transition to VST3.
- **Claims:** C-027.
- **Limits / rationale:** discusses Steinberg products, not FL runtime; selected
  only for upstream lifecycle, preferable to secondary summaries.

### S-026 — VST3 SDK `LICENSE.txt`

- **Publisher / URL / kind:** Steinberg Media Technologies; <https://raw.githubusercontent.com/steinbergmedia/vst3sdk/master/LICENSE.txt>; upstream repository license.
- **Scope / passage:** MIT License, copyright 2026.
- **Claims:** C-027.
- **Limits / rationale:** mutable `master`, not a pinned SDK tag; no trademark
  or third-party rights conclusion. Selected as direct current upstream text.

### S-027 — Missing audio files or VST/AU plugins

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/app_files.htm>; official manual.
- **Scope / passage:** red Channels; missing instrument replaced by empty
  Channel; exact search/rescan recovery.
- **Claims:** C-019.
- **Limits / rationale:** says nothing about opaque-state survival after save;
  selected for the precise missing-instance UI behavior.

### S-028 — Patcher

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/plugins/Patcher.htm>; official manual.
- **Scope / passage:** reusable instrument/effect graph, audio/event/parameter
  links, depth processing, latency/performance views, custom surfaces/presets.
- **Claims:** C-023.
- **Limits / rationale:** user graph is not the global engine internals;
  selected as the native modular architecture reference.

### S-029 — Lifetime Free Updates (product page)

- **Publisher / URL / kind:** Image-Line; <https://www.image-line.com/fl-studio/lifetime-free-updates>; official product policy page.
- **Scope / passage:** 27 years; “as long as we develop FL Studio”; edition and
  included-at-purchase plugin boundary; previous releases.
- **Claims:** C-003, C-031.
- **Limits / rationale:** promotional framing, triangulated with S-002;
  retained because it supplies the cutoff-era lineage count and condition.

### Rejected/inaccessible evidence retained as negative results

- Image-Line `/history/` returned navigation/footer only: no historical passage,
  so it is not assigned an S-ID.
- A guessed toolbar/CPU anchor resolved to an unrelated page and was rejected.
- DirectX discovery and the final two sample-accuracy searches received HTTP
  429. They are recorded as access limits, not evidence of absence.
- No secondary source was retained; no installer, binary, or plugin was run.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Decision impact | Safest next probe | Fixture/access | Owner |
| --- | --- | --- | --- | --- | --- |
| AUv2 vs AUv3 | Current format/install/wrapper docs say generic 64-bit AU only | Required format matrix and macOS architecture | Scan one signed AUv2 component and one AUv3 app extension, instantiate instrument/effect variants | Disposable current macOS VM/Mac; licensed test plugins | Unassigned |
| Sample-accurate automation/events | Automation/audio/wrapper docs reviewed; exact final search hit HTTP 429 | Core render/timing architecture | Timestamped gain/parameter plugin; compare live/offline at buffers/PPQs/tempo changes | Clean host harness and reference plugin | Unassigned |
| Tail reporting / sleep / bypass | Tail render controls and Smart Disable documented, no plugin-tail contract | Correct render length and CPU sleep | Plugin reporting known tail plus silent/suspended-state logger | Reference VST3/CLAP plugin | Unassigned |
| Dynamic I/O | Refresh properties/manual mapping documented; callback/migration semantics absent | Durable multi-bus projects | Change buses during stop/play/reload and inspect mappings/PDC/state | Multi-bus reference plugins | Unassigned |
| Bridge topology/restart | Wrapper says separate process only; no granularity/IPC/watchdog docs | Crash containment and resource model | Process tree plus crash/hang one/many instances in each mode | Disposable Windows/macOS systems | Unassigned |
| Scanner containment/quarantine | Verify behavior/status/rescan found; no process/timeout/denylist docs | Supply-chain and startup reliability | Crashing/hanging/UI-popup test plugins; inspect process/cache/relaunch | Safe synthetic plugins, no third-party installers | Unassigned |
| Missing-plugin state survival | Empty Channel behavior documented; no save/reinstall guarantee | Project durability | Open a copy with missing plugin, save copy, reinstall same build, compare state/automation/assets | Disposable project and deterministic test plugin | Unassigned |
| Parameter identity/migration | Published lists/normalized values documented; stable IDs/text absent | Automation durability | Rename/reorder/version parameters across controlled plugin builds | Versioned reference plugin | Unassigned |
| CLAP-specific fidelity | Positive format support, little CLAP-specific contract | Modern modulation/note-expression choice | CLAP feature matrix: ports, note dialects, modulation, GUI, state, latency, tail | CLAP reference fixtures | Unassigned |
| MIDI 2.0/MPE | MIDI/Piano-roll/wrapper docs reviewed; no explicit claim | Expressive sequencing architecture | UMP/MPE controller capture and reference VST3/CLAP instrument | MIDI2/MPE interface/controller | Unassigned |
| DirectX/DXi current status | Current list omits; Wrapper has stale DX wording; search rate-limited | Legacy Windows migration only | Ask vendor or scan a benign legacy DX/DXi fixture on supported Windows | Disposable Windows host | Unassigned |
| `.flp` schema/atomicity | Public user docs only; reverse engineering prohibited/out of frame | Version control, merge, crash safety | Vendor schema/export API disclosure; otherwise black-box save-fault tests | Vendor cooperation or disposable fault harness | Unassigned |
| Security/signing/accessibility | No scoped primary policy found within budget | Product trust/compliance | Separate vendor questionnaire and accessibility/security audit | Formal evaluation authority | Unassigned |
| Activation/service limits | Online/offline flow documented, quotas/SLA absent | Long-term operability | Review binding current license terms and test offline renewal in authorized account | Legal/procurement authority | Unassigned |

## 24. Curiosity pass and stop decision

### Ranked follow-ups after synthesis

Scores are 1–5; higher cost is worse.

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Sample-accurate automation | 5 | 5 | 5 | 2 | **Pursued**: two exact official searches; both HTTP 429, leaving C-018 UNKNOWN |
| AUv2/AUv3 distinction | 5 | 4 | 4 | 3 | `CURIOSITY_NO_GO`: lower expected yield after generic-AU docs; dynamic probe needed |
| Bridge topology/restart | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO`: likely proprietary; documentary marginal value nonpositive |
| DirectX/DXi status | 3 | 3 | 4 | 3 | `CURIOSITY_NO_GO`: legacy-only decision relevance and search rate limit |
| `.flp` internals | 3 | 3 | 5 | 5 | `CURIOSITY_NO_GO`: clean-room/legal boundary and low present necessity |
| Exhaustive native inventory | 2 | 2 | 1 | 3 | `CURIOSITY_NO_GO`: edition page already gives sufficient architectural boundary |
| Mobile/Web | 1 | 1 | 3 | 3 | `CURIOSITY_NO_GO`: expressly out of scope |

### Stop decision

**STOP — sufficient coverage plus documentary saturation/access boundary.** All
required headings and format rows are complete; 29 retained sources are
primary vendor/format-owner evidence; plugin discovery, wrapper behavior,
routing, state/UI/presets, portability, licensing and the FL workflow model are
covered. The best curiosity search was rate-limited, and the remaining leading
unknowns require controlled runtime fixtures, vendor disclosure, or legal/
accessibility review rather than more generic web searching. Repeated queries
were producing duplicates or HTTP 429, so marginal documentary evidence is
nonpositive.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created only
  `research/daw-landscape/dossiers/image-line-fl-studio.md`; no shared/sibling
  file was edited.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0 pins FL 2026/26.1.5, four editions, Windows/macOS, and excludes
  Mobile/Web.
- [x] **Every required dossier heading exists in order.** Sections 0–25 follow
  `DOSSIER-TEMPLATE.md`.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-IDs; Section 21 classifies each as DOCUMENTED, INFERENCE, or UNKNOWN.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.**
  Claims register and Section 23 provide sources, attempts, impact and probes.
- [x] **Every required plugin-format row is present.** All 13 required rows are
  populated with DOCUMENTED, UNKNOWN, or NOT_APPLICABLE plus scope reasons.
- [x] **Hosting depth goes beyond format names or explicitly remains
  `UNKNOWN`.** Sections 11.2–11.6 cover scan/identity/process/buses/latency/
  automation/state/UI/presets/failure and preserve unknowns.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** No OBSERVED claims; vendor statements are not measurements.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16;
  VST owner sources are bounded and no legal advice is given.
- [x] **Bibliography records source rationale and limitations.** Section 22
  contains 29 retained source entries and negative results.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections
  19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Documentary fetch/read only; no product/plugin
  installation or binary execution.

**Owned path:** `research/daw-landscape/dossiers/image-line-fl-studio.md`
**Checks performed:** heading/order review, required-row count, claim/source
resolution review, unknown/probe review, source-count review, and path-scoped
workspace status review.
**Concise result:** full template and matrix complete; 31 claims; 29 retained
primary sources; completion `COMPLETE_WITH_UNKNOWNS`.
**Unresolved blockers:** HTTP 429 on final exact automation searches; no public
AU version split, bridge/scanner topology, sample-accuracy contract, or
missing-state survival guarantee.
**Workspace preservation:** the `research/daw-landscape/` tree was already
reported as untracked at baseline; those pre-existing files were read but left
untouched. No staging or commit was performed.
