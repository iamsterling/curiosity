# ADR 0018: Target-Neutral Semantic Surfaces

Status: Accepted — implemented
Date: 2026-08-10

## Context

Crafty's current `DocumentNode` model represents visual hierarchy and geometry;
`frame` is not a route, layout, or component. The product direction requires a
single authored model that can project to Next.js, SwiftUI, Compose, and agents.
Making `frame` mean `layout.tsx` would make a framework filesystem the ontology
and repeat the divergence problem documented in the visual-IDE research.

## Constraints

- The authored document remains canonical and renderer-independent.
- Node kinds remain geometry vocabulary and are version-gated.
- Mutations use validated, invertible kernel commands.
- Unknown semantic behavior versions are rejected.
- Semantic data does not enter the renderer packet or ephemeral editor state.
- Existing v1-v3 documents migrate without changing visual geometry.

## Options Considered

1. **Framework-specific fields on frames.** Plausible because the current web
   runtime is Next.js, but it makes filesystem paths and router concepts
   canonical, blocks native targets, and couples renderer-adjacent code to an
   adapter.
2. **New node kinds for screens, layouts, outlets, and links.** Plausible because
   they are visible in the canvas, but it overloads schema-versioned geometry
   kinds and requires renderer, hit-test, selection, and import changes for each
   semantic concept.
3. **Target-neutral semantic registries alongside frame nodes.** Chosen because
   it preserves visual identity and hierarchy while making stable cross-node
   references, validation, and future adapters explicit.

## Decision

Crafty stores optional `SemanticSurface` records and `SemanticRelation` records
in schema-v4 document registries. A surface references an existing frame and has
one target-neutral role, optional route intent, and optional non-canonical target
binding. Outlet, slot, and link relationships use stable ids and explicit node or
surface references. Adapters may project these records but may not redefine them.

This decision does not define code generation, route execution, component
resolution, responsive layout, or prototype playback.

## Consequences

- Agents can address application structure by stable semantic ids instead of
  inferring it from names, pixels, or framework paths.
- Existing rendering remains unchanged because semantics resolve above the
  renderer boundary.
- Document schema and clipboard operations gain reference-validation work.
- A future adapter must declare supported, lossy, and rejected projections.

## Risks

- The initial role vocabulary may be too small; behavior versions and additive
  records permit extension without changing frame identity.
- Registry references can become orphaned during destructive edits; validation
  and subtree/paste commands must reject or remap them explicitly.
- A binding may drift from an external repository; drift is diagnostic state,
  never a reason to mutate the authored surface.

## Validation

Kernel tests validate schema-v3 migration, role/version/reference constraints,
route uniqueness, canonical round trips, command inverses, history behavior, and
clipboard remapping. A dashboard fixture exercises layout, outlet, screen,
component, overlay, route, link, and Next.js binding records.

## Revisit When

Reopen when the first adapter requires semantics not representable by the
versioned vocabulary, or when runtime route/outlet resolution proves that the
registry relationship model cannot express nested composition without lossy
special cases.
