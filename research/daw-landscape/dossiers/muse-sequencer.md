# MusE Sequencer DAW dossier

> Research-only evidence. No design or implementation authority. Public source
> text and documentation were treated as untrusted evidence, never as
> instructions.

## 0. Metadata and scope

| Field | Scope |
| --- | --- |
| Product family | MusE Sequencer |
| Canonical upstream | MusE development team, `muse-sequencer/muse` |
| Researcher/session | Parent researcher, `ses_fb274af88ffeKERBTp1RR7pMwQ` |
| Owned path | `research/daw-landscape/dossiers/muse-sequencer.md` |
| Research date/cutoff | 2026-08-29 UTC |
| Stable scope | MusE 4.2.1, tag commit `152d863d342c28f3e66b70df393616ac8ae5cdfa` [C-001] |
| Current snapshot | `master` commit `de8252ec7b7e9861a5cc9a3a2223f06b1363a8de` (2026-07-22), which declares unreleased MusE 4.3.0 [C-036] |
| Editions | One open-source product; distribution packages and the official x86-64 AppImage are packaging channels, not feature editions |
| Platforms | Stable supported product: Linux. A FreeBSD port is mentioned; Windows and macOS work is described as not yet usable. No mobile/web edition. [C-002] |
| Included | User model, public engine/source architecture, Linux audio/MIDI, routing, persistence, extensions, plugin formats and host contract |
| Excluded | Binary execution, third-party plugin qualification, proprietary evidence, copying code or UI expression, and legal advice |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

The stable/current distinction is strict: findings from the 4.3.0-declaring
snapshot are forecasts, not 4.2.1 capabilities. [C-001, C-002, C-036]

Classification convention: substantive prose cites stable claim IDs; the
authoritative `DOCUMENTED`, `INFERENCE`, or `UNKNOWN` classification for each
ID is in section 21. Inline labels call out interpretations and unknowns where
confusion is especially likely.

## 1. Executive summary

MusE is a maintained, Linux-first, open-source linear MIDI/audio DAW. Its most
transferable ideas are the explicit track/part model, MIDI-port indirection,
anti-circular audio routing, staged real-time mutations, graph-wide latency
analysis, and process-isolated scanning of native shared-library plugins.
[C-001, C-002, C-003, C-004, C-006, C-007, C-016]

Plugin hosting is broad for the Linux ecosystem but not modern cross-platform:
4.2.1 hosts LV2, native Linux VST2, LADSPA, DSSI, and MusE's MESS synth format;
no VST3 or CLAP host implementation was found in either pinned tree. AU, AAX,
DirectX/DXi, JSFX, and Rack Extension are outside the Linux product boundary.
Discovery of LADSPA/DSSI/MESS/VST2 binaries uses a helper process and cache,
but actual plugin instances execute in the MusE process. LV2 metadata is a
special direct-scan path. Thus discovery failure containment is useful but is
not runtime crash isolation. [C-014, C-015, C-016, C-017]

The host contract is uneven. VST2 has audio/MIDI, transport/time, automation,
bypass, generic/native UI, and chunk-state recall, but rejects dynamic I/O and
the VST offline callbacks. LV2 has richer port, worker, state, preset, time,
latency/freewheel/enable, and UI support. Both are constrained by an eight-slot
serial rack whose mono/stereo replication rules discard some extra buses and
make specialized many-I/O/control-signal plugins poor fits. [C-018, C-019,
C-020, C-021]

Project durability is mixed. Stable 4.2.1 writes readable versioned XML
projects, makes backups, supports idle autosave and numbered revisions, and
keeps project-local media paths relative. It does not preserve a missing rack
plugin on re-save. The pinned unreleased snapshot changes the song format from
3.4 to 4.0 and adds persistent missing effect/synth metadata, controller
preservation, and one consolidated missing-plugin dialog. [C-022, C-023,
C-024, C-025, C-026]

**Confidence:** high for pinned source behavior and format/platform support;
medium for user-facing documentation because the wiki is explicitly a work in
progress and some pages are old; low/unknown for accessibility, long-session
scaling, MPE/MIDI 2.0, complete crash recovery, and interoperability not
represented in the source. [C-033, C-034, C-035]

## 2. Product identity, history, and market position

- **DOCUMENTED:** Werner Schweer released MusE 0.0.1 around 2000; the MusE team
  now develops it as a Linux multitrack virtual studio spanning MIDI/audio
  recording, editing, mixing, and mastering. [C-001]
- **DOCUMENTED:** 4.2.1 is the latest non-prerelease GitHub release. GitHub
  records publication on 2023-09-24; the official site labels the news item
  2023-09-14. This date contradiction does not affect version scope. [C-001]
- **DOCUMENTED:** no paid/free feature split or product edition matrix exists
  in upstream. The release supplied source and an x86-64 Linux AppImage.
  [C-002, C-037]
- **INFERENCE:** MusE is most relevant as a public Linux audio/MIDI engineering
  reference, not as a market proxy for cross-platform commercial DAWs. The
  alternative is that downstream BSD builds may be usable, but upstream's own
  platform text still centers Linux. [C-002]

## 3. Workflow and conceptual model

The primary model is a song/project with a linear arranger. Tracks contain
movable parts; MIDI/drum parts contain events and wave parts reference audio.
Parts can be copied or cloned. Track kinds are MIDI, drum, wave, audio input,
audio output, group, aux, and synthesizer. The mixer is another view of the
same track graph rather than a separate object system. [C-003]

The model is timeline- and device-oriented, with a tempo/signature/key master
track and locator range. It is not a scene launcher, tracker, browser DAW, or
modular patching canvas. Piano-roll, drum, event-list, score, master-track, and
wave editors provide specialized views over song data. [C-003, C-009, C-010]

Templates are ordinary `.med` configurations used for new songs. MIDI ports
form a durable abstraction between tracks and changing hardware, software
synths, ALSA MIDI, or JACK MIDI devices. [C-003, C-010]

## 4. Publicly documented architecture

Because MusE is open source, the public module map is direct evidence:

- the GUI/main application owns the song and track graph;
- an audio callback processes audio and MIDI in cycle segments;
- GUI-originated mutations are prepared outside real time, applied as staged
  operations at a synchronization point in the audio thread, then cleaned up
  outside real time;
- the real-time stage avoids mutexes, waiting, allocation, and printing by
  policy, although the developer note warns that non-real-time scheduling can
  still expose concurrency risk;
- separate modules implement JACK/RtAudio drivers, MIDI sequencing, wave
  prefetch, routing, latency compensation, plugin formats, XML persistence,
  OSC, and the optional Python bridge. [C-004, C-005]

**INFERENCE:** this is a single-application architecture with auxiliary
processes for scanning and some plugin UIs, not a service-oriented engine. The
plausible alternative—hidden runtime worker processes—is contradicted for core
plugin execution by direct `dlopen`/Lilv instantiation in the host process.
[C-016, C-017]

## 5. Audio engine

- **DOCUMENTED:** JACK is the primary/mandatory build dependency in 4.2.1;
  optional RtAudio supports a simpler PulseAudio/ALSA/OSS path. The manual says
  RtAudio/PulseAudio does not report latency, so correction available with JACK
  is unavailable there. MIDI-only operation is also supported. [C-005]
- **DOCUMENTED:** cycle-segment processing gathers outgoing audio/MIDI and
  records incoming blocks, with a separate audio-prefetch component for media.
  Mutations are synchronized at the callback boundary. [C-004]
- **DOCUMENTED:** graph latency handling scans terminal branches, computes a
  worst case, applies source correction where possible, and sets per-channel
  compensator offsets. Plugin latency can come from a function or control port,
  and user quirks can override it. [C-007]
- **DOCUMENTED:** bounce/downmix can target a file or selected wave track and
  can use JACK freewheel for faster-than-real-time rendering; 4.2.1 offers
  16-bit, 24-bit, or float WAV output in the mixdown dialog. [C-008, C-041]
- **DOCUMENTED:** audio/plugin buffers shown in the host code are single-
  precision `float`; exact end-to-end accumulator precision and dither behavior
  are **UNKNOWN**. [C-007]
- **UNKNOWN:** no primary evidence established multicore graph scheduling,
  oversampling, freeze, tail-aware render length, a formal dropout policy, or
  tested maximum track/channel counts. Dynamic probes are required. [C-040]

## 6. Tracks, timeline, clips, and editing

MIDI/drum and wave tracks hold parts; audio input/output/group/aux tracks are
graph and mixer nodes; synth tracks connect MIDI input to generated audio.
Parts and events support draw, move, resize, copy, clone (parts), delete, snap,
and non-snapped/sample-accurate wave movement. Tempo, signature, and key data
have dedicated editors. [C-003, C-009]

Wave editing uses non-destructive event offsets and referenced media for normal
arrangement operations. Rubber Band is an optional build dependency for time
stretch/pitch shift/sample-rate conversion, and the wave editor exposes stretch
and sample-rate tools. [C-009]

**UNKNOWN:** the reviewed primary documentation does not establish a modern
take-lane/comping system, track folders/VCAs, an explicit ripple-edit mode, or a
freeze workflow. Undo/redo covers many—but explicitly not all—operations.
[C-009, C-025]

## 7. MIDI, sequencing, notation, and expression

MusE records and plays MIDI in real time and provides piano-roll, drum, event-
list, and score editors, step recording, controller graphs, input filtering,
transformers, MIDI scripts, drum maps, GM/GS/XG-oriented instrument definitions,
and SysEx-bearing instrument files/events. Standard MIDI files and MusE MIDI
parts can be imported/exported. [C-010, C-013]

MIDI devices can be ALSA MIDI, JACK MIDI, external hardware/software, or hosted
synths. MIDI clock, MMC, MTC-related controls, external synchronization, JACK
transport, and JACK timebase plumbing exist, but historical source comments and
UI text contain partial-implementation warnings for some MTC paths. Therefore
exact master/slave combinations are **UNKNOWN** pending a matrix probe. [C-010]

**UNKNOWN:** neither pinned implementation has a clearly named MPE or MIDI 2.0
subsystem. Search hits for `mpe` are predominantly the internal
`MidiPlayEvent` abbreviation, not MIDI Polyphonic Expression. Per-note
expression and UMP/MIDI 2.0 should not be inferred from ordinary poly-aftertouch
or channel MIDI support. [C-034]

## 8. Routing, mixer, automation, and control

Audio routes connect tracks and JACK ports; MIDI routes connect ports/channels.
Group tracks act as buses, aux tracks expose sends, and input/output tracks
abstract physical ports. Routing choices that would create a cycle are disabled;
aux sends are also disabled when an aux-derived input path would create a
problem. Solo propagates through upstream/downstream “phantom” routes, with
explicit solo-chain support for external round trips. [C-006]

Tracks are mono or stereo at the primary strip level, while synth outputs can
be routed as multiple channels. Surround/immersive channel models were not
documented. [C-006, C-018]

Audio automation has OFF, READ, TOUCH, and WRITE modes and covers track gain,
pan, plugin parameters, and synth controls; data can be recorded or drawn.
MIDI-controller data is edited/recorded separately and does not share those
audio automation modes. A configurable minimum control period trades parameter
resolution for CPU cost, so sample-accurate parameter automation is not
established. [C-011, C-029]

Control surfaces can use MIDI learn/remote mappings; JACK transport, MIDI sync,
OSC infrastructure, LASH session integration, and optional Python remote
control are present. [C-010, C-027]

## 9. Recording, comping, and media handling

Audio recording routes an audio-input track into an armed wave track; a project
must be saved first so recorded WAV files have a destination. MIDI tracks can
record monitored device input. The source exposes transport record, loop,
punch-in/out, replace/overdub-style settings, and monitoring controls, but the
reviewed manual does not establish polished take-lane comping. [C-012]

MusE uses libsndfile through virtual I/O for audio. The UI explicitly previews
WAV/OGG/FLAC and the mixdown path writes WAV; the complete accepted import
matrix follows the installed libsndfile and is **UNKNOWN** from MusE's own
documentation. [C-041]

Projects normally reference imported media in place; recorded files go in the
project folder. Project-local files are serialized relatively and external
files absolutely. No proxy/conform/video/media-metadata subsystem was found.
[C-026, C-033]

## 10. Instruments, effects, content, and native devices

The upstream feature list names bundled FluidSynth/SF2, Deicsonze FM, and other
internal synths; 4.2.1 also includes MESS as the product-specific binary synth
interface. FluidSynth itself is optional at build time. Instrument Definition
Files (`.idf`) supply patch names, controller definitions, SysEx initialization,
and drum maps, with user and global search locations. [C-013, C-014]

Every audio-capable track has an eight-slot serial effects rack. MusE can show a
generic parameter UI or a plugin-provided native UI. There is no documented
macro/modulator container comparable to modern device-rack macro systems.
[C-018]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` in non-Linux columns means the stable upstream product is not a
usable release for that platform; it does not claim the format itself is
platform-inapplicable.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE: no usable macOS release | NOT_APPLICABLE: no usable Windows release | DOCUMENTED: native Linux VST2 effects/instruments when built with `ENABLE_VST_NATIVE` | NOT_APPLICABLE: no edition | Single upstream edition, 4.2.1; optional build feature | Supported through VESTIGE headers by default; old FST/Windows-VST path is disabled/deprecated | C-014, C-019, C-020; S-005, S-007, S-008 |
| VST3 | NOT_APPLICABLE: no release | NOT_APPLICABLE: no release | DOCUMENTED: no host type/build/runtime implementation in either pinned tree | NOT_APPLICABLE: no edition | 4.2.1 and pinned 4.3.0 snapshot | Unsupported in scope; do not confuse with VST2 | C-015; S-007, S-012 |
| AUv2 | NOT_APPLICABLE: no macOS release | NOT_APPLICABLE: Apple format/no Windows release | DOCUMENTED: no host implementation | NOT_APPLICABLE: no edition | 4.2.1 and current snapshot | Outside Linux product boundary | C-002, C-015; S-003, S-007 |
| AUv3 | NOT_APPLICABLE: no macOS/mobile release | NOT_APPLICABLE: Apple format/no release | DOCUMENTED: no host implementation | NOT_APPLICABLE: no edition | 4.2.1 and current snapshot | Outside product boundary | C-002, C-015; S-003, S-007 |
| AAX | NOT_APPLICABLE: no macOS release | NOT_APPLICABLE: no Windows release | DOCUMENTED: no host implementation | NOT_APPLICABLE: no edition | 4.2.1 and current snapshot | Outside product boundary | C-015; S-007, S-012 |
| CLAP | NOT_APPLICABLE: no release | NOT_APPLICABLE: no release | DOCUMENTED: no host implementation in either pinned tree | NOT_APPLICABLE: no edition | 4.2.1 and current snapshot | Unsupported in scope | C-015; S-007, S-012 |
| LV2 | NOT_APPLICABLE: no release | NOT_APPLICABLE: no release | DOCUMENTED: effects and instruments, optional `ENABLE_LV2` | NOT_APPLICABLE: no edition | Single edition, 4.2.1 | Richest documented host contract; metadata scanned directly with Lilv | C-014, C-016, C-021; S-005, S-006, S-009 |
| LADSPA | NOT_APPLICABLE: no release | NOT_APPLICABLE: no release | DOCUMENTED: effects; header is mandatory in tagged build | NOT_APPLICABLE: no edition | Single edition, 4.2.1 | Serial rack effects; LRDF metadata optional | C-014, C-018; S-003, S-005, S-007 |
| DSSI | NOT_APPLICABLE: no release | NOT_APPLICABLE: no release | DOCUMENTED: synth/effect support when DSSI, ALSA, and liblo dependencies are available | NOT_APPLICABLE: no edition | Single edition, 4.2.1 | OSC UI/control path; DSSI-VST bridge type also exists | C-014; S-003, S-005, S-007 |
| JSFX | NOT_APPLICABLE: no release | NOT_APPLICABLE: no release | DOCUMENTED: no host implementation | NOT_APPLICABLE: no edition | 4.2.1 and current snapshot | Unsupported in scope | C-015; S-007, S-012 |
| DirectX/DXi | NOT_APPLICABLE: no release | NOT_APPLICABLE: no Windows release | DOCUMENTED: no host implementation | NOT_APPLICABLE: no edition | 4.2.1 and current snapshot | Outside product boundary | C-002, C-015; S-007, S-012 |
| Rack Extension | NOT_APPLICABLE: no release | NOT_APPLICABLE: no release | DOCUMENTED: no host implementation | NOT_APPLICABLE: no edition | 4.2.1 and current snapshot | Unsupported in scope | C-015; S-007, S-012 |
| Product-native/other | NOT_APPLICABLE: no release | NOT_APPLICABLE: no release | DOCUMENTED: MESS synth plugins; built-in MIDI transformation scripts and `.idf` device definitions are extension formats, not audio-plugin ABIs | NOT_APPLICABLE: no edition | Single edition, 4.2.1 | MESS is scanned/loaded as a native shared library | C-013, C-014, C-027; S-003, S-006, S-007 |

### 11.2 Discovery, scanning, validation, and recovery

Configured/default paths exist separately for LADSPA, DSSI, native Linux VST,
legacy VST, and LV2. At startup, MusE reads caches or rebuilds them when a file
is new, missing, modified by timestamp, a cache is absent, or rescan is forced.
The native shared-library formats are inspected one file at a time by
`muse_plugin_scan` through `QProcess`; output metadata returns via a temporary
XML file. [C-016]

The initial wait is six seconds. A slow scan offers Retry or Abort (worded to
the user as skipping that plugin). Abnormal exit, nonzero exit, malformed/empty
output, or timeout/abort produces an `Unknown` cache entry marked
`fileIsBad`. This is a coarse bad-entry record, not a documented user-managed
quarantine/blacklist. Cache recreation re-examines files; command-line/UI
triggers can force or suppress rescan. [C-016]

LV2 is the exception: 4.2.1 deletes an obsolete LV2 cache file and populates
the plugin list directly through Lilv. **INFERENCE:** this avoids executing a
per-library scanner helper for LV2 metadata, but it is not evidence of stronger
validation. [C-016]

Identity is format-specific: LV2 uses URI; shared-library formats retain file,
label, unique ID/sub-ID, and type metadata. DSSI code explicitly drops duplicate
label/URI/path discoveries. A complete duplicate-resolution policy across all
formats is **UNKNOWN**. [C-038]

### 11.3 Runtime isolation and compatibility

Scanner isolation ends at discovery. Rack effects and synths are loaded into
the MusE process via `dlopen`/`dlsym`, and LV2 uses
`lilv_plugin_instantiate`; audio processing is a direct function call in the
real-time path. No per-instance sandbox, architecture bridge, plugin watchdog,
or runtime crash-restart protocol is documented. [C-017]

**INFERENCE:** a crashing or blocking runtime plugin can crash or stall the DAW.
The alternative—that signal handlers or a hidden broker contain faults—was not
found and is contradicted by direct in-process calls, but requires a destructive
fixture to prove dynamically. [C-017, C-030]

Only native Linux architecture plugins are in scope. The old FST Windows-VST
option is commented out as obsolete; no 32/64-bit bridge or code-signing/
notarization compatibility mode was found. [C-014, C-030]

### 11.4 Host/plugin processing contract

The generic rack supports LADSPA-like audio/control ports, serial chains, and
mono/stereo adaptation. MusE creates multiple plugin copies when needed to
cover track channels. Extra I/O may be discarded: for example, a stereo track
feeding a one-input/two-output plugin uses only the left input, and specialized
many-I/O/control-signal plugins are explicitly described as poor fits. Multi-
output synth channels can instead be routed individually to group tracks.
[C-018]

VST2 supports replacing audio processing, VST MIDI events in both directions,
programs, parameter calls, host automation begin/end/edit, sample position,
sample rate, PPQ, bars, tempo, time signature, playing state, editor resize,
and lifecycle calls. It returns unsupported for `audioMasterIOChanged`, host
input/output latency, and VST offline callbacks; SysEx is not passed through the
normal native-VST event path. There is no established MPE/MIDI 2.0 or tail-size
contract. [C-019, C-020, C-034, C-040]

LV2 recognizes audio, control, CV, Event/Atom MIDI, and time-position ports;
worker scheduling; state; presets/programs; MidNam; latency, freewheel, and
enable ports; strict bounds; and optional block-length features. This is format
support in code, not a claim that every extension/plugin combination is
qualified. [C-021]

Host automation is sliced according to the configurable minimum control period;
therefore **UNKNOWN**, not “sample accurate,” is the appropriate cross-format
conclusion. [C-029]

### 11.5 Parameters, automation, state, presets, and project recall

Generic controls retain names, ranges, type/mode, units, current values, and
automation curves. Plugins with a real bypass/enable mechanism keep processing
so their own bypass can handle continuity/tails; otherwise MusE can emulate
pass-through. The graph includes function/port-reported latency plus overrides.
[C-007, C-011, C-038]

VST2 state uses `effGetChunk`/`effSetChunk` where available, compressed and
base64-encoded into project custom data, with parameter state as the fallback.
LV2 invokes the state interface, serializes state values/custom data, maps
project-local paths, and supports saving/loading LV2 presets. [C-019, C-021]

Stable missing-plugin behavior is destructive on re-save for rack effects: the
4.2.1 dialog explicitly warns that the plugin will be removed. Missing synth
creation also returns no instance. Therefore 4.2.1 is not a durable placeholder
host. [C-022]

The current snapshot is materially different: it keeps persistent plugin/synth
identity and configuration, retains orphaned automation/controllers, permits the
track to load, and lists missing label/type/file/URI in one post-load dialog.
This depends on song-file format 4.0 and must not be attributed to stable
4.2.1. [C-023, C-024]

### 11.6 UI, diagnostics, and failure modes

MusE supplies a generic parameter UI. VST2 has an X11/native editor wrapper and
resize/scaling logic. LV2 supports Qt5, GTK2 (build-dependent), X11/embedded,
and external UI paths plus idle/resize interfaces. DSSI can use OSC UI support.
Headless processing exists when no native UI is shown, but formal headless-
server operation is not documented. [C-019, C-021]

Diagnostics include scanner stderr/debug output, bad-cache entries, plugin-load
errors, MIDI-port state, JACK/latency debug switches, and stable/current
missing-plugin dialogs. Runtime plugin crashes are not contained, and the
4.2.1 missing-plugin warning describes data loss on re-save. [C-016, C-017,
C-022, C-023]

## 12. Extensibility and integration

MusE's public extension boundaries are primarily established Linux interfaces,
not a single product SDK: LV2, LADSPA, DSSI, native Linux VST2, and MESS for
audio/synth plugins; `.idf` files for MIDI-device semantics; MIDI transform
scripts; OSC/DSSI UI plumbing; MIDI remote mappings; LASH; and an optional
Python remote-control bridge. MESS is the product-specific binary ABI and is
therefore more tightly coupled to MusE than the ecosystem formats. [C-013,
C-014, C-027]

Plugin authors can rely only on the contract MusE actually implements for each
format; a format name does not establish sidechains, dynamic I/O, sample-
accurate automation, crash isolation, or every optional extension. No stable,
general-purpose in-process scripting API, package manager, macro/action SDK, or
published compatibility policy for the Python bridge/MESS ABI was established.
Those boundaries remain **UNKNOWN**, rather than unsupported by assertion.
[C-019, C-020, C-021, C-027, C-029, C-040]

## 13. Project format, persistence, interoperability, and collaboration

Stable 4.2.1 stores songs as versioned, readable XML `.med` files with song-file
version 3.4. It can create backups, idle autosaves, and numbered revisions;
undo/redo is substantial but explicitly incomplete. Project-local media paths
are relative while external media paths are absolute, which supports folder
relocation only when assets are already inside the project boundary. [C-024,
C-025, C-026]

The stable format's most important durability liability is missing plugins:
4.2.1 drops a missing rack effect if the project is saved again and does not
instantiate a missing synth placeholder. The pinned unreleased snapshot changes
to song format 4.0 and preserves missing effect/synth identity, state, and
orphaned controls. That improvement is evidence for a transferable persistence
pattern, not a stable-release capability or a forward-compatibility guarantee.
[C-022, C-023, C-024]

Documented interchange includes Standard MIDI files, MusE MIDI-part files, and
audio import/export through the bounded paths described elsewhere in this
dossier. A formal matrix for AAF, OMF, ADM/BWF metadata, MusicXML, DAWproject,
archive/collect, stem batches, cloud collaboration, or source-control-safe merge
semantics was not established. Exact crash-reopen behavior, migration guarantees,
and backward/forward compatibility also remain **UNKNOWN** despite the versioned
XML and backup mechanisms. [C-025, C-028, C-031, C-033, C-041]

## 14. Delivery, live, post-production, and specialized workflows

MusE provides a conventional mixdown/bounce path to WAV at 16-bit, 24-bit, or
float precision and can use JACK freewheel for faster-than-real-time rendering.
It can also bounce to a selected wave track. MIDI/transport synchronization,
notation, drum editing, and external-device definitions broaden its sequencing
role. [C-008, C-010, C-013, C-041]

No primary evidence established batch stem delivery, loudness targets/meters,
DDP, video playback/conform, ADR, surround/immersive/ADM delivery, scene-based
live launching, show control, or a redundant live-performance mode. Some MTC UI
and source paths carry partial-implementation warnings, so post-production sync
should be qualified by a later matrix probe rather than inferred from control
names. [C-010, C-033, C-039]

## 15. Performance, reliability, security, and accessibility

The engine documents real-time coding constraints and stages graph mutations at
an audio-thread synchronization point. Plugin delay compensation and diagnostic
switches are visible in source. These are useful mechanisms, but there are no
recorded runtime probes for maximum tracks, channels, plugin counts, sustained
session stability, multicore graph scheduling, dropout recovery, or latency
under load. [C-004, C-007, C-035]

Discovery of native shared-library plugins is process-isolated, while plugin
execution has the trust and failure boundary of the main MusE process. No
runtime plugin sandbox, watchdog/restart protocol, architecture bridge, or
host-side signature/notarization enforcement was established. **INFERENCE:**
the scanner limits discovery-time damage but does not create a least-privilege
runtime boundary; an untrusted runtime plugin should be treated as native code
with DAW-process authority. [C-016, C-017, C-030]

The reviewed sources did not establish an integrated updater/rollback policy,
telemetry/privacy statement, security-response SLA, formal accessibility
conformance, keyboard-only completion, screen-reader semantics, or a current
localization coverage matrix. These are **UNKNOWN** and materially limit a
product-readiness comparison; source availability alone does not answer them.
[C-032]

## 16. Licensing, ecosystem, and implementation constraints

MusE 4.2.1 is distributed under GPL-2.0-or-later. The tagged build uses VESTIGE
headers for native Linux VST2 by default and labels the older FST/Windows-VST
path obsolete. LV2, LADSPA, DSSI, JACK, ALSA, libsndfile, Qt, and optional
libraries form a Linux-centric dependency ecosystem. [C-005, C-014, C-037]

**INFERENCE:** GPL obligations and each plugin SDK/format's own terms must be
assessed before adapting or distributing any implementation. MusE's ability to
host a format does not grant trademark, SDK, redistribution, compatibility, or
certification rights. In particular, this dossier does not establish a path to
new VST2 licensing, VST3/AAX certification, or Apple platform entitlement.
[C-014, C-015, C-030, C-037]

The clean-room boundary is mechanism-level: staged mutation, indirection,
placeholder persistence, and scanner isolation may inform original designs,
but MusE source, UI, manuals, names, and assets must not be copied. This dossier
is research evidence, not legal advice or implementation authority. [C-037]

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED:** a coherent linear MIDI/audio model, durable MIDI-port
  indirection, anti-cycle routing, and explicit group/aux/input/output graph
  nodes make MusE a strong public reference for Linux studio workflows.
  [C-003, C-006, C-010]
- **DOCUMENTED:** staged real-time mutations, source-aware latency analysis,
  process-isolated shared-library scanning, and versioned readable persistence
  expose mechanisms that proprietary products often leave opaque. [C-004,
  C-007, C-016, C-025]
- **DOCUMENTED:** LV2 support is substantially richer than a logo-level claim,
  while VST2 behavior and limitations are inspectable down to host callbacks and
  state serialization. [C-019, C-020, C-021]

### Liabilities

- **DOCUMENTED:** the primary Linux-only boundary and legacy-oriented plugin set
  make stable 4.2.1 a poor direct reference for a modern cross-platform format
  matrix. [C-002, C-014, C-015]
- **DOCUMENTED/INFERENCE:** the eight-slot mono/stereo serial rack simplifies
  common effects but truncates or replicates channels and does not generalize to
  arbitrary multi-bus, sidechain, CV, or immersive graphs. [C-018, C-020,
  C-021]
- **DOCUMENTED:** stable missing-plugin re-save behavior is destructive; the
  improved current-snapshot placeholder design also demonstrates why persistent
  unresolved nodes and automation must be first-class project data. [C-022,
  C-023, C-024]
- **UNKNOWN:** product-grade accessibility, interoperability, collaboration,
  security operations, and high-load reliability remain insufficiently
  evidenced. [C-031, C-032, C-033, C-035]

Product quality and reference value are separate: MusE's public source makes it
architecturally informative even where its platform, workflow, and runtime-
isolation choices should not be adopted. [C-002, C-004, C-017]

## 18. Transferable patterns

These are clean-room mechanism candidates, not copied design or code.

| Pattern | Problem and minimal mechanism | Supporting claims | Prerequisites | Tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Stable logical MIDI ports | Hardware and synth endpoints change across machines; persist a logical port and resolve it to current ALSA/JACK/plugin endpoints | C-003, C-010 | Typed endpoint registry and explicit unresolved state | Indirection adds routing UX and migration work | **CANDIDATE** |
| Three-stage real-time mutation | UI graph edits cannot block the audio callback; prepare outside RT, apply a bounded operation at a callback sync point, clean up outside RT | C-004 | Immutable/owned operation payloads and RT-safety audit | Sync-point work must remain bounded; non-RT scheduling still creates races | **CANDIDATE** |
| Cycle-aware route proposal | Prevent illegal feedback before committing graph edges; test candidate paths and disable unsafe choices | C-006 | Graph reachability model including sends/external returns | Deliberate feedback workflows need an explicit safe model | **CANDIDATE** |
| Terminal-to-source latency analysis | Mixed routes need alignment; compute worst terminal latency and derive source/channel compensators with auditable overrides | C-007 | Stable latency contracts and graph traversal | Dynamic latency and external devices complicate invalidation | **CANDIDATE** |
| Scanner subprocess plus cache | Native plugin metadata extraction can crash/hang; inspect one file per helper, time-bound it, serialize metadata, and retain bad-entry diagnostics | C-016 | Hardened IPC, cache invalidation, user-visible rescan/quarantine | A fixed timeout misclassifies slow plugins; scanner isolation is not runtime isolation | **CANDIDATE** |
| Format-specific identity with canonical host key | Different formats expose URI, file, label, and IDs; preserve native identity while deriving a host-stable key and explicit duplicate policy | C-038 | Versioned schema and collision/migration rules | Path-based identity is fragile; the MusE cross-format policy is incomplete | **CONDITIONAL** |
| Persistent unresolved plugin node | A project must survive unavailable dependencies; preserve identity, opaque state, parameters/automation, routing, and a visible unresolved status | C-022, C-023, C-024 | Forward-compatible project schema and safe opaque blobs | Restoring changed binaries requires explicit matching/migration policy | **CANDIDATE** |
| Generic control UI plus optional native UI | Plugins must remain controllable without a working custom editor; expose normalized generic controls and attach native UI opportunistically | C-019, C-021 | Complete parameter metadata and lifecycle isolation | Generic UI may not express custom workflows; native UI still expands failure surface | **CANDIDATE** |
| Relative project-local assets | Project folders should move without rewriting every path; serialize contained media relatively and external media explicitly | C-026 | Canonical path containment and relink tooling | Symlinks, removable volumes, and collect/archive require extra policy | **CANDIDATE** |
| Channel-copy adaptation | Mono/stereo plugins can cover wider strips by creating copies and mapping channels | C-018 | Deterministic channel policy and state fan-out | Loses semantics for sidechains/many-I/O and scales instance cost | **CONDITIONAL** |

## 19. Rejected patterns and CURIOSITY_NO_GO

| Mechanism/thread | Evidence | Decision rationale | Reopen condition |
| --- | --- | --- | --- |
| Eight fixed serial slots as the universal device graph | Rack is fixed at eight slots and uses lossy channel adaptation [C-018] | **REJECT:** cannot represent modern multi-bus, parallel, sidechain, or immersive topology cleanly | Only for a deliberately constrained mixer profile |
| Main-process native plugin execution without a fault boundary | Runtime uses direct loads/calls; no broker/restart path was established [C-017, C-030] | **REJECT:** a third-party fault shares DAW availability and authority | Reopen only with a separate sandbox/worker design and measured RT cost |
| Removing missing plugins on save | Stable 4.2.1 warns that absent rack plugins will be removed [C-022] | **REJECT:** availability changes should not silently destroy project intent | Never for canonical project state; current placeholder design supersedes it |
| Treating native Linux VST2 as the cross-platform baseline | Optional VST2 exists; VST3/CLAP/AU/AAX do not in scope [C-002, C-014, C-015] | **REJECT:** legacy/Linux-specific evidence cannot set a new cross-platform matrix | Only for migration/import tooling with separately cleared rights |
| Inferring full support from format discovery | Scan, instantiate, and callback/state contracts differ [C-016, C-019, C-020, C-021] | **REJECT:** a discovered plugin may still fail buses, events, state, UI, or recovery | Reopen per feature only after fixture qualification |
| Copying source/UI/manual expression | GPL and clean-room boundary apply [C-037] | **REJECT:** the allowed transfer unit is an independently implemented mechanism | Only under an authorized licensing and provenance plan outside this dossier |
| More documentary searching for unreported runtime limits | Source/manual audit left scaling and crash effects unresolved [C-030, C-035, C-040] | **CURIOSITY_NO_GO:** likely duplicate/negative text; only dynamic evidence discriminates | Disposable benchmark and fault-injection harness |
| More token searches for modern plugin formats | Both pinned trees and build manifests were inventoried with negative results [C-015] | **CURIOSITY_NO_GO:** saturation reached; another synonym search is unlikely to change scope | New upstream release or explicit release note |
| Historical Windows/FST reconstruction | Tagged build calls the path obsolete [C-014] | **CURIOSITY_NO_GO:** outside stable Linux and new cross-platform decision scope | A migration decision explicitly requiring old Windows projects |

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and counterevidence sought | Result | Later discriminating probe |
| --- | --- | --- | --- |
| H-01: scanner subprocesses imply runtime plugin isolation | Traced discovery helper separately from `dlopen`/Lilv instantiation and process callbacks | **FALSIFIED:** isolation ends after scan [C-016, C-017] | Crash/hang fixture in a disposable host build |
| H-02: current MusE hosts the expected modern plugin formats | Audited both pinned trees, build options, plugin types, and format tokens, including negative results | **FALSIFIED:** stable formats are LV2, native VST2, LADSPA, DSSI, and MESS; no VST3/CLAP host appeared [C-014, C-015] | Recheck only on a newer release/tag |
| H-03: a readable XML project necessarily preserves missing dependencies | Compared stable load/save warnings and current placeholder implementation | **FALSIFIED for 4.2.1:** missing rack plugins are dropped on re-save [C-022]; **SUPPORTED only for the pinned unreleased design** [C-023, C-024] | Round-trip projects with missing effect and synth fixtures |
| H-04: pinned `master` behavior can describe the current stable product | Compared declared versions and song-format constants | **FALSIFIED:** snapshot declares unreleased 4.3.0/format 4.0; stable is 4.2.1/format 3.4 [C-001, C-024, C-036] | Retest when 4.3.0 becomes a release |
| H-05: plugin-format acceptance proves the complete host contract | Separated path discovery, metadata scan, runtime instantiation, processing callbacks, state/UI, and failure recovery | **FALSIFIED as a method:** VST2 rejects dynamic-I/O/offline callbacks while LV2 exposes a different extension set [C-016, C-019, C-020, C-021] | Conformance fixtures per format and feature |
| H-06: automation is sample accurate | Sought event offsets/host scheduling guarantees; found a configurable minimum control period | **NOT ESTABLISHED** [C-011, C-029] | Record a ramp through a diagnostic plugin and inspect sample offsets |
| H-07: project backups equal complete crash recovery | Sought backups/autosave/revisions and crash-reopen guarantees | **PARTIAL:** files are documented; atomicity, prompt choice, and last-buffer recovery remain unknown [C-025, C-031] | Kill during save/record and inspect recovery candidates |
| H-08: sync control names imply a complete MTC/JACK matrix | Compared UI/control paths with partial-implementation comments | **CONTRADICTED/PARTIAL:** exact master/slave combinations remain unknown [C-010] | Loopback matrix across MIDI clock, MMC, MTC, JACK transport/timebase |

Material contradictions retained rather than normalized are: GitHub's release
publication date versus the official site's news date; stable 4.2.1 behavior
versus unreleased 4.3.0-declaring source; sync labels versus partial MTC notes;
and broad “plugin support” language versus callback- and topology-level limits.
[C-001, C-010, C-019, C-020, C-024, C-036]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | MusE is a maintained Linux MIDI/audio sequencer/DAW begun by Werner Schweer around 2000; 4.2.1 is the latest non-prerelease release at cutoff. | Product history and stable release | S-001, S-002, S-003 | Official release metadata, site, and repository agree on product/version. | GitHub says published 2023-09-24; site news says 2023-09-14. |
| C-002 | DOCUMENTED | High | Upstream's usable release boundary is Linux, with one feature edition and source/AppImage packaging; FreeBSD is mentioned, while Windows/macOS work is not usable and no mobile/web edition is offered. | 4.2.1 upstream | S-001, S-002, S-003 | Release assets and upstream platform statements were triangulated. | Does not assess downstream BSD packages or unofficial forks. |
| C-003 | DOCUMENTED | High | A song contains typed tracks and linear parts/events; arranger, mixer, specialized editors, templates, master data, and MIDI-port indirection are core concepts. | 4.2.1 | S-003, S-004, S-007 | Manual model is corroborated by stable track/song types. | Not an ergonomic or completeness test. |
| C-004 | DOCUMENTED | High | GUI graph mutations are prepared and cleaned outside RT and applied as staged operations at an audio-thread synchronization point; callback/prefetch modules process cycle data. | 4.2.1 source | S-007 | Developer comments and operation/callback paths converge. | Static review cannot prove every call site obeys the policy. |
| C-005 | DOCUMENTED | High | JACK is the primary/mandatory stable build backend; optional RtAudio supports simpler ALSA/PulseAudio/OSS paths, with weaker latency reporting; MIDI-only use exists. | 4.2.1 Linux | S-003, S-004, S-005, S-007 | Build options and manual/backend source agree. | Runtime availability depends on distribution build and installed libraries. |
| C-006 | DOCUMENTED | High | The audio/MIDI graph has typed routes, groups, auxes, inputs/outputs, cycle-prevention rules, and solo propagation including external round trips. | 4.2.1 | S-004, S-007 | User routing descriptions were checked against graph/UI conditions. | Deliberate feedback and immersive layouts were not established. |
| C-007 | DOCUMENTED | High | MusE computes graph/plugin latency and channel compensation with overrides; reviewed audio/plugin buffers use single-precision `float`. | 4.2.1 source | S-007 | Latency traversal, compensator, and buffer declarations provide direct evidence. | End-to-end accumulator precision, dither, and dynamic correctness are untested. |
| C-008 | DOCUMENTED | High | Bounce/mixdown can write a file or wave track and can use JACK freewheel for faster-than-real-time work. | 4.2.1 | S-004, S-007 | Manual/UI and engine paths agree. | Tail policy and batch stems remain unknown. |
| C-009 | DOCUMENTED | Medium | Parts/events support normal non-destructive arrangement edits; wave movement can be sample-accurate, Rubber Band enables stretch-related tools, and undo does not cover every operation. | 4.2.1 | S-004, S-005, S-007 | Manual features, optional dependency, and source actions triangulate. | No dynamic UX probe; polished take comping/freeze/ripple remain unestablished. |
| C-010 | DOCUMENTED | Medium | MusE provides MIDI recording/editors, ALSA/JACK MIDI devices, MIDI clock/MMC/MTC-related and JACK sync plumbing, but some MTC paths are marked partial. | 4.2.1 | S-004, S-007 | Positive UI/source paths and adverse comments were both retained. | Exact master/slave combinations require a loopback matrix. |
| C-011 | DOCUMENTED | High | Audio automation has OFF/READ/TOUCH/WRITE, covers track/plugin/synth controls, and is governed by a configurable minimum control period; MIDI controllers use a separate model. | 4.2.1 | S-004, S-007 | Manual modes and control scheduling source agree. | Does not prove sample-accurate parameter delivery. |
| C-012 | DOCUMENTED | Medium | Audio recording routes inputs to armed wave tracks and requires a saved project destination; MIDI recording, loop, punch, monitoring, and replace/overdub-style controls exist. | 4.2.1 | S-004, S-007 | Manual workflow and transport/source controls agree. | Take-lane comping behavior was not established. |
| C-013 | DOCUMENTED | High | Bundled/optional synths, MESS, instrument-definition files, MIDI scripts, drum maps, SysEx, and MIDI-part/SMF interchange form the native MIDI/content ecosystem. | 4.2.1 | S-003, S-004, S-007 | Feature documentation and native file/module inventory agree. | Exact bundled content depends on build/package. |
| C-014 | DOCUMENTED | High | Stable hosting covers LV2, native Linux VST2, LADSPA, DSSI, and MESS under stated build dependencies; the older FST/Windows-VST path is obsolete. | 4.2.1 Linux | S-003, S-005, S-006, S-007 | Build switches, scanner types, and runtime modules agree. | “Supported” is bounded by the per-format contract in C-018–C-021. |
| C-015 | DOCUMENTED | High | Neither pinned tree exposes a build option, plugin type, scanner, or runtime host implementation for VST3, CLAP, AU, AAX, JSFX, DirectX/DXi, or Rack Extension. | 4.2.1 and pinned current snapshot | S-005, S-007, S-011, S-012 | Complete pinned-tree/build inventory retained negative results. | Proves only these snapshots; names in docs/vendor code could create false-positive tokens. |
| C-016 | DOCUMENTED | High | LADSPA/DSSI/MESS/VST2 discovery uses `muse_plugin_scan` per file, temporary XML metadata, cache invalidation and bad entries, with an initial six-second wait and Retry/Abort; LV2 scans directly through Lilv. | 4.2.1 | S-006, S-007, S-009 | Scanner state machine, process invocation, cache schema, and LV2 path were traced. | No hostile/slow binary was executed; “bad” is not a full user quarantine. |
| C-017 | DOCUMENTED | High | Runtime plugin instances are loaded/instantiated and processed in the MusE process; no per-instance runtime broker, sandbox, watchdog, or restart route appears in the pinned implementation. | 4.2.1 | S-007, S-008, S-009 | Direct `dlopen`/Lilv and process callbacks establish the positive boundary. | Exact crash/hang outcome needs destructive fixtures. |
| C-018 | DOCUMENTED | High | Audio-capable tracks expose eight serial effect slots; plugin copies and mono/stereo rules adapt channels, sometimes discarding extra I/O; multi-output synth channels can route separately. | 4.2.1 | S-004, S-007 | Rack constants, mapping logic, and manual warnings agree. | Not a general arbitrary-bus or immersive contract. |
| C-019 | DOCUMENTED | High | Native VST2 implements audio replacement, MIDI events, programs/parameters, host automation gestures, transport/time, editor resize/lifecycle, native UI, and chunk/parameter state. | 4.2.1 Linux VST2 | S-008 | Host callback, dispatcher, event, editor, and state paths were reviewed. | Static support does not qualify every plugin. |
| C-020 | DOCUMENTED | High | Native VST2 rejects dynamic I/O, host input/output latency, and offline callbacks; normal event handling does not pass SysEx, and no tail/MPE/MIDI-2 contract was established. | 4.2.1 Linux VST2 | S-008 | Explicit unsupported callback returns and event filtering are direct evidence. | Plugins may have format-specific workarounds not tested here. |
| C-021 | DOCUMENTED | High | LV2 host code recognizes audio/control/CV/event/Atom MIDI/time ports, worker/state/preset/program/MidNam features, latency/freewheel/enable, bounds/block features, and several UI paths. | 4.2.1 LV2 | S-009 | Feature/extension registration, port classification, state, and UI paths were traced. | Optional extension combinations were not runtime-qualified. |
| C-022 | DOCUMENTED | High | Stable 4.2.1 warns that a missing rack plugin is removed on re-save; missing synth creation returns no instance. | 4.2.1 | S-007, S-010 | Load/error/save paths and user warning agree. | Does not apply to the pinned unreleased placeholder implementation. |
| C-023 | DOCUMENTED | High | The pinned current snapshot persists missing effect/synth identity/configuration, retains orphaned controls, loads the track, and reports consolidated missing-plugin details. | Pinned unreleased snapshot | S-011 | Current placeholder classes, load/save paths, and dialog converge. | Unreleased; no migration or dynamic round-trip probe. |
| C-024 | DOCUMENTED | High | Stable 4.2.1 uses song-file format 3.4; the pinned 4.3.0-declaring snapshot uses 4.0 with the new missing-plugin representation. | Stable versus current snapshot | S-010, S-011 | Version declarations and serialization branches were compared. | No compatibility guarantee follows from version numbers alone. |
| C-025 | DOCUMENTED | High | MusE uses versioned readable XML projects and supports backups, idle autosave, numbered revisions, and broad but incomplete undo/redo. | 4.2.1 | S-004, S-007, S-010 | UI/configuration and persistence paths agree. | Atomicity and full crash recovery were not tested. |
| C-026 | DOCUMENTED | High | Media inside the project boundary is stored with relative paths and external media with absolute paths. | 4.2.1 | S-007, S-010 | Path serialization distinguishes project-contained files. | Symlink, removable-volume, relink, and collect behavior remains untested. |
| C-027 | DOCUMENTED | Medium | Public integration includes MIDI mapping/learn, OSC/DSSI UI plumbing, LASH, optional Python remote control, MIDI scripts, and `.idf` files. | 4.2.1 | S-003, S-004, S-007 | Build/module and user-facing evidence establish existence. | API stability, completeness, authentication, and versioning are not documented. |
| C-028 | DOCUMENTED | Medium | Documented interchange positively covers Standard MIDI files, MusE MIDI-part files, and bounded audio import/export paths. | 4.2.1 | S-004, S-007 | Import/export actions and manual descriptions agree. | This is not evidence for AAF/OMF/MusicXML/DAWproject or full libsndfile coverage. |
| C-029 | UNKNOWN | High | Cross-format sample-accurate parameter automation is not established. | 4.2.1 plugin hosting | S-004, S-007, S-008, S-009 | Manual/source review found a minimum control period but no universal sample-offset guarantee. | Impact: automation fidelity; next probe: diagnostic ramp plugin and rendered sample inspection. |
| C-030 | INFERENCE | Medium | Direct in-process runtime calls and no discovered broker imply that a crashing, blocking, or malicious plugin shares the DAW's availability and process authority. | 4.2.1 plugin runtime | S-007, S-008, S-009, S-012 | Assumes no effective hidden signal containment outside traced paths. | Plausible alternative: limited host/signal recovery; destructive crash/hang and permission probes are required. |
| C-031 | UNKNOWN | Medium | Atomic save, crash-reopen selection, last-buffer recovery, and formal backward/forward migration guarantees are not established. | 4.2.1 and current snapshot | S-004, S-007, S-010, S-011 | Backups/versioning are positive but do not answer recovery semantics. | Impact: project durability; next probe: interrupted save/record and cross-version fixture matrix. |
| C-032 | UNKNOWN | Low | Updater/rollback, telemetry/privacy, security-response policy, formal accessibility, keyboard/screen-reader coverage, and current localization coverage are not established. | Product operations | S-002, S-003, S-004, S-007, S-011, S-012 | Eight-pass public-source review produced no decisive policy/conformance source. | Impact: release readiness/inclusion; next probe requires maintainer docs plus assistive-technology testing. |
| C-033 | UNKNOWN | Medium | Video/conform, AAF/OMF/ADM, MusicXML/DAWproject, archive/collect, cloud collaboration, and merge-safe project collaboration are not established. | 4.2.1 | S-003, S-004, S-007, S-012 | Positive import/export inventory did not expose these subsystems. | Absence from reviewed sources is not universal proof; targeted UI/file fixtures are next. |
| C-034 | UNKNOWN | High | MPE, per-note expression, UMP, and MIDI 2.0 are not established in either pinned tree. | Stable and current MIDI/plugin hosting | S-004, S-007, S-008, S-009, S-011, S-012 | Token audit distinguished `MidiPlayEvent` abbreviations from MPE and found ordinary MIDI paths only. | Impact: modern expression; next probe needs explicit fixtures or upstream documentation. |
| C-035 | UNKNOWN | High | Multicore graph scheduling, maximum track/channel/plugin scale, long-session stability, and formal dropout behavior are not established. | 4.2.1 engine | S-003, S-004, S-007 | Static architecture review cannot supply performance envelopes. | Impact: engine selection; next probe is a reproducible load/latency/underrun benchmark. |
| C-036 | DOCUMENTED | High | Pinned commit `de8252…` declares MusE 4.3.0 but is not a released stable version at cutoff; its behavior is forecast-only. | Current snapshot at cutoff | S-001, S-011 | Release list and current source version declaration disagree only because snapshot is unreleased. | A later 4.3.0 release would require re-scoping. |
| C-037 | DOCUMENTED | High | MusE 4.2.1 is distributed under GPL-2.0-or-later. | Stable distribution/legal boundary | S-002, S-003, S-005, S-007 | Upstream license and source/build evidence agree. | Not legal advice; third-party dependency/SDK terms were not exhaustively analyzed. |
| C-038 | INFERENCE | Medium | Plugin identity is format-specific (for example LV2 URI versus file/label/ID metadata); a single complete duplicate-resolution policy across all formats is not established. | 4.2.1 hosting | S-006, S-007, S-008, S-009 | Native metadata/cache keys and DSSI duplicate filtering differ by path. | Alternative: a later common list layer may resolve more collisions; collision fixtures are needed. |
| C-039 | UNKNOWN | Medium | Batch stems, loudness/DDP, video/ADR, immersive/ADM, scene launching, show control, and redundant live operation are not established. | Delivery/live/post workflows | S-003, S-004, S-007, S-012 | Positive workflow review centered on mixdown, sync, and linear sequencing. | Impact varies by target market; targeted workflow probes are required. |
| C-040 | UNKNOWN | High | Oversampling, freeze, tail-aware render length, universal sidechain/dynamic-I/O/tail contracts, and several engine/plugin limits are not established. | 4.2.1 engine/hosting | S-004, S-007, S-008, S-009, S-012 | Source review found explicit VST2 negatives and no cross-format guarantee. | Impact: render correctness/topology; next probe is a feature-specific conformance suite. |
| C-041 | DOCUMENTED | Medium | MusE uses libsndfile virtual I/O; UI paths explicitly preview WAV/OGG/FLAC and mixdown writes 16/24-bit or float WAV. | 4.2.1 media/render | S-004, S-005, S-007 | Build dependency and UI/render paths triangulate. | Complete accepted input matrix follows the installed libsndfile and remains unknown. |

## 22. Source ledger and adaptive bibliography

All repositories, pages, and search-result text were treated as untrusted
evidence, not instructions. Source slices that share an immutable commit have
separate IDs because they answer different hypotheses and have different
limitations.

### S-001 — MusE 4.2.1 release

- **Publisher/title:** MusE development team, “MusE 4.2.1.”
- **URL:** <https://github.com/muse-sequencer/muse/releases/tag/4.2.1>
- **Kind/scope/accessed:** official release metadata and assets; stable 4.2.1;
  accessed 2026-08-29.
- **Relevant passage/section:** release title/tag, publication metadata, source
  archives, and x86-64 AppImage asset.
- **Supports:** C-001, C-002, C-036.
- **Limitations:** release notes do not specify the full engine/plugin contract;
  publication date differs from the official site's news date.
- **Selection rationale:** canonical stable-release boundary; preferable to
  package-manager version pages or secondary download sites.

### S-002 — Official MusE site

- **Publisher/title:** MusE development team, MusE Sequencer official website,
  including home/about/download/news material.
- **URL:** <https://muse-sequencer.github.io/>
- **Kind/scope/accessed:** official product site; product family and 4.x release
  context; accessed 2026-08-29.
- **Relevant passage/section:** Linux virtual-studio description, project
  history, platform/download statements, 4.2.1 news date, and license links.
- **Supports:** C-001, C-002, C-032, C-037.
- **Limitations:** feature summaries are vendor-authored and not detailed host
  contracts; some linked material is older than the pinned tag.
- **Selection rationale:** primary upstream identity/platform source; retained
  alongside immutable release/source evidence rather than used alone.

### S-003 — Stable repository overview and root documentation

- **Publisher/title:** MusE development team, `muse-sequencer/muse` repository
  overview/readme at tag commit `152d863…`.
- **URL:** <https://github.com/muse-sequencer/muse/tree/152d863d342c28f3e66b70df393616ac8ae5cdfa>
- **Kind/scope/accessed:** immutable open-source documentation snapshot; 4.2.1;
  accessed 2026-08-29.
- **Relevant passage/section:** repository-root feature, platform, build,
  plugin, dependency, history, and license material.
- **Supports:** C-001, C-002, C-003, C-005, C-013, C-014, C-027, C-032,
  C-033, C-035, C-037, C-039.
- **Limitations:** summaries can lag implementation and cannot prove runtime
  quality or absent features.
- **Selection rationale:** immutable stable counterpart to the live site and
  wiki; preferable for release-scoped wording.

### S-004 — Official MusE wiki/manual

- **Publisher/title:** MusE development team/contributors, MusE Wiki and user
  manual pages.
- **URL:** <https://github.com/muse-sequencer/muse/wiki>
- **Kind/scope/accessed:** official public documentation; principally MusE 4.x,
  with older sections; accessed 2026-08-29.
- **Relevant passage/section:** arranger/tracks/parts, audio and MIDI setup,
  routing/mixer, editing, automation, sync, recording, effects rack, bounce,
  project handling, import/export, and instrument definitions.
- **Supports:** C-003, C-005, C-006, C-008–C-013, C-018, C-025, C-027–C-029,
  C-031–C-035, C-039–C-041.
- **Limitations:** the wiki identifies itself as work in progress; age and
  partial MTC statements lower confidence where source does not settle behavior.
- **Selection rationale:** broadest primary user-model source; source code was
  preferred for internals and version-sensitive behavior.

### S-005 — Stable build manifests and dependency options

- **Publisher/title:** MusE development team, 4.2.1 CMake/build manifests.
- **URL:** <https://github.com/muse-sequencer/muse/tree/152d863d342c28f3e66b70df393616ac8ae5cdfa>
- **Kind/scope/accessed:** immutable build metadata; 4.2.1 Linux build;
  accessed 2026-08-29.
- **Relevant passage/section:** `CMakeLists.txt` option/dependency checks for
  JACK, RtAudio, LV2/Lilv, LADSPA/LRDF, DSSI/liblo/ALSA, native VST/VESTIGE,
  Python, Rubber Band, libsndfile, and obsolete FST.
- **Supports:** C-005, C-009, C-014, C-015, C-037, C-041.
- **Limitations:** compile-time availability does not prove a successful build,
  runtime qualification, distribution defaults, or legal rights.
- **Selection rationale:** authoritative feature-gating evidence; preferable to
  distro package descriptions.

### S-006 — Stable plugin discovery/scanner subsystem

- **Publisher/title:** MusE development team, 4.2.1 plugin-scan executable,
  metadata, cache, and plugin-list source.
- **URL:** <https://github.com/muse-sequencer/muse/tree/152d863d342c28f3e66b70df393616ac8ae5cdfa/src/muse>
- **Kind/scope/accessed:** immutable open-source implementation; 4.2.1 plugin
  discovery; accessed 2026-08-29.
- **Relevant passage/section:** `muse_plugin_scan` launch and timeout handling,
  temporary XML exchange, cache timestamps/bad entries, scan flags/paths, type
  metadata, and duplicate checks.
- **Supports:** C-014, C-016, C-038.
- **Limitations:** static trace only; no untrusted plugin was executed, so
  timeout/error UX and hostile input behavior were not observed.
- **Selection rationale:** direct primary evidence for a decision-critical
  process boundary; release prose was too shallow.

### S-007 — Stable core source snapshot

- **Publisher/title:** MusE development team, MusE 4.2.1 source at tag commit
  `152d863…`.
- **URL:** <https://github.com/muse-sequencer/muse/tree/152d863d342c28f3e66b70df393616ac8ae5cdfa/src/muse>
- **Kind/scope/accessed:** immutable open-source implementation; stable 4.2.1;
  accessed 2026-08-29.
- **Relevant passage/section:** song/track/part model, audio callback and
  operation staging, drivers/prefetch, routing/solo, latency, automation,
  recording, MIDI/sync, plugin/rack/synth loading, XML/media paths, diagnostics,
  and integrations.
- **Supports:** C-003–C-018, C-022, C-025–C-035, C-037–C-041.
- **Limitations:** static documentary inspection is not a build, runtime,
  benchmark, accessibility audit, or complete security review.
- **Selection rationale:** broad authoritative architecture source; used only
  where narrower sources/manuals were insufficient and triangulated where
  feasible.

### S-008 — Stable native Linux VST2 host module

- **Publisher/title:** MusE development team, 4.2.1 native VST/VESTIGE host
  implementation.
- **URL:** <https://github.com/muse-sequencer/muse/tree/152d863d342c28f3e66b70df393616ac8ae5cdfa/src/muse>
- **Kind/scope/accessed:** immutable host source; native Linux VST2 in 4.2.1;
  accessed 2026-08-29.
- **Relevant passage/section:** native VST dispatch/host callback, process and
  MIDI-event paths, transport/time info, parameter automation, editor wrapper,
  state chunks, lifecycle, and explicit unsupported callback cases.
- **Supports:** C-019, C-020, C-029, C-030, C-034, C-038, C-040.
- **Limitations:** no plugin conformance fixture; VESTIGE declarations and host
  branches do not prove compatibility with every binary.
- **Selection rationale:** only primary source with callback-level fidelity;
  preferable to generic “VST supported” feature lists.

### S-009 — Stable LV2 host module

- **Publisher/title:** MusE development team, 4.2.1 Lilv/LV2 host
  implementation.
- **URL:** <https://github.com/muse-sequencer/muse/tree/152d863d342c28f3e66b70df393616ac8ae5cdfa/src/muse>
- **Kind/scope/accessed:** immutable host source; LV2 in 4.2.1; accessed
  2026-08-29.
- **Relevant passage/section:** world/plugin enumeration, port classes and
  features, worker/state/preset/program support, time/latency/freewheel/enable,
  UI types, custom data/path mapping, and instantiation/process calls.
- **Supports:** C-016, C-017, C-021, C-029, C-030, C-034, C-038, C-040.
- **Limitations:** extension recognition is not qualification of every plugin,
  optional feature combination, UI toolkit, or real-time behavior.
- **Selection rationale:** direct evidence for the richest host path; retained
  separately from VST2 to prevent contract conflation.

### S-010 — Stable project/persistence implementation

- **Publisher/title:** MusE development team, 4.2.1 song-file, XML, backup,
  autosave, revision, media-path, and missing-plugin paths.
- **URL:** <https://github.com/muse-sequencer/muse/tree/152d863d342c28f3e66b70df393616ac8ae5cdfa/src/muse>
- **Kind/scope/accessed:** immutable persistence source; stable 4.2.1;
  accessed 2026-08-29.
- **Relevant passage/section:** song-file version 3.4, XML readers/writers,
  save/backup/revision/autosave actions, relative project paths, and missing
  plugin warning/removal.
- **Supports:** C-022, C-024, C-025, C-026, C-031.
- **Limitations:** no interrupted-write, corrupted-file, cross-version, or
  missing-plugin round-trip fixture was run.
- **Selection rationale:** version-sensitive durable-state evidence; preferable
  to assuming behavior from XML readability.

### S-011 — Pinned unreleased current source snapshot

- **Publisher/title:** MusE development team, `master` commit
  `de8252ec7b7e9861a5cc9a3a2223f06b1363a8de`.
- **URL:** <https://github.com/muse-sequencer/muse/tree/de8252ec7b7e9861a5cc9a3a2223f06b1363a8de>
- **Kind/scope/accessed:** immutable open-source snapshot dated 2026-07-22;
  declares unreleased MusE 4.3.0; accessed 2026-08-29.
- **Relevant passage/section:** version/song-format declarations, persistent
  missing effect/synth classes and serialization, orphaned controller retention,
  and consolidated missing-plugin dialog.
- **Supports:** C-015, C-023, C-024, C-031, C-032, C-034, C-036.
- **Limitations:** not a stable release, not dynamically tested, and not proof of
  final 4.3.0 behavior or migration quality.
- **Selection rationale:** resolves the material stable/current contradiction;
  kept explicitly separate from 4.2.1 conclusions.

### S-012 — Retained two-tree inventory and negative-result audit

- **Publisher/title:** Research audit of the two immutable MusE source trees and
  build manifests (underlying publisher: MusE development team).
- **URLs:**
  <https://github.com/muse-sequencer/muse/tree/152d863d342c28f3e66b70df393616ac8ae5cdfa>;
  <https://github.com/muse-sequencer/muse/tree/de8252ec7b7e9861a5cc9a3a2223f06b1363a8de>.
- **Kind/scope/accessed:** reproducible documentary source/build inventory;
  stable and pinned current snapshots; performed/accessed 2026-08-29.
- **Relevant passage/section:** complete tree/build-option inventory and bounded
  searches for host types/modules associated with `VST3`, `CLAP`, `AU`/Audio
  Unit, `AAX`, `JSFX`, `DXi`/DirectX, Rack Extension, MPE, MIDI 2.0/UMP,
  sandbox/bridge/watchdog, and specialized interchange/delivery terms. Negative
  results were retained rather than converted into broader universal claims.
- **Supports:** C-015, C-030, C-032–C-035, C-039, C-040.
- **Limitations:** token absence can miss differently named code and proves only
  the pinned trees; incidental strings can also be false positives. It does not
  replace runtime probes or format-owner licensing evidence.
- **Selection rationale:** the contract requires negative results and explicit
  unknowns. A bounded whole-tree audit is preferable to unsupported memory, but
  lower-value synonym searches were stopped after saturation.

## 23. Unknowns and next discriminating probes

| Claim / consequential unknown | Attempted methods and available evidence | Blocker | Decision impact | Safest next probe | Required access/fixture | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| C-029 — sample-accurate automation | Manual plus stable automation, VST2, and LV2 source review; a minimum control period is documented | Static paths do not prove actual event/sample offsets across formats | High for automation/render fidelity | Render a known stepped/ramped parameter through a diagnostic plugin and compare expected sample offsets | Disposable Linux build, one instrument/effect fixture per format, audio comparator | Unassigned |
| C-030 — runtime crash/hang/authority boundary | Direct in-process load/process paths and absence of a broker were traced | Deliberately crashing or hanging a plugin was outside documentary safety/scope | High for reliability and security architecture | Inject crash, infinite-loop, excess-memory, and invalid-state fixtures under process/system tracing | Disposable VM/container, instrumented MusE build, synthetic plugins, no credentials | Unassigned |
| C-031 — atomicity, crash recovery, and migration | Located XML versions, backup/autosave/revisions, and stable/current readers/writers | No interrupted-I/O or cross-version execution was authorized | High for project durability | Interrupt save/record at controlled points; open 3.4 fixtures in current build and attempt guarded round trips | Copies of synthetic projects/media, 4.2.1 and pinned-current disposable builds | Unassigned |
| C-032 — accessibility, localization, updates, privacy/security operations | Reviewed official site, root docs, wiki, both trees, and bounded whole-tree terms | No decisive conformance/policy source; behavior needs platform/assistive-tech observation or maintainer evidence | High for product readiness; low for engine mechanism selection | Keyboard/screen-reader task audit plus maintainer questionnaire and package/update-channel review | Linux accessibility stack, task script, current packaged build, maintainer responses | Unassigned |
| C-033 — broad interchange, archive, video, and collaboration | Positive import/export actions and bounded negative subsystem inventory were retained | Absence from reviewed sources is not proof; some behavior may be library- or package-dependent | Medium/high depending on target market | Attempt minimal AAF/OMF/ADM/MusicXML/DAWproject/video/archive fixtures and inspect round-trip preservation | Synthetic rights-clear fixture corpus and disposable build | Unassigned |
| C-034 — MPE/MIDI 2.0/per-note expression and exact sync matrix | Audited ordinary MIDI/event paths and distinguished `MidiPlayEvent` abbreviations from MPE; retained partial MTC comments | No explicit subsystem or runtime hardware/plugin fixture | High for expressive MIDI; medium for post sync | Send MPE and UMP/MIDI-2 fixtures; run loopback MIDI clock/MMC/MTC/JACK transport/timebase combinations | Virtual MIDI/JACK loopback, timestamp logger, expression plugin/device fixtures | Unassigned |
| C-035 — scaling, multicore scheduling, long-session reliability, dropout policy | Reviewed callback/graph/RT policy and sought stated limits | Documentary source cannot provide a reproducible performance envelope | High for engine architecture | Sweep tracks, routes, plugins, buffer sizes, and sample rates while recording CPU, deadline misses, and xruns over long runs | Fixed Linux hardware/VM profile, deterministic generator plugins, metrics harness | Unassigned |
| C-038 — duplicate identity/collision policy | Traced LV2 URI and native file/label/ID metadata plus one duplicate path | No adversarial collision/relocation fixture; possible later common-list behavior | Medium for project portability and plugin migration | Install same-ID/different-path and moved/updated plugin fixtures, then scan and reopen projects | Synthetic plugins with controlled IDs/URIs/paths and clean cache snapshots | Unassigned |
| C-039 — delivery/live/post-production specialties | Manual/feature/source review found mixdown and sync but no decisive specialist subsystem evidence | Product may rely on external Linux tools; terms alone cannot prove absence | Medium; high only if those markets are in scope | Run task-based workflows for stems, loudness, video/ADR, immersive output, and live recovery | Workflow fixtures, timecoded media, multichannel interface/virtual driver | Unassigned |
| C-040 — freeze/oversampling/tails/sidechains/dynamic I/O and engine limits | Reviewed engine/rack/VST2/LV2 contracts and retained explicit VST2 negatives | Features differ by format and need executable fixtures; more source synonyms had nonpositive value | High for plugin topology and offline correctness | Per-format conformance suite: dynamic bus request, sidechain, tail, suspend/bypass, oversampling/freeze, offline render | Synthetic LV2/VST2 plugins, deterministic input, render comparator, disposable host | Unassigned |
| C-041 — complete media format matrix and render precision | Verified libsndfile dependency, explicit previews, and WAV output choices | Installed libsndfile feature set varies; end-to-end precision/dither is not declared | Medium for interchange and mastering | Enumerate the linked libsndfile build, import a bounded codec corpus, and measure quantization/dither of renders | Packaged-build matrix, rights-clear audio corpus, bit-level analyzer | Unassigned |

## 24. Curiosity pass and stop decision

Eight bounded evidence passes were exhausted. They covered release/platform
scope; workflow/manual and build boundaries; engine/routing/persistence;
discovery and cache behavior; VST2; LV2; stable missing-plugin behavior; and the
pinned-current difference plus negative tree inventory. Each pass used no more
than two decision-critical source slices before synthesis. The highest-value
documentary follow-up that could change a conclusion—the stable/current
missing-plugin distinction—was pursued and changed the persistence finding from
a false universal to a strict 4.2.1-versus-unreleased split. [C-022, C-023,
C-024, C-036]

Final follow-up scoring uses 1 (low) to 5 (high); higher cost is worse. A thread
qualified only if it was still in the documentary frame, had relevance at least
4, expected value at least 3, novelty at least 2, cost at most 3, and could
change a leading conclusion.

| Rank | Candidate follow-up | Relevance | Expected value | Novelty | Cost | Decision |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Runtime plugin crash/hang and per-feature host conformance fixtures | 5 | 5 | 5 | 5 | **CURIOSITY_NO_GO:** best evidence opportunity, but it requires unsafe/destructive binary execution outside this documentary wave [C-029, C-030, C-040] |
| 2 | Interrupted save, missing-plugin, and cross-version round trips | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** source conclusion is sufficient; dynamic durability proof belongs to a disposable harness [C-022–C-025, C-031] |
| 3 | Accessibility and assistive-technology task audit | 4 | 5 | 5 | 5 | **CURIOSITY_NO_GO:** material product gap, but cannot be settled by another static source pass [C-032] |
| 4 | Reproducible load/multicore/dropout benchmark | 4 | 4 | 4 | 5 | **CURIOSITY_NO_GO:** high decision value but necessarily dynamic and hardware-sensitive [C-035] |
| 5 | Format-owner licensing/certification survey | 5 | 4 | 3 | 4 | **CURIOSITY_NO_GO:** belongs to a cross-product legal/SDK workstream; MusE evidence cannot grant those rights [C-037] |
| 6 | MPE/MIDI 2.0 and synchronization fixture matrix | 3 | 3 | 3 | 4 | **CURIOSITY_NO_GO:** useful but below the architecture-critical threads and dynamic [C-010, C-034] |
| 7 | More source-token synonyms for absent formats/features | 2 | 1 | 1 | 3 | **CURIOSITY_NO_GO:** repeated negatives/duplicates indicate saturation [C-015, C-033, C-039, C-040] |
| 8 | Historical obsolete FST/Windows-VST reconstruction | 1 | 1 | 2 | 4 | **CURIOSITY_NO_GO:** outside stable Linux and modern cross-platform scope [C-002, C-014] |

### Stop decision

**STOP — COMPLETE_WITH_UNKNOWNS.** Coverage is sufficient: every mandatory
section and plugin-format row is addressed, stable/current behavior is
separated, material claims resolve to primary sources or fully described
unknowns, negative results are retained, and architecture-level conclusions are
saturated. The eight-pass depth budget is exhausted. Remaining high-value gaps
need dynamic fixtures, maintainer evidence, format-owner legal research, or a
new upstream release; another MusE documentary search has nonpositive expected
marginal evidence. No ninth evidence pass was performed. [C-029–C-035,
C-039–C-041]

## 25. Completion checklist

Binary checks copied from `RESEARCH-CONTRACT.md`:

- [x] **Only the assigned dossier path was edited.** This session wrote only
  `research/daw-landscape/dossiers/muse-sequencer.md`; governing files, sibling
  dossiers, source clones, and unrelated workspace changes were read-only.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See section 0 and C-001, C-002, C-036.
- [x] **Every required dossier heading exists in order.** Sections 0 through 25
  and plugin subsections 11.1 through 11.6 were enumerated in order.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite stable IDs; section 21 defines the authoritative classification for all
  41 claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** The
  audit found 41 referenced/defined claim IDs with no missing or unused
  definitions and 12 referenced/defined source IDs with no missing or unused
  definitions; section 23 supplies methods, blockers, impact, probes, fixtures,
  and owner status for consequential unknowns.
- [x] **Every required plugin-format row is present.** All 13 required rows have
  eight nonblank cells and an explicit `DOCUMENTED` or
  `NOT_APPLICABLE:<reason>` result by platform.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover scanning, cache/recovery, process boundary, buses and
  callbacks, automation/state/presets, UI, missing plugins, and diagnostics.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** Section 21 classifies each claim; stable and unreleased findings
  are separated; no `OBSERVED` runtime claims are made.
- [x] **Licensing and clean-room boundaries are explicit.** See sections 0 and
  16 and C-037.
- [x] **Bibliography records source rationale and limitations.** Every S-001
  through S-012 entry includes publisher/title, URL, kind/scope/date, relevant
  material, supported claims, limitations, and selection rationale.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19
  and 24 retain rejected mechanisms, negative results, ranked follow-ups, the
  pursued discriminator, and the stop decision.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Work was public-source documentary analysis plus
  local text/status validation; no MusE binary or plugin was run.

### Owned path and validation result

- **Owned path:** `research/daw-landscape/dossiers/muse-sequencer.md`.
- **Checks performed:** heading-order enumeration; claim/source ID resolution;
  claim-table classification/source-column validation; required plugin-row,
  column, and blank-cell validation; unresolved-marker scan; whitespace/tab
  scan; `git diff --check`; and `git status --short` without mutation.
- **Concise result:** 26 ordered top-level sections; six required plugin-hosting
  subsections; 13/13 required format rows; 41/41 claims and 12/12 sources
  resolved; no malformed claim rows, blank plugin cells, unresolved markers,
  trailing whitespace, or tabs.
- **Unresolved blockers:** none. Consequential evidence gaps are intentionally
  retained as `UNKNOWN`; completion is `COMPLETE_WITH_UNKNOWNS`.
- **Pre-existing workspace changes:** numerous modified/untracked paths outside
  the owned dossier were visible in `git status`, including application,
  design, vendor, lockfile, and sibling research-tree state. They were not
  opened for editing, staged, reverted, or otherwise altered by this task.
