# Components, Variants, States and Design Systems

Status: **Local resolution foundation implemented; authoring UI and remote
semantics deferred.** Component records are persisted in the document-native
`.ui` package and local definitions are expanded by the kernel resolver. No UI
creates them yet; libraries, tokens, runtime states and motion remain deferred.

This is the centre of Crafty's product ambition, so it gets the most careful
treatment. Everything below is **Target** unless marked otherwise.

## What exists today

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
interface LibraryReference { libraryId; version; integrity; status: "resolved"|"missing"|"stale" }
```

The one working piece is clipboard handling (`clipboard.ts`, 16 tests): copying a
subtree carries its definitions and instances, paste re-keys `overrides` through
the id map with an `overridePath` fallback, and emits `PASTE_COMPONENT_MISSING` /
`PASTE_COMPONENT_LOCAL_COPY` / `PASTE_OVERRIDE_DROPPED` diagnostics rather than
guessing. That diagnostic discipline is the model for the whole subsystem.

Note the **legacy `Story`** mechanism in `packages/scene-model` (a named set of
per-layer overrides, surfaced as the "States" panel). It is *not* the component
state model — it is a shallow, single-level, pre-component mechanism that will be
superseded. Do not build on it.

## The core semantic: definition, instance, override

```
ComponentDefinition ──── defines ────▶ a subtree + a property schema
        ▲                                          │
        │ definitionId                             │ expansion
        │                                          ▼
ComponentInstance ──── properties + overrides ──▶ resolved subtree (with provenance)
```

Rules that must hold:

- **A definition is never copied into an instance.** An instance stores
  `definitionId`, property values, and overrides. Copying is how "components"
  degenerate into detached duplicates.
- **Overrides are sparse and keyed by identity within the definition.** They
  record *only* what differs.
- **Every resolved node carries provenance** — which instance and which
  definition node it came from. Without it the inspector cannot show "overridden",
  selection cannot stop at instance boundaries, and detach cannot work.
- **Nested instances resolve recursively**, and an override may target a node
  inside a nested instance. This is the case that breaks naive implementations.
- **Component dependency cycles are rejected before resolution** (I39). A
  definition that transitively instantiates itself is invalid, not infinite.
- **Structural change in a definition must not silently orphan overrides.** When
  a definition node disappears, its overrides become orphans: report them, keep
  them recoverable, do not delete them silently and do not reattach them by
  guesswork. The clipboard's `overridePath` fallback plus explicit diagnostic is
  the pattern.

### Prior art, and what to take from it

- **Sketch** separates `symbolMaster` (definition) from `symbolInstance`
  (reference), with `overrideValues` on the instance and a library field naming
  the source document or `null` for local symbols. The clean lesson: an instance
  is a *reference plus a delta*, and "which library did this come from" is a
  first-class field, not an inference.
- **Figma** ties this to stable object identity and property-level updates —
  identity first, CRDTs later, if ever.
- **Penpot** keeps components in libraries with explicit local-versus-shared
  status.

Crafty's `LibraryReference` (id + version + integrity + status) already encodes
this, and adds integrity, which is stronger than what Sketch's format records.

## Variants and states: two axes, one definition

This is where Crafty can be better than the tools it learns from, and where the
modelling matters most.

A component like a button has a **property space**:

```
Button
  intent: primary | secondary | destructive     ← variant axis (authored choice)
  size:   sm | md | lg                          ← variant axis (authored choice)
  state:  default | hover | pressed | loading | disabled   ← runtime/interaction axis
  theme:  light | dark                          ← environment axis
```

These are not the same kind of thing, and collapsing them is the mistake to
avoid:

| Axis | Chosen by | Lives where |
|---|---|---|
| **Variant** | the designer placing the instance | instance `properties` |
| **State** | interaction at runtime, or the designer for inspection | resolution context |
| **Theme** | the environment | resolution context (token set selection) |

The current schema has `variants` and `states` as sibling maps on the definition,
which correctly hints at the distinction. Formalising it means: a variant
selection is part of the instance; a state selection is part of the
`ResolutionContext` (see [`scene-resolution.md`](scene-resolution.md)).

The payoff: one instance can be *displayed* in five states without five copies
existing in the document, and a component's full state matrix is a **view**, not
a set of artifacts.

### The Storybook lesson (concept, not implementation)

Storybook's Component Story Format models a story as *a named set of args applied
to one component* — the component is the subject, the args are the inputs, and a
story is a specific point in the arg space. `argTypes` declares the space
itself.

What transfers cleanly:

- **A state is a named point in a declared property space**, not a duplicated
  artifact. This is exactly the model Crafty needs and is the opposite of
  "duplicate the frame and edit it".
- **The property space is declared** (`propertyDefinitions` is Crafty's
  `argTypes`), so tooling can enumerate the full matrix.
- **Interaction/play semantics** — a state can be reached by a described
  interaction, not only declared.

What does **not** transfer:

- Stories are code modules that execute a real component. Crafty's canvas is a
  visual authoring surface; it does not execute React. Do not build a module
  format.
- Storybook's file-per-component organisation is a filesystem convention, not a
  document model.

**Proposed Crafty model:** a definition declares its property space; a *state
matrix view* is a derived, non-authored enumeration of selected axes, rendered as
a grid of resolutions of the same definition. Authoring a state means adding a
named point (and any state-specific overrides) to the definition — never
duplicating a frame.

**Anti-pattern to name explicitly:** a "component state" implemented as a second
frame that someone copy-pasted and edited. It looks identical and is
architecturally dead — it does not update, cannot be enumerated, and lies to
every consumer.

## Tokens, variables and themes

`document.variables` exists as `Record<string, { type, value }>` and nothing reads
it. That flat shape is a starting point, not the model.

Target properties:

- **A binding is authored; a value is resolved.** A node's fill stores a token
  reference. The hex string appears only in the resolved tree. Storing the
  resolved colour is how theming breaks.
- **Token sets / modes.** A token resolves differently per theme. Theme selection
  is part of the `ResolutionContext`, not a document mutation.
- **Aliasing.** Tokens reference tokens. Alias chains must terminate; cycles are
  rejected like hierarchy cycles.
- **Typed tokens** — colour, dimension, number, string, boolean, and later
  typography and shadow composites.
- **Unresolved tokens produce a diagnostic and a documented fallback**, never a
  silent black.

## Cross-file design systems

The hardest part, and the one that most distinguishes a design *system* tool from
a design *file* tool.

Current state: `LibraryReference[]` on the document; nothing produces or resolves
one. `workspace`/`project`/`file` are constant stubs. Each browser surface holds
exactly one file, addressed by URL slug.

Target properties:

- **A library is a published, versioned snapshot** of a file's components,
  tokens and styles — not a live pointer to a mutable file. `LibraryReference`
  already carries `version` and `integrity`, which is the right shape.
- **Consumers pin versions and update deliberately.** An update is a reviewable
  operation with a diff, not an ambient change.
- **Missing and stale dependencies are first-class states**, already in the
  type (`status: "resolved" | "missing" | "stale"`). A document with a missing
  library must still open, still render what it can, and say clearly what is
  missing. It must never silently drop the instances.
- **Integrity is verified**, not assumed.
- **Local versus published is explicit.** Promoting a local component to a
  library is an operation with consequences, not a flag.

What this documentation initiative deliberately does **not** decide: the cloud
backend, sync protocol, or multi-user model. Those are out of scope until the
single-file document model is durable. What is decided is that library references
are **version-pinned, integrity-checked, resolvable-or-diagnosed** — which is
enough to keep the document model honest without inventing a backend.

## Sequencing

1. **Persist the real document** ([`persistence.md`](persistence.md)). Nothing
   below matters while saving drops `components`, `instances`, `variables` and
   `libraries`.
2. **Local components**: create a definition from a selection, place instances,
   resolve them, render them, with provenance. No variants, no tokens.
3. **Overrides** on instances, with orphan diagnostics.
4. **Property space + variants**: `propertyDefinitions` drives variant selection.
5. **Tokens**: bindings, a token set, theme selection in the resolution context.
6. **States**: named points in the property space, plus the state-matrix view.
7. **Nested instances** and the deep-select/isolation model
   ([`selection-and-hit-testing.md`](selection-and-hit-testing.md)).
8. **Publishing and cross-file references**: version pinning, integrity, update
   diffs.

Steps 2 and 3 together are the first ADR-worthy milestone: they fix the
authored/resolved line for components permanently.
