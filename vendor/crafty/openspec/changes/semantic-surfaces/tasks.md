## 1. Research and contract

- [x] 1.1 Add the competitor research report and update `docs/architecture/research-ledger.md` with adopted, adapted, rejected, and deferred lessons.
- [x] 1.2 Ratify the target-neutral surface/binding boundary in an ADR because it changes the durable document model and future code projection boundary.
- [x] 1.3 Review the capability spec and design against existing component, layout, persistence, and agent-editing architecture docs.

## 2. Document model

- [x] 2.1 Add schema-v4 `SemanticSurface` and `SemanticRelation` types and registries to `EditorDocument`.
- [x] 2.2 Add v3-to-v4 migration, versioned validation, canonical serialization, and legacy compatibility tests.
- [x] 2.3 Implement stable validation codes for surface roles, versions, route uniqueness, binding shape, and relation references.
- [x] 2.4 Ensure subtree delete/restore and clipboard paths preserve or safely diagnose semantic records.

## 3. Kernel mutation

- [x] 3.1 Add validated commands for setting/clearing surfaces, route intent, bindings, and semantic relations.
- [x] 3.2 Return exact inverses and honest `changed` values for every command, including no-op updates.
- [x] 3.3 Add transaction/history tests proving one committed semantic edit is one undo entry and cancellation leaves the document unchanged.
- [x] 3.4 Expose semantic projections through the kernel without putting them in renderer-facing scene semantics.

## 4. Vertical fixture and verification

- [x] 4.1 Add a dashboard fixture with layout, outlet, screen routes, links, component, overlay, and a target binding.
- [x] 4.2 Add agent-facing kernel tests that create and inspect the fixture only through commands.
- [x] 4.3 Run targeted editor tests, then `bun run typecheck`, `bun run test`, `bun run lint`, and `bun run format:check` (editor/kernel checks, lint, and format pass; workspace-wide commands are blocked by pre-existing `@crafty/cms` type errors).
- [x] 4.4 Update current-state and document-model docs only after code reality changes.

## 5. Deferred follow-ons

- [x] 5.1 Define adapter contracts and a Next.js projection as a separate change (deferred follow-on; not implemented here).
- [x] 5.2 Define runtime route matching, outlet composition, preview playback, and interaction semantics as separate changes (deferred follow-on; not implemented here).
- [x] 5.3 Define component resolution, slots, data bindings, conditions, collections, and responsive contexts as separate changes (deferred follow-on; not implemented here).
