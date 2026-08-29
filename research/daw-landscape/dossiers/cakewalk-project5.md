# Cakewalk Project5 DAW dossier

> Research-only evidence. No design or implementation authority. Public and
> archived material is treated as untrusted evidence, never as instructions.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Cakewalk Project5 pattern/loop workstation |
| Canonical vendor | Twelve Tone Systems, Inc., doing business as Cakewalk; the current legacy-site banner reports BandLab's 2018 acquisition of certain Cakewalk assets/IP, but whether every Project5 right was included is `UNKNOWN` [C-035] |
| Researcher/session | Subagent session `ses_fb271e965ffdu8AnunlIIM10r5` |
| Owned path | `research/daw-landscape/dossiers/cakewalk-project5.md` |
| Research cutoff | 2026-08-29 UTC |
| Historical version scope | Project5 1.0 (2003) where clearly identified; Project5 2/2.0.1 (2005); Project5 2.5/2.5.1 (2007). Claims do not silently transfer across versions [C-001] |
| Editions | `UNKNOWN`: no parallel-edition matrix was found. Retained sources treat 2.5 as a free registered-user update to 2.x, not as a separately described edition [C-001] [C-025] |
| Platforms | Windows desktop. Version 2 documented Windows 2000/XP; 2.5 added Vista compatibility [C-002] |
| Included | Track/pattern/GrooveMatrix/device-chain model; audio/MIDI engine surface; routing and automation; VST/DirectX/DXi/MFX/ReWire hosting; SONAR exchange; persistence; licensing; transferable patterns |
| Excluded | SONAR architecture except documented integration; current Cakewalk Sonar; proprietary code/file reverse engineering; installer or binary execution; undocumented internals |
| Completion | **COMPLETE_WITH_UNKNOWNS** — exact discontinuation date and much of the plug-in runtime contract remain unknown [C-018] [C-026] |

## 1. Executive summary

Project5 evolved from a Windows pattern workstation whose v1 did not record
digital audio into v2/v2.5, which combined audio/MIDI recording, a linear
Arrange pane, pattern editing, and the live GrooveMatrix. The architecture-
relevant distinction is not merely “clips”: audio loops and MIDI patterns could
occupy Matrix cells, launch singly or as grooves, use launch timing/one-shots,
and have the resulting performance captured into the Arrange pane [C-003]
[C-004] [C-039].

The second differentiator is the track-level **Device Chain**, a recallable
composite of instrument, effects, arpeggiator/MIDI processing, and mix settings.
It is useful precedent for a typed, dependency-aware composite preset, although
Project5's serialization and missing-device behavior are not public [C-006]
[C-020] [C-040].

Hosting was broad for its period but is poorly specified by modern standards.
Cakewalk documented VST/VSTi, DirectX/DXi, MFX, and ReWire host/client support.
The v1 product used FXpansion-derived VST-DX Adapter 4; v2.5 explicitly changed
to integrated VST hosting. The vendor did not identify the VST generation, and
scan isolation, crash containment, latency/tail reporting, state migration,
sidechains, dynamic I/O, and sample-accurate automation are `UNKNOWN` [C-015]
[C-016] [C-017] [C-018] [C-032].

Project5→SONAR exchange was pragmatic rather than a full project translator:
ReWire, rendered `.wav`, Project5 `.ptn` patterns, and MIDI-pattern reuse are
documented. Overall confidence is **high** for the visible workflow and v2.5 I/O
model, **medium** for v1 host behavior observed by a reputable reviewer, and
**low/unknown** for proprietary internals and exact discontinuation terms
[C-021] [C-036].

## 2. Product identity, history, and market position

Cakewalk described Project5 as a music-creation and performance workstation
centered on instruments, effects, recording, looping, sequencing, arranging,
and an open synth host. The official chronology says the original release was
March 2003; v2 shipped in 2005, 2.0.1 was released June 17, 2005, v2.5 was
available by the archived April 27, 2007 landing page, and a 2.5.1 updater was
captured in August 2007 [C-001].

The product was Windows-only in the evidenced releases: v2 listed Windows 2000
as minimum and XP as recommended, while v2.5 added Vista compatibility. No
macOS, Linux, mobile, or browser edition is evidenced [C-002].

The owned research boundary calls Project5 discontinued. External evidence
shows no maintained Project5 product page at the cutoff—the legacy Project5 URL
resolves to SONAR content—and no update later than 2.5.1 was located. This
supports the bounded **INFERENCE** that it is no longer maintained, but an
official end-of-sale/end-of-support notice and exact discontinuation date were
not found [C-026].

## 3. Workflow and conceptual model

Project5's user model joined four visible boundaries: tracks in an Arrange pane,
reusable audio/MIDI patterns, a Pattern Editor/Browser, and GrooveMatrix cells.
The Pattern Editor combined piano roll and step sequencer, while the Pattern
Browser previewed audio loops and MIDI patterns at project tempo before drag to
Arrange or Matrix [C-005].

GrooveMatrix cells accepted audio or MIDI patterns, launched as loops or
one-shots, individually or as vertical/cross-groove combinations. Launches
could be immediate or aligned to a measure/note duration, and the performance
could be recorded into Arrange. Thus Matrix and timeline were complementary
views over compositional material rather than isolated project modes [C-004]
[C-039].

Tracks presented instrument, effects, arpeggiator, routing/control settings,
and Device Chains in the Track Inspector. Key/velocity splits, layered synths,
and multiple-controller-to-instrument routing made the track both an
arrangement lane and performance voice boundary [C-006] [C-013].

## 4. Publicly documented architecture

Only a limited public architecture is documented. Cakewalk called the v2 engine
optimized for real-time/live use and said Matrix cells could be populated
without disrupting the audio engine. No public source specifies graph data
structures, scheduling, lock strategy, render threads, process boundaries, or
buffer ownership; those internals are `UNKNOWN` [C-007].

The most specific first-party disclosure concerns v2.5 audio I/O. Project5 used
one selected audio device, exposed all of that device's inputs/outputs, grouped
outputs as stereo pairs, created master buses for hardware output pairs, and
persisted/adapted routing when hardware changed [C-011] [C-022].

Cakewalk engineering also documented that ACT in Project5 reused SONAR's
control-surface framework, and that a multi-output synth track was exposed to a
surface as one strip per output. This documents a shared extension boundary,
not wholesale shared product architecture [C-024].

## 5. Audio engine

- **Device/driver boundary:** v2 documented WDM, ASIO, and DirectSound audio
  drivers. A v1 reviewer reported 11.025–96 kHz and 16/24-bit operation; these
  rate/depth observations must not be assumed unchanged in v2.5 [C-008].
- **Real-time path:** optimized live-performance behavior and non-disruptive
  Matrix population were vendor claims; buffer/block size, dropout policy, and
  scheduling are unknown [C-007].
- **Multiple I/O (v2.5):** all channels of one active device, track-selectable
  left/right/stereo inputs, and stereo-pair hardware outputs were documented
  [C-011].
- **Render/resource operations:** v2 documented Track Freeze; 2.0.1 added
  Bounce to Track. Exact offline-render equivalence, tail handling, and
  oversampling were not disclosed [C-009] [C-018].
- **Multiprocessing:** Cakewalk's development blog said multiprocessor support
  was not possible in the 2.5 update. Later implementation is not evidenced
  [C-010].
- **Delay compensation:** plug-in delay compensation, latency-reporting
  consumption, record-path compensation, and sample-accurate event scheduling
  remain `UNKNOWN` after product, update, microsite, blog, and review searches
  [C-018].

## 6. Tracks, timeline, clips, and editing

The Arrange pane held tracks and patterns on a musical timeline; multi-lane
tracks supported multitimbral instruments and more complex arrangements.
Audio loops could follow tempo and pitch, be stretched/pitch-shifted, and expose
per-slice pitch, pan, gain, and effect automation. v2 also documented Track
Freeze and in-track/in-pattern automation [C-005] [C-009].

The dual-mode Pattern Editor supported piano-roll and step views, step and
real-time recording, flam/legato/gating tools, and simultaneous note plus
track/effect/instrument automation display. Pattern history/branching,
comping/take lanes, ripple editing, grouping, and general-purpose undo storage
were not documented in the retained sources [C-005] [C-029].

## 7. MIDI, sequencing, notation, and expression

Project5 documented live and step MIDI recording, advanced MIDI editing,
per-track polyphonic arpeggiators, input quantize in 2.5, configurable MIDI
outputs, external MIDI tracks, channel-aftertouch automation in 2.0.1, MIDI
remote/learn, and save-pattern-as-MIDI [C-005] [C-013].

Project5 2.5's Matrix could launch MIDI patterns, and controller mappings could
address Matrix cells, synth layers/splits, tracks, and effects [C-004] [C-024].
Notation, MPE, per-note expression, MIDI 2.0, SysEx fidelity, MTC slave behavior,
and sample-accurate MIDI-to-plug-in delivery are `UNKNOWN`; absence from these
historical pages is not treated as proof of no support [C-018] [C-029].

## 8. Routing, mixer, automation, and control

Version 2.5 documented unlimited aux buses, pre/post sends, dynamic master
buses, a busable metronome, assignable master volume, automation lanes, and
multiple-output interfaces. Native multi-output instruments and track layers
could be addressed independently [C-011] [C-012] [C-014].

The detailed hardware rule was deliberately constrained: a master could target
one/no stereo output pair, and only one master could route to a given pair;
there was no separate hardware-output mixer. On load with fewer outputs,
unmappable masters were assigned `None`; with more outputs, the old ordinal
routes were retained and masters created for extra pairs [C-011] [C-022].

Cakewalk said mix, synth, and effect parameters were automatable and offered
MIDI learn. ACT/control-surface support in 2.5 mapped multi-output synth outputs
as separate strips. Parameter identity stability, write modes, automation
resolution, feedback routing, VCA/folder/surround concepts, OSC, and remote API
details are `UNKNOWN` [C-013] [C-024] [C-018].

## 9. Recording, comping, and media handling

Version 1 was reported not to record digital audio; v2 added integrated audio
recording/editing for vocals, guitars, and other sources. v2.5 added multiple
audio inputs and allowed selection of up to two external audio editors without
interrupting the documented workflow [C-003] [C-011] [C-023].

Audio-loop evidence covers ACID WAV, WAV, AIF/AIFF, tempo matching,
time-stretch/pitch-shift, slice editing, and ACID-loop export. The product also
listed Ogg Vorbis and several sampler formats for bundled devices [C-005]
[C-028]. Punch, loop-take management, comping, video, proxy/conform, metadata,
and missing-media relink rules are `UNKNOWN` [C-029].

## 10. Instruments, effects, content, and native devices

The documented v2 device set included Dimension, PSYN II, GrooveSynth, DS864,
Velocity, nPulse, Cyclone, a per-track arpeggiator, Alias Factor, and nine other
effects. Dimension included more than 3 GB of content; DS864 accepted several
sampler formats; Velocity and nPulse exposed multiple outputs [C-014] [C-028].

Device Chains were track presets combining instrument, effect, and mix settings;
the SONAR-integration page additionally named MIDI effects and arpeggiator
settings. Users could author and recall their own chains [C-006] [C-040]. The
binary preset format, asset path policy, version migration, missing-device
placeholder behavior, and whether every third-party state type was safely
captured are `UNKNOWN` [C-020].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

“VST” below preserves the vendor's generation-unspecified wording. The likely
VST2-era interpretation is an inference, not a claimed full VST2 contract
[C-032].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `NOT_APPLICABLE:no macOS product` | `UNKNOWN` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:desktop Windows product` | v1 reviewer and v2/v2.5 vendor pages say VST/VSTi; no generation number | Historically likely VST2; v1 used VST-DX Adapter 4 and v2.5 added integrated VST, but “VST2” itself and full contract are not directly documented | [C-015] [C-016] [C-017] [C-032]; S-003, S-009, S-010, S-015, S-019 |
| VST3 | `NOT_APPLICABLE:no macOS product` | `UNKNOWN` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:desktop Windows product` | No retained Project5 source names VST3 | Absence is not proof of rejection; no safe runtime probe was performed | [C-018] [C-033] |
| AUv2 | `NOT_APPLICABLE:no macOS product` | `NOT_APPLICABLE:Apple format/no macOS product` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:desktop Windows product` | Windows-only v2/v2.5 scope | No Project5 AU host evidence | [C-002] [C-033] |
| AUv3 | `NOT_APPLICABLE:no macOS product` | `NOT_APPLICABLE:Apple format/no macOS product` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile product` | Windows-only v2/v2.5 scope | No Project5 AUv3 host evidence | [C-002] [C-033] |
| AAX | `NOT_APPLICABLE:no macOS product` | `UNKNOWN` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:desktop Windows product` | No retained Project5 source names AAX | ReWire client use with Pro Tools is not AAX hosting | [C-018] [C-033] [C-034] |
| CLAP | `NOT_APPLICABLE:no macOS product` | `UNKNOWN` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:desktop Windows product` | No retained Project5 source names CLAP | No evidence; no maintained build was found to qualify | [C-018] [C-026] [C-033] |
| LV2 | `NOT_APPLICABLE:no macOS product` | `UNKNOWN` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:desktop Windows product` | No retained Project5 source names LV2 | No evidence | [C-018] [C-033] |
| LADSPA | `NOT_APPLICABLE:no macOS product` | `UNKNOWN` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:desktop Windows product` | No retained Project5 source names LADSPA | No evidence | [C-018] [C-033] |
| DSSI | `NOT_APPLICABLE:no macOS product` | `UNKNOWN` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:desktop Windows product` | No retained Project5 source names DSSI | No evidence | [C-018] [C-033] |
| JSFX | `NOT_APPLICABLE:no macOS product` | `UNKNOWN` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:desktop Windows product` | No retained Project5 source names JSFX | No evidence | [C-018] [C-033] |
| DirectX/DXi | `NOT_APPLICABLE:no macOS product` | `DOCUMENTED` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:desktop Windows product` | v1, v2, and v2.5 Windows; instruments/effects; MFX MIDI effects also named | Native documented Windows extension family; detailed runtime contract remains unknown | [C-015] [C-018]; S-003, S-015, S-019 |
| Rack Extension | `NOT_APPLICABLE:no macOS product` | `NOT_APPLICABLE:Reason-specific extension; Project5 used ReWire` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:desktop Windows product` | ReWire host/client documented, not Rack Extension | Do not conflate protocol integration with plug-in hosting | [C-034]; S-003, S-015 |
| Product-native/other | `NOT_APPLICABLE:no macOS product` | `DOCUMENTED` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:desktop Windows product` | v2/v2.5 MFX, ReWire host/client, bundled native devices, Device Chains | ReWire is inter-application integration; Device Chains are composite presets, not a third-party binary plug-in API | [C-006] [C-014] [C-015] [C-034]; S-003, S-005, S-018 |

### 11.2 Discovery, scanning, validation, and recovery

For **v1 only**, the *Sound On Sound* reviewer described VST-DX Adapter 4:
choose/scan a VST folder, register each compatible item so DX-based hosts can
see it, then optionally correct type/tempo behavior or UI size. The reviewer
said rerunning configuration sometimes recovered initial registration failure
[C-016].

Cakewalk's v2.5 announcement says integrated VST hosting removed the need for an
adapter, but it does not document discovery paths, cache format, duplicate
identity, blacklist/quarantine, rescan UX, validation subprocesses, or missing-
plug-in recovery. v1 scanner behavior must not be projected onto v2.5 [C-017]
[C-018].

### 11.3 Runtime isolation and compatibility

No retained source establishes whether VST, DX/DXi, or MFX instances ran in the
Project5 process, whether any scan/plug-in used a child process, or whether
there was crash containment, bitness bridging, code-signature checking,
sandboxing, or compatibility modes. All are `UNKNOWN`; no proprietary binary
was executed or inspected [C-018] [C-030].

### 11.4 Host/plugin processing contract

The documented minimum is instruments plus audio/MIDI effects, automation, and
some native multi-output instruments. ReWire could run Project5 as host or
client [C-014] [C-015] [C-034]. Third-party sidechains, arbitrary multi-bus
I/O, event buses, note expression, dynamic I/O, sample-accurate automation,
latency/tail reporting, bypass/suspend, and offline-render rules remain
`UNKNOWN` [C-018].

### 11.5 Parameters, automation, state, presets, and project recall

Cakewalk broadly documented automation for mix/synth/effect parameters and
MIDI learn; v2.5 added integrated automation lanes. Device Chains captured a
visible composite of device/mix settings, while projects persisted master
settings/effect chains and output routes [C-012] [C-020] [C-022]. Exact plug-in
parameter identifiers/ranges/text, state-chunk handling, preset migration,
asset references, missing-plug-in placeholders, and crash-safe state recovery
are `UNKNOWN` [C-018] [C-020].

### 11.6 UI, diagnostics, and failure modes

A v1 reviewer observed dockable/floating native windows and reported that the
adapter sometimes needed an explicit pixel size for changing VST interfaces.
The same review reported rare exit-time crashes and a DS864 automation/UI-
lifecycle defect; these are secondary v1 observations, not general v2.5
findings [C-019]. No retained source documents DPI scaling, headless operation,
plug-in crash diagnostics, safe mode, or automated recovery [C-018].

## 12. Extensibility and integration

Project5's evidenced extension surface comprised VST/VSTi, DirectX/DXi, MFX,
ReWire, external audio editors, MIDI/controller learn, and ACT/control surfaces
[C-015] [C-023] [C-024] [C-034]. The developer blog says ACT was layered over
SONAR's control-surface framework and that third-party controller vendors could
provide ACT-capable surface plug-ins [C-024].

No Project5-specific scripting language, general command API, device-authoring
SDK, network remote API, or versioned project API was found. The public SONAR
surface SDK reference in the blog does not prove a separately supported
Project5 SDK; this boundary remains `UNKNOWN` [C-029].

## 13. Project format, persistence, interoperability, and collaboration

The developer blog names `.p5p` projects and `.p5t` templates and explains that
pre-2.5 files held one master bus. Version 2.5 adapted those projects to current
hardware outputs and persisted master settings, effect chains, and routes
[C-022]. This is behavioral evidence, not a public file-format specification.

SONAR interchange used ReWire, `.wav`, `.ptn` Project5 patterns, and reusable
MIDI patterns. Version 2.5 also documented save-pattern-as-MIDI [C-021]. No
source documents direct `.p5p`→SONAR conversion, full plug-in/automation
translation, AAF/OMF/MusicXML/DAWproject, collaboration, version control,
autosave, crash recovery, or archive/collect dependency management [C-036]
[C-029].

## 14. Delivery, live, post-production, and specialized workflows

GrooveMatrix, MIDI remote control, synth layering/splits, one-shots, launch
timing, and recording jams to Arrange made live performance a first-class
workflow [C-004] [C-027] [C-039]. Project5 could export WAV/ACID loops; 2.5
listed track-at-once CD burning and Cakewalk Publisher [C-005] [C-023].

Loudness, DDP, video, ADR, surround/immersive, ADM, show control, batch export,
and professional post-production interchange are not established. A v1 review
explicitly observed a stereo master/no-surround setup, but that is not proof for
v2.5 [C-019] [C-029].

## 15. Performance, reliability, security, and accessibility

Version 2 was marketed as optimized for responsive real-time/live use; 2.0.1
reduced Dimension CPU load and improved memory sharing across instances.
Project5 2.5 did not implement the requested multiprocessor support [C-007]
[C-009] [C-010].

Only v1 secondary evidence covers failure behavior: rare crashes while exiting
and one native-instrument automation defect [C-019]. There is no documented
plug-in sandbox, crash guard, safe launch, quarantine, telemetry/privacy model,
signing policy, rollback mechanism, or security boundary [C-030].

The 2.5 updater included English, German, and French resources and changed
configuration/registry placement for Vista/XP user-account behavior [C-037].
Keyboard-only operation, screen-reader semantics, high-contrast support, and
other accessibility qualification are `UNKNOWN` [C-029].

## 16. Licensing, ecosystem, and implementation constraints

Project5 was proprietary commercial software; archived pages carry Twelve Tone
Systems copyright notices. Version 2.5 was free only to registered 2.x
customers, required installed 2.0/2.0.1 and a serial number, and required
registration for continued use by Internet or telephone [C-025]. The 2.5.1
updater likewise required 2.5 and form/email access [C-001] [C-025].

No retrieved license grants redistribution of Project5, its bundled content,
Device Chain/pattern assets, VST/DX SDK material, or trademarks. Naming VST,
DirectX, ReWire, or Cakewalk does not confer modern SDK or certification rights.
Current activation availability, license transfer, archival-installer access,
and the exact Project5 IP included in later corporate transactions are
`UNKNOWN` [C-025] [C-035]. This dossier is not legal advice.

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** Project5 joined pattern authoring, live launch, and linear capture
without making them separate products; Device Chains reduced setup cost; v2.5
defined deterministic hardware-I/O adaptation; and ReWire/WAV/PTN exchange gave
SONAR users several levels of integration [C-004] [C-006] [C-011] [C-021].

**Liabilities.** The host contract is documented mainly as format names, v1's
adapter required registration/tweaks, v2.5 lacked multiprocessing, licensing
depended on historical registration, and no modern isolation/recovery evidence
exists [C-016] [C-018] [C-010] [C-025]. These limitations concern suitability
as an architecture reference, not a retrospective product-quality verdict.

## 18. Transferable patterns

| Pattern | Problem | Minimal clean-room mechanism | Support | Prerequisites/tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Typed clip-launch cells with timeline capture | Improvise arrangements without abandoning editability | Cells reference audio or MIDI clips; launch singly/grouped with explicit quantization/one-shot mode; record launch events or resolved clips to timeline | [C-004] [C-039] | Shared transport/tempo and deterministic launch scheduler; requires clear conflict semantics | Medium: real-time correctness and overdub semantics | **CANDIDATE** [C-031] |
| Pattern-first plus linear views | Support fast motif construction and song-scale arrangement | Reusable pattern object appears in step/piano-roll editor, browser, Matrix, and timeline | [C-005] | Stable object identity and non-destructive references; UI complexity | Low/medium | **CANDIDATE** [C-031] |
| Composite track preset | Recall a playable sound, not just a plug-in preset | Versioned manifest references instrument, MIDI processors/arpeggiator, audio effects, routing/mix, mappings, and assets | [C-006] [C-040] | Dependency IDs, missing-device placeholders, safe state validation, migrations | High if third-party state is opaque | **CONDITIONAL** [C-031] |
| Port-adaptive project restore | Open projects on interfaces with different I/O counts | Persist logical ports; map known ordinals/identities; leave unresolved routes explicitly disconnected; offer remap report | [C-011] [C-022] | Stable logical IDs and user confirmation; ordinal-only mapping can misroute | Medium | **CANDIDATE** [C-031] |
| Multi-output device as multiple control strips | Make multitimbral/multi-out devices controllable | Present each output as an addressable strip while preserving parent device identity | [C-024] | Hierarchical parameter IDs and surface paging | Low/medium | **CANDIDATE** [C-031] |
| Tiered cross-DAW handoff | Exchange what the target can preserve | Offer live sync, rendered audio, and portable MIDI/pattern export as distinct fidelity tiers | [C-021] [C-036] | Explicit loss report and asset collection | Medium; avoid implying full conversion | **CONDITIONAL** [C-031] |
| Edit Matrix during playback | Keep live ideation uninterrupted | Transactionally publish cell/content edits at safe engine boundaries | [C-004] [C-007] | Real-time-safe immutable snapshots/commands require prototype evidence | High because Project5 internals are unknown | **CONDITIONAL** [C-031] |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Legacy VST-DX wrapper as a target architecture — rejected.** v1 evidence
  includes repeated registration and manual type/UI fixes; v2.5 itself moved to
  integrated hosting [C-016] [C-017]. Reopen only for historical migration, not
  a modern host core. `CURIOSITY_NO_GO`.
- **Opaque ordinal-only I/O remapping — rejected as-is.** Project5's fallback is
  useful precedent, but a new DAW should pair it with persistent port identity
  and a remap report to reduce silent misrouting [C-011] [C-031].
  `CURIOSITY_NO_GO`.
- **Full `.p5p` compatibility or format cloning — rejected.** No public format
  specification was found, Project5 is discontinued, and reverse engineering
  was outside the clean-room boundary [C-022] [C-026]. Reopen only with a
  licensed specification and concrete migration demand. `CURIOSITY_NO_GO`.
- **Copying Project5 UI, names, presets, or bundled content — rejected.** The
  transferable value is the abstract interaction pattern, not protected
  expression or assets [C-025]. `CURIOSITY_NO_GO`.
- **Installer/binary execution or decompilation — rejected.** Unsafe and outside
  this documentary wave; it would not grant redistribution or compatibility
  rights [C-025] [C-030]. `CURIOSITY_NO_GO`.
- **Exact discontinuation archaeology — stopped.** Official archive, product
  microsite, developer blog, live legacy routes, and bounded secondary searches
  did not yield an announcement; the exact date has low architecture decision
  value [C-026]. Reopen only for a licensing/procurement decision.
  `CURIOSITY_NO_GO`.
- **Inferring modern plug-in fidelity from “VST support” — rejected.** Format
  acceptance does not establish scan, instantiate, process, automate, restore,
  or recover behavior [C-018] [C-032]. `CURIOSITY_NO_GO`.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary test | Result |
| --- | --- | --- |
| H1: Matrix is only a launcher, separate from arrangement | Search official v2/v2.5 Matrix and SONAR-integration pages for capture behavior | **Falsified:** performances could be recorded into Arrange [C-004] |
| H2: Matrix is audio-only | Check cell types | **Falsified:** both audio clips/loops and MIDI patterns were documented [C-004] |
| H3: Device Chains are single-device presets | Check first-party definitions | **Falsified:** instrument, effects, mix, MIDI effect/arpeggiator context were combined [C-006] [C-040] |
| H4: all Project5 releases recorded audio | Compare v1 hands-on review with v2 vendor pages | **Falsified:** v1 did not; v2 did [C-003] |
| H5: Project5 always hosted VST natively | Compare v1 adapter report and v2.5 announcement | **Falsified:** v1 used VST-DX Adapter 4; v2.5 advertised integrated hosting without adapter [C-016] [C-017] |
| H6: “VST” proves VST2 and a complete host contract | Look for generation and contract details | **Not supported:** generation and most contract dimensions remain unknown [C-018] [C-032] |
| H7: SONAR integration means lossless project conversion | Inspect official exchange routes | **Falsified:** only ReWire, WAV, PTN, and MIDI-pattern routes were found [C-021] [C-036] |
| H8: v2.5 had multiprocessor support | Check developer discussion of requested features | **Falsified:** explicitly deferred [C-010] |
| H9: format accepted = scanned = instantiated = full contract | Separate evidence for each stage | **Only partial:** v1 scanning/registration and general device use are observed; full v2.5 fidelity is `UNKNOWN` [C-016] [C-018] |
| Later probe | In a licensed disposable Windows VM, with benign test VST/DX fixtures, record scan logs, process topology, I/O, automation, latency/state/UI/failure behavior | **Not run**; needs lawful installer/license and isolated harness [C-018] [C-030] |

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Original release was March 2003; v2/2.0.1 followed in 2005; v2.5 was downloadable by 2007-04-27; 2.5.1 updater existed by 2007-08-23 | Product chronology | S-008, S-009, S-010, S-011 | First-party releases/update pages | Exact original day and exact 2.5.1 release day not established by capture date |
| C-002 | DOCUMENTED | High | Evaluable releases were Windows desktop: v2 listed Windows 2000/XP; v2.5 added Vista | v2–2.5 | S-006, S-009, S-010 | First-party requirements/features | No later OS qualification; no proof about unofficial compatibility |
| C-003 | INFERENCE | High | v1 did not record digital audio; v2 documented integrated audio recording/editing | v1 versus v2 | S-001, S-002, S-019 | Version-scoped comparison of primary v2 pages with a secondary v1 hands-on report | v1 fact is not from a retained primary manual |
| C-004 | DOCUMENTED | High | GrooveMatrix held audio/MIDI cells, launched individual/grouped material, and recorded performances to Arrange | v2–2.5 | S-004, S-007, S-017 | Repeated first-party descriptions | Internal scheduling unknown |
| C-005 | DOCUMENTED | High | Pattern Editor combined piano roll/step sequencing; browser previewed tempo-synced audio/MIDI for Arrange/Matrix; loops had stretch/slice controls | v2 | S-002 | First-party feature detail | Exact edit model and file representation unknown |
| C-006 | DOCUMENTED | High | Device Chains were user-creatable track presets combining instrument, effects, and mix settings | v2–2.5 | S-007, S-018 | First-party definition | Binary schema and missing dependencies unknown |
| C-007 | DOCUMENTED | Medium | Cakewalk described a real-time/live-optimized engine and non-disruptive Matrix population; scheduling/threading internals are unknown | v2–2.5 | S-004, S-017 | Vendor capability statement only | Not independent real-time verification |
| C-008 | INFERENCE | Medium | v2 supported WDM/ASIO/DirectSound; a reviewer reported v1 at 11.025–96 kHz, 16/24-bit | v1–v2 | S-006, S-019 | Primary driver evidence combined with version-scoped secondary rate/depth evidence | v2.5 precision/rates unknown |
| C-009 | DOCUMENTED | High | v2 had Track Freeze; 2.0.1 added Bounce to Track and Dimension CPU/memory improvements | v2/2.0.1 | S-002, S-008 | First-party feature/release note | Render equivalence/tails unknown |
| C-010 | DOCUMENTED | High | Multiprocessor support was not implemented in the 2.5 update | v2.5 | S-014 | Cakewalk development blog | No claim about hypothetical later unreleased work |
| C-011 | DOCUMENTED | High | v2.5 used one active audio device, all its I/O, stereo output pairs, master-per-pair routing, and deterministic differing-hardware fallback | v2.5 | S-012 | First-party engineer explanation | Driver internals and device hot-swap unknown |
| C-012 | DOCUMENTED | High | v2.5 documented unlimited aux buses, pre/post sends, dynamic masters, integrated automation, and multiple-output interfaces | v2.5 | S-009, S-010, S-016 | Multiple first-party pages | Feedback/sidechain/PDC semantics unknown |
| C-013 | DOCUMENTED | High | MIDI capabilities included live/step record, arpeggiator, input quantize, external/configurable MIDI out, aftertouch automation, learn, layers/splits | v2–2.5 | S-002, S-004, S-008, S-009 | First-party features | SysEx, MPE, MIDI 2.0, timing precision unknown |
| C-014 | DOCUMENTED | High | v2 bundled named synths/samplers/drum instruments/effects; Velocity and nPulse exposed multiple outputs | v2 | S-005 | First-party inventory | Exact 2.5 bundle overlap uncertain |
| C-015 | DOCUMENTED | High | Project5 documented VST/VSTi, DirectX/DXi, MFX instruments/effects and ReWire host/client | v2–2.5 | S-003, S-015; triangulated by S-019 | Repeated vendor and reviewer evidence | Format name does not prove full contract |
| C-016 | INFERENCE | Medium | v1 used VST-DX Adapter 4 to scan a VST folder/register devices, with manual type/UI tweaks and occasional rescans | v1 | S-019 | Reputable contemporaneous hands-on report, not a probe performed for this dossier | Not primary; not valid for v2.5 integrated host |
| C-017 | DOCUMENTED | High | v2.5 added integrated VST hosting without need for adapter | v2.5 | S-009, S-010 | First-party announcement and availability page | Implementation/process details absent |
| C-018 | UNKNOWN | High confidence in gap | Scan cache/identity/quarantine, isolation/bridging/signing, full buses/events, PDC/tails, bypass/suspend, dynamic I/O, state migration, missing placeholders, headless/recovery are not established | All versions/plug-ins | S-001–S-021 search corpus | Manuals/readme inaccessible/not found; no binary probe | A licensed disposable dynamic test could discriminate many items |
| C-019 | INFERENCE | Medium | v1 had dock/floating windows; adapter UI-size tweaks; rare exit crashes and a DS864 automation/UI bug were reported | v1 | S-019 | Secondary hands-on review, not a probe performed for this dossier | Not generalized to v2/v2.5 |
| C-020 | DOCUMENTED | Medium | Device/project presets retained visible settings, but exact third-party state and missing-dependency handling are unknown | v2–2.5 | S-007, S-012, S-018 | First-party preset/persistence behavior | No serialized schema or recovery documentation |
| C-021 | DOCUMENTED | High | Project5 and SONAR exchanged via ReWire, WAV, PTN Project5 patterns, and MIDI-pattern reuse | Project5 v2 + SONAR 5 context | S-007 | First-party integration guide | No full-project conversion claim |
| C-022 | DOCUMENTED | High | `.p5p` projects/`.p5t` templates persisted routing; pre-2.5 files had one master and 2.5 adapted them to available outputs | ≤2.0.1→2.5 | S-012 | First-party engineer explanation | File bytes/schema, autosave/recovery unknown |
| C-023 | DOCUMENTED | High | v2.5 launched up to two external audio editors; delivery included WAV/ACID export, CD burning, and Publisher features | v2–2.5 | S-002, S-010, S-021 | First-party pages | External editor round-trip protocol and modern service availability unknown |
| C-024 | DOCUMENTED | High | v2.5 ACT reused SONAR control-surface framework; multi-out synth outputs appeared as separate strips | v2.5 | S-009, S-013 | First-party engineering disclosure | Does not establish a general Project5 SDK |
| C-025 | DOCUMENTED | High | Proprietary product; 2.5 required installed 2.x, serial and registration; current activation/transfer/redistribution rights unknown | v2.5/current implications | S-010, S-011, archived copyright notices | First-party availability/registration terms | Not legal advice; full EULA not retrieved |
| C-026 | INFERENCE | Medium | Product is no longer maintained by cutoff; exact discontinuation/end-of-sale/end-of-support date is unknown | Historical/current | S-011, S-020 plus negative searches | Last evidenced updater is 2007; live legacy route no longer serves product | Absence alone is not an official discontinuation notice |
| C-027 | DOCUMENTED | High | Live use included Matrix launch, MIDI remote, layers/splits, and capture to arrangement | v2–2.5 | S-004, S-007, S-017 | Repeated first-party evidence | Live reliability not independently measured |
| C-028 | DOCUMENTED | High | Product/devices accepted ACID WAV, AIF, WAV, Ogg Vorbis, SF2, SFZ, Akai S5000/6000, Kurzweil, LM4; 2.5 Dimension LE added REX | v2–2.5 | S-001, S-003, S-005, S-009 | First-party lists | Import fidelity and proprietary-format versions not specified |
| C-029 | UNKNOWN | High confidence in gap | Comping, notation, MPE/MIDI 2.0, video/post, surround v2.5, collaboration, accessibility, autosave/relink, general scripting/extension APIs, and advanced delivery were not established | All versions | S-001–S-021 search corpus | Bounded documentary searches | Absence from retained pages is not proof of no support |
| C-030 | UNKNOWN | High confidence in gap | Security boundaries, sandboxing, telemetry, signing, rollback, crash containment, and safe mode are undocumented | All versions | S-001–S-021 search corpus | No safe dynamic probe or source access | Later isolated qualification required |
| C-031 | INFERENCE | Medium-high | Matrix capture, composite presets, explicit unresolved I/O, output-strip projection, and tiered exchange are clean-room candidate patterns | New-DAW decision use | C-004, C-006, C-011, C-021, C-024 | Minimal mechanisms abstracted from documented behavior | Requires prototypes; do not copy expression/assets |
| C-032 | UNKNOWN | High confidence in gap | Vendor says “VST” but not generation; VST2 is historically likely, yet not directly documented as such | v1–2.5 | S-003, S-009, S-010, S-015, S-019 | Conservative format naming | Do not convert likelihood into documented compatibility |
| C-033 | UNKNOWN | High confidence in gap | No Project5 evidence was found for VST3, AU, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, or Rack Extension hosting | Windows product/all versions | S-001–S-021 search corpus | Matrix separately identifies OS/format non-applicability | No-support cannot be inferred solely from silence |
| C-034 | DOCUMENTED | High | Project5 acted as ReWire host and client, including use inside SONAR/other hosts | v2–2.5 | S-003, S-015 | First-party pages | ReWire is not an in-process plug-in format |
| C-035 | DOCUMENTED | Medium | Historical pages identify Twelve Tone Systems/Cakewalk; current banner reports BandLab acquired certain Cakewalk assets/IP in 2018, but Project5-specific title is not enumerated | Provenance | S-001–S-018, S-020 | Copyright/banner evidence | Do not infer exact present rights ownership |
| C-036 | INFERENCE | High | Retained evidence supports tiered SONAR handoff, not lossless Project5 project conversion | v2/SONAR 5 | S-007 | Explicit documented routes and no located full-conversion evidence | A route omitted from one page could exist; none was found |
| C-037 | DOCUMENTED | High | 2.5 updater included German, English, French and changed config/registry installation for Vista/XP user-account behavior | v2.5 | S-010 | First-party updater notes | Accessibility/localization completeness unknown |
| C-039 | DOCUMENTED | High | Matrix launches supported one-shot plus immediate/measure/note-length timing and cross-groove cell combinations | v2 | S-007 | First-party integration detail | Exact quantization algorithm unknown |
| C-040 | DOCUMENTED | High | Device Chains could include instrument, MIDI effects, arpeggiator, audio effects, and mix settings | v2 | S-007, S-018 | Two first-party descriptions | v2.5 field-by-field persistence unknown |

## 22. Source ledger and adaptive bibliography

All web material was accessed 2026-08-29. Internet Archive captures preserve
vendor documents but do not independently verify runtime behavior.

- **S-001 — “Project5 Version 2 — Features,” Cakewalk/Twelve Tone Systems.**
  Archived vendor product page, v2/pre-release 2005 scope.
  <https://web.archive.org/web/20050331010211id_/http://www.cakewalk.com/Products/Project5/features.asp>.
  Relevant passage: feature lists for GrooveMatrix, engine, patterns, VST/DX,
  ReWire, Device Chains, and sample formats. Supports C-001, C-003, C-015,
  C-028, C-035. Selected as broad first-party baseline; limited by marketing
  wording and no host-contract depth.
- **S-002 — “Powerful Sequencing and Recording,” Cakewalk.** Archived vendor
  v2 page.
  <https://web.archive.org/web/20050331022227id_/http://www.cakewalk.com/Products/Project5/sequence.asp>.
  Pattern Editor, loop editor/browser, multi-lane tracks, freeze, automation.
  Supports C-003, C-005, C-009, C-013, C-023. Preferred to screenshots because
  it states behavior; no storage/internal detail.
- **S-003 — “Open Host Environment,” Cakewalk.** Archived vendor v2 page.
  <https://web.archive.org/web/20050331013402id_/http://www.cakewalk.com/Products/Project5/open.asp>.
  Names DirectX/DXi/MFX/VST/VSTi, ReWire host/client, and sample formats.
  Supports C-015, C-028, C-032, C-034. Best primary format list; does not prove
  complete plug-in fidelity.
- **S-004 — “Dynamic Creation Tools,” Cakewalk.** Archived vendor v2 page.
  <https://web.archive.org/web/20050331004754id_/http://www.cakewalk.com/Products/Project5/dynamic.asp>.
  GrooveMatrix, Track Inspector, routing/layers, real-time engine, automation.
  Supports C-004, C-007, C-013, C-027. Selected for the object/control model;
  “optimized” is vendor characterization.
- **S-005 — “Inspiring Sounds,” Cakewalk.** Archived vendor v2 page.
  <https://web.archive.org/web/20050331011717id_/http://www.cakewalk.com/Products/Project5/inspire.asp>.
  Native-device inventory and multi-output details. Supports C-014, C-028.
  Preferred to third-party inventory; exact later bundle overlap is unclear.
- **S-006 — “System Requirements,” Cakewalk.** Archived vendor v2 page,
  2006 capture.
  <https://web.archive.org/web/20060414061017id_/http://www.cakewalk.com/Products/Project5/system.asp>.
  Windows 2000/XP and WDM/ASIO/DirectSound. Supports C-002, C-008. Strong OS
  scope; no v2.5 hardware matrix.
- **S-007 — “The Benefits of Using SONAR and Project5,” Cakewalk (2006).**
  <https://web.archive.org/web/20060513025532id_/http://www.cakewalk.com/Products/Project5/Project5inSONAR.asp>.
  ReWire/WAV/PTN/MIDI exchange, Device Chains, Matrix launch/capture/timing.
  Supports C-004, C-006, C-021, C-027, C-036, C-039, C-040. Selected as the
  only detailed first-party exchange guide; SONAR 5 context limits scope.
- **S-008 — “Cakewalk Announces Free 2.0.1 Update to Project5 Version 2,”
  Cakewalk, 2005-06-17.**
  <https://web.archive.org/web/20051201083512id_/http://www.cakewalk.com/Press/06-17-05-FreeProject5_2.0.1update.asp>.
  Bounce, automation tooltip, aftertouch, Dimension CPU/memory deltas. Supports
  C-001, C-009, C-013. Preferred to secondary release summaries.
- **S-009 — “Cakewalk Announces Feature Set for Free Project5 Version 2.5
  Update,” Cakewalk, 2007-01-18.**
  <https://web.archive.org/web/20070207120120id_/http://www.cakewalk.com/Press/01-18-07-Project525.asp>.
  Official planned feature set: integrated VST, I/O, sends, ACT, Vista, MIDI.
  Supports C-001, C-002, C-009–C-013, C-017, C-024, C-028. Announcement proves
  intent, not shipment; triangulated with S-010.
- **S-010 — “Project5 Version 2.5 Update,” Project5/Cakewalk.** Archived
  availability page, captured 2007-04-27.
  <https://web.archive.org/web/20070427034204id_/http://www.project5.com/25update/default.html>.
  Download availability, final feature list, install/serial/registration and
  language notes. Supports C-001, C-002, C-010, C-012, C-013, C-017, C-023,
  C-025, C-037. Preferred to announcement for shipped availability; exact
  release day is still not stated.
- **S-011 — “Project5 Version 2.5.1 Update,” Cakewalk.** Archived updater-access
  page captured 2007-08-23.
  <https://web.archive.org/web/20070823185914id_/http://www.cakewalk.com/Support/Project5/Patches/project5_251.asp>.
  Requires Project5 2.5 and email/form access. Supports C-001, C-025, C-026.
  Selected as last located official version evidence; no change list.
- **S-012 — “Project5 v2.5 Multiple I/O Support,” Cakewalk engineer Mike
  Boncaldo, 2007-01-31.**
  <https://cakewalkproject5.blogspot.com/2007/01/project5-v25-multiple-io-support.html>.
  Active-device, buses, persistence, changed-hardware and legacy-project rules.
  Supports C-011, C-020, C-022. Highest-value public engineering disclosure;
  first-party blog, not implementation source.
- **S-013 — “Project5 On The Surface,” Cakewalk Director of Engineering Bob
  Damiano, 2006-12-12.**
  <https://cakewalkproject5.blogspot.com/2006/12/project5-on-surface.html>.
  ACT/SONAR framework and multi-out strip mapping. Supports C-024. Selected for
  explicit provenance; does not imply all SONAR architecture was shared.
- **S-014 — “Most requested features,” Cakewalk Project5 development blog,
  2007-02-02.**
  <https://cakewalkproject5.blogspot.com/2007/02/most-requested-features.html>.
  States multiprocessor support was not possible for 2.5. Supports C-010.
  Selected as direct negative evidence; future-work language was not treated as
  delivery.
- **S-015 — “Expand your sounds,” Project5/Cakewalk v2.5 microsite.**
  <https://web.archive.org/web/20070626111904id_/http://www.project5.com/products/project5/expand.asp>.
  VST/DX instruments, ReWire host/client. Supports C-015, C-032, C-034.
  Triangulates the release announcement; still no format generation/contract.
- **S-016 — “Mixing in Project5,” Project5/Cakewalk v2.5 microsite.**
  <https://web.archive.org/web/20070626121751id_/http://www.project5.com/products/project5/mix.asp>.
  VST/DX effects, aux buses, pre/post sends, multi-output cards, automation.
  Supports C-012, C-015. Selected for shipped-product routing language.
- **S-017 — “Arranging in the GrooveMatrix,” Project5/Cakewalk v2.5
  microsite.**
  <https://web.archive.org/web/20070626112339id_/http://www.project5.com/products/project5/matrix.asp>.
  Cell types, grouped launch, Arrange capture, live use. Supports C-004, C-007,
  C-027. Preferred to screenshots; repeats rather than expands launch timing.
- **S-018 — “Device Chains,” Project5/Cakewalk v2.5 microsite.**
  <https://web.archive.org/web/20070701010627id_/http://www.project5.com/products/project5/devicechains.asp>.
  Defines user-created instrument/effect/mix track presets. Supports C-006,
  C-020, C-040. Best concise primary definition; no schema.
- **S-019 — “Cakewalk Project5,” Craig Anderton, Sound On Sound, June 2003.**
  <https://www.soundonsound.com/reviews/cakewalk-project5>.
  Reputable secondary hands-on v1 review covering rates, routing, UI, VST-DX
  Adapter scanning, stability, and no audio recording. Supports C-003, C-008,
  C-015, C-016, C-019, C-032. Selected because no readable v1 manual was found;
  observations must not be generalized to later versions.
- **S-020 — live legacy Cakewalk Project5 route / acquisition banner.**
  <https://legacy.cakewalk.com/Products/Project5>.
  At access it rendered SONAR content and a banner about BandLab's 2018
  acquisition of certain Cakewalk assets/IP. Supports C-026, C-035 only.
  Retained as access/provenance evidence; URL/content mismatch makes it unusable
  for Project5 features.
- **S-021 — “Third-party audio editors,” Project5/Cakewalk v2.5 microsite.**
  <https://web.archive.org/web/20070626121656id_/http://www.project5.com/products/project5/third.asp>.
  Up to two external editors. Supports C-023. Selected to disambiguate the
  misleading `third.asp` URL; it is not plug-in-hosting evidence.

**Negative/access results retained:** the target dossier did not previously
exist; an archived v2 support page returned HTTP 503 and was not repeatedly
retried; a candidate archived vendor URL returned “Page Not Found”; no readable
full Project5 manual/readme was located through Cakewalk/Project5 archive URL
inventories or Internet Archive text search; live Project5 legacy routes
redirected to SONAR content; web search providers returned repeated 429s; KVR
guessed product paths resolved to generic/rate-limited pages. None of these
negative results was treated as proof of unsupported behavior [C-018] [C-026].

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Impact | Safest next probe | Required access/fixture | Owner |
| --- | --- | --- | --- | --- | --- |
| Exact discontinuation/end-of-sale/support date | Official press/support/product archive, developer blog, microsite, live legacy route, bounded secondary search; no notice found | Licensing/procurement chronology, low architecture impact | Locate an authenticated archived Cakewalk notice or catalog; contact rights holder | Public notice or vendor response | Unassigned [C-026] |
| VST generation | All retained vendor pages say only “VST”; v1 secondary says VST-DX Adapter 4 | Format-migration planning | Obtain versioned manual/readme or lawful test fixtures | Readable manual or licensed v2.5 installation | Unassigned [C-032] |
| Scan/cache/blacklist/quarantine | v1 review covers folder scan/registration only; no v2.5 docs | Host robustness/security | Observe clean scan, duplicate/bad plug-in cases in disposable VM | Licensed v2.5, benign VST fixtures, process/log capture | Unassigned [C-018] |
| Isolation/bridging/signing | No public architecture evidence; binary inspection prohibited in this wave | Crash/security architecture | Process-tree and crash-fault test without reverse engineering | Disposable licensed Windows VM, signed/unsigned benign fixtures | Unassigned [C-018] [C-030] |
| Latency/tail/offline/bypass/dynamic-I/O contract | Marketing and review sources do not specify | Render correctness | Synthetic impulse/latency/tail and dynamic-bus fixtures | Licensed host and instrumented benign plug-ins | Unassigned [C-018] |
| Parameter/state/preset/missing plug-in behavior | Device Chains and projects are documented only at user-visible level | Project durability | Save/reopen controlled states, move assets, remove/replace plug-in | Licensed host, deterministic fixtures, checksums | Unassigned [C-018] [C-020] |
| Project `.p5p/.p5t/.ptn` schema and migration | Behavioral persistence documented; no public specification | Import feasibility | Seek licensed specification; otherwise use exported MIDI/audio rather than clone | Rights-holder documentation | Unassigned [C-022] [C-036] |
| Accessibility and advanced workflows | No versioned manual found; feature pages insufficient | Product-comparison completeness | Read accessible manual or run later UI accessibility qualification | Licensed VM/manual | Unassigned [C-029] |

## 24. Curiosity pass and stop decision

Scores are 0–3 (higher relevance/value/novelty; higher cost is worse).

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Official v2/v2.5 manual/readme | 3 | 3 | 3 | 2 | **Pursued** through archive inventories and text search; no readable full manual found; stopped after access saturation |
| Official v2.5 microsite architecture pages | 3 | 3 | 3 | 1 | **Pursued**; resolved I/O, Matrix, Device Chain, routing and integrated-VST boundaries |
| Official SONAR integration guide | 3 | 3 | 2 | 1 | **Pursued**; resolved ReWire/WAV/PTN/MIDI handoff and launch timing |
| Exact discontinuation notice | 2 | 2 | 1 | 2 | **Pursued once**, no qualifying notice; `CURIOSITY_NO_GO` for further archaeology unless licensing decision reopens it |
| More contemporary reviews/forums | 1 | 1 | 1 | 1 | `CURIOSITY_NO_GO`: primary evidence saturated; anecdotes unlikely to change architecture conclusions |
| Installer/binary/decompilation research | 2 | 1 | 2 | 3 | `CURIOSITY_NO_GO`: outside legal/safety and documentary scope |
| Reverse engineer `.p5p` | 1 | 1 | 2 | 3 | `CURIOSITY_NO_GO`: no current compatibility requirement or authority |
| Qualify every modern plug-in format | 1 | 0 | 0 | 3 | `CURIOSITY_NO_GO`: discontinued Windows build predates most formats; explicit unknowns are decision-sufficient |

**Stop decision:** **STOP — coverage achieved with explicit unknowns and source
saturation.** Every required section and format row is populated; primary
evidence covers the decision-relevant interaction and routing model; repeated
vendor pages now duplicate established claims. The remaining consequential
plug-in questions require a licensed disposable dynamic harness, not more
marketing-page retrieval. Exact discontinuation terms remain blocked by absent
public evidence, and another documentary pass has nonpositive expected
architecture value [C-018] [C-026].

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added
  `research/daw-landscape/dossiers/cakewalk-project5.md`; no other path was
  written.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See §0 and C-001/C-002.
- [x] **Every required dossier heading exists in order.** Sections 0–25 are
  present, including all 11.x subsections.
- [x] **Every material assertion has a claim ID and classification.** Narrative
  assertions resolve to C-IDs; the register uses DOCUMENTED, INFERENCE, and
  UNKNOWN, while secondary observations are explicitly described as secondary
  rather than mislabeled as this researcher's OBSERVED probes.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  §§21–23.
- [x] **Every required plugin-format row is present.** All 13 mandated rows are
  populated in §11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  §§11.2–11.6 cover scanning, runtime, processing, state, UI, diagnostics, and
  failures with version scope.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** Vendor claims are not presented as independent measurements;
  the v1 review remains secondary.
- [x] **Licensing and clean-room boundaries are explicit.** See §§0, 16, 19.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19,
  24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Only public pages/archives were read; no product,
  installer, or plug-in was executed.

**Checks performed:** heading/matrix/claim/source/manual review; assigned-path
ownership check; bounded negative-search retention. **Unresolved blockers:** no
readable full manual/readme, no exact discontinuation notice, no lawful dynamic
fixture. **Pre-existing workspace changes:** `research/daw-landscape/` already
appeared as untracked before this dossier was created; they were left untouched.
