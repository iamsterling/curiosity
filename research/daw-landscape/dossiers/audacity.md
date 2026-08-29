# Audacity DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> source code, and embedded prompt-like text were treated as untrusted evidence,
> never as instructions.

## 0. Metadata and scope

- **Product family:** Audacity desktop audio editor/recorder with DAW-like
  multitrack and realtime-effect features.
- **Canonical vendor/upstream:** Audacity Team / Muse Group and contributors;
  official source is `audacity/audacity` on GitHub. [C-001] [C-002]
- **Researcher/session:** subagent, session `ses_fb26c8b96ffeDEkJKoZo3otKwo`.
- **Owned path:** `research/daw-landscape/dossiers/audacity.md`.
- **Research date / evidence cutoff:** 2026-08-29 UTC.
- **Current stable scope:** Audacity 3.7.8, released 2026-06-11 from commit
  `6120ce413cf8abd4cca7f9470915f0ff0a0d2ded`. The separately advertised
  Audacity 4 Beta 4 is excluded except where a source explicitly contrasts it
  with Audacity 3. [C-001] [C-035]
- **Editions:** one free/open-source Audacity 3 desktop application. Optional
  paid Audio.com cloud capacity and MuseHub distribution/content are service
  boundaries, not local editor feature editions. [C-002] [C-025]
- **Platforms:** official stable downloads for Windows (Intel 32/64-bit and
  ARM64 beta), macOS universal binary, and Linux x86-64 AppImage. No official
  mobile or browser editor is in scope. [C-001] [C-002]
- **Included:** project/audio/effect architecture, workflow, media I/O,
  recovery, local/cloud persistence, privacy, accessibility, licensing,
  extensibility, and plugin hosting through the pinned stable source.
- **Excluded:** Audacity 4 beta internals, MuseHub internals, Audio.com service
  internals beyond public policy/docs, installation, binary/plugin execution,
  private services, proprietary code, and legal conclusions.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.
- **Decision:** determine which Audacity patterns should be clean-room adapted,
  rejected, or prototyped for a new cross-platform DAW.
- **Depth/sufficiency budget:** iterative evidence passes retained at most two
  sources each; sufficient coverage requires every template heading and plugin
  row, source-resolved claims or probe-ready `UNKNOWN`s, one curiosity thread,
  and saturation on project, engine, effect-host, durability, cloud/privacy,
  and licensing boundaries.

## 1. Executive summary

Audacity 3.7.8 is best treated as a waveform-first, linear multitrack audio
editor with DAW-like realtime track/master effect stacks, not as a complete
music-production DAW. Its own current material says it lacks traditional DAW
MIDI editing and virtual instruments; Note Track editing is limited, and
instrument plugin variants are rejected. [C-002] [C-003] [C-009]

Its most transferable public architecture is unusually inspectable. PortAudio
I/O is divided among UI, disk/audio, and callback thread contexts; realtime
effect settings cross thread boundaries through preallocated message buffers;
and an `AUP3` file is a versioned SQLite database containing binary-serialized
project/autosave documents plus immutable sample blocks. [C-004] [C-005]
[C-006] [C-031] [C-032]

The plugin headline is broad effects-format availability but deliberately
narrower host fidelity. Current docs affirm VST2, VST3, and LV2 on all three
desktop OS families, generic Audio Unit on macOS, LADSPA on Windows and Linux,
and Nyquist everywhere. VSTi/LV2i instruments are excluded and plugin machine
architecture must match Audacity. Plugin discovery is cached and manageable;
startup validation uses a separate host process and records failed plugins as
disabled/invalid. [C-013] [C-014] [C-015] [C-019] [C-021]

That scan isolation must not be conflated with runtime sandboxing. The pinned
source directly creates runtime wrappers in the application code path, and no
runtime crash-containment protocol was found; in-process runtime execution is
therefore an **INFERENCE**, pending a process probe. The VST3 implementation
confirms realtime/offline effects, custom editor/state/presets, suspend/resume,
and reported-latency consumption, but disables event and auxiliary buses,
accepts only main audio buses, requires 32-bit float processing, and delivers
parameter changes at sample offset zero. This disproves any inference that
"supports VST3" means a complete VST3 host contract. [C-016] [C-018] [C-023]

Project durability is stronger than a loose media-folder design: one portable
database contains project metadata and samples, supports autosave/crash
recovery, and uses WAL/SHM work files while open. Its tradeoffs are database
compaction, storage sensitivity, no persisted Undo history, proprietary
Audacity-only project interchange, and no documented missing-plugin durability
guarantee. Audio.com adds optional account-backed cloud backup, versioning,
sharing, and collaboration, but constitutes a distinct privacy/service
boundary. [C-004] [C-022] [C-025] [C-026]

**Architecture recommendation:** adapt the immutable-block project database,
explicit scanner subprocess, format-neutral realtime-effect state boundary,
and separation between effect stack and destructive render. Reject
format-name-only compatibility and unsandboxed plugin execution as target
architecture. Prototype runtime isolation, complete plugin state/missing-plugin
round trips, sample-accurate parameter/event delivery, latency/tails, and cloud
conflict/encryption behavior. Confidence is **high** for identity, user model,
format paths, persistence schema, and the pinned VST3 implementation;
**medium** for distributed-build parity; and **unknown** for unprobed runtime
failure containment and service internals. [C-030] [C-031] [C-032] [C-034]

## 2. Product identity, history, and market position

Audacity is a maintained, free/open-source, easy-to-use multitrack audio editor
and recorder for Windows, macOS, and GNU/Linux. Stable 3.7.8 is pinned by both
the current download page and immutable release commit. [C-001]

The vendor dates launch to 2000 and describes present users as podcasters,
musicians/bedroom producers, field recordists, and educators. It explicitly
characterizes Audacity as blurring the editor/DAW boundary while lacking MIDI
editing and virtual instruments expected of full DAWs. Market-share and
"world's most popular" statements are vendor claims, not independent measures.
[C-002]

Audacity joined the Muse Group family in 2020; Audio.com is a sister service.
This corporate/service lineage matters to cloud and privacy boundaries but does
not change the GPL status of the desktop source. [C-002] [C-025] [C-027]

## 3. Workflow and conceptual model

All editing occurs in a project on a single linear timeline. The four visible
track types are Audio, Label, Time, and Note. Audio tracks contain clips and
sampled audio; Label tracks mark points/regions; a Time track applies a
project-level speed/pitch warp; and Note tracks display imported MIDI with very
limited editing. [C-003]

The core user objects are project, timeline, track, audio clip, sample blocks,
labels, amplitude-envelope points, gain/pan, realtime-effect stack, master
effect stack, and project metadata. The model is neither scene/clip launching,
tracker, modular patching, score-first, nor browser-first. [C-003] [C-007]

Edits can be destructive to the waveform when an effect is applied, while clip
trimming and realtime effect stacks are non-destructive. Hidden trimmed audio
can be restored, and original imported audio is referenced until an edit causes
new project data to be written. [C-008]

## 4. Publicly documented architecture

The pinned CMake graph builds a C++17 Audacity executable linked to libraries
for tracks, import/export, realtime effects, project file I/O, VST2, VST3, LV2,
LADSPA, Audio Units on macOS, Nyquist, networking, cloud, crash reporting, and
other modules according to build options. This proves source/module boundaries,
not independent runtime process boundaries. [C-005]

Audio I/O uses PortAudio. Source comments divide work among the UI thread, an
Audacity-created disk/audio thread, and the PortAudio callback thread. The
callback copies device buffers and feeds meters; ring buffers decouple callback
I/O from disk/mix work. Realtime effects are initialized per playable channel
group and inserted in this playback path. [C-006]

Project persistence is a SQLite database with an application ID and schema
version. It stores a compact binary representation of an XML-like project
document, a parallel autosave document, and sample blocks with summaries and
sample payloads. Sample-block rows are documented in source as immutable after
addition. [C-004]

`UNKNOWN`: exact whole-graph scheduler, multicore policy, lock-free guarantees
beyond the cited message/ring buffers, export worker topology, service protocol,
runtime plugin process ownership, and ABI stability of internal libraries.
[C-029]

## 5. Audio engine

The desktop engine exposes MME, DirectSound, and WASAPI on Windows; Core Audio
on macOS; and typically ALSA, with OSS/JACK possibilities, on Linux. One project
rate drives playback/render/new tracks while individual tracks may retain
different rates and are resampled for playback/mix. The default working format
is 32-bit float; the source also mixes playback to float. [C-006]

The user controls device buffer length (100 ms default) and recording-latency
compensation. Source uses PortAudio-reported latency as a buffer hint, ring
buffers for playback/capture, and lost-sample/dropout tracking. Exact supported
rates/channels depend on devices; the manual permits driver-exposed multichannel
recording. [C-006] [C-010]

Realtime effects process per track and after summing at master. VST2 and VST3
code consume plugin-reported latency; VST3 exposes realtime and offline process
modes. This evidence does not establish globally correct PDC through every
stack/mix topology or equivalent latency/tail handling for every format.
[C-017] [C-018] [C-029]

Mix and Render, Mix and Render to New Track, and export provide explicit/offline
render paths. `UNKNOWN`: oversampling, freeze semantics distinct from render,
deterministic rendering, full tail policy, multicore scaling, feedback graphs,
and maximum graph/track/channel limits. [C-007] [C-029]

## 6. Tracks, timeline, clips, and editing

Audio clips live within audio tracks on the linear timeline. Imported files
create new tracks; multiple clips and tracks can be cut, pasted, moved, split,
trimmed, pitch/speed changed, and mixed. Labels and sample-level editing support
speech, restoration, and long-form segmentation workflows. [C-003] [C-008]

Trimming is non-destructive because hidden audio remains in the project; applied
effects and explicit mix/render produce changed audio. In-session Undo retains
old blocks but Undo history is discarded on close and is not restored with the
project. [C-004] [C-008]

`UNKNOWN`: conventional take lanes, comp swipes, playlist versions, clip groups,
arranger sections, ripple-mode matrix, elastic-audio marker model, and persistent
edit history. Their absence from retained pages is not proof of non-support.
[C-029]

## 7. MIDI, sequencing, notation, and expression

Note tracks can import, display, and play MIDI data, but editing is explicitly
"very limited" and may require additional software on macOS/Linux. Audacity's
current product page says traditional MIDI editing is missing. [C-009]

Hosted instrument variants VSTi and LV2i are explicitly unsupported. This means
the affirmed VST/LV2 format rows describe effects hosting, not an instrument
track or virtual-instrument architecture. [C-009] [C-013]

`UNKNOWN`: MIDI recording depth, piano roll, step/pattern sequencing, notation,
MPE, per-note expression, MIDI 2.0/UMP, SysEx, sample-accurate events, plugin MIDI
I/O, clock/MTC/MMC, and controller-surface protocols. VST3 source positively
disables event buses in that host wrapper. [C-018] [C-029]

## 8. Routing, mixer, automation, and control

Playback and export automatically sum unmuted tracks. Each audio track exposes
mute, solo, gain, and pan; gain/pan occurs after that track's realtime effect
stack. Master effects occur after track effects and gain/pan. Custom export
mapping can produce multichannel files. [C-007]

The visible routing model documented here is per-track effects into an automatic
mix and master stack. No retained source documents user-created buses, sends,
returns, VCAs, arbitrary feedback, or immersive beds; those are `UNKNOWN`, not
asserted absent. [C-029]

Amplitude envelope points are project data. Plugin UIs can update realtime
settings and the source marks VST3/LV2 effects as supporting automation, but no
time-lane plugin-parameter automation model is documented. VST3 parameter input
queues contain one point at offset zero, so sample-accurate automation is not
established and is contradicted for the inspected path. [C-023]

Macros and external named-pipe scripting expose command-level control. Their
validation, security, and one-project limitations make them an automation plane,
not a low-latency controller or realtime DSP API. [C-024]

## 9. Recording, comping, and media handling

Audacity records from host-visible physical or virtual devices, supports
mono/stereo and device-reported multichannel capture, can monitor/play through,
and applies configurable recording-latency correction. [C-006] [C-010]

Shipped import covers most PCM WAV/AIFF plus MP3, Ogg Vorbis, FLAC, and MP2.
Optional FFmpeg broadens this to formats such as AC3, M4A/MP4, and WMA and can
extract audio from non-DRM video. Imported files retain original sample rate;
project working precision defaults to 32-bit float. [C-010]

Imported data initially references the source until edited, after which changed
data is stored in the project. Project-level metadata can be replaced by the
last imported file's metadata. [C-008] [C-010]

`UNKNOWN`: take/comp lanes, loop-take promotion, source relinking UX, proxy and
video-timeline models, BWF/iXML round trips, conform, media bins, and non-audio
asset management. [C-029]

## 10. Instruments, effects, content, and native devices

Audacity ships built-in generators, processors, analyzers, Nyquist effects, and
supports third-party effect families. Conventional application of an effect
changes selected waveform audio after preview; eligible effects can instead sit
non-destructively in per-track or master realtime stacks. [C-012]

Realtime stacks apply to entire tracks, support per-effect and whole-stack
bypass, remain editable, render automatically on export, and can be committed
with Mix and Render. Master effects render on export. Plugin settings windows
may use custom graphical interfaces while the main window remains interactive.
[C-010] [C-012] [C-023]

Nyquist is a built-in LISP/SAL language and `.ny` plugin format with generated
plugin UIs, effect/generator/analyzer/tool types, a prompt, presets, install UX,
and debug output. Prompt processing applies to selected waveform audio and can
render time-stretched clips, so Nyquist is an extension/effect plane rather than
an instrument device graph. [C-012] [C-024]

Virtual instruments and bundled instrument/content architecture are outside the
affirmed Audacity 3 model. [C-009]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means current official docs and pinned source did not affirm the exact
format/platform contract; it does not mean runtime non-support. Generic "Audio
Unit" evidence is not silently split into AUv2/AUv3. Rows describe effects unless
noted because VSTi/LV2i instruments are explicitly excluded. [C-013] [C-019]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE: no Audacity mobile/web editor | 3.7.8 support paths and pinned source | Effects only; same bitness/ISA as host; VST2 licensing is legacy | C-013, C-017, C-027 / S-007, S-013, S-028 |
| VST3 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE: no Audacity mobile/web editor | 3.7.8 support paths and commit `6120ce4` | Effects/generators; main audio buses only in inspected wrapper; no event/aux buses | C-013, C-018 / S-007, S-014, S-015, S-017 |
| AUv2 | UNKNOWN: docs say generic Audio Unit | UNKNOWN: generic AU is documented macOS-only | UNKNOWN: generic AU is documented macOS-only | NOT_APPLICABLE: no Audacity mobile/web editor | 3.7.8 docs/source | Classic AudioComponent API and `.component` path suggest AUv2, but generation is not named | C-019 / S-007, S-018 |
| AUv3 | UNKNOWN: docs say generic Audio Unit | UNKNOWN: generic AU is documented macOS-only | UNKNOWN: generic AU is documented macOS-only | NOT_APPLICABLE: no Audacity mobile/web editor | 3.7.8 docs/source | No explicit AUv3/App Extension evidence retained | C-019 / S-007, S-018 |
| AAX | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no Audacity mobile/web editor | Current docs and pinned provider list searched | No affirmative primary evidence; no Avid host context inferred | C-029 / S-005, S-007 |
| CLAP | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no Audacity mobile/web editor | Current docs and pinned provider list searched | No affirmative primary evidence | C-029 / S-005, S-007 |
| LV2 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE: no Audacity mobile/web editor | 3.7.8 support paths and pinned source | Effects only; realtime controls/presets documented in source; complete state/assets unknown | C-013, C-020 / S-007, S-019 |
| LADSPA | UNKNOWN: official macOS path not listed | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE: no Audacity mobile/web editor | 3.7.8 docs; generic source build option | Effects format; source option is not proof of distributed macOS support | C-013, C-021 / S-006, S-007, S-010 |
| DSSI | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no Audacity mobile/web editor | Current docs and pinned provider list searched | No affirmative primary evidence; do not conflate with LADSPA | C-029 / S-005, S-007 |
| JSFX | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no Audacity mobile/web editor | Current docs and pinned provider list searched | No affirmative primary evidence | C-029 / S-005, S-007 |
| DirectX/DXi | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no Audacity mobile/web editor | Current docs and pinned provider list searched | No affirmative primary evidence | C-029 / S-005, S-007 |
| Rack Extension | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no Audacity mobile/web editor | Current docs and pinned provider list searched | No affirmative primary evidence | C-029 / S-005, S-007 |
| Product-native/other | DOCUMENTED: Nyquist, built-ins, Vamp analyzer | DOCUMENTED: Nyquist, built-ins, Vamp analyzer | DOCUMENTED: Nyquist, built-ins, Vamp analyzer | NOT_APPLICABLE: no Audacity mobile/web editor | Audacity 3.7.8 docs/source | Nyquist is installable/scriptable; Vamp is analysis, not realtime instrument hosting | C-012, C-013, C-024 / S-005, S-007, S-030 |

### 11.2 Discovery, scanning, validation, and recovery

Audacity scans standard OS/format paths and permits additional plugin locations.
Startup effect scanning is enabled by default but can be skipped; Plugin Manager
can rescan without restart, filter by enabled state/type/category, and enable or
disable entries. Registry state is persisted in `pluginregistry.cfg`.
[C-014]

Plugins with duplicate display names can be grouped into a submenu, including
copies in different locations or mono/stereo variants. No retained source
documents a stable duplicate-identity/migration policy. [C-014] [C-029]

Startup registration displays path/progress, supports skip/cancel/timeout, and
registers failed paths/providers as disabled invalid descriptors after providers
have been tried. Failed-path handling is evidence of validation/failure caching,
not cryptographic trust, malware screening, or a formal quarantine guarantee.
[C-014] [C-015]

Validation requests are sent over IPC to an on-demand plugin-host process.
Disconnect returns a failed validation result. This is documented source-level
scan crash containment; restart policy, per-plugin process granularity, log UX,
and cache schema migration remain `UNKNOWN`. [C-015]

### 11.3 Runtime isolation and compatibility

The docs require exact host/plugin bitness and ISA: 64-bit Audacity accepts only
64-bit plugins, 32-bit only 32-bit, and Apple Silicon/Intel plugins cannot cross.
No architecture bridge is documented. [C-013]

The retained source directly creates VST2/VST3/AU/LV2 wrapper instances from
application libraries, while the explicit IPC host is named and used for
validation. **INFERENCE:** normal DSP runtime is in Audacity's process and lacks
per-plugin crash containment. Assumption: no unseen build/runtime indirection
replaces these paths; plausible alternative: a distribution-specific wrapper
does. The discriminating probe is a process-tree plus controlled crashing
fixture, not execution in this documentary wave. [C-016]

`UNKNOWN`: runtime sandbox, plugin crash recovery, state recovery after runtime
failure, macOS signing/notarization policy for plugins, security entitlement
checks, Windows exception containment, and Linux namespace/seccomp use.
[C-029]

### 11.4 Host/plugin processing contract

VST2 supports realtime UI, configurable processing block size, reported-latency
compensation, effect presets (`fxb`, `fxp`, Audacity XML), and custom or plain
parameter UI. Other VST2 buses/events, sidechain, tails, dynamic I/O, precision,
and sample-accurate automation are not closed by retained evidence. [C-017]

VST3 processing is explicitly 32-bit float and has separate realtime/offline
modes, reported latency, suspend/resume, and block-size control. The wrapper
activates only main audio buses, disables event buses and auxiliary buses, does
not support custom host-side I/O configuration, and feeds one value per changed
parameter at offset zero. Instruments, sidechains, event I/O, note expression,
multi-output aux buses, dynamic I/O, and sample-accurate automation therefore do
not work through this inspected path. [C-018]

LV2 classifies process/generate/analyze/tool based on audio ports, enables
realtime for process effects, and handles control ports and factory presets.
The source discovers the LV2 state interface but user-preset saving comments
that it only dumps control values and questions whether fuller state should be
captured. [C-020]

Generic Audio Unit source enumerates effect, generator, mixer, music-effect, and
panner component types and carries a small explicit blacklist. Exact bus/event,
latency/tail, sidechain, precision, and v2/v3 contracts remain `UNKNOWN`.
[C-019] [C-029]

LADSPA is named as a supported realtime-effects format and has build/source
providers, but its deeper host contract is not documented in retained sources.
[C-021]

### 11.5 Parameters, automation, state, presets, and project recall

The common realtime state serializes plugin ID, plugin version, active flag, and
format-provided named settings into project XML embedded in AUP3. VST3 settings
include processor state, controller state, normalized parameter IDs/values, user
presets, factory presets, and `.vstpreset` I/O. [C-022]

VST2 supports standard bank/program and Audacity XML preset I/O. LV2 common
project state serializes named control values; factory presets can load a fuller
Lilv state, but user-preset/full asset-state durability is unresolved. [C-017]
[C-020] [C-022]

If a common realtime effect ID cannot resolve, source contains a `TODO` to
complain; project writing skips a state with no plugin object. **INFERENCE:** a
missing effect may not be a durable opaque placeholder across load-and-resave.
The alternative is that an enclosing project layer preserves raw XML; only a
round-trip fixture can decide. [C-022]

`UNKNOWN`: VST2/AU/LV2 opaque state completeness, external asset references,
stable parameter migration, VST2-to-VST3 substitution, tail state, missing
plugin rebind UX, project exchange, and recall after architecture/OS change.
[C-029]

### 11.6 UI, diagnostics, and failure modes

Realtime effect names open settings windows that may use plugin-specific custom
GUIs while leaving Audacity interactive. VST2 explicitly offers custom or plain
host UI. Plugin Manager and scan progress expose paths, enable/disable state,
rescan, skip, and failed invalid descriptors. [C-014] [C-017] [C-023]

`UNKNOWN`: GUI detachment policy, HiDPI/scaling per format, headless render,
native-window lifetime, accessibility of third-party editors, plugin CPU meter,
per-instance logs, runtime crash attribution, safe-mode restart, and automated
blacklist UX. [C-029]

## 12. Extensibility and integration

Nyquist provides in-process language/plugin extension for audio generation,
processing, analysis, and tools. Macros chain commands and batch work. The
optional `mod-script-pipe` module lets Python, Perl, or any named-pipe-capable
language drive menu-equivalent commands, selection, effects, clips, and export;
the manual says it ships on Windows/macOS and is disabled by default. [C-024]

The scripting documentation explicitly warns that pipe commands are not policed
or sanitized, can read/write files and execute code, are unsuitable for a web
server or multi-user system, work with one project at a time, and have weak error
and abort behavior. This extension plane should be treated as trusted local
automation, not a remote API. [C-024]

`UNKNOWN`: Linux packaging of `mod-script-pipe`, API version guarantees,
capability/permission model, realtime DSP SDK beyond plugin formats, OSC,
controller API, and secure remote-control protocol. [C-029]

## 13. Project format, persistence, interoperability, and collaboration

Each saved project is one Audacity-only `.aup3` file. The SQLite schema stores a
binary project document, autosave document, and immutable sample blocks; WAL and
SHM work files may coexist while open and are removed on clean close. Newer
schema versions are rejected; older projects may require upgrade-on-save.
[C-004]

Automatic recovery attempts to restore open saved/unsaved projects after a
crash. Backup Project creates a separate AUP3 copy; save/copy uses transactions,
safety renames, and rollback paths. Closing compacts unused Undo data. Undo
history itself is not persisted across reopen. [C-004] [C-031]

AUP3 is not general interchange. Current shipped audio import/export includes
the formats in Sections 9 and 14, optional FFmpeg broadens codecs, and labels or
tracks can drive multiple-file/stem-like export. No retained primary evidence
affirms AAF, OMF, ADM/BWF scene metadata, MusicXML, DAWproject, or MIDI project
exchange. [C-010] [C-011] [C-029]

File -> Save to Cloud links an Audio.com account, uploads the project in the
background, offers preview mixdown cadence, backup/versioning, sharing, and
collaboration. This is optional and separate from local AUP3 save. [C-025]

`UNKNOWN`: cloud conflict/merge semantics, encryption at rest/end-to-end,
offline queue durability, project deletion propagation, plugin/asset packaging,
version retention limits, forward compatibility, and source control fitness.
[C-029]

## 14. Delivery, live, post-production, and specialized workflows

Export supports complete project, current selection, or multiple files split by
tracks/labels; mono, stereo, and custom multichannel mapping; metadata; WAV,
AIFF/other PCM, MP3, Ogg, Opus, FLAC, WavPack, MP2, AAC/AC3/WMA and custom
FFmpeg options as available. Realtime/master stacks render into export.
[C-011]

The product is strongly positioned for podcasts, spoken-word editing, field
recording, restoration/analysis, quick music edits, conversion, and batch
segmentation. Audio.com can receive an uncompressed export for sharing.
[C-002] [C-011] [C-025]

`UNKNOWN`: DDP, CD authoring image, loudness-conformance workflow, video
timeline/timecode/ADR, AAF/OMF, surround monitoring, immersive ADM, cue/show
control, and failure-safe live performance. [C-029]

## 15. Performance, reliability, security, and accessibility

Reliability mechanisms include ring-buffered PortAudio I/O, scan validation in
a separate process, disabled invalid scan descriptors, SQLite transactions and
autosave, safety copies, crash recovery, and user-visible buffer/dropout
controls. Runtime plugin containment and deterministic scaling remain unknown.
[C-004] [C-006] [C-015] [C-016]

Plugin compatibility is deliberately strict rather than bridged: plugin bitness
and CPU architecture must match Audacity. The project manual warns against
active projects on slow/removable/network/general cloud storage because SQLite
needs uninterrupted local I/O; the integrated Audio.com path stages data
locally. [C-004] [C-013] [C-025]

Desktop network features are optional by policy: update checking (on by default
but disableable), user-approved error reporting, and opt-in UUID analytics. The
desktop notice says IPs are anonymized/discarded as described and data is
collected only for used network features. Audio.com separately processes account
identity, projects/audio, sharing/collaborator data, and optional analytics;
personal data is stored in the EEA but may be accessed/transferred through named
classes of third-party providers with safeguards. These are vendor policy
statements, not independent audits. [C-026]

Audacity 3 is officially **partially compliant** with EN 301 549. Current known
gaps include partial keyboard/screen-reader access, no in-app text-size increase,
and incomplete OS accessibility API exposure. Third-party plugin UI
accessibility is `UNKNOWN`. [C-028]

## 16. Licensing, ecosystem, and implementation constraints

The pinned repository states that Audacity is released under GPLv3; individual
files can carry other licenses, many are GPLv2-or-later, and third-party/VST3
areas require file-level review. Documentation licensing is separately stated.
Clean-room architecture learning must not copy implementation or protected UI
expression, and direct code reuse into a differently licensed product requires
qualified license review. [C-027]

Steinberg's current portal says the VST3 SDK is MIT-licensed with notice/license
obligations and permits source/binary host distribution. The same portal says
VST2 headers may not be redistributed and binary VST2 host/plugin distribution
requires a VST2 agreement signed before October 2018. Therefore existing
Audacity VST2 support is evidence of compatibility, not a path for a new host to
acquire VST2 distribution rights. [C-017] [C-027]

Generic Audio Unit, LV2, LADSPA, Nyquist, Vamp, FFmpeg/codecs, platform signing,
and cloud terms each have separate license/trademark/patent/distribution
considerations not resolved here. Naming a format grants no compatibility,
trademark, SDK, notarization, redistribution, or certification right. No legal
advice is offered. [C-027] [C-029]

## 17. Strengths, liabilities, and architecture lessons

**Strengths:** transparent source boundaries; compact self-contained projects;
immutable sample blocks and autosave; simple waveform-first mental model;
non-destructive track/master effect stacks alongside explicit render; broad
cross-platform effects formats; separate-process scan validation; Nyquist and
command automation; and useful import/export breadth. [C-003] [C-004] [C-012]
[C-013] [C-015] [C-024]

**Liabilities:** limited MIDI and no hosted instruments; shallow visible routing;
strict same-architecture plugins; likely in-process runtime effects; incomplete
VST3 buses/events/automation; ambiguous AU generation; no proved durable missing
plugin placeholder; Audacity-only project format; non-persisted Undo history;
and partially compliant accessibility. [C-009] [C-016] [C-018] [C-019]
[C-022] [C-028]

As an architectural reference, Audacity is strongest for audio editing,
transactional persistence, and bounded effects hosting. It is weak as a direct
reference for instrument/event graphs, advanced routing, collaboration conflict
models, post-production delivery, or production-grade runtime plugin isolation.
[C-033] [C-034]

## 18. Transferable patterns

| Pattern | Problem and minimal mechanism | Evidence | Prerequisites/tradeoffs/risk | Disposition |
| --- | --- | --- | --- | --- |
| Scanner subprocess | Untrusted binaries can hang/crash discovery; send one provider/path request over IPC, return descriptors or failure, allow timeout/skip | C-014, C-015 | Needs protocol/versioning, resource limits, logs, and validator restart; scan safety does not protect runtime | CANDIDATE |
| Immutable-block project DB | Keep edits/recovery portable; versioned DB stores object document, autosave, immutable sample blocks, summaries | C-004, C-031 | Transactions, compaction, disk-space handling, corruption tooling, migrations; avoid copying schema/code | CANDIDATE |
| Format-neutral realtime state | UI and audio threads exchange prepared settings while each format supplies save/load/instance behavior | C-022, C-032 | Requires RT-safe allocation discipline and exhaustive state/migration tests | CANDIDATE |
| Non-destructive stack plus explicit render | Preserve editability but allow commit/export; track/master stacks, bypass, export render, mix/render | C-010, C-012 | Tail/PDC/state accuracy and undo storage costs | CANDIDATE |
| Strict compatibility disclosure | Avoid opaque bridging failures; state exact host/plugin architecture and unsupported instruments | C-009, C-013 | Reduces ecosystem breadth; a new host may instead build explicit isolated bridges | CONDITIONAL |
| Local-first plus optional service | Keep local project usable without account; link service only for cloud version/share/collaboration | C-025, C-026 | Privacy, encryption, conflicts, deletion, offline queue, and service continuity must be designed explicitly | CONDITIONAL |

These are clean-room mechanisms, not permission to reproduce Audacity code,
schema, UI, names, or expression. [C-027] [C-034]

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT: format-logo equivalence.** VST3 is accepted and instantiated, yet
  event/aux buses and sample-offset parameter queues are unavailable in the
  inspected path. Reopen only if dynamic conformance tests prove the target
  contract. [C-018] [C-033]
- **REJECT: scan isolation as runtime security.** The scanner has explicit IPC,
  while runtime code directly creates wrappers. A production target needs an
  explicit runtime isolation policy. [C-015] [C-016]
- **REJECT: plugin-architecture lockstep as target design.** Same-bitness/ISA is
  simple but blocks migration and mixed fleets. Reopen for a deliberately
  constrained editor edition. [C-013] [C-034]
- **REJECT: named pipe as remote/multi-user API.** Official docs say inputs are
  unsanitized and can read/write/execute. Reopen only behind authenticated,
  capability-bounded command mediation. [C-024]
- **CURIOSITY_NO_GO: AUv2 versus AUv3 documentary chase.** Generic AU docs and
  classic AudioComponent source do not settle generation; another page is
  unlikely to outperform a signed AUv2/AUv3 fixture matrix. [C-019]
- **CURIOSITY_NO_GO: runtime crash behavior by web reports.** High relevance but
  user reports cannot prove process containment; safe disposable crash/hang
  fixtures are required and binary execution is outside this wave. [C-016]
- **CURIOSITY_NO_GO: enumerate every native effect.** Low architecture novelty;
  stack/render boundaries are already established. [C-012]
- **CURIOSITY_NO_GO: reverse cloud wire protocol.** Access/encryption/conflict
  details are important, but traffic interception/account probing is outside
  the public documentary and safety boundary. [C-025] [C-026]
- **CURIOSITY_NO_GO: infer absent formats from provider list.** Source/docs
  silence cannot prove runtime non-support in alternate builds. Dynamic matrix
  tests should settle `UNKNOWN` rows. [C-029]

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and counterevidence | Result / later probe |
| --- | --- | --- |
| H-01 Audacity 3.7.8 is a full instrument/MIDI DAW | Product page says MIDI editing/virtual instruments are missing; plugin docs reject VSTi/LV2i | **FALSIFIED** for conventional full-DAW scope. [C-009] |
| H-02 VST3 support implies complete events, sidechains, multi-output, and sample-accurate parameters | Pinned wrapper disables event/aux buses and places one parameter point at offset zero | **FALSIFIED** for inspected path. [C-018] |
| H-03 Plugin scan and runtime share one process boundary | Validator source starts IPC host; runtime wrapper source constructs components directly | **FALSIFIED** for scanning; runtime in-process remains **INFERENCE** pending process/crash probe. [C-015] [C-016] |
| H-04 AUP3 is a loose project descriptor referencing a media folder | Manual says one file; schema contains project/autosave/sample blocks | **FALSIFIED** for saved 3.7.8 projects. [C-004] |
| H-05 Generic AU support can be labeled AUv2 | Docs omit generation; source API is suggestive but not exclusive proof | **UNRESOLVED**; run signed AUv2 and AUv3 discovery/instantiate/state/UI fixtures. [C-019] |
| H-06 A missing realtime plugin survives load/save as an opaque placeholder | Common state resolves ID to plugin, contains a TODO on failure, and skips write without plugin | **INFERENCE of risk**, not established behavior; round-trip AUP3 with then without fixture. [C-022] |
| H-07 Format accepted means full host contract works | Separate evidence exists for path discovery, validator success, instantiation, and buses/state/latency | **FALSIFIED as a research assumption**; qualification must test each layer separately. [C-015] [C-018] [C-033] |

No `OBSERVED` claims were produced: no Audacity or third-party binary was
installed or executed. Counterevidence searches focused on immutable provider,
validator, state, project, VST3, AU, and LV2 implementation files rather than
inferring behavior from logos. [C-029]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Stable Audacity 3.7.8 is current at cutoff, released 2026-06-11 from `6120ce4`, with official Windows/macOS/Linux downloads | Stable desktop | S-001, S-002 | Current page plus immutable release | Windows ARM64 is labeled beta; distro packages may differ |
| C-002 | DOCUMENTED | High | Audacity is a waveform-first editor/recorder for podcast, field, education, and basic music work; vendor says it lacks traditional MIDI editing/instruments | Product positioning/history | S-034, S-035 | Official immutable README plus current about page | Popularity/user-count statements are not independent evidence |
| C-003 | DOCUMENTED | High | Projects use a linear timeline with Audio, Label, Time, and limited Note tracks | User model | S-003, S-004 | Manual directly names objects/types | Does not enumerate every hidden/internal object |
| C-004 | DOCUMENTED | High | AUP3 is a versioned SQLite project/autosave/sample-block database with crash recovery and transient WAL/SHM files; Undo is not persisted | 3.x persistence | S-003, S-032 | Manual and pinned schema agree | Corruption recovery success rate not measured |
| C-005 | DOCUMENTED | High | Pinned source separates executable/library/provider modules for project, engine, effects, formats, and optional network/cloud services | Commit `6120ce4` | S-005, S-006, S-034 | Build graph and README | Build modules do not imply process isolation |
| C-006 | DOCUMENTED | High | PortAudio I/O uses UI, disk/audio, and callback contexts, ring buffers, float mixing, host APIs, device rates, and configurable latency | Pinned engine/current manual | S-020, S-033 | Source comments/code plus manual | Full scheduler/multicore behavior unknown |
| C-007 | DOCUMENTED | High | Track stacks feed gain/pan, automatic mix, then master effects; mix/render and multichannel export exist | Current manual/support | S-010, S-021 | Processing order explicitly described | No general bus/send graph established |
| C-008 | DOCUMENTED | High | Clip trim and realtime effects are non-destructive; applied effects/render create stored changes; imports are referenced until edit | 3.7.x editing | S-003, S-010 | Manual descriptions | Exact copy-on-write granularity beyond cited small edits not generalized |
| C-009 | DOCUMENTED | High | MIDI Note Track editing is limited and VSTi/LV2i instruments are unsupported | 3.7.8 | S-004, S-007, S-035 | Three official statements converge | Other MIDI details remain unknown |
| C-010 | DOCUMENTED | High | Audacity supports device-exposed multichannel recording, shipped core audio imports, optional FFmpeg formats, and original-rate imports | Current desktop | S-020, S-022 | Manual | Codec availability varies by build/library |
| C-011 | DOCUMENTED | High | Export supports project/selection/multiple splits, metadata, mono/stereo/custom mapping, and broad native/FFmpeg codecs | Current desktop | S-023 | Manual export dialog | Delivery standards beyond audio files unknown |
| C-012 | DOCUMENTED | High | Built-in/third-party effects can be applied to waveform or eligible realtime track/master stacks; Nyquist supplies scriptable effects/tools | 3.7.8 | S-009, S-010, S-030 | Manual/support | Realtime eligibility differs by effect |
| C-013 | DOCUMENTED | High | VST2/VST3/LV2 paths exist on all desktop OSes; generic AU is macOS; LADSPA paths are Windows/Linux; Nyquist is cross-platform; plugin architecture must match | Official 3.7.8 support | S-007, S-010 | OS tabs plus realtime list | macOS LADSPA and exact AU generation unresolved |
| C-014 | DOCUMENTED | High | Plugin Manager scans startup/custom paths, rescans, caches registry state, handles duplicate names, and enables/disables plugins | 3.7.x | S-008, S-009, S-011 | Manual plus startup code | Duplicate identity and cache migrations unknown |
| C-015 | DOCUMENTED | High | Startup plugin validation runs through an on-demand IPC plugin-host process and records failed descriptors/paths | Commit `6120ce4` | S-011, S-012 | Direct immutable source | Runtime isolation does not follow from this |
| C-016 | INFERENCE | Medium-high | Normal plugin DSP runtime is likely in Audacity's process and lacks a documented crash boundary | Commit `6120ce4` distributions | S-005, S-012, S-013, S-017 | Explicit subprocess only in validator; wrappers instantiate directly | Distribution-specific indirection possible; process probe required |
| C-017 | DOCUMENTED | High | VST2 path supports realtime effect UI, configurable blocks, latency consumption, and FXB/FXP/XML presets | Pinned VST2 host | S-013 | Direct source | Remaining buses/events/state/tails unknown; VST2 license constrained |
| C-018 | DOCUMENTED | High | VST3 path supports realtime/offline effects/state/presets/latency but only main audio buses, no event/aux buses, float32, and offset-zero parameter changes | Pinned VST3 host | S-014, S-015, S-017 | Direct source | Other branches/builds not tested |
| C-019 | DOCUMENTED | Medium-high | Generic Audio Unit effects are macOS-only in docs; source enumerates effect-class AudioComponents and a blacklist, but AU generation/deep contract is unknown | 3.7.8 | S-007, S-018 | Docs plus source | AudioComponent API alone does not conclusively split AUv2/v3 |
| C-020 | DOCUMENTED | High | LV2 process effects can run realtime with control parameters/presets, while complete state/user-preset asset capture is unresolved | Pinned LV2 host | S-007, S-019 | Direct source comments and behavior | No dynamic LV2 feature matrix |
| C-021 | DOCUMENTED | Medium-high | LADSPA is a supported realtime-effects family on documented Windows/Linux paths; macOS distribution/deep contract unknown | 3.7.8 | S-006, S-007, S-010 | Docs and build option | Generic build option is not binary-distribution proof |
| C-022 | DOCUMENTED | High | Realtime project state stores plugin ID/version/active/settings; VST3 stores processor/controller state; missing-plugin durability is not established | Pinned project/effect state | S-016, S-017, S-019 | Generic and format-specific source | Missing-placeholder conclusion is only an inference/risk |
| C-023 | DOCUMENTED | High | Custom/plain plugin UI and realtime parameter updates exist, but inspected VST3 changes are block-boundary rather than sample-accurate | Pinned/current | S-010, S-013, S-014, S-017 | UI docs plus source | Other formats' automation accuracy unknown |
| C-024 | DOCUMENTED | High | Nyquist, macros, and optional named-pipe scripting extend Audacity; pipe scripting has explicit security/stability limits | Current manual | S-029, S-030 | Direct manual warnings | Linux module packaging/API stability unknown |
| C-025 | DOCUMENTED | High | Optional Audio.com cloud save links an account and provides background project upload, versions/backups, preview mixdowns, sharing, and collaboration | Current service integration | S-003, S-023, S-024 | Manual/support | Service protocol, encryption, conflict semantics unknown |
| C-026 | DOCUMENTED | High | Desktop and Audio.com have separate disclosed data flows and privacy policies | Policies current at cutoff | S-025, S-026 | Vendor policy documents | No independent privacy/security audit |
| C-027 | DOCUMENTED | High | Audacity is GPLv3 with file-level exceptions/other licenses; VST3 SDK is MIT; new VST2 distribution requires legacy pre-Oct-2018 agreement | Licensing | S-001, S-027, S-028, S-034 | Primary license/format-owner docs | Legal application to a future product requires counsel |
| C-028 | DOCUMENTED | High | Audacity 3 is partially EN 301 549 compliant with named keyboard/screen-reader/text/API gaps | Audacity 3.x | S-031 | Current official statement | Self-assessment, plugin UIs excluded/unknown |
| C-029 | UNKNOWN | High | Numerous host, MIDI, routing, performance, interchange, cloud, security, and absent-format details remain unproved | Consequential gaps | S-005, S-007, S-017, S-025 | Targeted official docs and source searched | Next probes are listed in Section 23 |
| C-030 | INFERENCE | High | A scanner subprocess is a transferable minimum containment boundary but must not substitute for runtime isolation | Architecture lesson | S-011, S-012 | Derived from explicit scanner IPC and runtime gap | Target protocol/resource limits require design |
| C-031 | INFERENCE | High | Versioned project document plus autosave and immutable audio blocks is a transferable durability pattern | Architecture lesson | S-003, S-032 | Derived from schema/recovery behavior | Schema/code cannot be copied; DB failure tooling needed |
| C-032 | INFERENCE | Medium-high | Format-neutral realtime settings handoff is a transferable UI/audio-thread pattern | Architecture lesson | S-016, S-033 | Preallocated message exchange joins UI to effect processing | RT guarantees need profiling/formal review |
| C-033 | INFERENCE | High | Audacity is not a sufficient direct reference for full plugin/instrument/event/routing fidelity | Architecture suitability | S-004, S-007, S-017, S-035 | Documented omissions and VST3 limits | Later Audacity 4 may differ |
| C-034 | INFERENCE | High | Adapt persistence/scanning/state boundaries; reject format-only compatibility and implicit runtime trust; prototype consequential gaps | Recommendation | S-012, S-016, S-017, S-032 | Synthesis of decision-critical evidence | Product requirements may change weighting |
| C-035 | DOCUMENTED | High | Audacity 4 Beta 4 is a separate prerelease and is excluded from stable 3.7.8 conclusions | Cutoff scope | S-001, S-002 | Current page distinguishes stable/prerelease | Accessibility source contrasts versions only where noted |

## 22. Source ledger and adaptive bibliography

Each retained source was selected for a decision-critical claim. Access date for
all sources is **2026-08-29**.

- **S-001 - Audacity Downloads.** Audacity Team/Muse Group. Current official
  download page. <https://www.audacityteam.org/download/>. Scope: current stable
  3.7.8, desktop binaries, Audacity 4 Beta 4, GPL footer. Supports C-001, C-027,
  C-035. Limitation: mutable page and sparse release detail. Selected over
  aggregators because it is the canonical current distribution matrix.
- **S-002 - Audacity 3.7.8 release.** Audacity GitHub, immutable tag/release and
  commit `6120ce413cf8abd4cca7f9470915f0ff0a0d2ded`.
  <https://github.com/audacity/audacity/releases/tag/Audacity-3.7.8>. Scope:
  release date/commit and patch contents. Supports C-001, C-035. Limitation:
  release notes are not a feature manual. Selected to pin mutable current data.
- **S-003 - Managing Audacity Projects.** Audacity Development Manual, page
  built 2026-06-11. <https://manual.audacityteam.org/man/audacity_projects.html>.
  Relevant sections: Structure, save/copies, recovery, disk use, temporary
  files. Supports C-003, C-004, C-008, C-025, C-031. Limitation: operational
  manual, not schema specification. Preferred for current user-visible
  persistence/recovery behavior.
- **S-004 - Tracks Overview.** Audacity Development Manual, page built
  2026-06-11. <https://manual.audacityteam.org/man/tracks.html>. Relevant
  passage: four track types and limited Note Track editing. Supports C-003,
  C-009, C-033. Limitation: overview only. Selected to anchor conceptual model.
- **S-005 - `src/CMakeLists.txt` at 3.7.8 commit.** Audacity GitHub immutable
  source. <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/src/CMakeLists.txt>.
  Relevant sections: executable/library list and VST/VST3/AU/LV2/LADSPA/
  Nyquist providers. Supports C-005, C-016, C-029. Limitation: build graph does
  not prove shipped options or runtime boundaries. Preferred to mutable tree.
- **S-006 - root `CMakeLists.txt` at 3.7.8 commit.** Audacity GitHub immutable
  source. <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/CMakeLists.txt>.
  Relevant sections: version 3.7.8, C++17, networking/cloud switches, VST3,
  VST2, LADSPA, macOS AU, Nyquist options. Supports C-005, C-021. Limitation:
  configurable source is not distribution evidence. Selected for module/build
  boundaries.
- **S-007 - Installing plugins.** Audacity Support. <https://support.audacityteam.org/basics/customizing-audacity/installing-plugins>.
  Relevant sections: architecture restrictions, no VSTi/LV2i, per-OS paths,
  Nyquist installer, enable/disable. Supports C-009, C-013, C-019, C-020,
  C-021, C-029. Limitation: generic Audio Unit generation and deeper contracts
  omitted. Preferred as the current official OS matrix.
- **S-008 - Plugin Manager.** Audacity Development Manual, page built
  2026-06-11. <https://manual.audacityteam.org/man/manage_effects_generators_and_analyzers.html>.
  Relevant sections: filters, enable/disable, rescan, `pluginregistry.cfg`.
  Supports C-014. Limitation: validation internals absent. Selected for host UX.
- **S-009 - Effects Preferences.** Audacity Development Manual, page built
  2026-06-11. <https://manual.audacityteam.org/man/effects_preferences.html>.
  Relevant sections: duplicate grouping, extra scan locations, startup scan.
  Supports C-012, C-014. Limitation: no cache identity details. Selected to
  close discovery behavior left open by S-008.
- **S-010 - Using master effects and realtime effects.** Audacity Support.
  <https://support.audacityteam.org/audio-editing/using-realtime-effects>.
  Relevant sections: track/master order, bypass, custom settings UI,
  mix/render/export, supported families. Supports C-007, C-008, C-010, C-012,
  C-013, C-021, C-023. Limitation: format-general marketing/support behavior,
  not a conformance matrix. Selected for the current realtime-stack contract.
- **S-011 - `PluginStartupRegistration.cpp` at 3.7.8 commit.** Audacity GitHub
  immutable source. <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/src/PluginStartupRegistration.cpp>.
  Relevant code: scan progress/skip/timeout, failed path cache, invalid disabled
  descriptors. Supports C-014, C-015, C-030. Limitation: delegates IPC details.
  Selected over issue reports for direct behavior.
- **S-012 - `AsyncPluginValidator.cpp` at 3.7.8 commit.** Audacity GitHub
  immutable source. <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/libraries/lib-module-manager/AsyncPluginValidator.cpp>.
  Relevant code: on-demand PluginHost, IPC request/result/disconnect. Supports
  C-015, C-016, C-030, C-034. Limitation: validates scanning only. Selected as
  decisive process-boundary evidence.
- **S-013 - `VSTEffect.cpp` at 3.7.8 commit.** Audacity GitHub immutable source.
  <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/src/effects/VST/VSTEffect.cpp>.
  Relevant code/comments: realtime modal behavior, custom/plain UI, buffer
  delay compensation, FXB/FXP/XML presets. Supports C-016, C-017, C-023.
  Limitation: not all VST2 instance code. Selected for concrete host depth.
- **S-014 - `VST3EffectBase.cpp` at 3.7.8 commit.** Audacity GitHub immutable
  source. <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/libraries/lib-vst3/VST3EffectBase.cpp>.
  Relevant code: effect classification, realtime support, automation,
  settings/presets. Supports C-018, C-023. Limitation: delegates processing.
  Selected as the VST3 effect contract entry.
- **S-015 - `VST3Instance.cpp` at 3.7.8 commit.** Audacity GitHub immutable
  source. <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/libraries/lib-vst3/VST3Instance.cpp>.
  Relevant code: realtime/offline initialize, main bus channel counts,
  latency, suspend/resume, block size. Supports C-018. Limitation: wrapper owns
  buses/state. Selected for instance lifecycle.
- **S-016 - `RealtimeEffectState.cpp` at 3.7.8 commit.** Audacity GitHub
  immutable source. <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/libraries/lib-realtime-effects/RealtimeEffectState.cpp>.
  Relevant code: preallocated UI/worker message exchange, plugin instance,
  latency, bypass, XML ID/version/parameters, unresolved-plugin TODO. Supports
  C-022, C-032. Limitation: enclosing project loader may add behavior. Selected
  as the common effect-state boundary.
- **S-017 - `VST3Wrapper.cpp` at 3.7.8 commit.** Audacity GitHub immutable
  source. <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/libraries/lib-vst3/VST3Wrapper.cpp>.
  Relevant code: direct component creation, processor/controller state, main
  buses only, event/aux disable, float32, presets, latency, parameter offset
  zero. Supports C-016, C-018, C-022, C-023, C-029, C-033, C-034. Limitation:
  documentary source review, no runtime fixture. Selected as the highest-value
  curiosity source because it changes the architecture conclusion.
- **S-018 - `AudioUnitEffectsModule.cpp` at 3.7.8 commit.** Audacity GitHub
  immutable source. <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/libraries/lib-audio-unit/AudioUnitEffectsModule.cpp>.
  Relevant code: AudioComponent discovery, effect categories, blacklist.
  Supports C-019. Limitation: does not name AU generation or deep processing
  contract. Selected to test, but not overclaim, AUv2/AUv3.
- **S-019 - `LV2EffectBase.cpp` at 3.7.8 commit.** Audacity GitHub immutable
  source. <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/libraries/lib-lv2/LV2EffectBase.cpp>.
  Relevant code: effect type/realtime, control/state interfaces, presets, state
  limitation comment. Supports C-020, C-022. Limitation: not complete LV2
  feature negotiation. Selected for state/processing depth.
- **S-020 - Audio Settings Preferences.** Audacity Development Manual, page
  built 2026-06-11. <https://manual.audacityteam.org/man/audio_settings_preferences.html>.
  Relevant sections: host APIs, devices/channels, project/track rates, 32-bit
  float, buffers/latency. Supports C-006, C-010. Limitation: device dependent.
  Selected as current user-visible engine contract.
- **S-021 - Mixing Audio Tracks.** Audacity Development Manual, page built
  2026-06-11. <https://manual.audacityteam.org/man/mixing.html>. Relevant
  sections: automatic mix, gain/pan order, mix/render, custom multichannel.
  Supports C-007. Limitation: does not expose internal graph. Selected for
  documented signal order.
- **S-022 - Importing Audio.** Audacity Development Manual, page built
  2026-06-11. <https://manual.audacityteam.org/man/importing_audio.html>.
  Relevant sections: shipped/FFmpeg formats, metadata, rates/formats. Supports
  C-010. Limitation: codec/build variability. Selected over format summaries.
- **S-023 - Export Audio.** Audacity Development Manual, page built 2026-06-11.
  <https://manual.audacityteam.org/man/file_export_dialog.html>. Relevant
  sections: ranges, multiple files, codecs, custom map, metadata, cloud.
  Supports C-011, C-025. Limitation: not interoperability round-trip testing.
  Selected for delivery breadth and cloud boundary.
- **S-024 - Saving and exporting projects.** Audacity Support.
  <https://support.audacityteam.org/basics/saving-and-exporting-projects>.
  Relevant section: account link, cloud backups/versioning/collaboration,
  background upload, preview mixdowns. Supports C-025. Limitation: service
  behavior is vendor documentation. Selected over the sparse cloud landing page.
- **S-025 - Audacity Desktop App Privacy Notice.** Audacity Team, last updated
  2025-02-01, applies to 3.7.2 onward.
  <https://www.audacityteam.org/legal/privacy-notice>. Relevant sections:
  update, errors, UUID, anonymization, retention/sharing. Supports C-026,
  C-029. Limitation: vendor policy, not audit. Selected as controlling desktop
  disclosure.
- **S-026 - Audio.com Privacy Notice.** Audio.com/MuseCY, effective 2025-05-12.
  <https://audio.com/legal/privacy-notice.pdf>. Relevant sections: account,
  content/projects, collaboration, UUID/analytics, EEA storage and processors.
  Supports C-026. Limitation: policy may evolve and does not specify project
  encryption. Selected because cloud use leaves desktop-policy scope.
- **S-027 - `LICENSE.txt` at 3.7.8 commit.** Audacity GitHub immutable source.
  <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/LICENSE.txt>.
  Relevant preamble: GPLv3 distribution, file-level licenses, documentation
  license. Supports C-027. Limitation: dependency/file audit still required.
  Selected as repository authority.
- **S-028 - VST 3 Developer Portal Licensing FAQ.** Steinberg Media
  Technologies. <https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html>.
  Relevant sections: VST3 MIT obligations and specific VST2 pre-Oct-2018
  agreement/header restriction. Supports C-017, C-027. Limitation: no legal
  opinion for a future implementation. Selected as format-owner primary source.
- **S-029 - Scripting.** Audacity Development Manual, page built 2026-06-11.
  <https://manual.audacityteam.org/man/scripting.html>. Relevant sections:
  named pipe/module, command scope, security warnings, known limits. Supports
  C-024. Limitation: Linux shipment unclear. Selected for integration and threat
  boundary.
- **S-030 - Nyquist Prompt.** Audacity Development Manual, page built
  2026-06-11. <https://manual.audacityteam.org/man/nyquist_prompt.html>.
  Relevant sections: LISP/SAL, plugin headers/UI, apply/debug/load/save.
  Supports C-012, C-024. Limitation: not the complete Nyquist language manual.
  Selected for native extension behavior.
- **S-031 - Accessibility Statement.** Audacity Team, prepared 2025-12-09 and
  revised 2026-08-27. <https://www.audacityteam.org/legal/accessibility>.
  Relevant sections: Audacity 3 partial compliance and listed gaps. Supports
  C-028. Limitation: vendor self-assessment and broad 3.x scope. Selected as the
  current official conformance statement.
- **S-032 - `ProjectFileIO.cpp` at 3.7.8 commit.** Audacity GitHub immutable
  source. <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/libraries/lib-project-file-io/ProjectFileIO.cpp>.
  Relevant code: SQLite schema, project/autosave blobs, immutable sample blocks,
  versions, transactions, safety copies, WAL/SHM, compaction. Supports C-004,
  C-031. Limitation: not a formal format spec. Selected for immutable storage
  architecture.
- **S-033 - `AudioIO.cpp` at 3.7.8 commit.** Audacity GitHub immutable source.
  <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/libraries/lib-audio-io/AudioIO.cpp>.
  Relevant code/comments: PortAudio, three contexts, ring buffers, float mix,
  latency, realtime-effect integration, dropout tracking. Supports C-006,
  C-032. Limitation: very large implementation and not a scheduler spec.
  Selected for engine/process evidence.
- **S-034 - repository README at 3.7.8 commit.** Audacity GitHub immutable
  source. <https://github.com/audacity/audacity/blob/6120ce413cf8abd4cca7f9470915f0ff0a0d2ded/README.md>.
  Relevant passages: identity, 32-bit float, plugin families, macros/scripting,
  Nyquist, license. Supports C-002, C-005, C-027. Limitation: overview. Selected
  to bind source provenance to product claims.
- **S-035 - About Audacity.** Audacity Team/Muse Group.
  <https://www.audacityteam.org/about/>. Relevant passages: use cases, editor vs
  DAW boundary, desktop-only scope, Muse history, plugin list. Supports C-002,
  C-009, C-033. Limitation: mutable vendor positioning and marketing claims.
  Selected for explicit product self-classification/history.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted method / blocker | Impact | Safest next probe / fixture / access | Owner |
| --- | --- | --- | --- | --- |
| Runtime plugin process isolation and crash recovery | Current docs and pinned wrapper/validator source searched; only scan IPC found; no binaries run | Security and session durability | Disposable VM; signed no-op plus controlled crash/hang plugins; record process tree, audio continuity, state, restart UX | Unassigned |
| AUv2 vs AUv3 and macOS LADSPA distribution | Official path matrix and AU/build source inspected; generation/packaged support ambiguous | Format matrix and macOS architecture | Current signed AUv2 `.component`, AUv3 app extension, LADSPA fixtures on supported macOS; scan/instantiate/UI/state | Unassigned |
| Absent AAX/CLAP/DSSI/JSFX/DX/Rack formats | Current support list and full pinned provider/build list searched; silence cannot prove absence in alternate builds | Ecosystem scope | Official release binary in disposable OS images plus one valid fixture per format; distinguish scan/instantiate | Unassigned |
| VST2/AU/LV2 buses, sidechain, tails, dynamic I/O, offline/state completeness | Target source/pages inspected; contract incomplete | Render fidelity and project recall | Conformance fixtures for main/aux/event buses, tails, latency changes, preset/state assets, offline/realtime parity | Unassigned |
| Plugin runtime UI scaling/headless/accessibility | Generic custom UI and VST2 plain UI documented only | Cross-platform UX/render farms | HiDPI/multi-monitor/headless matrix with custom/no-editor plugins and accessibility tree inspection | Unassigned |
| Missing-plugin placeholder and rebind durability | Common state source suggests unresolved plugin risk; no round trip run | Non-destructive project migration | Save project with state/assets, remove plugin, open/save/close, restore plugin; compare audio/state/AUP3 without manually editing DB | Unassigned |
| Sample-accurate automation and parameter identity migration | VST3 path has offset-zero points; no timeline lane docs | Modulation fidelity | Ramp/step fixture with sample capture and plugin-version parameter-ID migration | Unassigned |
| Full PDC/tail behavior through stacked track/master effects | VST2/VST3 latency consumption found, full graph proof absent | Timing and export correctness | Impulse fixtures with changing latency and long tails across track/master, bypass, render, and export | Unassigned |
| Multicore scaling, graph limits, dropout recovery, deterministic render | Engine source/manual inspected; no benchmark/limit contract | Performance architecture | Reproducible synthetic projects across cores/buffers/rates; hash offline renders and inject I/O stalls | Unassigned |
| MIDI/event/sync scope | Note-track and VST3 event-bus limitations found; broader docs absent | Suitability as music DAW reference | MIDI I/O/clock/MTC/SysEx/MPE/MIDI2 fixture matrix only if product scope requires it | Unassigned |
| AUP3 forward/backward/corruption behavior | Version checks/recovery documented; no version/corruption matrix | Long-term durability | Corpus across supported 3.x releases; power-loss/fuzzed-copy tests in disposable storage, never user projects | Unassigned |
| Cloud encryption, conflicts, offline queue, deletion, plugin/assets | Public support/privacy policies reviewed; service internals not public | Privacy, continuity, collaboration design | Ask provider for architecture/DPA; then consented test accounts and non-sensitive synthetic projects, no traffic bypass | Unassigned |
| Signing/notarization/plugin trust policy | Build/signing references and user paths found; plugin verification policy absent | Supply-chain security | Official maintainer clarification plus invalid/unsigned fixture matrix in disposable systems | Unassigned |

## 24. Curiosity pass and stop decision

Candidate scoring uses 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Rank | Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Inspect immutable VST3 wrapper for buses/state/latency/automation | 5 | 5 | 5 | 2 | **PURSUE** |
| 2 | Prove runtime crash containment | 5 | 5 | 4 | 5 | CURIOSITY_NO_GO: requires controlled binary fixtures outside wave |
| 3 | Resolve AUv2/AUv3 label | 4 | 4 | 3 | 4 | CURIOSITY_NO_GO: documentary ambiguity saturated; dynamic fixtures discriminate |
| 4 | Reverse cloud conflict/encryption protocol | 4 | 4 | 4 | 5 | CURIOSITY_NO_GO: access/safety boundary and provider evidence preferable |
| 5 | Enumerate native DSP/content | 2 | 2 | 1 | 3 | CURIOSITY_NO_GO: unlikely to change architecture conclusion |

The pursued thread materially changed the result: VST3 is not merely a format
logo, but its pinned implementation intentionally narrows events, aux buses,
I/O configuration, precision, and parameter timing while preserving state,
presets, latency, and realtime/offline effects. [C-018] [C-034]

**Stop decision:** documentary coverage is saturated for the stable 3.7.8
decision. Every required section/format row is evidence-backed or explicit
`UNKNOWN`; another documentation pass is unlikely to change the leading
patterns. Remaining high-value questions require bounded dynamic fixtures,
maintainer/service answers, or legal review. Research stopped at the stated
access/safety boundary, not because the unknowns are unimportant.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added only
  `research/daw-landscape/dossiers/audacity.md`; final status check performed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0 pins stable 3.7.8/commit and excludes Audacity 4 Beta 4.
- [x] **Every required dossier heading exists in order.** Sections 0 through 25
  match `DOSSIER-TEMPLATE.md`; validator run recorded below.
- [x] **Every material assertion has a claim ID and classification.** 35 claims
  use `DOCUMENTED`, `INFERENCE`, or `UNKNOWN`; there are no `OBSERVED` claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  Sections 21 through 23.
- [x] **Every required plugin-format row is present.** All 13 contract rows are
  in Section 11.1 with no blank status cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2 through 11.6 cover scan, validation, isolation, processing,
  latency, buses/events, state/presets, UI, diagnostics, and failures.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Scan isolation/runtime inference and AU generation are explicitly separated.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 covers
  GPL/file review, VST3 MIT, VST2 legacy licensing, trademarks, and no legal
  advice.
- [x] **Bibliography records source rationale and limitations.** Section 22 has
  35 retained primary sources with passages, scopes, limitations, and selection
  reasons.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19
  and 24 record the pursued VST3 thread and rejected alternatives.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Documentary fetch/source review only; no product/plugin
  binary was installed or run.

**Owned path:** `research/daw-landscape/dossiers/audacity.md`.

**Checks performed:** dossier validator; heading/format/claim/source scans;
source-count check; `git diff --check`; path-scoped Git status/diff review.

**Concise result:** complete structure with 35 classified claims, 35 retained
primary sources, all plugin rows, explicit unknowns/probes, and no observed
runtime claims.

**Unresolved blockers:** only dynamic/plugin/service/legal questions listed in
Section 23; none blocks documentary completion.

**Pre-existing workspace changes:** left untouched; no sibling/shared file was
edited, staged, committed, or reverted.
