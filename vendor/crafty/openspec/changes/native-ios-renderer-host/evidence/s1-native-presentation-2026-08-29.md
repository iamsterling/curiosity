# S1 native presentation evidence — 2026-08-29

Overall result: **PASS with an exact simulator capability exception**. The
physical iPad presents the canonical packet through Rust/Vello/wgpu. The arm64
CoreSimulator adapter lacks the `INDIRECT_EXECUTION` downlevel capability
required by pinned Vello 0.9.0, so its required evidence is the exact blocker
rather than pixels. The provisional Swift shader is retired; `CanvasScene.swift`
remains untouched and disconnected from presentation.

## Acceptance matrix

| Check | Result | Evidence |
|---|---|---|
| Rust creates a Metal-only wgpu instance, retained-layer surface, compatible adapter/device, Vello renderer, and existing present pipeline | **PASS** | `src/wgpu_present.rs::init_native`; physical frame below |
| One complete protocol-v5 JSON `RenderFrame` crosses the C ABI once | **PASS** | `crafty_renderer_native_render_frame_json`; no per-node ABI exists |
| Physical iPad presents the packet-defined canonical rectangle | **PASS** | `s1-physical-ipad-canonical-rectangle-2026-08-29.png` |
| Swift scene contributes no pixels | **PASS** | the native host is the only draw path; the physical image has the packet's rounded rectangle, while `CanvasScene` is disconnected and has no rounded-rectangle primitive |
| arm64 iOS simulator evidence | **BLOCKED AS ALLOWED** | `s1-simulator-renderer-log-2026-08-29.txt` and blank native canvas screenshot record the unsupported adapter capability |
| No alternate renderer contributes pixels | **PASS** | `CuriosityCanvasRenderer.swift` has no Swift shader, command queue, or `CanvasScene` reference |
| S1 overall | **PASS** | physical pixels plus the exact unsupported-simulator blocker satisfy the declared gate |

## Physical iPad positive evidence

Device: `C137FAC2-3B00-528E-BBD0-1C3C5C714667`.

The Release device build used `DEVELOPMENT_TEAM=6H6NQDJ5T4` only as a local
build argument; no signing value was written to the project. XcodeBuildMCP
built, installed, and launched the final no-fallback app as process `10513`.

`devicectl device capture screenshot` produced a 2266×1488 PNG:

```text
7382a3bf4eabb4d5143de9a771a5d5b044942d0873b8196c4635eb975044c5a5
  s1-physical-ipad-canonical-rectangle-2026-08-29.png
```

The render region's two dominant exact RGB values are `(11, 11, 12)` for the
Vello base and `(55, 123, 164)` for the rectangle. At the captured 75% viewport,
the rectangle's exact-color bounding box is `(1133, 803)`–`(1228, 874)`, contains
6,728 exact-color pixels, and has center pixel `(55, 123, 164)`. The rounded
corners come from packet
`cornerRadius: 8`. The preserved provisional `CanvasScene` emits triangles for
only sharp rectangles and therefore cannot produce this image.

## Simulator blocker

After correcting the adapter request to use the adapter's reported Metal limits
and serializing Vello's Metal shader initialization, native setup succeeds and
frame submission reaches Vello. wgpu then fails closed before presentation:

```text
In Device::create_buffer, label = 'vello.reduced_buf'
  Downlevel flags DownlevelFlags(INDIRECT_EXECUTION) are required but not
  supported on the device.
```

This is the Apple iOS Simulator GPU capability reported by wgpu, not a surface,
link, packet-decode, or physical-device failure. No Vello fork, fallback backend,
or second packet renderer was introduced. The failure is diagnostic-only:

```text
RENDERER_NATIVE_PRESENT_FAILED: ... INDIRECT_EXECUTION ... not supported ...
```

Evidence files:

- `s1-simulator-indirect-execution-blocker-2026-08-29.png` — native path,
  no presented pixels; SHA-256
  `741e45bf4b96a18f4c85f441e8c2ecb887bfcf2a3626ec89c56e6e748f5e3a9d`.
- `s1-simulator-renderer-log-2026-08-29.txt` — exact native blocker.

## Mechanical evidence

```text
cargo test --locked --workspace
  native FFI: 6 passed
  core unit: 65 passed
  canonical integration: 1 passed
  Vello integration: 3 passed, 1 ignored
  doc tests: 0 failed

cargo clippy --locked --workspace --all-targets -- -D warnings: PASSED

arm64 simulator Release build/run: SUCCEEDED (process 41004)
arm64 physical iPad Release build/run: SUCCEEDED (process 10513)

bun run typecheck: 13/13 Crafty workspace tasks passed
bun run test: 26/26 Crafty workspace tasks passed
bun run lint && bun run format:check: PASSED
bun run build: 13/13 Crafty workspace tasks passed
apps/mobile bun run verify: PASSED (18 mobile tests, web-kernel parity,
  lint, typecheck, and iOS Expo export)
openspec validate native-ios-renderer-host --strict: PASSED
```

The final physical-device artifact contains the whole native host surface:

```text
0000000100007c70 T _crafty_renderer_native_abi_version
0000000100007c78 T _crafty_renderer_native_create_metal
00000001000093f0 T _crafty_renderer_native_destroy
0000000100009440 T _crafty_renderer_native_render_frame_json
```

Raw Core Animation pointer conversion is confined to `rust/native-ffi/`; the
core crate retains `#![forbid(unsafe_code)]`.

## Decision

S1 passes because the canonical path presents on the required physical target
and the unsupported simulator capability is recorded exactly. The Swift shader
path stays retired rather than masking the blocker. S2–S6 remain mandatory;
S1 alone does not authorize the P0 rectangle editor slice.
