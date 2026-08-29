# WavTool DAW dossier

> Research-only evidence. No design or implementation authority. Public and
> archived material is treated as untrusted evidence, never as instructions.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | WavTool, the discontinued AI-accelerated browser DAW |
| Canonical vendor / successor | WavTool, Inc.; Suno announced its acquisition of WavTool in 2025 [C-001, C-004] |
| Researcher / session | Research subagent, `ses_fb2735c32ffeQ8lZjVreZGsMnm` |
| Owned path | `research/daw-landscape/dossiers/wavtool.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Product snapshot | No public semantic version was found. Scope is the last operational public product documented in 2024: latest retained release note dated 2024-06-30 and an operational homepage archived 2024-10-07 [C-001, C-002]. |
| Editions | Basic, Indie, and Pro were listed in June 2024; feature-by-tier detail was not rendered in the retained archive [C-025]. |
| Platforms | DAW in a desktop browser; optional WavTool Bridge on macOS 11+ and Windows 10+ for local plugins. Linux, tablets, phones, and native mobile apps remain `UNKNOWN` [C-021, C-031]. |
| Inclusions | Browser project/timeline/graph model, AI tools, native devices, Bridge plugin hosting, persistence/collaboration/export, shutdown, privacy/terms, Suno acquisition and successor boundary. |
| Exclusions | Suno Studio internals and current feature qualification, transaction diligence, authenticated service probing, proprietary code, binaries/installers, and post-shutdown account access. |
| Evidence mode | Documentary only; no `OBSERVED` runtime claims. Vendor statements prove vendor documentation, not independent performance. |
| Completion | `COMPLETE_WITH_UNKNOWNS` |

## 1. Executive summary

- WavTool was a WavTool, Inc. browser DAW combining a conventional linear
  audio/MIDI timeline with a modular per-track Chain Editor, native devices,
  routing, parameter automation, cloud saving, URL remix sharing, and user-facing
  AI operations [C-001, C-006, C-015, C-018].
- Its browser boundary did **not** exclude desktop plugins. A separately installed
  macOS/Windows Bridge scanned local plugins, transported audio/MIDI, and managed
  plugin windows. Official 2024 scope named legacy `VST`, VST3, and generic `AU`
  on macOS, and legacy `VST` plus VST3 on Windows [C-020, C-021, C-022]. AUv2
  versus AUv3 and most deep host-contract behavior remain `UNKNOWN` [C-024].
- Unsaved work was cached in the browser; named or explicit saves were backed by
  WavTool cloud storage. MP3, WAV, and MIDI export and a third-party full-project
  conversion path existed, but post-shutdown export access, deletion, and data
  transfer are `UNKNOWN` [C-007, C-009, C-029, C-003].
- The service was still operational in an official archive on 2024-10-07 and was
  offline by 2024-12-05. Suno announced a recent acquisition on 2025-06-26,
  bringing WavTool technology and its core team into Suno; later Suno described
  Suno Studio as the next DAW chapter, without documenting WavTool project/account
  migration [C-002, C-004, C-005, C-034].
- **Confidence:** high for public product identity, plugin format/OS labels,
  shutdown bracket, and acquisition; medium for exported project structure
  because it comes from an independent converter; low/unknown for proprietary
  cloud, audio-engine, AI-model, Bridge isolation, and transaction internals.

## 2. Product identity, history, and market position

WavTool identified itself as a professional, AI-accelerated music-production app
running in a browser and aimed at musicians, producers, and audio professionals.
The 2024 FAQ named WavTool, Inc. and a five-person distributed team. Its market
differentiator was the combination of browser access, recognizable DAW editing,
native AI, and—after February 2024—desktop VST/AU integration [C-001, C-021].

The last retained operational homepage is dated 2024-10-07; the 2024-12-05
homepage says the product had gone offline. The exact intervening closure date is
not established [C-002, C-003]. Suno announced its recent acquisition of WavTool
on 2025-06-26 and said the technology and core team entered Suno product and
engineering. Financial and legal-entity terms were not disclosed [C-004, C-034].
On 2025-09-25 Suno called Suno Studio the next chapter of this DAW evolution;
that lineage is not evidence that old WavTool projects or accounts work in Suno
Studio [C-005].

The June 2024 pricing page listed Basic ($0), Indie, and Pro plans. Its archived
feature table did not render, while the February plugin announcement said plugin
support was available to all users [C-025].

## 3. Workflow and conceptual model

The principal mental model was a browser project with a linear, grid-based
timeline containing audio and MIDI tracks/clips, augmented by a modular Chain
Editor for instruments/effects and cross-track connections. Panels were
rearrangeable, and Quickstart could turn uploaded audio or a TikTok/Suno sharing
URL into a multitrack, grid-aligned starting project [C-006, C-016].

Documented user-visible objects include projects, tracks, audio/MIDI clips,
devices, ports/cables, parameters, audio buffers, tempo/meter, and shared Remix
links. An independent export converter also recognizes clip loop/read ranges,
fades, warp anchors, device state, and tempo automation [C-009, C-012, C-015].
Scenes, notation, tracker patterns, video timelines, and a live-performance mode
were not established [C-014, C-033].

## 4. Publicly documented architecture

### Documented boundary

- The DAW UI and project workflow ran in a browser; unsaved project/audio data
  was cached locally in that browser, while explicit/named saves used WavTool
  cloud storage [C-006, C-007].
- A separately downloaded WavTool Bridge application on macOS/Windows connected
  the web app to locally installed plugins, passed audio and MIDI, and managed
  native plugin UI windows [C-020].
- The Chain Editor exposed typed device connections, multi-input/multi-output
  native devices, cross-track routing, and editable native device code at the
  product surface [C-015, C-017].
- A third-party WavTool project adapter parses a ZIP containing JSON and media,
  including track/clip/device/cable/state structures. This documents the exported
  artifact handled by that adapter, not WavTool's complete internal schema
  [C-009, C-023].

### Proprietary internals

Browser audio primitives, worker/worklet layout, real-time threads, graph
scheduling, server APIs, database/object-store design, cloud region topology,
collaboration protocol, cryptographic controls, AI inference services, and Bridge
IPC/plugin process topology are `UNKNOWN` [C-011, C-019, C-024, C-034]. No
retained evidence establishes that the WavTool application or engine was open
source; isolated open-source components and user-editable device code do not
change that boundary [C-032].

## 5. Audio engine

Suno's acquisition release retrospectively described WavTool as supporting
sample-accurate editing and live recording. WavTool itself documented audio
recording, automatic/manual warping, cross-track routing, parameter automation,
sidechain compression, and multi-input/multi-output native effects [C-010,
C-015]. The project adapter recognizes audio clips, fades, looping, transposition,
pitch-preserving warp anchors, tempo and meter [C-012].

Sample rates, internal precision, channel limits, buffer/block sizing, real-time
deadline handling, multicore scheduling, plugin-delay compensation, offline
render equivalence, freeze, oversampling, drop-out recovery, and engine meters or
diagnostics are `UNKNOWN` [C-011]. The native device example shown publicly used
buffer-oriented processing, but it is insufficient to infer the full engine
scheduler or thread model [C-017].

## 6. Tracks, timeline, clips, and editing

Documented/project-readable structures include audio and MIDI tracks; named and
colored clips; gain, balance and mute; timeline start/end; clip read/loop ranges;
audio fades, gain, transpose and warp; project tempo/meter; and instantaneous
tempo-automation points [C-009, C-012, C-015]. Quickstart created grid-aligned
multitrack projects, and the official homepage documented automatic/manual audio
warping [C-010, C-016].

The retained sources do not establish takes, comp lanes, ripple editing,
folders/VCAs, clip grouping, edit history/versioning, destructive operations, or
navigation limits [C-030].

## 7. MIDI, sequencing, notation, and expression

WavTool documented MIDI recording from controllers, MIDI tracks/clips, MIDI
export, audio-to-MIDI transcription, AI-generated MIDI, and Composer suggestions.
Composer initially supplied contextual MIDI continuations for chords, beats,
melodies, or freeform prompts; by June 2024 it could write accompaniment for an
audio track as well [C-013, C-018]. The export adapter recognizes note start,
duration, pitch, velocity and clip loops [C-012].

Piano-roll details, pattern sequencing, notation/score, MPE, per-note expression,
MIDI 2.0, SysEx, MIDI clock, MTC, external synchronization, and sample-accurate
MIDI scheduling are `UNKNOWN` [C-014].

## 8. Routing, mixer, automation, and control

The product homepage documented cross-track routing, a modular Chain Editor,
parameter automation, sidechain compression, and multi-input/multi-output native
effects. The export adapter represents devices and port cables and recovers track
gain/pan/mute plus tempo automation [C-015]. WavTool accepted audio interfaces and
MIDI controllers [C-013, C-016].

The retained sources do not establish sends/returns, feedback legality, channel
layouts beyond shown stereo examples, surround/immersive audio, VCAs, control
surface protocols, OSC, remote APIs, automation curve/interpolation semantics, or
sample-accurate external-plugin automation [C-011, C-014, C-024].

## 9. Recording, comping, and media handling

Audio and MIDI recording through audio interfaces/controllers was documented.
The homepage explicitly accepted MP3, WAV, FLAC, OGG, and M4A; the FAQ said
nearly all audio formats and named MP3/WAV/FLAC. Imported audio could be warped,
transcribed, stem-separated, or used by Quickstart [C-016, C-018].

The export adapter recognizes WAV/FLAC/OGG/MP3 media references, embedded assets,
audio fades/loops/warp, and native sampler assets [C-009, C-012, C-017]. Input
monitoring, punch/loop-record behavior, take lanes, comping, sample relinking,
conform/proxies, video, metadata preservation, and recording limits are
`UNKNOWN` [C-030, C-033].

## 10. Instruments, effects, content, and native devices

The official product surface named a wavetable synth, convolution reverb,
sidechain compressor, gain/balance device, correlator, drum presets, sample/loop
library, and live coding of WavTool synths/effects. It also advertised
multi-input/multi-output devices and professionally made presets [C-017].

The independent adapter recognizes WavTool-native wavetable and simpler synths,
single/multi-samplers, and common limiter, clipper, compressor, gate, reverb,
convolver, delay, overdrive, bit-crusher and flanger state. This inventory is
converter-specific and neither exhaustive nor a stability promise [C-017].
Native-device SDK versioning, code sandbox, permission model, preset packaging,
macro/modulation system, and post-shutdown distribution are `UNKNOWN` [C-024,
C-032].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`Mobile/web` distinguishes the desktop web app connected to Bridge from a pure
mobile browser. A missing format name is not treated as proof of exclusion.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `DOCUMENTED` as legacy “VST” beside VST3; generation label qualified | `DOCUMENTED` as legacy “VST” beside VST3; DawVert recognizes VST2 state | `UNKNOWN` | `DOCUMENTED` only for desktop web app + Bridge; mobile `UNKNOWN` | All users; macOS 11+, Windows 10+; 2024-02 | Vendor did not write “VST2,” but the separate VST/VST3 labels and converter state support the legacy row; full contract unknown | C-021, C-023; S-005, S-014 |
| VST3 | `DOCUMENTED` | `DOCUMENTED` | `UNKNOWN` | `DOCUMENTED` only for desktop web app + Bridge; mobile `UNKNOWN` | All users; macOS 11+, Windows 10+; 2024-02 | Scan/use documented; deep buses/state/latency contract unknown | C-021–C-024; S-004, S-005, S-014 |
| AUv2 | `UNKNOWN` | `NOT_APPLICABLE: Apple format` | `NOT_APPLICABLE: Apple format` | `UNKNOWN`; only generic desktop-macOS AU was named | All users; generic AU on macOS 11+; 2024-02 | Official source did not identify AU generation | C-021, C-024; S-005 |
| AUv3 | `UNKNOWN` | `NOT_APPLICABLE: Apple format` | `NOT_APPLICABLE: Apple format` | `UNKNOWN`; no iOS/mobile host evidence | Generic AU only; 2024-02 | AUv3 must not be inferred from “AU” | C-021, C-024; S-005 |
| AAX | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | No retained WavTool evidence | Not named; absence is not proof of exclusion | C-024; S-004, S-005 |
| CLAP | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | No retained WavTool evidence | Not named; absence is not proof of exclusion | C-024; S-004, S-005 |
| LV2 | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | No retained WavTool evidence | Not named; no Linux Bridge build documented | C-024; S-004, S-005 |
| LADSPA | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | No retained WavTool evidence | Not named; no Linux Bridge build documented | C-024; S-004, S-005 |
| DSSI | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | No retained WavTool evidence | Not named; no Linux Bridge build documented | C-024; S-004, S-005 |
| JSFX | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | No retained WavTool evidence | WavTool's editable JS-like native devices are not evidence of REAPER JSFX hosting | C-017, C-024; S-007, S-014 |
| DirectX/DXi | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE: Windows-native format` | `UNKNOWN` | No retained WavTool evidence | Not named | C-024; S-004, S-005 |
| Rack Extension | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | No retained WavTool evidence | Not named; proprietary Reason ecosystem must not be inferred | C-024; S-004, S-005 |
| Product-native/other | `DOCUMENTED` in browser | `DOCUMENTED` in browser | `UNKNOWN` browser qualification | `DOCUMENTED` for browser native devices; mobile usability `UNKNOWN` | Last public 2024 product; tier split unknown | WavTool-native devices, presets, Chain Editor and live code; not a documented third-party SDK | C-017, C-025, C-031, C-032; S-007, S-015 |

### 11.2 Discovery, scanning, validation, and recovery

With Bridge running, users opened Library → Plugins & Devices → VST & AU Plugins
and selected “Find Installed Plugins” or “Scan Plugins,” then dragged a result to
the timeline or Chain Editor [C-020]. Search paths, incremental scanning,
validation, cache schema, duplicate identity, blacklist/quarantine, timeout,
rescan controls, and missing-plugin recovery are `UNKNOWN` [C-024].

### 11.3 Runtime isolation and compatibility

Bridge was a separate downloadable macOS/Windows application from the browser
app. The official description says it passed audio/MIDI and managed plugin UI
windows. Rosetta 2 was documented for Intel plugins on M1 Macs [C-020, C-022].
Whether each plugin ran in Bridge's process or a child process, crash containment,
sandboxing, signing/notarization checks, x86/x64 Windows bridging, Apple Silicon
native handling, and per-plugin restart are `UNKNOWN` [C-024].

### 11.4 Host/plugin processing contract

Official material documents multiple synthesizer and audio-effect plugins in one
project and Bridge transport of audio and MIDI [C-020, C-022]. The converter sees
input/output specifications and distinguishes a MIDI-input instrument from an
effect, but this is third-party parser logic, not a complete host contract
[C-023]. External-plugin sidechains, multiple audio/event buses, dynamic I/O,
multi-output instruments, MPE/MIDI 2.0, sample-accurate automation, latency/tail
reporting, bypass/suspend and offline rendering remain `UNKNOWN` [C-024].

### 11.5 Parameters, automation, state, presets, and project recall

The project adapter recognizes Bridge source ID/name/manufacturer, I/O specs and
an encoded state payload, including signatures it treats as VST2 or VST3 state
[C-023]. This supports state persistence in at least the adapter's fixtures, but
does not prove AU recall, parameter identity/ranges/text, presets, asset
references, migration, missing-plugin placeholders, or lossless round trips
[C-024]. Product-level parameter automation was documented, but external-plugin
automation fidelity was not [C-015, C-024].

### 11.6 UI, diagnostics, and failure modes

Bridge managed plugin interface windows as users selected related tracks/devices
[C-020]. Embedded versus detached behavior, scaling, accessibility, headless use,
generic parameter UI, scan logs, crash dialogs, quarantine UX and failure
diagnostics are `UNKNOWN` [C-024, C-030]. The discontinued web service prevents a
lawful current dynamic qualification without a vendor fixture [C-003].

## 12. Extensibility and integration

Documented integrations were audio interfaces, MIDI controllers, URL remix
sharing, Quickstart ingestion of TikTok/Suno links or files, third-party plugin
Bridge, export tools, and user-editable WavTool synth/effect code [C-008, C-013,
C-016, C-017, C-020, C-029].

No stable public device SDK, scripting API, remote-control API, controller API,
command schema, OSC service, or compatibility/versioning policy was found. Terms
treated application code/materials as proprietary while preserving separately
licensed third-party components [C-032]. “Live-code” therefore documents a
product feature, not permission to copy its API or redistribute WavTool devices.

## 13. Project format, persistence, interoperability, and collaboration

WavTool cached unsaved project/audio data locally in the browser. Setting a name
or File → Save triggered cloud saving; saved projects were described as securely
backed up and private unless the owner used Remix sharing. The homepage also
described collaboration by pasting a URL [C-007, C-008]. Whether that meant
simultaneous co-editing, branch/merge, comments, or only copy/remix is `UNKNOWN`.

WavTool exported MP3, WAV and MIDI. Its FAQ linked DawVert for full-project
conversion; DawVert's adapter reads a ZIP/JSON/media representation containing
substantial timeline and device state [C-009, C-029]. AAF, OMF, ADM, MusicXML,
DAWproject-direct export, collect/archive semantics, autosave versions, crash
recovery, migrations, backward compatibility and missing-dependency placeholders
are `UNKNOWN` [C-030].

At shutdown, the public offline page offered no project-download path. Actual
export grace period, cloud retention/deletion, data transfer to Suno, and project
migration are `UNKNOWN`; the privacy policy's transaction-transfer clause is
permission, not evidence that a transfer occurred [C-003, C-034].

## 14. Delivery, live, post-production, and specialized workflows

Documented delivery consisted of MP3/WAV/MIDI export and the third-party project
conversion route. AI-oriented specialties included generation, stem separation,
audio-to-MIDI, timbre/voice-instrument prototypes, Composer accompaniment and
Quickstart remix workflows [C-018, C-029].

Batch export, stems as a first-party WavTool command, loudness targets, DDP,
video/timecode, ADR, surround/immersive/ADM, notation delivery, show control and
dedicated live performance are `UNKNOWN` [C-033]. Suno Studio's later stem export
must not be retroactively attributed to WavTool [C-005].

## 15. Performance, reliability, security, and accessibility

WavTool recommended a computer with mouse and keyboard. Bridge requirements were
macOS 11+ and Windows 10+, with Rosetta 2 for Intel plugins on M1. No Linux or
mobile Bridge build was documented [C-022, C-031].

The privacy policy said information was U.S.-hosted, named account/device/usage
collection, Google Analytics and Stripe, provided user deletion routes, and
disclaimed absolute security. Terms described AI as experimental and allowed
service discontinuation without notice [C-026, C-028].

Track/device limits, latency/resource controls, crash recovery/containment,
service SLOs, backups/restore tests, diagnostics, rollback, signing, Bridge update
security, telemetry opt-out, accessibility conformance, keyboard/screen-reader
coverage and localization are `UNKNOWN` [C-030].

## 16. Licensing, ecosystem, and implementation constraints

Users retained copyright in uploaded content, but granted WavTool a broad
worldwide service/business license and permitted derived-data use to improve and
train algorithms, including generative AI. WavTool assigned users whatever rights
it held in AI-generated content while warning that similar outputs could be given
to others and users remained responsible for use [C-027]. This qualifies the
homepage marketing statements that WavTool did not own user music and that
generated audio was royalty-free; it is not legal advice.

The service and downloadable applications were proprietary/revocable; the terms
recognized separately licensed third-party components [C-032]. The public format
labels do not grant VST, AU, trademark, SDK, redistribution, signing,
certification, or compatibility rights. Exact WavTool/Suno IP and data assets
transferred, corporate entity disposition, and transaction consideration remain
`UNKNOWN` [C-034].

Clean-room adaptation may use behavior and abstract patterns only. It must not
copy WavTool UI expression, device code/API, project implementation, AI models,
branding, presets/content, or Bridge internals [C-032].

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** The product put a linear editor, modular device graph, AI actions,
and optional desktop plugins behind a browser entry point; its local cache/cloud
save split reduced accidental tab-close loss, and the ZIP/JSON/media artifact
enabled at least one independent converter [C-006, C-007, C-009, C-018, C-020].

**Liabilities.** Durable projects and core UI depended on a cloud service that
could disappear, while public shutdown evidence provides no portability or
deletion detail. The separate Bridge expanded compatibility but introduced an
undocumented security/crash/latency boundary. Generic `AU` naming obscured exact
compatibility [C-003, C-024, C-028].

**Architecture lesson.** Browser/native hybrid hosting is feasible, but a new DAW
should make the trust boundary, plugin generations, recovery semantics, offline
project ownership, AI permissions and end-of-service export guarantees explicit.
This is an evidence-backed recommendation, not a claim that WavTool implemented
those safeguards [C-003, C-019, C-024, C-027].

## 18. Transferable patterns

| Pattern | Problem / minimal mechanism | Support | Prerequisites and tradeoffs | Risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Linear timeline plus per-track modular graph | Keep familiar arrangement while allowing explicit device/port routing | C-006, C-015 | Stable graph schema, cycle policy, latency model, accessible graph UI | Medium; graph/engine internals unknown | `CANDIDATE` |
| Local working cache plus explicit durable save | Protect unsaved browser work while making persistence state visible | C-007 | Quotas, encryption, migration, recovery/export guarantees | High if cloud is sole durable copy | `CONDITIONAL` |
| Desktop plugin bridge for a browser editor | Connect local native plugins by authenticated audio/MIDI/control IPC | C-020–C-024 | Sandboxing, signing, version negotiation, latency/crash recovery, exact format matrix | High security/reliability burden | `CONDITIONAL` |
| Self-contained project archive | ZIP structured project data with media for portability/conversion | C-009, C-029 | Published schema, checksums, migrations, missing-dependency model | Medium; DawVert fidelity unqualified | `CANDIDATE` |
| AI as visible editor operations | Chat/suggestions invoke reviewable MIDI/audio/stem actions rather than hiding the DAW | C-018 | Consent, provenance, preview/undo, data-use controls, deterministic action log | High model/licensing/privacy risk | `CONDITIONAL` |
| Exact compatibility labels | Name format generation, OS, architecture and contract depth | C-021, C-024 | Qualification harness and release matrix | Low; avoids ambiguous “AU/VST support” | `CANDIDATE` |

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected mechanisms

- **Cloud durability without guaranteed bulk exit — REJECT.** The offline page
  exposes no recovery route, while terms put copy retention on users [C-003,
  C-028]. Reopen only with documented automatic local archives and shutdown SLA.
- **Opaque broad upload license as an AI default — REJECT.** Training/business
  rights should be purpose-separated and controllable [C-027]. Reopen only with
  explicit consent, retention, provenance and deletion controls.
- **Format-family-only compatibility claims — REJECT.** Generic `AU` leaves AUv2
  versus AUv3 unresolved, and a logo/name does not establish a host contract
  [C-021, C-024].
- **Treat local Bridge as implicit sandbox — REJECT.** A separate executable is a
  boundary, not proof of per-plugin isolation or crash containment [C-020, C-024].

### `CURIOSITY_NO_GO` threads

- `CURIOSITY_NO_GO`: more shutdown snapshots after a sufficient 2024-10-07 to
  2024-12-05 bracket; one timeout and two transport errors made marginal value
  nonpositive. Reopen for an official shutdown email/status archive.
- `CURIOSITY_NO_GO`: transaction price/corporate registry. Independent reporting
  says terms were undisclosed; low architecture value. Reopen for a public filing.
- `CURIOSITY_NO_GO`: founder employment-profile inference. Team movement is
  already documented by Suno and cannot establish asset/data details.
- `CURIOSITY_NO_GO`: map every Suno Studio feature back to WavTool. Similarity does
  not prove code lineage and broadens beyond the assigned boundary.
- `CURIOSITY_NO_GO`: download installers/media kit or execute DawVert. Documentary
  evidence sufficed; execution would add risk without decision-critical value.
- `CURIOSITY_NO_GO`: infer AUv2/AUv3 from the `AU` label or infer unsupported
  formats from silence. Both would overclaim absent evidence.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test | Result |
| --- | --- | --- |
| Browser-only WavTool could not host native desktop plugins. | Seek official bridge/process evidence. | **Falsified:** separate Bridge scanned local plugins and passed audio/MIDI/UI [C-020]. |
| WavTool shutdown and Suno acquisition were one publicly contemporaneous event. | Date operational/offline archives and acquisition release. | **Falsified:** offline by 2024-12-05; acquisition announced 2025-06-26 [C-002, C-004]. Exact closing date remains unknown. |
| “AU support” proves AUv2 and AUv3. | Seek a versioned official format matrix. | **Not established:** retained source says only `AU` [C-021, C-024]. |
| WavTool projects were fully portable. | Seek first-party export and independent parsing evidence. | **Partly supported:** audio/MIDI export and a ZIP/JSON DawVert path existed; fidelity and post-shutdown access are unknown [C-009, C-029]. |
| Conductor was an unconstrained autonomous producer. | Compare official interaction examples and terms. | **Not established:** user-visible chat/actions are documented; autonomy, approval and permissions are unknown [C-018, C-019]. |
| Plugin “support” means full host-contract compatibility. | Separate accepted label, scan, instance/use, and deep contract. | **Only partial:** labels, scan flow and multiple instruments/effects are documented; buses, latency, automation, recovery and isolation are unknown [C-020–C-024]. |

Counterevidence searches retained: web search repeatedly returned HTTP 429;
DuckDuckGo required a human image challenge; Google returned an interstitial;
Bing results were irrelevant/AI-generated; a 2024-10-06 archive timed out; two
November archives had transport errors. No access control was bypassed.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | `DOCUMENTED` | High | WavTool, Inc. operated an AI-accelerated browser DAW; the official site now says it is offline. | Public product/current status | S-001, S-003, S-007 | Official pages | No semantic version found. |
| C-002 | `DOCUMENTED` | High | Official archive is operational 2024-10-07 and offline by 2024-12-05. | Shutdown bracket | S-002, S-007, S-008 | Direct snapshot comparison | Does not give exact transition date. |
| C-003 | `UNKNOWN` | High | Exact shutdown date/notice, refund/export grace, project deletion, and post-shutdown retrieval are unknown. | Shutdown operations | S-001, S-002, S-008, S-013 | Official notice/terms inspected; November retrieval failed | Safest discriminator is an authentic official shutdown email/status notice. |
| C-004 | `DOCUMENTED` | High | Suno announced a recent acquisition of WavTool on 2025-06-26, bringing advanced editing technology and the core team into Suno. | Acquisition | S-009, S-011 | Company release triangulated by industry report | Exact close date and terms undisclosed. |
| C-005 | `DOCUMENTED` | High | Suno called Suno Studio the next chapter of DAW evolution using WavTool technology/team. | Successor lineage, 2025 | S-010 | Company release | Does not document WavTool project/account compatibility. |
| C-006 | `DOCUMENTED` | High | WavTool exposed a browser, linear audio/MIDI timeline plus modular Chain Editor and flexible panels. | Last public 2024 product | S-007 | Official product page | Full object schema not official. |
| C-007 | `DOCUMENTED` | High | Project/audio data was cached locally until a named/File→Save cloud save; saved projects were cloud backed up. | 2024 persistence | S-003, S-007 | Official FAQ/homepage | Cache technology, quota and retention unknown. |
| C-008 | `DOCUMENTED` | High | Projects were private by default unless explicitly Remix-shared; URL collaboration/remixing was advertised. | 2024 collaboration | S-003, S-007 | Official pages | Simultaneous co-editing not established. |
| C-009 | `DOCUMENTED` | Medium | FAQ-linked DawVert reads a WavTool ZIP with JSON/media and substantial track/clip/device state. | Export artifact / third-party converter | S-003, S-014 | Official link plus public adapter | Independent, incomplete converter; no round-trip proof. |
| C-010 | `DOCUMENTED` | Medium | Public material described sample-accurate editing, live recording and automatic/manual audio warping. | Last public product | S-007, S-009 | Vendor/acquirer claims | Not independently measured. |
| C-011 | `UNKNOWN` | High | Engine precision, buffers, threads, scheduler, PDC, render/freeze and diagnostics are unknown. | Proprietary engine | S-007, S-009, S-014 | Reviewed broad feature and project evidence | User-editable buffer device does not prove whole engine. |
| C-012 | `DOCUMENTED` | Medium | Converter recognizes audio/MIDI track/clip placements, notes, loops, fades, transpose and warp state. | DawVert adapter at pinned commit | S-014 | Direct public source inspection | Converter interpretation, not official complete schema. |
| C-013 | `DOCUMENTED` | High | MIDI recording/controllers, export, AI suggestion/generation and audio-to-MIDI were documented. | Last public 2024 product | S-003, S-006, S-007 | Official pages | Hardware timing/expressive MIDI unknown. |
| C-014 | `UNKNOWN` | High | Notation, MPE, MIDI 2.0, SysEx and external sync behavior are unknown. | MIDI contract | S-003, S-007, S-014 | No retained source states them | Absence is not proof of exclusion. |
| C-015 | `DOCUMENTED` | Medium | Native cross-track routing, parameter automation, sidechain and multi-I/O were documented; converter reads cables and tempo automation. | Native graph/project artifact | S-007, S-014 | Official feature page plus adapter | External-plugin fidelity not established. |
| C-016 | `DOCUMENTED` | High | WavTool recorded audio/MIDI, imported common audio files and created grid-aligned Quickstart projects. | Last public 2024 product | S-003, S-006, S-007 | Official pages | “Nearly all” is a vendor generalization. |
| C-017 | `DOCUMENTED` | Medium | WavTool had native instruments/effects/samplers, presets, device graphs and user-editable device code. | Last public product / converter | S-007, S-014 | Official inventory plus adapter | API, sandbox and exhaustive inventory unknown. |
| C-018 | `DOCUMENTED` | High | Conductor handled questions/audio/MIDI/transcription/actions; Composer suggested context-aware material; generation, stems and transcription were separate AI functions. | User-facing 2024 AI boundary | S-006, S-007, S-013 | Official pages/terms | Marketing does not prove model quality/safety. |
| C-019 | `UNKNOWN` | High | AI model vendors/versions, inference location, tool permissions, approval/undo, prompt/media retention and provenance are unknown. | Proprietary AI/cloud | S-007, S-012, S-013 | Policies and product copy inspected | Terms disclose broad data use but not system architecture. |
| C-020 | `DOCUMENTED` | High | Separate Bridge app scanned local plugins, passed audio/MIDI, and managed plugin UI windows. | macOS/Windows Bridge, 2024 | S-004 | Official Bridge instructions | IPC and plugin process topology unknown. |
| C-021 | `DOCUMENTED` | High | Official scope was macOS 11+ legacy `VST`, VST3, generic AU; Windows 10+ legacy `VST`, VST3. | All users, 2024-02 | S-005 | Official compatibility statement | `VST`/`AU` generation ambiguity retained. |
| C-022 | `DOCUMENTED` | High | Multiple plugin instruments/effects per project and Rosetta 2 for Intel plugins on M1 were documented. | 2024 Bridge | S-005 | Official announcement | Other architectures/bridging unknown. |
| C-023 | `DOCUMENTED` | Medium | DawVert adapter recognizes Bridge source/I/O metadata and encoded VST2/VST3 state. | Export adapter | S-014 | Direct public source inspection | Not an official guarantee; AU state not covered. |
| C-024 | `UNKNOWN` | High | Full plugin scan/isolation/bus/latency/automation/state/UI/recovery contract and unnamed formats are unknown. | Third-party hosting | S-004, S-005, S-014 | All retained host evidence compared | Format naming cannot fill deep contract. |
| C-025 | `DOCUMENTED` | Medium | June 2024 listed Basic/Indie/Pro; plugin announcement said all users. | Editions, 2024 | S-005, S-015 | Official pages | Archived tier feature grid absent. |
| C-026 | `DOCUMENTED` | High | Policy disclosed account/device/usage collection, U.S. processing, vendors, transaction transfer, deletion requests and no absolute security guarantee. | Policy dated 2024-01-23 | S-012 | Official legal policy | Actual practice not independently audited. |
| C-027 | `DOCUMENTED` | High | Users retained upload copyright but granted broad service/training rights; WavTool assigned its rights, if any, in generated content with caveats. | Terms dated 2024-01-23 | S-013 | Official terms §§7, 10 | Legal effect varies; no legal advice. |
| C-028 | `DOCUMENTED` | High | Terms allowed discontinuation without notice and made users responsible for retaining copies. | Terms dated 2024-01-23 | S-013 | Official terms §15 | Does not prove actual notice/refund behavior. |
| C-029 | `DOCUMENTED` | High | First-party MP3/WAV/MIDI export and linked DawVert full-project conversion were documented. | 2024 portability | S-003, S-014 | Official FAQ plus converter | Post-shutdown access/fidelity unknown. |
| C-030 | `UNKNOWN` | Medium | Recovery/versioning, scaling limits, crash diagnostics, accessibility and localization are unknown. | Product quality/NFR | S-003, S-007, S-013 | Broad sources inspected | No runtime probe or accessibility audit. |
| C-031 | `DOCUMENTED` | High | WavTool recommended computer/mouse/keyboard; plugin Bridge named macOS/Windows only. | Platform scope | S-003, S-004, S-005 | Official pages | Browser/OS matrix and mobile DAW usability incomplete. |
| C-032 | `DOCUMENTED` | High | Service materials were proprietary/revocable; separately licensed third-party components retained their licenses. | Terms dated 2024-01-23 | S-013 | Official terms §§7–9 | No complete component/SBOM list. |
| C-033 | `UNKNOWN` | Medium | Post, video, immersive, batch/mastering and dedicated live workflows are unknown. | Specialized workflows | S-003, S-007 | Product pages inspected | Product focus makes absence plausible, not proven. |
| C-034 | `UNKNOWN` | High | Acquisition consideration, exact close, legal-entity/IP schedule and actual user-data transfer/migration are unknown. | 2024–2025 boundary | S-009–S-013 | Acquisition and policies compared | Transfer permission/technology acquisition do not prove data transfer. |

## 22. Source ledger and adaptive bibliography

All pages were accessed 2026-08-29. Internet Archive content is scoped to the
timestamp in its URL. Search-result text was discovery-only and is not cited as
proof.

### S-001 — Current WavTool homepage

- **Publisher / URL / kind:** WavTool; <https://wavtool.com/>; official current
  service notice.
- **Scope / passage:** current cutoff; “WavTool has gone offline” and product
  taken offline.
- **Claims:** C-001, C-003.
- **Limitations:** no date, portability, data, acquisition, or legal detail.
- **Rationale:** canonical current status, preferable to third-party summaries.

### S-002 — Internet Archive CDX index for `wavtool.com/*`

- **Publisher / URL / kind:** Internet Archive;
  <https://web.archive.org/cdx/search/cdx?url=wavtool.com/*&output=json&filter=statuscode:200&filter=mimetype:text/html&collapse=digest&fl=timestamp,original,statuscode,mimetype,digest&from=2022&to=2025>;
  public archive index.
- **Scope / passage:** timestamp/original/digest rows for homepage, FAQ, Bridge,
  blog, pricing, privacy and terms snapshots.
- **Claims:** C-002, C-003.
- **Limitations:** index metadata does not prove page content; some snapshots
  timed out or had transport errors.
- **Rationale:** lawful provenance and date discovery for otherwise removed pages.

### S-003 — Frequently Asked Questions (2024-07-19 archive)

- **Publisher / URL / kind:** WavTool;
  <https://web.archive.org/web/20240719211821id_/https://wavtool.com/faq>;
  archived official FAQ.
- **Scope / passage:** browser identity; storage/backup; import/export; Remix;
  tiers; ownership; computer recommendation.
- **Claims:** C-001, C-007–C-009, C-013, C-016, C-029, C-031.
- **Limitations:** high-level; “nearly all” formats and “secure” storage are not
  independent qualification.
- **Rationale:** densest official operational/account/portability source.

### S-004 — VST & AU Plugins / WavTool Bridge (2024-07-12 archive)

- **Publisher / URL / kind:** WavTool;
  <https://web.archive.org/web/20240712112921id_/https://wavtool.com/plugin-bridge>;
  archived official setup documentation.
- **Scope / passage:** Mac/Windows downloads; audio/MIDI bridge; plugin windows;
  Library scan/find/drag workflow.
- **Claims:** C-020, C-024, C-031.
- **Limitations:** no generations, isolation, paths, validation or failure model.
- **Rationale:** primary operational evidence for the browser/native boundary.

### S-005 — Browser-based AI-accelerated DAW WavTool announces VST support

- **Publisher / URL / kind:** WavTool, Emilea Teo, 2024-02-19;
  <https://web.archive.org/web/20240417185626id_/https://wavtool.com/blog/press-release-vst-support>;
  archived official announcement.
- **Scope / passage:** macOS 11+ VST/VST3/AU; Windows 10+ VST/VST3; all users;
  Rosetta 2; multiple instruments/effects.
- **Claims:** C-021, C-022, C-025, C-031.
- **Limitations:** vendor compatibility claim; `VST` and `AU` generations
  ambiguous; “full compatibility” not treated as full host-contract proof.
- **Rationale:** only retained primary version/OS/edition matrix.

### S-006 — June 2024 Updates: Get Good Sound Quicker

- **Publisher / URL / kind:** WavTool, Emilea Teo, 2024-06-30;
  <https://web.archive.org/web/20240804042930id_/https://wavtool.com/blog/wavtool-release-notes-june-2024>;
  archived official release note.
- **Scope / passage:** Quickstart, Composer audio accompaniment, Library redesign.
- **Claims:** C-013, C-016, C-018.
- **Limitations:** feature summary, not complete release history.
- **Rationale:** latest retained dated operational release evidence.

### S-007 — WavTool operational homepage (2024-10-07 archive)

- **Publisher / URL / kind:** WavTool;
  <https://web.archive.org/web/20241007105537id_/https://wavtool.com/>;
  archived official product page.
- **Scope / passage:** browser app, timeline/Chain Editor, routing/automation,
  native devices, AI functions, recording, warping, cloud, panels, plugin labels.
- **Claims:** C-001, C-002, C-006–C-008, C-010, C-011, C-013–C-019, C-030,
  C-033.
- **Limitations:** marketing copy and illustrative UI; not a manual or benchmark.
- **Rationale:** latest successfully retrieved operational product overview.

### S-008 — WavTool offline homepage (2024-12-05 archive)

- **Publisher / URL / kind:** WavTool;
  <https://web.archive.org/web/20241205072749id_/https://wavtool.com/>;
  archived official service notice.
- **Scope / passage:** product taken offline and future mission statement.
- **Claims:** C-002, C-003.
- **Limitations:** no exact shutdown/export/data details.
- **Rationale:** earliest successfully retrieved retained proof that the service
  was offline, used with S-007 to bound the transition.

### S-009 — Suno Acquires WavTool

- **Publisher / URL / kind:** Suno via PR Newswire, 2025-06-26;
  <https://www.prnewswire.com/news-releases/suno-acquires-wavtool-to-level-up-capabilities-for-professional-songwriters--producers-302491932.html>;
  official company press release.
- **Scope / passage:** recent acquisition, technology/core team, product and
  engineering leadership, retrospective WavTool capabilities.
- **Claims:** C-004, C-010, C-018, C-034.
- **Limitations:** transaction advocacy; no consideration, close date, data or
  asset schedule.
- **Rationale:** origin of the acquisition claim, preferable to news repetition.

### S-010 — Suno introduces Suno Studio

- **Publisher / URL / kind:** Suno via PR Newswire, 2025-09-25;
  <https://www.prnewswire.com/news-releases/suno-introduces-suno-studio-a-generative-audio-workstation-built-for-all-creatives-from-seasoned-pros-to-aspiring-artists-302567486.html>;
  official successor-product release.
- **Scope / passage:** WavTool technology/team; Suno Studio as next DAW chapter.
- **Claims:** C-005, C-034.
- **Limitations:** Suno Studio marketing; no WavTool migration compatibility.
- **Rationale:** primary evidence for lineage while bounding the successor.

### S-011 — AI music platform Suno acquires WavTool

- **Publisher / URL / kind:** Music Business Worldwide, Mandy Dalugdug,
  2025-06-26;
  <https://www.musicbusinessworldwide.com/ai-music-platform-suno-acquires-wavtool-moving-into-daw-market/>;
  reputable secondary industry report.
- **Scope / passage:** acquisition announcement, team joining, undisclosed terms,
  quotes and technology integration.
- **Claims:** C-004, C-034.
- **Limitations:** substantially reports the company release; not independent
  transaction diligence.
- **Rationale:** triangulates date/undisclosed terms without replacing S-009.

### S-012 — WavTool Privacy Policy

- **Publisher / URL / kind:** WavTool, Inc., dated 2024-01-23;
  <https://web.archive.org/web/20240712112921id_/https://wavtool.com/privacy-policy>;
  archived official legal policy.
- **Scope / passage:** collection/use/disclosure, analytics/vendors, U.S. hosting,
  security, deletion, and merger/asset-transfer clause.
- **Claims:** C-019, C-026, C-034.
- **Limitations:** policy authorization, not audit or proof of actual transfer.
- **Rationale:** primary privacy/data-boundary source.

### S-013 — WavTool Terms of Service

- **Publisher / URL / kind:** WavTool, Inc., updated 2024-01-23;
  <https://web.archive.org/web/20240712112922id_/https://wavtool.com/terms-of-service>;
  archived official legal terms.
- **Scope / passage:** AI/service overview; content rights/licenses; ML/generative
  AI use; proprietary materials/third-party components; termination/discontinuance
  and copy-retention responsibility.
- **Claims:** C-018, C-019, C-027, C-028, C-030, C-032, C-034.
- **Limitations:** contractual allocation, not operational verification or legal
  advice.
- **Rationale:** primary licensing, portability-risk and clean-room boundary.

### S-014 — DawVert WavTool input adapter

- **Publisher / URL / kind:** DawVert / SatyrDiamond, GPL-3.0-or-later, file last
  changed 2024-11-24 at commit `486d0ea42a3fc5f2e63f57ec9f1b4af2e8532452`;
  <https://github.com/DawVert/DawVert/blob/486d0ea42a3fc5f2e63f57ec9f1b4af2e8532452/plugins/input/r_wavtool.py>;
  immutable public third-party source.
- **Scope / passage:** input properties and parser structure for ZIP/JSON/media,
  tracks/clips/warp/devices/cables/native state and Bridge VST2/VST3 state.
- **Claims:** C-009, C-012, C-014, C-015, C-017, C-023, C-024, C-029.
- **Limitations:** independent converter; unsigned commit; fixtures and fidelity
  unqualified; no proof of full/official schema or runtime behavior.
- **Rationale:** official FAQ linked DawVert, and this is the only retained
  inspectable project/state representation; used descriptively, not copied.

### S-015 — WavTool pricing (2024-06-23 archive)

- **Publisher / URL / kind:** WavTool;
  <https://web.archive.org/web/20240623122527id_/https://wavtool.com/pricing>;
  archived official pricing page.
- **Scope / passage:** Basic, Indie, Pro names and prices.
- **Claims:** C-025.
- **Limitations:** client-rendered feature comparison missing; transient sale
  styling makes exact Indie price presentation ambiguous.
- **Rationale:** primary tier identity; retained despite missing feature grid.

## 23. Unknowns and next discriminating probes

| ID / claim | Attempted methods and available evidence | Blocker / impact | Safest next probe | Required access / owner |
| --- | --- | --- | --- | --- |
| U-01 / C-003 — shutdown and portability | Current/archived homepage, CDX, FAQ, terms; October success, December offline, November transport failures | No official shutdown notice/email recovered; high impact on cloud durability lesson | Obtain a publicly posted, authentic WavTool shutdown email/status notice with headers/date, or a vendor statement | Public artifact or vendor response; owner unassigned |
| U-02 / C-003, C-034 — actual cloud data fate | Privacy transfer clause, deletion route, offline notice, Suno acquisition releases compared | Policies allow transfer but do not say whether projects/personal data moved or were deleted | Vendor privacy response or regulator/corporate disclosure identifying retention, controller and migration | Vendor/legal public disclosure; owner unassigned |
| U-03 / C-011 — browser/cloud audio engine | Homepage, acquisition release and project adapter inspected | No public technical manual/source; affects scheduling/PDC/render conclusions | Archived engineering talk or vendor architecture note; otherwise disposable historical fixture with permission | Public talk or lawful vendor fixture; owner unassigned |
| U-04 / C-024 — plugin host contract | Bridge setup, exact OS/format announcement and export-state adapter inspected | No scanner logs, runtime architecture or qualification matrix; high interoperability impact | Vendor Bridge manual/source or later isolated qualification with known VST2/VST3/AU fixtures | Lawful installer/fixture and disposable host; owner unassigned |
| U-05 / C-019 — AI assistant internals | Product AI pages, release notes, privacy and terms inspected | Model/provider, inference, tool permission and retention details proprietary | Archived model card, subprocessor list, AI data-flow/permission document | Public vendor document; owner unassigned |
| U-06 / C-009, C-029 — archive fidelity | FAQ link and immutable DawVert adapter inspected, not executed | Converter coverage is not round-trip or official schema evidence | Compare a lawfully donated exported project with rendered stems/MIDI in a disposable converter harness | User-owned project fixture with consent; owner unassigned |
| U-07 / C-030, C-031 — mobile/accessibility/reliability | FAQ/platform pages and terms inspected | Service offline; no conformance report or current app | Archived accessibility statement/manual or later historical recording with permission | Public report/fixture; owner unassigned |
| U-08 / C-034 — acquisition structure | Suno releases plus MBW triangulation | “Recent acquisition” lacks close date, entities, assets, consideration | Public transaction filing or authoritative joint disclosure | Corporate filing/vendor disclosure; owner unassigned |

## 24. Curiosity pass and stop decision

### Ranked follow-ups after first synthesis

Scores are 0–5; cost is reversed (5 = cheap).

| Thread | Decision relevance | Expected value | Novelty | Cost | Total | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Official-linked DawVert project adapter | 5 | 4 | 5 | 3 | 17 | **Pursued**; exposed portable archive/state structure [C-009, C-023]. |
| Official pricing/tier archive | 3 | 4 | 3 | 5 | 15 | Pursued after project thread; tier names recovered, limits blocked [C-025]. |
| Founder employment profiles | 4 | 3 | 3 | 2 | 12 | `CURIOSITY_NO_GO`; Suno already documents team movement. |
| Corporate registry/transaction price | 4 | 2 | 4 | 1 | 11 | `CURIOSITY_NO_GO`; low architecture value and terms undisclosed. |
| More release-note inventory | 3 | 3 | 3 | 3 | 12 | `CURIOSITY_NO_GO`; leading architecture claims already saturated. |
| Additional shutdown snapshots | 3 | 2 | 2 | 4 | 11 | Initially pursued to a bracket, then `CURIOSITY_NO_GO` after repeated failures. |

### Stop decision

**STOP — sufficient coverage and saturation.** Every required heading and format
row is populated; the product, plugin, persistence, AI, shutdown, acquisition,
privacy and licensing boundaries have primary evidence or explicit unknowns.
Another source pass is unlikely to alter the leading architecture conclusions.
Search rate limits/challenges and archive failures were retained, not bypassed;
repeated retrieval now has nonpositive marginal evidence. Remaining questions
require a vendor disclosure or lawful historical fixture rather than broader web
searching.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Read-only status was captured
  before creation and will be checked after; all other changes were pre-existing.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive
  sections cite C-IDs; the register classifies each claim.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.**
- [x] **Every required plugin-format row is present.** All 13 contract rows are
  populated without blanks.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Discovery, runtime, processing, state and UI/recovery are separated.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  No runtime `OBSERVED` claim is made; converter and marketing limits are explicit.
- [x] **Licensing and clean-room boundaries are explicit.**
- [x] **Bibliography records source rationale and limitations.** S-001–S-015.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.**
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** No installers/plugins were fetched or run; public source was
  summarized, not reproduced.

**Owned path:** `research/daw-landscape/dossiers/wavtool.md`
**Checks performed:** governing-file review; ≤2-source evidence passes with
intermediate synthesis; focused heading/matrix/claim/source/unknown audit returned
`STRUCTURE_OK`; read-only Git status; no stage/commit. The repository-wide
validator also ran read-only but exits nonzero on a pre-existing sibling dossier
(`nch-mixpad.md`) missing sections 21–25; WavTool's focused result is unaffected.
**Concise result:** `COMPLETE_WITH_UNKNOWNS`; 15 retained sources, 34 registered
claims, 13 required plugin rows.
**Unresolved blockers:** exact shutdown/data handling; cloud/audio/AI internals;
full Bridge host contract; export round-trip fidelity; acquisition structure.
**Pre-existing workspace changes:** numerous modified/untracked files were present
outside this owned path and were left untouched.
