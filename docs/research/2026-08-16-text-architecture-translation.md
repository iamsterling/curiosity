# Crafty text architecture translation

**Date:** 2026-08-16
**Contract:** `text-architecture-translation`
**Decision served:** translate the competitive capability evidence, the checked
Rust/WebGPU ecosystem, and Crafty's current substrate into bounded architecture
options and decision gates.
**Non-decision:** this report does not select a library, authored schema, range
unit, font policy, resolved representation, render protocol, cache, or performance
budget. It authorizes no implementation, OpenSpec change, or ADR.

## Invariant and evidence frame

The user behavior at stake is **editable text that remains the same logical work
after layout, rendering, save/reopen, undo/redo, font failure, and a different
frontend**. The load-bearing invariant is that the authored document remains
canonical: logical content and typographic intent are durable; shaped glyphs,
line boxes, carets, outlines, bitmaps, and atlas allocations are disposable.
Text edits must be validated, invertible kernel commands, while React/DOM may
only adapt platform input. Rendering must neither mutate authored state nor learn
components, history, tools, or other product semantics.

A proposal that makes DOM state, a Rust editor buffer, shaped glyphs, or an atlas
the canonical text value would violate enforced invariants and is rejected.

Evidence labels in this report are:

- **Current:** directly established in Crafty source at the inspected HEAD.
- **Transitional:** live compatibility behavior that should not acquire new text
  semantics.
- **Target:** already documented architectural direction, not current behavior.
- **Proposed:** an option or investigation direction from this translation, not
  an approved design.

Competitor evidence establishes recurring capability problems, not competitors'
private implementations. Ecosystem source establishes available responsibility
boundaries, not suitability for Crafty. Upstream performance anecdotes are not
Crafty budgets.

### Current missing oracles that constrain this translation

**Current:** existing tests do not establish either of these substrate guarantees:

1. text-kind/type validation at persisted-document and command boundaries. The
   required oracle submits invalid number and boolean text payloads and proves
   stable rejection before mutation, with unchanged authored document and history;
2. glyph contour-topology or pixel fidelity. The required oracle compares
   multi-contour glyphs against source-outline contour count, first anchors,
   closure, and winding, then compares browser pixels across controlled sizes and
   transforms. The current retained-point/path-count witness cannot support a
   faithful-outline claim.

## Assumptions checked

| Assumption | Finding |
|---|---|
| Protocol is v5 and TypeScript constructs product frames. | **Current, confirmed.** `DRAW_PROTOCOL_VERSION` is 5 and includes `"text"` (`packages/scene-renderer/src/draw-protocol.ts:4-34`). The editor projects text in `textCommandFor`/`projectPathCommands` and composes the complete frame before `renderFrame` (`packages/editor/src/ui/editor/harness.ts:390-415,442-525`; `packages/editor/src/ui/editor/canvas-stage.tsx:390-436`). |
| Crafty's Vello path derives lossy path geometry from Inter but does not shape or lay out text. | **Current, confirmed.** Rust embeds Inter, iterates Unicode scalar values one at a time, maps through `cmap`, and advances through `hmtx`. Its outline adapter drops each contour's first anchor, records no `close` boundary, and concatenates all contours of a glyph into one open packet subpath (`packages/scene-renderer/rust/src/text.rs:44-101,127-178`). There is no GSUB/GPOS, bidi, fallback, cluster map, or line layout, and current output is not evidence of contour-topology or pixel fidelity. |
| A text-engine choice and a glyph-rendering choice affect different boundaries. | **Confirmed.** Parley/cosmic-text own Unicode shaping/layout and editing geometry to different degrees; Vello and Glyphon consume positioned results and realize/compose glyphs by different routes ([ecosystem report](2026-08-16-rust-webgpu-text-ecosystem.md#responsibility-diagram-not-an-architecture-proposal), lines 30-50). Choosing layout determines resolved geometry, hit testing, measurement and font-policy inputs. Choosing vector versus atlas realization primarily changes renderer resources, packet shape and GPU composition. They should be gated separately. |
| Editing semantics cannot be delegated to React or DOM state. | **Current invariant, confirmed.** Durable mutations are `DocumentCommand`s and the current whole-string path is `set-property` (`packages/editor/src/kernel/commands.ts:53,72-79`). The harness states that all mutation flows through commands/transactions (`packages/editor/src/ui/editor/harness.ts:528-534`). Keyboard code only treats native inputs as text-entry owners; no composition path exists ([substrate report](2026-08-16-crafty-text-substrate-analysis.md#capability-matrix), lines 75-76). |
| Crafty's operative boundary is “Rust owns what to draw; TypeScript owns the GPU.” | **Not current.** This phrase is stale. TypeScript composes the packet; Rust decodes it, realizes geometry, owns Vello/wgpu device/surface/render/present, and commits the presented frame (`docs/architecture/renderer.md:27-33,187-235`; `docs/architecture/wasm-boundary.md:64-81`). The applicable constraint is **TypeScript owns product projection and kernel semantics; Rust owns draw realization and the GPU; one coarse packet crosses per frame**. Options below are compared against that actual boundary. |

## Capability expectation to Crafty responsibility chain

The competitor synthesis supports the left column only as observed capability
pressure. The final column classifies the kind of future decision; it is not a
decision itself.

| Observed capability expectation | Technical responsibility | Available ecosystem ownership | Current Crafty seam and source | Required change category |
|---|---|---|---|---|
| Logical content and scoped intent outlive rendering. | Authored text, character/paragraph scope, range normalization, versioning. | Neither Vello nor Glyphon owns authored text. Parley/cosmic-text consume logical text and styles. | `DocumentNode.text?: string` is the only text field; canonical serialization recursively sorts authored JSON (`packages/editor/src/kernel/document.ts:126-148,681-693`). | **Schema + ADR/OpenSpec** for typography/ranges; preserve plain-string migration and canonical ordering. |
| Edits are undoable, agent/human-equivalent operations. | Insert/delete/replace/style commands, inverse construction, transaction and coalescing policy. | Parley and cosmic-text offer editing utilities, but not Crafty's history or document invariants. | Only whole-value `set-property:text` exists and is invertible, but its property/value union is not discriminated and document validation does not enforce the text-kind/type contract. Runtime number or boolean payloads can therefore mutate the document (`packages/editor/src/kernel/commands.ts:53,1152-1161`; `packages/editor/src/kernel/document.ts:499-542`). | **Immediate validation prerequisite**, then kernel command design + ADR if history granularity changes. Rust utility output may inform geometry but cannot own commits. |
| Character and paragraph scopes differ. | Paragraph inputs, inline runs, cascade/normalization, offset unit. | Both layout stacks accept style/layout inputs; neither selects Crafty's durable representation. | No run, paragraph, or text-specific validation exists (`packages/editor/src/kernel/document.ts:499-542`). | **Schema + migration + ADR.** Offset unit and normalization are explicit gates, not library defaults. |
| Container policy is authored behavior. | Intrinsic/fixed/wrapped sizing, width constraint, overflow, line boxes, layout feedback. | Parley and cosmic-text provide line layout; Vello/Glyphon do not. | Text intrinsic measurement returns the existing box and `LAYOUT_INTRINSIC_FALLBACK`; resolved boxes are disposable (`packages/editor/src/kernel/layout.ts:15-35,98-156`). | **Authored semantics + resolution integration.** Must define the text/layout dependency cycle before implementation. |
| Dynamic content causes relayout. | Dependency keys, affected-scope invalidation, full-rebuild oracle. | Parley and cosmic-text can recompute buffers/layouts; cache policy remains caller-owned. | Revision changes rebuild projection; full packets are current; text has no cache (`packages/editor/src/kernel/kernel.ts:168-209,237-248`; `packages/editor/src/ui/editor/harness.ts:3870-3899`; `packages/scene-renderer/rust/src/text.rs:111-193`). | **Resolved dependency/invalidation design.** No cache is authoritative; full resolution remains the correctness reference. |
| Font state is more than a family name. | Byte provenance and identity, face match, readiness, fallback/substitution, variations/features, licensing/embedding, and safe parsing limits. | **Normative fact:** CSS Font Loading can construct `FontFace` from URL or binary data and exposes worker font sets. **Inference, not an API requirement:** deterministic Crafty shaping would require explicit provisioning of shaper-readable bytes plus deterministic identity/fallback inputs. Fontique is the Parley-side resolver but web-font work is evolving; cosmic-text uses `FontSystem`/fontdb. | One trusted OFL Inter file is compiled into WASM; no browser/font service, external font parser path, or diagnostics exist (`packages/scene-renderer/rust/src/text.rs:6-20`; `packages/scene-renderer/rust/Cargo.toml:19-23`). | **Font-resource architecture + licensing ADR + security/policy gate.** Imported, shared, project, and URL font bytes are untrusted input; provenance and licensing alone do not bound parser/resource risk. Byte identity/fallback must precede any cross-machine determinism promise. |
| Correct complex text needs shaping, bidi, segmentation and line breaking. | Itemization, bidi, shaping, clusters, breaks, glyph/line metrics. | Parley composes ICU4X, HarfRust, Skrifa and Fontique; cosmic-text composes Unicode modules, HarfRust/Skrifa/fontdb and optional swash. | Current scalar-by-scalar ladder has none (`packages/scene-renderer/rust/src/text.rs:127-178`). Existing disposable resolution seam is `resolveScene` → resolved document → layout (`packages/editor/src/kernel/component-resolution.ts:15-45,143-190`; `packages/editor/src/kernel/layout.ts:130-156`). | **Text-resolution service/IR decision + ADR.** This is not merely a renderer swap. |
| Glyphs must render with design-tool transforms and zoom. | Glyph realization, paint, decoration, clipping, GPU composition. | Vello accepts already-positioned glyphs/vector paths; Glyphon realizes cosmic-text glyphs into mask/color atlases and draws quads. | Rust currently converts glyphs to ordinary Vello path geometry and presents on its module-owned GPU (`packages/scene-renderer/rust/src/vello_encoder.rs:312-343,418-438`; `packages/scene-renderer/rust/src/wgpu_present.rs:1017-1065,1286-1429`). | **Renderer/protocol ADR** if the packet or JS/WASM ownership changes. Vector replacement is smaller than introducing an atlas pass, but neither chooses shaping. |
| Caret, range, IME, bidi and accessibility are separate correctness surfaces. | Browser input adapter; composition lifecycle; logical selection/affinity; visual caret/range geometry; accessibility projection. | Parley/cosmic-text expose selection/edit helpers to differing degrees; neither supplies browser IME/a11y integration. | `focusedId` is unused; no `beforeinput`/composition effects exist; tools have a closed effect vocabulary (`packages/editor/src/kernel/kernel.ts:10-24`; `packages/editor/src/kernel/interaction.ts:82-187`; `packages/editor/src/ui/editor/keyboard-bindings.tsx:20-68`). | **Kernel editing mode + thin platform adapter.** Composition is ephemeral; committed edits are commands. React must not own text. |
| Caret placement and text selection need logical geometry, not ink or box guesses. | Point→line/cluster hit, affinity, range rectangles, node broad phase. | Both layout engines can expose laid-out runs/cursors; Vello/Glyphon cannot reconstruct logical offsets from pixels. | `documentHitTest` treats text as its generic node box; a second legacy index remains live (`packages/editor/src/kernel/interaction.ts:556-625`; `packages/scene-model/src/spatial-index.ts:24-84`). | **Kernel hit-test extension.** It must consume one disposable resolved-text geometry service, not create a third hit-test implementation. |
| GPU work must be reusable but never become identity. | Glyph/path cache key, generations, eviction, device-loss rebuild, invalidation. | Glyphon evidences mask/color atlases and generation/LRU eviction; Glifo evidences an experimental Vello-side cache. | Text reparses/tessellates every frame; GPU resources are module-owned and last-valid presentation is protected (`packages/scene-renderer/rust/src/text.rs:111-193`; `packages/scene-renderer/src/failure-policy.ts`; `packages/scene-renderer/rust/src/wgpu_present.rs:1017-1065`). | **Renderer cache design**, after measured fixtures. Keys include resolved font/glyph/variation/scale inputs, never node identity alone. |
| Save/export fidelity has logical, editable and pixel levels. | Canonical native persistence, font references/resources, output-specific embedding/subsetting/outlining and diagnostics. | The checked libraries do not define Crafty's interchange policy. | Native `.ui` stores the canonical document; no design-output export exists (`packages/scene-store/src/index.ts:370-410,503-520,568-592`). `.pen` import uses a lossy size heuristic (`packages/pen-import/src/index.ts:546-590`). | **Persistence/schema ADR** for font references/assets; separate future export OpenSpec. “Export succeeds” is not a fidelity criterion. |
| Missing/substituted/stale resources remain visible failures. | Stable diagnostics, visual degradation, retry/invalidation, last-valid frame. | Both stacks expose errors/states but Crafty must define codes and policy. | Renderer failures preserve authored state and last valid packet (`packages/scene-renderer/src/failure-policy.ts`; `packages/scene-renderer/rust/src/wgpu_present.rs:1286-1429`). Current missing glyphs silently advance (`packages/scene-renderer/rust/src/text.rs:140-149`). | **Diagnostic vocabulary + failure-policy design.** Silent fallback that looks intentional is rejected. |

## Architectural options

All options keep the kernel as the owner of logical edits and history, keep
authored intent distinct from resolved geometry, and retain a coarse boundary.
The unresolved common question is how a Rust text resolver returns line/cluster
geometry to kernel-side layout and hit testing without turning the render packet
into the only text API. A renderer-only engine hidden inside `render_packet`
cannot satisfy measurement, caret or hit testing.

### Option A — Parley-family resolution with Vello vector glyph composition

**Proposed shape.** A coarse Rust/WASM text-resolution capability uses a pinned
Parley-family stack for font resolution, Unicode analysis, shaping, line layout,
and editing geometry. Its disposable result is available above packet projection
for measurement and kernel hit testing. The renderer consumes positioned glyphs
and realizes them through Vello's glyph/vector path, preserving the current
single vector composition line.

**Why plausible.** This is the directly evidenced Linebender split: Parley's
example produces positioned runs and independent cursor/selection geometry for
Vello. Crafty already owns Vello 0.9 and routes its topologically lossy Inter
path approximation through the ordinary path pipeline. A future, fidelity-tested
vector realizer could minimize change to the module-owned GPU and avoid a second
text-specific render pass; the current approximation is not evidence that it can.

**Why it loses.** Parley/Fontique/Glifo remain evolving 0.x surfaces; tracked
gaps include direction overrides and layout/editor behavior. Browser font-byte
registration/fallback still needs qualification. Vector glyph realization may
have different zoom, small-size, color/bitmap-font and cache trade-offs from an
atlas; no transferable measurement resolves them. A resolver result flowing
back to TypeScript requires a new coarse WASM service even if the per-frame
render packet remains one-way.

| Dimension | Assessment |
|---|---|
| Boundary impact | **Medium.** Natural fit for Rust/Vello GPU ownership; new non-render text-resolution boundary is required for geometry consumers. A future positioned-glyph packet would be a protocol decision. |
| Quality potential | High for scalable vector outlines and transform continuity; current evidence does not prove small-size/subpixel or full color-font parity. |
| WASM viability | Libraries are Rust/WASM-oriented, but Fontique web-font lifecycle and actual browser builds must be prototyped with pinned bytes. |
| Determinism | Possible only relative to pinned font bytes, Unicode/library versions, fallback order, features, variations, language/direction and width—not from choosing Parley itself. |
| Licensing | Checked crates are MIT/Apache-2.0 dual licensed; fonts retain separate licenses. Lockfile and asset review remain mandatory. |
| Maturity | Vello 0.9 / Parley 0.10 are 0.x; Glifo is explicitly experimental and is not required for an initial direct Vello glyph path. |
| Migration cost | Lower renderer disruption; substantial resolution, font, schema/editing, and geometry-return work remains. |
| Principal failure modes | Hidden Parley gaps become product semantics; Vello output looks good for Latin but fails complex/color corpus; resolver/render font versions drift; vector glyph regeneration becomes unmeasured cost. |

### Option B — cosmic-text resolution with Glyphon raster-atlas composition

**Proposed shape.** A coarse Rust/WASM text-resolution capability uses
cosmic-text for font system, shaping/layout, cursor geometry and optional editing
utilities. Swash realizes mask/color glyph images; Glyphon integrates explicit
atlases and textured-quad composition into the module-owned wgpu frame.

**Why plausible.** The traced stack is coherent and source-evidenced:
cosmic-text owns buffers/layout, Swash owns rasterization, and Glyphon owns atlas
packing/usage and a wgpu pass. Separate mask/color atlases and explicit
generation/LRU behavior provide a concrete resource-lifetime model. Rust already
owns Crafty's device, so no GPU resource must cross into TypeScript.

**Why it loses.** It introduces a renderer path beside Vello scene composition:
atlas textures, uploads, quads, pass ordering, clipping, device-loss rebuild and
cache pressure all become Crafty responsibilities. Glyphon main/release versions
lag and must be pinned deliberately. Raster scale buckets and zoom transitions
must be measured; an atlas-full condition needs explicit degradation. As with
Option A, browser IME/a11y and Crafty command semantics remain outside the stack.

| Dimension | Assessment |
|---|---|
| Boundary impact | **High.** Resolution still needs a coarse geometry service; renderer/protocol and module GPU composition likely change to carry or derive positioned glyph instances and font resources. |
| Quality potential | Strong evidence for hinted/subpixel-capable mask and color bitmap realization; no evidence guarantees browser/platform pixel identity or sufficient atlas sizing. |
| WASM viability | Rust/wgpu stack is compatible in principle; exact wgpu versions, browser build, texture limits and font registration require a prototype. |
| Determinism | Same pinned-input requirements as A; raster output may additionally vary with device/scale/compositing even when geometry is stable. |
| Licensing | cosmic-text/Swash are MIT/Apache-2.0; Glyphon is MIT/Apache-2.0/Zlib. Font licenses remain separate; normal dependency review is still required. |
| Maturity | cosmic-text is active 0.x; Glyphon inspected main declared 0.12 while latest checked GitHub release was 0.9. Pin ambiguity is a gate. |
| Migration cost | Highest renderer cost: second composition machinery, cache lifecycle and parity tests in addition to all common text work. |
| Principal failure modes | Atlas churn/overflow, stale generations after font/device changes, pass-order divergence from Vello content, scale-bucket shimmer, color glyph inconsistency, dependency version mismatch. |

### Option C — engine-neutral resolved-text contract, one production realizer

**Proposed shape.** First decide and fixture a Crafty-owned disposable resolved
text contract—logical clusters/affinity, lines, positioned glyphs, font-resource
identity and diagnostics—then evaluate A and B behind test adapters. Ship exactly
one resolution stack and one ordinary glyph realizer when evidence is sufficient.
The contract is not authored and does not promise interchangeable engines forever.

**Why plausible.** Both checked stacks converge on positioned glyphs plus line/
cursor geometry before GPU composition. Crafty already has distinct authored,
resolved and packet seams, and its kernel needs engine-neutral answers for layout
and hit testing. A bounded bake-off can compare the same corpus without forcing a
premature schema or per-frame protocol commitment.

**Why it loses.** A lowest-common-denominator IR can erase engine-specific
capabilities or become a speculative abstraction. Supporting two production
engines would recreate Penpot's measured migration tax and Graphite's dual-path
risk. This option is credible only as an **investigation and ownership strategy**,
not as a permanent pluggable-engine product requirement.

| Dimension | Assessment |
|---|---|
| Boundary impact | Medium during investigation; eventual impact equals A or B. The resolved contract and any new WASM call are ADR-worthy if adopted in product. |
| Quality potential | Enables like-for-like geometry and visual fixtures; guarantees nothing until one full stack passes them. |
| WASM viability | Lets a no-product-code harness qualify actual wasm builds, byte provisioning and output before integration. |
| Determinism | Makes determinism inputs explicit and compares stable geometry separately from device pixels. |
| Licensing | No library adoption follows from the contract; each prototype still needs pinned-license review before product use. |
| Maturity | Reduces commitment to unstable APIs, but the contract itself must avoid pretending unresolved offset/font policy is settled. |
| Migration cost | Lowest cost of a wrong early engine choice; some evaluation work is discarded by design. |
| Principal failure modes | Over-generalized IR, accidental dual production path, prototype result promoted without browser/IME/font evidence, hidden conversion cost. |

### Non-binding recommendation

**Proposed:** pursue Option C as a time-bounded investigation, with Option A as
the first integration hypothesis and Option B as the required contrasting
prototype. This is not a vendor commitment. A is first because it preserves the
already-adopted Vello composition line and tests the smallest coherent renderer
change; B remains necessary because it represents the strongest evidenced atlas
alternative and exposes costs A cannot measure.

Do not pre-commit the authored schema or protocol to either library's public
types. End the investigation by selecting one production realizer or explicitly
stopping; do not ship parallel legacy/new text paths.

Both candidates must cross the same font-security boundary. Any parser, shaper,
or realizer receiving imported, shared, project, or URL font bytes handles
untrusted input. A candidate that renders valid fonts but cannot bound malformed
or oversized input behavior is not production-qualified, regardless of font
provenance or license metadata.

**Ledger reconciliation:** earlier “leading option” guidance for
cosmic-text/rustybuzz and “strategic path/adopted” guidance for Parley/Skrifa are
historical and superseded as selection advice. Neither engine leads this
investigation. Layout-stack selection and vector-versus-atlas realization are
independent open gates. SDF/MSDF is not part of either traced candidate and is not
smuggled into the realization gate without a separate primary-source study.

**Rejected shortcuts:**

1. Treating Vello, Glyphon, WebGPU, `ttf-parser`, Parley or cosmic-text as “the
   text engine” without assigning every responsibility.
2. Keeping shaping hidden only inside `render_packet`; the kernel then cannot
   measure, place carets, or hit-test the same geometry.
3. DOM/Canvas measurement or DOM content as canonical state.
4. Persisting shaped runs, line boxes, glyph outlines/bitmaps, fallback results,
   cache keys or atlas slots.
5. Extending transitional `Scene` with text semantics.
6. Per-glyph JS/WASM calls or a second GPU owner.
7. Implementing range editing before cluster/affinity geometry exists.
8. Choosing SDF/MSDF: no checked source establishes it in either required stack.
9. Silently substituting fonts/missing glyphs or claiming cross-machine
   determinism from family names.
10. Using competitor appearance, upstream anecdotes or existing rectangle/path
    budgets as text performance targets.

## Sensitivity and trade-off points

### Sensitivity points

- **Font-byte policy:** packaged/project fonts versus browser/system references
  changes determinism, licensing, offline behavior, interchange and WASM loading.
- **Offset unit and affinity:** changing after commands/runs exist is a schema,
  clipboard and collaboration migration, not a local refactor.
- **Container semantics:** intrinsic, width-constrained and fixed-box behavior
  determines the text↔Taffy dependency direction and whether height is authored
  or resolved.
- **Resolution placement:** the kernel needs synchronous-looking geometry for
  hit testing while WASM/worker work may be asynchronous; stale-result policy is
  therefore load-bearing.
- **Glyph realization:** vector versus atlas mostly changes GPU/cache behavior,
  but color/bitmap fonts and small-size quality may force a bounded secondary
  representation within the selected renderer.
- **Accessibility target:** a canvas-only renderer still needs a semantic input
  and accessibility surface; no Rust library supplies it.

### Trade-off points

- One integrated Rust stack reduces duplicate algorithms but increases WASM
  dependency/API exposure.
- A Crafty-owned resolved contract protects kernel/renderer independence but must
  not become a permanent abstraction for hypothetical engines.
- Vector composition reuses Vello and scales continuously; atlas composition
  offers explicit raster/cache behavior but adds resource and pass complexity.
- Deterministic geometry can be a product guarantee under pinned inputs;
  pixel-identical GPU output across all devices is a separate and likely narrower
  claim.
- Full rebuild is simpler and remains the oracle; incrementality is justified only
  after representative mutation fixtures show where work is spent.

## Minimum coherent capability slices and dependency order

Each slice is a capability boundary, not an implementation recipe. Later slices
depend on the earlier evidence; schema/protocol-changing slices require approved
OpenSpec/ADR artifacts first.

### Prerequisite A — close current text mutation validation

**Intent:** make the existing whole-value text mutation satisfy the invariant it
is currently documented to satisfy before richer text commands build on it.

**Binary acceptance evidence:**

- document deserialization and command dispatch reject `text` on an invalid node
  kind and reject non-string text payloads, including at least number and boolean
  values, with stable diagnostic codes;
- each rejected command leaves authored bytes, document revision, and history
  unchanged; it cannot first fail later at packet decode;
- a valid whole-string replacement remains exactly invertible and no-op honest.

### Slice 0 — executable evidence harness (no product integration)

**Intent:** compare both required stacks with the same pinned fonts and text
inputs before selecting ownership or public types.

**Binary acceptance evidence:**

- Both candidates compile for the intended browser WASM target or fail with a
  recorded diagnostic and version pin.
- The corpus covers Latin shaping, combining marks, emoji/ZWJ, Arabic/Hebrew
  mixed direction, Indic, CJK, line breaks, missing glyph, variations and color/
  bitmap representation where supported.
- The realization corpus includes multi-contour and hole glyphs such as `O`, `B`,
  and `8`; it compares contour count, first anchors, closure, and winding with the
  parsed source outline and records golden browser pixels at multiple sizes and
  transforms. Point-count or “some path encoded” checks are not fidelity oracles.
- Recorded outputs separate logical clusters/affinity, line/glyph geometry,
  diagnostics, vector/raster realization and browser pixels.
- Repeated runs with identical bytes and inputs compare geometry deterministically;
  browser/device pixel observations record their environment and are not promoted
  to universal guarantees.
- License metadata and shipped WASM/dependency deltas are recorded; no numeric
  pass budget is invented.
- Bounded malformed and oversized-font fixtures exercise every candidate parser
  path used for imported, shared, project, and URL fonts. They produce stable
  diagnostics, no authored-state mutation, no partial presentation, and bounded
  CPU, memory, and GPU/resource behavior measured against the fixture and
  environment; this criterion intentionally invents no numeric budget.

### Slice 1 — text responsibility and font-resource contract

**Intent:** decide authored inputs, resolved outputs, font identity/readiness/
fallback states, offset unit and owner boundaries before product integration.

**Depends on:** Prerequisite A, Slice 0, an approved OpenSpec design, applicable
ADRs, and the security/policy gate for any external font-byte path.

**Binary acceptance evidence:**

- Every row in the responsibility map has exactly one semantic owner and named
  inputs/outputs; browser adapter and renderer are not canonical owners.
- Font identity includes byte/version provenance or an explicit non-deterministic
  state; missing/substituted/stale cases have stable diagnostic codes.
- The font contract labels imported, shared, project, and URL bytes as untrusted,
  names parse/size/resource limits and failure ownership, and keeps licensing and
  provenance review distinct from security qualification.
- Range unit, grapheme behavior, bidi affinity and conversion boundaries are
  specified against corpus examples.
- Resolved glyph/line/cache data is explicitly non-serializable and rebuildable.

### Slice 2 — read-only resolved text with one embedded/pinned face

**Intent:** replace the scalar advance ladder with correct disposable shaping and
line/cluster geometry for existing plain strings, without claiming rich editing
or arbitrary fonts.

**Depends on:** selected engine/ownership from Slice 1. Glyph realizer can remain
vector or become atlas only according to the approved renderer decision.

**Binary acceptance evidence:**

- Existing plain text survives native save/reopen byte-canonically; no shaped
  output is persisted.
- The same resolved geometry supplies drawing bounds, intrinsic measurement and
  text-level hit queries; current node-box broad phase remains allowed.
- Complex-script corpus produces cluster maps and stable diagnostics rather than
  scalar guesses or silent missing-glyph advances.
- Renderer failure preserves authored state and last valid frame.
- Malformed, oversized, or unsupported font data cannot produce a partially
  presented frame; failure has a stable diagnostic and preserves the last valid
  presentation.
- Full resolution is the correctness oracle; any cache gives byte-equivalent
  results after content, width, font, feature and device-loss invalidations.

### Slice 3 — kernel-owned plain-text editing

**Intent:** add caret/range editing and IME while keeping composition ephemeral and
committed content in validated commands.

**Depends on:** Slice 2 cluster/line/affinity geometry and the authoritative
kernel hit-test path.

**Binary acceptance evidence:**

- Insert/delete/replace commands are validated, exactly invertible, no-op honest,
  and used identically by human and agent callers.
- One declared typing/composition action has one specified history outcome;
  undo/redo restores logical text but not ephemeral composition/caret state.
- Composition start/update/commit/cancel, grapheme deletion, bidi caret affinity,
  range selection and clipboard behavior pass a platform-qualified corpus.
- Pressing tool shortcuts while text input owns focus inserts text or is suppressed
  according to the editing state; no DOM mutation bypasses the kernel.
- Point-to-caret uses the existing kernel hit-test authority plus resolved text
  geometry; no third coordinate/hit-test implementation appears.

### Slice 4 — authored typography, containers and fallback

**Intent:** introduce the smallest agreed typographic intent and container policy,
then make font-dependent measurement participate in layout.

**Depends on:** approved schema migration, font policy, and resolution ordering.

**Binary acceptance evidence:**

- Old schema documents migrate deterministically and unknown versions remain
  rejected.
- Authored fields validate; canonical serialization is stable; shaped values and
  font discovery results are absent from persisted JSON.
- Intrinsic, constrained and overflow fixtures have specified boxes/lines and
  feed the same geometry to Taffy measurement, selection and rendering.
- Content, width, font readiness, fallback, locale/direction, feature and
  variation changes invalidate all and only the declared dependency scope, with
  full rebuild equivalence.
- Missing/substituted fonts remain editable according to an explicit policy and
  always surface diagnostics.

### Slice 5 — scoped rich intent and interchange ladder

**Intent:** add inline/paragraph styling only after plain editing, offset semantics
and font/container behavior are proven.

**Depends on:** Slice 4 and a separate schema/command design.

**Binary acceptance evidence:**

- Run/paragraph normalization is total, canonical and command-invertible across
  split/merge, paste, component override and undo fixtures.
- Non-BMP, combining and ZWJ boundaries cannot create invalid ranges.
- Native round-trip preserves logical content and intent; each external format is
  classified independently as logical, editable and/or pixel-fidelity output.
- Unsupported fonts/features produce diagnostics, never silent intentional-looking
  substitutions.

### Slice 6 — measured caching and realization refinement

**Intent:** optimize only the selected production path after correctness fixtures
exist.

**Depends on:** representative documents and mutation traces from prior slices.

**Binary acceptance evidence:**

- Measurements report environment, fixture, cold/warm font/cache state and a
  distribution for layout, realization/upload, paint, memory and eviction.
- Cache keys cover every geometry/bitmap-affecting input; device loss and font
  removal rebuild safely; atlas-full or realization failure has an explicit
  diagnostic/degradation.
- Cached and full-rebuild outputs are equivalent on the conformance corpus.
- Any numeric budget is proposed only from these measurements in a later decision.

## Decision gates and records

### OpenSpec gates

OpenSpec is required before product work that introduces any of the following:

1. richer authored text, paragraph/run/container/font records or migrations;
2. new text commands, editing state/effects, IME adapter behavior or undo
   coalescing semantics;
3. a resolved-text service/IR, text measurement integration, font service,
   fallback diagnostics, untrusted-font limits/failure policy or invalidation graph;
4. renderer packet changes, positioned-glyph resources, atlas composition or new
   WASM exports;
5. persistence/font assets or visual/live-text export.

### ADR gates

Repository policy makes these decisions ADR-worthy:

- authored/resolved boundary and any non-additive schema/range-unit choice;
- command/transaction/history semantics for text editing;
- Rust/TypeScript ownership and a new coarse WASM resolution boundary;
- renderer protocol or JS/WASM/GPU ownership change;
- text/layout engine and glyph realization selection;
- font persistence/identity/fallback/embedding policy;
- font parsing/security policy when external font bytes enter the process;
- dependencies whose license or shipped size affect the core;
- introducing or reversing a dual-renderer/migration policy.

One ADR need not bundle all choices. In particular, **layout engine selection and
glyph realization should remain separate decisions** unless measured evidence
shows they cannot be decoupled.

### Security and font-policy gate

Before any imported, shared, project, or URL font reaches a production parser,
the owning OpenSpec must include a threat model and abuse fixtures, and the
applicable security review must approve the trust boundary and failure policy.
The gate is binary: malformed and oversized inputs have stable diagnostics,
preserve authored state and the last valid presentation, never expose a partial
frame, and demonstrate bounded CPU, memory, and GPU/resource behavior under a
recorded fixture and environment. Licensing/provenance approval does not satisfy
this security gate. Numeric limits or budgets must follow measurement and policy;
this report does not invent them. Any parser dependency whose risk, license, or
shipped size affects the core also requires the normal dependency review and ADR.

### Explicit unresolved decisions

1. Durable offset unit, normalization and caret affinity representation.
2. Minimal authored typography and container semantics; run/paragraph model.
3. Font byte source, identity, loading lifecycle, fallback order, substitution,
   project assets, licensing, untrusted-input limits and export embedding.
4. Parley-family versus cosmic-text-family layout; exact version pins and feature
   gaps.
5. Vello vector glyphs versus Glyphon-style raster atlases; color/bitmap fallback.
6. Shape/layout service API, sync/async behavior, worker placement and stale
   result cancellation.
7. Resolved text representation and whether positioned glyphs cross the render
   packet or are regenerated from stable resource keys inside Rust.
8. Text↔Taffy iteration for intrinsic/constrained dimensions and overflow.
9. Browser IME, clipboard and accessibility adapter contract and platform matrix.
10. Hit behavior for node box, ink, whitespace, overflow, lines and carets.
11. Native/interchange font-resource packaging and fidelity scope.
12. Cache topology, eviction/degradation and measured performance targets.

## Pre-mortem: failure modes and detection

| How this fails | Earliest detection |
|---|---|
| Latin demo is promoted as a text architecture. | Mandatory complex-script/IME/font corpus fails or has missing cluster/affinity outputs. |
| Layout lives only in renderer state, so caret and Taffy disagree with pixels. | Geometry provenance test shows measurement/hit/draw are not consuming the same resolved result. |
| Browser font names silently resolve to different bytes. | Save/reopen or cross-browser fixture records different font identity/geometry without a substitution diagnostic. |
| A malformed or oversized project/URL font exhausts parser or GPU resources. | Bounded abuse fixtures hang, grow without bound, mutate authored bytes, or replace the last valid frame instead of returning a stable diagnostic. |
| Editing bypasses command/history through DOM or a Rust editor buffer. | Mutation audit finds document changes without a `DocumentCommand`, or undo cannot reconstruct pre-edit logical content. |
| Offset assumptions corrupt emoji/combining text. | Range split/delete/style fixtures cross grapheme boundaries or fail round-trip conversion. |
| Two production text paths persist during migration. | The same text node can be selected/rendered/measured by different engines or feature flags without a fixed retirement criterion. |
| Atlas or outline caches become stale identity. | Font/version/variation/device-loss mutation leaves pixels or hit geometry unchanged when full rebuild differs. |
| Renderer failure replaces content or last valid pixels. | Fault injection changes canonical bytes or presents a partial frame. |
| Library API churn leaks into schema/protocol. | Upgrading a crate requires a document migration or public packet rewrite unrelated to Crafty semantics. |
| Performance work begins from anecdotes. | A budget appears without a pinned fixture, environment, cold/warm state and distribution. |

## Pre-commitment and revisit triggers

Do not select a production stack until:

- both required candidates have a pinned browser-WASM result or a documented
  blocking failure;
- one shared corpus evaluates shaping/layout geometry, caret/affinity,
  font absence, color/bitmap glyphs and realization separately;
- font bytes, versions, fallback and licensing inputs are explicit;
- untrusted-font abuse fixtures and the security/policy review pass independently
  of provenance and licensing review;
- the proposed resolved boundary can serve layout, hit testing and rendering
  without authored write-back or per-glyph crossings;
- dependency licenses and shipped artifact deltas are reviewed;
- renderer/device-loss and last-valid-frame behavior is fault-tested;
- a migration has one production path and a retirement criterion;
- acceptance criteria name observable evidence rather than a numeric target.

Revisit the recommendation if Parley/Fontique's web-font and tracked layout gaps
close or block required fixtures; Glyphon publishes/version-aligns the inspected
integration; either candidate fails browser WASM/font provisioning; color/bitmap
requirements make one realization untenable; representative measurements show
the selected realization dominates; or Crafty's export/accessibility scope adds
constraints absent from this study.

## Conclusion

**Current:** Crafty has canonical plain text, invertible whole-value mutation that
is not runtime type-safe or text-kind/type validated, disposable component/layout
projection, protocol-v5 TypeScript packet composition, topologically lossy Rust
Inter path realization, module-owned Vello/WebGPU, and box-only hit testing. That
is a rendering foothold, not a text system. Validation rejection evidence and a
contour-plus-pixel fidelity oracle are explicit prerequisites, not current
guarantees.

**Proposed, non-binding:** qualify a Crafty-owned resolved-text responsibility
contract with two executable candidates. Test the Parley/Vello vector route first
because it preserves the current renderer line; retain cosmic-text/Glyphon as the
required atlas contrast. Decide layout/font/editing geometry separately from
glyph realization, then adopt one production path through OpenSpec and the
required ADRs. The root constraint is not “which crate draws text”; it is that
one resolved geometry must coherently serve layout, hit testing, editing and
rendering while authored logical intent remains canonical. Deterministic
shaper-readable browser font-byte provisioning is an integration inference to be
tested, not a requirement supplied by the CSS Font Loading API; any external
font-byte path is also an untrusted-input boundary.

**Blocker:** none for planning. Production selection is intentionally blocked on
the executable corpus, font policy, resolved-boundary design and decision records.
