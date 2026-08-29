# Apple GarageBand DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** Apple GarageBand for Mac, iPhone, and iPad.
- **Canonical vendor:** Apple Inc.
- **Researcher/session:** subagent in session `ses_fb26b0e61ffe8a2yGtG80JwJmi`.
- **Owned path:** `research/daw-landscape/dossiers/apple-garageband.md`.
- **Research date and cutoff:** 2026-08-29 UTC.
- **Current releases pinned:** GarageBand 10.4.14 for Mac, with the App Store showing an Apr 22 update; GarageBand 2.3.19 for iPhone/iPad, with the App Store showing an Aug 13 update. Apple's current mobile user guides remain versioned 2.3.18, so guide-derived mobile behavior is scoped to 2.3.18 unless the 2.3.19 App Store page also states it. [C-001, C-002]
- **Platforms:** the current store requirements are macOS 15.6 or later and iOS 26.0 or later; the mobile listing covers iPhone and iPad. No Windows, Linux, Android, browser, or visionOS edition is in the retained official product scope. [C-001, C-003]
- **Editions:** one free Mac listing and one free iPhone/iPad listing; no paid GarageBand tier was documented. [C-001, C-002]
- **Included:** desktop and mobile song/project models, first-party devices/content, third-party Audio Unit hosting, Inter-App Audio on mobile, iCloud persistence, Logic Remote, GarageBand-to-Logic translation, and Mac/mobile exchange.
- **Excluded:** Logic Pro as a DAW except at the documented interchange boundary; legacy GarageBand releases except where the current guide exposes a compatibility distinction; proprietary binaries, private project schemas, Audio Unit SDK code, and dynamic execution.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.
- **Method:** public clean-room documentary research from official Apple sources only. No application, installer, project, plug-in, or proprietary binary was executed or inspected.

## 1. Executive summary

GarageBand is one product family with two materially different composition models. The Mac product is a conventional linear Tracks-area DAW with audio, software-instrument, Drummer, region, score, movie, global-track, and master-track concepts and an advertised 255-track ceiling. The iPhone/iPad product combines a 32-track linear song with Touch Instruments, song sections, Beat Sequencer, and a cell/column Live Loops performance grid. Treating mobile as a scaled desktop UI would miss first-class performance and touch objects. [C-004, C-005, C-006]

Third-party hosting is Apple-only and deliberately narrow in the documented contract. GarageBand 10.4.14 on Mac explicitly hosts both component-based **AUv2** effects/instruments and app-extension **AUv3** effects/instruments. Mobile hosts Audio Unit Extensions as instruments and effects; Apple calls Audio Unit Extensions AUv3 in the Mac guide, so the mobile AUv3 label is a bounded cross-source inference rather than a version token on the mobile page itself. Mobile also retains Inter-App Audio and an Audiobus recording path. [C-007, C-008, C-009]

Hosting depth is shallow. Apple documents install locations, global enablement, effect versus instrument placement, custom and standard views, presets, bypass/reorder controls, and a useful iPad VoiceOver parameter fallback. It does not document a GarageBand plug-in manager, validation report, quarantine, scanner/cache behavior, process isolation, crash containment, architecture bridge, sidechains, multi-output, dynamic buses, sample-accurate automation, latency/tail reporting, offline semantics, state schema, or missing-plug-in placeholder. A damaged AU can affect open/play/record behavior, and the documented recovery is global AU disablement and manual narrowing, not proven containment. [C-010, C-011, C-012, C-024-C-029]

Persistence and interchange are opinionated. Mobile iCloud syncs whole songs and preserves the newest conflicting copy. Mac-to-mobile sharing renders the existing Mac project into one mix track, lets mobile add tracks, and imports those additions back. Logic Pro 12.3 instead directly translates GarageBand Mac/iPhone/iPad projects into editable Logic tracks, tempo/key, first-party instrument/mix/effect state, patches, and fixed Reverb/Echo buses; the result saves as Logic and cannot return to GarageBand. [C-016, C-017, C-018]

The most transferable patterns are distinct mobile/desktop composition projections, explicit render-plus-additions exchange, accessible generic parameter views, and a one-way promotion translator into a richer schema. The main liabilities are a closed platform envelope, undocumented host internals, coarse recovery, narrow routing, and ambiguous third-party dependency durability. **Confidence:** high for product/version/platform scope, visible workflows, AU version/placement, accessibility, iCloud behavior, and Logic interchange; medium for cross-source AUv3 mobile nomenclature; low or unknown for proprietary engine and complete host-contract behavior. [C-003, C-008, C-017, C-018, C-024-C-032]

## 2. Product identity, history, and market position

Apple currently distributes GarageBand free as separate Mac and iPhone/iPad listings. The Mac listing positions it as an approachable recording studio with recording, arranging, mixing, Drummer, lessons, amps, and up to 255 tracks. The mobile listing positions it as an anywhere studio and playable instrument with Touch Instruments, Live Loops, and up to 32 tracks. These are maintained products at the cutoff, with current App Store versions 10.4.14 and 2.3.19. [C-001, C-002, C-004-C-006]

GarageBand sits below Logic Pro in Apple's product progression, but not as a bidirectionally compatible edition. Logic directly translates GarageBand projects and then saves a Logic project; GarageBand cannot open Logic projects. That makes Logic a one-way promotion target, not a second GarageBand edition. [C-018]

No market-share or historical-lineage claim is made. Those questions do not change the product, engine, persistence, or plug-in architecture decision and were rejected under the bounded research budget.

## 3. Workflow and conceptual model

**Mac.** A project contains a linear Tracks area and regions, with audio tracks, software-instrument tracks, Drummer tracks, a master track, and optional global tempo, transposition, arrangement, and movie tracks. Editors include Audio, Piano Roll, Score, and Drummer views. Regions can be selected, moved, looped, resized, split, joined, created, renamed, and deleted; Flex Time, pitch correction, groove alignment, takes, and arrangement markers add higher-level behavior. [C-004, C-019]

**iPhone/iPad.** A song can be built in Tracks view from Touch Instruments, recorded audio, MIDI, Apple Loops, and Drummer content. Song sections divide the linear arrangement. Live Loops adds a parallel grid model with cells and columns that can contain loops or recorded Touch Instruments; users can trigger and record a performance into an arrangement. [C-005, C-006]

The family therefore shares song, track, region, instrument, effect, loop, tempo, and mix concepts, while mobile adds playable surfaces and Live Loops and Mac adds score, movie, richer global tracks, lessons, and a larger track ceiling. This is an **INFERENCE** from the two current guide maps, not evidence of a common internal object schema. [C-006, C-030]

## 4. Publicly documented architecture

Apple publicly documents user-facing boundaries, not the proprietary engine implementation:

- Mac uses installed Core Audio input/output devices and has a microphone privacy gate. [C-013]
- Mac AUv2 components reside in `Library/Audio/Plug-ins/Components`; AUv3 apps reside in `Applications`; both are globally enabled in Audio/MIDI settings. [C-007]
- Mobile discovers installed Audio Unit Extension apps and Inter-App Audio apps, then exposes them as instruments or effects. [C-008, C-009]
- Mobile iCloud performs whole-song synchronization with a newest-copy conflict rule. [C-016]
- Logic performs an explicit translation from a GarageBand project into a new Logic project. [C-018]

Threading, render graph, process boundaries, scanner service, extension transport, cache, project schema, state serialization, scheduler, DSP precision, and crash recovery internals are `UNKNOWN`. AUv3's "extension" name is not promoted to a GarageBand isolation claim without GarageBand- or platform-runtime evidence for the versions in scope. [C-024-C-030]

## 5. Audio engine

GarageBand for Mac uses Core Audio devices selected separately for input and output. The current settings page exposes device selection, microphone access, global AU enablement, MIDI reset, and controller selection, but no user buffer-size or engine-mode control. [C-013]

The mobile App Store states that recording, mixing, and exporting can be performed at 24-bit audio resolution. It does not state sample rates, internal accumulator precision, dither, or whether every imported/hosted path remains 24-bit. [C-005]

Both products record and export songs, and the Mac guide exposes export to disk/iCloud, Music, CD, and movie-soundtrack workflows. The gathered sources do not define real-time versus offline rendering, render tails, oversampling, multicore scheduling, freeze, general bounce-in-place, dropout handling, or plug-in delay compensation. Track merging exists in the mobile guide map, but its exact destructive/render semantics were not retained. [C-019, C-027]

## 6. Tracks, timeline, clips, and editing

Mac advertises up to 255 tracks and provides region operations, audio and MIDI editors, multiple audio/software-instrument takes, multitrack recording, Flex Time, pitch correction, groove track, cycle recording, tempo/key/time-signature settings, arrangement markers, and undo/redo. A Score Editor can add/edit/quantize/print notation, and a Movie track supports soundtrack work. [C-004, C-019]

Mobile advertises up to 32 tracks and provides Tracks view, regions, note editing, multi-take recording, song sections, volume automation, track merging, and Live Loops cells/columns with recorded performances. The 32-track listing applies to the current 2.3.19 store scope; detailed editor behavior comes from the 2.3.18 guide. [C-005, C-006]

Neither retained guide states exact source-reference semantics, edit-history persistence, comp-swipe lanes, group editing, ripple modes, or forward/backward project compatibility. Mac lock-track behavior is documented by the guide map, but whether it renders, merely protects, or both was not established. [C-019, C-030]

## 7. MIDI, sequencing, notation, and expression

Mac supports software-instrument recording, Piano Roll note editing/quantization/automation, Score editing and printing, an Arpeggiator, MIDI controllers, global tempo/transposition tracks, and MIDI-file import according to the current guide map. [C-019]

Mobile supports Touch Instrument recording, note editing, Beat Sequencer, Bluetooth MIDI devices, MIDI-file import, and a documented MPE-controller workflow. The evidence establishes MPE controller input as a user feature, not the complete per-note data model or AU delivery fidelity. [C-006, C-020]

MIDI 2.0, SysEx, MTC, MIDI clock behavior, MIDI-generating AU effects, sample-accurate event delivery, expression persistence, and Mac MPE behavior are `UNKNOWN`. [C-026]

## 8. Routing, mixer, automation, and control

Mac exposes stereo track volume/pan, track and master effects, mute/solo, and track/master automation that can change mix, effect, tempo, and pitch settings over time. Logic's translator documents two fixed GarageBand bus effects, Reverb and Echo, mapping them to Logic buses 1 and 2. [C-014, C-018]

Mobile provides track effect chains, track volume automation, recorded movement of Touch Instrument controls, and Remix FX performance; a returned Remix FX track becomes Mac master automation. [C-005, C-017]

GarageBand on Mac can be controlled with Logic Remote from iPhone/iPad. The gathered evidence does not establish a public OSC endpoint, scripting/action API, arbitrary control-surface SDK, or general remote protocol. [C-021, C-032]

User buses/auxes, arbitrary sends/returns, feedback routing, folders/VCAs, sidechains, multi-output instruments, surround/immersive channels, dynamic I/O, automation sampling rate, stable parameter identity, and sample accuracy remain `UNKNOWN`. The two known Reverb/Echo buses must not be generalized into an unrestricted bus graph. [C-026, C-029]

## 9. Recording, comping, and media handling

Mac documents audio and software-instrument recording, multiple takes, take selection/deletion, simultaneous multitrack recording, input monitoring, microphone/guitar/keyboard attachment, Apple Loops, audio/MIDI import, and movie soundtrack workflows. The App Store describes multi-take recording and Flex Time. [C-004, C-019]

Mobile records Touch Instruments, microphone/guitar input, third-party music-app output, Audio Unit instruments, and Live Loops cells/performances. It supports multi-take recording; simultaneous multitrack recording requires a compatible third-party interface. The Sound Library delivers additional first-party instruments, loops, and packs. [C-005, C-006, C-008, C-009]

Punch, pre-roll, take-comp lanes, BWF metadata, conform/proxy workflows, asset relinking, video on mobile, and missing-media recovery are not established by retained passages. [C-030]

## 10. Instruments, effects, content, and native devices

Mac's architecture-relevant native inventory includes Drummer, patches and Smart Controls, software instruments, Apple Loops, Audio/Piano Roll/Score/Drummer editors, visual EQ, Arpeggiator, Amp Designer, Bass Amp Designer, Pedalboard, and track/master effects. The App Store advertises 33 Drummer players, 25 Amp Designer amp/cabinet models, and 35 Pedalboard effects; those are catalog statements, not DSP-fidelity measurements. [C-004, C-019]

Mobile's native model includes Touch Instruments, Alchemy, Sampler, Audio Recorder, drums and Smart Drums, Beat Sequencer, amps/stompboxes, Drummer, Smart Instruments, Remix FX, Visual EQ, Apple Loops, Live Loops, and downloadable Sound Library packs. [C-005, C-006]

Mac patches package instrument/effect behavior behind Smart Controls; Logic translates GarageBand patches one-to-one and then exposes their inserted plug-ins. Mobile custom sounds and AU presets provide a similar user-facing recall boundary, but a shared patch/state schema across platforms is not documented. [C-008, C-018, C-030]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means no affirmative current official GarageBand host evidence was retained; it does not mean a signed fixture was rejected. [C-023]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `UNKNOWN:no current official host evidence` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `UNKNOWN:no mobile host evidence` | 10.4.14 Mac / 2.3.18 guide / 2.3.19 mobile | Current affirmative host docs name Audio Units only | C-023 / S-005, S-006 |
| VST3 | `UNKNOWN:no current official host evidence` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `UNKNOWN:no mobile host evidence` | Same | Do not infer rejection from omission | C-023 / S-005, S-006 |
| AUv2 | `DOCUMENTED:supported effects and instruments` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `UNKNOWN:no affirmative mobile AUv2 component-host evidence` | Mac 10.4.14 / macOS 15.6+ | Components install in `Library/Audio/Plug-ins/Components`; global enable; effect, instrument, master placement | C-007 / S-005, S-012 |
| AUv3 | `DOCUMENTED:supported effects and instruments` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `INFERENCE:Audio Unit Extensions are AUv3` | Mac 10.4.14; mobile behavior 2.3.18/current listing 2.3.19 | Mac guide explicitly equates Audio Unit Extensions with AUv3; mobile docs use the extension name | C-007, C-008 / S-004-S-006, S-012 |
| AAX | `UNKNOWN:no current official host evidence` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `UNKNOWN:no mobile host evidence` | Current family | No qualification or licensing conclusion | C-023 / S-005, S-006 |
| CLAP | `UNKNOWN:no current official host evidence` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `UNKNOWN:no mobile host evidence` | Current family | No public support statement retained | C-023 / S-005, S-006 |
| LV2 | `UNKNOWN:no current official host evidence` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `UNKNOWN:no mobile host evidence` | Current family | No public support statement retained | C-023 / S-005, S-006 |
| LADSPA | `UNKNOWN:no current official host evidence` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `UNKNOWN:no mobile host evidence` | Current family | No public support statement retained | C-023 / S-005, S-006 |
| DSSI | `UNKNOWN:no current official host evidence` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `UNKNOWN:no mobile host evidence` | Current family | No public support statement retained | C-023 / S-005, S-006 |
| JSFX | `UNKNOWN:no current official host evidence` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `UNKNOWN:no mobile host evidence` | Current family | No public support statement retained | C-023 / S-005, S-006 |
| DirectX/DXi | `NOT_APPLICABLE:Windows technology and no Windows GarageBand` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `NOT_APPLICABLE:Windows technology` | Current family | No DX host product in scope | C-003 / S-001-S-004 |
| Rack Extension | `UNKNOWN:no current official host evidence` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `UNKNOWN:no mobile host evidence` | Current family | No public support statement retained | C-023 / S-005, S-006 |
| Product-native/other | `DOCUMENTED:GarageBand instruments/effects, Apple Loops, patches` | `NOT_APPLICABLE:no Windows GarageBand` | `NOT_APPLICABLE:no Linux GarageBand` | `DOCUMENTED:GarageBand devices/content, Inter-App Audio, Audiobus recording path` | Mac 10.4.14; mobile 2.3.18/2.3.19 | Inter-App Audio/Audiobus are app integration paths, not AU formats | C-004-C-006, C-009 / S-001-S-004, S-006 |

### 11.2 Discovery, scanning, validation, and recovery

On Mac, AUv2 components are installed into the Components directory, AUv3 extensions into Applications, and Audio Units are enabled globally. The source does not name user/system domain variants, duplicate identity rules, scan timing, a plug-in manager, cache, validation status, blacklist/quarantine, rescan, or rejection diagnostics. [C-007, C-024]

On mobile, installed Audio Unit Extensions appear in an Audio Unit Extensions list for instrument or effect selection. Inter-App Audio apps appear separately. App installation/discovery is therefore visible, but validation, duplicate identity, cache, entitlement failure, and retry behavior are undocumented. [C-008, C-009, C-024]

Apple's Mac troubleshooting flow asks users to globally disable Audio Units, test a new project/user, and narrow to a particular plug-in. This proves that a damaged or incompatible AU can affect open/play/record behavior; it does not prove scanner isolation or per-instance recovery. [C-010, C-025]

### 11.3 Runtime isolation and compatibility

GarageBand-specific AU scan/runtime process isolation, sandboxing, crash containment, service restart, and per-instance failure recovery are `UNKNOWN`. The failure guidance is compatible with either in-process or imperfectly isolated execution, so topology cannot be inferred. [C-010, C-025]

Apple's platform guidance states that a Universal app may expose "Open using Rosetta," allowing the whole app to run as Intel code for Intel-only plug-ins/add-ons. It also says Rosetta remains generally available through macOS 27 and is restricted on macOS 28. The retained GarageBand sources do not say whether current GarageBand exposes this option or bridges plug-ins independently. [C-011, C-025]

Mobile AU extensions are installed app extensions, but their exact GarageBand process and sandbox boundary, memory policy, interruption behavior, and crash effect are not documented in retained sources. [C-025]

### 11.4 Host/plugin processing contract

Mac AU effects can run on audio tracks, software-instrument tracks, and the master track. AU instruments run only in the software-instrument slot and replace the prior instrument. Mobile AU instruments behave as playable/recordable Touch Instruments; AU effects occupy track plug-in slots. [C-007, C-008]

Mobile Inter-App Audio instruments feed recorded audio to Audio Recorder, Amp, or Sampler tracks; Inter-App Audio effects process those sources while recording. Some connected apps can control GarageBand transport/recording, while others require app switching. [C-009]

No retained GarageBand source specifies sidechain inputs, multiple audio buses, multi-output instruments, MIDI output, arbitrary event buses, MPE delivery to AUs, MIDI 2.0, sample-accurate automation/events, dynamic I/O, latency/tail queries, bypass timing, suspend/sleep, in-place processing, offline render callbacks, or headless instantiation. [C-026, C-027]

### 11.5 Parameters, automation, state, presets, and project recall

Mac users can open the plug-in window, edit settings, toggle/remove/replace instances, and save custom patches. Mobile users can load/save/edit instrument sounds and save/rename/delete AU effect presets. Mobile can switch between a plug-in custom view and host controls. [C-007, C-008, C-019]

GarageBand automates mix and effect settings on Mac, while mobile records volume and Touch Instrument control movement. The sources do not define stable parameter IDs, normalized ranges, display strings, gesture semantics, sample accuracy, or whether every third-party AU parameter is automatable. [C-014, C-026]

Logic translation preserves first-party GarageBand instrument, mixing, effect, patch, Reverb, and Echo state as described by Apple. It does not explicitly promise translation of arbitrary third-party AU instances or state. GarageBand project recall, AU state chunks, external asset references, version migration, AUv2/AUv3 substitution, and missing/unlicensed AU placeholders remain `UNKNOWN`. [C-018, C-028]

### 11.6 UI, diagnostics, and failure modes

Mac opens a plug-in window from the slot. Mobile supports a plug-in-provided custom view and a host standard/control view. On iPad, VoiceOver can add/reorder/bypass plug-ins; if a custom AU UI is difficult, an Edit view exposes accessible controls for each parameter. [C-007, C-008, C-015]

Diagnostics are limited in retained GarageBand documentation to symptom isolation: disable all AUs, test a new project/user, reset preferences, and consult the manufacturer. There is no documented per-plug-in validation report, crash log link, safe-mode placeholder, or project-open-without-one-instance control. Accessibility of arbitrary Mac AU custom editors and mobile custom drawings remains vendor-dependent/unknown despite the mobile generic parameter fallback. [C-010, C-015, C-024, C-028]

## 12. Extensibility and integration

Documented integration surfaces are AUv2/AUv3 hosting on Mac, Audio Unit Extensions and Inter-App Audio/Audiobus on mobile, third-party Apple Loops, MIDI/audio devices, Logic Remote, iCloud, and Logic project translation. [C-007-C-009, C-018, C-021]

No public GarageBand scripting language, macro engine, command API, OSC API, controller SDK, native-device SDK, or project-format specification was found in the retained current guide boundaries. Audio Unit authoring belongs to Apple's separate platform SDK and was not treated as a GarageBand implementation contract. [C-032]

## 13. Project format, persistence, interoperability, and collaboration

Mac projects default to `~/Music/GarageBand`, can be saved/compressed, synchronized across Macs with iCloud, and can import GarageBand mobile songs. Exact package layout and schema are not documented here. [C-001, C-018, C-030]

Mobile songs can reside locally or in iCloud Drive. Closing the song/app updates iCloud; when devices conflict, a copy containing the newest changes is saved beside the original. Deleting an iCloud song removes it from all devices. This is file/song synchronization with conflict copying, not real-time multi-author collaboration. [C-016]

Mac-to-mobile project sharing creates a special mobile song whose initial content is one track containing a mix of the entire Mac project. Mobile can add/edit/arrange new tracks and return them; Mac adds those tracks to the original, and Remix FX maps to master automation. This preserves the original Mac project by reference/workflow rather than round-tripping every desktop object through mobile. [C-017]

Logic Pro 12.3 opens GarageBand projects from Mac, iPhone, and iPad without an explicit import/conversion step, then translates track count/types, tempo, key, first-party instruments, mixing/effects/settings, patches, and Reverb/Echo buses. Saving produces a Logic project; GarageBand cannot open Logic projects. [C-018]

Autosave cadence, crash journal, durable undo, schema versioning, third-party AU missing-state preservation, archive/collect, AAF/OMF/ADM/MusicXML/DAWproject export, version control, and operation-level collaboration remain `UNKNOWN`. [C-028, C-030, C-031]

## 14. Delivery, live, post-production, and specialized workflows

Mac supports song export to disk/iCloud and Music, CD burning, AirDrop/Mail, and movie soundtrack replacement; it also includes guitar/piano lessons. Mobile exports/shares songs, creates ringtones, supports social sharing, records Live Loops/Remix FX performances, and can mirror to Apple TV. Mobile's App Store states 24-bit recording/mixing/export. [C-004-C-006, C-019]

GarageBand is strongest as an accessible music-creation, learning, touch-performance, and songwriting environment. The gathered sources do not establish AAF/OMF conform, ADR, broadcast loudness, DDP, surround/immersive/ADM, batch render, or show-control workflows. [C-031]

## 15. Performance, reliability, security, and accessibility

Published scaling limits are 255 tracks on Mac and 32 on mobile; simultaneous mobile multitrack recording requires compatible hardware. These are product limits/requirements, not independent performance benchmarks. [C-004, C-005]

The Mac troubleshooting page establishes that third-party AUs and external devices can cause open/play/record problems and recommends updates, built-in-audio testing, global AU disablement, a clean project/user, and preference reset. Preference reset does not affect project files, presets, or patches. No crash-containment or rollback guarantee is documented. [C-010, C-025]

Current App Store disclosures list VoiceOver, Voice Control, Dark Interface, Differentiate Without Color Alone, and Captions for both products. The iPad guide adds a concrete accessible generic AU parameter view. The Mac listing says collected identifiers are not linked to identity; the mobile listing says user content and identifiers may be linked to identity. These are vendor declarations, not an independent accessibility/privacy audit. [C-002, C-015, C-022]

Mac requires microphone permission for selected input. Code-signature/notarization enforcement for AUs, AUv2 trust boundaries, mobile extension entitlements, telemetry detail, security update cadence, and custom third-party UI accessibility remain `UNKNOWN`. [C-013, C-025, C-033]

## 16. Licensing, ecosystem, and implementation constraints

GarageBand is free from Apple, but free price does not imply open-source or redistribution rights. The retained sources identify Apple as seller/copyright holder; no source license or public GarageBand device SDK was found. [C-001, C-002, C-032]

Apple quotes the GarageBand software license as permitting included Apple/third-party Audio Content royalty-free in original music or audio projects, including broadcast/distribution, while prohibiting standalone distribution or repackaging of individual loops as samples, effects, or music beds. This is a product-content condition, not legal advice. [C-034]

Third-party AU apps/components, Inter-App Audio apps, Audiobus, interfaces, and their content remain separately licensed. Naming AUv2, AUv3, Audio Units, Logic, or other formats grants no SDK, trademark, App Store, signing, redistribution, or compatibility right. An implementation must obtain current platform SDK/license terms independently and qualify its own host; no protected code, manual expression, UI assets, or private project schema was copied. [C-023, C-032]

Rosetta's announced contraction after macOS 27 is an ecosystem constraint for Intel-only plug-ins, not evidence that current GarageBand itself is Intel-only or that it exposes Rosetta mode. [C-011]

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** GarageBand presents approachable domain objects, makes mobile performance first-class, provides first-party content/devices, supports both AU generations on Mac, offers AUv3 instruments/effects on mobile, supplies an accessible generic parameter fallback, synchronizes songs, and has a strong one-way Logic promotion path. [C-004-C-008, C-015-C-018]

**Liabilities.** The platform envelope is Apple-only; mobile and desktop have divergent limits/models; Mac-to-mobile exchange renders the desktop arrangement; Logic conversion is one-way; routing is narrow in public evidence; and AU validation, isolation, latency, state durability, missing instances, and architecture compatibility are opaque. [C-003, C-017, C-018, C-024-C-031]

**Architecture lesson.** The useful reference is the boundary design, not Apple's proprietary implementation: retain a small shared song vocabulary, allow platform-specific composition projections, preserve unsupported detail through rendered/context tracks, provide an accessible host-owned parameter UI, and translate explicitly into richer project schemas. Do not assume one binary schema or a complete AU host contract from family branding. [C-006, C-015, C-017, C-018, C-030]

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites/tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Desktop and touch workflows need different objects | Shared song/track/region core plus platform-specific timeline, touch-instrument, and cell/column projections | C-004-C-006 | Explicit capability/schema negotiation | Do not copy Apple's UI or assume its private schema | `CANDIDATE` |
| A reduced client cannot preserve a richer project | Render the rich arrangement as a context track; return only newly supported tracks/automation | C-017 | Stable parent association and conflict UX; reduced editability | Render can hide dependencies and stale context | `CONDITIONAL` |
| Novice projects should graduate to an advanced DAW | One-way translator that maps known objects/state into a richer destination schema and saves under a new format | C-018 | Versioned mappings and diagnostics | Closed ecosystem; third-party AU mapping remains unknown | `CANDIDATE` |
| Plug-in custom UI may be inaccessible | Host-owned generic parameter view with keyboard/screen-reader controls | C-008, C-015 | Reliable parameter metadata and ordering | Custom semantic widgets may degrade | `CANDIDATE` |
| Plug-in ecosystems need clear categories | Separate instrument and effect selection/placement, with master effects explicitly bounded | C-007, C-008 | Typed slots simplify UX but restrict graphs | May not fit MIDI FX or multi-bus processors | `CANDIDATE` |
| Mobile conflicts are inevitable | Whole-document sync plus preserved conflict copy rather than silent overwrite | C-016 | Storage overhead and manual reconciliation | Not collaboration; newest timestamp can be misleading | `CONDITIONAL` |
| Included content should be usable in finished work | State a clear distinction between use in original works and standalone redistribution | C-034 | Counsel and content provenance required | Terms are product-specific; do not reuse text | `CANDIDATE` |
| Plug-in failures can block work | Provide a host-level "open without plug-ins" mode, then per-instance narrowing | C-010, C-024 | GarageBand only documents global disablement; stronger design needed | Do not mistake troubleshooting for isolation | `CONDITIONAL` |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject treating mobile as a miniature desktop DAW.** Live Loops, Touch Instruments, 32-track limits, and song sections are first-class mobile concepts. [C-005, C-006]
- **Reject flattening a rich project as the only source of truth.** GarageBand's Mac-to-mobile mix track works as context because the original Mac project remains authoritative; using only that render would lose editable structure. [C-017]
- **Reject one-way conversion without provenance and fallback.** Logic translation is useful promotion, but saving exits the GarageBand format. A new design should retain source identity and diagnostics. [C-018]
- **Reject equating AUv3 app-extension packaging with proven crash containment.** GarageBand runtime boundaries are undocumented. [C-025]
- **Reject equating "Audio Unit supported" with complete sidechain, multi-output, latency, state, UI, and automation conformance.** Only selected user paths are documented. [C-026-C-028]
- **Reject treating omission as proof that VST/AAX/CLAP/LV2 and other required formats are rejected.** Current docs provide an affirmative AU set, not a formal negative matrix. [C-023]
- **Reject newest-copy iCloud behavior as real-time collaboration or version control.** It is document sync with conflict copying. [C-016]
- **Reject assuming Rosetta provides a GarageBand-specific bridge.** Apple's guidance describes a possible whole-host translation mode for Universal apps; GarageBand exposure is unknown. [C-011, C-025]
- `CURIOSITY_NO_GO`: exhaustive first-party sound/device inventory. High churn and low architecture value after native integration classes were established.
- `CURIOSITY_NO_GO`: market-share and long history. Low expected value for the architecture decision.
- `CURIOSITY_NO_GO`: private `.band` package/schema inspection. Proprietary, unnecessary in this documentary wave, and outside clean-room limits.
- `CURIOSITY_NO_GO`: broad user forums for missing-AU anecdotes. Lower authority and unable to prove state semantics.
- `CURIOSITY_NO_GO`: Audio Unit SDK internals. Format-owner research belongs in a format dossier; a generic SDK contract would not prove GarageBand conformance.
- `CURIOSITY_NO_GO`: dynamic crash/latency/state fixtures. High decision value but explicitly deferred to an authorized disposable qualification harness.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test | Result | Counterevidence/next test |
| --- | --- | --- | --- |
| H-01: Mac and mobile GarageBand expose the same project model | Compare current guide maps and track limits | **FALSIFIED:** shared vocabulary, but mobile adds Live Loops/Touch Instruments and Mac adds score/movie/global-track depth | Later schema fixture could test hidden commonality [C-004-C-006, C-030] |
| H-02: GarageBand on Mac hosts only legacy AUv2 | Current 10.4.14 AU page/settings | **FALSIFIED:** AUv2 and AUv3 are explicit | Signed effect/instrument fixtures should qualify details [C-007] |
| H-03: "Audio Unit Extensions" proves mobile AUv3 | Compare Apple's Mac nomenclature with mobile host docs | **SUPPORTED AS INFERENCE:** Apple equates Audio Unit Extensions with AUv3, but mobile page omits the token | Apple platform developer docs or signed AUv3 fixture [C-008] |
| H-04: AUv3 packaging guarantees plug-in crash containment | Current host/troubleshooting docs | **NOT SUPPORTED:** process and crash boundaries are undisclosed | Observe process tree and crash fixture in a disposable device/simulator [C-025] |
| H-05: GarageBand's AU support implies full host conformance | Positive placement/UI/preset evidence versus contract gaps | **PARTIAL ONLY:** instruments/effects and selected UI/state paths work; advanced buses, timing, latency, and recovery are unknown | Versioned AUv2/AUv3 conformance suite [C-007, C-008, C-024-C-028] |
| H-06: Mac projects round-trip structurally through mobile | Mac-to-iOS share documentation | **FALSIFIED:** existing Mac structure becomes one mix track; only mobile additions return structurally | Marked-state Mac-to-mobile-to-Mac fixture [C-017] |
| H-07: Logic interchange is bidirectional | Current Logic GarageBand-project chapter | **FALSIFIED:** Logic translates GarageBand, then saves Logic; GarageBand cannot reopen Logic projects | No probe needed unless Apple changes contract [C-018] |
| H-08: Logic translation preserves every third-party AU instance/state | Current translation details | **INCONCLUSIVE:** Apple explicitly describes first-party instruments/effects/patches, not arbitrary third-party AUs | AUv2/AUv3 projects with unique state and missing variants [C-018, C-028] |
| H-09: Current GarageBand bridges Intel-only AUs on Apple silicon | GarageBand AU docs plus Rosetta platform note | **INCONCLUSIVE:** whole-host Rosetta is possible for Universal apps, but GarageBand mode/bridging is unstated | Inspect Finder architecture/options and run signed x86_64-only fixtures if authorized [C-011, C-025] |
| H-10: A missing AU leaves a durable state-preserving placeholder | Project/interchange/troubleshooting docs | **INCONCLUSIVE:** no placeholder or round-trip guarantee found | Remove/reinstall and Mac/mobile/Logic round-trip fixture [C-028] |

The analysis explicitly distinguishes **format named**, **extension discovered**, **instance inserted**, **UI opened**, **preset/state recalled**, and **full host contract qualified**. The sources establish the middle user paths only; no complete conformance claim is made. [C-007, C-008, C-024-C-028]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | **DOCUMENTED** | High | Current Mac release is GarageBand 10.4.14; it is free and requires macOS 15.6+. | App Store at cutoff | S-001, S-002 | Official current guide/store | Store renders Apr 22 without year in fetched text |
| C-002 | **DOCUMENTED** | High | Current mobile listing is 2.3.19 for iPhone/iPad, free, requiring iOS 26+, while detailed guides remain 2.3.18. | Cutoff 2026-08-29 | S-003, S-004 | Official guide/store version mismatch retained | iPadOS minimum is not separately rendered in store passage |
| C-003 | **INFERENCE** | High | No supported Windows, Linux, Android, browser, or visionOS GarageBand edition is in current scope. | Current family | S-001-S-004 | Official listings/guides enumerate Mac/iPhone/iPad | Does not prove no private/legacy experiment exists |
| C-004 | **DOCUMENTED** | High | Mac is a linear recording/arranging DAW with up to 255 tracks, Drummer, Smart Controls, amps/effects, takes, lessons, and iCloud/Logic Remote integration. | 10.4.14/current listing | S-001, S-002 | Official feature inventory/guide map | Catalog statements are not performance measurements |
| C-005 | **DOCUMENTED** | High | Mobile supports up to 32 tracks, 24-bit record/mix/export, Live Loops, Touch Instruments, multi-take recording, control automation, and Sound Library content. | 2.3.19 listing | S-004 | Official current listing | Detailed behavior guide is 2.3.18 |
| C-006 | **DOCUMENTED** | High | Mobile's model includes Tracks view, song sections, regions, Live Loops cells/columns, recorded performances, Beat Sequencer, Drummer, and Touch Instruments. | 2.3.18 guide | S-003 | Official guide map/welcome | Internal schema and exact 2.3.19 changes unknown |
| C-007 | **DOCUMENTED** | High | Mac 10.4.14 hosts AUv2 components and AUv3 app extensions as effects/instruments; effects can run on tracks/master and instruments replace the instrument slot. | macOS 15.6+ | S-005, S-012 | Explicit version names, paths, settings, placements | Advanced host contract not specified |
| C-008 | **INFERENCE** | Medium-high | Mobile Audio Unit Extensions are AUv3 and support instruments/effects, host/custom UI, and host-managed custom sounds/presets. | Mobile 2.3.18 | S-004-S-006 | S-005 equates extension with AUv3; S-006 describes mobile behavior | Mobile page does not itself say "AUv3" |
| C-009 | **DOCUMENTED** | High | Mobile supports Inter-App Audio instruments/effects and an Audiobus recording path, with record/app-switch behavior and optional app transport control. | Mobile 2.3.18 | S-006 | Explicit integration workflow | Inter-App Audio is not an AU format |
| C-010 | **DOCUMENTED** | High | Damaged/incompatible Mac AUs can affect open/play/record behavior; documented recovery globally disables AUs and narrows with project/user/preference tests. | Mac support article 2024/currently published | S-010 | Official troubleshooting sequence | Does not establish incidence or process topology |
| C-011 | **DOCUMENTED** | High | Apple documents whole-app Rosetta operation for Intel-only add-ons when a Universal app exposes it; general Rosetta ends after macOS 27 except restricted macOS 28 game use. | Apple silicon platform, 2026 | S-011 | Official platform compatibility page | GarageBand-specific mode/bridge is not stated |
| C-012 | **DOCUMENTED** | High | Mac AU discovery begins from AUv2 Components/AUv3 Applications installation and global enablement. | Mac 10.4.14 | S-005, S-012 | Explicit paths/settings | Scan/cache/validation semantics absent |
| C-013 | **DOCUMENTED** | High | Mac selects Core Audio input/output devices and gates input through macOS microphone permission. | Mac 10.4.14 | S-012 | Explicit settings | Buffer/sample rate/internal engine unknown |
| C-014 | **DOCUMENTED** | High | Mac mixes with stereo volume/pan, track/master effects, and track/master automation of mix, effect, tempo, and pitch settings. | Mac 10.4.14 | S-013 | Official mixing overview | Parameter list/sample accuracy not complete |
| C-015 | **DOCUMENTED** | High | iPad VoiceOver can add/reorder/bypass plug-ins and expose generic accessible controls for every advertised AU parameter in Edit view. | iPad guide 2.3.18 | S-015 | Explicit VoiceOver workflow | Does not make every custom UI semantically equivalent |
| C-016 | **DOCUMENTED** | High | Mobile iCloud syncs whole songs, updates on close, and preserves a newest-change copy when devices conflict. | Mobile 2.3.18 | S-009 | Explicit conflict behavior | Not real-time collaboration/version control |
| C-017 | **DOCUMENTED** | High | Mac-to-mobile sharing renders the Mac project as one mix track; mobile additions return as new tracks and Remix FX as master automation. | Mac 10.4.14 | S-007 | Explicit round-trip workflow | Third-party dependency behavior not described |
| C-018 | **DOCUMENTED** | High | Logic Pro 12.3 translates GarageBand Mac/iPhone/iPad projects into Logic tracks, tempo/key, first-party instrument/mix/effect/patch and fixed-bus state; saving is one-way to Logic. | Logic 12.3 / Mac 15.6 | S-008 | Explicit mapping and non-return note | Arbitrary third-party AU preservation unstated |
| C-019 | **DOCUMENTED** | High | Current Mac guide maps regions/editors, takes, multitrack recording, loops/import, movie, notation, global tracks, sharing, and custom patches. | Mac 10.4.14 | S-001 | Official table of contents and linked feature names | Guide-map titles do not prove edge-case semantics |
| C-020 | **DOCUMENTED** | Medium-high | Mobile exposes Bluetooth MIDI and MPE-controller workflows. | Mobile 2.3.18 | S-003 | Official guide feature entries | Per-note storage/AU delivery not established |
| C-021 | **DOCUMENTED** | High | Logic Remote can control GarageBand on Mac from iPhone/iPad. | Current Mac | S-001, S-002 | Official guide/listing | Protocol/API not public in retained evidence |
| C-022 | **DOCUMENTED** | High | App Store declarations list VoiceOver, Voice Control, Dark Interface, non-color differentiation, captions, and different Mac/mobile data-linkage disclosures. | Current listings | S-002, S-004 | Official vendor declarations | Not independent audit; usage may vary |
| C-023 | **UNKNOWN** | High that evidence is absent | Current GarageBand support/rejection for VST2/VST3/AAX/CLAP/LV2/LADSPA/DSSI/JSFX/Rack Extension is not formally documented. | Current family | S-005, S-006, S-012 | Affirmative host pages checked | Omission is not dynamic rejection |
| C-024 | **UNKNOWN** | High that evidence is absent | GarageBand scan/validation/cache/duplicate/blacklist/quarantine/rescan and detailed diagnostics are undocumented. | Current family | S-005, S-006, S-010, S-012 | Install/list/recovery paths checked | Next: official engineering evidence or safe scanner observation |
| C-025 | **UNKNOWN** | High that evidence is absent | AU process isolation, sandboxing, crash containment, architecture bridging/signing policy, and mobile extension runtime boundaries are undisclosed. | Current family | S-005, S-006, S-010-S-012 | Failure and platform compatibility docs checked | Next: signed crash/architecture fixtures and process observation |
| C-026 | **UNKNOWN** | High that evidence is absent | Sidechains, multi-output/dynamic buses, MIDI output, MIDI 2.0, sample-accurate automation/events, and full parameter semantics are undocumented. | Current family | S-005, S-006, S-013 | Positive placement/automation evidence is partial | Versioned conformance harness required |
| C-027 | **UNKNOWN** | High that evidence is absent | General PDC, plug-in latency/tail reporting, internal precision/rates, offline callbacks, suspend, multicore scheduling, oversampling, and dropout handling are undocumented. | Current family | S-001, S-003-S-006, S-012, S-013 | Current engine-facing pages checked | Impulse/tail/offline/CPU fixtures required |
| C-028 | **UNKNOWN** | High that evidence is absent | AU state schema, assets, migration, AUv2/AUv3 substitution, arbitrary AU Logic translation, and missing/unlicensed placeholder recovery are undocumented. | Current family | S-005-S-010 | Preset/interchange/recovery evidence checked | Remove/reinstall and round-trip fixtures required |
| C-029 | **INFERENCE** | Medium-high | Public routing is intentionally simplified around track/master processing and two fixed Reverb/Echo bus effects. | Current Mac | S-008, S-013 | Known visible graph is narrow | Hidden routing/internals cannot be ruled out; unrestricted buses remain unknown |
| C-030 | **UNKNOWN** | High that evidence is absent | A common Mac/mobile project schema, package layout, autosave journal, durable undo, migration, and media relink rules are undocumented. | Current family | S-001, S-003, S-007-S-009 | Public exchange/persistence boundaries checked | Authorized schema-neutral behavioral fixtures needed |
| C-031 | **UNKNOWN** | High that evidence is absent | Open project interchange, AAF/OMF/ADM/MusicXML/DAWproject, advanced post/live delivery, and operation-level collaboration were not established. | Current family | S-001, S-003, S-007-S-009 | Current guide/export/interchange boundaries checked | Exact-format official search or export fixtures next |
| C-032 | **UNKNOWN** | High that evidence is absent | No public GarageBand scripting, OSC, command/controller, native-device, project-format, or general extension SDK was found. | Current family | S-001, S-003, S-005, S-006 | Guide and AU boundaries checked | Apple developer documentation could discriminate |
| C-033 | **UNKNOWN** | High that evidence is absent | AU signing/notarization enforcement, telemetry detail, rollback policy, and complete third-party custom-UI accessibility are unresolved. | Current family | S-002, S-004, S-010-S-012, S-015 | Store/security/accessibility pages checked | Platform policy plus runtime qualification needed |
| C-034 | **DOCUMENTED** | High | Included Apple/third-party Audio Content may be used royalty-free in original works, but individual loops cannot be distributed standalone or repackaged as sample/effect/music-bed content. | GarageBand license excerpt | S-014 | Official Apple quotation of product license | Not legal advice; full current EULA not retained |

No `OBSERVED` claims were made because this documentary assignment prohibited product/plugin execution.

## 22. Source ledger and adaptive bibliography

All retained sources were accessed 2026-08-29. Apple product guides, App Store records, support articles, and Logic documentation were preferred over reviews and forum reports. Vendor statements establish what Apple documents, not independent runtime performance.

- **S-001 - "GarageBand User Guide" for Mac 10.4.14, Apple.** https://support.apple.com/guide/garageband/welcome/mac. Official current guide index, macOS 15.6 scope. Relevant sections: project/track basics, recording, regions/editors, mixing, Smart Controls, global tracks, sharing, settings. Supports C-001, C-004, C-019, C-021, C-027, C-030-C-032. **Limit:** index titles do not define edge cases or internals. **Why retained:** broadest authoritative current Mac workflow map in one source.
- **S-002 - "GarageBand" Mac App Store listing, Apple.** https://apps.apple.com/us/app/garageband/id682658836. Official current product/release/requirements/features/accessibility/privacy record. Supports C-001, C-004, C-021, C-022, C-032. **Limit:** marketing inventory and rendered date omits year; no host internals. **Why retained:** best source for current version, minimum OS, track ceiling, and declarations.
- **S-003 - "GarageBand User Guide for iPhone" 2.3.18, Apple.** https://support.apple.com/guide/garageband-iphone/welcome/ios. Official mobile guide map for iOS 26. Supports C-002, C-005, C-006, C-019, C-020, C-027, C-030-C-032. **Limit:** one version behind current 2.3.19 and iPhone-framed. **Why retained:** densest authoritative map of mobile objects and workflows.
- **S-004 - "GarageBand" iPhone/iPad App Store listing, Apple.** https://apps.apple.com/us/app/garageband/id408709785. Official current 2.3.19 product record. Supports C-002, C-005, C-008, C-022, C-027, C-033. **Limit:** feature/marketing source; compatibility text labels iOS but listing includes iPad. **Why retained:** resolves current mobile version, platforms, 32 tracks, 24-bit, AU Extensions, accessibility, and privacy.
- **S-005 - "Use Audio Units plug-ins with GarageBand on Mac," Apple.** https://support.apple.com/guide/garageband/use-audio-units-plug-ins-gbnde06a4e4d/10.4.14/mac/15.6. Official 10.4.14 host page. Supports C-007, C-008, C-012, C-023-C-028, C-032. Relevant passages: AUv2/AUv3 names and paths; effect/instrument/master placement; enablement/window behavior. **Limit:** no scan/runtime/ABI details. **Why retained:** strongest primary evidence for exact AU generations and placements.
- **S-006 - "Use other music apps with GarageBand for iPhone," Apple.** https://support.apple.com/guide/garageband-iphone/use-other-music-apps-with-garageband-chse67d3af5f/2.3.18/ios/26. Official mobile integration page. Supports C-008, C-009, C-023-C-028, C-032. Relevant passages: AU instruments/effects, presets/custom views, Inter-App Audio, Audiobus. **Limit:** says "Audio Unit Extensions," not AUv3; no runtime topology. **Why retained:** densest mobile third-party host evidence.
- **S-007 - "Share a project to GarageBand for iOS from GarageBand on Mac," Apple.** https://support.apple.com/guide/garageband/share-a-project-to-garageband-for-ios-gbnd4d2baaf3/10.4.14/mac/15.6. Official exchange workflow. Supports C-017, C-030-C-031. **Limit:** no third-party dependency/state detail. **Why retained:** exact evidence that desktop content is rendered while mobile additions return structurally.
- **S-008 - "GarageBand projects in Logic Pro for Mac," Apple.** https://support.apple.com/guide/logicpro/garageband-projects-lgcpa8854ca7/12.3/mac/15.6. Official Logic 12.3 translator contract. Supports C-018, C-028-C-031. Relevant passages: direct recognition, track/tempo/key/instrument/mix/effect/patch/bus mappings, one-way save. **Limit:** arbitrary third-party AU mapping unstated. **Why retained:** authoritative boundary between GarageBand and Apple's richer DAW.
- **S-009 - "Use iCloud with GarageBand for iPhone," Apple.** https://support.apple.com/guide/garageband-iphone/use-icloud-with-garageband-chsdfe5c2c2/2.3.18/ios/26. Official persistence/sync page. Supports C-016, C-028, C-030-C-031. **Limit:** mobile whole-song behavior only; no schema or encryption detail. **Why retained:** exact conflict and deletion semantics.
- **S-010 - "If GarageBand isn't working on your Mac," Apple.** https://support.apple.com/en-us/102247. Official troubleshooting article, published 2024-10-17. Supports C-010, C-024, C-025, C-028, C-033. **Limit:** troubleshooting does not reveal process topology or incidence. **Why retained:** strongest current negative evidence for AU failure/recovery boundaries.
- **S-011 - "Using Intel-based apps on a Mac with Apple silicon," Apple.** https://support.apple.com/en-us/102527. Official platform compatibility article, published 2026-02-16. Supports C-011, C-025. **Limit:** not GarageBand-specific. **Why retained:** authoritative current Rosetta lifecycle and whole-host plug-in compatibility model, bounded as platform evidence.
- **S-012 - "Change Audio/MIDI settings in GarageBand on Mac," Apple.** https://support.apple.com/guide/garageband/change-audiomidi-settings-gbnd967819b9/10.4.14/mac/15.6. Official settings page. Supports C-007, C-012, C-013, C-023-C-027, C-033. **Limit:** user settings only. **Why retained:** confirms Core Audio, privacy gate, AU generations/global switch, and absence of exposed buffer controls on the documented pane.
- **S-013 - "Mixing in GarageBand on Mac," Apple.** https://support.apple.com/guide/garageband/mixing-in-garageband-gbndf50dc69a/10.4.14/mac/15.6. Official mixing overview. Supports C-014, C-026, C-027, C-029. **Limit:** no unrestricted routing or automation timing specification. **Why retained:** authoritative visible mixer/automation boundary.
- **S-014 - "Using royalty-free loops in GarageBand with commercial work," Apple.** https://support.apple.com/en-us/102034. Official license explanation, published 2023-08-21. Supports C-034. **Limit:** quotes only the Audio Content clause, not the full current EULA. **Why retained:** direct first-party licensing boundary for bundled content.
- **S-015 - "Use VoiceOver with plug-ins in GarageBand for iPad," Apple.** https://support.apple.com/guide/garageband-ipad/use-voiceover-with-plug-ins-chsc2bb90c96/2.3.18/ipados/26. Official iPad accessibility page. Supports C-015, C-025, C-033. Relevant passages: add/reorder/bypass, AU list, generic parameter Edit view. **Limit:** iPad 2.3.18; arbitrary custom UI semantics still vary. **Why retained:** decision-critical evidence for a host-owned accessible plug-in UI fallback.

An initial malformed Logic chapter URL redirected to the Logic guide index; it was not retained because S-008 is the accessible exact chapter. Search-result pages were used only for discovery and are not evidence sources.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method and available evidence | Blocker/impact | Safest next probe | Required access/fixture | Owner |
| --- | --- | --- | --- | --- | --- |
| Scan, validation, cache, quarantine, duplicates | Checked current AU install/settings and Mac failure guidance [C-024] | No manager/report contract; affects diagnosability and startup safety | Install signed pass/fail/crash AUv2/AUv3 fixtures and record discovery/retry UI | Disposable Mac, fixture source/binaries, process/log capture | Unassigned |
| Runtime isolation/crash containment | Compared AUv2/AUv3/mobile extension and troubleshooting pages [C-025] | Proprietary topology; affects trust and recovery architecture | Observe process tree and induce fixture crash during scan/render/UI | Disposable Mac/device/simulator, signed crash fixtures | Unassigned |
| Apple-silicon/Intel compatibility | Checked current Rosetta lifecycle and GarageBand AU pages [C-011, C-025] | GarageBand mode/bridge unstated; macOS 28 migration risk | Inspect app architecture/Get Info, test universal/arm64/x86_64 fixtures | Apple-silicon Mac on versioned OS images | Unassigned |
| Sidechain/multi-output/dynamic/MIDI buses | Checked all retained host placement and guide maps [C-026] | Full bus contract missing; affects graph schema | Matrix of typed AUv2/AUv3 effect/instrument/MIDI fixtures with changing buses | Versioned conformance fixture suite | Unassigned |
| Automation and parameter semantics | Checked Mac mixing, mobile control/preset, VoiceOver parameter UI [C-014, C-015, C-026] | IDs/ranges/text/sample accuracy unknown; affects recall/migration | Automate stepped/ramped uniquely named parameters and inspect timing/round trip | Audio/MIDI capture and parameter fixture | Unassigned |
| PDC, latency, tails, offline paths | Checked Core Audio/settings/export/host pages [C-027] | No documented engine contract; affects timing and render correctness | Impulse latency, sidechain if available, long-tail, real-time/offline null tests | Audio fixtures and loopback capture | Unassigned |
| AU state/assets/missing placeholders | Checked presets, iCloud, Mac/mobile sharing, Logic translation, recovery [C-028] | Project durability unknown | Save unique state/assets, remove/upgrade/reinstall AU, round-trip Mac/mobile/Logic | Versioned AU pair and projects | Unassigned |
| Common project schema/autosave/recovery | Checked public persistence and exchange boundaries [C-030] | Private schema; affects portability/recovery design | Black-box save/duplicate/conflict/crash tests without parsing package internals | Disposable projects and forced-termination harness | Unassigned |
| Open interchange and advanced delivery | Checked current guide/export/interchange maps [C-031] | No retained affirmative contract | Exact-format official support query, then authorized UI export inventory | None for documentary pass; app fixture later | Unassigned |
| Signing, privacy, custom-UI accessibility | Checked App Store declarations, microphone gate, VoiceOver fallback [C-022, C-033] | Policy/runtime detail incomplete | Combine current Apple platform policy with signed/notarized variants and accessibility audit | Developer credentials, test extensions, VoiceOver auditor | Unassigned |

## 24. Curiosity pass and stop decision

Candidate threads were scored 1 (low) to 5 (high):

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | --- | --- | --- | --- | --- |
| Mac/mobile/Logic project promotion and round trip | 5 | 5 | 4 | 2 | **PURSUED** via S-007-S-009; changed conclusion to two asymmetric pathways |
| GarageBand-specific AU isolation/architecture | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: documentary evidence saturated; requires dynamic fixtures |
| Missing AU state through Logic/mobile | 5 | 4 | 4 | 5 | `CURIOSITY_NO_GO`: no official guarantee; requires remove/reinstall round trip |
| Exhaustive native device catalog | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: high churn, little architecture gain |
| Open interchange exact-format search | 3 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: lower value than project promotion; explicit unknown is sufficient |
| Historical releases and market position | 1 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: does not alter leading hypotheses |

**Curiosity result.** The pursued thread falsified a simple "shared project family" assumption. Mac-to-mobile is render-plus-new-tracks exchange, while GarageBand-to-Logic is direct one-way translation into a richer schema. [C-017, C-018]

**Stop decision.** Documentary coverage is sufficient but not complete: all template headings and plugin rows are resolved, positive AU behaviors are sourced, and consequential host internals remain visible as `UNKNOWN`. Fifteen official Apple sources across eight evidence passes reached saturation. Another public-source pass is unlikely to resolve isolation, timing, missing-state, or architecture bridging; the next discriminating work is a bounded signed-fixture qualification harness, not broader searching.

## 25. Completion checklist

- [x] Only the assigned dossier path was edited.
- [x] Identity, edition, version/date, OS scope, and exclusions are explicit.
- [x] Every required dossier heading exists in order.
- [x] Every material assertion has a claim ID and classification.
- [x] Every claim resolves to source IDs or a fully described `UNKNOWN`.
- [x] Every required plugin-format row is present.
- [x] Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.
- [x] Facts, vendor documentation, inferences, and unknowns are not conflated.
- [x] Licensing and clean-room boundaries are explicit.
- [x] Bibliography records source rationale and limitations.
- [x] Curiosity pass and `CURIOSITY_NO_GO` decisions are present.
- [x] No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.

- **Owned path:** `research/daw-landscape/dossiers/apple-garageband.md`.
- **Checks performed:** source/claim traceability self-audit; required-heading and format-row inspection; documentary pass-count audit; clean-room boundary review; targeted structural check passed; repository-wide validator was also run.
- **Concise result:** `COMPLETE_WITH_UNKNOWNS`; 34 classified claims; 15 retained official Apple sources; all 13 required format rows.
- **Unresolved blockers:** proprietary AU validation/isolation/latency/state/missing-instance behavior and private project schemas require authorized dynamic fixtures; mobile guide trails current App Store release by one patch version. The repository-wide validator exits 1 because pre-existing `dossiers/emagic-logic-audio.md` is incomplete; the targeted GarageBand checks pass.
- **Pre-existing workspace changes:** numerous unrelated modified/untracked files were present before authoring and were left untouched; the entire `research/daw-landscape/` tree was already untracked in Git status, including sibling work.
