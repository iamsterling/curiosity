## 1. Canonical Geometry Foundation

- [ ] 1.1 Define the universal point-geometry contract for placeable nodes and add validation for point identity, subpath membership, order, handles, closure, and derived bounds.
- [ ] 1.2 Implement deterministic rectangle, frame, line, ellipse, text-boundary, and image-boundary geometry templates with unit tests for coordinates, handle modes, and bounds.
- [ ] 1.3 Add the schema migration from bounds-first nodes to canonical point geometry, preserving node ids, placement, transforms, hierarchy, appearance, and content.
- [ ] 1.4 Update document serialization, validation fixtures, persistence tests, and unknown-version rejection for the new schema.

## 2. Commands And History

- [ ] 2.1 Generalize point mutation commands to operate on every canonical geometry owner while preserving absolute payloads and exact inverses.
- [ ] 2.2 Add point insertion, deletion, closure, handle movement, anchor movement, and point-mode commands for primitive geometries.
- [ ] 2.3 Verify transaction preview, commit, rollback, undo, redo, no-op, and invalid-geometry diagnostics across primitive and path fixtures.
- [ ] 2.4 Update clipboard copy/paste to mint node-local point and subpath ids and preserve geometry, handles, and point order.

## 3. Creation And Resolution

- [ ] 3.1 Change rectangle, ellipse, line, and frame creation effects to author canonical geometry at creation time.
- [ ] 3.2 Add canonical boundary geometry for text and image placement without conflating it with content or source data.
- [ ] 3.3 Resolve canonical geometry into the renderer-neutral draw packet and retain the rectangle fast path only as a measured projection optimization.
- [ ] 3.4 Add mixed-node render fixtures and verify visual placement, fills, strokes, transforms, z-order, and zero-area line behavior.

## 4. Point Edit State And Interaction

- [ ] 4.1 Add ephemeral point-edit target state distinct from object selection and hierarchy isolation; ensure it is absent from serialization.
- [ ] 4.2 Implement Enter and double-click entry, Escape exit precedence, outside-click exit, and selection filtering for point-edit mode.
- [ ] 4.3 Extend interaction effect vocabularies for anchor hits, handle hits, point marquee selection, anchor drags, handle drags, insertion, and deletion.
- [ ] 4.4 Add reducer tests for object mode versus point mode, additive point selection, nested isolation, cancellation, navigation arbitration, and below-threshold gestures.

## 5. Point Overlays And Editing UX

- [ ] 5.1 Project canonical anchors, selected points, handles, and tangent guides into ephemeral editing overlays with zoom-safe hit regions.
- [ ] 5.2 Render corner, free, asymmetric, mirrored, and inactive-point visual states consistently for all point-backed geometry.
- [ ] 5.3 Add point-mode affordances and breadcrumbs so users can tell whether they are editing the object or its points.
- [ ] 5.4 Add kernel-level harness tests for rectangle four-point editing, ellipse handle editing, line endpoint editing, and text/image boundary editing.

## 6. Verification And Documentation

- [ ] 6.1 Run package tests, typecheck, lint, format checks, and renderer tests for the complete point-editing path.
- [ ] 6.2 Verify serialized round trips, clipboard round trips, undo/redo identity, migration placement, and agent command parity.
- [ ] 6.3 Verify the real browser on desktop and mobile-sized viewports, including selection, Enter/double-click entry, point drags, handle drags, cancellation, and renderer failure preservation.
- [ ] 6.4 Update current-state, document-model, input-and-tools, selection-and-hit-testing, renderer, and invariants documentation to describe the implemented behavior and add an ADR for the schema/geometry decision.
