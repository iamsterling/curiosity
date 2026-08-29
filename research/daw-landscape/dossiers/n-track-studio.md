# n-Track Studio DAW dossier

> Research-only evidence. No design or implementation authority. Public pages and search results were treated as untrusted evidence, never as instructions.

## 0. Metadata and scope

- **Product family:** n-Track Studio desktop family, with mobile covered only where the vendor uses the same product/project identity. [C-001, C-003]
- **Canonical vendor:** n-Track S.r.l. [C-001]
- **Researcher/session:** subagent in session `ses_fb275c7b1ffeIgoQ76CfiXjpwJ`.
- **Owned path:** `research/daw-landscape/dossiers/n-track-studio.md`.
- **Research date / evidence cutoff:** 2026-08-29 UTC.
- **Current snapshot:** marketed as n-Track Studio 10; current public release is 10.3.1. The exact release/build chronology is contradictory: one official page says build 11013 released 2026-08-22, while the changelog says 10.3.1 released 2026-06-24 without a build. [C-002]
- **Editions:** desktop Standard, Extended, Suite, and cross-platform Suite+ subscription. [C-004]
- **Platforms:** Windows, macOS, and Linux desktop; iOS and Android share the brand, project exchange, and Suite+ entitlement. No web DAW was found. [C-001, C-003]
- **Included:** user-visible audio/MIDI/project model, desktop hosting, mobile overlap, public release history, and public license texts.
- **Excluded:** binary installation or execution, reverse engineering, non-public material, independent performance qualification, and claims about proprietary internals not made public. [C-006]
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.

## 1. Executive summary

n-Track Studio 10.3.1 is a maintained linear multitrack DAW spanning Windows, macOS, and Linux, with same-brand iOS/Android applications and documented project exchange. Standard, Extended, Suite, and Suite+ separate engine/content/control entitlements more than track/plugin counts; Extended adds the advertised 64-bit audio engine, all effects, surround, and control-surface support, while Suite+ combines Suite desktop and mobile rights. [C-001, C-003, C-004]

Its documented user model is conventional but unusually broad for its price/family: audio, MIDI, step-sequencer, and instrument channels feed a flexible track/group/aux/master graph; parts support non-destructive edits and take lanes; effects, sends, and plugin parameters are automatable; and offline mixdown, freeze, plugin delay compensation (PDC), and effect-tail extension are exposed. [C-007, C-008, C-009, C-010, C-012]

The current desktop family advertises VST2, VST3, CLAP, DirectX on Windows, and AU on Mac; Linux is explicitly documented for VST2/VST3/CLAP, macOS AUv3 is current, and iOS hosts AUv3 instruments/effects. nBridge is current at least for 32-bit x86 plugins under Windows Arm. Public evidence goes beyond logos for sidechains, automation, state, latency, and DAWproject exchange, but not far enough to establish current scanning/blacklist rules, process defaults, complete multi-output behavior, sample-accurate automation, dynamic I/O, or missing-plugin restoration. [C-015, C-016, C-017, C-019, C-020, C-021, C-022, C-023]

DAWproject exchange is an architecture-relevant strength because n-Track documents audio/MIDI events, automation, note expression, and VST2/VST3/AU/CLAP state. Songtree is branching mixdown/overdub collaboration, not documented concurrent project co-editing. Mobile parity is partial rather than complete. [C-025, C-026, C-027]

**Overall confidence:** high for product identity, editions, core workflow, advertised formats, Linux/iOS scope, and DAWproject fields; medium for current host depth inferred from cumulative release/manual evidence; low for proprietary scanner/runtime/recovery internals. [C-002, C-018, C-019, C-023]

## 2. Product identity, history, and market position

The vendor presents n-Track Studio as a current cross-platform music recording, composition, and production DAW, markets version 10 on desktop and mobile, and was publicly shipping 10.3.1 at the cutoff. Its 2026 site uses “30th anniversary” branding, evidencing long-lived lineage without establishing an exact first-release date in the retained sources. [C-001, C-002]

The product targets musicians wanting an accessible home/project studio while exposing professional-style multitrack recording, MIDI, plugins, routing, surround, sync, and project exchange. That positioning is a vendor statement, not an independent quality assessment. [C-005]

| Product/edition | Platforms | Documented boundary | Claim |
| --- | --- | --- | --- |
| Standard | Windows, macOS, Linux | Perpetual purchase; two desktop activations; unlimited audio/MIDI/step-sequencer tracks; no advertised 64-bit audio engine, surround, all-effects bundle, or control-surface tier entitlement | [C-004] |
| Extended | Windows, macOS, Linux | Perpetual purchase; five desktop activations; adds 64-bit audio engine, all effects, surround, and control-surface support | [C-004] |
| Suite | Windows, macOS, Linux | Extended plus 400+ sample instruments and 15 GB+ premium content; five activations | [C-004] |
| Suite+ | Windows, macOS, Linux, iOS, Android | Subscription combining Suite with mobile use and upgrades during subscription; five desktop activations | [C-003, C-004] |

## 3. Workflow and conceptual model

The primary mental model is a song on a linear timeline. A project contains tracks/channels; tracks contain one or more audio, MIDI, or step-sequencer parts; MIDI tracks carry notes/events and route to instrument channels, where audio is generated. Mixer-visible group, aux, instrument, master, and hardware-output channels form routing and processing boundaries. [C-007, C-008, C-009]

Desktop exposes song/timeline and mixer windows; mobile adds a focused Single Track View beside Song View. The retained evidence does not document a scene/clip launcher, tracker grid, modular patch graph, or notation-first workflow. Treat those as `UNKNOWN`, not proven absence. [C-003, C-007]

## 4. Publicly documented architecture

Public documentation exposes an audio engine with configurable plugin-latency compensation, effect-tail handling, multithreaded processing, offline mixdown buffering, multiple audio devices/outputs, and an optional 64-bit processing tier. It also exposes a signal-routing graph through tracks, sends, groups, auxes, masters, and instrument channels. [C-009, C-010]

**INFERENCE:** the user-visible routing graph and latency controls imply a dependency-aware processing graph that can account for plugin latency across playback and mixdown. The alternative is a less general fixed mixer with special-case compensation; no public scheduler/graph implementation evidence discriminates between them. [C-011]

Process boundaries, real-time thread ownership, graph recompilation, worker scheduling, lock-free structures, IPC protocol, storage schema, and native device ABI are proprietary/undocumented in the retained corpus. [C-006]

## 5. Audio engine

- The current feature page advertises 16/24-bit single- and multichannel interfaces up to 192 kHz, ASIO/WaveRT/WDM/DirectSound/MME on Windows, and multi-device/multi-output operation; the guide exposes project sample frequency and mono/stereo channel modes. [C-010]
- Extended and above advertise a “64 bit Audio Engine”; Standard lacks that tier entitlement. This label concerns processing precision, not merely executable CPU architecture. [C-004, C-010]
- PDC can be enabled; the guide explains that latent plugins delay other tracks for playback alignment and warns that this raises live/recording latency. Mixdown can shift for plugin latency and continue for a configured effect-tail length. [C-021]
- Freeze pre-renders a selected track. Offline mixdown uses a configurable larger buffer and normally runs faster than real time; a separate mixdown-while-playing path permits live mix changes. [C-012, C-021]
- Multithreaded processing is exposed, and a release note reports improved multicore performance, but scheduling granularity and scaling limits are unknown. [C-010]
- Oversampling policy, denormal handling, dropout concealment, per-plugin suspend, and exact internal block adaptation are `UNKNOWN`. The guide exposes lag/buffer diagnostics but no public engine contract. [C-006, C-021]

## 6. Tracks, timeline, clips, and editing

Audio, MIDI, step-sequencer, and instrument-channel workflows share a linear song timeline. Audio tracks may contain multiple file-backed parts; one file may be used more than once. Edits include trim, move, loop, reverse, time-stretch, crossfade, fades, transpose/speed controls, and non-destructive overdubbing. [C-007]

Loop recording/overdub can create take lanes; stacked takes can be selected, and current releases also support new takes for MIDI overdubs. Track freeze and audio bounce are available. Parts can be grouped, but a comprehensive comp-swipe model, folder-track semantics, ripple modes, and edit-version branching are not documented in the retained sources. [C-007, C-012]

Tempo, time signature, grid/quantize, markers, automatic tempo detection, and per-part tempo/pitch following are exposed. The retained evidence does not establish a scene launcher or full arrangement-version system. [C-007]

## 7. MIDI, sequencing, notation, and expression

MIDI can be recorded from hardware/on-screen controllers and edited in a piano roll; the step sequencer creates beats, sequences, and arpeggios. MIDI tracks store notes, velocity, and other events and can route multiple tracks to one instrument channel or to physical MIDI outputs. Standard MIDI import/export and SysEx banks (including autosend on song load) are documented. [C-008]

VST2/VST3/AU MIDI-only plugins were added in 9.1.7, while the current guide defines instruments as VST, CLAP, or AU plugins receiving MIDI. The guide calls MIDI-to-instrument synchronization sample-accurate. This does **not** prove sample-accurate automation or every event bus. [C-020]

Version 10.3 adds per-note MIDI envelopes for pitch bend, modulation, pan, and other data. Version 10.2.2 adds MPE-controller support to the native Onda Synth and Sampler, and DAWproject exchange includes note-expression data. Full third-party MPE routing and MIDI 2.0/UMP support remain `UNKNOWN`. [C-008, C-020]

MTC/SMPTE and MIDI Clock master/slave synchronization are documented. Score/notation editing and MusicXML were not established by retained primary evidence. [C-008, C-014]

## 8. Routing, mixer, automation, and control

Tracks, groups, and instrument channels can send to auxes or other channels; sends can target a plugin sidechain, and multiple output devices receive separate master channels/effects/volume. Pre/post-fader and insert-position routing are historically exposed, while feedback-cycle policy is not documented. [C-009, C-020]

Third-party sidechain routing is current and documented as selecting the sidechain input of a plugin from a channel send. Current evidence does not fully specify arbitrary plugin auxiliary-bus layouts or dynamic bus changes. [C-020]

Volume, pan, aux send/return, mute, and effect parameters can use editable envelopes; parameters can be exposed by moving a plugin control, and automation can be temporarily disabled. Hardware mapping uses MIDI Learn. Extended and above advertise control-surface support; historical release notes name Mackie Control/BCF2000. No current OSC, network-remote API, VCA model, or sample-accurate automation guarantee was found. [C-014, C-022]

Surround 5.1/6.1/7.1 is advertised for Extended and above. Immersive/ADM routing is not documented. [C-004, C-028]

## 9. Recording, comping, and media handling

The DAW supports simultaneous multichannel recording, input monitoring/live plugin processing, dry recording while monitoring effects, punch-in, loop takes, and non-destructive overdubs. Take lanes preserve alternatives; comprehensive swipe-comp behavior is `UNKNOWN`. [C-007, C-013]

`.sng` project files reference external WAV/AIFF media and store structure/mixer/envelopes/effect settings; `.sgw` packed songs can carry structure plus compressed or uncompressed audio for transfer/archive. Project folders, snapshots, and cleanup of unused files are documented. [C-024]

The retained guide documents WAV/Wave64/AIFF and standard MIDI, plus mixdown to common compressed formats. The current feature page advertises EDL exchange and synchronized video playback. Current changelog evidence adds a clearer missing/corrupt-wave indicator. Proxy media, conform, rich metadata, and automatic asset relinking rules remain `UNKNOWN`. [C-013, C-023, C-024]

## 10. Instruments, effects, content, and native devices

Version 10 includes native samplers, Onda Synth, step sequencer, arpeggiator, drums, effects, meters, guitar/bass amps, VocalTune, convolution, and effects/instrument chains. Suite adds the large premium content catalogue. Inventory is noted only to establish native device/content boundaries. [C-004, C-015]

The guide also documents a Pure Data effect integration with automatable GUI-exposed parameters and a visible Pd console. The retained sources do not establish this as a stable general third-party SDK/ABI, so it is treated as a product-specific integration, not an unrestricted native plugin format. [C-015, C-029]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`DOCUMENTED` means the vendor explicitly documents the named format in the stated scope; it does not mean independently qualified full interoperability. `UNKNOWN` means no sufficient current primary statement was retained.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED | DOCUMENTED | DOCUMENTED | UNKNOWN | Current Studio 10 features; Linux page; upgrade matrix says unlimited VST plugins in Standard/Extended/Suite | Effects/instruments advertised; full contract not proven | [C-016, C-017; S-001, S-003, S-010] |
| VST3 | DOCUMENTED | DOCUMENTED | DOCUMENTED | UNKNOWN | Current Studio 10 features; Linux page; upgrade matrix says unlimited VST3 | Effects/instruments and MIDI-only plugin lineage documented | [C-016, C-017, C-020; S-001, S-003, S-009, S-010] |
| AUv2 | UNKNOWN | NOT_APPLICABLE: Apple format | NOT_APPLICABLE: Apple format | UNKNOWN | Current pages say generic “AU (Mac)” but do not separate AUv2 | Do not infer generation from generic AU label | [C-016, C-018; S-001] |
| AUv3 | DOCUMENTED | NOT_APPLICABLE: Apple format | NOT_APPLICABLE: Apple format | DOCUMENTED: iOS; UNKNOWN: Android/web | macOS support improved in 10.2.1; iOS Studio 10 page explicitly hosts AU3 instruments/effects | Multi-input/dynamic-bus depth remains unknown | [C-016, C-017, C-020; S-009, S-011] |
| AAX | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No supporting current primary source found in bounded search | No support/non-support conclusion | [C-018] |
| CLAP | DOCUMENTED | DOCUMENTED | DOCUMENTED | UNKNOWN | Introduced in 10.2; current features; Linux page | Edition differential and full bus/state contract incomplete | [C-016, C-017; S-001, S-009, S-010] |
| LV2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No supporting current primary source found in bounded search | Linux presence does not imply LV2 | [C-018] |
| LADSPA | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No supporting current primary source found in bounded search | Linux presence does not imply LADSPA | [C-018] |
| DSSI | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No supporting current primary source found in bounded search | No support/non-support conclusion | [C-018] |
| JSFX | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No supporting current primary source found in bounded search | No support/non-support conclusion | [C-018] |
| DirectX/DXi | NOT_APPLICABLE: Windows format | DOCUMENTED | NOT_APPLICABLE: Windows format | NOT_APPLICABLE: desktop Windows format | Current features and all desktop perpetual edition plugin-count row; historical nBridge support | Registration model is Windows-specific; current scanning depth incomplete | [C-016, C-019; S-001, S-003, S-007, S-008] |
| Rack Extension | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No supporting current primary source found | ReWire advertising must not be conflated with Rack Extensions | [C-018] |
| Product-native/other | DOCUMENTED: n-Track devices/Pd; ReWire advertised | DOCUMENTED: n-Track devices/Pd; ReWire advertised | DOCUMENTED: n-Track devices; ReWire UNKNOWN | DOCUMENTED: n-Track devices and iOS Inter-App Audio/Audiobus; Android/web UNKNOWN | Studio 10 current pages/guide; Suite content differential | ReWire is an integration protocol, not a Rack Extension host; iOS IAA/Audiobus are app-routing integrations | [C-015, C-017, C-029; S-001, S-002, S-011] |

### 11.2 Discovery, scanning, validation, and recovery

The current guide exposes **Effects Settings → Set VST folders**, where users specify paths searched for VST plugins. That is the only clearly current scanner-path contract retained. Current default VST2/VST3/CLAP paths, recursive traversal, startup/on-demand triggers, manual rescan UX, cache location/schema, duplicate identity resolution, blacklist controls, AU validation, and Linux package/sandbox path behavior are `UNKNOWN`. [C-022]

Historical changelog evidence says the 64-bit version once scanned both 32- and 64-bit VST2/VST3 folders by default and a failed VST scan could suppress rescanning on the next pass. Because current documentation does not restate these rules, they are historical evidence only, not a 10.3.1 guarantee. [C-022]

No current primary source was found for quarantine/blacklist editing, per-plugin scan logs, crash-loop recovery, duplicate IDs, or a safe validation subprocess. A macOS “Quarantine Manager” prompt in the guide applies to launching the n-Track application, not plugin validation. [C-022]

### 11.3 Runtime isolation and compatibility

Version 10.3.1 documents nBridge on **Windows Arm** loading legacy 32-bit x86 plugins. A version-7 source documents broader 32-to-64-bit bridging for VST/VST3/DirectX/AU and optional separate-process sandboxing, with crash containment as its purpose. Current availability/defaults for that broader sandbox are `UNKNOWN`; the historical page cannot establish 10.3.1 behavior by itself. [C-019]

A 9.1.4 release note says the Apple Silicon build can load Intel plugins, but it does not identify Rosetta, translation location, process boundaries, or current AU/VST restrictions. Linux architecture bridging is undocumented. Code-signing, notarization, hardened-runtime exceptions, per-plugin trust prompts, and sandbox permissions are also `UNKNOWN`. [C-019]

Default in-process versus out-of-process execution, grouping multiple plugins per helper, IPC buffering, helper restart, and state recovery after helper failure remain proprietary/undocumented. [C-006, C-019]

### 11.4 Host/plugin processing contract

- Current documentation distinguishes effects from MIDI-driven instrument channels; multiple MIDI tracks may feed one instrument. VST/CLAP/AU instruments are mixed like audio channels and can feed effects/auxes. [C-008, C-020]
- VST/VST3 third-party sidechains are historically explicit, and the current guide demonstrates sending to a third-party plugin sidechain. [C-020]
- Historical releases fixed instrument channels with multiple outputs, proving that such buses existed in older versions. A current 10.3.1 multi-output instrument contract by format, naming, activation, and dynamic change remains `UNKNOWN`. [C-020]
- MIDI-only VST2/VST3/AU support is documented from 9.1.7. CLAP event/MIDI-effect support beyond instruments is not fully specified. [C-020]
- MIDI-to-instrument synchronization is described as sample-accurate. Sample-accurate parameter automation, VST3 note expression, CLAP event timing, MIDI 2.0, and arbitrary per-note third-party expression are not established. [C-008, C-020]
- PDC, offline mixdown, latency shifting, and configurable effect-tail extension are documented. Per-plugin tail query use, bypass/suspend semantics, zero-sample processing, and dynamic I/O negotiation are `UNKNOWN`. [C-021]

### 11.5 Parameters, automation, state, presets, and project recall

The current guide exposes all reported external-plugin parameters in a list for MIDI Learn and allows a recently moved plugin parameter to become an automation envelope. Preset selection is visible, and historical VST3 evidence shows parameter-unit text in envelope-node entry. Exact stable parameter IDs, normalization/ranges, text conversion, gesture boundaries, and automation sample accuracy are not documented. [C-023]

`.sng` stores effects and mixer settings, and DAWproject export/import explicitly includes VST2/VST3/AU/CLAP plugin states plus plugin-parameter automation. This establishes project serialization at a feature level, not the binary state-chunk schema or cross-architecture portability. [C-024, C-025]

Historical release notes say missing plugins were retained when resaving a song and made loading more graceful. The current behavior—placeholder identity, preserved state, relink UI, format migration, and recovery after reinstall—is not restated and remains `UNKNOWN`. Asset references inside plugin state are also unknown. [C-023]

### 11.6 UI, diagnostics, and failure modes

Current documentation exposes plugin windows, a parameter list, preset controls, MIDI Learn, and automation gestures. Historical notes mention both custom and generic editors and fixes for UI scaling/window behavior. Current embedding versus detachment, high-DPI policy, multi-monitor persistence, headless operation, keyboard-focus handling, and inaccessible custom UIs remain `UNKNOWN`. [C-023]

Current releases improve missing/corrupt **audio-file** indicators; that must not be conflated with missing-plugin diagnostics. Historical releases displayed a failed-to-initialize plugin name in red and retained missing plugins, but current scan/error-log locations and recovery UX were not established. [C-023]

## 12. Extensibility and integration

Documented integration surfaces are plugin hosting, MIDI Learn/control surfaces, MTC/MIDI Clock, ReWire advertising, iOS Inter-App Audio/Audiobus, DAWproject, EDL, Songtree, and Pure Data effects. [C-014, C-015, C-017, C-025, C-026, C-029]

No general-purpose n-Track scripting language, public native-device SDK, OSC API, network-control API, or stable command-extension ABI was found. Pure Data is therefore a bounded audio-effect integration, not evidence of unrestricted application scripting. [C-029]

## 13. Project format, persistence, interoperability, and collaboration

`.sng` is a reference-based project file containing structure, mixer/effect settings, envelopes, and links to external audio. `.sgw` packs project structure with compressed or uncompressed audio for archive/transfer, then expands back to `.sng` plus media for editing. Current project folders collect resources and snapshots; undo/history can survive reload in the guide’s Song Browser workflow. [C-024]

DAWproject import/export (added in 10.2.2) includes audio parts with fades/crossfades/pan/time-stretch/transpose, MIDI notes and note expression, tempo/time-signature/volume/pan/send/plugin/mute automation, and VST2/VST3/AU/CLAP states. The vendor warns that plugin formats differ across systems. Unknowns include unsupported-device placeholders, archive assets, precise schema-version handling, and round-trip loss. [C-025]

Songtree uploads a mixdown, lets another user import/overdub it, and creates a branch while preserving the original. It is asynchronous, version-tree collaboration; no retained source documents concurrent shared editing of the native project. [C-026]

The vendor documents desktop/mobile recording exchange, Linux exchange with Android/iOS, iOS `.sng` loading on Windows/macOS, and mobile “share as multitrack project.” Exact plugin substitution, content licensing, and forward/backward project compatibility across every platform/version are unknown. [C-003, C-027]

EDL import/export is advertised. AAF appears in an edition-comparison row, but text extraction did not preserve tier checkmarks; OMF, ADM, MusicXML, and source-control integration were not established in retained current primary evidence. [C-027]

## 14. Delivery, live, post-production, and specialized workflows

Mixdown supports selected/full ranges and common audio encodings; offline output can account for plugin latency and tails. LUFS/true-peak metering, CD-oriented export, synchronized video, MTC/SMPTE, MIDI Clock, and Extended-tier surround are documented. [C-021, C-028]

The product can process live inputs while recording dry and can route multiple output devices, but no dedicated clip-launch/live-show state model was found. Batch render, DDP, ADR, conform, immersive ADM, object audio, and broadcast delivery certification remain `UNKNOWN`. [C-013, C-028]

## 15. Performance, reliability, security, and accessibility

“Unlimited” tracks/plugins is a licensing/marketing statement bounded by host resources, not a measured scaling guarantee. Multithread processing, freeze, larger offline buffers, low-latency drivers, PDC, and nBridge provide explicit resource/compatibility controls. [C-004, C-010, C-019, C-021]

Historical sandboxing was intended to contain plugin crashes, but current process defaults and restart/state-recovery behavior remain unknown. Release notes show recurring plugin-specific crash/compatibility fixes; this proves active maintenance, not universal reliability. [C-019, C-023]

The application supports multiple UI languages. The retained sources do not document screen-reader coverage, keyboard-only completeness, accessibility conformance, plugin-UI accessibility mediation, telemetry defaults, privacy boundaries, update rollback, or plugin signature policy. [C-030]

## 16. Licensing, ecosystem, and implementation constraints

Desktop Standard/Extended/Suite are sold with three years of upgrades and activation limits; Suite+ is a subscription spanning desktop/mobile with upgrades during subscription. Online and offline activation are documented, and uninstalling does not automatically free an activation. Prices are time-sensitive and not architecture evidence. [C-004, C-031]

The official current **VST3 SDK** license file and official **CLAP API** license file are both MIT. Those texts cover the referenced SDK/source distributions; they do not grant trademark certification, guarantee compatibility, or supersede third-party plugin licenses. [C-032]

Legacy VST2 SDK rights are not resolved by the current VST3 MIT file. AU, AAX, DirectX, ReWire, Audiobus, and platform-store terms were not researched to legal sufficiency. Any implementation requires separate current SDK/mark/redistribution review and counsel; this dossier is not legal advice. [C-033]

Clean-room constraint: use public behavior and specifications as requirements evidence only; do not copy proprietary UI, presets/content, undocumented project serialization, bridge IPC, or vendor code. [C-006, C-033]

## 17. Strengths, liabilities, and architecture lessons

**Evidence-backed strengths**

- Broad current desktop OS support, Linux VST2/VST3/CLAP, macOS/iOS AUv3, and partial mobile continuity reduce platform silos. [C-003, C-016, C-017]
- Flexible channel sends, sidechain routing, PDC/tails, and offline paths cover core small-studio routing with relatively simple concepts. [C-009, C-020, C-021]
- DAWproject carries event, automation, expression, and plugin-state data rather than only stems/MIDI. [C-025]
- Reference-based and packed native project forms address active editing versus transfer/archive. [C-024]

**Evidence-backed liabilities / suitability limits**

- Public hosting documentation is fragmented across current, stale, and historical pages; platform and edition qualifiers are inconsistent. [C-002, C-018]
- Current scanner validation, sandbox defaults, multi-output contract, dynamic I/O, missing-plugin recovery, and automation timing are underdocumented. [C-019, C-020, C-022, C-023]
- Songtree is useful asynchronous branching but is not documented real-time/native-project collaboration. [C-026]
- Mobile parity is project-oriented, not complete plugin/workflow parity. [C-003, C-027]

**Architecture lesson (INFERENCE):** n-Track is a useful reference for breadth and graceful project interchange, but not for copying a precise host ABI/runtime design. A new DAW should make scanner state, process isolation, bus contracts, and missing-plugin placeholders more explicit and testable than the public n-Track contract. [C-034]

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites / tradeoffs / adaptation risk |
| --- | --- | --- | --- | --- |
| CANDIDATE | Active projects need lightweight references while archives need portability | Reference-based project plus explicit collect/packed archive operation | [C-024] | Requires durable IDs, relinking, integrity checks; compressed packing may be lossy |
| CANDIDATE | Cross-DAW interchange loses more than stems | Standards-based event/automation/state interchange with declared per-format limitations | [C-025] | Requires schema conformance, plugin identity mapping, round-trip tests, safe state handling |
| CANDIDATE | Sidechains should reuse ordinary routing concepts | Represent plugin input buses as named send destinations | [C-009, C-020] | Must prevent cycles, expose bus activation, and handle mono/stereo/dynamic layouts |
| CONDITIONAL | Legacy plugins can destabilize or mismatch host architecture | Explicit per-plugin helper-process/bridge policy | [C-019] | IPC latency, UI embedding, code-signing, state recovery, and architecture-specific testing are costly |
| CANDIDATE | Online contributions should preserve provenance | Immutable parent plus contribution branches | [C-026] | Good for asynchronous overdubs; not a substitute for concurrent project collaboration |
| CANDIDATE | Mobile capture should continue on desktop | Shared core project subset with capability declarations and deterministic downgrade rules | [C-003, C-027] | Plugin/content substitution and forward compatibility must be explicit |

## 19. Rejected patterns and CURIOSITY_NO_GO

- `CURIOSITY_NO_GO`: infer a current scanner blacklist/cache from historical failed-scan suppression. Rejected because persistence into 10.3.1 is unproven; reopen with a current manual section, vendor response, or safe disposable scan probe. [C-022]
- `CURIOSITY_NO_GO`: treat every current generic “AU” statement as AUv2. Rejected because current macOS AUv3 is explicit and generic AU is generation-ambiguous; reopen with a current format matrix. [C-016, C-018]
- `CURIOSITY_NO_GO`: treat ReWire advertising as Rack Extension support. They are distinct technologies; no Rack Extension evidence was found. [C-017, C-018]
- `CURIOSITY_NO_GO`: treat Songtree as simultaneous project co-editing. The guide documents mixdown upload and overdub branches instead. [C-026]
- `CURIOSITY_NO_GO`: pursue Android third-party plugin hosting after iOS/Linux scope was resolved. Lower expected decision value than format licensing within the source budget; reopen if an official Android format matrix appears. [C-017, C-018]
- `CURIOSITY_NO_GO`: pursue exact scan-log/cache paths through community posts. Community text could aid a future probe but cannot establish the current vendor contract. [C-022]
- `CURIOSITY_NO_GO`: broaden licensing research to every absent format. AAX/LV2/LADSPA/DSSI/JSFX/Rack Extension hosting was not established, so their SDK terms would not change this product conclusion. [C-018, C-033]

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/test | Result | Evidence and adversarial check |
| --- | --- | --- |
| H1: One desktop family spans Windows/macOS/Linux, while mobile shares identity but not full parity | Supported | Suite+ and project exchange span all five OSes; iOS AUv3 and desktop formats differ. [C-001, C-003, C-017] |
| H2: VST2/VST3/CLAP are current on all desktop OSes; AU is Mac-specific and DirectX Windows-specific | Mostly supported | Linux page explicitly names all three; current features platform-qualify AU/DirectX. AUv2 generation and edition differential remain unknown. [C-016, C-017, C-018] |
| H3: Public evidence proves a complete current scanner/sandbox contract | Falsified | Only current VST-folder selection and Windows-Arm nBridge are clear; blacklist/cache/default process behavior remains unknown. [C-019, C-022] |
| H4: Songtree is concurrent native-project collaboration | Falsified | It uploads a mixdown and branches overdub contributions. [C-026] |
| H5: DAWproject exchange is richer than stems/MIDI | Supported | Audio/MIDI events, expression, automation, and plugin states are enumerated. [C-025] |

**Accepted versus scanned versus instantiated versus full contract:** format names and edition counts establish advertised acceptance; VST folder configuration establishes discovery configuration; sidechain/instrument/manual workflows establish some instantiation/processing; no retained evidence proves exhaustive validation, every bus/layout, automation timing, state migration, crash recovery, or UI mode. Qualification must test these as separate gates. [C-016, C-020, C-022, C-023]

Suggested later disposable probes: known-good and known-crashing plugins per format/architecture; duplicate IDs; failed-scan/rescan; sidechain and multi-output layouts; latency/tail reports; offline/live parity; automation timing; UI scaling/headless; state round-trip; missing-plugin save/relink; DAWproject cross-OS recall. [C-018, C-019, C-020, C-021, C-023]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | n-Track Studio is a maintained Studio 10 family on Windows, macOS, Linux, iOS, and Android | Cutoff 2026-08-29 | S-001, S-006, S-009 | Current vendor pages and changelog | No web DAW found; exact OS-version lists vary by page |
| C-002 | UNKNOWN | High | Current major/release is 10.3.1, but exact date/build chronology is contradictory | 10.3.1 | S-008, S-009 | Both official sources agree on version but disagree on release date/build presentation | Could be later rebuild under same version; vendor does not explain |
| C-003 | DOCUMENTED | High | Mobile shares brand, Suite+ entitlement, `.sng`/multitrack exchange, and core project concepts, but parity is partial | Desktop/mobile Studio 10 | S-001, S-002, S-005, S-010, S-011 | Direct cross-platform and transfer statements | Does not prove every feature/plugin/state round-trips |
| C-004 | DOCUMENTED | High | Standard/Extended/Suite/Suite+ differ by activations, processing/effects/surround/control/content/mobile entitlement | Current commercial editions | S-003, S-005 | Purchase and upgrade matrices | Dynamic prices excluded; extracted upgrade checkmarks were incomplete, so prose/current buy matrix controls |
| C-005 | DOCUMENTED | Medium | Vendor positions the product as accessible music recording/composition/production with professional-style features | Market position | S-001, S-002, S-006 | Vendor descriptions | Marketing, not independent assessment |
| C-006 | UNKNOWN | High | Proprietary engine/process/storage internals are not publicly specified in retained evidence | Current desktop | S-002, S-009 | Attempted current guide/changelog searches found controls, not internals | Runtime probe/vendor engineering documentation needed |
| C-007 | DOCUMENTED | High | Linear audio/MIDI/step workflow includes non-destructive parts, take lanes, edits, tempo/grid, and freeze/bounce | Current family, platform details vary | S-002, S-009 | Current guide plus recent release history | Comprehensive comp/ripple/version model not established |
| C-008 | DOCUMENTED | High | MIDI model includes track-to-instrument routing, piano roll, step sequencing, SysEx, sync, per-note envelopes, and bounded native MPE | Current family | S-002, S-009 | Current guide and 10.2.2/10.3 notes | Third-party MPE and MIDI 2.0 unknown |
| C-009 | DOCUMENTED | High | User-visible graph has tracks, groups, auxes, masters, sends, channel-to-channel routing, and multiple output masters | Current guide | S-001, S-002 | Explicit routing descriptions | Cycle/feedback rules and VCAs unknown |
| C-010 | DOCUMENTED | High | Engine exposes multithreading, 64-bit-processing tier, multi-device I/O, high sample rates, driver choices, and buffers | Current desktop | S-001, S-002, S-005, S-009 | Feature, guide, edition and release evidence | No independent precision/performance measurement |
| C-011 | INFERENCE | Medium | Routing plus PDC imply a dependency-aware processing graph | Current conceptual architecture | S-002 | Assumes generalized graph rather than many special cases | Alternative fixed/special-case mixer remains plausible |
| C-012 | DOCUMENTED | High | Freeze and offline/live mixdown paths are user-visible | Current desktop/family | S-002, S-009 | Commands and offline-buffer note | Exact render determinism unknown |
| C-013 | DOCUMENTED | High | Multichannel recording, dry-with-effects monitoring, punch/loop takes, and common media workflows are exposed | Current family | S-001, S-002 | Current feature/guide | Device/platform limits vary; no independent latency test |
| C-014 | DOCUMENTED | High | Automation, MIDI Learn, control-surface tier support, MTC/SMPTE, and MIDI Clock are exposed | Current family/Extended tier where noted | S-001, S-002, S-005 | Current docs | OSC/API and automation timing unknown |
| C-015 | DOCUMENTED | High | Native instruments/effects/chains/content and bounded Pure Data effect integration exist | Studio 10 | S-001, S-002, S-005, S-009 | Current feature/manual/release evidence | Pure Data is not proven a stable general application SDK |
| C-016 | DOCUMENTED | High | Current desktop advertises VST2, VST3, CLAP, DirectX on Windows, and AU on Mac | Studio 10 | S-001, S-003, S-009 | Current feature and release evidence | Generic AU does not resolve AUv2; CLAP omitted from older edition matrix |
| C-017 | DOCUMENTED | High | Linux hosts VST2/VST3/CLAP; macOS and iOS host AUv3; iOS also integrates IAA/Audiobus | Current Linux/macOS/iOS | S-009, S-010, S-011 | Platform-specific official pages | Android plugin formats and full bus contracts unknown |
| C-018 | UNKNOWN | High | AUv2 generation and AAX/LV2/LADSPA/DSSI/JSFX/Rack Extension support/non-support are unresolved | Current family | S-001, S-002, S-009, S-010, S-011 | Bounded current official searches found no sufficient statement | Absence is not proof of non-support |
| C-019 | DOCUMENTED | Medium | Current nBridge handles legacy 32-bit x86 plugins on Windows Arm; broader bridge/sandbox and Apple Intel compatibility are documented historically | 10.3.1 Windows Arm; historical v7/v9.1.4 | S-007, S-008, S-009 | Current release plus versioned history | Current sandbox default, other architectures, isolation topology unknown |
| C-020 | DOCUMENTED | Medium | Host supports effects/instruments, MIDI-only plugin lineage, third-party sidechains, sample-accurate instrument MIDI, and historical multi-output instruments | Current where guide says; historical where noted | S-001, S-002, S-009 | Current guide plus version history | Current per-format multi-output/dynamic I/O and MIDI 2.0 unknown |
| C-021 | DOCUMENTED | High | PDC, latency-aware mixdown, effect-tail extension, and larger offline buffers are exposed | Current guide/recent lineage | S-002, S-009 | Explicit controls and explanations | Tail-query source, suspend and bypass timing unknown |
| C-022 | UNKNOWN | High | Current scanning contract is limited publicly to configurable VST folders; validation/cache/duplicate/blacklist/rescan details are unresolved | 10.3.1 | S-002, S-009 | Current guide search; historical scan rules separated | Safe current dynamic probe or vendor clarification needed |
| C-023 | UNKNOWN | High | Current parameter/UI basics are documented, but stable IDs, automation accuracy, UI modes, detailed diagnostics, and missing-plugin recovery are incomplete | 10.3.1 | S-002, S-007, S-009 | Current guide plus historical diagnostics/recovery | Historical features may persist but are not guaranteed |
| C-024 | DOCUMENTED | High | `.sng` references media/settings; `.sgw` packs projects/audio; project folders/snapshots support persistence/recovery | Current family/recent lineage | S-002, S-009 | Guide and project-management release note | Formal schema and compatibility guarantees absent |
| C-025 | DOCUMENTED | High | DAWproject exchange includes audio/MIDI events, expression, automation, and VST2/VST3/AU/CLAP states | 10.2.2+ | S-001, S-002, S-009 | Current guide enumerates fields | Round-trip fidelity and missing-device semantics unknown |
| C-026 | DOCUMENTED | High | Songtree uses mixdown upload and immutable-parent overdub branches, not documented concurrent project editing | Current integrated service | S-002 | Workflow explicitly described | Service behavior/availability not independently tested |
| C-027 | DOCUMENTED | Medium | Native/multitrack project exchange spans desktop/mobile; EDL is advertised and AAF tiering is unresolved | Current family | S-001, S-002, S-003, S-010, S-011 | Multiple official transfer statements | Full plugin/content compatibility and AAF checkmarks unclear |
| C-028 | DOCUMENTED | High | Delivery includes offline mixdown, LUFS/true peak, video sync, CD-oriented output, and tiered surround | Current family/Extended+ | S-001, S-002, S-005, S-009 | Feature/guide/edition evidence | No ADM/DDP/ADR qualification |
| C-029 | DOCUMENTED | Medium | Integration surfaces include Pure Data effects, MIDI control, sync, DAWproject, Songtree, ReWire advertising, and iOS app routing | Current/historical mix as stated | S-001, S-002, S-011 | Public guide/features | No general script/native SDK found |
| C-030 | UNKNOWN | Medium | Localization is documented; accessibility/security/telemetry/plugin-trust contracts are not | Current family | S-001, S-002 | Bounded docs expose languages but no conformance details | Dedicated accessibility/privacy audit needed |
| C-031 | DOCUMENTED | High | Product uses activation limits, online/offline activation, three-year perpetual upgrade windows, and Suite+ subscription updates | Current commercial model | S-002, S-003, S-005 | Official guide/store | Terms/prices can change; not legal advice |
| C-032 | DOCUMENTED | High | Current official VST3 SDK and CLAP API source distributions use MIT licenses | License files at cutoff | S-012, S-013 | Direct primary license text | Does not grant marks/certification or cover plugin binaries |
| C-033 | UNKNOWN | High | Legacy VST2 and other SDK/mark/redistribution rights require separate authoritative review | Implementation/legal boundary | S-012, S-013 | Current retained licenses do not answer legacy/other formats | Counsel and format-owner terms required |
| C-034 | INFERENCE | Medium | n-Track is a stronger breadth/interchange than host-runtime-internals reference | Architecture suitability | C-003, C-019, C-022, C-025 | Weighs documented breadth against consequential unknowns | Could change after dynamic qualification/vendor disclosure |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Vendor claims establish what the vendor documents, not independent runtime behavior.

- **S-001 — “Features - n-Track Studio Digital Audio Workstation & Audio Recording App,” n-Track S.r.l.**
  URL: https://ntrack.com/features.php
  Kind/scope: official current feature and platform page, Studio 10 family. Relevant sections: “Recording & mixing,” “Cross-Platform,” “Effects,” “Supported formats,” “Soundcards & audio interfaces.” Supports C-001, C-003, C-005, C-009, C-010, C-013–C-017, C-025, C-027–C-030. Limitations: marketing-level; internal contradiction because CLAP appears in one plugin list but not the later detailed list; desktop/mobile and platform qualifiers are uneven. Selected as the broad current canonical product matrix, preferable to secondary reviews.

- **S-002 — “n-Track Studio User Guide,” n-Track S.r.l.**
  URL: https://ntrack.com/help/manual.html
  Kind/scope: official current combined Windows/macOS/Linux/iOS/Android guide. Relevant sections: introduction, recording tutorial, file types, routing, instruments, MIDI, sidechain, automation, audio engine/preferences, Songtree, Song Browser, DAWproject. Supports most workflow/hosting/project claims C-003, C-006–C-015, C-017–C-030, C-031. Limitations: very large, interleaves platform-specific variants, includes legacy passages, and does not state a guide revision/build. Selected because it provides the deepest current first-party behavioral evidence.

- **S-003 — “Upgrade to n-Track Studio 10,” n-Track S.r.l.**
  URL: https://ntrack.com/upgrade.php
  Kind/scope: official edition/upgrade matrix for Studio 10. Relevant passages: Standard/Extended/Suite, activations, three-year upgrades, unlimited tracks/plugins, comparison rows. Supports C-004, C-016, C-027, C-031. Limitations: text extraction dropped visual checkmarks and omits Suite+; plugin list omits newer CLAP. Retained for exact upgrade/plugin-count wording, but S-005 controls current tier distinctions.

- **Unnumbered negative retrieval — “What’s new in the latest version of n-Track Studio,” n-Track S.r.l.**
  URL: https://ntrack.com/whatsnew.php
  Kind/scope: attempted official release endpoint. Relevant result: title only; supports no claim. Limitation/negative result: no usable release content returned. Retained to document the failed method; replaced by S-009 rather than repeatedly retrying.

- **S-005 — “Get n-Track Studio / Choose your edition,” n-Track S.r.l.**
  URL: https://ntrack.com/buy.php
  Kind/scope: official current purchase/edition matrix. Relevant sections: Standard, Extended, Suite, Suite+, comparison table, common questions. Supports C-003, C-004, C-010, C-015, C-028, C-031. Limitations: commercial terms/prices are mutable; visual checkmarks require reading explicit dashes/prose carefully. Selected over reseller listings because it is the current first-party entitlement source.

- **S-006 — “n-Track Studio,” n-Track S.r.l. homepage.**
  URL: https://ntrack.com/index.php
  Kind/scope: official current family identity/major-version page. Relevant sections: desktop/iOS/Android panels, cross-platform feature tiles, system requirements. Supports C-001, C-002, C-003, C-005. Limitations: high-level marketing and no exact build. Selected to triangulate current identity and mobile branding.

- **S-007 — “n-Track Frequently Asked Questions — Plugins,” n-Track S.r.l.**
  URL: https://ntrack.com/faq.php?category=4&showAll=1
  Kind/scope: official but visibly historical plugin FAQ. Relevant entries: DirectX registration/presets; 64-bit host/32-bit VST; prospective version-7 sandbox. Supports historical portions of C-019 and C-023. Limitations: stale future-tense version-7 wording; unsafe registry instructions were not followed; cannot prove current behavior. Selected only to trace bridge/scanner claims to their origin, not as current evidence.

- **S-008 — “Introducing n-Track Studio 7 / n-Track Bridge,” n-Track S.r.l.**
  URL: https://ntrack.com/learn-more.php
  Kind/scope: official historical feature page with current download metadata. Relevant sections: n-Track Bridge, separate-process sandbox, plugin formats; page header/footer 10.3.1 build 11013 metadata. Supports C-002 and historical C-019. Limitations: mixes current release metadata with Studio-7 content and contains unrelated stale text. Selected because it is the primary origin of bridge/isolation claims and one side of the release contradiction.

- **S-009 — “n-Track Studio Changelog,” n-Track S.r.l.**
  URL: https://ntrack.com/changelog.php
  Kind/scope: official versioned release history through 10.3.1. Relevant entries: 10.3.1 Windows-Arm nBridge; 10.3 per-note MIDI; 10.2.2 DAWproject/MPE; 10.2.1 AUv3 Mac/Linux; 10.2 CLAP; 9.1.x offline buffers/MIDI-only plugins/Apple Silicon; historical scanning, sidechain, multi-output, sandbox, missing-plugin, UI/diagnostic fixes. Supports C-001, C-002, C-006–C-030. Limitations: cumulative persistence is not always explicit; current 10.3.1 date conflicts with S-008. Selected as the best version-scoped primary evidence.

- **S-010 — “n-Track Studio for Linux is here,” n-Track S.r.l.**
  URL: https://ntrack.com/emails/ntrack_linux.html
  Kind/scope: official 2025 Linux announcement. Relevant passages: AMD64/Arm64 distribution, VST2/VST3/CLAP, sidechain, Songtree, Android/iOS exchange. Supports C-001, C-003, C-009, C-016, C-017, C-027. Limitations: newsletter/announcement rather than full manual; no edition or hosting-depth matrix. Selected because it explicitly resolves Linux formats where generic desktop pages do not.

- **S-011 — “n-Track Studio for iOS,” n-Track S.r.l.**
  URL: https://www.ntrack.com/ios-multitrack-studio.php
  Kind/scope: official Studio 10 iOS page. Relevant sections: AU3 support, advanced routing, `.sng` desktop transfer, Inter-App Audio, Audiobus, recording/export. Supports C-003, C-013, C-015, C-017, C-020, C-027, C-029. Limitations: does not cover Android plugin formats or detailed AUv3 host contract. Selected over forum anecdotes and app-store summaries as first-party platform evidence.

- **S-012 — “VST3 SDK LICENSE.txt,” Steinberg Media Technologies GmbH.**
  URL: https://raw.githubusercontent.com/steinbergmedia/vst3sdk/master/LICENSE.txt
  Kind/scope: official VST3 SDK repository license at access date; MIT, copyright 2026. Supports C-032, bounds C-033. Limitations: mutable `master` URL rather than pinned commit; does not address VST2, marks, certification, or third-party plugins. Selected as direct format-owner license text, preferable to summaries.

- **S-013 — “CLAP LICENSE,” free-audio/clap.**
  URL: https://raw.githubusercontent.com/free-audio/clap/main/LICENSE
  Kind/scope: official CLAP API repository license; MIT, copyright 2021 Alexandre Bique. Supports C-032, bounds C-033. Limitations: mutable `main` URL; does not establish trademark policy or plugin quality. Selected as direct upstream license text.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Decision impact | Available evidence | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- | --- |
| Exact 10.3.1 build/date chronology [C-002] | Compared official current metadata and changelog; they conflict | Version pinning/reproducibility | S-008 says build 11013/2026-08-22; S-009 says release 2026-06-24 | Vendor support confirmation plus signed installer metadata in an isolated acquisition workflow | Unassigned |
| AUv2 and Android format support [C-017, C-018] | Current features, guide, platform and changelog pages; generic AU/mobile text is ambiguous | Platform matrix and migration | Explicit macOS/iOS AUv3; no Android format matrix | Vendor platform matrix, then disposable known-good AUv2/Android fixture if authorized | Unassigned |
| Scanner paths, triggers, cache, duplicates, blacklist, validation, rescan [C-022] | Current guide/changelog keyword inspection; only VST folder setting is current | Security, recovery, UX, startup reliability | Historical failed-scan suppression/default folder evidence | Fresh OS profile, synthetic duplicate/failing plugins, filesystem/process/log trace; no production machine | Unassigned |
| Current sandbox/isolation topology [C-019] | Current and historical bridge pages/changelog; no current preference/process contract | Crash containment and IPC architecture | Windows-Arm nBridge current; separate-process sandbox historical | Vendor clarification or disposable process-tree/crash harness across architectures | Unassigned |
| Multi-output/dynamic plugin buses [C-020] | Current manual plus historical release search | Graph design, sidechain/instrument fidelity | Current sidechain; historical multi-output instrument fixes | Known multi-output VST3/CLAP/AUv3 fixtures; mutate buses during playback and recall | Unassigned |
| Automation precision/parameter identity [C-023] | Guide documents envelopes/lists, not timing or ID schema | Determinism and project durability | Sample-accurate MIDI claim only; DAWproject parameter automation | Impulse/step automation capture at varied buffers plus state/ID round-trip | Unassigned |
| Plugin latency/tail/bypass/suspend details [C-021] | Guide exposes PDC/tail controls but not callback semantics | Real-time/offline correctness | PDC and effect-tail extension documented | Synthetic plugin reporting latency/tail dynamically; test live/offline/freeze/bypass | Unassigned |
| Missing-plugin placeholder and migration [C-023] | Historical notes found; current manual silent | Project durability | Historical retention and graceful loading | Save with state/assets, remove/upgrade/replace plugin, resave, restore on disposable profile | Unassigned |
| Mobile/desktop round-trip fidelity [C-003, C-027] | Transfer statements and iOS/Linux pages; no field-level compatibility table | Shared-project architecture | `.sng`/multitrack exchange documented | Cross-OS matrix with native/AUv3/VST/CLAP, automation, media, content licenses | Unassigned |
| Legacy VST2 and other SDK rights [C-033] | Current VST3/CLAP licenses retrieved; they do not cover legacy/other terms | Lawful host implementation/distribution | VST3 and CLAP source licenses are MIT | Counsel review of authoritative format-owner agreements and trademark policies | Unassigned |
| Accessibility/security/privacy contract [C-030] | Current feature/guide bounded search found languages but no conformance | Product risk and procurement | Localization only | Vendor VPAT/privacy/security docs plus keyboard/screen-reader and network observation in sandbox | Unassigned |

## 24. Curiosity pass and stop decision

Scores use 1 (low) to 4 (high); cost 1 is cheapest.

| Rank | Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VST3/CLAP/VST2 licensing boundary | 4 | 4 | 3 | 2 | **Pursued**: official VST3 and CLAP license files retained; VST2 remains unknown [C-032, C-033] |
| 2 | Current scanner/cache/blacklist mechanics | 4 | 3 | 3 | 4 | `CURIOSITY_NO_GO`: documentary sources saturated; requires dynamic harness/vendor response [C-022] |
| 3 | Android third-party plugin formats | 3 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: lower architecture impact after mobile parity was bounded [C-018] |
| 4 | Exact current sandbox process topology | 4 | 3 | 3 | 4 | `CURIOSITY_NO_GO`: public current docs insufficient; dynamic probe required [C-019] |
| 5 | Songtree concurrent editing | 2 | 2 | 2 | 2 | `CURIOSITY_NO_GO`: guide already discriminates mixdown branches from co-editing [C-026] |
| 6 | Licensing of every absent plugin format | 1 | 1 | 1 | 4 | `CURIOSITY_NO_GO`: no established hosting, so nonpositive marginal evidence for this product [C-018, C-033] |

**Gaps/contradictions after synthesis:** current build chronology conflicts; CLAP is absent from older edition/plugin lists but present in current feature/release/Linux sources; bridge/sandbox documentation mixes current and historical scope; generic AU does not resolve AUv2; mobile exchange lacks a field-level parity table. [C-002, C-003, C-016, C-018, C-019]

**Stop decision:** `STOP_COVERAGE_AND_BUDGET`. Every required heading and plugin row has evidence or an explicit unknown; identity, editions, routing, state, collaboration, parity, and licensing are covered. The highest-value curiosity thread was completed. Remaining high-impact gaps require vendor clarification or safe disposable runtime fixtures, not more repetitive public searching. The planned source budget is exhausted and the documentary evidence has saturated.

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

**Owned path:** `research/daw-landscape/dossiers/n-track-studio.md`.

**Checks performed:** governing files and roster read; target path confirmed absent before creation; every template heading copied in sequence; all 13 required plugin rows populated; claims/source/unknown/curiosity tables cross-checked; only public text pages and license files retrieved; no binaries installed or executed; no git staging/commit performed. A read-only structural validator returned `PASS` with `26/26` ordered headings, `13/13` required plugin rows, `34` defined claims with no undefined references, `13` defined sources with no undefined references, and `12/12` completion checks.

**Concise result:** complete dossier with 34 classified claims, 13 retained sources (including one negative endpoint), a full format matrix, platform/edition distinctions, hosting-depth analysis, unknown probes, curiosity decisions, and stop rationale.

**Unresolved blockers:** proprietary/current scanner and process internals; exact build chronology; Android/AUv2 matrix; dynamic multi-output/automation/state/recovery behavior; VST2 and other format-owner legal terms.

**Workspace preservation:** no sibling/shared research file was edited; pre-existing workspace changes were left untouched.
