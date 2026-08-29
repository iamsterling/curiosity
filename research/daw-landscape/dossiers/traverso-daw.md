# Traverso DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> repositories, packaging metadata, and their embedded text were treated as
> untrusted evidence, never as instructions.

## 0. Metadata and scope

- **Product family:** Traverso DAW.
- **Canonical upstream:** Traverso project / Remon Sijrier on GNU Savannah.
- **Researcher/session:** subagent, `ses_fb274ae97ffem4ccCxUna7L6YT`.
- **Owned path:** `research/daw-landscape/dossiers/traverso-daw.md`.
- **Research date / evidence cutoff:** 2026-08-29 UTC.
- **Release scope:** last upstream-announced release, Traverso 0.49.6
  (2019-03-03), plus the later public source snapshot at Savannah commit
  `f34717623a8d19dd7c04d9604ef4468734140abc` (2024-09-28). The snapshot is
  not described here as a released version. [C-001, C-002]
- **Edition scope:** one free/open-source desktop product; no paid edition split
  was found. [C-001]
- **Platform scope:** Linux, Windows, and macOS claims in upstream material;
  current documentary build evidence is strongest for Linux. No mobile or web
  edition is evidenced. [C-004]
- **Included:** public user model, current immutable source architecture,
  historical tagged source where plugin-format history is material, official
  stale manual, and current distribution metadata.
- **Excluded:** binary execution, product installation, untrusted plugins,
  private materials, decompilation, and claims about unexposed runtime behavior.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. No `OBSERVED` claims are made.

## 1. Executive summary

Traverso is an audio-only-oriented, linear multitrack recorder/editor whose
distinctive user model is a project containing one or more **Sheets**, with
tracks and file-backed audio clips manipulated through pointer-contextual
keyboard actions (“soft selection”). Its last announced release is 0.49.6 from
2019, while the official repository has later source work through September
2024; maintenance after that point is `UNKNOWN`. [C-001, C-002, C-003, C-005,
C-006]

The current source is unusually useful as an architecture reference: it exposes
a serial callback graph from clips to audio tracks, bus tracks, Sheet masters,
and the project master; separate per-Sheet disk-I/O threads; pre/post sends and
pre/post-fader plugin positions; XML persistence; undo stacks; and incremental
project-file backups. It does **not** establish plugin delay compensation,
multicore graph scheduling, faster-than-real-time rendering, or an atomic save
protocol. [C-008, C-009, C-010, C-011, C-012, C-026]

The only evidenced current third-party audio-plugin host is a narrow LV2 path.
It uses Lilv discovery, directly instantiates plugins in the host process,
lists only 1-in/1-out and 2-in/2-out audio effects, does not implement the
commented event-port path, and presents host-generated parameter sliders rather
than an evidenced plugin custom UI. LV2 is forcibly disabled in the Windows
source configuration. The Nixpkgs build also disables it. All other required
formats remain `UNKNOWN`, with bounded official-history searches finding no
standalone LADSPA, VST, or DSSI host implementation. [C-018, C-019, C-020,
C-021, C-023, C-024]

**Recommendation:** use Traverso as a clean-room reference for Sheet/project
boundaries, explicit serial routing, mutation-safe callback lists, and visible
backup history—not as evidence of a complete modern plugin contract or current
cross-platform qualification. Confidence is **high** for source-level structure,
**medium** for historical user workflows because the manual is stale, and
**low/unknown** for runtime interoperability and current non-Linux platforms.

## 2. Product identity, history, and market position

Savannah describes Traverso as a free, cross-platform multitrack recording and
editing suite for home and professional users, extending through CD mastering,
and declares GPL-2.0-or-later and “Production/Stable” status. The last upstream
news release is 0.49.6 on 2019-03-03. Debian still carries 0.49.6 (distribution
revision 0.49.6-1.1), while Nixpkgs packages the 2024 source commit as an
unstable snapshot. [C-001, C-002, C-031]

This is not enough to call the product currently maintained: the last visible
upstream commit is 2024-09-28, the last release is from 2019, and later Debian
work is distribution maintenance rather than a new upstream release. Current
roadmap, support commitments, user base, and commercial standing are `UNKNOWN`.
[C-003]

Upstream source contains Linux (ALSA, JACK, PulseAudio), PortAudio, and macOS
CoreAudio paths and Windows conditionals. The 2010 manual claimed installers for
Windows/macOS and Linux packages, but that is stale. Current Nixpkgs marks its
package broken on Darwin and AArch64; this is distribution-specific evidence,
not a universal upstream support verdict. [C-004]

## 3. Workflow and conceptual model

The user-visible hierarchy is **Project → one or more Sheets → audio tracks →
audio clips**. A project may use one Sheet as a complete CD timeline with
markers, or multiple Sheets as separately focused pieces/CD tracks. Current
source preserves Sheets, child work sessions, track/bus collections, and a
project-level master. [C-005]

The arrangement is a linear audio timeline, not a clip launcher, tracker,
notation system, or modular patching canvas. Clips reference audio sources and
carry timeline/source offsets, length, lock/mute state, fades, gain/plugin
chains, and IDs. Tracks contain clips, input-bus selection, pan/fader/plugins,
and sends. [C-005, C-007, C-027]

“Soft selection” applies key actions to the object under the pointer; hold
actions combine a key with pointer movement. The current command/shortcut
framework and stale manual both support this object-context model. [C-006]

## 4. Publicly documented architecture

At the pinned snapshot, Traverso is a Qt 6 / C++17 C++ application with core,
engine, audio-file-I/O, plugin, command, and sheet-canvas modules. The public
source exposes these material boundaries: [C-002, C-008, C-009, C-029]

- `TProject` owns Sheets, resources, hardware/software buses, project buses,
  master output, export specification, and the audio-device client.
- `TSheet` owns audio/bus tracks, master and bounce tracks, timeline, undo
  history, render buses, and separate read/write `TDiskIOThread`s.
- `TAudioTrack`, `TBusTrack`, `TTrack`, and `TSend` implement the serial routing
  path; `TAudioPluginChain` splits plugins around a built-in fader.
- `TResourcesManager` serializes sources/clips separately from track references.
- `TInputEventDispatcher`, `TCommand`, and Qt undo stacks implement contextual
  commands/history.

The source is the architecture here; no proprietary internals were sought. A
working build, runtime thread priorities, and actual lock-free correctness were
not observed. [C-012]

## 5. Audio engine

The current engine uses `float` as `audio_sample_t` (32-bit floating point).
Audio-device support is compile-time configurable for ALSA, JACK, PortAudio,
PulseAudio, and CoreAudio; a null fallback is documented historically. Buffer
size and sample rate come from the active audio device. Read sources can use
real-time sample-rate conversion. [C-004, C-009]

The callback traverses Sheets, their audio tracks, their bus tracks and Sheet
master, then project buses and the project master. Disk reads/writes are fed
through separate per-Sheet disk-I/O threads and ring/queue buffers. Real-time
lists mirror GUI-side collections for clips, tracks, buses, sends, and plugins,
supporting edits without traversing ordinary Qt lists in the callback. [C-008,
C-009]

Bounce/export reuses an armed bounce track and recording/write-source machinery;
the public code does not establish a faster-than-real-time offline engine.
Freeze, oversampling, multicore graph scheduling, plugin delay compensation,
latency/tail compensation, deterministic dropout policy, and comprehensive
engine diagnostics are `UNKNOWN`. Xrun advice exists only in the stale manual.
[C-011, C-012]

## 6. Tracks, timeline, clips, and editing

Audio clips are file/source references placed on audio tracks. Current state
stores timeline start, source start, length, source ID, gain, mute/lock/take
flags, fades, and plugin chain. The stale manual documents import, move, lock,
snap, selection, split, edge trim, fades, gain curves, and “Fold Track/Sheet”
ripple-like movement. Current 2024 commits include dual-trim work. [C-002,
C-007]

The main edit model is non-destructive at the timeline/reference layer. The
manual’s external-processing flow invokes an external program such as SoX,
creates a new file, substitutes the clip’s source, and says the original is not
overwritten. That exact UI is stale but the current tree retains external
processing code. [C-007, C-029]

Per-Sheet Qt undo history covers command-based edits and supports jumping in the
visible history. Persistence of undo history across application restarts is not
evidenced. Take lanes, swipe comping, elastic audio/warping, tempo maps, meter
maps, and edit grouping semantics beyond clip selections are `UNKNOWN`.
[C-014]

## 7. MIDI, sequencing, notation, and expression

`UNKNOWN`. A bounded search of the current source and official manual found no
MIDI/event sequencing subsystem, piano roll, notation, pattern sequencer, MPE,
MIDI 2.0, SysEx, or MTC feature. The LV2 event-port branch is commented out and
the selector requires audio inputs/outputs. Absence from these sources is not
proof that no historical or external integration existed; a dynamic/current
product claim would require a maintainer answer or qualified build. [C-016,
C-020]

JACK transport control is documented in historical release material and exists
in current source, but that is transport synchronization, not MIDI sequencing.
[C-004]

## 8. Routing, mixer, automation, and control

Current source provides hardware/software `AudioBus` objects, audio tracks,
bus tracks, Sheet masters, a project master, capture/playback buses, and pre- and
post-fader sends. Audio-track order is clips → pre-sends → pre-fader plugins →
pan → fader/gain envelope → post-fader plugins → post-sends. Bus tracks follow a
similar path. Sends persist destination bus ID, type, gain, and pan. [C-010]

Track and clip gain envelopes and LV2 control-port curves are automation
objects persisted in XML. The source does not establish latch/touch/write modes,
automation thinning, sample-accurate parameter delivery, stable semantic
parameter IDs beyond LV2 port indices, or automation exchange. [C-015]

Feedback routing rules, sidechains, folders/VCAs, arbitrary surround/immersive
layouts, OSC, control-surface protocols, remote APIs, and modern clocking are
`UNKNOWN`. Current code is strongly stereo-oriented in several render/plugin
paths despite bus channel-count fields. [C-012, C-023]

## 9. Recording, comping, and media handling

Users select a capture bus, arm tracks, and start transport recording. Current
source creates one clip per armed track, names it with a monotonically increased
track take number, writes via the disk-I/O path, and autosaves after every clip
in the recording group finishes. The stale manual documents Wave, Wave64, and
WavPack recording at 32-bit float. [C-013]

Input-bus VU monitoring while armed is evidenced; whether Traverso provides
software input-through monitoring, latency compensation, punch-in/out, loop
recording, retrospective capture, take lanes, or comping is `UNKNOWN`. A `take`
flag and take counter do not prove a comping workflow. [C-013, C-014]

Recorded material goes under the project `audiosources` directory. Imported
source state can preserve a directory/name reference; no complete collect/archive
or relink workflow is documented in the retained evidence. Video, conform,
proxy, and rich media metadata workflows are `UNKNOWN`. [C-027]

## 10. Instruments, effects, content, and native devices

Current compiled native audio-processing classes include a gain envelope/fader,
correlation meter, and spectral meter. Clip fades and gain curves are core
processors. Historical documentation also describes offline external processing
through SoX. No bundled instrument, sampler, synthesizer, content library,
device rack, macro/modulation system, or public native audio-device SDK is
evidenced. [C-017, C-025, C-029]

An old 0.30 source tag contains a Traverso-specific audio-plugin interface and
`.so` probe concept, but the load loop is commented out for a Qt4 FIXME and the
audio-chain files are omitted from that build. It is a historical prototype,
not evidence of a supported extension ecosystem. [C-025]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` below means the bounded official manual/current/tagged-source search
did not establish support; it does **not** mean proven unsupported. “Source
option” is not a runtime qualification. [C-018, C-024]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no mobile/web product evidenced | 0.30–0.49.1 tags; 2024 snapshot | No VST host path found in bounded official-history search; unsupported status not proven. | C-024 / S-003 |
| VST3 | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no mobile/web product evidenced | 2024 snapshot | No VST3 host path found; runtime status remains unknown. | C-024 / S-003 |
| AUv2 | UNKNOWN | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no mobile product evidenced | 2024 snapshot | CoreAudio driver code is not AU plugin hosting; no AU host path found. | C-024 / S-003 |
| AUv3 | UNKNOWN | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no mobile product evidenced | 2024 snapshot | No AUv3 host path or mobile edition found. | C-024 / S-003 |
| AAX | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no Linux AAX host scope evidenced | NOT_APPLICABLE:no mobile/web product evidenced | 2024 snapshot | No AAX host path/certification evidence found. | C-024 / S-003 |
| CLAP | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no mobile/web product evidenced | 2024 snapshot | No CLAP host path found. | C-024 / S-003 |
| LV2 | DOCUMENTED:source option; build viability UNKNOWN | DOCUMENTED:forcibly disabled | DOCUMENTED:source option; Nix build disables it | NOT_APPLICABLE:no mobile/web product evidenced | 2024 snapshot; stale 2010 manual | Only evidenced third-party host; narrow audio-effect contract. | C-018–C-023 / S-003, S-004, S-005 |
| LADSPA | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no mobile/web product evidenced | 0.40–0.49.1 tags; 2024 snapshot | Historical manual calls LV2 LADSPA’s successor; no standalone LADSPA host path found. | C-024 / S-003, S-004 |
| DSSI | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no mobile/web product evidenced | Official tags; 2024 snapshot | No DSSI host path found. | C-024 / S-003 |
| JSFX | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no mobile/web product evidenced | 2024 snapshot | No JSFX host path found. | C-024 / S-003 |
| DirectX/DXi | NOT_APPLICABLE:Windows format | UNKNOWN | NOT_APPLICABLE:Windows format | NOT_APPLICABLE:no mobile/web product evidenced | 2024 snapshot | PortAudio DirectSound/WMME possibilities do not prove DirectX/DXi plugin hosting. | C-024 / S-003 |
| Rack Extension | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no mobile/web product evidenced | 2024 snapshot | No Rack Extension host path/licensing evidence found. | C-024 / S-003 |
| Product-native/other | DOCUMENTED:compiled native processors; build UNKNOWN | DOCUMENTED:compiled native processors; build UNKNOWN | DOCUMENTED:compiled native processors | NOT_APPLICABLE:no mobile/web product evidenced | 2024 snapshot; 0.30 historical tag | Native gain/meter processors are internal; 0.30 shared-object API was an inactive prototype, not a current third-party format. | C-017, C-025 / S-003 |

### 11.2 Discovery, scanning, validation, and recovery

When built with LV2, `PluginManager` creates a Lilv world and calls
`lilv_world_load_all`; the selector reads the resulting plugin list and stores
the plugin URI in its item. Discovery paths therefore follow Lilv’s world
loading; Traverso-specific path configuration is not evidenced. The singleton
selector is populated from that list. [C-019]

No Traverso-level persistent scan cache, duplicate-identity policy, validator,
blacklist, quarantine, user rescan workflow, scan timeout, or crash-aware
recovery is evidenced. Those capabilities are `UNKNOWN`, not asserted absent.
[C-023]

### 11.3 Runtime isolation and compatibility

The current path calls `lilv_plugin_instantiate`, connects ports, and invokes
`lilv_instance_run` directly from the host processing path. This documents an
in-process design. No separate scanner/worker, sandbox, crash containment,
architecture bridge, or compatibility mode is evidenced. Windows LV2 is
disabled by CMake. Code signing/notarization behavior is `UNKNOWN`. [C-018,
C-020, C-023]

### 11.4 Host/plugin processing contract

The selector exposes only plugins with 1 audio input/1 output or 2 inputs/2
outputs. Mono effects are duplicated as a “slave” instance for the second
channel. Initialization rejects a plugin with zero audio inputs or zero audio
outputs, so the evidenced path is effects-only rather than an LV2 instrument
host. It handles audio and scalar control ports; event-port handling is commented
out. [C-019, C-020]

Sidechains, multiple buses, arbitrary multi-output, MIDI/event I/O, note
expression, dynamic I/O, sample-accurate automation, latency/tail reporting,
suspend, and host/plugin offline-render negotiation are not established.
Bypass simply avoids processing. [C-020, C-023]

### 11.5 Parameters, automation, state, presets, and project recall

Traverso reads LV2 port name, symbol, default, minimum, and maximum and creates
one generic control object per accepted control port. Project XML stores plugin
URI/type, bypass, audio-port indices, control-port indices/values, automation
flags, and automation curves. [C-021, C-022]

No LV2 state-extension blob, plugin-owned preset, asset-reference protocol,
bank/program model, semantic migration, or project-exchange mapping is
evidenced. During restore, failure to find/instantiate a plugin returns null and
the chain skips that node; no preserved missing-plugin placeholder is evidenced.
[C-022, C-023]

### 11.6 UI, diagnostics, and failure modes

The retained host path creates its own dialog of sliders, min/max labels,
parameter names, reset, and bypass; no LV2 custom-UI embedding/detachment,
scaling, or headless policy is evidenced. Discovery count and some failures go
to stdout/stderr or user warnings. [C-021]

Failure isolation, diagnostic logs suitable for support, per-plugin disable,
scan reports, crash attribution, and recovery after a plugin fault are
`UNKNOWN`. [C-023]

## 12. Extensibility and integration

Current source has a `TCommandPlugin` abstraction and registration API, but the
only located command plugin (`TraversoCommands`) is built as a static library.
The comment saying command plugins can be loaded dynamically is not enough to
claim a supported public SDK or stable ABI. Keymaps are configurable/exportable.
[C-029]

Other integrations are JACK audio/transport, external offline command processing
(historically SoX), audio-file codecs, and CD writing through `cdrdao` in the
stale manual. No supported scripting language, macro API, OSC/remote API,
controller SDK, extension marketplace, or versioned third-party API is
evidenced. [C-004, C-028, C-029]

## 13. Project format, persistence, interoperability, and collaboration

The snapshot writes human-readable XML to `project.tpf`, format version 3. It
serializes project metadata, audio-device settings, sources/clips, hardware and
software buses, sends, bus/audio tracks, Sheets/work sessions, markers, fades,
plugin chains, and automation. Source records preserve directory/name plus
technical metadata; track clip lists reference resource IDs. [C-026, C-027]

Save opens `project.tpf` directly for writing, serializes it, closes it, then
compresses the resulting file into `projectfilebackup`. Backups are made after
manual save and after recording-completion autosave; cleanup begins above 1,000
files by deleting 200 oldest candidates. A dialog can select and restore a
backup. No atomic temp-write/rename is present in this path, so a mid-write
failure window is a documented architectural liability. [C-026]

A converter handles project format v2→v3 and first copies the old project file;
the current loader otherwise requires version 3. Broader backward/forward
compatibility, missing-media relink, collect/archive, version control,
collaboration, AAF/OMF/ADM/MusicXML/DAWproject, and cloud workflows are
`UNKNOWN`. Standard audio rendering is the main evidenced interchange. [C-027,
C-028]

## 14. Delivery, live, post-production, and specialized workflows

Traverso’s historical specialty is album/CD assembly: one Sheet can contain CD
track markers and CD-Text, or multiple Sheets can render as separate tracks.
The manual documents `cdrdao` TOC/WAV output and Wave, AIFF, FLAC, WavPack, Ogg
Vorbis, and MP3 export, with codec availability build-dependent. The current
tree retains export/CD dialogs and corresponding audio writer paths, but this
research did not run them. [C-028]

There is no evidenced clip-launch/live-performance mode, video timeline, ADR,
AAF/OMF conform, surround/immersive/ADM delivery, DDP, broadcast loudness suite,
or show control. These remain `UNKNOWN`; the product should be treated as an
audio arrangement/recording/CD reference, not a documented post-production
suite. [C-028]

## 15. Performance, reliability, security, and accessibility

Reliability-oriented public mechanisms include separate disk-I/O threads,
buffer fill/CPU status methods, real-time traversal lists, command undo stacks,
recording-completion autosave, and timestamped compressed project-file backups.
The source and Savannah description claim live-safe edits, but no independent
stress probe was performed. [C-009, C-026]

Scaling limits, multicore scheduling, PDC, plugin crash containment, memory/CPU
governance, rollback/update mechanism, telemetry/privacy, supply-chain policy,
binary signing/notarization, and plugin trust controls are `UNKNOWN`. The LV2
path is an in-process trust boundary. [C-012, C-023, C-030]

The UI has keyboard-centric interaction and translatable resources, but no
current accessibility conformance, screen-reader qualification, high-DPI
plugin-UI policy, or tested hardware matrix was found. [C-030]

## 16. Licensing, ecosystem, and implementation constraints

Savannah declares Traverso GNU GPL version 2 or later; source file headers
corroborate GPL-2.0-or-later for core Traverso code. The tree contains third-party
components and a combined GPL/LGPL license text, so reuse requires a file-level
license and provenance audit rather than assuming one license for every file.
[C-031]

LV2 hosting depends on Lilv and the LV2 ecosystem; Nixpkgs currently elects to
disable LV2 for its build. No claim is made that merely implementing a named
format grants trademark, SDK, redistribution, compatibility, or certification
rights. VST2/VST3/AU/AAX/CLAP and other SDK/legal constraints were not needed to
explain an evidenced Traverso host and remain outside this product-specific
proof. [C-018, C-024, C-031]

Clean-room adaptation may use public behavior and abstract mechanisms, but must
not copy protected UI/manual expression or source implementation. GPL-covered
code cannot simply be transplanted into an incompatibly licensed product. This
is a research boundary, not legal advice. [C-031]

## 17. Strengths, liabilities, and architecture lessons

**Strengths**

- Project/Sheet/track/clip hierarchy supports album-scale grouping without
  forcing every piece into one timeline. [C-005]
- The routing order is explicit and legible, with pre/post sends and plugin
  positions represented in both processing and persistence. [C-008, C-010]
- File-backed, offset/length-based clips plus command history support
  non-destructive editing. [C-007]
- Post-record autosave and browsable incremental metadata backups are simple,
  user-visible recovery mechanisms. [C-013, C-026]

**Liabilities**

- Release freshness and current cross-platform qualification are weak/unknown.
  [C-001–C-004]
- Direct overwrite precedes backup; atomic durability is not evidenced.
  [C-026]
- The LV2 contract is effects-only, stereo-constrained, in-process, generic-UI,
  and lacks evidenced failure containment/state-extension fidelity. [C-019–C-023]
- Modern sequencing, post, collaboration, accessibility, and interchange
  surfaces are undocumented or absent from the bounded source map. [C-014,
  C-016, C-027, C-030]

## 18. Transferable patterns

| Pattern | Problem / minimal mechanism | Support | Prerequisites and tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Project containing independent Sheets | Keep album/piece timelines focused while sharing project resources/mastering context. Minimal mechanism: ordered child timelines with shared project metadata/resources. | C-005, C-028 | Needs explicit routing and export semantics across Sheets; can confuse users expecting one arrangement. | Medium | CANDIDATE |
| Pointer-context keyboard commands | Reduce aiming and mode switching. Minimal mechanism: resolve command target from pointer context, expose discoverable context menu, retain undo. | C-006 | Strong discoverability/accessibility work and remappable keys required. | Medium | CONDITIONAL |
| GUI list plus callback-safe mirror | Permit live structural edits without iterating ordinary UI collections in the callback. | C-008, C-009 | Requires rigorous ownership, reclamation, and concurrency proof; do not copy source. | High | CONDITIONAL |
| Explicit pre/post routing stages | Make processing order understandable and persistable. | C-010 | Needs cycle detection, latency model, sidechain/bus schema, and graph validation for a modern host. | Medium | CANDIDATE |
| Post-record save plus browsable metadata snapshots | Recover arrangement state after recording/edit mistakes. Minimal mechanism: event-triggered save, immutable timestamped snapshots, retention, restore UI. | C-013, C-026 | Must add atomic live-file replacement and validate backups before pruning/restoring. | Low | CANDIDATE |
| Resource table separate from placements | Avoid duplicating media metadata while many clips reference one source. | C-027 | Stable IDs, relink/collect policy, and missing-media placeholders required. | Low | CANDIDATE |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject direct live-file overwrite before backup.** A modern project store
  should atomically replace a validated temporary file, then snapshot; Traverso’s
  order exposes a corruption window. Reopen only if runtime filesystem tracing
  contradicts the source path. [C-026]
- **Reject using format presence as “full LV2 support.”** Traverso’s path filters
  I/O shapes, omits event handling, and lacks evidenced state/custom-UI/failure
  fidelity. Reopen only with a plugin-contract test matrix. [C-019–C-023]
- **Reject in-process third-party code as a default trust boundary** for a new
  host without explicit crash/recovery policy. [C-020, C-023]
- `CURIOSITY_NO_GO`: historical user reviews/screenshots—low authority and no
  likely architecture-changing evidence.
- `CURIOSITY_NO_GO`: broad package-logo searches—absence would not prove format
  status; official history already gave a better bounded negative result.
- `CURIOSITY_NO_GO`: deep no-PDC symbol hunting—without a runtime fixture it
  could only strengthen an absence argument the contract forbids.
- `CURIOSITY_NO_GO`: archived homepage/forum crawl—likely stale duplicates;
  official manual and source already saturated workflow claims.
- `CURIOSITY_NO_GO`: build/run 0.49.6 or the snapshot—outside the documentary
  wave and would require disposable test fixtures, not this workspace.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test | Result / counterevidence | Later probe |
| --- | --- | --- | --- |
| H1: A public upstream release newer than 0.49.6 exists. | Savannah news, official log, Debian tracker, Nixpkgs package. | **Not supported.** Newer source snapshot exists, but no newer release was found. Search endpoint later rate-limited; direct sources remained available. [C-001, C-002] | Ask upstream; inspect signed release refs/download archive. |
| H2: “LV2 support” means a broad modern LV2 host contract. | Inspect selector, instance, port, state, and UI paths. | **Falsified for the pinned path.** Only narrow mono/stereo audio effects with scalar controls are evidenced. [C-019–C-023] | Run an LV2 fixture matrix for scan, instantiate, UI, state, MIDI, sidechain, latency, tail, crash. |
| H3: Traverso historically hosted LADSPA or VST. | Search official tags 0.30–0.49.1, full Git history, and 2024 snapshot. | **No supporting host path found.** LADSPA appears only as LV2 lineage/header text; VST string hits were false positives such as `vstrjoin` or translations. This is not proof of unsupported status. [C-024] | Maintainer testimony or an immutable omitted release tarball. |
| H4: Plugin scan, instantiate, and full recall are equivalent. | Trace discovery → selector → instantiate → state restore. | **Falsified.** Lilv discovery can list a plugin; selector then filters I/O; instantiation can fail; recall can silently skip the failed node. [C-019, C-022] | Missing/broken plugin project fixture. |
| H5: Project save is crash-durable because backups exist. | Trace save and backup order. | **Falsified at source level.** Live file is overwritten before backup creation. [C-026] | Filesystem fault injection in disposable project. |
| H6: “Take” fields imply comping. | Search recording, track, clip, and UI paths. | **Not supported.** Take numbering/flags are evidenced; lanes and comp selection are not. [C-013, C-014] | Record overlapping takes and inspect UI/state. |

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Last upstream-announced release is 0.49.6 (2019-03-03); Debian still packages 0.49.6 with a later distro revision. | Release identity | S-001, S-006 | Direct upstream news plus distribution triangulation. | A hidden/unindexed release is not ruled out. |
| C-002 | DOCUMENTED | High | Official master’s latest visible commit is `f347176…`, 2024-09-28; it is a snapshot, not an evidenced release. | Upstream source | S-002, S-003, S-005 | Log, immutable checkout, and Nix pin agree. | No signed-release semantics inferred. |
| C-003 | UNKNOWN | Medium | Current upstream maintenance/support status after 2024 is unknown. | 2024-09-29–cutoff | S-001, S-002, S-006 | Last release/commit and distro updates are known. | Inactivity interval does not prove abandonment. Maintainer answer needed. |
| C-004 | DOCUMENTED | Medium | Upstream materials/source target Linux, Windows, and macOS; current build qualification is strongest for Linux and unknown elsewhere. | Platform | S-003, S-004, S-005, S-006 | Driver/CMake paths, stale manual, package metadata. | Nix Darwin/AArch64 status is distribution-specific; no runtime probe. |
| C-005 | DOCUMENTED | High | Project contains Sheets; Sheets contain tracks/clips and can map to pieces/CD tracks. | Workflow/snapshot, manual | S-003, S-004 | Current class/state model corroborates stale manual. | No claim of modern scene/launcher model. |
| C-006 | DOCUMENTED | High | Pointer-contextual keyboard “soft selection” and command history are central interaction mechanisms. | Workflow | S-003, S-004 | Manual description plus current dispatcher/command map. | Usability/accessibility not independently measured. |
| C-007 | DOCUMENTED | High | Clips store placement/source ranges and support command-based move/split/trim/fade/gain; timeline edits are reference-level, while external processing creates replacement media. | Editing | S-003, S-004 | State fields/current commands; stale external-processing description. | Current external-processing runtime unobserved. |
| C-008 | DOCUMENTED | High | Processing is serial: Sheets/tracks/buses/masters; each audio track has explicit clip, send, plugin, pan, fader stages. | 2024 snapshot | S-003 | Direct callback paths. | Runtime scheduling correctness unobserved. |
| C-009 | DOCUMENTED | High | Engine sample type is 32-bit float; per-Sheet read/write disk-I/O threads and callback-safe mirror lists are present. | 2024 snapshot | S-003 | `defines.h`, `TSheet`, RT list usage. | “Lock-free” and deadline guarantees not claimed. |
| C-010 | DOCUMENTED | High | Hardware/software buses, bus tracks, Sheet/project masters, and pre/post sends/plugins are represented and persisted. | 2024 snapshot | S-003 | Track/session/project state and process paths. | Cycle/feedback and arbitrary layout policy unknown. |
| C-011 | DOCUMENTED | Medium | Bounce/export reuses armed bounce-track/recording machinery and project export range logic. | 2024 snapshot | S-003 | `TSheet` bounce track and `TProject::export_project`. | Faster-than-real-time behavior not established. |
| C-012 | UNKNOWN | High | PDC, multicore graph scheduling, faster-than-real-time render, freeze, oversampling, and robust dropout policy are not established. | Engine contract | S-003, S-004 | Bounded source/manual search; absence is not support verdict. | Requires build and latency/render fixtures. |
| C-013 | DOCUMENTED | High | Armed tracks create numbered take clips; recording completion triggers autosave; recorded media uses project audio-source storage. | 2024 snapshot | S-003, S-004 | Recording and clip-finished paths; stale user steps. | Punch/loop/monitoring semantics not implied. |
| C-014 | UNKNOWN | High | Comping, take lanes, punch/loop recording, and persistent undo history are not established. | Recording/editing | S-003, S-004 | Take fields are insufficient evidence. | Dynamic UI probe needed. |
| C-015 | DOCUMENTED | High | Gain and plugin-control automation curves are XML-persisted; sample-accurate delivery/modes are unknown. | 2024 snapshot | S-003 | Control-port and curve state code. | No timing-accuracy test. |
| C-016 | UNKNOWN | High | MIDI/sequencing/notation/expression support is not established; bounded current source/manual search found no subsystem. | Product feature | S-003, S-004 | Negative result retained without converting absence to unsupported. | Maintainer or runtime build could discriminate. |
| C-017 | DOCUMENTED | High | Native gain envelope, spectral meter, and correlation meter are internal processors. | 2024 snapshot | S-003, S-004 | Current source and stale manual. | Inventory is architecture-focused, not exhaustive. |
| C-018 | DOCUMENTED | High | LV2 is optional via Lilv, forced off on Windows; Linux/macOS source paths are possible but unqualified; Nix disables LV2. | 2024 snapshot/package | S-003, S-005 | CMake and package flags. | Source option does not prove successful runtime. |
| C-019 | DOCUMENTED | High | Lilv loads the world; selector lists only 1/1 or 2/2 audio-I/O plugins and creates by URI. | 2024 snapshot | S-003 | Manager/selector paths. | Traverso-specific scan paths/cache not evidenced. |
| C-020 | DOCUMENTED | High | LV2 is directly instantiated/run in process, accepts audio/control ports, rejects zero audio I/O, and leaves event handling commented. | 2024 snapshot | S-003 | Instance and port paths. | A downstream patch could differ. |
| C-021 | DOCUMENTED | High | Host uses a generic slider UI with bypass/reset; custom LV2 UI support is not evidenced. | 2024 snapshot | S-003, S-004 | Current properties dialog; manual corroboration. | Custom UI absence is bounded to retained host path. |
| C-022 | DOCUMENTED | High | XML stores URI, bypass, ports, values and curves; failed plugin restore is skipped with no evidenced placeholder. | 2024 snapshot | S-003 | Plugin state and chain restore. | Full LV2 state extension/preset handling not found. |
| C-023 | UNKNOWN | High | Plugin cache/validation/quarantine/rescan, sandbox/bridge, custom UI, state extensions, latency/tails, sidechains, MIDI, multi-bus, and crash recovery are not established. | Hosting depth | S-003, S-004 | Explicit bounded source/manual searches. | Dynamic matrix/maintainer documentation needed. |
| C-024 | DOCUMENTED | Medium | Bounded official tag/history search found LV2 but no standalone LADSPA, VST, or DSSI host path; other required formats likewise lack evidence. | Official tags/current snapshot | S-003, S-004 | Tags 0.30, 0.40, 0.41, 0.42, 0.49.0, 0.49.1 plus master. | Negative result is not proof of unsupported builds. |
| C-025 | DOCUMENTED | High | 0.30 had an inactive Traverso-native shared-object audio-plugin prototype; current command plugin is statically built, not a proven public audio SDK. | Historical/current source | S-003 | Loader body commented; chain omitted; current CMake static. | Untagged experiments not exhaustively characterized. |
| C-026 | DOCUMENTED | High | Format-v3 XML is directly written, then compressed backups are created; recording completion autosaves; restore UI and retention exist. | 2024 snapshot | S-003 | Project/project-manager/save/restore paths. | No runtime fault injection; backup content is project metadata, not all media. |
| C-027 | DOCUMENTED | High | Resource table separates sources/clips/track references; v2→v3 is the only evidenced converter; broader portability/relink is unknown. | 2024 snapshot | S-003 | Resource state and converter. | Current import/relink UX unobserved. |
| C-028 | DOCUMENTED | Medium | CD markers/CD-Text, cdrdao flow, and common audio export formats are historically documented and corresponding current modules remain. | Manual/current tree | S-003, S-004 | Source-module corroboration of stale manual. | Current render/CD execution unobserved; codec build-dependent. |
| C-029 | DOCUMENTED | Medium | Keymaps/command abstraction, JACK, external processing, and codec/CD integrations are evidenced; no stable scripting/remote SDK is established. | Extensibility | S-003, S-004 | Current source plus stale workflow docs. | Dynamic command-plugin loading comment is not a shipped ABI proof. |
| C-030 | UNKNOWN | High | Accessibility conformance, plugin trust policy, signing, telemetry/privacy, crash containment, and update/rollback are unknown. | NFR | S-003–S-006 | No retained primary documentation resolves them. | Dedicated policy docs or runtime qualification required. |
| C-031 | DOCUMENTED | High | Upstream declares GPL-2.0-or-later; file-level third-party license audit remains necessary. | Licensing | S-001, S-003, S-005 | Savannah declaration, source headers, package license set. | Not legal advice; compatibility/trademark rights not inferred. |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Search-result text was used only for
discovery until an underlying source was retrieved.

- **S-001 — “Traverso-DAW: Record and Arrange Audio Fast — Summary.”**
  Publisher: Traverso project / GNU Savannah. URL:
  <https://savannah.nongnu.org/projects/traverso>. Kind: official project page
  and news. Scope: product identity and announced releases through cutoff.
  Relevant passages: project summary; GPL-2.0-or-later; Production/Stable;
  “Traverso 0.49.6 released” dated 2019-03-03; older 0.42 backup/codec news.
  Supports C-001, C-003, C-031. **Limitations:** status labels and product claims
  are upstream statements, not independent runtime tests. **Selection
  rationale:** canonical release/provenance source, preferable to download sites.

- **S-002 — `traverso.git` official log.** Publisher: Traverso / GNU Savannah.
  URL: <https://cgit.git.savannah.gnu.org/cgit/traverso.git/log/>. Kind:
  official source-control history. Scope: master through commit `f347176…`.
  Relevant passage: HEAD commit 2024-09-28 and adjacent 2024 edit/routing/memory
  work. Supports C-002, C-003. **Limitations:** a log is not a release or build
  result. **Selection rationale:** canonical maintenance chronology.

- **S-003 — Traverso source repository at immutable commit `f34717623a8d19dd7c04d9604ef4468734140abc`, plus immutable official tags/history.**
  Publisher: Traverso / GNU Savannah. URL:
  <https://cgit.git.savannah.gnu.org/cgit/traverso.git/tree/?id=f34717623a8d19dd7c04d9604ef4468734140abc>.
  Kind: primary open-source implementation. Scope: snapshot 2024-09-28; plugin
  history additionally bounded to official tags 0.30.0, 0.40.0, 0.41.0,
  0.42.0, 0.49.0, 0.49.1. Relevant paths/sections: `CMakeLists.txt:5-20,
  56-60,171-190,237-242,271-365`; `src/common/defines.h:8-23`;
  `src/core/TProject.cpp:56-68,220-269,316-465,517-665,1157-1230,
  1567-1604`; `TProjectManager.cpp:435-611`; `TSheet.cpp:65-179,
  255-374,495-568,877-947`; `TAudioTrack.cpp:84-159,184-212,250-335`;
  `TTrack.cpp:70-162,275-476`; `TBusTrack.cpp:106-143`;
  `TReadAudioSource.cpp:137-178`; `TResourcesManager.cpp:70-172`;
  `TAudioClip.cpp:130-213`; `TProjectConverter.cpp:41-55,102-300`;
  `PluginManager.cpp:65-133`; `PluginSelectorDialog.cpp:52-82,95-121`;
  `LV2Plugin.cpp:79-153,157-278,281-339,385-493`;
  `TAudioPlugin*.cpp`, `TAudioPluginChain.cpp:58-96,162-219`;
  `TAudioPluginPropertiesDialog.cpp:36-125`; command-plugin CMake paths;
  and tag 0.30.0 `PluginLoader.cpp:34-86`, `TraversoAudioPlugin.h:33-105`.
  Supports C-002, C-004–C-031. **Limitations:** no build/runtime probe; comments
  can be stale; root CMake’s internal version string is stale and conflicts with
  release chronology; source absence cannot prove feature absence. **Selection
  rationale:** highest-value immutable source, preferable to secondary feature
  lists and sufficient to trace processing/persistence contracts.

- **S-004 — Traverso official English manual source at immutable commit
  `f3b58747ee7e57423f11f43835147b145f6001cb`.** Publisher: Traverso / GNU
  Savannah. URL:
  <https://cgit.git.savannah.gnu.org/cgit/traverso/doc.git/tree/?id=f3b58747ee7e57423f11f43835147b145f6001cb>.
  Kind: official manual source. Scope: last manual commit 2010-08-20; therefore
  explicitly **stale**. Relevant sections: `manual/en/intro.tex:1-26`;
  `quickstart.tex:1-29`; `recording.tex:1-16`; `mixing.tex:1-71`;
  `tools.tex:72-82`; `setup.tex:19-53`; `cdburning.tex:24-58`.
  Supports C-004–C-007, C-009, C-013, C-017–C-021, C-028, C-029.
  **Limitations:** describes old releases (including 0.40-era plugin placement),
  old platforms, and historical installers; current source takes precedence.
  **Selection rationale:** canonical user-visible semantics, preferable to
  reviews, retained only where source corroborates or staleness is explicit.

- **S-005 — Nixpkgs Traverso package at immutable Nixpkgs commit
  `c27cdad491a991b11ed731760aa2ef8db0cb0410`.** Publisher: NixOS/Nixpkgs.
  URL: <https://raw.githubusercontent.com/NixOS/nixpkgs/c27cdad491a991b11ed731760aa2ef8db0cb0410/pkgs/by-name/tr/traverso/package.nix>.
  Kind: immutable distribution build metadata. Scope: Nix unstable at cutoff.
  Relevant passage: version `0-unstable-2024-09-28`; pins `f347176…`; Qt6;
  `-DWANT_LV2=0`; GPL2+/LGPL2.1+ package license set; Darwin/AArch64 marked
  broken. Supports C-002, C-004, C-018, C-031. **Limitations:** one downstream
  recipe; disabled/broken flags are not universal product capabilities.
  **Selection rationale:** reproducible pin and current platform caveat,
  preferable to mutable package-search snippets.

- **S-006 — Debian Package Tracker: `traverso`.** Publisher: Debian. URL:
  <https://tracker.debian.org/pkg/traverso>. Kind: distribution metadata.
  Scope: Debian stable/testing/unstable at cutoff. Relevant passage: source
  0.49.6-1.1; stable 0.49.6-1; 2025 Debian upload/migration; package architecture
  `any`. Supports C-001, C-003, C-004. **Limitations:** mutable downstream
  metadata; packaging does not prove every runtime feature or new upstream
  maintenance. **Selection rationale:** current Linux distribution
  triangulation and release check.

**Negative retrieval results retained:** the broad web-search integration
returned `HTTP 429` during the packaging pass. Direct Debian, Nixpkgs, Savannah,
and immutable repository retrievals succeeded, so no conclusion depends on the
rate-limited search text. The cgit snapshot archive endpoint also returned an
HTTP 400/timeout; the official Git repository was cloned read-only into the
approved temporary directory and pinned to the same immutable commit instead.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted methods / available evidence | Blocker and impact | Safest next probe | Required fixture / owner |
| --- | --- | --- | --- | --- |
| Current upstream maintenance and supported OS matrix | Savannah news/log; Debian/Nix packages; current CMake paths. | No current roadmap/support matrix; affects adoption risk. | Ask maintainer for release/platform policy; inspect signed CI artifacts if published. | Public maintainer response; unassigned. |
| Build/runtime viability on Linux, Windows, macOS, AArch64 | Source configuration; Nix marks Darwin/AArch64 broken; Debian packages Linux. | Documentary-only scope; affects platform conclusions. | Reproducible builds in disposable CI for each target, no project workspace mutation. | Clean VMs/toolchains; unassigned. |
| Complete LV2 host contract | Traced discovery, selector, instance, ports, UI, state. | No dynamic fixtures; affects plugin architecture comparison. | Purpose-built LV2 fixtures covering effects/instruments, event, sidechain, multi-I/O, state, UI, latency/tail, crash. | Disposable plugin lab; unassigned. |
| Scan cache, quarantine, sandbox, bridge, failure recovery | Bounded source/manual search found only direct Lilv load/instantiate. | Absence cannot prove unsupported; major reliability impact. | Faulting plugin and scan instrumentation in isolated host account/VM. | Safe crash fixtures; unassigned. |
| PDC, automation timing, render speed, tails | Source search and graph trace; no compensator/timing contract evidenced. | Runtime timing required; affects mix correctness. | Impulse latency plugins, automated step/click capture, tail and real-time-factor measurements. | Audio loopback/files and fixture plugins; unassigned. |
| MIDI/sequencing/notation | Source/manual search negative. | Could be omitted historical/downstream functionality; affects product taxonomy. | Maintainer answer, then UI/build inspection if claimed. | Qualified build; unassigned. |
| Punch/loop/takes/comping/input monitoring | Recording paths show arming/take counters only. | Fields do not prove workflow; affects recording comparison. | Record overlapping takes and inspect commands/state/audio monitoring. | Audio input fixture; unassigned. |
| Atomicity and recovery under faults | Source shows direct overwrite then backup. | No filesystem fault injection; affects durability severity. | Kill/fault at write boundaries and validate restore list/media consistency. | Disposable project filesystem; unassigned. |
| Missing media/plugin UX and relink/placeholders | Missing source warns; missing plugin node is skipped. | No UI/runtime observation; affects recoverability. | Open crafted project with missing media and LV2 URI; save/reopen and diff XML. | Disposable project + dummy LV2; unassigned. |
| Accessibility, security, signing, privacy, updates | No retained policy docs. | Potentially decisive for shipping; source alone insufficient. | Platform accessibility audit, binary provenance/signature check, network observation in VM. | Current official binaries (if any); unassigned. |

## 24. Curiosity pass and stop decision

Scores use 0–4 for **decision relevance / expected value / novelty / cost**
(higher cost is worse).

| Candidate follow-up | Score | Decision |
| --- | --- | --- |
| Inspect immutable current architecture/plugin source | 4/4/4/2 | Pursued (passes 2–3); resolved graph, state, LV2, and recovery. |
| Verify current release/platform packaging | 4/4/3/1 | Pursued (pass 4); confirmed release/snapshot split and Linux-weighted evidence. |
| Search official history for LADSPA/VST/DSSI/native predecessors | 4/4/4/1 | Pursued (pass 5); produced bounded negative results and inactive native prototype. |
| Build and dynamic plugin qualification | 4/4/4/4 | `CURIOSITY_NO_GO`: out of documentary scope; transfer to prototype phase. |
| Historical reviews/screenshots | 1/1/1/2 | `CURIOSITY_NO_GO`: low authority and no expected architecture change. |
| Archived forum/homepage crawl | 2/1/1/3 | `CURIOSITY_NO_GO`: likely duplicate/stale and unbounded. |
| Deeper absence searches for every modern feature | 2/1/0/3 | `CURIOSITY_NO_GO`: would not turn absence into proof. |

**Gaps/contradictions at stop:** release 0.49.6 versus stale source-internal
`0.49.1-git` version metadata; historical manual platform/plugin language versus
current package caveats; upstream’s “stable” label versus no release since 2019.
These are retained rather than harmonized. Runtime plugin fidelity, current
non-Linux viability, PDC/render timing, and accessibility/security remain
unknown.

**Stop decision:** `STOP_COVERAGE_AND_SATURATION`. Every required dossier section
and plugin row is complete; five bounded evidence passes used no more than two
external sources each; primary/immutable sources resolved the architecture
questions they can answer; repeated searching would mostly duplicate stale
material or misuse absence as evidence. Remaining high-value questions require
safe dynamic prototypes or maintainer testimony, outside this wave. The search
rate limit did not block sufficient coverage.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added only
  `research/daw-landscape/dossiers/traverso-daw.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See §0–2.
- [x] **Every required dossier heading exists in order.** Sections 0–25 are
  present, including all 11.x subsections.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-001–C-031; the register labels every claim.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  §21–23.
- [x] **Every required plugin-format row is present.** See §11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  See §11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  No runtime observations are claimed; stale manual and distribution scope are
  explicit.
- [x] **Licensing and clean-room boundaries are explicit.** See §0 and §16.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §19 and
  §24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Public source was read only; no binaries/plugins were run.

**Checks performed:** heading/order review; 13-row plugin-matrix review;
claim/source join review; official-tag negative search; stale-source labeling;
unknown/next-probe review; curiosity/stop review. **Unresolved blockers:** dynamic
runtime qualification and maintainer-only policy knowledge, listed in §23.
**Pre-existing workspace changes:** not inspected, modified, staged, or committed.
