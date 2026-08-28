## Research And Scope

- [x] 1.1 Recover the prior session's explicit deferred layout list.
- [x] 1.2 Research interactions, grid, constraints, translation, inference, measurement, components, animation, incrementality and conformance against public competitor/standards sources.
- [x] 1.3 Record adopt/adapt/reject conclusions and licensing boundaries in the research report.
- [x] 1.4 Reconcile the proposal with the existing authored-layout foundation and architecture invariants.

## Umbrella Design

- [x] 2.1 Define the shared authored/resolved/renderer invariants.
- [x] 2.2 Define separate child-change boundaries and the dependency graph.
- [x] 2.3 Define measurable un-deferral triggers without inventing performance budgets.
- [x] 2.4 Review this umbrella against the current worktree and existing OpenSpec changes before implementation dispatch.

## Child Changes To Propose

- [ ] 3.1 Propose `layout-runtime-hardening`.
- [ ] 3.2 Propose `layout-intrinsic-measurement`.
- [ ] 3.3 Propose `layout-constraints-breakpoints`.
- [ ] 3.4 Propose `layout-grid`.
- [ ] 3.5 Propose `layout-interaction-semantics`.
- [ ] 3.6 Propose `layout-translation`.
- [ ] 3.7 Propose `layout-inference`.
- [ ] 3.8 Propose `layout-component-resolution`.
- [ ] 3.9 Propose `layout-incremental-resolution`.
- [x] 3.10 Record `layout-animation` as a separate follow-on with its own acceptance boundary; do not include it in this umbrella's closure criteria.

## Verification And Handoff

- [x] 4.1 Add capability-level observable contracts for each child change to the umbrella spec; child changes will expand them into implementation-specific specs.
- [ ] 4.2 Add ADRs only when a child changes schema, ownership, dependency, resolution order or animation semantics.
- [ ] 4.3 Keep the full-resolution implementation path as the correctness oracle.
- [ ] 4.4 Run OpenSpec validation and record any overlap with active changes before code changes.
- [ ] 4.5 Do not mark a child complete from documentation or scaffolding alone; require a wired runtime path and tests.
