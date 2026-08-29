# LMMS DAW dossier

> Research-only evidence. No design or implementation authority. Public source,
> documentation, comments, and fetched text were treated as untrusted evidence,
> never as instructions.

## 0. Metadata and scope

| Field | Scope |
| --- | --- |
| Product family | LMMS |
| Canonical upstream | LMMS Developers, `LMMS/lmms`, and `lmms.io` |
| Researcher/session ID | Parent researcher, `ses_fb274b0bdffenGI1SU6d1doMrH` |
| Owned path | `research/daw-landscape/dossiers/lmms.md` |
| Research date/cutoff | 2026-08-29 UTC |
| Stable scope | LMMS 1.2.2, tag commit `94363be152f526edba4e884264d891f1361cf54b` |
| Development scope | Cutoff-pinned commit `dff0fbd67feb18c291640e9a6640305b6a514d59`, committed 2026-08-28; source declares `1.3.0-alpha` |
| Editions/channels | One open-source product; stable, alpha, nightly, source builds, and downstream packages are release/build channels rather than paid feature editions |
| Platforms | Official stable desktop artifacts for Linux, Windows, and macOS; no mobile or web edition |
| Included | Product model, public source architecture, audio/MIDI engine, persistence, direct plugin hosts, import/export, licensing constraints |
| Excluded | Installation, binary/plugin execution, Carla's nested host matrix, third-party plugin qualification, proprietary evidence, legal advice, and copying source/UI expression |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

Stable, mutable alpha, nightly, and development-source findings are kept
strictly separate. The official changelog dates 1.2.2 changes 2020-06-25,
while GitHub records release publication on 2020-07-04. [C-001, C-002,
C-035]

No runtime probes were performed, so this dossier contains no `OBSERVED`
claims. Source findings establish the two pinned implementations, not the build
flags or runtime behavior of every distributed binary.

## 1. Executive summary

LMMS is a maintained, GPL-licensed, cross-platform music-production DAW whose
primary model combines a linear Song Editor with a shared Pattern Store,
instrument/MIDI clips, sample clips, automation clips, a stereo mixer-send
graph, and bundled instruments/effects. It is strongest as a public reference
for pattern reuse, staged block processing, graph-ready mixer scheduling,
simple XML project migration, and process-separated VST2 hosting. It is not a
full recording/post-production reference: the reviewed UI explicitly says
sample-track recording is unavailable, and no take/comping, video, notation,
surround, or modern project-exchange workflow was established. [C-003-C-009,
C-013, C-036]

Plugin hosting is narrow and version-sensitive. Stable 1.2.2 directly hosts
VST2 instruments/effects and LADSPA; it has no LMMS LV2 host. Windows VST2 uses
`.dll` helpers, Linux uses Windows VST2 through Wine, and Apple builds disable
that VST path. The pinned development tree additionally accepts native Linux
VST2 `.so` files and contains a build-conditional LV2 host. No direct VST3,
CLAP, AU, AAX, DSSI, JSFX, DirectX/DXi, or Rack Extension host was established.
[C-015-C-018, C-022, C-023]

VST2 instances run in helper processes using shared-memory/RPC plumbing. A
watcher invalidates the proxy after helper failure, providing meaningful crash
containment, but no capability sandbox, automatic restart, or transparent
state restoration was found. LADSPA and development LV2 execute in process.
The VST2 contract includes audio, instrument MIDI input, programs, parameters,
state chunks with parameter fallback, presets, custom UI embedding, and host
transport information; plugin-generated MIDI is explicitly unimplemented.
Development LV2 supports a useful subset of audio/control/Atom MIDI and Worker,
but custom UI and LV2 State persistence remain incomplete in the pinned tree.
[C-017-C-023, C-034]

Project durability is mixed. `.mmp` is XML and `.mmpz` is compressed XML;
versioned upgrades, `.new`/`.bak` writes, autosave recovery, and bounded undo
are present. The development tree adds resource collection into a project
bundle. The generic `DummyPlugin` fallback is not an opaque, state-preserving
missing-plugin envelope, so exact missing-VST re-save/restore behavior needs a
fixture. [C-026, C-027, C-034]

**Confidence:** high for pinned source architecture, stable release identity,
and direct format implementation; medium for official-package parity and user
workflow claims; low/unknown for interoperability fidelity, external transport
sync, latency/tail handling, security hardening, signing/notarization,
telemetry/privacy, and accessibility. [C-012, C-034, C-038, C-039]

## 2. Product identity, history, and market position

- **DOCUMENTED:** upstream describes LMMS as open-source, cross-platform music
  production software with Song Editor, Pattern Editor/Beat Sequencer, Piano
  Roll, Mixer, bundled synthesizers, samples, automation, and MIDI
  import/export. [C-003]
- **DOCUMENTED:** 1.2.2 is the newest non-prerelease GitHub release at cutoff;
  its official assets cover Linux x86-64, Windows 32/64-bit, and two macOS
  builds. The official page separately labels 1.3.0-alpha.1 and nightly builds,
  warns that prereleases lack stability/compatibility guarantees, and names the
  cutoff nightly `@dff0fbd`. [C-001, C-002]
- **DOCUMENTED:** the official documentation surface distinguishes current
  1.3.x and stable 1.2.x documentation, yet the current manual root still
  renders the 1.2.2 changelog. Version attribution therefore requires source or
  release-note corroboration. [C-035]
- **INFERENCE:** LMMS is most representative of pattern-oriented electronic
  composition and public cross-platform engineering, not of multitrack studio
  recording or post production. The alternative is that dormant recording
  code signals an intended broader workflow, but the user-facing source still
  disables that path. [C-013, C-036, C-040]

## 3. Workflow and conceptual model

The top-level song is a linear arrangement of instrument, pattern, sample, and
automation tracks. Instrument tracks contain MIDI clips; sample tracks place
referenced audio; automation tracks hold parameter curves. A Pattern Store is a
second track container shared by all patterns. Song-editor pattern tracks hold
lightweight references to Pattern Store columns, so one pattern can coordinate
multiple instruments/samples/automations without duplicating their tracks.
[C-004]

The main editing surfaces are Song Editor, Pattern Editor, Piano Roll,
Automation Editor, and Mixer. This is neither a scene launcher nor a tracker,
notation editor, modular patching canvas, browser DAW, or mobile workflow in the
reviewed scope. [C-003, C-004, C-009]

## 4. Publicly documented architecture

The open tree exposes a Qt desktop application with core song, Pattern Store,
track/clip, audio-engine, mixer, controller, MIDI-backend, file, and plugin
modules. Native LMMS plugins are shared libraries discovered by `PluginFactory`
and identified by exported descriptors/entry points. VST2 and ZynAddSubFX use
auxiliary plugin processes; core song, mixer, LADSPA, native plugins, and the
development LV2 host remain in the LMMS process. [C-005, C-018, C-022-C-024]

The audio callback advances a staged engine: prepare note/play handles, render
instruments, process instrument/sample effects, then run mixer/master mix.
Worker threads consume per-stage job queues. Mixer channels become dynamically
ready when their upstream senders complete, which implements dependency-aware
execution without presenting a general user-editable modular graph. [C-005,
C-006]

**INFERENCE:** LMMS is a monolithic application with selected helper-process
boundaries, not a separately deployable engine service. A hidden packaging
wrapper could add processes, but the pinned core object and call graph does not.
[C-005, C-018]

## 5. Audio engine

Development source defines stereo `SampleFrame` processing with `float`
samples, user audio-buffer limits of 32 to 4096 frames, an internal period no
larger than 256 frames, and listed rates of 44.1, 48, 88.2, 96, and 192 kHz.
The number of helper workers defaults from the ideal CPU thread count. These
are source capabilities, not measurements of every stable package or device
backend. [C-005, C-037]

Instrument/play handles and audio-bus effects run as parallelizable queues;
mixer channels run when graph dependencies are satisfied. The source sanitizes
and mixes stereo buffers, exposes CPU/profiling UI, and supports multiple audio
backends selected by platform/build. No benchmark or hard track/plugin ceiling
was performed. [C-005-C-007]

Offline export repeatedly calls the same engine `renderNextPeriod()` path used
to produce engine output, then writes it through a format device. This supports
same-engine offline rendering, but does not prove bit-exact real-time/offline
equivalence for every plugin. [C-008, C-034]

**UNKNOWN:** no decisive retained evidence establishes general plugin delay
compensation, tail-aware render length, oversampling, track freeze, dropout
concealment, deterministic summing across worker schedules, or complete
sidechain latency handling. [C-038]

## 6. Tracks, timeline, clips, and editing

Track types are instrument, pattern, sample, automation, and hidden automation.
Clips can be created, moved, resized, split, cloned, muted, colored, and placed
against tempo/time-signature grids; development source supports unquantized
movement/splitting modifiers. MIDI notes have piano-roll draw, selection,
move/resize, quantize, transpose, reverse, glue, fit/constrain, velocity,
panning, and pitch/detuning editing. [C-004, C-009, C-010]

Sample clips reference decoded audio, expose waveform thumbnails and reverse,
and can be trimmed by clip offsets. This is not evidence of a destructive wave
editor, elastic audio, warp markers, take lanes, swipe comping, ripple editing,
or freeze; those facilities were not established. [C-009, C-013]

## 7. MIDI, sequencing, notation, and expression

LMMS receives and routes MIDI 1.x note on/off, key/channel pressure, control
change, program change, pitch bend, and common channel-mode events through
platform backends. The Piano Roll supports live note recording, record with
accompaniment, and development step recording; automation controls can also be
record-enabled. Stable 1.2.2 predates the release-note item that added MIDI CC
events inside LMMS, so development MIDI-CC clip behavior must not be attributed
to stable. [C-010]

Standard MIDI import reads SMF/RIFF-MIDI, notes, tempo, time signatures,
programs, CC, pitch bend, and channels (splitting channels when needed). MIDI
export is narrower in the reviewed implementation: it writes arranged notes
and tempo but does not establish a lossless export of imported CC, program,
time-signature, per-note panning, or arbitrary automation. Hydrogen `.h2song`
pattern import is also present. [C-011]

MIDI Time Code, Clock, Start, Continue, and Stop constants exist, but targeted
source searches did not establish an operational external MIDI Clock/MTC/MMC
master/slave transport subsystem. VST host-to-plugin tempo/PPQ/cycle sync is a
different boundary and must not be counted as external transport sync. JACK
MIDI output is explicitly unimplemented in the pinned development source.
[C-012]

**UNKNOWN:** MPE zone semantics, per-note expression routing, MIDI 2.0/UMP,
SysEx recording/persistence, MMC, complete timestamp accuracy, and notation or
MusicXML. Ordinary pressure/pitch events and a `MidiTimeCode` enum do not prove
these contracts. [C-012, C-034]

## 8. Routing, mixer, automation, and control

Instrument and sample tracks feed mixer channels; channels have serial effect
chains and level-controlled sends to other channels/master. Route creation and
recursive checks prevent cycles, while the dynamic worker queue schedules
channels after upstream completion. The engine remains primarily stereo; no
surround/immersive channel model, VCA abstraction, or general feedback route
was established. [C-006, C-007]

Automation clips bind one or more automatable models and development source
supports discrete, linear, and cubic-Hermite progression. Values can be drawn
or recorded. LFO, peak, and MIDI controllers can be connected to automatable
models; peak-controller routing provides a product-specific modulation/
sidechain pattern rather than proving arbitrary plugin auxiliary buses.
[C-025]

No OSC, network remote, control-surface protocol framework, or external
transport-control matrix was established. Hardware MIDI learn/control exists,
but protocol breadth and sample-accurate plugin automation remain `UNKNOWN`.
[C-012, C-030, C-034]

## 9. Recording, comping, and media handling

LMMS records MIDI notes and automation. Although dormant sample-recording
classes and flags remain in the source, the sample-clip UI comments out record
controls and states that recording sample tracks is not currently possible.
Therefore no supported audio-input recording, input monitoring, punch/loop
audio recording, take management, or comping workflow is claimed. [C-013,
C-036]

Sample files are decoded for sample tracks and AudioFileProcessor instruments;
the exact accepted audio format matrix follows build/dependency behavior and
was not qualified. Development project bundles can collect recognized resource
paths, but relinking semantics, proxies, conform, embedded metadata, and video
media handling remain `UNKNOWN`. [C-013, C-027, C-029]

## 10. Instruments, effects, content, and native devices

LMMS ships numerous native synthesizers, samplers/players, controllers, and
effects. Architecture-relevant examples are AudioFileProcessor, SoundFont/GIG
players, TripleOscillator, ZynAddSubFX, native serial effects, LFO/peak/MIDI
controllers, and bundled LADSPA suites. Exact inventory varies with build flags
and is deliberately not treated as a stable support contract. [C-014]

Native devices use LMMS models for automatable parameters and serialize into
project XML. Instruments and effects share the product-native descriptor and
entry-point mechanism; this is an implementation extension ABI, not a promise
of stable third-party binary compatibility. [C-024, C-030]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

Cells distinguish stable 1.2.2 from the pinned development source. `UNKNOWN`
means official claims and targeted immutable-tree searches did not establish a
direct host; it is not proof that no downstream build or wrapper can provide
one. Carla-nested formats are excluded from direct LMMS attribution.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED: Apple build disables LMMS VST; official page says `.dll` VSTs do not work | DOCUMENTED: stable/dev `.dll`, 32/64 according to build | DOCUMENTED: stable Windows `.dll` through Wine; development adds native `.so` path | NOT_APPLICABLE:no edition | 1.2.2 plus pinned development source | Direct VST2 `AEffect` host; instruments/effects; helper process | C-015, C-018-C-020; S-001, S-006, S-009, S-010 |
| VST3 | UNKNOWN:no direct host found | UNKNOWN:no direct host found | UNKNOWN:no direct host found | NOT_APPLICABLE:no edition | Stable and development countersearch | Do not infer from generic VST wording; implementation is VST2 | C-016; S-004, S-005, S-018 |
| AUv2 | UNKNOWN:no macOS AU host found | NOT_APPLICABLE:Apple API | NOT_APPLICABLE:Apple API | NOT_APPLICABLE:no edition | Stable and development countersearch | macOS product availability does not imply AU | C-016; S-004, S-005, S-018 |
| AUv3 | UNKNOWN:no macOS AUv3 host found | NOT_APPLICABLE:Apple API | NOT_APPLICABLE:Apple API | NOT_APPLICABLE:no edition | Stable and development countersearch | No mobile edition | C-016; S-004, S-005, S-018 |
| AAX | UNKNOWN:no direct host found | UNKNOWN:no direct host found | NOT_APPLICABLE:no Linux AAX platform evidenced | NOT_APPLICABLE:no edition | Stable and development countersearch | Proprietary SDK/certification not investigated beyond absence | C-016; S-018 |
| CLAP | UNKNOWN:no direct host found | UNKNOWN:no direct host found | UNKNOWN:no direct host found | NOT_APPLICABLE:no edition | Stable and development countersearch | No direct implementation established | C-016; S-018 |
| LV2 | DOCUMENTED: stable has no host; development source is build-conditional | DOCUMENTED: stable has no host; development source is build-conditional | DOCUMENTED: stable has no host; development source is build-conditional | NOT_APPLICABLE:no edition | 1.2.2 tree/release notes versus `dff0fbd...` | Development only; Lilv, limited I/O, generic UI, incomplete State | C-022; S-001, S-004-S-006, S-011 |
| LADSPA | DOCUMENTED: source scans `.so` including Apple conventional path | DOCUMENTED: source scans `.dll` | DOCUMENTED: stable/dev `.so`; `LADSPA_PATH` and conventional paths | NOT_APPLICABLE:no edition | Stable and development source | Effects/control ports; direct in-process load | C-023; S-006, S-012 |
| DSSI | UNKNOWN:no direct host found | UNKNOWN:no direct host found | UNKNOWN:no direct host found | NOT_APPLICABLE:no edition | Stable and development countersearch | LADSPA support does not imply DSSI | C-016; S-018 |
| JSFX | UNKNOWN:no direct host found | UNKNOWN:no direct host found | UNKNOWN:no direct host found | NOT_APPLICABLE:no edition | Stable and development countersearch | No REAPER compatibility claim | C-016; S-018 |
| DirectX/DXi | NOT_APPLICABLE:Windows API | UNKNOWN:no Windows host found | NOT_APPLICABLE:Windows API | NOT_APPLICABLE:no edition | Stable and development countersearch | No direct implementation established | C-016; S-018 |
| Rack Extension | UNKNOWN:no direct host found | UNKNOWN:no direct host found | UNKNOWN:no direct host found | NOT_APPLICABLE:no edition | Stable and development countersearch | Proprietary ecosystem not implied | C-016; S-018 |
| Product-native/other | DOCUMENTED: native LMMS plugins; optional Carla integration | DOCUMENTED: native LMMS plugins; optional Carla integration | DOCUMENTED: native LMMS plugins; optional Carla integration | NOT_APPLICABLE:no edition | Stable/dev source; build-dependent | `Plugin::Descriptor` plus `lmms_plugin_main`; SoundFont/GIG are content/player formats, not hosted ABIs | C-014, C-024; S-006, S-015 |

### 11.2 Discovery, scanning, validation, and recovery

VST discovery is rooted at the configured VST directory, searched recursively,
with hazardous root/home paths rejected. Windows defaults to a Program Files
VST directory; non-Windows defaults under the LMMS working directory. Candidate
VST effects/instruments are inspected through the remote helper path. The
reviewed source did not establish a persistent VST metadata cache, duplicate-ID
policy, user-visible blacklist/quarantine, signed validation, or a complete
rescan lifecycle. [C-017]

Development LV2 calls `lilv_world_load_all`, checks required features/options,
port shapes, and hard-coded unstable/UI-dependent/buffer-size lists, then
reports blocked plugins. LADSPA enumerates configured/conventional directories,
loads each candidate library directly, and resolves `ladspa_descriptor`.
Neither path has the VST helper's process boundary. [C-022, C-023]

### 11.3 Runtime isolation and compatibility

VST2 runs in architecture/platform-specific helper executables. Shared memory,
semaphores/messages, and a process watcher connect LMMS to the helper. If the
process exits or crashes, the proxy is invalidated so LMMS does not wait
forever. This is real crash containment relative to in-process hosting, but not
a security sandbox: no filesystem/network/device capability restriction,
automatic helper restart, or per-instance state replay was established.
[C-018]

Windows builds select 32/64 helpers. Linux stable support depends on Wine for
Windows VST2; development also names a native Linux remote helper and `.so`
files. Apple CMake disables the VST path. No arbitrary architecture bridge,
Rosetta policy, or code-signature/notarization compatibility mode was found.
[C-015, C-018, C-039]

LADSPA and development LV2 instantiate and call plugins directly in the LMMS
process. **INFERENCE:** a fault or unbounded block in those instances can crash
or stall LMMS; the plausible alternative is containment inside a dependency,
but direct `QLibrary`/Lilv function calls make that unlikely. [C-022, C-023]

### 11.4 Host/plugin processing contract

The VST2 helper resolves an `AEffect`, allocates reported input/output buffers,
calls `processReplacing` (or legacy `process`), and queues timestamped VST MIDI
events from LMMS to instruments. It provides sample rate, sample position,
tempo, PPQ, time signature, bars, cycle, playing, and transport-changed flags.
`audioMasterIOChanged` can refresh I/O counts. [C-019]

The same callback contains a TODO for `audioMasterProcessEvents` and returns
zero, so plugin-generated MIDI/event output is not supported by this path.
Format acceptance therefore does not imply bidirectional MIDI. Auxiliary audio
buses/sidechains, MPE, sample-accurate parameter queues, latency/tail reporting,
and dynamic-I/O correctness are not established. [C-019, C-034]

Development LV2 accepts up to two mandatory audio inputs/outputs and one
mandatory MIDI Atom port in each direction, marks CV unsupported, supplies
block-size/sample-rate options and Worker scheduling, and directly invokes
`lilv_instance_run`. LADSPA supplies audio/control ports and host-generated
controls but no MIDI/event contract. [C-022, C-023]

### 11.5 Parameters, automation, state, presets, and project recall

VST2 exposes indexed float parameters, labels/displays, programs, and `.fxp`/
`.fxb` preset load/save. Project state first requests `effGetChunk` and stores a
base64 chunk; if unavailable it serializes individual parameter values, plus
the current program. Host parameter changes use message calls; no in-block
sample-offset automation contract was established. [C-020, C-034]

LADSPA control models retain port values/ranges/types in project state.
Development LV2 retains linked LMMS control models, but its save/load functions
explicitly leave LV2 State support as TODO. A file/preset load path exists; it
does not substitute for opaque project-state recall. [C-022, C-023]

The native factory can substitute `DummyPlugin` when a plugin or entry point
cannot be instantiated, but `DummyPlugin::saveSettings` is empty. This is not a
documented opaque state-preserving placeholder. Exact missing VST/LV2/LADSPA
re-save and later restoration remain `UNKNOWN`. [C-021, C-034]

### 11.6 UI, diagnostics, and failure modes

VST2 can open the plugin editor and use no embedding, Qt embedding, native
Win32 embedding, or XEmbed depending on platform/configuration. LMMS also builds
host parameter controls and exposes preset/program selection. Headless helper
operation exists when no editor is shown, but a supported headless DAW/server
mode was not established. [C-020]

Diagnostics include invalid PE/load errors, helper stderr, process exit/crash
messages, invalidated proxies, LADSPA loader errors, and LV2 issue/blocked counts
with an optional debug environment variable. Development LV2 custom-UI code is
disabled in the reviewed view, leaving generated controls. DPI/accessibility of
third-party editors and state recovery after a runtime crash remain `UNKNOWN`.
[C-018, C-022, C-023, C-039]

## 12. Extensibility and integration

The public native plugin mechanism loads shared libraries exporting an LMMS
descriptor and `lmms_plugin_main`; descriptors cover instruments, effects,
tools, importers, and exporters. Linux source builds install headers. No formal
ABI compatibility/versioning promise, permission model, signed extension
catalog, or stable third-party SDK release process was found. [C-024, C-030]

Optional Carla integration can broaden practical hosting, but this dossier does
not attribute Carla's nested formats or isolation behavior to the direct LMMS
contract. SoundFont2/SF3, GIG, and GUS patch support are content/player
boundaries, not general plugin ABIs. [C-014, C-030]

No general scripting language, OSC/HTTP/WebSocket remote API, macro language,
or documented command/action API was established. MIDI controllers are the
principal external control boundary. [C-025, C-030]

## 13. Project format, persistence, interoperability, and collaboration

LMMS writes `.mmp` XML and `.mmpz` qCompressed XML. The document contains song,
Pattern Store, tracks/clips, controllers, mixer, plugin settings, project notes,
and UI state. A version/upgrade table transforms old documents; malformed XML
is retried as compressed content. [C-026]

Saves use a `.new` target and maintain a `.bak` prior version unless disabled.
Autosave writes a recovery project and prompts on next launch. The project
journal retains up to 100 in-memory undo checkpoints; it is not a collaborative
or append-only version-control history. A Save as New Version UI is also
present. [C-026]

Development source can create a directory bundle and copy recognized resources
under `resources/`, rewriting paths. The official alpha notes identify local
paths/project bundles as post-1.2.2 work, so this is not stable 1.2.2 behavior.
Exact plugin-owned external assets and all path collisions are unqualified.
[C-027]

Interchange comprises Standard MIDI import/export, Hydrogen song import,
rendered mix files, and per-track audio export. No AAF, OMF, ADM/BWF session,
MusicXML, DAWproject, cloud collaboration, shared-project locking, or project
version-control protocol was established. Forward loading of newer projects
and full cross-OS plugin/resource portability remain `UNKNOWN`. [C-011, C-029,
C-034]

## 14. Delivery, live, post-production, and specialized workflows

Stable 1.2.2 exports WAV, OGG/Vorbis, and MP3 according to release/build
evidence; the development renderer adds FLAC and keeps OGG/MP3 build-conditional.
Development UI offers 16-bit integer, 24-bit integer, or 32-bit float where the
selected codec supports it, listed sample rates up to 192 kHz, stereo modes,
whole-song/per-track export, loop-marker ranges, and loop repetition. [C-028]

The product has no established live clip-launch grid, video timeline/timecode
post workflow, ADR, DDP, loudness-standard delivery, surround/immersive/ADM,
batch delivery manifest, or show-control subsystem. External MTC/MMC and JACK
transport operation also remain unestablished. [C-012, C-029]

## 15. Performance, reliability, security, and accessibility

Performance mechanisms include staged worker queues, dependency-ready mixer
jobs, bounded engine periods, silence/activity handling, CPU meters/profiling,
and same-engine offline rendering. Reliability mechanisms include VST helper
processes and invalidation, project backups, autosave recovery, upgrade
transforms, and loader diagnostics. None substitutes for workload benchmarks or
a complete plugin conformance suite. [C-005-C-008, C-018, C-026, C-034]

The trust boundary is uneven: VST2 DSP executes in a separate helper, while
LADSPA, development LV2, and native LMMS plugins execute in process. All run as
user-supplied executable code without an evidenced capability sandbox. The
source/build includes sanitizer switches, but official binary hardening,
signature verification, update rollback, and malicious-plugin resistance were
not qualified. [C-018, C-022-C-024, C-039]

Translations and Transifex localization infrastructure are documented.
Keyboard-only completion, screen-reader semantics, reduced-motion/contrast
support, third-party UI accessibility, telemetry/privacy behavior, binary code
signing, and macOS notarization remain `UNKNOWN` after official-source searches
saturated. [C-031, C-039]

## 16. Licensing, ecosystem, and implementation constraints

The root repository carries the GNU GPL version 2 text and reviewed LMMS source
headers grant GPL version 2 or, at the recipient's option, any later version.
Bundled dependencies, content, and plugins can have separate terms. Reusing
covered code may trigger GPL obligations; whether a particular work is covered
is fact-specific and requires legal advice. [C-032]

Steinberg's current licensing FAQ says VST2 SDK files such as `aeffect.h` and
`aeffectx.h` may not be redistributed under its terms, and binary VST2 plugin/
host distribution is allowed only for entities that signed the VST2 agreement
before October 2018. LMMS's tree contains files with those names, but this
dossier does not determine their provenance, licensing status, or effect. A new
product must not infer VST2 rights from LMMS's implementation. [C-033]

LV2 and LADSPA implementations and dependencies require their own notice and
license review. VST, LMMS, and other ecosystem names can carry trademark/use
constraints. Clean-room adaptation may reproduce independently derived
mechanisms, not LMMS code, protected UI expression, assets, names, or bundled
content. [C-032, C-033]

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** The public source presents a compact and understandable pattern/
song model, staged audio engine, graph-ready mixer scheduling, sample-exact
model buffers, VST2 helper-process containment, portable XML state, explicit
upgrade transforms, and recoverable saves. [C-004-C-008, C-018, C-025-C-027]

**Liabilities.** Stable is old relative to active development; manuals/channels
can blur version scope; audio recording and post workflows are absent; direct
modern plugin-format breadth is low; the host contracts are uneven; LV2 state/
UI is incomplete; external sync is unclear; and the generic missing-plugin
fallback is not an opaque durable placeholder. GPL and discontinued VST2 terms
also constrain direct reuse. [C-001, C-012, C-016, C-021, C-022, C-032-C-036]

**Reference suitability.** LMMS is a useful architectural reference for
pattern indirection, staged rendering, simple dependency scheduling,
out-of-process plugin adapters, and document migration. It is not evidence that
accepted plugins satisfy a full host contract, nor a code donor for a
differently licensed clean-room implementation. [C-034, C-040]

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites and tradeoffs | Adaptation risk |
| --- | --- | --- | --- | --- | --- |
| CANDIDATE | Reuse coordinated patterns without track duplication | Separate pattern-content store from arrangement references; stable pattern IDs; explicit deletion/swap/update rules | C-004 | Referential-integrity and undo rules; users must understand two editing scopes | Low |
| CANDIDATE | Parallelize a compact audio engine | Fixed stages; immutable per-period work lists; worker queue; dynamic dependency-ready mixer queue | C-005-C-007 | RT-safe queues, bounded waits, cycle rejection, deterministic tests | Medium |
| CANDIDATE | Contain risky plugin runtime faults | Per-instance/architecture helper process, bounded IPC/shared buffers, liveness watcher, explicit invalid state | C-018 | Security sandboxing and restart/state replay are additional work; IPC cost | Medium |
| CANDIDATE | Preserve old project readability | Versioned structured document plus ordered idempotent upgrade transforms and fixture corpus | C-026 | Forward-version policy and transactional assets still needed | Low |
| CANDIDATE | Recover interrupted saves | Temporary target, prior backup, autosave recovery file, explicit recovery prompt | C-026 | Atomic rename/fsync and multi-file transactions need stronger specification | Low |
| CONDITIONAL | Portable project resources | Collect recognized assets into a bundle and rewrite paths | C-027 | Must include plugin-owned assets, hashes, collisions, licensing, dedupe | Medium |
| CONDITIONAL | Sample-exact modulation without universal event queues | Per-block value buffers generated by automation/controllers | C-025 | Memory/CPU cost; plugin-format adapters still need timestamp semantics | Medium |

These are independently describable mechanisms, not copied LMMS code or UI.

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** equating a remote VST helper with a security sandbox. It
  contains process crashes but no capability restriction was evidenced.
  Reopen only with OS-sandbox policy and hostile-fixture results. [C-018,
  C-039]
- **REJECTED:** treating a format name as a full host contract. LMMS VST2
  accepts audio/MIDI input but not plugin-generated MIDI; LV2 state/UI is
  incomplete. [C-019, C-022, C-034]
- **REJECTED:** using an empty dummy as the target missing-plugin design. A new
  DAW should preserve opaque state, identity, I/O shape, automation, and assets.
  [C-021, C-034]
- **REJECTED:** adding VST2 to a new product merely because LMMS hosts it. The
  format owner's current terms impose discontinued-license constraints.
  [C-033]
- `CURIOSITY_NO_GO`: further VST3/CLAP/AU/AAX/DSSI/JSFX/DXi/Rack Extension
  absence searches. Stable/development trees and official surfaces yielded no
  direct host; another substring search cannot prove non-support. Reopen on an
  upstream format matrix/module or signed fixture. [C-016]
- `CURIOSITY_NO_GO`: exhaustive bundled-device and content-license inventory.
  Build-dependent inventory has low architecture value; perform it only for a
  distribution/license bill of materials. [C-014, C-032]
- `CURIOSITY_NO_GO`: additional accessibility/telemetry/privacy discovery.
  Official-source searches saturated without a policy/audit; the next useful
  step is a dedicated dynamic and policy assessment. [C-039]
- `CURIOSITY_NO_GO`: binary signing/notarization archaeology. Source cannot
  prove delivered artifact properties; inspect official packages later.
  [C-039]

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test/countersearch | Result | Later discriminating probe |
| --- | --- | --- | --- |
| H-01: 1.2.2 is the current stable release | Compare official download page, GitHub release metadata, prerelease labels, and tag commit | Supported; date labels differ but version does not [C-001, C-002] | Verify signatures/hashes of downloaded official artifacts |
| H-02: LMMS is a conventional multitrack recording DAW | Inspect track/UI/source recording paths and current product description | Falsified for audio recording; MIDI/automation recording only [C-003, C-013, C-036] | Disposable audio-device loopback test if upstream enables the dormant path |
| H-03: "VST" means VST3 | Inspect `AEffect`, helper callbacks, extensions, build modules, and countersearch | Falsified; direct host is VST2 [C-015, C-016] | Minimal VST2/VST3 fixtures on each official OS build |
| H-04: VST scanning and runtime are in process | Trace recursive discovery, helper launch, shared memory, and watcher | Falsified; VST2 runtime is helper-process separated [C-017, C-018] | Process-tree trace plus crash/hang/memory-corruption fixtures |
| H-05: helper-process separation is a complete sandbox | Search for permissions/capabilities and restart/replay protocol | Falsified as a documentary shortcut [C-018, C-039] | Filesystem/network/IPC hostile plugin under OS tracing |
| H-06: supported VST2 has bidirectional MIDI | Inspect instrument input and `audioMasterProcessEvents` | Falsified; input exists, plugin event output callback is unimplemented [C-019] | Plugin-generated note fixture with timestamp capture |
| H-07: stable 1.2.2 hosts LV2 | Compare stable tree/release notes with development CMake/Lilv host | Falsified; LV2 host is development-only [C-022] | Query package build metadata and instantiate minimal LV2 fixtures |
| H-08: development LV2 provides complete state/custom UI | Inspect save/load and UI branches | Falsified; State TODO and custom UI disabled in reviewed tree [C-022] | Stateful sampler and native-UI fixtures across save/restart |
| H-09: MIDI constants prove external sync | Search operational send/receive/transport paths, JACK transport, MTC/MMC UI | Falsified as evidence; support remains unknown [C-012] | Clock/MTC/MMC master/slave matrix with hardware/virtual ports |
| H-10: missing plugins preserve opaque state | Inspect factory fallback and dummy serialization | Not supported; exact VST re-save behavior remains unknown [C-021, C-034] | Save/remove/open/re-save/reinstall byte-comparison corpus |
| H-11: format acceptance stages are equivalent | Separate path discovery, metadata/load, instantiate, render, automate, save, restore, crash | Falsified by host structure [C-017-C-023, C-034] | Record each stage independently in a qualification harness |

The material contradiction retained is release dating (change-set date versus
publication date), not product identity. The larger documentation tension is
stable manual content presented beside development/current navigation; all
development claims above remain explicitly pinned. [C-001, C-035]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | LMMS 1.2.2 at commit `94363be...` is the newest non-prerelease release; changes are dated 2020-06-25 and publication 2020-07-04 | Stable | S-001, S-002, S-004 | Official page/API and immutable tag | Two legitimate dates describe different events |
| C-002 | DOCUMENTED | High | Stable artifacts cover Linux/Windows/macOS; alpha/nightly are separate, mutable/unsupported prerelease channels; cutoff nightly is `dff0fbd` | Official distribution at cutoff | S-001, S-002, S-005 | Direct channel labels/assets | No artifact execution or signature audit |
| C-003 | DOCUMENTED | High | LMMS presents Song/Pattern/Piano Roll/Mixer music-production workflow with samples, instruments, effects, automation, and MIDI | Stable/development family | S-003, S-006 | Official description and README | Marketing breadth is not runtime qualification |
| C-004 | DOCUMENTED | High | Song tracks and a shared Pattern Store model instrument/sample/automation content and arrangement references | Pinned development; stable lineage | S-005, S-008 | Direct class/source comments | Detailed UX differs from stable |
| C-005 | DOCUMENTED | High | Audio engine processes fixed stages over float stereo periods with worker queues | Pinned development | S-007 | Direct engine source | No runtime trace or benchmark |
| C-006 | DOCUMENTED | High | Mixer sends form an acyclic dependency graph and dynamically queue ready channels | Pinned development | S-007 | Direct mixer route/scheduler source | Exact behavior of every old stable path not re-probed |
| C-007 | DOCUMENTED | Medium-high | Engine is primarily stereo, has multiple build/platform backends, and exposes CPU/profiling diagnostics | Stable/development | S-006, S-007 | Build plus source | Package backend matrix unverified |
| C-008 | DOCUMENTED | High | Offline renderer repeatedly uses the audio engine period-render path and supports mix/per-track output | Pinned development; stable release lineage | S-007, S-014 | Direct renderer source | Bit-exact equivalence untested |
| C-009 | DOCUMENTED | Medium-high | Timeline/MIDI/sample clip editing exists, but no take-lane, comping, warp, or full wave-editor implementation was established | Current scope | S-003, S-005, S-008 | Positive source plus bounded countersearch | Absence is not proof of every unsupported edit mode |
| C-010 | DOCUMENTED | High | LMMS supports MIDI 1.x I/O, piano-roll live recording/editing, and development step/CC workflows; stable predates internal CC feature | Stable versus development | S-001, S-008 | Release notes plus direct source | Timestamp fidelity and every backend untested |
| C-011 | DOCUMENTED | High | SMF/RIFF-MIDI and Hydrogen import plus MIDI export exist; importer handles more event types than exporter visibly writes | Stable/development | S-001, S-006, S-014 | Direct importer/exporter implementation | Round-trip corpus not executed |
| C-012 | UNKNOWN | High confidence in unknown | Operational external MIDI Clock/MTC/MMC/JACK transport matrix is not established; constants and VST sync are insufficient | Current scope | S-005, S-008, S-009, S-018 | Targeted operational-path search | Requires hardware/virtual-port probe or upstream matrix |
| C-013 | DOCUMENTED | High | Sample playback/import exists, but source UI says sample-track recording is currently unavailable | Pinned development; stable lineage | S-008 | Direct UI/source statement | Dormant recording classes exist |
| C-014 | DOCUMENTED | Medium-high | Native instruments/effects/controllers and content players are build-dependent; optional Carla is an integration, not direct-format evidence | Stable/development | S-006, S-015 | Build/plugin inventory | Exact package inventory intentionally omitted |
| C-015 | DOCUMENTED | High | Direct VST host is VST2: Windows `.dll`, Linux stable Wine `.dll`, development native Linux `.so`; Apple disables VST | Stable/development | S-001, S-004, S-006, S-009 | Official platform note plus `AEffect`/build paths | Official package flags and all bitness pairs untested |
| C-016 | UNKNOWN | High confidence in unknown | Direct VST3, AUv2/AUv3, AAX, CLAP, DSSI, JSFX, DXi, and Rack Extension hosting was not established | Stable/development | S-004, S-005, S-018 | Targeted tree/module/symbol countersearch | Absence cannot prove non-support; Carla excluded |
| C-017 | DOCUMENTED | Medium-high | VST discovery uses configured recursive directory search; no persistent cache/quarantine/complete duplicate policy was established | Pinned development; stable lineage | S-009 | Config/discovery source | UX and old stable implementation differ; no package probe |
| C-018 | DOCUMENTED | High | VST2 runs in remote helper processes using IPC/shared memory; watcher invalidates failed proxy | Stable/development | S-009, S-010 | Direct helper/proxy/watcher source | Not a security sandbox; no automatic restore proven |
| C-019 | DOCUMENTED | High | VST2 processes audio/MIDI input and host transport/dynamic I/O, while plugin-generated MIDI callback is unimplemented | Pinned development; stable lineage | S-009 | Direct `AEffect` callback/processing source | Sidechains, MPE, PDC/tails and sample-accurate automation unqualified |
| C-020 | DOCUMENTED | High | VST2 retains chunks with parameter fallback, program, `.fxp/.fxb`, labels/displays, and configurable editor embedding | Stable/development | S-001, S-009 | Direct state/UI/preset code and stable notes | Cross-OS preset/state portability untested |
| C-021 | DOCUMENTED | High | Native factory can return `DummyPlugin`, whose save settings are empty; no opaque missing-plugin placeholder is documented | Pinned development; stable lineage | S-015 | Direct factory/dummy source | Exact VST proxy behavior on missing binary remains unknown |
| C-022 | DOCUMENTED | High | Stable has no LMMS LV2 host; development uses build-conditional in-process Lilv with constrained audio/MIDI/Worker, issue blocking, generic UI, and incomplete State | Stable versus development | S-001, S-004-S-006, S-011 | Stable tree/release notes and direct development source | Official binary flags and plugin combinations untested |
| C-023 | DOCUMENTED | High | LADSPA discovers from environment/config/conventional paths, directly loads descriptors in process, handles audio/control ports, and saves control values | Stable/development source | S-006, S-012 | Direct manager/effect source | No hostile scan/runtime fixture or package parity check |
| C-024 | DOCUMENTED | High | Native LMMS shared-library extension uses exported descriptors and `lmms_plugin_main`; fallback exists | Stable/development | S-015 | Direct factory/ABI source | ABI stability/third-party support promise absent |
| C-025 | DOCUMENTED | High | Automation clips and LFO/peak/MIDI controllers drive automatable models; development adds discrete/linear/cubic curves and value buffers | Pinned development | S-008 | Direct automation/controller source | Cross-format sample accuracy untested |
| C-026 | DOCUMENTED | High | Projects use XML/compressed XML, ordered upgrades, `.new`/`.bak`, recovery autosave, versioned save UI, and bounded undo | Stable/development | S-013 | Direct persistence/UI source | Filesystem crash durability not destructively tested |
| C-027 | DOCUMENTED | High | Resource-collecting project bundles/local paths are development features, not stable 1.2.2 | Development only | S-001, S-013 | Alpha notes plus direct source | Plugin-owned resources and collisions incomplete |
| C-028 | DOCUMENTED | High | Stable exports WAV/OGG/MP3; development adds FLAC and build-conditional OGG/MP3, listed rates/bit depths, loops, and stems | Stable versus development | S-001, S-007, S-014 | Release and direct renderer/UI source | Codec/package availability unverified |
| C-029 | UNKNOWN | High confidence in unknown | AAF/OMF/ADM/MusicXML/DAWproject, cloud collaboration, video/post/live delivery were not established | Current scope | S-003-S-005, S-014, S-018 | Targeted import/export/module countersearch | Dedicated upstream docs or fixtures may resolve |
| C-030 | UNKNOWN | High confidence in unknown | General scripting, OSC/network remote APIs, extension ABI guarantees, and nested Carla contract are not established | Current scope | S-005, S-015, S-018 | Tree/API countersearch and explicit exclusion | Downstream/custom integrations may exist |
| C-031 | DOCUMENTED | High | Repository and product surfaces include localization files and Transifex workflow | Current scope | S-006, S-018 | README and immutable tree | Does not establish accessibility |
| C-032 | DOCUMENTED | High | Root carries GPLv2 terms and reviewed LMMS source headers grant GPLv2-or-later; dependencies/content vary | Stable/development repository | S-016 | First-party license/source notices | Legal application is fact-specific |
| C-033 | DOCUMENTED | High | Steinberg says VST2 SDK headers are non-redistributable under its terms and new binary distribution requires a pre-Oct-2018 agreement | Current format-owner terms | S-017 | Direct format-owner FAQ | Not individualized legal advice; LMMS header provenance unresolved |
| C-034 | UNKNOWN | High confidence in unknown | Full per-format scanning, buses, automation, PDC/tails, offline, state, missing-plugin, and crash-recovery fidelity is unqualified | Current scope | S-009-S-015 | Host code exposes gaps but cannot qualify plugins | Requires conformance/crash/state fixtures |
| C-035 | DOCUMENTED | High | Official documentation/version channels are ambiguous enough to require stable/development corroboration | Current official surfaces | S-001-S-003, S-006 | Selector/root/release-channel comparison | Does not invalidate correctly pinned manual claims |
| C-036 | DOCUMENTED | High | No supported user-facing audio-recording workflow exists in reviewed pinned source despite dormant classes | Pinned development; stable lineage | S-008 | Explicit disabled UI/comment plus track path | Could change after cutoff |
| C-037 | DOCUMENTED | High | Development source defines 32-4096 device buffers, <=256 internal periods, and 44.1-192 kHz listed rates | Pinned development | S-007 | Direct constants/constructor | Hardware/backend acceptance untested |
| C-038 | UNKNOWN | High confidence in unknown | General PDC, tails, oversampling, freeze, dropout policy, deterministic worker summing, and scaling ceilings remain unestablished | Current scope | S-005, S-007, S-018 | Targeted source search and no benchmarks | Requires implementation trace and measured fixtures |
| C-039 | UNKNOWN | High confidence in unknown | Accessibility, telemetry/privacy, binary signing/notarization, update rollback, and capability sandboxing remain unestablished | Current scope | S-001, S-003-S-005, S-018 | Official-source searches saturated; no binary inspection | Dedicated policy, package, and assistive-tech audits needed |
| C-040 | INFERENCE | Medium-high | LMMS is a stronger reference for pattern composition/engine transparency than for recording/post workflows | Architecture comparison | C-003-C-009, C-013, C-036 | Product/source coverage | Future audio-recording work could change suitability |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Immutable source references are pinned to
the stable or development commit. Each source was selected for a decision
question; community search text was used only for discovery and was not
retained as proof.

- **S-001 - "Download LMMS," LMMS.** <https://lmms.io/download>. Official
  distribution/release page; stable, alpha, nightly, and platform scope.
  Relevant passages: 1.2.2 assets/changelog date, prerelease warning, cutoff
  nightly hash, Linux Wine requirement, Apple `.dll` limitation, alpha feature
  deltas including LV2/bundles/FLAC. Supports C-001-C-003, C-010, C-015,
  C-020, C-022, C-027, C-028, C-035, C-039. Limitation: long mutable vendor page
  and package claims, not independent execution. Selected over mirrors because
  it defines upstream distribution channels.
- **S-002 - GitHub release metadata for `v1.2.2`, LMMS/GitHub API.**
  <https://api.github.com/repos/LMMS/lmms/releases/tags/v1.2.2>. Official
  release metadata; stable. Relevant fields: non-prerelease flag, publication
  timestamp, artifact names, release body. Supports C-001-C-003. Limitation:
  release object is not marked immutable and assets were not verified. Selected
  to distinguish publication date from changelog date.
- **S-003 - "Welcome to LMMS" and documentation navigation, LMMS User
  Manual.** <https://docs.lmms.io/user-manual/> and
  <https://lmms.io/documentation>. Official manual surfaces; current/stable
  documentation scope. Relevant passages/navigation: 1.2.2 root changelog and
  English current 1.3.x versus stable 1.2.x selection. Supports C-003, C-029,
  C-035, C-039. Limitation: root content/version labeling is itself ambiguous
  and broad feature claims require source corroboration. Selected to expose,
  rather than hide, the documentation-version problem.
- **S-004 - LMMS stable source/tag at `94363be...`, LMMS.**
  <https://github.com/LMMS/lmms/tree/94363be152f526edba4e884264d891f1361cf54b>
  and <https://api.github.com/repos/LMMS/lmms/git/trees/94363be152f526edba4e884264d891f1361cf54b?recursive=1>.
  Immutable repository/tree; 1.2.2. Relevant inventory: build flags, VST/LADSPA
  and native plugins, absence of an LMMS LV2 host/module. Supports C-001,
  C-004, C-015-C-017, C-022, C-029, C-035. Limitation: file absence alone does
  not prove unsupported behavior. Selected to pin stable behavior and prevent
  development leakage.
- **S-005 - LMMS development source at `dff0fbd...`, LMMS.**
  <https://github.com/LMMS/lmms/tree/dff0fbd67feb18c291640e9a6640305b6a514d59>
  and <https://api.github.com/repos/LMMS/lmms/git/trees/dff0fbd67feb18c291640e9a6640305b6a514d59?recursive=1>.
  Immutable repository/tree; cutoff development snapshot. Relevant inventory:
  module map, track/plugin/import/export/backend paths and negative-format
  countersearch. Supports C-002, C-004-C-009, C-012, C-016, C-029, C-030,
  C-034-C-039. Limitation: unreleased source/build capability, not an official
  stable package. Selected as the only cutoff-pinned implementation view.
- **S-006 - `README.md`, root `CMakeLists.txt`, and plugin build lists at both
  pinned commits, LMMS.** Development links:
  <https://github.com/LMMS/lmms/blob/dff0fbd67feb18c291640e9a6640305b6a514d59/README.md>,
  <https://github.com/LMMS/lmms/blob/dff0fbd67feb18c291640e9a6640305b6a514d59/CMakeLists.txt>;
  stable build file:
  <https://github.com/LMMS/lmms/blob/94363be152f526edba4e884264d891f1361cf54b/CMakeLists.txt>.
  Immutable overview/build evidence. Relevant passages: product features,
  1.3-alpha declaration, platform/backend/VST/LV2 flags, Apple VST disable,
  Wine checks, plugin inventory, localization. Supports C-003, C-007,
  C-011, C-014, C-015, C-022-C-024, C-028, C-031, C-035. Limitation:
  defaults do not prove official binary configuration. Selected over build
  tutorials because these files govern the pinned source.
- **S-007 - Audio engine, workers, mixer, and renderer module set at
  `dff0fbd...`, LMMS.** Paths: `include/AudioEngine.h`,
  `src/core/AudioEngine.cpp`, `src/core/AudioEngineWorkerThread.cpp`,
  `src/core/Mixer.cpp`, `src/core/ProjectRenderer.cpp`, and
  `src/gui/modals/ExportProjectDialog.cpp`, under
  <https://github.com/LMMS/lmms/tree/dff0fbd67feb18c291640e9a6640305b6a514d59>.
  Immutable implementation. Relevant functions/constants: staged
  `renderNextPeriod`, job queues, dynamic master mix, buffer/rate constants,
  file-device loop. Supports C-005-C-008, C-028, C-034, C-037, C-038.
  Limitation: no runtime benchmark or backend/device qualification. Selected as
  direct engine evidence.
- **S-008 - Track, Pattern Store, MIDI, automation, and sample UI module set at
  `dff0fbd...`, LMMS.** Paths: `include/Track.h`, `include/PatternStore.h`,
  `src/core/PatternStore.cpp`, `src/tracks/MidiClip.cpp`,
  `src/gui/editors/PianoRoll.cpp`, `src/core/midi/`,
  `src/core/AutomationClip.cpp`, `src/core/Controller.cpp`, and
  `src/gui/clips/SampleClipView.cpp`, under S-005. Immutable implementation.
  Relevant passages: track types/pattern references, recording/editing,
  event parser/backends, curve types, disabled sample recording. Supports
  C-004, C-009-C-013, C-025, C-036. Limitation: large module set and no UI
  execution. Selected to trace user objects to implementation.
- **S-009 - VST2 host module set at `dff0fbd...`, LMMS.** Paths:
  `plugins/VstBase/VstPlugin.cpp`, `plugins/VstBase/RemoteVstPlugin.cpp`,
  `plugins/Vestige/Vestige.cpp`, `plugins/VstEffect/`, `include/aeffectx.h`,
  and `src/core/ConfigManager.cpp`, under S-005. Immutable implementation.
  Relevant sections: `AEffect`, helper selection, recursive configured path,
  audio/MIDI processing, host callback, transport, dynamic I/O, state, presets,
  parameter text and UI embedding. Supports C-012, C-015, C-017-C-020,
  C-034. Limitation: development refactors stable files; package and plugin
  fidelity untested. Selected as the direct VST contract.
- **S-010 - Remote plugin infrastructure at `dff0fbd...`, LMMS.** Paths:
  `include/RemotePlugin.h`, `include/RemotePluginBase.h`,
  `src/core/RemotePlugin.cpp`, and `src/common/SharedMemory.cpp`, under S-005.
  Immutable implementation. Relevant passages: process launch, shared IPC,
  watcher, crash/exit invalidation. Supports C-018, C-034. Limitation: process
  separation does not document OS sandbox permissions. Selected to distinguish
  crash containment from security isolation.
- **S-011 - LV2 host module set at `dff0fbd...`, LMMS.** Paths:
  `src/core/lv2/Lv2Manager.cpp`, `Lv2Proc.cpp`, `Lv2Ports.cpp`,
  `Lv2ControlBase.cpp`, `src/gui/Lv2ViewBase.cpp`, and `plugins/Lv2*`, under
  S-005. Immutable development implementation. Relevant passages: Lilv world,
  issue/block lists, port/feature limits, Worker, in-process run, generated UI,
  State TODO. Supports C-022, C-034. Limitation: unreleased/build-conditional
  and no fixture matrix. Selected over generic LV2 claims because it exposes
  exact limitations.
- **S-012 - LADSPA manager/effect modules at the stable and development
  commits, LMMS.** Development paths `src/core/LadspaManager.cpp`,
  `include/LadspaManager.h`, and `plugins/LadspaEffect/` under S-005; stable
  equivalents under S-004. Immutable implementation. Relevant passages:
  `LADSPA_PATH`, OS suffixes/conventional paths, `QLibrary`, descriptors,
  direct run and saved controls. Supports C-023, C-034. Limitation: loading a
  candidate in process is not validation; no crash fixtures. Selected as the
  direct LADSPA lifecycle.
- **S-013 - Project persistence module set at `dff0fbd...`, LMMS.** Paths:
  `src/core/DataFile.cpp`, `src/gui/MainWindow.cpp`, `src/core/main.cpp`, and
  `src/core/ProjectJournal.cpp`, under S-005. Immutable implementation.
  Relevant passages: XML/qCompress, upgrade table, `.new`/`.bak`, resource
  bundles, recovery file, autosave, versioned save, 100 undo states. Supports
  C-026, C-027, C-034. Limitation: destructive crash/filesystem tests were not
  run. Selected as direct durability evidence.
- **S-014 - Import/export module set at `dff0fbd...`, LMMS.** Paths:
  `plugins/MidiImport/MidiImport.cpp`, `plugins/MidiExport/MidiExport.cpp`,
  `plugins/HydrogenImport/HydrogenImport.cpp`, `src/core/ProjectRenderer.cpp`,
  `include/OutputSettings.h`, and export dialog, under S-005. Immutable
  implementation. Relevant sections: imported/exported events, Hydrogen notes,
  file codecs/bit depths/rates, stems/loops. Supports C-008, C-011, C-028,
  C-029. Limitation: codecs are build-dependent and no round trip was run.
  Selected to avoid inferring interchange from file-dialog labels.
- **S-015 - Native plugin factory and fallback at `dff0fbd...`, LMMS.** Paths:
  `include/Plugin.h`, `src/core/Plugin.cpp`, `src/core/PluginFactory.cpp`, and
  `include/DummyPlugin.h`, under S-005. Immutable implementation. Relevant
  passages: descriptor/entry-point resolution, plugin types, dummy fallback and
  empty settings. Supports C-014, C-021, C-024, C-030, C-034. Limitation: no
  ABI stability policy or missing-plugin runtime probe. Selected for extension
  and durability boundaries.
- **S-016 - `LICENSE.txt` and LMMS source notices, LMMS.**
  <https://github.com/LMMS/lmms/blob/dff0fbd67feb18c291640e9a6640305b6a514d59/LICENSE.txt>
  plus source headers in S-005. First-party license text/notices; repository
  scope. Relevant passages: GPL version 2 text and "version 2 ... or later"
  notices. Supports C-032. Limitation: dependency/content licenses and legal
  classification of reuse are separate. Selected over license summaries.
- **S-017 - "Licensing," Steinberg VST 3 Developer Portal.**
  <https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html>.
  Format-owner documentation; current at cutoff. Relevant "Specific VST 2"
  passages: `aeffect.h`/`aeffectx.h` non-redistribution and pre-October-2018
  agreement requirement for binary distribution. Supports C-033. Limitation:
  FAQ is not legal advice and does not adjudicate LMMS's files. Selected over
  community licensing claims.
- **S-018 - Pinned-tree countersearch and localization inventory, LMMS.**
  Recursive tree endpoints in S-004/S-005 plus development `README.md` and
  `data/locale` inventory. Search targets included VST3, CLAP, DSSI, AAX, AU,
  JSFX, DXi, Rack Extension, MIDI 2.0/UMP, MMC, Ableton Link, AAF/OMF/ADM,
  DAWproject, OSC, accessibility, telemetry, signing, and notarization.
  Supports C-012, C-016, C-029-C-031, C-034, C-038, C-039. Limitation: negative
  search is not proof of non-support; several substrings had unrelated hits.
  Selected to make negative results and their limits auditable rather than
  silently converting absence to fact.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods and blocker | Decision impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| U-001 External Clock/MTC/MMC/JACK transport matrix | Constants, MIDI backends, UI/source and transport strings searched; no operational contract found | Synchronization architecture | Virtual MIDI plus hardware loopback matrix for master/slave, start/stop/locate/drift | Unassigned |
| U-002 Official package format/build parity | Source flags and download assets known; package manifests/config outputs not retained | Product support promises by OS | Inspect `--version`/build configuration and plugin types in official disposable packages | Unassigned |
| U-003 VST2 crash/security boundary | Helper/watcher proven in source; no hostile execution allowed | Reliability and plugin trust model | Crash, hang, memory, filesystem, network, and restart fixtures under process tracing | Unassigned |
| U-004 Full per-format host fidelity | Generic wrappers do not prove sidechains, multibus, PDC, tails, automation, dynamic I/O, or offline equivalence | Render correctness and compatibility | Automated minimal VST2/LV2/LADSPA conformance suite at block boundaries | Unassigned |
| U-005 Missing-plugin durability | Dummy fallback inspected; exact missing VST/LV2/LADSPA save path not executed | Long-term project safety | Save/remove/open/re-save/reinstall corpus; compare identity, opaque state, I/O, automation, assets | Unassigned |
| U-006 LV2 State/custom UI/presets | Pinned code has State TODO and disabled UI branch | Development host completeness | Stateful sampler and custom-UI fixtures across save/restart/sample-rate changes | Unassigned |
| U-007 Modern MIDI/expression/SysEx | Targeted source search found ordinary MIDI 1.x only | Modern instrument roadmap | MPE zones, MIDI 2.0 UMP, SysEx, pressure and export/recall fixtures | Unassigned |
| U-008 Audio recording future/hidden behavior | Dormant classes conflict with explicitly disabled UI; binaries not run | Product model and reuse of input engine | Ask upstream for status, then disposable input/monitor/latency/record test if enabled | Unassigned |
| U-009 Collaboration and modern interchange | Import/export modules and official pages searched; no direct implementation | Ecosystem/portability | Upstream matrix plus MIDI/stem/resource round trips; DAWproject only if claimed | Unassigned |
| U-010 Engine PDC/tails/freeze/scaling | Source and names searched; no complete mechanism/benchmark | Real-time and mix correctness | Impulse/latency/tail tests, large graph benchmark, worker determinism trace | Unassigned |
| U-011 Accessibility/privacy/signing/notarization | Official-source discovery saturated and web search hit HTTP 429; binaries excluded | Inclusion, privacy, supply chain | Dedicated assistive-tech audit, privacy/network capture, signature/notarization inspection | Unassigned |
| U-012 VST2 header/license provenance | Repository and format-owner terms conflict in implications; legal question out of scope | Reuse/distribution risk | Counsel review of provenance, agreements, notices, trademarks, and proposed distribution | Unassigned |

## 24. Curiosity pass and stop decision

Scores use 1 (low) to 5 (high); lower cost is better. One best qualifying
thread was pursued after each synthesis rather than broadening the search.

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision/result |
| --- | ---: | ---: | ---: | ---: | --- |
| VST discovery versus runtime isolation and state | 5 | 5 | 5 | 2 | **PURSUED** in the first bounded source pass. Result: recursive discovery plus helper-process runtime/watcher, but no security sandbox or complete recall guarantee. [C-017-C-021] |
| MIDI recording/sync/interchange semantics | 5 | 4 | 4 | 2 | **PURSUED** after first synthesis as the best remaining gap. Result: rich MIDI 1.x recording/import, narrower export, and no proven external sync matrix. [C-010-C-012] |
| Licensing/SDK constraint check | 5 | 4 | 3 | 2 | **PURSUED** only after source synthesis because it can reject direct VST2 adaptation. Result: current owner terms impose material VST2 constraints. [C-032, C-033] |
| Further unsupported-format archaeology | 3 | 1 | 1 | 4 | `CURIOSITY_NO_GO`; repeated absence results cannot settle support. Reopen on upstream module/matrix or fixture. [C-016] |
| Accessibility and telemetry/privacy web search | 3 | 2 | 2 | 5 | `CURIOSITY_NO_GO`; official discovery saturated, search was rate-limited, and dynamic/policy audit has higher value. [C-039] |
| Binary signing/notarization investigation | 3 | 2 | 2 | 5 | `CURIOSITY_NO_GO`; source cannot prove artifact properties and installation is excluded. [C-039] |
| Exhaustive built-in plugin/content inventory | 2 | 1 | 1 | 5 | `CURIOSITY_NO_GO`; build-specific inventory will not change the architecture decision. [C-014] |

**Stop decision:** research stopped on sufficient coverage, source-level
saturation, depth-budget exhaustion, repeated negative-search duplicates, and
nonpositive marginal documentary evidence. All 26 sections and 13 format rows
are covered; stable/development boundaries, contradictions, and consequential
unknowns are visible. Four official-domain web searches returned HTTP 429; the
known first-party endpoints were fetched directly instead of repeatedly
retrying discovery. Remaining questions require package inspection, runtime
fixtures, assistive-technology/privacy audits, upstream confirmation, or legal
review, not another broad source search.

## 25. Completion checklist

- [x] Only the assigned dossier path was edited.
- [x] Identity, edition, version/date, OS scope, and exclusions are explicit.
- [x] Every required dossier heading exists in order.
- [x] Every material assertion has a claim ID and classification.
- [x] Every claim resolves to source IDs or a fully described `UNKNOWN`.
- [x] Every required plugin-format row is present.
- [x] Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.
- [x] Facts, vendor documentation, inferences, and unknowns are not conflated.
- [x] Licensing and clean-room boundaries are explicit.
- [x] Bibliography records source rationale and limitations.
- [x] Curiosity pass and `CURIOSITY_NO_GO` decisions are present.
- [x] No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.

Owned path: `research/daw-landscape/dossiers/lmms.md`.

Checks performed: headings `0` through `25` occur once and in order; all 13
required plugin rows occur once and in order; 40 claim definitions and 18
source definitions close without undefined IDs, and every ID occurs outside
its definition; ASCII, trailing-whitespace, and no-index diff checks passed.
Path-scoped status shows this new dossier. Repository-wide short status remains
at the pre-edit count of 57 entries (the research tree was already untracked),
and all pre-existing paths were left untouched. Unresolved blockers U-001
through U-012 require dynamic, packaging, legal, accessibility, or privacy work
outside this documentary scope.
