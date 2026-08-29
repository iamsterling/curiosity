# KORG Gadget DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** KORG Gadget: KORG Gadget 3 for iOS and Mac, Gadget 3
  Plug-ins for Mac/PC, Le editions, KORG Gadget for Nintendo Switch, KORG
  Gadget VR, and KORG Gadget for PlayStation.
- **Canonical vendors:** KORG Inc. for the core app/plug-in line; DETUNE Ltd.
  co-developed and sells the Switch, VR, and PlayStation products. [C-001]
  [C-020]
- **Researcher/session:** subagent in session
  `ses_fb27292a7ffeEaVqdQVv3wK4Ta`.
- **Owned path:** `research/daw-landscape/dossiers/korg-gadget.md`.
- **Research date / evidence cutoff:** 2026-08-29 UTC.
- **Current evidence snapshot:** KORG Gadget 3 for Mac and Gadget 3 Plug-ins
  for Mac/PC 3.1.7 (2026-04-10); the Apple listing for the Gadget 3-branded
  iOS app reports executable version 6.3.4; Switch has public version-3.0
  lineage (2019), VR reached full release in 2024, and the PlayStation product
  launched in 2025. The different marketing and executable version axes are
  intentional scope metadata, not normalized into one family version. [C-002]
- **Platforms/editions:** full song-production app on iPhone/iPad and macOS;
  full and Le editions on iOS/macOS; plug-in-only package on macOS/Windows;
  separate Switch, Meta Quest/Steam-Windows VR, and PS5 products. There is no
  documented Linux or browser edition. [C-001] [C-003] [C-020]
- **Inclusions:** user-visible song/scene/clip/gadget/mixer model, recording and
  export, native gadgets/content, controller and cloud boundaries, Gadget as a
  plug-in provider, and the documentary status of third-party hosting.
- **Exclusions:** installation or binary execution; undocumented proprietary
  code; qualification inside every named DAW; hardware-only KORG products;
  detailed behavior of KORG Module/iM1/etc. except where they unlock Gadget
  content; and legal advice.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. The public user/product contract is
  covered; proprietary engine, project, plug-in-runtime, and desktop-license
  internals remain explicit unknowns. [C-009] [C-017] [C-025] [C-032]

## 1. Executive summary

KORG Gadget is best understood as a compact, native-device production system,
not as a general desktop plug-in host. Its full app organizes a Song as ordered
scenes; each track owns one gadget, and each scene/track intersection is a clip
whose bar length and playback mode may differ from its neighbors. Piano-roll
notes and gadget-parameter automation live at this clip/track level. [C-004]
[C-005] [C-006]

The mixer is deliberately bounded: per-track fader, pan, a master-reverb send,
solo/mute, and up to five insert effects, plus a small master section. The
catalog nevertheless covers synths, drums, samplers, audio recording and
processing, and external-MIDI control through dedicated gadgets. [C-007]
[C-011] [C-026]

**Plug-in headline:** KORG documents Gadget instruments as plug-ins *for other
hosts*: Mac/Windows VST3, Mac/Windows legacy-labelled `VST`, Mac `AU` and AAX,
NKS/NKS 2 integration, plus an eligible iOS AUv3 subset. KORG does not document
the Gadget sequencer scanning or instantiating arbitrary third-party VST,
VST3, AU, or AUv3 plug-ins. Therefore “Gadget is loadable as a plug-in” must not
be conflated with “Gadget hosts plug-ins.” Treat third-party hosting as **not
documented** and the complete host contract as `UNKNOWN`, not as a proven
universal negative. [C-013] [C-014] [C-015] [C-016] [C-017]

Interoperability is stronger than the closed native-device model might imply:
Standard MIDI import/export, per-track or full audio, Ableton Live Project
export as rendered tracks or Gadget plug-in references, iCloud/Dropbox paths,
Ableton Link, and Switch-to-iOS QR import are documented. But VR projects are
explicitly incompatible, console/PS5 exchange is sparse, and editable Ableton
state fidelity is not specified. [C-018] [C-019] [C-034]

The main architectural lesson is a coherent, low-choice scene/device workflow
with explicit render-or-reference handoff—not broad host extensibility. Its
liabilities as a reference are shallow public engine/routing detail, narrow
mix architecture, fragmented platform/project parity, and wholly undocumented
third-party scan/isolation/latency/state behavior. Overall confidence is
**high** for the user-visible model and packaging, **medium** for negative
hosting conclusions, and **low** for proprietary internals. [C-009] [C-016]
[C-031]

## 2. Product identity, history, and market position

KORG describes Gadget 3 as an all-in-one production app and a collection of
more than 40 miniature instruments. The core line comprises the iOS app, a Mac
app that includes the plug-in collection, and a plug-in-only Mac/PC package;
Le editions restrict gadgets, tracks, effects, and export. [C-001] [C-011]

Current release evidence is not one monolithic version number. Desktop app and
plug-ins reached 3.1.7 in April 2026, while Apple reports the Gadget 3-branded
iOS binary as 6.3.4. The maintained family also includes an older-but-still-
sold Switch branch, the 2024 VR full release, and the 2025 PS5 product. [C-002]

The intended workflow is rapid pattern/song construction around ready-to-use
gadgets and presets. Console and VR variants further position that model as a
game-like, motion/controller-oriented music studio rather than a parity port
of the desktop/mobile app. [C-020]

### Platform and edition snapshot

| Product/edition | Platform | Current evidence | Material boundary |
| --- | --- | --- | --- |
| Gadget 3 | iPhone/iPad | Apple version 6.3.4; $39.99 + IAP | Full song app; eligible gadgets can also act as AUv3 instruments. [C-002] [C-015] [C-022] |
| Gadget 3 for Mac | macOS Big Sur+ | 3.1.7 | Full song app; includes Gadget 3 Plug-ins. [C-001] [C-003] |
| Gadget 3 Plug-ins | macOS Big Sur+; Windows 11 64-bit | 3.1.7 | Plug-in collection only; no Windows standalone sequencer documented. [C-001] [C-003] [C-014] |
| Gadget Le | iOS/macOS | Live comparison chart | Free; track/gadget/effect/export limits vary by platform and controller connection. [C-001] [C-022] |
| Gadget for Nintendo Switch | Switch | v3 lineage; download still linked | 16 embedded gadgets, local/online four-player mode, QR-to-iOS path. [C-002] [C-019] [C-020] |
| Gadget VR | Meta Quest 2/3/Pro; Steam requires Windows PC | 2024 full release | 16 gadgets, Switch-derived 360° UI, project-incompatible with the main line. [C-003] [C-019] [C-020] |
| Gadget for PlayStation | PS5 | 2025 launch | 16 gadgets, Switch-derived 360° controller UI; interchange undocumented. [C-020] [C-025] |

## 3. Workflow and conceptual model

The top-level persistence unit is a **Song**. KORG says a Song saves scene and
clip status, each gadget's tone, mixer settings, tempo, and swing. A **Track**
is a sequencer/mixer part assigned to one gadget. A **Scene** is a multi-bar
song section such as intro, verse, or chorus. A **Clip** is one track's data
inside one scene. [C-004]

Scenes form the arrangement rather than a conventional freeform horizontal
audio timeline. A scene can carry name, time signature, repeat count, optional
scene tempo, smooth tempo transition, and fades. Clips in the same scene may
have different bar counts and may loop or play once. A scene can be played on
its own, while the song can loop its scene sequence. [C-005]

Genre Select offers a second entry path: choose phrases on a 5×5 grid, then
load the combination as an ordinary song whose gadgets, tracks, scenes, and
clips remain editable. Locked IAP phrases can be auditioned but their tracks
are silent after load until the dependency is purchased. [C-005] [C-011]

This is neither a tracker, notation workstation, nor publicly exposed modular
audio graph. The dedicated Dublin gadget can be semi-modular internally, but
that does not make the host routing graph modular. [C-011] [C-028]

## 4. Publicly documented architecture

Public documentation describes the object/UI contract, not the engine
implementation. No official source retrieved specifies the app's process
boundaries, audio-thread scheduler, internal graph representation, worker
pool, persistence schema, or service topology. Those are `UNKNOWN`. [C-009]
[C-024]

One implementation fact is public for the immersive branches: KORG says VR
and PlayStation use Epic Games' Unreal Engine; both use a Switch-derived user
interface with 3D gadgets/sequence views arranged around the user. This fact
does not establish their audio-engine internals or code sharing with the
iOS/macOS line. [C-020] [C-024]

The only documented extension boundary is outward-facing packaged gadgets and
controller/file protocols. No public Gadget authoring SDK, scripting runtime,
or third-party native-gadget API was found in the product pages, current manual
index, catalog, or linked FAQ. [C-030]

## 5. Audio engine

KORG documents device-dependent unlimited tracks/songs, sequencing resolution
of 1/480, 20–300 BPM, 0–100% swing, and a Freeze command that reduces CPU load.
The iOS settings expose audio latency and background-audio controls. Export can
render all tracks or one selected track and optionally retain a tail. [C-008]

The Studio Guide first calls audio export 16-bit/44.1-kHz stereo WAV, then says
the user can select bit depth and sample rate without listing values. The
supported range and whether 16/44.1 is a default or fixed legacy statement are
therefore `UNKNOWN`. Internal precision, device sample-rate negotiation,
buffer topology, multicore scheduling, oversampling, dropout policy, offline
versus realtime engine differences, plug-in delay compensation, tail reporting,
and diagnostic counters are also undocumented. [C-009]

Freeze is user-visible CPU relief, but its render format, reversibility,
dependency capture, and invalidation rules are not specified. It must not be
assumed equivalent to a conventional DAW's documented freeze/flatten contract.
[C-008] [C-009]

## 6. Tracks, timeline, clips, and editing

One track is associated with one gadget; scene/track intersections hold clips.
Users add, copy, insert, delete, and reorder/duplicate scenes and tracks, set
clip bars and grid, and edit clips through a piano roll. Different clip lengths
within one scene support polymetric/polyrhythmic repetition at the object-model
level, although KORG does not characterize it in those terms. [C-004] [C-005]

Notes can be entered by real-time recording or touch, quantized, moved,
resized, deleted, or multi-selected. A bar-copy operation copies one bar at a
time. Undo/redo exposes history for the selected track. [C-006]

The retrieved documentation does not define takes, lanes, comping, track
groups, ripple editing, clip warping as a general host facility, or a score
view. Sydney does time-stretch imported long loops, but that is a dedicated
gadget capability rather than documented universal clip warping. [C-026]
[C-028]

## 7. MIDI, sequencing, notation, and expression

The piano-roll sequencer records note velocity and gadget parameters. Gadget
accepts external MIDI and Bluetooth MIDI. Easy input mode selects one active
track; Advanced mode selects MIDI device and channel per track. MIDI CC learn
maps external controllers to gadget controls, and transport CC can map play,
pause, stop, record, loop, and metronome. [C-006] [C-010]

MIDI clock modes are internal, external, or automatic receive; KORG explicitly
says Gadget cannot transmit MIDI clock. Ableton Link provides tempo/beat/phrase
synchronization with other Link-enabled software. Taipei is a native external-
MIDI gadget with eight assignable knobs, XY pads, arpeggiator, and LFO. [C-010]

Standard MIDI Files can be imported as songs and exported. Public sources did
not define MPE, MIDI 2.0, per-note controllers, SysEx, MTC, notation, event-list
editing, or sample-accurate MIDI scheduling; these remain `UNKNOWN`, not
unsupported-by-proof. [C-018] [C-028]

## 8. Routing, mixer, automation, and control

Each track exposes a fader, pan, meter, solo/mute, one send to the master reverb,
and up to five insert effects. The master exposes fader/meter, reverb, limiter,
and—per current specifications—DeeMax. KORG lists 19 available IFX types. [C-007]

Moving gadget knobs/switches during recording captures their values. The
resulting parameter lanes can be selected, drawn, and cleared for the current
track. Public documentation does not specify automation interpolation,
write/read modes, parameter IDs, sample accuracy, touch/latch behavior, or
migration after parameter-list changes. [C-006] [C-017]

No general buses, arbitrary sends/returns, folders, VCAs, surround/immersive
layouts, feedback routing, or inter-track sidechain topology are documented.
An IFX named “Side Chain” is in the effect list, but its name alone does not
prove an arbitrary external sidechain bus. [C-007] [C-009]

KORG Native Mode supports Keystage, nanoKEY Studio, nanoKONTROL Studio, and
nanoKONTROL 2; ordinary MIDI controllers also work. Native Mode can surface
gadget/program/parameter names on supported hardware. [C-027]

## 9. Recording, comping, and media handling

MIDI performances and gadget controls record into clips in real time. Audio is
handled through dedicated gadgets: Zurich imports files and records voice or
acoustic instruments; Rosario and Durban process/record guitar or bass inputs;
Bilbao imports one-shots; Abu Dhabi slices loops; Vancouver imports samples;
Stockholm loads up to eight REX files; Sydney imports long loops and applies
tempo-following time stretch. [C-006] [C-026]

This supports an **inference** that Gadget's audio-track experience is modeled
through specialized native devices rather than a documented generic audio
region type. An alternative is that those gadgets wrap a shared internal audio
track engine, but no public source exposes it. [C-026] [C-031]

The sources do not define punch recording, take stacks, comping, destructive
versus non-destructive audio edits, supported import extensions beyond the
named examples, sample asset consolidation, relinking, proxies, video, conform,
or metadata. [C-025] [C-028]

## 10. Instruments, effects, content, and native devices

Current specifications report 45 gadgets and the product page advertises more
than 6,000 programs. The catalog includes synths, drum machines, PCM keyboards,
samplers, audio recorders/processors, a MIDI-out device, and licensed/collaborative
devices. The desktop package includes the broad collection; iOS begins with 20,
offers 12 IAP gadgets, and unlocks others through separately acquired KORG apps.
[C-011]

Architecture-relevant native categories are:

- **Generated/PCM instruments:** compact subtractive, wavetable, vector, VPM,
  workstation/PCM, chip, acoustic, and drum devices. [C-011]
- **Sample workflows:** one-shot (Bilbao), loop slicing (Abu Dhabi), melodic
  layering (Vancouver), REX loops (Stockholm), and six-lane long-loop/time-
  stretch operation (Sydney). [C-026]
- **Audio I/O:** Zurich recorder and Rosario/Durban input processors. [C-026]
- **External control:** Taipei MIDI-out/control gadget. [C-010]
- **Effects:** 19 host IFX choices, five slots per track, plus device-local
  effects and a small master section. [C-007]

The Gadget Browser filters devices by instrument category and favorites; the
Sound Browser searches/previews programs within gadgets. This is a coherent
native discovery taxonomy, not plug-in filesystem scanning. [C-012]

DeeMax is not included in the Gadget plug-in collection. Some content libraries
are also excluded from the plug-in package, and iOS availability varies with
IAP/other-app ownership. [C-015]

## 11. Third-party plugin hosting

**Interpretation rule:** the matrix separates (a) formats the Gadget sequencer
is documented to **host** from (b) formats in which KORG ships gadgets as a
**provider** for another DAW. No retrieved source documents arbitrary
third-party plug-in hosting in Gadget. [C-013] [C-016]

### 11.1 Format/platform matrix

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **UNKNOWN** host/provider generation | **UNKNOWN** host/provider generation | `NOT_APPLICABLE:no Gadget product` | `NOT_APPLICABLE:format/platform product absent` | 3.1.7 plug-in package; KORG says only “VST” alongside VST3 | Provider is documented under an unnumbered legacy `VST` label; this dossier does not silently relabel it VST2. No host is documented. | [C-014] [C-016]; S-002, S-005 |
| VST3 | **UNKNOWN host; DOCUMENTED provider** | **UNKNOWN host; DOCUMENTED provider** | `NOT_APPLICABLE:no Gadget product` | `NOT_APPLICABLE:no VST3 Gadget mobile/web product` | Gadget 3 Plug-ins 3.1.7, 64-bit | Gadgets load in other DAWs as VST3; no evidence Gadget scans VST3. | [C-013] [C-014] [C-016]; S-001, S-002, S-005 |
| AUv2 | **UNKNOWN** | `NOT_APPLICABLE:Apple format` | `NOT_APPLICABLE:Apple format/no product` | `NOT_APPLICABLE:AUv3 is the documented iOS provider` | Specs say `AU`, not `AUv2` | Mac provider likely belongs to the desktop AU family, but generation is not explicitly stated; host not documented. | [C-014] [C-016]; S-002 |
| AUv3 | **UNKNOWN** | `NOT_APPLICABLE:Apple format` | `NOT_APPLICABLE:Apple format/no product` | **UNKNOWN host; DOCUMENTED iOS provider subset**; `NOT_APPLICABLE` on console/web | Current Gadget 3 iOS; subset exceptions listed | Eligible gadgets can be used in GarageBand/Logic/other apps. Audio/MIDI and KORG-app-dependent gadgets are excluded. This is provider evidence only. | [C-013] [C-015] [C-016]; S-001, S-003, S-010 |
| AAX | **UNKNOWN host; DOCUMENTED provider** | **UNKNOWN host; provider not current** | `NOT_APPLICABLE:no Gadget product/AAX platform` | `NOT_APPLICABLE:mobile/console` | Mac 64-bit AAX listed; Windows list omits AAX and says compatibility update coming soon | Do not infer Windows support from the future-update footnote. | [C-014] [C-016]; S-002, S-004 |
| CLAP | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no Gadget product` | `NOT_APPLICABLE:mobile/console/web product absent` | No current KORG source retrieved names CLAP | Neither host nor provider support documented. | [C-016] [C-017]; S-001–S-005, S-009 |
| LV2 | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no Gadget product` | `NOT_APPLICABLE:mobile/console/web product absent` | No current KORG source retrieved names LV2 | Neither host nor provider support documented. | [C-016] [C-017]; S-001–S-005, S-009 |
| LADSPA | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no Gadget product` | `NOT_APPLICABLE:mobile/console/web product absent` | No current KORG source retrieved names LADSPA | Neither host nor provider support documented. | [C-016] [C-017]; S-001–S-005, S-009 |
| DSSI | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no Gadget product` | `NOT_APPLICABLE:mobile/console/web product absent` | No current KORG source retrieved names DSSI | Neither host nor provider support documented. | [C-016] [C-017]; S-001–S-005, S-009 |
| JSFX | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no Gadget product` | `NOT_APPLICABLE:mobile/console/web product absent` | No current KORG source retrieved names JSFX | Neither host nor provider support documented. | [C-016] [C-017]; S-001–S-005, S-009 |
| DirectX/DXi | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:Windows format/no product` | `NOT_APPLICABLE:mobile/console/web` | No current KORG source retrieved names DX/DXi | Windows has plug-in providers only; no DX/DXi statement. | [C-016] [C-017]; S-001–S-005, S-009 |
| Rack Extension | **UNKNOWN** | **UNKNOWN** | `NOT_APPLICABLE:no Gadget product` | `NOT_APPLICABLE:mobile/console/web` | Stockholm by Reason is a native gadgetized Dr. Octo Rex collaboration | Stockholm must not be conflated with hosting or shipping a Rack Extension. | [C-011] [C-016]; S-004 |
| Product-native/other | **DOCUMENTED native gadgets; DOCUMENTED AU/VST/VST3/AAX/NKS provider package as scoped above** | **DOCUMENTED native plug-in providers; NKS/NKS 2** | `NOT_APPLICABLE:no Gadget product` | **DOCUMENTED native gadgets; documented eligible iOS AUv3 providers; 16 embedded gadgets on Switch/VR/PS5** | 45-gadget core catalog; desktop 3.1.7; NKS 2 added in 3.1.7 | Native gadget selection is the only documented in-app device-host model. NKS is preset/controller integration, not an audio plug-in API. | [C-011]–[C-016] [C-020]; S-001–S-008 |

### 11.2 Discovery, scanning, validation, and recovery

The documented in-app discovery path is the native Gadget Browser plus per-
gadget Sound Browser. KORG documents categories, favorites, text search, and
program preview. There is no documented user plug-in path, startup scan,
validator, cache, duplicate-identity rule, rescan control, blacklist,
quarantine, or missing-third-party-plug-in placeholder. [C-012] [C-017]

For Gadget **as provider**, discovery/scanning belongs to the containing DAW,
but KORG publishes only compatible-DAW examples and format/package labels. The
installation paths, component IDs, rescan diagnostics, and migration from the
legacy `VST` provider to VST3 are `UNKNOWN`. [C-014] [C-017]

### 11.3 Runtime isolation and compatibility

No retrieved KORG source states whether gadget plug-ins execute in-process or
out-of-process under any host, or whether KORG ships a helper, sandbox,
architecture bridge, crash guard, or compatibility layer. A host may isolate
the provider independently, but that is a property of that host and cannot be
credited to Gadget. Apple Silicon and 64-bit requirements are documented;
bridging semantics are not. [C-003] [C-017]

### 11.4 Host/plugin processing contract

KORG identifies instruments and audio-oriented gadgets in provider packages,
but does not document their audio/MIDI bus counts, sidechain buses,
multi-output behavior, dynamic I/O, event dialect, MPE/MIDI 2.0, sample-
accurate automation, latency/tail reporting, bypass/suspend, offline-render
contract, or realtime-safety obligations. These remain `UNKNOWN`. [C-015]
[C-017]

The app's Freeze and tail-export features do not prove any corresponding
third-party plug-in protocol because only native gadgets are documented inside
the app. [C-008] [C-016]

### 11.5 Parameters, automation, state, presets, and project recall

Inside Gadget, native gadget tone, mixer settings, scene/clip status, and
recorded parameter lanes are saved in the Song. That persistence statement
does not disclose stable parameter IDs, plug-in normalized ranges/text, state
chunks, preset file formats, external asset references, version migration, or
host-side recall for Gadget AU/VST/VST3/AAX instances. [C-004] [C-006]
[C-017]

Ableton export can choose rendered audio or a plug-in-based handoff requiring
Gadget for Mac or Gadget Plug-ins for Mac/PC. KORG does not specify whether the
plug-in path preserves every gadget parameter, automation lane, sample asset,
or missing-provider placeholder. [C-018] [C-034]

### 11.6 UI, diagnostics, and failure modes

Gadgets expose bespoke knob/slider/pad interfaces, and 3.1.7 release notes list
specific bug/stability fixes. KORG does not document provider-window embedding
versus detachment, resize/scaling rules, headless operation, accessibility of
custom controls, renderer fallback, crash dumps, or recovery after provider
failure. [C-017] [C-029]

## 12. Extensibility and integration

Documented integrations are constrained and product-facing: Gadget plug-in
providers, iOS AUv3 providers, NKS/NKS 2 browsing/controller metadata, KORG
Native Mode hardware control, generic MIDI/CC, Taipei MIDI output, Ableton Link,
Standard MIDI, and Ableton Live Project export. [C-010] [C-013] [C-018]
[C-027]

No public scripting language, macro/action API, OSC/remote protocol, gadget
authoring SDK, or stable third-party device ABI was found. The branded gadget
collaborations demonstrate vendor-produced integration, not an open extension
contract. [C-011] [C-030]

NKS/NKS 2 is useful for browsing tags, artwork, and compatible NI controller
surfaces when Gadget providers are loaded elsewhere. It must not be listed as
an audio plug-in host format. [C-014]

## 13. Project format, persistence, interoperability, and collaboration

A Song saves scene/clip status, gadget tones, mixer, tempo, and swing, but the
on-disk/container schema is proprietary and undocumented. Autosave cadence,
atomic-save behavior, crash journal, backward/forward compatibility, checksum,
asset embedding, missing-gadget representation, and merge/conflict semantics
are `UNKNOWN`. [C-004] [C-025]

Documented interchange includes:

- Standard MIDI File import/export. [C-018]
- all-track or selected-track audio with optional tail; the precise supported
  bit-depth/sample-rate menu is unresolved. [C-008] [C-009]
- Ableton Live Project export with track audio or Gadget plug-in references;
  the latter requires desktop Gadget/Gadget Plug-ins. [C-018] [C-034]
- iCloud and Dropbox paths on iOS/Mac; Files and AudioShare on iOS. [C-018]
- QR-code import of Switch projects into iOS. [C-019]
- SoundCloud-powered GadgetCloud; an editable project-collaboration contract is
  not documented. [C-021]

KORG says iOS and Mac ideas can be shared with iCloud/Ableton projects, but it
also explicitly says VR projects are incompatible. PS5 interchange is not
documented; Switch transfer is one-way in the retrieved evidence. There is no
documented AAF, OMF, ADM, MusicXML, DAWproject, or version-control workflow.
[C-019] [C-025]

## 14. Delivery, live, post-production, and specialized workflows

Delivery centers on stereo audio, per-track exports, Standard MIDI, and Ableton
handoff. There is no documented batch queue, DDP, loudness delivery report,
video/timecode/ADR, surround, immersive audio, or ADM workflow. [C-008]
[C-018] [C-028]

Live-oriented features are stronger: individual scene playback, clip loop/
one-shot modes, Ableton Link, controller transport/parameter mapping, and MIDI
clock following. Switch adds local/online up-to-four-person creation and Joy-
Con motion/haptics; VR/PS5 emphasize controller-based 360° performance, and VR
can mirror the headset view for an audience. [C-005] [C-010] [C-020]

These console collaboration modes are co-presence/co-performance features, not
evidence of durable project branching, cloud merge, or cross-platform session
locking. [C-019] [C-020]

## 15. Performance, reliability, security, and accessibility

KORG scales track/song count to device capability and recommends Freeze when a
larger project becomes sluggish. The current desktop update records targeted
bug fixes and “improved app stability”; the Help Center exposes startup/no-
sound, interrupted-sound, and Freeze guidance. No numeric scaling benchmark,
realtime deadline metric, recovery-time target, or rollback mechanism is
published. [C-008] [C-029]

Minimum documented desktop requirements are macOS Big Sur+ or Windows 11
64-bit for the plug-ins, 8 GB RAM, 8 GB storage, and internet access; iOS needs
iOS 13+ and specified relatively recent devices. VR supports named Meta Quest
headsets, with Steam requiring Windows; PS5 is a separate target. [C-003]

Apple's listing says contact information and user content may be linked to the
user, while identifiers, usage data, and diagnostics may be collected without
linkage. It also says KORG has not declared supported accessibility features
for the iOS app. This is vendor/platform metadata, not an audit. [C-023]

No equivalent desktop/console accessibility conformance, custom plug-in UI
accessibility contract, threat model, telemetry controls, plug-in trust
boundary, signing/notarization design, or crash-isolation policy was found.
[C-017] [C-033]

## 16. Licensing, ecosystem, and implementation constraints

The Gadget family is commercially sold/download-delivered software; no
open-source product license was documented. Current public pricing evidence
lists $39.99 plus IAP for iOS, $299 regular price for the Mac app in KORG's
comparison chart, and free Le editions. Desktop 3.1.7 is delivered as a free
update through KORG Software Pass. Switch, VR, and PS5 are sold by DETUNE under
their platform-store channels. [C-022] [C-030]

iOS content entitlement is fragmented: some gadgets are included, some are
IAP, and others depend on purchasing separate KORG apps. Apple marks Family
Sharing but qualifies that only some IAP/subscriptions may be shareable. The
desktop app includes the plug-in collection, while the separate Mac/PC plug-in
package does not imply ownership of the Mac sequencer. [C-001] [C-011] [C-022]

The product-specific KORG Shop pages were inaccessible during this pass, so
desktop seat/device count, perpetual versus subscription wording, offline
authorization period, transfer/deactivation, cross-platform entitlement, and
upgrade policy are `UNKNOWN`. Internet access is required by the published
requirements, but its purpose and offline behavior are not stated. [C-003]
[C-032]

KORG lawfully distributing AU/VST/VST3/AAX providers is evidence of KORG's
product support, not a license grant to a new DAW implementer. Format SDK,
trademark, signing, validation, certification, and redistribution rights must
be obtained from their owners under then-current terms. The unnumbered `VST`
label must not be used to assume a new VST2 implementation right. No legal
advice is offered. [C-014] [C-031]

## 17. Strengths, liabilities, and architecture lessons

### Strengths

- **Coherent object model:** one gadget per track and scene/clip intersections
  constrain complexity and make the arrangement legible. [C-004] [C-005]
- **Native depth without host breadth:** 45 curated devices cover generated,
  sampled, recorded, processed, and external-MIDI material. [C-011] [C-026]
- **Fast discovery:** category/favorite device browsing plus searchable,
  previewable programs avoids generic plug-in-manager complexity. [C-012]
- **Pragmatic handoff:** Ableton export offers rendered or provider-reference
  paths rather than pretending one representation fits all users. [C-018]
- **Touch/controller fit:** scale/chord/arp, MIDI learn, Native Mode, Joy-Con,
  and immersive controller layouts adapt one core idea to input context.
  [C-020] [C-027]

### Liabilities

- Mixer/routing depth is narrow compared with a general DAW; PDC, buses,
  multi-output, and arbitrary sidechains are not documented. [C-007] [C-009]
- No third-party hosting contract, plug-in manager, isolation story, or failure
  diagnostics are public. [C-016] [C-017]
- Platform parity is fragmented: Windows is provider-only, console/VR have 16
  gadgets, VR projects are incompatible, and PS5 exchange is unknown. [C-019]
  [C-020]
- Proprietary project and engine internals limit its value as an implementation
  reference beyond user-visible clean-room patterns. [C-009] [C-025]
- iOS accessibility metadata is undeclared and other platforms are unknown.
  [C-023] [C-033]

Suitability conclusion: Gadget is a strong reference for a bounded mobile-first
composition model and deliberate native-device UX, but a weak primary reference
for a cross-platform third-party plug-in host. [C-031]

## 18. Transferable patterns

| Pattern | Problem / minimal mechanism | Supporting claims | Prerequisites and tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Ordered scene/clip grid | Represent song sections as ordered scenes; store one independently sized clip per track/scene cell, with loop/one-shot and per-scene tempo/repeat metadata. | [C-004] [C-005] | Needs deterministic scene transition and clip phase rules. Easier than a free timeline, but weaker for detailed linear audio editing. | Medium: do not copy UI expression; prototype polymeter and transition semantics. | `CANDIDATE` |
| One primary native device per track | Bind each track to one sound-producing/processing device and expose a compact track mixer. | [C-004] [C-007] | Requires broad native content or a clean device abstraction. Simplicity conflicts with arbitrary chains/routing. | Low for the abstract constraint; high if presented as the only architecture. | `CONDITIONAL` |
| Render-or-reference DAW handoff | Export each track as audio for durability or as a compatible provider reference for editability. | [C-018] [C-034] | Must version device state/assets and provide clear fallback/missing-provider diagnostics. References are less portable than stems. | Medium; requires interoperability tests rather than assumed fidelity. | `CANDIDATE` |
| Native device/program discovery split | First browse devices by category/favorite, then search/preview programs inside the selected device. | [C-012] | Needs normalized native metadata and fast preview. Does not replace third-party scanning. | Low; keep separate from plug-in validation/cache UX. | `CANDIDATE` |
| Dedicated audio utility devices | Represent recording, guitar/bass input, one-shot, sliced-loop, melodic-sample, and long-loop tasks as purpose-built devices. | [C-026] | Requires shared asset lifecycle underneath or risks silos and inconsistent editing. | Medium; use common media primitives despite specialized surfaces. | `CONDITIONAL` |
| Capability-scoped platform variants | Preserve the central interaction model while reducing gadget count and specializing controls for console/VR. | [C-020] | Requires explicit project capability/version negotiation. Gadget's own family shows incompatibility risk. | High without a portable project core. | `CONDITIONAL` |

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected architectural readings

- **Reject “loadable means host.”** Gadget AU/VST/VST3/AAX/AUv3 artifacts are
  providers for other hosts; they do not evidence arbitrary plug-in loading in
  Gadget. Reopen only with a current official host matrix or a later safe probe
  showing a third-party browser/instance. [C-013] [C-016]
- **Reject one opaque family entitlement/project promise.** Products differ by
  vendor storefront, gadget count, OS, and project compatibility. Reopen only
  with a formal entitlement and project-version compatibility table. [C-019]
  [C-020] [C-032]
- **Reject effect-name routing inference.** An IFX called Side Chain does not
  establish arbitrary inter-track sidechain buses. Reopen with routing manual
  or recorded fixture. [C-007] [C-009]
- **Reject `VST` ⇒ VST2 normalization.** KORG does not number the legacy label;
  a new implementation also has independent licensing constraints. [C-014]

### CURIOSITY_NO_GO threads

- `CURIOSITY_NO_GO`: legacy 2015 Gadget Guide—stale for the current 45-device
  catalog and lower value than the 2024/2025 Studio Guide.
- `CURIOSITY_NO_GO`: exhaustive gadget parameter inventory—high cost and would
  not change the host/architecture conclusion.
- `CURIOSITY_NO_GO`: community reports of AU/VST hosting—cannot prove current
  vendor support or proprietary internals.
- `CURIOSITY_NO_GO`: screenshot/video mining—manual text already resolves the
  user-visible model with stronger provenance.
- `CURIOSITY_NO_GO`: VR manual and remaining legacy FAQ pagination—likely
  duplicate interaction details after explicit platform/project evidence.
- `CURIOSITY_NO_GO`: retailer license summaries—stale/secondary compared with
  the inaccessible product store and official comparison chart.
- `CURIOSITY_NO_GO`: bypassing/automating purchase or login flows—prohibited,
  unnecessary, and outside public clean-room research.
- `CURIOSITY_NO_GO`: dynamic console/plug-in tests in this wave—no installation
  is authorized; preserve them as later disposable-fixture probes.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and result | Status / counterevidence | Later discriminating probe |
| --- | --- | --- | --- |
| H1: “Mac/PC” means the full sequencer runs on Windows. | Compared overview buy links, requirements, and comparison chart. | **Falsified.** Mac has the full app; Windows has the plug-in package. [C-001] | None needed unless KORG announces a Windows app. |
| H2: Gadget hosts arbitrary AU/VST/VST3 plug-ins because it ships those formats. | Searched current overview/spec/manual/catalog/FAQ for host, scan, instantiate, validation, or plug-in browser language. | **Not supported.** All affirmative format language is provider-facing; categorical non-support remains an inference. [C-013] [C-016] | Install one signed benign third-party instrument in a disposable iOS/macOS fixture; inspect Gadget's add-track/device UI and record version/screen. |
| H3: every Gadget is available as iOS AUv3. | Checked overview footnotes against catalog. | **Falsified.** Audio/MIDI and KORG-app-dependent gadgets are excluded. [C-015] | Enumerate AUv3 components from a clean current install if exact subset matters. |
| H4: an accepted format logo proves the complete host/provider contract. | Looked for buses, PDC, state, missing-provider, UI, and failure details. | **Falsified as an evidentiary method.** Those contracts remain `UNKNOWN`. [C-017] | Run format-owner conformance tools plus DAW fixtures for scan, instantiate, render, automate, save/reopen, offline bounce, and crash. |
| H5: Ableton plug-in export is fully editable and portable. | Read Studio Guide export language and prerequisite note. | **Unconfirmed.** Audio/reference modes exist; state/assets/automation fidelity is unspecified. [C-018] [C-034] | Export a project containing automation and imported samples; open with/without providers on Mac/Windows and diff audio/state. |
| H6: all Gadget-family projects round-trip. | Compared overview, Studio Guide, Switch, VR, and PS5 pages. | **Falsified.** VR is explicitly incompatible; Switch evidence is QR-to-iOS; PS5 is unknown. [C-019] | Build a capability/version matrix using vendor fixtures for each pair. |
| H7: Freeze provides conventional reversible track freeze. | Read command and specifications. | **Unconfirmed.** Only CPU reduction is documented. [C-008] [C-009] | Freeze/unfreeze a track with imported assets and automation; inspect editability, invalidation, render format, and recall. |

The required distinctions remain explicit: a format can be named, a provider
can be installed/scanned by another DAW, an instance can load, and the full
processing/state contract can still fail. No documentary evidence collapses
those stages. [C-014] [C-017]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Full Gadget 3 song apps are iOS/macOS; Mac includes plug-ins; Mac/PC has a plug-in-only package; restricted Le editions exist on iOS/macOS. | Current family | S-001, S-002 | Direct product and comparison language. | “Mac/PC” in update headlines can mislead; buy links/spec chart disambiguate. |
| C-002 | DOCUMENTED | High | Desktop app/plug-ins are 3.1.7; Apple lists iOS executable 6.3.4 under Gadget 3 branding; Switch/VR/PS have separate release axes. | Cutoff snapshot | S-005–S-008, S-010 | Current update/platform listings. | Apple page shows “Jul 1” without a year in fetched text; no year is asserted for 6.3.4. |
| C-003 | DOCUMENTED | High | Mac requires Big Sur+, Windows plug-ins require Windows 11 64-bit, iOS requires 13+, and named VR/PS platforms differ. | Current requirements | S-002, S-007, S-008, S-010 | Direct requirement text. | KORG says specs may change; Windows standalone is not listed. |
| C-004 | DOCUMENTED | High | Song saves scene/clip status, gadget tones, mixer, tempo/swing; track owns one gadget; clip is a track's data in a scene. | Studio Guide E5 | S-003 | Manual pp. 5–6. | Internal schema unknown. |
| C-005 | DOCUMENTED | High | Scenes have bars/signature/repeat/tempo/smooth/fades; clips can differ in bar count and loop/one-shot; Genre Select becomes an editable song. | Studio Guide E5 | S-003, S-011 | Manual pp. 16, 28–35; feature article. | Exact transition scheduler unknown. |
| C-006 | DOCUMENTED | High | Piano-roll note editing, realtime recording, quantization, parameter capture/lane editing, and track undo/redo are exposed. | Studio Guide E5 | S-003 | Manual pp. 22–30, 37–45. | Automation identity/sample accuracy unknown. |
| C-007 | DOCUMENTED | High | Mixer exposes fader/pan/reverb send/solo/mute and five IFX per track, with compact master effects; 19 IFX types are listed. | Current app | S-002, S-003 | Specs and manual mixer pages. | IFX “Side Chain” does not prove arbitrary bus input. |
| C-008 | DOCUMENTED | High | Tracks/songs scale with device; Freeze reduces CPU; iOS exposes latency setting; audio can render all/one track with tail. | iOS/Mac user contract | S-002, S-003 | Specs and manual pp. 32, 48, 50–51. | Freeze and export internals unknown. |
| C-009 | UNKNOWN | High impact | Precision, complete sample-rate set, buffers, scheduling, PDC, dropout, offline path, graph, diagnostics, and Freeze internals are not publicly resolved. | Engine | S-001–S-005 | Targeted product/manual/spec review; manual has WAV wording inconsistency. | Requires engineering disclosure or runtime measurement. |
| C-010 | DOCUMENTED | High | External/Bluetooth MIDI, per-track device/channel input, CC learn, Link, clock receive but no transmit, and Taipei MIDI output are supported. | iOS/Mac where documented | S-001–S-004 | Manual pp. 25–26, 46–47; product/catalog. | MPE/MIDI 2.0/SysEx/MTC unknown. |
| C-011 | DOCUMENTED | High | Current core catalog has 45 gadgets/6,000+ programs across synth, drum, sample, audio, and MIDI roles; iOS entitlements vary. | Current catalog | S-001, S-002, S-004, S-005 | Specs/catalog/update. | Catalog retains some stale “Gadget 2” IAP footnotes. |
| C-012 | DOCUMENTED | High | Native Gadget Browser supports category/favorites/search and Sound Browser supports program search/preview. | Gadget 3 UI | S-001, S-011 | Direct feature description. | Not a third-party scanner. |
| C-013 | DOCUMENTED | High | KORG positions Gadget AU/VST/VST3/AAX/AUv3 artifacts as providers loaded by other DAWs/apps. | Plug-in packages | S-001–S-003 | “used with your favorite DAW”; AUv3 in GarageBand/Logic. | Does not itself prove host absence. |
| C-014 | DOCUMENTED | High | KORG lists Mac AU/VST/VST3/AAX/NKS and Windows VST/VST3/NKS, 64-bit; Windows AAX is future/pending; NKS 2 arrived in 3.1.7. | Desktop 3.1.7 | S-002, S-004, S-005 | Direct matrices/release note. | `AU` and `VST` generations are unnumbered; compatibility list itself is dated 2024. |
| C-015 | DOCUMENTED | High | iOS AUv3 excludes named audio/MIDI and KORG-app-dependent gadgets; DeeMax/some libraries are excluded from desktop plug-in package. | Provider subsets | S-001, S-004 | Product footnotes/catalog. | Exact current AUv3 component count not stated. |
| C-016 | INFERENCE | Medium | Current Gadget should be treated as a closed native-gadget sequencer with no documented arbitrary third-party plug-in hosting. | Current documentary scope | S-001–S-004, S-009 | Multiple official surfaces only describe native selection and outward providers. | Absence is not proof of impossible behavior; later safe probe can falsify. |
| C-017 | UNKNOWN | High impact | Third-party scanning, isolation, buses, latency, state, UI, recovery, missing-provider, and failure diagnostics are undocumented. | Host/provider contract | S-001–S-005, S-009 | Explicit contract checklist searched across primary docs. | Provider behavior may be governed by containing DAW; needs fixtures. |
| C-018 | DOCUMENTED | High | SMF, audio, Ableton Project, iCloud/Dropbox, Files/AudioShare, and Link boundaries exist; Ableton export can use audio or Gadget providers. | iOS/Mac | S-001–S-003 | Product/spec/manual export sections. | Exact format values and reference fidelity unknown. |
| C-019 | DOCUMENTED | High | Switch projects can be imported into iOS by QR code, while VR projects are explicitly incompatible with other Gadget projects. | Cross-platform projects | S-001, S-003, S-006, S-007 | Explicit overview/manual/platform statements. | PS5 interchange and a Switch reverse path remain unknown under C-025. |
| C-020 | DOCUMENTED | High | Switch has 16 gadgets and four-person modes; VR and PS5 have 16-gadget, Switch-derived 360° interfaces; DETUNE co-developed/sells them. | Console/VR family | S-006–S-008 | Direct product pages. | Does not prove shared engine or file format. |
| C-021 | INFERENCE | Medium | SoundCloud-powered GadgetCloud should not be treated as documented editable project collaboration. | iOS/current specs | S-002, S-009 | Direct service label plus lack of a project-collaboration contract in the reviewed support surface. | Service behavior/account lifecycle not deeply documented; absence is not proof. |
| C-022 | DOCUMENTED | High | iOS is $39.99 + IAP; KORG chart lists Mac $299 and free Le; desktop updates use Software Pass; DETUNE products use platform stores. | Commercial packaging | S-002, S-005–S-008, S-010 | Vendor/platform store metadata. | Prices vary by region/time; detailed license terms inaccessible. |
| C-023 | DOCUMENTED | High | Apple reports specified privacy categories and no developer-declared iOS accessibility features. | iOS listing | S-010 | Platform-owner metadata. | Not an independent privacy/accessibility audit. |
| C-024 | DOCUMENTED | High | VR and PlayStation use Unreal Engine and a Switch-derived interaction model. | Public architecture | S-007, S-008 | Explicit platform-product statements. | Shared audio code or project format cannot be inferred. |
| C-025 | UNKNOWN | High impact | Project schema, atomicity/recovery, asset model, compatibility, merge, and missing-dependency behavior are unresolved. | Persistence | S-003, S-006–S-008 | Manual documents saved concepts, not representation. | Requires format docs or controlled project corpus. |
| C-026 | DOCUMENTED | High | Dedicated gadgets cover audio recording/input effects, one-shot/melodic/loop/REX/long-loop sample workflows and time stretch. | Native devices | S-004 | Direct catalog descriptions. | File extensions/asset semantics incomplete. |
| C-027 | DOCUMENTED | High | KORG Native Mode and generic MIDI control are supported; named KORG controllers receive deeper mapping/display. | Controller integration | S-001, S-003 | Product/manual. | Detailed protocol/versioning unpublished. |
| C-028 | UNKNOWN | Medium | Takes/comping/notation, general warp, video/post features, MPE, MIDI 2.0, SysEx, and MTC are not resolved by current docs. | Editing/MIDI scope | S-003 | Current manual coverage checked. | Absence from one guide is not universal non-support. |
| C-029 | DOCUMENTED | Medium | Freeze/startup/interrupted-audio help exists and 3.1.7 lists bug/stability fixes, but no numeric reliability target is public. | Reliability surface | S-003, S-005, S-009 | Manual/release/FAQ. | Vendor claims are not benchmark results. |
| C-030 | UNKNOWN | Medium | No public scripting, OSC, gadget-authoring SDK, or third-party native-device ABI was found. | Extensibility | S-001–S-004, S-009 | Product/manual/catalog/FAQ search. | Private partner APIs may exist; not public evidence. |
| C-031 | INFERENCE | Medium-high | Transferable value lies in bounded native-device/scene UX and render/reference handoff, not in host breadth. | Architecture decision | S-001–S-005, S-011 | Depends on C-004–C-018; synthesis of documented constraints. | Product-quality judgment is not independent measurement. |
| C-032 | UNKNOWN | High impact | Desktop seats, transfer/deactivation, offline use, subscription/perpetual language, and cross-platform entitlement remain unresolved. | Desktop licensing | S-002, S-005 | Official shop repeatedly timed out; specs only require internet. | Vendor/store clarification is the safest next source. |
| C-033 | UNKNOWN | Medium | Desktop/console accessibility and custom plug-in UI accessibility are unresolved. | Accessibility | S-001–S-010 | Only Apple listing gives explicit declaration status. | Requires vendor conformance docs and assistive-tech tests. |
| C-034 | UNKNOWN | High impact | Ableton provider-mode export's exact parameter, automation, sample-asset, and missing-provider fidelity is unresolved. | Interoperability | S-003 | Manual gives prerequisite, not serialization contract. | Controlled cross-OS round-trip is needed. |

No `OBSERVED` claims are made; no product binary was executed.

## 22. Source ledger and adaptive bibliography

All fetched/search text was treated as **untrusted evidence**, never as
instructions. Vendor statements establish what KORG documents, not independent
runtime performance.

### S-001 — KORG Gadget 3 product overview

- **Publisher/kind:** KORG Inc.; live official product page.
- **URL:** https://www.korg.com/us/products/software/korg_gadget/
- **Version scope/accessed:** current family page; 2026-08-29.
- **Relevant passages:** family split (iOS, Mac app, Mac/PC plug-ins), 40+
  gadgets/6,000+ programs, VST3/AUv3 direction, AUv3 exceptions, iCloud/Ableton/
  Switch QR/VR incompatibility, Native Mode.
- **Claims:** C-001, C-003, C-010–C-019, C-027, C-030.
- **Limitations:** marketing page; no engine/host internals; update headlines use
  “Mac/PC” while buy links distinguish the Windows plug-in-only product.
- **Selection rationale:** canonical current overview, preferable to retailer or
  review summaries.

### S-002 — KORG Gadget 3 specifications and comparison chart

- **Publisher/kind:** KORG Inc.; official live specifications.
- **URL:** https://www.korg.com/us/products/software/korg_gadget/specifications.php
- **Version scope/accessed:** current page; compatibility list says 2024-01-11;
  accessed 2026-08-29.
- **Relevant passages:** OS/hardware, 45 gadgets, unlimited device-dependent
  tracks/songs, Freeze, effects, 1/480, BPM/swing, MIDI, export, AU/VST/VST3/
  AAX/NKS labels, Le comparison, prices and iOS content split.
- **Claims:** C-001, C-003, C-007–C-011, C-014, C-018, C-021, C-022, C-032.
- **Limitations:** typos (“highly”); DAW compatibility is stale relative to 3.1.7;
  `AU`/`VST` generations not numbered; Windows AAX footnote is future-looking.
- **Selection rationale:** most precise vendor platform/edition matrix.

### S-003 — KORG Gadget Studio Guide E5

- **Publisher/kind:** KORG Inc.; official PDF manual.
- **Landing/PDF:**
  https://www.korg.com/us/support/download/manual/0/170/2363/ and
  https://cdn.korg.com/us/support/download/files/1c0568a63312535696f1181ace7f340b.pdf
- **Integrity/access:** downloaded to approved temporary storage only; SHA-256
  `982ac05a1dc5243f188d6d4d99b2dcf5dcb86a841bffa75e8a704a4f6cadf3ae`;
  accessed 2026-08-29. Landing updated 2025-05-30; PDF says published 10/2024.
- **Relevant sections:** pp. 5–6 components/persistence; 14–27 song/mixer/edit;
  28–45 recording/scenes/automation; 46–48 MIDI/Link/settings; 49–51 import/export.
- **Claims:** C-004–C-010, C-013, C-018, C-019, C-024–C-029, C-034.
- **Limitations:** iOS-focused examples; export prose conflicts on fixed versus
  selectable WAV settings; no plug-in-provider manual/host contract.
- **Selection rationale:** strongest primary evidence for the conceptual model.

### S-004 — Gadget Collection and plug-in comparison

- **Publisher/kind:** KORG Inc.; official current catalog.
- **URL:** https://www.korg.com/us/products/software/korg_gadget/gadget_collection.php
- **Version scope/accessed:** Gadget 3 live catalog; 2026-08-29.
- **Relevant passages:** device roles, audio/sample/MIDI gadgets, 45-item Mac/PC
  provider chart, DeeMax exception, Windows AAX future footnote.
- **Claims:** C-010, C-011, C-014–C-017, C-026, C-030.
- **Limitations:** several IAP notes still name Gadget 2; catalog descriptions do
  not define shared media or plug-in bus/state contracts.
- **Selection rationale:** canonical inventory, preferable to third-party lists.

### S-005 — Gadget 3 version 3.1.7 update

- **Publisher/kind:** KORG Inc.; official release note/news.
- **URL:** https://www.korg.com/us/news/2026/0410/
- **Version scope/accessed:** Mac and Mac/PC plug-ins 3.1.7; 2026-08-29.
- **Relevant passages:** exact versions, NKS 2, content and stability fixes,
  Software Pass update delivery.
- **Claims:** C-002, C-005, C-011, C-014, C-017, C-022, C-029.
- **Limitations:** no iOS version or authorization details; vendor stability
  language is not independent testing.
- **Selection rationale:** newest exact desktop build evidence at cutoff.

### S-006 — KORG Gadget for Nintendo Switch

- **Publisher/kind:** KORG Inc.; official product page.
- **URL:** https://www.korg.com/us/products/software/korg_gadget_for_nintendo_switch/
- **Version scope/accessed:** live store-linked page, v3 news lineage from 2019;
  2026-08-29.
- **Relevant passages:** 16 gadgets, Joy-Con, up-to-four local/online users,
  DETUNE commercial boundary.
- **Claims:** C-002, C-019, C-020, C-022, C-025.
- **Limitations:** old release history; QR direction is clearer in S-001/S-003;
  project internals absent.
- **Selection rationale:** primary platform-variant source.

### S-007 — KORG Gadget VR

- **Publisher/kind:** KORG Inc.; official product page.
- **URL:** https://www.korg.com/us/products/software/korg_gadget_vr/
- **Version scope/accessed:** 2024 full release; accessed 2026-08-29.
- **Relevant passages:** 16 gadgets, Switch-derived UI, Quest/Steam-Windows,
  Unreal Engine, mirroring, DETUNE.
- **Claims:** C-002, C-003, C-019, C-020, C-022, C-024, C-025.
- **Limitations:** headset support statement dated 2024; incompatibility comes
  from S-001; no audio/project architecture.
- **Selection rationale:** canonical VR parity source.

### S-008 — KORG Gadget for PlayStation

- **Publisher/kind:** KORG Inc.; official product page.
- **URL:** https://www.korg.com/us/products/software/korg_gadget_for_playstation/
- **Version scope/accessed:** PS5 product launched 2025; accessed 2026-08-29.
- **Relevant passages:** 16 gadgets, Switch-derived 360° controller interface,
  Unreal Engine, DETUNE.
- **Claims:** C-002, C-003, C-020, C-022, C-024, C-025.
- **Limitations:** no project exchange, export, collaboration, or accessibility
  statement.
- **Selection rationale:** only primary source for newest family branch.

### S-009 — KORG Gadget for iOS Help Center category and FAQ index

- **Publisher/kind:** KORG Inc./KORG app Help Center; official support taxonomy.
- **URLs:**
  https://support.korguser.net/hc/en-us/categories/200046380-Korg-Gadget and
  https://support.korguser.net/hc/en-us/sections/200139445-FAQ
- **Version scope/accessed:** live iOS help center; 2026-08-29.
- **Relevant passages/titles:** startup/no sound, sound interruption, Freeze,
  scene arrangement, automation deletion, external MIDI, Audiobus/Inter-App
  Audio, GadgetCloud, IAP re-download.
- **Claims:** C-016, C-017, C-021, C-029, C-030, C-033.
- **Limitations:** taxonomy/title evidence; not exhaustive proof of absence;
  iOS-only and many articles are legacy.
- **Selection rationale:** official negative-search surface and recovery-topic
  locator, preferable to forum anecdotes.

### S-010 — Apple App Store: KORG Gadget 3

- **Publisher/kind:** Apple platform listing with KORG-supplied metadata.
- **URL:** https://apps.apple.com/us/app/korg-gadget-3/id791077159
- **Version scope/accessed:** version 6.3.4 listing; 2026-08-29.
- **Relevant passages:** price/IAP, iPhone/iPad and iOS 13+, version, privacy,
  languages, Family Sharing qualification, accessibility declaration status,
  AUv3 provider direction.
- **Claims:** C-002, C-003, C-013, C-022, C-023.
- **Limitations:** fetched text omits year beside “Jul 1”; privacy/accessibility
  are declarations, not audits; regional price.
- **Selection rationale:** authoritative current platform/package metadata.

### S-011 — KORG Gadget 3 Main New Features

- **Publisher/kind:** KORG app Help Center; official feature article.
- **URL:** https://support.korguser.net/hc/en-us/articles/27749366976281-KORG-Gadget-3-Main-New-Features
- **Version scope/accessed:** updated 2024-08-23; accessed 2026-08-29.
- **Relevant passages:** Gadget/Sound Browser, favorites/search/preview, Genre
  Select, IFX and Play-page changes.
- **Claims:** C-005, C-012.
- **Limitations:** feature summary, no engine or hosting contract.
- **Selection rationale:** triangulates browser/workflow claims from the manual
  and product page.

### Negative-result and access ledger

- `N-001`: two official-site web searches returned HTTP 429; later searches for
  Software Pass/license terms also returned 429. Search snippets were not used
  as evidence.
- `N-002`: guessed `/products/software/korg_gadget_3/` returned 404; canonical
  product URL is S-001.
- `N-003`: direct PDF web fetch reported unsupported `application/pdf`; one
  approved-temp download was verified and parsed successfully as S-003. The
  stale 2015 Gadget Guide was not retried.
- `N-004`: Gadget series store landing and both direct KORG Shop product pages
  timed out. No purchase/login controls were bypassed.
- `N-005`: guessed KORG Software Pass product URL returned 404; the official
  product FAQ only redirected to S-009.
- `N-006`: nested discovery was attempted for the bounded license/hosting FAQ
  gap but was rejected by the configured subagent depth limit; no child was
  spawned and no file was edited.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / blocker | Decision impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| Does current iOS/macOS Gadget instantiate any third-party AU/AUv3/VST? | Product/spec/manual/catalog/FAQ negative search; absence is not proof. | Critical to host architecture classification. | Disposable signed test plug-in/AUv3, clean install, screen/version capture; no production credentials. | Unassigned |
| Scan/cache/validation/quarantine/recovery | No host manager documented. | Critical for robust host design. | If hosting is found, trace add/rescan UX and inject one intentionally invalid benign component in an isolated VM/device. | Unassigned |
| Provider buses, sidechain, multi-out, latency/tail, offline render | No provider SDK/operation manual found. | High interoperability risk. | Format-owner inspector/conformance tool plus a minimal DAW matrix on Mac/Windows. | Unassigned |
| Provider parameter IDs/state/presets/assets/migration | App persistence is conceptual only; host chunks undocumented. | High project-durability risk. | Save/reopen and cross-version/cross-OS fixtures with automation and imported samples; hash rendered output. | Unassigned |
| Engine precision/rates/buffers/PDC/scheduling | Specs/manual shallow and WAV wording conflicts. | High for engine comparison. | Vendor engineering clarification, then loopback/impulse/latency measurements in a disposable harness. | Unassigned |
| Freeze representation and invalidation | Only CPU reduction documented. | Medium for recovery/edit model. | Freeze/unfreeze edits, asset relocation, parameter change, project reopen, and version upgrade. | Unassigned |
| Project schema/recovery/compatibility/missing gadgets | Proprietary; no format document. | High for durable project architecture. | Corpus of minimal projects across versions/editions; black-box file/behavior diff without decompilation. | Unassigned |
| Ableton provider-mode fidelity | Manual names audio/provider alternatives but no serialization contract. | High for handoff recommendation. | Export automated/sample-based song; open with/without providers on both desktop OSes and compare state/audio. | Unassigned |
| Desktop licensing/authorization | KORG Shop timed out; no bypass; specs only say internet required. | Medium for procurement/offline resilience. | Ask KORG sales/support for current EULA, seat, offline, transfer, and cross-grade terms. | Unassigned |
| Exact AU/VST generations | KORG says `AU` and `VST` without version numbers. | Medium for legacy-format/legal planning. | Inspect signed installed component metadata in a licensed disposable installation or obtain vendor format matrix. | Unassigned |
| Console/VR/PS5 project capability matrix | VR incompatibility and one-way Switch path documented; PS5 sparse. | Medium for portability lesson. | Vendor clarification or minimal export/import attempts on separately licensed test devices. | Unassigned |
| Accessibility beyond iOS declaration | No desktop/console conformance docs; custom UI behavior unknown. | Medium product-quality and UI-contract risk. | Vendor VPAT/statement plus VoiceOver, keyboard-only, scaling, contrast, and controller-remap tests. | Unassigned |

## 24. Curiosity pass and stop decision

Scores are 1–5; higher relevance/value/novelty is better, while higher cost is
worse.

| Candidate follow-up | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Current Studio Guide for scene/mixer/MIDI/export | 5 | 5 | 5 | 2 | **Pursued**; resolved the user model. |
| Current catalog + latest release | 5 | 5 | 5 | 2 | **Pursued**; resolved native roles and current desktop build. |
| Console/VR/PS platform pages | 5 | 4 | 5 | 2 | **Pursued**; resolved parity and vendor boundaries. |
| Official licensing/store pages | 5 | 4 | 4 | 2 | **Pursued but access-blocked**; repeated timeouts, then stopped. |
| Official Help Center host/authorization taxonomy | 4 | 4 | 4 | 2 | **Pursued**; yielded negative-host/recovery surface but no license contract. |
| Community host reports | 3 | 2 | 3 | 3 | `CURIOSITY_NO_GO`: cannot establish current vendor support/internals. |
| Legacy guide/exhaustive gadget parameters | 2 | 2 | 1 | 4 | `CURIOSITY_NO_GO`: stale or non-decision-changing. |
| More absence searching for formats | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: repeated duplicates; absence cannot prove a universal negative. |
| Dynamic installation/conformance | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO` for this wave; preserve as bounded next-phase probes. |

### Gaps and contradictions at stop

- The family branding and executable versions do not share one number; both are
  recorded rather than reconciled. [C-002]
- The manual's fixed WAV sentence conflicts with its selectable-format sentence.
  [C-009]
- KORG's `AU`/`VST` labels do not state AUv2/VST2 generations. [C-014]
- Windows AAX is future-looking, not current. [C-014]
- Store/license access was blocked, leaving desktop authorization unknown.
  [C-032]
- No public evidence establishes third-party hosting or its contract. [C-016]
  [C-017]

### Stop decision

**STOP — coverage achieved with explicit unknowns and documentary saturation.**
All required sections and format rows are complete. Primary KORG documentation,
the current manual, release note, platform branches, official FAQ taxonomy, and
Apple listing converge on the native-gadget/provider interpretation. Another
web pass is unlikely to change the architecture conclusion; remaining high-
value gaps require vendor clarification or controlled interoperability probes.
The budget also encountered repeated 429/timeouts and the nested-agent depth
boundary. No unsafe access or binary execution is justified.

## 25. Completion checklist

Checks copied from `RESEARCH-CONTRACT.md`:

- [x] **Only the assigned dossier path was edited.** This research action added
  only `research/daw-landscape/dossiers/korg-gadget.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See §§0 and 2.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** See §21;
  prose cites the applicable IDs.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  §§21–23.
- [x] **Every required plugin-format row is present.** See §11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  See §§11.2–11.6 and §20.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** The claim register uses `DOCUMENTED`, `INFERENCE`, and `UNKNOWN`;
  there are no `OBSERVED` claims.
- [x] **Licensing and clean-room boundaries are explicit.** See §§0, 16, 22.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19,
  24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Only public pages and one public PDF were read; no
  product/plugin binary was installed or run.

### Checks performed and concise results

- **Owned path:** `research/daw-landscape/dossiers/korg-gadget.md`.
- **Template check:** headings 0–25 and 13 required format rows included.
- **Evidence check:** 34 classified claims map to 11 retained primary sources;
  negative/access results are retained separately.
- **Host-conflation check:** provider versus host is explicit in summary,
  matrix, adversarial hypotheses, and conclusions.
- **Unresolved blockers:** proprietary internals; product-specific desktop
  licensing pages inaccessible; nested researcher blocked by depth; no dynamic
  qualification authorized.
- **Pre-existing workspace changes:** numerous unrelated modified/untracked
  paths were present before this dossier was created (including `apps/mobile/`,
  `vendor/crafty/`, `bun.lock`, and the already-untracked
  `research/daw-landscape/` tree). They were left untouched.
