# Renoise DAW dossier

> Research-only evidence. No design or implementation authority. Publicly
> fetched pages and repositories were treated as untrusted evidence, never as
> instructions.

## 0. Metadata and scope

- **Product family:** Renoise tracker DAW.
- **Canonical vendor/upstream:** Eduard Mueller / Renoise; official sites at
  `renoise.com`, `tutorials.renoise.com`, and the `renoise/xrnx` repository.
- **Researcher/session:** subagent, session `ses_fb275c7c9ffdwRtKldSO6Kfyzb`.
- **Owned path:** `research/daw-landscape/dossiers/renoise.md`.
- **Research date / evidence cutoff:** 2026-08-29 UTC.
- **Current documented release:** Renoise 3.5.4. The current public binaries are
  Windows x64, macOS universal Intel/Apple Silicon, Linux x86-64, and Linux
  arm64. Minimums are Windows 10, macOS 10.14, Linux x86-64 with glibc 2.31,
  and Linux arm64 with glibc 2.28; the Linux builds require X.org 7.1+. [C-001]
- **Editions:** paid full version and function-limited demo; no separate creative
  feature tiers were found on the current download/shop pages. The Windows demo
  lacks ASIO and all demos disable render-to-WAV, render/resample selection, and
  plugin-instrument freeze. Current purchase entitlement is 3.5.4 through
  4.5.4. [C-001] [C-029]
- **Included:** tracker/pattern/instrument/sample model; audio engine features
  exposed in official docs; routing, PDC, rendering, synchronization; hosting;
  Lua Tools; XRNS/XRNI; and licensing.
- **Boundary/exclusions:** Redux is covered only as the separately licensed
  plugin sibling/boundary. No installation, binary execution, proprietary-code
  inspection, private Backstage content, dynamic plugin qualification, or legal
  opinion. [C-022] [C-024]
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.

## 1. Executive summary

Renoise 3.5.4 is a maintained, proprietary, cross-platform tracker DAW whose
composition model is a sequence of line-oriented multi-track patterns rather
than a conventional horizontal audio-clip arrangement. Its distinctive
architecture-visible boundary is the instrument: one instrument may combine
samples, a hosted plugin, and MIDI, and may itself contain tracker phrases,
sample keyzones, modulation, FX chains, and macros. [C-001] [C-002] [C-004]

The public engine contract includes multicore real-time processing, selectable
audio buffers/sample rates, group/send/master routing, multi-channel hardware
I/O, automatic delay compensation for documented internal effects and VST/AU
plugins, offline/realtime WAV render, per-track/per-pattern export, and
render-to-sample/plugin freeze. Proprietary scheduling, graph mutation,
threading, crash-recovery, and persistence internals remain unknown. [C-003]
[C-005] [C-006] [C-024]

Plugin hosting is deeper than a logo list: VST2 and VST3 are documented on all
three desktop OS families; generic Audio Unit hosting is documented on macOS;
LADSPA and DSSI are documented on Linux. Renoise documents configurable scans,
a VST cache, suppression of scan-crashing plugins, optional separate-process
sandboxing, 32-bit bridging, compatibility defaults, custom editors, presets,
automation, PDC, auto-suspend, multi-timbral MIDI, multiple output buses, and
VST3 sidechains. It does **not** publicly close the contract for AUv2 versus
AUv3, sample-accurate automation, dynamic I/O, tails, stable parameter IDs,
state-chunk migration, duplicate identity, or missing-plugin placeholders.
[C-009] [C-010] [C-011] [C-012] [C-013] [C-014] [C-015] [C-016]

The Lua API 6.2 is a document/control extension plane: Tools can mutate song,
pattern, track, instrument, sample and automation data and add UI, key, menu,
MIDI, OSC, socket, timer and import integrations, but cannot replace built-in
behaviour or add real-time DSP. Standard file I/O is available; a permission,
signing, sandbox, or capability model was not documented. [C-017] [C-018]

**Architecture recommendation:** study Renoise's compact pattern/instrument
object model, explicit render-to-sample path, scan-failure cache, configurable
plugin process isolation, and strict separation between control scripting and
real-time DSP. Treat all unclosed plugin fidelity and project-migration details
as prototype requirements, not inherited facts. Confidence is **high** for the
documented user model/platform/format list, **medium-high** for host UX and
engine features, and **low/unknown** for proprietary internals and the complete
host contract. [C-025] [C-026] [C-027]

## 2. Product identity, history, and market position

The vendor describes Renoise as a complete multi-platform DAW for recording,
composing, editing, processing, and rendering with a music-tracker approach.
The sale and download of 3.5.4 at cutoff establish current maintenance and a
single desktop product identity spanning Windows, macOS, and Linux. [C-001]

Renoise is aimed at tracker-oriented composition, detailed sample work,
electronic production, plugin/hardware integration, and keyboard-driven editing.
Redux is its separately packaged sampler/phrase-sequencer plugin sibling, not a
Renoise edition. Public sources used here do not establish a complete corporate
history, market share, or user count; those are `UNKNOWN` and not needed for the
architecture decision. [C-001] [C-002] [C-022] [C-031]

## 3. Workflow and conceptual model

Time proceeds down pattern lines. A song sequences patterns; each pattern may
contain multiple standard tracks, and each standard track contains note columns
and effect columns. Patterns can be repeated and have differing lengths/speeds;
the Pattern Sequencer and Pattern Matrix arrange them into the song. [C-002]

The principal composition objects are song, sequence position, pattern, track,
line, note/effect column, automation, instrument, phrase, sample, sample
keyzone/modulation/FX set, device, and preset. An instrument is upstream of the
Pattern Editor and may combine samples, a plugin, and MIDI; a phrase is a
single-track-like tracker sequence triggered by notes. [C-004]

Standard tracks produce notes; nested group tracks collect and route children;
send tracks receive device-routed audio; the master receives final output.
Renoise therefore combines a tracker event grid with an explicit channel/device
graph rather than exposing a fully modular patch canvas. [C-003] [C-025]

Conventional horizontal audio regions, takes, comp lanes, score objects, and a
video timeline are not specified in the retained current sources. Their exact
availability/absence is `UNKNOWN`; the dossier does not infer non-support from
the manual's tracker focus. [C-030]

## 4. Publicly documented architecture

The official scripting guide states that Renoise itself is written in C++ and
exposes a Lua API layer. The public API presents application, song, tool,
document, view, MIDI and related objects; the API-6.2 repository also provides
definitions, guides, and examples. [C-017]

The user-visible processing graph consists of instrument sources feeding
tracks, ordered device chains, nested group routing, send tracks, sidechain
receivers, and a master. Plugin sandboxing can place plugins in separate
processes, while 32-bit plugins can be bridged into the 64-bit application.
[C-003] [C-012]

`UNKNOWN`: audio-thread count/topology, render-thread topology, exact graph
scheduler, lock-free/IPC mechanisms, process ownership of scanner versus plugin
instances, bridge protocol, sandbox granularity, project object implementation,
and crash-journal internals. These are proprietary and were not inferred from
UI documentation. [C-024]

## 5. Audio engine

Renoise documents Windows DirectSound/WASAPI/ASIO, macOS audio devices, and
Linux ALSA/JACK. Sample rate and buffer/latency are configurable; Linux ALSA
also exposes periods per buffer and real-time priority. Multiple hardware input
and output channels are supported. [C-005]

All available cores are used by default for real-time audio. Automatic PDC
compensates delays introduced by documented internal effects and VST/AU
plugins; external MIDI return workflows have explicit latency modes. A CPU
threshold can invoke Panic to stop playback instead of freezing the computer.
[C-005]

Offline rendering is faster and offers more options; realtime rendering records
playback and is required for line input, realtime MIDI instruments, or plugins
that misrender faster than realtime. Renoise says the internal render path is
32-bit float and emits WAV, including full song/ranges, per-track files,
per-sequence-position files, and sequence markers. Selections can render into
new samples, and plugin instruments can be frozen to sample instruments.
[C-006]

`UNKNOWN`: engine mix precision outside the stated internal render, oversampling
topology beyond documented sample interpolation, maximum sample rate/channel
count, PDC graph limits/feedback policy, plugin tail handling, dropout recovery
beyond CPU Panic, deterministic render guarantees, and scheduling/isolation
costs. [C-024]

## 6. Tracks, timeline, clips, and editing

The four documented track types are standard, group, send, and master. Notes
and per-note controls occupy note columns; effect commands and graphical
automation control instruments/devices. Groups may nest, route children through
their parent, and apply effects/automation to the aggregate. [C-002] [C-003]

Patterns form reusable song sections and can be navigated/edited continuously;
the tracker supports live quantization, pattern wrap, configurable edit step,
track duplication, mute/solo, and column-level organisation. Samples support
repitch and percussion/texture time-stretch modes tied to tempo/lines. [C-002]
[C-028]

The retained documentation does not establish conventional clip slip editing,
ripple modes, take lanes, comping, or edit-history persistence across restarts.
Those are `UNKNOWN`; sample edits do have unlimited in-session undo/redo per the
manual. [C-019] [C-030]

## 7. MIDI, sequencing, notation, and expression

Renoise records notes/controllers into patterns, accepts up to four general MIDI
input devices, supports per-instrument input routing by channel/note range/track,
and sends MIDI to external instruments or plugins. MIDI output has manual
latency modes; MIDI Clock can operate as master or slave and can send start,
stop, song-position, and MMC SysEx. Input latency adjustment and jitter fixing
are user-configurable. [C-007]

The documented expression set includes channelised note data, program change,
CC, sustain, channel pressure, pitch bend, mod wheel, and eight instrument
macros. Plugin instruments can be multi-timbral, plugin MIDI output can chain
into another instrument, and effect aliases can deliver MIDI/note data to effects
that accept it. [C-008] [C-014]

Scala `.scl` microtunings can be embedded with sample instruments; the manual
also describes plugin-mediated tuning, but sample microtuning does not
automatically affect an instrument's plugin or MIDI component. [C-004]

`UNKNOWN`: MPE profile compliance, per-note MIDI 2.0/UMP, MIDI-CI, note
expression mapping to hosted plugins, sample-accurate event delivery, general
SysEx recording/editing, and score/notation support. [C-008] [C-030]

## 8. Routing, mixer, automation, and control

Ordered effect chains feed nested groups, sends, and master. Send devices can
keep or mute the source; send tracks can feed other sends. A multiband send can
split three frequency ranges to separate destinations. Sidechain devices route
audio to compatible native or third-party receivers, and multiple sidechains
can sum into one receiver. [C-003] [C-014]

Graphical automation, effect commands, MIDI mapping, instrument macros, and Lua
Tools expose several control planes. OSC can run as UDP or TCP server with
evaluate/song/transport/trigger roots; Tools can also act as clients and define
custom OSC, MIDI, menu, key, and GUI controls. [C-007] [C-017] [C-026]

Hardware multi-I/O, MIDI Clock, Ableton Link start/stop/offset, and JACK
transport are documented. ReWire no longer functions as of Renoise 3.5 because
its owner ended support. [C-005] [C-007]

`UNKNOWN`: VCA semantics, arbitrary feedback routing rules, surround/immersive
channel beds, automation sample accuracy, write/latch/touch mode matrix, stable
parameter IDs, and controller-surface protocol support beyond MIDI/OSC/Tools.
[C-015] [C-030]

## 9. Recording, comping, and media handling

The sampler records external sources and stores imported/recorded sample data
within the song/instrument representation; editing does not alter the original
source unless the user explicitly overwrites it. Samples support draw editing,
slices, keyzones, note-on/off layers, looping, NNA, autoseek, interpolation,
anti-aliasing, time-stretch, modulation and per-sample FX assignment. [C-019]

Audio import preferences cover WAV, FLAC, AIF, OGG and MP3, with loop metadata
for WAV/FLAC/AIF; raw import and MIDI import are documented. XRNS/XRNI export can
store sample payloads as FLAC or WAV. [C-020]

`UNKNOWN`: conventional multitrack punch/loop take management, comp lanes,
source-file relinking/proxies, broadcast metadata, video conform, and media
database behaviour. The demo's render/selection restrictions are documented but
do not imply restrictions in the full version. [C-001] [C-030]

## 10. Instruments, effects, content, and native devices

The native instrument boundary combines sampler, plugin and MIDI sources. The
sampler adds tracker phrases, keyzones, waveform editing/recording, modulation
chains, sample FX chains, and eight many-to-many macros. Presets and libraries
can cover whole instruments and component sections. [C-004] [C-019]

Renoise advertises more than 26 native effects plus meta devices that modulate
other device parameters. Device chains, instrument macros and render-to-sample
make resampling a first-class CPU-management and sound-design path. [C-006]
[C-025] [C-032]

Lua Tools are native extensions for document/control/UI workflows, not native
realtime devices. The Formula device is expressly outside the Tool API boundary.
Redux reuses the sample-based instrument/phrase model as a hostable plugin but
is a separately licensed product. [C-017] [C-022]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means the retained primary sources did not affirm the exact format;
it does not mean runtime non-support. Generic “Audio Unit” evidence cannot be
silently split into AUv2 or AUv3. Full/demo hosting parity is also not stated.
[C-009] [C-010]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE: no Renoise mobile/web edition | 3.5 manual; current app 3.5.4 | Custom scan paths; 64-bit host can bridge 32-bit plugins, exact OS limits unknown | C-009, C-012 / S-004, S-007 |
| VST3 | DOCUMENTED | DOCUMENTED | DOCUMENTED | NOT_APPLICABLE: no Renoise mobile/web edition | 3.5 manual; current app 3.5.4 | Standard VST3 directories required; standardized sidechain path preferred | C-009, C-014 / S-007, S-008 |
| AUv2 | UNKNOWN: docs say Audio Unit without generation | UNKNOWN: generic AU is macOS-only | UNKNOWN: generic AU is macOS-only | NOT_APPLICABLE: no Renoise mobile/web edition | 3.5 manual/current 3.5.4 | Exact AU generation not identified | C-010 / S-006, S-007 |
| AUv3 | UNKNOWN: docs say Audio Unit without generation | UNKNOWN: generic AU is macOS-only | UNKNOWN: generic AU is macOS-only | NOT_APPLICABLE: no Renoise mobile/web edition | 3.5 manual/current 3.5.4 | Exact AU generation not identified | C-010 / S-006, S-007 |
| AAX | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no Renoise mobile/web edition | Current product/manual searched | No affirmative primary evidence; do not infer unsupported | C-010 / S-001, S-002 |
| CLAP | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no Renoise mobile/web edition | Current product/manual searched | No affirmative primary evidence | C-010 / S-001, S-002 |
| LV2 | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no Renoise mobile/web edition | Current product/manual searched | Do not conflate with LADSPA/DSSI | C-010 / S-001, S-002 |
| LADSPA | UNKNOWN: manual scopes it to Linux | UNKNOWN: manual scopes it to Linux | DOCUMENTED | NOT_APPLICABLE: no Renoise mobile/web edition | 3.5 manual/current 3.5.4 | Effects documented on Linux; deeper contract sparse | C-009, C-015 / S-006, S-007 |
| DSSI | UNKNOWN: manual scopes it to Linux | UNKNOWN: manual scopes it to Linux | DOCUMENTED | NOT_APPLICABLE: no Renoise mobile/web edition | 3.5 manual/current 3.5.4 | Instruments and effects are documented; deeper contract sparse | C-009, C-015 / S-005, S-006 |
| JSFX | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no Renoise mobile/web edition | Current product/manual searched | No affirmative primary evidence | C-010 / S-001, S-002 |
| DirectX/DXi | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no Renoise mobile/web edition | Current product/manual searched | No affirmative primary evidence | C-010 / S-001, S-002 |
| Rack Extension | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no Renoise mobile/web edition | Current product/manual searched | ReWire's historical presence is not Rack Extension support | C-010 / S-002, S-008 |
| Product-native/other | DOCUMENTED: native DSP/meta devices and XRNX Tools | DOCUMENTED: native DSP/meta devices and XRNX Tools | DOCUMENTED: native DSP/meta devices and XRNX Tools | NOT_APPLICABLE: no Renoise mobile/web edition | Renoise 3.5.4; Lua API 6.2 | Tools are control/document extensions, not realtime audio plugins; Redux is a separate VST3/AU product | C-017, C-022 / S-009, S-011, S-015 |

### 11.2 Discovery, scanning, validation, and recovery

VST2 can be enabled with initial/additional scan folders; VST3 must reside in
standard directories. AU and LADSPA have format enable switches. Renoise scans
new plugins on startup by default and offers manual rescan. [C-011]

Failed-to-open plugins can optionally be retried. A plugin that crashed while
being scanned is never rescanned through the normal UI; the user must delete VST
cache files from the preferences folder. This is documented failure suppression
and cache recovery, not evidence of a formal validator or security quarantine.
The plugin list supports search, favourites, grouping, local renaming and hiding;
hiding is a user organisation feature, not the scan-failure list. [C-011]

`UNKNOWN`: scanner process boundary, cryptographic/signature checks, schema or
ABI validation, cache layout/versioning, duplicate identity resolution,
same-ID VST2/VST3 migration, exact blacklist representation, automatic crash
recovery, and scan logs/diagnostic file locations. [C-015]

### 11.3 Runtime isolation and compatibility

Preferences expose “Plugin sandboxing (separate process)” to wrap plugins into
separate processes so faulty plugins do not crash Renoise or other running
plugins. Renoise 3.1+ is 64-bit; a documented bridge loads 32-bit plugins at an
additional processing cost, marked by an arrow icon. [C-012]

Plugin compatibility options are backed by a vendor-supplied defaults database
and can be changed per problematic plugin. The manual does not enumerate the
settings in text. [C-013]

`UNKNOWN`: sandbox modes and per-plugin/per-instance/process grouping, scanner
isolation, IPC, restart/state replay after crash, bridge OS/CPU combinations,
Apple Silicon translation policy, code-signing/notarization enforcement, and
whether a sandboxed GUI shares the audio process. [C-012] [C-015]

### 11.4 Host/plugin processing contract

Renoise hosts plugin instruments and effects. Instrument controls include MIDI
channel, program, auto-suspend, MIDI output routing, aliases for multi-timbral
use, and assignment of plugin output buses to Renoise tracks. Effect aliases can
deliver MIDI/program/note data to effects that accept it. [C-013] [C-014]

Sidechain devices can target compatible third-party effects. The manual warns
that VST2 sidechain workarounds are not guaranteed and recommends VST3, where
the function is standardized. Automatic PDC covers documented VST/AU plugins;
hover information exposes reported latency. Realtime render is the fallback for
plugins that fail faster-than-realtime. [C-005] [C-006] [C-014]

`UNKNOWN`: maximum buses/channels, dynamic bus activation, MIDI/event bus counts,
sample-accurate event/parameter delivery, MPE/MIDI 2.0, plugin tail reporting,
bypass/suspend transition semantics, offline process flags, silence flags,
in-place processing, and PDC behaviour under dynamic latency. [C-015]

### 11.5 Parameters, automation, state, presets, and project recall

Most effect parameters can be controlled by graphical automation or MIDI
mapping. Plugin instruments expose host program selection and host load/save/
rename preset actions, though some plugins only expose programs in their custom
editor. Auto-suspended instruments wake on notes or automation. [C-013]

`UNKNOWN`: parameter stable-ID rules, range/text/step mapping, gesture protocol,
sample accuracy, state chunk versus parameter serialization, external asset
references, preset file formats, VST2↔VST3 migration, state recovery after
sandbox failure, and whether project saves preserve unavailable plugin state.
[C-015] [C-016]

### 11.6 UI, diagnostics, and failure modes

Plugins can expose parameters in the Renoise device and open a custom external
editor; instrument editors can be pinned and text keyboard focus can be enabled.
Hover information includes latency and loaded path. UI search/hide/group/rename
operations aid large inventories. [C-013]

Documented failure controls are rescan, retry of non-crashing failures, cache
deletion for scan-crashing entries, compatibility options, separate-process
sandboxing, and realtime-render fallback. There is no retained documentation for
headless plugin operation, plugin UI DPI negotiation, crash reports, per-plugin
logs, or missing-plugin placeholders. [C-011] [C-012] [C-015] [C-016]

## 12. Extensibility and integration

Lua API 6.2 exposes song/application/tool data and permits generation or
modification of notes, patterns, phrases, tracks, instruments, samples,
automation, slices, keyzones and built-in device parameters. Tools can add
menus, keybindings, MIDI mappings, dialogs, import hooks, timers, application
event observers, OSC/socket integration and XML-backed preferences. [C-017]

The official boundary is explicit: a Tool cannot override existing Renoise
behaviour or alter built-in editor behaviour, and cannot implement realtime DSP;
sample processing by a Tool is offline. The Formula device is not Tool API DSP.
[C-017]

Tool code uses standard Lua file I/O and may communicate with external software.
No permission prompt, per-tool capability declaration, signature requirement,
process sandbox, or resource quota was found. The packaging extension is XRNX
in examples, but exact install/update/signing and API-version rejection rules
were not closed by retained sources. [C-018]

## 13. Project format, persistence, interoperability, and collaboration

XRNS song and XRNI instrument files are documented as ordinary ZIP archives
with custom extensions; they can embed sample data as FLAC or WAV. XRNI carries
the instrument boundary, while XRNS carries the song. Automatic rolling song
backups can be timed, retained by count, placed beside the song or in another
folder, and optionally saved during playback. [C-020] [C-021]

MIDI import can create instruments and MIDI-control devices and divide content
into patterns. Rendered WAV can carry sequence markers; stems can be produced
per track. SFZ import/export appears at instrument boundaries in the product and
preferences documentation. [C-006] [C-020]

`UNKNOWN`: current XML schema version and element semantics, integrity
constraints, plugin state representation, asset relinking, stable object IDs,
forward/backward compatibility, atomic save protocol, corruption recovery,
missing-plugin placeholders, migrations, AAF/OMF/ADM/MusicXML/DAWproject,
cloud collaboration, and version-control semantics. A public 2026 schema forum
page was attempted but returned an empty fetch; no search snippet was promoted
to evidence. [C-021]

## 14. Delivery, live, post-production, and specialized workflows

Delivery is WAV-oriented: full/range renders, per-track stems, per-sequence
position files, sequence markers, realtime/offline modes, and render-to-sample.
MP3 is explicitly not rendered directly. No retained evidence establishes DDP,
loudness targets, ADM, immersive delivery, or batch job queues. [C-006] [C-030]

Live and hybrid workflows include per-instrument MIDI input routing, quantized
tracker recording, hardware multi-I/O, line-input monitoring, MIDI Clock
master/slave, Ableton Link start/stop, JACK transport, OSC, keyboard mappings,
and controller Tools. ReWire is nonfunctional in 3.5. [C-007] [C-026]

Redux extends the phrase/sample performance model into another DAW as VST3 on
Windows/macOS/Linux and Audio Unit on macOS in current 1.4.4 downloads, with MIDI
output to the host; it is not Renoise's live mode or plugin-host engine. [C-022]

## 15. Performance, reliability, security, and accessibility

Performance controls include multicore realtime processing, audio buffer/sample
rate choice, plugin auto-suspend, render/freeze to samples, optional plugin
sandboxing, 32-bit bridge overhead disclosure, and a CPU threshold that triggers
Panic. Backup cadence/retention and scan-failure cache recovery are documented.
[C-005] [C-006] [C-011] [C-012] [C-013]

Third-party plugins are a trust boundary; separate-process wrapping reduces the
documented blast radius but is not proof of a security sandbox. Lua Tools can
read/write files and communicate externally, while no capability/security model
was documented. Code-signing, notarization, telemetry, privacy, update rollback,
and incident diagnostics remain `UNKNOWN`. [C-018] [C-024]

The UI supports 100–350% scaling, Retina/Metal display options, custom themes,
keyboard remapping and a documented minimum 990×550 window. Screen-reader
semantics, full keyboard accessibility, captions, WCAG testing and assistive
technology certification are `UNKNOWN`. [C-030] [C-033]

## 16. Licensing, ecosystem, and implementation constraints

The Renoise application is proprietary. Its agreement grants the named licensee
a non-exclusive, permanent, worldwide, non-sublicensable right; installation on
multiple personally used computers is permitted, while redistribution,
derivatives, reverse engineering, decompilation and disassembly are restricted.
The German text controls on ambiguity. This summary is not legal advice.
[C-023]

The public `renoise/xrnx` scripting repository is MIT-licensed, but that does
not relicense Renoise, bundled content, trademarks, or proprietary APIs beyond
the repository terms. Redux has a separate paid entitlement. [C-022] [C-023]

Renoise's ability to host VST/AU/LADSPA/DSSI is evidence about Renoise, not a
grant to a new DAW to use format SDKs, trademarks, redistribute binaries, or
claim compatibility. Current VST2/VST3, Apple AU, AAX, CLAP, LV2 and other SDK
terms/certification were out of this product-specific source budget and require
separate format-owner legal review. [C-027]

Clean-room limits prohibit copying Renoise code, UI expression, content, schemas
or proprietary behaviour. Transferable lessons below are framed as independent
problem/mechanism abstractions. [C-024] [C-027]

## 17. Strengths, liabilities, and architecture lessons

**Strengths:** a compact tracker/pattern model; a rich composite instrument;
sample ownership and resampling integrated with composition; explicit group/send
routing; cross-platform plugin breadth; visible scan failure recovery; optional
process isolation; and a capable non-DSP scripting plane. [C-002] [C-004]
[C-006] [C-011] [C-012] [C-017]

**Liabilities for broad DAW reference:** the pattern-first model does not, in
retained documentation, close clip/take/comp/post workflows; many plugin fidelity
details and project migration guarantees are unknown; Tool file/network access
has no documented capability model; and 32-bit bridging plus VST2 support carry
legacy complexity. [C-015] [C-018] [C-030]

**Lesson:** Renoise is a strong reference for tracker and sampler workflows and
for separating realtime hosting from Lua document/control extension. It is not
by itself sufficient evidence for a complete modern plugin host, media engine,
collaboration system, or post-production DAW. [C-025] [C-026]

## 18. Transferable patterns

1. **Pattern/instrument dual hierarchy — `CANDIDATE`.** Problem: represent dense
   musical events and reusable timbres compactly. Minimal mechanism: sequence of
   reusable line grids plus instruments that own sample/plugin/MIDI sources and
   phrases. Prerequisites: stable event timing and explicit instrument identity.
   Tradeoff: tracker fluency versus horizontal-timeline expectations. Risk:
   medium interaction-design adaptation; do not copy UI/expression. [C-002]
   [C-004]
2. **Render-to-sample as a first-class graph operation — `CANDIDATE`.** Problem:
   bound CPU and preserve creative iteration. Mechanism: render a selected event
   range or plugin instrument into a managed sample/instrument while retaining a
   clear replacement/new-object choice. Tradeoff: destructive-looking workflow
   and provenance/undo requirements. Risk: medium state/latency correctness.
   [C-006]
3. **Scan failure ledger plus explicit retry — `CANDIDATE`.** Problem: prevent a
   crashing plugin from blocking every launch. Mechanism: cache the outcome,
   skip known scan-crash entries, expose retry, and provide a cache-reset path.
   Prerequisites: stable plugin identity and diagnosable logs. Tradeoff: stale
   negatives. Risk: high if identity/cache migration is weak. [C-011]
4. **Configurable plugin process containment — `CONDITIONAL`.** Problem: isolate
   untrusted native plugins. Mechanism: selectable separate-process wrapping and
   explicit bridge status. Prerequisites: IPC, state replay, deadline policy,
   UI hosting and crash UX. Tradeoff: latency/memory/complexity. Renoise does not
   document enough internals to copy a design; prototype independently. [C-012]
5. **Control-plane scripting, realtime DSP elsewhere — `CANDIDATE`.** Problem:
   enable deep workflow extensions without putting script code in the audio
   callback. Mechanism: mutable document API, events, UI/import/controller hooks,
   offline sample processing, and a separately governed DSP plugin API.
   Prerequisite: capability/security model stronger than the one documented
   here. Tradeoff: scripts cannot redefine core editing/DSP. [C-017] [C-018]
6. **Explicit realtime-render fallback — `CANDIDATE`.** Problem: plugins or
   external I/O may not support faster-than-realtime render. Mechanism: offer
   offline and realtime modes and surface why the fallback exists. Tradeoff:
   slower export and need for reproducibility diagnostics. [C-006]

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject: infer support from a format family label.** Generic Audio Unit is
  insufficient to claim AUv2 or AUv3; VST scanning is insufficient to claim the
  whole host contract. Reopen only with versioned format-owner or host
  qualification evidence. [C-010] [C-015]
- **Reject: copy proprietary tracker/UI expression or internal schemas.** Only
  abstract object/mechanism lessons are in frame. [C-023] [C-024]
- **Reject: assume separate process equals security sandbox.** The docs promise
  crash containment, not OS-level least privilege. [C-012]
- **`CURIOSITY_NO_GO` — XRNS/XRNI schema integrity.** Relevance 5/5, EV 4/5,
  novelty 4/5, cost 5/5. The attempted current forum source was inaccessible;
  bundled schemas would require product access and still would not prove save/
  migration internals. Reopen in a safe fixture phase with vendor-distributed
  schemas and generated minimal projects.
- **`CURIOSITY_NO_GO` — AUv2 versus AUv3.** 4/5, 4/5, 3/5, 3/5. Important to the
  matrix but less architecture-changing than missing-state behaviour; reopen
  with a macOS inventory probe and vendor confirmation.
- **`CURIOSITY_NO_GO` — sample-accurate automation/dynamic I/O/tails.** 4/5,
  3/5, 4/5, 5/5. Documentary sources saturated; requires instrumented plugins.
- **`CURIOSITY_NO_GO` — Tool signing/permissions/package lifecycle.** 3/5, 3/5,
  3/5, 4/5. Standard file I/O already establishes the architecture risk; deeper
  work would not change the recommendation for a new capability model.
- **`CURIOSITY_NO_GO` — Redux as a separate dossier.** It is a plugin, not the
  owned DAW boundary, and its architecture lesson is already represented.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary result | Contradiction/limit | Later discriminating probe |
| --- | --- | --- | --- |
| H1: Renoise is fundamentally a line/pattern tracker, not merely a skinned linear DAW. | Supported: pattern lines, reusable patterns, Pattern Sequencer/Matrix are documented. [C-002] | Does not prove absence of every horizontal view. | Create a small project and inventory all arrangement objects/views. |
| H2: The instrument is only a sampler preset. | Falsified: it may combine samples, plugin and MIDI and own phrases/modulation/FX. [C-004] | Exact persistence graph unknown. | Inspect a safely generated XRNI/XRNS with all source types. |
| H3: “VST support” means one undifferentiated host path. | Falsified: VST2/VST3 have distinct categories/scan rules; VST3 is preferred for sidechain. [C-009] [C-014] | Runtime identity/migration remains unknown. | Differential VST2/VST3 twin-plugin fixture. |
| H4: accepted → scanned → instantiated → full contract are equivalent. | Falsified by docs: paths and cache cover discovery/scan, while separate pages cover instantiate, UI, MIDI, buses and render fallbacks. [C-011] [C-013] [C-015] | No dynamic observations were made. | Matrix fixture covering scan, instantiate, audio, MIDI, automation, state, offline, crash. |
| H5: plugin sandboxing means security isolation. | Not supported; only crash containment is documented. [C-012] | OS privileges and IPC unknown. | Observe process tree/entitlements/filesystem/network in a disposable host. |
| H6: automatic PDC closes all latency cases. | Not supported; scope is documented internal effects/VST/AU, while external MIDI has manual modes. [C-005] | Dynamic latency and sidechain graph cases unknown. | Impulse-based latency matrix with dynamic latency changes. |
| H7: XRNS/XRNI being ZIP makes them fully specified interchange formats. | Falsified: container fact is documented, schema/integrity/migration are not. [C-020] [C-021] | Current bundled schemas were not accessed. | Validate round trips against vendor schemas and malformed-reference corpus. |
| H8: missing plugins retain a placeholder and state. | `UNKNOWN`: two official-manual searches returned no matches; web search was rate-limited. [C-016] | Negative search is not proof. | Save effect/instrument states, remove binaries, reopen/resave/reinstall, compare state. |

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Renoise 3.5.4 is the current paid/demo desktop release for Windows x64, macOS universal, Linux x86-64/arm64, with stated OS/runtime minima and demo restrictions. | Cutoff/current download | S-001, S-003, S-004, S-021 | Vendor product/download/system/shop pages triangulate identity. | Vendor documentation, not installed-build observation; full/demo plugin parity unstated. |
| C-002 | DOCUMENTED | High | Songs sequence reusable, variable patterns whose line-oriented multi-track note/effect columns are the primary editor. | 3.5 manual | S-001, S-016 | Direct manual description and 3.5 screenshots. | Does not prove absence of every alternate view. |
| C-003 | DOCUMENTED | High | Standard/group/send/master tracks and ordered devices form the visible routing graph; groups nest and sends/sidechains route audio. | 3.5 manual | S-008, S-016 | Direct track/routing chapters. | Feedback legality and internal graph implementation unknown. |
| C-004 | DOCUMENTED | High | An instrument may combine samples, plugin and MIDI and may own phrases, sample keyzones/modulation/FX/macros; sample microtuning is supported. | Renoise 3.5 manual | S-017, S-018 | Direct instrument/sampler chapters. | Exact object persistence and maxima not documented. |
| C-005 | DOCUMENTED | Medium-high | The engine exposes configurable rate/buffer/drivers, multicore realtime use, multi-I/O, automatic PDC for stated internal effects and VST/AU, external-MIDI latency modes, and CPU Panic. | 3.5 manual/vendor headline | S-001, S-007, S-008 | Direct settings and routing descriptions. | Vendor claims; scheduling, dynamic PDC, maxima unknown. |
| C-006 | DOCUMENTED | High | Renoise offers offline/realtime WAV render, 32-bit-float internal render, stems/pattern files/markers, render-to-sample and plugin freeze; realtime is compatibility fallback. | Full version; demo restrictions separate | S-003, S-005, S-019 | Direct render/plugin/download pages. | Runtime accuracy not independently observed; tail/determinism unknown. |
| C-007 | DOCUMENTED | High | MIDI routing/clock master-slave, MMC, Ableton Link, JACK transport, OSC, latency/jitter controls, and ReWire removal in 3.5 are documented. | 3.5 manual | S-001, S-007, S-008 | Direct preferences/routing product sections. | MTC and protocol edge cases not closed. |
| C-008 | DOCUMENTED + UNKNOWN | Medium | MIDI notes, CC, program change, channel pressure, pitch bend, mod wheel and channels are documented; MPE/MIDI 2.0/per-note host delivery are not. | 3.5 manual | S-005, S-007, S-017 | Positive controls are explicit; unknowns are bounded to absent contract. | Absence is not non-support. |
| C-009 | DOCUMENTED | High | VST2/VST3 are enabled on Windows/macOS/Linux; generic AU on macOS; LADSPA and DSSI on Linux; DSSI is also an instrument source. | 3.5 manual/current 3.5.4 | S-001, S-005, S-006, S-007 | Preferences gives most precise OS/format matrix. | Generic AU does not identify AUv2/AUv3; deeper LADSPA/DSSI contract sparse. |
| C-010 | UNKNOWN | High that evidence is insufficient | Exact AU generation and affirmative AAX/CLAP/LV2/JSFX/DX/DXi/Rack Extension support were not established. | Current Renoise | S-001, S-002, S-006, S-007 | Current official format lists/manual index reviewed. | Cannot convert omission into “unsupported”; needs vendor matrix/probe. |
| C-011 | DOCUMENTED | High | Startup/manual scans, VST2 paths, standard VST3 dirs, retries, VST cache reset for scan-crashing plugins, and list organisation are documented. | 3.5 manual | S-005, S-007 | Direct Plugins/Misc and Plugin pages. | Scanner process, duplicate identity, logs and validation internals unknown. |
| C-012 | DOCUMENTED + UNKNOWN | High for controls; low for internals | Configurable separate-process plugin wrapping and 32-bit bridging are documented; process granularity, IPC, restart and OS scope are unknown. | Renoise 3.1+ / 3.5 | S-004, S-007 | Direct system requirements/preferences text. | “Sandbox” promises crash containment only, not least privilege. |
| C-013 | DOCUMENTED | High | Plugins expose custom editors/parameters, programs/presets, latency/path info, auto-suspend and compatibility defaults/options. | 3.5 manual | S-005, S-006 | Direct instrument/effect UI descriptions. | Exact compatibility flags and UI scaling/headless rules absent. |
| C-014 | DOCUMENTED | High | Plugin instruments support MIDI chaining, multi-timbral aliases and output-bus-to-track routing; effects can receive MIDI aliases/sidechains; VST2 sidechains are not guaranteed. | 3.5 manual | S-005, S-006, S-008 | Direct plugin/routing chapters. | Maximum/dynamic bus contract and event timing unknown. |
| C-015 | UNKNOWN | High that contract is open | Sample accuracy, dynamic I/O, tails, parameter identity/text, state chunks, migration, duplicate IDs, failure replay and deep LADSPA/DSSI fidelity are undocumented in retained sources. | Current host contract | S-005, S-006, S-007, S-008, S-019 | Required host-contract fields were checked across primary host pages. | Must be resolved dynamically or by deeper vendor engineering docs. |
| C-016 | UNKNOWN | High that evidence is absent | Missing-plugin placeholder, state retention, relink and resave behaviour are not documented by retained sources. | XRNS recall, all formats | S-022, S-023 | Exact official-manual searches returned no results; broader search hit rate limits. | Negative search does not prove no placeholder; decisive probe specified. |
| C-017 | DOCUMENTED | High | Lua API 6.2 Tools mutate document/music data and add UI/controller/import/event integrations but cannot override built-ins or implement realtime DSP. | API 6.2 / Renoise 3.5 | S-009, S-010, S-011, S-012, S-013 | Official repo tag/book/guides. | Repository docs describe API, not host scheduling or security. |
| C-018 | DOCUMENTED + UNKNOWN | Medium-high | Tools have standard Lua file I/O and external communication; no permission/signing/process/capability model was documented. | API 6.2 | S-011, S-012, S-014 | Positive I/O/socket capabilities plus bounded documentation review. | Security controls could exist outside retained docs; dynamic probe needed. |
| C-019 | DOCUMENTED | High | Samples are owned per song/instrument, source-nondestructive, undoable and support recording/editing/keyzones/phrases/time-stretch/modulation/FX. | 3.5 manual | S-018 | Direct sampler chapter. | “Endless” undo is vendor wording; persistence and memory bounds unknown. |
| C-020 | DOCUMENTED | High | XRNS/XRNI are custom-extension ZIP files that can embed FLAC/WAV samples; WAV/FLAC/AIF/OGG/MP3 and raw-audio import, MIDI import, and related instrument/SFZ export settings are documented. | 3.5 manual | S-007, S-015 | Direct Files preferences section plus Redux's stated SFZ import boundary. | Internal XML/schema/state structure not retained; codec/container edge cases untested. |
| C-021 | DOCUMENTED + UNKNOWN | Medium | Timed rolling backups are documented; XRNS/XRNI schema integrity, migrations, plugin state, atomic save and compatibility are unknown. | Current 3.5 | S-007 | Backup controls are direct; schema fetch failed and was not inferred. | Vendor-bundled schemas may close syntax, not behavioural integrity. |
| C-022 | DOCUMENTED | High | Redux is separately licensed sampler/phrase-sequencer plugin sibling; current 1.4.4 is VST3 on all desktop OSes and AU on macOS, with host MIDI output. | Boundary only | S-003, S-015, S-017, S-021 | Product/download/manual/shop triangulation. | Redux internals and host compatibility not qualified here. |
| C-023 | DOCUMENTED | High | Renoise is proprietary under personal perpetual use terms with stated install/transfer/reverse-engineering/redistribution restrictions; the public xrnx API repository's API-6.2 LICENSE is MIT. | Current public terms / API-6.2 | S-020, S-021, S-024 | Direct product agreement/shop and raw repository license text. | Not legal advice; German product agreement controls ambiguities; MIT covers the repository materials, not Renoise. |
| C-024 | UNKNOWN | High | Proprietary engine, scanner, bridge, sandbox, persistence and recovery internals not publicly established remain unknown. | Internal architecture | S-002, S-004, S-007, S-013 | Public docs expose behaviour/settings, not implementation. | No decompilation/install/proprietary access allowed. |
| C-025 | INFERENCE | Medium-high | Pattern/instrument ownership and first-class resampling are strong clean-room architecture references for tracker/sample workflows. | New-DAW decision | C-002, C-004, C-006, C-019 | Assumes target includes tracker/sample users. | Alternative: horizontal clip model may better fit other cohorts. |
| C-026 | INFERENCE | Medium-high | Separating Lua document/control extensions from realtime DSP is transferable, but should be paired with explicit capabilities and versioning. | New-DAW decision | C-017, C-018 | Bounds audio-thread risk while retaining extensibility. | Native/WASM DSP extensions could use a different safe model. |
| C-027 | INFERENCE | High | Renoise support/licensing cannot authorize another product's SDK/trademark/redistribution compatibility claims. | Legal/implementation boundary | C-009, C-023 | Product evidence and IP scope are distinct. | Separate format-owner review required; no legal conclusion here. |
| C-028 | DOCUMENTED | Medium-high | Pattern editing includes quantization, edit step, wrap, duplication, continuous pattern view; sample beatsync/time-stretch supports tempo workflows. | 3.5 manual | S-016, S-018 | Direct UI/manual descriptions. | No dynamic usability/performance measurement. |
| C-029 | DOCUMENTED | High | Demo restrictions and current paid version entitlement differ materially for rendering/ASIO and update access. | Current download/shop | S-003, S-021 | Direct current pages. | Future entitlement policy may change. |
| C-030 | UNKNOWN | High that evidence is insufficient | Takes/comping, video, notation, surround/immersive, formal accessibility, advanced interchange and post features are not established by retained sources. | Current Renoise | S-002, S-016, S-019 | Complete manual index and relevant chapters reviewed. | Omission is not proof of unsupported behaviour. |
| C-031 | UNKNOWN | High that evidence is unnecessary | Full corporate history, adoption/market share and user demographics were not established. | Market context | S-001, S-003 | Product identity/current maintenance suffices for decision. | Secondary market research intentionally not pursued. |
| C-032 | DOCUMENTED | Medium-high | Renoise advertises more than 26 native effects and meta devices; device chains, macros and resampling integrate them into tracker/sample workflows. | Current product / 3.5 manual | S-001, S-018, S-019 | Product inventory is bounded by manual workflow evidence. | Inventory is vendor-stated and not independently counted or benchmarked. |
| C-033 | DOCUMENTED + UNKNOWN | High for controls; low for formal accessibility | UI scaling to 100–350%, Retina/Metal options, custom themes, remappable keys and a 990×550 minimum window are documented; assistive-technology conformance is not. | Current requirements / 3.5 manual | S-004, S-007 | Direct requirements and GUI/keys/theme preferences. | Screen-reader semantics and accessibility certification require dynamic/user testing. |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Vendor statements establish what Renoise
documents, not independent runtime measurements.

- **S-001 — “Renoise.”** Renoise, product page,
  <https://www.renoise.com/products/renoise>. Primary current product overview;
  scope: current family. Relevant passages: tracker DAW identity, Windows/macOS/
  Linux, VST/AU/LADSPA/DSSI, MIDI/OSC, multicore, PDC, multi-I/O, Lua and native
  effects/meta devices. Supports C-001/002/005/007/009/032. Limitation:
  marketing-level, no version/deep contract.
  Selected first to pin vendor product claims; preferable to reviews.
- **S-002 — “Renoise & Redux User Manual / Welcome.”** Renoise,
  <https://tutorials.renoise.com/wiki/Main_Page>. Primary manual index, copyright
  2023; scope: Renoise/Redux manual. Supports C-002/010/024/030 by identifying
  covered chapters and product boundary. Limitation: index is not proof of
  feature absence. Selected as the authoritative map for bounded retrieval.
- **S-003 — “Downloads.”** Renoise, <https://www.renoise.com/download>. Primary
  release/download matrix; scope: Renoise 3.5.4, Redux 1.4.4. Passages: OS/CPU
  builds and demo restrictions/current Redux formats. Supports C-001/006/022/
  029. Limitation: no release date or host details. Preferable to package mirrors.
- **S-004 — “System Requirements.”** Renoise,
  <https://www.renoise.com/system-requirements>. Primary requirements; scope:
  current Renoise/Redux. Passages: OS minima, Linux glibc/X.org/audio, 64-bit
  since 3.1, 32-bit plugin bridge and minimum window. Supports
  C-001/012/024/033. Limitation: bridge OS details absent. Selected over
  community compatibility reports.
- **S-005 — “Plugin.”** Renoise User Manual,
  <https://tutorials.renoise.com/wiki/Plugin>. Primary host manual; 3.5 UI.
  Passages: VST/AU/DSSI instruments, VST/VST3 categories, paths, presets,
  auto-suspend, MIDI/audio routing, aliases, compatibility DB, external UI.
  Supports C-006/008/009/011/013/014/015. Limitation: no state/missing-plugin
  contract. Selected because it is the deepest official instrument-host page.
- **S-006 — “Plugin Effects.”** Renoise User Manual,
  <https://tutorials.renoise.com/wiki/Plugin_Effects>. Primary effects-host
  manual; 3.5 UI. Passages: OS-specific format list, custom editor, latency/path,
  compatibility, automation/MIDI/effect aliases. Supports C-009/010/013/014/015.
  Limitation: format labels do not prove full fidelity. Complements S-005.
- **S-007 — “Preferences.”** Renoise User Manual,
  <https://tutorials.renoise.com/wiki/Preferences>. Primary configuration manual;
  3.5 UI. Passages: audio/multicore/PDC/Panic, MIDI/Link/OSC, imports, XRNS/XRNI
  ZIP, plugin paths/rescan/cache/crash suppression/sandboxing, backups/UI scale.
  Supports C-005/007/009/011/012/015/020/021/033. Limitation: screenshots contain
  compatibility/sandbox choices not enumerated in text. Highest-value host source.
- **S-008 — “Routing Devices.”** Renoise User Manual,
  <https://tutorials.renoise.com/wiki/Routing_Devices>. Primary routing manual;
  3.5 UI. Passages: input, sends, multiband sends, sidechains, VST2 warning/VST3,
  ReWire removal. Supports C-003/005/007/014/015. Limitation: no internal graph
  algorithm. Selected to distinguish routing from mere format support.
- **S-009 — `renoise/xrnx`, API-6.2 tree.** Renoise GitHub,
  <https://github.com/renoise/xrnx/tree/API-6.2>. Official public repository/tag;
  scope: Lua API 6.2/Renoise 3.5. Passages: official repo, docs, definitions,
  example Tools and LICENSE path. Supports C-017. Limitation: mutable GitHub
  rendering around a named branch/tag; exact commit was not separately pinned.
  Preferable to third-party Tool tutorials.
- **S-010 — “Renoise Scripting.”** Renoise,
  <https://renoise.github.io/xrnx/>. Official book landing page; API-6.2-era
  published docs. Supports C-017. Limitation: introductory only. Selected to
  establish the canonical guide relation to S-009.
- **S-011 — “Possibilities.”** Renoise scripting guide,
  <https://renoise.github.io/xrnx/start/possibilities.html>. Primary API guide.
  Passages: song/instrument/sample/UI/controller operations, OSC/WebSocket,
  explicit inability to override built-ins or write realtime DSP. Supports
  C-017/018. Limitation: examples, not a security specification. Selected for
  explicit capability and non-capability boundaries.
- **S-012 — “Renoise Tool.”** Renoise scripting guide,
  <https://renoise.github.io/xrnx/guide/tool.html>. Primary API guide. Passages:
  menu/key/MIDI/UI/import/timer/notifier/preferences lifecycle. Supports C-017/
  018. Limitation: long tutorial, packaging/signing omitted. Selected for actual
  entry points rather than high-level claims.
- **S-013 — “Setting up your development environment.”** Renoise scripting
  guide, <https://renoise.github.io/xrnx/start/development.html>. Primary guide.
  Passages: C++ host/Lua API layer, editor/reload, API definitions. Supports
  C-017/024. Limitation: “without dangers of crashing” is guidance, not a formal
  isolation guarantee. Selected for the only public implementation-language
  boundary; not extrapolated to internals.
- **S-014 — “File IO & Bits.”** Renoise scripting guide,
  <https://renoise.github.io/xrnx/guide/files&bits.html>. Primary API guide.
  Passage: standard Lua `io` external file read/write and bit library. Supports
  C-018. Limitation: no permission/security discussion. Selected to test whether
  Tools are capability-sandboxed; positive file access is decisive.
- **S-015 — “Redux.”** Renoise, <https://www.renoise.com/products/redux>.
  Primary product page. Passages: sample instrument/phrase sequencer, VST/AU,
  MIDI output, macros, presets, per-note modulation and SFZ import. Supports
  C-020/022. Limitation:
  headline formats are superseded in precision by S-003. Selected to bound Redux
  without expanding into a second dossier.
- **S-016 — “Pattern Editor.”** Renoise User Manual,
  <https://tutorials.renoise.com/wiki/Pattern_Editor>. Primary workflow manual;
  3.5 UI. Passages: pattern sequence, track types, nested groups, columns,
  quantization/automation controls. Supports C-002/003/028/030. Limitation: no
  usability measurement. Selected as canonical core workflow evidence.
- **S-017 — “Instruments.”** Renoise User Manual,
  <https://tutorials.renoise.com/wiki/Instruments>. Primary instrument manual;
  3.5 UI. Passages: sample+plugin+MIDI composition, presets/libraries,
  microtuning, Redux distinction. Supports C-004/008/022. Limitation: object
  serialization not described. Selected to resolve the product's key object.
- **S-018 — “Sampler.”** Renoise User Manual,
  <https://tutorials.renoise.com/wiki/Sampler>. Primary sampler manual; 3.5 UI.
  Passages: per-instrument ownership, non-destructive source behaviour, phrases,
  keyzones, waveform, modulation/FX, time-stretch, NNA, macros. Supports C-004/
  019/028/032. Limitation: “endless undo” not independently tested. Selected over
  feature summaries for the sample model.
- **S-019 — “Render Song to Audio File.”** Renoise User Manual,
  <https://tutorials.renoise.com/wiki/Render_Song_to_Audio_File>. Primary render
  manual. Passages: offline/realtime, WAV, 32-bit float, stems/patterns/markers,
  plugin caveat and render-to-sample. Supports C-006/015/030/032. Limitation: no
  tail or determinism contract. Selected to establish realtime/offline divergence.
- **S-020 — “License Agreement.”** Renoise,
  <https://www.renoise.com/license-agreement>. Primary legal terms; current page.
  Passages: personal/perpetual/worldwide/non-sublicensable license, installs,
  transfers, prohibited reverse engineering/redistribution, German precedence.
  Supports C-023. Limitation: not format SDK terms and not legal advice. Selected
  instead of pricing-site summaries.
- **S-021 — “Shop.”** Renoise, <https://www.renoise.com/shop>. Primary commerce
  page at cutoff. Passages: Renoise license 3.5.4→4.5.4; Redux 1.4.4→2.4.4 and
  separate prices. Supports C-001/022/023/029. Limitation: prices/policy can
  change. Selected to pin current entitlement, not procurement advice.
- **S-022 — manual full-text search: `"missing plugin"`.** Renoise User Manual,
  <https://tutorials.renoise.com/index.php?title=Special:Search&search=%22missing+plugin%22&fulltext=1>.
  Primary-site negative search; returned no matching content pages. Supports
  only the attempted-method portion of C-016. Limitation: indexing/wording gaps;
  no result is not proof. Retained to make the negative result auditable.
- **S-023 — manual full-text search: `"plugin not found"`.** Renoise User Manual,
  <https://tutorials.renoise.com/index.php?title=Special:Search&search=%22plugin+not+found%22&fulltext=1>.
  Primary-site negative search; returned no matching content pages. Supports
  only C-016's attempted method. Same limitation; selected as the one alternate
  official phrase before stopping.
- **S-024 — `renoise/xrnx` API-6.2 `LICENSE`.** Renoise authors,
  <https://raw.githubusercontent.com/renoise/xrnx/API-6.2/LICENSE>. Official raw
  repository license; scope: the API-6.2 branch/tag. Relevant passage: MIT
  License, copyright 2024 Renoise authors, permission/notice/warranty terms.
  Supports C-023. Limitation: it licenses repository software/documentation, not
  the proprietary Renoise application or trademarks. Selected in a post-draft
  source audit because S-009 exposed the file but not its text; preferable to an
  untrusted search snippet.

**Unretained/negative access results:** the guessed official release-notes index
returned HTTP 404; a 2026 official-forum schema topic returned an empty body;
two broader curiosity web searches were HTTP 429 rate-limited; nested delegation
was unavailable because this subagent was already at the maximum depth. Search
snippets from those attempts were treated as untrusted and support no claim.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted methods / blocker | Decision impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| Missing-plugin placeholder, state retention and relink | S-005–S-007 reviewed; S-022/S-023 exact searches negative; web search 429 | Project durability and cross-machine recall | Save instrument/effect presets and project, remove each format binary, open/resave/reinstall, byte/parameter compare | Disposable hosts/plugins; unassigned interoperability owner |
| AUv2 versus AUv3 | Product/manual only says Audio Unit | macOS host scope and SDK choice | Enumerate scanned component kinds with known AUv2/AUv3 fixtures; ask vendor for matrix | macOS fixture/vendor response; unassigned |
| Full plugin state/parameter contract | Host pages omit IDs/chunks/ranges/sample accuracy | Automation and migration architecture | Synthetic plugin with changing IDs, text/range, opaque state, dynamic latency/I/O | Custom VST2/VST3/AU fixtures; unassigned |
| Sandbox/bridge topology and recovery | UI docs expose controls, not process model | Crash/security/latency design | Observe process tree and crash individual scanner/audio/UI instances; inspect only public logs | Disposable OS VMs; unassigned security/runtime owner |
| XRNS/XRNI schema, integrity, migration | ZIP fact retained; forum fetch empty; no installed schemas by scope | Persistence/interchange and repair | Use vendor-distributed schemas from a lawful install; generate minimum/invalid/reference cases and round-trip versions | Licensed disposable install; unassigned format owner |
| PDC/dynamic latency/tails | Static PDC/manual render only | Mix correctness | Impulse and long-tail fixtures across groups/sends/sidechains, latency changes, offline/realtime | Audio loopback/custom plugins; unassigned |
| MPE/MIDI 2.0/sample-accurate MIDI | Current manual describes MIDI 1 controls only | Modern expression model | Send timestamped MPE/UMP/event bursts to a logging plugin and external loopback | MIDI fixtures; unassigned |
| Tool security/package lifecycle | API docs show file/network reach; no capability/signing docs | Extension trust and supply chain | Install a benign Tool in a VM; observe file/network prompts/process and incompatible API manifest handling | Disposable Renoise license/Tool fixture; unassigned security owner |
| Conventional take/comp/post/accessibility features | Manual index/relevant chapters do not establish them | User-model breadth | Guided current-version UI inventory plus screen-reader accessibility tree | Licensed app and AT fixtures; unassigned UX owner |

## 24. Curiosity pass and stop decision

After the first full synthesis, candidate threads were scored 1–5 (higher cost is
worse):

| Thread | Relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Missing-plugin/state recall | 5 | 5 | 4 | 2 | Pursued: nested agent unavailable; two official searches returned no results; retained as UNKNOWN |
| XRNS/XRNI integrity | 5 | 4 | 4 | 5 | CURIOSITY_NO_GO: requires schemas/dynamic fixtures |
| AUv2 versus AUv3 | 4 | 4 | 3 | 3 | CURIOSITY_NO_GO: lower architecture impact |
| Sample-accurate automation/dynamic I/O/tails | 4 | 3 | 4 | 5 | CURIOSITY_NO_GO: requires synthetic plugins |
| Tool signing/permissions | 3 | 3 | 3 | 4 | CURIOSITY_NO_GO: positive file/network access already fixes recommendation |

**Gaps after curiosity:** missing-plugin state, exact AU generation, deep host
fidelity, project schema/integrity, and process internals remain open.
**Contradictions:** no material contradiction among retained primary sources.
The apparent “VST/AU” simplicity of product headlines is narrowed—not
contradicted—by the manual's VST2/VST3 and OS-specific detail. ReWire pages are
historical, while the current routing page explicitly says it no longer works in
3.5. **Saturation:** additional manual/product pages were repeating the same
boundaries; the one highest-value follow-up produced only negative results and
the remaining questions require dynamic fixtures or inaccessible/bundled
materials. **Stop decision:** stop for sufficient coverage plus documentary
saturation and bounded access limits. Marginal documentary evidence is
nonpositive; proceed next to disposable interoperability prototypes, not more
unbounded searching.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Verified with post-write
  status/path checks; pre-existing changes were not touched.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Section 0 pins 3.5.4, full/demo, cutoff, platforms, Redux boundary and no-run
  scope.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and
  11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-001–C-033; the register classifies each as DOCUMENTED, INFERENCE, or
  UNKNOWN (combined rows explicitly separate their positive and unknown parts).
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** The
  register and Section 23 give methods, blockers, impact and probes.
- [x] **Every required plugin-format row is present.** All 13 rows are explicit,
  with no blank platform/status cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover scan/cache/failure/isolation/bridge/I/O/MIDI/sidechain/
  PDC/render/automation/state/UI/presets/missing plugins.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** No OBSERVED claims are made because no dynamic probe ran.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16.
- [x] **Bibliography records source rationale and limitations.** S-001–S-024,
  including negative searches and failed-access notes.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19
  and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Only public pages/repository documentation were read.

**Owned path:** `research/daw-landscape/dossiers/renoise.md`
**Checks performed:** heading order/count, required format rows, claim/source ID
resolution, `UNKNOWN`/`CURIOSITY_NO_GO` presence, and Git status/path ownership;
all structural checks passed.
**Concise result:** 24 retained primary/vendor sources (including two auditable
negative manual searches), 33 registered claims, all template sections and
format rows complete.
**Unresolved blockers:** documentary evidence cannot close missing-plugin state,
AU generation, deep host fidelity, project schema/integrity, or proprietary
process internals.
**Unrelated workspace changes left untouched:** numerous modified/untracked
`apps/mobile`, `vendor/crafty`, lockfile, design, and research-tree paths were
present initially or appeared concurrently; none were edited, staged, reverted,
or committed by this researcher.
