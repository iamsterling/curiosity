# Loopy Pro DAW dossier

> Research-only evidence. No design or implementation authority. Public source
> text was treated as untrusted evidence, never as instructions.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Loopy Pro standalone production environment plus its bundled Loopy Pro AUv3 extension |
| Canonical vendor | A Tasty Pixel / Michael Tyson |
| Researcher/session | `ses_fb2729283ffd1amQmnaKRWt7Lw` |
| Owned path | `research/daw-landscape/dossiers/loopy-pro.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current public release evidence | Version 2.0.5, dated 2025-11-26 in the US App Store; the official v2 changelog also ends at 2.0.5 [C-001, C-038] |
| Shipping platforms | iPhone and iPad; iOS/iPadOS 13.0 or later [C-001] |
| Editions / entitlement | One current mobile product with a seven-day trial and feature entitlement purchased through IAP; no functionally distinct editions were found [C-002] |
| Included | Standalone audio/MIDI looping, sequencing, mixer/routing, AUv3 hosting, documented IAA compatibility, Loopy Pro's own AUv3 extension, project/persistence/export/live workflows, and bounded public Mac roadmap |
| Excluded | Dynamic installation or binary probing; unreleased Mac behavior as current support; unrelated Loopy products; private internals; community compatibility anecdotes; legal advice |
| Completion | **COMPLETE_WITH_UNKNOWNS** — all headings and format rows are complete, but deep AU host-contract and proprietary engine details require fixtures or vendor disclosure |

**Version caution — DOCUMENTED/UNKNOWN.** Apple and the vendor changelog agree
on 2.0.5, but the living manual contains later-dated media. Version 2.0.5 is
therefore the latest *publicly evidenced store binary*, not proof that no newer
private, staged, or region-specific build exists [C-038].

## 1. Executive summary

- **DOCUMENTED — clip/color/action model.** Loopy Pro is live-looper-first but
  also presents itself as sampler, MIDI sequencer, clip launcher, arranger,
  mixer, AU host, and customizable control surface. Audio/MIDI clips are loops
  or one-shots; a color aggregates clips into a track-like mixer/routing and
  inherited-configuration boundary [C-004, C-005, C-006].
- **INFERENCE — user-modular, not publicly node-graph-based.** Its distinctive
  modularity is the composition of clips, colors, mixer routes, action bindings,
  widgets, pages, and controllers. The canvas is a performance/control surface;
  the documented signal graph is configured in the mixer, not by canvas patch
  cables [C-007, C-009, C-036].
- **DOCUMENTED — mobile AUv3 host and extension.** Version 2.0.5 hosts installed
  AUv3 instruments/generators, effects/music effects, and MIDI processors. Loopy
  itself can run in another host as an AUv3 instrument, music effect, or MIDI
  processor with multi-input/output and host-parameter exposure [C-019, C-026].
- **DOCUMENTED/UNKNOWN — useful but incomplete resilience contract.** The
  vendor documents plugin DSP idling, tail-preserving disable, diagnostics,
  presets, project-state fixes, and rate-limited automatic reload after an AUv3
  crash. It does not document validation, cache/blacklist, exact process
  isolation, plugin-delay compensation, direct AU sidechain input, hosted AU
  multi-audio-output, sample-accurate automation, or missing-plugin placeholders
  [C-020–C-025].
- **DOCUMENTED — durable mobile/live boundary.** Files-visible project bundles,
  a continuously saved Workspace, optional Save Points, set lists, session
  recording, stems, and crash-workspace preservation are strong live/mobile
  patterns. AU-extension projects need a special backup workflow because their
  storage is not Files-visible [C-029–C-032].
- **DOCUMENTED — IAA is legacy.** Loopy still documents Inter-App Audio inputs
  and effects, but Apple deprecated IAA in iOS 13 and directs developers to Audio
  Units. IAA should be treated as compatibility debt, not a new architecture
  target [C-027, C-028].
- **DOCUMENTED — desktop is roadmap only.** A native Mac app is under
  development with no date. Generic VST/AU hosting, Loopy as VST/AU,
  Intel/Apple-silicon support, and cross-compatible documents are plans, not
  current format support; the VST generation is unspecified [C-003, C-035].

**Overall confidence:** high for the user model, shipping platform, AUv3 role
categories, routing/control, persistence, and export; medium for plugin recovery
and state because evidence is vendor documentation/release history rather than
probes; low for proprietary engine scheduling and complete AU interoperability.

## 2. Product identity, history, and market position

- **DOCUMENTED.** The shipping App Store product is “Loopy Pro: Looper DAW
  Sampler,” sold by A Tasty Pixel for iPhone/iPad, requiring iOS 13+, with 2.0.5
  listed on 2025-11-26 [C-001].
- **DOCUMENTED.** The product targets live loopers, controller-driven performers,
  and mobile producers rather than only conventional linear editing. The vendor
  describes one system that can scale from a looping rig to a clip launcher or
  mobile studio [C-004].
- **DOCUMENTED.** Version 2.0 materially expanded the DAW boundary with MIDI
  clips/piano roll, MIDI automation, transient quantization, bus-to-bus routing,
  dockable plugin panels, and controller-latency compensation [C-013, C-015].
- **UNKNOWN.** A complete launch/acquisition lineage was not needed for the
  architecture decision and was not reconstructed. No public source-code or
  open-source product license was identified; proprietary implementation details
  remain outside scope [C-011, C-034].

## 3. Workflow and conceptual model

- **DOCUMENTED — clips.** Clips hold audio or MIDI and are either looping or
  one-shot objects. Audio can be recorded/imported/resampled; MIDI can be
  recorded or created in the piano roll. Audio clips can also act as polyphonic,
  pitched/sliced MIDI destinations [C-005, C-015].
- **DOCUMENTED — colors as semantic tracks.** Every used color gets a channel
  strip and aggregates clip output, effects, sends, inputs, and output routing.
  Colors also inherit/override clip behavior, so color is both visual taxonomy
  and track-like processing/configuration scope [C-005, C-006].
- **DOCUMENTED — session and sections.** Play Groups, follow actions, color/group
  actions, quantized transitions, and scenes/song sections organize reactive
  performance. The timeline sequencer can record clip-state events and drive a
  hands-free arrangement [C-008, C-032].
- **DOCUMENTED — canvas/widgets.** Pages contain clips and configurable buttons,
  sliders, dials/encoders, grids, X-Y pads, labels, and a slicer. Widgets execute
  one or more typed actions and can reflect target state; the same action layer
  can be driven by gestures, follow events, MIDI, keyboard, or OSC [C-007, C-016].
- **INFERENCE.** The reusable architectural idea is an action-oriented control
  model over a mixer/session graph, not a public node-and-wire DSP authoring
  graph. An alternative is that proprietary internals are node-based, but no
  public evidence establishes that [C-036].

## 4. Publicly documented architecture

- **DOCUMENTED — user-visible graph.** Mixer channel strips represent hardware
  and AU/IAA audio sources, MIDI sources, colors, buses, master/output
  destinations, insert chains, and sends. Buses can target colors, hardware
  outputs, or other buses, and sends can tap four documented positions in a
  strip [C-009].
- **DOCUMENTED — effect clone mechanism.** A reused logical effect can be
  implemented by grouped routing or, usually, multiple hidden plugin instances
  whose state Loopy synchronizes. The UI exposes them as one lettered logical
  instance even though audio paths remain separate; metering reflects one
  internal master clone [C-010].
- **DOCUMENTED — storage boundary.** Projects are file bundles; standalone and
  AU-extension project stores have different Files visibility. The AU extension
  can serialize a whole project or a reference to a separately saved project
  [C-026, C-029, C-030].
- **DOCUMENTED — platform extension contract.** Apple describes AUv3 as an app
  extension containing one audio unit and optional UI, with declared identity,
  input/output buses, host-managed render-resource allocation, and a host-sized
  remote UI view [C-037].
- **UNKNOWN.** Loopy's process topology, audio-thread model, render scheduler,
  lock strategy, multicore allocation, memory model, project schema, internal
  service boundaries, and standalone-to-extension code sharing are proprietary
  or undocumented [C-011].

## 5. Audio engine

- **DOCUMENTED.** Audio is dynamically time-scaled to the project tempo; v2
  release notes identify the Rubber Band time-stretch library. Version 2 also
  added audio transient quantization/warp [C-013].
- **DOCUMENTED.** System settings expose the OS audio-buffer duration; the manual
  explains the latency-versus-load tradeoff. A DSP percentage and per-plugin DSP
  list warn that overload can cause cracks/pops. Silent effects and muted
  instruments can be idled, although memory and non-DSP resource use can remain
  [C-012, C-021].
- **DOCUMENTED.** Disabling an effect can mute its input while allowing detected
  output decay to ring over the dry path. This is host behavior and does not
  prove use of an AU tail-reporting property [C-012].
- **DOCUMENTED/UNKNOWN.** Sequencer export renders effects into stereo or stems,
  but whether the renderer is faster-than-real-time/offline is not stated.
  Freeze, track bounce-in-place, oversampling policy, dropout recovery beyond
  load guidance, and multicore scheduling were not documented [C-013, C-014].
- **UNKNOWN.** Supported sample-rate set, internal bit precision, maximum block
  size, AU latency/tail property handling, plugin-delay compensation, and dynamic
  I/O renegotiation are not established [C-014, C-024].

## 6. Tracks, timeline, clips, and editing

- **DOCUMENTED.** Colors act like tracks for aggregate processing while the clip
  canvas is the primary performance space. The sequencer has a DAW-like timeline
  for clip events, automation through MIDI, timeline loop regions, and armed clip
  recording [C-005, C-008].
- **DOCUMENTED.** Loops/one-shots support trim and audio editing, pitch/speed,
  time scaling, transient quantization, reverse/phase behavior, overdub layers,
  peel/replace, retrospective recording, intro/outro/tail capture, and
  resampling. Imported audio can be tempo-detected and fitted [C-005, C-013,
  C-017].
- **DOCUMENTED.** MIDI clips have a note piano roll; non-note MIDI is recorded
  and played but is not currently editable there. Exporting a MIDI clip carries
  its data to a more complete editor [C-015].
- **UNKNOWN.** Conventional take lanes, vocal comping, ripple/slip editing,
  track folders/VCAs, notation, and a documented nondestructive-edit contract
  were not found [C-037].

## 7. MIDI, sequencing, notation, and expression

- **DOCUMENTED.** Loopy records audio and MIDI clips, edits notes, records MPE,
  and can play audio clips as MPE-capable pitched/sliced samplers. Non-note MIDI
  may be recorded/played and MIDI clips can carry project-control automation
  [C-015].
- **DOCUMENTED.** MIDI sources include hardware, Bluetooth/network/virtual ports,
  on-screen keyboard, musical typing, MIDI clips/colors, and AUv3 generators or
  processors. Routes can split by channel/note range, transpose/re-channelize,
  select a MIDI AU output cable, and target multiple AUs/devices [C-016, C-019].
- **DOCUMENTED.** Custom Send MIDI actions support notes, CC, program change,
  pitch bend, and hexadecimal messages such as SysEx. Loopy sends and receives
  MIDI Clock, sends SPP, and supports Ableton Link, including a Link/MIDI-clock
  bridge [C-016].
- **UNKNOWN.** MIDI 2.0/UMP, MIDI-CI, MTC, score/notation, and editable per-note
  expression lanes are not established. “Records MPE” does not prove complete
  per-note expression editing or every hosted AU's MPE fidelity [C-024].

## 8. Routing, mixer, automation, and control

- **DOCUMENTED.** The mixer supports pre/post-fader insert positions, sends,
  bus-to-bus routing, color and source strips, independent hardware outputs,
  monitoring through a destination color, and dry-record/wet-monitor patterns
  [C-009].
- **DOCUMENTED.** Actions adjust clips, channels, sends, clocks, effects, plugin
  parameters/presets, project loading, MIDI, and widgets. Continuous/Boolean/
  impulse action types, value ranges, ramps, save/restore slots, state feedback,
  follow actions, and MIDI takeover form the automation/control model [C-007,
  C-025].
- **DOCUMENTED.** MIDI Learn/manual bindings support state feedback to hardware.
  An OSC server exposes an action directory, custom address bindings, delayed or
  quantized actions, and TCP feedback for selected addresses [C-016].
- **DOCUMENTED/UNKNOWN.** The documented “sidechaining” mechanism is an amplitude
  envelope follow action driving a target parameter (for example another color's
  fader). It is not evidence of routing an AU auxiliary audio bus into a
  third-party compressor [C-024].
- **UNKNOWN.** Feedback/cycle rules for bus-to-bus routing, sample-accurate
  parameter automation, surround/immersive layouts, VCA semantics, and plugin
  delay compensation are not documented [C-014, C-024].

## 9. Recording, comping, and media handling

- **DOCUMENTED.** Live capture includes count-in/out and free recording,
  threshold and automatic first-loop detection, retrospective record, overdub,
  and input monitoring. Audio can arrive from device microphones, multichannel
  interfaces, AUv3 instruments, IAA applications, resampling, Files/drag-drop,
  paste, AirDrop, or USB-accessible documents [C-005, C-017].
- **DOCUMENTED.** Session recording captures a mix or separate external outputs,
  inputs, colors, and buses; sequence recording captures clip-performance
  events. Sessions default to compressed AAC/mp4 or can use an uncompressed
  option [C-017, C-031].
- **DOCUMENTED/UNKNOWN.** Overdub layers support peel/replace and undo-like
  behavior, but there is no documented conventional take-lane comping model.
  A complete import/export codec list, proxy/conform workflow, metadata model,
  video support, and missing-media relink UX remain unknown [C-017, C-037].

## 10. Instruments, effects, content, and native devices

- **DOCUMENTED.** Audio clips are native polyphonic pitched/sliced samplers. The
  manual lists built-in EQ/filters, dynamics, and reverb (including Apple system
  units), while third-party AUv3 instruments/effects extend the device set
  [C-018, C-019].
- **DOCUMENTED.** Effect chains may be placed on sources, colors, buses, and the
  master; sends implement shared effects. Logical clones provide one control
  identity over grouped or synchronized hidden instances [C-009, C-010].
- **DOCUMENTED/UNKNOWN.** Widgets, multi-action mappings, amplitude envelopes,
  follow actions, MIDI clips, and parameter save/restore provide macro-like
  modulation/control. A native general-purpose LFO/envelope modulator graph,
  device SDK, or third-party product-native format was not documented [C-007,
  C-025, C-037].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`Mobile/web` below means the shipping iPhone/iPad product; there is no evidenced
web edition. `NOT_APPLICABLE` on desktop means there is no shipping edition at
the cutoff, not that the format can never be supported. Absence from the manual
is retained as `UNKNOWN`, not converted into “unsupported” [C-003, C-035].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | `UNKNOWN:no current vendor claim for iOS/iPadOS; no web edition` | Current 2.0.5 mobile; future Mac page says only generic “VST” | Planned Mac VST generation is unspecified; no current support claim | C-003, C-035 / S-003, S-006 |
| VST3 | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | `UNKNOWN:no current vendor claim for iOS/iPadOS; no web edition` | Current 2.0.5 mobile; generic VST is roadmap only | Do not interpret planned “VST” as confirmed VST3 | C-003, C-035 / S-003, S-006 |
| AUv2 | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | `UNKNOWN:current docs identify AUv3, not AUv2` | Current 2.0.5 mobile; future Mac says generic “Audio Unit” | Future AU generation and validation contract unspecified | C-003, C-019, C-035 / S-001, S-006 |
| AUv3 | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | **DOCUMENTED** on iPhone/iPad | 2.0.5; instruments/generators, effects/music effects, MIDI processors; Loopy itself is AUv3 | Only format with substantial current plugin-host evidence | C-019–C-026 / S-001, S-003–S-005 |
| AAX | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | `UNKNOWN:no current vendor claim; no web edition` | 2.0.5 mobile | No evidence; no AAX permission implied | C-035 / S-001, S-003 |
| CLAP | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | `UNKNOWN:no current vendor claim; no web edition` | 2.0.5 mobile | No evidence | C-035 / S-001, S-003 |
| LV2 | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | `UNKNOWN:no current vendor claim; no web edition` | 2.0.5 mobile | No evidence | C-035 / S-001, S-003 |
| LADSPA | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | `UNKNOWN:no current vendor claim; no web edition` | 2.0.5 mobile | No evidence | C-035 / S-001, S-003 |
| DSSI | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | `UNKNOWN:no current vendor claim; no web edition` | 2.0.5 mobile | No evidence | C-035 / S-001, S-003 |
| JSFX | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | `UNKNOWN:no current vendor claim; no web edition` | 2.0.5 mobile | No evidence | C-035 / S-001, S-003 |
| DirectX/DXi | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | `UNKNOWN:no current vendor claim; no web edition` | 2.0.5 mobile | No evidence | C-035 / S-001, S-003 |
| Rack Extension | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | `UNKNOWN:no current vendor claim; no web edition` | 2.0.5 mobile | No evidence | C-035 / S-001, S-003 |
| Product-native/other | `NOT_APPLICABLE:no shipping Mac edition` | `NOT_APPLICABLE:no Windows edition` | `NOT_APPLICABLE:no Linux edition` | **DOCUMENTED:** built-in effects; IAA audio sources/effects; Loopy Pro AUv3 extension | 2.0.5 mobile | IAA is app-to-app compatibility and Apple-deprecated, not a new plugin target | C-018, C-026–C-028 / S-001, S-007 |

### 11.2 Discovery, scanning, validation, and recovery

- **DOCUMENTED.** An “Add Audio Unit Instrument” panel lists available installed
  AU instruments; the effects picker lists AU effects, and MIDI-source routes
  list loaded AUs that accept MIDI. Units are obtained as apps/extensions from
  the App Store [C-019].
- **DOCUMENTED.** Release history says a crashed AUv3 is automatically reloaded,
  rate-limited to once per five seconds; diagnostic mode can ignore AU render
  timeouts for debugging [C-021].
- **UNKNOWN.** Discovery API, scan timing/paths, validation, cache invalidation,
  duplicate component identity, blacklist/quarantine, manual rescan, failed-load
  diagnostics, and missing-plugin placeholders are not documented [C-023].

### 11.3 Runtime isolation and compatibility

- **DOCUMENTED.** Apple defines AUv3 as an app-extension contract and Loopy can
  detect/reload an AU after a documented crash. Loopy also idles inactive AUs;
  idled instruments do not receive MIDI and still retain memory [C-021, C-037].
- **INFERENCE.** Detectable AU failure is some containment benefit, but neither
  Apple's general extension description nor Loopy's manual proves Loopy-specific
  per-plugin processes, failure domains, or uninterrupted graph recovery
  [C-022].
- **DOCUMENTED.** IAA UI control switches to the external application rather than
  embedding an AU view. Apple deprecated IAA in iOS 13 [C-027, C-028].
- **UNKNOWN.** Sandbox entitlements, process placement, code-signing failure UX,
  architecture bridging, memory-pressure termination, and whether multiple AU
  instances share one extension process are not established [C-023].

### 11.4 Host/plugin processing contract

- **DOCUMENTED.** AUv3 instruments/generators produce mixer audio; effects/music
  effects process insert/send paths and may receive/send MIDI; MIDI AUs can be
  chained and can expose multiple MIDI output cables [C-019].
- **DOCUMENTED.** Effects can be pre/post fader, logically cloned, bypassed/
  idled, and allowed to decay when disabled. Host-side amplitude-envelope action
  mapping provides ducking-style “sidechaining” [C-010, C-012, C-024].
- **UNKNOWN.** Direct AU auxiliary sidechain input, hosted-instrument multiple
  audio outputs, arbitrary dynamic bus changes, channel-layout negotiation,
  note-expression mapping to AUs, MIDI 2.0, sample-offset event delivery, AU
  latency/tail property use, delay compensation, suspend contract, and
  faster-than-real-time rendering are not documented [C-024].
- **Important distinction.** Loopy *as* an AU supports multi-input/output when
  the outer host does; that does not establish that standalone Loopy hosts every
  other multi-output AU configuration [C-026].

### 11.5 Parameters, automation, state, presets, and project recall

- **DOCUMENTED.** Plugin parameters can be discovered while a plugin UI is shown,
  bound to widgets/MIDI/OSC actions, ranged, ramped, state-reflected, and stored
  in numbered save/restore slots. MIDI clips can record/play project-control
  automation; non-note event editing remains unavailable in the piano roll
  [C-025].
- **DOCUMENTED.** Loopy presents AU factory presets that the plugin exposes and
  supports Loopy user presets plus preset import/export. Proprietary in-plugin
  preset browsers may not expose their factory presets to the host [C-020].
- **DOCUMENTED/INFERENCE.** Changelog fixes for missing AUv3 state in project
  save/export and AU state restoration show that plugin state is intended to be
  persisted and recalled. They do not prove fidelity for every plugin or asset
  reference [C-025].
- **UNKNOWN.** Stable parameter-ID migration, normalized/text conversions,
  sample-accurate automation, preset schema, external asset collection, missing
  AU placeholders, version migration, and behavior after uninstall/reinstall
  remain unqualified [C-023–C-025].

### 11.6 UI, diagnostics, and failure modes

- **DOCUMENTED.** AU UIs are shown in movable/resizable windows, can be full
  screen, and can dock to a screen edge. Apple permits AU extensions without a
  custom UI, but Loopy's generic/headless control presentation is not described
  [C-020, C-037].
- **DOCUMENTED.** User-facing diagnostics include DSP load by plugin, overload
  guidance, render-timeout diagnostic behavior, Apple crash-log collection,
  sysdiagnose instructions, and automatic AU reload [C-012, C-021, C-033].
- **DOCUMENTED.** IAA effect UI opens the external app; hide/show semantics differ
  from embedded AU UI [C-027].
- **UNKNOWN.** UI scaling edge cases, accessibility of third-party UIs, headless
  fallback, bad-UI containment, missing-plugin visualization, and deterministic
  error codes are not documented [C-023, C-033].

## 12. Extensibility and integration

- **DOCUMENTED.** The primary public extension surfaces are hosted AUv3, Loopy's
  own AUv3 extension roles, IAA compatibility, MIDI hardware/virtual/network/
  Bluetooth I/O, MIDI Learn and profiles, OSC server/bindings/feedback, Ableton
  Link, MIDI Clock/SPP, audio interfaces, Files, Share Sheet, and controller
  profiles [C-016, C-026, C-027].
- **DOCUMENTED.** Project profiles store project-specific MIDI/keyboard bindings;
  global profiles span projects and should not target project-local objects.
  Loopy-as-AU can expose up to 128 selected project elements as host parameters
  [C-007, C-026].
- **UNKNOWN.** No public scripting language, device SDK, command-line API,
  web API, third-party widget SDK, or compatibility/versioning promise for OSC
  addresses was found [C-037].

## 13. Project format, persistence, interoperability, and collaboration

- **DOCUMENTED.** A project is a file bundle containing layout, audio, and MIDI
  bindings/profiles. Projects can live outside the Loopy folder and be opened
  through Files, while Loopy's in-app browser is scoped to its own folder
  [C-029].
- **DOCUMENTED.** Explicit Save commits a project. A continuously saved Workspace
  preserves current work between app departures; switching projects clears it
  only after save/discard prompting. Optional Save Points are recallable full
  snapshots including audio; Recently Deleted retains in-app deletions for 30
  days [C-029, C-030].
- **DOCUMENTED.** Non-AU data can be backed up by copying the Files-visible Loopy
  folder. AU-extension projects live in a pseudo-folder and require individual
  export or temporary movement through a visible folder. Exporting a project
  does not include Save Points [C-030].
- **DOCUMENTED.** Loopy-as-AU can save whole-project state or only a project-file
  reference. iOS/iPadOS does not permit an AU to host other AUs, so a standalone
  project must remove hosted AUs before moving into Loopy's AU-extension store
  [C-026].
- **UNKNOWN.** File schema/versioning, atomic-save details, merge/conflict model,
  backward/forward compatibility, missing dependencies, collaborative editing,
  cloud service, and version-control suitability are not documented [C-037].

## 14. Delivery, live, post-production, and specialized workflows

- **DOCUMENTED.** Sequence export creates a stereo mix with effects or per-track
  files; track/master effects render on multitrack export while bus effects do
  not. Individual clip audio/MIDI can be exported. Session recordings can split
  outputs, inputs, colors, and buses; v2.0.5 can join related multi-project
  recordings for easier DAW import [C-031].
- **DOCUMENTED.** Set Lists chain projects using widget/MIDI/follow actions;
  quantized clip transitions, sections, sequence automation, controller state
  feedback, retrospective capture, isolated stems, and routable click outputs
  are tailored to performance [C-032].
- **UNKNOWN.** AAF, OMF, ADM, MusicXML, DAWproject, standardized session exchange,
  DDP, loudness conformance, video/timecode/ADR, surround/immersive delivery, and
  batch render were not found [C-031, C-037].

## 15. Performance, reliability, security, and accessibility

- **DOCUMENTED.** DSP statistics, buffer selection, plugin idling, overload
  guidance, low-disk warnings, crash-log/sysdiagnose collection, crash-workspace
  preservation, and AU automatic reload provide user-visible reliability tools
  [C-012, C-021, C-030, C-033].
- **DOCUMENTED.** The vendor cautions that Network MIDI can reduce stability and
  that OS multiroute audio is unpredictable; Bluetooth/AirPlay are unavailable
  in multiroute mode. Echo-cancellation measurement mode also constrains
  Bluetooth use [C-033].
- **DOCUMENTED.** The App Store says the developer reports no data collection.
  It also says the developer has not indicated supported App Store accessibility
  features. The manual provides a “show color labels on clips” accessibility
  option, and v2 lists multiple UI translations [C-033].
- **UNKNOWN.** Maximum clip/plugin/bus counts, deterministic stress limits,
  rollback, telemetry verification, security review, exact AU trust boundaries,
  VoiceOver/keyboard completeness, and WCAG-like conformance are unqualified
  [C-023, C-033].

## 16. Licensing, ecosystem, and implementation constraints

- **DOCUMENTED.** Mobile licensing is a seven-day trial followed by a one-time
  unlock that keeps purchased features, includes 12 months of feature updates,
  and receives lifetime bug fixes; later feature-update periods are optional,
  not a subscription [C-002].
- **DOCUMENTED.** The planned Mac edition is described as a separate purchase
  with a contemplated discount for iOS users; there is no release date or final
  compatibility/pricing commitment [C-003].
- **DOCUMENTED.** Current third-party extensibility relies on Apple's AU app-
  extension platform and App Store-distributed AU apps. Apple deprecated IAA and
  directs developers to Audio Units [C-019, C-028, C-037].
- **UNKNOWN / clean-room limit.** The product is commercially distributed and no
  public source license was identified. Naming Audio Unit, future VST, IAA,
  Rubber Band, Link, or MIDI support grants no SDK, patent, trademark,
  redistribution, signing, App Store, or certification rights. Specific Apple,
  Steinberg, Ableton, MIDI Association, and third-party-library terms need
  separate counsel/SDK-owner review before implementation [C-034, C-035].

## 17. Strengths, liabilities, and architecture lessons

**Strengths**

- **DOCUMENTED/INFERENCE.** Colors unify visual grouping, inherited behavior,
  mixing, and routing without forcing a desktop track UI; this is a strong
  touch/live semantic boundary [C-005, C-006].
- **DOCUMENTED/INFERENCE.** One typed action layer drives widgets, gestures,
  follow events, MIDI, OSC, feedback, and automation, making projects function
  as user-authored instruments [C-007, C-016, C-025].
- **DOCUMENTED.** Files-visible bundles, Workspace preservation, Save Points,
  set lists, stems, DSP diagnostics, and crash-workspace preservation address
  mobile live-performance durability [C-029–C-033].
- **DOCUMENTED.** Loopy is both AU host and AU extension with deliberate state and
  multi-bus roles, a useful composability pattern within platform limits
  [C-019, C-026].

**Liabilities / cautions**

- **DOCUMENTED.** IAA compatibility rests on an Apple-deprecated API [C-028].
- **DOCUMENTED/UNKNOWN.** The shipping product is Apple-mobile-only, while
  desktop/VST claims remain roadmap. Cross-platform architectural conclusions
  cannot be validated from the unreleased Mac build [C-003, C-035].
- **UNKNOWN.** Core host-risk areas—scan/quarantine, exact isolation, PDC,
  sidechain/multi-output fidelity, sample-accurate automation, and missing-plugin
  recall—lack public contracts [C-023, C-024].
- **DOCUMENTED.** AU-extension storage is less Files-visible, and nested AU
  hosting is prohibited by iOS/iPadOS, limiting standalone/extension project
  equivalence [C-026, C-030].

## 18. Transferable patterns

| Pattern | Problem / minimal clean-room mechanism | Evidence | Prerequisites and tradeoffs | Disposition |
| --- | --- | --- | --- | --- |
| Semantic group as track surrogate | Give each visual group an aggregate channel and inherited settings; permit per-object overrides | C-005, C-006 | Stable object IDs and clear override inspection; color alone must not be the only accessible cue | **CANDIDATE** |
| Action/control indirection | Define typed, targetable actions once; bind widgets, gestures, events, MIDI, OSC, automation, and feedback to them | C-007, C-016, C-025 | Parameter identity, loop prevention, deterministic feedback, schema migration; complexity can become a hidden programming language | **CANDIDATE** |
| Separate canvas from signal routing | Let the performance canvas express intent/control while a mixer owns source/destination and processing routes | C-009, C-036 | Requires excellent route inspection; users may expect patch-cable visibility from “modular” branding | **CONDITIONAL** |
| Workspace versus committed document | Continuously preserve a recoverable working state while retaining explicit Save/Discard semantics; add optional full snapshots | C-029, C-030 | Atomic persistence, storage quotas, snapshot GC, clear crash semantics; snapshots with media are large | **CANDIDATE** |
| Graph-boundary performance capture | Record mixes and stems at inputs, outputs, groups, and buses plus a separate event performance | C-017, C-031 | Clock-aligned writers, clear FX inclusion rules, disk monitoring, recoverable finalization | **CANDIDATE** |
| Plugin idling and bounded restart | Suspend silent/inactive instances with opt-out; surface DSP; retry failed units with rate limiting | C-012, C-021, C-022 | Must honor tails/MIDI generators and preserve state; restart is not proof of glitch-free isolation | **CONDITIONAL** |
| Dual host/extension role with state policy | Offer the environment as a host and as a plugin; choose embedded-whole-state or reference state explicitly | C-026 | Platform permits extension role; nested-hosting and storage constraints must be visible | **CONDITIONAL** |

These are behavioral abstractions only; no protected UI expression, source, or
project schema is copied.

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT — IAA as new architecture.** Product support exists, but Apple has
  deprecated IAA in favor of Audio Units [C-027, C-028]. Reopen only for a
  legacy-import compatibility requirement.
- **CONDITIONAL, not blindly copied — hidden synchronized plugin clones.** The
  logical-single-instance UX can reduce setup work, but a displayed meter may
  represent only one master clone and state fan-out can conceal cost or divergence
  [C-010]. Reopen with a formal identity/metering/failure model.
- **CONDITIONAL — reference-only plugin state.** It reduces host-project size but
  makes recall depend on external project-file durability [C-026]. Reject as the
  sole persistence mode.
- **CURIOSITY_NO_GO — artist rigs and community compatibility anecdotes.** Low
  value for general host semantics; they cannot establish vendor internals or
  full plugin fidelity.
- **CURIOSITY_NO_GO — enumerate every OSC address or changelog bug.** The
  architecture decision needs the binding/feedback model, not a copied mutable
  directory or noisy historical inventory.
- **CURIOSITY_NO_GO — infer scheduler/process topology from crashes.** Symptoms
  have multiple explanations and private internals remain unknown [C-011,
  C-022].
- **CURIOSITY_NO_GO — treat Mac roadmap as support.** No release date, final
  version, VST generation, or qualification matrix exists [C-003, C-035].
- **CURIOSITY_NO_GO — promote additional discovery candidates.** Loopy's
  mobile clip/action/color/AUv3 pattern is already the owned boundary; unrelated
  products cannot resolve Loopy-specific contract gaps.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test / counterevidence | Result | Later discriminating probe |
| --- | --- | --- | --- |
| H1: Colors are cosmetic labels only | Manual says each color aggregates clips, owns a mixer strip, routes audio, hosts effects/sends, and scopes inherited settings | **FALSIFIED** [C-005, C-006] | None needed for documentary conclusion |
| H2: The canvas is the audio patch graph | Manual places clips/widgets on canvas but performs source/destination, bus, MIDI, and effect routing in mixer | **NOT SUPPORTED; bounded inference that canvas is control, mixer is graph** [C-009, C-036] | Inspect routing UX only if a future comparative prototype needs graph discoverability |
| H3: “AUv3 supported” proves full host contract | No official evidence for validation, direct sidechain, hosted multi-audio-output, PDC, sample-accurate automation, or missing plugins | **FALSIFIED as an evidentiary shortcut** [C-023, C-024] | Controlled fixture matrix below |
| H4: Standalone and Loopy AU projects are fully interchangeable | iOS/iPadOS forbids an AU from loading other AUs; storage domains differ | **FALSIFIED** [C-026, C-030] | Move a fixture project both directions and compare non-plugin state |
| H5: IAA is a strategic current extension model | Loopy documents it; Apple explicitly deprecated it in iOS 13 in favor of AU | **FALSIFIED** [C-027, C-028] | Legacy-only regression fixture if required |
| H6: A crashed AU can be recovered | Changelog says Loopy auto-reloads one with a five-second rate limit | **DOCUMENTED behavior, runtime fidelity unverified** [C-021, C-022] | Crash-on-render fixture; inspect audio gap, state, routes, UI, diagnostics, retry storm |
| H7: Plugin state is persisted | Changelog contains fixes for missing AU state in save/export and restore | **DOCUMENTED intent, universal fidelity unverified** [C-025] | Stateful AU fixture with preset, arbitrary state, external asset, version upgrade |

**Required controlled AU fixture matrix (future, unassigned):** install one
instrument, effect, music effect, MIDI processor, headless AU, multi-output
instrument, auxiliary-input effect, latency/tail reporter, dynamic-I/O unit,
stateful asset-bearing unit, intentionally crashing/hanging unit, and duplicate-
identity/version fixtures. Test separately: discover, enumerate, instantiate,
render, automate at known sample offsets, save/reopen, export, crash/reload,
uninstall/reopen, reinstall, and device/OS migration [C-023–C-025].

**Negative searches retained:** two initial web searches and a later exact Apple
search were rate-limited HTTP 429; the human-readable Apple iOS 13 release-note
URL returned 404/empty content. The official Apple DocC JSON endpoint supplied
the primary deprecation passage. Manual searches found no direct AU sidechain,
hosted AU multi-audio-output, plugin-delay-compensation, scan/blacklist, or
missing-plugin description; absence was classified `UNKNOWN`, not unsupported.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Shipping listing is Loopy Pro 2.0.5 (2025-11-26), seller A Tasty Pixel, iPhone/iPad, iOS 13+ | US App Store at cutoff | S-003, S-004 | Store and vendor changelog agree | Regional/staged/private builds not checked |
| C-002 | DOCUMENTED | High | Seven-day trial; one-time unlock retains purchased features, includes 12 months of feature updates and lifetime fixes; optional later update purchase; no subscription | Current mobile commercial model | S-002, S-003 | Two vendor-controlled channels agree | Price/local taxes can vary; entitlement not independently purchased |
| C-003 | DOCUMENTED | High | Native Mac standalone and VST/AU plugin are under development with no date; generic VST/AU hosting, Intel/Apple silicon, shared document format, separate purchase/discount intent are roadmap | Future Mac only | S-002, S-006 | Dedicated roadmap page explicitly labels plans | No shipping binary; plans can change |
| C-004 | DOCUMENTED | High | Product roles include live looper, sampler, MIDI sequencer, clip launcher, arranger, mixer, AU host, customizable control surface | Current manual/product positioning | S-001, S-002 | Direct role list and current site | Vendor positioning, not independent quality test |
| C-005 | DOCUMENTED | High | Clips hold audio/MIDI loops or one-shots; colors aggregate clips and behave like track/mixer/routing scopes | Current manual | S-001 | Clips/Colors sections | Limits and every clip subtype not measured |
| C-006 | DOCUMENTED | High | Configuration inherits project → color → clip, with action-level overrides | Current manual | S-001 | Configuration/Hierarchy sections | Migration semantics unknown |
| C-007 | DOCUMENTED | High | Pages/canvas host clips and widgets; typed actions bind UI, gestures, follows and controllers with state feedback | Current manual | S-001 | Canvas/Widgets/Actions sections | Action schema/versioning unknown |
| C-008 | DOCUMENTED | High | Sequencer is a DAW-like timeline for clip playback, automation, armed recording and recorded live-session events | Current/v2 manual | S-001, S-004 | Sequencer and v2 sections | Not equivalent to all conventional DAW timeline features |
| C-009 | DOCUMENTED | High | Mixer exposes source/color/MIDI/bus/output routing, inserts, sends, tap positions, bus-to-bus destinations and hardware outputs | Current manual/v2 | S-001, S-004 | Mixer/Buses and Sends; bus-to-bus v2 | Cycle/feedback constraints unknown |
| C-010 | DOCUMENTED | High | Logical effect clones normally use hidden instances with synchronized state; occasionally grouped routing uses one instance; UI meter reflects one master clone | Current manual | S-001 | Effect Instances section | Proprietary implementation beyond disclosed behavior unknown |
| C-011 | UNKNOWN | High | Engine threads, scheduler, multicore/process topology, storage schema and private module map are not publicly established | Current product | S-001–S-006 | Attempted official manual/site/developer sources | Requires vendor disclosure or lawful instrumentation |
| C-012 | DOCUMENTED | High | Adjustable OS buffer, DSP percentage/per-plugin stats, automatic idling and effect-tail-preserving disable are user-visible | Current manual | S-001 | DSP/System/Effects sections | No independent performance measurement |
| C-013 | DOCUMENTED | High | Dynamic time scaling, Rubber Band update, audio/MIDI transient quantization and effect-rendering sequence export are documented | v2/current | S-001, S-004 | Clock/Export/changelog | Offline speed and precision unknown |
| C-014 | UNKNOWN | High | Internal precision, exact rates/blocks, multicore, plugin-delay compensation, AU latency/tail-property handling, freeze and offline-render mode are not established | Current engine | S-001, S-004 | Searched manual/changelog terminology | Needs vendor docs and fixtures |
| C-015 | DOCUMENTED | High | MIDI clips, note editing, MPE capture/playback, non-note record/play but no piano-roll edit, audio clips as MPE samplers, and MIDI automation are documented | v2/current | S-001, S-004 | Clips/Editors/FAQ/v2 sections | Full expression fidelity and MIDI 2.0 unknown |
| C-016 | DOCUMENTED | High | MIDI routes, split/remap, multiple destinations/cables, SysEx/custom messages, Learn/feedback, OSC, MIDI Clock/SPP and Link are documented | Current manual | S-001 | MIDI/Control/Sync/System sections | Timing precision and API stability not measured |
| C-017 | DOCUMENTED | High | Live/retrospective/threshold/overdub recording, broad audio ingress, session mix/stems and sequence-event capture are documented | Current manual | S-001 | Live Looping/Import/Session Recording | Complete codec and recovery matrix unknown |
| C-018 | DOCUMENTED | High | Audio clips can be native pitched/sliced samplers; built-in EQ/filter/dynamics/reverb effects exist | Current manual | S-001 | Clips as Instruments/Built-In Effects | Inventory may evolve |
| C-019 | DOCUMENTED | High | Standalone hosts available AUv3 instruments/generators, effects/music effects and MIDI processors; MIDI effect send/receive and multiple MIDI cables are documented | Current iOS/iPadOS | S-001, S-003 | AU Instrument/Effect/MIDI sections | Does not prove all instances or full contract |
| C-020 | DOCUMENTED | High | AU UIs are movable/resizable/fullscreen/dockable; exposed factory and Loopy user presets are supported; proprietary preset systems may be invisible | Current manual | S-001 | AU UI/Presets sections | Generic headless UI behavior unknown |
| C-021 | DOCUMENTED | Medium | Loopy idles inactive AUs, exposes DSP diagnostics, can ignore render timeouts diagnostically, and changelog says it rate-limited-reloads a crashed AU | Current behavior plus historical release note | S-001, S-004 | Manual and release history | No dynamic reproduction; current regression possible |
| C-022 | INFERENCE | Medium | AU crash detection/reload suggests failure containment, but does not prove Loopy-specific process isolation or uninterrupted recovery | Current product | S-001, S-004, S-005 | Assumes “crashed AU” is distinguished from host crash; alternative is framework-mediated restart | Requires crash fixture/process observation |
| C-023 | UNKNOWN | High | Validation/cache/blacklist/rescan, duplicate identity, exact isolation, bridging/signing UX, missing-plugin placeholders and deterministic failures are undocumented | AUv3 host | S-001, S-004, S-005 | Searched official host sections/changelog | Absence is not unsupported; fixture/vendor answer needed |
| C-024 | UNKNOWN | High | Direct AU sidechain, hosted AU multi-audio-output, PDC, sample-accurate automation, MIDI 2.0, dynamic I/O and complete event/latency/tail contract are undocumented | AUv3 host | S-001, S-004, S-005 | Distinguished envelope ducking and Loopy-as-AU multi-I/O from host support | Controlled purpose-built AUs needed |
| C-025 | DOCUMENTED/INFERENCE | Medium | Parameters can be discovered/bound/ranged/state-reflected; presets and save slots exist; MIDI clips automate; release fixes show intended AU state save/export/restore | Current/v2 lineage | S-001, S-004 | Direct control docs plus state-related release notes | Universal fidelity, IDs, sample timing and assets unknown |
| C-026 | DOCUMENTED | High | Loopy itself is AUv3 instrument/music effect/MIDI processor, can expose 128 parameters and multi-I/O, and offers whole-project/reference state; nested AU hosting is prohibited | Loopy AUv3 on iOS/iPadOS | S-001 | “Using Loopy as AUv3” sections | Outer-host compatibility not broadly tested |
| C-027 | DOCUMENTED | High | Loopy documents IAA inputs/effects and external-app UI switching | Current manual compatibility | S-001 | Mixer/Effects/Actions | Runtime viability on every current OS not probed |
| C-028 | DOCUMENTED | High | Apple deprecated Inter-App Audio in iOS 13 and directs use of Audio Units | Apple platform | S-007 | Exact Apple release-note passage | Deprecation does not itself remove Loopy compatibility |
| C-029 | DOCUMENTED | High | Projects are bundles; explicit Save commits while a continuously saved Workspace preserves current state; Save Points and Recently Deleted exist | Current standalone | S-001 | Managing Projects/Save Points | Atomicity/schema unknown |
| C-030 | DOCUMENTED | High | Standalone folder backup is Files-visible; AU project store needs export/move; crash-on-load preserves moved Workspace artifact | Current iOS/iPadOS | S-001 | Backing Up/Crashes on Load | Recovery success not independently tested |
| C-031 | DOCUMENTED | High | Clip audio/MIDI, stereo/stem sequence render, source/group/bus/output session stems, compressed/lossless capture and Join for DAW import are documented | Current/2.0.5 | S-001, S-003, S-004 | Export/Session/2.0.5 notes | Formal interchange and exact PCM format unknown |
| C-032 | DOCUMENTED | High | Set Lists/actions, sections/groups, quantization, automation, feedback and routable click support live performance | Current manual/site | S-001, S-002 | Multiple live sections | Vendor docs, no stage stress test |
| C-033 | DOCUMENTED/UNKNOWN | Medium | Diagnostics/stability cautions, reported no-data-collection, color-label option and localization are documented; broad accessibility/security/scaling are unknown | Current mobile | S-001, S-003, S-004 | Manual + App Store disclosures | Privacy/accessibility are developer declarations, not audits |
| C-034 | UNKNOWN | High | No public product source license was identified; format/library names do not grant implementation or distribution rights | Legal/clean-room boundary | S-002, S-003, S-005–S-007 | Public commercial distribution and no retained open-source product source | Separate authoritative license review required; not legal advice |
| C-035 | DOCUMENTED/UNKNOWN | High | No shipping desktop edition exists; planned Mac says generic VST/AU but specific generations and qualification are unknown | Current versus roadmap | S-003, S-006 | App Store current platforms + Mac page | Future plan may change |
| C-036 | INFERENCE | Medium-high | Documented modularity is action/mixer/session composition; canvas is not documented as the DSP patch graph | Current user architecture | S-001 | Canvas contains controls; mixer owns routing | Private engine may use an internal node graph |
| C-037 | DOCUMENTED/UNKNOWN | Medium-high | Apple base AU contract supports optional UI, declared types/identity, buses and render-resource lifecycle; Loopy lacks public scripting/post/schema/advanced-edit contracts | Platform/current product | S-001, S-005 | Apple contract plus negative official-manual coverage | Archived Apple guide is not an exhaustive 2026 AU role catalog |
| C-038 | DOCUMENTED/UNKNOWN | Medium-high | 2.0.5 is latest evidenced store/changelog release, but later-dated living-manual assets prevent claiming no newer non-store material exists | Cutoff version pin | S-001, S-003, S-004 | Cross-source date comparison | Manual is mutable and not version-pinned |

## 22. Source ledger and adaptive bibliography

### S-001 — Loopy Pro Manual

- **Publisher / URL / kind:** A Tasty Pixel,
  <https://loopypro.com/manual/>, official living manual.
- **Scope / access:** Current Loopy Pro manual, accessed 2026-08-29. Relevant
  sections: Welcome; Clips; Colours; Configuration; DSP & Performance; Clock;
  Mixer; AU Instruments/Effects; MIDI; Buses and Sends; Canvas/Widgets/Actions;
  Sequencer; Managing Projects/Export/Save Points/Set Lists; Session Recording;
  Using Loopy as an AUv3; Sync/OSC/System; Backing Up; Troubleshooting.
- **Relevant passages:** clips hold audio/MIDI loops/one-shots; colors aggregate
  routing like tracks; widgets bind actions; mixer owns routes; available AU
  panels and UI/presets; clone/idle/tail behavior; project and backup semantics;
  Loopy AU roles/state/multi-I/O; IAA inputs/effects.
- **Claims:** C-004–C-033, C-036–C-038 as mapped above.
- **Limitations:** Explicitly a frequently updated living document, not a
  versioned architecture specification; vendor claims are not independent
  runtime evidence. Several specific URLs returned the same full-manual payload.
- **Selection rationale:** Broadest first-party operational source and preferable
  to tutorials/forums for exact user-visible behavior.

### S-002 — Loopy Pro official product/pricing page

- **Publisher / URL / kind:** A Tasty Pixel, <https://loopypro.com/>, official
  product and commercial page.
- **Scope / access:** Current site, accessed 2026-08-29.
- **Relevant passages:** iPhone/iPad trial; Mac in development; current workflow
  roles; $29.99 USD unlock, 12 months updates, lifetime fixes, optional $14.99
  later period, no subscription.
- **Claims:** C-002–C-004, C-032, C-034.
- **Limitations:** Marketing source; prices may be regional/change; ratings and
  testimonials were not used as architecture evidence.
- **Selection rationale:** Canonical current pricing/positioning source,
  cross-checked with Apple rather than secondary reviews.

### S-003 — Apple App Store listing, Loopy Pro

- **Publisher / URL / kind:** Apple listing for A Tasty Pixel,
  <https://apps.apple.com/us/app/loopy-pro-looper-daw-sampler/id1492670451>,
  first-party distribution metadata/vendor description.
- **Scope / access:** US storefront, accessed 2026-08-29.
- **Relevant passages:** iPhone/iPad; iOS 13+; version 2.0.5 dated 2025-11-26;
  AUv3 roles; session stems; IAP; seller; no-data-collected declaration;
  accessibility features not indicated.
- **Claims:** C-001–C-002, C-019, C-031, C-033, C-035, C-038.
- **Limitations:** Vendor-provided description/privacy declaration hosted by
  Apple; regional metadata may differ; not an interoperability test.
- **Selection rationale:** Best primary release/platform metadata and independent
  distribution-channel cross-check for the vendor changelog.

### S-004 — Loopy Pro version 2 changelog

- **Publisher / URL / kind:** A Tasty Pixel,
  <https://loopypro.com/manual/changelog-v2/>, official release notes.
- **Scope / access:** Version 2.0 through 2.0.5, accessed 2026-08-29.
- **Relevant passages:** 2.0.5 latest heading; MIDI clips/sequencer/automation;
  bus-to-bus routes; warp; dockable panels; plugin preset import/export;
  controller-latency compensation; state/crash/render-timeout fixes in retained
  version history.
- **Claims:** C-001, C-008, C-013, C-015, C-021–C-025, C-031, C-038.
- **Limitations:** Fix notes prove vendor-documented intent/history, not that all
  regressions are absent; endpoint returned the whole manual around the target
  section.
- **Selection rationale:** Version attribution and failure-mode evidence that the
  living manual alone cannot provide.

### S-005 — Audio Unit App Extensions, App Extension Programming Guide

- **Publisher / URL / kind:** Apple Developer Documentation Archive,
  <https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/AudioUnit.html>,
  platform-owner architecture guide.
- **Scope / access:** AU app extensions; updated 2017-10-19; accessed 2026-08-29.
- **Relevant passages:** one AU per extension; generator/instrument/effect/music
  effect roles; optional/headless UI; host-sized remote view; component identity;
  input/output buses; render resource allocation lifecycle.
- **Claims:** C-022–C-024, C-034, C-037.
- **Limitations:** Archived and not exhaustive for later MIDI AU APIs; it does
  not establish Loopy-specific process isolation.
- **Selection rationale:** Platform owner is preferable to vendor/community
  paraphrases for the base AU extension contract.

### S-006 — Loopy Pro for Mac

- **Publisher / URL / kind:** A Tasty Pixel, <https://loopypro.com/mac/>, official
  roadmap/status page.
- **Scope / access:** Unreleased Mac edition, accessed 2026-08-29.
- **Relevant passages:** still under development/no date; planned standalone VST
  and AU hosting; Loopy as VST/AU; Intel/Apple-silicon; same document format;
  separate purchase and intended discount.
- **Claims:** C-003, C-034, C-035.
- **Limitations:** Mutable plans, no binary/version/format generation/SDK or test
  matrix. It cannot support a current matrix “yes.”
- **Selection rationale:** Dedicated canonical roadmap, preferable to forum
  promises or beta anecdotes.

### S-007 — Apple iOS 13 Release Notes (DocC JSON)

- **Publisher / URL / kind:** Apple,
  <https://developer.apple.com/tutorials/data/documentation/ios-ipados-release-notes/ios-13-release-notes.json>,
  platform-owner release notes.
- **Scope / access:** iOS 13 SDK deprecations; accessed 2026-08-29.
- **Relevant passage:** “Inter-App audio is deprecated. Use Audio Units for this
  functionality moving forward.”
- **Claims:** C-028, C-034.
- **Limitations:** Establishes platform direction, not removal or Loopy runtime
  failure. The normal HTML URL returned 404/empty; JSON was the accessible
  official equivalent.
- **Selection rationale:** Decisive platform-owner origin for IAA lifecycle;
  preferable to blog/forum claims.

## 23. Unknowns and next discriminating probes

| Unknown | Attempt / blocker | Decision impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| U-01 Engine precision, rates/blocks, threads, multicore, offline path | Official manual/changelog searched; proprietary internals absent [C-011, C-014] | Sizing and real-time architecture | Vendor technical response plus controlled rate/buffer/export timing measurements on disposable device | Unassigned |
| U-02 AU discovery, validation, cache, duplicates, quarantine/rescan | Add-panel behavior documented; no lifecycle contract [C-023] | Startup safety and diagnosability | Signed AU fixtures with duplicate IDs/versions, invalid registration, timeout/crash; record cold/warm enumeration and UI | Unassigned |
| U-03 AU process/sandbox/failure isolation | Apple general extension guide and Loopy reload note do not define Loopy topology [C-022, C-023] | Crash blast radius/security | Lawful process/log observation with crash/hang/memory-pressure fixtures; no reverse engineering | Unassigned |
| U-04 Direct sidechain, hosted multi-output, dynamic I/O, MIDI/event fidelity | Manual only shows envelope ducking and Loopy-as-AU multi-I/O [C-024, C-026] | Graph and format fidelity | Purpose-built auxiliary-input/multi-output/dynamic-bus/MIDI-cable AUs; enumerate and route every bus | Unassigned |
| U-05 PDC, AU latency/tail and sample-accurate automation | Controller latency and tail UX documented, not plugin compensation [C-014, C-024] | Musical timing and export correctness | Impulse/loopback AU reporting known latency/tail; automate at sample offsets in live and export paths | Unassigned |
| U-06 Parameter/state/preset/assets and missing plugin | State fixes and presets documented; no uninstall/migration contract [C-023, C-025] | Project durability | Save fixture with state, preset, external asset; upgrade, uninstall, reopen, reinstall; inspect placeholder and route preservation | Unassigned |
| U-07 File schema, atomicity, compatibility and collaboration | Bundle/Workspace behavior only; no public schema [C-029, C-037] | Migration and cross-platform documents | Vendor format contract or disposable project round trips across supported versions; defer Mac until shipping | Unassigned |
| U-08 IAA viability on current OS/device matrix | Loopy docs say supported; Apple says deprecated [C-027, C-028] | Legacy compatibility only | If required, two known IAA apps across minimum/current OS; record launch, restore, interruption and failure UX | Unassigned |
| U-09 Future Mac exact formats/licensing/qualification | Official page says generic VST/AU and no date [C-003, C-035] | Cross-platform choice | Revisit only after public binary, manual, exact format versions, signing rules and format-owner terms exist | Unassigned |
| U-10 Accessibility, scaling limits, codecs/post interchange | Manual/store offer sparse disclosures [C-031, C-033, C-037] | Product breadth and inclusive live use | VoiceOver/keyboard audit, stress matrix, import/export corpus, and vendor interchange matrix | Unassigned |

## 24. Curiosity pass and stop decision

Scores are 0–3 for **decision relevance (R)**, **expected value (V)**,
**novelty (N)**, and **low cost (C)**; maximum 12. Only the best qualifying
thread after each synthesis was pursued.

| Candidate after synthesis | R/V/N/C | Decision |
| --- | --- | --- |
| Current App Store metadata + official v2 changelog | 3/3/3/3 = **12** | Pursued in pass 2; pinned version/platform and v2 scope |
| Loopy AU host pages + Apple AU architecture | 3/3/3/2 = **11** | Pursued in pass 3; bounded roles/UI/lifecycle and preserved isolation unknown |
| Persistence/export/backup + Mac status | 3/3/2/2 = **10** | Pursued in pass 4; resolved durability and kept roadmap non-shipping |
| Apple IAA deprecation origin | 3/3/3/2 = **11** | Pursued in pass 5; changed IAA disposition to legacy |
| Missing-plugin placeholder behavior | 3/3/2/0 = **8** | **CURIOSITY_NO_GO:** official evidence absent; uninstall/reopen fixture required |
| Direct sidechain/multi-output/PDC/sample accuracy | 3/3/2/0 = **8** | **CURIOSITY_NO_GO:** purpose-built AU fixtures required |
| Public roadmap voting board | 1/1/1/1 = **4** | **CURIOSITY_NO_GO:** mutable and official Mac page already bounds material plans |
| Artist/community compatibility anecdotes | 1/1/2/0 = **4** | **CURIOSITY_NO_GO:** cannot generalize host fidelity |
| Binary/project-schema inspection | 2/2/3/0 = **7** | **CURIOSITY_NO_GO:** outside documentary/clean-room wave |
| Exhaustive changelog/OSC inventory | 1/1/1/0 = **3** | **CURIOSITY_NO_GO:** duplicates/noise unlikely to change decision |

**Stop decision — COVERAGE + SATURATION.** Four substantive two-source-or-less
passes plus one bounded single-source follow-up covered every template heading,
every required plugin row, all requested Loopy-specific topics, and the main
architecture conclusions. The remaining high-impact unknowns all require vendor
disclosure or controlled AU/IAA/project fixtures. Search also repeated the same
living manual payload and encountered HTTP 429/404 negatives. Another public
documentary pass has nonpositive marginal evidence, so research stops at
`COMPLETE_WITH_UNKNOWNS`; the next phase is bounded interoperability testing,
not further browsing.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** PASS — only
  `research/daw-landscape/dossiers/loopy-pro.md` was created.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  PASS — section 0.
- [x] **Every required dossier heading exists in order.** PASS — sections 0–25
  and 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** PASS —
  substantive bullets identify `DOCUMENTED`, `INFERENCE`, or `UNKNOWN` and cite
  C-IDs; claims register resolves them.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** PASS
  — section 21 and unknown/probe table.
- [x] **Every required plugin-format row is present.** PASS — all 13 contract
  rows appear in section 11.1 with no blank cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  PASS — discovery, runtime, buses/events, parameters/state, UI/failure and
  missing-plugin gaps are separated in sections 11.2–11.6.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  PASS — classifications and limits are explicit; no `OBSERVED` claims are made.
- [x] **Licensing and clean-room boundaries are explicit.** PASS — sections 0,
  16, 18, and claim C-034.
- [x] **Bibliography records source rationale and limitations.** PASS — section
  22 records passages, scope, claims, limitations, and preference rationale.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** PASS —
  sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** PASS — documentary HTTP reads and local text extraction
  only; no app/plugin installation, binary execution, staging, or commit.

**Checks performed:** source/claim cross-walk; required-heading and plugin-row
visual audit; distinction audit for current versus roadmap and host versus Loopy
extension; negative-result retention; pre/post `git status --short`; no staging.

**Unresolved blockers:** C-011, C-014, C-023, C-024 and U-01–U-10 are honestly
bounded; they require vendor disclosure or disposable fixtures rather than more
documentary inference.

**Workspace hygiene:** The initial Git status contained many pre-existing
modified/untracked files, including the untracked governing research files and
sibling dossiers. They were left untouched. This dossier was absent before this
assignment and is the sole owned change.
