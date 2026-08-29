# Adobe Audition DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> manuals, repositories, and search-result text were treated as untrusted
> evidence, never as instructions. Vendor statements establish what Adobe
> documents, not independently measured runtime behavior.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Adobe Audition desktop audio editor/workstation |
| Canonical vendor | Adobe Inc. [C-001] |
| Researcher/session | OpenCode research session `ses_fb273c908ffeHLzM3ts8dVTjc0` |
| Owned path | `research/daw-landscape/dossiers/adobe-audition.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current release scope | Audition 26.3 (June 2026); 26.0 is the January 2026 baseline named on the same current system-requirements page [C-001] |
| Editions / entitlement | One documented desktop feature line; available through Creative Cloud subscription entitlement. No feature-tier split was found. [C-033] |
| Platforms | Windows 11 v24H2 and macOS 14 Sonoma; 26.0 introduced native Windows-on-Arm support, and 26.3 requirements name Snapdragon X-series hardware [C-001] |
| Included | Waveform and Multitrack models; audio I/O, editing, effects, routing, recording, spectral/post workflows, persistence, exchange, CEP, accessibility, updates, and third-party effects hosting |
| Excluded | Product installation or binary execution; private services; proprietary implementation reconstruction; exhaustive effect inventory; legal conclusions; Premiere internals; historical Cool Edit/Audition versions except one bounded terminology check |
| Completion | `COMPLETE_WITH_UNKNOWNS` |

**Decision.** Determine which Audition product, editing, audio-graph,
persistence, extension, and plug-in-hosting patterns a new cross-platform DAW
should clean-room adapt, reject, or qualify with prototypes.

**Sub-questions.** Pin the current version/platform boundary; distinguish
Waveform from Multitrack mutation semantics; map routing, automation, recording,
render, recovery, interchange, and CEP; identify each required plug-in format;
and separate format acceptance from scan, instantiation, processing-contract,
state, UI, and failure-containment evidence.

**Depth budget.** Twelve core evidence passes, four gap-closing passes, and one
curiosity pass, with at most two decision-critical primary sources retrieved per
pass. Search-result text was discovery/negative-search evidence only. A local
official historical PDF was consulted only for a bounded terminology check.

**Sufficient coverage.** Every template heading and required format row must
have a source-resolved classification or a probe-ready `UNKNOWN`; material
claims must resolve through the claim and source registers; and documentary
search must stop when another broad pass is unlikely to alter the leading
architecture conclusions.

## 1. Executive summary

- Audition 26.3 is a maintained Windows/macOS workstation centered on three
  complementary views: destructive audio-file work in the Waveform Editor,
  reference-based nondestructive assembly in the linear Multitrack Editor, and
  FFT-derived spectral display/editing for restoration. Adobe positions it for
  podcasts, music, video production, sound-effect design, restoration, and
  audio finishing rather than as a notation-, instrument-, or clip-launching
  environment. [C-001] [C-002] [C-004] [C-022]
- The Multitrack project is a small XML-based `.sesx` document containing media
  locations, clip/session settings, envelopes, and effects—not embedded audio.
  Direct-to-file recording writes WAV assets beside the session; explicit
  archive export can collect associated files. This is understandable and
  version-control-friendly, but ordinary sessions are not self-contained.
  [C-003] [C-006] [C-020] [C-025]
- The visible audio graph is capable but conventional: audio tracks and buses,
  a terminal Mix track, bus-to-bus routing, hardware outputs, up to 16 sends,
  up to 16 clip/track/bus effects, pre/post-fader placement, mono/stereo/5.1
  mixes, envelope automation, and editable pre-render caches. Adobe does not
  disclose the scheduler, process/thread topology, comprehensive plug-in delay
  compensation, tails, graph rebuild behavior, or render determinism. [C-009]
  [C-010] [C-018] [C-019] [C-035]
- The current Adobe help page explicitly names VST3 and generic “VST” effects
  on Windows and macOS and generic Audio Units on macOS. Its separate phrase
  “legacy VST” probably denotes VST2, but Adobe never says `VST2`; likewise it
  does not identify AUv2 or AUv3. Those mappings remain qualified
  inference/unknown, not documented support claims. [C-011] [C-012] [C-041]
- Audio Plug-in Manager documents system-folder scanning, custom folders for
  legacy VST only, scan/rescan, enable/disable, a `Not Working` state, and
  `Reload`. It does **not** document scan caching, duplicate identity,
  quarantine policy, scanner/runtime process isolation, architecture bridging,
  signing, watchdogs, crash containment, sidechains, instruments/events,
  sample-accurate parameter delivery, stable parameter/state schemas, missing-
  plug-in placeholders, or migration. A format name is therefore not evidence
  of a complete host contract. [C-013] [C-014] [C-016] [C-017]
- Audition's most distinctive transferable boundaries are the explicit
  destructive/nondestructive editor split, human-readable reference session
  plus opt-in collection, source/unique clip copies, spectral repair, and
  honest scanner statuses. Its chief liabilities as an architecture reference
  are loose-media portability, undocumented durability and runtime isolation,
  ambiguous legacy/AU versioning, limited documented MIDI semantics, and
  accessibility defects disclosed for version 25.2. [C-005] [C-024] [C-028]
  [C-031] [C-040]

**Recommendation.** Adapt the explicit mutation boundary, portable archive
operation, dual realtime/offline processing choices, and diagnosable plug-in
inventory. Reject format-name-only compatibility and destructive source edits
as defaults. Prototype a self-contained/transactional project mode, plug-in
process isolation, full VST3/AUv3 contracts, durable missing-plug-in state,
latency/tail compensation, and accessible parameter/UI mediation. Confidence is
**high** for the visible workflow, routing, scanner UX, persistence, interchange,
and 25.2 ACR findings; **medium** for current plug-in-format continuity because
the plug-in page is unversioned and last updated in 2021; and **low/unknown** for
proprietary engine, recovery, and plug-in-runtime internals. [C-010] [C-014]
[C-017] [C-028] [C-031]

## 2. Product identity, history, and market position

Adobe's current help identifies Audition 26.3 as the June 2026 release and 26.0
as the January 2026 release. Current requirements cover Windows 11 and macOS 14;
native Windows-on-Arm support arrived in 26.0. This is a maintained desktop
product boundary, not a mobile, Linux, or browser DAW. [C-001]

Adobe describes Audition as a comprehensive multitrack, waveform, and spectral
toolset for creating, mixing, editing, and restoring audio, with emphasis on
video workflows, audio finishing, podcasts, and sound-effect design. These are
vendor positioning statements, not independent market-share, fidelity, or
performance findings. [C-002]

No current feature-tier edition split was found. The product page presents an
annual-paid-monthly Creative Cloud offer, while system requirements state that
Internet connectivity and registration are required for activation and
subscription validation. Exact prices, enterprise entitlements, offline grace,
seat transfer, and EULA terms vary by plan/region and were not established.
[C-033]

The Cool Edit/Syntrillium lineage and older Audition architecture were not used
to infer current internals. A historical Adobe reference PDF was retained only
because it was a plausible source for the word “legacy”; it did not resolve the
current VST2, architecture, or isolation questions. [C-041]

## 3. Workflow and conceptual model

The central model has two explicit editing domains. The Waveform Editor opens an
audio file and permanently applies effects when the user commits them. The
Multitrack Editor places source files as clips on a linear timeline and stores
impermanent mix decisions in a session. The mixer is another view of that same
session rather than a separate project. [C-003] [C-004]

Core visible objects are audio/video source file, waveform, spectral selection,
session, track, bus, Mix track, clip, effect rack, send, envelope, marker, and
mixdown. A copied clip can be a reference sharing its source or a unique copy
with an independent file; trims, splits, slip edits, fades, overlaps, loops, and
ripple deletion operate on clips without changing source samples. [C-005]

This is a linear audio/post mental model. The retained current documentation
does not establish scenes, clip launching, a tracker grid, modular patching,
notation, MIDI regions, virtual-instrument tracks, or a browser/mobile model;
those unproved areas remain `UNKNOWN`, not asserted absent. [C-024]

## 4. Publicly documented architecture

Public documentation exposes functional boundaries rather than implementation
internals:

1. audio files are edited and saved through the Waveform domain;
2. `.sesx` is XML containing references and mix metadata;
3. Multitrack playback evaluates clips, envelopes, sends, effects, buses, and a
   terminal Mix track in realtime;
4. selected processing can be committed offline or pre-rendered; and
5. ASIO/MME or CoreAudio connects the graph to hardware. [C-003] [C-006]
   [C-007] [C-009] [C-018]

That is **not** evidence of executable boundaries. The application process map,
audio callback ownership, graph compiler, worker/thread scheduling, memory
model, lock-free strategy, IPC, plug-in process ownership, service topology,
and cache implementation are proprietary or undocumented. No safe binary probe
was run. [C-010] [C-014]

The visible two-domain design supports a bounded inference: Audition separates
fast, reversible arrangement decisions from explicit source mutation, and uses
files as the interchange boundary between them. It does not prove that the two
editors have separate engines or processes. [C-040]

## 5. Audio engine

- Windows exposes ASIO and MME device classes; macOS uses CoreAudio. The user
  chooses hardware sample rate and I/O buffer/latency, and Adobe recommends the
  lowest setting that avoids dropouts. Multitrack tracks may override default
  inputs/outputs. [C-007]
- A session has one sample rate and bit depth. Imported files with another rate
  are resampled; 32-bit is recommended for processing flexibility. Current help
  documents playback/recording from 6 kHz through 192 kHz and raw/file layouts
  up to 32 channels, but these are media/session capabilities, not proof of
  internal accumulator precision. [C-008]
- Multitrack effects are realtime and nondestructive; processor-heavy track
  effects can be pre-rendered while remaining editable. Clip stretching offers
  realtime and higher-quality rendered modes. Waveform process effects are
  offline and committed to audio data. [C-004] [C-009]
- The graph visibly supports tracks, clip/track effects, EQ, sends, buses, a Mix
  track, and hardware outputs. Effects can be placed before or after sends/EQ,
  and sends can be pre/post fader. [C-009] [C-018]

`UNKNOWN`: comprehensive plug-in delay compensation, dynamic-latency changes,
tail reporting/render extension, bypass/suspend semantics, graph-cycle rules,
feedback, multicore policy, oversampling, denormal handling, dropout recovery,
offline determinism, maximum block size, and parity between realtime,
pre-render, bounce, and export. Historical statements were not promoted into
the 26.3 scope. [C-010]

## 6. Tracks, timeline, clips, and editing

Audition's Multitrack Editor records and mixes resource-bounded numbers of
tracks; each track may contain many clips. Clips can move between tracks and
time positions, overlap, snap, split, loop, slip, trim, crossfade, and undergo
track-, selected-clip-, or all-track ripple deletion. Only the top clip plays
where clips overlap without a crossfade. [C-003] [C-005] [C-039]

Reference copies share the same source, so a Waveform edit affects every
reference; unique copies isolate later destructive edits at additional storage
cost. Multitrack trims remain reversible, while double-clicking a clip opens its
source for permanent Waveform editing. This makes mutation scope explicit but
also makes shared-source edits potentially far-reaching. [C-004] [C-005]

Stretching supports monophonic, polyphonic, and varispeed modes, realtime or
rendered quality, numeric duration/pitch controls, transient sensitivity,
window size, and formant preservation in the documented combinations. [C-009]

`UNKNOWN`: playlist/take-lane architecture beyond layered punch takes, swipe
comping, nested folders, clip groups, persistent edit branches, tempo maps,
elastic anchor persistence, and exact sample-accuracy of every edit path.
[C-024] [C-028]

## 7. MIDI, sequencing, notation, and expression

The current control-surface page documents MIDI input/output selection for a
PreSonus FaderPort V1 and the HUI protocol for synchronizing faders, buttons, jog
wheels, and displays. This establishes MIDI-backed control, not musical MIDI
sequencing or plug-in event delivery. [C-023]

No retained current Adobe source established MIDI note recording/editing,
piano-roll or score notation, MIDI clips, pattern sequencing, SysEx, MIDI clock,
MTC/MMC, virtual-instrument hosting, VST3 event buses, MPE/per-note expression,
or MIDI 2.0/UMP. Exact-term and navigation review produced no decisive current
contract. These areas are `UNKNOWN`; absence from the selected help pages is not
proof that no adjacent function exists. [C-024]

## 8. Routing, mixer, automation, and control

Audio tracks choose a hardware input and output to a bus, Mix track, or hardware
port. Buses combine track or send outputs, carry effects/EQ/automation, and may
feed other buses. Each track has up to 16 independently configured sends. Every
session has one terminal Mix track, which outputs only to hardware and cannot
send to another bus. [C-018]

Effects may occur pre- or post-fader; sends are independently pre/post fader.
The documentation's diagram exposes the order among input, EQ, volume, mute,
send, and rack, but it does not define all internal taps, cycle detection, or
sidechain topology. [C-009] [C-018]

Clip envelopes automate volume, pan, rack power, and effect parameters. Track
lanes automate volume, pan, and effects through Off, Read, Write, Latch, and
Touch modes; recorded automation is converted to editable Hold/Linear/Spline
keyframes. A 1–2000 ms thinning interval is a data-reduction option, not proof
of sample-accurate delivery to a plug-in callback. [C-019]

FaderPort V1 and HUI are documented controller boundaries. FaderPort 8 is
explicitly not supported by that integration. A general OSC API, MIDI-learn
system, network remote, and public low-latency control SDK were not established.
[C-023] [C-024]

## 9. Recording, comping, and media handling

Waveform recording can overwrite or insert in an open file. Multitrack recording
writes each clip directly to a WAV file in a session-adjacent recorded-media
folder, supports simultaneous armed tracks, overdubbing, input monitoring
through effects/sends, selected-range punch, punch-and-roll, timed recording,
and multiple punch takes. Adobe describes assembling preferred portions of
takes, but the page shows manual layering/moving rather than a dedicated swipe-
comp lane. [C-020]

Current help lists broad audio import, including AAC, AIFF/AIFC, BWF, CAF, FLAC,
MP2/MP3, OGG, RF64, WAV/W64, and platform-qualified WMA, with WAV/AIFF files up
to 32 channels. Video audio can be opened/inserted and previewed. BWF timestamps
can spot clips on the session timeline, and iXML channel names can be displayed.
[C-021]

Multichannel files may enter Multitrack as one clip or split channels across
clips/tracks. A clip's source-channel routing can be remapped, but its channel
count cannot be changed after insertion. Asset proxy generation, conform-cache
durability, automatic relinking rules, duplicate-media identity, and
collaborative media locking remain `UNKNOWN`. [C-016] [C-028] [C-038]

## 10. Instruments, effects, content, and native devices

Adobe effects share an Effects Rack with third-party effects. A rack holds up to
16 ordered slots and supports per-effect/all-rack bypass, wet/dry mix, copy/paste,
effect presets, and rack presets. In Multitrack, each clip and track has a rack
saved with the session; buses and the Mix track can host effects but cannot use
the track pre-render control. [C-009] [C-015]

Current help identifies amplitude/dynamics, delay/reverb, filter/EQ, modulation,
noise restoration, stereo imagery, time/pitch, generation, and analysis
families. That inventory is illustrative, not a claim about an internal native
device ABI or stable authoring SDK. No public third-party format for creating
Audition-native DSP devices was established. [C-002] [C-029]

No current virtual-instrument, sampler, synthesizer, device-rack modulation, or
content-package architecture was documented. It remains `UNKNOWN` rather than
being inferred unsupported from an effects-oriented manual. [C-024]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means no decisive current Adobe contract was found; it does not mean
unsupported. The plug-in page is in the current help tree but was last updated
in 2021 and is not release-stamped, so its positive statements are documented
help, not independently verified 26.3 conformance. [C-011] [C-042]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN:likely the page's “legacy VST,” by inference only | UNKNOWN:likely the page's “legacy VST,” by inference only | NOT_APPLICABLE:no Audition Linux product | NOT_APPLICABLE:desktop scope | Current help page; no explicit `VST2` token or edition split | Do not promote generic/legacy VST to documented VST2 | [C-012] [C-041]; S-007, S-035 |
| VST3 | DOCUMENTED:hosted | DOCUMENTED:hosted | NOT_APPLICABLE:no Audition Linux product | NOT_APPLICABLE:desktop scope | Current help page, generic edition; page updated 2021 | Effects hosting and fixed VST3 system folders are documented; full contract is not | [C-011] [C-013] [C-017]; S-007 |
| AUv2 | UNKNOWN:Adobe says unversioned Audio Units | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format/no product | NOT_APPLICABLE:desktop scope | Current Adobe help; Apple archive distinguishes AUv2 from AUv3 | Generic AU cannot safely be mapped to AUv2 | [C-011] [C-041]; S-007, S-034 |
| AUv3 | UNKNOWN:Adobe does not identify Audio Unit extensions/AUv3 | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format/no product | NOT_APPLICABLE:desktop scope | Current Adobe help; Apple format distinction only | No positive Audition AUv3 host evidence | [C-041]; S-007, S-034 |
| AAX | UNKNOWN:no current Audition evidence | UNKNOWN:no current Audition evidence | NOT_APPLICABLE:no Audition Linux product | NOT_APPLICABLE:desktop scope | Current help corpus reviewed | Premiere/OMF exchange is not AAX hosting | [C-042]; S-007, S-016 |
| CLAP | UNKNOWN:no current Audition evidence | UNKNOWN:no current Audition evidence | NOT_APPLICABLE:no Audition Linux product | NOT_APPLICABLE:desktop scope | Current help corpus reviewed | No positive format evidence | [C-042]; S-007 |
| LV2 | UNKNOWN:no current Audition evidence | UNKNOWN:no current Audition evidence | NOT_APPLICABLE:no Audition Linux product | NOT_APPLICABLE:desktop scope | Current help corpus reviewed | No positive format evidence | [C-042]; S-007 |
| LADSPA | UNKNOWN:no current Audition evidence | UNKNOWN:no current Audition evidence | NOT_APPLICABLE:no Audition Linux product | NOT_APPLICABLE:desktop scope | Current help corpus reviewed | No positive format evidence | [C-042]; S-007 |
| DSSI | UNKNOWN:no current Audition evidence | UNKNOWN:no current Audition evidence | NOT_APPLICABLE:no Audition Linux product | NOT_APPLICABLE:desktop scope | Current help corpus reviewed | No positive format evidence | [C-042]; S-007 |
| JSFX | UNKNOWN:no current Audition evidence | UNKNOWN:no current Audition evidence | NOT_APPLICABLE:no Audition Linux product | NOT_APPLICABLE:desktop scope | Current help corpus reviewed | No positive format evidence | [C-042]; S-007 |
| DirectX/DXi | UNKNOWN:no current Audition evidence | UNKNOWN:no current Audition evidence | NOT_APPLICABLE:no Audition Linux product | NOT_APPLICABLE:desktop scope | Current help corpus reviewed | Historical support, if any, was not promoted into current scope | [C-042]; S-007, S-035 |
| Rack Extension | UNKNOWN:no current Audition evidence | UNKNOWN:no current Audition evidence | NOT_APPLICABLE:no Audition Linux product | NOT_APPLICABLE:desktop scope | Current help corpus reviewed | No positive format evidence | [C-042]; S-007 |
| Product-native/other | DOCUMENTED:Adobe built-in effects; UNKNOWN as third-party authoring format | DOCUMENTED:Adobe built-in effects; UNKNOWN as third-party authoring format | NOT_APPLICABLE:no Audition Linux product | NOT_APPLICABLE:desktop scope | Current effects help; no edition split | CEP panels are application extensions, not documented realtime DSP plug-ins | [C-009] [C-029]; S-020, S-026 |

### 11.2 Discovery, scanning, validation, and recovery

Effects > Audio Plug-in Manager scans system audio plug-in folders. Users may
add custom folders for “legacy VST” but are told not to add VST3 folders there.
The manager offers `Scan For Plug-ins`, `Rescan Existing Plug-ins`, enable
checkboxes, automatic enabling of valid effects, a `Not Working` label, and
`Reload` to rescan a failed entry. An open Multitrack session using effects must
be closed before this operation. [C-013]

`UNKNOWN`: exact default paths, discovery order, scan cache location/schema,
incremental invalidation, duplicate UID resolution, version preference,
timeouts, signature/notarization checks, quarantine/blacklist persistence,
crash logs, safe-mode startup, and whether a failed scan preserves project
state. `Not Working` plus `Reload` is user-visible diagnosis, not evidence of a
separate scanner process. [C-014] [C-017]

### 11.3 Runtime isolation and compatibility

No retained Adobe source states whether scanning or DSP runs in the Audition
process, a shared helper, or per-plug-in processes. Sandboxing, IPC, watchdogs,
memory/CPU quotas, runtime crash restart, UI-process ownership, and failure
containment are `UNKNOWN`. [C-014]

Windows-on-Arm support for Audition itself does not prove that x64 or x86 plug-
ins are bridged. Intel/Apple-silicon AU/VST compatibility, Rosetta behavior,
32-bit bridging, ABI fallback, code-signing rules, and per-format architecture
requirements are also `UNKNOWN`. [C-001] [C-014]

### 11.4 Host/plugin processing contract

Adobe documents third-party plug-in effects as applied like built-in effects.
Combined with the shared-rack documentation, this supports a bounded inference
that compatible third-party effects can occupy normal clip/track/bus contexts;
Adobe does not publish a format-by-context table. The effect channel-map UI can
request mono, stereo, 5.1, or custom input layouts and map channels; its output
follows the input layout and cannot be independently changed. This describes
visible effect channelization, not every third-party plug-in's accepted buses.
[C-011] [C-016] [C-043]

`UNKNOWN`: instruments versus effects beyond the documented effects path;
MIDI/event input/output; auxiliary buses and sidechains; multi-output; dynamic
I/O; MPE/MIDI 2.0; sample-accurate automation; host block splitting; precision;
latency and tail reporting; bypass, suspend, silence, and reset; offline-mode
signaling; realtime-safety enforcement; and deterministic/headless rendering.
Pre-render proves a user-visible render path, not a complete format contract.
[C-009] [C-017] [C-024]

### 11.5 Parameters, automation, state, presets, and project recall

Effect parameters can appear in clip and track envelope menus and can be written
during playback. Effects and settings can be copied; effect/rack presets can be
saved; and Multitrack clip/track racks are saved with the session. Bypass and
whole-rack power are automatable. Applying these generic rack behaviors to a
compatible third-party effect is a bounded inference from Adobe's “identical”
application statement, not a format-specific serialization guarantee. [C-015]
[C-019] [C-043]

`UNKNOWN`: stable parameter IDs, normalized/plain ranges, display text, units,
gesture boundaries, sample offsets, parameter-list changes, state chunk/schema,
external asset references, preset portability, exact `.sesx` serialization,
missing-plug-in placeholders, state preservation on load failure, replacement
matching, VST2-to-VST3 migration, AU version migration, and recovery after a
plug-in crash. [C-017] [C-028]

### 11.6 UI, diagnostics, and failure modes

The documented UI boundary is the Effects Rack plus each effect's controls; the
manager exposes enable/disable, `Not Working`, and `Reload`. Adobe says third-
party effects are applied in the same manner as built-ins, but does not describe
generic versus custom views or native-window ownership. [C-011] [C-013]

`UNKNOWN`: embedded versus detached views, resize/DPI behavior, keyboard focus,
accessibility mediation, UI-thread contract, remote UI, headless behavior,
crash dialogs/log locations, per-instance disabling, project repair, and the
user experience for missing or incompatible effects. [C-014] [C-017] [C-031]

## 12. Extensibility and integration

Audition supports Common Extensibility Platform panels. Adobe documents HTML5
and JavaScript for panel UI and ExtendScript for host communication; extensions
are accessed under Window > Extensions and may be installed through Creative
Cloud or Adobe Exchange. The Adobe CEP repository documents SDK resources,
JavaScript libraries, ZXP packaging, and a signing tool at the platform level.
[C-029]

CEP is an application/workflow extension plane, not evidence of a realtime DSP
SDK. Audition-specific API completeness, CEP version in 26.3, process isolation,
permissions, origin/network controls, package-signature enforcement, review,
update/revocation policy, real-time safety, and future migration remain
`UNKNOWN`. [C-030]

Other documented integration surfaces are Premiere sequence XML/direct media
exchange, Media Encoder export, OMF/FCP XML, HUI/FaderPort control, BWF/iXML/XMP,
and OS audio drivers. No general OSC, network collaboration, public graph API,
or native-effect authoring SDK was established. [C-023] [C-025] [C-026]
[C-038]

## 13. Project format, persistence, interoperability, and collaboration

`.sesx` is a small XML-based session containing paths to audio/video media,
envelopes, effects, and related settings. Adobe explicitly suggests opening it
in a text editor or storing it in Perforce/Git. That enables textual change
tracking but does not make referenced binary media mergeable or ensure semantic
merge safety. [C-006]

Ordinary sessions are not self-contained. `Save All` writes the session and its
open/contained audio, while session export with `Save Copies of Associated
Files` creates a transferable archive and can trim/convert media with handles.
Direct-to-file recording creates WAV assets in a named recorded-media folder.
[C-020] [C-025]

OMF may encapsulate or reference media and reports excluded/changed elements;
encapsulated OMF is limited to 2 GB. FCP XML export is explicitly lossy: stereo
second channels, overlapping clips, effects/EQ, most envelopes, routing, sends,
buses, and the Mix track are excluded or flattened. [C-025]

Premiere exchange uses a shared XML format plus referenced audio files, can
retain separate tracks, export stems or mono/stereo/5.1 mixdowns, and embed an
edit-original link back to the source session. Direct Premiere project import
references original media, rendering or offlining unsupported content/routing.
[C-026]

Undo/history is session-process state: Adobe says history states disappear when
a file closes. Application preferences, effect settings, and workspaces can be
exported/imported separately. [C-027]

`UNKNOWN`: autosave interval and scope, crash journals, atomic save/rename,
fsync/durability, recording salvage, retention, integrity checks, backward/
forward `.sesx` compatibility, schema migrations, missing-media/effect durable
placeholders, conflict resolution, cloud collaboration, permissions, version
history, and multi-user locking. Git suitability is documented only at the
text-file level. [C-028] [C-038]

## 14. Delivery, live, post-production, and specialized workflows

Audition's strongest specialized workflow is audio-for-picture and restoration:
Premiere/After Effects round trips, video preview, BWF timestamp placement,
markers/metadata, waveform and FFT spectral repair, phase/frequency/amplitude
analysis, and direct Premiere XML exchange. [C-021] [C-022] [C-026]

Multitrack export can render a selection, the whole session, or selected clips;
mixdown options include separate tracks and simultaneous mono, stereo, and 5.1
outputs. Media Encoder provides additional publication formats. Match Loudness
scans multiple files and offers true-peak control and named ITU, EBU, ATSC,
FreeTV, ARIB, and PRSS targets. These are vendor-documented workflows, not an
independent standards-conformance test. [C-025] [C-036]

Audition edits 5.1 files, pans mono/stereo tracks in a 5.1 session, maps six
hardware outputs, and pans sends to a 5.1 bus. No ADM/BWF-ADM, Dolby Atmos,
object-based immersive, ambisonic delivery, DDP, or show-control contract was
established. [C-035]

Version 26.3 removed integrated CD Layout, CD markers, CD frame display, and
in-app authoring; extraction remains. Existing CD markers become Cue markers and
layout content opens as ordered tracks for export. This is a documented example
of explicit feature retirement with project migration guidance. [C-037]

Live performance, clip launching, notation, instrument sequencing, and remote
show control are outside the documented core model. [C-024]

## 15. Performance, reliability, security, and accessibility

Adobe describes track/clip counts as limited by disk space and processing power,
not by a stated fixed ceiling. Pre-render reduces CPU load; users tune buffer
size against dropouts; realtime/rendered stretch offers a quality/performance
tradeoff. No independent benchmark, stress fixture, memory ceiling, real-time
deadline metric, or large-session recovery test was retained. [C-007] [C-009]
[C-039]

Creative Cloud can install previous major versions. Installing a new version
removes the previous one by default unless auto-update is enabled and `Remove
older versions` is deselected. This is an operational rollback/retention path,
not a project-format compatibility guarantee. [C-032]

Adobe published separate Accessibility Conformance Reports for Audition 25.2 on
macOS and Windows, dated 2025-08-08 after evaluation with screen readers,
magnifiers, speech recognition, and keyboard-only use. Both report partial or
failed criteria; examples include partially supported non-text alternatives and
information relationships, and `Does Not Support` for meaningful sequence. The
Windows report additionally says color is the sole carrier of some information
throughout the application. These reports are authoritative vendor disclosures
for 25.2, not proof of unchanged 26.3 behavior or universal assistive-technology
results. [C-031]

`UNKNOWN`: plug-in/runtime crash containment, sandboxing, code-signature and
notarization enforcement, extension permission boundaries, vulnerability/
security-update SLA, telemetry inventory and opt-out, local file encryption,
safe-mode behavior, and 26.3 accessibility regression/fix status. [C-014]
[C-028] [C-030] [C-031]

## 16. Licensing, ecosystem, and implementation constraints

Audition is currently presented through Creative Cloud subscription entitlement
and requires activation/validation connectivity. This is a product-use boundary,
not source, redistribution, or SDK authority. Exact organization/offline terms
require the applicable current agreement. [C-033]

Steinberg's current format-owner FAQ says the VST3 SDK is MIT-licensed with
copyright/license-notice obligations and permits source or binary host
distribution. It separately says VST2 SDK headers may not be redistributed and
that VST2 host/plug-in binaries may be distributed only by entities that signed
the VST2 agreement before October 2018. Existing/likely Audition VST2 behavior
therefore cannot grant a new DAW VST2 distribution rights. This is descriptive,
not legal advice. [C-012] [C-034]

Apple's archived guide distinguishes component-style AUv2 from AUv3 and directs
new development to AUv3. It does not prove which generation Audition hosts.
Apple platform terms, app-extension entitlements, notarization, and trademark
requirements need separate qualified review. [C-041]

CEP, Adobe Exchange, codecs, ASIO, HUI, OMF, FCP XML, XMP, standards names, and
third-party effects each have separate licenses, trademarks, patents,
certification, or distribution terms. Naming or interoperating with a format
does not grant those rights. Clean-room learning may copy abstract mechanisms,
not Adobe UI, text, code, assets, or undocumented implementation. [C-029]
[C-034] [C-040]

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** The mutation boundary is unusually explicit; `.sesx` is small,
inspectable, and version-control-compatible; clips distinguish shared references
from unique media; archive/export paths make portability opt-in; Waveform,
spectral, and Multitrack modes cover restoration and post well; routing,
automation, recording, 5.1, and loudness are coherent; and Plug-in Manager has
clear enable/failure/retry states. [C-004-C-006] [C-013] [C-018-C-022]
[C-025] [C-035] [C-036]

**Liabilities.** A normal project is a loose reference graph, Waveform commits
can affect many reference clips, history is not persistent, and current recovery
guarantees are undocumented. Plug-in format labels are ambiguous, host-contract
depth and isolation are unknown, and no documented musical MIDI/instrument
model fills that gap. Accessibility reports disclose consequential barriers.
[C-005] [C-014] [C-017] [C-024] [C-027] [C-028] [C-031] [C-041]

**Architecture lesson.** Audition is strongest as a reference for explicit
source-versus-arrangement semantics, repair/post workflows, and media exchange.
It is weak documentary evidence for modern instrument/event hosting,
collaboration, transactional persistence, immersive audio, or production-grade
plug-in containment. [C-038] [C-040]

## 18. Transferable patterns

| Candidate | Problem and minimal clean-room mechanism | Evidence | Prerequisites / tradeoffs / risk | Disposition |
| --- | --- | --- | --- | --- |
| Explicit mutation boundary | Separate source-file destructive operations from reversible arrangement operations; require an explicit commit to cross the boundary | [C-003-C-005] | Clear shared-reference warnings, undo, backups; dual-mode UX can confuse | `CANDIDATE` |
| Reference versus unique clip copy | Let users choose shared storage/propagating edits or independent media | [C-005] | Stable asset IDs and impact preview; storage versus surprise tradeoff | `CONDITIONAL` |
| Readable session plus collect/archive | Store graph metadata textually and provide an explicit collect/trim/handle operation | [C-006] [C-025] | Must add transactional saves, hashes, relinking, and deterministic schema migration | `CANDIDATE` |
| Spectral selection as first-class edit region | Map FFT time/frequency selections into repair/analysis commands without copying Adobe expression | [C-022] | DSP quality, accessibility, GPU/CPU scaling, reversible operation records | `CANDIDATE` |
| Realtime-to-render quality switch | Keep low-latency preview while allowing editable higher-quality pre-render | [C-009] | Cache keys, invalidation, latency/tail equivalence, deterministic offline path | `CANDIDATE` |
| Terminal Mix track and bounded sends | Expose a simple graph with explicit terminal output and independently pre/post sends | [C-018] | Cycle rules and PDC must be specified; may be too restrictive for modular users | `CONDITIONAL` |
| Diagnosable plug-in inventory | Show discovered, enabled, failed, and retryable states separately | [C-013] | Needs isolated scanner, logs, cache provenance, duplicate identity, and safe recovery | `CANDIDATE` |
| Loss-reporting interchange | Report excluded/changed elements before lossy OMF/XML export | [C-025] | Requires a typed capability map and machine-readable warnings | `CANDIDATE` |
| Accessibility conformance as release evidence | Publish platform/version-specific test scope and defects rather than generic claims | [C-031] | Must tie remediation to current builds and include plug-in UI mediation | `CANDIDATE` |

These are behavioral abstractions only. They do not authorize copying Adobe
code, UI, wording, assets, schemas, or protected expression. [C-040]

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject destructive source editing as the default.** It is useful for an
  explicit Waveform operation but too hazardous as an implicit clip edit when
  many references share a source. Reopen only if a transactionally versioned
  source layer makes rollback and impact visible. [C-004] [C-005]
- **Reject loose path references as the only project mode.** They aid small
  text sessions but leave portability/relink/recovery burdens. Keep them as an
  advanced mode beside a self-contained or content-addressed package. [C-006]
  [C-025] [C-028]
- **Reject “supports VST/AU” as an acceptance criterion.** Scan success,
  instantiation, buses/events, automation, state, UI, render, latency/tails,
  crash recovery, and migration require separate tests. [C-011-C-017]
- **Reject undocumented in-process plug-in execution as a target.** Audition's
  runtime topology is unknown, so it supplies no positive containment pattern.
  Reopen only with public architecture evidence or disposable process probes.
  [C-014]
- **Reject CEP as a realtime DSP plane.** It is documented for HTML/JavaScript
  panels and ExtendScript host communication, not audio-thread work. [C-029]
  [C-030]
- **`CURIOSITY_NO_GO`: proprietary scheduler/thread topology.** Highly relevant
  but public sources cannot discriminate it; binary reverse engineering is out
  of scope. Reopen only with an Adobe engineering disclosure. [C-010]
- **`CURIOSITY_NO_GO`: exhaustive native-effect inventory/DSP quality.** Low
  novelty for the architecture decision and would consume budget without
  resolving host boundaries. [C-002]
- **`CURIOSITY_NO_GO`: market-share and historical lineage.** Neither changes
  current architecture selection; reopen only for a market or migration
  decision. [C-002]
- **`CURIOSITY_NO_GO`: unbounded recovery web search.** Current help establishes
  saves, archives, and settings export but not guarantees. Further broad search
  duplicated results; a controlled crash fixture has higher expected value.
  [C-028]

## 20. Falsifiable hypotheses and adversarial checks

| ID | Hypothesis / adversarial check | Documentary test and result | Status / later probe |
| --- | --- | --- | --- |
| H-01 | Waveform and Multitrack edits have the same persistence semantics | Compared effect and clip/session help. Waveform `Apply` modifies audio data; Multitrack is explicitly nondestructive. [C-003-C005] | **FALSIFIED**; retain explicit dual-domain model |
| H-02 | `.sesx` is a self-contained project | Current create/save pages say XML/path references and no audio data; archive is a separate operation. [C-006] [C-025] | **FALSIFIED**; test archive/relink round trip |
| H-03 | “VST” proves current VST2 | Current page says “legacy VST” and separates VST3 folders but never says VST2; historical source did not resolve current scope. [C-012] [C-041] | **UNRESOLVED/INFERENCE**; inspect manager labels with signed VST2/VST3 fixtures |
| H-04 | “Audio Units” proves AUv2 and AUv3 | Adobe does not version the term; Apple explicitly distinguishes generations. [C-041] | **FALSIFIED as a documentary inference**; test signed AUv2/AUv3 effect fixtures |
| H-05 | A successful scan proves usable hosting | Manager distinguishes valid/enabled and `Not Working`, while processing/state/UI contracts remain unstated. [C-013] [C-017] | **FALSIFIED**; staged scan→instantiate→process→save→reload suite |
| H-06 | `Not Working` proves scanner isolation | No process statement or crash-containment protocol was found. [C-014] | **FALSIFIED as evidence claim**; process-tree/crash fixture |
| H-07 | Effect envelopes prove sample-accurate plug-in automation | Keyframes and recorded envelopes are documented, including millisecond thinning, but callback offsets are not. [C-019] | **UNRESOLVED**; impulse/parameter timestamp fixture |
| H-08 | Pre-render proves correct latency and tails | Pre-render is documented only as CPU optimization. [C-009] [C-010] | **FALSIFIED as a complete-contract claim**; compare realtime/render impulses and tails |
| H-09 | Windows-on-Arm Audition proves plug-in architecture bridging | Requirements concern the host application only. [C-001] [C-014] | **FALSIFIED**; native ARM/x64 fixture matrix |
| H-10 | Git-compatible XML proves collaboration safety | Adobe documents text/version-control use, not semantic merge, media locking, or conflict resolution. [C-006] [C-038] | **FALSIFIED**; concurrent-edit/merge fixture |
| H-11 | Vendor accessibility listing implies full conformance | 25.2 ACRs explicitly disclose Partial/Does Not Support criteria. [C-031] | **FALSIFIED**; repeat against 26.3 with platform AT matrix |
| H-12 | Current export exchange is lossless | FCP XML exclusions and OMF warnings are explicit. [C-025] | **FALSIFIED**; golden-session round trip by feature |

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current scope is Audition 26.3/26.0 on Windows 11 and macOS 14; 26.0 added native Windows-on-Arm and current requirements name Snapdragon X | 26.3/26.0 | S-001, S-002 | Current dated Adobe pages | Requirements are support statements, not benchmarks |
| C-002 | DOCUMENTED | High | Adobe positions Audition around multitrack, waveform, spectral editing/restoration, video, podcast, and finishing workflows | Current family | S-003, S-014 | Vendor product/help descriptions | Marketing, not independent market evidence |
| C-003 | DOCUMENTED | High | Multitrack is a realtime nondestructive linear mix environment; `.sesx` stores source paths and mix settings | Current help | S-004 | Direct conceptual-model passage | Page not independently runtime-tested |
| C-004 | DOCUMENTED | High | Waveform `Apply` changes audio data; Multitrack effects/clip edits are nondestructive and source editing can be explicitly opened | Current help | S-005, S-006, S-026 | Direct contrast across editor docs | Save/undo crash semantics separate |
| C-005 | DOCUMENTED | High | Clips support reference versus unique copies, trims, overlap order, splits, loops, slip and ripple edits | Current help | S-006 | Direct clip operations | Dedicated comping/folders not established |
| C-006 | DOCUMENTED | High | `.sesx` is XML with no audio payload, stores media locations/envelopes/effects, and can be text-edited or version-controlled | Current help | S-029 | Direct session description | Semantic merge/portability not guaranteed |
| C-007 | DOCUMENTED | High | Audition uses ASIO/MME on Windows and CoreAudio on macOS with configurable sample rate and I/O buffer/latency | Current help | S-001, S-025 | Driver and preferences sections | Exact callback/thread architecture unknown |
| C-008 | DOCUMENTED | High | Sessions use one sample rate/bit depth, recommend 32-bit work, and docs cover 6–192 kHz playback/recording and up to 32-channel media | Current help | S-029, S-030 | Direct limits and recommendations | Not internal mix-precision proof |
| C-009 | DOCUMENTED | High | Up to 16 effects may be used per clip/track/bus; Multitrack is nondestructive, supports pre-render and routing position; stretch has realtime/rendered modes | Current help | S-008, S-026, S-028 | Direct effects/stretch controls | No complete PDC/render-equivalence contract |
| C-010 | UNKNOWN | High impact | Engine process/thread/scheduler model, complete PDC, tails, oversampling, determinism, and dropout policy are not publicly established | 26.3 engine | S-004, S-008, S-025, S-035 | Current docs and bounded historical check | Needs engineering disclosure or controlled fixtures |
| C-011 | DOCUMENTED | High/medium | Current Adobe help names VST3 and VST effects on both desktop platforms and Audio Units on macOS | Current help; 26.3 applicability not version-stamped | S-007 | Direct Adobe statement | Page updated 2021; no independent 26.3 probe |
| C-012 | INFERENCE | Medium | “Legacy VST” probably means VST2 | Current help terminology | S-007, S-033, S-035 | Separate VST3 versus legacy-VST folder language; VST2 is the plausible legacy generation | Adobe never says VST2; alternative is generic older VST handling |
| C-013 | DOCUMENTED | High | Plug-in Manager scans, rescans, enables/disables, marks `Not Working`, reloads, and accepts custom legacy-VST folders but not VST3 folders | Current help | S-007 | Direct UI procedure | Cache/isolation/logs not documented |
| C-014 | UNKNOWN | High impact | Scanner/runtime process isolation, sandbox, crash containment, bridging, signing, and quarantine internals are not established | Current host | S-001, S-007 | Explicit documentary gap; no binary probe | Host ARM support is not plug-in bridging evidence |
| C-015 | DOCUMENTED | High | Effect/rack presets, copy/paste, bypass, wet/dry, session-saved racks, and effect automation are visible host behaviors | Current help | S-010, S-026 | Direct rack and automation docs | Exact third-party state schema unknown |
| C-016 | DOCUMENTED | Medium-high | Effect channel mapping can request mono/stereo/5.1/custom input layouts; output follows input and cannot be independently changed | Current help | S-030 | Direct effect-channelization passage | May not describe all plug-in-reported bus layouts |
| C-017 | UNKNOWN | High impact | Full buses/events, sidechains, parameter identity/timing, latency/tails, state, missing-plugin, UI, render, and migration contracts are undocumented | Current host | S-007-S-010, S-026, S-030 | Positive effects hosting is narrower than full contract | Requires conformance fixtures |
| C-018 | DOCUMENTED | High | Tracks route to buses/Mix/hardware; buses may feed buses; tracks have up to 16 sends; Mix is terminal | Current help | S-009 | Direct routing sections | Feedback/cycle handling unknown |
| C-019 | DOCUMENTED + UNKNOWN boundary | High | Clip/track effect envelopes and Off/Read/Write/Latch/Touch automation are documented; plug-in callback sample accuracy is not | Current help | S-010 | Keyframe and thinning descriptions | Timeline precision does not prove callback timing |
| C-020 | DOCUMENTED | High | Multitrack writes recorded clips directly to WAV and supports multitrack overdub, monitoring, punch, punch-and-roll, timed recording, and layered takes | Current help | S-011 | Direct recording page | Crash salvage and swipe comping unknown |
| C-021 | DOCUMENTED | High | Audition imports broad audio/video formats, up to 32-channel WAV/AIFF, and uses BWF/iXML metadata | Current help | S-012, S-029, S-030 | Current format/media pages | Codec/platform availability can vary |
| C-022 | DOCUMENTED | High | Waveform spectral display is FFT-configurable and supports time/frequency analysis and artifact-focused selection/editing | Current help | S-014, S-015 | Direct spectral/analysis pages | DSP quality not independently evaluated |
| C-023 | DOCUMENTED | High | FaderPort V1 and HUI provide control-surface integration; MIDI I/O selection supports that control path | Current help | S-013 | Direct controller page | Does not prove musical MIDI sequencing |
| C-024 | UNKNOWN | High | Musical MIDI sequencing, notation, instruments, MPE, MIDI 2.0, events, and broad remote APIs were not established | Current 26.3 scope | S-003, S-007, S-013, S-029 | Current help/navigation and exact-term review negative | Absence from retained pages is not proof of no support |
| C-025 | DOCUMENTED | High | Save/export supports `.sesx`, Save All, archives, OMF, lossy FCP XML, stems/bounces, and mono/stereo/5.1 mixdowns | Current help | S-016 | Direct save/export sections | Round-trip fidelity not dynamically tested |
| C-026 | DOCUMENTED | High | Premiere/Audition exchange uses shared XML and referenced media, retains tracks or exports stems/mixdowns, and supports edit-original linkage | Current help | S-018, S-029 | Direct workflow docs | Unsupported Premiere content can render/offline |
| C-027 | DOCUMENTED | High | History states disappear on file close; preferences/effect settings/workspaces can be exported/imported separately | Current help | S-017, S-027 | Direct history/settings pages | Not crash recovery or project history |
| C-028 | UNKNOWN | High impact | Autosave, journals, atomicity, retention, recording recovery, corruption handling, migration, and missing-dependency guarantees are undocumented | Current scope | S-004, S-011, S-016, S-017, S-027 | Recovery-focused review found save operations, not guarantees | Controlled crash/storage-fault fixtures needed |
| C-029 | DOCUMENTED | High | CEP panels use HTML5/JavaScript and ExtendScript; Adobe supplies CEP resources and ZXP tooling | Current help/platform repo | S-020, S-021 | Direct Adobe help/repository | Audition-specific CEP version/API not pinned |
| C-030 | UNKNOWN | High impact | CEP isolation, permissions, signing enforcement, network policy, realtime safety, and migration are not established | Audition 26.3 | S-020, S-021 | Platform tooling is not an Audition security contract | Needs manifest/docs and controlled extension fixture |
| C-031 | DOCUMENTED | High for 25.2 | Separate 2025 macOS/Windows ACRs for Audition 25.2 disclose tested methods and Partial/Does Not Support accessibility criteria | 25.2, not 26.3 | S-023, S-024 | Direct Adobe ACRs prepared by Deque | Later fixes/regressions unknown |
| C-032 | DOCUMENTED | High | Creative Cloud supports previous-major-version installation and removes prior versions by default unless retention is configured | Current Creative Cloud operations | S-022 | Direct Adobe update/rollback instructions | Does not guarantee old builds remain forever |
| C-033 | DOCUMENTED | Medium-high | Current Audition is offered through a Creative Cloud annual-paid-monthly/subscription entitlement requiring activation validation | Current commercial boundary | S-001, S-003 | Product offer plus requirements note | Regional/enterprise terms and exact price not pinned |
| C-034 | DOCUMENTED | High | Steinberg says VST3 SDK is MIT; VST2 headers cannot be redistributed and binary distribution requires a pre-Oct-2018 VST2 agreement | Format-owner licensing | S-033 | Official FAQ | Not legal advice or Adobe license evidence |
| C-035 | DOCUMENTED | High | Audition supports 5.1 editing, monitoring, panning, sends, and mixdowns | Current help | S-016, S-019 | Direct 5.1/export pages | No immersive/object-audio claim |
| C-036 | DOCUMENTED | High | Match Loudness supports multi-file scan, true-peak limiting, and named broadcast standards/targets | Current help | S-031 | Direct Adobe page | Not independent standards certification |
| C-037 | DOCUMENTED | High | 26.3 removes CD authoring/layout/marker/frame features, retains extraction, and migrates old marker/layout content for export | 26.3 | S-032 | Dated retirement guidance | Runtime migration not independently tested |
| C-038 | UNKNOWN | Medium-high | Cloud collaboration, semantic merge, media locking, permissions, and conflict resolution are not established | Current project model | S-006, S-016, S-029 | Git mention is only text-file compatibility | Needs collaboration product/docs or fixtures |
| C-039 | DOCUMENTED + UNKNOWN boundary | Medium | Adobe says tracks/clips are limited by storage and processing resources; measured scaling limits are unknown | Current help | S-004, S-008 | Vendor functional statement | No benchmark or deterministic ceiling |
| C-040 | INFERENCE | Medium-high | The dual editor, reference/unique clips, explicit archive, and loss-reporting exchange are transferable clean-room patterns | Architecture synthesis | S-004-S-006, S-016 | Derived from documented user-visible behavior | Not evidence of Adobe internal implementation |
| C-041 | UNKNOWN + INFERENCE boundary | High | Adobe's generic AU and legacy-VST terms do not resolve AUv2/AUv3 or VST2; VST2 is only a bounded inference | Current plug-in matrix | S-007, S-034, S-035 | Format-owner distinction and negative terminology check | Dynamic signed fixtures needed |
| C-042 | UNKNOWN | Medium-high | No current evidence was found for AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, or Rack Extension hosting | Current plug-in matrix | S-007, S-035 | Current plug-in page and bounded manual review | Omission is not a negative support guarantee |
| C-043 | INFERENCE | Medium | Adobe's statement that third-party effects apply like built-ins implies compatible effects can use ordinary rack contexts and exposed rack automation/preset/session behaviors | Current effects host | S-007, S-008, S-010, S-026 | Combines generic third-party and generic rack documentation | No format-by-context or serialization contract; incompatible plug-ins may differ |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Adobe/format-owner pages are primary
evidence for what they document; none is an independent product test.

- **S-001 — “Audition System requirements,” Adobe.**
  https://helpx.adobe.com/audition/desktop/introduction/system-requirements.html
  — current support matrix, updated 2026-06-17; scope 26.3/26.0. Relevant
  sections: Windows/macOS processor, OS, memory, audio, activation. Supports
  C-001, C-007, C-014, C-033. Limitation: requirements, not behavior. Selected
  because it pins release and platform scope.
- **S-002 — “What's new in Adobe Audition,” Adobe.**
  https://helpx.adobe.com/audition/desktop/introduction/whats-new.html — dated
  release summary, updated 2026-06-17. Passage: 26.3 June release; 26.0 native
  Windows ARM. Supports C-001. Limitation: sparse feature detail. Preferred to
  secondary release summaries.
- **S-003 — “Adobe Audition,” Adobe product page.**
  https://www.adobe.com/products/audition.html — current product/offer page.
  Supports C-002, C-024, C-033. Limitation: marketing text and dynamically
  rendered price token. Selected for current vendor positioning/entitlement.
- **S-004 — “Multitrack Editor overview,” Adobe.**
  https://helpx.adobe.com/audition/desktop/mixing-multitrack-sessions/multitrack-editor-overview.html
  — current help, updated 2026-06-17. Passages: realtime nondestructive mixing,
  resource-bounded tracks/clips, reference sessions, mixer. Supports C-003,
  C-010, C-039. Selected as the primary conceptual-model source.
- **S-005 — “Applying effects in the Waveform Editor,” Adobe.**
  https://helpx.adobe.com/audition/desktop/applying-effects/applying-effects-waveform-editor.html
  — current help, updated 2021-04-27. Passages: up to 16 slots, preview versus
  `Apply`, offline process effects. Supports C-004. Limitation: old update date.
  Selected for explicit destructive semantics.
- **S-006 — “Arrange and edit multitrack clips with Audition,” Adobe.**
  https://helpx.adobe.com/audition/desktop/mixing-multitrack-sessions/arranging-editing-multitrack-clips.html
  — current help, updated 2021-12-16. Passages: reference/unique copies,
  nondestructive trim, overlap, ripple, slip/split. Supports C-004-C-006,
  C-038, C-040. Selected for the clip/source ownership boundary.
- **S-007 — “Adding third party plugins,” Adobe.**
  https://helpx.adobe.com/audition/desktop/applying-effects/adding-third-party-plug-ins.html
  — current help, updated 2021-04-27. Passages: VST3/VST/AU support and Audio
  Plug-in Manager. Supports C-011-C-014, C-017, C-024, C-041-C-043.
  Limitation: no release stamp or deep host contract. Selected as the decisive
  current format/scanner source.
- **S-008 — “Applying effects in the Multitrack Editor,” Adobe.**
  https://helpx.adobe.com/audition/desktop/applying-effects/applying-effects-multitrack-editor.html
  — current help, updated 2021-04-27. Passages: 16 clip/track/bus effects,
  nondestructive processing, pre-render, pre/post placement. Supports C-009,
  C-010, C-017, C-039, C-043. Selected for visible processing topology.
- **S-009 — “Multitrack routing and EQ controls,” Adobe.**
  https://helpx.adobe.com/audition/desktop/mixing-multitrack-sessions/multitrack-routing-eq-controls.html
  — current help, updated 2021-04-27. Passages: buses, bus chaining, 16 sends,
  Mix track, hardware outputs. Supports C-017, C-018. Selected as the densest
  routing source.
- **S-010 — “Automating mixes with envelopes,” Adobe.**
  https://helpx.adobe.com/audition/desktop/mixing-multitrack-sessions/automating-mixes-envelopes1.html
  — current help, updated 2021-12-16. Passages: clip/track effect automation,
  modes, keyframes, thinning. Supports C-015, C-017, C-019, C-043. Limitation: no
  callback timing. Selected to prevent overclaiming sample accuracy.
- **S-011 — “Recording audio,” Adobe.**
  https://helpx.adobe.com/audition/desktop/importing-recording-and-playing/recording-audio.html
  — current help, updated 2026-06-17. Passages: direct WAV recording, multitrack
  arm/monitor, punch, takes, punch-and-roll, timed mode. Supports C-020, C-028.
  Selected for current recording behavior.
- **S-012 — “Supported import formats,” Adobe.**
  https://helpx.adobe.com/audition/desktop/importing-recording-and-playing/supported-file-formats.html
  — current help, updated 2021-12-16. Supports C-021. Limitation: codec and old
  QuickTime wording may be platform-dependent. Selected over format roundups.
- **S-013 — “Control surface support,” Adobe.**
  https://helpx.adobe.com/audition/desktop/workspace-and-setup/control-surface-support.html
  — current help, updated 2024-07-15. Supports C-023, C-024. Relevant passages:
  FaderPort V1, MIDI I/O, HUI, and FaderPort 8 exclusion. Selected to separate
  controller MIDI from sequencing.
- **S-014 — “Displaying audio in the Waveform Editor,” Adobe.**
  https://helpx.adobe.com/audition/desktop/editing-audio-files/displaying-audio-waveform-editor.html
  — current help, updated 2021-04-27. Passages: spectral display, FFT window and
  resolution, artifact removal. Supports C-002, C-022. Selected for spectral
  model evidence.
- **S-015 — “Analyze phase, frequency, and amplitude with Audition,” Adobe.**
  https://helpx.adobe.com/audition/desktop/editing-audio-files/analyzing-phase-frequency-amplitude.html
  — current help, updated 2021-12-20. Supports C-022. Selected for FFT/frequency,
  phase, and amplitude analysis boundaries; not a quality benchmark.
- **S-016 — “Save and export audio files,” Adobe.**
  https://helpx.adobe.com/audition/desktop/saving-and-exporting/saving-exporting-files1.html
  — current help, updated 2026-06-17. Passages: `.sesx`, Save All, OMF/FCP XML,
  archive, mixdowns, formats. Supports C-025, C-028, C-035, C-038, C-040.
  Selected as the primary persistence/interchange source.
- **S-017 — “Customizing and saving application settings,” Adobe.**
  https://helpx.adobe.com/audition/desktop/workspace-and-setup/customizing-saving-application-settings.html
  — current help, updated 2021-04-27. Passages: temp/peak files and settings
  export/import. Supports C-027, C-028. Limitation: settings backup is not
  project recovery. Selected to preserve that distinction.
- **S-018 — “Working with video applications,” Adobe.**
  https://helpx.adobe.com/audition/desktop/video-and-surround-sound/video-applications.html
  — current help, updated 2026-03-27. Passages: Premiere XML, references,
  tracks/stems/mixdown, edit-original. Supports C-026. Selected for current
  Adobe-to-Adobe interchange.
- **S-019 — “5.1 surround sound,” Adobe.**
  https://helpx.adobe.com/audition/desktop/video-and-surround-sound/5-1-surround-sound.html
  — current help, updated 2021-12-20. Supports C-035. Relevant sections:
  hardware mapping, Waveform edit, panner, 5.1 sends. Selected for channel scope.
- **S-020 — “Enabling CEP extensions,” Adobe.**
  https://helpx.adobe.com/audition/desktop/applying-effects/enabling-cep-extensions.html
  — current help, updated 2024-07-05. Passages: HTML5/JavaScript, ExtendScript,
  Creative Cloud/Exchange installation, SDK links. Supports C-029, C-030.
  Selected as the Audition-specific extension source.
- **S-021 — “CEP Resources,” Adobe-CEP GitHub repository.**
  https://github.com/Adobe-CEP/CEP-Resources — official public platform
  repository. Sections: CEP SDK resources, JS libraries, ZXP packaging/signing
  tools. Supports C-029, C-030. Limitation: platform-wide and branch-current,
  not an Audition 26.3 API/security guarantee. Selected to trace help links to
  their primary developer origin.
- **S-022 — “Install previous versions of Creative Cloud apps,” Adobe.**
  https://helpx.adobe.com/download-install/apps/download-install-apps/creative-cloud-apps/install-previous-versions-creative-cloud-apps.html
  — updated 2026-06-16. Supports C-032. Relevant passages: Other versions,
  previous major versions, default removal, retention setting. Selected for
  rollback/update operations.
- **S-023 — “Adobe Audition CC (macOS) Accessibility Conformance Report,”
  Adobe/Deque.**
  https://www.adobe.com/accessibility/compliance/adobe-audition-2025-acr-macos-acr.html
  — ACR based on VPAT 2.5; Audition 25.2, report 2025-08-08, evaluation July
  2025. Supports C-031. Limitation: not 26.3 and vendor-published. Selected as
  the platform/version-specific primary conformance disclosure.
- **S-024 — “Adobe Audition CC (Windows) Accessibility Conformance Report,”
  Adobe/Deque.**
  https://www.adobe.com/accessibility/compliance/adobe-audition-2025-acr-windows-acr.html
  — same scope/date for Windows. Supports C-031. Limitation: not 26.3; includes
  platform-specific defects. Selected rather than assuming macOS parity.
- **S-025 — “Connecting to audio hardware in Audition,” Adobe.**
  https://helpx.adobe.com/audition/desktop/workspace-and-setup/connecting-audio-hardware.html
  — current help, updated 2021-04-27. Supports C-007, C-010. Passages:
  ASIO/MME/CoreAudio, hardware clock/rate/buffer, dropout tradeoff. Selected for
  the host/device boundary.
- **S-026 — “Effects controls,” Adobe.**
  https://helpx.adobe.com/audition/desktop/applying-effects/effects-controls.html
  — current help, updated 2026-04-13. Supports C-004, C-009, C-015, C-017,
  C-042, C-043. Relevant sections: rack behavior, session-saved racks,
  presets/bypass.
  Selected because it is recent and unifies native/host UI behavior.
- **S-027 — “Undo, redo, and history,” Adobe.**
  https://helpx.adobe.com/audition/desktop/editing-audio-files/undo-redo-history.html
  — current help, updated 2021-04-27. Supports C-027, C-028. Passage: history
  states disappear when a file closes. Selected for durability boundaries.
- **S-028 — “Multitrack clip stretching,” Adobe.**
  https://helpx.adobe.com/audition/desktop/mixing-multitrack-sessions/multitrack-clip-stretching.html
  — current help, updated 2021-04-27. Supports C-009. Selected for explicit
  realtime/rendered processing modes; no DSP-quality claim is inferred.
- **S-029 — “Create, open, or import files,” Adobe.**
  https://helpx.adobe.com/audition/desktop/importing-recording-and-playing/creating-opening-files.html
  — current help, updated 2026-06-17. Passages: XML `.sesx`, Git/Perforce,
  rate/depth, 32 channels, BWF, Premiere import. Supports C-006, C-008, C-021,
  C-024, C-026, C-038. Selected for current session/media definition.
- **S-030 — “Multichannel audio workflow,” Adobe.**
  https://helpx.adobe.com/audition/desktop/importing-recording-and-playing/multichannel-audio-workflow.html
  — current help, updated 2024-04-10. Passages: 32 channels, channel splitting/
  mapping, effect layouts. Supports C-008, C-016, C-017, C-021. Selected for
  host-visible channelization.
- **S-031 — “Matching loudness across multiple audio files,” Adobe.**
  https://helpx.adobe.com/audition/desktop/editing-audio-files/match-loudness.html
  — current help, updated 2024-07-15. Supports C-036. Limitation: listed targets
  are not certification evidence. Selected for delivery workflow depth.
- **S-032 — “Removal of CD Authoring,” Adobe.**
  https://helpx.adobe.com/audition/desktop/introduction/removal-of-cd-authoring.html
  — updated 2026-06-17; explicitly applies from 26.3. Supports C-037. Selected
  as a dated migration/deprecation case.
- **S-033 — “Licensing,” VST 3 Developer Portal, Steinberg.**
  https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html —
  official format-owner FAQ. Supports C-012, C-034. Relevant sections: MIT VST3
  SDK and specific VST2 redistribution/binary rules. Limitation: not Adobe's
  license and not legal advice. Preferred over commentary.
- **S-034 — “Audio Unit Programming Guide — Introduction,” Apple Documentation
  Archive.**
  https://developer.apple.com/library/archive/documentation/MusicAudio/Conceptual/AudioUnitProgrammingGuide/Introduction/Introduction.html
  — Apple guide updated 2014-07-15. Supports C-041 by explicitly distinguishing
  AUv2 from AUv3. Limitation: historical and not an Audition support statement.
  Selected only to prevent conflating generic `Audio Units` with both versions.
- **S-035 — “Adobe Audition reference” PDF, Adobe.**
  https://helpx.adobe.com/pdf/audition_reference.pdf — official historical PDF;
  local copy metadata includes 2019 modification events. The canonical URL now
  redirects to desktop help; the retained local copy was readable only through
  the document viewer because local `pdftotext` was unavailable. Supports the
  negative/legacy boundary in C-010, C-012, C-041, C-042; no current material
  claim depends on it. Selected as the likeliest historical terminology source,
  then not retried after it failed to resolve current behavior.

**Adaptive bibliography rationale.** The retained set is overwhelmingly current
Adobe help, supplemented only by Adobe's developer/accessibility material and
the VST/AU format owners. Secondary reviews, forum posts, search snippets, and
download sites were excluded because they could not prove current host behavior.
Older help pages were retained where they remain the canonical pages in the
current 26.3 help tree, with their update-date limitation explicit.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods, blocker, impact, available evidence | Safest next probe | Required access/fixture; owner |
| --- | --- | --- | --- |
| Exact VST2 support | Current Adobe page uses “VST”/“legacy VST”; historical PDF and format-owner terminology did not supply a current Adobe `VST2` statement. Affects legal/compatibility planning. [C-012] [C-041] | Scan signed no-op VST2 and VST3 effects, inspect manager labels and instantiate/render | Disposable Windows/macOS VMs; licensed fixtures; unassigned |
| AUv2 versus AUv3 | Adobe says only Audio Units; Apple distinguishes versions. Affects macOS architecture and extension model. [C-041] | Scan signed AUv2 component and AUv3 extension fixtures, save/reopen/render | Disposable macOS VM and signed fixtures; unassigned |
| Scanner/cache lifecycle | Manager UX is documented; paths, cache, duplicate IDs, timeouts, crash policy, and logs are not. [C-013] [C-014] | Differential add/update/remove/duplicate/crash scan with filesystem/process/log trace | Disposable VMs and controlled plug-ins; unassigned |
| Runtime isolation and bridging | No process or architecture contract; host ARM support is insufficient. Security/reliability impact is high. [C-014] | Process-tree, crash, hang, memory, x64/ARM, Intel/Apple-silicon fixture matrix | Disposable machines; signed fixtures; unassigned |
| Complete processing contract | Effects/channelization are documented but events, aux/sidechain, dynamic I/O, precision, latency/tails and offline flags are not. [C-016] [C-017] | Instrumented VST3/AU fixtures with buses, events, changing latency, tails, silence, offline and dynamic I/O | Test-plug-in suite; loopback; unassigned |
| Parameter/state/recall | Envelopes/presets/session-saved racks exist; stable IDs, timing, chunks, assets, missing placeholders, and migration are unknown. [C-015] [C-017] | Golden project: automate, save, remove/update/rename plug-in, reload and binary/XML-diff without exposing proprietary code | Versioned fixtures and project corpus; unassigned |
| PDC/render equivalence | Pre-render exists but complete PDC/tails/determinism are undocumented. [C-009] [C-010] | Impulse and long-tail graph across clip/track/bus/Mix, realtime/pre-render/bounce/export | Loopback/reference signals; unassigned |
| Autosave/crash/storage durability | Save All/archive/history/settings docs do not state autosave, atomicity, journals, retention, corruption recovery, or recording salvage. [C-027] [C-028] | Kill/power-loss/disk-full tests during edit, save and recording; inspect only owned fixture files | Disposable VM/filesystem snapshot; unassigned |
| `.sesx` compatibility and merge | XML/text/Git use is documented, but schema/version/semantic merge guarantees are absent. [C-006] [C-038] | Golden-project open/save across supported major versions plus controlled concurrent edits | Authorized retained versions; fixture repo; unassigned |
| CEP security/stability | HTML/JS/ExtendScript and ZXP tooling are documented; host version, permissions, signing enforcement, isolation, network policy, and migration are not. [C-029] [C-030] | Obtain current Audition SDK/manifest docs, then run a minimal signed panel with permission/process tracing | Adobe developer access; disposable VM; unassigned |
| MIDI/instrument model | Controller MIDI is documented, but musical events/instruments/notation/MPE/MIDI 2.0 are not. [C-023] [C-024] | Current in-app capability inventory, then MIDI/VST3 instrument fixture if a path exists | Disposable VM, controller and instrument fixture; unassigned |
| Current accessibility | Detailed ACR evidence is for 25.2, not 26.3. [C-031] | Repeat named ACR problem flows under platform screen reader, keyboard-only, zoom and high-contrast setups | Accessibility lab and 26.3; unassigned |
| Collaboration/cloud | No current native multi-user contract was found. `.sesx` Git compatibility is insufficient. [C-038] | Product-doc inquiry before any runtime test; if a service exists, test conflict/offline/privacy boundaries | Vendor docs/account only if authorized; unassigned |

## 24. Curiosity pass and stop decision

Scores are 1 (low/favorable cost) to 5 (high); `cost` is burden, so a thread
qualifies only when decision relevance + expected value + novelty materially
outweigh cost and the method remains in scope.

| Rank | Candidate thread | Relevance | Expected value | Novelty | Cost | Decision |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Resolve “legacy VST” to VST2 and identify architecture rules | 5 | 4 | 3 | 2 | **Pursued.** Current Adobe page, format-owner terminology, and historical PDF still did not produce an explicit current Adobe `VST2` statement. Result remains `INFERENCE/UNKNOWN`; dynamic signed fixtures are discriminating. [C-012] [C-041] |
| 2 | Recover proprietary runtime process/thread topology | 5 | 3 | 5 | 5 | `CURIOSITY_NO_GO`: public documentation saturated; reverse engineering and unsafe crashes are outside this wave. [C-010] [C-014] |
| 3 | Continue broad autosave/recovery searching | 5 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: repeated pages describe save/archive/settings, not guarantees; controlled fault tests now dominate. [C-028] |
| 4 | Exhaustively enumerate every native effect/preset | 1 | 1 | 1 | 4 | `CURIOSITY_NO_GO`: inventory will not change architecture selection. |
| 5 | Reconstruct full Cool Edit/Audition history | 1 | 1 | 2 | 3 | `CURIOSITY_NO_GO`: historical continuity cannot prove current internals. |
| 6 | Gather market-share/user anecdotes | 1 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: secondary popularity evidence does not answer the decision. |

**Gaps and contradictions after final synthesis.** The only terminology tension
is Adobe's simultaneous use of `VST3`, `VST`, and `legacy VST`; it suggests but
does not state VST2. Generic Audio Units conflicts with any attempt to assign an
AU generation. “Unlimited” tracks is explicitly resource-qualified, so it is
not a fixed or measured ceiling. ACRs are detailed but one major version behind.
No source contradicts the destructive/nondestructive editor split or reference-
based `.sesx` model. [C-003] [C-012] [C-031] [C-039] [C-041]

**Stop decision: STOP — sufficient coverage and documentary saturation.** All
25 headings and every required plug-in row are complete; current primary sources
cover every decision dimension or leave an explicit probe-ready unknown. Search
was intermittently rate-limited and direct Adobe fetches sometimes timed out,
but canonical pages were recovered through redirects/direct retrieval. The
highest-value curiosity thread did not resolve explicit VST2 support. Additional
broad searching now has nonpositive marginal evidence; remaining questions need
current ACR refreshes, vendor engineering disclosure, or controlled disposable
fixtures rather than more documentary inference.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** This dossier was created;
  pre-existing unrelated workspace changes were left untouched.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See §0 and C-001/C-033.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and
  subsections 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-001–C-043; §21 supplies classifications.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  §§21–23.
- [x] **Every required plugin-format row is present.** See §11.1; no cell is
  blank.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Discovery, isolation, processing, state, UI, diagnostics, and probes are in
  §§11.2–11.6 and §23.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  VST2/AU ambiguity, marketing limits, accessibility scope, and engine gaps are
  explicitly qualified.
- [x] **Licensing and clean-room boundaries are explicit.** See §16 and C-034.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19
  and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Documentary retrieval only; no installers or product
  binaries were run.

**Checks performed:** heading/order scan; required-format matrix scan; claim-ID
and source-ID cross-reference; `DOCUMENTED`/`INFERENCE`/`UNKNOWN` boundary review;
cutoff/version review; URL/source-rationale review; ownership and `git status`
review. **Unresolved blockers:** current runtime/isolation and recovery internals,
full plug-in conformance, explicit VST2/AUv2/AUv3 mapping, 26.3 accessibility,
and collaboration. **Pre-existing workspace changes:** unrelated modified and
untracked files elsewhere in the repository were observed and left untouched.
