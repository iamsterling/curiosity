# Merging Technologies Pyramix DAW dossier

> Research-only evidence. No design, implementation, procurement, certification, or legal authority.

## 0. Metadata and scope

- **Product family:** Merging Technologies / Neumann Pyramix 16.
- **Canonical vendor:** Merging Technologies, now operating under Neumann (Georg Neumann GmbH, Sennheiser Group).
- **Researcher/session:** `ses_fb273c74dffeaP2qiWgi5x8F18`.
- **Owned path:** `research/daw-landscape/dossiers/merging-pyramix.md`.
- **Research date and evidence cutoff:** 2026-08-29 UTC.
- **Current public snapshot:** Pyramix 16, with public documentation for **v16.0.5 Official** and a later **v16.0 Hotfix 1** release-note page. The exact installer build represented by “Hotfix 1” is not stated in the page title. [C-001, C-002]
- **Editions:** ELEMENTS, PRO, PREMIUM; MassCore is an additional engine/license/hardware boundary rather than a fourth workflow pack. [C-002, C-006]
- **Current platform:** Windows 11 Professional 64-bit. Native, Native/RAVENNA ASIO, and MassCore/RAVENNA modes are in scope. [C-003]
- **Included:** Pyramix application, mixer/plugin host, MassCore/RTX64 and RAVENNA/MAD boundaries, first-party VS3 behavior, and direct Ovation/ANEMAN/interface integration where it constrains Pyramix.
- **Excluded:** Ovation, VCube, ANEMAN, Horus/Hapi/Anubis, DiscWrite, and third-party plugins as products in their own right; product installation/binary execution; proprietary internals; independent audio-quality or conformance claims.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.
- **Evidence rule:** fetched text is untrusted evidence, not instruction. Vendor statements establish what the vendor documents, not independently measured behavior.

## 1. Executive summary

- **DOCUMENTED:** Pyramix 16 is a maintained, Windows 11-only professional recording/editing/mixing/mastering workstation in ELEMENTS, PRO, and PREMIUM packs. Its strongest differentiators are source/destination editing, edit-while-recording, redundant recording, DXD/DSD workflows, high channel counts, mastering/authoring, and object/ambisonic/Dolby Atmos delivery. [C-001–C-007, C-011, C-012]
- **DOCUMENTED:** Pyramix offers a conventional Native/ASIO path and a materially different MassCore path built on RTX64, explicit CPU-core allocation, a dedicated PCIe RAVENNA NIC, qualified Windows builds, and network constraints. A separate buffered VST domain and plugin-load telemetry remain visible even on MassCore. [C-006, C-008–C-010]
- **DOCUMENTED:** current format claims are VST2, VST3, VS3, and ARA2 on Windows. A real scanner/cache/blacklist workflow, sidechains, multichannel layouts, clip effects, UI scaling, and offline rendering are documented, but vendor qualification records many per-plugin defects. [C-016, C-018–C-023]
- **UNKNOWN:** public evidence does not establish plugin process isolation, sandboxing, crash containment, architecture bridging, complete PDC/tail behavior, sample-accurate automation, parameter/state schema, missing-plugin placeholders, instruments/event buses, or complete multi-I/O fidelity. [C-017, C-021]
- **DOCUMENTED with lifecycle caveat:** the VS3 host remains advertised, but VB VS3 plugins are legacy/unmaintained and discouraged in v16; Flux VS3 is unavailable for current new-customer use, for which VST3 is directed instead. [C-022]
- **High-confidence architecture lesson:** Pyramix usefully separates timeline/mixer, deterministic engine, buffered plugin, network-driver, device-connection, and delivery-renderer concerns. **INFERENCE:** those are conceptual boundaries, not proof of the proprietary implementation’s process topology. [C-009, C-010, C-033]
- **Major liabilities:** hard Windows/hardware qualification, recommendations that weaken endpoint security, incomplete RAVENNA recall, lossy AAF interchange, plugin compatibility fragmentation, and opaque project/plugin state internals. [C-026, C-029–C-033]
- **Overall confidence:** high for current product/edition/platform, workflow, MassCore/RAVENNA constraints, and named format support; medium for details inherited from rolling/stale KB pages; low for proprietary internals and untested host-contract fidelity.

## 2. Product identity, history, and market position

- **DOCUMENTED:** Merging joined the Sennheiser Group in 2022 and is transitioning under the Neumann brand; Neumann says Pyramix remains fully supported. [C-001]
- **DOCUMENTED:** the live family is Pyramix 16 ELEMENTS, PRO, and PREMIUM, aimed at professional music production, mastering, TV, and film post-production. [C-002, C-004]
- **DOCUMENTED:** the current v16 release documentation supersedes live product-page text that still says Windows 10/11: v16 supports Windows 11 Professional 64-bit and explicitly does not support Windows 7 or 10. [C-003]
- **INFERENCE:** Pyramix is best treated as a specialist production/mastering/post workstation, not evidence for a broad composition, notation, clip-launching, mobile, or browser DAW model. Its public feature emphasis and the absence of current composition-MIDI documentation support this bounded interpretation; a missing manual section is not proof of feature absence. [C-004, C-014]

## 3. Workflow and conceptual model

- **DOCUMENTED:** the visible model is project/timeline plus mixer, media manager/library, track groups/playlists/markers/mastering tabs, strips and buses, and separate monitoring/delivery functions. [C-005, C-011, C-012]
- **DOCUMENTED:** source/destination editing in PRO/PREMIUM aligns alternate takes horizontally or vertically and builds a master from selected material; product documentation says a recording source can appear as one track even in projects up to 128 tracks. [C-012]
- **DOCUMENTED:** clips can be grouped into reusable/versioned library items; real-time editing, asymmetric crossfades, ripple operations, clip FX, edit while recording, and take comments/ratings through media markers are exposed. [C-005, C-012]
- **INFERENCE:** the principal mental model is linear, media- and delivery-oriented rather than scenes, tracker patterns, or a public modular graph. Modular routing exists inside the mixer, but no general node-graph authoring model was documented. [C-004, C-011]

## 4. Publicly documented architecture

- **DOCUMENTED:** three engine configurations are named: Native, Native/RAVENNA ASIO, and MassCore/RAVENNA. MassCore v16 uses RTX64 4.5.4 and a MassCore runtime, allocates CPU cores through the VS3 Control Panel, and uses a Merging-supplied NET-MSC-GBEX1 PCIe Ethernet card for its RAVENNA path. [C-003, C-008]
- **DOCUMENTED:** plugin work is automatically distributed; strip plugins are processed as one stage before bus plugins as another stage. A MassCore system shows a separate VST-core load and allows the VST Engine Buffer to be raised when VST peaks occur. [C-009]
- **INFERENCE:** the evidence supports distinct real-time engine and buffered plugin scheduling domains, but it does **not** establish separate OS processes or a sandbox. An alternative is multiple scheduler/thread pools inside one address space. [C-009, C-017]
- **DOCUMENTED:** RAVENNA connection management lives partly outside the project in ANEMAN/device presets; MAD is a separate multi-client ASIO/WDM RAVENNA/AES67 driver with one ASIO sample rate at a time and licensed infrastructure options. [C-010, C-033]
- **UNKNOWN:** application process map, audio-thread implementation, graph mutation protocol, project object schema, IPC, memory ownership, lock-free strategy, and proprietary VS3 internals were not publicly documented and were not probed. [C-017, C-030]

## 5. Audio engine

- **DOCUMENTED:** Native pack limits at 1Fs/2Fs/4Fs/DXD-DSD are 48/24/12/2 I/O (ELEMENTS), 192/96/48/24 (PRO), and 256/144/72/36 (PREMIUM). Product pages advertise MassCore up to 384 I/O. Software-playback voices are documented separately from hardware I/O. [C-006]
- **DOCUMENTED:** the family handles 44.1–384 kHz and DSD256/DXD; mastering is advertised as 32-bit floating point. This does not prove every engine edge or plugin processes native 1-bit DSD. [C-007, C-023]
- **DOCUMENTED:** Native ASIO latency is variable; RAVENNA/AES67 buffers use multiples of 48 or 64 samples. MassCore exposes Ultra Low, Extra Low, and AES67-related modes; Ultra Low can generate noise on some configurations. The integrated Atmos renderer requires at least a 512-sample Native ASIO buffer or 512-sample MassCore VST buffer. [C-006, C-008, C-027]
- **DOCUMENTED:** plugin load is measured as processing time divided by audio-frame duration, rather than Windows Task Manager utilization; overload/drop indicators are user-visible. [C-009]
- **DOCUMENTED:** real-time and offline MixDown exist, and current fixes cover offline Atmos/binaural failures. [C-020, C-027]
- **UNKNOWN:** general audio-graph PDC range, tail rules, oversampling, freeze, dropout concealment, deterministic offline equivalence, and engine behavior under dynamic I/O were not specified. [C-021]

## 6. Tracks, timeline, clips, and editing

- **DOCUMENTED:** Pyramix supports real-time editing during playback/record, advanced asymmetric crossfades, clip grouping into library items, source/destination editing in PRO/PREMIUM, marker-based take logging, and large-track-count editing improvements. [C-005, C-012]
- **DOCUMENTED:** v16 can drag VS3 and VST3 mixer effects to a selected timeline clip/Clip FX tab. Custom routing, including sidechain, is discarded; VST2 cannot use this transfer. [C-019]
- **DOCUMENTED:** v16 includes ripple/delete performance work and a “No Split on Region Selection Click” command option. [C-012]
- **UNKNOWN:** lane/take-comp object schema, elastic-audio/warp model, tempo and meter depth, edit-history persistence, and exact destructive/non-destructive guarantees were not established by the retained sources. [C-030]

## 7. MIDI, sequencing, notation, and expression

- **DOCUMENTED:** MIDI is publicly evidenced for generic controller learn, MMC, MIDI Show Control, and MTC synchronization. [C-013]
- **UNKNOWN:** current Pyramix documentation retrieved in this pass did not establish MIDI recording/editing tracks, piano roll, score/notation, patterns, MIDI instruments, SysEx, MPE, per-note expression, MIDI 2.0, or sample-accurate plugin event delivery. The bounded KB search returned controller/timecode pages but no dedicated current feature page. [C-014]
- **Recommendation:** do not infer a composition-MIDI model from MIDI control/synchronization support; qualify those as separate contracts.

## 8. Routing, mixer, automation, and control

- **DOCUMENTED:** strips and buses support immersive layouts through 22.2 in ELEMENTS and 30.2 in PREMIUM; custom speaker coordinates, object beds, ambisonics, monitoring speaker sets, external inputs, and talkback are exposed. [C-011]
- **DOCUMENTED:** automation includes dynamic automation, snapshots, versioning, VCA-related functions, isolate/preview modes, and object-bus sends, although release notes record fixes in these paths. [C-011, C-020]
- **DOCUMENTED:** since v15, VS3 Dynamics/Strip Tools and compatible VST2/VST3 can use sidechains. VS3 can select all source channels, a mono mix, or one channel, and pre/post-effects pickup; VST sidechain routing also offers pre/post-effects pickup. [C-018]
- **DOCUMENTED, stale detail:** explicit channel typing governs multichannel strip/bus/plugin connections. The routing article is from 2016; v16 multichannel-layout fixes show the concern persists, but current UI details need validation. [C-018, C-020]
- **DOCUMENTED:** control includes HUI, Mackie Control, generic MIDI learn, Sony P2/9-pin, MMC, EUCON tiers, OASIS console integration, GPI/O, video/timecode sync, and RS422. Some mappings/options are separately licensed. [C-013]
- **UNKNOWN:** feedback-routing rules, arbitrary plugin auxiliary I/O, public OSC for Pyramix, and a stable remote-control SDK were not documented. [C-031]

## 9. Recording, comping, and media handling

- **DOCUMENTED:** Pyramix can run multiple simultaneous multitrack recorders, record to two locations, edit/export rough cuts while recording, and attach comments/ratings as media markers. [C-005]
- **DOCUMENTED:** product/recovery documents identify PMF, WAV/BWF, SDII, DSDIFF, DXD/DSD media paths and Media Manager/library concepts. [C-007, C-025]
- **DOCUMENTED:** PREMIUM supports multiple video tracks, Blackmagic output, and MOV/MP4/MXF codec families; v16 release notes add a single video track to ELEMENTS even though the ELEMENTS product data table still shows a dash, so the newer release note controls. [C-002, C-020]
- **DOCUMENTED:** Media Recoverer can rebuild interrupted file headers/footers and a DSDIFF tool covers DSD64/128/256, but neither can restore missing/corrupt samples and recovered tails may contain full-scale noise. [C-025]
- **UNKNOWN:** punch/loop/take-comp semantics, proxy/conform model, archive/collect workflow, and current v16 support status of the 2019 recovery utilities require qualification. [C-030]

## 10. Instruments, effects, content, and native devices

- **DOCUMENTED:** Pyramix’s architecture-relevant native processing includes the VS3 family, PanNoir integrated before the mixer panner, Final Check, dithering/noise shaping, meters, album publishing, and PREMIUM’s integrated Dolby Atmos renderer. [C-007, C-022, C-027, C-035]
- **DOCUMENTED:** VS3 capabilities are plugin-specific: published maximum rates range from 48 kHz to DXD/384 kHz and maximum channel counts vary up to 32 in the cited table. [C-023]
- **UNKNOWN:** a public native-device SDK, modulation system, synth/sampler architecture, macro/rack model, or dynamic device-chain contract was not found. [C-031]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` outside Windows means there is no current Pyramix host on that platform; it does not describe the format’s general platform capability.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE:no current host | DOCUMENTED | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Pyramix 16, all packs; current product pages | Hosted; excluded from v16 mixer-to-clip drag/drop; legacy implementation licensing is restricted | C-016, C-019, C-034; S-002, S-003, S-005, S-018 |
| VST3 | NOT_APPLICABLE:no current host | DOCUMENTED | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Pyramix 16, all packs | Hosted; ARA2 is separately advertised; current SDK 3.8+ MIT | C-016, C-019, C-034; S-002, S-003, S-005, S-018 |
| AUv2 | NOT_APPLICABLE:no current host | UNKNOWN:not claimed | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Current Pyramix 16 pages/release notes checked | No Pyramix evidence; absence is not proof of rejection | C-016; S-002–S-005 |
| AUv3 | NOT_APPLICABLE:no current host | UNKNOWN:not claimed | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Same | No evidence | C-016; S-002–S-005 |
| AAX | NOT_APPLICABLE:no current host | UNKNOWN:not claimed | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Same | EUCON/Avid control is not AAX hosting | C-013, C-016; S-003, S-015 |
| CLAP | NOT_APPLICABLE:no current host | UNKNOWN:not claimed | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Same | No evidence | C-016; S-002–S-005 |
| LV2 | NOT_APPLICABLE:no current host | UNKNOWN:not claimed | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Same | No evidence | C-016; S-002–S-005 |
| LADSPA | NOT_APPLICABLE:no current host | UNKNOWN:not claimed | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Same | No evidence | C-016; S-002–S-005 |
| DSSI | NOT_APPLICABLE:no current host | UNKNOWN:not claimed | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Same | No evidence | C-016; S-002–S-005 |
| JSFX | NOT_APPLICABLE:no current host | UNKNOWN:not claimed | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Same | No evidence | C-016; S-002–S-005 |
| DirectX/DXi | NOT_APPLICABLE:no current host | UNKNOWN:current status | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Current v16 sources only | Historical memory was not used; no current claim found | C-016; S-002–S-005 |
| Rack Extension | NOT_APPLICABLE:no current host | UNKNOWN:not claimed | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Same | No evidence | C-016; S-002–S-005 |
| Product-native/other | NOT_APPLICABLE:no current host | DOCUMENTED:VS3 and ARA2 | NOT_APPLICABLE:no current host | NOT_APPLICABLE:no current host | Pyramix 16; pack content differs | VS3 host remains; VB/Flux VS3 lifecycle is degraded. ARA2 third parties not included | C-016, C-022; S-002, S-003, S-005 |

### 11.2 Discovery, scanning, validation, and recovery

- **DOCUMENTED:** Pyramix has a VST Scanner; v16 fixed repeated VST3 scanning. The plugin cache/blacklist state is under `C:\ProgramData\Merging Technologies\Plugins`; support’s recovery procedure backs up/deletes its contents and relaunches Pyramix to rescan. [C-019, C-020]
- **DOCUMENTED:** Add Effect search includes manufacturer names. [C-019]
- **UNKNOWN:** default/custom discovery paths, cache schema, duplicate identity rules, scan-process isolation, validation criteria, automatic quarantine trigger, per-plugin re-enable UI, and scan logs. [C-017]

### 11.3 Runtime isolation and compatibility

- **DOCUMENTED:** the scheduler automatically distributes strip then bus plugin work; MassCore exposes a separately buffered VST load and recommends increasing the VST Engine Buffer on peaks. [C-009]
- **DOCUMENTED:** Pyramix itself is 64-bit-only in v16. [C-003]
- **UNKNOWN:** in-process versus helper process, crash containment, sandboxing, 32/64-bit bridging, code-signature enforcement, per-plugin architecture compatibility, and headless worker support. Crash fixes involving specific VSTs and mixer rebuilds are compatible with in-process hosting but do not prove it. [C-017, C-020]

### 11.4 Host/plugin processing contract

- **DOCUMENTED:** VST2/VST3 effects, ARA2, VS3, mixer effects, clip effects, offline MixDown, sidechains, and immersive multichannel layouts are present in bounded contexts. [C-016, C-018–C-020]
- **DOCUMENTED:** moving VS3/VST3 from mixer to clip drops custom routing/sidechains; VST2 cannot make that transition. [C-019]
- **DOCUMENTED:** the qualification list records plugin-specific DXD, Atmos layout, routing, bypass, render, and latency-compensation defects; “supported” therefore means qualified with caveats, not universal fidelity. [C-020, C-023]
- **UNKNOWN:** instruments, MIDI/event input/output, multiple main/aux buses, dynamic I/O, MPE/MIDI 2.0, sample-accurate automation, PDC range/graph rules, tail reporting, bypass/suspend semantics, and real-time/offline equivalence. [C-021]

### 11.5 Parameters, automation, state, presets, and project recall

- **DOCUMENTED:** controller drivers can auto-map active Pyramix parameters; generic/manual/XML/learn mappings exist. Plugins without a GUI can receive generic controls. [C-013, C-020]
- **DOCUMENTED:** plugin UIs follow Windows display scaling; resizing remains manufacturer/plugin dependent. [C-019]
- **UNKNOWN:** stable parameter IDs, normalized/text ranges, automation sampling, state-chunk serialization, preset/assets portability, missing-plugin placeholders, cross-format migration, and plugin-state rollback. Project backward-save behavior does not establish plugin-state fidelity. [C-021, C-024]

### 11.6 UI, diagnostics, and failure modes

- **DOCUMENTED:** custom and generic UIs exist; v16 includes Windows scaling, and current/rolling qualification notes document 4K/display, routing-page size, UI refresh, no-GUI, and plugin-open/close defects. [C-019, C-020]
- **DOCUMENTED:** failures include scan blacklist/cache corruption, plugin-caused crash/freeze, mixer-rebuild crash, offline-render muting/clicks, bypass mismatch, slow UI updates, and high-rate incompatibility. [C-020, C-023]
- **UNKNOWN:** crash-safe UI detachment, headless UI policy, plugin-specific diagnostic bundles, automatic safe mode, and recovery without deleting the whole cache. [C-017]

## 12. Extensibility and integration

- **DOCUMENTED:** OASIS integrates consoles; EUCON/HUI/Mackie/generic MIDI/9-pin/MMC/GPI/O provide external control; XML and manual mappings are used in some controller drivers. [C-013]
- **DOCUMENTED:** ARA2 is hosted, Pyramix can publish a timeline to Ovation as a cue, MTC can synchronize another DAW, and ANEMAN/MAD provide network-device integration. [C-010, C-013, C-016]
- **UNKNOWN:** no public Pyramix scripting language, general extension SDK, command API, OSC API, VS3 authoring SDK/license, remote-app protocol, or API stability contract was found. Ovation OSC documentation was not treated as Pyramix evidence. [C-031]

## 13. Project format, persistence, interoperability, and collaboration

- **DOCUMENTED:** v16 projects are not directly backward-compatible with v15; “Save Special as v15.0” is required, and integrated Atmos features do not survive that boundary. [C-024]
- **DOCUMENTED:** current edition tables list AAF/OMF and Sonic Solutions/OpenTL/FCP XML/AES31 interchange. [C-026]
- **DOCUMENTED:** AAF interchange is lossy: automation/video can be omitted, fade curves are not carried, PMF must be converted for other hosts, multichannel media often needs mono conversion, effects may need flattening, and metadata/timecode/relink behavior depends on export choices. [C-026]
- **DOCUMENTED:** RAVENNA I/O recall is incomplete; device presets plus ANEMAN connection saves provide partial reconstruction. [C-033]
- **UNKNOWN:** project container/schema, atomic saves, autosave/journaling, undo persistence, dependency manifests, missing-plugin behavior, archive/collect, cloud collaboration, version control, forward compatibility, MusicXML, DAWproject, and complete ADM round-trip semantics. [C-030]

## 14. Delivery, live, post-production, and specialized workflows

- **DOCUMENTED:** Pyramix covers album publishing with simultaneous codecs/metadata, DDP and Red Book CD in PRO/PREMIUM, SACD authoring in PREMIUM, loudness/true-peak metering, dithering/noise shaping, and 44.1 kHz through DXD/DSD256 workflows. [C-007]
- **DOCUMENTED:** PREMIUM includes 48/96 kHz Dolby Atmos ADM import/export, integrated/external rendering, object/bed/ambisonic workflows, fixed-format rerenders, binaural, and loudness monitoring. [C-011, C-027]
- **DOCUMENTED:** post/broadcast boundaries include AAF/OMF, video tracks/codecs, Blackmagic output, machine control, RS422, timecode, GPI/O, and TV/film positioning. [C-004, C-013, C-026]
- **DOCUMENTED:** the current renderer how-to says the internal renderer requires no additional renderer license beyond PREMIUM; independent generic rerenders multiply CPU cost. [C-027]
- **UNKNOWN:** final Dolby certification status is unresolved because a beta-era certification disclaimer remains embedded in the current release-note history while current sales/how-to pages do not make an explicit dated certification statement. ADR, live-performance, and formal broadcast-compliance certification were not established. [C-028]

## 15. Performance, reliability, security, and accessibility

- **DOCUMENTED:** edition/channel/sample-rate limits, frame-time load indicators, plugin-stage scheduling, track-count UI optimizations, certified network components, and per-Windows-build qualification are public. [C-006, C-008–C-010, C-012]
- **DOCUMENTED:** v16 requires uninstall/reboot for major application/runtime updates; MassCore must be removed before major Windows updates. [C-008]
- **DOCUMENTED:** MassCore is incompatible with Windows Memory Integrity, and support guidance recommends disabling UAC/Wi-Fi/Bluetooth, carefully configuring or disabling firewall/antivirus, and avoiding an active internet connection during use. These are operational/security liabilities, not recommendations for a new design. [C-029]
- **DOCUMENTED:** release notes and the qualification list show host/plugin crashes and fixes; no containment guarantee is documented. [C-020]
- **UNKNOWN:** secure update signing/rollback, telemetry/privacy, plugin trust prompts, least-privilege operation, accessibility conformance, keyboard/screen-reader coverage, localization breadth, and tested recovery objectives. [C-032]

## 16. Licensing, ecosystem, and implementation constraints

- **DOCUMENTED:** Pyramix 16 requires v16 keys. MLM binds one activation to one computer, needs internet for activation/release but not continued use, and MassCore requires product/MassCore entitlement plus runtime installation. Main-product Safenet dongle support is removed in v16; legacy Flux/VS3 authorization can still involve Safenet, cloud, or iLok. [C-029]
- **DOCUMENTED:** VST3 SDK 3.8+ is MIT-licensed; using the VST name/logo invokes Steinberg trademark guidance. VST2 SDK files may not be redistributed, and only parties that signed the VST2 agreement before October 2018 may distribute a VST2 plugin/host binary. [C-034]
- **DOCUMENTED:** hosting VST2 in Pyramix does not grant a new implementation the right to ship VST2 support. [C-034]
- **UNKNOWN:** Pyramix EULA terms, VS3 SDK/license availability, ARA licensing, Dolby certification terms, and third-party controller/protocol certification were not retrieved. No format or product name is treated as permission. [C-028, C-031]
- This section is descriptive, not legal advice.

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **High-resolution/specialist depth:** edition-scaled I/O, DXD/DSD, mastering authoring, source/destination edit, redundant capture, and immersive/ADM delivery form a coherent professional workflow. [C-005–C-007, C-011, C-012, C-027]
- **Visible engine boundaries:** Native versus MassCore, VST buffer/load, RAVENNA network, MAD driver, and ANEMAN device state make several operational domains explicit. [C-008–C-010, C-033]
- **Honest compatibility practice:** plugin qualification records “YES-But,” channel/rate limits, and failure modes rather than relying only on format logos. [C-020, C-023]

### Liabilities

- **Platform/security coupling:** Windows-only RTX64, qualified OS builds, dedicated NIC/switch constraints, and disabled Memory Integrity/UAC recommendations increase operational risk. [C-003, C-008, C-029]
- **Plugin contract gaps:** broad format claims coexist with blacklist recovery, crashes, legacy VS3 dependencies, and unknown isolation/state/PDC fidelity. [C-017, C-020–C-023]
- **Durability fragmentation:** project backward saves, AAF loss, media-only recovery, and network state outside the project weaken single-artifact portability. [C-024–C-026, C-030, C-033]

### Architecture lesson

**INFERENCE:** Pyramix is a strong reference for explicit specialist modes, qualification matrices, and deterministic-resource boundaries, but a weak clean-room reference for portable cross-platform hosting or secure-by-default process isolation. That distinction concerns suitability as an architecture reference, not product quality. [C-008–C-010, C-017, C-029]

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Support | Prerequisites/tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Different users need portability vs deterministic high I/O | Offer a portable native engine and an explicitly qualified deterministic engine profile behind one project model | C-006, C-008 | Capability negotiation; doubles test matrix; never require weakened OS security | Medium | CONDITIONAL |
| Plugin load obscures deadline risk | Measure work against frame deadline and show stage/plugin load separately from OS CPU | C-009 | Stable timing telemetry; measurement overhead | Low | CANDIDATE |
| Serial graph stages have different peak behavior | Schedule/measure strip and bus stages explicitly rather than flattening them into one CPU number | C-009 | Correct dependency graph; can hide within-stage hotspots | Medium | CANDIDATE |
| Sidechain meaning is ambiguous in multichannel projects | Persist source strip, all/mono/single-channel fold, and pre/post-FX pickup as explicit routing state | C-018 | Stable channel identities; migration rules | Low | CANDIDATE |
| High-rate/immersive support varies per plugin | Maintain a versioned qualification matrix by plugin build, rate, layout, render mode, and known defect | C-020, C-023 | Expensive certification lab; avoid “supported” as one bit | Low | CANDIDATE |
| Capture crashes can corrupt headers | Record redundantly and make media repair copy-first, format-aware, and safety-audited | C-005, C-025 | Separate volumes and repair validation; recovery cannot recreate samples | Low | CANDIDATE |
| New project features break old readers | Provide explicit backward-save/export with a loss report | C-024 | Versioned schema and downgrade transforms | Medium | CANDIDATE |
| External network state is not in the project | Store a declarative connection manifest plus device-capability snapshot, with a dry-run recall/clear plan | C-010, C-033 | Device identity/security; network topology drift | Medium | CANDIDATE |
| Renderer workflow must participate in monitoring and export | Model renderer roles (monitor/headphone/loudness/rerender) as typed bus endpoints with declared dependencies | C-027 | Licensing/certification and CPU budgeting | High | CONDITIONAL |
| Interchange logos hide loss | Export a machine-readable capability/loss report for automation, fades, media, effects, metadata, and video | C-026 | Per-peer tests; increases UX complexity | Low | CANDIDATE |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** disabling Memory Integrity/UAC or broadly disabling firewall/antivirus as an architectural prerequisite. Evidence shows it is operational guidance for this stack, not a secure default. Reopen only for an isolated appliance threat model with compensating controls. [C-029]
- **REJECTED:** a format-logo checkbox as proof of hosting fidelity. Per-plugin VST qualification and v16 fixes contradict it. [C-020]
- **REJECTED:** whole-cache deletion as the primary blacklist UX. It is useful emergency recovery but loses diagnostic precision and per-plugin control. [C-019]
- **REJECTED:** copying proprietary MassCore, VS3, OASIS, project, or PanNoir expression. Only public behavioral boundaries and clean-room problem statements are transferable. [C-008, C-031, C-035]
- **REJECTED:** splitting project and network state without a first-class aggregate manifest; Pyramix documents incomplete connection recall. [C-033]
- `CURIOSITY_NO_GO` — **Dolby certification archaeology:** contradictory public text remains; only a dated Neumann/Dolby certification statement would resolve it. More general search was unlikely to change architecture and was rate-limited.
- `CURIOSITY_NO_GO` — **PDC/state internals:** very high relevance but public pages expose only defects, not a contract. Next evidence must be a manual passage or dynamic canary suite.
- `CURIOSITY_NO_GO` — **MIDI composition/notation:** lower relevance to Pyramix’s evidenced specialization; controller/MTC search did not justify another broad pass.
- `CURIOSITY_NO_GO` — **proprietary project schema/VS3 SDK:** public evidence is absent; reverse engineering would violate this wave’s boundary.
- `CURIOSITY_NO_GO` — **historical Mykerinos/DirectX behavior:** stale and outside the current v16 decision.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary result | Counterevidence/next probe |
| --- | --- | --- |
| H1: MassCore is only a low-latency ASIO preset | **FALSIFIED.** It uses RTX64, assigned cores, a runtime, dedicated NIC, and qualified OS/BIOS/security constraints. [C-008] | Measure end-to-end scheduling and failure domains on a disposable turnkey system. |
| H2: MassCore processes all plugins in the same deterministic domain | **NOT SUPPORTED.** A separate VST buffer/load indicator is documented. [C-009] | Instrument a canary VST under Native and MassCore at several VST buffers. |
| H3: VS3 was removed in v16 | **FALSIFIED.** Hosting remains advertised; specific VB/Flux VS3 lines are legacy/unavailable. [C-022] | Enumerate a clean v16 install by pack without running third-party binaries. |
| H4: Pyramix 16 currently supports Windows 10 | **FALSIFIED by newer scope.** Product cards say 10/11, but v16 installer notes explicitly reject Windows 10. [C-003] | None unless vendor revises release notes. |
| H5: “VST3 supported” means full host-contract fidelity | **FALSIFIED.** scanner, layout, UI, render, crash, bypass, sidechain-transfer, and PDC defects are documented. [C-019–C-021] | Canary suite: scan failure, sidechain, multi-output, latency impulse, tails, offline render, state and UI. |
| H6: format accepted = scanned = instantiated = fully works | **FALSIFIED as an equivalence.** Separate scanner/blacklist and per-plugin qualification states exist. [C-019, C-020] | Record four distinct outcomes in later qualification. |
| H7: current Atmos exports are certified for release | **UNRESOLVED.** Current operation is documented; certification completion is not. [C-027, C-028] | Obtain dated vendor/Dolby certificate or written support statement. |
| H8: a v16 project is self-contained | **FALSIFIED for complete system recall.** RAVENNA connection state is only partly recalled externally. [C-033] | Archive/restore a project, ANEMAN file, device presets, plugins, and assets on a clean system. |
| H9: high-resolution project support means every plugin is safe at DXD/DSD | **FALSIFIED.** limits are per plugin and clip FX on DSD media in DXD has a loud-noise warning. [C-023] | Safety-limited high-rate render matrix with attenuated fixtures. |

No `OBSERVED` claims are made; no product binaries were executed.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Merging joined Sennheiser in 2022, is transitioning under Neumann, and Pyramix remains supported. | Current vendor provenance | S-001 | Direct current Neumann statement | No independent corporate-history audit |
| C-002 | DOCUMENTED | High | Current family is Pyramix 16 ELEMENTS/PRO/PREMIUM; public v16.0.5 and Hotfix 1 docs exist. | 2026 public snapshot | S-001–S-005 | Live catalog plus release hub | Hotfix installer build number not explicit |
| C-003 | DOCUMENTED | High | Current v16 is 64-bit Windows 11 Professional only; Windows 7/10 unsupported. | Pyramix 16 | S-005 | Newer installer notes control | Live product cards still say Windows 10/11 |
| C-004 | DOCUMENTED | High | Target workflows are music production, mastering, TV and film post. | Pyramix 16 | S-002, S-003 | Direct product description | Marketing positioning, not market-share evidence |
| C-005 | DOCUMENTED | High | Multiple recorders, dual-location recording, edit while recording, take markers and rough-cut export are offered. | Pyramix 16 | S-002, S-003 | Direct workflow sections | Runtime durability not independently tested |
| C-006 | DOCUMENTED | High | Native I/O scales by pack/rate; MassCore is advertised up to 384 I/O; ASIO latency/buffers vary. | Pyramix 16 | S-002, S-003, S-005, S-006 | Product data plus release notes | Exact MassCore count by rate not fully retrieved |
| C-007 | DOCUMENTED | High | 44.1–384 kHz, DXD/DSD256, 32-bit-float mastering and tiered DDP/CD/SACD/loudness features are claimed. | Pyramix 16 | S-002, S-003 | Direct product data | Does not prove all processing is native DSD |
| C-008 | DOCUMENTED | High | MassCore uses RTX64 4.5.4, core allocation, qualified CPU/OS/BIOS settings and a dedicated NET-MSC-GBEX1 RAVENNA NIC. | v16 MassCore | S-005 | Current installation/technical notes | Proprietary scheduler internals unknown |
| C-009 | DOCUMENTED | High | Plugin work is auto-distributed strip stage then bus stage; frame-time load and separate VST load/buffer are exposed. | v16 engine | S-005, S-006 | Current “Plugin Engine Notice” | Thread/process topology unknown |
| C-010 | DOCUMENTED | High | RAVENNA uses a dedicated qualified network/ANEMAN; MAD is multi-client ASIO/WDM with one ASIO rate and licensed infrastructure options. | v16 network/audio driver | S-005 | Current technical notes | MAD 4.0 future note not treated as delivered |
| C-011 | DOCUMENTED | High | Mixer supports 22.2/30.2, objects, ambisonics, custom speakers, monitoring, and dynamic/snapshot automation/versioning. | Pyramix 16 by pack | S-002, S-003, S-005 | Product pages and fixes | Exact automation data model unknown |
| C-012 | DOCUMENTED | High | Real-time/source-destination editing, library clip groups, crossfades, ripple and large-track improvements are present. | Pyramix 16 | S-002, S-003, S-005 | Direct edit sections/release notes | Take/undo schema unknown |
| C-013 | DOCUMENTED | High | HUI/Mackie/MIDI/P2/MMC/MTC/EUCON/OASIS/GPI/O control paths are documented and may be edition/key dependent. | Current plus rolling controller matrix | S-002, S-003, S-015, S-016 | Product data and controller matrix | Some matrix entries are old devices |
| C-014 | UNKNOWN | Medium | Composition MIDI, notation, MPE, MIDI 2.0, SysEx and sample-accurate events were not established. | Current Pyramix | S-004, S-015, S-016 | Bounded official search was negative | Absence from retrieved docs is not non-support |
| C-015 | INFERENCE | Medium | Public boundaries imply timeline/mixer, real-time, buffered-plugin, driver/network and external-device state domains. | Architecture interpretation | S-002, S-003, S-005 | Derived from C-008–C-010 and C-033 | Could share processes/threads internally |
| C-016 | DOCUMENTED | High | Current Windows host claims VST2, VST3, VS3 and ARA2. Other required formats were not claimed. | Pyramix 16 | S-002, S-003, S-005 | Current product/release docs | Logos do not prove full contract; absence is unknown |
| C-017 | UNKNOWN | High | Plugin process isolation, sandbox, bridge, signing, validation and detailed quarantine are unpublished. | Pyramix 16 host | S-005, S-008, S-009 | Current docs expose failures, not topology | Dynamic/process inspection required |
| C-018 | DOCUMENTED | High | v15+ sidechains support VS3 and compatible VST2/3 with multichannel fold/selection and pre/post-FX pickup. | Pyramix 15+ | S-010, S-011 | Current sidechain page; stale routing support | Arbitrary aux I/O not established |
| C-019 | DOCUMENTED | High | Scanner/cache, Add Effect search, Windows UI scaling, VS3/VST3 mixer-to-clip transfer and routing loss are documented. | Pyramix 16 | S-005, S-009 | Current release/support pages | Scan criteria/path set unknown |
| C-020 | DOCUMENTED | High | Qualification/release notes record VST/VS3 crashes, UI, bypass, layout, rendering, PDC and high-rate defects. | Rolling list through v16 | S-005, S-008 | Primary vendor qualification/fix records | Some plugin entries date to older releases |
| C-021 | UNKNOWN | High | Complete PDC/tails, event buses, dynamic I/O, sample-accurate automation, parameter/state/preset and missing-plugin contracts are unpublished. | Pyramix 16 host | S-005, S-008–S-010 | Defects do not define the general contract | Requires manual passage or canary tests |
| C-022 | DOCUMENTED | High | VS3 hosting remains, but VB VS3 is legacy/unsupported and Flux users are directed to VST3 in v16. | Pyramix 16 | S-002, S-003, S-005, S-007 | Current product and release/license notes | Exact pack-by-pack VS3 install inventory unknown |
| C-023 | DOCUMENTED | Medium | High-rate/plugin channel support is per plugin; DXD/DSD clip-FX and metering limitations exist. | v16 plus 2023 VS3 table | S-005, S-014 | Current warning plus stale-but-specific matrix | Table predates v16; requalification needed |
| C-024 | DOCUMENTED | High | v16 projects need Save Special v15 for backward use; new Atmos features are not backward-compatible. | v16→v15 | S-005 | Direct installation note | Other migration versions not fully mapped |
| C-025 | DOCUMENTED | Medium | Media/DSDIFF recovery rebuilds wrappers but not lost samples and can leave noisy tails. | 2019 tools/current relevance unknown | S-012 | Direct recovery instructions | Current v16 utility support not confirmed |
| C-026 | DOCUMENTED | High | AAF/OMF/advanced interchange is offered, but AAF loses or remaps automation, fades, effects, video/media and metadata depending on settings. | Current capability plus 2022 guide | S-002, S-003, S-013 | Product table and workflow details | Peer versions may change behavior |
| C-027 | DOCUMENTED | High | PREMIUM’s internal Atmos renderer is a typed bus plugin supporting monitoring, binaural, loudness, offline/real-time and rerenders. | Pyramix 16 PREMIUM | S-003, S-005, S-017 | Current product/how-to/release docs | Operational docs are not certification evidence |
| C-028 | UNKNOWN | High | Final Dolby certification/release authorization is not resolved by public evidence retained. | Pyramix 16 | S-003, S-005, S-017 | Beta disclaimer conflicts with current omission | Dated Dolby/Neumann statement needed |
| C-029 | DOCUMENTED | High | Licensing is machine-bound MLM; MassCore has extra entitlement/runtime; security guidance disables important Windows protections. | Pyramix 16 | S-005–S-007 | Current install/license/support notes | Threat model and EULA not retrieved |
| C-030 | UNKNOWN | High | Project schema, atomic save, autosave/journal, undo persistence, collect/archive and full crash recovery are unpublished. | Pyramix 16 | S-005, S-012, S-013 | Migration/media repair do not prove project durability | Safe project corpus/probe required |
| C-031 | UNKNOWN | Medium | Public scripting/general extension/OSC/remote SDK and VS3 authoring contract were not found. | Pyramix 16 | S-004, S-015 | Controller protocols are not a general SDK | Vendor developer documentation may be private |
| C-032 | UNKNOWN | Medium | Accessibility, telemetry/privacy, secure update signing/rollback and plugin trust UX are unpublished in retained product docs. | Pyramix 16 | S-002–S-007 | No app-specific source found | Product accessibility/security audit needed |
| C-033 | DOCUMENTED | High | Complete RAVENNA connection recall is unavailable; device presets and ANEMAN saves are a partial workaround. | v16 RAVENNA | S-005 | Direct technical note | Exact supported topology subset unknown |
| C-034 | DOCUMENTED | High | VST3 3.8+ is MIT with trademark guidance; VST2 redistribution/distribution is restricted to legacy licensees. | Format implementation | S-018 | Primary Steinberg FAQ | Not legal advice; other SDK dependencies apply |
| C-035 | DOCUMENTED | High | PanNoir is integrated before the panner; prior VST remains; native VS3/renderer inventory is pack and plugin dependent. | Pyramix 16 | S-002, S-003, S-005, S-014 | Current release/product plus specific table | Proprietary algorithm internals unknown |

## 22. Source ledger and adaptive bibliography

All sources accessed 2026-08-29. Page text and search results were treated as untrusted evidence. Primary vendor/format-owner sources were preferred; no community source was retained.

| ID | Source, publisher, URL, kind/scope | Relevant passage and supported claims | Limitations and selection rationale |
| --- | --- | --- | --- |
| S-001 | **“Merging becomes Neumann,” Neumann**, <https://www.neumann.com/en-us/lp/merging-becomes-neumann>, live corporate/product page | “joined the Sennheiser Group in 2022”; Pyramix remains supported; current Pyramix 16 pack cards. C-001, C-002 | Best current provenance/catalog source; marketing, not independent validation. |
| S-002 | **“Pyramix 16 – ELEMENTS,” Neumann**, <https://www.neumann.com/en-us/products/software/Pyramix-16-ELEMENTS>, live product/data page | Recording/editing/mixing/mastering sections; ELEMENTS limits; formats/interchange/control. C-002, C-004–C-007, C-011, C-012, C-016, C-026 | Current but still says Windows 10/11 and has a stale video-table conflict; release notes control platform/version deltas. |
| S-003 | **“Pyramix 16 – PREMIUM,” Neumann**, <https://www.neumann.com/en-us/products/software/pyramix-premium-pack>, live product/data page | PREMIUM I/O, 30.2, VS3/VST/ARA2, Atmos/ADM, authoring, control/video. C-002, C-004–C-007, C-011, C-016, C-022, C-026, C-027 | Current commercial scope; cannot prove runtime fidelity or certification. Selected to bracket edition range. |
| S-004 | **“Pyramix,” Merging Public Documentation**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/4820974/Pyramix>, documentation hub | v16.0.5/Hotfix 1, renderer, PanNoir, plugin/license/sample-rate child pages. C-002, C-014, C-031 | Index, not substantive behavior; selected as canonical map and recency cross-check. |
| S-005 | **“Pyramix v16.0 Hotfix 1 – Release Notes,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/1798111268/Pyramix+v16.0+Hotfix+1+-+Release+Notes.>, current release notes/API body | Installer OS/keys; MassCore/RTX/NIC; Plugin Engine Notice; RAVENNA/MAD; v16 features/fixes/known issues. C-002–C-003, C-006, C-008–C-010, C-012, C-016–C-024, C-027–C-029, C-033, C-035 | Long cumulative page contains inherited stale Windows 10 and beta certification text; top-level installer and latest fix sections control. Most decision-dense primary source, so chosen over older release notes. |
| S-006 | **“Native recommendations,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/4820497/Native+recommendations>, support guide, updated 2023-08-18 | ASIO/RAVENNA buffer multiples, CPU-risk indicator, system/security tuning. C-006, C-009, C-029 | Predates v16; Windows 10 content is stale. Selected for explicit Native buffer/load semantics. |
| S-007 | **“Merging License Manager (MLM) for Pyramix-Ovation,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/855572481/Merging+License+Manager+MLM+for+Pyramix-Ovation>, current licensing guide | One-computer activation, internet activation/release, MassCore keys/runtime, Flux VS3 authorization. C-022, C-029 | Page heading displays update month/day without year; some upgrade examples name Pyramix 15. Selected over generic store terms because it describes technical enforcement. |
| S-008 | **“Third Party VST Plugins support,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/4817842/Third+Party+VST+Plugins+support>, qualification list, updated 2024-08-09 | VST2/VST3 per-vendor support, DXD/Atmos layouts, bypass/UI/crash/routing/PDC/render defects. C-020, C-021, C-023 | Rolling list starts at v11.1 and mixes plugin generations; not a v16 conformance suite. Selected because it disproves logo-level support assumptions. |
| S-009 | **“Plugins cannot be scanned or are Blacklisted,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/650084369/Plugins+cannot+be+scanned+or+are+Blacklisted>, troubleshooting, updated 2024-10-01 | Cache path, backup/delete/relaunch/rescan procedure. C-017, C-019 | Does not explain scan criteria, logs, process isolation, or per-plugin UX. Only direct public scanner-recovery source found. |
| S-010 | **“Pyramix Side-Chain,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/4818311/Pyramix+Side-Chain>, current how-to | v15+ VS3/VST2/VST3 sidechains; channel fold/selection; pre/post-FX source. C-018 | Update year omitted; no arbitrary aux/event-bus contract. Selected for direct current behavior. |
| S-011 | **“Mixer: Bus / Plugins signal routing,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/4817259/Mixer+Bus+Plugins+signal+routing>, troubleshooting, 2016-11-17 | Channel typing controls multichannel bus/plugin routing. C-018 | Stale v10 UI; retained only as historical architecture detail triangulated by v16 layout fixes. |
| S-012 | **“Media Recoverer,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/4817292/Media+Recoverer>, recovery guide, 2019-10-15 | Header/footer reconstruction, WAV/BWF automatic recovery history, DSDIFF, unrecoverable data/noisy-tail limits. C-025, C-030 | Utility/current-v16 compatibility unconfirmed; selected because it explicitly bounds recovery rather than advertising it. |
| S-013 | **“AAF Interchange recommendations,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/4819043/AAF+Interchange+recommendations>, how-to, updated 2022-07-28 | Embedded/linked media, PMF conversion, automation/video/fade/effect/metadata/relink loss. C-026, C-030 | Peer versions can change; selected over feature table because it describes semantic loss. |
| S-014 | **“VS3 Plugins supported sampling rates,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/4820429/VS3+Plugins+supported+sampling+rates>, compatibility matrix, updated 2023-01-25 | Per-plugin max sample rate/channel count. C-023, C-035 | Predates v16 and includes Flux/VB lines now legacy; retained as stale, specific evidence only. |
| S-015 | **“Pyramix / Ovation Supported Controllers,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/4817246/Pyramix+Ovation+Supported+Controllers>, rolling controller matrix | HUI/Mackie/proprietary/MIDI/P2/MMC/MSC, mapping modes and option keys. C-013, C-014, C-031 | Many legacy devices; update year omitted. Selected as redirected canonical matrix. |
| S-016 | **“Synchronise Pyramix with a DAW … through MTC,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/4818632/Synchronise+Pyramix+with+a+DAW+on+another+computer+through+MTC>, how-to, 2018-02-21 | MTC over a separate Ethernet/MIDI network. C-013, C-014 | Stale peer versions; proves synchronization boundary, not sequencing. |
| S-017 | **“Dolby Atmos Internal Renderer – How to,” Merging**, <https://merging.atlassian.net/wiki/spaces/PUBLICDOC/pages/1588559875/Dolby+Atmos+Internal+Renderer+-+How+to>, Pyramix 16 how-to | PREMIUM license, bus-plugin roles, real-time/offline, binaural/loudness/rerender processing. C-027, C-028 | No explicit dated certification statement; selected for current operational topology. |
| S-018 | **“Licensing,” Steinberg VST 3 Developer Portal**, <https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html>, format-owner developer/license FAQ, 2026 portal | VST3 MIT obligations/trademark guidance; VST2 file redistribution and pre-Oct-2018 license restriction. C-034 | Descriptive legal primary source, not legal advice; third-party frameworks may add terms. Preferred to secondary summaries. |

### Negative/access results retained

- Official-domain web search was rate-limited with `HTTP 429` in two batches.
- `https://www.merging.com/downloads` returned `403`; the Neumann file finder rendered no file rows to text retrieval.
- The official bounded search for Pyramix MIDI/MPE/notation returned controller/timecode/release pages but no dedicated current composition-MIDI page.
- Official KB search returned no dedicated current PDC/state-contract page in the first result batch.
- No dated primary Dolby/Neumann certification-completion statement was retrieved.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted method/blocker | Impact | Safest next probe / fixture | Owner |
| --- | --- | --- | --- | --- |
| Plugin process/sandbox/crash boundary | Current release, scanner, qualification and KB pages; no topology statement | Security and host resilience | Disposable Win11 VM/system; process tree, controlled crashing VST3, dump/log capture; no proprietary disassembly | Unassigned |
| Discovery paths, identity, validation, quarantine/logs | Scanner cache article only; no schema/criteria | Diagnosability and duplicate/migration behavior | Signed benign VST3 fixtures with duplicate IDs, bad modules and moved paths; record scanner UI/files/logs | Unassigned |
| PDC, tails, bypass/suspend, offline equivalence | Qualification defects and fix notes only | Timing/render correctness | Impulse/tail canary plugins across strip/bus/sidechain/clip, Native/MassCore, real-time/offline | Unassigned |
| Plugin parameters/state/presets/missing-plugin recall | No general host contract or project schema | Project durability | Stateful VST3 fixture with parameter-ID/version migration, external asset, missing/reinstalled versions | Unassigned |
| Multi-output, event I/O, instruments, dynamic buses, MPE/MIDI 2.0 | Current pages name effects/sidechain only | Composition and full VST3 compliance | Capability-enumerating VST3 instrument/effect fixtures and event timing capture | Unassigned |
| Project schema/autosave/atomicity/journal/collect | Migration and media repair are public; format internals proprietary | Crash recovery and portability | Vendor manual/support response or safe crash/power-loss corpus on disposable media | Unassigned |
| Current Dolby certification | Current operation plus inherited beta disclaimer; no dated certificate | Release authorization/compliance | Written Neumann/Dolby confirmation identifying version/build and permitted deliverables | Unassigned |
| Current recovery-tool compatibility | Recovery page is 2019 | Capture safety | Vendor confirmation, then truncated WAV/BWF/PMF/DFF copies in a non-production fixture | Unassigned |
| Non-VST/VS3 required formats | Current pages/release/KB did not claim them | Format roadmap comparison | Vendor support matrix request; do not infer from absence | Unassigned |
| Pyramix scripting/OSC/SDK/accessibility/privacy/update security | No app-specific public source retained | Extensibility, compliance, operations | Vendor questionnaires plus keyboard/screen-reader and signed-update audit | Unassigned |
| Complete MassCore versus Native failure/latency boundary | Public modes and buffers, no independent measurement | Engine architecture choice | Qualified hardware lab with loopback, overload, NIC loss and plugin-fault fixtures | Unassigned |

## 24. Curiosity pass and stop decision

Scores use 1 (low) to 5 (high); cost 1 is cheap and 5 expensive.

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Full v16 release-note technical body: MassCore/plugin/RAVENNA | 5 | 5 | 5 | 2 | **PURSUED.** Changed the conclusion to distinct RTX64/core/network and buffered-plugin domains. |
| PDC/state/process isolation canary qualification | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: dynamic phase, not documentary wave. |
| Dolby certification archaeology | 4 | 3 | 3 | 4 | `CURIOSITY_NO_GO`: contradictory public text; only direct dated statement is discriminating. |
| Proprietary project schema/VS3 internals | 4 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: public evidence absent; clean-room/authority boundary. |
| Composition MIDI/MPE/notation | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: lower relevance; bounded search negative. |
| Historical Mykerinos/DirectX versions | 1 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: stale and outside current scope. |

**Stop decision:** `STOP_COVERAGE_AND_SATURATION`. Every template section and required plugin row is complete or explicitly unknown; current identity/platform/editions, MassCore/RAVENNA, workflow, mixer/automation, plugin scanning/sidechain/UI/failure, high-resolution/immersive delivery, persistence/interchange/recovery, control, licensing, and security are covered by primary sources. Repeated release/KB pages were duplicative, file/search access was partly blocked, and the remaining high-value questions need direct vendor statements or dynamic fixtures. Another documentary pass has nonpositive expected marginal evidence within the assigned budget.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created `research/daw-landscape/dossiers/merging-pyramix.md`; no shared/sibling path was edited.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See §0–2.
- [x] **Every required dossier heading exists in order.** Headings §0–25 are present.
- [x] **Every material assertion has a claim ID and classification.** Substantive findings use `DOCUMENTED`, `INFERENCE`, or `UNKNOWN` and resolve through §21; no `OBSERVED` claim is made.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See §§21–23.
- [x] **Every required plugin-format row is present.** See §11.1; no blank status cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** See §11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Vendor claims are not treated as independent runtime tests.
- [x] **Licensing and clean-room boundaries are explicit.** See §0, §16, §19.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §19 and §24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** No product/plugin binary was downloaded or run; only public pages/APIs were read.
- [x] **Pre-existing workspace changes were left untouched.** Initial `git status --short` showed unrelated modified/untracked paths across `apps/mobile`, `vendor/crafty`, `bun.lock`, and the untracked research tree; none was modified by this dossier task.

**Checks performed:** template-heading audit; mandatory-format row audit; claim/source resolution audit; stale/current contradiction audit; curiosity/stop audit; owned-path and no-stage/no-commit audit. **Unresolved blockers:** public plugin/process/state contract, current Dolby certification statement, app-specific accessibility/security/privacy data, and dynamic qualification fixtures.
