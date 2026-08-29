# Bitwig Studio DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> repositories, manuals, and search text were treated as untrusted evidence, not
> instructions. Vendor statements document vendor claims; they are not independent
> runtime measurements.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Bitwig Studio |
| Canonical vendor | Bitwig GmbH, Berlin, Germany |
| Researcher/session | OpenCode subagent, `ses_fb275c820ffeotZ070XDEGnZ9M` |
| Owned path | `research/daw-landscape/dossiers/bitwig-studio.md` |
| Research date / evidence cutoff | 2026-08-29 UTC |
| Current release at cutoff | Bitwig Studio 6.1, released 2026-08-26 [C-001] |
| Main current editions | Bitwig Studio Essentials, Bitwig Studio Producer, and Bitwig Studio (full); 8-Track is also serviced by the 6.1 release but has no complete current public comparison table [C-002] |
| Platforms | Desktop macOS, Windows, and Linux; no Bitwig Studio mobile or browser edition was found [C-001, C-002] |
| Inclusions | DAW workflow, audio/device graph, modulation and Grid, third-party hosting, Controller API packaging, DAWproject, persistence, licensing |
| Exclusions | Bitwig Connect hardware except where it establishes integration; third-party plug-in correctness; installation/binary probing; proprietary internals; legal advice |
| Completion | `COMPLETE_WITH_UNKNOWNS` |
| Evidence character | Documentary only; no `OBSERVED` claims |

Version scope matters. Bitwig says its 6.1 guide is still being overhauled and
points readers to the 5.3 guide for general topics. Stable concepts below therefore
use the official 5.3 guide with an explicit version limitation and are updated by
6.0/6.1 material where available [C-001, C-040].

## 1. Executive summary

- **Workflow:** Bitwig combines a linear Arranger with a nonlinear Launcher. Their
  clip data is independent, but clips can be copied between them and Launcher
  performances recorded into the Arranger. Version 6 adds reusable automation clips
  and shared-pattern aliases for audio, note, and automation clips [C-005, C-006].
- **Graph:** Each track owns a serial device chain that can recursively contain
  parallel layers/selectors and pre/post/wet/feedback subchains. Third-party plug-ins
  can occupy any level. Grid adds a native patch-cord graph for instrument, effect,
  and note processing in the full edition [C-007, C-009].
- **Hosting headline:** Bitwig documents VST2.4, VST3, and CLAP across macOS,
  Windows, and Linux; AU is explicitly unsupported. All three main editions host
  unlimited VST/CLAP, while multi-output hosting is withheld from Essentials
  [C-010, C-011, C-021]. AAX, LV2, and the remaining long-tail matrix formats are
  explicit documentary unknowns, not assumed negatives [C-012].
- **Isolation differentiator:** Five user-selectable hosting modes span in-engine
  execution through one process per instance, with per-plug-in overrides and reload
  controls after crash. This is unusually explicit public fault-domain control
  [C-015, C-016]. The IPC protocol, scheduler, state checkpoint, and exact
  application/audio-engine process topology remain proprietary or contradictory in
  public wording [C-017, C-029, C-040].
- **Host contract:** Public evidence covers sidechains, PDC, VST3 per-note expression
  and sample-accurate automation, CLAP polyphonic modulation, MPE forcing, suspend
  policy, dynamic creation of multi-output chains, generic parameters, floating
  custom UIs, offline/realtime render, state persistence, and missing/version-conflict
  diagnostics. Stable parameter IDs, tails, arbitrary live bus renegotiation, UI
  scaling/headless behavior, and exact crash-state restoration remain unknown
  [C-021–C-031].
- **Interchange/extensions:** JavaScript controller scripts and Java `.bwextension`
  packages are public extension boundaries. DAWproject 1.0 is an MIT-licensed
  ZIP/XML interchange container that embeds plug-in state, but unsupported plug-in
  formats and DAW-specific Launcher features still constrain recall [C-034, C-035,
  C-038].
- **Confidence:** High for user-visible workflow, editions, named formats, sandbox
  modes, and failure UI; medium for applying 5.3 manual behavior to 6.1; low for
  proprietary internals and untested format-contract completeness.

## 2. Product identity, history, and market position

Bitwig Studio is a maintained commercial DAW from Bitwig GmbH. At the cutoff,
6.1 was released three days earlier for Studio, Producer, Essentials, and 8-Track.
The public shop positions Essentials as entry level, Producer as a broader studio/
stage edition, and full Studio as the sound-design edition with complete modulation
and Grid [C-001, C-002].

The current main family is cross-platform across macOS, Windows, and Linux. The
public comparison lists unlimited audio, instrument, hybrid, group, effect tracks,
and scenes for all three main editions, but differentiates device inventories,
modulators, audio I/O buses, comping, layered editing, multi-out plug-ins, display
profiles, and Grid [C-002, C-033].

**INFERENCE:** Bitwig's market position is a production/performance DAW with an
unusually deep sound-design and fault-isolation emphasis. This follows from the dual
sequencers, nested graph, modulation, Grid, MPE/CV, and configurable plug-in
sandboxing; it is not a market-share claim [C-041].

## 3. Workflow and conceptual model

A `.bwproject` represents a project. Projects contain tracks; each track has a signal
path and mixer controls. Clips hold audio or notes plus control/automation data.
Multiple projects can be open in tabs, but only one has active audio at a time
[C-004, C-027].

The Arranger is linear. The Launcher is nonlinear and groups clips into scenes.
Their data is separate: editing an Arranger clip does not mutate a Launcher clip.
Users can copy between them, record Launcher output to Arranger tracks, and select
Arranger-versus-Launcher control per track; one clip plays per track [C-005].

Version 6 adds automation clips with loop/start/stretch/library behaviors and aliases.
Aliases share a pattern while retaining per-clip settings, work in both sequencers,
and can be made unique. Audio, note, and automation clips can all be aliased [C-006].

The other central mental model is a recursive device graph: serial track chains,
nested containers, host modulation, and—only in full Studio—Grid patching [C-007,
C-008, C-009]. There is no tracker or notation-first model documented [C-042].

## 4. Publicly documented architecture

The strongest safe architectural facts are user-visible boundaries:

- Plug-ins may execute with the audio engine or in configurable separate processes;
  recovery can target an individual plug-in, all crashed plug-ins, or the audio
  engine [C-015, C-016].
- Projects become editable while plug-ins continue loading; several projects can
  remain open, with audio active for one [C-004, C-017].
- Device/DSP code is described as compiling in parallel and being cached for later
  loads, but no public scheduling algorithm or compilation architecture is specified
  [C-017, C-040].
- Tracks compile user-visible serial/nested routing, while Grid presents a separate
  module graph inside native devices [C-007, C-009].
- Controller scripts/extensions and DAWproject are public extension/file boundaries
  [C-034, C-035].

**Contradiction:** a current architecture article says application, engine, and
plug-ins are in separate “threads,” while the support/manual sources repeatedly say
plug-ins run in separate “processes.” Plug-in process isolation is documented;
whether application and audio engine are separate OS processes, and how they
communicate, is `UNKNOWN` [C-017].

Thread pool topology, realtime priority policy, graph recompilation, IPC transport,
shared memory, state transactions, watchdogs, and deterministic scheduling are
`UNKNOWN`; public behavior is not evidence of those internals [C-040].

## 5. Audio engine

Bitwig documents 32-bit floating-point processing, sample rates up to 192 kHz, and
“full multicore and multiprocessor support.” Sample rate and block size are selectable
or automatic. PDC is advertised for VST/CLAP, but its graph algorithm and edge cases
are not disclosed [C-003, C-031, C-032].

The host exposes realtime and offline paths. Bounce can render pre-FX, pre-fader,
post-fader, or a selected top-level device junction; export is offline by default and
can be forced realtime for external hardware. Bounce In Place can replace source
clips while preserving a device chain and can produce a hybrid track [C-030].

The engine can be reloaded without necessarily closing the application, and changing
hosting mode for existing instances requires project or engine reload [C-015, C-017].
No public source specifies denormal handling, oversampling policy, dropout strategy,
plugin-tail truncation, render determinism, core-affinity, or maximum graph size
[C-026, C-040].

## 6. Tracks, timeline, clips, and editing

Audio, instrument, and hybrid tracks coexist with effect and nested group tracks;
the three main editions list these as unlimited [C-002]. Arranger and Launcher data
and arbitration are described in section 3 [C-005]. Version 6 provides clip aliases,
automation clips, key signature, expression editing, layered note/audio views, and
new editing tools [C-006].

Audio comping is documented for Producer/full in both Arranger and Launcher, but not
for Essentials. Producer/full get eight stretching algorithms; Essentials gets three.
All three have Bounce/Bounce In Place, while layered editing and slice-to workflows
are edition-dependent [C-033].

Edits are project-object operations rather than destructive source-file rewrites in
the documented workflows; bounce deliberately creates new audio and can replace a
clip [C-030, C-046]. Ripple editing, notation layout, source-control merge semantics,
and an exposed edit-decision-list format are not documented [C-042].

## 7. MIDI, sequencing, notation, and expression

Bitwig records and edits notes in clips, provides piano-roll/drum/hybrid editing,
note generators/effects, per-note expressions, and MPE playing/recording/editing in
all three main editions [C-002, C-006, C-045]. Grid directly supports note and MPE
signals. CLAP may expose polyphonic modulation/voice stacking, and VST3 hosting is
documented for per-note expressions [C-008, C-009, C-023].

Synchronization includes incoming MIDI Clock or Ableton Link and outgoing MIDI Clock,
start/stop, SPP, and MTC. Hardware devices cover MIDI, CV, clock, and external audio
[C-032].

Traditional score/notation, MIDI 2.0/UMP, and a complete SysEx record/edit contract
were not found in current Bitwig primary sources and remain `UNKNOWN` [C-042].

## 8. Routing, mixer, automation, and control

Track device chains pass notes/MIDI/audio left-to-right and return audio to track
mixer/output routing. Nested chains create serial and parallel routing, selectors,
wet/dry, feedback, multiband, pre/post-FX, and per-drum/instrument layers. Effect
tracks expose per-track sends [C-007].

Third-party sidechain hosting is included in all three main editions; dynamic
multi-output chains are Producer/full only. Multi-out channels appear in the mixer
and can feed other tracks or Audio Receiver [C-021, C-022]. “Dynamic” here means the
user can add output chains; it does not prove arbitrary live bus-layout renegotiation
[C-026].

Track, group, and project modulators can target exposed device/mixer/transport
parameters; version 6 supports lane or clip automation, hold/curvature/spread, and
aliases [C-006, C-008]. VST3 automation is documented as sample-accurate, but this is
not generalized to VST2 or every CLAP plug-in [C-023].

MIDI controller mapping, project remotes, JavaScript/Java controller extensions,
MIDI Clock/MTC, and Link are documented. OSC and a general-purpose DAW scripting API
were not found [C-032, C-034]. Surround/immersive mixing and feedback-permission
rules beyond named device feedback chains remain unknown [C-042].

## 9. Recording, comping, and media handling

The current edition table documents input buses, audio comping for Producer/full,
loop-oriented clips, eight-versus-three stretch algorithms, and import of WAV, AIFF,
MP3, AAC, WMA, FLAC, OGG Vorbis, and MIDI [C-002, C-033]. Version 6.1 adds sliced
Sampler workflows and can save sliced audio using the open PreSonus AUDIOLOOP format
[C-001].

Project folders separate samples, recordings, master recordings, bounce files, and
plug-in state. The Project Panel identifies internal, external, and missing audio;
it can find/replace files, collect external/package assets, and delete unused files
[C-027, C-046].

Direct video playback is explicitly unsupported. Proxy/conform workflows, BWF/ADM
metadata depth, field-recorder matching, and post-oriented reconform are not
documented [C-036, C-042].

## 10. Instruments, effects, content, and native devices

The editions expose increasing native inventories (51/105/188 instruments, audio/
note FX, and related devices as marketed), 10/18/43 modulators, and 22/28/53 sound
packages. Full Studio alone includes the editable Grid and the complete modulation
system [C-002, C-009].

Native devices participate in serial/nested graphs and a unified modulation/remotes
model. Layer/Selector containers, Drum Machine, spectral splitters, Sampler, native
instruments/effects, and hardware routing are architecture-relevant; listing every
device is intentionally out of scope [C-007, C-008].

Grid has Poly Grid, FX Grid, and Note Grid device boundaries, 180+ modules in the
5.3 guide, signal ports/cords, module replacement that preserves compatible settings,
MPE/CV integration, and automatable/script-addressable parameters [C-009].

When a project contains a native device unavailable in the user's edition, Player
mode preserves remote controls, sequencing, bounce, and resave rather than simply
discarding the graph [C-044].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means no retained primary evidence established acceptance/rejection; it is
not a claim of support. Main-edition limits are explicit; 8-Track's exact current
plug-in count/features remain unknown [C-002, C-012].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `DOCUMENTED` | `DOCUMENTED` | `DOCUMENTED` | `NOT_APPLICABLE:no mobile/web edition` | 6.1 family; unlimited in Essentials/Producer/full; 8-Track exact limits `UNKNOWN` | VST2.4 named on all desktop platforms; VST2 SDK distribution is legacy-restricted | [C-010, C-038] / S-001, S-010, S-011, S-025 |
| VST3 | `DOCUMENTED` | `DOCUMENTED` | `DOCUMENTED` | `NOT_APPLICABLE:no mobile/web edition` | 6.1 family; unlimited in three main editions | Per-note expression and sample-accurate automation documented; SDK is MIT at cutoff | [C-010, C-023, C-038] / S-001, S-010, S-025 |
| AUv2 | `DOCUMENTED:unsupported` | `NOT_APPLICABLE:macOS format` | `NOT_APPLICABLE:macOS format` | `NOT_APPLICABLE:no mobile edition` | Support FAQ is family-wide; AU generation not distinguished | Bitwig says Audio Units are not supported; applies conservatively to AUv2 without claiming AU-version-specific testing | [C-011] / S-012 |
| AUv3 | `DOCUMENTED:unsupported` | `NOT_APPLICABLE:Apple format` | `NOT_APPLICABLE:Apple format` | `NOT_APPLICABLE:no mobile edition` | Support FAQ is family-wide; AU generation not distinguished | Generic “Audio Units” rejection, not an AUv3 fixture result | [C-011] / S-012 |
| AAX | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no mobile/web edition` | Not in exhaustive current Bitwig host lists | No public Bitwig evidence of AAX scanning/hosting; do not infer only from AAX's Pro Tools association | [C-012] / S-001, S-010, S-011, S-012 |
| CLAP | `DOCUMENTED` | `DOCUMENTED` | `DOCUMENTED` | `NOT_APPLICABLE:no mobile/web edition` | 6.1 family; unlimited in three main editions | Polyphonic modulation/voice stacking can work when plug-in supports it; format SDK MIT | [C-010, C-023, C-038] / S-001, S-009, S-010, S-026 |
| LV2 | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no mobile/web edition` | Not in current official host list | No primary Bitwig support or rejection evidence retained | [C-012] / S-001, S-010, S-011 |
| LADSPA | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no mobile/web edition` | Not in current official host list | No primary Bitwig support or rejection evidence retained | [C-012] / S-001, S-010, S-011 |
| DSSI | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no mobile/web edition` | Not in current official host list | No primary Bitwig support or rejection evidence retained | [C-012] / S-001, S-010, S-011 |
| JSFX | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no mobile/web edition` | Not in current official host list | No primary Bitwig support or rejection evidence retained | [C-012] / S-001, S-010, S-011 |
| DirectX/DXi | `NOT_APPLICABLE:non-Windows` | `UNKNOWN` | `NOT_APPLICABLE:Windows format` | `NOT_APPLICABLE:no mobile/web edition` | Not in current official Windows host list | No primary Bitwig support or rejection evidence retained | [C-012] / S-001, S-010, S-011 |
| Rack Extension | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no mobile/web edition` | Not in current official host list | No primary Bitwig support or rejection evidence retained | [C-012] / S-001, S-010, S-011 |
| Product-native/other | `DOCUMENTED` | `DOCUMENTED` | `DOCUMENTED` | `NOT_APPLICABLE:no mobile/web edition` | Native device inventories differ by edition; Grid is full only | Bitwig devices/presets/Grid are native, not a public third-party audio-plug-in SDK; controller extensions are a separate API | [C-002, C-009, C-034, C-044] / S-001, S-016, S-017, S-020 |

### 11.2 Discovery, scanning, validation, and recovery

- Dashboard Locations accepts folders to scan. When duplicate formats can be
  matched, preferences can hide VST behind CLAP, VST2 behind VST3, 32-bit behind
  64-bit, or emulated Intel behind native ARM on macOS. “Hide” is not deletion and
  the identity-matching algorithm is not public [C-013].
- VST indexes/metadata are cached under documented per-user Bitwig paths. Vendor
  recovery for upgraded/missing VSTs is to delete `index` and `vst-metadata`, forcing
  regeneration [C-014].
- Linux Flatpak cannot see `/usr/lib`; Bitwig recommends Flatpak plug-ins or a folder
  reachable inside the sandbox, such as the user's home directory [C-014].
- Default format-specific search paths, automatic scan timing, signature/notarization
  checks, scan-worker isolation, blacklist/quarantine schema, duplicate keys, and a
  supported one-click rescan UX remain `UNKNOWN` [C-026]. Cache deletion is not
  evidence of validation or quarantine.

### 11.3 Runtime isolation and compatibility

Hosting modes are [C-015]:

1. `Within Bitwig` — plug-ins share the audio-engine fault domain.
2. `Together` (documented default) — all plug-ins share a process separate from the
   audio engine.
3. `By manufacturer` — one sandbox grouping per manufacturer.
4. `By plug-in` — instances of the same plug-in share a grouping.
5. `Individually` — one sandbox per instance.

Users may force named plug-ins to `Individually`. Existing project instances do not
change mode until project/engine reload. A crashed plug-in shows a replacement panel
with `Reload Plug-in` and `Reload All Plug-ins`; the vendor says audio can often
continue [C-015, C-016]. No claim is made that every fault, hang, or kernel/driver
failure is contained.

Windows/Linux native bit bridging covers 32-/64-bit plug-ins [C-018]. The historical
5.3 Windows-on-Arm design used a native Arm64 DAW and separate hosts for Arm64,
Arm64EC, x64, and x86 plug-ins, but its precise 6.1 topology is unknown [C-019]. On
Apple silicon, duplicate selection can prefer native over Rosetta Intel, but the
execution/bridge topology is undocumented [C-020]. Linux system requirements specify
x86-64 AVX2 [C-001]. Code-signing policy and compatibility shims are unknown [C-026].

### 11.4 Host/plugin processing contract

- Sidechain hosting and delay compensation are documented for VST/CLAP in all three
  main editions. Producer/full add multi-output [C-021, C-022, C-031].
- Multi-out chains can be added manually or automatically and routed as mixer channels,
  track inputs, or Audio Receiver sources [C-021]. Live arbitrary bus reconfiguration
  remains unknown [C-026].
- VST3 per-note expressions and sample-accurate automation are documented. Plug-ins
  can be forced into MPE with a selected pitch-bend range. CLAP can support
  polyphonic modulation and voice stacking when the plug-in implements it [C-023,
  C-024]. MIDI 2.0 is unknown [C-042].
- Suspend policy is `Never`, host-detected `When silent`, or default `Trust plug-in`
  notifications [C-024].
- Offline export/bounce is documented at host level, with a realtime override
  [C-030]. Per-format offline callback fidelity, tail reporting, bypass semantics,
  event-bus multiplicity, and block adaptation are unknown [C-026].

The CLAP specification defines optional audio/note ports, state, render, latency,
tail, GUI, preset, thread-pool, and dynamic-port extensions, but that is format
capability—not evidence that Bitwig implements every extension [C-038].

### 11.5 Parameters, automation, state, presets, and project recall

Bitwig supplies a searchable generic parameter list with a last-touched “joker”
control, remotes, host automation, and modulation. VST3 sample accuracy and CLAP
polyphonic modulation have the narrower documented guarantees above [C-023, C-025].

Native project folders include `plugin-states`; plug-in presets can include attached
post-FX chains. DAWproject embeds plug-in state and parameter automation for VST2,
VST3, AU, and CLAP, but the importing host must support the plug-in format [C-027,
C-035].

Stable parameter identifier rules, ranges/text round-trip, state atomicity, asset
reference policy, format migration, VST2↔VST3/CLAP substitution, and crash reload's
exact restoration checkpoint remain unknown [C-026, C-029].

### 11.6 UI, diagnostics, and failure modes

The device panel embeds Bitwig's generic parameter UI. The plug-in's custom editor
opens as a floating window. Multi-out and post-FX chain controls stay in the host
panel [C-025]. Custom-UI embedding, scaling negotiation, multiple views, remote GUI
transport for sandboxed processes, and headless behavior are unknown [C-026].

Project diagnostics identify missing plug-ins and older-version conflicts, can filter
those lists, and can ignore version conflicts. They do not document automatic
substitution or a state-bearing missing-plugin placeholder [C-028, C-029]. Crash UI
and cache regeneration are covered by [C-014, C-016]. Scan logs, quarantine reasons,
hang timeouts, and per-instance CPU/IPC diagnostics were not found [C-026].

## 12. Extensibility and integration

The Open Controller API has two documented package types: JavaScript `.js` scripts
under per-user `Controller Scripts` folders and Java `.bwextension` files under
`Extensions`; `.bwextension` can also be drag-installed in versions 4.2.5+. Controllers
can be auto-detected or added manually [C-034].

The Dashboard provides an in-app Controller Scripting Guide, but the retained public
page does not establish controller-code sandboxing, permissions, signature policy,
API semantic versioning, Java runtime boundary, or backwards-compatibility guarantees
[C-034, C-040]. Controller extensions are control-surface integrations, not native
audio DSP plug-ins.

Other integration surfaces include MIDI mappings/remotes, MIDI Clock/MTC, Ableton
Link, MPE, CV/hardware devices, DAWproject, ALS/FLP import, and standard audio/MIDI
export [C-032, C-035]. A public general-purpose project-mutation scripting API or OSC
server was not found [C-042].

## 13. Project format, persistence, interoperability, and collaboration

The native `.bwproject` lives in a project folder with generated media and
`plugin-states`; this proprietary native representation is not documented as a public
schema. Version 6 permanently backs up an older-version project when it is first
opened in a newer version [C-006, C-027]. Autosave cadence, journal protocol, atomic
writes, and forward/backward compatibility guarantees are unknown [C-029, C-040].

Files can be collected/relinked; missing plug-ins and version conflicts are surfaced
[C-028, C-046]. Player mode preserves limited edit/playback for native devices absent
from a lower edition [C-044]. Missing third-party plug-in pass-through and state
placeholder behavior are unknown [C-029].

DAWproject 1.0 is a stable MIT-licensed ZIP container with XML project/metadata and
embedded plug-in state. It carries track/timeline structures, audio, notes/expression,
automation, generic devices, plug-ins, clips, and scenes, while expressly not being
a native format or storing view/preferences [C-035, C-038]. Practical fidelity is
capability-dependent: Bitwig does not read AU state, and the cited Studio One version
does not read Bitwig CLAP or Launcher data [C-035].

Bitwig also documents Ableton Live/FL Studio project import and audio/MIDI export,
but no AAF/OMF/ADM/MusicXML workflow was established [C-035, C-042]. Released cloud
collaboration is explicitly absent; cloud-synced project folders are not supported
[C-036].

## 14. Delivery, live, post-production, and specialized workflows

Launcher scenes, per-track sequencer arbitration, MPE/CV/hardware integration,
realtime bounce, and plugin crash containment make live performance a documented
first-class use case [C-005, C-016, C-030, C-045].

Delivery supports master or multitrack/stem export, multiple formats, sample-rate
selection, bit depth/dither, pre-fader export, and offline or realtime execution
[C-002, C-030]. Only Arranger selections export directly; Launcher performances can
first be recorded to Arranger [C-005, C-030].

Direct video playback is unsupported. No primary evidence established DDP, ADR,
AAF/OMF, surround/immersive/ADM, loudness compliance, notation delivery, or batch
render queues; these are unknown, not inferred absent product capabilities [C-036,
C-042].

## 15. Performance, reliability, security, and accessibility

Reliability controls include five plug-in fault-domain modes, per-plug-in isolation,
crash reload, audio-engine reload, PDC, cache regeneration, older-project backups,
and missing/version-conflict diagnostics [C-014–C-017, C-028, C-031]. Vendor claims
of uninterrupted performance are not independent stress-test results.

Current requirements are macOS 12+, Windows 10/11 64-bit, or Ubuntu 24.04+/modern
Flatpak; 4 GB RAM, 1280×768, and AVX2 where specified. Apple silicon and Intel macOS
are supported; Linux is x86-64 AVX2. Windows-on-Arm is separately documented, despite
an omission in the current requirements CPU row [C-001, C-019].

Security boundaries are only partially public. Separate plug-in processes reduce
crash blast radius but do not establish OS sandbox entitlements, filesystem/network
denial, syscall filtering, code-signature enforcement, or malicious-plugin containment
[C-015, C-026]. Flatpak imposes a visible filesystem boundary on Linux [C-014].

The UI is scalable/vector-based, offers touch integration and multiple display
profiles by edition, and the support index lists seven localizations. No primary
evidence established screen-reader semantics, keyboard-only completeness, WCAG
conformance, or accessible plug-in custom UIs [C-002, C-039, C-042].

Activation/update metadata is described in the terms; optional crash reports and
usage-data collection are documented. Privacy/security properties were not audited
[C-039].

## 16. Licensing, ecosystem, and implementation constraints

Bitwig Studio is commercial vendor software. Purchase grants a non-exclusive,
unlimited-duration private/business use right, subject to a separate EULA, with one
year of functional updates and activation on no more than three computers. These are
cutoff terms, not legal advice [C-037, C-039].

Format constraints [C-038]:

- Current VST3 SDK releases are MIT; redistributed substantial code must retain the
  license/copyright notice. Steinberg says usage guidelines are optional.
- VST2 is not equivalent: only parties that signed before October 2018 may distribute
  VST2 plug-ins/hosts, and VST2 headers may not be redistributed. A new DAW must not
  infer a right from Bitwig's existing support.
- CLAP's ABI/spec repository is MIT and targets compatible CLAP 1.x binaries.
- DAWproject is MIT; it is an interchange schema/library, not Bitwig's native format.
- AU and AAX platform/SDK/trademark/certification terms need independent legal review
  before any new implementation. Bitwig's lack of AU/AAX hosting grants no rights.

Clean-room adaptation may copy architectural ideas at the level of requirements and
independently designed mechanisms; it must not copy Bitwig code, protected UI/text,
private protocols, SDK material contrary to license, trademarks, or proprietary file
internals [C-040].

## 17. Strengths, liabilities, and architecture lessons

**Strengths supported by evidence**

- Explicit, user-selectable plug-in fault domains and recovery UI [C-015, C-016].
- Recursive devices plus host-wide modulation put native and third-party devices in
  one compositional graph [C-007, C-008, C-025].
- Dual independent sequencers with capture from performance to arrangement [C-005].
- Cross-platform VST2/VST3/CLAP, Windows/Linux bit bridging, VST3 expression/timing,
  and CLAP polyphonic features [C-010, C-018, C-023].
- Project diagnostics, asset collection, edition-degradation Player mode, and open
  DAWproject interchange [C-028, C-035, C-044, C-046].

**Liabilities/risks**

- AU is unavailable, and long-tail format statuses are undocumented [C-011, C-012].
- Extra isolation spends RAM and may create IPC complexity; vendor UI exposes the
  tradeoff but not measurements [C-015, C-040].
- Essentials lacks multi-out and comping; Grid is full-edition only [C-002, C-021,
  C-033].
- Missing-plugin placeholder semantics, validation/quarantine, parameter identity,
  UI scaling, and crash-state checkpoint are undocumented [C-026, C-029].
- Architecture wording conflicts (“threads” versus “processes”), so internal topology
  is unsafe to emulate from documentation [C-017].

**Recommendation:** treat Bitwig as a strong behavioral reference for hierarchical
graphs, modulation ownership, explicit fault-domain policy, asynchronous recovery,
and capability-aware interchange. Do not treat marketing claims or UI behavior as a
blueprint for IPC, realtime scheduling, persistence, or security [C-041].

## 18. Transferable patterns

| Pattern | Problem / minimal clean-room mechanism | Evidence | Prerequisites and tradeoffs | Risk / disposition |
| --- | --- | --- | --- | --- |
| Selectable plug-in fault domains | Policy groups instances into engine/global/vendor/binary/instance workers; isolate failure and expose targeted restart | [C-015, C-016] | IPC audio/event/state path; watchdogs; more RAM/latency/complexity | High implementation/security burden; `CANDIDATE` |
| Hierarchical device graph | Typed serial edges plus nested parallel/selector/pre/post/wet/feedback subgraphs | [C-007] | Graph validation, latency propagation, cycle policy, stable persistence | Avoid copying Bitwig UI/expression; `CANDIDATE` |
| Host-owned modulation layer | Modulator nodes target exposed parameter handles while preserving base values | [C-008, C-023] | Stable IDs/ranges, rate semantics, poly/mono model, feedback prevention | Contract details need prototype; `CONDITIONAL` |
| Performance/arrangement separation | Independent clip stores with per-track arbitration and explicit capture/copy | [C-005] | Conflict rules, capture timing, alias/pattern identity | Strong workflow value; `CANDIDATE` |
| Graceful dependency degradation | Persist unavailable dependency metadata; expose diagnostics, remotes, or placeholder while protecting state | [C-028, C-044] | Opaque state durability, bypass policy, replacement UX | Bitwig third-party placeholder behavior unknown; `CONDITIONAL` |
| Capability-aware interchange | Open container separates portable structure/media from opaque plug-in state and declares importer loss | [C-035, C-038] | Versioned schema, embedded assets, loss report, format availability | Do not promise universal recall; `CANDIDATE` |
| Architecture bridge through workers | Run foreign-architecture plug-ins in dedicated helper process instead of contaminating native host | [C-018, C-019] | OS emulation, IPC, installer compatibility, signing | Current topology/version varies; `CONDITIONAL` |

## 19. Rejected patterns and CURIOSITY_NO_GO

| Rejected mechanism/thread | Evidence / rationale | Reopen condition |
| --- | --- | --- |
| `CURIOSITY_NO_GO`: infer internals from crash containment | Process/fault behavior does not reveal IPC, shared memory, scheduler, or watchdog [C-017, C-040] | Public engineering paper or authorized disposable trace |
| `CURIOSITY_NO_GO`: treat absence from feature list as format rejection | Only AU has an explicit negative; AAX/LV2/etc. stay unknown [C-011, C-012] | Current vendor support matrix or safe fixture scan |
| `CURIOSITY_NO_GO`: enumerate every native device | Edition/device counts and graph categories already answer the architecture decision [C-002, C-007] | A particular device introduces a unique graph primitive |
| `CURIOSITY_NO_GO`: reconstruct current 8-Track limits from old pages | 6.1 services 8-Track, but current comparison omits a full column [C-002] | Current Bitwig 8-Track matrix |
| `CURIOSITY_NO_GO`: assume CLAP spec equals Bitwig implementation | CLAP extensions are optional; host support requires Bitwig evidence [C-026, C-038] | Bitwig host-capability matrix or dynamic conformance test |
| `CURIOSITY_NO_GO`: continue exact default-path searches | Custom paths, cache locations, and Flatpak boundary are established; defaults remain low-value [C-013, C-014] | Reproducible installation/UI probe |
| `CURIOSITY_NO_GO`: pursue marketing performance claims | No independent benchmarks; this wave is documentary | Controlled benchmark suite with fixed projects/plugins |
| `CURIOSITY_NO_GO`: copy proprietary native project structure | DAWproject is explicitly not the native format; `.bwproject` internals are undocumented [C-027, C-035, C-040] | Vendor-published schema/license |
| `CURIOSITY_NO_GO`: deeper post/video/notation inventory | No direct video; these do not change the plugin/sandbox decision in this dossier [C-036, C-042] | Decision frame changes to post-production/notation |
| `CURIOSITY_NO_GO`: desktop accessibility inference from scalable UI | Scaling/touch/localization do not prove assistive-technology support [C-042] | Accessibility conformance report or safe AT test |

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and result | Status / later probe |
| --- | --- | --- |
| H1: Arranger and Launcher share one mutable clip store | Manual says their data is completely separate, though copy/capture is supported [C-005] | **FALSIFIED as stated**; shared concept, separate data. Test alias edge cases dynamically. |
| H2: Plug-ins can run in configurable external fault domains | Five modes plus per-plugin override and crash UI are documented [C-015, C-016] | **SUPPORTED at behavior boundary**; worker/IPC internals unknown. |
| H3: VST2/VST3/CLAP are desktop-wide; AU/AAX/LV2 are absent | First three explicitly supported; AU explicitly rejected; no primary AAX/LV2 negative [C-010–C-012] | **PARTIAL**. Fixture-scan AAX/LV2 only if lawful/testable. |
| H4: Modulation is host-level and Grid is a native module graph | Manual documents unified parameter modulation and three Grid device roles [C-008, C-009] | **SUPPORTED**; control/audio-rate scheduling unknown. |
| H5: public docs expose boundaries, not IPC/scheduler internals | Process wording conflicts and no technical protocol appears [C-017, C-040] | **SUPPORTED**. Stop speculative search. |
| “Format accepted” implies full host contract | VST3 has explicit timing/expression; many other callbacks remain unknown [C-023, C-026] | **FALSIFIED**. Separate scan/instantiate/render/UI/state/bus tests. |
| Crash reload restores latest audible state exactly | UI says reload, but checkpoint and automation/state timing are not stated [C-016, C-029] | **UNKNOWN**. Crash a stateful disposable fixture at controlled edits. |
| Dynamic multi-out means arbitrary runtime bus changes | Source says users add chains; no bus renegotiation contract [C-021, C-026] | **NOT ESTABLISHED**. Use a fixture that adds/removes buses during playback. |

Counterevidence searches retained these negative results: no primary blacklist/
quarantine description; no AAX/LV2/LADSPA/DSSI/JSFX/DXi/Rack Extension acceptance or
rejection; no MIDI 2.0 statement; no stable parameter-ID/tail/UI-scaling contract;
no exact current ARM helper topology; and an obsolete AU article URL resolving to an
unrelated activation article. Search snippets were not cited [C-012, C-026, C-042].

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | 6.1 released 2026-08-26; current OS/CPU requirements are stated. | 6.1, cutoff | S-002, S-028 | Release notes + requirements | Requirements omit Windows Arm despite S-027. |
| C-002 | DOCUMENTED | High | Main editions are Essentials/Producer/full across three desktop OSes; 8-Track receives 6.1 but lacks a full current comparison. | 6.1 family | S-001, S-002, S-023, S-029 | Current comparison/shop/release | Exact 8-Track limits unknown. |
| C-003 | DOCUMENTED | Medium-high | 32-bit float, up to 192 kHz, multicore/multiprocessor are vendor-documented. | Current feature list | S-001 | Direct feature rows | No independent measurement or scheduler detail. |
| C-004 | DOCUMENTED | High | Projects contain tracks/signal paths and clips; multiple projects may open, one audio-active. | 5.3 stable concepts | S-011, S-013 | Manual + architecture page | Exact engine allocation unknown. |
| C-005 | DOCUMENTED | High | Arranger/Launcher hold separate data with copy, per-track arbitration, and performance capture. | 5.3+ | S-015 | Direct manual | Alias behavior updated by C-006. |
| C-006 | DOCUMENTED | High | v6 adds automation clips, aliases, expression/editor upgrades, and old-project backup. | v6 | S-029, S-002 | Current release story/changelog | Full 6.1 guide incomplete. |
| C-007 | DOCUMENTED | High | Device graph supports serial track chains and recursive container/pre/post/wet/feedback chains; plugins fit any level. | 5.3 stable concepts | S-014, S-020 | Direct manual | Runtime graph compiler unknown. |
| C-008 | DOCUMENTED | High | Unified modulation targets device/mixer/transport parameters and supports mono/poly behavior. | 5.3 stable concepts | S-009 | Direct manual | Exact rate/timing varies and is not fully specified. |
| C-009 | DOCUMENTED | High | Full Studio includes Poly/FX/Note Grid modular graph; module parameters integrate with automation/MPE/CV/scripts. | Edition table, 5.3 | S-001, S-016 | Direct primary sources | Producer/Essentials editable Grid absent from table; Player mode exception. |
| C-010 | DOCUMENTED | High | VST2.4, VST3, CLAP supported on macOS/Windows/Linux; unlimited in three main editions. | Current family | S-001, S-010, S-011, S-023 | Repeated official list | Does not prove every callback/plugin. |
| C-011 | DOCUMENTED | High | Bitwig does not support Audio Units. | Family-wide FAQ | S-012 | Explicit FAQ text | Does not distinguish AUv2/AUv3 fixture results. |
| C-012 | UNKNOWN | High | AAX/LV2/LADSPA/DSSI/JSFX/DXi/Rack Extension acceptance/rejection is not publicly established. | Current family | S-001, S-010, S-011, S-012 | Exhaustive official lists searched | Absence is not proof of rejection. |
| C-013 | DOCUMENTED | High | Custom scan folders and duplicate format/bitness/architecture preferences exist. | 5.3 stable settings | S-004 | Direct manual | Matching key/algorithm unknown. |
| C-014 | DOCUMENTED | High | Per-OS index/VST metadata cache recovery and Flatpak filesystem limits are documented. | Current support | S-006, S-007 | Support KB | Cache is not blacklist evidence. |
| C-015 | DOCUMENTED | High | Five hosting modes, default Together, per-plugin override, and reload requirement are documented. | 5.3/current | S-005, S-010 | Manual + vendor learning | Memory/performance not measured. |
| C-016 | DOCUMENTED | High | Crashed plug-in UI supports targeted/all reload; audio may often continue. | 5.3/current | S-005, S-012 | Manual/support | Hangs/malicious faults/kernel failures not covered. |
| C-017 | UNKNOWN | High | Exact application↔engine↔plugin OS topology/IPC is unresolved; sources conflict on threads/processes. | Proprietary internals | S-005, S-011, S-012 | Explicit contradiction | Plugin process isolation itself is documented. |
| C-018 | DOCUMENTED | High | Native 32/64-bit bridging is offered on Windows/Linux. | Current host | S-001, S-010, S-011 | Repeated official claim | macOS not included in claim. |
| C-019 | DOCUMENTED | Medium | 5.3 Windows Arm used native Arm64 app and separate hosts for Arm/Arm64EC/x64/x86. | Historical 5.3 implementation | S-027 | Official support article | Current 6.1 helper topology unknown. |
| C-020 | UNKNOWN | High | macOS can prefer native over Rosetta duplicates; exact Intel-plugin bridge topology is unknown. | Apple silicon | S-004, S-028 | Preference + requirements | No execution-boundary source. |
| C-021 | DOCUMENTED | High | Producer/full support dynamic multi-out chain creation/routing; Essentials does not list multi-out. | Main editions | S-001, S-008, S-022 | Edition table + KB/manual | Not arbitrary live bus negotiation. |
| C-022 | DOCUMENTED | High | VST/CLAP sidechain support exists in all three main editions. | Main editions | S-001, S-023 | Current comparison/shop | Bus count/layout details unknown. |
| C-023 | DOCUMENTED | High | VST3 per-note expression/sample-accurate automation; CLAP can expose poly modulation/voice stacking. | VST3/CLAP | S-009, S-010, S-011 | Bitwig-specific sources | Plug-in support varies; not generalized. |
| C-024 | DOCUMENTED | High | Plugins have three suspend policies and per-plugin MPE/pitch range controls. | 5.3 stable behavior | S-005, S-009 | Direct manual | Suspend transition timing unknown. |
| C-025 | DOCUMENTED | High | Host generic parameter UI is embedded; custom plug-in UI floats; search/remotes/post-FX/multi-out UI exist. | 5.3 | S-022 | Direct manual | Scaling/headless/custom embedding unknown. |
| C-026 | UNKNOWN | High | Validation, quarantine, signing, stable parameter IDs, tails, arbitrary dynamic I/O, UI scaling/headless, logs remain undocumented. | Host contract | S-004–S-012, S-021, S-022, S-026 | Targeted searches/source review | Requires fixtures or vendor matrix. |
| C-027 | DOCUMENTED | High | `.bwproject` folder has media/plugin-state subfolders; presets/DAWproject can persist plugin state. | Native/interchange | S-019, S-022, S-018, S-032 | Direct manual/spec | Native serialization internals unknown. |
| C-028 | DOCUMENTED | High | Project Panel surfaces missing plug-ins and older-version conflicts. | 5.3 | S-021 | Direct manual | Replacement/pass-through not specified. |
| C-029 | UNKNOWN | High | Missing-plugin placeholder semantics, crash restoration checkpoint, autosave/atomicity are not documented. | Persistence/recovery | S-002, S-016, S-021, S-029 | Searched manuals/release docs | Safe dynamic probe required. |
| C-030 | DOCUMENTED | High | Bounce/export supports offline and realtime, multiple signal points, stems, and Arranger-only direct export. | 5.3 | S-030, S-031 | Direct manual | Per-plugin offline fidelity unknown. |
| C-031 | DOCUMENTED | Medium-high | Plug-in delay compensation is advertised. | VST/CLAP | S-001, S-011 | Repeated vendor statement | Algorithm, tail, dynamic latency behavior unknown. |
| C-032 | DOCUMENTED | High | Block/sample settings, combined audio devices, MIDI Clock/MTC/Link and controller settings are documented. | 5.3 | S-004 | Direct manual | Platform/driver edge cases not tested. |
| C-033 | DOCUMENTED | High | Producer/full include comping and eight stretch modes; Essentials lacks comping and has three modes. | Main editions | S-001, S-023 | Current comparison/shop | 8-Track unknown. |
| C-034 | DOCUMENTED | High | Controller extensions are JS scripts or Java `.bwextension` packages in documented per-user paths. | 4.2.5+ | S-017, S-004 | Support/manual | API compatibility/security not established. |
| C-035 | DOCUMENTED | High | DAWproject carries broad project/plugin data but recall is constrained by importer formats/features. | DAWproject 1.0 | S-018, S-032 | FAQ + upstream repo | Not native format; implementation fidelity untested. |
| C-036 | DOCUMENTED | High | No direct video playback or released collaboration; cloud-synced folders unsupported. | Current support | S-012 | Support index | Future plans are not shipped behavior. |
| C-037 | DOCUMENTED | High | Commercial license provides unlimited-duration use and one year functional updates, subject to EULA. | Terms at cutoff | S-023, S-024 | Shop/GTC | EULA not fetched; terms can change. |
| C-038 | DOCUMENTED | High | VST3/CLAP/DAWproject are MIT at cutoff; VST2 distribution is restricted to pre-Oct-2018 licensees. | SDK/schema licensing | S-025, S-026, S-033 | Format-owner/upstream sources | Not legal advice; trademarks/other SDKs separate. |
| C-039 | DOCUMENTED | Medium-high | Three-computer activation, device-linked activation data, optional crash report, usage data/localization are described. | Terms/support | S-024, S-012 | Direct policy/support | No privacy/security audit. |
| C-040 | UNKNOWN | High | Scheduler, IPC, graph compiler, native file internals, controller sandbox, watchdog and state transaction are proprietary/undocumented. | Internals | S-003–S-033 | Bounded source review | Public technical disclosure could change this. |
| C-041 | INFERENCE | Medium-high | Hierarchical graph + host modulation + selectable isolation are transferable architectural patterns. | Clean-room decision | C-005, C-007–C-016 | Behavioral synthesis | Alternative: benefits may depend on undisclosed complexity/performance costs. |
| C-042 | UNKNOWN | Medium-high | Notation, MIDI 2.0, OSC, AAF/OMF/ADM, post features and AT conformance are not established. | Adjacent features | S-001–S-033 | Targeted review; lower-priority searches rejected | Absence from retained docs is not proof of absence. |
| C-044 | DOCUMENTED | High | Player mode preserves remote/sequence/bounce/resave access to native devices outside an edition. | 5.3 edition interoperability | S-020 | Direct manual | Third-party missing plugins are different. |
| C-045 | DOCUMENTED | High | Main editions support MPE play/record/edit and hardware/touch integration. | Main editions | S-001, S-023 | Current comparison/shop | MIDI 2.0 not implied. |
| C-046 | DOCUMENTED | High | Audio assets have external/missing states, relink/replace, collection and cleanup. | 5.3 | S-021 | Direct manual | Hashing/search algorithm unknown. |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Every retained source is primary/vendor or
upstream format-owner material; no secondary source is used to prove a claim.

- **S-001 — “Feature List,” Bitwig.** <https://www.bitwig.com/feature-list/>.
  Current product comparison; supports C-002, C-003, C-009, C-010, C-018,
  C-021–C-023, C-031, C-033, C-045. Selected over reseller tables because it is the
  canonical edition matrix. Limitation: icons flatten poorly to text and 8-Track is
  omitted.
- **S-002 — “Bitwig Studio v6.1 Release Notes,” Bitwig.**
  <https://downloads.bitwig.com/6.1/Release-Notes-6.1.html>. Official dated release
  and requirements; supports C-001, C-002, C-006, C-029. Preferable to news snippets.
  Limitation: guide explicitly incomplete; detailed Sampler changelog is not a full
  host contract.
- **S-003 — “Bitwig Studio User Guide 5.3: Welcome,” Bitwig.**
  <https://www.bitwig.com/userguide/latest/>. Establishes manual version/applicability
  and table of contents; supports C-040 scope. Selected because Bitwig itself points
  6.1 general topics here. Limitation: not fully 6.1-current.
- **S-004 — “The Dashboard,” Bitwig User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/the_dashboard>. Settings, scan folders,
  duplicate preferences, audio block/rate, controllers and sync; supports C-013,
  C-020, C-032, C-034. Preferable to screenshots/forum advice. Limitation: default
  plugin folders and identity algorithm omitted.
- **S-005 — “Plug-in Handling and Options,” Bitwig User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/vst_plug-in_handling_and_options>.
  Five modes, crash reload, per-plugin override and MPE; supports C-015–C-017,
  C-024. Core isolation source. Limitation: no IPC/state checkpoint.
- **S-006 — “I upgraded my VST collection…,” Bitwig Support.**
  <https://www.bitwig.com/support/technical_support/i-upgraded-my-vst-collection-now-something-is-strangemissing-why-30/>.
  Cache paths/regeneration; supports C-014. Selected for concrete OS paths.
  Limitation: VST-named metadata only; no scan policy.
- **S-007 — “Installing Bitwig Studio On Linux (Via Flatpak),” Bitwig Support.**
  <https://www.bitwig.com/support/technical_support/installing-bitwig-studio-on-linux-via-flatpak-52/>.
  Flatpak filesystem/plugin constraint; supports C-014. Limitation: packaging advice,
  not a complete Linux path matrix.
- **S-008 — “How do I use multi-out VST plug-ins?,” Bitwig Support.**
  <https://www.bitwig.com/support/technical_support/how-do-i-use-multi-out-vst-plug-ins-27/>.
  Dynamic chain creation/routing; supports C-021. Selected over user tutorials.
  Limitation: says VST, not CLAP; no live bus-change semantics.
- **S-009 — “The Unified Modulation System,” Bitwig User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/the_unified_modulation_system>. Host
  modulation, CLAP poly modulation/voice stacking, suspend/MPE inspector; supports
  C-008, C-023, C-024. Limitation: timing/rate completeness not specified.
- **S-010 — “Plug-in Hosting & Crash Protection,” Bitwig.**
  <https://www.bitwig.com/learnings/plug-in-hosting-crash-protection-in-bitwig-studio-20/>.
  Format list, bit bridge, VST3 timing/expression, default/modes; supports C-010,
  C-015, C-018, C-023. Selected to triangulate the manual. Limitation: 2019 marketing/
  learning page; vendor claims, not measurements.
- **S-011 — “The Modern Foundations of Bitwig Studio,” Bitwig.**
  <https://www.bitwig.com/modern-foundations/>. Current architecture narrative,
  async load, formats/PDC, modulation; supports C-004, C-010, C-017, C-018, C-023,
  C-031. Limitation: “threads” conflicts with process sources and is treated
  conservatively.
- **S-012 — “Technical Support,” Bitwig.**
  <https://www.bitwig.com/support/technical_support/>. AU negative, separate process,
  no video/collaboration, usage/localization/cloud statements; supports C-011,
  C-012, C-016, C-017, C-036, C-039. Selected because the dedicated AU slug currently
  resolves incorrectly. Limitation: index summaries and mixed-age entries.
- **S-013 — “Bitwig Studio Concepts,” User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/bitwig_studio_concepts>. Project/track/clip
  model; supports C-004. Limitation: conceptual, not storage internals.
- **S-014 — “Modulators, Device Nesting, and More,” User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/advanced_device_concepts>. Recursive graph
  and plugin placement; supports C-007. Selected for explicit chain taxonomy.
  Limitation: no graph runtime.
- **S-015 — “One DAW, Two Sequencers,” User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/one_daw_two_sequencers>. Arranger/Launcher
  separation/arbitration/capture; supports C-005. Limitation: predates v6 aliases.
- **S-016 — “Welcome to The Grid,” User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/welcome_to_the_grid>. Grid roles/modules/
  patching/MPE/CV/editor; supports C-009. Limitation: no DSP scheduler or complete
  feedback model.
- **S-017 — “How do I add a controller extension or script?,” Bitwig Support.**
  <https://www.bitwig.com/support/technical_support/how-do-i-add-a-controller-extension-or-script-17/>.
  JS/Java packaging and paths; supports C-034. Selected as canonical installation
  boundary. Limitation: not the API reference/security model.
- **S-018 — “DAWproject File Format FAQs,” Bitwig Support.**
  <https://www.bitwig.com/support/technical_support/dawproject-file-format-faqs-62/>.
  Import/export, data coverage, plugin/Launcher limitations; supports C-027, C-035.
  Limitation: cross-DAW examples are version-specific.
- **S-019 — “Working with Projects and Exporting,” User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/working_with_projects_and_exporting>.
  `.bwproject` folder/subfolders/templates; supports C-027. Limitation: no schema/
  atomicity.
- **S-020 — “Introduction to Devices,” User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/introduction_to_devices>. Chain signal
  flow, device UI and Player mode; supports C-007, C-020, C-044. Limitation: native
  expanded editor detail is not custom plugin UI behavior.
- **S-021 — “The Project Panel,” User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/the_project_panel>. Missing/conflict plugins
  and asset collection/relink; supports C-028, C-029, C-046. Limitation: does not say
  how absent plugin state passes audio.
- **S-022 — “Plug-ins,” User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/vst_plug-ins>. Generic/custom UI, parameters,
  post-FX/multi-out; supports C-021, C-025, C-027. Limitation: scaling/headless/state
  IDs absent.
- **S-023 — “Bitwig Webshop,” Bitwig.** <https://www.bitwig.com/buy/>. Current editions,
  price/update plan and feature summary; supports C-002, C-010, C-022, C-023,
  C-033, C-037, C-045. Selected to triangulate feature list. Limitation: commercial
  copy and volatile pricing.
- **S-024 — “General Terms and Conditions of Sale,” Bitwig (updated 2024-09-30).**
  <https://www.bitwig.com/terms-conditions/>. Rights, updates, activation/data;
  supports C-037, C-039. Preferable to reseller summaries. Limitation: incorporates
  an unfetched EULA and is not legal advice.
- **S-025 — “VST 3 Developer Portal: Licensing,” Steinberg.**
  <https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html>.
  VST3 MIT and VST2 legacy restrictions; supports C-038. Selected as format-owner
  source. Limitation: implementation must still review exact SDK version/trademarks.
- **S-026 — “free-audio/clap,” CLAP upstream repository.**
  <https://github.com/free-audio/clap>. ABI, MIT license, optional extensions;
  supports C-026, C-038. Selected as canonical public specification. Limitation:
  optional capabilities do not prove Bitwig host support.
- **S-027 — “Windows on Arm Support,” Bitwig Support.**
  <https://www.bitwig.com/support/technical_support/windows-on-arm-support-69/>.
  Native app/helper architecture in 5.3; supports C-019. Limitation: dated 2024 and
  predicts changes, so not promoted to current 6.1 topology.
- **S-028 — “System Requirements,” Bitwig Support.**
  <https://www.bitwig.com/support/technical_support/system-requirements-1/>. Current
  OS/CPU/RAM/display scope; supports C-001, C-020. Limitation: Windows Arm omission
  conflicts with S-027/release availability.
- **S-029 — “On Another Level: Bitwig Studio 6,” Bitwig.**
  <https://www.bitwig.com/stories/on-another-level-bitwig-studio-6-is-out-now-416/>.
  Current automation clips/aliases/editor/backup; supports C-002, C-006, C-029.
  Selected to update the 5.3 manual. Limitation: release story, not full reference.
- **S-030 — “Bouncing to Audio,” User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/bouncing_to_audio>. Signal-point/realtime/
  in-place bounce; supports C-030. Limitation: no plugin callback contract.
- **S-031 — “Exporting Audio,” User Guide 5.3.**
  <https://www.bitwig.com/userguide/latest/exporting_audio>. Offline/realtime stems,
  sample rate and Arranger scope; supports C-030. Limitation: formats/profiles may
  evolve.
- **S-032 — “bitwig/dawproject,” upstream repository.**
  <https://github.com/bitwig/dawproject>. Stable 1.0 goals/non-goals, ZIP/XML schema,
  embedded plugin state; supports C-027, C-035, C-038. Preferable to summaries because
  it is the maintained spec. Limitation: repository `main` is mutable; behavior of
  each importer is separate.
- **S-033 — “DAWproject LICENSE,” Bitwig upstream.**
  <https://raw.githubusercontent.com/bitwig/dawproject/main/LICENSE>. MIT text;
  supports C-038. Selected to verify “open/free” with the actual license. Limitation:
  applies to the repository, not trademarks or unrelated Bitwig software.

**Unretained negative retrieval:** the discovered URL ending
`why-doesnt-bitwig-studio-support-audio-units-25/` returned an unrelated offline
activation article. It was not cited; the live support index S-012 supplies the AU
statement. Web-search snippets were discovery-only untrusted text.

## 23. Unknowns and next discriminating probes

| Unknown | Attempt / blocker / impact | Safest next probe | Required fixture / owner |
| --- | --- | --- | --- |
| Scan validation, blacklist, quarantine, rescan UX | Manual/KB/cache pages reviewed; cache existence cannot prove policy. Impacts robust discovery design. | Install a signed harmless matrix with one scan-crasher in disposable OS accounts; record UI/log/cache changes. | macOS/Windows/Linux VMs; synthetic VST3/CLAP; unassigned interoperability owner |
| Default VST2/VST3/CLAP locations | Custom paths and Flatpak boundary found, defaults not enumerated. | Screenshot Settings after a clean install; compare OS standard paths without running untrusted plugins. | Licensed disposable installs; unassigned |
| Application/audio-engine/plugin topology and IPC | “threads” conflicts with “processes”; proprietary. Impacts fault-domain cost model. | Vendor technical disclosure or authorized process-tree/trace with empty project. | Bitwig permission/licensed lab; architecture owner |
| Current Windows/macOS architecture bridging | 5.3 Windows article is dated; macOS only has preference evidence. | Run signed no-op plugins for each architecture and capture documented process architecture. | Arm Windows + Apple silicon; x86/x64/Arm fixtures |
| Crash state checkpoint | Reload UI documented, state timing absent. Impacts data loss expectations. | Edit unsaved state in a synthetic plugin, crash deterministically, reload, compare state/audio. | Stateful VST3/CLAP fixture; reliability owner |
| Missing-plugin placeholder/pass-through | Project panel flags missing but does not describe graph/state behavior. | Save stateful plugin project, remove fixture, reopen/save/reinstall, compare opaque state and routing. | Disposable plugin/project; persistence owner |
| Stable parameter identity/range/text | Generic list exists, identifiers not documented. Impacts automation migration. | Version a fixture with reorder/rename/range changes and round-trip native/DAWproject. | Versioned VST3/CLAP fixture; automation owner |
| Latency/tail/dynamic buses | PDC and user-added outputs documented; live changes/tails absent. | Fixture changes latency/tail/buses during play/offline render; inspect compensation and recall. | Contract test plugin; engine owner |
| UI scaling/custom embedding/headless | Floating custom UI documented, scaling/headless absent. | DPI matrix and no-GUI offline render in all sandbox modes. | VST3/CLAP GUI fixtures; UI owner |
| Long-tail format status | No primary acceptance/rejection for AAX/LV2/etc.; absence is nonproof. | Ask vendor for current matrix; only then run lawful scan fixtures for formats with distributable SDKs. | Vendor response/SDK legal review; product owner |
| MIDI 2.0/OSC/accessibility | No current primary statement found; lower decision value. | Vendor questionnaire plus keyboard/screen-reader/UMP fixture if scope expands. | Accessibility/MIDI lab; unassigned |

## 24. Curiosity pass and stop decision

Scores use 0–5 for decision relevance (R), expected value (V), novelty (N), and
low cost (C; 5 is cheapest).

| Candidate follow-up | R | V | N | C | Total | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Plug-in handling/sandbox manual | 5 | 5 | 5 | 5 | 20 | **Pursued**; established five modes/recovery. |
| Host contract: multi-out/modulation/UI/state | 5 | 5 | 5 | 4 | 19 | **Pursued** across bounded official pages. |
| Format-owner licensing | 5 | 5 | 5 | 4 | 19 | **Pursued**; closed VST/CLAP/DAWproject constraints. |
| DAWproject upstream license/spec | 4 | 4 | 4 | 5 | 17 | **Pursued as final qualifying thread**. |
| Exact process/IPC/scheduler internals | 5 | 3 | 5 | 1 | 14 | `CURIOSITY_NO_GO`: proprietary, contradictory, no primary technical lead. |
| Every long-tail format separately | 4 | 2 | 2 | 2 | 10 | `CURIOSITY_NO_GO`: likely repeats absence; dynamic/vendor matrix needed. |
| Full 8-Track reconstruction | 3 | 2 | 2 | 2 | 9 | `CURIOSITY_NO_GO`: current canonical matrix unavailable; low architecture impact. |
| Video/post/notation/accessibility deep dives | 2 | 2 | 3 | 3 | 10 | `CURIOSITY_NO_GO`: outside plugin/sandbox decision; explicit unknowns retained. |
| Native device inventory | 2 | 1 | 1 | 3 | 7 | `CURIOSITY_NO_GO`: graph primitives already saturated. |
| Default path archaeology | 3 | 2 | 1 | 2 | 8 | `CURIOSITY_NO_GO`: clean-install UI probe is more discriminating. |

**Gaps/contradictions at stop:** 6.1 documentation delegates general topics to 5.3;
“threads” conflicts with process documentation; current requirements omit Windows
Arm despite official Arm support; AU has an explicit negative but other long-tail
formats do not; crash reload and missing-plugin UIs omit state semantics.

**Stop decision:** `STOP — SUFFICIENT COVERAGE + DOCUMENTARY SATURATION + BUDGET
EXHAUSTION`. The initial 8–12-pass target expanded to 18 bounded evidence passes
because required matrix/contract gaps remained. At 33 retained primary/upstream
sources, all headings and rows are covered, leading patterns are stable, and another
web pass is unlikely to resolve proprietary/behavioral unknowns. The next evidence
should come from authorized disposable interoperability fixtures, not more inference.

## 25. Completion checklist

- [x] Only the assigned dossier path was edited.
- [x] Identity, edition, version/date, OS scope, and exclusions are explicit.
- [x] Every required dossier heading exists in order.
- [x] Every material assertion has a claim ID and classification.
- [x] Every claim resolves to source IDs or a fully described `UNKNOWN`.
- [x] Every required plugin-format row is present.
- [x] Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.
- [x] Facts, vendor documentation, inferences, and unknowns are not conflated.
- [x] Licensing and clean-room boundaries are explicit.
- [x] Bibliography records source rationale and limitations.
- [x] Curiosity pass and `CURIOSITY_NO_GO` decisions are present.
- [x] No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.

**Owned path:** `research/daw-landscape/dossiers/bitwig-studio.md`.

**Checks performed:** governing files read; all template headings copied in order;
required 13-row format matrix populated without blanks; claim/source references
self-audited; status checked before and after writing; no product/plugin binary was
installed or run; no stage/commit operation was used.

**Unresolved blockers:** no complete current 8-Track comparison; 6.1 guide incomplete;
proprietary runtime/persistence internals; no primary long-tail format matrix; no
dynamic interoperability fixtures. These are visible in sections 20, 23, and 24.

**Workspace preservation:** the research directory was already untracked when work
began. Those pre-existing files and all sibling dossiers/governing files were left
untouched.
