# Document Model

Status: **Current** for structure, identity, pages, validation, path geometry,
semantic surface registries, schema v5 canonical plain-text content, and the kernel's internal projection-anchor seam
(schema v5 — path and semantic records are modeled and validated; nothing
renders path geometry or resolves semantic surfaces). **Target** for
components, tokens, layout and text — records exist, semantics do not.

Source of truth: `packages/editor/src/kernel/document.ts`.

## The authored document

`EditorDocument` (schema version **5**) is the canonical, renderer-independent
representation of what a user authored. Nothing else in the system is canonical.

The kernel also carries an **internal projection source-map contract** for future
code/text surfaces (`packages/editor/src/kernel/projection-source-map.ts`). That
module is deliberately disposable: it maps projected text spans back to existing
stable ids in the authored document and refuses anchors the current schema
cannot support. It does **not** introduce a second persisted artifact.

```ts
interface EditorDocument {
  schemaVersion: 5;
  id: DocumentId;
  workspace: { id; name };
  project:   { id; name };
  file:      { id; name };
  pages:     Record<DocumentId, PageRecord>;
  pageOrder: DocumentId[];
  nodes:     Record<DocumentId, DocumentNode>;   // normalised, flat
  components: Record<DocumentId, ComponentDefinition>;
  instances:  Record<DocumentId, ComponentInstance>;
  libraries:  LibraryReference[];
  variables:  Record<string, { type; value }>;
  surfaces: Record<DocumentId, SemanticSurface>;
  semanticRelations: Record<DocumentId, SemanticRelation>;
  metadata:   Record<string, unknown>;
}
```

### Why a flat node map

Nodes are stored in one flat `Record<DocumentId, DocumentNode>`, not nested. Each
node carries `parentId` and an ordered `childIds` array. Array position is
**never** identity.

This is the single most load-bearing decision in the model
([ADR 0001](adrs/0001-canonical-document.md)) and it buys four things:

- A command can address any node in O(1) without a path.
- Parent/child agreement and cycles become checkable properties (I3, I5).
- Reparenting is an edit to two links, not a subtree move.
- Future operation streams, collaboration and agent edits can reference stable
  ids rather than positions.

The cost is that structural integrity is no longer free — it must be validated.
It is, on every command.

### Workspace / project / file

`workspace`, `project` and `file` are single embedded records, not collections.
Today they are effectively constants: `sceneToEditorDocument` fills them with
`workspace-local` / `project-local` and the scene's own id
(`scene-adapter.ts:47`). **Current** state is therefore: one file per document,
one document per browser surface, addressed by URL slug (`/files/<slug>`).

**Target:** a project contains many files; a file contains many pages; libraries
reference *across* files. The records are shaped for that future but nothing
enumerates or resolves across files yet. See
[`components-and-design-systems.md`](components-and-design-systems.md).

## Nodes

```ts
type NodeKind = "page-root" | "frame" | "group" | "rectangle" | "text" | "image" | "path" | "compound";

type DocumentNode =
  | (NodeBase & { kind: "text"; text: string })
  | (NodeBase & { kind: Exclude<NodeKind, "text">; text?: never });

interface NodeBase {
  id; kind; name;
  parentId: DocumentId | null;
  childIds: DocumentId[];
  bounds: Rect;             // parent-local, axis-aligned; positive dimensions, except path
  transform: AffineTransform; // 2x3 matrix applied at the node origin
  visible; locked;
  opacity; fill; stroke; cornerRadius; zIndex;
  path?: PathGeometry;      // kind === "path" only (validated)
  metadata?: Record<string, unknown>;
}
```

**Current:** a v5 `text` node always owns a string, including `""`; every
other current node kind forbids `text`. Historical v1-v4 readers retain an
untrusted optional source member solely to validate it before migration. The
explicit `v4-to-v5-require-text-content` migration materializes absent valid
text-node content as `""`; present malformed or wrong-kind values reject rather
than being normalized or dropped. This is canonical content only—no shaping,
layout, fonts, or renderer text semantics exist.

The accepted kind set is a **schema-version property**, not a global:
`NODE_KINDS_V1` (five kinds), `NODE_KINDS_V2` (adds `image`) and
`NODE_KINDS_V3` (adds `path`) are threaded through validation
(`document.ts:233-235`), so a v1 or v2 document can never smuggle a `path`
node in.

## Semantic surfaces

**Current:** schema v5 carries application intent separately from visual node
identity. `surfaces` is keyed by stable surface id and each record references an
existing `frame` node. Roles are `freeform`, `screen`, `layout`, `component`,
and `overlay`; a surface may also carry target-neutral route intent and a
non-canonical target binding. `semanticRelations` carries stable `outlet`,
`slot`, and `link` relationships with explicit node or surface targets.

These records are authored data, not renderer geometry. A frame without a
surface remains an ordinary visual frame. A future adapter may project a layout
surface to Next.js `layout.tsx`, SwiftUI composition, or another target, but the
binding does not redefine the Crafty role.

Two honest notes:

- `kind` distinguishes the authored record types; the renderer protocol draws
  `rect`, `path`, and `text` geometry. Paths use the host-composed path-command
  channel. Protocol-v5 text uses the bounded embedded-Inter path projection from
  ADRs 0020 and 0024. An `image` node still has no image decode/upload path and
  projects only its rectangle scaffolding.
- `fill` and `stroke` are CSS colour **strings**, parsed in Rust
  (`lib.rs`). There is no paint model, no gradient, no multiple fills. This is
  the correct next thing to generalise when vector work begins, and it should
  become a `Paint[]` rather than growing more scalar fields.

### Geometry convention

A node's placement is `bounds` (position + size in parent-local space) composed
with `transform` (an affine matrix applied about the node origin). Hit testing
composes them as `parent × translate(bounds.x, bounds.y) × transform`
(`interaction.ts:91-92`). Anything that computes world geometry must use the same
composition order — see [`coordinate-systems.md`](coordinate-systems.md).

## Path nodes

`path` is a leaf node kind (no children, `document.ts:293-295`) carrying
geometry, added in schema v3. **The model is true; nothing renders it** — the
renderer's `DrawGeometry` stays `"rect"` and the tessellation is the next
change (`openspec/changes/vector-path-rendering/`).

### Geometry representation: an id-keyed point map over ordered subpaths

```ts
PathGeometry = {
  points:   Record<PointId, PathPoint>;   // flat map, stable minted ids
  subpaths: Record<SubpathId, PathSubpath>; // { id, closed }
  fillRule: "nonzero" | "evenodd";
}

PathPoint = {
  id: PointId; subpathId: SubpathId;
  order: OrderKey;                       // fractional key, never renumbered
  x: number; y: number;                  // node-local coordinates
  handleMode: "corner" | "free" | "asymmetric" | "mirrored";
  handleIn?: PathHandle;                 // anchor-relative delta { dx, dy }
  handleOut?: PathHandle;
}
```

This is the document's flat-map-and-ordered-children shape recursed into the
path: the decision and its rejections are recorded in
[ADR 0009](adrs/0009-path-point-tangents.md) and the change's design doc
(`openspec/changes/vector-path-data-model/design.md`, Decisions 1-4). The
load-bearing properties:

- **Identity.** Point ids are minted once, node-local unique, and never derived
  from geometry (paste mints fresh ids — I22). Handles have no ids: they are
  addressed as `(pointId, "in" | "out")`.
- **Order.** Ordering is a fractional `OrderKey` per point (the tldraw
  `IndexKey` pattern, adapted), never an array index: inserting a point writes
  exactly one record and never renumbers its neighbours (`orderKeyBetween`,
  `path-geometry.ts:67`). The encoding is an **involution under reversal**
  (`reverseOrderKey`, `path-geometry.ts:77`), which makes `reverse-subpath` a
  payload-free self-inverse command. Membership is the point's own `subpathId`
  — a point shared between two subpaths is unrepresentable by construction.
- **Authored handle intent, stored drift-free.** `handleMode` is authored
  intent (Figma's `handleMirroring`, not Penpot's inferred smoothness).
  Handles are anchor-relative deltas, so moving an anchor moves its handles for
  free and reversal swaps `in`/`out` exactly. `corner` stores no handles;
  `mirrored` stores only `handleOut` with `handleIn` derived as its exact
  negation — the mode cannot drift into a state `assertValid` rejects
  (`document.ts:249-253`, `path-geometry.ts:94-106`). `asymmetric`
  collinearity is a hint the future edit tool honours, not a validated
  invariant.
- **Referential integrity is validated.** Every point references an existing
  subpath, every subpath has at least two points, ids are node-local unique,
  coordinates are finite within `WORLD_LIMIT`, order keys are valid encodings,
  and the kind⟺geometry coupling is enforced (`document.ts:239-282`).

These point and subpath ids are also the only **non-node** anchors the current
schema can safely expose to projection source maps. Rectangle corners, frame
edges, text runs, image bounds and similar internal anchors are not durable
records today; making them addressable would require a document-model change and
schema migration rather than an ad hoc projection-only convention.

### The authored/derived `bounds` split

For rect-like kinds, `bounds` is authored wholesale. For `path` nodes the
contract splits:

- `bounds.x` / `bounds.y` remain **authored placement** in parent-local space,
  like every other kind (the geometry's own bbox min is pinned at `(0,0)`
  node-local, so placement lives entirely in `bounds.x/y`).
- `bounds.width` / `bounds.height` are **derived and verified**: the tight
  bounding box of the geometry, computed from true bezier extrema (the
  derivative solved, not the control-point hull — `computePathBounds`,
  `path-geometry.ts:158`), written by the same command that changes the
  geometry, and re-verified by `assertValid` within a 1e-6 tolerance
  (`PATH_BOUNDS_TOLERANCE`, `document.ts:237`, `:278-281`). A stale `bounds`
  is a thrown validation error, not a silent drift.
- The geometry's bbox minimum corner is **pinned at `(0,0)` node-local** at all
  times — the convention hit testing already uses (`interaction.ts:131`).
  Dragging a point past an edge rebases every point in the same command and
  shifts `bounds.x` by `-d`: net zero on screen, O(points) per command, the
  same cost class as the O(n) validation that already runs.

I8 is relaxed for `path` only (`>= 0` instead of `> 0` on width and height): a
straight horizontal line has zero height and must be representable. The audit
of every `bounds` consumer found no division by `width`/`height` — hit testing
uses inclusive range checks, marquee uses intersection, transforms never
divide by bounds — so zero-area paths cannot corrupt downstream math.

### Mutation

Path geometry mutates only through seven absolute-valued commands with exact
inverses (`set-path-points`, `insert-path-point`, `remove-path-point`,
`set-subpath-closed`, `reverse-subpath`, `set-path-fill-rule`,
`replace-path-geometry` — `commands.ts:13-19`). Granular commands carry full
point records for the touched ids plus recomputed `bounds`; structural
operations use whole-geometry replacement. Every command's payload is absolute
because the kernel recomputes inverses against `beforeDocument` on every
preview — a relative command is incorrect by construction in a drag
(`kernel.ts:182-187`). See
[`editor.md`](editor.md) and the change's command spec.

## Pages

```ts
interface PageRecord {
  id; name;
  rootId: DocumentId;   // must be a `page-root` node with parentId === null
  canvas: PageCanvas;
}

interface PageCanvas {
  rest:   { panX; panY; zoom };          // the camera you return to
  grid:   GridDescriptor;                // mode, majorSpacing, minorStep, origin, visible
  rulers: { showRulers; unit };          // persisted, NOT rendered — see below
  guides: GuideRecord[];                 // { id, axis: "x"|"y", position, visible }
  snap:   { grid; guides; objects; pixel };
}
```

`PageCanvas` is the answer to "is the camera document state?" — **the live camera
is not; the rest camera is.** When you open a page you should land where you left
it, and that is authored intent. When you are mid-pan you are not authoring
anything, and `set-page-viewport` is refused while a gesture is in flight (I20).

Grid, guides, rulers and snap are per-page authored settings, validated like any
other document data (`document.ts:304`).

**`rulers` is inert.** Canvas rulers were removed from the renderer — no design
tool Crafty takes inspiration from puts a persistent ruler strip on the canvas
edge, and the overlay is gone from the draw protocol, the host, and the kernel
tick math. The `PageCanvas.rulers` record is still written and validated because
removing a required field from schema v2 is a non-additive change that needs a
migration and an ADR; that is deliberately not bundled with a UI removal. Until
then, nothing reads it.

**Current gap:** none of this survives a save. See [`persistence.md`](persistence.md).

## Components, instances, variants, tokens

These records exist and are structurally validated, but **no resolution step
consumes them**:

```ts
interface ComponentDefinition {
  id; name; rootNodeId;
  propertyDefinitions: Record<string, { type: "boolean"|"text"|"variant"; defaultValue }>;
  variants: Record<string, Record<string, string | boolean>>;
  states:   Record<string, Record<string, string | boolean>>;
}

interface ComponentInstance {
  definitionId;
  properties: Record<string, string | boolean>;
  overrides:  Record<DocumentId, Record<string, unknown>>;
}

interface LibraryReference { libraryId; version; integrity; status }
```

The one place they are handled correctly today is the clipboard, which carries
definitions and instances along with copied nodes, remaps override keys through
the paste id map (falling back to a recorded child-index `overridePath`), and
emits diagnostics for overrides it cannot re-key (`clipboard.ts:1-15`).

Everything else — instantiation, override application, variant selection, state
selection, token substitution, cross-file resolution — is **Target**. Do not
write code that assumes it exists. See
[`components-and-design-systems.md`](components-and-design-systems.md).

## Authored versus resolved

The rule that keeps this model durable:

> The authored document stores **references and intent**. Resolution produces
> **values**. Values are disposable.

Concretely:

- A component definition is never copied into an instance. The instance holds
  `definitionId`, properties, and overrides.
- A token binding is never replaced by a computed colour in the authored
  document.
- A layout result is never written back as `bounds`.
- An animation's evaluated value at time *t* is never authored.

Violating this is how design tools become un-editable: once resolved values are
authored, changing the definition stops propagating. See
[`scene-resolution.md`](scene-resolution.md).

## Validation

`validateEditorDocument` is a total structural check, run on **every** command
result (`commands.ts:46`). Diagnostics are typed:

| Code | Meaning |
|---|---|
| `DOCUMENT_INVALID` | Shape, geometry, or value-range violation |
| `DOCUMENT_DUPLICATE_ID` | Id collision across pages/nodes/guides |
| `DOCUMENT_PARENT_MISMATCH` | Child link without a matching back-link |
| `DOCUMENT_CYCLE` | Cyclic hierarchy |
| `DOCUMENT_REFERENCE_MISSING` | Dangling parent, child, root or page-order reference |

Validation is O(n) over nodes and runs per command. That is affordable at current
document sizes and is a deliberate correctness-first choice. If it becomes a
measured bottleneck, the fix is incremental validation over the touched subtree —
not removing validation. Measure first; see [`performance.md`](performance.md).

## Versioning and migration

```
schemaVersion 1  →  v1ToV2DocumentMigration  →  schemaVersion 2  →  v2ToV3DocumentMigration  →  schemaVersion 3
                    adds PageCanvas               adds the "path" kind
                    (default) to every page       (re-stamps schemaVersion; the
                                                  kind set is version-parameterised,
                                                  so no geometry can smuggle into v2)
```

The chain is declared in `DOCUMENT_MIGRATIONS` (`document.ts:458`) and was
exercised for real for the first time by v3: chaining v1 → v2 → v3 round-trips
without data loss, and a v3 document is rejected by a v2 reader
(`document.test.ts:261-289`).

Rules that must not be relaxed:

- Unknown versions are **rejected, never coerced** (`document.ts:469`).
- Each migration step validates its input against the *source* schema before
  applying, and the final result is validated against the current schema.
- Migrations are declared in `DOCUMENT_MIGRATIONS` and applied as a chain.
- `canonicalEditorDocumentString` sorts keys recursively, so serialization is
  deterministic and diffable.

Adding a schema version means: bump `EDITOR_DOCUMENT_SCHEMA_VERSION`, keep the
previous interface exported (as `EditorDocumentV1` is), add a migration, add a
round-trip test, and update this file.

## The legacy `Scene`

Status: **Transitional.**

`packages/scene-model` defines `Scene` v1 — `{ frames: [{ id, name, bounds,
layers: Layer[], stories: Story[] }] }` with nested `Layer` children. It predates
`EditorDocument` and is retained for exactly two reasons:

1. It is the **wire and storage format** (`packages/scene-store`).
2. It is the **renderer input format** (`scene-renderer` → Rust encoder).

`packages/editor/src/kernel/scene-adapter.ts` maps between them:
`sceneToEditorDocument` (frame → page + page-root, nested layers → flat nodes) and
`editorDocumentToScene` (the inverse, re-nesting children).

The adapter is lossy in one direction and that loss is the top item of
architectural debt. `Scene` must not be extended to carry new document concepts —
retiring it is the plan ([`roadmap.md`](roadmap.md)), not growing it.

## Node kinds we will need, and where they belong

When adding a record type, ask whether it is *authored structure* or a *renderer
concern*. These are authored:

- **Vector path** — a geometry description (segments, fill rule), not a
  tessellation. Tessellation is the renderer's job. **Implemented as a
  validated record** (schema v3) but not yet rendered; see the path section
  above.
- **Image** — an asset reference plus fit/crop intent, not decoded pixels.
- **Text** — content plus typographic intent (family, size, features, alignment,
  wrapping). Shaped glyph runs are *resolved*, not authored. See
  [`typography.md`](typography.md).
- **Constraint / auto-layout descriptors** — sizing mode, padding, gap,
  alignment. The computed frame is *resolved*. See [`layout.md`](layout.md).
- **Prototype connection** — trigger, action, target, transition. The evaluated
  animation value is *resolved*. See [`animation.md`](animation.md).

Of these, only the vector path exists as a record today. Adding another one is
an ADR-level change because it moves the authored/resolved line.
