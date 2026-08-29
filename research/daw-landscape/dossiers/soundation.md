# Soundation DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

- **Product family:** Soundation Studio, current browser service.
- **Canonical vendor:** Soundation AB, Sweden. [C-001, DOCUMENTED]
- **Researcher/session:** `ses_fb2735c88ffereTpa2QULAzKVW` (spawned subagent).
- **Owned path:** `research/daw-landscape/dossiers/soundation.md`.
- **Research date and cutoff:** 2026-08-29 UTC.
- **Version/snapshot:** unnumbered public web-service snapshot accessed on the cutoff date. The official release feed's newest dated entry is January 2024; this does **not** prove that the deployed service is a 2024 build. [C-002, DOCUMENTED]
- **Editions:** the main service advertises a free entry point and official pages refer separately to Soundation Education; current paid tier names, quotas, entitlements, and education packaging are `UNKNOWN`. [C-003, DOCUMENTED; C-004, UNKNOWN]
- **Platforms:** the included product is the online Studio reached in a browser. A supported browser/OS/mobile matrix and any native desktop/mobile edition are `UNKNOWN`. [C-001, DOCUMENTED; C-004, UNKNOWN]
- **Included:** public Studio workflow, native instruments/effects at architecture-relevant depth, project interchange, cloud collaboration, publishing, privacy, and content licensing.
- **Excluded:** Education administration except where it illuminates shared Studio collaboration; Sound Shop commerce; undocumented proprietary implementation; runtime probing; installation; and claims about compatibility not established by primary evidence.
- **Completion:** `COMPLETE_WITH_UNKNOWNS`.

## 1. Executive summary

Soundation is documented as an online, cloud-based collaborative DAW. Its central user model is a linear arrangement of audio and MIDI clips on audio, instrument, and FX channels, with native instruments/effects, parameter automation, a large loop/preset library, and real-time multi-user editing. [C-001, C-005, C-006, C-007, C-008, DOCUMENTED]

The strongest architecture reference is its explicit service contract: projects are auto-saved to the cloud while online, collaborators edit one project simultaneously with immediately synchronized actions/cursors, and a portable `.sng`/`.sngz` export can preserve arrangement, native devices, automation, and custom audio. [C-015, C-016, C-018, DOCUMENTED] This creates both cloud convenience and a meaningful local escape hatch, although immutable versions, rollback, conflict semantics, storage topology, and forward/backward guarantees are not documented. [C-019, UNKNOWN]

No retrieved current official source explicitly says that Soundation hosts or excludes external VST2, VST3, AUv2, AUv3, AAX, CLAP, LV2, LADSPA, DSSI, JSFX, DXi, or Rack Extension binaries. Therefore every external-format result is `UNKNOWN`, not “unsupported.” Nothing documents scanning, validation, isolation, parameter/state contracts, latency reporting, custom UIs, or missing-plugin recovery for external plugins. [C-013, C-014, UNKNOWN] The product does document its own software instruments/effects and project recall of native device state. [C-010, C-018, DOCUMENTED]

Public sources do not identify Web Audio, AudioWorklet, WebAssembly, process boundaries, real-time scheduling, graph internals, server/client render allocation, plugin delay compensation, or storage implementation. Those proprietary internals remain unknown. [C-025, C-026, UNKNOWN] The bounded inference is only that interactive editing occurs in a browser while collaboration/persistence use cloud services; audio DSP placement cannot be inferred. [C-027, INFERENCE]

**Recommendation:** treat Soundation as a useful reference for a browser-first project/collaboration boundary and portable native-project bundle, but not as evidence for an external plugin host, a low-latency engine design, or production-grade rollback/security architecture without later controlled qualification. [C-015, C-018, C-025, C-026, C-027]

**Overall confidence:** high for documented user-visible workflow and interchange; medium for the current service snapshot because release pages are unversioned; low for technical internals and external plugin hosting.

## 2. Product identity, history, and market position

Soundation AB identifies itself as the service's Swedish legal entity and data controller. The current product page calls Soundation an “online studio,” while the collaboration page calls it a cloud-based real-time collaborative DAW intended for remote teams and start-to-finish production. [C-001, C-009, DOCUMENTED]

The public site advertises recording, editing, MIDI, automation, virtual instruments/effects, collaboration, and 20,000+ sounds, positioning the product toward accessible browser music creation rather than post-production or notation. [C-005, C-008, DOCUMENTED] Market share, original launch history, ownership lineage beyond the current Soundation AB identity, and current subscription/education tier boundaries were not established in this bounded pass. [C-004, C-024, UNKNOWN]

The official “What's new” page lists changes through January 2024 but exposes no semantic version or build identifier. It includes old-project conversion and collaboration bug fixes, demonstrating maintenance activity in that dated record but not proving subsequent release cadence. [C-002, C-020, DOCUMENTED]

## 3. Workflow and conceptual model

The project is a song arrangement built from audio and MIDI clips placed on channel lanes. Audio channels accept recorded/imported audio and library samples; instrument channels accept native instruments and MIDI; FX channels receive sends for effect processing. [C-006, C-007, DOCUMENTED]

Clips are the composition blocks. They can be looped, trimmed, copied, cut, duplicated, deleted, reversed, muted, renamed, colored, and split. MIDI clips can be expanded and consolidated; audio expansion is bounded by previously trimmed source material. [C-006, DOCUMENTED]

This is a linear timeline/arrangement model; the retrieved documentation does not establish scenes, a clip-launch matrix, tracker rows, a public modular patch graph, score notation, video timeline, or post-production reel/session concepts. [C-024, UNKNOWN]

Projects live in a dashboard and Studio project list and can be created, searched, sorted, opened, renamed, duplicated, deleted by the owner, or left by a non-owner. Project metadata includes cover art, description, and genre. [C-017, DOCUMENTED]

## 4. Publicly documented architecture

The documented boundary is a browser-accessed online Studio plus cloud services for automatic save and real-time collaboration. Collaborators can work in the same project simultaneously, see cursors/actions, and receive updates described by the vendor as immediately synchronized. [C-001, C-015, C-016, DOCUMENTED]

Publishing is described as a system processing a song before opening track metadata, but ordinary mix export merely says the song “will be processed”; neither statement locates DSP on client or server. [C-022, DOCUMENTED; C-025, UNKNOWN]

No retained primary source names Web Audio, AudioWorklet, WebAssembly, workers, service workers, native helper processes, codecs, databases, object storage, transport protocols, conflict-resolution algorithms, real-time threads, graph schedulers, or deployment topology. [C-025, UNKNOWN]

**Bounded hypothesis:** interactive Studio UI/editing runs in the browser and cloud services synchronize and persist project changes. This follows the user-visible contract, but an alternative architecture could perform most audio DSP locally while using cloud only for state/media sync; the evidence cannot discriminate. [C-027, INFERENCE]

## 5. Audio engine

At the user level, audio flows through per-channel volume/pan and native effects, with sends to FX channels. The product also exposes a purpose-built Fakie “sidechaining effect,” but this does not establish arbitrary sidechain buses or a general plugin sidechain contract. [C-007, C-010, DOCUMENTED]

Audio clips support time-stretch that retains pitch, pitch-stretch, detected/correctable original BPM, and optional auto-stretch to project tempo. Recorded audio receives the project's BPM at recording time; historical release notes document improved time-stretch memory use. [C-006, C-011, DOCUMENTED]

Mix delivery includes 16-bit WAV and MP3. The documentation does not state project sample rate, internal precision, buffer/block controls, oversampling, multicore scheduling, plugin delay compensation, latency/tail reporting, dropout handling, freeze, or whether export is faster-than-real-time/local/cloud. [C-021, DOCUMENTED; C-026, UNKNOWN]

An April 2022 release-note entry says input latency was improved. That is evidence of a historical improvement only, not a current measured latency guarantee or compensation design. [C-012, DOCUMENTED]

## 6. Tracks, timeline, clips, and editing

The arrangement has audio, instrument, and FX channel types. Audio and MIDI clips share loop, trim, copy/cut/duplicate/delete, reverse, mute, rename, color, scissor, and stretch interactions; consolidation is documented only for MIDI clips. [C-006, C-007, DOCUMENTED]

MIDI clips automatically follow project tempo. Audio loops can time- or pitch-stretch; library loops can fit song tempo; imported loops can be BPM-analyzed; one-shots retain length; and recorded audio can follow later tempo changes when auto-stretch is enabled. [C-006, DOCUMENTED]

These operations appear non-destructive at the clip level because trimming can restore source extent and consolidation creates a new MIDI clip, but the underlying edit graph and media reference representation are proprietary. [C-028, INFERENCE]

Takes, lanes, comping, grouping, folders, ripple modes, tempo/meter maps, markers, and navigation limits are not covered by the retained sources. [C-024, UNKNOWN]

## 7. MIDI, sequencing, notation, and expression

Soundation documents MIDI recording/editing, MIDI clips on instrument channels, MIDI-loop import, a Note Clip Editor, and a velocity-capable virtual keyboard. [C-005, C-008, C-020, DOCUMENTED]

MIDI files can be imported and exported. Instrument/Beatmaker clips and channels can export MIDI containing notes, velocity, time signature, and tempo; empty clips, zero-velocity notes, and notes extending beyond a region have documented export omissions. [C-008, C-021, DOCUMENTED]

No retrieved source establishes Standard MIDI File type, CC editing, program changes, aftertouch, SysEx, hardware MIDI I/O, clock/MTC, MIDI 2.0, MPE/per-note expression, notation, score export, or sample-accurate event scheduling. [C-024, C-026, UNKNOWN]

## 8. Routing, mixer, automation, and control

Channel strips form the documented mixer surface: add/delete/clone/reorder/rename channels, mute/solo, volume, and stereo pan. FX channels accept signal through native Send effects. [C-007, DOCUMENTED]

Automation can change channel controls and native effect/instrument parameters over time; users choose available parameters from a channel-strip list. The coordinate system, interpolation, resolution, parameter identifiers, write modes, and sample accuracy are not documented. [C-007, DOCUMENTED; C-026, UNKNOWN]

Generic sidechain inputs, submix buses beyond FX channels, folders, VCAs, feedback routing, multi-output instruments, surround/immersive layouts, control surfaces, MIDI mapping, OSC, remote APIs, and external synchronization are `UNKNOWN`. Fakie is a native sidechaining effect, not evidence of a generic bus/plugin contract. [C-010, DOCUMENTED; C-024, C-026, UNKNOWN]

## 9. Recording, comping, and media handling

Official release notes document stereo recording, input-channel selection, and toggles for echo cancellation, noise reduction, and auto gain. The Sampler can record directly into itself. [C-011, C-012, DOCUMENTED]

Users can drag/drop or choose files to import audio and MIDI onto matching channels. The retained import page does not enumerate general audio codecs. The October 2023 Sampler specifically accepted WAV, MP3, OGG, FLAC, MP4, M4A, M4V, and library samples up to 30 seconds; that codec list must not be generalized to arrangement import. [C-018, C-023, DOCUMENTED]

Project bundles can carry imported/recorded custom audio. Punch/loop recording, take playlists, comping, input monitoring, conform, proxies, video, metadata preservation, relinking, and missing-media diagnostics are not documented. [C-018, DOCUMENTED; C-024, UNKNOWN]

## 10. Instruments, effects, content, and native devices

The current product page states 12 software instruments and 20,000+ royalty-free audio samples, MIDI loops, and instrument presets. It visibly names Beatmaker, Supersaw, FM synth, SPC, Europa by Reason, VA synth, Wub Machine, and Simple Synth; this is an architecture-relevant example set, not a claim that the visible cards are the complete current roster. [C-008, C-010, DOCUMENTED]

Visible native effect examples are Compressor, Distortion, Parametric EQ, Fakie, Reverb, Delay, Limiter, and Wubfilter. The product page describes effects as part of Soundation rather than an external binary format. [C-010, DOCUMENTED]

The October 2023 release notes describe a Simple Sampler with mono retrigger/legato-glide or poly playback, loop direction/crossfade/release, tuning/root note, ADSR, direct recording, and five interpolation quality settings. [C-023, DOCUMENTED]

The August 2023 notes introduced saved racks containing an instrument and effect chain, while then excluding Europa, Beatmaker, audio racks, and effect racks. Current persistence restrictions are not stated, so that historical limitation is not projected onto the 2026 snapshot. [C-020, DOCUMENTED; C-024, UNKNOWN]

Native project export is documented to preserve instruments, effects, arrangement, automation, and audio, but no public device SDK, native-device ABI, modulation graph, macro system, or third-party authoring path was found. [C-018, DOCUMENTED; C-024, UNKNOWN]

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

`UNKNOWN` means that the bounded current official corpus did not explicitly document either support or exclusion. It does not mean unsupported. Desktop OS columns also remain unknown because this dossier found no native-host edition or OS/browser support matrix. [C-004, C-013, C-014]

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Unnumbered browser snapshot, 2026-08-29 | No explicit support/exclusion or host-contract evidence found | C-013, C-014; attempted S-001–S-010 |
| VST3 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Unnumbered browser snapshot, 2026-08-29 | No explicit support/exclusion or host-contract evidence found | C-013, C-014; attempted S-001–S-010 |
| AUv2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Unnumbered browser snapshot, 2026-08-29 | No explicit support/exclusion or host-contract evidence found | C-013, C-014; attempted S-001–S-010 |
| AUv3 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Unnumbered browser snapshot, 2026-08-29 | No explicit support/exclusion or host-contract evidence found | C-013, C-014; attempted S-001–S-010 |
| AAX | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Unnumbered browser snapshot, 2026-08-29 | No explicit support/exclusion or host-contract evidence found | C-013, C-014; attempted S-001–S-010 |
| CLAP | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Unnumbered browser snapshot, 2026-08-29 | No explicit support/exclusion or host-contract evidence found | C-013, C-014; attempted S-001–S-010 |
| LV2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Unnumbered browser snapshot, 2026-08-29 | No explicit support/exclusion or host-contract evidence found | C-013, C-014; attempted S-001–S-010 |
| LADSPA | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Unnumbered browser snapshot, 2026-08-29 | No explicit support/exclusion or host-contract evidence found | C-013, C-014; attempted S-001–S-010 |
| DSSI | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Unnumbered browser snapshot, 2026-08-29 | No explicit support/exclusion or host-contract evidence found | C-013, C-014; attempted S-001–S-010 |
| JSFX | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Unnumbered browser snapshot, 2026-08-29 | No explicit support/exclusion or host-contract evidence found | C-013, C-014; attempted S-001–S-010 |
| DirectX/DXi | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Unnumbered browser snapshot, 2026-08-29 | No explicit support/exclusion or host-contract evidence found | C-013, C-014; attempted S-001–S-010 |
| Rack Extension | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Unnumbered browser snapshot, 2026-08-29 | Included Europa does not prove Rack Extension hosting | C-010, C-013, C-014; S-001 |
| Product-native/other | UNKNOWN native OS edition | UNKNOWN native OS edition | UNKNOWN native OS edition | DOCUMENTED native instruments/effects | Current page; dated 2023 notes | Native devices exist; device format/SDK and third-party authoring are unknown | C-010, C-018, C-023, C-024; S-001, S-002, S-008 |

### 11.2 Discovery, scanning, validation, and recovery

No official retained source documents external plugin discovery paths, scanning, validation, cache, duplicate identity, blacklist/quarantine, rescan, architecture bridging, signing checks, or failure recovery. These are `UNKNOWN`, not implicitly absent. [C-013, UNKNOWN]

### 11.3 Runtime isolation and compatibility

External-plugin execution mode, process isolation, sandboxing, crash containment, architecture bridging, compatibility modes, and headless operation are `UNKNOWN`. The browser/cloud product identity alone cannot establish any of these. [C-014, UNKNOWN]

### 11.4 Host/plugin processing contract

For external plugins, audio/MIDI/event buses, instrument/effect roles, sidechains, multi-output, note expression, MIDI 2.0, automation accuracy, latency/tail reporting, bypass/suspend, offline rendering, and dynamic I/O are all `UNKNOWN`. Native Send/FX/Fakie behavior must not be generalized into a third-party host contract. [C-007, C-010, DOCUMENTED; C-014, UNKNOWN]

### 11.5 Parameters, automation, state, presets, and project recall

Native effect/instrument parameters are selectable for automation, and `.sng`/`.sngz` projects preserve native instruments, effects, and automation. External parameter identity/ranges/text, state blobs, presets, asset references, missing-plugin placeholders, migration, and recovery are `UNKNOWN`. [C-007, C-018, DOCUMENTED; C-014, UNKNOWN]

### 11.6 UI, diagnostics, and failure modes

No documentation was found for external plugin UI embedding/detachment/scaling or plugin-specific diagnostics. A 2023 Studio release added detailed crash-report sending for general errors, but that is not evidence of plugin crash attribution or containment. [C-020, DOCUMENTED; C-014, UNKNOWN]

## 12. Extensibility and integration

The documented integration boundary is user-level file exchange: audio, MIDI, and native `.sng`/`.sngz` projects, plus public/play-only/template links and embeddable project popups in dated release notes. [C-018, C-020, C-021, DOCUMENTED]

No public scripting language, macro/action API, extension SDK, controller API, remote app, OSC interface, device-authoring API, stable file schema, or protocol/versioning promise was identified. The fact that `.sngz` can be unzipped to retrieve custom audio does not make the proprietary `.sng` structure a supported developer API. [C-024, UNKNOWN; C-029, INFERENCE]

## 13. Project format, persistence, interoperability, and collaboration

Every change is auto-saved while online, with “All changes saved,” “Saving…,” and “Offline” status. Projects are private by default and are managed through owner/non-owner roles. [C-016, C-017, DOCUMENTED]

Real-time collaborators share one project, with immediately synchronized edits and visible cursors/actions. The documentation does not explain operation ordering, conflicts, partial connectivity, permissions beyond ownership/invitation, audit logs, or collaborator limits. [C-015, DOCUMENTED; C-019, UNKNOWN]

Soundation imports/exports `.sng` and `.sngz`; both preserve arrangement, instruments, effects, automation, and audio, while `.sngz` additionally packages custom imported/recorded audio and can be unzipped to recover it. A local export is explicitly suitable as a backup. [C-018, DOCUMENTED]

Audio and MIDI files can be imported. Mix export is 192-kbps MP3, 320-kbps MP3, or 16-bit WAV; clips/channels can export WAV, and instrument/Beatmaker material can export MIDI. [C-021, DOCUMENTED]

Dated release notes document project duplication and a fix for old-project conversion, but there is no public immutable version history, rollback, autosave retention, crash-recovery journal, formal migration policy, compatibility window, checksums, archive manifest, AAF/OMF/ADM/MusicXML/DAWproject support, or missing-dependency model in the retained evidence. [C-020, DOCUMENTED; C-019, C-024, UNKNOWN]

## 14. Delivery, live, post-production, and specialized workflows

Soundation provides song mix export, per-clip/channel export, MIDI export, optional normalization on community publishing, track metadata/visibility/comments/download controls, and a widget player. [C-021, C-022, DOCUMENTED]

It is therefore documented for basic music delivery and social publishing, not for DDP, batch render, stems as a named workflow, loudness targets, video/timecode, ADR, notation, surround/immersive/ADM, show control, or live-performance set management. Those specialized capabilities are `UNKNOWN`; their absence from these pages is not proof of exclusion. [C-024, UNKNOWN]

## 15. Performance, reliability, security, and accessibility

Historical release notes mention improved project loading, time-stretch memory use, input latency, and user-submittable detailed crash reports. They also record bugs involving old-project conversion, sample upload, collaboration opening, automation, and note playback; this is useful evidence of diagnosed failure classes but not current defect prevalence. [C-012, C-020, DOCUMENTED]

Cloud autosave depends on connectivity. “Offline” is a save status; no retained source promises full offline editing, service-worker caching, or later merge. [C-016, DOCUMENTED; C-030, UNKNOWN]

The 2023 privacy policy says Soundation uses technical and organizational safeguards and networks protected with encryption, firewalls, and passwords, and describes breach-response routines. It also says payment data is held by a PCI-DSS-compliant payment provider. These are vendor policy statements, not independent control verification, and are not specific about project/audio encryption at rest or in transit. [C-032, DOCUMENTED; C-033, UNKNOWN]

Soundation documents account/usage/purchase/profile and authentication data processing, Google/Facebook authentication, subcontractor/partner sharing under data-processing agreements, GDPR rights, and retention periods that can extend up to 12 months after account termination. [C-031, DOCUMENTED]

Scaling limits, CPU/resource controls, availability/SLA, backups, rollback, security certifications, data residency, incident history, browser sandbox assumptions, localization, keyboard-only completion, screen-reader semantics, and other accessibility conformance are `UNKNOWN`. A release note mentions some keyboard navigation, but that is insufficient to claim an accessibility standard. [C-020, DOCUMENTED; C-033, UNKNOWN]

## 16. Licensing, ecosystem, and implementation constraints

Soundation's content agreement says Soundation sounds are licensed, not sold, under a non-transferable single-user license. It permits modification/use in commercial productions but prohibits redistribution of isolated sounds or creation of another sample library; multi-user/file-sharing rights require written authorization. [C-034, DOCUMENTED]

Users are responsible for imported/uploaded/published material, must have rights to it, and may face deletion or account suspension for infringement. [C-034, DOCUMENTED]

The agreement is a content license, not source-code, product-SDK, plugin-format, trademark, certification, or redistribution permission. Current subscription terms and education/multi-user content implications were not fully researched. No inference about VST/AU/AAX/other SDK rights follows from the product evidence. [C-035, UNKNOWN]

Clean-room adaptation is limited to abstract, publicly documented behavior. This dossier grants no right to copy the UI, project schema, sounds, DSP implementation, names/marks, or proprietary code, and gives no legal advice.

## 17. Strengths, liabilities, and architecture lessons

**Strengths.** The combination of same-project real-time collaboration, automatic cloud persistence, browser access, explicit save status, and downloadable native project bundles is a coherent cloud-first durability pattern. [C-015, C-016, C-018, DOCUMENTED] Audio/MIDI/channel abstractions remain simple and legible, while per-clip/per-channel exports provide practical escape routes. [C-006, C-007, C-021, DOCUMENTED]

**Liabilities.** Connectivity is part of the save contract, while versions/rollback, conflict semantics, migration guarantees, and operational limits are undocumented. [C-016, DOCUMENTED; C-019, UNKNOWN] The external plugin boundary and technical audio-engine contract are too weakly evidenced to serve as an interoperability or low-latency architecture reference. [C-013, C-014, C-025, C-026, UNKNOWN]

**Lesson.** Separate product-value evidence from implementation evidence: “online/cloud collaborative” proves a user/service contract, not Web Audio usage, server rendering, thread topology, or security assurance. [C-027, INFERENCE]

## 18. Transferable patterns

| Pattern | Problem and minimal mechanism | Evidence | Prerequisites/tradeoffs | Adaptation risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| Cloud autosave with explicit state | Show saved/saving/offline state while persisting each change | C-016 | Connectivity, durable operation log/snapshot model, clear failure UX; offline merge remains hard | Medium | CANDIDATE |
| Same-project presence | Invite collaborators and surface cursors/actions with low-latency sync | C-015 | Identity, authorization, ordered operations/conflict policy, privacy controls | High | CONDITIONAL |
| Portable native project bundle | Export arrangement/device state plus embedded custom media; allow media extraction | C-018 | Versioned schema, asset manifest, migrations, validation, safe archive handling | Medium | CANDIDATE |
| Typed channels with FX sends | Keep audio, instrument, and FX roles explicit; route sends to return-style processing | C-007 | Graph validation, latency handling, extensibility strategy | Low | CANDIDATE |
| Clip-level adaptation | Preserve source while looping/trimming and attach BPM/stretch policy per clip | C-006, C-028 | Quality modes, metadata correction, cache/render policy | Medium | CANDIDATE |
| Export escape hatches | Offer mix, clip/channel audio, MIDI, and project export | C-021 | Deterministic render, metadata rules, licensing/user warnings | Low | CANDIDATE |

These are behavior-level patterns only; no protected UI expression, source, schema, or DSP is reproduced.

## 19. Rejected patterns and CURIOSITY_NO_GO

- **CURIOSITY_NO_GO — infer external plugin exclusion from browser delivery.** Rejected because browser identity does not prove that no helper/bridge/cloud host exists; explicit vendor evidence or a controlled probe is required. [C-013, C-014]
- **CURIOSITY_NO_GO — infer Web Audio/AudioWorklet/WebAssembly.** Rejected because none of the retained sources names those technologies; multiple client/server DSP allocations remain plausible. [C-025, C-027]
- **CURIOSITY_NO_GO — treat Europa as Rack Extension hosting.** Rejected because a bundled/licensed instrument does not establish discovery or instantiation of arbitrary Rack Extensions. [C-010, C-013]
- **CURIOSITY_NO_GO — project current limits from 2022–2023 release notes.** Rejected because dated exclusions/fixes may have changed. [C-020, C-024]
- **CURIOSITY_NO_GO — enumerate every native device page.** Rejected after the current overview established the architecture-relevant device families; deeper DSP inventories would not change the plugin-host or project architecture decision within budget. [C-010]
- **CURIOSITY_NO_GO — use search snippets/community claims as plugin evidence.** Rejected as untrusted/secondary and unnecessary for an honest `UNKNOWN` result.
- **CURIOSITY_NO_GO — inspect client bundles or reverse engineer network traffic.** Outside this documentary clean-room scope and unnecessary to record proprietary internals as unknown.

## 20. Falsifiable hypotheses and adversarial checks

| Hypothesis/check | Documentary test and result | Disposition |
| --- | --- | --- |
| H1: Soundation uses a linear audio/MIDI clip arrangement | Official clip and channel guides directly define clips as audio/MIDI song blocks on typed channels | Supported as user model; C-006, C-007 |
| H2: Soundation is cloud collaborative rather than merely link-sharing | Official collaboration page says same project/same time, immediate updates, cursors/actions, and cloud autosave | Supported as vendor-documented behavior; C-015, C-016 |
| H3: Projects have a portable, media-complete backup | Export guide says `.sngz` includes custom audio and `.sng`, while `.sng` carries arrangement/devices/automation | Supported with format-compatibility caveats; C-018, C-019 |
| H4: Browser delivery means VST/AU are unsupported | No explicit official inclusion or exclusion found; browser identity is insufficient | Failed; C-013, C-014 |
| H5: “Europa by Reason” means Rack Extension compatibility | No scanner/catalog/SDK/runtime contract evidence | Failed; C-010, C-013 |
| H6: “Processed” export proves cloud rendering | Documentation does not locate processing | Failed; C-025 |
| H7: Cloud collaboration proves server-side DSP | Sync/persistence evidence does not determine DSP placement | Failed; C-027 |
| H8: Saved native device state implies a full external-plugin state contract | `.sng` recall covers native instruments/effects only; external contract absent | Failed; C-014, C-018 |

**Later safe probes:** use a disposable test account and synthetic media to record browser/OS support, offline transitions, collaborator conflicts, autosave recovery, import/export round trips, latency under named hardware, and Studio UI presence/absence of any documented external-plugin bridge. Such probes must distinguish format acceptance, scanning, instantiation, processing, automation/state recall, and full host-contract fidelity.

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | DOCUMENTED | High | Soundation AB offers Soundation as an online/browser Studio. | Current public snapshot | S-001, S-009 | Official product and legal pages | No browser/OS support matrix or build ID |
| C-002 | DOCUMENTED | High | The unnumbered release feed's newest dated entry is January 2024. | Public release page at cutoff | S-002 | Direct page heading/order | Does not date the deployed build or prove no later changes |
| C-003 | DOCUMENTED | Medium | Main pages expose a free entry point and separately mention Soundation Education. | Current marketing/docs | S-001, S-005, S-006 | “Try/Join for free”; Education references | Tier names and entitlements absent |
| C-004 | UNKNOWN | High | Current paid editions, quotas, supported browser/OS/mobile matrix, and native-app boundary are unknown. | Current product | Failed pricing route; S-001–S-010 corpus | No retained explicit matrix | Next probe: authenticated plan/support pages and official compatibility article |
| C-005 | DOCUMENTED | High | Studio tools cover audio/MIDI recording/editing, time/pitch stretch, automation, and collaboration. | Current overview | S-001 | Direct feature sections | Depth varies by feature |
| C-006 | DOCUMENTED | High | Audio/MIDI clips are arrangement blocks with looping, editing, and stretch behavior. | Current basics guide | S-003 | Direct workflow instructions | Underlying data model unknown |
| C-007 | DOCUMENTED | High | Audio, instrument, and FX channels expose mute/solo, volume, pan, sends, and native parameter automation. | Current basics guide | S-004 | Direct channel-strip instructions | No general bus/plugin contract |
| C-008 | DOCUMENTED | High | Current overview states 20,000+ sounds/presets and 12 software instruments. | Current overview | S-001 | Direct counts | Counts are vendor claims, not independent inventory |
| C-009 | DOCUMENTED | High | Vendor characterizes Soundation as a cloud-based real-time collaborative DAW for remote same-project work. | Current collaboration page | S-005 | Direct description | Vendor statement, not measured latency |
| C-010 | DOCUMENTED | High | Soundation includes named native instruments/effects, including Europa and Fakie. | Current overview | S-001 | Direct device cards | Visible cards are examples, not a full roster or SDK contract |
| C-011 | DOCUMENTED | High | Audio can use time/pitch stretch, BPM detection/correction, auto-stretch, and recorded-project-BPM metadata. | Current clip guide; dated notes | S-003, S-002 | Direct instructions/release text | DSP algorithm/quality not specified except Sampler interpolation |
| C-012 | DOCUMENTED | Medium | Dated notes report stereo/input selection, browser preprocessing toggles, and improved input latency. | April/May 2022–2023 notes | S-002 | Direct historical entries | Not a current latency measurement or complete recording contract |
| C-013 | UNKNOWN | High | No retrieved official source explicitly supports or excludes any required external plugin format. | Current browser product | S-001–S-010 negative corpus; failed nested attempt | Absence is not proof of unsupported behavior | Ask vendor/current help; then controlled UI probe |
| C-014 | UNKNOWN | High | External plugin scanning, isolation, buses, parameters, latency, UI, state, recovery, and diagnostics are undocumented. | Current browser product | S-001–S-010 negative corpus | No external host evidence to deepen | Full contract probe only after explicit host boundary is established |
| C-015 | DOCUMENTED | High | Collaborators work in the same project simultaneously with synchronized updates and visible cursors/actions. | Current collaboration page | S-005 | Direct collaboration sections | Conflict/order/permissions/limits unknown |
| C-016 | DOCUMENTED | High | Changes auto-save to cloud while online and expose saved/saving/offline states. | Current project/collaboration guides | S-005, S-006 | Direct save sections | Offline editing/merge and retention unknown |
| C-017 | DOCUMENTED | High | Projects are private by default and support dashboard search/sort/rename/duplicate/delete/leave plus metadata. | Current project guide | S-006 | Direct management sections | Sharing role model beyond owner/non-owner not specified |
| C-018 | DOCUMENTED | High | `.sng`/`.sngz` import/export preserves arrangement, native devices, automation, and audio; `.sngz` embeds custom audio. | Current import/export guides | S-007, S-008 | Direct format descriptions | Schema/version/migration guarantees unknown |
| C-019 | UNKNOWN | High | Immutable versions, rollback, autosave retention, conflict semantics, and formal compatibility guarantees are unknown. | Cloud/project lifecycle | S-002, S-005–S-008 | Duplication and conversion fix do not establish versioning | Controlled history/recovery probe plus vendor architecture statement |
| C-020 | DOCUMENTED | High | Dated notes document rack saving, crash reports, project links, migration/collab fixes, and performance/bug classes. | 2022–2024 release history | S-002 | Direct entries | Historical state must not be projected as current limits |
| C-021 | DOCUMENTED | High | Export supports MP3/WAV mixes, clip/channel WAV, and MIDI with notes/velocity/meter/tempo. | Current export guide | S-008 | Direct format descriptions | Sample rate/dither/stems/batch not specified |
| C-022 | DOCUMENTED | High | Publishing processes a track to the community with optional normalization and metadata/visibility/comment/download controls. | Current export/publish guide | S-008 | Direct steps | Processing location and loudness target unknown |
| C-023 | DOCUMENTED | High | The 2023 Simple Sampler accepted named codecs and exposed playback/loop/tuning/envelope/recording/interpolation controls. | October 2023 release | S-002 | Direct release entry | Current limits may differ; not general import codec evidence |
| C-024 | UNKNOWN | High | Unmentioned advanced workflow, routing, control, accessibility, and extension capabilities remain unknown. | Current product | S-001–S-010 bounded corpus | Manual absence is not exclusion | Targeted current help or safe runtime probes |
| C-025 | UNKNOWN | High | Web/audio/cloud implementation internals and render placement are proprietary/undocumented. | Current product architecture | S-001, S-005, S-006, S-008 | “Browser/cloud/processed” does not identify implementation | Vendor engineering source or lawful runtime architecture probe |
| C-026 | UNKNOWN | High | Sample rate, precision, buffers, scheduling, PDC, real-time/offline render topology, and automation accuracy are unknown. | Audio engine | S-001–S-008 | User-level features do not prove engine contract | Controlled loopback/render tests and official engine docs |
| C-027 | INFERENCE | Medium | Browser UI plus cloud sync/persistence is the minimum evidenced split; DSP may still be client- or server-side. | Architecture hypothesis | C-001, C-015, C-016, C-025 | Bounded to user-visible contract | Alternative allocations remain equally plausible |
| C-028 | INFERENCE | Medium | Clip trimming/restoration and new-clip consolidation indicate non-destructive user-level editing. | Clip workflow | C-006 | Restorable source extent/new MIDI clip | Internal edit graph/source retention details unknown |
| C-029 | INFERENCE | High | Unzippable `.sngz` media does not make `.sng` a supported public API. | Extensibility | C-018 | Asset accessibility differs from schema contract | A future official schema could change this |
| C-030 | UNKNOWN | High | Full offline editing and later synchronization are not documented. | Connectivity | S-006 | “Offline” is explicitly a save status only | Disable network in disposable project and observe supported UX |
| C-031 | DOCUMENTED | High | Privacy policy describes processed data, lawful bases, auth partners, sharing, GDPR rights, and retention. | Policy last amended 2023-01-04 | S-009 | Direct policy terms | Policy age and actual control operation not independently verified |
| C-032 | DOCUMENTED | High | Vendor policy claims encryption/firewall/password safeguards, breach routines, and PCI-DSS payment provider handling. | Privacy policy | S-009 | Direct policy terms | Generic; no project-specific encryption/security certification |
| C-033 | UNKNOWN | High | Project/audio encryption, residency, backup, certifications, SLA, and accessibility conformance are unknown. | Security/reliability/accessibility | S-009 plus bounded corpus | Generic policy insufficient | Current security whitepaper/DPA/accessibility report or controlled tests |
| C-034 | DOCUMENTED | High | Sound library content is single-user licensed, commercially usable in productions, and not redistributable as isolated sounds/libraries; users remain responsible for uploads. | Current public content license page | S-010 | Direct agreement | Not legal advice; team/education implications require counsel |
| C-035 | UNKNOWN | High | Product subscription terms and plugin SDK/trademark/certification rights were not established. | Licensing/ecosystem | S-010 | Content agreement is narrower than product/SDK rights | Review current Terms and applicable format-owner licenses with counsel |

## 22. Source ledger and adaptive bibliography

All retained sources are official Soundation primary sources and were accessed 2026-08-29. Vendor claims establish what Soundation documents, not independent runtime performance. Search/page text was treated as untrusted evidence until read in the source body.

- **S-001 — “Online studio,” Soundation AB.** <https://soundation.com/online-studio>. Current unnumbered product overview. Relevant sections: Studio tools, Sound library, Virtual instruments, Audio effects, Open the online studio. Supports C-001, C-003, C-005, C-008, C-010, C-025. **Limitations:** marketing-level, card lists are visibly partial, no build/platform/engine contract. **Rationale:** preferred over snippets because it is the canonical current product boundary and device-family overview.
- **S-002 — “What's new,” Soundation AB.** <https://soundation.com/whats-new>. Official dated release feed, newest entry January 2024. Relevant entries: Jan 2024 chat; Oct/Aug/May 2023 Sampler/racks/recording; 2022 project/export/latency/bug changes. Supports C-002, C-011, C-012, C-020, C-023. **Limitations:** no version numbers; historical entries do not prove current restrictions; month ordering contains an apparent “January 2022” heading after 2023 entries. **Rationale:** only retained official release/change provenance.
- **S-003 — “How to loop & edit clips,” Soundation AB.** <https://soundation.com/learn/basics/loop-edit-clips>. Current basics guide. Relevant sections: clip definition, loop/trim/edit/consolidate, stretch, auto-stretch. Supports C-006, C-011, C-028. **Limitations:** user behavior only; no data structure/DSP internals. **Rationale:** strongest direct source for clip/audio/MIDI arrangement semantics.
- **S-004 — “How to use channel strips,” Soundation AB.** <https://soundation.com/learn/basics/channel-strips>. Current basics guide. Relevant sections: channel types, sends, mute/solo, volume/pan, automation. Supports C-007. **Limitations:** no complete graph/bus/automation specification. **Rationale:** canonical user-visible mixer/routing source.
- **S-005 — “Online music collaboration in real-time,” Soundation AB.** <https://soundation.com/studio-tools/collaborate>. Current feature page. Relevant sections: real-time updates, cloud autosave, collaborators/cursors, workflow. Supports C-003, C-009, C-015, C-016, C-025, C-027. **Limitations:** vendor marketing; no measured synchronization latency/conflict algorithm/limits. **Rationale:** direct official statement of the differentiating collaboration contract.
- **S-006 — “How to manage projects,” Soundation AB.** <https://soundation.com/learn/basics/manage-projects>. Current basics guide. Relevant sections: create/search/sort/open, ownership operations, metadata, save status. Supports C-016, C-017, C-030. **Limitations:** no version/retention/recovery specification. **Rationale:** preferable to marketing for exact project and connectivity behavior.
- **S-007 — “How to import files,” Soundation AB.** <https://soundation.com/learn/basics/import-files>. Current basics guide. Relevant sections: audio/MIDI import and `.sng`/`.sngz` import. Supports C-018. **Limitations:** no general audio codec list or validation/error behavior. **Rationale:** canonical import boundary.
- **S-008 — “How to export and publish songs,” Soundation AB.** <https://soundation.com/learn/basics/export-publish>. Current basics guide. Relevant sections: mix/clip/channel/MIDI/project export and community publishing. Supports C-018, C-021, C-022, C-025, C-029. **Limitations:** no sample rate/render location/version schema; “processing” is architecturally ambiguous. **Rationale:** highest-value portability/delivery source and complement to S-007.
- **S-009 — “Privacy Policy,” Soundation AB.** <https://soundation.com/privacy-policy>. Policy last amended 2023-01-04. Relevant sections: controller, data categories/purposes/bases, retention, safeguards, sharing, rights, cookies. Supports C-001, C-031, C-032, C-033. **Limitations:** dated vendor policy, generic security language, no independent audit or project-data architecture. **Rationale:** primary legal source required for privacy/security boundaries.
- **S-010 — “Soundation Copyright/Licensing Agreement,” Soundation AB.** <https://soundation.com/licensing-agreement>. Undated public content license. Relevant sections: licensed-not-sold, single-user/commercial use, redistribution restrictions, imported/uploaded material. Supports C-034, C-035. **Limitations:** applies to sounds/content and uploads; not complete product terms or plugin SDK rights; not legal advice. **Rationale:** primary source for the loop/content reuse boundary.

**Unretained/negative discovery results:** `https://soundation.com/studio` returned no readable body; `https://soundation.com/pricing` and `/sitemap.xml` returned 404; the canonical gzip sitemap required one lawful decode and was used only to locate official routes; general web search was rate-limited (HTTP 429); a bounded nested plugin-evidence researcher could not start because the environment's subagent-depth limit was reached. No claim relies on those failures.

## 23. Unknowns and next discriminating probes

| Consequential unknown | Attempted methods / blocker | Decision impact | Safest next probe | Access/fixture / owner |
| --- | --- | --- | --- | --- |
| External VST/VST3/AU/AUv3 and other plugin hosting/exclusion | Reviewed S-001–S-010; official overview/site routes exposed native devices only; broad search rate-limited; nested bounded search blocked; absence is non-probative | Critical for extension architecture | Ask Soundation support for a current written format matrix; then inspect a disposable Studio account for an official plugin/bridge workflow | Public support plus test account; unassigned |
| Full external host contract | No format acceptance established, so scanning/runtime/state depth cannot be tested documentarily | Critical for interoperability | Only after a format is explicitly accepted, run a synthetic qualification matrix distinguishing scan, instantiate, buses, UI, automation, latency, state, crash, and recovery | Disposable signed test plugins/bridge if authorized; unassigned |
| Web Audio/client/server DSP and process model | Current docs say browser/cloud but name no technology; proprietary internals | Critical for engine reference | Seek an official engineering talk/job architecture page; otherwise record browser performance/network traces with synthetic content and no credentials/secrets | Disposable account/browser; unassigned |
| Audio engine limits and latency | One historical “improved input latency” note; no rates/buffers/PDC/render specification | High | Controlled loopback and render tests by browser/OS/interface, plus official settings/support matrix | Audio loopback fixture; unassigned |
| Offline behavior | Save guide shows Offline status and says autosave relies on online connectivity | High for resilience | Disconnect during a synthetic project, record supported editing/save/reconnect/merge behavior, then discard | Disposable project; unassigned |
| Versions, conflicts, rollback, recovery | Duplication and old-project conversion are documented; no version API/history | High for collaboration durability | Two-client conflicting edits plus forced reload/reconnect; request official retention/recovery policy | Two disposable accounts/browsers; unassigned |
| Current plans, quotas, browsers, OS/mobile support | Guessed pricing route 404; no compatibility matrix retained | Medium | Auth plan page and official support response captured with date | Public/authenticated account; unassigned |
| Project schema/migration/missing assets | `.sng`/`.sngz` behavior documented but schema and compatibility window are not | High for portability | Round-trip synthetic old/current projects; inspect only user-exported archive manifest/media, not proprietary code | Synthetic projects and permitted exports; unassigned |
| Security, residency, backup, accessibility | Privacy policy is generic and dated; no whitepaper/DPA/accessibility conformance retained | High for enterprise/education | Obtain current DPA/security/accessibility statements; independent keyboard/screen-reader test if authorized | Vendor documents and disposable account; unassigned |
| Product terms and plugin-format licensing | Content license only; product Terms/format-owner licenses not reviewed within budget | Medium/legal | Counsel reviews current Terms and any claimed format-owner SDK/trademark terms before implementation | Legal counsel; unassigned |

## 24. Curiosity pass and stop decision

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Candidate follow-up | Decision relevance | Expected value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Explicit external plugin support/exclusion | 5 | 5 | 5 | 2 | **Pursued:** bounded nested discovery attempted but blocked by subagent-depth; retained official corpus provided no explicit answer, so result remains UNKNOWN |
| Current plan/browser matrix | 3 | 4 | 2 | 2 | CURIOSITY_NO_GO: useful product scope, but less architecture-changing than plugin boundary; pricing route inaccessible within budget |
| Web Audio/AudioWorklet implementation | 5 | 3 | 4 | 5 | CURIOSITY_NO_GO: likely proprietary and documentary searches risk speculation; later controlled probe is more discriminating |
| Every native instrument/effect detail | 2 | 2 | 2 | 3 | CURIOSITY_NO_GO: current overview already establishes device families; DSP inventory will not resolve architecture decision |
| Historical corporate lineage/market share | 1 | 1 | 2 | 3 | CURIOSITY_NO_GO: little bearing on engine/project/plugin architecture |
| Community reports of VST wishes/failures | 3 | 2 | 2 | 2 | CURIOSITY_NO_GO: secondary anecdotes cannot establish current support or internals |
| Client-bundle/network reverse engineering | 4 | 2 | 4 | 5 | CURIOSITY_NO_GO: outside documentary clean-room depth and unnecessary for honest unknowns |

**Gaps after synthesis:** explicit plugin exclusion/support; technical audio process/render boundary; formal project versions/conflicts; current plans/platform matrix; and operational security/accessibility assurance.

**Contradictions/ambiguities:** the current page states 12 instruments while showing only a subset of cards; the release feed is unversioned and stops at January 2024 despite a current 2026 site footer; and “processed” export does not locate rendering. None is resolved by inference.

**Stop decision:** `STOP — COVERAGE WITH UNKNOWNS / BUDGET EXHAUSTED`. Eight two-source-or-fewer evidence passes covered every required dossier dimension with ten retained primary sources. Subsequent official feature pages were yielding duplicate user-level evidence, while the remaining gaps require a vendor answer or bounded dynamic qualification rather than more broad documentary search. The declared pass budget is exhausted, proprietary internals remain explicitly unknown, and marginal documentary evidence is nonpositive for the leading conclusions.

## 25. Completion checklist

- [x] **Only the assigned dossier path was edited.** Created only `research/daw-landscape/dossiers/soundation.md`; no shared or sibling file was edited.
- [x] **Identity, edition, version/date, OS scope, and exclusions are explicit.** Section 0 pins the unnumbered 2026-08-29 browser snapshot and unknown tier/platform details.
- [x] **Every required dossier heading exists in order.** Sections 0–25 and subsections 11.1–11.6 are present.
- [x] **Every material assertion has a claim ID and classification.** Narrative claims resolve to C-001–C-035; synthesis tables cite claim IDs.
- [x] **Every claim resolves to source IDs or a fully described `UNKNOWN`.** Claims register and Section 23 provide sources, blockers, impact, and probes.
- [x] **Every required plugin-format row is present.** All 13 required rows appear in Section 11.1.
- [x] **Hosting depth goes beyond format names or explicitly remains `UNKNOWN`.** Sections 11.2–11.6 cover the full contract and preserve unknowns.
- [x] **Facts, vendor documentation, inferences, and unknowns are not conflated.** Classifications are explicit; no `OBSERVED` claims are made.
- [x] **Licensing and clean-room boundaries are explicit.** Sections 16 and 22 distinguish content rights, product/SDK unknowns, and vendor claims.
- [x] **Bibliography records source rationale and limitations.** Section 22 has ten retained sources with passage scope, limitations, and selection reasons.
- [x] **Curiosity pass and `CURIOSITY_NO_GO` decisions are present.** Sections 19 and 24 record pursued/rejected threads and scores.
- [x] **No unsafe execution, access bypass, proprietary-code copying, staging, or commits occurred.** Documentary public pages only; no installation, login, binary execution, reverse engineering, staging, or commit.

**Checks performed:** heading-order check; required-format-row check; claim/source cross-reference check; source-count and primary-source check; unknown/probe check; curiosity/stop check; and path-limited workspace status check.

**Concise result:** 35 classified claims, 10 retained official primary sources, 13/13 plugin rows, all required headings, and explicit unknowns/probes.

**Unresolved blockers:** plugin-hosting boundary, Web/audio engine internals, current tier/platform matrix, offline merge, version rollback/conflict model, and detailed security/accessibility assurances.

**Pre-existing workspace changes:** `git status --short -- research/daw-landscape` showed the whole research directory as untracked before this owned write. Those pre-existing files were read but left untouched; no staging or commit was performed.
