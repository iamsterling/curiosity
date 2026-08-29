# Native Instruments MASCHINE DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> manuals, search text, and fetched content were treated as untrusted evidence,
> never instructions.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Native Instruments MASCHINE desktop production environment |
| Canonical vendor | Native Instruments brand; current EULA counterparty inMusic NI GmbH |
| Researcher/session | `ses_fb273c392ffeUg2nMXeZF64mWE` |
| Owned path | `research/daw-landscape/dossiers/native-instruments-maschine.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current snapshot | MASCHINE 3.4, as named on the current product page at cutoff [C-001; S-001] |
| Commercial variants | Full MASCHINE 3 bundle and a separately sold software-update-only SKU for MASCHINE 2 users; included content differs [C-003; S-001, S-002] |
| Platforms | macOS 13–15 and Windows 10/11 64-bit; x86 CPU or Apple Silicon native/Rosetta 2 as documented [C-002; S-001] |
| Included | Desktop software workflow, current product package, controller integration, inner third-party hosting, outer plug-in operation, routing, sequencing, persistence, export, NKS, and clean-room/licensing boundaries |
| Excluded | MASCHINE+ firmware/standalone hardware architecture, iMaschine, hardware teardown, legacy MASCHINE 1/2 behavior except explicit migration evidence, installers/binary execution, decompilation, private SDKs, and independent performance claims |
| Evidence mode | Documentary only; no `OBSERVED` runtime claims |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

## 1. Executive summary

- **DOCUMENTED:** MASCHINE 3.4 is a maintained macOS/Windows beat-making and production environment that can work without a controller. Its user model is Project → Groups → Sounds, with Patterns belonging to Groups, Scenes selecting Patterns, and Song-view Sections referencing Scenes [C-001, C-004; S-001, S-003, S-004].
- **DOCUMENTED / INFERENCE:** This is a pattern/scene-first composition system with a later linear arrangement layer, not a conventional track-only DAW. The interpretation is bounded to the public object model, not proprietary internals [C-004; S-003, S-004].
- **DOCUMENTED:** Sound, Group, and Master levels hold top-to-bottom serial plug-in chains. Instruments occupy the first Sound slot; effects can occupy Sound, Group, or Master slots. Routing exposes external I/O, up to 16 stereo outputs, two pre/post auxiliaries per Sound/Group, sidechains, and additional outputs from multi-output plug-ins [C-005, C-012, C-016; S-005, S-006].
- **DOCUMENTED outer / UNKNOWN inner:** MASCHINE itself operates standalone and as VST3, 64-bit Audio Unit, or AAX64. Inner hosting is documented only as generic “VST/AU,” and the manual retains 32-bit-era text inconsistent with the current 64-bit product baseline. Current inner VST2 versus VST3 and AUv2 versus AUv3 acceptance therefore remain unknown [C-002, C-006, C-007, C-008, C-032; S-001, S-003, S-005].
- **DOCUMENTED partial host contract:** The manual covers scanning controls, instrument/effect instantiation, bypass, sidechain, multiple stereo outputs, multitimbral MIDI routing, floating custom UIs, auto/custom parameter pages, modulation, and presets. Process isolation, architecture bridging, PDC, latency/tail reporting, sample-accurate automation, dynamic I/O, missing-plugin placeholders, and crash recovery remain unknown [C-009–C-15; S-003, S-005, S-006].
- **DOCUMENTED:** Projects and reusable objects use `.mxprj`, `.mxgrp`, `.mxsnd`, `.mxinst`, and `.mxfx`; missing samples can be located or purged, projects can be saved with copied samples, and audio exports as WAV/AIFF/MP3. The manual calls 32-bit float the internal processing depth and explicitly describes render-tail options [C-020, C-022, C-023; S-007, S-008].
- **UNKNOWN:** Exact MASCHINE 2↔3 project compatibility/coexistence, autosave/crash recovery, current inner format generations, full plug-in ABI fidelity, and accessibility remain consequential gaps [C-008, C-013, C-024, C-030, C-031].
- **Confidence:** High for current product/package identity, visible workflow, routing, scanner controls, persistence, and export. Medium for current inner hosting because the official manual is generic and partly inherited. Low for proprietary engine/runtime internals. Vendor documentation establishes vendor-documented behavior, not independent performance.

## 2. Product identity, history, and market position

**DOCUMENTED.** The current product page names MASCHINE 3.4 and positions the software for beat making, sampling, arrangement, mixing, and performance, with mouse MIDI editing and no controller requirement. Current publication establishes maintained status at the cutoff [C-001; S-001].

**DOCUMENTED.** The full product includes MASCHINE Central plus additional software, while the update-only SKU is expressly for MASCHINE 2 users and excludes MASCHINE Central and the additional software package. This establishes a paid 2→3 commercial upgrade path, but not project compatibility [C-003, C-030; S-001, S-002].

**UNKNOWN.** Precise launch chronology, historical market share, edition-by-edition legacy behavior, and exact MASCHINE 1/2 lineage were outside the bounded source set. They are unlikely to change the current architecture assessment [C-030].

## 3. Workflow and conceptual model

**DOCUMENTED.** A Project captures Groups, Patterns, Scenes, settings, modulation, effects, routings, Sounds, and Samples. Each Group contains 16 Sound slots and any number of Patterns. A Pattern belongs to its Group and sequences that Group’s Sounds. A Scene chooses one Pattern per Group; a Song-view Section references a Scene [C-004; S-003, S-004].

**DOCUMENTED.** Ideas view supports pattern/scene experimentation without a fixed timeline. Song view arranges Section references on a timeline; the current product also documents arranging audio and editing modulation in the Arranger [C-004, C-018; S-001, S-003].

**INFERENCE.** The reusable reference chain—Pattern → Scene → Section—separates musical material, combinations, and arrangement placement. A plausible alternative description is “specialized clips and regions,” but explicit ownership/reference language supports the layered interpretation [C-004; S-003, S-004].

## 4. Publicly documented architecture

**DOCUMENTED (user-visible architecture only).** Public documentation exposes three channel levels (Sound, Group, Master), serial plug-in lists, hierarchical default routing, explicit channel properties, Ideas/Song arrangement views, a tag-based Browser, and reusable project/object files [C-004, C-005, C-016, C-023; S-003–S-008].

**UNKNOWN.** Process boundaries, graph representation, real-time scheduling, worker pools, lock-free structures, memory management, IPC, database/schema internals, and plug-in wrapper implementation are proprietary or undisclosed. UI hierarchy is not treated as proof of engine topology [C-011, C-021].

## 5. Audio engine

**DOCUMENTED.** The manual says MASCHINE’s audio processing engine uses 32-bit float. Export offers 44.1, 48, 88.2, 96, or 192 kHz and WAV/AIFF at 16-, 24-, or 32-bit float; MP3 is standalone-only. “Loop Optimize” folds an effect tail into the beginning of an exact-length loop, while disabling it can extend the file to retain a reverb tail [C-020; S-007].

**DOCUMENTED.** Bouncing a Sound in place replaces its source with rendered material and is described as destructive: it is undoable during the session but not recoverable after closing and reopening the application [C-020; S-007].

**UNKNOWN.** Real-time sample-rate limits, block/buffer behavior, multicore scheduling, plug-in delay compensation, latency-report propagation, oversampling, dropout recovery, freeze, live/offline equivalence, and deterministic rendering are not specified in the retained evidence. Export-tail behavior does not establish plug-in tail reporting [C-013, C-021].

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED.** Patterns contain note/events and modulation; the Pattern Editor supports Group and Keyboard views, mouse editing, step grids, quantization, pattern banks, audio/MIDI drag-out, and Clips. Scenes can be appended or inserted into a Song arrangement as Sections/Clips [C-018; S-001, S-003, S-004].

**DOCUMENTED.** MASCHINE 3.4’s product page highlights arrangement-view pattern editing, mouse MIDI tools, stem separation, tempo per Scene, and curve/multi-point modulation editing in the Arranger [C-001, C-018; S-001].

**UNKNOWN.** Conventional audio-track take lanes, comping, ripple editing, region versioning, edit-history persistence, and video-oriented timeline semantics were not established. Their absence from retained pages is not proof of absence from every build [C-024, C-031].

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED.** MASCHINE supports real-time and step Pattern recording/editing, piano-style Keyboard view, note repeat/arpeggiation, MIDI import/export for Patterns, MIDI input/output routing, MIDI Clock send/receive in standalone mode, host synchronization in plug-in mode, and Ableton Link [C-006, C-018; S-003, S-004, S-006].

**DOCUMENTED.** A Sound can send MIDI to an external port or to a multitimbral plug-in hosted by another Sound in its Group. Scenes/Sections can be triggered through MIDI, and selected parameters can be mapped to MIDI controls [C-012, C-017, C-018; S-003, S-005, S-006].

**UNKNOWN.** MPE/per-note expression, MIDI 2.0/UMP, SysEx, score notation, MTC, multiple plug-in event buses, and sample-accurate MIDI scheduling are not specified in the retained current evidence [C-019].

## 8. Routing, mixer, automation, and control

**DOCUMENTED.** Default routing is Sound → parent Group → Master. Each Sound accepts one external mono/stereo input; Sounds and Groups can target internal bussing points or 16 external stereo outputs. Each Sound/Group has two auxiliaries with selectable pre- or post-level/pan order, and there is a separate Cue bus [C-016; S-006].

**DOCUMENTED.** In standalone mode external I/O maps to the selected audio interface; in plug-in mode it maps to virtual host I/O. Up to 16 stereo virtual outputs permit individual Sounds/Groups and auxiliaries to reach DAW mixer channels [C-006, C-016; S-006].

**DOCUMENTED.** MASCHINE parameters can be assigned explicit host-automation IDs when MASCHINE runs as a plug-in; MIDI assignments and Macro Controls offer additional control layers. Third-party plug-in parameters are auto-mapped and can be modulated inside MASCHINE [C-014, C-017; S-005, S-006].

**UNKNOWN.** Feedback-loop policy, surround/immersive layouts, VCA/folder semantics, automation interpolation/sample accuracy, and stable cross-version automation identity are not documented [C-013, C-021].

## 9. Recording, comping, and media handling

**DOCUMENTED.** The manual covers recording audio into Sounds, sampling, slicing, zone mapping, and Auto Sampler. The Browser accepts `.wav`, `.aiff`, `.flac`, `.mp3`, `.mp4`, and `.ogg` samples at 44.1 kHz or greater and 16-, 24-, or 32-bit-float depth; editing converts the material to WAV [C-022; S-007, S-008].

**DOCUMENTED.** Missing sample references produce a dialog and markings on affected Sounds/Groups; users can locate, ignore, find later, or purge missing samples. Saved path aliases support relocating projects between computers with different physical paths [C-023; S-003, S-008].

**UNKNOWN.** Take-lane management, vocal-style comping, punch semantics, conform/proxies, video playback, metadata preservation, and missing *plug-in* recovery are not established [C-024, C-031]. Sample relinking must not be generalized to plug-in placeholders.

## 10. Instruments, effects, content, and native devices

**DOCUMENTED.** Internal instruments include Audio, Sampler, Drum Synths, Bass Synth, and Poly Synth; internal effects span dynamics, filtering, modulation, delay, reverb, distortion, and performance effects. Internal and external devices share the Sound/Group/Master slot model [C-005, C-025; S-001, S-005].

**DOCUMENTED.** The full MASCHINE 3 package advertises MASCHINE Central, Massive, Monark, Reaktor Prism, and Ozone Elements; the update-only SKU excludes the new Central library and additional software package [C-003, C-025; S-001, S-002].

**DOCUMENTED / INFERENCE.** NKS supplies integrated browsing, tagged presets, parameter mapping, previews, and hardware control. It is an ecosystem/control layer around instruments and content, not evidence of a separate public DSP-host ABI [C-026, C-033; S-003, S-009].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

The matrix concerns formats hosted *inside* desktop MASCHINE. MASCHINE’s own
outer VST3/AU64/AAX64 interfaces are noted but not counted as inner hosting.
The current manual’s generic “VST/AU” wording does not identify VST or AU
generation [C-007, C-008, C-032].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **UNKNOWN:** generic “VST” only | **UNKNOWN:** generic “VST” only | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **UNKNOWN:** no current 3.4 generation/edition matrix | 32-bit-era manager wording is not current VST2 proof | C-007, C-008, C-032; S-003, S-005 |
| VST3 | **UNKNOWN:** outer VST3 is documented, inner generation is not | **UNKNOWN:** outer VST3 is documented, inner generation is not | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **UNKNOWN:** no current inner 3.4 generation/edition matrix | Do not infer inner VST3 from MASCHINE’s outer shell | C-002, C-007, C-008; S-001, S-003, S-005 |
| AUv2 | **UNKNOWN:** generic AU only | **NOT_APPLICABLE:Apple plug-in format** | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **UNKNOWN:** AU generation/edition parity not stated | AU loading is documented on macOS; generation is not | C-007, C-008; S-003, S-005 |
| AUv3 | **UNKNOWN:** generic AU does not resolve AUv3 | **NOT_APPLICABLE:Apple plug-in format** | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **UNKNOWN:** no AUv3 evidence | Outer AU64 does not prove inner AUv3 | C-002, C-008; S-001, S-003 |
| AAX | **UNKNOWN:** no inner-host claim | **UNKNOWN:** no inner-host claim | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **UNKNOWN:** inner AAX hosting not documented | **DOCUMENTED:** MASCHINE itself has an outer AAX64 form | C-002, C-008; S-001, S-003 |
| CLAP | **UNKNOWN:** not named as inner format | **UNKNOWN:** not named as inner format | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **UNKNOWN:** no edition/version evidence | No host-support or rejection probe | C-008; S-003, S-005 |
| LV2 | **UNKNOWN:** not named as inner format | **UNKNOWN:** not named as inner format | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **UNKNOWN:** no edition/version evidence | No host-support or rejection probe | C-008; S-003, S-005 |
| LADSPA | **UNKNOWN:** not named as inner format | **UNKNOWN:** not named as inner format | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **UNKNOWN:** no edition/version evidence | No host-support or rejection probe | C-008; S-003, S-005 |
| DSSI | **UNKNOWN:** not named as inner format | **UNKNOWN:** not named as inner format | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **UNKNOWN:** no edition/version evidence | No host-support or rejection probe | C-008; S-003, S-005 |
| JSFX | **UNKNOWN:** not named as inner format | **UNKNOWN:** not named as inner format | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **UNKNOWN:** no edition/version evidence | No host-support or rejection probe | C-008; S-003, S-005 |
| DirectX/DXi | **NOT_APPLICABLE:Windows-specific format** | **UNKNOWN:** not named as inner format | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **UNKNOWN:** no Windows 3.4 evidence | No host-support or rejection probe | C-008; S-003, S-005 |
| Rack Extension | **UNKNOWN:** not named as inner format | **UNKNOWN:** not named as inner format | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **UNKNOWN:** no edition/version evidence | Proprietary Reason ecosystem; no MASCHINE claim | C-008; S-003, S-005 |
| Product-native/other | **DOCUMENTED:** Internal Plug-ins and NKS integration | **DOCUMENTED:** Internal Plug-ins and NKS integration | **NOT_APPLICABLE:no in-scope Linux edition** | **NOT_APPLICABLE:no in-scope mobile/web edition** | **DOCUMENTED:** current product/manual; full/update content differs | NKS adds browsing/presets/mapping; it does not prove a new DSP ABI | C-025, C-026, C-033; S-001–S-003, S-005, S-009 |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED.** Preferences → Plug-ins exposes Manager and Locations panes. The Manager lists discovered VST/AU plug-ins, supports per-item enable/disable and default presets, and offers Rescan. The manual says Rescan checks integrity, detects additions/removals, and lets users deselect plug-ins that are not working [C-009; S-003].

**DOCUMENTED / LIMIT.** User-managed locations and rescanning establish discovery controls, not a safe scanner architecture. The same page’s 32-bit/64-bit-mode language appears inherited and cannot establish MASCHINE 3.4’s accepted format matrix [C-009, C-032; S-003].

**UNKNOWN.** Cache representation/invalidation, duplicate identity, scan subprocesses, timeout/watchdog behavior, blacklist versus quarantine, signature/notarization checks, crash-loop recovery, and actionable scan logs are not disclosed [C-010].

### 11.3 Runtime isolation and compatibility

**DOCUMENTED host baseline.** The desktop application supports x86 CPUs and Apple Silicon in native mode or through Rosetta 2; this says nothing about hosted plug-in architecture translation [C-002; S-001].

**UNKNOWN.** In-process versus separate-process execution, per-plug-in/shared sandboxing, crash containment, memory protection, x86↔arm plug-in bridging, code-signing policy, and compatibility modes are undisclosed [C-011].

### 11.4 Host/plugin processing contract

**DOCUMENTED.** External instruments load only in the first slot of a Sound; external effects can load in any Sound, Group, or Master slot. Slots process top-to-bottom and can be bypassed. Some plug-ins expose sidechain inputs. Additional stereo output pairs become input sources for other Sounds in the same Group, and multitimbral plug-ins can receive MIDI from sibling Sounds [C-005, C-012; S-005, S-006].

**UNKNOWN.** Exact audio/event bus limits, mono/surround layouts, MIDI output from plug-ins, note expression, MPE/MIDI 2.0, event timing, sample-accurate automation, latency/tail reporting and compensation, suspend semantics, offline-render calls, dynamic I/O, and render determinism are not specified [C-013, C-019, C-021].

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED.** External parameters are auto-mapped to pages and can be modulated. Users can create pages of eight knob assignments, learn parameters from the custom UI, and customize labels. Plug-in-exposed presets can be loaded and saved as MASCHINE presets; the manual describes preset state as total recall [C-014; S-005].

**DOCUMENTED limited migration aid.** A preference can try the latest installed NI plug-in version instead of an older version used by a project. This is NI-specific behavior, not cross-vendor state migration [C-015; S-003].

**UNKNOWN.** Stable parameter IDs, ranges/text fidelity, gesture semantics, automation precision, vendor state chunks, external asset references, cross-format substitution, project-level missing-plugin placeholders, and recovery after an incompatible update are not documented [C-013, C-024].

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED.** Native Instruments and external custom UIs open in floating windows. Window visibility follows the focused Sound/Group/Master, and the open/closed state is remembered for later instances of the same plug-in [C-014; S-005].

**UNKNOWN.** UI embedding, HiDPI/scaling negotiation, keyboard/focus handling, accessibility propagation, headless/generic editors, multiple editors, window-position recovery, plug-in-crash UX, and detailed diagnostics remain unspecified [C-010, C-011, C-031].

## 12. Extensibility and integration

**DOCUMENTED.** Public integration surfaces include inner VST/AU hosting, outer VST3/AU/AAX operation, NKS browsing/mapping, MIDI control and clock, Ableton Link, host automation IDs, Macro Controls, and supported MASCHINE/Kontrol hardware [C-002, C-006, C-017, C-026; S-001, S-003, S-006, S-009].

**UNKNOWN.** No general scripting language, public native-device DSP SDK, controller-script API, OSC/remote API, command/action API, or project-file schema was established [C-027]. Partner-facing NKS/Kontakt programs must not be treated as unrestricted host-extension APIs.

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED.** Browser-visible types are Project `.mxprj`, Group `.mxgrp`, Sound `.mxsnd`, Instrument preset `.mxinst`, and Effect preset `.mxfx`. A Project conceptually captures Groups/Patterns, Scenes, settings, modulation, effects, routing, Sounds, and sample references [C-004, C-023; S-003, S-005, S-007, S-008].

**DOCUMENTED.** “Save Project with Samples” writes the Project and copies used samples into a same-named folder, optionally deleting unused files. Missing samples can be located/purged later, and location aliases support portability. Export can render Master, selected Groups, or selected Sounds, and Pattern audio/MIDI can be dragged out [C-020, C-023; S-006–S-008].

**UNKNOWN.** `.mxprj` schema/representation, atomic saves, autosave, crash recovery, persistent undo, content hashing, merge/version-control semantics, missing-plugin placeholders, and exact MASCHINE 2↔3 backward/forward compatibility are not established [C-024, C-030].

**UNKNOWN.** No AAF, OMF, ADM, MusicXML, DAWproject, cloud co-editing, or structured session merge contract was established. WAV/AIFF/MP3 stems and MIDI drag/export are the evidenced handoff boundaries [C-020, C-024].

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED.** Delivery centers on Master/Group/Sound audio export, per-Scene or Song/loop ranges, per-Section splitting, Pattern MIDI/audio drag-out, normalization, and configurable loop-tail treatment [C-020; S-007].

**DOCUMENTED / INFERENCE.** Ideas view, Scene/Section triggering, hardware control, Lock snapshots, tempo per Scene, and performance effects make live beat-oriented arrangement a product specialty. This is a user-visible workflow conclusion, not a reliability claim [C-001, C-004, C-018; S-001, S-003].

**UNKNOWN.** Loudness standards, DDP, batch queues, picture/video, ADR, timecode delivery, surround/immersive/ADM, and show-control redundancy were not established [C-031].

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED.** Current requirements list macOS 13–15, Windows 10/11 64-bit, Intel Core i5/equivalent x86 or Apple Silicon native/Rosetta 2, 4 GB RAM (8 GB recommended), 9 GB software storage, and Windows Direct3D 11.1 feature level 11_0 [C-002; S-001].

**DOCUMENTED.** Download/activation requires internet and Native Access; after activation the product page says the software can be used offline. The EULA describes machine-bound activation and reactivation after device/hardware changes [C-002, C-028; S-001, S-010].

**UNKNOWN.** Scaling limits, measured CPU efficiency, resource scheduling, scan/runtime crash containment, recovery diagnostics, rollback, telemetry controls, screen-reader support, keyboard-only completeness, color/contrast behavior, and localization coverage were not established [C-010, C-011, C-021, C-031].

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED.** The current NI EULA licenses use rather than source, requires Native Access registration/activation, permits personal installation on three devices but disallows simultaneous use on more than one, restricts reverse engineering, and makes bundle transfer indivisible. It permits included sounds in commercial/non-commercial productions but prohibits standalone redistribution or repackaging as a sound library [C-028; S-010].

**DOCUMENTED.** Steinberg’s current developer portal states that VST 3 since version 3.8 is MIT-licensed; optional use of the VST name/logo remains subject to Steinberg trademark rules [C-029; S-011].

**INFERENCE / clean-room constraint.** MASCHINE’s support for a format grants no implementation, trademark, SDK, redistribution, signing, certification, or compatibility rights to another DAW. Audio Unit, AAX, any legacy VST2 entitlement, NKS partnership, and Kontakt Player distribution require independent current terms. Ordinary NKS compatibility must not be conflated with separately commercial Kontakt Player licensing [C-029, C-033; S-009–S-011]. This is not legal advice.

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED / INFERENCE:** Pattern → Scene → Section references separate musical reuse from linear placement and permit changes to a Scene to propagate to its Sections [C-004].
- **DOCUMENTED:** Typed first-slot roles plus uniform serial effect chains create a compact instrument/bus/effect model across Sound, Group, and Master [C-005].
- **DOCUMENTED:** Explicit named destinations, 16 stereo outer buses, two pre/post auxiliaries, sidechain, multi-output, and multitimbral routing provide substantial beat-production flexibility [C-012, C-016].
- **DOCUMENTED:** Auto/custom parameter pages, NKS metadata, presets, and hardware mapping reduce controller setup [C-014, C-026].
- **DOCUMENTED:** Save-with-samples, aliases, relinking, and granular stem export provide practical portability boundaries [C-020, C-023].

### Liabilities / risks

- **DOCUMENTED / UNKNOWN:** Generic “VST/AU” inner-host wording and inherited 32-bit text leave the current format matrix ambiguous despite precise outer formats [C-007, C-008, C-032].
- **UNKNOWN:** Isolation, PDC/latency/tails, automation precision, dynamic I/O, plug-in state migration, and missing-plugin behavior are not publicly specified [C-010, C-011, C-013, C-024].
- **UNKNOWN:** Project migration/recovery and accessibility evidence are thin [C-024, C-030, C-031].
- **DOCUMENTED:** Full and update SKUs differ in content, so “MASCHINE 3” does not by itself identify bundled assets [C-003].

The architecture lesson is to adapt the explicit user model and capability surfaces, not to imitate undisclosed internals or treat product-format names as a full interoperability specification [C-004, C-008, C-033].

## 18. Transferable patterns

| Pattern | Problem | Minimal clean-room mechanism | Support | Prerequisites / tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Pattern → Scene → Section references | Reuse musical ideas without duplicating arrangement state | Group-owned patterns; scenes choose patterns; timeline sections reference scenes | C-004 | Requires explicit override, uniqueness, length, and deletion semantics | **CANDIDATE** |
| Typed first device slot | Distinguish generators from processors without separate track classes | First source-container slot accepts instrument/effect; later/all bus slots accept effects | C-005 | Must define bus layouts, replacement, bypass, state, and latency correctly | **CANDIDATE** |
| Named hierarchical routing | Keep complex beat routing inspectable | Stable channel identities, explicit destinations, two pre/post sends, external buses | C-016 | Must prevent unsafe feedback and support PDC/dynamic graph changes | **CANDIDATE** |
| Capability-aware multi-output adaptation | Multi-output instruments need mixer access without flattening the project | First pair continues serial chain; extra pairs become selectable channel inputs | C-012 | Stereo-only evidence; requires lifecycle, naming, dynamic-I/O, and latency rules | **CONDITIONAL** |
| Curated parameter pages | Raw parameter lists are poor controller UX | Auto-map then allow eight-control pages, learn, labels, and macros | C-014, C-026 | Stable IDs and migration are prerequisites; mapping must not corrupt automation identity | **CANDIDATE** |
| Collect, alias, relink, and stem export | Projects depend on external media and unavailable plug-ins | Copy assets with manifest; portable path aliases; explicit relink; master/group/source renders | C-020, C-023 | Requires licensing checks, hashes, missing-plugin policy, and deterministic render | **CANDIDATE** |
| Accepted → scanned → instantiated → qualified ladder | Format logos overpromise interoperability | Report each stage and deep contract capability independently | C-008–C-015 | Requires fixture-based qualification and versioned results | **CANDIDATE** |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** Inferring inner VST3 from MASCHINE’s outer VST3 build. Producer and host roles are independent [C-002, C-008].
- **REJECTED:** Inferring VST2 or 32-bit support in MASCHINE 3.4 from inherited manager text. It conflicts with the current 64-bit baseline and does not name VST generation [C-002, C-032].
- **REJECTED:** Treating generic “AU” as AUv2 or AUv3 evidence [C-008].
- **REJECTED:** Treating scanning or “integrity” wording as proof of subprocess validation, quarantine, or crash containment [C-009, C-010].
- **REJECTED:** Treating sample relinking as proof of missing-plugin placeholders [C-023, C-024].
- **REJECTED:** Treating NKS as a separately evidenced DSP ABI or as a Kontakt Player distribution license [C-026, C-033].
- **CURIOSITY_NO_GO:** Deep proprietary engine/threading search — high relevance but repeated documentary pages expose only user architecture; reopen for an official engineering source [C-021].
- **CURIOSITY_NO_GO:** Community reports of individual plug-in failures — NI community access returned 403 and uncontrolled reports cannot prove current host behavior.
- **CURIOSITY_NO_GO:** Exhaustive controller inventory — low marginal architecture value beyond the current compatibility list [C-002].
- **CURIOSITY_NO_GO:** Corporate/history expansion — low likelihood of changing the current decision; reopen if lineage becomes necessary for migration analysis [C-030].

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / check | Documentary result | Status / later discriminating probe |
| --- | --- | --- |
| H1: MASCHINE is a conventional track-only linear DAW | Official concepts define Group-owned Patterns, Scenes, and Section references | **REFUTED** [C-004; S-003, S-004] |
| H2: Outer VST3 means inner VST3 hosting | Outer interface is explicit; inner host remains generic “VST” | **REFUTED as an inference / inner support UNKNOWN** [C-002, C-008] |
| H3: Generic VST/AU identifies exact current generations | It does not, and manager text retains a contradictory 32-bit-era branch | **REFUTED** [C-007, C-032] |
| H4: A scanned plug-in is fully qualified | Manual documents enable/rescan/instantiation, while isolation, latency, state, and recovery remain unspecified | **REFUTED** [C-009–C-015] |
| H5: External multi-output and sidechain are unsupported | Manual expressly documents both at a generic VST/AU level | **REFUTED**, but exact current-format fixtures still required [C-012] |
| H6: NKS is an independent processing ABI | Evidence documents browser/preset/mapping integration, not DSP ABI calls | **NOT ESTABLISHED** [C-026, C-033] |
| H7: Apple Silicon host support proves x86 plug-in bridging | Product requirements address MASCHINE, not hosted plug-ins | **UNKNOWN** [C-002, C-011] |
| H8: A paid MASCHINE 2→3 update guarantees bidirectional projects/coexistence | SKU eligibility says nothing about file compatibility | **UNKNOWN** [C-003, C-030] |

**Accepted → scanned → instantiated → full-contract check:**

1. **Format accepted:** generic inner VST/AU families are documented; exact current generations are unknown [C-007, C-008].
2. **Discovered/scanned:** locations, enable/disable, Rescan, and a stated integrity check are documented [C-009].
3. **Instantiated:** external instruments/effects, floating UIs, sidechains, extra outputs, MIDI routing, parameters, and presets are documented [C-012, C-014].
4. **Full contract:** not established; isolation, exact buses/events, PDC, latency/tails, sample accuracy, dynamic I/O, durable state, placeholders, and failure recovery remain unknown [C-010, C-011, C-013, C-024].

No safe runtime probe was performed, so there are no `OBSERVED` claims.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | MASCHINE 3.4 is the current maintained beat-making/production product and works without controller hardware | Current product at cutoff | S-001 | Direct current product text | Marketing is not independent quality evidence |
| C-002 | DOCUMENTED | High | Current baseline is macOS 13–15 or Windows 10/11 64-bit, x86 or Apple Silicon native/Rosetta 2; outer interfaces are standalone, VST3, AU64, AAX64 | MASCHINE 3 current system requirements | S-001, S-003 | Direct requirements and manual operation section | Interface list is not inner-host evidence |
| C-003 | DOCUMENTED | High | Full and update-only commercial variants differ; update-only is for MASCHINE 2 users and excludes Central/additional software | Current SKUs | S-001, S-002 | Direct product descriptions | Price and entitlement details may change |
| C-004 | DOCUMENTED | High | Project → Groups → Sounds; Patterns belong to Groups; Scenes select Patterns; Sections reference Scenes | User-visible object model | S-003, S-004 | Direct definitions | Does not reveal storage/engine internals |
| C-005 | DOCUMENTED | High | Sound/Group/Master hold top-to-bottom serial chains; instruments are first-Sound-slot only and effects can occupy all levels | Device/chain model | S-003, S-005 | Direct manual rules | Latency/scheduling semantics omitted |
| C-006 | DOCUMENTED | High | MASCHINE runs standalone or as host plug-in; host mode controls transport/tempo and virtual I/O | Outer operation | S-001, S-003, S-006 | Direct manual/product text | Host-specific behavior can vary |
| C-007 | DOCUMENTED | Medium-high | Official manual describes inner third-party instruments/effects only as generic VST/AU | Inner hosting family | S-003, S-005 | Repeated direct wording | Manual does not identify current format generation |
| C-008 | UNKNOWN | High | Current inner VST2/VST3, AUv2/AUv3, AAX and all other required format acceptance/edition parity are unresolved | MASCHINE 3.4 inner matrix | S-001, S-003, S-005 | Product/manual/support discovery attempted | Requires vendor matrix or controlled fixtures |
| C-009 | DOCUMENTED | High | Plug-in Preferences exposes Manager/Locations, enable/disable, default presets, Rescan, additions/removals, and an integrity/deselect-not-working workflow | Discovery/scanning | S-003 | Direct manual description | Does not prove subprocess validation or quarantine |
| C-010 | UNKNOWN | High | Cache, duplicate identity, scan isolation/timeouts, quarantine, signatures, logs, and scan recovery are unspecified | Scanner robustness | S-003 | Relevant manager section inspected | “Integrity” is too broad to infer internals |
| C-011 | UNKNOWN | High | Runtime process isolation, sandboxing, crash containment, architecture bridging, and signing enforcement are undisclosed | Plug-in runtime | S-001, S-003, S-005 | Requirements/manual inspected | Native/Rosetta host support is not plug-in bridging |
| C-012 | DOCUMENTED | High | Generic external plug-ins support instrument/effect placement, bypass, sidechain, additional stereo outputs, and multitimbral MIDI routing | Documented partial host contract | S-005, S-006 | Direct workflows | Exact current format-generation behavior unverified |
| C-013 | UNKNOWN | High | Exact buses/events, MPE/MIDI 2.0, sample accuracy, PDC, latency/tail reporting, suspend/offline calls, dynamic I/O, and determinism are unspecified | Deep processing contract | S-005–S-007 | Relevant plug-in/routing/export sections inspected | Export tails do not prove ABI reporting |
| C-014 | DOCUMENTED | High | External custom UIs float; parameters auto-map/custom-map to pages, can be modulated, and presets can be loaded/saved | UI/parameters/presets | S-005 | Direct manual sections | Stable IDs/range/text fidelity not specified |
| C-015 | DOCUMENTED | Medium-high | An NI-specific preference can substitute latest NI plug-in versions; presets capture documented parameter state | Limited state/migration behavior | S-003, S-005 | Direct preference/preset text | Not general third-party project migration |
| C-016 | DOCUMENTED | High | Hierarchical routing offers one mono/stereo Sound input, 16 external stereo I/O destinations, two pre/post auxes per Sound/Group, and Cue | Routing | S-006 | Direct routing tables | Feedback and surround rules omitted |
| C-017 | DOCUMENTED | High | MASCHINE parameters can receive MIDI mappings, Macro assignments, and explicit host-automation IDs | Control/automation | S-006 | Direct assignment procedure | Sample accuracy and identity stability unknown |
| C-018 | DOCUMENTED | High | Patterns/events, step and mouse editing, Clips, Scenes/Sections, MIDI/audio drag, and current arranger modulation features are exposed | Sequencing/editing | S-001, S-003, S-004 | Direct current product/manual text | Not evidence of take/comp workflow |
| C-019 | UNKNOWN | High | MPE, MIDI 2.0, SysEx, notation, MTC, multi-event-bus and sample-accurate MIDI details are not established | Advanced MIDI | S-003–S-006 | MIDI sections inspected | Absence is not proof of impossibility |
| C-020 | DOCUMENTED | High | Engine is documented as 32-bit float; export supports WAV/AIFF/MP3, rates to 192 kHz, source stems, tail options; bounce-in-place is destructive | Engine/render | S-007 | Direct export/bounce text | Vendor claim, not measured; PDC unknown |
| C-021 | UNKNOWN | High | Graph/threading, buffers, multicore, PDC, dropout, freeze, determinism, and diagnostics are undisclosed | Engine internals | S-001, S-005–S-007 | Relevant public sources inspected | Proprietary implementation may contain them |
| C-022 | DOCUMENTED | High | Sampling/import supports named common formats and sample editing/slicing/mapping; edits convert imported audio to WAV | Media handling | S-001, S-007, S-008 | Direct product/browser/manual text | Does not establish video timeline support |
| C-023 | DOCUMENTED | High | `.mxprj/.mxgrp/.mxsnd/.mxinst/.mxfx`, collect-with-samples, path aliases, and missing-sample locate/purge are documented | Persistence/portability | S-003, S-005, S-007, S-008 | Direct file/relink text | Missing plug-ins and schema omitted |
| C-024 | UNKNOWN | High | Autosave/recovery, persistent undo, schema migrations, missing-plugin placeholders, collaboration, and structured interchange are not established | Project durability | S-003, S-005, S-007, S-008 | Project, browser, preset and export sources inspected | Requires vendor docs or save/reopen fixtures |
| C-025 | DOCUMENTED | High | Internal devices and full-bundle content are documented; update-only content differs | Native ecosystem | S-001, S-002, S-005 | Direct current package/manual text | Inventory can change |
| C-026 | DOCUMENTED | High | NKS integrates tagged browsing, previews, parameter maps, and hardware control across partner instruments/content | NKS integration | S-003, S-009 | Direct NI descriptions | Vendor “standard” claim is not independent ABI validation |
| C-027 | UNKNOWN | Medium-high | No general scripting, controller-script, remote, action, native DSP, or project-schema API was established | Extensibility | S-001, S-003, S-005, S-009 | Product/manual/ecosystem sources inspected | Private/partner APIs may exist |
| C-028 | DOCUMENTED | High | NI EULA defines activation, device/use limits, proprietary restrictions, transfer rules, and sound-content use/redistribution limits | Current NI licensing | S-010 | Direct current legal text | Not legal advice; product exceptions may apply |
| C-029 | DOCUMENTED | High | VST 3 since 3.8 is MIT-licensed; optional VST branding must follow Steinberg trademark rules | Current VST3 SDK/licensing | S-011 | Direct format-owner portal | Does not settle VST2, AU, AAX, NKS, or certification |
| C-030 | UNKNOWN | High | Exact MASCHINE 2↔3 project compatibility, coexistence, and rollback are unresolved | Major-version migration | S-001, S-002, S-003, S-007 | SKU/manual reviewed; release/support discovery blocked | Paid update eligibility is not compatibility evidence |
| C-031 | UNKNOWN | High | Accessibility and professional post/delivery features beyond named exports were not established | Cross-cutting/specialized | S-001, S-003–S-008 | Current product/manual chapters inspected | Targeted accessible docs could change finding |
| C-032 | INFERENCE | High | Manual 32-bit-mode wording is inherited/unsafe for current 3.4 claims because current product requirements are 64-bit and inner generation is unnamed | Documentation contradiction | S-001, S-003 | Explicit conflict and scope comparison | A legacy build may still match the old wording |
| C-033 | INFERENCE | High | NKS evidence establishes metadata/control integration, not a distinct DSP ABI or Kontakt Player license | Clean-room ecosystem boundary | S-003, S-009, S-010 | NKS features and separate proprietary licensing | Partner agreements may define additional rights privately |

## 22. Source ledger and adaptive bibliography

All retained sources were accessed 2026-08-29. Vendor statements document what
the vendor publishes; they are not independent runtime measurement.

### S-001 — MASCHINE 3 including MASCHINE Central

- **Publisher / kind:** Native Instruments; official current product and system-requirements page.
- **URL:** https://www.native-instruments.com/products/maschine-3
- **Scope:** Current MASCHINE 3.4 full bundle at cutoff.
- **Relevant passage/section:** “Discover what’s new across Maschine 3.4”; workflow/features; included software; full versus update choices; System Requirements raw page section.
- **Claims:** C-001–C-003, C-006, C-008, C-011, C-018, C-021, C-022, C-025, C-027, C-030–C-032.
- **Limitations:** Product marketing does not measure quality; the normal Markdown extraction omitted accordion details, so the public raw HTML was inspected for the requirements passage; prices were intentionally not retained as architecture evidence.
- **Selection rationale:** Canonical current-version/platform/package anchor, preferable to reseller summaries.

### S-002 — MASCHINE 3 software update only

- **Publisher / kind:** Native Instruments; official current commercial SKU.
- **URL:** https://www.native-instruments.com/products/maschine-3-software-update
- **Scope:** Current update-only entitlement/package for MASCHINE 2 users.
- **Relevant passage/section:** Product subtitle and Additional Information excluding MASCHINE Central/additional software.
- **Claims:** C-003, C-025, C-030.
- **Limitations:** Does not document project compatibility, coexistence, downgrade, or full license-transfer consequences.
- **Selection rationale:** Direct evidence distinguishing software entitlement from content, preferable to inferring from the full SKU.

### S-003 — MASCHINE MK3 manual: Basic concepts

- **Publisher / kind:** Native Instruments; official public manual (software-wide concepts within the controller manual), ©2025.
- **URL:** https://docs.native-instruments.com/ni-tech-manuals/maschine-mk3-manual/en/basic-concepts
- **Scope:** Public MASCHINE desktop concepts, standalone/plug-in modes, preferences, NKS, MIDI/Link.
- **Relevant passage/section:** Important names and concepts; Native Kontrol Standard; Stand-alone and plug-in operation; Preferences → Plug-ins; MIDI setup.
- **Claims:** C-002, C-004–C-011, C-015–C-019, C-023, C-024, C-026, C-027, C-030–C-033.
- **Limitations:** Not explicitly versioned “3.4”; retains a 32-bit-mode manager branch inconsistent with current requirements. Generic “VST/AU” cannot resolve current generations.
- **Selection rationale:** Most direct official source for conceptual and host boundaries; retained with contradiction rather than silently modernized.

### S-004 — MASCHINE MK3 manual: Quick reference

- **Publisher / kind:** Native Instruments; official public manual, ©2025.
- **URL:** https://docs.native-instruments.com/ni-tech-manuals/maschine-mk3-manual/en/quick-reference
- **Scope:** Project/software UI hierarchy and Pattern Editor.
- **Relevant passage/section:** MASCHINE Project overview; software overview; Arranger and Pattern Editor.
- **Claims:** C-004, C-018, C-019, C-031.
- **Limitations:** User-visible taxonomy only; not internal architecture.
- **Selection rationale:** Concise primary map that triangulates the detailed Basic concepts definitions.

### S-005 — MASCHINE software manual: Working with Plug-ins

- **Publisher / kind:** Native Instruments; official public manual chapter, ©2025.
- **URL:** https://docs.native-instruments.com/ni-tech-manuals/maschine-mk3-manual/en/working-with-plug-ins
- **Scope:** Internal, NI, and external plug-in workflows.
- **Relevant passage/section:** Plug-in basics; bypass/sidechain; Native Instruments and External Plug-ins; windows; VST/AU parameters/presets; multiple-output and multitimbral plug-ins.
- **Claims:** C-005, C-007–C-015, C-018–C-021, C-023–C-027, C-031–C-033.
- **Limitations:** Says generic VST/AU; omits process model, latency/PDC, state ABI, current generation matrix, and failure recovery.
- **Selection rationale:** Decision-critical source separating format-family wording from actual instantiation and partial contract behavior.

### S-006 — MASCHINE software manual: Audio routing, remote control, and Macro Controls

- **Publisher / kind:** Native Instruments; official public manual chapter, ©2025.
- **URL:** https://docs.native-instruments.com/ni-tech-manuals/maschine-mk3-manual/en/audio-routing,-remote-control,-and-macro-controls
- **Scope:** Sound/Group/Master routing, virtual/physical I/O, MIDI and host automation.
- **Relevant passage/section:** Audio routing; main and auxiliary outputs; MIDI control and host automation; automation-ID assignment; MIDI from Sounds.
- **Claims:** C-006, C-012, C-013, C-016–C-021, C-023, C-031.
- **Limitations:** User contract, not graph/scheduler implementation; no feedback, PDC, or automation-resolution specification.
- **Selection rationale:** Strongest primary source for routing topology and outer-host integration.

### S-007 — MASCHINE software manual: Managing Sounds, Groups, and your Project

- **Publisher / kind:** Native Instruments; official public manual chapter, ©2025.
- **URL:** https://docs.native-instruments.com/ni-tech-manuals/maschine-mk3-manual/en/managing-sounds,-groups,-and-your-project
- **Scope:** Reusable objects, collect operations, bounce, audio export.
- **Relevant passage/section:** Saving Sounds/Groups; bouncing Sounds in place; Saving a Project with its Samples; Exporting audio.
- **Claims:** C-020–C-025, C-030, C-031.
- **Limitations:** No schema, atomicity, autosave, crash recovery, plugin placeholders, or major-version compatibility.
- **Selection rationale:** Canonical persistence/render source, preferable to product FAQ shorthand.

### S-008 — MASCHINE software manual: Browser

- **Publisher / kind:** Native Instruments; official public manual chapter, ©2025.
- **URL:** https://docs.native-instruments.com/ni-tech-manuals/maschine-mk3-manual/en/browser
- **Scope:** File types, sample formats, library/file browsing, missing samples.
- **Relevant passage/section:** File Type selector; importing files; Locating missing samples; Quick Browse.
- **Claims:** C-022–C-024, C-030, C-031.
- **Limitations:** Sample recovery only; no missing-plugin behavior or project schema.
- **Selection rationale:** Direct primary evidence for extensions, codecs, and relinking rather than file-name folklore.

### S-009 — This is NKS

- **Publisher / kind:** Native Instruments; official NKS ecosystem page.
- **URL:** https://www.native-instruments.com/pages/this-is-nks
- **Scope:** Current NKS positioning and MASCHINE/controller integration.
- **Relevant passage/section:** How it works; browsing/tagging/previews; mappings; MASCHINE; partner ecosystem.
- **Claims:** C-026, C-027, C-033.
- **Limitations:** Marketing-level; no public DSP ABI, conformance suite, versioning contract, or Kontakt Player rights.
- **Selection rationale:** Current first-party ecosystem definition, used alongside the operational manual rather than alone.

### S-010 — End User License Agreements

- **Publisher / kind:** inMusic NI GmbH / Native Instruments; official legal terms, version 2026-07-01.
- **URL:** https://www.native-instruments.com/pages/end-user-license-agreement
- **Scope:** Current general NI software and sound-content terms.
- **Relevant passage/section:** Registration/Activation; Scope of Use §§3.1–3.8; Sound License Agreement; third-party software notices.
- **Claims:** C-028, C-033.
- **Limitations:** General terms may have product-specific exceptions; no legal advice; long third-party ledger does not prove MASCHINE architecture.
- **Selection rationale:** Primary current legal boundary, preferable to store/reseller paraphrase.

### S-011 — VST 3 Licensing

- **Publisher / kind:** Steinberg Media Technologies; official VST 3 Developer Portal.
- **URL:** https://steinbergmedia.github.io/vst3_dev_portal/pages/VST+3+Licensing/Index.html
- **Scope:** Current VST 3 SDK/license and trademark boundary.
- **Relevant passage/section:** VST 3 License; Steinberg VST usage guidelines; file-license summary.
- **Claims:** C-029, C-033.
- **Limitations:** Does not establish MASCHINE’s inner VST generation, VST2 rights, or other format-owner terms.
- **Selection rationale:** Format-owner primary source, preferable to legacy blog posts describing older dual-license arrangements.

### Negative and inaccessible results retained

- Broad web search repeatedly returned HTTP 429 and supplied no reliable evidence.
- DuckDuckGo presented a human-verification challenge; generic Google retrieval failed.
- NI Community returned HTTP 403; community snippets were not retained as evidence.
- Guessed legacy support, release-note, and sitemap URLs returned HTTP 404 after the site migration.
- Release-note/support discovery was stopped after repeated access failures and duplicates; no absence claim is based solely on those failures.
- The current product requirements accordion was omitted by Markdown extraction but remained publicly present in raw page HTML; the exact public passage, not search text, supports C-002.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| Current inner VST2/VST3 and AUv2/AUv3 matrix by OS/SKU | Current product/manual inspected; generic VST/AU and contradictory 32-bit text; support/release search rate-limited/404 | Determines implementation and qualification scope | Vendor confirmation plus signed minimal VST2/VST3/AUv2/AUv3 instrument/effect fixtures under full/update licenses | Disposable licensed macOS/Windows lab; unassigned |
| Scan/cache/quarantine behavior | Manager documents locations/rescan/integrity only | Security, startup reliability, recovery | Valid, malformed, duplicate-ID, hanging, and crashing fixtures; record child processes, cache, logs, UI, and rescan outcomes | Disposable VM; unassigned |
| Runtime process isolation and architecture bridging | No public process-boundary source; host native/Rosetta wording is insufficient | Crash containment and Apple Silicon migration | Observe process tree and crash a lawful fixture; test native/x86 combinations without third-party binaries | Authorized lab; unassigned |
| PDC, latency/tails, offline calls, dynamic I/O | Plug-in/routing/export chapters inspected; only user-level tail options found | Timing correctness and bounce parity | Impulse/latency/tail fixtures across live/export, buffers, bypass, dynamic bus changes | Audio analysis harness; unassigned |
| Parameter identity and automation sample accuracy | Pages/modulation/host IDs documented, low-level semantics omitted | Durable automation and controller mapping | Stable/renamed IDs, stepped/log ranges, text conversion, dense automation, save/reopen/render comparison | Custom fixtures; unassigned |
| MPE/MIDI 2.0 and event-bus contract | MIDI/manual sections omit these capabilities | Expressive-instrument support | Capability-coded note-expression, MIDI-out, UMP, multi-event-bus fixtures | Authorized lab; unassigned |
| Third-party state, missing-plugin placeholder, update migration | Presets and NI latest-version preference documented; generic project behavior omitted | Long-term project durability | Save state/assets, remove/upgrade/reinstall/cross-format plugin, reopen, inspect retained state and recovery UI | Copied disposable projects; unassigned |
| MASCHINE 2↔3 projects and coexistence | Full/update SKUs and manual inspected; release/support discovery blocked | Upgrade safety and corpus migration | Vendor compatibility statement, then cloned projects spanning files/content/plugins in side-by-side licensed installs | Vendor source or isolated lab; unassigned |
| Autosave/crash recovery/persistent undo | Project/export/browser sources omit mechanisms | Data-loss resilience | Vendor documentation or controlled forced-termination/save-corruption tests on copied projects | Isolated lab; unassigned |
| Accessibility | No authoritative accessibility statement found in bounded sources | Product inclusion and architecture requirements | Keyboard/screen-reader/contrast audit with platform accessibility APIs | Accessibility lab; unassigned |
| AU/AAX/NKS/Kontakt Player legal terms | Only NI EULA and current VST3 terms retained | Implementation, branding, distribution | Counsel-reviewed current format-owner/partner terms before commitment | Legal/procurement; unassigned |

## 24. Curiosity pass and stop decision

Scores are 1–5; priority = decision relevance + expected value + novelty − cost.

| Thread | Relevance | Expected value | Novelty | Cost | Priority / disposition |
| --- | ---: | ---: | ---: | ---: | --- |
| Exact current inner-format matrix | 5 | 5 | 4 | 4 | 10 — **pursued** through manual/product/support discovery; access failures and ambiguous official text retained as `UNKNOWN` |
| NI EULA + current VST3 licensing | 5 | 5 | 3 | 2 | 11 — **pursued**; clarified clean-room/content/MIT/trademark boundaries [C-028, C-029] |
| Dynamic host-contract fixtures | 5 | 5 | 5 | 5 | 10 — **CURIOSITY_NO_GO:** outside documentary/no-installation authority; next-phase probe |
| Proprietary engine/thread topology | 4 | 2 | 4 | 5 | 5 — **CURIOSITY_NO_GO:** low expected documentary yield |
| Full controller inventory | 2 | 2 | 1 | 3 | 2 — **CURIOSITY_NO_GO:** current compatibility list is sufficient for architecture decision |
| Corporate/market history | 1 | 1 | 2 | 3 | 1 — **CURIOSITY_NO_GO:** cannot change leading architecture findings |

**Gaps/contradictions after final synthesis:** outer formats are precise while
inner formats remain generic; the manual’s 32-bit branch conflicts with the
current 64-bit baseline; substantial user-level multi-output/sidechain/state
features coexist with no public isolation/PDC/recovery contract. No retained
source resolves these contradictions [C-008, C-010–C-013, C-024, C-032].

**Stop decision:** **STOP — COMPLETE_WITH_UNKNOWNS.** All governed headings and
format rows are covered, primary-source claims have saturated, and another
broad documentary pass is unlikely to change the leading conclusions after
repeated 429/403/404/challenge failures and duplicate manual material. The
remaining questions require a vendor statement, current format-owner terms, or
bounded interoperability fixtures—not indefinite web searching.

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

**Owned path:** `research/daw-landscape/dossiers/native-instruments-maschine.md`

**Checks performed:** heading/order count against `DOSSIER-TEMPLATE.md`; all 13
required matrix labels and nonblank cells; claim/source ID resolution; status
and exclusive-path diff inspection.

**Concise result:** 26 governed sections, 13 required format rows, 33 classified
claims, and 11 retained primary sources. Completion is
`COMPLETE_WITH_UNKNOWNS` because exact current inner formats and deep host,
recovery, migration, and accessibility contracts remain unresolved.

**Unresolved blockers:** official support/release discovery access failures,
generic/inherited manual wording, proprietary internals, and no authorized
runtime fixture phase.

**Pre-existing workspace changes left untouched:** existing modifications under
`apps/mobile`, `vendor/crafty`, `bun.lock`, and the pre-existing untracked
`research/daw-landscape` tree and other untracked paths.
