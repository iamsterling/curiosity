# Cakewalk Sonar DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> search results, and linked manuals were treated as untrusted evidence, never
> instructions. No product, installer, project, or plug-in was executed.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | **Cakewalk Sonar**, the current product; Cakewalk by BandLab and Gibson-era SONAR are lineage/context only |
| Canonical vendor | Cakewalk / BandLab Technologies |
| Researcher/session | `ses_fb26ea3b4ffeqhLz2jF0qyO72d` |
| Owned path | `research/daw-landscape/dossiers/cakewalk-sonar.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current snapshot | Cakewalk Sonar **2025.11**, identified by the current update article as the latest version [C-001; S-004] |
| Editions / tiers | Free Tier and fully unlocked BandLab Membership Tier [C-003; S-001, S-013, S-014] |
| Platforms | Windows desktop; Windows 11+ supported, Windows 10 installable but unsupported; native ARM64 is listed [C-004, C-040; S-021] |
| Included | Current Sonar workflow, engine-visible features, VST hosting, routing/MIDI/automation/PDC, state/interchange, recovery, scripting, tiers and licensing |
| Excluded | Cakewalk Next except interchange; Cakewalk by BandLab and legacy SONAR except lineage/compatibility; proprietary internals; binary execution; decompilation; private SDKs |
| Evidence mode | Documentary only; no `OBSERVED` runtime claims |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

Product names are not interchangeable in this dossier. **SONAR** means the
discontinued pre-BandLab product family; **Cakewalk by BandLab (CbB)** means the
free 2018–2025 successor; **Cakewalk Sonar** means the current 2025.11 product
[C-002; S-005, S-012, S-013].

## 1. Executive summary

- **DOCUMENTED:** Current Cakewalk Sonar 2025.11 is a Windows-only, 64-bit,
  linear multitrack DAW descended from Cakewalk by BandLab and legacy SONAR. It
  combines unlimited audio/MIDI/instrument tracks, take lanes/comping, Arranger,
  Piano Roll/step sequencing, buses, ProChannel, ARA, AudioSnap, Mix Recall and
  batch/delivery workflows [C-001, C-002, C-005, C-010; S-001, S-004, S-013,
  S-014].
- **DOCUMENTED:** Current help explicitly identifies 64-bit VST2 and VST3 use.
  Sonar scans default/custom folders, can scan on startup or manually, and can
  rescan failed plug-ins. It provides per-plug-in DPI control, automation of
  plug-in controls, sidechain/PDC features, independent playback/render
  oversampling, missing-plug-in warnings, and per-plug-in project Safe Mode
  [C-017, C-018, C-021, C-023, C-034; S-007, S-008, S-010, S-011, S-012,
  S-016, S-018].
- **INFERENCE / UNKNOWN:** A current Sonar scanner article links a detailed CbB
  configuration manual that describes per-plug-in delay compensation,
  sidechain-input limits, MIDI I/O exposure, serialized host access, suspend
  options and optional jBridge. Continuity is plausible, but those details are
  not promoted to current-Sonar facts without corroboration [C-020; S-007,
  S-009].
- **UNKNOWN:** Scanner process isolation, runtime sandboxing, crash containment,
  cache/identity rules, quarantine, timeouts, architecture bridging, dynamic
  I/O, sample-accurate automation, parameter IDs, tail reporting, native project
  plug-in-state representation, MPE/MIDI 2.0, and all non-VST required formats
  remain undocumented for current Sonar [C-019, C-022, C-025, C-031, C-032;
  S-007, S-009, S-023, S-024].
- **DOCUMENTED:** Projects can be opened with missing plug-ins, and Shift-open
  Safe Mode prompts to load or skip each plug-in before the project is resaved.
  `.cwp`, `.bun`, and pre-SONAR `.wrk` are readable; `.cxf` preserves a defined
  cross-product subset including plug-in settings, while OMF is explicitly
  lossy [C-024, C-026, C-034; S-010, S-011, S-019].
- **DOCUMENTED:** Core operation is free. The fully unlocked tier is available
  only through BandLab Membership, not perpetual purchase; authorized Sonar can
  run offline. Oversampling, CakeScript, task queues and rollback are among
  Membership-gated capabilities [C-003, C-009, C-029, C-030, C-035; S-013,
  S-014, S-018, S-019, S-020, S-021, S-022].
- **Confidence:** High for product identity, tiers, Windows scope, VST2/VST3,
  scan controls, Safe Mode, visible routing/MIDI/automation, export and
  interchange. Medium for inherited CbB host details. Low for proprietary
  process boundaries and full host-contract fidelity.

## 2. Product identity, history, and market position

**DOCUMENTED.** Current help identifies 2025.11 as the latest Sonar version.
The product is positioned as a professional recording/production DAW carrying
forward SONAR Platinum's Skylight UI, ProChannel, ARA and 64-bit mix engine
[C-001, C-002; S-004, S-013].

**DOCUMENTED lineage.** In 2018 BandLab acquired specified Cakewalk assets/IP
and relaunched SONAR as the free Cakewalk by BandLab. Current Cakewalk states
that Sonar builds on CbB, that CbB is no longer actively developed and ceased
operation after 2025-08-01, and that current Sonar opens both CbB and legacy
SONAR projects [C-002; S-005, S-012, S-013]. Current Sonar and CbB install to
separate locations and can coexist [C-026; S-013].

**DOCUMENTED.** Free and Membership tiers target the same core recording,
editing, mixing and export workflow. Membership adds professional/content and
workflow capabilities rather than changing Sonar into a different product
[C-003; S-001, S-014]. No market-share or independent reliability claim was
investigated.

## 3. Workflow and conceptual model

**DOCUMENTED.** Sonar's primary model is a project with a linear timeline,
audio, MIDI and instrument tracks, nested folders, take lanes, automation
lanes, buses, Arranger tracks/sections, markers and a tempo map. Track and
Console views are complemented by Piano Roll, Step Sequencer, Synth Rack,
Browser and ProChannel surfaces [C-005, C-006, C-010, C-013; S-001, S-002,
S-012, S-014].

**INFERENCE.** Sonar is a track/bus DAW with an overlaying arrangement model,
not a scene-first clip launcher: Arranger sections reorder or render portions
of the same linear project. This interpretation follows the vendor's separate
timeline, take-lane and Arranger descriptions; it is not an internal object
model claim [C-005, C-010; S-001, S-019].

**DOCUMENTED.** Mix Recall stores alternate mix scenes, including level, pan,
mute/solo and plug-in states. Articulation Maps are project objects kept
separate from underlying MIDI until applied or converted for SMF export
[C-010, C-011; S-001, S-017].

## 4. Publicly documented architecture

**DOCUMENTED (public surface only).** Vendor pages expose a 64-bit mix engine,
plug-in load balancing, optimized high-core-count processing, dynamic MIDI
buffer behavior under heavy load, background-meter/load optimizations,
playback/render-specific oversampling, and a Lua-based CakeScript transaction
model [C-006, C-008, C-009, C-029; S-012, S-013, S-018, S-020].

**UNKNOWN.** The retained public sources do not disclose the internal graph
representation, real-time scheduler, worker topology, lock-free structures,
process boundaries, VST wrapper design, project schema, service boundaries or
scanner/runtime sandbox architecture [C-007, C-019, C-022]. Marketing terms
such as “optimized engine” are not independent architectural measurements.

## 5. Audio engine

**DOCUMENTED.** Current Sonar carries an end-to-end 64-bit mix engine, supports
ASIO-oriented Windows operation, provides plug-in load balancing in both tiers,
and exposes configurable PDC override modes for recording/playback plus latency
tooltips [C-004, C-008; S-012, S-013, S-014, S-021].

**DOCUMENTED.** Membership plug-in oversampling runs supported plug-ins at 2x
through 16x, independently for playback and offline render, including track,
bus and ProChannel FX chains. Cakewalk documents current oversampling as
phase-accurate across parallel paths and warns about increased CPU/dropout risk
[C-009; S-018]. Export provides explicit clip-tail padding so delay/reverb tails
are not truncated [C-039; S-019].

**INFERENCE.** The current-linked CbB manual says plug-ins report processing
delay and Cakewalk automatically compensates per plug-in. The current Sonar PDC
controls strongly suggest continuity, but exact graph coverage and update rules
remain unverified [C-020, C-021; S-009, S-012].

**UNKNOWN.** Supported project sample-rate range, internal buffer topology,
precise multicore policy, live/offline numerical equivalence, latency changes
during dynamic I/O, plug-in tail-query use, denormal policy, render determinism
and all PDC edge cases are not established [C-007, C-025].

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED.** Both tiers support unlimited audio, MIDI and instrument tracks,
advanced take lanes/comping, AudioSnap, VocalSync, automation, folders and the
linear Track view. Free is limited to one Arranger track; Membership has
unlimited Arranger tracks. Current Sonar adds nested folders, Track Manager,
large-project editing optimizations and GPU-assisted Piano Roll drawing
[C-005, C-006, C-010; S-001, S-012, S-014].

**DOCUMENTED.** CXF export preserves clip parameters but flattens overlapping
clips and take lanes, making its interchange boundary explicitly less expressive
than the native project [C-024, C-028; S-019]. AudioSnap covers transient-based
timing/tempo work; destructive-edit guarantees and persistent edit-history
serialization were not established [C-027].

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED.** Sonar exposes multi-track Piano Roll editing, inline expression
lines, velocity, Step Sequencer, MIDI tracks/instrument tracks, external MIDI
routing and articulation maps [C-005, C-011, C-013; S-001, S-015, S-017].
Articulations can generate or transform notes, CC, program change, velocity and
channel events; negative offsets compensate slow patches; `.artmap` and Cubase
`.expressionmap` import/export are supported [C-011; S-017].

**DOCUMENTED.** Articulations are non-destructive until applied and are
converted to ordinary MIDI events for Standard MIDI File export. SMF Format 0
and 1 are available, but export discards audio, articulation objects, offsets
and mute/solo state [C-011, C-028; S-017, S-019].

**UNKNOWN.** Current documentation retrieved did not establish MPE, MIDI 2.0,
UMP, per-note controllers, sample-accurate event scheduling, SysEx depth,
plug-in note expression or score/staff fidelity. A current help search returned
no MPE/MIDI 2.0 result; absence is not evidence of non-support [C-012; S-023].

## 8. Routing, mixer, automation, and control

**DOCUMENTED.** Audio and MIDI can route among tracks, buses, master/hardware
outputs, virtual instruments and external MIDI devices. Buses aggregate tracks
for shared processing; current Sonar also adds aux-folder routing, sidechain
management and source-track/destination-bus selection aids [C-013; S-002,
S-012, S-015].

**DOCUMENTED.** Track and bus FX chains, ProChannel chains, sidechains, Mix
Recall, external inserts and multichannel/surround export are visible product
boundaries [C-010, C-013, C-021, C-028; S-001, S-012, S-018, S-019]. Feedback
routing permissions and arbitrary graph-cycle behavior remain unknown.

**DOCUMENTED.** Automation lanes/envelopes support volume, pan and plug-in
controls, draw/node editing, curves and snapping. Current Sonar adds smoothing,
real-time recording improvements and offset modes [C-014; S-012, S-016].
Sample accuracy, stable parameter-ID mapping, gesture protocol and orphaned
automation recovery remain unknown [C-025].

**DOCUMENTED / UNKNOWN.** MIDI remote/control-surface functionality exists in
the inherited product surface, while CakeScript can manipulate projects but is
not a real-time controller protocol. No current public OSC API or stable
third-party controller-driver SDK was established [C-029; S-020].

## 9. Recording, comping, and media handling

**DOCUMENTED.** Sonar provides multitrack recording, input routing/monitoring,
unlimited tracks, take lanes, comping and audio/MIDI clip editing [C-005,
C-010, C-015; S-001, S-014, S-015]. AudioSnap and VocalSync address transient
timing, tempo and vocal alignment [C-015; S-001].

**DOCUMENTED.** Export supports WAV/BWF, MP3, FLAC, WMA, AIFF, DSD, CAF, OGG,
RF64/W64 and legacy/specialized SD2/AU/RAW forms, with entire-mix, track/folder,
bus/output and clip sources [C-028; S-019]. These are export claims, not a
complete import or project-media matrix.

**UNKNOWN.** Punch/loop edge semantics, native project asset relinking,
copy/collect behavior, proxy/conform workflows, metadata round-trip, video
codec support and recording recovery after device loss were not established
[C-027].

## 10. Instruments, effects, content, and native devices

**DOCUMENTED.** ProChannel is integrated on audio, instrument and bus strips and
hosts modular processing. Current Sonar includes XSampler and offers different
ProChannel modules, BandLab FX/instruments/chains, TH-U and Core Plugin Suite
access by tier [C-016; S-001, S-002, S-014].

**DOCUMENTED.** XSampler is a native sampler surface; BandLab Sounds integrates
loops/samples. Mix Recall, FX Chains and ProChannel FX Chains are native
containers rather than evidence of a public third-party native-device ABI
[C-010, C-016; S-001, S-002, S-018].

**UNKNOWN.** No public native-device authoring SDK, modular DSP graph ABI or
redistributable ProChannel extension contract was identified [C-031].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` means there is no current Sonar edition for that platform; it
does not claim the format is technically impossible. “No current affirmative
evidence” is `UNKNOWN`, not “unsupported” [C-031, C-040].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **NOT_APPLICABLE:** no current macOS Sonar | **DOCUMENTED:** 64-bit VST2 | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | Current Sonar help; explicit tier parity is **INFERENCE** from both-tier plug-in load balancing | Current UI labels VST2/VST3; 32-bit plug-ins are described as troublesome, not supported/bridged | C-017, C-020, C-040; S-008, S-010, S-014 |
| VST3 | **NOT_APPLICABLE:** no current macOS Sonar | **DOCUMENTED:** VST3, 64-bit host | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | Current 2025.11-era help; no tier exclusion documented | Effects/instruments; scan, DPI, automation and project recovery documented | C-017, C-018, C-023; S-006, S-007, S-008, S-010 |
| AUv2 | **NOT_APPLICABLE:** no current macOS Sonar | **NOT_APPLICABLE:** Apple Audio Unit format / Windows-only product scope | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | No in-scope edition | Do not infer AU hosting from exported `.au` audio files | C-031, C-040; S-019, S-021 |
| AUv3 | **NOT_APPLICABLE:** no current macOS Sonar | **NOT_APPLICABLE:** Apple Audio Unit format / Windows-only product scope | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | No in-scope edition | No host claim | C-031, C-040; S-021 |
| AAX | **NOT_APPLICABLE:** no current macOS Sonar | **UNKNOWN:** no current affirmative host evidence | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | Current help search found no relevant result | AAX host acceptance/instantiation not tested | C-031; S-024 |
| CLAP | **NOT_APPLICABLE:** no current macOS Sonar | **UNKNOWN:** no current affirmative host evidence | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | Current help search found no relevant result | Do not convert documentation silence into “unsupported” | C-031; S-024 |
| LV2 | **NOT_APPLICABLE:** no current macOS Sonar | **UNKNOWN:** no current affirmative host evidence | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | Current help search found no relevant result | No scan/instantiate evidence | C-031; S-024 |
| LADSPA | **NOT_APPLICABLE:** no current macOS Sonar | **UNKNOWN:** no current affirmative host evidence | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | No current evidence | No scan/instantiate evidence | C-031; S-024 |
| DSSI | **NOT_APPLICABLE:** no current macOS Sonar | **UNKNOWN:** no current affirmative host evidence | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | No current evidence | No scan/instantiate evidence | C-031; S-024 |
| JSFX | **NOT_APPLICABLE:** no current macOS Sonar | **UNKNOWN:** no current affirmative host evidence | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | No current evidence | No scan/instantiate evidence | C-031; S-024 |
| DirectX/DXi | **NOT_APPLICABLE:** no current macOS Sonar | **UNKNOWN:** no current Sonar acceptance/discovery/isolation evidence was found | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | Current help search produced no relevant result; product lineage is not format proof | DX registry discovery, bitness, instantiation, state and isolation all unresolved | C-032, C-033; S-005, S-024 |
| Rack Extension | **NOT_APPLICABLE:** no current macOS Sonar | **UNKNOWN:** no current affirmative host evidence | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | No current evidence | Product-specific third-party format not inferred | C-031; S-024 |
| Product-native/other | **NOT_APPLICABLE:** no current macOS Sonar | **DOCUMENTED:** ProChannel modules, FX Chains, XSampler, BandLab content/integrations | **NOT_APPLICABLE:** no current Linux Sonar | **NOT_APPLICABLE:** no current mobile/web Sonar | Free/Membership inventory differs | No public third-party native-device ABI established | C-016, C-031; S-001, S-002, S-014, S-018 |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED.** Current Sonar's VST scanner includes
`C:\Program Files\Cakewalk\VSTplugins` and
`C:\Program Files\Common Files\VST3` by default, accepts custom roots, scans at
startup unless configured otherwise, supports manual scanning, and can rescan
failed plug-ins [C-018; S-007]. The current-linked manual additionally describes
rescan-all, reset-to-folder-defaults and per-plug-in Plugin Manager properties;
current continuity for those extra controls is an inference [C-020; S-009].

**DOCUMENTED boundary.** “Failed” is a persisted user-visible scan category,
but the documentation does not explain validation stages, why a plug-in failed,
or whether a crash/hang is contained [C-018, C-019].

**UNKNOWN.** Scanner executable/process boundaries, timeouts, watchdogs,
signature checks, cache schema/invalidation, duplicate identity/version rules,
blacklist versus quarantine semantics, log provenance, atomic inventory updates
and DirectX/DXi discovery are not publicly specified for current Sonar
[C-019, C-032].

### 11.3 Runtime isolation and compatibility

**DOCUMENTED.** Current Sonar is 64-bit. Current support warns that old 32-bit
plug-ins can hang/crash during project load; current pages do not promise a
built-in bridge [C-017, C-034; S-010]. Per-plug-in DPI awareness can be toggled
for older/scaling-incompatible VST2/VST3 UIs [C-023; S-008].

**INFERENCE.** The current-linked CbB manual exposes optional “Load using
jBridge wrapper” and a “Serialize Host Access” compatibility switch for
thread-unsafe plug-ins. This is useful lineage evidence, not proof that current
Sonar ships/supports jBridge or uses the same host-call policy [C-020; S-009].

**UNKNOWN.** VST instances may be in-process or out-of-process; no retained
current source establishes per-plug-in/shared sandboxing, memory isolation,
crash containment, native/translated architecture bridging, broker restart,
code-signing policy or least-privilege behavior [C-022]. Project Safe Mode
skips instantiation; it is not runtime isolation [C-034; S-011].

### 11.4 Host/plugin processing contract

**DOCUMENTED.** Current Sonar hosts VST instruments and audio effects, routes
MIDI to virtual instruments, automates plug-in controls, exposes sidechain
routing improvements, provides load balancing, PDC controls, and supports
per-plug-in playback/render oversampling in FX-chain containers [C-008, C-009,
C-013, C-014, C-021; S-007, S-012, S-015, S-016, S-018].

**INFERENCE.** The current-linked CbB manual describes configurable sidechain
input exposure, explicit plug-in MIDI input/output ports, automatic per-plug-in
delay compensation, suspend-on-stop/play and asynchronous versus serialized
host access. These likely represent inherited mechanisms, but exact current
semantics require a fixture [C-020; S-009].

**UNKNOWN.** Maximum/dynamic bus counts, speaker layouts, VST3 bus activation,
multi-output remapping, sample-accurate events/automation, MPE/MIDI 2.0/note
expression, latency-change propagation, tail queries, bypass/suspend equivalence,
offline call sequence and render determinism are not established [C-012,
C-021, C-025].

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED.** Plug-in controls can be selected for Sonar automation lanes;
Mix Recall can preserve plug-in states in alternate mix scenes. CXF interchange
preserves plug-in settings among its documented subset [C-010, C-014, C-024;
S-001, S-016, S-019]. Current-linked CbB documentation exposes VST preset and
per-plug-in property controls [C-020; S-009].

**DOCUMENTED.** If a saved plug-in is absent, Sonar warns but should open the
project; Safe Mode can skip selected instances and let the user remove/replace
them before resaving [C-034; S-010, S-011].

**UNKNOWN.** Native `.cwp` plug-in-state representation, opaque chunks versus
parameter replay, stable parameter IDs/ranges/text, preset search and migration,
external asset references, missing-plug-in placeholder fidelity, state retention
while skipped, format substitution and upgrade/downgrade behavior are not
documented [C-025]. CXF preserving “plugin settings” does not answer these
native-project questions [C-024].

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED.** VST2/VST3 windows have a host toolbar with per-plug-in DPI
awareness. Scanner UI exposes failed rescans. Missing plug-ins generate a
warning, and Safe Mode prompts load/skip per instance for project recovery
[C-018, C-023, C-034; S-007, S-008, S-010, S-011].

**DOCUMENTED.** Sonar's rollback facility can return subscribers to an earlier
eligible build when a newer release disrupts a hardware/plug-in workflow
[C-030; S-022].

**UNKNOWN.** Generic/headless editors, UI-thread rules, keyboard/focus
forwarding, multiple editors, accessibility propagation into plug-ins, crash UI,
scanner logs, minidump correlation and automatic plug-in disable/restart are not
established [C-019, C-022, C-036].

## 12. Extensibility and integration

**DOCUMENTED.** Membership includes CakeScript, a Lua-based scripting interface
that replaces CAL. It can open/save/close projects and manipulate tracks,
folders, buses, audio/MIDI clips, imported media and sends. A successful script
is one undo step; an error restores the prior project state [C-029; S-020].

**DOCUMENTED limitation.** CakeScript cannot run during playback/recording and
currently lacks or only partly supports take/automation lanes, tempo/maps,
meter/key, markers, Arranger and FX Chains [C-029; S-020]. This is not a real-time
DSP or plug-in SDK.

**DOCUMENTED.** Other integration boundaries are ARA, BandLab projects/sounds,
CXF exchange with Cakewalk Next, OMF, SMF and articulation-map import/export
[C-011, C-024, C-028; S-001, S-017, S-019]. No public native-device SDK, OSC
API or versioned controller scripting API was established [C-031].

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED.** Current Sonar opens Cakewalk `.cwp`, bundle `.bun`, and
pre-SONAR `.wrk`. Sonar opens CbB and legacy SONAR projects; CbB can open Sonar
projects but cannot provide Sonar-exclusive capabilities [C-002, C-026;
S-010, S-013]. Current Sonar and CbB may coexist [C-026; S-013].

**DOCUMENTED.** New Sonar surfaces include `.cxf` for Cakewalk cross-platform
exchange and `.cwz` as a recommended backup format. CXF preserves audio/MIDI
tracks, automation, routing, clip parameters and plug-in settings but flattens
overlaps/take lanes. OMF preserves a different, explicitly lossy subset and
discards volume, pan, automation and plug-in effects [C-024, C-026, C-028;
S-012, S-019].

**DOCUMENTED recovery.** Missing plug-ins are warned; per-instance Safe Mode
can recover a loadable project by skipping plug-ins. Configuration files can be
regenerated for driver/startup issues, and Membership rollback provides an
application-version fallback [C-030, C-034; S-010, S-011, S-022].

**UNKNOWN.** Autosave cadence, generation retention, crash-recovery files,
native schema/versioning, transactional save, checksums, media collect/relink,
undo-history persistence, skipped-plug-in state retention, concurrent/cloud
editing, merges and source-control suitability were not documented in the
retained current sources [C-025, C-027; S-025].

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED.** Delivery includes entire mix, tracks/folders, buses/hardware
outputs, clips, Mix Recall scenes, arrangements/sections, batch task queues,
filename tokens, dither options, multichannel surround PCM/WMA, BWF metadata,
SMF, OMF, CXF and CD preparation [C-028; S-019]. Membership is required for
task queues [C-003, C-028; S-019].

**DOCUMENTED.** OMF is a post-production handoff with explicit losses; no AAF,
ADM/BWF, Dolby Atmos renderer integration, DDP, ADR system or show-control
contract was established. ARA, AudioSnap, VocalSync and articulation maps are
the main specialized workflows evidenced here [C-011, C-015, C-028].

**UNKNOWN.** Live-performance scene launching, deterministic redundant playback,
video codec/timecode depth, loudness conformance and immersive object/bed
authoring remain outside the retained evidence.

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED.** The current platform baseline is Windows 11+, 8-core/native
ARM64, 16 GB RAM and ASIO-compatible hardware; Windows 10 can install but is not
supported [C-004, C-040; S-021]. Current pages describe high-core/plugin-load
optimizations, dynamic MIDI buffering, load balancing, scalable UI and
per-plug-in DPI compatibility [C-006, C-008, C-023; S-001, S-008, S-012].

**DOCUMENTED reliability surfaces.** Scanner failed-rescan, missing-plug-in
warnings, project Safe Mode, configuration regeneration, script rollback and
eligible-build rollback are explicit recovery mechanisms [C-018, C-029, C-030,
C-034; S-007, S-010, S-011, S-020, S-022]. They do not prove automatic runtime
crash containment [C-022].

**UNKNOWN.** Maximum project scaling, reproducible performance, scanner/plugin
sandbox security, code-signature enforcement, plug-in filesystem/network
permissions, update signature/rollback integrity, telemetry/privacy behavior,
screen-reader coverage, keyboard-only completeness, localization and third-party
UI accessibility were not established [C-022, C-036].

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED.** Core Sonar use is free with a BandLab account. Fully unlocked
Sonar is currently exclusive to BandLab Membership rather than perpetual
purchase. Product Center and BandLab sign-in install/activate Membership
features; once authorized, Sonar can operate offline [C-003, C-035; S-003,
S-013, S-014, S-021].

**DOCUMENTED.** Membership gates plug-in oversampling, CakeScript, task queues,
rollback and selected content/workflow features. Rollback is limited to builds
released during the subscriber's active period [C-009, C-029, C-030; S-018,
S-019, S-020, S-022]. Authorization-renewal cadence, device count, transfer,
grace period, subscription-expiry project behavior and institutional terms are
**UNKNOWN** [C-035].

**INFERENCE / clean-room boundary.** Sonar's documented VST2/VST3 hosting grants
no VST SDK, trademark, redistribution, signing, compatibility or certification
rights to another DAW. The governing decision frame flags discontinued VST2 as
a special licensing risk; current VST3 terms require independent format-owner
review. No legal opinion is offered [C-037].

**UNKNOWN.** Sonar's proprietary source, host adapters, tests, licensing
agreements and private SDKs are outside this clean-room study [C-007, C-037].

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED:** Deep linear editing, MIDI, comping, buses, ProChannel,
  automation and delivery remain available in the free core [C-003, C-005,
  C-010, C-014, C-028].
- **DOCUMENTED:** VST recovery is unusually user-visible: failed rescan,
  missing-plug-in warning, per-instance Safe Mode and application rollback
  provide several escalation points [C-018, C-030, C-034].
- **DOCUMENTED:** Host-visible PDC override, sidechain management, load
  balancing, playback/render-specific oversampling and phase-aligned parallel
  processing acknowledge real interoperability edge cases [C-008, C-009,
  C-021].
- **DOCUMENTED:** CXF and OMF state their preservation/loss boundaries rather
  than implying lossless universal interchange [C-024, C-028].
- **DOCUMENTED:** CakeScript uses atomic undo/error rollback and blocks execution
  in real-time transport states [C-029].

### Liabilities / risks

- **UNKNOWN:** Scan/runtime isolation, cache identity, quarantine and crash
  containment are not specified, leaving the security/reliability boundary
  unclear [C-019, C-022].
- **UNKNOWN:** Current DirectX/DXi status and all alternate required formats are
  unresolved; historic Cakewalk lineage must not substitute for current support
  evidence [C-031, C-032, C-033].
- **UNKNOWN:** Deep VST state, parameter identity, dynamic buses, MIDI 2/MPE and
  sample-accurate timing need controlled fixtures [C-012, C-025].
- **DOCUMENTED / risk:** Fully unlocked features and build rollback depend on an
  active subscription; entitlement-expiry behavior remains unclear [C-003,
  C-030, C-035].
- **DOCUMENTED provenance risk:** Current help links stale/misbranded CbB
  documentation and a CbB release-notes document, so source scope must be
  checked claim by claim [C-033, C-038; S-005, S-009, S-026].

The architecture lesson is to copy neither Sonar expression nor proprietary
mechanisms, but to preserve explicit compatibility controls, recoverability and
honest interchange-loss boundaries in a clean-room design.

## 18. Transferable patterns

| Pattern | Problem | Minimal clean-room mechanism | Support | Prerequisites / tradeoffs / risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Per-instance project Safe Mode | One bad plug-in can make a project unloadable | On open, enumerate dependencies and allow load/skip per instance; retain enough metadata to remove/replace and resave | C-034 | Must preserve opaque state without executing it; malicious state still requires parser hardening | **CANDIDATE** |
| Scanner failure as explicit state | Silent discovery failure is undiagnosable | Persist outcome/reason per candidate; expose failed-only/all rescan and provenance | C-018, C-019 | Sonar does not document reason codes, timeout or quarantine; a new design must | **CONDITIONAL** |
| Per-plug-in compatibility properties | Hosts need bounded workarounds for broken plug-ins | Versioned overrides for UI scaling, threading serialization, I/O exposure, suspend and latency behavior | C-020, C-023 | Overrides can ossify quirks and complicate support; current applicability of inherited controls must be tested | **CONDITIONAL** |
| Separate playback/render quality policy | Real-time CPU and offline quality have different budgets | Store per-instance playback/render oversampling policies with a project-wide bypass | C-009 | Requires phase-correct resampling, latency integration and deterministic recall | **CANDIDATE** |
| Declared interchange loss profile | “Export project” can imply false fidelity | Publish a typed capability manifest and explicit flatten/drop rules per target | C-024, C-028 | Needs stable identity mapping, asset policy and validation | **CANDIDATE** |
| Transactional scripting | Automation can corrupt user projects | Queue non-real-time mutations, commit as one undo unit, roll back on error | C-029 | Requires deterministic API/versioning and clear unavailable real-time operations | **CANDIDATE** |
| Tier-independent project readability | Commercial gating should not strand core work | Keep record/edit/save/export and project opening in a durable free reader/editor tier | C-003, C-014 | Subscription-only devices/features need predictable degradation and frozen-state policy | **CONDITIONAL** |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** Treating “VST3 support” as proof of complete VST3 fidelity. Bus,
  state, timing, isolation and recovery contracts remain only partly documented
  [C-006, C-021, C-025].
- **REJECTED:** Treating Safe Mode as sandboxing. It prevents selected
  instantiation during project load; it does not isolate a running plug-in
  [C-022, C-034].
- **REJECTED:** Promoting CbB manual details to current Sonar facts solely
  because current help links the manual [C-020, C-033].
- **REJECTED:** Inferring current DirectX/DXi support from the Cakewalk/SONAR
  family name or Windows platform [C-032].
- **REJECTED:** Treating CXF/OMF as lossless interchange. Their documented
  flatten/drop rules contradict that claim [C-024, C-028].
- **REJECTED:** Treating free core access as a perpetual license for fully
  unlocked features [C-003, C-035].
- **CURIOSITY_NO_GO:** Convert/download the unreadable reference-guide PDF after
  the fetcher rejected `application/pdf` — equivalent current help articles
  were accessible; extra parsing risk/cost had lower marginal value.
- **CURIOSITY_NO_GO:** Reverse-engineer the empty client changelog endpoint —
  low evidence value and outside clean documentary needs.
- **CURIOSITY_NO_GO:** Execute installers or probe product binaries for version,
  registry or process information — expressly outside this wave and unnecessary
  for current documentary coverage.
- **CURIOSITY_NO_GO:** Rely on community reports of individual plug-in failures
  — useful for fixture selection, not proof of host internals.
- **CURIOSITY_NO_GO:** Expand Gibson-era SONAR edition history — unlikely to
  change current architecture conclusions; reopen only for a migration defect.
- **CURIOSITY_NO_GO:** Continue broad searches for every absent format — current
  help returned no relevant results and another broad pass would not prove
  non-support.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / adversarial check | Documentary result | Status / later discriminating probe |
| --- | --- | --- |
| H1: Current Sonar is merely a rename of Cakewalk by BandLab | Current sources identify ongoing Sonar-only engine/UI/project/plugin changes and inactive CbB | **REFUTED** [C-002, C-006; S-012, S-013] |
| H2: Current Sonar supports only VST3 | Current DPI and project-recovery pages explicitly name VST2 and VST3 | **REFUTED** [C-017; S-008, S-010] |
| H3: A scanned VST necessarily instantiates and fulfills the host contract | Failed scan state, project hangs/crashes and Safe Mode exist; deep buses/state/timing remain unknown | **REFUTED as blanket claim** [C-018, C-021, C-025, C-034] |
| H4: Windows platform and SONAR lineage alone prove current DirectX/DXi support | No current affirmative evidence was retrieved | **REFUTED as an inference rule; current support UNKNOWN** [C-032; S-024] |
| H5: The VST scanner runs in a crash-contained process | No current process-boundary evidence | **UNKNOWN** [C-019]; crash/hang a lawful scanner fixture in a disposable VM |
| H6: Running VST instances are sandboxed | Safe Mode is load-time skipping, not runtime containment | **UNKNOWN** [C-022, C-034]; inspect process tree and controlled crash propagation |
| H7: Current Sonar bridges 32-bit VSTs | Current support warns 32-bit plug-ins are troublesome; jBridge appears only in current-linked CbB docs | **UNKNOWN / no current promise** [C-017, C-020] |
| H8: Plugin automation is sample-accurate and stable across upgrades | Automation is documented, but precision/ID migration is not | **UNKNOWN** [C-014, C-025] |
| H9: PDC is complete for every route/live/offline case | Current PDC controls and oversampling alignment exist, but graph coverage/dynamic latency are unspecified | **PARTIAL / unresolved** [C-008, C-009, C-021] |
| H10: Native project saves retain skipped/missing plug-in state losslessly | Warning/Safe Mode are documented, native state representation/retention is not | **UNKNOWN** [C-025, C-034] |
| H11: CXF is lossless | Overlaps/take lanes flatten; OMF loses automation/effects | **REFUTED** [C-024, C-028] |
| H12: Membership is required to save/export | Free tier explicitly records, edits, mixes, saves and exports | **REFUTED** [C-003; S-014] |

**Accepted → scanned → instantiated → full contract:**

1. **Format accepted:** current evidence explicitly names 64-bit VST2/VST3
   [C-017].
2. **Discovered/scanned:** default/custom roots, startup/manual scan and failed
   rescan are documented [C-018].
3. **Instantiated:** current pages describe VST instruments/effects, routing,
   automation, sidechains, oversampling and project loading [C-021].
4. **Full contract:** not established; isolation, dynamic I/O, MIDI 2/MPE,
   exact latency/tails, sample accuracy, state and migration remain unknown
   [C-012, C-019, C-022, C-025].

No safe runtime probe was performed, so there are no `OBSERVED` claims.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current update help identifies 2025.11 as the latest Sonar version | Current snapshot | S-004 | Direct current-help statement | Exact build number/current changelog inaccessible |
| C-002 | DOCUMENTED | High | Current Sonar descends from CbB/legacy SONAR; CbB is inactive and ceased after 2025-08-01 | Product lineage | S-005, S-012, S-013 | Direct vendor history/FAQ | S-005 is legacy-hosted and separately warns of stale content |
| C-003 | DOCUMENTED | High | Core Sonar is free; fully unlocked Sonar is Membership-only, not perpetual purchase | Current tiers | S-001, S-013, S-014 | Direct current comparison/FAQ | Prices, expiry behavior and terms may change |
| C-004 | DOCUMENTED | High | Current Sonar is Windows desktop; Windows 11+ is supported and authorized use can be offline | Platform | S-001, S-021 | Direct specs | Windows 10 installs but is unsupported |
| C-005 | DOCUMENTED | High | Sonar is a linear multitrack DAW with unlimited audio/MIDI/instrument tracks, comping, Arranger and MIDI editors | Workflow | S-001, S-014 | Direct product/tier tables | Internal object model not disclosed |
| C-006 | DOCUMENTED | High | Current Sonar adds engine/UI/editor, CakeScript, nested-folder, aux-folder and sampler capabilities beyond CbB | Current differentiators | S-002, S-012 | Direct current features | Marketing does not prove performance magnitude |
| C-007 | UNKNOWN | High | Internal graph, scheduler, process topology, VST wrappers and project schema are undisclosed | Architecture | S-001, S-012 | Relevant public architecture-level pages inspected | Vendor may implement privately |
| C-008 | DOCUMENTED | Medium-high | Sonar exposes a 64-bit mix engine, load balancing, PDC override/latency UI and high-core optimizations | Audio engine | S-012, S-013, S-014 | Direct current descriptions | Full graph coverage and independent benchmarks absent |
| C-009 | DOCUMENTED | High | Membership oversampling is per plug-in, 2x–16x, separately selectable for playback/render and documented phase-aligned | Plug-in processing | S-014, S-018 | Direct current help | Vendor quality claim not independently measured |
| C-010 | DOCUMENTED | High | Current workflow includes advanced take lanes/comping, folders and Mix Recall with plug-in states | Editing/mix state | S-001, S-012, S-014 | Direct product/current comparison | Native state serialization remains C-025 |
| C-011 | DOCUMENTED | High | Articulation Maps generate/transform MIDI, support negative offsets and import/export `.artmap`/Cubase maps | MIDI | S-001, S-017 | Direct current help | Not evidence for MPE/MIDI 2.0 |
| C-012 | UNKNOWN | High | MPE, MIDI 2.0, UMP, plug-in note expression and sample-accurate event delivery are not established | MIDI/plugin contract | S-017, S-023 | Current feature article plus no-result search | Search silence is not non-support proof |
| C-013 | DOCUMENTED | High | Audio/MIDI route among tracks, buses, outputs, instruments and external devices; sidechain/aux routing is visible | Routing | S-002, S-012, S-015 | Direct current routing/features | Feedback/cycle policy unknown |
| C-014 | DOCUMENTED | High | Automation envelopes/lanes include plug-in controls, nodes, curves and smoothing/recording enhancements | Automation | S-012, S-016 | Direct current help | Sample accuracy and ID migration unknown |
| C-015 | DOCUMENTED | High | Sonar provides multitrack recording, take comping, AudioSnap and VocalSync | Recording/editing | S-001, S-014 | Direct current product/tier evidence | Detailed punch/device-loss behavior absent |
| C-016 | DOCUMENTED | High | Product-native surfaces include ProChannel, FX Chains, XSampler and tiered BandLab/core content | Native devices | S-001, S-002, S-014, S-018 | Direct feature inventory | No public native authoring ABI established |
| C-017 | DOCUMENTED | High | Current 64-bit Sonar hosts VST2 and VST3; old 32-bit plug-ins are compatibility risks | Current VST formats | S-006, S-008, S-010 | Current help explicitly names VST2/VST3 and 64-bit host | Exact 32-bit rejection/bridge matrix not stated |
| C-018 | DOCUMENTED | High | Current scanner has default/custom roots, startup/manual modes and failed-plug-in rescan | VST discovery | S-007 | Direct current procedure | Validation/cache/isolation not described |
| C-019 | UNKNOWN | High | Scanner validation, cache, identity, quarantine, timeout, logs and process isolation are not specified | VST scanner | S-007, S-009 | Scanner/config sources inspected | Failed status alone does not answer mechanism |
| C-020 | INFERENCE | Medium | Current-linked CbB VST configuration likely reflects inherited current controls for PDC, MIDI I/O, sidechains, serialization, suspend and optional jBridge | Host continuity | S-007, S-009, S-012 | Current scanner links S-009; Sonar builds on CbB | Manual is CbB-branded; every detail needs current probe |
| C-021 | DOCUMENTED | Medium-high | Current VST contract visibly includes instruments/effects, automation, sidechains, load balancing, PDC and oversampling | Processing contract | S-007, S-012, S-015, S-016, S-018 | Multiple current pages triangulate | Does not establish full format compliance |
| C-022 | UNKNOWN | High | Runtime plug-in process isolation, sandboxing, crash containment, broker restart, bridging and signing policy are undisclosed | Runtime security | S-007, S-009, S-011 | Targeted current/linked docs inspected | Safe Mode is not runtime isolation |
| C-023 | DOCUMENTED | High | VST2/VST3 DPI awareness is controllable per plug-in | Plug-in UI | S-008 | Direct current help | Focus/accessibility/headless behavior unknown |
| C-024 | DOCUMENTED | High | CXF preserves a named subset including routing, automation and plug-in settings while flattening overlaps/takes | Interchange/state | S-001, S-019 | Direct current export docs | Not a native `.cwp` state specification |
| C-025 | UNKNOWN | High | Parameter identity, sample accuracy, native plug-in state/assets, missing-state retention, dynamic I/O, latency/tails and migration are unspecified | Deep host/state contract | S-010, S-011, S-016, S-019 | Relevant current automation/recovery/export inspected | Requires controlled fixture and save-file lifecycle tests |
| C-026 | DOCUMENTED | High | Sonar opens `.cwp`, `.bun`, `.wrk`, CbB and legacy SONAR projects; CbB and Sonar can coexist | Project compatibility | S-010, S-012, S-013 | Direct current troubleshooting/FAQ | New Sonar-only features unavailable in CbB |
| C-027 | UNKNOWN | High | Autosave retention, crash-recovery generations, transactional native save and asset relink are not documented in retained current help | Project durability | S-025 | Targeted current-help search returned no relevant autosave article | Legacy behavior not promoted to current fact |
| C-028 | DOCUMENTED | High | Current export supports extensive audio sources/formats, tails, queues, CXF, OMF, SMF and surround delivery with stated losses | Delivery | S-019 | Direct current help | No AAF/ADM/DDP evidence |
| C-029 | DOCUMENTED | High | Membership CakeScript is Lua-based, non-real-time, transactionally undoable and restores state on script error | Extensibility | S-002, S-020 | Direct current help | API is incomplete and in-app reference was not inspected |
| C-030 | DOCUMENTED | High | Membership rollback installs eligible earlier builds released during the active period | Reliability/licensing | S-022 | Direct current help | Project behavior in older builds can differ |
| C-031 | UNKNOWN | High | No current affirmative host evidence was found for AAX, CLAP, LV2, LADSPA, DSSI, JSFX, Rack Extension or a public native ABI | Format breadth | S-006, S-024 | Current VST article plus targeted no-result search | Absence is not proof of rejection |
| C-032 | UNKNOWN | High | Current DirectX/DXi acceptance, discovery, bitness, state and isolation remain unverified | DirectX/DXi | S-005, S-024 | Current targeted search produced no relevant result | Windows platform and product lineage are not format evidence |
| C-033 | DOCUMENTED | High | Legacy-hosted documentation is CbB-branded and warns content may be stale; scope must not be silently transferred | Provenance | S-005, S-009 | Direct warning/branding | Current help intentionally links some legacy pages |
| C-034 | DOCUMENTED | High | Missing plug-ins warn but allow opening; Shift Safe Mode prompts load/skip per instance and supports removal/replacement/resave | Project/plugin recovery | S-010, S-011 | Direct current troubleshooting | State fidelity while skipped is unknown |
| C-035 | DOCUMENTED / UNKNOWN | High | Membership activation uses Product Center/BandLab sign-in and authorized Sonar can run offline; expiry/device/grace details are unknown | Licensing | S-003, S-013, S-021 | Direct current activation/specs | No entitlement-expiry test/terms analysis |
| C-036 | UNKNOWN | Medium-high | Screen-reader, keyboard-only, plug-in accessibility, localization and complete high-DPI accessibility are not established | Accessibility | S-008, S-012 | DPI/UI sources inspected | DPI support is not accessibility completeness |
| C-037 | INFERENCE | High | Sonar host capability grants no implementation, SDK, trademark, redistribution or certification rights to another DAW | Clean-room/legal | S-006, S-008 | Capability evidence plus governing research contract | Not legal advice; format-owner terms require separate review |
| C-038 | DOCUMENTED | High | Current documentation has provenance inconsistencies: Sonar help links CbB manuals/release notes and some pages retain mixed naming | Source quality | S-005, S-009, S-010, S-026 | Direct titles/wording | Does not invalidate independently current-scoped statements |
| C-039 | DOCUMENTED | High | Export offers configurable clip-tail padding for delay/reverb tails | Render/tails | S-019 | Direct current export help | Does not establish plug-in tail reporting API |
| C-040 | DOCUMENTED | High | No current macOS/Linux/mobile/web Sonar edition is in scope; Windows 11+ is supported | Platform matrix | S-001, S-021 | Direct current product/specs | Cakewalk Next is a separate cross-platform product |

## 22. Source ledger and adaptive bibliography

All retained sources were accessed 2026-08-29. Vendor statements document what
Cakewalk/BandLab publishes; they are not independent runtime measurements.

### S-001 — Cakewalk Sonar overview

- **Publisher / kind:** Cakewalk; official current product and tier page.
- **URL:** https://www.cakewalk.com/sonar
- **Scope / passage:** Current Sonar workflow, CbB comparison, record/mix/MIDI,
  Mix Recall, ProChannel, tier table and Windows suggested specs.
- **Claims:** C-003, C-004, C-005, C-007, C-010, C-011, C-015, C-016,
  C-024, C-040.
- **Limitations:** Marketing-level engine/performance language; FAQ answers were
  collapsed in fetched text.
- **Selection rationale:** Canonical current product boundary, preferable to
  reseller or forum summaries.

### S-002 — Cakewalk Sonar: What's New

- **Publisher / kind:** Cakewalk; official current feature page.
- **URL:** https://www.cakewalk.com/sonar/whats-new
- **Scope / passage:** CakeScript, nested folders, aux folders, Track Manager,
  Signal Probe, XSampler and interchange.
- **Claims:** C-006, C-013, C-016, C-029.
- **Limitations:** No build number or detailed API/engine semantics.
- **Selection rationale:** Current differentiator source, preferable to inferred
  changes from screenshots.

### S-003 — How to Activate Cakewalk Sonar with BandLab Membership

- **Publisher / kind:** Cakewalk Help Center; official activation procedure.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/36313428667417-How-to-Activate-Cakewalk-Sonar-with-BandLab-Membership
- **Scope / passage:** Product Center, BandLab account/Membership and in-app
  sign-in activation.
- **Claims:** C-035.
- **Limitations:** Written for Membership; does not describe free-tier or
  expiry/offline-grace behavior.
- **Selection rationale:** Direct entitlement workflow, preferable to purchase
  marketing.

### S-004 — How do I know if Cakewalk Sonar is up to date?

- **Publisher / kind:** Cakewalk Help Center; official current-version article.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/360034958593-How-do-I-know-if-Cakewalk-Sonar-is-up-to-date
- **Scope / passage:** “Our latest version is 2025.11”; in-app update and Product
  Center paths.
- **Claims:** C-001.
- **Limitations:** No exact build or release-note detail.
- **Selection rationale:** Only accessible primary source that directly pins the
  current version at cutoff.

### S-005 — Cakewalk by BandLab online documentation landing page

- **Publisher / kind:** Cakewalk legacy site; official lineage/manual page.
- **URL:** https://legacy.cakewalk.com/Documentation?product=Cakewalk&language=3
- **Scope / passage:** 2018 acquisition/relaunch notice, CbB documentation TOC
  and warning that legacy-site information may be inaccurate.
- **Claims:** C-002, C-032, C-033, C-038.
- **Limitations:** CbB/legacy scope, not current Sonar proof.
- **Selection rationale:** Primary provenance boundary, retained specifically to
  prevent accidental conflation.

### S-006 — Does Cakewalk Sonar support 3rd party plugins?

- **Publisher / kind:** Cakewalk Help Center; official current FAQ.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/360002366694-Does-Cakewalk-Sonar-support-3rd-party-plugins
- **Scope / passage:** Current Sonar VST3 support statement.
- **Claims:** C-017, C-031, C-037.
- **Limitations:** “Most current VST plugins should operate” is broad vendor
  expectation, not full-contract evidence; VST2 comes from other current pages.
- **Selection rationale:** Direct current format claim.

### S-007 — Using the VST Scanner

- **Publisher / kind:** Cakewalk Help Center; official current procedure.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/360034722693-Using-the-VST-Scanner
- **Scope / passage:** Default/custom roots, startup/manual scan and Rescan
  Failed Plugins; link to full configuration documentation.
- **Claims:** C-018, C-019, C-020, C-021, C-022.
- **Limitations:** No validation, cache, process, timeout or diagnostics design.
- **Selection rationale:** Most direct current scanner evidence.

### S-008 — Per-plugin DPI Awareness

- **Publisher / kind:** Cakewalk Help Center; official current UI-host article.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/32457777465497-Per-plugin-DPI-Awareness
- **Scope / passage:** VST2/VST3 host toolbar, default DPI-aware behavior and
  per-plug-in override.
- **Claims:** C-017, C-023, C-036, C-037.
- **Limitations:** UI scaling only; no process/focus/accessibility contract.
- **Selection rationale:** Current source simultaneously confirms VST2/VST3 UI
  instantiation and a compatibility control.

### S-009 — VST configuration (Cakewalk by BandLab manual)

- **Publisher / kind:** Cakewalk legacy site; official CbB manual, linked by
  current scanner article.
- **URL:** https://legacy.cakewalk.com/Documentation?product=Cakewalk&language=3&help=Mixing.38.html
- **Scope / passage:** Scan/reset/rescan, Plugin Manager, sidechain inputs,
  jBridge, PDC, serialized access, suspend and VST MIDI I/O.
- **Claims:** C-019, C-020, C-022, C-025, C-033, C-038.
- **Limitations:** CbB branding and stale-site warning; current continuity is
  inference only.
- **Selection rationale:** Best public host-depth source, retained because the
  current Sonar scanner page intentionally links it as full documentation.

### S-010 — Cannot Open a Project

- **Publisher / kind:** Cakewalk Help Center; current Sonar troubleshooting.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/360035040954-Cannot-Open-a-Project
- **Scope / passage:** `.cwp`/`.bun`/`.wrk`, 64-bit VST2/VST3, missing warning,
  Safe Mode, driver/config regeneration.
- **Claims:** C-017, C-025, C-026, C-034, C-038.
- **Limitations:** Mixed “Cakewalk by Sonar”/“CbB” wording; does not specify
  skipped-state fidelity.
- **Selection rationale:** Direct current project/plugin failure evidence.

### S-011 — How to open Project in Safe Mode?

- **Publisher / kind:** Cakewalk Help Center; official current recovery guide.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/54439691009049-How-to-open-Project-in-Safe-Mode
- **Scope / passage:** Shift launch/open, load-or-skip each plug-in, isolate,
  remove/update and resave.
- **Claims:** C-022, C-025, C-034.
- **Limitations:** Diagnostic workflow, not sandbox or independent data-safety
  proof.
- **Selection rationale:** Decision-critical primary recovery source.

### S-012 — What's the difference between Cakewalk Sonar and Cakewalk by BandLab?

- **Publisher / kind:** Cakewalk Help Center; official current lineage/change
  summary.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/360002369593-What-s-the-difference-between-Cakewalk-Sonar-and-Cakewalk-by-BandLab
- **Scope / passage:** Inactive CbB; current engine/MIDI/UI/project/plug-in,
  sidechain, PDC and performance changes.
- **Claims:** C-002, C-006, C-008, C-010, C-012, C-013, C-014, C-020,
  C-021, C-026, C-036.
- **Limitations:** Broad change summary, not version-by-version release notes.
- **Selection rationale:** Most comprehensive current product-difference source.

### S-013 — Cakewalk Sonar FAQ

- **Publisher / kind:** Cakewalk Help Center; official current identity/license
  FAQ.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/41129734682393-Cakewalk-Sonar-FAQ
- **Scope / passage:** 64-bit engine lineage, free use, Membership-only fully
  unlocked tier, no perpetual license, CbB cessation, project compatibility and
  side-by-side install.
- **Claims:** C-002, C-003, C-008, C-026, C-035.
- **Limitations:** No activation cadence or subscription-expiry semantics.
- **Selection rationale:** Canonical current commercial/lineage boundary.

### S-014 — Sonar Free Tier vs Membership Tier

- **Publisher / kind:** Cakewalk Help Center; official current tier matrix.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/49546667908121-Sonar-Free-Tier-vs-Membership-Tier
- **Scope / passage:** Core save/export, unlimited track types, one/unlimited
  Arranger, ARA, ProChannel, load balancing, oversampling and content split.
- **Claims:** C-003, C-005, C-008, C-009, C-010, C-014, C-015, C-016,
  C-017.
- **Limitations:** Does not explicitly itemize third-party format entitlement.
- **Selection rationale:** Direct edition evidence, preferable to pricing cards.

### S-015 — Understanding the Routing Process in Cakewalk Sonar

- **Publisher / kind:** Cakewalk Help Center; official current routing guide.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/41322674774425-Understanding-the-Routing-Process-in-Cakewalk-Sonar
- **Scope / passage:** Audio tracks, buses, master/external outputs, MIDI to
  instruments/external devices and metering.
- **Claims:** C-013, C-015, C-021.
- **Limitations:** Introductory guide; no feedback, multibus or scheduler rules.
- **Selection rationale:** Direct current routing evidence.

### S-016 — Automation in Cakewalk Sonar

- **Publisher / kind:** Cakewalk Help Center; official current automation guide.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/47602806480665-Automation-in-Cakewalk-Sonar
- **Scope / passage:** Volume/pan/plug-in controls, lanes, drawing, nodes, curves
  and snapping.
- **Claims:** C-014, C-021, C-025.
- **Limitations:** No resolution, sample accuracy or parameter identity.
- **Selection rationale:** Direct current automation evidence.

### S-017 — Working with Articulation Maps in Cakewalk Sonar

- **Publisher / kind:** Cakewalk Help Center; official current MIDI guide.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/60716181932953-Working-with-Articulation-Maps-in-Cakewalk-Sonar
- **Scope / passage:** Generated/transformed MIDI, negative offsets, map
  import/export, non-destructive application and SMF conversion.
- **Claims:** C-011, C-012.
- **Limitations:** Does not name MPE, MIDI 2.0 or sample-accurate delivery.
- **Selection rationale:** Best current primary source for expressive MIDI.

### S-018 — Plugin Oversampling in Cakewalk Sonar

- **Publisher / kind:** Cakewalk Help Center; official current processing guide.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/60523607834905-Plugin-Oversampling-in-Cakewalk-Sonar
- **Scope / passage:** Membership gate, 2x–16x, playback/render separation, FX
  chains, phase accuracy and CPU cautions.
- **Claims:** C-009, C-016, C-021.
- **Limitations:** Vendor claim, no independent spectral/phase measurement.
- **Selection rationale:** Direct current offline/live host-processing evidence.

### S-019 — Export Projects in Cakewalk Sonar

- **Publisher / kind:** Cakewalk Help Center; official current export/interchange
  guide.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/60835077901977-Export-Projects-in-Cakewalk-Sonar
- **Scope / passage:** Formats/sources, effect tails, dither, queues, CXF, OMF,
  SMF and surround.
- **Claims:** C-024, C-025, C-028, C-039.
- **Limitations:** Export contract, not native `.cwp` schema or deterministic
  render proof.
- **Selection rationale:** Most precise primary persistence/delivery-boundary
  source.

### S-020 — What is CakeScript in Cakewalk Sonar

- **Publisher / kind:** Cakewalk Help Center; official current scripting guide.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/60419354649369-What-is-CakeScript-in-Cakewalk-Sonar
- **Scope / passage:** Lua, supported project mutations, transport restriction,
  atomic undo/error rollback and current limitations.
- **Claims:** C-029.
- **Limitations:** In-app API reference not publicly inspected; active
  development may change coverage.
- **Selection rationale:** Direct extension/API boundary.

### S-021 — Minimum requirements for Cakewalk Sonar

- **Publisher / kind:** Cakewalk Help Center; official current platform article.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/360021857753-What-are-the-minimum-requirements-for-using-Cakewalk-Sonar
- **Scope / passage:** Windows 11+, unsupported Windows 10 install, ARM64/CPU,
  RAM/storage/ASIO and offline-after-authorization.
- **Claims:** C-004, C-035, C-040.
- **Limitations:** Requirements are vendor guidance, not measured scaling.
- **Selection rationale:** Canonical platform/deployment boundary.

### S-022 — Roll Back to a Previous Version of Cakewalk Sonar

- **Publisher / kind:** Cakewalk Help Center; official current update/reliability
  guide.
- **URL:** https://help.cakewalk.com/hc/en-us/articles/60658054324505-Roll-Back-to-a-Previous-Version-of-Cakewalk-Sonar
- **Scope / passage:** Membership eligibility, active-period builds, Product
  Center rollback and newer-project warning.
- **Claims:** C-030.
- **Limitations:** FAQ answers were collapsed; no rollback-integrity mechanism.
- **Selection rationale:** Direct recovery/licensing intersection.

### S-023 — Help Center search: MPE / MIDI 2.0

- **Publisher / kind:** Cakewalk Help Center; official search result page.
- **URL:** https://help.cakewalk.com/hc/en-us/search?query=MPE%20%22MIDI%202.0%22
- **Scope / passage:** No results at cutoff.
- **Claims:** C-012.
- **Limitations:** Search text is untrusted discovery evidence; no result is not
  proof of non-support.
- **Selection rationale:** Retained as a bounded negative result explaining the
  explicit unknown.

### S-024 — Help Center search: alternate plug-in formats

- **Publisher / kind:** Cakewalk Help Center; official search result page.
- **URL:** https://help.cakewalk.com/hc/en-us/search?query=CLAP%20DXi%20DirectX%20LV2%20AAX
- **Scope / passage:** No results at cutoff.
- **Claims:** C-031, C-032.
- **Limitations:** Combined query and search indexing can miss pages; cannot
  establish non-support.
- **Selection rationale:** Retained only to document the negative current-help
  search and prevent unsupported conclusions.

### S-025 — Help Center search: autosave / recovery

- **Publisher / kind:** Cakewalk Help Center; official search result page.
- **URL:** https://help.cakewalk.com/hc/en-us/search?query=autosave%20recovery
- **Scope / passage:** Results did not document current project autosave or
  crash-recovery generations.
- **Claims:** C-027.
- **Limitations:** Search absence is not feature absence.
- **Selection rationale:** Records the attempted current-source path and its
  negative result.

### S-026 — Cakewalk by BandLab Release Notes (mislinked as Full Release Notes)

- **Publisher / kind:** Cakewalk/BandLab; official Google document linked from
  current help footer.
- **URL:** https://docs.google.com/document/d/1aFOe_zJrd3x2EnaZ_Jc3iSbZPG2WANiCD4_RP83OjlA/edit
- **Scope / passage:** Document title is “Cakewalk by BandLab Release Notes” and
  accessible newest material was 2022.11.
- **Claims:** C-038.
- **Limitations:** Not current Sonar release notes; cannot support 2025.11
  behavior.
- **Selection rationale:** Retained as a provenance contradiction explaining
  why the current build could not be sourced from the advertised changelog.

### Negative and inaccessible results retained

- The initial broad web search returned HTTP 429 and supplied no evidence.
- `www.cakewalk.com/Documentation?...Mixing.38.html` returned HTTP 404; the
  equivalent official legacy-host URL became S-009. No further retry occurred.
- The current “Full Release Notes” link resolved to S-026, a CbB document ending
  at 2022.11 rather than current Sonar notes.
- The current Sonar Reference Guide PDF returned unsupported
  `application/pdf`; no converter workaround was pursued because accessible
  current help articles covered the material questions.
- The client changelog URL linked by S-012 returned an empty textual body.
- Targeted current-help searches for DirectX/DXi and alternate formats produced
  no relevant evidence; S-024 records the final bounded negative result.
- Targeted current-help search produced no MPE/MIDI 2.0 result (S-023) and no
  current autosave/recovery specification (S-025).

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| Current DirectX/DXi support, discovery and isolation | Current help and targeted searches; only legacy-family context found | Windows legacy-project migration and format scope | Create signed 64-bit DX/DXi effect/instrument fixtures, inspect current Plugin Manager/registry discovery and save/reopen behavior | Disposable Windows VM; unassigned |
| Scanner isolation/cache/quarantine | Current scanner plus current-linked manual document controls but not internals | Security, startup reliability, diagnosability | Valid, malformed, duplicate-ID, hanging and crashing VST2/VST3 fixtures; record processes, cache, logs, timeout and rescan outcomes | Disposable Windows VM; unassigned |
| Runtime sandbox/crash containment | Safe Mode is load-time only; no process documentation | Fault containment and threat boundary | Observe process tree, crash one controlled instance, test sibling instances/audio engine/project recovery | Disposable Windows VM; unassigned |
| VST bus/dynamic-I/O contract | Current sidechain/routing plus inherited manual are incomplete | Multi-output/sidechain fidelity | Capability-coded VST3 effect/instrument with aux input, multiple outputs, dynamic bus changes and speaker layouts | Lawful custom fixtures; unassigned |
| MIDI event fidelity/MPE/MIDI 2.0 | Articulation docs and no-result current search | Modern controller/instrument architecture | VST3 note-expression/MPE and MIDI 2.0/UMP fixtures with timestamped loopback | Hardware/fixture lab; unassigned |
| PDC, latency changes and tails | PDC controls/oversampling/tail padding documented, exact algorithm not | Timing correctness/live-offline parity | Impulse/sidechain/parallel fixture with static/dynamic latency and long tails across live, freeze, bounce and export | Audio-analysis harness; unassigned |
| Parameter identity/sample accuracy | Current automation guide lacks IDs/timing | Durable automation and migration | Stable/renamed IDs, stepped/log ranges, dense automation, loop boundaries, save/reopen and upgrade fixture | Custom VST2/VST3 pair; unassigned |
| Native plug-in state and missing placeholders | Safe Mode/warning/CXF settings documented; `.cwp` representation proprietary | Long-term project durability | Save opaque state/assets, skip/remove/upgrade/reinstall plug-in, compare recalled state and placeholder behavior | Copied disposable projects; unassigned |
| Autosave/crash generations/transactional save | Targeted current search found no specification | Data-loss/recovery architecture | Configure UI, force safe host termination during save/record, inventory generations and repair behavior | Disposable project/VM; unassigned |
| 32-bit/jBridge current behavior | jBridge only in linked CbB manual; current help warns of 32-bit risk | Legacy project migration | Test lawful 32-bit VST2 with/without separately licensed jBridge; record current UI/support state | Separate jBridge license; unassigned |
| Membership expiry/offline renewal/device limits | Activation, tier and offline pages omit cadence/expiry | Project access and procurement risk | Obtain current terms/vendor confirmation; test copied project before/after controlled subscription expiry without network | Separate account/license; unassigned |
| Accessibility | DPI evidence only | Inclusive UI/plug-in-host design | Screen-reader/keyboard audit of core views, scanner, Safe Mode and plug-in windows | Accessibility lab; unassigned |
| Exact 2025.11 build/changelog | Current version article lacks build; advertised notes are stale/empty | Reproducible qualification baseline | Obtain vendor-published immutable release notes or signed installer metadata without executing installer | Public vendor artifact; unassigned |

## 24. Curiosity pass and stop decision

Scores use 0–4 for decision relevance (R), expected value (V), novelty (N) and
cost (C, lower is better).

| Candidate follow-up | R | V | N | C | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Current scanner/host fixture covering VST2/VST3/DX, crashes and state | 4 | 4 | 4 | 4 | **Best next phase, not documentary:** requires authorized runtime lab |
| More broad searches for alternate formats | 3 | 1 | 1 | 2 | **CURIOSITY_NO_GO:** current help saturated; silence cannot prove rejection |
| Parse inaccessible reference PDF by external tooling | 3 | 2 | 1 | 3 | **CURIOSITY_NO_GO:** accessible equivalents exist; marginal evidence nonpositive |
| Reverse-engineer changelog client/installer | 2 | 1 | 2 | 4 | **CURIOSITY_NO_GO:** outside clean documentary authority |
| Deep legacy SONAR edition chronology | 1 | 1 | 1 | 3 | **CURIOSITY_NO_GO:** unlikely to change current architecture decision |
| Community plug-in failure census | 3 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** useful only to seed later controlled fixtures |
| CakeScript API inventory | 2 | 2 | 3 | 3 | **CURIOSITY_NO_GO:** current boundary/limitations already sufficient |

**Contradictions/gaps after final synthesis:** Current help is internally
inconsistent about manual/release-note provenance, and inherited CbB host depth
cannot be assumed current. No primary current source resolves DX/DXi, sandboxing,
cache/quarantine, deep state or MIDI 2.0. These unknowns are explicit and have
discriminating probes.

**STOP — COVERAGE AND SATURATION.** Every required heading and format row is
complete; current Sonar is separated from CbB and legacy SONAR; routing, MIDI,
automation, PDC, VST scanning/isolation, state, project recovery and licensing
have evidence or explicit unknowns. Further documentary passes repeated stale,
empty or no-result sources and were unlikely to change the leading conclusions.
The next useful step is the bounded fixture matrix above, not indefinite search.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Verified with repository
  status/diff after writing.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0 pins 2025.11, Free/Membership, Windows and lineage exclusions.
- [x] **Every required dossier heading exists in order.** Repository validator
  executed after completion.
- [x] **Every material assertion has a claim ID and classification.** Sections
  use `DOCUMENTED`, `INFERENCE`, or `UNKNOWN`; no runtime `OBSERVED` claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.**
  Section 21 cross-references Sections 22–23.
- [x] **Every required plugin-format row is present.** All 13 rows appear in
  Section 11.1 with no blank status cell.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover scan, isolation, processing, automation/state and
  diagnostics.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Inherited CbB material is explicitly bounded.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 separates
  product entitlement from format/implementation rights.
- [x] **Bibliography records source rationale and limitations.** Section 22 has
  26 retained official source URLs plus negative/access notes.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections
  19 and 24 record pursued/rejected threads and stop rationale.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Documentary fetches only; no product or plug-in execution.

**Owned path:** `research/daw-landscape/dossiers/cakewalk-sonar.md`

**Checks performed:** repository dossier validator; heading/format/claim/source
presence; targeted content checks for all 13 plugin rows, `CURIOSITY_NO_GO`,
current/CbB/legacy naming, and explicit VST2/VST3/DX scanning/isolation/state/
recovery coverage; repository status/diff restricted to the owned path.

**Unresolved blockers:** Current DX/DXi and alternate-format support; scan/runtime
isolation; cache/quarantine; full VST bus/MIDI/automation/PDC/state contract;
autosave; entitlement expiry; accessibility; exact 2025.11 build/changelog.
Each has a next probe in Section 23.

**Pre-existing workspace changes:** Left untouched. No staging or commit was
performed.
