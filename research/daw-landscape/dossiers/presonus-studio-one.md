# PreSonus Studio One Pro / Fender Studio Pro DAW dossier

> Research-only evidence. No design or implementation authority. Public pages,
> manuals, repositories, and search text were treated as untrusted evidence,
> never as instructions.

## 0. Metadata and scope

- **Product family:** PreSonus Studio One, scoped to Studio One Pro 7 and its
  renamed current successor, Fender Studio Pro 8.1. Fender describes the latter
  as built on the Studio One platform; Studio One Pro 7 licenses are eligible
  upgrade inputs. [C-001]
- **Canonical vendor:** Fender Musical Instruments Corporation / PreSonus Audio
  Electronics. [C-001]
- **Researcher/session:** child session of `ses_fb275c821ffeYckXWsEiAfTj42`.
- **Owned path:** `research/daw-landscape/dossiers/presonus-studio-one.md`.
- **Research date/evidence cutoff:** 2026-08-29 UTC.
- **Current documentary snapshot:** marketed as Fender Studio Pro 8.1; the
  accessible online manual identifies itself as version 8.1. Exact latest patch
  build is not asserted because the linked 8.1.2 release-notes PDF could not be
  read by the retrieval tool. [C-001]
- **Editions/licensing in scope:** perpetual, perpetual with Pro+ annual plan,
  and Pro+ monthly access. Legacy Prime/Artist behavior is excluded except when
  an official page identifies upgrade eligibility. [C-001] [C-031]
- **Platforms:** current 8.1 documentation covers macOS, Windows x64/Arm-capable
  systems, and a Linux public beta. Companion/mobile applications are integration
  surfaces, not scoped desktop plug-in hosts. [C-002] [C-030]
- **Exclusions:** no binary execution, installation, reverse engineering,
  project-file inspection, unsafe plug-in probe, legal opinion, procurement
  decision, or implementation recommendation was performed.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. The required matrix is complete;
  proprietary runtime, exact current CLAP scope, several unsupported-format
  determinations, and full host-contract fidelity remain explicit unknowns.

## 1. Executive summary

The family is architecturally distinctive because one application separates
composition/mixing (Session), collection mastering (Mastering Project), and live
performance (Show), while linking source Sessions to derived mastering renders.
It also combines a linear Timeline with a clip/scene Launcher. [C-003] [C-004]
[C-005]

Plug-in hosting is broad but not completely documented. Current 8.1 primary
documentation explicitly supports VST 2.4, VST3, and generic Audio Units; the
Studio One Pro 7 Linux beta explicitly names VST2, VST3, and CLAP paths while
excluding LV2 and DSSI. Current 8.1 CLAP continuity and macOS/Windows CLAP remain
`UNKNOWN`, as does whether “Audio Units” means AUv2 only, AUv3, or both. [C-013]
[C-014] [C-033] [C-037]

The strongest documented hosting patterns are an external VST scanner in the
v5 lineage, current scan quarantine/blocklisting and recovery UX, explicit
sidechains and multi-output activation, automatic full-path plug-in delay
compensation, host-side cached state, broad parameter automation, Windows
per-plug-in DPI compatibility scaling, and different resource states for bypass,
deactivate, disable, and Nap. [C-016] [C-017] [C-011] [C-007] [C-021] [C-023]
[C-024] [C-025]

The largest risk is the undocumented runtime boundary: an external **scanner**
does not prove that instantiated plug-ins run out of process. Per-instance
sandboxing, crash containment, scheduler topology, exact parameter identity,
sample-accurate automation, dynamic-I/O callbacks, tail handling, state schema,
and missing-plug-in placeholder retention are proprietary or unverified.
[C-019] [C-022] [C-026] [C-035]

**Overall confidence:** high for visible 8.1 workflows and VST scanner/routing
UX; medium for lineage-scoped architecture compatibility; low for proprietary
internals and non-enumerated formats.

## 2. Product identity, history, and market position

Studio One Pro 7 is the immediate predecessor lineage. By the cutoff the current
product is Fender Studio Pro 8.1, described by Fender as the next evolution built
on Studio One; the current product page treats Studio One Pro 7 as an upgrade
source. [C-001]

The product targets recording, production, mixing, mastering, and performance,
with current marketing additionally emphasizing Fender amp/effect content,
stem separation, Splice/Moises integrations, notation-related creation tools,
and a companion-app workflow. Vendor quality claims are not treated as
independent performance measurements. [C-001] [C-030]

Current minimum documentation names macOS 13+, Windows 10 22H2/Windows 11, and
Linux public beta on Ubuntu 24.04 derivatives with Wayland; listed CPU families
include Intel, AMD, Apple M1+, and Snapdragon X. [C-002]

## 3. Workflow and conceptual model

Three first-class document types divide responsibilities: Sessions record,
edit, arrange, and mix; Mastering Projects sequence, meter, master, publish, and
prepare releases; Shows manage setlists, backing tracks, real/virtual players,
patches, and performance views. The file extensions remain `.Song`, `.Project`,
and `.Show` even though current UI terminology says Session and Mastering
Project. [C-003] [C-025]

Inside a Session, the linear Timeline coexists with a Launcher. Launcher Cells
reference audio clips, instrument parts, or patterns; vertical Scenes launch
cells together; Playlists order Scenes. Track-level play focus chooses Timeline
or Launcher, and a Launcher performance can be recorded back to the Timeline.
[C-004]

The Show model is setlist-oriented. Backing Track, Real Instrument, and Virtual
Instrument Players own mixer channels; Patches snapshot player instrument,
plug-in, and mixer settings; Performance Mode reduces the interface to stage
controls and meters. [C-003]

## 4. Publicly documented architecture

Public documentation establishes a mixed 32-/64-bit floating-point mix engine,
automatic full-path delay compensation, dropout protection, and a VST scanner
that was explicitly external in the v5 lineage. It also documents disableable
services such as ARA and whole plug-in-format services. [C-006] [C-007]
[C-017] [C-027]

It does **not** disclose the instantiated plug-in process model, IPC, memory
protection, audio graph data structures, worker-thread scheduler, lock-free
mechanisms, state schema, crash transaction semantics, or source module map.
Those internals remain `UNKNOWN`; scanner isolation must not be generalized to
runtime isolation. [C-019] [C-035]

## 5. Audio engine

The mix engine offers single-precision (32-bit) and double-precision (64-bit)
floating-point processing. In Double mode it can select precision according to
the capability of inserted VST/AU effects. [C-006]

Plug-in delay compensation is automatic through the entire audio path, with
total plug-in delay displayed in the Transport. Audio Dropout Protection and
native low-latency monitoring target stable playback at higher plug-in/track
counts while keeping audio-input and virtual-instrument monitoring responsive.
[C-007]

Freeze/transform operations render instrument tracks or eligible bus structures
and can restore the real-time graph; external live hardware forces real-time
mixdown. Bypass, deactivate, disable, and Nap expose different resource/recall
tradeoffs. [C-011] [C-023]

Maximum sample rate, internal block subdivision, oversampling policy, exact
multicore scheduling outside the documented Linux thread-priority guidance,
real-time/offline equivalence, plug-in tail flushing, latency-change callbacks,
and dropout recovery transactions remain `UNKNOWN`. [C-022] [C-035]

## 6. Tracks, timeline, clips, and editing

Sessions separate Audio Tracks, Instrument Tracks carrying performance data,
Automation Tracks, folders, buses/channels, Timeline Events/Parts, Launcher
Cells, Scenes, and Playlists. Instrument tracks do not themselves output audio;
their virtual instruments own Console audio channels. [C-004] [C-011]

Editing is documented as non-destructive with undo/redo, layers/takes, range
comping, automatic comp crossfades, grouped comp edits, bounce/merge, Track
Freeze, Scratch Pads, Arranger/Chord/Tempo/Signature tracks, patterns, and
timestretching. [C-008]

## 7. MIDI, sequencing, notation, and expression

Instrument Parts record/edit performance data and can host Part Automation.
Documented lanes include velocity, modulation, pitch bend, aftertouch, Poly
Pressure, and MPE note controllers; note-controller data stays associated with
notes. [C-009] [C-021]

Sound Variations map articulations to note, CC, program/bank, or compound
activation sequences. Qualifying VST instruments can report vendor-specific
Dynamic Mapping; legacy key-switch maps are documented as backward compatible.
The public third-party contract and stability policy for Dynamic Mapping are
not published in the retrieved sources. [C-009] [C-040]

The Score Editor shares underlying notes with Piano/Drum views, supports real-
time, step, and manual entry, and maps articulations/dynamics to playback.
MIDI clock/MTC/MMC and Ableton Link synchronization are documented host
features. MIDI 2.0/UMP and VST3 Note Expression fidelity remain `UNKNOWN`.
[C-009] [C-022]

## 8. Routing, mixer, automation, and control

Console routing includes ordered inserts, pre/post-fader sends, FX Channels,
Bus Channels, VCAs, Cue Mixes, nested buses with feedback prevention, sidechain
inputs, multiple instrument outputs, and spatial-channel remapping. [C-010]
[C-011]

Sidechain-compatible effects and instruments can receive one or more source
channels through sends or direct output routing. Multi-output instruments expose
an activation list; only the first output/pair is active by default, and each
enabled output gets a dedicated Console channel. [C-011]

Nearly every host or plug-in parameter can be exposed as Track, Part, or
dedicated Automation Track curves. Bypass is automatable; deactivate/disable are
not. Exact sample timing, stable parameter IDs, text/range conversion, and
automation migration after plug-in updates are not documented. [C-021] [C-022]

Control Link, Mackie Control, keyboard commands/macros, network discovery by
compatible remote-control apps, Studio Pro Remote, and MIDI controller mapping
are user-facing extension/control surfaces. No general scripting language was
found. [C-029] [C-040]

## 9. Recording, comping, and media handling

Record Takes to Layers applies to audio and instrument parts. Users audition,
promote, group-edit, crossfade, rename, and color layer ranges, then bounce or
merge the comp. [C-008]

Recording uses Broadcast Wave and automatically uses RF64 above 4 GB. Sessions
can collect external files; linked media otherwise retains external paths. The
Pool, Copy External Files, Save to New Folder, Zip export, autosave, and History
versions are documented portability/recovery mechanisms. [C-008] [C-025]

## 10. Instruments, effects, content, and native devices

The current product page advertises more than 45 native effects and nine virtual
instruments; exact inventory is not architecture-critical here. Native device
chains coexist with VST/AU, Note FX, FX Chains, Multi Instruments, Event FX/ARA,
and Sound Sets. [C-001] [C-012]

Multi Instrument hosts several instrument plug-ins and Note FX, distributes
note/control data through splits and layers, maps macros across devices, and
groups each instrument's audio channel under a bus. [C-011]

Mix Engine FX is a product-specific bus-level format whose instance can process
all channels feeding a bus, enabling central and inter-channel processing.
Public third-party authoring/SDK availability and licensing were not established.
[C-012] [C-040] [C-042]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means no adequate primary evidence was found; it does not mean
unsupported. “Generic AU” means the vendor says Audio Units without identifying
AUv2 versus AUv3. The Studio One Pro 7 Linux evidence is retained separately
from current 8.1 continuity. [C-013] [C-014] [C-033] [C-037]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | DOCUMENTED: VST 2.4, 64-bit | DOCUMENTED: VST 2.4, 64-bit | DOCUMENTED: v7 beta path; 8.1 continuity UNKNOWN | NOT_APPLICABLE: no scoped mobile/web host edition | Current 8.1 manual; v7 support | VSTXML hierarchical parameters documented; no Intel bridge on native Apple Silicon; legacy format licensing needs counsel | C-013, C-014, C-020, C-034 / S-002–S-005 |
| VST3 | DOCUMENTED: supported, 64-bit | DOCUMENTED: supported, 64-bit | DOCUMENTED: v7 beta path; 8.1 continuity UNKNOWN | NOT_APPLICABLE: no scoped mobile/web host edition | Current 8.1 manual; v7 support | Fixed OS paths; native architecture required on Apple/Windows Arm host | C-013–C-016, C-020 / S-002–S-005, S-008 |
| AUv2 | UNKNOWN: generic AU support documented, generation unstated | DOCUMENTED: AU instance is not cross-platform and is listed missing | NOT_APPLICABLE: Apple format | NOT_APPLICABLE: no scoped mobile/web host edition | Current 8.1 generic AU; v7 migration article | macOS owns AU validation in v5 scanner description; generation-specific support not proved | C-013, C-017, C-026, C-033 / S-005, S-006, S-009 |
| AUv3 | UNKNOWN: generic AU support documented, generation unstated | NOT_APPLICABLE: Apple format | NOT_APPLICABLE: Apple format | NOT_APPLICABLE: no scoped mobile/web host edition | Current 8.1 manual is silent on generation | Do not infer AUv3 from “Audio Units” | C-013, C-033 / S-005 |
| AAX | UNKNOWN: not named | UNKNOWN: not named | UNKNOWN: not named | NOT_APPLICABLE: no scoped mobile/web host edition | Current 8.1 manual/source search | No AAX host evidence found; absence is not proof | C-033 / S-005 |
| CLAP | UNKNOWN: not named | UNKNOWN: not named | DOCUMENTED: v7 beta `~/.clap`; current 8.1 continuity UNKNOWN | NOT_APPLICABLE: no scoped mobile/web host edition | Studio One Pro 7 Linux article; 8.1 manual negative result | Final searches rate-limited; MIT reference implementation does not prove host support | C-014, C-032, C-037 / S-003, S-005, S-011 |
| LV2 | UNKNOWN: not named | UNKNOWN: not named | DOCUMENTED: explicitly unavailable in v7 Linux beta; 8.1 continuity UNKNOWN | NOT_APPLICABLE: no scoped mobile/web host edition | Studio One Pro 7 Linux article | No current 8.1 restatement | C-014, C-033, C-037 / S-003, S-005 |
| LADSPA | UNKNOWN: not named | UNKNOWN: not named | UNKNOWN: not named | NOT_APPLICABLE: no scoped mobile/web host edition | Current/manual and v7 Linux search | Linux exclusions name LV2/DSSI/Vamp, not LADSPA | C-033 / S-003, S-005 |
| DSSI | UNKNOWN: not named | UNKNOWN: not named | DOCUMENTED: explicitly unavailable in v7 Linux beta; 8.1 continuity UNKNOWN | NOT_APPLICABLE: no scoped mobile/web host edition | Studio One Pro 7 Linux article | No current 8.1 restatement | C-014, C-033, C-037 / S-003, S-005 |
| JSFX | UNKNOWN: not named | UNKNOWN: not named | UNKNOWN: not named | NOT_APPLICABLE: no scoped mobile/web host edition | Current 8.1 manual/source search | No host evidence found | C-033 / S-005 |
| DirectX/DXi | UNKNOWN: not named | UNKNOWN: not named | NOT_APPLICABLE: Windows technology | NOT_APPLICABLE: no scoped mobile/web host edition | Current 8.1 manual/source search | No current host evidence found | C-033 / S-005 |
| Rack Extension | UNKNOWN: not named | UNKNOWN: not named | UNKNOWN: not named | NOT_APPLICABLE: no scoped mobile/web host edition | Current 8.1 manual/source search | No host evidence found | C-033 / S-005 |
| Product-native/other | DOCUMENTED: Fender native devices, Mix Engine FX, Note FX, Event FX/ARA | DOCUMENTED: same current family | DOCUMENTED where included in beta, subject to Linux exclusions | NOT_APPLICABLE: companion app is not the scoped host | Current 8.1 manual | Mix Engine FX/Dynamic Mapping authoring SDK terms UNKNOWN | C-012, C-027, C-040, C-042 / S-005 |

### 11.2 Discovery, scanning, validation, and recovery

Current 8.1 automatically locates standard plug-in locations; custom VST paths
are startup-scanned, while AU and VST3 use fixed OS paths. v7 support documents
Windows and macOS paths and a 64-bit-only host. [C-015]

Current scanning is expressly VST2/VST3. Initial scans are full; later scans are
faster unless plug-ins are new/updated. Defective/incompatible or repeatedly
failing entries are quarantined/blocklisted; users can skip, disable, delete one
blocklist entry, reset all, remove manager settings, refresh/update the list,
toggle startup scanning, or force rescan. A scan log is documented in the v5
lineage. [C-016] [C-017]

The Plug-in Manager hides individual/type/vendor entries, hides duplicates,
orders format priority (native first), and exposes use/load/save/preset-size
statistics. Duplicate identity rules, scan cache keys, cryptographic validation,
and quarantine storage are `UNKNOWN`. [C-016] [C-022]

### 11.3 Runtime isolation and compatibility

The VST scanner was an **external process** in Studio One 5. No retained source
says current instantiated plug-ins execute in separate processes, sandboxes, or
crash domains. Runtime containment is therefore `UNKNOWN`. [C-017] [C-019]

Desktop Studio One Pro 7 is 64-bit-only. Native Apple Silicon Studio One requires
native Apple Silicon VST2/VST3; AU may use Apple's Rosetta mechanism, or the full
host can run under Rosetta. Native Windows Arm64 Studio One Pro 7.2 can load
Arm64 plug-ins, not x86 or Arm64EC. Linux v7 packages were x86-64; Flatpak host
sandboxing constrains filesystem/device paths but is not per-plug-in isolation.
[C-020]

### 11.4 Host/plugin processing contract

Documented behavior covers audio effects versus instruments, musical-performance
input to instruments, one-or-more instrument output channels, sidechain audio
to effects/instruments, broad parameter automation, automatic path latency
compensation, manual output activation, bypass/deactivate/disable, real-time
Event FX, render/freeze, and spatial channel mapping. [C-007] [C-010] [C-011]
[C-021] [C-023] [C-027]

`UNKNOWN`: sample-accurate automation, MIDI 2.0/UMP, event-bus negotiation,
dynamic-I/O callback semantics, parameter ID/range/text fidelity, tail reports,
silence flags, host bypass callbacks, suspend/resume APIs, offline determinism,
thread-affinity guarantees, and latency changes while running. [C-022]

### 11.5 Parameters, automation, state, presets, and project recall

Host automation can expose almost every plug-in parameter as Track, Part, or
Automation Track curves. VST 2.4 VSTXML hierarchical parameters are documented.
Presets/FX Chains/Multi Instrument presets store settings; Compare returns to the
last document-saved state; copying an insert can copy its current settings.
[C-013] [C-021] [C-025]

Autosave can reuse cached plug-in state instead of querying each plug-in, reducing
save time for parameter-heavy devices. Native state schema, asset-reference
model, state-chunk size/atomicity, migration hooks, and recovery from a stale
cache are not documented. [C-025] [C-035]

### 11.6 UI, diagnostics, and failure modes

Plug-in editors can be selected through tabs, pinned into independent windows,
and colorized by channel. Windows offers per-plug-in System DPI Scaling with
documented blur/incompatibility risks; native plug-in scaling is preferred.
macOS/Linux scaling, accessibility metadata, and headless editor behavior remain
`UNKNOWN`. [C-024] [C-036]

Diagnostics include startup scan messages, `PluginScanner.log` in the v5
lineage, blocklist state, Plug-in Manager statistics, crash reports, Startup and
Recovery, and an error path that can offer to blocklist a malfunctioning plug-in.
[C-016] [C-017] [C-018]

Cross-platform AU recall does not substitute installed VST equivalents; AU is
listed missing on Windows. Documentation says full loading requires the same
third-party instruments/effects, but does not establish a state-preserving
placeholder or later automatic relink. [C-026] [C-039]

## 12. Extensibility and integration

Documented integration surfaces include VST2/VST3/AU hosting, ARA Event Editors,
Control Link, Mackie Control, configurable key commands/macros, MIDI external
devices, network-discovered remote apps, Studio Pro Remote, Ableton Link, Sound
Variations/Dynamic Mapping, and product-specific Mix Engine FX. [C-027] [C-029]
[C-040]

No accessible, current, general-purpose scripting API or stable public SDK for
Mix Engine FX/Dynamic Mapping was established. The old PreSonus developer URL
linked from Linux documentation returned 404. This is `UNKNOWN`, not proof that
partner-only or private SDKs do not exist. [C-042]

## 13. Project format, persistence, interoperability, and collaboration

Native `.Song`, `.Project`, and `.Show` documents link media, use document Media
folders, support Save As/Save to New Folder/Zip, autosave, templates, incremental
or History-folder versions, and copy-external-file prompts. Autosaves are not
performed during playback. [C-025]

Current 8.1 opens DAWproject, AAF-related workflows, Capture, Cubase Track
Archives, Sequel, Kristal, and OpenTL. DAWproject is absent from the retrieved
8.1 Save As/Convert To list, so import is `DOCUMENTED` while current export and
round-trip fidelity are `UNKNOWN`. [C-028] [C-038]

Missing assets can be collected/relinked through documented file-management
workflows. Missing plug-ins are listed, and an AU instance is not mapped to VST
on another OS. Placeholder state retention and cross-format migration are
`UNKNOWN`. [C-026] [C-039]

Fender advertises mobile-app project sync and cloud/third-party integrations;
the consistency protocol, encryption, conflict model, version control, and
offline merge behavior were not publicly established here. [C-030] [C-041]

## 14. Delivery, live, post-production, and specialized workflows

Mastering Projects sequence releases, meter, publish, and update renders from
linked Sessions. Shows provide setlists, backing stems, real/virtual performers,
Patches, mappings, and full-screen performance operation. [C-003] [C-005]

The current family documents video and spatial/Dolby workflows, while the v7
Linux beta explicitly excludes video, CD burning, DDP import/export, score
printing, Melodyne integration, and several hardware integrations. [C-001]
[C-014]

## 15. Performance, reliability, security, and accessibility

Reliability controls include dropout protection, automatic PDC, Plug-in Nap,
disable/unload/freeze/render choices, scanner quarantine, blocklist reset,
format/service disablement, scan logs, crash reports, and Startup/Recovery.
[C-007] [C-016] [C-018] [C-023]

Windows System DPI Scaling is a compatibility aid, not an accessibility
guarantee. No adequate current primary evidence was found for screen-reader
coverage, keyboard-only completeness, WCAG conformance, plug-in UI accessibility,
telemetry controls, plug-in code-signing policy, notarization policy, or runtime
security sandboxing. These remain `UNKNOWN`. [C-019] [C-024] [C-036]

Linux Flatpak has host-level filesystem/device permissions and Wayland GUI
requirements; those facts must not be represented as per-plug-in containment.
[C-014] [C-019]

## 16. Licensing, ecosystem, and implementation constraints

Fender sells a perpetual current-version license with one year of new feature
releases, a perpetual license plus annual Pro+ extras, and monthly Pro+ access.
The manual documents MyFender account activation, five activations, portable
offline activation, 30-day Pro+ checks, and annual perpetual-license checks.
[C-001] [C-031]

The current Steinberg VST3 SDK and CLAP reference source each publish MIT
licenses in the retained repositories. Those licenses do not license Fender/
PreSonus implementation code, certify compatibility, grant trademarks, or answer
all distribution/signing obligations. [C-032]

VST2.4 is hosted, but the current availability and rights for a new implementer
to obtain/use legacy VST2 materials were not established after an official
licensing page returned 404. Treat VST2 as a legal-review dependency, not a
feature checkbox. [C-013] [C-034]

No legal advice is provided. A future implementation must separately review
format-owner licenses, trademarks, Apple platform rules, signing/notarization,
redistribution, certification, and third-party bundled-content terms. [C-032]
[C-034]

## 17. Strengths, liabilities, and architecture lessons

**Strengths:** explicit document specialization and linked mastering freshness;
hybrid Launcher/Timeline; deep routing including sidechains and manually exposed
multi-outs; strong scan recovery/diagnostics; broad automation and state/preset
UX; and stage-specific Show/Patch abstractions. [C-003] [C-004] [C-005] [C-011]
[C-016] [C-021] [C-025]

**Liabilities:** current format documentation is ambiguous about AU generations
and CLAP continuity; legacy VST2 remains a compatibility/legal burden; cross-
format recall is not automatic; Linux/Arm variants have exclusions; and runtime
isolation/state fidelity are undocumented. [C-014] [C-020] [C-026] [C-033]
[C-034] [C-037]

**Lesson:** visible recovery and resource-state controls are useful even when a
host cannot guarantee plug-in reliability, but they are not substitutes for a
clear process boundary, stable identity model, and reproducible conformance
tests. [C-016] [C-019] [C-022] [C-023]

## 18. Transferable patterns

1. **`CANDIDATE` — dependency-aware mastering.** Problem: derived release files
   become stale. Minimal mechanism: source-document identity, freshness marker,
   deterministic render/update action, and failure report. Prerequisite: stable
   source references. Tradeoff: batch updates may open arbitrary dependencies.
   Adaptation risk: medium. [C-005]
2. **`CANDIDATE` — external scanner plus visible quarantine.** Problem: unsafe
   discovery can prevent host launch. Minimal mechanism: helper scan, per-launch
   skip, persistent blocklist, reset, log, and recovery mode. Prerequisite:
   strict IPC/timeouts. Tradeoff: false positives and stale caches. Risk: high
   unless dynamically qualified. [C-016] [C-017] [C-018]
3. **`CANDIDATE` — explicit resource states.** Problem: users need fast A/B,
   CPU relief, and full unload. Minimal mechanism: bypass, deactivate, disable,
   and inactivity suspension as distinct states. Prerequisite: precise state
   lifecycle. Tradeoff: complexity and recall latency. Risk: medium. [C-023]
4. **`CANDIDATE` — explicit multi-output activation.** Problem: exposing every
   latent output clutters large sessions. Minimal mechanism: first output active,
   enumerated optional buses, mixer channel per enabled bus. Prerequisite:
   dynamic bus negotiation. Risk: medium. [C-011]
5. **`CONDITIONAL` — preserve format identity on recall.** Problem: an AU and VST
   from one vendor may not have equivalent identity/state. Minimal mechanism:
   never silently substitute; surface missing format and offer explicit migration
   only with verified equivalence. Tradeoff: reduced convenience. Risk: low.
   [C-026]
6. **`CANDIDATE` — shared linear/clip tracks with play focus.** Problem: linear
   and scene workflows drift apart. Minimal mechanism: shared tracks, per-track
   source focus, and capture to Timeline. Prerequisite: deterministic launch
   quantization. Risk: high around automation/routing reconciliation. [C-004]

These are clean-room behavioral abstractions, not copied UI or implementation.

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject scanner-isolation inference:** an external scanner does not establish
  out-of-process rendering. Reopen only after a safe process-tree/crash probe.
  [C-017] [C-019]
- **Reject format-logo equivalence:** “supports VST3/AU” does not establish the
  full host contract. Reopen with conformance fixtures for buses, parameters,
  latency, state, UI, and failure. [C-013] [C-022]
- **Reject silent cross-format substitution:** current AU→Windows behavior lists
  the AU missing even if VST exists. [C-026]
- `CURIOSITY_NO_GO` — missing-plug-in placeholder internals (relevance 4/4,
  value 3/4, novelty 3/4, cost 4/4): requires dynamic save/reopen fixtures or
  unsafe/proprietary format inspection. [C-039]
- `CURIOSITY_NO_GO` — runtime process topology (4/4, 3/4, 3/4, 4/4): primary
  documentation saturated; next step is a disposable process/crash probe.
  [C-019]
- `CURIOSITY_NO_GO` — DAWproject export round trip (3/4, 3/4, 2/4, 3/4): current
  import is enough for this architecture pass; reopen with two-DAW fixtures.
  [C-038]
- `CURIOSITY_NO_GO` — VST2 licensing history (3/4, 2/4, 2/4, 3/4): route to
  legal review if VST2 implementation becomes a decision. [C-034]
- `CURIOSITY_NO_GO` — accessibility audit (3/4, 3/4, 4/4, 4/4): requires a
  dedicated assistive-technology test plan. [C-036]

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test/result | Status | Next discriminating probe |
| --- | --- | --- | --- |
| H1: current CLAP works on all desktop OSes | Current 8.1 manual format statement/index was silent; v7 Linux alone names CLAP | NOT ESTABLISHED; current scope UNKNOWN [C-037] | Signed minimal CLAP fixture on macOS, Windows x64/Arm, Linux 8.1 |
| H2: external scan means isolated runtime | v5 scanner is external; no instance-process statement found | REJECTED inference [C-017] [C-019] | Process tree plus deliberate crash/hang plug-in in disposable VM |
| H3: accepting VST3 proves full fidelity | Sources document basic load/routing but omit timing, IDs, tails, dynamic I/O, and state ABI | REJECTED [C-013] [C-022] | Versioned VST3 conformance matrix with raw timing/state evidence |
| H4: installed VST replaces missing AU | Official migration article says AU remains listed missing on Windows | FALSIFIED [C-026] | Test explicit vendor migration only if host offers one |
| H5: DAWproject exchange is bidirectional | 8.1 opens `.dawproject`; Save/Convert list omits it | NOT ESTABLISHED [C-028] [C-038] | Export UI probe and semantic round trip |
| H6: blocklisted means incompatible | Official scanner article warns first-scan blocklisting can be transient | FALSIFIED [C-016] [C-017] | Reinstall/authorize/reset and compare scanner log |
| H7: missing plug-ins preserve state placeholders | No retained source describes placeholder/state retention | UNKNOWN [C-039] | Save with fixture, remove binary, reopen/save, restore binary, compare state hash |
| H8: automation is sample accurate | Curves/parameters are documented; delivery granularity is not | UNKNOWN [C-021] [C-022] | Impulse-generating parameter fixture with sample-offset assertions |

The documentary distinction is explicit: format accepted ≠ scanner succeeds ≠
instance loads ≠ full processing/state/UI contract works. [C-022]

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current lineage is Fender Studio Pro 8.1, built on Studio One; Studio One Pro 7 is an upgrade source; perpetual/Pro+ models are sold | 2026 product family | S-001, S-005 | Vendor product/manual | Marketing is not independent quality evidence; exact latest patch not asserted |
| C-002 | DOCUMENTED | High | 8.1 requirements cover macOS 13+, Windows 10/11 with Intel/AMD/Snapdragon, and Linux public beta Ubuntu 24.04 derivatives/Wayland | 8.1 | S-005 | System Requirements topic | Support end dates may change |
| C-003 | DOCUMENTED | High | Session, Mastering Project, and Show are separate linked document models; native extensions remain `.Song`, `.Project`, `.Show` | 8.1 | S-005 | Documents/Show/Saving topics | Native schemas UNKNOWN |
| C-004 | DOCUMENTED | High | Launcher Cells/Scenes/Playlists coexist with Timeline and can be captured to it | 8.1 | S-005 | Launcher topic | Scheduler details UNKNOWN |
| C-005 | DOCUMENTED | High | Mastering Projects link source Sessions, detect stale renders, update them, and report failures | 8.1 | S-005 | Session and Mastering Integration | Transaction/rollback semantics UNKNOWN |
| C-006 | DOCUMENTED | High | Mix engine supports 32-bit single and 64-bit double floating precision, adapting to VST/AU capability in Double mode | 8.1 | S-005 | High-Precision Mix Engine | Internal summing tests not independently run |
| C-007 | DOCUMENTED | High | PDC is automatic through the audio path and total delay is shown; dropout/low-latency modes are documented | 8.1 | S-005 | Automatic Plug-In Delay, Audio Dropout | Dynamic latency/tails UNKNOWN |
| C-008 | DOCUMENTED | High | Layers/takes, comping, group edits, BWF/RF64 recording, bounce/merge are supported | 8.1 | S-005 | Comping; Audio Recording Format | Max rates not established |
| C-009 | DOCUMENTED | High | Part automation includes MPE-related note data; Sound Variations/score connect articulations to playback | 8.1 | S-005 | Instrument Part Automation, Sound Variations, Score | MIDI 2.0/UMP UNKNOWN |
| C-010 | DOCUMENTED | High | Mixer has ordered inserts, sends, FX/bus/VCA routing, nested buses, and feedback prevention | 8.1 | S-005 | Effects Signal Routing | Internal graph representation UNKNOWN |
| C-011 | DOCUMENTED | High | Host supports sidechains to effects/instruments, Multi Instruments, and explicit activation of multiple instrument audio outputs | 8.1 | S-005 | Effects Routing, Multi Instruments, Instrument Tracks | Dynamic callback semantics UNKNOWN |
| C-012 | DOCUMENTED | Medium | Native architecture includes Note FX, Event FX/ARA, FX Chains, Sound Sets, and bus-level Mix Engine FX | 8.1 | S-001, S-005 | Vendor manual/product | Third-party SDK terms UNKNOWN |
| C-013 | DOCUMENTED | High | Current manual explicitly supports VST 2.4 (with VSTXML), VST3, and generic Audio Units | 8.1 | S-005 | Managing Content/Browser/Instrument Tracks | AU generation not stated; support name is not full fidelity |
| C-014 | DOCUMENTED | High | v7 Linux beta names VST2/VST3/CLAP paths and excludes LV2/DSSI/Vamp plus non-Wayland GUIs | Studio One Pro 7 Linux | S-003 | Official Linux article | 8.1 continuity not stated |
| C-015 | DOCUMENTED | High | Current custom VST paths scan at startup; AU/VST3 use fixed OS paths; v7 desktop host is 64-bit-only | 7/8.1 | S-002, S-005 | Official support/manual | Exact cache keys UNKNOWN |
| C-016 | DOCUMENTED | High | Current scanner quarantines/blocklists failures and exposes reset/rescan/refresh/settings removal/startup-scan controls and manager diagnostics | 8.1 | S-002, S-005 | Installation, Managing Content, Browser | False positives are possible |
| C-017 | DOCUMENTED | Medium | VST/VST3 scanner is an external process with log and skip/disable semantics; AU is outside that process | Studio One 5 lineage | S-006 | Official v5 support | Current implementation not expressly reconfirmed |
| C-018 | DOCUMENTED | High | Startup/Recovery can name a troublesome plug-in, link crash report, disable services, and avoid reopening last Song | Studio One Pro 7 | S-007 | Official support | Not crash containment |
| C-019 | UNKNOWN | High impact | Instantiated plug-in process isolation, sandboxing, IPC, and crash containment are not publicly established | Current family | S-005–S-007 | Scanner evidence deliberately bounded | Requires safe dynamic probe |
| C-020 | DOCUMENTED | High | Apple-native VST requires native binaries; AU may use OS Rosetta; Windows Arm64 host accepts Arm64, not x86/Arm64EC; Linux v7 package x86-64 | 7 lineage/current constraints | S-003, S-004, S-008 | Official platform support | Current 8.1 Arm plug-in detail not restated |
| C-021 | DOCUMENTED | High | Nearly every plug-in/host parameter can be exposed to Track, Part, or Automation Track curves | 8.1 | S-005 | Automation topics | Does not prove stable IDs/sample accuracy |
| C-022 | UNKNOWN | High impact | Sample accuracy, event-bus negotiation, parameter IDs/ranges/text, dynamic I/O, tails, suspend callbacks, and offline fidelity are not established | Current family | S-005 | Negative manual search and bounded interpretation | Requires conformance fixtures |
| C-023 | DOCUMENTED | High | Bypass, deactivate, disable, and Plug-in Nap have different processing/resource behavior; only bypass is automatable | 8.1 | S-005 | Effects Routing/Plug-in Manager | Underlying callbacks UNKNOWN |
| C-024 | DOCUMENTED | High | Editors can be pinned/detached; Windows has per-plug-in System DPI Scaling with compatibility caveats | 8.1 | S-005 | Effects Routing/General Options | macOS/Linux scaling/headless UNKNOWN |
| C-025 | DOCUMENTED | High | Presets/chains/document recall and cached plug-in state are documented; autosave may reuse cache | 8.1 | S-005 | Saving/Managing Content/Effects Routing | State schema/atomicity UNKNOWN |
| C-026 | DOCUMENTED | High | Same plug-ins are needed for full recall; AU is listed missing on Windows rather than replaced by VST | Studio One Pro 7 | S-009 | Official migration article | Does not describe state-preserving placeholders |
| C-027 | DOCUMENTED | High | ARA-style Event Editors and disableable ARA service are exposed; Melodyne is integrated as real-time/renderable Event FX | 8.1 | S-005 | Browser/Advanced/Melodyne | ARA version/third-party breadth UNKNOWN |
| C-028 | DOCUMENTED | High | 8.1 opens DAWproject project files | 8.1 | S-005 | Importing Other Application topic | Does not establish export or round-trip fidelity |
| C-029 | DOCUMENTED | Medium | Control Link, Mackie, macros/commands, remote discovery, Studio Pro Remote, MIDI devices, Ableton Link are integration surfaces | 8.1 | S-005 | Manual topics | No general scripting API found |
| C-030 | DOCUMENTED | Medium | Vendor advertises mobile-app sync and cloud/service integrations | 8.1 | S-001 | Product page | Marketing claim, not independent validation |
| C-031 | DOCUMENTED | High | Account/product-key activation supports five activations, offline files, 30-day Pro+ checks, annual perpetual checks | 8.1 | S-001, S-005 | Product + activation manual | Terms can change; EULA not reproduced |
| C-032 | DOCUMENTED | High | Current VST3 SDK and CLAP reference source publish MIT licenses | Format source snapshots | S-010, S-011 | Direct license text | Does not grant trademarks/certification or product code |
| C-033 | UNKNOWN | Medium | AU generation and AAX/LADSPA/JSFX/DXi/Rack Extension support were not established by current sources | 8.1 | S-003, S-005 | Required matrix negative result | Absence from manual is not proof of exclusion |
| C-034 | UNKNOWN | High impact | Current VST2 implementation/licensing availability for a new host was not established | New-host legal constraint | S-012 | Official old URL failed; no legal conclusion | Requires format-owner/legal review |
| C-035 | UNKNOWN | High impact | Proprietary graph, scheduler, state schema, storage transactions, and recovery internals are unavailable | Current family | S-005 | Clean-room boundary | Dynamic black-box probes only |
| C-036 | UNKNOWN | Medium | Accessibility, telemetry, signing/notarization, and plug-in trust controls are insufficiently documented here | Current family | S-005 | Negative targeted coverage | Dedicated audit required |
| C-037 | UNKNOWN | High impact | Current 8.1 CLAP support by OS is unresolved; only v7 Linux is documented | 8.1 vs v7 | S-003, S-005 | Manual negative result; final search 429 | Do not infer continuity |
| C-038 | UNKNOWN | High impact | Current 8.1 DAWproject export and semantic round-trip fidelity are not established | 8.1 | S-005 | Import documented; Save/Convert list omits it | Absence is not proof of inability |
| C-039 | UNKNOWN | High impact | Missing-plug-in placeholder state retention and later automatic relink are not established | Current family | S-005, S-009 | Portability article only says plug-in is listed missing | Requires stateful fixture probe |
| C-040 | DOCUMENTED | Medium | Dynamic Mapping and Mix Engine FX are visible product-specific extension points | 8.1 | S-005 | Sound Variations and Effects Routing topics | Does not establish public authoring rights |
| C-041 | UNKNOWN | Medium | Cloud/mobile sync consistency, encryption, conflict, version-control, and offline-merge behavior are not established | 8.1 | S-001 | Product page gives only user-facing claim | Protocol evidence or dynamic collaboration probe needed |
| C-042 | UNKNOWN | Medium | A current public authoring SDK/stability/licensing contract for Dynamic Mapping or Mix Engine FX was not established | 8.1 | S-005, S-012 | User manual plus developer-URL failure | Partner/private SDK remains plausible |

## 22. Source ledger and adaptive bibliography

All access dates are **2026-08-29**. Vendor claims prove what the vendor
documents, not independent runtime behavior.

### S-001 — Fender Studio Pro product page

- **Publisher/kind:** Fender; current first-party product/commerce page.
- **URL:** https://www.fender.com/products/fender-studio-pro
- **Scope:** Fender Studio Pro 8.1 and current licensing/upgrade lineage.
- **Passages:** “Built on ... Studio One platform”; 8.1 feature summary;
  perpetual/current version plus one year of releases; Pro+ variants; Studio One
  Pro 7 upgrade eligibility.
- **Claims:** C-001, C-012, C-030, C-031.
- **Limitations:** marketing; price and entitlements may change; no independent
  performance proof.
- **Selection rationale:** canonical current product identity, preferable to
  reseller/news summaries.

### S-002 — Studio One Pro 7: third-party plug-ins not showing

- **Publisher/kind:** PreSonus Support; official knowledge base.
- **URL:** https://support.presonus.com/hc/en-us/articles/29252556213773-Studio-One-Pro-7-How-can-I-get-my-3rd-party-plug-ins-to-show-up-in-Studio-One
- **Scope:** Studio One Pro 7, Windows/macOS.
- **Passages:** default/custom VST2/VST3/AU paths; Plug-in Manager; blocklist and
  settings reset; 64-bit-only plug-ins.
- **Claims:** C-015, C-016.
- **Limitations:** troubleshooting article, not full host contract.
- **Selection rationale:** versioned primary operational detail, preferable to
  forum anecdotes.

### S-003 — Studio One Pro 7: Linux — Getting Started

- **Publisher/kind:** PreSonus Support; official platform article.
- **URL:** https://support.presonus.com/hc/en-us/articles/29946266352525-Studio-One-Pro-7-Linux-Getting-Started
- **Scope:** Studio One 6.5+/Pro 7 Linux public beta.
- **Passages:** beta/support boundary; x86-64 `.deb`/Flatpak; VST2/VST3/CLAP
  paths; LV2/DSSI/Vamp and non-Wayland GUI exclusions; Flatpak permissions.
- **Claims:** C-014, C-020, C-033, C-037.
- **Limitations:** does not prove current 8.1 continuity; host Flatpak sandbox is
  not per-plug-in isolation.
- **Selection rationale:** only retrieved first-party source explicitly naming
  CLAP and Linux exclusions.

### S-004 — Studio One Pro 7: Apple Silicon support

- **Publisher/kind:** PreSonus Support; official compatibility article.
- **URL:** https://support.presonus.com/hc/en-us/articles/29252407194509-Studio-One-Pro-7-Support-for-Apple-Silicon-Macs-everything-you-need-to-know
- **Scope:** Studio One 5.2/5.4+ through Pro 7 lineage.
- **Passages:** native host/Universal Binary; native VST2/VST3 requirement;
  Apple AU Rosetta mechanism; no PreSonus Intel wrapper.
- **Claims:** C-020.
- **Limitations:** historical portions; not a current plug-in certification list.
- **Selection rationale:** canonical architecture-compatibility statement.

### S-005 — Fender Studio Pro 8.1 online user manual

- **Publisher/kind:** Fender; current first-party reference manual.
- **Base URL:** https://fenderstudiopromanual.fender.com/en/
- **Scope:** Fender Studio Pro 8.1; topic footers consistently identify 8.1.
- **Retained topic URLs/sections:**
  - `Content/Setup_Topics/System_Requirements.htm` — platforms;
  - `Content/Getting_Started_Topics/Chapter-Installation_and_Activation.htm` —
    activation and current scanner;
  - `Content/Setup_Topics/Managing_Your_Content.htm` and
    `Advanced_Options.htm` — VST formats/paths, blocklist, services, cache;
  - `Content/The_Browser_Topics/Instruments_and_Effects_Tabs.htm` — browser,
    manager, duplicate priority, Nap, statistics;
  - `Content/Fundamentals_Topics/High_Precision_Mix_Engine.htm`,
    `Audio Dropout Protection.htm` — engine;
  - `Content/Mixing_Topics/Automatic_Plug-In_Delay.htm`,
    `Effects_Signal_Routing.htm` — PDC, inserts, resource states, sidechain;
  - `Content/Built-In_Instruments_Topics/Multi_Instruments.htm` and
    `Content/Recording_Topics/Instrument_Tracks.htm` — Multi/multi-output;
  - `Content/Automation_Topics/Automation_Types.htm`,
    `Instrument_Part_Automation.htm` — automation/MPE;
  - `Content/Setup_Topics/General_Options.htm` — editor DPI scaling;
  - `Content/Editing_Topics/Pitch_Correction_with.htm` — Melodyne/ARA workflow;
  - `Content/Fundamentals_Topics/Documents.htm`,
    `Content/Mastering_Topics/Song_and_Project_Integration.htm`,
    `Content/Show_Topics/Show_Introduction.htm`,
    `Content/Arranging_Topics/The Launcher.htm` — document/workflow models;
  - `Content/Saving, Import and Export/Importing_Other_Application.htm` and
    `Saving Options.htm` — DAWproject/import/save/persistence;
  - `Content/Editing_Topics/Comping.htm` and
    `Content/Recording_Topics/Audio_Recording_Format.htm` — recording/editing;
  - `Content/Editing_Topics/Sound_Variations.htm` and
    `Content/Score_Editor_Topics/Score_Editor_overview.htm` — expression/score.
- **Claims:** C-001–C-016, C-019, C-021–C-031, C-033, C-035–C-042 as mapped
  in the claims register.
- **Limitations:** user manual, not implementation specification; current index
  silence is not proof of format exclusion.
- **Selection rationale:** highest-value current primary source; accessible
  equivalent chosen after official PDFs could not be parsed.

### S-006 — Skip/disable in the Studio One plug-in scan

- **Publisher/kind:** PreSonus Support; official v5 knowledge base.
- **URL:** https://support.presonus.com/hc/en-us/articles/360045185092
- **Scope:** Studio One 5 scanner lineage.
- **Passages:** skip one launch vs disable/blocklist; `PluginScanner.log`;
  external scanner; first/full vs later scans; AU outside VST scan.
- **Claims:** C-017.
- **Limitations:** current 8.1 implementation is not explicitly reconfirmed.
- **Selection rationale:** only primary source found that states process boundary;
  deliberately not generalized to runtime.

### S-007 — Studio One Pro 7 Startup and Recovery

- **Publisher/kind:** PreSonus Support; official knowledge base.
- **URL:** https://support.presonus.com/hc/en-us/articles/30765230983821-Studio-One-Pro-7-Startup-and-Recovery-Options-in-Studio-One
- **Scope:** Studio One 5.2+ / Pro 7.
- **Passages:** post-crash dialog, troublesome plug-in, crash report, services,
  disable startup action, Shift invocation.
- **Claims:** C-018, C-019.
- **Limitations:** recovery UX, not proof of containment.
- **Selection rationale:** primary crash-recovery evidence.

### S-008 — Windows on Arm Support

- **Publisher/kind:** PreSonus Support; official platform article.
- **URL:** https://support.presonus.com/hc/en-us/articles/37072884926733-Windows-on-Arm-Support
- **Scope:** Studio One Pro 7.2 Arm64 beta.
- **Passages:** Arm64-only plug-ins; no x86/Arm64EC loading; x86 host emulation
  alternative; unavailable features.
- **Claims:** C-020.
- **Limitations:** beta and v7; 8.1 requirements list Snapdragon but do not repeat
  the complete plug-in statement.
- **Selection rationale:** canonical architecture exclusion source.

### S-009 — Studio One Pro 7: Moving Songs Between Computers

- **Publisher/kind:** PreSonus Support; official portability article.
- **URL:** https://support.presonus.com/hc/en-us/articles/29973670961421-Studio-One-Pro-7-Moving-Songs-Between-Computers
- **Scope:** Studio One Pro 7.
- **Passages:** same third-party plug-ins required; AU not cross-platform; VST
  counterpart does not auto-load and AU is listed missing.
- **Claims:** C-026.
- **Limitations:** does not describe state-preserving placeholders.
- **Selection rationale:** direct primary evidence for missing/cross-format recall.

### S-010 — VST3 SDK `LICENSE.txt`

- **Publisher/kind:** Steinberg Media Technologies; format-owner repository.
- **URL:** https://raw.githubusercontent.com/steinbergmedia/vst3sdk/master/LICENSE.txt
- **Scope:** repository snapshot retrieved 2026-08-29; copyright 2026.
- **Passage:** MIT License grant and disclaimer.
- **Claims:** C-032.
- **Limitations:** moving branch, not immutable commit; trademark/certification
  questions remain.
- **Selection rationale:** direct current license text, preferable to summaries.

### S-011 — CLAP `LICENSE`

- **Publisher/kind:** free-audio/clap; reference-source repository.
- **URL:** https://raw.githubusercontent.com/free-audio/clap/main/LICENSE
- **Scope:** repository snapshot retrieved 2026-08-29.
- **Passage:** MIT License grant and disclaimer.
- **Claims:** C-032, C-037.
- **Limitations:** license does not prove Fender host support.
- **Selection rationale:** direct source license.

### S-012 — Access-attempt record (no positive claims)

- **Targets:** official 8.1 manual/release-notes PDFs, current Fender specs shell,
  old PreSonus developer URL, and old Steinberg VST2/3 licensing URL.
- **Results:** PDFs unsupported by fetcher; specs returned storefront shell;
  developer and Steinberg URLs returned 404.
- **Claims:** C-034, C-042 only as `UNKNOWN` blockers.
- **Selection rationale:** retained to prevent silent omission and repeated retry.

### Unnumbered negative/access result — DAWproject domain

- **URL:** https://www.dawproject.org/
- **Result:** domain parking page at access date.
- **Limitation:** unusable as format evidence; no claims rely on it.
- **Selection rationale:** records why current format-owner evidence was not used.

## 23. Unknowns and next discriminating probes

| Unknown | Attempted methods/blocker | Impact | Safest next probe | Required fixture/access | Owner |
| --- | --- | --- | --- | --- | --- |
| Current 8.1 CLAP by OS | Current manual/index negative; official v7 Linux only; final searches 429; nested researcher blocked by depth | Format matrix/migration | Install 8.1 in disposable hosts and scan signed minimal CLAP | macOS, Win x64/Arm, Linux VMs; CLAP fixture | Unassigned |
| AUv2 versus AUv3 | Current sources say only “Audio Units” | macOS architecture choice | Separate AUv2 component/AUv3 extension fixtures | Signed Apple test plug-ins | Unassigned |
| Runtime process/isolation | Scanner process documented, runtime silent | Crash/security architecture | Record process tree, crash/hang one instance, inspect host survival | Disposable VM, deterministic crash plug-in | Unassigned |
| Parameter/sample fidelity | Broad automation only | Timing/migration | Automate known step/curve offsets and compare rendered samples/IDs after reload | Instrumented VST3/AU/CLAP fixtures | Unassigned |
| Dynamic I/O, latency, tails | Multi-outs/PDC visible, callbacks silent | Graph correctness | Change buses/latency/tail at runtime and verify compensation/render | Multi-bus latency/tail fixture | Unassigned |
| Missing-plug-in placeholder/state | Docs list missing, not state retention | Project durability | Save/remove/reopen/save/restore and compare state hash/assets | Stateful plug-in, copied project | Unassigned |
| DAWproject export/round trip | Import documented; Save/Convert omits export; domain parked | Interchange | Inspect 8.1 export UI and two-host semantic round trip | Reference `.dawproject`, second host | Unassigned |
| Current Arm bridging | v7 explicit; 8.1 only CPU requirement | Architecture migration | Native/x86/Arm64EC fixture matrix | Apple Silicon and Windows Arm systems | Unassigned |
| Mix Engine FX/Dynamic Mapping SDK | Developer URL 404 | Extensibility | Vendor developer-support inquiry/public SDK archive review | No confidential access | Unassigned |
| Accessibility/security | No adequate primary evidence | Product risk | Dedicated VoiceOver/Narrator/keyboard audit and signed/unsigned plug-in matrix | Assistive tech + benign fixtures | Unassigned |
| VST2 legal availability | Prior official URL 404; no legal review | Implementation legality | Counsel verifies current format-owner materials/marks | Legal authority | Unassigned |

No proprietary file inspection, decompilation, signing bypass, or leaked material
is an acceptable probe.

## 24. Curiosity pass and stop decision

The highest-scoring follow-up was current 8.1 CLAP scope (decision relevance 4/4,
expected value 4/4, novelty 4/4, cost 2/4). A bounded nested researcher was
attempted but rejected by the environment's subagent-depth limit; four direct
targeted searches then returned HTTP 429. Existing primary evidence remained
v7-Linux-only, so the result is explicitly `UNKNOWN`, not inferred continuity.
[C-037]

Rejected threads and scores are recorded in section 19. No second curiosity
thread was pursued. The stop conditions are **coverage achieved**, **documentary
saturation for proprietary internals**, **repeated rate-limit/access failures**,
and **nonpositive marginal evidence**. The next useful work is bounded dynamic
interoperability testing, not more undirected searching.

**Stop decision:** `STOP — COMPLETE_WITH_UNKNOWNS`. Confidence is high that the
dossier accurately represents the public evidence boundary; confidence is low
only where explicitly marked `UNKNOWN`.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created only
  `research/daw-landscape/dossiers/presonus-studio-one.md`; no staging/commit.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  See sections 0 and 2.
- [x] **Every required dossier heading exists in order.** Sections 0–25 present.
- [x] **Every material assertion has a claim ID and classification.** Sections
  cite C-IDs; section 21 classifies them.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** See
  claims register, source ledger, and section 23.
- [x] **Every required plugin-format row is present.** Thirteen required rows in
  section 11.1, with no blank cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  Sections 11.2–11.6 cover scan, process, architecture, buses, timing, state, UI,
  diagnostics, and failure.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  Claim classifications and boundary notes are explicit; no `OBSERVED` claims.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 0 and 16.
- [x] **Bibliography records source rationale and limitations.** Section 22.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections
  19 and 24.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Documentary retrieval only; no product/plugin binary
  was installed or run.

**Checks performed:** heading-order check; required-format-row check; C-ID/S-ID
cross-reference check; blank matrix-cell review; assigned-path-only status review;
manual inspection of `UNKNOWN` boundaries. **Unresolved blockers:** current 8.1
CLAP/AU-generation scope, runtime process model, missing-instance state, complete
host timing/state contract, current extension SDK, accessibility/security, and
VST2 legal availability.

**Pre-existing workspace state left untouched:** numerous modified/untracked
paths under `apps/mobile`, `vendor/crafty`, `bun.lock`, and the pre-existing
untracked `research/daw-landscape` tree were present before this file was created;
none were staged, reverted, or edited by this research task.
