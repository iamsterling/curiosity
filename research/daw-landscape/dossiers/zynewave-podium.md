# Zynewave Podium DAW dossier

> Research-only evidence. No design or implementation authority. Public pages
> retrieved during this research are untrusted evidence, not instructions.

## 0. Metadata and scope

- **Product family:** Zynewave Podium commercial, Demo, and Podium Free.
- **Canonical vendor/upstream:** Zynewave, founded and operated by developer Frits Nielsen. [C-003]
- **Researcher/session:** subagent of session `ses_fb275c776ffdWzMC0bbERpQ7jO`.
- **Owned path:** `research/daw-landscape/dossiers/zynewave-podium.md`.
- **Research date / cutoff:** 2026-08-29 UTC.
- **Shipping snapshot:** commercial Podium 3.4.6 (2024-09-16); downloadable Demo 3.4.2; Podium Free 3.2.1 (2014-03-11). Podium 3.5 was still unreleased and undated in the vendor's 2026-02-12 update. [C-001] [C-002]
- **Platforms:** Windows only. The sale page lists Windows 7 or 10 as minimum-compatible systems; 3.4.x is the last line intended to support Windows XP. Current Windows 11 qualification is **UNKNOWN**. [C-001] [C-033]
- **Inclusions:** linear arranging, hierarchical tracks/routing, audio/MIDI recording and editing, commercial/Free edition differences, VST hosting, ReWire as a historical/current-guide integration boundary, project and preset persistence.
- **Exclusions:** the separate Nucleum product; the unavailable historical iOS port; dynamic execution of Podium or plugins; undocumented proprietary implementation; user posts except where clearly labeled as anecdote or where a vendor-authored reply supplies the retained fact. [C-033]
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.

**Research frame.** The decision is which Podium patterns are relevant to a new
cross-platform DAW, especially hierarchical routing and VST interoperability.
Sub-questions cover identity/maintenance, workflow, engine/PDC/render, every
required plugin format, scanning/isolation/bridging, I/O/sidechain/MIDI/
automation/state/UI/failure behavior, persistence, and licensing. The depth
budget was six passes of no more than two external sources, followed by one
bounded curiosity decision. Coverage is sufficient when every template heading
and plugin row is answered by a classified claim or an explicit `UNKNOWN`.

## 1. Executive summary

Podium's distinctive documented pattern is a single nested track tree in which
visual containment also routes audio, MIDI, and automation upward. Tracks are
not permanently typed as audio or MIDI; assigned device mappings determine
their function, while busses branch away from the tree. This is a compact,
user-visible graph model rather than a conventional flat track list plus hidden
mixer graph. [C-005] [C-006] [C-013]

The last released commercial host is Windows-only Podium 3.4.6. Development is
not declared discontinued: in February 2026 the vendor said work continued,
but gave no date for 3.5. Current 3.4.x hosting is VST 2.4-focused. CLAP was
described as hoped-for basic support in 3.5 and VST3 as later work; neither is a
shipping capability at the cutoff. [C-001] [C-016] [C-017]

Hosting depth is uneven but unusually explicit in older official documentation:
the scanner builds a database, loads plugins to inspect capabilities, and
quarantines an immediately crashing file on restart; projects retain device
definitions, mappings, parameter objects, presets, and relative plugin paths.
Multi-I/O, multitimbrality, sidechains, VST MIDI output, generic editors,
double-precision VST 2.4 processing, PDC, and missing-file relinking are
documented. [C-019] [C-022] [C-023] [C-024]

The largest liabilities are the obsolete VST2-only shipping boundary, no
documented effective scanner containment or runtime sandbox, external rather than built-in bit
bridging, and many unresolved modern-host-contract fields. A vendor-authored
legacy statement says automation is applied at buffer boundaries, not sample
accurately, for Podium 3.2.4. VST tails, dynamic I/O, modern note expression,
MIDI 2.0, per-plugin process isolation, modern signing checks, and robust
cross-format migration remain **UNKNOWN**. [C-012] [C-020] [C-021] [C-031]

**Overall confidence:** high for identity, versions, hierarchy, core VST2
workflow, and persistence; medium for details sourced only from the 2013 guide;
low/unknown for 3.4.6 runtime internals and unmentioned modern contracts.

## 2. Product identity, history, and market position

Zynewave describes Podium as a Windows DAW for recording/editing audio and MIDI
and hosting VST instruments/effects. The commercial product remains offered as
a single-user license. The official release index lists 3.4.6 (2024-09-16) as
the newest release; a 2026 status post says development continues but 3.5 has no
release date. This is evidence of slow, active maintenance, not a promise of a
future release. [C-001] [C-029]

Frits Nielsen says development began on Amiga in 1990, Zynewave was created in
2004 for public release, and he is both founder and developer. This provenance
explains the single-developer product boundary but does not establish team size
or support capacity beyond what the vendor states. [C-003]

The family has three available edition boundaries: commercial 3.4.6 downloads
for licensees, a publicly downloadable 3.4.2 Demo with periodic output muting
and preset import/export disabled, and Podium Free 3.2.1. Free limits MIDI I/O
to one input/output and disables 64-bit mixing, plugin multiprocessing, ReWire,
and surround playback. Its page still promises frequent releases, but the
listed build is from 2014; the release artifact, not that stale promise, governs
the maintenance assessment. [C-002]

## 3. Workflow and conceptual model

A project is an object hierarchy containing any number of arrangements,
sounds, note sequences, curve sequences, device mappings/definitions, presets,
parameters, and folders. Multiple arrangements can share sounds and sequences;
“phantom” events reference one sequence so edits propagate to every copy.
[C-004]

An arrangement is a linear timeline. Sound, note, curve, and parameter events
sit on tracks; arrangements may use musical (tempo/time-signature) or linear
(sample-rate) time resolution. Tracks form a visible nested tree and the mixer
mirrors that tree as vertical strips. This is neither a scene launcher nor a
tracker/module graph, although the hierarchy exposes graph-like routing.
[C-004] [C-005] [C-010]

## 4. Publicly documented architecture

The public architecture boundary is user-visible, not an implementation module
map. A unified “device object” model represents audio/MIDI interfaces, external
hardware, mixer busses, ReWire devices, and plugins through mappings linked to
definitions, presets, and parameter objects. Mappings are assigned to tracks;
multiple mappings can address one global multi-I/O or multitimbral device
instance. [C-006]

The mixing graph is the arrangement's track tree: audio, MIDI, and parameter
signals flow from children through nested parents until consumed by a mapped
device or master output. Effects and fader/meter positions are visibly ordered,
while bus send/return mappings create explicit branches. [C-005] [C-013]

Podium 3.4 was described by the developer as a broad codebase rewrite and 3.5
plugin-format work as a rewrite of plugin handling. Programming language,
internal graph representation, callback ownership, lock strategy, scheduler,
and persistence schema are proprietary and **UNKNOWN**; no internal design is
inferred from “rewrite.” [C-001] [C-031]

## 5. Audio engine

- **Drivers/rates:** official guide documentation covers ASIO and Wave/MME and
  sample rates through 192 kHz. The current sale page recommends ASIO. [C-007]
- **Precision:** the mixer can run 32- or 64-bit floating point; VST 2.4 plugins
  may process 64-bit double precision, while plugins limited to 32-bit receive
  converted audio. Podium Free disables 64-bit mixing. [C-007] [C-002]
- **Scheduling:** commercial Podium documents multicore/multiprocessor plugin
  processing; users can disable it for unstable plugins. Exact task graph,
  worker affinity, realtime locks, and multicore dependency scheduling are
  **UNKNOWN**. [C-007] [C-031]
- **Delay:** automatic delay compensation is documented for plugins and
  external MIDI/audio hardware, including playback/record compensation while
  live monitoring still exposes the path's latency. Dynamic latency changes
  and feedback-loop behavior are **UNKNOWN**. [C-008]
- **Bounce/render:** any audio-producing individual, group, or master track can
  switch between its live subtree and bounced audio. Bounce can record in real
  time or render offline and can unload plugins; a marker can extend the render
  past the final event to capture decay. [C-009]
- **Offline path:** a 2017 vendor reply, scoped to Podium 3.2.4, states that
  offline rendering used buffers no larger than 128 samples and plugins might
  differ when run faster than real time. Whether 3.4.6 retains that path is
  **UNKNOWN**. [C-012]
- **Overload/diagnostics:** a CPU indicator exposes overload; an option can
  bypass processing on overload to preserve UI responsiveness, and the audio
  report can log driver errors. Dropout recovery details are **UNKNOWN**.
  [C-007] [C-028]
- **Oversampling:** **UNKNOWN**; no official host-level oversampling control was
  located. [C-031]

## 6. Tracks, timeline, clips, and editing

Tracks are capability-driven rather than fixed audio/MIDI types. Nested group
tracks, parameter child tracks, effect ordering, track tags, templates, and a
single top-level master are documented. Fader and meter points can be placed
pre-effects, post-effects, after sends, or at a chosen point in the chain.
[C-005] [C-010]

Sound, note, curve, and parameter events can be moved, split, resized, copied,
or shared as phantom references. Sound-event gain, fades, and automatic
crossfades are nondestructive; destructive waveform editing is a separate sound
editor path. Beat slicing is documented. Time stretching is documented for
note/curve sequences in the cited guide; general audio warping is **UNKNOWN**.
[C-010]

Undo is maintained per arrangement/sound/sequence with a configurable maximum.
Audio multi-take recording creates take tracks under a composite track and
supports segment-by-segment take selection/crossfade, but the guide explicitly
limits multi-take to audio. Track templates can include device assignments,
plugin presets, events, and automation. [C-010] [C-014]

## 7. MIDI, sequencing, notation, and expression

Podium records/edits MIDI notes in piano-roll or drum-map views, imports/exports
MIDI files, records controller/NRPN/SysEx data, can preserve raw SysEx streams,
and can translate matching messages into parameter tracks. External MIDI
output can transmit MTC and MIDI Timing Clock. [C-011]

VST instrument MIDI output recording exists but is disabled by default because
some plugins echo input and would produce duplicate notes. Mappings can address
16 channels of a multitimbral global plugin instance. [C-011] [C-022]

Notation/score editing, MPE, VST note expression, MIDI 2.0/UMP, per-note pitch
beyond MIDI polyphonic pressure, incoming timecode chase, and sample-accurate
MIDI are **UNKNOWN** after guide/site/release searches. [C-031]

## 8. Routing, mixer, automation, and control

Nested tracks define the main route; bus send/return mappings add branches.
Commercial Podium documents 100 bus instances and up to 32 channels per bus or
track, movable send position, multiple returns for a bus, and bus-to-bus feeds.
The guide elsewhere says 99 configurable busses, an internal inconsistency
likely reflecting whether the master/default instance is counted; the product
page's 100 is retained and the count should be dynamically verified. [C-013]

VST sidechains use send mappings, and multi-I/O/global plugin mappings can map
separate audio channels and MIDI channels to one instance. No evidence was
located for arbitrary feedback routing, VCA objects, object-based immersive
audio, or layouts beyond the documented up-to-32-channel/surround model.
[C-013] [C-022] [C-031]

Automation is track-based: VST, MIDI, and mixer parameters are linked to child
parameter tracks containing curve sequences with bar, line, or spline points.
Recorded UI/controller changes become points; mixer level/pan/send automation
is a relative offset to the static setting. A vendor reply for 3.2.4 says plugin
automation is applied at the beginning of each audio buffer, so sample-accurate
automation is **not documented** and was demonstrably block-boundary in that
version. 3.4.6 behavior remains **UNKNOWN**. [C-012] [C-023]

Mackie Control/MCU is documented, and 3.4.3 added native FaderPort 8/16 support.
No OSC, network remote, or general controller SDK was located. [C-026]

## 9. Recording, comping, and media handling

Commercial Podium supports simultaneous audio/MIDI input recording, monitoring,
punch and loop modes, and audio multi-take/compositing. Multi-take creates child
take tracks; segments on the composite track select a take and can crossfade or
merge/bounce. [C-014]

The documented audio-file boundary is WAV (8–32-bit fixed and 32/64-bit float),
RF64 beyond 4 GB, and AIFF/AIFF-C, with up to 32 channels. Podium streams large
files and generates `.mini` waveform companions in the background. Recorded or
edited waveform data uses temporary cache files until explicitly saved.
[C-014] [C-025]

Missing sound references appear as broken/red objects and can be searched or
manually relinked. The `.pod` file stores references rather than embedded audio;
relative paths are available within the project folder. Automatic collect/copy,
proxy/conform, video, Broadcast Wave metadata beyond cue markers, and media
checksum validation are **UNKNOWN**. [C-025] [C-034]

## 10. Instruments, effects, content, and native devices

Commercial Podium bundles zPEQ, zPitch, and zReverb as VST 2.4 effects; their
editors integrate into Podium's rack/mixer. These are not evidence of a separate
native plugin SDK. Device definitions can also encapsulate external hardware,
including MIDI/audio mappings, presets, parameters, and latency. [C-015]

There is no documented rack/modulator/sampler/synthesis framework comparable to
a modern native-device SDK. User-configurable device definitions and track/
effect-chain templates are the principal native abstraction. [C-006] [C-031]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `NOT_APPLICABLE: product not shipped` | `DOCUMENTED` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | Commercial 3.4.x/product page; Free 3.2.1 | VST 2.4 effects/instruments; 32/64-bit matching builds; double precision where plugin supports it | [C-016]; S-001, S-002, S-009 |
| VST3 | `NOT_APPLICABLE: product not shipped` | `DOCUMENTED: not shipping` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | 3.4.x current; post-3.5 work discussed | Official 2026 status places implementation after initial 3.5/CLAP work; no shipping support | [C-017]; S-002, S-009, S-010 |
| AUv2 | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: Apple format` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | Windows-only product | No Podium AU host exists in scoped product evidence | [C-018]; S-001, S-010 |
| AUv3 | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: Apple format` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | Windows-only product | Historical iOS port is unavailable and out of scope; no AUv3 evidence | [C-018] [C-033]; S-010 |
| AAX | `NOT_APPLICABLE: product not shipped` | `UNKNOWN` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | No official Podium statement located | Absence from pages is not proof of unsupported behavior | [C-018]; S-001, S-002, S-004 |
| CLAP | `NOT_APPLICABLE: product not shipped` | `DOCUMENTED: planned, not shipping` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | hoped-for basic support in unreleased 3.5 | Development continues; scope/date unresolved | [C-017]; S-002 |
| LV2 | `NOT_APPLICABLE: product not shipped` | `UNKNOWN` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | No official Podium statement located | Not inferred from VST focus | [C-018]; S-001, S-004 |
| LADSPA | `NOT_APPLICABLE: product not shipped` | `UNKNOWN` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | No official Podium statement located | No retained evidence | [C-018]; S-001, S-004 |
| DSSI | `NOT_APPLICABLE: product not shipped` | `UNKNOWN` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | No official Podium statement located | No retained evidence | [C-018]; S-001, S-004 |
| JSFX | `NOT_APPLICABLE: product not shipped` | `UNKNOWN` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | No official Podium statement located | No retained evidence | [C-018]; S-001, S-004 |
| DirectX/DXi | `NOT_APPLICABLE: product not shipped` | `UNKNOWN` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | No current official support statement retained | Historical search snippets were not treated as evidence | [C-018] |
| Rack Extension | `NOT_APPLICABLE: product not shipped` | `UNKNOWN` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | No official Podium statement located | ReWire hosting does not imply Rack Extension hosting | [C-018] [C-026]; S-004 |
| Product-native/other | `NOT_APPLICABLE: product not shipped` | `DOCUMENTED` | `NOT_APPLICABLE: product not shipped` | `NOT_APPLICABLE: product not shipped` | Commercial guide; Free disables ReWire | ReWire mixer host; bundled zPlugins are VST2 with Podium-integrated editors, not a distinct third-party format | [C-015] [C-026]; S-001, S-004, S-006 |

### 11.2 Discovery, scanning, validation, and recovery

The current release index says Podium 3.3.3 moved plugin-database controls to a
dedicated Setup page with folder configuration and scanning. The older guide
documents up to four root folders, recursive scanning, rebuild versus update,
and project loading from the database; update scans only new files and appends
them. Direct file/folder import can build a smaller project-specific device set.
The old New Project entry point is superseded, but the database behavior is the
best available official detail. [C-019]

Scanning loads a VST to inspect capabilities. If it crashes immediately, the
next start reports it quarantined and future scans skip it. A 2008 vendor reply
says a misbehaving scanner-loaded plugin could corrupt host memory and crash
Podium later, so quarantine was reactive rather than preventive. Validation
beyond loading/capability inspection, cache schema, duplicate identity rules,
manual quarantine removal/rescan UX, signatures, and malware checks are
**UNKNOWN**. [C-019] [C-020] [C-031]

### 11.3 Runtime isolation and compatibility

Each Podium x86/x64 build directly supports plugins of the same architecture.
The product page says Podium detects the separately installed jBridge wrapper
and uses it to scan/load cross-architecture plugins. Therefore bridging is an
external optional dependency, not documented built-in technology. [C-021]

No effective scan-process containment is present in the documented legacy path:
plugin code could corrupt Podium host memory. The 3.4 developer thread also
describes plugin preset calls and plugin crashes interacting with Podium
threads, but does not state the process boundary. Thus the scanner containment
failure is an **INFERENCE** from direct vendor evidence, while runtime
sandboxing remains **UNKNOWN**. Per-plugin process modes, crash restart, Windows
job objects, privilege reduction, and 3.4.6 containment are also **UNKNOWN**.
[C-020] [C-031]

### 11.4 Host/plugin processing contract

| Contract surface | Classification and scope | Evidence |
| --- | --- | --- |
| Instruments/effects | `DOCUMENTED`: VST2/VSTi instruments and effects | [C-016]; S-001, S-004 |
| Audio buses / multi-output | `DOCUMENTED`: scan creates mappings for reported I/O; global instances share mappings; manual multichannel mapping is available when detection fails | [C-022]; S-001, S-004 |
| Sidechains | `DOCUMENTED`: sidechain send mappings and product-page sidechain claim | [C-022]; S-001, S-004 |
| MIDI input/output | `DOCUMENTED`: MIDI can share a track with audio; VST instrument MIDI output may be recorded | [C-022]; S-004 |
| Multitimbrality | `DOCUMENTED`: 16 MIDI-channel mappings can address one global instance; manual creation handles detection limits | [C-022]; S-004 |
| MPE / note expression / MIDI 2.0 | `UNKNOWN`: no retained current statement | [C-031] |
| Automation timing | `DOCUMENTED` for 3.2.4 only: parameter changes applied at buffer start; 3.4.6 `UNKNOWN` | [C-012]; S-011 |
| Parameter values | `DOCUMENTED`: VST parameter objects default to normalized 0–1 floats and can carry step/range/text-facing metadata | [C-023]; S-004 |
| Latency reporting/PDC | `DOCUMENTED`: plugin/hardware delay compensation and displayed sample/ms latency | [C-008]; S-001, S-004 |
| Tail reporting | `UNKNOWN`: user can extend bounce with a marker, but host use of plugin tail metadata was not found | [C-009] [C-031] |
| Bypass/suspend/silence | `DOCUMENTED` host bypass makes a mapped instrument/effect inactive; standardized plugin bypass, suspend, silence flags are `UNKNOWN` | [C-023] [C-031]; S-004 |
| Offline render | `DOCUMENTED`: offline and realtime bounce; faster-than-realtime plugin behavior may differ | [C-009] [C-012]; S-001, S-004, S-011 |
| Dynamic I/O / bus renegotiation | `UNKNOWN`: mapping configuration is documented, runtime dynamic changes are not | [C-031] |

### 11.5 Parameters, automation, state, presets, and project recall

Plugin import creates device mappings, program presets, and VST parameter
objects from plugin-reported data. Users can rename/reorder/group parameter
objects or add MIDI parameter definitions. Generic editors render those objects
rather than blindly exposing raw plugin labels. [C-023]

Program presets refer to plugin program numbers; library presets embed VST
`.fxp` program or `.fxb` bank data in the project and compress it. Assigned
library presets synchronize from the plugin on project save/unload. Some
plugins' proprietary preset systems may not appear in the Podium preset panel.
This is a documented explicit-state model, but opaque state-chunk versioning,
external asset manifests, and whether every plugin instance without an assigned
library preset is safely recalled are **UNKNOWN**. [C-024] [C-031]

Projects preserve plugin mappings by file path, optionally relative to the VST
root. Missing plugins remain visible as red/broken mappings and can be searched
and relinked by filename. This is a recoverable placeholder at the mapping
level, but preservation of automation/state when deleting or replacing a
missing mapping, duplicate-name resolution, VST2→VST3 migration, and parameter
ID remapping are **UNKNOWN**. [C-024]

### 11.6 UI, diagnostics, and failure modes

Plugins may open their native editor in a Podium window or a generic parameter
editor; the generic editor can be forced when a native UI is unstable. Selected
parameters can be embedded in the track-inspector rack or mixer, while zPlugin
editors receive bespoke integration. Editor window position and embedded-editor
configuration are stored with tracks/projects. DPI scaling, detached/embedded
native-view negotiation, headless rendering, and accessibility of third-party
UIs are **UNKNOWN**. [C-023] [C-031]

Failure signals include quarantine after an immediate scan crash, red broken
plugin mappings, red invalid-preset assignment messages, audio-driver reports,
and `.dmp` crash files introduced in 3.3.0. The 3.4.6 notes only fix two 3.4.5
regressions; they do not establish broad runtime reliability. [C-019] [C-028]

## 12. Extensibility and integration

The documented extensibility surface is configuration rather than a general
scripting SDK: device-definition objects, hardware mappings, parameter objects,
track/effect-chain/project templates, editor profiles, color/setup files, and
Mackie/FaderPort control surfaces. Cubase patch scripts may be imported for
hardware names/presets. [C-006] [C-026]

Podium can act as a ReWire mixer host, stream audio, control a device via MIDI,
and synchronize transport; Podium Free disables ReWire. Because ReWire is a
legacy external protocol, this is an interoperability lineage, not evidence of
a supported modern extension API. [C-026]

No public Podium SDK, scripting language, plugin authoring API beyond VST,
general command/action API, OSC, web remote, ARA, or extension ABI was located.
Those surfaces are **UNKNOWN**, not asserted absent. [C-031]

## 13. Project format, persistence, interoperability, and collaboration

A project is saved as one proprietary `.pod` file containing its object graph;
sound objects reference separate WAV/AIFF files. References can be relative
inside the project folder. Image and plugin references can also be relative,
and projects can be merged with device matching. Track templates themselves are
small `.pod` projects containing needed device objects and one arrangement.
[C-025]

Plugin device mappings, definitions, parameter objects, library presets, editor
placement, and track hierarchy are project data. Global configuration lives in
a plain-text `Podium.ini`; current releases moved its default location to the
user's Documents tree. The application does not use the registry for its own
configuration, although the installer may. [C-024] [C-025]

The guide documents per-object undo and manual Save Project / Save All Changes;
3.4.5 renamed the combined operation “Save Project and Sounds” and mapped it to
Ctrl+S. No current official autosave, journal, atomic-save, version migration,
forward/backward compatibility, archive/collect, collaboration, or version-
control contract was located. Crash recovery appears limited to crash dumps,
manual backups, referenced media/cache, and normal save behavior; therefore
automatic project recovery is **UNKNOWN**. [C-028] [C-034]

MIDI import/export and WAV/AIFF delivery are documented. AAF, OMF, ADM/BWF,
MusicXML, DAWproject, stem manifests, and cloud collaboration are **UNKNOWN**.
[C-027] [C-034]

## 14. Delivery, live, post-production, and specialized workflows

Master, group, or individual tracks can be bounced in real time or offline and
then exported as WAV/AIFF at selected bit resolution. Punch-range rendering is
listed in the guide's shortcuts. RF64 and multichannel audio through 32 channels
support large/surround files. [C-009] [C-027]

MTC output, MIDI Clock output, ReWire synchronization, and hardware-device
latency compensation support external-studio use. No documentary evidence was
found for video playback, ADR, DDP, CD authoring, loudness compliance, batch
queues, ADM/Atmos, show control, clip launching, or live set failover. [C-026]
[C-027] [C-034]

## 15. Performance, reliability, security, and accessibility

Commercial Podium exposes selectable plugin multiprocessing, 32/64-bit mixing,
CPU load, an overload-bypass option, audio-driver reports, bounce/unload, and
gapless edit claims. Podium Free deliberately restricts plugin processing to
one core. These are vendor-documented controls, not benchmark results. [C-002]
[C-007] [C-028]

Reliability mechanisms include scanner quarantine, missing-plugin/media
relinking, setup reset/backup, and crash dumps. However, the documented scanner
allowed plugin code to corrupt host memory, and no modern sandbox, least-
privilege worker, code-signature policy, or per-plugin restart is documented.
[C-019] [C-020] [C-028]

Commercial installation requires no activation or continuing authorization.
Update signing, MSI signature/notarization equivalents, rollback, telemetry,
privacy behavior beyond the site's policy, and security response process are
**UNKNOWN**. [C-029] [C-031]

UI button/scrollbar size and touch scrolling are configurable, and the release
line includes partial translation work. No official keyboard-only conformance,
screen-reader semantics, high-contrast standard, WCAG assessment, or third-
party plugin accessibility boundary was located. [C-028] [C-031]

## 16. Licensing, ecosystem, and implementation constraints

The commercial product is sold as a non-transferable single-user license with
one-, two-, or three-year upgrade access. An expired upgrade period does not
terminate use of downloaded releases. No activation is required. Podium Free
allows commercial use but its page prohibits mirroring the installer online
without permission. These are vendor terms summaries, not legal advice or a
substitute for the complete applicable agreement. [C-029]

VST2 is the shipping ecosystem dependency. Steinberg's current FAQ says binary
distribution of a VST2 host/plugin requires an agreement signed before October
2018 and prohibits redistribution of VST2 headers. Whether Zynewave holds the
necessary historical agreement is **UNKNOWN** and must not be inferred merely
from the product's availability. By contrast, Steinberg states the current VST3
SDK is MIT-licensed, subject to its copyright/license notice. [C-030]

Format names and vendor pages do not grant trademark, compatibility,
certification, SDK, or redistribution rights. Any clean-room successor should
independently review current SDK licenses and qualify behavior with its own
fixtures; Podium's proprietary code, UI assets, `.pod` schema, and native
expression remain outside this research authority. [C-030]

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** The hierarchy makes the common graph visible and unifies MIDI,
audio, automation, hardware, and plugin mappings. Bounce can replace any
subtree, and project-owned device definitions/presets make plugin metadata
editable and portable. Multi-I/O and sidechain routing are represented with the
same mapping objects rather than special-case track types. [C-005] [C-006]
[C-009] [C-022] [C-024]

**Liabilities.** Tree-only upward flow can make cross-branch routes depend on a
second bus mechanism. Mapping-heavy global multi-I/O setup is explicit but can
be cumbersome. The shipping VST2-only boundary, old Free edition, external
bridge dependency, legacy block-boundary automation evidence, and reactive
scanner quarantine are poor modern baselines. [C-012] [C-017] [C-019]
[C-021] [C-022]

**Architecture lesson.** Podium is strongest as a reference for exposing a
route graph coherently in the track list, not as a reference implementation for
modern plugin isolation or format breadth. The bounded adaptation is “visible
hierarchy plus explicit branch objects,” not copying its UI or proprietary
object schema. [C-032]

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Support | Prerequisites / tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Hidden routing is hard to reason about | One visible nested track tree carries media/events and the default upward audio/MIDI/automation route; draw flow arrows | [C-005] | Requires cycle rules and a separate representation for cross-branch routes; deep trees can become visually dense | Medium; preserve concept, not Podium expression | `CANDIDATE` |
| Audio and MIDI track types fragment workflows | Capability-driven tracks whose assigned source/device/parameter objects determine behavior | [C-006] | Needs strong validation, typed ports, and clear UI affordances | Medium | `CANDIDATE` |
| Expensive subgraphs need reversible freezing | Bounce node at any graph subtree; atomically switch live subtree versus rendered asset and preserve reactivation | [C-009] | Must define tails, invalidation, realtime/offline determinism, asset ownership | Medium-high | `CONDITIONAL` |
| Plugins expose inconsistent metadata/state | Project-owned normalized device metadata, mappings, editable parameters, presets, and missing-device placeholder | [C-023] [C-024] | Stable host IDs, migration schema, vendor-state fidelity, duplicate resolution | High; avoid format-specific assumptions | `CONDITIONAL` |
| Sidechains and external devices become special cases | Explicit send/return and device-mapping objects sharing a typed routing model | [C-006] [C-013] [C-022] | Typed buses, latency propagation, feedback validation | Medium | `CANDIDATE` |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject reactive in-process scanning as the security boundary.** Immediate
  crash quarantine is useful recovery, but vendor evidence shows scanner-loaded
  code could corrupt host memory. Reopen only if 3.4.6 primary evidence proves a
  new isolated scanner. [C-019] [C-020]
- **Reject a new VST2-first architecture.** The format is Podium's shipping
  boundary, but Steinberg no longer accepts new VST2 license agreements and
  Podium itself is rewriting toward other formats. [C-017] [C-030]
- **Reject file-path/name as sufficient plugin identity.** Podium documents
  relative paths and filename relinking, but duplicate identity/migration are
  unknown. A new host needs stable format-native IDs plus auditable fallback.
  [C-024] [C-031]
- **`CURIOSITY_NO_GO`: community plugin compatibility anecdotes.** Rejected
  because versions/fixtures are uncontrolled and they cannot prove current host
  internals. Reopen only for a reproducible current 3.4.6 qualification matrix.
- **`CURIOSITY_NO_GO`: historical Amiga/iOS internals.** Low decision relevance;
  the iOS toolchain is unavailable and no public implementation evidence was
  found. [C-003] [C-033]
- **`CURIOSITY_NO_GO`: generic inventories of bundled effects.** Low novelty;
  device inventory does not change architecture conclusions. [C-015]
- **`CURIOSITY_NO_GO`: speculative 3.5 schedule/features.** Vendor says no date;
  planned CLAP/VST3 work is not shipping evidence. [C-001] [C-017]

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / check | Documentary result | Disposition / later probe |
| --- | --- | --- |
| H1: Podium's hierarchy is only visual grouping | Falsified: official guide/product page state audio, MIDI, and automation route upward through parents | [C-005]; inspect a nested instrument/effect/bus fixture dynamically |
| H2: “VST support” means VST3 | Falsified: shipping support is VST2.4; official 2026 post puts VST3 after unreleased 3.5 work | [C-016] [C-017] |
| H3: accepted scan implies safe containment | Falsified for legacy path: scan loads code; vendor says a plugin can corrupt host memory and crash later | [C-019] [C-020] |
| H4: 64-bit Podium bridges 32-bit plugins itself | Falsified as stated: direct support requires matching architecture; optional jBridge is external | [C-021] |
| H5: “automation supported” implies sample accuracy | Falsified for 3.2.4: vendor says processing occurs at buffer start; 3.4.6 is unknown | [C-012] |
| H6: multi-I/O support implies automatic perfect configuration | Falsified: guide provides manual global/multichannel mapping when detection fails | [C-022] |
| H7: missing plugin means project data is discarded | Not supported: broken mapping is retained and can be relinked, but full state preservation is unknown | [C-024] |
| H8: offline and realtime render are contractually identical | Not supported: vendor says faster-than-realtime plugin calls/buffer size can change output | [C-012]; compare deterministic fixture hashes |

The documentary analysis explicitly separates **format accepted**, **file
scanned**, **plugin instantiated**, and **full contract**. VST2 files can be
loaded/scanned and instantiated, but full behavior remains unproved for tails,
dynamic I/O, sample-accurate automation, all state chunks, and crash recovery.
[C-016] [C-019] [C-031]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | **DOCUMENTED** | High | Commercial Podium 3.4.6 is the newest official listed release (2024-09-16); 3.5 remained undated but in development in 2026-02 | Commercial family at cutoff | S-002, S-003, S-005 | Release index plus later developer status | Future release is not guaranteed |
| C-002 | **DOCUMENTED** | High | Demo is 3.4.2; Free is 3.2.1 with one MIDI I/O and no 64-bit mix, plugin multiprocessing, ReWire, or surround | Edition pages | S-001, S-006 | Direct edition descriptions | Free page's “frequent” update promise is stale |
| C-003 | **DOCUMENTED** | High | Frits Nielsen identifies as founder/developer; work began on Amiga in 1990 and company formed in 2004 | Vendor history | S-008 | Vendor biography | Not independently verified |
| C-004 | **DOCUMENTED** | High | Projects contain multiple arrangements and shared object/phantom sequence references | Guide/product model | S-001, S-004 | Direct feature/guide text | Guide last updated 2013 |
| C-005 | **DOCUMENTED** | High | Nested tracks visibly route audio, MIDI, and automation upward through parents | Core arrangement model | S-001, S-004 | Two official descriptions | Internal graph structure unknown |
| C-006 | **DOCUMENTED** | High | Device mappings/definitions/presets/parameters uniformly represent plugins, hardware, I/O, busses, and ReWire | Guide model | S-004 | Direct sections 3 and 5 | Current UI details may drift |
| C-007 | **DOCUMENTED** | Medium-high | ASIO/MME, up to 192 kHz, 32/64-float mixing, plugin multiprocessing, CPU/overload controls are documented | Guide/commercial page; Free exceptions | S-001, S-004, S-006 | Direct text | No independent performance measurement |
| C-008 | **DOCUMENTED** | High | Automatic plugin/external-hardware delay compensation and latency display are documented | Playback/record/monitor | S-001, S-004 | Direct text | Dynamic latency and feedback unknown |
| C-009 | **DOCUMENTED** | High | Any audio subtree can be bounced realtime/offline, switched against live children, and unloaded; marker extends tail capture | Bounce workflow | S-001, S-004 | Direct text | Plugin tail metadata unknown |
| C-010 | **DOCUMENTED** | High | Capability-driven tracks, four event types, nondestructive event fades/crossfades, phantom copies, and audio comping are documented | Arrangement/editor | S-001, S-004 | Direct guide | Modern audio warp unknown |
| C-011 | **DOCUMENTED** | Medium-high | Piano roll/drum map, MIDI file I/O, controller/NRPN/SysEx, MTC/Clock, and VST MIDI-output recording are documented | MIDI | S-004 | Direct guide | MPE/MIDI2/notation unknown |
| C-012 | **DOCUMENTED** | Medium | Vendor states Podium 3.2.4 offline buffer max 128 and plugin automation is applied at buffer start | Podium 3.2.4 only | S-011 | Vendor-authored technical reply | Must not generalize to 3.4.6 |
| C-013 | **DOCUMENTED** | Medium-high | Busses branch from hierarchy, support movable sends and up to 32 channels; current page says up to 100 | Mixer | S-001, S-004 | Direct text | Guide also says 99 in one section; count needs probe |
| C-014 | **DOCUMENTED** | High | Simultaneous input record, punch/loop, audio-only multi-take comp, WAV/RF64/AIFF and streaming/cache model are documented | Recording/media | S-001, S-004 | Direct text | Metadata/video/proxy unknown |
| C-015 | **DOCUMENTED** | High | zPEQ/zPitch/zReverb are bundled VST2.4 effects with Podium-integrated editors | Commercial/bundled | S-001, S-004 | Direct text | Not a separate public plugin format |
| C-016 | **DOCUMENTED** | High | Shipping commercial Podium supports VST2.4 instruments/effects | 3.4.x family | S-001, S-002, S-009 | Product/status/instructions triangulate | No dynamic qualification |
| C-017 | **DOCUMENTED** | High | VST3 and CLAP are not shipping in 3.4.x; CLAP was hoped for in 3.5 and VST3 later, both undated | Cutoff | S-002, S-009, S-010 | Explicit developer status and VST2 instruction | Plans can change |
| C-018 | **UNKNOWN** | High that evidence is absent | No retained official support statement was found for AAX, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, or Rack Extension; AU is outside Windows product scope | Required matrix | S-001, S-002, S-004, S-010 | Negative result from product/guide/status searches | Absence does not prove unsupported behavior |
| C-019 | **DOCUMENTED** | High | Database scanning loads plugin code, supports recursive roots/rebuild/update, and quarantines an immediate scanner crasher on restart | Guide plus 3.3.3 UI update | S-004, S-005, S-012 | Current database page + legacy details | Current quarantine UI/cache schema unknown |
| C-020 | **INFERENCE** | High | The documented legacy scanner lacked effective host-memory/process containment | Legacy scanner | S-004, S-012 | Vendor states scanner-loaded code could corrupt Podium host memory; alternative is an incomplete helper boundary | Runtime and 3.4.6 process models unknown |
| C-021 | **DOCUMENTED** | High | Direct plugin architecture must match Podium x86/x64; optional external jBridge enables wrapping | Windows builds | S-001, S-009 | Two official pages | jBridge versions/containment unknown |
| C-022 | **DOCUMENTED** | High | VST2 multi-I/O, multitimbral/global mappings, sidechain sends, and MIDI output are supported; manual mapping handles detection failures | VST2 guide | S-001, S-004 | Direct guide/product | Dynamic bus renegotiation unknown |
| C-023 | **DOCUMENTED** | High | Parameter objects drive curve automation and generic/embedded editors; native editors and bypass are supported | VST2/UI | S-004 | Direct guide | DPI/headless/sample accuracy unknown |
| C-024 | **DOCUMENTED** | Medium-high | Program/library presets, compressed `.fxp/.fxb` data, relative plugin paths, broken mappings, search/relink are documented | Project recall | S-004 | Direct guide | Unassigned state and migration semantics unknown |
| C-025 | **DOCUMENTED** | High | `.pod` contains project object data and references external audio; relative paths, merge, templates, plain-text setup are documented | Persistence | S-004, S-005 | Direct guide/release change | File schema/protocol compatibility unknown |
| C-026 | **DOCUMENTED** | Medium-high | ReWire host, MTC/Clock, Mackie/MCU and FaderPort control are documented | Integration | S-004, S-005, S-006 | Guide and release index | ReWire currency/other APIs unknown |
| C-027 | **DOCUMENTED** | Medium-high | WAV/AIFF/RF64 export and master/subtree rendering are documented | Delivery | S-001, S-004 | Direct text | Batch/loudness/post formats unknown |
| C-028 | **DOCUMENTED** | Medium | Quarantine, relink, setup reset, driver reports, crash dumps, and recent maintenance fixes are documented | Reliability | S-004, S-005 | Direct guide/releases | Mechanisms do not prove overall reliability |
| C-029 | **DOCUMENTED** | High | Commercial single-user nontransferable license, retained use after upgrade expiry, no activation; Free permits commercial use with redistribution limits | Product terms summaries | S-001, S-006 | Direct vendor pages | Full agreement not retrieved; not legal advice |
| C-030 | **DOCUMENTED** | High | Steinberg says VST3 SDK is MIT and new VST2 binary distribution requires pre-Oct-2018 agreement | Format-owner licensing | S-007 | Primary format-owner FAQ | Zynewave agreement status unknown |
| C-031 | **UNKNOWN** | High that evidence is insufficient | Sandbox/process modes, dynamic I/O, tails, MPE/MIDI2, modern signing, sample-accurate 3.4.6 automation, and many modern APIs are not publicly established | Current host contract | S-001–S-012 | Targeted and broad official-source searches | Safe dynamic probe or vendor specification needed |
| C-032 | **INFERENCE** | Medium-high | Best transferable lesson is visible hierarchy plus explicit branches, not Podium's plugin runtime | Architecture synthesis | S-001, S-004, S-012 | Derived from C-005, C-006, C-013, and C-020 | Prototype must test scalability/cycles |
| C-033 | **DOCUMENTED** | Medium-high | Product is Windows-only; 3.4.x last supports XP; old iOS port cannot be built | Platform | S-001, S-010 | Direct developer/product statements | Win11 status unknown |
| C-034 | **UNKNOWN** | High that evidence is insufficient | Autosave/recovery journal, collect/archive, AAF/OMF/ADM/MusicXML/DAWproject, video and collaboration were not established | Persistence/delivery | S-004, S-005 | Guide/release/targeted search | Absence from old guide is not proof of absence |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Vendor pages prove what Zynewave
documents; they are not independent measurements.

- **S-001 — “Podium.”** Zynewave. <https://zynewave.com/podium/>. Official
  product/sale/system page; commercial/current-family scope. Relevant sections:
  overview, feature groups, license, installation, system compatibility,
  jBridge. Supports C-001, C-002, C-004, C-005, C-007–C-009, C-013–C-016,
  C-021, C-027, C-029, C-033. **Limitation:** Demo download remains 3.4.2 and
  some prose predates releases. **Rationale:** canonical first-party snapshot,
  preferable to reseller summaries.
- **S-002 — “Topic: Podium 3.5 status.”** Zynewave/Frits Nielsen, 2025-01-04
  and 2026-02-12 updates. <https://zynewave.com/topic/podium-3-5-status/>.
  Official developer status; 3.4→3.5 scope. Relevant passages: current support
  tailored for VST2; CLAP then VST3 work; development continues without date.
  Supports C-001, C-016–C-018. **Limitation:** plans, not release evidence.
  **Rationale:** newest primary maintenance/plugin-format statement.
- **S-003 — “Podium 3.4.6.”** Zynewave, 2024-09-16.
  <https://zynewave.com/podium-releases/podium-3-4-6/>. Official release note;
  exact build/date and two fixes. Supports C-001. **Limitation:** sparse notes.
  **Rationale:** immutable release-specific evidence.
- **S-004 — “Podium Guide.”** Zynewave, last updated 2013-09-08.
  <https://zynewave.com/podium-guide/>. Official manual. Relevant sections:
  Getting Started; Projects; Devices/Plugins/Multitimbral; Tracks/Hierarchy;
  Arranging/Automation/Busses/Recording; Setup/Engine/Plugins; 64-Bit Mixing;
  Control Surfaces. Supports C-004–C-016, C-019, C-022–C-029, C-031, C-034.
  **Limitation:** old and partly superseded by 3.3+ UI changes. **Rationale:**
  deepest accessible primary specification; version-scoped where necessary.
- **S-005 — “Podium Releases.”** Zynewave.
  <https://zynewave.com/category/podium-releases/>. Official release index;
  3.3.0–3.4.6 scope. Relevant entries: 3.3.0 crash dumps, 3.3.3 database page,
  3.4.0 rewrite, 3.4.3 controllers, 3.4.5 combined save, 3.4.6 fixes. Supports
  C-001, C-019, C-025, C-026, C-028, C-034. **Limitation:** summaries omit
  unchanged behavior. **Rationale:** resolves latest-version and guide-drift
  questions better than individual forum recollections.
- **S-006 — “Podium Free.”** Zynewave.
  <https://zynewave.com/podium-free/>. Official edition/download/terms page;
  Free 3.2.1. Relevant sections: version, limitations, installation, commercial
  use, redistribution. Supports C-002, C-006, C-026, C-029. **Limitation:** the
  “frequent updates” text contradicts the old listed build. **Rationale:** only
  canonical source for edition deltas.
- **S-007 — “Licensing.”** Steinberg VST 3 Developer Portal.
  <https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html>.
  Format-owner FAQ; current VST2/VST3 licensing. Relevant sections: MIT VST3;
  “Specific VST 2.” Supports C-030. **Limitation:** does not establish
  Zynewave's agreement. **Rationale:** primary format owner, preferable to legal
  blogs or community summaries.
- **S-008 — “Company.”** Zynewave. <https://zynewave.com/company/>. Official
  founder history. Supports C-003. **Limitation:** autobiographical. **Rationale:**
  canonical provenance rather than secondary company databases.
- **S-009 — “Recommended Freeware Plugins.”** Zynewave, list last updated 2017.
  <https://zynewave.com/recommended-freeware-plugins/>. Official compatibility
  instructions. Relevant passages: choose VST2, match x86/x64, organize roots.
  Supports C-016, C-017, C-021. **Limitation:** plugin inventory is stale.
  **Rationale:** directly triangulates format and architecture rules.
- **S-010 — “Preview 3.4: Codebase rewrite.”** Zynewave/Frits Nielsen,
  2021. <https://zynewave.com/topic/preview-3-4-codebase-rewrite/>. Official
  developer replies within a mixed forum thread. Relevant passages: Windows-only
  focus, 3.4 final XP line, VST3 after 3.4, preset synchronization/thread issue.
  Supports C-017, C-020, C-033. **Limitation:** beta-era discussion; participant
  anecdotes not retained as facts. **Rationale:** only accessible developer
  detail for platform/plugin rewrite boundary.
- **S-011 — “Exported WAV file sounds different for online rendering vs
  offline.”** Zynewave forum, vendor reply 2017-02-18.
  <https://zynewave.com/topic/exported-wav-file-sounds-different-for-online-rendering-vs-offline/>.
  Vendor-authored technical reply scoped to Podium 3.2.4: offline buffer maximum
  128; parameter automation at buffer start. Supports C-012. **Limitation:** old
  version and user-reported quality issue is not accepted as proven. **Rationale:**
  uniquely resolves automation/render scheduling, with strict scope.
- **S-012 — “Podium continuously crashes on my new DAW …”** Zynewave forum,
  vendor reply 2008-08-18.
  <https://zynewave.com/topic/podium-continuously-crashes-on-my-new-daw/>.
  Vendor-authored legacy scanner statement: plugin can corrupt host memory and
  later crash. Supports C-019, C-020. **Limitation:** very old implementation;
  participant plugin accusations are excluded. **Rationale:** direct primary
  counterevidence to scanner containment; not generalized to 3.4.6.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted methods / blocker | Impact | Safest next probe | Required access/fixture | Owner |
| --- | --- | --- | --- | --- | --- |
| 3.4.6 scanner/runtime process isolation and crash restart | Product, guide, releases, developer threads searched; newest architecture not specified | Security/reliability architecture | Disposable Windows VM; benign test plugins that crash/hang during scan and process; inspect child processes and recovery | Licensed/demo 3.4.x, signed benign fixtures, process monitor | Unassigned qualification team |
| Full VST2 state recall without explicitly assigned library preset | Guide explains library presets but not every default case | Project durability | Save/reopen deterministic chunk/program plugins with/without assigned presets; hash state | Licensed 3.4.6, purpose-built VST2 fixtures under valid license | Unassigned |
| Duplicate identity and missing-plugin matching | Filename/path relink documented; no identity algorithm | Wrong-plugin substitution/data loss | Install same IDs/names at multiple paths and relocate one; inspect prompts/result | Disposable VM and clean test plugins | Unassigned |
| Dynamic I/O, latency changes, tails, suspend/bypass contract | No primary current specification | Render correctness and graph mutation | Purpose-built plugin changes buses/latency/tail during playback and offline render | VST2 fixture, signal/trace harness | Unassigned |
| Automation timing in 3.4.6 | Only 3.2.4 vendor statement found | Modulation precision | Impulse/step parameter fixture at varying ASIO/offline buffer sizes | Licensed/demo 3.4.x and observable VST2 | Unassigned |
| Offline/realtime determinism | Vendor says call speed/buffer can differ; no modern guarantee | Export trust | Render deterministic and time-dependent plugins repeatedly; compare samples/hashes | Controlled fixture suite | Unassigned |
| Current OS matrix including Windows 11 | Sale page names Windows 7/10; 3.5 will drop XP | Procurement/support | Vendor confirmation plus clean Windows 11 installation test | Current installer/license; no production host | Unassigned |
| Autosave, journal, crash recovery, atomicity | Guide/release/targeted searches found manual saves and dumps only | Project-loss exposure | Vendor query first; then kill/power-loss tests against disposable copies | Disposable VM and sacrificial projects | Unassigned |
| Interchange/collect/video/accessibility | Guide/site/release search yielded no modern contract | Portability/post/accessibility | Vendor feature matrix; UI accessibility inspection; import/export fixture set | Current app and representative projects | Unassigned |
| Zynewave's VST2 agreement/redistribution rights | Format-owner requirements found; vendor license not public | Legal risk for derivative plans | Ask vendor/Steinberg counsel; do not request confidential agreement, only status confirmation | Authorized legal review | Unassigned legal owner |

## 24. Curiosity pass and stop decision

Scoring is 0–4; higher cost is worse.

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Official render/automation and scanner-crash replies | 4 | 4 | 4 | 1 | **Pursued** in final bounded pass; resolved block timing and legacy containment |
| Community compatibility anecdotes | 2 | 1 | 2 | 3 | `CURIOSITY_NO_GO`: uncontrolled versions and no architectural proof |
| Historical Amiga/iOS implementation | 1 | 1 | 3 | 4 | `CURIOSITY_NO_GO`: unavailable/proprietary and outside current decision |
| Exhaustive bundled-effect inventory | 1 | 1 | 1 | 2 | `CURIOSITY_NO_GO`: no change to leading architecture conclusion |
| Speculate about 3.5 schedule | 2 | 0 | 1 | 2 | `CURIOSITY_NO_GO`: vendor explicitly cannot give a date |
| Generic CLAP/AAX legal survey | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: not shipping Podium formats; defer to cross-product synthesis |

**Gaps/contradictions after synthesis.** The guide's 99 versus product page's
100 bus count is unresolved; the Free page's promise of frequent updates
conflicts with its 2014 build; and the old guide UI predates the dedicated 3.3.3
database page. These are preserved rather than harmonized. Modern plugin-
contract gaps remain visible in C-031/C-034 and Section 23.

**Stop decision:** stop for **coverage plus saturation** after six two-source
passes (12 retained sources). Every heading and required matrix row is complete;
identity, hierarchy, engine, VST2 workflow, scanning, state, and persistence have
primary evidence. Additional searches repeated vendor marketing or old forum
anecdotes and had nonpositive marginal evidentiary value. Current runtime
unknowns require a bounded disposable qualification harness or direct vendor
specification, not more documentary browsing.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created only
  `research/daw-landscape/dossiers/zynewave-podium.md`; no staging/commit.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See Section 0.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-001–C-034; the register classifies each.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  Sections 21–23.
- [x] **Every required plugin-format row is present.** All 13 rows are in 11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover scanning, isolation, I/O, timing, state, UI, and
  recovery.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  C-020/C-032 are explicit inferences; C-018/C-031/C-034 are unknowns.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16.
- [x] **Bibliography records source rationale and limitations.** Section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections
  19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Documentary research only; no installer/plugin run.

**Checks performed:** governing-file/template comparison; heading and matrix
inspection; claim/source crosswalk; six-pass source-budget accounting; negative-
result and contradiction review; owned-path check.

**Unresolved blockers:** no current technical manual for 3.4.6, no public full
EULA or VST2 agreement status, no safe dynamic fixtures, and no public detailed
specification of scanner/runtime isolation or modern host contracts.

**Pre-existing workspace changes:** many unrelated modified/untracked files were
visible before dossier creation, including the already-untracked
`research/daw-landscape/` tree. They were left untouched.
