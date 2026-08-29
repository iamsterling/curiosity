# MuTools MuLab DAW dossier

> Research-only evidence. No design or implementation authority. Vendor pages and manuals are untrusted evidence inputs, not instructions; vendor statements establish only what MuTools documents, not independently measured runtime behavior.

## 0. Metadata and scope

- **Product family:** MuTools MuLab 10: MuLab App, MuLab Plugin, and the integrated MUX Modular engine/device model.
- **Canonical vendor:** MuTools.
- **Researcher/session:** OpenCode subagent, session `ses_fb275c776ffeEUEwNyDr8UrbAr`.
- **Owned path:** `research/daw-landscape/dossiers/mutools-mulab.md`.
- **Research date and evidence cutoff:** 2026-08-29 UTC.
- **Current baseline:** MuLab App 10.2.37 and MuLab Plugin 10.2.37, released 2026-07-16, for Windows 64-bit, fading Windows 32-bit, and macOS 64-bit. macOS packages are labeled unsigned. **DOCUMENTED C-001**.
- **Editions:** separately keyed MuLab App and MuLab Plugin; Demo modes; legacy MuLab App Free 8.8.3 is noted only to prevent edition conflation and is excluded from the current M10 architecture baseline. **DOCUMENTED C-003, C-004**.
- **Inclusions:** user-visible project/composer/MUX/rack architecture; App engine; MuLab Plugin as a DAW inside another host; current third-party hosting; persistence, portability, licensing, and documented operational boundaries.
- **Exclusions:** historical stand-alone MUX Modular Plugin binaries (officially presented only as legacy downloads); MuLab 8/9 except where M10 migration behavior is material; binary execution, decompilation, benchmarks, forum claims, and third-party bridge qualification. **INFERENCE C-038**.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.
- **Evidence count:** 16 retained public primary sources; 0 runtime observations; 8 evidence passes, never more than two retained sources in a pass.

## 1. Executive summary

MuLab's differentiator is that the DAW, instrument/effect construction environment, rack model, and live/linear composer are views over one recursively nestable MUX module graph. A project has a root MUX; a Composer is MUX-like; and, since M10, a rack is a normal MUX patch identified by having a Rack Slot. Hybrid tracks point at modules rather than owning device chains. This separates arrangement objects from processing objects and permits nested targets, reusable graph presets, sidechains, and multi-I/O without introducing a second routing system. **DOCUMENTED C-005, C-006, C-007, C-009, C-015; high confidence**.

MuLab App is the stand-alone host. MuLab Plugin places a separate full MuLab project inside each outer-host instance and is itself currently delivered as VST2, while internally hosting VST2, VST3, and CLAP. App and Plugin exchange the same `.MuProject` and preset files but require separate licenses. **DOCUMENTED C-002, C-035; high confidence**.

Hosting is unusually configurable at the graph boundary: plug-in buses can be exposed through racks/MUXes, parameters can be automated or modulated, and VST2 pin grouping has per-plug-in overrides. Discovery uses a manager/database and a scan-crash marker. However, no public evidence establishes separate-process scanning or execution, sandboxing, an internal architecture bridge, sample-accurate automation, complete latency/tail/dynamic-I/O handling, or durable missing-plug-in placeholders. **DOCUMENTED C-017, C-019, C-020, C-022; UNKNOWN C-018, C-021, C-023; medium confidence on the public host contract, low on internals**.

The main liabilities as an architectural reference are lack of native Linux/mobile/web editions, an unsigned macOS distribution, a VST2-only outer plug-in boundary, unsupported graph feedback, modest documented interchange, no evidenced public general scripting/device SDK, and opaque proprietary internals. **DOCUMENTED C-001, C-008, C-030, C-037; UNKNOWN C-012, C-027, C-029, C-034**.

## 2. Product identity, history, and market position

- MuTools describes MuLab as a Windows/macOS music-production studio combining recording/editing/finalization with an integrated MUX modular synth, sampler, and effects engine. It targets composition, sound design, and live clip/scene use rather than post-production or score-centric workflows. **DOCUMENTED C-001, C-002**.
- The current family has two separately licensed products: stand-alone **MuLab App** and **MuLab Plugin**, the latter embedding the environment in a VST2-compatible host. Their project/preset files are compatible. **DOCUMENTED C-002, C-003**.
- MUX is the native modular construction boundary inside current MuLab. Separate historical MUX Modular Plugin downloads are listed under legacy versions, so this dossier does not treat them as a current third edition. **INFERENCE C-038**. Plausible alternative: MuTools could revive or separately maintain that product without the current download/product pages reflecting it; a future product roster would reopen the boundary.
- Current shipping evidence is 10.2.37 on Windows 64/32 and macOS 64. Windows 32-bit is fading; native Linux is expressly unavailable, though the vendor links unofficial compatibility information. **DOCUMENTED C-001, C-037**.
- MuLab Free is an old App 8.8.3 light edition with five tracks and no VST/CLAP hosting, multicore, or automatic plug-in latency compensation; it is not representative of current M10. **DOCUMENTED C-003**.

## 3. Workflow and conceptual model

The root object is a `.MuProject`: a collection of modules, composers, racks, sequences, samples, and their relations. Its Project Modular Area is a root MUX and can nest MUXes recursively. A selected **Project Main Module** determines whether the main editor presents a Composer, synth, effect, or hybrid front end. **DOCUMENTED C-005**.

A Composer offers two coordinated composition views: Live Matrix (clip launcher/scenes) and linear Timeline. It is also a modular module with its own I/O and nested modules. Tracks are hybrid containers for audio, event/sequence, and automation clips; they target any module in the Composer's modular tree. Tracks and devices are independent, so several tracks can target one rack, or a track can target a nested module. **DOCUMENTED C-006, C-007**.

Racks are the approachable chain/mixer view over modular routing. In M10, a rack is a standard MUX patch containing at least one Rack Slot. Users can remain in a serial slot/fader view or open the graph for sidechains, parallel structures, subracks, and extra I/O. **DOCUMENTED C-009, C-015**.

**Architecture reading:** this is not a conventional “track owns plug-in chain” model. It is a graph-first object model with track-to-module references and optional rack projections. **INFERENCE C-031**; assumptions are that the documented targeting and root-MUX model are persistence concepts, not merely UI metaphors. A plausible alternative is that the proprietary engine flattens these objects into a different runtime graph.

## 4. Publicly documented architecture

Public documentation establishes only the following boundaries:

1. Every project has a recursively nestable Project Modular Area/root MUX. **DOCUMENTED C-005**.
2. MuLab App root audio/event I/O terminates at device and enabled MIDI ports. Every MuLab Plugin instance is a separate project whose fixed host-facing audio I/O connects to the outer DAW, and the Plugin reports Project Main Module parameters to that host. The port count is not documented in the retained sources. **DOCUMENTED C-035**.
3. MUX cables carry typed audio, event, or modulation signals; feedback loops are unsupported. **DOCUMENTED C-008**.
4. App multicore work respects upstream graph dependencies. The docs discuss parallel audio-processing threads but not lock strategy, worker lifetime, real-time allocation, SIMD, graph compilation, or process topology. **DOCUMENTED C-010; UNKNOWN C-012**.
5. Plug-in discovery has a persistent XML database and a scan-crash marker, but the process boundary is undisclosed. **DOCUMENTED C-017; UNKNOWN C-018**.

No source code, storage schema, thread scheduler, crash-recovery implementation, or sandbox architecture is public in the retained evidence. Treat those internals as **UNKNOWN C-012, C-018, C-023**, not as implied by the modular UI.

## 5. Audio engine

- MuLab App uses Core Audio on macOS and ASIO or output-only MME on Windows. Buffer size exposes the expected latency/dropout tradeoff; MME has no recording input. **DOCUMENTED C-010**.
- App exposes a number-of-audio-processor-threads setting. Public docs say parallel threads process available synth/effect work but downstream processing waits for upstream plug-ins. The project CPU meter compares actual block-processing time with `blocksize / sample rate`; it excludes GUI and disk-streaming load. **DOCUMENTED C-010**.
- Audio cables run at engine sample rate; mono/stereo adaptation is automatic. Numeric sample-rate ranges and internal sample precision are not stated. **DOCUMENTED C-008; UNKNOWN C-012**.
- MuTools claims automatic plug-in latency compensation. M10.0 notes also describe a latency-compensation optimization and accurate live MIDI recording under compensated/high-buffer conditions, but no algorithm, dynamic-change rule, or path exclusions are documented. **DOCUMENTED C-011; UNKNOWN C-021**.
- A rack can render its main and auxiliary paths to tracks. Explicit Freeze Point modules select render boundaries; otherwise fader/main and aux outputs are used. This is manual freeze/render and does not auto-mute sources. **DOCUMENTED C-011**.
- Composition export follows the current audio-setup sample rate. Users must extend the composition with an empty clip to capture an effect tail, so retained evidence does not show automatic tail querying. **DOCUMENTED C-026; UNKNOWN C-021**.
- Oversampling policy, internal bit depth, true offline speed, deterministic render, dropout recovery, disk-cache design, and whether MuLab Plugin gets App-style multicore scheduling are **UNKNOWN C-012**.

## 6. Tracks, timeline, clips, and editing

- Composer has Live Matrix and Timeline views. Its three clip classes are audio, sequence, and automation. **DOCUMENTED C-006**.
- Hybrid tracks may intermix all three clip types and target any reachable module. Tracks and racks have independent mute/solo. **DOCUMENTED C-007**.
- Audio clips stream a range of an audio file, support per-clip start, fades, gain/pan, and a snap marker. Sequence clips reference sequences; copies can be unique or shared, and shared clips reflect edits to one underlying sequence. Automation clips reference target parameters. **DOCUMENTED C-007**.
- Sequence and automation clips can be stretched through a speed factor; product documentation also claims time stretching/pitch shifting and user-defined/extracted grids. **DOCUMENTED C-007**.
- Current public evidence did not establish take lanes, swipe comping, ripple editing, or a non-destructive edit-decision model beyond clip references. These are **UNKNOWN C-033**.

## 7. MIDI, sequencing, notation, and expression

- Sequence events include notes, pitch bend, MIDI CC, aftertouch, and parameter values. Tracks can select MIDI channel globally, per clip, or per event. **DOCUMENTED C-013**.
- The composer chases the latest preceding MIDI CC and parameter values after moving the play position. **DOCUMENTED C-013**.
- MuLab Plugin derives its master tempo from the outer host; nested Composer tempo is relative. App uses project tempo. Current release notes document outer-host synchronization fixes, but protocol-level guarantees are not public. **DOCUMENTED C-013**.
- Built-in sequencing includes a piano/event editing model, step sequencer and arpeggiator; reusable `.MuSequence` and `.MuClip` objects are documented. **DOCUMENTED C-007, C-028**.
- Hardware MIDI I/O and project/channel target maps are documented at a high level, as are MIDI-controller-to-parameter maps. **DOCUMENTED C-013, C-028**.
- MPE/per-note expression, MIDI 2.0/UMP, SysEx fidelity, MTC, sample-accurate MIDI-to-plug-in delivery, and notation/score facilities are **UNKNOWN C-014**. The search did not treat ordinary poly-pressure or per-event channels as proof of MPE.

## 8. Routing, mixer, automation, and control

- Racks accept audio and events, contain mixed synth/effect/send slots, expose pre/post-fader position, and can send only to modules in the same modular area unless explicit I/O carries signals across levels. **DOCUMENTED C-015**.
- Opening a rack's MUX interior enables sidechains, multi-output synths, multi-input effects, parallel MUX subgraphs, and subracks. Graph feedback is not supported; feedback-producing destinations are omitted or prevented. **DOCUMENTED C-008, C-015**.
- Audio, event, and modulation are distinct cable types. Normal modulation is low-frequency (typically 0.1–40 Hz); multiple modulation signals sum, with documented multiplicative exceptions for gains. Audio-rate modulation uses an Audio-to-Modulation converter. **DOCUMENTED C-008**.
- Automation clips bind to a module parameter, including a hosted plug-in parameter surfaced through the focused-parameter control. A MUX's 32 meta-parameters can fan out to nested parameters with individual ranges. **DOCUMENTED C-020, C-009**.
- MIDI controller maps can be stored at module or project level. No public OSC, EuCon, Mackie/HUI, remote-app, or general control-surface API was found. **DOCUMENTED C-028; UNKNOWN C-029**.
- Surround/immersive channel models, VCAs, control-room facilities, and formal timecode synchronization are **UNKNOWN C-034**.

## 9. Recording, comping, and media handling

- MuLab is documented as recording audio and musical events; App hardware input enters the project graph and Plugin input comes from the outer host. Windows MME is output-only, so ASIO is required for Windows audio input. **DOCUMENTED C-002, C-010, C-035**.
- Audio clips can stream referenced WAVE/AIFF; import can instead create a RAM sample/audio sequence, pitched sample instrument, or sliced multisample. MP3 cannot be a directly streamed Audio Stream in the documented import path. **DOCUMENTED C-026**.
- REX loop support is advertised, and M10.0 updated its REX library. **DOCUMENTED C-002**.
- The retained evidence does not establish punch modes, loop-take retention, comp lanes, input-monitoring semantics, pre-record buffers, video, proxy media, BWF metadata, automatic missing-media relink, or collect/archive. **UNKNOWN C-033, C-027, C-034**.

## 10. Instruments, effects, content, and native devices

MUX is the native device-construction format. A patch may combine native oscillators, samplers, filters/effects, event processors, VST/CLAP modules, nested MUXes, and a custom front panel. Each patch exposes 32 meta-parameters and is saved as `.Mux`; instrument/effect classification is inferred recursively from contained synth modules. **DOCUMENTED C-009**.

Racks are `.Mux` presets in `User/Library/MUX/Racks`, with templates and optional custom front panels. Freeze Points, Rack Slots, Module Slots, and explicit typed I/O make routing behavior part of the reusable patch. **DOCUMENTED C-009, C-011, C-015**.

The product includes factory instruments/effects/presets, synthesis, multisampling, step sequencing, slicing, and modulation, but a device inventory is intentionally omitted because it does not change the architectural boundary. **DOCUMENTED C-002**.

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means no support statement was found in the current official product/manual/release evidence; it does not assert unsupported behavior. Linux and mobile/web cells are not applicable because no native product is shipped there. MuLab Free is excluded from positive M10 rows because its official edition table says no VST/CLAP support. **DOCUMENTED C-003, C-016, C-037**.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | MuLab App/Plugin 10.2.37; not Free 8.8.3 | Hosted inside App and Plugin; MuLab Plugin is itself a VST2 plug-in. VST2 shell plug-ins are excluded. | C-002, C-016, C-019; S-004, S-009, S-010 |
| VST3 | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | MuLab App/Plugin 10.2.37; M10.2 uses VST3 SDK 3.8.0 | Multiple items/file since 10.1; current compatibility improvements documented. | C-016, C-017, C-022; S-002, S-004 |
| AUv2 | UNKNOWN | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | No current official MuLab support statement found | Do not infer support from macOS availability. | C-016; S-004 |
| AUv3 | UNKNOWN | NOT_APPLICABLE:Apple format | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | No current official MuLab support statement found | Mobile is not shipped. | C-016; S-004 |
| AAX | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | No current official MuLab support statement found | MuLab Plugin requires a VST2 outer host, not AAX. | C-016, C-035; S-004, S-009 |
| CLAP | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | MuLab App/Plugin 10.2.37; not Free 8.8.3; M10.2 uses CLAP SDK 1.2.7 | Multiple items/file since 10.1. | C-016, C-017; S-002, S-004, S-010 |
| LV2 | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | No current official MuLab support statement found | Current plug-in manual enumerates VST2/VST3/CLAP only. | C-016; S-004 |
| LADSPA | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | No current official MuLab support statement found | No host-contract evidence. | C-016; S-004 |
| DSSI | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | No current official MuLab support statement found | No host-contract evidence. | C-016; S-004 |
| JSFX | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | No current official MuLab support statement found | No host-contract evidence. | C-016; S-004 |
| DirectX/DXi | NOT_APPLICABLE:Windows-only format | UNKNOWN | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | No current official MuLab support statement found | No host-contract evidence. | C-016; S-004 |
| Rack Extension | UNKNOWN | UNKNOWN | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | No current official MuLab support statement found | No host-contract evidence. | C-016; S-004 |
| Product-native/other | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE:no native edition | NOT_APPLICABLE:no product | MuLab 10.2.37 | Native MuTools modules, `.Mux` patches/racks, `.MuProject`, `.MuSequence`, `.MuClip`; MuLab Plugin is an outer-host VST2 product. | C-002, C-005, C-009, C-028; S-003, S-009, S-012, S-016 |

### 11.2 Discovery, scanning, validation, and recovery

- Files can be dropped on a rack/MUX, browsed ad hoc, or added via Plugin Manager. Known items appear in insertion menus and the Project Browser. **DOCUMENTED C-017**.
- `VstPlugins.xml` is the persistent VST/CLAP database. It holds valid/invalid state and compatibility overrides; deletion empties the database. Since 10.1, MuLab distinguishes a plug-in file from one or more VST3/CLAP items inside it. Display names may be customized, while the database file name participates in saved identity/recall. **DOCUMENTED C-017, C-022**.
- Scanning writes the next candidate to `User/LogFiles/PlugFileBeingScanned.txt`; successful completion removes it. If scanning crashes, the next launch sees the marker and “memorizes the crash issue.” A scan log is also retained. **DOCUMENTED C-017, C-024**.
- M10.1 changed Plugin Manager data and recommended a full rescan; M10.1 also advertises faster scanning and “improved crash protection.” These statements do not reveal whether scanning occurs in the main process. **DOCUMENTED C-017; UNKNOWN C-018**.
- Duplicate binary/item identity beyond customizable database names, cryptographic validation, signature checks, quarantine UX, automatic blacklist expiry, and deterministic rescan rules are **UNKNOWN C-018**.

### 11.3 Runtime isolation and compatibility

- A plug-in architecture must match the MuLab process: 32-bit cannot load 64-bit and vice versa. MuTools suggests third-party jBridge when a matching build is unavailable; no built-in bridge is documented. **DOCUMENTED C-019**.
- Windows 32-bit MuLab remains downloadable but is fading. macOS is 64-bit and unsigned. CPU architecture beyond “64 bit” is not stated on the download page. **DOCUMENTED C-001**.
- VST2 shell plug-ins are explicitly unsupported. VST2 plug-ins can receive per-database compatibility fixes such as pre-zeroed output buffers and manual input/output pin regrouping. **DOCUMENTED C-016, C-020**.
- No separate-process execution, sandbox, per-plug-in worker, runtime crash containment, restart-in-place, architecture bridge, or privilege reduction is documented. **UNKNOWN C-018**. The safe assumption for an architectural comparison is “unproven isolation,” not “in process.”

### 11.4 Host/plugin processing contract

- Hosted modules can be instruments or effects inside racks/MUXes. VST2 exposes mono pins which MuLab groups using reported speaker organization, with manual splitter/combiner and database regrouping overrides. **DOCUMENTED C-020**.
- Auxiliary inputs/outputs can be exposed from a rack per instance, set as database defaults, or wired directly in a MUX. M10 racks explicitly support sidechains, multi-output synths, and multi-input effects. **DOCUMENTED C-015, C-020**.
- Any surfaced VST2/VST3/CLAP parameter can be automated through a track and, per product documentation, modulated by MUX modulators including audio-rate modulation. **DOCUMENTED C-020**.
- Silence-based Auto/Smart Bypass can be configured per instance, per database item, and globally. M10.2 adds a configurable silent-output threshold. **DOCUMENTED C-020**.
- Automatic plug-in latency compensation is claimed. Exact latency/tail callback behavior, dynamic bus reconfiguration, suspend semantics, bypass equivalence, sample-accurate parameter/event delivery, MPE/note expression, MIDI 2.0, offline callback behavior, and process block splitting are **UNKNOWN C-021**.

### 11.5 Parameters, automation, state, presets, and project recall

- The hosted editor's focused-parameter control exposes the last-touched parameter for value display, automation-track creation, envelope insertion, copy/paste, MIDI mapping, and MUX mapping. **DOCUMENTED C-020**.
- VST2 FXB/FXP files may be dropped on the editor. M10 adds VST3 preset open/save and `.vstpreset` drag/drop. **DOCUMENTED C-022**.
- Saved plug-in file identity is part of recall. Current release notes document VST2-to-VST3 migration/rescue: MuLab copies plug-in data where the destination accepts it, also copies MIDI maps/note names, but does not remap parameter IDs. **DOCUMENTED C-022**.
- The Q&A explicitly says VST2 non-parameter bulk data is opaque enough that MuLab cannot reliably know whether it changed; hence save-on-close remains conservative. **DOCUMENTED C-025**.
- MuLab Plugin Demo can save a project/preset but does not serialize/restore its instance state through the outer host without a key. **DOCUMENTED C-004**.
- Full chunk/component-state ordering, asset-reference treatment, stable parameter identity across plug-in updates, placeholder behavior when a plug-in is missing, and state retained while skipping a failed plug-in are **UNKNOWN C-023**. “Confirm load plugins” can skip plug-ins one-by-one to rescue a project, but that is not evidence of a durable placeholder. **DOCUMENTED C-024; UNKNOWN C-023**.

### 11.6 UI, diagnostics, and failure modes

- Plug-in editors open from rack slots. A third-party VST/CLAP editor cannot be embedded directly as the Project Main Module editor; wrapping it in MUX supplies an embeddable MuLab front panel. **DOCUMENTED C-024**.
- Keyboard focus may remain with either the editor or MuLab; MuLab provides explicit focus controls/workarounds. “Always Reset Editor Window” can recreate a problematic editor after reinsertion. M10.2 adds host-border resizing for resizable VST3 editors. **DOCUMENTED C-024**.
- Scan logs, project logs, a “Copy Log” command, CPU/block diagnostics, bit-mismatch messages, and plug-in-by-plug-in load confirmation are documented. **DOCUMENTED C-024**.
- Per-plug-in DPI scaling, headless/no-editor behavior, accessibility of third-party UIs, UI crash containment, and generic-editor completeness are **UNKNOWN C-021, C-036**.

## 12. Extensibility and integration

Documented extension surfaces are user composition rather than public code APIs:

- reusable `.Mux`, rack, `.MuSequence`, `.MuClip`, and project/template files; 32 MUX meta-parameters; custom MUX front panels; XML/text preference overrides; and MIDI mappings/shortcuts. **DOCUMENTED C-009, C-028**;
- VST2/VST3/CLAP hosting in both App and Plugin; MuLab Plugin as a VST2 extension of an outer DAW. **DOCUMENTED C-002, C-016**;
- a narrow `OnQuitScript.xml` added in 10.1 to copy selected setup files among installations. This is not evidence of a general programming language. **DOCUMENTED C-028**.

No current public general scripting API, native-device SDK, controller SDK, OSC/remote protocol, public project-schema specification, or compatibility/versioning contract was found in the official sources searched. Those surfaces are **UNKNOWN C-029**.

## 13. Project format, persistence, interoperability, and collaboration

- `.MuProject` saves project objects and their relationships. App and Plugin open the same project/preset files; modules can also be copied between parallel projects. **DOCUMENTED C-005, C-025**.
- Before saving, MuLab renames the previous project to `ProjectName.backup`; a failed new write can therefore leave one recoverable prior version. This is not documented as autosave or journaling. **DOCUMENTED C-025**.
- The Plugin can exchange a project with App or another Plugin instance through save/open and a temporary `Clipboard.MuProject` used by Copy/Paste Project. **DOCUMENTED C-025**.
- M10 upgrades legacy MuRack presets into `.Mux` racks, and release notes mention M8/M9 project fixes and VST2-to-VST3 migration. The complete backward/forward compatibility window is not specified. **DOCUMENTED C-022, C-025; UNKNOWN C-027**.
- Audio clips reference external files, while other import paths load samples into project objects. Asset collection/archive, path relativization, missing-media relink, and embedding rules remain **UNKNOWN C-027**.
- Documented interchange is audio composition export, per-main-track stems, and MIDI export. No evidence was retained for AAF, OMF, ADM/BWF workflows, MusicXML, DAWproject, cloud collaboration, or version-control integration. **DOCUMENTED C-026; UNKNOWN C-027**.
- Missing-plug-in rescue can skip loads one at a time, but preservation/reattachment semantics are unknown. **DOCUMENTED C-024; UNKNOWN C-023**.

## 14. Delivery, live, post-production, and specialized workflows

- Live Matrix launches clips/scenes; Timeline provides linear arrangement; MIDI can trigger sequences, clips, scenes, and compositions. MuLab Plugin syncs master tempo to the outer host. **DOCUMENTED C-006, C-013**.
- Delivery supports composition audio, selected-region audio, per-track stems, MIDI, and rack/clip renders. Effect-tail range is manual. **DOCUMENTED C-011, C-026**.
- No documented DDP, batch queue, loudness/true-peak workflow, video, ADR, surround/immersive/ADM, notation delivery, or show-control protocol was found. **UNKNOWN C-034**.

## 15. Performance, reliability, security, and accessibility

- App offers graph-aware parallel audio threads, block deadline metering, manual freeze/render, and silence-based plug-in bypass. **DOCUMENTED C-010, C-011, C-020**.
- Scan-crash markers, logs, backup-on-save, and confirm-each-plug-in rescue improve diagnosability, but runtime plug-in crash containment and automatic recovery are not documented. **DOCUMENTED C-017, C-024, C-025; UNKNOWN C-018**.
- Distribution is a self-contained ZIP. User settings normally live in the writable product folder or configured user folder. This aids portability but makes permissions and folder integrity part of operation. **DOCUMENTED C-039**.
- The macOS package is explicitly unsigned, and official installation instructions describe removing quarantine/overriding Gatekeeper. This is a trust/signing liability; the vendor's “safe” label is not independent assurance. **DOCUMENTED C-030**.
- Product materials claim multi-monitor, high-DPI, scalable GUI support. Tested assistive-technology behavior, keyboard-only completion, screen-reader semantics, localization, telemetry/privacy, signing/notarization, and rollback guarantees are **UNKNOWN C-036**.

## 16. Licensing, ecosystem, and implementation constraints

- App and Plugin are separate products with separate personal user keys. Keys are non-transferable; an M10 key covers M10 updates, not later major versions, unless covered by the separate “For Life” offer. **DOCUMENTED C-003, C-030**.
- Demo limits include noise, 40-minute sessions, reminders, and lack of outer-host state persistence for MuLab Plugin Demo. Current release notes supersede stale version-page prose by allowing project/preset saving. **DOCUMENTED C-004**.
- The downloadable product is proprietary. No source-code license or native-module SDK redistribution grant was found. **UNKNOWN C-029, C-030**.
- MuLab's ability to host or be delivered as a plug-in does not convey VST2/VST3/CLAP SDK, trademark, signing, redistribution, or compatibility rights to a new implementation. **INFERENCE C-030**. Independent legal review and current format-owner terms are prerequisites; this dossier is not legal advice.
- The VST2-only outer MuLab Plugin boundary and unsigned macOS package are ecosystem constraints even though the internal host also accepts VST3 and CLAP. **DOCUMENTED C-002, C-016, C-030**.

## 17. Strengths, liabilities, and architecture lessons

### Strengths

1. **One typed graph across DAW, racks, devices, and reusable presets.** This reduces impedance between simple chains and advanced routing. **DOCUMENTED C-005, C-008, C-009, C-015**.
2. **Arrangement/device decoupling.** Hybrid tracks target modules; multiple tracks may share a target or address nested targets. **DOCUMENTED C-007**.
3. **App-in-plugin portability.** A complete project can move between stand-alone and outer-host contexts. **DOCUMENTED C-002, C-025**.
4. **Deep parameter integration.** Plug-in parameters participate in automation, MIDI mapping, MUX meta-parameters, and modulation. **DOCUMENTED C-020**.
5. **Explicit compatibility escape hatches.** VST2 pin regrouping, zeroed buffers, editor reset, scan marker, and load-by-load rescue acknowledge imperfect plug-ins. **DOCUMENTED C-017, C-020, C-024**.

### Liabilities

1. **Unproven fault boundaries.** Crash protection language and marker recovery do not establish sandboxing or runtime isolation. **UNKNOWN C-018; INFERENCE C-032**.
2. **Outer format lag.** MuLab Plugin itself requires VST2 even while the internal host supports VST3/CLAP. **DOCUMENTED C-002, C-016**.
3. **Portability is not dependency closure.** Compatible project files do not establish collected media, plug-in availability, or missing-plug-in placeholders. **UNKNOWN C-023, C-027**.
4. **No graph feedback.** This simplifies ordering and compensation but excludes feedback-network use cases. **DOCUMENTED C-008**.
5. **Limited evidenced ecosystem APIs/interchange and unsigned macOS distribution.** **UNKNOWN C-027, C-029; DOCUMENTED C-030**.

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Support | Prerequisites/tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Users need simple chains and arbitrary routing | Store one typed hierarchical graph; render a rack/slot projection for graph nodes matching a rack predicate | C-005, C-008, C-009, C-015 | Stable node/port identity; graph validation; simple view can misrepresent nonserial routes | Medium | CANDIDATE |
| Tracks should share devices without hidden duplication | Make tracks reference graph targets independently of device ownership | C-007 | Durable references, clear mute/solo semantics, dependency-aware editing | Medium | CANDIDATE |
| Complex devices need a stable automation surface | Give graph containers a bounded macro/meta-parameter bank mapping into nested parameters | C-009, C-020 | Stable parameter IDs and migration; bounded bank may be restrictive | Low | CANDIDATE |
| Plug-in I/O metadata is often wrong or inconvenient | Preserve reported buses but permit explicit, per-plug-in compatibility overrides and rack exposure | C-015, C-020 | Strong diagnostics; overrides can become stale after updates | Medium | CONDITIONAL |
| A full creative environment should travel into another host | Separate project root I/O/tempo adapters from shared project semantics | C-002, C-005, C-013, C-035 | Modern outer formats, host-state limits, bus/parameter caps, robust sync | High | CONDITIONAL |
| Save corruption should retain a last-known copy | Rename prior save to a sidecar backup before writing replacement | C-025 | Atomic filesystem semantics and explicit recovery UI; one generation is limited | Low | CANDIDATE |
| Scans must identify a crashing candidate | Persist “candidate being scanned,” clear on success, quarantine/review on next start | C-017 | Better combined with worker isolation and signed evidence; marker alone cannot contain a crash | Medium | CONDITIONAL |

No protected UI expression, preset content, implementation code, or binary behavior is copied by these abstractions.

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected architectural patterns

- **Reject VST2-only delivery for a new outer plug-in.** It creates licensing, compatibility, and platform longevity risk even though it remains functional for MuLab Plugin. Reopen only for legacy maintenance, not a new primary boundary. **DOCUMENTED C-002; INFERENCE C-030**.
- **Reject scan markers as the entire safety design.** They aid attribution after a crash but do not prove containment. Require worker-process scanning and explicit quarantine in a new host. **DOCUMENTED C-017; INFERENCE C-032**.
- **Reject “compatible project file” as a portability claim without dependency closure.** Media and plug-in availability/state need separate manifests and relink/placeholder semantics. **UNKNOWN C-023, C-027**.
- **Reject unsigned/notarization-bypass distribution as a target practice.** **DOCUMENTED C-030**.

### Curiosity threads not pursued

| Thread | Relevance/value/novelty/cost (0–5) | Decision |
| --- | --- | --- |
| Community plug-in compatibility failures | 2/2/2/3 | `CURIOSITY_NO_GO`: secondary anecdotes cannot establish host internals. |
| Historical separate MUX Modular Plugin lineage | 2/2/3/3 | `CURIOSITY_NO_GO`: current M10 MUX/product boundary is already clear. |
| Binary execution and runtime probing | 3/4/5/5 | `CURIOSITY_NO_GO`: outside documentary clean-room authority. |
| Third-party jBridge behavior | 2/2/2/4 | `CURIOSITY_NO_GO`: external product, not MuLab's guaranteed contract. |
| Wine qualification | 2/2/3/4 | `CURIOSITY_NO_GO`: unofficial compatibility cannot become native Linux support. |
| Native oscillator/effect inventory | 1/1/1/3 | `CURIOSITY_NO_GO`: does not change architecture conclusion. |
| PDC algorithm and DSP precision | 5/3/5/5 | `CURIOSITY_NO_GO`: proprietary; next step is a dynamic harness, not more prose. |
| Benchmarks/multicore scaling | 3/3/4/5 | `CURIOSITY_NO_GO`: requires reproducible execution. |
| General extension API/OSC search | 4/2/3/3 | `CURIOSITY_NO_GO`: official searches returned no material primary page; explicit unknown is more honest. |
| Asset collect/relink and interchange format-by-format searches | 4/3/3/3 | `CURIOSITY_NO_GO`: no clear official source surfaced; file-menu qualification should be a later controlled probe. |
| More licensing text | 2/2/1/3 | `CURIOSITY_NO_GO`: current primary evidence is sufficient for architecture-level constraints. |

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary result | Counterevidence/limit | Later discriminating probe |
| --- | --- | --- | --- |
| H1: App and Plugin are separate UIs over compatible project semantics | Supported: same project/preset files; Plugin instance is a separate project | “Basically same functionality” does not prove identical runtime behavior | Round-trip a fixture with nested MUX, media, automation, and hosted plug-ins |
| H2: M10 racks are a separate fixed chain object | Falsified: they are normal MUX patches identified by Rack Slot presence | Built-in rack editor still assumes seriality for automated operations | Save/reopen deliberately nonserial rack and inspect behavior |
| H3: MuLab Plugin is a VST3/CLAP outer plug-in because it hosts them | Falsified: current system requirement is VST2-compatible host and mac binary is `.vst` | Future releases could add formats | Inspect future signed package manifest only if authorized |
| H4: “Supports VST3/CLAP” proves a complete host contract | Rejected | Format acceptance says nothing about scan, instantiation, buses, state, timing, UI, or recovery | Conformance matrix with one fixture per contract feature |
| H5: scan crash protection proves subprocess isolation | Not supported | Marker may merely identify the last in-process candidate | Crash-only scan fixture plus process-tree/log observation |
| H6: automation/modulation is sample accurate | UNKNOWN | Audio-rate native modulation and curve rendering do not prove host-format event timing | Timestamped parameter-event plug-in and rendered impulse comparison |
| H7: automatic PDC covers all sidechain/multi-output/dynamic-latency cases | UNKNOWN | Only headline and release-note improvements are public | Variable-latency, sidechain, parallel-path impulse fixture |
| H8: missing plug-ins retain an inert placeholder with exact state | UNKNOWN | Skip-on-load rescue and VST2-to-VST3 migration are not placeholder evidence | Save fixture, remove binary, reopen/save/reinstall/reopen and compare state/routing |
| H9: project portability closes media and plug-in dependencies | Not supported | `.MuProject` compatibility coexists with external audio and unidentified plug-in requirements | Move collected/uncollected fixture between clean machines |
| H10: current official docs support formats beyond VST2/VST3/CLAP | No positive evidence found | Absence from one manual is not proof of unsupported behavior | Inspect current Plugin Manager filters/file dialog or obtain vendor matrix |

Negative searches retained: official M10/product discovery for AU/AUv3/AAX/LV2/LADSPA/DSSI/JSFX/DXi/Rack Extension, scripting/SDK/OSC, asset collection, and missing-plug-in placeholders yielded no decision-grade positive primary source. The final targeted web search was rate-limited; known official Preferences and MUX pages were retrieved directly instead. Search snippets were never used as evidence.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | App and Plugin current baseline is 10.2.37 on Windows 64/32 (32 fading) and macOS 64; mac package labeled unsigned | 2026-08-29 downloads | S-002, S-005, S-006 | Direct release/download text | “64 bit” does not identify Intel/ARM; supported OS minima may be stale |
| C-002 | DOCUMENTED | High | MuLab exists as App and Plugin, integrates MUX, and App/Plugin project/preset files are compatible; Plugin is VST2-delivered | M10 family | S-001, S-003, S-009, S-010 | Product/manual/install statements | Runtime parity not independently tested |
| C-003 | DOCUMENTED | High | App and Plugin are separately keyed; Free 8.8.3 lacks plug-ins/multicore/PDC and no Free Plugin exists | Editions | S-005, S-006, S-010 | Direct edition table | Free is legacy, not current M10 baseline |
| C-004 | DOCUMENTED | High | Current Demo can save projects/presets, but Plugin Demo does not persist state in outer host; other demo limits remain | M10.1+ | S-002, S-010 | Newer changelog supersedes stale prose | Version page retains contradictory old sentence |
| C-005 | DOCUMENTED | High | `.MuProject` contains objects/relations and has recursively nestable root MUX; Main Module controls principal project editor | M10 | S-003 | Direct project manual | Runtime flattening remains possible |
| C-006 | DOCUMENTED | High | Composer combines Live Matrix and Timeline and is itself modular | M10 | S-001, S-007 | Direct product/manual text | No dynamic observation |
| C-007 | DOCUMENTED | High | Tracks are hybrid audio/event/automation containers targeting graph modules; sequence clips can share/duplicate sequences | M10 | S-007 | Direct Composer manual | Take/comp semantics not covered |
| C-008 | DOCUMENTED | High | MUX uses typed audio/event/modulation cables, automatic mono/stereo adaptation, low-rate and audio-rate modulation paths, and forbids feedback | M10 | S-008 | Direct Modular Editor manual | Graph engine internals unknown |
| C-009 | DOCUMENTED | High | M10 racks are MUX patches with Rack Slots; MUX has front/deep views, `.Mux` presets and 32 meta-parameters | M10 | S-002, S-012, S-016 | Direct docs/release notes | Exact serialized schema unknown |
| C-010 | DOCUMENTED | High | App uses Core Audio or ASIO/MME and parallel audio threads constrained by upstream dependencies; meter measures block deadline ratio | App M10 | S-003, S-011 | Direct Audio Setup/Project manuals | Plugin-edition scheduler not established |
| C-011 | DOCUMENTED | Medium | Automatic plug-in latency compensation is claimed; rack render/freeze supports main/aux and explicit Freeze Points | M10 | S-001, S-002, S-012 | Vendor statement plus operational docs | Algorithm/coverage not measured |
| C-012 | UNKNOWN | High | Internal precision, sample-rate limits, scheduler internals, deterministic/offline path, oversampling, dropout recovery, and Plugin multicore behavior are not public | M10 engine | S-001, S-003, S-011 | Attempted product/engine/manual review | Controlled engine probes needed |
| C-013 | DOCUMENTED | High | Per-track/clip/event MIDI channels, automation/CC chase, and Plugin host-tempo behavior are documented | M10 Composer | S-002, S-007 | Direct Composer/release text | Protocol-level sync accuracy untested |
| C-014 | UNKNOWN | High | MPE, MIDI 2.0, SysEx fidelity, MTC/sample-accurate MIDI, and notation are not established | M10 | S-007 | Current Composer/product docs reviewed | Poly-pressure and per-event channels are insufficient proof |
| C-015 | DOCUMENTED | High | Rack/MUX routing supports sends, nested areas, sidechains, multi-input effects, multi-output synths, aux exposure and subracks | M10 | S-002, S-004, S-012 | Direct docs | Dynamic I/O behavior unknown |
| C-016 | DOCUMENTED | High | Current manual positively names hosted VST2, VST3 and CLAP; VST2 shells excluded; no positive current evidence retained for other required formats | M10 App/Plugin | S-001, S-004, S-010 | Explicit support sentence and edition table | Absence cannot prove unsupported formats |
| C-017 | DOCUMENTED | High | Plugin Manager/database supports file/item distinction, scan logs/marker, categories and rescans; crash candidate is remembered | M10.1+ | S-002, S-004, S-015 | Direct docs | “Crash protection” mechanism undisclosed |
| C-018 | UNKNOWN | High | Scan/runtime process isolation, sandboxing, quarantine lifecycle, restart and crash containment are not public | M10 host | S-002, S-004, S-015 | No process-boundary statement found | Marker recovery must not be conflated with isolation |
| C-019 | DOCUMENTED | High | Plug-in and MuLab bitness must match; no internal bridge documented; vendor suggests jBridge | M10 | S-004 | Direct 32/64 section | External bridge unqualified |
| C-020 | DOCUMENTED | High | Hosted plug-ins support configurable I/O exposure, VST2 regrouping, parameter automation/MIDI mapping/modulation, and silence bypass | M10 | S-001, S-002, S-004, S-015 | Direct host manual/product/release | Does not prove every plug-in behaves correctly |
| C-021 | UNKNOWN | High | Sample-accurate automation/events, complete latency/tail, dynamic I/O, suspend/bypass/offline, MPE, headless UI contracts are not established | VST2/3/CLAP host | S-002, S-004, S-014 | Host docs reviewed feature-by-feature | Requires format-conformance fixtures |
| C-022 | DOCUMENTED | Medium | FXB/FXP and VST3 presets are supported; VST2-to-VST3 migration copies accepted state/maps but not parameter-ID remapping | M10 | S-002, S-004 | Direct release/manual | Success depends on destination plug-in |
| C-023 | UNKNOWN | High | Complete plug-in state ordering/assets, missing placeholder preservation, reattachment and update migration are not public | M10 project recall | S-002, S-004, S-013 | Rescue/migration docs reviewed | Skip-on-load is not placeholder evidence |
| C-024 | DOCUMENTED | High | UI opens in rack/window, direct third-party Main Module embedding is limited, and logs/editor reset/focus/load rescue diagnostics exist | M10 | S-002, S-003, S-004, S-013 | Direct manuals/release notes | UI crash containment/scaling unknown |
| C-025 | DOCUMENTED | High | Project save retains one `.backup`; App/Plugin exchange projects; VST2 opaque state makes dirty tracking conservative | M10 | S-002, S-003, S-013 | Direct project/Q&A/release statements | No autosave/journal evidence |
| C-026 | DOCUMENTED | High | Import covers streamed WAVE/AIFF and sample variants; export covers mix, stems and MIDI; tails need manual range extension | M10 | S-014 | Direct Composer Functions manual | Codec breadth and offline semantics incomplete |
| C-027 | UNKNOWN | High | Autosave, collect/archive, relink, forward compatibility, advanced interchange and collaboration are not established | M10 persistence | S-003, S-013, S-014 | Official project/Q&A/functions reviewed | UI probe or vendor schema needed |
| C-028 | DOCUMENTED | Medium | Extensibility includes reusable native files/front panels/meta-parameters, MIDI maps/shortcuts, technical preferences and narrow OnQuitScript | M10 | S-002, S-007, S-013, S-015, S-016 | Direct docs/release note | OnQuitScript is not general scripting |
| C-029 | UNKNOWN | High | No public general scripting, native-device SDK, controller SDK, OSC/remote API or public project schema was found | M10 | S-002, S-015, S-016 | Official docs/discovery searched | Absence is not proof; vendor could provide private interfaces |
| C-030 | DOCUMENTED / INFERENCE | High / Medium | Keys are personal/nontransferable and version-bounded; mac package unsigned; format hosting grants no implementation rights | M10/legal boundary | S-005, S-006, S-009, S-013 | First two are documented; rights conclusion is clean-room inference | Not legal advice; format-owner terms not researched here |
| C-031 | INFERENCE | Medium | MuLab exemplifies graph-first arrangement/device decoupling rather than track-owned chains | M10 conceptual model | C-005, C-007, C-009, C-015 | User-visible model assumed architecture-relevant | Proprietary runtime may flatten graph |
| C-032 | INFERENCE | High | Scan marker/crash-protection claims are insufficient evidence of fault containment | M10 host safety | C-017, C-018 | Distinguishes attribution from isolation | Process observation could change conclusion |
| C-033 | UNKNOWN | High | Punch/loop take retention, comping, input monitoring details and advanced edit modes are not established | M10 recording/editing | S-001, S-007, S-014 | Current high-level docs reviewed | Dedicated recording UI probe needed |
| C-034 | UNKNOWN | High | Video, post, surround/immersive, ADM, DDP, loudness and show-control contracts are not established | M10 delivery | S-001, S-014 | Product and export docs reviewed | Dedicated vendor matrix could resolve |
| C-035 | DOCUMENTED | High | Each MuLab Plugin instance is a project with fixed host-facing audio I/O and Project Main Module parameters; exact bus count unknown | Plugin M10 | S-003 | Direct Project manual | “Fixed number” is not quantified |
| C-036 | DOCUMENTED / UNKNOWN | Medium | High-DPI/multi-monitor support is claimed; accessibility, localization, privacy and per-plug-in scaling are not established | M10 UI | S-001, S-002 | Product/release evidence | No assistive-tech tests |
| C-037 | DOCUMENTED | High | There is no official native Linux version; vendor links unofficial approaches | Current family | S-013 | Direct Q&A | Wine behavior unqualified |
| C-038 | INFERENCE | Medium | Separate historical MUX Modular Plugin is outside the current family baseline; MUX is retained as integrated architecture | 2026 product boundary | S-005, S-006, S-016 | Current downloads list MUX only under legacy | Future/current unlinked edition could alter boundary |
| C-039 | DOCUMENTED | High | App/Plugin are self-contained ZIP/folder installations with local/configurable user data | M10 | S-005, S-006, S-009, S-015 | Direct install/preferences docs | Host and OS permissions still constrain portability |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. MuTools is the publisher unless noted. These are primary vendor documents; they are preferred to search snippets, retailer pages, forum reports, or reviews, but they remain vendor claims rather than independent tests.

- **S-001 — “MuLab Inspiring Music Production Studio.”** <https://www.mutools.com/mulab-product.html>. Product page; current family overview. Relevant passages: App/Plugin existence; Live Matrix/Timeline; modular engine; VST2/VST3/CLAP; PDC; modulation; project/preset compatibility; App multicore; Windows/macOS. Supports C-002, C-006, C-011, C-016, C-020, C-036. **Why selected:** most concise canonical product boundary. **Limit:** marketing-level, no implementation proof or exact version.
- **S-002 — “MuLab Modular DAW, Synth and Effect Plugin — Change Log.”** <https://www.mutools.com/mulab-mux-change-log.html>. Official release notes; M10.0–10.2, current 10.2.37 dated 2026-07-16. Relevant sections: rack-to-MUX conversion; sidechains; VST3/CLAP SDK updates; scan manager/protection; Smart Bypass; preset/migration; Plugin fixes; Demo saving; OnQuitScript. Supports C-001, C-004, C-009, C-011, C-013, C-015, C-017, C-020, C-022, C-024, C-025, C-028, C-036. **Why selected:** versioned behavior and migration evidence unavailable from the product page. **Limit:** enormous cumulative log, not a normative host contract.
- **S-003 — “MuLab Project.”** <https://www.mutools.com/info/M10/docs/mulab/mulab-project.html>. Current M10 manual. Relevant sections: `.MuProject`, root Project Modular Area, App vs Plugin root I/O, per-instance project, Main Module, CPU meter, parallel projects. Supports C-002, C-005, C-010, C-024, C-025, C-035. **Why selected:** canonical project and App/Plugin architecture description. **Limit:** user-visible concepts, not storage/runtime internals.
- **S-004 — “Using Plugins.”** <https://www.mutools.com/info/M10/docs/mulab/using-plugins.html>. Current M10 host manual. Relevant sections: supported formats; insertion; VST2 I/O; aux I/O; bypass; automation/MIDI; 32/64; file/item identity; scan marker; shell exclusion; rescue. Supports C-016–C-024. **Why selected:** highest-density normative host workflow source. **Limit:** omits many format-contract edge cases and process boundaries.
- **S-005 — “Download MuLab Music Production Studio.”** <https://www.mutools.com/mulab-app-downloads.html>. Official App download matrix. Relevant passages: App 10.2.37 packages; Windows/macOS/bitness; unsigned macOS; Demo/Full; Free 8.8.3. Supports C-001, C-003, C-030, C-039. **Why selected:** direct current build/package evidence. **Limit:** no OS CPU/minimum details beyond labels.
- **S-006 — “Download MuLab Plugin.”** <https://www.mutools.com/mulab-plugin-downloads.html>. Official Plugin download matrix. Relevant passages: Plugin 10.2.37 VST packages; Windows/macOS/bitness; unsigned macOS; folder install. Supports C-001, C-003, C-030, C-039. **Why selected:** resolves stale discovery snippets and pins Plugin version. **Limit:** says “VST,” not generation; S-009 resolves VST2.
- **S-007 — “Composer.”** <https://www.mutools.com/info/M10/docs/mulab/composer.html>. Current M10 manual. Relevant sections: Live Matrix/Timeline; hybrid tracks; target modules; clip classes; shared sequences; MIDI channels; automation; tempo/host sync; chase. Supports C-006, C-007, C-013, C-028. **Why selected:** canonical arrangement/session model. **Limit:** does not cover recording/comping comprehensively.
- **S-008 — “Modular Editor.”** <https://www.mutools.com/info/M10/docs/mulab/modular-editor.html>. Current M10 manual. Relevant sections: signal types; mono/stereo; modulation arithmetic/rate/overflow; cable properties; feedback prohibition. Supports C-008. **Why selected:** precise graph semantics. **Limit:** no runtime scheduler or serialization.
- **S-009 — “MuLab Plugin Installation.”** <https://www.mutools.com/info/M10/docs/mulab/plugin-installation.html>. Current M10 install manual. Relevant sections: VST2-compatible host requirement; Windows/macOS minimums; self-contained folder; `.vst`; writable settings; quarantine workaround. Supports C-002, C-030, C-039. **Why selected:** resolves the outer plug-in format and operational trust boundary. **Limit:** OS guidance appears historically layered and does not prove current certification.
- **S-010 — “MuLab Versions.”** <https://www.mutools.com/info/M10/docs/mulab/mulab-versions.html>. Edition/manual page. Relevant sections: App/Plugin parity and separate keys; Demo limits; Free limits. Supports C-002–C-004, C-016. **Why selected:** only official edition-entitlement matrix. **Limit:** contains stale prose contradicted by newer S-002; newer release notes control.
- **S-011 — “Audio Setup.”** <https://www.mutools.com/info/M10/docs/mulab/audio-setup.html>. Current M10 manual. Relevant sections: Core Audio/ASIO/MME; buffer tradeoff; MME limitation; processor threads; upstream dependency; CPU meter. Supports C-010, C-012. **Why selected:** strongest public audio-engine/scheduling evidence. **Limit:** App-oriented and omits low-level internals.
- **S-012 — “Rack.”** <https://www.mutools.com/info/M10/docs/mulab/rack.html>. Current M10 manual. Relevant sections: slots/sends/fader; modular routing; render/freeze; MUX rack identity; subracks; legacy MuRack. Supports C-009, C-011, C-015. **Why selected:** canonical simple-rack/modular-rack boundary. **Limit:** user behavior, not graph persistence internals.
- **S-013 — “Questions & Answers.”** <https://www.mutools.com/info/M10/docs/mulab/questions-answers.html>. Official support/manual page. Relevant sections: save crash backup; logs; import; VST2 dirty-state ambiguity; native Linux; key transfer/update term; ZIP rationale. Supports C-022–C-027, C-030, C-037. **Why selected:** explicit recovery and state-ambiguity evidence not found elsewhere. **Limit:** support prose, some policy/technical statements may age.
- **S-014 — “Composer Functions.”** <https://www.mutools.com/info/M10/docs/mulab/composer-functions.html>. Current M10 manual. Relevant sections: audio import modes/formats; composition/stem/MIDI export; sample rate; manual tail range. Supports C-021, C-026, C-027, C-034. **Why selected:** authoritative interchange/delivery list. **Limit:** may not enumerate every contextual command.
- **S-015 — “Settings & Preferences.”** <https://www.mutools.com/info/M10/docs/mulab/preferences.html>. Current M10 manual. Relevant sections: user folder; `VstPlugins.xml`; validity/delete semantics; VST2 zero-output and I/O regrouping. Supports C-017, C-018, C-020, C-028, C-039. **Why selected:** direct cache/database and compatibility-override evidence. **Limit:** XML is user configuration, not a complete database schema or isolation design.
- **S-016 — “MUX Modular.”** <https://www.mutools.com/info/M10/docs/mulab/mux.html>. Current M10 manual. Relevant sections: front panel vs modular area; nested VST/CLAP; `.Mux` library; 32 meta-parameters; recursive synth tagging. Supports C-009, C-028, C-029, C-038. **Why selected:** canonical current MUX boundary. **Limit:** “plugin” is a generic module label here and does not establish a separate current MUX product.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods/blocker | Decision impact | Available evidence | Safest next probe | Required access/fixture | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| Scan and runtime process isolation | Current manual, preferences, release notes; no process statement | Host safety architecture | Marker/log and vague crash protection only (C-017/C-018) | Benign crash-only scanner and processor plug-ins; observe process tree/recovery | Disposable VM, signed test plug-ins, permission | Unassigned |
| Full VST3/CLAP/VST2 contract | Feature-by-feature doc review incomplete | Format choice/adapter design | Positive formats, buses, params, presets (C-016/C-020/C-022) | Automated conformance grid for scan→instantiate→process→state→UI→failure | Format-owner SDK fixtures and licensed build | Unassigned |
| Sample-accurate automation/events | Audio-rate native modulation is not host event timing | Automation engine | C-020/C-021 | Timestamped parameter-event plug-in plus rendered impulse | Test plug-in, offline render capture | Unassigned |
| PDC/dynamic latency/tail | Product headline and release notes only | Graph scheduler/render correctness | C-011/C-021/C-026 | Parallel/sidechain variable-latency impulse and tail fixture | Test plug-ins with controllable latency/tail | Unassigned |
| Missing plug-in placeholder/state | Rescue/migration docs do not describe durable placeholder | Project longevity | C-022–C-024 | Remove/reinstall plug-in across two save cycles; byte/state comparison | Disposable project and stable plug-in builds | Unassigned |
| Plug-in parameter identity/update migration | VST2→VST3 explicitly does not remap IDs | Automation durability | C-022/C-023 | Versioned plug-in changes IDs/names/ranges | Paired test plug-in builds | Unassigned |
| App vs Plugin bus count/multicore | “Fixed number” and App-only multicore labels | App-in-plugin feasibility | C-010/C-012/C-035 | Inspect outer-host bus/parameter declaration and stress independent branches | Authorized installation and test host | Unassigned |
| Internal precision/offline determinism | No public internals | DSP architecture reference value | C-012 | Null tests at multiple rates/blocks and repeat renders | Disposable audio fixtures | Unassigned |
| Autosave/collect/relink/forward compatibility | Project/Q&A/functions searched; no normative source | Portability/data loss | C-025/C-027 | Inspect menus then move fixture to clean machine/version | Two clean installations and media fixture | Unassigned |
| MPE/MIDI 2.0/SysEx/MTC | Composer docs insufficient | Expression/sync architecture | C-014 | Protocol capture with conformance source/sink | MIDI hardware or virtual fixtures | Unassigned |
| Recording/comping | High-level product/composer docs only | Recording workflow coverage | C-033 | UI/behavior matrix for punch, loop takes, monitor and latency | Audio loopback fixture | Unassigned |
| Scripting/SDK/OSC/remote | Official discovery yielded no material source | Ecosystem/extensibility | C-029 | Ask vendor for public developer matrix; inspect documented menus only | Public vendor response/docs | Unassigned |
| Accessibility/privacy/update trust | Product only claims scalable GUI | Product NFR | C-030/C-036 | Accessibility audit, network observation, signed-update inspection | Authorized install, assistive tech, network lab | Unassigned |

## 24. Curiosity pass and stop decision

The research used eight evidence passes with at most two retained sources each. After every pass, gaps were ranked by **decision relevance / expected value / novelty / cost**. The pursued sequence was: identity (5/5/4/1), project/hosting workflow (5/5/4/2), shipping matrix (5/5/3/1), Composer/signal graph (5/5/5/2), Plugin boundary/editions (5/5/3/1), engine/racks (5/5/4/2), durability/interchange (5/5/4/2), and plug-in cache/MUX state surface (5/5/4/2). Rejected threads are retained in section 19 as `CURIOSITY_NO_GO`.

**Coverage check:** every template section is present; each required plug-in row is explicit; App/Plugin/MUX boundaries, OS/version/edition, composition/rack model, engine, routing, scanning/cache/bridge/isolation, I/O/modulation/automation/PDC/state/UI/presets/missing dependencies, persistence, extensibility, licensing, and unknown internals are covered.

**Saturation check:** later official discovery produced duplicates, no positive general API/interchange evidence, and final search requests were rate-limited. The two direct final sources clarified the remaining database/MUX gap but did not change the leading architecture conclusions.

**Stop decision:** `STOP — COVERAGE + BUDGET EXHAUSTION + NONPOSITIVE MARGINAL DOCUMENTARY EVIDENCE`. Sixteen primary sources are sufficient for a complete-with-unknowns dossier. Further web searching is unlikely to resolve proprietary host contracts; the next decision-relevant step is a bounded, lawful interoperability harness, not another documentary pass.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added `research/daw-landscape/dossiers/mutools-mulab.md`; no other edit intended.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** See section 0.
- [x] **Every required dossier heading exists in order.** Sections 0–25 present.
- [x] **Every material assertion has a claim ID and classification.** Body cites C-001–C-039; unknowns remain classified.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See sections 21–23.
- [x] **Every required plugin-format row is present.** All 13 rows are in section 11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover scan, runtime, buses, state, UI, and failures.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** No `OBSERVED` claims are made.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16.
- [x] **Bibliography records source rationale and limitations.** Section 22 has 16 entries.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary retrieval only.
- [x] **Pre-existing workspace changes were left untouched.** No shared file was edited, staged, reset, or committed.

**Checks performed:** template-heading audit; required-format-row audit; claim/source/unknown audit; bibliography count; clean-room and stop-rule audit; owned-path review. **Concise result:** complete with consequential unknowns; 16 primary sources, 39 claims, 0 observations. **Unresolved blockers:** proprietary/runtime internals, rate-limited final discovery, and lack of dynamic-test authority. **Owned path:** `research/daw-landscape/dossiers/mutools-mulab.md`.
