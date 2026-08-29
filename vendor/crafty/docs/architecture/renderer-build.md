# Renderer Build and Publishing

Status: **Current** for the web build, profile, packaging and serving pipeline —
each claim here was verified by running it, and the measurements are recorded
with the machine they came from. **Current** for the renderer's success path in
a real browser, proven by `scripts/smoke-renderer.mjs` against the production
binary. **Current** for the native iOS static-library build, application
link/launch, retained-layer host, and physical-iPad packet presentation.
**Blocked** for CoreSimulator presentation because its Metal adapter lacks
`INDIRECT_EXECUTION`; S1 records that exact unsupported-runtime exception.
**Unverified** for GPU failure paths — device loss, adapter variation,
non-Chromium browsers, and native iOS presentation — stated precisely in
[Supported alpha runtime](#supported-alpha-runtime).

Companion documents: [`wasm-boundary.md`](wasm-boundary.md) for what crosses the
JS/WASM line and why, [`renderer.md`](renderer.md) for the draw protocol and the
host, [`performance.md`](performance.md) for the measurement discipline.

## The production path

Traced end to end on 2026-08-07. Every stage below was executed, not inferred.

```
packages/scene-renderer/rust/src/lib.rs
  → cargo build --target wasm32-unknown-unknown --release   (profile below)
  → target/wasm32-unknown-unknown/release/crafty_renderer_wasm.wasm
  → wasm-bindgen --target web --out-dir pkg
  → pkg/crafty_renderer_wasm.js  +  pkg/crafty_renderer_wasm_bg.wasm
  → imported by packages/scene-renderer/src/wasm/index.ts
  → Next.js (Turbopack) emits the .wasm as a content-hashed asset
      /_next/static/media/crafty_renderer_wasm_bg.<hash>.wasm
  → next build --output standalone
  → scripts/build-crafty-binary.mjs copies standalone + .next/static + a Node binary
  → dist/crafty  (single-binary launcher)
  → Next server serves the asset with Content-Type: application/wasm
  → browser fetch + WebAssembly.instantiateStreaming
  → RendererCore
  → module-owned wgpu device/queue + canvas surface (init_canvas)
  → Vello wgpu renderer → offscreen → module-owned present pipeline (present.wgsl) → pixels
```

Two things about this pipeline are worth knowing because they are easy to break:

**The standalone build does not copy static assets.** Next traces `node_modules`
but leaves `.next/static` and `public/` to the packager.
`scripts/build-crafty-binary.mjs` copies both — if that ever regresses, the app
loads and the renderer 404s.

**The `.wasm` URL is resolved by the bundler, not by us.** The generated glue
does `new URL('crafty_renderer_wasm_bg.wasm', import.meta.url)`. Turbopack
rewrites that to the hashed asset path. Do not hand-roll a loader or hardcode a
path; both would break the content hashing that makes stale-pairing impossible.

## Native iOS path

Verified on an arm64 simulator and a physical iPad on 2026-08-28:

```text
Curiosity .ui fixture → EditorKernel.getProjection()
  → editorDocumentToScene → one complete RenderFrame JSON prop
packages/scene-renderer/rust/src/lib.rs
  → safe encode_frame_evidence_json(frame packet)
  → rust/native-ffi/ whole-frame C ABI (the only unsafe edge)
  → cargo staticlib for aarch64-apple-ios[-sim]
  → CuriosityCanvas CocoaPod build phase
  → Objective-C bridge → Swift ABI-version check and retained CAMetalLayer
  → native C ABI creates Metal wgpu surface/adapter/device + Vello renderer
  → one complete RenderFrame → existing Vello encoder/present pipeline
  → Release Curiosity.app pixels on physical iPad
```

The encoder crate still has `#![forbid(unsafe_code)]`; raw pointer validation,
panic containment, owned-result access, and destruction are isolated in
`rust/native-ffi/`. `scripts/build-scene-renderer-ios.sh` uses the committed
lockfile and only accepts the two pinned arm64 Apple targets. The local pod
builds from source so no generated binary or signing identity is committed.

S0 and S1 are complete: the physical iPad presents the canonical rounded
rectangle through Rust/Vello/wgpu, while CoreSimulator fails closed because its
adapter lacks `INDIRECT_EXECUTION`. No alternate renderer masks that exact
blocker. Pixel comparison, lifecycle/recovery, latency, and memory remain
S2–S6 work in `openspec/changes/native-ios-renderer-host/`.

The shipping Curiosity adapter no longer constructs the S1 rectangle in Swift:
it loads the canonical `.ui` document into `EditorKernel`, projects the current
page through `editorDocumentToScene`/`sceneToRenderFrame`, and passes that one
JSON packet to the native host. Swift remains a lifecycle and presentation
adapter. One-finger pointer samples return through the Expo view event boundary
and enter the shared `transitionInteraction` reducer; selection is ephemeral and
move previews use one `EditorKernel` transaction, with pointer cancellation
rolling back the exact authored bytes. Two-finger pan and pinch remain viewport
gestures. The visible undo/redo controls call kernel history directly. Native
accessibility emits only generic activate/increment/decrement commands; the
TypeScript adapter maps them to selection and validated one-pixel kernel nudges,
so Swift still carries no document ids or editing semantics.

The current rectangle slice also exposes transformed selection handles. Resize
and rotate samples use the shared reducer and one kernel transaction; rotation
is projected from the fixed pointer-down transform so repeated previews do not
accumulate. Cancel rolls both gestures back byte-for-byte, and undo restores
each as one history entry.

## Building locally

```bash
# Everything, in dependency order
bun run build:browser

# Just the renderer module
bun run build --filter @crafty/scene-renderer/wasm

# Native arm64 static libraries (S0)
./scripts/build-scene-renderer-ios.sh aarch64-apple-ios-sim
./scripts/build-scene-renderer-ios.sh aarch64-apple-ios

# The shippable single binary
bun run bundle && ./dist/crafty serve
```

Prerequisites are pinned, not assumed — see [Reproducibility](#reproducibility).

## Release profile

`packages/scene-renderer/Cargo.toml`. Measured on this crate, 1,000-node
fixture, full re-encode, median of 7, Apple Silicon / macOS 27 / Node 24:

| Profile | raw wasm | gzip | full encode |
|---|---:|---:|---:|
| cargo defaults (no `[profile.release]`) | 219,242 | 77,560 | — |
| `opt-level = 3` | 171,865 | 71,523 | **0.771 ms** |
| `opt-level = "s"` | 150,103 | 59,321 | 1.366 ms |
| `opt-level = "z"` | 147,644 | 58,636 | 1.818 ms |

**`opt-level = 3` is deliberate.** `"z"` saves 12.9 KB gzipped — paid once, on an
immutably-cached asset — and costs **2.4× the encode time on every full
re-encode**, scaling linearly with document size. For a per-frame encoder that is
the wrong trade. This is the same conclusion Penpot reached for `render-wasm`,
here for a measured reason rather than by imitation.

Also set: `lto = "fat"`, `codegen-units = 1`, `strip = true`.

**Measured and deliberately NOT adopted**, recorded so nobody re-litigates them
from folklore:

- `panic = "abort"` — changed the artifact by **zero bytes**.
  `wasm32-unknown-unknown` does not unwind anyway, so it is pure cargo-cult here.
- `wasm-opt -O3` — saves **371 bytes gzipped (0.5%)** and would add a toolchain
  dependency. Revisit if the module grows substantially. Note it requires
  `--enable-bulk-memory --enable-nontrapping-float-to-int --enable-sign-ext
  --enable-reference-types --enable-multivalue` because modern rustc emits
  post-MVP WebAssembly by default (see [WASM feature set](#wasm-feature-set)).

## Artifact baseline

Current, from the shipped `dist/` — the section-5 module (openspec
`vector-path-rendering`): Vello's wgpu renderer and the module-owned present
pipeline are reachable, so the wgpu line is fully inside the binary. Measured
2026-08-07, same environment as `benchmarks/vello-wgpu-dependency-cost.md`:

| Artifact | Size |
|---|---:|
| `crafty_renderer_wasm_bg.wasm` (raw) | 1,637,283 B |
| same, gzip -9 | 484,923 B |
| `crafty_renderer_wasm.js` glue | 72,053 B |

(The pre-Vello baseline — 174,779 raw / 72,625 gzip — is history; the
section-4 dependency landing already exceeded it by construction, recorded in
`benchmarks/vello-wgpu-dependency-cost.md`.)

CI enforces a ceiling of 1,700,000 raw / 510,000 gzip as a **regression
tripwire, not a target**: the measured shipped sizes plus ~4% headroom so an
identical rebuild does not trip it. An intended increase moves the ceiling in
`.github/workflows/renderer.yml` and records why here.

## WASM feature set

`rustc` for `wasm32-unknown-unknown` emits these post-MVP features **by default**:

```
bulk-memory   multivalue   mutable-globals
nontrapping-fptoint   reference-types   sign-ext
```

This is an unexamined default that happens to be safe for our support target —
all of them are baseline in every browser that ships WebGPU — but it is not free
knowledge, and it is why `wasm-opt` needs explicit `--enable-*` flags. If the
support matrix ever widens to older runtimes, this list is the constraint to
check first.

## Serving

Verified against the real `./dist/crafty serve`, not the dev server:

```
GET /_next/static/media/crafty_renderer_wasm_bg.<hash>.wasm
HTTP/1.1 200 OK
Content-Type: application/wasm
Cache-Control: public, max-age=31536000, immutable
Vary: Accept-Encoding          (gzip negotiated)
Accept-Ranges: bytes
```

- **`application/wasm` is correct**, so `WebAssembly.instantiateStreaming`
  succeeds. If this regresses, the generated glue silently falls back to
  non-streaming `instantiate` and logs a console warning — slower, not broken,
  and easy to miss.
- **Content-hashed + `immutable`** is what makes stale pairing impossible: the
  JS glue and the `.wasm` are both hashed and both change together. A previous
  hash returns **404**, verified — a stale tab fails loudly instead of pairing
  new glue with an old binary.
- **gzip, not brotli.** The Next standalone server does not do brotli. Brotli
  would meaningfully beat gzip on wasm; behind a CDN or reverse proxy, enable it
  there. Deferred, not forgotten.
- **No COOP/COEP headers**, deliberately. Nothing here uses `SharedArrayBuffer`
  or threads, so cross-origin isolation would be cost with no benefit.

## Reproducibility

Pinned deliberately:

| Thing | Pin | Where |
|---|---|---|
| Rust toolchain | `1.97.1` | `packages/scene-renderer/rust-toolchain.toml` |
| wasm32 and arm64 iOS device/simulator targets | auto-installed by the toolchain file | same |
| `wasm-bindgen` crate | `=0.2.126` (exact) | `Cargo.toml` |
| `wasm-bindgen` CLI | read from `Cargo.lock` in CI | `.github/workflows/renderer.yml` |
| Rust dependencies | `Cargo.lock` (committed) | — |
| Bun / JS deps | `bun.lock` (committed) | — |

**The wasm-bindgen crate and CLI must be the same version.** They are a matched
pair; a mismatch fails binding generation with a confusing error. CI derives the
CLI version from the lockfile so there is one source of truth.

`scripts/build-scene-renderer-wasm.mjs` resolves `cargo` and `wasm-bindgen` from
`PATH`; `CARGO` / `WASM_BINDGEN` remain explicit overrides for hermetic wrappers.
The build runs `wasm-opt -O3` when Binaryen is installed. CI requires it with
`WASM_OPT_REQUIRED=1`; local builds may skip it when the tool is unavailable and
report that fact.

## Upgrade procedure

**Rust toolchain**: bump `rust-toolchain.toml`, then run `cargo clippy
--all-targets -- -D warnings` and `cargo fmt --check` locally before pushing — a
new toolchain usually brings new lints, and CI treats warnings as errors.

**wasm-bindgen**: bump the crate in `Cargo.toml` **and** let CI reinstall the
matching CLI (it reads the lockfile automatically). Locally,
`cargo install wasm-bindgen-cli --version <same> --locked`. Rebuild and confirm
the artifact still passes the size ceiling; binding-generation changes have
moved artifact size before.

**Vello line**: `vello` 0.9.0, `vello_encoding` 0.9.0 and `wgpu` 29.0.4 are pinned
exactly in `Cargo.toml` and move together (Vello is pre-1.0 with ~3 breaking
releases/yr and every minor has been breaking; its `wgpu` pin moves with it).
Treat every bump as potentially breaking: after upgrading, run the cargo tests,
the vitest encode-parity harness and `protocol-v2-batch.test.ts`, and re-record
the module-size record in `benchmarks/vello-wgpu-dependency-cost.md` before
touching the CI ceiling — upgrades are witnessed by the parity harness, never
by faith.

## Failure model

`console_error_panic_hook` is installed at module start
(`#[wasm_bindgen(start)]`). Without it a Rust panic surfaces as
`RuntimeError: unreachable` with no message, no location and no stack — which is
effectively undiagnosable from an alpha bug report. With it, the panic message
and a stack trace reach the console first.

It does **not** make panics recoverable. A trapped instance stays poisoned; the
host must rebuild the renderer. Avoiding panics on bad input is a separate
concern, handled at deserialization:

**Deeply nested documents are rejected, not crashed.** `serde_json`'s default
recursion limit (128) rejects a too-deep document during deserialization, before
the encoder's own recursion could overflow the stack. Verified: depth 50 parses,
depth 100 is already rejected with `recursion limit exceeded`. **Do not raise or
disable that limit** — it is load-bearing, and the encoder recursion behind it is
unbounded.

The practical consequence is a **maximum authored nesting depth of roughly 64
layers**. That ceiling has never been a stated product constraint and the user
sees only a generic "renderer failed safely" message when they hit it — see
[Known gaps](#known-gaps).

## Supported alpha runtime

Stated narrowly and honestly. Ambiguous support is worse than narrow support.

**Requires WebGPU.** There is no WebGL fallback and introducing one is an
ADR-level decision (I32). `loadWasmWebGpuRuntime` refuses to return a runtime
unless the module instantiates, an adapter and device are obtained, and a 1×1
render target reads back the expected pixels.

**Requires a secure context** (HTTPS or `localhost`). `./dist/crafty serve`
provisions a local CA for exactly this reason.

**No optional GPU features are requested.** `requestDevice()` is called with no
`requiredFeatures` and no `requiredLimits`, so Crafty runs within default limits
on any conforming adapter. That is the right default and it is why the support
question is mostly "does this browser ship WebGPU at all".

**Verified on hardware.** `scripts/smoke-renderer.mjs` drives headless Chrome
151 against a real `./dist/crafty serve` and asserts, on the production
artifact: WebGPU available, canvas sized, runtime `VERIFIED`, no renderer
warning, draw commands reaching the GPU, the renderer surviving a document
mutation, surviving zoom, and re-initializing after reload. All nine pass; the
negative control (server stopped) fails all nine and exits non-zero, so the gate
can actually fail.

Run it with the server already up — the caller owns the server lifecycle:

```bash
bun run bundle && ./dist/crafty serve &
bun scripts/smoke-renderer.mjs
```

It asserts against the renderer's own **proof chip**, which is already a
machine-readable statement of the thing that matters (`VERIFIED · WASM · v2 ·
294 cmds`). That is why this gate needs no image diffing to catch a dead
renderer. Pixel-level regressions — the missing alpha blend, and any future
visual change — still need reference-image comparison, which this does not do.

**Still unverified on hardware:** device loss and recovery, adapter variation
across vendors, compatibility mode, browsers other than Chromium, and the
WebGPU-unavailable failure UX. The success path is proven; the failure paths are
not.

**CI caveat:** the smoke test has only been run on macOS with a real GPU. GitHub
Actions Linux runners have no GPU, so WebGPU there will need software rasterization
(`--enable-unsafe-swiftshader` or equivalent). That has **not** been verified and
is the one thing to prove before wiring this into CI as a hard gate.

## Generated artifacts policy

| Path | Status |
|---|---|
| `packages/scene-renderer/src/wasm/**` | Source of truth |
| `packages/scene-renderer/pkg/**` | **Generated, gitignored.** Rebuild with `bun run build --filter @crafty/scene-renderer/wasm` |
| `packages/scene-renderer/rust/target/**` | Web/native build cache, gitignored |
| `libcrafty_renderer_native_ffi.a` | **Generated, never committed.** Built into Xcode products by the Curiosity canvas pod |
| `Cargo.lock` | Committed — this is a binary-producing crate |
| `dist/**` | Generated distribution, gitignored |

Because `pkg/` is gitignored, **a clean checkout cannot run the app until the
Rust toolchain has built it once**. That is intentional (no generated binaries in
git) but it means the Rust toolchain is a hard prerequisite for any contributor,
not an optional one.

## Known gaps

Carried here rather than left implicit. None is a correctness defect; each is a
production-readiness gap with a known shape.

1. **Failure paths unverified in a browser.** The success path is now covered by
   `scripts/smoke-renderer.mjs`, but device loss, adapter variation and the
   WebGPU-unavailable UX are not. Related: the smoke test is not yet wired into
   CI pending the SwiftShader question above.
2. **Nesting-depth ceiling is undiagnosed to the user.** Hitting `serde_json`'s
   limit produces a generic renderer failure rather than "this document is
   nested too deeply".
3. **The wasm-bindgen `JsValue` error edge remains untestable off-wasm.** The
   shared safe encoder errors and native C ABI malformed/null-input paths now
   have cargo coverage; browser-only glue still needs `wasm-bindgen-test` in a
   headless browser.
4. **No brotli** on the standalone server (above).
5. **Native iOS simulator presentation is unsupported.** A packet has been presented through a
   Core Animation surface on physical iPad. CoreSimulator reaches Vello frame
   submission but its wgpu Metal adapter lacks `INDIRECT_EXECUTION`, so the
   exact blocker is recorded instead of masked by an alternate renderer.
   Lifecycle, recovery, latency and memory evidence remain outstanding.
6. **No memory-growth or long-session testing** has been performed.
7. **Uncaptured-error reporting is implemented but unverified in a browser.**
   The module installs `device.on_uncaptured_error` and routes the error into
   the host's error callback (`VELLO_RENDER_FAILED:uncaptured:<error>`); no
   GPU error scopes are in use, and the path is untested on real hardware.
8. **No pixel-level reference comparison.** The smoke test proves the renderer
   draws; it cannot prove it draws the *right* thing. This is what would catch
   the missing alpha blend.
