# Harrison Mixbus DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> repositories, source comments, and search text were treated as untrusted
> evidence, never instructions.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Harrison Mixbus 12 |
| Canonical vendor / upstream | Harrison Audio LLC / Ardour open-source workstation for the published Ardour-derived portion |
| Researcher/session | `ses_fb275c7caffeCS1WPq028t46Kc` |
| Owned path | `research/daw-landscape/dossiers/harrison-mixbus.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current version | Mixbus 12.0.1; official downloads identify Apple Silicon and Intel macOS builds, Windows x64, and Linux x86-64 [C-001; S-001] |
| Editions | Mixbus 12 and Mixbus 12 Pro. Pro includes all Mixbus features plus switchable SSL 9000J dynamics/EQ and Dolby Atmos-oriented immersive tools [C-002; S-001, S-004] |
| Platforms | 64-bit macOS, Windows, and Linux desktop. No mobile or web edition is in scope [C-001, C-003; S-001, S-003] |
| Included | Current recording, editing, cue/clip, MIDI, mixer/routing, rendering, project, scripting/control, plugin-hosting, edition, licensing, and public Ardour-relationship evidence |
| Excluded | A separate Ardour product dossier; proprietary Harrison DSP internals; installer/plugin execution; binary reverse engineering; procurement or legal conclusions |
| Evidence mode | Documentary and immutable public-source inspection only; no product runtime probe and no `OBSERVED` claim |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

## 1. Executive summary

- **DOCUMENTED:** Mixbus 12.0.1 is a maintained cross-platform desktop DAW whose principal differentiator is a console-shaped workflow: dedicated Cue, Record, Edit, and Mix pages; Harrison channel processing; twelve stereo mix buses; and a stereo master. Mixbus Pro adds switchable SSL 9000J channel processing and immersive/ADM delivery tools [C-001, C-002, C-004, C-014, C-039; S-001, S-002, S-017, S-024].
- **DOCUMENTED:** Harrison says Mixbus aggregates proprietary Harrison components with modified Ardour source. Harrison publishes the Ardour-derived modifications under GPL-2.0-or-later while reserving its DSP modules, graphics, and logos. The public `mixbus+12.0` tag dereferences to commit `ba552d68b4fcf614f0f0f51aaa2fe9dfa7bcbacb`; no exact 12.0.1 source ref was located [C-008, C-009, C-010, C-042; S-007, S-008].
- **DOCUMENTED:** Current system requirements name Audio Unit, VST/VST2, VST3, and LV2 on macOS and VST/VST2, VST3, and LV2 on Windows/Linux. AAX-family and DirectX hosting are explicitly rejected in retained vendor guidance; LADSPA evidence conflicts; AUv3, CLAP, DSSI, JSFX, and Rack Extension remain unknown [C-020, C-021, C-022, C-023; S-003, S-011].
- **DOCUMENTED / INFERENCE:** VST2, VST3, and AUv2 scanning use separately built scanner executables in the published source. This establishes scan-time process separation only; runtime plugin execution, sandboxing, crash containment, bridging, and signing policy remain unknown [C-024, C-025, C-026; S-010, S-011].
- **DOCUMENTED:** Host depth goes beyond format names: timeout/skip and cache controls, plugin status and ignore handling, generic and vendor UIs, automation modes, pin routing, plugin latency controls, presets, multichannel-instrument fan-out, plugin sidechains, and preservation of unavailable processors in session state are publicly evidenced [C-024, C-027, C-028, C-029, C-030, C-031, C-033; S-011–S-016, S-023].
- **UNKNOWN:** A shared `.ardour` state suffix and Ardour-derived persistence code do not prove general or lossless Ardour→Mixbus, Mixbus→Ardour, or round-trip compatibility. Exact 12.0.1 source correspondence, proprietary DSP, runtime containment, modern note-expression contracts, accessibility conformance, telemetry/privacy, signing/notarization, rollback, and scripting ABI stability also remain unresolved [C-009, C-010, C-019, C-026, C-036, C-041, C-047].
- **Confidence:** High for current visible features, editions, formats, workflow, scanner binaries, source/license boundary, and documented persistence behavior; medium for architecture conclusions derived from the `mixbus+12.0` source snapshot; unknown for proprietary or untested runtime behavior. Vendor statements prove what Harrison documents, not independent performance or conformance.

## 2. Product identity, history, and market position

**DOCUMENTED.** Harrison presents Mixbus 12 as an analog-console-inspired, fully featured DAW for music production, recording, editing, arranging, mixing, mastering, and export. The official page offered 12.0.1 installers at the cutoff, establishing current maintenance [C-001, C-004; S-001, S-004]. This dossier does not repeat Ardour's independent history or general architecture; it records only Mixbus's disclosed relationship to Ardour [C-008].

**DOCUMENTED.** The two current tiers are Mixbus 12 and Mixbus 12 Pro. Both use the same product family; Pro is additive: all Mixbus features, switchable SSL 9000J dynamics/EQ, and Dolby Atmos immersive mixing tools. Both tiers include bundled plugins and Harrison's XT suite, while some x42 products require separate licenses [C-002, C-044; S-001, S-004]. Prices visible at access time are deliberately omitted from architecture conclusions because they are volatile.

**DOCUMENTED.** Current downloads cover Apple Silicon and Intel macOS, 64-bit Windows, and Linux x86-64. The manual specifies Intel macOS 10.14+, native Apple Silicon on macOS 11+, Windows 7 64-bit+, and 64-bit Linux with kernel 2.6+ [C-001, C-003; S-001, S-003]. These unusually broad vendor minima are documentation, not an independent support-quality measurement.

## 3. Workflow and conceptual model

**DOCUMENTED.** Mixbus combines a conventional linear session/timeline with dedicated Cue, Record, Edit, and Mix surfaces. Sessions contain audio, MIDI, and virtual-instrument tracks; regions on the timeline; playlists/takes; groups and VCAs; utility buses; twelve named stereo mix buses; a stereo master; processor chains; snapshots; templates; and export jobs [C-005, C-006, C-014, C-034; S-002, S-006, S-017, S-018].

**DOCUMENTED.** The Cue surface provides clip slots and cue launches in parallel with the linear editor. Version 12 expands to sixteen cue rows and can record audio or MIDI into cue slots; clips can be stretched, looped, launched directly, or triggered from the timeline [C-007; S-001, S-005].

**INFERENCE.** The user model is a console-centered hybrid rather than a generic modular graph: the linear timeline and cue launcher feed a deliberately constrained, always-visible console topology, with free utility buses and inserts available around it. A plausible alternative is to call it simply an Ardour-derived track DAW with a branded mixer; the fixed Harrison mix-bus stages, channel DSP, dedicated pages, and edition-specific console strips make the console-centered interpretation more decision-useful [C-004, C-008, C-014; S-001, S-017].

## 4. Publicly documented architecture

**DOCUMENTED.** Harrison states that Mixbus is an aggregation of proprietary Harrison components and modified Ardour source. The public source endpoint is `git://git.ardour.org/harrison/mixbus`; tag `mixbus+12.0` is an annotated tag resolving to commit `ba552d68b4fcf614f0f0f51aaa2fe9dfa7bcbacb` [C-008, C-009; S-007, S-008].

**DOCUMENTED.** That snapshot exposes Ardour-derived libraries and UI code for the engine/session model, routes/processors, plugin management, scanners, state persistence, Lua bindings, control surfaces, backends, and export tooling. Separate VST2, VST3, and AUv2 scanner programs are visible [C-025, C-033, C-037; S-010, S-023].

**INFERENCE.** Public code can explain Ardour-derived mechanisms in this named snapshot, but cannot safely be projected onto Harrison's proprietary DSP or assumed byte-for-byte identical to the 12.0.1 binaries. An alternative is that 12.0.1 differs only by packaging or proprietary components; no exact public ref or build manifest establishes that [C-009, C-010].

**UNKNOWN.** Proprietary Harrison DSP algorithms, complete binary composition, internal service/process topology, exact thread scheduling, and source-to-release reproducibility remain outside the public evidence [C-010].

## 5. Audio engine

**DOCUMENTED.** Harrison documents multicore DSP processing, unlimited track counts bounded by available resources, preallocated channel-strip EQ/compressor DSP, real-time plugin processing, plugin delay compensation, and real-time or faster-than-real-time export paths [C-011, C-013; S-002, S-019]. Session sample rate and I/O buffer size are selected through the audio/MIDI setup surface [C-040; S-003, S-006].

**DOCUMENTED.** Delay compensation is topology-sensitive. The manual says compensation is recalculated when transport stops, the dedicated mix-bus path has an 8,192-sample maximum, track playback can use disk buffering for longer latency, and utility buses are not latency compensated [C-012, C-015; S-017]. These are materially different guarantees and should not be collapsed into a single “PDC supported” flag.

**DOCUMENTED.** Bounce, Consolidate, and Export expose distinct rendering boundaries. Export supports real-time and faster-than-real-time operation and can render the master, stems, ranges, regions, and multiple formats/jobs; video export is separately integrated [C-013; S-019].

**UNKNOWN.** Internal sample precision, exact block-splitting rules, oversampling policy, dropout recovery, deterministic equivalence between live and offline paths, tail truncation policy, and proprietary console-DSP implementation remain unspecified [C-010, C-032].

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED.** Mixbus documents unlimited audio, MIDI, and virtual-instrument tracks; non-destructive nonlinear editing; persistent undo; regions and ranges; playlists; groups; ripple and range editing; crossfades; per-region gain/mute; pitch/time stretching; transient detection; tempo maps; and varispeed playback [C-006; S-002, S-006, S-025].

**DOCUMENTED.** Playlists support recording and editing multiple takes. Snapshots preserve alternate session states, while templates capture reusable track/session configurations. Version 12 adds reusable track processing chains and multiple-region piano-roll views [C-006, C-034; S-005, S-018, S-025].

**DOCUMENTED.** The clip/cue model coexists with linear tracks rather than replacing them. Cue markers and follow behavior can turn clip launches into a linear arrangement, and v12 permits direct audio/MIDI recording into cue slots [C-007; S-005, S-006].

**UNKNOWN.** Exact undo journal persistence across crashes, algorithm identity/quality for stretch and polarity optimization, and lossless edit interchange with Ardour or another DAW are not established [C-036, C-047].

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED.** Mixbus records and plays MIDI, provides MIDI tracks, piano-roll and step entry, MIDI region/note/controller editing, filters and arpeggiators, bank/patch handling, multitimbral instruments, virtual instruments, and routing to external MIDI devices. It supports MIDI Learn, controller binding maps, MMC/MTC, LTC, and external synchronization [C-017, C-038; S-002, S-005, S-020, S-022].

**DOCUMENTED.** Version 12 adds chord drawing/editing, in-pane quantization, multiple-region piano-roll display/editing, note-color modes, stacked MIDI automation lanes, and chase updates [C-017; S-005].

**DOCUMENTED / UNKNOWN.** No staff-notation editor is documented in the v12 manual taxonomy; this is evidence that notation was not found, not proof that no hidden or future notation facility exists [C-018; S-006]. MPE, per-note expression, MIDI 2.0, SysEx round-trip fidelity, multiple plugin event buses, and sample-accurate MIDI scheduling remain unknown [C-019].

## 8. Routing, mixer, automation, and control

**DOCUMENTED.** Mixbus exposes twelve stereo mix buses, a stereo master, monitor and foldback sections, VCAs, track/bus groups, redirects (plugins, sends, and inserts), utility “DAW-style” buses, and direct audio connection management. Mix buses 1–8 may feed buses 9–12, while v12 prevents mix buses from creating aux sends that could form a Mixbus→Aux→Mixbus feedback loop [C-014; S-005, S-017].

**DOCUMENTED.** Plugin sidechains use the pin-management dialog: an audio track or input can feed a sidechain-capable plugin, and some plugins require manual pin wiring. Harrison removed the older channel-strip sidechain facility in v6 in favor of plugin sidechain buses [C-029; S-016].

**DOCUMENTED.** Automation covers fader, pan, plugin parameters, region gain, and immersive controls, with read/write/touch/latch-style modes documented in the automation surface. Plugin controls can be mapped, and control is available through MIDI Learn, binding maps, Mackie Control/MCU, FaderPort integrations, and OSC [C-031, C-038; S-013, S-014, S-022].

**UNKNOWN.** Automation sample accuracy, stable cross-version parameter identity for every plugin, feedback behavior outside documented prohibited routes, and complete surround layouts outside Pro's documented immersive workflow remain unknown [C-032, C-039].

## 9. Recording, comping, and media handling

**DOCUMENTED.** The dedicated Record page, input monitoring, punch and pre-roll recording, loop/take workflows, playlists, and audio/MIDI clip recording are represented in the current manual. Playlists are the primary take/comp management mechanism [C-016; S-006, S-025].

**DOCUMENTED.** Documented media includes BWF, WAV, WAV64, AIFF, CAF, MP3, and additional formats supported by the import/export system. Session archives can include externally referenced media; copied audio can be FLAC-compressed, and an optional space-saving mode converts audio to 16-bit with acknowledged loss [C-016, C-034; S-002, S-018, S-019].

**DOCUMENTED.** Video playback, import, synchronization, and export are present. Metadata and source/region management are exposed in the session and editor surfaces [C-013, C-016; S-002, S-006, S-019].

**UNKNOWN.** Proxy/conform architecture, complete codec support, automatic missing-media relinking strategy, embedded metadata fidelity, and every punch/monitor corner case were not independently qualified [C-047].

## 10. Instruments, effects, content, and native devices

**DOCUMENTED.** Both tiers include Harrison channel-strip processing and bundled plugins. The current package documents ACE/x42-derived utilities and instruments, MIDI filters/arpeggiators, drum kits, synths, loop content, and the Harrison XT suite; some x42 products require a separate license [C-044; S-004, S-006]. Pro adds switchable SSL 9000J channel EQ/dynamics [C-002; S-001].

**DOCUMENTED.** Processor chains are ordered in a channel's processor box, can be placed pre/post fader, saved in track templates, and manipulated through redirects and pin routing [C-027, C-031; S-005, S-012, S-013].

**UNKNOWN.** There is no public third-party “Mixbus-native” device SDK for Harrison's proprietary console DSP. Modulation-rack semantics, a public proprietary-DSP ABI, and the internals of Harrison/SSL models are not disclosed [C-010, C-043].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` means no in-scope platform edition or a format-specific platform mismatch. `UNKNOWN` means no sufficiently precise current evidence was found; absence from one manual is not proof of rejection [C-022]. The system-requirements page uses “VST” alongside “VST3”; retained scanner/manual evidence resolves that legacy label as VST2 for this dossier [C-020, C-025].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **DOCUMENTED:** supported | **DOCUMENTED:** supported | **DOCUMENTED:** supported | **NOT_APPLICABLE:** no in-scope edition | v12 system page; Pro includes all Base features | Separate VST2 scanner; legacy format/licensing caveat | C-020, C-025, C-043; S-001, S-003, S-010 |
| VST3 | **DOCUMENTED:** supported | **DOCUMENTED:** supported | **DOCUMENTED:** supported | **NOT_APPLICABLE:** no in-scope edition | v12 system page; both tiers | Separate VST3 scanner; format name alone does not prove full conformance | C-020, C-025, C-032; S-001, S-003, S-010 |
| AUv2 | **DOCUMENTED:** supported | **NOT_APPLICABLE:** Apple format | **NOT_APPLICABLE:** Apple format | **NOT_APPLICABLE:** no in-scope edition | v12 system page/source; both tiers | Source explicitly labels `ardour-au-scanner` as AUv2 scanner | C-020, C-025; S-003, S-010 |
| AUv3 | **UNKNOWN:** Audio Unit wording does not establish AUv3 | **NOT_APPLICABLE:** Apple format | **NOT_APPLICABLE:** Apple format | **NOT_APPLICABLE:** no in-scope edition | No exact v12 evidence | Do not infer AUv3 from generic “AudioUnit” | C-022; S-003 |
| AAX | **DOCUMENTED:** unsupported | **DOCUMENTED:** unsupported | **DOCUMENTED:** unsupported | **NOT_APPLICABLE:** no in-scope edition | Current retained vendor compatibility guidance | AAX/RTAS/TDM are not hosted; no Avid certification follows | C-021, C-043; S-011 |
| CLAP | **UNKNOWN:** no current host claim | **UNKNOWN:** no current host claim | **UNKNOWN:** no current host claim | **NOT_APPLICABLE:** no in-scope edition | No v12 evidence | License page mentions CLAP only as an example API, not a Mixbus capability | C-022; S-007 |
| LV2 | **DOCUMENTED:** supported | **DOCUMENTED:** supported | **DOCUMENTED:** supported | **NOT_APPLICABLE:** no in-scope edition | v12 system page; both tiers | Bundled LV2 instruments and third-party hosting documented | C-020, C-028; S-003, S-015 |
| LADSPA | **UNKNOWN:** conflicting/insufficient current evidence | **UNKNOWN:** conflicting/insufficient current evidence | **UNKNOWN:** current vendor pages conflict | **NOT_APPLICABLE:** no in-scope edition | v12 scanner/manual evidence conflicts with current system matrix | Preserve contradiction; do not promote legacy references to current support | C-023; S-003, S-011 |
| DSSI | **UNKNOWN:** no current host claim | **UNKNOWN:** no current host claim | **UNKNOWN:** no current host claim | **NOT_APPLICABLE:** no in-scope edition | No v12 evidence | Absence is not a rejection test | C-022; S-003, S-011 |
| JSFX | **UNKNOWN:** no current host claim | **UNKNOWN:** no current host claim | **UNKNOWN:** no current host claim | **NOT_APPLICABLE:** no in-scope edition | No v12 evidence | No REAPER/JSFX host boundary established | C-022; S-003, S-011 |
| DirectX/DXi | **NOT_APPLICABLE:** Windows-specific format | **DOCUMENTED:** unsupported | **NOT_APPLICABLE:** Windows-specific format | **NOT_APPLICABLE:** no in-scope edition | Current retained vendor compatibility guidance | No DirectX/DXi hosting | C-021; S-011 |
| Rack Extension | **UNKNOWN:** no current host claim | **UNKNOWN:** no current host claim | **UNKNOWN:** no current host claim | **NOT_APPLICABLE:** no in-scope edition | No v12 evidence | No Reason Rack Extension boundary established | C-022; S-003, S-011 |
| Product-native/other | **DOCUMENTED:** proprietary channel DSP and bundled processors | **DOCUMENTED:** same family | **DOCUMENTED:** same family | **NOT_APPLICABLE:** no in-scope edition | v12 Base/Pro | No public third-party native DSP SDK; Pro adds SSL/immersive processing | C-002, C-010, C-044; S-001, S-004, S-007 |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED.** Mixbus scans plugins, stores caches, supports rescans, provides timeout and skip behavior for slow/problematic plugins, and exposes plugin status, logs, and ignore/blacklist-style controls. The manager can hide a duplicate VST2 when a corresponding VST3 is present and reports architecture mismatch or unavailable plugins [C-024, C-027; S-011, S-012].

**DOCUMENTED.** The `mixbus+12.0` source contains separately built `ardour-vst2-scanner`, `ardour-vst3-scanner`, and `ardour-au-scanner` executables and plugin-manager lookup/error paths for those binaries [C-025; S-010].

**UNKNOWN.** Cache schemas, duplicate identity across every format, cryptographic validation, quarantine durability, scanner privilege restriction, and recovery after every hang/crash case are not specified [C-026, C-032]. A separate scanner is not proof of a security sandbox.

### 11.3 Runtime isolation and compatibility

**DOCUMENTED.** Scan-time executable separation exists for VST2, VST3, and AUv2 [C-025]. The manager detects some architecture mismatches and exposes compatibility/failure status [C-027; S-011, S-012].

**UNKNOWN.** Plugin instances' runtime process location, per-plugin/shared sandboxing, crash and hang containment, architecture bridging/translation, code-signing or notarization enforcement, privilege boundaries, and recovery after runtime failure are not established [C-026]. No claim of runtime sandboxing follows from scan-time helpers.

### 11.4 Host/plugin processing contract

**DOCUMENTED.** Mixbus supports effects and instruments, ordered processor placement, configurable audio pins, plugin sidechain inputs, and multichannel instruments. “Fan Out” creates receiving mixer tracks, normally from stereo output pairs; it can be disabled for manual routing. AU instruments may expose variable output counts, while VST and bundled LV2 instruments predefine output capacity [C-028, C-029, C-031; S-015, S-016].

**DOCUMENTED contradiction.** The multichannel page says Mixbus provides “2” multichannel drum instruments but immediately names three. This dossier preserves the inconsistency and makes no inventory-count claim [C-028; S-015].

**UNKNOWN.** Sample-accurate sidechain/event delivery, dynamic-I/O completeness, all multi-bus layouts, MIDI output, MPE/MIDI 2.0, latency/tail-reporting fidelity, bypass/suspend semantics, per-format offline calls, and deterministic rendering remain unknown [C-019, C-032]. Format support and successful scanning do not prove this full contract.

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED.** Mixbus exposes plugin parameters through generic controls and vendor editors, supports plugin automation modes and mapped controls, stores presets, offers latency controls, and exposes pin routing. Parameter values and state are persisted in the session model [C-030, C-031, C-033; S-013, S-014, S-023].

**DOCUMENTED.** When a processor cannot be restored/configured, the published route-loading code creates an `UnknownProcessor`; its source documentation says its principal purpose is to preserve state for later restoration. This is strong evidence for missing-plugin placeholders in the Ardour-derived snapshot [C-033; S-023].

**UNKNOWN.** Cross-version parameter identity, text/range normalization, sample-accurate automation, proprietary plugin state chunks, external asset references, cross-format substitution, and exact 12.0.1 placeholder behavior were not dynamically tested [C-009, C-032].

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED.** Mixbus offers vendor-supplied plugin editors and generic controls, plugin favorites/tags, status and scan logs, timeout/skip controls, architecture-mismatch feedback, duplicate-format concealment, presets, and plugin DSP/performance meters [C-024, C-027, C-030; S-011–S-014].

**UNKNOWN.** Complete HiDPI behavior for every vendor editor, keyboard/focus propagation, plugin-editor accessibility, headless operation, crash-window recovery, and whether a runtime plugin failure can terminate or corrupt the host remain unknown [C-026, C-041].

## 12. Extensibility and integration

**DOCUMENTED.** Mixbus exposes Lua Actions, session-event scripts, and Lua DSP scripts. The public snapshot includes Lua bindings to Ardour-derived objects, including processors and `UnknownProcessor` [C-037; S-021, S-023]. MIDI Learn, editable binding maps, MCU/Mackie Control, FaderPort support, and OSC provide control/remote boundaries [C-038; S-022].

**DOCUMENTED.** Third-party audio plugins are the principal public processing-extension boundary; external MIDI devices and video/timecode systems are integration boundaries [C-017, C-020, C-038; S-020, S-022].

**UNKNOWN.** Lua ABI/API stability across Mixbus releases, script permission/sandbox policy, a supported binary extension SDK, controller-script compatibility guarantees, OSC versioning, and proprietary DSP authoring interfaces are not established [C-010, C-041].

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED.** Sessions use `.ardour` state files; the published source defines `.ardour-session-archive` and template-archive suffixes. Save As, snapshots, templates, backups, and archives are documented user workflows [C-034; S-018, S-023].

**DOCUMENTED.** Session Archive can gather externally referenced media, FLAC-compress copied audio, and optionally reduce audio to 16-bit. The archive represents the selected/current snapshot, not every historical snapshot, so it must not be described as a complete version-history bundle [C-034, C-035; S-018].

**DOCUMENTED.** Missing/unconfigurable processor state is retained through `UnknownProcessor` in the public Ardour-derived snapshot [C-033; S-023]. Audio/MIDI import and master/stem/range/region export provide rendered interchange [C-013, C-016; S-019].

**UNKNOWN.** No current official guarantee was located for general or lossless Ardour→Mixbus, Mixbus→Ardour, or round-trip project compatibility. Shared suffixes and persistence machinery are necessary evidence of lineage, not sufficient evidence of exchange compatibility [C-036]. Forward/backward compatibility limits, DAWproject, AAF/OMF, MusicXML, cloud co-editing, merge/version-control semantics, and plugin equivalence across products also remain unknown [C-047].

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED.** Export supports master, stem, range, and region outputs; simultaneous/multiple formats and jobs; real-time and faster-than-real-time rendering; and post-export command handling. Bounce and Consolidate provide additional render-in-place boundaries [C-013; S-019].

**DOCUMENTED.** The product supports video playback/export, LTC/MTC synchronization, loudness analysis/normalization, mixer scenes, cue/clip triggering, foldback mixes, and live recording workflows [C-007, C-013, C-038; S-002, S-005, S-006, S-019].

**DOCUMENTED.** Mixbus Pro includes immersive panners, 7.1.4/binaural monitoring workflow, and direct Dolby `.adm` export [C-039; S-001, S-024]. Base-tier Atmos authoring must not be inferred.

**UNKNOWN.** DDP, ADR workflow depth, show-control protocols, ADM conformance/certification details, and deterministic third-party-plugin behavior during offline export were not established [C-032, C-047].

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED.** Harrison recommends at least two CPU cores and 2 GB RAM, documents 64-bit builds and multicore DSP, supports native Apple Silicon plus Intel macOS, and provides plugin/performance meters. The UI documents scaling and HiDPI/Retina support [C-003, C-011, C-040; S-002, S-003, S-012].

**DOCUMENTED.** Scan timeout/skip behavior, logs/status, caches, missing-plugin placeholders, and PDC limits provide some diagnosability and graceful-degradation mechanisms [C-012, C-024, C-027, C-033]. These are not independent reliability benchmarks.

**UNKNOWN.** Runtime plugin containment, resource ceilings, recovery after engine/plugin crashes, update rollback, installer/package signing and notarization policy, plugin trust prompts, telemetry/privacy behavior, vulnerability-response policy, accessibility conformance, screen-reader support, full keyboard operation, localization coverage, and tested maximum session scale remain unknown [C-026, C-041]. The opt-in anonymous Harrison News statement is too narrow to establish overall telemetry/privacy behavior [C-041; S-005].

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED.** Harrison says Mixbus combines proprietary Harrison components with modified Ardour source. Ardour-derived modifications are published under GPL-2.0-or-later; Harrison DSP modules, graphics, and logos remain protected proprietary material and may not be redistributed without permission [C-008, C-042; S-007]. The current product page also presents an SSL EULA and third-party/open-source notices [S-001].

**DOCUMENTED.** The plugin clarification embedded in Harrison's license page states the Ardour developers' view that plugins loaded through third-party APIs such as VST, Audio Units, LV2, LADSPA, and CLAP are not thereby derivative of the host. This is a published licensing position, not legal advice [C-042; S-007].

**INFERENCE / clean-room constraint.** Mixbus's ability to host a format grants a new DAW no SDK, trademark, redistribution, signing, certification, patent, or compatibility rights. VST2 is discontinued/licensing-sensitive; VST3, Audio Units, AAX, Dolby, SSL, and other marks/SDKs require their own current authorization and terms review [C-043]. Public Ardour-derived mechanisms may inform clean-room requirements, but Harrison proprietary code, DSP, graphics, and protected expression must not be copied [C-010, C-042].

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED / INFERENCE:** The constrained console topology gives users visible, predictable mixing stages while retaining flexible utility buses, redirects, pin routing, and automation [C-014, C-029, C-031].
- **DOCUMENTED:** Plugin handling goes beyond format badges through separate scan helpers, caches, timeouts, status, diagnostics, generic UIs, multichannel fan-out, sidechains, presets, and missing-processor state preservation [C-024–C-033].
- **DOCUMENTED:** Sessions provide snapshots, templates, asset collection, and broad rendered handoff options [C-013, C-034, C-035].
- **DOCUMENTED:** Cue clips coexist with a mature linear editor, and Pro adds a bounded immersive delivery workflow [C-007, C-039].

### Liabilities / risks

- **DOCUMENTED:** PDC guarantees differ materially by path: the mix-bus cap and uncompensated utility buses can affect routing correctness [C-012, C-015].
- **UNKNOWN:** Runtime plugin containment and several deep host-contract properties are not documented [C-026, C-032].
- **UNKNOWN / contradiction:** LADSPA status is inconsistent, and many newer/specialized formats remain unresolved [C-022, C-023].
- **UNKNOWN:** Shared Ardour lineage does not provide a documented session-exchange guarantee [C-036].
- **Clean-room risk:** The most distinctive DSP/graphics are proprietary, so architectural learning must remain at the problem/mechanism level [C-010, C-042, C-043].

The principal lesson is to separate a clear user-facing mixer model from the qualification matrix underneath it: topology-specific latency, plugin role/bus contracts, scanner isolation, runtime containment, persistence, and licensing each need independent evidence [C-012, C-025, C-026, C-032, C-033, C-043].

## 18. Transferable patterns

| Pattern | Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites / tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Console-shaped fixed mix stages plus utility graph | An unconstrained graph is powerful but difficult to understand | Named group/aux stages and master remain visible; advanced sends/inserts/buses are explicit | C-014, C-015 | Must define feedback and PDC rules; fixed capacity can constrain users; do not copy Harrison graphics/DSP | **CANDIDATE** |
| Topology-specific latency contract | A single “PDC supported” flag hides route-dependent limits | Compute and display compensation per route class, with explicit caps/uncompensated nodes | C-012, C-015 | Requires graph analysis, bounded memory, and visible diagnostics | **CANDIDATE** |
| Separate scan helpers with diagnosable cache | Bad plugins can hang discovery and poison startup | Per-format scanner process, timeout/skip, provenance cache, status/log UI | C-024, C-025, C-027 | Scan isolation is not runtime isolation; privilege and cache integrity need separate design | **CANDIDATE** |
| Missing-processor placeholder | Projects should retain unavailable plugin state | Persist original opaque state/identity in a non-processing placeholder and offer later rebind | C-033 | State may be proprietary or unsafe; exact format migration needs qualification | **CANDIDATE** |
| Explicit multichannel fan-out | Multi-output instruments otherwise require repetitive routing | Capability query plus generated receiving tracks/buses, with manual override | C-028 | Stereo-pair conventions fail for mono/custom layouts; dynamic I/O remains complex | **CONDITIONAL** |
| Pin-level sidechain routing | Plugins expose auxiliary inputs inconsistently | Typed audio/event pins with source selector and manual patch override | C-029, C-031 | Requires format adapters, cycle prevention, PDC, and clear channel-layout semantics | **CANDIDATE** |
| Snapshot plus collect/archive distinction | Users confuse a saved state with a portable project | Separate snapshots from an archive that inventories/copies assets and declares loss/conversion | C-034, C-035 | Must state which snapshots/assets are included and avoid silent lossy conversion | **CANDIDATE** |
| Render matrix | Delivery needs masters, stems, regions, ranges, and multiple formats | Reusable export timespans, channel configurations, format profiles, and jobs | C-013 | Deterministic plugin tails/latency and licensing need tests | **CANDIDATE** |
| Hybrid cue and linear arrangement | Live/pattern ideation must become an editable song | Clip slots launch independently or through timeline cue markers | C-007 | Identity/override, recording, latency, and follow-action semantics add complexity | **CONDITIONAL** |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** Copying or reconstructing Harrison/SSL DSP, graphics, logos, or protected manual expression. The vendor expressly reserves those components [C-010, C-042].
- **REJECTED:** Treating `mixbus+12.0` as exact source for the 12.0.1 binaries. No exact ref/build manifest was found [C-009].
- **REJECTED:** Treating a separate scanner executable as proof of runtime sandboxing or crash containment [C-025, C-026].
- **REJECTED:** Treating a format name as proof of complete VST3/AU/LV2 conformance, sample-accurate automation, dynamic I/O, or state fidelity [C-020, C-032].
- **REJECTED:** Inferring AUv3 from “AudioUnit,” or CLAP/DSSI/JSFX/Rack Extension support from absence or Ardour lineage [C-022].
- **REJECTED:** Resolving the LADSPA contradiction by choosing the broader legacy/scanner wording over the current system matrix [C-023].
- **REJECTED:** Inferring Ardour↔Mixbus compatibility from `.ardour` suffixes or shared persistence code [C-036].
- **REJECTED:** Silently correcting the multichannel-instrument page's “2” versus three-name contradiction [C-028].
- **CURIOSITY_NO_GO:** Proprietary DSP internals — potentially novel but inaccessible within the clean-room boundary; reopen only for a Harrison-authored technical disclosure [C-010].
- **CURIOSITY_NO_GO:** More documentary runtime-sandbox searching — high relevance but repeated low yield; reopen for a public engineering statement or authorized fixture campaign [C-026].
- **CURIOSITY_NO_GO:** Full VST3 conformance inference from public source — format-wide behavior needs controlled conformance fixtures, not source-name extrapolation [C-032].
- **CURIOSITY_NO_GO:** Additional Ardour interchange searching — targeted official searches found no current guarantee; reopen for a versioned vendor matrix or dynamic round-trip study [C-036].
- **CURIOSITY_NO_GO:** Exhaustive built-in plugin inventory — low architecture novelty after native/bundled/license boundaries were established [C-044].

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / check | Documentary result | Status / later discriminating probe |
| --- | --- | --- |
| H1: Mixbus is simply a proprietary skin over an unmodified Ardour | Harrison says proprietary components are aggregated with **modified** Ardour source and publishes a Mixbus tag | **REFUTED** [C-008, C-009; S-007, S-008] |
| H2: The public `mixbus+12.0` tag exactly represents 12.0.1 | Product binaries are 12.0.1; no exact 12.0.1 source ref/build mapping was found | **UNKNOWN / do not infer** [C-001, C-009] |
| H3: “PDC supported” applies equally to all routes | Mix-bus cap, track buffering, and uncompensated utility buses differ | **REFUTED** [C-012, C-015; S-017] |
| H4: Plugin scanners prove out-of-process runtime hosting | Evidence covers scanning only | **REFUTED as a blanket inference** [C-025, C-026] |
| H5: Current Linux hosting definitely includes LADSPA | Current vendor pages conflict/omit it differently | **UNRESOLVED** [C-023] |
| H6: AU support proves AUv3 | AUv2 scanner is explicit; no AUv3 claim was found | **REFUTED as an inference** [C-022, C-025] |
| H7: Multi-output and sidechain support establish a complete host contract | Visible routing exists, but timing, dynamic I/O, latency/tails, and expression remain unqualified | **REFUTED** [C-028, C-029, C-032] |
| H8: Shared `.ardour` files guarantee round-trip interchange | No current official compatibility guarantee was located | **REFUTED as a guarantee / runtime unknown** [C-036] |
| H9: A session archive contains every snapshot/history state | Manual bounds archive creation to the selected/current snapshot | **REFUTED** [C-035; S-018] |
| H10: Missing plugins necessarily destroy saved state | Public source creates `UnknownProcessor` placeholders to preserve state | **REFUTED for the public snapshot** [C-033; S-023] |

**Accepted → scanned → instantiated → full contract check:**

1. **Format accepted:** documented for VST2/VST3/LV2 on all desktop OSes and AUv2 on macOS [C-020].
2. **Discovered/scanned:** documented scanner/cache/rescan/timeout behavior and separate VST2/VST3/AUv2 helpers [C-024, C-025].
3. **Instantiated/routed:** documented processors, instruments/effects, pins, sidechains, and multichannel fan-out [C-027–C-031].
4. **Full contract:** not established; runtime isolation, timing, expression, dynamic I/O, latency/tails, complete state migration, and conformance remain unknown [C-019, C-026, C-032].

No Mixbus or third-party binary was executed, so there are no `OBSERVED` claims.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current official downloads are Mixbus 12.0.1 for Apple Silicon/Intel macOS, Windows x64, and Linux x86-64 | Cutoff release | S-001 | Direct download filenames | No installer execution |
| C-002 | DOCUMENTED | High | Tiers are Mixbus 12 and Pro; Pro adds SSL 9000J EQ/dynamics and Dolby Atmos tools | Current editions | S-001, S-004 | Direct tier table; Pro says all Mixbus features | Exact proprietary implementation unknown |
| C-003 | DOCUMENTED | High | Mixbus supports 64-bit macOS, Windows, and Linux with stated vendor minima | Current platforms | S-003 | Direct system requirements | Not independent qualification |
| C-004 | DOCUMENTED | High | Mixbus is a full DAW positioned around analog-console-inspired recording-to-delivery workflow | Product identity | S-001, S-004 | Direct product/manual language | Marketing does not prove sound quality |
| C-005 | DOCUMENTED | High | Dedicated Cue, Record, Edit, and Mix pages structure the workflow | User model | S-001, S-006 | Product and manual taxonomy | Internal architecture does not follow |
| C-006 | DOCUMENTED | High | Audio/MIDI/instrument tracks, regions/ranges, playlists, non-destructive editing, persistent undo, groups, tempo/stretch, snapshots, and templates are documented | Editing/session workflow | S-002, S-006, S-025 | Direct feature/manual sections | Algorithm quality not measured |
| C-007 | DOCUMENTED | High | v12 has sixteen cue rows and records audio/MIDI clips into cue slots integrated with timeline triggering | Cue workflow | S-001, S-005, S-006 | Direct v12 changes | Performance limits not measured |
| C-008 | DOCUMENTED | High | Mixbus aggregates proprietary Harrison components and modified Ardour source | Provenance | S-007, S-008 | Direct GPL-compliance statement and repo | Does not enumerate every binary component |
| C-009 | DOCUMENTED / UNKNOWN | High | Public tag `mixbus+12.0` resolves to `ba552…`; exact 12.0.1 source correspondence was not found | Public source | S-001, S-008 | Tag dereference versus download filenames | Later/private build ref may exist |
| C-010 | UNKNOWN | High | Harrison/SSL DSP internals, complete binary composition, and proprietary process/thread behavior are not public | Proprietary boundary | S-007, S-008 | Reserved components plus source boundary | Must not be reverse engineered here |
| C-011 | DOCUMENTED | Medium-high | Multicore DSP, resource-bounded track scale, preallocated strip DSP, PDC, and performance meters are documented | Engine/performance | S-002, S-012 | Direct vendor features | No independent benchmarks |
| C-012 | DOCUMENTED | High | PDC recalculates on stop; mix-bus path has an 8,192-sample cap; tracks can disk-buffer longer latency | PDC | S-017 | Direct latency/routing guidance | Exact corner cases untested |
| C-013 | DOCUMENTED | High | Bounce/Consolidate/Export and real-time/faster-than-real-time master, stem, range, region, multi-format jobs are documented | Rendering/delivery | S-019 | Direct export sections | Determinism/tails unknown |
| C-014 | DOCUMENTED | High | Mixer has twelve stereo mix buses, 1–8 feeding 9–12, stereo master, utility buses, redirects, VCAs, monitor/foldback | Routing | S-002, S-005, S-017 | Direct mixer/routing docs | Some feedback permutations untested |
| C-015 | DOCUMENTED | High | Utility buses are not latency compensated | Utility routing | S-017 | Direct warning | Future behavior may change |
| C-016 | DOCUMENTED | High | Recording/playlists, punch/pre-roll, broad media formats, video, and archive media collection are documented | Recording/media | S-002, S-018, S-019, S-025 | Direct manual sections | Complete codec/metadata fidelity unknown |
| C-017 | DOCUMENTED | High | MIDI recording/editing, instruments, clips, controllers, external MIDI, sync, chord/quantize and multi-region piano roll are documented | MIDI | S-002, S-005, S-020, S-022 | Direct current manual | Deep event timing unknown |
| C-018 | DOCUMENTED / UNKNOWN | Medium-high | No staff-notation editor was located in the v12 manual taxonomy | Notation boundary | S-006 | Bounded negative result | Absence is not proof of impossibility |
| C-019 | UNKNOWN | High | MPE, per-note expression, MIDI 2.0, SysEx fidelity, multi-event buses, and sample-accurate MIDI remain unresolved | MIDI/plugin events | S-006, S-020 | Targeted manual review did not establish them | Requires fixtures/specification |
| C-020 | DOCUMENTED | High | macOS supports AUv2, VST2, VST3, LV2; Windows/Linux support VST2, VST3, LV2 | Plugin formats | S-003, S-010 | System matrix plus named scanners | Format support is not full conformance |
| C-021 | DOCUMENTED | Medium-high | AAX/RTAS/TDM and DirectX/DXi hosting are unsupported | Plugin exclusions | S-011 | Retained official plugin guidance | No rejection probe |
| C-022 | UNKNOWN | High | AUv3, CLAP, DSSI, JSFX, and Rack Extension hosting are not established | Required matrix | S-003, S-006, S-011 | Current sources inspected | Absence not proof of rejection |
| C-023 | UNKNOWN | High | Current LADSPA support is contradictory/insufficient across vendor documentation | Plugin matrix | S-003, S-011 | Sources disagree/omit differently | Needs authoritative matrix or runtime test |
| C-024 | DOCUMENTED | High | Scanning includes cache/rescan, timeout/skip, ignore/status/log behavior, and failure controls | Plugin discovery | S-011, S-012 | Direct scanning/manager docs | Security properties unknown |
| C-025 | DOCUMENTED | High | Separate VST2, VST3, and AUv2 scanner executables exist in public `mixbus+12.0` source | Scan process | S-010 | Named programs and plugin-manager lookup | Scan-time only; not 12.0.1 mapping |
| C-026 | UNKNOWN | High | Runtime plugin isolation, crash containment, bridging, signing, and privilege boundaries are unknown | Plugin runtime | S-010, S-011 | No runtime-process guarantee | Requires authorized probes |
| C-027 | DOCUMENTED | High | Plugin manager exposes architecture mismatch, status/diagnostics, caches, duplicate VST2 concealment, and management UI | Plugin UX | S-011, S-012 | Direct manual | Exact identity rules not specified |
| C-028 | DOCUMENTED | High | Multichannel instrument fan-out creates receiving tracks; AU output count may vary while VST/bundled LV2 counts are predefined | Instrument buses | S-015 | Direct manual | Page says “2” but names three drum instruments |
| C-029 | DOCUMENTED | High | Sidechain-capable plugins receive tracks/inputs through pin management, sometimes requiring manual wiring | Sidechains | S-016 | Direct manual procedure | Timing/sample accuracy unknown |
| C-030 | DOCUMENTED | High | Generic and vendor plugin UIs, favorites/tags, status, and DSP meters are documented | Plugin UI | S-012, S-013 | Direct manual | Accessibility/headless behavior unknown |
| C-031 | DOCUMENTED | High | Plugin automation modes, latency controls, pin routing, presets, and mapped controls are exposed | Host controls | S-013, S-014, S-016 | Direct UI/manual sections | Sample accuracy/identity unknown |
| C-032 | UNKNOWN | High | Full bus/event, dynamic I/O, expression, sample-accurate automation, latency/tail, bypass/suspend, offline-call, and conformance contract is unqualified | Deep host contract | S-011–S-016, S-019 | Relevant docs inspected | Requires capability fixtures |
| C-033 | DOCUMENTED | High for snapshot | Public source preserves unavailable/unconfigurable processors as `UnknownProcessor` with retained state | Missing plugins | S-023 | Source comments and route loading | Exact 12.0.1 binary behavior unobserved |
| C-034 | DOCUMENTED | High | Sessions use `.ardour`; Save As, snapshots, templates, backup/archive, external media collection and FLAC/optional 16-bit conversion are documented | Persistence | S-018, S-023 | Manual plus filename constants | Default external references vary |
| C-035 | DOCUMENTED | High | Session archive contains the selected/current snapshot, not all snapshots/history | Archive limit | S-018 | Direct manual warning | User can archive snapshots separately |
| C-036 | UNKNOWN | High | General/lossless Ardour↔Mixbus and round-trip compatibility are not guaranteed in current official evidence | Interchange | S-007, S-008, S-018, S-023 | Targeted official search negative | Shared lineage/suffix is insufficient |
| C-037 | DOCUMENTED | High | Lua Actions, session-event scripts, Lua DSP, and public Ardour-derived bindings exist | Scripting | S-021, S-023 | Direct manual/source | ABI stability and permissions unknown |
| C-038 | DOCUMENTED | High | MIDI Learn, binding maps, MCU/Mackie, FaderPort, OSC, MMC/MTC/LTC are control/sync boundaries | External control | S-002, S-020, S-022 | Direct manual | Versioning guarantees unknown |
| C-039 | DOCUMENTED | High | Pro adds immersive panning/monitoring and Dolby ADM export | Pro delivery | S-001, S-024 | Direct tier/product/manual | Certification/conformance not independently tested |
| C-040 | DOCUMENTED | High | Current hardware/OS minima, 64-bit/native Apple Silicon, multicore, UI scaling and HiDPI are documented | Platform/performance | S-002, S-003 | Direct requirements/features | Not independent accessibility proof |
| C-041 | UNKNOWN | High | Accessibility conformance, telemetry/privacy, signing/notarization, rollback, runtime security, localization depth, and scripting ABI are unresolved | NFR/operations | S-001, S-005, S-011, S-021 | Targeted docs insufficient | News opt-in statement is narrow |
| C-042 | DOCUMENTED | High | Ardour-derived modifications are GPL-2.0-or-later; Harrison DSP/graphics/logos remain proprietary | Licensing | S-007 | Direct license page | Not legal advice |
| C-043 | INFERENCE | High | Hosting or published source grants no third-party SDK/trademark/redistribution/certification rights | Clean-room/legal | S-001, S-007 | Capability/license boundary | Current owner terms require separate review |
| C-044 | DOCUMENTED | High | Both tiers include bundled/XT plugins and loop content; some x42 products need separate licenses | Native ecosystem | S-004, S-006 | Direct included-content page | Inventory may change |
| C-045 | DOCUMENTED | High | Saveable processor/track templates and plugin chains are current workflow features | Reuse | S-005, S-018 | Direct v12/manual docs | Cross-version portability unknown |
| C-047 | UNKNOWN | High | Full migration, collaboration, interchange-format, media-relink, update, and specialized-delivery boundaries remain incomplete | Durability/ecosystem | S-006, S-018, S-019 | Targeted docs did not establish them | Requires vendor matrix or fixtures |
| C-048 | DOCUMENTED | High | Web discovery was rate-limited; one guessed product URL returned 404 before canonical product URL discovery | Negative research results | Research log, S-001 | Recorded tool results | Supplied no product-behavior evidence |

## 22. Source ledger and adaptive bibliography

All web sources were accessed 2026-08-29. Harrison statements document Harrison's claims/instructions, not independent runtime performance. Manual prose is paraphrased rather than reproduced. Source code was inspected only in the public repository at the named immutable commit.

### S-001 — Mixbus 12 product page and downloads

- **Publisher / kind:** Harrison Audio; official current product, tier, EULA, and download page.
- **URL:** https://harrisonaudio.com/products/mixbus-12
- **Scope:** Current Mixbus 12 family at cutoff; download filenames identify 12.0.1.
- **Relevant sections:** Overview, Features, Tiers, Downloads, embedded EULA.
- **Claims:** C-001–C-004, C-007, C-009, C-039, C-041, C-043.
- **Limitations:** Product/marketing source; no installer was downloaded or run; prices are volatile; does not map binaries to public source.
- **Selection rationale:** Canonical current-release and edition anchor, preferable to reseller or search snippets.

### S-002 — Features, Specifications and FAQ

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/features-specifications
- **Scope:** Mixbus 12 general mixer/editor/engine features.
- **Relevant sections:** Mixer Features, Editor Features, General.
- **Claims:** C-004, C-006, C-011, C-013, C-014, C-016, C-017, C-038, C-040.
- **Limitations:** Broad feature statements do not establish every edge case or independent quality.
- **Selection rationale:** Direct versioned feature inventory, preferable to promotional summaries.

### S-003 — System Requirements

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/system-requirements
- **Scope:** Current macOS/Windows/Linux requirements and format matrix.
- **Relevant sections:** Apple macOS, Microsoft Windows, Linux, All platforms.
- **Claims:** C-001, C-003, C-020, C-022, C-023, C-040.
- **Limitations:** Uses legacy “VST” alongside VST3 and omits deep contract/edition detail; vendor minima are not test results.
- **Selection rationale:** Canonical OS/format source, preferable to historical forum matrices.

### S-004 — What’s Included in your Mixbus purchase?

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/what-s-included-in-your-mixbus-purchase
- **Scope:** Mixbus/Mixbus Pro license tiers, bundled plugins/content, update policy.
- **Relevant sections:** Software License, Included Plugins, Bundled Loop Content, Upgrade Policy.
- **Claims:** C-002, C-004, C-044.
- **Limitations:** Does not enumerate every tier difference or activation/rollback term.
- **Selection rationale:** Direct edition/package evidence, preferable to store-card inference alone.

### S-005 — What’s New in Mixbus v12

- **Publisher / kind:** Harrison Audio; official versioned release/change page.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/what-s-new-in-mixbus-v12
- **Scope:** Mixbus 12 workflow/MIDI/cue/routing changes.
- **Relevant sections:** chord/quantize, cue recording/rows, track templates, MIDI regions, improvements and feedback-loop restriction.
- **Claims:** C-005–C-007, C-014, C-017, C-041, C-045.
- **Limitations:** Feature/change list, not a complete architecture specification; Harrison News privacy wording is narrow.
- **Selection rationale:** Direct v12 delta source, preferable to secondary release coverage.

### S-006 — Mixbus 12 live manual index

- **Publisher / kind:** Harrison Audio; official versioned manual table of contents.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/introduction
- **Scope:** User-visible feature taxonomy across workflow, editing, MIDI, routing, plugins, persistence, video, control, and native content.
- **Relevant sections:** Entire versioned table of contents.
- **Claims:** C-005–C-007, C-016–C-019, C-022, C-030, C-044, C-047.
- **Limitations:** Index labels establish surfaces, not implementation semantics; no notation entry is a bounded negative, not proof of absence.
- **Selection rationale:** Primary coverage map used to bound retrieval and avoid indiscriminate searching.

### S-007 — Copyrights, License Terms, and GPL Compliance

- **Publisher / kind:** Harrison Audio; official license/provenance page.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/mixbus-license-terms-and-gpl-compliance
- **Scope:** Mixbus 12 Harrison/Ardour aggregation and licensing boundary.
- **Relevant sections:** proprietary component notice, aggregation statement, Ardour GPL-2.0-or-later notice, Plugin Clarification.
- **Claims:** C-008, C-010, C-022, C-036, C-042, C-043.
- **Limitations:** Publisher's legal position; not legal advice and not a component-level SBOM.
- **Selection rationale:** Authoritative clean-room boundary, preferable to community descriptions of Mixbus/Ardour lineage.

### S-008 — Harrison Mixbus public source, `mixbus+12.0`

- **Publisher / kind:** Harrison/Ardour project; public immutable source repository/tag.
- **URL:** `git://git.ardour.org/harrison/mixbus`
- **Scope:** Annotated tag object `59e9aadb00efd44e987bf65947951f21fa943908`, dereferenced commit `ba552d68b4fcf614f0f0f51aaa2fe9dfa7bcbacb`.
- **Relevant evidence:** `git show-ref --tags -d` and repository module layout.
- **Claims:** C-008–C-010, C-036.
- **Limitations:** No exact 12.0.1 tag/build manifest; proprietary Harrison modules are not disclosed; source was not built or executed.
- **Selection rationale:** Immutable primary source, preferable to mirroring or assuming current Ardour is identical.

### S-009 — Mixbus 12 plugin overview

- **Publisher / kind:** Harrison Audio; official manual index section.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/plugins
- **Scope:** Current plugin/scanning/tag surfaces.
- **Relevant sections:** Plugins, Scanning for Plugins, Plugin Tags.
- **Claims:** C-020–C-024, C-030.
- **Limitations:** Overview names surfaces but is not sufficient alone for process or contract claims.
- **Selection rationale:** Primary map for bounded plugin evidence retrieval.

### S-010 — Scanner source files at `mixbus+12.0`

- **Publisher / kind:** Harrison/Ardour project; immutable public source.
- **URL:** `git://git.ardour.org/harrison/mixbus` at `ba552d68b4fcf614f0f0f51aaa2fe9dfa7bcbacb`.
- **Relevant paths:** `libs/fst/vst2-scanner.cc` lines 164–165; `libs/fst/vst3-scanner.cc` lines 149–150; `libs/auscan/au-scanner.cc` lines 115–116; `libs/ardour/plugin_manager.cc` lines 238–258.
- **Claims:** C-020, C-025, C-026.
- **Limitations:** Proves named scan helpers in the public snapshot, not runtime isolation or 12.0.1 binary inclusion.
- **Selection rationale:** Direct process-boundary evidence, preferable to inferring separation from UI progress dialogs.

### S-011 — Scanning for Plugins

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/scanning-for-plug-ins
- **Scope:** Current discovery, cache, timeout/skip, status, and format troubleshooting.
- **Relevant sections:** scanning controls, caches, ignored plugins, timeouts, architecture/format notes.
- **Claims:** C-020–C-024, C-026, C-027, C-032, C-041.
- **Limitations:** No runtime-sandbox guarantee or complete conformance matrix; LADSPA wording conflicts with S-003.
- **Selection rationale:** Most direct current scanner-behavior source.

### S-012 — Plugin Manager / Plugin Manager Window

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URLs:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/plugin-manager and https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/plugin-manager-window
- **Scope:** Plugin selection/status/favorites/diagnostics and management UI.
- **Relevant sections:** statuses, logs, caches/rescans, duplicate visibility, plugin DSP/performance links.
- **Claims:** C-011, C-024, C-027, C-030.
- **Limitations:** UI documentation does not specify cache schema, cryptographic validation, or runtime containment.
- **Selection rationale:** Primary diagnosability source, preferable to source-code-only UI inference.

### S-013 — Generic Plugin Controls

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/generic-plugin-controls
- **Scope:** Generic/vendor UI, presets, latency and pin/control surfaces.
- **Relevant sections:** generic controls, editor selection, presets, latency/pin controls.
- **Claims:** C-030–C-032.
- **Limitations:** Does not establish every format's parameter identity or UI scaling behavior.
- **Selection rationale:** Direct host/UI-contract evidence, preferable to screenshots or format logos.

### S-014 — Fader, Pan, and Plugin Automation

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/plugin-automation
- **Scope:** Current automation modes and plugin-control workflow.
- **Relevant sections:** automation states/modes and parameter lanes.
- **Claims:** C-031, C-032.
- **Limitations:** Resolution/sample accuracy and cross-version identity are not specified.
- **Selection rationale:** Direct automation source, preferable to assuming automation depth from “automatable.”

### S-015 — Multichannel Instruments

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/multichannel-instruments
- **Scope:** AU/VST/LV2 output behavior, Fan Out, manual routing, printing instrument outputs.
- **Relevant sections:** format differences, Fan Out, setup, other operations, printing.
- **Claims:** C-028, C-032.
- **Limitations:** Internally says “2” instruments but names three; stereo-pair convention does not cover every plugin; no timing/conformance proof.
- **Selection rationale:** Decision-critical primary source for multiple audio buses.

### S-016 — Sidechain Compression

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/sidechain-compression
- **Scope:** Third-party plugin sidechain routing and pin management.
- **Relevant sections:** third-party plugins/pin manager, sidechain source selection, manual green-pin case, v6 channel-strip removal note.
- **Claims:** C-029, C-031, C-032.
- **Limitations:** No sample-accuracy, latency, or format-wide guarantee.
- **Selection rationale:** Direct current sidechain source, preferable to a tutorial video or native-compressor inference.

### S-017 — “DAW Style” Mixing Buses / routing and latency guidance

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/daw-style-bus-routing
- **Scope:** Utility buses, dedicated mix buses, routing, feedback and compensation boundaries.
- **Relevant sections:** bus topology, PDC recalculation/caps, disk-buffered track latency, utility-bus warning.
- **Claims:** C-012, C-014, C-015.
- **Limitations:** Documentary guarantees were not dynamically measured; future versions may differ.
- **Selection rationale:** Primary source that prevents flattening route-specific PDC into a feature badge.

### S-018 — Session Archive and session file management

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URLs:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/session-archive and https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/session-file-management
- **Scope:** Save As/snapshots/templates/archive, external media, compression/conversion.
- **Relevant sections:** archive contents/options and selected-snapshot limitation.
- **Claims:** C-016, C-034–C-036, C-045, C-047.
- **Limitations:** Does not guarantee Ardour interchange, every plugin asset, or complete history.
- **Selection rationale:** Canonical portability source, preferable to inferring self-containment from directory layout.

### S-019 — Exporting Files

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/exporting-files
- **Scope:** Master/stem/range/region, real-time/offline, multi-format jobs, video/post-export.
- **Relevant sections:** export timespans, channel configurations, formats, jobs, real-time and faster-than-real-time options.
- **Claims:** C-013, C-016, C-032, C-047.
- **Limitations:** Does not specify deterministic plugin tails/latency or every codec.
- **Selection rationale:** Direct delivery/render boundary.

### S-020 — Using MIDI / Virtual Instruments / external MIDI

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual set.
- **URLs:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/using-midi ; https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/virtual-instruments ; https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/setting-up-an-external-midi-device
- **Scope:** MIDI recording/editing/instruments and external routing.
- **Relevant sections:** MIDI tracks, piano roll, instruments, external devices, multitimbral workflow.
- **Claims:** C-017, C-019, C-038.
- **Limitations:** No MPE/MIDI 2.0/SysEx fidelity or sample-accuracy specification found.
- **Selection rationale:** Direct MIDI workflow sources, preferable to assuming capabilities from generic MIDI support.

### S-021 — Scripting

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/scripting
- **Scope:** Lua Actions, session scripts, and Lua DSP.
- **Relevant sections:** action scripts, session callbacks, DSP scripts.
- **Claims:** C-037, C-041.
- **Limitations:** API/ABI stability, security permissions, and migration guarantees are not stated.
- **Selection rationale:** Canonical public scripting boundary.

### S-022 — External Control

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URL:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/external-control
- **Scope:** MIDI surfaces, MCU/Mackie, FaderPort, external transport, OSC-linked control surface taxonomy.
- **Relevant sections:** MIDI Control Surfaces, Mackie MCU, FaderPort, transport/control preferences.
- **Claims:** C-017, C-038.
- **Limitations:** Public protocol/versioning stability and every device mapping are not established.
- **Selection rationale:** Direct control integration source.

### S-023 — Persistence and `UnknownProcessor` source at `mixbus+12.0`

- **Publisher / kind:** Harrison/Ardour project; immutable public source.
- **URL:** `git://git.ardour.org/harrison/mixbus` at `ba552d68b4fcf614f0f0f51aaa2fe9dfa7bcbacb`.
- **Relevant paths:** `libs/ardour/ardour/unknown_processor.h` lines 31–44; `libs/ardour/unknown_processor.cc`; `libs/ardour/route.cc` lines 1867 and 4798–4850; `libs/ardour/filename_extensions.cc` lines 29–38; `libs/ardour/luabindings.cc` lines 1928 and 2284.
- **Claims:** C-033, C-034, C-036, C-037.
- **Limitations:** Public 12.0 snapshot only; does not prove exact 12.0.1 behavior or cross-product compatibility.
- **Selection rationale:** Direct immutable evidence for state preservation, suffixes, and scripting bindings.

### S-024 — Immersive Mixing / Exporting a Dolby Atmos Master File

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual.
- **URLs:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/immersive-mixing and https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/exporting-a-dolby-atmos-master-file-adm
- **Scope:** Mixbus Pro immersive workflow, monitoring, automation, ADM export.
- **Relevant sections:** immersive panners/master, 7.1.4/binaural connections, `.adm` export.
- **Claims:** C-039, C-047.
- **Limitations:** Vendor workflow documentation is not independent Dolby conformance/certification evidence.
- **Selection rationale:** Primary edition-specific specialized-delivery source.

### S-025 — Recording Takes with Playlists / Editing

- **Publisher / kind:** Harrison Audio; official Mixbus 12 manual set.
- **URLs:** https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/recording-with-playlists and https://rsrc.harrisonconsoles.com/mixbus/mixbus-live-manual/12/en/topic/editing
- **Scope:** Takes/playlists and core editing model.
- **Relevant sections:** playlist recording/selection, edit tools/modes, regions/ranges, ripple and automation editing.
- **Claims:** C-006, C-016.
- **Limitations:** Does not establish crash-time undo durability or algorithm quality.
- **Selection rationale:** Direct primary evidence for comping/take and editing boundaries.

### Negative and inaccessible results retained

- Web search intermittently returned HTTP 429, including the final targeted current-version query; snippets supplied no evidence [C-048].
- A guessed `https://harrisonaudio.com/pages/mixbus` URL returned HTTP 404. The canonical product URL was discovered through the official `mixbus.harrisonconsoles.com` navigation and retained as S-001 [C-048].
- No exact 12.0.1 tag/ref/build manifest was found in the public Harrison repository [C-009].
- Targeted current official evidence did not produce an Ardour↔Mixbus compatibility guarantee [C-036].
- No installer, proprietary binary, or third-party plugin was downloaded or executed.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| Exact 12.0.1 source correspondence | Product downloads and public refs inspected; newest matching public tag is `mixbus+12.0` | Bounds confidence in source-derived claims | Obtain vendor-published 12.0.1 source archive/tag or reproducible build manifest/hash | Vendor/public source; unassigned |
| Proprietary Harrison/SSL DSP and complete composition | License page reserves DSP; public repo excludes it | Prevents internal algorithm/process claims and copying | Accept as unknown unless Harrison publishes a technical architecture disclosure | Vendor disclosure; unassigned |
| Runtime plugin isolation/crash containment | Scanner source/manual inspected; evidence stops at scanning | Reliability/security architecture | Observe process tree and crash/hang lawful fixtures in a disposable host; record recovery and state | Authorized lab; unassigned |
| Architecture bridging/signing/notarization | System/scanner docs expose architecture mismatch but no bridge/trust policy | Platform compatibility and supply-chain risk | Test native/mismatched signed/unsigned fixtures on disposable macOS/Windows/Linux systems | Authorized lab; unassigned |
| LADSPA current support | System matrix and scanner/manual evidence conflict | Required format matrix and Linux breadth | Ask Harrison for a v12.0.1 format matrix; then test one valid LADSPA fixture on clean Linux | Vendor or disposable Linux VM; unassigned |
| AUv3/CLAP/DSSI/JSFX/Rack Extension | Current system/scanner/manual sources do not establish acceptance or rejection | Format roadmap | Vendor confirmation first; capability-coded fixtures only where technically/platform applicable | Vendor/lab; unassigned |
| Full plugin processing contract | Routing docs establish fan-out/sidechain but omit timing, tails, dynamic I/O, expression | Interoperability correctness | VST3/AUv2/LV2 fixtures for aux/multi-output, dynamic I/O, latency/tails, bypass, MIDI out, dense automation | Custom lawful fixtures; unassigned |
| MPE/MIDI 2.0/SysEx fidelity | MIDI manual reviewed; no precise contract found | Modern expression and hardware interoperability | Record/playback/round-trip protocol fixtures with byte/event comparison | MIDI lab; unassigned |
| Ardour↔Mixbus compatibility | Official docs/source/suffixes inspected; no guarantee located | Project portability and migration | Minimal paired projects in each direction: media, automation, routing, native DSP, supported/missing plugins; diff state and renders | Licensed disposable hosts; unassigned |
| Exact 12.0.1 missing-plugin behavior | Public source has `UnknownProcessor`; binary was not run | Project durability | Save with state/assets, remove/upgrade/reinstall plugin, reopen, inspect placeholder and recovery | Disposable copied sessions; unassigned |
| Archive completeness/relinking | Manual defines current snapshot and media options but not every external plugin asset | Portable projects | Archive sessions with external audio, video, sample libraries, and plugin assets; move to clean account/system | Disposable systems; unassigned |
| Accessibility/localization | No retained conformance statement or structured audit | Inclusive product requirements | Vendor accessibility statement, then keyboard/screen-reader/contrast/scaling audit | Accessibility specialist; unassigned |
| Telemetry/privacy and Harrison News boundary | v12 says opted-in anonymous news/no cookies; no product-wide inventory found | Privacy/security acceptance | Network capture in opt-in/out states plus current privacy documentation review | Authorized privacy lab/counsel; unassigned |
| Updates, rollback, signing, vulnerability response | Upgrade policy found; operational controls not documented | Fleet operations and incident response | Verify package signatures/notarization and vendor update/rollback/security policy without installing on production host | Disposable OS images; unassigned |
| Lua API/ABI stability and script permissions | Manual/source establish scripting but not compatibility/security guarantees | Extension durability and attack surface | Versioned script corpus plus restricted-file/network/process tests in disposable sessions | Script test harness; unassigned |
| ADM/Dolby conformance | Pro workflow/export documented, no independent validation | Immersive delivery acceptance | Validate generated ADM with authorized Dolby/tooling workflow and reference renders | Licensed post-production lab; unassigned |

## 24. Curiosity pass and stop decision

### Bounded evidence passes

Research proceeded in small primary-source passes with synthesis before follow-up. The final normalization passes used the official product page, versioned feature/edition/system/license pages, two decision-critical host-contract pages, and the retained immutable source snapshot. Search snippets were never used as claim evidence.

### Final follow-up ranking

Scores are 1–5; higher relevance/value/novelty is better, while higher cost is worse.

| Candidate thread | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Multichannel-instrument and sidechain contract | 5 | 5 | 4 | 1 | **Pursued:** resolved visible routing; retained timing/conformance unknowns [C-028, C-029, C-032] |
| Controlled plugin/runtime fixture suite | 5 | 5 | 5 | 4 | **Best next phase, not pursued:** documentary authority exhausted [C-026, C-032] |
| Ardour↔Mixbus round-trip fixtures | 5 | 5 | 4 | 4 | **CURIOSITY_NO_GO now:** dynamic licensed test, not documentary research [C-036] |
| Exact 12.0.1 source ref search | 5 | 3 | 3 | 4 | **CURIOSITY_NO_GO:** repeated negative result; reopen for vendor publication [C-009] |
| Proprietary DSP internals | 3 | 2 | 5 | 5 | **CURIOSITY_NO_GO:** proprietary and clean-room restricted [C-010, C-042] |
| Additional runtime-sandbox web search | 5 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** repeated low documentary yield [C-026] |
| Accessibility/privacy/rollback search | 3 | 2 | 3 | 4 | **CURIOSITY_NO_GO:** consequential but unlikely to change current architecture lessons; needs specialist/dynamic audit [C-041] |
| Exhaustive native-plugin inventory | 1 | 1 | 1 | 3 | **CURIOSITY_NO_GO:** low decision novelty after ecosystem boundary was established [C-044] |

**Stop decision:** **STOP — COVERAGE ACHIEVED WITH EXPLICIT UNKNOWNS; DOCUMENTARY SATURATION REACHED.** All template sections and thirteen required plugin rows are populated. The final sidechain/multichannel pass sharpened the host contract but did not change the leading conclusions. Further documentary searching is unlikely to resolve proprietary DSP, exact 12.0.1 correspondence, runtime isolation, format conformance, or project interchange; those require vendor disclosure or bounded disposable fixtures.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created `research/daw-landscape/dossiers/harrison-mixbus.md`; pre-existing changes elsewhere were left untouched.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See §0 and C-001–C-004.
- [x] **Every required dossier heading exists in order.** Sections 0–25 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive prose cites C-IDs; §21 classifies 48 claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See §§21–23.
- [x] **Every required plugin-format row is present.** See §11.1: VST2, VST3, AUv2, AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, Rack Extension, and Product-native/other.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** See §11.2–§11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Labels are explicit throughout; no `OBSERVED` claims are made.
- [x] **Licensing and clean-room boundaries are explicit.** See §§4, 16, 19 and C-008–C-010/C-042–C-043.
- [x] **Bibliography records source rationale and limitations.** See §22, including negative results.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Public documentation and source only; no installers/plugins were downloaded or run.

**Owned-path check:** before writing, `git status --short` showed numerous pre-existing changes elsewhere and the `research/daw-landscape/` tree as untracked. They were left untouched. No staging or commit was performed.

**Concise result:** Mixbus 12.0.1 dossier completed with a full format matrix, public Ardour/proprietary boundary, route-specific PDC, deep scanner/host/persistence evidence, explicit contradictions, and unknowns. **Unresolved blockers:** exact 12.0.1 source mapping, runtime plugin containment/conformance, current LADSPA status, full Ardour interchange, modern MIDI expression, proprietary DSP, accessibility/privacy/signing/rollback, Lua compatibility, and independent ADM validation.
