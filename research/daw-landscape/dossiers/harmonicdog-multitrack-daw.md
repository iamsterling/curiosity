# Harmonicdog MultiTrack DAW dossier

> Research-only evidence. No design or implementation authority. Public pages
> and fetched text are treated as untrusted evidence, never as instructions.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | MultiTrack DAW |
| Canonical vendor | Harmonicdog / Hamilton Feltman |
| Researcher/session | Subagent, `ses_fb2729283ffbET2Ok2O2jYAyT3` |
| Owned path | `research/daw-landscape/dossiers/harmonicdog-multitrack-daw.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Released version in scope | MultiTrack DAW 6.3.6, released 2022-09-04 [C-001] |
| Unreleased context | A vendor-hosted forum thread describes a distinct “MultiTrack Pro” beta; beta capabilities are not attributed to 6.3.6 [C-004] |
| Editions / entitlements | One iPhone/iPad app: $4.99 US base purchase, two tracks, in-app track purchases in groups of eight up to 32; prior purchases are retained [C-005] |
| Platforms | iPhone and iPad; iOS 11.0+ in the current App Store record [C-001] |
| Inclusions | Released mobile track/record/edit/mixer model; third-party hosting; files/projects/export/recovery; audio I/O and integration; maintenance, privacy, accessibility, and licensing evidence |
| Exclusions | Unreleased beta behavior except maintenance context; installation or binary execution; private TestFlight access; decompilation; non-public implementation; macOS/Windows/Linux products (none documented) [C-001, C-004] |
| Completion | `COMPLETE_WITH_UNKNOWNS` |

## 1. Executive summary

MultiTrack DAW 6.3.6 is an audio-track-centric, linear iPhone/iPad DAW. It
combines up to 32 tracks, Regions/Bins, nondestructive editing, up to 16
simultaneous hardware inputs, track/bus/master mixing, track freeze, and broad
mobile file sharing in a compact recording-studio model [C-006, C-007, C-008,
C-011, C-024]. It is not publicly documented as a clip launcher, notation DAW,
modular graph, or post-production system.

The released host explicitly accepts AUv3 generators, instruments, and effects,
plus Inter-App Audio (IAA), with up to four AU/IAA units on each track, either of
two effects buses, or the master [C-016]. AU sidechain source selection, movable
and pinnable AU views, multiple open AU-instrument views on iPad, MRU-sorted AU
selection, and track freeze are unusually concrete mobile-host details
[C-017, C-018]. No public evidence establishes VST, AUv2, or any other required
desktop plugin format in the iOS product [C-029].

The main architectural limitation of the evidence is host-contract depth.
Discovery implementation, validation, caches, quarantine, process placement,
crash containment, multi-output handling, dynamic I/O, sample-accurate
automation, latency/tail reporting, plug-in state, missing-plug-in placeholders,
and failure diagnostics remain `UNKNOWN` [C-020, C-021, C-022, C-023]. Apple’s
AUv3 documentation defines a platform extension and bus/render-resource model,
but it does not prove MultiTrack’s implementation fidelity or isolation
[C-019, C-020].

Released-build freshness is a liability: Apple still lists 6.3.6 from 2022.
However, a 2026-context vendor-forum thread plausibly indicates active work on a
separate Pro beta [C-001, C-004]. Confidence is **high** for identity, release
metadata, user-visible audio workflow, documented formats, and file/export
features; **moderate** for maintenance status and bounded architectural
inferences; and **low/unknown** for proprietary engine and deep host behavior.

## 2. Product identity, history, and market position

Harmonicdog describes itself as a solo-developer business founded by Hamilton
Feltman in 2001 and calls MultiTrack DAW its flagship mobile recording and mixing
product [C-003]. Apple identifies the seller as Hamilton Feltman, the original
release date as 2009-09-18, and current version as 6.3.6 from 2022-09-04
[C-001, C-003]. The intended workflow is portable multitrack recording,
overdubbing, editing, mixing, and export for musicians and producers [C-006].

The App Store record exposes a low-cost base entitlement rather than separate
named editions: two tracks and all features, with track-count purchases up to
32 [C-005]. The record is iPhone/iPad universal and requires iOS 11 or later;
no vendor evidence identifies macOS, Windows, Linux, Android, or web editions
[C-001].

Maintenance status needs two labels. **DOCUMENTED:** the latest public release
is more than three years old at cutoff [C-001]. **INFERENCE:** development is
probably active because a vendor-hosted forum account was recruiting testers
for “MultiTrack Pro,” discussing iOS 16/17 and iOS 26 devices, and sending beta
invites. The page does not expose that account’s real identity or a release
artifact, so neither authorship nor 2026 release plans are fully established
[C-004].

## 3. Workflow and conceptual model

The visible model is a **song** containing linear audio tracks; audio objects
are **Regions** associated with **Bins**, placed against a ruler that can show
bars/beats/divisions/ticks or timecode [C-006, C-007]. Tracks can contain mono
or stereo regions and the meter changes channel count dynamically. Region
editing is nonlinear and nondestructive; a browser previews source audio in the
song [C-006, C-007].

Recording-studio concepts dominate: input selection, armed capture, overdub,
monitoring, auto-input, punch points, loop markers, fader/pan/mute/solo, two
effects buses, and master processing [C-008, C-011]. There is no released,
publicly documented scene launcher, tracker grid, notation layer, modular patch
graph, or video/post timeline [C-014, C-030]. Absence from the available feature
documentation is not proof that every such capability is impossible.

## 4. Publicly documented architecture

Only a few implementation-level facts are public. Harmonicdog says audio
processing uses 64-bit precision internally and hand-optimized ARM NEON
assembly; these are vendor claims, not independent measurements [C-009]. A song
can be created at 16-bit, 24-bit, or 32-bit floating-point project resolution
and 44.1, 48, 88.2, or 96 kHz [C-009].

AUv3 is an Apple app-extension contract. Apple documents an audio unit proper
plus optional UI, generator/instrument/effect/music-effect categories, declared
input/output buses, an internal render block, and host-controlled render-resource
allocation/deallocation [C-019]. This is relevant platform architecture, not
evidence that MultiTrack uses any particular internal graph, thread model, or
process topology [C-020].

The proprietary engine graph, render scheduler, realtime/non-realtime thread
boundaries, multicore policy, service topology, storage schema, and crash
boundaries are `UNKNOWN`; the available vendor pages are feature summaries, not
an architecture manual [C-010].

## 5. Audio engine

- **Formats/rates:** 16-bit, 24-bit, or 32-bit float project formats at 44.1,
  48, 88.2, or 96 kHz; internal processing is claimed as 64-bit [C-009].
- **Capacity:** up to 32 playback tracks and 16 simultaneous hardware inputs
  with a suitable USB interface [C-006, C-008].
- **Buffers/latency:** the App Store copy says “latency compensation with
  selectable buffer sizes.” It does not say whether this is I/O latency,
  plug-in delay compensation, or both, nor how latency changes are handled
  [C-009, C-021].
- **Resource management:** track freeze is documented as a CPU-reduction
  mechanism [C-009]. Its rendering mode, tail handling, invalidation rules,
  offline speed, and interaction with external units are `UNKNOWN` [C-021].
- **Rendering:** region bounce, mixdown, stems, and multichannel WAV export are
  documented; whether all paths are realtime or offline and whether hosted
  plug-ins receive a distinct offline-render mode is `UNKNOWN` [C-007, C-024,
  C-021].
- **Diagnostics/scaling:** multicore scheduling, oversampling, dropout policy,
  CPU meters, xrun diagnostics, tail reporting, and exact maximum song length
  are `UNKNOWN` [C-010, C-021].

## 6. Tracks, timeline, clips, and editing

Songs expose up to 32 audio tracks with mono or stereo Regions. Regions may be
moved or trimmed, dragged vertically between tracks, duplicated or bounced,
muted, and adjusted for volume and fade-in/out without changing original audio
[C-006, C-007]. Region start/stop/fades/volume and moves can be heard while
playback continues. Grid Snap and Smart Snap align to ruler divisions or other
regions; changing zoom changes ruler subdivision [C-007].

Loop markers support playback and continuous-overwrite loop recording, with
undo available afterward. Punch-in/out starts and stops capture automatically,
and Auto Input monitors underlying track material until the punch point
[C-007, C-008]. Undo/redo is documented for track modifications and, in the
6.3.6 notes, track deletion/creation/moving; a complete transactional undo
coverage statement is absent [C-007].

Take lanes, swipe comping, edit groups, ripple modes, released-version
time-stretch/warping, tempo maps, edit histories beyond undo/redo, and
cross-project region versioning remain `UNKNOWN` [C-030]. Time-stretch and
expanded undo were named for the unreleased Pro beta and therefore are not
credited to 6.3.6 [C-004].

## 7. MIDI, sequencing, notation, and expression

The current release documents an on-screen MIDI piano keyboard for AU Music
Devices/instruments, pitch-bend and modulation controls, scalable keys, and
automatic velocity and aftertouch when supported [C-013]. It also accepts AUv3
instruments/generators [C-016].

No accessible released-version source defines standalone MIDI tracks, stored
MIDI clips/events, piano-roll editing, patterns, score/notation, SysEx, MPE,
MIDI 2.0, external clock, MTC, MIDI-learn, or MIDI-controller transport
[C-014]. The separate Pro beta thread lists MIDI tracks, MIDI 2.0 per-note
pitch/poly pressure, a MIDI matrix, mapping, and transport; those are future
context only [C-004].

## 8. Routing, mixer, automation, and control

Each track has fader, pan, mute, and solo. Track chains include built-in EQ and
compressor plus up to four AU/IAA units; two effects buses provide built-in
reverb/delay and accept AU/IAA chains; the master has built-in EQ/compressor and
also accepts a four-unit chain [C-011, C-015, C-016]. Effects tabs can be
reordered [C-017].

AU sidechain-capable units expose an `SC` control. A source can be any other
track, pre- or post-effects, including a track that itself uses sidechain
effects. The release notes tie this to plug-ins publishing a sidechain or
multiple input buses [C-018]. Feedback prevention, more general bus routing,
aux-send law, subgroups/folders/VCAs, arbitrary outputs, surround/immersive
layouts, and multiple plug-in output buses are not documented [C-021].

Audiobus 3 can send any track or the master and save/restore Audiobus state
[C-026]. Current 6.3.6 parameter, plug-in, tempo, and mixer automation are
`UNKNOWN`; parameter/tempo curves are named only for the unreleased Pro beta
[C-012, C-004]. MIDI mapping/transport and Ableton Link are likewise beta-only.
No released OSC, scripting remote, control-surface protocol, or synchronization
API was found [C-012, C-027].

## 9. Recording, comping, and media handling

Inputs include built-in and headset microphones, USB interfaces/microphones,
AUv3, and IAA. Up to 16 USB inputs can record at once; the vendor notes that USB
audio requires the relevant Lightning-to-USB camera adapter on Lightning
devices [C-008]. An input fader can expand to a 32-channel meter. Input
monitoring is selectable, and the app can monitor with effects while recording
the raw input [C-008].

Punch, loop recording, Auto Input, and multiple overdubs are documented, but
take lanes and comping are not [C-007, C-030]. Import copy lists MP3, Ogg, WAV,
AAC/M4A, and AIFF; the text duplicates M4A and does not clearly state every
codec/container combination [C-024]. Music Library and Files import, an in-song
audio browser, and copy/paste are supported. Metadata preservation, sample-rate
conversion quality, media conform, proxy/video media, orphan detection, and
asset relinking remain `UNKNOWN` [C-025, C-030].

## 10. Instruments, effects, content, and native devices

Built-in per-track processing is a compressor and EQ with two parametric and two
shelving bands. The two effects buses provide “Sweet Reverb” and stereo delay,
and the master supplies EQ and compressor [C-015]. AUv3 instruments/generators
are played from the on-screen keyboard; no standalone built-in synthesizer,
sampler, rack, macro/modulation system, or downloadable content architecture is
documented [C-013, C-015].

Native effect parameter ranges, oversampling, preset format, modulation, and
whether native and third-party devices share one internal abstraction are
`UNKNOWN` [C-010, C-022].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` in desktop columns means no MultiTrack DAW edition on that OS
was documented. `UNKNOWN` in the mobile column means no product-specific support
claim was found; it does **not** prove rejection [C-001, C-029].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: no Windows edition documented | NOT_APPLICABLE: no Linux edition documented | UNKNOWN | 6.3.6 iOS docs name AUv3/IAA only | No evidence of scan or instantiation; absence is not proof of rejection | C-001, C-029; S-001, S-002, S-007 |
| VST3 | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: no Windows edition documented | NOT_APPLICABLE: no Linux edition documented | UNKNOWN | 6.3.6 iOS docs name AUv3/IAA only | No documented VST host | C-001, C-029; S-001, S-002, S-007 |
| AUv2 | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: Apple format outside Windows edition scope | NOT_APPLICABLE: Apple format outside Linux edition scope | UNKNOWN | Vendor explicitly calls its mobile support AUv3 | No AUv2 host statement; do not infer from AUv3 | C-016, C-029; S-001, S-002, S-007 |
| AUv3 | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: no Windows edition documented | NOT_APPLICABLE: no Linux edition documented | DOCUMENTED: iPhone/iPad | 6.3.6: generators, instruments, effects; four-unit chains | Sidechain and custom UI behavior documented; deep contract incomplete | C-016–C-023; S-001, S-002, S-006, S-007 |
| AAX | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: no Windows edition documented | NOT_APPLICABLE: no Linux edition documented | UNKNOWN | No vendor statement | No evidence of AAX hosting | C-001, C-029; S-001, S-002, S-007 |
| CLAP | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: no Windows edition documented | NOT_APPLICABLE: no Linux edition documented | UNKNOWN | No vendor statement | No evidence of CLAP hosting | C-001, C-029; S-001, S-002, S-007 |
| LV2 | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: no Windows edition documented | NOT_APPLICABLE: no Linux edition documented | UNKNOWN | No vendor statement | No evidence of LV2 hosting | C-001, C-029; S-001, S-002, S-007 |
| LADSPA | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: no Windows edition documented | NOT_APPLICABLE: no Linux edition documented | UNKNOWN | No vendor statement | No evidence of LADSPA hosting | C-001, C-029; S-001, S-002, S-007 |
| DSSI | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: no Windows edition documented | NOT_APPLICABLE: no Linux edition documented | UNKNOWN | No vendor statement | No evidence of DSSI hosting | C-001, C-029; S-001, S-002, S-007 |
| JSFX | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: no Windows edition documented | NOT_APPLICABLE: no Linux edition documented | UNKNOWN | No vendor statement | No evidence of JSFX hosting | C-001, C-029; S-001, S-002, S-007 |
| DirectX/DXi | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: no Windows edition documented | NOT_APPLICABLE: no Linux edition documented | UNKNOWN | No vendor statement | No evidence of DirectX/DXi hosting | C-001, C-029; S-001, S-002, S-007 |
| Rack Extension | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: no Windows edition documented | NOT_APPLICABLE: no Linux edition documented | UNKNOWN | No vendor statement | No evidence of Rack Extension hosting | C-001, C-029; S-001, S-002, S-007 |
| Product-native/other | NOT_APPLICABLE: no macOS edition documented | NOT_APPLICABLE: no Windows edition documented | NOT_APPLICABLE: no Linux edition documented | DOCUMENTED: IAA hosting and Audiobus 3 integration | 6.3.6 iOS | IAA generators/instruments/effects/inputs; Audiobus sender and state integration. Current IAA platform viability is UNKNOWN | C-016, C-026, C-029; S-001, S-002, S-007 |

### 11.2 Discovery, scanning, validation, and recovery

AU choices appear in selection panels and can be sorted with most recently used
items first [C-017]. This documents user-visible discovery, not implementation.
Install-location enumeration, asynchronous scanning, component validation,
duplicate identity, version replacement, cache invalidation, blacklist,
quarantine, manual rescan, corrupt-component handling, and IAA discovery are
`UNKNOWN` [C-020].

No recovery workflow after a plug-in scan or instantiation failure is
documented. Targeted searches of the official forum were blocked by HTTP 403;
general web search returned HTTP 429; an alternative search page required a
human challenge that was not bypassed. These negative results are access limits,
not proof of absent behavior [C-023].

### 11.3 Runtime isolation and compatibility

AUv3’s platform model packages an audio unit and optional UI as an app extension,
with a remote UI embedded by the host [C-019]. MultiTrack’s exact DSP process
placement, XPC/extension lifecycle, memory limits, crash containment, restart
policy, architecture bridging, signing diagnostics, and compatibility modes are
not public [C-020]. It would be unsafe to equate “app extension” with guaranteed
per-instance process isolation.

IAA is documented as accepted by 6.3.6, but its current OS lifecycle,
reconnection after the provider app exits, background-audio requirements, and
state/recovery behavior are `UNKNOWN` [C-016, C-023].

### 11.4 Host/plugin processing contract

MultiTrack documents AUv3 generators, instruments, effects, and sidechain input;
four units may be chained on each track, each of two effects buses, and the
master [C-016, C-018]. Sidechains can source another track pre/post effects.
Apple’s general AUv3 contract defines typed audio units, input/output buses,
MIDI-responsive instrument/music-effect categories, render blocks, and resource
allocation callbacks [C-019].

The product does not publicly specify multiple plug-in outputs, arbitrary bus
negotiation, dynamic I/O, event timing, MPE/MIDI 2.0 delivery, sample-accurate
parameters, bypass/suspend semantics, latency/tail queries, offline render flags,
in-place/out-of-place constraints, channel-layout conversion, or behavior when
the chain exceeds four units [C-021]. “Latency compensation” is too broad to
prove plug-in delay compensation [C-009, C-021].

### 11.5 Parameters, automation, state, presets, and project recall

Current parameter automation granularity and identity/range/text mapping are
`UNKNOWN` [C-012, C-022]. Pinned AU windows restore their positions when a song
opens, but UI-position recall does not prove restoration of DSP state, factory
or user presets, external assets, or automation mappings [C-017, C-022].
Audiobus state save/restore applies to the documented Audiobus integration and
must not be generalized to AU/IAA state [C-026].

AU state serialization, preset browsing, asset bookmarks/security-scoped URLs,
plug-in version migration, missing-plug-in placeholders, parameter remapping,
and partial recall after failure remain `UNKNOWN` [C-022, C-023].

### 11.6 UI, diagnostics, and failure modes

AU views can be moved and resized; multiple AU instruments may remain open on
iPad; pinned views persist their location; and an AUView speaker icon can toggle
output [C-017]. Apple allows an AUv3 extension to omit custom UI, but MultiTrack’s
generic UI fallback/headless presentation is `UNKNOWN` [C-019, C-023].

Scaling policy, accessibility of plug-in views, UI/DSP disconnect handling,
hung-view termination, error messages, logs, crash reports, safe mode,
missing-unit display, and replacement workflows are `UNKNOWN` [C-023].

## 12. Extensibility and integration

Released integrations include AUv3/IAA hosting, Audiobus 3 sending and state
integration, a free Sound Copy app extension for the general pasteboard, Files,
drag-and-drop, AirDrop, Open In, Music Library import, Finder/iTunes file
sharing, and a Wi-Fi web server [C-016, C-024, C-026]. Wi-Fi downloads can
toggle track, bus, and master effects [C-024].

No public scripting language, macro/action API, device SDK, controller SDK,
OSC/remote API, extension-author certification program, or stable project-file
API was found [C-027]. Apple’s AUv3 API is an ecosystem extension point, not a
Harmonicdog-authored SDK [C-019].

## 13. Project format, persistence, interoperability, and collaboration

A song project can be ZIP-compressed for backup/restore, archived in-app,
shared, and moved to another device through AirDrop, Wi-Fi, or iOS sharing
[C-024]. The app also offers Finder/iTunes file sharing, Wi-Fi transfer,
drag-and-drop, copy/paste, Open In, AirDrop, Files, and Music Library import.
Mixdowns include WAV, MP3, Ogg, ALAC, FLAC, and M4A/AAC-family output with
selectable bitrates where applicable; stems can be written to a folder and
multichannel WAV is supported [C-024].

The project’s internal schema, whether media is embedded or referenced,
manifest/version identifiers, atomic-save protocol, autosave, crash journal,
startup recovery, archive validation, corruption repair, backward/forward
compatibility, missing-media relinking, and AU/IAA state representation are
`UNKNOWN` [C-025]. No AAF, OMF, ADM/BWF, MusicXML, DAWproject, Git/version-control,
or released cloud-collaboration contract is documented [C-025, C-030]. iCloud
song synchronization is named only for the unreleased Pro beta [C-004].

## 14. Delivery, live, post-production, and specialized workflows

Delivery features include full mixdown, region bounce, normalized stem export
to a folder, multichannel WAV, compressed and lossless output formats, and
effect-inclusive or effect-excluded Wi-Fi track downloads [C-007, C-024]. A
timecode ruler exists, but no MTC/transport contract is documented [C-006,
C-014].

Batch export, loudness targets/meters, DDP, AAF/OMF, video, ADR, surround,
immersive/ADM, show control, set lists, song chaining, and released Ableton Link
are `UNKNOWN` [C-030]. A forum request for MIDI-triggered song loading was
deferred by the beta account and is not a current feature claim [C-004].

## 15. Performance, reliability, security, and accessibility

Documented resource controls are selectable buffers and track freeze; explicit
limits are 32 playback tracks, 16 simultaneous hardware inputs, and four AU/IAA
units per eligible chain [C-006, C-008, C-009, C-016]. The vendor’s 64-bit
processing and ARM NEON statements are unbenchmarked [C-009]. No supported
device-performance table, thermal policy, memory warning behavior, benchmark,
or rollback facility is published [C-010].

The App Store privacy label says the developer indicated that the app collects
no data. This is a vendor declaration, not an independent privacy audit
[C-027]. The listing says the developer has not indicated supported
accessibility features; that is not proof of inaccessibility [C-027].

Plug-in trust boundaries, entitlement validation, extension signing failures,
malicious/buggy plug-in containment, project/archive path hardening, Wi-Fi server
authentication/encryption, telemetry implementation, update rollback, and
security-response policy remain `UNKNOWN` [C-020, C-023, C-031].

## 16. Licensing, ecosystem, and implementation constraints

MultiTrack is distributed as a $4.99 App Store product with in-app purchases;
the page carries Harmonicdog copyright and no public source-code license
[C-005, C-028]. **INFERENCE:** it should be treated as proprietary software, but
the exact end-user license, transfer rights, and entitlement restoration terms
were not exposed by the retained sources [C-028]. This dossier gives no legal
advice.

AUv3 implementation depends on Apple’s Audio Unit/app-extension APIs and iOS
distribution/signing rules [C-019]. IAA and Audiobus add ecosystem dependencies;
the current platform/lifecycle risk of IAA remains unresolved [C-026, C-029].
Naming Audio Unit, IAA, Audiobus, codecs, or export formats does not grant SDK,
trademark, patent, redistribution, signing, compatibility, or certification
rights. Clean-room reuse is limited to independently expressed patterns and
public behavior; no vendor code, assets, or protected UI expression was used.

## 17. Strengths, liabilities, and architecture lessons

**Strengths**

- A coherent mobile recording model combines nondestructive Regions/Bins,
  overdub/punch/monitor controls, mixer, freeze, and portable projects without
  requiring a desktop metaphor in full [C-006–C-009, C-024].
- Raw capture while monitoring effects is a strong reliability choice: printed
  processing is avoided while performers hear the chain [C-008].
- AU sidechain routing is concrete and understandable: select any other track,
  pre/post effects [C-018].
- Archive/restore, stems, multichannel WAV, and many iOS transfer routes reduce
  mobile data lock-in [C-024].

**Liabilities**

- Released-build freshness is poor at cutoff, notwithstanding plausible beta
  activity [C-001, C-004]. Solo-developer provenance creates key-person risk,
  though it can also produce direct product continuity [C-003].
- Four inserts per chain and 32 tracks are clear ceilings, useful for predictable
  mobile resource bounds but restrictive for larger work [C-006, C-016].
- Current automation, MIDI sequencing, synchronization, and post workflows are
  insufficiently documented [C-012, C-014, C-030].
- Deep host lifecycle, recall, fault containment, and diagnostics are unknown;
  format acceptance cannot be equated with robust hosting [C-020–C-023].
- IAA is a documented dependency whose present platform viability was not
  established by accessible primary evidence [C-029].

The main architecture lesson is to preserve MultiTrack’s bounded, visible
mobile resource model while specifying far more of the plug-in and persistence
contract than its public documentation reveals.

## 18. Transferable patterns

| Pattern | Problem / minimal mechanism | Support | Prerequisites and tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Raw capture with processed monitoring | Let performers hear insert FX while writing unprocessed source media | C-008 | Split monitor and record paths; compensate latency; communicate what is printed | Medium: routing/latency errors can mislead users | CANDIDATE |
| Bounded mobile resource envelope | Publish track, simultaneous-input, and inserts-per-chain ceilings; provide freeze | C-006, C-008, C-009, C-016 | Deterministic accounting and clear upgrade semantics; ceilings limit complex sessions | Low–medium | CANDIDATE |
| Region/Bin nondestructive editing | Reference source audio from movable/trimmed/faded Regions rather than rewriting it | C-006, C-007 | Durable asset identity, undo, orphan collection, and archive rules | Medium because persistence is underspecified here | CANDIDATE |
| Explicit sidechain source picker | Plug-in advertises auxiliary input; host offers other tracks pre/post FX | C-018 | Cycle prevention, channel adaptation, latency alignment, saved stable route IDs | Medium–high | CANDIDATE |
| Persist movable plug-in workspaces | Let multiple plug-in UIs remain visible and restore pinned positions | C-017 | Stable instance IDs, screen migration rules, accessibility, absent-UI fallback | Medium | CONDITIONAL |
| First-class portable song archive | One action packages a song for backup/restore and iOS sharing | C-024 | Versioned manifest, hashes, atomic import, missing dependency report, security limits | High because MultiTrack’s internal archive contract is unknown | CONDITIONAL |
| Effect-aware ad hoc export | Let users include/exclude track, bus, and master effects when downloading tracks | C-024 | Deterministic render graph and naming; combinatorial UX cost | Low–medium | CANDIDATE |

These are clean-room behavioral patterns only; protected wording, UI layouts,
assets, and implementation are not candidates.

## 19. Rejected patterns and CURIOSITY_NO_GO

- **CURIOSITY_NO_GO — adopt IAA as a new extension foundation.** Current
  6.3.6 support is documented, but current platform viability and recovery are
  unresolved. Reopen only with current Apple platform-owner evidence and a
  disposable interoperability test [C-016, C-029].
- **CURIOSITY_NO_GO — infer host robustness from “AUv3 support.”** Format
  acceptance does not prove scanning, instantiation, automation, state, latency,
  multi-bus, failure, or recovery behavior [C-020–C-023]. Reopen via owned test
  units covering each contract dimension.
- **CURIOSITY_NO_GO — copy the fixed four-insert limit.** It is a product
  resource decision, not a generally optimal architecture. Reopen only after a
  device-performance budget shows a hard need [C-016].
- **CURIOSITY_NO_GO — treat beta Pro features as shipped.** TestFlight/forum
  statements are not App Store release evidence [C-004]. Reopen when a public
  release and versioned notes exist.
- **CURIOSITY_NO_GO — extract the support cheat-sheet image.** Expected novelty
  was low after the current App Store/site copy covered visible controls; it
  would not resolve host internals. Reopen for a UI-control inventory only.
- **CURIOSITY_NO_GO — mine community anecdotes.** Search access was blocked and
  anecdotes cannot establish proprietary internals. Reopen only for a narrowly
  named failure mode, clearly labeled secondary evidence.
- **CURIOSITY_NO_GO — install the app or join the beta.** The documentary wave
  requires neither; private invitation/access and host changes are outside
  scope. Reopen in a later authorized disposable test harness.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / check | Result | Evidence and counterevidence |
| --- | --- | --- |
| H1: 6.3.6 is a linear, audio-track-first mobile DAW. | Supported, high confidence | Regions/Bins, track timeline, overdub, nondestructive edit, mixer, and export are documented [C-006–C-008]. No public scene/tracker/modular model was found. |
| H2: Current third-party hosting is AUv3-only. | Falsified | 6.3.6 explicitly also hosts IAA inputs/effects and chains [C-016]. |
| H3: Desktop VST/AUv2/AAX-style breadth is available. | Not supported; exact rejection UNKNOWN | Every current vendor description names AUv3/IAA only [C-029]. No absence claim was upgraded to “unsupported.” |
| H4: AUv3 means separate-process crash containment. | Not established | Apple documents an app-extension/remote-UI model, not MultiTrack’s exact process or restart policy [C-019, C-020]. |
| H5: Sidechain support implies full arbitrary multi-bus I/O. | Rejected | Only an auxiliary input source picker is documented; multiple outputs and dynamic I/O remain unknown [C-018, C-021]. |
| H6: “Latency compensation” proves plug-in delay compensation. | Rejected as overbroad | Vendor wording does not identify latency source or algorithm [C-009, C-021]. |
| H7: Pinned-window recall proves complete plug-in state recall. | Rejected | Only window position is stated; DSP state/presets/assets/missing units remain unknown [C-017, C-022]. |
| H8: The product is abandoned because the release is from 2022. | Partly countered, unresolved | Public release is stale, but a 2026-context Pro beta thread suggests active work; authorship and release outcome are uncertain [C-001, C-004]. |

Counterevidence/discovery searches retained as negative results:

1. Two broad web searches returned HTTP 429.
2. Official phpBB keyword searches for `AudioUnit` and `backup` returned HTTP
   403.
3. A site-specific web search returned HTTP 429; DuckDuckGo returned a human
   verification challenge, which was not bypassed.
4. Apple’s current AUv3 documentation rendered blank to the text fetcher; its
   archived guide was used instead. An attempted IAA documentation URL returned
   404. iOS 13 release-note HTML was blank, and the accessible JSON contained no
   `Inter-App` text. No IAA-deprecation claim was therefore promoted.

Later safe probes should distinguish: format enumerated; component selected;
instance created; audio/MIDI buses negotiated; render succeeds; state saves and
restores; latency/automation are correct; failure is contained; project opens
with the component missing [C-020–C-023].

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Apple lists the original release as 2009-09-18 and current MultiTrack DAW 6.3.6 as released 2022-09-04, for iPhone/iPad, requiring iOS 11+; no desktop edition is identified. | Current public released product and release history | S-002, S-007 | Apple catalog metadata and visible listing agree on current scope. | Store-region metadata can change; no vendor version archive was found. |
| C-002 | INFERENCE | High | Released-build freshness is stale at cutoff; website copyright years do not prove a newer binary. | Maintenance of released build | S-001, S-002, S-003, S-007 | More than three years separate release and cutoff. | Does not prove abandonment or internal inactivity. |
| C-003 | DOCUMENTED | High | Harmonicdog says it was founded in 2001 by solo developer Hamilton Feltman; Apple names Hamilton Feltman as seller. | Vendor provenance | S-004, S-007 | Independent first-party publisher surfaces agree on name. | “Solo developer” is self-description, not audited staffing. |
| C-004 | INFERENCE | Moderate | A distinct Pro beta was probably active in 2026 context, with MIDI 2.0, time-stretch, Link, automation, MIDI routing/mapping, broad undo, and iCloud sync; none is released-6.3.6 evidence. | Unreleased maintenance context | S-005 | Forum is vendor-hosted; iOS 26 reference and same-year formatting suggest 2026. | Account identity and year are not explicit; no released artifact. |
| C-005 | DOCUMENTED | High | US base price is $4.99 plus IAP; base includes two tracks/all features and track purchases can expand to 32. | Current distribution/edition | S-002, S-007 | Store page and release copy agree. | IAP prices and other regions are not captured. |
| C-006 | DOCUMENTED | High | A song is a linear, audio-track-first session with up to 32 tracks, mono/stereo Regions and Bins, ruler/grid, and nondestructive edits. | 6.3.6 workflow | S-001, S-002, S-007 | Repeated current product copy. | “32 stereo tracks” headline is reconciled with mixed mono/stereo region notes; exact internal channel model unknown. |
| C-007 | DOCUMENTED | High | Regions support move/trim/vertical drag, volume/fades/mute, realtime edit monitoring, snap, loop/punch, bounce, and bounded undo/redo. | 6.3.6 editing | S-001, S-002, S-007 | Feature and release-note detail. | Complete undo coverage and destructive edge cases not stated. |
| C-008 | DOCUMENTED | High | Inputs include device/headset/USB/AUv3/IAA; up to 16 USB inputs can record; monitoring can include effects while raw input is recorded. | 6.3.6 recording/I/O | S-001, S-002, S-007 | Vendor and App Store descriptions agree. | No interface compatibility matrix or tested device list. |
| C-009 | DOCUMENTED | High for wording; moderate for performance implication | Projects support 16/24/32f and 44.1–96 kHz; vendor claims 64-bit internal audio, selectable buffers/latency compensation, ARM NEON optimization, and freeze. | 6.3.6 engine surface | S-001, S-002, S-007 | Direct feature statements. | No benchmark; “latency compensation” is underspecified. |
| C-010 | UNKNOWN | High | Proprietary graph, threads, scheduler, multicore policy, process/services, offline engine, dropout handling, and diagnostics are not publicly established. | Engine internals | S-001–S-007 reviewed | Attempted official site/support/App Store and platform docs. Next probe: vendor architecture statement or authorized instrumentation. | Feature copy cannot establish internals. |
| C-011 | DOCUMENTED | High | Mixer has per-track fader/pan/mute/solo, track EQ/compressor, two FX buses with reverb/delay, and master EQ/compressor. | 6.3.6 mixer | S-001, S-002, S-007 | Repeated feature copy. | Send law, subgroup graph, and feedback rules not stated. |
| C-012 | UNKNOWN | Moderate-high | Released 6.3.6 automation, controller mapping, Link, and remote-control behavior are not established. | Current automation/control | S-001, S-002, S-005, S-007 | Current copy omits it; beta names future automation/mapping/Link. Next probe: run 6.3.6 or obtain versioned manual. | Beta wording suggests but does not prove current absence. |
| C-013 | DOCUMENTED | High | Current release includes an AU instrument/music-device keyboard with pitch bend, mod wheel, scalable keys, velocity, and aftertouch where supported. | 6.3.6 MIDI performance | S-002, S-007 | Release notes. | Does not prove MIDI clip recording or MPE. |
| C-014 | UNKNOWN | Moderate-high | Standalone MIDI tracks/clips/editing, notation, MPE/MIDI 2.0, SysEx, clock, and MTC are not established for 6.3.6. | Current MIDI/sequencing | S-001, S-002, S-005, S-007 | Current sources reviewed; beta future features separated. Next probe: versioned manual/dynamic test. | Feature-list omission is not proof of rejection. |
| C-015 | DOCUMENTED | High | Native processors are track EQ/compressor, bus reverb/delay, and master EQ/compressor. | 6.3.6 native devices | S-001, S-002, S-007 | Repeated feature copy. | Internal device abstraction/preset model unknown. |
| C-016 | DOCUMENTED | High | 6.3.6 hosts AUv3 and IAA generators, instruments, and effects, with four-unit chains on tracks, two FX buses, and master. | Current third-party formats | S-001, S-002, S-007 | Three current publisher surfaces agree. | Format claim alone does not prove complete contract. |
| C-017 | DOCUMENTED | High | AU selection supports MRU sorting; FX order can be dragged; AU views move/resize, multiple instrument views can remain open on iPad, pin positions restore, and output can be toggled. | 6.3.6 discovery/UI | S-002, S-007 | Release-note detail. | Scanning and headless/generic UI behavior unknown. |
| C-018 | DOCUMENTED | High | AU sidechains can source another track pre/post FX; release notes mention units publishing sidechain/multiple input buses. | 6.3.6 auxiliary input | S-001, S-002, S-007 | Specific release notes and site claim. | Does not establish multiple outputs or arbitrary dynamic I/O. |
| C-019 | DOCUMENTED | High | Apple AUv3 app extensions define generator/instrument/effect/music-effect types, optional UI, host-embedded remote UI, buses, render blocks, and resource lifecycle calls. | Apple platform format, not product implementation | S-006 | Platform-owner documentation. | Archived, updated 2017; does not prove MultiTrack fidelity. |
| C-020 | UNKNOWN | High | MultiTrack’s AU/IAA enumeration implementation, validation/cache/quarantine, exact process isolation, crash containment, bridge/signing policy, and restart behavior are unknown. | 6.3.6 host lifecycle | S-001, S-002, S-003, S-006, S-007 | Official sources plus blocked targeted searches. Next probe: owned malformed/test extensions in disposable device. | AUv3 extension model is insufficient to infer isolation. |
| C-021 | UNKNOWN | High | Multi-output, dynamic I/O, event timing, sample-accurate automation, PDC/tails, bypass/suspend, offline flags, channel conversion, and freeze semantics are unknown. | 6.3.6 processing contract | S-001, S-002, S-006, S-007 | Sidechain is the only detailed bus evidence. Next probe: conformance AU fixtures. | Generic Apple APIs show possibility, not host behavior. |
| C-022 | UNKNOWN | High | AU/IAA parameter identity, presets, DSP state, asset references, migration, and automation recall are unknown; pinned UI position is the only AU-specific song recall detail. | 6.3.6 state/recall | S-002, S-007 | Current release notes reviewed. Next probe: save/reopen with owned stateful AU. | Audiobus state cannot be generalized to AU/IAA. |
| C-023 | UNKNOWN | High | Missing-plug-in placeholders, partial recall, scan/instance failure UX, logs, safe mode, generic UI fallback, and crash recovery are unknown. | 6.3.6 failure handling | S-001–S-007 reviewed | Targeted forum/search attempts blocked. Next probe: remove/crash an owned test AU in disposable project. | Search access limits prevent stronger negative claim. |
| C-024 | DOCUMENTED | High | Projects can be ZIP-archived for backup/restore and shared; import/transfer routes are broad; export includes mixdown, stems, multichannel WAV, and several lossless/lossy codecs. | 6.3.6 files/interchange | S-001, S-002, S-007 | Current descriptions and release notes agree. | Container/codec combinations and archive schema not defined. |
| C-025 | UNKNOWN | High | Project schema, media embedding/references, autosave/journaling, corruption recovery, compatibility, relinking, and missing dependency representation are unknown. | Persistence/recovery | S-001, S-002, S-003, S-007 | Official project copy reviewed; forum backup search blocked. Next probe: create/inspect only self-authored archives and interruption tests. | “Backup/restore” does not prove crash recovery. |
| C-026 | DOCUMENTED | High | Audiobus 3 can send any track/master and save/restore Audiobus state; Sound Copy and iOS sharing surfaces are integrated. | 6.3.6 integration | S-001, S-002, S-007 | Repeated product copy. | Audiobus state scope and failure behavior not detailed. |
| C-027 | UNKNOWN | Moderate-high | No released scripting, SDK, controller/OSC API, stable file API, or remote protocol is established. | Extensibility/control | S-001, S-002, S-003, S-007 | Official surfaces reviewed. Next probe: vendor documentation request. | Absence from feature pages is not proof none exists. |
| C-028 | INFERENCE | High | Product should be treated as proprietary paid software; exact EULA and entitlement-transfer terms are unknown. | Licensing | S-002, S-007 | Paid App Store distribution and copyright; no public source license found. | No retained EULA text; not legal advice. |
| C-029 | UNKNOWN | High | No evidence establishes VST2/3, AUv2, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DX/DXi, or Rack Extension hosting; current IAA platform viability is also unresolved. | Required format breadth | S-001, S-002, S-006, S-007 | Current product explicitly names AUv3/IAA only; Apple IAA evidence retrieval failed. Next probe: vendor matrix/platform docs. | Omission is not proof of rejection. |
| C-030 | UNKNOWN | Moderate-high | Scene/tracker/modular models, takes/comping, warping, advanced tempo, standalone native instrument/content systems, post/video, surround/immersive, loudness/DDP, batch, and broad interchange are not established. | Advanced editing, devices, and workflows | S-001, S-002, S-005, S-007 | Current sources reviewed; beta separated. Next probe: versioned manual. | Some could exist but be omitted from marketing copy. |
| C-031 | UNKNOWN | High | Plug-in/project/Wi-Fi security controls, telemetry implementation, response policy, and rollback are not publicly established. | Security/reliability | S-003, S-007 | Privacy label and support page reviewed. Next probe: privacy/security documentation and safe network test. | “Data Not Collected” is developer-indicated, not a security audit. |
| C-032 | DOCUMENTED | High | Developer indicates no data collection; App Store has no declared accessibility-feature support. | Current App Store declarations | S-007 | Current listing sections. | Neither statement is independently audited; undeclared does not mean inaccessible. |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Vendor/App Store feature copy proves what
is publicly documented, not independent runtime quality.

### S-001 — MultiTrack DAW product page

- **Publisher/URL/kind:** Harmonicdog; <https://www.harmonicdog.com/>; official
  current product page.
- **Version scope:** Current unnamed release; cross-checked to 6.3.6 because the
  same feature/release wording appears in the App Store sources.
- **Relevant passages:** “32 Stereo Tracks”; four AUv3 units per track; detailed
  recording/editing list; AUv3/IAA instruments/generators/effects; sidechain;
  freeze; 64-bit precision; USB I/O; export formats and stems.
- **Claims:** C-002, C-006–C-011, C-015–C-018, C-024, C-026, C-029.
- **Limitations:** Marketing summary, copyright 2024, no version/date, no host
  internals, no independent performance verification.
- **Selection rationale:** Canonical vendor feature surface; preferable to
  third-party app reviews for released capabilities.

### S-002 — Apple Search API record for MultiTrack DAW

- **Publisher/URL/kind:** Apple App Store catalog;
  <https://itunes.apple.com/search?term=MultiTrack%20DAW&entity=software&country=us&limit=10>;
  machine-readable distributor metadata containing track ID 329322101.
- **Version scope:** 6.3.6; release date 2022-09-04; US storefront snapshot.
- **Relevant passages/fields:** `version`, `currentVersionReleaseDate`,
  `minimumOsVersion`, price, seller, release notes, full description, supported
  devices, and bundle ID.
- **Claims:** C-001–C-002, C-005–C-009, C-011–C-018, C-022, C-024, C-026,
  C-028–C-030.
- **Limitations:** Description/release notes are seller supplied; search result
  also contained unrelated apps; no runtime verification; regional pricing.
- **Selection rationale:** Exact version/date and a detailed immutable response
  for the access moment; preferable to uncited store screenshots.

### S-003 — Harmonicdog Support

- **Publisher/URL/kind:** Harmonicdog; <https://www.harmonicdog.com/support>;
  official support landing page.
- **Version scope:** Unversioned, copyright 2024.
- **Relevant passage:** Directs tutorials/help/FAQ to the public forum and offers
  a “MultiTrack at a glance” image.
- **Claims:** C-002, C-010, C-020, C-025, C-027, C-031 (mainly documentation
  boundary/negative coverage).
- **Limitations:** Almost no textual product detail; cheat-sheet image was not
  extracted because expected decision value was low.
- **Selection rationale:** Establishes the vendor’s official support/documentation
  surface and explains why no current textual manual was retained.

### S-004 — Cutting Edge Audio Technology (About)

- **Publisher/URL/kind:** Harmonicdog; <https://www.harmonicdog.com/about>;
  official company profile.
- **Version scope:** Company/product history, copyright 2024.
- **Relevant passage:** Founded in 2001 by Hamilton Feltman; describes a solo
  developer and MultiTrack DAW as flagship mobile product.
- **Claims:** C-003.
- **Limitations:** Self-description and marketing; staffing is not independently
  audited.
- **Selection rationale:** Canonical provenance source, corroborated by Apple’s
  seller field; preferable to third-party company databases.

### S-005 — “New MultiTrack Pro version for Beta Test”

- **Publisher/URL/kind:** Harmonicdog-hosted phpBB;
  <https://forum.harmonicdog.com/viewtopic.php?p=12333#p12333>;
  public forum thread / unreleased-product statement.
- **Version scope:** Distinct Pro beta; thread page shows July/August without a
  year, in a 2026 access context.
- **Relevant passages:** Tester solicitation; MIDI tracks/MIDI 2.0, time-stretch,
  Link, automation, MIDI routing/mapping/transport, undo, iCloud sync; iOS 16/17
  discussion; invitation sent; all MIDI connections saved per song.
- **Claims:** C-004, C-012, C-014, C-030.
- **Limitations:** Account `pwnified` is not explicitly tied to Hamilton Feltman
  on the page; no release artifact; community replies are not product proof;
  year is inferred from context.
- **Selection rationale:** Highest-value maintenance follow-up after the stale
  release was established; retained only as qualified beta evidence, not as a
  source for current features.

### S-006 — App Extension Programming Guide: Audio Unit

- **Publisher/URL/kind:** Apple Developer Documentation Archive;
  <https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/AudioUnit.html>;
  platform-owner technical documentation, updated 2017-10-19.
- **Version scope:** AUv3 app-extension model on iOS 9+ and macOS 10.11+ as
  documented in the archived guide.
- **Relevant sections:** “How Audio Unit App Extensions Work,” audio-unit types,
  optional UI, host container/remote view, `inputBusses`, `outputBusses`, render
  block, and render-resource lifecycle.
- **Claims:** C-019–C-023, C-029.
- **Limitations:** Archived and not MultiTrack-specific; cannot prove host
  implementation or current IAA status.
- **Selection rationale:** Accessible primary platform contract after Apple’s
  dynamic current page returned blank; preferable to third-party AU explainers.

### S-007 — MultiTrack DAW App Store product page

- **Publisher/URL/kind:** Apple App Store;
  <https://apps.apple.com/us/app/multitrack-daw/id329322101>; current public
  distributor listing with seller-supplied content.
- **Version scope:** 6.3.6, 2022-09-04; accessed current US storefront.
- **Relevant sections:** price/IAP, description, “What’s New,” compatibility,
  seller, App Privacy (“Data Not Collected”), and Accessibility (developer has
  not indicated supported features).
- **Claims:** C-001–C-003, C-005–C-009, C-011–C-018, C-022, C-024, C-026,
  C-028–C-032.
- **Limitations:** Feature claims and privacy declaration are developer supplied;
  accessibility non-declaration is not an accessibility test; no IAP prices.
- **Selection rationale:** Current human-visible release/distribution/privacy
  record; retained in addition to S-002 because it adds privacy/accessibility and
  presentation details absent from the API response.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted methods / blocker | Impact | Safest next probe | Required access/fixture | Owner |
| --- | --- | --- | --- | --- | --- |
| Exact released roadmap and Pro-beta status | App Store/site checked; beta account identity/year not explicit | Maintenance and migration risk | Wait for public release/versioned vendor notice; optionally request vendor clarification | Public response only; no beta invitation needed | Unassigned |
| AU/IAA discovery, scanning, cache, duplicate handling, validation/quarantine | Official pages reviewed; forum search 403; web search 429/challenge | Startup reliability and diagnosability | Install two owned AU fixtures with controlled version/identity changes on disposable device | Authorized iOS test device and self-authored AUv3s | Unassigned |
| AUv3/IAA process placement and crash containment | Apple format guide is generic; no host architecture doc | Security and session survival | Crash/hang an owned test AU and record host/extension processes and project outcome | Disposable device, debugger entitlement as permitted, owned AU | Unassigned |
| Multi-output, dynamic buses, MIDI/event timing, MPE/MIDI 2.0, sample-accurate automation | Only sidechain/multiple input-bus text is public | Graph expressiveness and interoperability | Conformance suite of owned AU generators/effects/instruments with changing buses and timestamped events | Owned AUv3 fixtures and loopback capture | Unassigned |
| Plug-in latency/tail/PDC, bypass/suspend, offline render and freeze | “Latency compensation” and freeze are underspecified | Alignment and render correctness | Impulse/known-delay AU; freeze and export comparisons at multiple buffers | Disposable project, owned deterministic AU | Unassigned |
| Plug-in state/presets/assets/migration and missing-plugin representation | Only pinned UI position and Audiobus state are documented | Durable project recall | Save/reopen, upgrade, remove, and reinstall owned stateful AU with external asset | Two AU versions, self-authored asset, disposable song | Unassigned |
| Project schema, atomic save, autosave/crash recovery, archive validation, compatibility | ZIP backup/restore documented; forum backup search blocked | Data-loss and migration risk | Create only self-authored songs, inspect exported archives lawfully, interrupt saves, corrupt copies, test restore across app versions | Authorized device(s), sacrificial project/archive | Unassigned |
| Media embedding/relinking and codec edge cases | Feature list only; duplicated M4A text | Portability and ingest fidelity | Move/rename self-authored sources; round-trip supported codecs/rates/channels and compare | Test corpus with known hashes/metadata | Unassigned |
| Current MIDI tracks, automation, sync and controller support in 6.3.6 | Beta features separated; no released manual | Workflow comparison | Inspect released UI/manual or run bounded MIDI loopback tests | 6.3.6-compatible device, virtual/physical MIDI loopback | Unassigned |
| Audio-interface compatibility, channel naming, hot-plug, aggregate/routing behavior | Generic “any USB hardware supported by iOS” and 16-input claim only | Recording reliability | Class-compliant interface matrix; hot-plug/sample-rate/channel tests | Lightning and USB-C devices plus representative interfaces | Unassigned |
| IAA current OS viability and recovery | Apple IAA page 404; release-note text did not establish deprecation | Legacy dependency risk | Obtain current Apple platform-owner statement, then test only on supported OS if lawful | Current Apple docs and disposable pair of IAA apps | Unassigned |
| Accessibility and localization coverage | Store says no declared accessibility features; no test | Inclusive design comparison | VoiceOver/Switch Control/Dynamic Type audit of released app and AU dialogs | Authorized device; accessibility checklist | Unassigned |
| Wi-Fi server security/privacy implementation | No protocol/authentication detail | Local-network exposure | Vendor documentation first; then isolated-network observation of own transfers | Disposable isolated LAN and self-authored files | Unassigned |
| Exact EULA, IAP entitlement restoration/transfer, format/trademark obligations | Store/pricing/copyright captured; no retained EULA | Procurement and legal constraints | Retrieve applicable App Store EULA and vendor terms with counsel if a decision requires it | Jurisdiction/storefront-specific legal review | Unassigned |

## 24. Curiosity pass and stop decision

Scores are 1 (low) to 5 (high); lower cost is better.

| Candidate thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify beta/maintenance thread | 4 | 5 | 5 | 1 | **Pursued.** Found qualified Pro-beta evidence; did not alter current-release scope [C-004]. |
| Target official forum for AU lifecycle and backup/recovery | 5 | 4 | 4 | 2 | **Pursued, blocked.** phpBB 403, web search 429, alternate search challenge. Gaps remain explicit [C-020–C-025]. |
| Retrieve Apple AUv3 platform contract | 5 | 4 | 3 | 1 | **Pursued.** Archived primary guide bounded possible AU behavior without attributing internals [C-019]. |
| Prove current IAA deprecation/platform status | 4 | 4 | 3 | 2 | `CURIOSITY_NO_GO` after 404/blank/nonmatching Apple evidence; no claim promoted. Reopen with a current accessible Apple source. |
| Extract support cheat-sheet image | 2 | 2 | 2 | 2 | `CURIOSITY_NO_GO`; unlikely to change architecture conclusions. |
| Mine user reviews/forum anecdotes for failures | 3 | 2 | 3 | 4 | `CURIOSITY_NO_GO`; secondary anecdotes cannot prove internals and search was blocked. |
| Join TestFlight/run beta | 2 for current release | 4 | 5 | 5 | `CURIOSITY_NO_GO`; private/unreleased and outside documentary authority. |
| Install 6.3.6 and qualify plugins/projects | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO` for this wave; defer to authorized disposable test harness. |
| Retrieve privacy policy/EULA minutiae | 2 | 2 | 2 | 2 | `CURIOSITY_NO_GO`; App Store declarations suffice for this architecture dossier; reopen for legal/security decision. |

**Stop decision:** stop on combined **coverage, saturation, access boundary, and
nonpositive marginal evidence**. Every required heading and plug-in row is
complete; current first-party feature surfaces duplicate one another; the one
decision-changing maintenance thread and Apple format contract were pursued;
deep host/persistence questions require dynamic fixtures rather than more broad
searching. Search 429s, forum 403s, a human challenge, and inaccessible dynamic
Apple pages are recorded rather than bypassed. No public source pass exceeded
two decision-critical retrievals before synthesis.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** This file was newly created;
  no other path was changed by this researcher.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See section 0.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-IDs; section 21 classifies every claim.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  claims register and section 23 probes.
- [x] **Every required plugin-format row is present.** Section 11.1 contains all
  13 required rows.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover discovery, lifecycle/isolation, buses/processing,
  automation/state, UI, diagnostics, and failure.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Claim classifications and beta separation are explicit.
- [x] **Licensing and clean-room boundaries are explicit.** See section 16.
- [x] **Bibliography records source rationale and limitations.** Seven retained
  sources are documented in section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See sections
  19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Documentary retrieval only; no installer/binary/plugin
  execution; challenges and access controls were not bypassed.

**Checks performed:** template heading audit; required-format row audit; claim-ID
and source-ID review; public-source URL review; stop/curiosity review; `git
status --short` before and after authoring (after-check reported in handoff).

**Unresolved blockers:** no current versioned manual; search HTTP 429; official
forum search HTTP 403; alternative search human challenge; dynamic Apple AUv3
page blank; attempted Apple IAA page 404; proprietary host/project internals;
beta account identity/year and release outcome not explicit.

**Pre-existing workspace changes:** many modified/untracked paths outside this
dossier, including `apps/mobile/**`, `vendor/crafty/**`, `bun.lock`, and the
untracked `research/daw-landscape/` tree, were present before authoring and were
left untouched.
