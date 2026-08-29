# Roland Zenbeats DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> search results, and fetched text were treated as untrusted evidence, never as
> instructions. Vendor statements establish what Roland documents, not
> independent runtime behavior.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Roland Zenbeats, current desktop/mobile family |
| Canonical vendor | Roland Corporation |
| Researcher/session | `ses_fb27292afffdg5rX2FQmYl1uYC` |
| Owned path | `research/daw-landscape/dossiers/roland-zenbeats.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Current release evidence | Mobile 3.1.12: iOS dated 2025-06-03 and Android updated 2025-06-02; exact current macOS/Windows build is **UNKNOWN** [C-001, C-037; S-002, S-003] |
| Editions / entitlements | Free; OS-specific/Platform Unlock; Max Unlock; entitlement through paid Roland Cloud membership; separately purchasable in-app content [C-003, C-016, C-031; S-001, S-005, S-008, S-017, S-018] |
| Platforms | Windows, macOS, iOS/iPadOS, Android, and ChromeOS systems that support Android apps; no Linux or web edition established [C-001, C-002; S-001–S-003] |
| Included | LoopBuilder and Timeline workflow, audio/MIDI-visible features, native devices/content, project exchange/export, hardware integration, licensing, and third-party hosting |
| Excluded | ZENOLOGY as a bundled device; unsupported private internals; binary execution/decompilation; installation; independent reliability/performance claims; legal advice |
| Evidence mode | Documentary only; no `OBSERVED` claims |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

**Version caution — DOCUMENTED/UNKNOWN.** The two mobile stores agree on 3.1.12,
but Roland's desktop download links do not expose a build number in the retained
text. “Current Zenbeats” below therefore means the product documentation and
3.1.x mobile family at the cutoff, not a claim that every desktop binary shares
the mobile number [C-001, C-037].

## 1. Executive summary

- **DOCUMENTED.** Zenbeats is a maintained cross-platform music-creation app
  combining clip launching in LoopBuilder with audio/MIDI multitrack work in a
  linear Timeline. A LoopBuilder performance can be recorded into Timeline, so
  the two views form one composition path rather than unrelated modes [C-001,
  C-004; S-001–S-003, S-022].
- **DOCUMENTED.** Unlocked specifications name unlimited audio, instrument,
  drum, send, and group tracks, track effect slots/sends, freeze, a mixer,
  automation view, mix/stem rendering, and Ableton Link [C-004, C-006, C-011,
  C-029; S-001, S-013].
- **DOCUMENTED/UNKNOWN.** External hosting is entitlement-gated: Windows gets
  generic VST, macOS generic VST and Audio Unit, iOS AUv3, and Android none.
  Roland does not identify VST2 versus VST3 or the macOS AU generation, and it
  warns that not every third-party plug-in is guaranteed to work [C-015,
  C-016, C-019; S-004, S-005].
- **DOCUMENTED.** Users configure up to four plug-in directories, run `Scan
  New`/`Rescan All`, and can individually rescan quarantined plug-ins. Roland
  says quarantine can follow an invalid integrity check or failed communication
  with the plug-in [C-017, C-018; S-004, S-006, S-007].
- **UNKNOWN.** Public evidence does not establish scan-process or runtime
  isolation, sandboxing, crash containment, architecture bridging, Apple-silicon
  behavior, sidechain/multi-output buses, PDC, latency/tails, sample-accurate
  automation, plug-in state/preset recall, missing-plug-in handling, or UI
  embedding/scaling [C-020–C-022].
- **DOCUMENTED.** Project interchange is asynchronous: same-Wi-Fi account-bound
  transfer, ZIP import/export, OS file browsers, desktop destinations, and mobile
  share sheets. Direct Google Drive integration was removed in 3.1.8 in favor
  of provider-neutral OS surfaces; no retained evidence establishes synchronous
  co-editing [C-025–C-028; S-009–S-012].
- **DOCUMENTED.** ZC1 is a bundled ZEN-Core-based synth, while ZENOLOGY is a
  separate product. Tone portability is bounded: Model Expansion-created tones
  are rejected or omitted by the ZENOLOGY export path for hardware/Zenbeats ZC1
  [C-023, C-024; S-001, S-015, S-016].
- **Confidence.** High for mobile release metadata, user-visible workflow,
  entitlement/platform mapping, scanner/quarantine controls, native-device and
  exchange boundaries; low for proprietary engine and full host-contract
  fidelity. Historical Stagelight provenance could not be re-established from a
  retained authoritative source and remains unknown [C-034, C-035].

## 2. Product identity, history, and market position

**DOCUMENTED.** Roland positions Zenbeats as a mobile-friendly music-creation
app for beat building, multitrack composition, sampling, recording, and mixing
across phone, tablet, and computer. The current product page links Windows,
macOS, iOS, and Android downloads; the specification also covers ChromeOS
systems that support Android apps [C-001, C-002; S-001]. Apple and Google list
the maintained mobile product as version 3.1.12 [C-001; S-002, S-003].

**DOCUMENTED.** Commercial identity is capability- and content-tiered rather
than a single desktop edition: Free, per-OS/Platform Unlock, Max Unlock, and
Roland Cloud membership coexist with in-app content purchases [C-003, C-031;
S-001, S-008, S-017, S-018]. Historical V3 prices are not presented as current.

**UNKNOWN — provenance.** The research checkpoint suggested a lineage from Open
Labs Stagelight, but bounded searches of Roland support/site search, ordinary web
search, and exact acquisition terms failed to recover a primary or reputable
secondary source suitable for retention. An Android user review was explicitly
rejected as proof. The acquisition date, transferred code/assets, and project or
license continuity are therefore not asserted [C-035].

## 3. Workflow and conceptual model

**DOCUMENTED.** LoopBuilder captures and launches loops/song parts; Timeline is
the traditional linear arrangement and automation view. `Record to Timeline`
records a LoopBuilder performance as a linear multitrack song [C-004; S-001,
S-022]. The unlocked track taxonomy is audio, instrument, drum, send, and group
tracks [C-004; S-001].

**INFERENCE.** Zenbeats uses a dual-representation composition model: reusable
clip/pattern material is performed in a launcher, then committed or developed in
a track timeline. A plausible alternative is that LoopBuilder is merely another
editor for the same objects; public documentation does not expose object
identity or override rules. The explicit record-to-Timeline operation supports
the two-stage interpretation [C-004].

**DOCUMENTED.** Patterns may each carry their own time signature; changing the
global signature does not retroactively change existing patterns. The retained
KB says positional tempo information cannot be inserted [C-008; S-023].

## 4. Publicly documented architecture

**DOCUMENTED (user-visible only).** Public material exposes LoopBuilder,
Timeline/Automation, Mixer, MIDI and Audio editors, typed tracks, instrument and
effect slots, send/group tracks, content browsers, native devices, plug-in scan
directories, quarantine, songs/mixes/stems/templates, and file/share exchange
surfaces [C-004, C-005, C-011, C-017, C-026].

**UNKNOWN.** Roland does not disclose in retained sources the process topology,
audio graph representation, real-time thread/scheduler model, multicore worker
policy, service boundaries, storage schema, undo architecture, or plug-in ABI
wrappers. No architecture is inferred from UI names [C-034].

## 5. Audio engine

**DOCUMENTED.** The specification names track freeze and identifies “élastique
efficient V3 by zplane.development” as the time-stretch engine. Zenbeats renders
a stereo mix or track-by-track stems [C-006, C-029; S-001, S-013]. External
audio interfaces supported by the OS may be used, but Roland does not guarantee
every device [C-009; S-020].

**UNKNOWN.** Public evidence does not establish supported project sample rates,
recording/render bit depth, internal precision, block-size behavior, real-time
versus offline renderer equivalence, multicore scheduling, plug-in delay
compensation, latency/tail handling, oversampling, dropout recovery, freeze
semantics, or detailed engine diagnostics [C-007]. The presence of freeze and
render commands is not evidence for those contracts.

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED.** Unlocked Zenbeats names unlimited audio, instrument, drum, send,
and group tracks. Main views include LoopBuilder, Timeline/Automation, MIDI
Editor, Audio Editor, Drum Editor, Mixer, and on-screen instruments [C-004;
S-001]. ZR1 provides one-shot slicing/cropping/fades and a step sequencer with
accents and per-step automation [C-005; S-001].

**DOCUMENTED.** Current 3.1.12 notes describe continuous recording from one
LoopBuilder cell to the next and a fix for reverse processing that had added
space to clips [C-001, C-004; S-002, S-003]. Pattern-level mixed meters are
supported, while positional tempo events are not documented as available
[C-008].

**UNKNOWN.** Conventional take lanes, comping, ripple/slip modes, clip grouping,
nondestructive-edit guarantees, version/history persistence, navigation limits,
warp markers, and exact LoopBuilder/Timeline object identity remain unspecified
[C-014, C-034].

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED.** Zenbeats provides a MIDI editor, drum step sequencing, per-step
automation, external MIDI input/output, Bluetooth MIDI pairing on all four named
OS families, and Ableton Link. Supported Roland integrations include VERSELAB
and WM-1-linked hardware [C-005, C-009; S-001, S-021].

**DOCUMENTED.** Zenbeats may use any MIDI device supported by the OS, subject to
Roland's no-guarantee caveat. Bluetooth MIDI is distinct from wireless audio,
which Roland says is unsupported [C-009; S-020, S-021].

**UNKNOWN.** MIDI-file import/export, plug-in MIDI output, multiple event buses,
MPE/per-note expression, MIDI 2.0/UMP, SysEx, score notation, MTC, MIDI clock,
sample-accurate event timing, and controller-script APIs are not established in
the retained evidence [C-010]. Ableton Link and Bluetooth MIDI do not prove any
of these contracts.

## 8. Routing, mixer, automation, and control

**DOCUMENTED.** The unlocked track list includes send and group tracks; the
feature list names track sends, track effect slots, a full-screen mixer, volume,
filter, pan, EQ, and Timeline automation. Three built-in effects are branded as
sidechain processors [C-005, C-011; S-001].

**DOCUMENTED.** VERSELAB editing and WM-1/Bluetooth MIDI provide named hardware
integration, but are not evidence of a general public control-surface SDK
[C-009, C-030; S-001, S-021].

**UNKNOWN.** Arbitrary auxiliary/sidechain buses, feedback rules, VCA semantics,
multichannel/surround layouts, automation interpolation and sample accuracy,
stable parameter identity, touch/latch/write modes, OSC, remote APIs, and
third-party controller scripting are unspecified [C-012, C-030]. Native
sidechain-branded effects do not establish sidechain input buses for hosted
plug-ins.

## 9. Recording, comping, and media handling

**DOCUMENTED.** Zenbeats records audio tracks, samples into ZR1, imports personal
sounds into Drum and Loop Browser user collections, and records LoopBuilder
performances to Timeline [C-004, C-013; S-001, S-014, S-022]. OS-supported audio
interfaces may be used; wireless audio devices are excluded [C-009; S-020].

**DOCUMENTED.** Song rendering creates a stereo mix or per-track stems, and
3.1.8 content exchange uses ZIP files, native file browsers, desktop
destinations, and mobile share sheets [C-026, C-029; S-009, S-010, S-013].

**UNKNOWN.** Input monitoring, punch/loop take management, take lanes/comping,
complete audio import/export codecs, recording precision, conform/proxy/video
workflows, metadata, destructive-edit boundaries, asset collection, and missing
media relinking are not documented in retained sources [C-014, C-028].

## 10. Instruments, effects, content, and native devices

**DOCUMENTED.** Native devices include ZR1 Drum Sampler, ZC1 ZEN-Core
Synthesizer, SampleVerse sampler/modular synthesizer, and the Electro-Series.
The current specification lists 7 free effects plus 15 additional unlocked
effects (22 total), while unlocks expand presets, loops, instruments, effects,
and editing/import capabilities [C-005, C-023; S-001].

**CONTRADICTION.** Both mobile-store descriptions say 17 native effects, whereas
the current Roland product page says/breaks down 22. The enumerated current
Roland specification is preferred for inventory, but the discrepancy is not
silently normalized [C-038; S-001–S-003].

**DOCUMENTED.** ZC1 is based on ZEN-Core and can exchange supported tones with
ZENOLOGY and compatible hardware; ZENOLOGY itself is not bundled. Model
Expansion-created tones are not carried by the documented ZENOLOGY
hardware/Zenbeats-ZC1 export path [C-023, C-024; S-001, S-015, S-016].

**UNKNOWN.** No public native-device authoring SDK, modular device ABI, general
modulation graph, macro system contract, or stable third-party product-native
format was identified [C-030].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE:no edition` means no in-scope Linux or web product was
established. It is not a technical impossibility claim. “Not named” remains
`UNKNOWN`; absence from the official format table is not converted into a
runtime rejection [C-015, C-019]. ChromeOS follows the documented Android-app
edition boundary [C-002].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **UNKNOWN:** vendor says generic VST | **UNKNOWN:** vendor says generic VST | **NOT_APPLICABLE:no Linux edition** | **UNKNOWN (iOS):** not named; **DOCUMENTED (Android):** no external plug-ins; **NOT_APPLICABLE:web** | Current product page; unlock/compatibility KB; exact generation absent | Generic VST hosting is documented on desktop, but VST2 identity is not | C-015, C-016, C-019; S-001, S-004, S-005 |
| VST3 | **UNKNOWN:** vendor says generic VST | **UNKNOWN:** vendor says generic VST | **NOT_APPLICABLE:no Linux edition** | **UNKNOWN (iOS):** not named; **DOCUMENTED (Android):** no external plug-ins; **NOT_APPLICABLE:web** | Same | Do not infer VST3 from generic “VST” | C-015, C-019; S-004, S-005 |
| AUv2 | **UNKNOWN:** vendor says generic Audio Unit | **NOT_APPLICABLE:vendor maps AU to macOS** | **NOT_APPLICABLE:no Linux edition** | **UNKNOWN (iOS):** explicit AUv3 does not prove AUv2; **DOCUMENTED (Android):** no external plug-ins; **NOT_APPLICABLE:web** | Current product page/compatibility KB | macOS AU generation unresolved | C-015, C-019; S-001, S-004, S-005 |
| AUv3 | **UNKNOWN:** generic macOS AU wording | **NOT_APPLICABLE:vendor maps AU to macOS/iOS** | **NOT_APPLICABLE:no Linux edition** | **DOCUMENTED (iOS): AUv3**; **DOCUMENTED (Android):** no external plug-ins; **NOT_APPLICABLE:web** | Current product page and unlocked compatibility table; mobile 3.1.12 | Only explicitly versioned external format is iOS AUv3 | C-001, C-015, C-016; S-001–S-005 |
| AAX | **UNKNOWN:not named** | **UNKNOWN:not named** | **NOT_APPLICABLE:no Linux edition** | **UNKNOWN (iOS):not named**; **DOCUMENTED (Android):no external plug-ins**; **NOT_APPLICABLE:web** | Official table names only VST/AU/AUv3 | No AAX host-support claim or test | C-015, C-019; S-004, S-005 |
| CLAP | **UNKNOWN:not named** | **UNKNOWN:not named** | **NOT_APPLICABLE:no Linux edition** | **UNKNOWN (iOS):not named**; **DOCUMENTED (Android):no external plug-ins**; **NOT_APPLICABLE:web** | Same | No CLAP host-support claim or test | C-015, C-019; S-004, S-005 |
| LV2 | **UNKNOWN:not named** | **UNKNOWN:not named** | **NOT_APPLICABLE:no Linux edition** | **UNKNOWN (iOS):not named**; **DOCUMENTED (Android):no external plug-ins**; **NOT_APPLICABLE:web** | Same | No LV2 host-support claim or test | C-015, C-019; S-004, S-005 |
| LADSPA | **UNKNOWN:not named** | **UNKNOWN:not named** | **NOT_APPLICABLE:no Linux edition** | **UNKNOWN (iOS):not named**; **DOCUMENTED (Android):no external plug-ins**; **NOT_APPLICABLE:web** | Same | No LADSPA host-support claim or test | C-015, C-019; S-004, S-005 |
| DSSI | **UNKNOWN:not named** | **UNKNOWN:not named** | **NOT_APPLICABLE:no Linux edition** | **UNKNOWN (iOS):not named**; **DOCUMENTED (Android):no external plug-ins**; **NOT_APPLICABLE:web** | Same | No DSSI host-support claim or test | C-015, C-019; S-004, S-005 |
| JSFX | **UNKNOWN:not named** | **UNKNOWN:not named** | **NOT_APPLICABLE:no Linux edition** | **UNKNOWN (iOS):not named**; **DOCUMENTED (Android):no external plug-ins**; **NOT_APPLICABLE:web** | Same | No JSFX host-support claim or test | C-015, C-019; S-004, S-005 |
| DirectX/DXi | **NOT_APPLICABLE:vendor maps desktop formats to VST/AU, but no Mac DX claim** | **UNKNOWN:not named** | **NOT_APPLICABLE:no Linux edition** | **UNKNOWN (iOS):not named**; **DOCUMENTED (Android):no external plug-ins**; **NOT_APPLICABLE:web** | Same | No Windows DirectX/DXi host-support claim or test | C-015, C-019; S-004, S-005 |
| Rack Extension | **UNKNOWN:not named** | **UNKNOWN:not named** | **NOT_APPLICABLE:no Linux edition** | **UNKNOWN (iOS):not named**; **DOCUMENTED (Android):no external plug-ins**; **NOT_APPLICABLE:web** | Same | No Rack Extension host-support claim or test | C-015, C-019; S-004, S-005 |
| Product-native/other | **DOCUMENTED:** built-in Zenbeats devices/effects | **DOCUMENTED:** built-in Zenbeats devices/effects | **NOT_APPLICABLE:no Linux edition** | **DOCUMENTED:** built-ins on iOS/Android; **NOT_APPLICABLE:web** | Current product specification/mobile 3.1.12 | ZR1, ZC1, SampleVerse, Electro-Series, native FX/content; no public authoring SDK | C-005, C-023, C-030; S-001–S-003 |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED.** In Menu → Settings → Plugins, users configure four plug-in
directory slots. Roland gives common Windows VST paths and instructs `Rescan
All`; the compatibility page also names `Scan New` in Instrument/Plug-in
Browsers [C-017; S-004, S-006].

**DOCUMENTED.** Plug-ins can be quarantined after an invalid integrity check or
failed communication. Right-click/click-hold permits an individual rescan;
continued failures are directed to support [C-018; S-007].

**UNKNOWN.** Scanner process isolation, validation stages, cache format and
invalidation, duplicate identity/version rules, timeouts, blacklist versus
quarantine persistence, signature checks, bulk recovery, and diagnostic-log
locations are not public [C-020]. “Integrity check” is not expanded into a
cryptographic or sandbox architecture.

### 11.3 Runtime isolation and compatibility

**DOCUMENTED.** Roland warns that unlock includes third-party plug-ins but does
not guarantee every VST/AU plug-in will work [C-015; S-004].

**UNKNOWN.** In-process versus separate-process execution, per-plugin/shared
sandboxing, crash containment, memory isolation, Apple-silicon/Rosetta behavior,
Intel/ARM bridging, 32/64-bit plug-in rules, code-signing/notarization
enforcement, and compatibility modes are undisclosed [C-020]. Quarantine during
scanning does not prove runtime isolation.

### 11.4 Host/plugin processing contract

**DOCUMENTED at role level only.** Roland says Zenbeats hosts external
instruments and FX plug-ins on unlocked supported platforms [C-015, C-016;
S-004–S-006].

**UNKNOWN.** Audio/MIDI/event bus counts, effect/instrument subtype mapping,
auxiliary/sidechain buses, multi-output instruments, plug-in MIDI output, MPE,
MIDI 2.0, sample-offset events, sample-accurate automation, latency/tail
reporting and PDC, bypass/suspend, faster-than-real-time calls, dynamic I/O, and
render determinism are not specified [C-021]. Native sends and native
sidechain-branded effects do not resolve the third-party contract.

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED at product level only.** Timeline/Automation mode and instrument/
effect hosting coexist, but no retained source describes third-party parameter
semantics [C-011, C-022; S-001, S-004].

**UNKNOWN.** Parameter IDs, ranges/text, gestures, automation precision,
host/factory presets, plug-in state chunks, external asset references, state
migration, cross-format substitution, project recall, missing-plugin
placeholders, and reinstall recovery are undocumented [C-022]. Project ZIP and
device transfer evidence does not establish plug-in-state fidelity.

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED.** User-visible failure handling includes quarantine, individual
rescan, `Scan New`, `Rescan All`, and escalation to Zenbeats support [C-017,
C-018].

**UNKNOWN.** Custom UI embedding versus detached windows, generic/headless
editors, resizing/HiDPI, focus and keyboard handling, accessibility propagation,
multi-editor behavior, bad-UI containment, runtime crash UX, error codes, and
missing-plugin visualization are not documented [C-020, C-022].

## 12. Extensibility and integration

**DOCUMENTED.** Public integration boundaries include VST/AU/AUv3 hosting by
platform, MIDI/audio devices supported by the OS, Bluetooth MIDI, Ableton Link,
VERSELAB, WM-1-linked Roland hardware, ZEN-Core tone exchange within stated
limits, native file browsers/share sheets, and cloud-provider locations exposed
by the OS [C-009, C-015, C-024, C-026].

**UNKNOWN.** No public scripting language, macro/action API, native-device SDK,
controller-script SDK, OSC/remote API, command-line API, or stable file/protocol
schema was found [C-030]. Format names and hardware integrations are not public
extension-authoring contracts.

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED.** Same-account devices on the same Wi-Fi network can use `Transfer
Song`. Since 3.1.8, content surfaces export songs, templates, mixes, and stems;
the native file browser imports ZIPs from supported local/cloud locations, and
exports can be sent to a desktop folder or mobile share-sheet destination
[C-025, C-026; S-009, S-010, S-012].

**DOCUMENTED limitation.** The 3.1.8 article says Android internal-storage ZIP
import was not yet implemented, while cloud-location import worked. This is
version-scoped and may have changed after 3.1.8 [C-026; S-009].

**DOCUMENTED.** Direct Google Drive integration was removed in 3.1.8 and
replaced by provider-neutral OS import/export/share mechanisms. Older product,
store, and transfer pages that still name direct Google Drive/OneDrive are
superseded for this point [C-027, C-038; S-001–S-003, S-011, S-012].

**UNKNOWN.** The project/archive schema, atomic save, autosave/crash recovery,
undo persistence, backward/forward migration, self-contained asset manifests,
plug-in state, missing dependencies, AAF/OMF/ADM/MIDI/MusicXML/DAWproject
exchange, synchronous collaboration, conflict resolution, merge, and version
control are not established [C-028]. File sharing is not co-editing evidence.

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED.** Delivery supports a stereo mix and per-track stems, followed by
desktop destination selection or mobile app/service sharing [C-026, C-029;
S-010, S-013]. LoopBuilder performance capture, Ableton Link, mobile/desktop
project movement, and hardware integrations support live/sketch-to-arrangement
workflows [C-004, C-009, C-025].

**UNKNOWN.** Render file codecs/precision, batch rendering beyond 3.1.8 content
selection, loudness targets, DDP, video/timecode/ADR, AAF/OMF, surround,
immersive/ADM, show control, and deterministic live-failure recovery are not
documented [C-007, C-028, C-029].

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED.** Roland specifies a dual-core CPU, 2 GB RAM (4 GB recommended),
2 GB storage, Windows 10/11, macOS 10.11+, iOS 11+, Android 8+, and compatible
ChromeOS Android systems. ZC1 requires a 64-bit processor/OS. Roland cautions
that meeting requirements or using an OS-supported plug-in/device does not
guarantee satisfactory operation [C-002, C-015; S-001, S-004, S-020].

**DOCUMENTED (vendor/store disclosures).** Roland requires an Internet
connection and account registration/login in its specification; a license may
authorize up to five devices. Apple says the developer has not declared
supported App Store accessibility features and lists identity-linked data
categories; Google says data is encrypted in transit and deletion can be
requested [C-031, C-033; S-001–S-003, S-019]. These are declarations, not audits.

**UNKNOWN.** Continuous/offline-use semantics, authorization refresh/grace,
scaling limits, resource meters, crash containment, rollback, update signing,
plug-in trust boundaries, telemetry verification, screen-reader/keyboard-only
coverage, UI scaling, and localization completeness are not established
[C-020, C-032, C-033].

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED.** Free is limited; Platform/OS unlocks enable features on their
covered platform, while Max covers all platforms and content. Paid Roland Cloud
membership supplies Max only while the subscription is active. One license may
authorize five devices. Additional content can be purchased in-app [C-003,
C-016, C-031; S-001, S-005, S-008, S-017–S-019].

**CONTRADICTION/UNKNOWN.** A 2021 article says Max's free store-content access
lasts until a new major version, whereas the current product page describes Max
as including all store packs without that qualifier. A 2023 V3 price table is
historical. Current exact pricing, future-major-version rights, paid-unlock
upgrade policy, and what happens to projects/features/content after membership
expiry are not reliably established [C-032, C-038; S-001, S-017, S-018].

**INFERENCE / clean-room constraint.** Zenbeats' documented ability to host VST
or Audio Units grants no SDK, trademark, redistribution, code-signing,
certification, or compatibility rights to another product. VST2, VST3, Audio
Units, Ableton Link, ZEN-Core, and branded hardware/content require independent
current owner-term review. No proprietary source, schema, UI assets, installer,
or binary was obtained or analyzed [C-036]. This is not legal advice.

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **DOCUMENTED/INFERENCE:** A launcher-to-timeline recording path connects
  improvisational clip work with linear arrangement [C-004].
- **DOCUMENTED:** One product identity spans desktop/mobile, OS-native exchange,
  native devices/content, hardware MIDI, Link, and ZEN-Core tone portability
  within explicit limits [C-001, C-009, C-023–C-027].
- **DOCUMENTED:** Scanner paths, explicit rescans, quarantine reasons, and
  individual recovery give more diagnosability than a format logo alone
  [C-017, C-018].
- **DOCUMENTED:** Stereo/stem rendering and provider-neutral sharing provide a
  pragmatic handoff boundary [C-026, C-029].

### Liabilities / risks

- **DOCUMENTED/UNKNOWN:** External hosting is paywalled and narrow by platform;
  exact VST/macOS AU generations and most host semantics are unpublished
  [C-015, C-016, C-019–C-022].
- **DOCUMENTED:** Android has no external plug-ins; historical 3.1.8 Android ZIP
  import also had an internal-storage limitation [C-015, C-026].
- **UNKNOWN:** Engine timing, state durability, failure isolation, PDC, bus
  fidelity, accessibility, and offline authorization require probes [C-007,
  C-020–C-022, C-032, C-033].
- **CONTRADICTION:** Mutable product/store/KB copy disagrees on effect count,
  direct cloud integration, and Max major-version terms [C-038].

The clean-room lesson is to copy neither implementation nor UI expression, but
to specify cross-device composition, plug-in qualification, and entitlement
state as explicit contracts rather than marketing-level capabilities [C-036].

## 18. Transferable patterns

| Pattern | Problem / minimal clean-room mechanism | Supporting claims | Prerequisites / tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- |
| Launcher performance → linear capture | Preserve improvisation while enabling detailed arrangement; record timestamped clip state into stable timeline objects | C-004 | Requires identity, overwrite, tempo/meter, latency, and undo rules; risk of duplicate state | **CANDIDATE** |
| Typed track surface | Keep audio, instruments, drums, sends, and groups understandable while sharing mixer conventions | C-004, C-011 | Needs explicit graph/bus/channel rules; typed UI must not conceal routing | **CANDIDATE** |
| Visible scan roots and recovery | Make discovery diagnosable with configured roots, incremental/full scans, quarantine reason, and per-item retry | C-017, C-018 | Must add isolated scanner, cache provenance, deterministic identity, logs, and retry limits | **CONDITIONAL** |
| Provider-neutral project exchange | Use OS file pickers/share sheets around a versioned archive rather than one cloud vendor API | C-026, C-027 | Requires durable schema, manifests, atomic import, provider testing, and conflict policy | **CANDIDATE** |
| Rendered fallback boundary | Export stereo and per-track stems when recipients lack devices/content/plugins | C-029 | Must define tails, PDC, precision, FX inclusion, naming, and licensing | **CANDIDATE** |
| Capability-subset ecosystem exchange | Label portable tone/device subtypes and reject unsupported expansions explicitly | C-023, C-024 | Requires typed capability manifests and actionable errors; partial export can surprise | **CONDITIONAL** |
| Entitlement as explicit project dependency | Record which editing/hosting/content capabilities a project needs, independently of account state | C-003, C-016, C-031, C-032 | Expiry/read-only/render policy must be designed; account coupling is a durability risk | **CONDITIONAL** |

These are behavioral abstractions only; no protected source, UI asset, project
schema, or branded expression is copied.

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** Treating generic “VST” as VST2 and/or VST3, or generic macOS
  “AU” as AUv2/AUv3 [C-019].
- **REJECTED:** Treating scan quarantine as proof of sandboxing, cryptographic
  verification, or runtime crash containment [C-018, C-020].
- **REJECTED:** Treating native sidechain-named effects as evidence of arbitrary
  third-party sidechain buses [C-011, C-021].
- **REJECTED:** Treating ZIP/share-sheet transfer as synchronous collaboration or
  complete asset/plugin portability [C-026, C-028].
- **REJECTED:** Treating ZEN-Core naming as universal tone compatibility; Model
  Expansion tones are a documented exception [C-024].
- **REJECTED:** Treating historical V3 prices or 2021 major-version wording as
  current commercial terms [C-032, C-038].
- **CURIOSITY_NO_GO:** Deep engine/thread/graph search — high relevance, low
  documentary yield, high cost; reopen for a public engineering source or
  authorized instrumentation [C-007, C-034].
- **CURIOSITY_NO_GO:** Community plug-in compatibility anecdotes — cannot prove
  current host semantics without controlled reproduction.
- **CURIOSITY_NO_GO:** Exact desktop-build hunting — low expected effect on the
  architecture decision after current mobile/product scope was pinned [C-037].
- **CURIOSITY_NO_GO:** Broader Stagelight migration/licensing inventory — repeated
  searches did not recover a suitable source; reopen with an archived official
  announcement or versioned migration document [C-035].
- **CURIOSITY_NO_GO:** Enumerating every native preset/effect/content pack —
  mutable inventory with low value beyond the documented device/content model.
- **CURIOSITY_NO_GO:** Additional DAW discovery candidates — outside the owned
  Zenbeats product-family boundary.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis / check | Documentary result | Status / later probe |
| --- | --- | --- |
| H1: Zenbeats is a clip launcher without a linear DAW path | `Record to Timeline` captures LoopBuilder performance into a linear multitrack view | **FALSIFIED** [C-004; S-022] |
| H2: External plug-ins work on every platform in the family | Android is N/A; iOS is AUv3; desktop uses VST/AU by OS and requires entitlement | **FALSIFIED** [C-015, C-016; S-004, S-005] |
| H3: “VST support” proves VST3 | Official text never names VST generation | **NOT SUPPORTED / UNKNOWN** [C-019] |
| H4: Accepted format implies broad compatibility | Roland explicitly does not guarantee every third-party plug-in | **FALSIFIED as an evidentiary shortcut** [C-015; S-004] |
| H5: Scanner quarantine proves runtime isolation | Only integrity/communication failure, quarantine, and rescan are documented | **NOT SUPPORTED / UNKNOWN** [C-018, C-020] |
| H6: Direct Google Drive is the current cloud architecture | 3.1.8 removed it for OS-native provider-neutral sharing | **FALSIFIED** [C-027; S-011] |
| H7: ZC1 and ZENOLOGY are one bundled instrument | Roland says ZENOLOGY is not part of Zenbeats | **FALSIFIED** [C-024; S-015] |
| H8: All ZEN-Core-adjacent tones use the ZC1 export path | Model Expansion tones error or are omitted | **FALSIFIED** [C-024; S-016] |
| H9: Zenbeats supports tempo events anywhere | Retained KB says no positional tempo information can be inserted | **FALSIFIED for documented 2020 behavior; current regression check needed** [C-008; S-023] |
| H10: A normal project exchange preserves every plug-in and asset | No state/dependency contract is published | **UNKNOWN** [C-022, C-028] |

**Accepted → scanned → instantiated → full-contract distinction:**

1. **Format accepted:** documented only as generic VST (Windows/macOS), generic
   AU (macOS), and AUv3 (iOS), with Android none [C-015].
2. **Discovered/scanned:** paths, `Scan New`, `Rescan All`, quarantine, and
   individual retry are documented [C-017, C-018].
3. **Instantiated:** Roland documents external instrument and FX use, while
   warning that not every plug-in works [C-015].
4. **Full contract:** not established; buses, timing/PDC, isolation, UI, state,
   and recovery semantics remain unknown [C-020–C-022].

No safe runtime probe was performed, so there are no `OBSERVED` claims.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Zenbeats is current on Windows/macOS/iOS/Android; mobile 3.1.12 is dated 2025-06-03 (Apple) and 2025-06-02 (Google) | Current family/mobile | S-001–S-003 | Current vendor/store pages agree | Desktop build not exposed |
| C-002 | DOCUMENTED | High | Requirements list Win 10/11, macOS 10.11+, iOS 11+, Android 8+, ChromeOS Android apps, dual-core/2 GB/2 GB; ZC1 is 64-bit-only | Current specifications | S-001 | Direct specification | Meeting requirements is not a guarantee |
| C-003 | DOCUMENTED | High | Commercial modes include Free, OS/Platform Unlock, Max, Roland Cloud membership, and in-app content | Current/historical commercial model | S-001, S-008, S-017, S-018 | Multiple first-party pages | Exact current price/major-upgrade rights unresolved |
| C-004 | DOCUMENTED/INFERENCE | High | LoopBuilder and Timeline form a launcher-to-linear workflow; performance can be recorded to Timeline; unlocked typed tracks are unlimited | User model | S-001–S-003, S-022 | Direct workflow plus bounded interpretation | Underlying object identity unknown |
| C-005 | DOCUMENTED | High | Native set includes ZR1, ZC1, SampleVerse, Electro-Series, step sequencing, per-step automation, and an enumerated 22 effects | Current specification | S-001 | Direct inventory/feature text | Stores say 17; inventory mutable |
| C-006 | DOCUMENTED | High | Track freeze, élastique efficient V3 time stretch, and stereo/stem render are exposed | Audio engine surface | S-001, S-013 | Direct spec/export procedure | Internal render contract unknown |
| C-007 | UNKNOWN | High | Rates, precision, buffers, scheduler, PDC/tails, oversampling, render mode, freeze semantics, and diagnostics are not public | Audio engine | S-001, S-013 | Relevant spec/export inspected | Needs vendor docs and fixtures |
| C-008 | DOCUMENTED | Medium-high | Patterns can have distinct meters; retained 2020 KB says no positional tempo events | Meter/tempo | S-023 | Direct KB | Could have changed; current fixture needed |
| C-009 | DOCUMENTED | High | OS-supported MIDI/audio devices, Bluetooth MIDI, Link, VERSELAB/WM-1 integration are documented; wireless audio is unsupported | Hardware/control | S-001, S-020, S-021 | Direct feature/support text | No universal device guarantee |
| C-010 | UNKNOWN | High | MIDI files, plug-in MIDI out, MPE, MIDI 2.0, SysEx, notation, MTC/clock, and event accuracy are unspecified | MIDI contract | S-001, S-020, S-021 | Targeted MIDI/device evidence inspected | Link/Bluetooth do not resolve |
| C-011 | DOCUMENTED | High | Send/group tracks, sends, effect slots, mixer, general automation, and native sidechain-branded effects are visible | Routing/control | S-001 | Direct spec | Does not prove arbitrary plugin buses |
| C-012 | UNKNOWN | High | Sidechain/feedback/channel layouts, VCA, surround, automation semantics, OSC, and public remote APIs are unspecified | Routing/control | S-001 | Feature/spec page inspected | Fixture or manual needed |
| C-013 | DOCUMENTED | High | Audio recording/sampling, user sound import, and LoopBuilder-to-Timeline recording are documented | Recording/media | S-001, S-014, S-022 | Direct procedures | Codec/precision unknown |
| C-014 | UNKNOWN | High | Monitoring, punch/takes/comping, full codecs, video/metadata, edit durability, collection and relinking are unspecified | Recording/media | S-001, S-009, S-013, S-014 | Relevant pages inspected | Absence is not unsupported |
| C-015 | DOCUMENTED | High | Unlocked external hosting maps to Windows VST, macOS VST/AU, iOS AUv3, Android none; not every plugin is guaranteed | Current platform host matrix | S-001, S-004, S-005 | Two direct compatibility pages + current product | KB pages updated 2021; generations unresolved |
| C-016 | DOCUMENTED | High | External hosting requires Platform/OS or Max unlock, or active paid membership entitlement | Entitlement | S-001, S-004, S-005, S-008 | Direct tables/current page | Exact read-only behavior after expiry unknown |
| C-017 | DOCUMENTED | High | Four scan roots, common Windows paths, `Scan New`, and `Rescan All` are documented | Discovery | S-004, S-006 | Direct procedures | No cache/isolation detail |
| C-018 | DOCUMENTED | High | Invalid integrity check or failed communication can quarantine a plugin; individual rescan and support escalation exist | Scan recovery | S-007 | Direct KB | Integrity mechanism unspecified |
| C-019 | UNKNOWN | High | VST2/VST3 and macOS AUv2/AUv3 generations are unresolved; other matrix formats have no vendor claim | Format identity | S-004, S-005 | Generic names only | Requires authoritative matrix/fixtures |
| C-020 | UNKNOWN | High | Scan/runtime isolation, crash containment, architecture bridging, signing, cache/identity, and UI/failure details are undisclosed | Host runtime | S-004–S-007 | Targeted host docs inspected | Quarantine does not imply sandbox |
| C-021 | UNKNOWN | High | Third-party bus/event, sidechain, multi-output, PDC/latency/tails, bypass/suspend, dynamic I/O, and offline-render contract is unspecified | Host processing | S-001, S-004–S-007, S-013 | Role-level docs only | Controlled capability fixtures required |
| C-022 | UNKNOWN | High | Third-party parameters, state/presets/assets, automation accuracy, UI mode, missing-plugin and migration behavior are unspecified | Host persistence/UI | S-001, S-004, S-009, S-012 | Product/project/plugin sources inspected | ZIP transfer does not prove state fidelity |
| C-023 | DOCUMENTED | High | ZC1 is a built-in ZEN-Core-based synth with bounded ZENOLOGY/hardware tone compatibility | Native ecosystem | S-001 | Direct product text | Requires 64-bit; exact tone matrix mutable |
| C-024 | DOCUMENTED | High | ZENOLOGY is separate; Model Expansion-created tones error or are omitted from export for hardware/Zenbeats ZC1 | Ecosystem boundary | S-015, S-016 | Direct Roland KB | Historical article wording; core limitation explicit |
| C-025 | DOCUMENTED | Medium-high | Same-account, same-Wi-Fi `Transfer Song` moves projects between devices | Project transfer | S-012 | Direct procedure | Old direct-cloud paragraphs superseded |
| C-026 | DOCUMENTED | High | 3.1.8 adds ZIP/native-browser import, batch content export, desktop destinations and mobile share sheets; Android internal ZIP import had a limitation | Interchange | S-009, S-010 | Versioned first-party docs | Android limitation may have changed |
| C-027 | DOCUMENTED | High | 3.1.8 removes direct Google Drive integration in favor of provider-neutral sharing | Cloud boundary | S-011 | Explicit change notice | Old pages/listings remain stale |
| C-028 | UNKNOWN | High | Project schema, atomicity, recovery/migration, dependency manifests, formal interchange, co-editing/conflicts/versioning are unspecified | Persistence/collaboration | S-009–S-013 | Relevant transfer/export docs inspected | File exchange is not collaboration |
| C-029 | DOCUMENTED/UNKNOWN | High | Stereo mix and per-track stems are documented; codec/precision/PDC/tails/determinism are unknown | Delivery | S-010, S-013 | Direct render/share docs | No deep renderer contract |
| C-030 | UNKNOWN | Medium-high | No public scripting, device/controller SDK, OSC/remote, native ABI, or stable schema was identified | Extensibility | S-001, S-004, S-021 | Product/integration sources inspected | Private APIs may exist |
| C-031 | DOCUMENTED | High | Internet/account login is required by spec; one license authorizes up to five devices; membership Max lasts while active | Authorization/licensing | S-001, S-005, S-018, S-019 | Direct specification/KB | Offline cadence and post-expiry project behavior unknown |
| C-032 | UNKNOWN | High | Offline grace, membership-expiry behavior, current exact prices, and future-major-version Max rights are unresolved | Commercial durability | S-001, S-017, S-018 | Current/historical wording conflicts | Vendor clarification/account probe needed |
| C-033 | DOCUMENTED/UNKNOWN | Medium | Store privacy/accessibility declarations are documented; broad accessibility/security/telemetry behavior is unknown | Privacy/accessibility | S-002, S-003 | Platform-store declarations | Not independent audits |
| C-034 | UNKNOWN | High | Process/graph/thread/storage architecture is proprietary or undocumented | Internals | S-001, S-004–S-013 | Public operational sources inspected | Vendor disclosure/instrumentation needed |
| C-035 | UNKNOWN | Medium | Stagelight acquisition/lineage and migration boundaries were not established from a retained authoritative source | History | Negative searches | Multiple bounded discovery routes failed | Reopen with official archive/versioned migration doc |
| C-036 | INFERENCE | High | Hosting/interoperability names grant no implementation, SDK, trademark, redistribution, signing, or certification rights | Clean-room/legal | S-001, S-004, S-005, S-016 | Governing contract + capability evidence | Not legal advice; owner terms needed |
| C-037 | UNKNOWN | High | Exact current desktop build is not exposed in retained sources | Version pin | S-001–S-003 | Mobile stores pin only mobile | Desktop installer/account or vendor page could resolve |
| C-038 | DOCUMENTED contradiction | High | Official/current-facing pages disagree on 22 vs 17 effects, current direct cloud wording, and Max major-version content terms | Documentation quality | S-001–S-003, S-011, S-017, S-018 | Direct source comparison | Prefer newer versioned change notice/enumerated spec, retain conflict |

## 22. Source ledger and adaptive bibliography

All retained sources were accessed 2026-08-29. Primary vendor/platform sources
were preferred. Search-result pages were used only for discovery and are not
cited as evidence.

### S-001 — Roland Zenbeats product page and specifications

- **Publisher / URL / kind:** Roland Corporation; official current product page;
  <https://www.roland.com/global/products/zenbeats/>.
- **Scope / passage:** Current positioning, workflow, native devices/content,
  unlocks, formats, tracks/features, requirements, time-stretch attribution.
- **Claims:** C-001–C-007, C-009, C-011–C-016, C-021–C-024, C-029–C-032,
  C-034, C-036–C-038.
- **Limitations / rationale:** Mutable marketing/spec page with no desktop build;
  selected as the broadest first-party current anchor, then narrowed by KB pages.

### S-002 — Roland Zenbeats, US App Store

- **Publisher / URL / kind:** Apple/Roland; official store metadata;
  <https://apps.apple.com/us/app/roland-zenbeats/id1473380367>.
- **Scope / passage:** Version 3.1.12, 2025-06-03, iOS 11+, release notes,
  privacy/accessibility declarations.
- **Claims:** C-001, C-004, C-033, C-037, C-038.
- **Limitations / rationale:** Regional store/developer declarations and stale
  description text; best primary iOS release anchor.

### S-003 — Roland Zenbeats Music Creation, Google Play

- **Publisher / URL / kind:** Google/Roland; official store metadata;
  <https://play.google.com/store/apps/details?id=jp.co.roland.zenbeats&hl=en_US&gl=US>.
- **Scope / passage:** 3.1.12, updated 2025-06-02, release notes, Android data
  safety, product description.
- **Claims:** C-001, C-004, C-033, C-037, C-038.
- **Limitations / rationale:** Does not expose version in a separate metadata
  field in fetched text; still the canonical Android listing.

### S-004 — Can I use external plug-ins with Zenbeats?

- **Publisher / URL / kind:** Roland Support; official KB;
  <https://support.roland.com/hc/en-us/articles/360043623691-Zenbeats-Can-I-use-external-plug-ins-with-Zenbeats>.
- **Scope / passage:** iOS AUv3, macOS VST/AU, Windows VST, Android N/A,
  entitlement, compatibility caveat, scan controls.
- **Claims:** C-015–C-022, C-036.
- **Limitations / rationale:** Updated 2021 and generic format names; most direct
  role/platform/compatibility source.

### S-005 — Plug-in compatibility differences by OS

- **Publisher / URL / kind:** Roland Support; official compatibility table;
  <https://support.roland.com/hc/en-us/articles/360043624051-Zenbeats-What-are-the-differences-between-the-plug-in-compatibility-for-Windows-Mac-IOS-and-Android-versions-of-Zenbeats>.
- **Scope / passage:** Free/membership/unlocked format matrix and membership term.
- **Claims:** C-003, C-015, C-016, C-019–C-022, C-031, C-036.
- **Limitations / rationale:** Updated 2021; corroborates and clarifies S-004,
  preferable to extrapolation from logos.

### S-006 — Zenbeats can't find my virtual instrument/effects plug-ins?

- **Publisher / URL / kind:** Roland Support; official troubleshooting KB;
  <https://support.roland.com/hc/en-us/articles/360034121631-Zenbeats-can-t-find-my-virtual-Instrument-effects-plugins>.
- **Scope / passage:** Four directories, common Windows paths, `Rescan All`.
- **Claims:** C-017, C-020, C-021.
- **Limitations / rationale:** No version/generation or cache details; selected
  for concrete discovery UX.

### S-007 — Why are some third-party plug-ins quarantined?

- **Publisher / URL / kind:** Roland Support; official recovery KB;
  <https://support.roland.com/hc/en-us/articles/360053956872-Zenbeats-Why-are-some-third-party-plugins-quarantined-in-Zenbeats>.
- **Scope / passage:** Integrity/communication failures, individual rescan,
  support escalation.
- **Claims:** C-018, C-020, C-021.
- **Limitations / rationale:** Mechanism not explained; only primary source found
  for quarantine cause and recovery.

### S-008 — How do I unlock external plug-in support and other features?

- **Publisher / URL / kind:** Roland Support; official KB, updated 2024;
  <https://support.roland.com/hc/en-us/articles/360050109251-Zenbeats-How-do-I-unlock-external-plugin-support-and-other-features>.
- **Scope / passage:** Platform or Max unlock; only Max includes all in-app
  content without separate charge.
- **Claims:** C-003, C-016, C-031.
- **Limitations / rationale:** Short entitlement statement; newest retained
  unlock-specific source.

### S-009 — New in Zenbeats 3.1.8: Import and Export Improvements

- **Publisher / URL / kind:** Roland Support; versioned KB;
  <https://support.roland.com/hc/en-us/articles/29472561641371-New-In-Zenbeats-3-1-8-Import-and-Export-Improvements>.
- **Scope / passage:** ZIP import, OS browser/cloud locations, batch export,
  Android internal-storage limitation.
- **Claims:** C-014, C-022, C-026, C-028.
- **Limitations / rationale:** Version-scoped 3.1.8 behavior; strongest import/
  export evidence and preferable to stale store copy.

### S-010 — New in Zenbeats 3.1.8: Sharing Exports

- **Publisher / URL / kind:** Roland Support; versioned KB;
  <https://support.roland.com/hc/en-us/articles/29472597530779-New-In-Zenbeats-3-1-8-Sharing-Exports-in-Zenbeats>.
- **Scope / passage:** Desktop native file destinations and mobile share sheets.
- **Claims:** C-026, C-028, C-029.
- **Limitations / rationale:** Does not define archive schema; primary current
  exchange-surface evidence.

### S-011 — Zenbeats Google Drive integration is being replaced

- **Publisher / URL / kind:** Roland Support; official change notice;
  <https://support.roland.com/hc/en-us/articles/29472538074139-Zenbeats-Google-Drive-integration-is-being-replaced>.
- **Scope / passage:** Removal in 3.1.8 and provider-neutral replacement.
- **Claims:** C-027, C-038.
- **Limitations / rationale:** Transition notice; selected to resolve stale
  direct-Google-Drive claims.

### S-012 — Transfer Zenbeats projects between devices

- **Publisher / URL / kind:** Roland Support; official KB;
  <https://support.roland.com/hc/en-us/articles/360033748272-Zenbeats-How-do-I-transfer-my-Zenbeats-projects-from-one-device-to-another>.
- **Scope / passage:** Same Wi-Fi/account `Transfer Song` procedure.
- **Claims:** C-022, C-025, C-028, C-038.
- **Limitations / rationale:** 2022 direct-cloud paragraphs are superseded by
  S-011; retained for local device-transfer mechanics.

### S-013 — Can I export my song as an audio file?

- **Publisher / URL / kind:** Roland Support; official KB;
  <https://support.roland.com/hc/en-us/articles/360061935232-Zenbeats-Can-I-export-my-song-as-an-audio-file>.
- **Scope / passage:** `Create Mix` stereo and `Create Stems` per-track export.
- **Claims:** C-006, C-007, C-014, C-021, C-028, C-029.
- **Limitations / rationale:** No formats/precision/timing contract; canonical
  render-mode procedure.

### S-014 — Add personal sounds and loops

- **Publisher / URL / kind:** Roland Support; official KB, updated 2026;
  <https://support.roland.com/hc/en-us/articles/360034121771-Zenbeats-Can-I-add-my-personal-sounds-and-loops-to-Zenbeats>.
- **Scope / passage:** Device-browser import into Drum/Loop Browser user areas.
- **Claims:** C-013, C-014.
- **Limitations / rationale:** Codec list omitted; freshest retained media-import
  source.

### S-015 — Is ZENOLOGY part of Zenbeats?

- **Publisher / URL / kind:** Roland Support; official KB;
  <https://support.roland.com/hc/en-us/articles/360053956452-Zenbeats-Is-the-ZENOLOGY-Software-Synthesizer-a-part-of-Zenbeats>.
- **Scope / passage:** Explicitly says ZENOLOGY is not part of Zenbeats.
- **Claims:** C-024.
- **Limitations / rationale:** Uses historical “Max 2.0” wording; retained only
  for the product-boundary statement.

### S-016 — ZENOLOGY Model Expansion export for hardware/Zenbeats ZC1

- **Publisher / URL / kind:** Roland Support; official ZENOLOGY KB;
  <https://support.roland.com/hc/en-us/articles/360046191592-ZENOLOGY-How-can-a-sound-that-was-created-using-a-Model-Expansion-be-exported-to-hardware-using-ZENOLOGY-s-EXPORT-for-Hardware-Zenbeats-ZC1-function>.
- **Scope / passage:** Model Expansion tones error or are omitted; conventional
  ZEN-Core tones export.
- **Claims:** C-024, C-036.
- **Limitations / rationale:** Updated 2021; decisive primary subtype boundary.

### S-017 — Difference between OS Unlock and Max Unlock

- **Publisher / URL / kind:** Roland Support; official historical KB;
  <https://support.roland.com/hc/en-us/articles/360054013052-Zenbeats-What-is-the-difference-between-Unlock-for-each-OS-and-Max-Unlock>.
- **Scope / passage:** OS-specific feature access; Max all platforms/content
  through a new major version.
- **Claims:** C-003, C-031, C-032, C-038.
- **Limitations / rationale:** 2021 wording conflicts with current product page;
  retained to expose, not erase, the term ambiguity.

### S-018 — How much does Zenbeats cost?

- **Publisher / URL / kind:** Roland Support; official V3-era price KB;
  <https://support.roland.com/hc/en-us/articles/360050114191-Zenbeats-How-much-does-Zenbeats-cost>.
- **Scope / passage:** Free, per-OS, Platform, Max, membership and V1/V2→V3 USD
  table; membership active-term statement.
- **Claims:** C-003, C-031, C-032, C-038.
- **Limitations / rationale:** Updated 2023 and not current pricing; retained for
  historical model/contradiction only, preferable to reseller pricing.

### S-019 — How many devices can I authorize?

- **Publisher / URL / kind:** Roland Support; official authorization KB;
  <https://support.roland.com/hc/en-us/articles/360033748592-Zenbeats-How-many-devices-can-I-authorize-with-my-Zenbeats-account>.
- **Scope / passage:** One Zenbeats license, up to five devices.
- **Claims:** C-031.
- **Limitations / rationale:** Updated 2021; no offline/refresh semantics; direct
  source for the authorization count.

### S-020 — Can I use external devices with Zenbeats?

- **Publisher / URL / kind:** Roland Support; official device KB;
  <https://support.roland.com/hc/en-us/articles/360043623931-Zenbeats-Can-I-use-external-devices-with-the-Zenbeats>.
- **Scope / passage:** OS-supported MIDI/audio interfaces; wireless audio
  excluded; no universal guarantee.
- **Claims:** C-006, C-009, C-010, C-014.
- **Limitations / rationale:** No protocol/timing details; primary hardware-I/O
  boundary.

### S-021 — Bluetooth MIDI devices cannot be selected

- **Publisher / URL / kind:** Roland Support; official troubleshooting KB;
  <https://support.roland.com/hc/en-us/articles/360043182512-Zenbeats-Bluetooth-MIDI-devices-cannot-be-selected-for-MIDI-Input-or-MIDI-Output>.
- **Scope / passage:** Bluetooth MIDI pairing on Android/iOS/Windows/macOS.
- **Claims:** C-009, C-010, C-030.
- **Limitations / rationale:** Connection procedure, not latency/reliability
  qualification; best cross-platform Bluetooth source.

### S-022 — Record from LoopBuilder to Timeline

- **Publisher / URL / kind:** Roland Support; official workflow KB;
  <https://support.roland.com/hc/en-us/articles/360054463751-Zenbeats-How-do-I-record-from-LoopBuilder-to-Timeline>.
- **Scope / passage:** `Record to Timeline` creates a linear recording of played
  loops/song parts.
- **Claims:** C-004, C-013.
- **Limitations / rationale:** Updated 2020; no object/latency details; direct
  evidence for the defining dual-view workflow.

### S-023 — Change time signature and tempo mid-song

- **Publisher / URL / kind:** Roland Support; official workflow KB;
  <https://support.roland.com/hc/en-us/articles/360054516451-Zenbeats-Can-I-change-the-time-signature-and-tempo-in-the-middle-of-a-song>.
- **Scope / passage:** Per-pattern/global meters; no positional tempo data.
- **Claims:** C-008.
- **Limitations / rationale:** Updated 2020 and needs current regression testing;
  only retained direct meter/tempo statement.

### Negative and inaccessible results retained

- Repeated `websearch` requests returned HTTP 429 and supplied no evidence.
- The official Zenbeats Start Guide PDF fetch failed because the available tool
  could not parse its `application/pdf` payload; accessible KB equivalents were
  used rather than retrying indefinitely.
- Roland support enumeration via a scripted request returned HTTP 403.
- Official support/site searches for Stagelight surfaced no relevant retained
  source; Google/Bing discovery was empty or noisy. An app-review claim was
  rejected as provenance evidence.
- Search-result snippets were treated only as untrusted discovery leads. The
  underlying canonical articles were fetched before supporting claims.
- No direct current desktop build, VST generation, macOS AU generation, or
  Apple-silicon architecture statement was recovered.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method / blocker | Decision impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| Exact desktop build and architecture | Current product/download/store sources inspected; desktop number and native/Rosetta status absent | Deployment and regression pin | Obtain signed installer metadata/vendor release notes; inspect architecture without decompilation | Public/vendor or disposable lab; unassigned |
| VST2 vs VST3; macOS AU generation | Two official compatibility articles say only VST/AU | SDK/licensing and fixture matrix | Minimal signed VST2, VST3, AUv2, AUv3 instrument/effect fixtures on unlocked systems | Authorized macOS/Windows lab; unassigned |
| Scanner/cache/identity/isolation | Path/rescan/quarantine KBs inspected; mechanism/logs omitted | Reliability/security/diagnostics | Valid, duplicate-ID, invalid, hanging and crashing scanner fixtures; record processes, cache, UI, logs, retries | Disposable VM; unassigned |
| Runtime crash containment/bridging/signing | No process or architecture docs | Host resilience and platform migration | Observe process tree; crash safe fixtures; test native/translated and unsigned/invalid fixtures lawfully | Disposable signed fixtures; unassigned |
| Buses, sidechain, multi-output, MIDI out | Format/role/product pages omit bus contract | Interoperability fidelity | Capability-coded VST3/AU fixtures for aux input, multi-output, MIDI out, dynamic I/O | Authorized host lab; unassigned |
| PDC, latency/tails, render parity | Freeze/render pages name operations only | Timing correctness and delivery | Impulse/tail reporter at multiple buffers; compare live, mix, stems, freeze and offline speed | Audio analysis harness; unassigned |
| Parameters/automation/state/UI | Automation/hosting/project pages omit semantics | Project durability and control fidelity | Stable-ID/range/state/asset/headless/custom-UI fixture; automate, save, move, remove, reinstall, reopen | Cross-OS fixture suite; unassigned |
| Missing plug-ins/assets and archive schema | ZIP transfer docs do not define manifest/relink | Cross-device recall | Exchange a project with media/plugin dependencies across OS/account/content states; inspect messages and preservation | Copied disposable projects; unassigned |
| MIDI 2.0/MPE/SysEx/MTC/clock | Device/Bluetooth/Link evidence only | Expressive/control scope | Standards-coded MIDI input/output fixtures and timestamp capture | MIDI interface/harness; unassigned |
| Offline authorization and expiry | Spec requires Internet/login; five-device and active-membership wording only | Long-term project access | Vendor clarification, then controlled disconnect/expiry test measuring edit/open/render behavior and refresh cadence | Separate account/license; unassigned |
| Accessibility/privacy/security | Store declarations only | Inclusive and secure deployment | VoiceOver/Narrator/keyboard/contrast audit; traffic/privacy review with consent | Platform test lab/legal review; unassigned |
| Stagelight provenance/migration | Official and ordinary searches failed/rate-limited; no suitable retained source | Historical migration lesson, not current host choice | Locate archived official acquisition and versioned migration/license FAQ | Public archive/vendor; unassigned |

## 24. Curiosity pass and stop decision

Scores are 0–3; cost is inverted (`3` = low cost). A thread qualifies only if
it can change an architecture conclusion and has positive expected evidence.

| Candidate follow-up | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Direct authorization-count article | 2 | 3 | 2 | 3 | **PURSUED:** closed five-device count; offline use stayed unknown [C-031, C-032] |
| Exact official Stagelight acquisition source | 2 | 3 | 3 | 2 | **PURSUED then stopped:** repeated official/generic discovery produced no suitable source [C-035] |
| Engine/process/PDC documentary search | 3 | 1 | 2 | 0 | **CURIOSITY_NO_GO:** proprietary/fixture territory; likely duplicate unknowns |
| Community plug-in failure inventory | 2 | 1 | 1 | 1 | **CURIOSITY_NO_GO:** weak attribution and no controlled reproduction |
| Exact desktop build hunt | 2 | 1 | 1 | 1 | **CURIOSITY_NO_GO:** low chance of changing leading architecture conclusions |
| Native pack/preset inventory | 0 | 2 | 0 | 2 | **CURIOSITY_NO_GO:** mutable and not architecture-decisive |
| Controller/VERSELAB feature expansion | 1 | 2 | 1 | 2 | **CURIOSITY_NO_GO:** named integration already bounds the public API conclusion |
| Historical price/major-version archaeology | 1 | 1 | 1 | 1 | **CURIOSITY_NO_GO:** current terms require vendor confirmation, not more stale pages |

**Coverage check:** every template heading and required format row is populated;
identity/version/platform/edition scope is explicit; hosting depth covers scan,
quarantine, runtime, buses, parameters, state, UI and failure boundaries; every
material conclusion is classified and cited or described as an unknown.

**Saturation check:** later passes returned repeated generic format names, stale
commercial/cloud wording, rate limits, or no public internals. Remaining gaps
are discriminated by authorized fixtures or vendor disclosure, not more broad
search.

**Stop decision:** **STOP — COMPLETE_WITH_UNKNOWNS.** Coverage is sufficient and
the documentary budget is exhausted at positive-value saturation. The next
phase should be a disposable cross-platform plug-in/project fixture suite, not
indefinite web searching. Retained evidence count: **23 sources, 38 claims, 0
observed runtime probes**.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Added
  `research/daw-landscape/dossiers/roland-zenbeats.md`; no sibling/shared file
  was written, staged, or committed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See §0 and C-001–C-003, C-037.
- [x] **Every required dossier heading exists in order.** Sections 0–25 are
  present, including all 11.1–11.6 subsections.
- [x] **Every material assertion has a claim ID and classification.** The claims
  register contains C-001–C-038; substantive sections cite them.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  §§21–23; C-035 also retains failed discovery methods.
- [x] **Every required plugin-format row is present.** All 13 required rows are
  in §11.1 with no blank cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  §§11.2–11.6 cover discovery, quarantine, runtime, processing, state, UI, and
  failure boundaries.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  `DOCUMENTED`, `INFERENCE`, contradiction, and `UNKNOWN` are explicit; there
  are no `OBSERVED` claims.
- [x] **Licensing and clean-room boundaries are explicit.** See §16 and C-036.
- [x] **Bibliography records source rationale and limitations.** All S-001–S-023
  entries include scope/passage, claim mapping, limitations, and selection
  rationale.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19
  and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Documentary public retrieval only; no product binary was
  installed or run.
- [x] **Pre-existing workspace changes were left untouched.** Initial `git status
  --short` showed unrelated modified/untracked mobile, vendor, lockfile, and
  research-tree work; none was altered by this dossier task.

**Checks performed:** template-heading/order review; required-format row review;
claim/source register review; contradiction/negative-result review; curiosity
and stop review; before/after ownership check with `git status --short`.

**Unresolved blockers:** exact desktop build/architecture; Stagelight provenance;
VST/AU generations; proprietary engine and full plug-in contract; project/plugin
state durability; offline/expiry behavior; current commercial term ambiguity;
accessibility/security qualification. Each has a next discriminating probe in
§23.
