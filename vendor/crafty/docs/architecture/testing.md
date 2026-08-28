# Testing

Status: **Current** for unit and integration coverage of the kernel and renderer
encode path. **Absent** for visual regression and any GPU or browser behaviour.

## What exists

Vitest per package, orchestrated by Turbo (`turbo run test`, with `test`
depending on `build`). Cargo tests for the Rust crate via
`scripts/test-scene-renderer-wasm.mjs`.

| Package | Files | Tests | What they cover |
|---|---:|---:|---|
| `editor` | 24 | 356 | document validation, migration, commands, inverses, transactions, undo/redo, pages, clipboard, coordinates, interaction reducer, grid LOD, harness, overlay, persistence, autosave |
| `scene-renderer` | 9 | 90 | draw protocol, failure policy, WASM bridge, scene delta, retained host, capacity cache, ordered batches, grid overlay + measurements, TypeGPU parity (+ 42 cargo tests for the encoder) |
| `editor-web` | — | — | no unit tests; the editor test surface lives in `packages/editor`, and renderer regression tests live in `packages/scene-renderer` |
| `pen-import` | 1 | 11 | `.pen` parsing and mapping |
| `crafty` (CLI) | 2 | 16 | face resolution, server routes |
| `scene-model` | 1 | 7 | validation, canonical bytes, story overrides |

The whole suite runs in about four seconds. **Keep it that way** — a fast suite
is why the kernel is testable at all.

## Which behaviours deserve which tests

### Unit — pure functions, no I/O

The default. Everything below is already pure and must stay pure.

- Geometry: transform composition, inversion, rect transforms, degenerate
  matrices.
- Coordinate conversion: screen↔world round trips, zoom-about-cursor anchoring,
  clamping at `ZOOM_MIN`/`ZOOM_MAX`/`WORLD_LIMIT`.
- Hierarchy validation: every diagnostic code, each with a minimal failing
  document.
- Commands: apply, inverse, `changed` correctness, and every precondition
  failure.
- Interaction reducer: `transitionInteraction` directly — no browser, no kernel.
  Include below-threshold and cancellation cases for every tool.
- Grid LOD: level selection, hysteresis band, tick spacing bounds.
- Clipboard: id minting, override remap, each diagnostic code.
- Future: layout, text shaping, component resolution, token resolution,
  animation evaluation. All are pure functions of (input, context) by design.

### Property / invariant — the highest-value gap

Currently **absent**, and the cheapest large improvement available. The
invariants in [`invariants.md`](invariants.md) are exactly the properties to
assert:

- `apply(inverse(apply(doc, cmd))) === doc` for every command variant, over
  randomly generated documents.
- `parse(canonical(doc)) === doc` — serialization round trip.
- `canonical(doc)` is stable across key insertion orders.
- Any sequence of valid commands leaves a document passing
  `validateEditorDocument`.
- `screenToWorld(worldToScreen(p)) ≈ p` across the full zoom range.
- A random sequence of interactions followed by cancel restores the document
  exactly.
- Undo *n* times then redo *n* times is the identity.
- Randomised paste never produces a duplicate id and never drops an override
  without a diagnostic.

Randomised document generation belongs in the editor kernel beside
`stress-fixtures.ts`, so both testing and benchmarking share it.

### Integration — the kernel through the harness

`packages/editor/src/ui/editor/harness.test.ts` is the model: drive
`CanvasEditor` with pointer sequences and assert on the projection, with **no
React and no DOM**. Preserve this.

Covered or coverable this way: pan, zoom, pinch, shape creation, creation
cancellation, selection, marquee, move, resize, page switching with camera and
selection memory, copy/paste across pages, undo/redo, tool switching mid-gesture.

If a behaviour requires mounting a React component to test, it is in the wrong
place. That is a design signal, not a testing problem.

### Visual regression — **absent, and the biggest gap**

Nothing asserts that pixels look right. What exists is deterministic *payload*
parity: recorded stream-fingerprint references over the compiled module's
encode output (`benchmarks/encode-parity.test.ts`, GPU-less). That proves the
encoder is deterministic and matches its recorded references. It does not
prove the renderer produces correct pixels.

The primitives for real visual testing already exist and should be used:

- `POST /api/files/<slug>/snapshot` returns canonical bytes plus a sha256 of a
  projected frame — deterministic and content-addressed.
- The Rust encoder is backend-independent, so a headless render host is
  achievable ([`wasm-boundary.md`](wasm-boundary.md)).

What needs visual coverage once a headless host exists: primitive rendering,
transforms, opacity and blending, clipping, typography, component states,
selection overlays, grid and guides at multiple zoom levels, and export parity.

Recommendation: build the headless render host before adding a browser-driving
test framework. Headless snapshots are faster, deterministic, and diffable;
browser screenshot tests are slow and flaky and should cover only what genuinely
requires a browser.

### Performance — partially present

Encoding budgets are asserted as tests, with recorded environments — the right
pattern. Extend it per [`performance.md`](performance.md). A performance test
without a committed fixture and a recorded environment is not a test.

### Browser / GPU — absent

Real WebGPU submission, visual parity on hardware, and device-loss recovery are
unproven. The failure *policy* is well tested (10 tests); the *recovery* is not.
This needs a real browser and real hardware, and it is a known open gate.

## Rules

- **A bug fix comes with a test that fails without it.** Especially for
  interaction bugs, where the test belongs on the reducer, not the DOM handler.
- **Test the kernel, not the component.** If the assertion needs a mounted React
  tree, move the logic.
- **Fixtures are committed code**, generated by functions, not stored blobs.
- **Determinism is a testable property**, not an aspiration. Assert canonical
  output, sorted keys, stable hashes.
- **Every diagnostic code gets a test.** A code that no test produces will drift
  out of the implementation.
- **Benchmarks record their environment.** Follow the `CRAFTY_BENCH_*`
  convention.
- **Never assert on prose.** Assert on codes.

## Mechanical verification

Before considering a change complete:

```sh
bun run typecheck    # strict TS: noUncheckedIndexedAccess, exactOptionalPropertyTypes
bun run test
bun run lint         # bans console.log and unresolved implementation TODOs
bun run format:check
bun run build        # only when touching build config, Rust, or the web export
```

`scripts/lint.mjs` is deliberately minimal — two rules, no dependency on a
linting framework. If a third rule is worth having, add it there rather than
introducing a toolchain.
