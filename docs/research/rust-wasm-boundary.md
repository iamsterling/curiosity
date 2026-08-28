# Deep Research: Rust/WASM Boundary for the Crafty Renderer

Status: research, August 2026 · Feeds: `docs/editor/wasm-boundary.md`, `docs/editor/renderer-contract.md`, `docs/editor/target-architecture.md`
Constraint: deep research only. No production source, manifests, or docs were modified; nothing committed or pushed.

---

## 1. Scope and method

Inspected in-repo: `packages/scene-renderer-wasm/src/lib.rs`, `packages/scene-renderer-wasm/Cargo.toml`, `packages/scene-renderer-wasm/Cargo.lock`, `packages/scene-renderer-wasm/src/index.ts`, `packages/scene-renderer-wasm/src/webgpu-renderer.ts`, `packages/scene-renderer-wasm/benchmarks/renderer-host-comparison-report.md`, `packages/scene-renderer/src/wasm-bridge.ts`, `packages/scene-renderer/src/draw-protocol.ts`, `packages/scene-renderer/src/index.ts`, `scripts/build-scene-renderer-wasm.mjs`, `scripts/test-scene-renderer-wasm.mjs`, `docs/editor/wasm-boundary.md`, `docs/editor/renderer-contract.md`, `docs/editor/renderer-failure-policy.md`, `docs/editor/target-architecture.md`, `docs/editor/final-gap-analysis.md`, `packages/scene-model/src/index.ts` (`canonicalSceneBytes`).

Primary web sources (all fetched 2026-08-06; exact URLs and version dates inline in §4–§7): wasm-bindgen guide (optimize-size, supported types, raytracing example), the Rust and WebAssembly book (Game of Life: implementing, code-size), rustc platform support for `wasm32-unknown-unknown`, Cargo profiles reference, V8 SIMD article, MDN (Transferable objects, OffscreenCanvas, SharedArrayBuffer, WebAssembly concepts, `WebAssembly.Memory.prototype.grow()`, `GPUDevice.lost`, AbortController), web.dev (OffscreenCanvas, cross-origin isolation), djkoloski/rust_serialization_benchmark, jamesmunns/postcard, rkyv.org, Skia CanvasKit, Flutter web rendering docs, Figma "Rust in production at Figma".

Conventions: **[F]** = fact verified in code or in the cited primary source. **[H]** = hypothesis or extrapolation needing measurement. The Figma "WebAssembly cut load time by 3x" post is cited historically but its original URL returns 404 as of 2026-08-06; it is marked accordingly and not treated as a primary source.

---

## 2. Current boundary snapshot

Facts from the working tree:

- `lib.rs` [F]: `RendererCore` is a `#[wasm_bindgen]` struct with four exported methods: `set_scene(scene_bytes: &[u8], frame_id: &str)`, `set_viewport(...)`, `set_selection`, `render() -> Result<String, JsValue>`. `render()` runs serde_json `to_string` of a `RenderFrame` (`protocolVersion: 1`, `frameId`, `viewport`, `commands: Vec<DrawCall>`, optional `selectionBounds`).
- Transport both ways is JSON [F]: TS encodes the scene with `TextEncoder().encode(canonicalSceneString(scene))` (`canonicalSceneBytes`, scene-model src/index.ts:244); Rust decodes with `serde_json::from_slice`; Rust encodes the packet with `serde_json::to_string`; TS parses with `JSON.parse(core.render())` (webgpu-renderer.ts:113).
- Every `DrawCall` carries a `String` node id, `f64` bounds/transform fields, `f32` fill+opacity, `i64` zIndex, `u32` order [F] — one heap allocation per draw call for the id, and `geometry: &'static str` which serializes to the string `"rect"` on every call.
- Redundant payload [F]: `DrawCall` carries both `fill[3]` (alpha already folded in) and a separate `opacity` field; the JS host consumes only `fill` (webgpu-renderer.ts:38–45). The benchmark report's blocking finding confirms the double-application risk (0.5 vs 0.25 alpha).
- Per-shape JS work remains in the render loop [F]: `webgpu-renderer.ts` iterates `frame.commands` and calls `encoder.encodeRect(draw, frame.viewport)` per command, doing world→screen→clip transforms in JS each frame. The wasm-boundary doc's "no per-shape JS/WASM call in the render loop" is not yet true on the JS side (no per-shape *WASM* call is true).
- Viewport is passed to Rust but unused for geometry [F]: Rust resolves world transforms; viewport transforms happen in JS. Viewport is re-sent to Rust each frame (`set_viewport`) and only echoed back in the packet.
- Build [F]: `scripts/build-scene-renderer-wasm.mjs` runs `cargo build --target wasm32-unknown-unknown --release` then `wasm-bindgen ... --out-dir pkg --target web`. There is **no** `[profile.release]` tuning (no LTO, opt-level, panic, strip), **no** wasm-opt pass, **no** `.cargo/config.toml`, **no** rust-toolchain file. `wasm-opt` and `wasm-pack` are not installed on this machine (verified `which`). `pkg/` and `target/` are gitignored (built on demand).
- Toolchain pinned by lockfile [F]: wasm-bindgen 0.2.126 (Cargo.lock), serde 1.0.229, serde_json 1.0.151, edition 2021. Host rustc 1.97.1 (2026-07-14).
- No revision/sequence/cancellation in the renderer path today [F]: `wasm-bridge.ts` performs three synchronous calls per frame (`setScene` → `setViewport` → `render`) with no revision, sequence, or abort plumbing. Scene `revision` exists in scene-model and is validated on write (src/index.ts:247); a projection-sequence pattern once existed in the retired vscode-extension webview (ADR 0016) but the renderer bridge does not use either.
- Failure handling [F]: `RendererResult` has structured diagnostic codes; `device.lost` is observed (webgpu-renderer.ts:86); the JS side wraps the whole render in try/catch with a fixed message; Rust returns `Result<_, JsValue>` with stringified serde errors.
- Validated `set_viewport` [F]: Rust rejects non-finite values, `zoom <= 0`, non-positive sizes; `set_scene` rejects frames not present. Color parsing [F]: `parse_hex` *silently substitutes* a fallback gray on malformed input — the wasm-boundary doc claims "malformed colors fail closed"; today they fail *loudly nowhere* (discrepancy, §3.8).

---

## 3. Gaps (each: what exists, why it matters)

1. **JSON is the only transport, both directions, every frame.** The scene snapshot is re-serialized to JSON bytes, re-deserialized by Rust, and the packet is re-serialized to JSON and parsed by JS on every render — including for a 1-node edit. §4.2 quantifies serde_json's cost (≈5–26× slower than binary formats, up to 4× larger, on reference hardware).
2. **No changed-node batches.** Every render re-encodes the full layer tree and re-sorts all commands (`DrawEncoder::submit` sort). The renderer-contract already budgets "packet synchronization under 16 ms for a 1,000-node changed batch"; no incremental path exists.
3. **String node ids and f64 fields inflate every packet and allocate per draw.** One `String` clone per command per frame; f64 doubles for fields that are geometrically f32-precise at editor scale.
4. **Viewport transform runs in JS per frame.** Rust resolves world geometry, JS re-transforms every vertex every frame — the exact per-shape loop the architecture doc excludes; it is also the part that would be a vertex-shader uniform.
5. **No revision/sequence/cancellation at the boundary.** Docs specify `(documentRevision, requestSequence)` staleness rejection and cooperative cancellation; the synchronous bridge has neither. Safe only because today's path is synchronous — it will matter the moment rendering moves to a worker (§4.4).
6. **Unmeasured Rust path.** The repo's comparison report measures JS-host encoding only (2.8794 ms current host vs 0.6936 ms TypeGPU candidate for 10,000 rects; 0.2794 ms vs 0.0402 ms for a 1,000-node batch, headless Node). The Rust JSON encode/decode path (the actual boundary cost) is not benchmarked anywhere.
7. **No build-profile tuning, no wasm-opt, no size telemetry.** The wasm-bindgen guide says to measure the post-`wasm-bindgen` artifact (`foo_bg.wasm`), not the cargo output; there is no size gate and no compression measurement. The Game-of-Life reference shows ~41% shrink from LTO+`opt-level="z"`+`wasm-opt -Oz` (29,410 → 17,317 B; 9,045 B gzipped).
8. **"Fail closed" is only partially implemented.** Viewport and frame-id validation exist; malformed colors silently fall back; unknown protocol versions are checked in JS (`frame.protocolVersion !== DRAW_PROTOCOL_VERSION`) but there is no scene-size / node-count / depth cap before `set_scene` (a hostile or corrupt scene can trigger unbounded allocation and stack depth — `encode_layers` is recursive).
9. **Opacity double-encoding.** `fill[3]` and `opacity` both carry alpha; the existing benchmark flags the 0.5-vs-0.25 mismatch. A clean packet should carry one.
10. **No diagnostics beyond counts.** Evidence exposes `protocolVersion` and `commandCount`; no encode duration, packet bytes, dropped-stale batches, or GPU error-scope data (§4.10).

---

## 4. Alternatives and primary sources

### 4.1 wasm-bindgen / wasm-pack / build shape

- The wasm-bindgen guide's "Optimizing for Size" (rustwasm.github.io/docs/wasm-bindgen/reference/optimize-size.html; the rustwasm org was sunset 2025-07-21 per blog.rust-lang.org/inside-rust/2025/07/21/sunsetting-the-rustwasm-github-org/, docs moved to wasm-bindgen.github.io/wasm-bindgen/): **measure the post-bindgen `foo_bg.wasm`, not cargo's raw output** — the wasm-bindgen CLI strips unneeded functionality; the generated JS is expected to be minified by the bundler.
- The Rust+WebAssembly book, "Shrinking .wasm Size" (rustwasm.github.io/docs/book/game-of-life/code-size.html): `[profile.release] lto = true, opt-level = "z"` + `wasm-opt -Oz` took the tutorial from 29,410 → 17,317 B (~41%); gzip -9 → 9,045 B. It also shows removing the allocator entirely (`#![no_std]`, static buffers) as the extreme step — not appropriate here.
- wasm-bindgen supported types (rustwasm.github.io/wasm-bindgen/reference/types.html + `reference/types/number-slices.html`): `Vec<f32>`/`&[f32]` map to `Float32Array` (zero-copy both ways for in-memory views); `String`/`&str` cross the boundary as JS strings (copy); `*const T` pointers are exposed raw for direct linear-memory reads. The Game-of-Life book's "Rendering to Canvas Directly from Memory" pattern (rustwasm.github.io/docs/book/game-of-life/implementing.html) is the canonical zero-copy pattern: Rust returns a pointer+length, JS builds `new Float32Array(memory.buffer, ptr, len)` — no copy, no serialization.
- wasm-pack (rustwasm.github.io/docs/wasm-pack/) is packaging/wrapper tooling; the repo's direct `cargo`+`wasm-bindgen` script is fine and equivalent for a workspace that wants deterministic flags. The relevant upgrade is what flags are passed, not which wrapper.
- Threads constraint on the build: the raytracing example (rustwasm.github.io/docs/wasm-bindgen/examples/raytrace.html) requires nightly `-Zbuild-std` with `-C target-feature=+atomics,+bulk-memory,+mutable-globals`, `--target web`/`no-modules` only, and documents that the **main thread can never block** (no mutex acquisition), no TLS destructors, no thread exit, and that rayon-style pools do not map onto web workers directly.

### 4.2 serde JSON vs binary packets

- Repo today: serde_json 1.0.151 with `String` ids — worst case for JSON (string-heavy, per-element).
- djkoloski/rust_serialization_benchmark (github.com/djkoloski/rust_serialization_benchmark; results last updated 2026-08-02, rustc 1.99.0-nightly, AMD EPYC 7763, Linux): on the string-heavy `log` dataset, serde_json 1.0.150 serializes 3.99 ms / deserializes 6.03 ms into 1.83 MB; postcard 1.1.3: 0.43 ms / 2.31 ms into 0.72 MB; rkyv 0.8.16: 0.25 ms / 1.54 ms into 1.01 MB. On the numeric `mesh` dataset: serde_json 85.98 ms / 99.75 ms into 26.2 MB vs postcard 0.49 ms / 1.08 ms into 6.0 MB vs bincode 2.0.1 2.42 ms / 0.79 ms / 6.0 MB vs rkyv 0.15 ms / 0.15 ms / 6.0 MB (rkyv numbers are zero-copy; no deserialize-into-owned needed). Reference numbers on one machine — not our hardware, but the ratios (tens of ×) are consistent across datasets.
- postcard (github.com/jamesmunns/postcard): `#![no_std]` serde-compatible; stable documented wire format since v1.0.0 (spec at postcard.jamesmunns.com); varints; ~1.5k stars; caveat: some serde attributes break it (`flatten`, `skip_serializing_if`; `skip` on non-last enum variants).
- rkyv (rkyv.org): zero-copy (de)serialization, `bytecheck` for validation, endian-safe via `rend`; the fastest option and the only one that is pure-view (no copy) on read — matches the "Rust owns packet, JS reads it" shape.
- bincode 2 (github.com/bincode-org/bincode): compact, fast, but not zero-copy and (as of 2.x) config-laden; fine middle ground.
- The wasm-bindgen book's interface-design rule (game-of-life/implementing.html): minimize copies and serialization across the boundary; keep large structures as opaque handles or raw linear memory and return small results — i.e., a **versioned binary packet written into linear memory, read by JS as a typed-array view, is the canonical shape**; JSON across the boundary is the anti-pattern the tutorial explicitly avoids ("generating a String in Rust and having wasm-bindgen convert it to a JavaScript string makes unnecessary copies").

### 4.3 Transferable buffers

- MDN Transferable objects (developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects, last modified 2025-09-18): transferring an `ArrayBuffer` via `postMessage(msg, [buffer])` is a zero-copy detach/attach; the sender's view detaches (byteLength 0). Typed arrays are serializable but not transferable — transfer the underlying `.buffer`.
- Pattern for workers: the worker owns a scratch `ArrayBuffer`; main thread transfers a fresh buffer per batch, worker returns it via transfer — memory ping-pong without copies. [H] Transfer cost is negligible vs structured-clone copy for payloads ≳ a few hundred KB; below that, copy wins (no measured threshold in primary sources; heuristic, needs our own measurement if workers arrive).

### 4.4 SharedArrayBuffer / Atomics / workers / OffscreenCanvas ownership

- MDN SharedArrayBuffer (developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer, last modified 2026-02-10; Baseline since December 2021): requires a **secure context + cross-origin isolation**; otherwise `postMessage` **throws** for SAB and the constructor is hidden. `Atomics` and wasm atomic instructions are unconditionally available; sharing is the gated part. Growable SABs (`maxByteLength`, `grow()`) exist; can only grow, never shrink.
- web.dev "A guide to enable cross-origin isolation" (web.dev/articles/cross-origin-isolation-guide, last updated 2021-02-09): enable with `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` (credentialless COEP since Chrome 96); **COOP breaks OAuth/popup flows** and COEP blocks all non-opted-in cross-origin subresources; verify with `self.crossOriginIsolated`.
- web.dev OffscreenCanvas (web.dev/articles/offscreen-canvas, by Tim Dresser, last updated 2023-12-08; support Chrome 69/79, Safari 105, Firefox 16.4): `transferControlToOffscreen()` hands the canvas to a worker; `OffscreenCanvas` is transferable; `requestAnimationFrame` works in workers; heavy canvas work off the main thread removes jank. MDN OffscreenCanvas (last modified 2024-10-26; Baseline widely available since March 2023): rendering contexts usable in workers; `transferToImageBitmap()` returns an `ImageBitmap` for cheap main-thread compositing.
- wasm-bindgen raytrace example (see §4.1): threads require COOP/COEP, nightly build-std, and the main thread can never block; worker-owned wasm is the recommended shape ("run Wasm exclusively in web workers and run JS on the main thread").
- WebGPU in workers: `GPUDevice.lost` (developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost, last modified 2025-06-18) is "available in Web Workers"; MDN's WebGPU API surface includes `WorkerNavigator.gpu`. The WebGPU spec (w3.org/TR/webgpu/, §device-loss, §error-scopes) requires handling device loss by recreating all device-owned resources.
- Ownership conclusion: two sound shapes. (a) **Main-thread WebGPU + worker wasm encoder** (worker writes a binary packet into a transferable buffer; main thread uploads) — needs no COOP/COEP. (b) **Worker-owned WebGPU via OffscreenCanvas** (transfer the canvas, request a device inside the worker) — needs no SAB either; only *shared* memory between the two contexts would need SAB, i.e., ring-buffer command streams. SAB/atomics should be the last resort, because COOP/COEP is an app-wide header decision with OAuth/popup fallout.

### 4.5 SIMD

- V8 "Fast, parallel applications with WebAssembly SIMD" (v8.dev/features/simd, published 2020-01-30, updated 2022-11-06): fixed-width 128-bit SIMD, phase 4; available by default Chrome 91+/Firefox 89+; Rust: `RUSTFLAGS="-C target-feature=+simd128"`; LLVM autovectorizes at opt-level 2/3 when simd128 is on; `wasm-feature-detect` for dual builds; `std::arch::wasm32` intrinsics (nightly) or `packed_simd`.
- rustc platform-support for `wasm32-unknown-unknown` (doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html): **simd128 is NOT enabled by default**; enabling via `-C target-feature=+simd128` bakes instructions in, so a SIMD build must be served only to engines that support it (feature-detect + dual build, or `#[cfg(target_feature = "simd128")]` instead of `#[target_feature]`, which is discouraged for wasm). Default features today: multivalue, mutable-globals, reference-types, sign-ext, nontrapping-fptoint + bulk-memory (Rust 1.87.0+, LLVM 20+).
- [F] Current crate has no numeric hot loop that obviously benefits (transforms are per-node, branch-heavy, f64). [H] SIMD pays off only after (a) f32 geometry and (b) batch transforms of thousands of nodes; measure first.

### 4.6 LTO / size

- Cargo profiles reference (doc.rust-lang.org/cargo/reference/profiles.html): release defaults `opt-level = 3`, `lto = false`, `codegen-units = 16`, `panic = "unwind"`, `strip = "none"`; `lto = "thin"` or `true`, `opt-level = "s"|"z"`, `codegen-units = 1`, `strip = "debuginfo"|"symbols"` are all valid knobs; `"z"` also disables loop vectorization (relevant to §4.5).
- Game-of-Life numbers in §4.1: ~41% with LTO + "z" + wasm-opt -Oz.
- wasm-opt (binaryen) is a separate tool (installed via npm `binaryen` or brew); not present in this repo today. It is what applies `-Oz` post-bindgen.

### 4.7 Memory growth / allocator

- MDN `WebAssembly.Memory.prototype.grow()` (developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Memory/grow, last modified 2026-05-14; Baseline since October 2017): pages are 64 KiB; `grow()` detaches **all existing JS views of the old buffer** (even `grow(0)`); shared memories keep views valid but lengths stale. i64-address memories exist in the API (`address: "i64"`) but broad engine support is limited — not needed at this scale. Production gotcha: any JS code holding `new Float32Array(memory.buffer, ptr, len)` across a frame that triggers allocation must re-fetch `memory.buffer` — a very common bug with the zero-copy pattern.
- rustc wasm32-unknown-unknown page: **`dlmalloc` is the default global allocator** for this target; `std::thread::spawn` panics; HashMap is not randomized (deterministic hash) on this target.
- Allocator options: keep dlmalloc (std default, no decision); `wee_alloc` (crates.io/crates/wee_alloc) is **deprecated** and shouldn't be adopted; `bumpalo` (crates.io/crates/bumpalo) arena is the standard "allocate a frame, free the whole arena" trick for per-frame scratch. [H] per-frame allocations in `render()` are small (Vec<DrawCall>); unless profiling shows allocator churn, dlmalloc is correct. If we preallocate capacity (`Vec::with_capacity`) and reuse the encoder across frames, allocation count drops to zero after warm-up.

### 4.8 Panic / error handling

- rustc wasm32-unknown-unknown page: the target compiles with **`-Cpanic=abort` by default** (no catch-unwind); the wasm exception-handling proposal reached stabilization **mid-2025**, and `-Cpanic=unwind` is now possible but requires nightly `-Zbuild-std` plus `-Cllvm-args=-wasm-use-legacy-eh=false` (as of 2025-10-03 LLVM still defaults to legacy exception instructions); std shipped via rustup is panic=abort. Practical consequence: an uncaught panic traps the whole wasm instance; the JS `try/catch` in `wasm-bridge.ts` will catch the throw but the instance is poisoned. With `Result`-returning exports (current design) panics are avoided by construction; the correct guard is `console_error_panic_hook` (crates.io/crates/console_error_panic_hook) for debug diagnosability plus fail-closed validation (doc is right to keep string error messages constant, per renderer-failure-policy).
- Figma's "Rust in production at Figma" (figma.com/blog/rust-in-production-at-figma, 2018-05-02): errors are hard to debug without stack traces; their mitigation (convert to strings with line info at the boundary) matches the current `JsValue::from_str(&format!(...))` approach.

### 4.9 Cancellation and revision sequencing

- MDN AbortController (developer.mozilla.org/en-US/docs/Web/API/AbortController, last modified 2025-09-17; Baseline since March 2019; available in workers): the standard signal mechanism; `AbortSignal` is what fetch/streams consume. In-repo, `workbench-projection.ts` already uses a sequence counter + correlation ids; scene-model validates `revision` on write. The renderer-contract/target-architecture already spec `(documentRevision, requestSequence)` rejection of stale async results and cooperative cancellation at worker boundaries — these are *documented targets*, absent from the renderer path today.
- Cancellation model for a wasm worker: (a) sequence-stamped requests, discard late results [F-spec, H-impl]; (b) cooperative checkpoints in the encode loop (e.g., every N nodes check a `u32` in shared/transferred memory or an imported JS callback) — with plain transferable buffers the worker can't be interrupted mid-encode except by `worker.terminate()`, which is heavy; (c) encode budget: cap work per task and split large encodes into chunked tasks [H].

### 4.10 Diagnostics

- WebGPU error scopes (`pushErrorScope`/`popErrorScope`, `GPUUncapturedErrorEvent`, `device.lost`) — spec w3.org/TR/webgpu/ §error-scopes / §device-loss; MDN GPUDevice/lost (2025-06-18): loss can happen at any time, often transient; recreate device + all device-owned resources; `GPUDeviceLostInfo.reason` distinguishes `destroyed` from real loss. The repo already observes `device.lost` and has a structured diagnostics contract (failure-policy). Gaps: no error-scope wrapping around buffer upload/submit (which would catch `GPUValidationError` with a message the current blanket catch discards), no packet-level diagnostics (encode time, bytes, dropped-stale count).

### 4.11 Editor/rendering references (industry)

- Skia CanvasKit (skia.org/docs/user/modules/canvaskit/, © 2026): production-grade Skia compiled to wasm, WebGL-encapsulated `SkSurface` drawing to canvas, fuzz-tested. Demonstrates the mature "native engine in wasm, canvas as surface" shape.
- Flutter web rendering (docs.flutter.dev/platform-integration/web/renderers, page for Flutter 3.44.7, updated 2026-07-23): Flutter's web drawing layer is Dart over DOM/Canvas with WebAssembly compilation available — i.e., a modern editor-grade framework chose **not** to put its core drawing in Rust/wasm, only CPU-heavy and platform pieces.
- Figma (figma.com/blog/rust-in-production-at-figma, 2018-05-02): Rust in production, 10× faster document serialization, per-document processes; plus the widely cited but now-404 "WebAssembly cut Figma's load time by 3x" (figma.com/blog/webassembly-cut-figma-load-time-by-3x/ — 404 as of 2026-08-06; cited from memory as historical context only, marked [H]).
- Pattern summary from these: GPU resource ownership stays in the browser API layer (JS/TS); wasm is used for deterministic CPU work (packets, tessellation, layout) and for startup-size wins; worker ownership is used for anything >a few ms per frame.

---

## 5. Measured thresholds

Repo-measured (renderer-host-comparison-report.md; Vitest 3.2.7, headless Node, macOS arm64, CPU encoding only — no browser/GPU):

| Fixture | Budget | Current JS host mean | TypeGPU candidate mean |
| --- | ---: | ---: | ---: |
| 10,000 rectangles | 50 ms | 2.8794 ms | 0.6936 ms |
| 1,000-node changed batch | 16 ms | 0.2794 ms | 0.0402 ms |

- The **Rust JSON path is unmeasured** (see §3.6). The relevant next measurements are: serde_json round-trip in wasm for the 10k-rect fixture; binary-packet round-trip; and the JS `JSON.parse` cost (which today runs inside the 50 ms budget on the main thread).
- Blocking finding already in-repo: translucent alpha mismatch (0.5 vs 0.25) between hosts — parity must be resolved before any host change is trusted.

Literature thresholds (djkoloski/rust_serialization_benchmark, results 2026-08-02, AMD EPYC 7763, rustc 1.99.0-nightly — reference machine, not ours):

| Dataset | serde_json 1.0.150 ser/des/size | postcard 1.1.3 ser/des/size | bincode 2.0.1 ser/des/size | rkyv 0.8.16 ser/des/size |
| --- | --- | --- | --- | --- |
| log (string-heavy) | 3.99 ms / 6.03 ms / 1.83 MB | 0.43 ms / 2.31 ms / 0.72 MB | 0.36 ms / 2.17 ms / 0.74 MB | 0.25 ms / 1.54 ms / 1.01 MB |
| mesh (numeric) | 85.98 ms / 99.75 ms / 26.2 MB | 0.49 ms / 1.08 ms / 6.0 MB | 2.42 ms / 0.79 ms / 6.0 MB | 0.15 ms / 0.15 ms / 6.0 MB |

Size thresholds (Rust+WebAssembly book, code-size chapter): LTO + `opt-level = "z"` + `wasm-opt -Oz`: 29,410 → 17,317 B (~41%); gzip -9 → 9,045 B.

---

## 6. Security constraints

- **SharedArrayBuffer**: secure context + cross-origin isolated required; without the headers `postMessage` throws and the constructor is hidden (MDN SAB, 2026-02-10; web.dev COOP/COEP guide, 2021-02-09). Enabling COOP/COEP is app-wide: COOP `same-origin` breaks OAuth/popup communication; COEP `require-corp` blocks non-opted-in cross-origin subresources. **Decision gate before any SAB use.**
- WebGPU: secure context only; workers supported (MDN GPUDevice/lost).
- The boundary is the trust line: TS sends *validated* scenes; but `set_scene` today has no size/depth cap, and `encode_layers` recursion is unbounded — hostile input can allocate arbitrarily or overflow the call stack. Add caps (node count, depth, byte length) before exposing the module to untrusted documents. [F gap]
- "Fail closed" (docs/editor/wasm-boundary.md): non-finite numerics, unknown protocol versions — done; malformed colors — currently silent fallback, not failure; oversized scenes — absent. Close both.
- Error surfaces: keep messages constant (failure-policy), don't leak adapter/shader internals — already the contract; the `format!("Scene decode failed: {error}")` today embeds serde error text (path/offset info) — acceptable per policy, but note it is user-visible.
- Wasm sandbox: code runs in the standard sandbox; no special containment needed beyond normal validation (MDN WebAssembly concepts: sandboxed, same-origin/permissions policies enforced).
- Deterministic hash (HashMap unrandomized on this target, rustc docs) is a correctness-notice for untrusted input only if a HashMap is keyed by attacker data — currently no HashMap in the hot path.

---

## 7. Recommended boundary

Keep the coarse-grained shape (doc-aligned) and change the mechanics:

1. **Transport: versioned binary packet into linear memory, zero-copy read.** Rust writes the packet (SoA layout: header {protocolVersion, packetRevision, commandCount, byteLength, viewport...}, then arrays: zIndex u32, order u32, geometry u8, fill f32x4, bounds f32x4, transform f32x6, nodeId as u32 index into an id table) into a reusable preallocated buffer and returns `(ptr, len)`; JS reads via `new Uint8Array(memory.buffer, ptr, len)` — no JSON, no copy, no `String` per command. Options: hand-rolled SoA (recommended for the hot path, it is a display list not a document) or postcard/rkyv for the cold path (scene ingest), where rkyv's zero-copy view + `bytecheck` is attractive for large scenes. **Keep serde_json only for debug/export paths.** [F for pattern, H for choice of encoder until measured]
2. **f32 geometry end-to-end** (keep f64 only where numerically required — viewport pan/zoom at extreme values), one alpha channel (fix the `fill[3]`/`opacity` double-encoding), numeric ids or a compact id table instead of per-command strings.
3. **Move the viewport transform to a vertex uniform.** Rust emits world-space quads keyed by scene revision; JS uploads the viewport as a `mat3` uniform per frame. The vertex buffer then only changes on scene edits (changed-node batches), eliminating the per-shape JS loop (gap §3.4) and making "no per-shape JS call in the render loop" actually true.
4. **Incremental changed-node batches (protocol v2).** TS sends `{ documentRevision, sequence, changedNodeIds, ops }`; Rust applies deltas to a retained scene, re-encodes only affected subtrees, maintains the stable sort incrementally, emits `packetRevision` + dirty region. Full re-encode stays as the correctness fallback. Reuse the existing `capacity-resource-cache.ts` pattern for GPU buffers keyed by stable node ids; update buffers with `writeBuffer` offsets per dirty batch.
5. **Sequencing + cancellation:** stamp every request `(documentRevision, requestSequence)`; the worker discards stale results (documented target, implement at the bridge). Cancellation is cooperative: budgeted encode chunks + sequence checks; AbortController in the TS layer; `worker.terminate()` as the last resort, never per-frame. [F-spec, H-impl details]
6. **Workers/OffscreenCanvas: defer, with a precondition.** Keep WebGPU + wasm on the main thread while the encode path is sub-ms (current CPU-encoding benchmarks say it is). When moving: **worker-owned wasm encoder + transferred binary buffers** first (no COOP/COEP); **worker-owned WebGPU via OffscreenCanvas** second, only if main-thread upload becomes a measured bottleneck; **SAB/atomics ring buffer** last — it forces the app-wide COOP/COEP decision and its OAuth/popup fallout. `transferToImageBitmap` compositing is available without any headers if only the canvas content needs to cross.
7. **Build:** add `[profile.release]` with `lto = "thin"` (or `"fat"` — measure link time), `codegen-units = 1`, `panic = "abort"`, `strip = "debuginfo"` (keep symbols for profiling builds via a custom profile), keep `opt-level = 3`; add a wasm-opt `-Oz` pass (binaryen) after wasm-bindgen; record and gate `pkg/*_bg.wasm` + gzip sizes (expect ~40% shrink per the reference numbers). Reconsider `opt-level = "z"` only if size becomes the binding constraint.
8. **Panic strategy:** keep `panic = "abort"` (unwind requires nightly build-std + EH flags — not worth it for a Result-returning core); install `console_error_panic_hook` in debug; all exports stay `Result`-shaped; add scene caps (node count, depth, byte length) so failure modes are return-values, not traps.
9. **Memory discipline:** reuse the encoder buffer across frames (zero allocations after warm-up); if JS holds views over wasm memory, re-fetch `memory.buffer` after any call that may allocate (growth detaches views — even `grow(0)`); prefer `Vec::with_capacity` and reserve headroom so growth is rare; dlmalloc stays (wee_alloc deprecated); bumpalo only if profiling demands.
10. **Diagnostics:** extend evidence with encode duration, packet bytes, `packetRevision`, dropped-stale count; wrap upload/submit in WebGPU error scopes and surface `GPUValidationError`/`GPUOutOfMemoryError` messages with the existing codes instead of the blanket catch.
11. **SIMD:** only after f32 conversion and only with a measured loop (batch transform/copy of ≥4 f32 lanes). If adopted: feature-detect + dual build or `#[cfg(target_feature = "simd128")]` variants; note `opt-level = "z"` disables loop vectorization (don't combine "z" with SIMD plans).

---

## 8. Stop/go experiments (each must be measured before the corresponding production change)

| # | Experiment | Stop condition | Go condition | Effort |
| --- | --- | --- | --- | --- |
| E1 | Benchmark the actual Rust boundary: serde_json encode+decode of the 10k-rect fixture in wasm (headless browser, not Node) vs a hand-rolled SoA binary packet with `(ptr,len)` return. | JSON round-trip < 10% of the 50 ms budget and < 1 ms | Binary packet beats JSON by ≥5× wall-clock **and** JS `JSON.parse` shows in the profile | S–M |
| E2 | Viewport-uniform experiment: Rust emits world-space quads once; JS submits per-frame uniform only. Measure pan/zoom frame time vs today's per-shape JS loop. | Per-shape JS loop < 0.5 ms at 10k rects and no GC pressure | Uniform path ≥2× faster or removes visible GC/encode jank | M |
| E3 | Changed-node batch experiment: 1,000-node edit → packet sync vs full re-encode; measure against the 16 ms budget with the binary packet. | Full re-encode with binary packet < 4 ms | Delta encode ≥3× faster and correctness parity (same pixel hash) | M |
| E4 | Size gate: LTO thin/fat + wasm-opt -Oz on the current crate; record wasm + gzip deltas. | Current crate < 100 KB gzip (no change needed) | ≥30% shrink or size budget breached | S |
| E5 | Allocator check: allocation count + `memory.grow` events per frame with the reused-encoder design at 10k rects. | < 10 allocations and 0 grows per frame | (n/a — go on reuse regardless) | S |
| E6 | Worker move trial (only if E1–E3 say main-thread is a problem): wasm encoder in a worker, transferred buffers, sequence-stamped results. Measure round-trip latency + jank. | Round-trip (postMessage+encode+transfer) > main-thread synchronous path | Worker path ≤ main-thread path with 0 jank | L |
| E7 | SIMD trial: f32 batch-transform of 10k quads with/without `+simd128` (dual-build via feature-detect). | Speedup < 1.5× | ≥2× on the measured loop | S–M |

Correctness gate for every host/packet change: the deterministic pixel-reference hash methodology already in `renderer-host-comparison-report.md` (SHA-256 of fixture output), with the alpha mismatch resolved first.

---

## 9. Facts vs hypotheses

Facts:
- Current boundary is JSON both ways, per frame, with string ids, f64 fields, redundant alpha channels; viewport transform runs in JS per shape (code inspection, §2).
- No revision/sequence/cancellation, no changed-node batches, no size caps, no build-profile tuning, no wasm-opt; Rust path unbenchmarked (inspection; §2, §3).
- Reference benchmarks: serde_json 5–26× slower than postcard/bincode/rkyv and 2.5–4× larger on published datasets (rust_serialization_benchmark, 2026-08-02); ~41% size shrink from LTO+"z"+wasm-opt (Rust/WASM book); threads need nightly build-std + COOP/COEP and the main thread can never block (wasm-bindgen raytrace doc); SAB gated on cross-origin isolation since Chrome 92 / 2021 (MDN, web.dev); grow() detaches buffer views (MDN 2026-05-14); dlmalloc is the wasm32-unknown-unknown default and wee_alloc is deprecated (rustc docs, crates.io); wasm exception handling stabilized mid-2025 but unwind needs nightly flags as of 2025-10-03 (rustc docs); wasm-bindgen docs moved from rustwasm.github.io after the org sunset 2025-07-21; the Figma 3×-load-time post is 404 as of 2026-08-06.
- Repo budgets: 50 ms / 16 ms / 250 ms and measured 2.8794 / 0.2794 ms JS-host encoding means (report in-tree).

Hypotheses (labeled in §4–§8 and requiring E-experiments):
- Binary SoA packet beats JSON at this boundary by ≥5× in wasm.
- Viewport-as-uniform removes visible jank/GC.
- Delta batches beat full re-encode at 1,000-node scale with parity.
- Worker round-trip stays competitive with a synchronous main-thread path.
- SIMD pays off only after f32 conversion.
- Copy-vs-transfer threshold is "a few hundred KB" (no primary source).
- Figma's 3×-load-time figures (unverifiable now; original 404).

---

## 10. Sources (all accessed 2026-08-06)

1. wasm-bindgen guide — Optimizing for Size: rustwasm.github.io/docs/wasm-bindgen/reference/optimize-size.html (docs moved to wasm-bindgen.github.io; rustwasm org sunset 2025-07-21).
2. wasm-bindgen guide — Supported Types: rustwasm.github.io/docs/wasm-bindgen/reference/types.html.
3. wasm-bindgen guide — Parallel Raytracing (threads): rustwasm.github.io/docs/wasm-bindgen/examples/raytrace.html.
4. Rust and WebAssembly book — Implementing Life / Shrinking .wasm Size: rustwasm.github.io/docs/book/game-of-life/implementing.html, code-size.html.
5. rustc book — wasm32-unknown-unknown platform support: doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html.
6. Cargo book — Profiles: doc.rust-lang.org/cargo/reference/profiles.html.
7. V8 — Fast, parallel applications with WebAssembly SIMD: v8.dev/features/simd (2020-01-30, updated 2022-11-06).
8. MDN — Transferable objects: developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects (2025-09-18).
9. MDN — OffscreenCanvas: developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas (2024-10-26).
10. web.dev — OffscreenCanvas: web.dev/articles/offscreen-canvas (2023-12-08).
11. MDN — SharedArrayBuffer: developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer (2026-02-10).
12. web.dev — A guide to enable cross-origin isolation: web.dev/articles/cross-origin-isolation-guide (2021-02-09).
13. MDN — WebAssembly.Memory.prototype.grow(): developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Memory/grow (2026-05-14).
14. MDN — GPUDevice.lost: developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost (2025-06-18).
15. MDN — AbortController: developer.mozilla.org/en-US/docs/Web/API/AbortController (2025-09-17).
16. djkoloski/rust_serialization_benchmark: github.com/djkoloski/rust_serialization_benchmark (results 2026-08-02).
17. postcard: github.com/jamesmunns/postcard; spec postcard.jamesmunns.com.
18. rkyv: rkyv.org.
19. Figma — Rust in production at Figma: figma.com/blog/rust-in-production-at-figma (2018-05-02).
20. Skia — CanvasKit: skia.org/docs/user/modules/canvaskit/.
21. Flutter — Web support: docs.flutter.dev/platform-integration/web/renderers (Flutter 3.44.7; 2026-07-23).
22. In-repo: docs/editor/wasm-boundary.md, renderer-contract.md, renderer-failure-policy.md, target-architecture.md, final-gap-analysis.md; benchmarks/renderer-host-comparison-report.md; packages/scene-renderer-wasm/*; scripts/build-scene-renderer-wasm.mjs.
