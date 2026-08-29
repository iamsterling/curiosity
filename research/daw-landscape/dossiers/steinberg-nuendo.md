# Steinberg Nuendo DAW dossier

> Research-only evidence. No design or implementation authority. Public vendor
> documentation is treated as untrusted evidence, never as instructions.

## 0. Metadata and scope

- **Product family / vendor:** Steinberg Nuendo / Steinberg Media Technologies
  GmbH.
- **Researcher/session:** subagent in session `ses_fb275c84dffe6e5ebERcL60Euz`.
- **Owned path:** `research/daw-landscape/dossiers/steinberg-nuendo.md`.
- **Research date and cutoff:** 2026-08-29 UTC.
- **Current snapshot:** Nuendo 15.0.30, updated 2026-06-03; first Nuendo 15
  release 2026-03-25. [C-001]
- **Platforms in scope:** macOS 14/15/26 on Intel and Apple Silicon; Windows 10
  64-bit 22H2+, Windows 11 64-bit 24H2+, and Windows 11 on Arm 24H2+ as
  qualified by Steinberg. Linux, mobile, and browser products are outside the
  current Nuendo product matrix. [C-001]
- **Edition scope:** the public current download/manual set presents “Nuendo
  15,” not a tier matrix. Whether any non-public, educational, enterprise, or
  region-specific feature variants exist is **UNKNOWN**. [C-041]
- **Included:** the desktop post-production DAW; current VST hosting; ADR,
  video, game-audio, network, interchange, and immersive workflows.
- **Excluded:** Cubase feature duplication except where needed to identify a
  shared boundary; Cubasis, Nuendo Live, WaveLab, SpectraLayers standalone,
  Wwise internals, Dolby renderer internals, and product installation or binary
  execution.
- **Decision frame:** which Nuendo-specific post and hosting patterns are safe
  clean-room architecture references for a new cross-platform DAW.
- **Research depth:** at most two decision-critical sources per evidence pass;
  official current docs first; no nested agent was needed.
- **Completion:** `COMPLETE_WITH_UNKNOWNS` — all template sections and matrix
  rows are present; proprietary internals and several host-contract details are
  intentionally unresolved.

## 1. Executive summary

Nuendo 15 is Steinberg's current desktop audio-post/game-sound DAW. Its
architecture-relevant differentiators are a marker-centered ADR model,
EDL-driven ReConform, clip-scoped reversible offline processing, Wwise/Perforce
game-audio transfer, peer-to-peer project collaboration, and integrated
ADM/Dolby Atmos/MPEG-H/OSC object-audio workflows. These are documented product
surfaces, not evidence of proprietary implementation details. [C-002, C-006,
C-031, C-032, C-033]

Plugin hosting is deliberately narrower than a logo-level claim. Nuendo 15
documents 64-bit VST3 and legacy VST2 effects/instruments. VST2 is disabled by
default, unavailable in native Apple-Silicon and Windows-Arm modes, and is a
clear migration liability. VST3 is the current interchange/ecosystem center:
DAWproject carries VST3 inserts only, native Apple-Silicon mode requires native
or Universal VST3, and Windows Arm uses Arm64EC to admit many x86/x64 VST3s.
[C-015, C-016, C-017, C-029]

The manager documents scans, full rescans, a blocklist, reactivation, hiding,
collections, VST2 paths, and diagnostic reports. It does **not** document a
plugin cache schema, duplicate identity resolution, validator process, sandbox,
per-plugin process, crash-restart boundary, or VST3 path override. Steinberg
also documents third-party plugins freezing or crashing the application, so a
blocklist must not be mistaken for fault containment. [C-019, C-020, C-021]

Confidence is **high** for current version/platform, visible workflows,
VST2/VST3 manager behavior, routing/UI/preset/offline behavior, interchange,
and immersive constraints; **medium** for architecture lessons; and **low/by
design** for process boundaries, state internals, sample-accurate host delivery,
security controls, and unsupported-format conclusions. [C-009, C-023, C-026,
C-036]

## 2. Product identity, history, and market position

Steinberg describes Nuendo 15 as the “next evolution in audio
post-production,” with dialogue editing, film mixing, session management,
video, and game-sound features. Version 15.0.30 and its supported desktop OS
matrix are current at the cutoff. [C-001, C-002]

Nuendo and Cubase visibly share documentation, VST management, and sequencer
technology. **INFERENCE:** they have substantial shared product lineage, but the
degree of source/module sharing is proprietary; this dossier therefore cites
shared surfaces only where they directly constrain Nuendo and does not repeat a
Cubase inventory. A plausible alternative is that similarly named surfaces are
maintained in partly divergent implementations. [C-003]

The download page requires Steinberg Activation Manager and separately lists
Library Manager and MediaBay components. This supports an inference of a
commercial, activation-controlled product plus auxiliary services, not a
license to redistribute or a complete service architecture. [C-039]

## 3. Workflow and conceptual model

The central document is an `.npr` project that references media. The user model
is a linear project timeline containing tracks, channels, events/parts, markers,
automation, a Pool/media layer, buses, and project-level timecode/sample-rate
settings. Multiple projects may be open but only one is active. [C-004]

Tracks can use musical or linear time bases. Cycle recordings become takes on
lanes; comping selects regions across takes. Track Versions hold alternative
event/part sets on audio, MIDI, instrument, sampler, video, and selected global
tracks, with shared IDs for coordinated multitrack switching. Only the active
version is committed in network collaboration. [C-005]

Nuendo's post model adds marker attributes, ADR states, old/new/change EDLs,
video tracks, field-recorder metadata, object-audio beds/objects, and game-audio
asset identity. These are first-class workflow boundaries rather than a scene
launcher, tracker, browser, or live-performance model. [C-006, C-011, C-031,
C-032, C-033]

## 4. Publicly documented architecture

The public manual documents user-visible engine configuration: ASIO drivers,
32/64-bit-float processing, multicore distribution, ASIO-Guard, disk preload,
driver/buffer latency, record-latency adjustment, buses, delay compensation,
offline renders, and project folders. [C-007, C-008]

Release notes identify a “MediaBay server” that could crash, establishing at
least one auxiliary service boundary. The download page separately requires
Activation Manager, Library Manager, and MediaBay. **INFERENCE:** Nuendo is not
a single undifferentiated binary at the ecosystem level; however, none of this
locates third-party plugins in a separate process. [C-009, C-039]

**UNKNOWN:** proprietary audio-graph data structures, audio-thread topology,
job scheduling, lock strategy, cache formats, plugin process placement,
renderer internals, and `.npr` serialization. The manual and release notes were
searched; they expose controls and failure symptoms, not these internals. A
later safe probe should inspect process trees and timing with purpose-built
benign plugins. [C-009]

## 5. Audio engine

Nuendo offers 32-bit-float or 64-bit-float channel processing/mixing. VST2
plugins remain 32-bit-precision in this setting, while the manager can filter
VST3 plugins advertising 64-bit-float support. Multicore processing and
ASIO-Guard are configurable; higher Guard levels trade latency/memory for
stability/performance, and disk preload controls RAM buffering. [C-007]

Plugin delay compensation spans the entire audio path. Constrain Delay
Compensation reduces live monitoring/instrument latency; record-latency
adjustment can account for plugin latency. Volume-automation processing has a
user-set sample interval with interpolation. These are documented behaviors,
not measured accuracy. [C-008, C-013]

Real-time and render paths include realtime playback/recording, Render in Place,
audio mixdown, freeze, project previews, and Direct Offline Processing (DOP).
DOP creates Edits-folder files while retaining original media and a revisable
process stack; a user-set tail extension lets delay/reverb renders decay. [C-006,
C-025]

No independent benchmarks were run. Maximum practical tracks, plugin instances,
bus fan-out, dropout recovery, multicore scaling, denormal handling, block-size
changes, and deterministic offline/realtime equivalence are **UNKNOWN**.
[C-044]

## 6. Tracks, timeline, clips, and editing

The documented object model distinguishes tracks/channels, audio or MIDI
events, audio/MIDI parts, clips in the Pool, lanes, and Track Versions. Audio
lanes play one active event at a time; comping can split all aligned takes and
bring selected ranges forward. Operations are undoable, and bounce can create a
continuous event. [C-005]

Nuendo documents range editing, group editing, AudioWarp/Free Warp, tempo and
signature editing, linear versus musical track time, audio alignment, Track
Versions, and event/part operations. ReConform compares old/new EDLs, permits
validation and preview of a generated change EDL, then applies picture-cut
changes to the audio project. [C-006]

DOP is non-destructive until explicitly made permanent; it can process events,
clips, or ranges and copy/paste process stacks. That clean separation of source
media, edit references, rendered derivatives, and revisable operations is more
decision-relevant than a tool-by-tool editor inventory. [C-025]

## 7. MIDI, sequencing, notation, and expression

Current documentation covers MIDI tracks/events/parts, recording and editors,
Standard MIDI File import/export, SysEx parameter recording, expression maps,
VST Note Expression, MPE input devices, MIDI effects, synchronization, and a
Score Editor with separate notation documentation. [C-012]

Nuendo 15 adds easier handling of registered and assignable RPN/NRPN controllers
from MIDI 2.0. This is **not** evidence of a complete MIDI 2.0/UMP host; profiles,
property exchange, endpoint discovery, and end-to-end UMP persistence remain
**UNKNOWN**. [C-012]

MPE can feed per-note expression; VST3 defines Note Expression, but exact
translation behavior for every plugin and interchange format was not tested.
[C-012, C-023]

## 8. Routing, mixer, automation, and control

Nuendo provides input/output buses, child buses, group and FX channels, folder
tracks with optional summing group channels, VCAs, Control Room/cue channels,
external instruments/effects, sends, sidechains, and mono through surround/3D
layouts. An audio-related channel supports up to 16 inserts; an audio channel
has eight sends. Post-fader insert placement is configurable. [C-008, C-022]

VST3 effects may expose multiple sidechain inputs; the routing panel chooses the
input and one or more pre/post-fader sources. VST3 instruments may also consume
audio sidechains. Plugin outputs can be activated from the control-panel menu.
Feedback-routing rules and the exact response to live bus-layout changes remain
undocumented. [C-022, C-023]

Automation includes read/write, touch-related parameter selection, Preview,
Latch/Cross-Over modes, per-track punch-out, Write on Play, copy/paste,
automation passes, and searchable parameter assignment. Nuendo 15.0.30 also
documents MIDI Remote API 1.3 and EuCon fixes. [C-013]

Controller integration includes Quick Controls, EuCon-facing behavior, MIDI
Remote scripts, ADR API, WAAPI in Game Audio Connect, OSC object-position
control, and traditional synchronization/timecode facilities. [C-027, C-030,
C-031, C-032, C-033]

## 9. Recording, comping, and media handling

Punch, cycle, pre-record/recovery, take lanes, comping, multitrack Track
Versions, monitoring, and Control Room/cue routing are documented. The lane
model preserves cycle takes; comping creates an active composite, while source
takes remain available until explicitly cleaned/bounced. [C-005, C-010]

The project references media and creates Audio, Clip Packages, Edits, Images,
Network, Track Pictures, and Auto Saves folders as required. Prepare Archive
gathers external audio/video; Back up Project can copy required media, minimize
files, remove unused media, flatten DOP, or exclude video/mixdowns. Copy-
protected VST Sound content is not embedded. [C-004, C-010]

Post media handling includes field-recorder import/metadata, MXF OP1a/OP-Atom,
AAF-linked MXF, video import/export, cut detection, timecode/frame-rate and
pull-up/down, asset relinking, and cue-sheet export. [C-011, C-029, C-034]

## 10. Instruments, effects, content, and native devices

Nuendo ships Steinberg VST effects/instruments, MIDI effects, samplers, pattern
and drum tools, modulators, VST MultiPanner, internal Dolby Atmos and MPEG-H
renderers, Analyzer Track, and VST Sound libraries. Inventory breadth is not an
architecture claim. [C-014, C-033]

Nuendo 15 documents WaveLab Go and SpectraLayers Go as ARA/audio extensions,
stock-effect UI scaling, stem separation, PitchShifter, UltraShaper, a pattern
sequencer, expression-map redesign, and MediaBay hot swap. ARA is treated as an
extension boundary, not another general plugin format. [C-014]

Content installation is managed with Steinberg Library Manager and `.vstsound`
files; plugin-owned sample/library asset management remains plugin-specific.
[C-014, C-018]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means no affirmative current Nuendo-host evidence was found; it does
not assert impossibility.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **DOCUMENTED:** 64-bit only; disabled by default. Apple-Silicon requires whole-host Rosetta; native mode cannot load it. Intel-mac behavior in the current article is not separately stated. | **DOCUMENTED:** Win x64 can enable it; Windows Arm cannot. | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Nuendo 15 current manual/support | Deprecated legacy host path; enabling triggers an immediate scan; migration to VST3 urged. | C-015, C-016, C-017; S-004, S-007, S-008, S-013 |
| VST3 | **DOCUMENTED:** Intel macOS; Apple-Silicon native accepts Apple-Silicon/Universal VST3, while Rosetta is the compatibility mode for Intel components. | **DOCUMENTED:** x64; WoA Arm64EC admits many x86/x64 VST3s, with documented exceptions. | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Nuendo 15; VST3 SDK 3.8.1 context | Primary current format; effects/instruments/modulators; 64-bit plugins only. | C-015, C-017; S-004, S-005, S-010, S-013 |
| AUv2 | **UNKNOWN:** no affirmative current Nuendo host statement located | **UNKNOWN:** format is macOS-oriented, but no Nuendo support conclusion inferred | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Current manual searched | Do not infer unsupported solely from manual silence. | C-040; S-004 |
| AUv3 | **UNKNOWN:** no affirmative current Nuendo host statement located | **UNKNOWN:** no affirmative statement | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Current manual searched | SDK repository contains wrappers; that does not prove Nuendo hosting. | C-040; S-004, S-005 |
| AAX | **UNKNOWN:** no affirmative current Nuendo host statement located | **UNKNOWN:** no affirmative current Nuendo host statement located | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Current manual searched | VST3 SDK wrapper availability is not Nuendo host support. | C-040; S-004, S-005 |
| CLAP | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Current manual searched | No affirmative Nuendo 15 evidence found. | C-040; S-004 |
| LV2 | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Current manual searched | No affirmative Nuendo 15 evidence found. | C-040; S-004 |
| LADSPA | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Current manual searched | No affirmative Nuendo 15 evidence found. | C-040; S-004 |
| DSSI | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Current manual searched | No affirmative Nuendo 15 evidence found. | C-040; S-004 |
| JSFX | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Current manual searched | No affirmative Nuendo 15 evidence found. | C-040; S-004 |
| DirectX/DXi | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Current manual searched | No affirmative current evidence; historical support was not imported into current scope. | C-040; S-004 |
| Rack Extension | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Current manual searched | No affirmative Nuendo 15 evidence found. | C-040; S-004 |
| Product-native/other | **DOCUMENTED:** ARA/audio extensions and VST Sound content ecosystem | **DOCUMENTED:** ARA/audio extensions; WoA article affirms ARA | `NOT_APPLICABLE:no current Nuendo Linux build` | `NOT_APPLICABLE:no Nuendo mobile/web edition` | Nuendo 15 | ARA is an audio-extension boundary; VST Sound is library/content packaging, not a general DSP plugin ABI. | C-014, C-017; S-002, S-004, S-010 |

### 11.2 Discovery, scanning, validation, and recovery

VST3 uses standard locations (`C:\Program Files\Common Files\VST3` and
system/user `Library/Audio/Plug-ins/VST3`). VST2 has multiple customary paths;
Nuendo exposes add/delete/reset path controls for VST2 only. [C-018]

At startup Nuendo adds found plugins to a recreated Default collection. New
plugins are discovered on scan/restart; VST2 enablement causes an immediate,
blocking scan. The manager can scan new and blocked plugins, use Shift for a
full rescan, hide plugins, maintain one active collection, search/sort, remove
unavailable entries from user collections, and export a system/plugin report.
[C-019]

The Blocklist contains installed plugins Nuendo did not load because of crash or
stability risk. A 64-bit plugin can be selected and rescanned/reactivated;
32-bit plugins cannot, because Nuendo 15 supports 64-bit plugins only. [C-019]

**UNKNOWN:** scan cache storage/invalidation, scanner process, timeout, signing
checks, duplicate class-ID/name/vendor rules, canonical VST3 bundle resolution,
quarantine persistence, and whether a crash during scanning restarts at the
next item. The manual, support articles, and release notes did not disclose
them. [C-020]

### 11.3 Runtime isolation and compatibility

No public source establishes in-process versus separate-process execution,
per-plugin sandboxing, IPC, or an automatic plugin restart boundary. Steinberg
documents third-party plugins causing ASIO overloads, freezes, and whole-app
crashes. **INFERENCE:** failure containment is incomplete; this does not prove
literal in-process execution. [C-021]

Nuendo has no documented built-in 32-to-64-bit bridge. On Apple Silicon, native
mode accepts native/Universal VST3; Intel/VST2 compatibility requires launching
Nuendo itself under Rosetta. On Windows Arm, Arm64EC allows many x86/x64 VST3s;
VST2 is excluded, and the 2026 article notes then-current iLok-protected plugin
failures. [C-015, C-017]

Code-signing, notarization validation, entitlement restrictions, plugin
filesystem/network sandboxing, and malicious-plugin containment are
**UNKNOWN**. [C-036]

### 11.4 Host/plugin processing contract

Nuendo documents VST effects and instruments, plus VST modulators in the
manager. Effects occupy up to 16 serial inserts per audio-related channel;
channels expose eight sends. VST3 effects can expose multiple sidechain inputs,
VST3 instruments can receive audio sidechains, and plugin outputs can be
activated. Inserts work on audio, groups, instruments, FX, buses, and outputs;
multichannel plugins must match the bus width. [C-022]

The host supplies tempo/timing to VST2.0+ plugins, compensates reported plugin
delay across the path, distinguishes deactivation (processing terminates) from
bypass (processing continues for crackle-free comparison), and can suspend
VST3 processing on silence. That suspension option is enabled by default but a
2026 support notice recommends disabling it for affected third-party plugins.
[C-022, C-024, C-035]

DOP can render installed VST effects at event/clip/range scope, but the manual
warns not every plugin suits offline processing. Tail length is a user render
setting, not evidence of VST tail-query use. [C-024, C-025]

**UNKNOWN:** Nuendo-specific block-size guarantees, sample offsets for plugin
parameter/event delivery, VST3 ramp fidelity, MIDI/event bus multiplicity,
dynamic I/O renegotiation, tail querying, silence flags under all paths,
offline determinism, and host behavior for malformed latency changes. The VST3
SDK defines capabilities; capability is not Nuendo conformance. [C-023]

### 11.5 Parameters, automation, state, presets, and project recall

The common control panel offers read/write automation, host Quick Controls,
A/B settings, presets, bypass/deactivate, sidechain routing, and output
activation. VST3 plugins that opt in can assign a parameter directly to Quick
Controls. Effect A/B settings and Quick Control assignments are saved with the
project. Presets can be loaded/saved/defaulted; host VST preset paths are
documented. [C-024]

DOP saves process stacks and settings with the project and preserves them in
track archives, project backups, network collaboration, and cross-project copy.
Unavailable DOP plugins remain visible as `Not available`. DAWproject exchanges
VST3 inserts and insert/instrument parameter automation. [C-025, C-029]

**UNKNOWN:** realtime-insert missing-plugin placeholder semantics, opaque state
chunk versus parameter-state serialization, parameter stable-ID migration,
asset-reference rewriting, VST2-to-VST3 migration rules, corrupt-state
recovery, and forward/backward plugin-state compatibility. [C-026]

### 11.6 UI, diagnostics, and failure modes

Nuendo can show a plugin-provided control panel or generic editor, scale effect
UIs, permit dynamic resizing per third-party plugin, hide or close all plugin
windows, and add third-party plugin pictures to MediaBay. Nuendo 15 states that
stock effect UIs are user-scalable. Headless/no-editor behavior is **UNKNOWN**.
[C-024, C-023]

Diagnostics include the blocklist, scan/rescan state, plugin/system reports,
System Component Information, release-note fixes, and support guidance for a
VST3 smart-processing crash/performance issue. There is no documented
per-plugin crash console or restart-in-place. [C-019, C-021, C-035]

## 12. Extensibility and integration

MIDI Remote API 1.3 uses ES5 JavaScript to define hardware ports, a surface
model, and host mappings for Cubase/Nuendo. Nuendo also exposes ADR API for
third-party ADR systems, WAAPI integration for Wwise preview, Game Audio
Connect, OSC renderer control, ARA audio extensions, command/key mappings, and
remote-control/Quick Control surfaces. [C-027]

The VST3 SDK is the public plugin/device-authoring boundary, not a Nuendo engine
SDK. Steinberg's developer portal labels Game Audio Connect proprietary. No
primary source for a general project-model, audio-engine, or unrestricted user
scripting API was found. [C-028, C-037]

Stability/versioning commitments for MIDI Remote, ADR API, Game Audio Connect,
or internal project APIs beyond published API/version pages are **UNKNOWN**.
[C-028]

## 13. Project format, persistence, interoperability, and collaboration

`.npr` is a proprietary central project file referencing media. Auto Save writes
rotating `.bak` copies of unsaved project files but does not copy Pool media;
Save New Version, Revert, Prepare Archive, and Back up Project provide distinct
durability operations. Opening a project in a version missing newer functions
may lose that data on save. Projects above 2 GB require Nuendo 13.0.30+.
[C-004, C-043]

Interchange is explicitly capability-scoped: [C-029]

- **DAWproject:** audio/video/MIDI; audio/instrument/group/FX/marker/folder
  tracks; output channels; volume/pan/channel-strip/mute/sends/color; routing;
  automation; and VST3-only inserts.
- **AAF:** tracks/events with referenced or embedded media and configurable
  positions; export may render otherwise unreferenced realtime-effect audio.
- **OMF:** audio/fades/edits, with optional clip gain; no MIDI or video media.
- **AES31:** audio references, fades, and first marker track; no MixConsole,
  automation, or MIDI.
- **ADM:** BWF/ADM, MPF, and MXF/S-ADM import; ADM BWF export, with MPEG-H export
  through its renderer.
- **Other documented boundaries:** Standard MIDI Files, track archives, cue
  sheets, MXF, EDL, and TTAL dubbing scripts.

MusicXML and DDP behavior were not established from the retained current Nuendo
manual sections and remain **UNKNOWN**; absence is not an unsupported verdict.
[C-029]

Peer-to-peer Nuendo networking shares MIDI, video, audio, markers, and
instrument tracks, but not MixConsole settings; all peers must use the same
Nuendo version. It supports project/track read-write permissions, LAN discovery,
manual WAN peers, disconnected loading, and merges. Steinberg explicitly says
direct Internet transport is not secure and recommends VPN. [C-030]

Game Audio Connect separately supports Perforce-controlled projects/assets.
VST Connect is documented as an included remote-recording application, but its
separate manual was not needed to establish the core decision. [C-027, C-031]

## 14. Delivery, live, post-production, and specialized workflows

Video/post surfaces include timecode/frame-rate and pull settings, MXF OP1a
video import, video cut detection, EDL ReConform, field-recorder matching,
marker/cue-sheet export, video rendering with encoding/resolution choices, and
burned-in ADR marker text. [C-011, C-034]

ADR provides marker-driven rehearse/record/review, automatic or Free Run modes,
pre/post-roll, wipes/counts/text/timecode overlays, guide/M&E/mic track roles,
Control Room/cue signal switching, naming, a local-network Script Reader, and a
third-party ADR API. [C-032]

Game Audio Connect gives Wwise 2024+ preview/WAAPI audition, direct event or
music-segment render/export, iXML or `.amd` metadata, local/network engine
connection, and Perforce authentication. Exported music segments include tempo,
time signature, and marker semantics. [C-031]

Object audio uses an ADM Authoring model of beds and objects with static and
dynamic metadata. Nuendo documents internal/external Dolby Atmos, internal
MPEG-H, and external OSC renderers; ADM BWF preserves object structure and pan
automation. The internal Dolby renderer supports one instance, up to 128
objects, requires 48 kHz/512 samples, and renders documented monitor layouts;
external routing can use up to 118 objects after bed reservations. These are
vendor-documented limits, not independent certification. [C-033]

Delivery also includes surround/interleaved or split exports, loudness/true-
peak analysis, realtime/offline dialogue-intelligibility analysis, audio
mixdown, Quick Export, and ADM/MPEG-H masters. DDP and show-control behavior are
**UNKNOWN**; Nuendo Live is excluded. [C-034]

## 15. Performance, reliability, security, and accessibility

Resource controls include processing precision, multicore, ASIO-Guard, disk
preload, delay compensation, smart VST3 suspension, track freezing/rendering,
DOP, and plugin deactivation. Documented structural limits include 16 inserts,
eight sends, one internal Dolby renderer instance, and its object/layout
constraints; no workload benchmark was performed. [C-007, C-022, C-033, C-044]

Reliability surfaces include Auto Save, project versions/backups, media archive,
blocklist/rescan, plugin reports, System Component Information, older Nuendo 15
installers, and release notes. Steinberg supports only the latest release even
though older installers are posted. [C-035, C-043]

Security liabilities are explicit: third-party plugins can crash the app,
plugin isolation/signing checks are undocumented, and direct Nuendo WAN
collaboration is not secure without VPN. Perforce and Steinberg activation add
credential/trust dependencies but do not prove sandboxing. [C-021, C-030,
C-036]

Application accessibility guarantees, screen-reader/keyboard coverage,
telemetry/usage-logging defaults, plugin permission prompts, localization
coverage, update rollback semantics, and security-response commitments are
**UNKNOWN** in the retained evidence. [C-036, C-042]

## 16. Licensing, ecosystem, and implementation constraints

Nuendo is **INFERRED** to be proprietary, activation-controlled commercial
software from its required Activation Manager and Steinberg distribution; this
research did not interpret the product EULA. Game Audio Connect is listed by
Steinberg under proprietary technology. [C-039]

The VST3 SDK 3.8.1 snapshot is MIT-licensed. Steinberg says VST branding is
optional, but use of its name/logo must follow usage guidelines; wrappers in
the SDK do not grant Nuendo support for AAX/AU/AUv3. [C-037]

VST2 hosting is deprecated and disabled by default. The retained 2022 source
describes host discontinuation, but no current authoritative passage on who may
newly distribute VST2 plugins was found. That developer-license question is
**UNKNOWN** and requires counsel/current Steinberg terms; no legacy SDK should
be copied from an unverified source. [C-016, C-038]

Dolby, MPEG-H, OSC, ARA, Wwise/WAAPI, Perforce, codec, Apple, Microsoft, and
Steinberg trademarks/SDKs impose separate ecosystem terms. Product support or
file compatibility does not grant trademark, redistribution, certification, or
conformance rights. This dossier is not legal advice. [C-037, C-038]

## 17. Strengths, liabilities, and architecture lessons

**Strengths:** coherent post objects (markers, EDLs, ADR states, beds/objects),
revisable clip processing, explicit channel/sidechain controls, deep delivery
and interchange, architecture-mode compatibility guidance, and diagnostics.
These are high-value references for a post-focused DAW. [C-006, C-019, C-025,
C-029, C-031, C-032, C-033]

**Liabilities:** proprietary internals/project format, legacy VST2 migration,
no documented complete plugin fault isolation, format-dependent interchange,
same-version/network-security constraints, and unproven conformance/performance.
[C-009, C-016, C-021, C-029, C-030, C-036]

**Architecture lesson (INFERENCE):** Nuendo is most useful as a reference for
explicit domain models and capability boundaries, not as evidence for a hidden
engine implementation. A new DAW should copy neither terminology nor UI, and
should prototype the unresolved host/runtime contracts independently. [C-003,
C-009, C-023]

## 18. Transferable patterns

| Pattern | Problem / minimal clean-room mechanism | Evidence | Prerequisites / tradeoffs / risk | Disposition |
| --- | --- | --- | --- | --- |
| Marker-centered ADR | Typed range markers + attributes drive rehearse/record/review, overlays, routing states, and API views. | C-032 | Requires robust timecode, cue routing, permissions, schema migration; do not copy UI/expression. | `CANDIDATE` |
| Reversible clip process stack | Immutable source reference + ordered operation state + disposable rendered derivative + explicit flatten. | C-025 | Storage/cache invalidation and missing-processor semantics are hard; realtime parity unproven. | `CANDIDATE` |
| Capability-scoped plugin manager | Separate discovery, user visibility/collections, quarantine, full rescan, and diagnostics. | C-019, C-020 | Must add independently designed crash isolation, cache identity, signing policy, and auditability. | `CONDITIONAL` |
| Renderer abstraction for object audio | Beds/objects retain metadata; internal/external renderer adapters consume a validated object graph. | C-033 | Standards/licensing/conformance and monitor routing are substantial; metadata must not collapse into channel automation. | `CANDIDATE` |
| Explicit architecture modes | Surface plugin ABI/architecture limitations by host mode rather than silently bridging. | C-017 | Compatibility UX burden; prefer per-plugin isolation/bridging only after security prototype. | `CANDIDATE` |
| Interchange capability profiles | Declare exactly which tracks, routing, automation, media, and plugin types each format carries. | C-029 | Round-trip loss must be previewed/tested; format names alone mislead. | `CANDIDATE` |
| Asset identity bridge | Stable asset metadata links DAW project, middleware, preview, render, and version-control state. | C-031 | Proprietary integrations and credentials; define an open internal identity model. | `CONDITIONAL` |
| Same-project collaboration permissions | Project/track read-write permissions plus merge/disconnected states. | C-030 | Nuendo's unauthenticated WAN pattern is unsuitable; require encrypted/authenticated transport and deterministic conflict semantics. | `CONDITIONAL` |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject legacy-format enablement as a long-term architecture:** VST2 is
  disabled by default and excluded on current native Arm modes; preserving it
  creates migration and test debt. Reopen only for a quantified legacy-customer
  requirement. [C-016, C-017]
- **Reject “blocklist equals sandbox”:** documented whole-application crashes
  contradict complete containment. Reopen after a process/crash probe. [C-021]
- **Reject direct unauthenticated WAN collaboration:** Steinberg itself says the
  connection is not secure and recommends VPN. [C-030]
- **Reject proprietary `.npr` reverse engineering in this wave:** internals are
  unnecessary to learn from public workflow behavior and outside the clean-room
  boundary. [C-009]
- **CURIOSITY_NO_GO — duplicate Cubase feature census:** low novelty and violates
  the assigned product boundary; only shared constraints were retained.
- **CURIOSITY_NO_GO — exhaustive bundled-plugin inventory:** low architecture
  value and high transcription cost.
- **CURIOSITY_NO_GO — secondary forum crash anecdotes:** official support
  already establishes the material failure mode; anecdotes would not prove
  internals.
- **CURIOSITY_NO_GO — historical VST2 SDK mirrors:** legal/provenance risk and no
  need to answer current host behavior.
- **CURIOSITY_NO_GO — marketing benchmark/conformance claims:** no safe dynamic
  fixture in this documentary wave; vendor “fully compliant” language is not an
  independent certification.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / check | Documentary result | Status / later probe |
| --- | --- | --- |
| H1: Nuendo 15 removed VST2. | Current support says it remains, disabled by default, with mode/OS limits. | **FALSIFIED**; C-016/C-017. |
| H2: A blocklist proves plugins run outside the host. | No process statement; official support documents application crashes. | **REJECTED/UNKNOWN**; process-tree + crash fixture needed, C-020/C-021. |
| H3: “Supports VST3” proves the full host contract. | Manual proves selected sidechain/UI/preset/delay behaviors; sample-accurate automation, tail query, dynamic renegotiation, and corrupt state remain unproven. | **FALSIFIED AS OVERBROAD**; C-022/C-023. |
| H4: VST3 format capability proves Nuendo behavior. | SDK defines optional capabilities; Nuendo docs confirm only a subset. | **FALSIFIED AS METHOD**; C-023/C-037. |
| H5: DAWproject preserves any hosted plugin. | Current manual limits exchanged inserts to VST3. | **FALSIFIED**; C-029. |
| H6: Internal Atmos rendering removes setup constraints. | It requires 48 kHz, 512-sample buffer, supported layouts, and one instance. | **FALSIFIED**; C-033. |
| H7: All MIDI 2.0 is supported. | Current feature text establishes RPN/NRPN controller support, not full UMP/profiles/property exchange. | **UNPROVEN**; C-012. |
| H8: Bypass and deactivate are equivalent. | Manual says bypass continues processing; deactivate terminates it. | **FALSIFIED**; C-024. |
| Counterevidence search: non-VST formats. | Current manual and support evidence affirm VST2/VST3/ARA but yielded no affirmative AU/AAX/CLAP/LV2/etc. host statement. | **UNKNOWN, not unsupported**; C-040. |
| Counterevidence search: realtime missing plugin. | DOP `Not available` is documented; no equivalent realtime-insert passage retained. | **UNKNOWN**; C-026. |

The later interoperability harness should distinguish: file discovered; scan
completed; class listed; instance created; audio/event buses negotiated;
automation/state recalled; offline/render matched; crash contained. Passing an
earlier step must never imply the later steps. [C-020, C-023, C-026]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current snapshot is Nuendo 15.0.30 (2026-06-03), first released 2026-03-25, for qualified macOS Intel/Apple Silicon, Windows x64, and Windows Arm. | Nuendo 15 at cutoff | S-001 | Direct download/version/OS matrix. | Availability is not a performance qualification. |
| C-002 | DOCUMENTED | High | Nuendo 15 is positioned for audio post and documents automation, dialogue analysis, video/MXF, ADR, MPEG-H, and DAWproject additions. | Nuendo 15 | S-002, S-003 | Direct current feature and release text. | Vendor positioning, not market-share evidence. |
| C-003 | INFERENCE | Medium | Nuendo and Cubase have substantial shared lineage/surfaces, while exact source/module sharing is unknown. | Product-family boundary | S-004, S-007, S-014 | Shared documentation/API/support terminology. | Similar surfaces could have divergent implementations. |
| C-004 | DOCUMENTED | High | `.npr` is a central project referencing media; project folders, sample/timecode setup, autosave, archive, backup, and compatibility caveats are documented. | Nuendo 15 | S-004 | Project Handling and Saving sections. | Binary serialization/schema remains unknown. |
| C-005 | DOCUMENTED | High | Linear/musical tracks, events/parts, cycle-take lanes/comping, and Track Versions form the editing model. | Nuendo 15 | S-003, S-004 | Lanes/Track Versions manual sections and current comping fix. | Does not enumerate every editor/tool. |
| C-006 | DOCUMENTED | High | Range/group/warp editing, reversible DOP, and EDL ReConform are supported. | Nuendo 15 | S-004 | DOP and ReConform sections. | Runtime quality not measured. |
| C-007 | DOCUMENTED | High | Engine controls expose 32/64-bit-float processing, multicore, ASIO-Guard, disk preload; VST2 processing remains 32-bit precision. | Nuendo 15 | S-004 | Audio System page. | Internal accumulator/thread topology unknown. |
| C-008 | DOCUMENTED | High | Routing includes buses/groups/FX/Control Room, whole-path plugin delay compensation, record-latency adjustment, and configurable volume-automation interval. | Nuendo 15 | S-004 | Audio Effects/Audio System sections. | No measured latency/automation accuracy. |
| C-009 | UNKNOWN | High | Audio-graph, thread/scheduler, plugin process placement, renderer internals, and `.npr` schema are not publicly established. | Proprietary internals | S-001, S-003, S-004 | Current manual/release/download evidence inspected. | MediaBay server proves one service, not plugin placement. |
| C-010 | DOCUMENTED | High | Punch/cycle/pre-record, takes/comping, Pool media, archive/backup, and relinking are documented. | Nuendo 15 | S-004 | Recording, lanes, Pool, Saving sections. | Recovery success not reproduced. |
| C-011 | DOCUMENTED | High | Current post media handling includes MXF/video, field-recorder workflows, cut detection, frame/timecode, pulls, and ReConform. | Nuendo 15 | S-002, S-004 | Current feature and manual post sections. | Codec availability can be platform-specific. |
| C-012 | DOCUMENTED | High | MIDI/SMF, SysEx, score, expression maps, Note Expression, MPE, and MIDI-2-derived RPN/NRPN support are documented; complete MIDI 2.0 is not. | Nuendo 15 | S-002, S-004 | Exact current feature/manual sections. | UMP/profiles/property exchange not established. |
| C-013 | DOCUMENTED | High | Automation includes multiple film-mix modes, passes, punch/preview, copy/paste, Write on Play; MIDI Remote API 1.3 and EuCon behavior are documented. | Nuendo 15 | S-002, S-003, S-004, S-014 | Current docs. | Surface protocol timing not measured. |
| C-014 | DOCUMENTED | High | Steinberg VST devices/content and ARA/audio extensions are integrated; VST Sound uses Library Manager. | Nuendo 15 | S-001, S-002, S-004, S-010 | Download and manual. | ARA does not imply arbitrary plugin ABI support. |
| C-015 | DOCUMENTED | High | Nuendo 15 hosts 64-bit VST2/VST3 effects/instruments; the manager also exposes VST modulators. | Nuendo 15 | S-004, S-007 | Direct manual/support. | Full format contract not implied. |
| C-016 | DOCUMENTED | High | VST2 is disabled by default, can be re-enabled on qualified modes, and is marked for future discontinuation. | Nuendo 14/15 | S-007, S-008 | Current article controls status; 2022 source supplies deprecation history. | 2022 “24 months” forecast was not fully realized by 2026. |
| C-017 | DOCUMENTED | High | Apple-Silicon native accepts native/Universal VST3 and not VST2; Rosetta is whole-host compatibility. WoA uses Arm64EC for many x86/x64 VST3s, excludes VST2, and had iLok caveats. | Nuendo 15 / current modes | S-007, S-010, S-013 | Official compatibility pages. | Individual plugins still need qualification. |
| C-018 | DOCUMENTED | High | VST3 has standard OS paths; VST2 has manager-configurable/default/custom paths. | Windows/macOS | S-004, S-011, S-012 | Official path and manager docs. | macOS path article is older but consistent with current manager. |
| C-019 | DOCUMENTED | High | Manager supports startup/new scans, full rescan, blocklist/reactivation, hide, one active collection, VST2 enable/path control, and diagnostic reports. | Nuendo 15 | S-004, S-007 | VST Plug-in Manager sections. | No safe runtime reproduction. |
| C-020 | UNKNOWN | High | Cache, duplicate identity, validator/scanner process, timeout, quarantine persistence, and scan-crash continuation are not documented. | Nuendo 15 host | S-004, S-007, S-009 | Targeted manager/support search. | Must not infer from VST3 SDK validator. |
| C-021 | INFERENCE | Medium-high | Plugin failure containment is incomplete, but literal in-process execution is unknown. | Nuendo/Cubase current host | S-004, S-009 | Vendor documents third-party-caused freezes/app crashes. | A separate process could still cause propagated host failure. |
| C-022 | DOCUMENTED | High | Host supports 16 inserts, eight sends, buses/groups, VST3 effect/instrument sidechains, multiple sidechain inputs, output activation, tempo sync, and multichannel placement. | Nuendo 15 | S-004 | Audio Effects/Sidechain sections. | Exact live dynamic-I/O renegotiation unknown. |
| C-023 | UNKNOWN | High | Sample-offset parameter/event delivery, ramp fidelity, event-bus multiplicity, dynamic-I/O lifecycle, tail query, malformed latency handling, and headless behavior are unproven. | Nuendo 15 VST3 host | S-004, S-005 | Product docs compared with format capabilities. | VST3 format capability is not host conformance. |
| C-024 | DOCUMENTED | High | Host UI exposes vendor/generic editor, scaling/resizing, automation, Quick Controls, A/B project state, presets, bypass/deactivate, and smart suspend. | Nuendo 15 | S-002, S-004, S-009 | Effect Control/Audio Effects/support sections. | Parameter IDs/ranges/text fidelity not documented. |
| C-025 | DOCUMENTED | High | DOP is non-destructive, persisted, portable across listed project mechanisms, tail-configurable, and keeps unavailable processes visible. | Nuendo 15 | S-004 | Direct DOP section. | Applies to DOP, not necessarily realtime inserts. |
| C-026 | UNKNOWN | High | Realtime missing-plugin placeholders, state-chunk representation, stable-ID migration, asset rewriting, corrupt-state recovery, and VST2→VST3 migration are not established. | Nuendo 15 projects | S-004 | Project, presets, and manager sections searched. | DOP `Not available` cannot be generalized. |
| C-027 | DOCUMENTED | High | MIDI Remote 1.3 ES5 scripts, ADR API, Game Audio Connect/WAAPI, OSC, ARA, Quick Controls, and command mappings are bounded integrations. | Nuendo 15 | S-003, S-004, S-006, S-014 | Current API/product docs. | Each has distinct scope/licensing. |
| C-028 | UNKNOWN | Medium-high | No general project/audio-engine scripting API or durable stability commitment was found. | Nuendo 15 | S-004, S-006, S-014 | Targeted extension-source review. | An undocumented/private API may exist but is unusable as public reference. |
| C-029 | DOCUMENTED | High | DAWproject (VST3 inserts only), AAF, OMF, AES31, ADM, MIDI, MXF, EDL, TTAL, archives, and cue sheets have explicit differing transfer scopes. | Nuendo 15 | S-002, S-004 | Interchange sections. | MusicXML/DDP not established; round trips not tested. |
| C-030 | DOCUMENTED | High | P2P project sharing requires same Nuendo version, omits MixConsole, has project/track permissions, and is insecure directly over Internet without VPN. | Nuendo 15 | S-003, S-004 | Networking and current permission fix. | Authentication/encryption internals not assessed. |
| C-031 | DOCUMENTED | High | Game Audio Connect supports Wwise preview/WAAPI, asset/music export, metadata, network connection, and Perforce. | Nuendo 15 | S-004, S-006 | Game Audio Connect section/developer portal. | Wwise/Perforce internals and licenses excluded. |
| C-032 | DOCUMENTED | High | ADR is marker-driven with dedicated transport states, overlays, signal switching, Script Reader, and ADR API. | Nuendo 15 | S-002, S-004 | ADR/current feature sections. | End-to-end booth workflow not observed. |
| C-033 | DOCUMENTED | High | Nuendo authors beds/objects and ADM metadata with internal/external Dolby Atmos, MPEG-H, and OSC renderers; key renderer limits are documented. | Nuendo 15 | S-002, S-003, S-004 | Object Audio/ADM sections. | Vendor “compliant” language is not independent certification. |
| C-034 | DOCUMENTED | High | Delivery includes video rendering/ADR overlays, surround/ADM/MPEG-H, loudness/true-peak, dialogue analysis, and audio export. | Nuendo 15 | S-002, S-004 | Current feature/manual delivery sections. | DDP/show control remain unknown. |
| C-035 | DOCUMENTED | High | Reliability controls include autosave/backups, blocklist/reports, older installers, and a documented smart-suspend plugin crash workaround. | Nuendo 15 | S-001, S-003, S-004, S-009 | Official sources. | Controls do not prove crash containment. |
| C-036 | UNKNOWN | High | Plugin signing/sandbox permissions, telemetry defaults, accessibility guarantees, localization, and security-response/rollback semantics are unestablished. | Nuendo 15 | S-001, S-004, S-009, S-010 | Retained evidence inspected. | Separate policy/accessibility docs may exist. |
| C-037 | DOCUMENTED | High | VST3 SDK 3.8.1 is MIT-licensed; branding is optional but trademark use follows guidelines. | SDK commit at cutoff | S-005, S-006 | Immutable commit metadata and official README. | SDK license does not grant third-party trademarks/certification. |
| C-038 | UNKNOWN | High | Current rights for a new developer to distribute VST2 were not established from retained primary text. | VST2 legal boundary | S-008 | Host discontinuation article is not a distribution license. | Requires current authoritative terms/counsel. |
| C-039 | INFERENCE | Medium-high | Nuendo is proprietary/activation-controlled; auxiliary Steinberg services are ecosystem dependencies. | Product distribution | S-001, S-006 | Activation requirement and proprietary developer listing. | Product EULA was not interpreted. |
| C-040 | UNKNOWN | High | AUv2/AUv3/AAX/CLAP/LV2/LADSPA/DSSI/JSFX/DX/DXi/Rack Extension hosting was not affirmatively established. | Nuendo 15 | S-004, S-005 | Current manual affirms VST2/VST3; targeted format review. | Absence from one manual is not proof of unsupported behavior. |
| C-041 | UNKNOWN | Medium | No current public Nuendo feature-tier matrix was found beyond “Nuendo 15.” | Edition scope | S-001, S-002 | Current product/download pages. | Education/enterprise licensing may differ without feature changes. |
| C-042 | UNKNOWN | High | Product accessibility support was not established. | Nuendo 15 UI | S-004 | Operation Manual inspected; documentation accessibility is not application accessibility. | Requires keyboard/screen-reader audit and vendor accessibility statement. |
| C-043 | DOCUMENTED | High | Older Nuendo 15 installers are posted, but Steinberg says only the latest release is supported. | Nuendo 15 lifecycle | S-001, S-003 | Direct download/release pages. | Rollback project compatibility not guaranteed. |
| C-044 | UNKNOWN | High | Practical scaling/performance, determinism, and dropout recovery are unmeasured; only structural controls/limits are documented. | Nuendo 15 | S-004 | No binaries executed under documentary budget. | Requires controlled benchmark projects. |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Vendor statements establish what the
vendor documents, not independent runtime behavior.

### S-001 — Nuendo 15 Downloads

- **Publisher/kind:** Steinberg; official current download/support matrix.
- **URL:** <https://o.steinberg.net/en/support/downloads/nuendo_15.html>
- **Scope/passage:** Nuendo 15.0.30/date; first release; macOS/Windows/Windows
  Arm matrix; Activation/Library/MediaBay requirements; older installers and
  latest-only support.
- **Claims:** C-001, C-014, C-035, C-039, C-041, C-043.
- **Limitations:** installer availability is not runtime qualification; page has
  one apparent copy error (“install Cubase”) in an older-installer paragraph.
- **Selection rationale:** canonical version/OS origin, preferable to retailer
  or review summaries.

### S-002 — New in Nuendo 15

- **Publisher/kind:** Steinberg; official current feature page.
- **URL:** <https://www.steinberg.net/nuendo/new-features/>
- **Scope/passage:** post positioning; automation, Analyzer, channel conversion,
  video/MXF, ADR, ARA, MPEG-H imports, plugin scaling, DAWproject.
- **Claims:** C-002, C-011–C-014, C-024, C-029, C-032–C-034.
- **Limitations:** promotional language and no independent quality/conformance
  measurement; retrieved from the page's public initial-state payload because
  the prose is client-rendered.
- **Selection rationale:** current release feature origin; used only where the
  operation manual/release notes corroborate material interfaces.

### S-003 — Nuendo 15 Release Notes

- **Publisher/kind:** Steinberg; official maintenance notes.
- **URL:** <https://www.steinberg.net/nuendo/release-notes/15/>
- **Scope/passage:** 15.0.30/15.0.21 fixes for routing, comping, ARA/DOP UI,
  S-ADM MXF, project sharing, EuCon, MIDI Remote 1.3, video rendering, MediaBay
  server.
- **Claims:** C-002, C-005, C-009–C-013, C-030, C-033, C-035, C-043.
- **Limitations:** defect fixes prove affected public behavior/failure, not root
  cause; retrieved from public initial-state payload.
- **Selection rationale:** current adversarial evidence that tempers feature
  claims and reveals real failure surfaces.

### S-004 — Nuendo 15 Operation Manual

- **Publisher/kind:** Steinberg Documentation Team; official versioned manual.
- **Base URL:** <https://www.steinberg.help/r/nuendo/15.0/en>
- **Precisely retained sections/deep links:**
  - [Audio System / introductory manual context](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/introduction/documentation_and_help_about_cubase_c.html)
  - [VST Plug-in Manager](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/installing_and_managing_plugins/installing_and_managing_plugins_plugin_manager_window_r.html)
  - [Effect Control Panel](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/audio_effects/audio_effects_effect_control_panel_r.html)
  - [Plugin delay / inserts](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/audio_effects/audio_effects_plugin_delay_compensation_c.html)
  - [Direct Offline Processing](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/direct_offline_processing/direct_offline_processing_c.html)
  - [Project files](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/project_handling/project_handling_about_project_files_c.html) and [saving](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/project_handling/project_handling_saving_project_files_c.html)
  - [Lanes/Track Versions](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/track_handling/track_handling_trackversions_c.html)
  - [Game Audio Connect](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/game_audio_connect/game_audio_connect_c.html)
  - [ADR](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/adr/adr_c.html)
  - [Dolby Atmos/Object Audio](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/surround_sound/surround_sound_adm_authoring_dolby_atmos_about_c.html)
  - [ADM/AAF/AES31](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/exchanging_files_with_other_applications/exchanging_files_with_other_applications_adm_files_c.html)
  - [DAWproject/MXF/OMF/TTAL](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/exchanging_files_with_other_applications/exchanging_files_with_other_applications_dawproject_files_c.html)
  - [Networking](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/networking/networking_c.html)
  - [ReConform](https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/reconform/reconform_introduction_c.html)
- **Relevant passages:** exact sections named above; host manager, routing/UI,
  project persistence, post, collaboration, and interchange claims.
- **Claims:** C-003–C-040, C-042–C-044 as mapped in the claims register.
- **Limitations:** client-rendered/lazy topics required a public browser render;
  no product binary was run. Manuals describe public contract, not internals.
- **Selection rationale:** canonical current product reference; preferable to
  old PDFs, tutorials, forum posts, and secondary reviews.

### S-005 — VST3 SDK 3.8.1 snapshot

- **Publisher/kind:** Steinberg Media Technologies; official public SDK source.
- **Immutable URL:** <https://github.com/steinbergmedia/vst3sdk/tree/3cdf9ca5d1f5b1b21e0a86832aa4abe55607bd96>
- **Scope/passage:** README “Welcome to VST SDK 3.8.x,” supported platforms,
  format capability list, validator/test host, MIT license/trademark guidance;
  commit is labeled VST3 SDK 3.8.1 dated 2026-08-11.
- **Claims:** C-023, C-037, C-040.
- **Limitations:** format specification/capabilities do not prove Nuendo host
  implementation; commit is unsigned per GitHub metadata.
- **Selection rationale:** immutable format-owner origin, preferable to plugin
  developer summaries.

### S-006 — Steinberg Developer Portal

- **Publisher/kind:** Steinberg; official developer boundary page.
- **URL:** <https://www.steinberg.net/developers/>
- **Scope/passage:** VST under MIT; Game Audio Connect under proprietary
  technologies; links to MIDI Remote and developer forum.
- **Claims:** C-027, C-028, C-031, C-037, C-039.
- **Limitations:** overview, not complete terms or API stability policy.
- **Selection rationale:** canonical ecosystem classification.

### S-007 — Using VST 2 Plug-ins in Cubase/Nuendo 14 and 15

- **Publisher/kind:** Steinberg Help Center; current product support article,
  updated 2026-06-05.
- **URL:** <https://helpcenter.steinberg.de/hc/en-us/articles/31858223176210-Using-VST-2-Plug-ins-in-Cubase-Nuendo-14-and-15>
- **Scope/passage:** disabled-by-default VST2, immediate scan on enable, VST2
  paths, Rosetta-only Apple-Silicon use, no Windows-Arm support.
- **Claims:** C-003, C-015–C-020.
- **Limitations:** product-family article; Intel macOS is not separately
  explained in the compatibility paragraph.
- **Selection rationale:** most current direct Nuendo VST2 status, preferred
  over the 2022 forecast.

### S-008 — VST 2 Discontinued

- **Publisher/kind:** Steinberg Help Center; deprecation announcement, updated
  2022-03-08.
- **URL:** <https://helpcenter.steinberg.de/hc/en-us/articles/4409561018258-VST-2-Discontinued>
- **Scope/passage:** transition to VST3 and announced host/plugin VST3-only
  direction.
- **Claims:** C-016, C-038.
- **Limitations:** its 24-month forecast conflicts with continuing qualified
  VST2 host support documented in 2026; it is not a VST2 distribution license.
- **Selection rationale:** retained to expose the deprecation origin and
  contradiction, not to override current support evidence.

### S-009 — Plug-in related performance issues and crashes

- **Publisher/kind:** Steinberg Help Center; official incident/workaround,
  updated 2026-01-07.
- **URL:** <https://helpcenter.steinberg.de/hc/en-us/articles/32365099396370-Plug-in-related-performance-issues-and-crashes>
- **Scope/passage:** third-party plugins can trigger ASIO overloads, freezes,
  and application crashes; disable default smart VST3 suspension as workaround.
- **Claims:** C-021, C-024, C-035, C-036.
- **Limitations:** no process/root-cause disclosure; does not identify all
  affected plugins.
- **Selection rationale:** strongest current primary counterevidence to an
  isolation inference.

### S-010 — About Steinberg products for Windows on Arm

- **Publisher/kind:** Steinberg Help Center; official compatibility article,
  updated 2026-06-04.
- **URL:** <https://helpcenter.steinberg.de/hc/en-us/articles/21829527504530-About-Steinberg-products-for-Windows-on-Arm>
- **Scope/passage:** Nuendo native WoA, Arm64EC, VST3/ARA, x86/x64 VST3
  compatibility, no VST2, iLok caveat, Arm ASIO requirements.
- **Claims:** C-014, C-017, C-036.
- **Limitations:** lists first compatible Nuendo as 14.0.20 and reports initial
  tests; not a universal plugin certification.
- **Selection rationale:** platform-owner/product-vendor origin for a material
  architecture bridge.

### S-011 — VST plug-in locations on Windows

- **Publisher/kind:** Steinberg Help Center; official path article, updated
  2025-07-10.
- **URL:** <https://helpcenter.steinberg.de/hc/en-us/articles/115000177084-VST-plug-in-locations-on-Windows>
- **Scope/passage:** required VST3 path; customary VST2 paths; Nuendo manager
  monitoring; plugin-owned content.
- **Claims:** C-018.
- **Limitations:** includes generic 32-bit bridging advice; current Nuendo 15
  manual explicitly supports 64-bit plugins only.
- **Selection rationale:** precise OS paths from the host vendor.

### S-012 — VST plug-in locations on Mac OS X and macOS

- **Publisher/kind:** Steinberg Help Center; official path article, updated
  2019-11-28.
- **URL:** <https://helpcenter.steinberg.de/hc/en-us/articles/115000171310-VST-plug-in-locations-on-Mac-OS-X-and-macOS>
- **Scope/passage:** system/user VST2 and VST3 locations and Nuendo VST2 path
  manager.
- **Claims:** C-018.
- **Limitations:** older than Nuendo 15 and Apple-Silicon transition; used only
  for paths corroborated by the current manual.
- **Selection rationale:** primary path reference; current manager supplies the
  version-specific behavior.

### S-013 — Cubase/Nuendo: Using the native Apple Silicon version

- **Publisher/kind:** Steinberg Help Center; official compatibility article,
  updated 2025-09-12.
- **URL:** <https://helpcenter.steinberg.de/hc/en-us/articles/4488195658002-Cubase-Nuendo-Using-the-native-Apple-silicon-version>
- **Scope/passage:** native mode accepts Apple-Silicon/Universal VST3 only;
  Rosetta for VST2/Intel compatibility; mode defaults and video/MPEX caveats.
- **Claims:** C-016, C-017.
- **Limitations:** family article spans older versions; current statements are
  bounded to Nuendo 12+ and cross-checked with S-007.
- **Selection rationale:** decisive architecture-mode source.

### S-014 — MIDI Remote API v1.3 Programmer's Guide

- **Publisher/kind:** Steinberg; official developer documentation.
- **URL:** <https://steinbergmedia.github.io/midiremote_api_doc/>
- **Scope/passage:** ES5 MIDI Remote scripts mediate hardware and
  Cubase/Nuendo; driver setup, surface layout, and host mapping.
- **Claims:** C-003, C-013, C-027, C-028.
- **Limitations:** controller API only, not general DAW scripting; API 1.3
  stability horizon not promised on the landing page.
- **Selection rationale:** direct API origin, preferred to controller-script
  examples or community mappings.

### Negative-source/access record

- Current Steinberg Help and feature pages initially returned client-rendered
  shells; the public page payload/browser-rendered text was used once the
  limitation was identified. No claim came from search snippets.
- The guessed VST license portal path returned 404; no repeated PDF/access
  retries were made.
- A bounded headless `--dump-dom` attempt timed out; the public rendered help
  content/API was then used without executing Nuendo or an installer.
- Searches yielded no affirmative current Nuendo host evidence for AU/AAX/CLAP/
  LV2/LADSPA/DSSI/JSFX/DX/DXi/Rack Extension, no general scripting API, and no
  realtime missing-plugin contract. These are retained negative results, not
  unsupported verdicts.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Decision impact | Safest next probe / fixture | Required access / owner |
| --- | --- | --- | --- | --- |
| Plugin process/isolation/crash recovery | Current manager, support, release, SDK docs; proprietary and no process statement. | Critical to security/reliability architecture. | Disposable VM; process-tree capture; benign VST3 that crashes scan, UI, and process callbacks; verify host/audio survival and restart. | Licensed Nuendo test seat + purpose-built signed fixture; unassigned prototype owner. |
| Scanner cache, duplicate IDs, quarantine persistence | Manager/path docs expose UX only. | Determines deterministic discovery and diagnosability. | Two benign VST3 bundles with same class ID/different path/version; corrupt bundle; timed scan; inspect only public logs/files created by test. | Disposable profile; format test fixtures; unassigned. |
| Full VST3 bus/event/automation contract | Product docs cover selected paths; SDK capability is not conformance. | Central to portable host architecture. | Matrix plugin exposing multi-audio/event buses, Note Expression, sample-offset automation, changing latency, dynamic buses, silence/tail, no editor. Compare realtime/offline. | Custom MIT-SDK fixture; unassigned. |
| Realtime plugin state/missing/corruption behavior | DOP missing state documented; realtime passage absent. | Project durability/migration risk. | Save presets/project, remove/upgrade/downgrade plugin, corrupt state in fixture-controlled data, reopen, restore plugin, compare IDs and assets. | Disposable projects/fixture; unassigned. |
| AU/AAX/CLAP/LV2/etc. status | Current Nuendo manual/support searched; no affirmative source. | Format breadth decision, lower than VST fidelity. | First ask Steinberg for current support matrix; only then attempt signed no-op plugins for legally available formats. | Vendor confirmation and legal SDK access; unassigned. |
| VST2 current developer distribution rights | Official deprecation/host sources are not license grants. | Legal ability to implement/ship legacy support. | Obtain current written Steinberg terms and counsel review; do not source SDK from mirrors. | Legal/vendor owner, not engineering. |
| Product signing, plugin trust, telemetry/privacy | Retained technical docs silent. | Security/privacy acceptance. | Vendor security/privacy questionnaire; inspect signed app and network behavior only in an authorized sandbox if later approved. | Security/privacy owner and licensed test seat. |
| `.npr` schema and migrations | Proprietary format; clean-room wave excludes binary investigation. | Internal format is not needed to adopt public patterns, but migration UX matters. | Behavioral round-trip corpus across supported Nuendo versions; compare visible results, not file internals. | Multiple licensed versions; clean-room test owner. |
| Performance/scaling/determinism | No binaries executed; structural limits only. | Realtime engine sizing and regression thresholds. | Controlled sessions varying tracks, buses, layouts, plugin latency/CPU, buffer, realtime/offline; record glitches/output hashes where meaningful. | Benchmark lab; unassigned. |
| Accessibility/localization | No current product accessibility statement retained. | Product inclusion and procurement risk. | Keyboard-only and screen-reader task audit across Project/MixConsole/plugin manager/ADR, plus vendor statement. | Accessibility specialist; unassigned. |
| MusicXML, DDP, show control | Not established in retained current sections. | Specialized delivery/interchange, moderate relevance. | Query exact current Steinberg support matrix/manual; test only if target users require it. | Product-requirements owner; unassigned. |

## 24. Curiosity pass and stop decision

Scoring: 0 (none) to 4 (highest). Cost 4 is most expensive.

| Follow-up thread | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Current VST manager/VST2 behavior | 4 | 4 | 4 | 2 | **PURSUED**; changed the false “VST2 removed” hypothesis. |
| Native Arm/Rosetta/Arm64EC modes | 4 | 3 | 3 | 1 | **PURSUED**; materially constrained bridging conclusions. |
| Plugin process/crash fixture | 4 | 4 | 4 | 4 | `CURIOSITY_NO_GO`: dynamic work outside documentary authority/budget; next prototype. |
| Current VST2 distribution-license archaeology | 3 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: no current grant found; legal/vendor inquiry has higher evidentiary value. |
| Cubase shared-feature comparison | 1 | 1 | 0 | 2 | `CURIOSITY_NO_GO`: duplicate sibling scope and low novelty. |
| Exhaustive stock plugin/content list | 1 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: inventory does not change architecture decision. |
| Secondary reviews/forums/videos | 1 | 1 | 1 | 2 | `CURIOSITY_NO_GO`: primary current docs cover material claims; cannot prove internals. |
| Historical Nuendo versions | 1 | 1 | 2 | 3 | `CURIOSITY_NO_GO`: current architecture decision would not change absent a migration-specific requirement. |
| MusicXML/DDP/show-control deep dive | 2 | 1 | 2 | 2 | `CURIOSITY_NO_GO`: lower decision value; reopen only from target-user requirement. |

**Gaps/contradictions after synthesis:** current VST2 support contradicts the
2022 24-month VST3-only forecast; vendor “fully compliant” immersive language
lacks independent certification; a blocklist coexists with documented app
crashes; VST3 format capabilities exceed the Nuendo-specific contract actually
proven. All are explicit above rather than silently harmonized.

**Stop decision:** `STOP_COVERAGE_AND_SATURATION`. Every required heading and
format row is complete; current identity, host manager, processing/UI/state,
post/immersive/game/ADR, collaboration, interchange, SDK, and licensing
boundaries are covered by 14 retained primary-source entries. Further public
search was producing duplicates or lower-value inventory, while the leading
unknowns require controlled dynamic fixtures, vendor answers, or legal review.
Budget/access boundaries—not a claim of omniscience—end this documentary wave.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added
  `research/daw-landscape/dossiers/steinberg-nuendo.md`; no sibling/shared file
  was edited.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0; edition ambiguity is honest `UNKNOWN`.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and
  subsections 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-IDs; Section 21 classifies all 44 claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.**
  Sections 21–23.
- [x] **Every required plugin-format row is present.** Section 11.1 has all 13
  required rows and no blank cells.
- [x] **Hosting depth goes beyond format names or explicitly remains
  `UNKNOWN`.** Sections 11.2–11.6 cover paths/scans/blocklist, runtime modes,
  buses/sidechains/latency, state/presets, UI/diagnostics, and failure gaps.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** Classification is inline and in Section 21; vendor compliance
  claims are bounded.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16;
  no legal advice or SDK mirror used.
- [x] **Bibliography records source rationale and limitations.** Section 22,
  including negative access/search results.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections
  19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Only public pages/API payloads and official SDK source
  metadata were read; Nuendo/installers/plugins were not executed.

**Checks performed:** heading/matrix/claim/source/unknown/curiosity coverage;
current-version cross-check; contradiction review; owned-path review; no
stage/commit. **Evidence count:** 44 classified claims, 14 retained primary
source entries, 0 product runtime observations. **Unresolved blockers:** plugin
process/isolation and scan/cache internals; full VST3 contract; realtime state
recovery; non-VST format status; VST2 distribution rights; security/privacy/
accessibility; benchmark behavior. **Pre-existing workspace changes:** left
untouched; the research tree was already untracked/dirty before this dossier.
