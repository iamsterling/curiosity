# Temper DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Temper standalone MIDI+audio sequencer and the separately distributed Temper VST public beta |
| Canonical vendor | Angry Red Planet |
| Researcher/session | Subagent in session `ses_fb271e965ffapFNVuV06SJEiNG` |
| Owned path | `research/daw-landscape/dossiers/temper.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Historical release scope | Last first-party release identified: Temper 1.4, published 2011-02-17 [C-001]. Earlier release notes are used only to explain facilities retained or changed on the path to 1.4. |
| Platform scope | First-party requirements specify Windows XP SP2; ASIO is required for VST and audio support [C-002]. No macOS, Linux, mobile, or web build was established. |
| Editions / entitlements | Preserved documents mention “Temper A,” “Temper C,” an unrestricted trial, legacy paid licenses, the free post-sales build, and a separate Temper VST public beta. Their complete edition/version mapping is unknown [C-003, C-031]. |
| Included | Composition model; MIDI/audio/timeline; typed FX routing; VST2.4 hosting; Temper-as-VST role; scanning, state, UI, automation, latency unknowns; projects/interchange; platform, sales end, licensing; Shapes, Decor, and Perform Time. |
| Excluded | Binary execution, decompilation/disassembly, installer execution, forums as feature proof, undocumented internals, and claims about legal rights to VST technology. |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

**Method.** Six evidence passes retrieved at most two decision-critical sources
before each synthesis. Sources were public first-party pages, preserved
first-party artifacts, and Internet Archive capture metadata. Search-result text
was treated as untrusted discovery evidence; four initial web searches returned
HTTP 429 and supplied no evidence. The two ZIP distributions were only listed and
their text files read; no executable or DLL was loaded [C-026, C-030].

## 1. Executive summary

- **DOCUMENTED — identity.** Temper 1.4 is a Windows MIDI+audio sequencer, with
  an explicit emphasis on MIDI, released on 2011-02-17. Its first-party download
  page later said sales had ended while retaining a free build [C-001, C-003].
- **INFERENCE — status.** “Discontinued” is the most defensible roster label
  because the preserved first-party site still names 1.4 as latest, sales ended,
  and no later public release was found. The vendor also said it might still
  improve the product as time and interest allowed, so an unpublished or preview
  build cannot be excluded [C-004].
- **DOCUMENTED — differentiator.** Temper exposes a typed FX graph around an
  Input → Phrases → Output default chain. Its Shapes are reusable value/time
  transformations; Decor binds Shapes to notes so generated controller gestures
  follow note edits; Perform Time separates visible and performed note timing
  [C-006, C-010, C-011].
- **DOCUMENTED — plug-in headline.** Standalone Temper hosts VST2.4 instruments
  and effects. Separately, **Temper itself shipped as a Windows VST public-beta
  DLL** to be placed in another host's VST search path. These are opposite roles
  and are not conflated here [C-012, C-016, C-026].
- **UNKNOWN — host depth.** The public corpus covers paths, cache clearing,
  instruments/effects, MIDI I/O, transport/loop behavior, programs/banks, GUI
  automation recording, and song state. It does not establish process isolation,
  sidechain or multi-output semantics, sample-accurate automation, latency/tail
  reporting, offline callbacks, dynamic I/O, or missing-plug-in placeholders
  [C-013–C-017].
- **Confidence.** High for product identity, Windows/VST2.4 scope, user-visible
  routing, and Shapes/Decor behavior; medium for discontinuation and last-public
  status; low/unknown for proprietary engine internals and the full Temper VST
  host-facing contract [C-004, C-017, C-023].

## 2. Product identity, history, and market position

**DOCUMENTED.** Angry Red Planet describes Temper as a “MIDI+Audio sequencer
with an emphasis on MIDI.” The first-party landing page identifies 1.4, dated
2011-02-17, as its latest release; the download requires Windows XP SP2 and
recommends a three-button mouse and MIDI controller [C-001, C-002]. Its feature
language and manuals position it as a composition/sequencing workstation with
audio recording and VST hosting, not merely a plug-in rack or two-track editor
[C-005, C-008, C-012].

**DOCUMENTED.** The sales notice says Temper was no longer for sale, leaves a
free functional build available, and reserves note Decor, group operations,
Perform Time, and the VST randomizer for prior paying customers [C-003].
Surviving manuals also use “Temper A” for licensed feature introductions and
“Temper C” for limits of Main plus three user buses and four groups. No retained
source maps these labels cleanly to 1.4, so edition equivalence is **UNKNOWN**
[C-007, C-031].

**INFERENCE.** The product is treated as discontinued/last-public rather than
currently maintained. Evidence is the 2011 latest-release marker and ended sales;
the plausible alternative is sporadic private or forum preview work, consistent
with the vendor's statement that personal use and occasional improvement might
continue [C-004].

## 3. Workflow and conceptual model

**DOCUMENTED.** A song is a linear arrangement of MIDI and audio tracks whose
data is stored/performed by a Phrases FX. Tracks are themselves FX pipelines:
an input receives MIDI/audio, Phrases records/stores/performs it, and an output
sends it onward; inserted FX, VST instruments, inter-track links, and bus sends
can make the graph more complex [C-005, C-006].

**DOCUMENTED.** The conventional phrase/timeline layer is augmented by three
composition abstractions [C-008, C-010, C-011]:

1. **Shapes** describe context-dependent value or time transformations and are
   reused by tools, generators, parameter randomization, and controller work.
2. **Decor** attaches a Shape to a note, regenerating controller events as the
   note moves or resizes; overlaps can combine generators and filters.
3. **Perform Time** lets playback time differ from display time, keeping the
   arrangement visually aligned while moving the note and attached generated
   controller gesture in performance.

There is no scene launcher, tracker grid, notation-first model, browser/mobile
model, or post-production timeline documented in the retained corpus; their
presence is **UNKNOWN**, not inferred unsupported [C-018, C-033].

## 4. Publicly documented architecture

**DOCUMENTED — user-visible graph.** FX are Temper's basic objects for receiving,
sending, storing/editing, and processing data. Typed MIDI/audio pins and a Link
window form a modular processing graph. New FX are chained automatically when
the connection is unambiguous, but users can create links between tracks and
individual pins [C-006]. Buses are special tracks; a Main bus is the default
destination and Buss Out FX feed additional bus tracks [C-007].

**DOCUMENTED — limited internal disclosure.** The vendor calls the audio engine
multicore and attributes certain VST scan/load hangs to an asynchronous behavior
that avoided pausing the application [C-013, C-022]. This is vendor disclosure,
not independent measurement.

**UNKNOWN.** Process boundaries, thread pools, lock-free structures, graph
compilation, render quantum, disk-streaming implementation, memory ownership,
plug-in subprocesses, and persistence schema are not public in the reviewed
materials. A later source or clean runtime probe, not architectural guesswork,
would be required [C-023].

## 5. Audio engine

**DOCUMENTED.** Temper 1.4 exposes metering at input, phrase, and output stages,
with gain/pan controls and overload indication; it added smoothed real-time
volume/pan controls and a basic brickwall safety limiter enabled for new projects.
The landing page calls the engine multicore. Earlier release notes document
sample-rate configuration fixes and sample-rate conversion on audio-file playback
[C-020, C-022]. Audio/VST operation requires an ASIO-capable interface; without
one, Temper can operate only as a MIDI sequencer [C-002].

**DOCUMENTED.** Bus sends can target independent destinations with gain/pan, and
an audio Send FX can address multiple destinations. Bypass rebuilding of the
graph and freeing CPU appear in historical fixes, but no deterministic resource
guarantee follows from bug-fix prose [C-006, C-022].

**UNKNOWN.** Supported sample-rate set, internal precision/bit depth, buffer-size
limits, multicore scheduler, dropout policy, plug-in delay compensation, latency
reporting, tail handling, freeze, oversampling, offline render path, and
deterministic bounce are undocumented [C-017, C-023].

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED.** Temper has MIDI, audio, bus, and program/template tracks. Phrases
can be moved/copied, separated, merged, dragged between song windows or external
applications, and placed on alternate takes. The song ruler supports loop points,
markers, measure/beat grids, BPM, meter, scale, and chord lanes; the track editor
supports vertical/horizontal zoom and simultaneous multitrack MIDI display/editing
[C-008, C-009, C-019].

**DOCUMENTED.** Audio phrases can be chopped, have their source file replaced,
open the source in an external editor, and be dragged to the desktop/another app.
Sample-rate conversion is documented for playback. These operations establish
an object/phrase layer but do not prove that all edits are non-destructive
[C-020].

**UNKNOWN.** Take comp swipe behavior, lanes as shown in modern DAWs, ripple
editing, elastic audio/warp algorithms, grouping semantics beyond piano-roll
visibility/experimental solo, and durable edit-history storage are not specified
[C-007, C-032].

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED.** Temper records and edits notes, velocity, pitch bend, controllers,
NRPNs, program changes, tempo, scales, and chords. It supplies piano-roll and
controller-strip views, simultaneous multitrack editing, step recording,
quantize/groove/swing tools, arpeggiation, key-name/device definitions, and
computer-keyboard MIDI input [C-009, C-024]. It can receive MIDI events from
hosted VSTs and send MIDI into VST effects/instruments [C-012].

**DOCUMENTED.** MIDI synchronization output includes MIDI Clock + Song Position
Pointer, MTC, and MMC. Release notes describe tutorials for slaving other DAWs
to standalone Temper, but this is distinct from loading Temper VST in a host
[C-021].

**UNKNOWN.** Score notation, SysEx handling, MPE, per-note expression standards,
MIDI 2.0, UMP, and sample-accurate event scheduling are not established. Decor
is Temper's own note-linked controller-generation model; it should not be
relabeled MPE [C-011, C-018].

## 8. Routing, mixer, automation, and control

**DOCUMENTED.** Typed FX pins support MIDI and audio links within and across
tracks. Default chaining coexists with explicit Link-window routing; audio and
MIDI bus tracks transport data between tracks. Main and user buses, independent
send destinations, send gain/pan, and input/phrase/output metering form the
documented mixer/routing surface [C-006, C-007, C-022].

**DOCUMENTED.** Track controller strips can expose Temper FX and VST parameters.
VST GUI knob movements can be recorded when a track's Automate control is armed;
MIDI controllers can be mapped to VST automation pages. Shapes can also publish
parameters to MIDI macro controls [C-010, C-015].

**INFERENCE.** “Arbitrary routing” means flexible routing between compatible
typed pins, not proof of unrestricted feedback or every cyclic topology. The
manual's valid-target arrows and per-pin link rules are the safer bound [C-029].

**UNKNOWN.** Feedback rules, sidechain naming, surround layouts, VCAs, OSC,
control-surface APIs, automation resolution, latch/touch modes, and sample-accurate
parameter delivery are not documented [C-017, C-025].

## 9. Recording, comping, and media handling

**DOCUMENTED.** Temper records MIDI and audio into phrases, supports loop and
punch recording, multiple takes per track, “Paste to New Take,” a grid-driven
step recorder, pre-record input level adjustment, and selection of a default
MIDI input that follows the edited track [C-008, C-009, C-020]. Audio files can
be replaced or externally edited; audio phrases can be dragged across application
boundaries [C-020].

**UNKNOWN.** Input-monitoring modes, pre-roll/post-roll, destructive versus
non-destructive guarantees, swipe comping, supported audio file-format matrix,
bit-depth choices, asset relinking, metadata, conform, proxy, and video handling
are not specified [C-020, C-032, C-033].

## 10. Instruments, effects, content, and native devices

**DOCUMENTED.** Native/internal FX mentioned by first-party material include an
Arpeggiator, Frakture beta sample-playback/wavetable/analog synth, MIDI monitor,
tempo tap, chorus, echo, splitter/change-time/change-type/change-value tools,
audio recorder/mixer, limiter, bus I/O, and transformation tools. Factory archives
contain Shapes, device definitions, Frakture programs, arpeggiator programs, and
`.squ` program tracks [C-024, C-026].

**DOCUMENTED.** Shapes are a native reusable content/behavior format with
load/save, category management, composition from sub-shapes, parameters, morph,
and MIDI-macro destinations [C-010]. Device XML can provide icons, key names,
and default exposed VST parameters, but no public third-party native-device SDK
was established [C-014, C-025].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means the reviewed first-party 1.4-lineage corpus does not establish
support; it does **not** mean experimentally unsupported [C-018]. Temper-as-VST
is recorded under product-native/other as a plug-in **role**, never as a hosted
format [C-016].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN: no macOS Temper build evidenced | **DOCUMENTED: VST 2.4 instruments/effects** | UNKNOWN: no Linux Temper build evidenced | UNKNOWN: no mobile/web build evidenced | Release 1.3 says Temper had moved to VST 2.4; 1.4 is the last public release | Host role documented; full contract remains partial | [C-012–C-017]; S-004, S-006–S-008 |
| VST3 | UNKNOWN | UNKNOWN: no first-party VST3 statement found | UNKNOWN | UNKNOWN | Reviewed corpus through 1.4 | Absence from corpus is not proof of rejection | [C-018]; S-001–S-012 review |
| AUv2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Reviewed corpus through 1.4 | No Audio Unit evidence; non-Apple platform scope does not prove a tested rejection | [C-018]; S-001–S-012 review |
| AUv3 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Reviewed corpus through 1.4 | No AUv3 evidence | [C-018]; S-001–S-012 review |
| AAX | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Reviewed corpus through 1.4 | No AAX evidence | [C-018]; S-001–S-012 review |
| CLAP | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Reviewed corpus through 1.4 | No CLAP evidence | [C-018]; S-001–S-012 review |
| LV2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Reviewed corpus through 1.4 | No LV2 evidence | [C-018]; S-001–S-012 review |
| LADSPA | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Reviewed corpus through 1.4 | No LADSPA evidence | [C-018]; S-001–S-012 review |
| DSSI | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Reviewed corpus through 1.4 | No DSSI evidence | [C-018]; S-001–S-012 review |
| JSFX | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Reviewed corpus through 1.4 | No JSFX evidence | [C-018]; S-001–S-012 review |
| DirectX/DXi | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Reviewed corpus through 1.4 | No DirectX/DXi evidence; Windows scope alone proves nothing | [C-018]; S-001–S-012 review |
| Rack Extension | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Reviewed corpus through 1.4 | No Rack Extension evidence | [C-018]; S-001–S-012 review |
| Product-native/other | UNKNOWN: no macOS build evidenced | **DOCUMENTED:** internal Temper FX/Shapes; **DOCUMENTED plug-in role:** separate Temper VST public beta DLL | UNKNOWN: no Linux build evidenced | UNKNOWN: no mobile/web build evidenced | Internal devices in 1.4 archives; Temper VST public beta from 1.3/1.4 | No third-party native SDK established. Temper VST is loaded by another VST host; it is not a format Temper hosts. | [C-010, C-016, C-024–C-026]; S-005, S-007, S-009, S-011–S-012 |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED.** Initial setup accepts one or more VST search paths. Temper mirrors
their folder hierarchy in its menus and scans shortcuts in those folders, letting
the user curate a virtual hierarchy. A “Rescan on Restart” control clears the
cache and rescans after scan failure [C-013].

**DOCUMENTED.** The vendor records a known issue in which a small number of VSTs
could hang during scanning/loading. It attributes this to non-blocking add behavior
and names specific historical versions as examples. This is a vendor-reported
compatibility limitation, not a reproduced observation [C-013].

**UNKNOWN.** Validation probes, duplicate identity, cache schema, per-plug-in
blacklist/quarantine, timeouts, scan subprocesses, signatures, rescan granularity,
and structured diagnostics are undocumented [C-017].

### 11.3 Runtime isolation and compatibility

**DOCUMENTED.** Temper 1.3 describes VST2.4 compatibility fixes, including an
older-plug-in regression, transport-running support, loop support tested with
named historical plug-ins, MIDI-generating VST behavior, and “groovebox” VSTs
that generate sound while transport runs [C-012].

**UNKNOWN.** In-process versus separate-process execution, sandboxing, crash
containment, 32/64-bit architecture, bridging, code-signing policy, and compatibility
modes were not established. The `.dll`/`.exe` artifacts were not inspected beyond
archive metadata [C-017, C-026].

### 11.4 Host/plugin processing contract

**DOCUMENTED.** Temper distinguishes VST instruments and effects; it can receive
MIDI generated by VSTs and can send MIDI to VST effects. Typed FX metering exposes
MIDI/audio capabilities, and transport/loop-sensitive VST behavior is described
[C-006, C-012].

**UNKNOWN.** Exact audio-bus counts, VST sidechains, multi-output mapping, dynamic
I/O, event ordering, note-off flushing guarantees, latency/tail reporting,
sample-accurate automation, bypass/suspend semantics, and offline rendering are
not documented. “Supports VST2.4” is not elevated to a complete contract
[C-017].

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED.** VST inspectors expose direct parameters, current patch, and
`.fxb` bank/`.fxp` program load/save. Song save can retain either the current
program or whole bank; 1.3.3 added an option to store bank/patch data separately
from `.squ`. Device definitions can publish common parameters globally while an
instance can add its own parameter list [C-014].

**DOCUMENTED.** VST parameter lanes share the controller system; armed recording
captures movements from open VST editors. MIDI controllers can be assigned through
the VST Automation page. The paid VST randomizer maps patch parameters through
Shapes, with parameter locking and a historical cap for plug-ins exposing very
large parameter counts [C-015].

**UNKNOWN.** Stable parameter IDs versus indices, normalized/text conversions,
state-chunk fidelity, referenced assets, preset migration, missing-plug-in
placeholders, replacement mapping, and corrupt-state recovery remain undocumented
[C-017, C-032].

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED.** A VST FX inspector exposes patch, studio/device, randomizer, and
parameter sections. Release notes refer to “open VST” edit windows and closing
them when an FX is removed, indicating separate custom-editor windows. Red loading
state, scan/load hangs, crash/hang fixes, large VST menu fixes, and named historical
compatibility cases are the available diagnostics/failure evidence [C-013, C-015].

**UNKNOWN.** Editor embedding, detachment policy, DPI/scaling, keyboard focus,
headless operation, generic UI fallback, per-plug-in logs, crash reports, and
automated recovery are not established [C-017, C-027].

## 12. Extensibility and integration

**DOCUMENTED.** User-extensible surfaces include saved Shapes, shape composition
and MIDI-macro parameters, skins, device XML for icons/key names/parameters,
track/program templates, drag/drop `.mid`/`.squ` interchange, external audio
editing, MIDI hardware I/O, and VST2.4 hosting [C-010, C-014, C-019, C-024].

**UNKNOWN.** No supported scripting language, native plug-in SDK, controller API,
OSC/remote API, command/action API, or compatibility/versioning contract was
established. Editable XML assets do not by themselves prove a stable public SDK
[C-025].

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED.** `.squ` is Temper's song/project format. Current position and loop
points are saved with a song; a specially named `.squ` can initialize the Main
bus, and songs can serve as program/track templates. `.squ` can be imported or
dropped into a song; `.mid` can be imported/appended/dropped, selected tracks can
be dragged out as MIDI, and release 1.3 adds `.mid`/`.squ` external drag options
[C-019].

**DOCUMENTED.** VST banks/programs may be stored with the song or separately.
The setup page documents configurable undo-history depth, and one earlier release
note mentions a backup procedure designed not to trigger during editing [C-014,
C-019].

**UNKNOWN.** `.squ` schema, embedded versus referenced audio, transactional save,
autosave interval, crash-recovery workflow, archive/collect, missing dependencies,
backward/forward guarantees, path portability, collaboration/version control,
AAF, OMF, ADM, MusicXML, DAWproject, and stem metadata are undocumented
[C-032].

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED.** Temper offers MIDI synchronization (Clock/SPP, MTC, MMC), looping,
transport-dependent VST playback, external drag of MIDI/audio phrases, and a
Main-bus recording/output model [C-019–C-022]. These support composition and
inter-application workflows but do not establish a dedicated live-performance
or post-production mode.

**UNKNOWN.** Mixdown/export format matrix, real-time versus offline export,
batch render, stems, loudness, DDP, video/timecode timeline, ADR, surround,
immersive/ADM, show control, cue lists, and live set recovery were not found
[C-033].

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED.** Public claims/fixes cover a multicore audio engine, non-blocking
VST addition, CPU release on bypass, overload indication, sample-rate/audio-device
bugs, and numerous scan/load/crash/hang repairs [C-013, C-022]. These are historical
vendor statements, not benchmark or reliability measurements.

**DOCUMENTED.** UI customization includes skins, padding for larger controls,
and appearance/behavior preferences [C-027].

**UNKNOWN.** Track/plug-in scaling limits, real-time benchmark results, memory
limits, watchdogs, crash isolation, security update/rollback, code signing,
notarization, telemetry/privacy, accessibility semantics/screen-reader support,
keyboard-only completeness, localization, and supported modern Windows versions
are not documented [C-017, C-027]. The 2011 XP requirement should not be read as
a 2026 security or compatibility endorsement [C-002].

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED.** The preserved setup page describes unrestricted, unexpiring
trialware that required purchase for workflow use. The later sales notice says
sales ended, a free functional build remained available, and four capabilities
remained exclusive to prior licensees: note Decor, group operations, Perform
Time, and the VST randomizer [C-003]. This is product-page wording, not a complete
EULA analysis.

**DOCUMENTED.** The product uses Steinberg VST PlugIn Technology and ASIO, and
release notes specify VST2.4 hosting [C-002, C-012]. **UNKNOWN:** the retained
corpus does not establish Temper's source license, redistribution permissions,
VST SDK rights, trademark permissions, or whether the downloadable binaries may
lawfully be repackaged [C-018, C-025]. Naming VST2.4 support grants no SDK,
redistribution, compatibility, certification, or trademark right. This dossier
is not legal advice.

**Clean-room boundary.** Transfer only problem/mechanism abstractions documented
below. Do not copy UI assets, manuals, factory content, file formats, or proprietary
implementation; do not disassemble `Temper.exe` or `Temper.dll` [C-026, C-028,
C-029].

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED:** a single typed FX vocabulary spans MIDI/audio input, storage,
  transformation, instruments, routing, and output [C-006].
- **DOCUMENTED:** Shapes unify many editing/generation transformations without
  hard-coding each gesture into a separate lane or tool [C-010].
- **DOCUMENTED:** Decor preserves the dependency between a note and generated
  controller gesture; Perform Time preserves visual alignment independently from
  playback nuance [C-011].
- **DOCUMENTED:** VST discovery mirrors user folder organization and supplies a
  direct cache-clear/rescan recovery action [C-013].
- **DOCUMENTED:** `.mid`/`.squ` drag/drop and external audio editing offer low-
  ceremony integration for an era-specific Windows application [C-019, C-020].

### Liabilities

- **DOCUMENTED:** scan/load hangs and compatibility regressions appear in the
  vendor's own known-issues/release history [C-013].
- **UNKNOWN with architectural impact:** no isolation, crash containment, PDC,
  latency/tail, sidechain, dynamic-I/O, or sample-accuracy contract was found
  [C-017, C-023].
- **DOCUMENTED/INFERENCE:** the last public release and platform requirements are
  from 2011/Windows XP, making Temper an interaction reference rather than a
  current dependency candidate [C-001, C-002, C-004].
- **UNKNOWN:** project durability and missing-plug-in recovery guarantees are not
  documented [C-032].

## 18. Transferable patterns

| Pattern / disposition | Problem and minimal clean-room mechanism | Supporting claims | Prerequisites and tradeoffs | Adaptation risk |
| --- | --- | --- | --- | --- |
| **CANDIDATE — typed graph with useful default chain** | Represent processors with declared event/audio ports; auto-chain only when one valid connection exists; expose a pin-level linker for exceptions. | [C-006, C-029] | Requires cycle policy, latency model, graph validation, accessibility, and undo. Powerful graphs can overwhelm users. | Medium: copy the abstraction, not Temper UI/expression. |
| **CANDIDATE — reusable transformation/gesture object** | Store a parameterized mapping/function once and apply it by context to values or normalized time. | [C-010, C-028] | Requires deterministic evaluation, bounded cost, serialization/versioning, preview, and parameter identity. | Medium: independently design representation and UX. |
| **CONDITIONAL — note-attached generated automation** | Keep controller output as a dependency of note position/duration; regenerate predictably and define precedence for manual overrides. | [C-011, C-028] | Requires expression ownership, overlap/merge rules, caching, edit provenance, and export flattening. Generated/manual conflicts can surprise. | Medium-high: interaction semantics need prototyping. |
| **CANDIDATE — display time versus perform time** | Preserve a structural timeline position plus a bounded playback offset, and carry dependent generated gestures with the performed event. | [C-011, C-028] | Requires clear visualization, quantization policy, negative-time handling, export rules, and editing accessibility. | Medium. |
| **CONDITIONAL — folder-shaped plug-in catalog** | Preserve user-curated folder/shortcut organization while maintaining stable internal identities and a separate search/index. | [C-013] | Modern hosts also need validation, duplicate handling, signatures, cache health, and architecture metadata. | Low-medium. |
| **CANDIDATE — explicit clear-cache/rescan recovery** | Provide a visible restart-safe operation to invalidate discovery cache and rebuild it with diagnosable progress. | [C-013] | Must isolate scanners and preserve known-good entries to avoid repeating Temper's hangs. | Low. |

These are **INFERENCE** recommendations derived from documented mechanisms; they
are not claims about Temper's proprietary implementation [C-028, C-029].

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected mechanisms

- **REJECT — architecture-dependent non-blocking scan without documented
  containment.** The vendor linked asynchronous add behavior to scan/load hangs.
  A new host should isolate/timeout discovery rather than reproduce that failure
  surface [C-013, C-017]. Reopen only if later source code proves a safer mechanism.
- **REJECT — edition ambiguity.** Do not reproduce labels such as Temper A/C or
  infer the 1.4 entitlement map from partial manual wording [C-003, C-031].
- **REJECT — treating VST support as full fidelity.** Format acceptance and basic
  instantiation evidence do not prove sidechains, PDC, state recovery, or sample-
  accurate automation [C-012, C-017].
- **REJECT — product-format conflation.** Temper VST is Temper acting as a plug-in
  in another host; it is not a second format hosted by Temper [C-016].

### `CURIOSITY_NO_GO` threads

- `CURIOSITY_NO_GO — third-party reviews/forums:` primary manuals and release
  artifacts were available; secondary recollections would add little authority
  for architecture or exact format scope. Reopen only for a narrowly identified
  first-party document unavailable elsewhere.
- `CURIOSITY_NO_GO — exhaustive unsupported-format searches:` absence of a format
  name cannot prove rejection, and later formats post-date the product. Matrix
  cells remain `UNKNOWN` rather than consuming budget on negative inference.
- `CURIOSITY_NO_GO — more Song/Recording manual pages:` release notes already
  supplied sufficient documentary coverage; expected novelty became low.
- `CURIOSITY_NO_GO — binary introspection:` disassembly/decompilation is outside
  the clean-room contract. Static package listing was sufficient to distinguish
  `Temper.exe` and `Temper.dll` [C-026].
- `CURIOSITY_NO_GO — source-code hunt:` no public source release was indicated;
  searching for unofficial/leaked code would be unsafe and irrelevant.
- `CURIOSITY_NO_GO — indefinite release archaeology:` 1.4 identity and 1.3/1.4
  feature lineage were established; further duplicate snapshots were unlikely
  to change the decision.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / check | Documentary test and result | Classification / disposition |
| --- | --- | --- |
| H1: Temper is only a conventional clip DAW. | Concepts, Shapes, and Decor pages show typed FX pipelines, reusable transformations, note-attached generated controllers, and dual display/performance time. | **FALSIFIED (DOCUMENTED)** [C-006, C-010, C-011]. |
| H2: “As a VST” means only that Temper hosts VSTs. | Download page and archive separate standalone Temper from `TemperVST/Temper.dll`; README instructs putting the latter in another host's VST path. | **FALSIFIED (DOCUMENTED/OBSERVED)** [C-016, C-026]. |
| H3: Standalone Temper hosts VST2.4. | Dedicated VST FX manual proves instruments/effects; release 1.3 explicitly states migration to VST2.4. | **SUPPORTED (DOCUMENTED)** [C-012]. |
| H4: VST2.4 format acceptance proves the full host contract. | Evidence covers discovery, instantiation roles, MIDI, transport, programs/banks, UI and automation, but not latency, sidechains, sample accuracy, dynamic I/O, isolation, or missing-plug-in recovery. | **FALSIFIED; PARTIAL CONTRACT ONLY** [C-012–C-017]. |
| H5: Temper had a single unified license/edition in 1.4. | Manual labels Temper A/C; download page describes free versus legacy-licensed features; mapping is incomplete. | **UNRESOLVED/UNKNOWN** [C-003, C-031]. |
| H6: “Fully modular/arbitrary routing” proves unrestricted feedback. | Routing page also constrains links to compatible pins and valid destinations. | **NARROWED INFERENCE:** flexible typed graph, feedback unknown [C-029]. |
| H7: The product is conclusively abandoned. | Latest public release is 2011 and sales ended, but vendor allowed for future personal improvements and previews. | **MEDIUM-CONFIDENCE INFERENCE**, not absolute [C-004]. |

**Negative-result record.** Four web-search calls returned HTTP 429 and yielded no
usable evidence. The retained first-party corpus had no direct documentation for
VST3, AU, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, Rack Extension,
PDC/latency, missing-plug-in recovery, or Temper VST I/O/state. Silence was not
converted into an unsupported claim [C-017, C-018, C-032].

**Later dynamic probes (not performed):** in a disposable legacy Windows VM with
lawfully obtained fixtures, enumerate the VST2.4 category/I/O of Temper VST;
round-trip a synthetic VST2 effect/instrument with changing latency, multiple
outputs, MIDI I/O, GUI/no-GUI, state chunk, and controlled scan crash; inspect
whether missing plug-ins preserve state. Record only observable behavior.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Angry Red Planet calls Temper a MIDI+audio sequencer emphasizing MIDI; the site identifies Temper 1.4 on 2011-02-17 as latest. | First-party public site / 1.4 | S-001 | Direct landing-page text. | “Latest” is the site's statement, not a proof against every private preview. |
| C-002 | DOCUMENTED | High | Requirements specify Windows XP SP2 and ASIO for VST/audio; without valid audio, Temper is MIDI-only. | Public 1.4 distribution/setup | S-004, S-005 | Direct requirements/setup text. | Modern Windows compatibility and bitness unknown. |
| C-003 | DOCUMENTED | High | Sales ended; free build remained; Decor, group operations, Perform Time, and VST randomizer remained legacy-license exclusive. | Post-sales download page | S-005 | Direct vendor sales notice. | Notice date and complete EULA absent. |
| C-004 | INFERENCE | Medium | Temper is discontinued/last-public at 1.4. | Product status through cutoff | S-001, S-002, S-005 | Latest marker + ended sales + no later release in preserved site. | Vendor said personal improvement might continue; no exhaustive private-build proof. |
| C-005 | DOCUMENTED | High | Song/track model combines MIDI/audio tracks with input, Phrases storage/performance, and output FX. | Preserved manual | S-001, S-003 | Direct concepts text. | Internal storage implementation unknown. |
| C-006 | DOCUMENTED | High | Temper exposes typed MIDI/audio FX routing, default chaining, cross-track links, and pin-level Link window. | Preserved manual / 1.4 lineage | S-003, S-007, S-008 | Direct routing/concepts/release text. | “Arbitrary” bounded by valid typed links; feedback unknown. |
| C-007 | DOCUMENTED | High | Main/user bus tracks and groups exist; manual says Temper C is limited to Main + 3 user buses and 4 groups. | Preserved manual, edition unresolved | S-003, S-007 | Direct concepts/release text. | Temper C to 1.4 mapping unknown. |
| C-008 | DOCUMENTED | High | Temper supports phrase arrangement, multiple takes, paste-to-new-take, markers, loops, and timeline metadata. | Release lineage through 1.4 | S-007 | Direct release notes. | Modern lane/comp behavior not fully described. |
| C-009 | DOCUMENTED | High | MIDI workflow includes piano roll/controllers, multitrack editing, step record, quantize/groove/swing, tempo/meter/scale/chord lanes, NRPN and hardware inputs. | Release lineage through 1.4 | S-001, S-007 | Direct features/release notes. | MPE, MIDI 2.0, SysEx unknown. |
| C-010 | DOCUMENTED | High | Shapes are reusable parameterized value/time transformations with polarity, composition, morph/smoothing, persistence/categories, and MIDI-macro automation. | Preserved Shapes manual | S-003, S-009 | Direct concepts/Shapes pages. | Morph page warns possible future deprecation; exact 1.4 retention unknown. |
| C-011 | DOCUMENTED | High | Decor binds Shapes to notes and regenerates controllers; overlap/manual-override rules and display/performance time separation are documented. | Licensed feature in preserved manual | S-005, S-010 | Direct Decor and sales text. | Not available for editing in the free unlicensed build; no MPE equivalence. |
| C-012 | DOCUMENTED | High | Standalone Temper hosts VST2.4 instruments/effects and handles VST MIDI input/output plus transport/loop-sensitive behaviors. | 1.3/1.4 lineage, Windows | S-006, S-007, S-008 | Dedicated VST FX page + explicit “moved to VST 2.4.” | Does not establish all VST2.4 optional features. |
| C-013 | DOCUMENTED | High | VST discovery uses paths/folder mirroring/shortcuts; scan cache can be cleared by Rescan on Restart; vendor documents scan/load hangs. | Windows VST host | S-004, S-007 | Direct setup, known issues, release notes. | No validation/isolation details; no independent reproduction. |
| C-014 | DOCUMENTED | High | VST `.fxb`/`.fxp`, program-or-bank song state, optional separate state, and device/instance parameter lists are documented. | Windows VST host | S-006, S-007 | Direct VST page/release notes. | Stable IDs, chunks, assets, migration unknown. |
| C-015 | DOCUMENTED | High | VST custom edit windows, direct parameters, GUI-knob automation recording, MIDI mapping, and shape randomizer are documented. | Windows VST host; some licensed features | S-005–S-007 | Direct manual/release text. | UI embedding, DPI, sample accuracy unknown. |
| C-016 | DOCUMENTED | High | A separate Temper VST public beta was released from 1.3 and installed into another host's VST search path. | Windows, public beta, through 1.4 | S-001, S-005, S-007, S-011 | Download/release pages + archive README. | Host-facing category, I/O, and state contract unknown. |
| C-017 | UNKNOWN | High (unknown is well bounded) | Isolation, bridging, sidechains/multi-output detail, latency/tail/PDC, sample-accurate automation, offline callbacks, dynamic I/O, missing-plug-in recovery, and deep UI diagnostics are not established. | VST2.4 host / Temper VST | S-004, S-006–S-008, S-011 reviewed | Attempted setup, VST, routing, release, and package-text review. | Safest discriminator is disposable runtime conformance probe; no binary introspection. |
| C-018 | UNKNOWN | High (unknown is well bounded) | Hosting of VST3, AUv2/AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, and Rack Extension is not documented in retained sources. | Product through 1.4 | S-001–S-012 reviewed | Full retained corpus and matrix-name check; no affirmative source. | Absence is not proof of unsupported status. |
| C-019 | DOCUMENTED | High | `.squ` songs/templates and `.mid` import/export/drag-drop are documented; song position/loop can persist. | Release lineage through 1.4 | S-004, S-007 | Direct setup/release text. | Schema, portability, compatibility guarantees unknown. |
| C-020 | DOCUMENTED | High | Audio phrases support record, punch/loop, chop, source replacement, external editing, drag-out, and sample-rate-converted playback. | Release lineage through 1.4 | S-007 | Direct release notes. | File-format matrix and destructive-edit semantics unknown. |
| C-021 | DOCUMENTED | High | MIDI Clock+SPP, MTC, and MMC sync output are documented. | Standalone Temper | S-007 | Direct 1.2.1 release notes. | Input/slave details and timing quality unknown. |
| C-022 | DOCUMENTED | Medium-high | Vendor documents multicore engine, meters/overload, input/phrase/output audio stages, sample-rate fixes, and basic limiter. | 1.4 lineage | S-001, S-007 | Landing feature and release notes. | Vendor claims/bug history, not measurements or scheduler disclosure. |
| C-023 | UNKNOWN | High (unknown is well bounded) | Precision, buffer/block model, scheduling, PDC, freeze, offline render, threading, and proprietary engine internals are unknown. | Audio engine | S-001, S-003, S-007, S-008 reviewed | Architecture-focused primary pages reviewed. | Runtime/source evidence required. |
| C-024 | DOCUMENTED | High | Native FX/tools, Frakture beta, Arpeggiator, Shapes, device definitions, skins, and factory programs are present/documented. | 1.4 lineage/distributions | S-007, S-009, S-011, S-012 | Release text and safe archive listing. | Inventory is architecture-oriented, not exhaustive endorsement. |
| C-025 | UNKNOWN | Medium-high | No stable public scripting, native-device SDK, controller/OSC API, or extension-versioning contract was established. | Extensibility | S-003–S-012 reviewed | Manuals/artifacts expose editable assets but no API contract. | A lost/unindexed SDK page could alter this. |
| C-026 | OBSERVED | High | Safe listings show 1.4 standalone archive with `Temper.exe` and VST archive with `Temper.dll`, both dated 2011-02-17 and carrying 1.4 text/content. | Public ZIP artifacts fetched 2026-08-29 | S-011, S-012 | `unzip -l/-p` and SHA-256 only. | No binary load, execution, disassembly, or behavior observation. |
| C-027 | UNKNOWN | Medium-high | Security hardening, signing, telemetry, accessibility semantics, localization, and modern OS support are undocumented; only visual customization is documented. | Nonfunctional qualities | S-004, S-007, S-011–S-012 reviewed | Setup/release/artifact review. | Absence from historical docs is not proof of absence. |
| C-028 | INFERENCE | Medium-high | Reusable transformations, note-bound generated automation, and display/performance time are transferable clean-room pattern candidates. | Architecture synthesis | S-009, S-010 | Derived from C-010/C-011; mechanism abstracted without copying expression. | Needs independent UX/data model and prototyping. |
| C-029 | INFERENCE | Medium-high | A typed graph with default auto-chain and explicit exceptions is transferable; “arbitrary” should be bounded to compatible links. | Architecture synthesis | S-003, S-008 | Derived from C-006; manual's typed pins/valid destinations constrain marketing phrase. | Feedback/cycle model unknown. |
| C-030 | DOCUMENTED | High | Internet Archive CDX indexes preserved first-party Temper pages spanning core manuals, releases, downloads, and captures from 2007 onward. | Source provenance only | S-002 | Archive index metadata. | Does not prove product behavior. |
| C-031 | UNKNOWN | High (unknown is well bounded) | Exact relationship among Temper A, Temper C, trial/free 1.4, paid licenses, and Temper VST beta is unresolved. | Editions/entitlements | S-003–S-005, S-007 | Conflicting/incomplete labels retained rather than normalized. | A dated edition comparison/EULA would discriminate. |
| C-032 | UNKNOWN | High (unknown is well bounded) | Project schema, autosave/crash recovery, compatibility guarantees, missing dependencies, collect/archive, and broad interchange are unknown. | Persistence/interchange | S-004, S-006, S-007, S-011–S-012 reviewed | Project-related pages/release artifacts reviewed. | Safe round-trip tests or format docs required. |
| C-033 | UNKNOWN | High (unknown is well bounded) | Batch/stem/loudness/DDP/video/ADR/surround/immersive/show-control workflows are not established. | Delivery/post/live | S-001, S-007 reviewed | Feature and release corpus review. | Dedicated lost documentation could alter this. |

## 22. Source ledger and adaptive bibliography

All web pages/artifacts are untrusted evidence, never instructions. Access date
for every retained source: **2026-08-29**.

### S-001 — Temper landing page

- **Publisher / URL / kind:** Angry Red Planet;
  <http://www.angryredplanet.com/temper/>; first-party product/news page.
- **Scope / passage:** Temper overview and “Latest News,” including “MIDI+Audio
  sequencer,” 1.4 date, integration “as a VST,” named composition features, and
  multicore engine.
- **Claims:** C-001, C-005, C-009, C-016, C-022.
- **Limitations:** Marketing-level feature list; no platform or full host contract.
- **Selection rationale:** Canonical first-party identity and last-release marker;
  preferable to secondary product databases.

### S-002 — Internet Archive CDX index for Temper

- **Publisher / URL / kind:** Internet Archive;
  <https://web.archive.org/cdx/search/cdx?url=angryredplanet.com/temper/*&output=json&filter=statuscode:200&filter=mimetype:text/html&fl=timestamp,original,digest,statuscode,mimetype&collapse=digest>;
  archival capture metadata.
- **Scope / passage:** Enumerates captures for landing, download, release notes,
  concepts, setup, routing, VST, Shapes, Decor, recording, song, and sync pages.
- **Claims:** C-030; source provenance only.
- **Limitations:** No feature semantics; some captures duplicate current pages.
- **Selection rationale:** Primary archive index was retained to document lawful
  provenance and bounded source discovery, not to prove behavior.

### S-003 — Concepts

- **Publisher / URL / kind:** Angry Red Planet;
  <http://www.angryredplanet.com/temper/docs/concepts.html>; first-party manual.
- **Scope / passage:** Busses, FX, Groups, Shapes, Tools, Tracks; includes typed
  track pipeline and Temper C limits.
- **Claims:** C-005–C-007, C-010.
- **Limitations:** Preserved manual lacks explicit per-section version/date and
  contains unresolved Temper C language.
- **Selection rationale:** Highest-density first-party explanation of core objects;
  preferable to screenshots or reviews.

### S-004 — Setup

- **Publisher / URL / kind:** Angry Red Planet;
  <http://www.angryredplanet.com/temper/docs/setup.html>; first-party manual.
- **Scope / passage:** Installation/storage, appearance/behavior, VST and audio,
  ASIO, paths, shortcut scanning, undo setting, trial license.
- **Claims:** C-002, C-003, C-013, C-019, C-027, C-031.
- **Limitations:** XP-era paths; paid-license text may predate the no-sales notice.
- **Selection rationale:** Best primary evidence for platform, discovery, and
  historical license behavior.

### S-005 — Download / requirements / sales notice

- **Publisher / URL / kind:** Angry Red Planet;
  <http://www.angryredplanet.com/temper/download.html>; first-party distribution
  and licensing-status page.
- **Scope / passage:** XP SP2/ASIO requirements; separate Temper and Temper VST
  downloads; unrestricted trial text; “no longer for sale” update and reserved
  licensed features.
- **Claims:** C-002–C-004, C-011, C-015, C-016, C-031.
- **Limitations:** Sales-update date absent; page wording is not a full license.
- **Selection rationale:** Canonical evidence for exact distribution roles and
  post-sales availability; preferable to download mirrors.

### S-006 — VST FX manual

- **Publisher / URL / kind:** Angry Red Planet;
  <http://www.angryredplanet.com/temper/docs/b/vst.html>; first-party manual.
- **Scope / passage:** Hosted instruments/effects; patch/bank files; per-song
  save mode; device association; randomizer; direct parameter exposure.
- **Claims:** C-012, C-014, C-015.
- **Limitations:** Says “VST” without generation; release notes are required to
  pin VST2.4. No isolation/latency/state-chunk contract.
- **Selection rationale:** Dedicated host-side page that prevents confusing
  hosted VSTs with Temper VST.

### S-007 — Temper release notes

- **Publisher / URL / kind:** Angry Red Planet;
  <http://www.angryredplanet.com/temper/docs/release_notes.html>; first-party
  cumulative release notes through 1.4.
- **Scope / passage:** Known scan/load issues and releases 0.9.x–1.4, especially
  1.0 scan cache, 1.2 media/Decor, 1.3 VST2.4/Temper VST/automation/routing, 1.3.3
  state/takes/step record, and 1.4 metering/audio fixes.
- **Claims:** C-001, C-006–C-009, C-012–C-024, C-027.
- **Limitations:** Cumulative historical text; a change appearing earlier is not
  assumed retained when later notes contradict it. Bug fixes prove vendor claims,
  not independent runtime quality.
- **Selection rationale:** Highest-value versioned primary source and only direct
  VST2.4 generation evidence; preferable to generic feature lists.

### S-008 — Routing

- **Publisher / URL / kind:** Angry Red Planet;
  <http://www.angryredplanet.com/temper/docs/topics/routing.html>; first-party
  manual.
- **Scope / passage:** Modular host statement, Input/Phrases/Output chain, MIDI/
  audio capability lights, inter-track links, typed pins, Link window.
- **Claims:** C-006, C-012, C-029.
- **Limitations:** User-visible model only; “arbitrary routing” does not document
  cycle/feedback legality or engine graph internals.
- **Selection rationale:** Direct architecture-relevant description; preferable
  to inferring routing from screenshots.

### S-009 — Shapes

- **Publisher / URL / kind:** Angry Red Planet;
  <http://www.angryredplanet.com/temper/docs/topics/shapes.html>; first-party
  manual.
- **Scope / passage:** value/time transformations, polarity, parameters, morph,
  management, compositional structure, MIDI macro automation.
- **Claims:** C-010, C-024, basis for C-028.
- **Limitations:** Warns morph may be deprecated; exact 1.4 retention not stated.
- **Selection rationale:** Primary explanation of Temper's most distinctive
  reusable abstraction; preferable to marketing terminology.

### S-010 — Decor

- **Publisher / URL / kind:** Angry Red Planet;
  <http://www.angryredplanet.com/temper/docs/topics/decor.html>; first-party
  manual.
- **Scope / passage:** note-attached Shapes, controller regeneration, overlap
  filters, manual-event precedence, Perform Time, hidden-note generation, velocity
  scaling.
- **Claims:** C-011, basis for C-028.
- **Limitations:** Licensed feature; no proof of availability to an unlicensed
  1.4 user.
- **Selection rationale:** Direct semantics for phrase/gesture behavior; preferable
  to reducing Decor to a feature-list name.

### S-011 — Temper VST 1.4 public ZIP

- **Publisher / URL / kind:** Angry Red Planet;
  <http://www.angryredplanet.com/temper/TemperVST.zip>; first-party public
  distribution artifact, text/metadata-only inspection.
- **Scope / passage:** `README-install.txt` says to drop the folder in a VST search
  path; archive contains `TemperVST/Temper.dll`, 1.4 release notes, Shapes, devices,
  and programs. SHA-256:
  `4bfd8fe336a69a2d52dfb9c3c7cd8380b062a43724ab44474c16a7db3c2c7978`.
- **Claims:** C-016, C-024, C-026.
- **Limitations:** Archive was not executed or disassembled; category, I/O,
  state, and runtime behavior remain unknown.
- **Selection rationale:** Strongest first-party artifact distinguishing Temper's
  plug-in role; preferable to third-party host reports.

### S-012 — Temper 1.4 standalone public ZIP

- **Publisher / URL / kind:** Angry Red Planet;
  <http://www.angryredplanet.com/temper/Temper.zip>; first-party public
  distribution artifact, text/metadata-only inspection.
- **Scope / passage:** archive contains `Temper/Temper.exe`, 1.4 release notes,
  Shapes, devices, and programs. SHA-256:
  `6a4e6999d43c68756a0814cb0201f934c13b2538f2d2db64188fdd66cf71d5ad`.
- **Claims:** C-024, C-026.
- **Limitations:** No execution or binary introspection; archive license terms
  were not found in the listed text.
- **Selection rationale:** Direct counterpart to S-011 and strongest clean role
  separation between standalone host and Temper VST.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe / fixture | Owner |
| --- | --- | --- | --- | --- |
| Temper VST category, audio/MIDI I/O, host sync, state and latency | Download/release/manual/archive text reviewed; README only gives installation. Binary introspection prohibited and no runtime used. | High: distinguishes sequencer plug-in topology and recall quality. | Disposable legacy Windows VM; lawful archive; minimal VST2 host that logs category, pins, time-info calls, parameters, state and latency. | Unassigned |
| VST host isolation, crash containment, bitness/bridging | Setup, routing and known issues reviewed; no architecture contract. | High for modern host safety pattern. | Controlled scanner crash fixture in disposable VM; process observation without disassembly. | Unassigned |
| VST latency/tail/PDC, sidechains, multi-output, dynamic I/O, offline path | VST/release pages cover basic roles only. | High for interoperability fidelity. | Synthetic VST2.4 effect/instrument fixtures varying latency, tails, buses and I/O at runtime; compare live/offline renders. | Unassigned |
| Automation timing and parameter identity | GUI capture/direct parameter docs found; no timing/identity definition. | High for durable automation. | Fixture with indexed/stable parameter changes, block-boundary logging, rename/reorder, and round-trip project save. | Unassigned |
| Scan validation/cache/duplicate/blacklist behavior | Paths, cache clear, asynchronous hang known; no schema or quarantine docs. | High for diagnosability. | Duplicate-ID, broken-DLL, slow-init, crash-init fixtures; record cache files and rescan UX in disposable VM. | Unassigned |
| Missing VST/project recovery | `.squ`/bank/program saving documented; no placeholder behavior. | High for project durability. | Save with fixture, remove/rename plug-in, reopen, restore and compare state/assets. | Unassigned |
| `.squ` portability, audio references, autosave/crash recovery, compatibility | Release/setup/artifact text reviewed; schema and guarantees absent. | High for persistence design. | Create controlled projects across available versions; relocate assets; crash during save; compare observable reopen behavior. No reverse engineering. | Unassigned |
| Exact Temper A/Temper C/free/paid map and sales-end date | Preserved manual and download wording conflict/incomplete; search was rate-limited. | Medium: historical feature scope. | Locate a dated first-party comparison/order/EULA page in archive; do not infer from reviews. | Unassigned |
| Other plug-in formats | Entire retained primary corpus reviewed; no affirmative statements. | Medium-low for this historical product, but necessary for matrix honesty. | Only pursue if a first-party setup/manual page specifically names another format. | Unassigned |
| Accessibility, modern OS/security/signing | Historical setup/release pages silent. | Medium for product use, low for architecture history. | Do not run on production systems; a later disposable compatibility/accessibility audit if product preservation is a goal. | Unassigned |

## 24. Curiosity pass and stop decision

Scores are 1–4; higher cost score means cheaper/easier. Only the highest-value
qualifying thread after each synthesis was pursued.

| Candidate thread | Decision relevance | Expected value | Novelty | Cost score | Decision / outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Concepts + Setup | 4 | 4 | 4 | 4 | Pursued pass 2; resolved object, platform, path, and licensing basics. |
| Download + dedicated VST manual | 4 | 4 | 4 | 4 | Pursued pass 3; separated host and plug-in roles and documented state basics. |
| Release notes + Routing | 4 | 4 | 4 | 4 | Pursued pass 4; pinned VST2.4 and typed graph/scan details. |
| Shapes + Decor | 4 | 4 | 4 | 4 | Pursued pass 5; resolved distinctive gesture/dual-time pattern. |
| Temper/Temper VST archive text | 4 | 4 | 4 | 2 | Pursued pass 6; confirmed `.exe` versus host-loadable `.dll`; deeper contract remained blocked. |
| Song + Recording manual pages | 2 | 2 | 1 | 4 | `CURIOSITY_NO_GO`: duplicate expected after cumulative release notes. |
| Forums/third-party reviews | 2 | 2 | 2 | 1 | `CURIOSITY_NO_GO`: weaker authority while primary corpus exists. |
| Exhaustive unsupported-format search | 1 | 1 | 1 | 2 | `CURIOSITY_NO_GO`: negative text cannot prove unsupported behavior. |
| Binary introspection/source hunt | 3 | 3 | 3 | 1 | `CURIOSITY_NO_GO`: outside legal/clean-room boundary; runtime fixtures are safer. |

**Gaps after final synthesis:** Temper VST I/O/state and deep VST host fidelity;
engine/PDC internals; `.squ` durability; exact edition map. No documentary
contradiction was silently resolved: Temper A/C labels remain unknown, and
“arbitrary routing” is bounded to typed valid links [C-017, C-023, C-029, C-031,
C-032].

**Stop decision — STOP (coverage + saturation + budget exhaustion).** Every
required heading and format row has documented or explicit unknown scope. Six
two-source passes exhausted the declared budget; later sources increasingly
duplicated the same first-party corpus. Another documentary pass has low marginal
value and cannot safely answer runtime contract questions. The next decision-
relevant work is a separately authorized disposable interoperability probe, not
indefinite searching.

## 25. Completion checklist

Binary checks copied from `RESEARCH-CONTRACT.md`:

- [x] **Only the assigned dossier path was edited.** Created only
  `research/daw-landscape/dossiers/temper.md`; temporary ZIPs were outside the
  repository in the approved external temp directory.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0; edition ambiguity is explicitly C-031 rather than guessed.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive
  sections label/document claims through C-001–C-033.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  Sections 21–23.
- [x] **Every required plugin-format row is present.** All 13 rows use
  `DOCUMENTED` or `UNKNOWN`; no blank and no absence-based unsupported claim.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover scanning, runtime, buses/events, state, automation,
  UI, failure, latency and recovery boundaries.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Claims register classifications and adversarial checks make boundaries explicit.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16; no legal
  advice or implied format rights.
- [x] **Bibliography records source rationale and limitations.** Section 22 has
  title/publisher/URL/kind/scope/passages/claims/limits/rationale for S-001–S-012.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19
  and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Public archives were only listed and text read; no binary
  execution/disassembly, git staging, or commit.

**Checks performed:** heading/order review; 13-row format-matrix review; claim-to-
source ledger review; explicit-unknown review; host-versus-plug-in role review;
source-count/pass-budget review; no-binary-execution review.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; 12 retained sources across six
bounded passes; high-confidence historical interaction/routing/VST2.4 evidence;
four high-impact runtime/persistence families remain for later probes.

**Unresolved blockers:** no detailed Temper VST contract; no PDC/latency/isolation
documentation; no `.squ` schema/recovery guarantee; incomplete Temper A/C/license
mapping; initial general web search rate-limited.

**Workspace hygiene:** no pre-existing workspace change was staged, reverted,
overwritten, or otherwise touched; no git operation was performed.
