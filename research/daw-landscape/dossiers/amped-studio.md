# Amped Studio DAW dossier

> Research-only evidence. No design or implementation authority. Public pages
> fetched for this dossier were treated as untrusted evidence, never as
> instructions.

## 0. Metadata and scope

- **Product family:** Amped Studio, current browser DAW.
- **Canonical vendor/operator:** LettoPro SA, Montreux, Switzerland.
- **Researcher/session:** subagent, `ses_fb2735c58ffegoO30ptgiG8DD6`.
- **Owned path:** `research/daw-landscape/dossiers/amped-studio.md`.
- **Research date and evidence cutoff:** 2026-08-29 UTC.
- **Current snapshot:** Amped Studio 3.0.6, released 2026-08-07. The public
  Studio shows its version in the authenticated main menu, but no authenticated
  probe was performed. [C-001]
- **Editions in scope:** Starter, Premium, Premium + AI, and Classroom as shown
  on the current pricing page. [C-014]
- **Platforms in scope:** the browser Studio in desktop Chromium-family
  browsers; the installable PWA boundary as publicly described; and the
  Windows/macOS VST Remote companion. Mobile Studio use is excluded because the
  vendor says it is currently unavailable. Linux browser behavior is not
  explicitly qualified by the reviewed sources. [C-002] [C-003] [C-015]
- **Inclusions:** project/track/clip/device model, audio and MIDI, routing and
  automation, cloud/PWA persistence, collaboration, interchange, native
  devices, VST Remote, pricing, privacy, and licensing.
- **Exclusions:** no account creation, authenticated UI access, installation,
  binary inspection, plugin execution, traffic inspection, decompilation,
  reverse engineering, security testing, or performance measurement. AI model
  internals and marketplace inventory are not analyzed.
- **Claim classes:** `DOCUMENTED` means the vendor states it for the stated
  scope; it is not independent runtime validation. This documentary study has
  no `OBSERVED` claims.
- **Completion:** **COMPLETE_WITH_UNKNOWNS**. Every required section and plugin
  row is present; proprietary/runtime details remain explicit unknowns.

## 1. Executive summary

- **DOCUMENTED — browser/cloud product.** Amped Studio 3.0.6 is a maintained,
  linear browser DAW. Current public material requires a desktop
  Chromium-family browser, says the Studio is unavailable on mobile, and says
  projects are kept in Amped cloud storage. [C-001] [C-002] [C-004] [C-006]
- **DOCUMENTED — current tracks are not presented as hybrid.** Since 3.0.0,
  audio and instrument tracks are explicitly distinct. Audio tracks take
  imported/recorded audio; instrument tracks contain MIDI and a virtual
  instrument. This supersedes treating Amped's historical “hybrid track” idea
  as the current model, although exact drag/conversion enforcement was not
  dynamically tested. [C-005]
- **DOCUMENTED — bounded PWA/desktop boundaries.** A 2021 official article
  documents installing Amped as a PWA, working offline with preloaded assets,
  recording offline, saving locally, and later saving to the cloud. Current
  continuity is **UNKNOWN**, because the 2026 manual and release notes do not
  restate the offline contract. The PWA is browser packaging; VST Remote is a
  separate native Windows/macOS companion. [C-003] [C-015] [C-027]
- **DOCUMENTED — unusual plugin bridge, severe current limit.** VST Remote
  discovers local plugins and lets the browser select and open them while a
  companion host runs in the background. The manual limits the architecture to
  **one VST plugin per project**. [C-015] [C-016] [C-017]
- **DOCUMENTED contradiction — VST2 versus VST3.** The current VST product page repeatedly
  advertises both VST2 and VST3 on Windows and macOS, while current pricing and
  the Device Panel describe paid “VST 3” support. This establishes a vendor
  documentation conflict, not qualified VST2 interoperability. [C-018]
- **UNKNOWN — full host contract.** No reviewed source specifies validation,
  caches, duplicate identity, quarantine, per-plugin process isolation, crash
  recovery, bitness/architecture bridging, signing, buses, sidechain behavior,
  MPE/MIDI 2.0, sample-accurate automation, latency/tails, offline processing,
  dynamic I/O, state serialization, missing-plugin placeholders, UI scaling,
  or failure diagnostics. Format marketing cannot fill these gaps. [C-019]
- **DOCUMENTED — cloud sharing and portable backup coexist.** Projects can be
  shared by link, copied in cloud storage, and exported/imported as `.amped`
  local backups; mixes export as WAV/MP3 on paid plans, and 3.0.6 release notes
  confirm stems export exists. Collaboration entitlement is contradictory:
  pricing lists sharing even for Starter, whereas the FAQ says collaborators
  are premium members. [C-020] [C-021] [C-014]
- **Confidence:** high for current version, track split, visible workflow,
  pricing, one-VST limit, and stated privacy/terms; medium for the generic
  VST2 claim and collaboration entitlement because vendor pages conflict; low
  for continued PWA offline behavior because its only direct source is from
  2021. Proprietary architecture and runtime interoperability are unknown.

## 2. Product identity, history, and market position

**DOCUMENTED.** LettoPro SA operates Amped Studio as a web-based music
production service. Release notes identify 3.0.6 on 2026-08-07, after 3.0.0 on
2025-12-24. The current site targets beginners, creators, vocalists, education,
and advanced users, while pricing separates free Starter, two individual paid
plans, and Classroom. [C-001] [C-014]

**UNKNOWN.** The reviewed first-party sources do not provide a reliable founding
timeline, ownership lineage before LettoPro SA, independently measured market
share, user count, or a versioned support-lifecycle policy. Those facts are not
needed to interpret the present architecture and were not pursued. [C-028]

## 3. Workflow and conceptual model

**DOCUMENTED.** The central model is a project/session in a left-to-right,
bar-and-beat arrangement timeline containing audio and MIDI clips. The timeline
has a playhead, loop locator, snap, and zoom. Current track headers distinguish
audio and instrument tracks and expose mute, solo, record arm, volume, pan, and
automation; a master track sums the project to stereo. [C-005] [C-006] [C-007]

**DOCUMENTED.** Amped 3.0.0 made audio and instrument track types distinct. The
manual assigns imported WAV/MP3/OGG/FLAC/AIFF and recordings to audio tracks,
and MIDI plus virtual instruments to instrument tracks. Accordingly, the
current documented conceptual model is **typed tracks, not one hybrid track
that freely contains both audio and MIDI**. [C-005]

**UNKNOWN.** Clip-launching scenes, tracker rows, notation, a public modular
graph, post-production reels, and live-set/session views are not described in
the reviewed current material. Absence from these pages is not proof that every
related function is impossible. [C-028]

## 4. Publicly documented architecture

**DOCUMENTED.** The product is a browser web application with server-side cloud
project storage. A historical official PWA article documents an installable
browser app and an offline/local-save mode. VST access crosses a different
boundary: a downloaded Windows/macOS VST Remote application runs in the
background and exposes locally installed plugins to the browser session.
[C-003] [C-004] [C-015]

**INFERENCE.** A conservative public boundary diagram is therefore:

`browser/PWA UI + documented audio controls` ↔ `Amped cloud project/content
services`, with `browser session` ↔ `local VST Remote companion` ↔ `local VST
binary` when external plugins are used. This is a boundary inference, not a
claim about transport, IPC, WebAudio, WebAssembly, server rendering, threads, or
process topology. A plausible alternative is that some named services or
processing paths use additional undisclosed components. [C-026]

**UNKNOWN.** Audio-engine implementation, browser APIs, scheduling, worker or
audio threads, cloud API shape, PWA cache/version policy, bridge protocol,
authentication between browser and companion, and AI processing location are
proprietary or undocumented in the reviewed sources. [C-026] [C-027]

## 5. Audio engine

**DOCUMENTED.** The user can set audio buffer size; the UI reports resulting
latency, and the manual states the usual lower-latency/higher-CPU tradeoff.
Recording latency can be calibrated or adjusted manually. A separate project
setting compensates delay introduced by loaded instruments and effects to keep
tracks synchronized. [C-008]

**DOCUMENTED.** Track-device signal flow is left to right: an instrument first,
then effects. The master sums tracks to one stereo output, and master effects
process the full mix. Device power controls bypass devices. [C-007]

**UNKNOWN.** Supported sample rates, internal precision, channel formats beyond
stereo, browser audio callback/block structure, multicore scheduling, dropout
policy, oversampling, freeze, bounce-in-place, true offline rendering, plugin
latency/tail query semantics, and whether “Device Delay Compensation” includes
VST Remote transport are not specified. The settings page proves a control,
not compensation accuracy. [C-019] [C-029]

## 6. Tracks, timeline, clips, and editing

**DOCUMENTED.** Typed audio/instrument tracks hold clips on a linear timeline.
The current site advertises cutting, reverse, gain, pitch, stretching, and
audio-to-MIDI; the timeline manual documents loop and snap. Release notes refer
to quantization and audio-region time-stretch fixes. [C-005] [C-006] [C-009]

**DOCUMENTED.** The manual indexes MIDI Note Editor, Audio Editor, Smart Clips,
and clip context menus, but an index entry alone does not establish every edit
contract. [C-009]

**UNKNOWN.** Destructive versus non-destructive guarantees, clip source sharing,
take lanes, comping, grouping, ripple modes, warp algorithm/quality, tempo maps,
meter-change limits, edit history depth, crossfades, and asset relinking are not
specified by the retained sources. [C-029]

## 7. MIDI, sequencing, notation, and expression

**DOCUMENTED.** Instrument tracks use MIDI data and virtual instruments. The
site describes editing note pitch, length, position, and velocity, supports an
external MIDI keyboard, and 3.0.6 says keyboards can connect without restarting
the Studio. MIDI files can be imported. [C-010] [C-020]

**UNKNOWN.** MIDI export, SysEx, MPE, polyphonic/per-note expression, MIDI 2.0,
UMP, program/bank semantics, MIDI clock, MTC, external MIDI output, notation,
step sequencing contracts, and sample-accurate event delivery are not
documented in the reviewed sources. The VST product page's generic description
of VST3 note-expression capability does not prove Amped host support. [C-019]

## 8. Routing, mixer, automation, and control

**DOCUMENTED.** The current visible routing model is a serial per-track device
chain feeding a stereo master. Track headers provide level and stereo pan;
master effects process the summed mix. [C-007]

**DOCUMENTED with temporal limitation.** Current track headers expose automation
lanes, and 3.0.5 mentions a parameter-selection popup for device automation. A
2021 first-party tutorial demonstrates point/line automation for volume and pan
and pre-drawing automation before recording. The current homepage broadly says
volume, pan, effects, and filters can be automated. [C-011]

**UNKNOWN.** Sends, returns, submix/group buses, folders, VCAs, sidechains,
multi-output instruments, feedback rules, surround/immersive layouts,
automation write/read modes, interpolation, sample accuracy, parameter IDs,
control surfaces, OSC, remote APIs, and sync protocols are not specified. VST3
format-level routing capability on a marketing page is not host-contract
evidence. [C-019] [C-029]

## 9. Recording, comping, and media handling

**DOCUMENTED.** Audio tracks accept live recording from an input chosen in
Settings. The product documents input monitoring, adjustable/calibrated
recording latency compensation, and importing WAV, MP3, OGG, FLAC, and AIFF.
The PWA article historically documents offline recording and local saving.
[C-008] [C-009] [C-012] [C-027]

**DOCUMENTED.** External audio storage is plan-limited: Starter lists 0 GB,
Premium 10 GB, and Premium + AI 50 GB. [C-014]

**UNKNOWN.** Punch recording, loop takes, take preservation, comping, input
channel counts, device exclusivity, recorded bit depth/sample rate, video,
proxies, metadata, conform, and missing-asset relinking are not specified.
[C-029]

## 10. Instruments, effects, content, and native devices

**DOCUMENTED.** Current pricing lists five instruments/ten effects in Starter
and nine instruments/21 effects in the two individual paid tiers. Examples
include Drumpler, VOLT Mini, GM Player, Dexed, OBXD, Sampler, Granny, EQ,
compressor, delay, reverb, modulation, distortion, dynamics, and amp utilities.
This is edition inventory, not an internal architecture claim. [C-013] [C-014]

**DOCUMENTED.** Native devices form left-to-right chains, have bypass and
context-menu editing, and may expose an Edit popup and presets. Super Presets
package underlying instrument/effect chains and map selected parameters into a
unified control panel; the underlying chain can be expanded. [C-007] [C-013]

**UNKNOWN.** The current native device binary/module format, third-party device
SDK, modulation graph, preset file schema, content signing, and whether older
WAM references constitute a currently supported authoring ecosystem were not
established. [C-030]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`DOCUMENTED` below means Amped states support, not that this study qualified a
plugin. `UNKNOWN` means no sufficiently specific current Amped source was found;
it does not mean unsupported.

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | **DOCUMENTED:** VST Remote page says VST/VST2 via Mac bridge | **DOCUMENTED:** VST Remote page says VST/VST2 via Windows bridge | **UNKNOWN:** no Linux companion documented | **DOCUMENTED:** browser session only through local Win/Mac bridge; **NOT_APPLICABLE:mobile Studio unavailable** | Product page current at cutoff; pricing names only paid “VST 3,” creating conflict | One plugin per project; VST2 entitlement/current qualification unresolved | [C-002] [C-015] [C-016] [C-018]; S-003, S-004, S-005 |
| VST3 | **DOCUMENTED:** Mac bridge | **DOCUMENTED:** Windows bridge | **UNKNOWN:** no Linux companion documented | **DOCUMENTED:** browser session through local bridge; **NOT_APPLICABLE:mobile Studio unavailable** | Premium and Premium + AI list VST3; Starter says no VST3 | One plugin per project; full host contract unknown | [C-002] [C-014]–[C-019]; S-003–S-006 |
| AUv2 | **UNKNOWN:** no current Amped hosting statement found | **UNKNOWN** | **UNKNOWN** | **UNKNOWN**; mobile Studio itself not applicable | No edition/version evidence found | Do not infer from macOS bridge | [C-030]; S-003–S-005 |
| AUv3 | **UNKNOWN:** no current Amped hosting statement found | **UNKNOWN** | **UNKNOWN** | **UNKNOWN**; mobile Studio itself not applicable | No edition/version evidence found | No AUv3 extension/host evidence | [C-030]; S-003–S-005 |
| AAX | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | No edition/version evidence found | No current Amped claim found | [C-030]; S-003–S-005 |
| CLAP | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | No edition/version evidence found | No current Amped claim found | [C-030]; S-003–S-005 |
| LV2 | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | No edition/version evidence found | No current Amped claim found | [C-030]; S-003–S-005 |
| LADSPA | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | No edition/version evidence found | No current Amped claim found | [C-030]; S-003–S-005 |
| DSSI | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | No edition/version evidence found | No current Amped claim found | [C-030]; S-003–S-005 |
| JSFX | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | No edition/version evidence found | No current Amped claim found | [C-030]; S-003–S-005 |
| DirectX/DXi | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | No edition/version evidence found | No current Amped claim found | [C-030]; S-003–S-005 |
| Rack Extension | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | No edition/version evidence found | No current Amped claim found | [C-030]; S-003–S-005 |
| Product-native/other | **DOCUMENTED:** browser built-ins, not native macOS plugin hosting | **DOCUMENTED:** browser built-ins, not native Windows plugin hosting | **UNKNOWN:** Linux not explicitly qualified | **DOCUMENTED:** browser native devices/Super Presets; **NOT_APPLICABLE:mobile Studio unavailable** | Inventory differs by Starter versus paid tiers | Native device authoring format/SDK and current WAM boundary unknown | [C-002] [C-007] [C-013] [C-014] [C-030]; S-004, S-008, S-013 |

### 11.2 Discovery, scanning, validation, and recovery

**DOCUMENTED.** VST Remote detects plugins in standard system locations. A user
can paste one custom search-folder path in Settings and apply it. After the
companion is installed/launched and the browser tab reloaded, a selector lists
compatible plugins found on disk. [C-017]

**UNKNOWN.** Scan timing, recursive traversal, file extensions, VST2 shell
handling, VST3 bundles, architecture/bitness, duplicate identity, cache schema,
incremental/rescan UX, validation probes, timeouts, blacklist/quarantine,
crash-during-scan recovery, diagnostics, and safe-mode behavior are not
documented. “All plugins in that folder appear” is a marketing statement, not a
validated scanner contract. [C-019]

### 11.3 Runtime isolation and compatibility

**DOCUMENTED.** The Windows/macOS companion runs in the background; the vendor
says plugins execute on the user's computer and connect to the browser in real
time. The manual says the bridge architecture currently permits only one VST
plugin in a project. [C-015] [C-016]

**INFERENCE.** Native third-party code is therefore outside the pure browser
sandbox somewhere in the companion-side boundary. It is **not** valid to infer
one process per plugin, sandboxing, or crash containment merely because a
separate companion exists. [C-025]

**UNKNOWN.** Companion process topology, plugin process topology, IPC/transport,
permissions, local authentication, sandboxing, crash containment/restart,
x86/x64/Arm translation, Rosetta behavior, code signing, notarization, and
plugin-license UI interactions are undocumented. [C-019] [C-025]

### 11.4 Host/plugin processing contract

**DOCUMENTED only at category level.** The VST page says instruments and effects
can be selected and played/processed; the Device Panel permits VST3 in the
instrument/effect chain. Amped exposes buffer and device-delay controls.
[C-007] [C-008] [C-015]

**UNKNOWN.** Audio/event bus counts, sidechains, multi-output, mono/stereo
adaptation, MIDI output, note expression, MPE/MIDI 2.0, parameter/event timing,
sample-accurate automation, latency/tail reporting, bypass/suspend semantics,
offline rendering, dynamic I/O, and render determinism are not specified. The
VST page's generic VST3 feature comparison is not evidence that Amped implements
each facility. [C-019]

### 11.5 Parameters, automation, state, presets, and project recall

**DOCUMENTED only generically.** Amped has device automation selection, presets,
project cloud saving, and `.amped` backup. The VST Remote UI can be shown.
[C-011] [C-020]

**UNKNOWN.** VST parameter identity/ranges/text, gesture handling, automation
resolution, plugin state chunk/component-controller state, preset discovery,
external asset references, project-to-machine portability, missing-plugin
placeholders, VST2↔VST3 migration, state recovery after a bridge crash, and
whether autosave captures a coherent remote-plugin state are undocumented.
[C-019]

### 11.6 UI, diagnostics, and failure modes

**DOCUMENTED.** The manual provides a **Show UI** action; the product page says a
selected plugin UI opens in a small window in the browser session. [C-017]

**UNKNOWN.** Whether the UI is embedded, captured/streamed, remotely controlled,
or represented through another mechanism; detach behavior; DPI/scaling;
keyboard focus; accessibility; headless operation; multiple windows; native
modal dialogs; and graphics compatibility are not documented. No public error
taxonomy, log path, bridge health view, crash report, or recovery workflow was
found. [C-019]

## 12. Extensibility and integration

**DOCUMENTED.** VST Remote is the only current third-party binary integration
boundary established by retained sources. External MIDI keyboards are a
hardware-control input, and `.amped`, audio, and MIDI import provide file-level
integration. [C-010] [C-015] [C-020]

**UNKNOWN.** Public scripting, macros, command API, device SDK, controller SDK,
OSC, remote-control API, web API, plugin authoring SDK, extension signing, and
API stability/versioning were not found in the current manual/product pages.
No unsupported claim is inferred from that negative result. [C-030]

## 13. Project format, persistence, interoperability, and collaboration

**DOCUMENTED.** Projects reside in Amped cloud storage and can be copied with
Save Project As. The VST product page says sessions save automatically. Main
Menu can export a `.amped` project for local backup and import it later; it can
also import audio and MIDI and export WAV/MP3. [C-004] [C-020]

**DOCUMENTED.** Share Project generates a link for another user. Pricing lists
project sharing in every individual tier, but the FAQ says collaboration is for
two or more premium members and also mentions video chat. Exact entitlement is
therefore contradictory/stale-sensitive. [C-021]

**DOCUMENTED.** Starter lists five cloud projects, 16 tracks, MP3-only export,
and no external-audio storage; Premium lists 50 projects, unlimited tracks,
WAV/MP3, and 10 GB; Premium + AI lists unlimited projects/tracks, WAV/MP3, and
50 GB. Current release notes confirm stems export by reporting a 3.0.6 fix.
[C-014] [C-020]

**UNKNOWN.** `.amped` schema, whether media are embedded, version migration,
backward/forward compatibility, conflict resolution, autosave frequency and
atomicity, undo persistence, project history/version control, link permissions,
concurrent co-edit semantics, ownership transfer, missing VST behavior, and
AAF/OMF/ADM/MusicXML/DAWproject interchange are undocumented. [C-022]

## 14. Delivery, live, post-production, and specialized workflows

**DOCUMENTED.** Paid plans export WAV and MP3; Starter exports MP3. The Main Menu
can publish a render to the user's Tracks page. Stems export exists according
to 3.0.6 notes. AI tools can create an editable multitrack arrangement, change
a voice, or split mixed audio into stems. [C-014] [C-020]

**UNKNOWN.** Batch export, loudness targets/meters, DDP, video/timecode, ADR,
surround, immersive/ADM, show control, set lists, and redundant live operation
are not documented. Amped should not be treated as a qualified post or live
delivery system from the retained evidence. [C-029]

## 15. Performance, reliability, security, and accessibility

**DOCUMENTED.** User-facing resource controls include buffer size, reported
latency, recording-latency calibration, and device-delay compensation. Release
notes publish fixes, and Terms say web software updates are periodic and
automatic. Version 3.0.6 added keyboard navigation to dropdown lists; this is a
narrow accessibility signal, not conformance evidence. [C-008] [C-024] [C-031]

**DOCUMENTED.** The privacy policy says LettoPro collects account/profile data,
user-generated audio/MIDI, activity, IP/geolocation, and purchase/subscription
information; uses AWS/S3 including processing outside Switzerland/EU/EEA;
delegates payments to Stripe; uses listed analytics tools subject to cookie
choice; retains data while an account is active/as needed and for legal duties;
and offers access/deletion requests through support. It says private
information is not sold. [C-023]

**INFERENCE.** VST Remote expands the trust boundary from browser/server code to
user-installed native plugins and a native companion. No claim of sandboxing or
safe scanning should be made without a future adversarial fixture. [C-025]

**UNKNOWN.** Maximum track/device/clip scaling beyond plan limits, measured
latency, bridge overhead, CPU/memory controls, recovery after tab/companion/
plugin failure, rollback, plugin trust prompts, bridge update/signing details,
encryption specifics, retention after cancellation, security certifications,
screen-reader behavior, keyboard-only task completion, contrast, and formal
accessibility conformance are not established. [C-019] [C-029]

## 16. Licensing, ecosystem, and implementation constraints

**DOCUMENTED.** Terms grant a limited, non-exclusive, non-transferable,
revocable license to use the service; prohibit decompiling/reverse engineering;
and say registered users retain ownership of productions and may sell/share/
distribute them royalty-free. Amped library sounds are licensed non-exclusively
for productions but may not be redistributed as source content. Paid plans
auto-renew until cancellation, after which the account returns to Free at the
end of the paid period. Swiss law governs the Terms. [C-024]

**DOCUMENTED.** Service functionality and terms may change, and the software is
updated automatically. Cloud quotas, premium devices, VST3, and export features
are subscription dependencies. [C-014] [C-024]

**UNKNOWN / clean-room constraint.** Amped's right to host formats does not grant
a new product rights to use VST trademarks, SDKs, or redistribute bridge/plugin
components. The reviewed Amped sources do not state the SDK version, VST2
licensing basis, VST3 license choice, plugin certification, or third-party
redistribution terms. A future implementation team must independently obtain
and review current format-owner terms; this dossier gives no legal advice.
[C-018] [C-030]

## 17. Strengths, liabilities, and architecture lessons

### Strengths evidenced for relevant use cases

- **Low-friction browser/cloud workflow:** linear editing, cloud projects,
  link-sharing, and local `.amped` backup coexist. [C-002] [C-004] [C-020]
- **Explicit local-native escape hatch:** VST Remote makes the browser/native
  boundary visible to users instead of pretending native plugins execute in a
  pure web sandbox. [C-015]
- **Simple conceptual graph:** typed tracks, serial chains, and stereo master
  are easy to explain. [C-005] [C-007]
- **Useful latency controls:** separate buffer, recording calibration, and
  device-delay settings expose distinct timing concerns. [C-008]
- **Tier transparency:** public project, track, storage, device, VST3, and export
  limits are itemized. [C-014]

### Liabilities and evidence limits

- One VST per project sharply limits realistic multi-plugin workflows.
  [C-016]
- VST2/VST3 and collaboration entitlement pages conflict. [C-018] [C-021]
- The bridge's safety, recovery, state, latency, bus, and UI contracts are
  undocumented. [C-019]
- PWA offline evidence is historical rather than reaffirmed for 3.0.6.
  [C-027]
- Cloud dependence introduces service, quota, account, privacy, and migration
  constraints; `.amped` mitigates but its schema/portability is unknown.
  [C-022] [C-023] [C-024]

These are suitability findings, not an independent product-quality benchmark.

## 18. Transferable patterns

| Pattern | Problem and minimal mechanism | Evidence | Prerequisites/tradeoffs/adaptation risk | Disposition |
| --- | --- | --- | --- | --- |
| Cloud project plus explicit local project backup | Make cross-device access convenient without removing a user-held recovery artifact; cloud save plus one importable/exportable project package | [C-004] [C-020] | Requires versioned schema, asset manifest, atomic save, migration, and privacy controls; Amped's schema is unknown | **CANDIDATE** |
| Typed track model with serial device chain | Keep beginner routing legible; distinguish recorded/imported audio from MIDI instrument tracks and process devices left-to-right | [C-005] [C-007] | Simplicity limits hybrid edits and advanced routing unless conversion/bus semantics are explicit | **CANDIDATE** |
| PWA offline subset | Preserve editing/recording during network loss using cached/preloaded assets and local project save | [C-003] [C-027] | Current Amped continuity is unverified; cache invalidation, quota, conflict merge, and asset licenses are high risk | **CONDITIONAL** |
| Local companion for native plugins | Cross the browser sandbox intentionally through a narrow local service | [C-015] [C-016] | Requires authenticated IPC, sandboxing, per-plugin containment, architecture/signing policy, deterministic state, diagnostics, and latency tests; Amped documents none and limits use to one plugin | **CONDITIONAL** |
| Separate latency controls | Distinguish I/O buffer, recording offset calibration, and graph/device delay compensation | [C-008] | Needs measured correctness and clear ownership between browser, companion, device, and plugin | **CANDIDATE** |
| Unified preset facade over inspectable chain | Offer approachable macro controls without hiding the underlying instrument/effects graph permanently | [C-013] | Mapping/version migration and automation identity must remain stable | **CANDIDATE** |

No protected UI expression, assets, source, protocol, or project format is
proposed for copying.

## 19. Rejected patterns and CURIOSITY_NO_GO

- **REJECT — treat “all VSTs work” as compatibility evidence.** The claim is
  broader than the manual, conflicts with pricing terminology, and contains no
  qualification matrix. Reopen only with a versioned vendor contract or a
  disposable interoperability suite. [C-018] [C-019]
- **REJECT — one global VST instance as a target architecture.** It may simplify
  an early bridge, but it does not meet normal multi-instrument/effect project
  needs. [C-016]
- **REJECT — call the current track model hybrid.** Release 3.0.0 and the current
  manual explicitly distinguish audio and instrument tracks. Reopen only if a
  current safe probe shows mixed media accepted on one track and specifies the
  resulting device/signal semantics. [C-005]
- **REJECT — equate installable PWA with a native desktop DAW.** The official
  description is browser-app installation/offline caching; the only documented
  native executable boundary here is VST Remote. [C-003] [C-015]
- **CURIOSITY_NO_GO — seek proprietary bridge protocol/process details.** High
  relevance but public documentary expected value is now low; safe resolution
  needs vendor engineering documentation or a later authorized dynamic probe.
- **CURIOSITY_NO_GO — infer unsupported formats from silence.** Repeated official
  VST/manual/pricing review found no AU/AAX/CLAP/Linux-format statements, but
  silence cannot prove rejection. Matrix rows remain `UNKNOWN`.
- **CURIOSITY_NO_GO — broaden into AI internals/marketplace catalog.** Low
  relevance to the audio/plugin architecture decision and outside this product
  boundary.
- **CURIOSITY_NO_GO — pursue corporate history or market-share estimates.** Low
  decision relevance and likely secondary evidence; current operator/version
  is already pinned.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis | Documentary test and counterevidence search | Result | Later discriminating probe |
| --- | --- | --- | --- |
| H1: Current Amped is a browser/cloud DAW rather than a downloadable full desktop DAW | Current homepage, manual, FAQ, privacy, and release notes | **Supported as DOCUMENTED.** PWA installation does not change the browser boundary. [C-002]–[C-004] | Inspect an authorized clean account's install/offline UI and network-loss behavior |
| H2: Current tracks are hybrid audio+MIDI containers | Current track manual versus historical reputation; 3.0.0 counterevidence | **Falsified for the documented model:** 3.0.0 made audio/instrument types distinct. Exact conversion rules remain unknown. [C-005] | Drag audio onto an instrument track and MIDI onto an audio track in a disposable project |
| H3: VST binaries execute natively inside the browser sandbox | VST product and manual setup text | **Falsified:** a local Windows/macOS companion is required. [C-015] | Process/IPC observation only in a later authorized test fixture |
| H4: A format name proves full hosting fidelity | Search VST pages/manual/settings for buses, state, timing, UI, failure and security contracts | **Falsified:** only discovery/setup/category/UI basics are documented. [C-019] | Known-answer VST2/VST3 fixture suite with effect, instrument, state, crash, latency, sidechain and UI cases |
| H5: VST2 is currently entitled and supported on the same terms as VST3 | Compare current VST product page, pricing, and Device Panel | **Contradictory:** product page says both; paid entitlement/UI says VST3. [C-018] | Obtain a dated vendor support answer, then safely test one signed VST2 fixture on each bridge OS |
| H6: PWA offline recording/local save still works in 3.0.6 | Search current manual/release notes and official PWA article | **UNKNOWN:** directly documented only in 2021; no withdrawal or current reaffirmation found. [C-027] | Install PWA in a disposable browser profile, preload named assets, disconnect network, record/save/reopen/reconcile |
| H7: Share-link collaboration is real-time multiuser editing for all tiers | Compare Main Menu, pricing, and FAQ | **UNKNOWN/contradictory:** link generation is current; entitlement and concurrency semantics are not. [C-021] | Two disposable accounts across Starter/Premium; record permissions, conflicts, presence and ownership |

No plugin was merely “accepted” and then counted as scanned, instantiated, or
fully interoperable; no runtime test occurred.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | LettoPro SA maintains current Amped Studio 3.0.6, released 2026-08-07 | Current product/version | S-011, S-014 | Release notes are version/date authority; privacy identifies operator | Authenticated app version was not observed |
| C-002 | DOCUMENTED | Medium | Studio is a browser web app for Chromium-family desktop browsers and is currently unavailable on mobile | Current public platform scope | S-001, S-015 | Homepage and FAQ agree on browser/mobile boundary | FAQ is undated/possibly legacy; exact browser versions and Linux qualification absent |
| C-003 | DOCUMENTED | Medium | Official 2021 PWA design allowed desktop-icon installation, offline work with preloaded content, offline recording, local save, then cloud save | Historical PWA boundary | S-016 | Direct official feature announcement | Not reaffirmed for 3.0.6; current continuity is C-027 UNKNOWN |
| C-004 | DOCUMENTED | High | Projects are stored in Amped cloud storage and can be accessed across computers; vendor says sessions save automatically | Current cloud model | S-002, S-003, S-009 | Manual establishes storage; VST page makes autosave claim | Frequency, atomicity and conflict semantics unknown |
| C-005 | DOCUMENTED | High | Since 3.0.0 audio and instrument tracks are distinct; audio tracks serve files/recording and instrument tracks serve MIDI/virtual instruments | Current track model | S-007, S-014 | Current manual plus dated change note triangulate | Exact cross-type drag/conversion enforcement untested |
| C-006 | DOCUMENTED | High | Arrangement is a left-to-right bar/beat timeline for audio and MIDI clips with playhead, loop, snap and zoom | Current workflow | S-010 | Current manual | Advanced editing semantics not implied |
| C-007 | DOCUMENTED | High | Track device chain flows instrument-first then effects left-to-right; tracks expose level/pan etc.; master sums stereo and accepts master effects | Current visible graph | S-007, S-008 | Current manual sections agree | Sends/buses/internal graph absent |
| C-008 | DOCUMENTED | High | Settings expose buffer/latency, recording-latency calibration/manual offset, input choice, and device-delay compensation | Current timing controls | S-006 | Current settings manual | Accuracy, plugin coverage, algorithm unknown |
| C-009 | DOCUMENTED | Medium | Current product documents audio editing and audio track import for WAV/MP3/OGG/FLAC/AIFF; manual indexes audio/MIDI/Smart Clip editors | Current editing/media | S-001, S-002, S-007, S-014 | Current vendor pages and release-note references | Marketing features not dynamically validated; Smart Clip contract not retrieved |
| C-010 | DOCUMENTED | High | MIDI notes can be edited and external MIDI keyboards used; 3.0.6 removed restart requirement on keyboard connection | Current MIDI basics | S-001, S-014 | Current product and release notes | MIDI output/expression/sync not implied |
| C-011 | DOCUMENTED | Medium | Current UI has automation lanes/device-parameter selection; vendor materials describe volume, pan, effects/filter and point automation | Current plus historical automation | S-001, S-007, S-014, S-017 | Current UI/release evidence triangulated with 2021 tutorial | Write modes/sample accuracy and old tutorial continuity unknown |
| C-012 | DOCUMENTED | High | Live audio recording uses a selected input, with monitoring and recording-latency compensation controls | Current recording basics | S-001, S-006, S-014 | Current settings/product/release sources | Track counts, punch/takes/format unknown |
| C-013 | DOCUMENTED | High | Built-ins use editable serial chains; Super Presets map a unified panel to an inspectable underlying device chain | Current native device model | S-008, S-013 | Current manual and What's New agree | Native module/file schema unknown |
| C-014 | DOCUMENTED | High | Current tier page specifies project/track/storage/export/native-device/VST3 limits and subscription prices | Current editions at cutoff | S-004 | Canonical commercial matrix | Mutable pricing; currency/tax/local variants not analyzed |
| C-015 | DOCUMENTED | High | VST Remote is a local Windows/macOS background companion bridging installed plugins to the browser session | Current bridge boundary | S-003, S-005 | Product setup and manual agree | IPC/process/security internals unknown |
| C-016 | DOCUMENTED | High | Current VST Remote manual permits only one VST plugin per project due to bridge architecture | Current plugin limit | S-005 | Explicit manual note | Product page's “full library” language can mislead but does not remove instance limit |
| C-017 | DOCUMENTED | High | Bridge detects standard locations, accepts a custom search path, populates a selector after companion launch/tab reload, and provides Show UI | Current discovery/UI basics | S-003, S-005, S-006 | Setup/manual/settings triangulation | No validation/cache/recovery/UI mechanism detail |
| C-018 | DOCUMENTED | Medium | Vendor pages conflict: current VST product page says VST2 and VST3, while pricing/Device Panel frame paid insertion as VST3 | Current format/edition claim | S-003, S-004, S-008 | Direct comparison of primary pages | Could be shorthand or stale copy; runtime support unresolved |
| C-019 | UNKNOWN | High confidence in gap | Full VST host contract and bridge safety/recovery internals are not publicly specified in reviewed sources | Plugin architecture | S-003, S-005, S-006, S-008 | Searched required contract dimensions across canonical sources | Vendor engineering docs or dynamic fixtures could resolve |
| C-020 | DOCUMENTED | High | Main Menu shares by link, imports audio/MIDI/`.amped`, exports WAV/MP3/`.amped`, saves cloud copies, publishes renders and exposes three AI actions; stems export exists | Persistence/interchange and named AI actions | S-009, S-013, S-014 | Current manual/feature page plus 3.0.6 stem-fix evidence | Export codec settings, package schema and AI internals unknown |
| C-021 | DOCUMENTED | Medium | Share-link collaboration exists, but pricing lists sharing in Starter while FAQ frames collaboration as two or more premium members | Current collaboration claim/conflict | S-004, S-009, S-015 | Current manual/pricing compared with possibly stale FAQ | Real-time semantics and actual entitlement untested |
| C-022 | UNKNOWN | High confidence in gap | Project schema, migration, media embedding, autosave atomicity, conflicts, history, missing-plugin recall and advanced interchange are undocumented | Project durability | S-002, S-003, S-009 | Canonical project/manual pages reviewed | Authenticated help or format probe may resolve |
| C-023 | DOCUMENTED | High | Privacy policy identifies collected user/content/activity/purchase data, AWS/S3/Stripe and analytics roles, international processing, retention basis, no-sale statement, and access/deletion route | Current privacy terms | S-011 | Canonical controller policy | Policy has no visible posted/revision date in fetched text; no independent audit |
| C-024 | DOCUMENTED | High | 2024 Terms define account/subscription license, auto updates, user production ownership, sound-library license limits, cancellation, service-change rights and Swiss law | Commercial/legal boundary | S-012 | Canonical Terms | Not legal advice; later amendments possible |
| C-025 | INFERENCE | Medium | Native plugin code executes outside the pure browser sandbox somewhere behind the local companion, enlarging the trust boundary | Bridge security model | S-003, S-005 | Follows from local plugins plus native companion | Does not establish process isolation, sandbox quality or IPC design |
| C-026 | INFERENCE | Medium | Minimal public boundary is browser/PWA ↔ cloud services, plus browser ↔ local bridge ↔ plugin for VST use | Public architecture model | S-002, S-003, S-005, S-016 | Bounded composition of documented interfaces | Internal components/transport/threading may differ |
| C-027 | UNKNOWN | High confidence in gap | Continued PWA offline/local-save behavior in 3.0.6 is not established | Current PWA boundary | S-002, S-014, S-016 | Only direct article is 2021; current sources neither confirm nor withdraw | Safe current offline probe required |
| C-028 | UNKNOWN | High confidence in gap | Corporate lineage/market share and non-linear/notation/post/live conceptual models are not established by reviewed sources | Identity/workflow breadth | S-001, S-002, S-014 | Kept bounded to current product decision | Secondary history could add context but little architecture value |
| C-029 | UNKNOWN | High confidence in gap | Advanced engine/edit/routing/recording/performance/accessibility/delivery contracts are not documented by retained sources | Cross-cutting architecture | S-001, S-002, S-006–S-010, S-014 | Relevant current manual/product areas reviewed | Authenticated manual/runtime tests could resolve portions |
| C-030 | UNKNOWN | High confidence in gap | No sufficiently specific current evidence was found for required non-VST formats or a public native scripting/device SDK | Extension formats | S-002–S-005, S-008 | Canonical format, pricing and manual sources reviewed | Silence is not proof of unsupported status |
| C-031 | DOCUMENTED | High | Release notes publish maintenance fixes, and 3.0.6 added keyboard navigation for dropdown lists | Current maintenance/narrow accessibility evidence | S-014 | Direct dated release note | Does not establish rollback, reliability metrics or accessibility conformance |

## 22. Source ledger and adaptive bibliography

All access dates are 2026-08-29. Vendor claims establish what Amped documents,
not independent measurement.

### S-001 — Amped Studio homepage

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/>; official current product page.
- **Version scope:** current site at cutoff; no explicit semantic version.
- **Relevant passage/section:** “Make Music Online,” browser/no-download and
  current no-mobile statements; audio editing, MIDI, automation, VST3, native
  instruments/effects, collaboration, and user segments.
- **Claims:** C-002, C-009–C-012, C-028, C-029.
- **Limitations:** marketing breadth, mutable, no host-contract detail or
  independent testing.
- **Selection rationale:** canonical current product positioning; preferred to
  third-party reviews for platform and advertised capability scope.

### S-002 — Amped Studio Manual root / “What is Amped Studio?”

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/manual/>; official current manual/index.
- **Version scope:** current manual at cutoff; unversioned.
- **Relevant passage/section:** browser DAW definition, projects stored on cloud
  servers/access from any connected computer, chapter/device/editor inventory.
- **Claims:** C-004, C-009, C-022, C-026, C-028–C-030.
- **Limitations:** index entries do not prove deep behavior; some repeated intro
  copy may be generic.
- **Selection rationale:** canonical operational documentation; preferred over
  tutorials for present conceptual scope.

### S-003 — VST / Remote product page

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/vstremote/>; official current product/setup page.
- **Version scope:** current at cutoff; Windows and macOS companion downloads.
- **Relevant passage/section:** local plugin bridge, background companion,
  standard/custom discovery, VST/VST3 statements, instruments/effects, UI,
  cloud autosave.
- **Claims:** C-004, C-015, C-017–C-019, C-025, C-026, C-030.
- **Limitations:** strong “all plugins” marketing and generic VST3 comparisons;
  no qualification matrix; download binaries were not fetched or run.
- **Selection rationale:** decision-critical canonical bridge boundary; retained
  despite marketing limitations because it is the most detailed current setup
  statement.

### S-004 — Pricing

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/pricing/>; official current commercial matrix.
- **Version scope:** Starter, Premium, Premium + AI, Classroom at cutoff.
- **Relevant passage/section:** projects/tracks, sharing, storage, WAV/MP3,
  VST3, native device/content counts, trial and prices.
- **Claims:** C-014, C-018, C-021, C-030.
- **Limitations:** mutable commercial terms; formatting is terse; no country/tax
  analysis.
- **Selection rationale:** authoritative edition boundary; preferred to FAQs and
  reseller descriptions.

### S-005 — Manual 4.11 VST Remote

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/manual/vst-remote/>; official current manual.
- **Version scope:** current VST Remote at cutoff.
- **Relevant passage/section:** bridge definition, **one VST per project** note,
  plugin selector, Win/Mac host setup, custom path, reload, Show UI.
- **Claims:** C-015–C-019, C-025, C-026, C-030.
- **Limitations:** no format version, scanner, process, state, bus, timing,
  security, or failure detail.
- **Selection rationale:** strongest primary source for the decisive instance
  limit and setup; preferred over promotional VST copy.

### S-006 — Manual 3.3 Settings

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/manual/settings/>; official current manual.
- **Version scope:** current Studio settings at cutoff.
- **Relevant passage/section:** buffer size/latency, recording input and latency
  calibration, custom VST path, device-delay compensation.
- **Claims:** C-008, C-012, C-017, C-019, C-029.
- **Limitations:** user-control descriptions, not algorithmic or measured
  guarantees.
- **Selection rationale:** canonical timing/discovery control source; preferred
  to generic audio-latency blog material.

### S-007 — Manual 3.6 Track Headers

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/manual/track-headers/>; official current manual.
- **Version scope:** current Studio 3 track model.
- **Relevant passage/section:** audio versus instrument roles, file formats,
  track controls/automation/record, and stereo Master Track.
- **Claims:** C-005, C-007, C-009, C-011.
- **Limitations:** visible controls only; no hidden graph/conversion semantics.
- **Selection rationale:** direct current evidence resolving the hybrid-track
  question; preferred to historical descriptions.

### S-008 — Manual 3.8 Device Panel

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/manual/device-panel/>; official current manual.
- **Version scope:** current Studio 3 device model.
- **Relevant passage/section:** left-to-right instrument/effect chains, bypass,
  popups/presets/context actions, VST3 insertion, Super Preset mapping.
- **Claims:** C-007, C-013, C-018, C-030.
- **Limitations:** UI-level signal description only; no plugin contract.
- **Selection rationale:** most direct first-party graph/device evidence.

### S-009 — Manual 3.2 Main Menu

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/manual/main-menu/>; official current manual.
- **Version scope:** current Studio 3 project actions.
- **Relevant passage/section:** share link, WAV/MP3/`.amped` export, cloud Save
  As/Open, audio/MIDI/`.amped` import, publish, AI actions, displayed version.
- **Claims:** C-020–C-022, C-026.
- **Limitations:** no package schema, permissions, codecs, or conflict behavior.
- **Selection rationale:** canonical project/interchange source; preferred to
  secondary workflow tutorials.

### S-010 — Manual 3.5 Arrangement Timeline

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/manual/arrangement-timeline/>; official current
  manual.
- **Version scope:** current Studio 3 arrangement.
- **Relevant passage/section:** audio/MIDI clips, left-to-right bars/beats,
  playhead, loop, snap, zoom.
- **Claims:** C-006, C-029.
- **Limitations:** no edit semantics beyond visible controls.
- **Selection rationale:** direct conceptual-workflow evidence.

### S-011 — Privacy Policy

- **Publisher/URL/kind:** LettoPro SA;
  <https://ampedstudio.com/privacy-policy/>; official policy.
- **Version scope:** live policy at cutoff; fetched page exposes no posted date.
- **Relevant passage/section:** controller, collected account/content/activity/
  purchase data, AWS/S3/Stripe, analytics cookies, use/disclosure, retention,
  children, access/deletion rights.
- **Claims:** C-001, C-023.
- **Limitations:** vendor policy, not a technical audit; revision date absent in
  fetched text.
- **Selection rationale:** legal controller's primary privacy statement;
  preferable to summaries.

### S-012 — Terms of Use

- **Publisher/URL/kind:** LettoPro SA;
  <https://ampedstudio.com/terms-of-use/>; official legal terms.
- **Version scope:** posted 2024-06-11, live at cutoff.
- **Relevant passage/section:** account/subscription types, trial/cancellation,
  software license/updates, production ownership, sound license, termination,
  Swiss law.
- **Claims:** C-024.
- **Limitations:** legal text is not product behavior or format-owner licensing;
  no legal advice is given here.
- **Selection rationale:** controlling first-party commercial/license boundary.

### S-013 — What's New in Amped Studio

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/whats-new/>; official current feature page.
- **Version scope:** Amped Studio 3 current redesign.
- **Relevant passage/section:** Super Presets/unified controls, AI multitrack and
  stems, integrated track headers, editing and main menu.
- **Claims:** C-013, C-020, C-030.
- **Limitations:** promotional and not date/version granular.
- **Selection rationale:** current Studio 3 feature context; release notes are
  used for exact version claims.

### S-014 — Release Notes

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/releasenotes/>; official versioned release notes.
- **Version scope:** 3.0.6 through visible earlier releases, including 3.0.0.
- **Relevant passage/section:** 3.0.6 date/MIDI/stems/keyboard navigation;
  automation UI; timing/edit fixes; 3.0.0 distinct audio/instrument tracks.
- **Claims:** C-001, C-005, C-009–C-012, C-020, C-027–C-029, C-031.
- **Limitations:** changes/fixes do not fully specify behavior; historical list
  may be truncated on the fetched page.
- **Selection rationale:** strongest source for current version and track-model
  transition; preferred to undated product copy.

### S-015 — FAQ

- **Publisher/URL/kind:** Amped Studio / LettoPro SA;
  <https://ampedstudio.com/faq/>; official FAQ.
- **Version scope:** live at cutoff, but page styling/copy appears partly legacy
  and has no update date.
- **Relevant passage/section:** Chromium-family browser requirement, no mobile,
  lag/buffer advice, publish, collaboration/premium members/video chat.
- **Claims:** C-002, C-021.
- **Limitations:** likely stale in places; collaboration conflicts with current
  pricing and is retained only as contradictory evidence.
- **Selection rationale:** only first-party browser-support and collaboration
  qualification found; current manual/pricing outrank it where they conflict.

### S-016 — “Amped Studio is Now a PWA”

- **Publisher/URL/kind:** Amped Studio; <https://ampedstudio.com/blog/amped-studio-is-now-a-pwa/>;
  official product announcement.
- **Version scope:** published 2021-08-31; historical, not version 3.0.6.
- **Relevant passage/section:** installable desktop icon, offline preloaded
  content, offline recording/local save, later cloud save.
- **Claims:** C-003, C-026, C-027.
- **Limitations:** old and not reaffirmed in current manual/release notes.
- **Selection rationale:** only direct first-party PWA/offline contract found;
  retained with low-currentness warning rather than generalized from “web app.”

### S-017 — “5 Steps to Using Automation”

- **Publisher/URL/kind:** Amped Studio; <https://ampedstudio.com/blog/5-steps-to-using-automation/>;
  official tutorial.
- **Version scope:** published 2021-12-02; historical workflow.
- **Relevant passage/section:** track automation list, volume/pan line points,
  pre-drawn automation during recording.
- **Claims:** C-011.
- **Limitations:** old UI; current parameter identity/write semantics unknown.
- **Selection rationale:** selected only after current track/release sources
  established automation still exists; adds bounded semantics without relying
  on third-party tutorials.

**Discovery-only/negative evidence retained:** the web-search integration
returned HTTP 429 on both attempted searches. The public Amped sitemap was used
only to locate S-016/S-017, not to prove product behavior. No official sitemap
URL explicitly named a current “hybrid track” page. No community source was
used to prove architecture.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted method/blocker | Decision impact | Safest next probe / fixture / owner |
| --- | --- | --- | --- |
| Current VST2 support and entitlement | Compared current VST product, pricing, Device Panel and manual; conflict remains | Determines legacy format scope and licensing exposure | Dated vendor support response, then one signed known-good VST2 effect/instrument on Win/macOS disposable hosts; owner unassigned |
| Scanner validation, cache, duplicates, quarantine and recovery | Current VST/manual/settings describe paths only; internals proprietary | Security, startup reliability and diagnosability | Disposable machines with benign duplicate, malformed, slow-scan and crash fixtures; inspect only user-visible behavior/logs under authorization; owner unassigned |
| Bridge process isolation, IPC security, architecture and signing | No public engineering/security document; binaries deliberately not downloaded | Critical native-code trust boundary | Vendor architecture/security documentation first; later code-signature/process/crash probe in isolated VM; owner unassigned |
| Full VST buses/events/latency/state/offline/UI contract | Required dimensions absent from vendor pages | Determines whether bridge is production-capable | Versioned known-answer VST2/VST3 suite: effect/instrument, sidechain, multi-out, MIDI out, automation, state/assets, latency/tail, offline, DPI/modal/crash; owner unassigned |
| PWA offline/local-save continuity in 3.0.6 | Only direct first-party evidence is 2021; current docs silent | Offline durability and desktop-install boundary | Disposable Chromium profile: install, preload named assets, disconnect, record/save/close/reopen/reconnect and compare; owner unassigned |
| Current hybrid/cross-type behavior | Current docs say distinct types but do not state conversion/rejection rules | Track model and migration ergonomics | In disposable project, cross-drag audio/MIDI, record both types, inspect conversion prompts/device chains and `.amped` reopen; owner unassigned |
| Collaboration entitlement and concurrency | Pricing, Main Menu and FAQ conflict; no accounts used | Sharing architecture, conflict model and tier promises | Two clean Starter/Premium accounts; test link ACLs, concurrent edits, conflict/ownership/version history and revoke; owner unassigned |
| `.amped` durability and missing dependencies | Manual establishes import/export only; schema inaccessible without project | Portability, backup and long-term migration | Create minimal project matrix, export, inspect only documented/package-visible metadata under authorization, reopen across versions/machines with missing assets/VST; owner unassigned |
| Engine precision/scaling and delay compensation accuracy | No technical spec or dynamic probe | Real-time architecture sizing and correctness | Controlled loopback/latency and deterministic render suite across track/device counts, including bridge; owner unassigned |
| Accessibility | Only dropdown keyboard navigation release note found | Keyboard/screen-reader product requirements | WCAG-oriented keyboard and screen-reader audit in disposable account; owner unassigned |

## 24. Curiosity pass and stop decision

Scores are 1 (low) to 5 (high). Cost is adverse; a candidate qualified only if
its expected documentary value could change a conclusion within the remaining
one-pass budget.

| Thread | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| PWA continuity/boundary plus automation semantics | 4 | 4 | 4 | 1 | **PURSUED.** Official sitemap led to S-016/S-017. Result: historical offline contract found; current continuity remains UNKNOWN; automation semantics bounded and triangulated with current sources. |
| VST process/isolation/security internals | 5 | 2 | 5 | 5 | **CURIOSITY_NO_GO:** documentary saturation; likely proprietary, dynamic/vendor access required. |
| Resolve VST2/VST3 contradiction by more marketing search | 5 | 2 | 3 | 3 | **CURIOSITY_NO_GO:** canonical pages already conflict; another unqualified page has low marginal evidence. |
| Search every non-VST format name separately | 3 | 1 | 2 | 4 | **CURIOSITY_NO_GO:** absence cannot establish unsupported status; dynamic/vendor matrix is the discriminating evidence. |
| Collaboration permissions/concurrency | 4 | 2 | 3 | 4 | **CURIOSITY_NO_GO:** public pages conflict and authenticated two-account testing is outside documentary authority. |
| Corporate history/market share | 1 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** unlikely to change architecture conclusions. |
| AI model/service internals | 1 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** outside the plugin/DAW architecture frame. |

### Gaps and contradictions after final synthesis

- VST2 is advertised on the dedicated page but not in the current paid feature
  label/Device Panel language.
- Project sharing is listed in Starter pricing while the FAQ says collaborators
  are premium members.
- PWA offline/local save is directly documented only in 2021.
- Current track typing is clear, but cross-type conversion and project migration
  from the earlier model are unknown.
- Nearly all deep plugin-host safety, processing, state and UI semantics remain
  proprietary/documentarily absent.

### Stop decision

**STOP — sufficient documentary coverage with explicit unknowns; source and
method boundary reached.** Nine evidence passes retrieved no more than two
decision-critical primary sources each and synthesized before the next pass.
All template sections and required format rows now have evidence or an explicit
unknown. The highest-value curiosity thread was pursued. Remaining threads need
authenticated/dynamic fixtures or vendor engineering statements and are
unlikely to be resolved by more public-page searching. Repeated web-search 429s
were a discovery limitation but did not block canonical official pages. Marginal
public documentary evidence is now nonpositive; the next step is bounded
interoperability and durability qualification, not indefinite search.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** PASS — this task created
  only `research/daw-landscape/dossiers/amped-studio.md`.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.**
  PASS — Section 0 pins 3.0.6/2026-08-07, tiers, browser/bridge platforms, and
  documentary exclusions.
- [x] **Every required dossier heading exists in order.** PASS — Sections 0–25
  and 11.1–11.6 follow `DOSSIER-TEMPLATE.md`.
- [x] **Every material assertion has a claim ID and classification.** PASS —
  substantive sections cite C-001–C-031; classifications are in prose and the
  register.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** PASS
  — Section 21 maps sources/reasoning/limits; Sections 23–24 record probes and
  blockers.
- [x] **Every required plugin-format row is present.** PASS — all 13 required
  rows appear in Section 11.1 with no blank cells.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.**
  PASS — Sections 11.2–11.6 cover discovery, process boundary, processing,
  state, UI and diagnostics without overclaiming.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.**
  PASS — no `OBSERVED` claims; vendor claims, bounded inferences, contradictions,
  and unknowns are labeled.
- [x] **Licensing and clean-room boundaries are explicit.** PASS — Sections 0
  and 16 prohibit rights inference and describe source/Terms limits.
- [x] **Bibliography records source rationale and limitations.** PASS — Section
  22 gives passage, scope, claims, limitations, and selection rationale for all
  17 retained sources.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** PASS —
  Sections 19 and 24 record pursuit, scoring, rejected threads, gaps and stop.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging,
  or commits occurred.** PASS — no product account, installer, binary, plugin,
  or authenticated service was used; no git staging/commit occurred.

**Checks performed:** template-heading and matrix review; claim-to-source audit;
contradiction/unknown review; source-pass count review; ownership check against
the pre-write working tree. **Concise result:** complete with consequential
unknowns, not blocked. **Unresolved blockers:** runtime-only bridge, PWA,
collaboration, project-format, accessibility, and engine questions listed in
Section 23. **Pre-existing workspace changes:** numerous modified/untracked
paths existed before this dossier; all were left untouched.
