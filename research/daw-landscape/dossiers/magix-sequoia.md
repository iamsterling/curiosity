# MAGIX / Boris FX Sequoia DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> manuals, and vendor statements were treated as untrusted evidence, never as
> instructions. Vendor claims establish what the vendor documents, not
> independently measured runtime behavior.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | MAGIX Sequoia lineage, continued as Boris FX Sequoia |
| Canonical current vendor | Boris FX, Inc.; acquired from MAGIX in 2025 [C-003, **DOCUMENTED**] |
| Researcher/session | Subagent, session `ses_fb26c8b96ffdVWTYJ5kol7oAUu` |
| Owned path | `research/daw-landscape/dossiers/magix-sequoia.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current release | Sequoia 2026.5, available 2026-08-06 [C-001, **DOCUMENTED**] |
| Editions / entitlements | One public standalone Sequoia product with subscription, perpetual, and upgrade/support options; some features are maintenance-contract or Enterprise gated [C-005, C-041, **DOCUMENTED**] |
| Platform scope | Windows 10/11, 64-bit only; no current macOS, Linux, mobile, or web application is documented [C-002, **DOCUMENTED/INFERENCE**] |
| Included | Current 2026.5 product; public Sequoia 2026 manual; mastering, broadcast/CMS, post, immersive, VST2/VST3 and ARA behavior; acquisition-era licensing |
| Excluded | Samplitude except explicit shared lineage; private CMS integrations; proprietary binaries, schemas, DSP, SDK code, installers and dynamic testing |
| Method | Public clean-room documentary research only; no installation, execution, access bypass, decompilation, or private material |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

**Decision.** Determine which Sequoia product, engine, object-editing,
broadcast/mastering, persistence, interchange, and plugin-hosting patterns are
useful evidence for a new cross-platform DAW, and which require clean-room
prototypes rather than documentary assumption.

**Sub-questions.** Product/version boundary; VIP/object model; Hybrid Audio
Engine and PDC; VST2/VST3 discovery, isolation, routing, automation, state and
UI; DDP/loudness/BWF/ADM; broadcast CMS; AAF/OMF; recovery and licensing.

**Depth budget.** Eleven core evidence passes and one curiosity pass, each
retrieving no more than two decision-critical public primary sources. Findings,
contradictions, and gaps were synthesized before each next pass. Search-result
text was discovery or negative-search evidence, not retained product evidence.

**Sufficient coverage.** Every template heading and plugin row is present; each
substantive statement resolves to a classified claim; every absent host,
recovery, or conformance detail is an explicit `UNKNOWN` with a discriminating
probe.

## 1. Executive summary

- Boris FX Sequoia 2026.5 is a maintained, Windows-only high-end workstation
  aimed at mastering, broadcast/CMS, post-production, immersive audio, and
  large live/classical recording. Boris FX acquired the lineage and retained
  the existing development and support team in 2025. [C-001-C-004,
  **DOCUMENTED/INFERENCE**]
- The differentiating project model is a linear virtual project (VIP) made of
  tracks and non-destructive audio objects. Each object references media and can
  carry its own gain, pan, fades, pitch/time, AUX, effects, automation, and
  routing-related processing; MIDI events live in MIDI objects. [C-006, C-007,
  C-012-C-014, **DOCUMENTED**]
- The Hybrid Audio Engine exposes a low-latency input/mixer domain and a
  higher-latency VIP-object domain. Known engine and effect latency is aligned
  by earlier playback. This is useful public behavior, but graph structures,
  threads, process boundaries, compensation limits, dynamic latency, tails, and
  render determinism are proprietary or undocumented. [C-008-C-010, C-029,
  C-045, **DOCUMENTED/UNKNOWN**]
- Current Sequoia 2026 help explicitly hosts VST2 and VST3. It documents default
  and custom paths, usability checks, suppression and rescan of failed or
  scan-crashing plugins, a resettable cache, generic/custom UI, DPI handling,
  sidechains, MIDI I/O, multi-output instruments, automation, and presets. It
  does not disclose scanner/runtime isolation, sandboxing, architecture
  bridging, code-signing rules, missing-plugin preservation, parameter IDs,
  sample accuracy, or a complete PDC/state contract. [C-021-C-030, C-051,
  **DOCUMENTED/UNKNOWN**]
- The mastering/broadcast surface is unusually broad: DDP import/export and a
  DDP player, EBU/ITU loudness workflows, BWF metadata/ISRC, album PQ metadata,
  ADM/Dolby Atmos, simultaneous multi-format export, editing/export during
  recording, database-oriented CMS workflows, AAF/OMF, video/timecode, OSC,
  and up-to-22.2 spatial routing. Standards claims remain vendor documentation,
  not independent conformance results. [C-017, C-019, C-032, C-034-C-040,
  C-046-C-049, **DOCUMENTED**]
- Recovery is the largest durability gap. CMS database workflows advertise
  automatic backup/deletion and differential/incremental saving, and offline
  effects can preserve originals, but application autosave, atomic save, crash
  journals, recording recovery, missing-dependency round trips, and migration
  guarantees were not established. [C-011, C-031-C-033,
  **DOCUMENTED/UNKNOWN**]
- Sequoia licensing spans Boris FX Hub activation, advertised hardware/software
  containers, and retained WIBU handling for legacy 17.x and earlier licenses.
  Exact current seats, offline grace, transfers, EULA, privacy, and deployment
  rights remain unknown. Independently, Steinberg documents VST3 SDK use under
  MIT terms while new VST2 distribution requires a VST2 agreement signed before
  October 2018. [C-041-C-044, **DOCUMENTED/UNKNOWN**]

**Confidence:** high for current identity/platform, object model, public Hybrid
behavior, VST scan/UI/routing surface, mastering/broadcast features, and current
release; medium for licensing topology and vendor performance claims; low or
unknown for proprietary internals, full plugin conformance, recovery,
accessibility, security, and interchange fidelity.

## 2. Product identity, history, and market position

- Boris FX announced its acquisition of Sequoia, Samplitude, and Music Studio
  from MAGIX on 2025-08-21 and said the developers, engineers, and support staff
  would remain in the new German subsidiary. This establishes vendor and team
  continuity, not source-code identity or an unchanged internal architecture.
  [C-003, **DOCUMENTED**]
- Sequoia 2026.5 became available on 2026-08-06. The public product is a
  standalone Windows DAW sold through subscription, perpetual, and
  upgrade/support arrangements. [C-001, C-005, **DOCUMENTED**]
- Boris FX positions it above general music production as a mastering,
  immersive, post-production, live/classical, and broadcast/CMS workstation.
  Customer lists and sound-quality superlatives are marketing evidence only and
  are not treated as market-share or fidelity measurements. [C-004,
  **DOCUMENTED**]
- Current minimum requirements name 64-bit Windows 10/11. The absence of a
  supported macOS/Linux/mobile/web build in the current matrix supports a
  bounded current-platform inference, not a claim about historical or internal
  builds. [C-002, **DOCUMENTED/INFERENCE**]

## 3. Workflow and conceptual model

- The central model is a linear virtual project (VIP): tracks align on a
  timeline, contain audio or MIDI objects, and feed mixer/routing structures.
  Project windows combine arranger, tracks, range/marker tracks, editors, and
  dockable views; several project windows can be open. [C-006, C-007,
  **DOCUMENTED**]
- Audio objects reference an entire media file or a range and apply object-local
  volume, pan, length, fades, pitch/time, AUX taps, and effects in real time
  without changing the original. MIDI objects instead store timed MIDI events.
  [C-006, C-013, **DOCUMENTED**]
- Sequoia adds source/destination and four-point editing across source and
  destination projects, insert/overwrite/ripple choices, real-time crossfades,
  multi-synchronous editing for alternate takes, and multi-source sessions.
  [C-007, C-012, **DOCUMENTED**]
- No scene launcher, tracker grid, browser/mobile model, modular patching model,
  or public headless project service was established. These are `UNKNOWN` as
  absolute exclusions; the documented primary model is linear. [C-045,
  **UNKNOWN**]

## 4. Publicly documented architecture

- Public documentation exposes user-visible partitions rather than source-level
  internals: low/high-latency engine domains, VIP objects, track/bus/master/AUX
  routing, VST scan state, persistent preference/preset files, ARA full-clip
  integration, CMS-facing database workflows, and ADM metadata editing.
  [C-008, C-015, C-021, C-027, C-032, C-037, C-046,
  **DOCUMENTED**]
- Persistent public artifacts include virtual projects, referenced media,
  ordinary-project templates, `.trk` chain presets, `.fxp/.fxb` VST files,
  `VSTPlugins.ini` scan state, and `VSTPlugin.ini` display settings. Their
  internal schemas are not public evidence. [C-021, C-024, C-027, C-031,
  **DOCUMENTED**]
- Process/service boundaries, graph data structures, worker scheduling,
  lock-free behavior, realtime allocation policy, scanner helpers, CMS APIs,
  project schema, plugin wrappers, and native DSP implementation are
  `UNKNOWN`. Marketing terms such as Hybrid, object, or CMS do not establish
  those mechanisms. [C-023, C-044, C-045, **UNKNOWN**]

## 5. Audio engine

- Monitoring modes expose hardware, economy, track-FX, and Hybrid choices. In
  the fullest Hybrid mode, live inputs, buses, masters, and VST instruments use
  low-latency mixer processing while track objects use higher-latency VIP
  buffers. [C-008, **DOCUMENTED**]
- Known engine and latency-adding effect delays are automatically aligned by
  beginning playback earlier. This documents a PDC behavior, but not maximum
  compensated delay, dynamic latency changes, bypass transitions, sidechain
  alignment, or tail handling. [C-009, C-029, **DOCUMENTED/UNKNOWN**]
- Current vendor specifications claim native 32-bit-float recording, sample
  rates up to 384 kHz, and as many as 512 inputs. These are published limits,
  not reproduced stress or fidelity tests. [C-010, **DOCUMENTED**]
- All realtime effects can be rendered offline. VIP-object rendering can append
  to source media or use one/repeated `_FX` files while repointing the object and
  optionally preserving undo; wave-project processing is destructive with
  optional temporary undo. Extra pre/post samples can be requested for context
  or decay. [C-011, **DOCUMENTED**]
- Internal mix precision beyond the named recording/export formats,
  oversampling, block-size negotiation, multicore scheduling, dropout recovery,
  denormal handling, deterministic offline render, freeze semantics, and
  realtime/offline callback parity remain `UNKNOWN`. [C-029, C-043, C-045,
  **UNKNOWN**]

## 6. Tracks, timeline, clips, and editing

- Audio objects can be moved, copied, cut, split, trimmed, overlapped,
  crossfaded, locked, and edited independently while retaining their media
  references. Object handles expose start, length, fades, and volume; the Object
  Editor exposes deeper per-object processing. [C-006, C-012,
  **DOCUMENTED**]
- Source/destination four-point editing can move selected regions between tracks
  and projects with insert, overwrite, or ripple behavior and automatic
  crossfades. Multi-synchronous cut addresses takes with differing tempo, and
  comping selects sections directly under a track. [C-012, **DOCUMENTED**]
- Range/marker tracks organize and export sections; markers can be multi-line
  and audio/video markers can be independent. Waveforms can calculate during
  playback in 2026.5. [C-012, C-039, C-043, **DOCUMENTED**]
- Exact undo depth/history persistence, source-reference garbage collection,
  edit-list schema, ripple behavior across every object type, and conflict
  semantics across open projects remain `UNKNOWN`. [C-033, C-045,
  **UNKNOWN**]

## 7. MIDI, sequencing, notation, and expression

- MIDI objects contain timed note-on/off, control-change, and program-change
  events. They can be loaded from MIDI files, recorded from a keyboard, or
  drawn in the MIDI editor and routed to hardware or VST instruments. [C-013,
  **DOCUMENTED**]
- MPE is explicitly supported by assigning notes to individual MIDI channels;
  documentation names per-note pitch wheel, channel pressure, and CC74 behavior.
  This does not prove VST3 note-expression translation or event precision.
  [C-014, **DOCUMENTED**]
- A VST plugin can receive MIDI, and plugin-generated MIDI can feed another
  track. Instrument routing supports multitimbral and multi-output arrangements,
  while one track MIDI output cannot target multiple instruments. [C-024,
  C-026, **DOCUMENTED**]
- Score/notation depth, SysEx capture, MIDI clock/MTC details, MIDI 2.0/UMP,
  sample-accurate timestamps, MPE zone edge cases, and MIDI-generating effect
  conformance remain `UNKNOWN`. [C-029, **UNKNOWN**]

## 8. Routing, mixer, automation, and control

- The Routing Manager provides matrices for hardware inputs/outputs, tracks,
  masters, submix buses, AUX sends, sidechains, and VCA groups. Output and send
  taps can be direct, pre-fader, or post-fader; one track can be converted into
  a bus. [C-015, **DOCUMENTED**]
- Multi-output instruments can keep MIDI and audio together, separate MIDI from
  returns, create one return per reported output, force mono/stereo treatment,
  hide empty return tracks, or combine several instrument outputs on a track.
  [C-016, C-026, **DOCUMENTED**]
- Sequoia 2026.5's Spatial Panner supports mono, stereo, surround, and immersive
  layouts through 22.2. Panning can link across target buses while preserving
  independent adjustments, and external VST panners are supported. [C-017,
  **DOCUMENTED**]
- Track automation uses lanes and touch, latch, trim, and overwrite modes.
  Volume, panorama, and VST parameters can be automated at track or object
  scope; automate-next and hardware-controller learning are documented.
  [C-018, **DOCUMENTED**]
- OSC can trigger edit, mix, transport, and recording commands; macros can
  record/program command sequences and be attached to shortcuts or markers.
  [C-040, **DOCUMENTED**]
- Routing-cycle/feedback rules, automation resolution, parameter-ID stability,
  OSC schema/authentication, control-surface API/versioning, and exact immersive
  downmix metadata behavior remain `UNKNOWN`. [C-029, C-040, C-044,
  **UNKNOWN**]

## 9. Recording, comping, and media handling

- Sequoia documents recording, monitoring with or without effects, 32-bit-float
  capture, grouped multitrack comping, simultaneous audio/video reference
  capture, and large-input live workflows. Insert/track effects heard during
  monitoring are not printed to the recorded signal under the documented modes.
  [C-008, C-010, C-019, C-047, **DOCUMENTED**]
- A broadcast workflow can preview, cut, arrange, cue, and export existing
  material while another track is still recording. Cue Mode sequentially plays
  objects while another track records. [C-019, **DOCUMENTED**]
- BWF metadata includes timestamps/original positions, ISRC, UMID, loudness,
  coding history, originator fields, and optional embedded peak data. [C-036,
  **DOCUMENTED**]
- Current video support names AVC, HEVC, AV1 and ProRes, 4K/60 playback,
  multiple video streams, timecode sync, and Blackmagic hardware integration.
  [C-047, **DOCUMENTED**]
- Proxy policy, media relink conflict rules, pool/reference counting, recording
  recovery after power loss, take-file cleanup, and codec edge cases remain
  `UNKNOWN`. [C-033, C-038, C-047, **UNKNOWN**]

## 10. Instruments, effects, content, and native devices

- Sequoia includes native recording, restoration, mixing, mastering, metering,
  spatial and instrument content. Architecture-relevant native concepts include
  object/track/master effect chains, spectral editing, loudness processing,
  external hardware represented as latency-compensated plugins, and the Spatial
  Panner. [C-017, C-020, C-034-C-035, **DOCUMENTED**]
- ARA2 integrates full-clip analysis in the arranger. Sequoia 2026.5 says ARA
  plugins are automatically detected without per-product whitelisting and names
  SoundApp ARA plus earlier Melodyne/MTrackAlign/ReSing integrations. [C-020,
  C-046, **DOCUMENTED**]
- Audio Plugin Union tools and bundled third-party products are entitlements,
  not evidence of a public native authoring ABI. Exhaustive inventory is
  intentionally omitted because it changes and has low architecture value.
  [C-020, C-049, **DOCUMENTED/INFERENCE**]
- No public Sequoia native-device SDK, modulation graph, binary ABI, or
  compatibility promise was found. [C-044, **UNKNOWN**]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means no affirmative current official host evidence was found; it does
not mean a format was dynamically rejected. Sequoia has no current non-Windows
application in the retained platform matrix. [C-002, C-030]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `NOT_APPLICABLE:no macOS Sequoia` | `DOCUMENTED:hosted` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | Sequoia 2026 manual; no edition split stated | Custom/default VST2 folders, scan, effects/instruments evidenced; no new implementation right follows | C-021/C-042; S-004/S-023 |
| VST3 | `NOT_APPLICABLE:no macOS Sequoia` | `DOCUMENTED:hosted` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | Sequoia 2026/2026.5; core host, with maintenance-gated FX I/O Matrix | Fixed standard path, scan, instruments/effects/sidechain/MIDI/multi-out/ARA-related workflows evidenced | C-021-C-029/C-050; S-001/S-004/S-005/S-009/S-023 |
| AUv2 | `NOT_APPLICABLE:no macOS Sequoia` | `NOT_APPLICABLE:Apple platform format` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | No current Sequoia host surface on Apple platforms | No claim about historical wrappers | C-002/C-030; S-001/S-004 |
| AUv3 | `NOT_APPLICABLE:no macOS Sequoia` | `NOT_APPLICABLE:Apple platform format` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | No desktop/mobile Apple edition | No extension-host evidence | C-002/C-030; S-001/S-004 |
| AAX | `NOT_APPLICABLE:no macOS Sequoia` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | Current official set establishes VST, not AAX | No hosting, SDK, signing, or certification claim | C-030/C-044; S-001/S-004 |
| CLAP | `NOT_APPLICABLE:no macOS Sequoia` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | No current official support statement found | No scan/instantiate/conformance claim | C-030; S-001/S-004 |
| LV2 | `NOT_APPLICABLE:no macOS Sequoia` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | No current official support statement found | No scan/instantiate/conformance claim | C-030; S-001/S-004 |
| LADSPA | `NOT_APPLICABLE:no macOS Sequoia` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | No current official support statement found | No scan/instantiate/conformance claim | C-030; S-001/S-004 |
| DSSI | `NOT_APPLICABLE:no macOS Sequoia` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | No current official support statement found | No scan/instantiate/conformance claim | C-030; S-001/S-004 |
| JSFX | `NOT_APPLICABLE:no macOS Sequoia` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | No current official support statement found | No script-host evidence | C-030; S-001/S-004 |
| DirectX/DXi | `NOT_APPLICABLE:no macOS Sequoia` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | Historical assumptions were not used as current evidence | Requires a current matrix or safe fixture | C-030; S-001/S-004 |
| Rack Extension | `NOT_APPLICABLE:no macOS Sequoia` | `UNKNOWN:no current host evidence` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | No current official support statement found | Do not confuse with effect-chain or ARA integration | C-030; S-001/S-004 |
| Product-native/other | `NOT_APPLICABLE:no macOS Sequoia` | `DOCUMENTED:native effects/instruments, ARA2, external-hardware wrapper` | `NOT_APPLICABLE:no Linux Sequoia` | `NOT_APPLICABLE:no mobile/web Sequoia` | Sequoia 2026.5; some tools/FX matrix depend on entitlement | ARA is timeline integration; no public native authoring SDK | C-020/C-044/C-046/C-049; S-001/S-005/S-022 |

### 11.2 Discovery, scanning, validation, and recovery

- At launch Sequoia detects new VST plugins and offers immediate or deferred
  scan. VST3 uses `C:\Program Files\Common Files\VST3`; VST2 searches system and
  any number of user folders. Automatic once-per-session refresh can add new and
  remove uninstalled entries. [C-021, **DOCUMENTED**]
- Scan checks usability. Incompatible, bad, or scan-crashing plugins are marked
  unusable, skipped later, and can be retried with **Scan failed plugins**.
  Deleting `C:\ProgramData\Boris FX\Sequoia2026\VSTPlugins.ini` resets scan state
  but also requires re-adding custom paths. [C-022, C-051,
  **DOCUMENTED**]
- The manual does not state whether scanning occurs in a helper process, how a
  crashing scan is contained, cache key/schema, duplicate-ID/path policy,
  quarantine reason detail, timeout policy, automatic restart, or signing and
  malware checks. Runtime crash recovery and safe project opening are also
  `UNKNOWN`. [C-023, C-028, C-044, **UNKNOWN**]

### 11.3 Runtime isolation and compatibility

- Per-plugin compatibility switches can restrict instances to one CPU, force
  processing on silent input, prevent automatic copying with objects, and force
  Windows DPI scaling. They are user-visible mitigations, not proof of a
  sandbox. [C-024, **DOCUMENTED**]
- Economy processing can skip silent-input effects unless overridden; the
  override is recommended for long decays or self-generating plugins. Current
  2026 material also documents a VST3 SDK update and silence skipping for
  compatible plugins. [C-024, C-050, **DOCUMENTED**]
- Scanner/runtime process topology, memory isolation, crash restart,
  32-bit/64-bit bridging, x86 emulation, per-plugin security principals,
  network/file restrictions, code-signing enforcement, and compatibility-mode
  persistence are `UNKNOWN`. [C-023, C-044, **UNKNOWN**]

### 11.4 Host/plugin processing contract

- VST effects and instruments can be inserted at object, track, bus, and master
  scopes. MIDI-controllable effects can receive events; plugins can send MIDI to
  another track. Multi-output instruments can expose separated or combined
  audio/MIDI returns. [C-024-C-026, **DOCUMENTED**]
- For an effect with more than two inputs, Sequoia assumes inputs 3/4 are a
  stereo sidechain. One or more source tracks create hidden sidechain sends with
  direct/pre/post taps, filter, solo, and matrix visibility. [C-025,
  **DOCUMENTED**]
- The maintenance-gated FX I/O Matrix can remap track channels to plugin inputs
  and plugin outputs back to track outputs, including surround and parallel
  paths. External VST panners can participate in the spatial workflow. [C-017,
  C-024, C-049, **DOCUMENTED**]
- `UNKNOWN`: arbitrary audio/event bus counts, dynamic bus activation, unusual
  sidechain layouts beyond the 3/4 convention, MIDI 2.0, sample-accurate events
  and automation, latency/tail query timing, suspend/resume, bypass semantics,
  in-place processing, offline callback distinctions, and headless rendering.
  [C-029, **UNKNOWN**]

### 11.5 Parameters, automation, state, presets, and project recall

- The plugin dialog exposes internal VST programs, `.fxp` patches, `.fxb`
  banks, randomization of reachable parameters, automate-next, and controller
  learn. Generic views retain a selected eight-parameter panel per plugin.
  [C-024, C-027, **DOCUMENTED**]
- `.trk` object/track/master chain presets retain effect order, effect routing,
  and AUX placement, subject to channel-count compatibility. Project templates
  retain plugins, instruments, buses, states and routing but omit objects.
  [C-027, C-031, **DOCUMENTED**]
- Documentation does not define stable parameter IDs, normalization/text,
  gesture boundaries, opaque state-chunk size, asset references, VST2-to-VST3
  migration, plugin-version substitution, missing/unlicensed placeholders, or
  whether unavailable state survives save/reopen/reinstall. [C-028, C-029,
  **UNKNOWN**]

### 11.6 UI, diagnostics, and failure modes

- VST windows open from track, mixer, object, or instrument-manager contexts.
  A custom GUI is preferred; a generic slider view covers plugins without one.
  Forced HDPI scaling is global per plugin in `VSTPlugin.ini`, and all open
  instances are reopened when it changes. [C-024, **DOCUMENTED**]
- User-visible diagnostics include a failed/unusable scan state and a manual
  failed-only rescan. Plugin-specific compatibility toggles provide recovery
  options for multicore, silent-input, copy, and display issues. [C-022,
  C-024, C-051, **DOCUMENTED**]
- Per-instance crash UI, crash dumps, timeout detail, logs, rejected-plugin
  reason codes, safe-mode project opening, UI-process isolation, resize/event
  forwarding, accessibility of third-party editors, and headless fallback
  beyond the generic parameter panel remain `UNKNOWN`. [C-023, C-044,
  **UNKNOWN**]

## 12. Extensibility and integration

- ARA2 is the documented deep third-party timeline integration. Sequoia 2026.5
  says compatible ARA plugins are automatically detected and can analyze full
  clips in the arranger without individual whitelisting. [C-046,
  **DOCUMENTED**]
- OSC exposes remote control over editing, mixing, transport, and recording;
  macros record/program commands and can run from shortcuts or project markers.
  Hardware-controller learn maps plugin controls. [C-018, C-040,
  **DOCUMENTED**]
- Broadcast CMS/automation connections, Soundly transfer, AAF/OMF, BWF, and ADM
  are integration boundaries, but no general-purpose Sequoia scripting language,
  public CMS API, native-device SDK, plugin SDK, OSC schema/security contract,
  or binary compatibility policy was found. [C-032, C-036-C-040, C-044,
  **DOCUMENTED/UNKNOWN**]

## 13. Project format, persistence, interoperability, and collaboration

- A virtual project holds tracks/objects and references media; MIDI data is held
  in MIDI objects. Project templates are ordinary projects that preserve buses,
  track state, routing, instruments, and effects but omit objects. Multi-source
  sessions create one destination and selected source projects. [C-006, C-007,
  C-013, C-031, **DOCUMENTED**]
- CMS-oriented installations can store projects and audio on database servers;
  the product page documents automatic backup/deletion and differential or
  incremental saves that transfer only changes. Protocol, transactional and
  conflict details are not public. [C-032, C-048,
  **DOCUMENTED/UNKNOWN**]
- Open/project interchange includes AAF and OMF import/export; BWF metadata and
  ISRC exchange; DDP import/export; ADM export; audio/stems/codecs; and video.
  No current evidence established DAWproject, MusicXML, project-level Git/version
  control, or cloud co-editing. [C-034, C-036-C-039, **DOCUMENTED/UNKNOWN**]
- Autosave cadence, atomic save, backup rotation outside CMS, crash journal,
  recording salvage, collect/archive, relink conflict handling, schema migration,
  backward/forward guarantees, and missing-plugin/media round trips remain
  `UNKNOWN`. [C-028, C-033, **UNKNOWN**]

## 14. Delivery, live, post-production, and specialized workflows

- Mastering workflows include album sequencing, PQ/ISRC metadata, object-level
  processing, codec preview, simultaneous target exports, stems, 32-bit integer
  archival export, and DDP import/export. The Sonoris Sequoia DDP Player reads
  DDP 1.0x/2.00, displays PQ/ISRC/MCN/CD Text, and checks Red Book compatibility.
  [C-034, C-039, **DOCUMENTED**]
- Loudness adjustment supports EBU R128 and current ITU-R BS.1770/1771 settings,
  LUFS targets/tolerance, true-peak action, loudness-range processing, XML
  reports, batch/watch-folder operation, and BWF loudness metadata. [C-035,
  C-049, **DOCUMENTED**]
- The BWF manager handles ISRC, timestamp, UMID, loudness, coding history and
  other metadata; the product page additionally names EBU Tech 3352 ISRC export.
  [C-036, **DOCUMENTED**]
- ADM Editor creates general EBU ADM and Dolby Atmos distribution-oriented ADM.
  Native Dolby Atmos and the 2026.5 Spatial Panner support immersive work through
  final ADM delivery and layouts through 22.2. [C-017, C-037,
  **DOCUMENTED**]
- Broadcast specialties include editing/export during recording, Cue Mode,
  auto-ducking, database/CMS connections, and incremental saves. Live/classical
  specialties include source/destination editing and MuSyC. Post includes
  timecode, AAF/OMF and GPU video. [C-012, C-019, C-032, C-038, C-047,
  **DOCUMENTED**]
- Exact DDP creator version, checksum algorithm/error policy, EBU/ITU meter
  tolerance against test vectors, ADM profile completeness, AAF/OMF round-trip
  fidelity, live failover, and CMS transactional recovery remain `UNKNOWN`.
  [C-033-C-038, C-048, **UNKNOWN**]

## 15. Performance, reliability, security, and accessibility

- Current requirements name 4-8 minimum CPU cores, 8 GB RAM, and WDM/ASIO;
  recommendations rise to 8-16 cores, 32 GB RAM, NVMe storage, and current ASIO
  drivers. These are vendor guidance, not benchmark results. [C-002, C-043,
  **DOCUMENTED**]
- The UI status area reports CPU, latency, buffers, and long-operation progress.
  Sequoia 2026/2026.5 claims multicore, VST3, waveform, plugin, video, and
  stability improvements. No comparative benchmark or incident rate was
  retained. [C-043, **DOCUMENTED**]
- Scan-crashing plugins are suppressed on later scans, but scanner and runtime
  isolation are unknown. Boris FX Hub/account activation and WIBU/container
  licensing add supply-chain and local entitlement dependencies. [C-022,
  C-023, C-041, C-051, **DOCUMENTED/UNKNOWN**]
- Code-signing and plugin trust policy, update rollback, vulnerability response,
  telemetry/privacy defaults, CMS/OSC authentication, encryption, credential
  storage, accessibility conformance, screen-reader behavior, keyboard-only
  completion, color/contrast, and third-party UI accessibility remain
  `UNKNOWN`. [C-044, **UNKNOWN**]

## 16. Licensing, ecosystem, and implementation constraints

- Sequoia is proprietary commercial software offered through subscription,
  perpetual license, and upgrade/support options. Current installation and
  activation documentation uses Boris FX Hub, account sign-in, and a receipt
  activation key. The product page also advertises hardware and software license
  containers. [C-005, C-041, **DOCUMENTED**]
- Existing Sequoia 17.x and earlier licenses remain under MAGIX/WIBU, including
  USB dongles/local containers; Boris and MAGIX builds can coexist and use the
  same legacy license. A 2026 trial can temporarily put 17/2025 into trial mode,
  then legacy licensing resumes. [C-041, **DOCUMENTED**]
- Steinberg's current licensing FAQ says VST3 SDK versions under MIT may be used
  in source or binary hosts with the MIT notice; VST2 headers may not be
  redistributed, and VST2 binary host/plugin distribution is allowed only to
  entities that signed the VST2 agreement before October 2018. Existing Sequoia
  VST2 support does not grant a new DAW permission to ship VST2. [C-042,
  **DOCUMENTED/INFERENCE**]
- Naming VST, ARA, ADM, Dolby, DDP, BWF, AAF, OMF, OSC or other technologies
  grants no trademark, SDK, redistribution, patent, compatibility,
  certification, or profile-conformance rights. Exact Sequoia EULA, seats,
  offline grace, transfer/revocation, enterprise deployment and regional terms
  require controlling agreements and counsel. [C-042, C-044,
  **DOCUMENTED/UNKNOWN**]
- Proprietary binaries, schemas, SDK code, DSP and protected expression were not
  copied or inspected. Any implementation must use independently licensed
  specifications/SDKs and original clean-room design. [C-045,
  **UNKNOWN**]

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** Sequoia makes object-local processing a first-class composition
boundary, exposes dual-latency monitoring behavior, offers deep matrix and
immersive routing, has unusually explicit VST scan/compatibility controls, and
connects mastering metadata, broadcast operation, post interchange, and
multi-format delivery in one project model. [C-006-C-009, C-015-C-022,
C-034-C-040, **DOCUMENTED**]

**Liabilities.** The current application is Windows-only; affirmative third-party
hosting is limited to VST2/VST3 plus ARA integration; maintenance/Enterprise
entitlements fragment some advanced behavior. Public evidence is silent on
process isolation, full PDC/event/state contracts, missing dependencies,
recovery, open project interchange, accessibility, security, and CMS APIs.
[C-002, C-023, C-028-C-030, C-033, C-044, C-048-C-049,
**DOCUMENTED/UNKNOWN**]

**Architecture lesson.** The transferable value is the visible separation of
media reference, object-local processing, realtime monitor scheduling, project
routing, and delivery metadata. The primary risk is reproducing a broad
professional surface without explicit durability, security, and plugin-failure
contracts, or tying essential workflows to private CMS and licensing systems.
[C-006, C-008, C-032-C-045, **INFERENCE**]

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites / tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Local corrections should not require new tracks | Immutable media references plus object-local fades, gain, time/pitch, sends, inserts, routing and automation | C-006/C-012/C-018 | Durable object IDs, clear DSP order, copy/split rules | Do not copy Sequoia UI/expression or schemas | `CANDIDATE` |
| Low-latency monitoring conflicts with expensive editing DSP | Separate monitored/mixer and timeline-object scheduling domains with explicit alignment and load UI | C-008-C-010/C-043 | Correct graph partitioning and transition tests | Proprietary Hybrid implementation is unknown | `CANDIDATE` |
| Plugin discovery failures recur | Cache explicit usable/failed status; skip repeated failures; expose failed-only rescan and full reset | C-021-C-023/C-051 | Scanner isolation and reason taxonomy still needed | Do not equate suppression with containment | `CANDIDATE` |
| Sidechains and multichannel plugins are hard to route | Visible bus matrix plus per-instance channel mapping and explicit tap points | C-015-C-017/C-025-C-026 | Dynamic bus/PDC tests; avoid fixed 3/4 assumptions | Sequoia convention is brittle for unusual layouts | `CONDITIONAL` |
| One project must deliver stereo and immersive variants | Link source panning across typed target buses but permit target-specific overrides | C-017/C-037 | Stable source identity, downmix and metadata rules | 22.2/Atmos/ADM certification is separate | `CANDIDATE` |
| Mastering deliverables need metadata and validation | Treat PQ/ISRC/BWF/loudness/ADM/DDP as versioned delivery records with validators | C-034-C-039 | Licensed specs, test vectors, checksums, profile validation | Vendor claims are not conformance proof | `CANDIDATE` |
| Live/broadcast work cannot wait for recording to stop | Append-safe recording with read/edit/export snapshots and cue playback | C-019/C-032 | Strong file ownership, recovery, I/O admission control | Current recovery/failover contract is unknown | `CONDITIONAL` |
| Large network projects make full saves expensive | Content-addressed or transactional incremental project/media saves | C-032/C-048 | Server protocol, conflict model, authentication, rollback | Sequoia CMS implementation is private | `CONDITIONAL` |
| Offline processing trades editability for resources | Explicit copy/repoint, append, and destructive modes with pre/post context | C-011 | Storage estimates and garbage collection | Avoid silent source mutation | `CANDIDATE` |
| Closed plugins threaten project durability | Persist opaque state plus identity/version, diagnostics, and neutral rendered fallback | C-028/C-033 | Extra storage and render policy | This is a new recommendation; Sequoia fallback is unknown | `CONDITIONAL` |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject fixed inputs 3/4 as a universal sidechain contract.** It is a useful
  compatibility convention but cannot model arbitrary named/dynamic buses.
  Reopen only as a legacy adapter behind a typed bus model. [C-025, C-029]
- **Reject treating scan suppression as sandboxing.** Sequoia records
  scan-crashing plugins as unusable, but process containment is undocumented.
  Reopen with public engineering evidence or safe process observation. [C-022,
  C-023]
- **Reject treating VST2 hosting as a new implementation license.** Steinberg's
  current terms distinguish legacy licensees from new distribution. [C-042]
- **Reject vendor sound/reliability superlatives as architectural proof.** No
  benchmark, null test, crash rate, or independent conformance evidence was
  gathered. [C-004, C-010, C-043]
- **Reject inheriting Samplitude behavior into Sequoia without a Sequoia source.**
  Shared lineage does not prove identical edition behavior. [C-003, C-045]
- `CURIOSITY_NO_GO`: exhaustive native effect/instrument inventory; high churn,
  low architecture value.
- `CURIOSITY_NO_GO`: customer testimonials and market-share estimation; neither
  resolves engine or host contracts.
- `CURIOSITY_NO_GO`: community crash anecdotes; lower authority and no process
  topology proof.
- `CURIOSITY_NO_GO`: repeated generated-manual index/sitemap retrieval; those
  endpoints returned access errors while exact public topics remained usable.
- `CURIOSITY_NO_GO`: repeated guessed recovery/DDP topic names; one-shot attempts
  failed and current product/manual evidence already makes limits explicit.
- `CURIOSITY_NO_GO`: installer, plugin or proprietary project execution;
  prohibited and unnecessary for documentary coverage.
- `CURIOSITY_NO_GO`: reverse engineering project/cache/CMS schemas; prohibited
  by scope and unnecessary before a clean-room fixture phase.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test | Result | Counterevidence / next test |
| --- | --- | --- | --- |
| H-01: Current Sequoia is still a MAGIX product | Acquisition and current release sources | **FALSIFIED:** Boris FX is current vendor; lineage remains MAGIX-origin [C-001/C-003] | No claim that every internal component changed |
| H-02: Object editing is just track-level clip trimming | Object manual and product behavior | **FALSIFIED:** each object has non-destructive media reference and processing state [C-006/C-012/C-018] | Project serialization remains unknown |
| H-03: Hybrid means one low-latency engine | Monitoring-mode manual | **FALSIFIED:** mixer/input and VIP-object domains use different latency behavior [C-008/C-009] | Thread/process implementation remains unknown |
| H-04: A VST logo proves full interoperability | Scan/dialog/routing evidence versus gaps | **FALSIFIED as shortcut:** accepted/scanned/instantiated/fully conformant are distinct [C-021-C-029] | Run a versioned VST fixture matrix |
| H-05: Failed scan status proves crash containment | Scan topic | **NOT SUPPORTED:** failure persistence is documented, helper process is not [C-022/C-023] | Observe PIDs and crash/timeout fixture in disposable VM |
| H-06: VST2 support is legally reusable by a new host | Steinberg licensing FAQ | **FALSIFIED:** only pre-Oct-2018 VST2 licensees may distribute [C-042] | Legal review of any claimed legacy entitlement |
| H-07: Automatic PDC proves every plugin path aligns | Hybrid manual versus host gaps | **PARTIAL ONLY:** known engine/effect latency is aligned; tails/dynamic latency/sidechains are unqualified [C-009/C-029] | Impulse and dynamic-latency fixtures |
| H-08: CMS backup proves general crash recovery | Product CMS statement and recovery searches | **FALSIFIED as generalization:** database routines are documented; application recovery is not [C-032/C-033] | Forced termination/save/record tests in licensed disposable copy |
| H-09: DDP/ADM/AAF labels prove standards fidelity | Product/manual scope | **NOT SUPPORTED:** capabilities are documented; independent conformance and round-trip fidelity are not [C-034/C-037/C-038] | Official test vectors and cross-tool round trips |
| H-10: Sequoia has broad multi-OS plugin portability | Current requirements | **FALSIFIED:** current host is Windows-only [C-002/C-030] | Reassess only if vendor ships another OS |
| H-11: Missing plugins preserve all state | Template/preset/scan sources | **INCONCLUSIVE:** positive save behavior does not describe missing placeholders [C-027/C-028/C-033] | Remove/reinstall/resave round-trip fixture |
| H-12: 2026.5 expanded ARA means all ARA tools work | Current release statement | **PARTIAL ONLY:** auto-detection is documented, per-plugin conformance is not [C-046] | Known-good and adversarial ARA fixtures |

The dossier deliberately separates **format accepted**, **plugin discovered**,
**scan succeeds**, **instance opens**, and **full host contract works**. The
manual covers the first four only for selected VST paths; no full conformance
claim is made. [C-021-C-029]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | **DOCUMENTED** | High | Sequoia 2026.5 became available 2026-08-06. | Current at cutoff | S-001, S-022 | Product and dated release agree | No binary/build inspection |
| C-002 | **DOCUMENTED / INFERENCE** | High | Current supported app is 64-bit Windows 10/11; no current macOS/Linux/mobile/web app is in the official matrix. | Current family | S-001 | Explicit Windows requirements; bounded negative inference | Does not cover historic/internal builds |
| C-003 | **DOCUMENTED** | High | Boris FX acquired Sequoia from MAGIX in Aug. 2025 and retained development/support staff. | Lineage | S-002 | Direct acquisition announcement | No transaction/source-code audit |
| C-004 | **DOCUMENTED** | High | Vendor positions Sequoia for mastering, broadcast/CMS, post, immersive and live/classical work. | Current family | S-001, S-002 | Direct product positioning | Market share/fidelity unmeasured |
| C-005 | **DOCUMENTED** | High | Sequoia is standalone with subscription, perpetual and upgrade/support options; some behavior is entitlement gated. | 2026.5 | S-001, S-005, S-022 | Current pricing and maintenance marker | Full SKU/feature matrix unavailable |
| C-006 | **DOCUMENTED** | High | Audio objects reference media and add non-destructive object-local processing; MIDI objects store event data. | Sequoia 2026 | S-006 | Explicit object definition | Serialization/DSP order unknown |
| C-007 | **DOCUMENTED** | High | Linear VIP projects can have multiple windows and multi-source source/destination sessions. | Sequoia 2026 | S-001, S-010, S-011 | Interface/project documentation | Collaboration/conflict semantics unknown |
| C-008 | **DOCUMENTED** | High | Hybrid modes separate low-latency mixer/input processing from higher-latency VIP-object playback. | Sequoia 2026 | S-001, S-007 | Explicit mode descriptions | Scheduler internals unknown |
| C-009 | **DOCUMENTED** | High | Known engine and effect latency is compensated through earlier playback. | Sequoia 2026 | S-007 | Explicit manual statement | Bounds/dynamic latency/tails unknown |
| C-010 | **DOCUMENTED** | Medium | Vendor specifies 32-bit-float recording, up to 384 kHz and up to 512 inputs. | Current product | S-001 | Current specifications | Not independently stress-tested |
| C-011 | **DOCUMENTED** | High | Realtime effects can render offline; VIP copy/repoint choices differ from destructive wave projects and can include extra samples. | Sequoia 2026 | S-019 | Explicit offline topic | Callback parity/determinism unknown |
| C-012 | **DOCUMENTED** | High | Source/destination, four-point, ripple/insert/overwrite, MuSyC, crossfade and comping workflows are supported. | Current product | S-001, S-006 | Direct editing sections | Edge-case edit semantics untested |
| C-013 | **DOCUMENTED** | High | MIDI objects contain timed note/control/program events and can be loaded, recorded or drawn. | Sequoia 2026 | S-020 | Explicit MIDI definition | Timestamp precision unknown |
| C-014 | **DOCUMENTED** | High | MPE supports per-note channels, pitch wheel, channel pressure and CC74. | Sequoia 2026 | S-021 | Explicit MPE topic | No VST3 note-expression/MIDI 2.0 claim |
| C-015 | **DOCUMENTED** | High | Routing matrices cover hardware, tracks, buses, masters, AUX, sidechains, VCAs and direct/pre/post taps. | Sequoia 2026 | S-008 | Explicit routing topic | Feedback/cycle behavior absent |
| C-016 | **DOCUMENTED** | High | Software instruments support combined/separate MIDI/audio, multitimbral and multi-output routing. | Sequoia 2026 | S-009 | Explicit instrument routing | Dynamic I/O/event timing unknown |
| C-017 | **DOCUMENTED** | High | Spatial Panner supports mono through 22.2, linked target buses, independent overrides and external VST panners. | 2026.5 | S-001, S-022 | Current release/product page | Standards conformance untested |
| C-018 | **DOCUMENTED** | High | Track/object VST automation, lanes, touch/latch/trim/overwrite, automate-next and controller learn are supported. | Current/2026 help | S-001, S-005 | Direct automation/UI descriptions | Parameter identity/sample accuracy unknown |
| C-019 | **DOCUMENTED** | High | Recording, editing, cue playback and export can proceed concurrently in broadcast workflows; comping and 32-float capture are documented. | Current product | S-001, S-007 | Product and monitor mode descriptions | Crash recovery and stress limits unknown |
| C-020 | **DOCUMENTED** | High | Native content includes restoration/mastering/spatial tools, instruments, external-hardware wrappers and ARA integrations. | Current family | S-001, S-022 | Current feature inventory | No public native authoring ABI |
| C-021 | **DOCUMENTED** | High | Sequoia 2026 hosts VST2/VST3 and scans fixed/default plus arbitrary VST2 folders. | Sequoia 2026 | S-004 | Explicit current manual | Accepted bitness/bridge unspecified |
| C-022 | **DOCUMENTED** | High | Scan validates usability, suppresses failed/crashing plugins, offers failed rescan and resets via `VSTPlugins.ini`. | Sequoia 2026 | S-004 | Explicit scan workflow | Process containment unknown |
| C-023 | **UNKNOWN** | High that evidence is absent | Scanner/runtime isolation, sandboxing, crash restart, bridging, signing and quarantine internals are not established. | Current VST host | S-004, S-005 | Relevant topics omit process/security model | Process observation fixture needed |
| C-024 | **DOCUMENTED** | High | Plugin UI supports custom/generic views, DPI, bypass, MIDI I/O, CPU/silence/copy options and FX I/O Matrix entry. | Sequoia 2026 | S-005 | Explicit plugin dialog | UI process/accessibility unknown |
| C-025 | **DOCUMENTED** | High | VST inputs 3/4 are assumed as sidechain, with hidden sends and direct/pre/post controls. | Sequoia 2026 | S-005, S-008 | Explicit sidechain/routing topics | Brittle for unusual bus layouts |
| C-026 | **DOCUMENTED** | High | VST plugins can send/receive MIDI and instruments expose multitimbral/multi-output returns. | Sequoia 2026 | S-005, S-009 | Explicit host behavior | Dynamic buses/sample timing unknown |
| C-027 | **DOCUMENTED** | High | Host exposes VST programs, `.fxp/.fxb`, generic parameter panels and `.trk` chain presets retaining routing/order/AUX. | Sequoia 2026 | S-005, S-012 | Explicit preset topics | Opaque chunk schema absent |
| C-028 | **UNKNOWN** | High that evidence is absent | Missing/unlicensed plugin placeholders, state/assets, version and VST2/VST3 migration behavior are undocumented. | Current VST/project | S-004, S-005, S-011, S-012 | Positive persistence evidence is narrower | Controlled remove/reinstall fixture needed |
| C-029 | **UNKNOWN** | High that evidence is absent | Full PDC/event/parameter contract, dynamic I/O, tails, sample accuracy, suspend and offline semantics are not established. | Current VST host | S-005, S-007, S-009, S-019 | User docs cover only selected behavior | Conformance harness needed |
| C-030 | **UNKNOWN** | High that evidence is absent | AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DX/DXi and Rack Extension hosting are unresolved; AU is inapplicable to current Windows-only app. | Current family | S-001, S-004 | Current affirmative set only names VST/native/ARA | Silence is not dynamic rejection |
| C-031 | **DOCUMENTED** | High | Project templates preserve buses, states, routing, instruments and effects but omit objects. | Sequoia 2026 | S-011 | Explicit template behavior | Project schema unknown |
| C-032 | **DOCUMENTED** | Medium-high | Broadcast CMS workflows store projects/media on database servers with automatic routines and incremental/differential saves. | Current product | S-001 | Current vendor feature statement | API/transaction model not disclosed |
| C-033 | **UNKNOWN** | High that evidence is absent | General autosave, atomic save, crash/recording recovery, backup rotation, migration and relink semantics remain unverified. | Current project durability | S-001, S-011, S-019 | Targeted support/manual attempts were empty/inaccessible | Failure-injection test needed |
| C-034 | **DOCUMENTED** | High | DDP import/export and a DDP 1.0x/2.00 player with metadata display and Red Book checks are offered. | Current product | S-001 | Explicit mastering section | Creator profile/checksum details untested |
| C-035 | **DOCUMENTED** | High | Loudness workflow names EBU R128 and ITU-R BS.1770/1771, LUFS, true peak, XML, range processing and BWF metadata. | Sequoia 2026 | S-001, S-014 | Manual plus product scope | No independent meter conformance test |
| C-036 | **DOCUMENTED** | High | BWF manager handles originator, timestamp, ISRC, UMID, loudness, coding history and peak data; product names EBU Tech 3352 ISRC. | Sequoia 2026/current | S-001, S-015 | Explicit metadata topic | Cross-tool round trip untested |
| C-037 | **DOCUMENTED** | High | ADM Editor creates general EBU ADM and Dolby Atmos-oriented files; immersive delivery is integrated. | Sequoia 2026/2026.5 | S-001, S-013, S-022 | Manual/current release | Exact profile completeness untested |
| C-038 | **DOCUMENTED** | Medium-high | AAF/OMF import/export, video/timecode and standard media exchange are documented. | Current product | S-001 | Explicit post section | Direction/round-trip fidelity not qualified |
| C-039 | **DOCUMENTED** | High | Export supports simultaneous codecs/projects, surround/stereo, range/stems including AUX/submix and 32-bit integer archival output. | Current product | S-001 | Explicit export sections | Codec edge cases/internal precision unknown |
| C-040 | **DOCUMENTED / UNKNOWN** | High | OSC, macros and controller learn are documented; public schemas, auth and API stability are not. | Current product | S-001, S-005 | Direct control descriptions | Security/version contract absent |
| C-041 | **DOCUMENTED / UNKNOWN** | Medium-high | Current Hub/key and advertised container paths coexist with MAGIX/WIBU legacy licensing; exact topology and terms are incomplete. | 17.x through 2026.5 | S-001, S-016-S-018, S-022 | Official product/support pages | EULA/seats/offline grace unknown |
| C-042 | **DOCUMENTED / INFERENCE** | High | VST3 SDK is MIT; new VST2 distribution requires a pre-Oct-2018 license and VST2 headers cannot be redistributed. | New-host implementation boundary | S-023 | Steinberg format-owner FAQ | Not legal advice; verify controlling terms |
| C-043 | **DOCUMENTED** | Medium | Vendor documents requirements/status meters and claims 2026/2026.5 multicore, VST3, waveform, plugin, video and stability improvements. | Current product | S-001, S-010, S-022 | Current vendor statements | No independent benchmark/rate |
| C-044 | **UNKNOWN** | High that evidence is absent | EULA specifics, plugin trust, security, privacy, rollback, accessibility, SDKs and CMS/OSC protections remain unresolved. | Current ecosystem/NFR | S-001, S-004, S-005, S-017 | Relevant public sources do not provide contracts | Vendor policies and audits needed |
| C-045 | **UNKNOWN** | High that evidence is absent | Proprietary graph/thread/process/storage/CMS/native-DSP implementation is not public. | Current architecture | S-001, S-006-S-010 | User-facing architecture only | Do not infer from product terms |
| C-046 | **DOCUMENTED** | High | ARA2 plugins are automatically detected in 2026.5 and support full-clip arranger processing. | 2026.5 | S-001, S-022 | Current release statements | Per-plugin conformance varies |
| C-047 | **DOCUMENTED** | High | Video engine supports named modern codecs, 4K/60, timecode, multistream audio and Blackmagic integration. | 2026/2026.5 | S-001, S-022 | Current feature/release statements | Codec/hardware edge cases untested |
| C-048 | **UNKNOWN** | High that evidence is absent | CMS protocols, database schema, locking, authentication, transactions, conflict and failover behavior are undisclosed. | Broadcast integration | S-001 | Product-level CMS description only | Vendor integration docs/test system needed |
| C-049 | **DOCUMENTED** | Medium-high | FX I/O Matrix requires maintenance contract; watch-folder loudness is described for Enterprise customers. | Entitlement boundary | S-001, S-005 | Explicit feature qualifiers | Complete SKU matrix unavailable |
| C-050 | **DOCUMENTED** | Medium | Sequoia 2026 reports updated VST3 SDK, compatible-plugin silence skipping and multicore economy-engine optimization. | 2026 release | S-001 | Vendor release description | Mechanism/benchmark unverified |
| C-051 | **DOCUMENTED** | High | Scan-crashing plugins are a documented failure mode and are persisted as unusable for later scans. | Sequoia 2026 | S-004 | Explicit negative behavior | Does not establish crash incidence or containment |

## 22. Source ledger and adaptive bibliography

All retained sources were accessed **2026-08-29**. Product and press claims are
vendor documentation, not independent measurement. Exact Sequoia 2026 manual
topics were preferred over shared Samplitude pages, reviews, forums, and search
snippets.

- **S-001 - "Sequoia: The Industry's Leading DAW for Mastering & Broadcast," Boris FX.** <https://borisfx.com/products/sequoia/>. Current product/specification/release page; Sequoia 2026.5, platforms, engine, workflows, mastering, CMS, DDP, loudness, ADM, AAF/OMF, routing, automation, export, video and licensing. Supports C-001-C-002, C-004-C-005, C-007-C-010, C-012, C-017-C-020, C-030, C-032, C-034-C-041, C-043-C-050. **Limit:** broad marketing surface; standards, performance, capacity and reliability not independently tested. **Why retained:** canonical current product boundary and densest Sequoia-specific source.
- **S-002 - "Boris FX Acquires Pro Audio Post-Production, Mastering, and Broadcast Tools," Boris FX, 2025-08-20/21.** <https://blog.borisfx.com/press/boris-fx-acquires-pro-audio-post-production-mastering-and-broadcast-tools>. Acquisition, retained team, product role and transition pricing. Supports C-003-C-004. **Limit:** corporate announcement, not transaction/source audit. **Why retained:** primary provenance source.
- **S-003 - "Documentation," Boris FX.** <https://borisfx.com/support/documentation/>. Official documentation index pointing to the Sequoia 2026 English/German manuals. Supports the manual provenance/version scope used by C-006-C-051, but no behavioral claim by itself. **Limit:** index has no behavioral contract. **Why retained:** establishes that exact fetched topics are the current official manual, preferable to legacy PDFs.
- **S-004 - "Installing VST Plug-ins," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/Installation%20von%20VST-Plug-ins.htm>. VST2/VST3 paths, startup/manual scan, usability check, failures, rescan, refresh and reset file. Supports C-021-C-023, C-028-C-030, C-044, C-051. **Limit:** no process, identity, bitness, signing, sandbox or reason schema. **Why retained:** strongest primary scan/recovery evidence.
- **S-005 - "VST Plug-in Dialog," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/VST-Plug-in%20Dialog.htm>. UI/DPI, generic view, MIDI I/O, sidechain, compatibility, presets, automation, controller and FX matrix. Supports C-005, C-018, C-023-C-029, C-040, C-044, C-049. **Limit:** user-visible controls do not expose ABI precision/process topology. **Why retained:** highest-density host-contract source.
- **S-006 - "Objects," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/Arbeitstechniken%20mit%20Objekten.htm>. Audio/MIDI object semantics, references, non-destructive processing, handles and crossfades. Supports C-006, C-012, C-045. **Limit:** no schema/DSP order. **Why retained:** direct conceptual-model definition.
- **S-007 - "Monitoring Modes," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/Monitoring_Engine-Modi%20im%20Ueberblick.htm>. Monitoring variants, Hybrid partition and latency alignment. Supports C-008-C-009, C-019, C-029, C-045. **Limit:** no bounds, threads or dynamic latency behavior. **Why retained:** precise public engine behavior.
- **S-008 - "Routing Manager," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/Routing-Manager.htm>. I/O, track/bus/master, AUX, sidechain, VCA and tap matrices. Supports C-015, C-025, C-045. **Limit:** no cycle rules or timing. **Why retained:** canonical topology source.
- **S-009 - "Routing of Software Instruments," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/Routing%20von%20Softwareinstrumenten.htm>. Simple, multitimbral, multi-output, forced channel and MIDI/audio routing. Supports C-016, C-026, C-029. **Limit:** no dynamic-I/O/event precision. **Why retained:** direct VST instrument contract.
- **S-010 - "Overview of the Program Interface," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/Programmoberflaeche.htm>. Project windows, markers, arranger, docking and CPU/latency/buffer status. Supports C-007, C-043, C-045. **Limit:** interface overview, not implementation. **Why retained:** compact project-shell and diagnostics evidence.
- **S-011 - "Creating New Projects," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/Neues%20Projekt%20erzeugen.htm>. Project folders/templates, retained state, sample rate and multi-source sessions. Supports C-007, C-028, C-031, C-033. **Limit:** no autosave/recovery/schema. **Why retained:** strongest project persistence boundary.
- **S-012 - "Effects Chain Presets," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/Effektketten.htm>. `.trk` object/track/master chains, routing/order/AUX and channel-count constraints. Supports C-027-C-028. **Limit:** opaque plugin state/missing behavior absent. **Why retained:** precise plugin-chain persistence evidence.
- **S-013 - "ADM Editor," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/ADM-Editor.htm>. General EBU ADM and Dolby Atmos distribution scope. Supports C-037. **Limit:** no profile test matrix. **Why retained:** format-specific primary documentation.
- **S-014 - "Loudness adjustment," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/Lautheitsanpassung.htm>. EBU/ITU standards, targets, true peak, LRA, XML, BWF and calculation scope. Supports C-035. **Limit:** no calibration/test-vector evidence. **Why retained:** strongest loudness-engine contract.
- **S-015 - "Broadcast Wave Manager," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/Broadcast%20Wave%20Manager.htm>. BWF fields, ISRC, timestamp, UMID, loudness, coding history, peak and CD-index transfer. Supports C-036. **Limit:** recommends external EBU/SMPTE guidance and does not test round trips. **Why retained:** direct metadata/persistence detail.
- **S-016 - "Important for WIBU users: Sequoia 2026 trial - Sequoia 17/2025 implications," Boris FX Support, updated 2026-03-23.** <https://support.borisfx.com/hc/en-us/articles/43104527790093-Important-for-WIBU-users-Sequoia-2026-trial-Sequoia-17-2025-implications>. Trial/legacy WIBU interaction. Supports C-041. **Limit:** narrow transition case, not current EULA. **Why retained:** documents coexistence behavior.
- **S-017 - "How to install and activate license for Sequoia with the Boris FX Hub app," Boris FX Support, updated 2025-09-02.** <https://support.borisfx.com/hc/en-us/articles/39274402402061-How-to-install-and-activate-license-for-Sequoia-with-the-Boris-FX-Hub-app>. Hub/account/key activation and optional tools. Supports C-041, C-044. **Limit:** no seat/offline/transfer terms; installer was not fetched. **Why retained:** current acquisition-era activation path.
- **S-018 - "What happens to my existing Sequoia licenses?" Boris FX Support, updated 2025-10-01.** <https://support.borisfx.com/hc/en-us/articles/39014860055693-What-happens-to-my-existing-Sequoia-licenses>. Legacy MAGIX/WIBU license and side-by-side installs. Supports C-041. **Limit:** legacy scope only. **Why retained:** resolves current-versus-legacy licensing boundary.
- **S-019 - "Applying Effects Offline," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/Destruktive%20Effektberechnung.htm>. Realtime-to-offline, VIP copy/repoint/FX files, destructive waves, undo and extra samples. Supports C-011, C-029, C-033. **Limit:** no plugin callback/determinism details. **Why retained:** direct render/durability tradeoff.
- **S-020 - "MIDI in Sequoia," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/MIDI%20in%20_Programmname_.htm>. MIDI event/object semantics and creation methods. Supports C-013. **Limit:** no MIDI 2.0/timestamp detail. **Why retained:** canonical MIDI object definition.
- **S-021 - "MPE," Boris FX Sequoia 2026 online help.** <https://cdn.borisfx.com/borisfx/Documentation/sequoia-2026/en/Content/MPE.htm>. Per-note channels, pitch, pressure and CC74. Supports C-014. **Limit:** no VST3 note-expression/sample-timing contract. **Why retained:** exact expression evidence.
- **S-022 - "Boris FX Sequoia Transforms Immersive Audio Mixing with New Spatial Panner," Boris FX, 2026-08-06.** <https://blog.borisfx.com/press/boris-fx-sequoia-transforms-immersive-audio-mixing-with-new-spatial-panner>. 2026.5 date, panner, video, ARA/plugin improvements, pricing/update entitlement. Supports C-001, C-005, C-017, C-020, C-037, C-041, C-043, C-046-C-047. **Limit:** release marketing; no benchmark or conformance proof. **Why retained:** version-pinned current release source.
- **S-023 - "Licensing," VST 3 Developer Portal, Steinberg Media Technologies.** <https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html>. VST3 MIT obligations and VST2 redistribution/distribution boundary. Supports C-021, C-042. **Limit:** format-owner FAQ, not product EULA or legal advice. **Why retained:** authoritative implementation-rights boundary, preferable to third-party summaries.

### Negative and access results

- `NR-001`: Web search was rate-limited (HTTP 429); snippets were not used as
  evidence. Direct canonical URLs and official documentation were used instead.
- `NR-002`: Generated Sequoia manual default/index/TOC/sitemap endpoints returned
  access errors, while individual topics were public. They were not repeatedly
  retried.
- `NR-003`: Exact/guessed DDP, standalone PDC, score, SysEx, CMS and recovery
  topic URLs returned access errors. Product/manual equivalents were used when
  available; unsupported detail remains `UNKNOWN`.
- `NR-004`: Official support searches for Sequoia autosave/recovery and
  DDP/loudness/ADM returned no articles. This is negative search evidence only.
- `NR-005`: The release-notes aggregate exceeded the retrieval limit and was not
  retried; the dated 2026.5 release page provided the needed current scope.

**Retained source count:** 23 public primary URLs: 22 Boris FX URLs (15 manual
topics, 3 support articles, 2 press releases, 1 product page, and 1 documentation
index) plus 1 Steinberg format-owner URL; 0 secondary sources. Five negative/
access records were kept separately.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Available evidence | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- | --- |
| Scanner/runtime isolation and crash containment | Current scan/dialog topics omit process model | Security and reliability architecture | Failed scans persist and are skipped | Observe process tree with owned crash/timeout VST2/VST3 fixtures in disposable Windows VM | Unassigned |
| VST bitness/architecture bridging and signing | Current help gives folders, not binary policy | Migration/security scope | Windows host is 64-bit | Benign signed 32/64-bit fixtures; inspect documented logs/processes only | Unassigned |
| Duplicate identity, cache keys and reason taxonomy | Reset/cache workflow only; schema private | Diagnosability and migration | `VSTPlugins.ini`, failed rescan | Same-ID/different-path/version fixtures; record UI before/after scan | Unassigned |
| Missing/unlicensed plugin state and assets | Presets/templates checked; no placeholder topic | Project durability | Chains/templates retain positive state | Save/remove/resave/restore round trip with unique state and external asset | Unassigned |
| Dynamic I/O, PDC bounds, latency changes and tails | Routing/PDC/manual topics omit ABI timing | Render correctness | Static multi-out and known-latency compensation work | VST3 fixture varying buses/latency/tail across serial/parallel/sidechain graphs | Unassigned |
| Parameter IDs and sample-accurate automation/MIDI | Automation UI documented, timing absent | Recall and audible correctness | Track/object automation and MPE work | Dense sub-buffer automation/event fixture over realtime/offline/buffer sizes | Unassigned |
| Non-VST formats | Current affirmative set checked; no formal negative matrix | Scope/licensing cost | VST2/VST3/ARA only evidenced | Ask vendor for versioned matrix, then scan benign fixtures only for affirmative formats | Unassigned |
| Autosave, atomic save, recording/crash recovery | Support search and one-shot manual topics produced no result/access | Catastrophic data-loss risk | CMS backup and offline undo are narrower | Force termination during save/record in disposable project; checksum media and inspect recovery UI | Unassigned |
| Project schema, collect/relink and version migration | Project/template topics omit schema and guarantees | Long-term portability | Templates/multi-source projects documented | Version N/N+1 round trips with moved media and missing dependencies | Unassigned |
| CMS API, transactions, auth and failover | Product page only; private integration docs absent | Broadcast deployment/security | Database, incremental/differential save claimed | Vendor integration docs plus isolated test CMS with concurrent/failure cases | Unassigned |
| DDP/loudness/ADM conformance | Capability docs available; no test-vector results | Delivery correctness/certification | Named versions/standards and player | Official vectors and independent tools; compare metadata, checksum, meter tolerance | Unassigned |
| AAF/OMF round-trip fidelity | Product page names import/export only | Post interchange | Formats documented | Fixture matrix with fades, clip gain, automation, multichannel and missing media | Unassigned |
| Current licensing topology/EULA/offline use | Hub, product containers and legacy WIBU docs differ by generation | Procurement/deployment | Current and legacy paths documented | Obtain transaction-specific EULA, seats, transfer/offline/VM terms with counsel | Legal owner |
| Accessibility, privacy, trust and update rollback | Product/manual/support set contains no conformance/security policy | NFR acceptance | HDPI/generic UI only | Vendor VPAT/policies/SBOM/update docs, then assistive-tech and network audit | Unassigned |
| Full 2026.5 manual delta | Manual is labeled 2026; current product is 2026.5 | Version-specific edge behavior | Release page documents deltas | Obtain versioned 2026.5 release notes/manual without aggregate overfetch | Unassigned |

## 24. Curiosity pass and stop decision

Scores use 1 (low) to 4 (high); lower cost is better.

| Candidate follow-up | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| VST2 versus VST3 implementation licensing | 4 | 4 | 4 | 1 | **PURSUED:** Steinberg S-023 resolved the new-host legal boundary |
| Runtime isolation/bridge fixture | 4 | 4 | 4 | 4 | `CURIOSITY_NO_GO`: needs licensed disposable runtime and owned fixtures |
| Recovery/save-failure fixture | 4 | 4 | 4 | 4 | `CURIOSITY_NO_GO`: dynamic work outside documentary authority |
| DDP/loudness/ADM conformance vectors | 4 | 4 | 3 | 4 | `CURIOSITY_NO_GO`: later standards qualification, not more marketing search |
| Private broadcast CMS integration manuals | 4 | 3 | 4 | 4 | `CURIOSITY_NO_GO`: likely customer/vendor access; no bypass permitted |
| Repeated manual index/guessed-topic retrieval | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: access boundary and diminishing returns recorded |
| Community reliability reports | 2 | 1 | 2 | 3 | `CURIOSITY_NO_GO`: cannot prove architecture or incidence |
| Exhaustive bundled content inventory | 1 | 1 | 1 | 2 | `CURIOSITY_NO_GO`: high churn, low architecture value |
| Proprietary project/cache/CMS reverse engineering | 4 | 2 | 4 | 4 | `CURIOSITY_NO_GO`: prohibited by clean-room contract |

**Curiosity result.** S-023 changed the implementation conclusion: Sequoia's
current VST2 host support is useful compatibility evidence but cannot be copied
as a licensing assumption for a new host. VST3 has a current MIT SDK path;
VST2 distribution remains limited to qualifying legacy licensees. [C-042]

**Contradictions/gaps.** No unresolved direct contradiction exists among current
product and manual sources. Apparent tensions are scope differences: current Hub
activation versus legacy WIBU/container licensing; general PDC versus an
unqualified full plugin contract; CMS backup versus general project recovery;
and format/standards labels versus conformance. These are kept separate rather
than reconciled by inference. [C-009, C-029, C-032-C-044]

**Coverage check.** Every template section and format row is complete; current
identity, platform, object/project models, Hybrid engine, routing/automation,
VST2/VST3 scan/runtime/state/UI surface, mastering, broadcast, DDP, loudness,
BWF, ADM, AAF/OMF, recovery, security and licensing are covered or explicitly
unknown.

**Saturation check and stop decision.** Further documentary searches repeated
the same product/manual surfaces or hit generated-index access boundaries. The
remaining high-value questions require vendor/private integration documents,
controlling legal terms, standards vectors, or safe runtime fixtures.
`STOP - DOCUMENTARY_COVERAGE_SUFFICIENT_WITH_EXPLICIT_UNKNOWNS`. Twenty-three
primary sources were retained; no binary, installer, plugin or proprietary
project was downloaded or executed.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added only
  `research/daw-landscape/dossiers/magix-sequoia.md`; no shared or sibling file
  was changed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0 pins Sequoia 2026.5, Windows, entitlements and boundaries.
- [x] **Every required dossier heading exists in order.** Sections 0-25 and all
  11.x subsections follow `DOSSIER-TEMPLATE.md`.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-IDs; Section 21 resolves classifications.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  Sections 21 and 23.
- [x] **Every required plugin-format row is present.** All 13 rows appear in
  Section 11.1 with no blanks.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2-11.6 cover scanning, cache, failure, isolation, buses, MIDI,
  sidechain, multi-output, PDC, automation/state, UI and diagnostics.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Vendor specifications and negative searches are explicitly bounded.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 includes
  product and Steinberg format boundaries without legal advice.
- [x] **Bibliography records source rationale and limitations.** Section 22 has
  URL, publisher, kind/scope, claims, limits and selection rationale for S-001
  through S-023.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19
  and 24 record the pursued and rejected threads.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Public text documentation only; no installer/plugin/app
  execution.

**Checks performed:** governing-file/template audit; current-version and vendor
triangulation; 13-row format count; claim/source resolution review; two-source
pass audit; clean-room/licensing audit; pre-edit target `git status --short`.
**Concise result:** complete with explicit unknowns and 23 retained primary
sources. **Unresolved blockers:** proprietary host/CMS internals, formal
non-VST matrix, recovery behavior, standards conformance, exact licensing terms,
and runtime plugin qualification require vendor clarification or a later
disposable Windows fixture lab. **Pre-existing workspace changes:** left
untouched; only target-scoped status was inspected before creation.
