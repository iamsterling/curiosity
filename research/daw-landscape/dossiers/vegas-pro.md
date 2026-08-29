# VEGAS Pro DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** VEGAS Pro, a video nonlinear editor (NLE) with a historically foundational multitrack-audio subsystem.
- **Canonical current vendor:** Boris FX. VEGAS Pro 23 and earlier remain MAGIX products; VEGAS Pro 2026 is the Boris FX line. [C-001]
- **Researcher/session:** subagent, `ses_fb273c3dfffeuhLLNAkzEHl6fC`.
- **Owned path:** `research/daw-landscape/dossiers/vegas-pro.md`.
- **Research date and evidence cutoff:** 2026-08-29 UTC.
- **Current snapshot:** VEGAS Pro 2026.0.3, build 189, released as a patch on 2026-08-24. [C-001]
- **Editions/licensing:** VEGAS Pro, VEGAS Pro Plus 2026, and VEGAS Pro Ultimate 2026 are current installer choices. Boris FX documents both subscription and perpetual licensing, but audio/plugin-host feature parity between editions is `UNKNOWN`. [C-004] [C-034]
- **Platforms:** current requirements specify Microsoft Windows 11; no macOS, Linux, mobile, or web product is in scope. [C-004]
- **Included:** current audio timeline, recording, buses, automation, effects, VST/DirectX hosting, video/post/interchange, recovery, and scripting; historical evidence only where it materially explains the audio/plugin lineage.
- **Excluded:** SOUND FORGE (specialized audio editing), ACID Pro (loop/music creation), Samplitude/Sequoia, VEGAS Movie Studio, and standalone Boris FX products except where they define a boundary. [C-030]
- **DAW-adjacent scope:** this is not evaluated as a current general-purpose music DAW. MIDI control/synchronization is included; note sequencing, software-instrument workflows, notation, MPE, and MIDI 2.0 are not established by the current documentation. [C-021] [C-036]
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.

## 1. Executive summary

VEGAS Pro is best classified as a **Windows video NLE with a mature, historically foundational multitrack-audio engine**, not as a current full-spectrum DAW. Its original 1999 release was marketed as a nonlinear multitrack audio/media system with realtime nondestructive editing and DirectX effects; the current product still has simultaneous multitrack recording, event/take editing, input and output buses, shared FX returns, 5.1, automation, ASIO, loudness logging, and multichannel delivery. [C-002] [C-003] [C-005] [C-008] [C-010] [C-027]

The strongest architectural reference is its uniform **media → take → event → track → bus/master** editing and mixing model. Effects exist at event, track, bus, and assignable-return levels; offline event processing creates a new take, preserving the source. Project recovery is layered through Live Save, autosave, `.bak`, configurable backup tiers, restore UI, and archive/collect. [C-005] [C-011] [C-023] [C-024]

Audio-plugin hosting is Windows-only. Current 2026 Help says “VST” and DirectX; official VEGAS 20/22 documentation establishes VST2 and VST3, with VST3 and a 32-bit VST bridge initially beta in VEGAS 20 and VST3 non-beta in Update 2 build 326. Continued VST2/VST3 support in 2026 is a high-confidence continuity inference, because the current manual does not name the VST sub-versions. [C-017] [C-018]

Hosting depth has notable gaps. User-selected VST folders, startup enumeration, enable/disable checkboxes, session locking, automation discovery, bypass, presets, and coarse startup-scan bypass are documented. In-process versus separate-process execution, sandboxing, scanner cache/blacklist, plugin-sidechain buses, multiple plugin audio I/O, MIDI/event I/O, sample-accurate automation, dynamic I/O, latency/tail reporting, custom-UI scaling/headless behavior, opaque state serialization, and missing-plugin placeholders are `UNKNOWN`. [C-014] [C-015] [C-016] [C-019] [C-020] [C-033]

**Recommendation:** use VEGAS as a reference for event/take non-destructive editing, send/bus ergonomics, layered recovery, and audio-in-video delivery. Do not use its documented plugin failure containment, MIDI scope, or proprietary internals as a model without disposable interoperability probes. **Overall confidence:** high for user-visible current workflows; medium for current VST2/VST3 continuity; low for proprietary plugin-runtime internals.

## 2. Product identity, history, and market position

The current Boris FX line is VEGAS Pro 2026; the latest official pre-cutoff patch found is 2026.0.3 build 189. A migrated product page still contains “VEGAS Pro 23” text, while the current Help and official release topics say 2026. The support transition article resolves the contradiction: version 23 and earlier are MAGIX products and 2026 is the Boris FX generation. [C-001]

An archived Sonic Foundry launch release describes the 1999 product as a Windows nonlinear multitrack audio/media system with nondestructive edits during playback, multiple realtime DirectX effects, mixed source sample rates/bit depths, multiprocessor use, and 24-bit/96 kHz-class audio. Those are vendor statements, not independent benchmarks, but they establish that the audio subsystem is lineage, not a recent NLE accessory. [C-003]

The current vendor categorizes VEGAS Pro as video editing, while the same product family describes SOUND FORGE as specialized audio tools and ACID Pro as loop-based music software. Thus VEGAS occupies video/post with substantial audio; SOUND FORGE owns detailed waveform/audio-editor work, and ACID owns music/loop composition. [C-002] [C-030]

Current requirements are Windows 11. Current installer documentation identifies base, Plus, and Ultimate editions. Licensing is commercial, with subscription and perpetual choices; legacy MAGIX perpetual versions continue using MAGIX activation. [C-004]

## 3. Workflow and conceptual model

The principal mental model is a linear audiovisual timeline. Media files remain external sources; an **event** is a timeline container; one event can hold multiple media **takes**; audio and video events live on corresponding tracks. Events expose fades, gain/opacity, crop, FX, trimming, slipping, grouping, and active-take selection. [C-005] [C-006]

This is non-destructive reference editing. A `.veg` project stores source locations, edits, insertion points, transitions, and effects rather than embedding rendered media. Nested `.veg` projects can be placed on another timeline as media. [C-006]

For audio, takes support loop recording, punch-in alternatives, copied external-editor versions, and offline-processed versions. This is an alternate-media model, not evidence of modern playlist/lane comping with swipe selection. [C-005] [C-010] [C-023]

The same timeline remains the center for video compositing, keyframes, subtitles, multicamera edits, and text-based editing. There is no documented scene launcher, tracker pattern grid, notation document, modular patch graph, or MIDI-note timeline. [C-002] [C-036]

## 4. Publicly documented architecture

The vendor names a proprietary “Vegas Core Engine,” but public material does not disclose module boundaries, graph representation, realtime scheduler, lock strategy, IPC, memory ownership, or audio/video engine separation. Those internals remain `UNKNOWN`. [C-031]

Publicly exposed architecture is user/configuration level:

- reference-based `.veg` projects and external media; [C-006]
- event, track, input-bus, output-bus, assignable-FX, master, and hardware-output layers; [C-008] [C-011]
- configurable track prebuffering using one processing thread per logical processor, or one track/bus processing thread when disabled; [C-009]
- C#/VB.NET scripting and compiled, startup-loaded application extensions; [C-026]
- OFX for video effects and VST/DirectX for audio effects. [C-011] [C-028]

No public source established audio plugins as in-process or out-of-process. A historical “32-bit bridge” documents compatibility but not containment architecture. Startup scanning can crash the application, which argues against claiming crash-safe scanning; it does not prove all runtime instances share the main process. [C-015] [C-016] [C-017]

## 5. Audio engine

Projects expose stereo or 5.1 master mode, a configurable sample rate and stored-sample bit depth, resample/stretch quality, and a configurable count of stereo buses. The documentation does not disclose the internal mixing accumulator precision. [C-007]

Audio devices include ASIO, DirectSound Surround Mapper, Microsoft Sound Mapper, and Windows Classic Wave. Playback buffering, wave-driver buffer count/size/priority, input-monitoring support, and hardware-recording-latency auto-offset are user controls. Track buffering prerenders ahead of the cursor and can allocate one processing thread per logical processor. [C-009]

The manual treats “gapping” as the visible dropout symptom and recommends buffer, track-count, storage, RAM, and DirectX-plugin-load adjustments. There is no documented deadline monitor, xrun counter, realtime-safety checker, or plugin CPU profiler. [C-009]

Automatic plugin delay compensation is documented for “non-in-place” chains; such chains are marked yellow. Chains unsuitable for live input monitoring are bypassed and marked red. This does **not** establish standard VST latency reporting, tail reporting, or full-path PDC semantics. [C-012] [C-020]

Realtime playback, non-real-time event rendering, Render to New Track, project rendering, and multichannel rendering are exposed. No plugin oversampling contract, freeze state, deterministic offline mode, tail policy, or suspend behavior is documented. [C-023] [C-020]

## 6. Tracks, timeline, clips, and editing

Audio/video events are media containers on linear tracks. Event headers expose per-event tools, while event bodies show waveforms or video frames. Event edges carry fades; audio event gain is directly editable. [C-005]

Takes associate alternate media with one event and choose one active take for playback/render. Recording loops, external-editor copies, and non-real-time FX all use this model. Slip/slide, split, ripple, grouping, automatic crossfades, markers/regions, timeline samples, beat/tempo detection, and nested timelines are documented in the current Help surface. [C-005] [C-010] [C-023]

Editing is non-destructive by default. Non-real-time event processing and bounce create new files while retaining source media; deleting originals after bounce is an explicit user choice. [C-006] [C-023]

There is no documented take-lane comping UI, clip launcher, per-clip warping marker map, or source-control history. Multiple takes should not be conflated with a modern comping lane system. [C-005]

## 7. MIDI, sequencing, notation, and expression

Current MIDI preferences make MIDI inputs/outputs available to control surfaces. VEGAS can generate MIDI clock (24 ticks per quarter note) and MIDI timecode and can use external control surfaces. [C-021]

The current Help surface documents audio and video tracks, not MIDI-note tracks; it has no piano roll, score editor, pattern sequencer, software-instrument rack, SysEx editor, MPE/per-note expression, or MIDI 2.0 topic. This is a bounded inference from the current manual, not proof that no hidden or historical capability exists. [C-036]

Consequently, VST instrument instantiation, plugin MIDI/event input/output, MIDI learn, MPE, and note-expression behavior are `UNKNOWN`. The documented VST examples are audio effects such as reverbs, delays, and equalizers. [C-017] [C-020]

Tempo is project-level and is sent to tempo-aware audio plugins. ACID loops can be stretched to project tempo, and the ruler supports measures/beats; these features do not constitute MIDI sequencing. [C-007]

## 8. Routing, mixer, automation, and control

Tracks route to buses; buses route to other buses, Master, or hardware outputs. Circular bus routing is prohibited. Current Help states up to 26 virtual buses plus Master. Hardware-routed buses are excluded from project render. [C-008]

Assignable FX are shared send/return-style chains: multiple tracks feed a DirectX/VST chain with independent send level. The documented maxima are 32 assignable chains and 32 plugins per chain. Input buses can process/record external devices, serve as hardware-FX returns, or monitor talkback. [C-008] [C-010]

Automation is envelope-based on audio tracks and bus tracks. Automatable plugin parameters are discovered when a plugin is first selected, added to an Automatable category, chosen in a parameter chooser, and edited or recorded as envelopes. Effect automation uses linear interpolation; frequency controls may therefore require alternative fade curves to approximate logarithmic response. [C-013]

The current host also has controller/listener Auto Ducking that analyzes a controller track and generates a listener volume envelope. This is host-generated volume automation, **not evidence of a plugin auxiliary/sidechain input bus**. External-plugin sidechain and multi-input I/O remain `UNKNOWN`. [C-022] [C-037] [C-020]

5.1 projects can use multiple plugin instances with per-channel enable automation. This is not evidence that arbitrary multibus plugin I/O is exposed. Control surfaces use MIDI; no OSC API, EuCon, VCA, feedback routing, or generic remote web API was established. [C-012] [C-021]

## 9. Recording, comping, and media handling

VEGAS records multiple mono or stereo tracks while playing existing audio/video. Audio is written to a media file and represented by a timeline event. Loop recording creates successive takes; event/time selections provide punch-in/out with pre/post-roll. [C-010]

Direct track monitoring records dry while monitoring through track FX; an input bus can apply processing and record wet. Automation envelopes are bypassed during record monitoring, and incompatible chains are automatically bypassed. [C-010] [C-012]

Broadcast Wave recording stores timeline time reference, originator, and unique originator reference; imported BWF can return to its recorded timeline location. Current supported audio files include AIFF, AAC, MP2/MP3, M4A, OGG, WAV, WMA, and FLAC, with BWF as interchange metadata. [C-004] [C-010]

Project media remain external. Archives can collect nested projects, used/all media, proxies, audio peaks, and BRAW companion metadata. The opening-project documentation did not expose a missing-media relink policy; that behavior is `UNKNOWN`. [C-024] [C-033]

## 10. Instruments, effects, content, and native devices

Architecture-relevant native audio features include track/bus/event effects, a Modern Equalizer, Auto Normalize, Auto Ducking, metronome, tempo/beat detection, loudness meters/logs, 5.1 panning, and hardware/input-bus routing. Effects can be saved as ordered packages with plugin settings. [C-011] [C-019] [C-022] [C-027]

No current primary evidence established a native synthesizer, sampler, drum machine, modular rack, macro/modulation system, or software-instrument API. These are `UNKNOWN`, not claimed absent. ACID Pro, not VEGAS, is the sibling loop/music product. [C-030] [C-032]

For video, OFX and integrated Boris tools are material but DAW-adjacent. Build 189 specifically mentions improved OFX startup scanning and OFX-envelope fixes; these do not establish an audio-plugin contract. [C-028]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `NOT_APPLICABLE:no macOS product` | `DOCUMENTED:VEGAS 20–22`; current 2026 explicit sub-version `UNKNOWN` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | VST2 predates VEGAS 20; v20 release also had a beta 32-bit bridge. Current Help says generic VST. Edition parity `UNKNOWN`. | High-confidence continuity inference for 2026; do not treat as current explicit matrix. VST2 SDK is discontinued. | [C-017] [C-018] [C-029]; [S-019] [S-018] [S-039] |
| VST3 | `NOT_APPLICABLE:no macOS product` | `DOCUMENTED:VEGAS 20 Update 2+`; current 2026 explicit sub-version `UNKNOWN` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | Beta in VEGAS 20 release; non-beta in Update 2 build 326; v22 documented. Edition parity `UNKNOWN`. | Current continuity inference; detailed VST3 host contract not documented. | [C-017] [C-018] [C-020]; [S-019] [S-018] |
| AUv2 | `NOT_APPLICABLE:no macOS product` | `UNKNOWN:not documented` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | No current-manual evidence. | Apple format; no VEGAS host claim. | [C-032]; [S-004] |
| AUv3 | `NOT_APPLICABLE:no macOS/mobile product` | `UNKNOWN:not documented` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | No current-manual evidence. | No VEGAS host claim. | [C-032]; [S-004] |
| AAX | `NOT_APPLICABLE:no macOS product` | `UNKNOWN:not documented` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | No current-manual evidence. | No VEGAS host claim; AAX naming is not permission/certification. | [C-032]; [S-004] |
| CLAP | `NOT_APPLICABLE:no macOS product` | `UNKNOWN:not documented` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | No current-manual evidence. | No host claim. | [C-032]; [S-004] |
| LV2 | `NOT_APPLICABLE:no macOS product` | `UNKNOWN:not documented` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | No current-manual evidence. | No host claim. | [C-032]; [S-004] |
| LADSPA | `NOT_APPLICABLE:no macOS product` | `UNKNOWN:not documented` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | No current-manual evidence. | No host claim. | [C-032]; [S-004] |
| DSSI | `NOT_APPLICABLE:no macOS product` | `UNKNOWN:not documented` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | No current-manual evidence. | No host claim. | [C-032]; [S-004] |
| JSFX | `NOT_APPLICABLE:no macOS product` | `UNKNOWN:not documented` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | No current-manual evidence. | No host claim. | [C-032]; [S-004] |
| DirectX/DXi | `NOT_APPLICABLE:no macOS product` | `DOCUMENTED:DirectX audio effects`; `UNKNOWN:DXi instruments` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | Current 2026 Help documents DirectX effects; 1999 release documents DirectX lineage. | DX effects at event/track/bus/return; DXi/instrument contract not established. | [C-003] [C-011] [C-020]; [S-005] [S-015] |
| Rack Extension | `NOT_APPLICABLE:no macOS product` | `UNKNOWN:not documented` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | No current-manual evidence. | No host claim. | [C-032]; [S-004] |
| Product-native/other | `NOT_APPLICABLE:no macOS product` | `DOCUMENTED:OFX for video/native FX`; audio-native SDK `UNKNOWN` | `NOT_APPLICABLE:no Linux product` | `NOT_APPLICABLE:no mobile/web product` | Current 2026 release notes and Help. | OFX is a DAW-adjacent video-effect boundary, not an audio-plugin format. | [C-028] [C-032]; [S-003] |

### 11.2 Discovery, scanning, validation, and recovery

Users add/edit/remove VST search folders and select checkboxes for which discovered VST effects are available. Once a VST is used, it is locked for that VEGAS session and cannot be deselected until restart. [C-014]

Vendor support documents startup search/enumeration of installed VST and DX plugins. A faulting VST can crash launch; `/NOVSTGROVEL` skips VST search and `/NODXGROVEL` skips DX search. This is format-wide recovery, not per-plugin quarantine. [C-015]

`UNKNOWN`: scan cache file/location/schema, incremental detection, validation tests, duplicate identity, bitness preference, per-plugin blacklist, automatic quarantine, rescan UX, failure log, and migration of cached identities. Searches of current Help, TOC/full-text indexes, and vendor support found no audio-plugin cache/blacklist article. [C-016]

### 11.3 Runtime isolation and compatibility

VEGAS 20 introduced a beta bridge for legacy 32-bit VSTs in the 64-bit application. The current status, supported CPU architectures, and whether the bridge is a separate process are `UNKNOWN`. [C-017] [C-020]

No source establishes in-process versus separate-process execution for normal VST2, VST3, or DirectX instances; sandbox permissions; code-signing checks; crash restart; per-instance process grouping; or state recovery after a plugin crash. Startup scanning can terminate launch, so no crash-containment claim is made. [C-015] [C-016]

### 11.4 Host/plugin processing contract

Documented placements are audio event, track, bus, and assignable FX chain. Chains are ordered and bypassable; shared assignable chains accept multiple track sends with independent levels. [C-011] [C-008]

Documented processing behaviors include automatic compensation for non-in-place chains, bypass during incompatible live monitoring, per-channel 5.1 use via multiple plugin instances, realtime preview, non-real-time event render, track bounce, and full render. [C-012] [C-023]

`UNKNOWN`: effect versus instrument class filtering; plugin audio bus negotiation; sidechain/aux inputs; multiple outputs; MIDI/event input/output; note expression/MPE/MIDI 2.0; sample-accurate automation; dynamic I/O; latency-reporting API and scope; tail reporting; soft versus hard bypass; suspend/resume; offline-render flags; block-size changes; tempo/time-signature transport granularity; and deterministic offline behavior. Host Auto Ducking is not plugin-sidechain evidence. [C-020] [C-037]

### 11.5 Parameters, automation, state, presets, and project recall

The host discovers whether a plugin is automatable when first selected, lists automatable parameters, and creates track/bus envelopes. Effect automation uses linear interpolation and can itself be bypassed. [C-013]

DirectX presets and VST `.fxp`/`.fxb` presets/banks can be loaded and saved; reusable FX packages preserve chain order and individual settings. `.veg` projects save effects and effects parameters. [C-019] [C-006]

`UNKNOWN`: stable parameter IDs across versions, normalized ranges/text conversion, gesture boundaries, opaque VST2 chunks/VST3 component-state details, external asset references, preset portability for VST3, plugin-version migration, missing-plugin placeholder/state retention, and state salvage after a plugin crash. [C-020] [C-033]

### 11.6 UI, diagnostics, and failure modes

Audio-effect controls appear in a host effects window for track, bus, assignable FX, or event chains. The window can resize to the current plugin; the chain banner exposes order, enable/bypass, remove, parameters, automation, preset, and plugin-help controls. [C-019]

Yellow marks non-in-place/PDC chains; red marks chains bypassed for live monitoring; a lock marks an in-use VST that cannot be deselected this session. Startup flags can bypass whole VST or DX scans. [C-012] [C-014] [C-015]

`UNKNOWN`: native-editor versus generic-editor selection, detached UI, DPI/scaling, resize negotiation, keyboard focus, accessibility tree, headless operation, GPU context, editor crash handling, per-plugin diagnostics, scanner log, and missing-plugin UI. [C-020] [C-033] [C-035]

## 12. Extensibility and integration

VEGAS scripting uses Microsoft .NET with C# or Visual Basic `.cs`/`.vb` scripts. The application scans a Script Menu directory and offers a manual rescan. Compiled application extensions load at startup, remain loaded for the process lifetime, can observe project changes, control playback, and show non-modal UI. [C-026]

Command-line switches can open projects/media, run scripts, pass script arguments, and load an extension module. The current API-summary page rendered empty during research, so exact object-model/versioning guarantees remain `UNKNOWN`. [C-026]

The manual explicitly warns scripts can read/write/delete files, execute programs, use network files, and access the Internet. This is trusted local extensibility, not a sandbox. [C-026]

Control surfaces use MIDI. No documented OSC, web remote, public audio-device SDK, custom native-audio-device SDK, or stable binary ABI was found. [C-021] [C-032]

## 13. Project format, persistence, interoperability, and collaboration

`.veg` is a proprietary reference project storing media locations, edits, insertion points, transitions, effects, envelopes, and effect parameters. Source media remain external and unchanged. [C-006]

Durability is layered: optional Live Save after initial save; five-minute legacy autosave with crash-restart prompt; `.veg.bak` last-saved backup; configurable minutely, hourly, daily, and per-edit backups; retention controls; and a restore browser. [C-024]

Archive export can include nested projects, used/all media, proxy/peak files, and BRAW companion files. Missing media and missing audio plugins after reopen are not documented sufficiently to claim placeholder semantics or successful relinking. [C-024] [C-033]

Project interchange supports Premiere/After Effects projects, FCP7/Resolve XML, FCPXML, and text EDL with unsupported-element reports. The VEGAS EDL is explicitly nonstandard/lossy: it reduces events to one track/crossfades, and an imported external EDL initially has at most four audio tracks. [C-025]

Current specifications do not list AAF, OMF, ADM/BWF-ADM, MusicXML, or DAWproject project interchange. Absence from the list is not proof of impossibility; these remain `UNKNOWN/not documented`. [C-025] [C-032]

Project Notes and Media Share provide bounded collaboration, but no concurrent project merge, source-control format, conflict resolution, or cloud-native session model was established. [C-025]

## 14. Delivery, live, post-production, and specialized workflows

VEGAS is video/post first: camera/media formats, proxy workflows, multicamera sync, subtitles, color management/HDR, video effects, external preview, and broad video delivery are central. [C-002] [C-004]

Audio delivery includes stereo/5.1, loudness meters and logs, Red Book CD workflows, BWF, and explicit bus-to-channel mapping for WAV/W64/AVI/MXF. Loudness logging occurs after the plugin chain but before codec; a rendered compressed file should be measured again when codec effects matter. [C-027]

No current evidence established Dolby Atmos authoring, ADM export, ambisonics, object beds, ADR cue management, DDP, show control, or a live-performance clip launcher. [C-032]

VEGAS can generate MIDI clock/timecode for synchronization, but it is not documented as a live instrument host. [C-021] [C-036]

## 15. Performance, reliability, security, and accessibility

Performance controls include playback buffering, wave/ASIO driver setup, track prebuffering, per-logical-processor track-render threads, hardware-recording-latency correction, proxy media, and prerender/bounce paths. Vendor performance claims are not independent measurements. [C-009] [C-023]

Reliability strengths include layered project backups and new-take/bounce preservation. Plugin reliability is weaker in the public contract: a faulting VST can crash startup, and documented recovery skips the entire VST scan. Runtime crash isolation is unknown. [C-015] [C-016] [C-024]

Security boundaries are conventional desktop trust boundaries: scripts have broad host authority, and no plugin sandbox/signature policy is documented. Current login licensing uses Boris FX Hub/account services; legacy MAGIX perpetual activation remains separate. [C-004] [C-026]

Build 189 is explicitly a stability/crash-fix patch and improves OFX startup scanning, but this does not prove equivalent audio-plugin scanning changes. [C-001] [C-028]

Accessibility conformance, screen-reader coverage, keyboard-only plugin interaction, high-contrast behavior, captions for training, and plugin-editor accessibility are `UNKNOWN`; no current accessibility statement was found in the retained primary documentation. [C-035]

## 16. Licensing, ecosystem, and implementation constraints

VEGAS Pro is commercially licensed; Boris FX documents subscription and perpetual options and account/Hub delivery for 2026 editions. Legacy MAGIX perpetual licenses remain valid under MAGIX activation, while 23 and earlier cannot be updated by Boris FX. [C-004]

VST3 SDK 3.8 is MIT-licensed. Use of the VST trademark/logo is optional but subject to Steinberg usage rules if used. Steinberg discontinued VST2 in 2022. These facts do not grant rights to old VST2 SDK materials, third-party plugin binaries, trademarks, or compatibility claims. [C-029]

DirectX, OFX, ASIO, AAX, AU, CLAP, and other names likewise do not imply SDK, trademark, redistribution, signing, certification, or test-suite rights. Format-specific legal review remains required; this dossier is not legal advice. [C-029]

The application and `.veg` format are proprietary. Public user documentation does not authorize copying internal implementation, protected UI expression, presets, code, or assets. Clean-room adaptation should stay at problem/mechanism level. [C-031]

## 17. Strengths, liabilities, and architecture lessons

**Strengths**

- Event/take identity is consistently reused for recording, external edits, alternate media, and committed FX; this supports nondestructive recovery. [C-005] [C-023]
- Event, track, bus, assignable-return, input-bus, master, and hardware layers cover serious video-post mixing without a separate DAW mode. [C-008] [C-011]
- Layered autosave/backup/archive mechanisms are unusually explicit and user-recoverable. [C-024]
- Audio delivery is integrated with video, BWF timestamps, multichannel mapping, loudness logging, and 5.1. [C-010] [C-027]
- Scripts/extensions provide broad automation for NLE workflows. [C-026]

**Liabilities**

- Current VST documentation is version-generic; scanner/cache/isolation and most advanced host-contract details are unknown. [C-016] [C-018] [C-020]
- A faulting VST can prevent launch; documented containment is only format-wide scan bypass. [C-015]
- MIDI is control/sync-oriented in current docs, leaving modern instruments, note expression, and plugin MIDI unestablished. [C-021] [C-036]
- VST2 and a historical 32-bit bridge carry legacy migration risk. [C-017] [C-029]
- Windows-only deployment and proprietary internals limit its usefulness as a direct reference for a cross-platform DAW. [C-004] [C-031]

**Lesson:** VEGAS is a strong reference for editing and persistence patterns and a weak documentary reference for a modern portable plugin runtime. Product quality and architectural-reference suitability are separate judgments.

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Support | Prerequisites/tradeoffs | Risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Preserve alternate edits/processing | Event owns ordered alternate takes plus one active take; committed processing creates a new take | [C-005] [C-023] | Stable media identity; storage growth; explicit active-take semantics | Low conceptual, medium UX | `CANDIDATE` |
| Offer effects at useful scopes | Ordered effect chains at clip/event, track, bus, and shared send-return scopes | [C-008] [C-011] | Clear signal-flow ordering and latency accounting | Medium | `CANDIDATE` |
| Prevent unsafe monitoring | Capability-check realtime chains; mark compensated chains; bypass chains that cannot meet monitoring constraints | [C-012] | Conservative realtime policy and clear diagnostics | Medium; do not copy UI | `CANDIDATE` |
| Recover from edit/application failure | Independent live-save, autosave, last-save backup, tiered snapshots, restore browser, and collect/archive | [C-024] | Atomic persistence, retention policy, media manifest | Medium storage/complexity | `CANDIDATE` |
| Keep post delivery auditable | Measure loudness after DSP, map buses explicitly to output channels, preserve BWF time references | [C-010] [C-027] | Standards-aware meters/exporters | Medium | `CANDIDATE` |
| Diagnose scanner failure | Safe-start mode that disables one plugin format | [C-015] | Startup argument/recovery UI | Coarse; insufficient alone | `CONDITIONAL` |
| Scale track work across CPUs | Configurable prerender-ahead with parallel track workers | [C-009] | Correct graph dependencies and realtime scheduling | High; public mechanism is incomplete | `CONDITIONAL` |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject format-wide scan bypass as the primary plugin recovery model.** It restores launch but gives no per-plugin attribution/quarantine. Reopen only if a later VEGAS build documents crash-safe per-plugin scanning. [C-015]
- **Reject VST2/32-bit bridging as a default new-host target.** It is valuable migration behavior but carries discontinued-format and architecture debt. Reopen only for an explicit customer migration requirement and separate licensing review. [C-017] [C-029]
- **Reject inferring plugin sidechain from Auto Ducking.** Auto Ducking writes host volume envelopes; it does not prove plugin auxiliary input. [C-022] [C-037]
- **Reject copying proprietary `.veg`, UI, FX-package, preset, or scanner representations.** Only behavior-level clean-room patterns are candidates. [C-031]
- **CURIOSITY_NO_GO — OFX cache internals:** video-plugin-specific and outside the audio-host decision; current build notes are sufficient for the DAW-adjacent row.
- **CURIOSITY_NO_GO — acquisition transaction details:** ownership/version boundary is resolved; price/legal transaction data cannot alter audio architecture conclusions.
- **CURIOSITY_NO_GO — exhaustive built-in effect inventory:** low novelty and no architecture impact.
- **CURIOSITY_NO_GO — community plugin compatibility anecdotes:** would not prove vendor internals and dynamic qualification belongs in a disposable harness.
- **CURIOSITY_NO_GO — installers/binary inspection:** outside documentary scope and unnecessary for this wave.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and result | Status/counterevidence | Later safe probe |
| --- | --- | --- | --- |
| H1: VEGAS audio is incidental to video | Historical Sonic Foundry release and current recording/bus/automation docs show foundational and continuing multitrack audio | **Falsified** [C-003] [C-008] [C-010] | None needed |
| H2: Current “VST support” proves VST3 | Versioned v20/v22 Help explicitly names VST2/VST3; 2026 Help does not | **Partially supported only by continuity inference** [C-017] [C-018] | Instantiate known VST2/VST3 fixtures in build 189 |
| H3: A plugin that scans has a full host contract | Docs cover discovery/availability but omit sidechain, MIDI, dynamic I/O, tail, state migration, and isolation | **Falsified** [C-014] [C-020] | Capability matrix with effect, instrument, sidechain, multi-out, dynamic-I/O fixtures |
| H4: Auto Ducking is plugin sidechain | Current Help says it creates controller/listener volume envelopes | **Falsified** [C-022] [C-037] | Route a known VST3 sidechain fixture |
| H5: 32-bit bridge means sandbox/crash containment | Release notes name a bridge but no process or fault boundary | **Not established** [C-017] [C-020] | Observe process tree and crash a disposable bridged fixture |
| H6: Automatic PDC means full latency/tail compliance | Current Help only discusses non-in-place chains and sync warnings | **Not established** [C-012] [C-020] | Impulse/loopback tests with changing latency and tails |
| H7: Missing plugin state survives round trip | Project docs save effects/parameters but describe no placeholder/state retention | **UNKNOWN** [C-033] | Save with fixture, remove it, reopen/save/reinstall, compare state |
| H8: Edition choice changes audio hosting | Current edition pages identify tiers but not audio-host deltas | **UNKNOWN** [C-034] | Obtain official comparison matrix or test each licensed tier |

The distinction among **format accepted**, **plugin scanned**, **plugin instantiated**, and **full host contract works** is explicit: this dossier documents the first two for VST/DX, common effect instantiation at several scopes, and only a partial processing contract. [C-014] [C-020]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | **DOCUMENTED** | High | Current line is VEGAS Pro 2026; latest official pre-cutoff patch found is 2026.0.3 build 189 (2026-08-24); 23 and earlier remain MAGIX products. | Current identity | S-001, S-002, S-003, S-035 | Transition article resolves stale “23” product-page text. | No independent installation check. |
| C-002 | **DOCUMENTED** | High | Current product is a video NLE centered on a unified audiovisual timeline, with substantial audio capabilities. | 2026 | S-001, S-004 | Vendor positioning plus Help. | Vendor positioning is not market-share evidence. |
| C-003 | **DOCUMENTED** | High | 1999 Vegas was launched as a Windows nonlinear multitrack audio/media system with realtime nondestructive editing and DirectX effects. | Historical | S-005 | Archived first-party release. | Performance/unlimited-track language is vendor marketing, not measurement. |
| C-004 | **DOCUMENTED** | High | Current requirement is Windows 11; current tiers include base/Plus/Ultimate; subscription and perpetual licenses exist; legacy MAGIX activation persists. | Current platform/licensing | S-004, S-035, S-036, S-037 | Direct vendor docs. | Exact plan prices/entitlements may change. |
| C-005 | **DOCUMENTED** | High | Events contain media/takes; active takes select alternates for playback/render and support non-destructive editing. | Current timeline | S-006, S-007 | Direct Help definitions. | Not evidence of lane comping. |
| C-006 | **DOCUMENTED** | High | `.veg` stores references, edits, transitions, effects/parameters rather than media, enabling non-destructive editing. | Current persistence | S-024, S-020 | Project and effects docs. | Binary schema and forward compatibility unknown. |
| C-007 | **DOCUMENTED** | High | Audio projects expose stereo/5.1, buses, sample rate, stored-sample bit depth, resample/stretch quality, tempo, and tempo-aware plugin delivery. | Current engine UI | S-008 | Direct Help. | Internal mix precision and exact ranges absent. |
| C-008 | **DOCUMENTED** | High | Routing includes tracks, up to 26 buses plus Master, acyclic bus-to-bus/hardware routing, and up to 32 shared assignable FX chains of 32 plugins. | Current routing | S-012, S-013, S-014 | Direct Help. | Hard limits could change by build; no dynamic probe. |
| C-009 | **DOCUMENTED** | High | Driver/buffer controls include ASIO and track prebuffering with per-logical-processor threads when enabled. | Current audio engine | S-009, S-010 | Direct Help. | Scheduler implementation and realtime safety unknown. |
| C-010 | **DOCUMENTED** | High | Simultaneous mono/stereo recording, dry FX monitoring, wet input-bus recording, punch/loop takes, and BWF metadata are supported. | Current recording | S-011 | Direct Help. | Hardware-dependent scaling unmeasured. |
| C-011 | **DOCUMENTED** | High | DirectX/VST effects can be placed in ordered, bypassable event, track, bus, and assignable FX chains. | Current audio effects | S-015, S-016, S-020 | Direct Help. | Does not identify VST sub-version. |
| C-012 | **DOCUMENTED** | High | Non-in-place chains receive automatic delay compensation; unsuitable monitoring chains are bypassed; 5.1 can use per-channel instances. | Current PDC/monitoring | S-015, S-016 | Direct Help. | Standard latency/tail APIs and graph-wide PDC remain unknown. |
| C-013 | **DOCUMENTED** | High | Plugin automation capability/parameters are discovered and exposed as linear-interpolated track/bus envelopes. | Current automation | S-017 | Direct Help. | Sample accuracy and parameter identity unknown. |
| C-014 | **DOCUMENTED** | High | VST discovery uses configurable folders and availability checkboxes; used plugins lock for the session. | Current discovery | S-018 | Direct Help. | Cache, duplicates, blacklist, and rescan absent. |
| C-015 | **DOCUMENTED** | High | Startup VST/DX scanning can encounter a faulting plugin; format-wide `/NOVSTGROVEL` and `/NODXGROVEL` bypass scans. | Current/legacy support | S-021 | Direct vendor support. | Does not prove all runtime instances are in-process. |
| C-016 | **UNKNOWN** | High that unknown is real | Scanner cache, validation, per-plugin quarantine/blacklist, runtime isolation, crash restart, and signing policy are not publicly established. | Current plugin internals | S-018, S-021 | Help/TOC/support searches plus negative results. | Vendor/private implementation may exist. |
| C-017 | **DOCUMENTED** | High | VST3 and a 32-bit VST bridge were beta in VEGAS 20 release; VST3 was non-beta in Update 2 build 326; VST2 pre-existed. | Version history | S-019 | Versioned official Help. | Current bridge status unknown. |
| C-018 | **INFERENCE** | Medium-high | VEGAS Pro 2026 likely continues VST2/VST3 support because v22 did and 2026 retains the same generic VST UI. | Current format support | S-018, S-019 | Assumes no silent removal; alternative is partial format removal. | Current docs never explicitly say VST2/VST3. |
| C-019 | **DOCUMENTED** | High | Host UI supports resize, order/bypass, DirectX presets, VST `.fxp/.fxb`, and reusable ordered FX packages. | Current UI/presets | S-020 | Direct Help. | VST3-specific state/preset mapping not explained. |
| C-020 | **UNKNOWN** | High that unknown is real | Sidechain/multi-I/O/MIDI event buses, MPE/MIDI2, sample-accurate automation, dynamic I/O, latency/tail reporting, suspend/offline flags, detailed state/UI contract are not established. | Current host contract | S-015–S-020 | Comprehensive current/legacy docs reviewed. | Absence from docs is not non-support. |
| C-021 | **DOCUMENTED** | High | MIDI inputs/outputs are documented for control surfaces, MIDI clock, and MIDI timecode synchronization. | Current MIDI | S-030, S-031 | Direct current Help. | Does not establish note/event sequencing. |
| C-022 | **DOCUMENTED** | High | Auto Ducking analyzes a controller track and generates a volume envelope for listener tracks. | Current automation | S-032 | Direct current Help. | Does not describe a plugin auxiliary input. |
| C-023 | **DOCUMENTED** | High | Non-real-time event FX render a new file/take; Render to New Track bounces effects/envelopes while preserving sources. | Current offline/bounce | S-022, S-023 | Direct Help. | Plugin offline/tail contract unknown. |
| C-024 | **DOCUMENTED** | High | Live Save, autosave, `.bak`, tiered backups/restore, and archive/collect are current durability mechanisms. | Current recovery | S-025, S-026 | Direct Help. | Atomicity and corrupt-project salvage unknown. |
| C-025 | **DOCUMENTED** | High | Project interchange includes Adobe, FCP/Resolve XML/FCPXML, and lossy/nonstandard EDL with reports. | Current interchange | S-004, S-027, S-028 | Direct Help/specs. | No fidelity benchmark; omitted formats not proven unsupported. |
| C-026 | **DOCUMENTED** | High | C#/VB.NET scripts and compiled extensions can automate projects/playback/UI and have broad host permissions. | Current extensibility | S-029 | Direct Help/security warning. | API-summary content was inaccessible. |
| C-027 | **DOCUMENTED** | High | Post audio includes 5.1, multichannel bus mapping, BWF, and post-DSP/pre-codec loudness logging. | Current delivery | S-033, S-034, S-011 | Direct Help. | No immersive/ADM evidence. |
| C-028 | **DOCUMENTED** | High | OFX is a current video-plugin boundary; build 189 improved OFX scanning/workflows. | DAW-adjacent video | S-003 | Official patch notes. | Not an audio-plugin claim. |
| C-029 | **DOCUMENTED** | High | VST3 SDK 3.8 is MIT; trademark rules still apply; VST2 is discontinued. | Format licensing | S-038, S-039 | Format-owner sources. | Not legal advice or product redistribution permission. |
| C-030 | **DOCUMENTED** | High | SOUND FORGE and ACID are separate sibling boundaries for specialized audio editing and loop/music creation. | Ecosystem | S-040 | Current vendor landing page. | Product feature overlap not exhaustively compared. |
| C-031 | **UNKNOWN** | High that unknown is real | Proprietary Core Engine graph, scheduler, storage schema, and process boundaries are not publicly documented. | Internal architecture | S-001, S-009, S-024 | Public docs expose behavior only. | Patents/private docs were neither needed nor sought. |
| C-032 | **UNKNOWN** | High that unknown is real | AU/AAX/CLAP/LV2/LADSPA/DSSI/JSFX/Rack Extension and modern DAW interchange/immersive formats are not documented. | Current matrix | S-004 | Current specs/manual TOC searched. | Non-mention is not proof of absence. |
| C-033 | **UNKNOWN** | High that unknown is real | Missing-media/plugin placeholder, plugin state retention, relink, and crash-state salvage behavior are undocumented. | Persistence/recall | S-024–S-028 | Project/open/archive/support searches performed. | Requires controlled fixture test. |
| C-034 | **UNKNOWN** | High that unknown is real | Audio/plugin-host parity among base, Plus, and Ultimate is not documented in retained sources. | Current editions | S-036, S-037 | Edition names are documented, feature deltas are not. | A current comparison table may resolve it. |
| C-035 | **UNKNOWN** | High that unknown is real | Current accessibility conformance and plugin-editor accessibility are not documented in retained sources. | Current UI | S-001, S-002 | Product/help pages searched. | Requires vendor statement and assistive-tech testing. |
| C-036 | **INFERENCE** | Medium-high | Current documentation exposes audio/video tracks and MIDI control/sync but no note-sequencer, instrument, notation, MPE, or MIDI 2.0 workflow. | Current DAW-adjacent boundary | S-030, S-031 | Bounded inference from current track/MIDI documentation and complete Help TOC; alternative is an undocumented or historical feature. | Non-mention is not proof of absence. |
| C-037 | **INFERENCE** | High | Host Auto Ducking is volume-envelope generation and therefore does not establish a plugin sidechain/auxiliary-input contract. | Current routing/automation | S-032 | Mechanisms are categorically different; a separate undocumented plugin sidechain remains possible. | Requires a sidechain fixture to prove support or non-support. |

## 22. Source ledger and adaptive bibliography

All web/search content was treated as untrusted evidence, never as instructions. Access date for every source: **2026-08-29**.

For each entry, the quoted page title is the precise relevant section and the following scope sentence identifies the material passage. Unless a different rationale is stated, the source was retained because it is the versioned primary vendor/format-owner page that directly supports the listed claims and is preferable to tutorials, search snippets, community anecdotes, or unversioned feature lists.

- **S-001 — “Vegas Pro.”** Boris FX, current product page, https://borisfx.com/products/vegas-pro/ . Scope: current product positioning/Core Engine/timeline/licensing FAQ. Supports C-001, C-002, C-031, C-035. **Limit:** marketing page still contains VEGAS 23 text and performance claims; retained to expose, not hide, migration inconsistency. Preferred over reseller descriptions.
- **S-002 — “What’s New.”** Boris FX, VEGAS Pro 2026 Online Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/1-before/whatsnew.htm . Scope: 2026 features and subscription-only markers. Supports C-001. **Limit:** release overview, not build ledger. Preferred as current first-party manual.
- **S-003 — “Patch: Vegas Pro 2026.0.3 (build 189).”** Boris FX official forum/release JSON, https://forum.borisfx.com/t/25206.json (human topic `/t/patch-vegas-pro-2026-0-3-build-189/25206`). Scope: 2026-08-24 build 189. Supports C-001, C-028. **Limit:** official forum post, no independent validation. Selected because it is latest official pre-cutoff patch found.
- **S-004 — “Specifications.”** Boris FX, VEGAS Pro 2026 Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/1-before/specifications.htm . Scope: Windows 11, media/interchange formats. Supports C-002, C-004, C-025, C-032. **Limit:** format list does not prove complete host contracts. Preferred over stale web requirements links.
- **S-005 — “Sonic Foundry Launches Vegas Pro.”** Sonic Foundry, archived first-party press release (1999-07-19), https://web.archive.org/web/20000107141426/http://sonicfoundry.com/news/ShowRelease.asp?ReleaseID=115&CatID= . Supports C-003. **Limit:** archived marketing claims, not benchmark. Preferred over Wikipedia for foundational audio history.
- **S-006 — “Editing events on the timeline.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/7-edit/events_intro.htm . Supports C-005. **Limit:** user model only.
- **S-007 — “Using takes as alternate versions of events.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/7-edit/take.htm . Supports C-005. **Limit:** no lane-comping claim.
- **S-008 — “Setting project properties.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/3-projects/project_properties.htm . Supports C-007. **Limit:** selectable ranges/internal precision omitted.
- **S-009 — “Audio Device Tab.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/12-preferences/preferences-audiodevice.htm . Supports C-009. **Limit:** configuration behavior, not scheduler code.
- **S-010 — “Advanced Audio Configuration.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/12-preferences/advancedaudiopreferences.htm . Supports C-009. **Limit:** ASIO settings delegated to driver.
- **S-011 — “Recording audio.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/9-audio/recording.htm . Supports C-010, C-027. **Limit:** no measured track ceiling.
- **S-012 — “Busses — overview.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/9-audio/busses.htm . Supports C-008. **Limit:** overview only.
- **S-013 — “Routing busses.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/9-audio/busroutehard.htm . Supports C-008. **Limit:** current stated bus limit may be build-specific.
- **S-014 — “Using assignable effects.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/9-audio/using_assignable_fx.htm . Supports C-008. **Limit:** send semantics, not plugin sidechain.
- **S-015 — “Adding audio effects.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/9-audio/adding_audioeffects.htm . Supports C-011, C-012. **Limit:** generic “VST”; PDC described only through non-in-place examples.
- **S-016 — “Adding audio event effects.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/9-audio/adding_audioeventeffects.htm . Supports C-011, C-012. **Limit:** no state/latency API detail.
- **S-017 — “Automating audio effect parameters.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/11-autoscript/automating_effects_with_envelopes.htm . Supports C-013. **Limit:** sample accuracy/IDs omitted.
- **S-018 — “VST Effects Tab.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/12-preferences/vst_effects_preferences.htm . Supports C-014, C-016, C-018. **Limit:** no VST sub-version/cache/validation detail. Preferred over tutorials.
- **S-019 — “What’s New — VEGAS Pro 22.”** MAGIX, versioned official Help, https://help.magix-hub.com/video/vegas/22/en/content/topics/1-before/whatsnew.htm . Supports C-017, C-018. **Limit:** historical, not current-support guarantee. Selected because it directly dates VST3/bridge changes.
- **S-020 — “Editing audio effects.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/9-audio/audio_plug-ins.htm . Supports C-006, C-019. **Limit:** legacy `.fxp/.fxb` language does not explain VST3 state.
- **S-021 — “How do I stop my VEGAS from crashing when launching faulting a specific VST plug in?”** Boris FX Support, https://support.borisfx.com/hc/en-us/articles/43369763186189-How-do-I-stop-my-VEGAS-from-crashing-when-launching-faulting-a-specific-VST-plug-in . Supports C-015, C-016. **Limit:** categorized legacy support; current 2026 update date but no build matrix. Preferred over community workarounds.
- **S-022 — “Applying non-real-time event effects.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/9-audio/nonreal-timefx.htm . Supports C-023. **Limit:** no offline API/tail detail.
- **S-023 — “Render to New Track.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/7-edit/toolmix2trk.htm . Supports C-023. **Limit:** not a reversible plugin freeze object.
- **S-024 — “Working with projects.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/3-projects/projects.htm . Supports C-006, C-033. **Limit:** no binary schema/missing dependency detail.
- **S-025 — “Advanced Save — Live Save & Automatic Backups.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/3-projects/advancedsave.htm . Supports C-024. **Limit:** atomicity/corrupt-file behavior omitted.
- **S-026 — “Archiving projects.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/3-projects/archivingprojects.htm . Supports C-024, C-033. **Limit:** archive format internals omitted.
- **S-027 — “Importing and exporting projects.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/3-projects/importing_and_exporting_projects.htm . Supports C-025. **Limit:** no fidelity matrix.
- **S-028 — “Edit Decision Lists.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/3-projects/edl.htm . Supports C-025. **Limit:** only EDL-specific loss model.
- **S-029 — “Using Scripting.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/11-autoscript/scripting_vegas.htm . Supports C-026. **Limit:** linked API summary rendered empty; security warning is authoritative.
- **S-030 — “MIDI Tab.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/9-audio/midi_preferences.htm . Supports C-021, C-036. **Limit:** absence of note sequencing is bounded to current docs.
- **S-031 — “Generate MIDI Clock.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/9-audio/generatemidiclock.htm . Supports C-021, C-036. **Limit:** sync only.
- **S-032 — “Auto Ducking.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/9-audio/autoducking.htm . Supports C-022, C-037. **Limit:** no plugin-sidechain evidence.
- **S-033 — “Loudness metering and logging.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/9-audio/loudness.htm . Supports C-027. **Limit:** no independent standards conformance test.
- **S-034 — “Rendering Multichannel Audio Files.”** Boris FX Help, https://cdn.borisfx.com/borisfx/Documentation/vegas/2026/en/content/topics/10-export/rendering_multichannel_audio_files.htm . Supports C-027. **Limit:** channel formats are renderer-dependent.
- **S-035 — “Will I lose access to my existing Vegas Pro software or activation key?”** Boris FX Support, https://support.borisfx.com/hc/en-us/articles/45056762014349-Will-I-lose-access-to-my-existing-Vegas-Pro-software-or-activation-key . Supports C-001, C-004. **Limit:** transition/support statement, not full EULA.
- **S-036 — “Will pricing or licensing options change?”** Boris FX Support, https://support.borisfx.com/hc/en-us/articles/44650929665549-Will-pricing-or-licensing-options-change . Supports C-004, C-034. **Limit:** no entitlement table/prices retained.
- **S-037 — “How do I install the Boris FX applications that come with Vegas Pro Plus 2026 and Vegas Pro Ultimate 2026?”** Boris FX Support, https://support.borisfx.com/hc/en-us/articles/46925662192653-How-do-I-install-the-Boris-FX-applications-that-come-with-Vegas-Pro-Plus-2026-and-Vegas-Pro-Ultimate-2026 . Supports C-004, C-034. **Limit:** installer workflow, not edition comparison.
- **S-038 — “VST 3 Licensing.”** Steinberg VST3 Developer Portal, https://steinbergmedia.github.io/vst3_dev_portal/pages/VST+3+Licensing/Index.html . Supports C-029. **Limit:** SDK/trademark facts, not VEGAS implementation rights.
- **S-039 — “VST 2 Discontinued.”** Steinberg Help Center, https://helpcenter.steinberg.de/hc/en-us/articles/4409561018258-VST-2-Discontinued . Supports C-029. **Limit:** dated 2022 policy statement; no claim about third-party host removal.
- **S-040 — “Vegas creative tools.”** Boris FX current VEGAS landing page, https://www.vegascreativesoftware.com/ . Supports C-030. **Limit:** short product positioning, not feature comparison. Preferred over third-party category labels.

**Negative/access results retained:** legacy VEGAS specifications/features/pricing paths repeatedly redirected to a generic migrated page or returned 404; guessed MAGIX Help index paths returned 404 before exact topic paths were discovered; current signal-flow content was image-only without usable text; current scripting API summary rendered empty; general web search endpoints rate-limited/challenged; vendor support searches found no audio-plugin cache/blacklist or missing-plugin-placeholder article. These failures constrain claims rather than implying non-support.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods/blocker | Decision impact | Safest next probe / fixture | Required access; owner |
| --- | --- | --- | --- | --- |
| Current explicit VST2/VST3 matrix | 2026 Help says generic VST; versioned v20/v22 names both | Migration/support scope | On disposable Windows 11 VM, scan one signed minimal VST2 effect and one VST3 effect in build 189 | Licensed build + legal fixtures; unassigned |
| Scanner cache, identity, duplicates, blacklist | Current Help/TOC/full-text and support API searched; only folders/checks/all-format bypass found | Startup reliability and migration | Snapshot profile before/after scan; duplicate class IDs/paths; crash scanner fixture; inspect only user-created files/logs | Disposable VM; unassigned |
| Runtime process/isolation/crash recovery | No public process-boundary docs; startup crash article is ambiguous | Security and availability | Observe process tree; crash one disposable plugin instance during playback/render; check host/project survival | Safe custom fixture; unassigned |
| Sidechain and multi-I/O | Bus/send docs and Auto Ducking reviewed; no plugin aux/multibus contract | Modern dynamics/instrument workflows | VST3 effect with one main + one aux input; multichannel/multi-output fixture | Plugin test suite; unassigned |
| MIDI/event I/O, instruments, MPE/MIDI2 | MIDI docs cover control/sync only | DAW completeness | Try VST3 instrument/event-input fixture and inspect routing UI | Disposable VM/MIDI fixture; unassigned |
| Automation sample accuracy and parameter identity | Envelope/interpolation docs omit timing/IDs/ranges | Recall and sound correctness | Record/read stepped automation around blocks; change plugin parameter list across versions | Instrumented plugin; unassigned |
| Latency/tail/dynamic I/O/offline flags | Only non-in-place PDC and bounce documented | Phase correctness/render truncation | Impulse tests with variable reported latency/tail; change I/O while transport stopped/running; log process/offline callbacks | Instrumented plugin; unassigned |
| State/preset/missing-plugin round trip | `.veg` saves effects/parameters and `.fxp/.fxb`; no placeholder docs/support result | Project durability | Save unique opaque state + external asset; remove plugin; open/save/reinstall; compare bytes/behavior | Test plugin and copied project; unassigned |
| Custom UI/DPI/headless/accessibility | Only resizable host effects window documented | Cross-platform UI contract/accessibility | Generic/custom editor fixtures at DPI scales; keyboard/screen-reader audit; offline render with editor closed | Windows accessibility tools; unassigned |
| Edition parity | Installer names tiers; no audio comparison retained | Procurement/test coverage | Obtain vendor comparison table or test same project in each edition | Three entitlements/vendor response; unassigned |
| Missing-media relink and corrupt-project salvage | Project/open/archive/backups reviewed; behavior absent | Recovery design | Move/rename media tree; corrupt copied `.veg`; record prompts and restore outcomes | Disposable copies only; unassigned |
| Internal mix precision/block/scheduler | Public docs stop at controls/thread counts | Engine architecture | Vendor engineering disclosure or numeric null/denormal/block-change tests | Test build/fixtures; unassigned |

## 24. Curiosity pass and stop decision

Scores are 1–5 (higher is more); cost is 1–5 (higher is more expensive).

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| VST2/VST3 introduction and bridge history | 5 | 5 | 4 | 2 | **PURSUED.** Official v22 Help resolved VST3 beta/non-beta and 32-bit bridge history. [C-017] |
| Current scanner cache/blacklist | 5 | 4 | 4 | 3 | Documentary searches pursued after top thread; no substantive source. Dynamic probe deferred. `CURIOSITY_NO_GO` for more web search due saturation. |
| Plugin sidechain/multi-I/O | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: only a runtime fixture can discriminate; web non-mention has nonpositive marginal value. |
| Missing-plugin state retention | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO`: controlled remove/reopen/reinstall probe required. |
| Exact Core Engine internals | 4 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: proprietary and no public engineering source found; speculation rejected. |
| Exhaustive sibling-product comparison | 2 | 2 | 1 | 3 | `CURIOSITY_NO_GO`: boundaries already sufficient and sibling dossiers are independently owned. |
| Historical release chronology beyond audio origin | 2 | 1 | 2 | 3 | `CURIOSITY_NO_GO`: cannot change current architecture decision. |
| Accessibility dynamic audit | 4 | 4 | 4 | 5 | `CURIOSITY_NO_GO` in documentary wave; retained as later probe. |

**Gaps/contradictions at stop:** the migrated product page’s “23” text conflicts with current 2026 Help but transition support and build releases resolve product identity; current VST wording remains less specific than v22; no source resolves runtime isolation, advanced I/O, or missing-plugin state.

**Stop decision:** stop for **coverage plus documentary saturation**. Every required section and plugin row is complete; current official Help, versioned Help, support KB/API, release topics, format-owner licensing, and a primary historical release have been covered. Additional public searches produced redirects, 404s, challenges, duplicates, or non-material results. The remaining questions require controlled fixtures or vendor disclosure, so another documentary pass has nonpositive marginal evidence. No access control was bypassed and no product binary was run.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added only `research/daw-landscape/dossiers/vegas-pro.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0 pins 2026.0.3 build 189, Windows 11, tiers, licensing, and sibling exclusions.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and subsections 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive sections cite C-IDs; Section 21 classifies them.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Section 21 and Section 23 provide resolution/next probes.
- [x] **Every required plugin-format row is present.** All 13 contract rows appear in Section 11.1 with no blank cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover scan, runtime, buses, automation, state, UI, diagnostics, and failure.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Claim labels and matrix notes distinguish them.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 includes product/VST constraints and no legal advice.
- [x] **Bibliography records source rationale and limitations.** Section 22 provides passage scope, limitations, and selection rationale for S-001–S-040.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24 record pursued/rejected threads and scores.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary public sources only; no installer/plugin/product execution.

**Checks performed:** verified all template headings, all plugin rows, all C-ID references against the claims register, all S-IDs against the source ledger, explicit DAW-adjacent scope, explicit unknowns/probes, curiosity ranking, and stop rule.

**Unresolved blockers:** proprietary runtime internals; current explicit VST2/VST3 edition matrix; sidechain/multi-I/O/MIDI-event contract; cache/quarantine; state/missing-plugin behavior; accessibility. These need vendor disclosure or disposable dynamic probes.

**Workspace handling:** no git staging/commit; no shared or sibling dossier edits; pre-existing workspace changes were left untouched.
