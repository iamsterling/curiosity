# Design — Creation Style and Floating Selection Actions

## Context

See `proposal.md` — Why. **Current:** creation styles are literals at five commit sites; `EditorState` is the kernel's ephemeral external-store state; the harness projection already carries `selectionBox`, `viewport`, and `canvasSize`; the stage rAF reads snapshots directly without React rendering. `EditorSelectionActions` already self-wires through editor context but is statically composed in the top bar. The Server Component layout directly composes bottom controls.

The load-bearing constraints are: ephemeral editor state is never serialized; authored changes still flow through commands; pointer-down does not mutate durable state; coordinate conversion has one authority; a pointer move does not render panels; and the client island must be SSR-safe.

## Goals / Non-Goals

**Goals:**

- One explicit, slice-subscribable creation-style source for every requested creation tool.
- Stable style semantics across a whole gesture or pen session.
- One pure, deterministic floating-placement policy fed only by authoritative facts.
- Keep shell composition server-owned and action behavior leaf-owned.
- Preserve the stage's direct-snapshot/rAF render path.

**Non-Goals:**

- General-purpose style presets, floating UI infrastructure, collision engines, or overlay layout systems.
- Moving action semantics into the renderer or authored overlay packet.
- Restyling selected nodes from creation controls or deriving creation style from selection.

## Decisions

### 1. The kernel external store owns `creationStyle: { fill, stroke }`

**Proposed:** creation style is an explicit field of ephemeral editor state, projected through the existing referentially stable external-store snapshot. The editor API exposes separate fill and stroke setters. Setters emit only when the value changes and do not dispatch a document command, bump document revision, or touch history/serialization. Initial values are `#818cf8` / `#c4b5fd`, the current rectangle/ellipse pair.

The creation boundary copies the pair: rectangle/ellipse/frame/line at gesture start; pen at session begin. Commits consume that copy, never a later live read. This preserves user intent if a control changes while a gesture/session remains open. Tool behavior is:

| Tool | Snapshot boundary | Authored result |
|---|---|---|
| Rectangle | creation gesture start | preset fill + stroke |
| Ellipse | creation gesture start | preset fill + stroke |
| Frame | creation gesture start | preset fill + stroke |
| Line | creation gesture start | preset fill + stroke on open path |
| Pen | first point begins session | preset fill + stroke on committed path |

**Alternative A — local React state in creation controls:** plausible because the values originate in chrome; loses because non-React creation paths and agents would not share the same state, and remount/composition could silently reset behavior.

**Alternative B — persist presets in the document:** plausible for per-file defaults; loses because the requested preset is session-only, would create schema/save/history questions, and violates the ephemeral-state invariant for no current user need.

**Alternative C — read style only at commit:** plausible and smaller; loses because a mid-gesture control change would retroactively alter an in-progress creation and pen sessions can span many interactions.

### 2. Creation controls are a distinct self-wiring primitive composed in place

**Proposed:** a focused creation-style control leaf subscribes only to `{fill, stroke}` and invokes explicit setters. The Server Component layout composes its fill and stroke controls directly in the left flex region immediately left of the existing bottom tool `nav`. Existing `SelectionColorControl` remains selection-only and is neither reused as behavior nor coupled to creation state.

**Alternative A — make one color control switch meaning based on selection/tool:** plausible because it saves space; loses because the same click would have context-dependent durable versus ephemeral effects and obscures whether it edits current or future geometry.

**Alternative B — wrap controls and toolbar in a new bottom-toolbar component:** plausible for encapsulation; loses because it violates the repository's shell-composition invariant and creates an unneeded container abstraction.

### 3. Selection actions portal to one narrow stage positioning host after mount

**Proposed:** `EditorSelectionActions` remains the behavior-owning leaf. After mount it resolves a stage-owned positioning host from a narrow context and portals its DOM surface there. The context carries registration/host capability, not editor state. Before mount, or without a host, it renders no portal and reads no browser global during render.

The stage host participates in the existing pointer-events layering: the action surface enables pointer events, identifies itself as a toolbar, and stops pointer-down propagation before the canvas can claim the pointer. Duplicate/delete continue to call existing editor operations.

**Alternative A — absolutely position in the Server layout overlay:** plausible because the layout already places chrome; loses because that surface lacks the stage-local origin and lifecycle and would encourage duplicated canvas offset arithmetic.

**Alternative B — draw actions in the renderer overlay:** plausible because selection geometry is already rendered there; loses because buttons, focus, semantics, and product actions do not belong in Rust/GPU protocol data.

**Alternative C — add a generic floating-surface/portal framework:** plausible if many surfaces were imminent; loses because there is one current use and speculative generalization expands blast radius.

### 4. Placement is a pure function; rAF applies it without React state

**Proposed:** a pure placement function receives `selectionBox`, `viewport`, stage `{width,height}`, and measured surface `{width,height}`. It transforms the selection box's four corners with the authoritative world-to-screen helper and takes their screen-space axis-aligned envelope. It returns hidden or a stage-local `{x,y,side}`:

1. Hidden for missing selection, non-positive stage/surface size, or no positive-area intersection between projected selection and stage.
2. Horizontally center on the projected selection, then clamp to `[0, stageWidth - surfaceWidth]` when the surface fits the stage.
3. Prefer `selectionTop - 10 - surfaceHeight` when non-negative; otherwise use `selectionBottom + 10`.
4. Do not invent vertical clamping: the above/below choice remains geometrically meaningful. Existing chrome may overlap in constrained viewports; that is preferable to detaching the action from its selection.

The stage's direct-snapshot rAF (or an adjacent imperative positioning tick under the same ownership) reads the current projection and writes transform/visibility to the registered action element. A `ResizeObserver` invalidates placement when the surface changes. Neither placement nor measurement enters React state on pointer movement; creation controls and other panels remain sliced subscribers.

**Alternative A — React selector + inline style:** plausible and idiomatic; loses because viewport/selection changes during pointer movement would render the action component and risk widening into panel rerenders.

**Alternative B — CSS anchor positioning:** plausible for a DOM anchor; loses because selected geometry is not a DOM element and authoritative transformed world bounds still need projection.

**Alternative C — a third coordinate helper in UI code:** plausible for a tiny formula; prohibited because coordinate transforms have one authoritative implementation.

### 5. Verification stays below mounted-shell integration where possible

**Proposed:** kernel/harness tests prove setter ephemerality, the tool matrix, and snapshot timing with no DOM. Table-driven pure tests prove placement, transformed corners, flip, clamp, and hiding. A narrow UI test proves toolbar semantics, portal-after-mount, and pointer propagation. A render-isolation assertion proves pointer movement does not notify unrelated sliced subscribers or require React placement state. An SSR test renders the island with browser globals unavailable.

**Alternative — rely on end-to-end visual checks:** plausible for a spatial feature; loses because it is slower, less deterministic, and cannot directly prove serialization/history and subscription invariants.

## Sensitivity and Trade-off Points

- Surface dimensions and localization affect flip/clamp outcomes; measurement is therefore an input, not a constant.
- Rotated/skewed single selections require four-corner projection; using only two corners would fail under transforms.
- Very short stages can leave neither side fully visible. The policy intentionally preserves a 10 px relationship rather than vertically clamping; revisit only with observed constrained-viewport failures.
- The default pair is user-visible. It intentionally follows rectangle/ellipse, not line/frame/pen, to preserve the most common filled-shape default while making all tools coherent.

## Risks / Trade-offs

- [A style setter accidentally becomes a command or serialized field] → byte-equivalence, document-revision, save, and history tests are preconditions to implementation acceptance.
- [Pen reads the live style at close] → a multi-step test changes the preset mid-session and asserts the first captured pair.
- [Portal interaction starts a canvas gesture] → capture/bubble tests assert no stage pointer-down handler and one editor action.
- [Placement drifts from rendered selection] → consume projection `selectionBox` and kernel `worldToScreen`; table-test rotated/scaled transforms.
- [Imperative DOM placement becomes a second render loop] → register with the stage-owned tick and invalidate only from projection revision, stage resize, or surface resize.
- [Primary rejected snapping work is mixed into implementation] → implementation starts from this dedicated base/change and must reject diffs touching `grid*`, `snap*`, or unrelated interaction snapping hunks.

## Pre-mortem and Detection

- **Failure:** newly created frames become unexpectedly opaque. **Signal:** tool-matrix acceptance tests and review of the explicitly chosen coherent default; if product review rejects this behavior before apply, revise the spec rather than special-case frame.
- **Failure:** actions flicker or lag during pan/drag. **Signal:** deterministic direct-snapshot placement test plus manual rAF smoke check; no React render count increase on pointer move.
- **Failure:** rotated selections place actions inside geometry. **Signal:** four-corner transformed fixture fails.
- **Failure:** SSR crashes on `document` access. **Signal:** server-render test fails before hydration.

## Migration Plan

No data migration. Rollout is additive ephemeral state plus chrome relocation. Rollback restores hard-coded creation defaults and top-bar composition; documents created under the change remain valid because fill/stroke fields already exist. No protocol or schema version changes.

## Pre-commitment Criteria and Revisit Triggers

- Do not implement until red tests cover all five tools, both snapshot boundaries, non-serialization/history, and the placement table.
- Accept only if all repository gates pass and the implementation diff contains no snapping change, schema/protocol/Rust edit, generic floating framework, or ADR.
- Revisit vertical collision policy only after a reproducible viewport/surface fixture demonstrates that both preferred positions are unusable.
- Revisit persisted presets only through a separate proposal prompted by a user requirement for cross-session or per-file defaults.

## Open Questions

None. User-visible defaults, placement edge behavior, and state lifetime are resolved by this change.
