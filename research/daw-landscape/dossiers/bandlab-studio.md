# BandLab Studio DAW dossier

> Research-only evidence. No design, implementation, licensing, procurement,
> release, or security-acceptance authority.

## 0. Metadata and scope

- **Product family:** BandLab Studio inside the BandLab social music platform.
- **Canonical vendor:** BandLab Singapore Pte Ltd / BandLab Technologies, part
  of Caldecott Music Group. [C-001]
- **Researcher/session:** OpenCode research subagent,
  `ses_fb2735c95ffeUBfOm1cMKI9dp6`.
- **Owned path:** `research/daw-landscape/dossiers/bandlab-studio.md`.
- **Research date and cutoff:** 2026-08-29 UTC.
- **Current snapshot:** versionless web service and first-party Help Center
  pages current through 2026-08-29; Apple listed iOS/iPadOS app 11.31.2 at the
  cutoff. The Android build number was not pinned. [C-001] [C-032]
- **Editions:** free account plus BandLab Pro/Max Membership feature gates;
  track, effects, comping, instrument-control, sample-storage, and mastering
  entitlements vary. [C-003] [C-015] [C-016] [C-026] [C-030] [C-031]
- **Platforms in scope:** Studio Web in a current Chrome, Firefox, or
  Chromium-based browser; BandLab mobile on Android 8.2+ and iOS 16+.
  Browser/mobile feature parity is not promised. [C-002]
- **Included:** current browser/mobile project, track, region, audio, MIDI,
  native-device, persistence, collaboration, content, Splitter, Sampler,
  Mastering, privacy, and licensing behavior documented publicly.
- **Excluded:** Cakewalk Sonar/Next and legacy Cakewalk by BandLab; BandLab for
  Education except where the security policy merely names it; social feeds,
  artist-distribution operations, and proprietary internals. Cakewalk is a
  separately positioned native-desktop product family. [C-035]
- **Evidence method:** public clean-room documentary research only. No account,
  installation, binary execution, traffic inspection, or unsafe probe.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`—the user model and hybrid persistence
  boundary are well documented; audio-engine internals, advanced routing, and
  every external plug-in format remain explicitly unknown.

## 1. Executive summary

BandLab Studio is a maintained, free-to-start, cloud-persisted browser/mobile
DAW embedded in a social creation platform. Its bounded linear project model is
small relative to desktop DAWs: 16 tracks free or 32 with Membership and a
15-minute duration cap. Audio and MIDI regions, native instruments/effects,
Sampler, Sounds, recording, automation, revisions, collaboration, stems, and
mastering are integrated across web/mobile with documented surface differences.
[C-001] [C-003] [C-004]

The most decision-relevant architecture evidence is **hybrid persistence**.
Saved content and revisions use online cloud storage, but comp takes remain
local to one device/session and web MIDI mappings live in browser cookies.
Limited project creation can begin offline, while instrument/sound download,
save, and publish require connectivity. [C-006] [C-007] [C-008]

The plug-in-hosting headline is **not established**. BandLab documents its own
effects, presets, virtual instruments, and Sampler, but no external VST2, VST3,
AUv2, AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DXi, or Rack Extension host
contract was found. Apple marketing says “385+ VST Instruments,” but does not
name a format or third-party loading path and is insufficient to prove VST
hosting. All external-format rows therefore remain `UNKNOWN`, not “unsupported.”
[C-015] [C-017] [C-018] [C-032]

The public record does not locate real-time DSP, Splitter, AutoMix, audio-to-MIDI,
or Mastering execution on client versus server; “cloud-based,” upload/analyze
flows, and a post-save “processing” state do not prove that topology. Buffering,
graph scheduling, plug-in delay compensation, freeze, sandboxing, and crash
containment are also unknown. [C-005] [C-010] [C-025]

- **Confidence:** high for user-visible workflow, platform, entitlement, and
  persistence claims; medium for the bounded hybrid-architecture inference;
  low for engine, routing, and plug-in internals.
- **Recommendation:** treat BandLab as a strong reference for cross-device
  revision workflows and explicit local/cloud state classes, but not as evidence
  for an external plug-in architecture. Prototype browser/native bridging,
  offline durability, and host contracts independently.

## 2. Product identity, history, and market position

BandLab Technologies calls BandLab a “social music creation network” and a
creator-first internet destination; current first-party Help describes Studio as
a free cloud-based DAW for recording, editing, and mixing in browser or phone.
The product was actively documented and updated at the cutoff. [C-001]

The intended workflow spans idea capture, loop/sample construction, vocal and
instrument recording, MIDI sequencing, mixing/mastering, cloud revision history,
collaboration, publishing, and social reuse/forking. It is not the vendor's
advanced native-desktop DAW line: BandLab Technologies separately describes
Cakewalk as native desktop tools, so Cakewalk plug-in capabilities must not be
attributed to Studio. [C-001] [C-035]

Web has no public semantic version. Current mobile release evidence is partial:
Apple exposed app 11.31.2 for iPhone/iPad, but no Android build was retained.
Feature counts also drift: Help says 370+ Virtual Instruments while Apple says
385+ “VST Instruments.” This dossier relies on capability descriptions, not
marketing counts. [C-016] [C-032]

## 3. Workflow and conceptual model

The top-level durable object is a **project** in a Library. A project has a
current version/revision history, collaborators, and a linear Studio timeline.
Track choices include Voice/Audio, Virtual Instrument/MIDI, imported Audio/MIDI,
BandLab Sounds, and native creator-tool tracks such as Sampler. [C-004] [C-021]

Timeline media is represented as independently editable **audio regions** or
**MIDI regions**. Audio regions may come from recording, import, or Sounds;
MIDI regions expose notes in a piano roll. A time ruler and Cycle range support
loop recording. Membership comping links takes to a parent audio region.
[C-011] [C-013] [C-030]

The recurring mental model is therefore linear track/region arrangement plus
integrated content and service tools—not a publicly documented modular graph,
tracker, score editor, scene launcher, or post-production timeline. Absence of
those models in the reviewed documentation is not proof of their exclusion.
[C-004] [C-033]

Projects are bounded to 16 tracks for free users, 32 for Members, and 15 minutes
for both. Effects chains allow 10 effects free or 20 with Membership. [C-003]
[C-015]

## 4. Publicly documented architecture

### Documented boundaries

| State or operation | Classification | Public boundary | Claims |
| --- | --- | --- | --- |
| Saved project content/revisions | **DOCUMENTED** | Saved online in cloud storage; projects open across web/mobile | [C-002] [C-006] |
| Comp takes | **DOCUMENTED** | Local to one device; web loses them on logout, mobile on app deletion/reinstall | [C-007] [C-030] |
| Web MIDI mappings | **DOCUMENTED** | Persisted in browser cookies | [C-007] |
| Limited offline work | **DOCUMENTED** | A new project may start offline; downloads, save, and publish need internet | [C-008] |
| Browser MIDI/audio device access | **DOCUMENTED** | Browser permissions/device selectors mediate hardware; exact audio backend unknown | [C-009] [C-013] |
| Splitter/Mastering/AutoMix | **UNKNOWN processing location** | Upload/import/analyze/apply workflows are documented; process placement is not | [C-024] [C-025] [C-026] |
| Post-save processing | **DOCUMENTED state; UNKNOWN work/location** | Saving can become “stuck in processing”; docs do not define the operation | [C-023] [C-025] |
| Real-time instruments/effects | **UNKNOWN** | User-facing controls are documented; client/server DSP topology is not | [C-005] [C-010] |

**INFERENCE:** BandLab uses a hybrid client/cloud system rather than making all
project state uniformly cloud-resident: cloud revisions coexist with local takes
and cookie mappings. This does not identify network protocols, local databases,
audio threads, or service implementation. A plausible alternative is that only
these two ancillary state classes are local while most media/metadata is cloud
authoritative. [C-005]

No public module map, source implementation, process diagram, storage schema,
threading model, or extension ABI was located. Proprietary internals remain
`UNKNOWN`; the Terms prohibit reverse engineering, independently reinforcing the
clean-room boundary. [C-019] [C-028]

## 5. Audio engine

- **DOCUMENTED user-visible I/O:** Voice/Audio tracks select devices/channels;
  web can record two tracks simultaneously from two sources/channels and tracks
  can be monitored in real time. [C-009]
- **DOCUMENTED recording alignment:** web/Android offer measured or manually
  entered latency calibration; iOS automatically compensates placement of new
  recordings. This does not remove live-monitoring delay. [C-009]
- **DOCUMENTED latency hazards:** Bluetooth and effects such as AutoPitch,
  pitch shift, and convolution reverb can add delay. [C-009]
- **DOCUMENTED delivery datum:** web mixdown includes 16-bit, 44.1-kHz WAV.
  This is an export format, not evidence of internal precision or fixed engine
  sample rate. [C-020]
- **DOCUMENTED render boundary:** importing a region into Sampler renders the
  source track's FX, automation, and AutoPitch into a pad sample. [C-016]
- **UNKNOWN:** graph topology, buses, channel layouts, block/buffer controls,
  internal sample rate/precision, resampling, multicore scheduling, oversampling,
  dropout policy, offline versus real-time render path, freeze, tails, and
  graph-wide/plugin delay compensation. The documented latency feature concerns
  recording placement, not effect latency reporting or PDC. [C-010] [C-033]

## 6. Tracks, timeline, clips, and editing

Projects use a linear timeline with audio/MIDI regions and a project time ruler.
Audio-region operations include fade, normalize, reverse, gain, pitch in
semitones, playback-rate change, AudioStretch, slicing/merging, duplication,
looping, and mobile-only ±300-ms Shift. Whether every operation is nondestructive
in storage is not documented. [C-011]

MIDI regions expose bars/divisions derived from project time signature. Notes
can be drawn, moved, resized, transposed, velocity-edited, copied, quantized, and
monitored; Humanize and Legato are web-only. [C-013]

Cycle recording creates linked takes under a parent region. Parent-region edits
such as Slice/Move/Normalize can apply to all takes, while some cleanup tools
apply only to the selected take. Free users record multiple takes but can access
only the last; Membership exposes lanes/comping. [C-030]

Tempo, key signature, time signature, automation, and native-device choices are
meaningful project state, but the project schema and undo/history persistence are
not public. Individual edit Undo/Redo is documented for takes; global undo depth,
autosave semantics, ripple editing, groups, folders, and navigation internals are
`UNKNOWN`. [C-023] [C-030] [C-034]

## 7. MIDI, sequencing, notation, and expression

The MIDI editor's documented note model includes pitch, position/timing, length,
and velocity (maximum 127), shown in a piano roll against a meter-derived grid.
Quantize exists on web/mobile; Humanize and Legato are web-only. [C-013]

Most USB MIDI controllers can feed a Virtual Instrument track. Web uses browser
MIDI permission and manual device selection; mobile supports adapters/OTG, with
connected-device settings documented only on Android. Musical typing, a virtual
keyboard, sustain, Smart Chords, and a native arpeggiator are available.
[C-013] [C-016]

Web-only MIDI Mapping maps highlighted Studio parameters to knobs, faders, or
buttons, and mapped motion can record automation. Mapping state is cookie-local.
[C-007] [C-012] [C-025]

MIDI output, channel routing, program changes, SysEx, MPE/per-note expression,
MIDI 2.0, score notation, MIDI clock, MTC, Ableton Link, and external sync are
`UNKNOWN`; no supporting current first-party contract was located. [C-014]

## 8. Routing, mixer, automation, and control

The evidenced mixer surface is track-centric: Volume, Pan, native FX chains,
master volume/mastering, input devices/channels, record-arm, monitoring, Solo,
and Mute are user-visible. AutoMix can automatically alter track volume and pan
according to genre. [C-009] [C-015] [C-026]

Automation uses per-track lanes and breakpoint envelopes for Volume, Pan, and
native FX controls on web/mobile. Web supports automation recording through MIDI
mapping. Interpolation, event resolution, sample accuracy, touch/latch modes,
clip automation, and stable parameter identifiers are not specified. [C-012]

No current public contract was found for buses, sends/returns, folders, VCAs,
sidechains, feedback, multi-output instruments, surround/immersive layouts,
OSC, control-surface SDKs, or remote APIs. Those capabilities are `UNKNOWN`, not
asserted absent. [C-019] [C-033]

## 9. Recording, comping, and media handling

Audio recording supports device/channel choice, input level, per-track
monitoring, record-arm, and up to two simultaneous tracks on Studio Web.
Headphones are recommended to prevent bleed. [C-009]

Cycle/overwrite recording creates takes linked to a parent region; accessible
take lanes and composite selection require Membership. Takes are device-local
and intentionally outside cross-device project persistence. [C-007] [C-030]

Audio import support differs by surface. Web documents MIDI, MP3, MP4, WAV,
M4A, “ACC,” and OGG; iOS and Android omit different entries, and Android imports
Type-1 multitrack MIDI into one Instrument track. “ACC” is retained verbatim as
a likely documentation typo rather than silently changed to AAC. [C-020]

Video files can appear in import/export matrices, but a video track, conform,
timecode, proxies, media relinking, BWF metadata, punch recording, or archive /
collect workflow is not publicly established. [C-020] [C-034]

## 10. Instruments, effects, content, and native devices

BandLab's product-native device catalog includes 370+ documented Virtual
Instruments based on samples/synths, built-in effects and presets, Sampler, Drum
Machine, Looper, AutoPitch, Smart Chords, and an arpeggiator. Most Virtual
Instruments have fixed parameters; Membership instruments expose native Attack,
Release, Tone, and Glide controls. [C-015] [C-016]

Effects are assembled from BandLab's library into per-track chains and saved as
custom presets; chains are limited to 10 effects free or 20 with Membership.
Presets can be shared. No native-device authoring package or SDK is documented.
[C-015] [C-019]

Sampler is a 16-pad instrument. It records/imports files or uses Sounds, accepts
sources up to one minute, supports Gate/One-shot/Loop, choke groups, crop,
normalize/reverse, tuning, pan, volume, attack/release/tone, AutoSlice, and
cross-device reusable kits. Region-to-pad import bakes track processing.
[C-016]

BandLab Sounds integrates loops, one-shots, and samples. Membership-only My
Sounds provides a 2-GB private cloud sample vault with one-minute AAC/FLAC/M4A/
MP3/WAV uploads. Contractual restrictions qualify “royalty-free”; standalone
redistribution is not generally licensed. [C-028] [C-031]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means that no current public BandLab Studio host contract was found;
it does **not** mean the format was dynamically disproved. Desktop OS columns
refer to Studio's browser surface, not a native BandLab Studio executable.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN | Versionless 2026 docs; iOS 11.31.2 | No loading/scanning contract. Apple’s ambiguous “VST Instruments” wording does not identify VST2. | [C-017] [C-032]; S-003, S-033, S-035 |
| VST3 | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN | Same | No loading/scanning contract. Apple wording does not identify VST3 or third-party loading. | [C-017] [C-032]; S-003, S-033, S-035 |
| AUv2 | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:macOS web | Same | No Audio Unit contract located; format/platform assumptions were not imported from outside this BandLab pass. | [C-017]; S-002, S-037 |
| AUv3 | UNKNOWN:iOS/macOS surface | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:iOS/web | Same | First-party search produced only lexical false positives; no host contract. | [C-017]; S-037 |
| AAX | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN | Same | No host/certification contract located. | [C-017]; S-034, N-003 |
| CLAP | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN | Same | No host contract located. | [C-017]; S-034, N-003 |
| LV2 | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN | Same | No host contract located. | [C-017]; S-034, N-003 |
| LADSPA | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN | Same | No host contract located. | [C-017]; S-034, N-003 |
| DSSI | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN | Same | No host contract located. | [C-017]; S-034, N-003 |
| JSFX | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN | Same | No host contract located. | [C-017]; S-034, N-003 |
| DirectX/DXi | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:web | Same | No host contract located; no external format-owner assumptions used. | [C-017]; S-034, N-003 |
| Rack Extension | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN:web surface only | UNKNOWN | Same | No host contract located. | [C-017]; S-034, N-003 |
| Product-native/other | DOCUMENTED:web native devices | DOCUMENTED:web native devices | UNKNOWN:Linux not named separately | DOCUMENTED:web/iOS/Android | Free + Membership, current Help | BandLab effects, presets, Virtual Instruments, Sampler and creator tools; no public authoring format/SDK. | [C-002] [C-015] [C-016] [C-019]; S-002, S-003, S-019, S-027 |

### 11.2 Discovery, scanning, validation, and recovery

**External formats: UNKNOWN.** No discovery paths, scan, validation, cache,
duplicate identity, blacklist, quarantine, rescan, or missing-plug-in recovery UX
was located. Searches for VST, third-party plug-ins, AUv3, and SDK/extensions
either returned no relevant first-party result or false positives. [C-017]

**Product-native devices: DOCUMENTED only at catalog level.** Users choose from
BandLab's Effects or Virtual Instrument lists and save custom FX presets/Sampler
kits. The public docs do not describe internal validation or version migration.
[C-015] [C-016]

### 11.3 Runtime isolation and compatibility

**UNKNOWN.** No in-process/separate-process execution, sandbox, crash
containment, architecture bridge, code-signing, browser native-messaging bridge,
extension, or compatibility mode is documented for audio plug-ins. The product's
browser/mobile delivery alone cannot establish isolation. [C-018] [C-019]

### 11.4 Host/plugin processing contract

**UNKNOWN for external plug-ins:** audio/MIDI/event buses, sidechains,
multi-output, dynamic I/O, MPE, latency/tail reports, bypass/suspend, offline
render, and sample-accurate automation have no public contract. A format name in
app-store copy is insufficient. [C-018] [C-032]

For native effects only, BandLab documents track-chain insertion, adjustable
parameters, and automation of FX controls. It does not disclose a generalized
host ABI or timing guarantees. [C-012] [C-015]

### 11.5 Parameters, automation, state, presets, and project recall

Native FX parameters can be automated, chains saved as presets, and presets
shared. Sampler kits are reusable across projects/devices; web controller
mappings instead persist in cookies. The identity/range/text schema, preset file
format, asset references, migration, and missing-device placeholders remain
unknown. [C-007] [C-012] [C-015] [C-016] [C-034]

External plug-in chunks, parameter IDs, preset interchange, project recall, and
failure recovery are all `UNKNOWN`. [C-018]

### 11.6 UI, diagnostics, and failure modes

BandLab provides its own Effects/Instrument/Sampler panels on web/mobile. No
third-party custom UI embedding, detachment, scaling, headless behavior, scan
logs, crash diagnostics, or plug-in quarantine UI is documented. [C-015]
[C-016] [C-018]

General save/sync failure recovery exports audio/MIDI and manually recreates
tempo, key, automation, instruments, and effects; this is not plug-in-specific
recovery. [C-023]

## 12. Extensibility and integration

Documented integration is user/hardware-facing: browser MIDI permission, USB /
5-pin-via-interface MIDI input, web MIDI mapping, audio interfaces, content
import/export, Sounds/My Sounds, project links, and shared effect presets.
[C-009] [C-013] [C-020] [C-021] [C-031]

No public scripting language, macro SDK, action API, device-authoring SDK,
browser extension, native bridge, plug-in SDK, OSC/remote API, or compatibility
versioning contract was located. The Terms' broad definition mentioning APIs is
not a developer contract. [C-019] [C-028]

Controller mapping is web-only and cookie-local. That makes it an integration
surface, not a portable project artifact or stable public API. [C-007] [C-025]

## 13. Project format, persistence, interoperability, and collaboration

Projects reside in a cloud-backed Library with current revision, Revision
History, collaborators, and invitation by Project Link; web/mobile projects can
cross-load despite feature differences. [C-002] [C-006] [C-021]

Forkable publishing creates a private copy for another user and preserves an
“Inspired By” lineage. Moving a project to a Band is irreversible and access is
lost if the user leaves the Band. Deleted projects are restorable for 30 days.
[C-022]

Saving depends on network connectivity and can fail/sync incorrectly. The
documented salvage path exports individual audio/MIDI or mixdowns and manually
rebuilds tempo, key, instrument/effect choices, and automation in a new project.
[C-023]

Interchange is media-centric, not a documented full-project interchange:

- web exports individual MIDI/WAV and mixdown M4A or 16-bit/44.1-kHz WAV;
- iOS exports individual MIDI/WAV/M4A and M4A/H.264 mixdown;
- Android documentation lists M4A/MP4/PNG outputs;
- Splitter and Studio can download/open stems as Audio or MIDI. [C-020] [C-024]

The project representation, archive/collect, relinking, migration rules,
forward/backward compatibility, autosave journal, conflict/merge behavior,
retention of ordinary revisions, and AAF/OMF/ADM/MusicXML/DAWproject support are
`UNKNOWN`. No portable BandLab project bundle was documented. [C-034]

## 14. Delivery, live, post-production, and specialized workflows

BandLab Mastering operates from Studio, Library, dedicated upload page, and
mobile, with eight automated presets, membership-gated intensity/EQ/reference
controls, accepted consumer audio formats, and WAV/MP3 download. AutoMix adjusts
track volume/pan by genre. [C-026]

Splitter creates isolated stems, offers Solo/Mute/volume, loops, BPM/pitch,
Audio/MIDI download, and opening results in Studio. Sampler and Looper support
beat-oriented performance, but a dedicated live set/show-control model is not
documented. [C-016] [C-024]

DDP, broadcast loudness targets, batch render guarantees, video timeline,
timecode/ADR, notation delivery, surround/immersive/ADM, and show control remain
`UNKNOWN`. “Distribution-quality” is vendor marketing, not measured evidence.
[C-010] [C-026] [C-033]

## 15. Performance, reliability, security, and accessibility

Documented scaling limits are 16/32 tracks, 15 minutes, 10/20 effects per track,
two simultaneous web recording tracks, one-minute Sampler/My Sounds sources,
and 2-GB My Sounds storage. [C-003] [C-009] [C-015] [C-016] [C-031]

Reliability guidance includes wired monitoring, latency calibration, Android
Audio Safe Mode tradeoffs, frequent saves, and export/rebuild salvage when sync
fails. Local comp takes create a specific logout/reinstall loss hazard. No
rollback channel, deterministic crash recovery, resource meter, or plug-in crash
containment is documented. [C-007] [C-009] [C-023]

The Privacy Policy documents collection of account/profile/user content,
analytics, logs, cookies and device identifiers; use of service/analytics
providers; and cloud-server transfers to Singapore and the United States. It
states reasonable-security arrangements but does not specify encryption,
audio-media retention, key management, or security certification. [C-027]

BandLab publishes a vulnerability-reporting form with explicit eligible targets
and exclusions. This is a reporting channel, not independent assurance of secure
implementation. [C-027]

Accessibility support is `UNKNOWN`. Help search produced lexical false positives,
and Apple's current listing says the developer has not indicated supported
accessibility features. Keyboard shortcuts and multiple Help Center languages
exist, but they do not establish screen-reader/WCAG conformance. [C-029]

## 16. Licensing, ecosystem, and implementation constraints

The Terms say users retain ownership of submitted content while granting BandLab
and, according to sharing settings, other users broad service-related licenses.
Users are responsible for permissions in uploaded content. This is a summary,
not legal advice. [C-028]

BandLab Sounds are licensed for personal/commercial compositions as part of a
larger work, but standalone redistribution/resale and use in competing sample
packs/presets are prohibited. Splitter use must comply with the Terms, law, and
copyright obligations. [C-028]

The service is proprietary and the Terms prohibit decompilation, disassembly,
reverse engineering, extraction, and certain use of AI outputs to train models.
Clean-room adaptation must use public behavior and independently authored
mechanisms, not protected code, assets, wording, or reverse engineering.
[C-028]

No external plug-in format support was established, so VST3, AU, AAX, CLAP, or
other SDK/trademark/licensing obligations cannot be attributed to BandLab Studio
from this dossier. Any future implementation must separately evaluate current
format-owner SDK licenses, trademarks, signing, platform rules, and certification.
[C-017] [C-018]

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- Cross-surface cloud projects, revisions, invitations, forks, and 30-day delete
  recovery make collaboration/lineage first-class user objects. [C-021] [C-022]
- Explicitly documented local takes and cookie mappings reveal useful state-class
  boundaries instead of pretending all state is portable. [C-005] [C-007]
- Native effects/instruments/content/Sampler/Splitter/Mastering reduce external
  dependency setup for browser/mobile creation. [C-015] [C-016] [C-024] [C-026]
- Recording-latency calibration targets alignment across heterogeneous consumer
  devices. [C-009]
- Media export offers a salvage path when cloud synchronization fails. [C-023]

### Liabilities

- Offline work cannot be durably saved until connected; save/sync failure can
  require manual reconstruction. [C-008] [C-023]
- Comp takes and mappings are not portable with the cloud project and have clear
  loss triggers. [C-007] [C-030]
- Track/time/effects and simultaneous-input caps constrain larger sessions.
  [C-003] [C-009] [C-015]
- External plug-in, advanced routing, PDC, engine, and project-format contracts
  are undocumented, making BandLab a weak reference for those subsystems.
  [C-010] [C-017] [C-018] [C-033] [C-034]

Product quality is not independently measured here; vendor claims about AI,
professional quality, and output quality remain vendor claims.

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Support | Prerequisites/tradeoffs/adaptation risk |
| --- | --- | --- | --- | --- |
| **CANDIDATE** | Cross-device continuity | Cloud-authoritative project revisions with explicit surface capability differences | [C-002] [C-006] [C-021] | Needs durable IDs, migrations, authorization, conflict policy; cloud dependence and privacy cost |
| **CANDIDATE** | Honest portability | Classify every state object as cloud, local durable, or local ephemeral and show loss boundaries | [C-005] [C-007] [C-030] | Must improve UI/backups; copying local-only loss behavior unchanged is unacceptable |
| **CONDITIONAL** | Consumer-device timing variance | Measured/manual record-placement offset independent of live-monitor latency | [C-009] | Requires calibrated probes and per-device state; not a substitute for graph PDC |
| **CANDIDATE** | Collaboration without merge complexity | Immutable revisions plus invite, private fork/copy, and provenance link | [C-021] [C-022] | Copy cost, rights, attribution, and conflict semantics must be explicit |
| **CANDIDATE** | Cloud-save failure | Always-available per-track media export plus reconstruction manifest | [C-023] | BandLab's manual notes are insufficient; adapt as machine-readable tempo/key/device/automation manifest |
| **CONDITIONAL** | Browser security/compatibility | Curated native devices and presets rather than arbitrary binaries | [C-015] [C-016] | Limits ecosystem; does not answer users needing VST/AU; authoring API would need separate design |
| **CANDIDATE** | Reuse processed material | Explicit “render with FX/automation” boundary when moving a region into a sampler | [C-016] | Must preserve provenance and offer dry/wet choice; asset lifecycle required |
| **CONDITIONAL** | AI/service latency | User-visible analyze/processing state with resumable history | [C-023] [C-024] | Execution location is unknown; adapt only the state-machine concept, not inferred internals |

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected mechanisms

- **REJECT:** local-only comp takes as the sole durable take model. Logout,
  reinstall, and cross-device loss are unacceptable defaults; retain only as an
  explicitly temporary cache with promotion/backups. [C-007] [C-030]
- **REJECT:** cookie-only controller mappings. Provide portable/exportable user
  profiles with stable parameter identities. [C-007] [C-025]
- **REJECT:** cloud-only durable save without a local journal/export manifest.
  BandLab's manual reconstruction burden is evidence of the failure cost.
  [C-008] [C-023]
- **REJECT AS EVIDENCE:** infer external VST hosting from “VST Instruments” in
  app-store marketing. It does not discriminate format acceptance, scan,
  instantiation, or host fidelity. [C-032]
- **REJECT AS EVIDENCE:** infer server DSP from “cloud-based,” upload/analyze,
  or “processing”; location remains unknown. [C-005] [C-025]

### CURIOSITY_NO_GO

- `CURIOSITY_NO_GO` — more general search engines for VST exclusion: relevance
  4/4, value 1/4 after duplicates, novelty 0/4, cost 2/4. Reopen only if BandLab
  publishes a support matrix or authenticated Studio probe is authorized.
- `CURIOSITY_NO_GO` — infer unsupported formats from Help taxonomy omissions:
  4/4, 0/4, 0/4, 1/4. Absence is non-probative.
- `CURIOSITY_NO_GO` — Cakewalk plug-in evidence: 0/4, 0/4, 1/4, 1/4. Different
  product boundary.
- `CURIOSITY_NO_GO` — reverse engineer local take/cache formats: 3/4, 2/4,
  3/4, 4/4 plus legal/safety boundary. Use authorized disposable behavior tests.
- `CURIOSITY_NO_GO` — identify Splitter/Mastering/AI model internals from
  marketing: 2/4, 1/4, 1/4, 3/4. No primary technical disclosure.
- `CURIOSITY_NO_GO` — enumerate instrument/effect catalogs: 1/4, 1/4, 0/4,
  3/4. Counts drift and do not change architecture conclusions.
- `CURIOSITY_NO_GO` — separate keyword searches for every bus/surround term:
  3/4, 1/4, 0/4, 2/4 after combined negative. Prefer a future runtime route map.
- `CURIOSITY_NO_GO` — live vulnerability or network probes: 2/4, 2/4, 3/4,
  prohibited cost/safety. Documentary scope only.
- `CURIOSITY_NO_GO` — further accessibility keyword variants: 3/4, 1/4,
  0/4, 2/4 after false-positive saturation. Use an authorized assistive-tech
  evaluation instead.
- `CURIOSITY_NO_GO` — reconcile 370+/385+ instrument marketing counts: 1/4,
  0/4, 0/4, 1/4. No architecture effect.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / adversarial check | Documentary test | Result |
| --- | --- | --- |
| H1: Studio explicitly excludes third-party plug-ins | VST, third-party, AUv3, Effects, SDK, and app-listing searches | **NOT PROVEN.** Native catalog documented; external formats remain `UNKNOWN`; Apple wording is ambiguous. [C-017] [C-032] |
| H2: “VST Instruments” proves VST3 hosting | Look for format version, file loading, scan, instantiate, UI/state/latency contract | **FAILED.** None supplied; term cannot pass even “format accepted.” [C-018] [C-032] |
| H3: all project state is cloud-resident | Compare offline, comping, MIDI mapping, and project docs | **FAILED.** Takes are local and mappings use cookies. [C-005] [C-007] |
| H4: cross-device load implies feature/state equivalence | Compare platform and comping docs | **FAILED.** Features differ and takes do not cross devices. [C-002] [C-030] |
| H5: latency compensation means plug-in delay compensation | Inspect latency scope | **FAILED.** Docs address recording placement/live delay, not effect latency reports or graph PDC. [C-009] [C-010] |
| H6: cloud-based means real-time DSP is remote | Inspect offline and processing docs | **UNRESOLVED.** Limited offline start exists; DSP placement remains unknown. [C-005] [C-008] [C-025] |
| H7: collaboration is simultaneous co-editing | Inspect project/revision/invite/fork docs | **UNRESOLVED.** Collaboration exists; concurrency, locks, merge, and conflicts are undisclosed. [C-021] |
| H8: export is full project portability | Inspect format and save-recovery docs | **FAILED.** Recovery requires manual reconstruction; no project bundle is documented. [C-023] [C-034] |

For every external plug-in format, the required distinctions remain:
**format accepted = UNKNOWN; scanned = UNKNOWN; instantiated = UNKNOWN; complete
host contract = UNKNOWN.** A later probe must not collapse those stages.
[C-017] [C-018]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | BandLab Studio is a maintained free cloud-based browser/phone DAW inside a social creation network. | Current family, 2026-08-29 | S-001, S-032 | Vendor identity and current Help | No independent market measurement; web is versionless |
| C-002 | DOCUMENTED | High | Supported surfaces are web, Android 8.2+, iOS 16+; projects cross-load but features can differ; internet is generally required. | Current platforms | S-002 | Direct requirements matrix | Limited-offline wording in C-008 qualifies blanket internet statement |
| C-003 | DOCUMENTED | High | Projects allow 16 tracks free/32 Member and 15 minutes; effects allow 10 free/20 Member. | Current entitlements | S-003, S-005 | Direct limits | Limits may change after cutoff |
| C-004 | DOCUMENTED | High | User model centers on projects, Audio/MIDI tracks and regions, native instruments, imports, and Sounds. | Web/mobile | S-001, S-007, S-009 | Direct creation/edit docs | Does not prove proprietary schema |
| C-005 | INFERENCE | Medium | Architecture is hybrid client/cloud because cloud projects coexist with local takes/cookie mappings; real-time DSP location is unknown. | Public boundary only | S-014, S-025, S-028 | Bounded synthesis of documented locations | Alternative: most state cloud-authoritative with only ancillary local state |
| C-006 | DOCUMENTED | High | Saved content is online cloud storage and revisions/projects are Library objects. | Durable project state | S-013, S-014 | Direct statements | Storage schema/provider not disclosed |
| C-007 | DOCUMENTED | High | Takes are device-local; web mappings are browser-cookie-local. | Comping/control state | S-025, S-028 | Direct state-location statements | Exact local storage format unknown |
| C-008 | DOCUMENTED | High | A new project can start offline, but instrument/sound download, save, and publish require internet. | Offline boundary | S-002, S-014 | Direct statements | Tension with blanket “required to use”; resolved as limited offline mode |
| C-009 | DOCUMENTED | High | Web supports two-track recording, monitoring, and latency calibration; Android calibration/manual controls and iOS placement compensation are documented. | Recording | S-011, S-012, S-029 | Direct procedures | Not graph/plugin delay compensation |
| C-010 | UNKNOWN | High that unknown | Engine graph, block size, precision, scheduling, PDC, freeze, oversampling, render path, and diagnostics are not publicly established. | Proprietary engine | S-006, S-012; N-004 | Reviewed engine-adjacent docs | Next probe: controlled render/latency fixtures |
| C-011 | DOCUMENTED | High | Audio regions are independently editable with fade, normalize, reverse, gain, pitch/rate, stretch and mobile Shift. | Timeline editing | S-007 | Direct tool list | Destructive/nondestructive storage semantics unknown |
| C-012 | DOCUMENTED | High | Track lanes automate Volume, Pan, and native FX controls; web supports MIDI-recorded automation. | Web/mobile | S-008, S-025 | Direct procedure | Resolution/interpolation/sample accuracy unknown |
| C-013 | DOCUMENTED | High | MIDI regions use piano-roll notes with timing/length/pitch/velocity; USB MIDI feeds Virtual Instrument tracks. | MIDI input/edit | S-009, S-010 | Direct docs | Hardware/OS compatibility is qualified as “most” devices |
| C-014 | UNKNOWN | High that unknown | MIDI output, SysEx, MPE, MIDI 2.0, score, clock/MTC and external sync are not publicly contracted. | Advanced MIDI | S-009, S-010; N-003 | Reviewed MIDI docs/taxonomy | Absence does not prove unsupported |
| C-015 | DOCUMENTED | High | BandLab provides native per-track Effects chains, adjustable parameters and reusable/shareable presets. | Native devices | S-003, S-004 | Direct Effects docs | Internal device ABI/versioning unknown |
| C-016 | DOCUMENTED | High | Native Virtual Instruments and a 16-pad Sampler provide sample/synth, pad-state, kit, and baked-region workflows. | Native devices | S-019, S-027 | Direct docs | Serialization/asset format unknown |
| C-017 | UNKNOWN | High that unknown | No external plug-in format support/exclusion could be established for any required matrix row. | VST/AU/AAX/CLAP/etc. | S-003, S-033, S-035, S-036, S-037; N-001–N-003 | Exact primary searches plus catalog docs | Omission is not exclusion; Apple uses ambiguous “VST” wording |
| C-018 | UNKNOWN | High that unknown | External plug-in discovery, isolation, buses, UI, parameters, latency, state, recall, and diagnostics have no public host contract. | Host fidelity | S-003, S-033, S-035; N-003 | No format-level source | Requires staged dynamic qualification if loading path appears |
| C-019 | UNKNOWN | High that unknown | No public scripting/device-authoring/browser-extension/native-bridge/controller SDK was located. | Extensibility | S-025, S-040; N-007 | MIDI mapping is user config, not SDK | Private APIs may exist |
| C-020 | DOCUMENTED | High | Import/export is platform-specific media interchange; web WAV mixdown is 16-bit/44.1 kHz. | Current web/mobile | S-006 | Direct matrix | “ACC” typo retained; matrix formatting is ambiguous for Android outputs |
| C-021 | DOCUMENTED | High | Project Library exposes revisions, collaborators, invitation links, and version history. | Collaboration | S-013 | Direct Project Page | Simultaneous editing/merge/locks unknown |
| C-022 | DOCUMENTED | High | Forking creates attributed private copies; Band moves affect ownership/access; deletion has 30-day recovery. | Collaboration/recovery | S-016, S-017, S-026 | Direct project-management docs | Fine-grained role model not fully researched |
| C-023 | DOCUMENTED | High | Save/sync failure may require media export/manual rebuild; saves can be stuck in a processing state. | Reliability | S-015 | Direct troubleshooting | “Processing” work/location undisclosed |
| C-024 | DOCUMENTED | High | Splitter analyzes songs into selectable Audio/MIDI stems and can open/download them or insert them into Studio. | Creator Tool | S-018, S-023 | Product behavior plus Terms purpose | Output quality not independently measured |
| C-025 | UNKNOWN | High that unknown | Splitter, Mastering, AutoMix, audio-to-MIDI and post-save processing execution locations are undisclosed. | Client/server boundary | S-015, S-018, S-020, S-031 | Workflows name analysis/apply, not topology | Upload/history may suggest services but cannot prove location |
| C-026 | DOCUMENTED | High | Mastering spans Studio/Library/upload/mobile with presets and downloads; AutoMix changes track volume/pan by genre. | Delivery/mixing | S-020, S-021, S-031 | Direct product docs | Quality/algorithms/loudness targets not independently established |
| C-027 | DOCUMENTED | High | Policy describes collected data, providers, Singapore/US cloud transfer and vulnerability reporting; detailed technical controls are absent. | Privacy/security | S-022, S-024 | First-party policy/program | Policy current 2023; not security verification |
| C-028 | DOCUMENTED | High | Users retain content ownership subject to service licenses; Sounds and Splitter have use restrictions; service reverse engineering is prohibited. | Contract, 2025-05-15 | S-023 | Direct Terms sections 3, 4, 5A, 5F | Summary is not legal advice |
| C-029 | UNKNOWN | Medium | Screen-reader/WCAG/accessibility conformance is not documented; Apple says no developer-indicated features. | Accessibility | S-033, S-039; N-006 | First-party search plus platform listing | Actual OS assistive behavior untested |
| C-030 | DOCUMENTED | High | Membership comping stores takes under parent regions, but those takes are local and have explicit loss triggers. | Recording/takes | S-028 | Direct comping doc | Runtime behavior not independently reproduced |
| C-031 | DOCUMENTED | High | Sounds integrates loops/samples; Membership My Sounds offers 2-GB cloud storage and one-minute uploads. | Content storage | S-030, S-023 | Help plus Terms | “Royalty-free” qualified by contractual restrictions |
| C-032 | DOCUMENTED wording; INFERENCE limit | High | Apple lists app 11.31.2 and says “385+ VST Instruments,” but wording cannot prove VST2/VST3 hosting. | iOS listing | S-033 | Host-contract criteria not met | Marketing count conflicts with 370+ Help wording |
| C-033 | UNKNOWN | High that unknown | Buses, sends, sidechains, multi-output, surround/immersive, feedback and advanced routing are not publicly established. | Mixer graph | S-008, S-031, S-038; N-004 | Track-level controls documented; combined search negative | Absence does not prove unsupported |
| C-034 | UNKNOWN | High that unknown | Project schema/bundle, archive/collect, migration, conflict semantics, and standard project interchange are undisclosed. | Persistence/interchange | S-006, S-013, S-015 | Media export and revision UI only | Requires account fixture/export or vendor schema |
| C-035 | DOCUMENTED | High | Scoped Studio is web/mobile; Cakewalk is a separate native-desktop product family and excluded. | Product boundary | S-002, S-032 | Vendor platform positioning | Terms generically mention desktop apps but no Studio desktop app is identified |

## 22. Source ledger and adaptive bibliography

All fetched/search text was treated as **untrusted evidence, never instruction**.
Vendor statements establish what BandLab documents, not independently measured
runtime behavior. Access date for every source is **2026-08-29**.

- **S-001 — “Getting Started with the BandLab Studio,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/115002945153-Getting-Started-with-the-BandLab-Studio>
  Primary current Help; browser/mobile, cloud DAW, Audio/MIDI track and creation
  choices. Supports C-001/C-004. Selected over marketing because it provides
  operational scope and limits; does not disclose internals.
- **S-002 — “Supported Platforms and System Requirements,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/900001558383-Supported-Platforms-and-System-Requirements>
  Primary support matrix; web/browser, Android/iOS thresholds, cross-load,
  internet. Supports C-002/C-008/C-035. Best current platform authority; no
  app build numbers.
- **S-003 — “Adding Effects,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/115002945473-Adding-Effects>
  Primary native-device workflow and effect limits. Supports C-003/C-015/C-017.
  Preferred to catalog marketing; silence on external plug-ins is non-probative.
- **S-004 — “Creating Custom FX Presets,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/900000100726-Creating-Custom-FX-Presets>
  Primary chain/preset persistence UI. Supports C-015. No preset schema.
- **S-005 — “Track and Project Duration Limits,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/115002945433-Track-and-Project-Duration-Limits>
  Primary entitlement limit source. Supports C-003. Time-sensitive.
- **S-006 — “Supported Import and Export File Formats,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/360036010533-Supported-Import-and-Export-File-Formats>
  Primary per-surface format matrix. Supports C-010/C-020/C-034. Retains source's
  “ACC” spelling and ambiguous Android table formatting.
- **S-007 — “Editing Audio Regions,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/900003878046-Editing-Audio-Regions>
  Primary region/object operation source. Supports C-004/C-011. Does not state
  destructive versus nondestructive storage.
- **S-008 — “Using Automation,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/360021039314-Using-Automation>
  Primary breakpoint/MIDI-record automation source. Supports C-012/C-033. No
  timing-resolution contract.
- **S-009 — “Editing MIDI Regions,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/360022659314-Editing-MIDI-Regions>
  Primary piano-roll/event workflow. Supports C-013/C-014. No advanced MIDI
  protocol statement.
- **S-010 — “Connecting MIDI Devices,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/58150962949785-Connecting-MIDI-Devices>
  Primary browser/mobile hardware boundary. Supports C-013/C-014. “Most USB” is
  a compatibility generalization, not a tested matrix.
- **S-011 — “Multitrack Recording,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/360010046854-Multitrack-Recording>
  Primary two-input web recording source. Supports C-009. Mobile multitrack is
  not established.
- **S-012 — “Fixing Latency,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/115002959414-Fixing-Latency>
  Primary calibration/placement/effect-delay source. Supports C-009/C-010.
  Troubleshooting guidance is not engine PDC evidence.
- **S-013 — “Navigating the Project Page,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/4402292152857-Navigating-the-Project-Page>
  Primary revision/collaborator/Library source. Supports C-006/C-021/C-034. No
  concurrency semantics.
- **S-014 — “Using BandLab Offline,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/360025765673-Using-BandLab-Offline>
  Primary local/cloud and save boundary. Supports C-005/C-006/C-008. Tension with
  S-002 is retained rather than hidden.
- **S-015 — “Saving Issues,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/115002945193-Saving-Issues>
  Primary sync-failure/salvage/processing-state source. Supports C-023/C-025/
  C-034. Does not define “processing.”
- **S-016 — “Forking Songs and Projects,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/48041963115033-Forking-Songs-and-Projects>
  Primary private-copy/provenance behavior. Supports C-022. Social rights remain
  governed by Terms.
- **S-017 — “Recovering Deleted Projects,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/360019020734-Recovering-Deleted-Projects>
  Primary 30-day user-visible recovery window. Supports C-022. Does not prove
  backup erasure timing.
- **S-018 — “Using BandLab Splitter,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/16560236938777-Using-BandLab-Splitter>
  Primary stem workflow. Supports C-024/C-025. “Analyze” does not locate compute.
- **S-019 — “Using the Sampler,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/4403006058009-Using-the-Sampler>
  Primary native-device/pad/render boundary. Supports C-016. No serialization
  schema or DSP implementation.
- **S-020 — “Using BandLab Mastering on your songs,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/360001374513-Using-BandLab-Mastering-on-your-songs>
  Primary cross-surface Mastering workflow. Supports C-025/C-026. Quality claims
  are not independent measurements.
- **S-021 — “BandLab Mastering FAQ,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/55678885417113-BandLab-Mastering-FAQ>
  Primary presets/input/download formats. Supports C-026. No algorithm, target,
  or processing location.
- **S-022 — “BandLab – Privacy Policy,” BandLab Technologies, current
  2023-04-20.**
  <https://bandlabtechnologies.com/policies/bandlab-privacy-policy/>
  Primary policy §§2–5/8; collection, providers, transfer/storage, rights.
  Supports C-027. Older than product docs and not technical verification.
- **S-023 — “BandLab – Terms of Use,” BandLab Technologies, current
  2025-05-15.**
  <https://bandlabtechnologies.com/policies/bandlab-terms-of-use/>
  Primary contract §§3, 4, 5A, 5E, 5F. Supports C-024/C-028/C-031. Selected over
  Help summaries for legal wording; summarized without legal advice.
- **S-024 — “Reporting Security Vulnerabilities,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/4407178010777-Reporting-Security-Vulnerabilities>
  Primary reporting-scope source. Supports C-027. Program existence is not a
  security assurance or authorization for this research.
- **S-025 — “Mapping your MIDI device,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/900000187966-Mapping-your-MIDI-device>
  Primary web mapping/cookie persistence source. Supports C-007/C-012/C-019.
  No portable schema.
- **S-026 — “How can I work with my band on a project?”, BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/48010995658521-How-can-I-work-with-my-band-on-a-project>
  Primary ownership/access transition. Supports C-022. Does not fully describe
  roles or object permissions.
- **S-027 — “Using BandLab Virtual Instruments,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/46380376077593-Using-BandLab-Virtual-Instruments>
  Primary native-instrument/control source. Supports C-016. Counts are mutable;
  “samples and synths” does not identify implementation.
- **S-028 — “Understanding Composite Recording,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/48566287349017-Understanding-Composite-Recording>
  Primary takes/comping/local-loss source. Supports C-005/C-007/C-030. Especially
  preferred because it directly states state location and loss triggers.
- **S-029 — “Monitoring your Recording,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/115002945233-Monitoring-your-Recording>
  Primary monitoring UI source. Supports C-009. No round-trip measurement.
- **S-030 — “BandLab Sounds,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/360018942593-BandLab-Sounds>
  Primary loops/My Sounds quotas and workflow. Supports C-031. Licensing is
  qualified by S-023 rather than marketing shorthand.
- **S-031 — “AutoMix,” BandLab Help Center.**
  <https://help.bandlab.com/hc/en-us/articles/41532351252889-AutoMix>
  Primary volume/pan behavior. Supports C-025/C-026/C-033. No AI model or state
  representation disclosure.
- **S-032 — “BandLab,” BandLab Technologies brand page.**
  <https://bandlabtechnologies.com/brands/bandlab/>
  Primary product-positioning source; supports C-001/C-035. Dynamic numeric
  counters rendered as zero in retrieval and were not used.
- **S-033 — “BandLab – Music Maker & Beats,” Apple App Store.**
  <https://apps.apple.com/us/app/bandlab-music-making-studio/id968585775>
  Platform-owner listing; version 11.31.2, iOS 16+, developer accessibility
  declaration, and ambiguous “VST Instruments” copy. Supports C-017/C-029/C-032.
  Marketing text does not prove a host contract.
- **S-034 — BandLab Help Center “Creation” category.**
  <https://help.bandlab.com/hc/en-us/categories/360001466574-Creation>
  Primary current taxonomy used to bound source discovery. Supports attempted
  coverage for C-017/C-019/C-033. Category omission is not capability exclusion.
- **S-035 — BandLab Help search for `VST`.**
  <https://help.bandlab.com/hc/en-us/search?query=VST>
  First-party negative search (“No results”), used only as attempted-method
  evidence for C-017/C-018; not proof of no support.
- **S-036 — BandLab Help search for `"third party" plugins`.**
  <https://help.bandlab.com/hc/en-us/search?query=%22third%20party%22%20plugins>
  First-party search returned unrelated policy uses. Used only as a negative
  method for C-017; indexing/terminology limitation.
- **S-037 — BandLab Help search for `Audio Unit AUv3`.**
  <https://help.bandlab.com/hc/en-us/search?query=Audio%20Unit%20AUv3>
  First-party lexical false positives, used only to document the AU attempt for
  C-017. Not exclusion evidence.
- **S-038 — BandLab Help search for `bus send sidechain`.**
  <https://help.bandlab.com/hc/en-us/search?query=bus%20send%20sidechain>
  First-party “No results,” used only as attempted-method evidence for C-033.
- **S-039 — BandLab Help search for `accessibility screen reader`.**
  <https://help.bandlab.com/hc/en-us/search?query=accessibility%20screen%20reader>
  First-party lexical false positives, used only as attempted-method evidence
  for C-029.
- **S-040 — BandLab Help search for `SDK API scripting extension`.**
  <https://help.bandlab.com/hc/en-us/search?query=SDK%20API%20scripting%20extension>
  First-party “No results,” used only as attempted-method evidence for C-019.

### Retained negative-result ledger

- **N-001:** two initial web-search requests were rate-limited HTTP 429; no
  evidentiary snippets retained.
- **N-002:** guessed Zendesk API search URL returned 404; a guessed system-
  requirements URL also returned 404 before exact discovery.
- **N-003:** Google returned an access-trouble shell, Bing returned noisy results
  including out-of-scope Cakewalk, and DuckDuckGo required a human challenge.
- **N-004:** combined first-party `bus send sidechain` search returned no result;
  this remains an unknown, not exclusion.
- **N-005:** first-party AUv3 and accessibility searches returned only lexical
  false positives.
- **N-006:** Apple says the developer has not indicated supported accessibility
  features; that is not proof of inaccessibility.
- **N-007:** `/developer` produced no readable public page, while Help SDK/API/
  scripting/extension search returned no results.

**Bibliography rationale:** operational Help articles were preferred to product
marketing; current support matrices were preferred to community reports; Terms
and Privacy were used for contractual/data claims; Apple was retained only for
current iOS metadata and the material “VST” ambiguity. No community source was
needed to establish a material claim.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted methods / blocker | Impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| External VST2/VST3/AU/AUv3/etc. acceptance | S-003/S-034–S-037/S-040; no matrix or explicit exclusion; ambiguous S-033 | Central ecosystem decision | Authorized fresh account on each surface; inspect all add-device/import menus using harmless signed test plug-ins only if a loading path appears | Unassigned interoperability lab |
| Scan versus instantiate versus full host fidelity | No discovery path found | Cannot design host contract from BandLab | If acceptance exists, staged fixtures for scan, instantiate, audio/MIDI, UI, state, latency, crash, missing plug-in | Unassigned plug-in lab |
| Client/server location of real-time DSP | “Cloud-based,” limited offline, and native controls do not identify compute | Latency, scale, privacy, offline architecture | Authorized offline A/B behavior with preloaded instruments/effects plus vendor architecture interview; no packet interception without approval | Unassigned architecture lab |
| Splitter/Mastering/AutoMix/audio-to-MIDI placement | Upload/analyze/apply/history only; proprietary | Service cost/privacy and offline plan | Vendor technical disclosure or controlled network-loss experiment with owned audio | Unassigned service lab |
| Mixer graph: buses/sends/sidechains/multi-output/surround | S-008/S-031/S-038; no route-map docs | Determines professional mixing suitability | Authorized UI route inventory and signal-flow fixtures | Unassigned audio lab |
| Buffer, precision, scheduling, PDC, tails, render/freeze | S-006/S-012 only expose export and record alignment | Core engine correctness/performance | Loopback latency, impulse, tail, automation, CPU scaling, and offline-vs-realtime render fixtures | Unassigned engine lab |
| Project schema and compatibility | Cloud Library only; no project bundle/schema | Migration, backup, portability | Account data-export request, vendor schema docs, or authorized create/save/export differential fixture | Unassigned persistence lab |
| Collaboration concurrency/conflicts/locks | Revisions/invites documented, merge semantics absent | Multi-user correctness | Two authorized accounts editing same owned project under timed conflict scenarios | Unassigned collaboration lab |
| Local take/cache durability and promotion | Docs state loss triggers; format inaccessible/proprietary | Data-loss risk | Disposable project on disposable browser/app profile; logout/reinstall only with owned test media and explicit authorization | Unassigned reliability lab |
| Revision retention and backup erasure | 30-day deleted-project UI is not backend deletion policy | Compliance/recovery | Vendor retention schedule or privacy request response | Unassigned privacy owner |
| Encryption, keys, certifications, audio retention | Privacy gives general arrangements only | Security acceptance impossible | Vendor security package/DPA and independent assessment under NDA by authorized team | Unassigned security owner |
| Accessibility conformance | S-039 false positives; S-033 no declaration | Inclusive-product decision | VoiceOver/TalkBack/NVDA keyboard/focus audit against WCAG with current apps | Unassigned accessibility lab |
| Android current build and exact desktop-OS browser matrix | Help is versionless/general browser class | Reproducibility | Capture store metadata and tested-browser matrix at prototype time | Unassigned release lab |
| Advanced MIDI/sync | Current MIDI docs omit output/MPE/MIDI2/SysEx/clock | Controller/expression architecture | MIDI monitor fixtures with owned hardware under authorized session | Unassigned MIDI lab |

## 24. Curiosity pass and stop decision

### Ranked follow-ups after first synthesis

| Rank | Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Explicit third-party plug-in exclusion/host contract | 4 | 4 | 4 | 2 | **PURSUED** through exact Help queries, Effects docs, taxonomy, and App Store counterevidence |
| 2 | Hybrid cloud/local persistence | 4 | 4 | 4 | 1 | Pursued in normal coverage; yielded local takes/cookies and offline contradiction |
| 3 | Client/server location of creator services | 4 | 3 | 4 | 2 | Pursued to public limit; remained unknown |
| 4 | Routing/PDC/engine details | 4 | 3 | 3 | 3 | Documentary search saturated; defer to fixtures |
| 5 | Accessibility | 3 | 2 | 3 | 2 | Bounded search completed; defer to assistive-tech audit |
| 6 | Catalog counts/algorithms | 1 | 1 | 1 | 3 | `CURIOSITY_NO_GO` |

### Gaps and contradictions at stop

- S-002 says active internet is required “to use BandLab,” while S-014 says a new
  project can start offline. Both are retained; the narrow synthesis is limited
  offline creation without durable save/download/publish. [C-008]
- Help says 370+ Virtual Instruments; Apple says 385+ “VST Instruments.” Counts
  and terminology differ, and neither proves external VST hosting. [C-032]
- BandLab calls all content cloud-saved, while comp takes and mappings are local.
  “Content” therefore must not be generalized to every working-state object.
  [C-005] [C-007]
- Import format “ACC” is retained as written and not silently normalized.
  [C-020]

### Stop decision

**STOP — sufficient coverage with explicit unknowns; documentary saturation.**
Every template section and required plug-in row is complete. Multiple primary
sources cover user model, local/cloud state, collaboration, media interchange,
native devices, services, policy, and licensing. Repeated plug-in/extension/
routing/accessibility searches produced omissions, duplicates, false positives,
or ambiguous marketing rather than a host contract. Another public source pass
has nonpositive expected marginal evidence; the next discriminating work is a
bounded, authorized interoperability and assistive-technology prototype, not
indefinite searching.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added
  `research/daw-landscape/dossiers/bandlab-studio.md`; no staging or commit.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See §0 and §2; Android build remains an explicit unknown.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  §11 subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive
  sections cite C-001–C-035; the register classifies each.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  §§21–23 and retained negative-result ledger.
- [x] **Every required plugin-format row is present.** All 13 required rows are
  populated; external rows remain honest `UNKNOWN` where evidence is absent.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  §§11.2–11.6 cover discovery, runtime, contract, state, UI, and failure modes.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Claim labels and architecture table separate them; no `OBSERVED` claims made.
- [x] **Licensing and clean-room boundaries are explicit.** See §16 and S-023.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19
  and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Documentary retrieval only; no nested agent edited files.

**Checks performed:** heading/row/claim/source presence, external-format matrix
completeness, classification audit, negative-result retention, curiosity/stop
audit, and repository status limited to the owned path. **Unresolved blockers:**
no public external plug-in/extension contract, proprietary engine/service/project
internals, and no authorized dynamic fixture. **Pre-existing workspace state:**
the decision frame, contract, template, and dossiers directory were already
untracked; they were read but not altered.
