# Reason Studios Reason DAW dossier

> Research-only public clean-room evidence. No design, implementation, legal,
> procurement, release, or security-acceptance authority.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Reason Studios Reason |
| Canonical vendor | Reason Studios AB; launched in 2000 as Propellerhead Software |
| Researcher/session | OpenCode subagent, `ses_fb26d9280ffe1dM6GWlHKE5BV3` |
| Owned path | `research/daw-landscape/dossiers/reason-studios-reason.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current snapshot | Reason 14.0.1, released 2026-06-12; Reason 14 released 2026-05-08 |
| Editions in scope | Perpetual Reason 14; Reason+ subscription; standalone DAW boundary of both |
| Platforms | macOS and Windows desktop only; no Linux, ChromeOS, Android, iOS, browser, or mobile product |
| Included | Standalone DAW, Rack, sequencer/mixer, VST2/VST3 host, Rack Extensions, Remote, Reason song persistence, and Reason Rack Plugin boundary where it constrains the standalone product |
| Excluded | ReCycle, standalone Reason Rack/Reason Rack Free as products, other DAWs that host Reason Rack Plugin, private SDK material, product installation, binary/project reverse engineering, runtime benchmarks, and legal conclusions |
| Completion | `COMPLETE_WITH_UNKNOWNS` |

The product/version/platform boundary is **DOCUMENTED** [C-001, C-002,
C-003]. No product, installer, Rack Extension, VST, or song file was executed;
no authentication or access control was bypassed [C-034].

## 1. Executive summary

- **DOCUMENTED:** Reason 14.0.1 is a macOS/Windows rack-first DAW whose current
  track-centric sequencer can expose a track's devices, parallel paths, sends,
  and mix controls while preserving a freely cableable audio/CV rack [C-001,
  C-004, C-005].
- **DOCUMENTED:** The standalone DAW currently hosts 64-bit VST2.4 and VST3 on
  both desktop platforms. VST3 arrived in Reason 12.5 alongside VST2. Hosted
  VSTs are wrapped as Plugin Rack Devices, but VST hosting is explicitly absent
  inside Reason Rack Plugin [C-011, C-012, C-016].
- **DOCUMENTED:** Current scanning is launch-time over standard and optional
  custom paths. Management exposes format, device type, path/details, enable or
  disable controls, and `Could not load`/`Crashed` states; a crashed or hung VST
  is automatically disabled for a later retry [C-013, C-014].
- **DOCUMENTED:** Rack Extension is materially different from ordinary VST
  hosting: its host-owned GUI/motherboard/controller/realtime model, constrained
  native runtime, per-instance fuse, server-side platform builds, validation,
  Shop distribution, authorization, and license agreements form a vertically
  controlled extension boundary [C-023-C-030].
- **UNKNOWN:** Ordinary VST process isolation, scan-process isolation,
  architecture bridging, PDC algorithm and latency/tail calls, sample-accurate
  automation, stable parameter identity, dynamic-I/O timing, and crash-state
  recovery are not disclosed. A format logo, successful scan, and instance UI
  do not establish that full contract [C-015, C-021, C-022].
- **Confidence:** High for current identity, supported VST formats, scan UX,
  rack routing, Rack Extension public contract, parameter UI, embedded VST
  state, and song-version direction. Low for proprietary engine internals and
  untested interoperability edge cases. Vendor documentation proves the stated
  contract, not independent reliability or performance.

## 2. Product identity, history, and market position

Reason is sold as a licensed product and is included in Reason+. Both include
the standalone DAW and current Reason Rack Plugin; the separate Reason Rack
subscription omits the DAW. Reason 14.0.1 is the current documented maintenance
release at cutoff [C-001-C-003].

The current site describes a lineage launched in 2000 and positions the Rack as
the core product concept. Reason 14 shifts navigation toward the sequencer with
Track Panel and Rack-per-Track, rather than replacing the rack [C-003-C-005].
The retained evidence does not establish market share, installed base, or an
independently measured user segment; those remain **UNKNOWN** and are not needed
for the architecture decision [C-033].

## 3. Workflow and conceptual model

The core model has three linked views: a linear sequencer of tracks and clips,
a device rack, and a mixer. Reason 14's Track Panel shows the selected track's
device chain, parallel paths, sends, level, pan, mute, and solo. Its Rack-per-
Track mode creates/sorts rack columns by track. Device reorder changes signal
flow unless the user holds Shift to preserve routing [C-004, C-005].

The rack auto-connects devices in a logical top-to-bottom flow, but its rear
panel permits explicit audio and control-voltage cabling, splitting, and
parallel processing. Combinator packages multiple devices and maps controls to
a designed front panel. These are **DOCUMENTED user models**, not evidence of
the private scheduler or graph representation [C-005-C-007, C-036].

Track folders can nest two additional levels and expose aggregate folder clips.
Audio, MIDI, and automation clips can loop, and edits to a loop instance update
all instances until converted to separate clips. The workflow is therefore
linear/timeline-first with reusable clips and device-level modularity, not a
scene launcher, tracker, notation system, browser DAW, or mobile DAW [C-008].

## 4. Publicly documented architecture

For Rack Extensions, the public SDK describes four runtime layers: GUI,
motherboard data model, realtime controller, and realtime DSP. GUI and data
model are data-driven/Lua-based; DSP is portable C++ compiled to a submitted
platform-independent Universal 45, transformed on Reason Studios servers to a
platform-specific Optimized 45. Reason's panel owns document state and performs
GUI/rack/document/sample work; its engine performs realtime processing, with
message queues between the roles [C-024, C-026, C-029].

The Rack Extension account is **DOCUMENTED** but bounded to that extension
runtime. The standalone application's ordinary VST process/thread model, graph
storage, audio callback topology, cache schema, and service boundaries are
**UNKNOWN**. It would be invalid to project Rack Extension isolation onto VST2
or VST3 [C-015, C-025, C-036].

## 5. Audio engine

Reason has a routable audio/CV graph, supports global delay compensation, and
auto-routes instrument and effect devices. Reason 14.0.1 fixed an issue where
delay compensation did not work correctly, confirming the feature exists but
not its algorithm or exact coverage [C-005, C-016, C-022].

For Rack Extensions, subscribed property changes are supplied to realtime code
as differences sorted by frame position, note events contain a frame index,
unwritten outputs are treated as silent, and the host can disable a device that
violates realtime/API/time constraints. This is a specific SDK contract, not a
general statement about VST automation precision [C-025, C-028].

**UNKNOWN:** supported standalone sample-rate/bit-depth matrix, internal mix
precision, block-size policy, multicore scheduling details, VST latency/tail
queries, lookahead topology, feedback compensation, oversampling, dropout
policy, freeze semantics, deterministic offline rendering, and headless mode.
The Rack page markets multi-core DSP for Rack Extensions, but no independent
scaling evidence was obtained [C-021, C-023, C-036].

## 6. Tracks, timeline, clips, and editing

Reason 14 documents audio, MIDI, and automation clips; track folders and folder
clips; loop-instance editing; clip overlap for variations; note chase; tempo
detection for imported loops; and stretch-on-import choices. The track panel
links arrangement objects to rack and mixer controls [C-004, C-008, C-035].

**UNKNOWN:** current take-lane/comping depth, ripple/source-destination editing,
clip versioning, destructive editor boundaries, spectral editing, score view,
and project-wide history persistence. These omissions are evidence gaps, not
claims of absence [C-033].

## 7. MIDI, sequencing, notation, and expression

Reason documents MIDI clips/notes, piano-roll improvements, note chase, Player
MIDI effects, step sequencer/arpeggiator control through rack connectors, and a
MIDI Out device in the current device inventory. Remote maps MIDI controllers
to notes, parameters, and transport and can support feedback/motorized controls
[C-007, C-008, C-010].

For hosted VSTs, Reason supports only one MIDI channel per instance, directs
multitimbral VSTs to channel 1, does not accept VST MIDI output, and cannot
record notes played on a VST's own on-screen keyboard [C-017]. Rack Extension
note events can carry a frame index and can be sent back to the host, but MPE,
per-note expression, MIDI 2.0, SysEx, score notation, MIDI clock, and MTC are
**UNKNOWN** in the retained current evidence [C-028, C-033].

## 8. Routing, mixer, automation, and control

The rear rack exposes audio and CV cables; the track panel exposes signal
chains, parallel paths, sends, and basic mix controls. VST Plugin Rack Devices
provide stereo/mono auto-routing, effect sidechain inputs 3-4, optional multiple
audio inputs/outputs, eight CV-to-parameter slots, Sequencer Control for
instruments, and Mix Channel integration [C-005, C-016].

VST parameters can be recorded or drawn into one automation lane per selected
parameter, selected through an automation menu, modulated by CV, and assigned
to Remote overrides. Reason 14 raises the maximum automatable parameters per
device to 10,000 [C-018]. Remote supports auto-detection, dynamic mappings,
manual overrides, multiple controllers, and two-way feedback where hardware
supports it [C-010].

**UNKNOWN:** surround/immersive layouts, VCA semantics, feedback-loop rules,
OSC, sample-accurate VST automation, stable parameter IDs across plug-in
upgrades, automation/event ordering, and PDC at arbitrary split/rejoin points
[C-021, C-022].

## 9. Recording, comping, and media handling

Reason 14 is documented to use audio and MIDI tracks/clips, record VST parameter
automation, estimate imported-loop tempo, read additional tempo metadata, and
offer import-as-is or stretch-to-song-tempo behavior [C-008, C-018, C-035].

**UNKNOWN:** exact audio recording formats, punch/loop recording semantics,
take comping, input-monitoring modes, sample-rate conversion, proxy/conform,
video, metadata preservation, and asset relinking. No inference is made from
the product's general DAW positioning [C-033].

## 10. Instruments, effects, content, and native devices

The rack contains instruments, effects, Player MIDI effects, and utilities.
Players can transform or generate notes; utility devices route and modulate;
Combinator stores a multi-device graph and maps controls; current subscriptions
advertise Reason devices plus sounds/patches [C-003, C-006, C-007].

Rack Extensions occupy the same device categories and integrate with audio/CV
cables, sequencer, Remote, undo, browser, download/update, and the rack. The SDK
5 metadata schema recognizes Instrument, Effect, Utility, and Player device
types [C-023, C-030]. Inventory size and marketing claims are not treated as
independent quality or performance evidence.

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` records the documented absence of a Reason product on that
platform, not a statement about technical feasibility [C-002]. Reason Rack
Plugin's VST3/AUv2/AAX output formats do not prove that standalone Reason hosts
AU or AAX [C-003, C-032].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **DOCUMENTED** | **DOCUMENTED** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | Reason 14 standalone; 64-bit VST2.4 | Current and visible separately from VST3; VST2 licensing is an independent constraint | C-011-C-014; S-007, S-009 |
| VST3 | **DOCUMENTED** | **DOCUMENTED** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | Reason 12.5+ through Reason 14 standalone; 64-bit | Instrument, effect, utility; current hosting fixes in 14.0.1 | C-011-C-014, C-022; S-006-S-009 |
| AUv2 | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | Reason Rack Plugin is AUv2, but that is output, not standalone hosting | No affirmative host evidence retained | C-003, C-032; S-002, S-003 |
| AUv3 | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No affirmative evidence | Do not infer from AUv2 output | C-032; S-002 |
| AAX | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | Reason Rack Plugin is AAX, but that is output, not standalone hosting | No affirmative standalone host evidence | C-003, C-032; S-002, S-003 |
| CLAP | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No affirmative evidence | Host contract unknown | C-032; S-007 |
| LV2 | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No affirmative evidence | Host contract unknown | C-032; S-007 |
| LADSPA | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No affirmative evidence | Host contract unknown | C-032; S-007 |
| DSSI | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No affirmative evidence | Host contract unknown | C-032; S-007 |
| JSFX | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No affirmative evidence | Host contract unknown | C-032; S-007 |
| DirectX/DXi | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No affirmative evidence | Host contract unknown | C-032; S-007 |
| Rack Extension | **DOCUMENTED** | **DOCUMENTED** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | Reason 14; SDK 5.0.0 devices require Reason 14+ | First-class, licensed, Shop-distributed rack devices with distinct sandbox | C-023-C-030; S-003, S-005, S-010-S-012 |
| Product-native/other | **DOCUMENTED** | **DOCUMENTED** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | Reason 14 internal devices, Players, Combinator | Native rack devices and ReFill/content boundary; not an open binary plug-in format | C-006, C-007, C-030; S-002, S-003, S-005 |

### 11.2 Discovery, scanning, validation, and recovery

Reason 14 scans standard VST2/VST3 folders at every launch on macOS and Windows,
allows custom folders, and requires restart after path/enable changes. Device
Palette filters show VST2/VST3 separately and can hide a VST2 duplicate with
the same exposed product identity [C-013, C-014].

Manage Plugins reports manufacturer, name, type, device role, status, path, and
details. A plug-in may be enabled, disabled, unable to load, or crashed. A plug-
in that crashes or hangs is automatically disabled and may be re-enabled for a
retry on next launch. Reason 13.3.3 forced a complete rescan after a VST3 bus-
handling fix, showing cache invalidation can be release-driven [C-013, C-014].

**UNKNOWN:** cache location/schema, hash/identity key, incremental invalidation,
scan subprocess, timeout threshold, quarantine persistence across versions,
signature/notarization enforcement, and duplicate matching algorithm [C-015].

Rack Extensions use a different path: submission/validation and server builds,
then Shop/Authorizer download, installation, copy protection, and license
verification. That is not evidence that ordinary VSTs receive equivalent
validation [C-026, C-027].

### 11.3 Runtime isolation and compatibility

Rack Extension realtime C++ runs as native code inside a constrained sandbox in
the Reason engine. It has no direct OS-library access; cannot allocate memory
during audio rendering; and is supervised for API violations, access faults,
and callback overruns. Each instance has a virtual fuse; when it blows, the user
is notified while other Reason components and Rack Extensions continue [C-024,
C-025]. Lua runs in controlled virtual machines. This is containment, not a
claim that native C++ is process-isolated [C-025].

For VST2/VST3, **UNKNOWN:** in-process versus separate-process execution,
per-instance versus shared process, scan isolation, crash containment after
instantiation, Rosetta/architecture bridging, and compatibility modes. The
`Crashed` status proves detection/disable UX, not a process boundary [C-015].

### 11.4 Host/plugin processing contract

Reason 14 represents each VST as a Plugin Rack Device. It auto-routes mono or
stereo instruments to Mix Channels, exposes effect sidechain inputs 3-4,
optional audio I/O where the plug-in reports it, eight CV modulation inputs,
and Sequencer Control on instruments [C-016]. Instrument VSTs get sequencer
tracks; effects/utilities do not by default [C-016].

The current contract explicitly limits hosted VSTs to one MIDI channel and no
VST MIDI output. Bypass/Off does not disable processing or reduce CPU; a
separate On/Off control disables the VST and reduces load [C-017, C-019].

**UNKNOWN:** maximum/arrangement of buses, dynamic-I/O negotiation timing,
sample format, sample-accurate automation/events, MPE/MIDI 2.0, parameter/event
ordering, plug-in latency/tail query and PDC details, suspend/sleep callbacks,
in-place processing, offline-call distinctions, and headless rendering
[C-021, C-022].

### 11.5 Parameters, automation, state, presets, and project recall

Reason exposes selected VST parameters to sequencer lanes, Remote overrides,
and eight CV programmer slots. VST3 `.vstpreset` files and VST2 banks/programs
have distinct browser paths. Song save embeds all VST preset/patch/program data
[C-018, C-020].

When a VST is missing, Reason creates an empty Plugin Rack Device. It is silent;
an insert effect bypasses audio, while a send effect is silent. The song may be
saved and returned to a system with the VST, where the settings are restored
[C-020].

**UNKNOWN:** exact state-chunk API sequence, stable plug-in/parameter identity,
external asset capture, version migration, state size limits, corrupt-state
handling, and whether every plug-in-defined program/state edge case survives
cross-OS recall [C-021].

### 11.6 UI, diagnostics, and failure modes

VST custom UIs open in separate floating, always-on-top Plugin Windows; several
may remain open. Reason can capture a UI screenshot for its device palette and
offers Windows auto-scaling. Plug-in path/status details and current `Could not
load`/`Crashed` diagnostics are user visible [C-013, C-018].

Reason 14.0.1 fixed crashes while deleting/cutting/removing VST-bearing tracks
and closing VST songs, demonstrating active failure repair but not proving
complete containment [C-001, C-015]. **UNKNOWN:** native editor fallback,
headless UI, DPI behavior across all platforms, structured logs, crash dumps,
per-plug-in rollback, and recovery from a crash during state restoration.

## 12. Extensibility and integration

Reason exposes three distinct public integration classes [C-003, C-010,
C-023-C-030]:

1. Rack Extensions use the licensed Jukebox SDK, controlled device schema,
   constrained runtime, validation, and Reason Studios distribution.
2. Remote maps/control-surface codecs can provide auto-detection, dynamic
   mappings, transport/parameter control, feedback, and multiple-controller
   operation; a developer license is required through Reason Studios.
3. Reason Rack Plugin exports the rack to another host as VST3, AUv2, or AAX,
   but cannot itself nest VSTs.

**UNKNOWN:** a general-purpose scripting API, OSC API, stable command/action
API, public song-file API, or unrestricted third-party native extension API.

## 13. Project format, persistence, interoperability, and collaboration

Reason Studios states that Reason 14 opens songs made in any earlier Reason
version; after saving, that song requires the saving version or later. Purchased
Rack Extensions remain associated with the account and usable in later Reason
versions [C-031]. Current VST songs embed preset/patch/program state and preserve
missing VST placeholders for round trips [C-020, C-031].

The Rack Extension motherboard/document model is host-owned, and the SDK's
stated design goal is durable songs across future Reason versions/platforms.
That is a vendor contract/design goal, not an independent proof that every
third-party DSP revision is bit-identical [C-026, C-029].

**UNKNOWN:** song schema, checksums, autosave/crash-recovery mechanics, asset
collection/relinking, merge/version control, cloud collaboration, AAF/OMF/ADM,
MusicXML, DAWproject, and exact MIDI/stem exchange. Project parsing or binary
diffing was excluded by the clean-room contract [C-033, C-034].

## 14. Delivery, live, post-production, and specialized workflows

The product is positioned for writing through final release, and current
Reason+ bundles external mastering/distribution services. The rack supports
modular/generative patching, and Remote can support hardware-led performance
[C-003, C-005, C-010].

**UNKNOWN:** batch export, DDP, loudness compliance, video/timecode/ADR,
surround/immersive/ADM, show control, live set failover, and stem-delivery
contracts. Subscription services are ecosystem offerings, not evidence of the
standalone engine's delivery formats [C-033].

## 15. Performance, reliability, security, and accessibility

Rack Extension has the strongest documented reliability/security boundary:
portable submission, server builds, validation instrumentation, restricted OS
access, realtime allocation/time rules, per-instance fuses, host-accounted
memory, and centralized licensing [C-025-C-027]. This narrows capability and
distribution freedom in exchange for host control.

Ordinary VST management detects load errors/crashes and disables offenders, but
its process isolation and security boundary are **UNKNOWN** [C-013, C-015].
Reason 14.0.1 fixed VST lifecycle crashes, a delay-compensation fault, and other
stability issues; release fixes are not independent reliability measurements
[C-001, C-022].

Current minimum macOS evidence is macOS 11+, 64-bit, Intel or Apple silicon.
Exact current minimum Windows version, Windows-on-Arm behavior, accessibility
conformance, screen-reader/keyboard coverage, localization completeness,
telemetry/privacy details, signing/notarization behavior, rollback, and measured
scaling limits remain **UNKNOWN** [C-002, C-033].

## 16. Licensing, ecosystem, and implementation constraints

Reason and Reason+ are proprietary licensed products. Reason can run offline
for a bounded authorization period, and ordinary VST licenses are handled by
each VST vendor rather than Reason's Rack Extension authorization system
[C-002, C-027].

The public Rack Extension SDK agreement grants a royalty-free license to study,
amend, and use the SDK for developing Rack Extension products for the Reason
Studios Shop and related development materials/add-ons. Commercial distribution
requires the current distribution agreement; products are submitted, validated,
server-built, copy-protected, authorized, and distributed through Reason
Studios. These are ecosystem dependencies, not merely technical APIs [C-026,
C-027]. No legal conclusion is offered.

VST2 and VST3 naming/hosting grants no SDK, trademark, redistribution,
certification, compatibility, or signing rights to another DAW. VST2 is a
discontinued-format licensing risk under the governing decision frame; current
format-owner terms were not retrieved in this product-bounded dossier. AUv2 and
AAX output from Reason Rack Plugin likewise grant no Apple/Avid rights [C-032,
C-034]. Any implementation requires independently licensed specifications and
its own clean-room design.

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** Reason presents native devices, VSTs, and Rack Extensions through
a coherent rack/container model; makes routing tangible through cables; links
track, rack, sequencer, and mixer; preserves missing VST state; and exposes
useful scan diagnostics. Rack Extension demonstrates how a constrained,
host-owned extension contract can buy stronger portability and failure
containment [C-004-C-007, C-013, C-016, C-020, C-025-C-029].

**Liabilities.** The standalone third-party format set is narrow in affirmative
evidence, VST MIDI output/multitimbrality are restricted, bypass does not
suspend processing, floating UIs remain separate from the rack, and deep VST
isolation/PDC/state semantics are undisclosed. Rack Extension portability and
containment depend on a proprietary SDK, server build, agreements, Shop, and
authorization [C-015, C-017-C-021, C-026, C-027, C-032].

**Architecture lesson.** A visually simple universal container can normalize
device placement without pretending every plug-in shares the same bus, event,
state, or failure contract. A separately governed extension tier can offer
stronger guarantees, but only by making restrictions and ecosystem control
explicit [C-016, C-021, C-025-C-027].

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites / tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- |
| Users cannot see signal flow | Auto-wire common cases, expose a reversible graph/cable view, and make reorder semantics explicit | C-004, C-005, C-016 | Cycle validation, accessible nonvisual graph view, PDC-aware split/rejoin; avoid copying Reason expression/assets | **CANDIDATE** |
| Plug-in types fragment workflow | Stable host-owned device container with explicit instrument/effect/utility role and adapters for buses, state, UI, automation | C-013, C-016-C-020 | Must not erase format-specific limitations; qualification matrix required | **CANDIDATE** |
| Missing plug-ins destroy editability | Typed placeholder retaining identity, routing, automation, and opaque state while defining silence/bypass behavior | C-020 | State security/size policy and explicit restore matching | **CANDIDATE** |
| Third-party DSP threatens host stability | Optional constrained extension tier with capability-limited APIs, host-owned state/UI schema, watchdog/fuse, validation, and versioned portability target | C-024-C-029 | High SDK/governance cost; limits libraries, distribution, and developer freedom | **CONDITIONAL** |
| Scan failures block startup | Separate accepted/scanned/loaded statuses, path/details, disable/retry, release-driven cache invalidation | C-013-C-015 | Prefer actual scan process isolation and bounded timeouts, which are unknown in Reason | **CANDIDATE** |
| Track and graph views drift | Track panel as projection of the same graph, including parallel paths and sends | C-004, C-005 | One canonical graph/state model; avoid duplicate mutable representations | **CANDIDATE** |
| Format migration creates duplicates | Show format labels and optional duplicate suppression without deleting either format | C-011, C-014 | Stable vendor/product identity is difficult; state migration remains separate | **CONDITIONAL** |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** Treating VST bypass as suspension. Reason explicitly says
  Bypass/Off continues to consume CPU; use a separate disable state [C-019].
- **REJECTED:** Treating `VST3 supported` as a full host contract. Format
  acceptance, scan, instance/routing, and selected state behavior are documented;
  timing, latency, isolation, tails, and migration remain incomplete [C-011-C-021].
- **REJECTED:** Reusing Rack Extension's proprietary visual expression, SDK
  code, names, protocol, Shop model, or agreements. Only abstract constraints
  and outcomes are candidates for independent clean-room design [C-026, C-027,
  C-034].
- **CURIOSITY_NO_GO:** Binary/song reverse engineering. Prohibited by scope and
  unnecessary for the documentary decision; reopen only under a separately
  approved lawful fixture plan [C-034].
- **CURIOSITY_NO_GO:** Complete controller model inventory. Remote semantics are
  sufficient; model enumeration has low architecture value [C-010].
- **CURIOSITY_NO_GO:** Market-share and corporate-history expansion. It cannot
  change the host/extension architecture conclusion [C-033].
- **CURIOSITY_NO_GO:** More VST release-note mining. Current manual and scan
  release establish the public boundary; unresolved questions require dynamic
  fixtures, not more marketing/support pages [C-021].

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test / counterevidence | Result | Next discriminating probe |
| --- | --- | --- | --- |
| H1: Reason 14 replaced the rack with a conventional channel strip | Current release still makes Rack-per-Track, device graph, parallel-path navigation, and Rack window central | **REJECTED** [C-004, C-005] | None needed |
| H2: Current Reason dropped VST2 when VST3 arrived | Reason 14 manual explicitly documents both 64-bit VST2.4 and VST3 and duplicate filtering | **REJECTED** [C-011, C-014] | Recheck on next major release |
| H3: A VST accepted by format necessarily produces MIDI and multitimbral operation | Current manual explicitly limits one channel and rejects VST MIDI output | **REJECTED** [C-017] | Capability fixture for note-expression/event edge cases |
| H4: Rack Extension sandbox means one OS process per device | SDK says native C++ runs sandboxed in the Reason engine and describes a fuse, not a process | **REJECTED** [C-025] | Vendor architecture clarification only |
| H5: A VST crash status proves runtime process isolation | Status documents detection/disable; no process boundary is stated | **NOT ESTABLISHED** [C-013, C-015] | Crash fixture plus process/log observation in disposable host |
| H6: VST bypass suspends DSP | Manual says Bypass/Off leaves CPU/DSP load; separate disable reduces it | **REJECTED** [C-019] | Tail/bypass render fixture |
| H7: Missing plug-ins make a song unsafe to resave | Current manual explicitly supports resave and later restoration with settings | **SUPPORTED for documented VST state** [C-020] | Cross-version/cross-OS asset fixture |
| H8: Delay compensation existence proves complete PDC | 14.0.1 confirms delay compensation and a bug, but no topology/call contract | **PARTIAL ONLY** [C-022] | Impulse fixtures across inserts, sidechains, splits, live/offline paths |

**Accepted -> scanned -> instantiated -> full contract check:**

1. **Accepted:** Reason 14 documents 64-bit VST2.4 and VST3 on macOS/Windows [C-011, C-012].
2. **Scanned:** launch paths, custom paths, statuses, and rescan behavior are documented [C-013, C-014].
3. **Instantiated:** Plugin Rack Device, UI, routing, sidechain, optional I/O, automation, and state are documented [C-016-C-020].
4. **Full contract:** not established; isolation, timing, PDC mechanics, tails, dynamic I/O, state edge cases, and recovery remain unknown [C-015, C-021, C-022].

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Reason 14.0.1 was released 2026-06-12 and is current at cutoff; it fixed VST lifecycle crashes and delay compensation | Current build | S-006 | Direct release notice | No independent reliability measurement |
| C-002 | DOCUMENTED | High | Reason is a macOS/Windows-only desktop product; current Mac minimum is macOS 11+, Intel or Apple silicon | Platform | S-002, S-003 | Product FAQ/system requirements | Exact current Windows minimum and Arm behavior not captured |
| C-003 | DOCUMENTED | High | Reason/Reason+ include DAW plus Rack Plugin; Rack-only subscription omits DAW; Rack Plugin output is VST3/AUv2/AAX | Edition/boundary | S-002, S-003 | Direct edition comparison | Output format is not host-format evidence |
| C-004 | DOCUMENTED | High | Reason 14 adds Track Panel and Rack-per-Track, exposing chain, sends, parallel paths, and mix controls from sequencer | Workflow | S-005 | Direct launch notes | Internal state model unknown |
| C-005 | DOCUMENTED | High | Rack auto-wires top-to-bottom but exposes user audio/CV cables; device reorder can change signal flow | Rack/routing | S-003, S-005 | Direct product/release descriptions | Cycle and scheduler internals unknown |
| C-006 | DOCUMENTED | High | Combinator stores multiple devices and maps controls to a custom front panel | Native device model | S-003 | Direct rack description | File/schema details unknown |
| C-007 | DOCUMENTED | High | Native device roles include instruments, effects, Players, and utilities; Players transform/generate MIDI | Device model | S-002, S-003 | Current inventory and rack page | Inventory quality not assessed |
| C-008 | DOCUMENTED | High | Reason 14 has nested track folders/folder clips and loopable audio, MIDI, automation clips plus note chase/tempo-detect imports | Sequencer | S-005 | Direct release notes | Full editing/comping contract not covered |
| C-009 | DOCUMENTED | High | Track Panel/Rack-per-Track project graph links track device placement and routing views | Workflow/graph | S-005 | Bounded synthesis of documented UI behaviors | Canonical internal graph is inference, not claimed |
| C-010 | DOCUMENTED | High | Remote supports auto-detect, dynamic/manual mapping, multiple controllers, and two-way feedback; developer licensing is offered | Control | S-004 | Direct current support article | Protocol internals/stability not retrieved |
| C-011 | DOCUMENTED | High | Reason 12.5 introduced VST3 support while retaining 64-bit VST2.4; Reason 14 still hosts both | Format evolution | S-007, S-009 | Current manual plus official release search | VST2 future support unknown |
| C-012 | DOCUMENTED | High | Standalone Reason hosts 64-bit VST2/VST3 on macOS/Windows; Reason Rack Plugin cannot host VSTs | Host scope | S-007 | Direct compatibility section | Architectures/bridging unknown |
| C-013 | DOCUMENTED | High | Reason scans standard/custom paths at launch and manages enabled/disabled/load-error/crash states with details/retry | Scanning | S-007 | Direct manual | Cache and subprocess unknown |
| C-014 | DOCUMENTED | High | VST2/VST3 are labeled separately; VST2 duplicates can be hidden; 13.3.3 forced a full rescan after bus fix | Identity/cache UX | S-007, S-008 | Direct manual/release | Duplicate key and cache schema unknown |
| C-015 | UNKNOWN | High that evidence is absent | Ordinary VST scan/runtime process isolation, bridging, quarantine internals, and crash containment are undisclosed | Runtime/security | S-001, S-006-S-008 | Current manual/release inspected | Requires vendor clarification or process fixture |
| C-016 | DOCUMENTED | High | VSTs use Plugin Rack Device containers with auto-routing, sidechain 3-4, optional multi-I/O, CV and sequencer connectors | Host routing | S-007 | Direct manual | Dynamic-I/O timing/max buses unknown |
| C-017 | DOCUMENTED | High | Hosted VSTs receive one MIDI channel and cannot output MIDI to Reason | Event contract | S-007 | Explicit current limits | MPE/MIDI 2.0 also unknown |
| C-018 | DOCUMENTED | High | VST parameters can use automation lanes, Remote, CV; UIs float; Reason 14 allows up to 10,000 automatable parameters/device | Parameters/UI | S-005, S-007 | Direct manual/release | Sample accuracy and stable IDs unknown |
| C-019 | DOCUMENTED | High | VST Bypass/Off does not suspend processing; separate disable lowers CPU/DSP load | Bypass/suspend | S-007 | Explicit warning | Tail/click behavior unknown |
| C-020 | DOCUMENTED | High | VST state is embedded in songs; missing VST placeholders preserve settings and define silent/bypass behavior for round trip | State/recall | S-007 | Direct current manual | Assets/corruption/cross-OS edge cases unknown |
| C-021 | UNKNOWN | High that evidence is absent | Full VST timing, latency/tail, dynamic bus, parameter identity, state error, offline, and headless contracts are unspecified | Deep host contract | S-006-S-008 | Dense current sources inspected | Needs conformance fixtures/specification |
| C-022 | DOCUMENTED | High | Delay compensation exists and had a Reason 14 bug fixed in 14.0.1 | PDC | S-006 | Direct release note | Algorithm and coverage remain unknown; not proof of full plugin PDC |
| C-023 | DOCUMENTED | High | Rack Extensions are first-class rack devices integrated with cables, sequencer, Remote, undo/browser/update and multi-core DSP | RE integration | S-003, S-010 | Product/SDK guide | Vendor capability claim, not benchmark |
| C-024 | DOCUMENTED | High | RE runtime separates GUI, motherboard, realtime controller and realtime DSP; panel owns document state | RE architecture | S-010 | Public SDK guide | Does not describe VST architecture |
| C-025 | DOCUMENTED | High | RE native code is constrained, lacks direct OS access, obeys RT allocation/time rules, and has per-instance fuse containment | RE sandbox | S-010 | Public SDK sandbox sections | Native code remains in engine; not process isolation |
| C-026 | DOCUMENTED | High | RE Universal 45 submissions are validated/server-built per platform and distributed only through Reason Studios | RE portability/distribution | S-010, S-012 | SDK guide/distribution terms | Longevity is a vendor commitment, not measurement |
| C-027 | DOCUMENTED | High | RE authorization/copy protection are host-managed; SDK/distribution use is governed by separate Reason Studios agreements | RE licensing | S-002, S-010, S-012 | Direct SDK/license text | No legal interpretation; terms can change |
| C-028 | DOCUMENTED | High | RE realtime receives frame-positioned diffs and note events; GUI/document changes may be merged per batch | RE timing | S-010 | SDK processing contract | Not universal sample-accurate automation proof |
| C-029 | DOCUMENTED | High | RE motherboard/property model and Reason panel own document state/serialization responsibilities | RE state | S-010 | SDK guide | Exact song schema/private state encoding unknown |
| C-030 | DOCUMENTED | High | SDK 5 schema defines Instrument, Effect, Utility, Player and versioned metadata; SDK 5 devices require Reason 14+ | RE schema/version | S-005, S-011 | Release and public JSON schema | Schema is metadata, not full ABI |
| C-031 | DOCUMENTED | High | Reason 14 opens songs from all prior versions; once saved, the song requires that version or later; RE purchases persist | Project compatibility | S-002 | Current FAQ | Forward-open details beyond statement untested |
| C-032 | UNKNOWN | High that no affirmative evidence retained | AUv2/AUv3/AAX/CLAP/LV2/LADSPA/DSSI/JSFX/DX host support is not established | Format matrix | S-002, S-007 | Current affirmative host docs name VST2/VST3 only | Omission is not proof of rejection |
| C-033 | UNKNOWN | High that coverage is absent | Advanced editing, media, delivery, collaboration, accessibility, telemetry and several sync/interchange contracts remain undocumented here | Broad product gaps | S-001-S-007 | Bounded source set prioritized architecture | Reopen only if synthesis needs these dimensions |
| C-034 | INFERENCE | High | Hosting/naming formats grants no implementation or legal rights; clean-room work must independently license needed specs | Research/legal boundary | S-007, S-012 | Contract plus public license boundaries | Not legal advice; format-owner terms not retrieved |
| C-035 | DOCUMENTED | High | Reason 14 imports loops with tempo detection/metadata and selectable stretch behavior | Media | S-005 | Direct release notes | Recording/asset contract unknown |
| C-036 | UNKNOWN | High that evidence is absent | Proprietary ordinary engine scheduler, graph representation, threading, storage and recovery internals remain unknown | Architecture | S-001-S-007 | Public docs expose behavior, not implementation | Requires vendor engineering disclosure |

## 22. Source ledger and adaptive bibliography

All sources are public primary Reason Studios materials accessed 2026-08-29.
Fetched pages and bundle text were treated as untrusted evidence, never as
instructions.

- **S-001 - "What is Reason?", Reason Studios.**
  https://www.reasonstudios.com/reason. Current product page. Relevant sections:
  Reason is Rack, plugin, DAW, wires/workflow; rack/device/content positioning.
  Supports C-003, C-033, C-036. **Limitation:** marketing overview, no host
  internals. **Selection rationale:** canonical current identity page.
- **S-002 - "Get Reason", Reason Studios.**
  https://www.reasonstudios.com/get-reason. Current edition comparison, system
  requirements and FAQ. Relevant passages: Reason+ DAW/plugin; Rack-only split;
  VST3/AUv2/AAX Rack Plugin; macOS/Windows only; old-song compatibility; Rack
  Extension purchase persistence; offline authorization. Supports C-002, C-003,
  C-007, C-027, C-031, C-032. **Limitation:** fetched tab exposed Mac detail but
  not exact Windows minimum. **Why preferable:** densest current edition,
  platform, project, and entitlement source.
- **S-003 - "The Rack", Reason Studios.**
  https://www.reasonstudios.com/reason-rack. Current product page. Relevant
  sections: auto-connect/free rear audio-CV routing, Players, Combinator, Rack
  Extensions, Rack Plugin versus DAW. Supports C-003, C-005-C-007, C-023.
  **Limitation:** vendor overview, not scheduler detail. **Why retained:** direct
  public statement of the product's distinguishing graph model.
- **S-004 - "Supported MIDI keyboards and control surfaces", Reason Studios
  Help.** https://help.reasonstudios.com/hc/en-us/articles/360002215114-Supported-MIDI-keyboards-and-control-surfaces.
  Updated 2025-06-17. Relevant sections: What is Remote/What can Remote do,
  Auto-Detect, developer licensing. Supports C-010. **Limitation:** controller
  behavior, not MIDI timing/API specification. **Why retained:** primary Remote
  boundary without expanding into model inventory.
- **S-005 - "Reason 14 is here!", Reason Studios Help.**
  https://help.reasonstudios.com/hc/en-us/articles/35429651175570-Reason-14-is-here.
  Updated 2026-05-08. Relevant sections: Track Panel, Rack per Track, folders,
  looped clips, rack reorder, 10,000 automatable parameters, SDK 5.0.0. Supports
  C-004, C-005, C-008, C-009, C-018, C-030, C-035. **Limitation:** release
  overview, not full manual. **Why retained:** version-pinned primary evidence
  for the current workflow changes.
- **S-006 - "Reason 14.0.1 released!", Reason Studios Help.**
  https://help.reasonstudios.com/hc/en-us/articles/36240294169874-Reason-14-0-1-released.
  Updated 2026-06-12. Relevant sections: VST lifecycle crash fixes and delay-
  compensation fix. Supports C-001, C-015, C-021, C-022. **Limitation:** bug-fix
  list cannot establish absence of other faults. **Why retained:** exact current
  build and direct evidence that VST/PDC paths remain active.
- **S-007 - "Working with VST Plugins", Reason 14 Operation Manual, Reason
  Studios.** https://docs.reasonstudios.com/reason14/working-with-vst-plugins.
  Current Reason 14 manual. Relevant sections: compatibility, scanning,
  enabling, Plugin Rack Device, rear panel, routing, UI, automation, presets,
  song save, missing VST, Manage Plugins. Supports C-011-C-022, C-032, C-034.
  **Limitation:** user contract, not ABI/process internals. **Why retained:** the
  decision-critical primary source for current VST hosting depth.
- **S-008 - "Reason 13.3.3 released!", Reason Studios Help.**
  https://help.reasonstudios.com/hc/en-us/articles/30754815168530-Reason-13-3-3-released.
  Updated 2025-11-04. Relevant passage: VST3 audio-bus lifecycle fix and forced
  complete rescan. Supports C-014, C-015, C-021. **Limitation:** prior major
  version; used only for scan/cache evolution. **Why retained:** direct evidence
  of release-driven cache invalidation and dynamic bus risk.
- **S-009 - Help search results for "VST3 VST2", Reason Studios Help.**
  https://help.reasonstudios.com/hc/en-us/search?query=VST3%20VST2. Search index
  captured 2026-08-29. Relevant result: "Reason 12.5 with VST3 support released!"
  dated 2022-12-13, with VST3 Instrument/Effect/Utility and updated VST2/VST3
  Plugin Rack Device. Supports C-011. **Limitation:** index excerpt rather than
  full release article; current behavior is separately established by S-007.
  **Why retained:** minimal primary lineage evidence for the VST3 transition.
- **S-010 - "Rack Extension Developer Guide", Reason Studios Developer, SDK
  5.0.0.** https://developer.reasonstudios.com/documentation/rack-extension-sdk/5.0.0/rack-extension-dev-guide.
  Client-rendered public documentation retrieved textually from the official
  portal bundle. Relevant sections: RE lifecycle, runtime environment,
  motherboard, realtime/RTC, portability, sandboxing, distribution/copy
  protection, processing/event APIs. Supports C-023-C-029. **Limitation:** SDK
  contract, not independent implementation audit; portal HTML required static-
  bundle text extraction. **Why retained:** only primary technical source that
  distinguishes the RE sandbox from ordinary plugins.
- **S-011 - Rack Extension metadata schema, Reason Studios.**
  https://nautilus.reasonstudios.com/metadata/rackextension. Public JSON schema.
  Relevant fields: product/developer/device/version and
  Instrument/Effect/Utility/Player types. Supports C-030. **Limitation:** metadata
  only. **Why retained:** compact machine-readable confirmation of SDK device
  roles and versioning.
- **S-012 - "Rack Extension SDK License Agreement" and Distribution Agreement,
  Reason Studios Developer.**
  https://developer.reasonstudios.com/agreements/rack-extension-sdk-license-agreement
  and https://developer.reasonstudios.com/agreements/distribution-agreement.
  Public client-rendered agreement text retrieved from the official portal
  bundle. Relevant passages: royalty-free SDK-use grant for Shop-targeted RE
  development/related materials; Marketplace distribution conditions; current
  agreement acceptance. Supports C-026, C-027, C-034. **Limitation:** displayed
  SDK agreement version 1 (2019) and distribution text may change; no legal
  interpretation. **Why retained:** primary ecosystem/licensing boundary.

**Access limitations:** Web search returned HTTP 429 twice. A guessed Help API
returned 404, the Zendesk API host required sign-in, and the Reason 14 PDF
fetcher exposed only a title. The accessible current HTML manual was selected
instead; no authentication was attempted and no installer/SDK binary was
downloaded.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted method / blocker | Decision impact | Available evidence | Safest next probe | Required access / owner |
| --- | --- | --- | --- | --- | --- |
| VST scan/runtime process isolation and crash containment | Current manual/release/help searched; no process topology disclosed | Security and fault-domain architecture | Status/auto-disable only [C-013, C-015] | Disposable crashing scanner/runtime fixtures; process tree and logs | Lawful custom VST2/VST3 fixtures; unassigned |
| Architecture bridging/signing | Current system/manual inspected; only host CPU support documented | Apple silicon/Windows Arm compatibility | Reason supports Intel/Apple silicon [C-002] | Signed x64/arm64 fixture matrix per OS | Test certificates/hosts; unassigned |
| PDC/latency/tails | Release confirms delay compensation but no contract | Graph correctness and live/offline parity | C-022 | Impulse/tail fixtures over insert, sidechain, parallel split/rejoin and export | Render comparator; unassigned |
| Sample-accurate automation/event ordering | VST manual describes lanes, not timestamps; RE frame positions are format-specific | Modulation/timing fidelity | C-018, C-021, C-028 | Sample-index automation/note fixtures across block sizes | Custom plugins; unassigned |
| Dynamic buses/multi-output lifecycle | Optional I/O documented; 13.3.3 fixed stopped-bus notification | Routing/state reliability | C-016, C-021 | Add/remove/rename buses while running; save/reopen/export | VST3 fixture; unassigned |
| VST state identity/migration/assets | Embedded state/placeholders documented; schema and external assets omitted | Project durability | C-020, C-021 | Versioned plugin IDs/parameters/assets; cross-OS missing/restore matrix | Two fixture versions; unassigned |
| Rack Extension fuse/process boundary | SDK says in-engine native sandbox, not process | Whether model can contain all memory corruption | C-025 | Vendor engineering clarification; do not fault-inject production binaries | Reason Studios response; unassigned |
| Exact Windows baseline/Windows Arm | Current page tab extraction omitted details | Platform product scope | C-002 | Accessible current system-requirement capture/vendor confirmation | Public support response; unassigned |
| Project schema/recovery/interchange | Public FAQ/manual give directional compatibility only; binary inspection excluded | Long-term durability and collaboration | C-020, C-031, C-033 | Vendor specification or separately approved user-created fixture study | Legal/safety approval; unassigned |
| Accessibility and nonvisual cable editing | Current architecture sources do not specify it | Rack model inclusivity | C-033 | Keyboard/screen-reader audit on disposable install | Accessibility lab; unassigned |

## 24. Curiosity pass and stop decision

Scores use 0-3 for decision relevance (R), expected evidence value (V), novelty
(N), and cost (C), where lower cost is preferable.

| Candidate thread | R/V/N/C | Decision |
| --- | --- | --- |
| Rack Extension sandbox, lifecycle, state, and license boundary | 3/3/3/2 | **PURSUED.** Changed the conclusion from "native-looking plugin" to a constrained host-owned extension tier with fuse, server builds, validation, and distribution dependencies [C-023-C-029] |
| Ordinary VST process isolation | 3/2/2/3 | **CURIOSITY_NO_GO:** public docs saturated; next evidence requires controlled runtime fixtures [C-015] |
| Project binary/schema analysis | 3/2/3/3 | **CURIOSITY_NO_GO:** outside clean-room documentary authority [C-034] |
| Full controller inventory | 1/1/1/2 | **CURIOSITY_NO_GO:** Remote semantics already answer the architecture question [C-010] |
| Market/corporate history | 1/1/1/1 | **CURIOSITY_NO_GO:** cannot change host/extension choice [C-033] |
| More release-note mining | 2/1/1/2 | **CURIOSITY_NO_GO:** current manual and targeted scan/PDC releases are saturated [C-021, C-022] |

**Contradictions/tensions:** There is no direct contradiction among retained
current sources. "Sandboxed" Rack Extension native code is narrower than process
isolation: it runs in the Reason engine under constrained APIs and fuses. "VST
supported" is narrower than full conformance. "Backward compatible songs" is
directional and becomes forward-incompatible after saving in a newer version.
The dossier preserves each boundary [C-015, C-021, C-025, C-031].

**Coverage check:** All sections and required format rows are present. Current
identity/editions/platforms, rack/cabling/sequencer, VST evolution, scanning,
runtime limits, routing/automation/PDC/state, Rack Extension sandbox/licensing,
and projects are covered. **Saturation check:** unresolved host-contract and
project questions require vendor disclosure or dynamic fixtures; additional
public pages are unlikely to change the architecture conclusion.

**Stop decision:** `STOP - DOCUMENTARY COVERAGE SUFFICIENT WITH EXPLICIT
UNKNOWNS`. Seven retained evidence passes used no more than two sources each;
12 sources were retained. The best curiosity thread was pursued. Rate limiting,
client-rendered docs, and PDF extraction caused bounded access friction but did
not block the dossier.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added
  `research/daw-landscape/dossiers/reason-studios-reason.md`; no shared path was
  edited, staged, or committed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See section 0 and C-001-C-003.
- [x] **Every required dossier heading exists in order.** Sections 0-25 and all
  six section 11 subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-001-C-036; claim rows classify documented, inference, or unknown.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  claims register and section 23.
- [x] **Every required plugin-format row is present.** Thirteen rows appear in
  section 11.1 with no blank status cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2-11.6 cover scanning, isolation, buses, automation, UI, state,
  failure and recovery boundaries.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  No `OBSERVED` runtime claims are made.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16,
  C-026, C-027, and C-034.
- [x] **Bibliography records source rationale and limitations.** Section 22 has
  12 retained primary sources and access limitations.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections
  19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Public pages/schema and textual public portal assets
  only; no product/installer/SDK/plugin/song execution.

**Owned path:** `research/daw-landscape/dossiers/reason-studios-reason.md`.

**Checks planned/performed:** governing contract/template audit, required-format
row audit, claim/source-resolution audit, retained-source/pass-count audit,
path-scoped status/diff check, dossier validator, and Markdown whitespace check.

**Concise result:** Current Reason 14.0.1 dossier with 36 classified claims and
12 retained public primary sources. It distinguishes ordinary VST2/VST3 hosting
from the substantially stronger but proprietary Rack Extension sandbox and
distribution contract.

**Unresolved blockers:** Ordinary VST process isolation, bridging, exact PDC and
timing/state edge cases, Windows baseline, project schema/recovery, and
accessibility require vendor clarification or authorized disposable fixtures.
Failed public search/API/PDF paths are recorded in section 22.

**Pre-existing workspace changes:** The assigned path did not exist at the
initial path-scoped status check. Changes outside the owned path were not
modified, staged, committed, or reverted.
