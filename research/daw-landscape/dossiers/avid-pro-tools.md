# Avid Pro Tools DAW dossier

> Research-only evidence. No design or implementation authority. Vendor
> statements establish what Avid documents, not independent runtime behavior.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Avid Pro Tools desktop and its AAX hosting boundary |
| Canonical vendor | Avid Technology, Inc. |
| Researcher/session | `ses_fb2716717ffeEomo1zNc0zUWbO` |
| Owned path | `research/daw-landscape/dossiers/avid-pro-tools.md` |
| Research date / evidence cutoff | 2026-08-29 UTC |
| Current snapshot | Pro Tools 2026.4.1, released 2026-07-09; 2026.4 released 2026-04-28 [C-001] |
| Editions | Intro, Artist, Studio, Ultimate; subscription and perpetual offerings where documented [C-002] |
| Platforms | Qualified desktop macOS and Windows configurations; no current Linux desktop edition documented [C-001] |
| Included | User model, public engine boundaries, AAX Native/DSP/AudioSuite, scanning, Apple silicon, host contract, persistence, post/interchange, extensions, licensing |
| Excluded | Installation or binary execution; proprietary-code inspection; click-through SDK download; wrappers that host other formats inside AAX; VENUE/Media Composer except where they clarify AAX; detailed Sketch iPad dossier; historical TDM/RTAS behavior |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

The research used public clean-room sources only. No authentication, license
acceptance, installer execution, decompilation, or protected SDK-code copying
occurred.

**OBSERVED:** none. This documentary wave performed no product or plug-in
runtime probes.

## 1. Executive summary

- **DOCUMENTED — product/host headline.** Pro Tools 2026.4.1 is a maintained
  macOS/Windows DAW offered as Intro, Artist, Studio, and Ultimate. Current
  Pro Tools plug-ins must be 64-bit AAX; no native VST, AU, CLAP, LV2, or other
  required-matrix binary hosting is documented. Selected ARA 2 integrations and
  AAX MIDI effects extend workflows without changing that binary-format rule.
  [C-001] [C-002] [C-012] [C-031]
- **DOCUMENTED — AAX modes.** Avid's public AAX host guide distinguishes AAX
  Native (host CPU, real time and offline render), AAX DSP (real-time algorithm
  on Avid DSP hardware with other modules on the host), and AudioSuite
  (host-CPU, random-access, file-based non-real-time processing). The detailed
  public guide is SDK 2.1.1-era and is bounded accordingly. [C-013]
- **DOCUMENTED — differentiators.** The product emphasizes precision linear
  editing, playlists/comping, large routing and automation surfaces, HDX Hybrid
  Engine operation, sound-to-picture, AAF and Avid interchange, and integrated
  immersive renderers. A nonlinear Sketch surface is complementary rather than
  the main session model. [C-003] [C-007] [C-010] [C-011] [C-022]
- **DOCUMENTED — Apple silicon.** Pro Tools is a universal binary and normally
  starts native on Apple silicon. Universal AAX plug-ins can load native,
  Rosetta, or Intel; Intel-only AAX cannot load in native mode. Affected
  sessions produce missing-plug-in notes, while launch itself is silent about
  omitted Intel-only plug-ins. [C-016]
- **UNKNOWN — isolation and proprietary core.** Public sources do not establish
  a per-plug-in sandbox, a separate OS process for AAX Native execution, current
  crash containment, exact scanner process boundaries, or proprietary session
  and scheduler internals. “Plug-in scan process” in release notes is not enough
  to infer an operating-system process. [C-004] [C-015] [C-032]
- **Architecture lesson (INFERENCE).** A single, signed, identity-rich plug-in
  format plus explicit Native/DSP/AudioSuite modes simplifies the host matrix
  and enables deep control-surface/session integration, but creates a strong
  commercial signing and ecosystem dependency and does not itself prove crash
  isolation. [C-027]

**Confidence:** high for product/version/platform, AAX-only format policy,
Apple-silicon loading rules, licensing gates, current post/interchange, and the
three processing-mode definitions; medium for current applicability of detailed
2014 scan/cache/state rules; low/unknown for proprietary implementation,
current process isolation, complete edition limits, and untested third-party
interoperability.

## 2. Product identity, history, and market position

- **DOCUMENTED.** Avid identifies Pro Tools as a current DAW for recording,
  editing, MIDI, mixing, and delivery, spanning music and high-end film/TV/game
  audio post. The cutoff snapshot is 2026.4.1. [C-001] [C-003] [C-011]
- **DOCUMENTED.** The current family includes free Intro and paid Artist,
  Studio, and Ultimate. The 2026.4.1 installer is common to all four; iLok
  authorization determines the edition. Studio and Ultimate also have
  documented perpetual upgrade paths. [C-002]
- **DOCUMENTED.** Qualified 2026.4.1 systems include macOS Sonoma 14.8.x,
  Sequoia 15.7.x, Tahoe 26.3.x on listed M1–M5 or Intel systems, and Windows 11
  24H2/25H2 on 64-bit Intel. This is a qualification statement, not a claim that
  every unlisted system fails. [C-001]
- **UNKNOWN.** Market share, independent reliability ranking, complete tier
  limits, and historical lineage before the current AAX generation were not
  established because they do not change the hosting decision.

## 3. Workflow and conceptual model

- **DOCUMENTED.** The primary model is a session with tracks on a linear
  timeline, clips, playlists/takes, insert and send slots, buses, folders,
  automation, and Edit/Mix windows. Slip, Grid, Shuffle, and Spot edit modes
  expose different placement semantics. [C-003] [C-007] [C-010]
- **DOCUMENTED.** Pro Tools Sketch adds nonlinear scenes/clips and an arrangement
  surface; scenes and arrangements can be dragged into the Edit window while
  retaining audio/MIDI, and compatible instrument presets can instantiate the
  corresponding AAX plug-in. [C-003] [C-022]
- **DOCUMENTED.** Audio-post workflows add picture/video tracks, frame and
  subframe placement, ADR/Foley, markers, reconform/import-session operations,
  immersive beds/objects/renderers, and delivery stems. [C-011]
- **INFERENCE.** Sketch is an ideation boundary embedded alongside, rather than
  a replacement for, the durable linear session because official workflows move
  its material into the Edit timeline for production. Alternative: some users
  may remain mostly in Sketch; no usage telemetry was reviewed. [C-003]

## 4. Publicly documented architecture

- **DOCUMENTED.** The Avid Audio Engine (AAE) is the documented host-side AAX
  boundary: it discovers/describes plug-ins and implements host AAX interfaces.
  In HDX, real-time DSP algorithm code runs on card DSPs while the data model,
  GUI, and other modules remain on the host CPU. [C-005] [C-013]
- **DOCUMENTED.** The Hybrid Engine allows a track-level Native/DSP mode choice
  with HDX. AAX plug-ins need matching modes to make that transition; the
  availability of a DSP implementation is a plug-in capability, not implied by
  the `.aaxplugin` suffix alone. [C-005] [C-013]
- **DOCUMENTED.** The Scripting SDK is an external, language-independent,
  certificate-validated inter-process component between an automation app and
  Pro Tools. This is a documented out-of-process integration boundary, unlike
  the unresolved AAX Native process boundary. [C-021]
- **UNKNOWN.** The proprietary audio graph representation, worker/thread
  scheduler, service topology, scanner OS-process topology, memory isolation,
  `.ptx` schema, and recovery journal implementation are not public in the
  accessible sources. [C-004] [C-015] [C-023] [C-032]

## 5. Audio engine

- **DOCUMENTED.** Current product materials advertise 32-bit-float project/audio
  handling. HDX streams host/DSP audio at uniform 32-bit float; AAX can support
  plug-in-side 64-bit double-precision processing. These are precision
  capabilities, not independent sound-quality measurements. [C-006]
- **DOCUMENTED.** HDX's current published configuration is 18 DSP cores per card,
  up to three cards, up to 2,048 voices and 192 I/O channels, with a vendor-rated
  0.7 ms latency. The figures depend on Ultimate/HDX configuration and are not
  generalized to every edition or interface. [C-005] [C-006]
- **DOCUMENTED (historical detailed contract).** AAE may use low- and high-
  latency domains and change AAX Native buffer sizes for efficiency. The public
  detail describes Pro Tools 11-era rules and explicitly says rules can change;
  the exact 2026 scheduler/block policy is therefore unknown. [C-006]
- **DOCUMENTED.** Automatic Delay Compensation aligns paths and relies on AAX
  plug-ins reporting algorithmic latency. Current release notes still contain
  delay-compensation fixes, corroborating an active current subsystem. [C-018]
- **DOCUMENTED.** AAX Native supports faster-than-real-time offline bounce. The
  historical AAX guide says AAX DSP instances are temporarily mapped to a
  corresponding Native type for offline bounce; AudioSuite is a separate
  file-based offline route. Freeze, commit, track bounce, and immersive re-render
  bounces are current documented workflows. [C-013] [C-018] [C-011]
- **UNKNOWN.** Current maximum sample rates, per-tier track/voice tables,
  oversampling policy, exact dropout recovery, tail behavior in every current
  render path, and multicore scheduling internals were not available in an
  accessible current text manual. [C-030]

## 6. Tracks, timeline, clips, and editing

- **DOCUMENTED.** The current product documents audio, MIDI, instrument, video,
  auxiliary/folder-oriented workflows; clip gain; cut/trim/fade/move; playlists;
  loop and punch recording; comping; grouping/folders; Track Pin; marker/memory
  locations; Elastic Audio; pitch editing; and audio-to-MIDI. [C-007]
- **DOCUMENTED.** Edits are presented as timeline/session operations and the
  AAX Native insert path is non-destructive. AudioSuite can create new processed
  files or overwrite according to selected processing mode, so “Pro Tools is
  wholly non-destructive” would be overbroad. [C-007] [C-013]
- **DOCUMENTED.** Current import-session summary metadata includes track type,
  width, name, inactive/hidden/frozen state, clip presence, automation, markers,
  and color, enabling filtering before deeper import. [C-022]
- **UNKNOWN.** Exact undo depth, history persistence across reopen, edit-list
  storage, and complete time-stretch algorithm inventory are not established.

## 7. MIDI, sequencing, notation, and expression

- **DOCUMENTED.** Pro Tools provides MIDI/instrument tracks, recording, a MIDI
  editor/piano roll, playlists, quantization, controllers, audio-to-MIDI, virtual
  instruments, and AAX MIDI effect plug-ins. Since 2024.3, AAX MIDI effects can
  generate/manipulate notes and route MIDI within a track, between tracks, and
  between plug-ins. [C-008] [C-031]
- **DOCUMENTED.** Pro Tools and Sibelius can exchange MIDI through the public
  clipboard. Current documented content includes notes, continuous controller
  data, pitch/duration/timing and, since 2024.6, key signatures, meter, and tempo.
  This is not evidence of MusicXML project interchange. [C-008] [C-022]
- **DOCUMENTED.** A Score Editor existed in the native Apple-silicon transition
  and was restored for the qualified 2023.3 release after the beta; its complete
  2026 notation feature set was not re-established from accessible sources.
  [C-008]
- **UNKNOWN.** Current MPE/per-note expression, MIDI 2.0/UMP, SysEx policy,
  sample-accurate MIDI/event delivery, and plug-in event-bus limits were not
  established. Absence from the reviewed pages is not evidence of absence.
  [C-009]

## 8. Routing, mixer, automation, and control

- **DOCUMENTED.** The user-facing mixer provides inserts, sends, buses, folder
  submixes, hardware I/O, sidechains/key inputs, multi-mono processing, and
  immersive routing. AAX can expose fixed auxiliary output stems that become
  track inputs. [C-010] [C-017]
- **DOCUMENTED.** AAX auxiliary outputs are described once by the plug-in; the
  historical public guide limits them to mono/stereo, disallows dynamic add/
  remove, and excludes multi-mono multi-output combinations. Current 2026
  expansion of this detailed contract was not found. [C-017]
- **DOCUMENTED.** Track and plug-in automation can be written, played, edited,
  and exposed to control surfaces. Historical AAX documentation guarantees
  deterministic repeated delivery for plug-in automation but explicitly does
  not call breakpoint delivery sample-accurate. By contrast, `.ptxm` can carry
  sample-accurate volume/pan automation for supported layouts. [C-018] [C-022]
- **DOCUMENTED.** EUCON control surfaces, HUI/MIDI peripherals, S4/S6 panning and
  PEC/Direct workflows, Satellite Link, Sync hardware, and the certificate-
  validated Scripting SDK are documented control/sync boundaries. [C-005]
  [C-010] [C-021]
- **UNKNOWN.** Feedback routing rules, generic OSC support in desktop Pro Tools,
  current plug-in parameter automation granularity, and complete dynamic bus
  negotiation are not established.

## 9. Recording, comping, and media handling

- **DOCUMENTED.** Input monitoring, loop and punch recording, playlists/take
  organization, comping, and up to 256 simultaneous inputs are current advertised
  capabilities; exact entitlement by tier was not visible in the fetched
  comparison table. [C-007] [C-030]
- **DOCUMENTED.** Audio-post materials cover synchronized ADR/Foley, blank cue
  clips, HD/4K picture, up to 64 video tracks in a high-end configuration,
  import/session conform, speech-to-text metadata, interleaved multichannel
  channel-order metadata, AAF fixes, and Avid shared-storage workflows. [C-011]
- **DOCUMENTED.** 2026.4.1 improved import/export channel metadata handling for
  iXML channel index, WavEXT channel mask, and physical channel order while
  retaining legacy Pro Tools round-trip compatibility. [C-011]
- **UNKNOWN.** Complete current codec/file-format tables, proxy policy, asset
  hashing, relink precedence, and all sample-management rules are in the
  inaccessible current Reference Guide/ReadMe PDFs or remain undocumented.
  [C-023]

## 10. Instruments, effects, content, and native devices

- **DOCUMENTED.** Pro Tools bundles Avid and partner instruments/effects as AAX
  plug-ins; current examples include PlayCell/GrooveCell/SynthCell families,
  AIR bundles, Massive X Player, MIDI effects, and tier/plan-dependent rewards.
  These examples do not imply every included plug-in supports AAX DSP or
  AudioSuite. [C-002] [C-031]
- **DOCUMENTED.** Selected ARA 2 tools integrate into track/clip editing without
  the traditional roundtrip; Avid publishes a bounded compatibility list rather
  than treating arbitrary ARA-capable software as compatible. [C-031]
- **INFERENCE.** “Native devices” in Pro Tools largely share the AAX ecosystem
  boundary rather than forming a separately documented open device graph.
  Alternative: Avid may have private built-in modules that do not use AAX;
  source inspection was out of scope. [C-027]
- **UNKNOWN.** A public native modulation/rack/macro authoring contract comparable
  to a modular DAW device graph was not found.

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

“No native hosting” means Pro Tools itself does not accept that row's binary
format. It does not rule out third-party AAX wrapper products, which are excluded
from this host-capability matrix. Avid's explicit rule is that Pro Tools 12 and
later plug-ins must be 64-bit AAX. [C-012]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED: no native hosting | DOCUMENTED: no native hosting | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop scope | Pro Tools 12+ requires 64-bit AAX | Wrappers are not host support; VST2 licensing not reached by native host decision | C-001, C-012 / S-002, S-012 |
| VST3 | DOCUMENTED: no native hosting | DOCUMENTED: no native hosting | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop scope | Pro Tools 12+ requires 64-bit AAX | ARA 2 integration does not imply VST3 loading | C-012, C-031 / S-010, S-012 |
| AUv2 | DOCUMENTED: no native hosting | NOT_APPLICABLE: Apple-only format | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop scope | Pro Tools requires 64-bit AAX on macOS | Rosetta compatibility applies to AAX, not AU | C-012, C-016 / S-005, S-012 |
| AUv3 | DOCUMENTED: no native hosting | NOT_APPLICABLE: Apple-only format | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop scope | Pro Tools requires 64-bit AAX on macOS | Sketch iPad is not evidence of AUv3 hosting | C-003, C-012 / S-001, S-012 |
| AAX | DOCUMENTED: 64-bit AAX; universal binary needed for native Apple silicon, Intel-only via Rosetta | DOCUMENTED: 64-bit AAX | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop AAX scope | Generic Pro Tools 12+ rule; 2026.4.1 has one installer for four desktop tiers | Native, DSP, AudioSuite; actual modes are per plug-in and DSP needs compatible Avid hardware | C-002, C-012, C-013, C-016 / S-003, S-005, S-006, S-012, S-015 |
| CLAP | DOCUMENTED: no native hosting | DOCUMENTED: no native hosting | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop scope | Pro Tools 12+ requires 64-bit AAX | No accepted/scanned/instantiated CLAP evidence | C-012 / S-012 |
| LV2 | DOCUMENTED: no native hosting | DOCUMENTED: no native hosting | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop scope | Pro Tools 12+ requires 64-bit AAX | No accepted/scanned/instantiated LV2 evidence | C-012 / S-012 |
| LADSPA | DOCUMENTED: no native hosting | DOCUMENTED: no native hosting | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop scope | Pro Tools 12+ requires 64-bit AAX | No accepted/scanned/instantiated LADSPA evidence | C-012 / S-012 |
| DSSI | DOCUMENTED: no native hosting | DOCUMENTED: no native hosting | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop scope | Pro Tools 12+ requires 64-bit AAX | No accepted/scanned/instantiated DSSI evidence | C-012 / S-012 |
| JSFX | DOCUMENTED: no native hosting | DOCUMENTED: no native hosting | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop scope | Pro Tools 12+ requires 64-bit AAX | Product-specific to another ecosystem; no Pro Tools host path | C-012 / S-012 |
| DirectX/DXi | NOT_APPLICABLE: Windows-specific format | DOCUMENTED: no native hosting | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop scope | Pro Tools requires 64-bit AAX on Windows | No accepted/scanned/instantiated DX/DXi evidence | C-012 / S-012 |
| Rack Extension | DOCUMENTED: no native hosting | DOCUMENTED: no native hosting | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop scope | Pro Tools 12+ requires 64-bit AAX | Product-specific to another ecosystem; no Pro Tools host path | C-012 / S-012 |
| Product-native/other | DOCUMENTED: selected ARA 2 and AAX MIDI integrations | DOCUMENTED: selected ARA 2 and AAX MIDI integrations | NOT_APPLICABLE: no current Linux Pro Tools | NOT_APPLICABLE: desktop scope | Current tiers share base installer; individual integrations are version/tier bounded | ARA is an editing integration; Scripting SDK is external inter-process API, not an audio plug-in format | C-002, C-021, C-031 / S-001, S-010, S-013, S-015 |

### 11.2 Discovery, scanning, validation, and recovery

- **DOCUMENTED (AAX SDK 2.1.1-era).** AAX bundles use `.aaxplugin`; the documented
  system locations are `/Library/Application Support/Avid/Audio/Plug-Ins` on
  macOS and `C:\Program Files\Common Files\Avid\Audio\Plug-Ins` for 64-bit
  Windows. Search is recursive. A neighboring `Plug-Ins (Unused)` directory
  excludes installed-but-unused bundles. [C-014]
- **DOCUMENTED (AAX SDK 2.1.1-era).** On launch AAE searches, checks signatures,
  loads modules, calls `Describe`, catalogs configurations, and caches basic
  descriptions. If the plug-in folder is unchanged it uses the cache; if content
  changes, the guide says every installed plug-in description is re-cached.
  [C-014]
- **DOCUMENTED (current corroboration).** 2026.4 fixed a crash “after plugin scan
  process was completed” and added text-report export to Missing Plugins. This
  confirms a current scan workflow and diagnostics, but not that all 2014 cache
  details are unchanged. [C-020]
- **UNKNOWN.** Current user rescan controls, duplicate identity resolution,
  cache file/schema, per-plug-in blacklist/quarantine, automatic movement to
  Unused, scanner retries/timeouts, and whether scanning is in a separate OS
  process were not established. [C-015]

### 11.3 Runtime isolation and compatibility

- **DOCUMENTED.** In AAX Native, the host CPU handles real-time processing, data
  model, GUI, and other tasks. In AAX DSP, real-time code loads on external Avid
  DSP while remaining modules stay on the host CPU. [C-013]
- **UNKNOWN.** The phrase “host environment” does not prove that AAX Native runs
  in the main Pro Tools process, nor does it prove sandboxing. No public source
  established per-instance process isolation, memory sandboxing, restart after
  fault, or crash containment. Current release notes include crashes involving
  plug-ins, which demonstrates failure cases, not their architecture. [C-032]
- **DOCUMENTED.** On Apple silicon, native Pro Tools loads universal AAX binaries
  but not Intel-only AAX. Rosetta mode remains the documented compatibility path
  for Intel-only AAX. A session with unavailable Intel-only plug-ins reports them
  in Session Notes; they do not appear in menus. [C-016]
- **DOCUMENTED.** A valid AAX digital signature is required for shipping Pro
  Tools builds. Current commercial signing requires Avid/PACE tooling and an
  iLok USB key. Platform code-signing/notarization details beyond this AAX gate
  were not established. [C-024]

### 11.4 Host/plugin processing contract

- **DOCUMENTED.** Effects and instruments can provide AAX Native; a developer
  may additionally provide AAX DSP and an AudioSuite type. The format name alone
  does not guarantee all three. [C-013]
- **DOCUMENTED (detailed historical guide).** Configurations are selected by
  sample rate, stem/channel width, and Native/DSP mode; when requirements change,
  Pro Tools can substitute a compatible configuration while copying settings.
  Missing configurations can leave inactive placeholders. [C-017] [C-019]
- **DOCUMENTED (detailed historical guide).** Optional contract features include
  key-input sidechain, fixed auxiliary output stems, multi-mono fallback, meters,
  bypass, reported latency, analysis and random-access AudioSuite processing,
  and offline Native render. [C-017] [C-018]
- **DOCUMENTED.** AAX MIDI effects provide MIDI generation/manipulation and
  intra-/inter-track and inter-plug-in routing in current Pro Tools. [C-031]
- **UNKNOWN.** Current MPE/MIDI 2.0 events, sample-accurate event delivery, dynamic
  audio I/O beyond the older fixed-AOS rule, tail reporting semantics, suspend
  guarantees, and every current stem width were not established. [C-009]

### 11.5 Parameters, automation, state, presets, and project recall

- **DOCUMENTED (detailed historical guide).** AAX parameters have host-facing
  identities and names; plug-in parameter name changes historically affected
  old-session automation compatibility. Real-time AAX plug-ins are automation
  clients; deterministic delivery is documented, not sample-accurate breakpoint
  delivery. [C-018]
- **DOCUMENTED.** Plug-ins report algorithmic delay; bypass must preserve that
  delay. The historical guide says delay-compensation recalculation does not
  happen during playback and AudioSuite must handle its own lookahead. The exact
  2026 dynamic-update behavior remains unverified. [C-018]
- **DOCUMENTED (detailed historical guide).** AAE retrieves arbitrary plug-in-
  owned state chunks for presets/session recall and sends them back on restore.
  The format is chosen by the plug-in. Factory/user presets and a Compare state
  are host-managed surfaces. [C-019]
- **DOCUMENTED.** Inactive and unavailable plug-ins retain insert placeholders
  and state in the session according to the AAX guide; current Apple-silicon
  Session Notes and the 2026 Missing Plugins report corroborate a user-visible
  missing-dependency path. [C-019] [C-020]
- **UNKNOWN.** Asset references outside state chunks, state-version migrations,
  preset portability across Native/DSP variants, corrupted-state recovery, and
  exact ARA state placement are not publicly specified in accessible current
  text. [C-023]

### 11.6 UI, diagnostics, and failure modes

- **DOCUMENTED.** AAX supplies GUI modules hosted through Pro Tools; standard
  headers expose preset, Compare, bypass, sidechain, and other host controls.
  Plug-in meters can feed control-surface/external displays. [C-017] [C-019]
- **DOCUMENTED.** Diagnosed failure surfaces include signature-specific errors,
  “Move Unauthorized Plug-ins,” load errors, unavailable/inactive inserts,
  Apple-silicon Session Notes, Missing Plugins text reports, and developer-only
  DigiTrace/DSH facilities. [C-020]
- **UNKNOWN.** Current detachable-window rules, DPI/scaling contract, accessibility
  of arbitrary third-party UIs, headless/offscreen operation, scanner logs for
  end users, and whether one plug-in crash can be recovered without terminating
  Pro Tools remain unknown. [C-029] [C-032]

## 12. Extensibility and integration

- **DOCUMENTED.** AAX is the audio/instrument/MIDI plug-in authoring boundary;
  evaluation access uses a click-through SDK, and commercial distribution needs
  Avid's tools/license and PACE/iLok signing. [C-024]
- **DOCUMENTED.** The Scripting SDK is free, external, language-independent,
  certificate validated, available on macOS/Windows and across all four tiers.
  It can open/close/save/query sessions, inspect clips/playback, edit timeline
  state, and import/export. [C-021]
- **DOCUMENTED.** SoundFlow is integrated in current Pro Tools, while EUCON is
  the documented high-integration control-surface protocol; HUI/MIDI peripherals
  and Avid sync/satellite products provide additional boundaries. [C-010]
  [C-021]
- **UNKNOWN.** Generic embedded scripting, an officially documented OSC API for
  Pro Tools desktop, stable versioning guarantees for every Scripting call, and
  an open native-device graph are not established.

## 13. Project format, persistence, interoperability, and collaboration

- **DOCUMENTED.** The durable user unit is a Pro Tools session. A secondary,
  Avid-linked accessibility guide shows `.ptx` session files, session backups,
  Save As, backup copy, and archive workflows; exact current behavior should be
  qualified against the inaccessible 2026.4 Reference Guide. [C-022] [C-026]
- **DOCUMENTED.** Session save/import includes summary metadata used for fast
  inspection and filtering. Current release notes refer to auto-save, session
  reopen persistence, Save Copy In, track presets, ARA data, automation, output
  assignments, and backward roundtrip fixes, proving these are live persistence
  surfaces without revealing the schema. [C-022]
- **DOCUMENTED.** `.ptxm` is a Media Composer-compatible session file that Pro
  Tools can reopen; it constrains contents to what Media Composer supports and
  can carry frame-rendered clips/stems, markers, Atmos re-renders, and optional
  sample-accurate volume/pan automation for supported layouts. [C-022]
- **DOCUMENTED.** AAF is a current import/export workflow, while direct Avid
  session exchange, Import Session Data, Sibelius MIDI clipboard exchange,
  NEXIS/MediaCentral co-installation, Dropbox Replay review, and Video Satellite
  cover additional interoperability/collaboration boundaries. [C-011] [C-022]
- **UNKNOWN.** The `.ptx`/`.ptxm` schemas, forward/backward compatibility matrix,
  conflict resolution, version-control suitability, cloud-project protocol,
  missing-media placeholder schema, and complete OMF/ADM/MusicXML/DAWproject
  support are not established by accessible current sources. [C-023]

## 14. Delivery, live, post-production, and specialized workflows

- **DOCUMENTED.** Pro Tools is strongly differentiated for audio post: ADR,
  Foley, dialogue/sound design, picture sync, frame/subframe editorial, AAF,
  Media Composer session interchange, reconform partners, Satellite Link, shared
  storage, and multi-operator control surfaces. [C-011] [C-022]
- **DOCUMENTED.** Studio/Ultimate include current immersive capabilities such as
  Dolby Atmos, MPEG-H, Audio Vivid and supported Ambisonics/other renderer paths;
  2026.4 adds MPEG-H master import/bounce, renderer assignment migration, and
  object panning up to 9.1.6 for specified renderers. [C-010] [C-011]
- **DOCUMENTED.** Delivery surfaces include offline Bounce Mix, stems/re-renders,
  freeze/commit/track bounce, session/text export, and Media Composer-compatible
  deliverables. [C-011] [C-022]
- **UNKNOWN.** DDP authoring, show-control guarantees, all ADM/BWF delivery
  profiles, loudness compliance tooling, and live-performance scene switching
  were not established. Pro Tools should not be inferred to be a dedicated live
  clip-performance host from Sketch alone.

## 15. Performance, reliability, security, and accessibility

- **DOCUMENTED.** Avid publishes qualified hardware/OS matrices and current
  system requirements (16 GB RAM, installation/activation Internet, audio-disk
  guidance, CoreAudio/ASIO and HDX/HD Native requirements). [C-001] [C-025]
- **DOCUMENTED.** Current release notes enumerate fixed crashes, launch/plugin-
  scan issues, low-buffer performance faults, Video Engine crashes, ARA/session
  issues, automation persistence, delay compensation, and HDX/Carbon DSP-mode
  faults. This evidences active diagnostics/maintenance, not absence of defects.
  [C-025]
- **DOCUMENTED.** AAX release binaries require digital signing; AAX commercial
  signing is mediated through Avid/PACE/iLok. No public evidence established a
  per-plug-in sandbox or least-privilege filesystem/network model. [C-024]
  [C-032]
- **DOCUMENTED.** Avid links a Berklee/PTAccess guide for VoiceOver users, and
  2026.4 fixes include VoiceOver navigation/crash issues. The older guide reports
  some features, including Elastic Audio markers at publication time, as only
  partly accessible. [C-026]
- **UNKNOWN.** Full 2026 WCAG/assistive-technology conformance, third-party
  plug-in UI accessibility, telemetry/privacy specifics, rollback policy, and
  independent scaling/reliability benchmarks are not established.

## 16. Licensing, ecosystem, and implementation constraints

- **DOCUMENTED — product.** Pro Tools requires a valid subscription or perpetual
  iLok license for the relevant release limit. Avid Link licenses the tier; iLok
  2/3 or iLok Cloud is listed. Installation and activation require Internet
  access. Perpetual upgrades include a year of updates/support. [C-002] [C-024]
- **DOCUMENTED — AAX evaluation/commercialization.** The evaluation SDK is behind
  a click-through license. Commercial AAX products require contacting Avid for
  necessary tools/license; testing needs Avid and iLok accounts, and commercial
  digital signing needs an iLok USB key. [C-024]
- **DOCUMENTED — signature.** The public SDK guide describes a valid PACE/AAX
  signature as mandatory for release plug-ins and as distinct from a vendor's
  own copy protection. Current exact agreement text was not accepted or copied.
  [C-024]
- **INFERENCE.** A new DAW cannot claim AAX compatibility, redistribute Avid/PACE
  tools, or use marks merely because public documentation names the format.
  Implementing AAX support would require direct legal/technical engagement with
  Avid; this dossier grants no such rights. [C-027]
- **NOT_APPLICABLE to native host.** VST2/VST3/AU/CLAP/LV2 and other format
  licenses do not affect Pro Tools' native host matrix because Pro Tools requires
  AAX. They would matter only to an excluded third-party wrapper or a different
  host architecture. [C-012]

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **Evidence-backed:** one cross-platform 64-bit AAX binary-format policy, with
  explicit Native/DSP/AudioSuite roles, reduces native-host format ambiguity and
  enables deep session/automation/control-surface integration. [C-012] [C-013]
- **Evidence-backed:** state placeholders, signed discovery, configuration
  description/cache, latency reporting, offline mapping, and missing-plug-in
  diagnostics address durable-session concerns. [C-014] [C-018] [C-019] [C-020]
- **Evidence-backed:** HDX/Hybrid and extensive post/interchange workflows make
  Pro Tools a strong reference for low-latency tracking and sound-to-picture
  delivery boundaries. [C-005] [C-011] [C-022]
- **Evidence-backed:** the Scripting SDK is explicitly external/inter-process and
  tier-wide, a useful contrast with audio plug-in execution. [C-021]

### Liabilities and caution

- **Evidence-backed:** AAX commercial development and signing are centrally
  gated by Avid/PACE/iLok, and third-party plug-in qualification is delegated to
  vendors. [C-024]
- **Evidence-backed:** Apple architecture migration can make plug-ins disappear
  from native mode, so format identity is insufficient without architecture and
  binary-compatibility state. [C-016]
- **UNKNOWN:** public evidence does not establish plug-in sandboxing or fault
  recovery. A single-format policy must not be mistaken for a security boundary.
  [C-032]
- **Caution:** the richest public host-contract source is old. It is useful for
  interface concepts but should not be treated as a complete 2026 conformance
  specification. [C-013] [C-014] [C-017] [C-018]

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Support | Prerequisites | Tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Fast, deterministic discovery | Signed bundle manifest/description cache; invalidate on directory change; expose scan diagnostics | C-014, C-020 | Stable identity/schema, safe scanner | Coarse full-cache rebuild can be costly; AAX details/licensing must not be copied | **CANDIDATE** |
| Missing dependencies in durable projects | Persist inactive insert placeholder, format/vendor/ID/configuration, opaque state, and a user-exportable report | C-016, C-019, C-020 | Stable IDs and state envelope | Migration/security of opaque state; avoid implying instantiation succeeded | **CANDIDATE** |
| Distinct real-time/offline/hardware paths | Declare execution capabilities per plug-in/type; negotiate Native, accelerator, and offline modes explicitly | C-013 | Common state/parameter identity and deterministic render semantics | Vendor burden; accelerator portability; licensing risk if modeled too closely on AAX | **CONDITIONAL** |
| Latency-correct routing | Require reported latency, preserve delay through bypass, recompute graph compensation, make stale compensation visible | C-018 | Cycle-safe graph and timeline clock | Dynamic changes and feedback paths are difficult; modern behavior needs prototype validation | **CANDIDATE** |
| Fixed multi-output routing | Describe named output stems at initialization and expose them as routable track inputs | C-017 | Stable channel-layout model | Fixed outputs simplify recall but limit dynamic instruments | **CONDITIONAL** |
| Architecture migration | Record binary architecture compatibility separately from format; preserve unavailable instances and offer compatibility-mode diagnostics | C-016, C-019 | Multi-architecture metadata and migration UX | Compatibility layers can disappear; never silently claim equivalence | **CANDIDATE** |
| Safe automation ecosystem | Keep facility automation in a certificate-validated external API process, distinct from real-time plug-in ABI | C-021 | Versioned protocol, permissions, discovery | API breadth/version skew; certificate operations | **CANDIDATE** |
| Constrained NLE handoff | Export a compatibility-subset session with rendered fallbacks and declared retained automation/markers | C-022 | Capability negotiation and media render | Loses unsupported semantics; versioning required | **CANDIDATE** |

No protected AAX SDK code, UI expression, proprietary file schema, or trademark
claim is proposed for adaptation.

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** mandatory dependence on one vendor's commercial signing and
  licensing authority as a default architecture. It may be necessary for AAX
  interoperability, but is not a transferable open host pattern. Reopen only if
  AAX support becomes a product requirement and counsel/Avid authorize it.
  [C-024]
- **REJECTED:** treating “supports AAX” as proof of Native, DSP, AudioSuite,
  sidechain, multi-output, Apple-silicon, or offline equivalence. Capabilities
  must be negotiated and tested separately. [C-013] [C-016] [C-017]
- **REJECTED:** inferring scanner sandboxing from the phrase “plugin scan
  process,” or same-process execution from “host environment.” Both remain
  unknown. [C-015] [C-032]
- `CURIOSITY_NO_GO` — further broad web-search retries: repeated HTTP 429,
  CAPTCHA, and empty-render failures; official direct sources were preferable.
- `CURIOSITY_NO_GO` — guessed newer public AAX Doxygen paths: two 404s and the
  current portal is click-through/account gated; enumeration had nonpositive
  marginal value.
- `CURIOSITY_NO_GO` — third-party SDK mirrors, leaked/non-public documentation,
  binary inspection, installers, and plug-in execution: provenance or clean-room
  boundary failure.
- `CURIOSITY_NO_GO` — third-party VST/AU wrapper behavior: it would measure the
  wrapper, not Pro Tools' native host contract.
- `CURIOSITY_NO_GO` — exhaustive included-plug-in inventory, market share,
  testimonials, pricing history, and legacy TDM/RTAS: low decision relevance.
- `CURIOSITY_NO_GO` — individual non-AAX format licenses: not relevant to the
  documented native Pro Tools host matrix.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test / counterevidence search | Result | Later dynamic probe |
| --- | --- | --- | --- |
| H1: current Pro Tools natively hosts AAX rather than VST/AU/etc. | Sought current vendor compatibility language, not logos or marketplace listings | **SUPPORTED:** Pro Tools 12+ requires 64-bit AAX [C-012] | Put signed synthetic AAX and non-AAX fixtures in documented locations; record scan results |
| H2: all `.aaxplugin` files provide Native, DSP, and AudioSuite | Compared format name with mode declarations | **FALSIFIED:** developers may implement selected modes only [C-013] | Build authorized fixtures for each mode combination and inspect menus/render paths |
| H3: “format accepted” implies a working full host contract | Checked scan, configuration, I/O, state, latency, architecture, and render evidence separately | **FALSIFIED:** each is conditional [C-014]–[C-020] | Matrix tests: accepted → scanned → cataloged → instantiated → processed → automated → saved/restored |
| H4: AAX Native is sandboxed/separate-process | Looked for explicit process/crash-containment wording; challenged “host environment” phrasing | **UNKNOWN; not supported** [C-032] | Observe process tree and crash behavior with a lawful signed fault-injection fixture |
| H5: current scanner is a separate OS process | Examined 2026.4 phrase “plugin scan process” | **UNKNOWN:** “process” may mean workflow [C-015] | Process/log capture during cold scan; no proprietary inspection |
| H6: current plug-in automation is sample-accurate | Distinguished `.ptxm` track volume/pan from AAX parameter automation | **NOT ESTABLISHED:** historical AAX says deterministic, not sample-accurate [C-018] | Impulse/parameter-step render across buffer sizes and repeats |
| H7: Apple-silicon native mode bridges Intel-only AAX | Read explicit FAQ loading rules | **FALSIFIED:** use Rosetta; native omits Intel-only AAX [C-016] | Open a session under native and Rosetta with authorized universal/Intel fixtures |
| H8: missing plug-ins lose their insert/state immediately | Reviewed inactive-placeholder, Session Notes, and Missing Plugins evidence | **FALSIFIED documentarily:** placeholder/report path exists [C-019] [C-020] | Remove/reinstall fixture and compare state hash after recall |
| H9: ARA support means Pro Tools loads VST3 | Compared ARA integration evidence to binary-format requirement | **FALSIFIED:** host still requires AAX [C-012] [C-031] | Inspect an authorized partner's installed formats and Pro Tools catalog entry |
| H10: post interchange preserves every session semantic | Reviewed `.ptxm` compatibility-subset and rendered fallback rules | **FALSIFIED:** export deliberately constrains contents [C-022] | Roundtrip automation, markers, routing, clips, ARA, plug-ins, and immersive objects |

No dynamic probe was performed in this documentary wave.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current snapshot is 2026.4.1; qualified platforms are specified macOS/Windows configurations, not Linux | 2026.4.1 | S-001, S-002, S-015 | Release page, compatibility chart, release notes triangulate | Qualification is not universal incompatibility outside list |
| C-002 | DOCUMENTED | High | Editions are Intro/Artist/Studio/Ultimate; one installer uses different authorizations; subscription/perpetual paths exist | Current family | S-004, S-008, S-015 | Current product, perpetual, release notes | Full tier limits/prices not captured |
| C-003 | DOCUMENTED | High | Main model is linear session/timeline; Sketch adds nonlinear scenes/clips and exchange to Edit window | Current/2023.9+ | S-001, S-004, S-010 | Vendor feature descriptions | Usage prevalence unknown |
| C-004 | UNKNOWN | High that unknown | Core graph, scheduler, services, and `.ptx` internals are proprietary/unavailable in reviewed public text | 2026.4.1 | None | Current PDF inaccessible; public pages expose boundaries, not internals | A click-through SDK or later public engineering paper may add detail |
| C-005 | DOCUMENTED | High | AAE is AAX host boundary; HDX external DSP and Hybrid track Native/DSP modes are documented | AAX/HDX | S-006, S-007 | SDK guide plus current HDX page | Detailed AAE guide is old; performance claims vendor-only |
| C-006 | DOCUMENTED | Medium-high | 32-bit-float paths, optional 64-bit plug-in processing, published HDX scale/latency, and historical latency domains exist | Current HDX + historical AAE | S-004, S-006, S-007 | Scope kept explicit | Scheduler rules and 0.7 ms not independently measured |
| C-007 | DOCUMENTED | High | Timeline, edit modes, clips, playlists, comping, Elastic Audio, loop/punch, clip gain and Track Pin are product features | Current | S-004, S-009, S-015 | Current vendor pages | Exact tier limits unknown |
| C-008 | DOCUMENTED | High | MIDI editing/playlists/effects and Sibelius MIDI clipboard exchange are documented | Current/2024.3+ | S-001, S-004, S-010 | Current/release pages | Full notation depth unknown |
| C-009 | UNKNOWN | Medium-high | Current MPE, MIDI 2.0, SysEx, sample-accurate event delivery and current dynamic I/O semantics were not established | 2026.4.1 | None | Searched current product/release/SDK materials; no decisive passage | Absence is not unsupported status; dynamic/current manual probe needed |
| C-010 | DOCUMENTED | High | Flexible buses/sends/folders, automation, EUCON/control, sidechains and immersive routing are documented | Current | S-004, S-006, S-009, S-015 | Multiple primary pages | Generic OSC and feedback rules unknown |
| C-011 | DOCUMENTED | High | Pro Tools has deep ADR/Foley, picture, AAF, immersive, shared-storage and delivery workflows | Current | S-001, S-009, S-010, S-015 | Current post page plus releases | Some counts are high-end/tier-specific vendor figures |
| C-012 | DOCUMENTED | High | Pro Tools 12+ requires plug-ins to be 64-bit AAX; listed non-AAX formats are not native host inputs | Current lineage | S-012 | Explicit compatibility statement | Does not rule out third-party AAX wrappers |
| C-013 | DOCUMENTED | High for definitions; medium for current detail | AAX modes are AudioSuite, Native, DSP with distinct file/CPU/DSP behavior; a plug-in may implement selected modes | AAX SDK 2.1.1 + current portal | S-003, S-006, S-007 | Current portal corroborates real-time/offline AAX and current HDX corroborates DSP | Rich detail generated 2014; newest public detailed SDK unavailable |
| C-014 | DOCUMENTED | Medium | Historical official host guide documents AAX paths, recursive discovery, signature validation, Describe/catalog and cache invalidation | AAX SDK 2.1.1 | S-006 | Direct official SDK documentation | Current path/cache implementation not independently reverified |
| C-015 | UNKNOWN | High that unknown | Current rescan UX, duplicate resolution, blacklist/quarantine, cache schema and scanner OS-process boundary are unknown | 2026.4.1 | S-015 | Release notes prove a scan workflow only | “Plugin scan process” is ambiguous |
| C-016 | DOCUMENTED | High | Universal AAX loads native/Rosetta/Intel; Intel-only AAX cannot load in native Apple-silicon Pro Tools and becomes missing in session | Apple silicon, 2023.3+ | S-005, S-015 | Explicit Avid FAQ plus current M5 qualification | Third-party inventory is volatile; FAQ mechanism is 2023-dated |
| C-017 | DOCUMENTED | Medium | AAX supports configuration negotiation, sidechains, multi-mono and fixed auxiliary output stems; older guide constrains dynamic AOS | AAX SDK 2.1.1 | S-006 | Direct detailed host guide | Current extensions unknown; stem limits may have evolved |
| C-018 | DOCUMENTED | Medium-high | AAX automation is historically deterministic not promised sample-accurate; plug-ins report latency; bypass preserves delay; offline render rules exist | AAX SDK 2.1.1/current ADC presence | S-006, S-015 | Old contract plus current fixes | Exact 2026 dynamic latency/automation granularity unknown |
| C-019 | DOCUMENTED | Medium-high | AAX state uses plug-in-owned chunks and host presets; inactive/missing inserts retain placeholders/state | AAX SDK 2.1.1/current corroboration | S-005, S-006 | SDK detail plus current missing-session behavior | Corrupt-state/assets/migration details unknown |
| C-020 | DOCUMENTED | High | Current and historical diagnostics include scan/load/signature errors, Session Notes and a Missing Plugins text report | AAX/current | S-005, S-006, S-015 | Triangulated primary sources | End-user log detail and containment unknown |
| C-021 | DOCUMENTED | High | Scripting SDK is external, inter-process, language-independent, certificate-validated, cross-tier and cross-desktop-OS | 2022.12+ | S-013 | Explicit Avid engineering article | Complete API/version guarantees are account-gated |
| C-022 | DOCUMENTED | High | Session summary/import, `.ptxm`, `.ptx` use, AAF, Sibelius and Avid post exchange preserve bounded documented data | Current with version bounds | S-010, S-014, S-015 | Primary interchange plus linked secondary `.ptx` guide | `.ptx` schema and complete semantic matrix unknown |
| C-023 | UNKNOWN | High that unknown | Project schema, asset/state migration, complete codec/exchange matrix and conflict/recovery internals are unknown | 2026.4.1 | S-011 | Current guide PDF was listed but fetcher could not ingest PDF | Accessible equivalent or authorized manual reading could reduce gap |
| C-024 | DOCUMENTED | High | Product uses iLok authorization; AAX evaluation is click-through and commercialization/signing requires Avid/PACE/iLok tools/accounts | Current | S-003, S-006, S-008, S-015 | Current developer/product sources plus historical signature detail | Exact agreement terms not accepted/reviewed; not legal advice |
| C-025 | DOCUMENTED | High | Current release notes expose system requirements, known defect classes/fixes and co-install dependencies | 2026.4.1 | S-002, S-015 | Current primary KB | Fix list is not an independent reliability measure |
| C-026 | DOCUMENTED | Medium-high | VoiceOver resources and current accessibility fixes exist; some older areas were only partly accessible | PTAccess through 2022.9 + 2026.4 | S-011, S-014, S-015 | Avid links PTAccess; release notes add current fixes | No complete 2026 conformance statement |
| C-027 | INFERENCE | Medium-high | Single signed AAX policy simplifies the native matrix but creates ecosystem/licensing concentration and does not prove isolation | Architecture synthesis | C-012, C-013, C-024, C-032 | Derived from documented format/gate and unknown isolation | Alternative multi-format designs may trade simplicity for reach |
| C-029 | UNKNOWN | High that unknown | Current third-party AAX UI scaling/detachment/headless/accessibility contract is unknown | 2026.4.1 | S-006 | Old guide confirms GUI hosting only | Current SDK/fixture required |
| C-030 | UNKNOWN | High that unknown | Exact current sample-rate, tier scaling, oversampling/dropout and complete buffer policy are unknown | 2026.4.1 | S-011 | Comparison cells/PDF text inaccessible | Current manual or qualified runtime would discriminate |
| C-031 | DOCUMENTED | High | Selected ARA 2 integration and AAX MIDI effects are current extensions but do not alter AAX binary requirement | 2024.3–2026.4.1 | S-001, S-010, S-012, S-015 | Release history plus format requirement | Partner compatibility is bounded/volatile |
| C-032 | UNKNOWN | High that unknown | No reviewed public source proves AAX Native per-plug-in sandboxing, separate-process execution or crash recovery | 2026.4.1 | S-006, S-015 | Challenged ambiguous “host environment/process” wording | Safe signed fixture/process observation required |

## 22. Source ledger and adaptive bibliography

All URLs were accessed 2026-08-29. Search-result text was treated as untrusted
discovery evidence and is not cited for claims.

### S-001 — What's new in Pro Tools

- **Publisher / kind / scope:** Avid; current product release history; through
  2026.4.1.
- **URL:** https://www.avid.com/pro-tools/whats-new
- **Relevant sections:** “Pro Tools 2026.4.1,” “2026.4,” Apple silicon 2023.3,
  Sketch 2023.9, AAX MIDI 2024.3, ARA, immersive, SoundFlow.
- **Claims:** C-001, C-003, C-008, C-011, C-031.
- **Limitations:** marketing/release summary; not a complete manual.
- **Selection rationale:** official chronological source; preferable to press and
  retailer summaries for version provenance.

### S-002 — Pro Tools Operating System Compatibility Chart

- **Publisher / kind / scope:** Avid Knowledge Base; qualified OS matrix; updated
  2026-07-09.
- **URL:** https://avidtech.my.salesforce-sites.com/pkb/articles/en_US/compatibility/Pro-Tools-Operating-System-Compatibility-Chart
- **Relevant section:** 2026.4(.1) row and qualification caveats.
- **Claims:** C-001, C-025.
- **Limitations:** OS-level matrix, not complete hardware/plugin qualification.
- **Selection rationale:** current official matrix, preferable to generic system-
  requirements marketing.

### S-003 — Audio Development Partner Program: AAX SDK

- **Publisher / kind / scope:** Avid Developer; current AAX program/licensing
  landing page.
- **URL:** https://developer.avid.com/aax/
- **Relevant passage:** AAX real-time/offline effects/instruments; click-through
  evaluation; commercialization contact; Avid/iLok accounts and USB-key signing.
- **Claims:** C-013, C-024.
- **Limitations:** detailed current SDK/documentation is account/click-through
  gated.
- **Selection rationale:** primary format-owner source, preferable to third-party
  developer descriptions.

### S-004 — Pro Tools product page

- **Publisher / kind / scope:** Avid; current product overview.
- **URL:** https://www.avid.com/pro-tools
- **Relevant sections:** editions/offers; record/edit/MIDI/mix; edit modes,
  playlists, folders, automation, ARA 2, 32-bit float.
- **Claims:** C-002, C-003, C-006, C-007, C-008, C-010.
- **Limitations:** feature cells/pricing are partially JS-rendered; broad vendor
  claims and no host-contract detail.
- **Selection rationale:** current canonical product identity and workflows.

### S-005 — Pro Tools Apple Silicon Support FAQ

- **Publisher / kind / scope:** Avid Knowledge Base; native/Rosetta mechanism;
  updated 2023-06-08.
- **URL:** https://kb.avid.com/pkb/articles/en_US/Knowledge/Pro-Tools-Apple-Silicon-Support-FAQ
- **Relevant sections:** universal binary, default native mode, universal versus
  Intel-only AAX, Session Notes/missing menu entries.
- **Claims:** C-016, C-019, C-020.
- **Limitations:** mechanism dates to 2023 transition; not a 2026 partner inventory.
- **Selection rationale:** explicit primary loading rules, preferable to plug-in
  vendor anecdotes.

### S-006 — AAX SDK 2.1.1: Pro Tools Guide

- **Publisher / kind / scope:** Avid; public SDK Doxygen; generated 2014-02-06.
- **URL:** https://learn-cdn.avid.com/AAX_SDK_2p1p1/Documentation/Doxygen/output/html/a00274.html
- **Relevant sections:** processing modes; install/signature; loading/cache;
  engine; configurations; bypass; presets/chunks; sidechain/AOS; ADC; AudioSuite;
  debugging/failure diagnostics.
- **Claims:** C-005, C-006, C-010, C-013, C-014, C-017–C-020, C-029, C-032.
- **Limitations:** old SDK and release-dependent rules; not treated as proof that
  every detail is unchanged in 2026. Newer guessed public paths returned 404.
- **Selection rationale:** only accessible first-party detailed host contract;
  retained with strict temporal bounds instead of using unofficial SDK mirrors.

### S-007 — Pro Tools | HDX

- **Publisher / kind / scope:** Avid; current HDX/Hybrid product architecture.
- **URL:** https://www.avid.com/products/pro-tools-hdx
- **Relevant sections:** DSP/FPGA, 32-bit-float streaming, Native/DSP toggling,
  AAX DSP, voices/I/O/cards/latency, Satellite Link.
- **Claims:** C-005, C-006, C-010, C-013.
- **Limitations:** vendor performance/quality claims; configuration dependent.
- **Selection rationale:** current primary corroboration for hardware AAX DSP,
  preferable to the historical SDK alone.

### S-008 — Pro Tools Perpetual

- **Publisher / kind / scope:** Avid; current perpetual licensing page.
- **URL:** https://www.avid.com/pro-tools/perpetual
- **Relevant sections:** Studio/Ultimate upgrades, one-year updates/support,
  reseller path.
- **Claims:** C-002, C-024.
- **Limitations:** pricing is volatile and not decision-critical; no full EULA.
- **Selection rationale:** official current entitlement evidence.

### S-009 — Pro Tools Audio Post

- **Publisher / kind / scope:** Avid; current audio-post workflow page.
- **URL:** https://www.avid.com/pro-tools/audio-post
- **Relevant sections:** ADR/Foley; design/cut/sync; Media Composer; automation,
  control surfaces, immersive and delivery.
- **Claims:** C-007, C-010, C-011.
- **Limitations:** marketing page; high-end counts are edition/configuration
  dependent.
- **Selection rationale:** canonical current statement of post specialization.

### S-010 — Pro Tools 2024.6 Now Available—What's New

- **Publisher / kind / scope:** Avid; engineering release article; 2024.6.
- **URL:** https://www.avid.com/resource-center/whats-new-in-pro-tools-20246
- **Relevant sections:** Import Session Data summary; ARA; `.ptxm`; sample-
  accurate automation; Atmos stems; Sibelius; Sketch/AAX preset transfer.
- **Claims:** C-003, C-008, C-011, C-022, C-031.
- **Limitations:** versioned feature article, not full compatibility spec.
- **Selection rationale:** unusually detailed first-party interchange semantics.

### S-011 — Pro Tools Documentation

- **Publisher / kind / scope:** Avid Knowledge Base; documentation index; updated
  2026-04-28.
- **URL:** https://kb.avid.com/pkb/articles/en_US/user_guide/Pro-Tools-Documentation
- **Relevant sections:** current 2026.4 Reference Guide, ReadMes, release docs,
  plugin guides, system requirements, PTAccess link.
- **Claims:** C-023, C-026, C-030.
- **Limitations:** linked PDFs could not be ingested by the fetcher; index proves
  provenance/availability, not their contents.
- **Selection rationale:** authoritative version pin and explicit access-limit
  record; preferable to repeatedly retrying PDFs or using mirrors.

### S-012 — Pro Tools Plugin Compatibility

- **Publisher / kind / scope:** Avid Knowledge Base; format/compatibility policy;
  updated 2023-03-24.
- **URL:** https://kb.avid.com/pkb/articles/en_US/Knowledge/en343311
- **Relevant passage:** Pro Tools 12+ requires plug-ins to be AAX and 64-bit;
  third-party products are not directly qualified by Avid.
- **Claims:** C-012, C-031.
- **Limitations:** page update predates 2026, but the current release links AAX
  compatibility and no later contrary format policy was found.
- **Selection rationale:** explicit first-party rule needed to avoid inferring
  non-support from absent logos.

### S-013 — Pro Tools Scripting SDK is now available

- **Publisher / kind / scope:** Avid engineering/resource article; 2022.12–2023.9
  API overview.
- **URL:** https://www.avid.com/resource-center/pro-tools-scripting-sdk
- **Relevant sections:** language-independent API; external inter-process
  component; certificate validation; commands; all tiers/macOS/Windows.
- **Claims:** C-021.
- **Limitations:** complete current API docs require account signup; article does
  not provide all 2026 calls/version guarantees.
- **Selection rationale:** explicit process-boundary evidence from Avid.

### S-014 — PTAccess: Pro Tools Tutorial for Screen Reader Users

- **Publisher / kind / scope:** Berklee College of Music/Audio & Music Technology
  Innovation Lab; secondary guide linked by Avid; through 2022.9.
- **URL:** https://ptaccess.github.io/
- **Relevant sections:** VoiceOver setup, `.ptx` sessions, backups/archive,
  routing/automation/AudioSuite, partial Elastic Audio accessibility.
- **Claims:** C-022, C-026.
- **Limitations:** secondary and stale for 2026; no full conformance assessment.
- **Selection rationale:** selected because Avid's current docs index points to it
  and no equivalent accessible current first-party text was available.

### S-015 — Pro Tools 2026.4(.1) Release Notes

- **Publisher / kind / scope:** Avid Knowledge Base; current release/system/
  authorization/fixes; updated 2026-08-01.
- **URL:** https://kb.avid.com/pkb/articles/Knowledge/Pro-Tools-2026-4-Release-Notes
- **Relevant sections:** releases/system requirements/authorization/installer;
  editions; Missing Plugins report; AAF/ARA/automation/ADC/Hybrid/scan/
  accessibility fixes; MPEG-H.
- **Claims:** C-001, C-002, C-005, C-010, C-011, C-015, C-016, C-018, C-020,
  C-022, C-024–C-026, C-031, C-032.
- **Limitations:** fixed-bug list is not architecture disclosure or independent
  reliability testing; linked known-issues ReadMes are PDFs.
- **Selection rationale:** highest-value final follow-up; current primary source
  that triangulates version, platform, licensing, scanning, persistence, and
  reliability.

### Discovery/access negatives retained

- Two broad searches returned HTTP 429; later DuckDuckGo produced a CAPTCHA,
  Google an access block, and Avid search an empty JS shell.
- The guessed `/pro-tools/system-requirements` and audio-post URL returned 404;
  official alternate KB/current sitemap paths were used.
- The 2026.4 Reference Guide PDF was rejected by the fetcher as unsupported
  content. Per contract it was not repeatedly retried and no mirror was used.
- Guessed AAX SDK 2.7.0 and 2.6.1 public Doxygen paths returned 404. Current SDK
  access remains click-through/account gated.
- The comparison page loaded without its JS feature cells, so precise tier tables
  were not inferred.

## 23. Unknowns and next discriminating probes

| ID | Consequential unknown | Attempted method / blocker | Impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- | --- |
| U-001 | Current scanner OS-process boundary, quarantine, rescan, duplicates, cache | Official KB/search attempts blocked or silent; release notes ambiguous | Security, startup reliability, diagnosability | Disposable qualified host; lawful signed duplicate/crash/timeout fixtures; process/log capture | Unassigned |
| U-002 | Current detailed AAX host contract | Current SDK docs require click-through/account; public newer paths 404 | ABI, dynamic I/O, UI, state, latency conclusions | Authorized AAX partner review of current SDK under its terms; publish only non-confidential conclusions | Unassigned |
| U-003 | AAX Native/DSP crash containment and sandboxing | Public sources say host/DSP environment but no isolation guarantee | Reliability/security architecture | Signed fault-injection fixture on disposable system; observe process termination/recovery without proprietary inspection | Unassigned |
| U-004 | Current plug-in parameter and MIDI event timing granularity | Old guide says deterministic, not sample-accurate; current manual inaccessible | Automation fidelity | Render parameter/MIDI steps against impulses across buffers, repeats, Native/DSP/offline | Unassigned |
| U-005 | MPE, MIDI 2.0, SysEx, dynamic I/O and tails | No decisive current primary passage in retained sources | Expressive instrument/host-contract design | Read authorized current guide/SDK, then synthetic capability fixtures | Unassigned |
| U-006 | `.ptx` schema, plugin/ARA assets, corruption/migration/recovery | Proprietary; no reverse engineering allowed; PDF inaccessible | Project durability and migration | Black-box create/save/reopen/remove/reinstall/version-roundtrip corpus with hashes and user-visible reports | Unassigned |
| U-007 | Full AAF/OMF/ADM/MusicXML/DAWproject and codec semantics | Accessible sources prove only selected paths; current manual PDF blocked | Interchange decision | Qualified roundtrip corpus per declared format; use canonical partner apps and compare semantic manifest | Unassigned |
| U-008 | Exact current edition limits | Comparison feature cells did not render | Product procurement/scaling comparison | Capture Avid's accessible comparison export or request official tier matrix | Unassigned |
| U-009 | 2026 accessibility completeness and third-party UI accessibility | PTAccess is older; release notes show fixes, not conformance | Inclusive product requirement | Screen-reader task audit on 2026.4.1 including standard and third-party AAX UIs | Unassigned |
| U-010 | Exact AAX commercial/legal rights and redistribution/certification terms | Click-through not accepted; no authority to interpret | Feasibility/legal risk | Counsel and authorized business contact review current Avid/PACE agreements | Unassigned |
| U-011 | Per-vendor Apple-silicon and mode compatibility | Avid delegates partner qualification; inventory changes | Session portability | Version-pinned compatibility manifest plus authorized fixture matrix | Unassigned |

## 24. Curiosity pass and stop decision

Scores use 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Current 2026.4 release notes for scan/licensing/persistence | 5 | 5 | 4 | 1 | **PURSUED** as S-015; changed and corroborated multiple claims |
| Newer public AAX detailed SDK | 5 | 5 | 5 | 3 | `CURIOSITY_NO_GO`: two 404s; portal gated; further guessing low yield |
| Scanner/sandbox official search | 5 | 4 | 5 | 3 | `CURIOSITY_NO_GO`: repeated rate-limit/CAPTCHA/empty results and no primary passage |
| Runtime crash/process experiments | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO`: documentary wave excludes installation/binary execution |
| Complete tier matrix | 3 | 3 | 2 | 2 | `CURIOSITY_NO_GO`: JS cells inaccessible; unknown is visible and not architecture-changing |
| Every post codec/exchange format | 3 | 3 | 2 | 4 | `CURIOSITY_NO_GO`: current architecture conclusion already supported; prototype is higher value |
| Included plug-in inventory/benchmarks | 2 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: volatile and not host-contract evidence |

**Stop decision:** stop on **coverage plus saturation and access boundary**. Every
required heading and format row is complete; the decision-critical AAX modes,
scan/cache model, Apple-silicon behavior, I/O/automation/latency/state, post/
interchange, editions/platforms, and licensing are covered by primary sources or
explicit unknowns. The highest-value follow-up was pursued. Additional public
searches repeated access failures or duplicates, while remaining material gaps
require a current authorized SDK/manual or bounded dynamic qualification. The
next phase should be a signed-fixture interoperability harness, not more
unbounded web search.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Verified with repository
  status/diff checks after authoring; pre-existing changes were not touched.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See section 0 and C-001/C-002.
- [x] **Every required dossier heading exists in order.** Sections 0–25 are
  present, including all 11.x subsections.
- [x] **Every material assertion has a claim ID and classification.** Substantive
  claims are labeled in text and resolve through section 21.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  sections 21 and 23.
- [x] **Every required plugin-format row is present.** Thirteen required rows are
  populated in section 11.1 with no blank status cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover discovery, isolation, I/O, timing, state, UI, and
  diagnostics.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Claim classifications and source limitations are explicit.
- [x] **Licensing and clean-room boundaries are explicit.** See sections 0 and 16.
- [x] **Bibliography records source rationale and limitations.** See section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See sections
  19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Documentary fetch/read only; no product binaries ran.

**Owned path:** `research/daw-landscape/dossiers/avid-pro-tools.md`

**Checks performed:** heading/order scan; required-format-row scan; claim/source
cross-reference review; blank-cell review; clean-room/licensing review; repository
status and diff-scope review.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; 15 retained sources (14 Avid
primary/index pages plus one Avid-linked Berklee secondary accessibility guide).

**Unresolved blockers:** current Reference Guide/ReadMes are PDF-inaccessible to
the fetcher; current detailed AAX SDK and exact license terms are click-through/
account gated; process isolation and full host fidelity require a later lawful
dynamic harness.

**Pre-existing workspace changes:** left untouched; no staging or commit.
