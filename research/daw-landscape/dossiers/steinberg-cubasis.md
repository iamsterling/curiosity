# Steinberg Cubasis DAW dossier

> Research-only evidence. No design or implementation authority. Vendor claims
> establish what Steinberg/its store listings document, not independently
> measured runtime behavior.

## 0. Metadata and scope

- **Product family:** Steinberg Cubasis 3; full Cubasis 3 for iOS/iPadOS and
  Android/ChromeOS, plus the constrained Cubasis LE 3 editions where the
  edition boundary affects evidence.
- **Canonical vendor:** Steinberg Media Technologies GmbH.
- **Researcher/session:** `ses_fb27292bfffemjdAYxNJC2F3kn`.
- **Owned path:** `research/daw-landscape/dossiers/steinberg-cubasis.md`.
- **Research cutoff:** 2026-08-29 UTC.
- **Current evidenced release:** Cubasis 3.8.5 for iOS and Android, released
  2026-08-04. iOS App Store minimum: iOS 17.7; Android/ChromeOS support article:
  Android 8+, 64-bit `arm64-v8a` or `x86_64` [C-001].
- **Included:** touch project/track/audio/MIDI/mixer model; current full and LE
  edition boundaries; AUv3, IAA, Audiobus and product-native hosting; Android
  plug-in boundary; Cubase/DAWproject interoperability; files, recovery,
  hardware/control, IAP/licensing.
- **Excluded:** desktop Cubase except documented interchange; Nuendo; Cubasis 2
  except the documented IAP-transfer context; binary inspection, installation,
  and runtime qualification.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. Public documentation does not reveal
  plug-in process topology, scan/cache/blacklist design, PDC contract, complete
  AU state/UI semantics, or missing-plug-in representation [C-018–C-021].

## 1. Executive summary

Cubasis is a touch-first, linear mobile audio/MIDI DAW whose full editions keep
the familiar project → tracks/events → inspector/editor → mixer structure while
adapting it to rescalable phone/tablet UI, portrait/windowed use and external
displays [C-003, C-004]. The full iOS and Android editions share unlimited
audio/MIDI tracks, group/tempo/signature tracks, automation, sidechain, freeze,
and eight insert/send/master slots, but platform capabilities are intentionally
asymmetric [C-002, C-004].

The third-party-hosting headline is **AUv3 on full Cubasis iOS only**, including
instruments, effects, AU MIDI effects and instrument multi-output; current
documentation also continues to list Inter-App Audio and Audiobus 3 [C-011,
C-012]. Steinberg explicitly says Android has no comparable system-wide plug-in
standard, so Android instruments are integrated as Cubasis IAPs rather than
standalone plug-ins [C-013, C-017]. Current release notes prove search/preset,
freeze and several AU failure paths, but do not disclose validation, isolation,
latency compensation, full automation/state contracts, or missing-instance
recovery [C-014–C-021].

Interchange is unusually explicit: DAWproject 3.7.5+ carries a documented subset
of tracks, events, MIDI, tempo/signature, and mapped native devices to Cubase and
other supporting DAWs, while excluding AU/IAA/CLAP plug-ins, automation and
multiple outputs [C-023]. **Overall confidence: high** for product/platform and
feature boundaries, **medium** for workflow semantics inferred from vendor
feature descriptions, and **low/unknown** for proprietary internals.

## 2. Product identity, history, and market position

Steinberg distributes Cubasis 3 as a paid mobile DAW on iPhone/iPad and on
Android smartphones/tablets/Chromebooks, with IAP expansion; Cubasis LE supplies
a limited/trial path [C-001, C-002, C-027]. The current 3.8.5 release is common
to iOS and Android. The product is positioned for recording, editing, mixing and
sharing complete audio/MIDI productions on mobile devices, not as a desktop
Cubase edition [C-001].

The 3.x lineage relevant to architecture includes AU multicore improvements in
3.2, AU instrument multi-output and extended MIDI routing in 3.3, Ableton Link
in 3.4, plug-in/preset search in 3.6.5, tempo/signature tracks in 3.7,
DAWproject/Cubase exchange in 3.7.5, and current audio-routing/preset changes in
3.8/3.8.5 [C-006, C-008, C-014, C-015, C-023]. This is release provenance, not
evidence of internal implementation continuity.

## 3. Workflow and conceptual model

The documented mental model is a linear project/arranger with audio, instrument,
MIDI, effect and group tracks; named/colored/mutable events; dedicated audio,
MIDI and automation editors; track inspector; MediaBay/Home; and a zoomable,
full-screen mixer [C-003, C-004, C-023]. Touch affordances include pinch zoom,
event handles, minimaps, adaptive snap, scalable UI presets, phone/tablet layouts,
portrait mode and Apple Pencil fixes; keyboard and mouse shortcuts supplement
rather than replace touch [C-003].

There is no primary evidence in the retained set for a clip-launch/session view,
tracker, modular patch graph, score editor or post-production timeline. Those
models are **UNKNOWN**, not presumed absent [C-031].

## 4. Publicly documented architecture

Steinberg documents a 32-bit floating-point audio engine, multicore rendering for
larger AUv3 loads on newer iOS devices, and platform audio-session behavior, but
does not publish engine graph, scheduler/threading, service or process boundaries
[C-005, C-015, C-021]. A `.cbp` project is visibly a same-named folder plus
project file on Android, while the complete serialization schema is proprietary
and undocumented [C-022].

**INFERENCE:** because release notes can identify AU load, freeze, first-note and
app-quit crash defects, AU instances participate in several host lifecycle/render
paths. This does not determine whether DSP runs in-process, in an OS extension
process, or through another containment arrangement [C-016, C-019].

## 5. Audio engine

- The engine is documented as 32-bit floating point. iOS advertises audio I/O up
  to 24-bit/96 kHz; Android up to 24-bit/48 kHz [C-005].
- The comparison table lists iOS project resolution choices of 44.1/48/96 kHz
  and 16/24/32 bit, versus Android 48 kHz and 16/24 bit. It lists 64/64 physical
  iOS I/O, while App Store copy still says 24 assignable I/O; the actual current
  physical-channel ceiling is therefore unresolved [C-005].
- Real-time time-stretch/pitch-shift uses zplane élastique 3; audio and MIDI track
  freeze, mixdown and export are documented. AU freeze defects fixed in 3.8.5
  show that AUs can enter the freeze path [C-006, C-016].
- Buffer-size choices, block adaptation, oversampling, tail processing, dropout
  diagnostics, real-time/offline equivalence and plug-in delay compensation are
  **UNKNOWN** [C-020]. Bluetooth recording carries an explicit system-latency
  warning [C-010].

## 6. Tracks, timeline, clips, and editing

Full editions document unlimited audio and MIDI tracks (practically
device-resource bounded), group tracks, tempo/signature tracks, duplicate,
inspector, freeze, event name/color/mute/fades, audio gain reduction,
pitch-shift/time-stretch, audio glue, stereo-to-mono, and history-list undo
[C-004, C-006, C-023]. Cubasis LE iOS is limited to four audio and four MIDI
tracks and omits group tracks, freeze and automation until the full-feature IAP
[C-002].

The 3.4 update says arranger/editor zoom and position, mixer width and setup
choices are restored on reopen; this documents UI continuity, not an autosave
interval or durable version history [C-022]. Takes, lanes, comping, ripple edit,
shared clips and nondestructive-edit internals remain **UNKNOWN** [C-031].

## 7. MIDI, sequencing, notation, and expression

Cubasis provides 960-PPQN MIDI editing, piano-roll/editor functions, CC,
program-change and aftertouch data, pitch bend, auto-quantize, time-stretch,
chord/drum pads, note repeat, virtual keyboard, MIDI clock/thru, extended
track-to-track routing and hardware input [C-007]. Cubasis 3.8 imports/exports
tempo and signature data in MIDI files [C-007].

Full iOS additionally hosts AU MIDI effects; Android has no system-wide plug-in
equivalent [C-011, C-013]. MPE/per-note expression, MIDI 2.0, SysEx, MTC and
notation are **UNKNOWN** in the retained primary evidence [C-031].

## 8. Routing, mixer, automation, and control

Full editions provide a full-screen/zoom mixer, channel strip per track, group
tracks, eight insert, eight send and eight master slots, effect reordering,
insert pre/post-fader positioning, output-channel pinning, and sidechain support
[C-004, C-008]. The sidechain claim is product-level; third-party AU sidechain
bus negotiation and dynamic I/O are **UNKNOWN** [C-020].

The automation editor is included in full editions, event-handle copying now
copies automation, and Spin FX is expressly automatable. Parameter timing,
sample accuracy, third-party AU parameter identity/text/ranges and write modes
are not documented [C-009, C-020].

MIDI Learn, saved controller presets, Mackie Control (MCU), HUI, keyboard/mouse,
MIDI clock/thru and Ableton Link are documented on both main platforms, subject
to Android hardware limits [C-007, C-010]. OSC, EuCon, feedback routing, VCA and
surround/immersive buses are **UNKNOWN** [C-031].

## 9. Recording, comping, and media handling

Cubasis documents audio/MIDI record, input monitoring-oriented routing, overdub
and looper modes, external interfaces, Bluetooth recording, fades, real-time
stretch/pitch, freeze and mixdown [C-006, C-010]. Current Android changes handle
AudioFocus, optional permissions, full storage, write progress and recording
timing; Steinberg still does not guarantee broad Android interface compatibility
[C-010].

iOS format support lists AIFF, WAV, MP3, M4A, FLAC and MIDI; Android lists WAV,
MP3, FLAC and MIDI but not AIFF/M4A in the current comparison table [C-025].
Take lanes/comping, punch semantics, metadata/conform, proxies, video and asset
relinking are **UNKNOWN** [C-031].

## 10. Instruments, effects, content, and native devices

Current full editions list four included instruments—MicroSonic, Micrologue,
MiniSampler and LoFi Piano—19 effects, 502 effect presets, 331 included sounds
and 550 MIDI/audio loops [C-017]. Architecture-relevant native effects include a
per-track channel strip, Studio/Shelf EQ, compressor, gate, limiter, RoomWorks SE,
Master Strip, Spin FX, Amp Rack, Bass Amp and Tuner [C-017].

IAPs extend this native device ecosystem (for example HALion Sonic Play, Verve,
Etude, Iconica Sketch, FM Classics, Neo FM and effect packs). On iOS, some are
also standalone AUv3-compatible apps and ownership can unlock a Cubasis-optimized
plug-in version; Android gets the integrated Cubasis IAP form [C-017, C-027].
These “Cubasis plug-ins” are product-native devices and must not be misreported as
VST3 hosting.

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` in desktop columns means Cubasis has no documented desktop
edition; it does not characterize the format generally. `UNKNOWN` means the
retained current primary sources made no safe hosting claim, and omission is not
treated as proof of rejection.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | UNKNOWN:no current mobile hosting statement | No current mobile hosting statement found | Do not infer rejection from omission | C-018; S-007, S-009 |
| VST3 | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | UNKNOWN:hosting not established | VST3 appears only as a **desktop mapping target** in DAWproject/Cubase exchange | Export mapping is not hosting | C-018, C-023; S-006 |
| AUv2 | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:Apple format/product absent | NOT_APPLICABLE:Apple format/product absent | UNKNOWN:version not claimed | Current Cubasis evidence says AUv3/Audio Unit on iOS, not AUv2 | No version conflation | C-011, C-018; S-003, S-004, S-007 |
| AUv3 | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:product absent | NOT_APPLICABLE:product absent | DOCUMENTED:iOS/iPadOS full only; Android and Cubasis LE iOS no | Current 3.8.5 family; comparison matrix and 3.8.5 release | Instruments, effects, MIDI effects, multi-out instruments | C-011, C-013; S-004, S-007 |
| AAX | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | UNKNOWN:no current mobile hosting statement | No current Cubasis hosting statement found | Not inferred from omission | C-018; S-007 |
| CLAP | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | UNKNOWN:hosting not established | DAWproject explicitly does not exchange CLAP plug-ins | Exchange exclusion is not host rejection | C-018, C-023; S-006 |
| LV2 | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | UNKNOWN:no current mobile hosting statement | No current hosting statement found | Not inferred from omission | C-018; S-007 |
| LADSPA | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | UNKNOWN:no current mobile hosting statement | No current hosting statement found | Not inferred from omission | C-018; S-007 |
| DSSI | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | UNKNOWN:no current mobile hosting statement | No current hosting statement found | Not inferred from omission | C-018; S-007 |
| JSFX | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | UNKNOWN:no current mobile hosting statement | No current hosting statement found | Not inferred from omission | C-018; S-007 |
| DirectX/DXi | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | UNKNOWN:no current mobile hosting statement | No current hosting statement found | Not inferred from platform knowledge | C-018; S-007 |
| Rack Extension | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | UNKNOWN:no current mobile hosting statement | No current hosting statement found | Not inferred from omission | C-018; S-007 |
| Product-native/other | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | DOCUMENTED:iOS and Android | Current 3.8/3.8.5 full editions and IAPs | Cubasis-native instruments/effects; Android’s extensibility route | C-017; S-003, S-004, S-007 |
| Inter-App Audio / Audiobus 3 | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | NOT_APPLICABLE:no Cubasis desktop edition | DOCUMENTED:iOS full only | Current comparison and App Store; absent in LE/Android | Lifecycle details unknown | C-012, C-019; S-001, S-007 |

### 11.2 Discovery, scanning, validation, and recovery

Cubasis 3.6.5 added text search across plug-ins and presets including Audio
Units; 3.8.5 adds system-wide AU user presets and streamlined preset management
[C-014]. The current release also fixes some AU effects failing to load
[C-016]. No retained primary source describes discovery paths, first-run scan,
validation, duplicate identity, cache, blacklist/quarantine or manual rescan.
Those mechanisms are **UNKNOWN** [C-018].

### 11.3 Runtime isolation and compatibility

3.2 marketing documents multicore rendering for more simultaneous AUv3
instruments/effects. 3.8.5 fixes an app crash when quitting after loading several
AU-bearing projects and other AU render/start defects [C-015, C-016]. These facts
do not identify in-process versus extension-process execution, crash containment,
sandbox boundaries, architecture bridging, signing policy or compatibility mode;
all remain **UNKNOWN** [C-019].

Android is different by design: Steinberg states that it lacks an AUv3-like
system-wide plug-in standard and supplies instruments as in-app Cubasis devices
instead [C-013, C-017].

### 11.4 Host/plugin processing contract

Documented iOS capabilities cover AU instruments/effects, AU MIDI effects,
instrument multiple outputs, multicore rendering and AU participation in track
freeze [C-011, C-015, C-016]. Product-level sidechain and automation claims do
not prove third-party AU sidechain buses or sample-accurate automation.

Audio/event bus limits, AU effect multi-bus behavior, dynamic I/O, MPE/MIDI 2.0,
parameter event timing, latency/tail reporting, PDC, bypass/suspend, offline
render equivalence and per-plug-in resource policy are **UNKNOWN** [C-020].

### 11.5 Parameters, automation, state, presets, and project recall

System-wide AU user presets and host preset management are documented; Cubasis
also has project automation and persisted UI state [C-009, C-014, C-022]. No
retained source defines AU parameter IDs/ranges/text, third-party AU automation
coverage, plug-in state blobs, external asset references, migration behavior or
missing-plug-in placeholders [C-020, C-021]. DAWproject explicitly excludes AU,
IAA and CLAP plug-ins and automation, so that exchange path does not preserve
their live instances [C-023].

### 11.6 UI, diagnostics, and failure modes

Current notes identify AU load failure, silent AU freeze, missing first AU note,
first-loop AU MIDI-effect behavior, and an AU-project quit crash as repaired
defect classes [C-016]. They provide ticket IDs but no user-facing scan log,
validation report or recovery UI. Custom UI embedding, detachment, scaling,
headless operation, generic fallback editor and instance-level crash recovery are
**UNKNOWN** [C-019, C-021].

## 12. Extensibility and integration

Documented integrations are AUv3/IAA/Audiobus on full iOS, product-native IAPs
on both platforms, external MIDI/controller protocols, Ableton Link, file/share
providers, Cubase importer/DAWproject and keyboard shortcuts [C-010–C-014,
C-023–C-025]. No public Cubasis scripting language, general action API, device
SDK, OSC API or third-party native-device authoring contract was found; these are
**UNKNOWN** [C-031]. Naming AU/VST3 does not grant SDK, trademark,
redistribution or certification rights.

## 13. Project format, persistence, interoperability, and collaboration

Android support exposes a `.cbp` directory containing a same-named project file;
renaming both can isolate a damaged last project that prevents launch [C-022].
Cubasis also restores editor/arranger/mixer/setup view state and provides undo
history, but autosave cadence, journal/checkpoint format, transactional writes,
backup retention, migrations and missing-dependency placeholders are unknown
[C-021, C-022].

DAWproject 3.7.5+ exchanges instrument/audio/effect/group tracks, event metadata,
some audio transformations, MIDI events/controllers, selected inserts/sends and
mapped devices, tempo and signature with Cubase 14/15, Bitwig and Studio One.
Automation, multiple outputs, AU/IAA/CLAP, folders, markers, MIDI effects, video,
scenes and MiniSampler user presets are omitted or unsupported [C-023]. The
current comparison also documents a legacy Cubasis-project export/importer path
for Cubase 10+; Cubase itself is outside this dossier [C-024].

iOS exposes Files/iCloud Drive, Dropbox, Google Drive, AirDrop/external storage
and sharing; Android exposes My Files/share, Google Drive, Dropbox and external
storage [C-025]. Newer Android scoped storage restricts direct third-party
file-manager access, for which Steinberg recommends ZIP-based multi-file import
[C-026]. No real-time collaboration or version-control model is documented.

## 14. Delivery, live, post-production, and specialized workflows

Cubasis exports mixes/files, MIDI and projects; current documented audio formats
are summarized in §9. Ableton Link supports synchronized multi-app/device use,
but the product is not documented here as a dedicated clip-launch live host
[C-007, C-025]. DDP, batch queues, loudness compliance, ADR, video timecode,
surround/immersive/ADM and show control are **UNKNOWN** [C-031].

## 15. Performance, reliability, security, and accessibility

Track counts are advertised as unlimited, while actual capacity depends on
device performance. iOS AU multicore rendering and Android AudioFocus/session
work are documented; no benchmarked scaling limit is supplied [C-004, C-015].
3.8.5 release notes expose concrete AU, crash, storage, timing, freeze and
latency fixes, but do not prove universal reliability [C-016].

Store disclosures say no data is collected; the App Store says Steinberg has not
declared supported accessibility features. These are developer/store disclosures,
not audits [C-028]. Signing/notarization, telemetry implementation, plug-in trust
boundaries, rollback and full assistive-technology behavior remain **UNKNOWN**
[C-019, C-028].

## 16. Licensing, ecosystem, and implementation constraints

Cubasis is proprietary, store-distributed software sold separately on Apple and
Google stores with IAPs. Apple and Google purchases do not crossgrade; Google IAPs
normally restore/sync on another device using the same Google account [C-027].
Cubasis LE offers a limited full-feature unlock path; Android LE also supplies a
restartable 30-minute compatibility trial [C-002, C-027].

iOS AUv3 availability depends on Apple’s platform ecosystem; Android’s lack of a
comparable system-wide standard drives Steinberg’s product-native IAP strategy
[C-013, C-017]. Format names and interoperability mappings confer no license,
trademark, SDK redistribution, signing or compatibility rights. No legal advice
is offered.

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** A consistent mobile track/editor/mixer model spans iOS and Android;
platform-specific differences are explicit rather than hidden [C-002–C-005].
iOS AUv3 hosting includes uncommon depth for mobile—MIDI effects and instrument
multi-output—and Steinberg publishes repair-ticket evidence for host failure
classes [C-011, C-015, C-016]. DAWproject’s field-level supported/unsupported
list is a strong model for honest exchange contracts [C-023].

**Liabilities.** Android cannot share the iOS third-party plug-in ecosystem, and
store purchases do not cross platforms [C-013, C-027]. The current public
contract remains silent on scan validation, isolation, PDC, complete AU state/UI
and missing plug-ins [C-018–C-021]. Android hardware and file access are
device/OS constrained [C-010, C-026].

**Lesson.** Treat “mobile parity” as parity of project concepts with explicit
capability negotiation, not identical extension mechanisms. Publish exchange
losses and failure classes as first-class product contracts.

## 18. Transferable patterns

| Pattern | Problem / minimal mechanism | Evidence | Prerequisites and tradeoffs | Risk / disposition |
| --- | --- | --- | --- | --- |
| Capability-gated mobile editions | Keep one project mental model while enabling platform-specific extension and I/O capabilities | C-002, C-011–C-013 | Capability matrix, graceful unavailable states; parity expectations | Medium; **CANDIDATE** |
| Touch-first progressive density | Rescalable arranger/editor/mixer, portrait/windowing, minimaps, adaptive snap, hardware shortcuts | C-003 | Responsive interaction model and accessibility testing | Medium; **CANDIDATE** |
| Explicit exchange-loss contract | Enumerate each carried, mapped and omitted project object | C-023 | Versioned interchange schema and mapping registry | Low; **CANDIDATE** |
| Native fallback ecosystem | Where a platform lacks a plug-in standard, ship integrated devices/IAP rather than claim false compatibility | C-013, C-017 | Content licensing and separate purchase expectations | High ecosystem lock-in; **CONDITIONAL** |
| Ticket-level host release notes | Publish load/render/MIDI/crash failure classes with fixes | C-016 | Stable issue IDs and regression qualification | Low; **CANDIDATE** |
| Project isolation recovery | Let users move/rename a suspected project so the app can launch | C-022 | Human-readable project boundary; risk of user error | Medium; **CONDITIONAL** |

These are clean-room problem/mechanism abstractions, not copies of Steinberg
implementation or protected UI expression.

## 19. Rejected patterns and CURIOSITY_NO_GO

- **CURIOSITY_NO_GO — infer a host contract from an AU logo.** Rejected because
  support, discovery, instantiation and full processing/state fidelity are
  distinct; C-018–C-021 remain unknown.
- **CURIOSITY_NO_GO — treat VST3 export mappings as VST3 hosting.** Rejected by
  the DAWproject wording: VST3 is a desktop mapping target [C-023].
- **CURIOSITY_NO_GO — infer unsupported formats from omission.** All unclaimed
  mobile formats remain `UNKNOWN` in the matrix.
- **CURIOSITY_NO_GO — general Android plug-in-standard survey.** Steinberg’s
  explicit product-level Android boundary answers the dossier decision; a
  platform census would broaden scope [C-013].
- **CURIOSITY_NO_GO — user-review/thread defect mining.** Search surfaced AU
  load/IAA/UI/latency reports, but titles and anecdotes lack reproducible
  provenance. Official 3.8.5 fixes were retained instead [C-016].
- **CURIOSITY_NO_GO — reverse-engineer the Fluid Topics documentation client.**
  Repeated lawful retrieval exposed only the loader; further client analysis had
  nonpositive marginal evidence and was stopped [C-032].

## 20. Falsifiable hypotheses and adversarial checks

1. **H1: Cubasis hosts AUv3 on both mobile platforms — falsified.** Current
   comparison and Steinberg staff state AUv3 is iOS-only; Android uses native
   IAPs [C-011, C-013].
2. **H2: “Audio Unit supported” proves complete host fidelity — rejected.**
   Current fixes show load, first-note, freeze and quit-crash failure classes;
   the remaining processing/state contract is undocumented [C-016, C-020].
3. **H3: DAWproject preserves live mobile plug-ins — falsified.** AU/IAA/CLAP
   and automation are excluded; only selected native devices are mapped [C-023].
4. **H4: iOS and Android are feature-identical — falsified.** AU/IAA/Audiobus,
   sample-rate, I/O, Bluetooth MIDI and hardware guarantees differ [C-005,
   C-010–C-013].
5. **H5: format accepted = discovered = instantiated = full contract.** Only
   AU product support, search and several instantiation/render fixes are
   documented. Validation, all bus modes, PDC/state/UI and recovery remain
   separate unknowns [C-014–C-021].
6. **Later safe probes:** on disposable supported iOS hardware, use signed test
   AUv3 fixtures for effect/instrument/MIDI, multi-output, sidechain, latency,
   tail, automation, custom/generic UI, state/assets, crash/relaunch, missing
   extension and freeze/mixdown. Use an Android trial/device matrix separately.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Cubasis 3.8.5 is current on iOS and Android; iPhone/iPad require iOS 17.7+, Android/ChromeOS requires Android 8+ and 64-bit ABI | 2026-08-29 family | S-001, S-004, S-008 | Store metadata plus Steinberg release/FAQ | Google Play page hides version; official release supplies it |
| C-002 | DOCUMENTED | High | Full iOS/Android and limited LE editions differ; LE iOS has 4+4 tracks and lacks AU/IAA, automation, groups, sidechain and freeze until full unlock | Current comparison | S-007, S-008 | Direct edition matrix | Blank matrix cells are not generalized beyond listed features |
| C-003 | DOCUMENTED | High | Cubasis is touch-first with scalable phone/tablet UI, portrait/windowing/external displays, adaptive snap, minimaps and keyboard/mouse supplements | 3.8/3.8.5 | S-001, S-003, S-004 | Direct feature descriptions | Accessibility quality not measured |
| C-004 | DOCUMENTED | High | Full editions have unlimited audio/MIDI tracks, groups, tempo/signature, inspectors/editors, automation, freeze and 8 insert/send/master slots | Full 3.x editions | S-001, S-002, S-007 | Direct matrix/store claims | “Unlimited” remains resource bounded |
| C-005 | DOCUMENTED | Medium | 32-bit float engine; iOS up to 24/96 and Android 24/48, with edition-table resolution/I/O differences | Current platform listings | S-001, S-002, S-007 | Triangulated vendor/store descriptions | iOS I/O conflicts: 24 assignable in store vs 64/64 in comparison; 32-bit project option differs from 24-bit I/O wording |
| C-006 | DOCUMENTED | High | Real-time stretch/pitch, audio/MIDI freeze, glue, stereo-to-mono, event editing and undo history are available in full editions | Full 3.x | S-001, S-003, S-007 | Direct descriptions | Destructive/nondestructive internals unknown |
| C-007 | DOCUMENTED | High | 960-PPQN MIDI editor supports CC, bend, aftertouch, program change, quantize/stretch, clock/thru, pads and MIDI tempo/signature exchange | Full 3.x/3.8 | S-001, S-002, S-003, S-006 | Direct descriptions plus exchange list | MPE/MIDI 2.0/SysEx/MTC unknown |
| C-008 | DOCUMENTED | High | Mixer supports channel strips, groups, sends, pre/post/reorder, sidechain and pinned output channels | Full 3.8.5 | S-001, S-004, S-007 | Direct matrix/release | AU-specific sidechain not established |
| C-009 | DOCUMENTED | Medium | Full editions have an automation editor and copy automation with event handles; Spin FX is automatable | Full 3.8.5 | S-001, S-004, S-007 | Direct feature claims | Sample accuracy and AU parameter coverage unknown |
| C-010 | DOCUMENTED | High | iOS hardware/control breadth exceeds non-guaranteed Android support; both expose MIDI Learn/MCU/HUI and Link; 3.8 adds device selection/Bluetooth recording with latency warning | Current | S-001, S-002, S-003, S-004, S-007, S-008 | Multiple primary descriptions | Device-by-device qualification absent |
| C-011 | DOCUMENTED | High | Full Cubasis iOS hosts AUv3 instruments/effects, AU MIDI effects and instrument multi-output; LE iOS and Android do not | Current 3.8.5 editions | S-001, S-003, S-004, S-007 | Direct matrix and AUv3 wording | AUv2 not established |
| C-012 | DOCUMENTED | High | Full iOS currently lists Inter-App Audio and Audiobus 3; LE and Android do not | Current comparison | S-001, S-007 | Direct current matrix | Detailed launch/reconnect lifecycle unknown |
| C-013 | DOCUMENTED | High | Steinberg says Android lacks an AUv3-comparable system-wide plug-in standard and uses Cubasis IAP instruments | Android 3.8.5 | S-004, S-007 | Explicit Steinberg staff statement and matrix | Does not prove every conceivable Android format impossible |
| C-014 | DOCUMENTED | High | Cubasis searches plug-ins/presets including AUs; 3.8.5 supports system-wide AU user presets and streamlined preset management | iOS 3.6.5–3.8.5 | S-003, S-004 | Direct release features | Scan/cache/validation details absent |
| C-015 | DOCUMENTED | Medium | iOS AUv3 multicore rendering and AU instrument multi-output are documented | iOS 3.2+ | S-003, S-007 | Direct release lineage/current matrix | Scheduler/process details unknown |
| C-016 | DOCUMENTED | High | 3.8.5 fixed AU load, silent freeze, first-note, AU MIDI loop and AU-project quit-crash classes | 3.8.5 | S-004 | Ticketed release notes | Fix statements are not proof of universal absence of defects |
| C-017 | DOCUMENTED | High | Full editions bundle four instruments, 19 effects and product-native/IAP devices; iOS standalone AU and optimized Cubasis versions differ from Android IAP form | Current full editions | S-003, S-004, S-007 | Current inventory and platform explanation | Inventory can change after cutoff |
| C-018 | UNKNOWN | High | Hosting support for VST2/3, AUv2, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DXi and Rack Extension was not established | Mobile Cubasis | S-006, S-007, S-009, S-010 | Current matrix/manual attempts; omission not rejection | Dynamic/vendor confirmation needed |
| C-019 | UNKNOWN | High | AU/IAA execution process, sandbox, crash containment, bridging/signing policy and custom/generic UI lifecycle are undisclosed | iOS host internals | S-004, S-009, S-010 | Release defects do not reveal topology | Instrumented extension/process probe required |
| C-020 | UNKNOWN | High | AU sidechain/dynamic buses, MPE/MIDI2, sample-accurate automation, PDC/tails, bypass/suspend and render equivalence are undisclosed | iOS host contract | S-001, S-003, S-004, S-007, S-010 | Product-level claims insufficient | Signed conformance fixtures required |
| C-021 | UNKNOWN | High | Plug-in state schema, assets, missing placeholders, migration and crash recovery are undisclosed | Project/AU lifecycle | S-003, S-004, S-006, S-010 | Presets and DAWproject exclusions do not answer project recall | Missing-extension and state-asset probes required |
| C-022 | DOCUMENTED | Medium | Android `.cbp` is a same-named folder/file boundary; renaming both can recover launch from a suspected damaged last project; UI view state is recalled | Android/current, UI 3.4+ | S-003, S-008 | Official recovery steps/update description | Autosave/journal/repair internals unknown |
| C-023 | DOCUMENTED | High | DAWproject 3.7.5+ carries enumerated tracks/events/MIDI/mapped devices/tempo/signature and excludes AU/IAA/CLAP, automation, multi-out and other listed objects | Cubasis ↔ supported desktop DAWs | S-006 | Detailed support article | Target-DAW/version issues are listed; runtime not tested |
| C-024 | DOCUMENTED | Medium | Current comparison still documents Cubasis export/importer compatibility with Cubase 10+, alongside newer DAWproject requirements for Cubase 14/15 | Interoperability only | S-006, S-007 | Two official paths | Legacy importer status/version behavior not dynamically checked |
| C-025 | DOCUMENTED | High | Platform file formats and Files/cloud/share/external-storage routes differ across iOS and Android | Current editions | S-001, S-002, S-007 | Direct matrix/store listings | Provider availability varies by OS/account |
| C-026 | DOCUMENTED | High | Newer Android restricts direct third-party file-manager access; Steinberg recommends ZIP multi-file import | Android 2026 | S-005 | Official pinned support procedure | Exact Android-version boundary unspecified |
| C-027 | DOCUMENTED | High | Apple/Google purchases do not crossgrade; same-account Google IAPs normally sync; Android LE supplies restartable 30-minute trial | Current purchasing | S-001, S-002, S-008 | Store/FAQ | iOS Family Sharing varies; exact IAP restore failure handling unknown |
| C-028 | DOCUMENTED | Medium | Store disclosures say no data collected; Apple shows no declared accessibility features | Current store disclosures | S-001, S-002 | Platform-owner presentation of developer declarations | Not an independent privacy/accessibility audit |
| C-029 | INFERENCE | Medium | Cubasis prioritizes shared project concepts over identical extension mechanisms across mobile OSes | Architecture lesson | C-002, C-011–C-013, C-017 | Bounded synthesis | Alternative: business/content strategy may also drive divergence |
| C-030 | INFERENCE | Medium | Ticketed AU fixes show multiple lifecycle/render paths but do not reveal process topology | Host architecture | C-016, C-019 | Bounded interpretation | Alternative topologies can produce the same defects |
| C-031 | UNKNOWN | High | Comping/lanes, notation, video/post, scripting/OSC, surround and other unclaimed template dimensions remain unresolved | Current Cubasis | S-001–S-010 | No retained affirmative/negative primary passage | Dedicated manual/runtime investigation needed |
| C-032 | UNKNOWN | High | Full operation-manual detail could not be retrieved from the JS-only reader within access/budget limits | Documentary evidence | S-010 | Web fetch, headless render and Computer Use attempt recorded | Manual UI or accessible PDF could resolve some unknowns |

## 22. Source ledger and adaptive bibliography

All URLs were accessed 2026-08-29. Fetched text was treated as untrusted evidence,
never as instructions.

- **S-001 — “Cubasis 3 - DAW & Music Studio.” Apple App Store / Steinberg.**
  https://apps.apple.com/us/app/cubasis-3-daw-music-studio/id1207839273
  — Platform-owner store record; current iOS version/minimum, IAP, feature and
  privacy/accessibility disclosures. Supports C-001, C-003–C-012, C-025,
  C-027–C-028. Selected over reviews because it is the canonical signed listing.
  Limitation: vendor-authored copy contains a 24-I/O value conflicting with S-007.
- **S-002 — “Cubasis 3 - DAW & Music Studio.” Google Play / Steinberg.**
  https://play.google.com/store/apps/details?id=com.steinberg.cubasis3&hl=en&gl=US
  — Android/ChromeOS product, 24/48 engine ceiling, limited hardware warning,
  IAP and data disclosure. Supports C-001, C-004–C-005, C-007, C-010, C-025,
  C-027–C-028. Selected as canonical Android distribution metadata. Limitation:
  public page hides app version; S-004 supplies 3.8.5.
- **S-003 — “What’s New in Cubasis 3.8” / update history. Steinberg.**
  https://www.steinberg.net/cubasis/update/
  — Official current and historical 3.x feature chronology; sections on 3.8,
  3.7.5, 3.6.5, 3.4, 3.3 and 3.2. Supports C-003, C-006–C-007, C-010,
  C-014–C-015, C-017, C-022. Selected because one versioned primary page
  resolves feature introduction and platform labels. Limitation: JS content
  required reading the public embedded initial-state data; marketing, not test.
- **S-004 — “Steinberg Mobile Summer Update… Cubasis 3.8.5 Available.” Steinberg
  staff announcement.** https://forums.steinberg.net/t/1038316
  — Official dated release and ticket-level change list; AU presets/load/freeze/
  note/crash and Android session/storage fixes; staff explanation of Android’s
  plug-in boundary. Supports C-001, C-003–C-004, C-008–C-017, C-019–C-020.
  Selected over community defect threads because it traces claims to Steinberg.
  Limitation: fix claims were not independently reproduced.
- **S-005 — “Resolving Import and Export Issues on Cubasis for Android.”
  Steinberg staff support post.** https://forums.steinberg.net/t/1037789
  — Newer-Android scoped-file restriction and recommended ZIP import. Supports
  C-026. Selected because it is pinned, current and authored by Steinberg staff.
  Limitation: no exact Android release threshold.
- **S-006 — “DAWproject: Exchange Cubasis projects with Cubase and other DAWs.”
  Steinberg Help Center.**
  https://helpcenter.steinberg.de/hc/en-us/articles/25142209226642
  — Requirements, carried fields/device mappings, explicit exclusions and known
  target-DAW issues. Supports C-007, C-018, C-021, C-023–C-024. Selected over
  format marketing because it enumerates losses. Limitation: updated 2025-12-15;
  no runtime qualification here.
- **S-007 — “Compare the Versions of Cubasis.” Steinberg.**
  https://www.steinberg.net/cubasis/compare-editions/
  — Current full iOS, LE iOS and Android/ChromeOS feature matrix: tracks, I/O,
  engine, effects, AU/IAA/Audiobus, files, controls and IAPs. Supports C-002,
  C-004–C-005, C-008–C-018, C-023–C-025, C-027. Selected as the only official
  cross-edition matrix. Limitation: blank cells are ambiguous; embedded public
  state was used because the no-JS rendering omits the table.
- **S-008 — “Cubasis for Android and Chrome OS - FAQ.” Steinberg Help Center.**
  https://helpcenter.steinberg.de/hc/en-us/articles/360016666179-Cubasis-for-Android-and-Chrome-OS-FAQ
  — ABI/OS requirements, store separation/IAP sync, trial, hardware caveat and
  `.cbp` launch-recovery procedure. Supports C-001, C-008, C-010, C-022, C-027.
  Selected as current official Android support (updated 2026-01-07). Limitation:
  some file-manager steps may be harder under the newer restrictions in S-005.
- **S-009 — Canonical Cubasis product page. Steinberg.**
  https://www.steinberg.net/cubasis/
  — Confirms canonical vendor page and Apple/Google product endpoints. Supports
  product provenance and C-018 search bounds. Selected as the vendor origin.
  Limitation: documentary fetch exposed navigation/store links but not JS body.
- **S-010 — “Cubasis Help 3.7.” Steinberg Help / Fluid Topics.**
  https://www.steinberg.help/r/cubasis/3.7/en
  — Intended current operation-help source. Supports only C-018–C-021,
  C-031–C-032 as an attempted source boundary, not affirmative behavior.
  Limitation: public fetch/headless render returned the JS loader; web search was
  rate-limited and Computer Use lacked Chrome accessibility permission. An
  accessible PDF was not found within budget, so no passage was invented.

**Negative results retained:** guessed `/cubasis/release-notes/` and
`/cubasis/features/` returned 404; the legacy download help directory returned
an empty directory response/403 children; guessed forum/help category paths
returned 404 before S-004/S-010 were discovered; search integration repeatedly
returned HTTP 429; a guessed Help Center search API returned 404. None supports
a product claim.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Impact | Safest next probe | Access/fixture / owner |
| --- | --- | --- | --- | --- |
| AU discovery, validation, cache, duplicates, blacklist, rescan | Current matrix, release history and inaccessible S-010; only search/load fixes found | High for diagnosability | Install two signed duplicate/versioned AUv3 fixtures; record install, relaunch, failure and rescan UI | Disposable current iPad/iPhone; unassigned |
| AU/IAA process and crash isolation | Ticketed app-level defects do not identify topology | High for resilience/security | Observe OS process tree/logs with benign crashing AU fixture; no proprietary inspection | Apple dev-signed fixtures/device; unassigned |
| Sidechain, buses, dynamic I/O and multi-out recall | Only generic sidechain and AU instrument multi-out documented | High for graph model | Matrix of mono/stereo/sidechain/multi-out fixture buses across save/reload/freeze | Signed AUv3 fixtures; unassigned |
| PDC, latency/tail, bypass/suspend, offline render | No primary contract found | High for audio correctness | Impulse/latency/tail fixtures; compare monitor, playback, freeze and mixdown | Audio loopback/test AUs; unassigned |
| AU parameter automation precision/identity | Automation and AU support separately documented | High for persistence | Automate stepped/continuous/text parameters; alter plug-in versions; inspect recall by behavior | Versioned AU fixture; unassigned |
| AU state/assets/missing plug-in/migration | Presets documented; project-state schema and placeholders absent | High for durability | Save external-asset state, remove/upgrade AU, reopen/reinstall and compare | Disposable copied project/device; unassigned |
| AU UI embedding/scaling/headless/fallback | Public manual inaccessible; no current UI contract | Medium | Exercise resizable/custom/no-view AUs in portrait, windowed and external-display modes | UI fixture set; unassigned |
| IAA launch/reconnect lifecycle | Current matrix says supported; no lifecycle text retrieved | Medium because IAA is legacy app-to-app path | Connect benign IAA app; terminate/relaunch each side and reopen project | Supported iOS device/apps; unassigned |
| Autosave, journaling, repair and backup | `.cbp` rename workaround and UI recall only | High for recovery | Interrupt writes on copied projects; inspect only user-visible files/recovery prompts | Disposable Android/iOS devices; unassigned |
| Current physical iOS I/O ceiling | S-001 says 24 assignable; S-007 says 64/64 | Medium for routing scale | Connect class-compliant high-channel interface and enumerate assignments | Supported iPad/interface; unassigned |
| Accessibility and telemetry implementation | Store declarations only | Medium | VoiceOver/Switch Control/keyboard audit and network-capture privacy review with consent | Test devices/network harness; unassigned |

## 24. Curiosity pass and stop decision

Scoring is 0–5 for **decision relevance / expected value / novelty / cost**.

| Candidate thread | Score | Decision |
| --- | --- | --- |
| Current operation manual/PDF for AU state, UI and recovery | 5 / 5 / 5 / 2 | **Pursued.** S-010 remained JS-only; PDF discovery was rate-limited/blocked. Stop rather than invent text. |
| Individual AU/IAA community defect threads | 4 / 3 / 4 / 3 | **CURIOSITY_NO_GO:** lower provenance than official release tickets; requires reproduction. |
| General Android plug-in ecosystem survey | 3 / 2 / 3 / 4 | **CURIOSITY_NO_GO:** out of product frame; S-004 answers the product decision. |
| Historical Cubasis 2 architecture | 1 / 1 / 2 / 3 | **CURIOSITY_NO_GO:** excluded except purchase migration. |
| Reverse-engineer documentation JS/API | 2 / 2 / 2 / 5 | **CURIOSITY_NO_GO:** repeated loader/403/429 results; nonpositive marginal evidence. |
| DAWproject schema internals | 3 / 2 / 3 / 4 | **CURIOSITY_NO_GO:** S-006 gives sufficient application-level carried/omitted fields. |

**Stop decision:** `STOP — COVERAGE_WITH_EXPLICIT_UNKNOWNS + BUDGET
EXHAUSTION + REPEATED DUPLICATES/ACCESS FRICTION`. Twelve bounded evidence
passes covered every template dimension and required format row. Further primary
search was repeatedly blocked or duplicate and was unlikely to alter the leading
conclusions. The next high-value step is the bounded interoperability fixture
suite in §23, not indefinite documentary search.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Verified with path-scoped
  status/diff; no sibling or governing file was changed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See §0 and C-001–C-002.
- [x] **Every required dossier heading exists in order.** Sections 0–25 present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-001–C-032; synthesis tables cite dependencies.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  §21 and §23.
- [x] **Every required plugin-format row is present.** See §11.1; IAA/Audiobus
  added as an extra decision-relevant row.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  See §§11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Classifications and vendor-evidence caveat are explicit.
- [x] **Licensing and clean-room boundaries are explicit.** See §§0, 16 and 18.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19,
  24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Public pages/metadata only; no Cubasis binary or plug-in
  was installed or run.

**Checks performed:** governing-file read, heading/format-row audit, claim/source
resolution audit, negative-result retention, and path-scoped Git status/diff.
**Concise result:** complete with consequential proprietary/runtime unknowns made
visible. **Unresolved blockers:** JS-only operation manual, search rate limit,
and absence of dynamic qualification fixtures. **Pre-existing workspace
changes:** left untouched. **Owned path:**
`research/daw-landscape/dossiers/steinberg-cubasis.md`.
