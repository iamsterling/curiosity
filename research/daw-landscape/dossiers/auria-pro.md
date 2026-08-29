# Auria Pro DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** Auria Pro.
- **Canonical vendor:** WaveMachine Labs, Inc.
- **Researcher/session:** `ses_fb2729284ffcbqF5GynMGWUoF5`.
- **Owned path:** `research/daw-landscape/dossiers/auria-pro.md`.
- **Research date and evidence cutoff:** 2026-08-29 UTC.
- **Current public version:** 2.41, released 2026-08-27 according to Apple's lookup metadata; the App Store compatibility field requires iPadOS 12.0 or later. [C-001]
- **Edition boundary:** Auria Pro is in scope. The vendor's separate Auria/Auria LE lineage is historical context only; desktop DAWs, GarageBand, and unrelated WaveMachine Labs products are excluded. [C-002]
- **Platform boundary:** iPad only in the current public listing. macOS, Windows, Linux, Android, and web editions are not evidenced. [C-003]
- **Evidence posture:** documentary research only; no app, plugin, or binary was installed or executed. Vendor statements establish what is documented, not independently measured behavior.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. All required sections and format rows are covered, but the current host contract is incompletely documented. The vendor labels a July 2018 version-2.18 guide as “Current” while the shipping app is 2.41. [C-004]

## 1. Executive summary

Auria Pro is a maintained, touch-first iPad DAW with a conventional linear audio/MIDI project model, a substantial mixer, routing, automation, recording, editing, native instruments/effects, and AAF interchange. The current 2.41 release is unusually decision-relevant because its notes explicitly add separate-track routing for extra Audio Unit outputs and fix several latency-compensation, save-path, and plugin-related crashes. [C-001] [C-005] [C-006]

Its plugin-hosting headline is narrower than a desktop-format list: current official material documents **AudioUnit (generation unspecified)**, Inter-App Audio (IAA), Audiobus, MIDI-processing plugins, a vendor-curated in-app plugin channel, and Audio Unit multi-output routing. It does **not** distinguish AUv2 from AUv3. It also does not currently document discovery/scanning, validation, cache/blacklist behavior, process isolation, crash containment, parameter identity, state serialization, missing-plugin placeholders, or a complete sidechain/dynamic-I/O contract. Those points remain `UNKNOWN`, not inferred from the word “AudioUnit.” [C-007] [C-008] [C-009] [C-010]

The strongest transferable patterns are touch-oriented linear editing paired with a deep mixer, explicit source selection for plugin extra outputs, full-path delay compensation, freeze/bounce as mobile resource controls, and project snapshots/external backup. The largest liabilities as an architectural reference are stale documentation, an iPad-only platform boundary, and the lack of a public current plugin lifecycle/failure-isolation contract. [C-004] [C-005] [C-011] [C-012]

**Overall confidence:** high for product identity, current version/platform, advertised workflow, and 2.41 changes; medium for older feature-page details still repeated in the current App Store description; low for undocumented plugin internals and project-recovery semantics.

## 2. Product identity, history, and market position

- **DOCUMENTED:** Apple identifies the seller as WaveMachine Labs, Inc., bundle ID `com.wavemachinelabs.auriapro`, and the product as “Auria Pro - Music Production,” an iPad music app priced at USD 49.99 with in-app purchases. Version 2.41 was current at the cutoff. [C-001] [C-013]
- **DOCUMENTED:** The product was first released through this App Store record in 2015 and is described as a DAW designed from the ground up for iPad, oriented to mobile recording, mixing, MIDI production, and post-production/session exchange. [C-014]
- **DOCUMENTED:** The vendor distinguishes Auria Pro from Auria by adding MIDI sequencing, piano roll, Lyra, bundled synths, real-time quantizing/warping, flexible buses, direct outputs, and more aux sends. That comparison is on an undated/stale feature page and is retained as product-line history, not proof of 2.41 packaging. [C-002]
- **INFERENCE:** A release dated two days before the cutoff, with iPadOS 26 crash fixes, is strong maintenance evidence. It does not establish a future update policy or support term. [C-015]
- **UNKNOWN:** Current active-user count, commercial market share, support SLA, and whether non-Pro Auria editions remain independently purchasable were not established from retained primary evidence.

## 3. Workflow and conceptual model

- **DOCUMENTED:** The user-visible model is a linear project timeline containing audio and MIDI tracks, regions/parts, tempo and time-signature tracks, markers/locators, mixer channels, subgroups, auxes, and buses. The editor exposes cut, copy, paste, split, join, crossfade, duplicate, separate, gain, normalization, reversal, snapping, ripple edit, scrubbing, and multiple time rulers including bars/beats, samples, and SMPTE. [C-005] [C-016]
- **DOCUMENTED:** MIDI composition uses a touch piano roll, note velocity/controller editing, groove/quantize tools, MIDI processes, and tempo/meter editing; audio composition adds transient detection, slicing, real-time warp, groove extraction, quantization, and audio-transient-to-MIDI conversion. [C-017]
- **DOCUMENTED:** Mixing is channel-strip based with mono/stereo channels, insert slots, sends, subgroups, buses, direct outputs, automation, and portrait-mode long-throw faders. [C-011]
- **INFERENCE:** Auria Pro's mental model is closer to a compact desktop-style linear DAW translated to touch than to a scene launcher, tracker, or modular patcher. This follows from the documented timeline, track, mixer, and AAF model; a hidden modular engine remains a plausible proprietary implementation and is not claimed. [C-018]
- **UNKNOWN:** Scenes/session launching, tracker rows, notation-first objects, and a public modular graph are not documented in the retained current sources.

## 4. Publicly documented architecture

- **DOCUMENTED:** Public materials name a 64-bit double-precision floating-point mixing/summing engine, full delay compensation, Lyra disk streaming, and real-time audio warping using élastique Pro v3; these are component/capability statements rather than a process or module diagram. [C-019]
- **DOCUMENTED:** Current 2.41 notes show that the routing graph can expose an Audio Unit's extra outputs as selectable track inputs and can align tracks fed by buses or plugin outputs. [C-006]
- **UNKNOWN:** Process boundaries, audio-thread topology, worker scheduling, multicore policy, graph mutation protocol, memory model, plugin process placement, storage schema, database use, and service boundaries are proprietary or absent from accessible public documentation. [C-020]
- **INFERENCE:** Track/bus/plugin-output alignment implies a graph-level latency model spanning multiple source types. It does not reveal whether compensation is calculated statically, incrementally, or by which scheduler. [C-021]

## 5. Audio engine

- **DOCUMENTED:** Advertised session rates are 44.1, 48, and 96 kHz; recording is 24-bit; mixing is described as 64-bit double precision; compatible hardware can record up to 24 simultaneous tracks. [C-019] [C-022]
- **DOCUMENTED:** The vendor advertises full delay compensation across tracks, subgroups, buses, and aux sends, plus track freeze and bounce-in-place for CPU relief. [C-011] [C-012]
- **DOCUMENTED:** Version 2.41 fixes alignment for bus/plugin-output-fed tracks, updates compensation when an Audio Unit is bypassed, aligns the playhead with heard audio, fixes real-time quantize with latency-reporting plugins, fixes scrubbing with plugin latency, fixes a noise burst for large reported latency, and fixes a rare crash when latency changes during playback. [C-006] [C-023]
- **DOCUMENTED:** Audio warping uses élastique Pro v3; the App Store description also names ZTX for time stretching. [C-017]
- **INFERENCE:** Freeze/bounce is a deliberate mobile resource-control boundary and delay reporting is consumed from at least some plugins. The evidence does not prove correct compensation for every topology or sample-accurate automation. [C-012] [C-023]
- **UNKNOWN:** Buffer sizes, block adaptation, multicore scheduling, real-time priority, denormal handling, dropout recovery, engine restart behavior, offline-vs-real-time render equivalence, host oversampling, tail handling, and diagnostic meters/logs are not established. [C-024]

## 6. Tracks, timeline, clips, and editing

- **DOCUMENTED:** Current marketing describes unlimited audio and MIDI tracks, while simultaneous hardware recording is capped at up to 24 inputs with compatible interfaces. “Unlimited” is a logical product claim, not a measured device capacity. [C-005] [C-022]
- **DOCUMENTED:** Audio editing includes region operations, crossfades, gain/normalize/reverse, transient slicing, audio quantization, real-time warp, snapping, ripple edit, and scrubbing. Timeline rulers can show minutes/seconds, bars/beats, samples, or SMPTE. [C-016] [C-017]
- **DOCUMENTED:** Project templates and snapshots are advertised. [C-025]
- **UNKNOWN:** Take lanes, swipe comping, clip grouping semantics, edit-history depth, per-clip versioning, nested folders, and exact destructive/non-destructive boundaries are not current-evidenced. [C-026]

## 7. MIDI, sequencing, notation, and expression

- **DOCUMENTED:** Auria Pro provides MIDI recording from external keyboards and CoreMIDI virtual instruments, a piano roll, note/controller editing, tempo/meter tracks, real-time quantize and other MIDI parameters, groove extraction, and a set of MIDI processing operations. [C-017]
- **DOCUMENTED:** Synchronization/control claims include MIDI Time Code chase, MIDI Clock, MMC, and remote control using Mackie MCU and HUI protocols. The App Store also says hosted AudioUnit/IAA support includes MIDI-processing plugins. [C-007] [C-027]
- **UNKNOWN:** Staff notation, MPE/per-note expression, MIDI 2.0/UMP, SysEx recording, articulation maps, plugin note-expression mapping, sample-accurate MIDI delivery, and generator APIs are not established. [C-028]

## 8. Routing, mixer, automation, and control

- **DOCUMENTED:** The documented mixer has eight assignable subgroups, six aux sends, up to 32 buses with multiple destinations, direct outputs, four inserts per channel/subgroup in the vendor feature description, adjustable pan laws, and mono/stereo tracks. [C-011]
- **DOCUMENTED:** Full automation is advertised for channel controls and plugins; the historical Auria 2.0 plugin guide shows host automation lanes selecting named plugin parameters and drawing curves. That guide cannot establish unchanged 2.41 parameter semantics. [C-008] [C-029]
- **DOCUMENTED:** Historical in-app plugins expose internal/external sidechain controls in selected devices, and the broad feature page advertises plugin sidechain support. The current 2.41 release notes do not define AU sidechain topology. [C-030]
- **DOCUMENTED:** Mackie MCU and HUI remote control are advertised. [C-027]
- **UNKNOWN:** VCA/folder behavior, feedback-loop rules, surround/immersive layouts, OSC, EuCon, public remote APIs, control-surface discovery, automation interpolation, write modes, and sample accuracy are not established. [C-031]

## 9. Recording, comping, and media handling

- **DOCUMENTED:** Auria Pro advertises up to 24 simultaneous 24-bit inputs with compatible audio interfaces, input selection, effect/no-effect monitoring, auto-punch, sample-rate conversion, and sample-accurate looping. [C-022]
- **DOCUMENTED:** AAF import/export is intended to transfer sessions to/from Logic, Pro Tools, Nuendo, Samplitude, Digital Performer, and other DAWs. External iOS-compatible storage can be used for project backup/restore. [C-025] [C-032]
- **DOCUMENTED:** Version 2.41 fixes the placement of recordings made through a subgroup. [C-023]
- **UNKNOWN:** Take-lane comping, loop-take policy, broadcast metadata, proxy media, asset relinking UX, conform, destructive recording modes, and current supported audio-file codecs beyond the feature page's WAV/M4A output examples are not established. [C-026]

## 10. Instruments, effects, content, and native devices

- **DOCUMENTED:** Bundled devices include Lyra (disk-streaming SFZ/EXS/SF2 sample playback), FabFilter Twin2 and One synthesizers, PSP-derived channel/master processing, convolution and algorithmic reverbs, stereo delay, and stereo chorus. [C-019] [C-033]
- **DOCUMENTED:** A historical Auria 2.0 optional-plugin guide lists vendor-integrated effects from WaveMachine Labs, PSPaudioware, FabFilter, Mu Technologies, Overloud, Positive Grid, FXpansion, and Sugar Bytes. It shows custom touch UIs, presets, bypass, automation, and in some devices MIDI Learn or sidechains. This is historical ecosystem evidence only, not a current catalog. [C-008] [C-029] [C-030]
- **UNKNOWN:** Which historical optional plugins remain purchasable, binary-compatible, supported, or restorable in 2.41 is not documented by a current official catalog. [C-034]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` in desktop columns means no Auria Pro edition exists there in retained official evidence; it does not make a claim about the format itself. `UNKNOWN` in the mobile column means the required specific format/generation was not named by current evidence.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | UNKNOWN: not named for iPad; web not applicable | Current 2.41 listing names AU/IAA only | No inference from absence | C-003, C-010; S-002, S-004 |
| VST3 | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | UNKNOWN: not named for iPad; web not applicable | Current 2.41 listing names AU/IAA only | No inference from absence | C-003, C-010; S-002, S-004 |
| AUv2 | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | UNKNOWN: “AudioUnit (AU)” is documented, but generation is not | 2.41 supports Audio Units and extra outputs | Do not equate generic AU with AUv2 | C-007, C-009; S-002, S-004 |
| AUv3 | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | UNKNOWN: “AudioUnit (AU)” is documented, but generation is not | 2.41 supports Audio Units and extra outputs | Likely contemporary iPad relevance is not proof | C-007, C-009; S-002, S-004 |
| AAX | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | UNKNOWN: not named for iPad; web not applicable | No current official Auria claim found | AAF interchange is not AAX hosting | C-010, C-032; S-002 |
| CLAP | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | UNKNOWN: not named for iPad; web not applicable | No current official Auria claim found | No inference from absence | C-010; S-002, S-004 |
| LV2 | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | UNKNOWN: not named for iPad; web not applicable | No current official Auria claim found | No inference from absence | C-010; S-002, S-004 |
| LADSPA | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | UNKNOWN: not named for iPad; web not applicable | No current official Auria claim found | No inference from absence | C-010; S-002, S-004 |
| DSSI | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | UNKNOWN: not named for iPad; web not applicable | No current official Auria claim found | No inference from absence | C-010; S-002, S-004 |
| JSFX | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | UNKNOWN: not named for iPad; web not applicable | No current official Auria claim found | No inference from absence | C-010; S-002, S-004 |
| DirectX/DXi | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | UNKNOWN: not named for iPad; web not applicable | No current official Auria claim found | No inference from absence | C-010; S-002, S-004 |
| Rack Extension | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | UNKNOWN: not named for iPad; web not applicable | No current official Auria claim found | No inference from absence | C-010; S-002, S-004 |
| Product-native/other | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | NOT_APPLICABLE: no Linux edition | DOCUMENTED: IAA, Audiobus, and vendor-curated optional in-app plugins on iPad; web not applicable | Current App Store description plus historical Auria 2.0 plugin guide | Current in-app catalog and IAA lifecycle status remain unknown | C-007, C-008, C-034; S-002, S-005 |

### 11.2 Discovery, scanning, validation, and recovery

- **DOCUMENTED:** Current material says AudioUnit and IAA plugins, including MIDI-processing plugins, can be hosted; historical screenshots show plugins selected from an insert menu. [C-007] [C-029]
- **UNKNOWN:** Audio Unit discovery paths, initial scan timing, validation, cache, duplicate identity, blacklist/quarantine, manual rescan, version replacement, diagnostics, and behavior after a failed scan are not described by retained current official sources. [C-009]
- **UNKNOWN:** Current 2.41 behavior when an AU binary disappears, changes identity, fails validation, or becomes incompatible is not documented. [C-035]
- **Negative result:** Neither the current App Store record/release notes nor the official support page named a scan, validation, cache, quarantine, or rescan mechanism. The inaccessible 2.18 manual was not repeatedly retried after the documented extraction limit.

### 11.3 Runtime isolation and compatibility

- **UNKNOWN:** In-process versus separate-process execution, extension sandbox boundaries, per-plugin process policy, crash containment, architecture bridging, code-signing enforcement, memory caps, compatibility modes, and plugin watchdog behavior are not publicly documented for Auria Pro 2.41. [C-009]
- **DOCUMENTED:** Version 2.41 fixed host crashes involving latency changes and iPadOS 26, and fixed a Drumagog crash when kit files are missing. These fixes establish failure cases, not isolation or containment. [C-023]
- **INFERENCE:** Because a plugin-related failure could crash Auria in the documented cases, one cannot cite Auria as evidence for per-plugin crash isolation. The crash could also have originated in host integration code; process placement remains unknown. [C-036]

### 11.4 Host/plugin processing contract

- **DOCUMENTED:** Auria hosts effects and instruments/MIDI processors under its generic AudioUnit/IAA claim. Version 2.41 exposes extra Audio Unit outputs in a track's input menu under “Plug-in Outputs” and automatically configures the routing. [C-006] [C-007]
- **DOCUMENTED:** The host uses plugin-reported latency in real-time quantize and delay compensation; bypassing an Audio Unit now updates compensation immediately. Historical integrated plugins document internal/external sidechains and host-tempo synchronization for selected devices. [C-023] [C-030]
- **UNKNOWN:** Audio/event bus negotiation, maximum buses/channels, dynamic I/O changes, sidechains specifically for Audio Units, instruments versus MIDI effects categorization, MPE/MIDI 2.0, sample-accurate automation, tail reporting, suspend/sleep, offline render, and headless operation remain undocumented. [C-010]
- **INFERENCE:** 2.41 demonstrates a user-visible source-routing abstraction for multiple plugin outputs. It does not prove arbitrary layouts or dynamic bus changes. [C-037]

### 11.5 Parameters, automation, state, presets, and project recall

- **DOCUMENTED (historical scope):** Auria 2.0's optional-plugin guide shows named plugin parameters in host automation lanes, plugin-provided preset browsers, bypass controls, custom UIs, saved user presets, and MIDI Learn for selected integrated plugins. Some plugin display/analyzer settings are described as saved in songs. [C-008] [C-029]
- **DOCUMENTED (current limited scope):** The current listing advertises full automation, and 2.41 fixes “Restore Purchases” falsely reporting success. [C-013] [C-029]
- **UNKNOWN:** 2.41 AU parameter identity/range/text rules, gestures, automation precision, state chunk/property-list storage, preset interchange, asset reference policy, migration across plugin versions, missing-plugin placeholders, state restoration ordering, and whether bypass/state are host- or plugin-owned are not documented. [C-035]
- **UNKNOWN:** The current availability and license restoration behavior of each historical in-app plugin is not established by the generic “in-app purchase” statement or the Restore Purchases bug fix. [C-034]

### 11.6 UI, diagnostics, and failure modes

- **DOCUMENTED (historical scope):** Integrated Auria 2.0 plugins used embedded custom touch UIs; several documented plugins supported full-screen or size modes, host automation, preset menus, bypass, and plugin-specific help. [C-008]
- **DOCUMENTED (current):** Version 2.41 fixed iPadOS 26 crashes, a missing-Drumagog-kit crash, a latency-change crash, incorrect save behavior after a project folder moved/deleted, and noise/scrub/alignment issues associated with plugin latency. [C-023] [C-038]
- **UNKNOWN:** Current AU UI embedding versus detachment, resize negotiation, scaling, keyboard/focus handling, generic editor fallback, headless render, per-plugin logs, crash reports, disabled-plugin UX, and user-facing failure diagnostics are not documented. [C-035]

## 12. Extensibility and integration

- **DOCUMENTED:** Integration boundaries include AudioUnit (generation unspecified), IAA, Audiobus, CoreMIDI virtual MIDI, MCU/HUI control, MTC/MIDI Clock/MMC, AAF exchange, and external storage/project sharing. [C-007] [C-027] [C-032]
- **DOCUMENTED:** The historical in-app ecosystem shows a vendor-porting/curation model in which third-party DSP was integrated into Auria and sold through in-app purchase. [C-008]
- **UNKNOWN:** Public scripting, macros/actions API, extension SDK, device-authoring SDK, OSC, remote app protocol, command registry, and API stability/versioning are not established. [C-031]
- **INFERENCE:** Auria's public extension model is product/platform integration rather than a documented general-purpose scripting surface. Lack of public evidence is not proof that no private partner SDK exists. [C-039]

## 13. Project format, persistence, interoperability, and collaboration

- **DOCUMENTED:** Project templates, project snapshots, external-drive project backup/restore, “Save Project to other App,” and AAF import/export are advertised. [C-025] [C-032]
- **DOCUMENTED:** Version 2.41 fixes a condition in which Auria could stop saving permanently after its project folder was moved or deleted. This proves folder-path sensitivity and a repaired failure, not a complete recovery protocol. [C-038]
- **UNKNOWN:** Project representation/schema, atomic-save design, autosave frequency, crash recovery, undo persistence, backward/forward compatibility, migrations, media relinking, collect/archive behavior, missing-plugin placeholders, cloud collaboration, version control, conflict handling, and encryption are not documented for 2.41. [C-040]
- **INFERENCE:** Snapshots plus external backup are a useful explicit durability boundary on mobile, but should not be mistaken for transactional recovery or collaborative versioning. [C-041]

## 14. Delivery, live, post-production, and specialized workflows

- **DOCUMENTED:** Auria advertises mixdown/export, AAF exchange, SMPTE timeline display, MTC chase, and an optional video import/export feature with sample-accurate project synchronization and adjustable offset. [C-032] [C-042]
- **DOCUMENTED:** Portrait-mode 100 mm faders, auto-punch, multichannel recording, and MCU/HUI control support recording/mixing workflows. [C-022] [C-027]
- **UNKNOWN:** ADM, Dolby Atmos/immersive mixing, surround buses, DDP, batch export, integrated loudness delivery, ADR lists, show control, live scene launching, and current video codec limits are not established. [C-043]

## 15. Performance, reliability, security, and accessibility

- **DOCUMENTED:** The product advertises unlimited tracks, but only the 24-input recording limit is concrete; actual playback/plugin capacity is device- and project-dependent and was not benchmarked. Freeze/bounce is the documented resource-control tool. [C-012] [C-022]
- **DOCUMENTED:** The 2.41 notes contain multiple stability, timing, noise, save-path, and plugin-latency fixes, including iPadOS 26 crash fixes. [C-023] [C-038]
- **DOCUMENTED:** Apple's privacy panel reports that the developer says the app does not collect data. Apple's accessibility panel says the developer has not yet indicated supported accessibility features. These are disclosure fields, not independent audits. [C-044]
- **UNKNOWN:** Plugin sandbox/security boundaries, code-signing/notarization checks, telemetry implementation, vulnerability handling, rollback, deterministic recovery, localization beyond English, VoiceOver behavior, keyboard-only operation, and tested hardware scaling on current devices are not established. [C-045]
- **Negative result:** The vendor support page's hardware FAQ refers to first/second/third-generation iPads and 30-pin accessories; it was rejected as evidence for current limits. [C-004]

## 16. Licensing, ecosystem, and implementation constraints

- **DOCUMENTED:** Auria Pro is a paid App Store product (USD 49.99 at cutoff) with in-app purchases. The current listing says third-party plugins are available through in-app purchase and includes a Restore Purchases fix in 2.41. [C-013]
- **DOCUMENTED:** The historical plugin guide states that covered software is furnished under license and may be used or copied only under that agreement; it also recognizes third-party trademarks. It grants no implementation, source-copying, SDK, redistribution, or certification rights. [C-046]
- **UNKNOWN:** Full current Auria EULA terms, plugin-vendor revenue/porting agreements, current catalog licenses, Audio Unit implementation entitlements, and redistribution/certification obligations were not established. [C-047]
- **Clean-room constraint:** Product behavior and interaction patterns may inform independent requirements, but protected manuals, UI assets, DSP implementations, brand names, and proprietary code must not be copied. Naming AU, AAF, MCU, HUI, or other formats/protocols does not grant SDK, trademark, redistribution, compatibility, or certification rights. [C-046] [C-047]

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED:** Deep linear audio/MIDI editing, flexible bus/subgroup/aux routing, automation, multichannel recording, AAF, and touch-first mixing form a broad mobile DAW model. [C-005] [C-011] [C-017] [C-032]
- **DOCUMENTED:** 2.41's “Plug-in Outputs” source menu is a concrete, user-visible multi-output routing pattern, while full-path delay compensation and freeze/bounce address heterogeneous plugin latency and mobile CPU constraints. [C-006] [C-012]
- **DOCUMENTED:** Templates, snapshots, and external backup expose explicit project reuse and durability actions. [C-025]

### Liabilities

- **DOCUMENTED:** The official “current” manual is eight years and 23 minor-version steps behind the app at cutoff; even vendor web requirements conflict with current App Store compatibility metadata. [C-004] [C-048]
- **UNKNOWN:** The lifecycle from discovery through validation, isolation, state recall, missing-plugin recovery, and diagnostics is not publicly specified for 2.41. [C-009] [C-035]
- **DOCUMENTED/INFERENCE:** Current release notes show plugin latency, missing assets, crashes, moved folders, and routing as active reliability concerns. Fixes are positive maintenance evidence but also argue for adversarial tests before treating the host contract as robust. [C-023] [C-038]

### Architecture lesson

Auria Pro is a useful reference for **mobile workflow decomposition and user-visible routing**, but not for undocumented internals or plugin sandbox design. Current release notes are more trustworthy than stale broad feature pages for changed behavior, and a new DAW should version its host contract and recovery semantics independently of marketing copy. [C-004] [C-006] [C-020]

## 18. Transferable patterns

| Pattern | Problem and minimal mechanism | Supporting claims | Prerequisites and tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Plugin outputs as track input sources | Extra plugin buses are hard to discover. Add a labeled source group to track input selection and create routing on choice. | C-006, C-037 | Stable bus identity, cycle checks, latency graph updates; menus can become crowded. | Medium: dynamic I/O and migration remain unsolved. | CANDIDATE |
| Full-path latency compensation | Tracks sourced from buses/plugin outputs must align. Propagate reported latency through the routing graph and refresh on bypass/change. | C-006, C-021, C-023 | Reliable plugin reports, graph invalidation, transport/UI offset policy. | High: malformed/changing reports require containment. | CONDITIONAL |
| Freeze and bounce-in-place | Mobile CPU/memory limits make live plugin graphs expensive. Render a reversible cached representation and retain source state. | C-012 | Cache invalidation, asset lifecycle, deterministic rendering, clear unfreeze semantics. | Medium. | CANDIDATE |
| Touch linear editor plus console-depth mixer | Mobile simplicity can erase professional routing. Keep timeline gestures simple while exposing channel strips, sends, buses, and portrait faders. | C-005, C-011, C-016 | Responsive layout, accessibility, undoable gestures, discoverability. | Medium; avoid copying protected UI expression. | CONDITIONAL |
| Templates, snapshots, external backup | Mobile projects need explicit checkpoints and portable copies. Separate reusable templates, lightweight snapshots, and complete external archives. | C-025, C-041 | Atomic saves, asset collection, schema migration, storage-provider failures. | Low concept risk; current Auria semantics are incomplete. | CANDIDATE |
| Host automation plus plugin-native touch UI | Deep plugins need expressive UI while host automation remains findable. Surface stable named parameters in host lanes without replacing custom UI. | C-008, C-029 | Stable parameter IDs, normalized/text mapping, gesture arbitration, scaling. | High until the parameter/state contract is specified. | CONDITIONAL |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Rejected mechanism:** Treating a generic “AudioUnit” claim as AUv2 or AUv3 support. Evidence does not name the generation. Reopen only with version-scoped vendor or platform metadata identifying component type. [C-009]
- **Rejected mechanism:** Treating AAF import/export as AAX hosting. AAF is session interchange; no AAX host claim was found. [C-032]
- **Rejected mechanism:** Inferring plugin sandboxing from iPad platform security. Auria's process placement and crash containment are unknown, and 2.41 documents plugin-related crash fixes. [C-036]
- **Rejected mechanism:** Using the stale support hardware table for current scaling limits. It concerns first- through third-generation iPads and obsolete connectors. [C-004]
- **CURIOSITY_NO_GO — community forum archaeology:** potentially useful for failure anecdotes, but low authority and likely to mix versions; dynamic qualification is the safer discriminator.
- **CURIOSITY_NO_GO — current in-app plugin inventory:** moderate product interest but low architecture novelty; the generic channel is established and catalog churn would not resolve the host contract. [C-034]
- **CURIOSITY_NO_GO — repeated PDF extraction attempts:** the 25 MB 2.18 guide exceeded the available reader's ingestion limit and local text-extraction utilities/modules were unavailable. Repeated retries would add cost without fixing its stale version scope.
- **CURIOSITY_NO_GO — broad current hardware compatibility crawl:** vendor material is stale and device compatibility is not the leading architecture decision.
- **CURIOSITY_NO_GO — unauthorized binary inspection or plugin installation:** outside the documentary, clean-room, and host-safety boundary.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and result | Status | Later discriminating probe |
| --- | --- | --- | --- |
| H1: Auria Pro 2.41 specifically hosts AUv3. | Searched current App Store description/release notes and official support page. They say AudioUnit/AU but never AUv3. | NOT ESTABLISHED; C-009 | On a disposable current iPad, install signed known AUv3 effect/instrument/MIDI fixtures and record discovery/instantiation/state recall. |
| H2: A format mention proves scanning and instantiation. | Current evidence names AU/IAA but does not document scanning, validation, or failure UX. | FALSIFIED as an evidentiary shortcut; C-009 | Test fresh install, duplicate identity, invalid signature, crash-on-init, rescan, and quarantine fixtures. |
| H3: Multi-output Audio Units can route separate outputs to tracks. | 2.41 release notes explicitly describe “Plug-in Outputs” in track input menus and automatic setup. | DOCUMENTED; C-006 | Test mono/stereo/asymmetric layouts, dynamic bus changes, reopen, freeze, and offline render. |
| H4: Plugin delay compensation spans plugin-output and bus-fed tracks. | 2.41 explicitly says those paths now align and bypass refreshes compensation. | DOCUMENTED vendor claim; C-023 | Measure impulse alignment across nested buses, large/changing/invalid latency, live input, bypass, render, and scrubbing. |
| H5: Every hosted plugin has complete state/preset recall. | Historical integrated plugins describe presets/song-saved settings, but no current generic AU state contract or missing-plugin behavior was found. | NOT ESTABLISHED; C-035 | Save/reopen after plugin update/removal, changed assets, renamed presets, moved project, and OS upgrade. |
| H6: Plugin crashes are isolated from the host. | 2.41 notes include plugin-related host crash fixes; no process-isolation claim exists. | NOT ESTABLISHED and counterevidence-sensitive; C-036 | Crash/timeout/memory-abuse fixtures with host survival and audio-continuity recording. |
| H7: Project snapshots equal crash recovery. | Snapshots are advertised; autosave/transaction/recovery semantics are absent, and a moved/deleted folder previously could stop saving. | FALSIFIED as an equivalence; C-038, C-041 | Interrupt save, exhaust storage, revoke provider, move/delete folder, and recover on next launch. |

The acceptance ladder for any later plugin test must separately record: **format recognized → component discovered → validation passed → instance created → audio/MIDI processed → UI usable → automation stable → state restored → failure contained**. No documentary format logo collapses these stages. [C-009] [C-035]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Auria Pro 2.41 was released 2026-08-27; current compatibility is iPadOS 12+. | Current US App Store at cutoff | S-002, S-004 | Apple storefront and lookup metadata agree. | Description boilerplate still says iOS 7/iPad 4. |
| C-002 | DOCUMENTED | Medium | Auria Pro is the Pro edition in an Auria family and historically differs by MIDI/warp/routing features. | Vendor feature page, undated/stale | S-001 | Vendor comparison table. | Current availability of non-Pro editions is unknown. |
| C-003 | DOCUMENTED | High | Current Auria Pro is an iPad app; no desktop/web edition is evidenced. | 2.41 | S-002, S-004 | Platform and supported-device metadata. | Does not prove no private/unlisted build exists. |
| C-004 | DOCUMENTED | High | Official support calls a July 2018 v2.18 guide “Current,” far behind 2.41; support hardware material is stale. | Documentation provenance | S-003, S-004 | Explicit guide date/version and current app metadata. | Manual content may still partly apply. |
| C-005 | DOCUMENTED | High | Auria Pro has unlimited audio/MIDI tracks and a linear touch editing/mixing workflow. | Current description plus vendor page | S-001, S-002, S-004 | Repeated primary descriptions. | “Unlimited” is not a measured capacity. |
| C-006 | DOCUMENTED | High | 2.41 routes extra AU outputs to separate tracks through a “Plug-in Outputs” input group and fixes alignment. | 2.41 | S-002, S-004 | Explicit release notes. | Layout limits and dynamic changes unknown. |
| C-007 | DOCUMENTED | High | Current listing claims AudioUnit/IAA hosting, including MIDI-processing plugins, plus Audiobus. | Current listing | S-002, S-004 | Explicit description. | AU generation unspecified; IAA lifecycle/current fixture behavior untested. |
| C-008 | DOCUMENTED | High for history | Auria 2.0 had a curated in-app plugin ecosystem with integrated UIs, presets, automation, MIDI Learn, and selected sidechains. | Historical Auria 2.0 | S-005 | Guide cover, TOC, pp. 24, 29–30, 36, 42, 75, 178, 181–185, 203–215. | Cannot be projected wholesale to 2.41. |
| C-009 | UNKNOWN | High | AUv2/AUv3 generation and discovery/validation/isolation behavior are not established. | 2.41 | S-002, S-003, S-004, S-006 | Current sources use generic AU; stale manual inaccessible. | Safe dynamic fixture or versioned host docs could resolve. |
| C-010 | UNKNOWN | High | No complete current host contract exists for buses, expression, automation accuracy, tails, dynamic I/O, or non-AU formats. | 2.41 | S-002, S-003, S-004 | Negative result in retained current sources. | Absence is not unsupported status. |
| C-011 | DOCUMENTED | Medium-High | Mixer supports subgroups, auxes, buses, direct outs, inserts, automation, and delay compensation. | Current description; feature page | S-001, S-002, S-004 | Repeated feature claims. | Exact limits beyond repeated fields may be stale. |
| C-012 | DOCUMENTED | High | Track freeze and bounce-in-place are CPU/resource controls. | Current description and vendor page | S-001, S-002, S-004 | Explicit feature claims. | Cache/state semantics unknown. |
| C-013 | DOCUMENTED | High | Price is USD 49.99 with IAP; 2.41 fixed false-success Restore Purchases. | Current US storefront | S-002, S-004 | Store metadata/release notes. | Regional price/terms and current plugin catalog differ. |
| C-014 | DOCUMENTED | High | App Store record dates initial release to 2015 and describes a ground-up iPad DAW. | Product history | S-002, S-004 | Apple metadata/vendor description. | Marketing phrase does not reveal internals. |
| C-015 | INFERENCE | High | A 2026-08-27 release with iPadOS 26 fixes is strong current-maintenance evidence. | Cutoff | S-004 | Temporal inference from release date/content. | No future support promise. |
| C-016 | DOCUMENTED | Medium | Editor includes region operations, snapping, ripple edit, scrubbing, and SMPTE/sample/bar rulers. | Vendor feature page | S-001 | Detailed feature list. | Page is stale/undated; current continuity untested. |
| C-017 | DOCUMENTED | High | MIDI sequencing and real-time audio warp/quantize/transient workflows are core features. | Current description | S-001, S-002, S-004 | Repeated current storefront and vendor claims. | Algorithmic details proprietary. |
| C-018 | INFERENCE | High | Product mental model is desktop-style linear DAW adapted to touch, not a documented launcher/tracker/modular system. | User-visible workflow | S-001, S-002 | Derived from tracks/timeline/mixer/AAF. | Hidden internal graph not excluded. |
| C-019 | DOCUMENTED | Medium-High | Public component claims include 64-bit double-precision mixing, stated sample rates, Lyra disk streaming, and élastique warp. | Current description/vendor page | S-001, S-002, S-004 | Repeated claims. | Vendor claims are not measurements. |
| C-020 | UNKNOWN | High | Internal process/thread/graph/storage architecture is not publicly documented. | 2.41 | S-001–S-006 | No accessible primary architecture disclosure. | A future engineering source could resolve. |
| C-021 | INFERENCE | Medium | Alignment across track, bus, and plugin-output paths implies a graph-spanning latency model. | 2.41 | S-004 | Bounded interpretation of fixes. | Calculation/scheduler design unknown. |
| C-022 | DOCUMENTED | High | Up to 24 simultaneous 24-bit recording tracks are advertised with compatible hardware. | Current description | S-001, S-002, S-004 | Repeated claim. | Device/interface conditions and modern USB topology not current-detailed. |
| C-023 | DOCUMENTED | High | 2.41 fixes multiple latency, timing, noise, subgroup-recording, and crash defects. | 2.41 | S-002, S-004 | Explicit release notes. | A fix is not universal correctness proof. |
| C-024 | UNKNOWN | High | Buffering, multicore, dropout, offline equivalence, tails, and engine diagnostics are not established. | 2.41 | S-001–S-006 | Negative result. | Dynamic benchmarks needed. |
| C-025 | DOCUMENTED | Medium-High | Project templates, snapshots, and external-storage backup are advertised. | Current description/vendor page | S-001, S-002, S-004 | Repeated claims. | Snapshot/archive semantics unknown. |
| C-026 | UNKNOWN | High | Take/comping/versioning and exact destructive-edit semantics are not current-evidenced. | 2.41 | S-001–S-006 | Gap retained. | Readable current manual or probe needed. |
| C-027 | DOCUMENTED | High | MTC, MIDI Clock, MMC, Mackie MCU, and HUI are advertised. | Current description | S-001, S-002, S-004 | Repeated claim. | Coverage/mapping details unknown. |
| C-028 | UNKNOWN | High | Notation, MPE, MIDI 2.0, SysEx, articulation maps, and sample-accurate MIDI are not established. | 2.41 | S-001–S-006 | Negative result. | Targeted fixture/documentation needed. |
| C-029 | DOCUMENTED | Medium-High | Host/plugin automation and named parameters are documented historically; current listing broadly claims full automation. | Current broad claim; detailed Auria 2.0 history | S-002, S-004, S-005 | Current headline triangulated with historical detail. | Current parameter identity/accuracy unknown. |
| C-030 | DOCUMENTED | Medium for history | Plugin sidechains are advertised and selected integrated Auria 2.0 devices expose external sidechain controls. | Historical/detail plus broad feature page | S-001, S-005 | Feature list; pp. 36, 75, 178. | Generic AU sidechain contract in 2.41 unknown. |
| C-031 | UNKNOWN | High | VCA/folders, surround, OSC, public remote API, and automation interpolation are not established. | 2.41 | S-001–S-006 | Negative result. | Current manual or probe required. |
| C-032 | DOCUMENTED | High | AAF import/export and SMPTE-oriented session exchange are advertised. | Current description | S-001, S-002, S-004 | Repeated claims. | Round-trip fidelity and unsupported metadata unknown. |
| C-033 | DOCUMENTED | High | Bundled sampler, synth, channel/master, delay/chorus/reverb devices are advertised. | Current description | S-001, S-002, S-004 | Repeated inventory. | Exact current versions/content not enumerated. |
| C-034 | UNKNOWN | High | Current availability/support of historical in-app plugins is not established. | 2.41 | S-002, S-003, S-005 | Current generic IAP claim versus 2015 guide. | Live store/account check could resolve but is out of wave. |
| C-035 | UNKNOWN | High | Generic AU parameter/state/missing-plugin/UI/diagnostic behavior is not documented for 2.41. | 2.41 | S-002, S-003, S-004, S-006 | Current source gap and inaccessible stale guide. | Disposable fixture suite is next probe. |
| C-036 | INFERENCE | Medium | Plugin-related host crash fixes do not support a claim of per-plugin crash isolation. | 2.41 | S-004 | Adversarial reading of release notes. | Crash origin/process placement unknown. |
| C-037 | INFERENCE | High | “Plug-in Outputs” is a useful user-visible abstraction, but arbitrary/dynamic layouts are unproven. | 2.41 | S-004 | Bounded from explicit release note. | Dynamic I/O probe required. |
| C-038 | DOCUMENTED | High | 2.41 repairs permanent save stoppage after project folder move/delete and other plugin-related failures. | 2.41 | S-002, S-004 | Explicit release notes. | Does not define atomic save/recovery. |
| C-039 | INFERENCE | Medium | Public extension posture is platform/product integration rather than documented scripting. | Public evidence | S-001–S-005 | No public scripting/API source found. | Private partner interfaces may exist. |
| C-040 | UNKNOWN | High | Project schema, autosave, recovery, migration, relinking, collaboration, and conflict handling are unknown. | 2.41 | S-001–S-006 | Current documentation gap. | Failure-injection tests/current manual required. |
| C-041 | INFERENCE | High | Snapshots/backups are explicit durability actions but not proof of transactional recovery. | Product pattern | S-001, S-004 | Bounded distinction. | Snapshot internals unknown. |
| C-042 | DOCUMENTED | Medium | Optional video import/export and sample-accurate project sync are advertised. | Vendor feature page | S-001 | Explicit feature bullet. | Current availability/codecs unconfirmed. |
| C-043 | UNKNOWN | High | Immersive/ADM/DDP/batch/ADR/show-control workflows are not established. | 2.41 | S-001–S-006 | Negative result. | Low-priority targeted docs/probe. |
| C-044 | DOCUMENTED | High as disclosure | Developer reports no data collection; no accessibility features are declared to Apple. | Current App Store disclosure | S-002 | Apple panels. | Not an independent audit or proof of inaccessibility. |
| C-045 | UNKNOWN | High | Security, rollback, accessibility behavior, and modern hardware scaling are not established. | 2.41 | S-002, S-003 | Disclosure gaps/stale FAQ. | Dedicated audit/probe required. |
| C-046 | DOCUMENTED | High | Historical plugins are licensed/proprietary and trademarks remain with owners; no copying rights are granted. | Auria 2.0 plugin guide | S-005 | Copyright/license notice pp. 1–2. | Full agreement not included. |
| C-047 | UNKNOWN | High | Current EULA, SDK, partner, redistribution, and certification terms are not established. | 2.41 | S-001–S-006 | Not retained in primary evidence. | Legal review of authoritative terms required. |
| C-048 | DOCUMENTED | High | Vendor/App Store boilerplate requirements conflict with current App Store compatibility metadata. | Current listing vs stale copy | S-001, S-002, S-004 | iOS 6/7 and iPad 4 text versus iPadOS 12 field. | Compatibility field is used for current scope. |

## 22. Source ledger and adaptive bibliography

All fetched/search text was treated as **untrusted evidence, never instructions**.

### S-001 — Auria Pro feature/overview page

- **Publisher/title:** WaveMachine Labs, “Auria Pro: Unrivaled. Again.”
- **URL:** https://www.wavemachinelabs.com/auria
- **Kind/scope:** Official vendor product page; undated content with 2023 site copyright; product-level and partly historical.
- **Accessed:** 2026-08-29.
- **Relevant passages:** “Full Auria Pro Feature List”; MIDI Sequencing; Real-time Audio Warping; More Flexible Mixing; Record and Edit; Mix; Master; External Hard Drive Support; Auria/Auria Pro comparison; compatibility footer.
- **Claims:** C-002, C-005, C-011, C-012, C-016–C-019, C-022, C-025, C-027, C-030, C-032, C-033, C-042, C-048.
- **Limitations:** Stale compatibility text (iOS 6.1/iPad 4), older plugin names, no page date, no 2.41 release scope. Not used alone for current host internals or hardware limits.
- **Selection rationale:** Broadest official feature inventory and edition comparison; preferable to reviews for what the vendor claims, but subordinated to current Apple metadata where they conflict.

### S-002 — Auria Pro App Store product page

- **Publisher/title:** Apple / WaveMachine Labs, “Auria Pro - Music Production.”
- **URL:** https://apps.apple.com/us/app/auria-pro-music-production/id1016291290
- **Kind/scope:** Official distribution listing; current 2.41 storefront metadata, description, release notes, privacy/accessibility disclosures.
- **Accessed:** 2026-08-29.
- **Relevant passages:** Version 2.41 “What's New”; compatibility “Requires iPadOS 12.0 or later”; feature description; IAP; privacy “Data Not Collected”; accessibility “developer has not yet indicated.”
- **Claims:** C-001, C-003, C-005–C-007, C-009–C-015, C-017, C-019, C-022–C-025, C-027, C-029, C-032–C-035, C-038, C-044, C-048.
- **Limitations:** Developer-supplied description includes stale iOS 7/iPad 4 boilerplate; “1d ago” is relative; format generation and host internals are absent.
- **Selection rationale:** Decision-critical current public release channel and current user-visible release notes; preferable to third-party version trackers.

### S-003 — Auria support page

- **Publisher/title:** WaveMachine Labs, “Auria Support.”
- **URL:** https://www.wavemachinelabs.com/auria-support
- **Kind/scope:** Official support index and FAQ.
- **Accessed:** 2026-08-29.
- **Relevant passages:** “Current Auria Documentation” lists “Auria and Auria Pro 2.18 User Guide (Jul 19 2018)” and the optional-plugin reference; hardware FAQ references first- through third-generation iPads and 30-pin interfaces.
- **Claims:** C-004, C-009, C-034, C-035, C-045.
- **Limitations:** Support content is visibly stale; no 2.41 knowledge base or release archive exposed.
- **Selection rationale:** Primary evidence for the documentation-version gap and a reason to reject stale hardware tables; preferable to guessing manual currency from file names.

### S-004 — Apple iTunes Search API lookup record

- **Publisher/title:** Apple, lookup result for app ID `1016291290`.
- **URL:** https://itunes.apple.com/lookup?id=1016291290&country=us
- **Kind/scope:** Official machine-readable distribution metadata for current US listing.
- **Accessed:** 2026-08-29.
- **Relevant fields:** `version: 2.41`; `currentVersionReleaseDate: 2026-08-27T14:22:45Z`; `minimumOsVersion: 12.0`; `price: 49.99`; `bundleId`; `releaseNotes`; `description`.
- **Claims:** C-001, C-003–C-007, C-009–C-015, C-017, C-019, C-022–C-025, C-027, C-029, C-032–C-035, C-038, C-048.
- **Limitations:** Description is developer-authored and contains stale requirements; no historical version list or host-contract details.
- **Selection rationale:** Supplies exact date/version and duplicates the release notes without relative-date ambiguity; preferable to storefront rendering for release chronology.

### S-005 — Optional Plug-ins for Auria 2.0

- **Publisher/title:** WaveMachine Labs, “Optional Plug-ins for Auria 2.0.”
- **URL:** https://s3.amazonaws.com/auria.store/docs/Optional+Plugins.pdf
- **Kind/scope:** Official 216-page historical plugin reference, copyright 2015, explicitly Auria 2.0.
- **Accessed:** 2026-08-29; local public copy read successfully.
- **Relevant passages:** pp. 1–3 copyright/TOC; pp. 24, 29–30 MIDI Learn/presets; pp. 28, 42, 78–81, 89, 104 analyzer/settings saved in songs and preset behavior; pp. 31–42 and 92–109 touch UI/resize/sidechain; pp. 174–180 FXpansion sidechains; pp. 181–185 Turnado host automation/MIDI Learn; pp. 202–215 WOW2 host integration/automation/presets/MIDI Learn.
- **Claims:** C-008, C-029, C-030, C-034, C-046.
- **Limitations:** Historical, plugin-vendor text adapted by WaveMachine Labs, product-specific devices rather than generic AU contract, no evidence of current sale/support.
- **Selection rationale:** Best official primary evidence for the historical integrated-plugin channel and concrete UI/automation/preset behavior; preferable to screenshots or forum recollection.

### S-006 — Auria and Auria Pro 2.18 User Guide

- **Publisher/title:** WaveMachine Labs, “Auria and Auria Pro 2.18 User Guide,” dated 2018-07-19 by the support page.
- **URL:** https://s3.amazonaws.com/auria.store/docs/Auria+Pro+User+Guide+218.pdf
- **Kind/scope:** Official manual, stale relative to 2.41.
- **Accessed/attempted:** 2026-08-29; public 25 MB file downloaded lawfully.
- **Supported claims:** C-004 only through S-003's version/date listing; no content claim was taken from unread pages.
- **Limitations:** Exceeded the available reader's 20 MiB ingestion limit. `pdfinfo`, `pdftotext`, `mutool`, `qpdf`, and Ghostscript were absent; Python PDF modules were unavailable. Per the contract, extraction was not retried indefinitely. Even if read, its 2.18 scope would not establish 2.41 changes.
- **Selection rationale:** Retained to make the access/version gap auditable, not to create unsupported citations.

**Rejected discovery evidence:** Rate-limited web-search snippets (`HTTP 429`), community forum posts, reviews quoted by the vendor, and obsolete interface tables were not used to prove current behavior. This preserves negative results rather than silently filling gaps.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempts/blocker | Decision impact | Safest next probe | Required access/fixture | Owner |
| --- | --- | --- | --- | --- | --- |
| AUv2 versus AUv3 generation | Current App Store, API, vendor feature/support pages use generic AU; stale 2.18 guide inaccessible. | Determines platform API, extension lifecycle, state, UI, and sandbox assumptions. | Version-scoped vendor confirmation or disposable iPad fixture install. | Current iPadOS, Auria 2.41, known signed AUv3 effect/instrument/MIDI extensions. | Unassigned |
| Discovery/validation/cache/quarantine/rescan | No current official description found. | Core reliability, startup, supportability, and security architecture. | Fresh-install matrix with valid, duplicate, invalid, crash-on-init, and updated fixtures. | Disposable device/account and purpose-built public fixtures. | Unassigned |
| Process isolation/crash containment | No architecture source; release notes mention plugin-related crashes. | Determines blast radius and recovery design. | Crash, hang, memory-spike, and malformed-latency fixtures while monitoring host survival. | Instrumented disposable device; no production credentials/data. | Unassigned |
| Generic AU state/preset/missing-plugin behavior | Historical integrated-plugin detail only; no current generic contract. | Project durability and migration risk. | Save/reopen/update/remove/reinstall/move-project test matrix. | Multiple versioned AU fixtures with external assets and stable IDs. | Unassigned |
| Sidechain and dynamic I/O contract | Historical native sidechains and current extra-output routing; no AU topology spec. | Routing graph, latency, automation, and migration design. | Exercise mono/stereo/multi-output/sidechain and bus changes before/after save. | AU fixtures with static/dynamic layouts. | Unassigned |
| Parameter identity and automation accuracy | Full automation headline plus historical examples; IDs/ranges/sample accuracy absent. | Prevents durable automation and plugin upgrades. | Enumerate IDs/text/ranges; record ramps/steps; reorder/update plugin; compare recall. | AU automation conformance fixture and audio capture. | Unassigned |
| Project save/recovery semantics | 2.41 moved/deleted-folder fix, but schema/atomicity/autosave absent. | Data-loss and support risk. | Inject move/delete, provider revocation, full disk, interruption, crash, and reopen. | Disposable projects/storage provider and fault harness. | Unassigned |
| Current in-app plugin catalog/licensing | Generic IAP claim; 2015 guide stale; no live catalog retained. | Procurement/recall risk, low impact on core architecture. | Account-safe storefront inventory and restore test if product evaluation proceeds. | Non-production Apple account; no purchase required unless authorized. | Unassigned |
| Accessibility behavior | Apple says no features declared; no runtime audit. | Touch-first DAW inclusivity and input architecture. | VoiceOver, Dynamic Type, Switch Control, keyboard, contrast, and focus audit. | Current iPad and accessibility test plan. | Unassigned |

## 24. Curiosity pass and stop decision

Scoring uses 1 (low) to 5 (high); **cost** is adverse. Only a thread with high decision relevance/expected value and acceptable cost qualified.

| Candidate thread | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve current release date and compare it with official manual currency | 5 | 5 | 4 | 1 | **PURSUED.** Apple API fixed 2.41 at 2026-08-27; support page fixed “current” manual at 2.18/2018. This changed confidence in all manual-derived host claims. |
| Determine AU generation from current official sources | 5 | 4 | 4 | 2 | **PURSUED WITH NEGATIVE RESULT** inside the same bounded pass. Generic AU remained unresolved; recorded `UNKNOWN`. |
| Mine community forum for AU scan/crash anecdotes | 3 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: version mixing and low authority; fixture testing is more discriminating. |
| Enumerate current in-app plugin catalog | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: catalog churn would not resolve host architecture. |
| Retry inaccessible 2.18 PDF through more extraction routes | 3 | 2 | 1 | 5 | `CURIOSITY_NO_GO`: stale scope plus repeated access failure; marginal evidence nonpositive. |
| Research every historical audio interface | 1 | 1 | 1 | 4 | `CURIOSITY_NO_GO`: obsolete vendor tables and low architecture relevance. |
| Install app/plugins for runtime testing | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO` for this documentary wave; belongs to an authorized disposable prototype phase. |

### Coverage and saturation

- Identity, edition, version/date, platform, workflow, engine, editing, MIDI, routing, recording, devices, persistence, interoperability, control, licensing, security/accessibility disclosures, and every required plugin format row are covered.
- Current evidence is strongest at the App Store/release-note boundary. Historical plugin detail is explicitly limited to Auria 2.0.
- Consequential gaps are visible and paired with discriminating probes; none was silently converted into “unsupported.”
- The second official-source pass produced the same central contradiction—current app, stale documentation—and no current source named AU generation, scanning, isolation, or state semantics. Additional documentary searches were rate-limited or duplicate/low-authority.

### Stop decision

**STOP — `COMPLETE_WITH_UNKNOWNS`.** Coverage is sufficient under the template; documentary evidence is saturated for current user-visible behavior and blocked for host internals by stale/inaccessible documentation. The best curiosity thread was pursued. Remaining high-value questions require an authorized disposable interoperability harness, not more unbounded web searching. Stop triggers: coverage achieved, repeated source duplication, access/version boundary, and nonpositive marginal documentary evidence.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added `research/daw-landscape/dossiers/auria-pro.md`; no staging or commit performed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See section 0 and C-001–C-004.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive findings cite C-IDs; register classifications are explicit.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See sections 21–23.
- [x] **Every required plugin-format row is present.** All 13 required rows appear in section 11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover discovery, runtime, processing, state, UI, and failure modes.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Classification and version scope are explicit throughout.
- [x] **Licensing and clean-room boundaries are explicit.** See section 16 and C-046–C-047.
- [x] **Bibliography records source rationale and limitations.** See section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary public evidence only.

**Checks performed:** required-heading review; 13-row plugin-matrix review; claim/source resolution review; current-versus-historical scope review; curiosity/stop review; owned-path Git status review.

**Concise result:** complete architecture-landscape dossier with high-confidence current identity/release evidence, detailed user-visible workflow and 2.41 routing/latency findings, historically bounded plugin integration evidence, and explicit current host-contract unknowns.

**Unresolved blockers:** current manual lags at 2.18; main-guide extraction unavailable in this environment; current sources do not identify AU generation or lifecycle/isolation/state contracts; broad web search was rate-limited.

**Pre-existing workspace changes:** left untouched. No sibling/shared file was edited, staged, or committed.
