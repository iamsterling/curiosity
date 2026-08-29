# Blackmagic Fairlight DAW dossier

> Research-only evidence. No design or implementation authority. Public clean-room documentary research; fetched text was treated as untrusted evidence, never as instructions.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Fairlight page and audio system inside DaVinci Resolve |
| Canonical vendor | Blackmagic Design Pty. Ltd. |
| Researcher/session | OpenCode subagent, `ses_fb273c7afffep1rLsniefdG0jL` |
| Owned path | `research/daw-landscape/dossiers/blackmagic-fairlight.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Pinned snapshot | DaVinci Resolve 21; July 2026 Reference Manual. Exact installed point build is `UNKNOWN`. [C-001] [C-041] |
| Editions | DaVinci Resolve (Free) and DaVinci Resolve Studio 21; current advertised Studio price US$295. [C-001] [C-037] |
| Platforms | Current desktop family: macOS, Windows, Linux. Minimum supported app OS releases are `UNKNOWN` because the support-center download data did not render in the documentary client. [C-001] [C-041] |
| Included | Shared Resolve project/timeline boundary; Fairlight editing, recording, mixer, automation, ADR, video sync, immersive delivery, plugins, persistence/collaboration, and control surfaces |
| Excluded | Fairlight Live; historical standalone Fairlight systems; iPad/mobile/web Resolve; exhaustive video/color/Fusion internals; external Fairlight hardware except as an interface/performance boundary; product installation or binary probing |
| Completion | `COMPLETE_WITH_UNKNOWNS` |

The decision is whether Fairlight supplies transferable, publicly evidenced DAW and plugin-host patterns. Sufficient coverage means every template heading and required plugin row has an evidence-backed status or an explicit unknown; it does **not** mean undocumented proprietary internals have been reconstructed.

## 1. Executive summary

Fairlight is not a separate current DAW executable in this scope: Blackmagic documents professional Fairlight audio post, editing, Fusion, and color as pages in one Resolve application, sharing projects, media, and timelines. This unified picture-and-sound boundary, plus project libraries and collaboration, is its clearest differentiator. [C-002] [C-003] [C-030] [C-032]

The publicly described audio model is a linear timeline feeding a high-count track/bus graph. Fairlight Audio Core is vendor-documented to play up to 2,000 tracks with load balancing; FlexBus supports track-to-bus, bus-to-track, and bus-to-bus routing, multiformat paths, per-track automatic delay compensation, automation, ADR, layered takes, loudness/delivery, and Studio immersive formats. The exact process, thread, scheduler, memory, and real-time safety architecture is proprietary and `UNKNOWN`. [C-004] [C-005] [C-007] [C-011] [C-014] [C-025] [C-035]

The current plugin headline is narrower than generic marketing copy: the Resolve 21 manual explicitly names **VST3 effects on macOS and Windows, not Linux**, and unversioned **Audio Units on macOS**. It also documents VSTi live-controller recording, compatible AU/VST sidechains, custom plugin windows, plugin presets, per-channel bypass, startup blacklisting after a loading crash, clip-effect cache/bounce, and plugin automation. It does not identify AUv2 versus AUv3, document VST2, or document any required format beyond VST3/AU/Fairlight FX. [C-016] [C-017] [C-019] [C-022] [C-023] [C-025] [C-026]

The largest plugin unknowns are runtime isolation, sandboxing, architecture bridging, signing checks, duplicate identity, scan cache/rescan semantics, parameter/state schemas, latency/tail reporting, multi-output instruments, missing-plugin placeholders, migration, UI scaling/headless behavior, and Free/Studio third-party-host parity. “Supports VST3” must not be interpreted as a complete host contract. [C-018] [C-020] [C-021] [C-024] [C-027]

**Overall confidence:** high for current identity, visible workflows, VST3 platform support, routing, automation, AAF boundaries, and project libraries; medium for edition-wide interpretations; low for undocumented plugin and engine internals.

## 2. Product identity, history, and market position

Blackmagic currently presents DaVinci Resolve 21 as a maintained desktop post-production application for Mac, Windows, and Linux, with Free and Studio editions. The July 2026 Reference Manual describes Fairlight audio post as part of the same application used for editing, compositing, grading, mixing, and mastering. [C-001] [C-002]

The Fairlight page is positioned for audio post-production: dialog editing/replacement, sound repair, recording, mixing, surround/immersive mastering, picture synchronization, and large film/television projects. That is a vendor positioning statement, not independent market-share or performance measurement. [C-002] [C-004] [C-011] [C-035]

Historical standalone Fairlight lineage and acquisition chronology were not necessary to the architecture decision and were not pursued. The current product boundary, not historical implementation continuity, controls this dossier.

## 3. Workflow and conceptual model

The core user model is a Resolve **project** containing links to media plus one or more **timelines**. The same Media Pool/timeline is exposed through specialized pages; the Fairlight page presents the selected timeline as an audio-centric, multichannel linear timeline and mixer. Projects may be held in local, network, or cloud project libraries. [C-003] [C-030]

Fairlight tracks contain clips and channel lanes; layered editing places overlapping takes on one track, with the top layer audible, which supports non-destructive comping before an explicit flatten. Resolve 21 adds collapsible audio-track folders for timeline organization. [C-009]

The documented mental model is audio-for-picture/post rather than pattern sequencing or notation. VSTi instruments may be performed live and recorded to audio, but Resolve explicitly lacks MIDI sequencing. Notation, piano roll, clip launching, tracker patterns, and modular user graphs are not documented as Fairlight models. [C-012] [C-013]

## 4. Publicly documented architecture

Blackmagic names **Fairlight Audio Core** as the engine and says it uses intelligent load balancing; the product page says workloads may be distributed over processor cores, threads, and optional audio hardware, with an example of accelerator mixing and CPU plugin processing. These are vendor-documented functional boundaries, not a disclosed scheduler. [C-004]

Fairlight remains inside the Resolve project/application boundary. Page changes do not imply project interchange, and the Reference Manual calls the pages one application and the same tool. Dynamic Project Switching can keep multiple projects in RAM, but this does not establish separate Fairlight processes. [C-002] [C-003]

**UNKNOWN:** executable/service decomposition, audio-thread count, graph compilation, worker scheduling, lock-free strategy, plugin-process topology, IPC, watchdogs, memory ownership, crash recovery internals, and whether optional hardware changes the host/plugin process boundary. Public sources do not safely discriminate among plausible implementations. [C-005] [C-021]

## 5. Audio engine

- Project audio sample rate defaults to 48 kHz and can be set to 96 or 192 kHz before the first timeline; it then locks. Differently rated source audio is resampled to the timeline rate. A separate pre-timeline setting enables 32-bit floating-point **recording**; it does not document the engine's internal mix precision. [C-006]
- Fairlight Audio Core is documented for simultaneous playback of up to 2,000 tracks and load balancing. The product page qualifies the largest configuration with optional Windows Fairlight acceleration hardware, while also using broader “almost unlimited” language; these are not independent benchmark results. [C-004] [C-042]
- Automatic delay compensation is on by default and can be toggled per track. The mechanism by which a plugin reports latency, dynamic latency changes, and whether every render path shares identical compensation are `UNKNOWN`. [C-025]
- Processor-heavy clip effects can be cached non-destructively and automatically recached after parameter changes; clips can also be exported/bounced with effects to a new top layer while retaining the original below. [C-025]
- Resolve can prioritize uninterrupted audio by dropping video frames when processing is constrained. Buffer-size negotiation, block subdivision, denormal policy, plugin oversampling, tail handling, dropout concealment, and deterministic offline scheduling are `UNKNOWN`. [C-043]

## 6. Tracks, timeline, clips, and editing

Fairlight exposes mono, stereo, surround, immersive, Ambisonic, and adaptive multichannel tracks. There is a documentation conflict: the current manual describes Adaptive tracks as 1–24 channels in one Fairlight UI passage, while the current product page advertises adaptive tracks up to 36 channels. The applicable object/version limit is therefore unresolved. [C-008]

Editing includes clip moves/trims, fades/crossfades, subframe/sample-level work, layered takes and flattening, automation-follow-edit, elastic-wave retiming, clip gain/pan/pitch/EQ, and sample waveform redraw with reset. Elastic-wave changes made in Fairlight appear as Edit-page retimes, but the manual warns the reverse mapping is not complete. [C-009] [C-010]

Folders in Resolve 21 collapse groups of audio tracks into a composite display. Timelines are first-class Media Pool objects and retain their own view settings. [C-003] [C-009]

## 7. MIDI, sequencing, notation, and expression

VSTi instruments can receive a selected MIDI controller/channel and be played live. Their resulting audio is patched through a track direct output and recorded onto another audio track. Resolve explicitly says it has no MIDI sequencing functionality. [C-012] [C-023]

Fairlight can chase MIDI Time Code from another application/device and can generate audio timecode to an output. This is synchronization, not note sequencing. [C-047]

`UNKNOWN`: piano roll, editable MIDI clips/events, SysEx, MIDI clock, MIDI 2.0, MPE/per-note expression, note-expression delivery to VST3, sample-offset event timing, notation/score, multi-output instrument exposure, and persistent instrument MIDI tracks. Exact-term searches of the current manual found no MIDI 2.0 or word-bounded MPE entries. [C-013] [C-024]

## 8. Routing, mixer, automation, and control

FlexBus supports tracks into submix/main buses, bus-to-bus, bus-to-track, and track-to-bus paths. The manual documents up to ten bus outputs plus sends to a further ten buses per track, and bus cascades up to six layers; the live product page advertises a different “20 sets/60 destinations” framing. These may describe different routing controls or revisions and must be qualified dynamically. [C-007] [C-042]

Mixer channel strips expose inputs, routing, faders, stereo/3D panning, EQ, dynamics, effects, VCAs, sends, and bus outputs. Compatible Fairlight FX, AU, and VST plugins may use a track or bus as a sidechain source. [C-022] [C-023]

Automation is vector-based and supports drawn/keyframed or recorded changes, switched controls, preview, touch/latch/write-style modes, and clip/track/bus parameters. Fairlight audio keyframes are documented as sample-accurate and replay correctly on other pages. Because plugin controls are separately documented as automatable through the same track parameter menus, sample-accurate plugin-parameter placement is a bounded inference, not an explicit statement about every plugin callback or recorded gesture. [C-014] [C-015]

Blackmagic Fairlight consoles are purpose-built surfaces. Third-party HUI/MCU panels are documented for up to eight faders with transport, fader/pan, bank, automation, marker, edit, and monitoring controls. No OSC or general MIDI-learn API for Fairlight was established. [C-036] [C-045]

## 9. Recording, comping, and media handling

Fairlight records voice-over or multitrack sources after input-to-track patching and arming. Additional recordings can become layers on the same track; layered comping preserves alternatives until flatten/export choices are made. [C-009] [C-011]

The ADR panel provides cue lists, character/text/timecode data, CSV import/export, pre/post-roll, guide and record tracks, audible beeps, onscreen countdown/text/streamers, rehearsal/record controls, layered takes, ratings, and Studio-only AI cue creation. [C-011]

Documented audio media include WAVE/BWF, AIFF, MP3, AAC/M4A, macOS CAF, AC-3 containers, and platform-qualified Enhanced AC-3; the manual lists 32 through 192 kHz compatible source rates. Export Audio Files offers format/rate/bit-depth, interleaved or multi-mono, clip processing, iXML, and normalization choices. [C-035]

External audio processes receive a bounced copy; Resolve detects the changed file and imports it as a new layer above the original. This is a file-based handoff, not plugin hosting. [C-028]

## 10. Instruments, effects, content, and native devices

Fairlight FX are Resolve-native audio plugins on macOS, Windows, and Linux. The current manual distinguishes fixed-position Track FX from insert effects and documents EQ/dynamics, repair, metering, delay/reverb, Foley Sampler, Chain FX, and other processors. Several AI Track FX and the Foley Sampler/immersive toolset are Studio-qualified. [C-029]

Fairlight's Presets Library stores individual Fairlight FX/AU/VST plugin presets, channel/bus presets, and selected Fairlight configuration state. Resolve 21 Chain FX can hold up to six effects with customized settings and may itself be combined in longer channel chains. [C-026] [C-029]

There is no public authoring SDK for creating new Fairlight FX in the retained sources. Native effect internals, modulation architecture, content package format, and preset serialization schema are proprietary/`UNKNOWN`. [C-005] [C-027]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means no current positive/negative Resolve 21 contract was found; it does not mean “unsupported.” Mobile/web is outside this desktop Fairlight dossier.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | NOT_APPLICABLE:desktop scope | Current manual names VST3, never VST2; Free/Studio parity not explicit | Do not infer rejection from omission | [C-017] [C-018]; S-003 |
| VST3 | DOCUMENTED:hosted | DOCUMENTED:hosted | DOCUMENTED:not available | NOT_APPLICABLE:desktop scope | Resolve 21 manual; edition phrased generically | Effects documented; VSTi workflow also documented | [C-016] [C-018]; S-003 |
| AUv2 | UNKNOWN:manual says unversioned AU | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:desktop scope | Resolve 21; edition parity unknown | Cannot map generic “Audio Units” to AUv2 without qualification | [C-017] [C-018] [C-040]; S-003, S-007 |
| AUv3 | UNKNOWN:not identified by Blackmagic | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:desktop scope | Apple defines AU app extensions; Resolve 21 does not name them | No current positive host evidence | [C-017] [C-040]; S-003, S-007 |
| AAX | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | NOT_APPLICABLE:desktop scope | Resolve 21 | Pro Tools AAF exchange is not AAX hosting | [C-017] [C-034]; S-003 |
| CLAP | UNKNOWN:no plugin-format evidence | UNKNOWN:no plugin-format evidence | UNKNOWN:no plugin-format evidence | NOT_APPLICABLE:desktop scope | Resolve 21 | Manual “clap” hits are clapperboard prose, not CLAP | [C-017]; S-003 |
| LV2 | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | NOT_APPLICABLE:desktop scope | Resolve 21 | Linux Fairlight FX do not establish LV2 | [C-017]; S-003 |
| LADSPA | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | NOT_APPLICABLE:desktop scope | Resolve 21 | No positive evidence | [C-017]; S-003 |
| DSSI | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | NOT_APPLICABLE:desktop scope | Resolve 21 | No positive evidence | [C-017]; S-003 |
| JSFX | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | NOT_APPLICABLE:desktop scope | Resolve 21 | No positive evidence | [C-017]; S-003 |
| DirectX/DXi | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | NOT_APPLICABLE:desktop scope | Resolve 21 | No positive evidence | [C-017]; S-003 |
| Rack Extension | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | UNKNOWN:no Resolve 21 evidence | NOT_APPLICABLE:desktop scope | Resolve 21 | No positive evidence | [C-017]; S-003 |
| Product-native/other | DOCUMENTED:Fairlight FX | DOCUMENTED:Fairlight FX | DOCUMENTED:Fairlight FX | NOT_APPLICABLE:desktop scope | Resolve 21; some individual FX Studio-only | Native Fairlight FX are not a documented third-party authoring format | [C-029]; S-003, S-008 |

### 11.2 Discovery, scanning, validation, and recovery

System Preferences provides a list where users can manually add/remove VST directories. Available VST and AU plugins appear with enable checkboxes and editable mixer categories. A VST that crashes while being loaded at startup is automatically disabled and shown as “blacklisted”; the user can re-enable it. [C-019]

The manual does not document standard/default VST3 paths, AU validation, an explicit rescan command, scan-cache storage/invalidation, duplicate UID resolution, version preference, signature/notarization checks, quarantine policy, scan logs, timeout policy, or safe-mode recovery. Exact “rescan” hits in the manual concern film/Fusion media, not audio plugins. [C-020]

“Blacklisted after startup loading failure” is not evidence of out-of-process scanning or runtime crash containment. [C-021] [C-044]

### 11.3 Runtime isolation and compatibility

`UNKNOWN`: whether third-party audio plugins run in the Resolve process, a scanner process, or per-plugin processes; sandbox profile; watchdog; memory/CPU quotas; crash restart; architecture bridging (Intel/Apple Silicon/Windows ARM); Rosetta use; 32-bit support; code-signing enforcement; and compatibility modes. No safe binary probe was run. [C-021]

The optional Fairlight accelerator is described as capable of mixing while CPU resources run plugins, but that example does not establish plugin process isolation. [C-004] [C-045]

### 11.4 Host/plugin processing contract

- VST effects are documented from mono through 7.1 “and beyond,” with compatible VST/AU Ambisonic effects; insertion of a stereo VST on certain wider Link Groups allocates its left/right outputs to the corresponding channels. [C-023]
- Compatible Fairlight FX, AU, and VST plugins may take a track or bus sidechain source. [C-023]
- VSTi can accept a chosen MIDI controller/channel and produce audio that is patched/recorded to another track; Resolve does not provide MIDI sequencing. [C-012] [C-023]
- Clip, track, and bus insert contexts are documented; bus mastering inserts and ordered chains are supported. [C-022]
- Per-track ADC and user-visible cache/bounce/render workflows are documented, but plugin latency/tail APIs, faster-than-real-time process signaling, suspend rules, dynamic I/O, auxiliary event buses, note expression, and multi-output instrument exposure are not. [C-024] [C-025]
- Steinberg documents VST3 offline-context and VST2-to-VST3 compatibility mechanisms at the format level; Resolve adoption is `UNKNOWN`. [C-039]

### 11.5 Parameters, automation, state, presets, and project recall

Applied effects can be enabled/disabled, reordered, removed, reset, copied with settings, and exposed to Fairlight automation. Whole chains with parameter values can be copied, and Fairlight's Presets Library has a plugin-preset category for Fairlight FX, AU, and VST. [C-022] [C-026]

Audio keyframe placement is sample-accurate; applying that statement to every third-party plugin parameter callback is an inference because the manual does not document event delivery granularity. [C-014] [C-015]

`UNKNOWN`: stable parameter IDs, normalized/plain ranges, display text, gesture boundaries, state chunk size/format, external asset bookmarks, project-level plugin state serialization, preset portability, missing-plugin placeholders, replacement matching, VST2-to-VST3 migration, state recovery after crash, and forward/backward plugin-version migration. The format owner documents possible VST migration hooks, but Blackmagic does not document consuming them. [C-024] [C-027] [C-039]

### 11.6 UI, diagnostics, and failure modes

Nearly all Fairlight FX, VST, and AU plugins are documented as having custom interfaces that Resolve can open from the Inspector/Mixer. The mixer exposes open/enable/replace/delete actions, and System Preferences exposes startup-disabled plugins. [C-019] [C-022]

`UNKNOWN`: native-window versus embedded/remote view ownership, detachment, DPI/HiDPI scaling, resize constraints, keyboard focus, accessibility tree, headless rendering, UI-thread contract, and diagnostic detail beyond the disabled checkbox. Missing-plugin project UX and recovery are also undocumented. [C-020] [C-021] [C-027] [C-044]

## 12. Extensibility and integration

Resolve Studio is documented with Python and Lua scripting, developer APIs, workflow-integration plugins using JavaScript APIs, remote scripting, and encoder/render plugin support. These are application/workflow extension boundaries, not evidence of a Fairlight DSP SDK. [C-044]

Fairlight integration includes external audio-process file handoff, HUI/MCU surfaces, MIDI timecode, Blackmagic consoles, project/timeline interchange, and Blackmagic Cloud/project-server collaboration. [C-028] [C-032] [C-036] [C-045] [C-047]

No retained source established an OSC API, public Fairlight FX authoring SDK, general controller-mapping SDK, or versioned third-party audio-host qualification program. [C-005] [C-043]

## 13. Project format, persistence, interoperability, and collaboration

Resolve uses central **project libraries**, not only arbitrary self-contained project files. Local, network, and Blackmagic Cloud library types are documented; the network Project Server/library material identifies PostgreSQL as its database backend. `.drp` exports exchange project data, while `.dra` archives include the project and linked media in a restorable directory. [C-030] [C-031]

Live Save incrementally saves and is on by default; collaboration forces it on. Project and timeline backups use configurable minute/hour/day retention and restore as independent projects/timelines. Project-library upgrades may be required across major versions and should be backed up first. [C-031]

Multi-user collaboration works through remote/network or cloud project libraries with bin/timeline/clip locking, check-in/refresh behavior, per-user monitoring overrides, cache-format coordination, chat, and cross-platform media/path-mapping requirements. The product page explicitly positions audio engineers as collaborators, but exact concurrent Fairlight edits to the same timeline/object are not separately specified. [C-032] [C-048]

Audio AAF from Pro Tools can import embedded audio and track automation. A dedicated Pro Tools delivery preset exports linked or embedded audio, track/clip volume automation, names/timecode, iXML, and optional reference video. It explicitly does **not** export or bake FairlightFX, EQ, compression, pitch, or elastic-wave effects. Layered Fairlight audio also needs flattening because only the lowest layer is exported in that AAF workflow. [C-033] [C-034]

`UNKNOWN`: native project schema, transactional model, plugin state records, media hash/relink semantics for plugin assets, forward compatibility, missing-plugin placeholders, DAWproject/MusicXML support, and conflict semantics for simultaneous Fairlight automation/plugin edits. [C-027] [C-041]

## 14. Delivery, live, post-production, and specialized workflows

Fairlight's specialty is audio post tied to picture: visible video, audio/video scrollers, frame/subframe sync, MTC/LTC-style synchronization, ADR, AAF handoff, loudness metering, multiformat buses, and simultaneous stem/delivery routing. [C-011] [C-035] [C-046] [C-047]

Studio adds the documented full immersive toolset: 3D channels/buses/panner/space view, Ambisonics up to fifth order, Dolby Atmos/MPEG-H workflows, external RMU configuration, and ADM/IAB/IMF import/export contexts. Dolby Vision trim and encrypted DCP capabilities may require separate licenses, showing that “Studio” does not imply every delivery right is bundled. [C-035] [C-037]

Audio-only delivery can select main/submix/track sources and 16/24/32-bit outputs. Clip exports can include or exclude clip EQ/FX and metadata. Exact third-party plugin callback behavior during offline/faster-than-real-time render remains `UNKNOWN`. [C-024] [C-035]

## 15. Performance, reliability, security, and accessibility

Blackmagic documents high track counts, intelligent load balancing, per-track ADC, audio-prioritized playback under GPU pressure, cache/bounce relief for expensive clip effects, and optional accelerator hardware. These are vendor capabilities, not independently reproduced limits. [C-004] [C-025] [C-042] [C-043]

Plugin startup failures can be auto-disabled and manually re-enabled. This is useful diagnosis but does not establish runtime containment, rollback, or state recovery. [C-019] [C-044]

Project Live Save, versioned backups, timeline backups, archive/restore, and read-only opening provide user-visible recovery boundaries. [C-031]

`UNKNOWN`: audio XRUN counters, per-plugin CPU meters, deterministic performance limits, plugin runtime crash behavior, security sandbox, signature/notarization validation, telemetry specific to plugin scanning, accessibility of plugin windows, screen-reader coverage, localization limits, and rollback of application/project-library upgrades. [C-021] [C-041] [C-043] [C-044]

## 16. Licensing, ecosystem, and implementation constraints

The current site offers DaVinci Resolve 21 Free and advertises Resolve Studio 21 at US$295. Blackmagic pages/manual are copyrighted and all rights reserved; detailed EULA, seat, transfer, activation, and offline-use terms were not exposed in retained public text. “Completely unrestricted” on the Studio marketing page is not treated as legal language. [C-037] [C-038] [C-041]

The current official VST3 SDK `master` license is MIT (2026 copyright). Steinberg separately identifies VST as a trademark and publishes usage guidelines; an SDK code license does not grant a compatibility claim or trademark certification. [C-039]

Apple documents Audio Unit app extensions as a specific macOS/iOS extension model with type, bus, render-resource, optional UI, and sandbox-safety metadata. Resolve only says “Audio Units,” so AU generation and corresponding packaging/signing constraints remain unresolved. [C-040]

The current Resolve manual does not document VST2. No retained official source established VST2 rights within budget, so this dossier gives no legal conclusion about new VST2 implementation or distribution. AAX, CLAP, and other SDK/trademark rights are not reached because current Resolve support was not established. This is not legal advice. [C-017] [C-041]

Clean-room constraint: product names and public contracts are descriptive evidence only. Nothing here grants SDK redistribution, trademark use, certification, binary compatibility, or permission to copy Blackmagic implementation/UI/manual expression.

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **INFERENCE:** one project/timeline shared by picture and audio reduces handoff/conform boundaries and makes audio-to-video automation/ADR direct. Prerequisite: disciplined ownership and collaboration semantics. [C-002] [C-032] [C-046]
- **INFERENCE:** explicit multiformat routing, bus graphs, per-track ADC, layered takes, and multiple delivery buses are strong post-production reference patterns. [C-007] [C-009] [C-025] [C-035]
- **INFERENCE:** visible startup disabling, non-destructive effect caching, and user preset libraries improve recoverability and scaling without disclosing internals. [C-019] [C-025] [C-026]
- **INFERENCE:** local/network/cloud project-library choices and lock-based collaboration make persistence a first-class workflow rather than a late file-share add-on. [C-030] [C-032]

### Liabilities

- **INFERENCE:** third-party format breadth is narrow by current documentation and Linux has no documented VST hosting. Generic AU wording creates a material qualification risk. [C-016] [C-017]
- **INFERENCE:** absent public isolation, scan-cache, state, missing-plugin, and full latency/tail contracts make Fairlight a poor reference for transparent host diagnosability. [C-020] [C-021] [C-024] [C-027]
- **INFERENCE:** AAF drops layered choices and audio effects in important Pro Tools handoffs; “shared project” is safer than assuming project exchange preserves a mix graph. [C-034]
- **INFERENCE:** conflicting product/manual limits (adaptive channels, route destinations, insert/count wording) require versioned qualification fixtures rather than a static marketing matrix. [C-008] [C-042]

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Support | Prerequisites / tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- |
| Picture/audio handoff churn | Shared project and timeline model with task-focused pages | [C-002] [C-003] | Common media identity and undo/ownership model; larger failure domain | CANDIDATE |
| Complex post routing | Typed multichannel tracks plus explicit track/bus graph and route-depth limits | [C-007] [C-008] | Cycle policy, graph validation, latency propagation; terminology must be original | CANDIDATE |
| Take/ADR comping | Overlapping take layers, top-take audition, ratings, explicit flatten | [C-009] [C-011] | Clear export policy; AAF must not silently select a layer | CANDIDATE |
| Automation precision | Track-visible parameter lanes with sample-positioned keyframes and edit-follow rules | [C-014] [C-015] | Separate gesture capture from render scheduling; plugin timing must be qualified | CONDITIONAL |
| Plugin startup failures | Persistent visible disable list with explicit user re-enable | [C-019] | Stable identity, logs, safe scanner; do not call this sandboxing | CANDIDATE |
| Heavy plugin load | Non-destructive cache with automatic invalidation after parameter changes | [C-025] | Dependency hash, atomic cache publication, latency/tail correctness | CANDIDATE |
| Recall across tracks/projects | Typed plugin/channel/bus/configuration preset library | [C-026] | Versioned schema, missing-dependency UX, asset packaging | CANDIDATE |
| Multi-user post | Project server/cloud library plus object locks, local monitoring overrides, refresh/check-in | [C-032] [C-048] | Offline/conflict model and media mapping; lock granularity may impede parallel audio edits | CONDITIONAL |
| Exchange honesty | Explicit per-format export capability/omission report | [C-034] | Must preserve or warn about layers, effects, automation, media | CANDIDATE |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT:** equating “supports VST3” with complete buses, events, latency, state, UI, migration, and crash behavior. The manual proves only named slices of the contract. [C-016] [C-024] [C-027]
- **REJECT:** treating startup blacklisting as runtime sandboxing or crash containment. [C-019] [C-021]
- **REJECT:** silent AAF flattening/effect omission. A new system should provide a preflight manifest and explicit bake/preserve choices. [C-034]
- **REJECT:** irreversible fixed-bus-to-FlexBus migration without a reversible project copy/migration checkpoint. Fairlight documents the one-way conversion; a clean-room design should not reproduce that user risk. [C-007]
- `CURIOSITY_NO_GO`: historical Fairlight lineage/acquisition. Low relevance to the current host contract; reopen only for a separately scoped history decision.
- `CURIOSITY_NO_GO`: exhaustive native FX and hardware SKU/pricing inventory. Interface context is covered; more detail would not change architecture.
- `CURIOSITY_NO_GO`: community crash/compatibility anecdotes. They cannot establish proprietary internals; use only in a later hypothesis-driven fixture plan.
- `CURIOSITY_NO_GO`: support-site private client API reverse engineering. Dynamic page access blocked exact point-release metadata, but the current major/manual snapshot is sufficient.
- `CURIOSITY_NO_GO`: indefinite VST2 licensing search. No positive Resolve 21 VST2 support was established, so format implementation rights do not alter this product dossier.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test / result | Status | Later discriminating probe |
| --- | --- | --- | --- |
| H1 Fairlight is a separate current project/app | Manual says one Resolve application and shared projects/timelines | FALSIFIED [C-002] | Process inspection only if a later runtime-security decision needs it |
| H2 “VST support” includes Linux | Current manual explicitly says VST3 on Mac/Windows, not Linux | FALSIFIED [C-016] | Install-free vendor confirmation; then disposable Linux fixture if changed |
| H3 “Audio Units” proves AUv3 | Blackmagic never identifies AU generation; Apple distinguishes app extensions | NOT ESTABLISHED [C-017] [C-040] | Signed AUv2 and AUv3 canaries on a disposable current macOS host |
| H4 Accepted/scanned VST3 implies full host contract | Many contract dimensions remain undocumented | FALSIFIED AS INFERENCE [C-020] [C-024] | One reference plugin varying buses, state, UI, latency, tail, events, failure |
| H5 Plugin automation is sample-delivered | Plugin parameters are automatable; Fairlight keyframes are sample-positioned, but callback granularity is unstated | INFERENCE ONLY [C-015] | Render an impulse/step canary at non-block-aligned offsets |
| H6 Blacklisting proves out-of-process validation | No process boundary is documented | FALSIFIED AS INFERENCE [C-021] | Safe scanner/runtime crash canaries in disposable hosts |
| H7 AAF preserves the Fairlight mix | Pro Tools export explicitly omits effects; layered export has a lowest-layer constraint | FALSIFIED [C-034] | Round-trip fixture with clips, layers, automation, plugin, sidechain, buses |
| H8 Free and Studio host third-party plugins identically | Hosting prose is generic; parity is not explicit | UNKNOWN [C-018] | Same signed plugin corpus in both editions/builds |
| H9 Missing plugins retain editable placeholders/state | No current manual passage found | UNKNOWN [C-027] | Save, remove plugin, reopen, inspect UI, reinstall, and compare restored state |
| H10 Track ADC proves correct dynamic plugin latency | ADC is documented; reporting/reconfiguration contract is not | UNKNOWN [C-024] [C-025] | Latency-changing plugin and null/impulse tests across live, cache, bounce, deliver |

No binaries, installers, or third-party plugins were executed. “Format accepted,” “scanned,” “instantiated,” and “full contract works” remain deliberately distinct qualification stages.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current pinned family is DaVinci Resolve 21 Free/Studio on Mac, Windows, Linux; manual is July 2026. | Current major, desktop | S-001, S-003, S-004, S-008 | Manual cover/platform welcome plus live product pages | Exact point build/minimum OS unknown |
| C-002 | DOCUMENTED | High | Fairlight audio post, editing, Fusion, and color are combined in one Resolve application/tool. | Resolve 21 | S-001, S-003 | Manual pp.1–2; Fairlight overview | Does not prove one OS process |
| C-003 | DOCUMENTED | High | A project links media and contains one or more timelines shared across pages; multiple projects can be held in RAM via Dynamic Project Switching. | Project/user model | S-003 | pp.29, 77, 94, 3818, 3826 | Native schema unknown |
| C-004 | DOCUMENTED | Medium | Fairlight Audio Core is claimed to load-balance and play up to 2,000 tracks; optional accelerator may mix while CPU handles plugins. | Vendor capability | S-001, S-003 | p.3815 and Audio Core section | Marketing/configuration claim, not independent benchmark |
| C-005 | UNKNOWN | High | Process/thread/scheduler/IPC/realtime-memory architecture is not publicly specified. | Proprietary internals | S-001, S-003 | Searched architecture/process terms; only high-level load balancing found | Requires authorized runtime instrumentation/vendor disclosure |
| C-006 | DOCUMENTED | High | Project rate defaults 48 kHz, can be 96/192 before first timeline, then locks; sources resample; 32-bit-float recording is optional. | Project audio settings | S-003 | p.166 | Does not state internal mix precision |
| C-007 | DOCUMENTED | High | FlexBus supports typed multichannel and track/bus cross-routing; legacy-to-FlexBus conversion is one-way. | Routing | S-001, S-003 | pp.3872–3873 | Destination-count wording conflicts across sources |
| C-008 | DOCUMENTED | Medium | Multichannel/adaptive tracks are supported, but current manual says Adaptive 1–24 while product page says up to 36. | Track channel layout | S-001, S-003 | p.3820 vs Channel Mapping page | Version/context contradiction unresolved |
| C-009 | DOCUMENTED | High | Layered audio supports take comping with top layer audible; flatten is explicit; Resolve 21 adds track folders. | Editing/comping | S-003, S-004 | pp.3825–3826, 3909; What's New | AAF export constraint applies |
| C-010 | DOCUMENTED | High | Fairlight supports clip/waveform/sample editing and elastic retiming; Fairlight retimes map to Edit, not all Edit retimes map back. | Editing | S-001, S-003 | p.4080 and product page | Algorithm internals unknown |
| C-011 | DOCUMENTED | High | Multitrack recording and structured ADR include cue, prompt, streamer, take/rating/layer workflows. | Recording/ADR | S-001, S-003 | pp.3913–3918 | AI cue creation Studio-only |
| C-012 | DOCUMENTED | High | VSTi can be played from MIDI controller and recorded as audio; Resolve has no MIDI sequencing. | Instrument workflow | S-003 | pp.3909–3912 | AU instrument exact workflow not shown |
| C-013 | UNKNOWN | High | MIDI 2.0, MPE, notation, SysEx, piano roll, and note-sequencing contracts are not documented. | MIDI/expression | S-003 | Exact-term/manual searches and explicit no-sequencing statement | Absence is not proof of every unsupported feature |
| C-014 | DOCUMENTED | High | Fairlight audio automation keyframes are sample-accurate; mix automation supports visible/editable curves and recorded modes. | Automation | S-001, S-003 | pp.4052–4055 | Does not state plugin callback timing |
| C-015 | INFERENCE | Medium | Plugin parameter points likely use Fairlight's sample-positioned automation lane because plugins are automatable through track parameter menus. | Plugin automation | S-003 | pp.4053, 4086, 4090 | Alternative: placement is sample-level but delivery is block-quantized |
| C-016 | DOCUMENTED | High | Resolve 21 supports VST3 on macOS/Windows and not Linux; AU is documented on macOS. | Current third-party formats | S-003 | pp.1180, 4082 | AU generation unspecified |
| C-017 | UNKNOWN | High | VST2, AUv2/AUv3 distinction, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DXi, Rack Extension support are not established. | Current format matrix | S-003, S-007 | Exact format searches; CLAP hits were “clap” prose | Omission is not proof of rejection |
| C-018 | UNKNOWN | Medium | Third-party VST3/AU hosting parity between Free and Studio is not explicit. | Editions | S-003, S-008 | Manual hosting prose is edition-generic; Studio differences list native tools | Dynamic comparison needed |
| C-019 | DOCUMENTED | High | Users can add VST directories, enable plugins, assign categories; startup-loading VST crashes cause auto-disable/visible blacklisting/re-enable. | Discovery/recovery | S-003 | pp.107–108 | AU scan/validation specifics absent |
| C-020 | UNKNOWN | High | Scan cache, standard paths, rescan, duplicate identity, validation logs/timeouts, signature checks, and quarantine semantics are undocumented. | Discovery | S-003 | Exact searches; unrelated rescan hits rejected | UI/runtime probe needed |
| C-021 | UNKNOWN | High | Plugin process isolation, sandbox, watchdog, architecture bridge, runtime crash containment, and code-signing policy are undocumented. | Runtime/security | S-003 | Exact searches; unrelated Color “sandbox” rejected | Blacklisting cannot discriminate implementation |
| C-022 | DOCUMENTED | High | Plugins can be inserted on clips/tracks/buses; reordered, opened, disabled/bypassed, replaced, removed, and copied with settings. | User-visible hosting | S-003 | pp.4015–4016, 4083–4087 | Internal lifecycle unknown |
| C-023 | DOCUMENTED | High | VST channel layouts, Ambisonic contexts, compatible AU/VST sidechains, and VSTi controller/audio recording are documented. | I/O contract subset | S-003 | pp.4082, 4086; 3909–3912 | Multi-output/event details absent |
| C-024 | UNKNOWN | High | Multi-output, event buses/expression, parameter metadata, latency/tail reports, dynamic I/O, suspend, and VST3 render-mode signaling are undocumented. | Deep host contract | S-003, S-010 | Exact searches plus format-owner contrast | Requires reference-plugin harness |
| C-025 | DOCUMENTED | High | ADC is on by default/toggleable per track; clip-effect cache is non-destructive and recaches; bounce/export can retain original layer. | Latency/performance | S-003 | pp.3856, 4087–4088 | Plugin latency-report API not stated |
| C-026 | DOCUMENTED | High | Fairlight stores AU/VST/Fairlight plugin presets and can copy chains/settings; Chain FX holds six effects. | Presets/recall | S-003, S-004 | pp.3891–3893, 4016; Resolve 21 What's New | Serialization/portability schema unknown |
| C-027 | UNKNOWN | High | Project plugin-state schema, missing placeholders, assets, replacement/migration, and recovery are undocumented. | Persistence | S-003, S-010 | Missing-plugin/state exact searches; VST format has optional migration mechanisms | Dynamic save/remove/reopen probe needed |
| C-028 | DOCUMENTED | High | External audio processing is a bounced-file handoff reimported to a new layer. | Integration | S-001, S-003 | pp.108, 3969 | Not a live plugin contract |
| C-029 | DOCUMENTED | High | Fairlight FX are native/cross-platform; selected AI/immersive/Foley tools are Studio-qualified. | Native devices/edition | S-003, S-008 | pp.4081, 4089 onward; Studio page | Inventory not exhaustive here |
| C-030 | DOCUMENTED | High | Projects live in local/network/cloud libraries; the network Project Server/library uses PostgreSQL; `.drp` provides project exchange. | Persistence | S-003 | pp.78–88 and Ch.196 | Internal database/schema proprietary |
| C-031 | DOCUMENTED | High | Live Save, project/timeline backups, library backup/upgrade, and `.dra` archive/restore are documented. | Durability | S-003 | pp.86–96 | Forward compatibility limits unspecified |
| C-032 | DOCUMENTED | High | Network/cloud collaboration uses locking, refresh/check-in, chat, monitoring overrides, and shared/project-mapped media. | Collaboration | S-001, S-003, S-008 | pp.4327–4336 and collaboration pages | Fairlight same-object edit granularity unclear |
| C-033 | DOCUMENTED | High | Pro Tools AAF import supports embedded audio and track automation. | Interchange import | S-003 | pp.537, 3865 | Plugin/bus state import not claimed |
| C-034 | DOCUMENTED | High | Pro Tools AAF export carries audio/volume automation/metadata but ignores Fairlight effects; only lowest audio layer exports unless flattened. | Interchange export | S-003 | pp.3826, 4192–4193 | Other AAF profiles differ |
| C-035 | DOCUMENTED | High | Fairlight supports broad audio file/delivery, loudness, buses, and Studio immersive/ADM/IAB/Atmos workflows. | Delivery/post | S-001, S-003, S-008 | pp.3925, 4145 onward and Studio page | Some external licenses apply |
| C-036 | DOCUMENTED | High | HUI/MCU surfaces up to eight faders have a documented Fairlight control subset. | Control surfaces | S-003 | p.4047 | Other protocols/general mapping unknown |
| C-037 | DOCUMENTED | High | Resolve Free is free; Studio is advertised at US$295; some delivery features need separate licenses. | Commercial/edition | S-001, S-008 | Live product pages | Regional/tax/terms may vary |
| C-038 | INFERENCE | High | Resolve is proprietary vendor-distributed software; detailed EULA rights are unknown. | License characterization | S-003, S-008 | Copyright/all-rights-reserved and commercial distribution | “Unrestricted” marketing is not a legal grant |
| C-039 | DOCUMENTED | High | Current VST3 SDK code is MIT; Steinberg documents VST2→VST3 migration and offline-context mechanisms at format level. | Format-owner constraints | S-006, S-009, S-010 | Official SDK/portal | Does not prove Resolve implements mechanisms or grant trademark certification |
| C-040 | DOCUMENTED | High | Apple defines AU app extensions/AUv3 with explicit types, buses, optional UI, render-resource lifecycle, sandboxSafe metadata. | Format-owner contrast | S-007 | Apple archived primary docs | Resolve never identifies this generation |
| C-041 | UNKNOWN | High | Exact Resolve point build, minimum app OS, full EULA, forward project compatibility, and some licensing terms were inaccessible/unpublished in retained text. | Snapshot/legal | S-005, S-008 | Support page rendered placeholders; no installer/EULA executed | Official release readme/EULA would discriminate |
| C-042 | DOCUMENTED | Medium | Product/manual wording conflicts on route/plugin/track limits; limits are configuration/context dependent. | Scale limits | S-001, S-003, S-008 | Six-slot UI vs unlimited FlexBus plugins/480 legacy; route/channel wording differs | Needs versioned runtime matrix |
| C-043 | UNKNOWN | High | Engine buffer/block subdivision, dropout/oversampling policy, XRUN/plugin CPU diagnostics, OSC, accessibility, telemetry, and rollback contracts are not established. | NFR/integration | S-003 | Targeted manual searches | Separate runtime/accessibility/security qualification needed |
| C-044 | INFERENCE | High | Startup blacklisting improves load recovery but proves neither runtime isolation nor complete diagnostics. | Reliability | S-003 | C-019 plus absent architecture detail | Runtime crash can still affect host |
| C-045 | DOCUMENTED | High | Fairlight consoles are software control surfaces; accelerator/I/O hardware is optional context, not a separate dossier product. | Hardware boundary | S-001, S-002, S-003 | Product/tech-spec/control-panel docs | Hardware internals excluded |
| C-046 | DOCUMENTED | High | Fairlight supplies video/audio scrollers and picture-linked post tools. | Video workflow | S-001, S-003 | Fairlight page/manual | Vendor uniqueness claims not adopted |
| C-047 | DOCUMENTED | High | Fairlight chases MTC and can generate timecode audio. | Synchronization | S-003 | pp.3864–3865 | MIDI clock/transport protocol breadth unknown |
| C-048 | DOCUMENTED | High | Collaboration requires remote/cloud library, networking, and shared or path-mapped media; cache formats need cross-OS support. | Collaboration infrastructure | S-003 | pp.4328–4330 | Operational performance not measured |

## 22. Source ledger and adaptive bibliography

All access dates are 2026-08-29. Vendor claims establish documentation, not independently measured behavior.

### S-001 — DaVinci Resolve: Fairlight

- **Publisher / kind:** Blackmagic Design; official current product page.
- **URL:** https://www.blackmagicdesign.com/products/davinciresolve/fairlight
- **Scope / passage:** Resolve 21 product banner; Professional Tools, Audio Core, FlexBus, plugins, ADR, delivery, collaboration, consoles, I/O sections.
- **Supports:** C-001, C-002, C-004, C-007–C-011, C-032, C-035, C-037, C-042, C-045, C-046.
- **Limitations:** marketing language; some scale wording conflicts with the manual; no deep host contract.
- **Selection rationale:** canonical live Fairlight boundary and current edition/platform presentation; preferable to reseller or review summaries.

### S-002 — DaVinci Resolve Technical Specifications

- **Publisher / kind:** Blackmagic Design; official product hardware specifications.
- **URL:** https://www.blackmagicdesign.com/products/davinciresolve/techspecs
- **Scope / passage:** Fairlight Desktop Console, modular console, accelerator and audio-interface entries.
- **Supports:** C-045 and only hardware/interface context.
- **Limitations:** page primarily covers hardware; its OS rows are not used as Resolve application minimums.
- **Selection rationale:** primary evidence for keeping optional surfaces/accelerator outside the software-host boundary.

### S-003 — DaVinci Resolve 21 Reference Manual, July 2026

- **Publisher / kind:** Blackmagic Design; official current reference manual, 4,444 pages.
- **URL:** https://documents.blackmagicdesign.com/UserManuals/DaVinciResolveReferenceManual.pdf?_v=1783666810000
- **Scope / passages:** cover/pp.1–2; Project Management pp.75–96; Audio Plugins Preferences pp.106–108; Fairlight project settings pp.166–167; Fairlight chapters pp.3815–4166; Pro Tools delivery pp.4192–4193; project server/collaboration pp.4323–4336.
- **Supports:** C-001–C-036 and C-038–C-048 as listed in the claims register.
- **Limitations:** vendor documentation, not observed runtime; many internals and failure contracts omitted. Direct web fetch rejected PDF content and the generic reader rejected its size, so the public PDF was downloaded to approved temporary storage and searched page-by-page with macOS PDFKit; only needed passages were extracted.
- **Selection rationale:** most authoritative current versioned source and preferable to the older Resolve 20 training guide or search snippets.

### S-004 — DaVinci Resolve 21: What's New

- **Publisher / kind:** Blackmagic Design; official current feature page.
- **URL:** https://www.blackmagicdesign.com/products/davinciresolve/whatsnew
- **Scope / passage:** Resolve 21 banner and Fairlight folders, 6-band clip EQ, EQ/Level Matcher, Chain FX.
- **Supports:** C-001, C-009, C-026.
- **Limitations:** feature marketing, no ABI or edition-parity detail.
- **Selection rationale:** version-specific confirmation of features added in current major release.

### S-005 — Blackmagic Support Center: DaVinci Resolve and Fairlight Live

- **Publisher / kind:** Blackmagic Design; official support/download portal.
- **URL:** https://www.blackmagicdesign.com/support/family/davinci-resolve-and-fusion
- **Scope / passage:** support family and placeholder download/support-note containers.
- **Supports:** C-041 negative access result.
- **Limitations:** update list rendered client-side and did not appear in fetched text; no point version or app OS minimum retained.
- **Selection rationale:** canonical place for release metadata; retained to make the access limitation and negative result visible.

### S-006 — VST3 SDK `LICENSE.txt`

- **Publisher / kind:** Steinberg Media Technologies GmbH; official SDK repository license.
- **URL:** https://raw.githubusercontent.com/steinbergmedia/vst3sdk/master/LICENSE.txt
- **Scope / passage:** 2026 copyright and MIT License grant/conditions/disclaimer.
- **Supports:** C-039.
- **Limitations:** mutable `master` URL; code license only, not trademark/certification; no Resolve behavior.
- **Selection rationale:** primary format-owner legal text, preferable to third-party summaries.

### S-007 — App Extension Programming Guide: Audio Unit

- **Publisher / kind:** Apple; official archived developer documentation (updated 2017-10-19).
- **URL:** https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/AudioUnit.html
- **Scope / passage:** Audio Unit app extension architecture, types, optional UI, platform availability, bus/render-resource APIs, `sandboxSafe` metadata.
- **Supports:** C-017, C-040.
- **Limitations:** archived format documentation, not a Resolve support statement; current JavaScript Audio Unit page yielded blank text.
- **Selection rationale:** primary source that prevents incorrectly equating generic “Audio Units” with AUv3.

### S-008 — DaVinci Resolve Studio

- **Publisher / kind:** Blackmagic Design; official current edition page.
- **URL:** https://www.blackmagicdesign.com/products/davinciresolve/studio
- **Scope / passage:** Free/Studio comparison, US$295 price, immersive audio, AI Fairlight tools, scripting/workflow plugins, separate delivery-license notes.
- **Supports:** C-001, C-018, C-029, C-032, C-035, C-037, C-038, C-041.
- **Limitations:** marketing page, not EULA; “unrestricted” not treated literally.
- **Selection rationale:** canonical edition differentiation and current pricing.

### S-009 — VST 3 Developer Portal

- **Publisher / kind:** Steinberg Media Technologies GmbH; official 2026 developer portal.
- **URL:** https://steinbergmedia.github.io/vst3_dev_portal/
- **Scope / passage:** VST3 host/plugin purpose, licensing and usage-guideline links, current developer scope.
- **Supports:** C-039.
- **Limitations:** format-owner material only; does not prove Resolve conformance.
- **Selection rationale:** current official context for the SDK license and trademark separation.

### S-010 — VST2-to-VST3 migration and compatibility guidance

- **Publisher / kind:** Steinberg Media Technologies GmbH; official VST3 developer guidance.
- **URLs:** https://steinbergmedia.github.io/vst3_dev_portal/pages/Tutorials/Guideline+for+VST3+replacing+VST2.html and https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Compatibility+with+VST+2.x+or+VST+1.html
- **Scope / passage:** UID replacement, state helpers, parameter-ID mapping, compatibility declarations, and faster-than-real-time offline context.
- **Supports:** C-024, C-027, C-039.
- **Limitations:** describes format/plugin mechanisms; Resolve implementation is unknown.
- **Selection rationale:** primary format-origin evidence for migration/offline concepts, preferable to assuming host behavior from the VST3 logo.

**Not retained as evidence:** web-search snippets (discovery only); the Resolve 20 Fairlight training PDF (older, web fetch rejected PDF and local generic reader exceeded size limit); DuckDuckGo challenge page; community forum posts; reseller/review pages.

## 23. Unknowns and next discriminating probes

| Unknown claim | Attempted method / blocker | Decision impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| C-041 exact point build/minimum OS | Official support route rendered placeholders; private API not pursued | Snapshot reproducibility | Obtain official Resolve 21 release readme/support note URL without installer | Unassigned |
| C-018 Free/Studio host parity | Manual speaks generically; edition page lists native extras only | Product/edition matrix | Same signed VST3/AU corpus in disposable Free and Studio installs | Unassigned |
| C-017 AUv2 vs AUv3 | Exact current-manual searches; Apple format contrast | macOS compatibility | Minimal signed AUv2 and AUv3 effect/instrument canaries | Unassigned |
| C-020 scan/cache/identity | Preferences documentation only; no cache/rescan text | Startup reliability, duplicate handling | Controlled plugin directories with duplicates/version changes plus UI/log capture | Unassigned |
| C-021 runtime isolation/bridging | No process/sandbox/bridge documentation; no binaries run | Security and crash domain | Disposable host with process observation and safe load/runtime crash canaries | Unassigned |
| C-024 side buses/multi-output/events | Only simple sidechain/VSTi workflow documented | Instruments and modern expression | Reference VST3 exposing aux input, multiple outputs, MIDI/event buses, MPE/note expression | Unassigned |
| C-024 latency/tail/dynamic I/O | ADC UI documented, host callbacks absent | Timing/render correctness | Impulse/null canary with runtime latency changes, tail, I/O restart across live/cache/bounce/deliver | Unassigned |
| C-015 automation delivery granularity | Sample-positioned lanes documented, callback timing absent | Automation architecture | Non-block-aligned step/impulse render and event log from reference plugin | Unassigned |
| C-027 state/missing/migration | Manual exact searches negative; VST format hooks only | Project durability | Save/remove/reopen/reinstall/version-swap corpus, compare state and automation | Unassigned |
| C-022 UI scaling/headless | Custom windows documented, ownership/scaling absent | Cross-platform UX/render farm | Resizable/HiDPI/no-UI canaries and headless render where officially supported | Unassigned |
| C-008/C-042 scale-limit conflicts | Product page vs manual terminology differs | Capacity planning | Versioned UI/API qualification for adaptive width, routes, inserts, fixed/FlexBus | Unassigned |
| C-032 Fairlight collaboration granularity | General lock model documented, audio-object cases not | Concurrent editing design | Two clients edit tracks, automation, plugin state, buses in same/different timelines | Unassigned |
| C-034 AAF fidelity beyond stated limits | Manual gives explicit omissions, no round trip run | Interchange | Golden AAF with layers, fades, clip/track automation, buses, effects, metadata | Unassigned |
| C-038/C-041 EULA/activation rights | No public legal text retained; no installer run | Procurement/redistribution | Legal review of official purchase/EULA text; no technical bypass | Unassigned |
| C-043 accessibility/security diagnostics | No dedicated public contract found | NFR acceptance | Separate accessibility audit and threat model in authorized disposable environment | Unassigned |

## 24. Curiosity pass and stop decision

Scores use 0–5 (higher cost is worse).

| Candidate thread | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Current Resolve 21 Reference Manual/plugin chapters | 5 | 5 | 5 | 3 | **Pursued**; resolved primary workflow/host questions |
| Exact automation/ADC/project passages in same manual | 5 | 5 | 3 | 1 | **Pursued**; prevented sample-accuracy and persistence overclaims |
| Blackmagic edition/immersive page | 4 | 4 | 3 | 2 | **Pursued** |
| Apple AUv3 format distinction | 4 | 4 | 3 | 2 | **Pursued**; changed AU matrix to unknown generation |
| Steinberg SDK license/migration guidance | 4 | 3 | 2 | 2 | **Pursued**; separated format capability from host behavior |
| Current point release via support private API | 3 | 2 | 1 | 4 | `CURIOSITY_NO_GO`; major/manual snapshot sufficient |
| Historical Fairlight architecture | 2 | 2 | 3 | 4 | `CURIOSITY_NO_GO`; outside current boundary |
| Community plugin-failure reports | 3 | 2 | 3 | 4 | `CURIOSITY_NO_GO`; cannot prove internals |
| Exhaustive native FX/hardware inventory | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`; no architecture change |
| Further VST2 legal search without positive host evidence | 3 | 2 | 1 | 3 | `CURIOSITY_NO_GO`; nonpositive marginal evidence |

**Gaps after synthesis:** full plugin runtime contract, exact AU generation, Free/Studio parity, point build/minimum OS, native state/missing-plugin behavior, and proprietary engine/process boundaries remain open. **Contradictions retained:** adaptive-channel limit, route-count framing, and “six inserts” versus FlexBus/legacy aggregate plugin limits.

**Stop decision:** `STOP — COVERAGE + SATURATION`. All required headings and plugin rows are complete; the best documentary thread (current manual) was exhausted with targeted negative checks; later primary pages triangulated edition and format-owner boundaries. Additional public-page searching produced repeated omissions or lower-value marketing. The next evidence with positive marginal value is a bounded, disposable interoperability harness, outside this documentary task. Source access limited the exact point release/EULA, but not the main architecture conclusion.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created `research/daw-landscape/dossiers/blackmagic-fairlight.md`; no sibling/shared file was changed by this researcher.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0 pins Resolve 21 / July 2026 / desktop Mac-Windows-Linux and exclusions.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all 11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive factual prose cites C-IDs; assessments are explicitly labeled inference; claim register supplies classifications.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Section 21 and Section 23 provide sources, attempts, blockers, impact, and probes.
- [x] **Every required plugin-format row is present.** VST2, VST3, AUv2, AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, Rack Extension, product-native/other.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover discovery, recovery, runtime, buses, automation, latency, state, UI, and failures.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Source limitations and classifications are explicit.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 separates product, SDK code license, trademarks, unknown EULA, and no-grant limits.
- [x] **Bibliography records source rationale and limitations.** Section 22 includes title/publisher/URL/kind/scope/date/passages/claims/limits/rationale.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Public documents only; no Resolve/plugin binaries or installers executed; no git write operation used.

**Checks performed:** heading/order audit; required-format row audit; claim/source resolution audit; exact manual term searches (including false-positive review for CLAP/rescan/sandbox/MPE); current-manual metadata check; source-count/rationale audit; read-only `git status` check.

**Concise results:** 10 retained public primary-source entries; 48 classified claims; 13 required plugin rows; 15 consequential unknown/probe entries. `COMPLETE_WITH_UNKNOWNS`.

**Unresolved blockers:** dynamically rendered support downloads prevented exact point-build/minimum-app-OS capture; no public detailed EULA retained; Blackmagic does not publish the deep plugin/runtime/state contract; AU generation is unnamed.

**Workspace integrity:** the pre-write read-only status showed 49 pre-existing entries, including the untracked `research/daw-landscape/` tree and unrelated mobile/vendor changes. They were left untouched. No staging or commit was performed.
