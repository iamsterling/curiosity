# Vello wgpu Dependency Cost

Module-size record for adding the vello-classic wgpu line (`vello` + `vello_encoding` + `wgpu`) to the encoder module (openspec change `vector-path-rendering`, sections 4 and 5). Measured, environment-noted — **no budget is asserted** (`docs/architecture/performance.md`). The research planning figure (vello-vector-rasterization.md §8: "~0.5–1 MB is the honest planning figure for vello + vello_encoding + wgpu-webgpu on wasm32") is now measured against Crafty's real module, at both the encoder-only step (section 4) and the full renderer+present step (section 5).

## Recorded environment

- OS: macOS 27.0 (26A5368g), arm64; CPU: Apple M5 (10 cores) — same machine as `vello-cpu-prototype-report.md`
- rustc 1.97.1 (8bab26f4f 2026-07-14), rustup stable, `wasm32-unknown-unknown` via the pinned toolchain (`rust-toolchain.toml`)
- wasm-bindgen 0.2.126 (CLI + crate, matched pair)
- Pinned deps (Cargo.toml + Cargo.lock): **vello 0.9.0** (`default-features = false, features = ["wgpu_default"]`), **vello_encoding 0.9.0**, **wgpu 29.0.4**, wasm-bindgen `=0.2.126`; transitive: kurbo 0.13.1, peniko 0.6.1, color 0.3.3, naga 29.0.4, skrifa 0.42.x (unconditional in vello 0.9.0); wasm32-only: js-sys/web-sys/wasm-bindgen-futures 0.3.x/0.4.x (lockfile-resolved)
- Build: `cargo build --release --target wasm32-unknown-unknown` + `wasm-bindgen --target web --out-dir pkg`, release profile (opt-level=3, lto=fat, codegen-units=1, strip)
- Branch: `architecture-docs-and-next-server`, working tree, 2026-08-07 (both records)

## Module sizes

`crafty_renderer_wasm.wasm` (cargo artifact, raw bytes; gzip = `gzip -c | wc -c`) — the same artifact the vello_cpu record measured:

| Build | Raw wasm | Gzip | Source |
|---|---:|---:|---|
| Pre-Vello, current release profile | 171,865 | 71,523 | Cargo.toml `[profile.release]` comment, recorded earlier on this crate |
| With vello_cpu 0.2.0 (std, u8_pipeline) | 200,775 | 79,059 | `vello-cpu-prototype-report.md`, 2026-08-07 |
| With vello 0.9.0 + vello_encoding + wgpu 29 (encoder only) | 1,265,916 | 295,346 | this record, section 4, 2026-08-07 |
| **With the wgpu device/surface + Vello renderer + present pipeline (section 5)** | **2,640,302** | **675,993** | this record, section 5, 2026-08-07 |

**Delta vs the pre-Vello module (section 5): +2,468,437 raw (+1,436%), +604,470 gzip (+845%). Delta vs the section-4 module: +1,374,386 raw (+109%), +380,647 gzip (+129%).**

The section-5 row is the first time wgpu is actually *used* by the module: section 4 added the wgpu/vello dependencies but nothing reached them, so LTO stripped nearly all of wgpu-core and the Vello renderer. This row makes the device, the surface, Vello's renderer (its compute pipelines, `AaSupport::area_only` shaders) and the present pipeline live, so the real cost of the wgpu line lands here. The comparison rows are profile-matched; the delta isolates the dependency step.

### The shipped artifact is what the browser downloads

`wasm-bindgen` post-processes the cargo artifact and drops its own metadata sections (`custom:__wasm_bindgen_unstable` ≈ 499 KB + the export section ≈ 210 KB — measured by section dump, 2026-08-07). The shipped module (`pkg/crafty_renderer_wasm_bg.wasm`) is:

| Artifact | Raw | Gzip |
|---|---:|---:|
| Section 4: shipped `crafty_renderer_wasm_bg.wasm` | 299,410 | 106,131 |
| **Section 5: shipped `crafty_renderer_wasm_bg.wasm`** | **1,637,283** | **484,923** |

The pre-change shipped baseline was 174,779 / 72,625 (`docs/architecture/renderer-build.md` "Artifact baseline") — the full module delta against the pre-Vello shipped module is **+1,462,504 raw / +412,298 gzip**, of which section 5 (renderer + present) contributes **+1,337,873 raw / +378,792 gzip**. The section-5 row is what the browser downloads once, immutably cached (`renderer-build.md` "Serving"): the wgpu line's cost is a one-time download, and the ~378 KB gzip delta is the price of owning device, surface, render and present in Rust instead of a TypeGPU host. The research's 0.5–1 MB planning figure covered vello + vello_encoding + wgpu-webgpu; the measured shipped module lands above it once the renderer is actually reachable — Graphite's 25 MB remains the counterexample that this is still the right trade.

### The encoder stays reachable in the module

The size record is only meaningful because the encoder is reachable from the wasm exports: `RendererCore::encode_frame` (the encode-level parity hook, task 7.1) pins `vello_encoder` into the binary. Without an export, LTO would strip the encoder and the record would measure nothing.

### First-frame GPU timings

Not measurable in this environment (no browser, no GPU): the first-frame cost (shader compile + pipeline warm-up, research estimate up to ~1.5 s) and the Firefox non-Windows `dispatchWorkgroupsIndirect` check are pending the real-browser spike (tasks 2.4/2.5, `present-spike-report.md`). No number is recorded because none was measured (`docs/architecture/performance.md`: never invent a budget you have not measured).

## Parity-relevant notes for the size record

- The `wgpu_default` feature (wgpu + `wgpu/default`) is required on wasm: vello's plain `wgpu` feature pulls wgpu without the `webgpu` backend, and `wgpu::Instance::new` panics without it (vello_svg#80, read 2026-08-07). wgpu 29's defaults include the webgpu backend.
- vello 0.9.0 pulls `skrifa` + `png` unconditionally (the glyph machinery is not feature-gated in 0.9.0) — a fixed cost of the wgpu line, on record for the text decision.
- Determinism witness for this build: the same v3 packet encodes to the same `stream_fingerprint` natively and through the compiled module (`encode_frame`, checked 2026-08-07).
- **CI tripwire updated with this section:** `.github/workflows/renderer.yml` now enforces a ceiling of **1,700,000 raw / 510,000 gzip** on the shipped artifact — the measured section-5 sizes (1,637,283 / 484,923) plus ~4% headroom, so a rebuild that changes nothing does not trip the wire. The why is recorded in `renderer-build.md` "Artifact baseline".

## Section 6: TypeGPU-host retirement — encode-level parity verified, pixels pending the real-browser spike

The rect-only path's pixel-parity guarantee (task 6.4) splits in two:

- **Verified headless (this section).** V2 packets — the only packets the interactive encoder produces (`RendererCore::render` emits v2) — flow through the v3 pipeline unchanged: `benchmarks/protocol-v2-batch.test.ts` re-encodes the full and the merged rect-only packets through `encode_frame` and asserts identical stream fingerprints, plus the rect fast path (`paths == commands`, `segments == 4 × paths`). Encode determinism was already witnessed in the dependency-cost record above. The retired `renderer-host-comparison.ts` pixel-reference harness compared the TypeGPU host against a software reference; its subject (the TypeGPU host) is gone, so the encode-level identity supersedes it — the harness it fed (task 7.1) is rebuilt from `renderer-comparison-fixtures.ts`, which was kept.
- **Pending the real-browser spike (6.4's on-screen half, shared with 7.3).** Pixel identity of rect-only packets against the pre-change TypeGPU host must be confirmed on a real device with the environment recorded; no browser/GPU exists in this environment, so no result is fabricated. The spike must also check one deliberate compositing difference: the retired host drew per layer (scene → grid → selection → preview → guide), while the scene-encoded path draws authored + preview commands, then the selection outline, then grid/guides — grid now composites above selection chrome and the preview instead of below them. Overlay *composition* stays host-side (I31); the relative draw order is the renderer-state choice the spike's pixel references will witness. The capture/diff/isolated-commit procedure is specified in [`pixel-parity-recording.md`](pixel-parity-recording.md).

## Section 7: encode-level parity harness — wired and recording

Task 7.1–7.2 landed the headless half of the parity guarantee as vitest tests against the compiled module (GPU-less):

- **Files:** `benchmarks/parity-fixtures.ts` (committed generated fixtures: representative, translucent, ten-thousand-rectangles reused from `renderer-comparison-fixtures.ts`; plus `bezier-self-intersecting` — the `tests/vello-prototype.rs` overlapping-circle figure expressed in the authored packet vocabulary, both fill rules, a stroked open arc and a rect in one packet), `benchmarks/parity-references.ts` (the recorded references with the recording environment noted; `referenceFor` throws `ENCODE_REFERENCE_MISSING:<name>` when a fixture has no reference, so a fixture added without a reference fails the whole suite — it cannot pass vacuously), `benchmarks/encode-parity.test.ts` (per-fixture reference matching, cross-run determinism, the missing-reference and stale-reference failure paths, and an env-gated recording harness: `CRAFTY_RECORD_PARITY_REFERENCES=1 vitest run benchmarks/encode-parity.test.ts` prints the reference lines for transcription).
- **References recorded 2026-08-08** on the environment above; the fingerprints are the FNV-1a over the encoder's binary streams (platform-independent by construction — no memory-layout or iteration-order dependence). Structural witnesses ride along: the rect fast path counts (paths == commands, segments == 4 × paths) and the bezier fixture's 22 segments (two figures × 8, the stroked arc's cubic + Vello stroke-cap marker segment, the rect's 4).
- **The bezier fixture's stroke-cap marker segment is an API finding:** vello_encoding's stroked paths terminate every subpath with a marker segment (quad for open paths — the GPU stroker's cap/join input), which is why an open one-cubic arc encodes as 2 segments. The is_fill auto-close and wrap-segment findings are recorded in `research-ledger.md`.
- **Pixel references stay pending** — task 7.3's procedure is documented in [`pixel-parity-recording.md`](pixel-parity-recording.md); the on-screen recording itself waits for the real-browser spike, shared with 6.4.

## Section 8 close-out: vello_cpu is dev-only; the shipped size is unchanged

Close-out audit (task 8.3) verified `vello_cpu` has no shipped consumer — the
interactive path (host `render_packet` → `vello_encoder` + `wgpu_present`)
never touches it; it is consumed only by the headless prototype harness
(`tests/vello-prototype.rs`). It moved from `[dependencies]` to
`[dev-dependencies]` in `Cargo.toml` so it can never contribute to the
shipping module. Rebuild and re-measure (2026-08-08, same environment):

| Build | Raw wasm | Gzip | Source |
|---|---|---:|---:|
| Section 5 shipped module (recorded) | 1,637,283 | 484,923 | this record |
| **After vello_cpu → dev-dependencies (close-out)** | **1,637,283** | **484,925** | this record, 2026-08-08 |

Byte-identical raw size: LTO (`lto = "fat"`) already dead-stripped the
unreachable vello_cpu code from the release artifact, so the dependency edge
change moves zero bytes. The 2-byte gzip difference is gzip header noise
(`gzip -9`); the CI ceiling (1,700,000 / 510,000) needs no change.

## Reproduction

```sh
cd packages/scene-renderer-wasm
npm run build:wasm
wc -c target/wasm32-unknown-unknown/release/crafty_renderer_wasm.wasm pkg/crafty_renderer_wasm_bg.wasm
gzip -c target/wasm32-unknown-unknown/release/crafty_renderer_wasm.wasm | wc -c
gzip -c pkg/crafty_renderer_wasm_bg.wasm | wc -c
```
