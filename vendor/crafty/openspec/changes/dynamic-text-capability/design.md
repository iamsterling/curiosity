## Context

See `proposal.md` — Why, and the three capability specs for observable behavior.

**Current.** Schema v5's discriminated `DocumentNode` requires `text: string` on text nodes and prohibits it on every other current kind. Every known source version validates text value before kind and before migration; the explicit `v4-to-v5-require-text-content` step materializes absent historical text as `""`; typed and runtime command ingress enforce the same rule; canonical serialization validates the current document before sorted-key JSON output. Protocol v5 carries a text command; Rust embeds Inter, advances one glyph per Unicode scalar, preserves each callback contour as a closed nonzero Vello subpath, and presents through the module-owned WebGPU stack. Text measurement still falls back to the authored box and hit testing is box-only. ADR 0024's retained oracles qualify only this pinned embedded-Inter contour conversion, not shaping, layout, full fidelity, or final realization.

**Current baseline.** ADR 0020 accepted protocol-v5 text geometry, embedded Inter, and a single-line advance ladder as a first rendering foothold; it explicitly deferred shaping, metrics, font selection, editing, and line breaking. [ADR 0024](../../../docs/architecture/adrs/0024-correct-embedded-inter-contours.md) now narrows that baseline: the malformed adapter is not fidelity evidence, its bounded contour correction is implemented, protocol v5 remains unchanged, and its former engine guidance is not a later selection. This proposal does not silently promote either decision into full text fidelity.

**Evidence.** Competitor evidence supports separation of logical content, scoped intent, font state, container policy, resolved layout, and editing adapters; it does not expose a transferable implementation or performance target (`docs/research/2026-08-15-competitive-text-systems-synthesis.md:80-156,235-249`). Ecosystem evidence establishes two plausible responsibility stacks and two distinct realization families, but explicitly defers selection (`docs/research/2026-08-16-rust-webgpu-text-ecosystem.md:7-15,30-50,81-96`). The architecture translation recommends a time-bounded common corpus with Parley/Vello as the first hypothesis and cosmic-text/Glyphon as the contrasting hypothesis, not permanent production interchangeability (`docs/research/2026-08-16-text-architecture-translation.md:85-203`).

The invariant at stake is that editable logical work remains the same work after layout, rendering, save/reopen, undo/redo, font failure, and a different frontend. DOM state, a Rust editor buffer, shaped glyphs, or an atlas as canonical text would violate enforced invariants and is rejected.

### Initial gate reconciliation — 2026-08-16

**Current status and disposition.** Status counts come from `openspec list --json` on 2026-08-16; contracts were checked against each change's proposal/design/spec/tasks and current source. This record changes no overlapping change.

| Active change                     |                                                                       Current status | Ownership/conflict/dependency disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------- | -----------------------------------------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authored-layout`                 | 21/23 tasks; implementation tasks complete, repository verification/build tasks open | No ownership conflict. It remains sole owner of `Fixed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Hug | Fill`, min/max, available-space distribution, versioned layout evaluation, intrinsic-measurement requests/dependencies, and last-valid resolved boxes. Dynamic text may supply text measurements only. Tasks 4.5/7.5 remain blocked on a joint contract for dependency keys, bounded passes, stale results, and text-content overflow without changing authored-layout sizing semantics. |
| `vector-path-rendering`           |                       34/40 tasks; six real-browser/presentation evidence tasks open | No product-semantics ownership conflict. It owns the Vello path/presentation lineage and shared real-device renderer evidence. Its planning text is historically pinned to protocol v3, but current source is protocol v5; dynamic text therefore depends on current source/ADR 0020, not a literal v3 assumption. Dynamic text's contour and controlled-pixel oracle may reuse the shared browser readiness path, but remains text-specific and cannot mark the vector change's pending browser gates complete. Glyph outlines remain disposable realization geometry, never authored path identity.                                                       |
| `declarative-scene-api`           |                   10/12 tasks; first consumer and final mechanical verification open | Concrete baseline conflict recorded: its accepted artifacts promise protocol-v3 output, while current `packages/scene-api/src/resolver.ts` imports `DRAW_PROTOCOL_VERSION` and therefore emits protocol v5; `SceneText` already maps a plain string/fill/optional size into the current text command. Dynamic text preserves that bounded compatibility behavior only. Resolved lines/glyphs/fonts/caret semantics require a separate approved update after the resolved-text packet contract and then-current protocol are decided; task 4.9 remains the enforcement gate.                                                                                 |
| `canvas-actions-parity-tranche-2` |                                                                           4/34 tasks | No current ownership conflict, but two coordination points are active. Its measurement pills use the existing protocol-v5 text foothold and explicitly do not own text measurement; that compatibility use neither selects nor approves dynamic-text shaping/realization. Its isolation double-click/Escape ladder and hit-test work must be reconciled with later text-edit entry/caret behavior and with universal point editing before either interaction vocabulary changes.                                                                                                                                                                            |
| `universal-point-editing`         |                                                                           0/24 tasks | Required sequencing conflict recorded. It proposes a non-additive document migration for canonical placement-boundary geometry on every placeable node, including text, plus double-click/Escape and hit-test changes. Because schema v5 is now current, that future migration must rebase from v5 (not the older unspecified “previous version”), preserve required canonical `text`, and keep text boundary points distinct from glyph/content/range semantics. Its point-edit arbitration must be jointly reconciled before dynamic text adds text-edit entry or point-to-caret effects. Neither change may independently claim the next schema version. |
| `cms-foundation`                  |                        5/46 tasks; only the pure kernel model tranche is implemented | No ownership conflict and no current runtime dependency. CMS owns renderer-independent collection values, including its separate structured-block rich-text field model; no CMS engine/adapter currently supplies canvas text. Any future CMS-to-canvas binding must be separately specified to provide content/reference intent through validated editor commands and resolution inputs. CMS blocks do not define Crafty text ranges, shaping, containers, editing, or renderer semantics; task 7.6 remains deferred until such a binding exists.                                                                                                          |

**Current renderer baseline.** `DRAW_PROTOCOL_VERSION` is exactly 5; versions 1–5 are accepted; `DrawGeometry` is `"rect" | "path" | "text"`; a v5 text command carries a string and optional local-unit size; and the packet remains one coarse renderer-semantic-neutral frame. ADR 0020 is accepted and unsuperseded, with embedded Inter, scalar advance, Vello-path realization, module-owned WebGPU presentation, and last-valid failure posture. ADR 0024's implementation retains callback first anchors, segment controls, contour boundaries, terminal-wrap closure, transformed winding, and nonzero holes for the pinned embedded font; malformed or unrepresentable contours fail without partial geometry. ADR 0023 changes canonical document content only and neither prerequisite approves an engine, shaping/layout contract, font policy, range unit, packet change, WASM resolution boundary, or final realization.

**Recorded authorization scope.** The user's explicit instruction, **“Keep going until complete,”** is recorded as approval to proceed with the prerequisite and executable evidence-harness slices in sections 2 and 3 of this task list. It is not security-owner approval of the containment plan in task 3.1, and it does not approve executing malformed/oversized fonts before that gate passes. It also does not approve a layout engine, dependency, font source or persistence policy, range unit, WASM ownership/export, renderer-packet change, glyph realization, rich-text model, or any other deferred ADR decision. The already implemented schema-v5 prerequisite is separately authorized by ADR 0023. Product integration remains blocked on the later explicit gates.

## Goals / Non-Goals

**Goals:**

- Make present decisions only where current evidence is sufficient: ownership, sequencing, failure posture, evidence gates, and compatibility boundaries.
- Establish one coherent path from authored logical text to disposable resolution to renderer-neutral draw data, while preserving kernel coordinate/hit-test authority.
- Require executable browser/WASM and malformed-font evidence before selecting dependencies, a layout engine, or glyph realization.
- Keep full resolution/rebuild as the correctness oracle and delay optimization until measured fixtures exist.
- Make every architecture or schema commitment conditional on the applicable OpenSpec and ADR gate.

**Non-Goals:**

- Selecting Parley-family versus cosmic-text-family, or vector versus atlas, in this design.
- Defining a durable range unit, rich-text schema, font package format, or exact protocol payload before corpus evidence and ADR approval.
- Treating CMS bindings as text semantics, or promising visual export and accessibility behavior not covered by the specs.
- Maintaining two production text engines, two ordinary glyph realizers, a DOM measurement fallback, or new semantics in transitional `Scene`.
- Inventing a numeric performance, memory, font-size, or abuse budget.

## Decisions

### 1. Sequence evidence and contracts before product breadth

**Proposed.** Work proceeds through explicit gates: current validation and contour oracles; executable browser/WASM corpus; responsibility/font/range/container contracts and ADRs; read-only resolved plain text; kernel-owned plain editing; authored typography/layout; rich ranges/interchange; measured optimization. A later slice cannot weaken an earlier contract to pass.

This follows the accepted translation's minimum coherent slices (`docs/research/2026-08-16-text-architecture-translation.md:269-438`). It also adapts Penpot's transitional lesson: multiple live paths multiply measurement and correctness surfaces (`docs/research/2026-08-15-competitive-text-systems-synthesis.md:158-168`).

**Alternatives considered.** (a) Start with a toolbar text tool and Latin demo — plausible because protocol v5 already draws strings; loses because it cements scalar layout, box hit testing, and invalid mutation as foundations. (b) Design rich text and font packaging first — plausible because those are eventual product needs; loses because range units, fallback identity, plain editing, and container ownership are unresolved and expensive to migrate. (c) Keep ADR 0020's advance ladder while adding edits — plausible as a small renderer change; loses because caret/range semantics cannot be reconstructed correctly from scalar advances.

**Current validation diagnostic contract.** At command runtime, `DOCUMENT_TEXT_VALUE_INVALID` identifies every `text` value for which `typeof value !== "string"`. This is exhaustive across JavaScript runtime values, not only JSON: tests cover all JSON non-string classes—number, boolean, null, array, and object, with object coverage including a structurally valid `GlassFill`—plus representative `undefined`, function, symbol, and bigint bypasses. `DOCUMENT_TEXT_KIND_INVALID` identifies a present string on a node kind that cannot carry text. Command validation checks text value before text kind and before the generic object/property guard: when both value and kind are invalid, it throws exactly `DOCUMENT_TEXT_VALUE_INVALID`. The type-level command surface accepts only a string when `property` is `text`. Every rejection occurs before candidate-document construction and leaves canonical authored bytes, kernel revision, undo depth, and redo depth unchanged.

**Current deserialization ordering.** Deserialization is JSON-scoped: its exhaustive non-string classes are number, boolean, null, array, and object. Validation remains fail-fast and returns exactly one diagnostic for a node. For a present `text` member it checks value before kind, so a JSON non-string on a non-text-capable node returns the one-element code sequence [`DOCUMENT_TEXT_VALUE_INVALID`]; a string on that node returns [`DOCUMENT_TEXT_KIND_INVALID`]. This order applies at every known source-version validator and at the current-version validator. It prevents migration from laundering malformed old input and makes object values independent of unrelated fill validation or generic property diagnostics. Red tests assert the exact one-element sequence, not merely containment; function, symbol, bigint, and `undefined` belong to runtime command bypass tests, not JSON deserialization tests.

**Current canonical absence and compatibility contract.** Schema v4 remains the last format where a text-capable node may omit `text`. The non-additive v5 schema makes `text` required for text-capable nodes and absent for all other kinds. The explicit migration id is `v4-to-v5-require-text-content`. It runs after v4 source validation and before v5 validation; it adds `text: ""` only when a v4 text-capable node has no own `text` member, preserves every present correctly-kinded string, and never rewrites a present invalid value. Every known v1–v4 source validator retrospectively enforces value-before-kind validation: a wrong-kind string rejects with `DOCUMENT_TEXT_KIND_INVALID` before that source's migration step and is never stripped, relocated, or normalized. Therefore only known old documents satisfying the retrospective rule are migratable. This candidly adds a compatibility break for documents historical lax validators accepted, in exchange for no silent data loss. Older accepted versions reach v4 through the existing chain; the v3→v4 step targets an explicit v4 constant, not the moving current-version constant, so v5 does not skip a migration. A v5 text-capable node with absent text fails with `DOCUMENT_TEXT_VALUE_INVALID`; commands therefore never observe absence, and replacing a migrated empty string produces an inverse whose value is exactly `""`, not `undefined`. Canonical serialization and persisted fixtures include `text: ""`; load→save→reload is byte-stable after the one migration. Unknown versions still fail before any migration or coercion.

This optional-to-required field change is non-additive and crosses the repository's document-schema ADR criterion. [ADR 0023](../../../docs/architecture/adrs/0023-canonical-dynamic-text-content.md) approved the v4→v5 schema/migration prerequisite, which is implemented with red/green evidence retained by this change.

**Alternatives considered.** Reusing coarse `DOCUMENT_INVALID` is plausible because current shape validation commonly uses it; it loses because the two confirmed text defects become untestable by stable class. Using command-only codes is plausible because commands throw directly; it loses because malformed persisted input would report a different defect taxonomy for the same invariant violation.

**Alternatives considered for absence and wrong-kind text.** (a) Keep `text` optional and interpret absence as empty at each consumer — plausible because current fixtures allow it; loses because commands and inverses must preserve two representations of one logical value and consumers can drift. (b) Treat absent historical text as malformed — plausible for a strict new invariant; loses backward compatibility with correctly-kinded known-schema documents. (c) Silently fill absence while retaining schema v4 — plausible as a local loader convenience; loses because canonical bytes change without a versioned migration and a v4 reader cannot distinguish pre/post-contract documents. (d) Strip or relocate historical wrong-kind strings — plausible as a compatibility repair; loses because the intended semantics are unknowable and migration would silently discard or reinterpret authored data. The explicit v5 migration plus retrospective rejection is the smallest version-honest, no-silent-data-loss choice.

### 2. Authored logical intent is canonical; resolution is a disposable shared service

**Proposed.** The kernel owns validated logical text, authored typography/container intent, commands, transactions, history, and text-level hit/caret queries. A Crafty-owned, renderer-independent resolution contract produces disposable font, cluster, line, glyph, bounds, caret/affinity, and diagnostic results. The same resolution revision supplies measurement, hit testing, editing geometry, and rendering projection. Rust may evaluate the contract, but no Rust buffer owns durable commits.

This adapts the convergent separation in competitor formats and both Rust stacks without adopting their public types (`docs/research/2026-08-15-competitive-text-systems-synthesis.md:85-107`; `docs/research/2026-08-16-rust-webgpu-text-ecosystem.md:30-50`).

**Alternatives considered.** (a) Shape only inside `render_packet` — plausible because Rust already realizes text; loses because layout, caret, and kernel hit testing would use different geometry. (b) Browser DOM/Canvas measurement — plausible for web font access and IME; loses because it creates a renderer-divergent authority and is not available to other frontends. (c) Persist shaped runs — plausible for fast reopen; violates canonical authored-state and font/version invalidation invariants.

**Decision gate.** The exact coarse resolution API, sync/async placement, stale-result policy, and resolved record are ADR-worthy and remain deferred until both candidates can emit the corpus inventory. The contract is engine-neutral only at the semantic boundary; it is not a promise of permanent engine plug-compatibility.

### 3. Run a bounded two-candidate investigation, then select one production engine

**Proposed.** A no-product-integration browser/WASM harness evaluates a Parley-family path first and a cosmic-text-family path as the required contrast using identical pinned fonts, Unicode inputs, font absence, geometry outputs, malformed-font fixtures, and environment records. Prototype adapters end at selection. Exactly one layout path enters production.

**Why both are plausible.** Parley composes Fontique, ICU4X, HarfRust, and Skrifa and has source-evidenced Vello editing geometry; it aligns with the existing Vello line. cosmic-text offers a coherent font/layout/editor abstraction and a separately evidenced Swash/Glyphon realization path (`docs/research/2026-08-16-rust-webgpu-text-ecosystem.md:54-79`).

**Why neither wins now.** Parley/Fontique have tracked web-font and layout gaps; cosmic-text/Glyphon have integration/version and second-render-path costs. Neither has passed Crafty's browser byte-provisioning, complex-text, failure, artifact-size, or abuse corpus. Upstream anecdotes are not measurements.

**Pre-commitment.** Before any malformed or oversized font is executed, the abuse harness requires an approved containment plan with enforceable process termination and explicit harness-specific CPU, wall-time, memory, upload, and GPU-resource ceilings. Those containment ceilings protect the investigation environment and are not production budgets. A blocking diagnostic may characterize and reject a candidate, but it cannot qualify that candidate for production. Selection requires the chosen candidate to pass every mandatory browser/WASM, Unicode, font-provisioning, geometry, security, dependency/license, and shipped-artifact criterion, with one owner per responsibility and an approved ADR. Unsupported diagnostics are acceptable only for glyph classes explicitly declared optional by the capability. If no candidate passes all mandatory criteria, the outcome is stop/research—not acceptance with diagnostics or a hidden third production path.

**Current task 3.1 gate (post-cap correction, 2026-08-16).** Prior approval is withdrawn and task 3.1 is unchecked. Version-3 metadata supplies expected values only; live inner admission, rather than isolation booleans, validates interface/route exposure, the complete mount inventory, read-only root and cgroup-v2 mounts, bounded allowlisted tmpfs mounts, device entries, exact UID/GID/capability/no-new-privileges/environment/cgroup state, and rejects before adversarial execution. The watchdog now makes `docker rm --force` failure fatal and verifies absence on normal, timeout, SIGINT, SIGTERM, controller-loss, and error paths. Negative live variants fail closed. However, this Docker Desktop kernel exposes non-loopback tunnel interfaces even under `--network=none`; strict loopback-only admission therefore rejects the nominal capsule. Task 3.1 and 3.6 remain blocked, no fonts were executed, and no third independent review occurred.

**Proposed task 3.3 evidence contract.** Candidate investigation records use the
versioned, deterministic contract in [`evidence-contract/`](evidence-contract/README.md).
It preserves each candidate's explicitly labelled native range unit while recording
independently identified UTF-8 byte, UTF-16 code-unit, and Unicode code-point boundary
maps. Exact conversions remain distinguishable from lossy or unmappable evidence.
Required records also separate clusters and candidate-native bidi affinity labels,
lines, positioned glyphs, font byte/face/variation identities, stable diagnostics,
qualified environments, dependency/build/artifact hashes, and timing/resource
distributions. Realization and pixel artifacts are optional and environment-bound.
Exact binary64 bit strings and total UTF-8-byte canonical sorting provide repeatable
bytes and hashes; required geometry space/unit/axes/origin metadata covers every
line/glyph dimension, and incompatible metadata is incomparable rather than
converted. Unknown versions, nulls, non-scalar Unicode, implicit units, incomplete
maps, dangling or incoherent graph links, incoherent conversions, and budget fields
reject with stable codes. “Independently identified” records distinct derivation
identities only; it makes no unenforceable provenance-independence claim.

This is investigation interchange, not the proposed production resolution contract
in decision 2. Task 4.2 still exclusively owns the durable range unit,
normalization, grapheme, affinity, and DOM/Rust/interchange decisions. Candidate
glyph IDs and affinity labels are opaque, and this contract does not select an
engine, font policy, resolved-text API, packet, or realization. Recording only a
single normalized common range is plausible because comparisons become simpler,
but loses native conversion defects and prematurely selects a unit. Recording only
raw candidate output is plausible because it avoids abstraction, but loses
deterministic cross-candidate comparison and conversion-loss detection. The selected
evidence-only contract is the smallest option that preserves both facts.

### 4. Font resolution is an explicit trust and identity boundary

**Proposed.** The font contract separates authored request, byte source/provenance, byte/version identity, readiness, face match, fallback order, substitution/staleness, variation/features, licensing/embedding rights, and parser/resource security. Imported, shared, project, and URL bytes are untrusted regardless of license. Generic/system names cannot support a cross-machine determinism claim unless resolved to declared bytes/version; otherwise the state is explicitly non-deterministic.

This adapts recurring competitor font states and the CSS Fonts constraint that generic mapping varies; it treats explicit browser shaper-byte provisioning as an integration inference to test, not a guarantee supplied by CSS Font Loading (`docs/research/2026-08-16-rust-webgpu-text-ecosystem.md:90-96,123-134`).

**Alternatives considered.** (a) Store family/style only and let each browser resolve — plausible and convenient; loses deterministic geometry and makes substitution invisible. (b) Embed every font in the document — plausible for reproducibility; loses on licensing, file size, and trust policy. (c) Keep only embedded Inter — plausible for the first read-only slice and retained as that slice's bounded fixture; loses as the general dynamic-text policy.

**Decision gates.** Browser byte provisioning, fallback identity/order, project font assets, persistence, licensing/embedding, parse/resource limits, and export policy remain separate explicit decisions. External bytes cannot enter production before threat model, abuse fixtures, security review, and any dependency ADR pass.

### 5. Range units, normalization, and affinity are contract decisions before editing

**Proposed.** The evidence harness records logical text, candidate source ranges, clusters, grapheme behavior, bidi affinity, and every conversion boundary for non-BMP, combining, ZWJ, Indic, and mixed-direction fixtures. No insert/delete/range or rich-text schema lands until one durable unit and normalization contract is approved.

Competitor APIs expose numeric ranges without enough unit evidence, while Penpot's traced UTF-16 conversion exposes limitations; therefore copying a library or browser offset type is not justified (`docs/research/2026-08-15-competitive-text-systems-synthesis.md:241-246,256-263`).

**Alternatives considered.** UTF-16 code units are plausible at the DOM edge but dangerous as an implicit durable contract; UTF-8 bytes fit Rust storage but are not user-perceived boundaries; Unicode scalars are simple but split grapheme sequences; grapheme indexing matches many edit operations but still needs affinity and stable conversion for shaping clusters. None is selected without executable conversion evidence.

**ADR trigger.** Any durable range unit or normalization choice changes schema, commands, clipboard, interchange, and future collaboration semantics and requires an ADR before implementation.

### 6. Text resolution supplies intrinsic measurement without writing layout back

**Proposed.** `authored-layout` remains the sole owner of per-axis `Fixed | Hug | Fill`, minimum/maximum sizing, parent available-space distribution, and resolved boxes. Dynamic text maps those existing modes into text resolution for the initially supported horizontal writing mode: horizontal is inline and vertical is block; `Fixed` passes the declared resolved axis size as a text constraint, `Hug` supplies intrinsic text measurement under applicable constraints, and `Fill` passes the size distributed by authored layout as a text constraint. Dynamic text owns only any new text-content overflow policy for content exceeding that resolved container; it does not redefine sizing or general layout overflow. Font-dependent lines and measurements remain disposable and never become authored geometry. Vertical writing, path text, and shape text require later capabilities.

**Active dependency.** `authored-layout` already defines versioned layout semantics, intrinsic requests/dependencies, and last-valid fallback. Dynamic text extends that contract; it does not create a second layout engine or make text layout part of Taffy's product semantics.

**Alternatives considered.** (a) Use node height as font size and width as selection only — current and cheap; loses intrinsic/fixed semantics and line agreement. (b) Write measured bounds into the document — plausible to break cycles; violates authored/resolved separation and makes fonts mutate history. (c) Let Taffy shape text — loses responsibility clarity because Taffy consumes measurements rather than owning shaping.

**Decision gate.** The `Fixed | Hug | Fill` mapping and ownership above are fixed by this change. The text-content overflow vocabulary, evaluator/resolver termination, stale results, and dependency keys require joint approval with the `authored-layout` owner before schema integration. Any text-overflow field belongs to `editor/dynamic-text-authoring`; no field may silently alter authored-layout sizing behavior.

### 7. Plain-text editing is kernel-owned; browser input is a thin adapter

**Proposed.** Cluster/line/affinity geometry must exist before caret editing. The interaction model gains a closed text-edit effect vocabulary; platform `beforeinput`/composition/clipboard events are adapted into ephemeral editing transitions and validated commits. Each declared typing/composition action has a specified history outcome. Point-to-caret extends the existing kernel hit-test authority and coordinate conversion; no third implementation is allowed.

This adapts Penpot's demonstrated input-capture versus geometry ownership split while rejecting its implementation as a template (`docs/research/2026-08-15-competitive-text-systems-synthesis.md:142-149,160-168`).

**Alternatives considered.** (a) `contenteditable` as canonical content — plausible for IME; violates command/history authority. (b) Rust editor object as canonical — plausible with candidate editing utilities; violates frontend independence and kernel history. (c) Whole-string replacement per keystroke — current-compatible; loses range correctness, composition cancellation, and deliberate history semantics.

**ADR trigger.** Any change to command granularity, transaction/coalescing, undo semantics, or durable selection requires an ADR. Accessibility projection is a separate future capability; this change makes no unsupported promise.

### 8. ADR 0020 remains baseline until evidence-backed ADRs narrow or supersede it

**Current bounded prerequisite.** Protocol v5, one coarse frame crossing, Rust-owned GPU/presentation, renderer-neutral draw data, and last-valid presentation remain constraints. ADR 0024's source-contour and controlled-browser-pixel gates pass for the corrected embedded-Inter adapter. The scalar advance ladder is still not a trusted layout foundation, and the correction does not select final glyph realization. New layout/font/editing semantics stop above the renderer boundary.

**Alternatives considered.** (a) Declare ADR 0020 superseded now — loses because no engine, packet, or realizer is selected. (b) Treat every ADR 0020 implementation detail as permanent — loses because the ADR explicitly deferred full text and current source disproves outline fidelity. The chosen posture retains accepted boundary decisions and delays a supersession claim until executable evidence identifies the exact replaced clauses.

**ADR triggers.** A new coarse resolution WASM export, renderer packet changes, font resources crossing the packet, changed GPU ownership, engine selection, and glyph realization selection each require an ADR as applicable. Engine and realization should be separate ADR decisions unless evidence shows inseparable coupling.

### 9. Vector and atlas realization remain independent evidence gates

**Proposed.** Compare Vello/vector and Glyphon-style atlas realization using the same positioned-glyph and font-identity inputs. Evidence separates geometry determinism from browser pixels and records outline topology, small sizes, zoom/transforms, color/bitmap glyphs, memory/resource behavior, device loss, and failure preservation. One ordinary realization ships; a secondary representation is allowed only for a proven unsupported glyph class and requires an explicit bounded policy.

**Why vector is plausible / loses.** It preserves the existing Vello composition line and continuous transforms; it lacks proven current contour fidelity, small-size behavior, color coverage, and cache cost. **Why atlas is plausible / loses.** It provides explicit raster/cache composition and mask/color separation; it adds texture uploads, scale policy, atlas pressure, pass ordering, and device-loss lifecycle. The research supports both as candidates and no transferable comparison (`docs/research/2026-08-16-rust-webgpu-text-ecosystem.md:81-88,117-134`).

SDF/MSDF is excluded: no accepted primary-source study places it in either required stack. Introducing it requires a separate research decision, not a third unbounded prototype.

**Pre-commitment.** The selected production realization must pass every mandatory topology, pixel, transform, zoom, size, resource, fault, device-loss, and security case. A diagnostic may document why a rejected candidate failed. In production, an unsupported diagnostic is permitted only for a color or bitmap glyph class explicitly declared optional in the capability; it cannot waive any mandatory corpus case. If no candidate passes, integration stops. Investigation and ADR mechanics do not alter the capability's mandatory behavior.

### 10. Failure is diagnostic and preservation-first

**Proposed.** Validation, resolution, font parsing, realization, allocation, and device errors have stable machine-readable diagnostics. A failed or stale result cannot mutate authored state, replace the last valid resolved result, or partially present a frame. Missing/substituted font states remain visible rather than silently appearing intentional.

**Alternatives considered.** (a) Always draw tofu/embedded Inter silently — plausible for continuity; loses identity and layout fidelity. (b) Fail the entire document load for any unavailable font — deterministic but unnecessarily destroys editability. The contract instead distinguishes authored validity from resolvability and applies an explicit policy after the font gate.

No numeric safety limit is selected here. The abuse corpus records fixture, environment, termination, CPU/memory/GPU behavior, and diagnostic; policy limits follow measured evidence and security review.

### 11. Active changes remain owners of their domains

- `authored-layout`: owns general layout semantics and intrinsic measurement protocol; dynamic text supplies text measurements and declares dependency keys.
- `vector-path-rendering`: owns the Vello/vector path and current renderer protocol lineage; text does not repurpose authored path identity for glyphs.
- `declarative-scene-api`: its existing plain-text-and-fill primitive remains a bounded compatibility passthrough at that change's existing renderer-protocol contract. It does not consume this change's resolution, shaping, fonts, caret geometry, or authored semantics. Semantic expansion is blocked until a separate approved update depends concretely on both the approved resolved-text packet contract and reconciliation with the then-current renderer protocol version.
- `canvas-actions-parity-tranche-2`: coordinates tool/action exposure; it cannot bypass text commands or invent DOM-owned editing.
- `universal-point-editing`: shares coordinate/hit-test authority and overlay concerns; text caret geometry extends, rather than duplicates, those authorities.
- `cms-foundation`: may provide dynamic logical content through validated commands/resolution inputs; it does not own ranges, shaping, containers, editing, or renderer semantics.

If an active change conflicts with these ownership boundaries, implementation pauses for OpenSpec reconciliation rather than duplicating a subsystem.

## Risks / Trade-offs

- **A generic resolved contract becomes a speculative permanent abstraction** → Limit it to corpus-observed semantic outputs, select one engine, and remove candidate adapters.
- **Latin success masks Unicode failure** → Complex-script, bidi, line-break, emoji, variation, and missing-font fixtures are selection gates, not follow-up coverage.
- **Font names silently map to different bytes** → Surface deterministic byte/version identity or explicit non-deterministic/substituted state.
- **Text and Taffy create an unstable cycle** → Decide pass ownership and termination before authored container integration; retain last valid result and full-resolution oracle.
- **IME bypasses commands** → Mutation audit and cancellation/undo corpus prove adapters cannot commit directly.
- **Range choice becomes irreversible too early** → No range command/schema before unit, normalization, affinity, and conversion ADR.
- **Two production paths survive the bake-off** → Selection requires one ordinary path and dated removal criteria for prototypes/compatibility code.
- **Malformed fonts exhaust WASM/GPU resources** → External-byte production gate requires abuse fixtures, stable diagnostics, preservation, and security approval.
- **Caches become identity or stale across device/font changes** → Full rebuild equivalence and device-loss/font-removal fixtures remain mandatory.
- **Optimization starts from anecdotes** → No budget or cache commitment before representative fixtures, recorded environments, cold/warm states, and distributions.

### Pre-mortem signals

The design has failed if measurement, hit testing, caret, and pixels cite different geometry revisions; a durable edit occurs without a command; cross-browser font bytes differ without diagnostics; malformed or oversized font execution begins without approved enforceable containment; a malformed font changes canonical bytes or partial pixels; a selected production path reaches mandatory content only by reporting unsupported; declarative-scene text silently gains dynamic-text semantics; two engine feature flags can render the same production node indefinitely; or an engine upgrade forces unrelated document migrations because library types leaked into authored schema.

## Migration Plan

1. **Prerequisite slice — complete:** the schema decision in [ADR 0023](../../../docs/architecture/adrs/0023-canonical-dynamic-text-content.md) and the separately bounded contour correction in [ADR 0024](../../../docs/architecture/adrs/0024-correct-embedded-inter-contours.md) are implemented with retained red/green, canonical-byte, source-font, synthetic reconstruction, reconstructible-source, and controlled browser-pixel evidence. Tasks 2.5–2.7 are complete; neither decision selects shaping, layout, full text fidelity, or final text realization.
2. **Investigation only:** approve enforceable abuse-harness containment before executing malformed or oversized fonts; then build the shared corpus and both pinned candidate adapters outside production and record blockers, security behavior, dependency/license, and artifact evidence. Blockers reject candidates rather than qualifying production paths.
3. **Contract gate:** approve range/font/container/resolution ownership and applicable ADRs. Existing correctly-kinded plain strings and the canonical empty string remain canonical; no shaped data migration occurs.
4. **Read-only adoption:** select one engine and one bounded font fixture, resolve existing strings, and prove measurement/hit/render coherence while preserving protocol and last-valid behavior unless an approved ADR changes them.
5. **Editing adoption:** enable kernel-owned plain editing and IME only after geometry and platform corpus pass.
6. **Authored integration:** add the smallest approved typography/container schema and deterministic migration; coordinate with `authored-layout` and persistence owners.
7. **Later expansion:** scoped rich intent/interchange, then measured caching/realization refinement, each behind its own gates.

Rollback before the v5 schema correction removes investigation/read-only integration and returns to the ADR 0020 foothold without document migration. Once v5 documents are persisted, rollback cannot relabel them as v4: it requires the schema ADR's explicit compatibility/forward-backward plan, and old readers continue rejecting the unknown version rather than dropping required text. Later additive authored-schema rollback disables authoring and ignores supported optional fields while preserving their serialized data; unknown versions remain rejected.

## Open Questions

These are explicit decision gates, not implementation guesses:

1. Which candidate passes the browser/WASM, Unicode, font, security, license, and artifact gates?
2. Which durable range unit, normalization, and affinity representation passes conversion fixtures?
3. Which font byte sources and identities are portable, persistable, licensable, and safely bounded?
4. Which authored text-content overflow values fit the fixed `Fixed | Hug | Fill` mapping, and how do text resolution and authored layout terminate their passes without changing ownership?
5. What coarse resolved-text API and stale-result policy serve kernel consumers without chatty crossings?
6. Which realization passes topology, quality, color/bitmap, resource, and device-loss evidence: vector or atlas?
7. Which browser/platform IME and clipboard matrix defines the first supported plain-editing milestone?
8. Which interchange targets, if any, belong in the first post-plain-text tranche, and at what declared fidelity?

Each answer that moves an ADR-listed boundary requires the ADR before product implementation; none is answered by this proposal alone.
