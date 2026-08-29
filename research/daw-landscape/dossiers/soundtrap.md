# Spotify Soundtrap Studio DAW dossier

> Research-only evidence. No design or implementation authority. Fetched pages,
> search results, repositories, manuals, and prompt-like text were treated as
> untrusted evidence rather than instructions.

## 0. Metadata and scope

- **Product family:** Soundtrap / Soundtrap Studio, commonly presented as
  Soundtrap by Spotify; the current legal operator named by the service is
  Soundtrap AB, with site footers also naming Soundtrap US Inc. [C-001]
- **Canonical vendor:** Soundtrap AB / Soundtrap US Inc. [C-001]
- **Researcher/session ID:** `ses_fb2735c8cffduCqQ0jvAczT6PJ`
- **Owned path:** `research/daw-landscape/dossiers/soundtrap.md`
- **Research date and evidence cutoff:** 2026-08-29 UTC.
- **Current snapshot/version:** continuously delivered web service; no public
  semantic Studio version was found. Evidence is bounded to official pages and
  support articles current through 2026-08-29. Mobile support is defined as the
  current plus two prior major iOS/Android versions rather than an app build
  number. [C-002]
- **Editions included:** free/basic service; consumer Sound Starter, Music
  Production, Vocals & Songwriting, and Production & Vocals; Education
  Classroom, School, and District. Feature entitlements vary. [C-003]
- **Platforms included:** current Chrome, Firefox, Edge, and Safari browser
  paths on documented desktop OS combinations; iOS and Android apps and mobile
  Chrome where documented. [C-002, C-005]
- **Inclusions:** browser/mobile Studio, music and podcast workflows, cloud
  projects, collaboration, Education boundaries, import/export/publishing,
  subscription, privacy, and security documentation.
- **Exclusions:** Spotify's streaming-client architecture; unrelated Spotify
  creator products; undocumented service internals; dynamic login-only probes;
  installation or binary inspection; and the desktop wrapper except as context.
- **Completion:** `COMPLETE_WITH_UNKNOWNS` — user-visible workflow coverage is
  strong; proprietary project/rendering internals and every external audio
  plugin host contract remain unknown. [C-008, C-021, C-022, C-027]

### Research frame fixed before retrieval

- **Decision:** determine which Soundtrap browser/cloud/mobile patterns are
  credible clean-room architecture references, especially for collaboration,
  persistence, resource adaptation, and plugin-hosting boundaries.
- **Sub-questions:** product/platform/edition identity; project/track/region/
  audio/MIDI/loop model; documented client/server and latency behavior; native
  devices; external plugin formats; automation/routing/state; collaboration,
  versioning, Education, publishing, interchange, offline behavior, privacy,
  security, and subscriptions.
- **Depth budget:** no more than two decision-critical sources per evidence
  pass; synthesize before each next pass; one best curiosity thread; no product
  installation. Forty-three retained sources were sufficient, including four
  explicitly limited negative-result pages.
- **Sufficient coverage:** every required heading and plugin-format row has a
  documented answer or explicit unknown; all material conclusions resolve to
  classified claims; proprietary cloud internals are not guessed.

## 1. Executive summary

Soundtrap is a cloud-based, browser-first DAW with iOS/Android apps, a linear
track/region arrangement, MIDI piano roll, stock instruments/effects, loop
library, autosave, real-time project collaboration, timestamped comments, and
subscription-gated version restoration. [C-001, C-002, C-004, C-013, C-018,
C-019, C-025, C-026]

The strongest architecture evidence is a hybrid boundary: Soundtrap's terms say
uploaded audio is automatically transcoded and stored on its servers, while its
support material ties playback/effect load, RAM pressure, overload recovery,
and freezing to the user's browser/device. It is therefore reasonable to infer
that meaningful interactive audio work runs client-side, but the precise split
for record upload, collaboration synchronization, freeze, mixdown, and
mastering is proprietary and **UNKNOWN**. [C-006, C-007, C-008]

No current official external audio-plugin host contract was found. Soundtrap
documents its own stock plugins and no-install instruments; a vendor article
contrasts those with loading VST/AU instruments in “other DAWs,” and an exact
official-help search returned no VST article. This supports only a
medium-confidence **INFERENCE** that user-installed VST/AU hosting is excluded,
not a documented statement. Every required external format therefore remains
`UNKNOWN`, while product-native devices are `DOCUMENTED`. [C-020, C-021,
C-022]

Soundtrap's differentiators are low-friction cross-device collaboration,
Education administration/walled-garden controls, progressive playback-quality
degradation plus freeze, and record-latency calibration. Liabilities as an
architecture reference are proprietary project/storage/render protocols,
subscription and mobile capability asymmetry, no evidenced portable project
archive, and no evidenced third-party plugin ecosystem. [C-005, C-010, C-011,
C-027, C-034]

**Overall confidence:** high for current user-visible features, platforms,
plans, import/export, and privacy disclosures; medium for the client-heavy
interactive rendering inference; low for undocumented hosting, service
topology, conflict resolution, security controls, and offline behavior.

## 2. Product identity, history, and market position

The canonical About page calls Soundtrap a cloud-based DAW, says it runs in a
web browser, and dates launch to 2013 as a web-based cross-platform
collaborative recording studio. Current pages carry 2026 Soundtrap AB/US Inc
footers and link to “Soundtrap by Spotify”; legal terms identify Soundtrap AB as
the service provider. [C-001]

The product targets individual music makers, vocal/songwriting and podcast
creators, plus education institutions. Consumer plans specialize content and
vocal/production features; Education adds Classroom, School, and District
administration, assignments, groups, roster/LMS integration, and safer student
collaboration boundaries. [C-003, C-034]

This dossier does not assign a semantic version to the web app: support pages
are continuously updated, and a current mobile article warns that old and new
app versions coexist during rollout. [C-002, C-005]

## 3. Workflow and conceptual model

The core mental model is a cloud project containing a linear composition area,
track headers, a playhead/ruler, audio or MIDI regions, and looped base/shadow
regions. Tracks expose record-arm, solo, mute, volume, effects, and automation;
the global surface exposes tempo, key, metronome, master volume, export,
comments, loops, and collaboration. Autosave is the default persistence cue.
[C-004]

Loops can be audio or MIDI. A user can merge/select regions, save the result to
`My Loops`, attach a key, and reuse it privately; sharing the loop requires a
collaborative project or rendered export/import. [C-019]

This is not documented as a clip-launching scene system, tracker, modular graph,
notation editor, or post-production timeline. MIDI can be handed to Flat.io or
Noteflight for notation, but no native score model is established. [C-024]

## 4. Publicly documented architecture

**DOCUMENTED:** the terms describe a “cloud based hosting and collaborative
recording platform.” Uploading audio starts an automated transcode and directs
Soundtrap to store the content on its servers. Education disclosures name AWS
and Google as cloud-hosting subprocessors, but do not map either provider to a
specific service or audio path. [C-006, C-031]

**INFERENCE:** browser/device CPU, RAM, browser capability, local effect load,
and freeze materially affect playback. This is evidence for client-side
interactive processing, not proof of a specific Web Audio, AudioWorklet,
WebAssembly, native, thread, graph, or codec implementation. A plausible
alternative is a mixed architecture in which local playback/effects coexist
with server-side asset, collaboration, freeze, mix, or master services. [C-007]

**UNKNOWN:** process boundaries; service topology; project database/schema;
object storage; collaboration protocol and conflict algorithm; audio graph and
scheduler; exact freeze renderer; mix/export renderer; mastering execution
location; caching; encryption/key management; and disaster recovery. Public
subprocessor names do not establish these internals. [C-008, C-027, C-032]

## 5. Audio engine

Soundtrap accepts audio-device sample rates up to 96 kHz, while documented MP3,
Ogg, and WAV delivery is 44.1 kHz (MP3 320 kbit/s, Ogg quality 9 around 320
kbit/s, and WAV listed as 1411 kbit/s). Export bit depth is not stated; the WAV
bitrate must not be silently converted into an asserted internal precision.
[C-009]

Overload management is explicit: High-to-Medium playback degradation converts
stereo sounds to mono except reverb without changing source recordings;
Medium-to-Low disables reverbs; the final step freezes tracks into temporarily
non-editable, less resource-consuming audio and automatically unfreezes when a
non-volume/pan edit occurs. Users can also select lower quality or freeze tracks
manually. [C-010, C-030]

Latency tools include a calibration that compensates new recordings so they
align to the beat, a Low Latency Mode that temporarily disables effects prone to
inducing latency, wired-device guidance, and browser/interface buffer guidance.
The vendor explicitly says monitoring latency cannot be eliminated and depends
on hardware, OS, and effects. [C-011]

Projects are auto-mastered after saving by default; the documented master treats
all tracks as a whole and applies limiters, compressors, and EQ to the exported
song, with selectable styles or an off switch. The render location is not
disclosed. [C-029, C-008]

Buffer/block behavior, internal sample format, oversampling, multicore
scheduling, plugin delay compensation, tail handling, real-time priority,
dropout logs, deterministic offline rendering, and numeric track limits are
**UNKNOWN**. [C-012]

## 6. Tracks, timeline, clips, and editing

Official terminology documents track headers and regions, including a base
region, loop handle, and shadow regions. Current mobile documentation confirms
region split, cut/copy/paste/trim/loop, fade, merge, quantization, piano roll,
pattern beatmaker, and track solo/mute across listed mobile variants, while
reverse, pitch change, time stretch, and sampler are absent there. [C-004,
C-005]

The desktop-browser help corpus also documents song sections, snap/grid,
region/track merge, time stretch, reverse, freeze, copy between projects, and
track automation. These are user-visible edits; destructive/non-destructive
media implementation is not disclosed. [C-004, C-010, C-015]

Take lanes, comping, punch-in/out, ripple editing, clip groups, nested folders
as mixer groups, and edit decision lists are **UNKNOWN**. Search results for
“comping takes” and “punch recording” were noisy and produced no decision-grade
official feature statement; absence is not evidence of exclusion. [C-012]

## 7. MIDI, sequencing, notation, and expression

Soundtrap provides MIDI tracks, a piano roll, editable note timing/velocity/
pitch, Patterns Beatmaker, virtual instruments, MIDI-file import/export, and
audio/MIDI loops. USB MIDI keyboards are documented for Mac, Windows, and
Chromebook; 5-pin devices require a MIDI interface, and controller note mapping
cannot be customized. [C-013]

Mobile apps and mobile Chrome are explicitly listed without MIDI input.
Desktop-browser support varies: Chrome/Edge combinations are documented for
MIDI; Safari requires a separate Jazz browser MIDI-enabling plugin. That Jazz
component is not evidence of an audio-effect/instrument host. [C-002, C-005,
C-013]

Flat.io and Noteflight receive MIDI for transcription; this is an interchange
boundary, not a native notation engine. [C-024]

MPE, polyphonic/per-note expression, MIDI 2.0, SysEx, MIDI clock, MTC, SMPTE,
custom controller maps, MIDI effects, event buses, and sample-accurate MIDI or
automation are **UNKNOWN**. [C-014]

## 8. Routing, mixer, automation, and control

Browser Studio automation uses point/line lanes for track volume, pan, Sweep,
and some added effect parameters. Points can be selected, moved, copied, and
pasted, and automation can be toggled or removed. Mobile devices are explicitly
excluded from automation. [C-015]

Stock effects are inserted on the currently opened track, and a user can save a
tweaked instrument/effect setup in `My Preset Collection`. “Instant Sidechain”
is documented as a tempo-patterned ducking device with preset curves, amount,
and time; the article does not describe selecting another track as an arbitrary
key input. [C-016]

Buses, aux sends/returns, folders as routing nodes, VCAs, arbitrary sidechain
buses, multi-output instruments, feedback paths, surround/immersive channels,
external inserts, control-surface protocols, OSC, and remote APIs are
**UNKNOWN**. [C-017]

## 9. Recording, comping, and media handling

Documented browser matrices distinguish audio input and monitoring by OS/
browser. iOS app monitoring is direct and excludes effects; web monitoring can
carry latency, and mobile browser variants do not all support monitoring.
[C-002, C-011]

Audio import accepts MP3, WAV, AIF, MP4, M4A, Ogg, and AAC by drag/drop or import
command. Soundtrap states no fixed import-size limit, but practical audio-file
count depends on system RAM and whether the browser can play the media.
[C-023, C-030]

Latency calibration realigns future recordings for a specific mic/interface;
switching device warrants recalibration. [C-011]

Take management, comping, punch/loop-take semantics, multichannel recording,
pre-roll/post-roll, proxies, conform, metadata, media relinking, broadcast WAV,
and native video-media behavior are **UNKNOWN**. [C-012, C-027]

## 10. Instruments, effects, content, and native devices

Soundtrap documents dozens of stock effects (the current feature page says
50+), including vocal tools, reverb, distortion/bitcrusher, EQ, delay,
compressor, noise gate, rotary, and Instant Sidechain. Native instruments
include Chords, Retro Synth, Sampler, Patterns Beatmaker, 808 with glide, keys,
synths, guitar, orchestral, and drum content. [C-016, C-018]

The paid Sampler imports up to 30 seconds of local audio or a library one-shot,
maps it to virtual keyboard/piano roll, and exposes fades, length, loop points,
crossfade, and mode parameters. It is explicitly unavailable in the current
mobile capability matrix. [C-005, C-018]

The loop library provides audio and MIDI loops, one-shots, and royalty-free
Soundtrap Originals with key/scale, genre, format, and other search filters.
Official current marketing counts conflict at 24,000+ and 40,000+, so the
durable conclusion is only “tens of thousands,” with content access
plan-dependent. [C-019]

Native-device code/API architecture, modulation graph, macros, preset schema,
asset-reference rules, and third-party device authoring are **UNKNOWN**.
[C-022, C-036]

## 11. Third-party plugin hosting

The key distinction is between documented stock devices and an external host.
Official current material documents Soundtrap's own stock plugins and says its
virtual instruments require no installation; the same vendor article tells
users of “other DAWs” to load VST/AU plugins. An exact help-center search found
no VST article. This makes external hosting likely excluded, but not sufficiently
documented to mark any format unsupported. [C-020, C-021]

### 11.1 Format/platform matrix

`UNKNOWN:no current official host contract found` is not a claim of
unsupported behavior.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN:no host contract | UNKNOWN:no host contract | UNKNOWN:no host contract | UNKNOWN:no host contract | Continuous 2026 service; official help search returned no VST result | Inferred exclusion only; discontinued VST2 licensing was not reached because hosting itself is unproved | C-020, C-021; S-002, S-033, S-034 |
| VST3 | UNKNOWN:no host contract | UNKNOWN:no host contract | UNKNOWN:no host contract | UNKNOWN:no host contract | Continuous 2026 service | No scanning, instantiation, or processing evidence | C-021, C-022; S-002, S-033, S-034 |
| AUv2 | UNKNOWN:no host contract | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | UNKNOWN:no host contract | Continuous 2026 service | Vendor article discusses AU only for “other DAWs” | C-020, C-021; S-033 |
| AUv3 | UNKNOWN:no host contract | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | UNKNOWN:no host contract | iOS app current plus two OS majors | No extension-enumeration or AUv3-host evidence | C-021, C-022; S-004, S-035 |
| AAX | NOT_APPLICABLE:Avid host format on this product scope | NOT_APPLICABLE:Avid host format on this product scope | NOT_APPLICABLE:Avid host format | NOT_APPLICABLE:Avid host format | No Avid-host product edition | No evidence Soundtrap is an AAX host; format is product-host-specific | C-021; S-002 |
| CLAP | UNKNOWN:no host contract | UNKNOWN:no host contract | UNKNOWN:no host contract | UNKNOWN:no host contract | Continuous 2026 service | No official evidence | C-021, C-022; S-002 |
| LV2 | UNKNOWN:no host contract | UNKNOWN:no host contract | UNKNOWN:no host contract | UNKNOWN:no host contract | Linux Chrome has audio input but no monitoring in current matrix | Browser audio input does not establish plugin hosting | C-002, C-021; S-005 |
| LADSPA | UNKNOWN:no host contract | UNKNOWN:no host contract | UNKNOWN:no host contract | UNKNOWN:no host contract | Continuous 2026 service | No official evidence | C-021, C-022; S-002 |
| DSSI | UNKNOWN:no host contract | UNKNOWN:no host contract | UNKNOWN:no host contract | UNKNOWN:no host contract | Continuous 2026 service | No official evidence | C-021, C-022; S-002 |
| JSFX | NOT_APPLICABLE:REAPER-specific format | NOT_APPLICABLE:REAPER-specific format | NOT_APPLICABLE:REAPER-specific format | NOT_APPLICABLE:REAPER-specific format | No REAPER-host edition | Product-specific format outside Soundtrap's documented ecosystem | C-021; S-002 |
| DirectX/DXi | NOT_APPLICABLE:Windows-only format | UNKNOWN:no host contract | NOT_APPLICABLE:Windows-only format | NOT_APPLICABLE:desktop Windows format | Continuous 2026 service | No Windows host evidence | C-021, C-022; S-002 |
| Rack Extension | NOT_APPLICABLE:Reason-specific format | NOT_APPLICABLE:Reason-specific format | NOT_APPLICABLE:Reason-specific format | NOT_APPLICABLE:Reason-specific format | No Reason Rack host edition | Product-specific format outside Soundtrap's documented ecosystem | C-021; S-002 |
| Product-native/other | DOCUMENTED:stock instruments/effects in browser | DOCUMENTED:stock instruments/effects in browser | DOCUMENTED:stock instruments/effects where browser supports Studio | DOCUMENTED:web/iOS/Android stock devices with mobile gaps | Current 2026 continuous service; plan-gated inventory | Native effects, instruments, Sampler, loops, presets; Safari Jazz plugin only enables MIDI access | C-005, C-016, C-018, C-019; S-002, S-004, S-013–S-018 |

### 11.2 Discovery, scanning, validation, and recovery

External plugin discovery paths, scan caches, validation, duplicate identity,
blacklists, quarantine, rescan, missing-plugin placeholders, and failure
recovery are **UNKNOWN** because no external host contract is documented.
Soundtrap's native device/menu discovery is not equivalent to filesystem plugin
scanning. [C-021, C-022]

### 11.3 Runtime isolation and compatibility

External-plugin in-process/separate-process execution, sandboxing, crash
containment, architecture bridging, code signing, notarization, and compatibility
modes are **UNKNOWN**. Browser isolation cannot be promoted to a plugin sandbox
claim without an evidenced plugin instance. [C-022, C-032]

### 11.4 Host/plugin processing contract

Audio/MIDI/event buses, sidechains, multi-output, MPE, MIDI 2.0, sample-accurate
automation, plugin latency/tail reporting, bypass/suspend, offline render, and
dynamic I/O are all **UNKNOWN** for external plugins. Stock automation and the
native Instant Sidechain device do not establish an external host ABI. [C-014,
C-016, C-017, C-022]

### 11.5 Parameters, automation, state, presets, and project recall

For native devices, selected parameters can expose automation and a user can
save a customized setup to `My Preset Collection`. Parameter IDs/ranges/text,
preset serialization, asset references, migration, version compatibility, and
external-plugin state chunks/placeholders are **UNKNOWN**. [C-015, C-016,
C-022, C-027]

### 11.6 UI, diagnostics, and failure modes

Stock devices use Soundtrap's own track/effects UI. No external editor
embedding/detachment/scaling, headless mode, crash report, validation log, or
plugin failure diagnostic is documented. General overload, browser, and latency
diagnostics cannot be treated as plugin diagnostics. [C-010, C-011, C-022]

## 12. Extensibility and integration

Documented interoperability is service/file oriented: MIDI export to Flat.io or
Noteflight, direct YouTube/SoundCloud publishing, Spotify podcast claiming via
RSS, and Education roster/LMS integrations such as Google Classroom, Canvas,
Schoology, Clever, ClassLink, and Skolon depending on plan. [C-024, C-029,
C-034]

The terms include “APIs” within the service definition, but the public
Developers page returned no readable current authoring contract. No supported
scripting language, device SDK, plugin SDK, macro/action API, OSC API,
controller API, or stability/version policy was found. Those boundaries remain
**UNKNOWN**. [C-036]

## 13. Project format, persistence, interoperability, and collaboration

Projects are cloud-hosted and autosaved. Invitations use a link or email and
require the invitee to sign up; the vendor documents real-time collaboration on
desktop, mobile web, and app. Timeline comments can be resolved, filtered,
edited, linked, and anchored to timestamps. [C-006, C-025]

For eligible plans, a version is created when a user leaves the project,
switches browser tabs, exits the Studio, or closes the browser. Opening an old
version creates a separate unique project; that copy does not inherit the
original's earlier-version stack. This is documented snapshot-and-branch
behavior, not proof of a general version-control or merge system. [C-026]

Audio upload is transcoded and server-stored. Interchange comprises listed
audio imports; MP3/Ogg/WAV mix export; per-track WAV with or without most
effects; and per-track MIDI import/export. “Without effects” still retains
Vocal Tuner and Voice Transform. [C-006, C-023, C-024]

The proprietary editable project representation, archive/collect format,
autosave transaction model, conflict resolution, deletion retention, migration,
backward/forward compatibility, missing assets, asset deduplication, and crash
recovery protocol are **UNKNOWN**. No AAF, OMF, ADM/BWF, MusicXML, DAWproject,
or portable editable project export was evidenced. [C-027]

No official offline-mode article was found. The bandwidth guide quantifies
upload/download wait and recommends persistent bandwidth, which establishes a
material cloud dependency but does not prove that every edit fails offline.
Offline creation, queueing, and reconciliation remain **UNKNOWN**. [C-028]

## 14. Delivery, live, post-production, and specialized workflows

Delivery includes 44.1-kHz MP3, Ogg, and plan-gated WAV; per-track WAV and MIDI;
automatic or selectable mastering; direct SoundCloud/YouTube publishing; and
podcast publication/claiming through Spotify for Podcasters and RSS. Other
platforms use downloaded audio. [C-009, C-024, C-029]

Education specializes in assignments, groups, administration, lesson plans,
rostering, and LMS/SSO boundaries; podcasting offers transcription in eligible
plans. [C-003, C-034]

DDP, CD authoring, batch export, loudness targets/reports, video timecode/ADR,
surround/immersive/ADM, show control, and a live-performance scene model are
**UNKNOWN**. [C-012, C-017, C-027]

## 15. Performance, reliability, security, and accessibility

Performance scales with local memory/CPU, browser behavior, track/effect count,
media length, and network bandwidth. Soundtrap exposes quality reduction,
low-latency effect bypass, freeze, and automatic overload recovery; it states no
fixed import-size cap but provides no numeric track or project-duration maximum.
[C-010, C-011, C-030]

Reliability mechanisms visible to users are autosave, previous-version copies,
and source-preserving playback degradation. Exact durability, failover, backup,
RPO/RTO, rollback, incident response, and crash containment are not public.
[C-004, C-010, C-026, C-032]

The consumer privacy policy says service-usage data includes streamed,
recorded, uploaded, and downloaded sounds, interactions/messages, technical
device/network data, and user content; it describes service-provider,
marketing, analytics, legal, and business-transfer sharing and GDPR rights.
Education's current subprocessor list names AWS and Google for hosting and Ably
for chat, among other providers. [C-031]

Education documents an under-13 walled garden, minimal profiles, and stated
COPPA/FERPA/GDPR-oriented controls. These are vendor compliance statements, not
an independent audit. Public evidence does not establish encryption at rest/in
transit, tenant isolation, authentication design, key custody, penetration-test
results, SOC/ISO certification, secure SDLC, or vulnerability-disclosure SLAs.
[C-032, C-034]

Accessibility documentation covers tab/shift-tab navigation, keyboard-operated
buttons/sliders/lists, skip links, screen-reader navigation, and disabling
musical typing when it interferes with assistive technology. No current WCAG
conformance report or independent accessibility audit was retained. [C-033]

## 16. Licensing, ecosystem, and implementation constraints

Soundtrap is a proprietary service: terms grant access, not software ownership,
and reserve Soundtrap brand/service rights. Users retain ownership/control of
their uploaded content while granting Soundtrap rights necessary to store,
transcode, provide, and improve the service. The terms should be reviewed by
counsel rather than treated as this dossier's legal advice. [C-006, C-035]

Soundtrap sample content is royalty-free for creating original works, but
standalone redistribution/repackaging of individual loops or sample content is
forbidden. Demo projects have narrower reuse rules. [C-035]

Because no external audio-plugin host is documented, VST3/AU/AAX/CLAP SDK,
trademark, certification, signing, redistribution, and discontinued VST2
licensing questions are not reached for the current product. Naming any format
here grants no compatibility or license right. [C-021, C-022]

Clean-room limits: do not copy Soundtrap UI expression, stock content, presets,
branding, project payloads, or proprietary protocols; adapt only abstract
mechanisms supported by public evidence. [C-035]

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **Cross-device cloud collaboration:** autosave, invitations, real-time work,
  comments, and version copies form a coherent collaboration-first model.
  [C-004, C-025, C-026]
- **Adaptive real-time behavior:** ordered degradation preserves original
  recordings and ends in track freeze rather than an undifferentiated failure.
  [C-010]
- **Practical record-latency UX:** measured alignment correction and temporary
  latency-inducing-effect bypass address two distinct latency symptoms.
  [C-011]
- **Education boundary:** walled-garden accounts, admin/groups/assignments, LMS
  integration, and student-specific privacy commitments are materially
  different from a consumer account toggle. [C-034]
- **Low setup burden:** native devices/content and browser MIDI/audio reduce
  installation dependencies. [C-002, C-013, C-018, C-019]

### Liabilities

- **Portability risk:** editable project schema/archive and conflict protocol
  are proprietary and unknown; documented interchange is rendered audio and
  per-track MIDI rather than full-fidelity project exchange. [C-024, C-027]
- **Plugin ecosystem uncertainty:** no external hosting contract can be cited.
  [C-020, C-021, C-022]
- **Parity/entitlement complexity:** mobile lacks automation/MIDI input and
  several edit/device features; plans gate versions, sampler, MIDI/WAV export,
  content, and mastering styles. [C-003, C-005]
- **Cloud/privacy dependence:** audio is transcoded/stored server-side and usage
  data includes creative content/interactions; offline reconciliation is
  unknown. [C-006, C-028, C-031]
- **Professional-engine unknowns:** routing, PDC, multichannel, expression,
  precision, deterministic render, and diagnostics are not documented.
  [C-012, C-014, C-017]

### Recommendation for later decision work

Treat Soundtrap as a strong reference for collaboration UX, progressive
degradation, latency calibration, and Education tenancy—not as evidence for a
professional plugin host or a fully portable project engine. Any adoption
decision should require prototypes for offline reconciliation, conflict merge,
portable archives, and latency/render determinism rather than inferring those
contracts from the web UI. [C-008, C-021, C-027, C-028]

## 18. Transferable patterns

| Pattern | Problem and minimal mechanism | Evidence | Prerequisites/tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Autosave plus restore-as-copy | Preserve progress without exposing VCS: autosave continuously; snapshot on leave; restore old snapshot into a new project | C-004, C-026 | Durable snapshot IDs/storage; copying avoids destructive rollback but forks history and complicates merge | Medium; exact Soundtrap schema/protocol must not be copied | CANDIDATE |
| Ordered overload degradation | Keep transport alive: reduce preview fidelity, disable costly ambience, then freeze tracks while preserving sources | C-010, C-030 | Explicit quality tiers and reversible cache; preview may differ from final render | Low as an abstract policy; test user trust and loudness/stereo surprises | CANDIDATE |
| Split latency controls | Separate record-placement calibration from monitoring-load mitigation | C-011 | Reliable loopback/calibration UX and effect latency classification | Medium; device/browser variance needs measurement | CANDIDATE |
| Collaboration plus timestamp comments | Bind discussion to project time while retaining resolved history and shareable links | C-025 | Identity, authorization, realtime updates, durable anchors | Medium; concurrent timeline edits can invalidate anchors | CANDIDATE |
| Capability matrix by surface | Publish feature differences for app/mobile web/browser instead of implying parity | C-002, C-005 | Continuous matrix ownership and rollout/version metadata | Low mechanism risk; stale docs are a governance risk | CANDIDATE |
| Education tenancy as product boundary | Put minors in a restricted collaboration domain with minimal profiles, admins, groups, assignments, and roster integrations | C-034 | Strong tenant isolation, delegated school control, contracts, audits | High regulatory/security risk; vendor claims are not assurance | CONDITIONAL |
| Native-content-first browser studio | Avoid install/scan failures with curated native devices/content | C-018, C-019, C-020 | Content pipeline and limited device vocabulary | High ecosystem/portability cost if third-party hosting is required | CONDITIONAL |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject “no VST search result = unsupported.”** Search text was discovery-only
  and cannot prove absence. Reopen only with a current official support matrix,
  logged-in safe UI observation, or vendor answer. [C-021]
- **Reject copying the proprietary cloud/project model.** Public sources expose
  outcomes, not database, sync, render, or conflict algorithms. Reopen only for
  an official architecture paper or consented black-box interoperability test.
  [C-008, C-027]
- **Reject treating Instant Sidechain as an arbitrary sidechain bus.** The
  documented control is a rhythmic ducking pattern device. Reopen if a current
  manual documents key-track routing. [C-016, C-017]
- **Reject consumer/education compliance claims as independent security
  assurance.** The trust material is vendor-authored and some text dates to
  2020. Reopen with a current audit report or certification scope. [C-032,
  C-034]
- **Reject marketing loop counts as a stable architectural limit.** Current
  pages conflict at 24k/40k. “Tens of thousands” is sufficient for content
  scale. [C-019]
- **CURIOSITY_NO_GO — dynamic logged-in Studio probe:** high possible value but
  outside the documentary/no-credential budget.
- **CURIOSITY_NO_GO — patent archaeology for cloud rendering:** moderate
  novelty, low product/version specificity, high attribution risk and cost.
- **CURIOSITY_NO_GO — installer/binary inspection of mobile/desktop apps:**
  prohibited by this wave and unnecessary for user-visible coverage.
- **CURIOSITY_NO_GO — exhaustive effect/preset inventory:** low decision
  relevance after native-device architecture was established.
- **CURIOSITY_NO_GO — old community comments about plugin/offline behavior:**
  low confidence, stale, and unable to prove current host internals.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and result | Classification / next probe |
| --- | --- | --- |
| H1: Soundtrap is entirely server-rendered | Counterevidence: local CPU/RAM/browser/effect load changes playback; freeze frees CPU. Terms separately document upload transcode/server storage. “Entirely server-rendered” is falsified, but exact hybrid split is unresolved. | C-006 DOCUMENTED; C-007 INFERENCE; C-008 UNKNOWN. Safe next probe: consented network/CPU trace in disposable account. |
| H2: Soundtrap hosts user-installed VST/AU | Official features/help corpus documents native devices; vendor article assigns VST/AU loading to other DAWs; exact VST search returns none. No scan/instance proof. | C-020 INFERENCE; C-021 UNKNOWN. Do not upgrade to unsupported without direct evidence. |
| H3: Mobile has desktop feature parity | Falsified by current matrix: no mobile automation or MIDI input; no sampler/time stretch/reverse; no app video conference. | C-005 DOCUMENTED. |
| H4: “Instant Sidechain” proves sidechain routing | Falsified: official controls are rhythmic presets, curve, amount, and time; no key-source selection. | C-016 DOCUMENTED; C-017 UNKNOWN. |
| H5: previous versions are in-place rollback | Falsified: opening an old version creates a unique new project without the original version stack. | C-026 DOCUMENTED. |
| H6: Soundtrap has a portable editable project archive | No official export beyond audio/MIDI was found; absence is not proof. | C-027 UNKNOWN. Next probe: logged-in export menu/API documentation. |
| H7: Soundtrap supports offline editing/sync | Official search returned no offline article; bandwidth/save-load documentation establishes network dependence but not total impossibility. | C-028 UNKNOWN. Next probe: vendor statement or safe offline browser/app test. |
| H8: format accepted means full plugin host | No external format was even documented as accepted. Scan, instantiate, render, automate, persist, restore, and diagnose therefore all remain separately unproved. | C-021, C-022 UNKNOWN. |

Negative-result log: direct current help searches for `VST`, `offline`,
`comping takes`, and `punch recording` did not produce decision-grade feature
documentation. Search-result text was treated as untrusted discovery evidence,
not as product behavior.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Soundtrap is a maintained cloud/browser collaborative DAW launched in 2013; legal service provider is Soundtrap AB and current pages associate the brand with Spotify. | Current family/history | S-001, S-006 | Canonical About and terms | “By Spotify” link/footer is branding evidence, not acquisition-transaction detail. |
| C-002 | DOCUMENTED | High | Current browsers include Chrome, Firefox, Edge, Safari with OS-specific audio/MIDI differences; iOS/Android apps exist. | 2026 web/mobile | S-002, S-005, S-035 | Current support tables | Browser restrictions and rollout mean no universal parity. |
| C-003 | DOCUMENTED | High | Consumer and Education tiers gate content, versions, automation, high-quality export, podcast/vocal features, administration, and integrations. | 2026 plans | S-026 | Current plan article | Dynamic prices were inaccessible and are not claimed. |
| C-004 | DOCUMENTED | High | Studio uses linear tracks, regions, base/shadow loops, transport, tempo/key, autosave, effects, comments, and collaboration. | Current Studio UI model | S-002, S-003 | Official terminology and features | Not an internal object schema. |
| C-005 | DOCUMENTED | High | Mobile supports many core edits/instruments/effects but not automation or MIDI input, and lacks sampler/time stretch/reverse/video conference; rollout may vary. | iOS/Android app and mobile Chrome | S-004 | Explicit current matrix | Vendor warns old/new app versions coexist. |
| C-006 | DOCUMENTED | High | Uploading audio initiates automated transcoding and directs server storage; service is cloud-hosted. | Consumer terms | S-006 | Terms §§4, 10 | Does not locate mix/master/freeze execution. |
| C-007 | INFERENCE | Medium-high | Meaningful interactive playback/effect work executes on the client/device. | Web/mobile runtime | S-007, S-008, S-036 | CPU/RAM/browser/effect load and freeze behavior | Mixed client/server processing remains plausible. |
| C-008 | UNKNOWN | High impact | Exact client/server/process/render/storage/collaboration boundaries are not publicly documented. | Proprietary service internals | S-006–S-008, S-028, S-032 | User-visible outcomes do not expose topology | Next probe requires official architecture paper or safe dynamic traces. |
| C-009 | DOCUMENTED | High | Input works up to 96 kHz; MP3/Ogg/WAV delivery is documented at 44.1 kHz with listed bitrates. | Current audio I/O | S-009, S-037 | Current export and audio-interface support statements | Internal precision and WAV bit depth not stated. |
| C-010 | DOCUMENTED | High | Overload recovery progressively reduces preview fidelity, disables reverb, then freezes tracks to less resource-consuming audio while preserving originals. | Browser/device playback | S-008 | Explicit three-step article | Exact renderer/cache location unknown. |
| C-011 | DOCUMENTED | High | Soundtrap provides placement calibration and a Low Latency Mode that disables latency-prone effects; monitoring latency varies by device/OS/effects. | Recording | S-007 | Current latency guide | No measured latency values or PDC contract. |
| C-012 | UNKNOWN | High impact | Buffering, internal precision, PDC, multicore scheduling, oversampling, deterministic/offline render, tails, dropout logs, comping, and numeric track limits are undocumented. | Audio engine/editing | S-007–S-009, S-036, S-042, S-043 | Coverage search found user guidance only | Must be tested, not inferred. |
| C-013 | DOCUMENTED | High | MIDI piano roll supports editable notes/velocity/pitch, MIDI-file I/O, patterns, and USB/5-pin keyboard input on documented desktop platforms; note maps are not customizable. | MIDI | S-011, S-012, S-021 | Official hardware/editor/file docs | “All keyboards” is vendor compatibility claim, not independent qualification. |
| C-014 | UNKNOWN | High impact | MPE, MIDI 2.0, SysEx, clock/MTC, per-note expression, and sample-accurate events are undocumented. | MIDI expression/sync | S-011, S-012 | Current MIDI docs omit contracts | Omission is not proof of unsupported behavior. |
| C-015 | DOCUMENTED | High | Browser track automation covers volume, pan, Sweep, and some effect parameters with editable points; mobile automation is unavailable. | Automation | S-004, S-010 | Explicit article/matrix | Automation rate/interpolation/parameter IDs unknown. |
| C-016 | DOCUMENTED | High | Stock effects attach to a track, user presets can save tweaked setups, and Instant Sidechain is a rhythmic ducking device. | Native devices | S-013–S-015 | Official device docs | Does not prove arbitrary routing or external-plugin state. |
| C-017 | UNKNOWN | High impact | Buses, sends/returns, VCAs, arbitrary sidechains, multi-output, surround, OSC, and control APIs are undocumented. | Routing/control | S-010, S-013, S-015 | Available docs show track controls only | Absence from selected docs is not exclusion proof. |
| C-018 | DOCUMENTED | High | Soundtrap supplies stock synths/instruments, Patterns, 808, Chords, and a paid 30-second sample-import Sampler. | Native instruments | S-002, S-016, S-017 | Current feature/support pages | Full inventory and device implementation unknown. |
| C-019 | DOCUMENTED | Medium-high | Audio/MIDI loops and private user loops are first-class content; current vendor library counts conflict, so only “tens of thousands” is stable. | Content/loops | S-002, S-012, S-018, S-038 | Current pages and user-loop workflow | Marketing totals conflict and change by plan/date. |
| C-020 | INFERENCE | Medium | User-installed VST/AU hosting is likely excluded in favor of no-install native instruments/effects. | Current family | S-002, S-033, S-034 | Vendor assigns VST/AU loading to other DAWs; no VST help result | No direct “unsupported” statement; must remain inference. |
| C-021 | UNKNOWN | High impact | No external required plugin format has a current official acceptance/scan/instantiate statement. | All editions/platforms | S-002, S-033, S-034 | Negative search retained only as attempted method | Dynamic logged-in UI/vendor response could discriminate. |
| C-022 | UNKNOWN | High impact | External plugin scan, isolation, processing, UI, parameter, latency, state, recall, recovery, and diagnostics contracts are unknown. | Third-party hosting | S-013, S-020, S-021, S-033 | Hosting prerequisite is unproved | Native devices/file import cannot substitute. |
| C-023 | DOCUMENTED | High | Audio import supports MP3/WAV/AIF/MP4/M4A/Ogg/AAC with no stated size cap, subject to RAM/browser playback. | Media import | S-019, S-036 | Current official articles | Transcode codec and relinking unknown. |
| C-024 | DOCUMENTED | High | Export supports 44.1-kHz mixes, per-track WAV with/without most effects, and per-track MIDI; MIDI can transfer to Flat.io/Noteflight. | Interchange | S-009, S-020, S-021 | Official export docs | No editable project archive or full notation export proved. |
| C-025 | DOCUMENTED | High | Projects support real-time link/email collaboration, autosave, and timestamped/resolvable/editable comments. | Collaboration | S-022, S-023 | Current official articles | Conflict/merge algorithm unknown. |
| C-026 | DOCUMENTED | High | Eligible plans create versions on project/tab exit; restoration creates a separate project without inherited version history. | Versioning | S-024, S-026 | Explicit article plus plan gate | Retention count/duration unknown. |
| C-027 | UNKNOWN | High impact | Editable project schema/archive, migration, conflict handling, asset recovery, and full-fidelity exchange are unknown. | Persistence | S-006, S-019–S-024 | Only cloud behavior and media interchange documented | No AAF/OMF/ADM/MusicXML/DAWproject evidence. |
| C-028 | UNKNOWN | Medium-high | Network save/load is documented, but offline edit/cache/reconciliation behavior is not. | Browser/mobile persistence | S-025, S-041 | Bandwidth guide quantifies cloud transfer; exact help search retained as negative only | Search absence is not proof. |
| C-029 | DOCUMENTED | High | Projects can be auto-mastered after save and published to YouTube/SoundCloud; podcast RSS can be claimed on Spotify. | Delivery | S-031, S-032, S-040 | Current support workflows | Mastering/publish execution internals unknown. |
| C-030 | DOCUMENTED | High | Practical scaling depends on CPU/RAM/browser, tracks/effects/media length, and bandwidth; no fixed import-size cap is stated. | Performance | S-008, S-025, S-036 | Multiple official support articles | No benchmark or numeric track ceiling. |
| C-031 | DOCUMENTED | High | Privacy policy covers creative/interaction/technical usage data and service-provider sharing; Education lists AWS/Google hosting and Ably chat subprocessors. | Privacy/service dependencies | S-027, S-028 | Current linked legal disclosures | Provider names do not reveal architecture or independent assurance. |
| C-032 | UNKNOWN | High impact | Encryption, tenant isolation, key management, certification scope, secure SDLC, recovery objectives, and plugin crash containment are not public. | Security/reliability | S-027, S-028 | Privacy/security statements remain high level | Vendor commitments are not independent tests. |
| C-033 | DOCUMENTED | High | Keyboard, skip-link, slider/list, screen-reader navigation and musical-typing-disable guidance exists. | Accessibility | S-029 | Current official guide | No current VPAT/WCAG conformance report retained. |
| C-034 | DOCUMENTED | High for features; medium for compliance | Education adds walled garden/minimal profiles, groups, assignments, admin and LMS/SSO; compliance language is vendor-asserted. | Education | S-026, S-039 | Current plan and child-safety support articles | No independent regulatory audit cited. |
| C-035 | DOCUMENTED | High | Users retain their content; Soundtrap receives service rights; sample content is royalty-free in original works but standalone redistribution is barred. | Licensing/content | S-006, S-030 | Terms and current copyright article | Not legal advice; jurisdictional terms vary. |
| C-036 | UNKNOWN | Medium-high | No readable current public scripting/device/plugin SDK or stable authoring API contract was found. | Extensibility | S-006 | Terms mention APIs only as part of service definition | Logged-in/partner docs could exist. |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Vendor claims document what the vendor
says; they are not independent measurements.

- **S-001 — “About Soundtrap,” Soundtrap.** URL:
  https://www.soundtrap.com/about. Kind/scope: canonical current product/history
  page, 2026. Passage: cloud DAW, browser, real-time collaborators, 2013 launch.
  Claims: C-001. Limitation: marketing/history claim. Selected over secondary
  company profiles because it is the canonical vendor identity page.
- **S-002 — “Get to know our pro features,” Soundtrap.** URL:
  https://www.soundtrap.com/content/features. Kind/scope: current product page.
  Passage: 50+ stock effects, native instruments, 100% web-based, macOS desktop
  beta statement. Claims: C-002, C-004, C-018–C-021. Limitation: marketing and
  potentially stale desktop-app line. Selected as the broad current feature
  inventory, cross-checked with support articles.
- **S-003 — “Soundtrap Terminology and Features: A Complete Guide,” Soundtrap
  Support.** URL: https://support.soundtrap.com/hc/en-us/articles/5216945579794-Soundtrap-Terminology-and-Features-A-Complete-Guide.
  Kind/scope: official support, updated 2026-07-28. Passage: track/region/loop,
  autosave, automation, collaboration, latency-calibration vocabulary. Claims:
  C-004. Limitation: UI labels, not data model. Selected because it is the most
  precise official object/terminology map.
- **S-004 — “What Soundtrap Features Are Available on Mobile Devices?,”
  Soundtrap Support.** URL: https://support.soundtrap.com/hc/en-us/articles/6243478757266-What-Soundtrap-Features-Are-Available-on-Mobile-Devices.
  Kind/scope: official matrix, updated 2026-08-05. Passage: iOS/Android app and
  mobile-Chrome capability table plus rollout warning. Claims: C-002, C-005,
  C-015, C-018. Limitation: rollout means an individual app may differ. Selected
  over app-store marketing because it exposes negative capabilities.
- **S-005 — “What Browsers Does Soundtrap Support?,” Soundtrap Support.** URL:
  https://support.soundtrap.com/hc/en-us/articles/205664381-What-Browsers-Does-Soundtrap-Support.
  Kind/scope: official browser/OS matrix, updated 2026-07-28. Passage: supported
  browsers and monitoring/audio-input/MIDI matrix. Claims: C-002, C-013.
  Limitation: “x” reports vendor support, not independent tests. Selected as the
  platform compatibility primary source.
- **S-006 — “Soundtrap Terms of Use” (ROW), Soundtrap AB.** URL:
  https://docs.google.com/document/d/e/2PACX-1vQTLQruQ43Qfwk7MW3_1iHEIYjTwTLDqI9Z2YtSNLlDvIaZ-eotFZ-5OYCeLBsy0w/pub.
  Kind/scope: official legal terms, effective 2023-07-01 and currently linked.
  Passage: cloud hosting/collaboration; upload transcode/server storage; user
  content ownership/licence; sample-content rules. Claims: C-001, C-006, C-008,
  C-027, C-035, C-036. Limitation: legal service description is not engineering
  documentation; regional terms vary. Selected because it is the only primary
  source explicitly describing transcode/storage.
- **S-007 — “How to Fix Latency Issues in Soundtrap,” Soundtrap Support.** URL:
  https://support.soundtrap.com/hc/en-us/articles/26663690434066-How-to-Fix-Latency-Issues-in-Soundtrap.
  Kind/scope: official current troubleshooting, updated 2026-08-05. Passage:
  monitoring latency factors, 64–128 sample interface suggestion, Low Latency
  Mode, calibration. Claims: C-007, C-011, C-012. Limitation: guidance, not
  measured engine behavior. Selected because it distinguishes monitoring and
  placement latency.
- **S-008 — “Why Is My Soundtrap Project Overloaded? How to Fix It,” Soundtrap
  Support.** URL: https://support.soundtrap.com/hc/en-us/articles/205666161-Why-Is-My-Soundtrap-Project-Overloaded-How-to-Fix-It.
  Kind/scope: official current support, updated 2026-07-29. Passage: ordered
  High/Medium/Low degradation and freeze. Claims: C-007, C-010, C-012, C-030.
  Limitation: no renderer location. Selected because it is unusually precise
  about adaptive audio behavior.
- **S-009 — “What Audio Quality and File Types Does Soundtrap Support?,”
  Soundtrap Support.** URL: https://support.soundtrap.com/hc/en-us/articles/360012418214-What-Audio-Quality-and-File-Types-Does-Soundtrap-Support.
  Kind/scope: official delivery spec, updated 2026-07-29. Passage: MP3/Ogg/WAV
  44.1-kHz table and WAV entitlement. Claims: C-009, C-024. Limitation: says
  bitrate, not bit depth/internal precision. Selected as exact export evidence.
- **S-010 — “How to Use Track Automations in Soundtrap,” Soundtrap Support.**
  URL: https://support.soundtrap.com/hc/en-us/articles/205662071-How-to-Use-Track-Automations-in-Soundtrap.
  Kind/scope: official feature guide, updated 2026-07-27. Passage: volume/pan/
  Sweep/effect automation and mobile exclusion. Claims: C-015, C-017. Limitation:
  no rate/interpolation/identity. Selected as direct automation evidence.
- **S-011 — “What MIDI Keyboards and Devices Does Soundtrap Support?,”
  Soundtrap Support.** URL: https://support.soundtrap.com/hc/en-us/articles/205505362-What-MIDI-Keyboards-and-Devices-Does-Soundtrap-Support.
  Kind/scope: official MIDI hardware guide, updated 2026-07-28. Passage: USB/
  5-pin support and non-customizable note map. Claims: C-013, C-014. Limitation:
  broad “all keyboards” claim not independently qualified. Selected for hardware
  boundary and explicit mapping limit.
- **S-012 — “Create Music with Soundtrap's Online MIDI Editor,” Soundtrap.**
  URL: https://www.soundtrap.com/content/product/online-midi-editor. Kind/scope:
  current product documentation. Passage: piano roll, note timing/velocity/
  pitch, instruments, patterns, cloud storage. Claims: C-013, C-014. Limitation:
  marketing/tutorial language. Selected to complement hardware/file support.
- **S-013 — “How to Add Effects in Soundtrap,” Soundtrap Support.** URL:
  https://support.soundtrap.com/hc/en-us/articles/205662641-How-to-Add-Effects-in-Soundtrap.
  Kind/scope: official current device guide. Passage: selected effects attach to
  current track. Claims: C-016, C-022. Limitation: no chain/state internals.
  Selected as the clearest native insert boundary.
- **S-014 — “How to Create and Save a Preset in Soundtrap,” Soundtrap Support.**
  URL: https://support.soundtrap.com/hc/en-us/articles/4562524383122-How-to-Create-and-Save-a-Preset-in-Soundtrap.
  Kind/scope: official current preset guide. Passage: tweak effects, name/save to
  My Preset Collection. Claims: C-016. Limitation: serialization/storage
  unspecified. Selected for state/preset evidence.
- **S-015 — “How to Use Instant Sidechain in Soundtrap,” Soundtrap Support.**
  URL: https://support.soundtrap.com/hc/en-us/articles/18124987619090-How-to-Use-Instant-Sidechain-in-Soundtrap.
  Kind/scope: official current device guide. Passage: rhythmic presets, curve,
  amount, time. Claims: C-016, C-017. Limitation: does not explicitly say
  arbitrary key input is impossible. Selected to prevent overreading the name.
- **S-016 — “Explore Soundtrap's Instruments,” Soundtrap.** URL:
  https://www.soundtrap.com/content/instruments. Kind/scope: current product
  page. Passage: Chords, Retro Synth, Sampler, Patterns, 808. Claims: C-018.
  Limitation: inventory marketing. Selected as canonical native instrument map.
- **S-017 — “How to Use the Sampler in Soundtrap,” Soundtrap Support.** URL:
  https://support.soundtrap.com/hc/en-us/articles/11278251612818-How-to-Use-the-Sampler-in-Soundtrap.
  Kind/scope: official current guide. Passage: paid feature, 30-second import,
  loop/fade/crossfade/mode. Claims: C-018. Limitation: implementation unknown.
  Selected for architecture-relevant sample ownership/edit controls.
- **S-018 — “How to Create and Save Your Own Loops in Soundtrap,” Soundtrap
  Support.** URL: https://support.soundtrap.com/hc/en-us/articles/18976256816274-How-to-Create-and-Save-Your-Own-Loops-in-Soundtrap.
  Kind/scope: official current guide. Passage: merge/add to private My Loops,
  key metadata, collaboration/export sharing. Claims: C-019. Limitation: no
  storage format. Selected for user-loop lifecycle.
- **S-019 — “What Audio File Types Does Soundtrap Support?,” Soundtrap Support.**
  URL: https://support.soundtrap.com/hc/en-us/articles/205664281-What-Audio-File-Types-Does-Soundtrap-Support.
  Kind/scope: official current import matrix. Passage: MP3/WAV/AIF/MP4/M4A/Ogg/
  AAC. Claims: C-023, C-027. Limitation: codec/profile details absent. Selected
  as exact media-import evidence.
- **S-020 — “How to Export Tracks in Soundtrap,” Soundtrap Support.** URL:
  https://support.soundtrap.com/hc/en-us/articles/205664181-How-to-Export-Tracks-in-Soundtrap.
  Kind/scope: official current export guide. Passage: per-track WAV with/without
  effects; Vocal Tuner/Voice Transform exception. Claims: C-022, C-024.
  Limitation: does not reveal render location. Selected for stem/state behavior.
- **S-021 — “How to Import and Export MIDI Files in Soundtrap,” Soundtrap
  Support.** URL: https://support.soundtrap.com/hc/en-us/articles/205659501-How-to-Import-and-Export-MIDI-Files-in-Soundtrap.
  Kind/scope: official current file workflow. Passage: `.mid` drag/drop,
  per-track export, Flat.io/Noteflight, plan gates. Claims: C-013, C-024.
  Limitation: MIDI version/event coverage unspecified. Selected for interchange.
- **S-022 — “How to Invite Users to Collaborate on a Soundtrap Project,”
  Soundtrap Support.** URL: https://support.soundtrap.com/hc/en-us/articles/360023195053-How-to-Invite-Users-to-Collaborate-on-a-Soundtrap-Project.
  Kind/scope: official current collaboration guide. Passage: autosave, real
  time, desktop/mobile web/app, link/email invitations. Claims: C-025.
  Limitation: no concurrency algorithm. Selected as direct collaboration source.
- **S-023 — “How to Use the Comment Panel in Soundtrap,” Soundtrap Support.**
  URL: https://support.soundtrap.com/hc/en-us/articles/6611281939474-How-to-Use-the-Comment-Panel-in-Soundtrap.
  Kind/scope: official current guide. Passage: timestamp, reply, resolve, filter,
  edit, copy link. Claims: C-025. Limitation: current text has a mention-feature
  inconsistency. Selected for collaboration object semantics.
- **S-024 — “How to Restore Previous Project Versions in Soundtrap,” Soundtrap
  Support.** URL: https://support.soundtrap.com/hc/en-us/articles/115002725805-How-to-Restore-Previous-Project-Versions-in-Soundtrap.
  Kind/scope: official current version guide. Passage: snapshot triggers and
  restore-as-unique-project without inherited history. Claims: C-026, C-027.
  Limitation: retention/count unspecified. Selected for precise version model.
- **S-025 — “What Is the Minimum Bandwidth Recommendation for Soundtrap?,”
  Soundtrap Support.** URL: https://support.soundtrap.com/hc/en-us/articles/115000430253-What-Is-the-Minimum-Bandwidth-Recommendation-for-Soundtrap.
  Kind/scope: official current network guide. Passage: 1 Mbit minimum, audio
  save/load transfer, classroom guidance. Claims: C-028, C-030. Limitation:
  recommendation is not an offline statement. Selected for cloud-dependency
  evidence.
- **S-026 — “What are the differences between Soundtrap's subscription plans?,”
  Soundtrap Support.** URL: https://support.soundtrap.com/hc/en-us/articles/360023190973-What-are-the-differences-between-Soundtrap-s-subscription-plans.
  Kind/scope: official plans, updated 2026-01-26. Passage: consumer and Education
  feature tiers/integrations. Claims: C-003, C-026, C-034. Limitation: no current
  prices and compliance claims are vendor assertions. Selected over inaccessible
  dynamic pricing pages.
- **S-027 — “Soundtrap Privacy Policy,” Soundtrap AB.** URL:
  https://docs.google.com/document/d/e/2PACX-1vQxnbDC8-5EEb3N4SvnyVmzldTmGER6dWSbE0fTkr_oV5Ub8ZSknqnha9hKrUbmpT9NldTy6F3yo_6K/pub.
  Kind/scope: official policy, effective 2023-07-01 and currently linked.
  Passage: usage/content/technical data, purposes, sharing, rights, retention.
  Claims: C-031, C-032. Limitation: policy age and broad control language.
  Selected as primary consumer privacy evidence.
- **S-028 — “Soundtrap for Education Sub-processors,” Soundtrap.** URL:
  https://docs.google.com/document/d/e/2PACX-1vSZo8io7qFWP_ev0U4vd3mxYnkrsMEgL70LHDfjesd6aUD3BnKOuQ8_4xu9a9B-7jzXadX3mwZ-_dts/pub.
  Kind/scope: official list, updated 2026-08-25. Passage: AWS/Google hosting,
  Ably chat, other processors/residencies. Claims: C-008, C-031, C-032.
  Limitation: Education scope and no service-to-provider mapping. Selected
  because it is the freshest infrastructure-related disclosure.
- **S-029 — “Soundtrap Accessibility: Navigation Guide,” Soundtrap Support.**
  URL: https://support.soundtrap.com/hc/en-us/articles/6262048247058-Soundtrap-Accessibility-Navigation-Guide.
  Kind/scope: official current accessibility guide. Passage: keyboard, skip
  links, screen-reader navigation, musical-typing toggle. Claims: C-033.
  Limitation: not a conformance audit. Selected over generic accessibility
  marketing.
- **S-030 — “Can I Use Soundtrap Loops for Commercial Purposes?,” Soundtrap
  Support.** URL: https://support.soundtrap.com/hc/en-us/articles/205503122-Can-I-Use-Soundtrap-Loops-for-Commercial-Purposes.
  Kind/scope: official current licensing summary. Passage: royalty-free use and
  standalone redistribution prohibition. Claims: C-035. Limitation: summary,
  subordinate to terms and not legal advice. Selected for a concise current
  content-license boundary.
- **S-031 — “How to Upload Your Soundtrap Songs to YouTube and SoundCloud,”
  Soundtrap Support.** URL: https://support.soundtrap.com/hc/en-us/articles/209612009-How-to-Upload-Your-Soundtrap-Songs-to-YouTube-and-SoundCloud.
  Kind/scope: official current publishing guide. Passage: direct publish and
  export for other platforms. Claims: C-029. Limitation: external-service flows
  can change. Selected as direct delivery evidence.
- **S-032 — “How to Use Mastering Presets in Your Projects in Soundtrap,”
  Soundtrap Support.** URL: https://support.soundtrap.com/hc/en-us/articles/205660071-How-to-Use-Mastering-Presets-in-Your-Projects-in-Soundtrap.
  Kind/scope: official current mastering guide. Passage: automatic post-save
  mastering, whole-track set, limiter/compressor/EQ, styles/off. Claims: C-008,
  C-029. Limitation: execution location/target unspecified. Selected because it
  states when and what the delivery process does.
- **S-033 — “Virtual Instruments: Complete Guide…,” Soundtrap Blog.** URL:
  https://blog.soundtrap.com/making-music-virtual-instruments/. Kind/scope:
  vendor-authored 2024 article, current site. Passage: Soundtrap instruments
  need no install; “other DAWs” load VST/AU. Claims: C-020–C-022. Limitation:
  tutorial/blog wording is indirect and cannot prove exclusion. Selected as the
  strongest official external-format clue after no support matrix was found.
- **S-034 — Official help-center search for `VST`, Soundtrap Support.** URL:
  https://support.soundtrap.com/hc/en-us/search?query=VST. Kind/scope:
  discovery-only negative result on 2026-08-29. Passage: “No results for VST.”
  Claims: attempted-method evidence for C-020/C-021 only. Limitation: search
  indexes can omit content and search text is untrusted; it does not prove
  unsupported behavior. Retained specifically to preserve the negative result.
- **S-035 — “What Are the System Requirements for the Soundtrap App?,”
  Soundtrap Support.** URL: https://support.soundtrap.com/hc/en-us/articles/360017434459-What-Are-the-System-Requirements-for-the-Soundtrap-App.
  Kind/scope: official current mobile policy, updated 2026-07-28. Passage:
  current plus two prior iOS/Android majors; some old devices disable Studio.
  Claims: C-002, C-005. Limitation: no build numbers/hardware floor. Selected
  over app-store snapshots for the vendor support policy.
- **S-036 — “What Is the File Size Limit for Importing Files into Soundtrap?,”
  Soundtrap Support.** URL: https://support.soundtrap.com/hc/en-us/articles/360010469920-What-Is-the-File-Size-Limit-for-Importing-Files-into-Soundtrap.
  Kind/scope: official current support. Passage: no fixed cap; RAM/browser
  playback limit practical count. Claims: C-007, C-012, C-023, C-030.
  Limitation: no benchmark or browser-specific ceiling. Selected for explicit
  scaling semantics.
- **S-037 — “How to Fix High Sample Rate Issues in Soundtrap,” Soundtrap
  Support.** URL: https://support.soundtrap.com/hc/en-us/articles/206014502-How-to-Fix-High-Sample-Rate-Issues-in-Soundtrap.
  Kind/scope: official current audio-interface guidance, updated 2026-07-30.
  Passage: Soundtrap works with device sample rates up to 96 kHz and suggests
  44.1 kHz for most cases. Claims: C-009. Limitation: does not identify internal
  project/render rate. Selected to separate accepted input-device rate from
  S-009's delivery rate.
- **S-038 — “Music Production, made simple,” Soundtrap.** URL:
  https://www.soundtrap.com/musicmakers. Kind/scope: current 2026 product page.
  Passage: virtual instruments, loops/content, collaboration, automation, and
  “up to 24,000+” loops. Claims: C-019. Limitation: marketing count conflicts
  with S-002's 40,000 and can vary by plan. Selected to retain and rationalize
  the current count contradiction rather than silently choose one number.
- **S-039 — “Soundtrap Security Regulations for Children and COPPA Compliance,”
  Soundtrap Support.** URL: https://support.soundtrap.com/hc/en-us/articles/115003152169-Soundtrap-Security-Regulations-for-Children-and-COPPA-Compliance.
  Kind/scope: official Education safety article, updated 2026-07-28. Passage:
  under-13 Education boundary, walled garden, external-contact restriction, and
  minimal profile. Claims: C-034. Limitation: compliance is vendor-asserted and
  the article reproduces older third-party legal guidance. Selected for the
  concrete Education account controls, not as independent assurance.
- **S-040 — “How to Claim Your Soundtrap Podcast on Spotify,” Soundtrap
  Support.** URL: https://support.soundtrap.com/hc/en-us/articles/4776297302546-How-to-Claim-Your-Soundtrap-Podcast-on-Spotify.
  Kind/scope: official current podcast workflow, updated 2026-07-28. Passage:
  copy Soundtrap RSS URL, verify ownership, and claim in Spotify for Podcasters.
  Claims: C-029. Limitation: external Spotify flow can change. Selected to
  support the podcast-publishing boundary independently of music publishing.
- **S-041 — Official help-center search for `offline`, Soundtrap Support.** URL:
  https://support.soundtrap.com/hc/en-us/search?query=offline. Kind/scope:
  discovery-only negative result on 2026-08-29. Passage: “No results for
  offline.” Claims: attempted-method evidence for C-028 only. Limitation: search
  indexing can omit content and cannot prove lack of offline support. Retained
  to preserve the consequential negative result.
- **S-042 — Official help-center search for `comping takes`, Soundtrap Support.**
  URL: https://support.soundtrap.com/hc/en-us/search?query=comping%20takes.
  Kind/scope: discovery-only noisy result on 2026-08-29. Passage: no direct
  comping/take feature article among returned results. Claims: attempted-method
  evidence for C-012 only. Limitation: search text is untrusted and omission is
  not exclusion. Retained to preserve the negative search.
- **S-043 — Official help-center search for `punch recording`, Soundtrap
  Support.** URL: https://support.soundtrap.com/hc/en-us/search?query=punch%20recording.
  Kind/scope: discovery-only noisy result on 2026-08-29. Passage: returned
  generic recording articles but no direct punch feature contract. Claims:
  attempted-method evidence for C-012 only. Limitation: search indexing and
  terminology may miss a feature. Retained to preserve the negative search.

### Bibliography rationale

The retained set favors current official support matrices, legal disclosures,
and exact workflow articles over reviews. Marketing pages were retained only
where no equivalent manual inventory existed and were bounded as vendor claims.
S-034 and S-041–S-043 are retained solely as negative discovery results, not
feature evidence.
Community comments, competitor comparisons, and search snippets were rejected
because they cannot establish current product behavior or internals.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Decision impact | Safest next probe | Required access / owner |
| --- | --- | --- | --- | --- |
| Exact client/server render split | Terms, performance, latency, mastering, and subprocessor docs reviewed; no architecture paper | High: determines offline, latency, privacy, scalability | Disposable consented project; record CPU/network traces during playback, freeze, save, and export | Test account, browser profiler; unassigned |
| Any external plugin host | Feature/help corpus plus exact VST search and official blog reviewed; no direct support statement | High: ecosystem and trust boundary | Ask vendor for current format matrix or inspect logged-in Add Track/Effects menus without installing a plugin | Vendor response or safe account; unassigned |
| Full host contract if any | No format acceptance, scan, or instance evidence | High: interoperability fidelity | Only after a format is confirmed, qualify scan→instantiate→render→automation→save→restore→failure | Disposable signed fixtures; unassigned |
| Editable project format/archive | Import/export/version docs expose only media and cloud copies | High: portability/durability | Inspect current export menu and request documented archive/export schema | Safe account/vendor docs; unassigned |
| Collaboration merge/conflict model | Real-time and comments documented; protocol proprietary | High: correctness under concurrency | Two-account differential edit test with induced disconnect/reconnect | Two disposable accounts; unassigned |
| Offline support/reconciliation | Official offline search negative; bandwidth guide only | Medium-high: mobile/browser resilience | Safe app/browser offline edit/save/reconnect matrix | Disposable projects/devices; unassigned |
| Engine precision/PDC/buffer/render determinism | Current audio docs provide sample-rate and troubleshooting only | High: professional audio suitability | Loopback/impulse/phase/null tests at supported rates and latent native effects | Audio fixture/interface; unassigned |
| Routing/multichannel/MPE/MIDI 2 | Automation, MIDI, sidechain docs reviewed; contracts absent | High for pro workflows | Vendor matrix first; then safe UI and loopback qualification | Hardware fixtures; unassigned |
| Security assurance | Privacy/subprocessors and vendor commitments are high level | High for Education/cloud content | Obtain current SOC/ISO/penetration summary, DPA security annex, incident/backup commitments | Vendor trust package/legal review; unassigned |
| Mobile rollout parity | Official article warns old/new versions differ | Medium: reproducibility | Record exact app builds and repeat capability matrix | App-store builds/devices; unassigned |
| Version retention and deletion | Restore triggers documented, retention/count absent | Medium: durability/cost | Vendor policy or long-running controlled project | Test account/time; unassigned |
| Semantic release/version history | Web service is continuous; no release log retained | Low-medium: reproducibility | Vendor changelog or build identifier exposed in support payload | Public/login UI; unassigned |

## 24. Curiosity pass and stop decision

### Candidate scoring after first synthesis

Scores are 1–5; lower cost is better. `Qualifies` required high decision
relevance and a source path likely to change a conclusion.

| Thread | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Direct evidence for external plugin exclusion/hosting | 5 | 5 | 4 | 2 | **PURSUE** — official search plus vendor virtual-instrument article; result remained inference/unknown |
| Client/server render topology | 5 | 4 | 5 | 5 | CURIOSITY_NO_GO — public docs saturated; next discriminator is dynamic/vendor access |
| Offline queue/reconciliation | 4 | 4 | 4 | 4 | CURIOSITY_NO_GO — no official source; requires dynamic disconnect test |
| Conflict-resolution algorithm | 4 | 4 | 5 | 5 | CURIOSITY_NO_GO — proprietary; realtime marketing cannot discriminate |
| Exhaustive native device inventory | 2 | 2 | 1 | 3 | CURIOSITY_NO_GO — architecture conclusion already stable |
| Patent/history search | 2 | 2 | 4 | 5 | CURIOSITY_NO_GO — weak current-version attribution |
| Exact marketing loop total | 1 | 1 | 1 | 2 | CURIOSITY_NO_GO — conflict recorded; total is not architecture-critical |

### Curiosity result

The pursued plugin thread found indirect official evidence for a native-only
experience and a preserved exact-search negative, but no acceptance or explicit
exclusion statement. The correct conclusion did not change: external formats
remain `UNKNOWN`, with only a medium-confidence exclusion inference. [C-020,
C-021]

### Gaps and contradictions at stop

- Current official content-library totals conflict at 24k/40k. [C-019]
- The mobile matrix warns of an in-progress app rollout; exact build parity is
  unresolved. [C-005]
- Feature marketing still describes a macOS desktop beta, while the support
  section lists both Mac and Windows desktop-app guides; desktop wrappers were
  contextual and outside the requested browser/mobile focus. [C-002]
- Comment documentation shows an `@` workflow in steps but later says mentions
  are not supported yet; mention behavior was not claimed. [C-025]
- Consumer privacy/terms are currently linked but effective 2023; Education
  subprocessors were updated 2026-08-25. [C-031]

### Stop decision

**STOP — coverage and documentary saturation reached.** All required headings
and plugin rows are complete; core browser/cloud/mobile behavior is triangulated
from primary sources; one high-value curiosity thread was pursued; further
public-source passes repeatedly led to the same vendor support corpus or
marketing duplicates. Remaining questions require logged-in dynamic probes,
vendor disclosures, or assurance documents and are explicitly outside this
wave. Marginal public-document evidence is nonpositive.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added
  `research/daw-landscape/dossiers/soundtrap.md`; no other path was written.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0 records the continuous 2026 snapshot, all plan families, browser/
  mobile scope, and exclusions.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-001–C-036; the register classifies each as DOCUMENTED, INFERENCE, or
  UNKNOWN.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** The
  claims register, source ledger, and Section 23 provide attempted methods,
  impact, blocker, and next probe.
- [x] **Every required plugin-format row is present.** VST2, VST3, AUv2, AUv3,
  AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, Rack Extension, and
  product-native/other are included.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover discovery, isolation, processing, parameters/state,
  UI, diagnostics, and recovery, all honestly unknown for external formats.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** Especially client processing, plugin exclusion, cloud topology,
  security assurance, and offline behavior.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 covers
  proprietary service/content terms, user content, sample restrictions, and
  format-license non-claims.
- [x] **Bibliography records source rationale and limitations.** Section 22 has
  43 retained sources with publisher, URL, kind/scope, passage, claims,
  limitation, and selection rationale.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19
  and 24 record scoring, the single pursued thread, and rejected threads.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Documentary public sources only; no product install,
  login, binary execution, reverse engineering, staging, or commit.

**Checks performed:** governing-file/template comparison; heading-order review;
13-row plugin-matrix count; claim/source cross-reference review; negative-result
and unknown audit; curiosity/stop audit; repository status read before writing.

**Concise result:** complete dossier with 43 retained sources, 36 classified
claims, all required matrix rows, 12 consequential unknown/probe entries, and a
saturated documentary stop.

**Unresolved blockers:** no direct official external plugin support/exclusion
statement; no public service/render/project architecture; no offline/conflict
contract; no current independent security assurance; mobile rollout varies.

**Pre-existing workspace changes:** numerous unrelated modified/untracked files
were present before this write, including the untracked `research/daw-landscape/`
tree; they were read only where governing this dossier and otherwise left
untouched.
