# Non DAW ecosystem dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

| Field | Value |
| --- | --- |
| Product family | Non DAW ecosystem: Non Timeline, Non Mixer, Non Sequencer, and Non Session Manager (NSM) |
| Canonical upstream | Jonathan Moore Liles / `non.tuxfamily.org` |
| Researcher/session | Research subagent, session `ses_fb274af15ffenqlJe11xWgTtDE` |
| Owned path | `research/daw-landscape/dossiers/non-daw.md` |
| Research date / cutoff | 2026-08-29 UTC |
| Last public upstream state | Official v1.3.0 release dated 2021-01-27; mirrored commit `cdad26211b301d2fad55a26812169ab905b85bbb` dated 2021-01-28 pins Timeline 1.3.0, Mixer 1.3.0, Session Manager 1.3.0, Sequencer 1.10.0, and MIDI Mapper 1.1 [C-001] |
| Editions | **UNKNOWN:** no edition tiers were found in the retained canonical site, release, or build evidence [C-044] |
| Platforms | GNU/Linux upstream scope; no upstream macOS, Windows, mobile, or web edition documented [C-002] |
| Included | The four applications, their shared JACK/OSC/NSM model, `jackpatch`, `non-midi-mapper`, and the shipped LADSPA host boundary |
| Excluded | New Session Manager and other forks; unrelated JACK clients; binary/runtime qualification; old pre-suite applications except as lineage; proprietary internals (none were sought) |
| Completion | **COMPLETE_WITH_UNKNOWNS** |

The official website still serves documentation in present tense, but the
LinuxAudio repository describes itself as a read-only mirror of a defunct
upstream and contains no commit later than 2021. This dossier therefore treats
the suite as a **last-public-state historical architecture reference**, not as a
currently maintained product [C-003].

## 1. Executive summary

- **Process boundary:** Non is not one DAW executable. It is a Linux modular
  studio assembled from independent Timeline, Mixer, Sequencer, and session
  manager processes. JACK owns inter-application audio/MIDI routing and
  transport; OSC carries session and parameter control [C-002] [C-004].
- **Component ownership:** Timeline records/arranges audio and emits automation;
  Mixer owns audio DSP, strips, Ambisonics, and plugin hosting; Sequencer owns
  pattern/phrase/sequence MIDI; `nsmd` coordinates lifecycle while each client
  owns its project data. `jackpatch` separately persists the JACK graph
  [C-005] [C-006] [C-007] [C-008] [C-009].
- **Plugin headline:** the last public Mixer is a **LADSPA-only host**. The
  manual, active build manifest, complete immutable tree, and sole plugin module
  agree. Discovery and execution use `dlopen` in the Mixer process; there is no
  evidenced scanner process, sandbox, quarantine, bridge, persistent cache, or
  custom plugin-UI bridge [C-018] [C-019] [C-020] [C-022] [C-027].
- **State/recovery:** LADSPA identity is recalled by UniqueID and parameter
  values by port order. Missing IDs retain I/O-count metadata and produce a
  warning/unloaded module. NSM can relaunch a dead client, but this is not plugin
  isolation or transactional crash recovery [C-025] [C-026] [C-030].
- **Differentiator:** routing is deliberately external. Traditional internal
  buses/sends/inserts are replaced by strips and JACK connections; Mixer groups
  trade JACK-client parallelism against context-switch overhead [C-006]
  [C-040].
- **Major unknowns:** tested crash behavior, journal atomicity/recovery,
  end-to-end plugin delay compensation, exact libsndfile codec matrix,
  sample-accurate plugin automation, advanced MIDI expression, accessibility,
  update/security practice, and fork behavior [C-015] [C-031] [C-037]
  [C-039].
- **Recommendation:** retain Non as a historical reference for protocol-owned
  sessions, independently replaceable processes, graph persistence as a client,
  and adjustable scheduling granularity. Do not use its in-process LADSPA
  scanner/runtime, positional parameter recall, or unauthenticated distributed
  OSC control as a modern default [C-006] [C-008] [C-009] [C-022] [C-025]
  [C-036].

**Overall confidence: high** for the 2021 component and LADSPA-host boundaries,
because manuals and immutable source agree; **medium/low** for reliability and
interoperability quality because no binaries or plugins were executed.

## 2. Product identity, history, and market position

The upstream presents Non as a free-software GNU/Linux studio composed of four
parts. Older release notes call the audio arranger **Non-DAW**, while the final
build names it `non-timeline` and retains `non-daw` as a symlink; this dossier
uses the final **Non Timeline** name [C-002] [C-045]. The product boundary is the
suite rather than a monolith [C-004]. Its
intended workflow is a lightweight Linux audio toolbox: each component can run
alone or with other JACK applications, while NSM can combine them into a
song-level session [C-004] [C-008].

The official news page records v1.0.0 (2010), v1.1.0 with NSM (2012), and
v1.3.0 (2021). The final mirrored commit is an upstream-authored version bump on
2021-01-28 [C-001]. The still-live site is historically stale: its copyright
footer ends at 2021, while the archival mirror says the upstream is defunct.
There is no evidence of a later canonical release through the cutoff [C-003].

No paid/free edition matrix was found; this remains **UNKNOWN**, not proof that
no historical packaging variants existed [C-044]. The market position is
architectural rather than commercial: an open,
JACK-native modular studio for Linux musicians and live/low-resource use. Vendor
claims of speed, reliability, and low-resource suitability were not independently
benchmarked [C-002] [C-035].

## 3. Workflow and conceptual model

The logical “song” is an NSM session containing independently persisted client
projects and, when requested, a saved JACK graph. There is no single file that
contains every component's state [C-008] [C-028].

- **Timeline:** linear, non-destructive audio recorder/arranger. Its visible
  objects are tracks, takes, audio regions, control/annotation sequences,
  cursors, and time/tempo points [C-005] [C-010].
- **Mixer:** modular strip chains. JACK connections replace a monolithic DAW's
  internal routing graph; a strip chain contains built-in DSP and LADSPA modules
  [C-006] [C-016] [C-040].
- **Sequencer:** bottom-up MIDI composition: notes form patterns, patterns form
  phrases, and an ordered phrase list forms a sequence. Pattern and Trigger
  modes also support live looping/unmuting [C-007] [C-014].
- **Session:** NSM coordinates open/save/close and assigns per-client storage;
  it does not interpret application project formats [C-008] [C-028].

The suite does not document clip-launching scenes, notation, video, or a unified
track containing audio, MIDI, devices, routing, and automation. Those are either
external-client responsibilities or absent/unknown [C-015] [C-039].

## 4. Publicly documented architecture

The source tree and manuals evidence separate executables for `non-timeline`,
`non-mixer`, `non-sequencer`, `non-session-manager`, `nsmd`, `jackpatch`, and
`non-midi-mapper`, with shared `nonlib`/UI code [C-004] [C-008]. JACK provides
real-time audio/MIDI ports, graph scheduling, transport, and timebase. liblo/OSC
provides NSM and parameter-control messaging [C-009] [C-012] [C-017].

Mixer is one OS process even though strips may register as separate JACK
clients. Ungrouped strips can expose parallel JACK scheduling; strips assigned
to one Mixer group execute serially, reducing JACK context-switch overhead.
Independent groups may be scheduled in parallel by JACK2 [C-006]. This is a
JACK-client boundary, **not** per-strip crash isolation [C-022].

NSM also separates UI from control plane: `non-session-manager` is a GUI for
`nsmd`, and the daemon is itself controlled by OSC. Clients announce to the URL
in `NSM_URL`, receive an instance-specific path and stable client ID, and reply
only after open/save completes [C-008]. `jackpatch` is a normal headless NSM
client rather than hidden daemon-owned graph serialization [C-009].

Threading visible in retained source includes Mixer background plugin discovery.
A complete engine scheduling/thread model beyond JACK callbacks is not
documented here [C-020] [C-039].

## 5. Audio engine

Timeline and Mixer use JACK for real-time I/O. Timeline controls JACK Transport,
publishes tempo/time-signature changes through JACK Timebase, records through
per-track channel configurations, and can bounce faster than real time
internally or through Mixer/other JACK clients [C-013]. Mixer performs DSP in
ordered modules and exposes strip/group scheduling to JACK [C-006] [C-016].

Known engine behavior is limited to the public interfaces:

- Mixer modules expose audio and control ports; host chains can duplicate a
  mono input into a multi-input LADSPA plugin or run multiple mono plugin
  instances across channels [C-023].
- LADSPA latency is recognized only when a control output is named `latency`;
  changes trigger chain latency recomputation and JACK latency propagation
  [C-024]. This does **not** prove full end-to-end plugin delay compensation.
- Bypass deactivates a LADSPA instance and the bypass path copies supported
  channel layouts [C-024].
- Timeline builds on libsndfile, but the exact available formats depend on that
  library/build. Recorded precision, internal mix precision, resampling,
  oversampling, tail handling, multicore policy outside JACK2, dropout recovery,
  freeze, and deterministic offline/plugin behavior are **UNKNOWN** [C-039].

## 6. Tracks, timeline, clips, and editing

Timeline tracks have configurable channel counts, record arm, mute, solo, an
active take, and any number of inactive takes. Takes can be displayed together
and material can be assembled from prior takes, but a modern lane/comp-tool
contract is not documented [C-011].

Audio regions reference ranges of immutable source files. Documented operations
include split, duplicate, delete, trim, slip/source pan, gain normalization,
fade-curve selection, overlap crossfades, and looping. Deleting a region does
not delete its source [C-010]. Time/tempo rulers support snapping and JACK
timebase output; annotation points/regions hold cues or text [C-005] [C-013].

No retained source documents elastic warping/time stretch, pitch correction,
ripple modes, folder tracks, ARA, or take comping with swipe/lane semantics;
these remain **UNKNOWN**, not assumed absent [C-039].

## 7. MIDI, sequencing, notation, and expression

Sequencer records and emits timestamped JACK MIDI. It has separate performance
and control inputs, per-pattern output port/channel, grid and raw-event editing,
and merge/overwrite/layer/new recording modes. Raw events include documented
program and controller changes [C-014]. JACK's ALSA bridge can connect external
ALSA MIDI devices/applications, but that bridge is outside Non [C-014].

Sequencer follows a JACK timebase master and assumes that role when none exists.
Pattern playback is described as sample-accurate by virtue of timestamped JACK
MIDI, but no dynamic probe was performed [C-014].

Notation/score, piano-roll semantics, SysEx completeness, MPE/per-note
expression, MIDI 2.0/UMP, and persistent controller-map behavior are
**UNKNOWN**. No evidence establishes these from raw-MIDI support alone [C-015].

## 8. Routing, mixer, automation, and control

Non Mixer intentionally removes internal “bus/send/insert” object types: users
construct equivalent graphs with more strips, Aux/JACK modules, and external
JACK connections. Feedback restrictions are expressed operationally in grouping
guidance—strips in one group should be parallel and without feedback—not as a
complete graph validator [C-006] [C-040].

Built-in modules are JACK I/O, Gain, Meter, Mono Pan, Aux, Spatializer, and the
LADSPA Plugin module. Spatializer and signature-detected LADSPA panners expose
Ambisonics position controls; B-format routing and external reverb are composed
through JACK [C-016] [C-038]. Surround/immersive standards beyond this
Ambisonics mechanism are unknown.

Any visible Mixer parameter receives generated normalized and unscaled OSC
paths. Timeline control sequences can connect by OSC “Control Signal” discovery
or JACK control-voltage ports; interpolation is None or Linear.
`non-midi-mapper` maps JACK MIDI controls to Mixer OSC and stores mappings in
the NSM session [C-012] [C-017]. The NSM server also exposes save/open/new/
duplicate/close/abort/quit and broadcast operations via OSC [C-042].

Sample-accurate plugin automation is not documented. The Mixer manual warns
that LADSPA controls do not process CV at full audio resolution, and OSC is an
asynchronous control layer; therefore automation fidelity must be qualified
dynamically [C-017] [C-039].

## 9. Recording, comping, and media handling

Timeline supports track arming, transport-started recording, loop recording,
automatic creation of new takes, and any number of punch cursors. Input
monitoring and hardware routing are delegated to JACK/Mixer rather than a
documented integrated monitor section [C-011] [C-040].

A Timeline project stores recorded sources locally but may reference dragged
audio externally. The supplied `import-external-sources` utility collects such
assets; `remove-unused-sources` handles unreferenced project media. Exact audio
format/metadata support follows libsndfile but is not enumerated in the retained
documentation [C-041].

Video, conform, proxies, broadcast metadata, sample-pool management, and robust
missing-media relink UX are **UNKNOWN** [C-039].

## 10. Instruments, effects, content, and native devices

Mixer's native DSP inventory is deliberately small: Gain, Meter, Mono Pan, Aux,
Spatializer, and JACK I/O. The only third-party device module hosts LADSPA.
Modules form serial strip chains and can be cut/copied/pasted; strip import/
export captures a chain and parameter values [C-016] [C-038] [C-025].

Sequencer supplies plain-text scale/instrument mappings, but synthesis and sample
playback are expected from external JACK clients. No bundled sampler,
synthesizer, rack/macro system, or public product-native plugin authoring SDK is
documented [C-007] [C-038].

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` platform cells are based on the upstream's explicit GNU/Linux
product scope, not on a claim about whether the plugin format exists elsewhere
[C-002]. “No shipped host” is bounded to immutable snapshot `cdad262…`; it says
nothing about forks [C-019].

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | UNKNOWN: no explicit VST2 policy; no host implementation in the complete 2021 snapshot | NOT_APPLICABLE: no mobile/web edition | Mixer 1.3.0 snapshot | Not supported by the evidenced host; no scanning/runtime contract found | C-019, C-035; S-005, S-006, S-008 |
| VST3 | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | UNKNOWN: no explicit VST3 policy; no host implementation in the complete 2021 snapshot | NOT_APPLICABLE: no mobile/web edition | Mixer 1.3.0 snapshot | Not supported by the evidenced host; no scanning/runtime contract found | C-019, C-035; S-005, S-006, S-008 |
| AUv2 | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | UNKNOWN: no AU host implementation in the 2021 snapshot | NOT_APPLICABLE: no mobile/web edition | Mixer 1.3.0 snapshot | No support evidence | C-002, C-019, C-035; S-001, S-005 |
| AUv3 | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | UNKNOWN: no AU host implementation in the 2021 snapshot | NOT_APPLICABLE: no mobile/web edition | Mixer 1.3.0 snapshot | No support evidence | C-002, C-019, C-035; S-001, S-005 |
| AAX | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | UNKNOWN: no AAX host implementation in the 2021 snapshot | NOT_APPLICABLE: no mobile/web edition | Mixer 1.3.0 snapshot | No support evidence | C-002, C-019, C-035; S-001, S-005 |
| CLAP | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | UNKNOWN: no CLAP host implementation in the 2021 snapshot | NOT_APPLICABLE: no mobile/web edition | Mixer 1.3.0 snapshot | Snapshot predates current CLAP adoption; no support evidence | C-001, C-019, C-035; S-004, S-005 |
| LV2 | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | DOCUMENTED: no shipped host; upstream said in 2012 it had no plans to host LV2, and the 2021 build still contains none | NOT_APPLICABLE: no mobile/web edition | Mixer 1.3.0; policy statement 2012 | A commented LV2 library list in Timeline's build file is inactive and not host support | C-019, C-034; S-012, S-016 |
| LADSPA | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | DOCUMENTED: supported in Mixer | NOT_APPLICABLE: no mobile/web edition | Mixer 1.3.0 | Only fully evidenced third-party format; audio/control ports, generic UI | C-018–C-027; S-003, S-006–S-008, S-018 |
| DSSI | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | DOCUMENTED: a 2010 future plan only; no shipped host in the 2021 tree/build | NOT_APPLICABLE: no mobile/web edition | Mixer 1.3.0; historical note 2010 | Do not convert the old plan into a support claim | C-019, C-034; S-005, S-008, S-016 |
| JSFX | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | UNKNOWN: no explicit policy; no host implementation in the 2021 snapshot | NOT_APPLICABLE: no mobile/web edition | Mixer 1.3.0 snapshot | No support evidence | C-019, C-035; S-005, S-008 |
| DirectX/DXi | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | UNKNOWN: no explicit policy; no host implementation in the 2021 snapshot | NOT_APPLICABLE: no mobile/web edition | Mixer 1.3.0 snapshot | No support evidence | C-002, C-019, C-035; S-001, S-005 |
| Rack Extension | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | UNKNOWN: no explicit policy; no host implementation in the 2021 snapshot | NOT_APPLICABLE: no mobile/web edition | Mixer 1.3.0 snapshot | No support evidence | C-019, C-035; S-005, S-008 |
| Product-native/other | NOT_APPLICABLE: no macOS edition | NOT_APPLICABLE: no Windows edition | DOCUMENTED: built-in Mixer modules, OSC/CV controls, and external JACK clients; no third-party native-device SDK evidenced | NOT_APPLICABLE: no mobile/web edition | Suite snapshot at `cdad262…` | Native modules are internal code, not a plugin compatibility format | C-016, C-038; S-003, S-005, S-018 |

### 11.2 Discovery, scanning, validation, and recovery

Mixer starts plugin discovery in a background thread. `LADSPAInfo` scans the
colon-separated `LADSPA_PATH`, or defaults to `/usr/lib/ladspa` and
`/usr/local/lib/ladspa`. LRDF category metadata comes from `LADSPA_RDF_PATH`,
or `/usr/share/ladspa/rdf` and `/usr/local/share/ladspa/rdf` [C-020].

Every regular file in a search directory is opened with `dlopen`; the scanner
looks up and calls `ladspa_descriptor`. Duplicate UniqueIDs are first-wins and
later copies are warned and omitted. Categories and same-name menu entries are
disambiguated for display, but runtime/project identity is the numeric UniqueID
[C-020].

Validation requires instantiate, connect, run, cleanup, nonempty ports, and a
name; inconsistent `run_adding` callbacks and in-place-broken plugins are
rejected. The scanner generally requires the LADSPA hard-real-time flag, with an
explicit maker-specific TAP exception [C-021].

No persistent scan cache, blacklist/quarantine database, safe-mode scan, or
documented rescan UI was found in the retained manual/build/host files. The
implementation has a `RescanPlugins` routine and prints warnings/recommends a
rescan when a loaded library changed, but how a user invokes that after startup
is **UNKNOWN** [C-027].

### 11.3 Runtime isolation and compatibility

Discovery and execution are in-process: Mixer `dlopen`s the shared object,
obtains its descriptor, and directly invokes instantiate/connect/run/cleanup.
There is no worker process, sandbox, architecture bridge, signature check, or
crash quarantine in the evidenced host path [C-022] [C-027].

A plugin failure can therefore plausibly terminate the Mixer process, although
that consequence was not dynamically observed. The suite's process modularity
limits the direct OS-process blast radius to Mixer, while NSM may relaunch Mixer;
it does not preserve the failing plugin's live memory state [C-030]. Separate
JACK clients per strip do not provide process isolation [C-006] [C-022].

### 11.4 Host/plugin processing contract

The host exposes LADSPA audio and control ports only; there is no plugin MIDI/
event bus. Fixed audio configurations may match directly, duplicate one input
across a multi-input plugin, or instantiate a mono-in/mono-out plugin once per
incoming channel. Other configurations are rejected [C-023]. This documents
multi-channel adaptation, not named sidechain buses or arbitrary dynamic I/O.

Control-port range/default/log/integer/toggle hints are translated into generic
host controls. Processing calls LADSPA `run` for each instance at the JACK block
size. Bypass uses activate/deactivate and a host bypass path. A control output
named `latency` feeds chain/JACK latency recalculation [C-023] [C-024]. Tail
reporting, suspend, per-plugin oversampling, MIDI note expression, and a complete
offline-render contract are **UNKNOWN** [C-039].

Timeline advertises faster-than-real-time bounce through Mixer/JACK programs,
but the retained evidence does not establish how every external client or
LADSPA plugin behaves in that mode [C-013].

### 11.5 Parameters, automation, state, presets, and project recall

Mixer serializes a plugin's LADSPA UniqueID, input/output counts, active state,
and all control-input values. Values are stored as a colon-separated sequence in
port order, not by stable parameter IDs. That makes port-order compatibility a
migration dependency [C-025].

An unknown UniqueID produces an `Unknown plugin ID` warning and an unloaded,
bypassed module label while retained I/O counts help preserve the module's
shape. This is a rudimentary missing-plugin representation; automatic later
relink, substitute mapping, and state migration are not documented [C-026].

Individual strips—including module chains and parameter values—can be imported
or exported as a native higher-level preset. No format-native binary state
chunk, vendor preset browser, asset-reference protocol, or cross-host plugin
state exchange exists in the LADSPA host evidence [C-025]. Automation reaches
the same controls through OSC/CV, but stable automation identity across renames,
duplicate module reorder, or changed plugin ports is unqualified [C-017]
[C-025].

### 11.6 UI, diagnostics, and failure modes

LADSPA parameters are shown in Non's generic Module Parameter Editor; users can
choose knob/vertical/horizontal controls and bind one host control per
parameter. No plugin-supplied custom UI embedding, detachment, scaling, or
headless custom-UI lifecycle appears in the active host [C-027].

Diagnostics are console warnings: no plugins found, duplicate ID, unloadable
library, missing descriptor symbol, validation failure, instantiation failure,
unknown plugin ID, or recommendation to rescan. There is no evidenced GUI crash
report, quarantine list, scan log browser, or recovery mode [C-021] [C-026]
[C-027].

## 12. Extensibility and integration

The primary extension boundary is protocol/process based rather than an
in-process scripting API: JACK audio/MIDI clients, NSM OSC clients, Mixer OSC
parameters, Timeline control signals, and the NSM server-control/broadcast API
[C-004] [C-042]. NSM clients need not link a Non library; they implement the
published OSC protocol and behavioral contract [C-008].

The suite includes external-control bridges (`non-midi-mapper`) and JACK graph
persistence (`jackpatch`). It has no documented general scripting language,
macro/action API, stable native-device SDK, or third-party GUI extension system
[C-038] [C-042]. Protocol compatibility/versioning is explicit for NSM API 1.2,
but long-term compatibility beyond the 2021 snapshot is unknown.

## 13. Project format, persistence, interoperability, and collaboration

Persistence is layered [C-028] [C-029]:

1. NSM stores each logical session under a session-root directory and gives each
   client an instance-specific path.
2. Each compliant client owns and saves its project-local state and media.
3. `jackpatch` optionally stores/restores JACK connections.
4. Timeline uses a project directory containing journal, settings, notes,
   metadata, and audio sources; Mixer uses a self-contained project directory.
5. Sequencer's `.non` file is a Non-specific variation of SMF-2 with Cue/meta
   events and a `Non!` sequencer-specific event [C-032].

NSM session duplication recursively copies the directory and serves as a
template mechanism. Its API directs clients to keep internal files in their
assigned area and recommends symlinks for external read-only assets so an
archive tool can dereference them [C-028].

Timeline's plain-text bidirectional-delta journal is documented as providing
full-history undo and immediate saves. The upstream's absolute “zero corruption
risk” statement is a vendor claim, not independent proof; journal replay,
fsync/atomicity, corruption handling, and autosave semantics remain **UNKNOWN**
[C-029] [C-031].

Interchange is narrow: Sequencer imports SMF-0/1/2 and exports patterns as
SMF-0; Timeline imports basic tempo/sources/tracks/regions from Ardour 1/2/3;
Timeline can collect external audio. No AAF, OMF, ADM, MusicXML, DAWproject,
cloud collaboration, or version-control workflow is documented [C-032].

## 14. Delivery, live, post-production, and specialized workflows

Timeline can bounce faster than real time and can route that path through Mixer
or other JACK programs. It exposes timecode/sample/bar-beat clocks, multiple
punch ranges, and annotations; Mixer emphasizes live mixing and Ambisonics;
Sequencer provides live Pattern/Trigger playback [C-013] [C-014] [C-038].

There is no retained evidence for integrated mastering suites, batch export,
loudness standards, DDP, video/ADR, ADM, or show-control cue stacks. Specialized
delivery is expected to involve external JACK/Linux tools and remains outside
the documented product boundary [C-039].

## 15. Performance, reliability, security, and accessibility

Mixer's documented performance mechanism is explicit graph granularity:
ungrouped strips permit JACK2 parallelism, while groups reduce context switches
by serializing compatible strips. Manual benchmark tables are vendor-provided
examples, not independent measurement [C-006] [C-035].

Reliability mechanisms include Timeline journaling, NSM dirty/progress/error
reporting, and dead-client restart. None proves atomic save,
plugin containment, deterministic graph restoration, or data recovery after
power loss [C-030] [C-031]. In-process plugin scanning/execution is a material
trust boundary [C-022].

The NSM API uses OSC and commonly UDP; distributed examples require opening
firewall ports and identify clients by message return address. The retained API
specifies no authentication, authorization, or transport encryption. It is a
bounded **INFERENCE** that exposing `nsmd` outside a trusted network would create
an unauthenticated control risk [C-036].

Signing/notarization, package update/rollback, telemetry/privacy, localization,
screen-reader support, keyboard-only completeness, high-DPI behavior, and
formal supported-hardware limits are **UNKNOWN**. The source and website are too
stale to infer contemporary security or accessibility fitness [C-037] [C-043].

## 16. Licensing, ecosystem, and implementation constraints

The root repository includes the GNU GPL version 2 license text; sampled core
source notices state “version 2 or (at your option) any later version.” A reuse
assessment must inspect all relevant file notices/dependencies rather than rely
only on repository metadata [C-033]. The website documentation footer uses
CC BY-SA 2.5, a separate content license. This dossier gives no legal advice.

Dependencies include JACK, liblo, NTK, pthreads, libsndfile (Timeline),
libsigc++ (Sequencer), and LADSPA/liblrdf/libdl (Mixer) [C-018]. A product that
copies or derives GPL-covered code must evaluate GPL obligations; clean-room
adaptation should instead use public behavioral ideas and independently written
interfaces.

LADSPA host support does not grant redistribution rights for third-party
plugins. Likewise, the absence of VST/AU/AAX/CLAP support means no inference can
be made about those SDK licenses, trademarks, certification, or compatibility.
Any new product must evaluate each format with its owner and current terms
separately [C-035].

## 17. Strengths, liabilities, and architecture lessons

**Strengths**

- Clear process ownership and replaceability: audio arrangement, mixing, MIDI,
  and session management are separable [C-004].
- Protocol-defined session lifecycle lets unrelated clients participate without
  sharing project formats [C-008] [C-042].
- JACK is reused for graph routing/scheduling rather than duplicated internally;
  group granularity makes a real performance tradeoff visible [C-006] [C-040].
- Timeline's non-destructive region model and directory/journal persistence are
  compact architecture references [C-010] [C-029].
- The LADSPA host is small enough to expose the entire discovery, validation,
  processing, automation, UI, and recall contract [C-018]–[C-026].

**Liabilities**

- A four-process studio plus optional graph/state helpers increases operational
  coordination and external-graph failure modes [C-028] [C-030].
- Plugin scanning/runtime share the Mixer process; no quarantine or isolation
  exists in the evidenced design [C-022] [C-027].
- UniqueID plus positional parameter state is weak against collisions and port
  reordering [C-020] [C-025].
- Plugin-format breadth and contract fidelity are extremely limited compared
  with the decision frame; LADSPA lacks MIDI/event and custom-UI paths here
  [C-019] [C-023] [C-027].
- Upstream staleness prevents treating the code as a current production baseline
  [C-003] [C-043].

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites / tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Coordinate independently useful tools as one project | Session daemon assigns per-client paths and synchronizes open/save/quit; clients own formats | C-008, C-028 | Stable protocol, deterministic client IDs, failure/status UI; distributed saves are not automatically transactional | Medium | **CANDIDATE** |
| Persist an external real-time graph without coupling it to the manager | Make graph capture/restore an ordinary headless session client | C-009 | Stable port identities and ordered restore; stale/missing endpoints require diagnostics | Medium | **CANDIDATE** |
| Balance graph parallelism against scheduling overhead | Expose user-visible grouping that serializes related strips while preserving parallel groups | C-006 | Scheduler integration and graph validation; user can choose poor groups | Medium | **CONDITIONAL** |
| Keep audio edits reversible and portable | Immutable media references plus small region deltas in a project directory | C-010, C-029, C-041 | Media ownership/relink policy and tested transactional journal | Medium until recovery is proven | **CANDIDATE** |
| Automate parameters across process boundaries | Discoverable normalized/exact OSC endpoints plus timeline control sequences | C-012, C-017 | Stable semantic IDs, timestamps, authentication, feedback/rate policy | High for sample accuracy/security | **CONDITIONAL** |
| Make missing extensions visible without discarding the graph slot | Retain extension ID, I/O shape, bypass state, and explicit missing label | C-026 | Stable format identity and later relink/migration UX | Low/medium | **CANDIDATE** |
| Integrate heterogeneous tools without absorbing all features | Define external audio/MIDI/session/control contracts and permit replacement clients | C-004, C-040, C-042 | Strong onboarding, graph diagnostics, packaging, version negotiation | Medium/high product-complexity risk | **CONDITIONAL** |

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected architecture mechanisms

- **Reject untrusted in-process scan-and-run as the default.** `dlopen` and
  descriptor execution occur in Mixer without containment [C-022]. Reopen only
  for a trusted-only embedded profile with explicit policy.
- **Reject numeric ID + parameter-order state as a modern universal contract.**
  Duplicate IDs are first-wins and state has no semantic parameter identity
  [C-020] [C-025].
- **Reject unauthenticated network session control.** The documented distributed
  OSC model has no auth/encryption contract [C-036]. Reopen only behind a trusted
  local IPC or authenticated transport.
- **Reject absolute reliability claims without fault injection.** The journal's
  “zero corruption risk” is vendor prose, not evidence [C-031].

### CURIOSITY_NO_GO threads

- `CURIOSITY_NO_GO`: investigate New Session Manager/forks. **Reason:** a distinct
  maintained lineage would broaden the assigned upstream product boundary; it
  belongs in a separate dossier or follow-up.
- `CURIOSITY_NO_GO`: trace every historical DSSI/LV2 development discussion.
  **Reason:** active 2021 build/source and explicit 2012 policy already determine
  the shipped boundary; archaeology cannot change it [C-034].
- `CURIOSITY_NO_GO`: inventory distribution packages and unofficial binaries.
  **Reason:** package recency does not prove upstream maintenance or host
  behavior; immutable upstream source is preferable.
- `CURIOSITY_NO_GO`: infer VST/AU/AAX/CLAP support from generic Linux audio
  articles. **Reason:** secondary absence/presence claims cannot override the
  product's complete host source [C-019].
- `CURIOSITY_NO_GO`: enumerate every libsndfile codec. **Reason:** the result is
  build/runtime dependent and does not change the component architecture;
  qualification should query the actual build.
- `CURIOSITY_NO_GO`: reproduce the manual's historical performance benchmarks.
  **Reason:** hardware/JACK versions are obsolete; a later prototype should use
  decision-relevant current fixtures.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test / counterevidence search | Result |
| --- | --- | --- |
| H1: the suite is intentionally split into independent JACK processes | Homepage, manuals, full tree, NSM API; checked whether “separate JACK clients” meant processes | **SUPPORTED.** Four applications are separate; Mixer strips are JACK clients inside one Mixer process, a necessary qualification [C-004] [C-006]. |
| H2: NSM coordinates lifecycle while each client owns state | NSM manual/API; checked whether daemon stores application and JACK state itself | **SUPPORTED.** Clients own assigned paths; `jackpatch` separately owns graph state [C-008] [C-009] [C-028]. |
| H3: plugin hosting is concentrated in Mixer | Manuals, complete tree, active build lists | **SUPPORTED.** Timeline and Sequencer have no active host; Mixer has the sole LADSPA module [C-018] [C-019]. |
| H4: LADSPA is the only shipped third-party format | Manual plus plugin/build source; searched full tree; considered DSSI plan and commented Timeline LV2 libs | **SUPPORTED for snapshot `cdad262…`.** DSSI remained a plan; LV2 was declined and inactive [C-019] [C-034]. |
| H5: “format accepted” implies a robust full host contract | Compared discovery, validation, instantiation, UI, state, latency, and failure evidence | **REFUTED.** LADSPA is accepted and instantiated, but isolation, cache, custom UI, tails, migration, and dynamic I/O remain absent/unknown [C-020]–[C-027]. |
| H6: NSM restart is plugin crash containment | Compared OS-process and session boundaries | **REFUTED.** A plugin shares Mixer; NSM may relaunch Mixer only after process death [C-022] [C-030]. |
| H7: journaled persistence proves lossless recovery | Searched manual/page for replay, atomicity, corruption tests | **NOT ESTABLISHED.** Mechanism and vendor claim exist; adversarial evidence does not [C-031]. |

Later safe probes should separately test: scanner acceptance; instance creation;
audio/control fidelity; duplicate ID selection; missing-plugin recall; latency;
offline bounce; plugin crash containment; and session/JACK graph restoration.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Official news records v1.0.0 in 2010, v1.1.0 in 2012, and v1.3.0 on 2021-01-27; final mirrored upstream commit on 2021-01-28 pins Timeline/Mixer/NSM 1.3.0 and Sequencer 1.10.0. | Release history / last public snapshot | S-004, S-016 | Commit patch directly changes final version manifests. | No later upstream source found; website alone is not a maintenance signal. |
| C-002 | DOCUMENTED | High | Non is a GNU/Linux suite of Timeline, Mixer, Sequencer, and Session Manager. | Product/platform identity | S-001 | Official homepage statement. | Does not prove that unofficial ports cannot exist. |
| C-003 | INFERENCE | High | Canonical upstream is stale/defunct; use last-public-state framing. | Status at cutoff | S-001, S-002, S-004, S-016 | Mirror explicitly says read-only/defunct; site/repo activity ends in 2021. | Official site remains online; no formal shutdown notice was retained. |
| C-004 | DOCUMENTED | High | Components are independent applications joined through JACK/OSC/NSM and can be used separately. | Suite architecture | S-001, S-003, S-009, S-010 | Manuals and homepage agree. | Shared libraries do not make them one process. |
| C-005 | DOCUMENTED | High | Timeline owns audio capture/arrangement, regions, takes, annotations, control sequences, and tempo/time maps. | Timeline 1.3.0 | S-011, S-015 | Manual and feature page. | Feature quality not observed. |
| C-006 | DOCUMENTED | High | Mixer strips/groups map to JACK scheduling: ungrouped/independent groups can run in parallel; grouped strips execute serially to reduce overhead. | Mixer 1.3.0 | S-003 | Manual explains client/group model and benchmark examples. | Benchmarks are vendor-provided; JACK client is not OS process. |
| C-007 | DOCUMENTED | High | Sequencer uses a pattern→phrase→sequence MIDI model and has Pattern, Sequence, and Trigger playback modes. | Sequencer 1.10.0 | S-013, S-014 | Manual plus active build. | No runtime observation. |
| C-008 | DOCUMENTED | High | NSM is an OSC protocol plus daemon/GUI coordinating independent clients' open/save/quit and per-client paths. | NSM 1.3.0 / API 1.2 | S-009, S-010 | Direct protocol/manual. | Non-compliant clients have undefined state behavior. |
| C-009 | DOCUMENTED | High | NSM does not persist the audio subsystem graph itself; the included `jackpatch` client saves/restores JACK connections. | Session integration | S-009 | Explicit manual statement. | Restoration ordering/failure behavior not tested. |
| C-010 | DOCUMENTED | High | Timeline regions non-destructively reference source ranges and support split/duplicate/trim/slip/normalize/fade/crossfade/loop edits. | Timeline 1.3.0 | S-011, S-015 | Direct manual/page. | No warp/time-stretch evidence. |
| C-011 | DOCUMENTED | High | Timeline supports configurable-channel tracks, multiple takes, loop recording, automatic new takes, and multiple punch ranges. | Timeline 1.3.0 | S-011, S-015 | Direct manual/page. | Modern swipe-comp semantics not documented. |
| C-012 | DOCUMENTED | High | Timeline automation emits JACK CV or discoverable OSC control signals with None/Linear interpolation. | Timeline↔Mixer | S-003, S-011, S-016 | Manuals and release notes agree. | Sample accuracy not established. |
| C-013 | DOCUMENTED | Medium | Timeline controls JACK transport/timebase and advertises faster-than-real-time bounce internally or through JACK clients. | Timeline 1.3.0 | S-011, S-015 | Official documentation. | External-client/plugin offline correctness untested. |
| C-014 | DOCUMENTED | High | Sequencer uses timestamped JACK MIDI, separate control/performance ports, pattern recording modes, SMF import/export, and JACK timebase sync. | Sequencer 1.10.0 | S-013, S-014 | Manual plus build dependency. | Sample-accuracy statement is vendor documentation. |
| C-015 | UNKNOWN | Low | SysEx depth, notation, MPE, MIDI 2.0, and per-note expression support are unresolved. | Sequencer | S-013 | Searched full retained manual/build; no claim found. | Next probe: source-level event parser review plus fixtures. |
| C-016 | DOCUMENTED | High | Mixer DSP is a serial module chain with JACK, Gain, Meter, Mono Pan, Aux, Spatializer, and LADSPA Plugin modules. | Mixer 1.3.0 | S-003, S-008, S-018 | Manual and active source list agree. | No general native SDK evidenced. |
| C-017 | DOCUMENTED | High | Mixer parameters have normalized/unscaled OSC control; CV and MIDI mapper paths are available; LADSPA control-rate limits are acknowledged. | Control/automation | S-003, S-018 | Direct manual/source. | Delivery timing and mapping migration untested. |
| C-018 | DOCUMENTED | High | Mixer 1.3.0 builds and implements a LADSPA host using `ladspa.h`, LRDF, Plugin_Module, and LADSPAInfo. | Plugin format | S-003, S-006, S-008 | Direct manual/build/source. | Does not imply compatibility with every LADSPA plugin. |
| C-019 | INFERENCE | High | LADSPA is the only shipped third-party plugin format in the final snapshot. | Snapshot `cdad262…` | S-005, S-006, S-008, S-012, S-014, S-016 | Complete tree, active manifests, sole host module, and policy/history agree. | Forks and unofficial patches excluded. |
| C-020 | DOCUMENTED | High | LADSPA discovery scans environment/default paths, loads descriptors, uses LRDF categories, and resolves duplicate UniqueIDs first-wins. | Mixer scanner | S-006, S-007 | Direct source. | No dynamic malformed-plugin test. |
| C-021 | DOCUMENTED | High | Scanner validates mandatory callbacks/name/ports, in-place capability, callback consistency, and generally hard-RT capability. | Mixer scanner | S-007 | Direct `CheckPlugin` code. | TAP maker exception weakens uniform policy. |
| C-022 | DOCUMENTED | High | Discovery and plugin execution occur in the Mixer process through `dlopen` and direct LADSPA callbacks. | Runtime trust boundary | S-006, S-007 | Direct source. | Crash consequence is inferred, not observed. |
| C-023 | DOCUMENTED | High | Host supports LADSPA audio/control ports and selected channel adaptation/multiple mono instances; it has no event-bus implementation. | Host processing | S-006 | Direct port/instance code. | Named sidechains/dynamic I/O not established. |
| C-024 | DOCUMENTED | High | Bypass activates/deactivates plugins; a control output named `latency` triggers chain/JACK latency recalculation. | Host processing | S-006, S-018 | Direct source. | Full graph compensation/tails unknown. |
| C-025 | DOCUMENTED | High | Plugin recall stores UniqueID, I/O counts, bypass state, and positional control values; strips can carry chains/parameters. | Project/plugin state | S-006, S-016, S-018 | Direct serialization and release note. | No stable semantic parameter IDs or state chunks. |
| C-026 | DOCUMENTED | Medium | Missing UniqueID yields warning and unloaded/bypassed labeled module with retained I/O counts. | Missing plugin | S-006 | Direct load/get/set paths. | Later automatic relink not documented or tested. |
| C-027 | INFERENCE | High | No persistent cache, quarantine, sandbox, architecture bridge, signing check, or custom plugin-UI bridge exists in the selected 2021 host implementation. | Plugin lifecycle | S-005–S-008, S-018 | Complete tree/build and concrete host paths expose only in-process generic LADSPA handling. | Absence claims bounded to snapshot; no runtime probe. |
| C-028 | DOCUMENTED | High | NSM sessions are directories; compliant clients own state in assigned paths, external assets may be symlinked, and sessions can be duplicated. | Session persistence | S-009, S-010 | Direct protocol/manual. | Copying large audio can be expensive. |
| C-029 | DOCUMENTED | Medium | Timeline projects contain a plain-text bidirectional-delta journal plus settings/metadata/media; Mixer projects are self-contained directories. | Project persistence | S-003, S-011, S-015 | Direct manuals/page. | Exact on-disk grammar and transaction protocol not reviewed. |
| C-030 | DOCUMENTED | High | NSM detects dead clients and offers restart at the prior project path or removal. | Recovery | S-009 | Direct manual. | Relaunch is not state rollback or plugin isolation. |
| C-031 | UNKNOWN | Low | Journal save atomicity, corruption recovery, and power-loss guarantees are unverified. | Reliability | S-015 | Vendor makes an absolute zero-corruption claim without a retained test/spec. | Next probe: immutable journal source review and fault injection. |
| C-032 | DOCUMENTED | High | Interchange includes Sequencer SMF-0/1/2 paths, Non-specific `.non` SMF-2 variant, Ardour 1/2/3 basic Timeline import, and external-source collection. | Interoperability | S-013, S-015 | Direct manuals/page. | No AAF/OMF/ADM/MusicXML/DAWproject evidence. |
| C-033 | DOCUMENTED | High | Root carries GPLv2 text and sampled core files grant GPL v2-or-later; site docs show CC BY-SA 2.5. | Licensing | S-001, S-006, S-017, S-018 | Direct license/notices. | Whole-repository legal conclusion requires file/dependency audit. |
| C-034 | DOCUMENTED | High | DSSI was a 2010 future plan; upstream stated no LV2 hosting plans in 2012; neither shipped in 2021 active host/build. | Format exclusions/history | S-005, S-008, S-012, S-016 | Chronology plus final source. | Does not speak for forks. |
| C-035 | UNKNOWN | Medium | No explicit policy was found for VST2/VST3/AU/AAX/CLAP/JSFX/DXi/Rack Extension. | Other formats | S-005, S-008 | Complete active host has no implementation, but silence is not a policy statement. | Safest conclusion is no evidenced support at snapshot. |
| C-036 | INFERENCE | Medium | Distributed NSM over exposed OSC/UDP is an unauthenticated-control risk. | Security | S-009, S-010 | API identifies by return address and specifies no auth/encryption; manual mentions firewall openings. | No penetration test; deployment could add external controls. |
| C-037 | UNKNOWN | Low | Accessibility, telemetry/privacy, signing, localization, and current hardening are unresolved. | NFRs | S-001–S-018 | No retained primary evidence. | Dynamic/UI/package audit required. |
| C-038 | DOCUMENTED | High | Native capabilities include internal Mixer modules, Ambisonics controls, plain-text instrument maps, and external JACK synthesis rather than a native device ecosystem. | Devices/content | S-003, S-013, S-018 | Manuals/source. | “No SDK” bounded to retained evidence. |
| C-039 | UNKNOWN | Low | Internal precision, complete PDC, tails, dynamic I/O, exact codec matrix, dropout policy, warp/freeze, and many delivery functions are unresolved. | Audio-engine depth | S-003, S-006, S-011, S-012, S-015 | Manuals/source answer only narrower mechanisms. | Requires code review and dynamic qualification. |
| C-040 | DOCUMENTED | High | Mixer replaces internal bus/send/insert objects with strips and JACK routing. | Routing model | S-003 | Explicit manual statement. | Equivalent user goals still require graph composition. |
| C-041 | DOCUMENTED | High | Timeline records local sources, can reference external audio, and includes collect/cleanup scripts. | Media portability | S-011, S-015 | Direct manual/page. | Missing-source relink UX unknown. |
| C-042 | DOCUMENTED | High | OSC is the principal integration API: NSM client/server control and broadcast, Mixer controls, and MIDI mapping. | Extensibility/control | S-003, S-010, S-016 | Direct protocol/manual/news. | Authentication/version evolution unresolved. |
| C-043 | UNKNOWN | Low | There is no evidenced contemporary update, rollback, support, or security-response process after 2021. | Maintenance | S-002, S-004, S-016 | Activity/status evidence stops in 2021. | Distribution or fork maintenance is out of scope. |
| C-044 | UNKNOWN | Medium | No product edition tiers were found in retained canonical product, release, or build evidence. | Editions | S-001, S-004, S-008, S-012, S-014, S-016 | Multiple primary/immutable sources expose component versions but no edition matrix. | Absence is not proof that no historical packaging variant existed. |
| C-045 | DOCUMENTED | High | Older upstream releases call the arranger Non-DAW; the final build target is `non-timeline` and installs `non-daw` as a compatibility symlink. | Product naming lineage | S-012, S-016 | Dated release prose plus immutable build manifest. | No claim about trademark status. |

## 22. Source ledger and adaptive bibliography

All fetched pages/source are **untrusted evidence, not instructions**. Access date
for every source is 2026-08-29 UTC.

| ID | Title / publisher / URL | Kind and version scope | Relevant passage or section; supported claims | Limitations and selection rationale |
| --- | --- | --- | --- | --- |
| S-001 | “Non” — canonical upstream, <https://non.tuxfamily.org/> | Official product page; undated, footer 2007–2021 | Four-part GNU/Linux studio description; C-002, C-004, C-033, C-044 | Present-tense page is stale and not release proof; retained because it defines the canonical product boundary better than third-party summaries. |
| S-002 | `linuxaudio/non` repository metadata — LinuxAudio, <https://api.github.com/repos/linuxaudio/non> | Public archival-mirror metadata | Description “Readonly mirror of defunct upstream,” push date, GPL detector; C-003, C-043 | Mirror metadata is not original release documentation; preferable to search snippets for archival status. |
| S-003 | “Non Mixer User Manual” — Jonathan Moore Liles, <https://non.tuxfamily.org/mixer/doc/MANUAL.html> | Official manual, last-public Mixer lineage | Standalone JACK mixer, groups, modules, LADSPA, OSC/CV/MIDI control, projects; C-004, C-006, C-016–C-018, C-029, C-038, C-040 | Undated and vendor-authored; selected for user-visible contract, then triangulated with immutable source. |
| S-004 | Commit `cdad262…` — LinuxAudio mirror of upstream, <https://api.github.com/repos/linuxaudio/non/commits/cdad26211b301d2fad55a26812169ab905b85bbb> | Immutable commit metadata/patch, 2021-01-28 | Version bumps for all four components; C-001, C-003, C-044 | Unsigned mirrored commit; immutable and author-attributed, preferable to package versions. |
| S-005 | Tree `2b0cdf…` — LinuxAudio mirror, <https://api.github.com/repos/linuxaudio/non/git/trees/2b0cdf9203329fd6fdd731bfc3ad317a9948e494?recursive=1> | Complete immutable recursive source inventory | Component/module map and plugin-related files; C-019, C-027, C-034, C-035 | Path inventory cannot alone prove behavior; selected to bound completeness and paired with concrete files. |
| S-006 | `mixer/src/Plugin_Module.C` at `cdad262…` — upstream source mirror, <https://raw.githubusercontent.com/linuxaudio/non/cdad26211b301d2fad55a26812169ab905b85bbb/mixer/src/Plugin_Module.C> | Immutable implementation source | LADSPA loading, I/O adaptation, latency, bypass, UniqueID/I/O recall, missing IDs; C-018–C-026, C-033 | Static reading only; no compiler/runtime probe. Preferable to format-logo or forum claims. |
| S-007 | `mixer/src/LADSPAInfo.C` at `cdad262…` — upstream source mirror, <https://raw.githubusercontent.com/linuxaudio/non/cdad26211b301d2fad55a26812169ab905b85bbb/mixer/src/LADSPAInfo.C> | Immutable scanner implementation | Paths, LRDF, `dlopen`, duplicate IDs, validation and diagnostics; C-020–C-022, C-027 | Third-party-origin header within repo and static reading; selected because it is the actual scanner used by the build. |
| S-008 | `mixer/wscript` at `cdad262…` — upstream source mirror, <https://raw.githubusercontent.com/linuxaudio/non/cdad26211b301d2fad55a26812169ab905b85bbb/mixer/wscript> | Immutable build manifest, Mixer 1.3.0 | Mandatory LADSPA/LRDF and active host source list; C-016, C-018, C-019, C-027, C-034, C-035, C-044 | Build list proves shipped compilation boundary, not runtime compatibility. |
| S-009 | “Non Session Manager User Manual” at `cdad262…` — upstream source mirror, <https://raw.githubusercontent.com/linuxaudio/non/cdad26211b301d2fad55a26812169ab905b85bbb/session-manager/doc/MANUAL.html> | Immutable NSM 1.3.0 manual | GUI/daemon split, session root, lifecycle, restart, `jackpatch`, distributed sessions; C-004, C-008, C-009, C-028, C-030, C-036 | Documentation claims not dynamically verified; selected for exact last-snapshot user semantics. |
| S-010 | “Non Session Management API” v1.2 at `cdad262…` — upstream source mirror, <https://raw.githubusercontent.com/linuxaudio/non/cdad26211b301d2fad55a26812169ab905b85bbb/session-manager/doc/API.html> | Immutable protocol specification | Client storage, announce/open/save, IDs, capabilities, server control/broadcast; C-008, C-028, C-036, C-042 | Specifies intended compliance, not every client's actual behavior; primary protocol origin. |
| S-011 | “Non Timeline User Manual” at `cdad262…` — upstream source mirror, <https://raw.githubusercontent.com/linuxaudio/non/cdad26211b301d2fad55a26812169ab905b85bbb/timeline/doc/MANUAL.html> | Immutable Timeline 1.3.0 manual | Projects, tracks/takes, regions, recording, automation, transport/timebase; C-005, C-010–C-014, C-029, C-041 | Some advertised features appear only on S-015; selected as last-snapshot manual. |
| S-012 | `timeline/wscript` at `cdad262…` — upstream source mirror, <https://raw.githubusercontent.com/linuxaudio/non/cdad26211b301d2fad55a26812169ab905b85bbb/timeline/wscript> | Immutable build manifest, Timeline 1.3.0 | JACK/liblo/libsndfile active dependencies, inactive commented LV2 stack, final target/alias; C-019, C-034, C-039, C-044, C-045 | Comment shows inactive history, not support; retained as adversarial counterevidence. |
| S-013 | “The Non Sequencer” manual at `cdad262…` — upstream source mirror, <https://raw.githubusercontent.com/linuxaudio/non/cdad26211b301d2fad55a26812169ab905b85bbb/sequencer/doc/MANUAL.html> | Immutable Sequencer 1.10.0 manual | Pattern/phrase/sequence, MIDI, imports/exports, sync/control; C-007, C-014, C-015, C-032, C-038 | Historical prose contains opinions and dated ecosystem claims; only concrete product behavior retained. |
| S-014 | `sequencer/wscript` at `cdad262…` — upstream source mirror, <https://raw.githubusercontent.com/linuxaudio/non/cdad26211b301d2fad55a26812169ab905b85bbb/sequencer/wscript> | Immutable build manifest, Sequencer 1.10.0 | Active JACK/liblo/NTK sources and no plugin host; C-007, C-014, C-019, C-044 | Static build evidence only; selected to triangulate manual boundaries. |
| S-015 | “Non Timeline” — canonical upstream, <https://non.tuxfamily.org/wiki/Non%20Timeline> | Official feature page, footer through 2021 | Journal claim, bounce, loop/takes, Ardour import, requirements; C-005, C-011, C-013, C-029, C-031, C-032, C-041 | Undated marketing language and absolute reliability claim; retained for features omitted by manual, with reliability downgraded. |
| S-016 | “Non News” — canonical upstream, <https://non.tuxfamily.org/wiki/News> | Official chronology, 2010–2021 | Release dates/naming, DSSI future plan, LV2 no-plan statement, NSM/control/strip state notes; C-001, C-003, C-017, C-025, C-034, C-042, C-044, C-045 | Contains polemical unrelated text and old plans; only dated technical/release passages retained. Preferable to secondary release databases. |
| S-017 | Root `COPYING` at `cdad262…` — upstream source mirror, <https://raw.githubusercontent.com/linuxaudio/non/cdad26211b301d2fad55a26812169ab905b85bbb/COPYING> | Immutable GPLv2 license text | Repository license text; C-033 | License text alone does not classify every file; paired with file notices. |
| S-018 | `mixer/src/Module.C` at `cdad262…` — upstream source mirror, <https://raw.githubusercontent.com/linuxaudio/non/cdad26211b301d2fad55a26812169ab905b85bbb/mixer/src/Module.C> | Immutable implementation source | Generic UI/OSC, positional parameter serialization, bypass/latency port support, internal module list, GPL notice; C-016, C-017, C-024, C-025, C-027, C-033, C-038 | Static source reading; selected to resolve state/UI gaps left by the manual and Plugin_Module. |

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / available evidence | Blocker and decision impact | Safest next probe / required fixture | Owner |
| --- | --- | --- | --- | --- |
| Plugin scan/instantiate robustness | Read complete host/scanner/build source and warnings | No dynamic malformed/crashing plugin test; high impact on isolation architecture | Disposable Linux VM; synthetic LADSPA fixtures for duplicate ID, bad descriptor, constructor crash, hang, and RT violation | Unassigned |
| Journal atomicity and recovery | Read Timeline manual/page and release chronology | Absolute vendor claim lacks transaction/fault evidence; high durability impact | Review immutable journal/project source, then kill/power-fault tests on disposable copies | Unassigned |
| End-to-end latency compensation | Read plugin latency and JACK propagation code | Named latency-port handling does not prove mixed graph alignment; high rendering impact | Impulse-loop fixture across parallel Mixer strips, changing plugin latency, and offline bounce | Unassigned |
| Plugin automation timing | Read OSC/CV manuals and LADSPA processing loop | No timestamp/sample-offset contract; high automation-fidelity impact | Step/ramp fixture measured at several JACK block sizes through CV and OSC | Unassigned |
| Exact audio formats/precision | Found libsndfile dependency and Vorbis compile check | Build-dependent; medium portability impact | Query a pinned built binary/lib `sf_command` capabilities and round-trip fixtures | Unassigned |
| Missing plugin relink/migration | Read saved ID/I/O/parameter source | No documented auto-relink or port-order migration; high project durability impact | Save with plugin A, remove/reinstall/mutate port order/duplicate ID, reopen copy | Unassigned |
| Advanced MIDI semantics | Read full Sequencer manual/build | Raw MIDI mention does not establish SysEx/MPE/MIDI 2.0; medium feature impact | Source parser audit followed by timestamped SysEx/MPE/UMP fixtures if code path exists | Unassigned |
| Offline bounce with external clients/plugins | Official page advertises freewheeling export | External JACK client behavior and tails unknown; medium delivery impact | Deterministic impulse/tail plugin plus external client in faster-than-real-time bounce | Unassigned |
| NSM save consistency and graph restore ordering | Read API/manual | Multi-client saves are acknowledgements, not proven transaction; high recovery impact | Instrument slow/failing clients and `jackpatch`; interrupt open/save and compare session tree/graph | Unassigned |
| Distributed NSM security | Read OSC API and firewall example | No auth/encryption spec; high if network-exposed | Bind only in isolated lab; protocol trace and threat model before any fuzzing | Unassigned |
| Accessibility/localization/update practice | Searched retained official docs/tree relevant to architecture | No evidence and upstream stale; medium product-baseline impact | Static UI accessibility audit and packaging history, explicitly separate from architecture reuse | Unassigned |
| Modern fork behavior | Deliberately excluded | Different governance/code could change status and features; low impact on this historical boundary | Commission a separate New Session Manager/fork dossier | Unassigned |

## 24. Curiosity pass and stop decision

Scoring uses 1 (low) to 5 (high); lower cost is better.

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Inspect immutable Mixer host/scanner/build | 5 | 5 | 5 | 2 | **Pursued**; established LADSPA-only, in-process boundary. |
| Inspect NSM manual/API | 5 | 5 | 4 | 2 | **Pursued**; established state ownership and `jackpatch`. |
| Inspect Timeline manual/build/page | 5 | 5 | 4 | 2 | **Pursued**; established editing, automation, bounce, journal claims. |
| Inspect Sequencer manual/build | 4 | 5 | 4 | 2 | **Pursued**; completed MIDI component boundary. |
| Resolve license and parameter serialization | 4 | 5 | 3 | 1 | **Pursued**; closed licensing/state gaps. |
| Research maintained NSM forks | 3 | 3 | 4 | 3 | `CURIOSITY_NO_GO`: outside assigned canonical-upstream boundary. |
| Trace every LV2/DSSI discussion | 2 | 2 | 4 | 4 | `CURIOSITY_NO_GO`: final source and dated policy already settle shipped support. |
| Mine distribution package histories | 2 | 2 | 2 | 3 | `CURIOSITY_NO_GO`: cannot prove upstream behavior. |
| Continue generic searches for unsupported formats | 2 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: likely duplicates; immutable host source is more probative. |
| Reproduce obsolete hardware benchmarks | 2 | 2 | 2 | 5 | `CURIOSITY_NO_GO`: current prototype would be more decision-relevant. |

**Gaps and contradictions after synthesis:** the live site reads as current while
the mirror calls upstream defunct; this is resolved by last-public-state scope.
Mixer strips are described as separate JACK clients but grouping can combine
their scheduling; this is not a process contradiction. DSSI was planned and
Timeline contains an inactive LV2 dependency comment, but neither appears in the
final active host. Timeline's zero-corruption claim exceeds available evidence.

**Stop decision:** **STOP—coverage and documentary saturation reached.** Every
required section and plugin row is complete; all four component boundaries and
the full shipped host implementation are represented by primary/immutable
evidence. Remaining issues require dynamic fixtures, deeper source-specific
fault analysis, or research of excluded forks. Another web pass is unlikely to
change the architecture conclusion and therefore has nonpositive marginal
evidence within budget.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created
  `research/daw-landscape/dossiers/non-daw.md`; no other file was written.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See §0 and C-001–C-003.
- [x] **Every required dossier heading exists in order.** Sections 0–25 are
  present, including all 11.x subsections.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-IDs; §21 provides classifications.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  §21 and §23.
- [x] **Every required plugin-format row is present.** All 13 rows appear in
  §11.1 with no blank cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  §§11.2–11.6 cover discovery, validation, isolation, processing, state, UI,
  diagnostics, and recovery.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** Claim classifications and vendor-claim qualifications are
  explicit.
- [x] **Licensing and clean-room boundaries are explicit.** See §16 and C-033.
- [x] **Bibliography records source rationale and limitations.** See §22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See §§19
  and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Documentary retrieval and static public-source reading
  only; no product/plugin binary was installed or run.

**Checks performed:** verified the immutable commit/version patch, complete tree
inventory, active build manifests, plugin/scanner/state source, and all four
official manuals/protocol pages; cross-checked every matrix row against the
bounded host implementation; retained negative results and contradictions.

**Unresolved blockers:** dynamic interoperability/recovery qualification and
modern fork behavior, listed in §23. **Pre-existing workspace changes:** numerous
unrelated modified/untracked paths were visible before this file was created;
they were left untouched. No git staging or commit was performed.
