# Vello CPU Prototype Report

De-risking prototype (openspec change `vector-path-rendering`, section 1):
does Vello's CPU renderer express the authored packet, at what wasm cost, and
is the output deterministic enough to witness upgrades with? All measurements
are environment-noted distributions per `docs/architecture/performance.md` —
**no budget is asserted or invented here.**

## Verdict (task 1.7)

- **The vello_cpu 0.2.0 renderer expresses the packet geometry** — rects via
  `fill_rect` (the documented fast path, `vello_common::rect`), paths via
  `fill_path`/`stroke_path` with explicit `Fill::NonZero` / `Fill::EvenOdd`,
  affine transforms via `set_transform(Affine)` (f64), per-draw paint via
  `set_paint`. Ordering is caller insertion order, matching the encoder's
  existing `(zIndex, order)` sort. Both fill rules reach the rasterizer
  (witness: the overlapping-bezier fixture, below).
- **The scene *model* claim in the research does NOT hold for vello_cpu 0.2.0**
  — see "Divergences" below. The packet is expressible, but not through
  `vello_encoding`; the encoder written for this phase speaks vello_cpu's own
  API and would need rewriting for a vello-classic (wgpu) phase.
- **Wasm size delta: +28,910 raw bytes (+16.8%), +7,536 gzipped (+10.5%)**
  against the pre-Vello module at the same release profile — see the size
  table. Still below the pre-`opt-level=3` baseline (219,242/77,560).
- **Determinism: byte-identical pixmaps across runs** on the recorded
  environment (see below). This is a same-machine, same-toolchain claim;
  cross-platform byte-identity is NOT claimed and is not asserted anywhere.
- **10k encode + render ≈ 0.77 ms/frame total** (median), vs the existing
  command-to-vertex encode at 2.77 ms — the immediate-mode re-encode concern
  from the research (§4, §12.4) does not materialise on this fixture at this
  resolution (1000×800, single-threaded).

## Recorded environment

- `CRAFTY_BENCH_BROWSER=headless-cargo-test` — native Rust integration tests
  (`tests/vello-prototype.rs`), no browser
- `CRAFTY_BENCH_GPU=cpu-only` — vello_cpu rasterization, no GPU exercised
- `CRAFTY_BENCH_BUILD=working-tree` — release profile, branch
  `architecture-docs-and-next-server`
- OS: macOS 27.0 (26A5368g), arm64; CPU: Apple M5 (10 cores); single-threaded
  render (`RenderSettings::default()` → `num_threads: 0`)
- rustc 1.97.1 (8bab26f4f 2026-07-14), rustup `stable-aarch64-apple-darwin`,
  `rustup target list --installed` includes `wasm32-unknown-unknown`
- wasm-bindgen 0.2.126 (pinned `=0.2.126` in Cargo.toml; lockfile-verified)
- vello_cpu **0.2.0** (published 2026-08-07), features `std`, `u8_pipeline`
  only (no `png`, no `text`/glifo); vello_common 0.2.0; kurbo 0.13.1; peniko
  0.6.1 — all from `Cargo.lock`
- Render mode: `RenderMode::OptimizeSpeed` (u8 pipeline, the shipping
  configuration), `CompositeMode::Replace`, premultiplied RGBA8 pixmap,
  `Level::new()` (host SIMD)

## Reference hashes (NEW vello references — not comparable to the CPU payload parity hashes)

The hashes below are SHA-256 over the raw premultiplied RGBA8 pixmap bytes
(width × height × 4). They are vello_cpu reference values recorded for this
environment; the old `renderer-host-comparison-report.md` hashes are CPU
payload parity hashes of encoded vertices and are unrelated by construction.
The fixtures are re-derived in Rust (`tests/vello-prototype.rs`) from
`benchmarks/renderer-comparison-fixtures.ts`'s deterministic formula.

| Fixture | SHA-256 (pixmap bytes) | Coverage (opaque px) |
|---|---|---|
| representative (12 rects, 1000×800) | `6803eba77992253bc186b58318fcdede466b0deab71d3677c64ba26a3dd0d7c0` | — |
| ten-thousand-rectangles (1000×800) | `4242425f11fdd1cbc5accf8ea9af92971a8ffa43d81192dfd23f707b9933376a` | 360,000 / 800,000 (exactly 36 px × 10,000; analytic AA of pixel-aligned rects is exact) |
| bezier figure, `Fill::NonZero` (300×200) | `f7ff00196a651240df7515c18bd80f44f533bc7e50716431bf984ec313fcb47e` | 11,556 |
| bezier figure, `Fill::EvenOdd` (300×200) | `8a7439c7c7bd0d75fa6d0d853769e7d2fce8ce09926022bca85492459fcab4cd` | 10,276 |

The figure is two overlapping cubic-approximated circles (winding 2 in the
overlap lens): nonzero fills the lens, evenodd cuts a hole — a ~1,280 px
visible difference. This is the documented analytic-AA conflation case
(vello-vector-rasterization.md §5) and the witness that `fillRule` reaches
the rasterizer.

Determinism claim: byte-identical output across separate release runs on the
recorded environment (asserted by
`representative_fixture_renders_byte_identically_across_runs`, which encodes
and renders the fixture twice from scratch). The 10k hash was also stable
across the debug and release runs recorded here.

## Timings — 10,000-rect fixture, release build, median of 7

Single-threaded, 1000×800 pixmap, `Instant` timers around each phase
(encode = context build loop; render = `RenderContext::render` into the
pixmap).

| Phase | Median | Min | Max |
|---|---:|---:|---:|
| Encode (10k `set_paint` + `fill_rect`) | 0.358 ms | 0.310 ms | 0.539 ms |
| Render (vello_cpu rasterize) | 0.408 ms | 0.397 ms | 0.682 ms |
| Total per frame | ~0.77 ms | — | — |

Samples (ms): encode `[0.5387, 0.3625, 0.3579, 0.3677, 0.3247, 0.3106, 0.3098]`;
render `[0.6820, 0.4262, 0.4302, 0.4080, 0.3993, 0.3970, 0.3985]`.

No budget is asserted from this. Context only: the existing
command-to-vertex encode budget for the same fixture is 50 ms with a measured
2.77 ms host mean; the vello path lands well inside that, and the per-frame
re-encode cost the research flagged as the delta-vs-Vello risk (§4, §12.4) is
0.36 ms here.

## Wasm module size delta (task 1.6)

`cargo build --release --target wasm32-unknown-unknown`, size of
`crafty_renderer_wasm.wasm` (raw bytes; gzip = `gzip -c | wc -c`).

| Build | Raw wasm | Gzip | Source |
|---|---:|---:|---|
| Pre-Vello, cargo-default profile | 219,242 | 77,560 | Cargo.toml `[profile.release]` comment, recorded earlier on this crate |
| Pre-Vello, current release profile (opt-level=3, lto=fat, cgu=1, strip) | 171,865 | 71,523 | same comment, same profile as the post-Vello row |
| **With vello_cpu 0.2.0** (std, u8_pipeline), current profile | **200,775** | **79,059** | this prototype, working tree, 2026-08-07 |

**Delta at the current profile: +28,910 raw (+16.8%), +7,536 gzip (+10.5%).**
The pre-Vello figures were recorded earlier on this crate in the
Cargo.toml profile comment, not rebuilt from a stashed state (the working
tree already carries in-flight profile changes); the comparison row is
profile-matched, so the delta isolates the vello dependency.

The module with vello_cpu is still ~9% smaller than the original
cargo-defaults module. Size is kept down by disabling the `png` and
`text` (glifo) default features — phase A draws rects and paths only.

## Divergences from the research (flagged)

1. **vello_cpu 0.2.0 does not consume `vello_encoding`.** The research
   (§3/§4/§11) and the proposal's "the scene-building code is identical to
   what a later wgpu phase would use" claim assumed vello_cpu shares the
   Scene/Encoding model. As published (2026-08-07), vello_cpu has **no
   `Scene` type** and **no `vello_encoding` dependency** (its deps are
   vello_common + bytemuck/hashbrown + optional glifo/rayon/etc.). Its API is
   a PostScript-style retained-state `RenderContext`
   (`set_paint`/`set_fill_rule`/`set_transform`/`fill_rect`/`fill_path`/…
   → `render(&mut Pixmap, &mut Resources)`). **Consequence: the encoder for
   this phase speaks vello_cpu's API, and Phase B (vello classic wgpu) would
   require a second scene encoder — unless Phase B targets `vello_hybrid`
   (unpublished on crates.io as of 2026-08-07; vello_common's own README says
   "only Vello CPU is published") or the sparse-strips scene model lands
   first. This is the one research claim the prototype contradicts, and it
   needs an explicit decision before section 2 is written.**
2. **`vello_encoding` was NOT added to Cargo.toml** despite task 1.1 naming
   both crates, because vello_cpu 0.2.0 cannot consume it — a dependency
   with no consumer would be dead weight in the shipping wasm module
   (AGENTS.md: no speculative abstractions). Revisit when Phase B is
   designed.
3. **`Level::fallback()` is not reachable** — the fearless_simd feature
   gating it (`force_support_fallback`) is not enabled by vello_common 0.2.0.
   The docs recommend the fallback level for cross-platform reference
   snapshots; without it, reference hashes are host-SIMD-dependent and the
   parity harness must be re-recorded per environment (which is what this
   report does).
4. **Rect fast path exists and is exact** — `fill_rect` produces exactly
   36 px per pixel-aligned 6×6 rect (360,000 total), no AA fringe. The
   research's "Special case drawing rectangles" claim is confirmed.
5. **The "software-reference parity hash" comparison is not possible by
   construction** — the existing hashes are vertex-encoding hashes, not
   images. Task 1.4's comparison therefore became: record a NEW vello
   reference and assert stability across runs, which is what this report
   contains. (Also noted in the change's task brief.)

## Reproduction

```sh
cd packages/scene-renderer-wasm
cargo test --test vello-prototype                       # 3 tests, ~0.25 s debug
cargo test --release --test vello-prototype            # determinism in release
cargo test --release --test vello-prototype -- --ignored --nocapture   # hashes + timings
cargo build --release --target wasm32-unknown-unknown  # module size
wc -c target/wasm32-unknown-unknown/release/crafty_renderer_wasm.wasm
gzip -c target/wasm32-unknown-unknown/release/crafty_renderer_wasm.wasm | wc -c
```
