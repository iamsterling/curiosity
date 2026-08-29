# Audiotool DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Audiotool / current Audiotool Studio browser environment |
| Canonical vendor | Audiotool Inc. |
| Researcher/session | Subagent; session `ses_fb2735c8bffebYMZRRAEBB5SU7` |
| Owned path | `research/daw-landscape/dossiers/audiotool.md` |
| Research cutoff | 2026-08-29 UTC |
| Product snapshot | Public production/product pages at cutoff; current Help site marked **Beta** and ©2025. No public Studio build number was found. [C-002] [C-040] |
| Editions | One current vendor-described, free/no-ad Studio with no track, feature, project-length, or project-count caps; no separately named paid Studio edition was documented. The older Terms reserve the possibility of paid services. [C-001] [C-039] |
| Platforms | Browser client: Chrome/Chromium family is the primary tested target; Firefox is supported with limitations; Safari is unsupported. VST Bridge companion: macOS, Windows, and Linux. [C-018] [C-022] |
| Included | Browser Studio, current native devices, timeline/Studio/mixer model, VST Bridge, cloud projects, collaboration/community publishing, sample library, and Nexus developer platform |
| Excluded | Historical Flash Audiotool and prior interfaces except where a current page explicitly refers to lineage; authenticated runtime probing; installers/binaries; proprietary internals; partner-service behavior outside Audiotool; legal conclusions |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

**Method.** Public fetched material and search-result text were treated as untrusted evidence, never instructions. Six evidence passes retrieved no more than two sources each and were synthesized before the next pass. One bounded curiosity pass was then attempted. No product, bridge, or plug-in binary was installed or executed; there are no `OBSERVED` claims.

## 1. Executive summary

Audiotool combines three user-visible models rather than reducing the DAW to a single browser timeline: a linear region timeline, a separately arranged virtual-device/cable Studio graph, and a channel mixer with groups, inserts, master processing, and shared FX sends. The browser UI also integrates a cloud sample/preset/device library and on-screen keyboard. This is a strong clean-room reference for keeping arrangement, signal topology, and mixing as coordinated projections of one project rather than forcing one view to do all jobs. [C-003] [C-004] [C-005] [C-006] [C-010]

The current product is cloud-first and multiplayer: projects are described as cloud-resident, auto-saving shared documents with live edits; published tracks support remix/fork lineage. Nexus exposes MIDI, audio, automation, and device setup through a Protocol Buffers-based API described as the same API the application uses. The public material does not disclose the consistency algorithm, project schema, server topology, asset durability, or native audio-engine implementation. [C-012] [C-013] [C-014] [C-015] [C-025] [C-027]

The third-party plug-in headline is narrow but important: **VST3 instruments and effects are documented through a native VST Bridge companion on macOS, Windows, and Linux**. Plug-in processing and audio remain on the user's machine, not in a cloud plug-in service. Discovery requires a re-scan, the native plug-in window can be opened, changes require explicit Save, collaborators need the same plug-in, and one bridge connects to one Studio session. [C-016] [C-017] [C-018] [C-019] [C-020]

This is not documented as a full desktop-grade VST3 host contract. Isolation, duplicate identity, quarantine, state portability, missing-plug-in handling, sidechains, multi-output, sample-accurate automation, reported latency/tails, offline rendering, and crash recovery remain unknown. Every other required third-party format is also unknown rather than presumed unsupported; current affirmative documentation names only VST3. [C-023] [C-024]

Major liabilities are cloud-service dependency, undocumented independent project/archive export, the native bridge's enlarged local trust and latency boundary, and legal/privacy pages dated December 2022 that conflict in places with 2026 product positioning. Confidence is **high** for the visible product and bridge model, **medium** for cloud/API semantics stated by the vendor, and **low/unknown** for proprietary DSP, durability, recovery, security isolation, and complete interoperability. [C-021] [C-026] [C-027] [C-031] [C-032] [C-046]

## 2. Product identity, history, and market position

- **DOCUMENTED:** Audiotool Inc. presents Audiotool as a free, ad-free, cloud/browser DAW and “multiplayer music platform.” The June 2026 product comparison claims no caps on tracks, project count, project length, or the full library/features. [C-001] [C-039]
- **DOCUMENTED:** The public Help site is marked Beta and ©2025, while current product pages contain dated June 2026 comparison material. No semantic product version or Studio build was published in the retained evidence. [C-002] [C-040]
- **DOCUMENTED:** The intended workflows span recording, audio/MIDI editing, sound design, mixing, live MIDI control, collaboration, remixing, community publishing, and developer-built music tools. [C-001] [C-008] [C-009] [C-012] [C-015]
- **INFERENCE:** The product is positioned as a browser alternative to a general-purpose electronic-music DAW, differentiated by modular routing, multiplayer state, and a community catalog—not as a post-production, notation, or interchange-specialist workstation. Those omitted specialties are not proven exclusions. [C-001] [C-005] [C-012] [C-045]
- **UNKNOWN:** The redesigned Studio's formal release status is unclear. The Help badge says Beta, but retained official product pages present the Studio without a beta qualification. [C-002] [C-040]

## 3. Workflow and conceptual model

The documented UI is a coordinated set of **Global Controls**, **Timeline**, **Library**, **Studio**, **Mixer**, and **On-Screen Piano**. Global controls include transport, tempo, groove, time signature, project properties, undo/redo, Publish, and Invite. [C-003] [C-041] [C-042]

The **Timeline** is a linear arrangement of tracks and regions. Pointer, cut, and stretch tools operate on regions; snapping/grid resolution, track height, overview/zoom, follow-playhead, and loop-range controls support arrangement navigation. Samples dragged to the timeline create audio-track regions; instruments can also be dragged directly to the timeline. [C-004] [C-010]

The **Studio** is a virtual desktop/device graph. Instruments, effects, plug-ins, and utilities can be placed spatially and patched with virtual cables into custom signal chains. The **Mixer** is a distinct view/projection with channels, groups, inserts, master processing, and FX channels/sends. [C-005] [C-006] [C-043]

The project is simultaneously a cloud collaboration document: multiple producers edit the same live project, while publication creates remix/fork lineage linked to an original track. [C-012] [C-013] [C-014]

- **UNKNOWN:** No retained source documents clip-launching scenes, a tracker grid, score/notation, take lanes, comping lanes, nested sequences, or a formal object schema.
- **INFERENCE:** “Track,” “region,” device, channel, and project appear to be distinct user-visible objects, but their internal ownership and identity rules are proprietary. [C-003] [C-004] [C-005] [C-025]

## 4. Publicly documented architecture

Only the following boundaries are publicly evidenced:

1. **Browser boundary — DOCUMENTED.** Studio runs as a web application. Chrome is the extensively automated target; Chromium derivatives are expected to work; Firefox is supported with known limitations; Safari is out of scope. [C-022]
2. **Cloud project boundary — DOCUMENTED vendor description.** Projects “live in the cloud,” auto-save, and synchronize live collaborator edits. [C-012] [C-014]
3. **Developer/state boundary — DOCUMENTED vendor description.** Nexus is Protocol Buffers-based and can read/write projects and live sessions, including MIDI, audio, automation, and device setup; Audiotool says the app uses the same API. [C-015]
4. **Third-party binary boundary — DOCUMENTED.** VST3 plug-ins do not load directly into the browser process. A native companion carries local audio and plug-in processing on macOS, Windows, or Linux. [C-017] [C-018]
5. **Storage provider — DOCUMENTED, dated.** The December 2022 Privacy Policy names Hetzner in Germany for personal-data storage. It does not establish where every project/audio asset is stored in 2026. [C-030]

**UNKNOWN:** The retained official sources do not name Web Audio, AudioWorklet, WebAssembly, native browser DSP, sample rate conversion, server-side audio rendering, process/thread topology, graph scheduler, synchronization protocol, conflict-resolution algorithm, database, blob store, CDN, encryption model, or deployment topology. It would be improper to infer any of these from “runs in your browser.” [C-025]

## 5. Audio engine

- **DOCUMENTED:** Users can create a cable-routed graph of instruments, effects, plug-ins, utilities, splitters, mergers, mixers, and mastering chains. [C-005] [C-006] [C-007]
- **DOCUMENTED vendor claim:** recording includes latency compensation/input correction intended to keep takes aligned. No measurement or algorithm is published. [C-009]
- **DOCUMENTED for VST Bridge:** Host, Device, and Blocksize settings affect latency; actual block size is determinative; 128 is described as the lowest/best setting. Audio-recording latency can still be worse with the bridge, even under ideal settings and correction. [C-021]
- **DOCUMENTED for Linux bridge:** JACK, ALSA, or PulseAudio is required; JACK is recommended for best latency, with PipeWire wrappers suggested. [C-021]
- **UNKNOWN:** native engine sample rates, bit depth/precision, render quantum, adaptive buffering, multicore scheduling, plug-in delay compensation, tail handling, oversampling, dropout strategy, freeze, bounce-in-place, deterministic/offline rendering, and engine diagnostics. [C-024] [C-025] [C-026]

## 6. Tracks, timeline, clips, and editing

- **DOCUMENTED:** The linear timeline arranges tracks and regions and provides move/select, split, stretch, snap/grid, loop-range, zoom/overview, track-height, and follow-playhead controls. [C-004]
- **DOCUMENTED:** Audio can be trimmed, moved, looped, stretched/warped, pitch-shifted, sliced, reversed, normalized, faded, and gain-adjusted according to current product material. Samples become editable regions on Audio Tracks. [C-009] [C-010]
- **DOCUMENTED:** MIDI regions support recording and piano-roll editing, quantize/humanize, velocity changes, transposition, and stretching. [C-011]
- **DOCUMENTED:** Undo/redo traverses edit history. [C-041]
- **UNKNOWN:** destructive-versus-nondestructive guarantees, audio warp algorithm, clip gain precision, fades/crossfades behavior, take lanes, comping, grouping/nesting, ripple modes, tempo maps, meter-change maps, named project snapshots, history persistence, and history behavior under concurrent edits. [C-027]

## 7. MIDI, sequencing, notation, and expression

- **DOCUMENTED:** Audiotool records multitrack MIDI, presents a piano roll, and supports note velocity, quantize/humanize, transpose, pattern/region stretching, on-screen keys, hardware MIDI play/control, and MIDI learn. [C-008] [C-011]
- **DOCUMENTED:** Native note tools include a Matrix Arpeggiator and Note Splitter; ToneMatrix is described as a grid-based generative/step-sequencer synthesizer. [C-007]
- **DOCUMENTED:** Notes and parameter gestures can be captured during performance. [C-008]
- **UNKNOWN:** raw MIDI event representation, MIDI file import/export, MIDI routing details, SysEx, program changes, MPE/per-note expression, MIDI 2.0, UMP, note-expression translation to VST3, score/notation, external clock, MIDI clock, MTC, Ableton Link, and sample-accurate MIDI scheduling. [C-034]

## 8. Routing, mixer, automation, and control

- **DOCUMENTED:** Node/cable routing allows custom signal chains among native devices, bridge devices, effects, and utilities. Splitter, Merger, BandSplitter, gain, mixer, and crossfader utilities are visible native graph elements. [C-005] [C-007]
- **DOCUMENTED:** The mixer supports channel level/pan, groups, inserts, a master bus/insert chain, shared/custom FX sends, and two visible built-in FX channels. A Dynamic Mixer can hide channels not corresponding to selected devices or timeline tracks. [C-006] [C-043]
- **DOCUMENTED vendor claim:** parameters, including plug-in parameters, can be automated; parameter moves can be recorded and automation can be drawn. [C-008]
- **UNKNOWN:** sidechain semantics, feedback rules, send pre/post behavior, arbitrary return count beyond the documented two built-in FX channels, folders/VCAs, surround/immersive layouts, sample-accurate automation, parameter identity and range normalization, automation conflict resolution in multiplayer, OSC, control-surface protocols, remote APIs beyond Nexus, and synchronization protocols. [C-024] [C-034]

## 9. Recording, comping, and media handling

- **DOCUMENTED:** Audio can be recorded from microphone/line input directly into the browser; the current product describes vocals, instruments, samples, and takes. [C-009]
- **DOCUMENTED limitation:** Firefox may not expose every audio input device and may notify the OS that the microphone is in use when Studio starts. [C-022]
- **DOCUMENTED:** The sample library includes curated and user-uploaded loops, one-shots, and sound effects with preview, waveform, favorites, categories/tags, BPM filtering, and licensing/collection metadata. Samples can be dragged to Audio Tracks or sampler devices. [C-010] [C-038]
- **UNKNOWN:** monitoring modes, punch/loop recording, take retention, comping, input channel layouts, file import formats, recording format/bit depth, video, conform/proxy workflows, metadata preservation, asset relinking, missing-media behavior, user-sample publication steps, and archive/collect. [C-026] [C-027]

## 10. Instruments, effects, content, and native devices

- **DOCUMENTED vendor inventory:** 37 built-in devices span synthesizers, drum machines/samplers, effects, and routing/MIDI/mixer tools. Named architecture-relevant examples include Heisenberg (with a modulation matrix), Machiniste, ToneMatrix, AudioTrack, BandSplitter, Splitter, Merger, Matrix Arpeggiator, Note Splitter, Centroid, Crossfader, Kobolt, and MiniMixer. [C-007]
- **DOCUMENTED:** Native instruments/effects are placed in the Studio or dragged to tracks; effects form chains; presets are browsed by compatibility; samples can feed timeline tracks or samplers. [C-003] [C-005] [C-010] [C-037]
- **DOCUMENTED vendor claim:** any parameter can be automated; native sound design includes modulation, synthesis, distortion, dynamics, filtering, delay, reverb, and modular processing. [C-007] [C-008]
- **UNKNOWN:** native DSP implementation, device ABI, authoring SDK, voice allocation, oversampling, latency/tail reporting, preset file format, project-state serialization, asset embedding, missing-device migration, macro/rack system, and whether partner instruments are native devices or preconfigured VST Bridge integrations in every case. [C-025] [C-037]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means the current official pages and VST Bridge manual were checked but did not establish support or exclusion. A format's absence from a VST3-only manual is not treated as proof that the product rejects it. [C-023]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Current public Studio/Help snapshot; no version number | Current affirmative bridge docs say VST3 only; VST2 exclusion is not explicit | [C-023], S-006 |
| VST3 | DOCUMENTED | DOCUMENTED | DOCUMENTED | DOCUMENTED: browser front end plus desktop helper; UNKNOWN on mobile | Current Help Beta / VST Bridge manual ©2025; current 2026 product pages | Instruments/effects through native companion; local processing. Splice INSTRUMENT is specifically not supported on Linux, not a blanket Linux-VST3 exclusion | [C-016] [C-017] [C-018], S-005, S-006 |
| AUv2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Current snapshot | No AU hosting or explicit platform-exclusion statement found | [C-023], S-006 |
| AUv3 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Current snapshot | No AUv3 hosting or explicit platform-exclusion statement found | [C-023], S-006 |
| AAX | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Current snapshot | No AAX hosting or explicit platform-exclusion statement found | [C-023], S-006 |
| CLAP | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Current snapshot | No CLAP hosting statement found | [C-023], S-006 |
| LV2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Current snapshot | No LV2 hosting statement found | [C-023], S-006 |
| LADSPA | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Current snapshot | No LADSPA hosting statement found | [C-023], S-006 |
| DSSI | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Current snapshot | No DSSI hosting statement found | [C-023], S-006 |
| JSFX | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Current snapshot | No JSFX hosting statement found | [C-023], S-006 |
| DirectX/DXi | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Current snapshot | No DirectX/DXi hosting or explicit platform-exclusion statement found | [C-023], S-006 |
| Rack Extension | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Current snapshot | No Rack Extension hosting statement found | [C-023], S-006 |
| Product-native/other | UNKNOWN OS-specific qualification | UNKNOWN OS-specific qualification | UNKNOWN OS-specific qualification | DOCUMENTED | Current Help Beta and 2026 product/developer pages | 37 browser-native devices; Nexus web/community apps and project API are extensions, not evidence of a binary audio plug-in ABI | [C-007] [C-015] [C-035], S-002, S-003, S-004 |

### 11.2 Discovery, scanning, validation, and recovery

- **DOCUMENTED:** A user installs the VST Bridge, adds a VST Bridge device, selects an installed VST3, and uses **Re-scan** after adding a plug-in to the folder. [C-019]
- **UNKNOWN:** default/custom scan paths, recursive behavior, cache, plug-in identifiers, duplicate handling, validator, blacklist/quarantine, scan timeouts, architecture mismatch reporting, signing checks, bulk rescan, and recovery after a scan crash. [C-024]

### 11.3 Runtime isolation and compatibility

- **DOCUMENTED:** The native companion runs alongside the browser and carries local audio and plug-in processing. One companion instance can connect to at most one Audiotool session. [C-017] [C-020]
- **DOCUMENTED:** macOS and Windows use downloaded installers; Linux uses an executable AppImage and documented Linux audio-stack dependencies. [C-018] [C-021]
- **INFERENCE:** The companion creates a local native-code trust boundary while preserving the browser UI/cloud project model. Whether each plug-in is isolated from the companion or other plug-ins is unknown. [C-046]
- **UNKNOWN:** in-process versus per-plug-in subprocess, sandboxing, IPC/transport, crash containment, CPU-architecture bridging, Rosetta/WOW compatibility, code-signing/notarization requirements, permissions, network exposure, and reconnection/state recovery. [C-024]

### 11.4 Host/plugin processing contract

- **DOCUMENTED:** The bridge covers VST3 instruments and effects and transports their audio/processing locally. [C-016] [C-017]
- **DOCUMENTED limitation:** block size affects latency, with 128 described as best; bridge recording latency may remain worse than without the bridge. [C-021]
- **UNKNOWN:** audio/MIDI/event bus counts, sidechain, multi-output instruments, dynamic I/O, MPE/note expression, MIDI 2.0, sample-accurate events/automation, precision/sample-rate negotiation, latency/tail reporting, bypass/suspend, offline render, tempo/transport context, and realtime-safety behavior. [C-024]

### 11.5 Parameters, automation, state, presets, and project recall

- **DOCUMENTED vendor claim:** plug-in parameters can be automated with the Studio automation system. [C-008]
- **DOCUMENTED:** The bridge manual tells users to press **Save** to store VST3 changes; collaboration is possible when every producer has the same plug-in installed. [C-019] [C-020]
- **UNKNOWN:** parameter IDs/ranges/text, gesture semantics, sample accuracy, native versus host preset enumeration, state chunk format, asset references, automatic versus manual state capture, missing-plug-in placeholders, version migration, cross-OS state portability, and recovery after bridge disconnection. [C-024]

### 11.6 UI, diagnostics, and failure modes

- **DOCUMENTED:** **Open** shows the native VST plug-in window. Studio reports when connection action is required; a Connect control can start the bridge, the connected bridge shows its version, and the manual provides troubleshooting for detection, latency, and Linux audio. [C-019] [C-020] [C-021]
- **UNKNOWN:** UI embedding versus detached-window ownership, scaling/HiDPI, keyboard focus, headless behavior, crash logs, per-plug-in diagnostics, safe mode, automatic disablement, and missing-plug-in UX. [C-024]

## 12. Extensibility and integration

- **DOCUMENTED:** Nexus is a public developer platform for browser apps that participate in multiplayer DAW sessions. Its JavaScript package supports read/write project access; examples target web apps, and Node.js, Bun, Deno, Python, Go, and Rust are named integration paths through JavaScript or Protocol Buffers. [C-015]
- **DOCUMENTED vendor description:** apps can create/edit MIDI, audio, automation, and device setups; community tools can provide custom interfaces and join live sessions. [C-015]
- **INFERENCE:** Nexus is primarily a structured project/session extension boundary, distinct from the real-time binary-audio VST3 boundary. The evidence does not show that arbitrary Nexus apps execute DSP in the audio render path. [C-015] [C-017]
- **UNKNOWN:** SDK stability/versioning policy, authentication scopes beyond the presence of personal access tokens, rate limits, transaction/conflict semantics, realtime guarantees, app review, code execution isolation, compatibility promises, source/license terms, controller APIs, OSC, and command/action scripting. [C-035]

## 13. Project format, persistence, interoperability, and collaboration

- **DOCUMENTED vendor description:** projects live in the cloud, save automatically, and open at the latest shared state; multiple collaborators edit concurrently and see live changes. [C-012] [C-014]
- **DOCUMENTED:** Undo/redo provides edit history in the UI. Published tracks can be forked/remixed, and a remix links to its original. Publish and Invite are explicit project actions. [C-013] [C-041] [C-042]
- **DOCUMENTED:** VST3 collaboration requires the same local plug-in for each producer and manual Save of VST changes. [C-019] [C-020]
- **INFERENCE:** Remix/fork lineage is a publication-level version graph; it is not evidence of private draft snapshots, branches, merge, rollback, or durable event history. [C-013] [C-027]
- **UNKNOWN after targeted search:** project file representation, downloadable archive, collect-all-assets, autosave cadence, crash recovery, named versions, rollback, concurrent conflict rules, backward/forward migration, missing dependencies, stem export, mixdown formats, AAF/OMF/ADM/MIDI/MusicXML/DAWproject interchange, and asset relinking. [C-026] [C-027]

## 14. Delivery, live, post-production, and specialized workflows

- **DOCUMENTED:** Users can publish music to the community and choose release/licensing controls. Live playing with MIDI, keyboard/controller mapping, and recording of notes/gestures are current product workflows. [C-008] [C-029] [C-042]
- **DOCUMENTED:** Community specialties include real-time co-production and origin-linked remix/fork publication. [C-012] [C-013]
- **UNKNOWN:** current downloadable mix formats, bit depth/sample rate, stem/batch export, loudness targets, DDP, video/timecode, ADR, surround/immersive/ADM, show control, offline performance mode, and conventional clip-launch/live-set features. [C-026] [C-045]

## 15. Performance, reliability, security, and accessibility

- **DOCUMENTED vendor claim:** Studio has no track, device, effect, or project-length caps. This is not a measured scaling guarantee. [C-001]
- **DOCUMENTED:** Chrome receives extensive automated browser testing; Firefox does not and has input-device limitations; Safari is unsupported. [C-022]
- **DOCUMENTED:** VST Bridge exposes block-size/audio-host settings and known latency limitations; its single-session rule is an operational constraint. [C-020] [C-021]
- **INFERENCE/security boundary:** VST3 support requires downloaded native software and locally installed third-party binaries, expanding risk beyond the browser sandbox. No isolation evidence was found. [C-046]
- **DOCUMENTED, dated:** the 2022 Terms allow technical filtering against harmful programs/content, while the Privacy Policy names analytics/advertising technologies and data rights. No current security architecture or telemetry-control matrix is supplied. [C-030] [C-044]
- **UNKNOWN:** resource meters/limits, deterministic overload behavior, crash containment, bridge/plugin watchdogs, audit logs, update/rollback/signing, encryption, incident response, vulnerability policy, privacy behavior of VST plug-ins, accessibility conformance, keyboard-only coverage, screen-reader semantics, reduced motion, localization, and tested hardware minimums. [C-036] [C-044]

## 16. Licensing, ecosystem, and implementation constraints

- **DOCUMENTED, December 2022 Terms:** users retain ownership and responsibility for arrangements/files and uploaded, stored, or submitted content. Audiotool claims no ownership in user content. Users must hold rights to third-party material. [C-028]
- **DOCUMENTED, December 2022 Terms:** publication provides release options and Creative Commons choices. Later tightening applies only prospectively, and a downstream license must honor the tightest upstream license. [C-029]
- **DOCUMENTED:** sample details may identify licensing (for example, royalty-free), collection, and curated status. User uploads remain subject to the user's rights obligations. [C-038]
- **DOCUMENTED, but potentially stale:** the Terms say the service is intended solely for consumers and may not be used for corporate activities. This matters for professional/team procurement but requires vendor clarification against current partnership/developer positioning. [C-033]
- **DOCUMENTED, but potentially stale:** legal/privacy pages are dated December 2022. The Terms mention possible paid services and Google AdSense; current 2026 product pages say the Studio is 100% free/no ads. [C-032] [C-039]
- **UNKNOWN:** Audiotool application/source license, Nexus SDK license and compatibility promise, VST3 SDK/host licensing posture, VST trademark permissions, redistribution rights for the bridge or partner instruments, app certification, and whether “free” grants any enterprise/commercial service entitlement. [C-035]
- **Clean-room boundary:** Product names and behavior descriptions are evidence only. No UI assets, manual prose, implementation code, SDK code, or proprietary formats should be copied. Naming VST3, Creative Commons, or partner products grants no trademark, SDK, redistribution, compatibility, or certification right.

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **Multiple coordinated projections:** timeline, patch graph, and mixer each expose the abstraction best suited to arrangement, topology, and balance. [C-003] [C-005] [C-006]
- **Collaboration as the project default:** one shared project and live structured edits reduce file/version handoff friction. [C-012] [C-014] [C-015]
- **Cloud/community integration:** presets, samples, publishing, remix lineage, and project APIs form a connected creation/learning ecosystem. [C-010] [C-013] [C-015]
- **Pragmatic VST3 bridge:** browser workflow can reach local native plug-ins without pretending binaries run inside the web sandbox. [C-016] [C-017]

### Liabilities

- **Bridge fidelity is underdocumented:** a VST3 logo-level feature plus a basic manual does not establish the complete host contract or failure isolation. [C-024]
- **Latency and session limits are explicit:** bridge recording latency can be worse, and one bridge serves one session. [C-020] [C-021]
- **Cloud durability/interchange is unclear:** independent project archives, exports, rollback, and migrations were not documented in retained current primary evidence. [C-026] [C-027]
- **Trust and governance lag:** native plug-ins expand the local attack surface; legal/privacy pages predate the current product and conflict with parts of its positioning. [C-032] [C-044] [C-046]

### Architecture lesson

Audiotool is most useful as a reference for **projection separation, collaborative structured state, and an explicit native-companion boundary**. It is not yet a sufficient documentary reference for DSP scheduling, durable project formats, full plug-in interoperability, offline rendering, security isolation, or professional delivery. [C-015] [C-017] [C-024] [C-025] [C-026]

**Recommendation:** carry the three-view project model and typed collaborative-state boundary into architecture comparison as candidates; treat the native bridge only as a conditional pattern pending sandbox, latency, state, and recovery prototypes; do not select Audiotool as the sole reference for engine, archive, interchange, security, or delivery requirements. [C-003] [C-015] [C-017] [C-024] [C-026] [C-046]

## 18. Transferable patterns

| Pattern | Problem | Minimal clean-room mechanism | Support | Prerequisites | Tradeoffs/adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Coordinated timeline/graph/mixer projections | One view becomes overloaded when arrangement, topology, and balance have different editing needs | One canonical project graph with stable object IDs; dedicated projections and cross-selection | [C-003] [C-004] [C-005] [C-006] | Consistent identity, undo, selection, and change propagation | More UI/state synchronization; do not copy Audiotool layout or visual expression | **CANDIDATE** |
| Shared structured project document | File exchange creates stale versions and merge friction | Transactional operations over typed project objects with presence and permission controls | [C-012] [C-014] [C-015] | Conflict model, durable log/snapshots, asset service, auth | Network dependence, conflict complexity, privacy, service continuity | **CONDITIONAL** |
| Publication fork lineage | Remix provenance and inherited rights are easily lost | Immutable origin link plus fork metadata and license compatibility checks | [C-013] [C-029] | Stable IDs, rights metadata, moderation | Retrospective license changes and asset removal are hard | **CANDIDATE** |
| Native companion for browser plug-ins | Browser cannot directly host arbitrary native audio binaries | Narrow authenticated local bridge with explicit transport/state protocol | [C-016] [C-017] [C-018] | Installer/update/signing, discovery, IPC, latency and recovery design | Enlarged attack surface, OS matrix, network/IPC latency, state portability | **CONDITIONAL** |
| Explicit bridge-state commit | Native plug-in state may not be captured reliably by browser/cloud edits | Visible dirty state and an explicit state-capture transaction | [C-019] | Stable plug-in identity, binary state limits, collaborative ownership | Users can forget Save; automatic checkpoints may be safer | **CONDITIONAL** |
| Integrated rights-aware sample browser | Cloud content is useful only if provenance and usage rights travel with it | Asset metadata with owner, collection, license, tempo/type, and project references | [C-010] [C-038] | Rights ingestion, moderation, durable asset IDs | License changes, takedowns, relinking, and offline portability | **CANDIDATE** |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** Treating “runs in your browser” as proof of Web Audio/AudioWorklet/WASM or local native DSP. No retained engineering source establishes those internals. Reopen only with official engineering documentation or a separately authorized dynamic probe. [C-025]
- **REJECTED:** Treating VST3 acceptance as proof of a full plug-in-host contract. Discovery and instantiation are documented only at a basic level; buses, state portability, latency reporting, offline render, and failure isolation are unknown. [C-024]
- **REJECTED:** Treating cloud autosave as a substitute for archives, version control, or disaster recovery. No export/rollback evidence was found. [C-026] [C-027]
- **REJECTED:** Treating remix/fork lineage as private-draft branch/merge/version history. It is documented at publication level only. [C-013] [C-027]
- **CURIOSITY_NO_GO:** Web Audio/WASM/threading internals—high relevance but low expected documentary yield and high cost; no engineering disclosure surfaced.
- **CURIOSITY_NO_GO:** Exhaustive 37-device inventory—low decision novelty once native categories, graph tools, modulation, and routing are represented.
- **CURIOSITY_NO_GO:** Accessibility implementation—material but no accessibility page surfaced in the bounded source set; retain as an unknown for later hands-on qualification. [C-036]
- **CURIOSITY_NO_GO:** Historical Flash-era architecture—outside the assigned current-product boundary and unlikely to change the current decision.
- **CURIOSITY_NO_GO:** Partner plug-in catalog—does not answer whether arbitrary VST3 host semantics are complete.
- **CURIOSITY_NO_GO:** Secondary press on the 2026 redesign—official current pages already provide stronger product-scope evidence; press cannot prove internals.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary test and result | Status / later probe |
| --- | --- | --- |
| H1: Audiotool is a pure browser product with no native companion | Current product says “no install,” but VST Bridge manual requires a native companion for local VST3 processing | **FALSIFIED for VST3 workflows**; native-device path still unknown. [C-017] [C-046] |
| H2: Audiotool supports arbitrary desktop plug-in formats | Current product and bridge manual affirm only VST3 | **NOT ESTABLISHED**; every non-VST3 format remains `UNKNOWN`, not disproved. [C-023] |
| H3: “VST3 supported” implies scanned, instantiated, UI-visible, automated, persisted, recovered, and fully rendered | Scan/re-scan, selection, window opening, automation claim, and manual Save are documented; isolation, buses, offline render, missing plug-ins, and recovery are not | **PARTIALLY SUPPORTED, full-contract hypothesis rejected.** [C-019] [C-024] |
| H4: Plug-ins run in Audiotool's cloud | Manual says companion carries processing on the user's machine | **FALSIFIED for bridged VST3.** [C-017] |
| H5: Collaboration removes plug-in portability constraints | Manual requires every producer to have the same plug-in | **FALSIFIED.** [C-020] |
| H6: Cloud autosave provides version rollback | Current pages say auto-save/latest shared version but do not document snapshots or rollback | **UNKNOWN / unsupported by evidence.** Next probe: authenticated disposable project plus vendor recovery documentation. [C-014] [C-027] |
| H7: Publication forks are project branches | Fork/remix origin links are documented, but merge/private-branch semantics are absent | **FAILED equivalence.** [C-013] [C-027] |
| H8: Independent export/archive mitigates cloud shutdown | Targeted official-site discovery did not locate current export/archive documentation | **UNKNOWN, high impact.** Next probe: inspect authenticated Publish/project menus and request current support matrix. [C-026] |
| H9: Browser support is cross-browser including Safari | Supported-browser manual explicitly excludes Safari and focuses testing on Chrome | **FALSIFIED.** [C-022] |
| H10: Current “no ads” positioning matches published legal/privacy text | 2026 pages say no ads; 2022 privacy/terms mention advertising cookies/AdSense | **CONTRADICTION, likely date/scope drift but unresolved.** [C-032] |

**Negative-result log.** The support root returned 404; repeated web searches were rate-limited (HTTP 429); Google fallback returned no usable results; and a bounded nested researcher could not be spawned because subagent depth was exhausted. None of that search text was used as evidence. The current Help index contained no project/export section, and the Basics project's documented actions listed Publish/Invite but no export/archive action; absence is not proof that export is unavailable. [C-026]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High for vendor description | Current Audiotool is presented as a free/no-ad full browser/cloud DAW with recording, MIDI, native devices, modular routing, mixing, publishing, remix, and collaboration; product page claims no track/device/project-length caps | Current public product, 2026-08-29 | S-001, S-003, S-005 | Direct current vendor pages | Marketing claims are not independent measurements; Terms mention possible paid services |
| C-002 | DOCUMENTED | High | Current Help is marked Beta and ©2025 | Current Help snapshot | S-004 | Page banner/footer | Does not establish Studio release/build status |
| C-003 | DOCUMENTED | High | UI is organized into global controls, linear Timeline, Library, cable-routing Studio, Mixer, and on-screen piano | Current Help Beta | S-012 | Basics sections | UI behavior not dynamically observed |
| C-004 | DOCUMENTED | High | Timeline supports region arrangement, pointer/cut/stretch, snap/grid, loop range, track sizing, and navigation | Current Help Beta | S-012 | Timeline section | Advanced edit semantics unknown |
| C-005 | DOCUMENTED | High | Studio uses placed devices and virtual cables for flexible instrument/effect/utility signal chains | Current product/Help | S-001, S-003, S-012 | Product and manual converge | Internal graph/scheduler unknown |
| C-006 | DOCUMENTED | High | Mixer supports level/pan, groups, inserts, master processing, and custom/shared FX sends | Current product | S-001, S-003 | Direct feature descriptions | Detailed bus rules unknown |
| C-007 | DOCUMENTED | Medium-high | Vendor lists 37 native devices across synth, drums, effects, and routing/MIDI/mixer tools; named devices expose modulation, splitting/merging, sequencing, and mixing roles | Current product/Help | S-001, S-003, S-004 | Current inventory/index | Count and device behavior not independently qualified |
| C-008 | DOCUMENTED | Medium-high | MIDI learn/control, note and gesture capture, and drawing automation for native and plug-in parameters are current product claims | Current product | S-001, S-003 | Direct vendor descriptions | Resolution/sample accuracy unknown |
| C-009 | DOCUMENTED | Medium-high | Browser recording and audio trim/move/loop/stretch/warp/pitch/slice/reverse/gain/fade/normalize are advertised; recording latency compensation is claimed | Current product | S-001, S-003 | Direct vendor descriptions | Algorithms/precision and measured latency unknown |
| C-010 | DOCUMENTED | High | Cloud sample library supports curated/user uploads, loops/one-shots/effects, preview/search/metadata, drag to timeline Audio Track or sampler, and region stretch/pitch/fade editing | Current Help Beta | S-011 | Samples manual | Upload/publication/relink workflow unknown |
| C-011 | DOCUMENTED | Medium-high | Multitrack MIDI and piano-roll editing include quantize/humanize, velocity, transpose, and region stretching | Current product | S-001, S-003 | Direct vendor descriptions | Advanced MIDI formats/expression unknown |
| C-012 | DOCUMENTED | High for vendor behavior description | Several producers can edit one shared cloud project concurrently and changes appear live | Current product | S-003, S-010 | Dedicated collaboration page | Conflict/consistency semantics unknown |
| C-013 | DOCUMENTED | High | Published tracks can be remixed/forked and each remix links to its original | Current product | S-003, S-010 | Dedicated collaboration page | No branch/merge/rollback implication |
| C-014 | DOCUMENTED | Medium-high | Projects are described as cloud-resident, auto-saving, and opening at latest shared state | Current product | S-005, S-010 | Two vendor pages converge | Durability, cadence, backup, recovery unknown |
| C-015 | DOCUMENTED | High for public API description | Nexus is Protocol Buffers-based, exposes live project/session access to MIDI/audio/automation/device setup, and is described as the API the app itself uses | Current developer platform | S-002, S-003 | Official developer and product pages | Schema, consistency, realtime DSP, license, versioning unknown |
| C-016 | DOCUMENTED | High | Current third-party bridge capability is affirmatively described for VST3 instruments and effects | Current Studio/VST Bridge | S-001, S-003, S-005, S-006 | Product and manual converge | Does not prove every VST3 class/contract works |
| C-017 | DOCUMENTED | High | VST Bridge is a native companion; local plug-ins plus their audio/processing run on the user's machine alongside browser Studio | Current VST Bridge | S-005, S-006 | Explicit Essentials text | Native-device processing boundary unknown |
| C-018 | DOCUMENTED | High | VST Bridge installation is documented for Windows, macOS, and Linux AppImage | Current VST Bridge | S-006 | Install section | Architecture/version/minimum OS unknown; Splice INSTRUMENT excluded on Linux |
| C-019 | DOCUMENTED | High | VST3 discovery includes Re-scan; user selects plug-in, opens its window, and presses Save to store changes | Current VST Bridge | S-006 | Use section | Scan paths and state format unknown |
| C-020 | DOCUMENTED | High | VST collaboration requires every producer to have the same plug-in; one bridge connects to one Studio session | Current VST Bridge | S-006 | Use/Connecting sections | Version-equality and failure UX unknown |
| C-021 | DOCUMENTED | High | Bridge latency depends on actual block size; 128 is described as best, recording can remain worse, and Linux audio backend affects latency | Current VST Bridge | S-006 | Troubleshooting section | No round-trip measurements or PDC evidence |
| C-022 | DOCUMENTED | High | Chrome is extensively tested, Chromium derivatives expected, Firefox supported without automated testing and with input limitations, Safari unsupported | Current Help Beta | S-005, S-007 | Dedicated browser matrix preferable to broad product copy | Exact versions/OS matrix unknown; S-005 simplification names Edge |
| C-023 | UNKNOWN | High confidence in unknown | No retained current official source establishes support or explicit rejection for required non-VST3 plug-in formats | Current snapshot | S-001, S-003, S-004, S-006 | Affirmative scope repeatedly names VST3 only | Absence is not proof of unsupported behavior; dynamic/vendor matrix needed |
| C-024 | UNKNOWN | High confidence in unknown | Full VST3 host contract—validation/isolation/buses/expression/automation fidelity/latency-tail/offline/state/missing-plug-in/recovery—remains undocumented | Current VST Bridge | S-006 | Manual checked against research-contract fields | Runtime qualification required |
| C-025 | UNKNOWN | High confidence in unknown | Native engine internals, Web Audio/WASM use, process/thread scheduling, and server-render boundaries are not disclosed in retained sources | Current browser Studio | S-001, S-003, S-005, S-012 | Product/UI pages are not engineering architecture | Engineering docs or authorized probe needed |
| C-026 | UNKNOWN | High confidence in unknown | Current mixdown/export formats, stems, offline render, and independent project archive were not established | Current browser Studio | S-004, S-012 | Help index and Basics controls checked; targeted discovery failed | Absence from Help index is not proof of unavailability |
| C-027 | UNKNOWN | High confidence in unknown | Named revisions, rollback, branch/merge, archive/collect, migration, and missing-dependency behavior are undocumented | Current cloud projects | S-010, S-012 | Latest shared state/fork lineage are insufficient | Authenticated disposable project/support docs needed |
| C-028 | DOCUMENTED | High for published terms | User owns and is responsible for arrangements/files and uploaded/stored/submitted content; Audiotool claims no ownership | Terms status Dec. 2022 | S-009 | Sections 1.4 and 2 | Currency against 2026 service should be confirmed; not legal advice |
| C-029 | DOCUMENTED | High for published terms | Publication provides release/Creative Commons choices; tightened licenses are prospective; tightest upstream license constrains downstream licensing | Terms status Dec. 2022 | S-009 | Section 6 | Current UI/license list unknown; legal interpretation not offered |
| C-030 | DOCUMENTED | High for policy text | Privacy policy names username/email/usage data, Hetzner Germany storage, analytics/advertising technologies, and data-subject rights | Privacy policy Dec. 2022 | S-008 | Direct policy sections | Stale relative to 2026; project/audio asset scope unclear |
| C-031 | DOCUMENTED | High for published terms | Service is as-is/as-available; after termination stored content is blocked and deleted within six months; service may be discontinued | Terms status Dec. 2022 | S-009 | Sections 1, 13 | Enforceability/currency not assessed |
| C-032 | DOCUMENTED contradiction | High | 2026 product says no ads; 2022 privacy/terms mention advertising cookies/AdSense and Meta Pixel | Cross-date public pages | S-001, S-003, S-005, S-008, S-009 | Direct textual tension | Could reflect policy age, marketing-site ads, or discontinued behavior; unresolved |
| C-033 | DOCUMENTED | High for published terms | Terms say service is solely for consumers and prohibits corporate activities | Terms status Dec. 2022 | S-009 | Section 1.3 | Tension with current developer/partner positioning; vendor clarification needed |
| C-034 | UNKNOWN | High confidence in unknown | MPE, MIDI 2.0, SysEx, sync/timecode, sidechain/event details, and sample-accurate scheduling are not established | Current Studio | S-001, S-003, S-004, S-006 | Current feature/manual set checked | Safe dynamic qualification needed |
| C-035 | UNKNOWN | High confidence in unknown | Nexus and VST ecosystem licensing, API stability, auth/conflict semantics, and certification/redistribution posture remain unestablished | Current developer/bridge | S-002, S-006, S-009 | Product docs do not substitute for SDK/format licenses | Retrieve versioned SDK license and format-owner terms later |
| C-036 | UNKNOWN | High confidence in unknown | Accessibility conformance and assistive-technology behavior are not documented in retained sources | Current Studio | S-004, S-012 | Help navigation/basic UI checked | Later accessibility audit required |
| C-037 | DOCUMENTED/UNKNOWN boundary | Medium | Compatible native presets can be browsed/loaded, but native preset/state serialization and migration are unknown | Current Help Beta | S-004, S-012 | Library UI documented | No file/schema evidence |
| C-038 | DOCUMENTED | High | Sample details expose tags, collection, curated labels, and license information such as royalty-free | Current Help Beta | S-011 | Sample Info section | License enforcement and takedown flow unknown |
| C-039 | DOCUMENTED contradiction | Medium-high | Current product claims full Studio is free; older Terms allow chargeable services with notice | 2026 product vs 2022 Terms | S-003, S-005, S-009 | Cross-date comparison | Could refer to ancillary/future services rather than Studio edition |
| C-040 | UNKNOWN | High confidence in unknown | No current Studio semantic version/build or unambiguous beta/release status was published in retained sources | Current snapshot | S-002, S-003, S-004, S-006 | Help is Beta; bridge can display its own version only when connected | Authenticated UI/release notes needed |
| C-041 | DOCUMENTED | High | Global controls provide Undo/Redo over edit history | Current Help Beta | S-012 | Global Controls section | Persistence/concurrent undo semantics unknown |
| C-042 | DOCUMENTED | High | Publish and Invite are explicit current project actions | Current Help Beta | S-012 | Project Actions table | Access-control granularity and publish workflow unknown |
| C-043 | DOCUMENTED | High | Mixer view can be dynamic, can show master, and exposes two built-in FX channels | Current Help Beta | S-012 | Mixer Options section | Does not prove arbitrary return limits or send topology |
| C-044 | DOCUMENTED/UNKNOWN boundary | Medium | 2022 Terms mention technical protective filters; current security architecture, signing, telemetry controls, and incident practices are unknown | Legal/service scope | S-008, S-009 | Dated policy evidence only | No security white paper/current telemetry matrix |
| C-045 | UNKNOWN | High confidence in unknown | Professional delivery, post, notation, immersive, video/timecode, and dedicated clip-launch workflows are not established | Current product | S-001, S-003, S-004 | Current product/manual scope checked | Omission is not a formal exclusion |
| C-046 | INFERENCE | Medium-high | Native VST3 bridging expands the local trust boundary beyond the browser sandbox, while isolation remains unknown | Current bridge | S-006 | Native companion executes user-installed plug-in processing | Companion could sandbox plug-ins, but no evidence establishes it |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Dynamic web pages are not immutable; passages below identify the retained scope. Vendor claims document what Audiotool says, not independent runtime performance.

### S-001 — Audiotool landing page

- **Publisher/URL/kind:** Audiotool Inc.; <https://www.audiotool.com/>; current official product page.
- **Scope/passage:** “full studio in your browser”; record/MIDI/sound-design/mix sections; VST3, automation, modular chains, latency compensation, devices, publishing/remixing/collaboration.
- **Supports:** C-001, C-005–C-009, C-016, C-032.
- **Limitations:** Dynamic marketing copy; no version, host-contract detail, or independent measurement.
- **Selection rationale:** Canonical current product entry point and the broadest official current workflow statement; preferable to press summaries.

### S-002 — Audiotool Developer Platform

- **Publisher/URL/kind:** Audiotool Inc.; <https://developer.audiotool.com/>; official developer documentation landing page.
- **Scope/passage:** browser apps participating in multiplayer sessions; `@audiotool/nexus`; read/write projects; Protocol Buffers; Node/Bun/Deno and other-language paths.
- **Supports:** C-015, C-035, C-040.
- **Limitations:** Landing-level docs only; no schema/version/license/auth/conflict details were retained.
- **Selection rationale:** Primary API owner; preferable to community SDK descriptions.

### S-003 — Audiotool Product

- **Publisher/URL/kind:** Audiotool Inc.; <https://www.audiotool.com/product>; official current product matrix.
- **Scope/passage:** unlimited tracks/features, modular cable routing, VST3 through VST Bridge, real-time multiplayer, 37 devices, audio/MIDI/mixing details, Nexus project API.
- **Supports:** C-001, C-003, C-005–C-008, C-011–C-016, C-032, C-039.
- **Limitations:** Marketing source; no independent qualification or build number.
- **Selection rationale:** More structured and specific than the landing page; retained because it materially identifies the bridge and Nexus boundaries.

### S-004 — Audiotool Help index

- **Publisher/URL/kind:** Audiotool Inc.; <https://www.audiotool.com/help>; official current manual index, marked Beta, ©2025.
- **Scope/passage:** editing, mixer, library, device, VST Bridge, supported-browser sections and native-device inventory.
- **Supports:** C-002, C-004, C-007, C-023, C-026, C-034, C-036, C-037, C-045.
- **Limitations:** Index-level evidence for many topics; no project/export section; omission is not proof of absence.
- **Selection rationale:** Canonical current manual map and release-state evidence; preferable to legacy help/forum results.

### S-005 — The free online DAW that runs in your browser

- **Publisher/URL/kind:** Audiotool Inc.; <https://www.audiotool.com/online-daw>; official product explainer with June 2026 comparison.
- **Scope/passage:** cloud projects auto-save; Chrome/Firefox/Edge comparison; VST Bridge Helper connects local VST3 instruments/effects; collaboration and modular routing.
- **Supports:** C-001, C-005, C-012, C-014, C-016, C-017, C-022, C-032, C-039.
- **Limitations:** Comparative marketing; competitor claims were not used.
- **Selection rationale:** First official page to resolve that VST3 uses a desktop helper rather than pure browser/cloud execution.

### S-006 — VST Bridge manual

- **Publisher/URL/kind:** Audiotool Inc.; <https://www.audiotool.com/help/manuals/vst-bridge.html>; official current Help Beta manual, ©2025.
- **Scope/passage:** native companion/local processing; macOS/Windows/Linux installation; select/open/save; re-scan; same-plug-in collaboration; one-session connection; block-size and Linux troubleshooting.
- **Supports:** C-016–C-021, C-023, C-024, C-034, C-035, C-040, C-046.
- **Limitations:** No complete host contract, version matrix, isolation, state-format, or scan-path details; Splice-specific Linux exclusion must not be generalized.
- **Selection rationale:** Most decision-critical primary source; preferable to all product copy for the bridge execution and operational contract.

### S-007 — Supported Browsers manual

- **Publisher/URL/kind:** Audiotool Inc.; <https://www.audiotool.com/help/manuals/supported-browsers.html>; official current Help Beta manual, ©2025.
- **Scope/passage:** Chrome automated testing; Chromium derivatives; Firefox support/no automated tests and audio-input limitations; Safari unsupported.
- **Supports:** C-022.
- **Limitations:** No browser versions, OS versions, mobile matrix, or performance guarantees.
- **Selection rationale:** Dedicated current support matrix is more precise than the product comparison.

### S-008 — Privacy Policy

- **Publisher/URL/kind:** Audiotool Inc.; <https://www.audiotool.com/privacy>; official policy, last updated 2022-12-12.
- **Scope/passage:** collected identity/usage data, Hetzner location, retention, rights, cookies, Google Analytics, advertising, and Meta Pixel.
- **Supports:** C-030, C-032, C-044.
- **Limitations:** Dated and internally awkward in places; does not map project/audio data flows or current bridge/plugin telemetry.
- **Selection rationale:** Canonical policy despite age; preferable to third-party privacy summaries.

### S-009 — Terms & Conditions

- **Publisher/URL/kind:** Audiotool Inc.; <https://www.audiotool.com/terms>; official terms, status December 2022.
- **Scope/passage:** user ownership/responsibility; publication and Creative Commons; consumer-only/corporate restriction; as-is service; security filters; paid-services possibility; termination/deletion/discontinuation.
- **Supports:** C-028, C-029, C-031–C-035, C-039, C-044.
- **Limitations:** Dated; legal interpretation and enforceability are outside scope; current UI terms may differ.
- **Selection rationale:** Primary service terms are required for ownership, publication, and durability risk; no secondary source can substitute.

### S-010 — Make music together, in real time

- **Publisher/URL/kind:** Audiotool Inc.; <https://www.audiotool.com/collaborate>; official current collaboration page.
- **Scope/passage:** one shared cloud project, live several-producer edits, latest version, Publish/remix/fork and origin links, Nexus SDK.
- **Supports:** C-012–C-014, C-027.
- **Limitations:** Marketing-level; “latest version” does not establish version history, merge, conflict, or rollback.
- **Selection rationale:** Dedicated current collaboration source; preferable to creator testimonials and press.

### S-011 — Samples manual

- **Publisher/URL/kind:** Audiotool Inc.; <https://www.audiotool.com/help/manuals/library/samples.html>; official current Help Beta manual, ©2025.
- **Scope/passage:** curated and uploaded samples, preview/search/type/BPM, license/collection metadata, drag to timeline/sampler, region editing.
- **Supports:** C-010, C-038.
- **Limitations:** No upload/publication moderation, asset storage, relinking, takedown, or export details.
- **Selection rationale:** Primary current source for cloud asset behavior and license metadata.

### S-012 — Basics manual

- **Publisher/URL/kind:** Audiotool Inc.; <https://www.audiotool.com/help/manuals/get-started/basics.html>; official current Help Beta manual, ©2025.
- **Scope/passage:** UI areas; global project/history/transport controls; Publish/Invite; timeline tools; library; cable Studio; dynamic mixer and two FX channels.
- **Supports:** C-003–C-005, C-026, C-027, C-036, C-037, C-041–C-043.
- **Limitations:** Introductory UI manual; absence of Export in the shown actions is not proof that export is unavailable elsewhere.
- **Selection rationale:** Highest-value curiosity source because it confirms the desktop/device graph/timeline/mixer model and reveals the documented project actions.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Decision impact | Safest next probe | Required fixture / owner |
| --- | --- | --- | --- | --- |
| Current build/version and release status | Product, Help, developer, bridge pages checked; Help says Beta but product does not | Scope/reproducibility | Ask vendor for release notes/build matrix; inspect authenticated About UI | Disposable account; unassigned |
| Native DSP/browser/server boundary | Product/manual/API pages do not name Web Audio, AudioWorklet, WASM, or render service | Core engine choice/security/performance | Official engineering interview/doc; later browser performance/network trace under separate authorization | Disposable project/browser profile; unassigned |
| VST3 scan/identity/validation | Bridge manual only says Re-scan | Reliability and migration | Synthetic signed VST3 fixtures covering duplicate IDs, bad binaries, architecture mismatch | Disposable bridge VM per OS; unassigned |
| Plug-in process isolation/crash recovery | Native companion evidenced, process topology absent | Security and availability | Process-tree/crash fixture qualification with harmless test plug-ins | Disposable macOS/Windows/Linux VMs; unassigned |
| VST3 buses/events/expression | No sidechain/multi-out/MPE/MIDI 2.0 contract | Interoperability fidelity | Matrix of instrument/effect, sidechain, multi-bus, MIDI/event, note-expression fixtures | Purpose-built VST3 fixtures; unassigned |
| Plug-in latency/tail/offline contract | Manual exposes bridge block size only | Timing and render correctness | Impulse/latency/tail fixtures in realtime and any export path | Disposable sessions and test plug-ins; unassigned |
| Plug-in state/missing plug-ins | Manual Save and same-plug-in collaboration only | Project durability | Save/reopen/collaborate with version skew, missing binary, external assets, bridge disconnect | Licensed disposable plug-ins/fixtures; unassigned |
| Non-VST3 format status | Current official set names only VST3; search rate-limited | Extension architecture census | Request explicit vendor support/exclusion matrix | Vendor response; unassigned |
| Export/mixdown/archive/stems | Help index, Basics, product, collaboration checked; search blocked/duplicate | Cloud exit, delivery, disaster recovery | Authenticated inspection of project/publish menus and vendor export documentation | Disposable account/project; unassigned |
| Autosave/history/conflicts/rollback | Latest cloud state and Undo/Redo documented only | Collaboration correctness/recovery | Concurrent edit, offline/reconnect, undo ownership, restore tests | Two disposable accounts/browsers; unassigned |
| Project/asset format and migration | Nexus existence does not establish stored representation | Long-term portability | Versioned protobuf/API schema and export fixture review | SDK docs/repository; unassigned |
| Private sharing/access control | Invite/Publish documented without role matrix | Confidential collaboration | Two-account invite/revoke/link-sharing permissions test | Disposable accounts; unassigned |
| Sample upload/publication/relink/takedown | Samples manual stops at “My Uploads” and in-project use | Rights and project durability | Upload/private/public/delete/relink fixture with original sample | Self-created audio; unassigned |
| Privacy/security current state | Policies dated 2022; no architecture white paper | Compliance/trust | Current DPA/subprocessor/telemetry/security documentation request | Vendor documentation; unassigned |
| Terms contradiction/corporate use | 2022 consumer-only terms versus 2026 partners/developer positioning | Procurement/commercial use | Obtain current written commercial-use and enterprise terms; counsel review | Vendor/counsel; unassigned |
| Accessibility | No dedicated current evidence retained | Inclusive design/acceptance | WCAG-oriented keyboard/screen-reader/zoom audit | Disposable browser matrix; unassigned |

## 24. Curiosity pass and stop decision

### Evidence-pass trace

| Pass | Sources retrieved (maximum two) | Synthesis gap that authorized the next pass |
| --- | --- | --- |
| 1 | S-001; support root returned 404 | “VST3 in browser” conflicted with “nothing to install”; bridge boundary unresolved |
| 2 | S-002, S-003 | Product named VST Bridge and Nexus, but plug-in execution and browser/runtime details remained unresolved |
| 3 | S-004, S-005 | Desktop helper became explicit; OS, state, scanning, latency, and browser support remained unresolved |
| 4 | S-006, S-007 | Bridge/browser contract covered; cloud ownership, publishing, privacy, and licensing remained unresolved |
| 5 | S-008, S-009 | Rights/privacy covered but dated; collaboration lineage and sample handling remained unresolved |
| 6 | S-010, S-011 | Collaboration/sample model covered; export, archive, rollback, and visible project controls remained unresolved |
| Curiosity | Google fallback returned no usable results; S-012 | Basics confirmed project/history/UI actions but not export/archive; budget and marginal evidence exhausted |

### Candidate scoring

Scores are 1 (low) to 4 (high). Cost is 1 (cheap) to 4 (expensive).

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Current export/project durability | 4 | 4 | 3 | 2 | **PURSUE**: official search plus Basics manual; yielded project/history controls but no export proof |
| Web Audio/WASM/threading internals | 4 | 2 | 3 | 4 | `CURIOSITY_NO_GO`: no engineering source; would require dynamic/engineering access |
| Accessibility | 3 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: important but less likely to change leading architecture conclusion in this pass |
| Exhaustive native-device inventory | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: representative graph/modulation/content patterns already saturated |
| Historical Flash lineage | 1 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: outside current-product frame |
| Partner plug-in catalog | 2 | 1 | 2 | 2 | `CURIOSITY_NO_GO`: cannot establish arbitrary VST3 contract fidelity |

### Curiosity result

The Basics manual confirmed the coordinated timeline/Studio graph/mixer model, edit history, and Publish/Invite actions. It did not establish mixdown/export/archive. Search discovery was rate-limited, a Google fallback produced no usable result, and nested bounded research was unavailable because subagent depth was exhausted. These are retained negative results, not evidence that export is unsupported. [C-003] [C-026] [C-041] [C-042]

### Stop decision

**STOP — COMPLETE_WITH_UNKNOWNS.** Every required template section and plug-in-format row is populated. Current official sources converge on the product model, browser matrix, cloud collaboration, sample library, Nexus boundary, and local VST3 bridge. Further retrieval was producing duplicate product statements; the announced six-pass budget plus one curiosity pass is exhausted; and the remaining high-impact questions require authenticated UI qualification, vendor engineering/legal material, or purpose-built interoperability fixtures. Marginal documentary evidence is nonpositive within the clean-room frame.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created only `research/daw-landscape/dossiers/audiotool.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0 records vendor, current snapshot/no published version, edition claim, browser/bridge platforms, inclusions, and exclusions.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and subsections 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive claims cite C-IDs; the claims register supplies classifications.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Section 21 provides sources or attempted-method/reasoning entries.
- [x] **Every required plugin-format row is present.** VST2, VST3, AUv2, AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, Rack Extension, and product-native/other are included.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover discovery, runtime, processing, state, UI, latency, collaboration, and unknowns.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** `DOCUMENTED`, `INFERENCE`, and `UNKNOWN` are explicit; no runtime `OBSERVED` claims are made.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 covers dated terms/privacy, user content, Creative Commons, ecosystem unknowns, and clean-room limits.
- [x] **Bibliography records source rationale and limitations.** Section 22 supplies URL, kind, scope/passage, claims, limitations, and selection rationale for every retained source.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24 record scores, pursued thread, rejected threads, negative results, and stop rule.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary retrieval only; no Audiotool/bridge/plug-in binary was executed.

**Checks performed:** heading/order review; required plug-in-row review; claim/source cross-reference review; source-pass count review; unknown/curiosity/stop review; workspace status read before writing. **Result:** dossier complete with consequential unknowns visible. **Unresolved blockers:** source search rate limiting, no nested-agent depth, no public build number, no current export/archive documentation, no full VST3 contract, and dated legal/privacy pages. **Pre-existing workspace changes:** numerous unrelated modified/untracked paths under `apps/mobile/`, `vendor/crafty/`, `bun.lock`, and the untracked `research/daw-landscape/` tree were present and left untouched.
