# Feature Spec: Figma-Level Design Parity Roadmap

## Problem

crafty is evolving from a component workbench into a component-native design surface. Teams need a clear, traceable roadmap for the design capabilities required to approach Figma parity without breaking the existing constitution: real source components remain the source of truth, machine-readable contracts come before UI-only affordances, and local canvas operations must not create hidden design-file drift.

## Target Users

- **Primary**: AI agents planning, editing, and verifying real UI components.
- **Secondary**: Designers/developers using the VS Code webview to steer component layout and visual decisions.
- **Future**: Contributors implementing design-surface features across canvas, component, token, prototype, and handoff systems.

## User Stories

1. As a contributor, I can see a phased Figma-parity roadmap with feature groups, priority, and implementation boundaries.
2. As a user, I can rely on selection, transform, and keyboard interactions that feel predictable before deeper design tools arrive.
3. As a contributor, I can implement future design features against shared, testable geometry/interaction helpers instead of duplicating canvas math in React components.
4. As an agent, I can inspect roadmap status and implementation constraints before choosing the next work item.

## Roadmap Scope

### Phase 1: Canvas Interaction Foundation

- Multi-select, additive selection, focused selection, selected/editing modes.
- Keyboard nudging: arrows move `1px`, `Shift+Arrow` moves `10px`.
- Resize handles and reusable frame geometry helpers.
- Drag selection/box selection and alignment/distribution follow after the helpers are stable.

### Phase 2: Layout System

- Auto Layout equivalent: direction, gap, padding, alignment.
- Hug/fill/fixed sizing with min/max constraints.
- Absolute positioning inside layout containers.
- Layout grids, rulers, guides, and smart spacing overlays.

### Phase 3: Component System

- Create component/instance semantics over real TSX/Storybook components.
- Prop, variant, state, text, image, style, and instance-swap overrides.
- Reset/detach overrides and nested component exposure.
- Source-code mutation remains explicit and traceable.

### Phase 4: Styling and Tokens

- Color, text, effect, grid, and variable styles.
- Token modes/themes and property binding.
- Fill/stroke/effect parity: gradients, image fills, blend modes, per-corner radius, masks.

### Phase 5: Text and Vector Editing

- Rich text layers, mixed text styles, overflow behavior.
- Shapes, pen tool, bezier paths, anchor/handle editing, boolean operations.
- Vector editing must remain separate from DOM/component editing until contracts are defined.

### Phase 6: Prototype, Handoff, Collaboration

- Hotspots, transitions, smart animate, prototype preview.
- Inspect mode, measurements, asset export, code output.
- Comments, version history, multiplayer presence, and review workflows.

## Non-goals for Initial Implementation

- Full Figma clone behavior in one pass.
- Hidden writes to source files from webview-only operations.
- Cloud collaboration, auth, marketplace, or plugin runtime.
- Freeform vector editing before a typed vector model exists.

## Acceptance Criteria

- Roadmap lives under Spec Kit and is clear enough for future task slicing.
- First implementation slice is modular: reusable canvas geometry/interaction helpers with comments explaining invariants.
- Existing webview canvas behavior continues to pass build/typecheck.
- Keyboard and edit-handle interactions are backed by shared helpers where practical.
- Future work boundaries explicitly preserve real-components-as-source-of-truth.

## Risks

- Figma parity can overwhelm the component-native MVP; phases must remain enforceable.
- Geometry helpers can become untestable if they stay embedded in JSX.
- DOM-backed component frames and future vector layers have different semantics; do not conflate them.
- Human-friendly UI features must still be representable as structured state for agents.
