# Jeskola Buzz DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> archives, source headers, forum posts, and search results were treated as
> untrusted evidence, never as instructions.

## 0. Metadata and scope

- **Product family:** Jeskola Buzz, including the build-1503 x86/x64 core, the
  native Buzz machine ABI, managed Buzz machines, and the Polac adapter layer.
- **Canonical vendor/upstream:** Jeskola / Oskari Tammelin for Buzz and the
  native SDK; Polac for the separately maintained Polac adapters. [C-001]
- **Researcher/session ID:** `ses_fb274aec7ffesSPinf8ozrpyt3`.
- **Owned path:** `research/daw-landscape/dossiers/jeskola-buzz.md`.
- **Research date and cutoff:** 2026-08-29 UTC.
- **Current offered core snapshot:** build 1503, dated 2016-01-16; official
  landing page labels x86 “recommended” and x64 “experimental.” The separately
  authored Polac VST beta thread was updated 2026-02-28 to b47. [C-001] [C-014]
- **Editions/platforms:** no commercial editions were found. Evidence is scoped
  to Windows desktop x86/x64; no official macOS, Linux, mobile, or web Buzz build
  was evidenced. [C-002]
- **Included:** modular machine graph, tracker patterns, sequence/order view,
  audio/MIDI engine surface, native/managed machines, VST/VST3/LADSPA adapters,
  historical DirectX adapters, project persistence, ecosystem, reliability,
  security, and licensing constraints.
- **Excluded:** ReBuzz/Buzé behavior except where a source explicitly separates
  it from standard Buzz; binary execution, installer inspection, decompilation,
  unsafe plugin loading, and conclusions about proprietary core internals.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. The public host surface is unusually
  well documented, but core scheduler/process internals, current OS qualification,
  complete plugin fidelity, missing-machine round trips, and security controls
  remain unknown. [C-008] [C-024] [C-027] [C-032]

## 1. Executive summary

Buzz's durable architectural idea is the combination of an explicit modular
audio graph with machine-owned tracker patterns and a separate per-machine order
sequencer. Generators and effects are connected to a Master; each machine
publishes typed parameters that become pattern columns and automation targets.
This is a materially different composition model from a track-first linear DAW.
[C-004] [C-036]

The native machine contract is a compact Windows C++ DLL ABI. It exposes tick
and sub-tick time, float audio blocks, generator/effect/control roles, multi-I/O,
MIDI, arbitrary save/load data, custom pattern editors and embedded Win32 UIs,
latency reporting, and graph callbacks. Managed `.NET` machines add a higher-level
state and GUI model. The proprietary core's actual graph scheduler, thread
topology, process boundaries, and fault containment are not public. [C-006]
[C-008] [C-013]

Third-party format hosting is adapter-centric rather than a monolithic core host.
Polac loaders/adapters provide classic VST and VST3 on Windows and document x86/
x64 bridging, optional out-of-process execution, scanning, shell plugins,
multi-I/O, MIDI/SysEx, automation, PDC, state/preset handling, offline mode,
freeze, and embedded/floating editors. The default bridged mode described in one
revision shares one process among VSTs, with an opt-in dedicated process per VST;
this is compatibility/crash-containment plumbing, not a documented security
sandbox. [C-014] [C-015] [C-016] [C-017] [C-018]

The `.bmx` project is a sectioned binary container for machines and opaque machine
state, graph connections, patterns, sequences, wavetable metadata/audio,
parameter schemas, MIDI bindings, UI placement, and build version. This captures
the graph/pattern model directly, but project durability remains dependent on
machine binaries and adapter state compatibility. The available format page is
non-normative and admits omissions. Exact missing-machine placeholder and
lossless re-save behavior are unknown. [C-025] [C-026] [C-027]

**Architecture recommendation:** clean-room adapt the graph + machine-local
pattern + order-list separation, typed parameter schemas, versioned sectioned
persistence, and optional one-plugin-per-process bridging. Do not copy the Buzz
ABI/header, assume wrapper support equals full plugin fidelity, share unrelated
untrusted plugins in one bridge process by default, or adopt executable-machine
download without provenance and quarantine controls. [C-033] [C-035]

**Confidence:** high for public workflow and SDK surface; medium for historical
feature behavior and project representation; low for proprietary internals,
security posture, modern Windows compatibility, and unsupported plugin formats.

## 2. Product identity, history, and market position

The official site identifies Buzz as a DAW with a “top-down” tracker interface.
Its currently offered core is build 1503; the release log dates that build to
2016. The SDK copyright spans 1997–2014 and identifies Oskari Tammelin, providing
lineage evidence without establishing a complete release history. [C-001]

Buzz is best scoped as a legacy Windows modular tracker that remains publicly
distributed, with an independently active adapter ecosystem: Polac's first-party
adapter post was updated in 2026 while no post-2016 core build was found. This
does **not** prove that the core is formally discontinued or currently supported;
maintenance and security-response status are `UNKNOWN`. [C-001] [C-014] [C-032]

The official site calls Buzz freeware and solicits donations. No paid edition
matrix was found. “Freeware” describes distribution, not source availability or
permission to reuse the SDK. [C-003] [C-033]

## 3. Workflow and conceptual model

The central objects are:

1. **Machines:** generators, effects, control machines, a Master, and optional
   custom pattern-editor machines. [C-004] [C-006]
2. **Connections:** directed audio edges with source/destination plus gain and
   pan in the project representation. [C-009] [C-025]
3. **Patterns:** machine-owned tracker rows containing notes and typed global/
   track parameter events. [C-004] [C-006]
4. **Sequences:** per-machine columns ordering patterns and mute/break/thru
   events over song time. [C-004] [C-025]
5. **Wavetable:** numbered sample slots referenced by tracker/sample machines;
   metadata and audio can be stored in the song. [C-012] [C-025]

The user patches generator → effect → Master graphs in Machine View, programs a
selected machine in Pattern View, and arranges its patterns in Sequence View.
This separates signal topology, reusable event material, and song ordering.
[C-004] [C-036]

There is no documentary basis for treating Buzz as a conventional audio-track/
clip/take DAW, a notation system, or a scene launcher. A later Jeskola Live
machine added pattern-triggering behavior, but its complete live-session contract
is not established by this dossier. [C-030] [C-037]

## 4. Publicly documented architecture

The public architecture boundary is the machine API rather than the proprietary
core. MI v66 defines exported `GetInfo`/`CreateMachine` entry points, machine
metadata and flags, host callbacks, `Tick`, `Work`, `WorkMonoToStereo`,
`MultiWork`, MIDI callbacks, state serialization, custom pattern editing,
embedded GUI creation, and latency reporting. [C-006]

The API identifies a graph service (`GetConnection*`, source/destination,
per-channel connection counts), a song/transport service, pattern/sequence
editing, wavetable access, profile storage, MIDI routing, a debug console, and
lock/multithreading controls. These are documented extension points, not evidence
of how the core implements them. [C-006] [C-008]

Managed machines (build 1416+) separate an `IBuzzMachine` audio/parameter object
from an optional `IMachineGUI`; they can process per sample or block and use a
serializable `MachineState`. Community developer documentation describes
debugging by attaching to `buzz.exe`, supporting—but not proving for every
extension—the inference that managed machines share the host process. [C-013]
[C-023]

**UNKNOWN:** core module map, graph compilation, render-ahead policy, real-time
thread ownership, worker-pool scheduling, lock strategy, denormal handling,
failure supervision, and whether any native-machine bridge is a core or external
process. [C-008] [C-024]

## 5. Audio engine

The native API processes `float` buffers and sets `MAX_BUFFER_LENGTH` to 256
samples. It provides tick, position-in-tick, optional sub-tick information,
sample rate, samples-per-tick, BPM/TPB, and groove timing. SDK guidance says
machines should support 11,050–96,000 Hz. [C-005]

Community feature documentation reports 32-bit internal processing,
multithreading, sub-tick timing, plugin delay compensation, WaveOut,
DirectSound, WASAPI, and ASIO output at multiple rates. The changelog adds effect
multithreading, a 12-thread limit in one build, machine opt-in/out of
multithreaded work calls, CPU/engine-lock diagnostics, multi-output generators,
multi-I/O, and oversampling changes. [C-007]

Native machines report latency with `GetLatency`; the host exposes total latency,
and Polac documents PDC fixes and a per-plugin delay override for incorrect plugin
reports. Exact compensation topology, automation/PDC interaction, dynamic latency,
tail handling, and bypass latency are `UNKNOWN`. [C-007] [C-017]

Hard-disk recording is documented as faster than real time, 16/24-bit WAV, and
up to 192 kHz. This does not establish universal 192-kHz machine compatibility;
the SDK's 96-kHz guidance and community reports about old 44.1-kHz-only machines
are a material compatibility limitation. [C-005] [C-029] [C-031]

Core offline scheduling, deterministic render guarantees, graph-cycle policy,
feedback delay rules, dropout recovery, disk streaming, automatic freeze, and
engine restart behavior remain `UNKNOWN`. [C-008]

## 6. Tracks, timeline, clips, and editing

Buzz's primary timeline object is the sequence of machine patterns, not a linear
audio clip. A sequence stores song end, loop bounds, machine association, and
mute/break/thru/pattern events. Pattern length is measured in ticks/rows; newer
sequence UI revisions added horizontal/vertical views, time-signature display,
zoom, undo/redo, and pattern-box editing. [C-004] [C-025]

Pattern tracks are polyphonic/event lanes inside a machine, distinct from
sequence columns. The ABI allows variable track counts and typed global/track
parameters. [C-006] [C-036]

The wavetable and wave editor provide sample-slot editing (copy/cut/paste,
normalize, trim, reverse, fades, looping), but no evidence establishes
non-destructive audio regions, take lanes, comping, elastic warping, ripple edit,
or playlist/version lanes. Those capabilities are `UNKNOWN` rather than inferred
absent. [C-012] [C-030]

## 7. MIDI, sequencing, notation, and expression

Patterns can carry note and parameter data; native machines receive MIDI note
and CC callbacks, and host callbacks can send MIDI. Pattern XP-era changelog
entries record MIDI note, pitch-wheel, and CC editing/recording; the sequence
editor can export tracks or a song as MIDI. [C-010]

Polac documents MIDI input/output, RPN/NRPN, SysEx, MIDI clock/MTC/MMC output,
program changes, MIDI learn, all-notes-off on stop, and MIDI-output latency
compensation. These capabilities belong to the adapter package and may depend on
its audio/MIDI drivers, not the core alone. [C-010] [C-017]

Tick/sub-tick timing and an immediate control-change callback exist, but the
sources do not establish sample-accurate automation or MIDI events across all
native and wrapped machines. MPE, per-note expression, MIDI 2.0/UMP, score
notation, and MusicXML are `UNKNOWN`. [C-011]

## 8. Routing, mixer, automation, and control

Machine connections form the mixer graph. The archived official help permits
many generators into an effect and many machines into Master; community docs
record per-connection gain/pan, equal-power pan, multi-solo/mute, bypass, and
effect insertion on an edge. The `.bmx` connection section persists source,
destination, amplitude, and pan. [C-009]

Typed machine parameters can be changed in real time and recorded into patterns.
Control/peer machines can manipulate other machines, and the API exposes direct
and immediate control changes plus parameter descriptions and value ranges.
Polac maps plugin automation and adds interpolation/slope commands, MIDI learn,
and an optional asynchronous automation mode. [C-006] [C-007] [C-017]

Multi-I/O machines and Polac's optional VST multi-I/O path are documented. Exact
sidechain semantics, arbitrary bus layouts, dynamic I/O renegotiation, surround,
immersive formats, VCAs, folders, OSC, Mackie/HUI, and feedback-loop policy are
`UNKNOWN`. [C-007] [C-017] [C-030]

## 9. Recording, comping, and media handling

Buzz has a wavetable recorder/editor, a loop recorder, hard-disk recording, and
audio input/output machines. The changelog records recording into the wavetable,
recording Master output, float freeze files in Polac, and wave-loading support
through libsndfile. [C-012] [C-029]

Community documentation lists WAV, AIFF, MP3, OGG, FLAC, and XI wavetable input,
plus 16/24-bit WAV recording. `.bmx` wavetable metadata can retain an original
full path, sample rate, root note, levels, loop points, envelopes, and optional
embedded raw/proprietary-compressed audio. [C-012] [C-025]

Input monitoring, punch recording, take comping, broadcast metadata, media
relink UI, proxy media, video conform, and non-destructive source edits are
`UNKNOWN`. A Polac `mediavst` alpha used DirectShow decoders for synchronized
media, but this is not evidence of a complete video/post subsystem. [C-017]
[C-030]

## 10. Instruments, effects, content, and native devices

Native device categories are generator, effect, control machine, and optional
custom pattern editor; the Master is a host machine type. A machine declares
global/track parameters, attributes, track limits, flags, author/name, optional
instrument library, and arbitrary state. [C-006]

Managed machines retain parameters, `Tick`/`Work` concepts, MIDI, menus, stop,
custom GUI, and state at a higher level. [C-013]

The ecosystem historically distributed many third-party machine DLLs. Buzz's
“More machines” UI downloads, unpacks, indexes, and exposes a machine database;
manual installation uses generator/effect directories. This breadth is an
ecosystem property, not a vetted built-in-device inventory. [C-022]

Presets include parameter state and can include machine-specific data when a
machine opts in. Templates can package selected machines/patterns and, in later
builds, wavetable data. [C-006] [C-028]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` means no Buzz product exists on that platform in the evidenced
scope; it does not make a general statement about the plugin format. `UNKNOWN`
means no sufficient support evidence was found, not proven incompatibility.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE:no macOS Buzz evidenced | DOCUMENTED:classic VST through Polac loader | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | Polac x86/x64 b47 thread, 2026; bundled-loader wiki | Release notes use classic VST2 API/preset terms (`effCanBeAutomated`, `fxp/fxb`, shells); exact VST2 SDK lineage/license is UNKNOWN | [C-014] [S-005] [S-007] |
| VST3 | NOT_APPLICABLE:no macOS Buzz evidenced | DOCUMENTED:Polac VST3 adapter | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | Polac x86/x64 b47, updated 2026-02-28 | Scanning, instruments/effects, programs, MIDI out, no-GUI handling and SDK 3.7.1-era fixes documented | [C-014] [C-016] [C-017] [S-005] |
| AUv2 | NOT_APPLICABLE:no macOS Buzz evidenced | NOT_APPLICABLE:Apple format outside evidenced Buzz platform | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | No edition/version evidence | No host claim made | [C-002] |
| AUv3 | NOT_APPLICABLE:no macOS Buzz evidenced | NOT_APPLICABLE:Apple format outside evidenced Buzz platform | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | No edition/version evidence | No host claim made | [C-002] |
| AAX | NOT_APPLICABLE:no macOS Buzz evidenced | UNKNOWN | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | No evidence found in retained official/adapter/manual sources | Acceptance, scanning, instantiation, and host contract UNKNOWN | [C-021] |
| CLAP | NOT_APPLICABLE:no macOS Buzz evidenced | UNKNOWN | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | No evidence found | Acceptance, scanning, instantiation, and host contract UNKNOWN | [C-021] |
| LV2 | NOT_APPLICABLE:no macOS Buzz evidenced | UNKNOWN | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | No evidence found | LADSPA evidence must not be generalized to LV2 | [C-021] |
| LADSPA | NOT_APPLICABLE:no macOS Buzz evidenced | DOCUMENTED:Polac adapter | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | Polac beta changelog b27 records LADSPA-wrapper fixes | Current format depth beyond wrapper existence is UNKNOWN | [C-019] [S-005] |
| DSSI | NOT_APPLICABLE:no macOS Buzz evidenced | UNKNOWN | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | No evidence found | Acceptance, scanning, instantiation, and host contract UNKNOWN | [C-021] |
| JSFX | NOT_APPLICABLE:no macOS Buzz evidenced | UNKNOWN | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | No evidence found | Acceptance, scanning, instantiation, and host contract UNKNOWN | [C-021] |
| DirectX/DXi | NOT_APPLICABLE:no macOS Buzz evidenced | DOCUMENTED:legacy third-party adapters; current support UNKNOWN | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | CyanPhase DX Instrument/Effect/DMO adapters, default-blacklisted for post-2008 Buzz | Historical presence is not usable/current support; adapters were reported conflicting/crash-prone | [C-020] [S-008] |
| Rack Extension | NOT_APPLICABLE:no macOS Buzz evidenced | UNKNOWN | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | No evidence found | Acceptance, scanning, instantiation, and host contract UNKNOWN | [C-021] |
| Product-native/other | NOT_APPLICABLE:no macOS Buzz evidenced | DOCUMENTED:native C++ Buzz machines and managed `.NET` machines | NOT_APPLICABLE:no Linux Buzz evidenced | NOT_APPLICABLE:no mobile/web Buzz | MI v66/build 1503; managed machines build 1416+ | Generator/effect/control/pattern-editor roles; native x64 variants and legacy 32-bit compatibility work documented | [C-006] [C-013] [S-002] [S-003] [S-012] |

### 11.2 Discovery, scanning, validation, and recovery

**Native machines.** Manual installation places DLLs in `Gear\Generators` or
`Gear\Effects`. The “More machines” flow downloads, unpacks, and indexes an MDB
collection under the user's Documents area. The changelog records path and SHA-1
display, a wrong-directory warning, and “More machines” progress when loading an
old song with missing machines. `gear.xml` can forcibly blacklist named machines,
and Debug Console startup messages identify load errors. [C-022] [C-026]

The SDK's `CMachineInfo::Version` comment says the higher internal version wins
when two copies are found. This is limited duplicate-selection evidence; stable
package identity, hash policy, cache invalidation, rescans, and duplicate UI are
otherwise `UNKNOWN`. [C-022]

**Polac VST/VST3.** The adapter release log documents scanning fixes, VST shell
scanning, VST3 detection fixes, and an option not to scan for new VSTs on Buzz/
ReBuzz startup. Community installation docs say the VST folder is configurable.
Exact default paths for b47, scan helper process, cache database, validation,
timeout, blacklist/quarantine, duplicate class identity, failed-scan UX, and
manual full-rescan behavior are `UNKNOWN`. [C-016]

No source demonstrates that scanning native machines or VSTs is isolated from
the host, cryptographically verified, or protected by OS sandboxing. [C-024]

### 11.3 Runtime isolation and compatibility

The native C++ ABI returns host pointers/vtables and raw audio buffers and allows
an embedded `HWND`. Managed-machine documentation attaches a debugger to
`buzz.exe`. These facts support a bounded **INFERENCE** of same-process execution
for ordinary native/managed machines, but the proprietary loader is inaccessible
and exceptions or helper processes remain unknown. [C-023]

The core x64 changelog documents native `.x64.dll` naming and progressive 32-bit
machine support, including wavetable and Polac VST GUI work. It does not disclose
the native-machine bridge process topology, IPC, crash containment, or state
fidelity; those remain `UNKNOWN`. [C-007] [C-024]

Polac explicitly documents separate-process VST bridging and x86↔x64 directions.
One revision made all bridged VSTs share one process by default, with a dedicated
process option per VST; asynchronous processing is optional. A restart-plugin
command is also documented. This is the only evidenced crash-containment boundary,
and no security sandbox, restricted token, filesystem/network policy, or code
signing is claimed. [C-015] [C-024]

### 11.4 Host/plugin processing contract

For native machines, documented contract elements include float blocks up to 256
samples; read/write work modes; mono→stereo and multi-I/O callbacks; machine
latency; tick/sub-tick timing; MIDI note/CC; arbitrary parameters and textual
descriptions; state; bypass/mute/stop; offline host rendering hooks; and
embedded/custom UI. [C-005] [C-006] [C-007]

Polac documents instruments/effects (including VST3 plugins exposing both),
shells, multi-I/O, MIDI in/out, SysEx, RPN/NRPN, time information, program change,
offline processing, freeze, oversampling, PDC, delay override, and automation.
[C-017]

Not established: sidechain bus conventions, arbitrary speaker arrangements,
dynamic bus negotiation, sample-accurate parameter queues, VST3 note expression,
MPE/MIDI 2.0, tails, silence flags, suspend policy, deterministic offline behavior,
or complete bypass semantics. [C-011] [C-021]

### 11.5 Parameters, automation, state, presets, and project recall

Native parameter declarations carry type, name/description, range, no-value,
flags, and default. Global/track parameter state is stored in `.bmx`; the `PARA`
section records parameter schemas to help convert pattern data when machine
versions differ. Machines can serialize arbitrary opaque data through `Save`/
`Load`; managed machines use a serializable `MachineState`, while ordinary
parameters are saved automatically. [C-006] [C-025] [C-026]

Polac release notes document `fxp/fxb` revision, XML-formatted presets in its Buzz
wrapper, VST3 program visibility/change, memory-stream fixes, song-load fixes,
and a specific bit-bridge state-load defect. These notes prove active state
handling and also show that successful format detection did not guarantee correct
recall. [C-018]

Exact VST/VST3 persistent identifiers, chunk/component-state mapping, asset
references, parameter-ID migration, unknown-parameter retention, preset search
paths, and lossless missing-plugin round trips are `UNKNOWN`. [C-027]

### 11.6 UI, diagnostics, and failure modes

Native machines may use generic parameter windows, custom embedded Win32 GUIs,
custom pattern editors, or WPF GUI declarations. Core release notes include
high-DPI text fixes and an error dialog when a GUI DLL cannot load, but plugin UI
scaling/headless policy is not fully documented. [C-006] [C-007]

Polac supports embedded or floating editors, a compatibility control for the
`WS_CHILD` style, focus-stealing controls, GUI update rate, and bridge settings
from the plugin UI. Its changelog records no-GUI VST3 crashes, open/close/preset
freezes, window parenting, resizing, and bridged SynthEdit behavior. [C-018]

Diagnostics include Buzz's Debug Console/log, CPU Monitor, engine-lock times,
machine-load errors, wrapper scan fixes, restart-plugin control, and the native
machine blacklist. No structured crash report, quarantine workflow, safe mode,
or automatic per-plugin rollback was evidenced. [C-016] [C-022] [C-024]

## 12. Extensibility and integration

The native MI v66 SDK is a broad extension API covering audio/MIDI processing,
parameters, patterns, sequences, wavetable, custom UI, graph inspection, host
commands, presets/state, and diagnostics. It reserves dummy vtable slots for
future expansion and exposes a host/build version for compatibility checks.
[C-006]

Managed machines provide a C#-oriented `IBuzzMachine`/`IMachineGUI` path with
attributes, per-sample or per-block work, MIDI, menus, interpolation, state, and
template-import name remapping. [C-013] [C-026]

Control/peer machines are the automation/modulation extension boundary. Custom
pattern editors can replace the generic tracker presentation while targeting
machine parameters. [C-006] [C-013]

No general scripting language, package signature API, stable cross-platform SDK,
OSC/remote protocol, controller certification program, or extension permission
model was evidenced. [C-024] [C-030]

## 13. Project format, persistence, interoperability, and collaboration

The community format page describes `.bmx` as a `Buzz` header plus a directory of
named sections. Material sections include `MACH`, `CONN`, `PATT`, `SEQU`, `WAVT`,
`WAVE`/`CWAV`, `PARA`, `MIDI`, `BLAH`, `PDLG`, and `BVER`. Machine-specific state
is opaque; graph, patterns, and order events are structural; wavetable audio may
be embedded. [C-025]

The format page explicitly marks a machine track-count description as apparently
wrong and says something seems missing. It is therefore useful descriptive
evidence, not a complete normative or safe-parser specification. [C-025]

Compatibility aids include parameter-schema retention (`PARA`), build version,
machine-level arbitrary state, remapping APIs for loaded parameter indices/names,
managed template import remaps, and improved loading of states/patterns saved by
older machine versions. [C-026]

Templates can include machines, patterns, sequence bounds, and optional wave
files; the feature list claims automatic backup. The sequence editor exports
MIDI tracks/songs, while hard-disk recording exports WAV. Exact backup cadence,
autosave recovery, undo persistence, forward compatibility, archive/collect UI,
and project repair behavior remain `UNKNOWN`. [C-028]

When a machine is absent, retained parameter schemas and the “More machines”
recovery path may assist conversion/acquisition, but the exact placeholder model,
whether patterns/state survive re-save, and whether a replacement can be chosen
without data loss are `UNKNOWN`. [C-026] [C-027]

No AAF, OMF, ADM, MusicXML, DAWproject, cloud collaboration, merge model, or
project-level version control was evidenced. [C-030]

## 14. Delivery, live, post-production, and specialized workflows

Documented delivery is hard-disk WAV recording/rendering, including faster than
real time and up to 24-bit/192-kHz output. Polac adds an adapter-level freeze path
that writes float WAV files. [C-029]

Jeskola Live added pattern-triggering and shared-name launch behavior; loop
recording captures Master output. These are specialized machine extensions rather
than evidence of a unified live-performance architecture. [C-012] [C-037]

The Polac media adapter could play synchronized audio/video through DirectShow,
but complete video, timecode, ADR, conform, surround/immersive, loudness, DDP,
ADM, cue-sheet, and batch-delivery workflows are `UNKNOWN`. [C-017] [C-030]

## 15. Performance, reliability, security, and accessibility

Performance controls include effect multithreading, per-machine multithreading
enable/disable, engine-lock/CPU monitoring, a historical thread-count setting,
large-address-aware x86, optional VST async processing, oversampling, and bridge
process choices. No current benchmark or scaling guarantee was found. [C-007]
[C-015]

Reliability evidence is mixed. Core and adapter changelogs show long-running fixes
for crashes, state recall, scanning, GUI handling, PDC, and x64 bridges. Community
blacklist documentation reports machines that crash at startup, corrupt/unload
songs, assume 44.1 kHz, create denormal CPU spikes, or continue output after stop.
These are documented reports, not reproduced observations. [C-031]

Security posture is weakly documented. Native machines are executable DLLs with
deep host callbacks; machine acquisition can download and index a bulk collection;
the UI can show SHA-1 hashes; `gear.xml` can block known DLLs; and Polac can move
VSTs out of process. None of those facts establishes signature verification,
malware scanning, least privilege, filesystem/network isolation, notarization,
quarantine, or exploit containment. [C-022] [C-023] [C-024]

Core update/rollback policy, supported Windows releases, vulnerability reporting,
security-response ownership, telemetry/privacy, localization, screen-reader
semantics, keyboard accessibility beyond shortcut-heavy operation, and high-
contrast support are `UNKNOWN`. [C-030] [C-032]

## 16. Licensing, ecosystem, and implementation constraints

Buzz is distributed as freeware, but the official machine header says it may be
used to write **freeware** DLL machines for Buzz and that other use requires the
author's permission. The dev directory adds: use the code to create Buzz machines,
but do not include it in GPL/“whatever” software. These restrictions make the
header unsuitable as a casually reusable implementation dependency. [C-003]
[C-033]

The core source license/EULA, managed-interface license, Polac adapter license,
machine-collection redistribution terms, and trademarks were not established.
Likewise, this wave did not retrieve current Steinberg VST3 terms or historical
VST2 licensing, so no right to implement, bundle, sign, redistribute, or claim
compatibility is inferred from format support. [C-034]

The ecosystem depends on many independently authored binaries with uneven
maintenance and state compatibility. A new DAW should clean-room specify its own
extension ABI, package identity, signing/provenance, migration, and quarantine
rules rather than copying protected SDK expression. [C-031] [C-033] [C-035]

This section is research, not legal advice.

## 17. Strengths, liabilities, and architecture lessons

**Strengths**

- The graph is a first-class composition surface rather than hidden mixer
  plumbing. [C-004] [C-009]
- Machine-owned reusable patterns and per-machine sequence columns make parameter
  automation and note programming uniform across heterogeneous devices. [C-004]
  [C-036]
- The host contract is compact yet covers audio, MIDI, state, UI, pattern editing,
  multi-I/O, and latency. [C-006]
- Adapter machines demonstrate that foreign plugin ecosystems can be integrated
  behind a native device boundary. [C-014] [C-035]
- The sectioned project mirrors core domain objects and retains parameter schema
  for some migration help. [C-025] [C-026]

**Liabilities**

- Windows C++ ABI/`HWND` coupling, restrictive SDK terms, and opaque proprietary
  internals make direct reuse unsuitable for a new cross-platform product.
  [C-006] [C-008] [C-033]
- Project recall depends on executable machine/adaptor availability and opaque
  state; missing-machine preservation is not specified. [C-025] [C-027]
- Native machine discovery and execution lack evidenced modern trust controls.
  [C-023] [C-024]
- Bridge sharing trades lower overhead for a larger correlated-failure domain.
  [C-015]
- Wrapper changelogs show that “supports VST3” hides years of scanning, state,
  automation, UI, PDC, and MIDI edge cases. [C-016] [C-017] [C-018]

**Lesson:** Buzz is a strong conceptual reference for modular tracker workflow
and an important negative reference for durability/security boundaries; it is not
a safe implementation template. [C-035]

## 18. Transferable patterns

### T-01 — Graph, pattern, and order separation — `CANDIDATE`

- **Problem:** A single track object conflates signal routing, reusable musical
  material, and arrangement.
- **Minimal mechanism:** explicit device graph; patterns owned by a device; an
  arrangement of pattern references and stop/mute/thru events. [C-004] [C-025]
- **Prerequisites:** stable device identity, graph validation, tempo map, and
  event-time semantics.
- **Tradeoffs:** graph power increases discoverability and cycle-management cost;
  machine-local patterns complicate cross-device editing.
- **Adaptation risk:** medium; clean-room concept only, with original terminology/
  UI expression avoided.

### T-02 — Typed parameter schema shared by editor, automation, and persistence — `CANDIDATE`

- **Problem:** Automation and project migration fail when parameter meaning is
  only positional.
- **Minimal mechanism:** persistent parameter ID plus name/type/range/default/text
  metadata; event editor generated from the same schema. Buzz provides the
  historical positional/type precedent but a new design must add stable IDs.
  [C-006] [C-026]
- **Prerequisites:** versioned identity and explicit migration maps.
- **Tradeoffs:** schema evolution burden; plugin-provided text can be unstable.
- **Adaptation risk:** low conceptually, high if Buzz's exact ABI/data layout were
  copied; do not copy it. [C-033]

### T-03 — Foreign-format adapter as a native graph node — `CONDITIONAL`

- **Problem:** The core graph should not directly absorb every external plugin
  API and compatibility quirk.
- **Minimal mechanism:** adapter exposes a foreign plugin through the DAW's native
  device contract, translating state, buses, events, parameters, UI, and latency.
  [C-014] [C-035]
- **Prerequisites:** conformance matrix, stable identity, format-owner licensing,
  diagnostics, and explicit unsupported-feature reporting.
- **Tradeoffs:** a translation layer can hide capabilities and compound state
  migration defects. [C-017] [C-018]
- **Adaptation risk:** medium.

### T-04 — Per-plugin process isolation as a user/policy choice — `CANDIDATE`

- **Problem:** One unstable plugin can terminate the DAW or unrelated plugins.
- **Minimal mechanism:** dedicated helper process per plugin instance or trust
  group, IPC audio/event/state protocol, restart and timeout handling. Polac's
  dedicated-process option supplies historical evidence for the boundary.
  [C-015]
- **Prerequisites:** bounded-latency IPC, UI brokering, state checkpoints, and OS
  sandbox policy.
- **Tradeoffs:** CPU/memory/context-switch cost and more complex debugging.
- **Adaptation risk:** medium; do not mistake process separation for sandboxing.
  [C-024]

### T-05 — Versioned sectioned project plus dependency manifest — `CONDITIONAL`

- **Problem:** Projects combine editable host structure with opaque extension
  state and media.
- **Minimal mechanism:** independently versioned sections for graph, arrangement,
  media, automation, and extension state; checksummed dependency manifest; retain
  unknown sections and missing-device state verbatim. Buzz provides the sectioned
  precedent but not the full durability guarantees. [C-025] [C-027]
- **Prerequisites:** normative schema, atomic writes, migration tests, content
  hashes, and placeholder round trips.
- **Tradeoffs:** larger files and migration complexity.
- **Adaptation risk:** medium.

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected mechanisms

- **Copy the native Buzz ABI/header — REJECT.** It is Windows/Win32 coupled and
  carries explicit reuse restrictions. Reopen only with written permission and a
  separate legal/architecture review. [C-006] [C-033]
- **Treat adapter format names as full host fidelity — REJECT.** Polac's own log
  documents recurring scan, state, UI, automation, PDC, MIDI, shell, and bridge
  defects. [C-016] [C-017] [C-018]
- **Use one shared bridge process for unrelated untrusted plugins by default —
  REJECT.** It enlarges the correlated crash/security domain; reopen only if a
  measured low-risk trust-group policy justifies it. [C-015] [C-024]
- **Bulk-download executable machines without signed provenance/quarantine —
  REJECT.** SHA-1 display and a static blacklist are not a trust system.
  [C-022] [C-024]
- **Represent missing devices only by a name/path — REJECT.** The ecosystem has
  duplicate names/versions and opaque state. Require stable IDs, hashes, vendor,
  architecture, format, and retained state. [C-022] [C-027] [C-031]
- **Revive legacy DirectX adapters as current support evidence — REJECT.** The
  documented adapters were default-blacklisted for later Buzz. [C-020]

### `CURIOSITY_NO_GO` threads

Scores are decision relevance / expected value / novelty / cost on 0–3 scales.

| Thread | Score | Decision |
| --- | --- | --- |
| Current Windows 10/11/ARM qualification | 2/2/2/2 | `CURIOSITY_NO_GO`: useful operationally, but documentary claims would not resolve architecture internals; requires a disposable dynamic matrix. |
| Exhaustive machine catalog/history | 1/1/1/3 | `CURIOSITY_NO_GO`: low marginal architecture value and high ecosystem breadth. |
| Unrelated Buzz-machine-to-VST3 bridge project | 1/1/3/2 | `CURIOSITY_NO_GO`: reverse hosting direction and not Jeskola Buzz's host contract. |
| ReBuzz/Buzé implementation internals | 2/2/3/3 | `CURIOSITY_NO_GO`: different hosts risk scope contamination; use only in a separately owned dossier. |
| Installer/binary inspection | 2/3/2/3 | `CURIOSITY_NO_GO`: documentary-wave exclusion and unsafe/unnecessary here. |
| Dynamic plugin conformance matrix | 3/3/2/3 | `CURIOSITY_NO_GO` for this wave: highest next-phase value, but requires approved disposable Windows fixtures. |
| Full bad-machine list | 1/1/0/2 | `CURIOSITY_NO_GO`: representative failure classes already saturated. |
| Broad market-history narrative | 1/1/1/1 | `CURIOSITY_NO_GO`: would not change architecture selection. |

The one qualifying curiosity thread—project format and missing-machine
persistence (3/3/3/2)—was pursued in passes 7–8. It established the sectioned
container and migration breadcrumbs but left placeholder round trips unknown.
[C-025] [C-026] [C-027]

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary result | Counterevidence/next test |
| --- | --- | --- |
| H-01: The currently offered core is actively released. | **Not established.** Build 1503 is still offered but dated 2016; only the independent Polac layer shows a 2026 update. [C-001] [C-014] | Obtain an official support/maintenance statement; do not infer from site availability. |
| H-02: Native Buzz machines are sandboxed. | **Likely false but not fully observable.** Raw host pointers/`HWND` and debugger attachment support same-process inference; no sandbox is documented. [C-023] [C-024] | Approved process-tree/crash probe with benign test machines. |
| H-03: “VST3 supported” means detection, instantiation, state, UI, automation, MIDI, and PDC all work. | **Falsified as a blanket documentary inference.** Adapter notes separately fix each layer. [C-016] [C-017] [C-018] | Fixture matrix must test each contract dimension independently. |
| H-04: x64 Buzz removes bitness compatibility needs. | **Falsified.** Core and Polac logs document 32-bit compatibility/bridging work. [C-007] [C-015] | Test x86 native machine, x86 VST2, x64 VST2, and x64 VST3 separately. |
| H-05: Historical DirectX adapters prove current DX/DXi support. | **Falsified.** They were default-blacklisted in later Buzz. [C-020] | Only an approved current fixture could change status from current `UNKNOWN`. |
| H-06: Missing machines preserve all data losslessly. | **UNKNOWN.** `.bmx` retains names/state/schema and recovery breadcrumbs, but placeholder/re-save semantics are unspecified. [C-026] [C-027] | Load a fixture without a machine, save-copy, restore machine, byte/semantic compare. |
| H-07: The `.bmx` page is a complete normative specification. | **Falsified.** The page labels fields wrong/missing. [C-025] | Seek authoritative loader source/spec or create a corpus-driven parser test only with authorization. |
| H-08: Process bridging is a security sandbox. | **Falsified as an inference.** Separate process/dedicated process is documented; privilege restrictions are not. [C-015] [C-024] | Inspect process token, filesystem/network access, job object, mitigations, and IPC in a safe lab. |
| H-09: Parameter automation is universally sample accurate. | **UNKNOWN.** Tick/sub-tick/immediate paths exist, but no universal timing guarantee does. [C-011] | Impulse/control timing probe for native, bridged VST2, and VST3. |

The dossier explicitly distinguishes **format accepted**, **plugin discovered**,
**plugin instantiated**, and **full host contract works**. Only the first three
are partially documented for VST/VST3; full conformance remains unproven.
[C-014] [C-016] [C-017] [C-018]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Official site calls Buzz a tracker-interface DAW and offers build 1503 x86 recommended/x64 experimental; changelog dates it 2016-01-16. | Core, cutoff 2026-08-29 | S-001, S-002 | Direct official statements. | Site availability is not a maintenance commitment. |
| C-002 | INFERENCE | High | Evidenced product scope is Windows desktop x86/x64, with no official macOS/Linux/mobile/web build found. | Product/platform | S-001, S-003, S-006 | `.exe` installers, Win32 `HWND`, Windows paths/drivers, x86/x64 labels. | No single official “Windows only” matrix was found. |
| C-003 | DOCUMENTED | High | Buzz is distributed as freeware; freeware does not make the SDK open/reusable. | Product/license | S-001, S-003 | Official site and header. | Full core EULA not retrieved. |
| C-004 | DOCUMENTED | High | Workflow combines connected generator/effect/Master machines, machine-owned tracker patterns, and per-machine pattern sequencing; later releases evolved the sequence UI. | Legacy/current build model | S-002, S-009, S-011 | Archived official quickstart triangulated with format and release notes. | UI details evolved after archived help. |
| C-005 | DOCUMENTED | High | Native API uses float buffers, max 256 samples per work call, tick/sub-tick timing, and advises 11.05–96 kHz support. | MI v66 | S-003 | Direct constants/types/comments. | Does not prove core always calls maximum size or every machine follows guidance. |
| C-006 | DOCUMENTED | High | MI v66 exposes generator/effect/control/pattern-editor roles, typed parameters, audio/MIDI callbacks, multi-I/O, state, graph, custom UI, and latency. | Native ABI | S-003 | Direct public header. | Public contract, not core implementation. |
| C-007 | DOCUMENTED | Medium-high | Buzz release/manual evidence records 32-bit processing, multithreading, multi-I/O, oversampling, PDC/latency APIs, CPU/lock diagnostics, and Windows audio drivers. | Builds through 1503 | S-002, S-003, S-010 | Official changelog + header; community feature summary. | Exact current runtime behavior not observed. |
| C-008 | UNKNOWN | High impact | Core scheduler, thread topology, graph-cycle policy, offline engine, native bridge topology, and fault supervision are inaccessible. | Proprietary core | — | Attempted official site, changelog, SDK, manuals; none disclose internals. | Safe next probe: vendor engineering docs or dynamic lab tests. |
| C-009 | DOCUMENTED | High | Graph routing supports fan-in and persists edges with source/destination/gain/pan; UI docs report per-edge gain/pan and mute/solo/bypass. | Core graph | S-009, S-010, S-011 | Official help + format + manual. | Sidechains/feedback rules not established. |
| C-010 | DOCUMENTED | Medium-high | Buzz/native/Polac paths cover tracker notes, MIDI note/CC, recording/editing, MIDI export, clock/MTC/MMC, RPN/NRPN, SysEx, programs and MIDI learn. | Core + adapters | S-002, S-003, S-005 | Release notes and API. | Features are split across core, editor machines, and Polac drivers. |
| C-011 | UNKNOWN | High impact | Universal sample-accurate automation, MPE/per-note expression, and MIDI 2.0 support are not established. | Native + foreign plugins | — | Tick/sub-tick/immediate APIs were examined but no guarantee found. | Requires timing and expression fixture tests. |
| C-012 | DOCUMENTED | Medium-high | Buzz provides wavetable/sample editing, recorder/loop-recorder paths, and project-embedded wavetable metadata/audio. | Core/media | S-002, S-009, S-010, S-011 | Triangulated release, help, feature and format evidence. | Non-destructive audio-track semantics not established. |
| C-013 | DOCUMENTED | Medium-high | Build 1416+ supports managed `.NET` machines with audio object, optional GUI, parameters, per-sample/block work, MIDI and serializable state. | Managed machines | S-002, S-012 | Changelog + developer manual. | Underlying managed loader/source not retrieved. |
| C-014 | DOCUMENTED | High | Polac provides x86/x64 classic VST and VST3 loaders/adapters; b47 thread updated 2026-02-28. | Windows adapter package | S-001, S-005, S-007 | Official Buzz links to author thread; author release post. | Polac is independently maintained; exact bundled Buzz version may lag. |
| C-015 | DOCUMENTED | High | Polac supports out-of-process and cross-bitness VST bridging; one revision defaults bridged VSTs to one process with optional dedicated process and async mode. | Polac adapter | S-005 | Direct adapter-author changelog. | Current defaults not dynamically verified; not a security sandbox claim. |
| C-016 | DOCUMENTED | High | Polac documents VST/VST3 scanning, shell scan fixes, startup-scan control, and detection defects. | Polac adapter | S-005 | Direct adapter-author changelog. | Paths/cache/quarantine/timeout remain unknown. |
| C-017 | DOCUMENTED | High | Polac documents instruments/effects, multi-I/O, MIDI/SysEx, automation/learn, PDC/delay override, offline mode, freeze, oversampling, time info, and an alpha DirectShow media adapter. | Polac adapter | S-005 | Direct feature/fix list. | A changelog is not conformance testing or a complete video subsystem. |
| C-018 | DOCUMENTED | High | Polac handles presets/programs/plugin state and embedded/floating UIs, with documented state, bridge, focus, parent, resize and no-GUI bugs. | Polac adapter | S-005 | Direct adapter-author changelog. | Exact state schema/ID mapping unknown. |
| C-019 | DOCUMENTED | Medium | A Polac LADSPA wrapper existed and received fixes. | Windows adapter, historical/current-thread lineage | S-005 | Direct b27 entry. | Current LADSPA contract depth not stated. |
| C-020 | DOCUMENTED | Medium-high | CyanPhase DX Instrument/Effect/DMO adapters existed historically and were default-blacklisted for post-2008 Buzz conflicts. | Legacy DirectX wrappers | S-008 | Versioned community blacklist. | Does not prove all possible DirectX adapters unsupported. |
| C-021 | UNKNOWN | Medium-high impact | AAX, CLAP, LV2, DSSI, JSFX, Rack Extension and full contracts for non-evidenced formats remain unknown. | Format matrix | — | Retained official/adapter/manual sources searched; absence is not proof. | Next probe: author statement or safe format-specific fixture. |
| C-022 | DOCUMENTED | Medium-high | Native discovery uses Gear folders/MDB indexing; UI supports bulk “More machines,” path/SHA-1 display, duplicate version preference, blacklist, and load-error diagnostics. | Native machine discovery | S-002, S-003, S-006, S-008 | Changelog, SDK comment, manual/blacklist. | Scan process/cache/authenticity and duplicate identity remain incomplete. |
| C-023 | INFERENCE | Medium-high | Ordinary native and managed machines likely run in the Buzz process and therefore share its trust/failure domain. | Native/managed runtime | S-003, S-012 | Raw host pointers/`HWND`, direct callbacks, and attach-to-`buzz.exe` debugging. | Proprietary loader may add undisclosed boundaries; bridge cases differ. |
| C-024 | UNKNOWN | High impact | No signing, quarantine, least-privilege sandbox, malware validation, or formal crash-containment policy is documented. | Security/trust | — | Official/changelog/SDK/manual/adapter sources examined; SHA-1/blacklist/process bridge are insufficient. | Needs vendor statement and controlled OS-security inspection. |
| C-025 | DOCUMENTED | Medium-high | `.bmx` is described as a section-directory container for machines/state, connections, patterns, sequences, waves, schemas, MIDI, UI and build data. | Legacy `.bmx` | S-011 | Versioned community development page. | Page itself flags wrong/missing fields; not normative. |
| C-026 | DOCUMENTED | Medium-high | Persistence includes parameter schemas/version data, machine state, remap callbacks, older-version loading improvements, and missing-machine acquisition breadcrumbs. | Project migration | S-002, S-003, S-011, S-012 | Multiple public sources. | Does not prove lossless placeholder round trip. |
| C-027 | UNKNOWN | High impact | Missing-machine/plugin placeholder, lossless re-save, asset relink, forward compatibility and exact foreign state identity are unspecified. | Project durability | — | Format/manual/changelog and managed state docs examined. | Dynamic missing-dependency corpus is the discriminating probe. |
| C-028 | DOCUMENTED | Medium | Templates can preserve machines/patterns and optional waves; automatic backup is claimed; sequence MIDI export exists. | Persistence/interchange | S-002, S-010 | Release notes + community feature page. | Backup cadence/recovery guarantee unknown. |
| C-029 | DOCUMENTED | Medium | Hard-disk recorder supports faster-than-real-time 16/24-bit WAV up to reported 192 kHz; Polac freeze writes float WAV. | Delivery | S-005, S-010 | Adapter/manual evidence. | Universal machine compatibility at 192 kHz not established. |
| C-030 | UNKNOWN | Medium | Modern comping, notation, collaboration, accessibility, immersive/post, remote APIs and many interchange formats are not established. | Product breadth | — | Template headings checked against all retained sources. | Absence from sources is not proof of absence. |
| C-031 | DOCUMENTED | Medium | Community documentation reports startup crashes, song corruption/unloadability, sample-rate assumptions, denormal CPU issues, duplicate-name variance and sound after stop. | Legacy ecosystem | S-008 | Versioned community failure catalog. | Reports were not reproduced and may be machine/version specific. |
| C-032 | UNKNOWN | High impact | Current Windows support, core maintenance ownership, update/rollback and security-response status are not documented. | Core as of cutoff | — | Official site/changelog checked; latest core release remains 2016. | Vendor statement or current signed release metadata needed. |
| C-033 | DOCUMENTED | High | MachineInterface.h restricts use to freeware Buzz DLLs/permission; dev index forbids inclusion in GPL/other software. | Native SDK license | S-003, S-004 | Direct official text. | Legal interpretation requires counsel; wording across pages is terse. |
| C-034 | UNKNOWN | High impact | Core/managed/Polac licenses and current VST/VST3 redistribution/compatibility rights were not established. | Licensing | — | No authoritative terms were retrieved within budget. | Counsel-led review of original current terms. |
| C-035 | INFERENCE | High | Adapter-as-native-node, typed schema, sectioned persistence and per-plugin process boundaries are transferable concepts, but Buzz code/ABI is not. | Architecture synthesis | C-006, C-014, C-015, C-025, C-033 | Bounded clean-room synthesis from documented interfaces. | Requires prototypes and independent specifications. |
| C-036 | INFERENCE | High | Buzz's machine-local pattern/order model is structurally different from a track-first linear DAW. | Workflow comparison | S-009, S-011 | Patterns and sequences are keyed by machine in both help and format. | Later editor extensions may provide cross-machine views. |
| C-037 | DOCUMENTED | Medium-high | The changelog records Jeskola Live as a pattern-triggering machine with shared-name launch behavior. | Builds 1474–1478 | S-002 | Direct official release-note entries. | Does not establish a complete clip-launching/live-show contract. |

No `OBSERVED` claims are made; no binaries or plugins were executed.

## 22. Source ledger and adaptive bibliography

All sources accessed 2026-08-29. Retained sources are listed in selection order;
descriptive community pages are never treated as proof of proprietary internals.

### S-001 — Jeskola Buzz official landing page

- **Publisher/kind:** Jeskola; official product/download page.
- **URL:** https://www.jeskola.net/buzz/
- **Version scope:** live page at cutoff; build 1503 links.
- **Relevant passage:** “Buzz is a Digital Audio Workstation…”; build 1503 x86
  “recommended,” x64 “experimental”; “Buzz is freeware”; links to Dev Stuff,
  Wiki, Machines, and latest Polac adapters.
- **Claims:** C-001, C-003, C-014.
- **Limitations:** copyright footer says 2015; no OS/support policy or current
  maintenance statement.
- **Selection rationale:** canonical product origin, preferable to download
  mirrors and retrospective histories.

### S-002 — Buzz build changelog

- **Publisher/kind:** Jeskola; official release notes.
- **URL:** http://www.jeskola.net/buzz/beta/files/changelog.txt
- **Version scope:** builds through 1503 (2016-01-16), with detailed 2009–2016
  history in the retrieved text.
- **Relevant sections:** 1503/1500/1499/1490; managed machines 1416+; PDC 1430
  and latency callbacks; x64/32-bit machine work 1351–1365; multi-I/O 1180–1182;
  multithreading 1223–1224; debug/CPU 1133/1402–1403; templates; MIDI export;
  machine path/SHA-1 display.
- **Claims:** C-001, C-004, C-007, C-010, C-012, C-013, C-022, C-026,
  C-028, C-037.
- **Limitations:** terse release notes; fixes do not prove exhaustive fidelity.
- **Selection rationale:** authoritative chronology and feature boundaries,
  preferable to unsourced feature lists.

### S-003 — `MachineInterface.h` MI v66

- **Publisher/kind:** Oskari Tammelin/Jeskola; official public SDK header.
- **URL:** https://jeskola.net/buzz/beta/files/dev/MachineInterface.h
- **Version scope:** MI_VERSION 66, copyright 1997–2014, file dated 2016 in index.
- **Relevant sections:** `MAX_BUFFER_LENGTH`; machine/parameter flags;
  `CMasterInfo`; `CMICallbacks`; `CMachineInfo`; `CMachineInterface`;
  `CMachineInterfaceEx`; exports; opening license comment.
- **Claims:** C-002, C-003, C-005, C-006, C-007, C-010, C-022, C-023, C-026,
  C-033.
- **Limitations:** contract/header only; copying is restricted; does not expose
  core implementation.
- **Selection rationale:** strongest lawful primary evidence for native host
  contract, preferable to reverse-engineered summaries.

### S-004 — Buzz Dev Stuff index/license notice

- **Publisher/kind:** Jeskola; official developer-file index.
- **URL:** https://jeskola.net/buzz/beta/files/dev/
- **Version scope:** file listing through 2016.
- **Relevant passage:** “You may use this code to create machines for Buzz. Thou
  shalt not include the code in GPL/whatever software.”
- **Claims:** C-033.
- **Limitations:** informal and terse; not a full license document.
- **Selection rationale:** retained because it materially narrows clean-room/
  redistribution assumptions and corroborates the header restriction.

### S-005 — “new pvst beta (updated 28-Feb-2026)”

- **Publisher/kind:** Polac on official Buzz forum; first-party adapter-author
  release thread.
- **URL:** https://forums.jeskola.net/viewtopic.php?f=3&t=7
- **Version scope:** x86/x64 b47 at cutoff, with cumulative b3–b47 notes; some
  entries are explicitly ReBuzz-only and were excluded from standard-Buzz claims.
- **Relevant sections:** b47 scanning; b45 state/startup scan; b42 VST3; b40
  automation/no-GUI; b39 presets/MIDI; b34 PDC; b27 LADSPA/offline; b23 bridge
  process/freeze/restart; b18 UI/async bridge; b17 x64/VST3; b7 process bridge;
  b3 multi-I/O/SysEx.
- **Claims:** C-010, C-014–C-019, C-029.
- **Limitations:** mutable forum post/changelog, not independent test; aggregates
  multiple years and hosts.
- **Selection rationale:** direct adapter-author source, officially linked by
  Jeskola and current in 2026; preferable to user anecdotes or download mirrors.

### S-006 — Machine Installation Guide

- **Publisher/kind:** Jeskola Buzz Wiki; versioned community manual.
- **URL:** https://buzzwiki.robotplanet.dk/index.php/Machine_Installation_Guide
- **Version scope:** oldid 2559, last modified 2016-11-22.
- **Relevant sections:** native generator/effect and VST folders; “More machines”
  download/unpack/index flow; MDB location.
- **Claims:** C-002, C-022.
- **Limitations:** community-authored and old; unsafe “safe” wording was not
  accepted as security evidence.
- **Selection rationale:** best accessible description of user-visible discovery
  workflow and directory layout.

### S-007 — Polac VST(i)

- **Publisher/kind:** Jeskola Buzz Wiki; versioned community manual.
- **URL:** https://buzzwiki.robotplanet.dk/index.php/Polac_VST(i)
- **Version scope:** oldid 2747, last modified 2018-11-04.
- **Relevant passage:** VST loaders for instruments/effects, ASIO drivers,
  automation/randomization/step sequencing, and bundled-loader statement.
- **Claims:** C-014.
- **Limitations:** does not identify exact bundled adapter build or full contract.
- **Selection rationale:** corroborates integration/product packaging; adapter
  author thread remains primary for implementation-facing claims.

### S-008 — Machine blacklist

- **Publisher/kind:** Jeskola Buzz Wiki; versioned community reliability manual.
- **URL:** https://buzzwiki.robotplanet.dk/index.php/Machine_blacklist
- **Version scope:** oldid 2342, last modified 2016-11-19.
- **Relevant sections:** Debug Console/load errors; default `gear.xml` blacklist;
  CyanPhase DX adapters; failure/quirk tables.
- **Claims:** C-020, C-022, C-031.
- **Limitations:** mixes Buzz and Buzé and user reports; only explicitly Buzz-
  scoped entries were generalized to Buzz.
- **Selection rationale:** retained for negative/failure evidence absent from
  vendor marketing; clearly labeled community reports.

### S-009 — Buzz Help: Quickstart

- **Publisher/kind:** Jeskola archive; archived official manual.
- **URL:** http://jeskola.net/archive/buzz/1.1/Help/QuickStart.html
- **Version scope:** Buzz 1.1-era workflow.
- **Relevant sections:** machines and Master; connection rules; programming
  patterns/tracks; tracker/wavetable; Sequence Editor.
- **Claims:** C-004, C-009, C-012, C-036.
- **Limitations:** legacy UI; does not cover 2009+ editor/engine additions.
- **Selection rationale:** primary source for enduring conceptual model,
  triangulated against later format and changelog.

### S-010 — Buzz Features

- **Publisher/kind:** Jeskola Buzz Wiki; versioned community feature summary.
- **URL:** https://buzzwiki.robotplanet.dk/index.php/Buzz_Features
- **Version scope:** oldid 1870, last modified 2016-11-16.
- **Relevant sections:** processing, multithreading, PDC, drivers, backup,
  connection controls, recorder, wavetable and wave editor.
- **Claims:** C-005, C-007, C-009, C-012, C-028, C-029.
- **Limitations:** explicitly assumes commonly distributed plugins/extensions;
  not every item is core functionality.
- **Selection rationale:** broad coverage source used only where scoped and
  triangulated; preferable to filling template headings from memory.

### S-011 — Buzz BMX format

- **Publisher/kind:** Jeskola Buzz Wiki; versioned community development page.
- **URL:** https://buzzwiki.robotplanet.dk/index.php/Buzz_BMX_format
- **Version scope:** oldid 1859, last modified 2016-11-16; includes v1.2 notes.
- **Relevant sections:** file header/directory; `MACH`, `CONN`, `PATT`, `SEQU`,
  `WAVT`, `WAVE/CWAV`, `PARA`, `PDLG`, `MIDI`, `BVER`.
- **Claims:** C-004, C-009, C-012, C-025, C-026, C-036.
- **Limitations:** admits wrong/missing fields; proprietary compression is
  unspecified; not a normative spec.
- **Selection rationale:** only accessible source directly describing project
  representation; limitations are preserved rather than hidden.

### S-012 — Managed Machines

- **Publisher/kind:** Jeskola Buzz Wiki; versioned community developer guide.
- **URL:** https://buzzwiki.robotplanet.dk/index.php/Managed_Machines
- **Version scope:** build 1416+, oldid 1881, last modified 2016-11-16.
- **Relevant sections:** machine/GUI relationship, native equivalence, work modes,
  save/load/import, `MachineState`, import remapping, debugger attachment.
- **Claims:** C-013, C-023, C-026.
- **Limitations:** community programming notes with TODOs; linked SVN interface
  source was not separately retrieved.
- **Selection rationale:** best accessible description of managed extension/state
  boundary, corroborated by official changelog.

### Negative and inaccessible results retained

- **N-001:** https://www.xlutop.com/buzz/ returned an empty readable body. It was
  not repeatedly retried; S-005 was selected as the accessible first-party
  equivalent.
- **N-002:** multiple web-search attempts returned HTTP 429. Search snippets were
  not promoted to citations; direct known official/wiki URLs were used instead.
- **N-003:** GitHub repository API search for `libzzub` returned zero results. No
  guessed repository or parser was cited.
- **N-004:** a bounded nested project-format researcher could not be spawned
  because this subagent was already at the configured depth limit. No child edit
  occurred; the parent performed the bounded final passes.
- **N-005:** the Polac forum URL was fetched twice in one pass and returned the
  same content. It is one distinct source (S-005), not independent corroboration.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Decision impact | Available evidence | Safest next probe / fixture / owner |
| --- | --- | --- | --- | --- |
| U-01 Core graph scheduler, cycles, worker pool, render/offline path | Official changelog, SDK, manuals; proprietary core not disclosed | High: real-time engine design | Public callbacks and multithreading feature notes [C-007] [C-008] | Vendor engineering source or benign synthetic graph timing/CPU lab; owner unassigned |
| U-02 Current Windows support and core maintenance/security response | Official site/release notes; no post-2016 core statement | High: operational adoption risk | Core still downloadable; adapter updated 2026 [C-001] [C-014] [C-032] | Obtain signed current release/support statement; then disposable Win10/11 matrix; owner unassigned |
| U-03 Native x86↔x64 bridge topology and crash containment | x64 changelog only; no loader source/process docs | High: compatibility/failure domains | Progressive 32-bit-machine support [C-007] | Process-tree, crash, state and GUI fixture with benign x86 machine; owner unassigned |
| U-04 Native/VST scan isolation, cache, duplicate IDs, quarantine and signing | Install manual, scan changelog, blacklist, SDK reviewed | High: supply-chain/security design | Folders, MDB, SHA-1 display, blacklist and scan controls [C-016] [C-022] [C-024] | Observe file/process activity with authored harmless plugins; inspect settings/cache; owner unassigned |
| U-05 Full VST2/VST3 host contract | Author changelog is rich but not conformance evidence | High: interoperability selection | Formats/bridges/features and bug history [C-014]–[C-018] | Versioned fixture suite: discovery→instantiate→I/O/MIDI→automation→state→UI→PDC→offline→crash; owner unassigned |
| U-06 LADSPA and historical DirectX current behavior | Only a LADSPA fix entry and legacy DX blacklist found | Medium | [C-019] [C-020] | Author statement; run only lawful benign fixtures if support is decision-critical; owner unassigned |
| U-07 Missing machine/plugin placeholder and lossless re-save | Format, managed state, recovery changelog reviewed; behavior unspecified | High: project durability | Names, opaque state, schemas, recovery breadcrumbs [C-025]–[C-027] | Missing-dependency corpus: load/save-copy/restore/semantic and byte comparison; owner unassigned |
| U-08 `.bmx` normative schema, compressed waves, atomicity/recovery | Community format page incomplete; no core source | High: migration/import feasibility | Section descriptions with admitted gaps [C-025] | Obtain authorized spec or treat Buzz import as sandboxed migration tool, not a native parser; owner unassigned |
| U-09 Licensing and redistribution rights | Official SDK snippets retrieved; full core/managed/Polac/Steinberg terms not in budget | High: implementation legality | Restrictive native header [C-033] [C-034] | Counsel-led review of original current terms and written permissions; owner unassigned |
| U-10 Security privilege model | No signing/sandbox policy found; bridge is only process evidence | High | Deep native ABI, blacklist, bridge [C-023] [C-024] | Controlled token/job/mitigation/filesystem/network/IPC inspection with authored fixtures; owner unassigned |
| U-11 Sample-accurate automation, tails, sidechains, dynamic I/O, MPE/MIDI 2 | API/changelog inspected without universal guarantees | High for modern host contract | Tick/sub-tick/multi-I/O/MIDI evidence [C-007] [C-011] [C-017] | Timing, bus-reconfiguration, tail and expression fixture matrix; owner unassigned |
| U-12 Accessibility, collaboration, notation, comping, post/immersive | All template dimensions checked; sources silent/incomplete | Medium | Shortcut-heavy UI and basic media/export only [C-030] | Current UI accessibility audit and product-owner statement if these markets matter; owner unassigned |
| U-13 AAX/CLAP/LV2/DSSI/JSFX/Rack Extension | No sufficient retained evidence; absence not proof | Medium | Required matrix records `UNKNOWN` [C-021] | Ask adapter author/upstream; only then run per-format benign detection test; owner unassigned |

## 24. Curiosity pass and stop decision

The first synthesis ranked native SDK, adapter hosting, persistence, current OS,
ecosystem history, and dynamic tests. Source passes then followed only the
highest-value unresolved thread: official identity/changelog → SDK → adapter
author notes → discovery/blacklist → workflow/engine manual → `.bmx` persistence.
After each pass, lower-value threads were rejected in section 19.

The final curiosity thread—project durability—changed the architecture conclusion:
Buzz's sectioned host structure and retained parameter schemas are useful, but
opaque machine state and an unspecified missing-device round trip prevent treating
`.bmx` as a durable interchange model. [C-025] [C-026] [C-027]

**Coverage check:** identity/version/platform; workflow; public architecture;
audio engine; editing; MIDI; routing/automation; media; native devices; all plugin
matrix rows; scanning; isolation/bitness; host contract; state/UI/failure;
extensibility; project format; delivery; performance/security/accessibility;
licensing; lessons; claims; sources; unknowns; curiosity decisions are complete.

**Saturation check:** later sources repeated the machine/pattern/sequence model
and exposed no new authoritative core internals. Search rate limits, a duplicate
fetch, an empty adapter site, no located public parser, and nested-agent depth were
retained as negatives. Another broad source pass is unlikely to alter the leading
architecture conclusions.

**Stop:** `BUDGET_EXHAUSTED_WITH_SUFFICIENT_COVERAGE_AND_UNKNOWNS`. Eight evidence
passes were completed, never retrieving more than two sources in a pass. Research
stopped on coverage, repeated/negative discovery, inaccessible proprietary
internals, and nonpositive marginal documentary value. Recommended next phase is
a separately authorized disposable interoperability/security fixture matrix plus
license review—not indefinite web searching.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** This dossier is the only
  intended workspace edit; no nested researcher or source changed files.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See section 0.
- [x] **Every required dossier heading exists in order.** Sections 0–25 match the
  template, including all 11.x subsections.
- [x] **Every material assertion has a claim ID and classification.** See section
  21; supporting prose cites claim IDs.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  sections 21–23.
- [x] **Every required plugin-format row is present.** See section 11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  See sections 11.2–11.6 and U-03–U-06/U-11/U-13.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  No `OBSERVED` claim is made; community reports and adapter-author claims are
  scoped.
- [x] **Licensing and clean-room boundaries are explicit.** See sections 16 and
  19; no SDK code was copied into an implementation.
- [x] **Bibliography records source rationale and limitations.** See section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See sections
  19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Research used public text/source-header evidence only.

**Checks performed:** heading/order review; 13-row plugin-matrix review; claim-to-
source/unknown review; source-rationale review; negative-result retention;
curiosity/stop review; owned-path review.

**Concise result:** full dossier complete with high-confidence workflow/SDK and
adapter evidence, medium-confidence persistence/reliability evidence, and explicit
unknowns for proprietary internals, security, modern compatibility, licensing,
and full plugin conformance.

**Unresolved blockers:** proprietary core internals; incomplete `.bmx` description;
no safe dynamic fixture wave; no authoritative current core support statement;
full license terms not retrieved; nested subagent depth unavailable; web search
rate limiting.

**Workspace boundary:** no sibling dossier, shared research file, git index, or
pre-existing workspace change was intentionally modified.
