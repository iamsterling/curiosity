# Research: Editor Kernel Integration

## Existing Crafty Evidence

- `App.tsx` currently owns `scene` and direct nested `setScene` mutations.
- `scene-model` already validates legacy scene payloads, stable layer IDs, transforms, stories, revisions, and canonical serialization.
- `editor-kernel` already validates a normalized document and provides transactions, history, coordinates, and tool transitions.
- The Rust/WASM renderer consumes the legacy scene projection, so an adapter is the lowest-risk migration boundary.

## Decision

Use a temporary compatibility adapter rather than rewrite the server and renderer in the same change. The browser kernel owns authored edits; the adapter preserves the existing local API and renderer while the document v1 migration remains separately testable.

## Risks

- Legacy scene bounds and kernel parent-local bounds have different long-term semantics. The adapter documents and tests its current mapping; nested transform normalization is a later migration gate.
- Story overrides remain a legacy visual projection until component state resolution exists.
- React still stores a render projection for subscription ergonomics, but it must never be the mutation input.
