# Steinberg Cubase DAW dossier

> Research-only evidence. No design or implementation authority. Public clean-room research only; vendor statements document vendor claims, not independent runtime qualification.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Steinberg Cubase desktop family |
| Canonical vendor | Steinberg Media Technologies GmbH |
| Researcher/session | Subagent in session `ses_fb275c856ffeUzTHVbFtOoBgr2` |
| Owned path | `research/daw-landscape/dossiers/steinberg-cubase.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current evidenced release | Cubase 15.0.30, updated 2026-06-03; Cubase 15 first released 2025-11-05 [C-001] |
| Editions in family | Pro, Artist, Elements, AI, LE; one application installer, license selects edition [C-001] |
| Platforms | macOS 14/15/26 on Intel and Apple silicon; Windows 10/11 x64; Windows 11 on Arm as documented [C-001] |
| Included | Current desktop Cubase family; historical Cubase host lineage only where necessary to explain current VST/bridging behavior |
| Excluded | Nuendo (separate dossier); Cubasis (only cited as a clearly labeled DAWproject interchange boundary); product installation, binary inspection, and proprietary implementation claims |
| Completion | `COMPLETE_WITH_UNKNOWNS` |

**Decision and sufficient-coverage rule.** The question is which publicly documented Cubase workflow, audio-engine, persistence, and plug-in-host patterns are credible clean-room references for a new cross-platform DAW. Coverage is sufficient when every template section and plug-in row has an evidence-backed or explicit `UNKNOWN` result, VST2/VST3 lineage and current architecture constraints are distinguished, and proprietary internals are not guessed.

## 1. Executive summary

- **Current family.** Steinberg documents Cubase 15.0.30 across five licensed editions and macOS, Windows x64, and Windows on Arm; feature parity by edition was not fully retrievable [C-001, C-029].
- **Host lineage.** VST began at Steinberg in 1996, VST2 added instruments in 1999, and VST3 arrived with Cubase 4-era hosting in 2008. Cubase has supported VST3 Note Expression since Cubase 6 [C-002, C-014].
- **Current VST2 status.** VST2 remains loadable in Cubase 14/15 but is disabled by default. It requires the whole host under Rosetta on Apple silicon and is unavailable in native Apple-silicon mode and Windows on Arm. Steinberg's 2022 prediction of VST3-only hosts within 24 months did not occur on schedule [C-003, C-004, C-027].
- **Scanning versus runtime isolation.** Plug-in Sentinel documented scan-time crash containment and blocklisting from Cubase 9. The separate-process VST Bridge ended after Cubase 8.5. Current guidance says third-party VST3 behavior can freeze or crash the application; no current universal per-instance sandbox is documented [C-007, C-009, C-010].
- **Architecture model.** Current public evidence describes a hybrid engine: live/monitored paths run against the interface buffer while eligible playback paths are preprocessed through a larger ASIO-Guard buffer. Exact thread pools, graph representation, process topology, and project schema remain proprietary/unknown [C-019, C-028].
- **VST3 contract.** Public SDK documents dynamic audio/event buses, sidechains, multi-output, sample-offset automation, note-ID expression, opaque state streams, optional scalable views, latency/tail reporting, and offline-use semantics. These are format capabilities; only specifically cited Cubase behavior is treated as implemented [C-012–C-018].
- **Interchange.** All Cubase 15 editions accept DAWproject, but Steinberg documents meaningful exchange limitations; `.cpr` internals and missing-plug-in persistence are unknown [C-022–C-024].
- **Legal boundary.** The current VST3 SDK code is MIT-licensed. That does not grant trademark/certification rights. Current ASIO SDK and legacy/new VST2 developer terms were not retrievable and require counsel/vendor verification [C-025, C-026].

**Overall confidence:** high for current release/platform/VST2 restrictions, VST3 public contracts, historical bridge scope, ASIO-Guard, and DAWproject; medium for current scanning lineage; low/unknown for proprietary runtime/process/project internals and unlisted plug-in formats.

## 2. Product identity, history, and market position

Cubase is Steinberg's maintained desktop DAW family. The current download record identifies 15.0.30 and the Pro, Artist, Elements, AI, and LE license-selected editions [C-001]. Its publicly documented VST lineage is unusually direct: Steinberg introduced VST in 1996, VST2 instruments in 1999, and VST3 in 2008; Cubase 4-era Steinberg sequencers shipped a new VST3 plug-in set [C-002].

The dossier does not transfer Nuendo's post-production claims to Cubase, even where Steinberg support pages cover both products. Cubasis appears only in the DAWproject exchange source and is not treated as part of Cubase's desktop architecture [C-023]. Edition-specific track counts, bundled devices, and advanced feature limits are `UNKNOWN` because the live comparison page produced only a client shell [C-029].

## 3. Workflow and conceptual model

The DAWproject boundary directly evidences a project composed of instrument, audio, effect, and group tracks; named/colorized events; audio gain/fades/transpose/time-stretch; MIDI notes and controllers; insert/send effects; tempo and signature tracks [C-022]. This supports a **linear track/event/timeline plus mixer** conceptual model. It does not expose Cubase's internal graph or every native editor.

Cubase's import path can map generic devices and selected Steinberg instruments/effects to VST3 instances. Exchange is capability-negotiated rather than lossless: automation, multiple outputs, folders, markers, MIDI effects, video, and scenes are among documented gaps in the Cubasis exchange scope [C-023]. Those gaps are not claims that Cubase lacks the corresponding native feature.

## 4. Publicly documented architecture

The strongest public engine disclosure is ASIO-Guard: a hybrid two-path engine with high-priority, interface-buffer processing for monitored/record-enabled/external paths and larger-buffer prefetch processing for eligible playback paths; tracks switch paths when monitoring/record enable changes [C-019]. VST Module Architecture is documented as the basic plug-in-support layer used by Steinberg hosts [C-011].

Plug-in Sentinel historically isolated initial scanning failures from the Cubase application, while the obsolete VST Bridge isolated bridged execution in a separate process [C-007, C-010]. No current source documents per-plugin process workers, IPC, sandbox policy, or universal runtime crash recovery; current crash guidance is compatible with in-process execution but does not by itself prove one topology [C-009].

**UNKNOWN:** graph data structure, scheduler/thread-pool design, memory model, cache schema, project schema, service boundaries, and exact current plug-in process topology are proprietary. No inference here should be used as an implementation description [C-028].

## 5. Audio engine

- **Scheduling:** real-time and ASIO-Guard/prefetch paths are documented, with Low/Normal/High Guard levels and ineligibility for monitored, record-enabled VSTi/MIDI, external I/O, and certain plug-ins [C-019].
- **Diagnostics:** Steinberg documents real-time, ASIO-Guard, and peak load histories plus dropout analysis [C-019].
- **Driver boundary:** Steinberg describes ASIO as its Windows low-latency driver standard and provides a built-in driver for Windows x64/Arm; this does not establish macOS driver internals [C-020].
- **Plug-in latency/tails:** VST3 processors report current latency and tail in samples and signal latency changes; the host may use tail data for offline processing/optimization/downmix [C-018]. Exact Cubase delay-compensation topology and limits were not found.
- **Silence suspension:** Cubase has a default preference to suspend VST3 processing when no audio arrives, but Steinberg's 2026 workaround disables it for a known class of overload/freeze/crash issues [C-021].

**UNKNOWN:** internal mix precision, supported sample-rate ceiling, block coalescing, oversampling policy, multicore partition algorithm, feedback-loop policy, dropout recovery, render determinism, and live/offline equivalence.

## 6. Tracks, timeline, clips, and editing

DAWproject exchange documents audio/instrument/effect/group tracks and events with names, colors, mute, fades, gain reduction, pitch shift, and time stretch, plus tempo/signature tracks [C-022]. This is direct evidence of corresponding interchange objects, not a complete native-editing specification.

**UNKNOWN from accessible current primary sources:** complete track-type inventory by edition, comp lanes/takes, non-destructive edit representation, warp algorithm ownership, ripple modes, undo/history persistence, track-version semantics, and navigation limits. Product and current manual pages were client-rendered and inaccessible [C-029].

## 7. MIDI, sequencing, notation, and expression

DAWproject exchange includes MIDI notes, CC, pitch bend, aftertouch, and program change [C-022]. VST3 Note Expression addresses a note by `noteId`; Steinberg states Cubase has supported the optional VST3.5 feature since Cubase 6 [C-014]. This is distinct from ordinary channel MIDI and from MPE wrapper translation.

VST3 supports audio and event buses, potentially multiple event inputs/outputs, and the SDK now contains MIDI 1/2 mapping interfaces, but **Cubase 15 adoption of every optional MIDI 2.0 or MPE interface is UNKNOWN** [C-012, C-029]. Current score-editor, SysEx, clock/MTC, articulation-map, and notation limits were not established through accessible sources.

## 8. Routing, mixer, automation, and control

The VST3 contract permits main/aux audio and event buses, sidechains, multiple instrument outputs, dynamic activation, and channel-arrangement negotiation. Steinberg's developer documentation includes Cubase/Nuendo-specific mono-in/stereo-out behavior and a Cubase sidechain example, establishing at least some concrete host implementation [C-012, C-013].

VST3 parameter queues are keyed by `ParamID` and carry normalized values and sample offsets/curve points within the process block. This is a mandatory format mechanism for sample-position automation delivery, but exact Cubase thinning, interpolation modes, write/read UX, and optional-interface coverage remain unqualified [C-015].

DAWproject exchanges insert/send effects but documents automation and multiple-output gaps in the cited Cubasis path [C-023]. VCA/folder semantics, feedback routing, surround/immersive ceiling, control-surface protocols, OSC, MIDI Remote, and remote API details are `UNKNOWN` in this documentary pass.

## 9. Recording, comping, and media handling

The exchange boundary demonstrates audio events, fades, gain, pitch shift, time stretch, and embedded/mapped track data [C-022, C-023]. It also records sample-rate mismatch and time-stretch variability as known interoperability issues in older Cubase 14 exchange [C-023].

**UNKNOWN:** current punch/loop recording implementation, monitoring modes, take/comp data model, media pool schema, proxy/conform behavior, relinking heuristics, supported media-codec matrix, broadcast metadata, and video engine internals. Nuendo-specific post features are deliberately excluded.

## 10. Instruments, effects, content, and native devices

The Cubase 15 download record distributes HALion Sonic, Groove Agent SE, content sets, and `.vstsound` libraries by edition; VST Sound is content packaging rather than a third-party executable plug-in ABI [C-001]. DAWproject can map selected Steinberg/Cubasis devices to HALion Sonic, Retrologue, RoomWorks SE, and generic device representations [C-023].

ARA is explicitly supported by Cubase's Windows-on-Arm build, including a documented SpectraLayers x64 ARA loading case under Arm64EC [C-011]. ARA is an extension/integration boundary, not evidence for AU/AAX/CLAP hosting.

Native device-chain internals, modulation architecture, macro serialization, and complete inventory by edition are outside accessible evidence and remain `UNKNOWN`.

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` below means no qualifying Steinberg source was found; it is not a positive unsupported-format test. Linux and mobile/web cells are `NOT_APPLICABLE` because the evidenced Cubase 15 desktop product has no such build [C-001].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **DOCUMENTED:** Rosetta-host mode only on Apple silicon; disabled by default | **DOCUMENTED:** x64 may be enabled; unavailable on Windows on Arm | `NOT_APPLICABLE:no Cubase 15 Linux build` | `NOT_APPLICABLE:desktop scope` | Cubase 14/15 family; per-edition differences `UNKNOWN` | Transitional; immediate scan on enable; removal release not fixed | C-003, C-004; S-002, S-005, S-006 |
| VST3 | **DOCUMENTED:** native host accepts Apple-silicon/Universal VST3; Rosetta supplies Intel compatibility | **DOCUMENTED:** x64; WoA uses Arm64EC and may load many x86/x64 VST3 plug-ins | `NOT_APPLICABLE:no Cubase 15 Linux build` | `NOT_APPLICABLE:desktop scope` | Current Cubase family; exact optional interfaces/edition limits `UNKNOWN` | Primary current format; VST3 contract does not prove all optional host features | C-011–C-018; S-005–S-015 |
| AUv2 | **UNKNOWN:** no Steinberg Cubase hosting evidence found | `NOT_APPLICABLE:Apple format` | `NOT_APPLICABLE:Apple format/no product` | `NOT_APPLICABLE:desktop scope` | Current edition evidence not found | Do not infer rejection solely from VST-only documentation | C-005; S-002, S-015 |
| AUv3 | **UNKNOWN:** no Steinberg Cubase hosting evidence found | `NOT_APPLICABLE:Apple format` | `NOT_APPLICABLE:Apple format/no product` | `NOT_APPLICABLE:desktop scope` | Current edition evidence not found | Cubasis DAWproject exclusion is not Cubase-host evidence | C-005, C-023; S-019 |
| AAX | **UNKNOWN:** no Steinberg Cubase hosting evidence found | **UNKNOWN:** no Steinberg Cubase hosting evidence found | `NOT_APPLICABLE:no Cubase Linux build` | `NOT_APPLICABLE:desktop scope` | No current evidence found | No Avid certification/SDK rights inferred | C-005 |
| CLAP | **UNKNOWN:** no Steinberg Cubase hosting evidence found | **UNKNOWN:** no Steinberg Cubase hosting evidence found | `NOT_APPLICABLE:no Cubase Linux build` | `NOT_APPLICABLE:desktop scope` | No current evidence found | DAWproject article excludes CLAP from Cubasis exchange only | C-005, C-023; S-019 |
| LV2 | **UNKNOWN:** no Steinberg Cubase hosting evidence found | **UNKNOWN:** no Steinberg Cubase hosting evidence found | `NOT_APPLICABLE:no Cubase Linux build` | `NOT_APPLICABLE:desktop scope` | No current evidence found | No inference from absence | C-005 |
| LADSPA | **UNKNOWN:** no Steinberg Cubase hosting evidence found | **UNKNOWN:** no Steinberg Cubase hosting evidence found | `NOT_APPLICABLE:no Cubase Linux build` | `NOT_APPLICABLE:desktop scope` | No current evidence found | No inference from absence | C-005 |
| DSSI | **UNKNOWN:** no Steinberg Cubase hosting evidence found | **UNKNOWN:** no Steinberg Cubase hosting evidence found | `NOT_APPLICABLE:no Cubase Linux build` | `NOT_APPLICABLE:desktop scope` | No current evidence found | No inference from absence | C-005 |
| JSFX | **UNKNOWN:** no Steinberg Cubase hosting evidence found | **UNKNOWN:** no Steinberg Cubase hosting evidence found | `NOT_APPLICABLE:no Cubase Linux build` | `NOT_APPLICABLE:desktop scope` | No current evidence found | No inference from absence | C-005 |
| DirectX/DXi | `NOT_APPLICABLE:Windows technology` | **UNKNOWN:** no current Cubase 15 hosting evidence found | `NOT_APPLICABLE:no Cubase Linux build` | `NOT_APPLICABLE:desktop scope` | No current evidence found | Historical behavior was not pursued because it cannot establish current support | C-005 |
| Rack Extension | **UNKNOWN:** no Steinberg Cubase hosting evidence found | **UNKNOWN:** no Steinberg Cubase hosting evidence found | `NOT_APPLICABLE:no Cubase Linux build` | `NOT_APPLICABLE:desktop scope` | No current evidence found | No inference from absence | C-005 |
| Product-native/other | **DOCUMENTED:** VST Sound content; ARA status outside WoA not fully mapped | **DOCUMENTED:** VST Sound content; ARA on WoA | `NOT_APPLICABLE:no Cubase Linux build` | `NOT_APPLICABLE:desktop scope` | Cubase 15 family | ARA is an extension; `.vstsound` is content, not third-party native-code hosting | C-001, C-011, C-023; S-001, S-006, S-019 |

### 11.2 Discovery, scanning, validation, and recovery

- Windows VST3 uses the specification-defined common folder; VST2 has no single mandatory folder, and Cubase exposes managed VST2 search paths [C-006].
- Enabling VST2 in Cubase 14/15 triggers an immediate scan; Steinberg warns that Cubase may appear unresponsive during it [C-003].
- Plug-in Sentinel was introduced with Cubase 9 to scan on startup, contain scan crashes, and place problematic and 32-bit plug-ins on a blacklist. Historical reactivation was at user risk; forced rescan plus restart could block them again [C-007].
- **UNKNOWN:** Cubase 15 cache location/schema, duplicate identity resolution, VST3 bundle/class de-duplication, incremental invalidation, exact current blocklist/reactivation UX, quarantine versus blocklist distinction, and all-plugin rescan semantics [C-008]. Current manual pages were indexed but not extractable.

### 11.3 Runtime isolation and compatibility

- Scan-time containment does not prove runtime isolation [C-007, C-009].
- The old VST Bridge was a separate process and contained bridged plug-in crashes, but Cubase 8.5 was the final Cubase release containing it; current 32-bit plug-ins require unsupported third-party bridging [C-010].
- Current native Apple-silicon Cubase accepts only native/Universal VST3; VST2 requires Rosetta host mode. WoA accepts VST3/ARA and uses Arm64EC for many x86/x64 VST3 plug-ins, but excludes VST2; iLok-protected plug-ins were documented as unavailable on WoA [C-004, C-011].
- Steinberg documents current third-party VST3 cases that may freeze or crash Cubase. No universal current sandbox or per-instance crash-restart protocol is documented [C-009, C-021].
- **UNKNOWN:** code-signing/notarization validation policy, hardened-runtime entitlements, per-vendor trust controls, memory/CPU quotas, and runtime IPC/process grouping.

### 11.4 Host/plugin processing contract

At the VST3 specification layer, plug-ins expose audio and event buses, main/aux roles, sidechains, multiple outputs, speaker arrangements, sample-size capability, latency, tails, audio/event buffers, and parameter changes. Buses are explicitly activated/deactivated; plug-in-requested I/O changes require host renegotiation [C-012, C-018]. Cubase-specific documentation confirms selected sidechain and asymmetric I/O behavior [C-013].

Automation changes use per-parameter queues with sample offsets and linear curve segments; Note Expression uses per-note IDs and is documented in Cubase since version 6 [C-014, C-015]. Silence suspension is a Cubase host policy with a current documented failure workaround [C-021].

**UNKNOWN:** exact Cubase behavior for every optional interface, event-bus count, MPE translation, MIDI 2.0 mapping, bypass law, suspend/reset sequencing, denormal handling, offline block sizing, dynamic-I/O edge cases, tail truncation, and automation under ASIO-Guard.

### 11.5 Parameters, automation, state, presets, and project recall

VST3 identifies an automation queue by `ParamID`; values are normalized and points carry sample offsets [C-015]. Preset files contain opaque plug-in component state; the host manages preset locations/UI and must resynchronize controller parameter state after loading [C-016].

This contract does not guarantee self-contained assets, cross-platform state portability, stable third-party parameter IDs across versions, or Cubase's behavior when the plug-in is missing. **UNKNOWN:** missing-plugin placeholders, asset reference relocation, VST2→VST3 state migration, project repair, state-size limits, preset conflict rules, and whether all state is preserved when a plug-in is blocklisted.

### 11.6 UI, diagnostics, and failure modes

VST3's optional content-scale interface lets a host communicate display scaling and lets the plug-in request resized bounds [C-017]. Exact Cubase embedding, detachment, multi-monitor behavior, accessibility tree, generic editor fallback, and headless rendering remain `UNKNOWN`.

Documented diagnostics include a plug-in manager/blocklist lineage, ASIO-Guard eligibility visibility, performance/dropout monitoring, and a current silence-suspension crash workaround [C-007, C-019, C-021]. A reactivated historical blocklisted plug-in was explicitly an instability risk [C-007].

## 12. Extensibility and integration

Public extension boundaries evidenced here are VST2 (transitional), VST3, ARA, ASIO drivers, DAWproject, and VST Sound content [C-003, C-011, C-020, C-023]. VST3 SDK code is currently MIT-licensed [C-025].

**UNKNOWN:** supported scripting language/API, binary application extensions beyond plug-ins, macro/action API stability, OSC, controller SDK details, remote app protocol, and public project-file API. Naming an SDK or format is not permission to use trademarks or redistribute third-party components [C-026].

## 13. Project format, persistence, interoperability, and collaboration

The native `.cpr` schema is proprietary and was not inspected [C-024]. A historical support statement says Cubase SX projects could be opened in Cubase/Nuendo 4 with compatible VST2.4 plug-ins, but it is not evidence of unrestricted Cubase 15 backward/forward compatibility [C-024, C-027].

DAWproject is the strongest current interchange evidence: every Cubase 15 edition is an eligible desktop endpoint, with documented object mappings and explicit limitations [C-022, C-023]. This argues for capability-declared interchange and graceful degradation rather than assuming project equivalence.

**UNKNOWN:** autosave cadence, crash-recovery journal, undo persistence, `.bak` policy, archive/collect semantics, media relinking, missing-plugin placeholders, AAF/OMF/MusicXML/ADM support by edition, cloud collaboration, merge/version control, and forward-save guarantees.

## 14. Delivery, live, post-production, and specialized workflows

Offline processing is part of the VST3 contract through process mode and tail reporting, but Cubase's complete export/batch/loudness/DDP/video/timecode/surround delivery matrix was not established [C-018, C-029]. Nuendo-specific ADR, game-audio, and advanced post claims are excluded. Live/show-control behavior is `UNKNOWN`.

## 15. Performance, reliability, security, and accessibility

- Hybrid prefetch scheduling and load/dropout diagnostics are documented [C-019].
- Scan crashes were historically contained; current runtime plug-ins can still freeze/crash the application [C-007, C-009, C-021].
- Native CPU/ABI restrictions are explicit, including no current first-party 32-bit bridge [C-004, C-010, C-011].
- Optional VST3 view scaling exists but is not an accessibility guarantee [C-017].

**UNKNOWN:** formal scaling limits, watchdogs, plugin resource quotas, recovery granularity, update rollback, signing enforcement, malware scanning, telemetry/privacy defaults, WCAG/VoiceOver/Narrator conformance, localization completeness, and security response policy. No untrusted plug-in was executed.

## 16. Licensing, ecosystem, and implementation constraints

The VST3 SDK repository's current `LICENSE.txt` is MIT: use, modification, distribution, sublicensing, and sale are permitted subject to retaining copyright/permission notices and warranty disclaimer [C-025]. This applies to the SDK software; it is not evidence of trademark/logo rights or compatibility certification.

Steinberg announced VST2 discontinuation in 2022, yet current Cubase still conditionally hosts it [C-003, C-027]. The current status of onboarding new VST2 implementers, old agreement scope, and redistributable headers was not established; no project should treat host compatibility as an SDK license grant [C-026].

ASIO is documented as Steinberg's driver standard and a built-in driver is downloadable, but current ASIO SDK source/distribution/trademark terms were inaccessible [C-020, C-026]. Obtain the current agreement and legal review before implementing or shipping ASIO. Similar independent SDK/certification review would be required before any AAX/AU/CLAP/LV2 claim, regardless of Cubase's matrix.

Cubase itself is proprietary; no Cubase EULA terms were needed or retrieved. This dossier is descriptive, not legal advice.

## 17. Strengths, liabilities, and architecture lessons

**Strengths as an architecture reference**

1. Long, publicly versioned VST host lineage with a rich contract for buses, automation, state, latency, and note expression [C-002, C-012–C-018].
2. Explicit migration controls: VST2 is opt-in and architecture-gated rather than silently treated as equivalent to VST3 [C-003, C-004].
3. Scan-time fault containment/blocklisting and strong diagnostics are reusable concepts [C-007, C-019].
4. Hybrid real-time/prefetch scheduling visibly matches track monitoring state [C-019].
5. DAWproject exposes capability losses instead of promising perfect interchange [C-023].

**Liabilities / cautions**

1. Current universal runtime crash isolation is not documented, and plug-ins can crash the application [C-009, C-021].
2. VST2's deprecation timetable is inconsistent across vendor notices [C-027].
3. Project/cache/process internals are proprietary; product behavior cannot be reconstructed from SDK contracts [C-028].
4. Current manuals and comparison/release pages were difficult to extract, reducing edition-level confidence [C-029].
5. Format and SDK names carry separate legal/trademark obligations [C-026].

## 18. Transferable patterns

| Pattern | Problem / minimal mechanism | Support | Prerequisites and tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Disposable scan worker + blocklist | A bad binary must not kill host discovery; scan outside main runtime, persist failure reason, allow explicit risky override | C-007 | Stable identity, timeout/crash attribution, user recovery; false positives and stale cache | Medium | **CANDIDATE** |
| Separate scan and runtime trust | Passing scan is not proof of safe processing; maintain lifecycle-specific status | C-007, C-009 | Diagnostics and state machine; more UX complexity | Low | **CANDIDATE** |
| Explicit architecture matrix | Prevent ambiguous “supported” claims; bind format support to host ABI/OS mode | C-004, C-011 | Build metadata and qualification fixtures | Low | **CANDIDATE** |
| Dynamic bus negotiation | Avoid fixed I/O and unused mixer channels; enumerate, negotiate, activate main/aux audio/event buses | C-012, C-013 | Graph reconfiguration and clear failure fallback | Medium | **CANDIDATE** |
| Sample-offset automation queues | Preserve within-block timing using stable IDs and point queues | C-015 | Real-time-safe interpolation, ID migration policy | Medium | **CANDIDATE** |
| Opaque state envelope + host metadata | Let plug-ins own state while host owns preset discovery and project association | C-016 | Versioning, size limits, missing dependency UX, external-asset policy | High | **CONDITIONAL** |
| Hybrid live/prefetch engine | Protect low-latency paths while precomputing non-live tracks | C-019 | Dependency analysis and safe dynamic switching | High | **CONDITIONAL** |
| Capability-declared interchange | Exchange known objects and publish losses rather than claiming equivalence | C-022, C-023 | Versioned schema, device mapping, degradation report | Medium | **CANDIDATE** |
| Opt-in deprecated-format mode | Keep legacy projects recoverable while making migration pressure explicit | C-003 | Sunset policy and test burden; can prolong ecosystem debt | Medium | **CONDITIONAL** |

No protected Cubase implementation or UI expression is proposed for copying.

## 19. Rejected patterns and CURIOSITY_NO_GO

- `CURIOSITY_NO_GO`: **Assume every VST3 optional interface is implemented by Cubase.** SDK capability is not host qualification [C-012–C-018]. Reopen with a Cubase-version conformance matrix or safe test fixture.
- `CURIOSITY_NO_GO`: **Infer current runtime sandboxing from Plug-in Sentinel or VST Bridge.** One is scan-time; the other ended after Cubase 8.5 [C-007, C-010].
- `CURIOSITY_NO_GO`: **Adopt a first-party architecture bridge as current precedent.** Steinberg removed VST Bridge; native ABI compatibility is preferred [C-010, C-011].
- `CURIOSITY_NO_GO`: **Predict VST2 removal release.** The prior 24-month forecast was missed [C-027]. Reopen only on a dated current Steinberg notice.
- `CURIOSITY_NO_GO`: **Treat absent AU/AAX/CLAP/LV2 evidence as a runtime rejection test.** Absence is not proof [C-005].
- `CURIOSITY_NO_GO`: **Reverse engineer `.cpr`, caches, or proprietary binaries.** Out of legal/safety scope [C-024, C-028].
- `CURIOSITY_NO_GO`: **Use third-party mirrors for SDK legal conclusions.** Current primary terms are required [C-026].
- `CURIOSITY_NO_GO`: **Broaden to Nuendo/Cubasis architecture.** Separate roster boundaries; Cubasis is used only for exchange evidence.
- `CURIOSITY_NO_GO`: **Inventory every bundled instrument/content pack.** Low architecture decision value [C-001].

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and counterevidence | Result | Later safe probe |
| --- | --- | --- | --- |
| H1: Cubase 15 removed VST2 | Current Steinberg article explicitly provides an enable flow | **FALSIFIED** [C-003] | None until next major release |
| H2: VST2 has architecture parity with VST3 | Rosetta-only on Apple silicon; absent on WoA | **FALSIFIED** [C-004, C-011] | Cross-ABI fixture matrix |
| H3: Cubase universally isolates plug-ins at runtime | Current plug-ins may crash application; only old bridge was separate process | **NOT ESTABLISHED / counterevidence** [C-009, C-010, C-021] | Disposable host with crash plug-in; process-tree and recovery observation |
| H4: Current scan failures cannot crash the host | Cubase 9 Sentinel says scan crash contained; current exact implementation inaccessible | **HISTORICALLY SUPPORTED, CURRENT UNKNOWN** [C-007, C-008] | Crash-on-query test plug-in in disposable VM |
| H5: “Supports VST3” implies dynamic I/O, sample-accurate automation, state, UI, latency, and Note Expression all work | Interfaces differ in mandatory/optional status and need host/plugin cooperation | **FALSIFIED as a blanket inference** [C-008, C-012–C-018] | Versioned conformance suite per interface |
| H6: A scan pass proves instantiation/processing/recall | Scan, instance, process, UI, automation, save/reopen are distinct states | **FALSIFIED as methodology** [C-007, C-009, C-016] | Staged qualification harness |
| H7: Steinberg's 2022 VST2 timeline was met | Cubase 14/15 still conditionally host VST2 in 2026 | **FALSIFIED** [C-027] | Monitor dated policy updates only |
| H8: WoA requires only native Arm plug-ins | Arm64EC permits many x86/x64 VST3 plug-ins | **FALSIFIED** [C-011] | Vendor/signing/protection matrix on WoA |
| H9: DAWproject is lossless Cubase interchange | Explicit feature and version gaps are documented | **FALSIFIED** [C-023] | Golden-project round trip with loss report |

The later host-contract probe must separately record **format accepted → binary discovered → validated → instantiated → processed audio/events → opened UI → automated → saved → reopened → rendered offline → recovered after failure**.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | **DOCUMENTED** | High | Cubase 15.0.30 is current as of cutoff; one installer covers Pro/Artist/Elements/AI/LE; documented macOS, Win x64, WoA platforms | Cubase 15, 2026-06-03 page | S-001 | Direct download metadata | Edition feature parity not established |
| C-002 | **DOCUMENTED** | High | Steinberg dates VST to 1996, VST2 instruments to 1999, VST3 to 2008/Cubase 4-era host lineage | Historical lineage | S-015 | Direct vendor history | Not independent historical analysis |
| C-003 | **DOCUMENTED** | High | Cubase 14/15 disables VST2 by default but permits enabling it, triggering a scan | Cubase 14/15 | S-002 | Current support procedure | Removal date unspecified; edition detail absent |
| C-004 | **DOCUMENTED** | High | VST2 requires Rosetta on Apple silicon and is unavailable in native mode and WoA | Current architecture modes | S-002, S-005, S-006 | Consistent current sources | Intel macOS and Win x64 plugin-by-plugin compatibility still varies |
| C-005 | **UNKNOWN** | Medium | Only VST2/VST3 hosting received positive current Steinberg evidence; AU/AAX/CLAP/LV2/etc. hosting or rejection was not proven | Required format matrix | S-002, S-015, A-001–A-003 | Broad official search/manual attempts | Absence is not proof of unsupported behavior |
| C-006 | **DOCUMENTED** | High | Windows VST3 has a standard common path; VST2 paths vary and are managed in Cubase | Windows host discovery | S-004 | Direct support article | macOS paths not separately retained; cache schema unknown |
| C-007 | **DOCUMENTED** | High historical / Medium current relevance | Cubase 9 Plug-in Sentinel isolated initial scan crashes, blocklisted failures/32-bit plug-ins, and supported risky reactivation/rescan | Cubase 9 lineage | S-003 | Direct vendor support | Does not prove unchanged Cubase 15 implementation |
| C-008 | **UNKNOWN** | High | Exact Cubase 15 blocklist, cache, duplicate identity, and full-rescan internals/UX are unresolved | Cubase 15 | A-001 | Current manual passages inaccessible | Safe current UI probe would discriminate |
| C-009 | **INFERENCE** | Medium-High | No current universal runtime sandbox is established; application crashes remain possible | Cubase 15 runtime | S-021, S-022 | Current app-crash guidance plus bridge discontinuation | Does not prove every plug-in is in-process |
| C-010 | **DOCUMENTED** | High | VST Bridge was a separate crash-containing process and ended after Cubase 8.5; later 32-bit bridging is unsupported third-party territory | Historical/current boundary | S-022 | Direct support article | No claim about third-party bridge quality |
| C-011 | **DOCUMENTED** | High | Native Apple-silicon host accepts native/Universal VST3; WoA uses Arm64EC for many x64 VST3 plug-ins, supports ARA, excludes VST2 | Cubase 12+ / current WoA | S-005, S-006 | Direct architecture support pages | “Most” x64 VST3 is vendor test language, not universal qualification |
| C-012 | **DOCUMENTED** | High for specification | VST3 defines multiple dynamic audio/event buses, main/aux roles, sidechains, multi-output, activation, and arrangement negotiation | VST3 contract | S-007, S-009, S-011 | Direct SDK docs | Not all behavior mandatory in every host/plugin pair |
| C-013 | **DOCUMENTED** | Medium-High | Steinberg developer docs give Cubase/Nuendo-specific asymmetric I/O behavior and a Cubase sidechain example | Cubase host examples | S-009 | Direct host-named passages | Not a complete dynamic-I/O conformance result |
| C-014 | **DOCUMENTED** | High | VST3 Note Expression is optional, note-ID-specific, and documented in Cubase since version 6 | Cubase/VST3.5 | S-014 | Direct developer docs | MPE/MIDI2 parity not implied |
| C-015 | **DOCUMENTED** | High for specification | Mandatory host parameter queues use ParamID, normalized values, and sample offsets/curve points | VST3 contract | S-013 | Direct API reference | Exact Cubase automation modes not tested |
| C-016 | **DOCUMENTED** | High for specification | VST3 presets carry opaque component state; host manages preset UI/location and controller resync | VST3 contract | S-010 | Direct developer docs | External asset and missing-plugin behavior unspecified |
| C-017 | **DOCUMENTED** | High for specification | VST3 optional view scaling communicates host scale factors and renegotiates view size | VST3 contract | S-008, S-012 | Direct minimum-host/optional interface docs | Exact Cubase UI behavior unknown |
| C-018 | **DOCUMENTED** | High for specification | VST3 processors report latency/tail and receive audio/events/parameters; latency changes trigger host recomputation | VST3 contract | S-011 | Mandatory processor API | Cubase PDC limits and tail handling untested |
| C-019 | **DOCUMENTED** | High | Cubase uses real-time and larger-buffer ASIO-Guard paths with dynamic switching and load diagnostics | Cubase current support | S-020 | Direct 2025 support article | Vendor description, not profiler measurement |
| C-020 | **DOCUMENTED** | High | Steinberg developed ASIO and provides a Windows x64/Arm built-in ASIO driver usable by Cubase/other hosts | Current driver | S-018 | Direct support/download record | Does not grant ASIO SDK rights |
| C-021 | **DOCUMENTED** | High | Current third-party VST3 start/stop behavior can overload, freeze, or crash Cubase; disabling silence suspension is workaround | 2026 issue | S-021 | Direct current support article | Issue-specific, not all plug-ins |
| C-022 | **DOCUMENTED** | High | DAWproject exchange exposes tracks/events/audio/MIDI/effects/tempo/signature objects | Current exchange | S-019 | Direct feature list | Cubasis-centric path, not full Cubase native model |
| C-023 | **DOCUMENTED** | High | All Cubase 15 editions are eligible DAWproject endpoints, with explicit object/device mappings and limitations | Cubase 15 interchange | S-019 | Direct requirements/limitations | Cubasis-side limits must not be generalized to native Cubase |
| C-024 | **UNKNOWN** | High | `.cpr` schema, recovery journal, missing-plugin placeholders, and current version migration semantics are proprietary/unresolved | Persistence | S-015, A-001 | No schema source or safe probe | Historical Cubase SX→4 statement is narrow |
| C-025 | **DOCUMENTED** | High | Current VST3 SDK repository code is MIT-licensed | VST3 SDK as fetched | S-017 | Direct license text | No trademark/certification grant inferred |
| C-026 | **UNKNOWN** | High | Current ASIO SDK and VST2 onboarding/redistribution/trademark terms were not retrieved | Legal/SDK | S-016, S-018, A-003, A-004 | Primary developer pages inaccessible/absent | Must obtain current terms before implementation |
| C-027 | **DOCUMENTED** | High | Steinberg's 2022 “within 24 months” VST3-only forecast conflicts with current 2026 VST2 enablement | Policy timeline | S-002, S-016 | Direct dated contradiction | Future removal remains possible |
| C-028 | **UNKNOWN** | High | Current graph/thread/process/cache/project internals are not publicly established | Proprietary internals | S-007, S-020, S-021 | Public abstractions do not reveal implementation | Dynamic observation could answer only some questions |
| C-029 | **UNKNOWN** | High | Current edition-level workflow, optional VST3 coverage, UI/headless, MIDI2/MPE, accessibility, and many delivery limits remain unresolved | Cubase 15 | A-001–A-005 | Manual/feature/release pages inaccessible; search rate limits | Product installation/manual access would discriminate |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Fetched/search text was treated as untrusted evidence, never as instructions. Primary Steinberg sources were selected over reviews because the questions concern current version scope, host contracts, and license text.

- **S-001 — “Cubase 15 Downloads,” Steinberg.** <https://o.steinberg.net/en/support/downloads/cubase_15.html>. Official download metadata; Cubase 15/current update, release date, editions, OS/ABI builds, content. Supports C-001 and native-content boundary. Limitation: not a feature comparison. Selected because release artifacts are stronger than marketing copy.
- **S-002 — “Using VST 2 Plug-ins in Cubase/Nuendo 14 and 15,” Steinberg Help Center.** <https://helpcenter.steinberg.de/hc/en-us/articles/22554401894162-Using-VST-2-Plug-ins-in-Cubase-Nuendo-14-and-15>. Current support procedure; disabled-by-default, enable/scan flow, Rosetta and WoA exclusions. Supports C-003/C-004/C-027. Limitation: shared Cubase/Nuendo and no edition matrix. Selected as the most current product-specific VST2 statement.
- **S-003 — “Plug-in Sentinel for Cubase 9,” Steinberg Help Center.** <https://helpcenter.steinberg.de/hc/en-us/articles/207348390-Plug-in-Sentinel-for-Cubase-9>. Historical support article; startup scan containment, blacklist, 32-bit rejection, risky reactivation/rescan. Supports C-007. Limitation: Cubase 9, not proof of current internals. Selected to trace origin of the scanning model.
- **S-004 — “VST plug-in locations on Windows,” Steinberg Help Center.** <https://helpcenter.steinberg.de/hc/en-us/articles/115000177084-VST-plug-in-locations-on-Windows>. Updated 2025; VST3 common path and variable Cubase-managed VST2 paths. Supports C-006. Limitation: generic/Cubase-Nuendo and does not document caches. Selected for path provenance.
- **S-005 — “Cubase/Nuendo: Using the native Apple Silicon version,” Steinberg Help Center.** <https://helpcenter.steinberg.de/hc/en-us/articles/4488195658002-Cubase-Nuendo-Using-the-native-Apple-Silicon-version>. Updated 2025; native/Rosetta matrix and VST3/VST2 ABI rules. Supports C-004/C-011. Limitation: shared product article. Selected over community compatibility lists.
- **S-006 — “About Steinberg products for Windows on Arm,” Steinberg Help Center.** <https://helpcenter.steinberg.de/hc/en-us/articles/21829527504530-About-Steinberg-products-for-Windows-on-Arm>. Updated 2026; Arm64EC, VST3/ARA, no VST2, iLok limitation, ASIO requirement. Supports C-004/C-011. Limitation: vendor initial tests are not exhaustive. Selected for current ABI detail.
- **S-007 — “VST 3 Developer Portal — Technical Documentation,” Steinberg.** <https://steinbergmedia.github.io/vst3_dev_portal/pages/Technical+Documentation/Index.html>. Official interface map and VST-MA host-layer statement. Supports C-011/C-012. Limitation: specification, not Cubase conformance. Selected as canonical SDK documentation.
- **S-008 — “Minimum Host requirements for VST 3 support,” Steinberg.** <https://steinbergmedia.github.io/vst3_dev_portal/pages/Technical+Documentation/Host+Requirements/Index.html>. Mandatory/conditional host interfaces and scaling requirement. Supports C-017 and adversarial optionality distinction. Limitation: minimum only.
- **S-009 — “[3.0.0] Multiple Dynamic I/O Support,” Steinberg.** <https://steinbergmedia.github.io/vst3_dev_portal/pages/Technical+Documentation/Change+History/3.0.0/Multiple+Dynamic+IO.html>. Bus/event/sidechain/activation/arrangement contract and named Cubase examples. Supports C-012/C-013. Limitation: SDK examples are not full product tests.
- **S-010 — “Presets & Program Lists,” Steinberg VST3 Developer Portal.** <https://steinbergmedia.github.io/vst3_dev_portal/pages/Technical+Documentation/Presets+Program+Lists/Index.html>. Host-managed preset/state/program contract. Supports C-016. Limitation: external assets/project placeholders unspecified.
- **S-011 — “IAudioProcessor Class Reference,” Steinberg VST 3.8 API.** <https://steinbergmedia.github.io/vst3_doc/vstinterfaces/classSteinberg_1_1Vst_1_1IAudioProcessor.html>. Mandatory processing, sample-size, latency, tail, bus API. Supports C-012/C-018. Limitation: format API, not Cubase measurement.
- **S-012 — “[3.6.6] PlugView Content Scaling,” Steinberg.** <https://steinbergmedia.github.io/vst3_dev_portal/pages/Technical+Documentation/Change+History/3.6.6/IPlugViewContentScaleSupport.html>. Optional scaling/view resize contract. Supports C-017. Limitation: no Cubase UI qualification.
- **S-013 — “IParamValueQueue Class Reference,” Steinberg VST 3.8 API.** <https://steinbergmedia.github.io/vst3_doc/vstinterfaces/classSteinberg_1_1Vst_1_1IParamValueQueue.html>. Mandatory sample-offset parameter queue and normalized values. Supports C-015. Limitation: host automation UX/thinning unspecified.
- **S-014 — “[3.5.0] Note Expression,” Steinberg.** <https://steinbergmedia.github.io/vst3_dev_portal/pages/Technical+Documentation/Change+History/3.5.0/INoteExpressionController.html>. Optional note-ID expression and Cubase-since-6 statement. Supports C-014. Limitation: not MPE/MIDI2 conformance.
- **S-015 — “VST3 in Cubase and Nuendo — Technical Background,” Steinberg Help Center.** <https://helpcenter.steinberg.de/hc/en-us/articles/206294464-VST3-in-Cubase-and-Nuendo-Technical-Background>. Vendor history, Cubase 4-era VST3, dynamic I/O, Note Expression, historical project statements. Supports C-002/C-012/C-027. Limitation: some “current” VST2 prose is stale relative to S-002; retained specifically to expose contradiction and lineage.
- **S-016 — “VST 2 Discontinued,” Steinberg Help Center.** <https://helpcenter.steinberg.de/hc/en-us/articles/4409561018258-VST-2-Discontinued>. Dated 2022 deprecation/24-month forecast. Supports C-026/C-027. Limitation: forecast contradicted by S-002. Selected as the origin of the policy claim.
- **S-017 — `vst3sdk/LICENSE.txt`, Steinberg official GitHub repository.** <https://raw.githubusercontent.com/steinbergmedia/vst3sdk/master/LICENSE.txt>. Current MIT license text. Supports C-025. Limitation: moving `master` URL and code license only; a release tag/hash should be pinned before shipping. Selected over paraphrased licensing pages.
- **S-018 — “Steinberg built-in ASIO Driver: information & download,” Steinberg Help Center.** <https://helpcenter.steinberg.de/hc/en-us/articles/17863730844946-Steinberg-built-in-ASIO-Driver-information-download>. ASIO origin, Windows role, current driver/platforms. Supports C-020. Limitation: driver download is not SDK terms.
- **S-019 — “DAWproject: Exchange Cubasis projects with Cubase and other DAWs,” Steinberg Help Center.** <https://helpcenter.steinberg.de/hc/en-us/articles/25142209226642-DAWproject-Exchange-Cubasis-projects-with-Cubase-and-other-DAWs>. Current Cubase edition requirement, object mapping, exclusions, known issues. Supports C-022/C-023. Limitation: Cubasis-centric and cannot define all native Cubase capabilities. Selected for explicit loss boundaries.
- **S-020 — “Details on ASIO-Guard in Cubase and Nuendo,” Steinberg Help Center.** <https://helpcenter.steinberg.de/hc/en-us/articles/206103564-Details-on-ASIO-Guard-in-Cubase-and-Nuendo>. Updated 2025 hybrid paths, buffers, dynamic switching, diagnostics, restrictions. Supports C-019. Limitation: vendor architecture description, no independent profiling.
- **S-021 — “Plug-in related performance issues and crashes,” Steinberg Help Center.** <https://helpcenter.steinberg.de/hc/en-us/articles/32365099396370-Plug-in-related-performance-issues-and-crashes>. Current VST3 suspend/resume overload/freeze/crash issue and workaround. Supports C-009/C-021. Limitation: issue-specific.
- **S-022 — “About the VST Bridge in Cubase/Nuendo,” Steinberg Help Center.** <https://helpcenter.steinberg.de/hc/en-us/articles/206776570-About-the-VST-Bridge-in-Cubase-Nuendo>. Historical separate-process bridge, crash containment, 32-bit/PPC translation, final Cubase 8.5 boundary. Supports C-009/C-010. Limitation: historical only. Selected to prevent false transfer to current Cubase.

**Retained negative/access results**

- **A-001:** Current Cubase 15 online-manual pages for VST Plug-in Manager toolbar/window, VST2 paths, and blocklist reactivation returned only the Fluid Topics JavaScript loader. Search snippets were treated as untrusted discovery, not cited proof.
- **A-002:** Current Cubase comparison/features/release pages returned only client shells. This blocks edition-level and broad workflow claims.
- **A-003:** Steinberg developer landing page returned only a client shell; guessed public ASIO repository and VST licensing endpoints returned 404. No mirror was substituted for legal conclusions.
- **A-004:** Official manual index and searches found no readable Cubase 15 operation-manual PDF through this channel; repeated equivalent retries were stopped.
- **A-005:** Web search began returning HTTP 429. Primary URLs already identified were fetched directly; no result snippet became a material claim.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Impact | Safest next probe | Access/fixture | Owner |
| --- | --- | --- | --- | --- | --- |
| Current runtime process topology/sandbox | Current support + historical bridge searched; proprietary, no direct statement | Crash containment/security architecture | Disposable VM; process tree plus deliberate crash/hang VST3 | Signed test plug-in, no user data | Unassigned |
| Cubase 15 scanner/cache/blocklist/rescan | Current manual pages loader-only; historical Sentinel retained | Discovery determinism/recovery UX | Record clean install scan, incremental scan, crash-on-query, reactivation, forced rescan | Disposable OS images, synthetic plug-ins | Unassigned |
| Duplicate identity/version resolution | No primary source | Project recall and upgrades | Two bundles/classes with controlled IDs/versions/paths | Synthetic VST3 modules | Unassigned |
| AU/AAX/CLAP/LV2/etc. hard exclusions | Broad official search yielded no positive host evidence | Format roadmap comparison | Inspect current manager selectors/manual; attempt harmless known-good fixtures only if licensed | Current Cubase licenses and fixtures | Unassigned |
| Edition-specific host limits | Comparison page inaccessible | Procurement/product matrix | Obtain static official comparison export or inspect each licensed edition | Vendor docs/licenses | Unassigned |
| Complete VST3 optional-interface matrix | SDK describes capability, not host adoption | Interoperability fidelity | Automated host checker for bus activation, note expression, MIDI2, scaling, context, state | Conformance plug-in set | Unassigned |
| `.cpr` schema/missing-plugin persistence | No public schema; reverse engineering prohibited | Durable recall/migration | Safe black-box save/reopen with missing/updated plug-ins; compare user-visible behavior only | Disposable projects and test plug-ins | Unassigned |
| External asset/state relocation | VST state is opaque; no Cubase guarantee | Portability/archive | Plug-in with controlled external asset reference; archive/move/reopen | Synthetic plug-in/content | Unassigned |
| ASIO SDK/VST2/trademark terms | Developer pages inaccessible/404; no mirrors used | Legal shipping blocker | Obtain current terms directly from Steinberg; counsel review | Vendor account/contact, legal owner | Unassigned |
| Signing/notarization/quarantine policy | No qualifying source | Supply-chain/security model | Official support request plus signed/unsigned fixture matrix in VM | Signing identities, disposable Macs/Windows | Unassigned |
| Audio precision/threading/render determinism | ASIO-Guard is high-level only | Engine architecture | Null/summing/render repeatability and scheduling probes | Audio fixtures, profiler in disposable lab | Unassigned |
| UI embedding/headless/accessibility | Only optional VST3 scale contract found | Remote render/accessibility | Generic/custom/no-view plug-ins; multi-DPI and screen-reader checks | UI test plug-ins, accessibility tools | Unassigned |
| MPE/MIDI 2.0 host adoption | SDK interfaces exist; no Cubase 15 proof | Expression/controller architecture | Current manual plus loopback test with timestamped UMP/MPE fixture | MIDI2 hardware/virtual device | Unassigned |

## 24. Curiosity pass and stop decision

Scores are 1–5 for decision relevance (R), expected value (V), novelty (N), and cost (C; lower is cheaper). The highest qualifying thread was pursued after each synthesis; rejected threads are recorded in Section 19.

| Candidate follow-up | R | V | N | C | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Current VST2 enablement/architecture restrictions | 5 | 5 | 5 | 2 | Pursued; changed “removed” hypothesis |
| Scanner/blocklist lineage | 5 | 5 | 4 | 2 | Pursued; current details partially blocked |
| Runtime sandbox/bridge boundary | 5 | 5 | 5 | 1 | Pursued; established historical/current distinction |
| VST3 bus/automation/state/UI/latency contract | 5 | 5 | 5 | 3 | Pursued in bounded interface passes |
| ASIO/VST licensing | 5 | 5 | 5 | 3 | VST3 resolved; ASIO/VST2 terms blocked |
| DAWproject/project boundary | 5 | 4 | 4 | 2 | Pursued; explicit losses retained |
| Reverse engineer docs API or `.cpr` | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: out of frame/high risk |
| Bundled content inventory | 1 | 1 | 1 | 4 | `CURIOSITY_NO_GO`: low architecture value |
| Predict VST2 removal | 3 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: contradicted timeline, no dated source |
| Third-party SDK agreement mirrors | 4 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: inadequate legal provenance |

**Stop decision:** stop on **coverage + budget exhaustion + repeated duplicate access failures + nonpositive marginal evidence** after 18 evidence passes, never more than two retrieved sources per pass. Twenty-two usable primary sources cover identity, VST2 status, scanning lineage, architecture compatibility, VST3 contracts, scheduling, crashes, interchange, and VST3 licensing. Current manuals/feature pages repeatedly returned loaders, search became rate-limited, and the remaining questions require controlled product probes, vendor legal terms, or proprietary access rather than more documentary guessing. Coverage is sufficient but not saturated for current scanner internals, optional-interface conformance, project persistence, excluded formats, and SDK legal terms.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Local status/path checks performed after writing; no sibling/shared file was intentionally modified.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0.
- [x] **Every required dossier heading exists in order.** Sections 0–25 present.
- [x] **Every material assertion has a claim ID and classification.** Sections cite C-IDs; Section 21 classifies each.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Claims register and Sections 22–23.
- [x] **Every required plugin-format row is present.** Section 11.1 contains all 13 required rows.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Claim classifications and source limitations are explicit.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16.
- [x] **Bibliography records source rationale and limitations.** Section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary web retrieval and local text checks only.

**Owned path:** `research/daw-landscape/dossiers/steinberg-cubase.md`
**Checks performed:** heading order/count, required matrix-row names, claim/source ID scans, `UNKNOWN` coverage review, source URL review, and git path-status/diff checks.
**Concise result:** `COMPLETE_WITH_UNKNOWNS`; 29 classified claims, 22 usable primary sources, 5 grouped negative/access results.
**Unresolved blockers:** current manual extraction; current scanner/process/project internals; complete format/edition matrix; ASIO/VST2/trademark terms; dynamic conformance.
**Pre-existing workspace state:** the broader `research/daw-landscape/` tree was already untracked; it was left unstaged and uncommitted.
