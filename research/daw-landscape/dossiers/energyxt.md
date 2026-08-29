# energyXT / XT Software DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** energyXT / Energy XT by XT Software AS / XT Software, including the Windows-only energyXT 1.x lineage, cross-platform energyXT 2.x, and the last archived desktop state branded energyXT 3.0. A separately listed energyXT iOS branch is noted where evidence permits. [C-001, C-002, C-026]
- **Canonical vendor/author:** XT Software; the archived vendor support page attributes the first 2003 release to Jørgen Aase. [C-001]
- **Researcher/session:** `ses_fb271e965ffbSjeSSFJhtNJFzY`
- **Owned path:** `research/daw-landscape/dossiers/energyxt.md`
- **Research date and cutoff:** 2026-08-29 UTC.
- **Version snapshot:** energyXT 1.4 (archived legacy Windows page); energyXT 2.x documentation circa 2010–2014; last retrieved vendor download state, energyXT 3.0 for Windows/macOS and 2.7 for Linux, archived in 2018. [C-002, C-004, C-005]
- **Roles/editions:** desktop standalone DAW/host; an energyXT VST plug-in build loadable inside another DAW; and the distinct XT Software **ReWire VST** add-on, which is not energyXT itself. [C-004, C-014, C-021]
- **Mobile boundary:** a separate energyXT-for-iOS product was listed by the vendor in 2014, but its detail page was inaccessible; an Android app merely “inspired by energyXT” was announced as “coming soon” in a 2019-copyright page, with no release evidence. Mobile is context, not a basis for desktop claims. [C-026]
- **Exclusions:** ReWire VST, XTS1, M3, and the announced Android app are not treated as DAW editions; their boundaries are recorded only to prevent conflation. No binaries were downloaded or run. [C-021, C-026]
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. Public evidence is unusually sparse for exact VST generation, plug-in runtime contracts, persistence, proprietary internals, and formal discontinuation.

## 1. Executive summary

**DOCUMENTED — C-004, C-005, C-007, C-010.** energyXT is architecture-relevant chiefly because it made a modular MIDI/audio component view coexist with a conventional linear sequencer and mixer. EnergyXT 1.4 explicitly allowed free routing of instruments and effects and shipped as both standalone and VST; 2.x/3-era material retained a modular routing view while emphasizing tracks, clips, browser drag-and-drop, mixer channels, and dockable tabs.

**DOCUMENTED — C-002, C-006, C-014, C-018.** The last vendor page retrieved offered 3.0 for Windows/macOS and 2.7 for Linux. It documented generic VST instrument/effect hosting, a 32-bit **audio engine** (processing precision, not executable bitness), automatic plug-in delay compensation, clip automation of VST parameters, threaded disk recording/streaming, and offline WAV rendering.

**INFERENCE — C-003, C-015.** Classic custom-folder discovery and secondary reports make VST2 likely and VST3 support doubtful, but this is not qualification evidence. The original domain is repurposed and KVR marks the product unavailable, but no formal vendor discontinuation notice was found.

**UNKNOWN — C-016, C-017, C-019, C-024.** No official retained source names VST2 or VST3. Scanning isolation, bridging, crash containment, buses, sidechains, dynamic I/O, state chunks, missing-plug-in recovery, project schema, and scheduler/process internals remain unknown.

**Confidence:** high for the user-visible modular/sequencer/mixer model and archived platform/version state; medium for maintenance status; low for exact plug-in generation/bitness; no confidence beyond explicit `UNKNOWN` for undocumented host contracts.

## 2. Product identity, history, and market position

**DOCUMENTED — C-001.** The archived 2018 support page calls energyXT award-winning music-creation software, says Jørgen Aase first released it in 2003, and identifies XT Software as publisher. This proves vendor-stated provenance, not market share.

**DOCUMENTED — C-002, C-004.** Version 1.4 was presented as a Windows “Modular MIDI & audio sequencer.” By 2010, specifications covered Windows, Mac OS X, and Linux. The last retrieved 2018 product page supplied 3.0 downloads for Windows/macOS and 2.7 for Linux, evidencing platform divergence rather than a single current build.

**INFERENCE — C-003.** The last retrieved genuine vendor pages date to 2018–2020, the current domain contains unrelated/spam content, and KVR currently marks energyXT “No Longer Available.” The bounded conclusion is “last publicly evidenced/unmaintained at the original domain,” not a proven legal discontinuation date.

**DOCUMENTED — C-026.** A separate iOS product was listed in 2014; only KVR supplies the secondary version value 1.2. The Android page announced a different, energyXT-inspired app but did not establish release. Exact iOS detail and Android release status remain unknown. Intended desktop users were described by the vendor as songwriters, musicians, and music enthusiasts; no professional post-production positioning was found. [C-001, C-026]

## 3. Workflow and conceptual model

**DOCUMENTED — C-004, C-005, C-007.** EnergyXT combines three visible mental models: (1) a modular component graph for MIDI/audio routing, (2) a linear sequencer/arrange view for recording and arranging, and (3) a channel mixer. Core objects documented for 2.x include MIDI, audio, drum, and folder tracks; MIDI/audio/drum parts; ghost-linked parts; instruments/effects; mixer channels/groups; and reusable `.xtc` library clips.

**DOCUMENTED — C-005, C-022.** Browser items—devices, effects, samples, loops, clips, and presets—are dragged into the arrangement or devices. Editors can be arranged/docked into tabs. Project templates cover recording and MIDI-sequencing setups; Quick-add creates tracks/devices.

**UNKNOWN — C-023.** No retained primary evidence describes scene launching, a dedicated performance set, notation, tracker patterns, post-production reels, or a mobile-to-desktop project model. Real-time editing while playback runs is documented for drum patterns, but it does not establish a dedicated live-performance architecture.

## 4. Publicly documented architecture

**DOCUMENTED — C-004, C-005, C-006.** Public material exposes a user-visible audio/MIDI component graph, a sequencer, mixer, browser, built-in devices, thread-based disk streaming/audio recording, and operation via ASIO/ALSA or as a VST plug-in. These are product capabilities and boundaries, not source-level implementation disclosures.

**UNKNOWN — C-024.** Process topology, real-time scheduling, render-graph compilation, audio callback rules, thread pools, lock strategy, memory ownership, graph-cycle policy, service decomposition, plug-in process boundaries, and source/module map are proprietary or otherwise undocumented in the retained evidence. No inference about these internals is made from the word “modular.”

## 5. Audio engine

**DOCUMENTED — C-006.** Vendor specifications state a 32-bit audio engine, zplane time-stretch/pitch-shift, thread-based disk streaming and audio recording, automatic plug-in delay compensation, and offline rendering to 16/24/32-bit mono/stereo WAV at any sample rate. The page also documents bounce, freeze, and multitrack export. “32-bit audio engine” is processing precision and does not answer application or plug-in CPU architecture.

**DOCUMENTED — C-008.** Windows recording used ASIO; Mac OS X selected input and output devices; Linux required JACK for recording, while a 2010 specification also named ALSA/OSS for Linux playback. Inputs are explicitly enabled and routed to tracks/components.

**UNKNOWN — C-017, C-024.** Internal summing precision beyond the 32-bit statement, block-size behavior, multicore graph scheduling, PDC scope/limits, live versus offline equivalence, oversampling, dropout handling, tail handling, freeze file semantics, denormal policy, and engine diagnostics were not documented.

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED — C-007.** The 2.x specification lists unlimited MIDI, audio, drum, and folder tracks; in-track MIDI/audio/drum editing; popup editors; per-track arpeggiators and swing; ghost parts; track freeze; sample forward/reverse; and normal, repitch, or stretch resampling. Drum hits and piano-roll notes can be added/removed in grids, including while a drum pattern plays.

**DOCUMENTED — C-012.** MIDI, audio, and drum parts can be stored as self-contained `.xtc` library clips and reused. Audio processing documented in a tutorial includes normalize and opening the underlying file in an external wave editor.

**UNKNOWN — C-019.** Takes/lanes, comping, ripple editing, slip editing, nondestructive edit-list representation, crossfades, tempo-map edge cases, nested grouping, clip versioning, and edit-history persistence are not established. Full undo/redo is documented, but whether it survives save/reopen is unknown. [C-022]

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED — C-009.** EnergyXT accepts one or more MIDI keyboards, activates hardware in File > Setup > MIDI, routes MIDI input per track, records/plays instrument and drum tracks, maps drum notes chromatically from C1, and offers per-track velocity sensitivity. The sequencer includes piano-roll/grid editing, step entry in 1.4, per-track arpeggiation with random/probability, and per-track swing/shuffle.

**DOCUMENTED — C-010, C-022.** External MIDI can control mixer and VST parameters; an official tutorial list includes controller mapping for transport/tempo, although the retained detailed source was not fetched. User-defined keyboard shortcuts are documented.

**UNKNOWN — C-016, C-023.** MPE, per-note expression, MIDI 2.0/UMP, SysEx recording, score/notation, MIDI plug-ins, chase rules, MIDI clock, MTC, SMPTE, and sample-accurate MIDI/event delivery were not established.

## 8. Routing, mixer, automation, and control

**DOCUMENTED — C-004, C-010.** EnergyXT 1.4 documented free routing of effects and instruments. Later specifications retain a modular component view for MIDI/audio routing and document per-channel trim/volume/pan/mute/solo, four-band EQ, unlimited insert/send effects, shared sends, and any number of group channels.

**DOCUMENTED — C-010, C-018.** Mixer and VST parameters can be automated by sequencer clips and/or external MIDI. This establishes exposed parameter automation, not sample accuracy, gesture semantics, or stable parameter IDs.

**UNKNOWN — C-016, C-017.** Feedback legality, sidechains, multiple plug-in buses, surround/immersive layouts, VCAs, folders-as-buses, pre/post-fader semantics, automation interpolation, touch/latch/write modes, OSC, Mackie/HUI support, and synchronization details remain unknown.

## 9. Recording, comping, and media handling

**DOCUMENTED — C-008.** Tutorials show creating an Empty project, adding an audio track, selecting/activating audio inputs, metronome and loop controls, recording from the transport, waveform appearance after recording, and troubleshooting input channels in the Modular view. The vendor also documented multitrack direct-to-disk recording.

**DOCUMENTED — C-012.** Vendor pages list WAV (16/24/32-bit mono/stereo), AIFF, MIDI, MP3 through LAME, and REX/RX2 import, with REX2 limited to Windows/macOS. Export evidence includes WAV/AIFF/MP3 and offline WAV precision/rate controls.

**UNKNOWN — C-019, C-023.** Punch modes, take lanes, comping, recording pre-roll beyond a default four-beat count-in, media pool/collect, asset relinking, metadata, video, proxy/conform workflows, broadcast WAV, and destructive-versus-nondestructive guarantees are not established.

## 10. Instruments, effects, content, and native devices

**DOCUMENTED — C-011.** The desktop product includes a combined phase-modulation synthesizer/sampler, drum sampler/track, and chainable multi-effect processor. The synth supports layers/splits, filters, envelopes, four LFOs, four modulation envelopes, sample playback, chorus/flanger, delay, and reverb. Native effects listed are reverb, delay, guitar amp, chorus/flanger, phaser, bit crusher, filter, and compressor.

**DOCUMENTED — C-011, C-020.** The paid package advertised 400 Loopmasters loops and 32 multisampled instruments. Presets and sounds could be dragged from the browser and saved into reusable libraries.

**UNKNOWN — C-016.** No third-party native-device SDK, modular macro/container format, modulation-rate contract, or compatibility guarantee for device presets was found. Built-in devices are not evidence of a public native extension format.

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`DOCUMENTED` means the exact row format is named by retained primary evidence. Generic “VST” evidence is not silently promoted to VST2 or VST3. `UNKNOWN` means no version/OS-scoped proof was found.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Generic VST documented for Windows 1.4 and 2.x/3-era desktop; 2.x specs span all three desktop OSes. | Classic custom-folder behavior and secondary VST 2.4 reports make VST2 likely, but exact generation is not officially named. | C-013–C-016; S-001, S-007, S-009, S-010, S-015 |
| VST3 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No retained vendor page names VST3. | A KVR user reports 3.0 did not seem to support it; not qualification evidence. | C-015, C-016; S-015 |
| AUv2 | UNKNOWN | NOT_APPLICABLE: non-Apple OS | NOT_APPLICABLE: non-Apple OS | UNKNOWN | No vendor evidence. | macOS/iOS support cannot be inferred from platform availability. | C-016 |
| AUv3 | UNKNOWN | NOT_APPLICABLE: non-Apple OS | NOT_APPLICABLE: non-Apple OS | UNKNOWN | No vendor evidence. | No retained iOS-hosting detail page. | C-016, C-026 |
| AAX | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No vendor evidence. | No claim of AAX hosting. | C-016 |
| CLAP | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No vendor evidence. | Last vendor product evidence predates CLAP adoption; chronology is not proof of absence. | C-016 |
| LV2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No vendor evidence. | Linux availability is not evidence of LV2 hosting. | C-016 |
| LADSPA | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No vendor evidence. | ALSA/OSS/JACK evidence concerns audio I/O, not plug-in formats. | C-016 |
| DSSI | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No vendor evidence. | No claim. | C-016 |
| JSFX | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No vendor evidence. | No claim. | C-016 |
| DirectX/DXi | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No vendor evidence. | Windows availability is not evidence of DX/DXi hosting. | C-016 |
| Rack Extension | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No vendor evidence. | Separate ReWire VST transports Reason audio/MIDI; that is not Rack Extension hosting. | C-016, C-021; S-002 |
| Product-native/other | DOCUMENTED built-ins; UNKNOWN third-party format | DOCUMENTED built-ins; UNKNOWN third-party format | DOCUMENTED built-ins; UNKNOWN third-party format | UNKNOWN | Desktop built-in synth/sampler/drum/effects documented; ReWire VST is a separate add-on. | No public third-party native extension format found. | C-011, C-016, C-021; S-001, S-002, S-010 |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED — C-013.** A 2014 vendor tutorial directs users to File > Setup > Browser > Plugins > Add, select one or more VST folders, then drag an instrument from the browser to the track list or use Quick-add. Effects are chosen for insert/send slots. This proves a user-configured discovery path and successful instantiation workflow in the tutorial scope.

**UNKNOWN — C-017.** Scan timing, recursive rules, cache location, duplicate identity, shell plug-ins, validation, blacklist/quarantine, rescan/reset UX, scan logs, signature checks, and recovery after a crashing scanner were not described. Folder selection alone does not prove any of these.

### 11.3 Runtime isolation and compatibility

**DOCUMENTED — C-014.** EnergyXT itself could run as a VST plug-in in another host; 1.4 explicitly says the VST version can be loaded into another DAW, and 2.x specifications say it runs “as VST plugin.” This is a nested-host role, separate from the standalone ASIO/ALSA role.

**INFERENCE — C-015.** A 2019 KVR user reported Windows 3.0 hosted only 32-bit plug-ins; this is low-confidence secondary evidence and not generalized to other OSes.

**UNKNOWN — C-017.** No primary source establishes energyXT executable bitness, hosted-plug-in bitness, architecture bridging, in-process versus separate-process execution, sandboxing, crash containment, code-signing policy, or compatibility modes.

### 11.4 Host/plugin processing contract

**DOCUMENTED — C-013, C-018.** Vendor material distinguishes VST instruments from effects: instruments create/play tracks; effects occupy insert/send slots; instruments cannot be used as insert/send effects. Automatic plug-in delay compensation is documented at product level.

**UNKNOWN — C-017.** Audio bus counts/layouts, MIDI/event input/output, sidechains, multiple outputs, dynamic I/O, note expression, MPE, MIDI 2.0, sample-accurate events/automation, latency-change notifications, tail reporting, bypass/suspend, offline callbacks, and real-time safety obligations are not established.

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED — C-018.** Clip-based automation of all mixer and VST parameters and external-MIDI control are vendor-stated. Official tutorial listings include automation and VST effect topics.

**UNKNOWN — C-017, C-019.** Parameter IDs, ranges/text conversion, automation precision, preset-bank handling, VST state/chunk serialization, external asset references, missing-plug-in placeholders, migration between 1.x/2.x/3.0, and recovery after a plug-in disappears are undocumented. Native preset saving does not establish third-party plug-in state fidelity.

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED — C-022.** Editor windows can be docked into tabs, and the vendor linked a “Docking VSTs” tutorial. This supports some VST editor docking in the 2.x era, but the video content was not used to infer more.

**UNKNOWN — C-017, C-025.** Native versus generic plug-in UI selection, detach/always-on-top behavior, DPI/scaling, keyboard focus, headless operation, Cocoa/Carbon history, failure messages, per-plug-in logs, crash dialogs, and missing-GUI behavior were not established.

## 12. Extensibility and integration

**DOCUMENTED — C-022.** User-defined keyboard shortcuts, skinning, browser libraries, external MIDI parameter control, and use as a VST plug-in are the retained extension/integration boundaries.

**DOCUMENTED — C-021.** The separate ReWire VST add-on was a 32-/64-bit VST plug-in for Windows/macOS that exposed one stereo plus six mono audio channels and up to 128 MIDI mappings to Reason, with optional transport synchronization. It must not be described as energyXT’s internal ReWire implementation.

**UNKNOWN — C-016, C-024.** No scripting language, command API, OSC/remote API, controller SDK, native device SDK, public project-file API, extension ABI, or stability/versioning policy was found.

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED — C-012, C-022.** Vendor tutorials show New/Open/Save As, predefined project setups, and full undo/redo; specifications identify `.xtc` as a self-contained reusable **part/clip** format.

**UNKNOWN — C-019.** The project file extension and representation are not named in retained primary sources.

**DOCUMENTED — C-012.** Interchange is media-oriented: MIDI, WAV, AIFF, MP3/LAME, and REX/RX2 import evidence; WAV/AIFF/MP3 and multitrack audio export evidence. `.xtc` supports reuse within XT projects, not an open interchange standard.

**UNKNOWN — C-019, C-027.** Autosave, crash recovery, archive/collect, project embedding versus references, relinking, version migration, backward/forward compatibility, missing-plug-in placeholders, AAF/OMF/ADM/MusicXML/DAWproject, stems metadata, cloud collaboration, and version control are not established. A user review alleges 1.x-to-2.x incompatibility, but no primary migration statement was retained.

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED — C-006, C-012.** Delivery functions include bounce, freeze, multitrack export, MP3/AIFF/WAV export, and offline 16/24/32-bit mono/stereo WAV at arbitrary sample rates. Time-stretch, reverse, slicing tutorial links, and clip reuse support composition/beat workflows.

**DOCUMENTED — C-021.** ReWire VST provided a specialized Reason integration workflow in other VST hosts, including energyXT.

**UNKNOWN — C-023.** No dedicated clip-launch scenes, show control, batch queue, loudness measurement, DDP, video/timecode/ADR, surround, immersive/ADM, or broadcast delivery evidence was found. Editing during playback and modular routing alone do not establish a stage-performance system.

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED — C-002, C-006.** Vendor pages marketed energyXT as lightweight/laptop-friendly and documented low historical minimum requirements, thread-based streaming, and freeze. These are vendor claims and specifications, not benchmarks.

**INFERENCE — C-003.** Present-day deployment risk is high because the original domain is repurposed, current installers/updates were not authenticated, and supported contemporary OS ranges are unknown. No installer was downloaded or executed.

**UNKNOWN — C-017, C-025.** Scaling limits, stress-test results, crash containment, telemetry/privacy, secure update/signing/notarization, rollback, vulnerability handling, accessibility APIs, screen-reader/keyboard completeness, localization, and modern hardware/OS support are not documented in retained trustworthy material.

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED — C-020.** In 2018 the vendor sold energyXT for €19 by e-mail delivery, allowed license installation on all of the buyer’s PC/Mac machines, included content, and advertised free updates. Serial entry/activation support was documented. These sales statements do not establish transferability, source availability, redistribution, perpetual support, or a complete EULA.

**DOCUMENTED — C-021.** ReWire VST had a separate €29 license and product identity. Loopmasters content was bundled, so content rights are not presumed to match application-code rights.

**UNKNOWN — C-016, C-020.** The proprietary energyXT license text, project-format rights, VST SDK generation/license used, trademark permissions, third-party redistribution, ReWire licensing history, and certification obligations were not retrieved. Naming VST, ReWire, ASIO, zplane, LAME, or Loopmasters grants no compatibility, SDK, trademark, or redistribution right. This dossier is not legal advice.

## 17. Strengths, liabilities, and architecture lessons

**INFERENCE — C-028, based on C-004 and C-005.** Strength: the product visibly unifies modular routing with a track/timeline and mixer rather than forcing one representation. This makes it a useful clean-room reference for coordinating multiple views over one conceptual graph, provided the underlying data model is independently designed.

**INFERENCE — C-028, based on C-007 and C-010.** Strength: ghost parts, self-contained library clips, browser drag-and-drop, clip automation, groups, and per-track arpeggiation emphasize rapid composition with a compact surface. Tradeoff: documentation does not show how identity, references, or automation survive migrations.

**INFERENCE — C-003, C-015.** Liability: stale platform evidence and only low-confidence clues about exact VST generation/bitness increase present-day deployment risk.

**UNKNOWN — C-016–C-019, C-025.** Undocumented format coverage, crash isolation, full host contracts, project/state recovery, and current reliability make energyXT unsuitable as a direct interoperability or durability benchmark without disposable qualification tests.

## 18. Transferable patterns

1. **Graph plus timeline projections — CANDIDATE.** Problem: routing flexibility conflicts with linear-arrangement usability. Minimal mechanism: one independently designed typed audio/MIDI device graph with synchronized modular, track, and mixer projections. Support: C-004, C-005, C-010. Prerequisites: stable object identity and explicit graph validation. Tradeoffs: cross-view consistency and undo complexity. Adaptation risk: medium; public behavior is reference material, not an implementation recipe. [C-028]
2. **Reusable linked parts — CONDITIONAL.** Problem: repeated musical material drifts when copied. Minimal mechanism: reusable clip definition plus linked instances, with explicit break-link semantics. Support: C-007, C-012. Prerequisites: durable IDs and deterministic edits. Tradeoffs: user confusion about shared edits; persistence semantics are unknown in energyXT. [C-028]
3. **Role-aware plug-in insertion — CANDIDATE.** Problem: instruments and effects need different default routing. Minimal mechanism: capability-aware browser actions that create an instrument track or effect slot. Support: C-013. Prerequisites: independently qualified format descriptors and dynamic-I/O handling. Tradeoffs: devices with mixed roles; energyXT’s full contract is unknown. [C-028]
4. **Host-as-plug-in composition — CONDITIONAL.** Problem: users want a compact environment nested in another DAW. Minimal mechanism: a separately qualified plug-in facade over transport, state, audio, and MIDI boundaries. Support: C-004, C-014. Prerequisites: recursion policy, deterministic state, PDC, bus negotiation, and crash strategy. Tradeoffs: nested latency/state/focus complexity. [C-028]

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject copying proprietary internals/UI.** No public implementation exists; modular naming and screenshots do not authorize copying expression or infer internals. Reopen only if lawfully licensed public source appears. [C-024]
- **Reject generic “VST” as proof of VST2 or VST3.** Official pages never name the generation. Reopen with a versioned vendor manual, immutable binary metadata in a lawful fixture, or a disposable qualification matrix. [C-015, C-016]
- **Reject “32-bit audio engine” as binary bitness.** It is a processing-precision statement. Reopen with signed package metadata or a safe test fixture. [C-006, C-017]
- **Reject ReWire VST conflation.** It is a separately sold bridge/add-on, not the energyXT VST build and not Rack Extension hosting. [C-021]
- **CURIOSITY_NO_GO — SEO/current-domain articles.** Rejected because the domain is repurposed and content provenance is unrelated to XT Software product documentation. [C-003]
- **CURIOSITY_NO_GO — iOS/Android deep dive.** The iOS detail page was inaccessible and Android was only announced; neither changes the desktop modular/hosting decision. Reopen for a mobile-DAW synthesis. [C-026]
- **CURIOSITY_NO_GO — user crash/performance anecdotes.** Low decision value without controlled fixtures; they cannot establish process isolation or scheduler design. [C-017, C-025]
- **CURIOSITY_NO_GO — project-file reverse engineering or installer execution.** Outside the documentary/legal/safety budget. Reopen only in an authorized disposable harness with provenance-checked media. [C-019, C-024]

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Result | Evidence and adversarial boundary |
| --- | --- | --- |
| H1: energyXT’s defining model is a modular graph plus sequencer/mixer. | Supported for 1.4 and 2.x/3-era UI. | 1.4 says modular MIDI/audio sequencer and free routing; later specs retain Modular, Sequencer, and Mixer views. This does not reveal the internal graph implementation. [C-004, C-005, C-024] |
| H2: version/platform support must be separated. | Supported. | 1.4 page is Windows; 2010 specs cover three desktop OSes; 2018 downloads are 3.0 Windows/macOS versus 2.7 Linux. [C-002, C-004] |
| H3: energyXT-as-VST and ReWire VST are distinct. | Supported. | EnergyXT 1.4/later can itself run as VST; ReWire VST has separate specs, channels, MIDI maps, price, and download. [C-014, C-021] |
| H4: “VST support” proves VST2. | Not proven. | Custom folders and reports favor the hypothesis, but no retained primary page names VST2/VST 2.4. [C-015, C-016] |
| H5: “VST support” proves VST3. | Not proven; secondary counterevidence. | No primary VST3 mention; one user says 3.0 did not appear to support it. [C-015, C-016] |
| Format accepted vs scanned. | Only partly distinguished. | Folder addition proves a discovery path; scan/validation timing is unknown. [C-013, C-017] |
| Scanned vs instantiated. | Tutorial supports instantiation for selected VST instrument/effect examples. | Drag-to-track and insert/send steps are documented; no adversarial plug-in matrix exists. [C-013] |
| Instantiated vs full host contract. | Full contract remains unknown. | No evidence for sidechains, multi-out, dynamic I/O, state migration, sample accuracy, crash containment, or UI scaling. [C-017] |
| Later dynamic probe. | Unperformed. | Safest discriminator is a provenance-checked 3.0 fixture plus known VST2/VST3, 32/64-bit, instrument/effect, multi-out, sidechain, latency, state, and crash-probe plug-ins in a disposable VM; separate by OS. |

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Jørgen Aase first released energyXT in 2003; XT Software published the archived product. | Family provenance | S-003 | Direct vendor support statement. | Does not prove market size or uninterrupted company status. |
| C-002 | DOCUMENTED | High | Last retrieved vendor download state was 3.0 Windows/macOS and 2.7 Linux. | 2018 desktop | S-001, S-010, S-012 | Direct download labels plus historical requirements. | Not proof no later build existed. |
| C-003 | INFERENCE | Medium | Product appears unavailable/unmaintained at its original domain. | 2026 status | S-013, S-015; negative search log | Current domain is unrelated; KVR says no longer available. | No formal vendor discontinuation notice/date. |
| C-004 | DOCUMENTED | High | EnergyXT 1.4 was a Windows modular MIDI/audio sequencer with free device routing and standalone/VST builds. | 1.4 Windows | S-009 | Direct archived vendor page. | Do not project all 1.x functions into 2.x/3.0. |
| C-005 | DOCUMENTED | High | 2.x-era UI combined modular routing, sequencer/arrange, mixer, browser, tracks, and docked tabs. | 2.x; retained on 2018 page | S-001, S-007, S-010 | Direct vendor feature/specification text. | Internal data model unknown. |
| C-006 | DOCUMENTED | High | Engine was described as 32-bit with threaded disk work, zplane stretch, automatic PDC, freeze/bounce, and offline WAV render. | 2.x/3-era desktop | S-001, S-010 | Direct vendor specs. | Audio precision is not executable bitness; PDC limits unknown. |
| C-007 | DOCUMENTED | High | Track/part model includes unlimited MIDI/audio/drum/folder tracks, ghost parts, grids, per-track arpeggiation/swing, and clip automation. | 2.x/3-era | S-001, S-007, S-010 | Direct vendor docs. | Comping/takes/versioning unknown. |
| C-008 | DOCUMENTED | High | Recording setup uses ASIO on Windows, selectable devices on macOS, and JACK for Linux recording, with track/component input routing. | 2010–2011 desktop | S-005, S-010 | Official-linked vendor tutorial/spec. | Modern OS/device support unknown. |
| C-009 | DOCUMENTED | High | MIDI hardware, per-track input/velocity, drum mapping, piano-roll/step functions, and arpeggiator randomness are documented. | 1.x/2.x | S-006, S-009, S-010 | Direct vendor material. | Expression/MIDI 2.0/clock details unknown. |
| C-010 | DOCUMENTED | High | Mixer has inserts/sends/groups/EQ and mixer/VST parameters are automatable by clips or external MIDI. | 2.x/3-era | S-001, S-007, S-010 | Direct vendor docs. | Automation accuracy/IDs and routing edge cases unknown. |
| C-011 | DOCUMENTED | High | Built-ins include synth/sampler, drum sampler, and chainable effects/content. | 2.x/3-era | S-001, S-004, S-007, S-010 | Direct vendor inventory. | No public third-party native SDK inferred. |
| C-012 | DOCUMENTED | High | `.xtc` stores self-contained library clips; listed media include WAV/AIFF/MIDI/MP3 and REX/RX2 with scoped limits. | 2.x/3-era | S-001, S-007, S-010 | Direct vendor specs/tutorials. | `.xtc` is not proven to be project format. |
| C-013 | DOCUMENTED | High | VST discovery uses user-added folders; instruments create tracks and effects use insert/send slots. | 2014 2.x-era UI | S-007 | Step-by-step vendor tutorial. | Does not document scanner internals or every plug-in. |
| C-014 | DOCUMENTED | High | EnergyXT itself was available as a VST plug-in nested in another DAW/host. | 1.4 and 2.x-era | S-001, S-009, S-010 | Explicit vendor wording. | Exact VST generation, buses, and state unknown. |
| C-015 | INFERENCE | Low–Medium | Hosted format was likely classic VST2; VST3 support is doubtful. | Mainly Windows 3.0 | S-007, S-009, S-015 | Custom folders/legacy package names plus user VST2.4/no-VST3 report. | No primary exact-generation statement or controlled test. |
| C-016 | UNKNOWN | Low | Exact VST2/VST3 and all non-generic-VST third-party format support are unresolved by OS/version. | Family | Attempted S-001, S-007, S-009, S-010, S-015 | Official material says only “VST.” | Next probe is versioned manual or disposable qualification. |
| C-017 | UNKNOWN | Low | Scanner validation, runtime isolation/bridging, deep processing contract, state, UI, and diagnostics are undocumented. | Desktop plug-in host | Attempted S-001, S-007, S-010, S-015 | Absence is recorded, not treated as unsupported behavior. | Requires manual/source or dynamic host probes. |
| C-018 | DOCUMENTED | High | Automatic PDC and clip/external-MIDI automation of VST parameters are vendor-stated. | 2.x/3-era | S-001, S-010 | Direct specification. | Precision, latency changes, and persistence unknown. |
| C-019 | UNKNOWN | Low | Project extension/schema, dependency recovery, migration, autosave, and archive behavior are unresolved. | Family persistence | Attempted S-007, S-010, S-015 | New/Open/Save and `.xtc` clips are insufficient. | Secondary incompatibility allegation not promoted to fact. |
| C-020 | DOCUMENTED | High | 2018 license sale was €19, serial/e-mail delivered, installable on buyer’s PC/Mac machines, with free updates advertised. | 2018 sales terms | S-003, S-004 | Direct vendor shop/support text. | Not a full EULA or present availability. |
| C-021 | DOCUMENTED | High | ReWire VST was a distinct 32/64-bit Windows/macOS add-on with stated audio/MIDI channels and separate price. | 2018 add-on | S-002, S-004, S-012 | Direct vendor product/shop text. | Does not establish energyXT executable bitness or Rack Extension hosting. |
| C-022 | DOCUMENTED | High | Full undo/redo, shortcuts, skinning, browser search, docked tabs, and VST docking topic are documented. | 2.x/3-era UI | S-001, S-007, S-010 | Direct vendor pages/tutorial index. | Persistence/accessibility details unknown. |
| C-023 | UNKNOWN | Low | Dedicated live, notation, post, surround, and delivery-specialist models were not established. | Family workflows | Attempted S-001, S-007, S-010 | No absence claim from one manual. | Reopen with full manual or controlled product inspection. |
| C-024 | UNKNOWN | Low | Proprietary process/thread/graph/storage internals remain unknown. | Architecture internals | Attempted all primary sources | Public features do not reveal implementation. | Lawful public source or safe probe required. |
| C-025 | UNKNOWN | Low | Current reliability, security, privacy, accessibility, signing, and diagnostics are unresolved. | Current suitability | Attempted S-001, S-003, S-010, S-013 | Historical minimum requirements are insufficient. | Needs current supported build/vendor policy and tests. |
| C-026 | DOCUMENTED | Medium | Vendor listed separate iOS energyXT; Android page announced an inspired app as coming soon, not a proven release. | Mobile boundary | S-008, S-016, S-015 | Vendor listing/announcement; KVR supplies only secondary iOS 1.2. | iOS detail page transport failed; Android release unknown. |
| C-027 | UNKNOWN | Low | Formal project interchange/collaboration support is not established. | Persistence/ecosystem | Attempted S-001, S-007, S-010 | Media import/export is not project interchange. | Requires full manual or project inspection. |
| C-028 | INFERENCE | Medium | Graph/timeline projections, linked clips, role-aware insertion, and host-as-plug-in are clean-room pattern candidates. | Architecture synthesis | C-004, C-005, C-007, C-013, C-014 | Bounded design interpretation of public behavior. | Alternative: simpler independent views may not share one internal graph. |

## 22. Source ledger and adaptive bibliography

- **S-001 — “energyXT for PC and Mac OS X / Technical specifications,” XT Software.** https://web.archive.org/web/20181027163624id_/http://energy-xt.com/energyxt.html — archived official product page; scope: last retrieved 2018 desktop state. Passages: download links (3.0 Windows/macOS, 2.7 Linux), feature list, audio engine, sequencer, mixer, native devices. Supports C-002, C-005–C-007, C-010–C-012, C-014, C-018, C-022. Limitation: “VST” generation and build bitness unspecified. Selected over contemporary summaries because it is the last retrieved vendor page.
- **S-002 — “ReWire VST (32/64-bit),” XT Software.** https://web.archive.org/web/20181102050538id_/http://energy-xt.com/rewire-vst.html — archived official add-on page; scope: 2018. Passages: separate VST add-on role, OSes, 1 stereo/6 mono channels, 128 MIDI mappings, sync. Supports C-021. Limitation: no underlying ReWire/VST contract. Selected to prevent product-role conflation.
- **S-003 — “Support/About,” XT Software.** https://web.archive.org/web/20181103151100id_/http://energy-xt.com/support.html — archived official support page; scope: 2018. Passages: first released in 2003 by Jørgen Aase; serial activation; official tutorial links. Supports C-001, C-020. Limitation: not release notes/EULA. Selected for primary provenance.
- **S-004 — “Shop,” XT Software.** https://web.archive.org/web/20181103150946id_/http://energy-xt.com/shop.html — archived official sales page; scope: 2018. Passages: €19 energyXT terms, machines, content/free updates; separate €29 ReWire VST. Supports C-011, C-020, C-021. Limitation: marketing summary, not full license. Selected for contemporaneous commercial boundary.
- **S-005 — “Recording audio in energyXT,” jorgen.xt / energyXT official-linked blog.** http://energyxt.blogspot.com/2011/02/recording-audio-in-energyxt.html — vendor-authored tutorial linked by S-003; scope: 2011 2.x-era desktop. Passages: ASIO/macOS/JACK setup, Empty project, track routing, recording, normalize/external editor, Modular inputs. Supports C-008. Limitation: predates 3.0. Selected because it documents actual user steps.
- **S-006 — “Using a MIDI keyboard in energyXT,” jorgen.xt / energyXT official-linked blog.** http://energyxt.blogspot.com/2010/11/using-midi-keyboard-in-energyxt.html — vendor-authored tutorial; scope: 2010 2.x. Passages: device activation, track inputs, synth/drum mapping, velocity. Supports C-009. Limitation: no advanced MIDI contract. Selected for primary workflow evidence.
- **S-007 — “Energy XT Tutorials,” XT Software AS.** https://web.archive.org/web/20150419013910id_/http://www.energy-xt.com/index.php?id=0104 — archived official tutorial collection; page copyright 2014. Passages: projects, browser, sequencer, drums, mixer, VST folder setup/insertion, MP3. Supports C-005, C-007, C-010, C-012, C-013, C-019, C-022. Limitation: exact product build/generation unnamed. Selected because it gives the deepest official VST discovery evidence.
- **S-008 — XT Software home/products page.** https://web.archive.org/web/20150114073845id_/http://www.energy-xt.com/ — archived official page; copyright 2014. Passages: product lineup including energyXT PC/Mac and iOS, ReWire VST, XTS1, M3. Supports C-026 and edition boundaries. Limitation: overview only. Selected to establish same-vendor product separation.
- **S-009 — “energyXT 1.4 - Modular MIDI & audio sequencer,” XT Software AS.** https://web.archive.org/web/20150423173244id_/http://www.energy-xt.com/index.php?id=0102 — archived official legacy page; copyright 2014. Passages: VST instruments/effects, standalone/VST versions, free routing, ASIO, freeze/groove/ghost clips, sampler. Supports C-004, C-009, C-014. Limitation: Windows 1.4 only. Selected to separate 1.x architecture and plug-in role.
- **S-010 — “Specifications,” XT Software AS.** https://web.archive.org/web/20150000000000id_/http://www.energy-xt.com/index.php?id=0113 — archived official specification page; copyright 2010. Passages: OS requirements, interface/workflow, tracks/clips/mixer/native devices, 32-bit engine, PDC, render, VST role. Supports C-002, C-005–C-012, C-014, C-018, C-022. Limitation: exact snapshot URL is a Wayback temporal resolver; no release number on page. Selected as broadest primary specification.
- **S-012 — XT Software 2018 homepage.** https://web.archive.org/web/20181103150942id_/http://energy-xt.com/index.html — archived official overview. Passages: desktop workflow and separate 32/64-bit ReWire VST. Supports C-002, C-021. Limitation: marketing summary. Selected to triangulate the 2018 state.
- **S-013 — Current energy-xt.com homepage.** https://www.energy-xt.com/ — current page, retrieved 2026-08-29. Scope: domain status only. It contains unrelated “Rhythm Melody” and spam content. Supports C-003 only as evidence of domain repurposing. Limitation: not XT Software product documentation and potentially compromised; no product claims retained. Selected to test current vendor availability, preferable to assuming archival status.
- **S-015 — “energyXT by XT Software,” KVR Audio product database.** https://www.kvraudio.com/product/energyxt-by-xt-software — secondary database/current page. Passages: “No Longer Available,” versions 3.0/3.0/2.7/iOS 1.2, generic VST host/plugin classification, and clearly attributed user reports about VST2.4, absent VST3, 32-bit-only hosting, and 1.x/2.x compatibility. Supports only C-003, C-015, C-019, C-026 at secondary/low confidence. Limitation: vendor text is mixed with user submissions/reviews and is not independent qualification. Selected as the only accessible triangulation for current availability/exact-VST gap; preferable to unattributed search snippets.
- **S-016 — “Android,” XT Software.** https://web.archive.org/web/20200426144758id_/http://energy-xt.com/android.html — archived vendor page, copyright 2019. Passage: “Inspired by energyXT” app “coming soon,” part-based sequencer, master and 128 instrument tracks, WAV export. Supports C-026. Limitation: no release proof and not the desktop product. Selected to bound rather than expand the mobile family.

**Unnumbered discovery/negative-source record:** Internet Archive CDX metadata for `energy-xt.com/*` located archived official pages but proves capture availability only, not product behavior; a separate CDX query found no `energy-xt.com/*.pdf`. The archived 2017 XT Software update endpoint said “already have the latest version” without identifying any build, so it cannot support release chronology. Direct web search returned HTTP 429 twice; Bing later returned irrelevant results; the 2.x Main Features page returned HTTP 503; the archived iOS detail page had a transport error; no formal discontinuation notice, EULA, release notes, or full manual was recovered. These records are intentionally unnumbered because they support no C-nnn claim, and the failures are not evidence of unsupported behavior.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Impact | Safest next probe | Required access/fixture; owner |
| --- | --- | --- | --- | --- |
| Exact VST2/VST3 support by version/OS | Official pages say only VST; searches rate-limited/irrelevant; no PDF manual. | High: format matrix and migration design. | Locate a versioned official manual/release note; otherwise inspect authenticated package metadata and run known VST2/VST3 fixtures. | Disposable VM, lawful installer/license, instrument/effect fixtures; unassigned. |
| energyXT/hosted-plug-in bitness | “32-bit engine” is not binary architecture; only a user report says 32-bit plug-ins. | High: compatibility/bridging. | Signed executable metadata plus 32/64-bit probe matrix by OS. | Provenance-checked 3.0/2.7 packages; unassigned. |
| Scanner/cache/blacklist/recovery | Folder setup tutorial only. | High: reliability/security. | Record clean scan, rescan, duplicate, malformed, and crash-probe behavior in disposable OS snapshots. | Safe synthetic plug-ins; unassigned. |
| Isolation/process/crash containment | No public internals or diagnostics docs. | High: host architecture lesson. | Observe process tree and controlled plug-in crash without reverse engineering. | Disposable VM and synthetic crash probe; unassigned. |
| Full processing contract | No bus/sidechain/multi-out/dynamic-I/O/sample-accuracy docs. | High: interoperability. | Automated audio/MIDI/latency/state qualification suite. | Known conformance-style fixtures; unassigned. |
| Plug-in state/presets/missing recovery | Native preset and Save evidence insufficient. | High: project durability. | Save/reopen projects with opaque state, external assets, missing/restored plug-ins, then compare. | Lawful build and deterministic fixtures; unassigned. |
| Project extension/schema/migration | No official project-format page; `.xtc` is clip-only; user incompatibility report is secondary. | High: persistence/reference design. | Obtain official manuals; then behavioral round-trip across 1.4/2.7/3.0 without parsing proprietary data. | Licensed historical builds/projects; unassigned. |
| Current maintenance/legal status | Domain repurposed; KVR says unavailable; no vendor closure notice/EULA. | Medium–high: procurement/security/legal. | Company/registrar/vendor-contact and lawful license-record research; counsel review if needed. | Organizational/legal research; unassigned. |
| iOS release/features/project compatibility | Official listing only; detail capture failed; KVR secondary version. | Low for desktop decision. | Archived App Store/vendor records if mobile synthesis requires it. | Public archive; unassigned. |
| Android release | Vendor said “coming soon,” no release proof. | Low. | Archived store/package listing, not installer mirrors. | Public archive; unassigned. |
| Accessibility/security/privacy | No trustworthy policies or current build docs. | Medium for present suitability. | Locate signed release/support policies or test only in authorized current fixture. | Current vendor/build; unassigned. |

## 24. Curiosity pass and stop decision

| Rank/thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Exact VST generation/bitness | 4/4 | 4/4 | 4/4 | 2/4 | **Pursued.** Official custom-folder evidence plus KVR triangulation found, but exact generation remains unknown. |
| Project format/migration | 3/4 | 3/4 | 3/4 | 3/4 | **CURIOSITY_NO_GO.** No primary manual; dynamic/file work outside documentary budget. |
| Scanner/isolation internals | 4/4 | 4/4 | 4/4 | 4/4 | **CURIOSITY_NO_GO.** Requires controlled executable probes, not more marketing pages. |
| iOS/Android family | 1/4 | 1/4 | 2/4 | 2/4 | **CURIOSITY_NO_GO after boundary check.** Mobile evidence does not alter desktop conclusion. |
| User reliability anecdotes | 2/4 | 2/4 | 2/4 | 4/4 | **CURIOSITY_NO_GO.** Low evidentiary value without fixtures. |
| SEO/current-domain energyXT articles | 0/4 | 0/4 | 0/4 | 1/4 | **CURIOSITY_NO_GO.** Repurposed-domain content lacks XT Software provenance. |

**Stop decision:** stop on sufficient template coverage, primary-source saturation, repeated search/access failures, and nonpositive marginal documentary evidence. All required rows and sections are filled; the remaining high-value gaps require a later authorized dynamic qualification phase. The source budget was spent on archived vendor pages and one bounded secondary triangulation. Confidence and unknowns are explicit rather than filled from memory.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added `research/daw-landscape/dossiers/energyxt.md`; no sibling/shared file was changed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0 separates 1.4, 2.x, 3.0/2.7, desktop/mobile context, energyXT plug-in, and ReWire VST.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive prose uses DOCUMENTED, INFERENCE, or UNKNOWN and cites C-IDs.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See Sections 21–23.
- [x] **Every required plugin-format row is present.** All 13 mandated rows appear in Section 11.1 with no blank cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Discovery, roles, isolation, buses, state, UI, recovery, automation, and PDC are separated.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Generic VST is not promoted to VST2/VST3; vendor claims are not benchmarks.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 covers sales terms, missing EULA/SDK rights, trademarks, and no implied redistribution.
- [x] **Bibliography records source rationale and limitations.** Section 22 records publisher, URL, kind/scope, passages, claims, limits, and selection rationale.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary web/archive retrieval only; no installers/binaries were downloaded or run.

**Checks performed:** governing-file/template review; archived-origin tracing; source-by-source claim audit; exact-format adversarial check; all-format-row scan; heading-order scan; ownership/status check. **Concise result:** complete with consequential unknowns centered on exact VST generation/bitness, host contracts, persistence, and maintenance. **Unresolved blockers:** rate-limited search, missing official PDF/manual/release notes/EULA, inaccessible iOS page, proprietary internals, and no authorized dynamic fixture. **Pre-existing workspace state:** `git status --short -- research/daw-landscape` showed the research tree as untracked before this file was created; it was left otherwise untouched.
