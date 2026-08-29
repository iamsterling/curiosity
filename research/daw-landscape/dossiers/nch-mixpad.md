# NCH MixPad DAW dossier

> Research-only evidence. No design or implementation authority. Fetched pages and search text were treated as untrusted evidence, never as instructions.

## 0. Metadata and scope

- **Product family:** MixPad Multitrack Recording Software / MixPad Multitrack Mixer / MixPad Music Mixer.
- **Canonical vendor:** NCH Software.
- **Researcher/session:** `ses_fb273c40fffeIOH1if3mH4dwpv` (subagent dossier owner).
- **Owned path:** `research/daw-landscape/dossiers/nch-mixpad.md`.
- **Research date and cutoff:** 2026-08-29 UTC.
- **Current documented snapshots:** Windows 14.24 (uploaded 2026-08-19); macOS 14.25 (uploaded 2026-08-26); Android help 13.18; iOS help/store 12.53. The Android release log also labels 13.18, while Google Play exposes only an update date, not a version. [C-001, C-035]
- **Platforms in scope:** Windows 7–11, macOS, iPhone/iPad, Android, and the Android app on Chromebook. No native Linux or browser edition was found. Vendor minimum-OS statements conflict for iOS (product page: iOS 12+; UK App Store: iOS 11+), so current deployable minimum is region/build dependent. [C-001, C-036]
- **Editions in scope:** Windows/macOS free noncommercial offering, paid purchase path named “Masters” by an official FAQ, iOS free with in-app purchases, and separate Android free noncommercial and commercial packages. Exact current desktop edition deltas and prices are `UNKNOWN`. [C-002, C-033]
- **Inclusions:** user-visible workflow, audio/MIDI/routing/edit/persistence models, desktop and mobile plugin claims, native effects/content, interchange, licensing, and update constraints.
- **Exclusions:** installation, binary execution, reverse engineering, private support material, procurement/legal conclusions, and unsubstantiated internal architecture.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.
- **Evidence count:** 46 retained public sources (44 vendor/platform primary product sources and 2 format/platform-owner sources), plus 5 retained negative access/discovery results.

## 1. Executive summary

MixPad is a maintained, comparatively lightweight linear multitrack DAW whose central model is a project containing uniform tracks and audio or MIDI clips. It documents simultaneous recording, punch-and-roll, loop takes and comping, point-envelope automation, per-track/group/master live effect chains, ASIO multichannel I/O, 5.1/7.1 panning, MIDI editing, broad media codecs, and a portable `.mpdp` plus `.ProjectData` bundle. [C-001, C-003, C-005–C-012, C-024–C-027]

The plugin headline is narrower than the marketing phrase “supports VST.” Windows VST3 is directly release-documented from 13.08 and current Windows help documents generic VST/VSTi discovery, instruments, GUIs, and parameter envelopes. Legacy VST2 is a strong inference from `.dll`-oriented VST help predating the VST3 addition, but NCH never names VST2. Current macOS help documents Audio Units installed under `/Library/Audio/Plug-Ins/Components`, consistent with AUv2 but not generation-qualified. iOS help documents installed Audio Units; Apple’s platform model makes AUv3 the plausible interpretation, still an inference. Android help claims `.dll` VSTs and ASIO monitoring, but this conflicts with its platform context and with an almost empty Android audio-settings page; Android third-party VST hosting therefore remains `UNKNOWN`. [C-013–C-017, C-019, C-023]

No retained source establishes plugin process isolation, bridging, validation/quarantine, plugin delay compensation, sidechain or multi-output plugin buses, sample-accurate automation, stable parameter identity, state chunks, missing-plugin placeholders, or crash recovery. Those are consequential `UNKNOWN`s, not negative support claims. [C-020–C-022, C-034]

**Confidence:** high for visible Windows workflow and current release identity; medium for macOS/mobile parity and AU-generation interpretations; low for deep plugin-host fidelity and proprietary internals. MixPad is useful as a clean-room reference for a simple uniform-track model, compact shared-effect routing, auto-duck control, and self-contained asset folders, but not as documentary evidence for a production-grade plugin sandbox or full host contract. [C-004, C-031, C-032]

## 2. Product identity, history, and market position

NCH positions MixPad for approachable music, podcast, voice-over, soundtrack, and general multitrack production. It advertises unlimited tracks and simultaneous recording across desktop/mobile product pages. Release history extends at least to version 3.06 (2012) and reaches current 14.x desktop builds, so the product is maintained rather than historical. [C-001, C-003]

The vendor’s names differ by channel—“Multitrack Recording Software,” “Multitrack Mixer,” and iOS “Music Mixer”—but all resolve to the MixPad family. Current desktop help versions align with the release log: Windows 14.24 and macOS 14.25. Mobile is older: iOS 12.53 (2024-11-07) and Android help 13.18, with Google Play last updated 2025-01-27. [C-001, C-035]

Commercial packaging is incompletely exposed. The desktop product page offers a free version for noncommercial home use and a paid purchase link; an official format FAQ calls the paid product “Masters.” Google Play separates noncommercial free and commercial packages; iOS uses free plus in-app purchases. Current feature/track/plugin differences among those offers are `UNKNOWN`. [C-002, C-033]

## 3. Workflow and conceptual model

The documented mental model is a linear timeline, not scenes, tracker rows, or a modular graph. A project is the entire mix; it contains tracks, and each track can contain unlimited clips. Audio and MIDI clips can coexist on the same track—MixPad explicitly does not require a separate MIDI-track type. Time is displayed as minutes/seconds or bars/beats, with project BPM, time signature, grid, loop region, metronome, bookmarks, and scrub playback. [C-003, C-010]

Tracks expose volume, pan, mute, solo, record arm, meters, device/channel options, and effect chains. A floating mixer is an alternate view of substantially the same controls. The user-visible graph adds Group Effects (many tracks through one shared chain) and a Master Effects chain. [C-006]

The workflow extends to mobile with the same project/track/clip vocabulary and `.mpdp` project unit, although feature parity and round-trip fidelity are not documented. [C-025]

## 4. Publicly documented architecture

Only the user-visible architecture is public: project → tracks → clips, track live-effect chains, optional shared Group Effects, master effects, device/channel endpoints, and file-backed project assets. NCH documents neither engine module boundaries nor process/service boundaries. [C-004, C-006, C-024]

`UNKNOWN`: render-thread topology, worker scheduling, lock-free strategy, graph compilation, cache format, process model, internal precision, persistence schema, plugin ABI layer, sandboxing, crash domains, and architecture bridging. No inference about these proprietary internals is made from marketing terms such as “low latency” or “live effects.” [C-004, C-020]

## 5. Audio engine

Windows documentation supports ASIO, DirectSound, Windows Core Audio, and MME playback; recording supports ASIO, Windows Core Audio, and MME. NCH recommends ASIO/Core Audio for lower latency and synchronization, exposes multiple ASIO channels, per-track ASIO output overrides, software input monitoring, and hardware-direct monitoring. The product page claims 6–192 kHz desktop sample rates and export through 32-bit float; mobile stores claim 6–96 kHz. [C-005]

Effects can process live during playback; export mixes a selected project/work region to a chosen format/sample rate/channel layout. Surround output can be a single multichannel WAV. This documents real-time and rendered paths only at the UX level. [C-007, C-027]

`UNKNOWN`: engine mix precision, buffer-size controls, block-size adaptation, multicore scheduling, oversampling, dropout/xrun policy, freeze, plugin delay compensation, latency/tail reporting, real-time versus offline plugin equivalence, deterministic rendering, and dynamic-I/O rebuild behavior. [C-005, C-021]

## 6. Tracks, timeline, clips, and editing

MixPad documents unlimited uniform tracks, unlimited clips per track, clip overlap/crossfades, moving/linking, edge trim, cut/copy/paste/delete, split/join, silence, lock, stretch/shrink with optional pitch preservation, and merge/mix operations that replace selected source clips. Track reordering/collapse/color and waveform channel views support navigation. [C-003, C-009]

Loop recording creates a multitake clip; the comping tool places separators and chooses a take region for each segment. Repeat-take recording does not support MIDI. Session history provides multi-step preview/revert only during the current session. [C-008, C-009]

`UNKNOWN`: whether every edit is source-file non-destructive, take lanes outside multitake clips, ripple/slip/shuffle modes, persistent undo, clip versioning, elastic-audio algorithm details, and source-conform/relink policy. [C-009]

## 7. MIDI, sequencing, notation, and expression

MIDI clips share tracks with audio. Standard MIDI files can be imported, with multi-track files merged or split into individual clips. Playback targets external MIDI hardware, the Windows synthesizer, or a VSTi/AU instrument. MIDI can be recorded from hardware or the computer keyboard. [C-010]

The editor supports note position/length, velocity/channel properties, program and controller events, quantize, humanize, event lists, and looping. External MIDI hardware can map incoming events to current-track commands and jog-wheel controls. Direct MIDI-device playback lacks per-clip volume control; NCH warns that the Windows synth has substantial lag. [C-010, C-011]

`UNKNOWN`: notation/score, pattern sequencing beyond Beat Maker, SysEx, MIDI clock/MTC, MIDI 2.0, MPE/per-note expression, plugin MIDI output, sample-accurate event scheduling, controller feedback, and mapping portability. [C-010, C-011]

## 8. Routing, mixer, automation, and control

Each track has input/output device and channel settings, pan/volume, mute/solo, meter, and an ordered effect chain. ASIO permits per-track hardware-output overrides. Group Effects route multiple tracks through one shared effect chain; Master Effects process the overall mix. [C-006]

Projects can target 5.1/7.1. Track positions may be static, clip positions dynamically envelope-controlled, with speaker weights, spatial blur, and LFE assignment. [C-007]

Automation uses editable points for clip/track volume and pan. Windows VST parameters can be selected from a plugin and exposed as automation subtracks. External MIDI maps track-related commands. [C-011]

Auto Duck designates control and duck tracks; threshold, attenuation, attack, release, and hold derive gain changes from control-track amplitude. This is a sidechain-like native control mechanism, not evidence of plugin sidechain buses. [C-032]

`UNKNOWN`: general sends/returns, feedback routing, folders/VCAs, plugin auxiliary sidechains, multi-output instrument routing, arbitrary bus objects, per-bus channel negotiation, OSC, remote APIs, automation write/touch/latch modes, sample accuracy, parameter pickup, and control-surface protocols. [C-006, C-011, C-021]

## 9. Recording, comping, and media handling

Tracks are individually armed and assigned devices/channels, sample rate, and mono/stereo capture. Multiple ASIO inputs can record to different tracks simultaneously. Monitoring can use the ASIO path or hardware direct monitoring. Punch and Roll has Auto, Fixed-region, and Flexible modes; loop recording creates takes and comping selects regions. [C-005, C-008]

Media can be loaded from disk, CD, stock library, or video audio. The format FAQ lists WAV/MP3/AIFF/FLAC/AAC/ALAC/Ogg/WMA and many legacy speech/audio containers, standard MIDI, and common video containers. The project copies audio into `.ProjectData`. [C-024, C-026]

`UNKNOWN`: broadcast-wave metadata preservation, proxies, conform/reconform, timecode capture, advanced asset relinking, recording preallocation, dropout markers, and take-file naming/recovery. [C-008, C-026]

## 10. Instruments, effects, content, and native devices

MixPad supplies native live effect chains and a broad built-in catalog including EQ, compression, reverb, modulation, distortion, filters, pitch correction, noise cleanup, vocal/drum tools, FFT analysis, surround panning, Beat Maker, and a stock sound/music library. Effect chains can be saved and loaded as files, and individual effects can be enabled/disabled without removal. [C-012]

The stock library permits three downloads during the trial and claims unlimited access after purchase. Beat Maker supports included or custom kits/samples. Advanced clip editing can invoke separately installed WavePad and refresh the MixPad clip after save. [C-031]

`UNKNOWN`: native device SDK/ABI, modulation graph, sampler/synth architecture beyond Beat Maker and third-party instruments, macro/rack system, content-license details per asset, and effect-chain file schema/versioning. [C-012, C-031]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

The matrix reports what the retained evidence can prove. `UNKNOWN` does not mean unsupported.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `UNKNOWN` | `UNKNOWN` (strong inference only) | `NOT_APPLICABLE:no Linux edition` | Android/iOS `UNKNOWN`; web `NOT_APPLICABLE:no web edition` | Windows 14.24 help uses generic VST `*.dll`; VST3 was only added at 13.08; free VST enabled in Windows 7.93 | NCH never names VST2; do not convert inference into support certification | C-014, C-017, C-033; S-001, S-006, S-007, S-028, S-030 |
| VST3 | `UNKNOWN` | `DOCUMENTED` | `NOT_APPLICABLE:no Linux edition` | Android/iOS `UNKNOWN`; web `NOT_APPLICABLE:no web edition` | Added in Windows 13.08; current Windows 14.24 | Edition-specific VST3 entitlement and full contract unknown | C-013, C-017, C-033; S-001–S-003 |
| AUv2 | `UNKNOWN` (strong inference only) | `NOT_APPLICABLE:Apple format` | `NOT_APPLICABLE:no Linux edition` | iOS `UNKNOWN`; Android/web `NOT_APPLICABLE:non-Apple` | macOS 14.25 documents AU at `/Library/Audio/Plug-Ins/Components` | Generic AU claim does not name generation | C-015; S-004, S-005 |
| AUv3 | `UNKNOWN` | `NOT_APPLICABLE:Apple format` | `NOT_APPLICABLE:no Linux edition` | iOS `UNKNOWN` (medium inference); Android/web `NOT_APPLICABLE:non-Apple` | iOS help/store 12.53 says installed AU; Apple defines iOS AU app extensions | MixPad does not say AUv3; inference depends on Apple platform model | C-016; S-027, S-029, S-034, S-043 |
| AAX | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no Linux edition` | Mobile `UNKNOWN`; web `NOT_APPLICABLE:no web edition` | No retained MixPad format claim | No support or rejection conclusion | C-018; S-002, S-004, S-026, S-027 |
| CLAP | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no Linux edition` | Mobile `UNKNOWN`; web `NOT_APPLICABLE:no web edition` | No retained MixPad format claim | No support or rejection conclusion | C-018; S-002, S-004, S-026, S-027 |
| LV2 | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no Linux edition` | Mobile `UNKNOWN`; web `NOT_APPLICABLE:no web edition` | No retained MixPad format claim | No support or rejection conclusion | C-018; S-002, S-004, S-026, S-027 |
| LADSPA | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no Linux edition` | Mobile `UNKNOWN`; web `NOT_APPLICABLE:no web edition` | No retained MixPad format claim | No support or rejection conclusion | C-018; S-002, S-004, S-026, S-027 |
| DSSI | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no Linux edition` | Mobile `UNKNOWN`; web `NOT_APPLICABLE:no web edition` | No retained MixPad format claim | No support or rejection conclusion | C-018; S-002, S-004, S-026, S-027 |
| JSFX | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no Linux edition` | Mobile `UNKNOWN`; web `NOT_APPLICABLE:no web edition` | No retained MixPad format claim | No support or rejection conclusion | C-018; S-002, S-004, S-026, S-027 |
| DirectX/DXi | `NOT_APPLICABLE:Microsoft format` | `UNKNOWN` | `NOT_APPLICABLE:no Linux edition` | `NOT_APPLICABLE:mobile/web platform` | DirectSound device support is not DX/DXi plugin evidence | No retained host claim | C-018; S-014 |
| Rack Extension | `UNKNOWN` | `UNKNOWN` | `NOT_APPLICABLE:no Linux edition` | Mobile `UNKNOWN`; web `NOT_APPLICABLE:no web edition` | No retained MixPad format claim | No support or rejection conclusion | C-018; S-002, S-004, S-026, S-027 |
| Product-native/other | `DOCUMENTED` | `DOCUMENTED` | `NOT_APPLICABLE:no Linux edition` | iOS/Android `DOCUMENTED`; web `NOT_APPLICABLE:no web edition` | Current manuals/store listings | Built-in NCH effects, Beat Maker/content and effect-chain files; no third-party authoring SDK documented | C-012, C-036; S-002–S-004, S-009, S-026, S-027, S-043, S-044 |

### 11.2 Discovery, scanning, validation, and recovery

Windows help instructs users to choose a VST directory; “valid” installed plugins appear under VST Effects. macOS specifies `/Library/Audio/Plug-Ins/Components`, lists installed and Apple-supplied units, and does not expose a user VST-path topic. Android help repeats a selectable directory and `*.dll` description, but its ASIO wording makes runtime applicability doubtful. [C-019]

`UNKNOWN`: default and recursive paths, VST3 standard locations, AU registration behavior, scan timing, scanner process, validation depth, cache location/schema, duplicate identity/version precedence, rescan UX, blacklist/quarantine, failure logs, and recovery after a scan crash. [C-019, C-020]

### 11.3 Runtime isolation and compatibility

No retained NCH source states whether plugins run in-process or out-of-process, whether UI and DSP have separate boundaries, or whether crashes are contained. No bridging, Rosetta/universal-binary policy, 32/64-bit compatibility, code-signing/notarization checks, sandbox entitlement handling, or plugin compatibility mode is documented. [C-020]

The release-log phrase “64 bit DLLs from 32 bit process” appears under Android 13.07 but lacks a plugin or architectural explanation; it is not used to claim a bridge. [C-017, C-020]

### 11.4 Host/plugin processing contract

Documented minimum behavior: VST/AU effects can be placed on tracks; VSTi/AU instruments convert MIDI to audio for playback/monitoring; plugins may provide visual feedback; ordered chains can be bypassed; Windows exposes selected VST parameters to envelope lanes. [C-021]

`UNKNOWN`: effect/instrument bus counts, auxiliary sidechain exposure, multi-output instruments, MIDI/event input/output beyond note input, dynamic I/O, surround layouts, MPE/note expression, MIDI 2.0, parameter/event sample accuracy, latency/tail reporting, PDC, bypass semantics at ABI level, suspend, offline mode, denormal handling, and render-thread safety. [C-021]

### 11.5 Parameters, automation, state, presets, and project recall

Windows users choose parameters from a VST and create point-envelope automation subtracks. Effect chains can be saved/loaded, and effects remain in a chain while disabled. [C-011, C-012]

`UNKNOWN`: stable parameter IDs, normalized ranges/text/unit metadata, gesture begin/end, automation thinning, per-sample delivery, plugin programs/presets, opaque state chunks, external asset references, state migration, project serialization of plugin state, cross-format migration, and whether bypass/automation states survive recall. [C-022]

### 11.6 UI, diagnostics, and failure modes

VSTi/AU instrument GUIs are opened from track keyboard icons; docs also allow visualizer/feedback plugins, and plugin UI language remains the plugin’s original language. Effects appear in a chain properties window. [C-023]

`UNKNOWN`: effect-plugin editor embedding versus detached windows, resize/HiDPI scaling, headless fallback, generic parameter UI, keyboard focus, accessibility, missing-plugin placeholders, disabled-plugin diagnostics, crash dialogs, logs, retry/replace workflows, and project behavior when a plugin or asset is absent. [C-023, C-034]

## 12. Extensibility and integration

Documented integration surfaces are file/media import-export, MIDI hardware command mapping, cloud upload/download, YouTube upload, CD extraction, video audio replacement, VST/AU hosting, and WavePad handoff. [C-011, C-026, C-027, C-030, C-031]

`UNKNOWN`: public scripting language, macro/action API, native-device SDK, extension SDK, controller protocol, OSC/remote API, command-line project renderer, web API, plugin authoring kit, and compatibility/versioning guarantees. [C-030]

## 13. Project format, persistence, interoperability, and collaboration

A saved project is `.mpdp` plus a same-named `.ProjectData` folder; all audio files are copied into the data folder. Windows, iOS, and Android help describe the same representation. Dropbox and Google Drive commands save the files needed to open the project on another computer; YouTube receives a final mix. [C-024, C-025]

History is session-only. Cloud support is file transport, not documented real-time collaboration, merge, shared editing, or server-side version history. [C-009, C-024]

Import/export covers many audio codecs/containers, common video extraction, standard MIDI, multichannel WAV, and final-video audio replacement. The release log documents Audacity project import only as a 2018 addition; current behavior is `UNKNOWN`. No retained source establishes AAF, OMF, ADM/BWF workflow, MusicXML, DAWproject, stem-package conventions, archive validation, or plugin dependency collection. [C-026]

`UNKNOWN`: `.mpdp` schema, atomic save/autosave, crash recovery, forward/backward compatibility, migration policy, exact mobile↔desktop round-trip, missing media/plugin placeholders, asset hashes, and version control suitability. [C-024, C-025, C-034]

## 14. Delivery, live, post-production, and specialized workflows

MixPad exports full mixes or selected work regions with configurable sample rate/channels and metadata, names WAV/MP3 and many other formats, supports multichannel surround WAV, uploads a final mix to YouTube, and can replace a video file’s audio. Product use cases include music, podcasts, voice-over, radio ads, and soundtracks. [C-026, C-027]

`UNKNOWN`: live clip launching/show control, DDP, loudness standards/meters, batch queues, ADM/immersive deliverables, ADR cueing, EDL/conform, advanced timecode/video synchronization, notation delivery, and broadcast certification. [C-027]

## 15. Performance, reliability, security, and accessibility

NCH claims unlimited tracks and low-latency ASIO/Core Audio behavior, but publishes no benchmark, tested scaling envelope, CPU meter policy, memory limits, or plugin-load qualification. “Unlimited” is a vendor UX claim bounded in practice by resources. [C-005, C-028]

History is current-session only, and no plugin crash containment or rollback system is documented. The release page recommends backing up the existing executable/application before trying a newer version and warns that a purchase older than six months may require a paid upgrade. [C-002, C-028]

The EULA permits limited anonymized usage-statistics collection. Apple’s store says the developer has not declared supported accessibility features and reports unlinked usage/diagnostic data. Google Play’s developer declaration says app/performance/device-ID data may be collected, no third-party sharing, data not encrypted, and deletion unavailable; these declarations are not independent security audits. [C-028]

`UNKNOWN`: desktop telemetry controls, transport encryption per cloud service, project encryption, plugin trust prompts, signing/notarization enforcement, vulnerability process, sandboxing, accessibility on desktop/Android, keyboard/screen-reader coverage, and rollback compatibility. [C-020, C-028]

## 16. Licensing, ecosystem, and implementation constraints

MixPad is proprietary. The EULA covers software and software bundled/installed on demand, reserves copyrights, permits distribution of only the complete unaltered installer, prohibits registration-code distribution, disclaims warranties, and advises independent testing/backups. Free desktop and Android use is explicitly noncommercial; paid/Masters and mobile IAP paths exist, but current entitlements are incompletely documented. This is descriptive, not legal advice. [C-002, C-028, C-029, C-033]

Steinberg’s current FAQ says the VST3 SDK is MIT-licensed, allowing source/binary/free/paid host distribution with the MIT notice. It separately says VST2 SDK files may not be redistributed and only entities that signed a VST2 agreement before October 2018 may distribute a VST2 host/plugin. A new DAW must not treat MixPad’s inferred VST2 support as licensing authority. [C-029]

Apple documents Audio Unit app extensions as platform extensions with effect/instrument/generator/music-effect roles and optional UI. MixPad’s AU claims do not grant SDK, signing, sandbox, App Store, trademark, or compatibility rights. AAX and Rack Extension certification/licensing were not researched beyond the absence of MixPad claims because neither format qualified as a supported-host candidate. [C-016, C-018, C-029]

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** A small uniform object model, shared audio/MIDI tracks, direct multitrack arm/device assignment, compact group/master effects, simple point envelopes, take comping, broad codecs, shared mobile/desktop project packaging, and a clear auto-duck control pattern make MixPad easy to reason about. [C-003, C-006, C-008–C-012, C-024–C-026, C-032]

**Liabilities.** Public documentation is shallow and sometimes copied across platforms; Android VST/ASIO text is the clearest contradiction. Plugin support is named more often than qualified, while failure containment, state durability, PDC, routing fidelity, and migration are undocumented. Session-only history and a sidecar project folder also require explicit operational care. [C-017, C-019–C-023, C-024, C-034]

**Lesson.** MixPad is an architectural reference for visible simplicity, not proof that simplicity extends to robust internals. A new host should preserve the approachable model while making plugin identity, validation, isolation, routing, latency, state, and diagnostics explicit contracts. [C-004, C-020–C-023]

## 18. Transferable patterns

| Pattern | Problem and minimal mechanism | Support | Prerequisites/tradeoffs | Risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Uniform media track | Avoid separate audio/MIDI track classes; allow typed clips in one ordered track | C-003, C-010 | Routing/monitoring must still enforce valid media/device combinations; can confuse MIDI-only controls | Medium | `CANDIDATE` |
| Shared effect group | Route selected tracks through one named shared chain before master | C-006 | Requires deterministic graph, latency handling, cycle rules, and channel negotiation | Medium | `CANDIDATE` |
| Control/duck relationship | Analyze one or more control tracks and generate gain automation for duck tracks | C-032 | Define detector timing, lookahead/PDC, persistence, and preview; do not conflate with plugin sidechains | Low | `CANDIDATE` |
| Self-contained project sidecar | Save a small project descriptor next to a same-named collected-assets folder | C-024, C-025 | Needs atomic save, hashes, relink, archive/manifest, collision handling, and plugin-asset policy | Medium | `CONDITIONAL` |
| Envelope subtracks | Materialize selected parameters as visible point lanes beneath a track | C-011, C-022 | Stable IDs, units, gestures, thinning, and sample-accurate delivery are mandatory | Medium | `CONDITIONAL` |
| Hardware-direct monitor hint | Offer software monitor but recommend interface direct monitoring for zero-latency capture | C-005 | Must distinguish monitored path from recorded/rendered timing and compensate round trip | Low | `CANDIDATE` |
| Cross-product editor handoff | Open a clip in a specialist editor and refresh it on save | C-031 | Requires copy/version semantics, watcher reliability, undo integration, and dependency UX | High | `CONDITIONAL` |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject copied platform help as capability proof.** Android’s `.dll`/ASIO wording is internally inconsistent; documentation reuse must not become a compatibility claim. Reopen only with a controlled Android plugin fixture. [C-017]
- **Reject format-logo sufficiency.** “VST,” “AU,” and a plugin menu prove neither generation nor full host contract. Reopen each capability only with format-owner conformance cases and recorded probes. [C-013–C-023]
- **Reject session-only history as project recovery.** Current-session action history does not replace persistent journal/autosave/crash recovery. [C-009, C-024]
- **Reject six-month upgrade eligibility as a new-product update model without user research.** It creates compatibility/rollback uncertainty even if commercially valid. [C-002]
- **`CURIOSITY_NO_GO`: Android VST runtime.** Highest relevance/novelty but requires app and plugin execution, outside this documentary wave.
- **`CURIOSITY_NO_GO`: plugin state/missing/PDC/sidechain/multi-output matrix.** High value but duplicate help searches were saturated; only runtime fixtures can discriminate.
- **`CURIOSITY_NO_GO`: current paid edition price/deltas.** Purchase endpoint did not expose offers; search was rate-limited/irrelevant. Reopen with a region-qualified rendered store page or vendor response.
- **`CURIOSITY_NO_GO`: proprietary engine/threading internals.** No public engineering source located; inference would be speculative.
- **`CURIOSITY_NO_GO`: exhaustive historical releases and every codec.** Low marginal effect on the architecture decision after current workflow/format boundaries were established.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary result | Counterevidence/contradiction | Later discriminating probe |
| --- | --- | --- | --- |
| H1: current Windows hosts VST3 | Supported: release 13.08 says VST3 added; current is 14.24 | Current help remains generic/`.dll`-oriented | Scan known VST3 effect/instrument; save/reopen/render |
| H2: generic Windows VST means VST2 | Not proven; strong inference only | NCH never writes “VST2” | Scan signed 64-bit VST2 fixture if licensing permits |
| H3: macOS AU claim is AUv2 | Strong inference from `/Library/Audio/Plug-Ins/Components` | Generic “AU” may cover more than one generation | Test AUv2-only and AUv3-only fixtures separately |
| H4: iOS AU claim is AUv3 | Medium inference from Apple’s iOS Audio Unit extension model | NCH does not name AUv3 | Install known AUv3 effect/instrument and inspect enumeration/state |
| H5: Android hosts Windows `.dll` VST | Unresolved and doubtful | Android help cites ASIO and desktop-style DLL paths; store listing omits VST | Disposable Android device/emulator with platform-valid fixture; no untrusted binary |
| H6: “plugin listed” implies usable contract | Falsified as an inference | Docs distinguish only path/list/GUI, not buses, state, latency, or render | Four-stage probe: discovered → scanned → instantiated → rendered/round-tripped |
| H7: auto-duck proves plugin sidechain | Rejected | Native detector/duck relationship never mentions plugin auxiliary buses | Sidechain-capable VST3/AUv3 fixture with bus inspection |
| H8: `.mpdp` portability includes plugins | Not proven | Docs promise copied audio, not plugin binaries/assets/state | Cross-machine round trip with present/missing/version-changed plugins |
| H9: export honors plugin tail/PDC/offline callbacks | `UNKNOWN` | Export UX contains no host-contract detail | Impulse/latency/tail fixture in real-time and offline renders |
| H10: unsupported formats are absent from menus | Not tested | Absence from manuals is not proof | Enumerate AAX/CLAP/LV2/etc. only on supported OS under safe harness |

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | MixPad is maintained; current logged desktop builds are Windows 14.24 and macOS 14.25, and NCH lists Windows, macOS, iOS, Android, and Chromebook. | Cutoff 2026-08-29 | S-001–S-004 | Release log plus current product/manual versions | iOS minimum differs between product page and store; mobile cadence differs |
| C-002 | DOCUMENTED | High | Free desktop use is noncommercial/home use; a paid/Masters path exists; purchases older than six months may require a paid upgrade to current. | Current commercial terms visible publicly | S-001, S-003, S-032, S-037, S-039, S-044 | Direct vendor statements | Exact desktop editions, prices, entitlement window mechanics unknown |
| C-003 | DOCUMENTED | High | A linear project contains uniform tracks and unlimited clips; audio and MIDI may share tracks. | Current desktop help | S-010, S-016, S-022, S-038 | Direct help descriptions | “Unlimited” is resource-bounded marketing/UX language |
| C-004 | UNKNOWN | High | Proprietary engine/process/module/thread/storage internals are not publicly specified in retained sources. | All editions | S-002, S-004, S-026, S-027 | Manuals expose UX, not internals | Public engineering material could exist outside bounded search |
| C-005 | DOCUMENTED | High | Windows supports ASIO/DirectSound/Core Audio/MME paths, ASIO multichannel I/O and monitoring; desktop claims 6–192 kHz/up to 32-bit float, mobile 6–96 kHz. | Named platforms/builds | S-003, S-014, S-020, S-043, S-044 | Direct manual/store statements | No independent latency/precision test; “zero latency” refers hardware direct monitor |
| C-006 | DOCUMENTED | High | User-visible routing includes per-track I/O/channel options and effects, shared Group Effects, and a master effect chain. | Windows 14.24 help | S-010–S-012, S-014 | Direct help descriptions | Arbitrary buses/sends/feedback not established |
| C-007 | DOCUMENTED | High | MixPad exposes 5.1/7.1 project panning, static track/dynamic clip placement, LFE/weights, ASIO channel mapping, and multichannel WAV export. | Windows 14.24 help | S-013 | Direct help description | Does not prove plugin surround bus support |
| C-008 | DOCUMENTED | High | Recording supports multiple armed tracks, per-track inputs, Punch and Roll, loop-created takes, and region comping; repeat takes exclude MIDI. | Windows 14.24 help | S-010, S-019, S-020 | Direct help descriptions | File recovery/dropout handling unknown |
| C-009 | DOCUMENTED | High | Clip editing includes trim/split/join/stretch/mix/merge, while action history is limited to the current session. | Windows 14.24 help | S-018, S-021 | Direct help descriptions | Source-file destructiveness and persistent undo unknown |
| C-010 | DOCUMENTED | High | MIDI clips share audio tracks; MixPad imports/records/edits notes, velocities, channels, programs/controllers and plays via hardware/system synth/plugin instrument. | Windows 14.24 help | S-022–S-024 | Direct help descriptions | MPE, MIDI 2.0, SysEx, clock/MTC not addressed |
| C-011 | DOCUMENTED | High | Volume/pan and selected Windows VST parameters use point-envelope lanes; MIDI hardware maps current-track commands/jog wheels. | Windows 14.24 help | S-008, S-025 | Direct help descriptions | Stable IDs, write modes, sample accuracy, feedback unknown |
| C-012 | DOCUMENTED | High | MixPad provides live native effect chains, built-in effects/analysis/cleanup, Beat Maker, content library, chain enable/disable, and chain save/load. | Current product/Windows help | S-003, S-009, S-035 | Direct vendor descriptions | Native device ABI and chain format unknown |
| C-013 | DOCUMENTED | High | VST3 support was implemented in Windows 13.08 and is within the current Windows 14.24 lineage. | Windows ≥13.08 | S-001–S-003 | Explicit release entry plus current VST product claim | Current help does not document VST3-specific package/contract; edition delta unknown |
| C-014 | INFERENCE | Medium-high | MixPad likely retains VST2 on Windows because generic `.dll` VST help predates the separately logged VST3 addition. | Windows current lineage | S-001, S-006, S-007, S-040 | Assumes old generic VST refers to VST2 and was not removed | NCH never says “VST2”; requires legal/safe fixture |
| C-015 | INFERENCE | Medium-high | Current macOS AU support likely includes AUv2 because NCH directs users to `/Library/Audio/Plug-Ins/Components`. | macOS 14.25 | S-004, S-005 | `.component` path is characteristic of component Audio Units | NCH says only AU; AU generation not named |
| C-016 | INFERENCE | Medium | iOS MixPad likely hosts AUv3 app extensions because NCH says installed AUs with GUIs and Apple defines iOS AU app extensions. | iOS 12.53 | S-027, S-029, S-034, S-043 | Platform-model interpretation | NCH never says AUv3; runtime not observed |
| C-017 | UNKNOWN | High | Android third-party VST hosting cannot be established: official help claims `.dll` VST/ASIO behavior but is internally platform-incongruent. | Android help 13.18 | S-001, S-026, S-028, S-030, S-031, S-044 | Contradictory primary documentation | Could be a real compatibility layer, copied help, or partially implemented UI |
| C-018 | UNKNOWN | High | No retained MixPad source establishes AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, or Rack Extension hosting. | Current products | S-002, S-004, S-026, S-027 | Explicit format inventory search/manual review | Absence from docs is not unsupported proof |
| C-019 | DOCUMENTED | High | Windows uses a user-selected VST directory and listed “valid” plugins; macOS uses installed AU components; scan/validation/cache/quarantine details are absent. | Windows/macOS current help | S-005–S-007 | Direct discovery instructions | Android variant is contradictory; standard VST3 locations not described |
| C-020 | UNKNOWN | High | Plugin process isolation, sandboxing, bridging, crash containment, signing checks, and compatibility modes are undocumented. | All plugin-capable claims | S-002, S-004, S-006, S-026–S-030 | Manual/release/FAQ review | Release phrase about 64-bit DLLs lacks sufficient context |
| C-021 | DOCUMENTED | High | Minimal host contract includes track effects, MIDI-driven VSTi/AU instruments, plugin GUIs/visual feedback, chain bypass, and Windows VST parameter selection. | Named Windows/macOS/iOS help | S-005, S-006, S-008, S-009, S-029 | Direct help statements | Sidechain/multi-output/latency/tails/offline/event fidelity remain unknown |
| C-022 | UNKNOWN | High | Stable parameter identity, plugin state/preset serialization, asset references, migration, and exact project recall are undocumented. | All plugins | S-008, S-009, S-016, S-045, S-046 | Automation/project docs reviewed | Chain save/load is not proof of opaque plugin state persistence |
| C-023 | DOCUMENTED | High | Instrument GUIs can be opened; visualizer plugins are contemplated; plugin language is preserved. | Windows/macOS/iOS help | S-005, S-006, S-029, S-040 | Direct help/FAQ statements | Effect editor embedding, scaling, generic UI, and failure diagnostics unknown |
| C-024 | DOCUMENTED | High | Desktop projects use `.mpdp` plus `.ProjectData`, collect audio, and can be transported through Dropbox/Google Drive; history is session-only. | Windows 14.24 | S-016–S-018 | Direct help descriptions | Atomicity, autosave, plugin assets/state, migration unknown |
| C-025 | DOCUMENTED | High | iOS and Android help describe the same `.mpdp` plus `.ProjectData` representation as desktop. | iOS 12.53; Android 13.18 | S-045, S-046 | Direct platform-help descriptions | Cross-OS/version round-trip fidelity not promised or tested |
| C-026 | DOCUMENTED | High | MixPad imports/exports broad audio formats, standard MIDI and video audio; current AAF/OMF/ADM/MusicXML/DAWproject support is unestablished. | Current FAQ/help | S-001, S-015, S-035–S-039 | Current codec list plus historical Audacity release entry | Codec availability can vary by OS/version; Audacity import current status unknown |
| C-027 | DOCUMENTED | High | Delivery includes full/range mix export, metadata, surround WAV, YouTube upload, and replacing video audio. | Windows current help | S-013, S-015, S-017, S-036 | Direct help descriptions | Loudness/DDP/ADM/advanced post workflows unknown |
| C-028 | DOCUMENTED | Medium-high | Public reliability/security/accessibility evidence is limited to backup/testing guidance, usage/diagnostic declarations, mobile store data-safety statements, and undeclared iOS accessibility. | Current EULA/stores | S-001, S-032, S-043, S-044 | Direct legal/store declarations | Vendor declarations are not independent audits; desktop controls unknown |
| C-029 | DOCUMENTED | High | MixPad is proprietary; VST3 SDK is MIT; VST2 redistribution/new licensing is restricted to pre-Oct-2018 licensees. | Current public terms | S-032, S-033 | Vendor and format-owner terms | Not legal advice; does not evaluate NCH’s private agreements |
| C-030 | UNKNOWN | High | No public scripting, native-device SDK, OSC/remote API, or extension authoring interface was found. | Current products | S-002, S-004, S-026, S-027 | Manual indexes and product pages reviewed | Undocumented/private interfaces may exist |
| C-031 | DOCUMENTED | High | Stock content is trial-limited to three downloads then advertised unlimited after purchase; WavePad is a separate editor handoff. | Windows current help | S-021, S-035 | Direct help statements | Asset-specific rights and current bundle/install-on-demand behavior unknown |
| C-032 | DOCUMENTED | High | Native auto-duck routes control-track amplitude into gain reduction on duck tracks with threshold/attack/release/hold controls. | Windows 14.24 help | S-041, S-042 | Direct help descriptions | Not evidence for plugin sidechain buses |
| C-033 | UNKNOWN | High | Current plugin entitlements by free/Masters/mobile paid edition are not fully documented. | Current offers | S-001–S-003, S-037, S-039, S-043, S-044 | VST free since Windows 7.93; current stores/offer pages reviewed | VST3/AU per-edition parity unknown; purchase endpoint did not render offers |
| C-034 | UNKNOWN | High | Missing-plugin placeholders, substitution, retained state, warnings, and recovery are undocumented. | All project/plugin paths | S-016, S-019, S-021, S-024, S-045, S-046 | Project/plugin/help review | Must be tested with missing and version-changed fixtures |
| C-035 | DOCUMENTED | High | Mobile documentary snapshots are iOS 12.53 and Android help 13.18; iOS store matches 12.53. | Cutoff 2026-08-29 | S-001, S-026, S-027, S-043, S-044 | Help version links, release log, stores | Google Play page does not expose build number |
| C-036 | INFERENCE | High | There is no current native Linux or browser MixPad edition; Chromebook availability refers to the Android package. | Current product scope | S-001, S-003, S-044 | Current platform/download list and Play linkage | Absence cannot exclude an obscure unsupported build |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. NCH pages are primary vendor documentation of vendor claims, not independent runtime verification. Each source was selected because it was the most direct accessible official page for its claim; duplicate marketing mirrors were rejected.

| ID | Title / publisher / URL | Kind and version scope | Relevant passage / supported claims | Limitations and selection rationale |
| --- | --- | --- | --- | --- |
| S-001 | “MixPad Multitrack Recorder Versions,” NCH, https://www.nch.com.au/mixpad/versions.html | Official release log; all platforms through 2026-08-26 | 14.25 macOS, 14.24 Windows; 13.08 Windows VST3; 7.93 free VST; upgrade warning; C-001, C-002, C-013, C-014, C-017, C-026, C-033, C-035 | Best version provenance; terse entries do not define enduring host contracts |
| S-002 | “MixPad Windows Help Index,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/index.html | Official manual index; Windows 14.24 | Topic inventory and embedded suggestion version; C-001, C-004, C-018, C-030 | Preferable to unreadable PDF; index presence is not feature depth |
| S-003 | “MixPad Multitrack Recording Software,” NCH, https://www.nch.com.au/mixpad/index.html | Current product page; cross-platform | Platforms, free noncommercial use, unlimited tracks, VST/VSTi, ASIO, rates/bit depth/content; C-001–C-003, C-005, C-012, C-013, C-033, C-036 | Marketing claims not benchmarks; plugin OS/edition not qualified |
| S-004 | “MixPad macOS Help Index,” NCH, https://help.nchsoftware.com/help/en/mixpad/mac/index.html | Official manual index; macOS 14.25 | AU topic and feature inventory; C-001, C-004, C-015, C-018, C-030 | No VST topic is not proof of rejection |
| S-005 | “Audio Units Effects Plugin and Instrument Plugin Support,” NCH, https://help.nchsoftware.com/help/en/mixpad/mac/vst.html | Official help; macOS 14.25 lineage | AU effects/instruments, component path, installed/Apple units, GUIs; C-015, C-019, C-021, C-023 | Says AU, not AUv2/AUv3; no deep host details |
| S-006 | “VST and VSTi Plugin Support,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/vst.html | Official help; Windows 14.24 lineage | VST effects/instruments/visual feedback, listing, path, ASIO monitoring, GUIs; C-014, C-019, C-021, C-023 | Generic VST terminology; no generation or scanner details |
| S-007 | “Options – VSTs,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/vsts.html | Official help; Windows 14.24 lineage | User-selected directory, usual `*.dll`, original language; C-014, C-019 | Legacy wording may not cover VST3 packages |
| S-008 | “Envelope Fade Points (Automation),” NCH, https://help.nchsoftware.com/help/en/mixpad/win/envelope_fade_points_automation.html | Official help; Windows 14.24 lineage | Volume/pan/VST parameter point lanes; C-011, C-021, C-022 | No timing/identity/state semantics |
| S-009 | “Effects,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/effects.html | Official help; Windows 14.24 lineage | Live ordered chains, enable/disable, save/load, built-ins; C-012, C-021, C-022 | Chain save is not proven plugin-state recall |
| S-010 | “Working with Tracks,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/track.html | Official help; Windows 14.24 lineage | Track controls, I/O, multirecord, mixer, effects; C-003, C-006, C-008 | No arbitrary graph/send semantics |
| S-011 | “Group Effects Window,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/groupeffectswindow.html | Official help; Windows 14.24 lineage | Many tracks routed through a shared group chain; C-006 | Placement/order and channel rules omitted |
| S-012 | “Master Effects Window,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/mastereffectswindow.html | Official help; Windows 14.24 lineage | Overall-mix effect chain; C-006 | One-sentence UX description |
| S-013 | “Surround Sound,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/surround.html | Official help; Windows 14.24 lineage | 5.1/7.1, spatial control/LFE, ASIO map, surround WAV; C-007, C-027 | No immersive/plugin-bus details |
| S-014 | “Choosing Your Audio Settings,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/audio_settings.html | Official help; Windows 14.24 lineage | Device APIs, ASIO channels, per-track output, monitoring; C-005, C-006 | Low-latency claims unmeasured; no buffer/PDC details |
| S-015 | “Exporting,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/exporting.html | Official help; Windows 14.24 lineage | Mix export, rate/channels/metadata/work region; C-026, C-027 | No offline plugin callback/tail semantics |
| S-016 | “Working with Your Project,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/work_project.html | Official help; Windows 14.24 lineage | Project model, `.mpdp`/`.ProjectData`, copied audio, timeline; C-003, C-024 | Schema/state/migration omitted |
| S-017 | “Cloud Support,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/cloud.html | Official help; Windows 14.24 lineage | Dropbox/Drive project transfer; YouTube final mix; C-024, C-027 | File transfer, not collaborative editing |
| S-018 | “History Manager,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/historymanager.html | Official help; Windows 14.24 lineage | Current-session action list/preview/revert; C-009, C-024 | No persistent journal/autosave |
| S-019 | “Comping Tool,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/compingtool.html | Official help; Windows 14.24 lineage | Separator/region take selection; C-008, C-034 | Does not describe storage/recovery |
| S-020 | “Recording a Clip,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/recclip.html | Official help; Windows 14.24 lineage | Per-track capture, multirecord, punch/roll, repeat takes; C-005, C-008 | No dropouts/file safety |
| S-021 | “Editing Clips,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/editing_clip.html | Official help; Windows 14.24 lineage | Editing operations and WavePad handoff; C-009, C-031, C-034 | Destructive/non-destructive boundary unclear |
| S-022 | “MIDI Playback,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/midi.html | Official help; Windows 14.24 lineage | Uniform tracks, device/synth playback, split/merge files, latency warning; C-003, C-010 | Windows-focused; no expression/sync contract |
| S-023 | “MIDI Editing,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/midiedit.html | Official help; Windows 14.24 lineage | Notes/channels/events/quantize/humanize/VSTi; C-010 | No MPE/MIDI 2.0/SysEx statements |
| S-024 | “MIDI Recording,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/midirec.html | Official help; Windows 14.24 lineage | Hardware/keyboard MIDI capture into any track; C-010, C-034 | Event precision and recovery omitted |
| S-025 | “MIDI Controller,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/midicontrolsetup.html | Official help; Windows 14.24 lineage | Track commands and jog-wheel MIDI mapping; C-011 | No feedback/API/persistence details |
| S-026 | “MixPad Android Help Index,” NCH, https://help.nchsoftware.com/help/en/mixpad/android/index.html | Official manual index; Android 13.18 | Mobile topic inventory including VST; C-004, C-017, C-018, C-030, C-035 | Shared desktop wording suspected; index alone not execution proof |
| S-027 | “MixPad iOS Help Index,” NCH, https://help.nchsoftware.com/help/en/mixpad/ios/index.html | Official manual index; iOS 12.53 | AU topic and mobile feature inventory; C-004, C-016, C-018, C-030, C-035 | Narrower feature set; index alone not deep support |
| S-028 | “VST and VSTi Plugin Support,” NCH, https://help.nchsoftware.com/help/en/mixpad/android/vst.html | Official help; Android 13.18 context | Claims VST effects/instruments/path/ASIO/GUI; C-017 | Platform-incongruent ASIO and desktop-identical text undermine runtime confidence |
| S-029 | “Audio Units Effects Plugin and Instrument Plugin Support,” NCH, https://help.nchsoftware.com/help/en/mixpad/ios/vst.html | Official help; iOS 12.53 | Installed AU effects/instruments, Apple units, GUI; C-016, C-021, C-023 | Does not say AUv3 or describe extension lifecycle |
| S-030 | “Options – VSTs,” NCH, https://help.nchsoftware.com/help/en/mixpad/android/vsts.html | Official help; Android 13.18 context | Claims user directory and `*.dll`; C-017 | Strongly resembles Windows boilerplate; no Android package mechanism |
| S-031 | “Choosing Your Audio Settings,” NCH, https://help.nchsoftware.com/help/en/mixpad/android/audio_settings.html | Official help; Android 13.18 context | Page contains only heading; C-017 | Retained negative/internal-consistency evidence, not a capability source |
| S-032 | “Software License Terms,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/licenceterms.html | Official EULA; current help | Proprietary/bundle/install-on-demand terms, redistribution, testing, telemetry; C-002, C-028, C-029 | Legal terms not edition matrix; descriptive use only |
| S-033 | “Licensing,” Steinberg VST 3 Developer Portal, https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html | Format-owner FAQ; 2026 | VST3 MIT and VST2 pre-Oct-2018 license/redistribution constraints; C-029 | General SDK terms, not NCH-specific rights; not legal advice |
| S-034 | “Audio Unit,” Apple App Extension Programming Guide, https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/AudioUnit.html | Platform-owner archive; iOS 9+/macOS 10.11+ AU extensions | AU extension roles, UI, host relationship, buses; C-016 | Archived 2017 guide; supports interpretation, not MixPad behavior |
| S-035 | “Loading an Audio Clip,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/clip.html | Official help; Windows 14.24 lineage | Disk/CD/stock/video loading, trial stock limit; C-012, C-026, C-031 | Does not enumerate every codec or license per asset |
| S-036 | “Working with Video,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/videos.html | Official help; Windows 14.24 lineage | Replace video audio with project mix; C-026, C-027 | No codec/timecode/conform guarantees |
| S-037 | “MixPad FAQ,” NCH, https://www.nch.com.au/mixpad/faq.html | Official current FAQ index | Links file formats/version/pricing/plugin language; C-002, C-033 | Purchase link failed to render offers; mostly navigation |
| S-038 | “Getting Started with MixPad,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/gettingstarted.html | Official help; Windows 14.24 lineage | Project/track/clip model, example export formats; C-003, C-026 | Introductory, not exhaustive |
| S-039 | “What file formats does MixPad support?,” NCH, https://www.nch.com.au/mixpad/kb/531.html | Official KB; current undated | Detailed import/export list and “Masters” purchase label; C-002, C-026, C-033 | No per-OS/version codec qualification |
| S-040 | “Why does my plugin display in another language?,” NCH, https://www.nch.com.au/mixpad/kb/1909.html | Official KB; current undated | `*.dll` VST wording and original-language UI; C-014, C-023 | Legacy generic wording; no generation details |
| S-041 | “Apply Auto Duck,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/autoduck.html | Official help; Windows 14.24 lineage | Control amplitude drives reduction/fades; C-032 | Native feature only, not plugin sidechain |
| S-042 | “Auto Duck Settings,” NCH, https://help.nchsoftware.com/help/en/mixpad/win/autoducksource.html | Official help; Windows 14.24 lineage | Control/duck roles, threshold/attenuation/attack/release/hold; C-032 | No detector scheduling/lookahead details |
| S-043 | “MixPad Music Mixer,” Apple App Store UK, https://apps.apple.com/gb/app/mixpad-music-mixer/id883901115 | Platform store listing; iOS 12.53 | Version, IAP, 6–96 kHz/32-bit float, privacy/accessibility declarations; C-005, C-016, C-028, C-033, C-035 | Regional listing; vendor declarations; product page gives different minimum iOS |
| S-044 | “MixPad Multitrack Mixer,” Google Play, https://play.google.com/store/apps/details?id=com.nchsoftware.mixpad_free&hl=en | Platform store listing; updated 2025-01-27 | Free noncommercial/commercial link, rates, data-safety declarations, Chromebook package; C-002, C-005, C-017, C-028, C-033, C-035, C-036 | Version number absent; store does not advertise VST; declarations not audit |
| S-045 | “Working with Your Project,” NCH, https://help.nchsoftware.com/help/en/mixpad/ios/project.html | Official help; iOS 12.53 | `.mpdp` plus `.ProjectData` and copied audio; C-025 | Cross-version/desktop fidelity not promised |
| S-046 | “Working with Your Project,” NCH, https://help.nchsoftware.com/help/en/mixpad/android/work_project.html | Official help; Android 13.18 | `.mpdp` plus `.ProjectData`, copied audio, timeline; C-025 | Desktop-like wording; no round-trip or plugin-state guarantee |

### Negative results retained

- **N-001:** Official Windows PDF `help.pdf` returned an unsupported `application/pdf` payload through the retrieval tool. Per contract it was not retried; accessible HTML help was used instead.
- **N-002:** Official-site web searches became rate-limited (`HTTP 429`). Direct known official URLs were used; search snippets were not treated as claims.
- **N-003:** The official purchase endpoint rendered no MixPad offers, prices, or edition deltas. No historical price was substituted.
- **N-004:** Alternate Google/Bing discovery for edition names produced an interstitial or irrelevant results. Search text was rejected as untrusted/nonprobative.
- **N-005:** Apple’s current dynamic AU documentation returned empty content, one guessed Steinberg license URL returned 404, and the accessible official archive/FAQ equivalents were retained instead.

### Bibliography rationale

The ledger intentionally favors current NCH manuals/release logs over reviews and forum anecdotes. Apple and Steinberg sources are included only where platform/SDK interpretation materially affects AU generation and VST licensing. Store listings were retained to qualify mobile version, commercial, privacy, and accessibility claims. No community source was needed: the unresolved questions are runtime/proprietary gaps that secondary reports could not prove.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted methods / available evidence | Blocker and decision impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| Android VST discovery/instantiation | Reviewed Android index, VST, VST-settings, audio-settings, release log, and Play listing; help claims `.dll`/ASIO while store is silent | Contradictory/copied documentation; changes mobile-host architecture conclusion | Disposable supported Android device; benign platform-valid test effect/instrument; record discovered→scanned→instantiated→rendered stages | Unassigned |
| Windows VST2 current support | Reviewed generic `.dll` help, VST3 introduction, current manual/product page | NCH never names VST2; legal constraint also matters | If organizational VST2 rights permit, signed 64-bit no-op VST2 fixture on current free and paid builds | Unassigned/legal gate |
| macOS AUv2 versus AUv3 | Reviewed macOS component path/manual and Apple AU extension model | Generic AU label; affects package/scanner design | Current macOS build with AUv2-only and AUv3-only signed fixtures, Intel and Apple Silicon as applicable | Unassigned |
| iOS AUv3 reality and edition | Reviewed iOS help/store and Apple platform docs | Inference only; IAP entitlement unknown | Install known AUv3 effect and instrument; compare before/after IAP; save/render/reopen | Unassigned |
| Scanner/cache/quarantine/duplicates | Reviewed all VST/AU options/help and FAQ pages | No scanner internals or recovery UX; high reliability impact | Two same-ID versions, invalid binary, hanging scanner fixture, rescan/cache inspection in disposable profile | Unassigned |
| Isolation/crash/architecture bridging | Reviewed manuals/release log, including ambiguous 64-bit-DLL phrase | Proprietary and unsafe to infer; high fault-containment impact | Crash/hang fixtures plus process observation on Windows/macOS; architecture-mismatch fixtures where lawful | Unassigned |
| Sidechain, multi-output, dynamic buses | Reviewed track/group/master/surround/auto-duck/plugin help | Native duck/surround do not prove plugin buses; major graph-design impact | VST3/AUv3 effect with auxiliary input and instrument with multiple outputs; enumerate routing UI and saved graph | Unassigned |
| MIDI/event expression contract | Reviewed MIDI playback/edit/record, instrument, and controller help | No MPE/MIDI 2.0/SysEx/sample timing evidence | Timestamped MIDI/event fixture, MPE instrument, MIDI-output plugin, loopback capture | Unassigned |
| PDC, reported latency, tails, offline mode | Reviewed audio settings, effects, export, surround, plugin help | No host-contract detail; mix correctness risk | Impulse plugin with variable latency/tail and distinct realtime/offline behavior; null/length comparison | Unassigned |
| Parameters and automation fidelity | Reviewed VST envelope help and MIDI mapping | UI point lanes do not establish IDs, gestures, text/ranges, or sample accuracy | Parameter fixture with stable IDs, non-linear/text values, automation ramps, version migration | Unassigned |
| Plugin state/presets/assets/missing recovery | Reviewed project, cloud, chain, history, and plugin help | No explicit state or placeholder policy; project durability risk | Save with opaque state/external asset, reopen present/missing/updated plugin, move across OS/profile | Unassigned |
| Project compatibility and crash recovery | Reviewed desktop/iOS/Android `.mpdp`, cloud, history | Same file naming is not round-trip/migration proof; no autosave/journal docs | Version matrix across current/previous desktop/mobile; interrupted save and forced-exit recovery in disposable copies | Unassigned |
| Current edition/upgrade entitlements | Reviewed product, FAQ, release log, EULA, stores; purchase page did not render offers | Pricing/feature matrix inaccessible; affects procurement and plugin test scope | Region-qualified rendered official checkout or written vendor clarification; archive dated result | Unassigned |
| Accessibility/security/telemetry | Reviewed EULA and mobile stores | Declarations are incomplete and not audits | Platform accessibility audit, network observation with consent, privacy-control inventory, signed/notarized plugin cases | Unassigned |
| Exact interchange fidelity | Reviewed codec KB, MIDI/video/cloud/export and historical Audacity entry | Container presence does not establish metadata/tempo/clip fidelity | Golden corpus for WAV/BWF/MIDI/video and any exposed Audacity import; compare metadata/timing | Unassigned |

## 24. Curiosity pass and stop decision

Scores use 1 (low) to 5 (high); cost 5 is most expensive. Only a positive, in-frame documentary thread could proceed.

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Confirm mobile `.mpdp` representation | 4 | 4 | 3 | 1 | **PURSUED** in pass 25; confirmed shared visible representation, not compatibility |
| Android VST actual runtime | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO`: requires app/plugin execution outside documentary authority |
| Plugin state/missing/PDC/sidechain/multi-output | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: manuals saturated; dynamic conformance fixtures required |
| macOS/iOS AU-generation matrix | 4 | 4 | 3 | 4 | `CURIOSITY_NO_GO`: documentary inference reached; signed fixture required |
| Current paid-edition deltas | 3 | 3 | 2 | 4 | `CURIOSITY_NO_GO`: checkout inaccessible and search rate-limited; lower architecture impact |
| Proprietary engine/threading internals | 3 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: no public engineering source; speculation prohibited |
| Exhaustive historical codec/release archaeology | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: nonpositive marginal architecture evidence |

### Gaps, contradictions, and recommendations

- **Contradiction:** Android VST pages use desktop `.dll` and ASIO language while Android audio settings are empty and Play does not advertise VST. Treat capability as `UNKNOWN`, not documented support. [C-017]
- **Contradiction:** current NCH product page says iOS 12+, while the UK App Store says iOS 11+. Test the exact regional build before setting a support floor. [C-001]
- **Gap:** VST3 is release-documented but all deep host-contract dimensions remain unqualified. Use a conformance matrix that separately records discovery, scan, instantiate, process, automate, save, restore, offline render, fail, and recover. [C-013, C-019–C-023]
- **Recommendation:** clean-room adapt the uniform-track, shared-group, auto-duck, and collected-assets concepts only after adding explicit type/routing/latency/state/recovery contracts. Do not copy UI expression or protected implementation. [C-003, C-006, C-024, C-032]
- **Recommendation:** prioritize a disposable Windows VST3 and Apple AU fixture suite; gate any VST2 work on legal review; defer Android plugin architecture until the vendor claim is dynamically reproduced. [C-013–C-017, C-029]
- **Recommendation:** define missing-plugin placeholders and state preservation before claiming portable `.mpdp`-like projects; copied audio alone is insufficient durability. [C-022, C-024, C-025, C-034]

### Stop decision

**STOP — sufficient documentary coverage with saturation and explicit unknowns.** Every required heading and plugin-format row is populated, current product/platform/edition evidence is pinned as far as accessible, and the best low-cost follow-up (mobile project representation) was completed. Further searches had begun returning duplicate help text, rate limits, empty pages, or platform-incongruent copies. The remaining decision-critical gaps require controlled dynamic qualification, vendor clarification, or legal review; another public-source pass has nonpositive expected marginal evidence within this dossier’s budget.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added only `research/daw-landscape/dossiers/nch-mixpad.md`; no staging or commit.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0 pins desktop/mobile snapshots, offers, platforms, cutoff, and exclusions.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and subsections 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Sections cite C-IDs; section 21 classifies each claim.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Claims register and section 23 provide sources/reasoning/probes.
- [x] **Every required plugin-format row is present.** VST2, VST3, AUv2, AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, Rack Extension, and product-native/other are included.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover discovery, isolation, contract, state, UI, diagnostics, and failures.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Android VST and AU/VST generation interpretations are explicitly bounded.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 covers NCH EULA, VST3/VST2 constraints, Apple boundaries, and non-legal-advice status.
- [x] **Bibliography records source rationale and limitations.** Section 22 contains 46 retained sources, supported claims, passages, limitations, and selection rationale.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24 record pursued/rejected threads and scores.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary retrieval only; no installers or plugins executed.

**Owned path:** `research/daw-landscape/dossiers/nch-mixpad.md`.

**Checks performed:** template/contract/frame read; source-pass cap of two followed; 46-source ledger reconciled; required format matrix manually enumerated; claim/source/unknown cross-links reviewed; heading/order and ownership verification performed; workspace status inspected before and after writing. The shared validator exited successfully with `INVALID: 0`; its missing-dossier warnings concern other roster owners.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; plugin format names are covered, deep host-contract gaps remain visible, and next probes are bounded.

**Unresolved blockers:** dynamic plugin behavior, rendered paid-edition details, proprietary internals, and legal entitlement for any VST2 fixture.

**Pre-existing workspace changes left untouched:** numerous modified/untracked files outside this owned path, including mobile app/design, vendor/crafty, shared research frame/template/roster, sibling dossiers, and the shared validator.
