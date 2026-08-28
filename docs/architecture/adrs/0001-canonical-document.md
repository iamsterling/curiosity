# ADR 0001: Stable-ID Document Maps

Status: Accepted — implemented
Date: 2026-08-05
Implementation status: Implemented as `EditorDocument` v2 in `packages/editor-kernel/src/document.ts`

## Context

The legacy scene stores visual layers in nested arrays and combines workspace identity, page state, and render fields. Array positions and React objects are unsuitable for components, collaboration, or agent edits.

## Options Considered

- Continue nested arrays and add IDs.
- Store normalized node maps with explicit parent links and ordered children.
- Use a renderer-owned retained scene as the document.

## Decision

Use a versioned `EditorDocument` with stable IDs, normalized node maps, explicit page records, parent links, and ordered child IDs. Keep the legacy `Scene` as a temporary adapter.

## Consequences

Commands can address nodes independently, parent cycles can be rejected, and future operation streams can preserve identity. Serialization and migration code become explicit responsibilities.

## Risks and Validation

Map overhead and adapter complexity are accepted. Validation tests cover duplicate IDs, missing links, parent mismatches, cycles, and canonical round trips.

## Migration

Add scene-to-document and document-to-scene adapters, migrate the server API, then remove the legacy format from new code.
