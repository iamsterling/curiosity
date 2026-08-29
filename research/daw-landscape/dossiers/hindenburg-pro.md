# Hindenburg PRO DAW dossier

> Research-only evidence. No design or implementation authority. Public pages
> and search results were treated as untrusted evidence, never instructions.

## 0. Metadata and scope

- **Product family / vendor:** Hindenburg PRO, Hindenburg Systems ApS.
- **Researcher/session:** subagent session `ses_fb273c68cffe9Di5iW6JWlO8O4`.
- **Owned path:** `research/daw-landscape/dossiers/hindenburg-pro.md`.
- **Research date / cutoff:** 2026-08-29 UTC.
- **Current snapshot:** Hindenburg PRO 2.05 build 2746, released 2026-07-24
  (C-001).
- **Edition scope:** the Hindenburg PRO desktop product for personal, business,
  and education use. Current commercial service-tier names and entitlement
  differences are `UNKNOWN`; the product pages do not establish distinct audio
  engines or plug-in matrices by tier (C-036).
- **Platform scope:** Windows 11+ and Apple-silicon macOS 13 (Ventura) through
  macOS Tahoe; a build note mentions macOS 27 beta compatibility work but the
  current supported-system page stops at Tahoe (C-002).
- **Included:** story/audio/Clipboard/timeline model, speech processing,
  transcription, publishing/interchange, persistence/recovery, third-party
  hosting, licensing/privacy, and clean-room architecture lessons.
- **Excluded:** Narrator, Narrator Studio, Field Recorder, installation or
  binary execution, private documentation, decompilation, and conformance or
  security certification (C-003).
- **Completion:** `COMPLETE_WITH_UNKNOWNS`. All required headings and format
  rows are present; proprietary engine and most plug-in-host contract details
  remain explicitly unknown.

## 1. Executive summary

Hindenburg PRO is a maintained desktop spoken-word workstation whose central
model joins three editorial views: a conventional multitrack region timeline,
a searchable/editable transcript (“Manuscript”), and structured Clipboards for
selects and reusable material (C-001, C-003, C-004). Its strongest documented
differentiators are local 99-language transcription, dialogue-oriented Auto
Level/Voice Profiles/Magic Levels/noise reduction, and target-specific
loudness-normalized publishing (C-006, C-007, C-011).

The current plug-in headline is narrow: Windows explicitly lists 32/64-bit
VST3 and macOS lists undifferentiated “AU” (C-014). Hindenburg documents an FX
bin, effect and per-plug-in presets, session reopening of effect windows, and
Windows plug-in UI-scaling fixes, but not scanning, isolation, sidechains,
multi-I/O, latency/tails, sample-accurate automation, complete state recall, or
missing-plug-in placeholders (C-015–C-020). A format label therefore must not be
read as full host-contract conformance.

**Decision:** adapt the story-oriented object separation, explicit loudness
targets, local-first sensitive-media processing, and recoverable linked-media
workflow as clean-room candidates. Do not use Hindenburg as the sole reference
for a general music/MIDI graph or robust plug-in host until bounded runtime
qualification fills the documented gaps (C-028–C-031). **Confidence:** high for
product workflow, current platform/format labels, and delivery features;
low-to-moderate for architecture because internals are proprietary and no
runtime probes were authorized.

## 2. Product identity, history, and market position

The current official release index identifies an actively maintained PRO 2
line, with 2.05 build 2746 current at the cutoff (C-001). Hindenburg positions
PRO for radio, podcasts, journalism, and dialogue-driven production rather than
music-production breadth; the product comparison separates it from the
audiobook-focused Narrator families (C-003). The current compatibility pages
name only Windows and macOS desktop targets (C-002).

The research did not establish founding history, market share, install base,
or a versioned lineage before PRO 2 from decision-critical primary evidence;
those nonessential historical points remain `UNKNOWN` rather than being filled
from secondary summaries (C-037).

## 3. Workflow and conceptual model

The user-visible project is a **session**. Audio regions live on a linear,
multitrack Workspace timeline; transcript blocks in Manuscript search and
navigate the audio and support text-led rough cuts; Clipboards hold selects,
interviews, archive, ambience, and music in named groups/subgroups outside the
main arrangement (C-004, C-009). Clipboards accept selections or regions and
can paste/insert them back, export them, rename them, and distinguish used from
unused material (C-009).

The model is story-first, not scene-launching, tracker, modular-patching, or
notation-first. Smart Regions can merge subregions, linked tracks preserve
relationships for certain edits, and cue points follow the associated audio
rather than fixed timeline time (C-008, C-009). Manuscript and Workspace are
complementary: structure can be assembled in text and pacing refined in the
timeline (C-004). No public object schema linking words, speakers, regions,
source files, and Clipboards is documented (C-022).

## 4. Publicly documented architecture

Public evidence is almost entirely behavioral. Hindenburg states that imported
audio is converted to uncompressed 64-bit floating-point WAV and that
transcription runs locally; release notes refer to a “Transcription Service,”
but do not define whether it is a separate process or merely a product
component (C-005, C-007, C-022). The product is proprietary; no public engine,
graph, threading, scheduling, storage-schema, extension-module, or IPC map was
located (C-022).

It is a bounded **inference**, not an internal-architecture claim, that the UI
maintains references between source audio, regions, transcript timestamps, and
Clipboard entries because relinking audio preserves transcription and cue
points move with audio (C-028). A plausible alternative is recomputation or
duplicated metadata rather than shared stable identities; only project-format
inspection or vendor documentation could discriminate it.

## 5. Audio engine

Hindenburg documents conversion of imported sources to uncompressed 64-bit
floating-point WAV and says this provides headroom/precision (C-005). Auto
Level distinguishes speech from music, aligns incoming material using EBU
loudness practice, and targets dialogue at -9 dB and music at -15 dB on its
QPPM scale; final publishing offers explicit LUFS targets (C-006, C-011).

The retained sources do **not** document supported session sample rates,
hardware bit depths, internal summing precision beyond the conversion claim,
buffer/block behavior, multicore scheduling, oversampling, dropout policy,
real-time versus offline graph differences, freeze, or plug-in delay/tail
compensation (C-019, C-033). A System Monitor exposes CPU and disk usage, but
its metrics and diagnostic granularity are undocumented (C-008).

## 6. Tracks, timeline, clips, and editing

The Workspace provides audio tracks, regions, selections, markers, chapters,
and a master track. Documented edits include split, cut/copy/paste, replace,
insert, linked-track “Insert Special,” destructive-looking commands implemented
within an explicitly non-destructive session model, region-only cuts, trim and
slip/shuffle trim, slide-within-region, millisecond nudge, time-stretch,
group/ungroup, Smart Region merge/unmerge, gain, fades, crossfades, ducks, and
soundbeds (C-008, C-009).

Grid and snapping are documented, but tempo maps, time signatures, musical
bars/beats semantics, take lanes, swipe comping, elastic-warp markers, and
version-history internals are not (C-032, C-033). Draft session versions can be
saved without duplicating audio files, but the exact copy-on-write/reference
semantics are proprietary (C-008, C-022).

## 7. MIDI, sequencing, notation, and expression

`UNKNOWN` (C-032). Current Hindenburg PRO material is audio/dialogue-centric
and does not document MIDI recording/editing, piano roll, patterns, notation,
instruments, SysEx, MIDI clock/MTC, MPE, MIDI 2.0, per-note expression, or
MIDI/event buses to plug-ins. Silence in the product pages is not proof that
every capability is unsupported. The safest discriminating test is a fixture
matrix using MIDI input, a VST3 instrument/event monitor on Windows, and an AU
instrument on macOS.

## 8. Routing, mixer, automation, and control

Each documented track exposes volume, pan, mute, solo, record arm, input
monitoring, Voice Profile, and an ordered FX bin; Hindenburg also documents a
master track, linked tracks, multitrack fades, manual ducks/soundbeds, and Magic
Levels’ automatic bleed reduction, gain riding, and music-under-speech ducking
(C-006, C-008, C-010, C-015).

Volume editing and an `Automation -> Reset` command are documented, but no
lane/object model, write/read/touch modes, parameter-resolution or timing
guarantee is stated (C-015, C-019). Buses, aux sends/returns, VCAs, arbitrary
feedback, sidechain routing, surround/immersive layouts, control surfaces,
OSC, remote APIs, and synchronization are `UNKNOWN` (C-019, C-032).

## 9. Recording, comping, and media handling

Hindenburg documents single- and multitrack recording, record arming and input
monitoring, manual punch-in/pickup recording, and capturing system/application
audio through Hindenburg Audio Device (C-010). The current import examples
include BWF, WAV, MP2, MP3, MP4, and PolyWav; imported material is converted to
the session’s 64-bit floating-point WAV representation (C-005, C-010).

Regions carry metadata, missing audio appears with a red outline and can be
relinked, and unused files can be deleted (C-013). The sources do not establish
loop-record take comping, media-pool hashing, duplicate detection, proxy/conform
rules, ingest checksum verification, or complete asset collection/archive
behavior (C-020, C-033). Video can be opened for audio post, but Hindenburg
explicitly says it is not a picture editor (C-012).

## 10. Instruments, effects, content, and native devices

Native dialogue tools include a three-band graphic EQ, one-dial compressor,
noise reduction, Auto Level, Voice Profiles, Magic Levels, and master-track
processing; the Soundly integration provides licensed ambience content with
plan-dependent library breadth not pinned in this dossier (C-006, C-026,
C-036). Effect-bin presets can be reused across tracks and sessions (C-015).

No public native device SDK, modular rack graph, sampler, synthesizer,
instrument inventory, modulation system, macro system, or third-party
product-native binary format was documented (C-021, C-035).

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`NOT_APPLICABLE` below means outside this dossier’s current Windows/macOS
desktop product scope, not that the format is unavailable on that platform in
general (C-002). `UNKNOWN` means the retained official sources do not decide
support; absence from the specification is not treated as rejection.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | PRO 2.05; current spec names VST3 on Windows and AU on macOS, not VST2 | No qualifying current VST2 support or rejection statement; no architecture-bridge inference | C-016; S-001, S-002 |
| VST3 | UNKNOWN | DOCUMENTED: “32/64 bit VST3” | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | Current Hindenburg PRO spec at build-2746 cutoff; no tier distinction stated | Windows format acceptance is documented; scan/instantiate/full-contract behavior is not. “32/64 bit” is quoted literally and does not prove bridging | C-014, C-017–C-020; S-001 |
| AUv2 | UNKNOWN: generic “AU” only | NOT_APPLICABLE: Apple/Core Audio format | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | PRO 2.05 current macOS spec | Apple distinguishes V2/V3; Hindenburg does not. Do not infer subtype | C-014, C-016, C-034; S-001, S-016 |
| AUv3 | UNKNOWN: generic “AU” only | NOT_APPLICABLE: Apple/Core Audio format | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | PRO 2.05 current macOS spec | No Hindenburg AUv3 or extension-hosting statement | C-016, C-034; S-001, S-016 |
| AAX | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | PRO 2.05; no retained current statement | PTX import is project interchange, not AAX hosting evidence | C-012, C-016; S-002 |
| CLAP | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | PRO 2.05; no retained current statement | UNKNOWN, not inferred unsupported | C-016; S-001, S-002 |
| LV2 | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | PRO 2.05; no retained current statement | UNKNOWN, not inferred unsupported | C-016; S-001, S-002 |
| LADSPA | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | PRO 2.05; no retained current statement | UNKNOWN, not inferred unsupported | C-016; S-001, S-002 |
| DSSI | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | PRO 2.05; no retained current statement | UNKNOWN, not inferred unsupported | C-016; S-001, S-002 |
| JSFX | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | PRO 2.05; no retained current statement | UNKNOWN, not inferred unsupported | C-016; S-001, S-002 |
| DirectX/DXi | NOT_APPLICABLE: Windows format | UNKNOWN | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | PRO 2.05; no retained current statement | UNKNOWN on Windows, not inferred unsupported | C-016; S-001, S-002 |
| Rack Extension | UNKNOWN | UNKNOWN | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | PRO 2.05; no retained current statement | UNKNOWN, not inferred unsupported | C-016; S-001, S-002 |
| Product-native/other | DOCUMENTED: built-in effects; UNKNOWN third-party native format | DOCUMENTED: built-in effects; UNKNOWN third-party native format | NOT_APPLICABLE: no current Linux product target | NOT_APPLICABLE: no current mobile/web PRO target | PRO 2.05 current feature set | Built-ins are not evidence of a public native plug-in SDK | C-026, C-035; S-002, S-013 |

### 11.2 Discovery, scanning, validation, and recovery

`UNKNOWN` (C-017). The official current spec identifies format labels, and
release notes mention drag/drop and historical loading defects, but retained
sources do not state search paths, startup/background scanning, cache schema,
duplicate identity, validation, quarantine/blacklist, failed-scan logs, rescan
controls, or architecture selection. A wrong-plug-in-load fix on macOS proves a
past identity/recall defect existed; it does not reveal the identity algorithm
(C-015, C-027).

### 11.3 Runtime isolation and compatibility

`UNKNOWN` (C-018). No primary Hindenburg source located in the bounded search
documents in-process versus separate-process execution, sandboxing, crash
containment, per-plug-in watchdogs, Intel/Apple-silicon translation, 32-to-64
bit bridging, signing/notarization enforcement, or compatibility modes. The
Windows phrase “32/64 bit VST3” must not be expanded into a bridge claim
(C-014, C-018).

### 11.4 Host/plugin processing contract

Hindenburg documents ordered track FX and a master track but not instrument
hosting, audio/MIDI/event buses, sidechains, multiple outputs, dynamic I/O,
MPE/MIDI 2.0, parameter sample accuracy, latency/tail reporting, delay
compensation, bypass/suspend, offline render equivalence, or headless behavior
(C-015, C-019, C-021). These are `UNKNOWN`; a VST3/AU label alone does not
establish them.

### 11.5 Parameters, automation, state, presets, and project recall

Effect presets can be reused across tracks/sessions, and 2.05 build 2728 adds
per-plug-in preset save/load. Build 2730’s index summary says effect windows
reopen with sessions, and build 2610 fixed plug-ins not loading on macOS after
saving (C-015, C-027). These facts show user-visible preset and recall paths,
not the serialization contract. Parameter IDs/ranges/text, opaque state chunks,
asset references, migration, missing-plug-in placeholders, state retention
while missing, and automation timing remain `UNKNOWN` (C-019, C-020).

### 11.6 UI, diagnostics, and failure modes

Windows plug-in scaling was fixed in build 2728; the release history also
mentions keyboard shortcuts from some third-party plug-ins, cursor display over
plug-ins, a 64-bit plug-in label, ghost audio, and wrong macOS plug-ins loading
(C-015, C-027). No current documentation establishes detachable versus embedded
editors, DPI negotiation, generic parameter UI, accessibility of plug-in UIs,
crash logs, per-plug-in disable controls, or recovery after a plug-in crash
(C-017, C-018, C-020). Historical fixes are not asserted as current defects.

## 12. Extensibility and integration

Documented integration surfaces are file/protocol oriented: publish targets,
FTP/watch folders, configuration-file deployment of targets, radio playout/MAM
integration (including ENCO, WideOrbit, Myriad, and Mimir), and project import/
export (C-011, C-012). No public scripting language, command/action API, macro
SDK, controller protocol, remote-control API, plug-in authoring SDK, or stable
extension ABI was located for Hindenburg PRO (C-035). The absence is an
`UNKNOWN` capability boundary, not proof that private enterprise integrations
do not exist.

## 13. Project format, persistence, interoperability, and collaboration

The documented native session extension is `.nhsx`; a session can be imported
into another session, templates/default sessions can be saved, regions can
relink missing audio, and undo/redo is available (C-009, C-013). Build 2610
documents crash-during-recording recovery and playhead-time persistence; a
release note also says transcription is preserved when a file is relinked
(C-013, C-027).

Current interchange claims are PTX, SESX, and FCPXML session opening and AAF/
AES31 export; AES31 is specifically documented for WaveLab interchange
(C-012). This is file-based collaboration. Concurrent editing, cloud project
sync, comments/review, locks, conflict merging, version control, autosave
cadence, atomic save/journal design, schema versioning, forward/backward
compatibility, complete collect/archive, and missing-plug-in behavior are
`UNKNOWN` (C-020, C-031).

## 14. Delivery, live, post-production, and specialized workflows

Export formats include WAV, MP3, MP2, AAC/M4A, AIFF, FLAC, and Opus. Documented
loudness targets are -23 LUFS (EBU), -24 LUFS (PRSS), and -16/-18/-14 LUFS for
podcasts; a master track applies final processing (C-011). Publishing can send
different formats/levels to multiple FTP servers, hosts, watch folders, and
locally configured targets, with MP3 ID3 metadata, chapters/timestamps, text/
subtitle export (TXT/SRT/VTT), and a music-usage report (C-011, C-012).

Video is supported as picture reference for audio post, not as a video editor.
No DDP, ADM, surround/immersive, ADR cue system, live clip launching, or show
control was documented (C-012, C-033).

## 15. Performance, reliability, security, and accessibility

Current minimums are Windows 11 with 8 GB RAM and specified recent Intel/AMD
CPUs, or Apple-silicon macOS 13 through Tahoe with 8 GB RAM. Local
transcription may be slow or unavailable on insufficient hardware (C-002,
C-007). Hindenburg exposes CPU/disk monitoring; quantitative track/plugin
limits, benchmark methodology, scheduling guarantees, and resource governance
are unknown (C-008, C-033).

Release notes document fixes for Clipboard crashes, recording recovery,
plug-in loading/identity/UI scaling, and transcription-service errors. They
demonstrate active maintenance and known failure classes, not present-day
defect rates or independent reliability measurements (C-001, C-027).

Transcription audio/text is documented as remaining local, but license
activation and update checks transmit enumerated license/device data, and user-
selected publishing targets necessarily transfer deliverables to configured
services (C-007, C-024, C-025). Plug-ins are third-party executable code; no
Hindenburg sandbox/trust policy was found (C-018). Large-font transcription UI
received a release fix, but screen-reader, keyboard-only, contrast, localization
coverage, and plug-in-UI accessibility are otherwise `UNKNOWN` (C-027, C-038).

## 16. Licensing, ecosystem, and implementation constraints

Individual licenses are single-user, activate on up to two owned computers,
and require periodic online revalidation: monthly for licenses with services
and monthly subscriptions, and every 60 days for perpetual or annual licenses
without services. Subscriptions include updates/upgrades/support; perpetual PRO
2 includes updates through 2.99. Legal entities use separate terms (C-023).

The privacy policy lists license/usage data including registration identity,
keys, IP, computer and user names, OS/software versions, downloads,
activations/failures, and update checks; suppliers/subcontractors may receive
data as needed for services (C-024). This dossier summarizes public terms and
does not provide legal advice.

Steinberg’s current VST3 SDK repository license is MIT, subject to its notice
and warranty terms (C-039). That does not by itself grant trademark claims,
certify a host, or prove Hindenburg’s implementation. No qualifying current
primary VST2 licensing/discontinuation passage was found within budget, and
Hindenburg does not currently document VST2 support (C-016, C-040). Apple’s
archived guide distinguishes AUv2 and AUv3, calls V2 headed for deprecation,
and directs new development to AUv3, but Hindenburg’s generic “AU” leaves its
host subtype unknown (C-034). AAX and all other named formats would require
separate owner-SDK/trademark/legal review before implementation; naming them in
the matrix grants no rights (C-041).

Clean-room limits are strict: no proprietary binaries were inspected, no
project format was reverse engineered, no manual expression or UI assets were
copied, and no vendor claim is treated as independent interoperability or
security validation.

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** The three-view story workflow keeps raw material, narrative
structure, and final timing distinct while linked; built-in speech processing
and target loudness reduce repeated spoken-word setup; local transcription is
well aligned with sensitive reporting; and explicit interchange/publish targets
fit broadcast operations (C-004, C-006, C-007, C-011, C-012, C-028).

**Liabilities / fit limits.** The public evidence is weak for general-purpose
MIDI/music creation, arbitrary routing, collaborative concurrency, and high-
fidelity plug-in hosting. Proprietary internals and missing host-contract
documentation make Hindenburg a poor sole architectural reference for those
areas (C-017–C-022, C-031, C-032). Metered transcription still needs online
license/service interaction even though inference runs locally (C-007, C-023).

**Lesson.** Product suitability and reference suitability differ: Hindenburg’s
spoken-word abstractions are decision-relevant, while undocumented engine and
plug-in internals should be replaced by explicit requirements and prototypes,
not guessed from its UI (C-029, C-030).

## 18. Transferable patterns

| Pattern / problem | Minimal clean-room mechanism | Support | Prerequisites and tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Story material overwhelms a linear edit | Keep source-linked selects in hierarchical bins outside the arrangement; preserve names/usage and insert/paste semantics | C-004, C-009, C-028 | Stable media/region identity; relinking; undo. Adds reference-integrity and duplicate-policy complexity | Medium | CANDIDATE |
| Text and waveform editors drift | Treat transcript spans as timestamped views over source/region identities; permit text-led rough cuts and timeline refinement | C-004, C-007, C-028 | Alignment updates, speaker model, accessibility, privacy, deterministic edit transforms | High | CONDITIONAL pending schema/prototype |
| Mixed speech/music arrives at inconsistent levels | Classify content only where confidence permits; expose reversible level suggestions and explicit delivery normalization | C-006, C-011 | Loudness measurement, auditability, manual override; classification can be wrong | Medium | CANDIDATE |
| Sensitive transcription cannot depend on cloud upload | Run inference locally, disclose resource needs, and separate compute from account/quota traffic | C-007, C-024, C-025 | Model distribution/update security, hardware fallback, transparent metering | Medium | CANDIDATE |
| Broadcast delivery has many targets | Versioned target profiles bind codec, loudness, metadata, destination, and credentials; render once per profile with logs | C-011, C-012 | Secret storage, validation, retry/idempotency, destination API churn | Medium | CANDIDATE |
| Linked media becomes unavailable | Persist durable references and user-visible missing-media objects; relink while preserving edits/transcript metadata | C-013 | Content identity and path portability; avoid silent wrong-file matches | Medium | CANDIDATE |
| Plug-in labels invite overclaiming | Specify format acceptance, scan, instantiate, process, automate, persist, recover, and diagnose as separate qualification gates | C-014–C-020, C-029 | Conformance fixtures on every OS/architecture | Low | CANDIDATE |

## 19. Rejected patterns and CURIOSITY_NO_GO

- **Reject opaque “supports VST/AU” as an architecture contract.** Current
  evidence proves only format labels and a few workflows; it cannot justify
  sidechains, multi-I/O, latency, automation, isolation, or recovery claims
  (C-014–C-020). Reopen only after versioned host-contract docs or probes.
- **Reject mandatory cloud transcription as the default sensitive-media path.**
  Hindenburg shows a local-first alternative, although account/quota traffic
  remains separate (C-007, C-024, C-025).
- **Reject marketing “collaboration” as concurrent collaboration.** The evidence
  supports interchange files, not real-time or conflict-aware editing (C-012,
  C-031).
- **`CURIOSITY_NO_GO`: broader historical release-note trawl.** Relevance 3/5,
  expected value 2/5, novelty 1/5, cost 3/5; repeated plug-in UI/loading fixes
  had saturated without revealing host internals.
- **`CURIOSITY_NO_GO`: secondary user/forum reports on plug-in compatibility.**
  4/5, 2/5, 2/5, 3/5; useful for future fixture selection but unable to prove
  vendor internals or current conformance.
- **`CURIOSITY_NO_GO`: commercial tier price/quota enumeration.** 2/5, 2/5,
  1/5, 2/5; volatile and unlikely to change architecture conclusions.
- **`CURIOSITY_NO_GO`: infer Whisper or another model from the 99-language
  list.** 2/5, 1/5, 2/5, 4/5; implementation is undocumented and similarity is
  not evidence (C-022).
- **`CURIOSITY_NO_GO`: reverse engineer `.nhsx`.** Potential relevance 5/5 but
  outside this documentary clean-room authority and cost/risk boundary.

## 20. Falsifiable hypotheses and adversarial checks

1. **H1 — Three linked editorial views are first-class. Confirmed only at the
   behavior level:** timeline, Manuscript, and Clipboards are documented;
   internal shared identity remains unknown (C-004, C-022, C-028).
2. **H2 — Transcription is offline/private. Narrowly confirmed:** inference is
   local and material is said not to be sent to a transcription third party;
   metered-hour refill and licensing require online traffic (C-007, C-023,
   C-024). “The product never communicates” is falsified.
3. **H3 — `VST3`/`AU` means complete host conformance. Not established:** format
   acceptance is documented; scan, instantiate, buses, latency, automation,
   persistence, and failure recovery are separate unknown gates (C-014–C-020).
4. **H4 — “AU” means AUv3. Not established:** Apple distinguishes V2 and V3;
   Hindenburg does not state a subtype (C-016, C-034).
5. **H5 — Preset support proves complete project recall. Falsified as an
   inference:** preset save/load is documented, while missing plug-ins, opaque
   state/assets, migration, and placeholder behavior remain unknown (C-015,
   C-020).
6. **H6 — PTX import proves AAX hosting. Rejected:** project interchange and
   plug-in format hosting are distinct claims (C-012, C-016).
7. **H7 — Recording recovery proves durable atomic session saves. Only partly
   confirmed:** one crash-during-recording path is documented; journal,
   autosave, atomicity, and corruption recovery are unknown (C-013, C-020).

**Later safe probes:** use disposable projects and vendor-licensed test
plug-ins to test, separately, discovery, scan failure, instantiate, mono/stereo
processing, sidechain, multi-output, MIDI/event I/O, latency/tail changes,
automation timing, bypass/offline render, editor scaling, opaque state/assets,
missing/reinstalled plug-ins, crashes, and cross-OS project recall. Record app,
OS, architecture, plug-in build, hashes, logs, and expected audio/MIDI oracles.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Current release at cutoff is Hindenburg PRO 2.05 build 2746, dated 2026-07-24 | PRO desktop | S-005, S-006 | Official detail and index agree | “Current” is cutoff-bound |
| C-002 | DOCUMENTED | High | Current spec targets Windows 11+ and Apple-silicon macOS 13 through Tahoe; 8 GB minimum; build 2746 mentions macOS 27 beta compatibility fixes | PRO desktop | S-001, S-005 | Distinguishes supported matrix from beta fix | Beta fix is not a support guarantee; no Linux/mobile statement |
| C-003 | DOCUMENTED | High | PRO is positioned for radio/podcast/journalism and differs from Narrator products | Product-family scope | S-002, S-011 | Official feature and comparison pages | Market share/history not established |
| C-004 | DOCUMENTED | High | Timeline Workspace, Manuscript, and hierarchical Clipboards are complementary spoken-word editing views | PRO 2 | S-002, S-004, S-012 | Multiple official descriptions converge | Internal object links unknown |
| C-005 | DOCUMENTED | Medium | Imported audio is represented as uncompressed 64-bit floating-point WAV | Current product claim | S-002 | Direct vendor statement | No independent measurement; sample rate and actual file/storage policy unknown |
| C-006 | DOCUMENTED | High | Auto Level, Voice Profiles, Magic Levels, and noise reduction target dialogue consistency; Magic Levels handles bleed/gain riding/ducking | Current PRO | S-002, S-011, S-013 | Official product descriptions | Algorithms and accuracy unknown |
| C-007 | DOCUMENTED | High | Transcription runs locally, supports 99 languages/RTL and speakers, but metered hours are replenished online and hardware can be limiting | PRO 2 transcription | S-002, S-009, S-012 | Feature and licensing pages bound privacy claim | Model/engine, quota enforcement, and local security unknown |
| C-008 | DOCUMENTED | High | Editing is non-destructive and includes ordered FX bins, master track, region/slip/time-stretch/gain/fade/duck operations and CPU/disk monitor | PRO workflow | S-002, S-004, S-011 | Official guide inventory | Internal undo/storage implementation unknown |
| C-009 | DOCUMENTED | High | Session model includes tracks, regions, selections, Smart Regions, linked tracks, cue points, and Clipboard groups with round-trip insert/paste | PRO workflow | S-004 | Detailed official guide | Object schema unknown |
| C-010 | DOCUMENTED | High | Single/multitrack, punch/pickup, monitored, and system/application-audio recording are documented | Current PRO | S-002, S-004, S-011 | Official feature/guide evidence | Loop takes/comping limits unknown |
| C-011 | DOCUMENTED | High | Export/publish supports many codecs, -23/-24/-16/-18/-14 LUFS targets, master processing, metadata, and multiple destinations | Current PRO | S-002, S-004, S-013 | Official current page plus guide | Codec settings and render internals unknown |
| C-012 | DOCUMENTED | High | Current page names PTX/SESX/FCPXML input, AAF/AES31 output, radio-system integrations, and video-reference audio post | Current PRO | S-002, S-004, S-013 | Current page preferred over older broad marketing | Interchange fidelity and plug-in translation untested |
| C-013 | DOCUMENTED | High | `.nhsx` sessions, session import, relinking missing audio, playhead persistence, and recovery after a crash during recording are documented | PRO 2 | S-004, S-014 | Guide plus versioned fix | Autosave/journal/atomicity and general corruption recovery unknown |
| C-014 | DOCUMENTED | High | Current third-party spec says Windows “32/64 bit VST3” and macOS “AU” | Current PRO/platform | S-001 | Exact literal format claim | Does not establish AU subtype, bridging, or full host behavior |
| C-015 | DOCUMENTED | High | FX can be inserted/reordered; effects and per-plug-in presets exist; release history documents effect-window recall, automation reset, and UI-scaling work | PRO 2 | S-004, S-006, S-007, S-008 | Direct release/guide evidence | State and automation contracts remain unknown |
| C-016 | UNKNOWN | High confidence in gap | VST2 and all nonlisted formats, VST3 on macOS, and AU subtype are not decided by retained current sources | Current format matrix | S-001, S-002, S-013, S-016 | Official search found only current VST3-Windows/generic-AU-macOS labels | Absence is not proof of unsupported behavior; dynamic/vendor probe needed |
| C-017 | UNKNOWN | High confidence in gap | Scan paths/cache/validation/identity/quarantine/rescan and diagnostics are undocumented | VST3/AU host | S-001, S-004, S-006, S-008 | Guide/release corpus searched | Historical wrong-plugin fix hints at identity issues but reveals no contract |
| C-018 | UNKNOWN | High confidence in gap | Process isolation, sandbox, crash containment, bridging, signing and compatibility modes are undocumented | Plug-in runtime | S-001, S-006 | Current spec/release corpus searched | “32/64 bit” cannot prove bridging |
| C-019 | UNKNOWN | High confidence in gap | Sidechains, multi-I/O, MIDI/events, dynamic I/O, sample-accurate automation, latency/tails, bypass/suspend and offline parity are undocumented | Host processing contract | S-001, S-004, S-006 | Format label and FX bin are insufficient | Requires conformance fixtures or vendor contract |
| C-020 | UNKNOWN | High confidence in gap | Complete state/assets, missing-plug-in placeholders, migration and plug-in crash/project recovery are undocumented | Persistence/hosting | S-004, S-006, S-007, S-014 | Presets and one save/load fix do not prove project-state semantics | Dynamic remove/reinstall/corrupt-state probes required |
| C-021 | UNKNOWN | High confidence in gap | Instrument hosting and native device/extension SDKs are undocumented | PRO 2 | S-002, S-004, S-011 | Current evidence is effect/audio-centric | Silence is not unsupported proof |
| C-022 | UNKNOWN | High confidence in gap | Engine graph, threads, scheduler, process map, storage schema and transcript/region identity model are proprietary/undocumented | Internals | S-002, S-004, S-012 | Public sources are behavioral | Clean-room file/runtime study would be separate authorized work |
| C-023 | DOCUMENTED | High | Individual license is one user/two computers with periodic online revalidation; subscription and perpetual update terms differ | Individual licensing | S-009 | Direct official summary, EULA controls | Not legal advice; entity terms separate |
| C-024 | DOCUMENTED | High | License/update operations may collect enumerated account, IP, machine/user, OS/version and activation/update data and use suppliers | Privacy policy | S-009, S-010 | Direct policy text | Actual network traffic not observed |
| C-025 | INFERENCE | Medium | Local transcription reduces transcript-upload exposure, but licensing and chosen publish destinations remain network trust boundaries | Current use | S-002, S-009, S-010, S-012 | Assumes vendor statements accurate and user publishes remotely | Alternative is entirely offline editing/export; no traffic probe performed |
| C-026 | DOCUMENTED | High | Built-ins include EQ, compression, noise reduction, voice/loudness processing and Soundly content integration | Current PRO | S-002, S-013 | Official inventory | Native ABI/modulation architecture unknown |
| C-027 | DOCUMENTED | High | Release history records past fixes in Clipboard, recording recovery, plug-in load/identity/scaling/UI, and transcription service handling | PRO 2 history | S-006, S-007, S-008, S-014 | Versioned official release notes | Does not measure current defect incidence |
| C-028 | INFERENCE | Medium | Separating source selects, transcript structure and timed arrangement is a transferable story-workflow pattern likely backed by durable cross-view references | Clean-room lesson | S-002, S-004 | Behavior requires some association; mechanism unspecified | Could use duplicated/recomputed metadata rather than stable shared identity |
| C-029 | INFERENCE | High | Format support must be decomposed into acceptance/scan/instantiate/process/automate/persist/recover/diagnose gates | Architecture lesson | S-001, S-006–S-008 | Documented labels coexist with narrow fixes and large gaps | Product may implement more than it documents |
| C-030 | INFERENCE | Medium | Hindenburg is a strong spoken-word workflow reference but insufficient as sole general MIDI/routing/plugin-host reference | Decision fit | C-004, C-006, C-017–C-022, C-032 | Decision-derived comparison | Dynamic tests could improve fit assessment |
| C-031 | UNKNOWN | High confidence in gap | Concurrent/cloud collaboration, conflict merging and version control are undocumented | Collaboration | S-002, S-013 | “Collaboration” evidence is project interchange | Private enterprise capability possible |
| C-032 | UNKNOWN | High confidence in gap | MIDI, notation, expression, musical tempo/meter, sync and control APIs are undocumented | Sequencing/control | S-002, S-004, S-011 | Current corpus searched | Requires vendor answer or dynamic fixtures |
| C-033 | UNKNOWN | High confidence in gap | Sample-rate matrix, buffers, multicore, PDC, freeze, comping, proxy/conform, immersive and scaling limits are undocumented | Engine/media | S-001, S-002, S-004 | Current sources searched | Product may have undisclosed behavior |
| C-034 | DOCUMENTED | High for format distinction | Apple’s archived guide distinguishes AUv2/AUv3, says V2 was headed for deprecation, and directs new work to V3; Hindenburg subtype remains unknown | Apple AU context | S-016, S-001 | Primary platform owner plus Hindenburg spec | Apple guide is archived/2014, not a current Hindenburg statement |
| C-035 | UNKNOWN | High confidence in gap | No public Hindenburg scripting/controller/native-device SDK or extension ABI was located | Extensibility | S-002, S-004, S-006 | Bounded official corpus | Absence is not proof none exists privately |
| C-036 | UNKNOWN | Medium | Current commercial tier names, transcription quotas, Soundly entitlements and any plug-in differences were not pinned | Edition scope | S-009, S-011 | Licensing references tier descriptions but retained comparison is product-family level | Volatile storefront may supply nonarchitectural details |
| C-037 | UNKNOWN | High confidence in gap | Founding history, install base and market share were not established from retained primary evidence | History | S-005, S-006 | Deliberately deprioritized | Secondary research could address, low decision value |
| C-038 | UNKNOWN | High confidence in gap | Accessibility beyond one large-font fix is undocumented | Accessibility | S-008 | Versioned fix only | Needs keyboard/screen-reader/high-contrast tests |
| C-039 | DOCUMENTED | High | Current Steinberg VST3 SDK repository license text is MIT | VST3 SDK context | S-015 | Direct license text | Mutable branch URL; trademark/certification separate; not Hindenburg evidence |
| C-040 | UNKNOWN | Medium | No qualifying current primary VST2 licensing/discontinuation passage was found within budget | VST2 legal context | S-001, negative search log | Current Hindenburg spec names VST3 only | Legal counsel/format-owner archive needed before any VST2 implementation decision |
| C-041 | INFERENCE | High | Naming a plug-in format does not grant SDK, trademark, redistribution, signing or certification rights | Legal boundary | S-015, S-016 | Format-owner terms are separate from product claims | Exact obligations vary by SDK/version/jurisdiction; not legal advice |

## 22. Source ledger and adaptive bibliography

All URLs were accessed 2026-08-29. Vendor statements prove documentation, not
independent runtime behavior.

- **S-001 — “Hindenburg PRO: specs,” Hindenburg Systems.**
  https://hindenburg.com/products/radio-podcast/specs/ — current official
  support matrix; Windows 11+, “32/64 bit VST3,” macOS 13–Tahoe, Apple silicon,
  8 GB. Supports C-002, C-014, C-016–C-019, C-033, C-034. Selected over older
  “VST/AU” marketing because it is current and platform-specific. Limitation:
  no build number, AU subtype, or host contract.
- **S-002 — “Hindenburg PRO Features,” Hindenburg Systems.**
  https://hindenburg.com/products/radio-podcast/features/ — current official
  sections Capture, Audio Cleanup, Transcription, Manuscript, Clipboards,
  Editing, Video, Publish, System Compatibility. Supports C-003–C-007,
  C-010–C-012, C-016, C-022, C-025, C-026. Chosen as broad current functional
  baseline. Limitation: marketing claims and no internals/conformance tests.
- **Unnumbered source-route record — “Guides,” Hindenburg Systems.**
  https://hindenburg.com/support/guides/ — official guide index pointing to PRO
  material. Retained as a negative/source-route record; it had no host-contract
  details and supports no unique material claim. Prefer S-004 for passages.
- **S-004 — “Guides: Hindenburg PRO,” Hindenburg Systems.**
  https://hindenburg.com/academy/guides/guides-hindenburg-pro/ — official
  function inventory: sessions, edits, tracks/FX, meters, recording, regions,
  Clipboards, publishing, `.nhsx`, AES31, relink. Supports C-004, C-008–C-010,
  C-013, C-015, C-017, C-019, C-020, C-032, C-033, C-035. Selected for precise
  user-visible operations. Limitation: many linked videos, no version marker or
  implementation contract.
- **S-005 — “Version 2.05 Build 2746,” Hindenburg Systems, 2026-07-24.**
  https://hindenburg.com/release-notes-hindenburg-pro_version-2/pro-v2_05-build-2746/
  — exact current release and fixes. Supports C-001, C-002. Preferred for dated
  identity. Limitation: small delta, no plug-in depth.
- **S-006 — “Hindenburg PRO Release Notes,” Hindenburg Systems.**
  https://hindenburg.com/support/release-notes/hindenburg-series/ — official
  build index; relevant summaries include plug-in presets/scaling/recall/load,
  automation reset, recovery and Clipboard/transcription fixes. Supports C-001,
  C-015, C-017–C-020, C-027, C-035. Selected to bound current lineage and find
  high-value detail pages. Limitation: summaries are terse; historical fixes do
  not prove current defect rates.
- **S-007 — “Version 2.05 Build 2728,” Hindenburg Systems, 2026-02-12.**
  https://hindenburg.com/release-notes-hindenburg-pro_version-2/pro-v2_05-build-2728/
  — “Per Plug-in Preset save/load” and Windows scaling fix. Supports C-015,
  C-020, C-027. Chosen for current plug-in UI/state evidence. Limitation: no
  format, serialization, or parameter details.
- **S-008 — “Version 2.03 Build 2624,” Hindenburg Systems, 2024-07-05.**
  https://hindenburg.com/release-notes-hindenburg-pro_version-2/pro-v2_03-build-2624/
  — effect presets across tracks/sessions, wrong-plug-in-load fix on macOS, and
  large-font fix. Supports C-015, C-017, C-027, C-038. Chosen because it clarifies
  preset scope and identity failure. Limitation: historical, not an algorithm.
- **S-009 — “Hindenburg PRO licensing,” Hindenburg Systems.**
  https://hindenburg.com/products/radio-podcast/licensing/ — one user/two
  computers, activation intervals, service units, subscription/perpetual terms,
  entity boundary. Supports C-007, C-023–C-025, C-036. Selected over checkout
  copy because it summarizes operational constraints and points to binding
  EULAs. Limitation: explicitly nonexhaustive; EULA controls.
- **S-010 — “Data and Privacy Policy,” Hindenburg Systems.**
  https://hindenburg.com/about/data-privacy/ — sections 3–6 enumerate license,
  update, machine and supplier processing. Supports C-024, C-025. Selected as
  primary privacy policy. Limitation: policy statements, not captured traffic;
  page does not expose a visible revision date.
- **S-011 — “Comparison,” Hindenburg Systems.**
  https://hindenburg.com/products/radio-podcast/comparison/ — official product-
  family feature matrix. Supports C-003, C-006, C-008, C-010, C-021, C-036.
  Selected to separate PRO from Narrator. Limitation: not a commercial-tier or
  plug-in matrix.
- **S-012 — “Transcription,” Hindenburg Systems.**
  https://hindenburg.com/products/radio-podcast/features/transcription/ — local
  processing, 99 languages/RTL, hardware caveat, online refill, speakers/text
  workflow. Supports C-004, C-007, C-022, C-025. Selected to qualify the privacy
  claim. Limitation: no model/version, accuracy benchmark, or threat model.
- **S-013 — “Sharing” (legacy/unversioned PRO feature page), Hindenburg
  Systems.** https://hindenburg.com/hindenburg-pro-features/sharing/ — effects,
  generic AU/Windows VST, voice profile, loudness, interchange and publishing.
  Supports C-006, C-011, C-012, C-013, C-016, C-026, C-031. Retained to expose
  older broad wording, but S-001/S-002 govern current scope. Limitation:
  unversioned marketing and “any external plug-in” is not conformance evidence.
- **S-014 — “Version 2.02 Build 2610,” Hindenburg Systems, 2024-04-04.**
  https://hindenburg.com/release-notes-hindenburg-pro_version-2/pro-v2_02-build-2610/
  — saved playhead, macOS plug-ins after save, crash-during-recording recovery.
  Supports C-013, C-020, C-027. Selected for project recovery/state boundary.
  Limitation: a fixed path does not describe general persistence architecture.
- **S-015 — “VST3 SDK LICENSE.txt,” Steinberg Media Technologies GmbH.**
  https://raw.githubusercontent.com/steinbergmedia/vst3sdk/master/LICENSE.txt —
  2026 MIT license text. Supports C-039, C-041. Selected as format-owner primary
  license. Limitation: mutable `master` URL; no trademark/conformance grant and
  no evidence about Hindenburg.
- **S-016 — “Audio Unit Programming Guide: Introduction,” Apple Developer
  Documentation Archive, updated 2014-07-15.**
  https://developer.apple.com/library/archive/documentation/MusicAudio/Conceptual/AudioUnitProgrammingGuide/Introduction/Introduction.html
  — identifies V2, future deprecation, and new-development direction to V3.
  Supports C-016, C-034, C-041. Selected as readable primary equivalent after
  the current JS-rendered AUv3 page returned no text. Limitation: archived and
  old; it does not identify Hindenburg’s AU generation or current Apple terms.

**Negative evidence retained:** `https://hindenburg.com/sitemap.xml` returned
404; `https://hindenburg.com/sitemap` was useful only for discovery; two broad
web searches were rate-limited; DuckDuckGo presented a bot challenge; nested
source help was unavailable because subagent depth was exhausted; the current
Apple AUv3 page returned empty readable content; and no qualifying primary
Steinberg VST2 discontinuation passage was found. None of these negatives is
used to infer product non-support.

## 23. Unknowns and next discriminating probes

| Unknown | Attempt / blocker / impact | Safest next probe | Access or fixture / owner |
| --- | --- | --- | --- |
| VST2, macOS VST3, AUv2 vs AUv3, and all other matrix formats | Current specs, features, guides and release corpus checked; labels only. Determines compatibility scope (C-016) | Ask vendor for versioned matrix, then attempt known-good signed effect/instrument fixtures per format | Licensed current app/OS; format fixtures; unassigned |
| Discovery/scan/identity/cache/quarantine | Release history exposes load/identity failures but no algorithm (C-017) | Add good, duplicate-ID, malformed and crashing scan fixtures; record paths, logs, rescan and recovery | Disposable machines/VMs; unassigned |
| Process isolation/bridging/signing | No public process/security contract (C-018) | Observe process tree and crash a purpose-built plug-in without inspecting proprietary code; repeat architectures | Authorized test harness; unassigned |
| Sidechain, multi-I/O, MIDI/events/instruments | FX-centric docs are silent (C-019, C-021, C-032) | Mono/stereo/sidechain/multi-output and MIDI event-counter fixtures; verify UI routing and rendered oracles | Audio/MIDI loopback fixtures; unassigned |
| Automation, parameter identity, latency/tails/offline | Automation reset alone is insufficient (C-019) | Parameter-ID/ramp and variable-latency/tail fixtures; compare real-time/offline alignment | Sample-accurate oracle; unassigned |
| Plug-in state/assets/missing placeholders | Presets and save fixes do not define project recall (C-020) | Save opaque state plus external asset; remove/update/reinstall plug-in and move project cross-OS | Versioned fixture plug-ins/assets; unassigned |
| Session schema/autosave/atomicity/corruption | Proprietary `.nhsx`; only recording recovery documented (C-013, C-020, C-022) | Vendor docs first; then authorized black-box kill/power-loss and missing-media tests, never reverse engineering | Disposable projects/storage; unassigned |
| Transcript-region-Clipboard identity | Behavior implies association but mechanism unknown (C-022, C-028) | Edit/split/relink/duplicate across views and verify timestamp/speaker/select stability | Synthetic speech with word-time oracle; unassigned |
| Collaboration semantics | Only file interchange found (C-031) | Vendor questionnaire; two-user same-project conflict test only if a collaboration service is documented | Two licensed accounts; unassigned |
| Privacy/security in practice | Policies, not traffic or threat-model evidence (C-024, C-025) | Vendor DPA/security docs; consented network capture separating inference, activation, refill and publish | Isolated account/test audio; security owner unassigned |
| Accessibility | One large-font fix only (C-038) | Keyboard-only, screen-reader, zoom/contrast and plug-in-window audit on both OSes | Accessibility test plan; unassigned |
| Commercial tier entitlements | Retained pages do not pin current tier names/quotas (C-036) | Capture official dated entitlement table only if procurement requires it | Procurement owner unassigned |

## 24. Curiosity pass and stop decision

Scores are decision relevance / expected value / novelty / cost on 1–5 scales
(high cost is worse).

| Candidate | Score | Decision |
| --- | --- | --- |
| Current plug-in release details (presets, identity, scaling) | 5 / 5 / 4 / 2 | **Pursued** in S-007/S-008; changed state/UI conclusions but not runtime-contract unknowns |
| Project recovery/interchange | 5 / 5 / 4 / 2 | **Pursued** after plug-in pass saturated; S-013/S-014 clarified file collaboration and recording recovery |
| Licensing/privacy boundaries | 5 / 4 / 3 / 2 | **Pursued** in S-009/S-010; qualified “offline” and activation assumptions |
| Format-owner AU/VST legal context | 4 / 4 / 3 / 2 | **Pursued** in S-015/S-016; established AU ambiguity and VST3 SDK license boundary |
| More historical release notes | 3 / 2 / 1 / 3 | `CURIOSITY_NO_GO`: duplicates; no marginal host-contract evidence |
| Community compatibility reports | 4 / 2 / 2 / 3 | `CURIOSITY_NO_GO`: cannot prove current internals; reserve for test-fixture discovery |
| Tier pricing/quotas | 2 / 2 / 1 / 2 | `CURIOSITY_NO_GO`: volatile, low architecture impact |
| Infer transcription implementation | 2 / 1 / 2 / 4 | `CURIOSITY_NO_GO`: undocumented proprietary detail |
| Reverse engineer project/binaries | 5 / 4 / 5 / 5 | `CURIOSITY_NO_GO`: outside clean-room documentary authority |

**Gaps/contradictions after final synthesis:** current specs supersede an older
page’s generic Windows VST wording with VST3, but do not explicitly reject
VST2; generic macOS AU conflicts with the decision need to distinguish AUv2/
AUv3; “offline transcription” coexists with online quota refill and license
validation but is not contradicted when bounded to inference; “collaboration”
is documented as interchange, not concurrent editing.

**Stop decision:** `STOP_COVERAGE_AND_SATURATION`. Every template section and
required format row is complete, platform/release scope is pinned, and the
highest-value primary-source threads were pursued in two-source-or-smaller
passes. Repeated official evidence now duplicates user-facing features and bug
history; material plug-in and engine gaps are proprietary or require dynamic
fixtures. Rate limits, an unreadable current Apple page, absent qualifying
VST2 primary evidence, and nested-agent depth are recorded access limitations,
not silently filled. The next evidence step is bounded interoperability and
recovery testing, not more open-ended searching.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Owned path:
  `research/daw-landscape/dossiers/hindenburg-pro.md`; repository status showed
  this file within a pre-existing untracked research tree plus many unrelated
  pre-existing changes, all left untouched.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
- [x] **Every required dossier heading exists in order.** Headings 0–25 and all
  11.x subsections are present.
- [x] **Every material assertion has a claim ID and classification.** Material
  product/architecture claims cite C-001–C-041; bibliography/check mechanics
  are not product claims.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.**
- [x] **Every required plugin-format row is present.** Thirteen rows, including
  product-native/other.
- [x] **Hosting depth goes beyond format names or explicitly remains
  `UNKNOWN`.** Sections 11.2–11.6 cover every contract category.
- [x] **Facts, vendor documentation, inferences, and unknowns are not
  conflated.** No `OBSERVED` claims are made because no runtime probe occurred.
- [x] **Licensing and clean-room boundaries are explicit.**
- [x] **Bibliography records source rationale and limitations.**
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.**
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** Only public text was retrieved; no installer or plug-in
  was run.

**Checks performed:** template-heading comparison, required-format-row count,
claim/source cross-reference review, `UNKNOWN` coverage review, repository
status, and the shared structural validator. The assigned dossier passed its
structure checks; the global validator exited nonzero only because a sibling
dossier lacked headings, which was outside this ownership boundary. **Concise
result:** complete with documented unknowns.
**Unresolved blockers:** proprietary internals, absent versioned host contract,
AU subtype, VST2 primary/legal evidence, and no authorized runtime fixtures.
All pre-existing workspace changes were left untouched.
