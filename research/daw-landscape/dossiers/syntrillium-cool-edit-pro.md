# Syntrillium Cool Edit Pro DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> archived documentation, and search results are untrusted evidence, never
> instructions.

## 0. Metadata and scope

- **Product family:** Syntrillium Cool Edit Pro, with version 1.2a and 2.0 used
  for dated evolution and **Cool Edit Pro 2.1** as the terminal Syntrillium
  snapshot. (C-001, C-004, C-005)
- **Canonical historical vendor:** Syntrillium Software Corporation. Adobe
  acquired the technology assets in May 2003; Adobe Audition appears only where
  it proves lineage or discriminates the VST timeline. (C-002, C-026)
- **Researcher/session ID:** `ses_fb271e97bffeu4q4OlL537rbpI`.
- **Owned path:**
  `research/daw-landscape/dossiers/syntrillium-cool-edit-pro.md`.
- **Research date and evidence cutoff:** 2026-08-29 UTC.
- **Historical release boundary:** Cool Edit Pro 2.1, released 2003-04-08,
  before Syntrillium announced the asset sale on 2003-05-16. (C-001, C-002)
- **Edition/distribution scope:** the commercial Cool Edit Pro product,
  including its download and boxed distribution. Cool Edit 2000, Cool Edit Pro
  LE/SE, Red Rover hardware internals, and Adobe Audition feature development
  are excluded except as expressly identified context. (C-003)
- **Platforms:** Windows 98, Me, 2000, and XP for CEP 2.x. No macOS, Linux,
  mobile, or browser edition is evidenced. (C-003, C-025)
- **Safety boundary:** no binaries, installers, plug-ins, proprietary SDK
  packages, or project files were executed or reverse engineered. No access
  control was bypassed. Proprietary internals remain `UNKNOWN`.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. All required headings and plug-in
  rows are complete; consequential public-evidence gaps are explicit.

## 1. Executive summary

Cool Edit Pro's historically distinctive model was a deliberately visible
division between a single-waveform **Edit View** and a reference-based
**Multitrack View**. Edit View used what the manual called delayed-destructive
editing backed by temporary data and multilevel undo; Multitrack manipulated
blocks/images and real-time processing without changing the referenced media
until bounce or an explicit waveform edit. (C-006, C-008, C-019)

CEP 2.0 scaled the multitrack side to 128 stereo tracks, added track and bus
effects racks, as many as 26 buses, real-time EQ, looping, and block envelopes.
Its documented engine continuously built background mixes, exposed progress in
a Mix Gauge, generated a mix per used output pair, and could “lock” a processed
track into the background mix to reduce live CPU load. The scheduling,
threading, cache layout, and process topology behind those behaviors are
proprietary and `UNKNOWN`. (C-005, C-007, C-009, C-024)

The third-party hosting headline is narrow but unusually clear by historical
standards: CEP 1.2a documented ActiveMovie/DirectX plug-ins; CEP 2.0 documented
DirectX audio effects in Edit View and real-time racks plus a manual “Refresh
Effects List” scan; CEP 2.1 improved third-party DirectX compatibility and
added a global enable/disable control. It also had native `.xfm` transform and
`.flt` file-filter SDK surfaces. No in-scope source documents DirectX
instruments/DXi. (C-013, C-016)

VST requires careful classification. No retained Syntrillium CEP source names
VST, Adobe described its first Audition release as functionally equivalent to CEP 2.1, and
Adobe then advertised VST effects as a *new* Audition 1.5 feature. The bounded
conclusion that CEP through 2.1 did not host VST is therefore a high-confidence
**INFERENCE**, not a direct Syntrillium unsupported-format statement. The other
required formats have no positive in-scope evidence and remain `UNKNOWN`
rather than being inferred absent from a logo list. (C-014, C-015, C-026)

Persistence was lightweight but fragile: a small `.ses` file stored placement,
mix, track, and real-time-effect references while media remained external.
“Save copies of all associated files” collected media beside the session and
could convert format/sample rate. The manual warned that externally moving a
referenced file broke the reference. Autosave, atomic save, missing-plug-in
placeholders, detailed relinking, session schema, and 2.x crash-recovery
behavior remain `UNKNOWN`; only the 1.2a product page advertised crash
recovery. (C-018, C-020, C-021)

**Architecture confidence:** high for user-visible CEP 2.0/2.1 workflow,
routing, persistence, and DirectX surface; medium for historical negative
format conclusions; low for proprietary engine and plug-in internals.

## 2. Product identity, history, and market position

Syntrillium positioned Cool Edit Pro as a Windows digital audio editor,
recorder, and mixer for music, radio/broadcast, project-studio, and audio-for-
video work. The January 2002 product page still identified 1.2a as current at
$399 and 64 tracks, while an April 2003 page identified CEP 2.0 at $249 and 128
tracks. Syntrillium released 2.1 on 2003-04-08. (C-001, C-003, C-004, C-005)

CEP 2.1 was the final in-scope Syntrillium version. Syntrillium announced an
agreement to sell its technology assets to Adobe on 2003-05-16. Adobe's July
2003 launch announcement said Audition had previously been named Cool Edit Pro
2.1 and was functionally equivalent to it; later Audition development is not
part of this dossier. (C-002, C-026)

The terminal FAQ distinguishes Cool Edit Pro from the cheaper Cool Edit 2000
line and offered downloadable and boxed copies, upgrade pricing, a PDF/printed
manual distinction, and vendor support. This dossier does not merge Cool Edit
2000 plug-ins or optional features into CEP. (C-003)

## 3. Workflow and conceptual model

The central mental model was “two major audio programs in one”: (1) a
single-waveform editor for sample-level selection, restoration, analysis,
effects, and generation, and (2) a linear multitrack session for recording,
arrangement, mixing, looping, MIDI-file playback, and video soundtrack work.
Users could double-click a multitrack block to send its media to Edit View.
(C-006, C-008)

Multitrack objects were described as **images**—playback instructions referring
to original media—and **blocks**, the visual instances of audio, MIDI, or video
soundtracks. Repeating an image did not duplicate source audio. A session was a
single linear timeline; there is no documented scene launcher, modular patch
graph, notation document, or tracker grid. (C-008, C-029)

CEP 2 added session tempo/key matching and loop painting, while 2.1 added a
hybrid loop-stretch mode. These are loop-arrangement tools, not evidence of a
general modern elastic-audio/warp-marker engine. (C-023)

## 4. Publicly documented architecture

The public manual documents behavioral components, not implementation modules:

- Edit View temporarily backed changes and delayed destructive writes until a
  user saved the waveform; Multitrack edits and real-time effects were
  reference/instruction based. (C-006, C-019)
- A background-mixing subsystem continuously incorporated changed blocks,
  volume, new recordings, and routing into one mix per active output pair; a
  Mix Gauge exposed completion. (C-007)
- Track/bus effects racks, output-device/bus assignment, a mixer window, and
  track Lock controls were user-visible graph boundaries. (C-009)
- `.ses` was the user-visible persistence boundary and referenced external
  media. (C-018)
- Plug-in extension boundaries were DirectX audio effects plus Syntrillium
  `.xfm` and `.flt` SDK types. (C-013, C-016)

`UNKNOWN`: executable/process separation, internal graph representation,
worker-thread model, real-time priority policy, multicore scheduling, memory
ownership, disk-cache format, IPC, and whether third-party code executed on the
audio callback. Public behavior does not establish those internals. (C-024)

One manual inconsistency is retained: its “Working Philosophy” says an opened
waveform is copied to a temporary folder, while “Flush Virtual File” says
waveforms are initially used directly and moved to temp when needed. Both agree
that edit/undo work consumed temp storage, but the exact lazy-copy strategy is
`UNKNOWN`. (C-019)

## 5. Audio engine

CEP 2 documented full 32-bit internal processing, 32-bit sample-resolution
files, and support for 24-bit/192 kHz and higher. New sessions selected a sample
rate and bit resolution; inserted material had to match or be converted.
(C-005)

The manual's real-time path combined track/bus EQ and effects with continuous
background mixing. Insufficient background progress or excessive real-time
effects could produce audible breakup; users could wait for the Mix Gauge or
Lock affected tracks so processing was incorporated into the background mix.
Bypass removed a track rack's CPU use. A separate Load Meter reported available
CPU capacity. (C-007, C-009)

Offline/destructive effects were applied in Edit View. “Mix Down to Track
(Bounce)” rendered all or selected unmuted waveforms, including loops, images,
effects, and envelopes, into a mono or stereo file; file mixdown and video
mixdown were also documented. (C-022)

`UNKNOWN`: hardware block/buffer negotiation beyond Windows device dialogs,
internal accumulation precision beyond the “32-bit processing” statement,
multicore use, plug-in delay compensation, latency/tail reporting, automatic
dropout recovery, oversampling, deterministic offline rendering, and whether
offline and real-time plug-in paths were bit-equivalent. (C-017, C-024)

## 6. Tracks, timeline, clips, and editing

CEP 2 provided 128 stereo multitrack lanes. Blocks could be inserted, moved,
copied, split, non-destructively edge-trimmed, looped, and adjusted in volume
and pan while source media remained unchanged. Edit View offered horizontal and
vertical zoom to samples, waveform and spectral displays, cues/playlists,
zero-crossing adjustment, restoration, and destructive-style cut/paste/effect
operations protected by delayed write and undo. (C-005, C-006, C-008)

Volume and pan envelopes were attached to blocks and supported straight or
spline interpolation. Wet/dry and selected native effect-parameter envelopes
were added in 2.0. (C-010)

Punch recording could preserve alternate takes in a block's Take History.
Those takes were actual waveform files on disk; selecting/merging a punch take
could become destructive to the waveform. This was take switching, not a
documented lane-based comp editor. (C-011)

`UNKNOWN`: arbitrary track counts beyond 128, folder tracks, ripple editing,
phase-coherent grouped editing, clip gain distinct from block volume,
crossfade-object persistence, full tempo maps for audio, and project-level edit
versioning. (C-024)

## 7. MIDI, sequencing, notation, and expression

CEP 2.0 added **MIDI file playback** in Multitrack View. MIDI files could be
inserted as blocks and assigned output devices; a block volume envelope altered
note velocity, and its tempo envelope was display-only. PC commands could be
mapped to MIDI notes/controller values. (C-012, C-029)

The product could operate as SMPTE/MTC master or slave and 2.1 advertised
improved chase accuracy. This supported synchronization with external MIDI and
video systems rather than proving a complete MIDI sequencer. (C-012, C-023)

`UNKNOWN`: MIDI performance recording into editable clips, piano roll, event
list, notation, SysEx editing, quantization, MIDI effects, hosted instruments,
MPE/per-note expression, MIDI 2.0, and sample-accurate MIDI dispatch. The manual
only establishes file playback, routing, velocity-envelope behavior, command
triggers, and synchronization. (C-029)

## 8. Routing, mixer, automation, and control

Tracks exposed input device, output device/bus, volume, pan, mute, solo, EQ,
record arm, rack, and Lock controls. Multiple Windows-compatible multi-channel
sound cards were supported. Output could target a physical pair or one of up to
26 buses; buses had output selection, volume/pan/EQ properties, ordered real-
time racks, and presets. (C-005, C-009)

CEP 2.1 made the master fader selectable before buses/bus effects or at the end
of the signal chain. This is a documented routing-order choice, not evidence of
an arbitrary user-editable graph. (C-023)

Automation was block-centric: volume, pan, wet/dry, and selected native dynamic
effect parameters were envelopes. The sources do not document write/touch/
latch modes, track-wide automation lanes, stable third-party parameter IDs, or
sample-accurate automation. DirectX plug-ins could be assigned keyboard/MIDI
shortcuts, but this does not establish parameter automation. (C-010, C-017)

Control surfaces included Syntrillium Red Rover and, by 2.1, Mackie Control,
Tascam US-224/US-428, and Event EZbus references; 2.1 also announced a controller
SDK. Protocol and stability details are `UNKNOWN`. (C-023)

`UNKNOWN`: sends/returns distinct from output buses, pre/post sends, feedback
routing, sidechains, VCA/folder controls, arbitrary channel layouts in the main
mixer, OSC, and remote-network APIs. (C-017, C-024)

## 9. Recording, comping, and media handling

Multitrack recording supported per-track device selection, mono-left,
mono-right, or stereo capture, and 16- or 32-bit recording choices. Continuous
linear, loop-while-recording, punch-in, timed recording, and multiple takes were
documented. (C-011)

CEP worked with many audio formats; the official overview specifically names
WAV, AU, AIFF, MP3, and later WMA features. It could rip CD audio, extract audio
from video, display a video window, and save a mixed soundtrack back to video.
Wave properties included cues/loops, text, EBU fields, and, in 2.1, broadcast
cart-chunk editing. (C-005, C-012, C-023)

Media management was path/reference based. “Save copies of all associated
files” collected copies and optionally normalized their format and sample rate,
but the manual warned that externally moving a referenced file meant CEP would
not know the new location. A robust asset database, content-addressed media,
proxy/conform workflow, and documented relink search are `UNKNOWN`. (C-018)

## 10. Instruments, effects, content, and native devices

CEP 2 advertised more than 45 DSP, mastering, analysis, and restoration tools.
The manual classified processing into real-time effects (usable in Multitrack
racks and also as Edit View processing), offline Edit View effects, and a small
set of Multitrack-only operations such as vocoder/frequency-band splitting.
Native real-time racks could be ordered, bypassed, named, preset, and locked.
(C-009, C-028)

Loopology content and session tempo/key matching supported loop-based music
construction. The product also generated silence, noise, tones, and DTMF, but
there is no evidence of a hosted native software-instrument architecture,
sampler device, device rack with arbitrary modulation, or instrument preset
ecosystem. (C-023, C-029)

The product-native developer surface was `.xfm` transform effects and `.flt`
file filters; the public SDK landing page did not document its ABI or legal
terms. (C-016, C-030)

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means no positive or safely obtained direct negative evidence was
found for terminal CEP 2.1. Platform cells are explicit because CEP 2.x was a
Windows-only product. (C-003, C-015)

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | NOT_APPLICABLE: no macOS CEP | UNKNOWN: high-confidence inference of no hosting | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | CEP 1.2a, 2.0, 2.1; first Audition release/1.5 only as lineage discriminator | No Syntrillium source names VST; Adobe said its first Audition release was functionally equivalent to CEP 2.1 and called VST effects new in Audition 1.5. This is an inference, not a direct unsupported statement. | C-014; S-001, S-003, S-007, S-010, S-011 |
| VST3 | NOT_APPLICABLE: no macOS CEP | UNKNOWN: no in-scope evidence | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | Terminal CEP 2.1 (2003) | Not named in retained CEP documentation; no format-logo inference. | C-015; S-005, S-007 |
| AUv2 | NOT_APPLICABLE: no macOS CEP | UNKNOWN: no in-scope evidence | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | Terminal CEP 2.1, Windows only | No positive hosting evidence. | C-015; S-014 |
| AUv3 | NOT_APPLICABLE: no macOS CEP | UNKNOWN: no in-scope evidence | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | Terminal CEP 2.1, Windows only | No positive hosting evidence. | C-015; S-014 |
| AAX | NOT_APPLICABLE: no macOS CEP | UNKNOWN: no in-scope evidence | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | Terminal CEP 2.1 | No positive hosting evidence. | C-015; S-005, S-007 |
| CLAP | NOT_APPLICABLE: no macOS CEP | UNKNOWN: no in-scope evidence | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | Terminal CEP 2.1 | No positive hosting evidence. | C-015; S-005, S-007 |
| LV2 | NOT_APPLICABLE: no macOS CEP | UNKNOWN: no in-scope evidence | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | Terminal CEP 2.1 | No positive hosting evidence. | C-015; S-005, S-007 |
| LADSPA | NOT_APPLICABLE: no macOS CEP | UNKNOWN: no in-scope evidence | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | Terminal CEP 2.1 | No positive hosting evidence. | C-015; S-005, S-007 |
| DSSI | NOT_APPLICABLE: no macOS CEP | UNKNOWN: no in-scope evidence | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | Terminal CEP 2.1 | No positive hosting evidence. | C-015; S-005, S-007 |
| JSFX | NOT_APPLICABLE: no macOS CEP | UNKNOWN: no in-scope evidence | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | Terminal CEP 2.1 | No positive hosting evidence. | C-015; S-005, S-007 |
| DirectX/DXi | NOT_APPLICABLE: no macOS CEP | DOCUMENTED: DirectX audio effects; UNKNOWN: DXi instruments | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | ActiveMovie/DirectX in 1.2a; DirectX Edit/rack use in 2.0; improved support and global enable/disable in 2.1 | Effects only are evidenced. No source establishes DXi instruments, MIDI/event I/O, sidechains, or multi-output. | C-013, C-017; S-001, S-003, S-007, S-013 |
| Rack Extension | NOT_APPLICABLE: no macOS CEP | UNKNOWN: no in-scope evidence | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | Terminal CEP 2.1 | No positive hosting evidence. | C-015; S-005, S-007 |
| Product-native/other | NOT_APPLICABLE: no macOS CEP | DOCUMENTED: `.xfm` transform effects and `.flt` file filters | NOT_APPLICABLE: no Linux CEP | NOT_APPLICABLE: no mobile/web CEP | Terminal CEP 2.x SDK page | Public landing page names extension types but not ABI, lifecycle, isolation, state, or licensing terms. | C-016, C-030; S-013 |

### 11.2 Discovery, scanning, validation, and recovery

For CEP 2.0, a correctly installed DirectX audio plug-in automatically appeared
under `Effects > DirectX`; `Effects > Refresh Effects List` scanned the system
for new native effects and DirectX plug-ins. CEP 2.1 added the ability to enable
or disable DirectX support globally. (C-013)

`UNKNOWN`: exact registry/discovery locations, search-path UI, scan timing,
cache persistence, duplicate identity, version replacement, validation probes,
blacklist/quarantine, per-plug-in disable, safe-mode startup, scan logs, and
automatic rescan after failure. The archived KB search surface was found, but
its POST result pages were not replayable and exact-site searches returned no
relevant DirectX/recovery article. (C-017; S-012)

### 11.3 Runtime isolation and compatibility

No retained source states whether DirectX or `.xfm` code ran in the CEP process,
on a dedicated thread, or in a helper process. There is no public evidence of
sandboxing, crash containment, watchdogs, architecture bridging, code-signing
checks, quarantine, or per-plug-in compatibility modes. These are `UNKNOWN`,
not inferred from the age of the product. (C-017, C-024)

CEP 2.1's “greater support” for third-party DirectX plug-ins documents a
compatibility improvement but does not specify which contracts changed or
which failures were fixed. (C-013)

### 11.4 Host/plugin processing contract

CEP 2.0 documented DirectX **audio effects** in the Edit View effect workflow
and included all DirectX effects among its real-time effects for Multitrack
racks/buses. Effects racks were ordered, could be bypassed, and were reflected
in bounce. The manual says some DirectX effects might support real-time preview
and refers proprietary Properties behavior to the plug-in vendor. (C-013)

There is no evidence for instruments, MIDI/event buses, sidechains, multiple
audio buses, dynamic I/O, note expression, sample-accurate automation,
latency/tail reporting, suspend, or host-provided oversampling. Whether every
installed DirectX effect was genuinely real-time safe is also `UNKNOWN`; the
manual is a host capability statement, not independent qualification. (C-017)

### 11.5 Parameters, automation, state, presets, and project recall

Track/block wet-dry envelopes could vary the overall rack mix over time.
Selected Syntrillium dynamic effects exposed specific FX parameter envelopes,
but no source says arbitrary DirectX parameters were automatable or how
parameter IDs/ranges/text were represented. (C-010, C-017)

The `.ses` description says sessions retained which real-time effects were
used. It does not specify whether DirectX state chunks, per-parameter values,
vendor presets, assets, or opaque state were serialized; nor does it describe
missing-plug-in placeholders, migrations, or partial recovery. Full plug-in
recall is therefore `UNKNOWN`. (C-017, C-018)

Bus/rack presets and ordered effect lists are documented at the host UI level,
but their on-disk representation and portability are proprietary. (C-009,
C-017)

### 11.6 UI, diagnostics, and failure modes

DirectX effects appeared in host menus/racks and normally exposed a settings or
Properties dialog. The manual does not establish whether vendor UIs were
embedded, detached, generic, resizable, scalable, or headless-capable. (C-013,
C-017)

Host diagnostics documented for overall multitrack load were a Mix Gauge and
Load Meter. No plug-in-specific CPU meter, scan report, crash attribution,
blacklist notice, or missing-plug-in diagnostic was found. A direct plug-in
failure could therefore only be classified `UNKNOWN` from public evidence.
(C-007, C-017)

## 12. Extensibility and integration

CEP supported scripts and batch processing for repeatable waveform operations,
batch conversion, customizable keyboard shortcuts, MIDI-triggered commands,
favorites, and dockable UI organization. (C-027)

The public developer page offered a CEP SDK for `.flt` file filters and `.xfm`
transform effects and identified DirectX as the third-party standard. CEP 2.1
also announced a controller SDK and support for several named hardware
controllers. (C-016, C-023)

`UNKNOWN`: SDK ABI/version guarantees, redistributable headers, sample-code
license, signing requirements, binary compatibility across CEP versions,
controller protocol, scripting language grammar, headless execution, and any
stable command/action identifier scheme. The SDK package was not downloaded or
copied. (C-030)

## 13. Project format, persistence, interoperability, and collaboration

The `.ses` session was a small reference document containing media placement,
track names, mix/pan, mute/solo, and real-time-effect usage, while waveform,
MIDI, and video assets stayed external. Open Session loaded the session plus
associated audio; Append to Session placed another compatible session on new
tracks. A session had one active sample-rate/bit-resolution context. (C-018)

“Save copies of all associated files” copied assets into the session folder;
optional save settings converted file format and sample rate. This was an
explicit collect/package operation, not an always-self-contained project.
Externally moving media could invalidate references. (C-018)

Waveform undo data lived in temporary files and could be retained in multiple
levels subject to disk space; closing files or exiting removed temp data.
Multitrack arrangement edits were non-destructive and did not need waveform
undo temp copies. (C-019)

The CEP 1.2a product page advertised crash recovery, but no accessible source
defines its algorithm, recovered object set, or whether CEP 2.0/2.1 retained
the behavior. Autosave intervals, atomic/session journaling, backup rotation,
recovery after plug-in crashes, forward/backward `.ses` compatibility, and
missing-dependency placeholders are `UNKNOWN`. (C-020, C-021)

Interchange was primarily rendered/imported media (audio formats, MIDI-file
playback, and video soundtrack import/export). No public evidence was found for
AAF, OMF, MusicXML, ADM, DAWproject, cloud collaboration, or version-control
integration. CEP 2.1 could produce multichannel WMA, interleaved six-channel
WAV, or six mono files for 5.1 delivery. (C-015, C-022)

## 14. Delivery, live, post-production, and specialized workflows

CEP could bounce selected/all waves to track, mix down mono/stereo files, batch
convert/process, normalize groups for consistent loudness, edit AVI
soundtracks, and save a mixdown to video. SMPTE/MTC master/slave support and
broadcast metadata fields made it relevant to radio and audio-for-video work.
(C-012, C-022, C-027)

CEP 2.1's Multichannel Encoder panned tracks/buses to 5.1, previewed through a
multichannel DirectSound driver, and exported 5.1 WMA, interleaved six-channel
WAV, or six mono WAV files. The site also described a beta disc-at-once CD-
burning plug-in; beta availability is not treated as a stable core engine
contract. (C-022, C-025)

No evidence establishes DDP, ADM/immersive object audio, loudness-standard
compliance, ADR cue systems, show control, or a dedicated live-performance
mode. (C-015)

## 15. Performance, reliability, security, and accessibility

Performance controls were user-visible and disk/CPU oriented: Mix Gauge,
Load Meter, configurable primary/secondary temp drives and reserve space,
manual undo cleanup, effect bypass, and Lock-to-background-mix. CEP 2.1
advertised faster background mixing. (C-007, C-009, C-019, C-023)

Minimum CEP 2.x requirements were Windows 98/Me/2000/XP, 233 MHz CPU, 64 MB
RAM, 55 MB disk, 800x600 display, stereo sound card, and CD-ROM; recommended
figures were 700 MHz, 128 MB RAM, and 1024x768. Surround preview additionally
required DirectX 8 and a multichannel DirectSound driver. (C-025)

Reliability evidence is limited to temp-backed undo, save prompts, the 1.2a
crash-recovery claim, and resource meters. Plug-in crash containment, project
journaling, and 2.x recovery remain `UNKNOWN`. (C-017, C-020, C-021)

Security/update signing, rollback, telemetry/privacy behavior, formal screen-
reader support, keyboard-only conformance, high-DPI scaling, and accessibility
testing are `UNKNOWN`. Custom shortcuts and dockable windows are usability
features, not evidence of accessibility compliance. (C-024, C-027)

## 16. Licensing, ecosystem, and implementation constraints

CEP was proprietary commercial software supplied under a license agreement;
the manual expressly restricted copying to the agreement's terms. The terminal
FAQ documented paid download/boxed products and upgrades. Syntrillium later
agreed to sell its technology assets to Adobe. (C-002, C-003)

The public SDK page proves availability of `.flt`/`.xfm` authoring material and
points developers to Microsoft for DirectX development, but it does not provide
the SDK license, redistribution terms, trademark rules, compatibility marks,
or certification obligations. Those constraints are `UNKNOWN`; naming a
format grants no right to implement, redistribute, or claim compatibility.
(C-030)

Any clean-room successor should specify behavior independently and negotiate
current format rights separately. This dossier does not reproduce SDK code,
manual expression, UI assets, `.ses` internals, or legal advice.

## 17. Strengths, liabilities, and architecture lessons

**Strengths evidenced:**

- Clear separation between waveform surgery and non-destructive arrangement
  made mutation scope visible to users. (C-006)
- Lightweight block images enabled looping/reuse without media duplication.
  (C-008)
- Continuous background mixing, visible readiness, and explicit Lock provided
  an understandable performance-degradation path on limited hardware.
  (C-007, C-009)
- Track/bus racks and envelopes brought real-time mixing into an editor without
  abandoning a strong sample editor. (C-009, C-010)
- Explicit collect/copy with optional conversion addressed session portability
  at a user-visible boundary. (C-018)

**Liabilities or unsuitable reference points:**

- External path references were fragile after files moved, and no durable
  relink/placeholder behavior is documented. (C-018)
- The plug-in ecosystem was effectively DirectX-effects-centric; full host
  contract fidelity, isolation, and diagnostics are undocumented. (C-013,
  C-017)
- “Lock” reduced load but made the track temporarily non-editable, coupling
  optimization to workflow interruption. (C-009)
- MIDI was playback/synchronization oriented rather than a documented full
  composition model. (C-029)
- Recovery, schema migration, security, and accessibility evidence is too thin
  for CEP to serve as a modern reliability reference. (C-021, C-024)

The product is therefore a strong interaction/workflow reference and a weak
reference for modern plug-in security, durable persistence, or cross-platform
engine internals.

## 18. Transferable patterns

| Pattern | Problem and minimal mechanism | Supporting claims | Prerequisites | Tradeoffs and adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Dual waveform/session workspaces | Make destructive sample surgery distinct from reference-based arrangement; open the same media from a block in a dedicated editor. | C-006, C-008 | Shared media identity, explicit dirty state, undo boundary | Context switching and conflicting edits require modern synchronization/version rules. | CANDIDATE |
| Visible background-render readiness | Continuously precompute changed graph regions, show readiness, and allow playback before full completion with diagnostics. | C-007 | Incremental invalidation, real-time fallback, deterministic cache keys | Partial readiness can cause dropouts; never conceal stale audio. | CONDITIONAL |
| Explicit lock/freeze contract | Replace expensive live processing with a reversible rendered cache and clearly disable incompatible edits until thawed. | C-009, C-022 | Versioned source graph, cache invalidation, transactional thaw | CEP's opaque background mix should not be copied; modern adaptation needs explicit provenance and plug-in-state safety. | CANDIDATE |
| Block-local envelope layers | Put volume, pan, and effect-mix curves directly on the audible object with optional curves. | C-010 | Stable time coordinates, automation composition rules | Dense overlays can obscure clips; selected-parameter automation does not scale to arbitrary plug-ins. | CANDIDATE |
| Reference project plus explicit collect | Keep projects small by referencing media, but provide a deterministic collect/copy/conversion command. | C-018 | Asset manifest, checksums, relink search, collision policy | CEP's path fragility is unacceptable without content identity and missing-asset placeholders. | CONDITIONAL |
| Ordered track/bus effect racks | Give tracks and buses an ordered processing chain, properties, presets, bypass, and one explicit output target. | C-009, C-013 | Defined graph/latency rules and robust plug-in lifecycle | CEP evidence does not answer sidechains, dynamic I/O, PDC, or failure isolation. | CONDITIONAL |

## 19. Rejected patterns and CURIOSITY_NO_GO

**Rejected for adaptation:**

- Bare external path references without durable media IDs, relink search, or
  placeholders. Reopen only if a clean-room prototype adds explicit asset
  identity and migration tests. (C-018)
- Treating a format menu entry as proof of a full host contract. DirectX effect
  loading does not establish instruments, sidechains, PDC, automation fidelity,
  state, or isolation. (C-013, C-017)
- Relying on temp files deleted at close/exit as project history or crash-safe
  versioning. Reopen only with journal/atomic-save evidence. (C-019, C-021)
- Copying the undocumented `.ses` representation or proprietary SDK ABI.
  Clean-room behavior can be studied; protected internals cannot. (C-024,
  C-030)

**`CURIOSITY_NO_GO` threads:**

- `CURIOSITY_NO_GO`: brute-force retrieval of every untitled archived KB ID.
  The search endpoint's POST results were not replayable; expected evidence per
  fetch was low and the two-source pass rule made enumeration disproportionate.
- `CURIOSITY_NO_GO`: run CEP installers, plug-ins, or old Windows images to
  inspect behavior. This exceeds the documentary/safety boundary and would not
  establish licensable modern compatibility.
- `CURIOSITY_NO_GO`: reverse engineer `.ses`, `.xfm`, or `.flt` binaries. This
  is unnecessary for workflow conclusions and outside the clean-room contract.
- `CURIOSITY_NO_GO`: broaden into Audition after 1.5. First-release/1.5 evidence
  was retained only to prove lineage and discriminate when VST first appeared.
- `CURIOSITY_NO_GO`: deeper Red Rover/controller SDK protocol research. It has
  low expected impact on the product/plug-in/persistence architecture decision.
- `CURIOSITY_NO_GO`: detailed 5.1 encoder mathematics and beta CD-writer
  internals. Export topology is covered; codec implementation would not change
  the leading hypotheses.
- `CURIOSITY_NO_GO`: separate format-owner chronology for every later plug-in
  format. The matrix honestly remains `UNKNOWN`; absence from a 2003 product is
  not converted into unsupported claims without decision-relevant evidence.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and result | Classification/disposition | Later discriminating probe |
| --- | --- | --- | --- |
| H-01: CEP 2.x was wholly non-destructive. | Manual explicitly separates delayed-destructive Edit View from non-destructive Multitrack. | Rejected; C-006. | None needed. |
| H-02: `.ses` was self-contained. | Manual says sessions were small reference files and warns that moving media breaks references; collect/copy was optional. | Rejected; C-018. | Safe fixture could compare original and collected folder manifests, but not needed for the conclusion. |
| H-03: CEP 2.1 hosted VST. | CEP sources repeatedly name DirectX; the first Audition release was functionally equivalent to CEP 2.1; Audition 1.5 calls VST new. | High-confidence contrary inference; C-014. | Only an official CEP unsupported-formats statement or lawful disposable CEP fixture would raise confidence to documented/observed. |
| H-04: DirectX acceptance proves a complete modern host contract. | Sources establish effect listing/racks/preview only; buses, instruments, PDC, state, sidechains, isolation, and recovery are absent. | Rejected as overclaim; C-013, C-017. | Later disposable effect fixtures would separately test scan, instantiate, process, automate, save/reopen, fail, and render. |
| H-05: every installed DirectX plug-in was validated and safe. | Manual says correctly installed effects automatically appeared and could be rescanned; no validation or quarantine evidence. | Unsupported; C-017. | Use malformed and crashing fixtures only in an authorized isolated harness. |
| H-06: CEP 2.x retained the 1.2a crash-recovery system. | 1.2a page advertises recovery; 2.0 manual and 2.1 pages do not define or confirm it. | `UNKNOWN`; C-020, C-021. | Obtain an official 2.1 support article or lawful manual supplement; avoid inferring from Audition. |
| H-07: plug-in state was fully serialized in `.ses`. | Manual says sessions retained which real-time effects were used, not the complete vendor state contract or missing-plug-in behavior. | `UNKNOWN`; C-017, C-018. | Save/reopen with a stateful DirectX fixture and inspect only behavior, not proprietary bytes. |
| H-08: “format accepted,” “scanned,” “instantiated,” and “full contract works” are equivalent. | CEP documentation distinguishes installation appearance, refresh scan, use in effects workflow, and optional preview but does not qualify all contract dimensions. | Rejected; C-013, C-017. | Test each stage separately in any later interoperability lab. |

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | CEP 2.1 was released 2003-04-08 and was the terminal Syntrillium version in scope. | CEP 2.1 | S-005, S-006 | Official archived release notice and product page. | Capture after acquisition retains Adobe footer; release date/content are Syntrillium-origin pages. |
| C-002 | DOCUMENTED | High | Syntrillium announced on 2003-05-16 that it agreed to sell its technology assets to Adobe. | Corporate/product lineage | S-008 | Direct vendor transition notice. | Does not disclose transaction terms or source ownership details. |
| C-003 | DOCUMENTED | High | CEP was a proprietary commercial Windows product, distinct from Cool Edit 2000, distributed as download/box with paid upgrades. | CEP 1.2a–2.1 | S-002, S-009 | Official product/FAQ and manual license statement. | Regional pricing and all historical editions are not exhaustively covered. |
| C-004 | DOCUMENTED | High | CEP 1.2a provided up to 64 tracks, DirectX/ActiveMovie support, track amplitude/pan envelopes, scripts/batch, MIDI/SMPTE sync, and advertised crash recovery. | CEP 1.2a | S-001, S-002 | Dated official features/product page. | Vendor capability statements are not independent runtime tests. |
| C-005 | DOCUMENTED | High | CEP 2.0 expanded to 128 stereo tracks, 32-bit internal processing, real-time effects, buses, loops, MIDI playback, and video support. | CEP 2.0 | S-003, S-004, S-007 | Official manual plus product/change pages. | “Higher than 192 kHz” is vendor-documented, not measured. |
| C-006 | DOCUMENTED | High | Edit View used delayed-destructive waveform editing; Multitrack edits and real-time effects were non-destructive. | CEP 2.0 | S-003 | Manual “Working Philosophy,” pp. 28–29. | Exact lazy temp-copy behavior is internally inconsistent elsewhere in the manual. |
| C-007 | DOCUMENTED | High | CEP continuously created background mixes, exposed a Mix Gauge, and produced separate mixes per used output pair. | CEP 2.0 | S-003 | Manual “Working Philosophy,” pp. 29–30. | Threading and cache implementation are not disclosed. |
| C-008 | DOCUMENTED | High | Multitrack images/blocks were playback instructions referencing original media; `.ses` represented one session. | CEP 2.0 | S-003 | Manual pp. 244–245 and 280. | Internal object/schema representation is unknown. |
| C-009 | DOCUMENTED | High | CEP 2.0 had ordered track/bus racks, up to 26 buses, output assignment, bypass, presets, and Lock-to-background-mix. | CEP 2.0 | S-003 | Manual pp. 247–249, 277–279, 293–294. | Sidechains, feedback, arbitrary sends, and PDC are not documented. |
| C-010 | DOCUMENTED | High | Multitrack blocks exposed volume, pan, wet/dry, and selected native effect-parameter envelopes, with spline support. | CEP 2.0 | S-003, S-007 | Manual pp. 287–288 and official change page. | Does not establish arbitrary DirectX parameter automation or sample accuracy. |
| C-011 | DOCUMENTED | High | CEP supported linear/loop/punch recording and disk-backed alternate takes with Take History. | CEP 2.0 | S-003 | Manual recording and Take History sections. | No lane-based comp editor is documented. |
| C-012 | DOCUMENTED | High | CEP 2 supported MIDI-file playback, per-track MIDI output, video soundtrack work, and SMPTE/MTC master/slave synchronization. | CEP 2.0/2.1 | S-003, S-007 | Manual and 2.1 change page. | Full MIDI sequencing/recording is not established. |
| C-013 | DOCUMENTED | High | CEP 1.2a–2.1 hosted DirectX audio effects; 2.0 auto-listed correctly installed effects and had Refresh Effects List; 2.1 improved support and global enable/disable. | CEP 1.2a–2.1, Windows | S-001, S-003, S-007, S-013 | Versioned official documentation. | Does not establish DXi or complete host-contract fidelity. |
| C-014 | INFERENCE | High | Syntrillium CEP through 2.1 did not host VST effects. | CEP through 2.1 | S-001, S-003, S-007, S-010, S-011 | CEP sources specify DirectX; Adobe's first Audition release was functionally equivalent to CEP 2.1; VST was advertised new in Audition 1.5. | No direct Syntrillium “VST unsupported” statement; wrappers or undocumented behavior are plausible alternatives. |
| C-015 | UNKNOWN | High | Hosting status for VST3, AU, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, and Rack Extension is not established by retained in-scope sources. | Terminal CEP 2.1 | S-005, S-007, S-014 | Explicit negative-results rule. | Historical format chronology was not separately sourced; no unsupported claim is made. |
| C-016 | DOCUMENTED | High | CEP exposed `.xfm` transform-effect and `.flt` file-filter SDK types. | CEP 2.x | S-013 | Official SDK landing page. | SDK package/ABI not inspected. |
| C-017 | UNKNOWN | High | Plug-in isolation, validation, cache, duplicate identity, blacklisting, latency/tails, arbitrary automation, complete state, missing-plug-in recovery, and detailed UI contract are undisclosed. | CEP 2.0/2.1 host | S-003, S-007, S-012, S-013 | Manual/page review plus inaccessible KB result search. | A later safe dynamic fixture could observe behavior, but not prove internals. |
| C-018 | DOCUMENTED | High | `.ses` stored arrangement/mix/effect references but not media; collect/copy could place associated files beside it and convert format/sample rate. | CEP 2.0 | S-003 | Manual pp. 29–30 and 280–284. | Relink, schema, migration, and atomic save are not documented. |
| C-019 | DOCUMENTED | High | Waveform undo used disk temp files subject to space and was removed on close/exit; Multitrack arrangement undo was non-destructive. | CEP 2.0 | S-003 | Manual pp. 66–69 and multitrack Undo section. | Working-philosophy/Flush Virtual File descriptions conflict on initial copy timing. |
| C-020 | DOCUMENTED | Medium | CEP 1.2a's product page advertised crash recovery. | CEP 1.2a | S-002 | Direct official feature bullet. | No mechanism, qualification, or recovery scope is supplied. |
| C-021 | UNKNOWN | High | CEP 2.0/2.1 crash recovery, autosave, journaling, and recovery scope are not established. | CEP 2.x | S-003, S-005, S-007, S-012 | Manual and terminal pages reviewed; archived KB results unavailable. | Absence from reviewed docs is not proof of absence. |
| C-022 | DOCUMENTED | High | CEP could bounce/render arrangements; 2.1 added 5.1 panning/preview and WMA, six-channel WAV, or six-mono export. | CEP 2.0/2.1 | S-003, S-007, S-014 | Manual bounce section and 2.1 change/requirements pages. | Codec quality and internal surround algorithm are not independently measured. |
| C-023 | DOCUMENTED | High | CEP 2.1 improved background mixing, added hybrid loop stretch, pre/post-bus master placement, controller support/SDK, and cart metadata. | CEP 2.1 | S-007 | Official “What's new” page. | Marketing descriptions do not reveal implementation. |
| C-024 | UNKNOWN | High | Process topology, real-time scheduling, internal graph, multicore model, security, telemetry, and formal accessibility are proprietary or undocumented. | CEP 2.x | S-003, S-014 | Public documentation boundary. | User-visible behavior permits hypotheses, not internal claims. |
| C-025 | DOCUMENTED | High | CEP 2.x required Windows 98/Me/2000/XP; surround preview required DirectX 8 plus a multichannel DirectSound driver. | CEP 2.x/2.1 | S-014 | Official requirements page. | No compatibility claim for modern Windows. |
| C-026 | DOCUMENTED | High | Adobe's first Audition release had previously been named Cool Edit Pro 2.1 and was functionally equivalent to it. | Immediate post-acquisition lineage | S-011 | Adobe launch release. | Later Audition versions are excluded except C-014 chronology. |
| C-027 | DOCUMENTED | High | CEP provided scripts, batch processing/conversion, favorites, customizable shortcuts, and MIDI-triggered commands. | CEP 1.2a–2.0 | S-001, S-003 | Official features and manual. | Script language/API stability is unknown. |
| C-028 | DOCUMENTED | High | Native processing was user-visible as real-time, offline, and Multitrack-only effect classes with more than 45 tools. | CEP 2.0 | S-003, S-004 | Manual effect taxonomy and product page. | Inventory is architecture context, not independent quality assessment. |
| C-029 | UNKNOWN | High | A full MIDI recording/editing/notation or hosted-instrument architecture is not established. | CEP 2.0/2.1 | S-003, S-007 | Positive evidence is explicitly “MIDI playback,” file blocks, output, and sync. | Absence from one manual is not direct unsupported evidence. |
| C-030 | UNKNOWN | High | Native/controller SDK licensing, redistribution, ABI stability, signing, and certification terms are not established. | CEP 2.x SDKs | S-013 | Landing page names downloads without terms. | The SDK archive was intentionally not downloaded or copied. |

## 22. Source ledger and adaptive bibliography

All URLs were accessed 2026-08-29. Archive/search text was treated as untrusted
evidence. Sources are retained because each was decision-relevant and primary
or contained an official primary document.

- **S-001 — “Cool Edit Pro Features,” Syntrillium Software (archived
  2002-02-06).**
  URL: <https://web.archive.org/web/20020206233655id_/http://www.syntrillium.com/cep/features.html>.
  Kind/scope: official archived feature page, CEP 1.x. Relevant passage:
  32-bit processing/files, ActiveMovie/DirectX support, track amplitude/pan
  envelopes, scripts/batch, SMPTE/MTC. Supports C-004 and C-013. Limitation:
  marketing summary, no minor-version label on the page. Selected because it is
  a dated first-party pre-2.0 feature baseline and preferable to reviews.

- **S-002 — “Cool Edit Pro” product page, Syntrillium Software (archived
  2002-01-27).**
  URL: <https://web.archive.org/web/20020127152651id_/http://www.syntrillium.com/cep/>.
  Kind/scope: official archived product page, current version 1.2a. Relevant
  passage: 64 tracks, 24/96, crash recovery, $399, DirectX-era product context.
  Supports C-003, C-004, C-020. Limitation: high-level vendor claims and a page
  that simultaneously advertised forthcoming 2.0 news. Selected to pin the
  dated 1.2a version and the only located crash-recovery claim.

- **S-003 — *Cool Edit Pro 2.0 User's Manual*, Syntrillium Software, ©2002;
  Internet Archive scan.**
  URL: <https://archive.org/details/cool-edit-pro-2-manual>.
  Kind/scope: official primary manual text preserved in a user-contributed
  public scan; CEP 2.0. Key sections: Overview/What's New (pp. 5–10), Working
  Philosophy (pp. 28–30), DirectX (p. 148), Refresh Effects List (p. 193),
  Multitrack/buses/racks (pp. 243–294), sessions (pp. 280–284), envelopes
  (pp. 287–288), undo/takes/bounce. Supports C-003, C-005–C-013, C-017–C-019,
  C-022, C-024, C-027–C-029. Limitations: third-party scan provenance; OCR was
  used for location and checked against printed page context; manual has a
  temp-file wording inconsistency and does not prove runtime behavior. Selected
  as the most comprehensive accessible first-party technical source.

- **S-004 — “Cool Edit Pro 2.0” product page, Syntrillium Software (archived
  2003-04-02).**
  URL: <https://web.archive.org/web/20030402132359id_/http://www.syntrillium.com/cep/>.
  Kind/scope: official archived terminal-era product page immediately before
  2.1. Relevant passage: version 2.0, Windows OS list, 128 tracks, 32-bit,
  24/192+, DirectX/MIDI/video. Supports C-005, C-028. Limitation: marketing
  summary. Selected to triangulate manual claims and date the 2.0-to-2.1 edge.

- **S-005 — “Cool Edit Pro 2” product page, Syntrillium/Adobe transition site
  (archived 2003-06-06).**
  URL: <https://web.archive.org/web/20030606223523id_/http://syntrillium.com/cep/>.
  Kind/scope: archived official product page identifying current version 2.1
  and release/acquisition news. Supports C-001, C-015, C-021. Limitation:
  capture postdates the announcement and carries an Adobe footer. Selected
  because it explicitly pins terminal version 2.1 and Windows scope.

- **S-006 — “Cool Edit Pro 2.1 Released!”, Syntrillium News, 2003-04-08
  (archived).**
  URL: <https://web.archive.org/web/20030606223523id_/http://syntrillium.com/news/article.html?89>.
  Kind/scope: official release notice. Supports C-001. Limitation: delegates
  features to another page. Selected as the primary release-date origin rather
  than secondary software catalogs.

- **S-007 — “What's new with Cool Edit Pro version 2?”, Syntrillium Software
  (archived 2003-06-05).**
  URL: <https://web.archive.org/web/20030605105619id_/http://www.syntrillium.com/cep/whatsnew.html>.
  Kind/scope: official 2.1/2.0 change page. Relevant passages: 2.1 surround,
  background-mix, master-fader, controller, metadata, and DirectX improvements;
  2.0 effects/racks/envelopes/MIDI/bounce. Supports C-005, C-010, C-012–C-015,
  C-021–C-023, C-029. Limitation: change summary, not release notes with defect
  IDs. Selected because it is the strongest primary terminal-feature source.

- **S-008 — “Adobe acquires technology assets of Syntrillium,” Syntrillium
  News, 2003-05-16 (archived).**
  URL: <https://web.archive.org/web/20030524194954id_/http://www.syntrillium.com/news/article.html?91>.
  Kind/scope: first-party customer transition notice. Supports C-002. Limitation:
  transaction details and future product plans were expressly undecided.
  Selected as the claim origin for the acquisition boundary.

- **S-009 — “Cool Edit Pro FAQ,” Syntrillium Software (archived 2003-06-05).**
  URL: <https://web.archive.org/web/20030605105619id_/http://www.syntrillium.com/cep/faq.html>.
  Kind/scope: official terminal FAQ. Relevant passage: CEP vs Cool Edit 2000,
  Windows editions, price, download/box, upgrades, manuals, support. Supports
  C-003. Limitation: commercial FAQ, minimal architecture detail. Selected to
  prevent product-family/edition conflation.

- **S-010 — “Adobe Audition 1.5: New features,” Adobe Systems (archived
  2004-04-21).**
  URL: <https://web.archive.org/web/20040421175414id_/http://www.adobe.com/products/audition/newfeatures.html>.
  Kind/scope: official post-acquisition lineage discriminator only. Relevant
  passage: “VST plug-in support” presented as a top new 1.5 feature. Supports
  C-014. Limitation: not a CEP source and does not itself describe the first
  Audition release.
  Selected over inaccessible manuals because it is accessible primary evidence
  for the first later VST claim.

- **S-011 — “Adobe Adds Professional Audio … with Adobe Audition,” Adobe
  Systems press release, 2003-07-07 (archived).**
  URL: <https://web.archive.org/web/20030803201346id_/http://www.adobe.com/aboutadobe/pressroom/pressreleases/200307/070703AUDITION.html>.
  Kind/scope: official lineage announcement. Relevant passage: Audition was
  “Previously named Cool Edit Pro 2.1” and was “functionally equivalent” to it.
  Supports C-014 and C-026. Limitation: launch marketing, not source provenance
  or a binary-diff report. Selected because it directly closes the lineage
  reasoning chain.

- **S-012 — “Knowledge Base,” Syntrillium Support (archived 2003-06-07).**
  URL: <https://web.archive.org/web/20030607060802id_/http://support.syntrillium.com/kb/>.
  Kind/scope: official support search interface. Supports the attempted-method
  record for C-017/C-021. Limitation: its POST result pages were not replayable;
  no article content is used as evidence. Selected to document why deeper
  support claims remain unknown rather than silently omitted.

- **S-013 — “Cool Edit Pro SDK,” Syntrillium Software (archived 2003-06-05).**
  URL: <https://web.archive.org/web/20030605105619id_/http://www.syntrillium.com/cep/sdk.html>.
  Kind/scope: official developer landing page. Relevant passage: `.flt` file
  filters, `.xfm` transform effects, and DirectX as third-party standard.
  Supports C-013, C-016, C-030. Limitation: SDK package and terms were not
  retrieved. Selected as the narrow first-party extension-boundary source.

- **S-014 — “System Requirements for Cool Edit Pro version 2,” Syntrillium
  Software (archived 2003-06-05).**
  URL: <https://web.archive.org/web/20030605105619id_/http://www.syntrillium.com/cep/requirements.html>.
  Kind/scope: official 2.x/2.1 requirements page. Relevant passage: Windows and
  hardware requirements; DirectX 8/DirectSound requirement for multichannel
  preview. Supports C-003, C-015, C-025. Limitation: minimum/recommended claims
  are not modern compatibility tests. Selected to anchor platform and hardware
  scope.

**Access/negative-source record:** integrated web search repeatedly returned
HTTP 429; DuckDuckGo presented a human challenge; Bing exact-site searches did
not surface archived Syntrillium recovery/DirectX KB articles. The Internet
Archive Audition 1.5 user guide item was access-restricted, so no authentication
was attempted. An archived Adobe 1.5 press-release replay returned repeated
503s and was replaced by S-010. These failures were not interpreted as product
behavior.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted methods / blocker | Decision impact | Available evidence | Safest next discriminating probe | Required access/fixture / owner |
| --- | --- | --- | --- | --- | --- |
| CEP 2.x crash recovery/autosave/journaling (C-020, C-021) | Manual/page search; archived KB form found but POST results not replayable; exact-site search negative | High for durable project architecture | 1.2a advertised recovery; 2.x temp/undo/session behavior documented | Obtain an official 2.1 KB/manual supplement; otherwise use a licensed disposable VM and synthetic unsaved session, then terminate only the app | Lawful CEP 2.1 license/media and isolated legacy Windows fixture; unassigned |
| DirectX process isolation/crash containment (C-017, C-024) | Manual, 2.1 changes, SDK landing page; no process statement | High for modern host security/reliability | Effects listing, racks, bypass, scan only | Use a purpose-built crashing DirectX effect in a disposable authorized harness and record process tree/host survival | Safe synthetic plug-in, VM, authorization; unassigned |
| Scan cache/identity/blacklist/quarantine (C-013, C-017) | Manual and KB discovery | High for diagnosability | Automatic appearance, Refresh Effects List, global enable/disable | Change one synthetic plug-in's identity/version between scans and capture UI/files without inspecting proprietary code | Disposable fixture/plug-ins; unassigned |
| DirectX parameter/state/preset serialization (C-017, C-018) | Manual session/rack sections do not specify vendor state | High for recall/migration | `.ses` remembers used effects; host rack presets exist | Save/reopen deterministic stateful effect, then remove/reinstall it; observe recall and missing state behavior | Synthetic DirectX effect and licensed VM; unassigned |
| Missing plug-in/media recovery (C-017, C-018) | No manual placeholder/relink workflow; KB inaccessible | High for project durability | Manual warns moved media is not found; collect/copy exists | Move one media file and remove one synthetic effect, then record prompts and whether session can resave losslessly | Disposable session/plug-in; unassigned |
| Latency, tails, PDC, offline equivalence (C-017, C-024) | No host-contract statement | High for a modern graph | Bounce and real-time effects documented | Impulse/latency/tail fixtures compared in real-time and bounce | Synthetic deterministic effect and audio loopback; unassigned |
| `.ses` schema/version compatibility (C-018, C-024) | Proprietary; no reverse engineering performed | Medium-high for migration | Behavioral contents and collect operation documented | Use vendor-documented old/new sample sessions and application open/save only; compare behavior, not bytes | Lawful CEP versions/sample sessions; unassigned |
| MIDI recording/editing/instrument hosting (C-029) | Positive docs stop at playback/output/sync | Medium for DAW model | MIDI blocks, velocity envelope, MTC | Obtain an official feature matrix explicitly covering recording/editing; do not infer from UI absence | Archived official catalog/manual supplement; unassigned |
| `.xfm`/`.flt` and controller SDK contracts/licensing (C-030) | SDK landing page only; package intentionally not downloaded | Medium for extension architecture; high legal relevance | Names and purposes only | Locate public license/SDK documentation from rights holder before any prototype | Rights-holder documentation/legal review; unassigned |
| Security/accessibility/privacy/update behavior (C-024) | Period documentation does not address it | High for modern adoption, low for historical workflow pattern | Custom shortcuts/dockable UI only | Do not test legacy product as proxy; define modern requirements independently | New-product requirements owner; unassigned |

## 24. Curiosity pass and stop decision

### Ranked follow-ups

Scores are **decision relevance / expected value / novelty / cost**, each 1–5
(higher cost is worse).

1. **VST chronology through immediate Audition lineage — 5/5/5/2. PURSUED.**
   S-010 and S-011 changed a weak absence argument into the high-confidence
   bounded inference C-014.
2. **Archived CEP recovery KB — 5/5/5/3. PURSUED TO ACCESS BOUNDARY.** The
   official index was located, but POST results were unavailable and exact-site
   searches produced no relevant article. Continuing with random article IDs
   had nonpositive expected value.
3. **Terminal native SDK/requirements — 5/4/5/1. PURSUED.** S-013/S-014 closed
   the native-extension and platform rows while preserving unknown ABI/terms.
4. **DirectX deep runtime contract — 5/4/4/4. STOPPED.** Public sources
   saturated at menu/rack behavior; the next discriminating evidence is a
   dynamic disposable harness, outside this wave.
5. **Controller SDK and surround internals — 3/2/3/3. `CURIOSITY_NO_GO`.**
   Additional detail would not change the leading workflow, host, or
   persistence recommendations.
6. **Later-format owner chronology — 3/2/2/3. `CURIOSITY_NO_GO`.** Honest
   `UNKNOWN` cells are preferable to spending product budget proving unrelated
   format release dates.
7. **Binary/session reverse engineering — 5/4/5/5. `CURIOSITY_NO_GO`.** It is
   outside the legal/safety contract and unnecessary for clean-room patterns.

### Stop decision

**STOP: depth budget exhausted with sufficient coverage and source saturation.**
Eight bounded passes covered identity/version/platform, waveform/multitrack
architecture, audio/routing/automation, DirectX and native hosting, VST lineage,
persistence/recovery, acquisition/licensing, and transferable patterns. All
required matrix rows and headings are populated. Repeated searches did not
yield the missing KB/host-contract evidence, and another documentary source
pass is unlikely to alter the leading conclusions. The next evidence step is a
separately authorized disposable interoperability/recovery prototype, not more
unbounded web searching.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created only
  `research/daw-landscape/dossiers/syntrillium-cool-edit-pro.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  Sections 0 and 2 pin CEP 2.1, 2003-04-08, Windows, product boundaries, and
  Audition-only lineage context.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  11.x subheadings are present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-001–C-030; the register classifies each claim.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.**
  Claims register and section 23 include sources, blockers, impact, and probes.
- [x] **Every required plugin-format row is present.** All 13 required rows are
  populated without blanks.
- [x] **Hosting depth goes beyond format names or explicitly remains
  `UNKNOWN`.** Sections 11.2–11.6 cover scan, runtime, processing, state, UI,
  diagnostics, and failure boundaries.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** In particular, DirectX is documented, no-VST is an inference,
  and other format/host internals remain unknown.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16
  state the proprietary/license and no-reverse-engineering limits.
- [x] **Bibliography records source rationale and limitations.** Section 22
  records title, publisher, URL, kind, version scope, passage, claims,
  limitations, and selection rationale for S-001–S-014.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections
  19 and 24 record pursued/rejected threads and scores.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Documentary retrieval only; an access-restricted
  manual was not accessed, SDK/binaries were not downloaded, and no Git
  staging/commit command was run.

**Checks performed:** governing-file read; heading/subheading audit; matrix-row
audit; claim-to-source audit; source-rationale audit; curiosity/stop audit; Git
status review before and after dossier creation. **Result:** complete with
explicit unknowns. **Unresolved blockers:** archived KB POST results,
proprietary host/session internals, and absent safe dynamic fixtures.
**Pre-existing workspace changes:** numerous unrelated modified/untracked files
were present before this dossier was created and were left untouched.
