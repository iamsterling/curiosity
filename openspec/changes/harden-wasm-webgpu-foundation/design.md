## Context

See `proposal.md` — Why. This document records how, and where the approach is
taken from Penpot's `render-wasm` rather than invented.

Constraints that shape everything below:

- The coarse boundary is ratified (`docs/architecture/adrs/0003-coarse-render-boundary.md`)
  and is not reopened here. The historical TypeScript-device claim is superseded
  by ADR 0010: Rust/WASM owns the canvas device, surface, render and present.
- `docs/architecture/performance.md` forbids optimising or asserting a budget
  without a measurement. Several attractive changes are therefore deferred, not
  rejected.
- `docs/architecture/renderer.md` requires a protocol change to bump
  `DRAW_PROTOCOL_VERSION` and keep the previous version accepted.

**Penpot as reference.** Penpot's engine differs from ours in substrate — Skia
over WebGL2 via emscripten, ~176 exported functions, a fine-grained per-property
setter API — so its architecture is not ours to copy wholesale. What transfers
is the set of problems it has already hit in production: error severity, build
reproducibility, CI shape, real-pixel verification, and yielding. Each decision
below states whether it follows Penpot, diverges from it, or defers it.

## Goals / Non-Goals

**Goals:**

- The renderer draws correctly after an edit, and recovers from any discarded
  frame.
- The incremental packet cannot desynchronise retained state, including on
  visibility transitions we have not shipped yet.
- Encoded opacity reaches the framebuffer.
- One diagnostic vocabulary with severity, and no silent GPU failure.
- A clean checkout builds, and CI proves it, with the shader actually compiled
  and at least one frame actually rendered.

**Non-Goals:**

- Changing the transport. JSON in / JSON out stays until a benchmark on a
  representative fixture shows serialization dominating frame time.
- Tiled rendering, viewport culling, text, images, clipping, vector paths.
- Adopting Penpot's fine-grained boundary. Our four-method surface is the
  ratified design and it is not the thing that is broken.
- Instanced quads or vertex-struct repacking. Measured, not guessed — the
  current encode is far inside budget, so this waits for a number.

## Decisions

### 1. The kernel's document revision becomes the scene's revision

The projected scene is stamped with the kernel's `documentRevision` rather than
the persistence revision, so the value the caller passes and the value the
packet echoes come from one counter.

*Alternatives considered.* (a) Drop the equality check entirely — rejected, it
is the guard that stops a stale frame overwriting a newer one, and the sequencing
rules in `wasm-boundary.md` require it. (b) Pass the persistence revision to the
renderer instead — rejected, it does not change on edit, so it cannot detect
staleness at all. (c) Carry both and compare only the kernel one — rejected as
strictly more state for no benefit; the scene's own revision field is the natural
carrier.

The persistence revision keeps its existing role in save/load conflict
detection. It stops being a render input.

### 2. Sequencing state advances for every packet produced

The packet-revision cursor is updated as soon as a packet is successfully
decoded, before any staleness verdict. Today it is updated after two earlier
guards, so one discarded frame leaves the cursor permanently one behind and
every later frame fails the contiguity test.

*Alternative considered.* Reset the cursor on discard — rejected, it makes the
contiguity check unable to detect the reordering it exists to detect. Advancing
on production is both simpler and stricter.

### 3. Packet kind becomes an explicit field; removals are explicit

`DRAW_PROTOCOL_VERSION` goes to 3. The packet declares its kind, and the host
stops inferring "full" from an empty changed-node list.

The encoder reports a node in the changed list when it stops being drawn, for
any reason. "Named in the changed list, no command in the batch" is the removal
signal; it already works for deletions and is extended to visibility
transitions. The bug today is that the encoder only records a changed node
*inside* its visibility branch, so a node that just became invisible is dropped
from the list entirely.

*Alternative considered.* A separate `removedNodeIds` array — rejected as
redundant. The host's merge rule already treats "named but absent" as a
removal; the defect is in what the encoder names, not in how the host merges.

*Divergence from Penpot.* Penpot does not have this problem because visibility
changes invalidate the tiles a shape occupies, and tiles are re-rendered from
the shape tree. That is the better long-term answer and it is what a future
tiling change should adopt; it is far too large to be the fix for this defect.

### 4. Straight-alpha Vello-overlay blit

Vello internally composites premultiplied colour, but its offscreen target
stores straight/unpremultiplied RGBA. Crafty's Vello-overlay blit therefore
uses straight-alpha source-over (`ALPHA_BLENDING`). The presentation surface's
`alphaMode: "premultiplied"` does not change the target texture's stored alpha
convention.

Colour space is recorded rather than left implicit: authored colours are
sRGB-encoded values written to a non-sRGB presentation format, so no conversion
is applied. If the preferred canvas format is ever an `-srgb` variant, the
conversion becomes required — that condition is asserted, not assumed.

*Consequence.* Recorded parity hashes for translucent fixtures change. They are
re-recorded with the environment noted, per `performance.md` step 3. Relaxing
the assertion instead would be the wrong move.

### 5. One diagnostic vocabulary, with severity, following Penpot

`failure-policy.ts` currently declares seven codes that nothing produces, while
the renderer emits six different codes inline. The two are merged into one
vocabulary that the renderer actually produces, and the merged set carries a
severity.

The severity split follows Penpot's `error.rs`, which classifies every error as
`RECOVERABLE_ERROR` or `CRITICAL_ERROR` and exposes it out of band, so the JS
side decides recovery from severity rather than from a code table. Applied here:
recoverable means drop the frame and keep going; critical means tear down the
device and re-acquire. Device loss and pipeline creation failure are critical;
staleness, canvas-not-ready and a single encoder fault are recoverable.

*Alternative considered.* Keep the two vocabularies and map between them —
rejected. A mapping layer between a dead vocabulary and a live one is a way to
keep documenting behaviour that does not exist.

*Divergence from Penpot.* Penpot passes severity as a `u8` read through a
separate export because emscripten builds with exceptions disabled. Our
`wasm-bindgen` boundary returns `Result`, so severity rides on the returned
diagnostic. The classification is adopted; the transport is not.

### 6. GPU errors are captured, and panics carry a message

An `uncapturederror` listener plus error scopes around pipeline creation and
submission turn WebGPU's asynchronous validation failures into diagnostics. On
the Rust side, `console_error_panic_hook` is installed so a panic produces a
message instead of the opaque trap that `wasm-boundary.md` already forbids.

### 7. Real-pixel verification via Playwright, following Penpot

Penpot runs its renderer tests as a dedicated Playwright project with a
`waitForFirstRender` helper and `expect(canvas).toHaveScreenshot()`
(`render-wasm/docs/visual_regression_tests.md`). We adopt that shape: a
`renderer` Playwright project, a first-render barrier, committed reference
images, and a declared tolerance.

This is the only way to get the shader compiled and a frame submitted. Every
test we have today runs against a hand-written fake device, so the WGSL source
is never compiled by anything.

*Alternative considered.* A headless native WebGPU binding (Dawn via
`webgpu`/`@kmamal/gpu`) in Vitest — attractive because it is faster and has no
browser, but it verifies a different implementation than the one users run, and
it would not have caught a missing blend state on a browser-preferred format.
Worth adding later as a fast pre-filter; not as the primary gate.

*Note Penpot's own caveat.* Their visual tests are documented as local-only, not
yet in CI. We should not inherit that gap — the reference images and tolerance
exist precisely so the check can run unattended.

### 8. Reproducible build: declare the toolchain, pin the binding generator

`rust-toolchain.toml` declares the compiler version and the
`wasm32-unknown-unknown` target. `wasm-bindgen` is pinned to an exact version,
because the CLI and the crate must match exactly or the build fails with a
confusing error. Tool resolution moves to `PATH` with an env override, instead
of the hard-coded `~/.cargo/bin` paths that break on CI images and Windows.

`[profile.release]` follows Penpot's `Cargo.toml` directly —
`opt-level = 3`, `lto = "fat"`, `codegen-units = 1`, `strip = true` — and
`wasm-opt` runs after `wasm-bindgen`. Penpot chose `opt-level = 3` over `"z"`;
for a hot encoder that is the right trade, and we take the same one.

*Divergence from Penpot.* Penpot pins its whole toolchain by building inside a
`penpotapp/devenv` container. We have no devenv container and adding one is a
much larger change, so `rust-toolchain.toml` plus an exact binding-generator
version is the proportionate equivalent.

### 9. CI shape follows `penpot/.github/workflows/tests-wasm.yml`

A path-filtered workflow with `concurrency: cancel-in-progress`, running
`cargo fmt --check`, then `clippy -D warnings`, then `cargo test`, then the
wasm build, then `tsc` and `vitest`. Format and lint run first because they are
seconds and they catch the cheapest class of failure before anything expensive
starts.

`clippy -D warnings` is adopted deliberately: it is a ratchet, and it is much
easier to adopt on a 719-line crate now than on a 7,000-line one later.

### 10. Deferred, with the trigger that would un-defer each

Recorded so they are not rediscovered, and so nobody implements them
speculatively:

| Deferred | Penpot's answer | Trigger to adopt |
|---|---|---|
| Binary / linear-memory transport | `mem.rs` writes a typed byte buffer into linear memory and returns a pointer; JS reads `HEAPU8` | A benchmark on a committed fixture showing serialize+parse dominating frame time |
| Yielding mid-render | `should_stop_rendering` checks a clock every *N* nodes against `max_blocking_time_ms` and resumes next frame from a pending-node stack | A measured frame exceeding the frame budget on a committed fixture |
| Tiled rendering and a tile texture cache | `tiles.rs` + `TileHashMap`, with an interest area rendered beyond the viewport to avoid popping | Document sizes where full-frame encoding is measurably too slow |
| Viewport culling | Falls out of tiling | Same measurement |
| Instanced quads / vertex repacking | n/a | A measured encode or bandwidth cost |

One detail worth carrying forward when yielding is eventually implemented:
Penpot explicitly refuses to yield mid-gesture while visible tiles are
outstanding, so the user never sees tiles appear in sequence during a drag.
That is a UX rule discovered in production, and it is cheaper to write down now
than to rediscover.

## Risks / Trade-offs

- **Re-recorded parity hashes hide a real regression** → Re-record in one
  commit that changes nothing else, and diff the rendered reference images, not
  just the hashes, before accepting them.
- **Protocol v3 host meets a v2 packet, or the reverse** → v2 stays accepted, as
  `renderer.md` requires. A v2 packet is treated as full-or-batch by the old
  inference rule; that rule is correct for every v2 producer because v2 has no
  removal-only batch.
- **Screenshot tests flake across GPUs and drivers** → Pin the browser via
  Playwright's bundled build, run them on one CI image, declare a pixel
  tolerance, and treat a tolerance increase as requiring the same justification
  as a budget increase.
- **`clippy -D warnings` blocks unrelated work** → Land the clippy-clean commit
  before turning the gate on, so the first enforced run is already green.
- **Fixing the revision counter surfaces bugs it was masking** → Likely, and
  desirable. Frames have been silently discarded; anything that only "worked"
  because nothing was drawn will now be visible. Land the revision fix early and
  on its own so what it uncovers is attributable.
- **Playwright is a new heavy dependency** → It is already a dependency in this
  class of project, and it is the only route to a compiled shader. If it proves
  unsustainable, the Dawn pre-filter in Decision 7 is the fallback.

## Migration Plan

1. Land the revision fix and the sequencing-cursor fix first, with regression
   tests that drive a mutation through the real module. These are the two
   defects that stop the product working; everything else can follow.
2. Land toolchain pinning, the release profile and CI, so subsequent steps are
   protected. Include the clippy-clean commit before enabling the gate.
3. Land protocol v3 (packet kind, removal reporting) with v2 still accepted.
4. Land blend state and re-record parity references in an isolated commit.
5. Land the merged diagnostic vocabulary, error scopes and panic hook.
6. Land the Playwright renderer project with its first committed references.
7. Correct the documentation drift the audit found in
   `docs/architecture/{renderer,performance,wasm-boundary}.md`.

Rollback is per-step; no step depends on a later one. Step 4 is the only one
that changes rendered output, and it is isolated for exactly that reason.

## Open Questions

- Which CI runner image gets to own the screenshot references. This does not
  change the specs, the approach or the task breakdown — it changes one
  workflow file and the environment recorded alongside the references.
- Whether the Dawn-based pre-filter from Decision 7 is worth adding alongside
  Playwright. Deferrable: it is an addition to the verification set, not a
  change to it.
