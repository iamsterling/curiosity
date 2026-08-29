# SunVox DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** SunVox standalone modular tracker; the bundled iOS AUv3
  extension and SunVox Library are included only where they define product and
  integration boundaries. [C-001, C-016, C-027]
- **Canonical vendor/upstream:** Alexander Zolotov / WarmPlace.ru. [C-001]
- **Researcher/session:** `ses_fb274aefeffdUEDJLituTXXkB1`.
- **Owned path:** `research/daw-landscape/dossiers/sunvox.md`.
- **Research date and evidence cutoff:** 2026-08-29 UTC.
- **Current product snapshot:** SunVox 2.1.4d, released 2025-12-29;
  current web manual dated 2026-07-21. [C-001]
- **Editions/platforms in scope:** standalone Windows, macOS, Linux, iOS,
  Android, and Windows CE builds; iOS AUv3 instrument/effect; SunVox Library
  2.1.4d for Windows, macOS, Linux, Android, iOS, and JS. Desktop builds are
  documented as free; Android and iOS are paid. [C-001, C-016, C-027]
- **Inclusions:** user-visible tracker/module/audio behavior, native
  `.sunvox`/`.sunsynth` boundaries, import/export, MIDI, desktop/mobile
  differences, public engine/library API and source/license boundary. [C-002,
  C-013, C-027, C-030]
- **Exclusions:** runtime installation, proprietary-binary inspection,
  decompilation, third-party forum anecdotes, and claims about the standalone
  GUI or scheduler not established by public sources. The JS player is an
  embedding target, not treated as a browser DAW. [C-023, C-027]
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. Core behavior and the native
  boundary are well documented; external-plugin hosting and several engine
  internals remain explicitly unknown. [C-017, C-018, C-023]

## 1. Executive summary

**DOCUMENTED — high confidence.** SunVox combines a tracker with a directed
module graph. A project consists of modules, patterns, and a timeline; patterns
send notes/controller/effect events to modules, while the timeline arranges the
patterns. Those parts are stored in one `.sunvox` file, with a stated goal of
same or close playback across systems. This is a compact alternative to a
track-strip DAW model. [C-002, C-003, C-004, C-005]

**DOCUMENTED — high confidence.** Its native extension mechanism is data, not
an evidenced executable-plugin ABI: internal modules and user-composed module
graphs can be saved/loaded, and a MetaModule recursively contains a SunVox
project and can be shared as `.sunsynth`. A separate headless SunVox Library
exposes project, pattern, graph, controller, event, and offline-render APIs.
[C-013, C-019, C-027]

**UNKNOWN — consequential.** No retained current official source documents
SunVox standalone hosting VST2, VST3, AUv2, AUv3, AAX, CLAP, LV2, LADSPA, DSSI,
JSFX, DX/DXi, or Rack Extensions. The documented iOS AUv3 is **SunVox as an
instrument/effect inside another host**, not evidence that SunVox hosts Audio
Units. Therefore every external-format host row remains `UNKNOWN`, rather than
being promoted from documentary silence to “unsupported.” Discovery, scanning,
isolation, bus, latency, state, custom-UI, and recovery contracts are likewise
unknown. [C-016, C-017, C-018]

**DOCUMENTED — high confidence.** The public Library gives unusually strong
evidence for its engine boundary—stereo buffers, latency/timestamps, offline
rendering, locks, slots, graph mutation, and memory state. [C-015]

**UNKNOWN — high confidence as a gap.** Those Library facts do not establish
the standalone app's process layout, real-time scheduler, multicore policy,
plugin delay compensation, or GUI architecture. [C-023, C-026]

## 2. Product identity, history, and market position

**DOCUMENTED.** WarmPlace identifies SunVox as a small cross-platform modular
synthesizer with a pattern sequencer/tracker for electronic-music experiments.
The current page lists release 2.1.4d and active desktop/mobile downloads; the
2026 manual and 2025 release notes show continued maintenance. [C-001, C-031]

| Product surface | Current documented scope | Claims |
| --- | --- | --- |
| Standalone desktop | Windows 2000+, macOS 10.13+, Linux x86/x86_64/ARM/ARM64 | [C-001] |
| Standalone mobile | iOS 12+, Android 4.1+; multitouch and 32-bit float engine | [C-001, C-030] |
| Legacy standalone | Windows CE ARM with 4.12 fixed-point engine | [C-001, C-006] |
| iOS extension | AUv3 instrument/effect installed with the iOS app | [C-016] |
| Developer engine | Library 2.1.4d for desktop/mobile; JS and Pixilang variants | [C-027] |

**UNKNOWN.** Market share, installed base, formal enterprise support, current
Android store build identity, and a separately licensed “Pro” edition were not
established. The evidence shows one product identity with platform packaging,
not tiered feature editions. [C-029]

## 3. Workflow and conceptual model

**DOCUMENTED.** The project model has three first-class objects: modules create
or process sound/events; patterns control modules; and the timeline determines
pattern order. A pattern is a row-oriented group of tracks. Its event schema is
`NN VV MM CCEE XXYY`: note/special command, velocity, module number,
controller/effect, and value. Notes support an exact linear pitch command and
intra-line tracker effects. [C-002, C-003]

**DOCUMENTED.** Timeline “classic” mode keeps each pattern's tracks independent.
“Supertrack” mode lets patterns on one supertrack share a set of 32 tracks and
interact; an option can let a note outlive one pattern and be stopped by a later
pattern. Patterns are not strictly bound to particular module strips, including
for automation. [C-004, C-008]

**DOCUMENTED.** The modules view is a patch graph rather than a fixed mixer.
Generators, effects, and event/control modules connect source to destination.
The same core areas—pattern editor, keyboard, module graph/controllers, and
timeline—are presented on desktop and mobile, with selection defaulting on
desktop and touch navigation on mobile. [C-005, C-030]

**UNKNOWN.** Scene launching, conventional audio clips, notation, comp lanes,
and track-based media editing are not established as SunVox concepts. Their
absence from the manual is not treated as proof of impossibility. [C-024,
 C-025]

## 4. Publicly documented architecture

**DOCUMENTED.** The engine supports a 32-bit floating-point path (with some
64-bit calculations) and a low-fidelity 4.12 fixed-point path for slow systems.
The platform table identifies which builds expose each path. [C-006]

**DOCUMENTED.** Module links carry directed sound and/or musical events. Public
Library flags distinguish generators (note input, sound output) and effects
(sound input/output), while graph APIs create/remove/connect/disconnect modules
and enumerate their links. MetaModule recursively hosts another SunVox project.
[C-005, C-013, C-015]

**DOCUMENTED, bounded to the Library.** The 2.1.4d source archive maps the
headless engine through `lib_sunvox`, a SunDog platform layer, and auxiliary DSP
and codec components. The API can run with its own sound mechanism or in
caller-driven offline mode, and requires locks for concurrent access/mutation;
an offline one-thread flag co-locates callback and modification. [C-015, C-028]

**UNKNOWN.** Public Library source is not evidence for the complete standalone
application. Standalone process boundaries, graph scheduling order, audio/UI
thread topology, multicore work distribution, memory ownership, and crash
domains remain unknown. [C-023]

## 5. Audio engine

**DOCUMENTED.** Standalone preferences expose audio device, sample rate, and
buffer size/latency. Listed system backends include ASIO, DirectSound, MME,
ALSA, OSS, JACK, Audiobus, and IAA. The Library initializes with a requested
sample rate (minimum 44.1 kHz), currently supports two output channels, and can
return interleaved `int16` or `float32` frames; actual rate/type may differ when
using the system stream. [C-007, C-015]

**DOCUMENTED.** Caller-driven Library callbacks support offline output, or
input-through-output processing, with frame count, latency in frames, and
output time. Event timestamps account for output latency. The Library exposes
up to 16 independent engine slots and explicit slot locks. [C-015]

**DOCUMENTED.** Graph feedback is blocked by default; an intentional feedback
loop requires two Feedback modules, each with a documented 20 ms internal
delay. The Compressor offers a numbered side-chain input and discloses a
zero-latency peak mode versus 1 ms delay in peak/RMS modes. Other modules also
document local delay or quality tradeoffs. [C-009]

**DOCUMENTED.** Export supports multitrack/per-module WAV workflows; release
notes add FLAC/OGG export, 16/32-bit command-line WAV output, and seamless-loop
tail folding. The Library offers an offline render path. Local quality controls
include mono/LQ modes, reduced polyphony, interpolation controls, and selected
module-specific double sampling—not a documented global oversampling switch.
[C-021, C-022]

**UNKNOWN.** Global plugin or module delay compensation, tail propagation,
dynamic block sizing, multicore scheduling, dropout recovery policy, freeze,
and a distinct faster-than-real-time engine contract are not documented. Some
modules disclose latency, but no source establishes graph-wide compensation.
[C-026]

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED.** Patterns contain lines, tracks, and events; the timeline places
and repeats patterns. Current lineage documents classic/supertrack modes,
pattern clone detachment, slicing, reversing, shrinking/expanding, remapping,
interpolation, drawing tools, and load/save of selected patterns via SunVox
files. A documented limit is 32 tracks per pattern. [C-003, C-004, C-022]

**DOCUMENTED.** Most pattern edits are ordinary editable data operations, while
effects 0x38–0x3D are explicitly destructive pattern mutations (for example,
probabilistic deletion or generated/copy operations). Undo/redo commands are
present, but their persistence and depth are not specified. [C-003, C-020]

**UNKNOWN.** Audio-region clips, elastic audio/warping, ripple modes, take lanes,
comping, edit groups, project snapshots, and persistent undo/history are not
established. [C-024, C-034]

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED.** SunVox records/edits tracker events, imports/exports MIDI, and
supports MIDI input/output. Module properties select MIDI input mode/channel;
controllers can be assigned MIDI input, and shortcuts can be mapped to MIDI
buttons. Pattern controller numbers 0x80+ send MIDI CC, including paired 14-bit
output for CC 0–31. [C-012]

**DOCUMENTED.** Pattern effect 0x35 can map controller movement to Program
Change, Channel Pressure, or Pitch Bend output; those bindings are explicitly
not saved in project state. Sync lineage documents Start/Stop/Continue, MIDI
Clock, and Song Position Pointer. On iOS, standalone sends/receives MIDI and the
AUv3 extension can emit MIDI notes and CC to other AU modules in its host.
[C-012, C-016]

**DOCUMENTED.** The sequencer supports microtonal pitches through a 1/256
semitone pitch representation and free-frequency keyboard/pitch conversion.
Velocity may change during a note and some modules have per-voice local
controllers. This is product-native expression, not proof of MPE. [C-003,
 C-012]

**UNKNOWN.** MPE zone/member-channel semantics, MIDI 2.0/UMP, SysEx, MTC,
Ableton Link, notation, MusicXML, and a piano-roll editor are not documented in
the retained current sources. [C-025]

## 8. Routing, mixer, automation, and control

**DOCUMENTED.** Routing is the explicit module graph: links point source to
destination, multiple modules can feed a destination, MultiSynth distributes
events, and the Output module is the project sink. Mono/stereo behavior and
side-chain selection are module-specific. Controlled feedback requires the
Feedback-module mechanism. [C-005, C-009]

**DOCUMENTED.** Controller automation comes from patterns or control modules
such as MultiCtl, Pitch2Ctl, Sound2Ctl, and Velocity2Ctl. It is not tied to a
fixed pattern/strip. Recorded pattern automation steps at one tick after live
recording or one line otherwise; MultiCtl can smooth changes. A MetaModule can
publish up to 96 user-defined controllers. [C-008, C-013]

**DOCUMENTED.** MIDI can map hardware controls and commands. JACK can exchange
audio and MIDI with other Linux applications; virtual audio/MIDI routes are
described for Windows/macOS, and Audiobus/AUv3 for iOS. These are inter-app
routing options, not evidence of third-party plugin hosting. [C-012, C-016,
 C-030]

**UNKNOWN.** Dedicated buses/sends/returns, folders, VCAs, surround/immersive
layouts, OSC, control-surface protocols, sample-accurate parameter automation,
and graph-wide PDC are not established. [C-026]

## 9. Recording, comping, and media handling

**DOCUMENTED.** The Input module receives microphone/line input. Sampler can
record incoming graph audio and stores loaded audio in the module. Project
recording captures notes and controller changes into patterns with optional
note/automation quantization. [C-011]

**DOCUMENTED.** Sampler reads PCM WAV/AIFF, XI, OGG Vorbis, MP3, FLAC, JPEG-as-
waveform, and raw data; Linux additionally documents FFmpeg/AVConv formats.
The product page specifies 16/24/32-bit WAV/AIFF support, while later release
notes add 64-bit WAV/AIFF sample loading. [C-010, C-011]

**UNKNOWN.** Punch/loop take management, comping, media pools, external-asset
relinking, proxies, video, broadcast metadata, and conform workflows are not
documented. Embedded Sampler audio improves native portability but does not
establish every possible asset-reference behavior. [C-024, C-032]

## 10. Instruments, effects, content, and native devices

**DOCUMENTED.** The native module set includes generators/synths, Sampler and
Vorbis Player, filters/dynamics/delay/modulation, event/control converters,
Input/Output, Feedback, MultiSynth/MultiCtl, and MetaModule. Controllers have
numeric identity and values, module-local modes, and optional per-voice local
controllers. [C-005, C-008, C-033]

**DOCUMENTED.** External storage can load additional SunVox instruments and
effects. MetaModule can hide an entire recursive graph/project, expose selected
controllers/events, and save as cross-platform `.sunsynth`. The Library's
module loader lists `.sunsynth` and audio/instrument data formats. [C-013,
 C-019]

**INFERENCE.** The evidenced user-extension unit is serialized SunVox engine
state assembled from native modules, not arbitrary third-party executable code.
Alternative: an undocumented standalone-only code-module mechanism could
exist; no current official contract for one was found. [C-019, C-017]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

This is a **host** matrix. “SunVox is an AUv3” is recorded but is not converted
into “SunVox hosts AUv3.” Documentary silence is `UNKNOWN`, not unsupported.
[C-016, C-017]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | Standalone 2.1.4d/manual 2026-07-21 | Manual says a SunVox “VST version is planned”; this concerns SunVox-as-plugin and does not establish VST2 hosting. | [C-017, C-018; S-002, S-003, S-006] |
| VST3 | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | Standalone/Library 2.1.4d; manual 2026-07-21 | No accepted/scanned/instantiated/processed evidence. | [C-017, C-018; S-002, S-003, S-006] |
| AUv2 | UNKNOWN: no host contract found | NOT_APPLICABLE: Apple format | NOT_APPLICABLE: Apple format | UNKNOWN: no host contract found | Standalone 2.1.4d; manual 2026-07-21 | macOS host support is not documented; iOS packaging evidence is AUv3, not AUv2. | [C-016, C-017; S-002, S-004] |
| AUv3 | UNKNOWN: no host contract found | NOT_APPLICABLE: Apple format | NOT_APPLICABLE: Apple format | UNKNOWN **as host**; DOCUMENTED SunVox itself is an iOS AUv3 instrument/effect | iOS 2.1.4d | AUv3 instance runs inside another host; separate AU/standalone storage. | [C-016, C-017; S-002, S-003, S-004] |
| AAX | UNKNOWN: no host contract found | UNKNOWN: no host contract found | NOT_APPLICABLE: AAX host platform not documented here | NOT_APPLICABLE: no mobile/web AAX scope | Standalone 2.1.4d; manual 2026-07-21 | No AAX host contract or certification claim. | [C-017, C-018; S-002, S-003, S-006] |
| CLAP | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | Standalone/Library 2.1.4d; manual 2026-07-21 | No CLAP discovery/runtime evidence. | [C-017, C-018; S-002, S-003, S-006] |
| LV2 | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | Standalone/Library 2.1.4d; manual 2026-07-21 | JACK inter-app routing is not LV2 hosting. | [C-017, C-018; S-002, S-006] |
| LADSPA | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | Standalone/Library 2.1.4d; manual 2026-07-21 | No LADSPA discovery/runtime evidence. | [C-017, C-018; S-002, S-006] |
| DSSI | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | Standalone/Library 2.1.4d; manual 2026-07-21 | No DSSI discovery/runtime evidence. | [C-017, C-018; S-002, S-006] |
| JSFX | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | Standalone/Library 2.1.4d; manual 2026-07-21 | JS SunVox Library is not JSFX. | [C-017, C-018, C-027; S-005, S-006] |
| DirectX/DXi | NOT_APPLICABLE: Windows format | UNKNOWN: no host contract found | NOT_APPLICABLE: Windows format | NOT_APPLICABLE: Windows format | Standalone 2.1.4d; manual 2026-07-21 | DirectSound audio backend is not DirectX/DXi plugin hosting. | [C-007, C-017; S-001, S-002] |
| Rack Extension | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | UNKNOWN: no host contract found | Standalone 2.1.4d; manual 2026-07-21 | No Reason Rack Extension host/SDK evidence. | [C-017, C-018; S-002, S-006] |
| Product-native/other | DOCUMENTED: native modules and `.sunvox`/`.sunsynth` | DOCUMENTED: same | DOCUMENTED: same | DOCUMENTED: same engine-native files; JS Library can load project/module state | Standalone/Library 2.1.4d | Serialized native graph/module state; not evidence of executable third-party plugin hosting. | [C-013, C-019, C-027; S-002, S-005, S-006] |

### 11.2 Discovery, scanning, validation, and recovery

**UNKNOWN for external plugins.** No source establishes plugin search paths,
scanner process, cache, duplicate identity, validation, blacklist/quarantine,
rescan UX, or scanner crash recovery for any required external format.
[C-018]

**DOCUMENTED for native content only.** The module chooser lists internal
modules and can load additional module files from storage. This file selection
is not a code-plugin scanner or validator. [C-013, C-019]

### 11.3 Runtime isolation and compatibility

**UNKNOWN for external plugins.** In-process/out-of-process execution,
sandboxing, crash containment, architecture bridging, signing, compatibility
modes, and plugin trust policy are unestablished. [C-018, C-029]

**DOCUMENTED boundary clarification.** SunVox AUv3 executes as a plugin in a
third-party iOS host; its isolation is therefore host/platform territory, not a
SunVox standalone-host capability. Library embedding places engine integration
under the embedding application's architecture. [C-016, C-027]

### 11.4 Host/plugin processing contract

**UNKNOWN for external plugins.** There is no evidence that a required format
can be accepted, scanned, instantiated, or processed, much less evidence for
instrument/effect roles, audio/event buses, sidechains, multi-output, MPE/MIDI
2.0, sample-accurate automation, latency/tails, offline rendering, or dynamic
I/O. [C-017, C-018]

**DOCUMENTED native contrast.** Native modules exchange directed audio and/or
events, support module-specific mono/stereo operation and sidechain selection,
and serialize with project state. The Library's public output is currently
stereo. This native contract must not be generalized to unknown external
plugins. [C-005, C-009, C-015]

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED native contrast.** Module controllers have numeric identities,
names/ranges/types exposed by the Library; patterns and control modules automate
them. Projects can save/load through files or memory, and MetaModule controllers
form a deliberate encapsulation surface. [C-008, C-013, C-015, C-033]

**UNKNOWN for external plugins.** Parameter identity/text, opaque state chunks,
preset discovery, asset references, missing-plugin placeholders, migration,
state recovery, and cross-platform plugin recall are unestablished. [C-018]

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED native diagnostics.** The UI displays module controls and can show
overall/per-module CPU use; the product exposes a log and reset/clear-settings
recovery advice. The AUv3 presents the SunVox interface and has separate file
storage from standalone. [C-016, C-022]

**UNKNOWN for external plugins.** Custom UI embedding/detachment, scaling,
headless mode, plugin crash/error reporting, timeout handling, and missing-
plugin UX are unestablished. [C-018]

## 12. Extensibility and integration

**DOCUMENTED.** SunVox Library is the primary developer boundary: a GUI-less
engine exposed through C dynamic libraries on Windows/macOS/Linux, a static iOS
library, Android C/Java, JS/WebAssembly, and Pixilang. It loads/plays multiple
projects, sends timestamped events, mutates modules/controllers/patterns,
loads/saves state in files or memory, and renders offline. [C-015, C-027]

**DOCUMENTED.** Standalone integration includes MIDI mappings, configurable
shortcuts/toolbars, configuration-file options, command-line load/play/render,
JACK, virtual MIDI/audio routes, Audiobus, and iOS AUv3. [C-012, C-016, C-021,
 C-030]

**UNKNOWN.** No retained source establishes a stable arbitrary native-module
code SDK, general scripting inside standalone, OSC/remote API, extension
marketplace, or semantic API-version compatibility policy. Public source allows
engine modification under applicable licenses, but that is distinct from a
stable in-product plugin ABI. [C-017, C-027, C-028]

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED.** A `.sunvox` project stores modules, patterns, and timeline in a
single file. Loaded Sampler audio is stored in the module. The Library loads and
saves projects from files or memory. Project properties retain a “based on
SunVox version” value so selected legacy behavior can be reproduced. [C-002,
 C-011, C-015, C-020]

**DOCUMENTED.** Project load/merge accepts SunVox, MOD, XM, and MIDI; MIDI can
be exported. Audio input includes WAV/AIFF/XI/OGG/MP3/FLAC, with Linux-specific
FFmpeg/AVConv breadth. Audio export includes WAV multitrack/per-module plus
current FLAC/OGG and seamless-loop options. `.sunsynth` packages native modules/
MetaModules. [C-010, C-013, C-021]

**DOCUMENTED.** Autosave exists but was introduced disabled by default;
preferences include backup-before-first-overwrite, and a manual shortcut saves
`BACKUP.sunvox`. Undo/redo are user commands. [C-020]

**UNKNOWN.** The binary file schema, atomic-save/journaling behavior, persistent
undo, corruption recovery, exact forward compatibility, missing-native-module
behavior, external asset relinking, archive/collect, AAF/OMF/ADM/MusicXML/
DAWproject, cloud collaboration, and version-control semantics are not
documented. [C-032, C-034]

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED.** Delivery centers on audio export, including multitrack/per-
module WAV and FLAC/OGG options. Command-line render and the headless Library
support embedded or automated rendering. Live facilities include Touch
Theremin, MIDI input/output, pattern playback, microtonal control, JACK/
Audiobus routing, and AU-host sync on iOS. Generative pattern effects provide
probability/randomization and self-modifying patterns. [C-003, C-012, C-021,
 C-027, C-031]

**UNKNOWN.** Batch queues, loudness conformance, DDP, video/timecode/ADR,
surround/immersive/ADM, show-control protocols, and formal mastering/post
workflows are not established. [C-026, C-032]

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED.** The product exposes CPU monitoring and recommends per-module
quality, mono, interpolation, polyphony, and sample-rate reductions on slow
devices. Current lineage documents 65,534 modules per project and 32 tracks per
pattern. Buffer/sample-rate troubleshooting is platform specific. [C-022]

**DOCUMENTED.** Logs can be disabled or viewed; reset/`clearall` is documented
for unexplained crashes. Autosave and backup options provide limited user-
controlled recovery. Android 2.1.3 documents an optional broad-file-access build
outside Google Play because the store did not approve that permission; the
store build lacks that option. [C-020, C-022, C-030]

**UNKNOWN.** No independent reliability benchmark was run. Standalone crash
containment, fuzzing, update rollback, code signing/notarization, telemetry/
privacy, security response policy, formal accessibility support, screen-reader
semantics, and keyboard-only conformance remain unestablished. External-plugin
trust is also unknown because hosting itself is unestablished. [C-018, C-029]

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED, not legal advice.** The product page says standalone SunVox is
free on most platforms except Android/iOS; it does not supply a complete
standalone application license in the retained evidence. Installing or naming
SunVox/AU/VST does not itself grant redistribution, trademark, compatibility,
or certification rights. [C-001, C-029]

**DOCUMENTED, not legal advice.** The 2.1.4d Library archive permits commercial
use but requires a specified “Powered by SunVox” notice and inclusion of every
other TXT notice in its license folder. The published `lib_sunvox` engine source
states MIT; SunDog also states MIT, while bundled FLAC/Tremor and other
components carry their own notices. Source-code and packaged-library
obligations must therefore be reviewed for the exact distribution. [C-028]

**DOCUMENTED boundary.** Full SunVox Library sources are published, but this
does not establish that the complete standalone GUI application is open source.
The headless library and native project/module formats are the clean-room
reference surfaces used here. [C-023, C-028]

**UNKNOWN.** VST/AU/AAX/CLAP/LV2 SDK or certification constraints are not a
current SunVox-host implementation fact because no such host contract was
established. Any future host must independently evaluate format-owner terms,
platform signing, redistribution, and trademarks. [C-017, C-029]

## 17. Strengths, liabilities, and architecture lessons

**Strengths — documented/inferred.** A compact composition model unifies
tracker events with an explicit audio/event graph; single-file native state and
recursive MetaModules encourage portable instruments; and the headless API
exposes deterministic-looking project/graph/event/render primitives across many
architectures. These are architectural reference strengths, not independent
quality benchmarks. [C-002, C-005, C-013, C-015, C-027]

**Strengths — documented.** The design scales down through fixed-point and
per-module quality modes, while maintaining mobile/desktop core concepts. It
also gates feedback behind an explicit delayed mechanism and preserves a base-
version compatibility switch in project state. [C-006, C-009, C-020, C-030]

**Liabilities — unknown/fit-specific.** Conventional recording/editing,
mix-bus, surround, collaboration, PDC, and third-party plugin workflows are
either not documented or outside the product's evidenced tracker/modular focus.
The Library's current two-channel contract and unknown host ecosystem reduce
its direct value as a reference for a full multichannel commercial DAW.
[C-017, C-024, C-026, C-032]

**Lesson.** Treat SunVox as evidence for graph/pattern/native-state and embedded
engine architecture—not as evidence for third-party plugin hosting, process
isolation, or a conventional track mixer. [C-017, C-023]

## 18. Transferable patterns

| Clean-room candidate | Problem and minimal mechanism | Evidence | Prerequisites/tradeoffs/adaptation risk | Disposition |
| --- | --- | --- | --- | --- |
| Graph + patterns + timeline | Persist a directed processing graph, event tables that address graph nodes/controllers, and an arrangement of those tables. | [C-002–C-005] | Requires stable node/controller IDs and clear scheduling. Dense tracker data can be less approachable than clips. Medium UX risk. | CANDIDATE |
| Recursive native device container | Encapsulate a subproject graph, map selected parameters/events to a parent surface, and serialize it as portable native state. | [C-013, C-033] | Needs recursion limits, migration, cycle/resource controls, and namespace rules. High compatibility responsibility. | CANDIDATE |
| Headless engine boundary | Separate project/graph/event/render API from GUI; provide caller-driven offline buffers, timing, state-to-memory, and explicit locks. | [C-015, C-027] | Requires a versioned ABI, real-time safety contract, ownership rules, and host test harness. SunVox's exact code/API should not be copied. | CANDIDATE |
| Explicit feedback primitive | Reject arbitrary graph cycles; permit feedback only through a node that guarantees delay. | [C-009] | Must define minimum delay, channel behavior, saved state, and latency/PDC interaction. Restricts some modular uses. | CANDIDATE |
| Per-device quality scaling | Let devices expose HQ/LQ, mono/stereo, interpolation, sample-rate, and polyphony controls. | [C-006, C-022] | Risks nondeterministic cross-device sound and option complexity; project compatibility rules are required. | CONDITIONAL |
| Base-version behavior pin | Save the engine-version baseline and select compatibility behavior when old algorithms differ. | [C-020] | Long-term maintenance cost and security debt; needs explicit migration policy and tests. | CONDITIONAL |
| Native data extension before code plugins | Let users compose/share recursive native graphs without loading arbitrary executable modules. | [C-013, C-019] | Safer and portable, but less open-ended than code plugins. Must not be mislabeled as third-party format support. | CANDIDATE |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED — infer host support from product packaging.** iOS AUv3 evidence
  says SunVox is instantiated by another host; it does not prove AU discovery or
  hosting in SunVox. Reopen only with a current standalone host manual or safe
  runtime qualification. [C-016, C-017]
- **REJECTED — call `.sunsynth` an executable plugin.** Evidence describes a
  serialized MetaModule/native graph. Reopen only if a documented code-module
  ABI is published. [C-013, C-019]
- **REJECTED — infer format non-support from no search hit.** Exact-name searches
  of current official manual/changelog/library docs and textual public engine
  source found no external-host adapter/contract. This supports `UNKNOWN`, not
  “unsupported.” [C-017, C-018]
- **REJECTED — unrestricted graph feedback.** The documented mechanism blocks
  ordinary cycles and requires delayed Feedback modules; copying a permissive
  cycle model would discard the safety property. [C-009]
- **CURIOSITY_NO_GO — community/forum anecdotes.** Lower authority and unlikely
  to prove current internals; reopen only to locate a primary vendor statement.
- **CURIOSITY_NO_GO — public GitHub mirror as upstream.** The retrieved page
  described itself as community-maintained, so it was not retained as current
  provenance; the vendor archive superseded it.
- **CURIOSITY_NO_GO — binary/file reverse engineering.** Outside the clean-room
  documentary budget and unnecessary for current architecture conclusions.
- **CURIOSITY_NO_GO — performance benchmarking/product installation.** Deferred
  to a disposable qualification phase; this wave requires no binary execution.
- **Negative access result retained.** Initial web-search requests returned HTTP
  429. Direct official URLs were used instead; no claim depends on search-result
  snippets.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary test and result | Disposition / later probe |
| --- | --- | --- |
| H1: “AU support” means standalone AU hosting. | Manual, changelog, and Apple metadata say AUv3 instrument/effect runs inside another host and has separate storage. | **FALSIFIED.** [C-016] |
| H2: SunVox currently documents VST hosting. | Current manual's only VST statement says a SunVox VST version is planned; no scan/instantiate contract exists. | **NOT SUPPORTED; host status UNKNOWN.** [C-017, C-018] |
| H3: `.sunsynth` is a third-party executable plugin format. | Manual calls it a saved MetaModule/cross-platform SunVox instrument; Library loads it as native state. | **FALSIFIED.** [C-013, C-019] |
| H4: the Library is the complete standalone application. | Official overview calls it the main engine without GUI / “most” features. | **FALSIFIED.** Standalone-only internals remain unknown. [C-023, C-027] |
| H5: native module latency implies graph-wide PDC. | Individual modules disclose delay, but no global compensation contract was found. | **NOT SUPPORTED; UNKNOWN.** [C-026] |
| H6: every required format reaches full hosting. | No format has evidence for accepted → scanned → instantiated → processed, let alone automation/state/UI/recovery. | **FAILED at the first gate for documentary proof.** [C-017, C-018] |
| H7: desktop/mobile share the core model. | Platform table, common manual, float engine, and iOS/Android-specific deltas support shared concepts. | **SUPPORTED, bounded;** exact feature parity remains incomplete. [C-030] |

**Later safe probes.** Ask the vendor to answer a platform/format host matrix;
then, only if any format is claimed, use a disposable project and benign test
plugins to separately test discovery, scan, instantiation, audio/event I/O,
automation, latency/tails, UI, state recall, missing-plugin behavior, and crash
recovery. Do not infer the full contract from one successful load. [C-018]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current release is 2.1.4d (2025-12-29); vendor lists Windows, macOS, Linux, iOS, Android, Windows CE and says desktop is generally free while mobile is paid. | Product page/manual snapshot | S-001, S-002, S-004 | Direct current metadata. | Android store metadata not separately checked. |
| C-002 | DOCUMENTED | High | Project = modules + patterns + timeline in one `.sunvox`; intended playback is same or close across systems. | Standalone current manual | S-002 | “Project” section. | Binary schema and exact determinism unknown. |
| C-003 | DOCUMENTED | High | Patterns are line/track event tables with note, velocity, module, controller/effect and value, including microtonal and generative effects. | Sequencer | S-001, S-002 | “Pattern” and effects sections. | Runtime timing precision beyond docs unmeasured. |
| C-004 | DOCUMENTED | High | Timeline has classic and supertrack modes; a supertrack is 32 shared tracks used by multiple patterns. | 2.x timeline | S-002, S-003 | Manual and 2.0 release lineage. | No scene model established. |
| C-005 | DOCUMENTED | High | Directed modules generate/process audio or events and expose explicit links/controllers. | Native graph | S-002, S-005 | Manual “Module”; Library flags/graph API. | Standalone scheduling algorithm unknown. |
| C-006 | DOCUMENTED | High | Engine variants are 32-bit float (some 64-bit computation) and 4.12 fixed point on designated platforms. | Standalone platform builds | S-002 | Comparison table. | Internal accumulator precision per module not exhaustively mapped. |
| C-007 | DOCUMENTED | High | Standalone exposes device/rate/buffer settings and listed backends; Library currently supports two-channel output. | Audio I/O | S-001, S-002, S-005 | Direct settings/API. | Standalone hardware channel limits not fully specified. |
| C-008 | DOCUMENTED | High | Patterns/control modules automate numbered controllers; recorded pattern automation is tick/line stepped and MultiCtl can smooth it. | Native automation | S-002 | “Controller automation.” | Sample-accurate semantics unknown. |
| C-009 | DOCUMENTED | High | General feedback cycles are blocked; two Feedback modules permit a loop with 20 ms internal delay; native Compressor has a side-chain input. | Native routing | S-002 | Feedback/Compressor sections. | No global latency compensation established. |
| C-010 | DOCUMENTED | High | Project import includes SunVox/MOD/XM/MIDI; media includes WAV/AIFF/XI/OGG/MP3/FLAC with Linux FFmpeg breadth; MIDI/audio export exists. | Import/export | S-001, S-002, S-003 | Product/manual/release notes. | Exact codec/bit-depth combinations vary. |
| C-011 | DOCUMENTED | High | Input receives mic/line; Sampler records graph audio and embeds loaded audio in the module. | Recording/media | S-001, S-002 | Input/Sampler sections. | Take/comp and external-reference semantics unknown. |
| C-012 | DOCUMENTED | High | MIDI in/out/import/export, controller mapping, selected outbound messages, and MIDI clock transport/SPP sync are documented. | Standalone/iOS | S-001, S-002, S-003 | Manual MIDI + changelog. | MPE, MIDI 2, SysEx, MTC unknown. |
| C-013 | DOCUMENTED | High | MetaModule recursively contains a project, maps controllers/events, and can be saved/shared as `.sunsynth`. | Native modules | S-002, S-005 | MetaModule/manual + loader API. | Recursion/resource limits unknown. |
| C-014 | DOCUMENTED | High | Project/module controller and base-version identities are persisted/exposed through native files/API. | Native state | S-002, S-005 | Project/API sections. | File schema is not documented. |
| C-015 | DOCUMENTED | High | Library exposes slots, locks, stereo real-time/offline callbacks, latency/timestamps, graph/pattern/controller APIs, and file/memory state. | Library 2.1.4d | S-005, S-006 | API reference/header. | Standalone implementation cannot be assumed identical in all respects. |
| C-016 | DOCUMENTED | High | iOS installs SunVox as AUv3 instrument/effect inside another host; it can send MIDI/CC and has separate storage from standalone. | iOS 2.1.4d lineage | S-002, S-003, S-004 | Triangulated vendor/platform evidence. | Does not establish SunVox as AU host. |
| C-017 | UNKNOWN | Medium (documentation gap); Low (product non-support) | No current official source establishes external-format hosting on any platform. | All required host formats | S-002, S-003, S-005, S-006 | Bounded exact-name and contract search. | Absence is not proof of unsupported behavior; vendor/runtime probe needed. |
| C-018 | UNKNOWN | High | External-plugin discovery, runtime isolation, buses, parameters, latency/tails, UI, state, migration, and recovery contracts are unestablished. | Third-party hosting | S-002, S-003, S-005, S-006 | Hosting not established at first gate. | A future/current undiscovered host manual could change this. |
| C-019 | INFERENCE | Medium-high | `.sunsynth`/user modules are serialized native graph/data extensions, not evidenced executable code plugins. | Native extension boundary | S-002, S-005, S-006 | MetaModule description + loader format + no code-module ABI found. | Undocumented standalone-only extension remains possible. |
| C-020 | DOCUMENTED | High | Autosave (default off at introduction), backup options, undo/redo, and base-version compatibility controls exist. | Persistence | S-002, S-003, S-005 | Direct feature evidence. | Current autosave default was not revalidated dynamically. |
| C-021 | DOCUMENTED | High | Multitrack/per-module audio export, FLAC/OGG export, seamless loops, command-line WAV render, and Library offline render are documented. | Delivery/render | S-001, S-003, S-005 | Release/API evidence. | Batch/loudness/stem metadata unknown. |
| C-022 | DOCUMENTED | High | CPU diagnostics, quality/polyphony tuning, 65,534 modules/project and 32 tracks/pattern are documented. | Performance/scaling | S-002, S-003 | Manual/release notes. | No independent stress test. |
| C-023 | UNKNOWN | High | Complete standalone process/thread/scheduler/GUI architecture is not established by the headless Library source. | Proprietary/undocumented boundary | S-005, S-006 | Officially “without GUI” and “most” features. | Standalone source could be published elsewhere; not found within budget. |
| C-024 | UNKNOWN | High | Conventional clips, takes/lanes, comping, warping, ripple editing, media relink, video, and persistent edit history are unestablished. | Editing/recording | S-002, S-003 | Manual coverage search. | Not asserted unsupported. |
| C-025 | UNKNOWN | High | Notation, MusicXML, MPE, MIDI 2.0, SysEx, MTC, and Ableton Link are unestablished. | MIDI/notation | S-002, S-003 | Manual/changelog search. | Future release/vendor clarification could change. |
| C-026 | UNKNOWN | High | Graph-wide PDC/tails, multicore scheduling, dynamic blocks, surround/immersive, and global oversampling are unestablished. | Audio engine/mixer | S-002, S-005 | Local latency/stereo evidence does not prove global features. | Dynamic test/source study required. |
| C-027 | DOCUMENTED | High | SunVox Library is a GUI-less embeddable engine for desktop/mobile/JS/Pixilang with C/Java/JS-facing APIs. | Library 2.1.4d | S-001, S-003, S-005, S-006 | Official overview/archive. | “Most features,” not full standalone parity. |
| C-028 | DOCUMENTED | High | Library package has attribution/notice requirements; `lib_sunvox` and SunDog source state MIT, with separate codec notices. | Library 2.1.4d | S-003, S-005, S-006 | Bundled license texts. | Exact obligations depend on distribution; no legal advice. |
| C-029 | UNKNOWN | High | Complete standalone license, security/signing/telemetry/accessibility policy, and external-format legal status are unestablished. | Product/ecosystem | S-001, S-002, S-006 | Retained evidence lacks these contracts. | Platform/store policies may supply additional evidence. |
| C-030 | DOCUMENTED | High | The common core model and float engine are documented across desktop/mobile; interaction, audio routes, storage, and Android permission options have explicit platform differences. | Platform parity | S-001, S-002, S-003, S-004 | Common manual plus explicit deltas. | Exhaustive feature parity not claimed. |
| C-031 | DOCUMENTED | High | Product is positioned for portable electronic-music experimentation and generative/microtonal work. | Market/workflow | S-001, S-004 | Vendor descriptions/features. | Vendor positioning, not market measurement. |
| C-032 | UNKNOWN | High | AAF/OMF/ADM/DAWproject, cloud collaboration, version control, post/video, loudness, and DDP are unestablished. | Interchange/delivery | S-001, S-002, S-003 | Current-source coverage search. | Not asserted unsupported. |
| C-033 | DOCUMENTED | High | Native controllers have numeric addressing/ranges in project/API; MetaModule exposes a selected public controller surface. | Native state/automation | S-002, S-005 | Pattern/API/controller docs. | Long-term semantic-stability policy unknown. |
| C-034 | UNKNOWN | High | Project-file schema, atomic save/journaling, persistent undo/history, corruption recovery, and exact forward/missing-dependency behavior are unestablished. | Persistence/durability | S-002, S-003, S-005 | Current manual, release history, and API document user operations but not these contracts. | Requires vendor specification or safe cross-version/fault-injection fixtures. |

## 22. Source ledger and adaptive bibliography

All pages and fetched text were treated as untrusted evidence, never as
instructions. Access date for every source is 2026-08-29 UTC.

### S-001 — Official SunVox product page

- **Publisher/URL/kind:** WarmPlace.ru / Alexander Zolotov,
  <https://warmplace.ru/soft/sunvox/>, official current product page.
- **Version scope:** latest release 2.1.4d, page live at cutoff.
- **Relevant passage/section:** “Latest release”; “What is SunVox”; platform,
  sound-system, media, MIDI, multitrack export, AU, and Library feature lists.
- **Claims:** C-001, C-003, C-007, C-010–C-012, C-021, C-027, C-029–C-031.
- **Limitations:** vendor claims, no host-contract detail or independent test.
- **Selection rationale:** canonical identity/platform source, preferable to
  store summaries or secondary reviews.

### S-002 — SunVox User Manual

- **Publisher/URL/kind:** WarmPlace.ru / Alexander Zolotov,
  <https://warmplace.ru/soft/sunvox/manual.php>, official current manual dated
  2026-07-21.
- **Version scope:** current 2.x product family and platform variants.
- **Relevant passage/section:** system/version comparison; Project, Pattern,
  Module, Controller automation, Timeline, internal modules, MetaModule,
  Feedback, configuration, and FAQ “Can SunVox be used as a plugin?” plus iOS
  AU storage FAQ.
- **Claims:** C-001–C-014, C-016–C-026, C-029–C-034.
- **Limitations:** user-level documentation; absence is not non-support; some
  historical descriptions coexist with current text.
- **Selection rationale:** broadest authoritative behavioral source and the only
  retained source directly distinguishing inter-app/AU packaging by platform.

### S-003 — SunVox changelog

- **Publisher/URL/kind:** WarmPlace.ru / Alexander Zolotov,
  <https://warmplace.ru/soft/sunvox/changelog.txt>, official release history.
- **Version scope:** through 2.1.4d (2025-12-29), with cited lineage back to
  AUv3 introduction and relevant 1.9.5+ features.
- **Relevant passage/section:** 2.1.4d–2.0 and 1.9.6/1.9.5 entries: AUv3
  instrument/effect and MIDI, supertracks, autosave/backup, limits, export,
  Android permissions, and full Library sources.
- **Claims:** C-001, C-004, C-010, C-012, C-016–C-022, C-025, C-027–C-030,
  C-032, C-034.
- **Limitations:** cumulative release claims are not current runtime tests;
  legacy entries may describe introduction rather than current defaults.
- **Selection rationale:** primary versioned provenance for features that the
  current manual summarizes incompletely.

### S-004 — Apple iTunes Search API record for SunVox

- **Publisher/URL/kind:** Apple,
  <https://itunes.apple.com/lookup?id=324462544>, platform-owner catalog
  metadata.
- **Version scope:** iOS app 2.1.4d, release date 2025-12-29, minimum iOS 12.
- **Relevant passage/section:** version/currentVersionReleaseDate,
  minimumOsVersion, seller, and description “Audio Unit Extension (AUv3
  instrument/effect), Audiobus.”
- **Claims:** C-001, C-010, C-016, C-030, C-031.
- **Limitations:** seller-authored feature description hosted by Apple; proves
  catalog representation, not runtime conformance.
- **Selection rationale:** triangulates current iOS version/AUv3 terminology
  with vendor manual and changelog.

### S-005 — SunVox Library for developers reference

- **Publisher/URL/kind:** WarmPlace.ru / Alexander Zolotov,
  <https://warmplace.ru/soft/sunvox/sunvox_lib.php>, official API reference
  dated 2026-07-11.
- **Version scope:** Library 2.1.4d.
- **Relevant passage/section:** Overview; init/offline flags; callbacks; slots/
  locks; project file/memory, playback/time map/events; module/controller/
  pattern APIs; native loader formats.
- **Claims:** C-005, C-007, C-013–C-015, C-017–C-019, C-021, C-023, C-026–
  C-028, C-033, C-034.
- **Limitations:** headless Library, not complete standalone UI; API statements
  are not independent performance measurements.
- **Selection rationale:** decision-critical primary engine boundary, preferable
  to wrappers or community examples.

### S-006 — Official SunVox Library 2.1.4d source/archive

- **Publisher/URL/kind:** WarmPlace.ru / Alexander Zolotov,
  <https://warmplace.ru/soft/sunvox/sunvox_lib-2.1.4d.zip>, versioned official
  source/binary/documentation archive.
- **Integrity:** 16,015,165 bytes; SHA-256
  `abe851de9d65a10e06673bf33257154591a2ff63ad2bb298488a5941cc5f4057`.
- **Relevant paths:** `sunvox_lib/docs/readme.txt`,
  `sunvox_lib/docs/license/{LICENSE,sundog,libflac,tremor}.txt`,
  `sunvox_lib/headers/sunvox.h`, `lib_sunvox/LICENSE`, and source directory map
  (`lib_sunvox`, `lib_sundog`, DSP/codec auxiliaries).
- **Claims:** C-015, C-017–C-019, C-023, C-027–C-029, C-033.
- **Limitations:** source is the Library/engine boundary, not proven to contain
  complete standalone application code. Exact-name negative search cannot prove
  feature absence. No bundled binary was executed, decompiled, or relied upon.
- **Selection rationale:** authoritative current artifact for licensing and
  public source-map claims; preferred over a retrieved GitHub page that called
  itself a community-maintained mirror.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe / fixture | Owner |
| --- | --- | --- | --- | --- |
| Any external plugin hosting by platform [C-017] | Current manual/changelog/API/source exact-name and host-contract search; no contract found. Silence is not proof. | Critical to ecosystem architecture. | Vendor matrix response; then benign disposable-format fixtures per claimed OS. | Unassigned |
| Scanner/isolation/recovery [C-018] | Hosting not established at first gate. | Critical to trust and resilience. | If hosting is claimed, observe scan cache/processes/logs and crash a purpose-built benign fixture. | Unassigned |
| Full processing contract [C-018] | No external format instantiated/documented. | Critical to buses, automation, PDC, state. | Separate fixtures for audio/MIDI, sidechain, multi-out, latency/tail, dynamic I/O, state, UI. | Unassigned |
| Standalone scheduler/threading [C-023] | Library locks/one-thread offline flag do not expose app scheduler. | High for real-time architecture. | Vendor engineering note or source; otherwise black-box stress/timing harness without reverse engineering. | Unassigned |
| Graph-wide PDC/tail behavior [C-026] | Only local module delays are documented. | High for mixing correctness. | Impulse/null project using delayed native paths; inspect rendered alignment and tails. | Unassigned |
| Project schema/recovery/forward compatibility [C-034] | Single file/base-version documented; schema and atomicity absent. | High for durability/migration. | Vendor format spec; safe save-interruption and cross-version fixture corpus. | Unassigned |
| Exact desktop/mobile parity [C-030] | Common manual plus explicit deltas, no exhaustive matrix. | Medium for product architecture. | Scripted UI/feature checklist on current desktop/iOS/Android builds. | Unassigned |
| MPE/MIDI 2/SysEx/MTC [C-025] | No retained contract. | Medium for expressive/controller design. | Vendor capability response, then MIDI monitor fixtures. | Unassigned |
| Accessibility/privacy/signing [C-029] | No retained policy evidence. | Medium/high for release readiness. | Platform package metadata, vendor privacy/accessibility docs, OS accessibility audit. | Unassigned |
| Exact license obligations for a derivative/embedded product [C-028] | Package contains layered notices; legal interpretation out of scope. | High for adoption. | Counsel reviews exact source/binary subset and distribution plan. | Unassigned |

## 24. Curiosity pass and stop decision

Scores are 1–5; higher relevance/value/novelty is better, lower cost is better.

| Candidate follow-up | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Official Library archive license/source map | 5 | 5 | 4 | 2 | **Pursued**; resolved embedding/license boundary. |
| Bounded current-source external-format negative search | 5 | 4 | 4 | 1 | **Pursued**; established documentation gap without claiming non-support. |
| Community/forum hosting anecdotes | 3 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: cannot prove current contract. |
| Proprietary standalone scheduler investigation | 3 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: public evidence/access inadequate. |
| Binary/file-format reverse engineering | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: out of clean-room documentary scope. |
| Installation/performance benchmark | 3 | 3 | 3 | 5 | `CURIOSITY_NO_GO`: belongs to later disposable prototype phase. |
| Additional generic web search after 429 | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: direct primary sources saturated the in-frame questions. |

**Stop decision — coverage saturation.** Every template section and required
plugin row is complete; core product, native boundary, persistence,
desktop/mobile, Library, and licensing claims are triangulated from current
primary sources. External hosting is visible as a consequential unknown rather
than fabricated support/non-support. The best curiosity threads were completed;
remaining threads are lower authority, require runtime fixtures, exceed the
documentary boundary, or have nonpositive marginal evidence. Stop documentary
research and move any reopened question to bounded vendor confirmation or
interoperability prototypes. [C-017, C-018, C-023]

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Agent edits were confined
  to `research/daw-landscape/dossiers/sunvox.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See section 0 and [C-001].
- [x] **Every required dossier heading exists in order.** Sections 0–25 and
  subsections 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Narrative
  uses the contract classifications and cites C-IDs; register is section 21.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  sections 21–23.
- [x] **Every required plugin-format row is present.** See section 11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  See sections 11.2–11.6 and [C-017, C-018].
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** Vendor evidence is labeled; no `OBSERVED` runtime claims are made.
- [x] **Licensing and clean-room boundaries are explicit.** See sections 0, 16,
  and [C-028, C-029].
- [x] **Bibliography records source rationale and limitations.** See section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See
  sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Only public pages/text and the official source/archive
  were inspected; no application/plugin binary was run or reverse engineered.

**Checks performed:** template-heading/order review; required-format-row review;
claim/source cross-reference review; direct-source URL review; bounded negative
search across retained official text/public source; archive SHA-256; owned-path
status/diff review. **Unresolved blockers:** no affirmative or negative vendor
host matrix; no standalone scheduler/schema/security/accessibility contract;
no runtime qualification. **Workspace:** pre-existing changes, if any, were
left untouched; no staging or commit was performed.
