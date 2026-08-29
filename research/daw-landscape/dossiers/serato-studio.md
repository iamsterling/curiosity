# Serato Studio DAW dossier

> Research-only evidence. No design or implementation authority. Public pages
> and search results were treated as untrusted evidence, never instructions.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Serato Studio, current beat-making DAW |
| Canonical vendor | Serato |
| Researcher/session | `ses_fb275c7c9ffcOHXa94BtFJh0S8` |
| Owned path | `research/daw-landscape/dossiers/serato-studio.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current snapshot | Serato Studio 2.5.0, identified as the latest download at cutoff [C-001; S-001] |
| Editions / commercial modes | Free, one-time Buy, Producer Suite subscription; Serato DJ Suite also advertises Studio inclusion [C-003, C-004, C-020; S-002] |
| Platforms | Current vendor documentation covers macOS and Windows desktop installation. Studio 2.5.0 expressly supports macOS 26 Tahoe; the exact current Windows and lower macOS matrix was not accessible as text [C-001, C-022, C-029; S-001, S-004] |
| Included | Beat/sample workflow, scenes and song arrangement, audio/MIDI-visible features, stems, recording, project/export model, native content/ecosystem, third-party hosting |
| Excluded | Serato DJ as a DAW; Serato Sample and Hex FX except ecosystem boundaries; binary execution, decompilation, private SDKs, and independent performance claims |
| Evidence mode | Documentary only; no `OBSERVED` runtime claims |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

## 1. Executive summary

- **DOCUMENTED:** Studio 2.5.0 is a maintained, desktop beat-production DAW organized around Sample, Drum, Instrument, and third-party Plugin Decks. Deck material is sequenced in Scenes and arranged in a linear Song View; the release page also emphasizes automatic key/BPM synchronization, audio recording, and four-part stem separation [C-001, C-002, C-012; S-001, S-006, S-009].
- **DOCUMENTED / INFERENCE:** The product presents a useful two-level composition model: reusable deck patterns inside scenes, then scenes and audio tracks in a song timeline. This is a bounded interpretation of public UI documentation, not a claim about internal graph structure [C-012, C-013; S-009].
- **DOCUMENTED:** The current host-format headline is 64-bit VST2 and VST3 on macOS/Windows plus generic 64-bit Audio Units on macOS. Studio scans on launch, offers an explicit rescan and default/custom VST locations, hosts instruments as Plugin Decks and effects in FX slots, and opens custom plugin UIs in separate windows [C-005, C-006, C-008; S-003, S-005, S-007, S-008].
- **DOCUMENTED limitation:** Serato says third-party parameters are controllable in the plugin UI but warns their automation may not be available. Free mode has no automation at all [C-009, C-024; S-002, S-007].
- **UNKNOWN:** Public evidence does not expose plugin process isolation, sandboxing, crash containment, architecture bridging, blacklist/cache policy, sidechain or multi-output contract, MIDI output/MPE/MIDI 2.0, latency/tail reporting, sample-accurate automation, dynamic I/O, state serialization, missing-plugin placeholders, or recovery [C-007, C-010, C-011, C-027, C-031].
- **DOCUMENTED:** Projects use `.ssp`; “Save Project with Samples” creates a compressed archive with the project and WAV sample copies. Master, per-deck stem, loop-region, and individual drum-pad export are available as WAV/MP3 [C-014, C-015; S-011, S-012].
- **Confidence:** High for visible workflow, editions, format names/bitness, scan controls, UI placement, and export. Low for proprietary engine internals and full host-contract fidelity. Vendor documentation establishes what Serato documents, not independent runtime performance.

## 2. Product identity, history, and market position

**DOCUMENTED.** Serato’s current download page identifies Studio 2.5.0 and describes it as a production environment intended to move from an idea to a song, with dedicated Sample, Drum, and Instrument Decks, stem separation, synchronized key/BPM, recording, and Scene/Song composers [C-001, C-002; S-001]. The presence of a current 2.5.0 release and macOS 26 support establishes maintained status at the cutoff; this research did not attempt a full corporate or pre-2.x history [C-001].

**DOCUMENTED.** Current commercial modes are Free, Buy, and Producer Suite subscription. At access time the page showed USD $149 for Buy and USD $9.99/month for Producer Suite, with cancellation permitted; prices are point-in-time observations of vendor documentation, not procurement advice [C-003; S-002].

**DOCUMENTED.** Free is deliberately constrained: one audio track, four decks, four scenes, selected content, limited recording, and no automation. The Buy and Producer Suite columns show unlimited audio tracks/decks/recording, 32 scenes, automation, all sound packs, and the same MP3/WAV/stems export choices [C-004, C-024; S-002]. Third-party-plugin entitlement by edition is not stated on that comparison table [C-026].

## 3. Workflow and conceptual model

**DOCUMENTED.** The principal sound-generating objects are Sample, Drum, Instrument, and Plugin Decks. The Scene Player exposes a deck list, deck control bar, pad area, per-deck sequencer/piano roll, and Scene Bank. Song View exposes a header/timeline, audio tracks, and navigation [C-002, C-012; S-001, S-006, S-009].

**INFERENCE.** The user model is therefore two-level rather than a conventional track-only timeline: create beat/melodic parts on decks, combine those parts into section-like scenes, then arrange scenes in Song View while adding longer-form audio tracks. A plausible alternative is to describe scenes merely as timeline regions; the separate Scene Player and Song View documentation favors the two-level interpretation [C-013; S-009].

**DOCUMENTED.** Current release notes add per-stem levels and automation for stem on/off and level within Sample Decks. The named separated components are acapella, melody, bassline, and drums [C-017; S-001].

## 4. Publicly documented architecture

**DOCUMENTED (user-visible architecture only).** Public manuals disclose a deck/scene/song object hierarchy, a Library with plug-in and project surfaces, a Mixer and Master view, FX slots, `.ssp` project files, project folders, and explicit master/stem export operations [C-012, C-014, C-015; S-006, S-009, S-010, S-011, S-012].

**UNKNOWN.** Serato does not disclose in the retained sources its process topology, engine graph representation, real-time thread model, scheduling, worker pools, storage schema, plugin ABI wrappers, or service boundaries. No internal architecture is inferred from UI labels [C-018].

## 5. Audio engine

**DOCUMENTED.** Serato advertises project-wide key/BPM synchronization for audio, audio stem separation, recording, and rendered master/stem output. Export can use the Song View loop region and is bounded by the last scene in the arrangement for a master export [C-002, C-015, C-017; S-001, S-012].

**UNKNOWN.** Supported engine sample rates, internal precision, block-size behavior, multicore scheduling, plugin delay compensation, tail handling, freeze, oversampling, dropout recovery, real-time versus offline render equivalence, and engine diagnostics were not stated in the retained public sources [C-018]. Nothing here should be read as evidence that delay compensation is absent.

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED.** Audio Tracks and their waveform, parameter, and mixer panels are first-class manual sections; Song View provides a timeline and audio-track layer. Scene Player supplies pad sequencing and a piano roll. Current paid modes allow unlimited audio tracks/decks and 32 scenes, while Free allows one audio track, four decks, and four scenes [C-004, C-012; S-002, S-009].

**DOCUMENTED.** Current feature material describes loading full songs, acapellas, or textures over the length of a beat and automatic key/BPM synchronization [C-002; S-001, S-002].

**UNKNOWN.** Takes/lanes, comping, ripple editing, clip grouping, destructive versus non-destructive edit guarantees, warp algorithms, meter-map depth, and edit-history persistence were not established [C-018].

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED.** The manual exposes a deck sequencer and piano roll, Plugin/Instrument Deck Auto Chords, and MIDI Mapping Mode; Studio 2.5.0 also lists MIDI Mapping among recent capabilities [C-012, C-017; S-001, S-006, S-009, S-010]. Third-party instruments can be played in a Plugin Deck [C-008; S-007].

**UNKNOWN.** MIDI-file import/export, plugin MIDI output, multiple event buses, MPE/per-note expression, MIDI 2.0, SysEx, score notation, MIDI clock, MTC, and sample-accurate event scheduling were not documented in the retained evidence [C-010]. MIDI mapping is not evidence for any of those contracts.

## 8. Routing, mixer, automation, and control

**DOCUMENTED.** Studio has Mixer and Master views and distinguishes Pad, Deck, Instrument/Plugin, and Master FX in the manual taxonomy. A native Sidechain Compression article exists, but its indexed presence does not prove arbitrary sidechain buses to third-party plugins [C-012, C-028; S-009, S-010].

**DOCUMENTED.** Paid editions expose automation; Free does not. Studio 2.5.0 documents stem on/off and per-stem-level automation. Third-party parameters are controllable in the plugin UI, but parameter automation “may not be available” [C-009, C-017, C-024; S-001, S-002, S-007].

**UNKNOWN.** Send/return topology, groups/VCAs, feedback routing, arbitrary bus layouts, surround/immersive channels, third-party sidechain inputs, automation resolution/sample accuracy, stable parameter identity, MIDI/OSC remote APIs, and control-surface protocol extensibility remain unknown [C-010, C-021, C-031]. Studio 2.5.0 documents native control for AlphaTheta SLAB, which is product integration rather than a public controller API [C-020; S-001].

## 9. Recording, comping, and media handling

**DOCUMENTED.** Studio records audio from sources including vocals, instruments, and vinyl. Free recording is limited; Buy and Producer Suite list unlimited recording. The manual includes dedicated Audio Track and Record sections [C-002, C-004, C-012; S-002, S-009, S-010].

**DOCUMENTED.** “Save Project with Samples” packages WAV copies in a Samples folder, while export can produce WAV or MP3. This establishes selected project-collection and delivery formats, not a complete import codec matrix [C-014, C-015; S-011, S-012].

**UNKNOWN.** Input monitoring semantics, punch/loop takes, comping, recording bit depth, complete import formats, conform/proxy workflows, video media, metadata, and missing-asset relinking are not established [C-016, C-018].

## 10. Instruments, effects, content, and native devices

**DOCUMENTED.** Native architecture presents Sample, Drum, and Instrument Decks; the integrated library includes Serato sound packs, instruments, drum kits, effects, and patterns. Current Studio also exposes Sample Deck stem separation and unlimited FX slots [C-002, C-017, C-020; S-001, S-002].

**DOCUMENTED.** Producer Suite bundles Studio with Serato Sample and Hex FX, and all sound packs. Studio is also advertised as available in Serato DJ Suite [C-003, C-020; S-002].

**UNKNOWN.** No public native-device authoring SDK, modular rack graph, general modulation system, or stable native extension ABI was identified [C-021]. Built-in devices and content are therefore a product-native ecosystem, not evidence of a third-party native format.

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` below is a dossier-scope judgment: no Linux, mobile, or web Studio edition was established in the current vendor materials inspected. It is not a claim about what an undisclosed build could technically do [C-030]. “Not in compatible list” means the vendor’s ostensibly exhaustive compatible-format article names only VST2, VST3, and generic AU; there was no binary probe [C-023; S-003].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **DOCUMENTED:** 64-bit | **DOCUMENTED:** 64-bit | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | Current manual; explicit edition parity **UNKNOWN** | Instruments and effects documented; 32-bit rejected | C-005, C-008, C-026; S-003, S-007, S-008 |
| VST3 | **DOCUMENTED:** 64-bit | **DOCUMENTED:** 64-bit | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | Current manual; explicit edition parity **UNKNOWN** | Default/custom folders and rescan documented | C-005, C-006, C-026; S-003, S-005 |
| AUv2 | **UNKNOWN:** vendor says generic 64-bit AU `.component`, not AU generation | **NOT_APPLICABLE:** vendor says Mac only | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | Current manual; explicit edition parity **UNKNOWN** | Generic AU acceptance is documented; AUv2 identity is not | C-005, C-025, C-026; S-003, S-005 |
| AUv3 | **UNKNOWN:** not named; generic AU wording does not resolve AUv3 | **NOT_APPLICABLE:** Apple format / no Windows claim | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | No edition/version evidence | Do not infer from “AU” or `.component` | C-025; S-003, S-005 |
| AAX | **DOCUMENTED:** not in compatible list | **DOCUMENTED:** not in compatible list | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | Current compatible-format article | No host-support claim; no runtime probe | C-023; S-003 |
| CLAP | **DOCUMENTED:** not in compatible list | **DOCUMENTED:** not in compatible list | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | Current compatible-format article | No host-support claim; no runtime probe | C-023; S-003 |
| LV2 | **DOCUMENTED:** not in compatible list | **DOCUMENTED:** not in compatible list | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | Current compatible-format article | No host-support claim; no runtime probe | C-023; S-003 |
| LADSPA | **DOCUMENTED:** not in compatible list | **DOCUMENTED:** not in compatible list | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | Current compatible-format article | No host-support claim; no runtime probe | C-023; S-003 |
| DSSI | **DOCUMENTED:** not in compatible list | **DOCUMENTED:** not in compatible list | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | Current compatible-format article | No host-support claim; no runtime probe | C-023; S-003 |
| JSFX | **DOCUMENTED:** not in compatible list | **DOCUMENTED:** not in compatible list | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | Current compatible-format article | No host-support claim; no runtime probe | C-023; S-003 |
| DirectX/DXi | **DOCUMENTED:** not in compatible list | **DOCUMENTED:** not in compatible list | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | Current compatible-format article | No Windows host-support claim; no runtime probe | C-023; S-003 |
| Rack Extension | **DOCUMENTED:** not in compatible list | **DOCUMENTED:** not in compatible list | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | Current compatible-format article | No host-support claim; no runtime probe | C-023; S-003 |
| Product-native/other | **DOCUMENTED:** built-in Decks/content | **DOCUMENTED:** built-in Decks/content | **NOT_APPLICABLE:** no in-scope edition | **NOT_APPLICABLE:** no in-scope edition | Studio 2.5.0/current pricing | Native Sample/Drum/Instrument devices and Serato content; no public third-party native SDK identified | C-002, C-020, C-021; S-001, S-002 |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED.** Studio scans for new plugins at application launch. Setup → Plugins offers a Scan action to force a rescan of enabled locations. Users can enable default VST locations, select a custom VST folder for VST2/VST3, and enable the default macOS AU `.component` location. Unsupported types are not added to the Studio Library [C-006; S-003, S-005].

**DOCUMENTED.** Plugin instruments and effects appear through the Library’s Plugins tab; effect-capable items carry a Plugin Effect status symbol [C-008; S-007, S-008].

**UNKNOWN.** Validation stages, cache format/invalidation, duplicate identity/version rules, individual-plugin enable/disable, blacklist/quarantine, scan-process isolation, timeouts, crash recovery, and actionable failure logs are not disclosed [C-007]. “Not added to the Library” is not evidence of safe validation or containment.

### 11.3 Runtime isolation and compatibility

**DOCUMENTED.** Only 64-bit plugins are accepted; 32-bit plugins are unsupported [C-005; S-003, S-005].

**UNKNOWN.** In-process versus separate-process execution, per-plugin or shared sandboxing, crash containment, memory protection, architecture translation/bridging, Apple Silicon compatibility policy, code-signing/notarization enforcement, and compatibility modes are undisclosed [C-011]. The 64-bit requirement does not resolve any of these questions.

### 11.4 Host/plugin processing contract

**DOCUMENTED.** Third-party instruments run as Plugin Decks and effects load in FX slots [C-008; S-007, S-008].

**UNKNOWN.** Audio input/output bus counts, effect/instrument subtypes, auxiliary and sidechain buses, multi-output instruments, MIDI output, event timing, MPE, MIDI 2.0, sample-accurate automation, latency/tail reporting or compensation, bypass/suspend semantics, offline rendering calls, dynamic I/O, and render determinism are not specified [C-010, C-018, C-031]. The native Sidechain Compression article does not establish third-party sidechain support [C-028; S-010].

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED.** Serato says all third-party parameters are controllable inside the plugin UI, while warning that automation “may not be available.” Free mode has no automation; paid modes list automation generally [C-009, C-024; S-002, S-007].

**UNKNOWN.** Parameter IDs/ranges/text, automation precision, gesture recording, preset discovery, plugin-state chunks, external asset references, state migration, cross-format substitution, missing-plugin placeholders, and state recovery after scan failure are not documented [C-027, C-031]. The `.ssp` project article does not describe plugin state [C-014; S-011].

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED.** A newly loaded instrument plugin opens its interface in a new window; the Plugin Deck header can open/close it. Plugin effects replace FX Depth with a show/hide-interface toggle. This is detached/custom UI hosting rather than evidence of embedding [C-008; S-007, S-008].

**UNKNOWN.** UI scaling, HiDPI negotiation, keyboard/focus handling, accessibility propagation, headless/generic editors, multiple editors, window recovery, plugin-crash UX, scan diagnostics, and missing-plugin messages are undisclosed [C-007, C-011, C-027].

## 12. Extensibility and integration

**DOCUMENTED.** Studio integrates with Serato Sample, Hex FX, Sound Packs, Serato Visualizer export, and native control for AlphaTheta SLAB. MIDI Mapping is user-facing control customization [C-017, C-020; S-001, S-002, S-010, S-012].

**UNKNOWN.** No retained public source establishes scripting, macros as an API, a command/action SDK, third-party native-device SDK, OSC/remote API, controller-script API, or compatibility/versioning guarantees [C-021]. VST/AU hosting is the documented third-party extension boundary [C-005].

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED.** Saved projects use `.ssp` and live inside same-named project folders. Save overwrites the current project; Save As creates another project. Projects can be organized in Library crates/sub-crates. “Save Project with Samples” creates a compressed archive containing an `.ssp` and a Samples folder with individual project tracks copied as WAV [C-014; S-011].

**DOCUMENTED.** Export produces a complete master or individual audio files per Deck as WAV/MP3; optional loop-region-only export, -6 dB stem attenuation, and per-drum-pad files support handoff workflows [C-015; S-012].

**UNKNOWN.** The public project article does not specify the `.ssp` representation, schema/version migrations, autosave, crash recovery, undo-history persistence, forward/backward compatibility, content hashes, default asset references/relinking, plugin state, or missing-plugin behavior. No AAF, OMF, ADM, MIDI, MusicXML, DAWproject, cloud co-editing, project version control, or merge semantics were established in the retained sources [C-016, C-027]. This is an absence of evidence, not a claim that every such feature is impossible.

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED.** Delivery centers on MP3/WAV master export, per-deck stems, selected loop regions, individual drum-pad files, and Serato Visualizer handoff [C-015; S-012]. The product’s distinctive specialty is rapid beat/sample creation with scene-to-song arrangement and built-in stem separation [C-002, C-013, C-017].

**UNKNOWN.** Batch export, loudness targets, DDP, AAF/OMF, video timeline, ADR, timecode, surround/immersive/ADM, and show-control facilities are not established [C-016, C-018].

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED.** Studio 2.5.0 supports macOS 26 Tahoe; only 64-bit plugins are accepted. An official compatibility article maintains 2.x/1.x OS matrices and links older downloads, but its current cells were image-only in the accessible response [C-001, C-005, C-022; S-001, S-003, S-004].

**UNKNOWN.** Exact current Windows support, minimum/recommended hardware, scaling limits, CPU meters/resource controls, plugin crash containment, recovery diagnostics, rollback, signing enforcement, telemetry/privacy behavior, screen-reader support, keyboard-only coverage, UI scaling accessibility, and localization were not established [C-007, C-011, C-018, C-022]. Vendor stability language is not an independent reliability measurement.

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED.** The vendor currently offers feature-limited Free, Buy, and cancellable monthly Producer Suite paths; Producer Suite adds Serato Sample and Hex FX. Activation count, offline grace, transfer rights, paid-upgrade policy, institutional terms, and subscription-expiry project behavior were not established [C-003, C-004, C-020; S-002].

**INFERENCE / clean-room constraint.** Serato’s ability to host VST2/VST3/AU proves only a documented product capability. It grants no VST SDK, Audio Unit, trademark, redistribution, signing, certification, or compatibility rights to a new DAW. VST2 is specifically a discontinued-format licensing concern in the governing research frame; VST3 and Apple Audio Units also require independent current terms review. No legal conclusion is offered [C-019; S-003].

**UNKNOWN.** Serato Studio’s proprietary implementation, plugin-hosting agreements, test suites, and any private SDK access remain outside this clean-room study [C-011, C-018, C-021].

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED / INFERENCE:** A compact deck → scene → song hierarchy aligns beat construction with eventual linear delivery without exposing users to an undifferentiated track graph [C-012, C-013].
- **DOCUMENTED:** Integrated key/BPM synchronization, stem separation/level automation, dedicated deck types, patterns, sound packs, and per-deck/drum-pad export reduce setup cost for sample-led production [C-002, C-015, C-017, C-020].
- **DOCUMENTED:** Scan controls and default/custom paths are visible, while instruments and effects have clear placement models [C-006, C-008].
- **DOCUMENTED:** “Save Project with Samples” and explicit stem export provide pragmatic handoff boundaries [C-014, C-015].

### Liabilities / risks

- **DOCUMENTED:** Third-party parameter automation is not guaranteed, materially limiting host interoperability beyond basic instantiation [C-009].
- **UNKNOWN:** Deep host semantics, state durability, failure isolation, latency handling, and missing-plugin behavior are undocumented [C-007, C-010, C-011, C-027, C-031].
- **DOCUMENTED / UNKNOWN:** Format breadth is confined in the current compatible list to VST2/VST3/generic AU, with AU generation and edition parity unresolved [C-005, C-023, C-025, C-026].
- **DOCUMENTED:** Free-mode limits make edition identity decision-critical when comparing workflow capacity and automation [C-004, C-024].

The architecture lesson is not that Studio’s proprietary internals should be copied; it is that a beat-focused product can expose a narrow conceptual model while still requiring an explicit, testable host contract underneath [C-013, C-019].

## 18. Transferable patterns

| Pattern | Problem | Minimal clean-room mechanism | Support | Prerequisites / tradeoffs / risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Deck → Scene → Song hierarchy | Pattern producers need speed without losing linear arrangement | Typed sound sources feed reusable scene parts; a separate song timeline orders scenes and longer audio | C-012, C-013 | Requires clear identity/override rules; risks duplication between scene and timeline state | **CANDIDATE** |
| Explicit scanner surface | Third-party discovery otherwise feels opaque | User-visible enabled roots, custom roots, launch scan, and forced rescan | C-006 | Must add safe validation, cache provenance, quarantine, and diagnostics absent from public Studio evidence | **CONDITIONAL** |
| Separate instrument and effect placement | Users need predictable plugin roles | Instrument container for MIDI/event-driven sources; ordered effect slots for processors | C-008 | Requires explicit bus/sidechain/multi-output contract and stable state identity | **CANDIDATE** |
| Collect-with-project plus render stems | Projects depend on external media and recipients may lack plugins | Archive project plus copied assets; export master, per-source stems, and granular drum files | C-014, C-015 | Licensing of assets/plugins, deterministic render, relinking, and manifests must be designed explicitly | **CANDIDATE** |
| Honest capability degradation | A format logo can overpromise | Disclose bitness, platform, automation, and unsupported-contract boundaries separately | C-005, C-009, C-023 | Product messaging becomes more complex but qualification risk decreases | **CANDIDATE** |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** Treating “full VST/AU support” marketing language as proof of a full host contract. The manual narrows format/bitness and explicitly caveats parameter automation; most runtime semantics remain unknown [C-005, C-009, C-010; S-001, S-003, S-007].
- **REJECTED:** Inferring AUv2 or AUv3 solely from “AU” or `.component`. The generation is not named [C-025].
- **REJECTED:** Inferring third-party sidechain support from a native Sidechain Compression manual entry [C-028].
- **REJECTED:** Inferring sandboxing or crash containment from 64-bit-only support or a scanner [C-007, C-011].
- **REJECTED:** Treating `.ssp` plus a project folder as proof of self-containment. Asset collection is a separate command, and plugin state/missing dependencies are undocumented [C-014, C-016, C-027].
- **CURIOSITY_NO_GO:** Deep engine threading/graph search — high relevance but low documentary yield and high cost; reopen only for a public engineering source or authorized runtime probe [C-018].
- **CURIOSITY_NO_GO:** Controller model inventory — low decision relevance beyond the documented SLAB and MIDI-mapping boundaries [C-020, C-021].
- **CURIOSITY_NO_GO:** Corporate-history expansion — unlikely to change the architecture decision; reopen only if lineage affects project or plugin compatibility.
- **CURIOSITY_NO_GO:** Community reports of particular plugin failures — not suitable to establish current host internals without controlled reproduction.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / check | Documentary result | Status / later discriminating probe |
| --- | --- | --- |
| H1: Current Studio hosts only VST3 | Official manual also names VST2 and generic AU | **REFUTED** [C-005; S-003] |
| H2: “VST/AU support” implies all bitness/platforms | Manual says 64-bit only and AU Mac only | **REFUTED** [C-005; S-003] |
| H3: Accepted format implies full automatable parameters | Serato warns third-party automation may not be available | **REFUTED** [C-009; S-007] |
| H4: Native sidechain FX implies plugin sidechain buses | No retained source connects it to third-party buses | **UNRESOLVED / do not infer** [C-010, C-028] |
| H5: Plugins run out of process | No process-boundary evidence | **UNKNOWN** [C-011]; inspect process tree and crash a disposable fixture in a later authorized test |
| H6: A normal `.ssp` save is self-contained | Separate “Save Project with Samples” command is required to create an asset archive | **REFUTED as a blanket claim** [C-014; S-011] |
| H7: Studio uses a two-level scene/linear arrangement model | Separate Scene Player and Song View structures support it | **SUPPORTED INFERENCE** [C-012, C-013; S-009] |
| H8: Exact current Windows support is documented accessibly | OS matrix arrived only as an image and download text did not expose cells | **UNKNOWN** [C-022; S-004] |

**Accepted → scanned → instantiated → full contract check:**

1. **Format accepted:** documented for 64-bit VST2/VST3 and generic AU [C-005].
2. **Discovered/scanned:** documented for enabled default/custom locations and explicit rescans [C-006].
3. **Instantiated:** documented as Plugin Deck instruments and FX-slot effects [C-008].
4. **Full contract:** not established; automation is explicitly qualified, and buses, latency, state, isolation, recovery, and missing-plugin behavior remain unknown [C-009, C-010, C-011, C-027, C-031].

No safe runtime probe was performed, so there are no `OBSERVED` claims.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Studio 2.5.0 is the current download and adds/supports macOS 26 Tahoe and AlphaTheta SLAB control | Current release at cutoff | S-001 | Direct “latest version”/What’s New text | Release date not exposed in fetched text |
| C-002 | DOCUMENTED | High | Studio exposes Sample, Drum, and Instrument Decks, stems, key/BPM sync, recording, and Scene/Song composers | Current product description | S-001, S-002 | Direct vendor feature descriptions | Marketing does not prove internal implementation quality |
| C-003 | DOCUMENTED | High | Current commercial choices are Free, USD $149 Buy, and USD $9.99/month Producer Suite subscription; cancellation is advertised | Pricing at access date | S-002 | Direct pricing columns | Currency/price may change; “Buy” terms not fully reproduced |
| C-004 | DOCUMENTED | High | Free has 1 audio track, 4 decks, 4 scenes, selected content, and limited recording; paid columns list unlimited tracks/decks/recording and 32 scenes | Current edition comparison | S-002 | Direct table | No separate enterprise/education terms investigated |
| C-005 | DOCUMENTED | High | Studio hosts 64-bit VST2/VST3 on macOS/Windows and generic 64-bit AU on macOS; 32-bit plugins are unsupported | Current public manual | S-003, S-005 | Direct compatible-format and preference text | AU generation and edition parity unresolved |
| C-006 | DOCUMENTED | High | Studio scans at launch and on forced Scan across enabled default/custom VST roots and default macOS AU root; unsupported types are not added to Library | Current public manual | S-003, S-005 | Direct installation/preferences text | Does not establish cache, isolation, quarantine, or validation quality |
| C-007 | UNKNOWN | High | Scan validation, cache, duplicate identity, blacklist/quarantine, crash recovery, and diagnostics are not publicly specified in retained evidence | Plugin discovery | S-003, S-005 | Targeted manual articles inspected | Absence is not proof that mechanisms do not exist |
| C-008 | DOCUMENTED | High | Third-party instruments load as Plugin Decks; effects load into FX slots; custom UIs open in/show via separate windows | Current public manual | S-007, S-008 | Direct workflow instructions | Does not establish bus depth or UI scaling |
| C-009 | DOCUMENTED | High | Plugin parameters are controllable in custom UI, but their automation may not be available | Third-party Plugin Decks | S-007 | Direct caution in manual | “May” is plugin/parameter-dependent, not universal absence |
| C-010 | UNKNOWN | High | Third-party sidechain, multi-output, audio/MIDI/event bus, MPE/MIDI 2.0, bypass/suspend, dynamic-I/O, and offline-call contracts are unspecified | Full host processing contract | S-003, S-007, S-008, S-010 | Relevant format/placement/index sources inspected | Requires controlled fixture tests or deeper vendor specification |
| C-011 | UNKNOWN | High | Plugin process isolation, sandboxing, crash containment, architecture bridging, signing enforcement, and compatibility modes are undisclosed | Host runtime | S-003, S-005 | Compatibility/manual sources inspected | 64-bit-only does not imply isolation |
| C-012 | DOCUMENTED | High | Manual taxonomy includes four deck types, Scene deck sequencing/piano roll/bank, Song timeline/audio tracks, Library, Mixer/Master, automation, projects, patterns, recording, stems, and MIDI mapping | User-visible object model | S-006, S-009, S-010 | Official manual indexes | Index titles prove exposed features, not full semantics |
| C-013 | INFERENCE | Medium-high | Studio uses a two-level deck/scene construction model followed by linear Song arrangement | Workflow interpretation | S-001, S-009 | Separate Scene Player and Song View structures | Alternative description: scenes as specialized timeline regions |
| C-014 | DOCUMENTED | High | Projects use `.ssp` within a same-named folder; Save with Samples creates an archive containing `.ssp` and WAV sample copies | Project persistence | S-011 | Direct project manual | Plugin state, schemas, and relinking not described |
| C-015 | DOCUMENTED | High | Export supports WAV/MP3 master or per-deck stems, loop-region export, -6 dB stem option, per-drum-pad files, and Visualizer handoff | Delivery | S-012 | Direct export manual | Render precision, latency/tail handling, and determinism unknown |
| C-016 | UNKNOWN | High | Autosave/recovery, migrations, missing assets/plugins, interchange formats, and collaboration/versioning are not established | Project durability/interchange | S-011, S-012 | Project/export articles inspected | Unsearched feature-specific pages could exist; no contrary claim made |
| C-017 | DOCUMENTED | High | Current Studio supports four-part stem separation/levels, stem on/off and level automation, MIDI mapping, and unlimited FX slots | Studio 2.5-era features | S-001 | Direct current download text | Detailed stem algorithm and automation precision unknown |
| C-018 | UNKNOWN | High | Internal engine graph, scheduling, precision, buffers, multicore, PDC/tails, freeze, oversampling, and diagnostics are undisclosed | Audio engine | S-001, S-012 | Current features/export inspected | Vendor may implement these privately |
| C-019 | INFERENCE | High | Documented hosting capability grants no implementation, SDK, trademark, redistribution, signing, certification, or compatibility rights to another DAW | Clean-room/legal boundary | S-003 | Capability evidence plus governing research contract | Not legal advice; current format-owner terms need separate review |
| C-020 | DOCUMENTED | High | Ecosystem includes Sound Packs, Sample, Hex FX, Visualizer export, SLAB control, and Studio availability through DJ Suite | Current ecosystem | S-001, S-002, S-012 | Direct vendor pages | Project-level interoperability with Serato DJ not established |
| C-021 | UNKNOWN | Medium-high | No scripting, controller-script, remote, native-device authoring, or public extension SDK was established | Extensibility | S-001, S-006, S-010 | Manual/product indexes inspected | Absence from retained pages is not proof of no private API |
| C-022 | UNKNOWN | High | Exact current Windows/macOS compatibility and hardware matrix cells remain inaccessible in text | Platform matrix | S-001, S-004 | Official article used image-only matrices | A later accessible table/OCR or vendor confirmation could resolve |
| C-023 | DOCUMENTED | Medium-high | The official compatible-format list names only VST2, VST3, and generic AU; all other required matrix formats lack a vendor host-support claim | Current manual format list | S-003 | Article says “following plugin formats” and gives the list | No binary rejection tests; avoid stronger internal claims |
| C-024 | DOCUMENTED | High | Free mode has no automation; Buy and Producer Suite list automation | Current editions | S-002 | Direct edition table | Does not enumerate every automatable target |
| C-025 | UNKNOWN | High | Exact AUv2 versus AUv3 support is not resolved by generic “AU” and `.component` language | macOS plugin format | S-003, S-005 | Generation not named | A fixture matrix can discriminate |
| C-026 | UNKNOWN | Medium-high | Plugin hosting entitlement/parity across Free, Buy, and Producer Suite is not stated in the retained edition comparison | Editions | S-002, S-003 | Pricing omits plugin row; manual is edition-neutral | Could be common to all editions; not assumed |
| C-027 | UNKNOWN | High | Plugin state/preset serialization, asset references, missing-plugin placeholders, migration, and recovery are unspecified | Project/plugin recall | S-007, S-011 | Plugin and project articles inspected | Requires save/reopen/missing-fixture tests |
| C-028 | DOCUMENTED | Medium | Native Sidechain Compression is represented in the manual index, but no third-party sidechain contract follows from that fact | Routing boundary | S-010 | Direct index title plus bounded negative inference | Detailed native sidechain behavior not retrieved |
| C-029 | DOCUMENTED | High | Current public plugin-install documentation has distinct macOS and Windows sections | Desktop platform evidence | S-003 | Direct article organization/instructions | Exact OS releases remain C-022 |
| C-030 | UNKNOWN | Medium-high | No Linux, mobile, or web Studio edition was established in inspected current vendor materials | Product boundary | S-001, S-003, S-004 | Current download/manual platform materials inspected | Not a proof that no historical/internal build exists |
| C-031 | UNKNOWN | High | Parameter identity/text, sample-accurate automation, latency/tail reporting, and dynamic I/O are unspecified | Deep host contract | S-007, S-012 | Plugin UI/automation and export sources inspected | Requires specification or controlled fixture |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Vendor statements document Serato’s claims and instructions; they are not independent measurements.

### S-001 — Download Serato Studio / What’s New in Studio 2.5.0

- **Publisher / kind:** Serato; official current product download/release page.
- **URL:** https://serato.com/studio/downloads
- **Scope:** Latest public Studio 2.5.0 snapshot.
- **Relevant passage/section:** “Get the latest version,” product capability bullets, “What’s New in Studio 2.5.0,” Stems Levels, Automate Stems, MIDI Mapping, unlimited FX slots.
- **Claims:** C-001, C-002, C-012, C-017, C-018, C-020, C-030.
- **Limitations:** Dynamic page did not expose the full System Requirements block or release date in fetched text; “full VST/AU support” is marketing-level and was narrowed using S-003/S-005.
- **Selection rationale:** Primary current-version anchor, preferable to news posts or secondary release summaries.

### S-002 — Serato Studio Pricing

- **Publisher / kind:** Serato; official pricing/edition comparison.
- **URL:** https://serato.com/studio/pricing
- **Scope:** Current Free, Buy, Producer Suite, and DJ Suite inclusion at access date.
- **Relevant passage/section:** Pricing cards and Free/Buy/Subscribe feature table.
- **Claims:** C-002, C-003, C-004, C-020, C-024, C-026.
- **Limitations:** Point-in-time USD pricing; does not state plugin entitlement, activation count, upgrade rights, or expiry behavior.
- **Selection rationale:** Direct commercial/edition source, preferable to reseller descriptions.

### S-003 — Plugins: Compatible plugins and installation

- **Publisher / kind:** Serato Support; official Studio user manual article.
- **URL:** https://support.serato.com/hc/en-us/articles/360001446375-Plugins-Compatible-plugins-and-installation
- **Scope:** Current public plugin formats and install locations for macOS/Windows.
- **Relevant passage/section:** Compatible Formats; Installing VST or AU plugins on Mac; Installing VST plugins on Windows.
- **Claims:** C-005, C-006, C-010, C-011, C-019, C-023, C-025, C-029.
- **Limitations:** No article revision/version visible in fetched text; AU generation and deep host semantics omitted.
- **Selection rationale:** Most direct primary format/platform evidence, preferable to the broader “VST/AU” download-page phrase.

### S-004 — Serato Studio operating system compatibility

- **Publisher / kind:** Serato Support; official compatibility article.
- **URL:** https://support.serato.com/hc/en-us/articles/6052529235727-Serato-Studio-operating-system-compatibility
- **Scope:** Studio 2.x and 1.x compatibility plus archive policy.
- **Relevant passage/section:** Introductory compatibility/older-version text and headings for 2.x/1.x matrices.
- **Claims:** C-001, C-022, C-030.
- **Limitations:** Matrix cells were embedded as images and not available as accessible text; exact versions could not be responsibly transcribed.
- **Selection rationale:** Canonical versioned compatibility source; retained despite accessibility limitation because the limitation itself explains the unknown.

### S-005 — Plugins: Serato Studio Plugins preferences

- **Publisher / kind:** Serato Support; official user manual article.
- **URL:** https://support.serato.com/hc/en-us/articles/360001446395-Plugins-Serato-Studio-Plugins-preferences
- **Scope:** Current scanner/rescan and location preferences.
- **Relevant passage/section:** Re-scan Plugins; Default VST Folder; Custom VST Folder; Audio Units (Mac Only).
- **Claims:** C-005, C-006, C-007, C-011, C-025.
- **Limitations:** No cache, validation, blacklist, isolation, or failure-recovery details.
- **Selection rationale:** Direct scanner-control source, preferable to inference from install paths.

### S-006 — Serato Studio user manual, page 1

- **Publisher / kind:** Serato Support; official manual index.
- **URL:** https://support.serato.com/hc/en-us/sections/360000195315-Serato-Studio-user-manual
- **Scope:** Setup, file formats, project toolbar, Sample/Drum/Instrument/Plugin Deck taxonomy.
- **Relevant passage/section:** Article list through Plugin Deck.
- **Claims:** C-002, C-012, C-021.
- **Limitations:** Index labels establish feature surfaces, not semantics or implementation.
- **Selection rationale:** Efficient primary map used to bound later retrieval rather than searching indiscriminately.

### S-007 — Plugin Deck: Overview

- **Publisher / kind:** Serato Support; official user manual article.
- **URL:** https://support.serato.com/hc/en-us/articles/360001445995-Plugin-Deck-Overview
- **Scope:** Third-party instrument instantiation, UI, and automation caveat.
- **Relevant passage/section:** Loading workflow and parameter-automation note.
- **Claims:** C-008, C-009, C-010, C-027, C-031.
- **Limitations:** Does not describe buses, process model, state, latency, or specific automation failures.
- **Selection rationale:** Decision-critical primary evidence separating accepted formats from instrument instantiation/full contract.

### S-008 — FX: Using third-party plugins as FX

- **Publisher / kind:** Serato Support; official user manual article.
- **URL:** https://support.serato.com/hc/en-us/articles/360001447875-FX-Using-third-party-plugins-as-FX
- **Scope:** Third-party effect placement and UI toggle.
- **Relevant passage/section:** Library drag/drop to FX slot; Plugin Effect symbol; interface show/hide.
- **Claims:** C-008, C-010.
- **Limitations:** No ordering limits, sidechains, multichannel layout, bypass, state, or diagnostics.
- **Selection rationale:** Primary counterpart to S-007, needed to distinguish instruments from effects.

### S-009 — Serato Studio user manual, page 2

- **Publisher / kind:** Serato Support; official manual index.
- **URL:** https://support.serato.com/hc/en-us/sections/360000195315-Serato-Studio-user-manual?page=2#articles
- **Scope:** Audio Tracks, Scene Player, Song View, Library, Mixer/Master, FX.
- **Relevant passage/section:** Complete page-2 article list.
- **Claims:** C-012, C-013.
- **Limitations:** Taxonomy only; no detailed behavior.
- **Selection rationale:** Primary workflow map, preferable to reconstructing concepts from promotional screenshots.

### S-010 — Serato Studio user manual, page 3

- **Publisher / kind:** Serato Support; official manual index.
- **URL:** https://support.serato.com/hc/en-us/sections/360000195315-Serato-Studio-user-manual?page=3#articles
- **Scope:** FX types, native sidechain, automation, projects, export, presets, patterns, record, stems, MIDI mapping.
- **Relevant passage/section:** Complete page-3 article list.
- **Claims:** C-012, C-020, C-021, C-028.
- **Limitations:** Indexed existence does not establish detailed semantics; specifically not evidence for third-party sidechain buses.
- **Selection rationale:** Bounded primary discovery map for persistence/export and explicit negative inference control.

### S-011 — Misc: Projects

- **Publisher / kind:** Serato Support; official user manual article.
- **URL:** https://support.serato.com/hc/en-us/articles/360001463276-Misc-Projects
- **Scope:** `.ssp`, project folders, Save/Save As, Save with Samples, open/recent, Library organization.
- **Relevant passage/section:** Entire project-management procedure, especially “Save Project with Samples.”
- **Claims:** C-014, C-016, C-027.
- **Limitations:** No schema, plugin state, autosave, recovery, migration, or missing-dependency details.
- **Selection rationale:** Canonical persistence source, preferable to guessing from file extensions.

### S-012 — Misc: Export

- **Publisher / kind:** Serato Support; official user manual article.
- **URL:** https://support.serato.com/hc/en-us/articles/6239823223183-Misc-Export
- **Scope:** Master/stem/loop/drum-pad export and Visualizer handoff.
- **Relevant passage/section:** Export Master; Export Stems; loop-region, -6 dB, drum-pad, and Visualizer options.
- **Claims:** C-015, C-016, C-018, C-020, C-031.
- **Limitations:** Does not document render precision, plugin latency/tails, determinism, interchange standards, or collaboration.
- **Selection rationale:** Direct delivery/interoperability boundary, preferable to the abbreviated pricing table.

### Negative and inaccessible results retained

- Two initial web-search requests returned HTTP 429 and supplied no evidence.
- A guessed Serato Studio support category URL returned HTTP 404; the correct category was later discovered through the public support UI.
- A guessed unauthenticated Zendesk API search URL returned HTTP 404.
- Two public support-search result pages were used only to discover canonical article URLs. Their snippets were explicitly treated as untrusted discovery text and did not support claims.
- S-004’s actual OS matrix was image-only in the fetched representation; repeated retries/OCR were rejected under the budget and accessibility stop rule.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| Exact current macOS/Windows/hardware matrix | Current download and official OS article inspected; matrix image had no accessible cells | Deployment baseline and architecture support | Obtain an accessible vendor table or manually inspect the official attachment with recorded OCR verification | Public source or vendor confirmation; unassigned |
| AUv2 versus AUv3 | Format and preference articles say only AU/`.component` | Determines AU host implementation boundary | Try signed 64-bit AUv2 and AUv3 effect/instrument fixtures on a disposable macOS system | Authorized runtime lab; unassigned |
| Edition-specific plugin entitlement | Pricing table lacks a plugin row; manual is edition-neutral | Free-mode comparison and test matrix | Launch the same minimal VST3/AU fixture under Free and licensed modes | Separate accounts/licenses; unassigned |
| Scan/cache/quarantine behavior | Scanner article documents locations/rescan only | Reliability and security architecture | Use valid, duplicate-ID, invalid, hanging, and crashing fixtures; record logs/cache/UI and rescan outcomes | Disposable VM; unassigned |
| Process isolation/architecture bridging | No public process-boundary documentation | Crash containment and platform migration | Observe child processes and deliberately crash a safe fixture; test native/translated architectures where licensed | Disposable macOS/Windows hosts; unassigned |
| Sidechain, multi-output, MIDI output, MPE/MIDI 2.0 | Instrument/FX docs omit bus/event contract | Full interoperability fidelity | Capability-coded VST3 fixtures exposing aux input, multiple output buses, MIDI out, note expression, and dynamic I/O | Custom lawful fixtures; unassigned |
| Latency/tails/offline render | Export and plugin docs omit reporting/compensation | Timing correctness and bounce parity | Impulse-aligned latency/tail fixture in live and offline exports at multiple buffers | Audio analysis harness; unassigned |
| Parameter identity/sample accuracy | Only custom-UI control and automation caveat documented | Automation durability | Fixture with stable IDs, renamed text, stepped/log ranges, dense automation, and save/reopen | Plugin fixture plus rendered comparison; unassigned |
| Plugin state/presets/missing plugin | Project article omits plugin state/dependencies | Project durability | Save state/assets, remove/upgrade/reinstall plugin, reopen, and inspect placeholders/recovery | Disposable copied projects; unassigned |
| Autosave/crash recovery/schema migration | Project article documents manual save/open only | Data loss and long-term compatibility | Crash during edits, inspect recovery; open projects across selected versions from archive | Versioned test VMs; unassigned |
| Collaboration/interchange | Project/export sources document archive and audio handoff only | Team workflow | Ask vendor for supported interchange/collaboration matrix before any binary probe | Vendor/public docs; unassigned |
| License activation/expiry/transfer | Pricing gives commercial modes but not operational terms | Offline reliability and procurement | Review current purchase/EULA/account terms with counsel; test expiry only with authorized account | Legal/procurement; unassigned |
| Accessibility/localization | No retained accessibility documentation | Inclusive product requirements | Vendor accessibility statement, then keyboard/screen-reader audit on disposable systems | Accessibility specialist; unassigned |

## 24. Curiosity pass and stop decision

### Bounded evidence passes

Each external pass retrieved at most two sources and was synthesized before the next:

| Pass | Sources/results | Synthesis-driven purpose |
| --- | --- | --- |
| 1 | S-001 + one 404 | Pin current version and headline workflow |
| 2 | S-002 + one 404 API route | Pin editions/licensing limits |
| 3 | Two untrusted support-search result pages | Discover canonical plugin/OS article URLs only |
| 4 | S-003, S-004 | Resolve formats/platforms; expose OS-image limitation |
| 5 | S-005, S-006 | Resolve scan controls and bound manual taxonomy |
| 6 | S-007, S-008 | Separate instrument/effect instantiation from full contract |
| 7 | S-009, S-010 | Map scene/song/persistence/export surfaces |
| 8 | S-011, S-012 | Resolve project collection and delivery boundaries |

### Final follow-up ranking

Scores are 1–5; higher relevance/value/novelty is better, while higher cost is worse.

| Candidate thread | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Controlled host-contract fixture suite | 5 | 5 | 5 | 4 | **Best next phase, not pursued:** documentary budget/authority exhausted |
| Plugin-state and missing-plugin runtime probe | 5 | 5 | 5 | 3 | **CURIOSITY_NO_GO now:** subset of best fixture suite; requires binary execution |
| Accessible OS matrix recovery | 3 | 3 | 2 | 2 | **CURIOSITY_NO_GO:** exact deployment detail, unlikely to change conceptual architecture |
| Additional deep-engine web search | 5 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** likely proprietary, nonpositive marginal documentary evidence |
| Community plugin compatibility anecdotes | 3 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** weak provenance without controlled reproduction |
| Collaboration feature search | 3 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** archive/stem handoff boundary already clear enough for wave 1 |
| Licensing-seat/expiry detail | 3 | 3 | 2 | 2 | **CURIOSITY_NO_GO:** procurement-specific; separate terms/legal workstream |

**Stop decision:** **STOP — COVERAGE ACHIEVED WITH EXPLICIT UNKNOWNS; DEPTH BUDGET EXHAUSTED.** All template sections and required format rows are populated; current workflow, editions, format names/bitness, scanning, instrument/effect placement, UI, project collection, and export are grounded in primary sources. Further manual pages are unlikely to establish proprietary process, latency, bus, or state semantics. The evidence is saturated for documentary architecture conclusions, while runtime qualification is not. Reopen only for a public engineering specification, accessible compatibility table, material vendor release, or authorized disposable fixture campaign.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created `research/daw-landscape/dossiers/serato-studio.md`; no other path was touched by this researcher.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See §0 and C-001/C-003/C-004/C-022/C-029/C-030.
- [x] **Every required dossier heading exists in order.** Sections 0–25 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive prose cites C-IDs; claims register contains classifications.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See §21–23.
- [x] **Every required plugin-format row is present.** See §11.1, including all 13 required rows.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** See §11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Labels and C-IDs are used throughout.
- [x] **Licensing and clean-room boundaries are explicit.** See §16 and C-019.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §19 and §24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary public research only; no product/plugin binary was downloaded or run.

**Owned-path check:** before writing, `git status --short` showed numerous pre-existing changes elsewhere and the entire `research/daw-landscape/` tree as untracked. Those changes were left untouched. No staging or commit was performed.

**Concise result:** complete primary-source dossier for Studio 2.5.0 with a full plugin-format matrix and explicit deep-host unknowns. **Unresolved blockers:** image-only OS matrix and proprietary/runtime-only plugin, engine, recovery, and accessibility behavior.
