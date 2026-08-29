# Universal Audio LUNA DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** Universal Audio LUNA Digital Audio Workstation / LUNA Recording System.
- **Canonical vendor:** Universal Audio, Inc.
- **Researcher/session:** subagent in session `ses_fb275c7c9ffeEwF3tdwv281zCH`.
- **Owned path:** `research/daw-landscape/dossiers/universal-audio-luna.md`.
- **Research date and cutoff:** 2026-08-29 UTC.
- **Current release pinned:** LUNA 2.0.5, released 2026-07-30. [C-001]
- **Editions/entitlements:** base LUNA plus features or content described as requiring LUNA Pro; the gathered evidence does not establish whether “LUNA Pro” is a separate binary, an in-app entitlement, or primarily a bundle. [C-004]
- **Platforms:** supported desktop releases are macOS 11–26 and Windows 10 64-bit/11. Linux, mobile, and web products were not found in the current official support scope. [C-002, C-003]
- **Included:** the LUNA application, Apollo Mode, native operation with Core Audio/ASIO devices, LUNA Extensions and instruments, UADx/UAD-2 integration, ARA 2, and third-party plug-in hosting.
- **Excluded:** UAD Console as a standalone product, other DAWs hosting UAD plug-ins, hardware internals, proprietary source/binaries, SDK redistribution rights, and runtime claims not documented or safely observed.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.
- **Evidence method:** public clean-room documentary research only. Search results and fetched pages were treated as untrusted evidence until checked against official UA content. No product, installer, session, or plug-in was executed.

## 1. Executive summary

LUNA is now a macOS/Windows linear recording and mixing DAW rather than an Apollo-required front end. Its release lineage documents Core Audio support, Windows support, a native dual-buffer processing model, and current preview work that brings Console Tracking and record-through effects to non-Apollo hardware. Apollo remains a privileged mode: it adds Unison, UAD-2 Record FX, integrated hardware monitoring, and automatic UADx↔UAD-2 substitution for compatible plug-ins during Accelerated Realtime Monitoring (ARM). [C-001, C-005, C-006, C-008]

The strongest differentiator is the **Extension** model. Tape machines, console processing, and summing occupy dedicated mixer/graph locations rather than ordinary insert slots. Most Extensions execute natively and are cross-platform; Spitfire instrument Extensions are macOS-only. This is a proprietary LUNA-only integration surface, not a publicly documented third-party SDK. [C-012, C-013, C-033, C-037]

Current affirmative third-party hosting evidence is limited to **VST3 on macOS/Windows** and generically named **Audio Units on macOS**. UA does not identify the AU generation, so AUv2 versus AUv3 remains unknown. AAX, CLAP, LV2, VST2, and the other required formats have no current official support evidence; omission from the manual is not promoted to proof of rejection. [C-014, C-015, C-027]

The plug-in manager is comparatively well documented: format enablement, manual new/all/single scans, alternate VST3 location, scanned/rejected status, ignoring, categorization, and a Windows cache path. Runtime process isolation, crash containment, architecture bridging, code-signature policy, parameter ABI detail, sample-accurate automation, general plug-in delay compensation, missing-plug-in placeholder behavior, and dynamic I/O remain proprietary or undocumented. [C-016, C-028, C-029, C-030, C-031]

Sessions are cross-platform when common VST3/UAD/Extension dependencies are used; AU instances do not load on Windows. LUNA-to-LUNA session import carries routing, plug-ins, instruments, Extensions, automation, media/versions, and global tape state. Open interchange is mainly audio/stems and MIDI in the gathered evidence; cloud collaboration, AAF/OMF/DAWproject, and durable missing-dependency semantics remain unknown. [C-021, C-022, C-023, C-032]

**Overall confidence:** high for identity/platforms, native-versus-Apollo behavior, current affirmative formats, Extensions, scanning UX, routing, and sidechains; medium for packaging and historical interpretation; low/unknown for proprietary engine and host internals.

## 2. Product identity, history, and market position

UA’s current release notes identify LUNA 2.0.5 as the maintained release at the cutoff. The official manual calls it a digital audio workstation and organizes it around recording, timeline editing, MIDI instruments, mixing, and delivery rather than clip launching, notation, or live performance. [C-001, C-009]

The documented evolution is material to architecture comparison: Core Audio support made Apollo optional on macOS; Windows/ASIO followed; LUNA 1.7.3 added separate Render I/O and Render mixers; LUNA 1.8 added a richer browser and bounce flow; 1.8.1 added plug-in management and macOS VST3; 2.0 added ARA 2; and 2.0.5 previewed Console Tracking and record-through effects for all hardware. This supports the bounded interpretation that LUNA evolved from an Apollo-centric recorder into a native DAW with optional, deeper Apollo acceleration. [C-005, C-008, C-026]

LUNA Pro appears as a commercial entitlement for features such as hardware inserts, but the sources retained in this pass do not prove a separate executable or complete SKU matrix. [C-004]

## 3. Workflow and conceptual model

The primary mental model is a linear **Timeline** paired with an analog-console-like **Mixer**. Audio and MIDI clips live on audio or instrument tracks; bus and main tracks complete the mix graph. A Focus Channel brings the selected channel strip into Timeline view, while alternate windows can show Mixer and Timeline together. [C-009]

The user-visible composition boundaries include clips, track versions, tracks, buses, Main, sends, cues, inserts, instruments, sidechains, tape machines, console/summing Extensions, and a session. Loop recording produces takes; edits are non-destructive at clip level in the documented workflows; bounce can archive the source for restoration. [C-009, C-010, C-021]

No scene launcher, tracker pattern grid, notation system, modular patch graph, or public headless mode was established. These are `UNKNOWN` as absolute exclusions, not assumed absent merely because the current manual centers Timeline/Mixer workflows. [C-029]

## 4. Publicly documented architecture

Public documentation exposes only user-facing architecture:

- native Render and Render I/O mixers use different buffer policies; [C-008]
- Apollo Mode exposes UAD-2 DSP, program, memory, Unison, Record FX, and ARM resources; [C-006, C-025]
- compatible UAD processing can move between UADx native and UAD-2 DSP representations; [C-018]
- Extensions occupy dedicated console, tape, master-tape, and summing positions; [C-012]
- VST3/AU plug-ins pass through a manager with scan state and a persistent cache; [C-016]
- ARA 2 editors integrate with the timeline and docked/floating editor UI. [C-026]

Threading, graph scheduling, process boundaries, inter-process transport, memory protection, plug-in sandboxing, validator implementation, session schema, and proprietary DSP algorithms remain `UNKNOWN`. A rejected scan status is not evidence of a scanner sandbox, and plug-in-related crash fixes are not enough to infer in-process execution. [C-028, C-031]

## 5. Audio engine

LUNA exposes selectable buffers from 32–2048 samples. The documented 1.7.3 model places input-monitored/recording tracks and their destinations in a Render I/O mixer controlled by the selected buffer (then default 64), while non-monitored tracks use a fixed 512-sample Render mixer; choosing above 512 can move the whole system to the larger buffer. Current resource views separately meter Render, Render I/O, memory, and—under Apollo—DSP/program/memory. [C-008, C-025]

Mixdown can be real-time or faster than real-time and can export raw/processed tracks and buses, mono/stereo files, stems, and MIDI with tempo. WAV/AIFF export supports 8–24-bit output and rates supported by the active hardware; MP3/AAC are also documented. Track/bus freeze and bounce exist, and release notes describe a rewritten mixdown/freeze path and source restoration after bounce. [C-023]

The mixer offers manual track delay and LUNA Pro hardware-insert round-trip delay calculation. The gathered sources do **not** define general plug-in delay compensation across inserts, sidechains, multi-output instruments, bypass, freeze, and offline render; nor do they state internal precision, oversampling policy, latency/tail reporting, multicore scheduling, dropout recovery, or denormal behavior. [C-031]

## 6. Tracks, timeline, clips, and editing

Documented track types are audio, instrument, bus, and Main. Timeline operations include audio/MIDI clip record, select, cut/copy/paste/duplicate, split, nudge, ripple-style shift cut/paste/duplicate/insert-time, mute, consolidate, fade, crossfade, loop record, tempo following, warp, and track versions. [C-009, C-010]

LUNA supports tempo and time-signature changes, clip-follow-tempo behavior, automatic tempo detection, and multiple warp algorithms. LUNA 2.0.5 exposes folder tracks, adaptive grid, clip-gain automation, and stem separation as **Feature Previews**, so they should not be treated as unconditional stable-contract guarantees. [C-010, C-039]

No documentary claim is made here about unlimited undo, edit-history persistence, ripple across every object type, or exact clip/source reference semantics. [C-030]

## 7. MIDI, sequencing, notation, and expression

Instrument tracks record and edit MIDI clips; MIDI Merge layers new notes over existing notes, a computer keyboard can generate notes, Panic sends All Notes Off, and MIDI clips or a multitrack MIDI file with tempo can be exported. Multi-output plug-in channels are MIDI-based and return MIDI to the instrument for multi-timbral workflows. [C-010, C-020, C-023]

The manual index includes dedicated MIDI editing chapters, and 2.0.5 previews a separate MIDI Clip Editor. The gathered sources do not establish notation, MPE/per-note expression, MIDI 2.0, SysEx recording, sample-accurate MIDI event delivery, MIDI-generating plug-ins, or complete clock/MTC behavior. [C-029, C-039]

## 8. Routing, mixer, automation, and control

Audio, instrument, and bus channels can route to Main, buses, hardware/virtual outputs, or multiple destinations. Sends can target buses, Main, or physical outputs and can be pre/post-fader; up to four custom stereo cue mixes are documented, with availability depending on Apollo hardware. Bus Spill exposes a bus and its sources. Mono and stereo tracks have format-specific panning. [C-011]

Each audio/instrument/bus track has one sidechain input feeding one sidechain-capable plug-in or Extension. The source is post-plug-in, post-Extension, and pre-fader; AU, VST3, UAD, and API console destinations are documented. Sidechain trim, audition, power, and stereo-link controls are exposed. [C-019]

Tracks can write and edit automation, including fader/mute and imported plug-in/Extension automation state. Session import preserves or replaces track automation. However, automation sampling rate, touch/latch details across all parameters, stable parameter IDs, range/text conversion, and sample accuracy are not documented in retained sources. [C-038, C-029]

MCU-compatible surfaces and named integrations such as SSL/Softube appear in the manual/release history. No public OSC, scripting, or general remote-control API was found. [C-033]

## 9. Recording, comping, and media handling

LUNA documents record/input enable, punch-in during playback, pre/post-roll, count-in, loop recording, takes, monitoring, and cue mixes. Apollo ARM is the deepest low-latency path; current feature previews extend Console Tracking and Record FX workflows to non-Apollo interfaces. [C-005, C-006, C-010, C-039]

Sessions can import audio/MIDI and LUNA session data, export clips, and mix down WAV, AIFF, MP3, AAC, stems, and MIDI. Sample-based UA instruments require SSD storage; the general session recommendation is SSD, with stated filesystem constraints. [C-002, C-023, C-037]

Video, conform, proxy media, BWF metadata depth, automatic asset collection, relinking rules, and missing-file UI are not established in the retained sources. [C-030, C-032]

## 10. Instruments, effects, content, and native devices

Three integration classes must be kept distinct:

1. **UADx** effects/instruments execute natively and use their own presets. [C-014, C-017]
2. **UAD-2** effects execute on Apollo/Accelerator DSP and include Unison/Record FX-only placements; compatible standard inserts can convert to/from UADx. [C-006, C-018]
3. **LUNA Extensions** run only inside LUNA and integrate into dedicated tape/console/summing/instrument workflow positions. [C-012, C-013]

Architecture-relevant Extension examples are Neve/API summing, API Vision/API 2500 console processing, Oxide/Studer multitrack tape, and Ampex master tape. Up to four session-global tape machines can feed per-track tape controls. Most Extensions are macOS/Windows native; Spitfire instrument Extensions are macOS-only and require APFS SSD storage. UA’s manual also points to Shape and UAD instrument documentation, but an exhaustive, fast-changing instrument catalog was intentionally not retained. [C-012, C-013, C-037]

No public modulation graph, rack/macro system, or third-party Extension authoring SDK was found. [C-033]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means no affirmative current official support evidence was found; it does not assert that loading was dynamically disproved. “Audio Units” is UA’s term; the generation is not specified. [C-027]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `UNKNOWN:no current host evidence` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | Current 2.0.5 family; 2026 insert manual documents other formats | A historic release-note fix mentions accidental factory VST2-folder scanning; that is not proof of support | C-027 / S-001, S-006 |
| VST3 | `DOCUMENTED:supported` | `DOCUMENTED:supported` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | LUNA 2.0.5 scope; manual updated 2026-01-13 | Enable/scan on both OSes; cross-OS recommendation; instruments/effects, sidechain, multi-output and ARA evidenced | C-014–C-016, C-019, C-020, C-026 / S-001, S-006, S-007, S-014 |
| AUv2 | `UNKNOWN:generic AU is supported, subtype unstated` | `NOT_APPLICABLE:Apple format/Windows host does not load AU` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | 2026 manual says “Audio Units (macOS)” | Do not upgrade generic AU evidence to AUv2; AU sessions fail to load that plug-in on Windows | C-014, C-015, C-027 / S-006, S-007 |
| AUv3 | `UNKNOWN:generic AU is supported, subtype unstated` | `NOT_APPLICABLE:Apple format/Windows host does not load AU` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | Same as AUv2 row | No explicit AUv3/component-extension statement found | C-027 / S-006, S-007 |
| AAX | `UNKNOWN:no current host evidence` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | Current manual’s affirmative set omits AAX | No dynamic rejection test; Avid licensing/certification not researched for implementation authority | C-027 / S-006 |
| CLAP | `UNKNOWN:no current host evidence` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | Current manual’s affirmative set omits CLAP | No public support statement found | C-027 / S-006 |
| LV2 | `UNKNOWN:no current host evidence` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | Current manual’s affirmative set omits LV2 | No public support statement found | C-027 / S-006 |
| LADSPA | `UNKNOWN:no current host evidence` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | Current manual’s affirmative set omits LADSPA | No public support statement found | C-027 / S-006 |
| DSSI | `UNKNOWN:no current host evidence` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | Current manual’s affirmative set omits DSSI | No public support statement found | C-027 / S-006 |
| JSFX | `UNKNOWN:no current host evidence` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | Current manual’s affirmative set omits JSFX | No public support statement found | C-027 / S-006 |
| DirectX/DXi | `NOT_APPLICABLE:Windows technology` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | Current Windows manual documents VST3, not DX/DXi | No public support statement found | C-027 / S-006, S-007 |
| Rack Extension | `UNKNOWN:no current host evidence` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | Current manual’s affirmative set omits Reason Rack Extension | Do not confuse with LUNA Extensions | C-027 / S-006, S-009 |
| Product-native/other | `DOCUMENTED:UADx, UAD-2, LUNA Extensions, ARA 2; Spitfire Extensions Mac-only` | `DOCUMENTED:UADx, UAD-2, most LUNA Extensions, ARA 2; no Spitfire Extensions` | `NOT_APPLICABLE:no Linux LUNA` | `NOT_APPLICABLE:no mobile/web LUNA` | LUNA 2.0.5 / manual 2026 | UAD-2 requires compatible DSP hardware; Extensions are LUNA-only; ARA uses supported VST3 ARA plug-ins | C-006, C-012–C-014, C-026, C-037 / S-001, S-006, S-007, S-009, S-010 |

### 11.2 Discovery, scanning, validation, and recovery

VST3 and AU formats can be enabled/disabled. On Windows VST3 is enabled by default; on macOS AU is default and VST3 must be enabled. First-time/new plug-ins require an explicit scan; users can rescan all, scan new/updated, or scan one item. An alternate VST3 location can be chosen. Manager columns expose format, manufacturer, name, category, version, status (`new`, `scanned`, `rejected`), and an Ignore switch. Windows documents a persistent `workspace/plugin_cache` location. [C-016]

The sources do not explain discovery paths for the default locations, duplicate IDs, cache key/schema, blacklist versus quarantine semantics, why a plug-in was rejected, crash-safe scanner process boundaries, automatic retry, or macOS cache location. AU/VST3 variants can coexist and are labeled in UI, but identity unification is unknown. [C-028, C-030]

### 11.3 Runtime isolation and compatibility

LUNA, UADx, and UA Connect run natively on Apple silicon. This does not prove that LUNA bridges Intel-only AU/VST3 binaries, launches Rosetta helpers, or isolates plug-ins in separate processes. No such behavior is documented in retained evidence. [C-007, C-028]

Release notes contain fixes for crashes/hangs during scan, instantiate, sample-rate change, offline mixdown, and quit with particular plug-ins. Those reports establish failure modes, not the runtime topology or absence/presence of containment. Windows further documents third-party GUI scaling and keyboard-focus problems. [C-035]

UAD-2 usage on Apple silicon requires UA’s driver/security-policy steps; that constraint belongs to UAD DSP hardware, not evidence that native-only LUNA lowers system security. [C-007]

### 11.4 Host/plugin processing contract

Standard inserts are available on audio, instrument, bus, and Main tracks and are not recorded to disk. Instruments and effects are categorized; sidechain-capable AU/VST3 processors receive one track-level source; multi-output plug-ins can create MIDI-based output channels that carry audio from and MIDI back to the instrument. LUNA 2.0 adds VST3 ARA 2 integration. [C-014, C-019, C-020, C-026]

Apollo ARM can automatically substitute compatible UADx instances with UAD-2 equivalents. Non-UAD DSP inserts on an ARM-enabled track are bypassed while armed; Record FX and Unison slots accept only UAD-2, with Unison further restricted to compatible processors. [C-006, C-018]

Unknown host-contract details include arbitrary audio/event bus counts, dynamic bus changes, MIDI output from ordinary effects, MPE/MIDI 2.0, sample-accurate event/automation delivery, latency/tail query behavior, suspend/sleep policy, in-place processing, offline-call distinctions, and headless rendering. [C-029, C-031]

### 11.5 Parameters, automation, state, presets, and project recall

LUNA exposes plug-in automation alongside track automation and can carry plug-ins/instruments, Extensions, routing, automation, and audio/MIDI versions through LUNA-to-LUNA session import. UAD and third-party presets can be browsed, saved, renamed, deleted, favorited, and assigned as defaults; UADx presets are distinct from UAD-2 presets. [C-017, C-021, C-038]

The gathered sources do not define stable parameter identity, normalized ranges, display text, gesture semantics, state-chunk size, asset-reference handling, or migration across plug-in formats. Cross-OS documentation says AU plug-ins do not load on Windows, but it does not say whether an inactive placeholder preserves AU state for a later Mac reopen. Missing/unlicensed plug-in UI, substitution rules, and recovery are therefore `UNKNOWN`. [C-030]

### 11.6 UI, diagnostics, and failure modes

Plug-in windows float; ARA editors can dock or undock. A global shortcut hides/restores floating windows and another closes them. The insert tile indicates authorized, unauthorized, soft-bypassed, powered-off, focused, and window-open states. UAD interfaces resize 75–200% system-wide; third-party UI scaling behavior is not generalized, and Windows warns of VST3 GUI issues above 100% scaling. [C-017, C-026, C-035]

Users can create an icon snapshot from a third-party plug-in UI. Logs and caches have documented Windows paths. Error taxonomy, per-instance crash recovery, diagnostics attached to rejected scans, headless UI fallback, accessibility of third-party editors, and safe-mode session opening remain unknown. [C-016, C-028, C-034]

## 12. Extensibility and integration

LUNA Extensions are proprietary, in-product integrations installed and authorized through UA Connect. They run exclusively in LUNA and provide console/tape/summing/instrument placements beyond the ordinary insert contract. ARA 2 is the only documented third-party deep-timeline extension mechanism in the retained sources. [C-012, C-013, C-026]

MCU control surfaces and specific vendor integrations are supported, and shortcuts are customizable. No public LUNA scripting language, general command API, OSC endpoint, controller SDK, Extension authoring SDK, binary stability promise, or third-party certification path was found. [C-033]

## 13. Project format, persistence, interoperability, and collaboration

On macOS a LUNA session uses a package representation; Windows lacks package semantics and opens the session folder through Recent/Open From Disk or an included shortcut. Cross-platform sessions are documented, with VST3/UAD/Extensions as the portable dependency set and AU as the known exception. [C-022]

Import Session Data can select source versions and import/merge/replace audio, MIDI, track versions, track settings, plug-ins, instruments, LUNA Extensions, sends, I/O, automation, tempo/time signature, markers, and four global tape-machine states. [C-021]

Audio/stem/clip and MIDI export provide practical interchange. No retained evidence establishes AAF, OMF, ADM/BWF interchange, MusicXML, DAWproject, cloud collaboration, version-control compatibility, archive/collect, forward compatibility, autosave/crash recovery, or a durable missing-plug-in placeholder. [C-023, C-030, C-032]

## 14. Delivery, live, post-production, and specialized workflows

LUNA supports real-time/faster offline stereo mixdown, selected tracks and buses, dry or processed stems, mono preservation, WAV/AIFF/MP3/AAC, clip export, and MIDI with tempo. Hardware inserts require real-time mixdown and a LUNA Pro entitlement. [C-004, C-023]

The product’s specialization is studio tracking and console-style mixing, especially with Apollo, Unison, cues, Extensions, and hardware inserts. Current evidence does not establish DDP, broadcast loudness workflows beyond ARA tools, ADR, video post, surround/immersive/ADM delivery, or live-show control. [C-006, C-012, C-032]

## 15. Performance, reliability, security, and accessibility

Official recommendations include an Intel quad-core i7 or Apple silicon, 16 GB RAM, and SSD session/instrument storage. LUNA exposes Render/Render I/O/memory and Apollo DSP/program/memory meters. Windows recommends an Administrator user account and 100% display scaling due known VST3 GUI issues. [C-002, C-025, C-035]

Release notes repeatedly fix plug-in scan/instantiate/UI/state/mixdown crashes and large-session RAM/load issues. This is useful negative evidence that plug-ins can destabilize host workflows, but no rate or comparative reliability can be inferred. [C-035]

UA Connect, iLok License Manager, and a PACE account form a supply-chain and authorization dependency. Apple-silicon UAD-2 drivers require reduced-security/kernel-extension configuration. Code signing/notarization enforcement for third-party plug-ins, telemetry/privacy, rollback, localization, first-party accessibility conformance, screen-reader behavior, and plug-in accessibility boundaries were not established. [C-007, C-024, C-034]

## 16. Licensing, ecosystem, and implementation constraints

LUNA and Extensions are installed/authorized through UA Connect, which must remain installed; a free PACE iLok account and iLok License Manager are required. Release history says newer LUNA licenses support up to three simultaneous iLok USB/host-computer authorization locations, and reliable fully offline launch was documented with an iLok USB. [C-024]

UAD-2 plug-ins and Apollo Mode require compatible UA hardware/software. Most Extensions are native after installation; Neve Summing uniquely requires registered Apollo/UAD Accelerator ownership to purchase even though it then runs natively. Spitfire LUNA instruments are macOS-only. [C-006, C-036, C-037]

Naming VST3, Audio Units, ARA, AAX, or other formats grants no SDK, trademark, redistribution, certification, or compatibility rights. No legal conclusion is drawn. Proprietary binaries, session formats, and DSP algorithms were not inspected; any implementation must use independently licensed SDKs/specifications and its own clean-room design. [C-027, C-033]

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** LUNA cleanly layers a native DAW over optional hardware acceleration, exposes explicit native/DSP conversion for matching UA processors, integrates tape/console/summing as graph-aware concepts, provides detailed scan management, and documents a narrow sidechain contract. Cross-platform VST3 guidance and rich LUNA-to-LUNA import improve portability inside its ecosystem. [C-005, C-012, C-016, C-018–C-022]

**Liabilities.** Third-party format breadth is narrow in affirmative documentation; AU subtype and omitted-format status are unclear. Extensions and session interchange are ecosystem-bound. The public contract is silent on isolation, bridging, PDC, sample-accurate automation, missing plug-ins, and open interchange. Windows has known VST3 UI/focus constraints, and deeper UAD-2 operation adds hardware, driver, and security-policy dependencies. [C-007, C-027–C-035]

**Architecture lesson.** The most useful reference is not proprietary implementation but the product boundary: ordinary inserts, dedicated console/tape/summing nodes, and an optional hardware-accelerated monitoring lane are separate user concepts. The design risk is coupling project durability and advanced workflow too tightly to private extension and licensing ecosystems. [C-012, C-018, C-030, C-033]

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites/tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Low-latency recording without sacrificing mix CPU | Separate record-monitored and mix scheduling domains with explicit latency/resource UI | C-008, C-025 | Graph partitioning and transition correctness; larger test matrix | Do not copy UA internals or claims of “indiscernible” latency | `CANDIDATE` |
| Optional DSP hardware | Stable processor identity/state mapping between native and accelerator implementations | C-018 | Bit/state compatibility and licensing; fallback rules | UA mapping is proprietary and product-specific | `CONDITIONAL` |
| Console/tape semantics get lost in generic inserts | First-class typed graph positions for input, console, tape, inserts, fader, summing, and master tape | C-012, C-019 | More rigid graph and migration burden | Avoid protected UI/expression and model names | `CANDIDATE` |
| Plug-in discovery is opaque | Manager with enablement, new/all/single rescan, status, ignore, categories, version, and cache diagnostics | C-016 | Scanner isolation still required | LUNA does not publicly solve crash containment | `CANDIDATE` |
| Cross-OS project recall | Prefer a shared plug-in format and surface nonportable dependencies before save/transfer | C-015, C-022 | Identity/state equivalence qualification | Format sameness alone does not guarantee state compatibility | `CANDIDATE` |
| Sidechain graphs become ambiguous | One explicit source and one processor destination per track, with visible tap point and controls | C-019 | Simplicity limits multi-key workflows | May be too restrictive for advanced routing | `CONDITIONAL` |
| Complex session reuse | Selective import with preview, track matching, and replace/merge/new-version policies | C-021 | Strong internal schema/migration | Closed-format reuse is not open interchange | `CANDIDATE` |
| Extension ecosystems damage durability | Persist typed extension state plus a neutral rendered/fallback representation | C-030, C-033 | Extra storage and rendering policy | LUNA fallback behavior is unknown; this is a new design recommendation | `CONDITIONAL` |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject hardware ownership as a general software-feature purchase gate.** Neve Summing provides evidence that licensing and execution constraints can diverge; copying that ecosystem gate would reduce portability. Reopen only for a separately justified hardware-bundled business model. [C-036]
- **Reject assuming scan rejection equals sandbox safety.** The manager exposes `rejected`, but process containment is unknown. Reopen only with public engineering evidence or safe dynamic process observation. [C-016, C-028]
- **Reject treating generic “Audio Units” as AUv2 and AUv3 support.** Exact subtype is decision-relevant and undocumented. Reopen with UA support confirmation or a disposable signed-fixture matrix. [C-027]
- **Reject treating omission as proof that AAX/CLAP/LV2/VST2 are rejected.** Current docs provide an affirmative set, not a complete negative contract. Reopen if UA publishes a formal matrix or a lawful qualification fixture is authorized. [C-027]
- **Reject equating native Apple-silicon LUNA with Intel plug-in bridging.** Host architecture and guest plug-in compatibility are distinct. [C-007, C-028]
- `CURIOSITY_NO_GO`: exhaustive instrument/effect catalog—high churn, low architecture value.
- `CURIOSITY_NO_GO`: marketing/market-share history—does not change the host/extension decision.
- `CURIOSITY_NO_GO`: reverse engineering binaries/session packages—prohibited and unnecessary for documentary coverage.
- `CURIOSITY_NO_GO`: broad forum anecdotes—lower authority than retained manuals and unlikely to resolve proprietary internals.
- `CURIOSITY_NO_GO`: recursively fetch every manual chapter—high duplication and diminishing marginal evidence after the current claims/unknowns were saturated.
- `CURIOSITY_NO_GO`: cloud-feature search after pass 7—lower expected decision value than the final routing/sidechain pass; cloud remains explicitly unknown.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test | Result | Counterevidence/next test |
| --- | --- | --- | --- |
| H-01: Apollo hardware is mandatory for current LUNA | Current requirements and release lineage | **FALSIFIED**: Core Audio/ASIO operation is supported; Apollo Mode is optional | Dynamic test with a class-compliant interface if later authorized [C-002, C-005] |
| H-02: LUNA Extensions are UAD-2 DSP processors | Extension requirements and mixing manual | **FALSIFIED**: most run natively; Neve purchase gate does not imply DSP execution | Inspect per-extension resource meters in a disposable session [C-013, C-036] |
| H-03: AU and VST3 make sessions equally cross-platform | Windows manual | **FALSIFIED**: AU does not load on Windows; VST3 is recommended | Test same-vendor AU/VST3 state equivalence; not guaranteed [C-015] |
| H-04: “Rejected” proves scan isolation | Plug-in manager manual | **NOT SUPPORTED**: status is documented, mechanism is not | Observe process tree and crash fixture safely [C-016, C-028] |
| H-05: “VST3 supported” implies full host contract | Sidechain/multi-output/ARA/release evidence versus unknowns | **PARTIAL ONLY**: several buses/UI paths work, but PDC, tails, sample accuracy, dynamic I/O, and state edge cases remain unknown | Versioned conformance fixture [C-019, C-020, C-026, C-029–C-031] |
| H-06: Native Apple-silicon host bridges Intel plug-ins | Apple-silicon compatibility page | **NOT SUPPORTED**: page speaks only to UA software | Signed universal/arm64/x86_64 test plug-ins [C-007, C-028] |
| H-07: Omitted formats are definitely unsupported | Current affirmative host list | **INCONCLUSIVE**: strong practical signal, insufficient for absolute rejection | Formal UA matrix or safe fixture [C-027] |
| H-08: LUNA Pro is a separate executable edition | Release notes | **INCONCLUSIVE**: features are entitlement-gated; binary packaging unproven | Current UA commercial terms/product page [C-004] |
| H-09: Cross-platform session means missing plug-in state is preserved | Windows session page | **INCONCLUSIVE**: AU does not load, but placeholder/state retention is unstated | Mac→Windows→Mac round trip with uniquely marked state [C-030] |

The analysis deliberately distinguishes **format accepted**, **scan succeeds**, **instance opens**, and **full contract works**. Only the first two and selected sidechain/multi-output/ARA behaviors are documented; full conformance is not claimed. [C-016, C-019, C-020, C-026, C-029]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | **DOCUMENTED** | High | Current release is LUNA 2.0.5, dated 2026-07-30. | Cutoff 2026-08-29 | S-001 | Official release notes | A later unindexed build before cutoff was not found |
| C-002 | **DOCUMENTED** | High | Supported systems are macOS 11–26 and Windows 10 64-bit/11, with UA Connect/iLok dependencies and stated storage recommendations. | 2026 requirements | S-002 | Official system matrix | Recommendations are not measured performance |
| C-003 | **INFERENCE** | High | LUNA has no supported Linux/mobile/web edition in current scope. | Current family | S-002, S-004 | Official supported-platform list and desktop-only manual | Absence is not proof that no experiment/internal build exists |
| C-004 | **INFERENCE** | Medium | LUNA has base operation plus LUNA Pro-gated features/content, but the exact edition/binary boundary is unclear. | 2.0.x | S-001 | Hardware Inserts explicitly require LUNA Pro | Current sales page not retained |
| C-005 | **DOCUMENTED** | High | LUNA supports non-Apollo Core Audio/ASIO operation; Apollo is an enhanced optional mode. | Current and release lineage | S-001, S-002, S-007 | Official requirements/releases | Some monitor features remain Apollo-only |
| C-006 | **DOCUMENTED** | High | Apollo Mode adds ARM, Unison/Record FX UAD-2 paths and hardware integration; Windows lacks automatic low-buffer VI ARM. | Current | S-002, S-006, S-007, S-011 | Official manual/requirements | Exact latency and graph topology unknown |
| C-007 | **DOCUMENTED** | High | LUNA/UADx run natively on Apple silicon; UAD-2 driver use requires reduced-security/kernel-extension steps. | Apple silicon M1–M5 | S-008 | Official compatibility page | Does not describe third-party plug-in architectures |
| C-008 | **DOCUMENTED** | High | LUNA documents separate Render I/O and Render mixers with selected versus fixed-512 buffer policies. | Since 1.7.3; current lineage | S-001, S-011 | Release notes plus current meter UI | Scheduler/thread internals unknown |
| C-009 | **DOCUMENTED** | High | LUNA uses Timeline/Mixer views and audio, instrument, bus, and Main tracks. | Current manual | S-011, S-012, S-013 | Official workflow descriptions | No claim of exhaustive hidden object types |
| C-010 | **DOCUMENTED** | High | Audio/MIDI clip recording/editing, loop takes, tempo/warp, track versions, and MIDI Merge are supported. | Current manual | S-001, S-011, S-012 | Official manual/releases | Expression and event timing depth unknown |
| C-011 | **DOCUMENTED** | High | Mixer supports sends, buses, cues, hardware/virtual outputs, multiple destinations, mono/stereo pan, and Bus Spill. | Current manual | S-011, S-013 | Official mixing manual | Feedback rules/surround not established |
| C-012 | **DOCUMENTED** | High | Extensions are LUNA-only processors integrated into console, tape, master-tape, and summing workflow positions. | Current | S-009, S-010 | Official Extension docs | Internal API is not disclosed |
| C-013 | **DOCUMENTED** | High | Most Extensions are native and cross-platform; Spitfire Extensions are Mac-only. | 2026 | S-007, S-009 | Official requirements/session page | Individual catalog may change |
| C-014 | **DOCUMENTED** | High | Current insert families are UAD-2, UADx, AU on macOS, and VST3 on macOS/Windows. | Manual updated 2026-01-13 | S-006 | Explicit plug-in overview/manager | AU generation unstated |
| C-015 | **DOCUMENTED** | High | AU instances do not load on Windows; UA recommends VST3 on both OSes for session portability. | Current | S-006, S-007 | Explicit cross-platform guidance | State equivalence between AU/VST3 not promised |
| C-016 | **DOCUMENTED** | High | Manager supports format enablement, manual scan/rescan scopes, alternate VST3 path, status/ignore/category/version, and a Windows cache. | Current | S-006, S-007 | Official manager/manual | Validation internals and Mac cache unknown |
| C-017 | **DOCUMENTED** | High | Plug-in UI supports floating-window controls, tile states, presets/defaults/favorites, and UAD scaling; soft/hard bypass are distinguished. | Current | S-006 | Official insert manual | Third-party scaling/headless behavior not generalized |
| C-018 | **DOCUMENTED** | High | Compatible standard inserts can convert UADx↔UAD-2; Apollo ARM can substitute automatically. | Apollo Mode | S-006 | Explicit conversion workflow | Mapping fidelity and supported inventory not enumerated |
| C-019 | **DOCUMENTED** | High | One sidechain input per audio/instrument/bus track feeds one sidechain-capable AU/VST3/UAD/Extension processor from a post-processing, pre-fader source. | Current | S-014 | Explicit sidechain contract | Multiple sidechains per track not documented |
| C-020 | **DOCUMENTED** | High | Multi-output plug-ins create MIDI-based LUNA channels carrying plug-in audio out and MIDI back for multitimbral use. | Since 1.7 | S-001 | Official release notes | Dynamic I/O and maximum output count unknown |
| C-021 | **DOCUMENTED** | High | LUNA-to-LUNA import carries selectable tracks, routing, plug-ins/instruments, Extensions, automation, versions, media, and global tape state. | Current | S-012 | Explicit import options | Not an open interchange format |
| C-022 | **DOCUMENTED** | High | Sessions are cross-OS; macOS package versus Windows folder/open behavior differs; AU is the portability exception. | Current | S-007 | Official Windows manual | Round-trip missing-state preservation unknown |
| C-023 | **DOCUMENTED** | High | LUNA exports real-time/offline mixes, tracks/buses/stems/clips, WAV/AIFF/MP3/AAC, and MIDI with tempo. | Current | S-001, S-011, S-013 | Official manual/releases | Internal render precision and tails unknown |
| C-024 | **DOCUMENTED** | High | UA Connect, iLok License Manager/account, host/iLok authorization, and USB-iLok offline operation are documented dependencies/options. | Current plus 1.4.8/1.5 lineage | S-001, S-002, S-009 | Official requirements/releases | Exact current grace periods and transfer terms not captured |
| C-025 | **DOCUMENTED** | High | Resource UI meters Render, Render I/O, memory, and Apollo DSP/program/memory. | Current | S-011 | Official UI manual | Meter algorithm and limits unknown |
| C-026 | **DOCUMENTED** | High | LUNA 2.0 supports VST3 ARA 2 with timeline access and docked/undocked editors. | 2.0.x | S-001 | Official release notes | Per-product conformance varies; AU ARA not documented |
| C-027 | **UNKNOWN** | High that evidence is absent | AUv2 versus AUv3 and affirmative support/rejection for VST2, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DX/DXi, and Rack Extension are unresolved. | Current 2.0.5 | S-001, S-006, S-007 | Current affirmative set checked; historic VST2-folder mention retained | Next probe: formal UA response or lawful fixture matrix |
| C-028 | **UNKNOWN** | High that evidence is absent | Scan/runtime process isolation, sandboxing, crash containment, architecture bridging, signing and quarantine policies are undisclosed. | Current | S-006–S-008 | Manager, cache, crashes, native-host docs checked | Next probe: process observation with signed crash fixtures |
| C-029 | **UNKNOWN** | High that evidence is absent | Full audio/MIDI/event host contract—including MPE/MIDI 2.0, dynamic I/O, sample accuracy, suspend and headless paths—is not documented in retained sources. | Current | S-001, S-006, S-011, S-014 | Positive sidechain/multi-output evidence is partial | Versioned conformance harness needed |
| C-030 | **UNKNOWN** | High that evidence is absent | Missing/unlicensed plug-in placeholders, state retention/migration, asset references, safe recovery, and session schema are undocumented. | Current | S-001, S-006, S-007, S-012 | Save/recall fixes and cross-OS AU failure checked | Round-trip fixture and support clarification needed |
| C-031 | **UNKNOWN** | High that evidence is absent | General plug-in delay compensation, latency/tail reporting, internal precision, multicore scheduling and oversampling policy are undisclosed. | Current | S-001, S-011, S-013 | Manual track delay/hardware insert compensation are narrower facts | Latency impulse/tail/offline fixtures needed |
| C-032 | **UNKNOWN** | High that evidence is absent | AAF/OMF/ADM/MusicXML/DAWproject, cloud collaboration, archive/collect, video/post and open project interchange were not established. | Current | S-004, S-011–S-013 | Manual index and retained workflow/export pages checked | Search exact import/export/collaboration docs next |
| C-033 | **UNKNOWN** | High that evidence is absent | No public LUNA Extension-authoring, scripting, OSC, or general controller SDK was found. | Current | S-004, S-009, S-010 | Extension/manual scope checked | Vendor developer documentation would discriminate |
| C-034 | **UNKNOWN** | High that evidence is absent | Accessibility conformance, plug-in UI accessibility boundary, telemetry/privacy, signing enforcement, and rollback policy remain unresolved. | Current | S-002, S-006–S-008 | Requirements and UI docs checked | Accessibility/privacy/support documentation next |
| C-035 | **DOCUMENTED** | High | Official docs record plug-in scan/instantiate/state/UI/mixdown crashes/fixes and current Windows VST3 scaling/focus issues. | Release history/current Windows | S-001, S-007 | Negative official evidence | Does not establish incidence or process topology |
| C-036 | **DOCUMENTED** | High | Neve Summing requires registered Apollo/Accelerator to purchase but runs natively once installed. | 2026 | S-009 | Explicit note | Commercial terms may change |
| C-037 | **DOCUMENTED** | High | Spitfire LUNA instruments are Mac-only; sample-based UA instruments require SSD storage; Shape/instrument docs are separate from the LUNA manual. | 2026 | S-002, S-003, S-009 | Official requirements/manual pointer | Exhaustive instrument inventory intentionally omitted |
| C-038 | **DOCUMENTED** | Medium-high | LUNA records/edits track and processor automation and imports it between LUNA sessions. | Current | S-011, S-012 | Manual workflow/import | Sample accuracy and parameter semantics unknown |
| C-039 | **DOCUMENTED** | High | Folder tracks, MIDI Clip Editor, adaptive grid, stem separation, clip-gain automation and all-hardware tracking features are 2.0.5 Feature Previews. | 2.0.5 | S-001 | Official release notes | Preview status means behavior may change |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Official UA support/manual pages were preferred over reviews because they are current, product-scoped primary documentation. Vendor statements establish what UA documents, not independent performance.

- **S-001 — “LUNA Release Notes,” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/360041532452-LUNA-Release-Notes. Official release history; current 2.0.5 and historical 1.x/2.x scope. Relevant sections: 2.0.5, 2.0, 1.9.1, 1.8.5–1.8.1, 1.7.3–1.4.x. Supports C-001, C-004–C-005, C-008, C-010, C-020, C-023–C-024, C-026–C-027, C-030–C-031, C-035, C-039. **Limit:** changelog is not a complete current manual; old fixes are negative/history evidence. **Why retained:** best version-pinned origin for architectural evolution and current release.
- **S-002 — “LUNA System Requirements,” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/360041532932-LUNA-System-Requirements. Updated 2026-07-21. General, storage, instrument and Apollo Mode sections. Supports C-002, C-005–C-006, C-024, C-037. **Limit:** recommendations are not benchmarks. **Why retained:** authoritative current platform/hardware matrix.
- **S-003 — “Where is the LUNA Manual?” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/360041586752-Where-is-the-LUNA-Manual. Manual and separate instrument/UADx documentation pointers. Supports C-037 and source-boundary rationale. **Limit:** navigation page, few behavioral claims. **Why retained:** establishes authoritative documentation boundary.
- **S-004 — “LUNA Application Manual,” Universal Audio.** https://help.uaudio.com/hc/en-us/sections/360008484871-LUNA-Application-Manual. Current manual index. Supports C-003, C-009, C-032–C-033. **Limit:** chapter titles do not prove detailed behavior. **Why retained:** map of current first-party coverage and negative search scope.
- **Unnumbered access-boundary record — “Download LUNA Manual,” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/360041758592-Download-LUNA-Manual. Updated 2026-06-23; points to LUNA 2.0.1 PDF and warns online docs are newer. Supports version-scope methodology. **Limit:** PDF fetch failed because the retrieval tool rejected `application/pdf`; not retried because equivalent online chapters were accessible. **Why retained:** records why the PDF was not used as current 2.0.5 evidence.
- **S-006 — “Using Insert Plug-Ins,” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/34498519722132-Using-Insert-Plug-Ins. Updated 2026-01-13. Overview, manager, bypass, presets/UI, native/DSP conversion. Supports C-006, C-014–C-018, C-027–C-030, C-033–C-035, C-038. **Limit:** no process/ABI internals; generic “AU” only. **Why retained:** densest current primary source for the host contract.
- **S-007 — “Using LUNA in Windows,” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/26793892701460-Using-LUNA-in-Windows. Updated 2026-03-24. Session compatibility, Apollo difference, file/cache paths, known issues. Supports C-005–C-007, C-013, C-015–C-016, C-022, C-027–C-030, C-035. **Limit:** Windows-focused and does not explain implementation. **Why retained:** authoritative cross-OS and failure-boundary evidence.
- **S-008 — “Apple Silicon Compatibility with Universal Audio Products,” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/360057137692-Apple-Silicon-Compatibility-with-Universal-Audio-Products. Updated 2026-07-31. Supports C-007, C-028, C-034. **Limit:** third-party plug-in architectures are outside its scope. **Why retained:** exact current host/driver architecture and security requirements.
- **S-009 — “LUNA Extension System Requirements,” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/45295729420692-LUNA-Extension-System-Requirements. Updated 2026-03-03. Supports C-012–C-013, C-024, C-033, C-036–C-037. **Limit:** requirements and inventory boundary, not extension API internals. **Why retained:** clearest primary statement that Extensions are LUNA-only/native and of OS/license exceptions.
- **S-010 — “Mixing with LUNA Extensions,” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/44791240323860-Mixing-with-LUNA-Extensions. Updated 2025-12-30. Summing, console, multitrack/master tape, defaults. Supports C-012–C-013 and Extension workflow claims. **Limit:** vendor sound-character claims were not treated as measured fidelity. **Why retained:** primary source for first-class mixer placement/state behavior.
- **S-011 — “Using LUNA,” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/360041440592-Using-LUNA. Page showed update 2026-08-27. Mixer/timeline, transport, meters, MIDI/edit/mix workflows. Supports C-006, C-008–C-011, C-023, C-025, C-029, C-031–C-032, C-038. **Limit:** overview rather than exhaustive edge-case contract. **Why retained:** broad current workflow and resource model in one official source.
- **S-012 — “Importing Session Data,” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/13210628963732-Importing-Session-Data. Updated 2026-01-13. Supports C-009–C-010, C-021, C-030, C-032, C-038. **Limit:** only LUNA-to-LUNA import. **Why retained:** strongest project-state/persistence evidence.
- **S-013 — “Mixing in LUNA,” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/360041465732-Mixing-in-LUNA. Updated 2026-01-13. Mixer/routing/export sections. Supports C-011, C-023, C-031–C-032. **Limit:** no general PDC or feedback specification. **Why retained:** authoritative routing and delivery behavior.
- **S-014 — “Sidechaining in LUNA,” Universal Audio.** https://help.uaudio.com/hc/en-us/articles/4838035578516-Sidechaining-in-LUNA. Updated 2026-01-13. Supports C-019, C-029. **Limit:** does not characterize sample alignment or more than one key input. **Why retained:** exact tap point, cardinality, format, and UI contract.

**Negative retrieval results retained:** one official-site web search was rate-limited (HTTP 429) and contributed no evidence; direct PDF retrieval failed on unsupported MIME and was replaced by accessible online manual chapters; no binaries or installers were downloaded or run.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Impact | Available evidence | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- | --- |
| AUv2 versus AUv3 | Current insert and Windows manuals checked; both say only “Audio Units” | Format matrix and macOS architecture planning | Generic AU works on macOS | Ask UA support for versioned matrix; then signed AUv2/AUv3 no-op fixtures on disposable Mac | Unassigned |
| AAX/CLAP/LV2/VST2 and other exclusions | Current affirmative list and release history checked; no formal negative matrix | Scope/licensing estimates | Omitted from supported set; historic accidental VST2 scan is not support | Formal UA response or one signed fixture per format; no proprietary binaries | Unassigned |
| Scan/runtime isolation | Manager/cache/crash docs checked; no process model | Reliability/security architecture | `rejected` status and crash fixes only | Observe process tree/logs with a purpose-built crash/timeout plug-in in disposable VM | Unassigned |
| Intel/ARM bridging | UA host native-Apple-silicon page checked | Migration/platform support | Host is native; guest behavior unstated | Universal, arm64-only and x86_64-only signed AU/VST3 fixtures under documented modes | Unassigned |
| General PDC, latency and tails | Mixing/release pages checked; only manual track delay and hardware round-trip compensation found | Mix correctness | Real-time/offline render exists | Impulse/latency/tail fixtures through serial, parallel, sidechain and multi-out graphs | Unassigned |
| Parameter/event/automation precision | Automation, sidechain and multi-out pages checked | Recall and rendering correctness | Basic automation/import documented | Dense automation/MIDI timestamp fixture; compare real-time, offline, freeze, bounce | Unassigned |
| Dynamic I/O and bus limits | Multi-out release note and sidechain manual checked | Graph mutation/session durability | Multi-output works; one sidechain per track | VST3 fixture that adds/removes buses and changes channel layouts | Unassigned |
| Missing/unlicensed plug-in preservation | Cross-OS AU failure and session-import docs checked; no placeholder semantics | Project durability | AU does not load on Windows | Mac AU state → Windows save → Mac reopen; missing VST3 and expired-license variants | Unassigned |
| Autosave/crash recovery/session schema | Manual index/import/cache checked | Data-loss and migration risk | Session package/folder and versions documented | Exact recovery docs, then kill/reopen tests with checksummed media copies | Unassigned |
| Open interchange/cloud | Import/export pages checked; no affirmative cloud/AAF/etc. evidence retained | Collaboration/vendor lock-in | Audio/MIDI/stems and LUNA import are documented | Targeted current UA import/export/collaboration matrix | Unassigned |
| Extension SDK/versioning | Extension requirements/manual checked | Ecosystem openness | LUNA-only behavior documented | Ask for public developer program/API stability terms | Unassigned |
| Accessibility/privacy/signing | Requirements/UI pages checked; not covered | Compliance/security | Windows GUI limitations and UA dependencies only | Vendor VPAT/accessibility/privacy/security docs plus keyboard/screen-reader fixture | Unassigned |
| LUNA Pro commercial boundary | Release notes checked; sales source not retained within budget | Edition comparison/procurement | Hardware Inserts gated | Current product terms and entitlement behavior, without purchase | Unassigned |

## 24. Curiosity pass and stop decision

Scores are 0–3 for **decision relevance (R)**, **expected evidence value (V)**, **novelty (N)**, and **cost (C)**, where lower cost is better.

| Candidate follow-up | R/V/N/C | Decision | Rationale |
| --- | --- | --- | --- |
| Current host/Extensions/manual chapters | 3/3/3/1 | **PURSUED** | Changed the architecture conclusion from “Apollo DAW” to layered native/Apollo host and established scan/sidechain/Extension contracts |
| AU generation and omitted-format fixture matrix | 3/3/2/3 | `CURIOSITY_NO_GO` for this wave | High value but requires vendor clarification or dynamic qualification outside documentary budget |
| Process isolation/architecture bridging probe | 3/3/3/3 | `CURIOSITY_NO_GO` | Requires signed fixtures/process observation; documentary evidence saturated |
| PDC/tail/sample-accuracy harness | 3/3/3/3 | `CURIOSITY_NO_GO` | High next-phase value, but dynamic test authority/fixtures are absent |
| Exact cloud/open interchange search | 2/2/2/2 | `CURIOSITY_NO_GO` | Lost final-pass priority to routing/sidechain; unknown is visible and does not alter the leading plugin-host conclusion |
| Exhaustive Extension/instrument catalog | 2/1/1/2 | `CURIOSITY_NO_GO` | Rapidly changing inventory, little additional architecture value |
| User forums/reviews | 1/1/1/2 | `CURIOSITY_NO_GO` | Lower authority and unlikely to reveal lawful, verifiable internals |
| Binary/session reverse engineering | 3/2/3/3 | `CURIOSITY_NO_GO` | Prohibited by the research contract and unnecessary for current decision |

**Gaps/contradictions after final synthesis:** no direct contradiction remains among retained current sources. The main tension is not contradiction but scope: “native Apple silicon,” “VST3 support,” “cross-platform session,” and “rejected scan” are narrower than bridging, full conformance, state preservation, and sandboxing. The dossier preserves those as unknown rather than expanding vendor language.

**Coverage check:** every template section and every required format row is present; identity/version/platforms, native/Apollo evolution, Extensions, supported formats, scanning, routing, sidechains, multi-output, state, sessions, licensing, constraints, and negative evidence are covered. **Saturation check:** additional manual pages were increasingly duplicative; the unresolved high-value questions require runtime fixtures or vendor clarification. **Stop decision:** `STOP—DEPTH_BUDGET_EXHAUSTED_AND_DOCUMENTARY_COVERAGE_SUFFICIENT`. Eight evidence passes and fourteen retained official sources were used; one search rate limit and one PDF MIME failure were recorded. No access blocker prevents the dossier, but thirteen consequential unknowns remain for a later qualification phase.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added `research/daw-landscape/dossiers/universal-audio-luna.md`; no sibling research file was changed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0; LUNA Pro packaging uncertainty is explicit.
- [x] **Every required dossier heading exists in order.** Sections 0–25 follow `DOSSIER-TEMPLATE.md`.
- [x] **Every material assertion has a claim ID and classification.** Substantive sections cite C-IDs; claims register classifies each.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Section 21 and Section 23.
- [x] **Every required plugin-format row is present.** Section 11.1 includes all thirteen rows.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover scan, cache, runtime, buses, automation/state, UI and failures.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Claim classifications and bounded wording are used throughout.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16.
- [x] **Bibliography records source rationale and limitations.** Section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary fetches only; no product/installer/plug-in executed.

**Checks performed:** governing-file/template audit; current-version/platform triangulation; required-format row count; claim/source resolution audit; evidence-pass/source-count audit; pre-edit `git status --short` review. **Concise result:** complete with explicit unknowns and 14 retained official sources. **Unresolved blockers:** proprietary host internals, formal negative format matrix, and dynamic conformance questions require vendor clarification or a later disposable fixture lab. **Pre-existing workspace changes:** numerous modified/untracked paths outside this dossier were present before writing and were left untouched; the entire `research/daw-landscape/` tree was already untracked in the observed status.
