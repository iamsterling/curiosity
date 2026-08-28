## 1. Package skeleton and description types

- [x] 1.1 Create `packages/scene-api` (npm workspace, NodeNext, strict TS): `src/` with `description.ts`, `resolver.ts`, `index.ts`, and a `react/` entry for the binding
- [x] 1.2 Define `SceneDescription` types: canvas root (size, dpr, background), groups (transform, opacity), rects (bounds, cornerRadius, fill, stroke), paths (`PathGeometry` + fillRule + stroke descriptor), text (run + fill, metrics deferred), all serializable (no functions, no React nodes)
- [x] 1.3 Add a package readme and wire the package into the root tsconfig/workspace per the existing package conventions

## 2. Resolver

- [x] 2.1 Implement `resolveScene(description, viewport) → RenderFrame` (protocol v3): transform stack and opacity computed in the resolver, `DrawCommand`s emitted in `(zIndex, order)` sequence, rect fast path, path commands carrying `PathGeometry` verbatim
- [x] 2.2 Add tests: deterministic resolution (same input → byte-identical packet), input never mutated (deep-equal after resolve), transform stacking (nested groups compose), opacity multiplies down the tree, ordering across kinds, path carrying is verbatim
- [x] 2.3 Add a fixture scene (representative chrome: a few groups, rects, one path) committed as generated data per repo convention

## 3. React binding

- [x] 3.1 `@crafty/scene-api/react`: `SceneCanvas` host + `SceneRect`/`SceneGroup`/`ScenePath`/`SceneText` elements that collect props into a description on render
- [x] 3.2 The host resolves and submits once per commit, rAF-coalesced; multiple commits within a frame collapse to one resolve
- [x] 3.3 Add the minimal mount tests the repo convention allows (description built from props; no DOM where avoidable)

## 4. First consumer and verification

- [ ] 4.1 Wire one chrome surface in `apps/crafty-web` through the scene API (a preview overlay or thumbnail the kernel path does not own) as the first consumer
- [ ] 4.2 Run `npm run typecheck`, `npm test`, `npm run lint`, `npm run format:check` and confirm all pass
- [x] 4.3 Update `docs/architecture/wasm-boundary.md` (the scene API sits above the packet) and confirm the research-ledger react-vello row's "Adopted (concepts)" status still matches reality
