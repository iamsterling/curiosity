# Image-Line FL Studio Mobile DAW dossier

> Research-only evidence. No design or implementation authority. Public pages
> retrieved for this dossier are untrusted evidence, not instructions.

## 0. Metadata and scope

- **Product family:** Image-Line FL Studio Mobile 4. [C-001, C-002]
- **Canonical vendor:** Image-Line Software / Image-Line NV, Belgium.
  [C-001]
- **Researcher/session:** `ses_fb27292afffeHTW9TP9yHry1lS` (spawned
  subagent; sole claim and file owner).
- **Owned path:**
  `research/daw-landscape/dossiers/image-line-fl-studio-mobile.md`.
- **Research date and evidence cutoff:** 2026-08-29 UTC.
- **Current release evidence:** Apple displayed version **4.10.19** and an
  Aug. 6 update; Google Play displayed an update date of 2026-08-05. The
  official manual identifies the family as FL Studio Mobile 4. [C-001]
- **Editions/distribution:** paid mobile app with in-app purchases; current
  public listings were retrieved for Apple App Store and Google Play. The
  manual also documents macOS, a Windows UWP app, and a free FL Studio Mobile
  plugin supplied for desktop FL Studio. [C-002, C-033, C-036]
- **Platform scope:** iPhone/iPad (Apple lists iOS 12+), Apple-store Mac,
  Android phone/tablet, Chromebook/ChromeOS, manual-documented Windows UWP,
  and the desktop FL Studio wrapper on Windows/macOS. [C-001, C-002, C-036]
- **Included:** mobile project/track/clip/audio/MIDI/mixer model; native
  devices and content; iOS IAA/Audiobus; every required plugin-format row;
  files/cloud/project transfer; and desktop interoperability only where FL
  Studio Mobile runs as a desktop FL Studio native plugin or exchanges data.
- **Excluded:** desktop FL Studio's own DAW architecture, native devices,
  edition matrix, and VST/AU host behavior except as the outer host of the FL
  Studio Mobile wrapper; binary execution; installation; decompilation;
  authenticated forum content; and private implementation detail.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. The user-visible architecture is
  well covered; active Windows distribution, AUv3/general third-party plugin
  hosting, engine internals, plugin delay compensation, and project
  serialization internals remain explicit unknowns. [C-012, C-020, C-021,
  C-028, C-032, C-036]

## 1. Executive summary

FL Studio Mobile is a touch-first, linear multitrack environment in which Note,
Audio, and Automation clips are arranged in a Playlist. Each Playlist track
maps to a Channel Rack; instrument racks can interleave multiple instruments
and serial effects, while Audio and FX racks contain effects only. The mixer is
a one-channel-per-Playlist-track view rather than a separately authored graph.
[C-003, C-004, C-006]

Routing is constrained but not trivial: racks default to Master, can send in
parallel to multiple FX channels, and FX channels can be chained. The manual
does not establish feedback routing, graph-cycle policy, a true external
sidechain bus, surround, or dynamic channel layouts. Autoduck is described as
creating a *sidechain-style* result, not as accepting a detector input.
[C-007, C-008]

The documented third-party boundary is narrow. On iOS, an IAA/Audiobus rack
module discovers compatible apps, exchanges audio and MIDI, and opens the
external app UI. The reviewed current product page, store listings, full manual
index, Rack page, and iOS inter-app page do not name AUv3 or any desktop plugin
format as a format hosted *inside* FL Studio Mobile. Contractually that absence
is not proof of non-support: AUv3, VST2/3, AUv2, AAX, CLAP, LV2, LADSPA, DSSI,
JSFX, DirectX/DXi, and Rack Extension hosting are all recorded as `UNKNOWN`,
not silently marked unsupported. [C-019, C-020, C-021, C-022, C-023]

Desktop interoperability uses encapsulation. Since Mobile 3, the manual says a
mobile project loads inside the free FL Studio Mobile native plugin, which
slaves to the desktop host tempo/Playlist and can expose each mobile rack to a
desktop Mixer track. The current marketing page, however, advertises `.flp`
export, while the wrapper manual says Mobile 3+ projects are not directly
desktop-compatible and describes `.flm` round trips. Direct-edit fidelity is
therefore unresolved and needs a version-matched probe. [C-024, C-025]

Other architecture-relevant strengths are measured recording-latency
alignment, explicit buffer-health/underrun diagnostics, typed clip editors,
native rack presets, cloud conflict resolution with keep-both, and same-network
transfer of the complete user-file set. Liabilities are weakly documented
dependency recall, no established modern in-app plugin format, ambiguous
current Windows availability, and proprietary engine/project internals.
[C-010, C-011, C-026, C-027, C-028, C-035, C-039]

**Confidence:** high for the user-visible Mobile 4 workflow, rack/routing model,
IAA/Audiobus behavior, and file-transfer rules; medium for current
cross-platform packaging because official surfaces disagree; low/unknown for
internal scheduling, delay compensation, plugin isolation/state, and direct
`.flp` semantics.

## 2. Product identity, history, and market position

Image-Line describes FL Studio Mobile as a complete music-production
environment for recording, sequencing, editing, mixing, and rendering songs on
mobile devices. The current public product page positions it for on-the-go beat
making and song finishing, and Google Play advertises Lifetime Free Updates.
The 2026-08 store activity establishes that the family is maintained.
[C-001, C-033]

The current marketing page names iPhone/iPad and Android/Chromebook. The
current Apple listing additionally offers Mac compatibility. The Mobile 4
manual names Android/ChromeOS, iOS, macOS, Windows UWP, and the desktop FL
Studio plugin. Because the known Microsoft Store page yielded no readable
metadata and Image-Line's current marketing page omits Windows, this dossier
does not claim that the UWP edition is currently purchasable or version-parity
tested. [C-002, C-036]

There is one mobile product identity rather than a documented feature-tier
edition family, but distribution purchases and optional content are
store-mediated. Current sources disagree on some native-device entitlements:
the overview says all instruments are included, an older Rack passage labels
GMS and Transistor Bass additional purchases, and the current stores/product
page advertise eight instruments. This dossier does not normalize those
differences into an invented edition matrix. [C-017, C-033]

Relevant lineage is bounded to two interoperability changes: FL Studio Mobile
3+ uses the desktop FL Studio Mobile wrapper according to the manual, and the
current manual labels the product Mobile 4. Earlier mobile generations and
desktop FL Studio architecture are outside scope. [C-001, C-024]

## 3. Workflow and conceptual model

The project is a song arranged on a linear Playlist. Its primary visible media
objects are Note clips, Audio clips, and Automation clips. Selecting a clip
dispatches to the Piano roll, Step Sequencer, Automation editor, or Wave editor
as appropriate. Tracks/channels can have sub-tracks, and Drum channels can mix
step-sequencer and note-style sub-tracks. [C-003, C-005]

Each Playlist track has an associated Channel Rack. Instrument tracks can hold
multiple instruments and effects; Audio and FX tracks accept effects. Modules
run top-to-bottom, so an instrument inserted later in a rack enters the signal
chain below earlier effects. Note ranges can split instruments into a
multitimbral rack. [C-004]

This is best characterized as a mobile linear arranger with pattern/note and
step-sequencing affordances, not a scene launcher, tracker, notation system, or
free-form modular patcher. That characterization is an inference from the
documented Playlist/Rack objects; an alternative is to call it a pattern-based
DAW because note clips and step tracks recur. [C-003, C-008]

Touch is the primary interaction model (tap, long-tap, drag); keyboard/mouse
and configurable scaling are documented on larger screens. Virtual piano,
drumpads, scale-locked, chord, and strum controllers support performance and
composition. [C-035]

## 4. Publicly documented architecture

Public documentation exposes a user-visible graph: Playlist track → Channel
Rack → ordered native modules → one or more FX sends → Master, with a mirrored
Mixer channel. It also exposes platform audio modes, short playback buffers,
multicore and low-latency switches, and per-project/native preset persistence.
[C-004, C-006, C-007, C-010, C-039]

The desktop bridge is an explicit host boundary: the mobile environment runs
as a native FL Studio plugin, syncs its transport/tempo to desktop FL Studio,
and can route individual mobile tracks to desktop Mixer tracks. [C-024]

The following remain **UNKNOWN** because no public implementation source or
engineering specification was found: process/thread layout; realtime graph
rebuild rules; worker scheduling; lock/alloc policy; internal sample format;
project schema; graph persistence; crash journal; plugin process isolation;
and service/module boundaries. The visible rack is not treated as proof of an
internal class or scheduler design. [C-032]

## 5. Audio engine

Android exposes Fast, Safe, Ultrasafe, and Native audio modes; Native uses
Android Oboe and is recommended by the manual for Android 9+. Windows exposes
Standard and Multitrack modes, with Multitrack enabling selection of multiple
inputs. Low-latency mode applies to Android Native and Windows Multitrack.
Multicore processing can improve or worsen glitches depending on hardware.
[C-010]

The diagnostics model is unusually concrete for a mobile product. The manual
describes approximately 5–20 ms buffers, utilization as time-to-fill relative
to buffer duration, a 100% peak warning, and an underrun counter. Audible
failure is documented as gaps, stutter, crackle, or glitches. [C-010, C-038]

Recording-latency compensation measures output-to-input round-trip delay with a
beep, then removes an equivalent slice from the beginning of recordings so
performed audio aligns to the Playlist. The manual says typical mobile device
delay is 40–200 ms and says calibration is unnecessary on iOS. This is
record-placement compensation, not evidence of plugin delay compensation.
[C-011, C-012]

Users can choose 16-bit WAV or, where the OS permits, 32-bit floating-point WAV
for recording/rendering. The reviewed corpus does not document selectable
sample rates, engine precision, oversampling, plugin latency/tail reporting,
look-ahead compensation, offline-vs-realtime scheduling, deterministic render,
or dropout recovery beyond settings/troubleshooting. [C-009, C-012]

Track-to-audio conversion is a manual freeze-like workflow: solo a Playlist
track, render lossless WAV, load that render on an Audio track, and use it to
reduce CPU. No reversible freeze object or automatic dependency restore is
documented. [C-029, C-035]

## 6. Tracks, timeline, clips, and editing

Documented channel/track kinds are Instrument, Audio, FX/AUX, Drum Sequencer,
and Audio Record, with Note, Audio, Pattern/step, and Automation clip content.
There is one Mixer channel per Playlist track. [C-003, C-004, C-006]

Clip operations include copy, cut, delete, combine, mute/unmute, snap,
resize-and-loop, and Audio-clip time stretch. `SYNC` keeps pitch constant while
tempo or clip length changes; without it, pitch follows length. Timeline
selections support insert space, duplicate, delete, delete space/ripple-left,
and trim to selection. [C-005]

The documentation does not establish take lanes, playlists/alternates,
comping, clip groups, track folders, linked clips, non-destructive source-edit
graphs, arbitrary warp markers, meter changes, or a persistent edit-history
model. Absence from the reviewed pages is not proof these features do not
exist; they remain unknown where decision-relevant. [C-037]

## 7. MIDI, sequencing, notation, and expression

FL Studio Mobile has a Piano roll, step sequencer, live note capture, velocity
editing/performance, MIDI file import/export at channel or project level, and
class-compliant wired/wireless controllers. A selected external MIDI device
plays the instrument in the selected Playlist track; Bluetooth MIDI discovery
is documented, including Android's location permission requirement. [C-015]

The project key/scale can constrain virtual keyboards, Piano roll, and MIDI
controller input. Chord and strum keyboards generate multi-note performances.
Native Note Echo, Randomizer, Scale, and Transpose modules process note data
before instruments. [C-017, C-035]

IAA can send MIDI note/control data to an external iOS app on a selected MIDI
channel. [C-019, C-022]

Notation/score editing, MPE/per-note expression, MIDI 2.0/UMP, SysEx, MIDI
Clock, MTC, MMC, polyphonic aftertouch, and sample-accurate event delivery were
not established by the reviewed sources and remain `UNKNOWN`. [C-016]

## 8. Routing, mixer, automation, and control

All Channel Racks route to the Master FX track by default. A rack may add one or
more sends to FX channels; multiple sends are parallel, and an FX channel can
send to another FX channel to create a serial subgroup chain. FX channels are
audio-only and host effect modules. In the desktop wrapper, rack outputs can be
sent to desktop FL Studio Mixer tracks. [C-007]

The Main Mixer mirrors Playlist order and provides a fader, stereo pan,
mute/activate, solo, and track selection for every Playlist track. Per-module
controls include wet pan, mix, and post-gain. [C-006, C-039]

Autoduck is documented as creating “sidechain style” ducking. No source
documents a routable detector bus, third-party sidechain pin, multiple input
buses, feedback path, or cycle rule; those capabilities are not inferred.
[C-008]

Most movable controls (knobs, sliders, most switches) can become an Automation
track through a tweak → CTRL → Add automation track workflow, and automation
can be recorded or drawn. Stable parameter identifiers, units/text conversion,
sample-accurate evaluation, smoothing, write modes, orphan targets, and
external IAA parameter automation are unknown. [C-013, C-014]

Control surfaces are bounded to class-compliant MIDI, Bluetooth MIDI, virtual
controllers, and CC linking/unlinking. OSC, EuCon, MCU/HUI, scripting remotes,
and a public control API were not documented. [C-015, C-034]

## 9. Recording, comping, and media handling

Audio Record tracks capture the internal microphone or an attached interface.
Where devices expose multiple inputs, a recording source can be selected and
multitrack recording enabled. Input monitoring is switchable, with a headphone
warning to prevent feedback, and count-in/metronome controls are available.
[C-009]

Recordings are WAV (the files page names 16/24/32-bit content support, while
settings expose 16-bit or 32-bit-float creation). WAV and MP3 samples can be
loaded by Drum Sampler, DirectWave, and Audio clips; rendered AAC is for media
playback and does not appear as reusable Playlist audio according to the
manual. [C-018]

Android can migrate the working user-data tree to scoped-storage-accessible or
external locations. iOS uses system import/share associations. Windows UWP
uses a sandboxed LocalState location and imports external files through “Open
with” rather than arbitrary in-app browsing. [C-027, C-031]

There is no documented take-lane/comping workflow, conform, proxy, video, BWF
metadata, or source-relink manager. Missing content in the desktop wrapper is
recognized as a possible outcome, but a relink or placeholder UX is not
specified. [C-027, C-037]

## 10. Instruments, effects, content, and native devices

The current product page/Google listing advertise eight instruments: 3x Osc,
Drums, DirectWave/DW Sampler, GMSynth, MiniSynth, Slicer, SuperSaw, and
Transistor Bass. The manual additionally documents SoundFont Player and names
roughly 30 audio effects plus Note Effects. Architecture-relevant categories
include synthesis, multisample/SF2 playback, slicing, drums, dynamics/EQ,
pitch correction, modulation/delay/reverb, metering, stereo tools, distortion,
and note transformation. [C-017]

Modules form ordered racks and support copy/paste, replacement, reorder,
collapse/expand, keyboard ranges, presets, per-module mix/post-gain, and whole
Rack Presets that can be recalled across projects. Multiple ranged instruments
can make a multitimbral rack. [C-004, C-039]

DirectWave loads `.dwp` programs, SoundFont Player loads SF2 banks, and native
presets use `.flms`/`.flmpst`; these are content/native preset formats, not
evidence of arbitrary executable plugin hosting. Content includes 1,000+
sounds, factory packs, user samples, free/forum material, and store-mediated
expansions. Current sources conflict over whether GMS/Transistor Bass are
additional purchases or included, so exact entitlement is version/store
dependent and unresolved. [C-017, C-018, C-033]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN:no affirmative host statement` means the reviewed current primary
corpus did not establish acceptance, scanning, instantiation, or a complete
host contract. It does **not** mean a format was dynamically proven
unsupported. Linux is not a documented FL Studio Mobile target. [C-002,
C-020, C-021]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | `UNKNOWN:no affirmative host statement` | `UNKNOWN:no affirmative host statement` | `NOT_APPLICABLE:no documented Linux build` | `UNKNOWN:iOS/Android host not documented`; web `NOT_APPLICABLE:no web build` | Mobile 4 corpus; iOS 4.10.19 current listing | No scan/instantiate/contract evidence; desktop FL Studio's own VST support is excluded. | C-021; S-005–S-013 |
| VST3 | `UNKNOWN:no affirmative host statement` | `UNKNOWN:no affirmative host statement` | `NOT_APPLICABLE:no documented Linux build` | `UNKNOWN:iOS/Android host not documented`; web `NOT_APPLICABLE:no web build` | Mobile 4 corpus; iOS 4.10.19 | No VST3-host claim inside FL Studio Mobile. | C-021; S-005–S-013 |
| AUv2 | `UNKNOWN:no affirmative host statement` | `NOT_APPLICABLE:Apple format on Windows product target` | `NOT_APPLICABLE:no documented Linux build` | `UNKNOWN:no AUv2 host statement`; web `NOT_APPLICABLE:no web build` | Apple listing + Mobile 4 manual | Apple-store Mac compatibility does not establish AUv2 hosting. | C-021; S-003, S-006 |
| AUv3 | `UNKNOWN:no affirmative host statement` | `NOT_APPLICABLE:no Windows AUv3 target documented` | `NOT_APPLICABLE:no documented Linux build` | `UNKNOWN:not named by current iOS listing/manual`; Android `NOT_APPLICABLE:Apple extension format`; web `NOT_APPLICABLE:no web build` | iOS 4.10.19; Mobile 4 | Full reviewed corpus names IAA/Audiobus, not AUv3; absence is not proof. | C-020; S-001, S-003, S-005, S-008, S-013 |
| AAX | `UNKNOWN:no affirmative host statement` | `UNKNOWN:no affirmative host statement` | `NOT_APPLICABLE:no documented Linux build` | `UNKNOWN:no mobile host statement`; web `NOT_APPLICABLE:no web build` | Mobile 4 corpus | No AAX host/certification evidence. | C-021; S-005–S-013 |
| CLAP | `UNKNOWN:no affirmative host statement` | `UNKNOWN:no affirmative host statement` | `NOT_APPLICABLE:no documented Linux build` | `UNKNOWN:no mobile host statement`; web `NOT_APPLICABLE:no web build` | Mobile 4 corpus | No discovery/runtime evidence. | C-021; S-005–S-013 |
| LV2 | `UNKNOWN:no affirmative host statement` | `UNKNOWN:no affirmative host statement` | `NOT_APPLICABLE:no documented Linux build` | `UNKNOWN:no mobile host statement`; web `NOT_APPLICABLE:no web build` | Mobile 4 corpus | No discovery/runtime evidence. | C-021; S-005–S-013 |
| LADSPA | `UNKNOWN:no affirmative host statement` | `UNKNOWN:no affirmative host statement` | `NOT_APPLICABLE:no documented Linux build` | `UNKNOWN:no mobile host statement`; web `NOT_APPLICABLE:no web build` | Mobile 4 corpus | No discovery/runtime evidence. | C-021; S-005–S-013 |
| DSSI | `UNKNOWN:no affirmative host statement` | `UNKNOWN:no affirmative host statement` | `NOT_APPLICABLE:no documented Linux build` | `UNKNOWN:no mobile host statement`; web `NOT_APPLICABLE:no web build` | Mobile 4 corpus | No discovery/runtime evidence. | C-021; S-005–S-013 |
| JSFX | `UNKNOWN:no affirmative host statement` | `UNKNOWN:no affirmative host statement` | `NOT_APPLICABLE:no documented Linux build` | `UNKNOWN:no mobile host statement`; web `NOT_APPLICABLE:no web build` | Mobile 4 corpus | No JSFX interpreter/host evidence. | C-021; S-005–S-013 |
| DirectX/DXi | `NOT_APPLICABLE:no macOS DirectX target documented` | `UNKNOWN:no affirmative host statement` | `NOT_APPLICABLE:no documented Linux build` | `UNKNOWN:no mobile host statement`; web `NOT_APPLICABLE:no web build` | Manual-documented Windows UWP, active version unknown | Windows presence alone does not establish DX/DXi hosting. | C-021, C-036; S-006, S-014 |
| Rack Extension | `UNKNOWN:no affirmative host statement` | `UNKNOWN:no affirmative host statement` | `NOT_APPLICABLE:no documented Linux build` | `UNKNOWN:no mobile host statement`; web `NOT_APPLICABLE:no web build` | Mobile 4 corpus | No Reason Rack Extension host evidence. | C-021; S-005–S-013 |
| Product-native/other | `DOCUMENTED:native modules; FL Studio Mobile native desktop plugin` | `DOCUMENTED:native modules; UWP app/manual; FL Studio Mobile native desktop plugin` | `NOT_APPLICABLE:no documented Linux build` | `DOCUMENTED:iOS/Android native modules`; iOS `DOCUMENTED:IAA/Audiobus`; web `NOT_APPLICABLE:no web build` | Mobile 4; iOS 4.10.19; Android updated 2026-08-05 | SF2/`.dwp` are content formats. IAA/Audiobus is inter-app routing. The wrapper is FL Studio-native, not a third-party format host. | C-017–C-019, C-024; S-004–S-013 |

### 11.2 Discovery, scanning, validation, and recovery

Native modules are chosen from the rack's Add Module menu. IAA discovery is a
`Connect to...` list containing compatible IAA apps; Audiobus is selected as a
connection target. User WAV/MP3 data in designated folders is scanned and
requires an application restart after new samples are added. Direct Share also
requires restart at the destination before transferred data is rescanned.
[C-018, C-022, C-027]

No source documents executable-plugin search paths, VST/AU scanning,
validation, architecture checks, duplicate identity, cache invalidation,
blacklists, quarantine, rescan controls, or per-plugin failure diagnostics.
IAA app discovery should not be generalized into such a scanner. [C-021,
C-023]

The manual warns that the desktop wrapper's initially limited factory library
can leave projects with missing sounds unless the user sends all content. It
does not describe a missing-plugin/sound placeholder, relink map, suppressed
instance, or recovery transaction. [C-027]

### 11.3 Runtime isolation and compatibility

IAA/Audiobus connects to external apps that must remain background-audio
capable; the UI command opens the external app. This establishes an inter-app
boundary but not Image-Line-controlled sandboxing, process supervision, or
crash containment. [C-019, C-022, C-023]

Execution model, architecture bridging, code-signing checks, quarantine,
out-of-process helpers, restart after external-app failure, headless operation,
and resource limits are `UNKNOWN`. No conclusion is drawn about the desktop FL
Studio wrapper's process placement inside the outer DAW. [C-023, C-032]

### 11.4 Host/plugin processing contract

IAA is documented for audio and MIDI input/output and can behave like an
instrument or effect rack module. A selected MIDI channel carries note/control
data; an IAA unit is included automatically in audio render. Audiobus supports
input/output routing, but incoming Audiobus audio must be recorded to an Audio
track to guarantee inclusion in export. [C-019, C-022]

No reviewed source establishes IAA/Audiobus or any other external format's
sidechain buses, multiple audio outputs, dynamic I/O, event timing, MPE/MIDI
2.0, sample-accurate automation, offline callbacks, bypass/suspend semantics,
latency/tail reports, or channel-layout negotiation. The desktop wrapper's
per-rack output routing is documented, but output count and dynamic bus rules
are not. [C-012, C-014, C-016, C-023, C-024]

### 11.5 Parameters, automation, state, presets, and project recall

Native module controls can be automation targets, and native modules/racks can
save presets. Presets carry compatibility metadata sufficient for the browser
to show compatible native presets. [C-013, C-018, C-039]

For IAA, the manual tells the user to open the external app and change its
preset/settings there. It does not state that FL Studio Mobile serializes
external app state, stable parameter IDs, assets, automation mappings, or a
missing-app placeholder into `.flm`. IAA project recall fidelity is therefore
`UNKNOWN`. [C-014, C-023, C-028]

The desktop wrapper can load a complete `.flm` project and share it back to a
mobile device, but wrapper state-chunk persistence in the outer `.flp`, asset
reference rules, migration, and failed-state recovery are not specified.
[C-024, C-025, C-028]

### 11.6 UI, diagnostics, and failure modes

Native modules use embedded touch-oriented rack panels that can be
minimized/maximized and globally scaled. IAA uses `Open IAA App/Audiobus App`,
so the documented external UI is app switching, not embedded custom UI.
[C-022, C-035, C-039]

Audio diagnostics expose buffer utilization, peak, underruns, CPU/RAM, and an
optional developer log that support may request. The manual gives calibration
and audio-mode troubleshooting. It does not document per-external-app crash
logs, scan reports, UI hang containment, remote-UI scaling, a generic editor,
or missing-plugin diagnostics. [C-010, C-023, C-038]

## 12. Extensibility and integration

Documented integration surfaces are class-compliant/Bluetooth MIDI,
IAA/Audiobus on iOS, OS file import/share, Google Drive/OneDrive sync, local
network Direct Share, native preset/content files, `.flm`, MIDI, and the native
desktop FL Studio wrapper. [C-015, C-018, C-019, C-024, C-026]

No public scripting language, extension SDK, native-module authoring SDK,
command/action API, OSC endpoint, controller-script API, or versioned plugin
ABI for FL Studio Mobile was found in the reviewed manual index and product
surfaces. These are `UNKNOWN`, not proven absent. [C-034]

## 13. Project format, persistence, interoperability, and collaboration

The manual uses `.flm` as the FL Studio Mobile project exchanged between
devices and the desktop wrapper. User data is organized into My Songs, Tracks,
Recordings, Samples, MIDI, Instruments, Drumsets, and Presets. Content formats
include `.mid`, WAV, MP3, AAC export, native `.flms`/`.flmpst`, DirectWave
`.dwp`, legacy `.instr`, and SF2/SoundFont. [C-018, C-024, C-027]

Cloud sync through Google Drive or OneDrive uploads newer local files,
downloads newer cloud files, and asks the user to resolve dual modifications
by doing nothing, replacing one side, or keeping both with a renamed copy.
Windows UWP cloud backup is documented as unavailable. Direct Share transfers
the complete FLM User Files set on the same network across detected Android,
iOS, Windows app, and desktop-plugin instances. [C-026]

Google Drive access is limited to app-created files in its FL Studio Mobile
folder; OneDrive access is limited to its app folder but allows browser-added
files. Cloud deletion is conservative: files on another synced device can be
re-uploaded, and FL Studio Mobile does not remotely delete cross-synced device
copies. [C-026, C-031]

There is an unresolved interoperability contradiction. Current 2026 marketing
advertises exporting mobile projects as `.flp`; the plugin manual says Mobile
3+ projects are no longer directly compatible with desktop FL Studio and must
be loaded inside the wrapper as `.flm`. Version-matched tests must distinguish
“creates an `.flp` container containing the wrapper” from “translates mobile
objects into desktop-native tracks/devices.” [C-025]

Undo exists at least for the last action in the visible transport, but the
corpus does not define undo depth, autosave, crash recovery, schema versioning,
forward/backward compatibility, atomic save, or archive/collect semantics.
IAA state and missing-dependency recall are also unknown. [C-023, C-028]

AAF, OMF, ADM, MusicXML, DAWproject, and formal version-control/collaboration
workflows were not documented. MIDI, rendered audio, and the wrapper are the
established interchange paths. [C-018, C-024, C-029]

## 14. Delivery, live, post-production, and specialized workflows

Documented delivery is song render/export to WAV, MP3, AAC, FLAC, and MIDI;
IAA units render automatically, while Audiobus input should first be recorded.
Solo-render-reimport provides manual stems/freeze. Analyzer supplies spectrum,
oscilloscope, LUFS, TruePeak, stereo, and pitch views. [C-019, C-029, C-035,
C-038]

The mixer can be used for live performance, and touch keyboards/pads, chord and
strum layouts, MIDI controllers, and on-the-fly recording support portable
performance. [C-006, C-015, C-035]

Batch export, DDP, video/timecode/ADR, surround/immersive/ADM, notation
delivery, show control, and broadcast conform are not established. The product
is best evidenced as a portable song-production DAW, not a post-production or
delivery workstation. [C-030]

## 15. Performance, reliability, security, and accessibility

Performance controls include multicore on/off, platform sound modes,
low-latency mode, a CPU/RAM display, buffer utilization/peak, and underrun
counts. The manual says the practical rack-module limit is CPU power rather
than a fixed documented count; no benchmarked track/module ceiling is
published. [C-010, C-038]

Reliability aids include recording-latency calibration, audio-mode fallbacks,
manual developer logging, cloud backup/conflict handling, and render/reimport
to lower CPU. Crash containment, transactional saves, rollback, and automatic
project recovery are unknown. [C-011, C-026, C-028, C-035]

Security-relevant boundaries include Android scoped storage, iOS/Windows app
sandboxes, limited cloud-folder permissions, Android Bluetooth location
permission, and local-network/firewall permission for Direct Share. These are
platform/user-visible controls, not an independent security audit. Plugin code
trust, signature verification, IAA crash isolation, and wrapper sandboxing are
unknown. [C-015, C-023, C-031]

Apple's listing reports the developer's declaration that no data is collected;
Google Play reports the developer's declaration that some data categories may
be collected, data is encrypted in transit, and deletion can be requested.
These platform declarations differ and may depend on platform/features. Apple
says the developer has not indicated supported accessibility features. The UI
does support scaling, themes, touch, keyboard/mouse, and multiple screen sizes,
but screen-reader, keyboard-only, contrast, captions, and assistive-technology
conformance are unknown. [C-030, C-035]

## 16. Licensing, ecosystem, and implementation constraints

At access time both mobile stores listed a US price of $14.99 with in-app
purchases; Google Play advertised Lifetime Free Updates. Registration to an
Image-Line account unlocks purchased/content access for the desktop wrapper
and across platforms according to the manual, but cross-store purchase
portability and exact current instrument entitlements are unresolved.
[C-017, C-033]

The desktop FL Studio Mobile plugin is documented as free with desktop FL
Studio (including use of the desktop trial for file management). This does not
grant a right to redistribute the plugin, app, factory content, presets, or
trademarks. [C-024, C-033]

No third-party executable plugin format was established as hosted, so this
dossier does not imply any VST3, AU, AAX, CLAP, or other SDK/license grant.
IAA is an Apple protocol and Audiobus is a third-party app boundary as described
by Image-Line; implementing any analogous support would require separate
platform-owner terms and qualification. [C-019, C-021, C-040]

Clean-room adaptation may use public behavior and minimal mechanisms, not
Image-Line names, UI assets, manuals, project-format internals, DSP code,
factory content, or proprietary expression. This is not legal advice.
[C-040]

## 17. Strengths, liabilities, and architecture lessons

**Strengths**

- The Playlist/typed-clip/track-rack mapping is compact and legible on touch
  screens while still allowing multiple instruments, serial FX, parallel
  sends, and subgroup FX chains. [C-003, C-004, C-007]
- Record-placement calibration and buffer-health/underrun metrics turn mobile
  hardware variability into visible user controls rather than a hidden
  failure. [C-010, C-011, C-038]
- Native rack presets and whole-user-tree sharing make the same musical unit
  portable across devices and the desktop wrapper. [C-024, C-026, C-039]
- Cloud conflicts are exposed explicitly with a keep-both option rather than
  silently selecting a winner. [C-026]

**Liabilities**

- Modern third-party plugin hosting is not established; documented iOS
  integration is IAA/Audiobus with external-app UI and underspecified recall.
  [C-019–C-023]
- The wrapper preserves the mobile environment but may limit object-level
  desktop editability; current `.flp` marketing conflicts with the `.flm`
  wrapper manual. [C-024, C-025]
- Missing factory data can make wrapper projects miss sounds, without a
  documented placeholder/relink contract. [C-027]
- Windows availability/version, project schema, PDC, external-app isolation,
  automation identity, advanced MIDI expression, comping, and accessibility
  remain unknown. [C-012, C-014, C-016, C-023, C-028, C-030, C-036, C-037]

**Architecture lesson:** FL Studio Mobile is a strong reference for a bounded
touch workflow and portable native sub-environment, but a weak reference for a
modern general plugin host. Preserve the visible simplicity while specifying
dependency identity, state, latency, failure, and migration contracts much
more rigorously.

## 18. Transferable patterns

| Problem | Minimal clean-room mechanism | Supporting claims | Prerequisites | Tradeoffs / adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Make a full DAW legible on small screens | Typed Playlist clips dispatch to one focused editor; each track opens one ordered rack | C-003–C-005 | Stable object IDs and touch selection model | Hidden graph detail; clip/editor switching cost | `CANDIDATE` |
| Support layered sound without a global patch bay | Ordered rack permits multiple instruments and FX; note ranges select layers | C-004, C-039 | Deterministic note/audio ordering | Interleaved instruments/FX can surprise users; needs clear signal-flow UI | `CONDITIONAL` |
| Add reusable group processing simply | Default Master plus explicit parallel FX sends and chainable FX channels | C-007 | Cycle detection and gain policy | Current feedback/cycle semantics unknown; specify them rather than copy | `CANDIDATE` |
| Align live recording on variable devices | Measure round-trip latency with a calibration signal and compensate record placement | C-011 | Reliable input/output loop and stored device profile | Calibration can fail/noise; does not replace PDC | `CANDIDATE` |
| Explain realtime overload | Show buffer fill utilization, peak, and underrun count with audible-failure guidance | C-010, C-038 | Engine telemetry safe for realtime publication | Metrics can confuse users; sampling must not perturb audio | `CANDIDATE` |
| Preserve a constrained mobile environment on desktop | Load the mobile project in a versioned wrapper; sync transport/tempo; expose per-track outputs and MIDI export | C-024 | Stable wrapper ABI, migration and asset manifest | Encapsulation limits native editability and creates nested state | `CONDITIONAL` |
| Avoid silent cloud overwrite | Detect dual modification and offer local/cloud/keep-both resolution | C-026 | Revision metadata and atomic upload/download | Filename copies are not semantic merges | `CANDIDATE` |
| Prevent portable-project content loss | First-run dependency manifest/completeness check before cross-device transfer | C-027 | Content hashes, licensing metadata, relink UI | Whole-library transfer is heavy; vendor method lacks documented placeholder | `CANDIDATE` (improved mechanism, not copied UX) |

## 19. Rejected patterns and CURIOSITY_NO_GO

### Rejected architecture interpretations

- **Reject IAA as the primary modern plugin architecture.** External-app UI,
  background-audio dependence, and undocumented state/latency/crash behavior
  are unsuitable as the sole extensibility contract. Reopen only with a
  modern, versioned extension format and qualified host matrix. [C-019,
  C-022, C-023]
- **Reject calling Autoduck a true sidechain bus.** The vendor documents a
  sidechain-style result, not an externally routed detector input. Reopen with
  a signal-flow page or dynamic two-source probe. [C-008]
- **Reject “format not named = unsupported.”** The evidence contract forbids
  turning manual silence into a negative support claim; all required rows stay
  explicit `UNKNOWN`. [C-020, C-021]
- **Reject treating recording latency alignment as global PDC.** It removes a
  measured leading slice from recorded audio and says nothing about device or
  plugin delay graphs. [C-011, C-012]
- **Reject blind whole-user-tree sync as a complete portability design.** It
  can transfer factory data but does not define licenses, hashes, placeholders,
  or minimal dependency sets. Adapt with a manifest. [C-027]

### CURIOSITY_NO_GO research threads

- `CURIOSITY_NO_GO`: community videos/reviews for plugin support or data loss—
  secondary anecdotes cannot establish a host contract or reproducible failure.
- `CURIOSITY_NO_GO`: exhaustive per-effect DSP inventory—low decision novelty;
  rack semantics are already established.
- `CURIOSITY_NO_GO`: Apple IAA deprecation history—platform context would not
  prove the current FL Studio Mobile implementation.
- `CURIOSITY_NO_GO`: authenticated forum/release downloads—outside the public,
  no-auth documentary boundary.
- `CURIOSITY_NO_GO`: install and probe arbitrary plugins/apps—belongs in a
  signed disposable interoperability harness, not this research wave.
- `CURIOSITY_NO_GO`: reverse engineer `.flm`/`.flp` or proprietary binaries—
  unnecessary, unsafe, and prohibited by the clean-room contract.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary result | Counterevidence/qualification | Status / later probe |
| --- | --- | --- | --- |
| H1: Mobile is a linear typed-clip DAW with constrained per-track racks rather than a free graph. | Playlist, track-rack mapping, channel types, and mixer mirroring support it. [C-003, C-004, C-006] | Parallel sends and chainable FX channels make the routing richer than a purely serial rack. [C-007] | **Supported, refined.** Probe feedback/cycle policy dynamically. |
| H2: It does not expose a general desktop-format host; iOS status is format-specific. | The corpus documents IAA/Audiobus and native modules; no reviewed source names VST/AU/AUv3/etc. [C-019–C-021] | Absence is not proof; official search failed and no install probe was run. | **Partially supported only for documented boundary.** Test Add Module on iOS/Android/Windows with controlled AUv3/VST fixtures. |
| H3: Desktop interoperability is encapsulation, not direct translation. | Manual says Mobile 3+ projects load in the wrapper and can expose track outputs/MIDI. [C-024] | Current marketing advertises `.flp` export. [C-025] | **Supported with contradiction.** Export a 4.10.19 fixture and inspect only user-visible desktop objects/round-trip behavior. |
| H4: Public sources do not establish internal scheduling/isolation/PDC. | Settings explain buffers/modes and record alignment but no scheduler, isolation, or PDC contract. [C-010–C-012, C-023, C-032] | None found in index or product/store pages. | **Supported.** Vendor clarification or safe latency/crash harness required. |
| “IAA accepted” vs “fully hosted.” | Compatible apps are listed and can connect/render. [C-022] | State capture, missing app, crash recovery, multi-output, latency, parameter automation, and custom UI embedding are unknown. [C-023] | **Not equivalent.** Use one synth and one effect fixture, save/reopen/offline-render/remove-app/crash. |
| Native content count is stable. | Current product/Google list eight instruments. [C-017] | Manual index/overview includes SoundFont Player; older Rack text and entitlement language conflict. | **Falsified as a timeless inventory.** Pin exact installed build/store receipts in future testing. |
| Windows UWP is current. | Manual links a UWP product and describes Windows audio/files. [C-002] | Current product page omits it; Microsoft page was unreadable. [C-036] | **Unresolved.** Check Store API/GUI and package version without installing. |

Adversarial searches also attempted to find AUv3/VST results through Image-Line's
public search and current Microsoft metadata. The search returned a generic
desktop homepage and Microsoft returned no readable body; both are retained
negative results, not evidence of unsupported formats. [C-020, C-021, C-036]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | **DOCUMENTED** | High | FL Studio Mobile is maintained; Apple displayed 4.10.19/Aug. 6 and Google an update on 2026-08-05; the manual family is Mobile 4. | Current public release identity at cutoff | S-003, S-004, S-005 | Store metadata plus official manual index | Apple page omits year beside Aug. 6; Android version number was not rendered. |
| C-002 | **DOCUMENTED** | Medium | Current marketing names iOS and Android/Chromebook; Apple also lists Mac; manual names Android/ChromeOS, iOS, macOS, Windows UWP, and desktop wrapper. | Platform documentation, not runtime parity | S-001, S-003, S-004, S-006 | Direct vendor/store statements | Current marketing omits Windows/macOS app; active UWP availability unknown. |
| C-003 | **DOCUMENTED** | High | A song arranges Note, Audio, and Automation clips on a linear Playlist with typed editors and sub-tracks. | Mobile 4 workflow | S-006, S-007 | Direct manual descriptions | Internal object schema unknown. |
| C-004 | **DOCUMENTED** | High | Each Playlist track has a Channel Rack; Instrument racks accept instruments+FX, Audio/FX racks FX only; modules process top-to-bottom and multiple ranged instruments can coexist. | Mobile 4 rack model | S-006, S-008 | Direct manual signal-flow examples | Fixed module/track limits not benchmarked. |
| C-005 | **DOCUMENTED** | High | Clips support copy/cut/combine/mute/snap/loop, audio stretch/sync, and timeline insert/delete-space/duplicate/trim operations. | Mobile 4 editing | S-007 | Direct operation list | Warp-marker/source-edit internals unknown. |
| C-006 | **DOCUMENTED** | High | Mixer order mirrors Playlist order with one channel per Playlist track and fader/pan/mute/solo. | Mobile 4 mixer | S-009 | Direct manual statement | No VCA/folder/surround evidence. |
| C-007 | **DOCUMENTED** | High | Racks default to Master, can create multiple parallel sends to FX channels, can chain FX channels, and wrapper racks can target desktop FL Mixer tracks. | Mobile 4 routing + wrapper | S-008 | Direct routing notes | Bus count and dynamic I/O unknown. |
| C-008 | **INFERENCE** | Medium | Routing is constrained rather than freely modular, and Autoduck does not establish a true detector sidechain. | Architecture interpretation | S-006, S-008, S-009 | Visible routes are Master/FX sends; vendor says “sidechain style.” Alternative: an undocumented detector route may exist. | Feedback/cycle and hidden sidechain behavior untested. |
| C-009 | **DOCUMENTED** | High | Audio Record tracks support selectable interfaces/inputs, monitoring, OS-dependent multitrack recording, count-in, and 16/32-bit creation settings. | Recording | S-007, S-010 | Direct manual settings/workflow | Maximum channels and 24-bit creation setting unclear. |
| C-010 | **DOCUMENTED** | High | Android and Windows expose audio modes, multicore/low-latency controls, approximately 5–20 ms buffers, utilization/peak, and underrun diagnostics. | Engine user controls | S-010 | Direct manual explanation | Not an independent latency/performance measurement. |
| C-011 | **DOCUMENTED** | High | Recording compensation measures round-trip delay and trims equivalent leading audio to align recordings; manual quotes typical 40–200 ms device latency. | Record placement | S-007, S-010 | Direct manual mechanism | Manual says iOS calibration unnecessary; actual results untested. |
| C-012 | **UNKNOWN** | High | Plugin delay compensation, latency/tail reporting, sample-rate matrix, engine precision, oversampling, and deterministic offline scheduling are not established. | Audio engine/host | S-006–S-013 | Reviewed overview, Playlist, Rack, Settings, IAA, wrapper pages | Next probe: impulse/latency fixtures and vendor engine specification. |
| C-013 | **DOCUMENTED** | High | Most movable controls can create automation tracks; automation can be recorded or drawn. | Native control automation | S-001, S-004, S-007 | Direct vendor statements and workflow | Exact supported-control exceptions not enumerated. |
| C-014 | **UNKNOWN** | High | Stable parameter identity, range/text mapping, smoothing, sample accuracy, orphan targets, and external-app automation are not documented. | Automation contract | S-007, S-013 | Automation workflow and IAA page reviewed | Safe project-reopen/render probe needed. |
| C-015 | **DOCUMENTED** | High | Piano roll/step sequencing, MIDI import/export, class-compliant wired/wireless controllers, Bluetooth scan, and selected-track input are documented. | MIDI | S-003, S-004, S-007, S-010 | Multiple primary surfaces | Precise event timing unknown. |
| C-016 | **UNKNOWN** | High | MPE, MIDI 2.0/UMP, SysEx, MIDI Clock/MTC/MMC, notation, and per-note expression are not established. | Advanced MIDI/sync | S-005–S-013 | Full visible manual index and relevant pages reviewed | Absence is not proof; controller/event fixture required. |
| C-017 | **DOCUMENTED** | Medium | Current product/Google advertise eight instruments and 30+ effects; manual also documents SoundFont Player and note effects; entitlement wording conflicts. | Native inventory/current packaging | S-001, S-004–S-006, S-008 | Direct lists; disagreement retained | Exact installed inventory/store ownership requires a version-matched account. |
| C-018 | **DOCUMENTED** | High | Documented content/data formats include `.flm`, MIDI, WAV/MP3/AAC/FLAC export, SF2, `.dwp`, `.instr`, `.flms`, and `.flmpst`. | Files/content | S-001, S-003, S-004, S-006, S-012 | Direct format lists | `.flp` treated separately due contradiction. |
| C-019 | **DOCUMENTED** | High | iOS has an IAA/Audiobus rack module for audio/MIDI in/out; IAA can act as synth/effect and auto-render, while Audiobus input should be recorded for export. | iOS inter-app hosting | S-003, S-004, S-006, S-008, S-013 | Direct module workflow | Runtime behavior not independently observed. |
| C-020 | **UNKNOWN** | High | AUv3 hosting is not established by the current product page, stores, complete index, Rack, or iOS inter-app page. | iOS/macOS Mobile 4 | S-001, S-003–S-006, S-008, S-013, S-015 | Negative result across primary corpus | Silence is not proof; test with a controlled AUv3 instrument/effect. |
| C-021 | **UNKNOWN** | High | VST2/3, AUv2, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, and Rack Extension hosting inside FL Studio Mobile are not established. | Required format matrix | S-005–S-015 | Manual/product/search corpus contains no affirmative host statement | Desktop FL Studio's host features are excluded; dynamic format fixtures needed. |
| C-022 | **DOCUMENTED** | High | IAA discovery lists compatible apps; users choose a target/MIDI channel and open the external app UI. | IAA discovery/UI/event surface | S-013 | Direct controls/workflow | Does not establish validation, embedding, or state capture. |
| C-023 | **UNKNOWN** | High | External-app isolation, crash recovery, signing checks, buses/multi-output, latency/tails, parameter/state serialization, missing-app recall, and diagnostics are not documented. | IAA/Audiobus host depth | S-013 | Required host dimensions checked against page | Platform inter-app boundary alone is insufficient evidence. |
| C-024 | **DOCUMENTED** | High | Mobile 3+ projects load inside a free desktop FL Studio Mobile plugin that syncs transport/tempo, shares `.flm`, exports MIDI, and exposes per-track outputs. | Desktop interoperability only | S-006, S-008, S-011, S-012 | Direct wrapper instructions | Outer-host state and migration internals unknown. |
| C-025 | **UNKNOWN** | High | Direct `.flp` translation semantics are unresolved because 2026 marketing advertises `.flp` export while wrapper manual says Mobile 3+ is not directly compatible and uses `.flm`. | Mobile↔desktop project exchange | S-001, S-004, S-011 | Explicit contradiction | Version-matched export/round-trip probe required. |
| C-026 | **DOCUMENTED** | High | Google Drive/OneDrive sync supports upload/download/keep-both conflict actions; Direct Share transfers user files on the same network; UWP cloud backup is unavailable. | Backup/share | S-010, S-012 | Direct rules and platform note | Cloud service behavior can change externally. |
| C-027 | **DOCUMENTED** | High | User data has named folders and restart/rescan rules; wrapper projects can miss sounds unless complete factory data is sent first. | Asset management/missing dependency | S-011, S-012 | Direct warning and folder map | Placeholder/relink/recovery behavior unknown. |
| C-028 | **UNKNOWN** | High | Project schema, atomic save, autosave, recovery, migration/version rules, undo history, asset reference model, and archive semantics are not documented. | Persistence | S-006–S-013 | Relevant pages reviewed | Safe black-box save/crash/migration corpus needed. |
| C-029 | **DOCUMENTED** | High | Delivery includes WAV/MP3/AAC/FLAC/MIDI; solo-render/reimport supplies a manual stem/freeze-like path. | Delivery | S-001, S-004, S-012 | Vendor product/files descriptions | Batch, loudness target, and render determinism unknown. |
| C-030 | **UNKNOWN** | Medium | Accessibility conformance and post/video/immersive/broadcast workflows are not established; Apple reports no developer-indicated accessibility features. | Accessibility/specialized use | S-003, S-005–S-013 | Explicit Apple metadata plus no relevant indexed sections | UI scaling is documented but is not accessibility conformance. |
| C-031 | **DOCUMENTED** | High | Android scoped storage, limited cloud app-folder access, platform file sandboxes, and firewall/network permission are user-visible security boundaries. | Storage/network | S-010, S-012 | Direct platform/file notes | Not an independent security assessment. |
| C-032 | **UNKNOWN** | High | Proprietary process, thread, scheduler, realtime-safety, graph-rebuild, and internal storage architecture remain unknown. | Public internals | S-006–S-013 | User manual exposes behavior, not internals | Vendor engineering disclosure or open implementation absent. |
| C-033 | **DOCUMENTED** | Medium | Stores list paid app/IAP; Google advertises Lifetime Free Updates; wrapper is free with desktop FL Studio; registration unlocks content across platforms. | Commercial/licensing surface | S-003, S-004, S-006, S-011 | Vendor/store statements | Cross-store purchase portability and legal terms not fully retrieved. |
| C-034 | **UNKNOWN** | Medium | No public scripting, extension/device SDK, controller script API, OSC API, or command API was found. | Extensibility | S-005–S-013 | Complete manual index and integration pages reviewed | Absence from reviewed corpus is not proof; vendor clarification needed. |
| C-035 | **DOCUMENTED** | High | UI is touch-first, scalable across screen sizes, has virtual/scale/chord/strum controls, and supports render/reimport to save CPU. | UI/performance workflow | S-001, S-003, S-004, S-007, S-010, S-012 | Direct vendor descriptions | Keyboard-only/screen-reader behavior untested. |
| C-036 | **UNKNOWN** | High | Current Windows UWP store availability and version parity are unverified. | Windows current status | S-001, S-006, S-007, S-010, S-012, S-014 | Manual documents Windows behavior/link; current product page omits it; Store fetch empty | Query Store API/GUI or vendor support without installing. |
| C-037 | **UNKNOWN** | Medium | Take lanes, comping, advanced warp, relink, video, and detailed history are not established. | Editing/recording | S-005–S-012 | Relevant manual sections reviewed | Feature may exist outside reviewed pages; dynamic UI census needed. |
| C-038 | **DOCUMENTED** | High | Analyzer provides spectrum/scope/loudness/stereo/pitch views; engine exposes CPU/RAM and underrun diagnostics. | Metering/diagnostics | S-001, S-004, S-006, S-010 | Direct vendor statements | Accuracy/standards conformance not independently measured. |
| C-039 | **DOCUMENTED** | High | Native modules and whole racks can be reordered, copied, preset-saved, minimized, and recalled across projects. | Native state/UI | S-008, S-012 | Direct Rack/file descriptions | Binary preset schema and migration unknown. |
| C-040 | **INFERENCE** | High | No format/license/redistribution right follows from a product-format mention; clean-room adaptation must use behavior, not protected assets or internals. | Legal/research boundary | S-006, S-013 plus governing research contract | Format owners' current licenses were not needed because support was unestablished | Not legal advice. |

## 22. Source ledger and adaptive bibliography

All sources were accessed 2026-08-29. Vendor/store text is evidence of what is
documented or declared, not independent runtime verification.

### S-001 — FL Studio Mobile product page

- **Publisher / kind:** Image-Line; current official marketing/product page.
- **URL:** https://www.image-line.com/fl-studio-mobile/
- **Scope:** current product positioning at cutoff.
- **Relevant passages:** iOS/Android/Chromebook availability; eight
  instruments, 1,000+ sounds, 30+ effects; recording, automation, mixer,
  stretch/repitch, `.flp` and audio/MIDI export, same-network sharing.
- **Claims:** C-001, C-002, C-013, C-017, C-018, C-025, C-029, C-035.
- **Limitations:** marketing summary; omits Windows/macOS app and host-contract
  depth; `.flp` wording conflicts with S-011.
- **Selection rationale:** freshest vendor overview; preferred over secondary
  reviews for current headline functionality.

### Unnumbered source-discovery record — FL Studio Mobile Online Manual wrapper

- **Publisher / kind:** Image-Line; official manual shell/HTML.
- **URL:** https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/
- **Scope:** wrapper landing page; HTML identifies the iframe index and main
  manual page.
- **Relevant passage:** `Index_Frame_Left.html` and Mobile main-page iframe
  URLs; page shell itself carries no substantive manual body in text mode.
- **Claims:** source-discovery provenance only.
- **Limitations:** Markdown fetch appeared empty; substantive evidence comes
  from S-005–S-013. Wrapper metadata date does not date embedded contents.
- **Selection rationale:** establishes that deep pages are part of the official
  Image-Line manual rather than orphaned files.

### S-003 — FL Studio Mobile, Apple App Store

- **Publisher / kind:** Apple storefront carrying Image-Line developer
  metadata.
- **URL:** https://apps.apple.com/us/app/fl-studio-mobile/id432850619
- **Scope:** iPhone/iPad/Mac listing; displayed 4.10.19, Aug. 6; iOS 12+.
- **Relevant passages:** multitrack projects, per-track mixer/effect bus,
  automation/MIDI, IAA/Audiobus In/Out, desktop plugin, instrument/effect list,
  privacy and accessibility declarations.
- **Claims:** C-001, C-002, C-015, C-017–C-019, C-030, C-033, C-035.
- **Limitations:** developer-supplied; inventory wording appears older than
  Google/manual; year omitted beside Aug. 6; no host-depth detail.
- **Selection rationale:** primary distribution metadata for current Apple
  version/platform requirements; preferred over app-index mirrors.

### S-004 — FL Studio Mobile, Google Play

- **Publisher / kind:** Google storefront carrying Image-Line developer
  metadata.
- **URL:** https://play.google.com/store/apps/details?id=com.imageline.FLM&hl=en_US
- **Scope:** Android/Chromebook listing; updated 2026-08-05.
- **Relevant passages:** eight instruments, 30+ effects, routing/mixer,
  recording/automation/MIDI, `.flp` and media export, IAA/Audiobus statement,
  USB interfaces, Lifetime Free Updates, data-safety declaration.
- **Claims:** C-001, C-002, C-010, C-013, C-015, C-017–C-019, C-025, C-029,
  C-033, C-035, C-038.
- **Limitations:** Android version number/requirements not rendered; IAA text is
  generic listing copy despite being iOS-specific; user reviews not retained as
  proof.
- **Selection rationale:** freshest dated Android primary listing; preferred
  over reviews/download sites.

### S-005 — FL Studio Mobile Manual index

- **Publisher / kind:** Image-Line; official complete visible manual index.
- **URL:** https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/Index_Frame_Left.html
- **Scope:** “FL Studio Mobile 4” topic map.
- **Relevant passages:** pages for plugin, Home/Project/Settings/Files/Wi-Fi,
  Playlist, Rack, instruments, effects, note effects, Mixer, Editors,
  controllers, and IAA/Audiobus.
- **Claims:** C-001, C-017, C-020, C-021, C-030, C-034, C-037.
- **Limitations:** index metadata is old and not a reliable content-update
  timestamp; topic absence is not proof of feature absence.
- **Selection rationale:** strongest bounded census of official manual topics;
  preferable to keyword snippets.

### S-006 — FL Studio Mobile overview

- **Publisher / kind:** Image-Line; official manual main page.
- **URL:** https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile.htm
- **Scope:** Mobile 4 overview/platforms/native devices/workspaces.
- **Relevant passages:** Android/ChromeOS/iOS/macOS/Windows UWP and wrapper;
  per-track racks; instrument/effect/note-effect inventories; workspaces;
  registration and plugin lineage.
- **Claims:** C-002–C-004, C-012, C-017–C-021, C-024, C-032, C-033.
- **Limitations:** some entitlement/inventory text conflicts with S-008/stores;
  no exact page version.
- **Selection rationale:** highest-yield official architecture overview.

### S-007 — Playlist

- **Publisher / kind:** Image-Line; official manual workflow page.
- **URL:** https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_Playlist.htm
- **Scope:** tracks, clips, editing, recording, automation, transport.
- **Relevant passages:** Note/Audio/Automation arrangement; sub-tracks; clip and
  timeline operations; AUX tracks; recording/interface modes; calibration;
  automation creation; buffer-health explanation; keyboard/scale/chord modes.
- **Claims:** C-003, C-005, C-007, C-009, C-011, C-013–C-015, C-035, C-037.
- **Limitations:** operational manual, not internal schema/engine evidence.
- **Selection rationale:** primary source for the product's central object and
  editing model.

### S-008 — Channel Rack

- **Publisher / kind:** Image-Line; official manual routing/device page.
- **URL:** https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_Rack.htm
- **Scope:** Mobile 4 rack topology, native modules, sends, presets, wrapper
  outputs.
- **Relevant passages:** channel types; top-to-bottom processing; multiple
  instruments; module/rack presets; default Master; parallel sends; FX-chain
  sends; desktop Mixer output selection.
- **Claims:** C-004, C-007, C-008, C-017, C-019–C-021, C-024, C-039.
- **Limitations:** older device-count/purchase text conflicts with newer
  surfaces; feedback/cycle and bus limits absent.
- **Selection rationale:** best primary source for signal-flow architecture.

### S-009 — Mixer

- **Publisher / kind:** Image-Line; official manual page.
- **URL:** https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_Mixer.htm
- **Scope:** Main Mixer.
- **Relevant passage:** Mixer order mirrors Playlist; one channel per Playlist
  track; fader, pan, activate/mute, solo.
- **Claims:** C-006, C-008.
- **Limitations:** short user page; no meters, buses, layout, or internals.
- **Selection rationale:** authoritative mapping between arrangement and mixer.

### S-010 — Home Panel Settings

- **Publisher / kind:** Image-Line; official manual engine/settings page.
- **URL:** https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_HomePanel_Settings.htm
- **Scope:** MIDI, audio, recording latency, performance, UI, diagnostics.
- **Relevant passages:** Bluetooth MIDI; recording sources; round-trip
  calibration; 32-bit option; multicore/low latency; Android/Windows modes;
  multitrack recording; sharing; scaling; 5–20 ms buffer model; underruns;
  developer log.
- **Claims:** C-009–C-012, C-015, C-026, C-031, C-035, C-038.
- **Limitations:** tuning guidance and vendor explanation, not measurements;
  not all settings exist on every OS.
- **Selection rationale:** only primary page with engine-facing user controls
  and failure diagnostics.

### S-011 — FL Studio Mobile Plugin

- **Publisher / kind:** Image-Line; official manual interoperability page.
- **URL:** https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_FLStudioPlugin.htm
- **Scope:** Mobile 3+ inside desktop FL Studio.
- **Relevant passages:** wrapper required; projects not directly compatible;
  `.flm` sharing; first Send All; transport/tempo sync; per-track outputs; MIDI
  export; mobile round trips.
- **Claims:** C-024, C-025, C-027, C-033.
- **Limitations:** may lag current `.flp` export marketing; authenticated plugin
  download was not accessed.
- **Selection rationale:** definitive vendor explanation of the encapsulation
  boundary; preferable to generic desktop compatibility claims.

### S-012 — Home Panel Files

- **Publisher / kind:** Image-Line; official manual storage/share page.
- **URL:** https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_HomePanel_Files.htm
- **Scope:** cloud/direct share, folders, formats, OS storage, desktop data.
- **Relevant passages:** Google/OneDrive sync rules/conflicts; no UWP cloud;
  Direct Share; first Send All/missing sounds; Android scoped storage; file
  folders/formats; restart scans; iOS/Windows import behavior.
- **Claims:** C-018, C-024, C-026–C-029, C-031, C-035, C-039.
- **Limitations:** cloud-provider behavior may change; no project schema or
  asset manifest.
- **Selection rationale:** strongest primary persistence/portability source.

### S-013 — Inter App Audio / IAA Module

- **Publisher / kind:** Image-Line; official iOS integration manual.
- **URL:** https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_iOS_InterApp.htm
- **Scope:** iOS IAA and Audiobus in/out.
- **Relevant passages:** compatible-app list; MIDI output channel; external UI;
  background audio; synth/effect behavior; IAA automatic render; Audiobus
  input recording requirement; FLM/audio save.
- **Claims:** C-019–C-023, C-040.
- **Limitations:** no explicit manual version, AUv3 statement, state/isolation,
  latency, multi-output, or failure contract.
- **Selection rationale:** only official deep source for third-party app hosting;
  preferred over community compatibility reports.

### S-014 — Microsoft Store FL Studio Mobile product ID (negative result)

- **Publisher / kind:** Microsoft Store; official distribution URL linked by
  S-006.
- **URL:** https://apps.microsoft.com/detail/9nblggh1zjcr
- **Scope:** attempted current Windows UWP availability/version check.
- **Relevant passage:** none; public fetch returned an empty body.
- **Claims:** C-036 (access limitation only).
- **Limitations:** cannot establish listing status, version, requirements, or
  delisting.
- **Selection rationale:** direct store origin was preferable to mirrors; one
  attempt was retained rather than repeatedly retrying an unreadable source.

### S-015 — Image-Line public search for Mobile VST/AUv3 (negative result)

- **Publisher / kind:** Image-Line; official site search endpoint.
- **URL:** https://www.image-line.com/?s=FL+Studio+Mobile+VST+AUv3
- **Scope:** attempted explicit host-format inclusion/exclusion discovery.
- **Relevant passage:** none; endpoint returned the generic desktop FL Studio
  homepage rather than relevant search results.
- **Claims:** C-020, C-021 (attempted method only).
- **Limitations:** search malfunction/noise; not evidence of absence.
- **Selection rationale:** bounded official-domain check after manual
  saturation; stopped when it added no evidence.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods / available evidence | Blocker and impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| Current Windows UWP availability/version | Manual link and Windows workflows reviewed; Microsoft page fetched once; current product page checked | Store body unreadable; affects platform matrix/current parity | Query public Microsoft Store API or GUI metadata without installation; ask vendor for supported-build matrix | Public store/vendor; unassigned |
| AUv3 and all required executable plugin formats | Current product/stores, complete index, Rack, IAA page, and official search checked | No affirmative/exclusion statement; silence cannot prove unsupported | On clean signed iOS/Android/Windows fixtures, inspect Add Module and attempt one known-good instrument/effect per applicable format | Disposable devices/plugins; unassigned |
| IAA/Audiobus state, missing app, crash recovery, buses, latency | Full official IAA workflow reviewed | Host contract stops at connection/render; affects durable project design | Save/reopen with changed external preset; remove/disable/crash app; test instrument/effect, offline render, bus/channel behavior | Legacy-compatible iOS fixture; unassigned |
| PDC, latency/tail, sample rate, render determinism | Audio settings/calibration/buffer pages reviewed | Record alignment is not PDC; engine internals proprietary | Controlled impulse/delay/tail fixture at each exposed rate/mode; compare realtime/offline outputs | Audio loopback + signed fixtures; unassigned |
| Stable automation identity/sample accuracy | Native automation workflow reviewed | No ID/range/timing/state contract; affects migrations | Automate native and external targets, reorder/replace modules, save/reopen, render and compare event timing | Disposable project corpus; unassigned |
| `.flp` export meaning and wrapper recall | Current `.flp` marketing contrasted with `.flm` wrapper manual | Version mismatch/ambiguity; affects desktop editability promise | Export 4.10.19 project containing note/audio/automation/routing; inspect only user-visible desktop object graph and round trip | Current app + desktop FL Studio; unassigned |
| Project schema, atomicity, autosave, migration, undo/recovery | Project/files/wrapper pages reviewed | No public specification; affects durability | Black-box fixture corpus across app versions; interrupted save in disposable storage; no format reverse engineering | Versioned devices; unassigned |
| Missing sample/plugin placeholder and relink | Manual warns missing wrapper sounds after incomplete transfer | No documented placeholder/relink UX; data-loss risk | Open deliberately incomplete copy, record visible diagnostics/relink and non-destructive save behavior | Disposable copied project; unassigned |
| Feedback/cycle and routing limits | Rack routing page reviewed | Chaining documented; cycles/limits omitted | Attempt self-send and two-FX cycle; enumerate accepted sends/outputs without stress-testing production device | Clean project; unassigned |
| Advanced MIDI/MPE/MIDI 2.0/sync | Controller and IAA pages reviewed | No protocol matrix; affects expression/controller design | Send controlled MPE, UMP, SysEx, clock/MTC fixtures and record accepted/mapped events | MIDI protocol harness; unassigned |
| Take/comping/warp/history | Playlist/index reviewed | Feature silence; affects recording/editor comparison | Version-matched UI census with two loop-record passes and imported tempo-varying audio | Clean app project; unassigned |
| Licensing/content portability | Stores and registration text reviewed | Exact store receipts/cross-platform entitlements conflict | Vendor support matrix and clean account with purchases on one store; do not share licensed content | Vendor/account owner; unassigned |
| Accessibility | Apple declaration and scaling/input docs reviewed | No conformance or assistive-tech detail | VoiceOver/TalkBack/keyboard-only focus/name/action audit on disposable devices | Accessibility tester; unassigned |

## 24. Curiosity pass and stop decision

Scoring uses 0–4 for **decision relevance (R)**, **expected evidence value
(V)**, and **novelty (N)**; **cost (C)** is 0–4 where lower is cheaper.

| Candidate thread | R | V | N | C | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Current Microsoft Store listing + explicit official plugin-format search | 4 | 4 | 3 | 2 | **Pursued.** Store body unreadable; Image-Line search returned irrelevant homepage. Negative results retained as S-014/S-015. |
| Apple IAA deprecation/platform history | 2 | 2 | 2 | 2 | `CURIOSITY_NO_GO`: cannot prove FL Studio Mobile's current runtime or replacement strategy. |
| Community AUv3/VST compatibility reports | 3 | 1 | 2 | 2 | `CURIOSITY_NO_GO`: secondary observations cannot establish complete host contract. |
| Exhaustive native effect inventory/DSP comparison | 1 | 1 | 1 | 3 | `CURIOSITY_NO_GO`: no likely architecture-decision change. |
| Authenticated forum release notes/downloads | 3 | 3 | 2 | 3 | `CURIOSITY_NO_GO`: authentication/access boundary and unneeded for honest unknowns. |
| Install/runtime interoperability suite | 4 | 4 | 4 | 4 | `CURIOSITY_NO_GO` for this wave: valuable but explicitly deferred to disposable qualification harnesses. |
| Reverse engineer `.flm`/binary internals | 3 | 3 | 4 | 4 | `CURIOSITY_NO_GO`: prohibited and unnecessary; use black-box behavior instead. |

**Gaps and contradictions after final synthesis:** `.flp` marketing vs `.flm`
wrapper instructions; current product-page platform list vs manual Windows/macOS
list; native inventory/entitlement differences; Apple vs Google privacy
declarations; and missing modern plugin-host contract. All are visible in the
claims and unknowns rather than reconciled by speculation.

**Stop decision:** `STOP_COVERAGE_SATURATED_WITH_ACCESS_BOUNDARY`. All template
sections and plugin rows are complete; the primary manual corpus converged on
the same Playlist/Rack/IAA/files model; the one best curiosity thread produced
only bounded negative results; repeated external search was rate-limited or
nonresponsive; and remaining questions require runtime fixtures, authenticated
support, or vendor disclosure. Another documentary pass has nonpositive
marginal evidence within budget.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Yes; this file was created
  and no sibling/governing file was changed.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Yes; see Section 0.
- [x] **Every required dossier heading exists in order.** Yes; Sections 0–25
  match `DOSSIER-TEMPLATE.md`.
- [x] **Every material assertion has a claim ID and classification.** Yes;
  substantive sections cite C-001–C-040, registered in Section 21.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.**
  Yes; unknowns include attempted methods, impact, and probes in Sections 21/23.
- [x] **Every required plugin-format row is present.** Yes; all 13 required rows
  appear in Section 11.1 with no blanks.
- [x] **Hosting depth goes beyond format names or explicitly remains
  `UNKNOWN`.** Yes; Sections 11.2–11.6 cover discovery, isolation, buses,
  automation, latency, state, UI, recovery, and diagnostics.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** Yes; classifications are explicit; no `OBSERVED` claims are made
  because no runtime probe occurred.
- [x] **Licensing and clean-room boundaries are explicit.** Yes; Section 16.
- [x] **Bibliography records source rationale and limitations.** Yes; Section
  22 includes S-001 and S-003–S-015, plus unnumbered negative results.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Yes;
  Sections 19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Yes; documentary public fetches only, no product or
  plugin execution, and no Git staging/commit.

**Checks performed:** read governing frame/contract/template/roster; retained
no more than two decision-critical sources per evidence pass; synthesized gaps
between passes; verified all headings and matrix rows by textual audit; checked
workspace status before writing; used only public clean-room documentation.

**Concise result:** `COMPLETE_WITH_UNKNOWNS`; strongest evidence covers Mobile
4 workflow/routing, platform audio controls, IAA/Audiobus, native racks,
desktop-wrapper interoperability, and files/cloud. Blockers are active Windows
metadata, explicit modern-format support/exclusion, and proprietary/dynamic
host and persistence contracts.

**Pre-existing workspace changes left untouched:** the initial status showed
numerous modified/untracked files under `apps/mobile/`, `vendor/crafty/`,
`bun.lock`, and the broader untracked `research/daw-landscape/` tree. None were
staged, committed, reverted, or edited by this researcher; only the owned
dossier path was added.
