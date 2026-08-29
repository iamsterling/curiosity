# Opcode Studio Vision / Studio Vision Pro DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** Opcode Studio Vision, centered on Studio Vision Pro (SVP), with Studio Vision AV and Vision DSP used only where edition lineage or feature chronology is explicit. [C-001] [C-002]
- **Canonical vendor/upstream:** Opcode Systems, Inc.; by September 1998 Opcode described itself as a wholly owned Gibson Musical Instruments subsidiary. [C-003]
- **Researcher/session:** `ses_fb271e97cffeCfEv2QMtufsIEL`.
- **Owned path:** `research/daw-landscape/dossiers/opcode-studio-vision.md`.
- **Research date and cutoff:** 2026-08-29 UTC.
- **Version snapshots:** primary 1994 Studio Vision Pro/AV manual; period SVP 3.0 (1996) and 4.0.1 (1998) reviews; official SVP 4.1 announcement, 4.2 release, 4.2.2 updater, late feature page, and 4.5.1 authorization fixer. The official 2001 download page also listed a 4.5.1c upgrade. [C-001] [C-004] [C-005]
- **Status:** historical/discontinued. A February 2001 period report says Gibson had effectively “mothballed” Opcode and OMS development had stopped; no first-party formal discontinuation date was found. [C-006]
- **Platform scope:** Studio Vision Pro is evidenced only on classic Macintosh System/Mac OS, across 68K and PowerPC depending on version and audio path. A distinct Windows Vision product existed but is outside this SVP dossier; no Windows, Linux, modern macOS, mobile, or web SVP edition is evidenced. [C-007]
- **Included:** MIDI/audio sequencing, OMS, Sound Manager, DAE/TDM, Acadia/ASIO, editing, routing, consoles, automation, Premiere and VST effects, ReWire chronology, project/media references, authorization, and discontinuation boundaries.
- **Excluded:** binary execution or reverse engineering; installer acquisition; undocumented code/process/thread internals; the separate Windows Vision architecture; proprietary file schemas; and causal claims about influence on later DAWs.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.

## 1. Executive summary

Studio Vision Pro is a historically important reference for treating MIDI and externally stored audio as neighboring event types inside a compositional hierarchy of Song, Sequence, Track, and reusable Segment. Its manuals explicitly describe non-destructive audio events as playback instructions pointing into disk files, while much of the same selection and editing vocabulary applies to MIDI and audio. [C-008] [C-009]

Its public architecture is a layered set of user-visible contracts rather than disclosed internals: OMS centralizes MIDI drivers, studio topology, names, and timing; Studio Vision selects Sound Manager or DAE in the 1994 snapshot; late SVP adds Acadia/ASIO while retaining Digidesign/TDM paths. This breadth enabled hardware choice but also created version-sensitive extension, memory, and compatibility dependencies. [C-010] [C-011] [C-031]

The late plug-in story is effects-oriented. Opcode announced VST and ASIO for SVP 4.1 in September 1998, then explicitly released them with Acadia in SVP 4.2 in December 1998. The official late feature page documents four inserts per console strip, 16 buses, four aux sends, VST bank/program templates, and 8–24-bit DSP/playback. TDM and non-real-time Premiere plug-ins are also documented. VST instruments, scanning/validation, isolation, sidechains, multi-output, latency/tail reporting, complete state recall, and crash recovery remain **UNKNOWN**. [C-012]–[C-016]

Vision DSP 4.5 directly documents ReWire and VST/mix automation; the same announcement says SVP 4.5 CDs were forthcoming, but it does not unambiguously assign every listed feature to SVP. SVP ReWire and plug-in-parameter automation are therefore bounded **INFERENCE**, not documented fact. [C-017]

The strongest transferable ideas are format-neutral editing over typed events, referenced media with explicit destructive exceptions, reusable segment references, a shared MIDI device model, and automation data editable in ordinary event views. The liabilities are global OMS dependence, fragile classic-Mac extension/hardware matrices, key-disk authorization, and an undocumented modern-quality host contract. [C-018] [C-029] [C-031]

**Overall confidence:** high for the 1994 primary-manual behavior, OMS role, official late SVP feature/release pages, and authorization mechanics; medium for version-to-version lineage; low/unknown for proprietary internals, formal discontinuation, ReWire in SVP specifically, complete plug-in interoperability, and causal influence.

## 2. Product identity, history, and market position

Opcode's own late release material calls Studio Vision Pro the first professional software to integrate digital-audio recording with a full MIDI sequencer and dates that event to 1991. A 1998 period review instead says the original Studio Vision was released in 1990. The exact debut year is therefore **UNKNOWN** within the retained evidence, although both sources establish an early-1990s integrated MIDI/audio position. [C-003] [C-019]

The retained lineage is:

- Vision grew from Opcode's earlier Macintosh MIDI sequencer and supplied the phrase/sequence-oriented MIDI base. [C-008]
- The 1994 manual distinguishes Studio Vision AV, supporting built-in/Sound Manager and Audiomedia paths, from Studio Vision Pro, which additionally supports professional Sound Tools and Pro Tools hardware. [C-002]
- By SVP 3.0, OMS 2.0, Sound Manager, DAE/TDM, Yamaha CBX, audio DSP, consoles, and patented Audio↔MIDI workflows were central differentiators. [C-010] [C-020]
- SVP 4.0 refined MIDI editing and the interface; Opcode announced Acadia/VST/ASIO for 4.1 and directly documented their release in 4.2. [C-012]
- The sibling chronology is firmer: Opcode announced Vision DSP 4.1 with VST/ASIO on 1998-07-10 and explicitly confirmed shipment on 1998-08-28, before announcing the corresponding SVP 4.1 upgrade. This does not prove the SVP build shipped. [C-012]
- SVP 4.2.2 is dated 1999-03-03; a 1999-10-11 fixer repairs SVP 4.5.1 hard-drive authorization; a 2001 official download page lists SVP 4.5.1c. [C-004] [C-005]
- By February 2001, period reporting described Opcode as mothballed, with no new OMS development. Exact product cessation, final source revision, end-of-sale, and support-end dates remain **UNKNOWN**. [C-006]

The product targeted composers, producers, musicians, and multimedia work requiring both MIDI sequencing and hard-disk audio, with professional hardware support separating Pro from lower-cost Vision/AV paths. Claims that its patterns directly influenced named later DAWs are not supported by retained engineering or historical evidence. [C-003] [C-030]

## 3. Workflow and conceptual model

The persisted top-level object is described as a **Song**. A Song contains one or more **Sequences**; Sequences contain **Tracks**; Tracks can contain smaller **Segments**. Sequences can represent song sections, and Segments can be reused and edited by reference across larger structures. The program can also be used linearly, but its native metaphor is phrase/section-oriented rather than only a tape reel. [C-008]

MIDI notes/controllers and audio events coexist in tracks and can be simultaneously selected where an operation makes sense. An audio event is a typed reference to a region of recorded material, while an Audio Instrument associates playback identity, output, volume, and pan with events. Late versions add Pulse (rhythmic grid), Graphic (piano roll/waveform), List, Notation, Track Overview/Sequence, Strip Chart, and Console views over the same musical material. [C-009] [C-021]

There is no scene launcher, tracker order list, user-wired modular graph, browser/mobile model, or cloud workspace in the retained evidence. Their absence is not generalized beyond the historical editions. [C-036]

## 4. Publicly documented architecture

Only the following public, user-visible layering is established:

1. Studio Vision owns Songs/Sequences/Tracks/Segments and MIDI/audio editing. [C-008] [C-009]
2. OMS is a Macintosh system extension and central MIDI driver. One current Studio Setup describes interfaces, devices, ports, channels, names, and timing for OMS-compatible applications. [C-010]
3. The 1994 Studio Vision chooses Apple Sound Manager or Digidesign Audio Engine (DAE) as its digital-audio system. Sound Manager or DAE then controls hardware; recorded media remains in external audio files referenced by sequence events. [C-011] [C-018]
4. Late SVP adds Opcode's Acadia audio engine, VST effects, ASIO hardware, Digidesign Direct I/O, and retained DAE/TDM paths. [C-012] [C-013]
5. Console strips route MIDI, Audio Instruments, hardware inputs/outputs, and buses; late SVP exposes inserts, sends, EQ, master, and offline bounce. [C-013]

Process boundaries, binary module structure, real-time thread ownership, scheduler design, lock-free behavior, memory layout, graph compilation, and whether any plug-in or audio backend ran out-of-process are **UNKNOWN**. “Engine,” “extension,” detached editor, or separate DAE application wording must not be expanded into unproven isolation claims. [C-032]

## 5. Audio engine

- The 1994 manual documents hardware-dependent one-to-sixteen simultaneous audio channels, Sound Manager and DAE modes, session/hardware sample-rate selection, and a user-sized RAM buffer. DAE supports 44.1/48 kHz in that snapshot; available resolution/rates/channels vary by hardware. [C-022]
- SVP 4.0 documents 8-, 16-, and 24-bit stereo audio and Pro Tools/24; the late SVP page documents 8–24-bit DSP/playback. [C-023]
- The SVP 4.2 release documents Acadia at up to 96 kHz, stereo-interleaved files, 24-to-16-bit dithering, Direct I/O, ASIO, and offline bounce including console automation, effects, EQ, and sends. These are vendor release claims, not independent performance measurements. [C-013]
- Buffer size trades RAM and start/stop delay against disk access frequency. Late pages expose CPU, RAM, and disk performance meters. [C-024]
- DAE/TDM offloads or uses Digidesign hardware depending on configuration; Sound Manager and Acadia can use Macintosh audio paths. Exact summing precision, block sizes, scheduler, multicore use, resampler quality, denormal handling, dropout recovery, plugin delay compensation, and tail handling are **UNKNOWN**. [C-011] [C-032]

## 6. Tracks, timeline, clips, and editing

Audio events are non-destructive region instructions into source files. The Graphic, Tracks, and List windows support waveform/numeric selection, moving, trimming/lengthening, cut/copy/paste, retain/separate, overlapping events, renaming, muting/soloing, and Audio Instrument reassignment. Multiple takes can be separated and assembled into another track without rewriting the originals. [C-009] [C-025]

The manual carefully distinguishes operations that affect or create disk data: delete/compact alter or remove data, while consolidate, sample-rate conversion, deinterleave, and Mix Audio create files. Strip Silence can separate regions and optionally compact unused data; late versions add crossfades, expanded waveform zoom, automatic naming, Select Unused, and improved file management. [C-018] [C-025]

Segments can loop, reference top-level sequences, and propagate edits to instances. The 4.x editor supports nudge, Select & Modify, track-specific playback quantize, groove/grid quantize, and controller strip charts. [C-008] [C-021]

Modern take lanes, swipe comping, elastic/warp markers, clip-gain envelopes as a distinct model, persistent branching history, and ripple modes are **UNKNOWN**. [C-036]

## 7. MIDI, sequencing, notation, and expression

Documented MIDI surfaces include recording/playback, piano-roll Graphic editing, List editing, score/Notation, Pulse drum grid, tracks/arrangement, quantize and grooves, controller strip charts, arpeggiator/repeat input effects, substitutions/generators, patch names, MIDI faders/consoles, and MIDI remote keys. OMS exposes hardware devices and hundreds of addressable channels subject to interface limits. [C-010] [C-021]

SVP 3.0 documents monophonic Audio-to-MIDI extraction of note, velocity, volume, brightness, and pitch-bend information, followed by MIDI editing and MIDI-to-Audio application back to the source performance. These are product DSP features, not general plug-in or polyphonic note-expression contracts. [C-020]

SMPTE, MIDI Time Code, MIDI Machine Control, OMS IAC inter-application buses, and QuickTime/MIDI integration are documented. The official FAQ gives a concrete Pro Tools configuration in which MTC returns through one IAC bus and MMC is sent through another. [C-026]

MPE, per-note expression protocols, MIDI 2.0, modern MIDI-CI/property exchange, and sample-accurate event delivery to VSTs are outside the evidenced era and contract. They are **NOT_APPLICABLE** to the historical edition scope rather than evidence of a modern implementation. [C-007]

## 8. Routing, mixer, automation, and control

SVP 3.0 consoles are customizable, offer wide/narrow views, can be built from selected or audio tracks, and were reported at up to 256 channels. Volume, pan, mute, and solo apply to MIDI/audio identities; TDM systems expose up to four TDM plug-ins in that snapshot. [C-014]

Late SVP directly documents configurable strip inputs from MIDI, Audio Instruments, hardware inputs/outputs, and buses; four DSP inserts per strip; 16 buses; four aux sends; four-band EQ; configurable master; recording from points in the audio chain; and console/controller overdub without destroying note data. SVP 4.2 offline bounce includes console automation, effects, EQ, and sends. [C-013] [C-027]

Vision DSP 4.5 directly documents automation of VST plug-ins, EQ, solo/mute, and aux-send amount, editable in List, Strip Chart, and Select & Modify views. Because the announcement does not explicitly assign every Vision DSP 4.5 feature to the forthcoming SVP 4.5 CD, equivalent SVP plug-in-parameter automation remains an **INFERENCE** with the alternative that SVP's shipping feature set differed. [C-017]

VCAs, surround/immersive layouts, sidechain semantics, feedback rules, sample-accurate automation, touch/latch/write modes, OSC, and a public controller API are **UNKNOWN**. [C-028]

## 9. Recording, comping, and media handling

Studio Vision records audio into user-designated external files, associates the resulting event with an Audio Instrument and sequence track, and saves event references with the sequence. Sound Manager records AIFF; DAE records Sound Designer II in the 1994 snapshot; playback also recognizes Sound Designer and Dyaxis. [C-018] [C-022]

The manual documents input metering, Audio Thru, record enable, stereo selection, append-to-file, auto-compact, Wait for Note/countoff, SMPTE recording, punch/overdub references, take auditioning, missing-file location, sample-rate conversion, deinterleaving, file compact/consolidate/delete, and mixing to new files. [C-018] [C-025]

SVP 4.2 adds multiple-file import and linked-mono handling; the late feature page documents QuickTime 3 audio import/movie export. The exact video track/conform model, metadata preservation, archive/collect operation, transactional relinking, proxy media, and modern interchange are **UNKNOWN**. [C-013] [C-036]

## 10. Instruments, effects, content, and native devices

Audio Instruments in Studio Vision are playback/routing identities for audio events, not necessarily software synthesizer plug-ins. OMS instruments similarly name MIDI destinations. [C-009] [C-010]

Documented processing includes normalization, reverse, phase inversion, filtering/EQ, fades/crossfades, pitch/formant shift, time scale, audio-tempo adjustment, strip silence, sample-rate conversion, and mix operations. Late Acadia systems include four-band EQ and bundled VST effects; Vision DSP was also bundled with Galaxy and Peak SE. [C-020] [C-023] [C-029]

No native sampler/synth device architecture, rack/container format, modulation graph, macro system, content-package ABI, VST instrument hosting, or MAS hosting is established for SVP. ReWire provided a protocol-level route to external software synthesizers in the sibling Vision DSP 4.5 evidence. [C-015] [C-017]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`macOS` below means the evidenced **classic Macintosh System/Mac OS** product, not a modern macOS build. `NOT_APPLICABLE` is used where no SVP edition exists on the platform or where the format belongs outside the evidenced classic-Mac product boundary. [C-007]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `DOCUMENTED`: generic Steinberg VST real-time **effects** on classic Mac; exact VST API generation unnamed | `NOT_APPLICABLE`: no Windows SVP edition evidenced | `NOT_APPLICABLE`: no Linux SVP edition evidenced | `NOT_APPLICABLE`: no mobile/web edition | Announced SVP 4.1; explicitly released SVP 4.2; late feature page | Mapping period “VST” to VST2 is `INFERENCE`; VST instruments and full contract `UNKNOWN` | [C-012] [C-013] [C-015]; S-003, S-010, S-011 |
| VST3 | `NOT_APPLICABLE`: no evidenced post-classic-Mac SVP edition | `NOT_APPLICABLE`: no Windows SVP | `NOT_APPLICABLE`: no Linux SVP | `NOT_APPLICABLE`: no mobile/web SVP | Historical/discontinued scope | No VST3 host claim | [C-007] [C-006]; S-004, S-016 |
| AUv2 | `NOT_APPLICABLE`: no evidenced Mac OS X SVP edition | `NOT_APPLICABLE`: no Windows SVP | `NOT_APPLICABLE`: no Linux SVP | `NOT_APPLICABLE`: no mobile/web SVP | Classic Mac OS scope | No Audio Unit host claim; do not project Sound Manager to AU | [C-007] [C-011]; S-001, S-004 |
| AUv3 | `NOT_APPLICABLE`: no modern macOS SVP edition | `NOT_APPLICABLE`: no Windows SVP | `NOT_APPLICABLE`: no Linux SVP | `NOT_APPLICABLE`: no mobile/web SVP | Historical scope | No AUv3 host claim | [C-007]; S-004 |
| AAX | `NOT_APPLICABLE`: historical SVP used Digidesign TDM/DAE, not an evidenced AAX edition | `NOT_APPLICABLE`: no Windows SVP | `NOT_APPLICABLE`: no Linux SVP | `NOT_APPLICABLE`: no mobile/web SVP | SVP 3.x–4.x | TDM must not be relabeled AAX | [C-014] [C-016]; S-008, S-013 |
| CLAP | `NOT_APPLICABLE`: no post-discontinuation edition | `NOT_APPLICABLE`: no Windows SVP | `NOT_APPLICABLE`: no Linux SVP | `NOT_APPLICABLE`: no mobile/web SVP | Historical/discontinued scope | No CLAP host claim | [C-006] [C-007]; S-016 |
| LV2 | `NOT_APPLICABLE`: no evidenced LV2/classic-Mac contract | `NOT_APPLICABLE`: no Windows SVP | `NOT_APPLICABLE`: no Linux SVP | `NOT_APPLICABLE`: no mobile/web SVP | Historical scope | No LV2 host claim | [C-007]; S-001–S-017 |
| LADSPA | `NOT_APPLICABLE`: no evidenced LADSPA/classic-Mac contract | `NOT_APPLICABLE`: no Windows SVP | `NOT_APPLICABLE`: no Linux SVP | `NOT_APPLICABLE`: no mobile/web SVP | Historical scope | No LADSPA host claim | [C-007]; S-001–S-017 |
| DSSI | `NOT_APPLICABLE`: no evidenced DSSI/classic-Mac contract | `NOT_APPLICABLE`: no Windows SVP | `NOT_APPLICABLE`: no Linux SVP | `NOT_APPLICABLE`: no mobile/web SVP | Historical scope | No DSSI host claim | [C-007]; S-001–S-017 |
| JSFX | `NOT_APPLICABLE`: no product/format integration evidenced | `NOT_APPLICABLE`: no Windows SVP | `NOT_APPLICABLE`: no Linux SVP | `NOT_APPLICABLE`: no mobile/web SVP | Historical scope | No JSFX host claim | [C-007]; S-001–S-017 |
| DirectX/DXi | `NOT_APPLICABLE`: classic-Mac SVP | `NOT_APPLICABLE`: no Windows SVP edition evidenced | `NOT_APPLICABLE`: no Linux SVP | `NOT_APPLICABLE`: no mobile/web SVP | Historical Mac scope | Separate Windows Vision is excluded and cannot prove SVP hosting | [C-007]; S-004 |
| Rack Extension | `NOT_APPLICABLE`: no overlapping SVP edition | `NOT_APPLICABLE`: no Windows SVP | `NOT_APPLICABLE`: no Linux SVP | `NOT_APPLICABLE`: no mobile/web SVP | Historical/discontinued scope | ReWire does not imply Rack Extension hosting | [C-017]; S-012 |
| Product-native/other | `DOCUMENTED`: Digidesign TDM plug-ins; non-real-time Premiere-style plug-ins; ReWire only inferential for SVP 4.5 | `NOT_APPLICABLE`: no Windows SVP | `NOT_APPLICABLE`: no Linux SVP | `NOT_APPLICABLE`: no mobile/web SVP | SVP 3.x/4.x; sibling Vision DSP 4.5 | TDM/DAE, Premiere, and ReWire are distinct contracts; MAS not evidenced | [C-014] [C-016] [C-017]; S-012–S-015 |

### 11.2 Discovery, scanning, validation, and recovery

The retained SVP sources do not document VST search paths, startup or manual scanning, recursive traversal, cache, duplicate identity, shell plug-ins, validation, timeout, blacklist/quarantine, rescan UX, scan crash recovery, or diagnostics. All remain **UNKNOWN**. A format logo, effect list, or insert menu cannot fill these gaps. [C-015]

DAE/DSI compatibility is version-sensitive: the official FAQ directs users to install matching Digidesign components and describes failures caused by incompatible extensions. This is dependency qualification, not a plug-in scanner or sandbox. [C-031]

### 11.3 Runtime isolation and compatibility

VST/Acadia, TDM, Premiere, DAE, Direct I/O, and ASIO are documented as distinct integration paths. In-process versus helper-process execution, sandboxing, plug-in crash containment, watchdogs, 68K/PPC plug-in bridging, code signing, and compatibility modes are **UNKNOWN**. The fact that DAE is a separate application in some workflows does not prove isolation for plug-ins or the host. [C-011] [C-032]

### 11.4 Host/plugin processing contract

The evidenced VST contract is a real-time **effect** in one of four Acadia inserts on a console strip, with routing through four sends/16 buses and offline bounce including effects in SVP 4.2. TDM and Premiere processing follow separate hardware/offline paths. [C-013] [C-014] [C-016]

VST instrument/event input, sidechains, multiple audio buses per instance, multi-output, dynamic I/O, plugin-generated MIDI, sample-accurate automation, latency/tail reporting, PDC, bypass/suspend details, and headless processing remain **UNKNOWN**. Vision DSP's ReWire software-synth path must not be treated as VST instrument support. [C-015] [C-017]

### 11.5 Parameters, automation, state, presets, and project recall

The official SVP feature page documents saveable templates for VST banks and programs from the effect-edit window. SVP 4.2 documents offline bounce with console automation; Vision DSP 4.5 documents editable VST-parameter automation, but equivalent SVP behavior is inferential. [C-013] [C-017] [C-027]

Stable parameter IDs, ranges/text, gesture semantics, state chunks, project serialization of plug-in state, external assets, missing-plugin placeholders, preset paths, migration, and failed-restore recovery are **UNKNOWN**. Explicit bank/program templates do not prove complete automatic project recall. [C-015]

### 11.6 UI, diagnostics, and failure modes

An effect-edit window and VST bank/program templates are documented, but custom-versus-generic UI behavior, window embedding, scaling, focus, accessibility, headless mode, and UI crash containment are **UNKNOWN**. Engine-level CPU/RAM/disk meters and DAE/authorization error FAQs exist; per-plug-in CPU, scan logs, crash reports, and disabled-plugin UX are not established. [C-015] [C-024] [C-031]

## 12. Extensibility and integration

Documented integration boundaries are OMS drivers/IAC/name/timing services; MIDI hardware and remote keys; DAE/TDM/Direct I/O; Sound Manager; Acadia/ASIO; VST effects; Premiere effects; external editors such as Sound Designer II/AudioShop or bundled Peak SE; QuickTime; SMPTE/MTC/MMC; and sibling-edition ReWire. [C-010] [C-011] [C-016] [C-017] [C-026] [C-029]

No public SVP scripting language, macro language, third-party native device SDK, command API, remote network API, or stable project-file API was found. OMS did have a driver/module ecosystem, but this dossier does not establish its SDK licensing or ABI. [C-033]

## 13. Project format, persistence, interoperability, and collaboration

A sequence/Song file stores musical events and instrument assignments while external audio remains in referenced files. On reopen Studio Vision locates the files; missing audio can be located, and changed OMS topologies can trigger instrument remapping. The FAQ advises backing up both sequence and associated audio before conversion and keeping them together. [C-018] [C-034]

The 1994 media set includes AIFF, Sound Designer/II, and Dyaxis playback, with DAE and Sound Manager selecting recording formats. Later evidence adds QuickTime 3 import/export, stereo interleaved audio, multi-file import, and mix/bounce outputs. [C-013] [C-018]

The proprietary Song schema, atomic save, autosave, crash recovery, migration rules, forward/backward compatibility, checksum/asset identity, embedded media, collect/archive package, missing-plugin placeholder, AAF/OMF/ADM/MusicXML/DAWproject, cloud collaboration, and version-control model are **UNKNOWN**. Standard MIDI File authorship is mentioned in vendor history but exact SVP import/export fidelity was not separately qualified. [C-033] [C-036]

## 14. Delivery, live, post-production, and specialized workflows

SVP supports mix creation, Acadia offline bounce, dithering for CD-oriented 24-to-16-bit delivery, QuickTime movie workflows, SMPTE/MTC/MMC, and Digidesign professional hardware. Audio↔MIDI conversion and tempo/pitch/formant transforms are the distinctive composition/editing specialties. [C-013] [C-020] [C-026]

Live triggering of sequences from QWERTY/MIDI keys, arpeggiator/repeat effects, and recordable controller/consoles are documented. This is not evidence of a modern clip-launch performance-set model. [C-008] [C-021] [C-027]

Surround/immersive delivery, ADM, loudness standards, DDP, ADR tooling, batch queues, stem manifests, and modern video conform are **UNKNOWN**. [C-036]

## 15. Performance, reliability, security, and accessibility

Performance is hardware- and backend-dependent. Documented controls include RAM buffer size, enabled I/O, application and DAE memory partitions, disk defragmentation guidance, and CPU/RAM/disk meters. The 1994 manual gives up to 16 simultaneous channels; later products scale differently with Power Mac, ASIO, and Digidesign hardware. [C-022] [C-024]

Reliability liabilities are explicitly visible in Opcode's support pages: mismatched DAE/DSI, HFS+ cautions for older DAE systems, compact/consolidate backup warnings, crashes from insufficient application memory, extension conflicts, authorization errors, and version-specific audio/track fixes. [C-031]

The product predates modern signing/notarization and sandbox expectations in the evidenced scope. Update authenticity, rollback, malware controls, telemetry/privacy, plug-in trust prompts, accessibility APIs, screen-reader behavior, color/contrast accommodations, localization, and security response processes are **UNKNOWN**. [C-035]

## 16. Licensing, ecosystem, and implementation constraints

Studio Vision Pro is proprietary software. The retained manuals prohibit reproduction and grant no source, SDK, redistribution, derivative-work, or trademark rights. The full end-user license, TDM/VST/ASIO/ReWire SDK agreements, and current rights-holder permissions are not retained. [C-029]

SVP used key-disk/PACE-style authorization. Official material requires a floppy for authorization, reports hard-drive authorization errors, and provides a 4.5.1 fixer for an authorization-disk problem. This is a historical ecosystem dependency and not a pattern to copy. [C-005] [C-029]

Naming VST, ASIO, TDM, Premiere, ReWire, Sound Manager, OMS, or Direct I/O does not grant current SDK, trademark, redistribution, certification, or compatibility rights. Any modern adaptation must use independently designed abstractions and current format-owner terms; this dossier is not legal advice. [C-029]

## 17. Strengths, liabilities, and architecture lessons

**Evidence-backed strengths**

- MIDI and audio share a compositional hierarchy and many selection/edit commands without pretending they are identical event types. [C-008] [C-009]
- Audio events are explicitly non-destructive references, with destructive/copying file operations named separately. [C-018]
- Reusable Segments support arrangement by reference rather than forced duplication. [C-008]
- OMS centralizes studio topology, names, channels, and timing for multiple applications. [C-010]
- Multiple audio backends allowed built-in, third-party, and professional DSP hardware paths; late Acadia added buses, inserts, effects, and offline bounce. [C-011] [C-013]
- Audio↔MIDI conversion demonstrates a high-level semantic bridge between recorded performance and editable event data. [C-020]

**Liabilities/historical constraints**

- OMS is a global classic-Mac dependency with one current Studio Setup; its stalled development became a platform-transition risk. [C-006] [C-010]
- DAE/DSI, extensions, memory partitions, disk formatting, and hardware combinations produced a fragile compatibility surface. [C-031]
- External audio references are useful but the retained evidence does not establish atomic collect/relink/recovery. [C-034]
- Key-disk/PACE authorization created hardware/support fragility. [C-029]
- VST support is documented at an effect/insert level, but the interoperability and fault-containment contract is largely unknown. [C-015]
- No defensible evidence establishes causal influence on named later DAW implementations. [C-030]

These are architecture-reference assessments, not a retrospective product-quality verdict.

## 18. Transferable patterns

### TP-1 — Typed events under common editing operations

- **Problem:** let users manipulate MIDI and audio together without flattening their semantics.
- **Minimal mechanism:** typed MIDI/audio events share sequence/track placement and format-neutral operations such as select, move, mute, substitute, and quantize where valid; type-specific DSP remains separate. [C-009] [C-021]
- **Prerequisites:** explicit capability checks, deterministic timebase conversion, undo, typed validation, and clear unsupported-operation UX.
- **Tradeoffs:** compositional fluency versus semantic edge cases and accidental destructive behavior.
- **Adaptation risk:** low at the abstract level; do not copy proprietary UI or algorithms.
- **Disposition:** `CANDIDATE`.

### TP-2 — Referenced media with explicit materialization commands

- **Problem:** support many edits/takes without duplicating source audio.
- **Minimal mechanism:** events reference immutable source ranges; consolidate, render/mix, rate conversion, compact, and delete are explicit materialization/destructive operations. [C-018]
- **Prerequisites:** stable asset IDs, transactional save, relink/collect, garbage collection, backups, and crash-safe compaction—several are unknown for SVP. [C-034]
- **Tradeoffs:** efficient editing and source preservation versus dependency and lifecycle complexity.
- **Adaptation risk:** low for the pattern, high if historical file-management behavior were copied literally.
- **Disposition:** `CANDIDATE`.

### TP-3 — Reusable segment references

- **Problem:** arrange recurring sections without copy/paste drift.
- **Minimal mechanism:** a Segment references reusable sequence material; edits propagate to instances while loop length/count remain instance properties. [C-008]
- **Prerequisites:** explicit identity, cycle detection, flatten/fork operations, and migration semantics.
- **Tradeoffs:** concise arrangements versus aliasing surprises and nested-timing complexity.
- **Adaptation risk:** low at the abstract composition-model level.
- **Disposition:** `CANDIDATE`.

### TP-4 — Shared studio/device model

- **Problem:** prevent every MIDI application from duplicating hardware topology, names, and drivers.
- **Minimal mechanism:** a system service exposes stable device/port/channel identities and shared names/timing to clients. [C-010]
- **Prerequisites:** versioned API, per-project snapshots, hot-plug/reconciliation, isolation, and graceful degradation absent from the historical evidence.
- **Tradeoffs:** consistency across applications versus a global single point of failure and stale setup state.
- **Adaptation risk:** medium; adapt the service boundary, reject the single-current-document/global-extension coupling.
- **Disposition:** `CONDITIONAL`.

### TP-5 — Backend-neutral routing with explicit capability tiers

- **Problem:** support built-in I/O, native CPU processing, and professional DSP hardware.
- **Minimal mechanism:** host-level tracks/consoles target backend adapters (historically Sound Manager, DAE/TDM, Acadia/ASIO) with capability discovery. [C-011] [C-013]
- **Prerequisites:** one canonical graph, latency model, conformance suite, persistence mapping, and failure diagnostics.
- **Tradeoffs:** hardware breadth versus combinatorial compatibility and lowest-common-denominator behavior.
- **Adaptation risk:** high unless modern qualification and isolation are built in.
- **Disposition:** `CONDITIONAL`.

### TP-6 — Automation as ordinary editable event data

- **Problem:** make automation correctable with familiar composition tools.
- **Minimal mechanism:** expose automation in list/strip-chart/select-modify views with typed parameter targets. Vision DSP 4.5 is the direct evidence; SVP equivalence is inferential. [C-017]
- **Prerequisites:** stable parameter IDs, gestures, thinning, interpolation, sample accuracy, missing-target behavior, and migration.
- **Tradeoffs:** powerful editing versus density/performance and identity complexity.
- **Adaptation risk:** medium because the historical parameter contract is unknown.
- **Disposition:** `CONDITIONAL`.

## 19. Rejected patterns and CURIOSITY_NO_GO

| Pattern/thread | Evidence or gap | Decision rationale | Reopen condition |
| --- | --- | --- | --- |
| One global current MIDI setup as project truth | OMS exposes one current Studio Setup to clients. [C-010] | `REJECT`: convenient globally, but projects need snapshot/reconciliation and graceful missing-device behavior. | Prototype a versioned service plus project-local binding map. |
| Key-disk/hard-drive authorization | Floppy/key-disk/PACE errors and a 4.5.1 fixer are documented. [C-005] [C-029] | `REJECT`: availability, recovery, and hardware fragility. | Never as the primary modern entitlement design. |
| Version-sensitive extension/backend matrix without conformance tests | DAE/DSI and OS/disk conflicts are documented. [C-031] | `REJECT`: support cost and ambiguous failure ownership. | A modern adapter certification harness and actionable diagnostics. |
| Infer VST instruments from VST effects | Every retained SVP statement says effects/plug-ins in inserts; ReWire handled software synths separately. [C-015] [C-017] | `CURIOSITY_NO_GO`: format acceptance is not instrument/event support. | Versioned official manual or authorized fixture test. |
| Infer MAS hosting | No retained manual, feature page, or release page names MAS. | `CURIOSITY_NO_GO`: no positive evidence; absence alone is not unsupported behavior. | First-party compatibility matrix. |
| Treat detached engines/edit windows as sandboxing | No process/crash boundary is documented. [C-032] | `CURIOSITY_NO_GO`: UI or application naming cannot prove isolation. | Public engineering documentation or safe process observation. |
| Claim SVP ReWire as direct fact | Vision DSP 4.5 is direct; SVP 4.5 was only said to be forthcoming in that announcement. [C-017] | `CURIOSITY_NO_GO`: preserve edition distinction. | Accessible SVP 4.5 manual/release notes. |
| Claim exact first shipping VST/ASIO version | 4.1 was announced prospectively; 4.2 is directly released. [C-012] | `CURIOSITY_NO_GO`: exact intermediate shipment remains unresolved and does not alter architecture. | Immutable SVP 4.1 release package/readme metadata. |
| Reverse-engineer Song/installer/plugin binaries | Schemas and internals are unpublished. [C-033] | `CURIOSITY_NO_GO`: outside documentary clean-room authority and unnecessary for this decision. | Separate lawful authorization and disposable test plan. |
| Infer causal influence on later DAWs | Sources document early integration and vendor “first” claims, not technology transfer. [C-030] | `CURIOSITY_NO_GO`: historical prominence is not causal evidence. | First-party later-DAW engineering history citing concrete adoption. |
| Continue discontinuation-date searching | Two period sources converge on mothballing by 2001 but no formal notice was found. [C-006] | `CURIOSITY_NO_GO`: low architectural impact and repeated archival gaps. | Rights-holder corporate/support record. |

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test / counterevidence search | Outcome |
| --- | --- | --- |
| H-1: Studio Vision merely bolts audio tracks onto an unrelated MIDI sequencer. | Compared 1994 event model, simultaneous selection, instruments, v3 workflows, and Song hierarchy. | **Falsified at user-model level:** typed MIDI/audio events share tracks and many operations, though engine internals remain unknown. [C-009] |
| H-2: Audio edits rewrite source files. | Checked manual's non-destructive section and explicit disk-affecting exceptions. | **Falsified:** normal edits change pointers/instructions; named operations materialize, compact, or delete data. [C-018] |
| H-3: OMS is only a MIDI-interface driver. | Checked OMS 2.0 overview, setup, names, timing, and IAC material. | **Falsified:** it also stores shared studio topology/names and provides timing/inter-application services. [C-010] |
| H-4: SVP 4.0.1 already shipped VST/ASIO. | Compared October 1998 review with 4.1 announcement and 4.2 release. | **Falsified:** the review called them forthcoming; direct release proof appears at 4.2. [C-012] |
| H-5: An announced SVP 4.1 proves it shipped. | Inspected announcement wording and update/download records. | **Not supported:** announcement says “will be available”; exact 4.1 shipment remains `UNKNOWN`. [C-012] |
| H-6: VST support proves VST instruments and complete bus/state support. | Separated effects/inserts, presets, automation, scanning, event I/O, buses, latency, state, and recovery. | **Falsified as an evidence claim:** only an effects-oriented subset is established. [C-015] |
| H-7: Vision DSP 4.1's offline-bounce limitation contradicts SVP 4.2. | Compared version/edition dates. | **Resolved:** Vision DSP 4.1 excluded real-time effects; later SVP 4.2 expressly included Acadia effects/automation in offline bounce. [C-013] [C-037] |
| H-8: ReWire in Vision DSP 4.5 necessarily means SVP 4.5 had it. | Searched for dedicated SVP 4.5 release/manual; none was retained. | **Inference only:** likely shared lineage, plausible alternative is a differing SVP shipment. [C-017] |
| H-9: Project save proves durable plug-in recall. | Compared sequence/audio reference, VST bank/program template, and FAQ evidence. | **Not supported:** plug-in state, missing instances, and recovery are `UNKNOWN`. [C-015] [C-034] |
| H-10: Studio Vision's early integration proves influence on later DAWs. | Looked for concrete later engineering adoption rather than marketing/history statements. | **Not supported:** historical position is documented; causal influence remains `UNKNOWN`. [C-030] |

**Later safe dynamic probe (not performed):** only under separate authority, use a lawfully obtained hash-pinned SVP build in a disposable offline classic-Mac fixture with non-malicious period VST-effect fixtures. Separately test discovery, list appearance, instantiation, audio processing, editor, bank/program exchange, automation, latency, save/reload, missing plug-in, malformed plug-in, and crash behavior. No historical binaries were executed here.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Retained snapshots cover a 1994 Pro/AV manual and SVP updates through listed 4.5.1c. | Product/version scope | S-001, S-005 | Manual title and official downloads. | Exact final executable/build unknown. |
| C-002 | DOCUMENTED | High | Studio Vision AV supports built-in/Sound Manager and Audiomedia paths; Pro adds professional Sound Tools/Pro Tools hardware. | 1994 editions | S-001 | “About Studio Vision,” pp. 3–4. | Later edition packaging may differ. |
| C-003 | DOCUMENTED | High | Opcode was a Gibson subsidiary by September 1998 and positioned SVP for professional/semi-professional musicians and multimedia. | Corporate/market | S-010, S-011 | Direct press boilerplate and audience statement. | Exact acquisition date not established. |
| C-004 | DOCUMENTED | High | SVP 4.2.2 update is dated 1999-03-03 and requires SVP 4.0. | Classic Mac updater | S-006 | Direct official update table. | Linked supplement/addendum inaccessible. |
| C-005 | DOCUMENTED | High | Official records list a 4.5.1c upgrade and a 1999-10-11 fixer for SVP 4.5.1 hard-drive authorization. | Late SVP | S-005, S-007 | Direct download/update descriptions. | Fix date is not necessarily 4.5.1 release date. |
| C-006 | DOCUMENTED / UNKNOWN | Medium-high | Period reporting says Gibson had effectively mothballed Opcode and OMS had no new development by Feb. 2001; formal cessation date remains unknown. | Discontinuation | S-016, S-017 | Two period secondary reports converge. | No first-party closure notice retained. |
| C-007 | DOCUMENTED | High | SVP is evidenced on classic Mac OS with 68K/PPC support depending on version; no other SVP platform edition is evidenced. | Platform | S-001, S-004, S-008 | Direct requirements and manual. | Separate Windows Vision excluded. |
| C-008 | DOCUMENTED | High | Song→Sequence→Track→Segment hierarchy supports phrase reuse, nesting/reference, loops, and live triggering. | SVP 3/4 user model | S-003, S-013, S-014 | Period descriptions plus late official feature list. | Internal representation unknown. |
| C-009 | DOCUMENTED | High | MIDI and audio events can coexist in tracks and share appropriate selection/edit operations; audio events reference disk data. | 1994+ event model | S-001, S-003 | Manual pp. 3, 11–15, 113–156 and late feature list. | Does not imply one internal class/type. |
| C-010 | DOCUMENTED | High | OMS is a central Macintosh MIDI driver/system extension with shared studio topology, devices/channels, names, timing, and IAC; one setup is current. | OMS 2.0 | S-002, S-008 | OMS overview/setup and SVP Pro Tools FAQ. | Later OMS 2.3.x differs; process internals unknown. |
| C-011 | DOCUMENTED | High | Studio Vision uses Sound Manager or DAE in 1994; late SVP adds Acadia/ASIO while retaining Digidesign paths. | Audio backend boundary | S-001, S-003, S-010, S-011 | Direct manuals/releases. | Adapter internals and simultaneous backend behavior unknown. |
| C-012 | DOCUMENTED / UNKNOWN | High | Vision DSP 4.1 was announced with VST/ASIO on 1998-07-10 and shipped by 1998-08-28; VST/ASIO were forthcoming for tested SVP 4.0.1, announced prospectively for SVP 4.1, and explicitly released in SVP 4.2; exact SVP 4.1 shipment remains unknown. | 1998 chronology | S-010, S-011, S-014, S-018, S-019 | Triangulates sibling announcement/shipment with SVP review, announcement, and release. | A missing SVP 4.1 supplement could discriminate. |
| C-013 | DOCUMENTED | High | SVP 4.2 Acadia provides VST effects, ASIO/Direct I/O, EQ, 96 kHz, stereo interleaved files, dithering, and offline bounce with automation/effects/EQ/sends. | SVP 4.2 | S-011 | Direct official release feature list. | Vendor claim, no independent runtime test. |
| C-014 | DOCUMENTED | High | SVP supports Digidesign DAE/TDM/Pro Tools hardware and TDM plug-ins; v3 consoles could expose up to four TDM plug-ins. | SVP 3.x/4.x | S-001, S-008, S-010, S-013 | Manual, FAQ, release, review. | TDM contract depth and exact limits vary by hardware/version. |
| C-015 | DOCUMENTED / UNKNOWN | High | VST effects, four inserts, bank/program templates are documented; scan, isolation, event/instrument, bus edge cases, latency/tails, state and recovery are unknown. | Late SVP host | S-003, S-010, S-011 | Positive claims separated from missing host-contract evidence. | Absence is not proof of unsupported behavior. |
| C-016 | DOCUMENTED | High | Non-real-time Premiere-style plug-ins and their preview/process path are documented alongside VST/TDM. | SVP/Vision DSP 4 era | S-003, S-014, S-015 | Official feature page and period reviews. | Exact Premiere API/version and SVP processing fidelity unknown. |
| C-017 | INFERENCE | Medium | ReWire and VST/mix automation are direct for Vision DSP 4.5 and likely shared with forthcoming SVP 4.5, but direct SVP confirmation is missing. | 4.5 lineage | S-012 | Same announcement names both editions and SVP extras. | Plausible alternative: differing SVP shipment/features. |
| C-018 | DOCUMENTED | High | Audio events are non-destructive pointers; explicit file operations delete/compact or create/consolidate/render data; files are external and relinkable. | 1994 manual | S-001 | Manual pp. 11–15, 41–53, 85–99, 195–215. | Schema, asset IDs, transactionality unknown. |
| C-019 | UNKNOWN | High | Sources conflict between 1990 and 1991 for Studio Vision's debut year. | Product history | S-011, S-014 | First-party late history versus period retrospective. | Needs contemporaneous release record. |
| C-020 | DOCUMENTED | High | SVP offers pitch/time/tempo DSP plus monophonic Audio-to-MIDI and MIDI-to-Audio workflows. | SVP 3/4 | S-010, S-013, S-014 | Release and detailed reviews. | Algorithm internals, limits, patent scope not investigated. |
| C-021 | DOCUMENTED | High | MIDI views/functions include Graphic, List, Notation, Pulse, quantize/grooves, controllers, arpeggiator, substitutions, and remote keys. | SVP 3/4 | S-003, S-013, S-014 | Official features and period operation. | MPE/MIDI 2.0 outside scope. |
| C-022 | DOCUMENTED | High | 1994 audio capacity/rates/resolution/buffer behavior depend on Sound Manager/DAE hardware, up to 16 simultaneous channels. | 1994 Pro/AV | S-001 | Chapters 2, 4–5, 9–10. | Not a late-version ceiling. |
| C-023 | DOCUMENTED | High | SVP 4.0 supports 8/16/24-bit stereo and Pro Tools/24; late SVP documents 8–24-bit DSP/playback. | SVP 4.x | S-003, S-014 | Official feature page and period review. | Internal precision and all codec details unknown. |
| C-024 | DOCUMENTED | High | Users control RAM/audio buffers and later see CPU/RAM/disk meters; substantial app/DAE memory may be required. | 1994–4.x | S-001, S-003, S-008 | Manual, feature page, FAQ. | Meter accuracy and scheduler unknown. |
| C-025 | DOCUMENTED | High | Audio edit/take/file commands include move/trim/copy/separate, strip silence, crossfade, compact/consolidate, and take assembly. | 1994–4.x | S-001, S-003 | Manual chapters 14–21 and late feature list. | Modern lane/comp model not established. |
| C-026 | DOCUMENTED | High | SMPTE/MTC/MMC, OMS IAC sync with Pro Tools, and QuickTime integration are documented. | SVP 3/4 | S-008, S-013, S-014 | FAQ instructions and reviews. | Sample-accurate lock and modern video conform unknown. |
| C-027 | DOCUMENTED | High | Late SVP routes MIDI/audio/input/output/bus sources through four inserts, 16 buses, four sends and records console/controller overdub; 4.2 bounce includes automation. | Late SVP | S-003, S-011 | Direct official features/release. | Automation resolution/write-mode details unknown. |
| C-028 | UNKNOWN | High | VCAs, surround, sidechains, feedback, OSC, modern remote APIs, and sample-accurate automation are unresolved. | Routing/control | S-003, S-008, S-011 | Targeted pages do not define them. | Additional manual could discriminate some historical items. |
| C-029 | DOCUMENTED / INFERENCE | High | Product is proprietary and key-disk/PACE authorized; naming third-party formats grants no present implementation rights. | License/ecosystem | S-001, S-004, S-005, S-007, S-009 | Copyright/authorization facts plus bounded rights inference. | Full EULA/SDK terms unavailable; not legal advice. |
| C-030 | UNKNOWN | High | Causal architectural influence on later named DAWs is not established. | Historical influence | S-003, S-011, S-013, S-014 | Sources show early position and vendor claims only. | Later engineering testimony could change this. |
| C-031 | DOCUMENTED | High | Support material documents DAE/DSI mismatch, HFS+ cautions, memory crashes, compact/consolidate backup warnings, extension conflicts, and fixed defects. | SVP 3.5/4.x | S-008, S-009 | Direct official FAQ. | Frequency/severity not independently measured. |
| C-032 | UNKNOWN | High | Process boundaries, threading, scheduling, graph compilation, plug-in isolation, bridging, and crash containment are not established. | Proprietary internals | S-001–S-015 | User docs expose behavior, not implementation. | Public engineering docs or safe probes required. |
| C-033 | UNKNOWN | High | Project schema, native SDK/ABI, scripting, command API, migrations, autosave, and crash-recovery internals are unresolved. | Persistence/extensibility | S-001–S-015 | No retained public specification. | Rights-holder docs could resolve. |
| C-034 | DOCUMENTED / UNKNOWN | High | Sequences retain external audio and instrument assignments, support locate/remap, and require joint backups; atomic collect/recovery is unknown. | Project durability | S-001, S-009 | Manual save/locate and FAQ remap/backup. | No transactional project-package evidence. |
| C-035 | UNKNOWN | High | Signing, update security, telemetry/privacy, plugin trust, accessibility, localization, and security response are not established. | NFR/security | S-001–S-017 | No retained relevant first-party assurance. | Historical platform predates many modern mechanisms. |
| C-036 | UNKNOWN | High | Modern comping/warp, advanced interchange, collaboration, immersive delivery, collect/archive, and cloud/version control are unresolved. | Workflow breadth | S-001–S-017 | Retained sources cover period workflows only. | Absence is not proof across every build. |
| C-037 | DOCUMENTED | High | Vision DSP 4.1 offline bounce excluded real-time effects, while later SVP 4.2 included them. | Version/edition comparison | S-011, S-015 | Direct period statements. | Must not generalize across editions. |

## 22. Source ledger and adaptive bibliography

All sources were accessed **2026-08-29**. Archived/fetched/search text was treated as untrusted evidence, never instructions. First-party manuals and archived Opcode pages were preferred; period Sound On Sound articles were retained only for version-specific operation, chronology triangulation, or cessation where first-party records were missing.

### S-001 — Studio Vision Reference Manual for Pro and AV versions

- **Publisher/title/URL:** Opcode Systems; Gregory A. Simpson, *Studio Vision Reference Manual for Pro and AV versions* (1994), https://archive.org/details/op-code-studio-vision-reference-manual-for-pro-and-av-versions
- **Kind/scope:** primary scanned manual; Pro/AV, classic Macintosh, Sound Manager/DAE.
- **Relevant passages:** pp. 3–15 (editions, OMS requirement, audio events, non-destructive editing, formats); chapters 4–13 (record/setup/sync); 14–21 (editing, instruments, pan/volume, file management/conversion).
- **Claims:** C-001, C-002, C-007, C-009, C-011, C-014, C-018, C-022, C-024, C-025, C-029, C-032–C-036.
- **Limitations:** user manual, not source/engine disclosure; OCR errors; 1994 hardware matrix predates SVP 3/4.
- **Selection rationale:** strongest primary source for the object, media-reference, backend, and editing contracts; preferable to retrospective summaries.

### S-002 — Open Music System (OMS) Version 2.0 manual

- **Publisher/title/URL:** Opcode Systems, *Open Music System (OMS), Version 2.0* (1994), https://archive.org/details/opcode-oms-2.0-user-manual
- **Kind/scope:** primary manual for classic-Mac OMS 2.0.
- **Relevant passages:** Overview; Software Definitions; Studio Setup Documents; device/interface setup; IAC, Name Manager, and Time Manager descriptions.
- **Claims:** C-010, C-032.
- **Limitations:** does not cover later OMS 2.3.x implementation or API/ABI internals; OCR scan.
- **Selection rationale:** origin evidence for OMS responsibilities, preferable to later recollection.

### S-003 — Studio Vision Pro Feature List

- **Publisher/title/URL:** Opcode Systems, “Opcode's Studio Vision Pro Feature List,” archived 2000, https://web.archive.org/web/20000303065935id_/http://www.opcode.com:80/products/svpro/f_001.shtml
- **Kind/scope:** first-party late-SVP product feature page.
- **Relevant passages:** VST effects, console sources, four inserts, 16 buses, four aux sends, bank/program templates, ASIO, 8–24-bit DSP, Pulse/Strip Chart/Segments.
- **Claims:** C-008, C-009, C-011, C-013, C-015, C-016, C-021, C-023–C-028, C-030.
- **Limitations:** marketing list with at least one stray “Vision DSP” phrase; no build number or host-contract depth.
- **Selection rationale:** highest-density first-party late-SVP feature boundary, used cautiously and triangulated with release pages.

### S-004 — Studio Vision Pro system requirements and hardware compatibility

- **Publisher/title/URL:** Opcode Systems, “Opcode's Studio Vision Pro,” archived 2000, https://web.archive.org/web/20000303101154id_/http://www.opcode.com:80/products/svpro/index.shtml
- **Kind/scope:** first-party product/requirements page.
- **Relevant passages:** fat 68K/PPC app, Mac OS 7.6.1+, floppy authorization, audio PowerPC recommendation, ASIO and Digidesign hardware.
- **Claims:** C-007, C-011, C-029.
- **Limitations:** page contains incomplete/legacy Yamaha wording and no exact product build.
- **Selection rationale:** direct platform/hardware/authorization scope.

### S-005 — Opcode product and documentation downloads

- **Publisher/title/URL:** Opcode Systems, “Product and Documentation Downloads,” archived 2001, https://web.archive.org/web/20010124003500id_/http://www.opcode.com:80/downloads/
- **Kind/scope:** first-party download index.
- **Relevant passages:** SVP 4.2.2 requiring 4.0.1 key disk; SVP 4.5.1c upgrade; Vision DSP 4.5.1c; OMS 2.3.8.
- **Claims:** C-001, C-004, C-005, C-029.
- **Limitations:** listing, not release notes; live binaries were not retrieved or run.
- **Selection rationale:** primary evidence for late version availability and key-disk dependency.

### S-006 — Studio Vision Pro 4.2.2 update page

- **Publisher/title/URL:** Opcode Systems, “Studio Vision Pro Update,” https://web.archive.org/web/19991001061439id_/http://www.opcode.com:80/dl/svpro/svp_mac.html
- **Kind/scope:** first-party update metadata.
- **Relevant passages:** date modified 03-Mar-99, SVP 4.0 requirement, 4.2.2 description, links to 4.1 supplement/4.2 addendum.
- **Claims:** C-004, C-012.
- **Limitations:** linked supplement/addendum archives were inaccessible; date is page “Date Modified.”
- **Selection rationale:** exact origin for 4.2.2 chronology.

### S-007 — Studio Vision Pro 4.5.1 authorization fixer

- **Publisher/title/URL:** Opcode Systems, “Studio Vision Pro Update,” https://web.archive.org/web/20000302214229id_/http://www.opcode.com:80/dl/svpro/svp_mac_4.5_fix.html
- **Kind/scope:** first-party fix metadata.
- **Relevant passage:** 11-Oct-99; fixes hard-drive authorization using SVP 4.5.1 authorization disk.
- **Claims:** C-005, C-029.
- **Limitations:** fix date does not establish original 4.5.1 ship date or all authorization behavior.
- **Selection rationale:** precise authorization failure/fix evidence.

### S-008 — Studio Vision Pro support FAQ

- **Publisher/title/URL:** Opcode Systems, “Studio Vision Pro,” https://web.archive.org/web/20000601151704id_/http://www.opcode.com:80/support/faqs/faq_svpro.shtml
- **Kind/scope:** first-party support FAQ for SVP 3.5/4.0 and DAE/Pro Tools.
- **Relevant passages:** key-disk errors; DAE/DSI matching; HFS+ caution; compact/consolidate backup; memory; 4.0 fixes; OMS IAC/MTC/MMC Pro Tools setup; requirements.
- **Claims:** C-007, C-010, C-014, C-024, C-026, C-029, C-031, C-034.
- **Limitations:** page header's “current version 4.0.1” conflicts with later download records, indicating stale assembled FAQ content.
- **Selection rationale:** direct operational failure and integration evidence unavailable in marketing pages.

### S-009 — Vision & Studio Vision Pro General FAQ

- **Publisher/title/URL:** Opcode Systems, “Vision & Studio Vision Pro General,” https://web.archive.org/web/20000601000000id_/http://www.opcode.com:80/support/faqs/faq_svp_vis_gen.shtml
- **Kind/scope:** first-party support FAQ.
- **Relevant passages:** backup sequences/audio together; OMS instrument remapping and sequence-stored assignments; PACE/key-disk error; memory/extension conflicts.
- **Claims:** C-029, C-031, C-034.
- **Limitations:** spans products/versions and omits schema details.
- **Selection rationale:** strongest first-party persistence/remap and authorization support evidence.

### S-010 — Opcode announces Studio Vision Pro 4.1

- **Publisher/title/URL:** Opcode Systems, “Opcode Announces Studio Vision 4.1 Professional Audio and MIDI Sequencer,” 1998-09-26, https://web.archive.org/web/19991004002834id_/http://www.opcode.com:80/news/press/svp_4.1_aes.html
- **Kind/scope:** first-party announcement.
- **Relevant passages:** VST, Acadia, Pro Tools/24/TDM, ASIO cards, Audio↔MIDI, free upgrade; prospective availability wording.
- **Claims:** C-003, C-010–C-015, C-020.
- **Limitations:** announcement is not proof of shipment; vendor positioning.
- **Selection rationale:** origin evidence for intended 4.1 scope and crucial announcement-versus-release distinction.

### S-011 — Opcode releases Studio Vision Pro 4.2

- **Publisher/title/URL:** Opcode Systems, “Opcode Releases Studio Vision Pro 4.2 With New ‘Acadia’ Audio Engine Software,” 1998-12-29, https://web.archive.org/web/20000914190801/http://www.opcode.com:80/news/press/svp_4.2_pr.shtml
- **Kind/scope:** first-party release announcement.
- **Relevant passages:** released Acadia, VST/ASIO/Direct I/O, offline bounce with automation/effects/EQ/sends, 96 kHz, interleaved files, dithering, TDM updates.
- **Claims:** C-003, C-008, C-011–C-015, C-019, C-027, C-030, C-037.
- **Limitations:** vendor claims, archive toolbar wrapper, no independent test or deep contract.
- **Selection rationale:** best evidence that late features were released, not merely planned.

### S-012 — Vision DSP 4.5 release / forthcoming SVP 4.5

- **Publisher/title/URL:** Opcode Systems, “Opcode Releases Vision DSP Version 4.5 Upgrade to Web Site,” archived 2000, https://web.archive.org/web/20000819061058id_/http://www.opcode.com:80/news/press/visdsp4.5_pr_ships.shtml
- **Kind/scope:** first-party sibling-edition release announcement.
- **Relevant passages:** ReWire, VST/mix automation, SMPTE tracks, file management; SVP 4.5 CDs forthcoming; SVP adds TDM and Audio↔MIDI.
- **Claims:** C-017, C-029.
- **Limitations:** no explicit assignment of all Vision DSP features to shipping SVP; direct SVP 4.5 release page not found.
- **Selection rationale:** only retained primary ReWire/automation chronology; intentionally bounded to sibling scope.

### S-013 — Opcode Studio Vision Pro v3.0 review

- **Publisher/title/URL:** Martin Russ, Sound On Sound, March 1996, https://www.soundonsound.com/reviews/opcode-studio-vision-pro-v30
- **Kind/scope:** reputable period secondary review with operational detail.
- **Relevant sections:** The Vision Thing; OMS; DSP; Consoles; System Requirements; Tracks.
- **Claims:** C-008, C-010, C-013, C-014, C-020–C-022, C-026, C-030.
- **Limitations:** reviewer report and vendor-supplied limits, not internals or independent benchmark.
- **Selection rationale:** version-pinned triangulation of v3 workflows not fully covered by the 1994 audio supplement.

### S-014 — Opcode Studio Vision Pro 4 review

- **Publisher/title/URL:** Martin Russ, Sound On Sound, October 1998, https://www.soundonsound.com/reviews/opcode-studio-vision-pro-4
- **Kind/scope:** reputable period review of SVP 4.0.1.
- **Relevant sections:** product hierarchy; Pulse Edit; Audio; Pace of Change.
- **Claims:** C-008, C-012, C-016, C-019–C-021, C-023, C-026, C-030.
- **Limitations:** secondary; reports VST/ASIO as forthcoming rather than tested.
- **Selection rationale:** decisive counterevidence against assigning VST/ASIO to shipping 4.0.1.

### S-015 — Opcode Vision DSP v4.1 review

- **Publisher/title/URL:** Bob Dormon, Sound On Sound, January 1999, https://www.soundonsound.com/reviews/opcode-vision-dsp-v41
- **Kind/scope:** reputable period secondary review of sibling Vision DSP 4.1.
- **Relevant sections:** New to v4.1; Recording & Processing; Specifications.
- **Claims:** C-012, C-013, C-015, C-016, C-037.
- **Limitations:** sibling edition; exact review fixture/build and release day not stated; cannot prove SVP behavior.
- **Selection rationale:** tests Acadia/VST/ASIO routing and identifies the earlier offline-bounce limitation.

### S-016 — Readers' Problems / Apple Notes

- **Publisher/title/URL:** Paul Wiffen, Sound On Sound, February 2001, https://www.soundonsound.com/techniques/readers-problems
- **Kind/scope:** period secondary industry/platform report.
- **Relevant passage:** OMS core described as old 68K code with no new development since Gibson effectively mothballed Opcode.
- **Claims:** C-006, C-035.
- **Limitations:** not a formal corporate notice; author characterization.
- **Selection rationale:** nearest contemporaneous accessible cessation/platform-transition evidence.

### S-017 — Apples and Lemons

- **Publisher/title/URL:** Paul White, Sound On Sound, September 2002, https://www.soundonsound.com/people/apples-and-lemons
- **Kind/scope:** period editorial/secondary retrospective.
- **Relevant passage:** Opcode described as sidelined following Gibson's buyout.
- **Claims:** C-006.
- **Limitations:** retrospective editorial, no date or corporate record.
- **Selection rationale:** independent triangulation of mothballing; not used for architecture claims.

### S-018 — Vision DSP 4.1 announcement

- **Publisher/title/URL:** Opcode Systems, “Opcode's New ‘Vision DSP’ Delivers Real-Time Audio Effects and Studio Vision Features,” 1998-07-10, https://web.archive.org/web/19991004034234id_/http://www.opcode.com:80/news/press/vision_dsp.html
- **Kind/scope:** first-party sibling-edition announcement.
- **Relevant passages:** Vision DSP 4.1, VST effects, ASIO cards, four inserts/sends, expected July 1998 release.
- **Claims:** C-012.
- **Limitations:** announcement says release was expected; it does not by itself prove shipment or SVP availability.
- **Selection rationale:** origin for the checkpointed 1998-07-10 chronology and intended Vision DSP 4.1 scope.

### S-019 — Vision DSP shipment announcement

- **Publisher/title/URL:** Opcode Systems, “Opcode Releases Vision DSP Audio and MIDI Sequencer,” 1998-08-28, https://web.archive.org/web/19990428082738id_/http://www.opcode.com:80/news/press/visdsp_shipping.html
- **Kind/scope:** first-party sibling-edition release/shipment announcement.
- **Relevant passages:** confirms Vision DSP shipment with VST, ASIO, inserts, sends, EQ, and bundled effects.
- **Claims:** C-012.
- **Limitations:** sibling Vision DSP, not Studio Vision Pro; marketing release text is not a runtime qualification.
- **Selection rationale:** separates actual shipment from the July announcement and prevents transfer to SVP without evidence.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe | Required access / owner |
| --- | --- | --- | --- | --- |
| Exact final SVP build, ship/end-of-sale/support dates | Official download/update pages and two period cessation reports; no formal closure notice | Medium for provenance, low for architecture | Rights-holder product/support archive | Public corporate record; unassigned |
| Whether SVP 4.1 actually shipped before 4.2 | Announcement is prospective; 4.1 supplement link inaccessible; direct release is 4.2 | Low-medium chronology | Retrieve immutable SVP 4.1 readme/package metadata without executing it | Lawful archive; unassigned |
| Direct SVP 4.5 ReWire and VST automation | Dedicated SVP 4.5 press/manual search returned no retained page | Medium for integration matrix | Versioned SVP 4.5 manual/release notes | Public archive; unassigned |
| VST discovery/scanning/identity/validation | Official feature/release/support pages omit details | High for modern host design | Versioned manual first; otherwise authorized disposable fixture | Manual or lawful build/test plug-ins; unassigned |
| VST instruments, buses, sidechains, latency/tails, PDC | Sources consistently say effects but do not prove unsupported cases | High for interoperability | Purpose-built period VST2 fixtures, one capability at a time | Separate test authority; unassigned |
| Plug-in state, missing plug-ins, presets, migration | Bank/program templates are explicit; automatic project recall is not | High for durability | Save/reload/missing-plugin fixture tests | Separate test authority; unassigned |
| Process/thread/sandbox architecture | User manuals and pages expose no internals | Medium; historical design should not be guessed | First-party engineering paper/source, if ever released | Rights-holder/public engineering source; unassigned |
| Song schema and atomic media/project recovery | Locate/remap/backups are documented; schema/autosave are not | High for persistence lessons | Public schema or authorized black-box crash/save tests | Separate authority; unassigned |
| Exact Audio↔MIDI algorithm limits | User workflows only; proprietary algorithm/patent not needed here | Low for host architecture | Do not pursue unless semantic-audio prototype requires it | Separate research scope; unassigned |
| Accessibility/security/privacy | No period assurance located | Low for historical pattern, high if product were revived | Rights-holder documentation; do not infer | Public records; unassigned |
| Causal influence on later DAWs | No engineering lineage/testimony found | Low for architecture choice | Named first-party later-DAW account citing adoption | Historical oral/written primary source; unassigned |

## 24. Curiosity pass and stop decision

Scores use 0–3 for **decision relevance (R)**, **expected evidence value (V)**, **novelty (N)**, and **cost (C, lower is better)**.

| Candidate thread | R | V | N | C | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Official late SVP feature/update chronology | 3 | 3 | 3 | 1 | **Pursued:** found 4.1 announcement, 4.2 release, 4.2.2 update, 4.5.1 fixer. |
| Direct SVP 4.5 ReWire evidence | 3 | 2 | 2 | 1 | **Pursued once:** no dedicated SVP page found; retained bounded inference. |
| More discontinuation-date searching | 1 | 1 | 1 | 2 | `CURIOSITY_NO_GO`: two period sources saturate the architecture conclusion; formal date has low decision effect. |
| Recover inaccessible 4.1 supplement/4.2 addendum repeatedly | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: archive 503/missing captures repeated; official 4.2 release covers material features. |
| Broad user forums/reviews | 1 | 1 | 1 | 2 | `CURIOSITY_NO_GO`: cannot establish internals and likely duplicates retained period reviews. |
| Installer/binary execution | 2 | 2 | 3 | 3 | `CURIOSITY_NO_GO`: unnecessary trust/licensing risk and outside documentary authority. |
| Reverse-engineer Song or plug-in ABI | 2 | 2 | 3 | 3 | `CURIOSITY_NO_GO`: proprietary internals and clean-room boundary. |
| Prove influence on later DAWs | 1 | 1 | 2 | 3 | `CURIOSITY_NO_GO`: no named lineage lead and low architecture decision value. |

**Gaps/contradictions after synthesis:** 1990 versus 1991 debut; announced 4.1 versus directly released 4.2; direct Vision DSP versus inferential SVP 4.5 ReWire; and sibling Vision DSP 4.1 versus later SVP 4.2 offline-bounce behavior. Each is explicitly scoped rather than averaged away. [C-012] [C-017] [C-019] [C-037]

**Stop decision:** `STOP_COVERAGE_AND_SATURATION`. Every required section and format row is populated; primary evidence covers the product/object/media/OMS model and first-party late pages cover routing, plug-in chronology, platform, and authorization. Period sources triangulate operation and cessation. Remaining questions require inaccessible versioned documents, rights-holder records, or separately authorized dynamic fixtures. Repeated Wayback 503s, inaccessible supplements, a web-search 429, and duplicate feature text further reduce marginal value. Another documentary pass is unlikely to change the leading architecture lessons.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added `research/daw-landscape/dossiers/opcode-studio-vision.md`; no staging or commits.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0; conflicting dates remain explicit.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and 11.1–11.6 present.
- [x] **Every material assertion has a claim ID and classification.** Sections cite C-001–C-037; claims register labels `DOCUMENTED`, `INFERENCE`, or `UNKNOWN`.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Claims register and Section 23.
- [x] **Every required plugin-format row is present.** Section 11.1 includes all 13 required rows.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 separate discovery, runtime, processing, state, UI, and recovery.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Notably 4.1/4.2 and Vision DSP/SVP boundaries.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16.
- [x] **Bibliography records source rationale and limitations.** Section 22, S-001–S-019.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary retrieval only.

**Checks performed:** heading/matrix/claim/source coverage review; edition/version contradiction review; explicit unknown scan; clean-room and ownership review. **Unresolved blockers:** missing archived 4.1 supplement/4.2 addendum, no direct SVP 4.5 ReWire page, no formal closure notice, and no lawful dynamic fixture under this scope. **Pre-existing workspace changes:** observed and left untouched.
