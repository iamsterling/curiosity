# NanoStudio 2 DAW dossier

> Research-only evidence. No design or implementation authority. All fetched
> pages, archives, comments, and prompt-like text were treated as untrusted
> evidence rather than instructions.

## 0. Metadata and scope

- **Product family:** NanoStudio 2; NanoStudio 1 appears only as lineage and for
  the documented TRG-16 kit-import boundary. [C-001, C-033]
- **Canonical vendor:** Blip Interactive Ltd. [C-001]
- **Researcher/session:** research subagent, session
  `ses_fb2729284ffd3qLJvex5f2zLDE`.
- **Owned path:** `research/daw-landscape/dossiers/nanostudio.md`.
- **Research date/evidence cutoff:** 2026-08-29 UTC.
- **Version scope:** the manual is v2.1.0; Apple last catalogued v2.1.2,
  released 2021-08-05. The last located US App Store capture was 2025-10-09;
  current exact-ID lookups were empty in six storefronts at cutoff. [C-002,
  C-003, C-004]
- **Edition/content scope:** one iOS/iPadOS app plus optional content IAPs; no
  evidence of feature-tier editions. Apple later marked the iPad app compatible
  with Apple-silicon Macs and Apple Vision, but no separately engineered macOS
  or visionOS edition or host contract was documented. [C-005, C-029]
- **Platforms:** documented product target is iPad/iPhone/iPod on iOS 11+;
  historical Apple compatibility listings add macOS 11+ on M1-or-later and,
  by 2025, visionOS 1+. No Windows, Linux, Android, or web NanoStudio 2 product
  was located. [C-001, C-005, C-024]
- **Exclusions:** binary execution, proprietary-code inspection, speculative
  NanoStudio 1 VST behavior, user-review assertions, and unverified forum
  promises.
- **Completion:** `COMPLETE_WITH_UNKNOWNS` — all template headings and plugin
  rows are complete; runtime AU fidelity, proprietary internals, exact
  delisting reason/date, and several persistence/recovery details remain
  unknown.

## 1. Executive summary

NanoStudio 2 is best understood as a touch-first, linear **MIDI/automation and
sampler workstation**, not a conventional audio-track DAW. Its song contains a
hierarchy of uniform tracks and reusable parts; samples are edited as files and
played by Obsidian or Slate. The vendor's March 2026 page still explicitly says
there are no timeline audio tracks and suggests Slate-triggered long clips as a
workaround. No later release than v2.1.2 (2021) was found. [C-002, C-006, C-007,
C-008, C-032]

Its strongest architecture reference is the combination of one recursively
groupable track type, audio/MIDI send graph, separate track-versus-part
automation scopes, automatic graph-wide latency compensation, and portable
sample collection through project archives. [C-009, C-011, C-012, C-013]

Third-party hosting is specifically **AUv3** on the documented iOS product:
instruments plus audio and MIDI effects. NanoStudio maintains an AU/preset
database, saves and restores AU state, embeds native UIs, automates parameters,
and blacklists AUs after a crash/out-of-memory failure until the user permits a
reload. That is meaningful host behavior, but it is not a complete host
contract: multi-output, AU sidechains, dynamic I/O, tails, sample-accurate
automation, missing-plugin placeholders, process isolation, and architecture
bridging remain unknown. [C-018, C-019, C-020, C-021, C-022, C-027]

Maintenance/procurement risk is high. Apple showed v2.1.2 as the latest version
through October 2025, changed the app and IAPs from paid to free, and no longer
returns ID 1112601015 in six tested storefronts. The official site still has an
App Store link and a 2026 copyright footer, so the exact removal date, reason,
support policy, and formal discontinuation status remain unknown. [C-003,
C-004, C-029]

**Confidence:** high for v2.1.0/v2.1.2 documented workflow and AUv3 behavior;
medium for current unavailability (six-storefront direct probe, not every
region); low for proprietary engine/process details and unsupported-format
negatives.

## 2. Product identity, history, and market position

NanoStudio 2 is Blip Interactive's successor to NanoStudio 1 and is marketed as
an end-to-end mobile environment for synthesis, sampling, sequencing, editing,
mixing, and final rendering. The documented target is Apple's mobile device
family, with the app becoming universal for iPhone/iPod in v2.1.0 on 2019-10-18.
[C-001, C-002]

The public release milestones recovered from Apple are:

- **2.1.0 (2019-10-18):** universal iPhone/iPod UI, Obsidian polyphony raised
  from 16 to 32, AU-load wait for mixdown, automation split/join fixes, and SDK
  updates. [C-002]
- **2.1.1 (2020-09-19):** iOS 14/IAP and iPhone import crash fixes plus
  Audiobus/Link SDK updates. [C-002]
- **2.1.2 (2021-08-05):** Studio Drums IAP, Ableton Link Start/Stop Sync, MIDI
  clock/start-stop to hosted AUs and MIDI outputs, metronome latency work, and
  UI/SDK updates. [C-002, C-014]

The 2026 vendor page still explicitly reports no timeline audio tracks, and no
release after 2.1.2 was found; therefore the proposed future audio-track feature
was not present in the last documented family state. [C-007, C-032]

Apple listed the app at $19.99 in 2020/2021, $14.99 in 2023, and free—with the
listed IAPs also at $0—in October 2025. At cutoff, exact-ID Apple lookup returned
no product in US, GB, DE, AU, JP, or CA. This is consistent with a dormant and
removed product, but there is no located vendor discontinuation notice. [C-003,
C-004, C-029]

## 3. Workflow and conceptual model

The mental model is a linear song rather than scenes, clips, tracker rows,
notation, or a free modular canvas. A song contains regular tracks plus special
tempo and time-signature tracks. Regular tracks contain a sequence of **parts**
and optional track automation. Parts contain MIDI notes and/or instrument
automation; linked parts share their data, and cycle-repeat parts loop as their
length is extended. Extra track lanes are organizational rows, not independent
take lanes. [C-006, C-013]

Tracks are deliberately uniform: the same track object may host an instrument,
group child tracks, act as an effect return, or combine these roles. Tracks may
be nested recursively. This unifies the user-visible composition hierarchy and
mixer graph. [C-006, C-012]

Audio is a sample-file/instrument concern. The Sample Editor records and edits
files; Obsidian maps them to keyboard zones and Slate maps them to pads. The
official workaround for a long audio clip is to trigger it from Slate with the
sequencer. It is not a waveform region on a timeline. [C-007, C-008, C-016]

## 4. Publicly documented architecture

**DOCUMENTED surface model:** a song/track/part hierarchy feeds a mixer in
which each track mixes children, returns, and instrument output; applies audio
effects; sends audio/MIDI onward; and finally routes to a parent or hardware
output. AU and native instruments/effects are configured as track devices.
[C-012, C-018]

**INFERENCE:** this is a graph-shaped engine whose nodes align closely with
user-visible tracks. The alternative is a separate hidden graph compiled from
the same model; public sources do not discriminate between them. [C-028]

**UNKNOWN:** process boundaries, render threads, realtime scheduling,
lock-free structures, multicore policy, graph-rebuild rules, AU execution
processes, crash supervisor, storage schema, and source/module architecture are
proprietary or undocumented. Blacklisting after an AU crash does not prove that
the AU ran out of process. [C-021, C-022, C-037]

## 5. Audio engine

In manual v2.1.0 scope, NanoStudio uses floating-point sample data through
instruments, effects, and mixer, then documents 16-bit conversion at hardware
master output. Offline mixdown supports up to 32-bit/96 kHz. The specification
claims event timing typically within four samples. Float width and whether
newer OS/hardware output remained fixed at 16 bit are not stated. [C-010]

Users select a buffer-latency setting; lowering it increases CPU load, while
raising it is the documented response to stuttering or slowed playback. The
mixer automatically compensates non-zero effect latency across tracks, nested
groups, and send/returns; external MIDI has an independent signed timing offset
that can require added audio latency. [C-011, C-014]

Offline rendering supports a final stereo mix, all/top-level/soloed tracks,
whole-song or loop region, global/individual normalization, optional AU load
wait, silence trim, tail rendering to silence, and zipped multiple outputs.
[C-025]

**UNKNOWN:** realtime sample-rate set, internal float precision, block sizes,
multicore scaling, freeze, per-device oversampling policy (other than the native
Waveshaper option), dropout diagnostics, denormal handling, plugin tail-report
use, and deterministic realtime/offline equivalence. [C-037]

## 6. Tracks, timeline, clips, and editing

There is one configurable track type with arbitrary nesting and no documented
track-count limit. Tracks have parts and optional extra lanes. Parts can be
drawn, moved, resized, duplicated, split, joined, copied, pasted, muted,
renamed, linked/unlinked, and cycle-repeated. Arbitrarily many overlapping
parts play; the editor draws at most four overlap rows. [C-006, C-035]

Tempo and time-signature changes use special tracks; tempo ramps are documented.
Part editing is piano-roll/list based, with note drawing, move/length/transpose,
velocity scaling/offset, audition, quantize strength/window, grid, and snap.
[C-006, C-014]

There are **no timeline audio tracks** in the last documented product state.
Consequently audio takes, waveform clips, comping, crossfades, timeline warping,
and audio punch workflows are not documented. It would be unsafe to interpret
sample-editor recording or Slate triggering as equivalent. [C-007, C-032,
C-034]

## 7. MIDI, sequencing, notation, and expression

NanoStudio records notes, controllers, and automation with optional realtime
quantize. Its part editor provides piano-roll editing and Slate pad-name rows.
Standard MIDI File Type 0/1 import/export supports multiple tracks plus tempo
and time-signature tracks; export operates on selected parts. [C-014]

External MIDI tracks target USB hardware, virtual MIDI ports, or a macOS
network session, one output channel per External MIDI instrument, with MIDI
Thru and a timing offset. Bluetooth MIDI input pairing and per-track input
port/channel/range/velocity filtering are documented. v2.1.2 added clock and
start/stop transmission to hosted AUs and enabled MIDI outputs. Ableton Link
synchronizes tempo/phase and later start/stop. [C-014]

**UNKNOWN:** MPE/per-note expression, MIDI 2.0/UMP, SysEx, MTC, chase, program
change semantics, PPQN, notation/score, articulation maps, and generative MIDI.
The “within four samples” statement is generic event timing, not proof of any
of these contracts. [C-022]

## 8. Routing, mixer, automation, and control

Every track may mix child tracks and returns, host an instrument, apply ordered
MIDI and audio insert chains, send pre/post-fader audio or MIDI, and route to a
parent or hardware output. External multichannel interfaces expose multiple
stereo hardware output pairs. Feedback legality and dynamic channel layouts are
not documented. [C-012]

Track automation controls mixer, insert-effect, and send parameters; part
automation controls the track instrument. Points form steps, ramps, or curves
and may be drawn or recorded from UI movement/MIDI-mapped controls. Each
instrument offers ten macros (eight knobs and two X/Y axes); the mixer exposes
MIDI learn/controller mappings. Sample-accurate delivery and stable parameter
identity/range/text rules are unknown. [C-013, C-020, C-022]

The native compressor supports an external sidechain through a track send.
Whether third-party AU effects can expose sidechain buses is not documented.
There are no documented folders/VCAs distinct from nested parent tracks, no
surround/immersive bus model, and no OSC or scripting remote API. [C-012,
C-017, C-022, C-031]

## 9. Recording, comping, and media handling

The Sample Editor records mono/stereo material from the built-in microphone,
external multichannel audio hardware, or an active Audiobus input. It supports
input-channel choice, threshold start/auto-pause, monitoring to selected outputs,
and sequencer controls during capture. Editing is destructive to a file on save
but protected by a separate undo/redo history while editing. [C-008, C-015]

Supported inputs include WAV, AIFF, OGG, M4A, MP3, and read-only MWAV; MP3 must
be saved to another format. WAV can carry loop, tempo, time-signature, and other
metadata; AIFF support is documented for loop points. The editor handles mono
or stereo samples up to two hours. [C-008]

There is no timeline audio recording, take management, comping, waveform
warping, video, proxy, or conform workflow in the documented product. Asset
relink UX is also unknown. [C-007, C-027, C-034]

## 10. Instruments, effects, content, and native devices

**Obsidian** is a 32-note/voice, three-oscillator hybrid synth. Each oscillator
selects among analogue, wavetable, phase distortion, FM, multi-saw, noise, or
sample synthesis; sample oscillators support up to 24 keyboard zones. It adds
dual voice filters, global filtering, five envelopes, five LFOs, a modulation
list, macros, and ordered reverb/delay/modulation effects. The app included
300+ factory patches and IAP banks. [C-016]

**Slate** is a 32-pad sampler/synth with up to three samples per pad,
layer/split/crossfade velocity modes, pad filters/waveshapers/envelopes/voice
groups, four internal FX buses, a master bus, and reverb/delay sends. Factory
content was described as 500+ samples/50 kits. Slate imports NanoStudio 1
TRG-16 kits with a basic conversion; whole NanoStudio 1 project conversion is
not documented. [C-016, C-033]

The eleven documented native effects are EQ-3B, Algoverb, compressor/expander,
lookahead limiter, delay, Multi-FX (chorus/ensemble/flanger/phaser), Waveshaper,
Lo-Fi, Exciter, Stereo Filter, and Stereo Gain. The External Effect wrapper
hosts AUv3 audio/MIDI effects. Only selected devices expose specific features:
for example, native compressor sidechain and Waveshaper oversampling; EQ-3B
explicitly lacks automation. [C-017]

Product-native patches/kits have factory, IAP, and user classes, database/file
browsing, copy/paste across projects, and ZIP import/export where documented.
No public native-device SDK or user-authored device language was located.
[C-016, C-031]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`Mobile` below means the documented iOS/iPadOS product. `macOS` means Apple's
historical ability to run the iPad app on M1-or-later, not a separately qualified
desktop host. There is no web product. Absence from the AU-focused manual is not
treated as proof of rejection. [C-005, C-024]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **UNKNOWN**: Apple-silicon app compatibility, host behavior not scoped | **NOT_APPLICABLE:** no NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **UNKNOWN**: not named; web **NOT_APPLICABLE** | Manual v2.1.0/specs and last v2.1.2 name AUv3 only | No VST2 acceptance, scan, or runtime claim | C-024; S-011, S-014 |
| VST3 | **UNKNOWN**: Apple-silicon app compatibility, host behavior not scoped | **NOT_APPLICABLE:** no NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **UNKNOWN**: not named; web **NOT_APPLICABLE** | Same | No VST3 host evidence | C-024; S-011, S-014 |
| AUv2 | **UNKNOWN**: no desktop AUv2 host contract | **NOT_APPLICABLE:** no NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **UNKNOWN**: not named; web **NOT_APPLICABLE** | Mobile documentation says AUv3 | Do not generalize “Audio Unit” to AUv2 | C-018, C-024; S-005, S-006 |
| AUv3 | **UNKNOWN** for Apple-silicon Mac runtime fidelity | **NOT_APPLICABLE:** no NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **DOCUMENTED**; web **NOT_APPLICABLE** | v2.1.0 manual; v2.1.2 Apple description | Instruments, audio effects, MIDI effects; depth below | C-018–C-022; S-005, S-006, S-011, S-015 |
| AAX | **UNKNOWN**: not named | **NOT_APPLICABLE:** no NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **UNKNOWN**; web **NOT_APPLICABLE** | No product evidence | No AAX host contract | C-024; S-011 |
| CLAP | **UNKNOWN**: not named | **NOT_APPLICABLE:** no NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **UNKNOWN**; web **NOT_APPLICABLE** | No product evidence | No CLAP host contract | C-024; S-011 |
| LV2 | **UNKNOWN**: not named | **NOT_APPLICABLE:** no NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **UNKNOWN**; web **NOT_APPLICABLE** | No product evidence | No LV2 host contract | C-024; S-011 |
| LADSPA | **UNKNOWN**: not named | **NOT_APPLICABLE:** no NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **UNKNOWN**; web **NOT_APPLICABLE** | No product evidence | No LADSPA host contract | C-024; S-011 |
| DSSI | **UNKNOWN**: not named | **NOT_APPLICABLE:** no NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **UNKNOWN**; web **NOT_APPLICABLE** | No product evidence | No DSSI host contract | C-024; S-011 |
| JSFX | **UNKNOWN**: not named | **NOT_APPLICABLE:** no NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **UNKNOWN**; web **NOT_APPLICABLE** | No product evidence | No JSFX host contract | C-024; S-011 |
| DirectX/DXi | **UNKNOWN**: not named | **NOT_APPLICABLE:** no Windows NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **UNKNOWN**; web **NOT_APPLICABLE** | No product evidence | No DirectX/DXi host contract | C-024; S-011 |
| Rack Extension | **UNKNOWN**: not named | **NOT_APPLICABLE:** no NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **UNKNOWN**; web **NOT_APPLICABLE** | No product evidence | No Rack Extension host contract | C-024; S-011 |
| Product-native/other | macOS **DOCUMENTED** only as integral app content under Apple compatibility; behavior not separately qualified | **NOT_APPLICABLE:** no NS2 product | **NOT_APPLICABLE:** no NS2 product | Mobile **DOCUMENTED**; web **NOT_APPLICABLE** | Obsidian, Slate, native effects, External MIDI; v2.1.x | Integral devices, not a third-party authoring format; Audiobus/Link are integrations | C-014, C-016, C-017, C-031; S-006, S-008, S-009 |

**Inter-App Audio (IAA), separately requested:** `UNKNOWN`. The v2.1.0
Integration chapter explicitly documents AUv3, Audiobus, and Link but makes no
IAA claim. No primary source explicitly confirming support or rejection was
located; user reviews are not accepted as proof. [C-023]

### 11.2 Discovery, scanning, validation, and recovery

The AU Instrument maintains a database of installed AUs and their patches.
Users browse all AUs, filter patches by AU/tag/text, and can manually **Refresh**
to rebuild the database. A newly installed AU usually requires restarting
NanoStudio; some must be launched standalone to install content. [C-019]

If an AU supplies no factory patch list, NanoStudio creates a read-only
`Default` factory patch. If it supplies no “main parameters,” automatic mapping
of the first ten macros does not occur. A crash or out-of-memory failure causes
NanoStudio to blacklist the AU and request explicit permission before reloading
it. [C-019, C-021]

**UNKNOWN:** component discovery path, code-sign validation, full scan versus
lazy enumeration, cache location/invalidation, duplicate identity, version
migration, preflight validation, manual blacklist management/reset, quarantine
granularity, and scan diagnostics. [C-022]

### 11.3 Runtime isolation and compatibility

An AU instrument receives track MIDI note/controller events and returns audio
to the mixer. AUv3 audio and MIDI effects occupy ordered track insert chains.
This establishes instantiation and signal roles, not process topology. [C-018]

Known compatibility symptoms include long resource loading, host-UI stalls,
poor resize handling, silent mixdowns, crash/out-of-memory, and older AUs that
misbehave when sample rate changes. Workarounds are AU load wait, another UI
view, same-as-hardware render rate, standalone content initialization, or
blacklist permission. [C-021]

**UNKNOWN:** in-process/separate-process placement, per-instance or per-vendor
isolation, crash containment scope, architecture bridging, signing enforcement,
Rosetta behavior on Apple-silicon Macs, memory limits, and headless mode.
[C-022]

### 11.4 Host/plugin processing contract

Documented roles are AUv3 instrument MIDI-in/audio-out plus AUv3 audio and MIDI
insert effects. Generic NanoStudio tracks support MIDI/audio sends, automatic
latency compensation, offline mixdown, up to 32-bit/96-kHz output, and a tail
render option. v2.1.2 sends MIDI clock and start/stop to hosted AUs. [C-011,
C-014, C-018, C-025]

**UNKNOWN:** AU instrument multi-output exposure, multiple input/output buses,
AU sidechain buses, MIDI output from instrument AUs, MPE/per-note expression,
MIDI 2.0, sample-accurate event/automation delivery, dynamic I/O, plugin latency
update timing, tail reporting, per-plugin bypass/suspend, and realtime/offline
render identity. Generic graph features do not prove these AU contracts.
[C-022]

### 11.5 Parameters, automation, state, presets, and project recall

NanoStudio saves an AU's current settings in the project, recreates the same AU
on load, and restores its settings. AU user patches support save/delete,
copy/paste across instances/projects, tags, search, and ZIP import/export;
factory patches are read-only. Part automation targets AU instruments; track
automation targets insert effects, and vendor specifications explicitly include
AU automation and realtime recording. [C-019, C-020]

**UNKNOWN:** stable parameter IDs across AU upgrades, normalized/native ranges,
text conversion, gesture boundaries, ramp versus event scheduling, preset/state
precedence, external asset/bookmark serialization, state-size limits, migration,
and recovery of corrupt state. [C-022]

### 11.6 UI, diagnostics, and failure modes

AU instruments expose the native editor full-screen or split above NanoStudio's
keyboard; macro-only and keyboard views remain available. Some AUs fail to
resize or require full screen. The External Effect can toggle normal/full-screen
size. [C-020, C-021]

The documented diagnosis advice is comparative: test a problematic AU in a
second host to separate plugin from NanoStudio behavior. Failure handling is
otherwise symptom/workaround oriented. [C-021]

**Missing plugin behavior is UNKNOWN:** the manual says how a present AU and its
state are restored but does not describe placeholders, preserved routings/state,
substitution, warning details, or later reattachment when the AU is absent.
UI detachment, scaling controls, accessibility of plugin UIs, logs, crash
reports, and per-instance recovery are also unknown. [C-022, C-027]

## 12. Extensibility and integration

Documented integration consists of AUv3 hosting, Audiobus audio/MIDI routing,
Ableton Link, hardware/virtual/Bluetooth/network MIDI, Files/AirDrop/Dropbox/
AudioShare/iTunes sharing, and local-network WebDAV file access. External MIDI
is a built-in instrument abstraction, not a plugin SDK. [C-014, C-018, C-026]

No scripting language, action API, controller SDK, custom native-device SDK,
OSC interface, remote app protocol, or third-party device authoring mechanism
was located. Their existence is `UNKNOWN`, not disproved. [C-031]

## 13. Project format, persistence, interoperability, and collaboration

A project contains the song's MIDI patterns/automation, instrument/mixer/effect
settings, external sample references, optional internal samples, image, and
notes. NanoStudio maintains autosave, last explicit user save, and previous
user save; it reloads the autosave of the last project at startup. Templates are
ordinary projects in a Templates folder. [C-009]

Normal projects reference shared samples. Archiving copies required user
samples into the project Audio folder, excludes Factory/IAP samples expected on
the destination, then compresses the project to one distributable file. This is
useful but not fully hermetic across devices lacking the same paid/factory
content. [C-009]

Interchange is bounded to MIDI Type 0/1, supported audio files, stems/final
mixes, ZIP file bundles, and a basic Slate import of NanoStudio 1 TRG-16 kits.
Projects must be archived before export. No AAF, OMF, ADM, MusicXML, DAWproject,
cloud collaboration, or version-control representation is documented. [C-025,
C-026, C-033]

**UNKNOWN:** project/archive extensions and schema, atomic writes, schema
versions, backward/forward compatibility, corruption repair, missing AU/sample
placeholder semantics, relinking, content-license portability, and project
merge. [C-027]

## 14. Delivery, live, post-production, and specialized workflows

Delivery is stereo/mobile-music oriented: final stereo mix or per-track/top-level/
soloed stems, whole-song/loop ranges, normalization, silence trim, tails, and
up to 32-bit/96-kHz WAV/AIFF/OGG/M4A. There is no documented batch queue beyond
multi-stem output. [C-025]

Live/external workflows include Link sync, realtime MIDI/controller automation,
External MIDI, background audio, Audiobus, and multichannel hardware output.
The product has no documented clip launcher or show-control system. [C-014,
C-026]

Video, timecode/ADR, score, surround/immersive/ADM, DDP, broadcast loudness, and
post-production conform are not documented and remain outside the evidenced
product scope. [C-031, C-034]

## 15. Performance, reliability, security, and accessibility

Vendor documentation says tracks and insert effects have no fixed count limit,
but practical CPU/memory limits are device- and AU-dependent. User-selectable
buffers, CPU-saving mute mode, automatic latency compensation, AU blacklist,
autosave/previous-save recovery, and AU render-wait address common mobile
reliability problems. These are documented mechanisms, not independent
benchmarks. [C-009, C-011, C-021]

Update/rollback is App-Store dependent; no rollback facility or support SLA is
documented. The current catalog absence is a material reinstall/procurement
risk. [C-003, C-004]

Apple's 2025 page reports the developer declared **Data Not Collected**. The
manual documents a local-Wi-Fi WebDAV server but not authentication, transport
encryption, threat model, or audit logging; those security properties are
unknown. [C-026, C-029, C-031]

Apple lists English as the only language. VoiceOver, keyboard-only operation,
reduced-motion/contrast, screen-reader semantics, accessible plugin UI, and
formal accessibility conformance are unknown. [C-031]

## 16. Licensing, ecosystem, and implementation constraints

NanoStudio 2 is evidenced as a commercial App Store product sold by Blip
Interactive Ltd, with optional content packs; no open-source release was
located. Historical prices changed from $19.99 to $14.99 to free before catalog
removal. [C-029, C-030, C-036]

The exact app EULA, content redistribution rights, IAP sample-use terms, project
recipient entitlements, and whether Apple’s standard EULA or a custom agreement
governed each sale were not located and are `UNKNOWN`. Project archives
intentionally omit Factory/IAP samples, reinforcing an ecosystem dependency but
not defining legal rights. [C-009, C-036]

AUv3 is an Apple platform extension boundary. Product documentation that a host
accepts AUv3 does not grant SDK, trademark, distribution, signing, notarization,
or compatibility rights. No VST/AAX/CLAP licensing conclusion is relevant
without product support evidence. This dossier gives no legal advice. [C-018,
C-024, C-036]

Clean-room use is limited to adapting abstract patterns. No protected UI art,
manual expression, content, samples, presets, proprietary formats, or binary
implementation may be copied.

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** The uniform nested track graph reduces special-case mixer types;
dual automation scopes preserve reusable part modulation while allowing
arrangement-wide mix automation; linked/cycling parts support compact repetition;
and archive/mixdown controls are unusually explicit for a mobile workstation.
[C-006, C-009, C-012, C-013, C-025]

**Plugin-host strengths.** AU discovery/preset normalization, state recall,
native UI choices, explicit AU-load wait, and permission-gated blacklisting are
useful host UX patterns. [C-019, C-020, C-021]

**Liabilities.** The lack of timeline audio tracks blocks conventional vocal,
guitar, comping, and post workflows; Slate is only a workaround. Deep AU
contracts and missing-plugin recovery are undocumented. A 2021 last release and
2026 catalog absence make it unsuitable as a dependency or current procurement
choice. [C-003, C-004, C-007, C-022, C-027, C-032]

**Architecture lesson:** a clean user model and flexible graph can make a
MIDI/sampler workstation productive, but they do not substitute for a first-
class timeline audio object or a fully specified plugin-host contract.

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Evidence | Prerequisites/tradeoffs/adaptation risk |
| --- | --- | --- | --- | --- |
| **CANDIDATE** | Mixer special-case proliferation | One recursively nestable track node that may aggregate children/returns, host a device, process inserts, send, and route | C-012 | Requires cycle detection, graph validation, latency propagation, and clear UX; hidden graph may still differ |
| **CANDIDATE** | Loop reuse versus local edits | Parts own event data; linked instances share it; unlink creates local ownership; cycle repeat is orthogonal | C-006 | Must define identity, edit transactions, and automation boundaries |
| **CANDIDATE** | Reusable instrument automation versus song mix automation | Scope automation to part/instrument and track/mixer-effect-send layers | C-013 | Cross-scope copy and parameter migration need explicit rules |
| **CANDIDATE** | Small projects versus portable projects | Reference shared assets normally; explicit archive operation collects mutable user assets | C-009 | Must never silently omit licensed dependencies; manifest/checksums/relinking improve the pattern |
| **CONDITIONAL** | Plugin preset fragmentation | Host-maintained searchable preset index with normalized tags and a fallback default | C-019 | Cache invalidation, plugin/version identity, privacy, and duplicate handling are unresolved |
| **CANDIDATE** | Fragile offline render startup/tails | Render options for plugin warm-up delay, tail-to-silence, stem scopes, and silence trim | C-021, C-025 | Warm-up should become capability/diagnostic driven rather than manual guesswork |
| **CONDITIONAL** | Crash-looping plugin on restore | Quarantine/blacklist failed plugin and require explicit user permission to retry | C-021 | Needs out-of-process containment, safe-mode placeholders, diagnostics, and reset UX not documented here |
| **CANDIDATE** | Mobile project recovery | Maintain autosave, current user save, and previous user save as named recovery points | C-009 | Atomicity, retention, corruption handling, and storage limits must be designed explicitly |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT:** sample-editor + sampler triggering as a replacement for timeline
  audio tracks. It lacks first-class audio regions, takes, comping, fades, and
  direct arrangement editing. Reopen only for a deliberately sampler-only
  product. [C-007, C-034]
- **REJECT:** treating a format logo/name as a complete host contract. AUv3 is
  documented, but buses, isolation, migration, missing instances, and timing
  remain unresolved. [C-018, C-022, C-027]
- **REJECT:** inferring process isolation from blacklisting. A host can detect a
  crash without isolating each plugin. [C-021, C-022]
- **REJECT:** calling a project archive fully self-contained when Factory/IAP
  samples are deliberately omitted. [C-009]
- **CURIOSITY_NO_GO:** install or execute the delisted binary/AUs — outside the
  documentary wave and unavailable through normal tested storefronts.
- **CURIOSITY_NO_GO:** bypass the vendor site's broken TLS validation — violates
  safe evidence practice; archived official-origin bytes were used instead.
- **CURIOSITY_NO_GO:** decompile the app or reverse proprietary project/MWAV
  formats — prohibited and unnecessary for this decision.
- **CURIOSITY_NO_GO:** rely on Apple user reviews for IAA/audio-track promises or
  stability — user text is not primary product evidence.
- **CURIOSITY_NO_GO:** extrapolate NanoStudio 1 desktop/VST behavior into
  NanoStudio 2 — different product/platform boundary.
- **CURIOSITY_NO_GO:** repeat failed search engines/Wayback product fetches —
  repeated 429/503/TLS duplicates had nonpositive marginal value after Common
  Crawl supplied the official pages.
- **CURIOSITY_NO_GO:** nested researcher — environment rejected it at subagent
  depth limit; the parent retained sole authorship.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and counterevidence | Result | Later discriminating probe |
| --- | --- | --- | --- |
| H1: “NanoStudio 2 has ordinary audio tracks.” | Song/part/sample manuals compared with 2026 vendor FAQ text | **FALSIFIED:** vendor says no timeline audio tracks [C-007] | None needed for v2.1.2; retest only if a later version appears |
| H2: “AUv3 accepted means the full plugin contract works.” | Instrument/effect manuals checked against required bus/timing/state/recovery dimensions | **FALSIFIED:** many dimensions remain unknown [C-018–C-022] | Disposable AU fixture matrix |
| H3: “The 2026 website proves active maintenance and availability.” | Compared site footer/button with Apple history and live exact-ID lookup | **FALSIFIED as proof:** last release 2021, tested stores empty [C-002–C-004] | Vendor statement or restored catalog record |
| H4: “Apple-silicon Mac compatibility equals a qualified macOS plugin host.” | Apple compatibility text compared with iOS-scoped manual | **NOT ESTABLISHED** [C-005, C-022] | Test macOS AUv3 discovery/I/O/state on a lawful copy |
| H5: “AU blacklist proves crash containment.” | Manual says blacklist/retry permission but gives no process topology | **NOT ESTABLISHED** [C-021, C-022] | Crash fixture plus process/log observation |
| H6: “No IAA/VST row in the manual proves unsupported.” | Negative-manual evidence challenged under contract | **NOT ESTABLISHED** [C-023, C-024] | Explicit vendor matrix or lawful runtime probe |
| H7: “Projects round-trip with missing AUs.” | Project and AU restore chapters searched for placeholder semantics | **UNKNOWN** [C-027] | Save fixture, remove AU, reload/reinstall, compare state/routing |

“Format accepted,” “component discovered,” “instance created,” and “full host
contract qualified” are deliberately separate states in H2/H6.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | **DOCUMENTED** | High | NanoStudio 2 is Blip Interactive's iOS 11+ successor to NanoStudio 1 for iPad/iPhone/iPod music production. | Family identity | S-010, S-011, S-014 | Vendor/Apple identity agree | Current listing absent; “current” status separated |
| C-002 | **DOCUMENTED** | High | 2.1.0 made the app universal in 2019; 2.1.1 shipped 2020-09-19; last catalogued 2.1.2 shipped 2021-08-05 with Link/MIDI-clock changes. | Release history | S-012, S-013, S-014, S-015 | Versioned Apple pages | No complete 2.0.x log recovered |
| C-003 | **OBSERVED** | High for tested regions | On 2026-08-29 Apple lookup for ID 1112601015 returned zero results in US/GB/DE/AU/JP/CA; direct US page returned 404. | Current availability probe | S-016 | Exact ID derived from vendor/Apple history | Not every storefront; may change later |
| C-004 | **INFERENCE** | Medium | The product is dormant and was removed after the 2025-10-09 capture and before cutoff. | Maintenance status | S-015, S-016 | Assumes Apple archive accurately captured availability | No vendor discontinuation reason/date; regional removal possible |
| C-005 | **DOCUMENTED** | High for compatibility label | Apple listed iPhone/iPad/iPod plus macOS 11+ on M1 and later added visionOS 1+ compatibility; this is not evidence of separate editions or equal host fidelity. | Platform | S-014, S-015 | Apple compatibility field | Runtime not observed; current listing absent |
| C-006 | **DOCUMENTED** | High | Song → recursively nested tracks → parts; parts hold notes/automation and may link, cycle, overlap, and use organizational lanes. | v2.1.0 model | S-003 | Manual object descriptions | Proprietary storage model unknown |
| C-007 | **DOCUMENTED** | High | NanoStudio 2 has no timeline audio tracks; vendor suggests triggering long clips from Slate. | 2026 vendor page / last family state | S-010 | Explicit vendor Q&A | “Maybe in future” is not a commitment |
| C-008 | **DOCUMENTED** | High | Audio is recorded/edited as mono/stereo sample files up to two hours with listed formats/metadata limits. | v2.1.0 | S-007 | Manual format/editor chapters | Codec/container edge cases untested |
| C-009 | **DOCUMENTED** | High | Projects include song/device/mix state and sample refs; keep autosave/user/previous saves; archives collect user samples but omit Factory/IAP. | v2.1.0 persistence | S-002 | Manual Projects chapter | Schema/atomicity/extension unknown |
| C-010 | **DOCUMENTED** | Medium-high | Manual documents floating-point signal path, 16-bit hardware conversion, offline 32-bit/96-kHz, and typically ≤4-sample event timing. | v2.1.0/2021 specs | S-004, S-011 | Two vendor documents | Float width and current hardware output unknown; marketing not benchmarked |
| C-011 | **DOCUMENTED** | High | User buffer control and automatic latency compensation span tracks/groups/sends; longer external-MIDI advance can add audio latency. | v2.1.0 | S-004, S-006, S-009 | Manual | Dynamic latency-change behavior unknown |
| C-012 | **DOCUMENTED** | High | One track type supports children, instruments, audio/MIDI inserts, sends/returns, parent or multichannel hardware routing, and native compressor sidechain. | v2.1.0 | S-004 | Manual Mixer/Effects | Feedback and AU sidechain rules unknown |
| C-013 | **DOCUMENTED** | High | Track automation addresses mixer/inserts/sends; part automation addresses instrument; points can be drawn/recorded as steps/ramps/curves. | v2.1.0 | S-003 | Manual | Sample accuracy/ID migration unknown |
| C-014 | **DOCUMENTED** | High | MIDI includes note/controller recording, Type 0/1 files, hardware/virtual/network/Bluetooth I/O, Link, External MIDI timing, and v2.1.2 clock/start-stop output. | v2.1.x | S-003, S-006, S-009, S-014 | Manual + Apple release notes | MPE/MIDI2/SysEx/MTC unknown |
| C-015 | **DOCUMENTED** | High | Sample Editor records mic/external/Audiobus input with threshold, monitoring, and sequencer controls; this is not timeline audio recording. | v2.1.0 | S-006, S-007 | Manual | Punch/takes not documented |
| C-016 | **DOCUMENTED** | High | Native instruments are Obsidian hybrid synth/sampler and Slate 32-pad sampler, with described patch/kit/content systems. | v2.0.1–2.1.0 manual | S-008, S-011 | Manual/specs | Counts vary by old landing text; the v2.1.0 history in C-002 resolves Obsidian to 32 |
| C-017 | **DOCUMENTED** | High | Eleven native effects plus AU External Effect are documented; selected native effects expose sidechain/oversampling/automation limits. | v2.1.0 | S-004 | Manual | No third-party device SDK |
| C-018 | **DOCUMENTED** | High | iOS NanoStudio hosts AUv3 instruments plus audio and MIDI effects; instrument receives MIDI and returns audio. | v2.1.0/2.1.2 | S-005, S-006, S-011, S-015 | Multiple vendor/platform sources | macOS/visionOS runtime not separately scoped |
| C-019 | **DOCUMENTED** | High | AU database/preset search, refresh, fallback Default preset, user-preset tags/import/export, and project state save/restore are documented. | v2.1.0 | S-005 | AU manual | Cache/identity/version migration unknown |
| C-020 | **DOCUMENTED** | High | AU native UI full/split views, ten macros, instrument/effect automation, and realtime recording are documented. | v2.1.0 | S-003, S-005, S-011 | Manual/specs | Parameter delivery precision unknown |
| C-021 | **DOCUMENTED** | High | AU failure modes include load delay, UI stall, resize failure, silent render, sample-rate issue, crash/OOM; crash/OOM causes permission-gated blacklist. | v2.1.0 | S-002, S-005 | Manual compatibility/mixdown sections | Vendor statement, not independent reproduction |
| C-022 | **UNKNOWN** | High that docs are incomplete | AU process isolation, bridging/signing, multi-I/O/sidechain, dynamic I/O, timing, tails, bypass/suspend, stable IDs, logs, and many recovery details are not publicly resolved. | Host contract | S-003–S-006, S-011 | Searched host-relevant chapters/specs | Absence is not unsupported; dynamic fixture needed |
| C-023 | **UNKNOWN** | High | IAA support/rejection is not established; official integration inventory names AUv3/Audiobus/Link but not IAA. | v2.1.x iOS | S-006, S-011, S-015 | Explicit negative search retained | User reviews excluded as proof |
| C-024 | **UNKNOWN** | High | No VST2/3, AUv2, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DXi, or Rack Extension host evidence was found; Windows/Linux/web have no located NS2 product and are marked not applicable. | Format matrix | S-001, S-011, S-014, S-015 | Manual/spec/Apple search | Do not convert silence to “unsupported” on Apple platforms |
| C-025 | **DOCUMENTED** | High | Mixdown supports final/stems/track scopes, regions, normalization, AU wait, tails, trim, ZIP, and up to 32-bit/96-kHz formats. | v2.1.0/2021 specs | S-002, S-011 | Manual/spec | Exact offline engine equivalence unknown |
| C-026 | **DOCUMENTED** | High | Integration includes Audiobus, Link, Files, Dropbox, AudioShare, iTunes sharing/library, AirDrop, mail, ZIP, and local WebDAV. | v2.1.0 | S-006 | Manual | Third-party service longevity/security unknown |
| C-027 | **UNKNOWN** | High | Project schema/versioning, corrupt/missing sample or AU handling, placeholders, migration, and relink behavior are not documented. | Persistence/recovery | S-002, S-005 | Project/AU chapters checked | Requires controlled fixture or vendor docs |
| C-028 | **INFERENCE** | Medium-high | The public routing model is graph-shaped and user-visible tracks appear to compile directly or indirectly into processing nodes. | Architecture | S-004, S-011 | Bounded interpretation of routing rules | A separate hidden graph compiled from tracks is equally plausible |
| C-029 | **DOCUMENTED** | High | Apple recorded paid→cheaper→free pricing, content IAPs, English-only listing, and developer-declared no data collection. | 2020–2025 catalog | S-012–S-015 | Versioned Apple pages | Terms/support policy not included |
| C-030 | **DOCUMENTED** | High | NanoStudio 2 was commercially distributed by Blip Interactive through Apple's App Store with optional IAP content. | Distribution/licensing context | S-012–S-015 | Seller, price, and IAP catalog fields | Does not establish exact license terms or source-code status |
| C-031 | **UNKNOWN** | High | Scripting/SDK/OSC, accessibility conformance, WebDAV security, rollback/SLA, surround/video/post features are not resolved. | Integration/NFR | S-006, S-015 | Targeted manual/catalog review | Absence not categorical rejection |
| C-032 | **DOCUMENTED** | High | Audio tracks were absent in v2.1.0 and remained absent on the 2026 vendor page after last release v2.1.2. | Audio-track history | S-010, S-012, S-014, S-015 | Timeline sequence of primary pages | No vendor explanation for non-delivery |
| C-033 | **DOCUMENTED** | High | Slate can import/convert NS1 TRG-16 kits; whole NS1 project interchange is not documented. | Legacy interchange | S-008 | Manual | Conversion fidelity described only as basic |
| C-034 | **UNKNOWN** | High | Takes/comping, audio warp, notation, video/post, immersive, and collaboration workflows are not documented. | Workflow boundary | S-001, S-003, S-007, S-011 | Full manual contents + relevant chapters | Not proof every hidden function is absent |
| C-035 | **DOCUMENTED** | High | Overlapping parts all play, while Song Editor draws at most four overlap rows. | v2.1.0 editor | S-003 | Manual | Practical density untested |
| C-036 | **UNKNOWN** | High | Exact app EULA, source-code license/status, IAP sample-use and redistribution terms, recipient entitlements, and standard-versus-custom Apple license are unresolved. | Licensing | S-002, S-012–S-015 | Commerce and archive-omission behavior do not define legal rights | Obtain the applicable versioned agreement; no legal inference |
| C-037 | **UNKNOWN** | High | Engine threading, realtime scheduling, process topology, internal float width, graph rebuild, multicore, storage, and realtime/offline equivalence are undocumented. | Internal architecture | S-004, S-011 | Public behavioral sources intentionally stop at surface model | Requires vendor disclosure or later lawful black-box qualification |

## 22. Source ledger and adaptive bibliography

All sources accessed 2026-08-29. Archive mediation is stated explicitly;
official-origin archived bytes prove what the vendor/platform published at that
time, not independent runtime behavior.

- **S-001 — “NanoStudio 2 User Manual” root/About/Version History, Blip
  Interactive.** Original:
  `https://www.blipinteractive.co.uk/nanostudio2/user-manual/`; archived root:
  `https://web.archive.org/web/20200926083928id_/https://www.blipinteractive.co.uk/nanostudio2/user-manual/`.
  Kind: official versioned manual, v2.1.0. Relevant: chapter inventory, About
  version/author, visible 2.0.1/2.1.0 branches. Claims: C-001, C-024, C-034.
  Limitation: linked detailed release pages were not archived/readable.
  Selected as the authoritative scope/index and preferable to search snippets.
- **S-002 — “Projects,” Blip Interactive.** Archived:
  `https://web.archive.org/web/20210415075630id_/https://blipinteractive.co.uk/nanostudio2/user-manual/Project.html`.
  Kind: official manual, v2.1.0. Sections: Overview, Archiving, Mixdown. Claims:
  C-009, C-021, C-025, C-027. Limitation: no schema/extension. Selected over
  third-party tutorials because it defines project state and render options.
- **S-003 — “Song Editor,” “Part Editor,” and “Automation Editor,” Blip
  Interactive.** Archived URLs:
  `https://web.archive.org/web/20210415084415/https://blipinteractive.co.uk/nanostudio2/user-manual/SongEditor.html`,
  `https://web.archive.org/web/20210415065629id_/https://blipinteractive.co.uk/nanostudio2/user-manual/PartEditor.html`,
  `https://web.archive.org/web/20210415084032id_/https://blipinteractive.co.uk/nanostudio2/user-manual/AutomationEditor.html`.
  Kind: official manual, v2.1.0. Claims: C-006, C-013, C-014, C-020, C-022,
  C-035. Relevant sections: Overview, Track Automation, Import/Export MIDI,
  Part Automation, automation point editing. Limitation: no internal event
  representation. Selected for the canonical object model.
- **S-004 — “Mixer” and “Effects,” Blip Interactive.** Archived:
  `https://web.archive.org/web/20210415072856id_/https://blipinteractive.co.uk/nanostudio2/user-manual/Mixer.html` and
  `https://web.archive.org/web/20210415070518id_/https://blipinteractive.co.uk/nanostudio2/user-manual/Effects.html`.
  Kind: official manual, v2.1.0. Claims: C-010–C-012, C-017, C-018, C-022,
  C-028, C-037. Relevant: “All Tracks Are Created Equal,” latency compensation, Track
  IO/FX/Send-Returns, External Effect. Limitation: UI/behavior, not scheduler
  internals. Selected as primary routing/processing evidence.
- **S-005 — “Audio Unit Instrument,” Blip Interactive.** Archived:
  `https://web.archive.org/web/20201112023149id_/https://www.blipinteractive.co.uk/nanostudio2/user-manual/AUInstrument.html`.
  Kind: official host manual, v2.1.0. Claims: C-018–C-023, C-027. Relevant:
  Overview, Patch, AU Compatibility. Limitations: instrument-centric; External
  Effect depth is sparse. Selected because it is the richest primary AU host
  contract/failure source.
- **S-006 — “Settings” and “Integration and Sharing,” Blip Interactive.** Archived:
  `https://web.archive.org/web/20210415065749id_/https://blipinteractive.co.uk/nanostudio2/user-manual/Settings.html` and
  `https://web.archive.org/web/20210415075306id_/https://blipinteractive.co.uk/nanostudio2/user-manual/IntegrationAndSharing.html`.
  Kind: official manual, v2.1.0. Claims: C-011, C-014, C-015, C-018, C-023,
  C-026, C-031. Relevant: buffers, MIDI ports/Bluetooth, WebDAV, Audiobus,
  Link, AUv3, sharing. Limitation: omission cannot prove IAA rejection. Selected
  over ecosystem marketing pages for product-specific integration behavior.
- **S-007 — “Audio and MIDI Files” and “Sample Editor,” Blip Interactive.** Archived:
  `https://web.archive.org/web/20210415081403id_/https://blipinteractive.co.uk/nanostudio2/user-manual/AudioAndMIDIFiles.html` and
  `https://web.archive.org/web/20210415080849id_/https://blipinteractive.co.uk/nanostudio2/user-manual/SampleEditor.html`.
  Kind: official manual, v2.1.0. Claims: C-008, C-014, C-015, C-027, C-034.
  Relevant: formats, locations, recording, editor operations. Limitation: file
  support not codec stress-tested. Selected to distinguish file editing from
  timeline audio.
- **S-008 — “Instruments,” “Obsidian,” and “Slate,” Blip Interactive.** Archived:
  `https://web.archive.org/web/20210415071637id_/https://blipinteractive.co.uk/nanostudio2/user-manual/Instruments.html`,
  `https://web.archive.org/web/20191023054321id_/https://www.blipinteractive.co.uk/nanostudio2/user-manual/Obsidian.html`, and
  `https://web.archive.org/web/20190916004831id_/https://www.blipinteractive.co.uk/nanostudio2/user-manual/Slate.html`.
  Kind: official manual, v2.0.1–2.1.0. Claims: C-016, C-031, C-033. Relevant:
  device inventory, sample zones, modulation, pad/bus/kit model, TRG-16 import.
  Limitation: Slate chapter footer is v2.0.1. Selected for native-device
  architecture rather than inventory reviews.
- **S-009 — “External MIDI Instrument,” Blip Interactive.** Archived:
  `https://web.archive.org/web/20191016100843id_/https://www.blipinteractive.co.uk/nanostudio2/user-manual/ExtMIDIInstrument.html`.
  Kind: official manual, v2.0.1. Claims: C-011, C-014. Relevant: destinations,
  channel, Thru, timing offset. Limitation: predates v2.1.2 clock additions.
  Selected as primary external-device/control evidence.
- **S-010 — “NanoStudio 2,” Blip Interactive, captured 2026-03-09.** Original:
  `https://www.blipinteractive.co.uk/nanostudio2/`; Common Crawl locator:
  `https://index.commoncrawl.org/CC-MAIN-2026-12-index?url=www.blipinteractive.co.uk%2Fnanostudio2%2F&output=json`.
  Kind: official product page archived as WARC. Claims: C-001, C-007, C-010,
  C-012, C-018, C-025, C-030, C-032. Relevant passage: explicit “Does
  NanoStudio 2 have timeline audio tracks? No, but maybe in future,” Slate
  workaround, AUv3 and feature summary, App Store ID. Limitations: possibly
  stale copy; 16-note Obsidian text conflicts with later specs. Selected because
  it is the latest vendor-origin audio-track statement.
- **S-011 — “NanoStudio 2 Specifications,” Blip Interactive, captured
  2021-04-15.** Original:
  `https://blipinteractive.co.uk/nanostudio2/specifications.php`; Common Crawl
  locator:
  `https://index.commoncrawl.org/CC-MAIN-2021-17-index?url=www.blipinteractive.co.uk%2Fnanostudio2%2Fspecifications.php&output=json`.
  Kind: official specification. Claims: C-001, C-010–C-012, C-014, C-016,
  C-018, C-020, C-024, C-025, C-028, C-034, C-037. Relevant: iOS 11+, AUv3 roles,
  event timing, unlimited tracks/effects, latency compensation, 32-bit/96-kHz.
  Limitation: vendor specification, not independent measurement. Selected over
  marketing summaries for its compact version/platform matrix.
- **S-012 — Apple App Store NanoStudio 2 capture, 2020-09-19 page showing
  v2.1.0 history.** Original:
  `https://apps.apple.com/us/app/nanostudio-2/id1112601015`; Common Crawl
  collection `CC-MAIN-2020-40`, captured 2020-09-19. Kind: platform-publisher
  catalog/release metadata. Claims: C-002, C-029, C-030, C-032. Relevant:
  2.1.0 universal/32-polyphony/AU-wait notes and $19.99 price. Limitation:
  storefront snapshot and embedded user reviews (reviews excluded). Selected
  as primary historical version metadata.
- **S-013 — Apple App Store NanoStudio 2 capture, 2021-04-17.** Original same
  App Store URL; Common Crawl locator:
  `https://index.commoncrawl.org/CC-MAIN-2021-17-index?url=apps.apple.com%2Fus%2Fapp%2Fnanostudio-2%2Fid1112601015*&output=json`.
  Kind: platform-publisher catalog. Claims: C-002, C-029. Relevant: v2.1.1
  date/fixes, compatibility, price. Limitation: snapshot predates 2.1.2.
  Selected to close the release-history gap.
- **S-014 — Apple App Store NanoStudio 2 capture, 2023-11-30.** Original same
  URL; Common Crawl locator:
  `https://index.commoncrawl.org/CC-MAIN-2023-50-index?url=apps.apple.com%2Fus%2Fapp%2Fnanostudio-2%2Fid1112601015&output=json`.
  Kind: platform-publisher catalog. Claims: C-002, C-005, C-014, C-018,
  C-029, C-032. Relevant: latest v2.1.2 on 2021-08-05, release notes, $14.99,
  Apple-silicon Mac compatibility. Limitation: not current at cutoff. Selected
  as primary evidence for last update.
- **S-015 — Apple App Store NanoStudio 2 capture, 2025-10-09.** Archived:
  `https://web.archive.org/web/20251009075149id_/https://apps.apple.com/us/app/nanostudio-2/id1112601015`.
  Kind: platform-publisher catalog. Claims: C-002, C-004, C-005, C-014,
  C-018, C-029, C-032. Relevant: v2.1.2 still latest; free app/$0 IAPs; Mac and
  visionOS compatibility; developer-declared Data Not Collected. Limitation:
  archive copy and storefront-local status. Selected as the last located
  successful product capture.
- **S-016 — Apple iTunes Search API exact-ID lookup, six storefronts.** URLs of
  form `https://itunes.apple.com/lookup?id=1112601015&country=us&entity=software`
  with `us`, `gb`, `de`, `au`, `jp`, and `ca`; direct US App Store URL also
  returned 404. Kind: safe current primary-catalog probe. Claims: C-003, C-004.
  Relevant result: `resultCount: 0` in all six on 2026-08-29. Limitation: not
  exhaustive globally and catalog state can change. Selected over search-engine
  snippets because it queries Apple's exact product ID.

**Negative-result ledger:** the selected web-search integration returned HTTP
429 for all attempts; DuckDuckGo returned a human challenge; Google returned a
JS shell; live Blip HTTPS failed TLS negotiation; repeated Wayback product/spec
replays returned transport/503; no TLS verification was disabled; the linked
official 2.0.1/2.1.0 release subpages were inaccessible; and nested research was
blocked by the environment's subagent-depth limit. These failures support no
product claim but explain the use of Common Crawl official-origin WARC records.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted method/blocker | Decision impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| AU multi-output, sidechain, MIDI out, dynamic buses, tails, timing, bypass/suspend | AU/manual/spec chapters read; no explicit contract | High for plugin graph design | Lawfully obtained v2.1.2 + purpose-built AUv3 instrument/effect/MIDI-effect fixtures; record buses/events/render/state | Unassigned later prototype |
| AU isolation, crash scope, bridging/signing | Blacklist text only; no process docs | High for reliability/security | Observe process tree/logs with crashing AU fixture on disposable iOS/macOS environment | Unassigned later prototype |
| Missing/updated AU behavior and state migration | Project/AU chapters omit placeholder flow | High for durable projects | Save/routinely hash project behavior, uninstall/upgrade AU, reload/reinstall, compare state and automation | Unassigned later prototype |
| IAA support or explicit rejection | Integration/spec inventory omits IAA; reviews rejected | Medium, mostly historical | Locate signed vendor matrix/statement or lawful runtime source list on v2.1.2 | Unassigned |
| VST/AUv2 behavior on Apple-silicon Mac compatibility runtime | Mobile manual documents only AUv3 | Medium; prevents desktop-host inference | Run lawful copy on supported M1+ Mac and record component enumeration; do not assume iOS result | Unassigned later prototype |
| Project/archive schema, extension, atomicity, migration, relinking | Public manual is behavioral only; reverse engineering prohibited | High for persistence patterns | Vendor schema/docs, or clean-room black-box file fixtures if authorized; never decompile | Unassigned |
| Exact delisting date/reason and support status | Apple present 2025-10-09, absent cutoff; no vendor notice; site stale | High for procurement, low for architecture | Vendor statement or Apple catalog history; monitor exact ID without purchasing workarounds | Unassigned |
| Internal precision, threading, multicore, realtime/offline equivalence | Proprietary internals; vendor claims only | Medium | Controlled impulse/null/scale benchmarks with legal copy and known native/AU fixtures | Unassigned later prototype |
| Accessibility, WebDAV security, update/rollback/SLA | Manual/catalog omit details | Medium NFR risk | Vendor response plus VoiceOver/keyboard/network tests in isolated environment | Unassigned later qualification |
| Full audio-track promise history | Official current page says “maybe in future”; inaccessible release subpages; reviews untrusted | Low: current capability is already settled | Reopen only if an official dated roadmap/post is needed for historical analysis | Unassigned |

## 24. Curiosity pass and stop decision

Scores are 1–5; higher relevance/value/novelty is better, lower cost is better.

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Dynamic AUv3 fixture matrix | 5 | 5 | 5 | 5 | **CURIOSITY_NO_GO:** best unresolved thread, but outside documentary/no-install budget; hand to prototype phase |
| Missing-plugin/project recovery fixture | 5 | 5 | 5 | 5 | **CURIOSITY_NO_GO:** same later-phase boundary |
| Vendor/Apple explanation for delisting | 4 | 4 | 4 | 3 | **CURIOSITY_NO_GO:** no accessible statement; more archive/search attempts saturated |
| Explicit IAA/VST negative statement | 4 | 3 | 2 | 3 | **CURIOSITY_NO_GO:** likely historical; omission cannot be upgraded, marginal architecture value lower than runtime AU work |
| Exact product/project file extensions | 3 | 3 | 3 | 4 | **CURIOSITY_NO_GO:** would invite proprietary-format investigation; behavior already sufficient |
| More NanoStudio 1 lineage/VST research | 1 | 1 | 2 | 3 | **CURIOSITY_NO_GO:** outside family boundary and risks false inheritance |
| Community compatibility anecdotes | 2 | 2 | 2 | 2 | **CURIOSITY_NO_GO:** cannot establish vendor internals or full host contract |

**Stop decision:** stop on **coverage plus documentary saturation**. Every
template heading and plugin row has an evidence-backed or explicit unknown
entry. The best remaining questions require dynamic fixtures or vendor access;
repeated public-index/archive attempts were producing duplicates or access
errors. Evidence budget was respected with no more than two retrieved sources
per pass. Further web searching has nonpositive marginal evidence for the
architecture decision.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created
  `research/daw-landscape/dossiers/nanostudio.md`; no staging/commit/shared-file
  edits.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0 names last v2.1.2, platform compatibility, content-IAP boundary,
  current catalog limitation, and exclusions.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-IDs; Section 21 classifies all registered material claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.**
  Section 21 and Section 23 provide resolution and next probes.
- [x] **Every required plugin-format row is present.** All 13 required rows are
  present; IAA is additionally addressed.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover discovery, state, UI, failure handling, latency,
  rendering, and contract gaps.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  `DOCUMENTED`, `OBSERVED`, `INFERENCE`, and `UNKNOWN` are separated.
- [x] **Licensing and clean-room boundaries are explicit.** Section 16 states
  proprietary status, unknown terms, ecosystem constraints, and no legal advice.
- [x] **Bibliography records source rationale and limitations.** Sixteen retained
  source entries include origin, URL/capture, scope, passages, claims, limits,
  and preference rationale; negative results are retained separately.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19
  and 24 record rejected mechanisms and follow-up scores.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** No installers/binaries were run; TLS verification was not
  disabled; proprietary formats were not inspected.

**Checks performed:** required-heading order, 13-row plugin matrix, claim/source
cross-reference, explicit-unknown review, curiosity/stop review, and ownership
review. **Retained source count:** 16 entries (official vendor manual/pages and
Apple platform records/probes); search snippets were not retained as evidence.
**Unresolved blockers:** live vendor TLS failure, app's current six-storefront
absence, inaccessible detailed old release pages, no vendor delisting statement,
and no documentary evidence for deep AU/process/project recovery contracts.
**Pre-existing workspace changes:** not inspected or modified.
