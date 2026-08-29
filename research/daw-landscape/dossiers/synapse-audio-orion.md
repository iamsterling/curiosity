# Synapse Audio Orion / Orion Studio DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** Synapse Audio Orion, including the late “Orion Studio” naming and historical Orion 8/8.5/8.6 line. Earlier Basic, Pro, and Platinum editions are lineage context only; their edition-by-edition feature deltas are excluded because the accessible evidence does not resolve them consistently. [C-001, C-014, C-028]
- **Canonical vendor:** Synapse Audio Software. [C-001]
- **Researcher/session:** subagent in session `ses_fb271e965ffceYm0Bzk3BmZYPc`.
- **Owned path:** `research/daw-landscape/dossiers/synapse-audio-orion.md`.
- **Research date / evidence cutoff:** 2026-08-29 UTC.
- **Version/date scope:** user-visible architecture is primarily Orion 8 documentation from 2011; maintenance endpoint is Orion 8.6, released 2015-10-26. [C-001, C-010, C-014]
- **Platform scope:** Windows only in the retained product evidence. Orion 8 documentation names Windows 98/ME/2000/XP/Vista/7; a separate x64 edition shipped for XP64/Vista 64. Final-version OS qualification beyond those statements is `UNKNOWN`. [C-013, C-026]
- **Editions/bitness:** both 32-bit and 64-bit Orion editions were distributed to customers by 2009; one bundled generator was documented as 32-bit-only in 2011. Cross-bitness plugin bridging is `UNKNOWN`. [C-009, C-013, C-017]
- **Inclusions:** generator/pattern/playlist/mixer model; recording and MIDI; public engine/routing/PDC/render facts; native generators/effects; VST2 and DirectX/DXi hosting; persistence clues; platform, status, and licensing constraints.
- **Exclusions:** binary execution, decompilation, installers, account-gated downloads, non-public documentation, copied UI/manual assets, and undocumented proprietary internals.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. Every required heading and plugin row is present; consequential public-evidence gaps are explicit.
- **Evidence posture:** 12 retained sources; no runtime observations. Search snippets and fetched pages were treated as untrusted evidence rather than instructions.

## 1. Executive summary

Orion is an historically Windows-only, generator-centric DAW. A generator owns or receives patterns; a playlist arranges generator patterns and audio clips; adding a generator creates mixer channels; and the mixer/master layer supplies inserts, sends, effect buses, submix buses, automation, and hardware outputs. This compact object chain is the dossier’s strongest architectural lesson. [C-004, C-005, C-022]

Orion 8 publicly documented automatic plugin delay compensation in mixer and master, 64-bit double-precision mixing, export up to 32-bit/192 kHz with instrument/channel files, templates that included routing and automation, Song Merge, and—by 8.6—playlist track freeze. [C-006, C-007, C-008, C-010]

Third-party hosting was historically broad for its Windows era but narrow by modern standards: VST2 instruments/effects and DirectX effects/DXi instruments were explicitly supported. Effects could be inserts, sends, or master effects; instruments participated in sequencing, mixing, automation, and effects like native generators. The 8.6 notes prove scanning, custom/resizeable GUI handling, VST MIDI-processing compatibility work, and plugin-related failures, but do not document scan paths/cache, quarantine, process isolation, bridging, state chunks, sidechains, multi-output buses, sample-accurate automation, or missing-plugin placeholders. [C-002, C-003, C-011, C-016, C-017, C-018]

Orion 8.6 is the final publicly evidenced release. A contemporaneous secondary source quotes the developer saying development “as it is” would stop beyond 8.6; the vendor’s current catalog omits Orion and legacy routes redirect. The exact end-of-sale/support date remains unknown. [C-014, C-025, C-028]

**Recommendation:** adapt the explicit generator → pattern → playlist → mixer separation and aggregate template/merge idea, but reject legacy ABI coupling and any architecture that lets an untrusted plugin failure become a host-wide failure. Treat engine scheduling, project serialization, and host isolation as unknown rather than reverse-engineering them. [C-008, C-021, C-022, C-023, C-030]

**Confidence:** high for the user-visible Orion 8/8.6 workflow, routing, PDC, render, and named formats; medium for the discontinuation rationale because the developer quotation survives only in a secondary forum; low/unknown for proprietary internals and the complete plugin host contract.

## 2. Product identity, history, and market position

Synapse marketed Orion 8 in 2011 as a “complete virtual studio” combining a pattern-based sequencer, synthesizers/effects, mixing, multitrack audio recording, and a 1 GB content library. The same material priced Orion at USD 249 and targeted music production rather than notation, post-production, or broadcast delivery. [C-001]

The public lineage used Orion, Orion Platinum, and later Orion Studio naming, while historical Basic and Pro pages also existed. Because accessible feature tables are not sufficiently versioned, edition differences other than the documented x86/x64 delivery and one 32-bit-only generator remain `UNKNOWN`. [C-009, C-013, C-028]

An x64 Windows edition was released on 2009-02-02, with registered/new customers receiving both 32- and 64-bit editions. Orion 8 followed in February 2011; Orion 8.6 shipped on 2015-10-26. [C-001, C-010, C-013]

The product is discontinued by strong inference: the developer was contemporaneously quoted as limiting development to 8.6, 8.6 subsequently shipped, and the current vendor catalog no longer lists Orion. This evidence does not establish a precise sales cutoff or guarantee continuing download/support rights. [C-014, C-025, C-028]

## 3. Workflow and conceptual model

The documented mental model is neither a conventional tape-only track list nor a modular patch graph. It is a hierarchy of **generator → patterns → playlist arrangement → mixer/master**. A generator may be a native instrument, hosted instrument, MIDI-out module, or special audio-track generator; its patterns are arranged in the playlist and its outputs feed automatically created mixer channels. [C-004, C-005, C-022]

Patterns can be step-sequenced or edited in a piano roll. The playlist turns patterns from individual generators into a complete song, while a special Audio Track Generator integrates synchronized WAV clips directly into that arrangement. Orion 8 also allowed patterns to be resized/stretched in the playlist. [C-004]

Orion distinguishes pattern events from song events. The 8.6 notes state that song-mode track recording writes into pattern events when track recording is enabled and separately describe corrections to pitch-bend/song-event routing. This indicates two user-visible event scopes, but their internal representation is `UNKNOWN`. [C-027]

Templates and Song Merge create a second composition boundary above individual devices: a template could bundle plugins, MIDI maps, bus routes, inserts, keyboard splits, and automation, while Song Merge could bring a prior track’s patterns, arrangement, mixer/EQ settings, and effects into another project. [C-008, C-023]

## 4. Publicly documented architecture

Public documentation establishes the object relationships and processing features above, but not Orion’s proprietary internal architecture. The process model, audio-thread topology, graph compiler, scheduler, lock strategy, memory ownership, service boundaries, and multicore policy are `UNKNOWN`; no public source code or engineering disclosure was found. [C-015]

A bounded interpretation is that generators were first-class project nodes because they owned/received patterns, caused mixer-channel creation, and could be cloned or merged with arrangement and mixer state. A plausible alternative is that these were only UI-level associations over a different internal graph, so the inference must not be treated as an implementation map. [C-022, C-023]

The x86/x64 product split is documented, but no source shows a bridge/helper process for plugins of the opposite architecture. Running two host editions is not evidence of cross-bitness bridging or sandboxing. [C-013, C-017]

## 5. Audio engine

- **Precision/PDC:** Orion 8 documents 64-bit double-precision mixing and automatic plugin delay compensation in both mixer and master sections. PDC topology, dynamic-latency updates, live-input exceptions, and compensation of external hardware are `UNKNOWN`. [C-006, C-018]
- **Sample rate/export depth:** the official overview advertises WAV export up to 32-bit/192 kHz and the ability to render instruments or channels to multiple WAV files. Internal engine sample format is not thereby proven. [C-007]
- **Buffers:** Orion 8.6 changed streaming and “live” playback to the same buffer size, increasing accuracy and making a prior “Enable accurate VST automation” switch obsolete. The numeric block size, device-period negotiation, and whether automation became sample-accurate remain `UNKNOWN`. [C-010, C-018]
- **Freeze/render:** Orion 8.6 added playlist track freeze with a progress bar. Freeze asset lifecycle, tail capture, real-time versus faster-than-real-time operation, unfreeze semantics, and hosted-plugin offline callbacks are `UNKNOWN`. [C-010]
- **Driver/output layer:** Orion 8 advertised ASIO output and MME/DirectSound-capable soundcards; submix buses could address multiple ASIO outputs when hardware supported them. An 8.6 fix addressed a hang after an ASIO driver problem. [C-002, C-005, C-031]
- **Diagnostics/dropouts:** 8.6 added a crash-report forwarding tool, but no public xrun/dropout meter, engine recovery protocol, watchdog, or deterministic offline-render specification was found. [C-011, C-015]
- **Multicore/oversampling:** `UNKNOWN`; no retained primary source documents scheduler parallelism or host-level oversampling. [C-015]

## 6. Tracks, timeline, clips, and editing

The playlist is the linear song arrangement. It holds generator patterns and audio clips through the Audio Track Generator; Orion 8 added an overview/navigation bar and direct pattern resize/stretch. [C-004]

The piano roll documents note editing, per-note velocity, parameter automation, and unlimited undo/redo; step sequencing remains optional rather than defining all sequencing. [C-004, C-032]

Track freeze was added in 8.6. Playlist zoom was persisted after an 8.6 fix, and pattern sizing/display received several corrections. [C-010, C-012]

Takes, lanes, comping, clip slip editing, ripple modes, transient warping, elastic audio, track grouping, and historical version branches are `UNKNOWN`. “Stretching” playlist patterns should not be conflated with documented audio time-stretching. [C-024]

## 7. MIDI, sequencing, notation, and expression

Orion documents MIDI input, a MIDI Out generator for external gear, MIDI synchronization, an arpeggiator, step sequencing, piano-roll sequencing, parameter automation, variable timebase, groove templates, and note velocity. Internal generators could use built-in microtunings or 12-tone SCALA files. [C-004, C-032]

Native drum generators had their own step sequencers and could also be driven by MIDI, piano roll, or PC keyboard. DrumRack supported GM mapping and drag-and-drop MIDI grooves; Orion 8.6 fixed VST MIDI arpeggiators and expanded “Receive MIDI From Generator” to every MIDI channel. [C-009, C-011]

There is no retained evidence for notation/score editing, MPE, per-note expression beyond velocity, MIDI 2.0, SysEx handling, MTC, or sample-accurate MIDI/event delivery. Those are `UNKNOWN`, not unsupported. [C-018, C-024]

## 8. Routing, mixer, automation, and control

Adding a generator automatically created mixer channels for its outputs. Channels exposed gain, pan, mute/solo, stereo meters, parametric EQ, inserts, and sends; controls could be automated by recording knob movements or editing graphs. [C-005]

The documented master layer supplied master EQ/effects, four effect buses, and eight submix buses; submixes could target multiple ASIO outputs. Orion 8 also documented selectable pan laws, pattern automation of the mixer, automatic PDC, and 64-bit double-precision mixing. [C-005, C-006]

The archived mixer page says two serial channel inserts while the Orion 8 feature page says the revised console “adds an extra insert slot.” Because the pages do not reconcile their update state, the exact Orion 8.6 insert count is `UNKNOWN`; the stable claim is that channel and master insert chains existed. [C-005]

External MIDI hardware could control mixer/master sections. OSC, control-surface scripting, feedback routing, VCA/folder semantics, sidechains, surround/immersive channels, and arbitrary bus graph rules are `UNKNOWN`. [C-005, C-018, C-024]

## 9. Recording, comping, and media handling

Synapse advertised multitrack audio recording. The sequencer documentation describes synchronized playback of prerecorded WAV vocals/instruments using a special Audio Track Generator integrated with the playlist. [C-001, C-004]

The 8.6 notes mention track-record enablement, project-load clearing of track recording flags, 24-bit mono WAV export repair, MIDI-song import repair, and refreshing audio tracks after missing samples were found/collected. These prove some recording, import/export, and relinking workflows but not their complete contract. [C-012, C-027]

Input monitoring, punch/loop recording, take lanes, comping, destructive editing, supported recording formats beyond WAV, metadata, proxies, video, and asset search policy are `UNKNOWN`. [C-024]

## 10. Instruments, effects, content, and native devices

The 2011 Orion overview lists native generators including Pro-9, Toxic, Acoustic Grand, Sampler, Wasp, Toxic III, DrumRack, Monobass, Ultran, Tomcat, Wavefusion, Screamer, Plucked String, MIDI Out, and hosted-plugin generators. It advertised 43 internal effects and a 1 GB library with more than 900 presets/multisamples. [C-009]

Several generators combine sound generation with local sequencing: Pro-9 and DrumRack expose step/velocity sequencing, while all generators can participate in Orion’s shared MIDI/piano-roll/pattern model. The Sampler advertised SoundFont SF2 and Akai S5000/6000 among its import formats. [C-009]

Toxic III was documented as present only in the 32-bit Orion edition, showing that native-device availability could vary with host bitness. The implementation ABI, device SDK, modulation graph, preset schema, resource packaging, and forward migration policy are `UNKNOWN`. [C-009, C-017]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` in non-Windows columns means no Orion application build was documented for that platform in the reviewed historical scope; it does not characterize the format generally. [C-026, C-029]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE:no Orion macOS build documented | DOCUMENTED | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | Orion 8 official 2011 matrix; Orion 8.6 notes say “VST” without changing format generation | Instruments and effects; deep contract only partial | C-002, C-003, C-011; S-003, S-004, S-005, S-007 |
| VST3 | NOT_APPLICABLE:no Orion macOS build documented | UNKNOWN | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | No retained Orion source names VST3 | Absence from a VST2-era matrix is not proof of rejection | C-029; S-003, S-005 |
| AUv2 | NOT_APPLICABLE:no Orion macOS build documented | UNKNOWN | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | No retained Orion source names AUv2 hosting | Historical Windows-only scope | C-026, C-029; S-003, S-005 |
| AUv3 | NOT_APPLICABLE:no Orion macOS build documented | UNKNOWN | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | No retained Orion source names AUv3 hosting | Historical Windows-only scope | C-026, C-029; S-003, S-005 |
| AAX | NOT_APPLICABLE:no Orion macOS build documented | UNKNOWN | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | No retained Orion source names AAX | Exact host support unknown | C-029; S-003, S-005 |
| CLAP | NOT_APPLICABLE:no Orion macOS build documented | UNKNOWN | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | No retained Orion source names CLAP | Exact host support unknown | C-029; S-003, S-005 |
| LV2 | NOT_APPLICABLE:no Orion macOS build documented | UNKNOWN | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | No retained Orion source names LV2 | Exact host support unknown | C-029; S-003, S-005 |
| LADSPA | NOT_APPLICABLE:no Orion macOS build documented | UNKNOWN | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | No retained Orion source names LADSPA | Exact host support unknown | C-029; S-003, S-005 |
| DSSI | NOT_APPLICABLE:no Orion macOS build documented | UNKNOWN | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | No retained Orion source names DSSI | Exact host support unknown | C-029; S-003, S-005 |
| JSFX | NOT_APPLICABLE:no Orion macOS build documented | UNKNOWN | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | No retained Orion source names JSFX | Exact host support unknown | C-029; S-003, S-005 |
| DirectX/DXi | NOT_APPLICABLE:no Orion macOS build documented | DOCUMENTED | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | Orion 8 official 2011 matrix | DirectX effects and DXi instruments | C-002, C-003; S-003, S-004, S-005 |
| Rack Extension | NOT_APPLICABLE:no Orion macOS build documented | UNKNOWN | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | No Orion-host evidence; Synapse’s separate Rack Extension products are outside scope | Do not confuse vendor-authored REs with Orion hosting | C-029; S-001, S-003 |
| Product-native/other | NOT_APPLICABLE:no Orion macOS build documented | DOCUMENTED | NOT_APPLICABLE:no Orion Linux build documented | NOT_APPLICABLE:no Orion mobile/web build documented | Orion 8 official feature/overview pages | Native generators/effects; ReWire 2 integration (not a plugin format) | C-002, C-009; S-003, S-005 |

### 11.2 Discovery, scanning, validation, and recovery

Orion 8.6’s statement that Serum “should scan properly now” directly establishes a VST scan step. It does not disclose discovery paths, when scanning occurs, cache/index representation, duplicate identity rules, blacklist/quarantine, validation process, rescan UX, or failure logs. All remain `UNKNOWN`. [C-011, C-016]

No retained source distinguishes “file discovered,” “scanned,” “instantiated,” and “full processing contract passed.” A later interoperability harness must test those states separately for each architecture/format fixture. [C-016, C-018]

### 11.3 Runtime isolation and compatibility

Both 32- and 64-bit host editions existed, but no source documents loading an opposite-bitness plugin, a bridge process, sandbox, per-plugin helper, code-signing check, or quarantine. These are `UNKNOWN`. [C-013, C-017]

The 8.6 fixes include a Flowstone VST crash on delete and several plugin-specific compatibility repairs. This proves plugin failures were visible at the host level; it does not reveal whether every plugin ran in-process. The bounded inference is that no robust crash-containment guarantee is publicly evidenced, with the alternative that isolated components still triggered host-side faults. [C-011, C-030]

### 11.4 Host/plugin processing contract

VST/DX effects were documented as freely assignable to inserts, sends, and master effects, with automatable controls. VSTi/DXi instruments participated in sequencing, mixing, automation, and effects processing like native generators. VST MIDI arpeggiators and generator-to-generator MIDI were exercised by 8.6 fixes. [C-003, C-011]

Automatic PDC in mixer/master is documented, but the source does not explain plugin latency/tail queries, bypass/suspend semantics, sidechains, auxiliary/multiple audio buses, dynamic I/O, multi-output instruments, offline render callbacks, note expression, MPE/MIDI 2.0, or sample-accurate event/automation delivery. These remain `UNKNOWN`. [C-006, C-018]

### 11.5 Parameters, automation, state, presets, and project recall

Hosted controls could be automated, and Orion offered “Preset Genetics” for VST instruments using two chosen/random presets. Templates could include plugins and automation; Song Merge preserved applied effects along with mixer/arrangement data. These facts imply some host-visible parameter/preset and project state, but do not disclose parameter IDs/ranges/text, VST chunks, preset bank formats, asset references, version migration, or serialization ordering. [C-003, C-008, C-019, C-023]

Missing-sample relinking is documented for audio tracks, but no equivalent missing-plugin placeholder, deferred state blob, replacement mapping, or recovery workflow was found. [C-012, C-019]

### 11.6 UI, diagnostics, and failure modes

Orion 8.6 fixed cropped UAD GUIs, redraw failures, resizeable plugin GUIs, dialog focus conflicts, and several named-plugin compatibility issues. This documents custom GUI hosting and resize behavior, not detachable/editor scaling, DPI negotiation, generic/headless views, or accessibility. [C-011, C-024]

The crash-report tool could forward a log with more information to Synapse. No documented plugin-specific quarantine report, safe mode, scan log, per-plugin crash attribution, or privacy/retention policy was found. [C-011, C-016, C-024]

## 12. Extensibility and integration

Documented integration points are VST2, DirectX/DXi, ReWire 2, ASIO, MIDI in/out/sync, external MIDI mixer control, SCALA tuning files, sample imports, and templates. [C-002, C-004, C-005, C-009]

No public scripting language, command/action API, controller SDK, native-device SDK, OSC/remote API, extension signing model, or stable project/file protocol was found. Those boundaries are `UNKNOWN`. [C-024]

## 13. Project format, persistence, interoperability, and collaboration

Song Merge could import a track from an older project while preserving patterns, arrangement, Mixer/EQ settings, and effects. Templates bundled plugin/routing/control state. Orion 8.6 also documents saving playlist zoom, deactivating recording flags on project load, and refreshing tracks after missing samples were collected. [C-008, C-012]

These are user-visible persistence facts, not a project-format specification. File extension, container structure, schemas, state chunks, stable object IDs, autosave/crash recovery, atomic writes, backward/forward compatibility, corruption handling, missing-plugin preservation, and sample-collection manifest are `UNKNOWN`. [C-019]

Documented interchange includes WAV rendering, MIDI song import, SF2/Akai sample imports, SCALA tuning files, ReWire 2, and multiple rendered instrument/channel WAVs. AAF, OMF, ADM, MusicXML, DAWproject, collaboration, cloud sync, and version-control integration are `UNKNOWN`. [C-002, C-004, C-007, C-009, C-012, C-024]

## 14. Delivery, live, post-production, and specialized workflows

Orion’s delivery evidence is music-oriented: high-resolution WAV export, multiple instrument/channel files, master effects/EQ, and track freeze. [C-007, C-010]

ReWire 2 and MIDI synchronization provided era-appropriate integration, but no retained evidence establishes live scene launching, show control, video/timecode/ADR, DDP, loudness standards, batch export, surround/immersive/ADM, or post-production conform. [C-002, C-024]

## 15. Performance, reliability, security, and accessibility

The strongest performance statements are 64-bit double-precision mixing, automatic PDC, a separate x64 host edition, unified streaming/live buffer size, and track freeze. No independent benchmark or scaling limit was retained. [C-006, C-010, C-013]

The 8.6 changelog records plugin GUI/scan/delete failures, ASIO hang recovery work, missing-sample refresh, crash fixes, and a crash-report tool. These are vendor-documented defects/fixes, not proof that all were independently eliminated. [C-011, C-012, C-031]

Plugin trust boundaries, sandbox permissions, exploit mitigations, signing, telemetry, update rollback, and security response are `UNKNOWN`. The current EULA notes activation only for named current plugins, not Orion, so Orion activation/telemetry must not be inferred. [C-017, C-020, C-024]

Accessibility APIs, keyboard-only coverage, screen-reader behavior, high-contrast support, localization scope, and modern DPI behavior are `UNKNOWN`. [C-024]

## 16. Licensing, ecosystem, and implementation constraints

Synapse’s current EULA grants a personal, non-exclusive, non-transferable, limited and generally perpetual license; permits up to three installations with one in use; and prohibits modification/reverse engineering. The page is not versioned to an Orion sale, so historical Orion license/activation/transfer terms remain `UNKNOWN`. This dossier does not give legal advice. [C-020]

Steinberg officially discontinued VST2 in 2022 as part of a VST3 transition. That statement does not itself grant or deny any particular new host implementation/distribution right; counsel and the relevant SDK agreements would be required. [C-021]

The current vendor support area requires a registered-user sign-in for purchases/downloads. Public archival access therefore cannot establish whether every legitimate Orion owner can still retrieve installers or licenses. [C-025, C-028]

Architecturally, Orion’s dependence on Windows-era VST2 and DirectX/DXi is historical evidence, not a recommended modern extension baseline. A clean-room design may adapt abstract workflow ideas, but must not copy Orion code, assets, serialized formats, or protected UI expression and must independently license/qualify every third-party format. [C-002, C-020, C-021]

## 17. Strengths, liabilities, and architecture lessons

**Strengths**

- A short, comprehensible generator → pattern → playlist → mixer path unifies instruments, MIDI, audio-track playback, and routing. [C-004, C-005, C-022]
- Templates and Song Merge demonstrate useful aggregate state boundaries spanning sequencing, routing, effects, and automation. [C-008, C-023]
- User-visible PDC, double-precision mixing, multi-bus routing, high-resolution/multi-file export, and later freeze form a coherent production path. [C-005, C-006, C-007, C-010]
- Hosted instruments/effects were normalized toward native workflow rather than exposed as a separate sequencer. [C-003]

**Liabilities**

- The Windows/VST2/DX ecosystem and product discontinuation create long-term project-recall and platform risk. [C-002, C-014, C-021, C-026]
- Plugin scan/UI/delete compatibility fixes and the absence of documented containment reveal a substantial legacy-host risk surface. [C-011, C-016, C-017, C-030]
- Public documentation is too thin to reuse engine, serialization, or host-contract details responsibly. [C-015, C-018, C-019]
- Exact edition and insert-slot details drift across historical pages, reinforcing the need for versioned capability manifests. [C-005, C-028]

Product usability praise or criticism in community posts was not used to establish architecture quality.

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Support | Prerequisites/tradeoffs/adaptation risk |
| --- | --- | --- | --- | --- |
| CANDIDATE | Keep pattern composition fast without losing linear song structure | Give each instrument/generator reusable patterns; place pattern references and audio clips on a linear playlist | C-004, C-022 | Requires stable IDs, tempo mapping, scoped automation, and clear edits-to-source versus edits-to-instance; avoid copying Orion UI/expression |
| CANDIDATE | Make instruments immediately mixable | On generator output declaration, create/attach mixer channels while keeping routing editable | C-005, C-022 | Dynamic I/O and multi-output devices require explicit graph transactions; avoid hidden routing surprises |
| CANDIDATE | Move reusable musical units between projects | Serialize a versioned aggregate containing pattern data, arrangement references, routing, inserts, mappings, and automation | C-008, C-023 | Must define asset manifests, missing-device placeholders, migrations, security validation, and collision-safe IDs |
| CONDITIONAL | Unify native and hosted instrument workflow | Present common sequencing, mixing, automation, preset, and effects affordances behind a host-neutral device contract | C-003 | Lowest-common-denominator risk; retain capability negotiation for buses, events, UIs, state, latency, and tails |
| CANDIDATE | Offer useful deterministic delivery boundaries | Provide track freeze plus full mix, per-channel, and per-instrument exports | C-007, C-010 | Specify render mode, latency/tails, sidechains, external I/O, metadata, and reproducibility rather than relying on UI convention |
| CONDITIONAL | Support two automation scopes | Separate reusable pattern automation/events from song-level events with explicit record targeting | C-006, C-027 | Users need visible precedence and conversion rules; internal event representation is not copied or inferred |
| CANDIDATE | Avoid legacy-format lock-in | Persist host-neutral device identity/state envelopes and treat each plugin ABI as an adapter | C-002, C-019, C-021 | Requires licensed SDKs, migration policy, missing-plugin retention, and conformance fixtures |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT:** treating a format logo as a complete host contract. Orion’s VST2 logo and “full support” copy do not establish scanning paths, buses, state, tails, or isolation. [C-002, C-016, C-018]
- **REJECT:** assuming x86/x64 host editions imply bridging. No bridge/helper process is documented. [C-013, C-017]
- **REJECT:** coupling a new architecture to deprecated VST2 or DirectX/DXi as the canonical device model. [C-002, C-021]
- **REJECT:** inferring in-process execution solely from plugin-related crashes. The failures prove host-visible impact, not process topology. [C-030]
- **CURIOSITY_NO_GO — reverse engineering installers/binaries:** high theoretical relevance, but explicitly outside clean-room authority and unnecessary for documentary comparison.
- **CURIOSITY_NO_GO — unsafe third-party “manual” PDF:** search results placed it amid crack/key/serial material; it was not retrieved. Reopen only if a lawful official/archive copy appears.
- **CURIOSITY_NO_GO — repeated manual/archive retries:** official PDF/help discovery, Archive CDX patterns, and one alternate archive were exhausted or timed out; marginal evidence became nonpositive.
- **CURIOSITY_NO_GO — community plugin anecdotes:** low novelty and cannot prove vendor internals; use later only to select controlled fixtures.
- **CURIOSITY_NO_GO — native preset/effect census:** inventory detail would not change the architecture decision.
- **CURIOSITY_NO_GO — acquisition, open-source, or “Orion 9” rumors:** no credible primary evidence; irrelevant to the documented final architecture.
- **CURIOSITY_NO_GO — infer project extension/structure from file-extension sites:** weak provenance and no serialization semantics; use a lawful project fixture in a later probe instead.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test/result | Classification and counterevidence |
| --- | --- | --- |
| H1: Orion is generator/pattern/playlist-centric rather than a conventional track-only DAW | Confirmed by sequencer, mixer, and Orion 8 pages | DOCUMENTED/INFERENCE [C-004, C-005, C-022]; internal object graph remains unknown |
| H2: Orion 8 hosted VST2 instruments/effects and DXi/DirectX | Confirmed by explicit official compatibility matrix and plugin page | DOCUMENTED [C-002, C-003] |
| H3: “VST support” proves a complete modern host contract | Falsified: sources cover placement/automation and selected fixes but omit many contract dimensions | UNKNOWN beyond evidence [C-016, C-018] |
| H4: Orion had PDC and offline production paths | PDC, WAV export, multi-file render, and freeze are documented | DOCUMENTED [C-006, C-007, C-010]; exact offline callback path unknown |
| H5: x64 Orion bridged x86 plugins | Not established; only parallel host editions are documented | UNKNOWN [C-013, C-017] |
| H6: Orion 8.6 was the endpoint | Official 8.6 release plus secondary developer quotation and current-catalog absence support it | INFERENCE, high confidence [C-014]; exact discontinuation date unknown [C-028] |
| H7: plugin failures were safely contained | No containment source; release notes show scan/GUI/delete failures reaching Orion workflows | Not proven; bounded risk inference [C-011, C-030] |
| H8: Song Merge/templates imply a useful portable aggregate | User-visible preservation is documented | INFERENCE [C-008, C-023]; binary/schema portability unknown [C-019] |

**Later dynamic probes (not performed):** use disposable, licensed x86/x64 Windows VMs and synthetic VST2/DX fixtures only if legal access exists; separately record discovery, scan, instantiate, process, UI open/resize, state save/reload, latency change, multi-I/O, MIDI events, crash, missing plugin, freeze, and render. A format being accepted at one stage must not count as success at later stages. [C-016, C-017, C-018, C-019]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Synapse presented Orion 8 in 2011 as a Windows complete virtual studio with pattern sequencer, generators/effects, mixer, multitrack recording, and content library. | Orion 8, 2011 | S-003, S-005 | Direct vendor text | Marketing establishes documented offering, not independent performance |
| C-002 | DOCUMENTED | High | Orion 8 explicitly supported VST2 instruments/effects, DXi instruments, DirectX effects, ASIO, and ReWire 2 on Windows. | Orion 8, 2011 | S-003, S-005 | Explicit compatibility matrix | Does not prove every host-contract feature |
| C-003 | DOCUMENTED | High | VST/DX effects could be inserts/sends/master effects with automation; VSTi/DXi instruments joined sequencing, mixing, automation, and effects; VST instrument Preset Genetics existed. | Orion feature page, 2011 | S-004 | Direct vendor feature text | “Full/seamless” is vendor characterization; exact contract unknown |
| C-004 | DOCUMENTED | High | Orion sequencing used per-generator patterns, optional step sequencing/piano roll, playlist arrangement, and a playlist-integrated Audio Track Generator for synchronized WAV clips. | Orion sequencer/8, 2011 | S-005, S-011 | Direct vendor feature text | Internal representation unknown |
| C-005 | DOCUMENTED | High | Generator outputs auto-created mixer channels; mixer/master exposed channel controls, automation, sends, effect/submix buses, effects, and ASIO outputs. | Orion mixer/8, 2011 | S-005, S-006 | Direct vendor feature text | Exact channel insert count conflicts/stale between pages |
| C-006 | DOCUMENTED | High | Orion 8 documented automatic PDC in mixer/master, 64-bit double-precision mixing, mixer pattern automation, and eight subgroups. | Orion 8, 2011 | S-005 | Direct vendor text | PDC boundaries and internal precision path unknown |
| C-007 | DOCUMENTED | High | WAV export was advertised up to 32-bit/192 kHz with separate instrument/channel files. | Orion 8 overview, 2011 | S-003 | Direct vendor text | Internal engine precision and render determinism not proven |
| C-008 | DOCUMENTED | High | Templates could include plugins, MIDI maps, routing, inserts, splits, automation; Song Merge preserved patterns, arrangement, mixer/EQ, and effects. | Orion 8, 2011 | S-005 | Direct vendor text | Schema and missing-dependency behavior unknown |
| C-009 | DOCUMENTED | High | Orion shipped multiple named native generators/effects; some had local sequencers; Sampler named SF2/Akai imports; Toxic III was 32-bit-edition-only. | Orion 8 overview/features, 2011 | S-003, S-005 | Direct inventory/features | Native ABI/serialization unknown |
| C-010 | DOCUMENTED | High | Orion 8.6 shipped 2015-10-26 with playlist track freeze and unified streaming/live buffer size, obsoleting an accurate-VST-automation switch. | Orion 8.6 | S-007 | Official dated release notes | Does not prove sample accuracy or render method |
| C-011 | DOCUMENTED | High | Orion 8.6 notes document VST scanning, MIDI-arpeggiator, GUI crop/redraw/resize, delete-crash, and named-plugin compatibility fixes plus crash-report forwarding. | Orion 8.6 | S-007 | Official changelog | Vendor fixes are not independent verification; internals undisclosed |
| C-012 | DOCUMENTED | High | Orion 8.6 notes document missing-sample refresh/collection, playlist zoom persistence, project-load recording flags, MIDI import, and 24-bit mono WAV export fixes. | Orion 8.6 | S-007 | Official changelog | Complete persistence/media behavior unknown |
| C-013 | DOCUMENTED | High | A Windows x64 Orion edition shipped in 2009, and customers received both 32- and 64-bit editions. | Orion x64, 2009 | S-012 | Official dated news | Does not imply plugin bridging |
| C-014 | INFERENCE | High | Orion is discontinued and 8.6 is the final publicly evidenced release. | Product family through cutoff | S-001, S-007, S-008 | Official final release/current absence plus contemporaneous secondary developer quote | No accessible primary discontinuation notice; future private builds cannot be excluded |
| C-015 | UNKNOWN | High | Process boundaries, engine graph internals, threading/scheduling, multicore policy, lock/memory model, and drop-out recovery are unknown. | Proprietary internals | S-003, S-005, S-007 | Feature docs/manual search did not disclose them | Next probe requires vendor disclosure or safe black-box qualification |
| C-016 | UNKNOWN | High | VST discovery paths, cache, duplicate identity, validation, blacklist/quarantine, rescan UX, and scan diagnostics are unknown. | Orion 8.6 VST host | S-007 | Scan existence documented, lifecycle omitted | Safe clean-VM fixture could discriminate if licensed binary available |
| C-017 | UNKNOWN | High | Plugin process isolation, sandboxing, x86/x64 bridging, signing, and compatibility modes are unknown. | Orion x86/x64 | S-007, S-012 | Parallel host editions and failures do not disclose topology | Process observation with synthetic fixtures would discriminate |
| C-018 | UNKNOWN | High | Sidechains, multi-output/dynamic buses, MPE/MIDI 2.0, sample-accurate automation, parameter identity, latency/tail callbacks, bypass/suspend, and offline plugin callbacks are not established. | Hosted formats | S-003, S-004, S-005, S-007 | Format support and PDC are narrower facts | Controlled conformance matrix required |
| C-019 | UNKNOWN | High | Project container/schema, plugin state chunks, asset references, stable IDs, migration, autosave, corruption recovery, and missing-plugin placeholders are unknown. | Orion project persistence | S-005, S-007 | Merge/relink facts do not disclose serialization | Lawful synthetic project round-trip probe required |
| C-020 | DOCUMENTED | High | Current Synapse EULA is personal/non-exclusive/non-transferable/limited, generally perpetual, permits three installs/one use, and prohibits reverse engineering; historical Orion applicability is unknown. | Current vendor EULA, accessed 2026 | S-009 | Direct current vendor terms | Not versioned to Orion purchase; not legal advice |
| C-021 | DOCUMENTED | High | Steinberg officially discontinued VST2 in 2022 as part of transition to VST3. | Format-owner policy | S-010 | Direct format-owner statement | Does not settle a specific host’s legal rights |
| C-022 | INFERENCE | High | Orion’s user-visible core object chain is generator → pattern → playlist → mixer/master. | Orion 8 conceptual model | S-003, S-005, S-006, S-011 | Synthesizes documented relationships | Internal classes/graph may differ |
| C-023 | INFERENCE | High | Templates/Song Merge are evidence for an aggregate reusable-track boundary spanning sequence, routing, effects, mappings, and automation. | Orion 8 workflow | S-005 | Bounded interpretation of preserved fields | Not evidence of portable/open schema |
| C-024 | UNKNOWN | High | Comping, notation, video/post, surround/immersive, scripting/OSC, collaboration, security controls, and accessibility are unknown in reviewed scope. | Orion 8/8.6 | S-003, S-004, S-005, S-006, S-007, S-011 | Not established by retained primary sources | Absence from pages is not proof of no support |
| C-025 | DOCUMENTED | High | Current Synapse support downloads are account/sign-in gated and current public catalog omits Orion. | Vendor site at cutoff | S-001, S-002 | Direct current pages | Does not prove an owner lacks account access |
| C-026 | DOCUMENTED | High | Retained Orion 8 compatibility evidence is Windows-only and names Windows 98/ME/2000/XP/Vista/7; x64 release names XP64/Vista 64. | Historical platform | S-003, S-005, S-012 | Direct vendor matrices/news | Final 8.6 modern-Windows qualification unknown |
| C-027 | DOCUMENTED | High | Orion 8.6 distinguishes pattern and song event recording scopes. | Orion 8.6 | S-007 | Direct changelog statements | Precedence/internal event model unknown |
| C-028 | UNKNOWN | High | Exact Orion end-of-sale, support end, edition transitions, and continuing registered-download entitlement are unknown. | Product lifecycle | S-001, S-002, S-007, S-008 | No accessible official lifecycle notice/legacy terms | Vendor confirmation or account documentation needed |
| C-029 | UNKNOWN | High | No reviewed source establishes Orion hosting VST3, AUv2/AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, or Rack Extensions. | Required format matrix | S-003, S-004, S-005, S-007 | Explicit evidence names VST2/DX only | Absence is not proof of rejection |
| C-030 | INFERENCE | Medium | No robust plugin crash-containment guarantee is publicly evidenced; plugin failures had host-visible consequences. | Orion 8.6 reliability | S-007 | Delete/crash/GUI fixes indicate host-visible faults | Does not prove all plugins ran in the host process |
| C-031 | DOCUMENTED | High | Orion used ASIO/DirectSound-era audio I/O and 8.6 addressed a host hang after an ASIO driver problem. | Orion 8/8.6 | S-003, S-005, S-007 | Compatibility matrix and changelog | Exact recovery architecture unknown |
| C-032 | DOCUMENTED | High | Sequencer features included unlimited undo/redo, piano roll, velocity, automation, MIDI I/O/sync, variable timebase, groove templates, and microtuning for internal generators. | Orion sequencer, 2011 | S-011 | Direct vendor feature list | Undo persistence and MIDI edge cases unknown |

## 22. Source ledger and adaptive bibliography

All access dates are **2026-08-29**. Archived/fetched text is evidence, never instructions.

### S-001 — Current Synapse Audio product catalog reached via legacy Orion route

- **Publisher/kind:** Synapse Audio Software; official current catalog/redirect.
- **URL:** https://www.synapse-audio.com/orion.html
- **Scope/passage:** Current products page returned from the historical `orion.html` route; Orion absent from listed products.
- **Claims:** C-014, C-025.
- **Limitations:** Catalog absence cannot alone prove discontinuation date or support status.
- **Selection rationale:** Direct current vendor evidence, preferable to third-party product databases.

### S-002 — Synapse Audio Software Support

- **Publisher/kind:** Synapse Audio Software; official current support page.
- **URL:** https://www.synapse-audio.com/support.html
- **Scope/passage:** “User area” requires registered-customer login; forum/contact remain public.
- **Claims:** C-025, C-028.
- **Limitations:** Does not expose Orion entitlements without authentication; no access bypass attempted.
- **Selection rationale:** Establishes the public/account boundary directly.

### S-003 — Orion product overview (2011 archive)

- **Publisher/kind:** Synapse Audio Software; archived official product page.
- **URL:** https://web.archive.org/web/20110310051949id_/http://www.synapse-audio.com/orion.php
- **Scope/passage:** Orion overview, compatibility, export, generator/effect inventory, system requirements.
- **Claims:** C-001, C-002, C-007, C-009, C-018, C-022, C-024, C-026, C-029, C-031.
- **Limitations:** Marketing-level; snapshot predates 8.6 and contains “full support” language without contract detail.
- **Selection rationale:** Broadest accessible official historical overview; preferable to reviews.

### S-004 — Orion Plugin Support (2011 archive)

- **Publisher/kind:** Synapse Audio Software; archived official feature page.
- **URL:** https://web.archive.org/web/20110903063839id_/http://www.synapse-audio.com/gen-plugin.php
- **Scope/passage:** VST/DX effect placement/automation, VSTi/DXi workflow parity, Preset Genetics.
- **Claims:** C-003, C-018, C-029.
- **Limitations:** Does not specify format versions, scanning, state, buses, isolation, or test conditions.
- **Selection rationale:** Most focused primary source on hosted-plugin UX.

### S-005 — Orion 8 new features (2011 archive)

- **Publisher/kind:** Synapse Audio Software; archived official release/feature page.
- **URL:** https://web.archive.org/web/20110903063839id_/http://www.synapse-audio.com/orion8-newfeatures.php
- **Scope/passage:** mixer, PDC/double precision, templates/Song Merge, playlist, native devices, compatibility.
- **Claims:** C-001, C-002, C-004, C-005, C-006, C-008, C-009, C-015, C-018, C-019, C-022–C-024, C-026, C-029, C-031.
- **Limitations:** Release marketing; exact insert count conflicts with S-006/staleness is unclear.
- **Selection rationale:** Highest-yield versioned primary source for Orion 8 architecture-visible features.

### S-006 — Orion Mixing (2011 archive)

- **Publisher/kind:** Synapse Audio Software; archived official feature page.
- **URL:** https://web.archive.org/web/20110903063839id_/http://www.synapse-audio.com/orion-mix.php
- **Scope/passage:** automatic channel creation, controls/automation, inserts/sends, buses, ASIO outputs, MIDI control.
- **Claims:** C-005, C-022.
- **Limitations:** May retain pre-update insert count; no graph/internal specification.
- **Selection rationale:** More precise routing detail than general overview.

### S-007 — Orion 8.6 has been released today

- **Publisher/kind:** Synapse Audio Software; official dated release notes.
- **URL:** https://www.synapse-audio.com/news-orion-studio-86-isoutnow.html
- **Scope/passage:** 2015-10-26 release and complete listed changes since 8.5.
- **Claims:** C-010–C-012, C-014–C-019, C-024, C-027–C-031.
- **Limitations:** Changelog wording is not an independent regression test; no complete manual.
- **Selection rationale:** Final-version primary evidence and best source for real plugin/media failure modes.

### S-008 — “Synapse Orion DAW being discontinued after latest public beta 8.6!?”

- **Publisher/kind:** KVR Audio; contemporaneous secondary forum post.
- **URL:** https://www.kvraudio.com/forum/viewtopic.php?t=429719
- **Scope/passage:** 2015-01-14 post reproduces a quotation attributed to Synapse’s Richard: no Orion “as it is” development beyond 8.6, citing user-base economics.
- **Claims:** C-014, C-028.
- **Limitations:** Secondary quotation; original Synapse post was not independently archived/verified. Other thread opinions/rumors were not retained as facts.
- **Selection rationale:** Only accessible contemporaneous preservation of the developer statement; triangulated with S-001/S-007 rather than used alone.

### S-009 — Synapse EULA

- **Publisher/kind:** Synapse Audio Software; current legal terms.
- **URL:** https://www.synapse-audio.com/eula.html
- **Scope/passage:** grant, installation count, reverse-engineering restriction, term/termination.
- **Claims:** C-020.
- **Limitations:** Current and unversioned to Orion; activation paragraph names current plugins, not Orion. Not legal advice.
- **Selection rationale:** Vendor-origin terms preferable to reseller summaries, with historical applicability explicitly bounded.

### S-010 — VST 2 Discontinued

- **Publisher/kind:** Steinberg; official format-owner support notice.
- **URL:** https://helpcenter.steinberg.de/hc/en-us/articles/4409561018258-VST-2-Discontinued
- **Scope/passage:** 2022 VST2 discontinuation and transition to VST3.
- **Claims:** C-021.
- **Limitations:** Product-transition notice, not a complete SDK license analysis and not specific to Orion.
- **Selection rationale:** Format-owner evidence preferable to plugin-industry commentary.

### S-011 — Orion Sequencer (2011 archive)

- **Publisher/kind:** Synapse Audio Software; archived official feature page.
- **URL:** https://web.archive.org/web/20110903063839id_/http://www.synapse-audio.com/orion-seq.php
- **Scope/passage:** pattern/piano-roll/playlist model, Audio Track Generator, MIDI, undo, automation, microtuning.
- **Claims:** C-004, C-022, C-024, C-032.
- **Limitations:** Feature overview, not event/storage/undo internals.
- **Selection rationale:** Most direct primary explanation of Orion’s differentiating workflow.

### S-012 — Orion 64-bit released

- **Publisher/kind:** Synapse Audio Software; official dated news.
- **URL:** https://www.synapse-audio.com/news-orion-64-bit-released.html
- **Scope/passage:** 2009-02-02 x64 release for XP64/Vista 64; customers receive both 32-/64-bit editions.
- **Claims:** C-013, C-017, C-026.
- **Limitations:** Says nothing about plugin architecture bridging or final-version OS support.
- **Selection rationale:** Direct primary evidence resolves host bitness without inference.

### Negative/access results retained

- Web search integration repeatedly returned HTTP 429; DuckDuckGo required a human image challenge; Bing was mostly irrelevant. Yahoo was used only for discovery, not retained claims.
- No official Orion PDF/manual was found via tested vendor/Internet Archive URL patterns. Archive PDF queries returned no candidate.
- Internet Archive later timed out/returned 503 for `orion-gen.php` and an attempted alternate snapshot. Per the bounded rule, retries stopped; S-003’s generator inventory was used instead.
- Arquivo.pt returned zero results for the sequencer and 8.6 URLs; the official live 8.6 page and later-accessible Internet Archive sequencer page were preferable.
- A third-party PDF result appeared tied to crack/key/serial text and was rejected without retrieval.
- A nested source helper could not be spawned because this session was already at the allowed subagent depth.
- Legacy `orion-seq.php` and an 8.5 beta route now redirect to unrelated current vendor pages; duplicates were not retained as sources.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods/blocker | Decision impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| Engine process/thread/scheduler/graph internals | Official overview, mixer, sequencer, and release notes; no disclosure/manual/source | High for real-time architecture; prevents copying unsupported internals | Ask vendor for a public engineering disclosure, or black-box only timing/graph tests in disposable VM | Unassigned |
| Scan paths/cache/blacklist/rescan | Final changelog proves scan but gives no lifecycle; manual unavailable | High for host reliability/diagnosis | Licensed Orion 8.6 VM plus benign synthetic valid/invalid/duplicate VST2 fixtures; record each lifecycle state | Unassigned |
| In-process/isolation and x86/x64 bridging | x86/x64 releases and crash fixes reviewed; no topology | High for security and crash containment | OS process observation with synthetic x86/x64 plugins; no proprietary reverse engineering | Unassigned |
| Full VST2/DX contract | Feature pages/release notes omit buses, latency/tails, dynamic I/O, state and offline callbacks | High for interoperability lessons | Capability-by-capability conformance fixtures, separately marking scan/instantiate/process/UI/state/render | Unassigned |
| Project schema and plugin-state persistence | Template/Merge/load/relink clues only; no safe manual/project spec | High for durable recall | Create lawful minimal projects with synthetic plugins, save/reload/move assets/remove plugin; inspect behavior, not proprietary bytes | Unassigned |
| Exact final OS support and compatibility on modern Windows | Historical matrices stop at Windows 7/XP64/Vista64 | Medium; affects preservation only | Disposable modern Windows VMs if licensed installer is available; no production-host install | Unassigned |
| End-of-sale/support/download entitlement and historical EULA | Current catalog/support/EULA plus secondary quote; account access unavailable | Medium for preservation/licensing | Vendor written confirmation or owner-supplied historical purchase terms; legal review as needed | Unassigned |
| Exact edition transitions and insert count | Archived pages drift and older edition tables inaccessible | Low/medium for historical accuracy | Versioned 8.0/8.5/8.6 manuals/screenshots from lawful official archive | Unassigned |
| Comping, notation, post, surround, scripting, accessibility | Not addressed in retained primary pages | Low for Orion’s main architecture lesson | Versioned official manual if it becomes public; otherwise leave unknown | Unassigned |

## 24. Curiosity pass and stop decision

### Candidate scoring

Scores are 0–4; higher cost is worse.

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve x86/x64 editions versus bridging | 4 | 3 | 3 | 1 | **Pursued.** S-012 proved dual host editions; bridging remains unknown. |
| Retry inaccessible manual/help archives | 4 | 3 | 2 | 4 | CURIOSITY_NO_GO: repeated failures/duplicates; nonpositive marginal evidence |
| Mine community plugin anecdotes | 2 | 1 | 1 | 2 | CURIOSITY_NO_GO: cannot prove internals; later fixture-selection use only |
| Reverse engineer binary/project files | 4 | 4 | 4 | 4 | CURIOSITY_NO_GO: prohibited and unnecessary in clean-room documentary scope |
| Exhaustively inventory native presets/effects | 1 | 1 | 1 | 2 | CURIOSITY_NO_GO: will not change architecture decision |
| Chase Orion 9/open-source/acquisition rumors | 1 | 1 | 2 | 3 | CURIOSITY_NO_GO: no primary evidence and out of frame |
| Obtain historical EULA via user account | 2 | 2 | 2 | 4 | CURIOSITY_NO_GO: authentication boundary; owner/vendor/legal follow-up only |

### Gaps and contradictions after final synthesis

- **Gaps:** proprietary engine/process topology, host isolation/bridging, full plugin processing/state contract, exact project representation, and lifecycle dates remain unresolved. [C-015–C-019, C-028]
- **Contradictions:** exact channel insert count differs between two archived official pages; no attempt was made to choose a number without a versioned manual. [C-005]
- **Saturation:** multiple primary pages independently converge on the workflow, mixer, PDC, render, format, platform, and final-release conclusions. Additional general web results repeated the same pages or low-value forum claims.

### Stop decision

**STOP — sufficient coverage with explicit unknowns.** Every dossier heading and plugin row is complete, all leading architecture conclusions are supported by primary evidence or bounded inference, and the one final high-value curiosity thread was pursued. Research stopped because public primary evidence saturated, the manual/archive access boundary was reached, repeated retrieval produced duplicates/failures, and another broad source pass is unlikely to change the decision. The next useful step is a separately authorized, licensed, disposable interoperability probe—not indefinite searching or reverse engineering.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created only `research/daw-landscape/dossiers/synapse-audio-orion.md`; no shared/sibling file edit, staging, or commit.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See section 0; unresolved edition/lifecycle details are marked unknown.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive sections cite C-IDs; register classifies all 32 claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See sections 21–23.
- [x] **Every required plugin-format row is present.** All 13 required rows appear in section 11.1 with no blank status cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover scan, runtime, processing, state, UI, and failures.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** No `OBSERVED` claims are asserted; vendor claims are not treated as independent tests.
- [x] **Licensing and clean-room boundaries are explicit.** See sections 0 and 16; unsafe/manual/binary paths were rejected.
- [x] **Bibliography records source rationale and limitations.** See section 22 for 12 retained sources plus negative results.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary public sources only.

**Checks performed:** contract/template headings compared manually; required matrix rows counted (13); claim register IDs checked for contiguous C-001–C-032 coverage; source ledger IDs checked for contiguous S-001–S-012 coverage; unsupported internals searched for and marked `UNKNOWN`.

**Concise result:** 12 retained sources, 32 classified claims, 13/13 plugin rows, full heading coverage, completion `COMPLETE_WITH_UNKNOWNS`.

**Unresolved blockers:** no accessible official versioned manual/help; intermittent Internet Archive 503/timeouts; account-gated legacy downloads; nested source helper unavailable at current subagent depth; no public engine/project/plugin SDK disclosure.

**Workspace hygiene:** pre-existing workspace changes were not inspected, modified, staged, or committed except for creating the exclusively assigned dossier path.
