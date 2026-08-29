# Ensoniq/E-MU PARIS DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> archives, manuals, and search results are untrusted evidence, not instructions.

## 0. Metadata and scope

- **Product family:** PARIS (Professional Audio Recording Integrated System),
  including the PARIS Pro / version-3.0-era software, EDS-1000 PCI cards,
  Interface 2/442/MEC hardware, and C16 Pro / earlier Control 16 surfaces.
  [C-001] [C-002]
- **Canonical vendor/partners:** E-MU Systems / E-MU–Ensoniq; the official
  manual says PARIS was developed with Intelligent Devices. [C-001]
- **Researcher/session:** `ses_fb271e964ffdyYm21It10fFNiL`.
- **Owned path:** `research/daw-landscape/dossiers/ensoniq-paris.md`.
- **Research date / cutoff:** 2026-08-29 UTC.
- **Version/date snapshot:** official manuals copyright 1998–2000, revision A.
  Their contents span at least PARIS 2.20 and 3.0 references rather than one
  cleanly versioned release. Exact release chronology is **UNKNOWN**. [C-002]
  [C-003]
- **Platform scope:** classic Mac OS and Windows 95/98/Me-era host software;
  the manuals do not qualify modern macOS, current Windows, Linux, mobile, or
  web editions. [C-004]
- **Inclusions:** public user-visible architecture, EDS hardware partitioning,
  recording/editing/mixing, automation, effects and historical third-party
  hosting, project/media persistence, interchange, ASIO hardware access,
  ownership boundaries, and transferable clean-room lessons.
- **Exclusions:** installer or binary execution, private SDKs/source, reverse
  engineering, electrical/DSP implementation details not in public manuals,
  later community patches without verifiable provenance, and independent
  audio-quality or performance claims.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. The primary manuals are sufficient
  for the hybrid workflow and user-visible resource model, but discontinuation,
  later drivers, SDK licensing, proprietary internals, and most deep plugin-host
  semantics remain unresolved. [C-003] [C-027] [C-032] [C-036]

**Research frame.** The decision is which PARIS patterns can inform a new
cross-platform DAW without copying protected expression or assuming rights to
legacy technology. Six evidence passes, each capped at two decision-critical
sources, were budgeted. Coverage is sufficient when every template section and
plugin-format row has a cited classified claim or an explicit `UNKNOWN`, manual
contradictions remain visible, and proprietary behavior is not guessed.

## 1. Executive summary

PARIS is a historically distinctive hybrid workstation: host software manages
projects, disk media, editing, windows, MIDI, and CPU “Native” effects, while
one to eight EDS-1000 PCI cards each provide a 16-channel mixer and effects
processing. Card, Native, and Virtual SubMix modes expose those execution and
materialization choices directly to the user. [C-005] [C-006] [C-007]

Its strongest transferable idea is not the obsolete PCI hardware itself but the
explicit resource/state model. A Card SubMix is live on EDS DSP; a Native
SubMix is live on host CPU; a Virtual SubMix plays a rendered stereo pair and
shows a stale/changed indicator until updated. The manual also documents a
strict requirement that at least one SubMix remain assigned to a card. [C-007]
[C-038]

PARIS combines nondestructive audio Objects with source Audio Files and reusable
Segments. Its Free Form mode layers takes vertically and plays the highest
available Object for an Instrument, supporting comp construction by revealing
lower takes. Switching back to Constrained mode can discard noncompiled lower
Objects, making the mode transition a durability warning rather than a pattern
to copy unchanged. [C-015] [C-016]

Historical third-party hosting is documented only as “VST” effects on classic
Mac OS and “VST and DirectX” effects on Windows. The manuals do not identify a
VST API generation, and they document effects—not a complete instrument/event
host contract. Boot-time initialization, one VST path, mono/stereo routing,
presets, custom controls, bypass, and Card-versus-Native placement restrictions
are visible; validation, cache identity, quarantine, process isolation,
sidechains, MIDI/event I/O, latency/tail reporting, sample-accurate parameter
automation, missing-plugin state, and crash recovery are **UNKNOWN**. [C-024]
[C-025] [C-026] [C-027] [C-041] [C-042]

The manuals preserve an important numerical contradiction: one project section
says 256 Tracks/Instruments and as many as 16 SubMixes, while Intelligent
SubMixing says 128 Tracks/Instruments, and the Master Mixer describes eight
possible SubMix strips. No single maximum is treated as established. [C-008]

**Overall confidence:** high for the documented 2.20/3.0-era workflows and
user-visible hybrid boundaries; medium for limits affected by manual
inconsistency; low for chronology/current status; and deliberately unknown for
proprietary internals, later drivers, SDK rights, and deep plugin behavior.

## 2. Product identity, history, and market position

The official reference calls PARIS the “Professional Audio Recording Integrated
System,” an E-MU product developed with Intelligent Devices, and describes it as
a computer recording studio joined to dedicated recording hardware and a C16
Pro control surface. The project model explicitly includes songs, remixes, and
post-production jobs. [C-001] [C-009]

The retained manuals are copyright 1998–2000 and contain mixed version anchors:
C16 Pro and the ASIO installer are described for 2.20, while Native-SubMix solo
behavior and controller compatibility mention 3.0. They therefore establish a
PARIS Pro / 3.0-era snapshot, not exact launch or point-release dates. [C-002]

Exact launch date, final commercial release, end-of-sale date, formal
discontinuation announcement, acquisition/lineage effects, and official support
end are **UNKNOWN**. Wayback, Arquivo.pt, Common Crawl, live-domain, web-search,
and repository discovery attempts did not yield retrievable primary chronology
within the depth budget. [C-003] [C-036]

The manuals establish classic Mac OS and legacy Windows operation. They do not
establish later OS compatibility or a maintained edition at the cutoff. A
“currently discontinued” conclusion is plausible but remains an **INFERENCE**,
not a documented status, because the decisive vendor notice was inaccessible.
[C-004] [C-036]

## 3. Workflow and conceptual model

A Project is the top-level unit for recording, editing, mixing, routing,
automation, effects, markers, window state, and referenced media. Work is split
into SubMixes, each with Editor, Mixer, Automation Editor, and Mini Mixer views;
the Project also has global transport, patch bay, media, MIDI, marker, and Master
Mixer views. [C-009] [C-010]

Audio work uses three related objects: an Audio File on disk, an Object that
non-destructively instructs PARIS which part of that file to play and how, and a
Segment retained in the project bin from an Object. The shared Audio Window
makes project media available across SubMixes. [C-015]

Constrained mode resembles a fixed 16-track recorder/mixer. Free Form mode can
display up to 999 FlexTracks, assigns Objects to Instruments, and resolves
overlapping takes by vertical priority. MIDI uses analogous Chunks, Objects,
Tracks, and Instruments on the same linear Playing Field. [C-016] [C-018]

PARIS is therefore a linear recording/editing DAW with visible submix resource
boundaries and an alternate layered-take model—not a clip-scene launcher,
tracker, notation system, or general modular plugin graph in the scoped manuals.
The absence of those models is scoped to the manuals, not asserted as a search
proof about every release. [C-009] [C-016] [C-033]

## 4. Publicly documented architecture

The documented deployment boundary is hybrid. A host computer runs PARIS and
stores audio; EDS-1000 PCI cards attach to audio interfaces and C16 surfaces.
Each card supplies 16 mixer channels and its own effects power, and a system can
use one to eight cards. Multiple cards are interconnected and their attached
interfaces are clock-synchronized. [C-005] [C-006]

One EDS-1000 is the master card. Its attached interface receives external clock
and the outputs of all Project SubMixes are summed to its outputs. Interface
442/MEC, mixer, mixer-effects, insert, and MEC-module endpoints appear as
user-patchable objects in the Patch Bay; mixer channel inputs remain tied to the
card’s 16 channels. [C-006] [C-012]

SubMix modes reveal execution placement: Card uses EDS effects/hardware paths,
Native uses host CPU effects and CPU-powered EQ, and Virtual plays the last
stereo materialization. Virtual update temporarily assigns EDS DSP, plays the
whole Project, writes a stereo pair, and returns the card to its Card SubMix.
[C-007]

Programming language, internal graph representation, EDS DSP algorithms and
precision, callback/thread ownership, lock strategy, scheduler, memory
protection, PCI protocol, and process/service boundaries are proprietary and
**UNKNOWN**. User-visible modes do not prove those internals. [C-033]

## 5. Audio engine

- **Rates/depth:** a Project offers 44.1 or 48 kHz. Recording is 16 or 24 bit,
  but the manual limits 24-bit recording to `.paf`; imported 16- and 24-bit
  files can coexist. Interface digital-I/O depth depends on hardware. [C-011]
- **Routing/clock:** Patch Bay connections route interfaces, card mixers,
  external inserts, and MEC modules. Internal, S/PDIF/digital, word-clock, and
  256Fs sources are documented; invalid external sync mutes output until sync
  returns. [C-012]
- **Streaming:** configurable disk I/O, disk cache, and overview-cache sizes
  trade responsiveness against throughput. The UI can report “Disk too slow,”
  and an excessive cache can prevent launch. [C-013]
- **Live processing:** each Card SubMix has 16 card channels; Native SubMix
  recording scales only to unspecified host CPU limits. The contradictory global
  128/256-track and 8/16-SubMix statements prevent a single documented maximum.
  [C-006] [C-007] [C-008]
- **Render/materialize:** selection/track renders can include specified
  combinations of edits, fades, native plug-ins, EDS effects, and EQ. Virtual
  SubMix updating renders a stereo pair; master Disk Record captures the stereo
  project mix. [C-014]
- **Unknown engine contract:** numerical mix-bus precision, buffer sizes,
  realtime deadlines, multicore scheduling, faster-than-realtime rendering,
  plugin delay compensation, plugin latency/tail handling, oversampling,
  dropout recovery, denormal policy, and deterministic render equivalence are
  **UNKNOWN**. [C-033]

## 6. Tracks, timeline, clips, and editing

Audio Objects are nondestructive references to source Audio Files. Objects can
be moved, trimmed, split/joined, slipped, faded, auto-crossfaded, copied, and
aligned to rulers/grids/markers; dynamic time compression/expansion changes
duration while preserving pitch. Destructive-style DSP commands instead create
new Audio Files and repoint the Object, leaving the original intact. [C-015]
[C-017]

Constrained mode provides 16 sounding Tracks plus two nonplaying scratch tracks.
Free Form mode separates visual FlexTrack location from Instrument/mixer
assignment and uses the highest visible Object for each Instrument, making
alternate-take comping possible. Switching Free Form to Constrained compiles the
top material into 16 Tracks and discards other Objects/pieces; undo or reverting
to a saved project is the documented recovery route. [C-016]

Undo and redo support up to 99 levels, and a configurable number can be saved in
the Project. Exact edit-history representation, corruption tolerance, ripple
editing, edit groups beyond mixer-control grouping, elastic-grid warping, and
version branches are **UNKNOWN**. [C-017] [C-034]

## 7. MIDI, sequencing, notation, and expression

PARIS records and plays MIDI Events grouped into Chunks and Tracks. MIDI Objects
place Chunks on the linear Playing Field; copied Objects share one Chunk unless
the Chunk is duplicated. MIDI Instruments assign playback ports and channels,
and MultiRecord can separate devices/channels onto tracks. [C-018]

The manual documents note/program/controller events, event editing, merge versus
overwrite recording, quantization, and a 960-ticks-per-beat display. Standard
MIDI Files 0/1/2 can be imported; formats 0 and 1 can be exported, preserving
multitrack information for relevant imports. [C-018] [C-019]

PARIS can send/receive MTC and synchronize with external devices/applications;
an optional MEC SMPTE module can supply SMPTE. Notation, score exchange, SysEx
round-trip guarantees, MPE, per-note expression, MIDI 2.0/UMP, sample-accurate
event delivery, and MIDI-generating plugin contracts are **UNKNOWN**. [C-019]
[C-027]

## 8. Routing, mixer, automation, and control

Each SubMix mixer presents 16 channel strips, two four-point insert modules per
channel, eight stereo Aux paths, a SubMix master, and a separate Master Mixer for
SubMix stereo outputs and the global master. Patch Bay objects expose hardware
I/O, external insert loops, Aux returns, and MEC expansion modules. [C-012]
[C-023] [C-043]

Channels can join one of eight control groups, with fader, pan, EQ, or Aux
behavior. The manuals do not establish arbitrary feedback, VCA objects, folders,
surround/immersive buses, object-based audio, or a general public routing API.
[C-043]

Automation records, plays, and edits volume, pan, and mute for channel, Aux
return, SubMix/master, and global controls from windows or C16. The editor uses
points/lines, can interpolate up to 172 points per second, and can simplify
point density. Plugin-parameter automation and sample-accurate application are
**UNKNOWN**. [C-020] [C-021] [C-042]

The C16 Pro and earlier Ensoniq Control 16 provide transport, faders, channel
selection, automation, numeric views/markers, and jog/shuttle control. One C16
can attach per EDS card. General MIDI-learn, OSC, network remotes, scripting,
and third-party control-surface APIs are **UNKNOWN**. [C-022] [C-032]

## 9. Recording, comping, and media handling

The manuals document audio recording, manual and automatic punch, looping,
configurable punch crossfades, input-level setup, and simultaneous MIDI
MultiRecord. Free Form’s layered vertical priority supports alternate-take
recording and comp construction. [C-016] [C-018]

Record-path output is `.paf`, `.sd2`, or `.wav`; only `.paf` records at 24 bit in
the scoped manual. PARIS imports/exports mono and stereo-interleaved WAV/SDII,
converts imported stereo files to two mono `.paf` files, exports Audio Files or
Segments, and offers sample-rate conversion and file compaction. [C-011]
[C-029]

A missing-media indicator, Select Missing, Reset File Path, and Search for Files
support individual or folder-assisted relinking. Saving after relink persists
the new locations; Reset File Path can deliberately substitute another take
while retaining Object edits. [C-029]

Automatic media collection/archive, hashes, content-addressing, proxy/conform
workflows, embedded metadata, video media, cross-volume path portability, and
relink ambiguity policy are **UNKNOWN**. [C-034]

## 10. Instruments, effects, content, and native devices

PARIS distinguishes EDS effects produced by card DSP from “Native” VST/DirectX
effects produced by the host CPU. EDS effects can occupy card inserts/returns;
the manual inventories factory dynamics, delays, modulation, distortion, and
reverb families. This is a product effect boundary, not a public implementation
description. [C-023]

Effect presets may live in the current Project or a shared `PARIS_FX.var`
library. Reopening a saved project reinstalls the most recent effect settings or
preset. Native plug-ins have preset, gain, wet/dry, routing, and bypass controls;
VST presets can be loaded from outside PARIS. [C-026]

No software-instrument plugin hosting is established by the cited manuals; MIDI
“Instruments” are routing definitions for external MIDI devices, not virtual
instruments. Native-device authoring, an EDS effect SDK, factory-content
licensing, modulation/rack systems, and third-party EDS binaries are **UNKNOWN**.
[C-018] [C-032]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means the retained evidence does not establish that boundary; it does
not mean unsupported. “VST” is not silently converted into “VST2,” and “DirectX
effects” is not silently expanded to DXi instruments. [C-041]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN: classic-Mac manual says only “VST” | UNKNOWN: manual says only “VST” | NOT_APPLICABLE:no scoped Linux edition | NOT_APPLICABLE:no scoped edition | 1998–2000 Rev. A; 2.20/3.0-era text | VST-family effects documented, exact API generation/revision unknown | C-024, C-041; S-001 |
| VST3 | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no scoped Linux edition | NOT_APPLICABLE:no scoped edition | No generation-specific evidence | Do not infer unsupported from silence | C-028, C-041; S-001 |
| AUv2 | UNKNOWN | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no scoped edition | Classic Mac OS predates the modern evidence requested | No AU claim established | C-028; S-001 |
| AUv3 | UNKNOWN | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no scoped edition | No generation-specific evidence | No AUv3 claim established | C-028; S-001 |
| AAX | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no scoped Linux edition | NOT_APPLICABLE:no scoped edition | None | No AAX claim established | C-028; S-001 |
| CLAP | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no scoped Linux edition | NOT_APPLICABLE:no scoped edition | None | No CLAP claim established | C-028; S-001 |
| LV2 | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no scoped Linux edition | NOT_APPLICABLE:no scoped edition | None | No LV2 claim established | C-028; S-001 |
| LADSPA | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no scoped Linux edition | NOT_APPLICABLE:no scoped edition | None | No LADSPA claim established | C-028; S-001 |
| DSSI | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no scoped Linux edition | NOT_APPLICABLE:no scoped edition | None | No DSSI claim established | C-028; S-001 |
| JSFX | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no scoped Linux edition | NOT_APPLICABLE:no scoped edition | None | No JSFX claim established | C-028; S-001 |
| DirectX/DXi | NOT_APPLICABLE:Windows family | DOCUMENTED:DirectX effects; UNKNOWN:DXi instruments | NOT_APPLICABLE:Windows family | NOT_APPLICABLE:no scoped edition | Windows, 1998–2000 Rev. A / 3.0-era | Requires then-current Microsoft Media Player; effects only in evidence | C-024, C-041; S-001 |
| Rack Extension | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no scoped Linux edition | NOT_APPLICABLE:no scoped edition | None | No Rack Extension claim established; no rights implied | C-028; S-001 |
| Product-native/other | DOCUMENTED:EDS effects with PARIS hardware | DOCUMENTED:EDS effects with PARIS hardware | NOT_APPLICABLE:no scoped Linux edition | NOT_APPLICABLE:no scoped edition | EDS-1000 / 2.20–3.0-era | Card-DSP effects and external hardware inserts; authoring SDK/license unknown | C-023, C-032; S-001 |

### 11.2 Discovery, scanning, validation, and recovery

The documented VST discovery control is one user-selected folder: Set VST Path
asks the user to select a plug-in in the folder, then quit and relaunch. The
installation chapter says plug-ins are initialized at boot and more plug-ins
increase launch time. DirectX effects are installed according to their vendor’s
instructions. [C-025]

Recursive traversal, multiple paths, file types, registry behavior, stable
identity, duplicate policy, shell plugins, scan subprocesses, capability
validation, cache format/invalidation, blacklist/quarantine, rescan UX, code
signing, malformed-plugin handling, and recovery after a scan crash are
**UNKNOWN**. A boot-time initialization statement is not proof of any one scan
architecture. [C-027]

### 11.3 Runtime isolation and compatibility

The manual says VST/DirectX effects are produced by the computer’s processor;
it does not state whether plug-in code runs in the application process or a
helper. Sandboxing, process-per-plugin modes, memory isolation, crash restart,
bitness bridging, architecture translation, signature checks, and compatibility
shims are **UNKNOWN**. [C-023] [C-027]

Card SubMixes may use EDS or CPU plug-ins as inserts but only EDS effects as
returns. Native SubMixes may use VST/DirectX effects for inserts and returns but
disable EDS effects; Virtual SubMixes play their last rendered stereo pair.
[C-007] [C-024]

### 11.4 Host/plugin processing contract

The documented third-party boundary is real-time effects. PARIS recognizes
mono-to-mono, mono-to-stereo, and stereo-to-stereo structures, can place an
effect on one or two adjacent channels, and exposes Left/Right/Sum input/output
choices plus input gain, output gain, and wet/dry mix. Native inserts are heard
on playback rather than recorded into source Tracks. [C-026]

Plugin instruments, MIDI/event input/output, sidechains, auxiliary buses beyond
the documented insert/return placement, multi-output instruments, MPE/MIDI 2.0,
sample-accurate events, dynamic I/O, precision negotiation, offline flags,
latency/tail reporting, PDC, suspend, and deterministic bypass are **UNKNOWN**.
[C-027]

### 11.5 Parameters, automation, state, presets, and project recall

Third-party effects may expose PARIS-style controls or their own custom
controls. PARIS can save/rename/delete native-effect presets, import external
VST presets, bypass an effect, and retain the latest effect settings/preset when
a saved Project reopens. Project files generally contain effects settings.
[C-010] [C-026]

Stable parameter IDs, value/text normalization, gesture semantics, plugin-state
chunk format, external asset references, preset-bank fidelity, state version
migration, missing-plugin placeholders, round-trip preservation while missing,
and corrupt-state recovery are **UNKNOWN**. The automation chapter documents
only mixer volume/pan/mute; plug-in-parameter automation is not established.
[C-027] [C-042]

### 11.6 UI, diagnostics, and failure modes

Clicking an insert’s name opens its editor, and the manual allows either generic
PARIS-like parameter controls or plug-in custom controls. Plug-in selection,
bypass, preset, and routing controls are documented. [C-026]

Editor embedding versus floating ownership, resizing, DPI/scaling, focus,
keyboard routing, headless use, accessibility, per-plugin logs, validation
messages, crash attribution, quarantine UI, missing-plugin UI, and failure
diagnostics are **UNKNOWN**. [C-027] [C-039]

## 12. Extensibility and integration

Documented integration boundaries are hardware patching, MIDI devices and MTC,
the C16/Control 16, OMF/SMF/audio files, and an ASIO driver that exposes PARIS
hardware to another host. Only one application can use the hardware through the
cited ASIO path, and the manual says there was no PARIS ASIO control panel.
[C-019] [C-022] [C-030] [C-031]

Public scripting, macros, command API, OSC/network remote, plugin/device SDK,
EDS effects SDK, controller SDK, protocol versioning, and compatibility policy
are **UNKNOWN**. Repository searches did not locate a canonical public EDS-1000
or PARIS-driver source repository. [C-032] [C-036]

## 13. Project format, persistence, interoperability, and collaboration

PARIS saves `.ppj` Project files intended to open on classic Mac OS or Windows.
The manual says they contain media paths, edited Objects/Segments, markers,
mixer/automation/effect settings, patch connections, views, windows, and Project
settings. A configurable number of undo/redo levels can also be saved. Audio
media remains in separate `.paf`, `.sd2`, or `.wav` files. [C-010] [C-017]

Missing audio is retained visibly and can be relinked individually or by
searching folders; the project must then be saved. This documents media
dependency recovery, not missing-plugin recovery. [C-029]

OMF import/export is documented for audio, edits, fader, and pan information;
SMF 0/1/2 import and SMF 0/1 export are documented separately. Exact OMF
version, embedding/reference choices, automation fidelity, crossfade fidelity,
timecode metadata, and round-trip conformance are **UNKNOWN**. [C-019] [C-030]

Autosave, journaling, atomic save, crash recovery, corruption detection,
forward/backward migration guarantees, archive/collect, missing-plugin state,
cloud collaboration, access control, and version-control semantics are
**UNKNOWN**. The manual’s instruction to save frequently is not evidence of an
automatic recovery system. [C-034]

## 14. Delivery, live, post-production, and specialized workflows

PARIS can render selected Objects or whole Tracks with specified processing,
update Virtual SubMixes, and record the complete stereo mix to disk. Live Mix
can combine incoming audio with recorded material during bounce. [C-014]

Post-oriented boundaries include OMF, SMPTE/MTC synchronization, SMPTE offset,
multiple time rulers, and sync points within Objects. The Project description
explicitly includes post-production jobs, but no video track or picture engine
is established. [C-009] [C-019] [C-030]

Batch export, background stem queues, loudness standards, DDP, ADM/immersive,
surround delivery, ADR tools, network collaboration, show control, and a
documented stage-failure recovery mode are **UNKNOWN**. [C-035]

## 15. Performance, reliability, security, and accessibility

The manuals expose disk I/O/cache tuning, projected channel capacity, “Disk too
slow” diagnostics, background-task progress/cancellation, sync-loss muting, and
Virtual-SubMix stale/update status. These are user controls and diagnostics, not
independent reliability measurements. [C-007] [C-013] [C-045]

Documented scaling includes one to eight EDS cards and 16 card channels per
card, but project maximums conflict. Native scaling is stated only as bounded by
host CPU power. No modern benchmark, realtime-safety proof, or qualified current
hardware/OS matrix was found. [C-006] [C-008]

Plugin/process crash containment, scanner isolation, secure updates, rollback,
binary signing/notarization, supply-chain policy, telemetry/privacy, permission
boundaries, and vulnerability support are **UNKNOWN**. [C-027] [C-039]

Keyboard shortcuts, large displays/fonts in some windows, and a tactile surface
are documented usability options, but screen-reader semantics, full keyboard
operability, contrast standards, localization, captions, and accessibility
conformance are **UNKNOWN**. [C-022] [C-039]

## 16. Licensing, ecosystem, and implementation constraints

The title pages state that the manuals are all-rights-reserved E-MU works, the
PARIS application is copyrighted by Intelligent Devices, and PARIS drivers,
effects software, and firmware are copyrighted by E-MU Systems. They also state
that PARIS marks are owned or exclusively licensed by E-MU. [C-001] [C-037]

Those notices are ownership statements, not open-source or SDK grants. No public
license for application code, EDS DSP/firmware, drivers, project/media formats,
or an EDS effect SDK was established. Later community-driver authorship,
authorization, source license, redistribution rights, signing status, and use
of any original SDK are **UNKNOWN**. [C-032] [C-036] [C-037]

Historical VST/DirectX/ASIO behavior does not grant a new implementation rights
to old SDKs, trademarks, compatibility marks, binaries, or patents. In
particular, the exact VST generation is unresolved; any new host must qualify
current format-owner terms independently. This dossier is not legal advice.
[C-041]

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** PARIS makes scarce processing placement visible; distinguishes
live, host-native, and materialized states; gives stale renders an explicit
status; separates nondestructive objects from source media; supports practical
relink/substitution; saves rich project state and some undo; and combines audio,
MIDI, control surface, and post synchronization coherently. [C-007] [C-010]
[C-015] [C-017] [C-022] [C-029]

**Liabilities.** The workstation depends on proprietary PCI DSP and interfaces;
Virtual updates play the whole project and can become stale; the manual has
material capacity contradictions; Free Form-to-Constrained conversion can
discard alternate objects; platform support is obsolete; and third-party
hosting lacks documented modern isolation, recovery, identity, latency, and
state guarantees. [C-004] [C-007] [C-008] [C-016] [C-027]

**INFERENCE:** PARIS is a strong clean-room reference for explicit resource and
materialization state, but a weak sole reference for a modern cross-platform
engine or plugin host. A plausible alternative is that later releases or
community drivers improved some boundaries; inaccessible release/driver
evidence is why that possibility remains open. [C-038]

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites, tradeoffs, adaptation risk |
| --- | --- | --- | --- | --- |
| CANDIDATE | Users must understand where a graph executes | Give graph partitions an explicit execution class and show unavailable combinations before activation | C-006, C-007 | Generalize beyond proprietary cards; validate resources atomically; do not copy PARIS UI or terminology |
| CANDIDATE | Cached/frozen audio can silently diverge from edits | Store a dependency fingerprint and visibly mark materialized output stale until rebuilt | C-007, C-038 | Needs transactional rebuild, cancellation, old-render fallback, dependency graph, latency/tail policy |
| CANDIDATE | Media paths break when projects move | Preserve missing asset records and offer exact relink plus bounded folder search/substitution | C-010, C-029 | Add hashes, ambiguity review, path portability, undo, audit log, and never auto-bind the wrong take |
| CANDIDATE | Repeated edits should not mutate source media | Separate immutable/source media from timeline instances and reusable edited references | C-015 | Requires stable IDs, reference counts, consolidation, garbage collection, and portable serialization |
| CONDITIONAL | Build comps from layered takes | Resolve an explicit priority order among take regions and reveal lower material through edits | C-016 | Avoid destructive mode conversion; preserve all takes, comp map, provenance, and undo |
| CONDITIONAL | Preserve useful edit recovery with the project | Persist a bounded, versioned undo history selected by policy | C-017 | Cost, privacy, migration, corruption isolation, and external-media operations need explicit handling |
| CONDITIONAL | Make effect placement constraints comprehensible | Validate effect I/O and execution-domain compatibility at insertion time | C-024, C-026 | Modern host must add buses, events, latency, tails, dynamic I/O, sandboxing, and migration |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT:** proprietary PCI DSP as a mandatory product center. It creates an
  obsolete hardware/driver dependency and an unqualified security/support
  boundary. Reopen only for a separately justified appliance product. [C-004]
  [C-036]
- **REJECT:** destructive mode transitions that discard alternate takes. A
  modern comp system should preserve source/take state and make flattening an
  explicit reversible or versioned operation. [C-016]
- **REJECT:** whole-project, one-SubMix-at-a-time update as the only freeze/cache
  mechanism. Preserve the explicit stale-state idea, not the coarse rebuild
  granularity. [C-007]
- **REJECT:** treating “supports VST” as a complete or generation-specific host
  contract. The manuals prove historical effects placement only. [C-024]
  [C-027] [C-041]
- **REJECT:** inferring a trustworthy current driver from community references
  that could not be traced to source, license, maintainer, or release artifacts.
  [C-036]
- `CURIOSITY_NO_GO` — exact launch/discontinuation chronology: multiple archive
  routes failed; important historically but unlikely to alter the architectural
  conclusion within this budget. Reopen with a first-party announcement.
- `CURIOSITY_NO_GO` — proprietary EDS SDK internals/licensing: no public primary
  grant was found; private or leaked material is outside the clean-room boundary.
- `CURIOSITY_NO_GO` — anecdotal crash/recovery reports: community observations
  cannot establish vendor internals and were lower value than primary manuals.
- `CURIOSITY_NO_GO` — exhaustive factory-effect inventory: does not change the
  execution-domain or plugin-host decision.
- `CURIOSITY_NO_GO` — installer/binary execution: unnecessary for documentary
  coverage and prohibited by the research contract.

## 20. Falsifiable hypotheses and adversarial checks

1. **H1 supported:** PARIS exposes a hybrid host/EDS architecture rather than
   merely using hardware as ordinary audio I/O. Card, Native, and Virtual modes
   plus card DSP assignment directly support this. [C-005] [C-007]
2. **H2 supported:** Virtual SubMixes are materialized stereo outputs with a
   visible stale state, not continuously live graph partitions. [C-007]
3. **H3 falsified:** “The manual establishes one clear project maximum.” It
   conflicts among 256/16, 128/16, and eight-strip descriptions. [C-008]
4. **H4 supported with liability:** Free Form mode is a take-layer/comp model,
   but conversion to Constrained can discard nonselected Objects. [C-016]
5. **H5 refined:** historical VST/DirectX **effects** are documented; VST2
   specifically, instruments, events, modern bus contracts, isolation, and
   migration are not. [C-024] [C-027] [C-041]
6. **H6 not established:** “PARIS had sample-accurate automation.” The manual
   exposes a points-per-second automation editor, not an engine delivery
   guarantee, and covers mixer controls rather than plugin parameters. [C-021]
   [C-042]
7. **Counterevidence search:** archive and repository routes failed or returned
   no results, so no first-party discontinuation notice or canonical public
   community-driver source was retained. Negative search results are not proof
   that such materials never existed. [C-003] [C-036]
8. **Later safe probes:** in a disposable legally sourced legacy environment,
   distinguish file accepted, initialized, instantiated, rendered, automated,
   saved/restored, missing, and crash-recovered for known VST/DirectX fixtures;
   measure render speed, event timing, latency, tails, state fidelity, and update
   invalidation. No dynamic probe was run here. [C-027]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | PARIS is an E-MU Professional Audio Recording Integrated System developed with Intelligent Devices; application and E-MU component ownership are split. | Official manuals | S-001, S-002 | Title/notice and welcome sections | Vendor documentation, not corporate-history triangulation |
| C-002 | DOCUMENTED | High | Manuals are ©1998–2000 Rev. A and contain 2.20 and 3.0 anchors. | Manual snapshot | S-001, S-002 | Title pages; Reference pp. 20, 175, 226 and controller appendix | Does not identify one exact software build |
| C-003 | UNKNOWN | Low | Exact launch, release, and formal discontinuation chronology is unresolved. | Product history | S-001, S-002 | Manuals plus failed archive/search attempts | Next probe: retrievable first-party releases/notices |
| C-004 | DOCUMENTED | High | Scoped host platforms are classic Mac OS and legacy Windows; modern OS/platform qualification is not established. | 2.20/3.0-era manuals | S-001 | Installation, shortcuts, MIDI, ASIO sections | Manual silence cannot prove no later ports |
| C-005 | DOCUMENTED | High | PARIS combines host software, disk storage, EDS-1000 PCI DSP hardware, interfaces, and C16 control. | Hardware/software system | S-001, S-002 | Welcome and installation sections | Internal implementation remains unknown |
| C-006 | DOCUMENTED | High | One to eight EDS-1000 cards are supported; each adds 16 mixer channels/effects and attached I/O; a master card handles summing/clock input. | Reference manual | S-001 | pp. 4, 17, 171 | No independent scaling measurement |
| C-007 | DOCUMENTED | High | Card, Native, and Virtual SubMix modes expose EDS-live, CPU-live, and rendered-stereo states with update status and card-assignment constraints. | PARIS 3.0-era | S-001 | pp. 171–178 | Exact internal processing path unknown |
| C-008 | DOCUMENTED | High | Manual limits conflict: 256 tracks/16 SubMixes, 128 tracks/up to 15 Virtual SubMixes, and eight possible Master-Mixer strips. | Reference manual | S-001 | pp. 15, 171–173 | Dynamic maximum unresolved |
| C-009 | DOCUMENTED | High | A Project covers recording/editing/mixing and is divided into global and per-SubMix windows. | Reference manual | S-001 | pp. 15–16 | Window model is not internal module topology |
| C-010 | DOCUMENTED | High | `.ppj` stores media paths, edits, markers, mixer/automation/effect settings, patching, views, and window/project state for Mac/Windows opening. | Reference manual | S-001 | pp. 15–16 | Schema and migration rules unknown |
| C-011 | DOCUMENTED | High | Projects offer 44.1/48 kHz; recording is 16/24 bit with 24-bit recording limited to `.paf`; `.paf`/`.sd2`/`.wav` media are documented. | Reference manual | S-001 | pp. 21, 23–25, 155–159 | Hardware digital-input depth varies |
| C-012 | DOCUMENTED | High | Patch Bay and master-card rules expose interface/mixer/insert/MEC routing and synchronization. | EDS/interface scope | S-001 | pp. 13–14, 17, 31–36 | Feedback/cycle and internal graph semantics unknown |
| C-013 | DOCUMENTED | High | Disk I/O/cache/overview settings trade throughput against responsiveness and expose “Disk too slow”/launch-failure guidance. | Legacy host performance | S-001 | pp. 9–10, 18 | Guidance is not benchmark evidence |
| C-014 | DOCUMENTED | High | PARIS renders selections/tracks with defined EDS/native/EQ combinations, updates Virtual stereo pairs, and records the stereo master. | Reference manual | S-001 | pp. 80–81, 174, 176–177 | Faster-than-realtime and tail behavior unknown |
| C-015 | DOCUMENTED | High | Audio Files, nondestructive Objects, and reusable Segments are distinct; many edits alter instructions rather than source media. | Editor model | S-001, S-002 | Reference pp. 45–47, 80–82; tutorials | Some DSP creates new media files |
| C-016 | DOCUMENTED | High | Constrained mode has 16 tracks; Free Form uses up to 999 FlexTracks and vertical take priority, but conversion can discard lower Objects. | Editor modes | S-001 | pp. 44, 54–58 | Comp behavior not dynamically tested |
| C-017 | DOCUMENTED | High | Object editing includes trim/split/slip/fade/crossfade/time change and up to 99 undo/redo levels, some persistable. | Reference manual | S-001 | pp. 20, 59–82 | History schema/corruption behavior unknown |
| C-018 | DOCUMENTED | High | MIDI Events/Chunks/Objects/Tracks/Instruments, editing, recording, MultiRecord, quantization, and 960 ticks/beat are documented. | PARIS MIDI editor | S-001 | pp. 179–204 | Modern event/expression contracts unknown |
| C-019 | DOCUMENTED | High | SMF 0/1/2 import, SMF 0/1 export, MTC, and optional SMPTE synchronization are documented. | MIDI/interchange | S-001 | pp. 19, 182–183, 223–225 | Round-trip fidelity not independently qualified |
| C-020 | DOCUMENTED | High | Mixer automation records/plays/edits volume, pan, and mute for channel/Aux/SubMix/global controls. | Automation | S-001, S-002 | Reference pp. 137–150; tutorial automation | Does not establish plugin automation |
| C-021 | DOCUMENTED | High | Automation has configurable points-per-second, interpolation to 172 points/sec, and simplification. | Automation editor | S-001 | pp. 149–150 | Not a sample-accuracy guarantee |
| C-022 | DOCUMENTED | High | C16 Pro/Control 16 provide transport, fader, automation, view/marker, and jog/shuttle control; card/surface assignment is documented. | 2.20/3.0 era | S-001, S-002 | Reference pp. 20, 205–221 | Accessibility and third-party API unknown |
| C-023 | DOCUMENTED | High | EDS effects run on card DSP; “Native” VST/DirectX effects run on host CPU and occupy separate insert paths. | Mixer/effects | S-001 | pp. 114–118, 127–135 | “Native” is PARIS terminology, not product-native SDK evidence |
| C-024 | DOCUMENTED | High | Classic Mac OS hosts VST effects; Windows hosts VST and DirectX effects, with Card/Native insert/return restrictions. | Historical host formats | S-001 | pp. 11, 174–175 | VST generation and DXi instruments unresolved |
| C-025 | DOCUMENTED | High | VST uses one selected path and relaunch; plug-ins initialize during boot and more plug-ins lengthen boot. | Historical discovery | S-001 | pp. 11, 19 | Scan/cache/validation architecture not stated |
| C-026 | DOCUMENTED | High | Plug-in effects support documented mono/stereo structures, routing/gain/wet-dry, custom controls, bypass, project/library presets, and VST preset import. | Historical effect contract | S-001 | pp. 114, 127–129 | No instrument/event/full-state guarantee |
| C-027 | UNKNOWN | Low | Plugin scan validation/cache identity, isolation, bridging, crashes, buses/events, latency/tails, full state, missing-plugin recovery, and diagnostics are unknown. | Third-party hosting | S-001 | Not resolved by retained manuals | Next probe: legal disposable fixtures and first-party host docs/source |
| C-028 | UNKNOWN | Low | VST3, AUv2/AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, and Rack Extension hosting are not established. | Required format matrix | S-001 | Evidence scarcity | Unknown is not unsupported |
| C-029 | DOCUMENTED | High | Missing audio has indicators, selection, exact relink, folder search, substitution, and save-to-retain-path workflows. | Audio media | S-001 | pp. 153–157 | Ambiguity/hash/archive behavior unknown |
| C-030 | DOCUMENTED | High | OMF import/export is described as carrying audio, edits, fader, and pan data. | PARIS Pro interchange | S-001 | p. 17 | OMF version and conformance unknown |
| C-031 | DOCUMENTED | High | PARIS supplies Mac/Windows ASIO hardware access; Windows 2.20 installer placement, single-client use, and no control panel are documented. | ASIO driver | S-001 | p. 226 | Later/current drivers unknown |
| C-032 | UNKNOWN | Low | Public scripting/controller/device SDKs and EDS authoring/license boundaries were not established. | Extensibility | S-001 | Manuals contain user integration, not SDK terms | Next probe: authenticated public SDK/license archive only |
| C-033 | UNKNOWN | Low | Internal scheduler, threads, precision, graph representation, process boundaries, realtime guarantees, PDC, and render equivalence are unknown. | Proprietary internals | S-001 | User manuals insufficient | Requires public engineering docs or safe instrumentation |
| C-034 | UNKNOWN | Low | Autosave/crash recovery, atomicity, migration, collection/archive, collaboration, and corruption handling are unknown. | Persistence/reliability | S-001 | Frequent-save advice and relink are insufficient | Next probe: release-specific recovery docs and fault fixtures |
| C-035 | UNKNOWN | Low | Modern batch, loudness, DDP, video, ADR, surround/immersive/ADM, and show-control workflows are unknown. | Delivery/specialization | S-001 | OMF/timecode do not prove these features | Manual scope may omit later features |
| C-036 | UNKNOWN | Low | Formal discontinuation and community-driver provenance, source license, signing, SDK dependency, and supported OS matrix are unknown. | Status/drivers | S-001 | Archive/search/repository routes failed or returned zero | Negative result is not evidence of nonexistence |
| C-037 | DOCUMENTED | High | Application rights belong to Intelligent Devices; driver/effects/firmware and manual rights belong to E-MU; no open grant is stated. | Title-page notices | S-001, S-002 | Direct ownership notice | Current ownership/transfers not researched |
| C-038 | INFERENCE | Medium | Explicit execution/materialization modes and stale-state indication are transferable; mandatory proprietary hardware and coarse rebuild are not. | Architecture synthesis | S-001 | Derived from C-006/C-007 | Modern graphs need transactional, dependency-aware generalization |
| C-039 | UNKNOWN | Low | Modern security, privacy, signing, update, rollback, sandbox, and accessibility conformance are unknown. | NFRs | S-001 | Legacy usability controls are insufficient | Requires later policy/build/runtime evidence |
| C-041 | UNKNOWN | High | The manuals’ unqualified “VST” wording does not establish VST2 or another exact API generation, and DirectX effects do not establish DXi. | Format identity | S-001 | Conservative format classification | A versioned SDK/readme could resolve it |
| C-042 | UNKNOWN | High | Plugin-parameter automation and sample-accurate automation are not established. | Automation/plugin contract | S-001 | Documented automation scope is mixer volume/pan/mute; density is points/sec | Absence from chapter is not proof of unsupported behavior |
| C-043 | DOCUMENTED | High | SubMix mixers expose 16 channels, eight Aux paths, serial inserts, and eight control groups. | Mixer | S-001 | pp. 111–126 | Arbitrary graph/sidechain policy unknown |
| C-045 | DOCUMENTED | Medium | Background tasks show progress and can be cancelled; Virtual changes have a stale/update status. | Diagnostics | S-001 | pp. 22, 174, 178 | No crash containment implied |

## 22. Source ledger and adaptive bibliography

### S-001 — *PARIS Reference Manual*

- **Publisher/kind:** E-MU Systems, Inc.; first-party primary manual, FI11583
  Rev. A, ©1998–2000; 290 PDF pages.
- **Preserved artifact:**
  `file:///private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/PARIS-Reference-Manual.pdf`
- **SHA-256:**
  `95b40bc880ddbb5c1ef2e72dc90bf706e6f29df67b6870b5e159bc0317db42d3`.
- **Publisher URL printed in source:** `http://www.emuparis.com` (not
  retrievable during final evidence passes). The original PDF retrieval URL was
  not preserved in the serialized checkpoint; this limitation is explicit
  rather than replaced with an invented link.
- **Scope/access:** mixed 2.20/3.0-era PARIS hardware/software; accessed
  2026-08-29.
- **Decision-critical passages:** title/rights page; pp. 4–7 EDS hardware;
  11 and 19 VST/DirectX installation/path; 15–25 Project/persistence/rates;
  31–36 Patch Bay; 45–82 Objects/editing/render; 99–150 mixer/effects/
  automation; 153–159 media/relink; 171–178 SubMix modes; 179–204 MIDI;
  205–221 C16; 223–226 sync/ASIO.
- **Supported claims:** C-001–C-039, C-041–C-043, and C-045 as mapped in the
  register, including attempts recorded for explicit inferences/unknowns.
- **Limitations:** user documentation, internally inconsistent limits, mixed
  versions, no source/runtime proof, no discontinuation or SDK/license history.
- **Selection rationale:** authoritative and substantially more complete than
  marketing pages or community summaries; preferred for architecture and host
  behavior despite version ambiguity.

### S-002 — *PARIS Introduction Manual*

- **Publisher/kind:** E-MU Systems, Inc.; first-party tutorial manual, FI11584
  Rev. A, ©1998–2000; 56 PDF pages.
- **Preserved artifact:**
  `file:///private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/PARIS-Introductory-Manual.pdf`
- **SHA-256:**
  `aa4b29f4cfd8d5c7bc17e5f59acc6deb14cf52c1e465d665533e563a6012e592`.
- **Publisher URL printed in source:** `http://www.emuparis.com`; original PDF
  retrieval URL unavailable for the same checkpoint limitation as S-001.
- **Scope/access:** introductory PARIS/C16 workflow, ©1998–2000; accessed
  2026-08-29.
- **Decision-critical passages:** title/rights page; pp. 1–7 product/tutorial
  and project/media linking; pp. 9–26 Audio File/Object/Segment editing;
  pp. 27–36 mixer/effects/automation; pp. 37–43 recording/C16; pp. 45–52 mixer.
- **Supported claims:** C-001, C-005, C-015, C-020, C-022, C-037.
- **Limitations:** tutorial depth, no full plugin or persistence contract, no
  independent measurement.
- **Selection rationale:** retained only as first-party corroboration of the
  Reference Manual’s core user model; preferable to anecdotal tutorials but
  intentionally not treated as an independent vendor.

**Bibliography rationale.** Both retained sources are primary but share one
publisher, so agreement is corroboration of documentation, not independent
triangulation. No vendor claim is presented as independent runtime measurement.
Secondary pages were not retained merely to fill gaps.

**Negative access record (not claim sources):** Wayback CDX failed through the
fetch transport and direct HTTPS; web search returned HTTP 429; Arquivo.pt
returned zero domain/text results; the live domain was unreachable; legacy
Common Crawl CDX queries returned 404; GitHub repository searches for
`"Ensoniq PARIS" driver` and `"EDS-1000"` returned zero. These results explain
unknowns and the stop decision but do not prove historical absence.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Decision impact | Safest next probe | Required fixture / owner |
| --- | --- | --- | --- | --- |
| Release and discontinuation chronology | Manuals plus Wayback/Arquivo/Common Crawl/live-domain/web-search attempts; archive access failed | Low for architecture, medium for provenance | Retrieve signed/first-party release notes and discontinuation notice from an accessible institutional archive | Public archive access; unassigned historian |
| Community drivers | Live/search/repository discovery; no canonical source retained | High for maintainability, rights, and current usability | Identify maintainer, immutable source/tag, license, signed artifacts, supported OS list, and provenance statement | Public repository/release archive; unassigned driver researcher |
| EDS SDK and effect authoring rights | User manuals contain no SDK/license grant; private material excluded | High for reuse boundary | Locate a lawfully public SDK package/license from vendor or successor and review only its published terms | Public licensed SDK; legal/engineering owner unassigned |
| Plugin generation and host contract | Manual says VST/DirectX effects without exact API version; no execution allowed | High for interoperability lessons | Obtain versioned official readme/SDK compatibility matrix, then run accepted/scanned/instantiated/rendered/state tests separately | Disposable legacy VM and legal fixtures; test owner unassigned |
| Scan/cache/isolation/recovery | User manual exposes path/restart only | High for secure host design | Fault-inject scanner and runtime fixtures; inspect processes/files/logs without reverse engineering | Disposable VM, benign crash/hang fixtures; security test owner unassigned |
| Latency/tails/automation timing | No PDC, tail, callback, or plugin-automation guarantee in manuals | High for engine design | Loopback/impulse and timestamp fixtures across live/render/update modes | Audio loopback and deterministic plugins; DSP test owner unassigned |
| Project/plugin state durability | `.ppj` contents described at high level only | High for migration/recovery | Round-trip projects with moved/missing/replaced plugins and assets; corrupt copies, never originals | Disposable projects and legal plugins; persistence owner unassigned |
| Proprietary scheduler/DSP precision | Public user docs cannot discriminate internals | Medium; prototypes can answer design needs directly | Do not chase private implementation; prototype candidate execution/materialization state model | New clean-room prototype; architecture owner unassigned |

## 24. Curiosity pass and stop decision

Scores are 1–5; lower cost is better.

| Candidate follow-up | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Alternate archive for first-party chronology | 5 | 4 initially, 1 after repeated failures | 3 | 2→5 | Pursued through Wayback, Arquivo.pt, Common Crawl; saturated, then `CURIOSITY_NO_GO` |
| Canonical community-driver source/license | 4 | 4 | 4 | 2 | Highest final thread; GitHub discovery returned zero; unresolved |
| Public EDS SDK/license | 4 | 3 | 4 | 4 | `CURIOSITY_NO_GO`: no public grant found; private material out of frame |
| Anecdotal recovery/crash reports | 3 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: cannot prove internals; dynamic fixtures are superior |
| Exact factory-effect inventory | 1 | 1 | 1 | 2 | `CURIOSITY_NO_GO`: cannot change architecture decision |
| Proprietary scheduler reverse engineering | 3 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: outside clean-room authority and unnecessary |

**Gaps/contradictions after synthesis:** exact chronology and drivers remain
unknown; retained manuals are not independent sources; track/SubMix limits
conflict; VST generation is unspecified; no public evidence resolves deep
plugin, recovery, or scheduler semantics.

**Stop decision:** stop on budget exhaustion, repeated archive duplicates/
failures, and nonpositive marginal evidence. Six evidence passes were used. The
architecture-relevant hybrid, editing, routing, persistence, effects-placement,
and interchange dimensions have sufficient primary coverage, while every
consequential unresolved boundary is visible as `UNKNOWN`. Further documentary
search is unlikely to change the leading transferable patterns without new
archive access; the next useful step is a separately authorized, disposable
interoperability prototype—not indefinite search.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Repository check performed;
  extraction artifacts were kept outside the repository in the approved system
  temporary directory.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  section 11 subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Claims are
  resolved in section 21; inferences and unknowns are labeled.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.**
- [x] **Every required plugin-format row is present.** No required row is blank.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Discovery, runtime, processing, state, UI, and failures are separated.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
- [x] **Licensing and clean-room boundaries are explicit.**
- [x] **Bibliography records source rationale and limitations.** Artifact hashes,
  passages, access date, and unavailable original retrieval URLs are disclosed.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.**
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** No product binary/installer/plugin was executed.

**Owned path:** `research/daw-landscape/dossiers/ensoniq-paris.md`.

**Checks performed:** heading/matrix completeness review, claim/source crosswalk,
manual contradiction review, required-format enumeration, archive-negative-result
review, artifact SHA-256 capture, and repository path/status inspection.

**Unresolved blockers:** first-party chronology, later/community-driver
provenance and license, public EDS SDK terms, modern OS qualification, and deep
plugin/recovery/engine contracts. Pre-existing shared workspace changes were
left untouched.
