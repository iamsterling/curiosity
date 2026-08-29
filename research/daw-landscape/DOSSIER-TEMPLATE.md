# <Product> DAW dossier

> Research-only evidence. No design or implementation authority.

## 0. Metadata and scope

Product family, canonical vendor/upstream, researcher/session ID, owned path,
research date/cutoff, current version or snapshot, editions, platforms,
inclusions, exclusions, and completion (`COMPLETE`,
`COMPLETE_WITH_UNKNOWNS`, or `BLOCKED`).

## 1. Executive summary

Decision-relevant findings, key differentiators, plugin-hosting headline, major
unknowns, and confidence. Cite claim IDs.

## 2. Product identity, history, and market position

Provenance, maintained/discontinued status, intended users and workflows,
editions, platform matrix, current release evidence, and relevant lineage.

## 3. Workflow and conceptual model

Project/session model; linear timeline, scenes/clips, tracker patterns, modular
graph, notation, post-production, live, browser, or mobile mental models; core
objects and user-visible composition boundaries.

## 4. Publicly documented architecture

Only publicly evidenced internals: process boundaries, audio engine, graph,
threading/scheduling, services, storage, extension points, or open-source module
map. Proprietary internals remain `UNKNOWN`; add bounded hypotheses separately.

## 5. Audio engine

Audio graph/routing, sample rates, bit depth/precision, buffer/block behavior,
real-time and offline paths, multicore scheduling, plugin delay compensation,
freeze/bounce/render, oversampling, drop-out handling, and engine diagnostics.

## 6. Tracks, timeline, clips, and editing

Track/media types, object/clip model, destructive versus non-destructive edits,
takes/lanes/comping, grouping, warping/time stretch, tempo/meter, ripple/edit
modes, version/history, and navigation.

## 7. MIDI, sequencing, notation, and expression

MIDI recording/editing, event model, piano roll, score, pattern sequencing,
MPE/per-note expression, MIDI 2.0, SysEx, generators, hardware I/O, clock/MTC,
and synchronization.

## 8. Routing, mixer, automation, and control

Buses, sends, returns, folders/VCAs, sidechains, feedback rules, channel layout,
surround/immersive, automation model, parameter mapping, control surfaces,
MIDI/OSC/remote APIs, and synchronization.

## 9. Recording, comping, and media handling

Input monitoring, punch/loop recording, take management, comping, file formats,
sample management, conform, proxies, video, metadata, and asset relinking.

## 10. Instruments, effects, content, and native devices

Built-in device architecture, device chains/racks, modulation, samplers,
synthesis, content packaging, presets, macro systems, and native extension
formats. Inventory only when architecture-relevant.

## 11. Third-party plugin hosting

### 11.1 Format/platform matrix

| Format | macOS | Windows | Linux | Mobile/web | Edition/version evidence | Status/notes | Claims/sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VST2 | | | | | | | |
| VST3 | | | | | | | |
| AUv2 | | | | | | | |
| AUv3 | | | | | | | |
| AAX | | | | | | | |
| CLAP | | | | | | | |
| LV2 | | | | | | | |
| LADSPA | | | | | | | |
| DSSI | | | | | | | |
| JSFX | | | | | | | |
| DirectX/DXi | | | | | | | |
| Rack Extension | | | | | | | |
| Product-native/other | | | | | | | |

Use `DOCUMENTED`, `UNKNOWN`, or `NOT_APPLICABLE:<reason>`—never a blank.

### 11.2 Discovery, scanning, validation, and recovery

### 11.3 Runtime isolation and compatibility

### 11.4 Host/plugin processing contract

### 11.5 Parameters, automation, state, presets, and project recall

### 11.6 UI, diagnostics, and failure modes

## 12. Extensibility and integration

Scripting, extensions, macros, SDKs, plugin/device authoring, controller APIs,
remote apps, command/action model, file/protocol APIs, and stability/versioning.

## 13. Project format, persistence, interoperability, and collaboration

Project representation, autosave, crash recovery, undo/history, migrations,
backward/forward compatibility, missing dependencies, archive/collect, import
and export (AAF/OMF/ADM/MIDI/MusicXML/DAWproject, stems), cloud collaboration,
version control, and portability.

## 14. Delivery, live, post-production, and specialized workflows

Mix/master delivery, batch/export, loudness, DDP, video/timecode, ADR, surround,
immersive/ADM, show control, live performance, and product-specific specialties.

## 15. Performance, reliability, security, and accessibility

Scaling limits, resource controls, crash containment, diagnostics, update and
rollback, signing/notarization, plugin trust boundaries, telemetry/privacy,
accessibility, localization, and tested hardware/platform constraints.

## 16. Licensing, ecosystem, and implementation constraints

Product and open-source licenses, SDK/format licensing, trademarks,
redistribution/certification constraints, discontinued formats, ecosystem
dependencies, and clean-room limits. Do not give legal advice.

## 17. Strengths, liabilities, and architecture lessons

Evidence-backed strengths and liabilities by use case. Separate product quality
from suitability as an architectural reference.

## 18. Transferable patterns

For each clean-room candidate: problem, minimal mechanism, supporting claims,
prerequisites, tradeoffs, adaptation risk, and disposition (`CANDIDATE` or
`CONDITIONAL`). Never copy protected expression.

## 19. Rejected patterns and CURIOSITY_NO_GO

Record rejected mechanisms/threads, evidence, decision rationale, and conditions
that would reopen research.

## 20. Falsifiable hypotheses and adversarial checks

List tested documentary hypotheses, counterevidence searches, contradictions,
failed hypotheses, and later dynamic probes. Explicitly test the difference
between “format accepted,” “plugin scanned,” “plugin instantiated,” and “full
host contract works.”

## 21. Claims register

| ID | Classification | Confidence | Claim | Scope | Source IDs | Dependencies/reasoning | Counterevidence/limits |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 22. Source ledger and adaptive bibliography

For each `S-nnn`: title, publisher, URL, kind, version scope, access date,
relevant passage/section, supported claims, limitations, selection rationale,
and why preferable to alternatives.

## 23. Unknowns and next discriminating probes

For every consequential unknown: attempted methods, blocker, impact, available
evidence, safest next probe, required access/fixture, and unassigned owner.

## 24. Curiosity pass and stop decision

Rank candidate follow-ups by decision relevance, expected value, novelty, and
cost. Pursue at most the best qualifying thread. Record all others as
`CURIOSITY_NO_GO`. State why research stopped and whether coverage saturated or
the budget/access boundary ended it.

## 25. Completion checklist

Copy and answer every binary check from `RESEARCH-CONTRACT.md`, then list the
owned path, checks performed, concise results, unresolved blockers, and
pre-existing workspace changes left untouched.
