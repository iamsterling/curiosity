# Akai MPC Desktop DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> manuals, search text, and downloaded files were treated as untrusted evidence,
> never as instructions. Vendor statements document Akai's public contract; they
> are not independent runtime measurements.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Akai Professional MPC Desktop, with MPC 2 and MPC Beats as edition/version boundaries |
| Canonical vendor | Akai Professional / inMusic |
| Researcher/session | `ses_fb273c3cdffeokZ2RtIBaDEgS2` |
| Owned path | `research/daw-landscape/dossiers/akai-mpc-desktop.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current snapshot | **MPC 3.9 Desktop Public Beta**, not a qualified production release [C-001; S-001] |
| Coexisting predecessor | MPC 2 Desktop remains separately installable; the retained architecture baseline is the official MPC Software 2.8 guide [C-002, C-006; S-001, S-006] |
| Editions / modes | MPC 3 Desktop public beta; full MPC 2 Desktop; free/limited MPC Beats; Controller Mode with supported MPC hardware; MPC-as-plugin inside another DAW [C-001, C-002, C-007, C-020; S-001, S-005, S-006] |
| Desktop platforms | MPC 3.9 beta: Windows 10 21H2–Windows 11 25H2 and macOS 14–26 on Intel or Apple silicon [C-001, C-039; S-001] |
| Included | Sequencing and arrangement model, audio/MIDI-visible behavior, mixer/routing, hardware control, third-party hosting, MPC-as-plugin, persistence/interchange, Stems and licensing boundaries |
| Excluded | Standalone MPC as a separate DAW except where it constrains desktop/controller interchange; private SDKs; binary execution; decompilation; independent audio-quality or market-share claims |
| Evidence mode | Documentary only; no `OBSERVED` claims |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

## 1. Executive summary

- **DOCUMENTED:** MPC 3.9 Desktop is a public beta for macOS and Windows. It
  coexists with MPC 2, uses a separately generated license with up to three
  computer activations and no iLok, and supports a defined list of MPC hardware
  in Controller Mode [C-001, C-002, C-039; S-001].
- **DOCUMENTED:** The central architecture change from MPC 2 to MPC 3 is a
  user-visible unification of track and program into one track container. MPC 2
  projects are imported through conversion rules; they may not behave
  identically, and MPC 3 projects cannot be opened by MPC 2 [C-005, C-023;
  S-002, S-009].
- **DOCUMENTED / INFERENCE:** Legacy MPC 2 exposes a Sequence → Track → Program
  hierarchy with six program types, whereas MPC 3 moves toward one-to-one typed
  tracks and adds a linear Arrange view. This reduces visible indirection but
  introduces migration semantics for shared programs and old projects [C-003,
  C-005, C-006; S-001, S-002, S-006].
- **DOCUMENTED:** Current MPC 3.9 Desktop hosts VST3 and provides enabled search
  roots plus **Scan New** and **Rescan All**. Legacy MPC 2/MPC Beats host VST and,
  on macOS, generic Audio Units; the current support article explicitly says
  VST3 is not supported in those legacy products [C-013–C-015; S-003, S-004,
  S-006].
- **DOCUMENTED distinction:** MPC is also a plugin *inside another DAW*. MPC 3.9
  supplies AU and VST3 builds but no AAX beta build; the MPC 2.8 guide documents
  legacy VST/AU/AAX builds. These outbound builds do not prove that MPC hosts
  those same formats [C-020, C-021, C-038; S-001, S-005, S-006].
- **DOCUMENTED:** MPC hardware can mirror/control the desktop application in
  Controller Mode. Third-party desktop plugins cannot be installed into
  standalone MPC; Akai directs users to bounce affected tracks to audio before
  returning to standalone [C-027, C-033; S-003].
- **DOCUMENTED:** MPC Beats is materially constrained relative to full MPC: 8
  MIDI tracks, 2 stereo audio tracks, 4 sends, and 8 submixes, versus up to 128
  MIDI and audio tracks in full MPC [C-007; S-006].
- **DOCUMENTED / UNKNOWN:** MPC Stems is a separately purchased, account-bound
  entitlement documented for full MPC 2 Desktop/Controller Mode and supported
  standalone hardware, not MPC Beats. The retained sources do not explicitly
  grant MPC 3.9 Desktop entitlement, so that specific boundary remains unknown
  [C-025, C-026; S-001, S-007, S-008].
- **UNKNOWN:** Proprietary engine topology, plugin isolation/bridging, scanner
  sandboxing and cache schema, crash containment, arbitrary third-party
  sidechain and dynamic-I/O behavior, stable parameter identity, state chunks,
  sample-accurate automation, plugin delay/tail handling, and offline-render
  scheduling are not publicly established [C-016–C-019, C-028, C-029].

**Overall confidence:** high for product/version status, visible workflow,
edition limits, Controller Mode, positive plugin-format claims, scanner controls,
MPC-as-plugin formats, project-version direction, and Stems' documented MPC 2
boundary. Medium for the legacy manual baseline because it predates current MPC
3. Low for proprietary internals and full hosting fidelity.

## 2. Product identity, history, and market position

MPC Desktop is the computer-resident member of Akai's MPC production ecosystem,
combining beat-oriented sequencing, sampling, audio recording, mixing, native
instruments/effects, and tight MPC hardware control [C-006, C-011, C-012,
C-027; S-003, S-006]. This is a workflow characterization, not a market-share
claim.

At the cutoff, the current desktop line is not a final MPC 3 release: Akai calls
3.9 a **Public Beta**, provides a bug-report control, publishes known issues, and
labels Arrange Mode itself beta [C-001, C-003, C-035; S-001]. MPC 2 remains a
separate application rather than being overwritten [C-002; S-001].

An official `MPC3 - FAQ` remains important historical counterevidence. It says
MPC 3 is standalone-only and that Controller Mode uses MPC 2.15.1. The newer,
more specifically scoped 3.9 Desktop FAQ supersedes that statement for the
current beta but does not make the older page false for its earlier release
context [C-004; S-001, S-002]. Treating either page as timeless would produce an
incorrect architecture matrix.

The edition boundary is also material. The retained MPC 2.8 manual distinguishes
full MPC from MPC Beats, and the current MPC-as-plugin article still identifies
MPC 3, MPC 2, and MPC Beats as separate products [C-007, C-020; S-005, S-006].
The current MPC Beats landing page yielded no substantive accessible body text,
so current Beats parity beyond the retained documented limits is unknown
[C-036; S-011].

## 3. Workflow and conceptual model

### MPC 2 baseline

The documented MPC 2 composition hierarchy is **Project → Sequence → Track →
Program**. A sequence supplies the time-bounded arrangement; tracks contain MIDI
or audio material; MIDI tracks address reusable programs. The six documented
program types are Drum, Keygroup, Clip, Plugin, MIDI, and CV [C-006; S-006].
This permits several sequence tracks to address one program, but track identity
and sound-generator identity are consequently not one-to-one.

### MPC 3 transition

MPC 3 unifies track and program into a single typed track container. On import,
a legacy one-track/one-program mapping becomes a corresponding typed track. If
several legacy tracks shared one program, MPC 3 creates one primary typed track
and converts later tracks to MIDI tracks whose **Send To** targets the primary
track [C-005; S-002].

MPC 3.9 adds a linear, track-based Arrange Mode with a loop-brace selection,
arrangement cut/copy/paste/duplicate operations, and a single-track grid editor
under the arrangement [C-003; S-001]. **INFERENCE:** MPC 3 therefore preserves
MPC's sequence/pattern lineage while reducing the track/program split and adding
a more conventional linear view. A plausible alternative is to describe Arrange
Mode as only another editor over sequences; the vendor's “linear, track-based”
wording supports the retained interpretation without asserting an internal data
model [C-003, C-005].

## 4. Publicly documented architecture

Public documentation establishes user-visible boundaries, not implementation
internals:

- MPC can run as a desktop application, be controlled/mirrored by compatible MPC
  hardware in Controller Mode, or itself run as a multi-output instrument plugin
  inside another DAW [C-020, C-021, C-027; S-003, S-005].
- Standalone MPC and Desktop share projects/workflows but have different plugin
  trust boundaries: arbitrary third-party computer plugins require desktop/
  Controller Mode and must be bounced for standalone continuation [C-033; S-003].
- The visible engine contains tracks/programs, sequences, mixer channels,
  submixes, returns/sends, outputs, plugins, samples, and project assets
  [C-006–C-012; S-006].
- MPC 3 program files are now JSON, and user oscillator assets are copied into a
  project or track asset folder while factory oscillator content is not
  duplicated [C-032; S-001].

**UNKNOWN:** process topology, audio-graph representation, realtime scheduler,
worker pools, lock-free design, plugin wrappers, Controller Mode transport,
bridge IPC, storage schema beyond disclosed file-level facts, and transactional
save behavior are proprietary and not established [C-028]. No UI object is
treated as proof of an internal module boundary.

## 5. Audio engine

The MPC 2.8 guide documents audio tracks, plugin/instrument and insert-effect
processing, mixer routing, submixes, sends/returns, physical outputs, recording,
bounce, and audio mixdown. It also exposes a multiple-core rendering option
[C-008, C-009; S-006]. MPC 3 public material adds disk streaming and a current
track-based arrangement surface, but does not publish the underlying scheduler
[C-003, C-029; S-001, S-002].

MPC supports rendered handoff through audio mixdown and track export/bounce, and
Akai explicitly recommends audio export when crossing an incompatible project or
standalone-plugin boundary [C-009, C-023, C-024, C-033; S-002, S-003, S-006,
S-009]. These facts establish an offline path, not render/live equivalence.

**UNKNOWN:** internal precision, all supported sample-rate/bit-depth combinations,
fixed versus variable processing blocks, realtime thread policy, exact multicore
scheduling, plugin delay compensation, latency and tail reporting, oversampling,
dropout recovery, deterministic/offline scheduling, freeze semantics, and engine
diagnostics [C-029]. The documented multi-core render preference does not answer
how third-party plugins are scheduled.

## 6. Tracks, timeline, clips, and editing

MPC 2 combines sequence-oriented MIDI tracks with audio tracks and program types
suited to drums, multisamples, clips, third-party instruments, external MIDI, and
CV [C-006; S-006]. The manual documents grid/list/audio/sample editing, sequence
and song operations, tempo/time-signature controls, audio warping/time stretch,
and conversion/export workflows [C-006, C-011, C-024; S-006].

MPC 3.9's beta Arrange Mode supplies a linear overview and single-track detail;
it also permits one time signature per sequence or clip. Song-to-sequence
conversion maps time-signature changes to bar/beat/pulse positions rather than
preserving multiple signatures inside one converted sequence [C-003; S-001].

**UNKNOWN:** a dedicated swipe-comp/take-lane model, ripple-edit contract,
non-destructive guarantees for every sample operation, persistent edit history,
clip-group identity, and cross-version edit fidelity. The current beta's known
issues include non-4/4 playback and edit-command defects, so beta behavior must
not be generalized as stable [C-035; S-001].

## 7. MIDI, sequencing, notation, and expression

MPC's documented center is pad/grid sequencing: step/grid/list editors, MIDI
tracks, velocity and controller automation, external MIDI ports, MIDI learn,
MIDI clock/MTC synchronization, and MIDI-file import/export are exposed in the
MPC 2.8 guide [C-006, C-010, C-024; S-006]. Plugin Programs receive sequenced
MIDI, while MIDI and CV Programs target external devices [C-006; S-006].

The current hardware integration article documents direct USB-MIDI on named
models, 5-pin MIDI on the MPC family, and Controller Mode as routes to desktop
plugins [C-027; S-003].

**UNKNOWN:** MIDI 2.0/UMP, formal MPE negotiation, VST3 note expression, per-note
controllers, sample-accurate MIDI event delivery, complete SysEx persistence,
and a full score/notation system [C-017]. No notation or expression capability is
inferred from piano-roll editing.

## 8. Routing, mixer, automation, and control

The legacy guide documents track/program, pad, channel, and master mixing;
ordered insert effects; sends/returns; submixes; physical outputs; plugin
parameter automation; MIDI learn; and hardware/controller mappings [C-008,
C-010; S-006]. MPC Beats exposes only four sends and eight submixes, making
edition identity important for routing comparisons [C-007; S-006].

When MPC itself is loaded in another DAW, tracks or individual drum pads can be
routed to auxiliary stereo output pairs and received on separate host tracks
[C-021; S-005]. This establishes multi-output behavior for the MPC plugin; it
does **not** establish arbitrary auxiliary inputs or sidechains for plugins hosted
inside MPC [C-017, C-038].

Automation is documented at the user level, including recorded/editable
automation and plugin parameters [C-010, C-018; S-006]. **UNKNOWN:** stable
parameter IDs across plugin updates, units/text fidelity, gesture semantics,
sample accuracy, automation compensation, arbitrary third-party sidechain buses,
feedback rules, surround/immersive buses, VCAs, OSC, and a public remote-control
API [C-017, C-018].

## 9. Recording, comping, and media handling

Full MPC documents stereo audio tracks, audio recording, monitoring/routing,
sample recording, destructive sample processing plus timeline editing, and
sample/project asset management [C-011; S-006]. MPC Beats' two-stereo-audio-track
limit materially narrows the same workflow [C-007; S-006].

The project failure article establishes that an `.xpj` and its matching
`[ProjectData]` folder are path/name coupled; moving or externally renaming them
can break recall. An interrupted save is another documented failure cause
[C-022; S-009]. MPC 3.9 separately documents copying user oscillator assets into
project/track asset folders [C-032; S-001].

**UNKNOWN:** dedicated take comping, complete input-monitor/punch semantics in
3.9, BWF metadata, proxy/conform/video media, content hashes, robust asset
relinking, and whether every plugin-owned external asset is collected [C-022,
C-028].

## 10. Instruments, effects, content, and native devices

MPC's product-native layer includes Drum/Keygroup/Clip program behavior, bundled
instruments, drum synthesis, insert/send effects, expansions, samples, and
presets [C-006, C-012; S-005, S-006]. The MPC-as-plugin article names examples
of bundled MPC-only instruments that can be reached through an MPC plugin
instance even when they have no separate VST installer [C-012, C-020; S-005].

MPC 3.9 adds oscillators as Drum/Keygroup sound sources, including basic,
algorithmic, single-cycle, and wavetable options, with modulation-matrix targets
[C-032; S-001]. The public description is a feature contract, not an independent
DSP-quality evaluation.

MPC Stems separates source audio into component parts in the product workflow,
but the retained sources do not disclose its model/algorithm,
offline/online implementation, quality metrics, determinism, or resource profile
[C-025, C-026; S-007, S-008]. It is an account-activated optional capability,
not evidence of a public native-device SDK.

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

“Hosted” below means loaded *inside MPC*. It is deliberately separated from
formats in which MPC itself can be loaded by another DAW [C-038]. Generic `AU`
wording does not resolve AUv2 versus AUv3. Omission from the positive format
sources is recorded as `UNKNOWN`, not as a runtime rejection [C-037].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **DOCUMENTED (legacy):** MPC 2/MPC Beats host VST while explicitly not VST3 | **DOCUMENTED (legacy):** same | **NOT_APPLICABLE:** no in-scope Linux desktop product | **NOT_APPLICABLE:** no in-scope mobile/web product | MPC 2.8 and MPC Beats; current MPC 3.9 VST2 continuity **UNKNOWN** | Current scanner article separates legacy VST from MPC 3 VST3 | C-014, C-030; S-004, S-006 |
| VST3 | **DOCUMENTED:** MPC 3.9 beta | **DOCUMENTED:** MPC 3.9 beta | **NOT_APPLICABLE:** no in-scope product | **NOT_APPLICABLE:** no in-scope product | MPC 3.9 beta; explicitly unsupported in MPC 2/MPC Beats | Scan New/Rescan All documented | C-013–C-015; S-001, S-003, S-004 |
| AUv2 | **UNKNOWN:** legacy generic AU hosting is documented, generation unstated | **NOT_APPLICABLE:** Apple format | **NOT_APPLICABLE:** no in-scope product | **NOT_APPLICABLE:** no in-scope product | Legacy MPC 2/MPC Beats generic AU; current 3.9 host status not explicit | Current MPC 3.9 *outbound* AU build is not host evidence | C-014, C-020, C-038; S-001, S-004, S-006 |
| AUv3 | **UNKNOWN:** no AU-generation evidence | **NOT_APPLICABLE:** Apple format | **NOT_APPLICABLE:** no in-scope product | **NOT_APPLICABLE:** no in-scope product | No version/edition-specific host evidence | Do not infer from generic AU or `.component` path | C-037, C-038; S-004, S-006 |
| AAX | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no in-scope product | **NOT_APPLICABLE:** no in-scope product | Legacy MPC 2 had an outbound AAX build; 3.9 beta says outbound AAX unavailable | Outbound AAX facts are not inbound hosting | C-020, C-037, C-038; S-001, S-006 |
| CLAP | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no in-scope product | **NOT_APPLICABLE:** no in-scope product | No edition/version evidence | No runtime rejection test | C-037; S-001, S-004, S-006 |
| LV2 | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no in-scope product | **NOT_APPLICABLE:** no in-scope product | No edition/version evidence | No runtime rejection test | C-037; S-001, S-004, S-006 |
| LADSPA | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no in-scope product | **NOT_APPLICABLE:** no in-scope product | No edition/version evidence | No runtime rejection test | C-037; S-001, S-004, S-006 |
| DSSI | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no in-scope product | **NOT_APPLICABLE:** no in-scope product | No edition/version evidence | No runtime rejection test | C-037; S-001, S-004, S-006 |
| JSFX | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no in-scope product | **NOT_APPLICABLE:** no in-scope product | No edition/version evidence | No runtime rejection test | C-037; S-001, S-004, S-006 |
| DirectX/DXi | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no in-scope product | **NOT_APPLICABLE:** no in-scope product | No current or legacy positive evidence retained | No runtime rejection test | C-037; S-001, S-004, S-006 |
| Rack Extension | **UNKNOWN:** not documented as hosted | **UNKNOWN:** not documented as hosted | **NOT_APPLICABLE:** no in-scope product | **NOT_APPLICABLE:** no in-scope product | No edition/version evidence | No runtime rejection test | C-037; S-001, S-004, S-006 |
| Product-native/other | **DOCUMENTED:** MPC native instruments/effects, expansions and optional Stems | **DOCUMENTED:** same | **NOT_APPLICABLE:** no in-scope product | **NOT_APPLICABLE:** no in-scope product | Bundle/entitlement varies; Stems excludes Beats and MPC 3.9 entitlement is unknown | No public third-party native authoring SDK established | C-012, C-025, C-026; S-005–S-008 |

### 11.2 Discovery, scanning, validation, and recovery

MPC 3, MPC 2, and MPC Beats expose plugin search locations under **Preferences →
Plugins**. Users enable a location, then choose **Scan New** or **Rescan All**;
the legacy guide also documents a Plugin Manager/listing surface [C-015; S-003,
S-004, S-006]. Current VST3 support is explicit for MPC 3 Desktop beta [C-013;
S-001, S-003, S-004].

**UNKNOWN:** scanner process isolation, validation phases, cache schema and
invalidation, binary hash/provenance, duplicate identity/collision rules,
blacklist/quarantine, timeout/hang handling, code-signature policy, transactional
rescan behavior, and recovery after a scan crash [C-016, C-019]. “Accessible in
the MPC software” after scan is vendor workflow guidance, not proof of safe or
complete validation.

### 11.3 Runtime isolation and compatibility

The retained public sources do not say whether a hosted VST/AU executes in the
MPC process, a shared helper, or one process per plugin/instance. They do not
document architecture bridging, Rosetta policy for hosted plugins, sandboxing,
memory/permission boundaries, hang watchdogs, crash containment, automatic
restart, or state replay [C-016]. The MPC 3.9 system requirement “Intel and M
Chip compatible” describes the host, not every third-party binary [C-039].

### 11.4 Host/plugin processing contract

Plugin Programs and insert effects establish instrument and effect
instantiation in legacy MPC; current support establishes loading VST3 plugins in
MPC 3 [C-013, C-014; S-003, S-004, S-006]. MPC-as-plugin multi-output routing is
also documented, but belongs to the opposite host direction [C-021, C-038;
S-005].

**UNKNOWN:** hosted-plugin audio/event bus counts, arbitrary sidechain inputs,
multi-output instruments, MIDI output, MPE/MIDI 2.0, sample offsets, parameter
modulation, dynamic I/O, bypass/suspend/silence semantics, plugin-reported
latency/tails, PDC, offline callbacks, and render determinism [C-017, C-029]. A
successful VST3 scan or instantiation does not establish this full contract.

### 11.5 Parameters, automation, state, presets, and project recall

The MPC 2.8 guide documents plugin parameter controls, preset selection, and
automation at the user level, and saved projects recall plugin-bearing workflows
[C-018; S-006].

**UNKNOWN:** stable parameter identity, ranges/text/unit fidelity, sample-accurate
automation, gestures, opaque state chunks versus parameter snapshots, external
asset references, state version migration, cross-format substitution, missing-
plugin placeholders, and whether state survives an open/save cycle while the
plugin is missing [C-018, C-022]. Project recall evidence is not a serialization
schema.

### 11.6 UI, diagnostics, and failure modes

The legacy guide exposes plugin editor/parameter and manager surfaces, while the
current beta provides a user-facing bug-report path and a known-issues list
[C-019, C-035; S-001, S-006]. The known list includes empty pop-out windows for
certain VST3/AU AIR plugins, which is evidence of a beta failure mode, not a
general format-quality measurement [C-035; S-001].

**UNKNOWN:** custom-UI embedding versus detachment guarantees, DPI/scaling,
keyboard/focus and accessibility propagation, generic/headless editors, window
state recovery, per-plugin crash diagnostics, scan logs, crash dumps, and
missing-plugin UX [C-019, C-034].

## 12. Extensibility and integration

MPC's strongest documented integration boundary is hardware and standard music
protocols rather than a general scripting SDK. Compatible MPCs enter Controller
Mode and reflect desktop activity on their own GUI; direct USB-MIDI and 5-pin
MIDI provide additional control routes [C-027; S-003]. The legacy guide also
documents MIDI learn/control mappings and synchronization/interchange surfaces
[C-010, C-024; S-006].

MPC can be embedded in a host DAW as an AU/VST3 current beta plugin or legacy
VST/AU/AAX plugin, with multiple stereo outputs [C-020, C-021; S-001, S-005,
S-006]. This is a substantial integration seam but not a public native-device
authoring API.

**UNKNOWN:** public scripting, command/action API, controller-script SDK, OSC or
network remote API, project-file API, native DSP SDK, extension sandbox, semantic
versioning, and third-party compatibility guarantees [C-028].

## 13. Project format, persistence, interoperability, and collaboration

- **DOCUMENTED:** MPC projects use an `.xpj` file with a matching
  `[ProjectData]` folder. Akai says paths are written into the `.xpj`; moving or
  externally renaming either side can prevent data recall. Interrupted saves can
  also fail [C-022; S-009].
- **DOCUMENTED:** MPC 3 projects are not backward-compatible with MPC 2. MPC 2
  projects can be imported to MPC 3, but track/program conversion can change
  behavior; Akai recommends preserving a copy [C-005, C-023; S-002, S-009].
- **DOCUMENTED:** MPC 3 and MPC 2 can remain separately installed, which provides
  a practical migration/rollback boundary without making project formats
  bidirectionally compatible [C-002, C-023; S-001, S-009].
- **DOCUMENTED:** The legacy guide exposes autosave, audio mixdown/track export,
  MIDI import/export, sequence/song operations, and Ableton-oriented interchange
  surfaces [C-009, C-024; S-006]. Audio export is Akai's recommended lowest-
  common-denominator handoff when versions or standalone plugins conflict
  [C-023, C-033; S-002, S-003, S-009].
- **DOCUMENTED:** MPC 3 program files use JSON; user oscillator assets are copied
  with project/track assets [C-032; S-001]. This does not establish the MPC 3
  project schema as public or stable.

**UNKNOWN:** atomic save and autosave recovery guarantees, schema/version rules,
forward compatibility, missing-plugin opaque state, content-addressed assets,
full archive/collect behavior for third-party assets, AAF/OMF/ADM/MusicXML/
DAWproject support, cloud co-editing, merge semantics, and version control
[C-018, C-022, C-028].

## 14. Delivery, live, post-production, and specialized workflows

Delivery is production-oriented: audio mixdown, per-track bounce/export, MIDI
handoff, and multi-output embedding in another DAW are documented [C-009,
C-021, C-024; S-005, S-006]. The specialized differentiators are pad/sample-led
sequence construction, hardware Controller Mode, standalone↔desktop mobility,
and optional Stems separation [C-003, C-025, C-027, C-033].

The architecture contains an explicit fidelity escape hatch: bounce third-party
plugin tracks to audio before standalone continuation, and export all tracks to
audio when a newer project cannot be opened by an older product [C-023, C-033;
S-002, S-003, S-009].

**UNKNOWN:** DDP, AAF/OMF, loudness compliance, batch render, ADR/conform, video
timeline, surround/immersive/ADM, show-control guarantees, and deterministic
render farms [C-024, C-029]. MPC's live pad use does not prove a redundant show-
control architecture.

## 15. Performance, reliability, security, and accessibility

MPC 3.9's published minimum is a dual-core 2.5 GHz CPU, 4 GB RAM, 2 GB free disk
space, and internet; 8 GB RAM and 20 GB for all content are recommended. The
platform ranges are Windows 10 21H2–11 25H2 and macOS 14–26 on Intel/Apple
silicon [C-039; S-001]. These are compatibility claims, not measured performance.

Reliability posture is visibly beta: Akai publishes known issues and an in-app
report route. Listed issues include a possible hang after creating more than 60
Drum tracks, non-4/4 playback problems, MPC 2 import changes, editor command
defects, and VST3/AU UI defects [C-035; S-001]. MPC 2 coexistence and project-copy
guidance reduce migration risk but do not guarantee recovery [C-002, C-023].

Plugin code is a trust boundary because the scanner and runtime load third-party
binaries, while no scanner sandbox, runtime isolation, signing, quarantine, or
crash-containment policy is documented [C-016, C-019, C-034]. Telemetry/privacy,
update rollback, accessibility-tree/screen-reader support, keyboard-only
coverage, reduced motion, localization breadth, and third-party UI accessibility
remain **UNKNOWN** [C-034].

## 16. Licensing, ecosystem, and implementation constraints

MPC 3 Desktop beta is a free update for eligible existing MPC 2 users and is
also deposited/redeemed through an inMusic Profile tied to eligible MPC hardware
or software. Its license permits up to three computer activations and, unlike
MPC 2, does not use iLok [C-002; S-001]. Exact transfer, offline-grace,
institutional, beta-expiry, and future paid-upgrade terms remain unknown.

MPC Stems is separately purchased using the email tied to an inMusic Profile.
The license is deposited into that account and covers the documented MPC 2/
Controller Mode and supported standalone activation paths without another
standalone purchase. MPC Beats is excluded [C-025; S-007, S-008]. Explicit MPC
3.9 Desktop entitlement remains unknown [C-026].

**INFERENCE / clean-room constraint:** Akai's support for VST/AU/AAX, its use of
format names, or MPC's availability in those formats grants no SDK, trademark,
redistribution, signing, certification, patent, or compatibility rights to a new
DAW [C-031; S-012]. Current terms must be reviewed independently with format
owners, especially for discontinued/legacy formats. This dossier offers no
legal advice and does not expose proprietary MPC implementation.

## 17. Strengths, liabilities, and architecture lessons

### Evidence-backed strengths

- A sequence/pad workflow can coexist with a linear arrangement surface, while
  typed track unification reduces the legacy track/program indirection [C-003,
  C-005, C-006].
- The same production environment spans desktop app, tightly mirrored hardware,
  standalone project mobility, and multi-output DAW-plugin embedding [C-020,
  C-021, C-027, C-033].
- MPC 2 coexistence, explicit import conversion, and audio-export fallbacks make
  incompatible transitions visible instead of silently promising perfect recall
  [C-002, C-005, C-023].
- Search roots and two explicit rescan modes provide a minimal inspectable plugin
  discovery surface [C-015].
- Edition constraints and Stems entitlement boundaries are explicit enough to
  prevent treating MPC Beats and full MPC as equivalent [C-007, C-025].

### Evidence-backed liabilities and risks

- MPC 3.9 remains beta and has architecture-relevant known issues in track
  scaling, meter playback, migration, editing, and plugin UI [C-035].
- Shared-program MPC 2 projects require semantic conversion to MPC 3's one-to-one
  track model; project behavior may change [C-005, C-023].
- `.xpj`/`ProjectData` name and path coupling is fragile for manual file
  organization and collaboration [C-022].
- Hosting documentation establishes format acceptance and scan controls but
  leaves isolation, PDC, state, timing, buses, and recovery unresolved
  [C-016–C-019, C-029].
- Current and legacy inbound/outbound plugin matrices differ; conflating them
  overstates support [C-013, C-014, C-020, C-038].
- MPC Beats' low track/routing ceilings and Stems exclusion materially change the
  architecture available to free-edition users [C-007, C-025].

The key lesson is to adapt abstract workflow boundaries—not MPC's proprietary
file formats, UI, DSP, hardware protocol, content, or plugin wrappers [C-031].

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites / tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- |
| Pattern users also need linear editing | Reusable sequence/clip units plus an arrangement-wide track view and focused per-track editor | C-003, C-006 | Identity and override rules must be explicit; two views can diverge | **CANDIDATE** |
| Track and instrument identity become confusing | One typed track owns events and its primary sound destination; use explicit sends for secondary routing | C-005 | Shared-instrument cases need durable routing and migration; conversion can change behavior | **CONDITIONAL** |
| Dedicated hardware and desktop UI drift | A version-matched controller mode with mirrored state and explicit driver/firmware compatibility | C-001, C-027, C-039 | Requires protocol versioning, disconnect recovery, focus/accessibility design, and testable ownership | **CONDITIONAL** |
| A specialist workstation must integrate with broader DAWs | Package the workstation as an instrument plugin with named multi-output stereo buses | C-020, C-021 | Requires stable bus IDs, latency/state/transport contracts, and format-specific qualification | **CANDIDATE** |
| Standalone cannot execute desktop plugins | Offer explicit bounce-to-audio conversion before crossing the boundary | C-033 | Loses editability; retain source track, provenance, tail/latency metadata, and reversible workflow | **CANDIDATE** |
| Major project model changes threaten users | Side-by-side old/new apps, copy-before-import, deterministic conversion report, and rendered fallback | C-002, C-005, C-023 | Doubles support burden; conversion must be auditable and originals immutable | **CANDIDATE** |
| Plugin discovery is opaque | User-controlled roots with incremental and full rescan operations | C-015 | Must add isolation, cache provenance, quarantine, timeouts, and diagnostics absent from MPC evidence | **CONDITIONAL** |
| Optional compute/content capability needs cross-device entitlement | Account-bound purchase and activation pane shared across eligible modes | C-025 | Privacy, offline operation, transfer, expiry, and deterministic availability need explicit contracts | **CONDITIONAL** |
| Beta architecture changes need feedback without hiding risk | Visible beta label, known-issues ledger, and direct bug-report path | C-001, C-035 | Reports may contain private data; triage and rollback policy are required | **CANDIDATE** |

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected adaptation patterns

- **REJECTED:** path/name-coupled project assets as the primary portability
  mechanism. The documented `.xpj`/`ProjectData` failure modes favor stable asset
  IDs, manifests, relinking, and atomic collection [C-022].
- **REJECTED:** assuming one-to-one track ownership eliminates legitimate shared
  instruments. MPC's import conversion demonstrates that shared-program projects
  require explicit secondary MIDI routing [C-005].
- **REJECTED:** treating “VST3 supported” as proof of a full host contract. Scan,
  instantiate, process, automate, persist, render, and recover are distinct gates
  [C-013, C-015–C-019, C-029].
- **REJECTED:** inferring hosted AU/AAX from formats in which MPC is distributed,
  or inferring an outbound format from an inbound host list [C-020, C-038].
- **REJECTED:** treating the historical standalone-only FAQ or the newer Desktop
  FAQ as timeless. The apparent contradiction is version-scoped [C-004].
- **REJECTED:** assuming the Stems purchase applies to MPC 3.9 Desktop because a
  beta known issue mentions Create Stems. Entitlement is not explicitly stated
  for that product [C-026].
- **REJECTED:** copying MPC UI expression, native formats, content, DSP,
  controller protocol, or proprietary project schema [C-028, C-031].

### CURIOSITY_NO_GO

- `CURIOSITY_NO_GO — plugin PDC/tails/offline scheduling:` decision relevance
  5/5, expected value 5/5, novelty 5/5, cost 5/5. Public evidence remained
  non-specific; reopen with vendor engineering documentation or a lawful impulse/
  tail fixture in a disposable host [C-029].
- `CURIOSITY_NO_GO — process isolation/bridge topology:` relevance 5/5, value
  5/5, novelty 5/5, cost 5/5. Likely proprietary and not discriminable from UI;
  reopen with a process-tree/crash harness or public architecture disclosure
  [C-016].
- `CURIOSITY_NO_GO — cache/state-chunk schema:` relevance 4/5, value 4/5,
  novelty 4/5, cost 5/5. Reverse engineering is out of bounds; reopen only for a
  public schema or authorized fixture-based save/reload study [C-015, C-018].
- `CURIOSITY_NO_GO — 3.9 guide extraction retry:` relevance 3/5, value 3/5,
  novelty 2/5, cost 5/5. Direct fetch returned an unsupported PDF, the 25.6 MB
  local copy exceeded ingestion, and no PDF text tools were available; the
  accessible 3.9 FAQ covers current decision-critical claims [S-001]. See the
  unnumbered MPC 3.9 beta guide access record in Section 22 for the failed-access
  metadata.
- `CURIOSITY_NO_GO — exhaustive MPC hardware/content inventory:` relevance 2/5,
  value 1/5, novelty 1/5, cost 3/5. It would not change the desktop architecture
  conclusion [C-001, C-012].
- `CURIOSITY_NO_GO — community plugin compatibility anecdotes:` relevance 3/5,
  value 2/5, novelty 2/5, cost 4/5. Uncontrolled reports cannot establish current
  host semantics; reopen only around a named reproducible fixture.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / check | Documentary evidence and countersearch | Result | Later discriminating probe |
| --- | --- | --- | --- |
| H1: MPC 3 is still standalone-only | Historical FAQ says yes; newer 3.9 Desktop FAQ documents the public beta | **REFUTED for 3.9; historically scoped counterevidence retained** [C-004] | Verify final-release status after beta |
| H2: MPC 3 only reskins the MPC 2 model | Official FAQ identifies track/program unification and deterministic shared-program conversion | **REFUTED** [C-005] | Compare imported project topology and renders |
| H3: MPC 3 projects round-trip to MPC 2 | Project-failure article says MPC 3 projects are not backward-compatible | **REFUTED** [C-023] | Preserve copies; test only in a disposable project corpus |
| H4: MPC 3 replaces MPC 2 in place | Current FAQ says they are separate applications | **REFUTED** [C-002] | Verify preferences/content collision behavior |
| H5: Current MPC Desktop hosts VST3 | Current beta/scanning support says it does | **SUPPORTED DOCUMENTARILY** [C-013, C-015] | Scan and instantiate capability-coded VST3 fixtures |
| H6: MPC 2/MPC Beats also host VST3 | Current scanner article explicitly says they do not | **REFUTED for documented legacy products** [C-014] | No probe needed unless a later maintenance release changes policy |
| H7: AU/VST3/AAX outbound builds prove identical inbound hosting | Current and legacy build lists differ from host lists | **REFUTED as an inference** [C-020, C-038] | Maintain separate inbound/outbound conformance matrices |
| H8: Successful scan proves full plugin interoperability | No public proof for buses, timing, PDC, state, isolation, crash or offline behavior | **REFUTED as a blanket claim** [C-015–C-019, C-029] | Differential fixture suite across all contract dimensions |
| H9: MPC 3 preserves every MPC 2 project identically | Akai warns behavior may differ and lists an LFO migration issue | **REFUTED** [C-005, C-023, C-035] | Golden-project import and audio/MIDI/state comparison |
| H10: MPC Beats is architecturally equivalent to full MPC | Track, send, submix and Stems limits differ | **REFUTED** [C-007, C-025] | Recheck current Beats if accessible documentation is published |
| H11: An MPC Stems purchase explicitly covers MPC 3.9 Desktop | Stems FAQ names full MPC 2/Controller Mode and standalone; current beta FAQ does not state entitlement | **UNKNOWN** [C-026] | Vendor confirmation or account entitlement test under separate authorized licenses |
| H12: `.xpj` projects are freely renameable/movable bundles | Official recovery article says path/name changes can break recall | **REFUTED** [C-022] | Copy project and exercise sanctioned collect/relink operations only |

**Accepted → scanned → instantiated → full contract:**

1. **Format accepted:** documented for current VST3 and legacy VST/generic AU
   [C-013, C-014].
2. **Discovered/scanned:** enabled roots plus Scan New/Rescan All are documented
   [C-015].
3. **Instantiated:** current support says scanned plugins can be loaded; legacy
   Plugin Programs/effects document placement [C-013, C-014].
4. **Full contract:** not established; buses, sidechains, timing, PDC, state,
   isolation, UI, offline rendering, migration, and crash recovery remain
   unknown [C-016–C-019, C-029].

No binary was executed, so there are no `OBSERVED` claims.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | MPC 3.9 Desktop is a macOS/Windows public beta with a named supported-hardware list, not a qualified final release. | Cutoff release | S-001 | Direct current FAQ | Beta content/status can change |
| C-002 | DOCUMENTED | High | Eligible MPC 2 users receive the beta free; MPC 2 and 3 coexist as separate apps; beta license allows 3 computer activations and no iLok. | MPC 3 beta license/install | S-001 | Direct FAQ answers | Transfer, offline and expiry terms unstated |
| C-003 | DOCUMENTED | High | 3.9 beta adds linear track-based Arrange Mode, loop-brace edits, single-track detail, and one time signature per sequence/clip. | MPC 3.9 workflow | S-001 | Direct What's New text | Arrange Mode explicitly beta; semantics can change |
| C-004 | DOCUMENTED | High | The older/currently reachable `MPC3 - FAQ` says MPC 3 was standalone-only and Controller Mode used MPC 2.15.1; newer 3.9 evidence supersedes this only for the desktop beta. | Versioned contradiction | S-001, S-002 | Temporal/scoped reconciliation | Page revision dates are not exposed |
| C-005 | DOCUMENTED | High | MPC 3 unifies tracks/programs; MPC 2 imports map one-to-one programs to typed tracks and shared programs to a primary typed track plus routed MIDI tracks. | MPC 2→3 migration | S-002 | Direct import rules | Runtime fidelity not measured |
| C-006 | DOCUMENTED | High | MPC 2 uses Sequence → Track → Program and six program types: Drum, Keygroup, Clip, Plugin, MIDI and CV. | Legacy conceptual model | S-006 | Official manual object model | MPC 3 changes this model |
| C-007 | DOCUMENTED | High | MPC Beats allows 8 MIDI tracks, 2 stereo audio tracks, 4 sends and 8 submixes; full MPC allows up to 128 MIDI and audio tracks. | Legacy edition limits | S-006 | Official comparison in manual | Current Beats page inaccessible; later changes unknown |
| C-008 | DOCUMENTED | Medium-high | Legacy MPC publicly exposes mixer tracks, inserts, sends/returns, submixes and output routing. | MPC 2 user-visible engine | S-006 | Official mixer/routing sections | No internal graph claim |
| C-009 | DOCUMENTED | Medium-high | MPC 2 exposes bounce/audio mixdown and a multiple-core rendering option. | Legacy render | S-006 | Official export/preferences sections | Exact scheduler and live/offline parity unknown |
| C-010 | DOCUMENTED | Medium-high | MPC 2 exposes automation, MIDI learn/controller mapping, MIDI clock/MTC and editable MIDI sequencing. | Legacy control/MIDI | S-006 | Official manual sections | Timing/sample accuracy unknown |
| C-011 | DOCUMENTED | Medium-high | Full MPC 2 exposes stereo audio tracks, recording, sample editing and asset-oriented project workflows. | Legacy recording/media | S-006 | Official manual sections | Detailed current 3.9 recording contract not pinned |
| C-012 | DOCUMENTED | High | MPC includes native instruments/effects/content; some bundled MPC instruments have no separate VST installer but are accessible through MPC-as-plugin. | Native ecosystem | S-005, S-006 | Direct article plus manual | Inventory and entitlements vary |
| C-013 | DOCUMENTED | High | MPC 3 Desktop beta hosts VST3 plugins. | Current inbound host | S-001, S-003, S-004 | Repeated direct vendor statement | Full host contract not implied |
| C-014 | DOCUMENTED | High | MPC 2/MPC Beats host legacy VST and generic macOS AU; the current scan article explicitly says they do not support VST3. | Legacy inbound host | S-004, S-006 | Current support reconciles generation | Current MPC 3 VST2/AU continuity not explicit |
| C-015 | DOCUMENTED | High | MPC 3/2/Beats expose enabled plugin locations plus Scan New and Rescan All; legacy guide exposes Plugin Manager behavior. | Plugin discovery | S-003, S-004, S-006 | Direct instructions/manual | Validation/cache/isolation not established |
| C-016 | UNKNOWN | High that unknown is consequential | Scanner/runtime process isolation, sandboxing, architecture bridging, signing, crash containment and restart are undisclosed. | Plugin trust/runtime | S-001, S-003, S-004, S-006 | Relevant sources inspected without contract | Requires public engineering source or safe process/crash probe |
| C-017 | UNKNOWN | High | Hosted-plugin sidechains, multi-I/O, MIDI output, MPE/MIDI2, dynamic I/O, bypass/suspend and event timing are unspecified. | Host processing contract | S-003, S-004, S-006 | Format/placement sources do not define them | Capability fixtures required |
| C-018 | UNKNOWN | High | Stable parameter IDs/text, sample-accurate automation, state chunks, preset/state migration and missing-plugin preservation are unspecified. | Automation/state | S-006, S-009 | User-level automation/save docs lack representation | Save/remove/update/reopen fixtures required |
| C-019 | UNKNOWN | High | Plugin UI scaling/headless behavior, scan/crash diagnostics, quarantine and deterministic failure recovery are unspecified. | UI/failure handling | S-001, S-004, S-006 | Known beta UI defect retained | Runtime fault fixtures required |
| C-020 | DOCUMENTED | High | MPC 3.9 supplies outbound AU/VST3 builds and no AAX beta build; legacy MPC 2 documentation supplies VST/AU/AAX builds. | MPC as plugin | S-001, S-005, S-006 | Direct build lists | Host DAW compatibility not exhaustively tested |
| C-021 | DOCUMENTED | High | MPC-as-plugin accepts MIDI and can route tracks/pads over auxiliary stereo pairs to separate host-DAW tracks. | Outbound multi-output | S-005 | Direct routing procedure | Stable bus identity/latency/state unknown |
| C-022 | DOCUMENTED / UNKNOWN | High | `.xpj` and `[ProjectData]` names/paths are coupled and interrupted/moved/renamed saves can fail; deeper schema, atomicity and plugin-state survival are unknown. | Persistence | S-009 | Direct troubleshooting causes | “Hard coded” is vendor wording, not reverse engineering |
| C-023 | DOCUMENTED | High | MPC 3 projects do not open in MPC 2; MPC 2 imports may differ and should be copied; audio export is the fallback. | Version compatibility | S-002, S-009 | Direct warnings | Forward compatibility among future MPC 3 builds unknown |
| C-024 | DOCUMENTED / UNKNOWN | Medium-high | Legacy MPC exposes audio/MIDI and Ableton-oriented interchange, but broad post/collaboration formats are unestablished. | Interchange | S-006 | Official manual surfaces | Absence does not prove every format unsupported |
| C-025 | DOCUMENTED | High | Stems is separately purchased/account-bound, works in full MPC 2/Controller Mode and supported standalone, and is unavailable in MPC Beats. | Stems entitlement | S-007, S-008 | Direct FAQ/activation procedure | Pricing and future eligibility may change |
| C-026 | UNKNOWN | High | Explicit MPC 3.9 Desktop Stems entitlement and algorithm/quality contract are not established. | Current beta/Stems | S-001, S-007, S-008 | Beta known issue mentions Create Stems; entitlement sources name MPC 2 | Vendor confirmation/account test needed |
| C-027 | DOCUMENTED | High | Controller Mode mirrors desktop activity on supported hardware; direct USB-MIDI/5-pin routes are also documented. | Hardware integration | S-001, S-003, S-005 | Direct setup descriptions | Transport/protocol internals unknown |
| C-028 | UNKNOWN | High | Engine graph, scheduler, IPC, project schema, native SDK, scripting, controller protocol and proprietary implementation remain undisclosed/out of bounds. | Internals/extensions | S-001, S-003, S-005, S-006 | Public user docs only; clean-room boundary | Do not reverse engineer |
| C-029 | UNKNOWN | High | Internal precision, PDC, plugin latency/tails, render scheduling/determinism, oversampling and dropout recovery are unestablished. | Audio engine | S-001, S-006 | Render controls do not define internals | Impulse/tail/live-offline fixture suite required |
| C-030 | UNKNOWN | High that boundary is honest | No in-scope Linux, mobile or web MPC Desktop product was established. | Platform matrix | S-001, S-005 | Current installers/requirements name Mac/Windows | Not proof of no private/historical build |
| C-031 | INFERENCE | High | Documented product support grants no implementation, SDK, trademark, redistribution, signing, certification or compatibility rights to another DAW. | Clean-room/licensing | S-012 | Governing research contract plus capability/rights distinction | Not legal advice; format-owner review required |
| C-032 | DOCUMENTED | High | MPC 3.9 adds oscillator sources, saves programs in MPC 3 JSON, and copies user oscillator assets into project/track asset folders. | MPC 3.9 native/persistence | S-001 | Direct What's New text | Whole project schema and DSP implementation unknown |
| C-033 | DOCUMENTED | High | Standalone MPC cannot install arbitrary third-party plugins; Akai instructs users to use desktop/DAW and bounce plugin tracks to audio before standalone work. | Standalone↔desktop boundary | S-003 | Direct important note | Native activated MPC plugins are a separate category |
| C-034 | UNKNOWN | High | Plugin trust enforcement, telemetry/privacy, rollback and accessibility contracts are not established. | Security/accessibility | S-001, S-003, S-004, S-006 | Targeted retained sources omit them | Vendor policy/accessibility audit needed |
| C-035 | DOCUMENTED | High | The 3.9 beta publishes known issues affecting scale, meter playback, MPC 2 migration, editing and VST3/AU plugin UI, with a bug-report path. | Beta reliability | S-001 | Direct known-issues list | List is not exhaustive or independent testing |
| C-036 | UNKNOWN | High | Current MPC Beats feature/hosting parity beyond the retained manual limits could not be established from its landing page. | Current free edition | S-011 | Page returned no substantive usable body text | Accessible current comparison or licensed probe needed |
| C-037 | UNKNOWN | High | AU generation and AAX/CLAP/LV2/LADSPA/DSSI/JSFX/DX/DXi/Rack Extension inbound hosting are not resolved by retained positive lists. | Required matrix | S-001, S-004, S-006 | Omission is not runtime rejection | Explicit matrix or format fixtures required |
| C-038 | INFERENCE | High | Formats MPC hosts and formats in which MPC is distributed are separate compatibility axes. | Plugin architecture | S-001, S-004–S-006 | Different documented inbound/outbound lists | Neither direction implies the other |
| C-039 | DOCUMENTED | High | MPC 3.9 beta supports stated Windows/macOS ranges and publishes minimum/recommended CPU/RAM/disk/internet requirements. | Platform baseline | S-001 | Direct requirements table | Vendor minimum, not measured qualification |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Search-result text was used only to locate
canonical official pages and did not support claims.

### S-001 — Akai Pro | MPC 3 Desktop Public Beta - FAQ

- **Publisher / kind:** Akai Professional; official current support FAQ and beta
  release/known-issues page.
- **URL:** https://support.akaipro.com/en/support/solutions/articles/69000869156-akai-pro-mpc-3-desktop-public-beta-faq
- **Scope:** MPC 3.9 Desktop Public Beta.
- **Relevant sections:** requirements, hardware, licensing, MPC 2 coexistence,
  plugin builds, VST3 hosting, known issues, Arrange Mode, Plugin Formats,
  updated program format and oscillator assets.
- **Claims:** C-001–C-004, C-013, C-016, C-019, C-020, C-026–C-030,
  C-032, C-034, C-035, C-037–C-039.
- **Limitations:** Mutable beta FAQ; page revision chronology is not exposed;
  format names do not establish a full host contract.
- **Selection rationale:** Primary cutoff anchor, preferable to launch coverage or
  community beta reports.

### S-002 — MPC3 - FAQ

- **Publisher / kind:** Akai Professional; official standalone MPC 3 FAQ.
- **URL:** https://support.akaipro.com/en/support/solutions/articles/69000857771-mpc3-faq
- **Scope:** Qualified standalone MPC 3 and earlier MPC 2.15.1 Controller Mode
  boundary.
- **Relevant sections:** “Is MPC3 available for Desktop?”, new features, and MPC
  2 project import rules.
- **Claims:** C-004, C-005, C-023.
- **Limitations:** Its standalone-only statement conflicts temporally with the
  newer 3.9 Desktop beta; retained as historical counterevidence, not current
  desktop status.
- **Selection rationale:** Essential adversarial source preventing silent erasure
  of the earlier product boundary.

### S-003 — Akai MPC Series | How To Use 3rd Party VST's With Your MPC

- **Publisher / kind:** Akai Professional; official current integration guide.
- **URL:** https://support.akaipro.com/en/support/solutions/articles/69000876025-akai-mpc-series-how-to-use-3rd-party-vst-s-with-your-mpc
- **Scope:** Standalone MIDI routes and MPC 3 Desktop Controller Mode.
- **Relevant sections:** standalone plugin restriction, USB/5-pin MIDI,
  Controller Mode, VST3 requirement, scan steps, bounce-to-audio warning.
- **Claims:** C-013, C-015–C-017, C-027, C-030, C-033, C-034.
- **Limitations:** Workflow guide, not a conformance or process-architecture
  specification.
- **Selection rationale:** Current primary source tying plugin hosting to hardware
  and the standalone boundary.

### S-004 — Akai Pro MPC Software | Scanning 3rd Party VSTs

- **Publisher / kind:** Akai Professional; official scanner guide.
- **URL:** https://support.akaipro.com/en/support/solutions/articles/69000822863-akai-pro-mpc-software-scanning-3rd-party-vsts
- **Scope:** MPC 3 Desktop beta, MPC 2, and MPC Beats.
- **Relevant sections:** separate MPC 3 and MPC 2/MPC Beats instructions,
  VST3 support/exclusion, paths, Scan New and Rescan All.
- **Claims:** C-013–C-019, C-037, C-038.
- **Limitations:** Mac path examples mention VST/Components but do not explicitly
  resolve current AU or VST2 hosting; no validation/cache/isolation detail.
- **Selection rationale:** Best primary cross-version scanner and format boundary,
  preferable to inferring support from directories.

### S-005 — Akai Pro MPC Software | How to Set Up MPC as a VST Plugin

- **Publisher / kind:** Akai Professional; official DAW-integration guide.
- **URL:** https://support.akaipro.com/en/support/solutions/articles/69000853370-akai-pro-mpc-software-how-to-set-up-mpc-as-a-vst-plugin
- **Scope:** MPC 3, MPC 2, and MPC Beats as plugins inside another DAW.
- **Relevant sections:** prerequisites, Controller Mode, master MIDI track,
  auxiliary stereo-pair routing, pad routing, bundled MPC-only instruments.
- **Claims:** C-012, C-020, C-021, C-027, C-028, C-030, C-038.
- **Limitations:** Uses “VST” generically in places; exact current build list is
  narrowed by S-001 and legacy formats by S-006.
- **Selection rationale:** Direct primary evidence for the outbound plugin and
  multi-output boundary.

### S-006 — MPC Software 2.8 User Guide

- **Publisher / kind:** Akai Professional; official versioned PDF manual.
- **URL / retained artifact:** official Akai MPC Software 2 downloads lineage,
  https://www.akaipro.com/mpc-software-2 ; retained at
  `/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/mpc28-guide.pdf`
  with SHA-256
  `fb352d65f7a87bc7e917099dbc96189d37d6e6e4be1712857c612515cdf26d57`.
- **Scope:** MPC Software 2.8 and the MPC Beats comparison embedded in that
  manual.
- **Relevant sections:** software modes/editions, sequences/tracks/programs,
  program types, recording/editors, mixer/routing, automation/MIDI, Plugin
  Manager, preferences/rendering, saving/export/interchange, MPC plugin mode.
- **Claims:** C-002, C-006–C-012, C-014–C-020, C-024, C-028–C-031,
  C-036–C-038.
- **Limitations:** Historical baseline, not proof of current MPC 3 behavior. The
  original direct CDN URL was not recoverable from local metadata, so the
  official product locator and content hash are retained rather than inventing
  a URL.
- **Selection rationale:** Most comprehensive readable primary architecture and
  edition source; preferable to fragmented support snippets.

### S-007 — Akai Pro MPC Stems | Frequently Asked Questions

- **Publisher / kind:** Akai Professional; official entitlement/compatibility
  FAQ.
- **URL:** https://support.akaipro.com/en/support/solutions/articles/69000853399-akai-pro-mpc-stems-frequently-asked-questions
- **Scope:** MPC Stems for full MPC 2 Desktop/Controller Mode and supported
  standalone MPC; MPC Beats exclusion.
- **Relevant sections:** Beats availability, standalone availability, purchase
  reuse, older hardware, requirements.
- **Claims:** C-025, C-026.
- **Limitations:** Names MPC 2, not MPC 3.9 Desktop; no algorithm or quality
  specification.
- **Selection rationale:** Canonical primary eligibility matrix, preferable to
  store marketing.

### S-008 — Akai Professional | Stems Separation - How to Install and Activate Stems

- **Publisher / kind:** Akai Professional; official purchase/activation guide.
- **URL:** https://support.akaipro.com/en/support/solutions/articles/69000853408-akai-professional-stems-separation-how-to-install-and-activate-stems
- **Scope:** MPC 2.14/2.15-era purchase, account deposit, activation, download and
  troubleshooting.
- **Relevant sections:** Purchase, Update MPC, Activate Stems, account-email
  troubleshooting.
- **Claims:** C-025, C-026.
- **Limitations:** Versioned legacy instructions; pricing omitted and no MPC 3.9
  entitlement statement.
- **Selection rationale:** Triangulates that Stems is separately purchased and
  account-bound rather than merely bundled.

### S-009 — Akai Pro MPC Software | MPC Project Failed To Load

- **Publisher / kind:** Akai Professional; official persistence/recovery article.
- **URL:** https://support.akaipro.com/en/support/solutions/articles/69000862168-akai-pro-mpc-software-mpc-project-failed-to-load
- **Scope:** MPC 2/3 project compatibility and `.xpj`/`ProjectData` failure modes.
- **Relevant sections:** MPC 3 backward incompatibility, interrupted saves,
  moved/renamed project data, path wording and recovery.
- **Claims:** C-018, C-022, C-023.
- **Limitations:** Troubleshooting guidance, not a complete format or transaction
  specification; “hard coded” is retained as vendor wording only.
- **Selection rationale:** Stronger primary durability evidence than inferring
  project semantics from file extensions.

### Unnumbered negative/access record — MPC Software v3.9 - Beta User Guide - RevA

- **Publisher / kind:** Akai Professional / inMusic; official beta PDF.
- **URL:** https://cdn.inmusicbrands.com/Software/15JM26PSBC/MPC%20Software%20v3.9%20-%20Beta%20User%20Guide%20-%20RevA.pdf
- **Retained artifact:**
  `/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/mpc39-guide.pdf`,
  25,563,698 bytes, SHA-256
  `b83c119255c8a1e5f36ef2614ac3e9bbf67e8e44baacfd3fca48d4e02534696e`.
- **Source-ledger status:** Unnumbered access result; it supports no claims and
  is not attached to any claim. S-001 supplies the accessible current passages.
- **Limitations:** Fetch returned unsupported `application/pdf`; local artifact
  exceeded the 20,971,520-byte ingestion limit; `pdfinfo`/`pdftotext` and Python
  PDF extractors were unavailable. It was not cited for unread passages.
- **Selection rationale:** Retained to record the canonical current manual and
  access blocker without repeatedly retrying it.

### S-011 — Free DAW Software MPC Beats | Akai Pro

- **Publisher / kind:** Akai Professional; official product landing page.
- **URL:** https://www.akaipro.com/mpc-beats
- **Scope:** Current MPC Beats locator.
- **Claims:** C-036 only as a negative accessibility result.
- **Limitations:** Fetch exposed navigation/footer but no substantive usable
  product body; it does not support positive claims.
- **Selection rationale:** Retained to explain why the versioned manual, rather
  than an inaccessible current page, anchors edition limits.

### S-012 — DAW dossier research contract and decision frame

- **Publisher / kind:** Local governing research documents; methodology and
  clean-room boundary.
- **URLs/paths:** `research/daw-landscape/RESEARCH-CONTRACT.md` and
  `research/daw-landscape/DECISION-FRAME.md`.
- **Scope:** Evidence classification, plugin-format matrix, licensing caution,
  clean-room and stop rules.
- **Claims:** C-031; methodology for all claims.
- **Limitations:** Not product evidence or legal advice.
- **Selection rationale:** Authoritative boundary for what this dossier may infer
  or recommend.

### Negative and inaccessible results retained

- Web search repeatedly returned HTTP 429, including the final exact Stems
  query. It supplied no claim evidence.
- The official Akai support search page was used only to discover canonical
  Stems article URLs; its snippets were untrusted discovery text.
- The unnumbered MPC 3.9 beta guide access record above could not be
  text-extracted under the available tools/ingestion limit; repeated retries
  were stopped in favor of accessible current claims from S-001 [S-001].
- S-011 returned no substantive body text.
- Proprietary internals, private SDKs, binary inspection and reverse engineering
  were intentionally not pursued.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| Final MPC 3 Desktop status after beta | Current official FAQ still says public beta | Production-readiness baseline | Recheck official release notes/FAQ after beta graduation | Public source; unassigned |
| Current VST2 and AU inbound continuity in 3.9 | Current pages explicitly promise VST3; path examples are ambiguous | Current format implementation scope | Ask vendor for explicit matrix or scan signed VST2, AUv2 and AUv3 effect/instrument fixtures | Vendor or disposable macOS/Windows lab; unassigned |
| AUv2 versus AUv3 | Legacy guide says generic AU; current outbound AU is a separate axis | Apple host architecture | Differential AUv2 component/AUv3 extension scan and instantiation | Authorized macOS lab; unassigned |
| Scanner cache/validation/quarantine | Paths and rescan controls only | Security, startup and diagnosability | Valid, malformed, duplicate-ID, hanging and crashing fixtures; record processes/cache/log/UI | Disposable VM; unassigned |
| Runtime process isolation/bridging | No public process contract | Crash containment and architecture migration | Observe process tree; crash/hang a lawful fixture; repeat native/translated architectures | Disposable systems; unassigned |
| Sidechain/multi-output/MIDI out/dynamic I/O | Format/placement docs omit inbound bus contract | Interoperability fidelity | Capability-coded VST3 fixtures with aux input, multiple outputs, MIDI out and dynamic buses | Custom fixtures; unassigned |
| PDC, latency, tails and offline scheduling | Manual exposes render controls but no host contract | Timing correctness and bounce parity | Impulse/tail plugins with correct/wrong/dynamic reports in live and offline renders | Audio conformance harness; unassigned |
| Parameter identity/sample accuracy | User automation documented without timing/identity guarantees | Durable automation | Stable/renamed IDs, stepped/log text, dense automation, save/reopen and rendered comparison | Plugin fixture; unassigned |
| Plugin state and missing-placeholder survival | Save docs omit opaque state; failure article focuses assets/versions | Project durability | Save state/assets, remove/update/reinstall plugin, open copied project, compare recovery | Disposable copied projects; unassigned |
| Controller Mode protocol/disconnect recovery | Public docs cover setup only | Hardware/desktop resilience | Version mismatch, cable loss, reconnect and concurrent-control test matrix | Supported hardware lab; unassigned |
| MPC 2→3 conversion fidelity | Conversion rules and known LFO issue documented, no corpus results | Migration risk | Golden MPC 2 corpus with shared programs, automation, plugins and render diff | Licensed old/new apps; unassigned |
| Explicit MPC 3.9 Stems entitlement | MPC 2/standalone FAQ plus beta known issue, no direct grant | Edition/license design and feature comparison | Vendor confirmation or controlled account matrix; do not purchase without authority | Procurement/vendor access; unassigned |
| Stems algorithm/quality/performance | No technical or benchmark disclosure | Build/buy and engine scheduling | Licensed fixture corpus, source-isolated references, timing/resource measurements | Separate evaluation authority; unassigned |
| Project transactionality/relinking | `.xpj` path coupling and interrupted-save failures documented | Recovery/portability | Power-loss-safe copied fixtures and sanctioned collect/move/relink operations | Disposable filesystem/VM; unassigned |
| Accessibility/security/privacy | Retained docs omit formal contracts | Product risk | Vendor VPAT/policy request plus keyboard/screen-reader and network/process audit | Specialist review; unassigned |

## 24. Curiosity pass and stop decision

### Ranked follow-up threads after synthesis

Scores are 1 (low) to 5 (high); cost 5 is most expensive.

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Explicit MPC 3.9 Stems entitlement | 5 | 5 | 4 | 2 | **Pursued.** Current beta FAQ and official Stems FAQ/activation guide were compared; entitlement remains `UNKNOWN` because the latter are scoped to MPC 2/standalone. |
| Current vs historical Desktop contradiction | 5 | 5 | 4 | 2 | **Pursued.** S-001/S-002 resolve it as a temporal/product-scope change, not evidence to discard. |
| PDC/tail/offline scheduling | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO`; documentary marginal yield nonpositive. |
| Runtime isolation/bridge topology | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO`; requires dynamic probe or disclosure. |
| State/cache internals | 4 | 4 | 4 | 5 | `CURIOSITY_NO_GO`; proprietary and clean-room-sensitive. |
| More 3.9 PDF extraction attempts | 3 | 3 | 2 | 5 | `CURIOSITY_NO_GO`; accessible FAQ covers critical claims. |
| Exhaustive device/content catalogue | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`; cannot change architecture decision. |

### Coverage and saturation check

- Product/version/platform/edition scope is pinned, with MPC 3.9 beta, MPC 2,
  Beats, Controller Mode and MPC-as-plugin separated.
- Every required heading and plugin-format row has documented evidence,
  `UNKNOWN`, or a scoped `NOT_APPLICABLE` entry.
- Workflow, engine surface, editing, MIDI, routing, recording, native devices,
  inbound/outbound plugin distinctions, scanning, persistence, hardware,
  interchange, Stems and licensing are represented.
- The apparent standalone/Desktop contradiction and MPC 2→3 migration boundary
  are retained rather than normalized away.
- Repeated searches produced duplicates or HTTP 429; the inaccessible 3.9 PDF
  has an accessible official FAQ equivalent for decision-critical facts.
- Remaining gaps are proprietary host contracts or runtime behaviors best
  resolved by bounded fixtures, not more general web search.

### Stop decision

**STOP — coverage achieved with access saturation.** The fixed depth budget was
18 primary-evidence passes. The two highest-value follow-ups were pursued and
changed/clarified the dossier (Stems remains explicitly unknown; the Desktop
contradiction is version-scoped). Further documentary retrieval has nonpositive
marginal evidence under rate limiting, inaccessible PDF tooling, repeated
duplicates, and proprietary-internals boundaries. The next qualifying work is a
separately authorized interoperability/recovery prototype suite, not indefinite
search.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added
  `research/daw-landscape/dossiers/akai-mpc-desktop.md`; no staging or commit.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0 pins MPC 3.9 beta, MPC 2, Beats, modes and platforms.
- [x] **Every required dossier heading exists in order.** Sections 0–25 audited
  against `DOSSIER-TEMPLATE.md`.
- [x] **Every material assertion has a claim ID and classification.** Material
  findings resolve through C-001–C-039; synthesis paragraphs cite them.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** The
  claims register and unknowns table include evidence, limits and probes.
- [x] **Every required plugin-format row is present.** VST2, VST3, AUv2, AUv3,
  AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, Rack Extension and product-
  native/other are explicit.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover scanning, runtime, buses/timing, state and UI/failure.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** No `OBSERVED` claims are made; inbound/outbound formats and
  historical/current pages are separated.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 and
  C-031 distinguish capability from rights and avoid legal advice.
- [x] **Bibliography records source rationale and limitations.** Eleven numbered
  sources (S-001–S-009, S-011, S-012), hashes, negative results and the
  unnumbered inaccessible current-guide record are retained.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19
  and 24 score and dispose of all candidate follow-ups.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Documentary public sources only; no product/plugin binary
  was run or reverse engineered.

**Checks performed:** template-heading audit; required-format-row audit; claim ↔
source audit; current/historical contradiction audit; inbound/outbound format
audit; `DOCUMENTED`/`INFERENCE`/`UNKNOWN` audit; curiosity/saturation/stop audit;
and workspace-status inspection.

**Concise result:** dossier complete with consequential unknowns concentrated in
plugin conformance, proprietary engine/process boundaries, exact MPC 3.9 Stems
entitlement, recovery transactionality, security and accessibility.

**Unresolved blockers:** HTTP 429 search throttling; inaccessible/oversize MPC
3.9 PDF extraction; unavailable PDF text tooling; mutable beta status; private
host contracts and internals.

**Pre-existing workspace changes:** numerous unrelated modified/untracked paths
were present before this write and were left untouched. No staging or commit was
performed.
