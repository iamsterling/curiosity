# Emagic Logic Audio DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** Emagic Logic/Logic Audio, with architecture detail anchored in Logic Audio 2.6/3.0 and Logic 5.0-5.2 documentation. [C-001]
- **Canonical vendor:** Emagic Soft- und Hardware GmbH; Apple announced its acquisition of Emagic on 2002-07-01. [C-001] [C-002]
- **Researcher/session:** `ses_fb271e965ffej34PwZVf5wN9k1` (child research session).
- **Owned path:** `research/daw-landscape/dossiers/emagic-logic-audio.md`.
- **Research date/cutoff:** 2026-08-29 UTC.
- **Version/date boundary:** principal pre-acquisition architecture is Logic 2.6/3.0 (1990s manual corpus) through Logic 5.2 (2002). Emagic-authored, Emagic-branded Logic Platinum X 5.3, Logic Platinum 5.4, and Logic Audio 5.5.0/5.5.1 transition evidence is included only to pin the post-acquisition Mac OS X/Audio Units and Windows-discontinuation boundary. [C-002] [C-025] [C-037]
- **Editions:** Logic Platinum, Gold, Silver, and Logic Audio are named in the retained Logic 5 corpus. Edition-specific claims are made only where the manuals do so: TDM, surround, OMF/OpenTL, and 32 Audio Instruments are scoped to Platinum; 24-bit recording is documented for Gold and Platinum. [C-001] [C-010] [C-012] [C-023]
- **Platforms:** classic Mac OS and Windows are documented for Logic 5; the older manual also documents song transfer among Macintosh, Windows 95, and Atari ST/TT/Falcon. Mac OS X begins at Logic Platinum X 5.3.0; no Linux, mobile, or web edition is evidenced. [C-026] [C-038]
- **Included:** Arrange/track/sequence/folder/alias model; Environment and audio objects; MIDI, audio engine, mixer, automation, project/media formats; Logic-native devices; VST/VST2, DirectShow, Premiere, AudioSuite, DAE/TDM, ESB TDM, ReWire, and early Audio Units; acquisition, discontinuation, XSKey, and format licensing constraints.
- **Excluded:** Logic 6 and every later/current Apple Logic product; binary execution, disassembly, leaked material, source-code claims, and undocumented proprietary internals. Later Apple products may not be used to fill historical gaps.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.

## 1. Executive summary

Emagic Logic's defining documented architecture was an object-mediated sequencer. The linear Arrange window stored sequences/regions and folders on tracks, but a track's destination was an Environment object rather than an intrinsic hardware/channel identity. The Environment exposed virtual MIDI cabling among instruments, ports, processors, faders, physical input, and sequencer input; audio and mixer channels were represented as audio objects. This made track organization, event routing, hardware representation, MIDI processing, and mixer control parts of one persistent user-visible object model. [C-003]–[C-007]

Logic 5 did not erase that model; it joined the audio-instrument path to it. Its “Unified Virtual and Classic MIDI Engine” allowed Environment-processed Audio Instruments to retain documented sample-accurate playback timing. The adaptive Track Mixer reflected objects used in the Arrange window, while its Global view exposed valid audio tracks, instruments, buses, inputs, outputs, masters, and TDM auxiliaries from the Environment. This is strong evidence for a coherent **user model**, but not for proprietary thread, scheduler, or in-memory graph internals. [C-008] [C-009] [C-036]

The plug-in history is format- and platform-specific. Logic 3.0 on Macintosh documented native real-time effects plus destructive Premiere and AudioSuite processing; DAE/TDM was a separate DSP domain. Logic 5.0 on classic Mac OS and Windows documented VST2 effects/instruments, a dedicated `VstPlugins` folder, VST programs/banks, automation, custom windows, and limited plug-in-delay compensation. Logic 5.1.2 documented cached plug-in information and MIDI-capable VST2 effects; Logic 5.2 added multiple outputs and broader sidechains. Windows also hosted DirectShow plug-ins through a Plug-In Enabler, without automation. ESB TDM bridged Logic's native/VST engine output and EXS24 instances into a Mac/TDM mixer. [C-018]–[C-024]

Audio Units arrived only in the post-acquisition transition: Logic Platinum X 5.3.0 initially announced future AU support; Emagic's chronology calls Logic Platinum 5.4 for Mac OS X (2002-10-09) the first AU host; Logic Audio 5.5.0 for Mac OS X 10.2+ explicitly included AU support and required an existing XSKey authorization. Emagic said its OS X host would focus exclusively on AU rather than carbonized VST. These sources call the format “Audio Units,” not AUv2; mapping it to modern AUv2 would be an unsupported anachronism. [C-025] [C-026] [C-033]

Apple announced the acquisition on 2002-07-01 and Windows-product discontinuation for 2002-09-30. The archived update corpus preserves both Mac and Windows 5.5.1-named artifacts, but no readable first-party 5.5.1 changelog was retained; final 5.5.1 behavior therefore remains narrower than filenames imply. [C-002] [C-037]

**Confidence:** high for documented UI/object/routing behavior and versioned format chronology; medium for the completeness of the surviving manual corpus; low/unknown for process isolation, crash containment, exact binary song and plug-in-state schemas, parameter identity, full PDC, and direct architectural influence on later Apple Logic. [C-034]–[C-036] [C-044]

## 2. Product identity, history, and market position

The retained Emagic manuals identify Logic Audio as a combined MIDI/audio production system and distinguish Logic Platinum, Gold, and Silver feature tiers. The Logic 5 addendum addresses both Mac and Windows operation, while Platinum-specific sections cover TDM, surround, OMF/OpenTL, and higher instrument/routing ceilings. The sources support a professional studio/composition position through score editing, SMPTE/MTC/MMC, OMF/OpenTL, TDM, and Logic Control, but do not independently establish market share or product quality. [C-001] [C-012] [C-014] [C-016] [C-023] [C-030]

The Logic 2.6 manual documents cross-platform song exchange among Macintosh, Windows 95, and Atari and imports Notator SL songs into folders and Cubase parts into sequences/aliases. That proves migration continuity and a historically broad platform footprint, not corporate provenance or source-code lineage. The exact Creator/Notator-to-Logic organizational history was not established by a retained primary source and remains **UNKNOWN**. [C-038] [C-040]

Apple's acquisition release states that Emagic became a wholly owned Apple division, that Macintosh products represented over 65% of then-current Emagic revenue, and that Windows offerings would be discontinued on 2002-09-30. The release proves Apple's announcement and stated plan, not the transaction's technical motives. [C-002]

## 3. Workflow and conceptual model

The Arrange window was Logic's linear “home base.” Horizontal tracks contained MIDI sequences or audio regions; a track selected an instrument/destination object, and sequence parameter boxes applied quantize, transposition, velocity, delay, and related playback transformations. A track could target **any** Environment object, including a fader or port, not only an instrument. [C-003]

Folders were nested Arrange objects—described as a “song within a song”—that could contain tracks, sequences, or other folders. Aliases were reference objects with no copied event data; edits to the original affected its aliases. These are composition-level reuse and hierarchy mechanisms, not evidence of copy-on-write storage internals. [C-004]

The Environment represented real MIDI hardware as virtual instruments and ports, Logic components as processor objects, and mixer/control surfaces as faders. Layers were organizational views rather than separate execution domains. Virtual cables established event flow; the selected Arrange track determined the destination for sequencer events. [C-005] [C-006]

Audio used regions/files, audio objects, Audio/Track Mixers, and later Audio Instrument objects. Logic 5's unification made virtual instruments respond to the same sequence playback parameters as external MIDI instruments while remaining in the audio mixer. There is no scene launcher, tracker pattern grid, or browser/mobile model in scope. [C-008]

## 4. Publicly documented architecture

Only the following user-visible architecture is established:

1. **Arrange/persistence layer:** songs contain tracks, sequences/regions, folders, aliases, tempo/signature data, Environment objects, and later track automation. [C-003] [C-004] [C-015] [C-028]
2. **MIDI graph:** physical inputs feed a singleton Sequencer Input, optionally through cableable Environment processors; sequencer playback reaches the Environment object selected for the track and can then route to MIDI output. Multiple cables mix or fan out event signals. [C-005] [C-006]
3. **Audio/mixer objects:** audio track, bus, input, output, master, instrument, and TDM aux roles are represented by Environment audio objects and surfaced in Audio/Track Mixer views. Sends/inserts and channel assignments establish audio signal flow. [C-007] [C-009]
4. **Virtual-instrument bridge:** Logic 5's unified MIDI/audio engine supplies sample-accurate timestamped playback for Audio Instruments even when Environment objects process the event path. [C-008]
5. **External processing domains:** native CPU effects, VST/VST2, DirectShow, DAE/TDM/AudioSuite, ReWire, ESB TDM, and later OS X Audio Units attach at documented boundaries rather than one universal ABI. [C-018]–[C-026] [C-041]

The manuals do **not** disclose process boundaries, thread topology, lock-free structures, disk/audio worker scheduling, memory ownership, DSP graph compilation, plug-in ABI implementation, or binary song schema. Treating the Environment diagram as a literal implementation graph would exceed the evidence. [C-036]

## 5. Audio engine

- Logic 3.0 distinguished CPU/host-based native effects from DSP-based effects on DAE/TDM, Akai DR8/16, and Soundscape systems. CPU effects worked with Emagic-addressable Apple Sound Manager, Audiowerk8, and Korg 1212 I/O paths. [C-007]
- Logic 5.0 documented 32-bit floating-point internal processing. Gold and Platinum supported 24-bit recording; a bounce could reduce to 16-bit with licensed POW-r dithering. [C-010]
- The Logic 5 Windows engine used PC AV/EASI, ASIO, Direct I/O and other hardware-specific drivers. A larger disk buffer traded RAM for track reliability; a larger native process buffer traded response time for mix/effect capacity. Exact callback and scheduler design is **UNKNOWN**. [C-010] [C-039]
- Audio Instrument playback through the unified engine was documented as sample-accurate. This does not establish sample-accurate plug-in parameter automation or MIDI output to external hardware. [C-008] [C-035]
- Plug-in delay compensation in 5.0 required an effect to report its processing delay and applied to effect inserts on Audio Tracks and Audio Instruments; Audio Instrument compensation also required the unified engine. Bus, input, output, master, TDM, sidechain, and dynamic-routing compensation are not established. [C-011]
- Logic Platinum 5 supported up to eight-channel/7.1-style surround routing and surround bounce, but did not itself encode/decode a delivery codec; output-channel EQ/delay remained the user's plug-in/routing responsibility. [C-012]
- ReWire returns appeared as audio objects that could receive inserts and bus sends; Logic was documented as sync/cycle master. [C-041]

Multicore scheduling, denormal handling, oversampling, render determinism, plug-in tails, dropout concealment, graph rebuild strategy, and engine logs remain **UNKNOWN**. [C-035] [C-036]

## 6. Tracks, timeline, clips, and editing

Arrange tracks held sequences or audio regions against a bar ruler/Song Position Line. Playback parameters could transform sequence timing/pitch/velocity without rewriting its events. Audio regions referenced audio files; conversion commands could individualize shared regions or create independent files for destructive Sample Editor work. [C-003] [C-031]

Folders supplied unbounded documented nesting for sections, instrument groups, alternate arrangements, or concert-scale organization. Aliases supplied repeated references to sequence/folder data. Logic 5 added direct drag/drop of audio files into Arrange and track-based HyperDraw/automation overlays. [C-004] [C-015]

Logic 3.0 cycle recording wrote all cycles into one audio file, created a region/track per cycle, and muted the previous pass; Punch on the Fly used continuous background recording and placed the result at the requested punch boundaries. These mechanisms predate a modern take-lane/comp editor; a later comping model is not evidenced here. [C-013]

Tempo/meter editing, markers, matrix/event/hyper/score editors, quantization, destructive Sample Editor processing, and Time Machine/time-stretch functions are documented. Modern elastic-audio algorithm details, clip gain envelopes beyond documented HyperDraw, ripple/edit groups, and concurrent collaborative edits remain **UNKNOWN**. [C-014] [C-036]

## 7. MIDI, sequencing, notation, and expression

Logic documented recorded MIDI note/controller/program/SysEx events, Event List, Matrix, Hyper, Transform, and Score editors; step-time input; quantization; arpeggiator, chord memorizer, delay, transformer, mapped/multi-instrument, touch-track, voice-limiter, and channel-splitter Environment objects. The Score editor supported multi-page notation and polyphonic/instrument-set layouts. [C-005] [C-014]

The physical-input/Sequencer-Input split allowed pre-record transforms: Environment objects could be cabled between interface input and sequencer input so incoming events were altered before recording. On playback, events could be further transformed between a track's destination object and its port. [C-006]

Synchronization covered MIDI Clock, MTC, MMC, SMPTE offsets/frame rates, audio synchronization modes, and QuickTime movie sync. Unitor8/AMT hardware integration provided port and timing options; vendor timing claims are not independent measurements. [C-014]

MPE, per-note expression standards, MIDI 2.0, UMP, and modern note-expression identity are outside the evidenced 2.6-5.x corpus and remain **UNKNOWN/NOT_APPLICABLE to the historical release scope**, not silently inferred unsupported. [C-027]

## 8. Routing, mixer, automation, and control

In Logic 3.0, audio objects could be tracks, inputs, auxiliaries, outputs, or buses; sends fed bus objects and up to eight inserts could change mono-to-stereo channel topology according to plug-in I/O. Environment faders and plug-in parameters were automated as MIDI controller events, with controller allocation varying by insert position and count. [C-007] [C-015]

Logic 5 separated mix automation from musical MIDI. Track Automation was assigned to tracks, stored in a normally invisible Automation folder, independent of sequences/regions, at documented 32-bit resolution. It offered Read, Touch, Latch, Write, and MIDI modes, editable curves, parameter subtracks, move-with-region choices, plain-text/context-sensitive parameter names, and orphan-automation deletion. Older sequence-controller automation remained convertible in either direction. [C-015]

The Track Mixer was adaptive in local view—showing channel strips corresponding to current Arrange tracks/folder—and object-wide in Global view. The Audio Mixer itself was an Environment layer. Global view could surface MIDI instruments and valid audio tracks, Audio Instruments, buses, outputs, masters, inputs, and TDM auxiliaries defined in the Environment. [C-009]

Logic 5.0 sidechain-capable native effects initially selected audio tracks; Logic 5.2 broadened sources to inputs and buses. Surround automation and master fader behavior were documented for Platinum. Audio feedback rules beyond explicit TDM I/O-loop prevention are **UNKNOWN**. [C-012] [C-020]

Logic Control, jointly developed with Mackie, added motorized faders and direct mixer/plug-in control; Logic 5.1 formally documented support, firmware updating, surround X/Y editing, plug-in bypass, and persisted control-view offsets. This is controller integration, not a public general-purpose control-surface SDK. [C-016]

## 9. Recording, comping, and media handling

Logic 3.0 documented per-track record-enable, cycle recording, Punch on the Fly, and Auto Input Monitoring. Record paths could be set per song and per simultaneous hardware system; pre-allocation created the next record file at arm/end-record time. [C-013] [C-031]

Audio files and regions were distinct: Audio Window files could contain regions; shared regions could be individualized, and regions could be rendered to independent files for destructive edits. Logic searched registered volumes for missing audio by name and prompted when multiple matches existed. [C-031]

Logic 5 documented SDII, AIFF, and WAV recording choices on Mac, WAV playback under qualifying DAE versions, REX2 import, and OMF/OpenTL audio exchange. Exact codec/sample-rate matrices vary by driver and version and are not generalized beyond source text. [C-030] [C-031]

Cycle passes were automatically separated/muted but no dedicated visual comp-lane model is evidenced. Metadata schemas, proxy/conform pipelines, cloud asset management, and content-addressed relinking are **UNKNOWN**. [C-013] [C-035]

## 10. Instruments, effects, content, and native devices

Logic's native plug-in family included host effects plus Audio Instruments. Logic 5 bundled ES M, ES E, and ES P; optional/integrated product families named in the manual included ES1, ES2, EVP88, EXS24, and EVP88/EP instrument variants. Audio Instruments were audio objects whose channel role was set to an Instrument channel; the instrument occupied the top insert and subsequent effects could process it in Logic's mixer. Platinum documented up to 32 Audio Instruments. [C-017]

The native device contract was tightly integrated with the sequencer: the same MIDI sequences and playback parameters could address external MIDI or Audio Instrument destinations, while the latter avoided an external MIDI conversion and used the unified engine's sample-accurate timestamp path. [C-008] [C-017]

TDM-native versions existed for selected Emagic effects/instruments, but availability differed by version; Logic 5 release notes warned that some earlier TDM ES1/Tape Delay/AutoFilter versions could not be used. Native, VST, TDM, and AU branding must therefore not be collapsed into one interchangeable binary format. [C-023]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

The matrix is historical and splits classic Mac OS from Mac OS X inside the macOS column. `UNKNOWN` means the retained evidence does not prove support; it is not a claim of non-support. The early 2002 “Audio Units” generation is not relabeled AUv2. [C-025]–[C-027]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `DOCUMENTED`: classic Mac OS Logic 5.0 effects/instruments; OS X 5.3-5.5 policy was AU-only | `DOCUMENTED`: Logic 5.0 effects/instruments | `NOT_APPLICABLE:no evidenced Linux edition` | `NOT_APPLICABLE:historical desktop scope` | Logic 5.0; 5.1.2 cache/MIDI; 5.2 multi-output/sidechain | Dedicated `VstPlugins` folder; programs/banks, UI, automation and limited PDC documented; validation/isolation/full recall unknown | [C-018]–[C-021] [C-026]; S-002, S-005, S-009, S-011 |
| VST3 | `UNKNOWN`: not named in retained 2.6-5.5 evidence | `UNKNOWN`: not named | `NOT_APPLICABLE:no evidenced Linux edition` | `NOT_APPLICABLE:historical desktop scope` | Scope ends at Emagic-branded 5.5.1 artifact | No support claim; VST2 documentation does not imply VST3 | [C-027] [C-037]; S-001–S-013 |
| AUv2 | `UNKNOWN`: Logic 5.4/5.5 hosted early Audio Units, but generation is not identified as AUv2 | `NOT_APPLICABLE:Apple OS format and no Windows evidence` | `NOT_APPLICABLE:no evidenced Linux edition` | `NOT_APPLICABLE:historical desktop scope` | Logic Platinum 5.4 and Logic Audio 5.5.0, Mac OS X | Preserve historically exact “Audio Units” label | [C-025] [C-026]; S-009, S-010, S-013 |
| AUv3 | `UNKNOWN`: not named in retained historical evidence | `NOT_APPLICABLE:no Windows evidence` | `NOT_APPLICABLE:no evidenced Linux edition` | `UNKNOWN`: no product edition in scope | Emagic-branded scope through 5.5.1 artifact | Do not back-project later AU app-extension generations | [C-027] [C-037]; S-001–S-013 |
| AAX | `UNKNOWN`: not named | `UNKNOWN`: not named | `NOT_APPLICABLE:no evidenced Linux edition` | `NOT_APPLICABLE:historical desktop scope` | Historical scope | DAE/TDM/AudioSuite evidence does not imply AAX | [C-023] [C-027]; S-001, S-002, S-008 |
| CLAP | `UNKNOWN`: not named | `UNKNOWN`: not named | `NOT_APPLICABLE:no evidenced Linux edition` | `NOT_APPLICABLE:historical desktop scope` | Historical scope | No host-contract evidence | [C-027]; S-001–S-013 |
| LV2 | `UNKNOWN`: not named | `UNKNOWN`: not named | `NOT_APPLICABLE:no evidenced Linux edition` | `NOT_APPLICABLE:historical desktop scope` | Historical scope | No host-contract evidence | [C-027]; S-001–S-013 |
| LADSPA | `UNKNOWN`: not named | `UNKNOWN`: not named | `NOT_APPLICABLE:no evidenced Linux edition` | `NOT_APPLICABLE:historical desktop scope` | Historical scope | No host-contract evidence | [C-027]; S-001–S-013 |
| DSSI | `UNKNOWN`: not named | `UNKNOWN`: not named | `NOT_APPLICABLE:no evidenced Linux edition` | `NOT_APPLICABLE:historical desktop scope` | Historical scope | No host-contract evidence | [C-027]; S-001–S-013 |
| JSFX | `UNKNOWN`: not named | `UNKNOWN`: not named | `NOT_APPLICABLE:no evidenced Linux edition` | `NOT_APPLICABLE:historical desktop scope` | Historical scope | No host-contract evidence | [C-027]; S-001–S-013 |
| DirectX/DXi | `NOT_APPLICABLE:no classic-Mac/OS-X DirectShow host documented` | `DOCUMENTED`: DirectShow plug-ins; exact DXi-instrument contract `UNKNOWN` | `NOT_APPLICABLE:no evidenced Linux edition` | `NOT_APPLICABLE:historical desktop scope` | Logic 5.0 Windows | Managed by PIE; automation explicitly unavailable; “DirectX” menu label also appears, but DXi generation/semantics are not established | [C-022]; S-002 |
| Rack Extension | `UNKNOWN`: not named | `UNKNOWN`: not named | `NOT_APPLICABLE:no evidenced Linux edition` | `NOT_APPLICABLE:historical desktop scope` | Historical scope | ReWire support does not imply Rack Extension hosting | [C-027] [C-041]; S-002 |
| Product-native/other | `DOCUMENTED`: Logic native; Premiere/AudioSuite; DAE/TDM; ESB TDM; ReWire; early Audio Units on OS X | `DOCUMENTED`: Logic native, DirectShow, ReWire | `NOT_APPLICABLE:no evidenced Linux edition` | `NOT_APPLICABLE:historical desktop scope` | Logic 3.0 and Logic 5.0-5.5 transition, edition-limited where stated | TDM/ESB/AudioSuite are Platinum/Mac/DAE specific; Premiere is destructive Sample Editor processing; AU generation unspecified | [C-017] [C-022]–[C-026] [C-041]; S-001, S-002, S-006–S-010 |

### 11.2 Discovery, scanning, validation, and recovery

Logic 5 required VST files in a `VstPlugins` folder under the Logic program folder; users could organize menu hierarchy with subfolders and suppress a plug-in by moving its file elsewhere. Logic cached “vital information” about VST plug-ins. In 5.1.2, a MIDI-capable VST2 effect that failed to appear as an Audio Instrument could be inserted on an audio track and the audio engine relaunched/Logic restarted to refresh its classification. [C-018] [C-019]

The Macintosh Logic 3 Sample Editor searched for valid Premiere plug-ins in three named folder locations at startup; a runtime file chooser could establish an alias for future launches. DAE itself searched its System-folder DAE directory for AudioSuite plug-ins. [C-023]

Windows DirectShow discovery used the Plug-In Enabler (PIE); release documentation says some plug-ins could be deactivated after engine changes and PIE could reactivate them if they had worked previously. VST was explicitly outside PIE. [C-022]

No retained source documents binary validation, duplicate IDs, cache schema/path, blacklist versus quarantine semantics, scan timeouts, scan-crash recovery, safe mode for individual plug-ins, or cryptographic trust checks. [C-034] [C-035]

### 11.3 Runtime isolation and compatibility

The manuals describe insert windows and engine relaunches but do not state whether native, VST, DirectShow, AU, TDM-control, or ReWire components execute in the host process or helpers. Separate windows and separate DSP hardware are not evidence of process sandboxing. Architecture bridging, watchdogs, crash containment, code-signing enforcement, and per-plug-in resource limits remain **UNKNOWN**. [C-034]

Compatibility was explicitly domain-specific: DAE/TDM used Digidesign versions/hardware; AudioSuite required DAE; ESB TDM combined native/VST output with TDM; classic Mac/Windows VST did not carry into Logic's AU-only OS X policy; and DirectShow automation was unavailable. [C-022]–[C-026]

### 11.4 Host/plugin processing contract

The documented VST2 contract progressed as follows:

- **5.0:** effects and software instruments; VST clock/tempo information when requested by the plug-in; program-change handling; host programs/banks; effect delay reporting/compensation on Audio Track and Audio Instrument inserts. [C-018] [C-021]
- **5.1.2:** MIDI-capable VST2 effects could receive MIDI when loaded in an Audio Instrument slot, with audio routed via sidechain. [C-019]
- **5.2:** VST2 and Emagic instruments gained multiple outputs; audio tracks, inputs, and buses could serve as sidechain sources. [C-020]

Logic 3 audio objects accepted up to eight inserts and distinguished mono-in/mono-out, mono-in/stereo-out, and stereo-in/stereo-out chains. Logic 5 menus grouped mono/stereo plug-ins by Logic, VST, or DirectX API. This proves channel-layout selection, not dynamic I/O negotiation in the modern sense. [C-007] [C-018] [C-022]

Sample-accurate **Audio Instrument event playback** is documented; sample-accurate parameter automation, MIDI output from plug-ins, note-expression buses, tail reporting, suspend semantics, dynamic bus changes, and deterministic offline/headless contracts are not. [C-008] [C-035]

### 11.5 Parameters, automation, state, presets, and project recall

Logic 5 said Logic and VST plug-ins could be automated, while DirectShow could not. Track Automation exposed only parameters present in the channel strip/plug-ins and displayed names in context. It stored 32-bit automation separately from MIDI and could identify/delete automation whose destination parameter was lost. The documentation does not disclose stable parameter IDs, range normalization, gesture semantics, or sample-accurate delivery. [C-015] [C-021] [C-022] [C-035]

Plug-in windows supported programs and `Effect`/`Bank` settings; Logic-native/TDM-era documentation supported copy/paste/load/save setups, and said plug-in settings were stored in the song. Because that statement predates the Logic 5 VST2 section and no VST-specific song-state schema was found, complete third-party VST/AU state-chunk recall, external asset references, and migration are **UNKNOWN**. [C-021] [C-029] [C-035]

Logic 5.1 release notes required existing settings to be copied into Logic 5's `Plug-In Settings` subfolders. Missing-plug-in placeholders, unresolved state retention, substitute selection, and later recovery are not documented. [C-029] [C-035]

### 11.6 UI, diagnostics, and failure modes

Inserting a Logic/VST plug-in could automatically open its window; the preference could disable that behavior. Earlier native windows supported multiple simultaneous windows or a linked reusable window. VST programs were exposed in the window header. AU-era Emagic text advertised scalable/richer UI capability of the format, but does not prove every Logic 5 host/editor behavior. [C-021] [C-025]

Diagnostics were limited: TDM startup could show which plug-in caused a setup problem; DirectShow had PIE reactivation; VST cache refresh had a relaunch workaround; and Logic 5.1.3 addressed possible song audio-configuration damage from inserting a plug-in during playback under heavy automation. No per-plug-in CPU meter, scan log, crash report, sandbox restart, or recovery transaction is established. [C-019] [C-022] [C-023] [C-032]

## 12. Extensibility and integration

The Environment was the principal product-native extension surface: users could compose reusable MIDI-processing/control graphs from instruments, faders, transformers, arpeggiators, delays, splitters, chord memorizers, ports, and input objects. Environment exchange between songs was documented, but no source-level scripting language or third-party object SDK is established. [C-005] [C-006]

External integration included OMS alongside Emagic's MIDI driver on Mac/TDM systems; AMT8/Unitor8/MT4; Logic Control; DAE/TDM/AudioSuite; ReWire; OMF/OpenTL; QuickTime; and later Core MIDI/Core Audio/AU. Logic 5's hierarchical menus were presentation/organization for Environment and plug-in objects, not an extension ABI. [C-014] [C-016] [C-023]–[C-026] [C-030] [C-041]

Emagic said it offered developers a VST-to-AU porting library and an AU developer mailing list in 2002. That is ecosystem history, not permission to use or redistribute either historical SDK today. [C-025] [C-043]

No public Logic object-authoring SDK, automation protocol, general controller SDK, OSC API, remote app, or stable command scripting interface was retained. [C-027]

## 13. Project format, persistence, interoperability, and collaboration

Logic 2.6 songs used `.LSO` for PC exchange and were documented as cross-platform among current Macintosh/Windows/Atari versions, subject to version compatibility and DOS media/name constraints. Newer versions read older songs; older versions read newer songs only if the data format had not changed. [C-038]

Logic 5 introduced a new song format. Opening an older song converted it; users could export a 4.8-format song, but Logic 5 data such as Track Automation could not be preserved. A known Logic 5 limitation could fail to fully convert large Logic 4.x Environment macros. Logic Platinum X 5.3 documented an identical song format between OS 9 and OS X and converted an audio object's ASIO/EASI device parameter to Core Audio on first open/save. [C-028]

Logic 5.1 stored its multiple undo/redo history in the song; destructive audio edits remained single-undo. The manuals say plug-in settings could be stored with songs in the earlier native/TDM context, but the exact binary schema, transactional save/backup, VST/AU state chunks, missing dependencies, and crash recovery remain **UNKNOWN**. [C-029] [C-035]

Logic Platinum 5 imported/exported OMF 1/2 and OpenTL for audio media and placement only; MIDI and automation were explicitly ignored. OMF could embed media or write references and convert interleaved to split stereo. Standard MIDI files, Cubase, Notator SL, and REX2 paths were also documented. [C-030] [C-040]

No cloud collaboration, version-control semantics, conflict model, AAF, ADM, MusicXML project exchange, DAWproject, or modern archive manifest is established in this historical scope. [C-027]

## 14. Delivery, live, post-production, and specialized workflows

Logic 5 offered real-time mix automation, output-object bounce, 32-bit internal processing, optional 16-bit POW-r dither, and surround bounce in Platinum. The documented surround mixer routed up to eight output channels but did not encode/decode consumer surround formats. [C-010] [C-012]

Post workflows included SMPTE/MTC/MMC, QuickTime movie playback, OMF/OpenTL audio exchange, and score printing. OMF/OpenTL's omission of MIDI and automation is a material interchange loss boundary. [C-014] [C-030]

ReWire exposed synchronized returns as audio objects. Audio Input objects could monitor/process external inputs and Logic 5.2 allowed plug-ins to be printed destructively while recording; Logic 5.0 warned that input-object effects were not active/included while bouncing. [C-020] [C-041]

No modern loudness standards, DDP, ADM/immersive metadata, batch stem manifest, ADR database, cloud review, or live-show setlist architecture is evidenced. [C-027]

## 15. Performance, reliability, security, and accessibility

Documented performance controls included driver selection, hardware/driver buffers, larger disk/process buffers, maximum audio-track allocation, and Logic 5.0.1 DOT processor optimization with a “generic” compatibility mode. Vendor claims of performance multiplication were not independently measured and are not adopted as facts. [C-039]

Documented ceilings included up to 32 Audio Instruments in Platinum, up to 64 TDM buses and 64 TDM aux objects in Logic 5's TDM section, eight sends per TDM channel, and surround up to eight outputs. They are edition/hardware/version ceilings, not universal engine limits. [C-012] [C-017] [C-023]

Reliability features/workarounds included driver-disable startup, VST engine relaunch for cache refresh, PIE for DirectShow reactivation, a TDM plug-in setup indicator, undo history, and the 5.1.3 audio-configuration fix. There is no documented plug-in sandbox or crash containment. [C-019] [C-022] [C-023] [C-032] [C-034]

XSKey was a licensing/authorization dependency. Code signing, notarization, secure update transport, plug-in trust prompts, telemetry/privacy, malware resistance, rollback, screen-reader support, keyboard-only completeness, UI scaling, and formal accessibility claims remain **UNKNOWN**. [C-033] [C-042]

## 16. Licensing, ecosystem, and implementation constraints

Logic and Emagic plug-ins were proprietary products. Logic Audio 5.5.0 for OS X required an existing Logic Audio 5 Mac XSKey authorization; the retained evidence grants no redistribution, source, SDK, or derivative rights. [C-033]

VST/VST2 was a Steinberg-owned format. Steinberg now labels VST2 discontinued and directs migration toward VST3. Historical Logic hosting does not grant a current VST2 SDK license, trademark permission, compatibility certification, or redistribution right. [C-043]

Audio Units, DAE/TDM, AudioSuite, DirectConnect, ReWire, OMF, OpenTL, and hardware/control names each carried platform-owner/vendor dependencies. Emagic's historical VST-to-AU porting library is not a present license. A new host must obtain and review current owner terms rather than reuse historical binaries, headers, names, or assumptions. [C-023]–[C-026] [C-043]

The clean-room boundary permits studying public behavior and abstract patterns. It does not permit copying proprietary source, binary schemas, UI assets, manuals, plug-in code, or bypassing XSKey/other protection. This is descriptive research, not legal advice. [C-033] [C-036] [C-043]

## 17. Strengths, liabilities, and architecture lessons

**Evidence-backed strengths**

- A track destination is an object, allowing sequencing, transformation, hardware addressing, and control to compose without hard-wiring every track to one device/channel type. [C-003] [C-005] [C-006]
- Folders and aliases provide hierarchical arrangement and reusable references without requiring a separate clip-launching model. [C-004]
- Logic 5 preserved Environment routing while integrating virtual instruments with sample-accurate event timing and adaptive mixers. [C-008] [C-009]
- Track Automation deliberately separated high-resolution mix data from musical MIDI while retaining conversion paths. [C-015]
- Plug-in hosting evolved in explicit increments—cache/classification, MIDI, multi-output, sidechain, limited PDC—rather than a mere format-logo claim. [C-018]–[C-021]
- ESB TDM is a clear heterogeneous-engine bridge: native/VST and sampler output crosses into a DSP mixer without pretending both domains are one runtime. [C-024]

**Liabilities/historical constraints**

- The same Environment flexibility that enabled deep routing also exposed configuration complexity and migration risk; Logic 5 release notes acknowledged failed conversion of some large 4.x macros. [C-005] [C-028]
- PDC was scoped to Audio Track/Audio Instrument effect inserts, leaving wider compensation behavior unknown. [C-011]
- Host-format fragmentation produced platform divergence: classic Mac/Windows VST and Windows DirectShow versus OS X AU-only; Windows was then discontinued. [C-002] [C-022] [C-026]
- Plug-in cache recovery, DirectShow reactivation, TDM startup diagnosis, and a song-configuration corruption fix show meaningful failure modes without modern isolation. [C-019] [C-022] [C-023] [C-032] [C-034]
- Binary project/plugin-state internals and missing-dependency behavior remain undocumented, limiting durability lessons. [C-035] [C-036]

These are architecture-reference findings, not a ranking of product quality.

## 18. Transferable patterns

### TP-1 — Object destinations behind tracks

- **Problem:** avoid coupling timeline tracks directly to hardware, MIDI channels, or one engine node class.
- **Minimal mechanism:** a track stores events/regions and points to a typed destination object; graph/routing objects mediate hardware and processing. [C-003] [C-005] [C-006]
- **Prerequisites:** typed ports, cycle checks, deterministic ordering, graph validation, versioned persistence, and a simpler default path.
- **Tradeoffs:** routing power and reuse versus discoverability/configuration complexity.
- **Adaptation risk:** medium; copy only the abstract indirection, not Logic's protected expression or object schema.
- **Disposition:** `CANDIDATE`.

### TP-2 — User-programmable event graph with safe defaults

- **Problem:** transform, split, monitor, map, and route performance events without special-case track code.
- **Minimal mechanism:** cableable event processors between physical input, sequencer input, destinations, and output ports. [C-005] [C-006]
- **Prerequisites:** bounded execution, cycle/feedback policy, diagnostics, schemas, preset exchange, and an automatically generated default graph.
- **Tradeoffs:** expressive routing versus user error and migration burden.
- **Adaptation risk:** high unless modern validation and observability are added.
- **Disposition:** `CONDITIONAL`.

### TP-3 — Separate musical events from mix automation

- **Problem:** MIDI-resolution/controller semantics are a poor persistence model for dense mixer and plug-in automation.
- **Minimal mechanism:** track-bound high-resolution automation lanes with parameter references, independent of clips, plus explicit move/convert behavior. [C-015]
- **Prerequisites:** stable parameter IDs, orphan repair, clip/track ownership rules, precision/timebase specification, and missing-device recovery.
- **Tradeoffs:** cleaner mixing and editing versus dual-domain complexity.
- **Adaptation risk:** low for the abstraction; high if parameter identity is not designed first.
- **Disposition:** `CANDIDATE`.

### TP-4 — Adaptive/local mixer plus object-wide global view

- **Problem:** a large object graph needs both task-focused and complete routing views.
- **Minimal mechanism:** local mixer follows current Arrange context; global mixer enumerates all valid mixer objects. [C-009]
- **Prerequisites:** canonical channel identity, visibility filters, navigation, and synchronization between graph/timeline/mixer selections.
- **Tradeoffs:** reduced clutter versus mode/view confusion.
- **Adaptation risk:** low at the interaction-pattern level.
- **Disposition:** `CANDIDATE`.

### TP-5 — Explicit bridge between processing domains

- **Problem:** integrate native CPU and hardware-DSP engines without conflating scheduling/resource semantics.
- **Minimal mechanism:** named bridge endpoints carrying native-engine/sampler outputs into hardware-DSP mixer auxiliaries. [C-024]
- **Prerequisites:** clock/latency model, channel negotiation, failure reporting, resource ownership, and render parity tests.
- **Tradeoffs:** resource flexibility versus topology, latency, and recovery complexity.
- **Adaptation risk:** high; prototype before adoption.
- **Disposition:** `CONDITIONAL`.

### TP-6 — Versioned host-capability ladder

- **Problem:** “supports format X” hides incompatible levels of functionality.
- **Minimal mechanism:** qualify discovery, instantiation, MIDI/event input, multi-output, sidechain, automation, delay reporting, UI, state, and failure behavior separately. [C-018]–[C-021]
- **Prerequisites:** conformance fixtures and version/platform matrix.
- **Tradeoffs:** truthful interoperability versus testing cost.
- **Adaptation risk:** low; this is a research/qualification pattern, not copied implementation.
- **Disposition:** `CANDIDATE`.

## 19. Rejected patterns and CURIOSITY_NO_GO

| Pattern/thread | Evidence/gap | Decision rationale | Reopen condition |
| --- | --- | --- | --- |
| Treat Environment as proof of internal audio-engine graph | Manuals document a MIDI/event object graph and audio/mixer objects, not scheduler internals. [C-005]–[C-009] [C-036] | `CURIOSITY_NO_GO`: would turn UI semantics into invented implementation. | Public Emagic engineering source or authorized clean-room probe. |
| Put all plug-ins in the DAW application folder | VST discovery depended on a local `VstPlugins` folder. [C-018] | `REJECT`: poor modern separation, update safety, and multi-host sharing. | Only for an isolated appliance with managed packaging. |
| Rely on restart/reinsert for plug-in reclassification | Logic 5.1.2 cache workaround required insertion plus engine/app relaunch. [C-019] | `REJECT`: opaque diagnostics and stateful discovery. | A transparent, transactional rescan design with user-visible cache records. |
| Infer global PDC from a PDC checkbox | Documentation limits compensation to effect inserts on Audio Tracks/Instruments. [C-011] | `CURIOSITY_NO_GO`: would overstate bus/output/sidechain behavior. | Version-pinned tests across every graph position. |
| Infer AUv2 from “Audio Units” | 2002 sources never use the AUv2 generation label. [C-025] | `CURIOSITY_NO_GO`: anachronistic format mapping. | Versioned Apple legacy specification proving equivalence. |
| Treat TDM/ESB as sandboxing | Hardware DSP domain is documented; process/crash containment is not. [C-024] [C-034] | `CURIOSITY_NO_GO`: separate processor is not a general fault boundary. | Engineering/process documentation plus failure probes. |
| Infer current Apple Logic architecture/influence | Current Apple Logic is excluded; code lineage is unpublished. [C-044] | `CURIOSITY_NO_GO`: scope and evidence violation. | Separate dossier and primary engineering history. |
| Execute historical installers/XSKey workarounds | Documentary sources resolve the decision without execution. [C-033] | `CURIOSITY_NO_GO`: unnecessary security/licensing risk. | Separately authorized, lawful disposable qualification plan. |
| Expand to every native plug-in preset/model | Inventory does not alter host architecture. [C-017] | `CURIOSITY_NO_GO`: low decision relevance and high duplication. | A specific device-contract contradiction. |
| Research acquisition valuation or corporate motives | Apple release proves ownership/discontinuation, not motives. [C-002] | `CURIOSITY_NO_GO`: outside architecture decision. | Separate business-history decision. |

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test/counterevidence search | Outcome |
| --- | --- | --- |
| H-1: an Arrange track is intrinsically a MIDI/audio channel. | Checked 2.6 Arrange and Environment chapters. | **Falsified:** a track routes to any Environment destination object. [C-003] |
| H-2: Environment layers are execution partitions. | Compared layer and cabling descriptions. | **Falsified:** layers are display organization; cross-layer cabling is allowed. [C-005] |
| H-3: Environment proves Logic's internal audio scheduler graph. | Compared MIDI signal-path text, audio-object chapters, and Logic 5 mixers. | **Not supported:** user-visible object/routing architecture is documented; proprietary engine graph is unknown. [C-036] |
| H-4: all Logic automation is MIDI controller data. | Compared 3.0 automation with 5.0 addendum. | **Falsified for Logic 5:** Track Automation is 32-bit, track-bound, and independent of MIDI. [C-015] |
| H-5: “VST2 support” proves the complete host contract. | Separated folder/cache, effects/instruments, MIDI, multi-output, sidechain, UI, automation, PDC, state, isolation, and recovery evidence. | **Falsified as an evidence claim:** several capabilities are documented incrementally; isolation/state/failure semantics remain unknown. [C-018]–[C-021] [C-034] [C-035] |
| H-6: Logic 5.0's PDC is global. | Read exact PDC scope. | **Falsified:** only effect inserts on Audio Tracks and Audio Instruments are documented. [C-011] |
| H-7: first OS X Logic already hosted AU. | Compared 5.3 readme, AU history, and 5.5 download. | **Falsified:** 5.3 announced future support; 5.4 is called first AU host; 5.5.0 Logic Audio included it. [C-025] |
| H-8: AU support was a pre-acquisition Emagic feature. | Compared Apple 2002-07-01 acquisition date with Emagic's 2002-10-09 AU-host chronology. | **Falsified:** shipping AU host evidence is post-acquisition, though Emagic-authored/branded. [C-002] [C-025] |
| H-9: ESB runs VST code on TDM DSP. | Read official ESB boundary. | **Falsified:** native/VST engine output is fed into the TDM mixer; the source does not say VST executes on TDM DSP. [C-024] |
| H-10: Logic 5 songs round-trip losslessly to 4.8. | Read new-format/export warning. | **Falsified:** version-5 data such as Track Automation is not preserved. [C-028] |
| H-11: format acceptance equals safe scanning. | Searched versioned manuals/release notes for validation/quarantine/isolation. | **Not supported:** cache and reactivation workarounds exist, but validation/crash containment are unknown. [C-019] [C-022] [C-034] |

**Later safe probes (not performed):** in a separately authorized offline VM with lawfully sourced, hash-pinned Logic 5 builds and purpose-built benign VST2 fixtures, distinguish file discovery, cache identity, list classification, effect/instrument instantiation, MIDI/event delivery, sidechains, multi-output, parameter automation, declared latency, project save/reload, missing plug-in, malformed binary, and crash behavior. OS 9, Windows, and OS X/AU fixtures must be separate; no XSKey bypass is authorized.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Emagic's retained manuals identify Logic Audio/Logic Platinum, the 2.6/3.0 and 5.0 documentation boundaries, and edition/platform distinctions. | Logic Audio 2.6/3.0; Logic 5.0 | S-001, S-002 | Manual titles, contents, edition callouts, and platform sections. | Surviving corpus may not contain every edition-specific supplement. |
| C-002 | DOCUMENTED | High | Apple announced its acquisition of Emagic on 2002-07-01, said Emagic would be wholly owned, and set Windows-product discontinuation for 2002-09-30. | Corporate boundary, 2002 | S-003 | Contemporaneous Apple press release. | Proves Apple's announcement and stated plan, not transaction motives or technical lineage. |
| C-003 | DOCUMENTED | High | Arrange tracks hold sequences/regions and target Environment destination objects; sequence parameters transform playback. | Logic 2.6/3.0 | S-001 | Arrange-window and track-parameter sections. | User-visible model only; not an internal scheduler representation. |
| C-004 | DOCUMENTED | High | Folders provide nested arrangement hierarchy and aliases reference originals rather than duplicating event data. | Logic 2.6/3.0 | S-001 | Arrange-folder and alias sections. | No claim about copy-on-write or binary storage internals. |
| C-005 | DOCUMENTED | High | The Environment exposes instruments, ports, processors, faders, layers, and virtual cables as a user-programmable MIDI/control graph. | Logic 2.6/3.0 | S-001 | “The Environment” concept/object/cabling sections. | Layers organize views; they are not evidenced execution partitions. |
| C-006 | DOCUMENTED | High | Physical Input, Sequencer Input, track destinations, and cableable processors define documented record/playback MIDI paths. | Logic 2.6/3.0 | S-001 | Environment “Signal Path” and Physical/Sequencer Input sections. | Does not expose queue, thread, or timestamp implementation. |
| C-007 | DOCUMENTED | High | Logic 3.0 represents mixer roles as audio objects and distinguishes host-native effects from DAE/TDM and destructive processing domains. | Logic Audio 3.0, Macintosh | S-001 | Audio Functions, real-time effects, audio-object, Premiere, AudioSuite, and DAE/TDM sections. | Exact runtime/process isolation is not stated. |
| C-008 | DOCUMENTED | High | Logic 5's unified virtual/classic MIDI engine gives Audio Instruments documented sample-accurate playback through Environment processing. | Logic 5.0 | S-002 | Main-features and Audio Instruments chapters. | Does not prove sample-accurate parameter automation or external MIDI timing. |
| C-009 | DOCUMENTED | High | The adaptive Track Mixer follows Arrange context, while Global view exposes valid MIDI/audio mixer objects from the Environment. | Logic 5.0 | S-002 | Track Mixer and Global view sections. | View behavior does not prove one canonical internal graph structure. |
| C-010 | DOCUMENTED | High | Logic 5 documents 32-bit floating-point processing, edition-scoped 24-bit recording, dithering, drivers, and buffer controls. | Logic 5.0, Mac/Windows; Gold/Platinum where stated | S-002 | Audio-hardware, recording, bounce, and preference sections. | Exact callback/scheduler implementation and universal hardware ceilings are not stated. |
| C-011 | DOCUMENTED | High | Logic 5.0 delay compensation applies when an effect reports delay and is scoped to effect inserts on Audio Tracks and Audio Instruments. | Logic 5.0 | S-002 | Plug-in delay-compensation section. | No evidence of global bus/output/sidechain compensation. |
| C-012 | DOCUMENTED | High | Platinum supports up to eight-channel surround routing/bounce and documents surround/master behavior without delivery-codec encoding. | Logic Platinum 5.0 | S-002 | Surround chapter. | Edition-specific; not a modern immersive/metadata workflow. |
| C-013 | DOCUMENTED | High | Logic 3.0 documents cycle recording, Punch on the Fly, Auto Input Monitoring, and record-file allocation/path behavior. | Logic Audio 3.0 | S-001 | Recording and Audio Functions sections. | No dedicated later comp-lane model is established. |
| C-014 | DOCUMENTED | High | The corpus documents MIDI editors/processors, notation, tempo, SMPTE/MTC/MMC, QuickTime, and related synchronization. | Logic 2.6/3.0 and 5.0 | S-001, S-002 | MIDI, Score, Synchronization, and movie sections. | Vendor timing descriptions are not independent measurements. |
| C-015 | DOCUMENTED | High | Logic 5 Track Automation is track-bound, 32-bit, independent of musical MIDI, stored in an Automation folder, and convertible to/from older controller automation. | Logic 3.0 comparison; Logic 5.0 | S-001, S-002 | Logic 3 mixer automation and Logic 5 Automation chapter. | Stable parameter IDs and sample-accurate delivery are not disclosed. |
| C-016 | DOCUMENTED | High | Logic Control integration includes mixer/plug-in control, firmware/update behavior, surround editing, bypass, and persisted view offsets. | Logic 5.1/5.1.2 | S-002, S-011 | Logic Control sections and versioned update notes. | Not evidence of a public general controller SDK. |
| C-017 | DOCUMENTED | High | Logic 5 Audio Instruments occupy instrument audio objects, share sequencer playback semantics, accept following effects, and reach 32 instances in Platinum. | Logic Platinum 5.0 | S-002 | Audio Instruments chapter. | Device inventory and availability vary by edition/version. |
| C-018 | DOCUMENTED | High | Logic 5.0 hosts VST2 effects/instruments from a local `VstPlugins` hierarchy and exposes programs, banks, UI, automation, tempo, and delay-reporting behavior. | Logic 5.0, classic Mac OS/Windows | S-002 | Plug-ins chapter and VST sections. | Validation, isolation, complete state recall, and modern dynamic I/O are not established. |
| C-019 | DOCUMENTED | High | Logic 5.1.2 caches plug-in information and may require insertion plus engine/app relaunch to classify a MIDI-capable VST2 effect as an Audio Instrument. | Logic 5.1.2 | S-011 | Exact versioned update note. | Cache schema, duplicate identity, quarantine, and crash recovery are not documented. |
| C-020 | DOCUMENTED | High | Logic 5.2 adds multiple outputs for VST2/Emagic instruments, expands sidechains to tracks/inputs/buses, and supports monitored/destructive input processing. | Logic 5.2 | S-005 | Contemporaneous Emagic feature page. | No claim of arbitrary dynamic bus negotiation. |
| C-021 | DOCUMENTED | High | Logic 5 documents VST/Logic plug-in automation, windows, program/bank handling, clock/tempo supply, and limited declared-delay compensation. | Logic 5.0 | S-002 | Plug-ins and Automation chapters. | Full state chunks, tails, suspend, and headless/offline contracts remain unknown. |
| C-022 | DOCUMENTED | High | Windows Logic 5 hosts DirectShow plug-ins through PIE; VST is outside PIE and DirectShow automation is unavailable. | Logic 5.0/5.x, Windows | S-002, S-011 | DirectShow/DirectX and Plug-In Enabler sections. | Exact DXi instrument-generation semantics are not established. |
| C-023 | DOCUMENTED | High | Premiere, AudioSuite, DAE/TDM, and TDM plug-in behavior is a Mac/DAE/Platinum-specific processing domain with version-dependent availability. | Logic 3.0 and Logic Platinum 5.x | S-001, S-002, S-011 | AudioSuite/DAE/TDM chapters and 5.0.1 notes. | DAE/TDM/AudioSuite does not imply AAX or sandboxing. |
| C-024 | DOCUMENTED | High | ESB TDM bridges EXS24 and Logic native/VST engine output into the TDM mixer; it does not state that VST code executes on TDM DSP. | Logic Audio Platinum Mac OS/TDM, 2001 | S-008 | Emagic ESB TDM product page. | Vendor timing/resource claims were not independently measured. |
| C-025 | DOCUMENTED | High | Logic 5.3 announced future AU support, 5.4 is identified as the first AU host, and Logic Audio 5.5.0 explicitly includes AU support; sources say “Audio Units,” not AUv2. | Mac OS X transition, 2002 | S-006, S-009, S-010, S-013 | Cross-check of format page, 5.3 readme, 5.5 download, and Emagic chronology. | Does not establish AUv2 equivalence or every AU host-contract detail. |
| C-026 | DOCUMENTED | High | Emagic's OS X transition uses Core MIDI/Core Audio and an AU-exclusive third-party DSP policy rather than carbonized VST. | Logic Platinum X 5.3 through Logic Audio 5.5, Mac OS X | S-007, S-009, S-010 | OS X overview/readme and release page. | Vendor platform framing includes unverified performance claims that are not adopted. |
| C-027 | UNKNOWN | High | No retained 2.6–5.5 source establishes later formats/features such as VST3, AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, Rack Extensions, MPE, MIDI 2.0, or modern collaboration/delivery systems. | Bounded historical corpus | S-001–S-013 | Two-method bounded search of manuals and versioned pages; historical date boundary supports non-inference. | Absence from this corpus is not proof a capability never existed; result remains `UNKNOWN`/scope-limited. |
| C-028 | DOCUMENTED | High | Logic 5 introduced a new song format with lossy 4.8 export; 5.3 uses an identical OS 9/OS X format and converts audio-device parameters to Core Audio. | Logic 5.0 and Logic Platinum X 5.3 | S-002, S-009, S-011 | New Song File Format, OS X readme, and macro-conversion warning. | Binary schema, transactional saves, and all migration failures remain unknown. |
| C-029 | DOCUMENTED | Medium | Logic documents song-stored undo history and native/TDM-era settings plus versioned settings-folder migration. | Logic 3.0 and 5.0/5.1 | S-001, S-002, S-011 | Plug-in setup and multiple-undo/update sections. | Complete VST/AU state chunks and missing-plug-in recovery are not demonstrated. |
| C-030 | DOCUMENTED | High | Platinum imports/exports OMF/OpenTL audio placement but omits MIDI/automation; REX2 and other exchange paths are separately documented. | Logic Platinum 5.0 | S-002 | OMF/OpenTL and file-import sections. | Not evidence of AAF, ADM, MusicXML project exchange, or lossless round-trip. |
| C-031 | DOCUMENTED | High | Audio regions reference files; Logic supports individualization/render-to-file, record paths, missing-file search, and versioned SDII/AIFF/WAV handling. | Logic 3.0 and 5.0 | S-001, S-002 | Audio Window/Sample Editor/recording/file-format sections. | Metadata, proxy, and content-addressed asset models are not disclosed. |
| C-032 | DOCUMENTED | High | Logic 5.1.3 addressed possible song audio-configuration damage when inserting a plug-in during playback under heavy automation. | Logic 5.1.3 | S-011 | Exact versioned update warning. | Does not quantify prevalence or prove general corruption recovery. |
| C-033 | DOCUMENTED | High | Logic Audio 5.5.0 for OS X requires an existing Logic Audio 5 Mac XSKey authorization; no bypass was attempted. | Logic Audio 5.5.0, Mac OS X | S-010, S-011 | Release requirements and XSKey update note. | No redistribution/source/derivative permission follows from product access. |
| C-034 | UNKNOWN | High | Plug-in binary validation, process isolation, sandboxing, scan-crash recovery, watchdogs, and crash containment are not established. | Native/VST/DirectShow/AU/TDM/ReWire in retained scope | S-001, S-002, S-005, S-006, S-008–S-011 | Searched manuals and release notes for runtime/failure boundaries; only cache/relaunch/PIE/TDM diagnostics were found. | Separate windows or DSP hardware are not evidence of process isolation. |
| C-035 | UNKNOWN | High | Complete parameter identity, sample-accurate automation, tails/suspend, dynamic I/O, third-party state serialization, missing-device recovery, and global PDC remain unestablished. | Logic 3.0–5.5 host contracts | S-001, S-002, S-005, S-006, S-008–S-011 | Capability-by-capability search found partial UI/MIDI/multi-output/sidechain/PDC evidence only. | Format acceptance cannot fill these contract gaps. |
| C-036 | UNKNOWN | High | Process/thread topology, graph compilation, scheduling, memory ownership, binary song schema, and proprietary engine internals are undisclosed. | Pre-Apple Emagic Logic | S-001, S-002 | Manuals expose behavior and user-visible objects, not source/internals. | Environment diagrams cannot be promoted to implementation diagrams. |
| C-037 | UNKNOWN | Medium | Archived Mac and PC 5.5.1-named artifacts exist, but no readable first-party 5.5.1 changelog was retained, so final behavior is unknown. | Emagic-branded 5.5.1 artifacts | S-004 | Archive metadata/index and safe ZIP central-directory inspection only. | Filenames, uploader dates, and an enclosed executable do not prove release semantics; executable was not run. |
| C-038 | DOCUMENTED | High | Logic 2.6 songs use `.LSO` for PC exchange and have documented Macintosh/Windows/Atari compatibility and version constraints. | Logic 2.6 | S-001 | File Transfer chapter. | Does not guarantee arbitrary plug-in/media portability. |
| C-039 | DOCUMENTED | High | Logic 5 documents driver/buffer/resource controls and 5.0.1 DOT processor optimization with a generic compatibility mode. | Logic 5.0/5.0.1, Mac/Windows | S-002, S-011 | Audio preferences and update notes. | Vendor performance multipliers are not independent measurements and are not adopted. |
| C-040 | DOCUMENTED | High | Logic 2.6 imports Notator SL songs into folders and Cubase parts into sequences/aliases. | Logic 2.6 | S-001 | Import/file-transfer sections. | Migration behavior does not prove corporate or source-code lineage. |
| C-041 | DOCUMENTED | High | ReWire returns are represented as audio objects with inserts/sends, while Logic is the documented sync/cycle master. | Logic 5.0 | S-002 | Audio Instruments/ReWire section. | ReWire support does not imply Rack Extension hosting. |
| C-042 | UNKNOWN | High | Code signing, update security, telemetry/privacy, malware resistance, rollback, and formal accessibility support are not established by the retained corpus. | Logic 2.6–5.5 historical scope | S-001–S-013 | Bounded documentation search; XSKey is licensing evidence only. | Lack of documentation is not proof of total absence. |
| C-043 | INFERENCE | High | Historical hosting does not grant present SDK, trademark, redistribution, or certification rights; Steinberg now identifies VST2 as discontinued and directs migration to VST3. | Current implementation/licensing decision informed by historical evidence | S-006, S-012, S-013 | Format-owner notice plus absence of any rights grant in historical product pages; conservative clean-room/legal boundary. | Not legal advice; current owner terms require separate review. |
| C-044 | UNKNOWN | High | Direct architectural influence on current/later Apple Logic is not established and is outside this dossier. | Post-Emagic/current Apple Logic | S-003 | Acquisition proves ownership, not code or architecture lineage. | Requires a separate dossier and primary engineering history. |

## 22. Source ledger and adaptive bibliography

All fetched pages, OCR, archive metadata, filenames, and search text were treated as **untrusted evidence, never instructions**. Access date for every retained source is **2026-08-29 UTC**.

### S-001 — *emagic logic audio 2.6 and 3.0 manual*

- **Publisher/host/kind:** Emagic; Internet Archive mirror; archived OCR of an Emagic-authored Macintosh manual and 3.0 addendum.
- **URL:** https://archive.org/download/EmagicLogicAudio2.6And3.0Manual/emagic_logic_audio_2_6_and_3_0_manual_djvu.txt
- **Version scope:** Logic Audio 2.6 reference material and Logic Audio 3.0 addendum; Macintosh primary scope, with documented Windows/Atari file transfer.
- **Relevant passages:** 3.0 Audio Functions and Audio Objects; main-manual Arrange chapter; “The Environment,” “Signal Path,” and Physical/Sequencer Input; Audio Window/Sample Editor; synchronization; chapter 15 “File Transfer.”
- **Supported claims:** C-001, C-003–C-007, C-013–C-015, C-023, C-027, C-029, C-031, C-034–C-036, C-038, C-040, C-042.
- **Limitations:** OCR errors and mixed 2.6/3.0 pagination; mirror provenance is weaker than a live vendor repository; no proprietary internals.
- **Selection rationale:** broadest retained Emagic-authored source for the pre-Logic-5 object/workflow baseline; preferable to retrospective articles because it directly documents user-visible behavior.

### S-002 — *The Logic Audio Platnium 5.0 manual by Team TnD* (archive title)

- **Publisher/host/kind:** Emagic-authored manual, third-party scan/OCR hosted by Internet Archive.
- **URL:** https://archive.org/download/lap-5-manual-team-tn-d/LAP5%20Manual%20TeamTnD_djvu.txt
- **Version scope:** Logic Audio Platinum/Logic 5.0 corpus, Mac and Windows where the text distinguishes them.
- **Relevant passages:** chapter 3 Automation; Track Mixer/Global view; chapter 5 New Song File Format; chapter 6 Plug-ins/VST/DirectShow/PDC; chapter 7 Audio Instruments/ReWire; surround/TDM; OMF/OpenTL and media/import sections.
- **Supported claims:** C-001, C-008–C-012, C-014–C-018, C-021–C-023, C-027–C-031, C-034–C-036, C-039, C-041, C-042.
- **Limitations:** uploader-added cover material, substantial OCR noise, “found on a CDR” archive provenance, and incomplete assurance that every edition supplement survived. Claims are bounded to readable named sections.
- **Selection rationale:** only retained broad Logic 5 primary-manual reproduction spanning architecture and host contracts; preferable to feature lists despite its explicit provenance/OCR caveats.

### S-003 — *Apple Acquires Emagic*

- **Publisher/host/kind:** Apple; current Apple Newsroom; contemporaneous first-party press release dated 2002-07-01.
- **URL:** https://www.apple.com/newsroom/2002/07/01Apple-Acquires-Emagic/
- **Version scope:** acquisition and platform-discontinuation boundary.
- **Relevant passage:** Emagic to operate as a wholly owned Apple division; Macintosh products over 65% of revenue; Windows offerings to be discontinued 2002-09-30.
- **Supported claims:** C-002, C-044.
- **Limitations:** corporate announcement, not independent transaction verification or technical-motive/lineage evidence.
- **Selection rationale:** authoritative date and stated discontinuation source; preferable to secondary acquisition summaries.

### S-004 — *Emagic Update Archive*

- **Publisher/host/kind:** Item creator labeled Emagic; community-uploaded Internet Archive software metadata and nested ZIP indexes.
- **URL:** https://archive.org/metadata/emagic
- **Version scope:** archived Mac/PC update-artifact names, including `lax551.sit`, `lgx551.sit`, `logicaudio551.zip`, and `logicgold551.zip`.
- **Relevant passage/artifact:** archive metadata/title plus nested Mac/PC file listings; safe central-directory inspection found one `logicaudio551.exe` inside the PC ZIP.
- **Supported claims:** C-037.
- **Limitations:** not a readable first-party changelog; uploader/listing dates are not release dates; filenames cannot prove capabilities; no executable was run.
- **Selection rationale:** retained only to bound 5.5.1 artifact existence and the negative result; deliberately not used for runtime claims.

### S-005 — *Logic 5.2*

- **Publisher/host/kind:** Emagic; Wayback capture of official Emagic news page; contemporaneous first-party release feature page.
- **URL:** https://web.archive.org/web/20020808131113/http://www.emagic.de/english/news/2002/logic52.html
- **Version scope:** Logic 5.2.
- **Relevant passages:** “Multiple Outputs,” “New Plug-In: I/O Insert,” “More Sidechain Inputs,” “Monitoring with Plug-ins,” “Pre-processing with Plug-ins,” and “Software Sample Rates.”
- **Supported claims:** C-020, C-027, C-034, C-035.
- **Limitations:** concise release page, not a full host API or independently tested performance report.
- **Selection rationale:** exact version-pinned official evidence for multi-output, sidechain, and input-processing deltas; preferable to inferring them from generic VST2 support.

### S-006 — *Instruments and Plug-Ins in OS X: Audio Units*

- **Publisher/host/kind:** Emagic; Wayback capture of official Emagic page; first-party format description.
- **URL:** https://web.archive.org/web/20021223000606id_/http://www.emagic.de/english/news/2002/audiounits.html
- **Version scope:** 2002 Mac OS X Audio Units format framing; not by itself a Logic-version support statement.
- **Relevant passage:** AU as the OS X component for effects/instruments, with dynamic configuration, parameter scaling/text, and richer UI claims.
- **Supported claims:** C-025, C-027, C-034, C-035, C-043.
- **Limitations:** vendor advocacy; does not prove a named Logic build's complete hosting behavior or modern AUv2 identity.
- **Selection rationale:** primary historical terminology and claimed format surface; retained only alongside versioned host sources S-009/S-010/S-013.

### S-007 — *Mac OS X — The Forward-Looking Foundation for Computer-Based Music Production*

- **Publisher/host/kind:** Emagic; Wayback capture of official 2002 page; first-party platform overview.
- **URL:** https://web.archive.org/web/20021222193242id_/http://www.emagic.de/english/news/2002/macosx.html
- **Version scope:** Emagic's 2002 comparison of Mac OS 9 and Mac OS X audio/MIDI infrastructure.
- **Relevant passage:** “Mac OS 9 and Mac OS X: The Differences in Data Flow,” listing the fragmented OS 9 standards and OS-integrated OS X services.
- **Supported claims:** C-026, C-027, C-042.
- **Limitations:** performance/latency statements are vendor claims and were not adopted as independently measured facts.
- **Selection rationale:** useful primary transition framing; preferable to later Apple Logic documentation that would violate the historical boundary.

### S-008 — *ESB TDM — Emagic System Bridge TDM*

- **Publisher/host/kind:** Emagic; Wayback capture of official 2001 product page; first-party architecture boundary description.
- **URL:** https://web.archive.org/web/20020611080814id_/http://www.emagic.de/english/musikmesse2001/html/products/esbtdm.html
- **Version scope:** Logic Audio Platinum Mac OS with TDM/EXS24, circa 2001.
- **Relevant passage:** up to 32 EXS24 units in TDM aux channels; native/VST engine output fed into TDM mixer; sample-accurate playback claim.
- **Supported claims:** C-023, C-024, C-027, C-034, C-035.
- **Limitations:** short product page and vendor resource/timing claims; no process or fault-isolation disclosure.
- **Selection rationale:** uniquely resolves whether ESB is a bridge or VST-on-DSP execution; preferable to marketing summaries that collapse the processing domains.

### S-009 — *Logic Platinum OS X* / Logic OS X Readme

- **Publisher/host/kind:** Emagic; Wayback capture of official versioned support readme.
- **URL:** https://web.archive.org/web/20021006073821/http://www.emagic.de/english/support/download/logicosx.html
- **Version scope:** Logic Platinum X 5.3.0, Mac OS X.
- **Relevant passages:** “Overview—what's new?”, Core MIDI/Core Audio, AU support “available soon,” unavailable DAE/interchange features, `Applications/Emagic/Logic 5 Series`, identical OS 9/OS X song format, device conversion, and “Audio Units—the native OS X standard format.”
- **Supported claims:** C-025, C-026, C-028, C-034, C-035.
- **Limitations:** first OS X readme contains plans and vendor advocacy; “soon” is not shipment evidence and must be cross-checked.
- **Selection rationale:** decisive counterevidence against claiming 5.3 already hosted AU and direct evidence of Emagic's AU-only OS X policy.

### S-010 — *Logic Audio 5.5.0 for Mac OS X*

- **Publisher/host/kind:** Emagic; Wayback capture of official download/update page.
- **URL:** https://web.archive.org/web/20021125110047/http://www.emagic.de/english/support/download/lax.html
- **Version scope:** Logic Audio 5.5.0, Mac OS X 10.2+.
- **Relevant passage:** first Logic Audio 5 OS X version with Audio Unit support; existing Logic Audio 5 Mac XSKey authorization required; 5.5.0 feature list.
- **Supported claims:** C-025, C-026, C-033, C-034, C-035.
- **Limitations:** release/download description, not a full AU conformance or state/recovery specification.
- **Selection rationale:** strongest named-build evidence tying AU support and authorization requirements to Logic Audio 5.5.0.

### S-011 — *Logic 5 Info*

- **Publisher/host/kind:** Emagic; Wayback capture of official versioned update-information page.
- **URL:** https://web.archive.org/web/20020605165035/http://www.emagic.de/english/support/download/lainfo5e.html
- **Version scope:** Logic 5.0.1, 5.1.0, 5.1.2, and 5.1.3; Mac/Windows where stated.
- **Relevant passages:** 5.1.2 VST2 MIDI/cache/relaunch note; Logic Control; multiple undo saved with song; DOT/generic mode; sidechains; TDM incompatibility; Environment macro conversion; XSKey initialization; plug-in-settings migration; 5.1.3 audio-configuration warning.
- **Supported claims:** C-016, C-019, C-022, C-023, C-028, C-029, C-032–C-035, C-039, C-042.
- **Limitations:** page does not contain a readable 5.5.1 changelog or complete plug-in failure/state contract; vendor performance multipliers are not independent measurements.
- **Selection rationale:** highest-value official source for discovery/cache and failure-mode evidence that the broad manuals omit.

### S-012 — *VST 2 Discontinued*

- **Publisher/host/kind:** Steinberg; current format-owner help-center notice, updated 2022-03-08.
- **URL:** https://helpcenter.steinberg.de/hc/en-us/articles/4409561018258-VST-2-Discontinued
- **Version scope:** current VST2 lifecycle/licensing-risk context, not historical Logic behavior.
- **Relevant passage:** discontinuation of VST2 as the final transition step toward VST3 and recommendation to migrate/check VST3 support.
- **Supported claims:** C-043.
- **Limitations:** concise lifecycle notice, not a complete license analysis; does not retroactively describe Logic 5 hosting.
- **Selection rationale:** current format-owner source is preferable to third-party licensing summaries; used conservatively and not as legal advice.

### S-013 — *Audio Units History*

- **Publisher/host/kind:** Emagic; Wayback capture of official 2002 chronology.
- **URL:** https://web.archive.org/web/20021223002537/http://www.emagic.de/english/news/2002/history.html
- **Version scope:** July–December 2002 AU/Logic transition chronology.
- **Relevant passage:** 5.3 announced AU; developer build followed; 5.4 released 2002-10-09 as the first AU host; VST-to-AU porting library and developer-list milestones.
- **Supported claims:** C-025, C-027, C-043.
- **Limitations:** Emagic-authored chronology after Apple's acquisition; proves the vendor's release account, not independent conformance or AUv2 identity.
- **Selection rationale:** resolves the apparent 5.3/5.5 gap with an exact 5.4 milestone and prevents anachronistic AUv2 relabeling.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods | Blocker | Decision impact | Available evidence | Safest next probe | Required access/fixture | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Internal engine graph, threads, scheduler, memory ownership, and process boundaries | Read both broad manuals; searched versioned update/readme pages for engine/process/thread/isolation terminology. | Proprietary internals are not disclosed; no authorized source or engineering talk was retained. | Prevents adopting Environment diagrams as an implementation blueprint or evaluating real-time concurrency. | C-005–C-009, C-036; S-001, S-002 | Obtain a public Emagic engineering source or perform a separately authorized behavioral timing probe without disassembly. | Public primary engineering material, or lawful hash-pinned build in an offline timing harness. | Unassigned |
| Plug-in scanning validation, duplicate identity, blacklist/quarantine, scan-crash recovery, and runtime isolation | Searched VST folder/cache, PIE, TDM startup, relaunch, and release-failure passages across manuals and updates. | Documentation reaches cache/workarounds but not binary validation or fault boundaries; historical execution was intentionally avoided. | High impact on modern host reliability/security architecture. | C-019, C-022, C-023, C-034 | Run benign/malformed/crashing fixture matrix and observe discovery, cache, restart, and state effects. | Separate authorized offline VMs for classic Mac OS, Windows, and OS X; purpose-built lawful fixtures; no secrets/network. | Unassigned |
| Complete plug-in processing contract: parameter identity, automation granularity, tails, suspend, dynamic I/O, offline behavior, and global PDC | Decomposed format support into MIDI, multi-output, sidechain, UI, automation, delay reporting, and render/state subclaims. | Manuals document only a subset; no public ABI-level Logic host contract was retained. | Determines interoperability fidelity and whether capability ladders need per-feature qualification. | C-008, C-011, C-015, C-018–C-021, C-035 | Use controlled plug-ins that report latency/tails, expose stable/mutating parameter sets, change buses, and log callback timing across graph positions. | Lawfully buildable historical-format fixtures and synchronized audio/MIDI capture in disposable VMs. | Unassigned |
| Third-party plug-in state chunks, external assets, missing-plug-in placeholders, migration, and recovery | Read native/TDM setup storage, VST program/bank, song-format, settings-folder migration, and undo sections. | No VST/AU-specific serialized song schema or missing-device workflow was found; binary schema is proprietary. | High impact on project durability and cross-version migration. | C-021, C-028, C-029, C-035, C-036 | Save/reload a state-and-asset matrix, then remove/replace/upgrade plug-ins and compare retained unresolved data without reverse engineering files. | Authorized builds, benign fixtures, file-level hashes/diffs only, and legal approval for behavioral observation. | Unassigned |
| Exact final 5.5.1 Mac/Windows changes | Queried the archived update collection, inspected nested filenames, and safely listed the PC ZIP central directory; searched official update pages. | Only 5.5.1-named artifacts were retained; no readable first-party changelog, and executing installers is outside authority. | Low-to-medium: affects final patch chronology, not the leading architecture conclusions. | C-037; S-004 | Locate a contemporaneous official `Update-Info`/release note or cataloged manual; do not infer from executable metadata. | Lawful public document or verifiable archive capture; no installer execution required. | Unassigned |
| Security/update/privacy/accessibility behavior | Searched manuals, readmes, and updates for signing, trust, rollback, telemetry/privacy, screen-reader, and keyboard-access claims. | Historical corpus is silent or predates modern terminology; absence is not proof. | Medium for product comparison, low for transferable Logic-specific architecture. | C-033, C-042 | Locate versioned accessibility/security documentation; otherwise retain unknown rather than dynamically attacking old software. | Public documentation; separate accessibility audit authority if a lawful runnable build exists. | Unassigned |
| Creator/Notator corporate/source lineage and direct influence on later Apple Logic | Checked import/migration behavior, acquisition statement, and Emagic chronology; excluded current Apple Logic sources. | Migration proves file continuity, acquisition proves ownership, and neither proves code/architecture lineage. | Low for this dossier; potentially material only to a separate historical-lineage decision. | C-002, C-040, C-044 | Seek named primary interviews/engineering histories with explicit version and authorship claims, then triangulate independently. | Separate scoped dossier and public primary history sources. | Unassigned |

## 24. Curiosity pass and stop decision

Scores are 1 (low) to 5 (high); **cost 5 is most expensive**. Only a thread capable of changing an in-frame architecture conclusion qualified for pursuit.

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision/outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Version-pinned AU host chronology across 5.3–5.5 | 5 | 5 | 4 | 2 | **PURSUED:** S-009/S-010/S-013 resolved the contradiction: 5.3 announced support, 5.4 is called the first AU host, and 5.5.0 Logic Audio includes AU. |
| Exact 5.5.1 changelog | 3 | 2 | 3 | 4 | `CURIOSITY_NO_GO`: archive artifact names and a non-executed ZIP were found, but another pass was unlikely to change architecture conclusions. Reopen for a readable official changelog. |
| Dynamic scan/isolation/state/PDC qualification | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO` for the documentary wave: high-value next phase, but requires separately authorized lawfully sourced VMs and fixtures. |
| Prove AUv2 equivalence from 2002 “Audio Units” | 2 | 2 | 3 | 4 | `CURIOSITY_NO_GO`: risks anachronism; reopen only for a versioned Apple legacy specification. |
| Infer current Apple Logic implementation/influence | 2 | 3 | 4 | 5 | `CURIOSITY_NO_GO`: explicitly out of scope and unsupported by acquisition evidence. |
| Exhaustive native device/preset inventory | 1 | 1 | 1 | 4 | `CURIOSITY_NO_GO`: unlikely to change host or object-model conclusions. |
| Acquisition valuation, strategy, or motives | 1 | 1 | 3 | 3 | `CURIOSITY_NO_GO`: business-history thread outside the architecture decision. |

**Gaps and contradictions after synthesis:** no unresolved contradiction remains in the documented AU chronology or acquisition boundary. Material evidence gaps remain for proprietary internals, complete host contracts, state/recovery, security/accessibility, and 5.5.1 patch details; each is visible in section 23 rather than filled from memory.

**Negative results retained:** nested research failed because the configured subagent-depth limit was reached; web search returned HTTP 429; some Wayback `id_` retrievals failed and were replaced with accessible equivalent captures; the community archive exposed 5.5.1 filenames but no readable first-party changelog; no public source was found for runtime isolation, binary schemas, global PDC, or direct later-Apple architectural influence.

**Stop decision — `STOP_COVERAGE_AND_SATURATION`:** all template dimensions and required plug-in rows are covered with documented evidence or explicit unknowns; 13 retained sources trace the decision-critical claims; repeated retrieval converged on the same manuals/release pages; the only documentary follow-up with positive marginal value (AU chronology) was completed. Further general searching has nonpositive expected marginal evidence and risks scope drift into Logic 6/current Apple Logic. The recommended next step is a separately authorized interoperability prototype, not more documentary searching.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** This session wrote only `research/daw-landscape/dossiers/emagic-logic-audio.md`; unrelated pre-existing workspace changes were not touched.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0 pins Logic 2.6/3.0 through 5.2, tightly bounds 5.3–5.5 transition evidence, and excludes Logic 6/current Apple Logic.
- [x] **Every required dossier heading exists in order.** Sections 0–25 follow `DOSSIER-TEMPLATE.md`.
- [x] **Every material assertion has a claim ID and classification.** Substantive sections cite C-001–C-044; section 21 classifies each as `DOCUMENTED`, `INFERENCE`, or `UNKNOWN`.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Section 21 maps claims to S-001–S-013; section 23 records methods, blockers, impacts, evidence, and probes.
- [x] **Every required plugin-format row is present.** Section 11.1 includes VST2, VST3, AUv2, AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, Rack Extension, and Product-native/other.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 separate discovery, runtime, buses, UI, automation, state, latency, and failures.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Vendor claims are bounded; no `OBSERVED` runtime claims are made; unsupported internals remain unknown.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 and C-033/C-043 prohibit inferred rights, bypass, binary analysis, or copied implementation.
- [x] **Bibliography records source rationale and limitations.** Section 22 gives publisher, URL, kind, scope, passages, claims, limitations, and selection rationale for all 13 sources.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24 record scored and qualitative rejection decisions plus reopen conditions.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** No historical executable/installer/plugin was run; one ZIP central directory was listed without extraction/execution; no stage or commit occurred.

**Owned path:** `research/daw-landscape/dossiers/emagic-logic-audio.md`

**Checks performed:** source-trail recovery, claim/source mapping, heading/format inspection, negative-result audit, dossier validator, and path-scoped Git status/diff.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; 44 claims; 13 retained sources; every required matrix row present.

**Unresolved blockers:** no public proprietary internals or complete host/state contract; no readable first-party 5.5.1 changelog; nested-research depth limit and web-search 429 were worked around with retained direct archive evidence.

**Pre-existing workspace changes:** unrelated modified/untracked files shown by Git were left untouched.
