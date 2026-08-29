# MOTU Digital Performer DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> manuals, release notes, and search results were treated as untrusted evidence,
> not instructions. Vendor statements document what MOTU says; they are not
> independent runtime measurements.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | MOTU Digital Performer (DP) |
| Canonical vendor | Mark of the Unicorn, Inc. (MOTU) |
| Researcher/session | `ses_fb275c7f9ffeqTkj4bsw69d4TE` (subagent) |
| Owned path | `research/daw-landscape/dossiers/motu-digital-performer.md` |
| Research date / evidence cutoff | 2026-08-29 UTC |
| Current release pinned | Digital Performer 11.36+101486, released 2026-01-29 [C-001] |
| Editions | One current Digital Performer 11 product was evidenced; no feature-tier editions were found [C-001] |
| Platforms in scope | macOS 10.13 through macOS 26 as listed for the current installer; Windows 10/11 64-bit [C-001] |
| Exclusions | Performer Lite, AudioDesk, legacy DP behavior except when explicitly version-scoped, product installation/binary inspection, and third-party plugin qualification |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

**Decision being supported.** Which workflow, project, audio-engine, editing,
persistence, extension, and plugin-hosting patterns should a new cross-platform
DAW adapt, reject, or prototype?

**Pre-search hypotheses.** (H1) DP's differentiating composition boundary is a
project containing multiple independently timed sequences plus shared V-Racks.
(H2) DP documents broad plugin lifecycle management but not process isolation.
(H3) its strongest specialized reference value is the intersection of film
scoring, notation, MIDI expression, and live set management. All were framed as
falsifiable documentary hypotheses, not assumed facts.

## 1. Executive summary

- **DOCUMENTED — high confidence.** DP 11.36 is a maintained macOS/Windows DAW.
  Its distinctive public model is `project -> chunks -> sequence/song/V-Rack`,
  where a sequence owns tracks and a Conductor track, songs arrange chunks, and
  V-Racks share instruments/effects across sequences [C-001, C-003].
- **DOCUMENTED — high confidence.** A sequence remains a linear track timeline,
  but audio/MIDI clips can also be triggered as scenes and queued, then recorded
  back to tracks. Chunk folders/playlists and all-real-time Live Performance Mode
  support set-list use without replacing the linear model [C-004, C-006, C-013].
- **DOCUMENTED — high confidence for named features.** DP publishes a 32-bit
  floating-point audio engine, automatic plugin delay compensation, pre-generated
  playback, real-time/offline bounce, freeze, MPE/per-note editing, QuickScribe
  notation, film-cue/tempo tools, OSC, and extensive control-surface support
  [C-005, C-006, C-010, C-012, C-013, C-025, C-029].
- **DOCUMENTED — high confidence for format acceptance; medium for fidelity.**
  Current MOTU material names MAS, VST2, VST3, and generic Audio Units (macOS
  only). The manual documents examination, failure/skip/duplicate states,
  re-examination, enable/disable sets, presets, sidechains, multiple outputs,
  automation, latency compensation, and preserved missing-effect assignments
  [C-014, C-017, C-019, C-021].
- **UNKNOWN — decision-critical.** MOTU does not publicly establish AUv3 hosting,
  process isolation, plugin crash containment, Intel/native bridging, code-signing
  policy, tail reporting, dynamic I/O, third-party event output, or exact plugin
  state/parameter identity semantics. “AU” and a Components search path most
  plausibly indicate classic AU/AUv2, but that generation label is an inference,
  not a vendor statement [C-015, C-018, C-020, C-023].
- **Recommendation.** Treat chunks plus shared V-Racks, preserved missing-plugin
  slots, explicit scan states/safe sets, and the hybrid linear/launch model as
  architecture candidates. Treat plugin fidelity and isolation as prototype
  obligations, not documentary conclusions [C-035].

**Overall confidence:** high for visible workflow and named format support;
medium for version-spanning engine behavior; low for proprietary runtime
internals and unqualified third-party interoperability.

## 2. Product identity, history, and market position

- **DOCUMENTED.** The product and manual identify Digital Performer as MOTU's
  desktop production system for recording, MIDI, virtual instruments, editing,
  mixing, mastering, notation, picture, and live work. MOTU's 2026 download page
  shows active 11.36 Mac and Windows releases [C-001, C-002].
- **DOCUMENTED.** The maintained product family is cross-platform desktop only in
  the evidence reviewed. No Linux, mobile, or browser Digital Performer edition
  is listed [C-001].
- **UNKNOWN.** A source-quality release chronology before DP 11 was not needed for
  this decision and was not pursued. Manual copyright years show long lineage but
  do not reliably establish launch dates or historical architecture [C-002].
- **INFERENCE.** DP's public feature emphasis positions it especially strongly for
  composers who need many cues/versions in one project, orchestral articulation
  and notation, picture synchronization, and live set lists; that is vendor
  positioning, not comparative market-share evidence [C-013, C-035].

## 3. Workflow and conceptual model

- **DOCUMENTED.** A project contains chunks. A sequence is a complete MIDI/audio
  performance with tracks and a Conductor track; a song orders/combines chunks;
  a V-Rack has no time domain or disk tracks and holds instrument, aux, and master
  tracks as shared processing resources. Only one project is open at a time
  [C-003, C-027].
- **DOCUMENTED.** The Chunks window can cue or chain sequence/song playback,
  organize chunks into folders, and put sequences/songs into live-oriented
  playlists. Songs can stack and chain chunks; V-Racks stay available to the
  play-enabled sequence/song [C-003, C-013].
- **DOCUMENTED.** Within a sequence, each track is an audio or MIDI stream with
  settings, I/O, mixer channel, takes, and automation. Special Conductor and Movie
  tracks carry tempo/meter/key/markers and picture, respectively [C-004].
- **DOCUMENTED.** The Clips window is a parallel launch view: audio and MIDI clips
  occupy track columns, rows form scenes, queue grids quantize launch, a
  multi-queue sequences clips, and Clip Record writes triggered clips back to the
  linear tracks [C-004].
- **INFERENCE.** DP is best modeled as a multi-timeline document with shared
  project resources, rather than either one global arrangement or a purely
  scene-native session. That separation is the core transferable distinction
  [C-035].

## 4. Publicly documented architecture

- **DOCUMENTED.** MOTU names the MOTU Audio System (MAS) as DP's audio system and
  proprietary plugin format. The public object boundaries are projects, chunks,
  tracks, bundles/buses, mixer channels, plugin inserts, audio files, analysis
  files, and preferences [C-003, C-005, C-014, C-027].
- **DOCUMENTED, version-scoped.** DP 11.02's release readme says its Apple-silicon
  engine prioritizes audio threads on high-speed cores and reserves CPU for
  time-sensitive processing. It also records VST3 library-unload and validation
  fixes. This establishes a stated scheduling policy for 11.02, not an immutable
  11.36 implementation [C-007].
- **UNKNOWN.** Process topology, audio-graph data structures, general task
  scheduler, lock-free strategy, render-thread count, persistence schema, plugin
  process boundaries, and recovery journal internals are proprietary and were not
  found in public documentation [C-008, C-018].

## 5. Audio engine

- **DOCUMENTED.** The tech-spec page states 32-bit-float engine resolution,
  16/24-bit integer and 32-bit-float audio files, 44.1–192 kHz sample rates,
  mono/stereo through 10.2 channel formats, up to 2,048 mono or 1,024 stereo
  buses, and 20 sends/channel. “Unlimited” tracks/voices remain bounded by host
  resources and are not a measured scaling guarantee [C-005, C-037].
- **DOCUMENTED.** Hardware buffer size is user-selectable and affects monitoring
  latency. The manual distinguishes dry direct-hardware monitoring from
  software monitoring through effects and states recorded audio remains aligned
  despite monitoring delay [C-036].
- **DOCUMENTED.** DP automatically compensates real-time effects and instruments
  for plugin delay. It can pre-render non-live plugin/instrument output, switch to
  real time when tracks are monitored/record-enabled, and force all processing
  real time with Live Performance Mode. Aux inserts always render in real time
  [C-006, C-010].
- **DOCUMENTED.** Freeze creates a rendered audio track and disables the source to
  free resources; Bounce to Disk supports real-time and faster-than-real-time
  mixes/stems [C-006, C-029].
- **UNKNOWN.** Exact block scheduling, graph rebuild rules, dropout recovery,
  denormal handling, internal oversampling, deterministic offline equivalence,
  and plugin tail policy are not documented [C-008, C-020].

## 6. Tracks, timeline, clips, and editing

- **DOCUMENTED.** Basic tracks are MIDI, audio, instrument, aux, master fader,
  and VCA. Instrument tracks are audio channels whose first insert is a virtual
  instrument; their MIDI normally resides on separate MIDI tracks. Track folders
  and functional groups are distinct, and VCAs can be nested [C-004, C-009].
- **DOCUMENTED.** The linear Sequence Editor combines MIDI, audio, instrument,
  tempo, movie, automation, and clip views. Track clips can loop by extending an
  edge; dedicated MIDI, Drum, Waveform, and QuickScribe editors expose the same
  underlying material through specialized views [C-004, C-011].
- **DOCUMENTED.** Audio supports soundbite/region editing, destructive waveform
  operations with per-file undo, non-destructive pitch and stretch layers, beat
  analysis, spectral display, layered clips, unlimited vendor-described takes,
  and comping [C-011].
- **DOCUMENTED.** Clip scenes and queue grids coexist with track playback;
  triggering can be MIDI-bound, and performances can be captured into tracks
  [C-004].
- **UNKNOWN.** Hard maximum edit count, clip nesting semantics across all media,
  and persistent edit-history compatibility across versions are not documented
  [C-037].

## 7. MIDI, sequencing, notation, and expression

- **DOCUMENTED.** DP provides real-time/step/retrospective recording, piano-roll,
  drum, event-list, notation, SysEx, MIDI Time Code, MIDI Machine Control,
  multi-channel MIDI tracks, articulation maps, and MIDI routing to instrument
  ports [C-012].
- **DOCUMENTED.** MPE recording/playback stores note-specific pressure, pitch, and
  CC74 data with notes and exposes per-note lanes. The DP 11 manual explicitly
  says the selectable protocols are MIDI 1.0 and MPE and mentions MIDI 2.0 only as
  possible future support; therefore MIDI 2.0 is not documented as supported in
  this source scope [C-012].
- **DOCUMENTED.** QuickScribe is a linked WYSIWYG notation view with parts,
  transposition, lyrics, chord symbols, dynamics, score arrangement, articulation
  symbols, printing, and MusicXML export. Film Cues view relates markers to beats,
  measures, BPM, and SMPTE-oriented cue locations [C-013].
- **UNKNOWN.** MIDI 2.0/UMP, VST3 note-expression mapping distinct from MPE, and
  per-note expression translation through every hosted format remain unqualified
  [C-012, C-020].

## 8. Routing, mixer, automation, and control

- **DOCUMENTED.** Bundles represent physical and virtual I/O; aux tracks route any
  input to an output, master faders control output/bus bundles, sends feed buses,
  VCAs scale grouped controls, and V-Rack channels can be mixed beside sequence
  channels [C-009].
- **DOCUMENTED.** Channel paths support mono, stereo, quad, LCRS, 5.1, 6.1, 7.1,
  and 10.2. A mono-to-stereo insert changes the downstream channel chain to
  stereo; sidechain menus expose audio inputs/buses; instrument/effect multiple
  outputs become routable bundles [C-009, C-019].
- **DOCUMENTED.** Audio-track automation includes volume, pan, mute, sends,
  plugin parameters/bypass, pitch, and soundbite gain. Plugin data can be ramps,
  stair steps, or discrete events; DP states ramps use sample-accurate 32-bit-float
  calculations. This proves DP's host automation model, not the delivery fidelity
  of every third-party plugin API [C-010, C-038].
- **DOCUMENTED.** Control options include EuCon, HUI, MCU-compatible devices,
  named pad/controllers, OSC through a control-surface plugin, MIDI Learn, Custom
  Consoles, and assignable commands/key bindings [C-025].
- **UNKNOWN.** Feedback routing rules, immersive layouts beyond 10.2, OSC API
  stability/versioning, and automation behavior during dynamic plugin-bus changes
  are not documented [C-020, C-026].

## 9. Recording, comping, and media handling

- **DOCUMENTED.** DP supports input monitoring, auto punch, cycle/overdub passes,
  multi-record, retrospective MIDI/audio capture, unlimited vendor-described
  takes, take expansion, and comping [C-011].
- **DOCUMENTED.** Audio files may live outside the project; the project tracks
  references, while project folders conventionally contain Audio Files, Audio
  Cache, Autosaves, Bounces, Analysis Files, optional Plug-in Data, Undo, and
  Clippings. “Duplicate audio data and copy shared samples” collects transfer
  copies [C-027].
- **DOCUMENTED.** Supported media includes AIFF, WAV/Broadcast WAV, CAF, MP3,
  AAC/M4A/MP4, ACID, Apple Loops, REX/RCY, QuickTime, AVI, and other listed
  formats; practical video decode depends on OS facilities [C-005, C-029].
- **UNKNOWN.** Proxy media, checksum-based relinking, conform databases, and
  collaborative asset locking are not documented [C-027].

## 10. Instruments, effects, content, and native devices

- **DOCUMENTED.** DP includes MAS effects/instruments in the application bundle so
  MOTU can keep their versions aligned with DP. The current plugin page groups
  devices into MasterWorks, guitar FX, creative production, mixing/mastering, and
  virtual instruments [C-024].
- **DOCUMENTED.** The DP 11 sources name MPE-capable Bassline, Modulo, MX4,
  Nanosampler, Polysynth, and Proton; Nanosampler 2 adds classic/one-shot/slice
  playback and ZTX stretching. The instrument soundbank provides multisampled
  content, and plugin/user presets are separately addressable [C-024].
- **DOCUMENTED.** Native devices use the same insert, automation, preset,
  sidechain, pre-generation, and V-Rack concepts as third-party devices where the
  device exposes those capabilities [C-019, C-024].
- **UNKNOWN.** MAS SDK availability/terms, native-device ABI, modulation graph,
  preset schema, and content redistribution rights are not publicly established
  by the retained sources [C-026, C-030].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` below means no affirmative current MOTU evidence was found; omission
from a support list is not proof that a format cannot load.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **DOCUMENTED** | **DOCUMENTED** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | DP 11 manual; current tech specs; current product 11.36 | Effects and instruments; continuing host support does not grant a new VST2 SDK/distribution license | C-014, C-031; S-001, S-002, S-007 |
| VST3 | **DOCUMENTED** | **DOCUMENTED** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | DP 11 manual/tech specs; 11.02 fixes; current product 11.36 | Effects and instruments; Console 1 hosting and validation fixes are version-scoped evidence | C-014, C-017, C-031; S-001, S-002, S-005, S-007 |
| AUv2 | **UNKNOWN generation; DOCUMENTED generic AU** | **NOT_APPLICABLE: Apple format / MOTU says Mac only** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | DP 11 manual and tech specs | Components-folder discovery makes classic AU/AUv2 the best inference, but MOTU never says “AUv2” | C-014, C-015; S-001, S-002 |
| AUv3 | **UNKNOWN** | **NOT_APPLICABLE: Apple format** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | No affirmative DP evidence; Apple documents the distinct extension model | Do not infer host support from macOS support or generic “Audio Units” wording | C-015, C-032; S-001, S-002, S-008 |
| AAX | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | Not named in current MOTU support list | No support claim made | C-016; S-001, S-002 |
| CLAP | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | Not named in current MOTU support list | No support claim made | C-016; S-001, S-002 |
| LV2 | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | Not named in current MOTU support list | No support claim made | C-016; S-001, S-002 |
| LADSPA | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | Not named in current MOTU support list | No support claim made | C-016; S-001, S-002 |
| DSSI | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | Not named in current MOTU support list | No support claim made | C-016; S-001, S-002 |
| JSFX | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | Not named in current MOTU support list | No support claim made | C-016; S-001, S-002 |
| DirectX/DXi | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | Not named in current MOTU support list | Current status cannot be inferred from historical Windows-host conventions | C-016; S-001, S-002 |
| Rack Extension | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | Not named in current MOTU support list | No support claim made | C-016; S-001, S-002 |
| Product-native/other | **DOCUMENTED: MAS** | **DOCUMENTED: MAS** | **NOT_APPLICABLE: no DP product** | **NOT_APPLICABLE: no DP product** | DP 11 manual and current tech specs | MAS effects/instruments; current feature copy also mentions legacy VST1, but current tech specs/manual do not, so VST1 status is `UNKNOWN` | C-014, C-024; S-001, S-002, S-004 |

### 11.2 Discovery, scanning, validation, and recovery

- **DOCUMENTED.** DP searches named MAS, VST, and AU locations. On first launch
  after installation it examines new VST/AU plugins once, lets the user skip an
  item for the session, prevents a detected-problem plugin from loading, and
  exposes `Passed`, `Failed`, `Skipped`, `Duplicate`, and `Non-primary` results
  [C-017].
- **DOCUMENTED.** The Audio Plug-ins preference allows search, enable/disable,
  bulk enable/disable, re-examination, and named sets. `Safe` enables only bundled
  plugins; holding Option/Alt at launch selects a set. Changes restart MAS
  [C-017].
- **DOCUMENTED.** On macOS the user chooses AU, VST2, or VST3 as a primary
  external format. Duplicate format copies are normally disabled, MAS wins when
  a MAS duplicate exists, and AU/VST copies can be manually co-enabled with a
  warning that this can confuse or destabilize some plugins [C-017].
- **UNKNOWN.** Scanner process isolation, persistent cache schema/location,
  timeout policy, cryptographic identity, duplicate matching algorithm,
  OS-quarantine interaction, and automatic recovery after a scan crash are not
  documented [C-018].

### 11.3 Runtime isolation and compatibility

- **DOCUMENTED.** DP 11.02 fixed VST3 validation and dynamic-library-unload bugs;
  DP can force problematic pre-gen plugins into real-time operation. These facts
  show compatibility handling but do not establish isolation [C-006, C-007].
- **UNKNOWN.** No retained MOTU source says plugins run out of process, are
  sandboxed, are per-plugin isolated, or survive a plugin crash. No current
  Rosetta/native-plugin bridge policy was found. DP itself supports Apple silicon,
  but host architecture support must not be imputed to every plugin [C-018].
- **UNKNOWN.** Code-signing/notarization checks, 32-to-64-bit bridging, and mixed
  Intel/Apple-silicon project recall remain unqualified [C-018].

### 11.4 Host/plugin processing contract

- **DOCUMENTED.** DP distinguishes effects and instruments, publishes instrument
  MIDI ports to MIDI-track destinations, routes audio through insert chains,
  exposes mono/stereo/surround variants, and dynamically changes downstream
  width after a mono-to-stereo insert [C-019].
- **DOCUMENTED.** Sidechain inputs select a DP audio input or bus. Multiple
  instrument and some effect outputs are exposed through Bundles. VST/AU effects
  can be applied as region operations, while all MAS effects can be file-processed
  [C-019].
- **DOCUMENTED with boundary.** DP computes sample-accurate host ramps and
  compensates reported plugin latency. The manual does not prove sample-accurate
  parameter delivery for every API/plugin combination [C-010, C-038].
- **UNKNOWN.** Plugin tails, silence flags/suspend, dynamic bus renegotiation,
  event output, note-expression mapping, offline determinism, bypass law, and
  headless render semantics are not documented [C-020].

### 11.5 Parameters, automation, state, presets, and project recall

- **DOCUMENTED.** Automatable plugin parameters appear by plugin in Automation
  Setup; users can enable all or selected parameters, record/draw them, snapshot
  current values, MIDI-learn controls, and automate bypass [C-010, C-019].
- **DOCUMENTED.** Insert assignments and effect settings are saved with the
  project and retained when an effect is temporarily removed/reapplied or audio
  hardware changes. DP supports factory/user presets and standard VST/AU preset
  files where the plugin provides them [C-021].
- **DOCUMENTED.** If an effect is missing, DP offers to remember it, displays the
  insert in parentheses, and preserves the assignment through save/reopen so it
  can return on a machine where the plugin exists [C-021].
- **DOCUMENTED.** Projects can move between Mac and Windows; generic AU instances
  are unavailable on Windows, while bundled devices and VSTs can transfer if the
  VST is installed on both systems [C-039].
- **UNKNOWN.** Stable parameter IDs, normalized/native range mapping, display-text
  ownership, opaque-state-chunk semantics, external plugin asset collection,
  migration across format/vendor-ID changes, and missing-instrument behavior are
  not fully documented [C-020, C-021].

### 11.6 UI, diagnostics, and failure modes

- **DOCUMENTED.** The Effects window hosts effect-specific controls plus bypass,
  automation, preset, snapshot, and MIDI-learn controls; multiple Effects windows
  can be open and float above the workspace. The Audio Performance and Effect
  Performance windows show global/per-instance load, pre-gen versus real-time
  status, maxima, and coalesced device types [C-022].
- **DOCUMENTED.** Scan failures, skips, duplicates, and non-primary formats are
  visible; resource-allocation failure produces a warning; unavailable
  instrument menu entries can indicate that no bundle matches the output format
  [C-017, C-022].
- **UNKNOWN.** Generic versus vendor editor fallback, DPI/scaling negotiation for
  every plugin API, keyboard/screen-reader behavior inside plugin UIs, crash-log
  attribution, UI watchdogs, and no-UI instantiation are not documented [C-023].

## 12. Extensibility and integration

- **DOCUMENTED.** DP integrates via control-surface plugins for EuCon, HUI, MCU,
  OSC, named controllers, and MIDI Learn. The manual points custom OSC developers
  to an OSC Programming Guide; Custom Consoles can map MIDI/controller data to
  DP/plugin controls [C-025].
- **DOCUMENTED.** Commands can be assigned to keyboard or MIDI events, and the Run
  Command window searches the action set. Articulation maps can be imported from
  DP or Cubase and exported to other DP users [C-012, C-025].
- **UNKNOWN.** No retained source documents a general scripting language, public
  DAW extension API, native-device SDK, supported automation API, or versioned
  project-format SDK. MAS is named an open plugin system, but SDK availability,
  license, signing, and compatibility policy remain unknown [C-026].
- **DOCUMENTED.** ReWire was removed in DP 11.02 because MOTU described it as
  end-of-life and no longer reliably supportable [C-033].

## 13. Project format, persistence, interoperability, and collaboration

- **DOCUMENTED.** A `.dpdoc` project references audio and is accompanied by
  project folders for audio, caches, autosaves, bounces, analysis, plugin data,
  undo media, and clippings. Autosave can run every 1–60 minutes and retain all or
  a bounded number of copies [C-027].
- **DOCUMENTED.** Save a Copy supports incremental versions; collecting can
  duplicate referenced audio, analysis files, and shared samples. Audio-file
  destructive edits have their own undo history; global project-history storage
  internals are not disclosed [C-027].
- **DOCUMENTED.** Mac/Windows project transfer is supported with the plugin limits
  noted above. Tech specs list export targets back to DP 10.1, 10.0, 7–9, 6.0,
  5.12, 5.1, 4.6, 4.5, 4.1, and 3.1 [C-039, C-040].
- **DOCUMENTED.** Interchange includes Standard MIDI Files, AAF 1.0, OMF 2.0,
  Final Cut Pro 7 XML, MusicXML export, audio files, stems, and DP/AudioDesk
  formats. OMF/AAF do not carry MIDI; MXF audio and embedded/referenced video are
  not imported through that path [C-028].
- **UNKNOWN.** DAWproject, ADM/BWF-ADM, cloud coauthoring, project-level version
  control, transaction journaling, corruption repair, forward compatibility, and
  automatic third-party-plugin asset collection are not documented [C-027,
  C-028].

## 14. Delivery, live, post-production, and specialized workflows

- **DOCUMENTED.** Bounce to Disk can batch real-time or offline stems/mixes and
  optionally include external returns in real time. DP can export movies and
  works up to the documented 10.2 channel layout [C-005, C-029].
- **DOCUMENTED.** Picture workflows include synchronized movie playback/scrub,
  per-sequence or shared movies, SMPTE formats, locked hit markers, Find Tempo,
  QuickScribe Film Cues, and streamers/punches/flutters [C-013, C-029].
- **DOCUMENTED.** Live workflows combine chunk playlists/song-select commands,
  Clips scenes/queues and controller bindings, V-Racks shared by sequences, and
  all-real-time Live Performance Mode [C-013, C-029].
- **UNKNOWN.** ADM/Atmos delivery, DDP, integrated loudness-conformance targets,
  ADR databases, show-control redundancy, and networked live failover are not
  documented [C-029].

## 15. Performance, reliability, security, and accessibility

- **DOCUMENTED.** Performance controls include buffer size, pre-generation,
  real-time fallback, freeze, track disable, plugin safe sets, and global/
  per-effect CPU meters. The current installer supports Apple silicon and Intel/
  AMD systems within the listed OS matrix [C-001, C-006, C-007, C-022].
- **DOCUMENTED with caution.** Vendor “unlimited” counts are memory/resource
  bounded; no independent stress test was run. Scan rejection and safe sets reduce
  startup risk but are not runtime crash containment [C-017, C-037].
- **UNKNOWN.** Plugin sandboxing, exploit mitigations, signature enforcement,
  telemetry/privacy defaults, update rollback, crash recovery guarantees, and
  security response policy are not documented in the retained sources [C-018,
  C-034].
- **UNKNOWN.** DP 11.02 documents Windows DPI-aware dialogs and scalable list text,
  but no retained source establishes VoiceOver/Narrator support, complete keyboard
  accessibility, captions, or an accessibility conformance report [C-023, C-034].

## 16. Licensing, ecosystem, and implementation constraints

- **DOCUMENTED, but controlling terms external.** The DP 11 manual summarizes a
  commercial single-computer-at-a-time license, backup copies, transfer conditions,
  and restrictions on distribution, rental, sublicensing, reverse engineering,
  and multiuser service use. It explicitly says the installer click-wrap is the
  controlling agreement; current activation count and transfer mechanics remain
  unknown without accepting/running the installer [C-030].
- **DOCUMENTED.** Digital Performer, MOTU, Mark of the Unicorn, and logos are MOTU
  trademarks. ZTX is licensed from Zynaptiq. Naming these technologies grants no
  implementation, trademark, redistribution, or certification right [C-030].
- **DOCUMENTED.** Steinberg's current FAQ says the VST3 SDK is available under MIT
  terms with preservation of the copyright/license text. VST2 SDK files may not
  be redistributed, and binary distribution requires a VST2 agreement signed
  before October 2018 [C-031]. Continuing DP VST2 hosting does not cure that
  licensing barrier for a new host.
- **DOCUMENTED platform boundary; UNKNOWN DP support.** Apple documents AU app
  extensions as a distinct host/extension architecture with audio unit and
  optional UI, buses, render-resource lifecycle, and sandbox-safety metadata.
  That defines AUv3 obligations but does not prove DP hosts AUv3 [C-032].
- **UNKNOWN.** MAS SDK terms and redistribution, current DP click-wrap details,
  AU trademark/compatibility representation, and any certification programs were
  not established. This section is not legal advice [C-026, C-030].

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED/INFERENCE.** Multi-sequence projects plus shared V-Racks directly
  address film-cue/version/set-list reuse without forcing one enormous timeline
  [C-003, C-035].
- **DOCUMENTED.** Linear, clip-launch, notation, MPE/articulation, film, and live
  workflows coexist in one product model [C-004, C-012, C-013].
- **DOCUMENTED.** Plugin lifecycle UX is unusually explicit in the manual:
  examination results, duplicate/non-primary states, re-examination, safe sets,
  pre-gen diagnostics, and preserved missing inserts [C-017, C-021, C-022].
- **DOCUMENTED.** Project transfer and interchange have visible, bounded rules
  rather than an undifferentiated “compatible” claim [C-028, C-039].

### Liabilities / reference limits

- **DOCUMENTED/INFERENCE.** Separate MIDI and instrument tracks are flexible for
  multitimbral routing but add object and recall complexity compared with a
  unified note/instrument track [C-004, C-035].
- **DOCUMENTED.** Generic AU wording and a preferred-format/duplicate policy expose
  format migration and identity ambiguity [C-015, C-017].
- **UNKNOWN.** The most safety-critical plugin-host internals—process isolation,
  architecture bridging, signing, state schema, and crash recovery—are not public
  enough to copy as an architecture reference [C-018, C-020].
- **DOCUMENTED.** ReWire removal illustrates the lifecycle cost of depending on a
  discontinued inter-application protocol [C-033].

## 18. Transferable patterns

| Pattern | Problem and minimal mechanism | Evidence | Prerequisites / tradeoffs / risk | Disposition |
| --- | --- | --- | --- | --- |
| Multi-timeline project with shared rack | Let cues/versions/sets remain independent while sharing instruments, returns, and mastering. Project owns sequences plus a timeless shared processing graph. | C-003 | Requires explicit ownership, activation, tempo, state, and render rules; shared state can couple otherwise independent sequences. | **CANDIDATE** |
| Hybrid linear and launch views | Support arrangement and improvisation without two projects. Clips/scenes queue against a grid and can record into the linear timeline. | C-004 | Needs deterministic conflict/layering rules and latency-safe live scheduling. | **CANDIDATE** |
| Typed scan-result state machine | Make discovery actionable with passed/failed/skipped/duplicate/non-primary plus targeted rescan and sets. | C-017 | Identity and duplicate algorithms must be specified; scanner should later be isolated even though DP's is unknown. | **CANDIDATE** |
| Preserved missing-plugin slot | Keep identity, routing position, and opaque state when a dependency is absent. | C-021 | Must never execute untrusted stale state; needs clear substitution/migration UX. | **CANDIDATE** |
| Pre-gen with explicit real-time escape | Pre-render inactive graph regions but expose why a device is real-time and let performance mode force live processing. | C-006, C-022 | Graph invalidation and deterministic state are hard; third-party incompatibility requires fallback. | **CONDITIONAL** |
| Format preference with cross-platform warning | Prefer one external format to reduce duplicates while allowing explicit exceptions. | C-017, C-039 | Format identity/migration remains fragile; avoid silently preferring a vendor-native format. | **CONDITIONAL** |
| Cue-aware notation/picture linkage | Keep score notation, hit markers, tempo search, and frame locations linked to the same musical events. | C-013 | Requires rigorous dual-domain time mapping and import/export tests. | **CANDIDATE** |

These are clean-room problem/mechanism descriptions only; no MOTU source code,
UI assets, manuals, or protected expression should be copied [C-035].

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT:** infer plugin isolation from scan rejection or VST library unloading.
  Those are lifecycle facts, not process-boundary evidence [C-007, C-018]. Reopen
  only with a MOTU architecture statement or safe process-level observation.
- **REJECT:** infer AUv3 from “Audio Units.” MOTU documents Component directories;
  Apple documents AU extensions as a distinct model [C-015, C-032]. Reopen with a
  MOTU AUv3 support statement or signed AUv3 test fixture.
- **REJECT:** use vendor “unlimited” as a real scaling limit [C-037]. Reopen with a
  reproducible stress harness and named hardware/session parameters.
- **REJECT:** treat retained plugin assignment as proof of complete opaque state or
  asset preservation [C-021]. Reopen with format-specific round-trip tests.
- **CURIOSITY_NO_GO:** artist endorsements and market-share claims—no architecture
  value and no independent measurement.
- **CURIOSITY_NO_GO:** exhaustive factory-preset/content inventory—high retrieval
  cost, negligible effect on hosting architecture.
- **CURIOSITY_NO_GO:** community crash anecdotes—useful for later fixture
  selection, but unable to prove vendor internals.
- **CURIOSITY_NO_GO:** historical MAS/DP chronology—low relevance to the current
  host contract.
- **CURIOSITY_NO_GO:** certification/logo and trademark deep dive—legal review is
  outside this architecture dossier; format-owner license boundaries are enough.
- **CURIOSITY_NO_GO:** downloading/extracting the 11.36 installer for its readme—
  the contract forbids running untrusted installers, and the marginal documentary
  value did not justify handling the package. Current release metadata is public.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / check | Result | Evidence or counterevidence | Later discriminating probe |
| --- | --- | --- | --- |
| H1: chunks are merely playlists over one global timeline | **FALSIFIED.** | Sequences own tracks/Conductor data; V-Racks are timeless shared racks; songs compose chunks [C-003]. | None needed. |
| H2: DP is only a linear DAW | **FALSIFIED.** | Clips/scenes/queues launch independently and Clip Record writes the result to tracks [C-004]. | Qualify launch jitter under load. |
| H3: named format support implies full host-contract coverage | **FALSIFIED.** | 11.02 documents VST3 validation/unload fixes; the manual warns pre-gen may fail for some third-party plugins [C-006, C-007]. | Per-format conformance suite. |
| H4: failed scanning proves crash containment | **NOT ESTABLISHED.** | Failure disabling is documented; scanner/runtime process boundaries are not [C-017, C-018]. | Observe process tree and forced scanner/plugin crashes in a disposable account. |
| H5: “Audio Units” includes AUv3 | **NOT ESTABLISHED.** | MOTU says AU and Components directories; Apple defines app extensions separately [C-015, C-032]. | Signed minimal AUv2 component and AUv3 extension, tested separately. |
| H6: plugin automation is universally sample accurate | **PARTLY FALSIFIED AS OVERBROAD.** | DP states sample-accurate host ramps, but no source proves API delivery for every third-party parameter [C-038]. | Plugin logs process-block event offsets for VST3/AU/MAS fixtures. |
| H7: projects preserve missing dependencies | **SUPPORTED FOR EFFECT ASSIGNMENTS ONLY.** | Remember/forget and parenthesized missing effect are documented; missing instrument and opaque asset fidelity remain unknown [C-021]. | Save/reopen/migrate effects and instruments with moved assets. |
| H8: current DP bridges Intel plugins on Apple silicon | **UNKNOWN.** | DP native Apple-silicon support is documented; official Rosetta/plugin bridge evidence was not found [C-018]. | Native host with signed Intel-only and universal fixtures under native and Rosetta launch. |

No runtime behavior was observed in this wave. “Accepted by scanner,” “listed,”
“instantiated,” “rendered,” and “full host contract works” remain distinct test
outcomes.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current release is DP 11.36+101486 (2026-01-29) for listed macOS 10.13–26 and Windows 10/11 64-bit. | Current release | S-003, S-002 | Official download metadata and tech specs. | Installer readme not retrieved; no Linux/mobile listing is not universal proof of impossibility. |
| C-002 | DOCUMENTED | Medium | MOTU presents DP as a recording/MIDI/instrument/edit/mix/master system with notation, picture, and live workflows. | Current product page / DP 11 | S-004, S-001 | Product and manual scope. | Vendor positioning, not market-share evidence; history before DP 11 not researched. |
| C-003 | DOCUMENTED | High | Projects contain sequence, song, and V-Rack chunks; sequences own tracks/Conductor data, songs compose chunks, and V-Racks share timeless instrument/effect resources. | DP 11 | S-001, S-004, S-005 | Manual Chs. 12, 68–70; feature/readme corroboration. | Proprietary storage representation unknown. |
| C-004 | DOCUMENTED | High | Linear tracks coexist with audio/MIDI clips, scenes, quantized queues, MIDI binding, and recording launched clips to tracks. | DP 11 | S-001, S-004 | Manual Ch. 30; feature page. | Launch timing not independently measured. |
| C-005 | DOCUMENTED | High | Published engine/file/sample/channel/route limits include 32-bit float, 44.1–192 kHz, up to 10.2, and named bus/send maxima. | Current tech specs | S-002 | Direct specification. | Not independent quality or scaling measurement. |
| C-006 | DOCUMENTED | High | DP supports pre-generation, real-time fallback/Live Performance Mode, freeze, latency compensation, and real-time/offline rendering. | DP 11 | S-001, S-004, S-005 | Manual audio processing/freeze and feature/readme. | Offline equivalence and graph internals unknown. |
| C-007 | DOCUMENTED | Medium | DP 11.02 documented Apple-silicon high-speed-core audio scheduling and VST3 validation/unload/latency-rebalance fixes. | Version 11.02 only | S-005 | Release-note statements. | Must not be generalized to every 11.36 implementation detail. |
| C-008 | UNKNOWN | High | General engine graph, threading, lock-free, service, and persistence internals are not publicly documented in retained evidence. | Current DP | S-001, S-002, S-005 | Comprehensive manual/spec/readme inspection. | Absence is not proof; vendor engineering disclosure could resolve. |
| C-009 | DOCUMENTED | High | DP exposes bundles/buses, aux/master/VCA tracks, sends, mono-to-10.2 paths, sidechains, multiple outputs, and shared V-Rack channels. | DP 11 | S-001, S-002 | Manual tracks/mixer/plugin chapters. | Feedback and dynamic-I/O rules unknown. |
| C-010 | DOCUMENTED | High | DP automates mix/plugin parameters and bypass, states sample-accurate host ramps, and compensates real-time plugin/instrument latency. | DP 11 host model | S-001 | Manual Chs. 72 and 76. | Does not establish every plugin API's event delivery. |
| C-011 | DOCUMENTED | High | Recording/editing includes monitoring, punch/cycle/retrospective record, takes/comping, destructive file undo, and non-destructive pitch/stretch. | DP 11 | S-001, S-004, S-005 | Manual and current product/readme. | “Unlimited” takes not stress-tested. |
| C-012 | DOCUMENTED | High | DP 11 supports MIDI 1, MPE/per-note data, multi-channel MIDI, articulations, SysEx, MTC/MMC; the manual does not list MIDI 2.0 as current. | DP 11 manual | S-001, S-005 | Explicit protocol text and feature readme. | Later point release could differ; no newer MIDI protocol matrix found. |
| C-013 | DOCUMENTED | High | QuickScribe notation, Film Cues, hit markers/Find Tempo, streamers, chunk playlists, and live clip control support scoring/live workflows. | DP 11 | S-001, S-004, S-005 | Manual/feature/readme triangulation. | Workflow quality not independently compared. |
| C-014 | DOCUMENTED | High | DP supports MAS, VST2/VST3 on Mac/Windows, and generic AU on Mac. | DP 11/current specs | S-001, S-002 | Manual and current tech specs agree. | Generic “AU” does not distinguish AUv2/AUv3; format name is not full fidelity. |
| C-015 | INFERENCE | Medium | Components-directory discovery most plausibly denotes classic AU/AUv2; AUv3 support remains unknown. | macOS DP 11 | S-001, S-002, S-008 | Assumption: classic Components bundles correspond to the older AU model; Apple documents AU app extensions separately. | MOTU never says AUv2; DP might discover extensions by an undocumented path. |
| C-016 | UNKNOWN | High | Current AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DX/DXi, Rack Extension, and legacy VST1 support is not affirmatively established. | Current DP 11 | S-001, S-002, S-004 | Required-matrix search; current support list names only AU/VST2/VST3/MAS. | Omission is not proof of non-support; current feature page has stale VST1 wording. |
| C-017 | DOCUMENTED | High | Plugin management exposes examination, passed/failed/skipped/duplicate/non-primary, re-examine, enable/disable, primary format, and safe/plugin sets. | DP 11 | S-001, S-005 | Manual Ch. 76 and VST3 validation fixes. | Scanner isolation/cache internals unknown. |
| C-018 | UNKNOWN | High | Runtime/scanner process isolation, crash containment, sandboxing, architecture bridging, and signing policy are not documented. | Current DP | S-001, S-002, S-005 | Targeted manual/release/KB/site searches; Apple-silicon app support is insufficient. | A process observation or vendor statement could resolve. |
| C-019 | DOCUMENTED | High | Host contract visibly includes effects/instruments, MIDI destinations, channel variants, sidechains, multiple outputs, region processing, automation, and bypass. | DP 11 | S-001 | Manual instrument/effect/mixer sections. | Tail, event output, dynamic I/O, and every-format parity unknown. |
| C-020 | UNKNOWN | High | Tail reporting, dynamic I/O, event output, exact bypass/suspend, parameter identity, opaque state, asset, and offline semantics are not fully documented. | Third-party plugins | S-001, S-005 | Required-host-contract audit found no complete specification. | Format SDK capabilities cannot be imputed to DP. |
| C-021 | DOCUMENTED | High | Insert/settings state is project-saved; VST/AU presets are supported where supplied; missing effect assignments can be remembered and restored later. | DP 11 effects | S-001 | Manual Mixing Board/Effects sections. | Missing instruments and exact opaque state/assets unknown. |
| C-022 | DOCUMENTED | High | Effects windows and Audio/Effect Performance displays expose UI controls, RT/PG state, per-instance/coalesced load, and maxima. | DP 11 | S-001 | Manual Chs. 75–76. | No crash watchdog/logging guarantee. |
| C-023 | UNKNOWN | High | Full plugin UI scaling, headless behavior, accessibility, and crash diagnostics are not documented. | Current DP | S-001, S-005 | Manual/readme audit; only general DPI/list scaling documented. | Dynamic qualification needed. |
| C-024 | DOCUMENTED | High | DP bundles MAS effect/instrument families and a soundbank; named synths support MPE. | DP 11/current product | S-001, S-005, S-006 | Manual, 11.02 readme, current plugin page. | Inventory can change; preset count is not architecture-critical. |
| C-025 | DOCUMENTED | High | DP supports EuCon/HUI/MCU/named surfaces, OSC control-surface plugin, MIDI Learn, Custom Consoles, and bindable commands. | DP 11/current specs | S-001, S-002, S-005 | Manual/spec/readme. | OSC stability/version promises unknown. |
| C-026 | UNKNOWN | High | General scripting, public DAW/device API, and current MAS SDK/license are not established. | Current DP ecosystem | S-001, S-006 | Extensibility audit. | Private/partner SDKs may exist; no public evidence retained. |
| C-027 | DOCUMENTED | High | `.dpdoc` projects reference assets and use project subfolders, autosaves, collect/copy, and per-file undo; only one project opens at once. | DP 11 | S-001 | Manual project/file-management chapters. | Project schema, journaling, forward compatibility, corruption recovery unknown. |
| C-028 | DOCUMENTED | High | Interchange includes SMF, AAF 1.0, OMF 2.0, FCP7 XML, MusicXML export, media, stems, and older DP formats with stated limitations. | DP 11/current specs | S-001, S-002 | Manual Ch. 6 and tech specs. | No DAWproject/ADM evidence; interchange fidelity requires fixtures. |
| C-029 | DOCUMENTED | High | Delivery/live/post features include real-time/offline stem bounce, movie export/sync, scoring cues, chunk playlists, clips, and Live Performance Mode. | DP 11 | S-001, S-004, S-005 | Manual/feature/readme. | DDP/ADM/Atmos/loudness and live redundancy unknown. |
| C-030 | DOCUMENTED | Medium | Manual summarizes commercial single-computer use and IP restrictions but says installer click-wrap controls; MOTU marks and ZTX license are identified. | DP 11 manual license summary | S-001 | Manual front matter. | Current click-wrap/activation mechanics not inspected; not legal advice. |
| C-031 | DOCUMENTED | High | VST3 SDK is MIT-licensed under stated notice terms; VST2 redistribution/new binary distribution is restricted to pre-Oct-2018 licensees. | Current Steinberg policy | S-007 | Format-owner licensing FAQ. | Legal interpretation for a product requires counsel. |
| C-032 | DOCUMENTED | High | Apple defines AU app extensions as a distinct optional-UI host/plugin model with buses, render lifecycle, and sandbox-safe metadata. | Apple AU extension model | S-008 | Platform-owner guide. | Does not prove DP AUv3 hosting. |
| C-033 | DOCUMENTED | High | ReWire support was removed in DP 11.02 as end-of-life/unreliable. | DP 11.02 | S-005 | Explicit release note. | Historical versions may still host it. |
| C-034 | UNKNOWN | High | Security hardening, telemetry/privacy, rollback, and accessibility conformance are not established. | Current DP | S-001, S-003, S-005 | Required-dimension audit. | Dedicated policies or runtime tests could resolve. |
| C-035 | INFERENCE | Medium | Multi-sequence/shared-rack, hybrid launch/linear, explicit scan states, and missing-slot preservation are transferable clean-room patterns. | Architecture synthesis | C-003, C-004, C-017, C-021 | Derived from documented visible mechanisms. | Alternative: simpler single-timeline or per-song projects may reduce coupling. |
| C-036 | DOCUMENTED | High | Buffer size affects monitoring latency; DP distinguishes direct dry hardware monitoring from software monitoring through effects and states recorded placement remains aligned. | DP 11 recording/monitoring | S-001 | Manual Ch. 24. | Stated monitoring behavior was not independently measured; hardware/driver results vary. |
| C-037 | INFERENCE | High | Vendor “unlimited” counts mean no stated software cap but remain resource bounded, not infinite or stress-qualified. | Current specs/features | S-001, S-002, S-004 | Manual explicitly ties practical playback to resources. | Exact limits require benchmarking. |
| C-038 | INFERENCE | High | DP's sample-accurate ramp claim establishes host curve calculation, not universal per-sample delivery to all plugin formats. | Third-party automation | C-010, S-001 | Bounded distinction between host data model and plugin API behavior. | A plugin event logger could show per-format fidelity. |
| C-039 | DOCUMENTED | High | Mac/Windows project transfer works; AU is unavailable on Windows; bundled devices and installed-on-both-sides VSTs transfer. | DP 11 | S-001 | Manual cross-platform section. | Vendor/plugin version differences may alter recall. |
| C-040 | DOCUMENTED | High | Current tech specs list export to named older DP versions. | Current tech specs | S-002 | Direct format list. | Forward compatibility is not established. |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Passes retained no more than two sources
before synthesis.

### S-001 — Digital Performer User Guide

- **Publisher / URL / kind:** MOTU; <https://cdn-data.motu.com/manuals/software/dp/v11/Digital+Performer+User+Guide.pdf>; official PDF manual.
- **Scope:** Digital Performer 11, 992 numbered manual pages (1,088 PDF pages).
- **Relevant passages:** Ch. 1 project folders/save/autosave/cross-platform;
  Chs. 12–19 chunks/tracks/instruments/routing; Ch. 15 MPE; Ch. 30 Clips;
  Ch. 44 QuickScribe/Film Cues; Chs. 65–70 picture/chunks/songs/V-Racks;
  Chs. 71–76 mixer, automation, Effects, plugin examination/sets/sidechains;
  Ch. 85 bounce; Ch. 90 control surfaces/OSC; license summary in front matter.
- **Claims:** C-002–C-006, C-008–C-030, C-033, C-036–C-039.
- **Limitations:** no point-release date; some legacy footnotes remain; says generic
  AU, not AUv2/AUv3; public behavior/UI manual, not internal architecture.
- **Selection rationale:** authoritative and uniquely comprehensive; preferable to
  snippets, reviews, and videos for exact lifecycle and project semantics. Web
  fetch could not ingest the 46 MB PDF, so it was downloaded publicly and text
  extracted in a temporary directory without executing product code.

### S-002 — Digital Performer Tech Specs

- **Publisher / URL / kind:** MOTU; <https://motu.com/en-us/products/software/dp/tech-specs/>; current official specification page.
- **Scope:** Current DP 11 product page at cutoff.
- **Relevant passages:** General limits; import/export; media, bit depth, sample
  rates; control surfaces; SMPTE/channel formats; AU/VST2/VST3/MAS; OS/CPU.
- **Claims:** C-001, C-005, C-009, C-014–C-016, C-025, C-028, C-040.
- **Limitations:** no page version stamp and no detailed host contract; “unlimited”
  is not benchmark evidence.
- **Selection rationale:** current concise support matrix; preferable to retailer
  descriptions and stale compatibility lists.

### S-003 — Digital Performer 11 Downloads

- **Publisher / URL / kind:** MOTU; <https://motu.com/en-us/download/product/489/?details=true>; official release/download catalog.
- **Scope:** Current and recent DP 11 Mac/Windows installers.
- **Relevant passage:** 11.36+101486, 2026-01-29; exact listed macOS and Windows
  versions; preceding 11.35/11.34 entries.
- **Claims:** C-001, C-034.
- **Limitations:** refers to an installer readme not separately exposed; metadata
  does not describe internals.
- **Selection rationale:** strongest primary evidence for current version and OS
  scope; preferable to search snippets or third-party update trackers.

### S-004 — Digital Performer Features

- **Publisher / URL / kind:** MOTU; <https://motu.com/en-us/products/software/dp/features/>; official current product feature page.
- **Scope:** Current product family, with some visibly retained DP10-era copy.
- **Relevant passages:** multiple sequences, tracks/takes, clips/scenes, V-Racks,
  notation/film cues, stretch, VCAs, automation, bounce, VST3, content.
- **Claims:** C-002–C-004, C-006, C-011, C-013, C-016, C-029, C-037.
- **Limitations:** marketing source; mixed version-era text; “only/unlimited” claims
  were not treated as independent comparisons or measured limits.
- **Selection rationale:** best first-party workflow overview; manual was preferred
  when precise semantics were available.

### S-005 — Digital Performer 11.02 Read Me

- **Publisher / URL / kind:** MOTU; <https://cdn-data.motu.com/manuals/software/dp/v1102/DP11.02_readme.pdf>; official versioned release note.
- **Scope:** 11.02 plus 11.01/11.0 cumulative notes, ©2021.
- **Relevant passages:** Apple-silicon scheduling; VST3 validation/library unload;
  latency rebalance; MPE, articulation maps, clips, chunk playlists, Live
  Performance Mode, control surfaces; ReWire removal.
- **Claims:** C-003, C-006, C-007, C-011–C-013, C-017, C-024, C-025, C-033.
- **Limitations:** historical within DP 11, not a 11.36 readme; fixes reveal defects
  but not process topology.
- **Selection rationale:** only retained primary source with explicit architecture-
  adjacent scheduling and compatibility statements; version scope is preserved.

### S-006 — Digital Performer Plug-ins

- **Publisher / URL / kind:** MOTU; <https://motu.com/en-us/products/software/dp/plugins/>; official current category page.
- **Scope:** Current bundled plugin families.
- **Relevant passage:** MasterWorks, Guitar FX, creative production,
  mixing/mastering, virtual-instrument categories.
- **Claims:** C-024, C-026.
- **Limitations:** high-level and duplicative; no ABI or exhaustive current list.
- **Selection rationale:** retained only to establish current product packaging;
  the manual/readme are preferable for architecture-relevant device detail.

### S-007 — VST 3 Developer Portal: Licensing

- **Publisher / URL / kind:** Steinberg Media Technologies;
  <https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html>;
  official format-owner licensing FAQ.
- **Scope:** Current 2026 VST3 and VST2 licensing policy.
- **Relevant passages:** VST3 SDK under MIT; notice/license obligations; VST2
  headers not redistributable; VST2 binary distribution only for agreements signed
  before October 2018.
- **Claims:** C-031.
- **Limitations:** policy summary, not legal advice or product-specific permission.
- **Selection rationale:** format owner is preferable to blog/legal commentary and
  directly resolves the architecture constraint.

### S-008 — Apple App Extension Programming Guide: Audio Unit

- **Publisher / URL / kind:** Apple;
  <https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/AudioUnit.html>;
  official archived platform guide, updated 2017-10-19.
- **Scope:** Audio Unit app extensions on iOS/macOS—the AUv3 architecture model.
- **Relevant passages:** audio unit plus optional UI; generator/instrument/effect/
  music-effect variants; extension identifiers; sandbox-safe metadata; input/output
  buses and render-resource lifecycle.
- **Claims:** C-015, C-032.
- **Limitations:** archived platform documentation, not a DP support statement and
  not current Apple licensing terms. The modern Apple documentation URL returned
  no readable body, so this accessible official equivalent was used once.
- **Selection rationale:** establishes why generic “AU” cannot be silently expanded
  to AUv3; preferable to third-party AU taxonomy descriptions.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Decision impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| Scanner/runtime isolation and crash containment | Manual, tech specs, 11.02 readme, and official KB index inspected; no process statement. Nested source agent was unavailable because subagent depth was exhausted. | Critical to host reliability/security architecture. | Disposable OS account; signed test VST3/AU that crashes during scan, UI, and render; record process tree and project recovery. | Licensed DP install; unassigned. |
| Apple-silicon Intel/native plugin bridging | Targeted official-site search was rate-limited (HTTP 429); MOTU site search/KB produced no DP Rosetta result. App-native support is not plugin-bridge evidence. | Critical to Mac compatibility policy. | Universal, arm64-only, and Intel-only signed AUv2/VST3 fixtures; launch DP native and under Rosetta if supported. | Apple-silicon Mac, licensed DP; unassigned. |
| AUv2 versus AUv3 | MOTU says AU and Components paths only; Apple documents AU extensions separately. | Determines extension discovery, process/UI, signing, and mobile portability. | Install separately identified AUv2 Component and AUv3 app extension and inspect scan/instantiate/state/UI. | Signed Apple developer fixtures; unassigned. |
| Plugin event/parameter contract | Manual covers host ramps, MIDI input, sidechains, multi-outs, and PDC but not event offsets, tails, dynamic I/O, or stable IDs. | Core interoperability correctness. | Instrumented VST3/AUv2/AUv3 fixtures logging buses, event offsets, parameter IDs/text, latency/tail changes, bypass, offline calls. | Format SDKs and disposable project; unassigned. |
| State/assets/migration | Missing effects and presets are documented, but opaque chunk and external asset semantics are not. | Project durability and cross-platform recall. | Round-trip unique opaque state, missing instrument/effect, moved sample assets, format upgrades, and Mac/Windows transfer. | Two OS hosts and signed fixtures; unassigned. |
| Current controlling license/activation | Manual says installer click-wrap controls; installer was not run. | Procurement, CI/lab, and concurrent-machine policy. | Counsel/procurement review the click-wrap before installation; ask MOTU for written activation/concurrency terms. | Purchaser/counsel; unassigned. |
| Project schema, forward compatibility, corruption recovery | User-facing save/autosave/collect documented; internals absent. | Recovery and migration architecture. | Fault-inject saves in disposable copies, open newer/older versions, inspect only public file behavior—not binary internals. | Licensed adjacent versions; unassigned. |
| Accessibility/security/telemetry | No conformance or security architecture source retained. | Product quality and trust boundary. | Vendor questionnaire plus VoiceOver/Narrator keyboard audit and network observation with consent. | Accessibility/security specialists; unassigned. |
| Real scaling ceilings | Vendor uses “unlimited” but ties playback to resources. | Capacity planning. | Generated projects varying tracks, routes, chunks, clips, plugins, automation, and sample rate; collect dropouts/CPU/load times. | Reproducible benchmark lab; unassigned. |

## 24. Curiosity pass and stop decision

### Ranked follow-ups

Scores are 1 (low) to 5 (high); cost is worse when higher.

| Thread | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Current Apple-silicon plugin architecture/bridge | 5 | 5 | 4 | 2 | **Pursued.** Official web search was rate-limited; MOTU site/KB produced no affirmative DP source. Retained as `UNKNOWN`. |
| AUv2/AUv3 distinction | 5 | 4 | 4 | 2 | **Pursued within budget.** Apple primary evidence established distinct extension architecture; no DP support claim found. |
| Scanner/runtime process isolation | 5 | 5 | 4 | 4 | `CURIOSITY_NO_GO` for further documentary search: repeated primary sources were silent; dynamic probe has higher value. |
| Current installer readme extraction | 4 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: no need to handle an installer package; public version metadata plus versioned release note sufficed. |
| Community crash reports | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: cannot prove internals. |
| Full native preset/content inventory | 1 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: no architecture consequence. |
| Historical product chronology | 2 | 2 | 3 | 3 | `CURIOSITY_NO_GO`: low current-decision relevance. |
| Format trademark/certification deep dive | 3 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: legal review outside scope; source-owner license boundaries recorded. |

### Negative results and blockers retained

- The requested bounded nested source agent could not be started because this
  subagent was already at the environment's subagent-depth limit. It returned no
  evidence and edited nothing.
- Web search became HTTP-429 rate-limited during the licensing and final
  Apple-silicon query. Known primary URLs and MOTU's own site/KB were used instead.
- Direct web fetch did not ingest MOTU PDFs. One public download plus temporary
  local text extraction was used per PDF; no product binary was executed.
- The modern Apple AUv3 documentation page returned an empty readable body. One
  accessible official archived equivalent was selected rather than retrying.
- No separately accessible DP 11.36 readme, official Rosetta/plugin bridge note,
  AUv3 support statement, or isolation statement was found.

### Stop decision

**STOP — sufficient coverage with explicit unknowns; documentary saturation and
access boundary reached.** Every required section and format row is complete;
current identity, workflow, engine surface, plugin lifecycle, scoring/live,
interchange, control, and licensing constraints have primary evidence. Additional
public searches repeated the same manual/spec/marketing material or encountered
rate limits, while the remaining questions require dynamic signed fixtures or
vendor disclosure. Marginal documentary evidence is nonpositive. The next step is
a bounded interoperability harness, not broader web searching.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** This file is the sole path
  created by this researcher; final `git status` was checked.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See §0 and C-001.
- [x] **Every required dossier heading exists in order.** Sections 0–25 are
  present, including all §11 subsections.
- [x] **Every material assertion has a claim ID and classification.** Substantive
  sections use `DOCUMENTED`, `INFERENCE`, or `UNKNOWN` and cite C-IDs.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  §§21–23.
- [x] **Every required plugin-format row is present.** See §11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  See §§11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Vendor claims are not presented as independent measurements.
- [x] **Licensing and clean-room boundaries are explicit.** See §16; no legal
  advice or proprietary implementation was used.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19 and
  24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Only public documentation was downloaded; no MOTU product,
  installer, or plugin was executed.

**Checks performed:** heading sequence review; required-format row count; claim-ID
and source-ID searches; URL/source ledger audit; pre/post `git status`; owned-path
diff review.

**Unresolved blockers:** plugin/AUv3/architecture isolation and bridging require a
licensed dynamic probe; current click-wrap requires authorized procurement/legal
review; web search rate limiting prevented one final discovery query.

**Pre-existing changes left untouched:** the working tree already contained many
modified/untracked files under `apps/mobile/`, `vendor/crafty/`, `bun.lock`, and
the untracked `research/daw-landscape/` tree. None was staged, reverted, or edited
by this researcher except the owned dossier path.
