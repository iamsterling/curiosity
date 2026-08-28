# Architectural Synthesis

Status: **Provisional. Review required before implementation.**

## Principles

1. The authored document remains canonical; React, renderer, code projections,
   and animation frames are views or resolution products.
2. Routes address durable entrypoints and stable entities. Ephemeral editor
   state remains in the editor session unless share/history semantics justify a
   route representation.
3. The kernel owns mutation, validation, transactions, history, and semantic
   selection rules. DOM, MCP, code, and multiplayer use the same command path.
4. The renderer receives one coarse versioned packet and never receives product
   semantics or document mutation intent.
5. UI packages export leaf primitives. The consumer owns grouping, placement,
   ordering, and visual composition.
6. New registries are justified by a second real consumer, not by speculation.
7. Research and measurement precede irreversible boundary changes.

## Target shape

```text
Next route / server shell
  -> session/workspace composition
  -> client editor provider
       -> EditorKernel (canonical document + commands + history)
       -> mode/workspace context (ephemeral, typed, first-party initially)
       -> projections and bounded query services
       -> renderer packet / code projection / MCP room adapters
```

The mode/workspace context must not become a second document store. It should
describe active capabilities and session surfaces, while the kernel remains the
authority for selection and mutation.

## Decisions not yet made

- Whether a future workspace descriptor is state-only or partially URL-addressed.
- Exact selection-scope model for component, vector, prototype, and code work.
- Whether the MCP room is factored from `scene-sync` or built beside it.
- Whether the renderer should retire legacy `Scene` in one migration or through
  an adapter sequence.
- Whether third-party extensibility is ever a requirement.
