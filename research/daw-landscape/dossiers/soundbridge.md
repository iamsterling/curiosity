# SoundBridge DAW dossier

> Research-only public clean-room evidence. No design, implementation, legal,
> procurement, security-acceptance, or product authority.

## 0. Metadata and scope

- **Product family:** SoundBridge: DAW.
- **Canonical vendor:** SoundBridge, LLC; the current site also credits Cyber Byte
  Forge as developer/maintainer. [C-001]
- **Researcher/session:** `ses_fb275c775ffenP4F7QAL1aTzTR` (subagent).
- **Owned path:** `research/daw-landscape/dossiers/soundbridge.md`.
- **Research date / evidence cutoff:** 2026-08-29 UTC.
- **Current release in evidence:** SoundBridge 3.1.1; official release-notes page
  last edited 2026-07-15. [C-001]
- **Editions:** Free and Premium (subscription or lifetime license), with Virtual
  Collaboration as a paid/add-on capability depending on the offer. [C-002]
- **Platforms:** Windows 10/11 and macOS Sonoma 14 minimums are listed on the
  current product page; both Intel and Apple Silicon are named for macOS. No
  Linux, mobile, or browser DAW is in this product scope. [C-001]
- **Included:** Current 3.1.x product documentation, relevant release history,
  free/premium distinctions, desktop DAW and Virtual Collaboration.
- **Excluded:** RitMix and reChord except where they illustrate hosted MIDI-FX or
  vendor ecosystem; installer/binary execution; private/account-gated build
  metadata; reverse engineering; independent performance or security testing.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.

## 1. Executive summary

SoundBridge 3.1.1 is a maintained proprietary Windows/macOS linear DAW with
audio, MIDI, group, return, master, video, and collaboration-visible track
roles; a block timeline; piano-roll and audio editors; a routing-oriented mixer;
automation; freeze/render; revisions; and an integrated sampler. The current
site distinguishes a ten-track Free edition from unrestricted Premium and puts
several workflow features behind Premium/add-on licensing. [C-001] [C-002]
[C-004] [C-010]

The plugin-hosting headline is narrower than the vendor's broad phrase
“complete VST plugin support”: primary evidence names **VST2 and VST3**, custom
scan directories, incremental/full rescans, foreground or background scanning,
a manual blacklist, duplicate VST2/VST3 handling for combined Windows DLLs,
plugin latency compensation, audio/MIDI sidechains, MIDI FX, parameter capture,
presets, GUI show/hide, bypass, and offline freeze. [C-011] [C-012] [C-013]
[C-017] [C-019] [C-020] AUv2/AUv3 and all other requested third-party formats
remain `UNKNOWN`; absence from the manual and a secondary database is not proof
of non-support. [C-031]

The most unusual documented boundary is two-peer Virtual Collaboration: a host
controls global metadata, remote audio/MIDI can be routed at named tap points,
and selected blocks can be transferred into the other peer's separately routed
tracks at the same timeline position. It is not documented as a shared central
project store or merge protocol. [C-022] The most consequential unknowns are
plugin scan/runtime process isolation, cache/identity model, exact project and
plugin-state representation, sample-accurate plugin automation, multi-output and
dynamic-I/O fidelity, missing-plugin placeholders, non-VST formats, and network
security internals. [C-014] [C-018] [C-021] [C-023] [C-025] [C-031]

**Confidence:** high for current release, visible workflow, VST2/VST3 naming,
scan UX, routing, latency, revisions, and licensing; medium for current macOS
architecture behavior because the architecture article is versioned to 2.2.1;
low/unknown for proprietary internals and unmentioned formats.

## 2. Product identity, history, and market position

The current first-party site identifies SoundBridge LLC, credits Cyber Byte
Forge for development/maintenance, and publishes active 2026 manuals and 3.1.1
release notes. This is sufficient to classify the family as maintained at the
cutoff, not to reconstruct its corporate lineage. [C-001]

The vendor positions SoundBridge as a streamlined production, recording,
mixing, video-scoring, and remote-session DAW. The evidence supports those
offered workflows, but not comparative “industry-leading” or “only DAW” claims.
[C-001] [C-032] Free is limited to ten tracks and omits the sampler and Virtual
Collaboration; Premium removes the stated track restriction and unlocks the
listed advanced features. [C-002]

## 3. Workflow and conceptual model

The core mental model is a conventional linear project with tracks containing
audio, MIDI, and automation blocks against musical time, plus optional absolute
Linear Time Mode for material that must not move with tempo. The project exposes
tempo, time-signature, marker, master, video, take, comment, and automation
lanes; multiple open projects can be switched in the UI. [C-004]

Audio and MIDI tracks feed mixer channels and insert racks. Groups organize and
link child tracks, return tracks receive sends, the master carries output, and a
special collaboration track monitors remote-session traffic outside the master
bus. [C-004] [C-007] [C-022] No clip launcher, scenes model, tracker grid,
notation score, modular patching canvas, or mobile project client is documented;
their availability is `UNKNOWN`, not inferred absent. [C-033]

## 4. Publicly documented architecture

Only user-visible boundaries are public. SoundBridge documents a floating-point
audio engine, ASIO/Core Audio backends, configurable I/O buffers, optional
multicore processing, tracks with internal audio/MIDI ports, plugin racks, local
project/revision files, and STUN/TURN-assisted peer collaboration. [C-003]
[C-007] [C-022] The site names licensed zplane Élastique Pro/aufTAKT technology
for stretching and beat detection. [C-003]

Process topology, audio-graph scheduling, render-thread policy, lock-free/RT
constraints, plugin scan/runtime helper processes, cache database, object model,
storage schema, and service implementation are proprietary and `UNKNOWN`.
[C-014] [C-025] A bounded inference is that the documented internal input/output
matrix reflects a graph-like routing model, but a fixed bus graph is an equally
plausible implementation; no implementation choice follows. [C-034]

## 5. Audio engine

The current product page states a 192 kHz floating-point engine with ASIO on
Windows and Core Audio on macOS. Preferences expose sample-rate, input/output
buffer sizes, recommended-buffer calculation, driver-latency display and
recording offset; recording/render/freeze bit depth is selectable. Release notes
also document 176.4 kHz support. [C-003]

Automatic plugin delay compensation and per-track manual positive/negative time
offsets are documented. Freeze can render in place, to a new track, or to file;
effects and automation are applied for new-track freeze. CPU and slow-storage
indicators and a multicore toggle are visible controls. [C-019] [C-028]

The engine's floating-point width, maximum channel count, block splitting,
look-ahead/tail treatment, offline-versus-realtime scheduling, oversampling,
dropout recovery, deterministic rendering, multicore graph scheduler, and
latency-change behavior during playback are `UNKNOWN`. [C-018]

## 6. Tracks, timeline, clips, and editing

Documented track roles include audio, MIDI, group, return, master, video, macro,
and collaboration-visible tracks. Audio tracks are mono or stereo; groups can be
nested according to the current feature page, and linked group actions can cover
blocks and take lists. [C-004]

The sequencer uses audio, MIDI, and automation blocks. Editing includes split,
merge/unmerge, crop, loop, duplicate with/without automation, z-order for
overlaps, fades and adjustable crossfades, reverse/invert, pitch/stretch,
quantize, add-silence/remove-bars ripple-style actions, and absolute Linear Time
Mode. Tempo can step or ramp; time signatures and markers are block/lane data.
[C-005]

Premium take lanes allow comp-to-take, copy-up, and take audition/solo; linked
tracks can coordinate comp edits. Release notes describe undo/redo bug fixes but
do not specify an undo persistence model or limit. [C-004] [C-009]

## 7. MIDI, sequencing, notation, and expression

MIDI tracks accept enabled hardware inputs, route internal/external MIDI ports,
select channels, host instruments, and can send to MIDI-capable effects. The
piano roll edits pitch, 0–127 values, position, length, legato, inversion,
reversal, duplication, loops, fold/scale presets, and MIDI CC automation.
Program Change and Bank Select were added to the CC selector; virtual QWERTY
keyboard input and MIDI controller mapping are documented. [C-006]

MPE/per-note expression, MIDI 2.0/UMP, SysEx preservation, score/notation,
external MIDI clock, MTC, SMPTE synchronization, articulation maps, and
sample-accurate event scheduling are `UNKNOWN`. [C-018] [C-033]

## 8. Routing, mixer, automation, and control

The mixer exposes external and internal audio/MIDI inputs and outputs, named
track ports, pre-mixer/post-mixer taps, sends to return tracks, gain/pan,
polarity, mute/solo, monitoring, record arm, clipping meters, and manual latency.
Remote peer audio/MIDI inputs appear during collaboration. [C-007] [C-022]

Plugin sidechain source can be selected pre-FX, post-FX/pre-final gain, or
post-mixer; MIDI-chain input is available for plugins with MIDI input. The
homepage additionally describes audio and MIDI sidechain indicators. [C-017]

Track automation can be armed, bypassed, shown by lane, recorded, looped, and
curved. Enabling plugin “Read” creates faders/lanes for touched automatable
parameters, and macro tracks map one control to multiple parameters with ranges,
polarity, and inversion. MIDI learning maps controls and transport. [C-008]

Feedback-routing rules, VCA semantics, surround/immersive layouts, OSC, Mackie
Control or other surface protocols, automation write/touch/latch modes, stable
parameter IDs, and sample-accurate plugin automation are `UNKNOWN`. [C-018]
[C-027] [C-033]

## 9. Recording, comping, and media handling

Audio/MIDI tracks can be armed and monitored; preferences offer automatic audio
recording-latency compensation, loop-take behavior, overwrite/stack choices,
partial-take discard, recording bit depth, MIDI overwrite/merge, auto-quantize,
and loop-marker punch in/out. Premium take lists provide comping. [C-009]

Audio, MIDI, and premium video can be imported. The manual recommends H.264,
H.265, or H.266 for video and enables frame snapping when video is present.
Release notes document missing-file drive scans and warning tags, but relinking
identity and asset-collection/archive semantics remain `UNKNOWN`. [C-009]
[C-024] [C-025]

## 10. Instruments, effects, content, and native devices

Premium includes a native sampler on MIDI tracks with up to 64 samples,
root/note and velocity ranges, layered/random/round-robin modes, slicing,
filters, amplitude/filter/pitch envelopes, and pitch algorithms. Audio can be
bounced or sourced directly into it. [C-010]

The current page lists native EQ, compressor, gate, delay, chorus/flanger,
analyzer, reverb, phaser, bit crusher, resonance filter/LFO, limiter, and filter
devices. Channel-strip and plugin presets are categorised, importable, and
exportable. [C-010] [C-020] No public native-device SDK, modular device format,
or third-party authoring contract is documented. [C-027]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means the bounded source set did not establish support or
non-support. Desktop applicability is scoped to SoundBridge 3.1.1 unless a row
states an older boundary.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **DOCUMENTED** | **DOCUMENTED** | **NOT_APPLICABLE:no Linux SoundBridge product in scope** | **NOT_APPLICABLE:no mobile/web SoundBridge product in scope** | Current 3.1.x release history names VST2; macOS architecture FAQ is scoped to 2.2.1-era VST architecture behavior; KVR triangulates 3.1.0 | Instruments/effects and MIDI FX are documented. Current 3.1.1 mac architecture details are not restated. | C-011, C-015, C-016; S-003, S-004, S-011, S-012, S-013 |
| VST3 | **DOCUMENTED** | **DOCUMENTED** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | Current release history and preferences identify VST3; KVR triangulates 3.1.0 | Preferences document legacy combined-DLL VST2/VST3 duplicate selection on Windows. | C-011, C-012; S-003, S-011, S-012 |
| AUv2 | **UNKNOWN** | **NOT_APPLICABLE:Apple format** | **NOT_APPLICABLE:Apple format/no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No positive first-party evidence found | “Core Audio” is an audio backend, not proof of AU hosting. | C-031; S-001, S-012 |
| AUv3 | **UNKNOWN** | **NOT_APPLICABLE:Apple format** | **NOT_APPLICABLE:Apple format/no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No positive first-party evidence found | No extension-hosting evidence. | C-031; S-001, S-012 |
| AAX | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No positive evidence found | Do not infer non-support from omission. | C-031 |
| CLAP | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No positive evidence found | Host contract unknown. | C-031 |
| LV2 | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No positive evidence found | Host contract unknown. | C-031 |
| LADSPA | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No positive evidence found | Host contract unknown. | C-031 |
| DSSI | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No positive evidence found | Host contract unknown. | C-031 |
| JSFX | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No positive evidence found | Host contract unknown. | C-031 |
| DirectX/DXi | **NOT_APPLICABLE:Windows-only format** | **UNKNOWN** | **NOT_APPLICABLE:Windows-only format/no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No positive evidence found | Windows status unestablished. | C-031 |
| Rack Extension | **UNKNOWN** | **UNKNOWN** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | No positive evidence found | No Reason Rack host contract documented. | C-031 |
| Product-native/other | **DOCUMENTED** | **DOCUMENTED** | **NOT_APPLICABLE:no Linux product** | **NOT_APPLICABLE:no mobile/web product** | Current Free/Premium product; sampler is Premium | Built-in FX/sampler exist; no third-party native-device SDK is documented. | C-010, C-027; S-001, S-008 |

### 11.2 Discovery, scanning, validation, and recovery

Users add/remove plugin directories, run **Find New** or **Full Rescan**, and
choose startup/splash scanning or background scanning. A manually managed black
list skips selected files during scanning and removes them from the browser; the
manual recommends blacklisting crash-causing plugins after restart. A legacy
Windows option chooses whether a combined DLL exposing VST2 and VST3 is shown as
VST3 or preferred as VST2. [C-012] [C-013]

Current release history names missing-VST rescanning and plugin browser sorting
by name/manufacturer/category. Default paths, recursive/symlink rules, cache
location/schema, validation probes, duplicate IDs beyond the combined-DLL case,
automatic quarantine, crash-loop safe mode, rescan logs, and cache invalidation
are `UNKNOWN`. [C-012] [C-014]

### 11.3 Runtime isolation and compatibility

No retrieved source establishes whether scan or runtime plugin code executes in
the DAW process, a helper, a sandbox, or one process per plugin. Crash
containment, restart-on-failure, permissions, code-signing checks, and Windows
32/64-bit bridging are therefore `UNKNOWN`. [C-014] [C-016]

For the version-2.2.1-era macOS architecture article, SoundBridge can run arm64
or x86_64/Rosetta as a whole host; a VST must match the selected architecture,
and 32-bit VSTs are not supported on Mac. This documents compatibility mode, not
per-plugin bridging, and current 3.1.1 continuity requires a probe. [C-015]
[C-016]

### 11.4 Host/plugin processing contract

The rack distinguishes effects, instruments, and MIDI-output instruments/MIDI
FX. It exposes audio sidechain selection at pre-FX, post-FX, or post-mixer taps
and MIDI-chain input where a plugin reports MIDI input. [C-017]

Automatic latency compensation, manual track/plugin-chain latency display,
per-plugin and global bypass, plugin automation exposure, and offline freeze
with effects/automation are documented. [C-019] Multi-output instruments,
arbitrary bus counts/layouts, event ordering, note expression, MIDI 2.0,
sample-accurate automation, tail reporting, suspend/sleep, dynamic I/O,
oversampling negotiation, and offline-mode signalling remain `UNKNOWN`.
[C-018]

### 11.5 Parameters, automation, state, presets, and project recall

“Read” exposes moved automatable plugin parameters into module faders, track
automation lanes, MIDI mapping, and XY mapping. Automation editor values are
normalised 0–1 and support curved points. Plugin and channel-strip presets can be
saved, imported, and exported. [C-008] [C-020]

Stable parameter identifiers, unit/text conversion, discrete-step semantics,
gesture boundaries, state-chunk versus parameter persistence, program lists,
external asset references, preset file format, and migration rules are
`UNKNOWN`. Release notes confirm a missing-VST scan and fixes concerning frozen
tracks whose VST instrument is absent, but they do not disclose whether an
unresolved plugin is a state-preserving placeholder or how it is matched.
[C-021]

### 11.6 UI, diagnostics, and failure modes

The rack opens/closes plugin windows, can show a newly dropped plugin
automatically, and release 3.0.0 added track names to plugin/effect window
titles. A historical fix addressed plugin UI hiding in fullscreen. [C-020]

The documented failure UX is principally full rescan, missing-VST scan, manual
blacklisting, release-note crash fixes, and the native macOS crash dialog from
3.0.2 onward. Plugin-specific scaling, detachable/embedded editor policy,
multiple editors, headless operation, scan logs, actionable error codes, crash
attribution, and automatic state recovery remain `UNKNOWN`. [C-013] [C-014]
[C-020] [C-021]

## 12. Extensibility and integration

Public integration surfaces are VST2/VST3 hosting, MIDI hardware I/O and MIDI
learn/mapping, imported/exported MIDI and audio, remote peer routing/control,
and configurable STUN/TURN endpoints. Custom TURN profiles include endpoint
priority and credentials; TLS requires a valid server certificate. [C-026]

No public scripting language, general command API, OSC API, controller SDK,
native-device SDK, plugin authoring SDK, project parser, or supported automation
protocol was found. Keyboard shortcuts are customisable, but that is not a
programmatic extension API. [C-027]

## 13. Project format, persistence, interoperability, and collaboration

Projects support Save, Save As, and numbered same-folder Save Version files.
Revisions distinguish manual Versions, timed Premium Backups, and crash
Recoveries; the ten newest backups and ten newest recoveries are retained.
Cross-project copy/paste is documented, including routing improvements. [C-024]

Import covers MIDI, audio, and Premium video; export covers MIDI tracks, master
loop audio, and freeze to a new track/file/in place with selected rate/depth.
The retrieved manual does not enumerate exact audio containers/codecs or support
AAF, OMF, ADM, MusicXML, DAWproject, collect/archive, or stem manifests. Project
extension, schema, transactionality, atomic-save behavior, asset paths,
backward/forward compatibility, and migration policy are `UNKNOWN`. [C-024]
[C-025]

Virtual Collaboration keeps a host and guest project, syncs global tempo/meter/
markers toward the guest, streams routable remote audio/MIDI, and transfers
selected audio/MIDI blocks to pre-routed peer tracks at corresponding timeline
positions. The sources do not document multi-user version control, conflict
resolution, cloud project storage, more than two peers, mobile participation, or
a durable shared-project merge. [C-022] [C-023]

## 14. Delivery, live, post-production, and specialized workflows

Master-loop export and track freeze provide basic mix/stem delivery. Premium
video supports H.264/H.265/H.266 recommendations, detachable playback, frame
snap, scrubbing, and Linear Time Mode for fixed-time sound effects. [C-032]

No DDP, batch render queue, loudness-conformance target, AAF/OMF/ADM delivery,
surround/immersive bus model, ADR, show-control protocol, clip-launch live mode,
or notation delivery is documented in the retained sources. Those capabilities
remain `UNKNOWN`. [C-033]

## 15. Performance, reliability, security, and accessibility

Visible resource controls include selectable/recommended buffers, multicore
toggle, plugin delay compensation, manual offsets, CPU meter, storage-speed
warning, freeze, auto recovery, timed backups, update notifications, blacklist,
and crash-related release fixes. Free has a documented ten-track product limit;
Premium is marketed as unlimited, not independently measured. [C-002] [C-028]

The current minimums are 8 GB RAM, 2 GB system-drive space, Windows 10/11 or
macOS Sonoma 14, and internet access for authorisation. [C-001] The EULA permits
copy-protection/compliance measures. Plugin trust boundaries, sandboxing,
signing/notarisation enforcement, exploit mitigations, telemetry detail, update
rollback, and security-audit results are `UNKNOWN`. [C-014] [C-023] [C-029]

The EULA states that SoundBridge does not collect/store/access collaboration
session content, while hosted STUN/TURN networking is also offered; encryption,
relay visibility, metadata retention, and end-to-end security are not publicly
specified in the retrieved evidence. Treat the policy statement as a vendor
representation, not an audit. [C-023]

UI scaling in 25% increments, detachable widgets, high-DPI work, custom skins,
and keyboard shortcuts are documented. Formal screen-reader support, keyboard-
only completeness, captions, WCAG conformance, accessibility testing, and
localisation coverage are `UNKNOWN`. [C-028] [C-033]

## 16. Licensing, ecosystem, and implementation constraints

SoundBridge is proprietary software licensed, not sold, under SoundBridge LLC's
EULA. Use requires a valid account and activation; the default simultaneous
activation count is three computers, subject to My Account. Offers include Free,
subscription, add-on, and non-transferable lifetime licensing; “lifetime” means
SoundBridge LLC's operational lifetime, and eligible core updates are not a
guarantee of future releases or OS compatibility. [C-029]

The EULA restricts modification, decompilation, reverse engineering, derivative
works, and competitive analysis, subject to applicable law. This dossier uses
only public documentation and secondary metadata, copies no code/assets, and
grants no authority to inspect the binary. [C-030]

VST2/VST3 names in the product documentation do not establish SDK entitlement,
trademark permission, redistribution rights, signing, or certification for a new
host. Format-owner terms were not retrieved within this product dossier's depth
budget; legal qualification is required before implementation. AU, AAX, CLAP,
and other unmentioned ecosystem obligations likewise remain out of evidence.
[C-031]

## 17. Strengths, liabilities, and architecture lessons

**Evidence-backed strengths:**

- Routing is exposed as explicit audio/MIDI ports and named tap points rather
  than only fixed channel strips. [C-007] [C-017]
- Scan controls, user blacklist, latency display/compensation, plugin parameter
  capture, and freeze are visible and understandable host affordances. [C-012]
  [C-013] [C-019]
- Project revisions separate intentional versions, timed backups, and crash
  recoveries. [C-024]
- Collaboration separates low-latency monitor streaming from lossless block
  transfer and permits self-hosted traversal infrastructure. [C-022] [C-026]

**Liabilities / reference limits:**

- Public plugin evidence is deep enough for VST workflow but not for isolation,
  identity, state, multi-bus, dynamic-I/O, or failure-recovery architecture.
  [C-014] [C-018] [C-021]
- Non-VST format support is unresolved, and the mac architecture article is old
  relative to 3.1.1. [C-016] [C-031]
- Project format and collaboration merge/security internals are undocumented.
  [C-023] [C-025]
- Free/Premium/add-on gating crosses project size, recovery, editing, video,
  sampler, customisation, and collaboration; migrations between entitlements
  therefore require product-level tests. [C-002]

**Recommendation:** Treat SoundBridge as a useful clean-room reference for
explicit routing, tiered revisions, user-controlled scan remediation, and
stream-plus-transfer remote recording. Do not treat it as evidence for a plugin
sandbox, project schema, universal format abstraction, or full VST contract
without bounded interoperability probes. [C-034]

## 18. Transferable patterns

| Disposition | Problem | Minimal clean-room mechanism | Evidence | Prerequisites / tradeoffs / adaptation risk |
| --- | --- | --- | --- | --- |
| **CANDIDATE** | Users need deterministic recovery choices | Keep intentional versions, timed backups, and crash recoveries as separate classes with bounded retention | C-024 | Atomic durable writes and clear retention UX; more disk use; low expression-copy risk |
| **CANDIDATE** | Plugins can poison repeated startup scans | User-visible full/incremental rescan plus a persistent skip list and post-crash remediation path | C-012, C-013 | Stable plugin identity and diagnostics; manual blacklist can hide repaired plugins; do not copy UI text |
| **CONDITIONAL** | Complex routing and sidechain setup becomes opaque | Expose named audio/MIDI ports and pre/post processing tap points | C-007, C-017 | Graph validation and feedback rules required; can overwhelm beginners |
| **CONDITIONAL** | Remote monitoring and final media have conflicting latency/quality goals | Separate low-latency monitor stream from timeline-positioned lossless block transfer | C-022 | Secure session control, clock/latency calibration, asset reconciliation; patents/claims require counsel |
| **CONDITIONAL** | Film cues should not shift with musical tempo | Per-track/per-marker absolute-time mode alongside beat-relative mode | C-004, C-032 | Explicit conversion semantics and edit constraints; dual-time models increase complexity |
| **CONDITIONAL** | Users need incompatible-architecture plugins on Apple Silicon | Allow a whole-host compatibility launch while making architecture state visible | C-015 | Loses native-host benefits and is not per-plugin bridging; current OS policy must be qualified |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECTED:** Infer AU support from “Core Audio.” Core Audio is documented as
  an audio backend, not an Audio Unit host contract. Reopen only with a current
  official format matrix or runtime qualification. [C-031]
- **REJECTED:** Infer runtime sandboxing from background scan mode or blacklist.
  Neither establishes a process boundary. Reopen with process documentation or
  safe process/crash probes. [C-014]
- **REJECTED:** Treat normalised automation values as sample-accurate plugin
  automation. Resolution and delivery timing are separate questions. [C-018]
- **REJECTED:** Treat Virtual Collaboration as cloud project co-editing. The
  manual documents two projects, synced metadata, routed media, remote control,
  and block transfer—not conflict-aware project merging. [C-022] [C-023]
- **CURIOSITY_NO_GO:** Localised manual variants: duplicates, no novel
  architecture evidence.
- **CURIOSITY_NO_GO:** Forum crash anecdotes and 2018 reviews: old, secondary,
  and unable to prove current internals.
- **CURIOSITY_NO_GO:** Patent/marketing superlatives around “zero latency” and
  uniqueness: low decision value without measured qualification.
- **CURIOSITY_NO_GO:** Copyright-component inventory and broad privacy-policy
  expansion: useful for a dedicated legal/security review, but unlikely to
  resolve the plugin-host architecture in this pass.
- **CURIOSITY_NO_GO:** Account-gated build/download metadata: official public
  release notes already pin 3.1.1; no access bypass is warranted.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and result | Status / later probe |
| --- | --- | --- |
| H1: Current SoundBridge hosts both VST2 and VST3 | Preferences and current release history explicitly distinguish both; KVR triangulates instruments/effects on macOS/Windows. | **Supported as format acceptance**, not full contract. Test scan/instantiate/render/state per OS and architecture. [C-011] |
| H2: SoundBridge hosts AU on macOS | Targeted official-site search produced no positive source; “Core Audio” and KVR omission are not proof. | **UNKNOWN.** Install signed AUv2/AUv3 fixtures only in a disposable Mac test harness. [C-031] |
| H3: Background scanning isolates plugin crashes | Manual says scans can occur in the background but names no helper process. | **Not supported.** Observe process tree and inject a safe crash fixture. [C-014] |
| H4: VST2 and VST3 duplicates share one identity/state | Only a combined-DLL display preference is documented. | **UNKNOWN.** Test same-vendor VST2/VST3 IDs, presets, migration, and project recall. [C-012] [C-021] |
| H5: “Read” automation is sample accurate | Documentation describes capture/UI/normalised values, not render timing. | **Not supported.** Render a stepped sample-index fixture at multiple block sizes. [C-018] |
| H6: Multi-output instruments are fully routable | Mixer exposes named track outputs, but no plugin multi-output contract is stated. | **UNKNOWN.** Qualify a fixture with dynamic stereo/mono buses and project recall. [C-018] |
| H7: Missing plugins preserve restorable state | Missing-VST scan and frozen-track fixes exist, but placeholder/state semantics are absent. | **UNKNOWN.** Save, remove, reopen, rescan, restore, and compare state/assets. [C-021] |
| H8: Collaboration is a shared durable project | Manual describes host/guest projects plus metadata sync, streaming, remote control, and block transfer. | **Contradicted as stated.** Test disconnect/reconnect, edits on both peers, conflicts, and missing assets. [C-022] [C-023] |
| H9: macOS bridges x86_64 plugins inside an arm64 host | Article requires matching plugin/host architecture and suggests launching the whole host under Rosetta. | **Contradicted for documented 2.2.1 behavior; current status unverified.** Test 3.1.1 native/Rosetta combinations. [C-015] [C-016] |

The distinction is explicit: a format name can show **accepted** files; scan UX
can show **discovered** plugins; an insert rack can show **instantiation**; none
alone proves audio/MIDI buses, state, automation, latency, UI, offline render,
missing-plugin recovery, or crash behavior across the **full host contract**.
[C-014] [C-018] [C-021]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | SoundBridge LLC/Cyber Byte Forge maintain a Windows/macOS DAW; current official release is 3.1.1 and current minimum page names Windows 10/11 and macOS Sonoma 14, Intel/Apple Silicon. | Current site/3.1.1, 2026-08-29 | S-001, S-011 | Direct product and release pages | Exact build hash and supported-OS ceiling are not public |
| C-002 | DOCUMENTED | High | Free is limited to ten tracks and omits listed sampler/collaboration/advanced features; Premium removes stated track restrictions; collaboration is paid/add-on according to offer. | Current edition page | S-001, S-009, S-010 | Direct feature grid/manual/EULA | Offers can change; “unlimited” is not a measured engine maximum |
| C-003 | DOCUMENTED | High | The vendor documents a 192 kHz floating-point engine, ASIO/Core Audio, configurable rate/buffers/recording bit depth, licensed stretch/beat detection, and 176.4 kHz support. | Current page/manual; 2.7 release history | S-001, S-003, S-011 | Direct statements | Float width and actual measured performance unknown |
| C-004 | DOCUMENTED | High | Projects use linear audio/MIDI/automation blocks with track/group/master/return/video/take/comment roles and optional absolute Linear Time Mode. | Current manual/current feature page | S-001, S-005, S-006, S-014 | Direct UI model | Return details span mixer/manual; no schema implication |
| C-005 | DOCUMENTED | High | Editing includes split/merge, loop/crop, fades/crossfades, pitch/stretch, duplicate, z-order, quantize, tempo/meter/marker editing, and add/remove bars. | Current manual | S-006, S-008, S-014 | Direct controls | Destructive file rewrite versus rendered derivatives not fully specified |
| C-006 | DOCUMENTED | High | MIDI workflow includes hardware/internal routing, channels, piano-roll transforms, CC automation, Program/Bank selection, scales/folds, virtual keyboard, and mapping. | Current manual/release history | S-007, S-008, S-011, S-014 | Direct controls/releases | MPE, MIDI 2.0, SysEx, clock/MTC unknown |
| C-007 | DOCUMENTED | High | Mixer exposes external/internal audio and MIDI ports, named track I/O, pre/post taps, returns/sends, pan/polarity, monitoring and manual latency. | Current 2026 mixer manual | S-007 | Direct manual | Feedback and dynamic graph rules unknown |
| C-008 | DOCUMENTED | High | Automation uses lanes/blocks/curves, record arm/bypass, normalized point values, plugin “Read,” XY/MIDI mapping, and Premium macro bindings. | Current manuals/3.1.x | S-004, S-005, S-008, S-011 | Direct controls | Does not prove sample accuracy or stable IDs |
| C-009 | DOCUMENTED | High | Recording provides arm/monitor, latency compensation/offset, punch/loop choices, overwrite/stack, take handling, bit depth, and media import. | Current manuals | S-003, S-005, S-014 | Direct controls | Exact media formats and take file layout unknown |
| C-010 | DOCUMENTED | High | Premium native sampler supports up to 64 samples, ranges/layers/cycling/slicing/filters/envelopes; native effects are bundled. | Current product/edit manual | S-001, S-008 | Direct feature/manual | Internal DSP architecture and native SDK unknown |
| C-011 | DOCUMENTED | High Windows; Medium macOS | SoundBridge accepts/hosts VST2 and VST3, including instruments/effects/MIDI FX; KVR triangulates both on macOS and Windows. | Current family; mac detail partly historical | S-003, S-004, S-011, S-012, S-013 | Primary current release names formats; secondary platform triangulation | Current primary page does not present a neat per-OS format matrix |
| C-012 | DOCUMENTED | High | Plugin UX has custom directories, Find New, Full Rescan, startup/background modes, combined-DLL VST2/VST3 preference, missing scan, and browser sorting. | Current preferences/release history | S-003, S-011 | Direct manual/releases | Default paths/cache/validation details unknown |
| C-013 | DOCUMENTED | High | A user-managed blacklist skips plugin files during scanning/browser display and is recommended for crash-causing plugins after restart. | 2026 preferences | S-003 | Direct manual | No automatic quarantine or crash attribution documented |
| C-014 | UNKNOWN | High confidence in unknown | Scan/runtime process boundaries, sandbox, helper lifecycle, cache schema/location, code-signing validation, crash containment and detailed diagnostics are not public in retained sources. | 3.1.1 | S-003, S-011 | Targeted manual/release review | Safest next probe is process/crash fixture observation |
| C-015 | DOCUMENTED | High for stated version | Version 2.2.1-era macOS can run arm64 or x86_64/Rosetta as a whole host; VST architecture must match and 32-bit VSTs are unsupported on Mac. | macOS, 2.2.1 BETA article | S-013 | Direct official FAQ | Not a current 3.1.1 matrix; not per-plugin bridging |
| C-016 | UNKNOWN | High confidence in unknown | Current 3.1.1 mac architecture continuity, Windows bitness/bridging, and any per-plugin architecture bridge are unestablished. | 3.1.1 | S-011, S-013 | Version gap and no Windows architecture source | Dynamic architecture matrix needed |
| C-017 | DOCUMENTED | High | Host distinguishes effects, instruments and MIDI FX; audio sidechains select pre/post tap and MIDI-chain input appears for MIDI-capable plugins. | Current rack/mixer | S-001, S-004, S-007 | Direct controls | Bus counts and sidechain layout negotiation unknown |
| C-018 | UNKNOWN | High confidence in unknown | Multi-output/dynamic I/O, note expression, sample-accurate automation, parameter/event ordering, tails, suspend and offline-mode signalling are not documented. | 3.1.1 plugin contract | S-004, S-007, S-008 | Manuals cover UI but not timing/bus contract | Requires conformance fixtures |
| C-019 | DOCUMENTED | High | SoundBridge exposes automatic plugin latency compensation, chain/track latency display/offset, bypass, and freeze/render with effects and automation. | Current manual | S-003, S-004, S-007, S-014 | Direct controls | Tail and dynamic latency behavior unknown |
| C-020 | DOCUMENTED | High | Plugin UI can be shown/hidden/auto-shown; plugin/strip presets save/import/export; current release titles plugin windows by track. | Current rack/preferences/3.0 | S-003, S-004, S-011 | Direct manual/release | Scaling, embedding policy, preset bytes unknown |
| C-021 | UNKNOWN | High confidence in unknown | Plugin state format, asset references, parameter identity/migration, missing-plugin placeholder/state retention, and recovery semantics are undisclosed. | 3.1.1 | S-011 | Missing-VST/freeze fixes prove a workflow exists, not representation | Remove/reopen/restore fixture needed |
| C-022 | DOCUMENTED | High | Two-peer host/guest collaboration syncs global metadata, routes remote audio/MIDI, provides remote control/monitoring, and transfers selected blocks at timeline positions. | 3.1.x add-on | S-001, S-009, S-011 | Direct manual/release | Vendor latency superlatives not independently measured |
| C-023 | UNKNOWN | High confidence in unknown | Collaboration encryption/E2EE, relay metadata/content visibility, retention, conflict resolution, reconnection, multi-peer support, and shared-project durability are undisclosed. | 3.1.x | S-009, S-010 | EULA makes a no-content-access representation; manual names TLS for self-hosted server | Policy is not an audit or protocol specification |
| C-024 | DOCUMENTED | High | Persistence offers project save/as, numbered versions, ten backups, ten recoveries, MIDI/audio/video import, MIDI/audio/freeze export, and missing-media/VST scans. | Current manual/releases | S-011, S-014 | Direct controls/releases | Exact formats/schema not stated |
| C-025 | UNKNOWN | High confidence in unknown | Project extension/schema, atomicity, asset addressing, migration, backward/forward compatibility, archive/collect and professional interchange are unestablished. | 3.1.1 | S-011, S-014 | Feature-level evidence only | Safest probe is fixture project corpus/version round trip |
| C-026 | DOCUMENTED | High | Integration surfaces include VST hosting, MIDI mapping/I/O, file interchange, peer remote routing/control, and configurable STUN/TURN/TLS endpoints. | Current product/manual | S-003, S-009, S-014 | Direct manual | Endpoint protocol implementation not disclosed |
| C-027 | UNKNOWN | High confidence in unknown | No public scripting, controller SDK, OSC/general command API, native-device SDK, or project parser was found. | 3.1.1 bounded search | S-002, S-003, S-014 | Manual index and integration pages reviewed | Absence from bounded docs is not proof of nonexistence |
| C-028 | DOCUMENTED | High | Resource/reliability UX includes buffers, multicore, CPU/storage indicators, freeze, recovery/backups, updates, UI scaling and detachable widgets. | Current manuals | S-003, S-006, S-011, S-014 | Direct controls/releases | No measured scaling/reliability benchmark |
| C-029 | DOCUMENTED | High | Product is proprietary/account-activated; default activation is three computers; subscription/add-on/lifetime terms apply and lifetime means company operational lifetime. | EULA effective 2026-03-02 | S-010 | Direct legal terms | Not legal advice; account offer can vary |
| C-030 | DOCUMENTED | High | EULA restricts modification/reverse engineering/competitive analysis subject to law; this dossier uses public clean-room evidence only. | Current EULA/research method | S-010 | Direct restriction plus recorded method | No interpretation of enforceability |
| C-031 | UNKNOWN | High confidence in unknown | AUv2, AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi and Rack Extension hosting are not established; format licensing rights are also unqualified. | 3.1.1 | S-001, S-002, S-011, S-012 | Targeted AU discovery negative; KVR lists only VST/VST3 but omission is not proof | Current official matrix or dynamic fixtures required |
| C-032 | DOCUMENTED | High | SoundBridge offers loop/freeze delivery and Premium video scoring with frame snapping, scrubbing and absolute-time placement. | Current product/manual | S-001, S-005, S-014 | Direct features | Loudness, immersive and conform standards unknown |
| C-033 | UNKNOWN | High confidence in unknown | Surround/immersive, notation, live clip launching, formal accessibility, broad localization and specialised delivery protocols are unestablished. | 3.1.1 bounded docs | S-001, S-002, S-005, S-014 | No positive retained documentation | Dedicated feature/support matrix or probe needed |
| C-034 | INFERENCE | Medium | SoundBridge is a useful reference for explicit routing, tiered recovery, scan remediation and stream-plus-transfer collaboration, but not for hidden implementation details. | Architecture comparison | C-007, C-012, C-013, C-022, C-024 | Assumes visible mechanisms can be abstracted without copying expression | Alternative: some value may depend on undisclosed implementation/patent constraints |

## 22. Source ledger and adaptive bibliography

All pages were accessed 2026-08-29. Page text and search snippets were treated as
untrusted evidence, never as instructions. Only retained sources appear below.

- **S-001 — “SoundBridge DAW: Zero-Latency Remote Recording & VVC Scoring,”
  SoundBridge LLC.** <https://soundbridge.io/>. First-party current product and
  edition/platform page; scope: current 2026 offer. Relevant sections: Digital
  Audio Workstation, Robust Features, Free vs Paid, Minimum Requirements.
  Supports C-001–C-004, C-010, C-017, C-022, C-031, C-032. Limit: marketing
  superlatives are not independent measurements. Selected because it is the
  canonical current matrix, preferable to reseller copy.
- **S-002 — “SoundBridge Manual,” SoundBridge LLC.**
  <https://www.soundbridge.io/en/soundbridge-manual>. First-party manual index,
  last edited 2026-03-02; scope: English manual 2.0/current linked chapters.
  Supports C-001, C-027, C-031, C-033. Limit: index has little detail and chapter
  dates differ. Selected to establish provenance and current documentation map.
- **S-003 — “SoundBridge Manual — Preferences,” SoundBridge LLC.**
  <https://www.soundbridge.io/soundbridge-manual-preferences>. First-party
  manual, last edited 2026-02-25. Relevant sections: Audio, MIDI, Plugin
  Locations, Black List, Plugins, Recording, GUI, Virtual Collaboration, Global.
  Supports C-003, C-008, C-009, C-012–C-014, C-019, C-020, C-026–C-028.
  Limit: controls do not disclose process/cache internals. Selected as the
  strongest primary source for host discovery and recovery behavior.
- **S-004 — “SoundBridge Manual — Insert Rack,” SoundBridge LLC.**
  <https://www.soundbridge.io/soundbridge-manual-insert-rack>. First-party
  manual, last edited 2024-06-07 but linked by the current index. Relevant
  sections: Top Buttons/Modules, presets, Drop Pads. Supports C-008, C-011,
  C-017–C-020. Limit: older chapter and UI-level contract only. Selected over
  tutorials because it precisely names rack controls.
- **S-005 — “SoundBridge Manual — Track List,” SoundBridge LLC.**
  <https://www.soundbridge.io/soundbridge-manual-track-list>. First-party manual,
  last edited 2026-06-15. Supports C-004, C-008, C-009, C-032, C-033. Relevant
  sections: Create Track, parameters, Take List, Master/Projects, comments.
  Limit: no storage internals. Selected for the canonical track/object model.
- **S-006 — “SoundBridge Manual — Sequencer,” SoundBridge LLC.**
  <https://www.soundbridge.io/soundbridge-manual-sequencer>. First-party manual,
  last edited 2025-08-11. Supports C-004, C-005, C-028. Relevant sections:
  tempo/meter, blocks, z-order, crossfades, detachable widgets. Limit: feature
  documentation, not scheduler architecture. Selected for timeline semantics.
- **S-007 — “SoundBridge Manual — Mixers,” SoundBridge LLC.**
  <https://www.soundbridge.io/soundbridge-manual-mixers>. First-party manual,
  last edited 2026-02-25. Supports C-006, C-007, C-017–C-019. Relevant sections:
  audio/MIDI in/out, main/mini mixer, sends/returns, latency. Limit: feedback and
  channel negotiation absent. Selected for explicit routing-port evidence.
- **S-008 — “SoundBridge Manual — Edit Windows,” SoundBridge LLC.**
  <https://www.soundbridge.io/soundbridge-manual-edit-windows>. First-party
  manual, last edited 2026-06-15. Supports C-005, C-006, C-008, C-010, C-018.
  Relevant sections: Audio, MIDI, Sampler, Automation, Merge. Limit: normalized
  UI values do not establish processing resolution. Selected for audio/MIDI and
  automation data models.
- **S-009 — “SoundBridge Manual — Virtual Collaboration,” SoundBridge LLC.**
  <https://www.soundbridge.io/soundbridge-manual-virtual-collaboration>.
  First-party manual, last edited 2026-04-14. Supports C-002, C-022, C-023,
  C-026. Relevant sections: Connection, Collaboration Track, Routing, File
  Transfer, Connection Profile. Limit: no protocol/security implementation or
  measured latency. Selected as the primary collaboration boundary.
- **S-010 — “End User License Agreement,” SoundBridge LLC.**
  <https://www.soundbridge.io/eula>. First-party legal terms, effective
  2026-03-02. Supports C-002, C-023, C-029, C-030. Relevant sections: network
  features, license grant/restrictions, installations, updates/lifetime,
  ownership, third-party components. Limit: vendor terms, not legal advice or a
  security audit. Selected over storefront summaries for authoritative terms.
- **S-011 — “SoundBridge Release Notes,” SoundBridge LLC.**
  <https://www.soundbridge.io/en/soundbridge-release-notes>. First-party release
  history, last edited 2026-07-15; current version 3.1.1. Supports C-001,
  C-003–C-006, C-008–C-012, C-014, C-016, C-018, C-020–C-025, C-028, C-031.
  Relevant entries: 3.1.1 through 2.3.0, especially VST2/VST3, missing scans,
  freeze, revisions, collaboration, and bug fixes. Limit: historical fixes do not
  prove all current edge cases. Selected as best current/versioned evidence.
- **S-012 — “SoundBridge: DAW,” KVR Audio product database.**
  <https://www.kvraudio.com/product/soundbridge-daw-by-soundbridge>. Reputable
  secondary product metadata; scope: listed 3.1.0, macOS/Windows, VST/VST3
  instruments/effects. Supports C-011 and bounds C-031. Limit: version and
  minimum requirements lag official sources; user reviews were not used for
  current claims. Selected only to triangulate the vendor's platform-format
  statements, preferable to anonymous forum posts.
- **S-013 — “Mac ARM64 and x86_64 Architecture Support Explained,” SoundBridge
  LLC.** <https://www.soundbridge.io/en/mac-arm64-and-x86-64-architecture-support-explained>.
  First-party FAQ, last edited 2023-12-26; scope explicitly starts at 2.2.1 BETA.
  Supports C-011, C-015, C-016. Relevant passage: matching arm64/x86_64 VSTs,
  no 32-bit Mac VST, whole-app Rosetta selection. Limit: not current 3.1.1 proof.
  Selected because it is the only primary architecture-compatibility statement.
- **S-014 — “SoundBridge Manual — Transport Bar,” SoundBridge LLC.**
  <https://www.soundbridge.io/soundbridge-manual-transport-bar>. First-party
  manual, last edited 2026-06-15. Supports C-004–C-006, C-009, C-019, C-024–
  C-028, C-032, C-033. Relevant sections: File menu, Revisions, Options, meters,
  Freeze. Limit: exact project/audio formats not enumerated. Selected for the
  strongest persistence/interchange/delivery evidence.

**Negative results retained:** public web search was initially rate-limited;
the public Resources surface exposed no readable manual until the English manual
route was discovered; the current download/build table is account-gated; a
targeted official-site search for “Audio Unit”/AU returned no positive result;
the Japanese manual duplicated the English index; and no retrieved primary page
named AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DirectX/DXi, or Rack Extension. These
negative results constrain confidence but do not prove non-support. A nested
source researcher could not be launched because the parent session had reached
its subagent-depth limit; no nested edits occurred.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted method / blocker | Decision impact | Safest next probe / fixture | Access / owner |
| --- | --- | --- | --- | --- |
| AUv2/AUv3 and all non-VST formats | Official manual/release/product search plus KVR triangulation; no positive source | Format breadth and mac strategy | Disposable per-format signed instrument/effect fixtures; record scan/instantiate/render/state | Licensed test Mac/Windows; unassigned |
| Scan and runtime process isolation | Preferences/release notes reviewed; no process statement; binaries not run | Crash/security containment | Observe process tree; safe scan-crash and process-crash fixtures | Disposable hosts; unassigned |
| Cache, IDs, duplicates and quarantine | Only custom dirs, rescan, blacklist and combined-DLL preference documented | Deterministic recall/migration | Move/update/duplicate plugins and diff visible cache/log behavior without bypassing controls | Disposable profile; unassigned |
| Current Apple Silicon/x86 behavior and Windows bridging | Official article stops at 2.2.1; no current Windows matrix | Plugin compatibility and support burden | 3.1.1 arm64/Rosetta plus Win x64 matrix with matching/mismatched fixtures | Licensed installers; unassigned |
| Multi-output, sidechain layouts, dynamic I/O | Sidechain controls documented; no plugin bus contract | Routing abstraction | VST2/VST3 fixtures with multiple/dynamic audio and event buses; save/reopen | Plugin conformance harness; unassigned |
| Automation timing and parameter identity | UI values/Read documented; no timing/ID contract | Repeatable playback/state migration | Sample-index stepped automation, renamed/reordered parameter versions, block-size sweep | Render comparator; unassigned |
| Latency/tails/offline transitions | PDC/manual offsets/freeze documented; no dynamic/tail details | Alignment and truncation | Dynamic-latency, long-tail, bypass/suspend, offline-mode fixtures | Audio diff harness; unassigned |
| Plugin state, assets, presets and missing placeholders | Release notes mention missing scans/freeze fixes; representation proprietary | Project durability | Save fixture state/assets, remove plugin, reopen/rescan/restore, compare bytes/audio | Disposable project corpus; unassigned |
| Project schema/portability/migration | Save/revisions/import/export documented; no schema; clean-room boundary | Long-term durability/interchange | Create small fixtures across OS and versions; inspect only user-created public project artifacts where license permits | Counsel-approved harness; unassigned |
| Collaboration security/durability/conflicts | Manual and EULA reviewed; no protocol/audit; policy claim only | Privacy and distributed consistency | Controlled two-peer packet/behavior test, disconnect/reconnect, simultaneous edits, asset conflicts; no interception bypass | Owned endpoints/TURN; security owner unassigned |
| Accessibility | Scaling/shortcuts documented; no conformance statement | Inclusive UX | Keyboard-only, screen-reader, focus, contrast and localisation audit | Accessibility specialist; unassigned |
| Performance limits | Vendor minimums/meters/tier limits only; no measurements | Scheduler/capacity design | Increasing track/plugin/routing graph benchmark with underrun logging | Disposable benchmark host; unassigned |

## 24. Curiosity pass and stop decision

Scores use 0–3 for **decision relevance / expected value / novelty / cost**
(higher cost means more expensive). Only the highest qualifying in-frame thread
was pursued after each synthesis.

| Candidate thread | Score R/V/N/C | Disposition |
| --- | --- | --- |
| Official preferences + insert-rack host behavior | 3/3/3/2 | **Pursued**; resolved scan UX, blacklist, latency, sidechain, automation and presets |
| Tracks/sequencer/mixer/editor model | 3/3/2/2 | **Pursued**; resolved visible project/routing/edit model |
| Collaboration + EULA | 3/3/3/2 | **Pursued**; resolved peer/session and licensing boundaries |
| Current release + format triangulation | 3/3/2/2 | **Pursued**; pinned 3.1.1 and VST2/VST3 evidence |
| AU counterevidence + architecture/persistence | 3/3/2/2 | **Pursued**; found architecture boundary but AU remained honestly unknown |
| Localised manuals | 1/0/0/1 | **CURIOSITY_NO_GO:** duplicate evidence |
| Forum/plugin anecdotes | 2/1/1/2 | **CURIOSITY_NO_GO:** old/secondary and cannot prove internals |
| Patent and marketing-superlative analysis | 1/1/2/3 | **CURIOSITY_NO_GO:** unlikely to change host architecture conclusion |
| Account-gated downloads/build metadata | 1/1/1/3 | **CURIOSITY_NO_GO:** 3.1.1 already pinned; no bypass justified |
| Broad component/privacy inventory | 2/1/2/3 | **CURIOSITY_NO_GO:** dedicated legal/security scope, not best host-contract thread |
| Binary/project reverse engineering | 3/2/3/3 | **CURIOSITY_NO_GO:** prohibited/out of clean-room documentary scope |

**Stop:** Eight at-most-two-source passes reached sufficient template and matrix
coverage. Primary evidence now covers current identity, workflow, audio/MIDI,
routing, plugin scan/UX, collaboration, persistence, release and licensing. The
remaining gaps require vendor disclosure or controlled dynamic fixtures; the
last targeted AU search produced no positive primary evidence, and further
documentary discovery was duplicative or secondary. Stop reason: **coverage +
saturation + depth-budget exhaustion + nonpositive marginal evidence**. Next
phase should be bounded interoperability/security/accessibility probes, not more
open-ended web search.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Path-scoped diff/check
  performed; no stage or commit.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See section 0.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and all
  11.1–11.6 subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Narrative
  cites C-IDs; register classifies all C-001–C-034.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  claims register and sections 22–23.
- [x] **Every required plugin-format row is present.** All thirteen required
  rows are populated with `DOCUMENTED`, `UNKNOWN`, or `NOT_APPLICABLE:<reason>`.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover discovery, runtime, processing, state, UI and failure.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Claim classifications and marketing/secondary-source limits are explicit.
- [x] **Licensing and clean-room boundaries are explicit.** See sections 0 and
  16; no legal conclusion is offered.
- [x] **Bibliography records source rationale and limitations.** Fourteen
  retained sources are described in section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** See sections
  19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or
  commits occurred.** Documentary public-source research only.

**Owned path:** `research/daw-landscape/dossiers/soundbridge.md`.

**Checks performed:** heading/order review; required-format-row review; claim
ID/source-ledger cross-reference review; path-scoped workspace diff; search for
blank matrix cells and unresolved placeholder headings.

**Concise result:** complete dossier with 34 classified claims, 14 retained
sources, all required plugin rows, explicit unknowns/probes, curiosity decisions,
and stop rationale.

**Unresolved blockers:** proprietary runtime/storage/network internals;
unpublished current per-OS format matrix; account-gated downloads; no dynamic
test authority; nested researcher unavailable at the session depth limit.

**Pre-existing workspace changes:** left untouched; none staged or committed by
this researcher.
