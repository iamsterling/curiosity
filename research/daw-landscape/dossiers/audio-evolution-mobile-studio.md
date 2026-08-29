# Audio Evolution Mobile Studio DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Audio Evolution Mobile Studio / Audio Evolution Mobile (AEMS) |
| Canonical vendor | eXtream Software Development; iOS seller listed as Davy Wentzler |
| Researcher/session | Research subagent, session `ses_fb2729283ffeY7J4NDx6shZkwy` |
| Owned path | `research/daw-landscape/dossiers/audio-evolution-mobile-studio.md` |
| Research date/cutoff | 2026-08-29 UTC |
| Current release evidence | iOS/iPadOS 7.2.8, App Store listing accessed 2026-08-29; Android semantic version not exposed in the retrieved listing, last updated 2026-08-21 [C-002] |
| Editions/licensing | Paid Android and iOS apps with optional in-app purchases; Android also has a trial [C-003] |
| Platforms included | Current Android and iPhone/iPad family; Android 11+ storage behavior; iOS 12+ current storefront requirement [C-001] [C-002] |
| Included | Mobile audio/MIDI workflow; native devices/content; iOS Audio Unit and IAA hosting; Android plug-in-status investigation; USB audio/MIDI; files, cloud, interchange, recovery, and current desktop boundary |
| Excluded | Binary inspection, decompilation, proprietary implementation, unsafe plug-in installation, exhaustive hardware testing, and unrelated eXtream products |
| Completion | `COMPLETE_WITH_UNKNOWNS` |

Product naming varies between “Audio Evolution Mobile Studio” in storefronts and
“Audio Evolution Mobile” on vendor pages/manuals; the vendor presents them as the
same Android/iOS family [DOCUMENTED; C-001].

## 1. Executive summary

AEMS is a maintained, touch-oriented linear multitrack audio/MIDI DAW for
Android and iPhone/iPad, with a common arranger/mixer/project model and
platform-specific hardware and extension boundaries [DOCUMENTED; C-001,
C-002, C-004]. Its differentiators are non-destructive mobile audio editing,
typed audio/MIDI/drum tracks, a serial/parallel native FX grid, reversible
freeze, detailed mobile USB support, cross-mobile projects, and local-first
project storage with cloud/portal transfer [DOCUMENTED; C-005, C-011, C-016,
C-026, C-027, C-028].

The plug-in headline is asymmetric. Current iOS 7.2.8 advertises Audio Unit
instruments, effects, AU MIDI, and multi-output instruments, while the manual
also documents still-available but Apple-deprecated IAA and its separate-app UI
model [DOCUMENTED; C-021, C-023]. Treating this current iOS extension path as
AUv3 is a high-confidence platform inference from Apple's Audio Unit app-
extension model, not an AEMS statement using the versioned name [INFERENCE;
C-022]. Android documentation and current storefront metadata identify native
and app-integrated IAP instruments/effects but no third-party plug-in host; AAP
upstream does not list AEMS as a host [UNKNOWN/INFERENCE; C-025, C-033].
ToneBoosters products called “VST effects” are confined to AEMS and do not prove
VST hosting [DOCUMENTED/INFERENCE; C-020].

Major unknowns are AEMS-specific AU validation/cache/quarantine, execution
process, crash containment, parameter identity, sample-accurate automation,
latency/tail/dynamic-I/O handling, project state, missing-plug-in placeholders,
and Android third-party hosting [UNKNOWN; C-024, C-025]. Current desktop AEMS
availability is also unresolved: current vendor navigation is mobile-only, but
an older Android overview mentions a Windows version [INFERENCE/UNKNOWN;
C-029]. Overall confidence is **high** for the user-visible mobile workflow,
current iOS format availability, USB/file boundaries, and native devices;
**medium** for current Android feature parity where the manual is dated 2022;
and **low/unknown** for proprietary internals and the deep host contract.

## 2. Product identity, history, and market position

The canonical vendor currently presents AEMS as one multitrack audio/MIDI
recording-studio family for Android and iOS [DOCUMENTED; C-001]. The current
iOS listing is version 7.2.8, supports iPhone and iPad, requires iOS 12 or later,
and says it is not verified for macOS; Google Play shows the Android paid app as
updated 2026-08-21 [DOCUMENTED; C-002]. This is evidence of active maintenance,
not independent evidence of quality or market share.

The storefronts position the product from song-idea capture through full mobile
production, recording, MIDI composition, mixing, and stem export; the manual
also identifies podcast/lecture recording as a use case [DOCUMENTED; C-001,
C-019]. No separate current “Pro” edition applies to iOS 2.0+; the iOS listing
says the Pro IAP only concerns users who downloaded 1.x, while the current base
app and optional content/effect purchases make up the commercial family
[DOCUMENTED; C-003].

Historical lineage was intentionally bounded. A current Windows product was
not found in vendor navigation, despite an older Android page's Windows-project
exchange statement [UNKNOWN; C-029].

## 3. Workflow and conceptual model

The primary mental model is a named project containing a horizontal arranger,
typed tracks, timeline clips, mixer channels/groups, automation, instruments,
effects, and project media [DOCUMENTED; C-004, C-016, C-026]. Audio and MIDI
clips appear on a shared timeline; the app offers separate beginner and expert
arranger interaction modes but retains the same underlying clip/track model
[DOCUMENTED; C-004]. It is neither a tracker nor a modular-patching environment.

Version 7.2.8 also has a Live Performance mode with setlists and rapidly
switchable scenes. A scene stores mixer-channel, effect, and instrument
parameter states and can arm/unarm groups; the release text explicitly says
projects/songs remain useful when sound sets cannot all fit in memory
[DOCUMENTED; C-006]. Therefore scenes supplement rather than replace the linear
project model [INFERENCE; C-006].

## 4. Publicly documented architecture

Public evidence exposes user-level components—arranger, typed tracks/clips,
channel strips, master/groups, FX grids, automation, project folders, native
devices, platform audio/MIDI I/O, and iOS extensions—but not the proprietary
engine graph, thread scheduler, service boundaries, project schema, or source
module map [DOCUMENTED/UNKNOWN; C-007].

The strongest platform-specific architectural disclosure is Android's optional
app-scoped USB audio driver, which bypasses Android's audio path for AEMS but is
not usable by other apps [DOCUMENTED; C-009]. On iOS, AEMS uses Apple's system
USB audio driver and hosts Audio Units/IAA through platform mechanisms
[DOCUMENTED; C-009, C-021, C-023].

A bounded hypothesis is that the shared project/editor/device model sits above
OS-specific I/O and extension adapters. This follows the common manuals and
cross-platform projects, but an alternative is two partly independent products
sharing serialized concepts; no public internals distinguish them
[INFERENCE; C-007, C-028]. AAP's documented out-of-process Android design is not
evidence of AEMS architecture because AEMS adoption was not established
[DOCUMENTED limitation; C-033].

## 5. Audio engine

On Android, new projects default to Oboe/AAudio at the device-native sample
rate—described as usually 48 kHz—with a buffer twice the lowest native size.
Choosing a non-native rate invokes device resampling, increases latency, and can
reduce quality; a project's rate becomes fixed once audio exists [DOCUMENTED;
C-008]. USB interfaces can expose higher rates, and the custom driver documents
mono/stereo/multichannel streams, 16/24/32-bit transfer, and any rate the
interface supports [DOCUMENTED; C-009].

The manual states that internal processing is 32-bit floating point, while a
rendered-stem warning describes conversion back to a fixed-point domain where
levels above 0 dB can clip [DOCUMENTED, manual-scope limitation; C-010]. This was
not independently measured. Stereo mixdown and track renders are offline user
paths; exports can include at most ten seconds of effect/instrument tail
[DOCUMENTED; C-010, C-028].

Audio and MIDI tracks can be frozen reversibly: processing, effects, automation,
and up to ten seconds of tails are rendered into a clip while the pre-freeze
track state is retained [DOCUMENTED; C-011]. Changes made to a frozen track are
discarded on unfreeze, and freeze audio remains in the project Samples folder
[DOCUMENTED; C-011].

AEMS measures recording latency and shifts later recordings earlier; the custom
USB path usually supplies a usable estimate [DOCUMENTED; C-012]. This is
recording-offset compensation, not evidence of plug-in delay compensation
[INFERENCE; C-012, C-013]. Plug-in delay compensation, tail reporting,
oversampling, multicore scheduling details, real-time/offline equivalence,
drop-out recovery, and engine diagnostics beyond user troubleshooting are
`UNKNOWN` [C-013].

## 6. Tracks, timeline, clips, and editing

Documented track types are audio, MIDI instrument, drum pattern, and plain/USB
MIDI; audio tracks can be auto-created on record [DOCUMENTED; C-004]. Recorded,
created, or imported material becomes a typed timeline clip. Audio clips show
waveforms and MIDI clips show events; clips move between tracks of the same
type [DOCUMENTED; C-004].

Audio edits are reference-based and non-destructive: move, trim, split,
cut/copy/paste, replace, repeat, crossfade, normalize, pitch shift, and time
stretch do not require rewriting the original recording [DOCUMENTED; C-005].
Overlapping audio can replace or create separate crossfade clips; overlapping
MIDI clips perform together unless explicitly merged. Clip-level gain plus
fade-in/out is independent of track volume [DOCUMENTED; C-005]. Unlimited
undo/redo is documented during an app session, but the piano-roll manual says
its undo list is cleared when the app closes [DOCUMENTED; C-005].

Tempo and time-signature changes, including gradual tempo change, loop/range,
markers, grid snapping, punch in/out, track groups, and Vocal Tune Studio's
pitch/time editing are exposed [DOCUMENTED; C-005, C-019]. Takes/lanes,
traditional comping, ripple editing, folder tracks/VCAs, and persistent edit
history are not documented and remain `UNKNOWN` [C-007].

## 7. MIDI, sequencing, notation, and expression

AEMS records and edits MIDI in a piano roll and has a GM-oriented drum-pattern
sequencer. The Android manual documents notes, velocity, CC, program change,
channel pressure, and channel-wide pitch bend, with quantization or free
placement at 192 ticks per beat [DOCUMENTED; C-014]. Current iOS metadata
explicitly documents MPE; equivalent current Android MPE behavior was not found
in the retrieved Android listing/manual [DOCUMENTED/UNKNOWN; C-014].

MIDI tracks can drive native instruments or external hardware. Class-compliant
USB MIDI is documented on both platforms; iOS also documents Bluetooth MIDI,
and the current Android release notes mention scanning aggregate devices with
MIDI functionality [DOCUMENTED; C-015]. MIDI clock sync and MIDI remote control
are current storefront features; the release notes add scene switching via MIDI
CC [DOCUMENTED; C-015].

There is no score/notation editor in the retained evidence. Polyphonic
aftertouch editing, SysEx, MIDI 2.0/UMP, MTC, per-note expression details,
generators, and sample-accurate MIDI scheduling are `UNKNOWN` [C-014].

## 8. Routing, mixer, automation, and control

Every track has a channel strip and expandable FX Grid. The grid supports serial
and parallel paths and begins with non-removable EQ, Volume, and two Send blocks;
user effects can be added, muted individually, or bypassed together
[DOCUMENTED; C-016]. Groups and the master are buses with their own FX grids but
no record input or sends. Track sends can use groups as returns; groups can
route to master/other groups or, on Android with the custom driver, unique USB
stereo output pairs [DOCUMENTED; C-016]. Feedback-cycle policy, arbitrary
channel layouts, surround/immersive mixing, VCAs, and control-surface APIs are
not documented [UNKNOWN; C-016].

Automation exposes track/master mixer parameters and parameters for instruments
and effects, with points connected by linear segments, optional grid snapping,
numeric point values, and touch recording [DOCUMENTED; C-017]. Evolution One
parameters can be automated but do not visually follow automation and cannot be
recorded with Touch mode [DOCUMENTED; C-017]. No source claims sample-accurate
automation or stable plug-in parameter IDs [UNKNOWN; C-024].

Sidechain selection is documented for AEMS Compressor and ToneBoosters
Compressor only: the user selects a source track and the source FX-grid tap
point, including input, output, or an intermediate block [DOCUMENTED; C-018].
Arbitrary AU sidechain-bus exposure is not documented [UNKNOWN; C-024].

## 9. Recording, comping, and media handling

AEMS records built-in microphones and class-compliant interfaces, supports
track arming, input selection, mono/stereo and Android custom-driver
multichannel recording, input monitoring subject to hardware, loop playback,
and punch in/out [DOCUMENTED; C-009, C-019]. No take-lane/playlist comping model
was found [UNKNOWN; C-019].

Current Android metadata documents import of WAV, MP3, AIFF, FLAC, OGG, and
MIDI, and mixdown to WAV, MP3, AIFF, FLAC, or OGG; current iOS metadata/manual
documents WAV, AIFF, and ALAC mixdown [DOCUMENTED; C-019, C-028]. Android 11+
imports shared-folder media into the project's Samples folder; project/content
transfer uses app-private storage, the Audio Evolution Portal, desktop USB, or
cloud [DOCUMENTED; C-027].

Video, timecode conform, proxies, BWF metadata, AAF/OMF, and automatic asset
relinking are not documented [UNKNOWN; C-028].

## 10. Instruments, effects, content, and native devices

Native/device-level instruments include Evolution One, SoundFont SF2/SF3 and
SFZ playback, in-app SFZ/sampler creation, a GM/GS default set, drum-pattern
instruments, and downloadable SoundFont packs [DOCUMENTED; C-020]. ToneBoosters
Flowtones is an Android 9+ IAP; Vocal Tune Studio, real-time Vocal Tune variants,
ToneBoosters effects, loops, and sound packs are optional purchases
[DOCUMENTED; C-003, C-020].

The current stores list native real-time chorus, compression, delays, reverb,
flanger, gate, pitch/vocal processing, EQ and other effects. Effects live in the
serial/parallel FX Grid, can expose presets, and can have parameters driven by
automation, tempo locks, or LFO modifiers [DOCUMENTED; C-016, C-017, C-020].

The manual says ToneBoosters effects/Flowtones purchased in AEMS can only be
used inside AEMS. Therefore “ToneBoosters VST effects” is product/lineage
branding for integrated IAP and must not be counted as VST2/VST3 hosting
[DOCUMENTED/INFERENCE; C-020]. The proprietary native device API, modulation
implementation, preset schema, and any third-party device-authoring SDK are
`UNKNOWN` [C-007].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

The current product has no documented desktop edition; desktop cells therefore
describe product applicability, not whether the format exists on that OS
[C-001, C-029]. `UNKNOWN` never means proven unsupported.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `NOT_APPLICABLE:no current macOS product` | `NOT_APPLICABLE:no current Windows product` | `NOT_APPLICABLE:no current Linux product` | `UNKNOWN:no AEMS mobile host documented` | iOS 7.2.8; Android updated 2026-08-21 | ToneBoosters “VST” wording is not hosting; products are AEMS-confined IAP | C-020, C-025; S-002, S-004–S-007 |
| VST3 | `NOT_APPLICABLE:no current macOS product` | `NOT_APPLICABLE:no current Windows product` | `NOT_APPLICABLE:no current Linux product` | `UNKNOWN:no AEMS mobile host documented` | Same | No discovery/runtime/state evidence | C-025; S-004–S-007 |
| AUv2 | `NOT_APPLICABLE:no current macOS product` | `NOT_APPLICABLE:Apple format/product absent` | `NOT_APPLICABLE:Apple format/product absent` | `NOT_APPLICABLE:current iOS evidence is app-extension Audio Units, not macOS AUv2` | iOS 7.2.8 plus Apple extension guide | Do not conflate macOS AUv2 with iOS extension hosting | C-021, C-022; S-004, S-007, S-009 |
| AUv3 | `NOT_APPLICABLE:no current macOS product` | `NOT_APPLICABLE:Apple format/product absent` | `NOT_APPLICABLE:Apple format/product absent` | `DOCUMENTED:iOS Audio Unit hosting; INFERENCE:AUv3 extension family`; Android `UNKNOWN` | iOS 7.2.8; manual rev 1.04 | Instruments, effects, AU MIDI, multi-output instruments; host-depth gaps below | C-021–C-024; S-004, S-007, S-009 |
| AAX | `NOT_APPLICABLE:no current desktop/AAX product` | `NOT_APPLICABLE:no current desktop/AAX product` | `NOT_APPLICABLE:AAX/product absent` | `UNKNOWN:no AEMS mobile host documented` | Current mobile family | No evidence | C-025; S-001, S-004–S-007 |
| CLAP | `NOT_APPLICABLE:no current desktop product` | `NOT_APPLICABLE:no current desktop product` | `NOT_APPLICABLE:no current desktop product` | `UNKNOWN:no AEMS mobile host documented` | Current mobile family | Generic AAP bridge discussion is not AEMS support | C-025, C-033; S-010, S-011 |
| LV2 | `NOT_APPLICABLE:no current desktop product` | `NOT_APPLICABLE:no current desktop product` | `NOT_APPLICABLE:no current desktop product` | `UNKNOWN:no AEMS mobile host documented` | Current mobile family | AAP ports exist generically but AEMS is not established as host | C-025, C-033; S-010, S-011 |
| LADSPA | `NOT_APPLICABLE:no current desktop product` | `NOT_APPLICABLE:no current desktop product` | `NOT_APPLICABLE:no current desktop product` | `UNKNOWN:no AEMS mobile host documented` | Current mobile family | No evidence | C-025; S-004–S-007 |
| DSSI | `NOT_APPLICABLE:no current desktop product` | `NOT_APPLICABLE:no current desktop product` | `NOT_APPLICABLE:no current desktop product` | `UNKNOWN:no AEMS mobile host documented` | Current mobile family | No evidence | C-025; S-004–S-007 |
| JSFX | `NOT_APPLICABLE:no current desktop product` | `NOT_APPLICABLE:no current desktop product` | `NOT_APPLICABLE:no current desktop product` | `UNKNOWN:no AEMS mobile host documented` | Current mobile family | A generic AAP ysfx port does not establish AEMS support | C-025, C-033; S-011 |
| DirectX/DXi | `NOT_APPLICABLE:Windows format/product absent` | `NOT_APPLICABLE:no current Windows product` | `NOT_APPLICABLE:Windows format/product absent` | `NOT_APPLICABLE:desktop Windows format` | Current mobile family | Legacy Windows edition unresolved; no current evidence | C-029; S-001, S-002 |
| Rack Extension | `NOT_APPLICABLE:Reason format/current product absent` | `NOT_APPLICABLE:Reason format/current product absent` | `NOT_APPLICABLE:Reason format/current product absent` | `UNKNOWN:no AEMS mobile host documented` | Current mobile family | No evidence | C-025; S-004–S-007 |
| Android Audio Plugin (AAP; additional row) | `NOT_APPLICABLE:Android format` | `NOT_APPLICABLE:Android format` | `NOT_APPLICABLE:Android app format` | `UNKNOWN:AEMS adoption not established` | Android updated 2026-08-21; AAP main/wiki accessed 2026-08-29 | AAP is out-of-process/app-distributed generically, but current host registry omits AEMS | C-025, C-033; S-005, S-006, S-010, S-011 |
| Product-native/other | `NOT_APPLICABLE:no current macOS product` | `NOT_APPLICABLE:no current Windows product` | `NOT_APPLICABLE:no current Linux product` | `DOCUMENTED:both—native FX/instruments/content; iOS—IAA and Audiobus` | iOS 7.2.8; Android updated 2026-08-21 | IAA remains listed but is deprecated; SoundFont/SFZ are instrument/content formats, not binary plug-in hosting | C-020, C-021, C-023; S-004–S-007 |

### 11.2 Discovery, scanning, validation, and recovery

On iOS, installed AU and IAA instruments appear in the instrument selector in
alphabetical order, all AUs before IAAs [DOCUMENTED; C-023]. This is discovery
UX, but the documentation does not specify component notifications, rescan,
cache invalidation, duplicate identity, validation, blacklist, quarantine, or
failed-scan diagnostics [UNKNOWN; C-024].

Android native instruments, SoundFonts/SFZ, and AEMS/ToneBoosters content are
selected or imported through AEMS lists, the shop, shared storage, or the
Portal; these are content/native-device discovery mechanisms, not proof of a
binary plug-in scanner [DOCUMENTED; C-020, C-027]. No AAP or other third-party
scan/validation path was found [UNKNOWN; C-025].

Missing AU/IAA placeholders, retry/rebind behavior, migration across plug-in
versions, and project recovery after a plug-in fails are `UNKNOWN` [C-024].

### 11.3 Runtime isolation and compatibility

IAA runs as a separate background app and cannot embed its UI in AEMS; users
switch apps to edit it [DOCUMENTED; C-023]. Audio Unit UI can be shown with the
virtual keyboard on tablets or opened full screen. Apple describes AU app-
extension UI as a remote view controller embedded by the host [DOCUMENTED
platform baseline; C-022, C-023].

AEMS does not document whether AU DSP loads in the host or another process,
crash containment/restart, memory limits, architecture bridging, code-signing
checks, or headless fallback [UNKNOWN; C-024]. Generic AAP is documented as
separate host/plugin Android apps using Binder/shared memory, but this cannot be
attributed to AEMS without host adoption [DOCUMENTED limitation; C-033].

### 11.4 Host/plugin processing contract

Current iOS supports AU instruments, audio effects, AU MIDI, and multiple
outputs from AU instruments [DOCUMENTED; C-021]. The manual documents AU
instrument control from AEMS's piano roll, external MIDI, and virtual keyboard
[DOCUMENTED; C-023]. Current iOS MPE support is documented for sequencing, but
the evidence does not establish per-note-expression delivery to every AU
[DOCUMENTED/UNKNOWN; C-014, C-024].

No AEMS-specific source describes AU input/output bus negotiation beyond the
multi-output headline, arbitrary effect sidechains, dynamic I/O, channel
layouts, sample-accurate event/automation delivery, MIDI 2.0, latency/tail
reporting, bypass/suspend, or offline-render guarantees [UNKNOWN; C-024]. The
native compressor sidechain and ten-second export/freeze tail policy must not be
projected onto AU plug-ins [DOCUMENTED limitation; C-018, C-024].

### 11.5 Parameters, automation, state, presets, and project recall

AEMS exposes available AU presets in its instrument UI, and general automation
documentation says parameters of instruments/effects on a track can be selected
and automated [DOCUMENTED; C-017, C-023]. It does not document AU parameter
identifier stability, ranges/text/unit mapping, gesture boundaries, or sample
accuracy [UNKNOWN; C-024].

Named projects, versions, autosaves, templates, and reversible freeze prove that
AEMS serializes substantial track/project state [DOCUMENTED; C-011, C-026]. No
retained source says how AU full state/presets, IAA state, external assets,
security-scoped references, missing instances, or plug-in-version migration are
serialized/restored [UNKNOWN; C-024].

### 11.6 UI, diagnostics, and failure modes

AU instrument UI is embedded beside the virtual keyboard on tablets and can be
opened full screen; IAA requires app switching [DOCUMENTED; C-023]. Per-plug-in
UI detachment, scaling negotiation, phone layouts, accessibility, headless
operation, multi-window behavior, and UI-crash recovery are not documented
[UNKNOWN; C-024].

The retained AEMS sources provide USB troubleshooting/log-file instructions but
no equivalent plug-in validation logs, crash reports, quarantine UI, or missing-
plug-in diagnostics [DOCUMENTED/UNKNOWN; C-009, C-024].

## 12. Extensibility and integration

Documented integrations are iOS AU/IAA/Audiobus/AudioShare, USB/Bluetooth MIDI,
MIDI remote/clock, Android and iOS sharing/cloud, desktop file access/media
server, and import/export formats [DOCUMENTED; C-015, C-021, C-027, C-028].
SoundFont/SFZ import and in-app SFZ creation are content/instrument extension
points, not general code plug-ins [DOCUMENTED; C-020].

No AEMS scripting language, public device/plug-in SDK, command API, OSC API,
macro system, or documented compatibility/versioning contract was found
[UNKNOWN; C-007]. AAP's MIT SDK is independent and cannot be treated as an AEMS
SDK [DOCUMENTED limitation; C-033].

## 13. Project format, persistence, interoperability, and collaboration

AEMS stores named projects locally with manual saves, configurable autosave
(three-minute default in the 2022 manual), selectable saved versions, templates,
and an automatically created Untitled project that can retain otherwise unsaved
recordings [DOCUMENTED; C-026]. The piano-roll undo stack is session-local;
autosaved project versions, rather than persistent undo, are the documented
recovery path [DOCUMENTED; C-005, C-026]. App uninstall can delete all local
projects on iOS and, under Android scoped storage, uninstall/clear-data can
delete app-private work unless data is retained or backed up [DOCUMENTED;
C-026, C-027].

In-app cloud sync compares newer local/cloud files by project/folder. The 2022
manual names Google Drive and Dropbox; current Android metadata names Google
Drive and cross-Android/iOS project exchange/collaboration, while current iOS
metadata still names both providers [DOCUMENTED; C-027, C-028]. This is file
sync/share, not evidence of simultaneous multi-user editing, conflict-free
merging, or vendor-hosted version control [INFERENCE; C-027]. The vendor says it
does not retain customers' project files [DOCUMENTED; C-027].

Android 11+ uses app-private storage and a Documents-folder Audio Evolution
Portal for projects, templates, presets, SoundFonts/SFZ, sample packs, and MIDI-
remote setups; desktop USB access and cloud import are alternatives
[DOCUMENTED; C-027].

Projects are documented as interchangeable between current Android and iOS.
Interchange with other DAWs is via rendered stems and Standard MIDI file;
mixdowns differ by OS as described in section 9 [DOCUMENTED; C-028]. AAF, OMF,
ADM, MusicXML, DAWproject, project archive/collect semantics, forward/backward
compatibility rules, media relink, and missing dependency placeholders are
`UNKNOWN` [C-024, C-028].

## 14. Delivery, live, post-production, and specialized workflows

Delivery paths are stereo/mono mixdown, optional range export, per-track rendered
stems, MIDI-file export, OS sharing, and up to ten seconds of included tails
[DOCUMENTED; C-010, C-028]. Live Performance mode provides projects/songs,
setlists, MIDI-controlled scenes, fast parameter-state switching, and group
arm/unarm [DOCUMENTED; C-006].

Vocal Tune Studio provides detailed vocal pitch/time and general timing
correction as an IAP [DOCUMENTED; C-020]. No DDP, video post, ADR, loudness
delivery, broadcast conform, surround/immersive/ADM, or show-control workflow is
documented [UNKNOWN; C-028].

## 15. Performance, reliability, security, and accessibility

Documented resource controls include buffer selection, Android CPU optimization/
booster settings, track freeze, multicore support as a storefront feature, and
foreground-operation guidance for reliable Android USB audio/MIDI
[DOCUMENTED; C-008, C-009, C-011]. The vendor warns that hardware combinations
vary and offers a trial before purchasing the custom driver [DOCUMENTED; C-009].
No track-count benchmark, deterministic overload policy, plug-in crash
containment, rollback mechanism, or independent latency/reliability measurement
was retained [UNKNOWN; C-013, C-024].

Store privacy disclosures differ by platform: the iOS developer declares no
data collected, while Google Play declares Device or other IDs may be collected,
no third-party sharing, encryption in transit, and no deletion request path
[DOCUMENTED developer declarations; C-030]. These are not an independent audit.
The iOS listing says the developer has not indicated supported accessibility
features; AEMS-specific screen-reader, keyboard-only, contrast, motor, hearing,
and plug-in-UI accessibility remain `UNKNOWN` [C-030].

Platform signing/sandboxing exists generally, and Apple's guide describes AU
app extensions, but AEMS-specific validation/trust, telemetry, security update,
and plug-in permission boundaries are not documented [UNKNOWN; C-024, C-030].

## 16. Licensing, ecosystem, and implementation constraints

AEMS is proprietary commercial software sold separately through Apple and
Google storefronts with IAP; the retrieved US prices were $11.99 on both stores
at access time [DOCUMENTED, regional-price limitation; C-003]. ToneBoosters
effects/Flowtones bought inside AEMS are licensed for use only inside AEMS
[DOCUMENTED; C-020]. The custom Android USB driver is an AEMS IAP, with testing
available before purchase [DOCUMENTED; C-003, C-009].

AUv3 and IAA depend on Apple's platform extension/inter-app ecosystem; IAA is
deprecated and should not be treated as a future-safe extension choice
[DOCUMENTED; C-022, C-023]. Audiobus, cloud providers, app stores, and class-
compliant USB devices are external ecosystem dependencies [DOCUMENTED; C-009,
C-021, C-027]. Generic AAP is MIT-licensed and unstable per its upstream README,
but no AEMS use was established [DOCUMENTED limitation; C-033].

Format names/logos do not grant SDK, trademark, redistribution, certification,
or compatibility rights. This dossier offers no legal advice. Clean-room use is
limited to public behavior and architectural patterns; proprietary source,
project schemas, DSP, USB-driver code, UI assets, and plug-in SDK internals were
not obtained [DOCUMENTED research boundary; C-032].

## 17. Strengths, liabilities, and architecture lessons

**Evidence-backed strengths.** AEMS demonstrates that a mobile DAW can combine
typed linear tracks, non-destructive clips, serial/parallel effects, buses,
automation, MIDI sequencing, reversible freeze, multichannel hardware I/O, and
portable projects in a touch-first product [DOCUMENTED; C-004, C-005, C-009,
C-011, C-016, C-028]. The dual Android USB path and explicit Android 11+ Portal
address platform limitations rather than hiding them [DOCUMENTED; C-009,
C-027]. iOS AU instruments/effects/MIDI and multi-output broaden the ecosystem
beyond bundled content [DOCUMENTED; C-021].

**Liabilities.** Plug-in interoperability is platform-asymmetric and deeply
under-documented. Android has no established third-party host, while current
iOS still exposes deprecated IAA beside Audio Units [UNKNOWN/DOCUMENTED; C-023,
C-025]. Local-first storage creates uninstall/clear-data hazards, and current
desktop-native continuity is unresolved [DOCUMENTED/UNKNOWN; C-026, C-027,
C-029]. Accessibility declarations and crash/isolation behavior are sparse
[UNKNOWN; C-024, C-030].

**Architecture lesson.** AEMS is a strong reference for mobile workflow,
explicit OS adapters, and bounded local/cloud portability, but a weak reference
for a complete, diagnosable cross-platform plug-in host contract because the
critical internals and failure semantics are unknown [INFERENCE; C-024, C-025].

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites/tradeoffs/adaptation risk |
| --- | --- | --- | --- | --- |
| `CANDIDATE` | Touch editing without destructive media mutation | Typed clips reference immutable project media; trim/move/crossfade are arrangement operations | C-004, C-005 | Requires durable asset IDs/relinking; retained AEMS schema is unknown, so design independently |
| `CANDIDATE` | Complex mobile effect routing in constrained UI | Per-channel grid with explicit serial/parallel blocks, fixed channel controls, presets, mute, and global user-FX bypass | C-016 | Must define cycle, latency, dynamic-I/O, and accessibility rules absent from AEMS evidence |
| `CANDIDATE` | Recover CPU on mobile | Reversible freeze snapshot plus rendered clip and explicit unfreeze semantics | C-011 | Storage cost and stale frozen edits; define plug-in state/missing dependency behavior independently |
| `CONDITIONAL` | Android system-audio latency/device limitations | System path plus qualified app-scoped low-latency/multichannel hardware path | C-008, C-009 | Very high driver/testing/security burden; do not copy proprietary code; modern platform APIs may be preferable |
| `CANDIDATE` | Local project durability under mobile sandboxing | Named projects, periodic versions, explicit portal/archive path, cloud sync, and uninstall warnings | C-026, C-027 | Needs conflict handling, encryption/privacy, user-visible backups, and testable restore guarantees |
| `CONDITIONAL` | Mobile ecosystem extension | OS-native extension adapter (AUv3 on Apple) behind an explicit capability matrix | C-021–C-024 | Must independently specify scan, isolation, state, latency, missing plug-ins, UI, and failure diagnostics |
| `CANDIDATE` | Live changes faster than project loads | Scenes store bounded mixer/device parameter state while projects retain full asset topology | C-006 | Requires clear scene/project ownership, morph/switch timing, and missing-device semantics |

No protected AEMS expression, source code, schema, DSP, or UI asset is proposed
for reuse [C-032].

## 19. Rejected patterns and CURIOSITY_NO_GO

| Rejected mechanism/thread | Evidence/rationale | Reopen condition |
| --- | --- | --- |
| Infer VST2/VST3 hosting from “ToneBoosters VST effects” | Products are app-confined IAP; format-host behavior is absent [C-020] | Vendor documents a scanner/host and versioned format contract |
| Attribute generic AAP architecture to AEMS | AAP describes out-of-process Android plug-ins, but current host registry omits AEMS [C-025, C-033] | AEMS release notes/manual or a safe observed probe confirms adoption |
| Choose IAA for a new architecture | AEMS itself says Apple deprecated IAA and recommends AU [C-023] | Only for legacy import/compatibility with an explicit sunset |
| Copy/customize eXtream USB-driver internals | Proprietary internals unavailable and clean-room boundary forbids copying [C-009, C-032] | Never without independent lawful implementation and separate legal review |
| Reverse-engineer project files or binaries | Proprietary, unnecessary, outside research authority [C-007, C-032] | Public vendor schema/SDK or separately authorized clean-room protocol study |
| Treat “supports AU” as a complete host contract | Validation, isolation, latency, state, UI failure, and missing-plug-in behavior remain unknown [C-024] | Versioned host qualification results |
| Deep historical Windows search | Current decision only needs the maintained boundary; official searches were rate-limited and current navigation is mobile-only [C-029] | Desktop-native compatibility becomes a procurement requirement |
| Exhaustive device compatibility census | Vendor list is infrequently updated and combinations vary [C-009] | A named hardware deployment needs qualification |
| User-review failure anecdotes | Secondary reviews cannot establish host architecture or conformance | A repeatable failure becomes decision-critical and can be safely reproduced |
| Generic AAP low-level extensions/bridges | Without AEMS adoption, details cannot change this product conclusion [C-033] | Adoption is first established |

All rows above are `CURIOSITY_NO_GO` for this documentary wave.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test | Result | Counterevidence/next dynamic probe |
| --- | --- | --- | --- |
| H1: The maintained AEMS family is Android+iOS mobile only | Compare current vendor navigation and both stores with older product text | **Supported with caveat** [C-001, C-029] | Older Android page mentions Windows; ask vendor if desktop-native continuity matters |
| H2: Android AEMS hosts a generic third-party plug-in format | Inspect current store/manual for scanner/format and AAP upstream host list | **Not substantiated**; status remains unknown [C-025, C-033] | Safe disposable Android host probe with known AAP instrument/effect, or vendor confirmation |
| H3: Current iOS AEMS hosts AUv3 and IAA | Current store, AEMS AU/IAA manual, Apple extension architecture | **Audio Unit + IAA documented; AUv3 is high-confidence inference** [C-021–C-023] | Inspect component type/version on a disposable iOS fixture |
| H4: Android and iOS are feature-identical | Compare manuals/storefronts | **Falsified**: AU/IAA and USB-driver/storage boundaries differ [C-009, C-021, C-027] | Maintain per-OS capability matrix |
| H5: ToneBoosters “VST effects” means AEMS scans VST | Compare marketing wording with IAP confinement/manual | **Falsified** [C-020] | None unless vendor adds a documented format scanner |
| H6: Format accepted implies full host contract | Search for scan, instantiate, buses, latency, state, UI, and recovery evidence | **Falsified as an inference**: only selected capabilities are documented [C-024] | Qualification suite covering each contract layer |
| H7: Recording latency correction is plug-in delay compensation | Inspect latency manual | **Falsified**: it shifts recorded clips; PDC remains unknown [C-012, C-013] | Impulse plug-in latency test with reported/hidden delay |
| H8: Current effect routing is limited to three inserts/two sends | Compare old iOS overview with current store/manual | **Contradicted by current evidence**: two fixed sends remain, but FX grid expands with serial/parallel blocks [C-016] | Current app UI observation if exact grid limits matter |

The adversarial distinction is explicit: iOS evidence establishes **format
listed/selected and instantiated enough to play/show UI**, but not that every AU
is validated, isolated, bus-complete, state-safe, latency-correct, recoverable,
or missing-instance tolerant [C-024]. Android evidence establishes native/IAP
devices, not generic plug-in scanning [C-025].

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | AEMS is the vendor's current Android/iOS multitrack audio/MIDI family. | Current family, 2026-08-29 | S-001, S-004, S-005 | Vendor home and both stores agree. | Product naming varies; no market-quality inference. |
| C-002 | DOCUMENTED | High | iOS current version is 7.2.8, iOS 12+, iPhone/iPad; Android listing was updated 2026-08-21 but exposed no semantic version. | Current stores | S-004, S-005 | Store metadata. | Android version/minimum OS remain unknown; “3d ago” normalized only by access date. |
| C-003 | DOCUMENTED | High | Both apps are paid with IAP; Android has a trial; iOS legacy Pro IAP does not apply to 2.0+. | Current commercial editions | S-004, S-005, S-006 | Store/manual purchase text. | Prices regional and time-sensitive. |
| C-004 | DOCUMENTED | High | The core model is a linear arranger with audio, MIDI-instrument, drum-pattern, and plain/USB-MIDI tracks containing typed clips. | Android/iOS shared model | S-002, S-003, S-006, S-007 | Matching product/manual sections. | Manuals are rev 1.04/2022; current scenes add another mode. |
| C-005 | DOCUMENTED | High | Audio editing is non-destructive; clips support trim/move/replace/crossfade/gain/fades; undo/redo is unlimited in-session. | Shared editor | S-002, S-003, S-006 | Direct manual statements. | Persistent undo not documented; piano-roll undo clears on app close. |
| C-006 | DOCUMENTED plus INFERENCE | High | 7.2.8 Live Performance scenes store mixer/effect/instrument states and group arming; scenes supplement projects. | Current iOS/Android release | S-004, S-005 | Matching “What's New”; supplement conclusion follows explicit project comparison. | Full scene serialization/timing unknown. |
| C-007 | UNKNOWN plus bounded INFERENCE | High that evidence is absent | Proprietary engine graph, threading, project schema, module map, and native-device API are not publicly documented in retained evidence; shared UI concepts may sit above OS adapters. | Internals | S-001–S-008 | Manuals expose behavior, not implementation. | Vendor/private docs could exist; no claim about actual internals. |
| C-008 | DOCUMENTED | High | Android defaults to Oboe/AAudio, native rate, and 2× minimum buffer; non-native rates resample and increase latency. | Android manual rev 1.04 | S-006 | Project Sample Rate section. | No independent measurement; current defaults could change. |
| C-009 | DOCUMENTED | High | Android offers system USB plus paid app-scoped custom USB driver with multichannel/high-resolution/device-rate support; iOS uses the system USB driver. | Android/iOS USB | S-002, S-005–S-008 | Product, manual, technology page agree. | Compatibility list stale/incomplete; performance unmeasured. |
| C-010 | DOCUMENTED | Medium-high | Manual states 32-bit float internal processing and offline export with optional tails capped at ten seconds. | Manual rev 1.04 | S-006, S-007 | Export page text. | Shared-page Android references appear in iOS manual; not independently measured. |
| C-011 | DOCUMENTED | High | Freeze reversibly renders audio/MIDI track processing/automation with up to ten seconds of tails and retains pre-freeze state. | Shared manual model | S-004, S-006 | Store + Freeze section. | AU/IAA-specific freeze conformance not explicit. |
| C-012 | DOCUMENTED | High | Latency compensation measures device/round-trip delay and shifts later recordings earlier; custom USB often supplies estimate. | Android recording | S-006 | Latency Compensation section. | Not plug-in delay compensation. |
| C-013 | UNKNOWN | High that not documented | Plug-in delay compensation, oversampling, scheduler details, tail reporting, drop-out recovery, and render equivalence are unknown. | Engine/plug-ins | S-004–S-008 | Targeted manual/store review found no contract. | Absence is not non-support. |
| C-014 | DOCUMENTED plus UNKNOWN | High/medium | Android piano roll edits standard channel MIDI events; current iOS explicitly supports MPE; Android MPE, SysEx, MIDI 2.0, and per-note delivery remain unknown. | Mobile MIDI | S-004–S-007 | Store/manual split. | Feature parity cannot be assumed. |
| C-015 | DOCUMENTED | High | Class-compliant USB MIDI, MIDI input/output, MIDI clock/remote, iOS Bluetooth MIDI, and current scene CC control are supported. | Mobile hardware/control | S-004–S-007 | Current stores + connection manual. | MTC/OSC/control SDK not documented. |
| C-016 | DOCUMENTED | High | Mixer has track/master/group channels and expandable serial/parallel FX grids; groups route to buses/master or Android USB pairs. | Shared mixer; Android hardware outs | S-002, S-003, S-006 | FX Grid and channel-strip sections. | Feedback/cycle rules and exact current limits unknown. |
| C-017 | DOCUMENTED | High | Mixer/instrument/effect parameters can be point- or touch-automated with linear interpolation; Evolution One has touch/UI exceptions. | Shared automation | S-002–S-007 | Automation section + stores. | AU parameter identity/sample accuracy unknown. |
| C-018 | DOCUMENTED | High | Native AEMS and ToneBoosters compressors expose sidechain source track and source-grid tap selection. | Native effects | S-004–S-006 | Sidechain manual/store. | Does not prove arbitrary AU sidechain. |
| C-019 | DOCUMENTED plus UNKNOWN | High | AEMS records built-in/class-compliant I/O, supports punch/loop, imports common audio/MIDI, but no take-lane comping model was found. | Mobile recording/media | S-002–S-007 | Stores/manual. | Format lists differ by OS; comping absence is unknown, not proven unsupported. |
| C-020 | DOCUMENTED plus INFERENCE | High | Native Evolution One/SoundFont/SFZ and app-integrated ToneBoosters/Vocal Tune/content are available; ToneBoosters purchases are AEMS-only and do not establish VST hosting. | Native devices/content | S-002–S-007 | Explicit app confinement; host inference rejected. | “Identical to desktop counterparts” is vendor claim, not binary identity proof. |
| C-021 | DOCUMENTED | High | Current iOS supports Audio Unit instruments, effects, AU MIDI, and multi-output AU instruments, plus IAA/Audiobus. | iOS 7.2.8 | S-004, S-007 | Current store + manual. | Exact AU version name not used by AEMS source. |
| C-022 | INFERENCE based on platform primary source | High | Current iOS Audio Unit path corresponds to AUv3 app extensions rather than macOS AUv2. | iOS | S-004, S-007, S-009 | iOS installed app plug-ins/embedded UI align with Apple app-extension architecture. | AEMS does not explicitly write “AUv3” in retained source. |
| C-023 | DOCUMENTED | High | AUs/IAAs are alphabetically discovered; AU UI/presets integrate in AEMS, while IAA runs as separate background app; IAA is deprecated but still listed. | iOS manual/current store | S-004, S-007 | Direct AU/IAA chapter. | Chapter focuses mainly on instruments; current store extends to effects/AU MIDI. |
| C-024 | UNKNOWN | High that gaps exist | AEMS-specific AU scan validation/cache/quarantine, process isolation, buses beyond headline, parameter IDs, sample accuracy, latency/tails, dynamic I/O, state, missing plug-ins, UI scaling, and crash recovery are unknown. | iOS host contract | S-004, S-007, S-009 | Targeted host-contract comparison. | Apple generic APIs cannot prove AEMS behavior. |
| C-025 | UNKNOWN plus INFERENCE | Medium-high | No current Android third-party plug-in host is documented; native/IAP-only is the leading bounded inference, not proven non-support. | Android current | S-005, S-006, S-010, S-011 | Current store/manual omit host; AAP registry omits AEMS. | Registries/manuals may be incomplete; vendor confirmation/probe needed. |
| C-026 | DOCUMENTED | High | Projects have manual saves, autosave, saved versions, templates, Untitled recovery, and local-data deletion risk. | iOS/shared manual model | S-006, S-007 | Save/load sections. | Crash restoration semantics and current autosave default not reverified dynamically. |
| C-027 | DOCUMENTED plus INFERENCE | High | Cloud sync, Android 11+ private storage/Portal, desktop transfer, and local-first storage are documented; sync is file collaboration, not simultaneous editing. | Mobile storage/cloud | S-004–S-007 | Cloud/scoped-storage sections. | Dropbox current Android status is not in current Google listing. |
| C-028 | DOCUMENTED plus UNKNOWN | High | Android/iOS projects interchange; other DAWs receive stems/MIDI; mixdown formats vary; advanced interchange is unknown. | Project portability | S-002, S-004–S-007 | Current stores/manual. | Legacy Windows-native exchange unresolved. |
| C-029 | INFERENCE plus UNKNOWN | Medium-high | Maintained family appears mobile-only; old Windows-project statement conflicts with current mobile-only navigation. | Desktop boundary | S-001, S-002, S-004, S-005 | Current primary sources omit desktop product. | Search was rate-limited; absence is not formal discontinuation. |
| C-030 | DOCUMENTED declarations plus UNKNOWN | High/low | Store privacy declarations differ by OS; iOS accessibility support is undeclared; security/accessibility implementation remains unknown. | Current stores | S-004, S-005 | Store disclosures. | Developer-declared, not audited; Android accessibility not assessed. |
| C-031 | DOCUMENTED | High | Current Live scenes/setlists and vocal/time editing are specialized workflows; post/broadcast/immersive features are not documented. | Current product | S-004, S-005, S-006 | Store/manual. | Non-documentation is not proof of absence. |
| C-032 | DOCUMENTED research boundary | High | Public clean-room evidence grants no authority to copy proprietary implementation or claim SDK/trademark rights. | This research | Governing contract plus S-001–S-011 | Contract and source-license boundaries. | Not legal advice. |
| C-033 | DOCUMENTED with attribution limit | High | AAP generically uses separately distributed app processes, metadata scan, Binder/shared memory, optional UI/state extensions, and an unstable MIT API; current registry does not list AEMS. | AAP upstream, not AEMS | S-010, S-011 | Upstream README/wiki. | README warns of drift; registry may be incomplete; none of this proves AEMS behavior. |

## 22. Source ledger and adaptive bibliography

All fetched/search text was treated as untrusted evidence until checked against
the named publisher/origin. Access date for every retained source is
**2026-08-29**.

### S-001 — eXtream Software Development home/product navigation

- **Publisher/URL/kind:** eXtream Software Development,
  <https://www.extreamsd.com/>, official current vendor page.
- **Scope/passage:** “Audio Evolution Mobile Studio—a multitrack audio/MIDI
  recording studio for Android and iOS”; current Products navigation.
- **Supports:** C-001, C-029.
- **Limitations:** No page version/date; navigation omission cannot formally
  prove a desktop product is discontinued.
- **Selection rationale:** Canonical vendor identity/navigation is preferable to
  app roundups or historical secondary pages.

### S-002 — Audio Evolution Mobile for Android overview

- **Publisher/URL/kind:** eXtream Software Development,
  <https://www.extreamsd.com/index.php/products/audio-evolution-mobile-for-android>,
  official product overview.
- **Scope/passage:** USB audio/MIDI, non-destructive editing, mixer/groups,
  automation, ToneBoosters wording, mixdown/stems, and Windows exchange.
- **Supports:** C-001, C-004, C-005, C-009, C-016–C-020, C-028, C-029.
- **Limitations:** Undated and partly stale: effect-routing wording and Windows
  mention conflict with newer store/manual evidence.
- **Selection rationale:** Retained to trace vendor-origin claims and historical
  contradiction; current storefront controls when they differ.

### S-003 — Audio Evolution Mobile for iOS overview

- **Publisher/URL/kind:** eXtream Software Development,
  <https://www.extreamsd.com/index.php/products/audio-evolution-mobile-for-ios>,
  official product overview.
- **Scope/passage:** Shared editor/mixer/automation and older “3 insert FX / 2
  sends” wording.
- **Supports:** C-004, C-005, C-016, C-017, C-020.
- **Limitations:** Undated and older than the current store; exact FX limit is
  superseded by current unlimited-grid evidence.
- **Selection rationale:** Useful for cross-platform lineage and contradiction
  tracking; not used alone for current capabilities.

### S-004 — Apple App Store: Audio Evolution Mobile Studio

- **Publisher/URL/kind:** Apple storefront carrying developer-supplied metadata,
  <https://apps.apple.com/us/app/audio-evolution-mobile-studio/id1094758623>,
  official distribution metadata/current release notes.
- **Scope/passage:** Version 7.2.8; iOS 12+; iPhone/iPad; not verified for macOS;
  AU instruments/effects/AU MIDI/multi-output; IAA/Audiobus; MPE; routing,
  freeze, formats, cloud, IAP, scenes; privacy/accessibility declarations.
- **Supports:** C-001–C-003, C-006, C-010, C-011, C-014–C-023, C-027–C-031.
- **Limitations:** Vendor claims, not independent runtime tests; regional price;
  release age displayed relatively (“3d ago”).
- **Selection rationale:** Best available current version/OS/feature primary
  evidence and preferable to reviews or cached listings.

### S-005 — Google Play: Audio Evolution Mobile Studio

- **Publisher/URL/kind:** Google Play carrying developer-supplied metadata,
  <https://play.google.com/store/apps/details?id=com.extreamsd.aemobile&hl=en_US>,
  official distribution metadata/current release notes.
- **Scope/passage:** Updated 2026-08-21; current Android features; custom-driver
  IAP; formats; Android/iOS project interchange; Drive sync; scenes; privacy.
- **Supports:** C-001–C-003, C-006, C-009, C-014–C-021, C-025, C-027–C-031.
- **Limitations:** Retrieved page did not expose semantic version/minimum
  Android; declarations are vendor-supplied; user reviews were not used.
- **Selection rationale:** Best current Android release evidence and preferable
  to third-party APK/version sites.

### S-006 — Audio Evolution Mobile User Manual for Android, revision 1.04

- **Publisher/URL/kind:** eXtream Software Development,
  <https://www.audio-evolution.com/manual/android/index.html>, official manual
  (online HTML/PDF, copyright 2022).
- **Scope/passages:** `Introduction`, `Project Sample Rate`, `Connecting a USB
  Audio Device`, `Connecting a MIDI Device`, `Latency Compensation`, `Adding
  Tracks`, `Audio and MIDI Clips`, `The Piano Roll Editor`, `The FX Grid Screen`,
  `Master and Group Channel Strips`, `Using the Automation Mode`, `Sidechain
  Compression`, `Freezing Tracks`, `The ToneBoosters Effects`, `Cloud sync and
  backups`, and Android 11+ scoped-storage/import sections.
- **Supports:** C-003–C-020, C-025–C-028.
- **Limitations:** Revision date is 2022 and may lag current stores; describes
  documented behavior, not internals or independent measurement.
- **Selection rationale:** Most detailed product-primary workflow, routing,
  hardware, persistence, and Android-version evidence; preferable to tutorials
  or forum anecdotes.

### S-007 — Audio Evolution Mobile User Manual for iOS, revision 1.04

- **Publisher/URL/kind:** eXtream Software Development,
  <https://www.audio-evolution.com/manual/ios/index.html>, official manual
  (online HTML/PDF, copyright 2022).
- **Scope/passages:** `Audio Units and IAA`, USB/MIDI connection, save/load,
  cloud, export, and shared arranger/mixer sections.
- **Supports:** C-004, C-005, C-009, C-010, C-016–C-024, C-026–C-028.
- **Limitations:** Older than 7.2.8; AU chapter focuses on instruments; some
  export prose contains Android cross-links from shared documentation.
- **Selection rationale:** Only retained product-primary source with discovery,
  preset, embedded-UI, and IAA separate-app behavior.

### S-008 — eXtream USB audio driver technology/compatibility page

- **Publisher/URL/kind:** eXtream Software Development,
  <https://www.extreamsd.com/index.php/technology/usb-audio-driver>, official
  technology and compatibility page, last update 2023-04-20.
- **Scope/passage:** Driver origin/scope, Android versions, formats/rates,
  app-only use, foreground requirement, troubleshooting, and compatibility
  qualifications.
- **Supports:** C-009, C-013, C-030.
- **Limitations:** Explicitly infrequently updated; large compatibility list is
  not exhaustive and was not retained as a current guarantee.
- **Selection rationale:** Vendor technology statement is preferable to device
  forum reports and provides the needed app/system boundary.

### S-009 — Apple App Extension Programming Guide: Audio Unit

- **Publisher/URL/kind:** Apple Developer Documentation Archive,
  <https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/AudioUnit.html>,
  platform-owner architecture guide, updated 2017-10-19.
- **Scope/passage:** AU app-extension relationship to host, one unit/optional
  UI, generator/instrument/effect/music-effect categories, remote embedded UI,
  buses, and render resources; iOS 9+.
- **Supports:** C-022, C-024.
- **Limitations:** Archived generic platform guide, not AEMS implementation or
  current conformance; a current JavaScript documentation page fetched empty
  and another guessed API URL returned 404.
- **Selection rationale:** Platform-owner primary source is preferable to AUv3
  explainers and is used only to classify the iOS extension family.

### S-010 — Audio Plugins For Android (AAP) README

- **Publisher/URL/kind:** `atsushieno/aap-core` upstream,
  <https://raw.githubusercontent.com/atsushieno/aap-core/main/README.md>, public
  open-source project documentation on mutable `main`.
- **Scope/passage:** Android app-distributed host/plugin model, separate process,
  Binder/shared memory, metadata scan, UI, MIDI 2.0 parameter messaging,
  extension/state direction, MIT license, and API instability.
- **Supports:** C-025, C-033.
- **Limitations:** README warns it may be obsolete or ahead of implementation;
  mutable URL; it does not name AEMS.
- **Selection rationale:** Format-upstream source is preferable to blogs, but is
  retained only to prevent accidental attribution to AEMS.

### S-011 — AAP List of plug-ins and hosts

- **Publisher/URL/kind:** `atsushieno/aap-core` upstream wiki,
  <https://raw.githubusercontent.com/wiki/atsushieno/aap-core/List-of-AAP-plugins-and-hosts.md>,
  public upstream registry on a mutable wiki.
- **Scope/passage:** Current Host Apps table names UAPMD, AAP JUCE simple host,
  Helio Sequencer, and an AudioPluginHost port; AEMS is not listed.
- **Supports:** C-025, C-033.
- **Limitations:** Registry may be incomplete and omission cannot prove
  non-support; version compatibility changes are noted by upstream.
- **Selection rationale:** Best primary negative lead found after AEMS docs
  omitted AAP; preferable to extrapolating generic format capability.

**Negative/access results retained:** two initial web searches and two later
Windows searches were rate-limited (HTTP 429); an initial guessed Android
product URL and vendor sitemap returned 404; vendor-forum search returned 404;
Apple's current JS AU page fetched empty and one API URL returned 404; the
Android manual keyword endpoint returned an empty array; nested source help was
blocked by the subagent-depth limit. None was treated as positive evidence.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods/blocker | Decision impact | Safest next probe / required fixture / owner |
| --- | --- | --- | --- |
| Exact current Android semantic version and minimum OS | Google Play/vendor page/manual checked; retrieved listing exposes update date, not version/minimum OS | Version-qualified support and Android API baseline | Ask vendor or inspect official release metadata/Play Console without third-party APKs; unassigned |
| AEMS AU discovery validation/cache/duplicates/quarantine/rescan | Current store, AU/IAA manual, and Apple platform guide checked; product details absent | Host diagnosability and compatibility | Disposable iOS device with valid, duplicate-ID, malformed/failing, and updated AU fixtures; record UI/logs; unassigned |
| AU process isolation/crash containment/architecture bridge | Product docs only say embedded AU vs separate-app IAA | Reliability/security architecture | Safe crash/hang AU in disposable project plus OS process/log observation; no production credentials; unassigned |
| AU buses, dynamic I/O, sidechain, MIDI/MPE, parameter and latency/tail contract | Multi-output headline found; deep contract absent | Graph, PDC, automation, expressive-MIDI design | Versioned conformance suite with instrument/effect/MIDI/multi-out/sidechain/latency/tail fixtures; unassigned |
| AU/IAA state, asset references, migration, missing plug-ins, recovery | Save/autosave/freeze/AU preset pages checked; no plug-in-specific recall behavior | Project durability | Save known-state project, remove/update/reinstall plug-in and assets, reopen after clean crash; disposable iOS fixture; unassigned |
| Android AAP/other third-party host support | Store/manual inspected; AAP README/host registry checked; AEMS absent | Android ecosystem extension decision | First seek vendor confirmation; otherwise disposable Android device with one known AAP instrument/effect and capture selector behavior; unassigned |
| Plug-in delay compensation and sample-accurate automation | Latency/automation/export manuals checked; only recording offset and point curves documented | Timing correctness | Impulse/delay-reporting effect plus dense automated parameter capture against reference; unassigned |
| Android MPE, SysEx, MIDI 2.0 | Current listing and likely piano-roll/MIDI pages checked; no explicit evidence | Expressive hardware/plug-in interoperability | Vendor support query or MIDI monitor fixture covering MPE zones, SysEx, UMP; unassigned |
| Project schema/backward/forward compatibility | Public manuals expose folders and behavior, not schema | Migration/tooling/recovery | Prefer vendor-published schema/version policy; do not reverse engineer absent separate authority; unassigned |
| Current Windows edition/project compatibility | Current vendor navigation/stores checked; old Android overview conflicts; searches rate-limited | Desktop boundary and native handoff | Ask vendor whether Windows product/project loading is maintained; otherwise rely on stems/MIDI; unassigned |
| Crash recovery beyond autosaves and persistent undo | Save/manual checked; autosaves exist, undo clears on close | Data-loss model | Controlled app termination after edits at different autosave phases on disposable projects; unassigned |
| Accessibility and plug-in-UI accessibility | iOS store says undeclared; no product manual coverage | Inclusive design/procurement | VoiceOver/TalkBack, keyboard, contrast, scaling, and AU UI audit on named OS versions; unassigned |

Proprietary DSP, scheduler, USB-driver, project-format, and native-device
internals remain intentionally unknown; public behavior or a separately
authorized clean-room probe, not speculation, is the only acceptable next step
[C-007, C-032].

## 24. Curiosity pass and stop decision

Scores are 0–3 (higher relevance/value/novelty; higher cost is worse).

| Rank | Candidate follow-up | Relevance | Expected value | Novelty | Cost | Decision |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1 | AEMS-specific AU state/missing-plug-in documentary search | 3 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: no qualifying primary lead after targeted manual/store pass; dynamic probe is more discriminating |
| 2 | Definitive Android AAP denial/confirmation | 3 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: repeated negative signals, registry omission is non-conclusive, vendor/probe needed |
| 3 | Current Windows discontinuation history | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: current mobile boundary and stems/MIDI are sufficient; searches rate-limited |
| 4 | Exact Android version scraping | 2 | 1 | 0 | 2 | `CURIOSITY_NO_GO`: official update date is adequate for current-release evidence; brittle scraping adds little |
| 5 | Generic AAP extensions/bridges | 1 | 1 | 2 | 2 | `CURIOSITY_NO_GO`: cannot change AEMS conclusion until adoption is established |
| 6 | Exhaustive hardware/device compatibility | 1 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: vendor list is stale and deployment must be fixture-specific |
| 7 | Historical IAA SDK internals | 1 | 0 | 1 | 2 | `CURIOSITY_NO_GO`: deprecated and not needed for user-visible current status |
| 8 | User-review failure mining | 1 | 1 | 1 | 2 | `CURIOSITY_NO_GO`: secondary anecdotes cannot establish architecture |

The only initially qualifying curiosity thread was Android plug-in-host status.
It was pursued through the current store/manual plus AAP upstream architecture
and host registry; it produced the bounded `UNKNOWN`/native-only inference and
then saturated [C-025, C-033]. Other threads have nonpositive marginal evidence
within the documentary budget.

**Stop decision:** stop for **sufficient coverage plus saturation**. All template
sections and format rows are complete, current platform/version evidence is
anchored, mobile workflow/hardware/project behavior is covered by primary
sources, and consequential host-contract gaps are explicit. Further web passes
are unlikely to change the leading conclusions; the next phase should use
vendor confirmation or disposable interoperability fixtures, not indefinite
searching. Access limits (429/404/JS-only pages and blocked nested-agent depth)
are recorded but do not block the dossier.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** This researcher created
  only `research/daw-landscape/dossiers/audio-evolution-mobile-studio.md`; no
  staging or commit occurred.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See section 0 and C-001–C-003.
- [x] **Every required dossier heading exists in order.** Sections 0–25 are
  present, including all 11.x subsections.
- [x] **Every material assertion has a claim ID and classification.** Narrative
  claims cite C-IDs; the register supplies classification/confidence.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  sections 21–23.
- [x] **Every required plugin-format row is present.** All 13 required rows are
  present; an additional AAP row makes Android status explicit.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Discovery, runtime, processing, state, UI, diagnostics, and recovery are
  addressed in sections 11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** Labels and counterevidence appear throughout and in section 21.
- [x] **Licensing and clean-room boundaries are explicit.** See sections 16,
  18–19, and C-032.
- [x] **Bibliography records source rationale and limitations.** Eleven retained
  primary sources are described in section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See
  sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Research used public documentation/storefronts only;
  no app, binary, or plug-in was installed or run.

**Checks performed:** heading/matrix/claim/source/unknown/curiosity/manual
self-audit; assigned-path and baseline workspace-status check; no product
execution. **Concise result:** `COMPLETE_WITH_UNKNOWNS`, 33 registered claims,
11 retained primary sources, and all required plug-in rows completed.
**Unresolved blockers:** deep AU host contract, Android third-party-host status,
exact Android semantic version/minimum OS, and current Windows boundary require
vendor confirmation or later safe probes. **Pre-existing workspace changes:**
the baseline `git status --short --untracked-files=all` showed numerous modified
and untracked files outside the owned path, including other DAW dossiers; all
were left untouched.
