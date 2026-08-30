# DAW architecture decision frame

> Research-only. This file grants no design, implementation, licensing,
> procurement, release, or security-acceptance authority.

**Decision:** What product, audio-engine, editing, persistence, extension, and
plug-in-hosting architecture should a native ARM64 Apple-platform DAW spanning
macOS, iPadOS, and iPhone use, and which observed DAW patterns should be
clean-room adapted, rejected, or investigated with prototypes?

**Evidence cutoff:** 2026-08-29 UTC.

## Decision-critical questions

1. Which user and project models recur across linear, clip-launching, tracker,
   modular, notation, post-production, mobile, and browser DAWs?
2. How do products expose audio/MIDI graphs, tracks, clips, buses, routing,
   automation, latency compensation, offline rendering, freeze, and recovery?
3. Which plug-in formats fit the target surfaces: AUv3 across macOS/iPadOS/iOS,
   AUv2/VST3 compatibility on macOS, and conditionally VST2 on macOS? Which
   evidence and legal/provenance constraints gate VST2 and rule out other
   non-Apple/non-mobile formats for the initial product?
4. How are plugins discovered, scanned, validated, cached, quarantined,
   sandboxed, bridged across architectures, instantiated, rendered, automated,
   persisted, restored, and diagnosed after failure?
5. How are sidechains, multiple audio buses, MIDI/event I/O, note expression,
   parameter identity, plugin latency/tails, custom UIs, state chunks, presets,
   and missing plugins represented?
6. Which interchange, collaboration, scripting, controller, remote-control,
   accessibility, live-performance, video, notation, and delivery boundaries
   are documented?
7. What can be learned from public/open implementations, and which proprietary
   internals must remain explicitly unknown?
8. What Apple SDK, sandbox, App Extension, signing, notarization, App Store,
   trademark, redistribution, and entitlement constraints affect AUv2/AUv3 and
   macOS VST3 support, especially given discontinued VST2 licensing?

## Corrected target constraints

- Native ARM64 only. No Intel/x86_64 product build, Rosetta host mode, or
  third-party architecture bridge is an initial requirement.
- Product surfaces are macOS on Apple silicon, iPadOS, and iOS on iPhone.
- AUv3 is the only initial third-party DSP format that can span all three
  product surfaces.
- AUv2 and VST3 are macOS-only compatibility formats.
- VST2 is a conditional macOS-only goal: preserve an adapter seam, but do not
  implement or ship it until an entity-specific legal/provenance gate approves
  the work.
- Windows, Linux, Android, browser, AAX, CLAP, LV2, LADSPA, DSSI, JSFX,
  DirectX/DXi, and Rack Extension remain comparison evidence, not initial target
  platforms or host commitments.

## Depth budget

- One independent parent researcher per named DAW/product family and one owned
  dossier path.
- Start with at most two decision-critical sources per evidence pass, synthesize
  claims and gaps, then run another pass only for a material unresolved gap.
- Prefer official manuals, support matrices, release notes, SDK/format owners,
  and immutable open-source code. Community sources may locate evidence or
  document user-observed failure modes but cannot prove vendor internals.
- No product installation or binary execution is required in this documentary
  wave. Dynamic qualification belongs in later disposable test harnesses.
- Nested researchers, if available, may only investigate a bounded source gap;
  they must not edit the dossier or broaden scope. The parent remains the sole
  writer and claim owner.

## Coverage rule

The roster is a broad, bounded census—not a claim that a finite search can find
every DAW ever created. It includes currently maintained mainstream DAWs plus
architecture-relevant open-source, tracker, modular, post-production, cloud,
mobile, and historically influential products. Pure two-track editors,
notation-only applications, live plugin racks, and hardware-only workstations
are excluded unless their hosting or workflow model is materially DAW-like.

A product dossier is sufficient when it:

- identifies product/version/platform/edition scope and provenance;
- covers every section in `DOSSIER-TEMPLATE.md`;
- gives an explicit evidence-backed or `UNKNOWN` entry for every plugin format
  in the required matrix;
- separates `DOCUMENTED`, `OBSERVED`, `INFERENCE`, and `UNKNOWN` claims;
- retains source URLs, access dates, relevant passages, and selection rationale;
- names transferable patterns without copying protected expression; and
- records unresolved, decision-relevant tests rather than filling gaps from
  memory.

## Synthesis dimensions

Later synthesis will compare products on:

1. workflow and user-model coverage;
2. real-time audio graph and scheduling model;
3. editing, arrangement, clips, takes, comping, and automation;
4. MIDI, note expression, notation, controllers, and synchronization;
5. routing, mixing, latency, rendering, and delivery;
6. AUv3 cross-device fidelity plus macOS AUv2/VST3 and conditional VST2
   compatibility;
7. scanning, validation, isolation, crash recovery, and diagnosability;
8. project durability, migration, portability, collaboration, and interchange;
9. extension APIs, scripting, remotes, and ecosystem boundaries;
10. ARM64 Apple performance, sandboxing, accessibility, platform, and licensing
    constraints.

## Curiosity and stop rule

After each dossier's first synthesis, rank open threads by decision relevance,
expected value, novelty, and cost. Pursue only the highest-value thread that can
change an architecture conclusion. Record all rejected threads as
`CURIOSITY_NO_GO` with rationale.

Stop the documentary wave when every roster entry has a complete or honestly
blocked dossier, each architecture dimension is represented by multiple product
families, plugin-hosting unknowns are visible, and another source pass is
unlikely to change the leading hypotheses. The next phase should be bounded
interoperability prototypes, not indefinite web searching.
