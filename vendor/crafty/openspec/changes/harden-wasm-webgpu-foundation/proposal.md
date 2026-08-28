## Why

An audit of the WASM/WebGPU stack found that the architecture is sound but the
runtime is not. Two defects were confirmed end-to-end against the real
wasm-bindgen module, and one of them stops the canvas from drawing after the
first edit:

- `documentRevision` (kernel counter, bumped per command) and `scene.revision`
  (persistence counter, bumped on save) are different numbers, and
  `webgpu-renderer.ts:248` compares them for equality. Every frame after the
  first mutation is discarded as `STALE_REVISION`.
- The `packetRevision` contiguity guard (`webgpu-renderer.ts:252`) updates its
  cursor *after* the earlier guards, so a single discarded frame wedges the
  renderer permanently — it never recovers even once the revisions realign.

Beyond those, alpha is encoded through the whole pipeline and then dropped
because the render pipeline declares no blend state; a dirty-but-invisible node
is never reported in `changedNodeIds`, so the first visibility toggle we ship
will corrupt the retained command map; `failure-policy.ts` is documented as the
renderer's failure contract but has no non-test caller; and there is no CI, no
toolchain pinning, no Cargo release profile, and no test anywhere that compiles
the WGSL or touches a real GPU.

The comparison target is Penpot's `render-wasm`, whose engine is in production
with the same shape of problem. Where Penpot has already solved something we are
about to solve, we should adopt its shape rather than invent one.

## What Changes

**Correctness (blocking)**

- One authoritative render-staleness counter, threaded from the kernel through
  the packet, replacing the two-counter comparison.
- The packet-revision cursor advances for every packet actually produced, so a
  discarded frame can no longer wedge the renderer.
- The incremental packet reports nodes that became invisible as removals, and
  the host distinguishes "full packet" from "batch with an empty change set"
  by an explicit field rather than `changedNodeIds.length`.
- Vello's transparent offscreen output is straight RGBA. The overlay blit uses
  straight-alpha source-over (`ALPHA_BLENDING`); the presentation surface's
  alpha mode does not establish the sampled texture's alpha convention.

**Diagnostics**

- One diagnostic vocabulary. `failure-policy.ts` becomes the single producer of
  renderer diagnostics, or it is deleted — it does not stay documented and dead.
- Diagnostics carry a severity (recoverable vs critical), following Penpot's
  `RECOVERABLE_ERROR` / `CRITICAL_ERROR` split, so the host can distinguish
  "drop this frame" from "tear down the device".
- WebGPU error scopes and an `uncapturederror` listener, so asynchronous
  validation failures become diagnostics instead of silence.
- `console_error_panic_hook` in the Rust module, so a panic is a message rather
  than an opaque trap.

**Verification and build**

- CI running `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test`, the
  wasm build, `tsc` and `vitest` — path-filtered and concurrency-cancelled, as
  `penpot/.github/workflows/tests-wasm.yml` does.
- Pinned toolchain (`rust-toolchain.toml` with the `wasm32-unknown-unknown`
  target), an exact `wasm-bindgen` version matched to the CLI, a
  `[profile.release]` block, and `wasm-opt` in the build.
- A real-GPU verification path: the WGSL is compiled and at least one frame is
  submitted and screenshot-compared, following Penpot's Playwright
  `toHaveScreenshot` project. Today every test runs against a fake device and
  the shader source is never compiled by anything.

**Explicitly out of scope**, recorded so they are not smuggled in: binary packet
transport, viewport culling, tiled rendering, text, images, clipping. Each is a
separate change with its own measurement.

## Capabilities

### New Capabilities

- `renderer/frame-staleness`: which packets the host accepts, which it
  discards, and the guarantee that a discarded frame never wedges the renderer.
- `renderer/incremental-packet`: the protocol v2 changed-node batch — what the
  encoder must report, including removals and visibility transitions, and how
  the host merges it onto retained state.
- `renderer/gpu-compositing`: how encoded colour and opacity reach the
  framebuffer — blend state, alpha convention, and colour space.
- `renderer/failure-diagnostics`: the single diagnostic vocabulary, its
  severity classes, and the guarantee that no renderer failure is silent.
- `renderer/runtime-verification`: what must be proven before the runtime is
  handed to the editor, and what must be proven in CI before a change lands.

### Modified Capabilities

None. `openspec/specs/` is empty — this is the first change in this workspace.

## Impact

- `packages/scene-renderer-wasm/src/lib.rs` — encoder removal signalling,
  panic hook.
- `packages/scene-renderer-wasm/src/webgpu-renderer.ts` — staleness guards,
  merge rule, blend state, error scopes.
- `packages/scene-renderer/rust/src/wgpu_present.rs` — straight-alpha Vello
  overlay composition over the scene-and-glass target.
- `packages/scene-renderer/src/{wasm-bridge,failure-policy,index}.ts` —
  diagnostic vocabulary, revision threading.
- `packages/editor-kernel/src/scene-adapter.ts` and
  `apps/crafty-web/src/editor/harness.ts` — the revision that reaches the scene.
- `apps/crafty-web/src/editor/canvas-stage.tsx` — what it passes and how it
  reacts to severity.
- `packages/scene-renderer-wasm/Cargo.toml`, `scripts/build-scene-renderer-wasm.mjs`,
  new `rust-toolchain.toml`, new `.github/workflows/`.
- Recorded parity hashes in `benchmarks/` are invalidated by the blend change
  and must be re-recorded with the environment noted.
- Documentation drift corrected in `docs/architecture/{renderer,performance,wasm-boundary}.md`.
