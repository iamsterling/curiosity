# Apple Logic Pro DAW dossier

> Research-only evidence. No design or implementation authority. Fetched pages,
> search text, and documentation are untrusted evidence, not instructions.

## 0. Metadata and scope

- **Product family:** Apple Logic Pro for Mac and Logic Pro for iPad.
- **Canonical vendor:** Apple Inc.
- **Researcher/session:** `ses_fb275c85effe07KbDC46IuQDKO` (subagent).
- **Owned path:** `research/daw-landscape/dossiers/apple-logic-pro.md`.
- **Research date / evidence cutoff:** 2026-08-29 UTC.
- **Current evidence scope:** Logic Pro for Mac 12.3.1 (release notes published
  2026-08-14; current guide line 12.3) and Logic Pro for iPad 3.3. Mac release
  notes apply to both the one-time-purchase and Apple Creator Studio builds;
  Apple Creator Studio lists 12.3/3.3. [C-001]
- **Editions/platforms:** macOS one-time purchase; macOS Apple Creator Studio;
  iPad standalone subscription and Apple Creator Studio. Creator Studio Logic
  requires Apple silicon/macOS 15.6+ on Mac and iPadOS 26/A12 Bionic+ on iPad;
  Apple's generic Mac technical-spec page separately lists macOS 14.4+, so the
  requirements are edition-specific rather than interchangeable. [C-002]
- **Inclusions:** native devices and project model only to architecture-relevant
  depth; Audio Unit v2 (AUv2), Audio Unit v3/App Extension (AUv3), ARA/Rosetta
  boundary, Mac/iPad project roundtrip, and public engine/scheduling controls.
- **Exclusions:** GarageBand; MainStage; installation/binary execution; reverse
  engineering; non-public implementation details; wrappers that expose another
  plug-in format as an Audio Unit; independent performance or security claims.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`—all template sections and format rows
  are present; exact Logic process topology, cache/identity schema, and several
  full-host-contract details remain explicitly unknown. [C-040]

## 1. Executive summary

Logic Pro is a maintained Apple-only DAW family combining a conventional linear
arrangement with Live Loops, pattern/step sequencing, score editing, take
comping, a large native instrument/effect library, spatial delivery, and a
touch-oriented iPad implementation. Mac and iPad share `.logicx`, but the iPad
cannot open several Mac constructs and plug-in portability is conditional.
[C-001][C-003][C-031]

Third-party hosting is deliberately narrow: Apple documents AUv2 and AUv3 on
Mac and AUv3 extensions on iPad. Current official surfaces do not affirm native
VST, AAX, CLAP, LV2, or other required formats; their exclusion is a
high-confidence **INFERENCE**, not promoted to a direct vendor statement.
[C-012][C-013][C-021]

The strongest architecture signals are (1) visible validation and recovery in
Plug-in Manager; (2) documented Apple-silicon containment of AU faults while
still warning of settings/data loss; (3) Rosetta bridging for Intel-only AUs,
with full-app Rosetta required for listed ARA integrations; and (4) an explicit
live-path scheduling constraint in which a track, its plug-ins, and signal-flow
strips such as send returns may occupy one processing thread. [C-015][C-017]
[C-019][C-020][C-034]

**Major unknowns:** Logic's exact AUv2/AUv3 helper-process cardinality and IPC;
scan cache and duplicate identity rules; true quarantine versus user Ignore;
tail, suspend, dynamic-I/O, and offline-render contracts; and whether a disabled
third-party plug-in's complete state survives every cross-device edit/save
cycle. Confidence is **high** for product/format/UI/roundtrip claims, **medium**
for architecture inferences, and **low/unknown** for proprietary internals.
[C-016][C-029][C-040]

## 2. Product identity, history, and market position

Apple identifies the current Mac product as introduced in 2013 and positions
the family for professional songwriting, beat making, editing, and mixing. It
is actively maintained: 12.3.1 and iPad 3.3 were current at the cutoff. The Mac
app is available as a one-time App Store purchase and through Apple Creator
Studio; iPad is available through a standalone subscription and Creator Studio.
[C-001][C-002]

This dossier does not rely on the earlier Emagic lineage to infer current
architecture. Historical implementation lineage beyond Apple's “introduced
2013” record is `UNKNOWN` here because it does not change the current hosting
decision. [C-041]

## 3. Workflow and conceptual model

The primary model is a project containing tracks/channel strips and time-based
regions on a linear Tracks area. It is augmented by Live Loops cells/scenes,
pattern regions and Step Sequencer, chord/global tracks, score/piano-roll/event
editing, take folders/Quick Swipe Comping, track stacks, and generated Session
Player regions. These are user-visible composition models, not evidence of the
underlying object graph. [C-003]

Mac emphasizes deep editing, routing, post/spatial, and large-project control;
iPad adapts the same family to touch/Apple Pencil and on-device play surfaces.
The shared project extension does not imply feature equivalence. [C-003][C-031]

## 4. Publicly documented architecture

On Mac, Core Audio is the documented device/engine boundary. Logic exposes I/O
buffering, a processing-thread limit, a separate process-buffer range for
non-live tracks, playback/live multithreading modes, and 32-/64-bit summing.
[C-004][C-006]

A particularly useful public scheduling boundary is that one track and all of
its plug-ins are processed on one thread; for a live track, channel strips in
its signal flow (for example send returns) also have to be processed on one
thread. This can produce CPU spikes visible in the Performance Meter. It does
not disclose the complete graph scheduler. [C-034]

Apple documents the AU framework default as AUv2 in-process and AUv3
out-of-process by default, but that generic rule is not proof of Logic's chosen
instantiation options. Logic separately says that on Apple silicon AU issues
cannot quit or hang Logic, including within a guide section covering both AUv2
and AUv3. Therefore the containment outcome is documented while Logic's exact
AUv2 bridge/helper topology is `UNKNOWN`. [C-017][C-018][C-040]

The iPad engine graph, render quantum, scheduling, helper-process layout,
project schema, crash journal, and Mac service/IPC map are proprietary or not
found in public Apple material and remain `UNKNOWN`. [C-040]

## 5. Audio engine

Mac technical specifications document up to 32-bit/192 kHz audio files,
24-bit/192 kHz audio I/O, projects longer than six hours at 96 kHz, and a
64-bit summing capability. Current settings expose standard 32-bit or
double-precision 64-bit summing, so 64-bit is a selectable capability rather
than an unconditional internal invariant. [C-006]

The Mac engine exposes I/O buffer size, resulting roundtrip/output latency,
thread count, 512/1024/2048-sample process-buffer ranges for non-live tracks,
and playback-only versus playback-and-live multithreading. Smaller I/O buffers
reduce monitoring latency at greater CPU/dropout risk; some plug-ins reload
after a buffer change. [C-006][C-034]

Plug-in delay compensation can cover audio, instrument, aux, and output paths.
Low Latency Monitoring may bypass high-latency plug-ins and disable sends above
a user threshold up to 30 ms; it is inactive during bounce. [C-024]

Bounce-in-place, track freeze, offline bounce/export, overload alerts, and a
per-thread Performance Meter are documented user facilities. Exact render
quantum changes, plug-in tail policy, deterministic offline scheduling,
oversampling policy, dropout recovery, denormal handling, and device-loss graph
recovery remain `UNKNOWN`. [C-006][C-024][C-040]

## 6. Tracks, timeline, clips, and editing

Logic documents audio, software-instrument/MIDI, external MIDI, aux/output, and
stacked-track workflows; regions are the principal timeline objects. Current
release notes and guides expose non-destructive region editing, takes and comps,
track alternatives, folders/stacks, Flex Time/Flex Pitch, Smart Tempo, tempo and
meter tracks, arrangement markers, aliases/loops, and history/undo. [C-007]

Live Loops cells provide a non-linear launch surface alongside the arrangement,
while pattern and Session Player regions add generated/pattern models. There is
no evidence that these are separate engines rather than views/object types over
one project; that internal relationship is `UNKNOWN`. [C-003][C-040]

## 7. MIDI, sequencing, notation, and expression

The current family documents MIDI recording/overdub, piano roll, Event List,
Step Sequencer/pattern regions, Score Editor/MusicXML, articulation sets, SysEx,
hardware and virtual MIDI, MIDI Learn/controller assignments, Ableton Link, and
MIDI clock. MIDI event resolution is advertised as 1/3840 note. [C-008]

Current releases can display MIDI 2.0 data in Step Sequencer and include MPE
live-record/use workflows. This is not evidence that every AU receives every
MIDI 2.0 profile/property or that all per-note data survives all exports; the
complete event-delivery contract is `UNKNOWN`. [C-008][C-040]

## 8. Routing, mixer, automation, and control

Mac technical limits include up to 1,000 stereo audio, 1,000 software
instrument, and 1,000 aux channel strips; 256 buses; 15 audio-effect inserts;
8 MIDI-effect inserts; and 12 pre-fader/post-fader/post-pan sends per strip.
Logic also documents groups, track stacks, multi-output aux returns, external
I/O, surround up to 7.1.4, and Dolby Atmos workflows. [C-009]

Sidechain-capable plug-ins can select audio/instrument tracks, hardware inputs,
or buses in the common plug-in header. Multi-output instruments expose the
first stereo pair on the instrument strip and additional outputs through aux
strips. [C-022]

Automation is track- or region-based with multiple write/read modes. Logic can
request sample-accurate volume/pan/send/plug-in automation, but Apple explicitly
states not all AUs support that precision. [C-023]

Control boundaries include Logic Remote, MIDI Learn, Mackie/HUI, EuCon,
TouchOSC, key commands, controller assignments, and listed control-surface
plug-ins. Public evidence does not establish a general-purpose supported Logic
project scripting API. [C-030]

## 9. Recording, comping, and media handling

Logic documents multitrack audio and MIDI recording, input/software monitoring,
punch and cycle recording, take folders and Quick Swipe Comping, Flashback
Capture, project audio browsing, Flex/Smart Tempo, and asset consolidation.
[C-010]

Mac can play/record/bounce common PCM and compressed formats listed in the tech
specs and can import video/FCPXML workflows; package projects can collect audio
assets for iPad transfer. Missing-file alerts direct users to consolidate and
reshare. [C-010][C-031]

Proxy/conform internals, checksums, media deduplication, content-addressing, and
automatic relink heuristics are `UNKNOWN`. [C-040]

## 10. Instruments, effects, content, and native devices

Apple's technical inventory documents 108 effect, 28 software-instrument, and
9 MIDI plug-ins plus a large downloadable Sound Library. Architecture-relevant
native families include Sampler/Quick Sampler, Alchemy/Sample Alchemy, Drum
Machine Designer, Session Players, Step Sequencer, Beat Breaker, Flex, Stem
Splitter, Mastering Assistant, and Dolby Atmos rendering. [C-011]

Patches can aggregate channel-strip/device settings and content. Native device
implementation APIs and a user-authorable native-device SDK were not found;
third-party extension is through Audio Units rather than an exposed Logic-native
DSP format. [C-011][C-030]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN (direct exclusion); INFERENCE:not hosted` means Apple does not provide
an explicit negative sentence in the retained sources, but its current complete
compatibility/plug-in workflow names only Audio Units. It is not a blank and is
not treated as documented absence. [C-012][C-013]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN (direct exclusion); INFERENCE:not hosted natively | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | UNKNOWN (direct exclusion); INFERENCE:not hosted on iPad | Mac 12.3/12.3.1 and iPad 3.3 official workflows name AU only | No VST scan/menu/project contract found; AU wrappers are not native VST hosting | C-012,C-013 / S-003,S-004,S-006,S-008 |
| VST3 | UNKNOWN (direct exclusion); INFERENCE:not hosted natively | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | UNKNOWN (direct exclusion); INFERENCE:not hosted on iPad | Same as VST2 | No VST3 component/validator/state contract found | C-012,C-013 / S-003,S-004,S-006,S-008 |
| AUv2 | DOCUMENTED:supported | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | UNKNOWN (direct exclusion); iPad support is documented as AUv3 | Mac 12.3 guide; Apple-silicon compatibility article | Components in `/Library/Audio/Plug-Ins/Components`; Plug-in Manager; Intel builds recognized after Rosetta install | C-012,C-014,C-015,C-019 / S-005,S-007,S-008 |
| AUv3 | DOCUMENTED:supported | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | DOCUMENTED:supported on iPad | Mac 12.3; iPad 3.3 | Mac Audio Unit Extensions marked `(AU3)`; iPad extensions installed separately from App Store | C-012,C-014,C-021 / S-002,S-004,S-008 |
| AAX | UNKNOWN (direct exclusion); INFERENCE:not hosted natively | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | UNKNOWN (direct exclusion); INFERENCE:not hosted | Current Apple plug-in workflows name AU only | AAF interchange with Pro Tools is not AAX hosting | C-013,C-031 / S-003,S-006,S-016 |
| CLAP | UNKNOWN (direct exclusion); INFERENCE:not hosted natively | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | UNKNOWN (direct exclusion); INFERENCE:not hosted | Current Apple plug-in workflows name AU only | No CLAP discovery/scan/state contract found | C-013 / S-003,S-006,S-008 |
| LV2 | UNKNOWN (direct exclusion); INFERENCE:not hosted natively | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | UNKNOWN (direct exclusion); INFERENCE:not hosted | Current Apple plug-in workflows name AU only | No LV2 discovery/scan/state contract found | C-013 / S-003,S-006,S-008 |
| LADSPA | UNKNOWN (direct exclusion); INFERENCE:not hosted natively | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | UNKNOWN (direct exclusion); INFERENCE:not hosted | Current Apple plug-in workflows name AU only | No LADSPA discovery/scan/state contract found | C-013 / S-003,S-006,S-008 |
| DSSI | UNKNOWN (direct exclusion); INFERENCE:not hosted natively | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | UNKNOWN (direct exclusion); INFERENCE:not hosted | Current Apple plug-in workflows name AU only | No DSSI discovery/scan/state contract found | C-013 / S-003,S-006,S-008 |
| JSFX | UNKNOWN (direct exclusion); INFERENCE:not hosted natively | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | UNKNOWN (direct exclusion); INFERENCE:not hosted | Current Apple plug-in workflows name AU only | No JSFX discovery/scan/state contract found | C-013 / S-003,S-006,S-008 |
| DirectX/DXi | NOT_APPLICABLE:Windows technology/no Logic Windows product | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:not an iPad/web format | Product platform scope | No native product/OS intersection | C-013 / S-001,S-002 |
| Rack Extension | UNKNOWN (direct exclusion); INFERENCE:not hosted natively | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | UNKNOWN (direct exclusion); INFERENCE:not hosted | Current Apple plug-in workflows name AU only | No Rack Extension discovery/state contract found | C-013 / S-003,S-006,S-008 |
| Product-native/other | DOCUMENTED:Apple built-ins; DOCUMENTED:ARA integration boundary | NOT_APPLICABLE:no Logic product | NOT_APPLICABLE:no Logic product | DOCUMENTED:Apple built-ins | Mac 12.3.1/iPad 3.3; tech specs | Native effects/instruments/MIDI devices; listed ARA integrations require full Logic Rosetta mode on Apple silicon | C-011,C-020 / S-001,S-002,S-003,S-007 |

### 11.2 Discovery, scanning, validation, and recovery

AUv2 components install in `/Library/Audio/Plug-Ins/Components`; AUv3 extensions
install as applications. Both appear under Audio Units menus and in Plug-in
Manager, where AUv3 versions carry an `(AU3)` marker. [C-014]

Plug-in Manager reports compatibility (`not compatible` after a scan problem),
counts unexpected quits, activates/deactivates, and supports selective
Reset & Rescan. **Hide** removes a plug-in from insert menus while still scanning
and loading it from projects; **Ignore** removes it from menus and scanning.
[C-015]

Apple release notes document crashes during AU scanning and fixes to Plug-in
Manager search/folder handling, confirming scanning is a distinct failure
surface. However, scan trigger timing, validator subprocesses, cache location
and schema, invalidation keys, duplicate component identity, all-AU reset
internals, OS quarantine, notarization decisions, and automatic versus manual
blacklisting remain `UNKNOWN`. “Ignore” is a user policy, not proof of security
quarantine. [C-016]

### 11.3 Runtime isolation and compatibility

For Apple-silicon Macs, Apple says AU problems cannot cause Logic to quit or stop
responding, although settings or other data can still be lost. This is a
documented containment result, not a complete sandbox guarantee. [C-017]

The generic AU framework defaults AUv2 to host-process loading and AUv3 to
out-of-process loading; macOS hosts can request in-process AUv3. Logic's exact
choices are not disclosed, and the Apple-silicon containment statement prevents
assuming the generic AUv2 default is Logic's current topology. [C-018][C-040]

On Apple silicon, Logic recognizes Intel-only AUv2/AUv3 after Rosetta is
installed while Logic normally remains native. Listed ARA integrations require
running Logic itself under Rosetta; native-only features may then be absent.
32-bit AUs are not established as supported in the current scope. [C-019][C-020]

On iPad, AUv3 uses the platform extension model and App Store installation. The
precise per-instance/per-vendor process grouping, memory cap, restart behavior,
and extension sandbox entitlements are `UNKNOWN` for Logic. [C-021][C-040]

### 11.4 Host/plugin processing contract

Mac supports AU effects, instruments, and MIDI plug-ins. Multi-output AU
instruments route additional outputs through aux strips; sidechain-capable AUs
can select tracks, hardware inputs, or buses. iPad release notes document AUv3
multi-output and sidechain support/fixes. [C-012][C-022]

The AU framework exposes real-time render blocks, parameter scheduling, a
parameter tree, and asynchronous instantiation/UI retrieval. Logic offers
sample-accurate plug-in automation where the AU supports it and full-path delay
compensation. [C-018][C-023][C-024]

`UNKNOWN`: maximum AU bus counts by edition; arbitrary channel-layout mapping;
dynamic bus renegotiation; MIDI event timestamp fidelity; complete MPE/MIDI 2.0
delivery to third-party AUs; tail reporting; suspend/sleep; bypass semantics at
the render callback; in-place processing; offline-render flags; and deterministic
offline results. These require a purpose-built AUv2/AUv3 probe suite. [C-040]

### 11.5 Parameters, automation, state, presets, and project recall

Logic exposes vendor Editor and generic Controls views; the latter presents AU
functions as sliders/numeric fields. Plug-in settings are stored with and
recalled from the project and can be loaded, saved, compared, copied/pasted,
reset, and made default. [C-025][C-026]

Logic can request sample-accurate plug-in parameter automation, with Apple's
explicit caveat that not every AU supports it. Public AU APIs provide parameter
trees and scheduling, but Logic's parameter-ID migration, text/range caching,
gesture coalescing, and handling of removed/renamed parameters are `UNKNOWN`.
[C-023][C-040]

Apple's generic sandbox-host note assigns hosts responsibility for persisting AU
state and security-scoped external-file references. It does not establish
Logic's current `.logicx` encoding. Opaque state schema, asset bookmark policy,
state-size limits, preset compatibility, and migration between AUv2/AUv3 builds
remain `UNKNOWN`. [C-025][C-036][C-040]

### 11.6 UI, diagnostics, and failure modes

Logic offers resizable/scalable plug-in windows, vendor Editor or generic
Controls UI, shared headers, linked-window modes, sidechain selection, undo/redo,
and host settings/preset controls. Current release notes include fixes for AUv3
resizing and third-party AU UI loading. [C-026][C-027]

Diagnostics visible to users include scan compatibility, unexpected-quit count,
overload alerts, per-thread performance meters, missing/incompatible plug-in
alerts, and disabled plug-ins on iPad. [C-015][C-027][C-028]

Headless AU behavior, accessibility of every vendor UI, crash restart in place,
log correlation, per-instance CPU/memory metering, state rollback after helper
failure, and UI-process versus render-process separation remain `UNKNOWN`.
[C-040]

## 12. Extensibility and integration

The supported third-party DSP/instrument boundary is Audio Units. Integration
also includes Logic Remote, MIDI Learn, control-surface plug-ins/protocols,
EuCon, Mackie/HUI, TouchOSC, key commands, Ableton Link, virtual MIDI, and ARA
for listed products. Release notes mention Lua in the controller/MIDI context,
but no stable general Logic scripting SDK or project-object API was established.
[C-012][C-030]

AU authoring uses Apple's platform SDK and signing/distribution mechanisms; an
AU being technically discoverable does not grant trademark, App Store,
notarization, redistribution, or commercial rights. [C-036][C-037]

## 13. Project format, persistence, interoperability, and collaboration

Mac and iPad share `.logicx`; iPad requires a package and cannot open a Mac
folder project. Packages can collect project audio, and consolidation is the
documented remedy for missing files. Mac 10.7.8+ is the roundtrip floor.
[C-031]

Cross-device compatibility is partial: iPad rejects listed constructs including
surround, >96 kHz projects, some ruler/start configurations, arrange folders,
and some external-MIDI/no-output projects. Incompatible third-party iPad AUs are
disabled; bouncing affected tracks is Apple's audible-portability workaround.
Some Apple-only devices remain audible/preset-loadable but non-editable on the
other platform. [C-028][C-029][C-031]

Mac AAF exchange carries used audio regions, track/time references, and volume
automation—not plug-in graphs or AU state. Other documented boundaries include
Final Cut Pro XML, standard MIDI, MusicXML, ADM BWF64, audio/stem export, Apple
Loops, and opening older Logic projects. No DAWproject export/import is
documented. [C-031]

Project alternatives/backups, 200-step undo, autosave behavior, and application
backup-before-update guidance are documented, but `.logicx` schema, forward-save
guarantees, merge semantics, version-control friendliness, missing-AU state
retention, and collaborative conflict resolution are `UNKNOWN`. [C-032][C-040]

## 14. Delivery, live, post-production, and specialized workflows

Logic documents bounce/export to PCM and compressed formats, track/region/stem
export, Final Cut Pro XML/video workflows, SMPTE/timecode facilities, surround,
Dolby Atmos monitoring, ADM BWF64 import/export, and encoded spatial-audio
delivery in current releases. [C-033]

Live Loops supports performance-oriented launching, but Logic Pro is not treated
here as a dedicated show-control host. DDP, ADR workflow depth, batch delivery,
and guaranteed loudness-conformance behavior were not sufficiently evidenced
and remain `UNKNOWN`. [C-033][C-040]

## 15. Performance, reliability, security, and accessibility

Performance controls include buffer sizes, processing threads, process-buffer
range, playback/live multithreading, summing precision, overload alerts,
per-thread meters, freeze, and low-latency mode. A serial live signal path can
still bottleneck one thread despite spare aggregate CPU. [C-006][C-024][C-034]

Reliability surfaces include scan validation/rescan, unexpected-quit counters,
Apple-silicon AU crash/hang containment, autosave/backups, and extensive release
fixes. Containment does not prevent plug-in state/data loss. [C-015][C-017]
[C-027][C-032]

Generic AUv3 defaults to out-of-process, and Apple's AU sandbox guidance defines
sandbox-safe components and host-managed secure file references. Logic's actual
entitlements, helper sandbox profiles, code-signing/notarization enforcement,
telemetry, and plug-in trust decisions are not public in the retained sources.
[C-018][C-036][C-040]

Both current release ledgers include VoiceOver/accessibility fixes. This proves
active accessibility work in host UI, not universal accessibility of third-party
custom AU interfaces. [C-035]

## 16. Licensing, ecosystem, and implementation constraints

Logic is proprietary Apple software distributed through the App Store and Apple
Creator Studio. Apple Creator Studio's support page distinguishes subscription
from one-time Mac purchases and points to separate terms for included content.
[C-002][C-037]

Audio Units are Apple platform technologies. Developers must independently
assess current SDK terms, code signing, notarization, sandbox/App Extension,
App Store, trademark, and third-party content licenses. Nothing in this dossier
grants a license or is legal advice. [C-036][C-037]

The absence of VST/AAX/etc. from Logic's public host surfaces is not permission
to wrap, redistribute, translate, or claim compatibility with those formats.
VST2's licensing history and AAX certification are outside this Logic-specific
evidence claim. [C-013][C-037]

Clean-room boundary: adapt abstract patterns only; do not copy Logic UI assets,
manual expression, project schema, private APIs, binaries, or SDK code. [C-037]

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** A narrow native format yields a coherent validation, menu, state,
automation, sidechain, multi-output, and cross-device story. Apple-silicon AU
containment and visible scan/quit diagnostics are strong reliability patterns.
The scheduler exposes actionable controls and diagnostic meters rather than
hiding all real-time constraints. [C-038]

**Liabilities.** Format breadth is low; Mac/iPad portability depends on matching
AUv3 availability and project-feature subsets; Rosetta/ARA creates an
architecture-mode cliff; and a live routed path can serialize onto one thread.
Missing plug-ins have an audible-render workaround but no documented universal
editable placeholder/state-survival guarantee. [C-039]

**Lesson.** Logic is a valuable reference for host lifecycle UX and explicit
failure boundaries, not for a cross-platform format strategy or a publicly
specified internal engine. [C-038][C-039][C-040]

## 18. Transferable patterns

| Pattern | Problem / minimal mechanism | Support | Prerequisites and tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Scan-state manager | Persist per-component compatibility and crash count; expose selective reset/rescan and separate Hide from Ignore | C-015,C-027 | Stable identity, safe scanner, clear recovery; stale-cache and false-negative risk | Medium; do not copy UI/expression | CANDIDATE |
| Contained plug-in runtime | Keep host responsive when a plug-in fails; surface recoverable data-loss warning | C-017,C-018 | IPC/shared-memory real-time design, restart/state protocol; latency/complexity | High | CONDITIONAL |
| Architecture bridge without translating host | Recognize legacy-architecture plug-ins through a compatibility service while host remains native | C-019 | OS translation support, signing/security policy; legacy debt | High/platform-specific | CONDITIONAL |
| Explicit live-path serial budget | Model and meter the single-thread critical path across track, inserts, sends/returns | C-034 | Accurate graph critical-path analysis; may expose confusing limits | Low | CANDIDATE |
| Dual plug-in UI | Prefer vendor UI but provide generated parameter controls and scalable host chrome | C-026 | Stable parameter model/text/ranges; generic UI may be unwieldy | Low | CANDIDATE |
| Rendered portability fallback | Preserve editable source alternative while rendering sound for a less-capable target | C-028,C-031 | Asset management and provenance; larger projects, stale renders | Low | CANDIDATE |
| Capability-gated precision | Offer sample-accurate automation but detect/declare plug-ins that cannot honor it | C-023 | Timestamped parameters and conformance tests; CPU cost | Medium | CANDIDATE |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject “one proprietary platform format is enough” for a cross-platform
  DAW.** Logic's AU-only ecosystem is coupled to macOS/iPadOS. Reopen only if the
  target product becomes Apple-only. [C-012][C-039]
- **Reject treating format discovery as full compatibility.** Scan success does
  not prove instantiation, buses, UI, automation, state, or offline rendering.
  [C-015][C-040]
- **Reject silent dropping of unavailable processing.** Logic's disable/alert
  and bounce guidance is preferable, but its universal state-survival behavior
  is still unknown. [C-028][C-029]
- `CURIOSITY_NO_GO`: infer exact `AUHostingService` names/cardinality from
  generic AU defaults. Logic-specific options are undisclosed; a process name is
  not an architecture contract. [C-018][C-040]
- `CURIOSITY_NO_GO`: reverse engineer `.logicx`, scan caches, identity keys, or
  entitlements. This exceeds the lawful documentary boundary and is unnecessary
  for the current decision. [C-016][C-037]
- `CURIOSITY_NO_GO`: continue searching for a vendor sentence denying each of
  VST/AAX/CLAP/LV2/etc. Repeated official searches were rate-limited/duplicative;
  the matrix retains honest UNKNOWN+INFERENCE labels. [C-013]
- `CURIOSITY_NO_GO`: exhaustive native plug-in/content inventory, historical
  Emagic implementation lineage, Rosetta security internals, and detailed AAF
  edge cases. They are low novelty or do not change the architecture decision.
  [C-041]

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary result | Counterevidence/contradiction | Later discriminating probe |
| --- | --- | --- | --- |
| H1: “Logic hosts every common Mac plug-in format.” | **Failed.** Only AUv2/AUv3 are affirmatively documented. [C-012][C-013] | No direct Apple negative sentence for every other format | Install signed no-op fixtures in each format on a disposable Mac; record menus/scanner logs |
| H2: “AU accepted” implies full contract. | **Failed.** Apple documents scan failures, AU automation caveat, sidechain differences, and UI/state loss modes. [C-015][C-017][C-023][C-027] | Format API supplies capabilities but host/plugin combinations vary | AUv2/AUv3 matrix: scan, instantiate, render, buses, UI, automation, state, offline |
| H3: “All Logic AUs are in-process.” | **Failed/contradicted.** AUv3 is out-of-process by framework default and Apple-silicon Logic contains AU crashes; exact Logic topology remains unknown. [C-017][C-018] | Generic API says AUv2 defaults in-process | Observe only owned test AUs and public process/log APIs in a disposable fixture |
| H4: “Rosetta requires translating Logic.” | **Failed for ordinary Intel AUs.** Logic normally remains native after Rosetta installation; listed ARA use requires full Logic Rosetta. [C-019][C-020] | Article is from 2023; current vendor plug-ins may have native updates | Test native host + Intel AU and ARA fixture on supported OS, noting feature losses |
| H5: “Same `.logicx` means parity.” | **Failed.** iPad has explicit unsupported project constructs and plug-in conditions. [C-028][C-031] | Some shared Apple plug-ins remain audible but non-editable | Roundtrip a capability corpus; diff only user-visible results, not private format |
| H6: “Missing plug-ins are durable placeholders.” | **Unresolved.** Disabled/open-editable is documented on iPad, but exact state survival after edits/saves is not. [C-028][C-029] | Bounce guidance suggests rendering, not guaranteed placeholder fidelity | Save Mac AU state, open/edit/save on iPad without AU, return to Mac, verify state hash via fixture |
| H7: “Delay compensation proves tails/offline fidelity.” | **Failed as overclaim.** PDC and bounce behavior are documented; tails and offline flags are not. [C-024][C-040] | None retained | Impulse/latency/tail AU fixture in real-time and offline bounce |

The acceptance distinction is explicit: **format accepted → scanned →
instantiated → rendered → full host contract** are separate gates. [C-042]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current lines are Mac 12.3.1/current guide 12.3 and iPad 3.3; Mac notes cover one-time and Creator Studio | Cutoff | S-001,S-002,S-018 | Version/publish statements | Creator Studio lists 12.3, not patch 12.3.1 |
| C-002 | DOCUMENTED | High | Edition/commercial/platform requirements differ between standalone and Creator Studio evidence | Current family | S-003,S-004,S-018 | Direct requirements and purchase text | Generic tech-spec page may lag edition detail |
| C-003 | DOCUMENTED | High | Logic combines linear tracks/regions with Live Loops, step/pattern, score, comping, and Session Players | Mac/iPad current | S-001,S-002,S-003 | Feature ledgers/specs | Internal object model unknown |
| C-004 | DOCUMENTED | High | Core Audio is the Mac hardware/engine boundary exposed in settings | Mac 12.3 | S-017 | Direct guide section | Does not map internal services |
| C-005 | UNKNOWN | High | Complete proprietary engine graph/process/storage architecture is not public in retained evidence | Current family | — | Attempted official guides/developer docs | Safe runtime probes may narrow only behavior |
| C-006 | DOCUMENTED | High | Audio precision/rates, buffering, threads, process buffers, summing, and diagnostics are user-configurable/documented | Mac current | S-003,S-013,S-017 | Direct specs/settings | Advertised maxima not independently measured |
| C-007 | DOCUMENTED | High | Regions, takes/comps, alternatives, Flex, Smart Tempo, folders/stacks, and undo are documented | Mac/iPad current | S-001,S-002,S-003 | Feature/guide evidence | Destructive edge cases not surveyed |
| C-008 | DOCUMENTED | Medium-High | MIDI editing/score/SysEx/controller workflows and limited MIDI 2.0/MPE features are documented | Current family | S-001,S-002,S-003,S-008 | Release/spec/guide contents | Not a complete third-party event contract |
| C-009 | DOCUMENTED | High | Mac mixer capacities, sends/buses, surround, groups and stacks are documented | Mac current | S-003,S-011,S-012 | Direct limits/workflows | Runtime scaling not measured |
| C-010 | DOCUMENTED | High | Recording, monitoring, comping and common media/asset workflows are documented | Current family | S-001,S-002,S-003,S-015 | Direct support pages | Relink internals unknown |
| C-011 | DOCUMENTED | High | Logic ships native instruments/effects/MIDI devices and downloadable content | Current family | S-001,S-002,S-003 | Direct inventory/release notes | Inventory changes over time |
| C-012 | DOCUMENTED | High | Mac supports AU effect/instrument/MIDI plug-ins, AUv2 and AUv3; iPad supports third-party AUv3 | Current family | S-003,S-004,S-006,S-008 | Direct support text | “Most” qualifier for Apple-silicon AUs |
| C-013 | INFERENCE | High | Non-AU required formats are not hosted natively | Current family | S-003,S-004,S-006,S-008 | Complete official host surfaces name only AU; alternative is undocumented support | Absence is not direct vendor exclusion; wrappers excluded |
| C-014 | DOCUMENTED | High | Mac AUv2/AUv3 packaging, install locations, menu discovery and `(AU3)` marking differ | Mac 12.3 | S-008 | Direct guide text | Per-user AUv2 path/edge cases not covered |
| C-015 | DOCUMENTED | High | Plug-in Manager shows scan compatibility/quit count and supports Hide, Ignore, activation and rescan | Mac 12.3 | S-005 | Direct guide text | Validator/cache internals absent |
| C-016 | UNKNOWN | High | Cache, duplicate identity, quarantine, blacklist automation and validation process topology are undisclosed | Mac current | S-001,S-005 | Official pages inspected; release notes confirm scan failure surface | “Ignore” must not be equated to security quarantine |
| C-017 | DOCUMENTED | High | On Apple silicon, AU issues cannot quit/hang Logic but may lose settings/data | Mac 12.3/Apple silicon | S-008 | Direct Apple sentence | No exact process/sandbox details |
| C-018 | DOCUMENTED | High | AU API default is AUv2 in host process and AUv3 out-of-process; macOS may request in-process AUv3 | Generic Apple AU framework | S-009 | Direct developer docs | Not proof of Logic's options; tension with C-017 |
| C-019 | DOCUMENTED | High | Intel-only AUs are recognized on Apple silicon after Rosetta install while Logic normally stays native | Apple-silicon Logic | S-007 | Direct Apple support | Article published 2023 |
| C-020 | DOCUMENTED | High | Listed ARA integrations require Logic itself under Rosetta | Apple-silicon Logic | S-007,S-001 | Direct support plus current Rosetta release fixes | Vendor versions may evolve |
| C-021 | DOCUMENTED | High | iPad hosts AUv3 extensions installed separately from the App Store | iPad current | S-002,S-004 | Direct support/release text | Process grouping/resource limits unknown |
| C-022 | DOCUMENTED | High | AU multi-output and sidechain workflows exist on Mac; iPad notes document AUv3 multi-out/sidechain | Current family | S-002,S-011,S-012 | Direct guide/release text | Dynamic/arbitrary bus layouts unknown |
| C-023 | DOCUMENTED | High | Logic can request sample-accurate plug-in automation, but not all AUs support it | Mac 12.3 | S-009,S-013 | Direct guide/API | iPad sample-accuracy not separately established |
| C-024 | DOCUMENTED | High | PDC covers full Mac signal paths; low-latency mode can bypass plug-ins/disable sends and is inactive for bounce | Mac 12.3 | S-003,S-013 | Direct settings/spec | Tail/offline contract unknown |
| C-025 | DOCUMENTED | High | Plug-in settings are stored/recalled with projects and support preset operations | Mac 12.3 | S-010,S-014 | Direct Logic guide; generic host state duties | Exact `.logicx` encoding unknown |
| C-026 | DOCUMENTED | High | Logic provides vendor Editor and generic Controls UI, scaling, linking and common host chrome | Mac 12.3 | S-012 | Direct guide | Headless/vendor accessibility not guaranteed |
| C-027 | DOCUMENTED | High | Release notes and manager expose scanning/UI/crash failure modes and diagnostics | Current family | S-001,S-002,S-005,S-008 | Direct ledgers/guide | Vendor claims, not independent reliability metrics |
| C-028 | DOCUMENTED | High | iPad disables incompatible third-party plug-ins but keeps project editable; bounce is recommended for audible portability | Cross-device | S-004,S-015 | Direct support text | State survival not promised |
| C-029 | UNKNOWN | High | Complete unavailable-AU state survives every edit/save/roundtrip | Cross-device | S-004,S-015 | Attempted official roundtrip/support pages | Needs controlled state-hash probe |
| C-030 | DOCUMENTED | Medium-High | Logic exposes remotes/control protocols/MIDI learn but no general scripting SDK was established | Current family | S-001,S-002,S-003 | Direct integrations; negative bounded to retained docs | Private/unsupported APIs excluded |
| C-031 | DOCUMENTED | High | `.logicx` package roundtrip is partial; AAF/audio/MIDI/MusicXML/FCPXML/ADM boundaries are documented | Current family | S-003,S-015,S-016 | Direct support/specs | No plug-in state via AAF; DAWproject not documented |
| C-032 | DOCUMENTED | Medium-High | Undo, backups/alternatives and autosave/update-backup behavior are documented | Mac current | S-001,S-003,S-008 | Release notes/spec/guide contents | Recovery journal and guarantees unknown |
| C-033 | DOCUMENTED | High | Logic supports major music/spatial/video delivery paths including ADM BWF64 and Atmos | Mac current | S-001,S-003 | Direct specs/releases | DDP/ADR depth not established |
| C-034 | DOCUMENTED | High | Track+plug-ins use one thread; live signal-flow strips share it and may spike CPU | Mac 12.3 | S-017 | Direct settings note | Complete scheduler unknown |
| C-035 | DOCUMENTED | High | Current Mac/iPad releases include active VoiceOver/accessibility work | Current family | S-001,S-002 | Direct release ledgers | Third-party UI accessibility not assured |
| C-036 | DOCUMENTED | Medium | Generic AU framework defines out-of-process/sandbox-safe/state-file mechanisms | Apple AU framework | S-009,S-010 | Primary format-owner docs | 2014 sandbox note; not Logic entitlement proof |
| C-037 | DOCUMENTED | High | Distribution/content are governed by Apple/App Store/Creator Studio and separate terms; no rights granted here | Current ecosystem | S-018 | Direct commercial/terms pointers | Legal interpretation excluded |
| C-038 | INFERENCE | Medium-High | Validation UX, containment, dual UI, rendered fallback, and visible critical-path controls are transferable patterns | Architecture synthesis | C-015,C-017,C-023,C-026,C-028,C-034 | Abstract mechanisms only | Tradeoffs require prototypes |
| C-039 | INFERENCE | High | AU-only/platform coupling, partial roundtrip, Rosetta/ARA cliffs and serial live paths are liabilities for a cross-platform reference | Architecture synthesis | C-012,C-020,C-028,C-031,C-034 | Decision-frame fit | Product quality is not being judged globally |
| C-040 | UNKNOWN | High | Exact processes/IPC, cache/identity, tails, suspend, dynamic I/O, offline determinism, state schema and several security details remain unknown | Current family | — | Public clean-room search saturated | Requires safe fixtures or vendor disclosure |
| C-041 | UNKNOWN | High | Historical implementation lineage beyond Apple's 2013 product record is not established here | History | S-003 | Deliberately bounded as low relevance | Reopen only for a history-specific decision |
| C-042 | INFERENCE | High | Format acceptance, scan, instantiate, render, and full-contract conformance must be separate qualification gates | Host-testing synthesis | C-015,C-017,C-022,C-023,C-025,C-026 | Failure surfaces differ | Requires dynamic conformance corpus |

## 22. Source ledger and adaptive bibliography

All sources were accessed **2026-08-29**. Apple pages are vendor documentation:
they establish what Apple documents, not independent runtime measurement.

- **S-001 — “Logic Pro for Mac release notes,” Apple Support.**
  URL: https://support.apple.com/en-us/109503. Kind: official release ledger.
  Scope: through 12.3.1, published 2026-08-14. Relevant sections: 12.3.1,
  12.3, 12.2, 12.0; AU scanning/UI, automation, Rosetta, accessibility,
  autosave, spatial export. Supports C-001,C-003,C-007,C-008,C-010,C-011,C-016,
  C-020,C-027,C-030,C-032,C-033,C-035. **Selected** to pin current Mac version and
  concrete failure modes; preferable to marketing summaries. Limitation:
  changelog is not a complete contract or independent test.
- **S-002 — “Logic Pro for iPad release notes,” Apple Support.**
  URL: https://support.apple.com/en-us/101628. Kind: official release ledger.
  Scope: through 3.3. Relevant sections: 3.3, 3.0, 2.2.1, 2.2, 2.1; AUv3
  multi-output, sidechain, UI/MIDI fixes, automation/accessibility. Supports
  C-001,C-003,C-007,C-008,C-010,C-011,C-021,C-022,C-027,C-030,C-035. **Selected**
  as current iPad primary evidence; preferable to App Store copy. Limitation:
  long cumulative ledger and not a full hosting specification.
- **S-003 — “Logic Pro — Tech Specs,” Apple Support.**
  URL: https://support.apple.com/en-us/111899. Kind: official specifications.
  Scope: current Mac page; “Year introduced: 2013.” Relevant sections: minimum
  requirements, General, Audio, Plug-ins and Sounds, Mixer, Control Surfaces,
  Surround/Spatial, Compatibility. Supports C-002,C-003,C-006–C-013,
  C-024,C-030–C-033,C-041. **Selected** for limits and compatibility breadth;
  preferable to feature marketing. Limitation: generic requirements conflict
  with stricter Creator Studio requirements and maxima are not measured here.
- **S-004 — “About Logic Pro for iPad,” Apple Support.**
  URL: https://support.apple.com/en-us/101825. Kind: official support article.
  Scope: published 2026-04-16. Relevant sections: compatible devices,
  subscription, external hardware, third-party AUv3, incompatible plug-ins.
  Supports C-002,C-012,C-013,C-021,C-028,C-029. **Selected** for explicit
  iPad plug-in and missing-plug-in behavior; preferable to release-note inference.
  Limitation: no exact process/state-survival contract.
- **S-005 — “Use the Plug-in Manager in Logic Pro for Mac,” Apple Logic Pro
  User Guide.** URL: https://support.apple.com/guide/logicpro/use-the-plug-in-manager-lgcp9e26ef17/12.3/mac/15.6.
  Kind: versioned official guide. Scope: Logic 12.3/macOS 15.6 guide view.
  Relevant passage: compatibility, quit count, Hide versus Ignore, Reset &
  Rescan. Supports C-015,C-016,C-027. **Selected** for direct lifecycle
  UX semantics; preferable to troubleshooting forums. Limitation: cache and
  validator implementation absent.
- **S-006 — “Overview of plug-ins in Logic Pro for Mac,” Apple Logic Pro User
  Guide.** URL: https://support.apple.com/guide/logicpro/plug-ins-overview-lgcpbc218dde/12.3/mac/15.6.
  Kind: versioned official guide. Scope: Logic 12.3. Relevant passage: support
  for third-party Audio Units and Audio Unit Extensions and Plug-in Manager.
  Supports C-012,C-013. **Selected** as official format overview; preferable to
  third-party format lists. Limitation: does not explicitly deny other formats.
- **S-007 — “About third-party Audio Units and external device compatibility in
  Logic Pro and Final Cut Pro on Mac computers with Apple silicon,” Apple
  Support.** URL: https://support.apple.com/en-us/102082. Kind: official support
  article. Scope: published 2023-08-21. Relevant sections: AUv2/AUv3, Intel AU
  recognition after Rosetta, native Logic expectation, listed ARA exceptions.
  Supports C-019,C-020. **Selected** for architecture compatibility; preferable
  to vendor anecdotes. Limitation: dated 2023; does not reveal bridge topology.
- **S-008 — “Work with Audio Units in Logic Pro for Mac,” Apple Logic Pro User
  Guide.** URL: https://support.apple.com/guide/logicpro/work-with-audio-units-in-logic-pro-for-mac-lgcp22a0dab0/12.3/mac/15.6.
  Kind: versioned official guide. Scope: Logic 12.3. Relevant passages: AUv2/
  AUv3 locations, `(AU3)` marker, same host workflows, Apple-silicon containment
  and possible settings/data loss. Supports C-008,C-012–C-014,C-017,C-027,
  C-032. **Selected** as the strongest Logic-specific AU boundary; preferable to
  generic framework docs. Limitation: no helper cardinality/IPC.
- **S-009 — “Migrating Your Audio Unit Host to the AUv3 API,” Apple Developer
  Documentation.** URL: https://developer.apple.com/documentation/audiotoolbox/migrating-your-audio-unit-host-to-the-auv3-api
  (content also retrieved from Apple's DocC JSON endpoint). Kind: primary format
  owner developer documentation. Scope: current Audio Toolbox. Relevant
  passages: AUv3 model, AUv2 bridge, discovery, AUv2 in-process/AUv3
  out-of-process default, render, parameter scheduling/tree, custom UI. Supports
  C-018,C-023,C-036. **Selected** to bound framework defaults; preferable to
  observed process names. Limitation: generic host API, not Logic choices.
- **S-010 — “Audio Unit Host Sandboxing Guide” (TN2312), Apple Developer
  Documentation Archive.** URL: https://developer.apple.com/library/archive/technotes/tn2312/_index.html.
  Kind: primary archived technical note. Scope: updated 2014-03-06. Relevant
  sections: sandbox-safe flags, preflight, AU preset/document state and secure
  file references. Supports C-025,C-036. **Selected** for format-owner state and
  sandbox responsibilities; preferable to speculation. Limitation: old and not
  evidence of current Logic entitlements/serialization.
- **S-011 — “Use multi-output instruments in Logic Pro for Mac,” Apple Logic Pro
  User Guide.** URL: https://support.apple.com/guide/logicpro/use-multi-output-instruments-lgcp8e887f45/12.3/mac/15.6.
  Kind: versioned official guide. Scope: Logic 12.3. Relevant passage: all AU
  instruments exposing multi-out; first stereo pair plus aux outputs. Supports
  C-009,C-022. **Selected** for explicit AU bus UX; preferable to plug-in vendor
  examples. Limitation: no arbitrary/dynamic bus contract.
- **S-012 — “Work in the plug-in window in Logic Pro for Mac,” Apple Logic Pro
  User Guide.** URL: https://support.apple.com/guide/logicpro/work-in-the-plug-in-window-lgcpbc21a1fd/12.3/mac/15.6.
  Kind: versioned official guide. Scope: Logic 12.3. Relevant sections: Editor/
  Controls, scaling, link modes, sidechain sources and AU caveat. Supports
  C-009,C-022,C-026. **Selected** for UI and sidechain contract; preferable to
  screenshots/reviews. Limitation: no headless/accessibility guarantee.
- **S-013 — “General Audio settings in Logic Pro for Mac,” Apple Logic Pro User
  Guide.** URL: https://support.apple.com/guide/logicpro/general-settings-lgcp0ed343a9/12.3/mac/15.6.
  Kind: versioned official guide. Scope: Logic 12.3. Relevant sections: sample-
  accurate automation, AU caveat, PDC, Low Latency mode/30 ms/bounce behavior.
  Supports C-006,C-023,C-024. **Selected** for exact host controls; preferable
  to generalized latency claims. Limitation: no plug-in tail/offline API detail.
- **S-014 — “Work with plug-in settings in Logic Pro for Mac,” Apple Logic Pro
  User Guide.** URL: https://support.apple.com/guide/logicpro/work-with-plug-in-settings-lgcp4dcb0092/12.3/mac/15.6.
  Kind: versioned official guide. Scope: Logic 12.3. Relevant passage: settings
  stored/recalled with project; load/save/compare/copy/paste/default. Supports
  C-025. **Selected** for project recall semantics; preferable to generic AU API
  assumptions. Limitation: exact encoding/migration absent.
- **S-015 — “Work on a Logic Pro project on your iPad and your Mac,” Apple
  Support.** URL: https://support.apple.com/en-us/101624. Kind: official support
  article. Scope: published 2026-07-06. Relevant sections: package `.logicx`,
  sharing, plug-in incompatibility, bounce workaround, rejected project
  constructs, missing-file consolidation. Supports C-010,C-028,C-029,
  C-031. **Selected** for direct portability/missing-dependency behavior;
  preferable to generic compatibility claims. Limitation: no universal third-
  party state-survival promise.
- **S-016 — “AAF files in Logic Pro for Mac,” Apple Logic Pro User Guide.**
  URL: https://support.apple.com/guide/logicpro/aaf-files-lgcp6f2262ba/12.3/mac/15.6.
  Kind: versioned official guide. Scope: Logic 12.3. Relevant passage: used
  regions, track/time references, volume automation, sample-rate/bit-depth
  choices. Supports C-031. **Selected** to bound DAW exchange; preferable to
  treating “AAF supported” as full project interchange. Limitation: edge cases
  and third-party roundtrip fidelity untested.
- **S-017 — “Audio Devices settings in Logic Pro for Mac,” Apple Logic Pro User
  Guide.** URL: https://support.apple.com/guide/logicpro/audio-devices-settings-lgcpbb81aca5/12.3/mac/15.6.
  Kind: versioned official guide. Scope: Logic 12.3. Relevant sections: Core
  Audio, I/O buffers, processing threads, process-buffer range, multithreading,
  one-thread live signal path, summing. Supports C-004,C-006,C-034. **Selected**
  for the strongest public scheduling boundary; preferable to inferred engine
  diagrams. Limitation: user settings are not a full scheduler specification.
- **S-018 — “About Apple Creator Studio,” Apple Support.**
  URL: https://support.apple.com/en-us/125029. Kind: official commercial/support
  article. Scope: published 2026-06-30. Relevant sections: included app versions,
  one-time purchases, cancellation/project access, system requirements, content
  terms. Supports C-001,C-002,C-037. **Selected** to reconcile edition scope and
  requirements; preferable to search snippets. Limitation: suite requirements
  do not override standalone technical specs.

**Negative results retained:** the guessed Apple `/logic-pro/specs` search and
Apple Support search endpoint produced no usable result; two later web searches
for VST/AAX exclusion and automation text were rate-limited (`HTTP 429`). No
non-Apple result was promoted to evidence. The versioned guide itself supplied
the required primary passages.

## 23. Unknowns and next discriminating probes

| Unknown | Attempt/blocker and impact | Available evidence | Safest next probe | Access/fixture; owner |
| --- | --- | --- | --- | --- |
| Exact Logic AUv2/AUv3 process topology and architecture bridge | Official Logic docs state containment but not helper grouping/IPC; affects failure-domain design | C-017–C-019 | Owned signed AUv2/AUv3 fixtures; observe public process/log behavior during instantiate/crash on disposable Apple-silicon Mac | macOS test host + fixtures; unassigned |
| Scanner/cache/identity/quarantine | Manager UX documented; cache schema, duplicate IDs and security quarantine absent; affects deterministic recovery | C-014–C-016 | Install fixture variants with controlled component IDs/versions; record only user-visible manager states and supported logs | Disposable Mac; unassigned |
| Full bus/event contract | Multi-out/sidechain exist, but dynamic I/O, max layouts, MIDI 2.0/MPE fidelity unknown | C-022,C-023 | AU conformance fixture enumerating buses/layout changes/timestamped MIDI and automation | AUv2/AUv3 SDK fixtures; unassigned |
| Tail/suspend/offline behavior | PDC/bounce documented, tail and offline flags absent; affects render correctness | C-024,C-040 | Impulse/latency/tail fixture, compare real-time and offline bounce with hashes/tolerances | Disposable projects; unassigned |
| Missing-AU state survival | iPad disables missing AUs but Apple does not promise untouched state after save; high durability impact | C-028,C-029 | State-hash AU on Mac → open/edit/save on iPad without extension → reopen on Mac | Matched Mac/iPad and owned AU; unassigned |
| Parameter identity/migration | Generic Controls and state recall exist; renamed/removed parameter handling absent | C-023,C-025 | Two fixture versions with stable/changed parameter IDs, ranges and display text | Signed fixture versions; unassigned |
| Logic project schema/recovery journal | Proprietary and clean-room boundary forbids reverse engineering; affects version-control/merge conclusions | C-032,C-040 | Ask Apple for public schema/compatibility guarantees; otherwise treat as opaque and test only supported open/save outcomes | Vendor disclosure or black-box fixture; unassigned |
| iPad engine/process/resource limits | No public render quantum/process grouping/memory cap found | C-021,C-040 | Public Instruments performance fixture with controlled AUv3 load and documented UI outcomes | Disposable iPad; unassigned |

## 24. Curiosity pass and stop decision

Scores use 1 (low) to 4 (high); cost 1 is cheap and 4 expensive.

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Exact Logic AU process topology | 4 | 4 | 4 | 4 | Best gap, but documentary marginal value is nonpositive; defer to fixture, no nested researcher |
| Missing-AU roundtrip state survival | 4 | 4 | 4 | 3 | High-value later dynamic probe; documentary sources saturated |
| Dynamic I/O/tail/offline matrix | 4 | 4 | 4 | 3 | High-value later conformance probe |
| More VST/AAX negative searching | 3 | 1 | 1 | 2 | `CURIOSITY_NO_GO`: repeated rate limits/absence; honest inference already captured |
| Reverse engineer `.logicx`/cache | 3 | 2 | 4 | 4 | `CURIOSITY_NO_GO`: outside clean-room authority |
| Rosetta security internals | 2 | 2 | 3 | 2 | `CURIOSITY_NO_GO`: generic OS detail will not change host design conclusion |
| Native device inventory/history | 1 | 1 | 1 | 2 | `CURIOSITY_NO_GO`: low decision value |

**Pursued curiosity thread:** the highest qualifying *documentary* thread was the
public AU process boundary. Apple framework documentation established AUv2/AUv3
defaults, while the Logic guide established stronger Apple-silicon containment;
the contradiction was resolved by narrowing the claim, not inventing a Logic
topology. [C-017][C-018][C-040]

**Stop decision:** `STOP_COVERAGE_SATURATION`. Every section and format row is
covered; requested hosting risks are documented or explicitly unknown; 18
primary Apple sources converged; repeated exclusion searches were blocked or
duplicative; and the remaining leading threads require controlled dynamic tests
or vendor disclosure. A nested researcher was not spawned because it could not
lawfully resolve the top proprietary/runtime gap within the documentary budget.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added only
  `research/daw-landscape/dossiers/apple-logic-pro.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See section 0.
- [x] **Every required dossier heading exists in order.** Sections 0–25 present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-IDs; section 21 classifies each.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  claims register and section 23.
- [x] **Every required plugin-format row is present.** Thirteen required rows in
  section 11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover lifecycle/runtime/contract/state/UI.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Claim classifications and matrix wording preserve the distinction.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 16 and 19.
- [x] **Bibliography records source rationale and limitations.** Eighteen entries
  in section 22, all with access date, passage, claims, rationale, limitations.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19
  and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Documentary retrieval only; no product/plugin execution.

**Checks performed:** heading/matrix/claim/source/checklist audits; source count
18; negative-result retention; workspace status, targeted no-index diff,
staged-path, and whitespace checks completed. **Unresolved
blockers:** exact process/cache/state/offline contracts require vendor disclosure
or later disposable fixtures. **Pre-existing workspace changes:** intentionally
left untouched; no staging or commit performed.
