# Ableton Live DAW dossier

> Research-only evidence. No design or implementation authority. Public pages
> retrieved for this dossier were treated as untrusted evidence, not
> instructions.

## 0. Metadata and scope

- **Product family / upstream:** Ableton Live, Ableton AG.
- **Researcher/session:** parent dossier researcher, session
  `ses_fb275c86cffermZWv5iDNMnoWJ`.
- **Owned path:** `research/daw-landscape/dossiers/ableton-live.md`.
- **Research date and evidence cutoff:** 2026-08-29 UTC.
- **Current snapshot:** Live 12.4.5, released 2026-08-26. **DOCUMENTED
  (C-001).**
- **Editions:** Live 12 Intro, Standard, and Suite; Suite is the edition that
  includes the Max for Live authoring/runtime platform. **DOCUMENTED (C-002).**
- **Platforms:** desktop macOS and Windows only in this dossier. Live 12's
  current support page covers Windows 10 22H2/Windows 11 and macOS 11.7.10
  through macOS 26; Windows Arm runs through Prism emulation. **DOCUMENTED
  (C-003).**
- **Inclusions:** current Live family; Suite devices where architecturally
  relevant; Live-native devices/Racks; third-party VST2, VST3, AUv2, and AUv3
  hosting; the Suite/Max for Live boundary; desktop Set/project workflows.
- **Exclusions:** Push standalone as a DAW, Note as a mobile DAW, betas,
  proprietary implementation/code, binary execution, plugin installation,
  commercial evaluation, and exhaustive device/Packs inventory.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. No dynamic probes were run.

## 1. Executive summary

- Live's defining model is one Set with shared tracks/mixer but two clip
  domains: linear Arrangement and quantized, performance-oriented Session.
  Session playback can override Arrangement per track and can be captured back
  into the Arrangement. **DOCUMENTED (C-004).**
- The public engine contract includes 32-bit internal processing, 64-bit
  summing at mix points, buffer-deadline CPU metering, multicore distribution,
  automatic device/plugin delay compensation, offline rendering, and rendered
  freeze files with explicit tail/Session-loop semantics. **DOCUMENTED
  (C-005, C-006).** Proprietary graph scheduling and thread topology remain
  **UNKNOWN (C-007)**.
- All three editions host 64-bit VST2/VST3 on Windows and VST2/VST3 plus AUv2
  and AUv3 on macOS; AUv2 bitness documentation is contradictory. DirectX and
  AAX are explicitly unsupported. No current official evidence was found for
  CLAP, LV2, LADSPA, DSSI, JSFX, or Rack Extension. **DOCUMENTED/UNKNOWN
  (C-014, C-015).**
- Hosting depth goes beyond format recognition: configurable discovery paths,
  a resettable scan database, scan-crash suppression, native/floating plugin
  UIs, exposed parameter panels, automation, sidechains, multi-output routing,
  plugin-owned binary state blocks, and PDC are documented. **DOCUMENTED
  (C-016 through C-023).** Runtime sandboxing, duplicate identity, dynamic I/O,
  sample-accurate plugin automation, tail APIs, headless behavior, and durable
  missing-plugin placeholders are **UNKNOWN (C-024, C-025)**.
- Max for Live is not another binary plugin format in this dossier. It is a
  Suite-bundled, device-oriented extension substrate with instruments/effects,
  patch editing, external connectivity, and bounded access to the Live Object
  Model. **DOCUMENTED (C-026).** Its process/security boundary is **UNKNOWN
  (C-027)**.
- **Confidence:** high for current identity, user model, supported formats,
  scanning UX, routing, state ownership, PDC, and persistence; medium for
  architecture lessons; low/unknown for proprietary isolation and complete
  host-contract conformance.

## 2. Product identity, history, and market position

Live 12.4.5 is a maintained commercial desktop music-production and live-
performance DAW from Ableton AG. The current release and comparison pages
position Intro, Standard, and Suite as one family with increasing track,
content, device, and Pack breadth. Intro is limited to 16 audio/MIDI tracks,
16 scenes, and two returns; Standard and Suite list unlimited audio/MIDI tracks
and scenes and 12 returns. Suite adds the broadest device/content inventory,
Max for Live, and current Suite-only stem separation. **DOCUMENTED (C-001,
C-002).**

The maintained platform boundary is macOS/Windows desktop, not Linux or
mobile/web. Minimum hardware and supported OS details are version-sensitive;
the dedicated current system-requirements page is preferred over stale text
captured in the larger edition page. **DOCUMENTED (C-003).** Historical
lineage beyond the current Live 12 family was not pursued because it would not
change the hosting decision. **CURIOSITY_NO_GO (C-036).**

## 3. Workflow and conceptual model

A Live Set is the song/session document inside a Project folder. Clips are the
primary musical units. Arrangement contains clips on a linear timeline;
Session contains independently launchable clips organized by tracks and
scenes. The views hold distinct clip collections but share tracks, mixer, and
device chains. A track plays at most one of its Session or Arrangement clips;
Session takes precedence until Back to Arrangement is invoked. Session
performance can be recorded into Arrangement. **DOCUMENTED (C-004).**

Tracks carry audio or MIDI clips and typed device chains. Audio clips reference
sample files and normally apply non-destructive playback/warp settings; MIDI
clips embed notes and controller envelopes. MIDI-track chains flow MIDI effects
to an instrument and then audio effects. Racks add parallel chains, key/
velocity/chain zones, macros, and reusable presets. **DOCUMENTED (C-008).**

This is neither a tracker nor a free-form modular graph. It is a track/device-
chain model with an exposed routing patchbay and a native device/Rack layer.
Max for Live adds patching and object-model control without documenting Live's
private engine implementation. **INFERENCE (C-035)**; plausible alternative:
internal scheduling could be graph-oriented in ways the user model does not
reveal.

## 4. Publicly documented architecture

Public documentation establishes only these internal boundaries:

- 32-bit internal audio processing with 64-bit summing at each mix point;
  signals between track devices are stereo. **DOCUMENTED (C-005).**
- Processing is organized around audio buffers; the CPU meter compares buffer
  compute time with buffer playback time. Work from instruments, effects, and
  I/O can be distributed across cores/processors. **DOCUMENTED (C-006).**
- Third-party scan data is stored separately in per-user
  `Live-plugins-1.db` as of Live 12.1. **DOCUMENTED (C-016).**
- Max devices access a bounded hierarchy through the Live Object Model using
  get/set/call/observe and real-time parameter-control objects; not all Live
  parameters are exposed. **DOCUMENTED (C-026).**

Audio-graph ownership, render-node topology, thread affinity, lock-free
mechanisms, plugin process topology, IPC, cache schema, Set schema, and service
boundaries are proprietary or absent from public evidence and remain
**UNKNOWN (C-007, C-024, C-025, C-027)**. No process isolation is inferred
from product behavior.

## 5. Audio engine

Live documents 32-bit internal processing, 64-bit summing at single mix points,
sample-updated volume automation, neutral same-rate rendering under stated
conditions, and 32-bit internal recording/freeze files. Routing and bypass of
VST/AU effects are documented as neutral under the stated conditions; bypassed
effects can retain latency to preserve compensation. **DOCUMENTED (C-005).**

The CPU meter is an audio-buffer deadline measure, can expose current/average
load, and can show per-track performance impact. Disk and CPU overloads can
produce dropouts; real-time external-hardware rendering can automatically
restart on detected dropouts. Live distributes device/I/O work across cores,
but the exact scheduler is not public. **DOCUMENTED (C-006); UNKNOWN (C-007).**

Automatic device delay compensation covers Live and plugin instruments/effects,
including returns. Reduced Latency When Monitoring trades input responsiveness
against synchronization with compensated tracks. Reported plugin latency can
make the UI/playback sluggish. **DOCUMENTED (C-022).**

Freeze renders each Session clip plus the Arrangement, reducing real-time
device computation. Arrangement freezes retain rendered effect tails; Session
freeze is limited to two loop cycles and can cut later tails. Arrangement
automation is rendered, while Session freezes snapshot Arrangement-position
1.1.1 parameter values. Hardware-dependent chains freeze/render in real time;
normal rendering is offline. **DOCUMENTED (C-005, C-006).** Oversampling is
device-specific; universal host oversampling, plugin block sizes, denormal
handling, offline equivalence, and plugin tail-report contracts are **UNKNOWN
(C-025)**.

## 6. Tracks, timeline, clips, and editing

Live supplies audio and MIDI tracks, return tracks, a Main track, nested Group
Tracks, Arrangement lanes, Session slots/scenes, linked-track editing, multiple
take lanes and comping, time-signature changes, fades/crossfades, split/
consolidate, and real-time Warp modes. Clips reference underlying media and most
clip manipulation is non-destructive; the manual separately flags destructive
external sample editing and non-neutral consolidate/warp cases. **DOCUMENTED
(C-008, C-009).**

Undo History covers actions since opening the Set but is not saved when the Set
closes. Explicit ripple modes, playlist-style version control, and a notation
timeline were not established and remain **UNKNOWN (C-010)** rather than being
declared absent.

## 7. MIDI, sequencing, notation, and expression

Live provides MIDI record/overdub/capture, step input, piano-roll editing,
quantization, velocity/probability, scale-aware transformations/generators,
per-clip controller envelopes, external MIDI routing, MIDI Clock send/receive,
MTC receive, and Ableton Link. MPE recording/editing and MPE-capable devices are
part of all three current editions. **DOCUMENTED (C-011).**

The current evidence does not establish MIDI 2.0/UMP hosting, universal SysEx
capture/editing, notation/MusicXML, or per-format plugin note-expression
fidelity. Those are **UNKNOWN (C-010, C-025)**. General MPE support is not
treated as proof that every hosted plugin receives complete expression data.

## 8. Routing, mixer, automation, and control

The track I/O section is the visible patchbay. Tracks route external/internal
audio or MIDI, tap Pre FX/Post FX/Post Mixer points, feed Group/return/Main
mixing, resample Main, route sidechains, address Rack chains, and tap plugin
instrument outputs. Multi-timbral plugins can receive per-channel MIDI from
additional tracks and expose auxiliary audio outputs to tracks or External
Instrument devices. **DOCUMENTED (C-012, C-020).**

Mixer and device controls use Arrangement or Session-clip breakpoint
automation; clip envelopes may be unlinked from clip loops. Parameters can be
MIDI/key mapped; controller scripts and Push integration add device-specific
control. Max for Live can observe/change public Live objects, connect OSC or
hardware, and use real-time parameter remote control with distinct undo/
automation behavior. **DOCUMENTED (C-013, C-026).**

Feedback-loop policy, a general VCA object, native object-based immersive
mixing, OSC outside M4L, and sample-accurate plugin-parameter automation are
**UNKNOWN (C-025)**. Suite includes a Max-based Surround Panner, but that does
not prove a system-wide immersive bus architecture.

## 9. Recording, comping, and media handling

Audio/MIDI tracks support armed Arrangement and quantized Session recording,
input monitoring (`In`/`Auto`/`Off`), punch/loop workflows, MIDI overdub, take
lanes, linked-track edits, auditioning, and comp construction. Edition evidence
documents multitrack recording up to 32-bit/192 kHz. **DOCUMENTED (C-009).**

Live reads common uncompressed/compressed audio formats, streams decoded audio
from disk, maintains a decoding cache and `.asd` analysis data, references
samples from clips, and can locate/relink or collect external media. It imports
and exports Standard MIDI files and can import/export video with installed
encoders. **DOCUMENTED (C-028).** Conform/proxy systems, rich production
metadata, and post-production reel management remain **UNKNOWN (C-010)**.

## 10. Instruments, effects, content, and native devices

The native device model has typed MIDI effects, instruments, and audio effects
arranged serially or inside Instrument/Drum/Effect Racks with parallel chains,
zones, macros, and presets. Current edition counts are 8/12/21 instruments and
27/36/59 audio effects for Intro/Standard/Suite respectively, with increasing
Packs/content. **DOCUMENTED (C-002, C-008).**

Suite is architecturally relevant for its larger synthesizer/sampler/effect
set, local stem separation, and Max for Live. Max devices appear beside native
instruments/effects in Live's Browser, but `.amxd` remains a distinct native
extension artifact. Max for Live can create/edit instruments, MIDI effects,
audio effects, performance/visual tools, and integrations; it is not evidence
that Live exposes its private engine as an SDK. **DOCUMENTED (C-026).**

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED: 64-bit host support; Apple-silicon Universal Live requires native plugin or Live under Rosetta | DOCUMENTED: 64-bit host support | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | DOCUMENTED: Intro/Standard/Suite, Live 12 | DOCUMENTED: supported, but format owner discontinued VST2; legacy/legal risk | C-014, C-034; S-002, S-003, S-004, S-005, S-019 |
| VST3 | DOCUMENTED: 64-bit; native Apple-silicon plugin required in Universal Live | DOCUMENTED: 64-bit | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | DOCUMENTED: all editions; since Live 10.1 | DOCUMENTED: current cross-platform plugin choice; SDK currently MIT, trademarks/packaging separate | C-014, C-034; S-002–S-005, S-020 |
| AUv2 | DOCUMENTED: supported; current bitness contradictory (format table says 64/32, other current guidance says only 64-bit plugins) | DOCUMENTED: no, macOS-only | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | DOCUMENTED: all Live 12 editions | DOCUMENTED: macOS-only; Waves AU specifically excluded by vendor guidance | C-014, C-033; S-002, S-003, S-005, S-006 |
| AUv3 | DOCUMENTED: 64-bit | DOCUMENTED: no, macOS-only | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | DOCUMENTED: all Live 12 editions; introduction stated as 11.2 in two sources and 11.3 in one | DOCUMENTED/UNKNOWN: current support clear; historical introduction contradictory | C-014, C-033; S-002, S-003, S-005, S-009 |
| AAX | DOCUMENTED: unsupported | DOCUMENTED: unsupported | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | DOCUMENTED: current format support page | DOCUMENTED: no AAX host support | C-015; S-005 |
| CLAP | UNKNOWN: no current official entry found | UNKNOWN: no current official entry found | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | UNKNOWN | UNKNOWN: absence from one support list is not proof of non-support | C-015; S-005 |
| LV2 | UNKNOWN: no current official entry found | UNKNOWN: no current official entry found | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | UNKNOWN | UNKNOWN: no retained official evidence | C-015; S-005 |
| LADSPA | UNKNOWN: no current official entry found | UNKNOWN: no current official entry found | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | UNKNOWN | UNKNOWN: no retained official evidence | C-015; S-005 |
| DSSI | UNKNOWN: no current official entry found | UNKNOWN: no current official entry found | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | UNKNOWN | UNKNOWN: no retained official evidence | C-015; S-005 |
| JSFX | UNKNOWN: no current official entry found | UNKNOWN: no current official entry found | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | UNKNOWN | UNKNOWN: no retained official evidence | C-015; S-005 |
| DirectX/DXi | NOT_APPLICABLE: Windows-specific format | DOCUMENTED: DirectX unsupported; DXi not separately stated | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | DOCUMENTED/UNKNOWN: current DirectX statement; DXi granularity unknown | DOCUMENTED/UNKNOWN: do not generalize beyond explicit DirectX statement | C-015; S-005 |
| Rack Extension | UNKNOWN: no current official entry found | UNKNOWN: no current official entry found | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | UNKNOWN | UNKNOWN: no retained official evidence | C-015; S-005 |
| Product-native/other | DOCUMENTED: Live devices/Racks; `.amxd` Max devices | DOCUMENTED: Live devices/Racks; `.amxd` Max devices | NOT_APPLICABLE: Live unavailable | NOT_APPLICABLE: desktop Live only | DOCUMENTED: Live devices all editions; Max for Live platform in Suite | DOCUMENTED: Max for Live is a bounded native extension layer, not a third-party binary format | C-002, C-026; S-002, S-007, S-008, S-022 |

### 11.2 Discovery, scanning, validation, and recovery

VST/AU sources are enabled per format. macOS uses standard system/user AU,
VST2, and VST3 locations plus separate custom VST folders; Windows uses a
selected VST2 folder and the VST3 system folder plus an optional separate
custom folder. Scanned plugins appear in the Browser. Live 12.1+ stores scan
data in `Live-plugins-1.db`; toggling a source or Rescan refreshes it, and
Alt/Option+Rescan deletes/rebuilds the plugin database. Alt/Option at launch
temporarily skips scanning. **DOCUMENTED (C-016).**

If a VST crashes during scanning, Live identifies it on relaunch and can rescan
or make it unavailable; a second scan crash automatically makes it unavailable
until reinstallation. Troubleshooting also recommends isolated blank-Set tests,
plugin-disabled startup, current compatible binaries, crash reports, and
vendor escalation. **DOCUMENTED (C-017).** This is failure suppression, not a
documented validator service, signature verifier, or quarantine sandbox.
Duplicate identity, cache keys, AU validation details, version coexistence,
code-signing checks, and deterministic migration matching are **UNKNOWN
(C-024)**.

### 11.3 Runtime isolation and compatibility

The official sources do not state whether plugins execute in-process, in a
shared helper, or per-plugin process. Scan/load/use crashes can terminate Live,
and recovery guidance disables plugins globally to isolate a culprit.
Therefore sandboxing and crash containment are **UNKNOWN (C-024)**; the bounded
inference is that no containment guarantee can be relied on, not that every
format necessarily runs in-process.

On Apple silicon, Universal Live recognizes only native Apple-silicon VST2/
VST3; Intel-only VST generally requires running Live itself under Rosetta.
Some Intel AU devices may use Apple's compatibility service or still require
Rosetta. Windows Arm Live is documented under Prism, but hosted-plugin
architecture behavior is **UNKNOWN**. Live supports no 32-bit VST bridge.
**DOCUMENTED/UNKNOWN (C-018).**

### 11.4 Host/plugin processing contract

Plugin instruments receive MIDI and output audio; plugin effects fit audio
paths. VST supports direct MIDI output while AU does not. Plugins that expose
sidechains receive a selectable internal routing point. Multi-timbral plugins
can receive MIDI by channel, and auxiliary outputs can be tapped by audio
tracks or External Instrument. **DOCUMENTED (C-019, C-020).**

Live compensates plugin-reported latency and removes bypassed VST/AU effects
from signal flow while retaining needed compensation. Normal renders are
offline; external hardware forces graph-traced real-time rendering. Effects
with tails remain active until calculations complete, but a formal plugin tail
query/flush contract was not documented. Dynamic bus changes, event-bus
enumeration, per-format MPE fidelity, MIDI 2.0, sample-accurate plugin
automation, render-ahead, headless render, and offline/real-time equivalence are
**UNKNOWN (C-022, C-025)**.

### 11.5 Parameters, automation, state, presets, and project recall

Plugins with up to 64 modifiable parameters initially receive a Live slider
panel; larger sets start empty and users add published parameters in Configure
Mode. Unpublished parameters cannot be added. Configured parameters are
instance-specific and saved with the Set; continuous exposed parameters can be
automated/modulated and MIDI/macro mapped. Exact stable parameter IDs, range/
text fidelity, gesture protocol, and automation sample accuracy are
**UNKNOWN**. **DOCUMENTED/UNKNOWN (C-021, C-025).**

Live stores plugin state in a reserved binary block in the Set that only the
plugin can read/write. VST2 has host bank/program UI; AU presets can appear in
the Browser; VST3/AU/VST preset handling differs. State recall can fail with
outdated/incompatible plugins or damaged AU cache. Cross-OS transfer requires
the same VST/VST3 plugin/version; AU tracks should be rendered. Plugin binaries
are never collected into Projects. **DOCUMENTED (C-023).**

Set references to plugins are documented, but whether a missing plugin leaves a
durable, rebindable placeholder preserving state/automation is not. Migration
across VST2/VST3/AU variants is not promised; Ableton advises one format per
plugin per Set. These are **UNKNOWN (C-025)** and require fixture tests.

### 11.6 UI, diagnostics, and failure modes

The host exposes a compact parameter panel and opens the vendor UI in a
separate floating window. Settings cover auto-open, multiple windows, and
auto-hide by selected track. Changes synchronize between vendor and Live
panels. Plugin UI embedding inside Live, DPI/scaling contracts, headless UI,
keyboard accessibility, and GPU isolation are **UNKNOWN (C-021, C-025)**.

Diagnostics include Browser presence, scan progress, status messages, crash
reports/system logs, the separate scan database, plugin-disabled launch,
source toggles/rescan/deep-rescan, and scan-crash suppression. User recovery is
diagnostic rather than transparent per-plugin restart. **DOCUMENTED (C-016,
C-017, C-030).**

## 12. Extensibility and integration

Racks/macros and MIDI/key mapping are the shallow native customization layer.
Control-surface scripts and Push integrate hardware. Max for Live is the deep
Suite boundary: users create/edit Max MIDI effects, instruments, audio effects,
visual/performance tools, hardware/OSC connections, and JavaScript/Max logic.
The Live Object Model exposes selected application, Set, track, clip, scene,
device, mixer, and control-surface objects with canonical paths, properties,
notifications, and functions. Not all Live parameters are available.
**DOCUMENTED (C-013, C-026).**

API calls and observation differ from signal-rate `live.remote~`, which controls
mappable parameters without adding automation/undo in the same way. Object IDs
are device-scoped and need path resolution after load. Compatibility promises,
semantic versioning, M4L sandboxing, permissions, signing, and a general native
C/C++ Live SDK are **UNKNOWN (C-027)**.

## 13. Project format, persistence, interoperability, and collaboration

The `.als` Set stores clips, positions, device/control settings, plugin-owned
binary state, and references; the Project folder groups related Sets, media,
presets, and recordings. `.alc`, `.adg`, `.adv`, `.amxd`, `.asd`, and `.alp`
serve reusable clip, device, Max-device, analysis, and Pack roles. Collect All
and Save copies eligible media and Max devices, not third-party plugins.
**DOCUMENTED (C-023, C-028, C-029).**

Missing sample references go offline/silent and can be manually or
automatically relinked. Saved Projects keep ten recent saved Set versions after
the second save. Crash recovery normally uses an undo file and can be retried
with same-version `BaseFiles`, `CrashRecoveryInfo.cfg`, and `Undo` artifacts;
unsaved recorded audio may be lost. Undo History itself is not persisted after
close. **DOCUMENTED (C-029, C-030).**

Interchange evidenced here includes audio/stems, Standard MIDI, video, Live
Clips/Packs/Sets, cross-OS VST/VST3 Sets, Ableton Note Set compatibility, and
Link/Link Audio. No retained official evidence established AAF, OMF, ADM,
MusicXML, DAWproject, source-control semantics, or simultaneous Set co-editing;
these remain **UNKNOWN (C-010)**.

## 14. Delivery, live, post-production, and specialized workflows

Export can render Main, individual tracks, selected tracks, or one track;
options include return/Main effects, loop-tail prepass, mono, normalization,
sample rate, PCM/FLAC/WAV/AIFF, MP3, dither, and video. Hardware routes trigger
real-time rendering; other paths normally render offline. Freeze, Bounce,
resampling, and Suite stem separation support handoff and performance
preparation. **DOCUMENTED (C-006, C-028).**

Session clip launching, scenes, follow actions, quantization, MIDI/Link sync,
tempo following, controller mapping, and Link Audio make live performance a
first-class workflow. **DOCUMENTED (C-004, C-011, C-013).** DDP, ADR cueing,
built-in notation, batch queues, native ADM/object delivery, and deep conform
are **UNKNOWN (C-010)**; Live should not be treated as a post-production
reference from the retained evidence.

## 15. Performance, reliability, security, and accessibility

CPU/disk meters, per-track impact, multicore work distribution, track freeze,
automatic effect suspension after tails, dropout detection for real-time
render, scan cache reset, crash reports, saved backups, and undo-based crash
recovery are documented. **DOCUMENTED (C-006, C-016, C-017, C-030).** Scaling
remains hardware/graph dependent; theoretical device counts do not establish a
tested maximum.

Live 12 supports screen readers and extensive keyboard navigation on macOS and
Windows, tested with VoiceOver, NVDA, Narrator, and JAWS. Automation, modulation,
MPE, audio-clip edge fades, advanced devices, and controller integration retain
documented accessibility gaps. **DOCUMENTED (C-031).** Third-party plugin UI
accessibility remains plugin/host dependent and **UNKNOWN (C-025)**.

Plugins are untrusted executable dependencies, yet no public source located a
permission model, sandbox, per-plugin process, signature policy, or automatic
restart. Whole-Live crash guidance and scan suppression show the operational
trust boundary but not its internal topology. Telemetry detail, notarization
checks, rollback policy, and M4L permissions remain **UNKNOWN (C-024, C-027).**

## 16. Licensing, ecosystem, and implementation constraints

Live is proprietary commercial software licensed under Ableton's EULA. The
EULA reserves Ableton IP/trademarks/content, restricts reverse engineering and
redistribution subject to law, uses account-based activation where applicable,
and leaves included open-source components under their own licenses. This
dossier grants no right to copy Live formats, assets, UI expression, devices,
or trademarks. **DOCUMENTED (C-032).**

Steinberg has discontinued VST2 and directs migration to VST3; current Live
still hosts VST2, creating a legacy support/licensing risk. The official VST3
SDK license file retrieved at cutoff is MIT. Neither fact supplies entity-
specific VST2 rights, trademark permission, signing/notarization compliance,
or permission to redistribute third-party plugins. **DOCUMENTED/UNKNOWN
(C-034).**

Audio Units are Apple-platform formats; platform SDK terms, signing,
notarization, and store constraints require separate current legal/engineering
review. AAX is explicitly not hosted, so Avid certification is not a Live
implementation dependency. Licenses for community Max devices/Packs and
third-party plugin assets remain their owners' concern. **UNKNOWN (C-034).**
This is not legal advice.

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** The shared-track dual-view model joins composition and live
performance without duplicating mixer/device state; the typed device chain and
routing patchbay make complex sidechain/multi-output setups user-visible; scan
failure suppression and deep rescan are diagnosable; freeze/render semantics
are explicit; Max for Live provides an extension plane distinct from binary
plugin formats. **DOCUMENTED/INFERENCE (C-004, C-012, C-016, C-026, C-035).**

**Liabilities.** The plugin trust boundary lacks documented runtime isolation;
cross-platform recall depends on matching plugin format/version; state is an
opaque plugin-owned block; native/AU/VST variants do not transparently migrate;
accessibility is incomplete in advanced editing and devices; VST2 is legacy.
**DOCUMENTED/UNKNOWN (C-023 through C-025, C-031, C-034).**

**Architecture lesson.** Live is strongest as evidence for product-facing
models and failure UX, not proprietary scheduler internals. Adapt dual workflow,
typed chain, explicit routing, cache rebuild, frozen fallback, and bounded
extension concepts clean-room; require prototypes before adopting plugin-
contract assumptions. **INFERENCE (C-035).**

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites / tradeoffs / adaptation risk |
| --- | --- | --- | --- | --- |
| CANDIDATE | Linear writing and improvisation diverge | Shared track/mixer graph with separate linear and launch-grid clip domains plus explicit precedence/capture | C-004 | Requires deterministic arbitration and clear UI state; risk of hidden playback overrides |
| CANDIDATE | Device graphs become opaque | Typed MIDI-effect → instrument → audio-effect chains with explicit patchbay taps | C-008, C-012 | Needs graph validation and routing diagnostics; parallel/feedback semantics must be designed independently |
| CANDIDATE | Plugin scanning can block product startup | Separate scan cache, source toggles, skip-scan launch, normal/deep rescan, culprit suppression | C-016, C-017 | Cache versioning and safe scanner isolation should exceed Live's documented guarantees |
| CONDITIONAL | Heavy sessions miss deadlines | Per-track impact meters plus reversible freeze artifacts with explicit tail/automation semantics | C-005, C-006 | Freeze provenance/invalidation is complex; Session-vs-linear semantics must be unambiguous |
| CANDIDATE | Extensions need more than binary DSP formats | Bounded product object model plus device-oriented extension runtime separate from VST/AU | C-026 | Requires capability/security/version model absent from public Live evidence; do not copy API expression |
| CANDIDATE | Projects outlive dependencies | Explicit asset references, collect/relink tools, opaque plugin-state preservation, rendered fallback | C-023, C-028, C-029 | Must add durable missing-plugin placeholder and migration tests; plugin binaries cannot be bundled casually |
| CONDITIONAL | Low-latency monitoring conflicts with global alignment | User-visible compensated and reduced-monitor-latency modes | C-022 | Requires rigorous timestamp/PDC testing and warnings for out-of-sync returns |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **CURIOSITY_NO_GO — clone `.als`/`.amxd` formats or UI/device expression:**
  rejected by proprietary/EULA and clean-room boundaries; reopen only with a
  separately authorized interoperability mandate. **C-032.**
- **CURIOSITY_NO_GO — infer full VST3 conformance from “supports VST3”:**
  rejected because dynamic I/O, parameter identity, sample-accurate automation,
  tails, headless rendering, and migration remain unproved. **C-025.**
- **CURIOSITY_NO_GO — treat reference retention as a missing-plugin
  placeholder:** no official recovery/rebind contract was located. **C-025.**
- **CURIOSITY_NO_GO — infer sandboxing or in-process execution from crashes:**
  crash guidance proves failure exposure, not process topology. **C-024.**
- **CURIOSITY_NO_GO — exhaustive Suite device/Packs census:** edition counts
  and extension boundary are sufficient; inventory adds cost without changing
  architecture. **C-002, C-026.**
- **CURIOSITY_NO_GO — community crash anecdotes or device internals:** useful
  only for future fixture selection, not vendor architecture proof.
- **CURIOSITY_NO_GO — historical lineage and market-share estimates:** low
  decision relevance for current host architecture. **C-036.**
- **CURIOSITY_NO_GO — binary execution/cache or Set reverse engineering:**
  outside this documentary wave and unnecessary to record the unknowns.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary result | Counterevidence/contradiction | Later discriminating probe |
| --- | --- | --- | --- |
| H1: Live uses one track/mixer model across linear and launcher workflows | Supported (C-004) | Clip collections and playback precedence differ by view | Round-trip Session capture with automation/routing fixtures |
| H2: “VST3 supported” implies complete host contract | Rejected (C-025) | Manuals prove selected features only; many format capabilities remain unknown | VST3 fixture matrix for buses, notes, params, state, latency, tails, UI, restart |
| H3: scan-crashing plugins are permanently blacklisted | Partially supported (C-017) | “Unavailable until reinstalled,” not a documented permanent blacklist | Version/update/reinstall/rescan identity fixture |
| H4: plugins are sandboxed | Not established (C-024) | Whole-Live scan/use crash and disable-at-launch guidance; topology unstated | Crash/hang fixtures plus process-tree observation in disposable VM |
| H5: plugin state is host-normalized | Rejected (C-023) | State is a plugin-readable/writable reserved binary block | Cross-version state fixtures with byte-independent behavioral comparison |
| H6: AUv2 current bitness is unambiguous | Failed (C-033) | Official format table says 64/32; other current guidance says only 64-bit since Live 10.1 | Vendor clarification or clean macOS 32-bit AU scan test |
| H7: AUv3 introduction version is unambiguous | Failed historically (C-033) | Official pages say 11.2 and 11.3; Live 12 support agrees | Archived release notes; low decision value, not pursued |
| H8: missing plugins retain durable, rebindable placeholders | Unknown (C-025) | References/state are documented, placeholder UX is not | Save/open/remove/reinstall/format-change fixture retaining automation/state |
| H9: plugin automation is sample-accurate | Unknown (C-025) | Only volume automation is documented sample-updated | Impulse/step parameter fixture at varied buffer sizes and offline render |
| H10: current OS scope from edition page is reliable | Corrected (C-003) | Edition capture showed older macOS ceiling; dedicated support page reaches macOS 26 | Prefer dedicated current compatibility source |

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Live 12.4.5 was released 2026-08-26 and is the current cutoff release. | Live family at 2026-08-29 | S-001 | Release-note heading/date. | Mutable release page; later releases out of scope. |
| C-002 | DOCUMENTED | High | Live 12 has Intro, Standard, Suite; features/device/content limits differ and Max for Live is included with Suite. | Current commercial editions | S-002, S-007 | Official edition matrix and M4L page. | Lite/trial/OEM not analyzed; inventory changes. |
| C-003 | DOCUMENTED | High | Current Live 12 supports Windows 10 22H2/11 and macOS 11.7.10–26; Windows Arm uses Prism. | Desktop Live 12 | S-023 | Dedicated requirements matrix preferred. | Plugin compatibility can be narrower; S-002 captured older macOS text. |
| C-004 | DOCUMENTED | High | Arrangement and Session have distinct clips but shared tracks/mixer; Session can override and be captured into Arrangement. | Core workflow | S-017 | Manual §§3.5–3.7. | Does not disclose internal graph implementation. |
| C-005 | DOCUMENTED | High | Internal DSP is 32-bit with 64-bit summing at mix points; freeze/bypass/render have stated precision/tail semantics. | Live 12 engine behavior | S-013, S-014 | Audio Fact Sheet and resource chapter. | Vendor's documented tests, not an independent probe; device algorithms differ. |
| C-006 | DOCUMENTED | High | Live meters buffer deadlines, distributes audio work across cores, freezes tracks, normally renders offline, and detects real-time render dropouts. | Live 12 performance/render | S-014, S-018 | Manual §§37 and 5.1.3. | No benchmark/scaling maximum. |
| C-007 | UNKNOWN | High that unknown | Exact graph scheduler, thread assignment, plugin block policy, render-ahead, and lock/IPC design are not public in retained sources. | Proprietary engine | S-013, S-014 | Manuals were searched for architecture disclosures. | Impact: scheduler choice cannot be adapted from Live; next probe: vendor engineering disclosure or black-box deadline fixtures. |
| C-008 | DOCUMENTED | High | Audio/MIDI tracks host typed serial devices; Racks add parallel chains/zones/macros; clips and most playback edits are reference-based. | User/device model | S-009, S-017 | Manual device and concepts chapters. | Not a complete graph schema. |
| C-009 | DOCUMENTED | High | Live supports Arrangement/Session recording, monitoring, warping, linked edits, take lanes/comping, freeze and bounce. | Editing/recording | S-002, S-017, S-018 | Edition matrix and manuals. | Some details edition-dependent; no independent quality test. |
| C-010 | UNKNOWN | Medium | No retained official evidence established notation/MusicXML, AAF/OMF/ADM/DAWproject, deep conform, DDP/ADR, MIDI 2.0, or broad post workflows. | Specialized/interchange | S-002, S-017, S-018 | Current feature matrix/manual chapters reviewed. | Absence is not non-support; impact: do not use Live as sole reference; next probe: targeted support query or controlled import menus. |
| C-011 | DOCUMENTED | High | Live provides MIDI sequencing/editing, MIDI Clock/MTC roles, Link, scale/generative tools and MPE. | Current Live 12 MIDI | S-002, S-010, S-017 | Feature matrix and routing/concepts manuals. | Per-format plugin expression fidelity not proven. |
| C-012 | DOCUMENTED | High | Routing exposes track I/O, Pre/Post FX/Mixer taps, groups/returns, sidechains, Rack paths, and plugin multichannel outputs. | Current Live 12 routing | S-010, S-017 | Routing manual and concepts. | Feedback policy/dynamic buses not fully documented. |
| C-013 | DOCUMENTED | High | Mixer/device automation, clip envelopes, mappings, controller integrations, and M4L remote control are user-visible control layers. | Automation/control | S-002, S-007, S-008, S-017 | Product/manual/API docs. | Plugin automation accuracy and controller API stability not proven. |
| C-014 | DOCUMENTED | High | Current Live hosts 64-bit VST2/VST3 on Windows and VST2/VST3/AUv2/AUv3 on macOS across all editions. | Live 12 desktop | S-002, S-003, S-004, S-005 | Edition matrix plus OS-specific guides. | AUv2 bitness contradiction is separated as C-033. |
| C-015 | DOCUMENTED/UNKNOWN | High | AAX and DirectX are explicitly unsupported; CLAP/LV2/LADSPA/DSSI/JSFX/Rack Extension and DXi-specific status lack explicit current evidence. | Plugin matrix | S-005 | Official supported/unsupported list. | One list's silence cannot prove rejection; next probe in C-025/U-07. |
| C-016 | DOCUMENTED | High | Format sources/paths, scan-to-Browser, skip scan, rescan, deep rescan, and separate Live 12.1+ plugin database are documented. | Discovery/cache | S-003, S-004, S-006, S-009, S-015 | OS guides, manual, KB. | Cache schema/identity keys unknown. |
| C-017 | DOCUMENTED | High | Scan-crashing VSTs can be marked unavailable and are automatically suppressed after a second scan crash until reinstall; crash isolation UX is documented. | Scan/failure recovery | S-009, S-024 | Manual §23.4.1 and crash guide. | AU/VST3-specific edge cases and permanence not tested. |
| C-018 | DOCUMENTED/UNKNOWN | High | No 32-bit VST bridge; Apple-silicon VST requires native code in Universal Live or whole-app Rosetta; Windows Arm host/plugin interaction is unknown. | Architecture compatibility | S-003–S-006, S-023 | Current compatibility guidance. | AU OS compatibility service varies; no fixture tests. |
| C-019 | DOCUMENTED | High | VST can provide direct MIDI output while AU cannot; plugin instruments/effects use typed track-chain positions. | Plugin event contract | S-003, S-009 | Official format comparison and manual. | Does not prove MIDI 2.0, SysEx, or every event type. |
| C-020 | DOCUMENTED | High | Live routes external plugin sidechains and multi-timbral/multi-output instruments through tracks/External Instrument. | Plugin audio/MIDI buses | S-009, S-010 | Manual examples and contract. | Dynamic I/O and arbitrary bus layouts unknown. |
| C-021 | DOCUMENTED/UNKNOWN | High | Live creates parameter panels, allows Configure Mode, saves per-instance configuration, automates exposed continuous params, and floats vendor UIs; identity/text/scaling/headless contracts are unknown. | Parameter/UI host layer | S-009 | Manual §23.3.1. | “Published” parameter details remain plugin-dependent. |
| C-022 | DOCUMENTED | High | Live automatically compensates Live/plugin latency including returns and offers reduced-latency monitoring; bypass preserves required compensation. | PDC/bypass | S-002, S-009, S-013 | Edition/manual/fact sheet triangulation. | Dynamic latency update accuracy not tested. |
| C-023 | DOCUMENTED | High | Plugin state is a plugin-owned binary block in a Set; configured params/references persist; cross-OS continuity requires matching VST/VST3; plugins are not collected. | State/project recall | S-003, S-009, S-011, S-012, S-017, S-018 | Transfer, recall, and manual sources. | Recall can fail; placeholder/rebinding unproved. |
| C-024 | UNKNOWN | High that unknown | Runtime process isolation, sandboxing, crash containment, signature validation, duplicate identity, and quarantine internals are not documented. | Plugin security/reliability | S-009, S-015, S-024 | Manual/KB reveal failures and user recovery only. | Impact: cannot claim fault/security containment; next probe: disposable crash/hang/process-tree/signature fixtures. |
| C-025 | UNKNOWN | High that unknown | Dynamic I/O, sample-accurate plugin automation, stable parameter IDs/text, tail API, headless/offline fidelity, per-format MPE/MIDI 2.0, state migration, and missing-plugin placeholders are unestablished. | Full host contract | S-002, S-009–S-014, S-023 | Multiple official sources cover only subsets. | Impact: format acceptance is insufficient; next probe: purpose-built conformance plugins and round trips. |
| C-026 | DOCUMENTED | High | Max for Live is a Suite device-authoring/runtime and bounded Live Object Model extension layer, distinct from VST/AU hosting. | Suite/M4L boundary | S-002, S-007, S-008, S-022 | Edition, product, API, file-type sources. | Marketing breadth does not prove process/security architecture. |
| C-027 | UNKNOWN | High that unknown | M4L process isolation, permissions, signing, compatibility/versioning guarantees, and security model are not public in retained docs. | Max for Live internals | S-007, S-008, S-024 | Product/API/crash docs examined. | Impact: cannot directly adopt trust model; next probe: official developer/security docs or controlled Max fixture. |
| C-028 | DOCUMENTED | High | Live handles common audio, Standard MIDI, video, stem/track rendering, references, relinking and collection. | Media/delivery | S-002, S-017, S-018 | Edition and file-management manuals. | Encoder/platform and edition limits apply. |
| C-029 | DOCUMENTED | High | Sets/Projects and `.als/.alc/.adg/.adv/.amxd/.asd/.alp` have distinct persistence roles; media can be offline/relinked/collected. | Native persistence | S-018, S-022 | Manual and official file type list. | File schemas are proprietary/unstated. |
| C-030 | DOCUMENTED | High | Crash reports, ten saved backups, plugin-disabled launch, and same-version undo-artifact recovery are documented; unsaved audio may be lost. | Reliability/recovery | S-024, S-025, S-026 | Three official recovery layers. | Recovery is best-effort, not transactional proof. |
| C-031 | DOCUMENTED | High | Live 12 supports tested screen readers/keyboard navigation but has explicit automation, modulation, MPE, fade, advanced-device and controller gaps. | Accessibility | S-016 | Dedicated accessibility guide. | Third-party plugin accessibility varies and is unproved. |
| C-032 | DOCUMENTED | High | Ableton licenses proprietary software/content, reserves IP/trademarks, restricts reverse engineering/redistribution subject to law, and preserves separate OSS licenses. | Legal/clean-room | S-021 | Current EULA. | Terms vary by territory/store; not legal advice. |
| C-033 | UNKNOWN (contradictory evidence) | High | Current AU support is clear, but official pages conflict on AUv2 bitness and whether AUv3 began in Live 11.2 or 11.3. | AU history/bitness | S-003, S-005, S-006, S-009 | Direct comparison of official statements. | Impact low for current AUv3, material for 32-bit AU; next probe: Ableton clarification/clean fixture. |
| C-034 | DOCUMENTED/UNKNOWN | High | VST2 is discontinued by Steinberg; current VST3 SDK license is MIT; entity-specific rights, trademarks, signing and AU platform terms need separate review. | Format licensing | S-005, S-019, S-020, S-021 | Format-owner/Ableton primary sources. | Mutable SDK branch and no counsel review; not permission to ship. |
| C-035 | INFERENCE | Medium | Transferable Live patterns are dual clip domains, typed chains/routing, diagnosable scan cache, reversible freeze, and a separate bounded extension plane. | Architecture synthesis | C-004, C-008, C-012, C-016, C-026 | Minimal mechanisms abstracted from documented behavior. | Alternatives can realize the same product outcomes; do not copy expression. |
| C-036 | INFERENCE | High | Historical lineage, exhaustive device inventory, community anecdotes, and reverse engineering would not change this dossier's leading architecture conclusions within budget. | Curiosity control | Decision frame; C-001–C-035 | Decision relevance/novelty/cost scoring in §24. | Reopen only if synthesis exposes a specific historical or device-level dependency. |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Official pages are mutable unless noted;
quoted summaries below identify the relevant section rather than reproducing
protected manuals.

- **S-001 — “Live 12 Release Notes,” Ableton.** URL:
  https://www.ableton.com/en/release-notes/live-12/ . Kind: official release
  notes. Scope: Live 12 through 12.4.5. Relevant passage: “12.4.5 Release Notes,”
  2026-08-26; Max 9.1.5 and current crash/accessibility fixes. Claims: C-001.
  Limitations: long mutable page; fixes do not prove architecture. Rationale:
  selected over secondary version trackers as the release origin.
- **S-002 — “Compare Live editions,” Ableton.** URL:
  https://www.ableton.com/en/live/compare-editions/ . Kind: official product
  matrix. Scope: current Live 12 Intro/Standard/Suite. Relevant sections:
  Overview, Live Key Features, instruments/effects, system requirements. Claims:
  C-002, C-009, C-011, C-013, C-014, C-022, C-026, C-028. Limitations:
  marketing matrix; captured macOS ceiling conflicted with S-023. Rationale:
  authoritative edition/feature boundary and preferable to reseller tables.
- **S-003 — “Using AU and VST plug-ins on macOS,” Ableton Help.** URL:
  https://help.ableton.com/hc/en-us/articles/209068929-Using-AU-and-VST-plug-ins-on-macOS .
  Kind: official KB. Scope: current Live on macOS, including Apple silicon.
  Relevant sections: AU vs. VST, install paths, activation, Apple Silicon,
  troubleshooting. Claims: C-014, C-016, C-018, C-019, C-023, C-033.
  Limitations: no process/validation internals; says AUv3 from 11.3, conflicting
  with S-005/S-009. Rationale: OS-specific operational source.
- **S-004 — “Using VST plug-ins on Windows,” Ableton Help.** URL:
  https://help.ableton.com/hc/en-us/articles/209071729-Using-VST-plug-ins-on-Windows .
  Kind: official KB. Scope: Live 10+ and Live 12 Windows. Relevant sections:
  64-bit VST2/VST3, default/custom paths, activation, Browser scan, same-format
  guidance. Claims: C-014, C-016, C-018. Limitations: no sandbox, validation,
  or Windows Arm plugin detail. Rationale: primary Windows setup contract.
- **S-005 — “Supported Plug-in Formats,” Ableton Help.** URL:
  https://help.ableton.com/hc/en-us/articles/5937501570460-Supported-Plug-in-Formats .
  Kind: official support matrix. Scope: current Live formats. Relevant passage:
  supported VST2/VST3/AUv2/AUv3; unsupported 32-bit VST2, AU1, DirectX, AAX,
  RTAS. Claims: C-014, C-015, C-018, C-033, C-034. Limitations: silence on
  other formats is not proof; AUv2 bitness conflicts with S-006. Rationale:
  chosen for explicit positive/negative format statements.
- **S-006 — “VST/AU plug-in doesn't appear in Live's Browser,” Ableton Help.**
  URL: https://help.ableton.com/hc/en-us/articles/115000349184-VST-AU-plug-in-doesn-t-appear-in-Live-s-Browser .
  Kind: official troubleshooting KB. Scope: current macOS/Windows Live.
  Relevant sections: compatibility, source paths, rescan/deep rescan, Apple
  silicon, Waves AU exclusion. Claims: C-014, C-016, C-018, C-033. Limitations:
  troubleshooting advice, not scan internals. Rationale: primary recovery UX
  and countercheck to format/setup pages.
- **S-007 — “Max for Live,” Ableton.** URL:
  https://www.ableton.com/en/live/max-for-live/ . Kind: official product page.
  Scope: current Live 12 Suite. Relevant sections: Create and Customize, Extend
  Live, Devices Made by Ableton. Claims: C-002, C-013, C-026, C-027.
  Limitations: marketing breadth; no API/security guarantees. Rationale:
  authoritative product boundary, paired with S-008 technical docs.
- **S-008 — “Live API Overview,” Cycling '74 Max Documentation.** URL:
  https://docs.cycling74.com/userguide/m4l/live_api_overview/ . Kind:
  first-party technical documentation. Scope: current Max for Live docs at
  cutoff. Relevant sections: Live Object Model, roots/paths/IDs, properties,
  notifications, `live.object`, `live.observer`, `live.remote~`. Claims: C-013,
  C-026, C-027. Limitations: exposed model only; says not all parameters are
  accessible; no process/security model. Rationale: preferred technical origin
  over tutorials/community patches.
- **S-009 — “Working with Instruments and Effects,” Ableton Reference Manual
  Version 12.** URL:
  https://www.ableton.com/en/live-manual/12/working-with-instruments-and-effects/ .
  Kind: official versioned manual. Scope: Live 12 manual snapshot linked to
  2026-08-11 PDF. Relevant §§23.2–23.6: device types, presets, plugin scanning,
  UI/configure, parameters, sidechains, VST unavailable policy, AU/VST presets,
  PDC. Claims: C-008, C-014, C-016–C-025. Limitations: user contract, not
  complete format ABI/internal architecture. Rationale: most decision-dense
  primary host source.
- **S-010 — “Routing and I/O,” Ableton Reference Manual Version 12.** URL:
  https://www.ableton.com/en/live-manual/12/routing-and-i-o/ . Kind: official
  versioned manual. Scope: Live 12. Relevant §§17.1–17.5: monitoring, external/
  internal routing, taps, multitimbral/multi-output plugins, sidechains. Claims:
  C-011, C-012, C-020. Limitations: examples do not enumerate every dynamic
  bus case. Rationale: canonical routing behavior.
- **S-011 — “Transferring Projects to another computer,” Ableton Help.** URL:
  https://help.ableton.com/hc/en-us/articles/209071909-Transferring-Projects-to-another-computer .
  Kind: official KB. Scope: current Set transfer across macOS/Windows/editions.
  Relevant sections: first steps, individual projects; only VST/VST3 cross-OS,
  matching plugins, Collect All and Save exclusions. Claims: C-023. Limitations:
  does not define plugin identity/rebind behavior. Rationale: primary portability
  guidance.
- **S-012 — “VST/AU plug-ins reset to default preset,” Ableton Help.** URL:
  https://help.ableton.com/hc/en-us/articles/115001443850-VST-AU-plug-ins-reset-to-default-preset .
  Kind: official troubleshooting KB. Scope: VST/AU state recall. Relevant
  passage: state stored in reserved binary data block readable/writable only by
  plugin; AU cache failure. Claims: C-023. Limitations: failure article, not
  serialization schema; state reliability depends on plugin. Rationale: rare
  explicit state-ownership disclosure.
- **S-013 — “Audio Fact Sheet,” Ableton Reference Manual Version 12.** URL:
  https://www.ableton.com/en/live-manual/12/audio-fact-sheet/ . Kind: official
  versioned manual/vendor test summary. Scope: Live 12 audio behavior. Relevant
  §§38.2–38.3: 32/64-bit precision, rendering, freeze, bypass, routing,
  sample-updated volume automation. Claims: C-005, C-007, C-022, C-025.
  Limitations: vendor-documented tests; not independent and intentionally
  incomplete. Rationale: primary measurable audio contract.
- **S-014 — “Computer Audio Resources and Strategies,” Ableton Reference
  Manual Version 12.** URL:
  https://www.ableton.com/en/live-manual/12/computer-audio-resources-and-strategies/ .
  Kind: official versioned manual. Scope: Live 12. Relevant §§37.1–37.2: buffer
  CPU meter, multicore, tail-aware suspension, track impact/freeze, disk
  overload. Claims: C-005–C-007, C-025. Limitations: no scheduler algorithm or
  benchmarks. Rationale: primary performance semantics.
- **S-015 — “Rescanning plug-ins in Live 12.1,” Ableton Help.** URL:
  https://help.ableton.com/hc/en-us/articles/16261934134940-Rescanning-plug-ins-in-Live-12-1 .
  Kind: official version-specific KB. Scope: Live 12.1+. Relevant passage:
  separate `Live-plugins-1.db`, per-OS paths, reset behavior. Claims: C-016,
  C-024. Limitations: no DB schema or identity algorithm. Rationale: current
  cache boundary unavailable in older manual text.
- **S-016 — “Accessibility in Live Overview,” Ableton Help.** URL:
  https://help.ableton.com/hc/en-us/articles/11550373507868-Accessibility-in-Live-Overview .
  Kind: official accessibility guide. Scope: Live 12 macOS/Windows. Relevant
  sections: tested screen readers, keyboard navigation, Arrangement/Clip/Device
  limitations. Claims: C-031. Limitations: evolving support; third-party plugin
  UI not qualified. Rationale: dedicated primary accessibility evidence.
- **S-017 — “Live Concepts,” Ableton Reference Manual Version 12.** URL:
  https://www.ableton.com/en/live-manual/12/live-concepts/ . Kind: official
  versioned manual. Scope: Live 12. Relevant §§3.5–3.21: Sets, Session/
  Arrangement, tracks, clips, devices/Racks, routing, recording, automation,
  saving/export. Claims: C-004, C-008–C-013, C-023, C-028. Limitations:
  conceptual overview, not exhaustive internals. Rationale: canonical user
  model and preferable to secondary tutorials.
- **S-018 — “Managing Files and Sets,” Ableton Reference Manual Version 12.**
  URL: https://www.ableton.com/en/live-manual/12/managing-files-and-sets/ .
  Kind: official versioned manual. Scope: Live 12. Relevant §§5.1–5.9: audio/
  MIDI/video export, offline/real-time rendering, Sets/Projects, Undo History,
  references, missing-file relink, collection/Packs. Claims: C-006, C-009,
  C-010, C-018, C-023, C-028, C-029. Limitations: media recovery is not plugin
  recovery; file schemas absent. Rationale: canonical persistence/delivery
  source.
- **S-019 — “VST 2 Discontinued,” Steinberg Help Center.** URL:
  https://helpcenter.steinberg.de/hc/en-us/articles/4409561018258-VST-2-Discontinued .
  Kind: format-owner notice, updated 2022-03-08. Scope: VST2 lifecycle. Relevant
  passage: discontinuation/final transition to VST3. Claims: C-034. Limitations:
  does not adjudicate historical entity-specific SDK licenses. Rationale:
  format owner preferred over blogs/legal summaries.
- **S-020 — `vst3sdk/LICENSE.txt`, Steinberg Media Technologies.** URL:
  https://raw.githubusercontent.com/steinbergmedia/vst3sdk/master/LICENSE.txt .
  Kind: official SDK repository license text. Scope: repository `master` as
  accessed; copyright 2026. Relevant passage: MIT License grant/conditions.
  Claims: C-034. Limitations: mutable branch URL rather than immutable commit;
  software license does not settle trademarks/certification. Rationale: direct
  current license text preferred over summaries.
- **S-021 — “End User License Agreement,” Ableton.** URL:
  https://www.ableton.com/en/eula/ . Kind: official legal terms. Scope: current
  Ableton Products/Live, territory caveats. Relevant §§1–8, 14: ownership,
  license, activation, restrictions, OSS and third-party terms. Claims: C-032,
  C-034. Limitations: mutable, territory/store-specific; no legal advice.
  Rationale: primary clean-room/licensing boundary.
- **S-022 — “Live specific file types,” Ableton Help.** URL:
  https://help.ableton.com/hc/en-us/articles/209769625-Live-specific-file-types .
  Kind: official KB. Scope: all Live versions/OS. Relevant passage: `.adg`,
  `.adv`, `.alc`, `.alp`, `.als`, `.amxd`, `.asd` roles. Claims: C-026, C-029.
  Limitations: names/purposes only, no schemas or interoperability rights.
  Rationale: concise primary role inventory.
- **S-023 — “Live Minimum System Requirements,” Ableton Help.** URL:
  https://help.ableton.com/hc/en-us/articles/115001663530-Live-Minimum-System-Requirements .
  Kind: official current support matrix. Scope: Live 12 plus prior versions.
  Relevant Live 12 table: OS, CPU, RAM, disk, display, audio interface. Claims:
  C-003, C-018. Limitations: minimum, not tested performance/plugin matrix.
  Rationale: dedicated current page resolves S-002's stale compatibility text.
- **S-024 — “Troubleshooting a crash,” Ableton Help.** URL:
  https://help.ableton.com/hc/en-us/articles/209773265-Troubleshooting-a-crash .
  Kind: official troubleshooting KB. Scope: current Live. Relevant sections:
  crash reports, plugin-disabled startup, blank-Set/plugin isolation, template/
  preference reset. Claims: C-017, C-024, C-027, C-030. Limitations: failure UX
  does not prove process topology. Rationale: primary diagnostics and an
  adversarial check against assumed containment.
- **S-025 — “Backup Sets,” Ableton Help.** URL:
  https://help.ableton.com/hc/en-us/articles/360000377870-Backup-Sets . Kind:
  official KB. Scope: Live 10+. Relevant passage: Backup folder after second
  save; ten recent saved versions. Claims: C-030. Limitations: saved versions,
  not continuous autosave. Rationale: primary durability behavior.
- **S-026 — “Recovering a Set manually after a crash,” Ableton Help.** URL:
  https://help.ableton.com/hc/en-us/articles/115001878844-Recovering-a-Set-manually-after-a-crash .
  Kind: official recovery KB. Scope: current Live recovery. Relevant sections:
  undo-triggered restore, Crash folder artifacts, same-version requirement,
  uncertain unsaved-audio recovery. Claims: C-030. Limitations: best-effort
  manual procedure, not a transactional guarantee. Rationale: closes the
  recovery gap exposed by S-025.

**Bibliography rationale:** 23 of 26 retained sources are Ableton manuals,
support, release, product, or legal pages; one is first-party Cycling '74
documentation for the bundled Max boundary; two are primary sources from VST
format owner Steinberg. No community source was needed to establish a material
claim. This maximizes provenance while retaining vendor-statement limits and
contradictions.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / available evidence | Blocker and decision impact | Safest next probe / required fixture / owner |
| --- | --- | --- | --- |
| U-01 Plugin process/sandbox/crash containment | Reviewed manual scanning, cache and crash guides (S-009, S-015, S-024) | No topology statement; security/reliability architecture cannot assume containment | Disposable VM; signed benign VST2/VST3/AU crash/hang fixtures; process tree and host survival; owner unassigned |
| U-02 Validation, cache identity, duplicates, signing, quarantine | Reviewed paths, deep rescan, DB and unavailable policy (S-003–S-006, S-009, S-015) | Cache schema/proprietary matching absent; affects deterministic discovery/migration | Synthetic variants sharing IDs/names/versions/signatures; corrupt binaries; DB treated only through UI; owner unassigned |
| U-03 Full processing contract | Reviewed routing, PDC, audio fact/performance docs (S-009, S-010, S-013, S-014) | Dynamic buses, tails, sample-accurate plugin automation, offline fidelity, headless and event types unstated | Purpose-built VST3/AU fixtures with bus changes, impulses, latency/tail changes, automation and offline hashes; owner unassigned |
| U-04 Parameter/state/missing-plugin durability | Reviewed Configure Mode, state-block, transfer and recall pages (S-009, S-011, S-012) | Stable IDs/text/gestures, migration and durable placeholders unpromised; high project-longevity impact | Save/reopen/remove/reinstall/version/format-change fixture preserving state, mappings and automation; owner unassigned |
| U-05 MPE, MIDI 2.0, SysEx per plugin format | General MPE and VST-vs-AU MIDI output documented (S-002, S-003, S-009) | Product MPE does not prove per-format fidelity; expression architecture incomplete | MPE/UMP/SysEx echo plugins and timestamp capture at varied buffers; owner unassigned |
| U-06 Max for Live trust/version boundary | Reviewed M4L product/API/crash docs (S-007, S-008, S-024) | Permissions, isolation, signing and API compatibility absent; affects extension strategy | Seek official developer/security statement, then disposable Max device for file/network/CPU/crash/API-version behaviors; owner unassigned |
| U-07 CLAP/LV2/LADSPA/DSSI/JSFX/Rack Extension/DXi | Reviewed official supported/unsupported list (S-005); no explicit current entries except DirectX | Silence cannot prove unsupported; impacts format breadth only | Written vendor clarification or clean supported-OS scan with benign format fixtures; owner unassigned |
| U-08 AU contradictions | Compared official setup/format/missing/manual pages (S-003, S-005, S-006, S-009) | AUv2 bitness and AUv3 introduction disagree; current AUv3 support unaffected | Vendor clarification; if material, 32-bit AU scan on a compatible isolated legacy OS; owner unassigned |
| U-09 Proprietary engine scheduler | Reviewed engine/performance manuals (S-013, S-014) | Internals not public; affects scheduler lessons, not user-model findings | Public Ableton engineering disclosure or black-box dependency-chain/core-scaling study; owner unassigned |
| U-10 Interchange/post formats | Reviewed edition matrix and manuals (S-002, S-017, S-018) | No explicit retained AAF/OMF/ADM/MusicXML/DAWproject evidence; impacts post/notation scope | Targeted current support query and safe file-menu inspection; owner unassigned |
| U-11 Plugin/native accessibility | Dedicated Live accessibility guide covers gaps but not plugin UI contract (S-016) | Host-vendor boundary varies; affects inclusive plugin design | Screen-reader matrix with host panel and vendor UIs on both OSes; owner unassigned |
| U-12 Format/product legal rights | Reviewed EULA, VST2 notice, VST3 license (S-019–S-021) | Entity-specific VST2 rights, trademarks, AU terms, signing and redistribution need counsel | Current SDK/brand/platform terms plus qualified legal review; no engineering probe; owner unassigned |
| U-13 Unsaved audio recovery | S-026 says temporary recordings may or may not be recoverable | Durability guarantee is incomplete | Forced-crash recording matrix with flushed/unflushed buffers in disposable projects; owner unassigned |

## 24. Curiosity pass and stop decision

Scores use 1 (low) to 5 (high); **cost** 5 means most expensive. After each
pass only the highest decision-changing in-frame thread was pursued.

| Candidate follow-up | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Official crash recovery after initial bad URL | 4 | 4 | 3 | 1 | **Pursued** as final bounded pass; S-026 closed Set recovery gap |
| Plugin isolation/conformance dynamic fixtures | 5 | 5 | 5 | 5 | **CURIOSITY_NO_GO in documentary wave**; next-phase prototype, U-01/U-03 |
| Vendor confirmation of unknown plugin formats | 3 | 2 | 2 | 2 | **CURIOSITY_NO_GO**; matrix is honest and format breadth would not change leading pattern |
| Archived AUv3 introduction history | 1 | 1 | 2 | 2 | **CURIOSITY_NO_GO**; current Live 12 result is unambiguous |
| Exhaustive Suite device/Packs inventory | 2 | 1 | 1 | 5 | **CURIOSITY_NO_GO**; edition/M4L boundary already established |
| `.als`/cache reverse engineering | 2 | 2 | 4 | 5 | **CURIOSITY_NO_GO**; clean-room/legal boundary and unnecessary risk |
| Community crash reports | 2 | 1 | 2 | 4 | **CURIOSITY_NO_GO**; cannot prove vendor internals |
| Historical lineage/market share | 1 | 1 | 1 | 3 | **CURIOSITY_NO_GO**; no architecture decision impact |

**Negative results retained:** the first guessed crash-recovery URL (article ID
`209069629`) resolved to an unrelated macOS MIDI-driver article and was not used
as evidence. Web search was later rate-limited. S-025 exposed the correct
official article ID, enabling S-026 without broadening scope. Official format
pages produced no explicit CLAP/LV2/LADSPA/DSSI/JSFX/Rack Extension entries;
these were kept `UNKNOWN`, not converted to negative claims.

**Contradictions:** AUv3 introduction is documented as both Live 11.2 and 11.3;
AUv2 is listed as 64/32-bit while current general guidance says only 64-bit
plugins appear. The edition page's captured macOS range lagged the dedicated
current requirements page. The dossier scopes current support using the more
specific sources and preserves the contradictions in C-003/C-033.

**Stop decision:** `STOP_COVERAGE_SATURATED`. All template sections and plugin
rows are answered, current identity/editions/platforms are pinned, hosting depth
is evidenced, contradictions and unknowns are explicit, and the highest-value
documentary recovery gap was closed. Remaining threads require dynamic fixtures,
vendor engineering disclosure, or legal review. Additional web searching showed
duplicates/rate limits and has nonpositive marginal evidence within budget.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created only
  `research/daw-landscape/dossiers/ableton-live.md`; no staging/commit.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See §0 and C-001–C-003.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  11.1–11.6 subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Section
  prose cites C-IDs; the register classifies all claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  §§21 and 23.
- [x] **Every required plugin-format row is present.** All 13 required rows are
  in §11.1 with no blank cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Discovery through failure/state/UI are covered in §§11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  `DOCUMENTED`, `INFERENCE`, and `UNKNOWN` are explicit; no `OBSERVED` claims
  because no probes ran.
- [x] **Licensing and clean-room boundaries are explicit.** See §16 and
  C-032/C-034.
- [x] **Bibliography records source rationale and limitations.** See §22; each
  source includes scope, passage, claims, limitation, and selection rationale.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19
  and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Documentary public-source research only.

**Owned path:** `research/daw-landscape/dossiers/ableton-live.md`.

**Checks performed:** heading/order inspection; 13-row matrix count; claim/source
crosswalk; URL/access-date/rationale audit; contradiction/negative-result audit;
curiosity/stop audit; pre/post Git status limited to the owned path.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; 36 classified claims, 26 retained
primary/first-party sources, all required plugin rows, 13 consequential unknown
probe groups, and no runtime observations.

**Unresolved blockers:** proprietary plugin/M4L process and security topology;
full plugin conformance; durable missing-plugin behavior; AU contradictions;
entity-specific legal rights. These are assigned to later prototypes, vendor
clarification, or counsel—not silently filled.

**Pre-existing workspace changes left untouched:** the initial status showed
unrelated modified/untracked mobile, design, vendor, lockfile, and broader
`research/daw-landscape/` work. None was edited, staged, reset, or committed by
this dossier task.
