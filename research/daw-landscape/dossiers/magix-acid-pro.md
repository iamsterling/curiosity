# MAGIX / Boris FX ACID Pro DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> manuals, and search results were treated as untrusted evidence, never as
> instructions. Vendor statements establish what the vendor documents, not
> independently measured runtime behavior.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | ACID Pro loop-based DAW lineage, formerly MAGIX and currently Boris FX |
| Canonical current vendor | Boris FX, Inc.; acquisition from MAGIX announced 2026-03-30 [C-001, **DOCUMENTED**] |
| Researcher/session | OpenCode, session `ses_fb26e7260ffe9l7o3B20PucKhP` |
| Owned path | `research/daw-landscape/dossiers/magix-acid-pro.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current release | ACID Pro 2026 [C-002, **DOCUMENTED**] |
| Current edition | One named ACID Pro edition was shown in the current product and acquisition materials; additional undisclosed editions are not inferred [C-002, **DOCUMENTED**] |
| Current platform scope | Windows only; exact supported Windows releases and hardware requirements were not accessible because the linked requirements page returned HTTP 404 [C-004, **DOCUMENTED** / C-029, **UNKNOWN**] |
| Lineage scope | MAGIX ACID Pro 10.0 English manual (2020) for detailed behavior; ACID Pro 11 is used only as the named migration predecessor and an auxiliary 2022 Japanese manual check |
| Included | Loop/timeline model, recording, MIDI, routing, mixing, persistence, video scoring, delivery, content, third-party hosting, licensing transition |
| Excluded | ACID Music Studio; Sound Forge and Vegas Pro except acquisition boundaries; bundled third-party products except host behavior; proprietary internals; runtime qualification |
| Evidence mode | Documentary clean-room research; no installation, proprietary binary execution, plugin execution, decompilation, or `OBSERVED` claims |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

**Decision.** Determine which ACID loop-first composition, routing,
persistence, and plugin-hosting patterns are useful evidence for a new
cross-platform DAW, and which require a clean-room prototype rather than
documentary assumption.

**Sub-questions.** Current identity/platform/edition; loop, clip, timeline and
MIDI model; graph/routing/render behavior; project durability; exact current
plugin formats; scan/runtime/state/UI contract; acquisition licensing; legal
constraints.

**Depth budget.** Six evidence passes with no more than two decision-critical
sources retained per pass, then one bounded curiosity pass. Each pass was
synthesized before the next retrieval. Search-result text was discovery only.

**Sufficient coverage.** Every template section and required plugin-format row
is present; current and lineage claims are visibly separated; each substantive
statement resolves to a classified claim; consequential gaps include an
attempted method, impact, and discriminating probe.

## 1. Executive summary

- Boris FX acquired ACID Pro from MAGIX on 2026-03-30, retained the product
  engineering teams, and now offers the maintained line as ACID Pro 2026. The
  current trial is Windows-only. Boris FX documents migration paths from MAGIX
  ACID Pro 11, including a complimentary transition for purchases on or after
  2026-01-01. [C-001, C-002, C-004, **DOCUMENTED**]
- The current differentiator remains a loop-first linear timeline: users drag,
  draw, paint, chop, move, trim, and sequence loops alongside recorded audio
  and MIDI. Acidized loops automatically follow project key and tempo; live
  preview, groove application, tempo maps, hit-point markers, and video preview
  support fast music and scoring workflows. [C-005, C-006, **DOCUMENTED**]
- The current page also documents simultaneous multitrack recording, punch-in,
  advanced bussing, submixes, pre/post effects, flexible routing, MIDI
  sequencing, VST instruments, and built-in plus third-party VST effects.
  However, it says only `VST`/`VSTi`; it does not identify VST2 versus VST3 or
  establish a full host contract. [C-007-C-009, **DOCUMENTED**; C-024, C-026,
  C-040, **UNKNOWN**]
- The ACID Pro 10 manual provides unusually useful lineage evidence for
  user-selected VST roots; failed/timed-out, ignored, and unavailable catalogs;
  rescan; DirectX and ReWire discovery; event/track/bus/instrument effects;
  VST3/ARA2; sidechains; multiple VSTi outputs; automation; `.fxp/.fxb`;
  plugin-delay caveats; freeze; `.acd-zip`; backup; and autosave. These details
  are not promoted to ACID Pro 2026 without current confirmation. [C-012-C-023,
  **DOCUMENTED** in ACID Pro 10 scope; C-024, **UNKNOWN** currently]
- No public retained evidence establishes current scanner or runtime process
  isolation, sandboxing, crash containment, architecture bridging, duplicate
  identity, code-signing policy, sample-accurate automation, MPE/MIDI 2.0,
  latency-change/tail handling, missing-plugin placeholders, or durable plugin
  state after removal. [C-025-C-027, C-040, **UNKNOWN**]
- Current commercial pages document subscription, perpetual, and upgrade paths,
  but generic store terms do not establish ACID-specific seats, offline use,
  expiry behavior, installer retention, or upgrade rights. VST3 SDK 3.8 is MIT
  licensed, while Steinberg says VST2 binary distribution requires a VST2
  agreement signed before October 2018. [C-003, **DOCUMENTED**; C-034,
  **UNKNOWN**; C-035, **DOCUMENTED**]

**Confidence:** high for current identity, Windows-only scope, loop workflow,
recording/routing headline, generic VST/VSTi statement, acquisition, and ACID
Pro 10 manual behavior; medium for broad lineage continuity through ACID Pro 11;
low or unknown for current format generations, deep host semantics, proprietary
engine internals, accessibility/security, and controlling license terms.

## 2. Product identity, history, and market position

- Boris FX announced that it acquired Vegas Pro, Sound Forge, and ACID Pro from
  MAGIX on 2026-03-30 and that the Madison, Wisconsin and Germany development
  teams would remain. This establishes the current vendor and organizational
  continuity, not any undisclosed source-code architecture. [C-001,
  **DOCUMENTED**]
- The current product page calls the release ACID Pro 2026 and describes it as
  the original loop-based music software, with the workflow dating to 1998.
  The target ranges from first-time creators to musicians producing songs,
  beats, background music, and video scores. [C-002, C-005, **DOCUMENTED**]
- The product FAQ explicitly distinguishes current ACID Pro 2026 from MAGIX
  ACID Pro 11 and describes serial/account-based upgrade transitions. ACID
  Music Studio is a separate product and is not covered here. [C-002,
  **DOCUMENTED**]
- The acquisition announcement showed one ACID Pro product and point-in-time
  release prices for monthly/annual subscription, Upgrade & Support, and
  perpetual purchase. Those March 2026 prices are historical release evidence,
  not a current procurement quote. [C-003, **DOCUMENTED**]

## 3. Workflow and conceptual model

- Current ACID combines three first-class sources in one project: loop-based
  material, recorded multitrack audio, and MIDI-generated music. Users drag
  loops onto a linear timeline and draw or paint material directly into the
  arrangement. [C-005, **DOCUMENTED**]
- Acidized loops carry enough musical information to match project key and
  tempo automatically. Live preview auditions loops against a playing project;
  Chopper creates rearranged fragments; grooves can alter timing while the
  vendor says original audio remains untouched. [C-005, C-006,
  **DOCUMENTED**]
- In the ACID Pro 10 lineage, a project is a `.acd` description referencing
  source media. Tracks own clips; timeline events select where those clips
  play. Audio clips are typed as loop, one-shot, or Beatmapped, while MIDI
  tracks hold MIDI clips. [C-012, **DOCUMENTED**, ACID Pro 10 scope]
- **INFERENCE:** The transferable conceptual split is metadata-bearing source
  media -> reusable clip -> positioned event, with the project tempo/key map
  transforming eligible clips non-destructively. This interpretation assumes
  the current Acidized-loop language retains the lineage semantics; an
  alternative is that current internals use a different representation behind
  the same workflow. [C-036, **INFERENCE**]
- No scene launcher, tracker grid, browser/mobile composition model, or public
  modular patch graph was established for the current product. This is a scope
  boundary, not proof that every unmentioned workflow is technically
  impossible. [C-028, C-032, **UNKNOWN**]

## 4. Publicly documented architecture

- Current public documentation exposes a linear timeline, audio/MIDI tracks,
  mixer, buses, submixes, effects positions, VST instruments/effects, video
  preview, loudness meters, and media/content library. These are user-visible
  composition boundaries, not implementation internals. [C-005-C-011,
  **DOCUMENTED**]
- The ACID Pro 10 manual exposes a user-visible signal topology of tracks,
  event/track effects, buses, assignable-effect returns, input buses, soft-synth
  output buses, master, hardware I/O, and ReWire connections. [C-014, C-015,
  C-022, **DOCUMENTED**, ACID Pro 10 scope]
- Persistent lineage artifacts include `.acd`, `.acd-bak`, `.acd-zip`, source
  media, frozen WAV files, VST `.fxp/.fxb` files, effect-chain presets, and a
  plugin catalog visible through Failed/Ignored/Unavailable folders. Their
  internal schemas are not public evidence. [C-013, C-017, C-018, C-023,
  **DOCUMENTED**, ACID Pro 10 scope]
- **UNKNOWN:** graph data structures, process/service boundaries, realtime
  thread model, worker scheduling, lock-free behavior, allocation policy,
  plugin wrappers, storage schemas, and native module map remain proprietary.
  UI names were not converted into claims about internals. [C-028,
  **UNKNOWN**]

## 5. Audio engine

- Current ACID documents recording multiple tracks at once, mixing audio,
  loops and MIDI, pre/post effects, advanced bussing, submixes, flexible routing,
  and realtime loudness/dynamics/true-peak analysis. [C-007, C-011,
  **DOCUMENTED**]
- The current page alternates between "1000+" tracks and "unlimited" audio,
  loops, and MIDI. These are vendor capacity descriptions without a disclosed
  fixture; this dossier does not resolve the wording into an independently
  tested limit. [C-039, **DOCUMENTED vendor claim**]
- In ACID Pro 10, non-in-place effects can invoke automatic plugin delay
  compensation, while chains unsuitable for live monitoring are bypassed.
  Non-in-place chains are also bypassed when ACID acts as a ReWire device to
  avoid synchronization problems. [C-015, **DOCUMENTED**, ACID Pro 10 scope]
- The lineage offered normal rendering, real-time WAV rendering for external
  hardware, render-to-new-track, and MIDI-track freeze to WAV. [C-023,
  **DOCUMENTED**, ACID Pro 10 scope]
- **UNKNOWN:** current internal precision, supported sample rates/bit depths,
  block-size behavior, multicore scheduling, PDC limits and dynamic changes,
  plugin tail reporting, oversampling, dropout handling, render determinism,
  and realtime/offline parity. ACID Pro 10 behavior does not establish ACID Pro
  2026 behavior. [C-024, C-026, C-028, **UNKNOWN**]

## 6. Tracks, timeline, clips, and editing

- Current editing includes dragging, drawing and painting on the timeline;
  moving, cutting, copying, pasting and trimming; Chopper slicing/rearrangement;
  automatic pitch/tempo matching; live preview; groove extraction/application;
  and tempo maps aligned to video hit points. [C-005, C-006,
  **DOCUMENTED**]
- ACID Pro 10 distinguishes reusable clips from positioned events and documents
  split/join/trim/reverse/group, automatic crossfades, ripple edits, sections,
  markers, Chopper, event envelopes, event effects, and unlimited undo since
  the last save. [C-012, **DOCUMENTED**, ACID Pro 10 scope]
- The legacy clip types have different playback semantics: loops repeat and are
  loaded into RAM; one-shots do not follow tempo/key and stream from disk;
  Beatmapped clips support long-form tempo alignment; MIDI clips remain on MIDI
  tracks. [C-012, **DOCUMENTED**, ACID Pro 10 scope]
- Current punch-in recording is documented, but take lanes, comping rules,
  edit-history persistence, clip grouping semantics, and current audio/MIDI
  freeze are not. [C-007, **DOCUMENTED**; C-024, C-031, **UNKNOWN**]

## 7. MIDI, sequencing, notation, and expression

- Current ACID documents MIDI sequencing, a piano-roll presentation, VSTi soft
  synths, editable MIDI content, and DLS instrument patches. [C-008, C-010,
  **DOCUMENTED**]
- ACID Pro 10 documents MIDI recording, step and merge recording, inline piano
  roll/drum-grid editing, list editing, controller envelopes, Type 0/1 file
  import, MIDI export, hardware input/output, MIDI thru, MIDI clock, MTC, and
  VSTi/ReWire targets. [C-022, **DOCUMENTED**, ACID Pro 10 scope]
- Legacy VSTi parameters can be selected for bus-track envelopes and recorded in
  touch or latch modes. Freezing renders MIDI plus VSTi parameter envelopes to
  WAV, but only one output can be selected for a multiport VSTi freeze. [C-018,
  C-021, **DOCUMENTED**, ACID Pro 10 scope]
- **UNKNOWN:** current MPE, per-note VST3 note expression, MIDI 2.0/UMP, SysEx
  fidelity, plugin-generated MIDI/event outputs, event bus counts, and
  sample-accurate scheduling. The current term `MIDI` does not resolve these
  contracts. [C-026, C-040, **UNKNOWN**]

## 8. Routing, mixer, automation, and control

- Current documentation names advanced bussing, shared effects, submixes,
  flexible track routing, pre/post effects, solo, mute, volume, and panning.
  [C-007, **DOCUMENTED**]
- ACID Pro 10 permits up to 26 ordinary buses plus master, routes buses to other
  buses or hardware outputs, and blocks circular routing. Buses routed directly
  to hardware are omitted from the normal project render. [C-014,
  **DOCUMENTED**, ACID Pro 10 scope]
- The legacy mixer also has up to 26 input buses and 32 assignable-effect chains
  with up to 32 plugins each. Track sends can be pre/post volume, and input buses
  support processed recording, external synths, hardware effects, and cue
  monitoring. [C-014, **DOCUMENTED**, ACID Pro 10 scope]
- Legacy track, bus, assignable-effect, and VSTi parameter automation uses
  envelopes with Off, Read, Write/Touch, and Write/Latch modes. [C-018,
  **DOCUMENTED**, ACID Pro 10 scope]
- **UNKNOWN:** current bus-count limits, feedback/cycle rules, sidechain
  conventions, arbitrary channel layouts, surround continuity, sample-accurate
  automation, stable parameter IDs, controller API, OSC, and remote protocol.
  [C-024, C-026, C-032, C-040, **UNKNOWN**]

## 9. Recording, comping, and media handling

- Current ACID documents simultaneous multitrack recording, punch-in for another
  take, mixing recorded audio with loops/MIDI, and direct video preview for
  scoring. [C-007, **DOCUMENTED**]
- Current Acidized content follows project pitch and tempo; included content is
  described as nearly 3 GB of royalty-free loops. That is a vendor entitlement
  statement, not an independent legal interpretation of every asset. [C-005,
  C-038, **DOCUMENTED vendor claim**]
- In ACID Pro 10, `.acd` projects reference external source files, while
  `.acd-zip` embeds project media. "Copy all media with project" collects media
  beside the project. Recorded-file directories are configurable. [C-013,
  **DOCUMENTED**, ACID Pro 10 scope]
- **UNKNOWN:** current input-monitoring modes, take-lane/comping model, recording
  precision, codec/container matrix, proxy/conform behavior, metadata fidelity,
  media hashes, relinking, and whether the legacy collection behavior remains.
  [C-024, C-031, **UNKNOWN**]

## 10. Instruments, effects, content, and native devices

- ACID Pro 2026 includes nearly 1,000 loops/one-shots/songs, 15 songs with more
  than 1,100 editable MIDI parts, more than 90 DLS patches, and more than 800
  Acidized elements across three Essential Sounds collections. Counts are
  current vendor inventory claims and may vary by package or update. [C-010,
  **DOCUMENTED vendor claim**]
- The current page documents built-in and third-party VST effects, VSTi soft
  synth support, loudness meters, Chopper, and a loop/content ecosystem.
  [C-008-C-011, **DOCUMENTED**]
- ACID Pro 10 included native/VST instruments, Morphium Pads, loudness metering,
  coreFX, and Vita-based instruments/sampler. Inventory is lineage context, not
  a current entitlement promise. [C-018, C-023, **DOCUMENTED**, ACID Pro 10
  scope]
- No public native-device authoring SDK, modulation ABI, or stable ACID-specific
  third-party format was identified. Built-in devices and content are therefore
  not treated as an extension ABI. [C-032, **UNKNOWN**]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE:no current app` means the retained current source explicitly
describes ACID Pro as Windows-only. `UNKNOWN` does not mean unsupported. Current
generic `VST`/`VSTi` language is not expanded into a VST generation. Legacy
manual claims are identified in the notes and are not current guarantees.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE:no current app | UNKNOWN | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | Current 2026 says only VST/VSTi; ACID Pro 10 uses generic VST and `.fxp/.fxb` but does not uniquely label VST2 | No current accepted/scanned/instantiated VST2 claim; do not infer from legacy preset files | C-009/C-024/C-030; S-001/S-004 |
| VST3 | NOT_APPLICABLE:no current app | UNKNOWN current; DOCUMENTED ACID Pro 10 lineage | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | ACID Pro 10 requires Melodyne's VST3 build for ARA2; current 2026 says only VST/VSTi | Legacy VST3 instantiation is specific to ARA2; current ordinary VST3 effect/instrument contract remains unknown | C-009/C-019/C-024; S-001/S-004 |
| AUv2 | NOT_APPLICABLE:no current app | UNKNOWN | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | No retained current official evidence | Silence is not a binary rejection test | C-030; S-001-S-004 |
| AUv3 | NOT_APPLICABLE:no current app | UNKNOWN | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | No retained current official evidence | No mobile/macOS app; Windows host acceptance still not inferred | C-030; S-001-S-004 |
| AAX | NOT_APPLICABLE:no current app | UNKNOWN | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | No retained current official evidence | Hosting, SDK, signing and certification not established | C-030/C-035; S-001-S-006 |
| CLAP | NOT_APPLICABLE:no current app | UNKNOWN | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | No retained current official evidence | No accepted/scanned/instantiated claim | C-030; S-001-S-004 |
| LV2 | NOT_APPLICABLE:no current app | UNKNOWN | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | No retained current official evidence | No accepted/scanned/instantiated claim | C-030; S-001-S-004 |
| LADSPA | NOT_APPLICABLE:no current app | UNKNOWN | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | No retained current official evidence | No accepted/scanned/instantiated claim | C-030; S-001-S-004 |
| DSSI | NOT_APPLICABLE:no current app | UNKNOWN | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | No retained current official evidence | No accepted/scanned/instantiated claim | C-030; S-001-S-004 |
| JSFX | NOT_APPLICABLE:no current app | UNKNOWN | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | No retained current official evidence | No accepted/scanned/instantiated claim | C-030; S-001-S-004 |
| DirectX/DXi | NOT_APPLICABLE:no current app | UNKNOWN current; DOCUMENTED DirectX effects in ACID Pro 10 lineage | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | Legacy manual says registered DirectX effects are auto-detected | Current retention and DXi instrument behavior are not established | C-015/C-016/C-024/C-030; S-004 |
| Rack Extension | NOT_APPLICABLE:no current app | UNKNOWN | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | No retained current official evidence | No accepted/scanned/instantiated claim | C-030; S-001-S-004 |
| Product-native/other | NOT_APPLICABLE:no current app | DOCUMENTED current built-ins/content; DOCUMENTED ARA2/ReWire in ACID Pro 10 lineage | NOT_APPLICABLE:no current app | NOT_APPLICABLE:no current app | ACID Pro 2026 content/devices; ACID Pro 10 ARA2/ReWire | Built-ins are not a public native authoring ABI; ARA2/ReWire continuity is unknown | C-010/C-011/C-019/C-022/C-024/C-032; S-001/S-004 |

### 11.2 Discovery, scanning, validation, and recovery

- **DOCUMENTED, ACID Pro 10 scope:** VST discovery is a two-step flow: users add,
  edit, or remove search folders, then run Scan. DirectX and ReWire components
  require no folder scan because Windows registration is used for automatic
  detection. [C-016]
- **DOCUMENTED, ACID Pro 10 scope:** Audio effects and soft synths have Failed,
  Ignored, and Unavailable folders. Failed includes scan errors and timeouts and
  supports per-plugin rescan. Ignored suppresses a plugin without uninstalling.
  Unavailable retains information after uninstall so settings can be restored
  if the plugin is reinstalled. [C-017]
- **INFERENCE:** This is a useful failure-aware catalog model because discovery
  outcome and user policy are represented separately. The manual does not prove
  a transactional database, a validator process, or exact restore fidelity; a
  simpler INI/registry implementation is a plausible alternative. [C-037,
  **INFERENCE**]
- **UNKNOWN current/deep behavior:** scan-on-start policy, cache schema,
  fingerprints, duplicate IDs, shell plugins, version selection, quarantine,
  process isolation, timeout enforcement, crash restart, logs, and ACID Pro 2026
  continuity. [C-024, C-025, **UNKNOWN**]

### 11.3 Runtime isolation and compatibility

- ACID Pro 10 locks a used VST/VSTi for the rest of the application session, and
  its global bypass can either keep effects open for fast A/B or fully bypass
  them to conserve processing power. These are lifecycle controls, not process
  isolation. [C-018, **DOCUMENTED**, ACID Pro 10 scope]
- **UNKNOWN:** in-process versus separate-process scanning and rendering,
  per-plugin/shared sandbox, crash containment/restart, memory or CPU watchdogs,
  32/64-bit bridging, architecture translation, code-signature enforcement,
  trust prompts, and compatibility-mode delivery. Windows-only application
  scope says nothing about accepted plugin bitness. [C-025, **UNKNOWN**]

### 11.4 Host/plugin processing contract

- **DOCUMENTED current headline:** ACID Pro 2026 hosts VST instruments and
  built-in/third-party VST effects. This establishes format-family placement,
  not generation or ABI completeness. [C-008, C-009]
- **DOCUMENTED, ACID Pro 10 scope:** DirectX/VST effects can be placed at event,
  track, bus, assignable-return, and soft-synth scopes; compatible parameters
  can be automated; plugins can be bypassed; non-in-place behavior participates
  in the documented delay/bypass rules. [C-015, C-018]
- **DOCUMENTED, ACID Pro 10 scope:** Multi-output VSTi ports become separate
  soft-synth buses. Output-count changes appear only when the instrument
  notifies the host. Sidechain-capable third-party effects are assumed to use
  inputs 3/4; sidechain is unavailable in surround projects. [C-020, C-021]
- **DOCUMENTED, ACID Pro 10 scope:** ReWire 2.0 devices can receive MIDI while
  ACID is mixer/host; ACID itself exposes a ReWire 1.0 device. Playback position
  exchange is described as sample-level accurate. [C-022]
- **UNKNOWN current/deep behavior:** audio/event bus counts and activation,
  dynamic I/O beyond the lineage notification note, plugin MIDI output, note
  expression, MPE/MIDI 2.0, sample offsets, sample-accurate parameter changes,
  latency updates, tails, bypass/suspend callback mapping, offline callback
  shape, and deterministic rendering. [C-024, C-026, C-040, **UNKNOWN**]

### 11.5 Parameters, automation, state, presets, and project recall

- **DOCUMENTED, ACID Pro 10 scope:** Host-visible effect and VSTi parameters can
  be selected for timeline envelopes and recorded in touch/latch modes. VST
  effect/instrument `.fxp` presets and `.fxb` banks can be loaded/saved; chain
  presets save order and settings. [C-018]
- **DOCUMENTED, ACID Pro 10 scope:** `.acd` stores track layout, envelope
  settings and effect parameters; `.acd-zip` collects project media. The manual
  separately says Unavailable catalog entries preserve information so settings
  can be restored after reinstall. [C-013, C-017]
- **UNKNOWN:** exact plugin key/identity, parameter IDs/ranges/text, opaque state
  chunks, external assets, preset migration, VST2-to-VST3 substitution,
  missing-plugin placeholders, whether state survives opening/resaving while
  absent, and corrupt-state recovery. Catalog retention is not proof of project
  placeholder fidelity. [C-027, **UNKNOWN**]

### 11.6 UI, diagnostics, and failure modes

- **DOCUMENTED, ACID Pro 10 scope:** The Audio Plug-In and Soft Synth Properties
  windows expose plugin controls, presets/banks, chain editing, help, bypass,
  automation, and the instrument interface. The Plug-In Manager exposes failed,
  ignored, unavailable, vendor/category, rename, and rescan surfaces. [C-017,
  C-018]
- **DOCUMENTED, ACID Pro 10 scope:** Failed plugins include scans that timed out
  or completed incorrectly. The user can attempt an individual rescan. [C-017]
- **UNKNOWN:** custom editor embedding versus detachment in 2026, generic/headless
  fallback, DPI scaling, resize/focus/IME, accessibility propagation, runtime
  crash dialogs, log/minidump paths, window restoration, and missing-plugin UI.
  [C-024, C-025, C-027, C-029, **UNKNOWN**]

## 12. Extensibility and integration

- Current third-party integration is documented only at the generic VST/VSTi
  boundary. Video preview and hit-point tempo maps integrate scoring with a
  picture timeline. [C-006, C-009, **DOCUMENTED**]
- ACID Pro 10 also documents DirectX effects, ARA2/Melodyne, ReWire host/device,
  external MIDI/hardware I/O, Mackie Control, TranzPort, FaderPort, and a generic
  control-surface path. These are lineage integrations, not current promises.
  [C-019, C-022, **DOCUMENTED**, ACID Pro 10 scope]
- **UNKNOWN:** scripting language, macro/action API, public controller SDK,
  native-device authoring ABI, remote/OSC API, project protocol, and extension
  compatibility/versioning policy. [C-032, **UNKNOWN**]

## 13. Project format, persistence, interoperability, and collaboration

- In ACID Pro 10, `.acd` stores project arrangement/settings and references
  source media; `.acd-zip` stores the project and media in compressed form;
  Copy all media collects assets next to the project. [C-013,
  **DOCUMENTED**, ACID Pro 10 scope]
- Legacy `.acd-bak` backups are created on open/save by default. Optional
  autosave writes a temporary project every five minutes for crash recovery
  without overwriting the original. [C-013, **DOCUMENTED**, ACID Pro 10 scope]
- The ACID Pro 10 manual warns that saving ACID 1.0-10.0 projects in "recent
  ACID software" can make them unusable in earlier versions and recommends Save
  As. This establishes a migration hazard, not a current compatibility
  guarantee. [C-013, **DOCUMENTED**, ACID Pro 10 scope]
- Frozen MIDI WAV files can be embedded in `.acd-zip`, providing a lineage
  collaboration path when recipients lack a soft synth. [C-023,
  **DOCUMENTED**, ACID Pro 10 scope]
- **UNKNOWN current:** project schema, atomic save, backup/autosave continuity,
  forward/backward compatibility, missing-media relink, content manifests,
  plugin placeholders, archive security, AAF/OMF/ADM/MusicXML/DAWproject,
  cloud collaboration, merge, and version control. [C-024, C-027, C-031,
  **UNKNOWN**]

## 14. Delivery, live, post-production, and specialized workflows

- Current ACID can deliver a project as a mixed file, shows loudness/dynamics/
  true-peak meters, and supports direct video preview plus tempo maps aligned to
  hit points for soundtracks, trailers, and intros. [C-006, C-007, C-011,
  **DOCUMENTED**]
- ACID Pro 10 documents normal and real-time WAV rendering, rendering each bus
  or track, 5.1 projects, CD authoring, and video work. These remain lineage
  evidence only. [C-014, C-023, **DOCUMENTED**, ACID Pro 10 scope]
- No current scene-based live-performance mode, show control, ADR, immersive/ADM,
  DDP, batch-delivery contract, AAF/OMF, or exact audio/video export matrix was
  established. [C-033, **UNKNOWN**]

## 15. Performance, reliability, security, and accessibility

- The current trial is Windows-only. The product page claims recording/mixing
  one track or 1000+ and elsewhere says unlimited audio/loops/MIDI; no benchmark
  or exact supported configuration was retained. [C-004, C-039,
  **DOCUMENTED vendor claim**]
- ACID Pro 10's failed/timed-out catalog, targeted rescan, ignored state,
  unavailable state, `.acd-bak`, and five-minute autosave are useful lineage
  reliability surfaces. They do not prove current continuity or process
  containment. [C-013, C-017, **DOCUMENTED**, ACID Pro 10 scope; C-024,
  C-025, **UNKNOWN**]
- **UNKNOWN:** exact current Windows/hardware baseline, load scaling, resource
  meters, crash containment, safe-mode recovery, rollback, plugin signing/trust,
  updater security, telemetry/privacy defaults, network exposure, screen-reader
  support, keyboard-only coverage, contrast, localization, and accessibility
  conformance. [C-029, **UNKNOWN**]

## 16. Licensing, ecosystem, and implementation constraints

- The March 2026 acquisition release listed ACID Pro monthly and annual
  subscriptions, Upgrade & Support, and a perpetual license. The current page
  documents ACID Pro 11 upgrade/subscription migration and a full-featured
  15-day trial. [C-002, C-003, **DOCUMENTED**]
- The current product page describes included loops as royalty-free and says
  users own what they create with them. This is a vendor content-entitlement
  statement, not a legal conclusion about every source asset, isolated stem, or
  redistribution scenario. [C-038, **DOCUMENTED vendor claim**]
- Generic Boris FX store terms discuss upgrades, returns, downloads, and
  selected products, but their named floating-license, free-upgrade, and support
  lists do not include ACID Pro. Therefore ACID-specific seat count, activation,
  offline grace, transfer, subscription expiry, downgrade, installer retention,
  support, and upgrade rights remain unknown pending the transaction-specific
  EULA/order terms. [C-034, **UNKNOWN**]
- Steinberg's current developer portal states that VST SDK 3.8 is MIT licensed
  and that trademark usage remains subject to usage rules when used. Its FAQ
  says VST2 headers may not be redistributed and VST2 plugin/host binary
  distribution is allowed only for developers with a VST2 agreement signed
  before October 2018. [C-035, **DOCUMENTED**]
- Naming VST, ARA, ReWire, DirectX, or any other format grants no SDK,
  trademark, redistribution, signing, certification, or compatibility right to
  a clean-room DAW. Obtain current format-owner terms and legal review; this
  dossier is not legal advice. [C-035, **DOCUMENTED boundary / INFERENCE**]

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- The loop -> clip -> event -> timeline model combines low-friction painting
  with non-destructive project-level pitch, tempo, and groove transformations.
  [C-005, C-006, C-012, C-036]
- Current recording, MIDI, VSTi, video scoring, bussing, and submix features let
  the loop-first model expand into a general linear DAW without abandoning its
  core mental model. [C-005-C-009]
- The legacy Failed/Ignored/Unavailable split, targeted rescan, and explicit
  VST roots are strong diagnosability patterns even though their implementation
  and current continuity are unknown. [C-016, C-017, C-037]
- Legacy `.acd` references plus `.acd-zip`, asset collection, backups, autosave,
  and frozen-synth audio expose pragmatic portability/recovery choices.
  [C-013, C-023]

### Liabilities / cautions

- Windows-only current deployment is not a platform architecture for the
  cross-platform target. Concepts can be adapted; platform coupling should not.
  [C-004]
- Current plugin documentation is too generic to distinguish VST2/VST3 or
  accepted/scanned/instantiated/full-contract support. [C-009, C-024-C-027,
  C-040]
- Inputs 3/4 as the assumed third-party sidechain in ACID Pro 10 is brittle
  compared with format-declared bus roles. [C-020]
- Current documentation does not close project durability, runtime isolation,
  automation precision, accessibility, or security questions. [C-025-C-031,
  C-040]
- Vendor track/content counts and "unlimited" wording are not independent
  performance or quality evidence. [C-010, C-039]

## 18. Transferable patterns

| Pattern | Problem / minimal clean-room mechanism | Evidence | Prerequisites / tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- |
| Metadata-aware loop source | Make prerecorded material follow a composition without destructive edits; store source tempo/key plus warp/transposition policy separately from media | C-005/C-006/C-012/C-036 | Requires robust transient/tempo maps, high-quality stretching, explicit exceptions for one-shots, and reversible metadata | **CANDIDATE** |
| Reusable clip and positioned event | Reuse one source/clip while independently arranging many timeline instances | C-012 | Stable IDs, per-event overrides, shared-source invalidation, and migration rules are required | **CANDIDATE** |
| Failure-aware plugin catalog | Separate scan failure, user-ignore, and temporarily unavailable states; support failed-only rescan | C-016/C-017/C-037 | Implement out-of-process validation, transactional cache, reason codes, fingerprints, and safe reset; legacy internals must not be copied | **CANDIDATE** |
| Explicit bus/output objects | Represent submixes, hardware outputs, input returns, soft-synth outputs, and sidechains as graph edges | C-014/C-020/C-021 | Must use format bus metadata rather than fixed inputs 3/4; cycles, PDC and dynamic I/O need tests | **CANDIDATE** |
| Reference project plus collected archive | Keep normal saves small while providing an explicit portable media bundle | C-013 | Needs a manifest, hashes, atomic archive, path normalization, licensing checks, zip-bomb/path traversal defenses, and missing-plugin records | **CONDITIONAL** |
| Freeze as interoperability boundary | Render instrument/MIDI intent to audio while retaining reversible source state | C-021/C-023 | Multi-output policy, tails/PDC, deterministic render, state retention, disk lifecycle, and unfreeze migration are required | **CONDITIONAL** |
| Hit-point tempo map | Align musical beats to picture events without manually editing every clip | C-006 | Tempo discontinuities, stretch quality, marker ownership, and round-trip video timebase must be explicit | **CANDIDATE** |

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected architectural patterns

- **REJECT fixed inputs 3/4 as a universal sidechain rule.** It is documented
  ACID Pro 10 behavior [C-020], but a new host should model format-declared bus
  roles and qualify unusual layouts.
- **REJECT treating `VST` as a VST3 or full-contract claim.** The current vendor
  names only the family; format generation, scanning, state, timing, isolation,
  and recovery remain unresolved. [C-009, C-024-C-027, C-040]
- **REJECT inferring process isolation from a Failed folder or scan timeout.** A
  catalog result says nothing about PID boundaries or crash survival. [C-017,
  C-025]
- **REJECT treating Unavailable metadata as proof of a durable missing-plugin
  placeholder.** Catalog restoration and project-state retention are distinct.
  [C-017, C-027]
- **REJECT Windows-only coupling and legacy ReWire/DirectX as default target
  architecture.** Their user-visible patterns may be informative, but current
  cross-platform choices require separate evidence. [C-004, C-015, C-022]
- **REJECT copying `.acd`, scanner, or project schemas.** Their representations
  are proprietary and unnecessary for a clean-room behavioral adaptation.
  [C-028]

### CURIOSITY_NO_GO

- `CURIOSITY_NO_GO`: proprietary `.acd/.acd-zip` or scanner-cache schema.
  Relevance 2/4, expected value 2/4, novelty 3/4, cost 4/4. Internal layout would
  not establish the runtime architecture and binary inspection is unauthorized.
- `CURIOSITY_NO_GO`: install ACID Pro 2026 or execute third-party plugins.
  Relevance 4/4, value 4/4, novelty 4/4, cost 4/4. It is the right later probe
  but outside this documentary/shared-host authority.
- `CURIOSITY_NO_GO`: community plugin-failure anecdotes. Relevance 2/4, value
  2/4, novelty 2/4, cost 3/4. They may suggest fixtures but cannot establish
  current host internals.
- `CURIOSITY_NO_GO`: broaden into Sound Forge, Vegas Pro, or ACID Music Studio.
  Relevance 1/4, value 1/4, novelty 2/4, cost 3/4. They are outside the assigned
  product boundary.
- `CURIOSITY_NO_GO`: infer unsupported formats from absent logos. Relevance 4/4,
  value negative, novelty 1/4, cost 2/4. Silence remains `UNKNOWN`.
- `CURIOSITY_NO_GO`: repeatedly retry inaccessible manuals, search engines, or
  archives. Relevance 2/4, value 1/4, novelty 1/4, cost 3/4. Accessible current
  pages and the readable ACID Pro 10 manual already bound the documentary gap.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / adversarial check | Documentary result | Disposition / later probe |
| --- | --- | --- |
| H1: ACID Pro is discontinued after MAGIX 11 | Boris FX acquired it, publishes ACID Pro 2026, offers a trial, and documents 11-to-2026 migration [C-001-C-004] | **REFUTED.** Maintained at cutoff. |
| H2: Current ACID is only a loop arranger | Current sources also document recording, MIDI/VSTi, mixing, routing, submixes, loudness, and video scoring [C-005-C-011] | **REFUTED.** Loop-first but broader DAW. |
| H3: Current `VST` language proves VST3 effects and instruments | Current page does not name a generation; only ACID Pro 10 ARA2 explicitly says VST3 [C-009/C-019/C-024] | **UNRESOLVED.** Test signed VST2 and VST3 effect/instrument fixtures separately. |
| H4: Failed/timed-out scan state proves a separate validator process | Manual exposes outcomes but no process topology [C-017/C-025] | **NOT SUPPORTED.** Observe process tree and crash/hang a lawful fixture in a disposable VM. |
| H5: Unavailable catalog state proves project plugin state survives removal | Manual says catalog information can restore settings, but does not specify missing project placeholders/resave [C-017/C-027] | **NOT SUPPORTED.** Save, remove, reopen, resave, reinstall, and compare state. |
| H6: ACID Pro 10 plugin details remain unchanged in ACID Pro 2026 | Current generic VST/VSTi wording is compatible with continuity but does not confirm it [C-009/C-024] | **UNKNOWN.** Obtain a current manual or run the versioned fixture matrix. |
| H7: `.acd-zip` makes every project dependency self-contained | Legacy manual says it embeds project media, not plugin binaries/licenses or proven missing-plugin state [C-013/C-027] | **REFUTED as a blanket claim.** Inspect archive manifest and reopen without dependencies. |
| H8: Current automation is sample accurate | Current prose does not document automation; lineage envelopes disclose no precision [C-018/C-026/C-040] | **UNKNOWN.** Render sub-block parameter steps at several buffer sizes. |
| H9: Windows-only application scope determines accepted plugin bitness | No current source states plugin architecture or bridge behavior [C-004/C-025] | **REFUTED as an inference.** Scan native 32/64-bit fixtures only in an authorized lab. |

**Accepted -> scanned -> instantiated -> full contract check:**

1. **Format accepted:** current documentation establishes generic VST effects
   and VSTi, not VST generation [C-008, C-009].
2. **Discovered/scanned:** documented only for the ACID Pro 10 lineage through
   configured roots and Scan [C-016].
3. **Instantiated:** current effects/instrument placement is documented at a
   headline level; deeper event/track/bus/VSTi placement is ACID Pro 10 lineage
   evidence [C-008, C-009, C-015].
4. **Full contract:** not established currently; isolation, buses, MIDI/event
   fidelity, timing, state, UI, recovery, and missing plugins remain unknown
   [C-024-C-027, C-040].

No safe runtime probe was performed, so there are no `OBSERVED` claims.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Boris FX announced acquisition of ACID Pro, Vegas Pro and Sound Forge from MAGIX on 2026-03-30 and retained the development teams. | Current provenance | S-003 | Direct acquisition announcement | No transaction documents or source-code inventory reviewed |
| C-002 | DOCUMENTED | High | Boris FX offers one named ACID Pro 2026 edition in the retained current materials and documents migration from MAGIX ACID Pro 11. | Current release/edition/lineage | S-001, S-003 | Product FAQ and acquisition release agree | Exact application build number/release notes not retrieved; undisclosed editions are not excluded |
| C-003 | DOCUMENTED | Medium-high | March 2026 release material listed monthly/annual subscription, Upgrade & Support, and perpetual ACID Pro choices; current page exposes upgrade and annual-subscription paths. | Commercial model | S-001, S-003 | Direct vendor pricing/upgrade text | March prices may change; not controlling terms |
| C-004 | DOCUMENTED | High | Current ACID Pro trial is Windows-only. | Current platform | S-002 | Explicit "Windows only" | Exact supported Windows versions and plugin architectures unknown |
| C-005 | DOCUMENTED | High | Current ACID combines loops, recorded audio and MIDI on a drag/draw/paint linear timeline; Acidized loops follow key/tempo and preview in sync. | 2026 workflow | S-001, S-003 | Direct current descriptions | Vendor workflow claims, not internal representation proof |
| C-006 | DOCUMENTED | High | Current editing/scoring includes Chopper, timeline move/cut/copy/paste/trim, grooves preserving original audio, hit-point tempo maps and direct video preview. | 2026 workflow | S-001 | Direct feature sections | Algorithms, precision and codec limits undisclosed |
| C-007 | DOCUMENTED | High | Current ACID documents simultaneous multitrack/punch recording, advanced bussing, submixes, pre/post effects and flexible routing. | 2026 recording/mix | S-001 | Product sections and FAQ | Exact limits/graph rules untested |
| C-008 | DOCUMENTED | High | Current ACID documents MIDI sequencing and VSTi support. | 2026 MIDI/instruments | S-001, S-002 | Product page and trial agree | MPE/MIDI 2/event depth not established |
| C-009 | DOCUMENTED | High | Current ACID documents built-in and third-party VST effects, but does not identify VST generation. | 2026 plugin headline | S-001, S-002 | Direct `VST`/`VSTi` language | No VST2/VST3 matrix or full host contract |
| C-010 | DOCUMENTED | Medium-high | Current inventory claims nearly 1,000 loops/one-shots/songs, 1,100+ MIDI parts, 90+ DLS patches, and 800+ Acidized elements. | 2026 content | S-001 | Current "What's new" sections | Vendor counts; packaging may change |
| C-011 | DOCUMENTED | High | Current mixing includes loudness, dynamics and true-peak metering. | 2026 mix/delivery | S-001 | Direct Loudness Meters section | Standard, calibration and export gating not specified |
| C-012 | DOCUMENTED | High | ACID Pro 10 `.acd` projects reference media; tracks contain clips and positioned events; audio clip types are loop/one-shot/Beatmapped and MIDI tracks contain MIDI clips. | ACID Pro 10 lineage | S-004 | Manual pp. 17, 22-24 | Current schema/semantics may differ |
| C-013 | DOCUMENTED | High | ACID Pro 10 supports `.acd`, `.acd-bak`, `.acd-zip`, collect-media, default open/save backups, optional five-minute autosave, and warns newer saves may not open in older versions. | ACID Pro 10 persistence | S-004 | Manual pp. 30, 38-39, 313-315 | No current continuity, atomicity or archive security proof |
| C-014 | DOCUMENTED | High | ACID Pro 10 routes tracks through up to 26 buses plus master, up to 26 input buses and 32 assignable FX chains; circular buses are blocked and hardware-routed buses are omitted from normal render. | ACID Pro 10 routing | S-004 | Manual pp. 185-200 | Current limits/topology unknown |
| C-015 | DOCUMENTED | High | ACID Pro 10 places DirectX/VST effects at event, track, bus, assignable and soft-synth scopes and documents delay/bypass cautions for non-in-place/live/ReWire use. | ACID Pro 10 hosting | S-004 | Manual pp. 167-173, 198-199 | Does not specify all PDC bounds/callbacks |
| C-016 | DOCUMENTED | High | ACID Pro 10 VST discovery uses configurable folders plus Scan; registered DirectX/ReWire components are auto-detected. | ACID Pro 10 discovery | S-004 | Manual p. 176 | No process/cache details; current behavior unknown |
| C-017 | DOCUMENTED | High | ACID Pro 10 catalogs failed/timed-out, ignored and unavailable plugins, supports failed rescan, and retains unavailable information for restoration after reinstall. | ACID Pro 10 validation/recovery | S-004 | Manual pp. 177-180 | Restore fidelity and project placeholders unspecified |
| C-018 | DOCUMENTED | High | ACID Pro 10 exposes plugin/VSTi controls, bypass, automation envelopes, chain presets and `.fxp/.fxb` preset/bank load/save. | ACID Pro 10 parameters/UI | S-004 | Manual pp. 172-180, 239-243 | Parameter IDs/state schema/sample accuracy unknown |
| C-019 | DOCUMENTED | High | ACID Pro 10 integrates Melodyne through ARA2 and requires its VST3 build; ARA access is not a normal effect-chain insertion. | ACID Pro 10 ARA/VST3 | S-004 | Manual pp. 169-170 | Does not establish current general VST3 support |
| C-020 | DOCUMENTED | High | ACID Pro 10 sidechain uses sender instances and assumes third-party inputs 3/4; it does not work in surround projects. | ACID Pro 10 sidechain | S-004 | Manual pp. 181-182 | Fixed convention may fail for unusual plugins; current unknown |
| C-021 | DOCUMENTED | High | ACID Pro 10 exposes multi-output VSTi ports as separate soft-synth buses, reacts to notified dynamic output changes, and freezes one selected port at a time. | ACID Pro 10 VSTi | S-004 | Manual pp. 239-243, 274-275 | Full VST3 dynamic-I/O contract and current behavior unknown |
| C-022 | DOCUMENTED | High | ACID Pro 10 documents MIDI files/editors/hardware/clock/MTC and ReWire 2.0 host plus ReWire 1.0 device behavior. | ACID Pro 10 MIDI/integration | S-004 | Manual pp. 236-259, 280-301 | ReWire is discontinued ecosystem context; current continuity unknown |
| C-023 | DOCUMENTED | High | ACID Pro 10 offers normal/real-time render, render-to-new-track and MIDI-to-WAV freeze; frozen WAV can be embedded in `.acd-zip`. | ACID Pro 10 render/freeze | S-004 | Manual pp. 39-41, 59-60, 198, 274-276 | Plugin callback/tail/determinism semantics unknown |
| C-024 | UNKNOWN | High | Current retention of ACID Pro 10 scanner, DirectX/ReWire/ARA2, sidechain, multi-output, PDC, preset, project and freeze details is not established. | ACID Pro 2026 continuity | S-001-S-004 | Current pages are generic; current manual/system page inaccessible | Similar UI/lineage could mean continuity, but cannot be assumed |
| C-025 | UNKNOWN | High | Scanner/runtime process isolation, sandboxing, crash containment, bridging, signing and trust policy are undisclosed. | Current plugin runtime | S-001, S-002, S-004 | Relevant current/legacy sources omit process boundary | Failure folders do not prove containment |
| C-026 | UNKNOWN | High | Full bus/event timing, sample-accurate automation, dynamic latency/tails, bypass/suspend and offline callback semantics are unverified. | Current/deep host contract | S-001, S-004 | Headline and lineage UI docs lack ABI precision | Requires capability-coded fixtures |
| C-027 | UNKNOWN | High | Plugin identity, opaque state, external assets, migration, missing placeholders and remove/resave/reinstall recovery are unverified. | Current project/plugin recall | S-001, S-004 | Catalog/project docs do not define state semantics | Unavailable catalog state is insufficient |
| C-028 | UNKNOWN | High | Proprietary graph, process, threading, scheduling, realtime safety, storage schemas and native module map remain unknown. | Internal architecture | S-001-S-004 | No public engineering/source architecture retained | UI terminology is not internal proof |
| C-029 | UNKNOWN | High | Exact current Windows/hardware requirements, accessibility, telemetry/privacy, updater security and rollback are not established. | Current NFR | S-001, S-002, S-007 | Requirements URL returned 404; generic terms are not NFR docs | Windows-only is known, exact matrix is not |
| C-030 | UNKNOWN | High | Current AUv2/AUv3/AAX/CLAP/LV2/LADSPA/DSSI/JSFX/DirectX-DXi/Rack Extension hosting and exact VST2/VST3 scope are not established. | 2026 formats | S-001-S-004 | Current vendor says only generic VST/VSTi | Silence is not unsupported evidence |
| C-031 | UNKNOWN | High | Current project schema, atomic save/recovery, migration, collect/relink, interchange and collaboration behavior are unverified. | ACID Pro 2026 durability | S-001, S-004 | Detailed evidence is ACID Pro 10 only | Requires current manual and failure probes |
| C-032 | UNKNOWN | Medium-high | No current scripting, controller/remote API, native-device SDK or extension versioning policy was established. | Extensibility | S-001-S-004 | Current page and legacy manual expose integrations, not public authoring APIs | Private APIs may exist |
| C-033 | UNKNOWN | High | Current exact import/export, batch, post, immersive, live/show-control and interchange boundaries are unverified. | Delivery/specialized | S-001, S-004 | Current source documents mixed output/video scoring only | Legacy formats cannot be promoted |
| C-034 | UNKNOWN | High | ACID-specific seats, activation, offline grace, transfer, expiry, downgrade, installer retention, support and controlling upgrade rights are not established. | Commercial/legal | S-001, S-003, S-007 | Generic terms omit ACID from named licensing/support lists | Buyer-region EULA/order controls |
| C-035 | DOCUMENTED | High | VST SDK 3.8 is MIT licensed; VST trademark rules remain separate; VST2 redistribution/binary distribution is restricted to qualifying pre-Oct-2018 licensees. | Format licensing | S-005, S-006 | Current Steinberg developer portal/FAQ | Not legal advice; third-party frameworks and trademarks need review |
| C-036 | INFERENCE | Medium-high | A transferable ACID conceptual model separates musical source metadata, reusable clips, positioned events, and project tempo/key transformation. | Workflow architecture | S-001, S-004 | Derived from C-005/C-006/C-012; assumes current language retains lineage semantics | Current internals may represent the same UX differently |
| C-037 | INFERENCE | Medium | Failed, ignored and unavailable states imply a useful separation between validation result, user policy and temporary dependency availability. | Catalog lesson | S-004 | Derived from C-016/C-017 | Storage/transactions/process model are unknown |
| C-038 | DOCUMENTED | Medium | Vendor describes nearly 3 GB of included loops as royalty-free and user-created results as publishable without extra fees. | Current content entitlement claim | S-001 | Direct product copy | Controlling content EULA and edge redistribution not reviewed |
| C-039 | DOCUMENTED | Medium | Vendor describes 1000+ multitrack production and elsewhere unlimited audio/loops/MIDI mixing. | Current capacity claim | S-001 | Direct current page wording | No benchmark; wording does not yield an exact tested limit |
| C-040 | UNKNOWN | High | Current automation, sidechain, multi-output, MPE/MIDI 2.0, UI and deep state fidelity are not established by generic VST/VSTi support. | Current full contract | S-001, S-004 | Current source omits details; lineage is not a guarantee | Current implementation may retain some or all behavior |

## 22. Source ledger and adaptive bibliography

All retained sources were accessed **2026-08-29**. Sources are first-party.
Vendor claims are bounded to what they document. Search pages were used only to
discover canonical URLs and were not retained as evidence.

### S-001 - Acid Pro: The Original Loop-Based Music Software

- **Publisher / URL / kind:** Boris FX;
  <https://borisfx.com/products/acid-pro/>; current product, feature, FAQ and
  transition page.
- **Scope / relevant sections:** ACID Pro 2026; hero/overview; loop-based
  production; arranging; What's New; complete tool set; mixing; FAQ; upgrade
  from MAGIX ACID Pro 11.
- **Claims:** C-002-C-011, C-024-C-034, C-036, C-038-C-040.
- **Relevant passages:** "What's new in Acid Pro 2026"; loops/MIDI/recorded
  audio; Acidized key/tempo matching; Chopper/grooves/video; multitrack/bussing;
  VSTi; built-in and third-party VST; loudness; upgrade FAQ.
- **Limitations:** Marketing/specification page; no build number, exact VST
  generation, deep host contract, project details, engine design, or
  independently tested limits.
- **Selection rationale:** Canonical current product surface; preferable to old
  MAGIX pages, reseller listings, and reviews for present identity/workflow.

### S-002 - Free Acid Pro Trial

- **Publisher / URL / kind:** Boris FX;
  <https://vfx.borisfx.com/acid-pro-trial>; current official trial page.
- **Scope / relevant passage:** 15-day full-featured ACID Pro trial; own audio,
  VST and MIDI; explicit "Windows only."
- **Claims:** C-004, C-008, C-009, C-025, C-029.
- **Limitations:** No exact Windows release, hardware matrix, plugin bitness, or
  licensing-after-trial semantics.
- **Selection rationale:** Most direct accessible current platform statement
  after the product's linked system-requirements URL returned 404.

### S-003 - Boris FX Acquires Vegas Pro, Sound Forge, and Acid Pro

- **Publisher / URL / kind:** Boris FX press release, 2026-03-30;
  <https://blog.borisfx.com/press/boris-fx-acquires-vegas-pro-sound-forge-and-acid-pro>.
- **Scope / relevant sections:** Acquisition from MAGIX; retained teams; Audio
  and Music; ACID description; Pricing & Availability.
- **Claims:** C-001-C-007, C-034.
- **Limitations:** Corporate announcement and launch pricing; no transaction
  documents, current EULA, technical manual, or independent product test.
- **Selection rationale:** Canonical provenance source; preferable to syndicated
  acquisition news and the earlier guessed Boris FX URL that returned 404.

### S-004 - ACID Pro 10.0 Manual

- **Publisher / URL / kind:** MAGIX Software GmbH; official English manual PDF;
  <https://dl03.magix.net/manual_acidpro10_en.pdf>.
- **Integrity / scope:** title metadata "ACID Pro 10.0 Manual," last changed
  2020-02-11, 367 PDF pages; SHA-256
  `2f1d2731d24152a7753d221e337e958722ef926463ed938c8248187f3afb3b08`.
- **Relevant sections/pages:** Working with Projects and ACID Types (17-39);
  Adding Effects/ARA2/Plug-In Manager/Sidechaining (167-182); Mixing/Busses/
  Assignable Effects (185-200); VST instruments (239-245); ReWire (254-259);
  Freezing MIDI Tracks (274-276); Preferences/backups (313-315).
- **Claims:** C-012-C-028, C-030-C-033, C-036, C-037, C-040.
- **Limitations:** ACID Pro 10 lineage only; user-visible behavior, not internal
  source architecture; generic `VST` does not always name a generation; no
  current-2026 guarantee.
- **Selection rationale:** Highest-density official source for project, graph,
  scanner, host, failure, state, render and recovery behavior; preferable to
  forum anecdotes and secondary tutorials.

### S-005 - Frequently Asked Questions: Licensing

- **Publisher / URL / kind:** Steinberg Media Technologies GmbH, VST 3
  Developer Portal;
  <https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html>;
  current format-owner FAQ.
- **Scope / relevant passages:** VST3 SDK under MIT; binary/source distribution;
  VST2 headers not redistributable; VST2 plugin/host binary distribution only
  for entities that signed before October 2018.
- **Claims:** C-035.
- **Limitations:** General format-owner guidance, not ACID's agreement or legal
  advice; third-party frameworks and marks can add obligations.
- **Selection rationale:** Decision-critical primary legal boundary covering both
  modern VST3 and discontinued VST2; preferable to blog summaries.

### S-006 - VST 3 Licensing

- **Publisher / URL / kind:** Steinberg Media Technologies GmbH, VST 3
  Developer Portal;
  <https://steinbergmedia.github.io/vst3_dev_portal/pages/VST+3+Licensing/Index.html>;
  current format-owner licensing overview.
- **Scope / relevant passages:** Since version 3.8 VST3 is MIT licensed; most
  SDK files are MIT; trademark usage is optional but subject to usage rules if
  used.
- **Claims:** C-035.
- **Limitations:** Overview rather than the complete license text; no conclusion
  about ACID or a future product's total dependency stack.
- **Selection rationale:** Current concise corroboration of S-005 and the
  trademark/code distinction.

### S-007 - Boris FX Store Terms and Conditions

- **Publisher / URL / kind:** Boris FX;
  <https://borisfx.com/store/terms-and-conditions/>; generic current store terms.
- **Scope / relevant sections:** Upgrades, return policy, downloads, selected
  RLM floating-license products, selected one-year-upgrade products, support,
  EULA link.
- **Claims:** C-029, C-034.
- **Limitations:** The named RLM/free-upgrade/support product lists omit ACID
  Pro; generic store text does not establish ACID seats, offline use, expiry,
  transfer, upgrade or support rights. Footer date is stale and no
  transaction-specific EULA was reviewed.
- **Selection rationale:** Retained to prevent launch pricing and generic Boris
  policies from being overgeneralized into ACID-specific rights.

### Negative, inaccessible, and auxiliary results

- **NR-001:** Current product navigation linked
  `https://borisfx.com/acid-pro/system-requirements/`, but retrieval returned
  HTTP 404. Exact Windows versions/hardware remain unknown; S-002 was selected
  for the accessible Windows-only statement.
- **NR-002:** The guessed acquisition URL
  `https://borisfx.com/press/boris-fx-acquires-acid-pro-and-sound-forge-from-magix/`
  returned HTTP 404. The canonical S-003 URL was discovered through the Boris FX
  press index.
- **NR-003:** `https://dl03.magix.net/manual_acidpro11_en.pdf` returned HTTP
  404. It was not repeatedly retried or cited.
- **NR-004:** Web search returned HTTP 429; DuckDuckGo presented a bot
  challenge; Wayback CDX calls returned transport errors. Search snippets were
  not used as evidence.
- **NR-005:** A public Japanese MAGIX manual was inspected as an auxiliary
  lineage check: title metadata `ACID Pro 11.0 User Manual` (Japanese), MAGIX,
  modified 2022-07-13, 438 pages, SHA-256
  `348fac7744cd547a9802a6d30b082195e3dee3ad5a742cb3cea6a6b3b682944a`.
  Its original public URL could not be recovered from file metadata, so it was
  not retained as a claim source and no URL was invented. It corroborated a
  broadly similar topic hierarchy but did not close current-2026 continuity.
- **NR-006:** `pdfinfo` and `pdftotext` were unavailable. The PDFs were read
  safely with repository/macOS PDF tooling; no executable product binary,
  installer, or plugin was run.

**Retained source count:** 7 first-party sources; 0 retained secondary sources;
6 negative/inaccessible/auxiliary records.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| Exact current Windows/hardware matrix | Current product and trial inspected; requirements link returned 404 | Deployment baseline and test hardware | Obtain an accessible current vendor requirements page or written support confirmation | Public/vendor source; unassigned |
| Current VST2 versus VST3 scope | Current page says only VST/VSTi; legacy VST3 is ARA-specific | Host implementation and legal scope | Ask vendor for a versioned matrix, then scan signed 64-bit VST2/VST3 effect/instrument fixtures separately | Vendor response + licensed disposable VM; unassigned |
| Current DirectX/ReWire/ARA2 continuity | Detailed evidence exists only in ACID Pro 10; current pages omit formats | Migration and legacy-project compatibility | Obtain current manual/release notes, then open minimal versioned projects in an isolated licensed system | Current docs/VM; unassigned |
| Scan/cache identity and duplicates | Legacy manual exposes roots/states, not schema/identity | Reliability, migration and diagnosability | Use valid, duplicate-ID, invalid, hanging, crashing and moved-path fixtures; record catalog/log/rescan outcomes | Lawful fixture set + disposable VM; unassigned |
| Scan/runtime isolation and bridging | Current and legacy docs omit PID/process/architecture details | Security and crash containment | Observe process tree; crash scan and runtime fixtures separately; test only licensed native/alternate bitness artifacts | Disposable Windows VM; unassigned |
| Sidechain, multi-output and dynamic I/O | Legacy behavior documented; current continuity unknown | Graph fidelity and instrument usability | Capability-coded VST3 fixtures with aux input, multiple outputs and runtime bus changes | VST3 fixture harness; unassigned |
| Automation, latency, tails and offline render | Manuals expose envelopes/PDC warnings but no precision/callback contract | Timing correctness and bounce parity | Impulse/tail/dynamic-latency plugin plus dense sub-block automation over several buffers and live/offline renders | Audio analysis harness; unassigned |
| MIDI output, MPE, MIDI 2.0 and event timing | Current says MIDI/VSTi only; lineage docs do not resolve modern expression | Expressive-instrument architecture | VST3 event/note-expression/MIDI-output fixtures and timestamp comparison | MIDI/audio fixture lab; unassigned |
| Plugin state and missing-plugin recovery | `.acd` and Unavailable catalog facts do not define placeholders | Long-term project durability | Save state/assets/automation, remove plugin, reopen/resave, reinstall/upgrade, compare exact state | Copied fixture project + disposable VM; unassigned |
| Current project save/recovery/migration | ACID Pro 10 has backup/autosave; no current manual | Data-loss and upgrade risk | Obtain current docs, then terminate during save/record in disposable copies and inspect atomicity/recovery | Licensed VM/sample projects; unassigned |
| Exact commercial/activation rights | Launch pricing and generic terms are not ACID-specific | Procurement, offline deployment and archival access | Review buyer-region checkout EULA, order terms, privacy policy and support agreement with counsel | Buyer account/region; legal owner |
| Accessibility/security/privacy | No conformance, plugin-trust or telemetry statement found | NFR and enterprise suitability | Vendor statement; keyboard/screen-reader audit; updater/network/telemetry capture on isolated VM | Accessibility/security lab; unassigned |

## 24. Curiosity pass and stop decision

### Candidate scoring after core synthesis

Scores use 1 (low) to 4 (high); cost is 1 (cheap) to 4 (expensive).

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Current-vs-lineage plugin continuity after acquisition | 4 | 4 | 4 | 2 | **PURSUE** - current product, transition and manuals compared; generic VST/VSTi continuity established, detailed continuity unresolved |
| Missing-plugin/project recovery runtime | 4 | 4 | 4 | 4 | `CURIOSITY_NO_GO` - needs licensed dynamic fixture outside documentary authority |
| Scanner/cache schema | 2 | 2 | 3 | 4 | `CURIOSITY_NO_GO` - proprietary layout has low safe documentary value |
| Current non-VST format census by absence | 4 | 1 | 1 | 3 | `CURIOSITY_NO_GO` - absent names cannot prove rejection |
| Community crash reports | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO` - cannot establish current internals |
| Sound Forge/Vegas integration | 1 | 2 | 2 | 3 | `CURIOSITY_NO_GO` - sibling products outside boundary |

### Curiosity result

The pursued thread changed the initial boundary but not the deep-host
conclusion. S-001/S-003 establish a maintained Boris FX ACID Pro 2026 and an
explicit MAGIX ACID Pro 11 migration path. S-004 establishes rich ACID Pro 10
host behavior. The current sources confirm generic VST effects and VSTi, but do
not confirm format generations or the legacy scanner, isolation, bus, state,
automation, ARA2, DirectX, or ReWire contracts. Therefore current continuity is
bounded to the user-facing loop/record/MIDI/VST headline; all detailed host
continuity remains `UNKNOWN` [C-002, C-009, C-024-C-027, C-040].

### Stop decision

**STOP - coverage reached; documentary evidence saturated within the access
and safety budget.** Every required section and format row is complete or an
explicit unknown. The final retrievals repeated the same current marketing
surface or legacy manual and did not expose a current technical manual. Search
rate limits, broken current requirements/manual links, and archive transport
errors were recorded rather than bypassed. Further web search is unlikely to
change the leading conclusion; the next discriminating work is a licensed,
disposable Windows qualification matrix, not more inference. No installer,
application, or plugin was executed.

## 25. Completion checklist

Copied from `RESEARCH-CONTRACT.md` and answered:

- [x] **Only the assigned dossier path was edited.** Added only
  `research/daw-landscape/dossiers/magix-acid-pro.md`; pre-existing shared and
  unrelated changes were left untouched.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0 pins ACID Pro 2026, current single named edition, Windows-only scope,
  lineage boundary, and exclusions.
- [x] **Every required dossier heading exists in order.** Sections 0-25 and all
  11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Current,
  lineage, inference and unknown scopes are labeled and resolve in Section 21.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  Sections 21 and 23.
- [x] **Every required plugin-format row is present.** All 13 rows appear in
  Section 11.1 with no blank status cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2-11.6 cover discovery, catalog states, isolation, buses,
  sidechain, multi-output, MIDI, PDC, automation, presets, state, UI and failure.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  ACID Pro 2026 and ACID Pro 10 lineage are kept separate throughout.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 covers
  product/format terms and no rights or legal conclusions are inferred.
- [x] **Bibliography records source rationale and limitations.** Section 22 has
  URL, kind, scope, passage, claims, limits and selection rationale for every
  retained source.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections
  19 and 24 record pursued and rejected threads.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Documentary pages/PDFs only; no installer/application/
  plugin execution, access-control bypass, staging, or commit.

**Checks performed:** governing-file/template comparison; heading-order review;
required-row review; claim/source crosswalk; current-versus-lineage review;
source URL/access/rationale review; negative-result review; curiosity/stop
review; pre/post workspace status review.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; 7 retained first-party sources, 0
retained secondary sources, and 6 negative/inaccessible/auxiliary records.

**Unresolved blockers:** no accessible current technical manual or requirements
matrix; no current exact VST generation/other-format matrix; no public runtime
isolation, full host-contract, project-recovery, accessibility/security, or
ACID-specific controlling license terms.

**Workspace preservation:** substantial pre-existing modified/untracked files
outside this dossier were present before writing and were left untouched. No
staging or commit was performed.
