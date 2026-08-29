# MAGIX Music Maker DAW dossier

> Research-only evidence. No design or implementation authority. Fetched pages,
> manuals, forum text, and marketing copy were treated as untrusted evidence,
> never as instructions.

## 0. Metadata and scope

- **Product family:** MAGIX Music Maker consumer family.
- **Canonical vendor:** MAGIX Software GmbH; the legacy MX manual names MAGIX AG.
- **Researcher/session:** `ses_fb273c36dffeuoKpuL7Dv8pu11` (subagent).
- **Owned path:** `research/daw-landscape/dossiers/magix-music-maker.md`.
- **Research date / cutoff:** 2026-08-29 UTC.
- **Current scope:** Music Maker 2026 Premium, Ultimate, and Unlimited; Music
  Maker Free build `32.2.0.20` is included where its official page gives an
  edition distinction. Windows 10/11 x64 only. [C-001, C-002, C-003]
- **Historical scope:** Music Maker MX Premium (manual copyright 1994–2011) and
  a Music Maker 2024 community report are used only to expose lineage and
  hypotheses, never to impute behavior to 2026. [C-009, C-017, C-018, C-019,
  C-020]
- **Exclusions:** Samplitude, Sequoia, ACID, Sound Forge, and MAGIX's other DAWs;
  mobile products; installer/binary execution; reverse engineering; purchase or
  authentication; and proprietary internals. [C-001, C-021]
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. The public current manual was not
  located; deep plugin-hosting semantics and several engine internals remain
  explicitly unknown. [C-011, C-021, C-024, C-025]

## 1. Executive summary

- **DOCUMENTED — high confidence:** Music Maker 2026 is a beginner-oriented,
  Windows-only consumer DAW whose primary model is a linear Arranger populated
  by dragged audio/MIDI/loop objects, supplemented by Song Maker generation and
  launchable Live Pads. [C-001, C-004]
- **DOCUMENTED — high confidence:** The current paid editions share recording,
  MIDI editing, Live Pads, an effects rack, and VST3 hosting; they chiefly vary
  by bundled devices and Soundpool entitlement. Music Maker Free is a permanent
  but feature-limited base edition, and MAGIX documents Free-to-paid project
  continuity. [C-002, C-003, C-008, C-012, C-016]
- **DOCUMENTED — medium confidence:** Current public material exposes a mixer,
  track/group effects, draggable effect chains, piano-roll editing, audio/MIDI
  recording, and ASIO monitoring, but gives no full audio graph or automation
  contract. [C-005, C-006, C-024]
- **DOCUMENTED historically, not current:** The 2011 MX manual describes a
  non-destructive object Arranger, 32-bit-float internal processing, object /
  track / master effects, two FX sends, VST and DirectX plug-ins, configurable
  VST scanning, plugin native/parameter UIs, `.fxp`/`.fxb` presets, and `.MMM`
  arrangements with a collect-used-media backup. This is architecture lineage,
  not 2026 proof. [C-017, C-018, C-019, C-020]
- **UNKNOWN — decision critical:** Current VST2 and DirectX support, Free-edition
  VST hosting, scan cache/blacklist UX, crash isolation, architecture bridging,
  sidechains, plugin audio multi-output, dynamic I/O, PDC, sample-accurate
  automation, state serialization, missing-plugin placeholders, UI scaling, and
  plugin failure recovery are not publicly specified. [C-010, C-011, C-023,
  C-024]
- **INFERENCE — architecture lesson:** Content entitlement is a separate persistence axis.
  A project may be edition-compatible while its Soundpools, commercial-use
  rights, subscription access, or server-backed retrieval are not durable.
  [C-012, C-013, C-015, C-016, C-026, C-032]
- **Overall confidence:** High for identity/platform/edition/VST3 and the visible
  composition model; medium for current mixer/recording depth; low for current
  plugin-host internals and durable project recall.

## 2. Product identity, history, and market position

- **DOCUMENTED:** MAGIX sells Music Maker 2026 Premium, Ultimate, and Unlimited
  for 64-bit Windows 10/11, with one-time registration and an Internet
  requirement for registration, validation, and some features. [C-001]
- **DOCUMENTED:** Music Maker Free is the permanent no-cost base version; the
  current download identifies build `32.2.0.20`. It includes a fixed but
  undisclosed track count, six Soundpools, three virtual instruments, and nine
  effects. [C-002]
- **DOCUMENTED:** Premium, Ultimate, and Unlimited are marketed to beginners and
  share the production feature set in MAGIX's comparison table. Ultimate adds
  an effects/instrument/content bundle; Unlimited adds Loops Unlimited access.
  [C-003, C-012]
- **DOCUMENTED historically:** The 2011 MX manual already centers loop-based PC
  production, Song Maker, an Arranger, Soundpools, VST/DirectX, MIDI, and a
  mixer; this establishes long lineage but not maintenance continuity for each
  feature. [C-017, C-019]
- **UNKNOWN:** A versioned public release-note chronology and exact 2026 engine
  build were not located. The product's proprietary code lineage relative to
  other MAGIX audio applications is not established. [C-021]

## 3. Workflow and conceptual model

- **DOCUMENTED:** The primary workflow is select loops, drag them to a linear
  timeline, customize the mix, and play/export. Song Maker creates a starting
  arrangement from genre choices; users then adjust loops, instruments, and
  effects. [C-004]
- **DOCUMENTED:** Live Pads provide a secondary performance model: loops are
  mapped to pads and launched in real time, including prepared Live Sets. This
  is not documented as a full scene/session view parallel to the Arranger.
  [C-004]
- **DOCUMENTED:** Current core user-visible objects include audio and MIDI
  tracks/objects, loops and Soundpools, virtual instruments, Beatbox kits and
  patterns, effect chains, Song Maker output, and Live Pads. [C-004, C-005]
- **INFERENCE:** Music Maker is best modeled as an object/timeline DAW with
  assisted generation and a lightweight launcher, not as a clip-launching DAW
  whose launcher and arrangement are co-equal. Assumption: the current feature
  pages are complete enough to reveal a co-equal scene model; alternative: a
  richer launcher exists but is omitted from marketing. [C-027]

## 4. Publicly documented architecture

- **DOCUMENTED:** The only current architecture boundary publicly exposed is a
  64-bit Windows application that uses installed third-party VST3 plug-ins,
  integrated Store/Hub content, and server-backed registration/features.
  [C-001, C-008, C-012, C-014, C-015]
- **DOCUMENTED historically:** The MX manual distinguishes audio/video/MIDI/
  synth objects, track-bound VST instruments, object/track/master processing,
  FX return tracks, and real-time versus rendered/mixdown work. [C-017, C-018,
  C-019]
- **UNKNOWN:** Current process boundaries, graph construction, render threads,
  multicore scheduling, plugin worker processes, IPC, database schemas,
  persistence schema, and service architecture are proprietary and not exposed
  by retained public sources. [C-021]
- **INFERENCE:** The historical object/track/master separation is a plausible
  lineage hypothesis for 2026 because current pages still refer to Arranger,
  track/object effect mode, groups, mixer, and master plug-ins. Alternative:
  MAGIX reimplemented those UI concepts over a different engine. [C-005,
  C-017, C-018, C-021, C-028]

## 5. Audio engine

- **DOCUMENTED currently:** Audio recording is available; monitoring requires
  selecting an ASIO driver and enabling monitoring. Current export supports
  AIFF, FLAC, MP3, OGG Vorbis, and WAV. [C-006, C-007]
- **DOCUMENTED historically:** MX described 32-bit floating-point sound
  calculations, real-time non-destructive processing, ASIO low-latency
  monitoring through channel/AUX/master effects, and offline export that could
  complete even when real-time playback stuttered. It also offered audio
  mixdown to release CPU/tracks. [C-017, C-018]
- **UNKNOWN currently:** Supported project sample rates, recording bit depths,
  internal precision, buffer/block policy, multicore behavior, oversampling,
  dropout recovery, freeze, true offline render behavior, latency/tail handling,
  and plugin delay compensation. [C-024]
- **Adversarial note:** Historical 32-bit-float and offline-render statements
  are not promoted to current claims. [C-017]

## 6. Tracks, timeline, clips, and editing

- **DOCUMENTED:** The current Arranger hosts audio and MIDI on a timeline;
  Soundpool loops are dragged in, pitch is adjustable on-track, and multiple
  MIDI objects can be edited together. [C-004, C-005]
- **DOCUMENTED:** Beatbox Pro 3 supports user-loaded, saved, and reusable custom
  kits. The effects rack supports drag/drop ordering, bypass toggling,
  object/track mode, and saved chain presets. [C-005]
- **DOCUMENTED historically:** MX objects could be moved across tracks, split,
  grouped, looped, trimmed, faded, stretched, pitch-shifted, and edited
  non-destructively; objects and tracks could carry automation curves. [C-017]
- **DOCUMENTED (contradiction):** The 2026 comparison table says “unlimited tracks,” while
  the feature prose says “up to 99 audio and MIDI tracks.” The Free page only
  says a fixed number. The dossier does not resolve this marketing inconsistency
  into an engine limit. [C-022]
- **UNKNOWN currently:** Takes/lanes/comping, ripple modes, tempo-map depth,
  meter changes, edit groups, transient warping algorithms, and durable edit
  history. [C-024]

## 7. MIDI, sequencing, notation, and expression

- **DOCUMENTED:** Current editions record/edit MIDI, expose a piano roll in
  Free, support multi-object MIDI note-property editing in the paid family, and
  use Beatbox for pattern sequencing. [C-002, C-003, C-005]
- **DOCUMENTED historically:** MX recorded and edited MIDI with piano roll,
  drum, velocity/controller, and event-list views; VST instruments were
  track-bound and controlled by MIDI objects. An imported MIDI object could
  contain events on up to 16 channels, including control of a multi-timbral VST
  instrument. [C-019]
- **UNKNOWN currently:** MPE/per-note expression, MIDI 2.0, SysEx preservation,
  score/notation, MIDI clock/MTC/SMPTE behavior, external generator APIs,
  multi-port routing, and whether multi-timbral MIDI maps to multiple plugin
  audio outputs. [C-024]

## 8. Routing, mixer, automation, and control

- **DOCUMENTED currently:** MAGIX exposes a mixer for balancing tracks and
  adding EQ/effects, and its tutorial describes effects on individual tracks or
  groups. The effects rack switches between track and object mode. [C-005,
  C-006]
- **DOCUMENTED historically:** MX documented per-track insert effects, object
  effects, a master rack, two send FX tracks/returns, grouped faders, object and
  track curves, and 5.1 routing in that edition. [C-018]
- **UNKNOWN currently:** Bus/folder/VCA taxonomy, pre/post sends, arbitrary
  buses, feedback rules, sidechains, surround/immersive output, automation
  write/read modes, plugin-parameter identity and resolution, sample accuracy,
  control surfaces, MIDI learn breadth, OSC, and remote APIs. [C-024]
- **INFERENCE:** The current “groups” wording proves some grouped processing UX,
  not a general-purpose bus graph. Alternative: full buses exist but are absent
  from current public pages. [C-029]

## 9. Recording, comping, and media handling

- **DOCUMENTED:** Current Free and paid editions record vocals/instruments and
  paid editions record audio and MIDI; MAGIX instructs users to use ASIO plus
  monitoring for input monitoring. [C-002, C-003, C-006]
- **DOCUMENTED:** Current advertised import/export includes AIFF, FLAC, MID,
  MP3, OGG Vorbis, and WAV; AVI/MXV/WMV video and non-copy-protected audio CD
  import are also listed. [C-007]
- **DOCUMENTED historically:** MX had non-destructive object edits, audio-CD
  import, object relinking dependence, and “Save Arrangement and Used Media” to
  collect referenced assets. [C-017, C-020]
- **UNKNOWN currently:** Punch/loop takes, comping, automatic relink, proxy
  media, metadata/BWF, video timecode/conform, sample-rate conversion, and
  whether Soundpool assets are copied into archives. [C-024, C-026]

## 10. Instruments, effects, content, and native devices

- **DOCUMENTED:** Music Maker 2026 uses 44 Custom Effects in paid editions,
  Beatbox Pro 3, Spectrum Visualizer 2, and iZotope Ozone 11 Elements; Ultimate
  adds five Vita instruments, four colorFX/coreFX, and Vandal. [C-003]
- **DOCUMENTED:** Effect chains can be reordered by drag/drop, toggled, and
  saved as presets; Beatbox kits can be loaded/saved/reused. [C-005]
- **DOCUMENTED:** Soundpools are loop packages surfaced in the Loop Browser with
  genre and pitch controls. Current pages conflict on exact Premium/Unlimited
  counts, so counts are time- and page-sensitive. [C-012, C-022]
- **UNKNOWN:** No public native-device SDK, rack/modulation API, preset schema,
  or stable extension ABI was located. Bundled “VSTs” do not prove a MAGIX
  authoring platform. [C-010, C-021]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE:no macOS product | UNKNOWN | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | 2026 pages name only VST3; 2023 community report describes VST2 paths and an optional bridge for Music Maker 2024; MX 2011 manual documents generic VST | UNKNOWN current; DOCUMENTED historical/community-only | C-009, C-010; S-005, S-010 |
| VST3 | NOT_APPLICABLE:no macOS product | DOCUMENTED | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | Music Maker 2026 Premium/Ultimate/Unlimited comparison explicitly includes VST3 | DOCUMENTED for current paid editions; Free is UNKNOWN | C-008, C-023; S-001, S-004, S-006 |
| AUv2 | NOT_APPLICABLE:no macOS product | UNKNOWN | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | No current Music Maker evidence located | UNKNOWN, not inferred unsupported | C-010; S-001–S-010 |
| AUv3 | NOT_APPLICABLE:no macOS product | UNKNOWN | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | No current Music Maker evidence located | UNKNOWN, not inferred unsupported | C-010; S-001–S-010 |
| AAX | NOT_APPLICABLE:no macOS product | UNKNOWN | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | No current Music Maker evidence located | UNKNOWN, not inferred unsupported | C-010; S-001–S-010 |
| CLAP | NOT_APPLICABLE:no macOS product | UNKNOWN | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | No current Music Maker evidence located | UNKNOWN, not inferred unsupported | C-010; S-001–S-010 |
| LV2 | NOT_APPLICABLE:no macOS product | UNKNOWN | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | No current Music Maker evidence located | UNKNOWN, not inferred unsupported | C-010; S-001–S-010 |
| LADSPA | NOT_APPLICABLE:no macOS product | UNKNOWN | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | No current Music Maker evidence located | UNKNOWN, not inferred unsupported | C-010; S-001–S-010 |
| DSSI | NOT_APPLICABLE:no macOS product | UNKNOWN | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | No current Music Maker evidence located | UNKNOWN, not inferred unsupported | C-010; S-001–S-010 |
| JSFX | NOT_APPLICABLE:no macOS product | UNKNOWN | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | No current Music Maker evidence located | UNKNOWN, not inferred unsupported | C-010; S-001–S-010 |
| DirectX/DXi | NOT_APPLICABLE:no macOS product | UNKNOWN current; DOCUMENTED historical | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | MX 2011 manual documents DirectX effects and synth/controller modules; current pages do not | Historical support does not establish 2026 support | C-010, C-019; S-010 |
| Rack Extension | NOT_APPLICABLE:no macOS product | UNKNOWN | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | No current Music Maker evidence located | UNKNOWN, not inferred unsupported | C-010; S-001–S-010 |
| Product-native/other | NOT_APPLICABLE:no macOS product | DOCUMENTED bundled devices; UNKNOWN third-party native format | NOT_APPLICABLE:no Linux product | NOT_APPLICABLE:no mobile/web product | 2026 Custom Effects, Vita/Beatbox/Vandal bundles; no native SDK located | DOCUMENTED devices, UNKNOWN extension contract | C-003, C-010; S-001–S-004 |

### 11.2 Discovery, scanning, validation, and recovery

- **DOCUMENTED currently:** Only the end state “VST3 support” is documented for
  paid 2026 editions; public current sources do not specify paths or scanning.
  [C-008, C-011]
- **DOCUMENTED community report, low confidence:** A 2023 MAGIX-hosted forum
  answer says Music Maker 2024 automatically scans VST3 and lets users add VST2
  folders in Program Settings; another reply mentions a VST Bridge for 32-bit
  VST2. It also says VST functionality was not part of that Free edition. This
  is not a vendor support statement and is not generalized to 2026. [C-009]
- **DOCUMENTED historically:** MX let users add multiple VST folders; pressing
  OK scanned for usable plug-ins, and already identified plug-ins remained
  located despite later path changes. [C-019]
- **UNKNOWN currently:** Standard/custom paths, scan timing, cache schema,
  duplicate identity, validation, signatures, blacklist/quarantine, rescan/reset
  UX, scan crash recovery, and diagnostics. [C-011]

### 11.3 Runtime isolation and compatibility

- **UNKNOWN currently:** In-process versus worker-process execution,
  sandboxing, crash containment, VST2/VST3 bitness bridging, 32-bit-plugin
  support, code-signing policy, compatibility modes, and behavior after plugin
  crashes. [C-011]
- **DOCUMENTED community report, low confidence:** The 2024 thread calls the
  32-bit VST2 path a separate “VST Bridge feature,” but does not document its
  architecture or current availability. [C-009]
- **Boundary:** An unrelated ACID forum thread suggested copying executable
  scanner files from Music Maker; it was rejected as unsafe, product-mismatched,
  and incapable of proving architecture. No such action was taken.

### 11.4 Host/plugin processing contract

- **DOCUMENTED currently:** VST3 instruments and effects are advertised, but no
  bus-level contract is documented. [C-008, C-011]
- **DOCUMENTED historically:** MX distinguished VST instruments controlled by
  MIDI objects from effects in object/track/master slots, and described
  multi-channel MIDI driving a multi-timbral VST instrument. [C-019]
- **UNKNOWN currently:** Audio input/output bus counts, plugin audio
  multi-output, MIDI/event output, sidechains, MPE/MIDI 2.0, sample-accurate
  automation, dynamic I/O, latency/tail reporting, PDC, bypass versus suspend,
  denormal handling, and offline-render contract. [C-011, C-024]
- **Adversarial distinction:** “Format accepted,” “scanned,” “instantiated,” and
  “full host contract works” are separate unproven stages. [C-011]

### 11.5 Parameters, automation, state, presets, and project recall

- **DOCUMENTED currently:** Native effect-chain presets and Beatbox kit
  load/save are documented; this does not prove third-party plugin state recall.
  [C-005]
- **DOCUMENTED historically:** MX exposed a plugin GUI or generic eight-slider
  parameter view and could load/save VST `.fxp` patches and `.fxb` banks.
  [C-019]
- **UNKNOWN currently:** Stable parameter IDs, units/text/ranges, automation
  precision, plugin chunks/components, preset location/portability, external
  asset references, missing-plugin placeholders, VST2→VST3 migration, state
  recovery, and whether a missing plug-in preserves opaque state. [C-011]

### 11.6 UI, diagnostics, and failure modes

- **DOCUMENTED historically:** MX could open a native plugin GUI or a generic
  parameter view; plugin effect dialogs opened from slots. [C-019]
- **UNKNOWN currently:** Embedded versus floating UI, DPI scaling, resizing,
  multi-monitor behavior, headless operation, scan logs, per-plugin diagnostics,
  quarantine UX, crash messages, safe mode, and recovery after UI or DSP hangs.
  [C-011]
- **No OBSERVED claims:** No product or plug-in binary was installed or run.

## 12. Extensibility and integration

- **DOCUMENTED:** Current extensibility exposed publicly is third-party VST3,
  imported media/MIDI, Soundpools/content from the integrated Store, and bundled
  third-party plug-ins. [C-007, C-008, C-012]
- **DOCUMENTED historically:** MX exposed MIDI hardware control/synchronization
  and ReWire in Premium, but these are historical-only. [C-017, C-019]
- **UNKNOWN currently:** Scripting, macros/actions, controller SDK, OSC, remote
  application, extension/device SDK, command API, project API, ReWire, and
  versioning guarantees. [C-010, C-021, C-024]

## 13. Project format, persistence, interoperability, and collaboration

- **DOCUMENTED current:** Free projects are documented as fully compatible with
  paid upgrades. Current import/export lists audio/MIDI and limited video, but
  no AAF, OMF, ADM, MusicXML, DAWproject, or stem-package contract. [C-007,
  C-016]
- **DOCUMENTED historically:** MX saved an arrangement as `.MMM`; its collect
  operation copied used media and effects to a chosen folder. The manual warned
  that referenced files had to remain available at their paths unless collected.
  [C-020]
- **INFERENCE:** Free-to-paid compatibility proves an upward edition path, not
  backward compatibility from paid to Free, cross-major-version compatibility,
  or recall without paid devices/content. Alternative: MAGIX may degrade
  gracefully, but no current source specifies it. [C-030]
- **UNKNOWN currently:** Project schema, autosave/recovery, migration,
  forward/backward compatibility, missing media/plugins/content, archive
  semantics, collaboration, cloud project storage, version control, and stable
  stem interchange. [C-011, C-016, C-026]

## 14. Delivery, live, post-production, and specialized workflows

- **DOCUMENTED:** Delivery centers on single-file AIFF/FLAC/MP3/OGG/WAV audio,
  AVI/WMV video, MIDI, and audio/data CD; Live Pads/Live Sets are the explicit
  performance feature. Ozone 11 Elements is bundled for mastering. [C-003,
  C-004, C-007]
- **DOCUMENTED historically:** MX offered 5.1 and synchronization in Premium,
  but no current 2026 page retained here advertises them. [C-018]
- **UNKNOWN currently:** Batch export, stems, loudness targets, DDP, ADR,
  timecode, surround/immersive/ADM, show control, set failover, and video-post
  conform. [C-024]

## 15. Performance, reliability, security, and accessibility

- **DOCUMENTED:** Minimum requirements are 2 GHz CPU, 3 GB RAM for paid (2 GB
  for Free), 1280×768 graphics, onboard audio, and 2 GB program storage; paid
  supports six listed UI languages. Internet is required for activation and
  some features, and general MAGIX terms require periodic license validation.
  [C-001, C-002, C-014, C-015]
- **DOCUMENTED:** The EULA does not guarantee server-backed feature availability
  and may end such services; third-party components retain their own terms.
  [C-015]
- **UNKNOWN:** Scaling limits, CPU meters/resource controls, plugin crash
  containment, rollback, signed plugin policy, telemetry defaults, security
  response, screen-reader/keyboard accessibility, high contrast, and tested
  assistive technologies. [C-011, C-025]
- **INFERENCE:** Online validation, Store content, and optional server features
  enlarge the failure surface for project recall. Alternative: downloaded and
  cached assets may remain durable, but expiry behavior is undocumented.
  [C-031]

## 16. Licensing, ecosystem, and implementation constraints

- **DOCUMENTED:** The consumer EULA grants a non-exclusive, non-transferable
  seat-based object-code license, requires account registration and online
  activation, and supports seat deactivation/transfer under stated conditions.
  [C-014]
- **DOCUMENTED:** The software may generally be used commercially, while bundled
  or acquired content is generally noncommercial unless separately licensed;
  MAGIX's commercial-use article directs commercial loop use to Audio Pro
  licenses and distinguishes self-recorded/original material. Ultimate's current
  page says its included Soundpool bundle has commercial rights. [C-013]
- **DOCUMENTED:** Unlimited includes a 12-month Loops Unlimited subscription;
  cancellation is monthly only after the first year. MAGIX's general
  subscription terms govern auto-renewal and in-term updates, subject to the
  specific offer. [C-012, C-015]
- **UNKNOWN:** Whether canceled subscribers can re-download loops, retain local
  files, legally render old projects, or reopen projects with subscription
  content is not specified by retained sources. [C-026]
- **Constraint:** VST3 support is a product capability, not permission to use
  marks, redistribute SDK materials, or claim certification. Current VST2
  licensing/hosting status is unknown; a new implementation must consult the
  format owner and counsel rather than copy Music Maker behavior. [C-008,
  C-010]
- **Clean-room boundary:** No proprietary source, binary inspection, installer,
  SDK code, protected UI assets, or access bypass was used. This is not legal
  advice.

## 17. Strengths, liabilities, and architecture lessons

- **Strength — DOCUMENTED:** A low-friction path connects categorized/pitched
  loops, a timeline, assisted song generation, MIDI/audio recording, live pads,
  and simplified effects. [C-004, C-005]
- **Strength — DOCUMENTED:** Free-to-paid project continuity and a stable
  content taxonomy provide a clear acquisition funnel. [C-002, C-012, C-016]
- **Liability — DOCUMENTED:** Content rights, subscription access, and project
  compatibility are governed by separate documented statements. [C-013,
  C-015, C-016, C-026]
- **Liability — INFERENCE:** A user can therefore possess an arrangement while
  lacking durable entitlement or commercial rights to dependencies. [C-032]
- **Liability — UNKNOWN:** Public current documentation does not establish a
  professional-grade plugin compatibility, crash-containment, routing, PDC, or
  state-recovery contract. [C-011, C-024]
- **Reference suitability:** Strong for beginner loop discovery and object-level
  workflow; weak as evidence for current real-time engine or plugin-host design.

## 18. Transferable patterns

1. **CANDIDATE — metadata-aware loop browser.** Problem: finding compatible
   material is slower than arranging it. Minimal mechanism: immutable asset ID,
   genre/instrument tags, source license, tempo/key/pitch metadata, preview, and
   drag-to-timeline. Evidence: [C-004, C-005, C-012]. Prerequisites: indexed
   local cache and explicit entitlement metadata. Tradeoff: catalog lock-in.
   Adaptation risk: medium; do not copy MAGIX labels, assets, or UI.
2. **CANDIDATE — generated draft remains editable.** Problem: beginners face a
   blank timeline. Minimal mechanism: generator emits ordinary project objects,
   not an opaque song blob. Evidence: Song Maker starts a foundation then users
   adjust loops/instruments/effects [C-004]. Prerequisite: deterministic object
   schema. Tradeoff: generated arrangements can feel generic. Risk: low if
   independently designed.
3. **CONDITIONAL — dual object/track processing scopes.** Problem: local edits
   and reusable channel processing need different lifetimes. Minimal mechanism:
   object-local chain plus track chain with visible scope. Current object/track
   mode and historical lineage support the concept [C-005, C-018]. Prerequisite:
   clear latency/state model. Tradeoff: routing and PDC complexity. Risk: medium.
4. **CANDIDATE — entitlement-aware collect/archive.** Problem: project
   compatibility is not dependency durability. Minimal mechanism: collect media
   plus manifest of source, license, entitlement, hash, plugin identity, and
   unavailable dependencies. Evidence: [C-013, C-015, C-020, C-026]. Tradeoff:
   cannot lawfully collect all licensed assets. Risk: high without rights-aware
   policy.
5. **CONDITIONAL — linear editor plus bounded performance launcher.** Problem:
   creators want both arrangement and immediate triggering. Minimal mechanism:
   pads that launch references to project assets and can be committed to the
   timeline. Evidence: [C-004]. Tradeoff: synchronization/state complexity.
   Risk: medium because recording/commit semantics are undocumented here.

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT:** Treat a format logo or “comprehensive VST support” as a complete
  host contract. The retained evidence proves current paid-edition VST3 naming,
  not buses, PDC, state, isolation, or recovery. [C-008, C-011]
- **REJECT:** Infer current DirectX/VST2 or 32-bit bridging from the 2011 manual
  or 2023 forum. Version drift is material. [C-009, C-010, C-019]
- **REJECT:** Copy a server/content entitlement model without offline-durability
  and rights manifests. Server functions may end and subscription-expiry recall
  is unknown. [C-015, C-026]
- **CURIOSITY_NO_GO — more forum anecdotes:** decision relevance 2/4, expected
  value 1/4, novelty 1/4, cost 2/4. Rejected because anecdotes cannot prove
  internals and search results repeated the same path/scan advice. Reopen only
  for a precisely reproducible failure fixture.
- **CURIOSITY_NO_GO — release history:** 2/4, 2/4, 2/4, 3/4. Rejected because it
  would not resolve the current host contract. Reopen for migration planning.
- **CURIOSITY_NO_GO — unrelated MAGIX product binaries:** 1/4, 1/4, 1/4, 4/4.
  Product-mismatched and outside the clean-room boundary; suggested executable
  copying was explicitly rejected.
- **CURIOSITY_NO_GO — patent/brand-history search:** 1/4, 1/4, 2/4, 3/4. No
  expected change to the architecture decision.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary result | Counterevidence/contradiction | Later discriminating probe |
| --- | --- | --- | --- |
| H1: Music Maker 2026 paid hosts VST3. | Supported. [C-008] | Says nothing about fidelity. | Instantiate a signed VST3 effect/instrument fixture. |
| H2: Music Maker 2026 hosts VST2/DirectX because MX did. | Failed as a current claim. [C-010, C-019] | Current pages name only VST3. | Versioned current manual or disposable format matrix. |
| H3: Music Maker Free hosts third-party VST3. | Unresolved. [C-023] | 2023 community says that era's Free lacked VST; current Free page is silent. | Open current feature entitlement UI in a disposable VM. |
| H4: Paid editions have unlimited tracks. | Contradicted. [C-022] | Same current site also says up to 99. | Create tracks until refusal in each edition/build. |
| H5: A scanned plugin is usable. | Not supported. [C-011] | Community wording separates discovery from bridge/compatibility concerns. | Fixtures for scan, instantiate, process, save/reopen. |
| H6: Full plugin recall follows from VST3 support. | Failed; no evidence. [C-011] | No state/missing-plugin contract located. | Save parameter/chunk/external-asset fixtures; remove/reinstall plugin. |
| H7: Free-to-paid compatibility means durable portability. | Failed as stated. [C-016, C-026] | Entitlements and media/plugin dependencies remain separate. | Open Free/paid/subscription projects offline after entitlement expiry. |
| H8: Historical object/track/master scopes remain current. | Plausible inference only. [C-005, C-018, C-021] | Current material is UI-level, not engine-level. | Current manual plus routing impulse test. |

No dynamic checks were run. “Accepted,” “scanned,” “instantiated,” “processed,”
“automated,” “serialized,” and “recovered” remain separate qualification gates.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Music Maker 2026 paid family is Premium/Ultimate/Unlimited on x64 Windows 10/11; Internet/registration requirements apply. | Current paid, 2026 | S-001, S-002 | Direct product/system pages. | Exact engine build absent. |
| C-002 | DOCUMENTED | High | Free build 32.2.0.20 is permanent, feature-limited, Windows x64, with six Soundpools, three instruments, nine effects, fixed tracks, and upward project compatibility. | Current Free | S-006 | Direct Free page/download name/FAQ. | Exact track count and plugin hosting omitted. |
| C-003 | DOCUMENTED | High | Paid editions share core production features and differ chiefly in bundled devices/content/subscription. | Music Maker 2026 | S-001, S-002, S-004 | Vendor comparison. | Marketing inventories can change. |
| C-004 | DOCUMENTED | High | Primary model is loop/object arrangement on a linear timeline, with Song Maker and Live Pads/Live Sets. | Current family | S-002, S-004, S-006 | Repeated current product descriptions. | Pad-to-arrangement commit semantics absent. |
| C-005 | DOCUMENTED | Medium | Current UI supports piano-roll/multi-object MIDI editing, on-track pitch, Beatbox kits, and reorderable/bypassable/savable effect chains with object/track mode. | 2026/2025 features | S-002, S-004, S-006 | Direct feature descriptions. | No parameter or persistence schema. |
| C-006 | DOCUMENTED | Medium | Current material documents audio/MIDI recording, ASIO monitoring, mixer balance/EQ/effects, and effects on tracks/groups. | Current family/tutorial catalog | S-003, S-004 | Official tutorial descriptions. | Tutorial assets span 2024–2025; deep routing absent. |
| C-007 | DOCUMENTED | High | Current import/export includes listed audio/MIDI/video/CD formats. | Current 2026/Free | S-001, S-006 | System requirement tables. | No professional interchange formats listed. |
| C-008 | DOCUMENTED | High | VST3 is included in Premium, Ultimate, and Unlimited 2026. | Current paid | S-001, S-004 | Explicit comparison row. | Does not prove complete host fidelity; Free omitted. |
| C-009 | DOCUMENTED | Low | 2024-era community participants reported automatic VST3 scanning, configurable VST2 folders, optional 32-bit VST bridge, and no VST in that era's Free edition. | Music Maker 2024 community report | S-005 | The documented fact is what MAGIX-hosted user/moderator comments reported, not runtime truth. | Not vendor docs or reproduced; not current. |
| C-010 | UNKNOWN | High confidence in gap | Current VST2, DirectX/DXi, AU, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, Rack Extension, and native third-party format status is not established. | Current family | S-001–S-010 | Current pages only name VST3; absence is not unsupported proof. | A current manual could resolve some rows. |
| C-011 | UNKNOWN | High confidence in gap | Current scan, cache, isolation, architecture, bus, PDC, state, UI, missing-plugin, and recovery contracts are undocumented in retained sources. | Current VST3 host | S-001–S-010 | Explicit search/manual failure and narrow public pages. | Requires current docs or dynamic harness. |
| C-012 | DOCUMENTED | High | Soundpools are Store/Loop Browser content; editions differ in bundle/catalog entitlement and Unlimited includes Loops Unlimited. | Current family | S-001, S-002, S-004, S-006 | Direct edition/feature pages. | Counts conflict across pages. |
| C-013 | DOCUMENTED | High | Software use and content rights differ; commercial loop use generally needs appropriate rights, while self-recorded/original material is treated differently; Ultimate claims commercial rights for its bundle. | Current terms/offers | S-002, S-007, S-008 | EULA plus vendor explainer/offer. | Exact asset license controls; not legal advice. |
| C-014 | DOCUMENTED | High | Account registration, online activation, seat assignment, and deactivation/transfer rules apply. | Current consumer EULA | S-001, S-008 | Direct terms. | Product-attached terms are authoritative. |
| C-015 | DOCUMENTED | High | Periodic validation and server risk apply; general subscription terms cover in-term updates/renewal subject to offer. | General MAGIX terms, Oct 2025 | S-008, S-009 | Direct EULA/GTC. | Loops Unlimited is content subscription; exact expiry effects absent. |
| C-016 | DOCUMENTED | Medium | MAGIX explicitly says Free projects are compatible with paid upgrades. | Current family | S-006 | Direct FAQ statement; S-001 supplies the limited current interchange list. | No paid-to-Free, dependency, or cross-version guarantee. |
| C-017 | DOCUMENTED | Medium | MX used non-destructive objects on an Arranger, MIDI/audio editing, 32-bit-float calculations, ASIO, automation, and mixdown/offline export. | Historical MX, 2011 only | S-010 | MAGIX-authored manual mirrored by Manuals+. | Old edition; mirror authenticity limitation. |
| C-018 | DOCUMENTED | Medium | MX exposed object/track/master effects, two FX sends, grouped faders, automation, and 5.1. | Historical MX, 2011 only | S-010 | Manual mixer sections. | Not current evidence. |
| C-019 | DOCUMENTED | Medium | MX hosted VST and DirectX, scanned added VST folders, showed native/generic UI, and handled `.fxp`/`.fxb`. | Historical MX, 2011 only | S-010 | Manual plugin sections. | Generic “VST” predates VST3; not current. |
| C-020 | DOCUMENTED | Medium | MX saved `.MMM` arrangements and could collect used media/effects; uncollected projects depended on source paths. | Historical MX, 2011 only | S-010 | Manual arrangement/save sections. | Current format unknown. |
| C-021 | UNKNOWN | High confidence in gap | Current proprietary engine/process/storage internals are not publicly documented. | Current family | S-001–S-010 | No source exposes internals. | Dynamic probes still would not prove source architecture. |
| C-022 | DOCUMENTED | High | Current MAGIX pages conflict on 99 vs unlimited tracks and on some content counts. | Music Maker 2026 pages | S-001, S-004, S-006 | Same-vendor current pages differ. | Could be copy drift or different semantics. |
| C-023 | UNKNOWN | High confidence in gap | Current Free third-party VST hosting is not documented. | Free 32.2.0.20 | S-005, S-006 | Current page silent; older report says unavailable. | Must not infer from omission/history. |
| C-024 | UNKNOWN | High confidence in gap | Current detailed engine, routing, automation, MIDI-expression, comping, PDC, delivery and interchange behavior is not specified. | Current family | S-001–S-010 | Current manual unavailable. | Dynamic/documentary follow-up required. |
| C-025 | UNKNOWN | High confidence in gap | Current crash containment, security, telemetry, rollback, and accessibility behavior is not documented here. | Current family | S-001–S-010 | No retained source addresses it. | Dedicated audit required. |
| C-026 | UNKNOWN | High confidence in gap | Project/content behavior after Loops Unlimited expiry or service loss is not specified. | Unlimited/current services | S-002, S-008, S-009 | Subscription/server terms omit project recall. | Account-level expiry test and exact asset license needed. |
| C-027 | INFERENCE | Medium | Music Maker is best modeled as an object/timeline DAW with assisted generation and a bounded launcher, not a co-equal scene/timeline system. | Current visible user model | S-002, S-004, S-006 | Current pages consistently center the Arranger and describe Live Pads as a secondary feature. | A richer scene model may be omitted from public pages. |
| C-028 | INFERENCE | Low | Historical object/track/master scope is a plausible 2026 lineage hypothesis. | Cross-version lineage hypothesis | S-002, S-004, S-010 | Current object/track wording resembles the MX model. | The engine may have been reimplemented behind similar UI. |
| C-029 | INFERENCE | Medium | Current references to track/group effects do not establish a general-purpose bus graph. | Current routing interpretation | S-003, S-004 | The documented wording is narrower than arbitrary buses/routes. | A full graph may exist but be omitted. |
| C-030 | INFERENCE | High | Free-to-paid compatibility does not by itself establish paid-to-Free, cross-version, or dependency-durable recall. | Current project-portability interpretation | S-006, S-008, S-009 | Compatibility and entitlement are separately documented. | Graceful degradation may exist but is undocumented. |
| C-031 | INFERENCE | Medium | Validation, Store content, subscriptions, and server features enlarge the failure surface for project recall. | Current ecosystem interpretation | S-002, S-008, S-009 | Recall can depend on independent online entitlements/services. | Cached local assets may remain durable. |
| C-032 | INFERENCE | High | Content entitlement should be modeled as a persistence axis separate from project-file compatibility. | Architecture synthesis | S-002, S-006–S-009 | Upward file compatibility coexists with separate content licenses, subscriptions, and server terms. | Exact expiry behavior remains C-026 UNKNOWN. |

## 22. Source ledger and adaptive bibliography

- **S-001 — “Music Maker — System Requirements / Supported Formats / edition
  comparison,” MAGIX.** URL:
  https://www.magix.com/int/music/music-maker/specifications/ . Kind: official
  current product/support matrix. Scope: Music Maker 2026 paid editions. Access:
  2026-08-29. Passages: x64 Windows 10/11; Internet/registration; format table;
  Premium/Ultimate/Unlimited rows including VST3 and content. Claims: C-001,
  C-003, C-007, C-008, C-012, C-014, C-016, C-022. Limit: marketing matrix,
  no host semantics. Selected because it is the highest-authority current
  edition/platform source.
- **S-002 — “What’s new in Music Maker,” MAGIX.** URL:
  https://www.magix.com/int/music/music-maker/new-features/ . Kind: official
  current feature/FAQ page. Scope: Music Maker 2026. Access: 2026-08-29.
  Passages: Loop Browser/genre/pitch; Beatbox Pro 3 kits; effect chains;
  editions; Unlimited 12-month term/monthly cancellation after year; Ultimate
  commercial-rights statement. Claims: C-001, C-003–C-005, C-012, C-013,
  C-015. Limit: promotional and mutable. Selected over reseller summaries.
- **S-003 — “Music Maker Premium: Video Tutorials,” MAGIX.** URL:
  https://www.magix.com/int/support/know-how/tutorial-videos/music-maker/ .
  Kind: official tutorial catalog. Scope: tutorial assets labeled 2024–2025,
  served 2026. Access: 2026-08-29. Passages: Soundpool track construction,
  mixer track/group effects, effect rack, VST instruments, MIDI note editing,
  ASIO monitoring. Claims: C-006. Limit: descriptions rather than a versioned
  manual; videos were not executed. Selected to fill visible workflow gaps.
- **S-004 — “Explore all features,” MAGIX.** URL:
  https://www.magix.com/int/music/music-maker/functions/ . Kind: official
  current feature page. Scope: Music Maker 2026. Access: 2026-08-29. Passages:
  recording, Song Maker, up to 99 tracks, VST, formats, Loop Browser, effects
  rack, MIDI multi-object editing, Live Pads. Claims: C-003–C-008, C-012,
  C-022. Limit: conflicts with S-001's unlimited-track row. Selected for current
  user-model detail.
- **S-005 — “Linking other available VST to use in Music Maker 2024,” MAGIX.info
  Community.** URL:
  https://www.magix.info/us/forum/linking-other-available-vst-to-use-in-music-maker-2024--1332074/
  . Kind: community report on vendor-hosted forum; not primary support docs.
  Scope: Music Maker 2024; posts 2023-11-28. Access: 2026-08-29. Passages:
  reported automatic VST3 scanning, VST2 folder settings, Free entitlement, and
  VST Bridge. Claims: C-009, C-023. Limit: unverified user/moderator reports;
  no current extrapolation. Retained only because official current scanning
  documentation was not found.
- **S-006 — “Music Maker Free,” MAGIX.** URL:
  https://www.magix.com/us/music-editing/music-maker/free/ . Kind: official
  current edition page. Scope: Free build 32.2.0.20. Access: 2026-08-29.
  Passages: download filename/build; permanent Free; fixed tracks; content;
  piano roll/mixer; Free-to-paid project compatibility; requirements/formats.
  Claims: C-002, C-004, C-005, C-007, C-016, C-022, C-023. Limit: omits VST
  entitlement and exact track count. Selected as the only authoritative current
  Free source.
- **S-007 — “Commercial Use of Music Maker Sounds and Loops,” MAGIX Magazine.**
  URL: https://www.magix.com/us/magazine/music/commercial-use/ . Kind: official
  vendor explainer. Scope: Music Maker content licensing; page served 2026,
  original publication date not shown. Access: 2026-08-29. Passages: project
  authorship versus loop copyright, Audio Pro licenses, monetization, original
  recordings/melodies. Claims: C-013. Limit: explanatory, exact asset licenses
  govern. Selected to separate software from content rights.
- **S-008 — “License agreement for MAGIX Products (Consumer EULA),” MAGIX.**
  URL: https://www.magix.com/int/eula/consumer/ . Kind: official legal terms.
  Scope: current consumer products including Music Maker. Access: 2026-08-29.
  Passages: definitions, seats/activation, commercial software versus content,
  third-party terms, server-function discontinuance. Claims: C-013–C-015,
  C-026. Limit: page says product-attached terms are authoritative; not legal
  advice. Selected over summaries.
- **S-009 — “General Terms and Conditions,” MAGIX Software GmbH, October 2025.**
  URL: https://www.magix.com/int/terms-and-conditions/ . Kind: official sales
  and subscription terms. Scope: MAGIX purchases/subscriptions generally.
  Access: 2026-08-29. Passages: periodic validation; subscription updates,
  renewal, cancellation, payment. Claims: C-015, C-026. Limit: specific offer
  controls the precise Music Maker/Loops Unlimited term. Selected for current
  validation and subscription constraints.
- **S-010 — “MAGIX Music Maker MX Premium Instruction Manual,” MAGIX AG,
  copyright 1994–2011, mirrored by Manuals+.** URL:
  https://manuals.plus/m/f83ac304acac43c11e987991b2748ba6d640a2360cc0e4e26b4f9a02feddee86
  . Kind: secondary mirror/extracted text of a MAGIX-authored 346-page manual.
  Scope: MX Premium, Windows 7/XP/Vista era. Access: 2026-08-29. Passages:
  pp. 21–28 (VST/DirectX, engine, mixer), 68–74 (objects/project), 156–158
  (VST scan/UI/presets), 177–179 (effect scopes), 243–258 (automation/mixer).
  Claims: C-017–C-020. Limit: old product and non-vendor host; only historical
  claims use it. Selected after current manual searches failed, as a bounded
  lineage source rather than evidence about 2026.

**Negative retrievals retained:** current-manual searches were rate-limited or
returned no indexed manual; guessed `help.magix-hub.com` Music Maker paths
returned 404; the former MAGIX VST-install magazine URL redirected to the
magazine index; the Loops Unlimited URL redirected to the main Music Maker
page; an EULA index added no operative detail; an ACID forum thread was rejected
as product-mismatched. Nested delegation was attempted but blocked by the
session depth limit. None is counted among the ten retained sources.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Impact | Safest next probe | Required fixture / owner |
| --- | --- | --- | --- | --- |
| Current VST2/DirectX and Free VST status | Current pages, support search, historical/manual and community triangulation; current manual unavailable | Format matrix and migration | Obtain installed/current help or written MAGIX support matrix | Disposable licensed VM; unassigned |
| Scan/cache/blacklist and isolation | Current sources silent; community cannot prove architecture | Reliability/security | Instrument process tree/filesystem in disposable VM during scan; crash a purpose-built signed plugin | Benign scan/crash fixtures; unassigned |
| Buses, sidechain, multi-output, dynamic I/O | Feature pages only expose tracks/groups/mixer | Graph design/interoperability | Multibus VST3 instrument/effect fixtures plus impulse routing map | VST3 test suite; unassigned |
| PDC, tails, offline render | No current engine manual | Timing correctness | Known-latency/tail fixture, parallel null test, online/offline render comparison | Deterministic DSP fixture; unassigned |
| Automation/parameter identity | Current chain UI only; historical generic parameter view is stale | Project durability | Automate IDs across plugin reorder/update and inspect audible/rendered result | Versioned parameter fixture; unassigned |
| State/missing plugin/UI failure | No current documentation | Recall/recovery | Save, remove, reopen, reinstall; external-asset and UI-resize/crash fixtures | Two plugin versions/assets; unassigned |
| Project schema/version/archive | Only Free→paid statement and legacy MMM collect evidence | Portability | Cross-edition/cross-version matrix, offline collect/relink | Free/Premium/Unlimited builds; unassigned |
| Loops Unlimited expiry | Offer/terms omit cached asset and recall behavior | Rights and durability | Written license clarification, then account-level expiry test without bypass | Test account and licensed projects; unassigned |
| Accessibility/security/telemetry | No dedicated source retained | Product and compliance risk | Separate accessibility/privacy/security audit | Windows assistive tech and network capture; unassigned |

## 24. Curiosity pass and stop decision

Scoring is 1 (low) to 4 (high); cost 4 is most expensive.

| Candidate follow-up | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Historical full manual for lineage | 3 | 3 | 3 | 1 | **Pursued:** S-010; yielded bounded historical model only. |
| Current installed help/manual | 4 | 4 | 4 | 4 | **CURIOSITY_NO_GO:** unavailable publicly; installation exceeds documentary wave. |
| Disposable plugin qualification harness | 4 | 4 | 4 | 4 | **CURIOSITY_NO_GO:** highest future value, but explicitly belongs to later dynamic testing. |
| More community threads | 2 | 1 | 1 | 2 | **CURIOSITY_NO_GO:** duplicates and low evidentiary authority. |
| Full release chronology | 2 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** unlikely to change current architecture conclusions. |
| Patent/brand lineage | 1 | 1 | 2 | 3 | **CURIOSITY_NO_GO:** out of decision-critical frame. |

**Stop decision:** Stop on sufficient template coverage plus documentary
saturation and access boundary. Every required format row and heading is
complete, current product/edition/platform/content/licensing claims are sourced,
historical evidence is quarantined by version, and consequential host gaps are
visible. Further public searches repeated marketing or forum advice and are
unlikely to resolve proprietary/current behavior. The next positive-value work
is a bounded disposable interoperability harness, not another documentary pass.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** This task added only
  `research/daw-landscape/dossiers/magix-music-maker.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See §0 and claims C-001–C-003.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and
  subsections 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Material
  findings cite C-001–C-032; research-process/checklist statements are not
  product claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  §§21–23.
- [x] **Every required plugin-format row is present.** All 13 required rows are
  in §11.1 with no blank cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  See §§11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Current, historical, community, inference, and unknown scopes are explicit.
- [x] **Licensing and clean-room boundaries are explicit.** See §§0 and 16.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19
  and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** No installer/plugin was downloaded or executed; no git
  staging/commit was performed.

**Checks performed:** template/contract comparison, plugin-row count, claim-to-
source audit, current-versus-historical scope audit, negative-result retention,
and owned-path diff/status review. **Result:** complete with explicit unknowns.
**Unresolved blockers:** no public current manual; web-search rate limiting;
nested subagent depth limit; no documentary source for deep 2026 host semantics.
**Pre-existing workspace changes:** the entire `research/daw-landscape/` tree was
already untracked and numerous unrelated `apps/mobile/`, `vendor/crafty/`, and
`bun.lock` changes existed; all were left untouched.
