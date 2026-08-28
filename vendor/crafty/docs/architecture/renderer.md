# Renderer

Status: **Current** for the encode line — rects, paths and overlays encode
into one `vello_encoding` scene, verified headless by cargo tests and the
vitest parity harness. **Transitional** for the GPU line: the WASM module owns
device, surface, render and present, but no browser/GPU exists in this
environment, so on-screen behaviour is pending the real-browser spike
(openspec change `vector-path-rendering`, tasks 2.3–2.6).

## Shape

```
Scene (legacy projection, transitional adapter)
   │  sceneToRenderFrame(scene) → RenderFrame  (draw protocol v5)
   ▼
TypeScript host  packages/scene-renderer/src/wasm/webgpu-renderer.ts
   │  relay the caller-composed packet; compose only compatibility render(scene) calls
   │  compose the overlay packet (grid, guides, selection chrome) + preview rects
   │  serialize → submit one packet per frame, JS → WASM  (the only crossing)
   ▼
Rust  vello_encoder (same module, lib.rs)
   │  decode packet + overlay → vello::encoding::Encoding
   │  Vello wgpu renderer → offscreen texture
   │  module-owned present pipeline (present.wgsl) → canvas surface
```

Rust owns _what to draw_ **and now the GPU**: device, surface, render and
present are all module-owned — the react-vello model, which deliberately moves
the GPU clause of [ADR 0003](adrs/0003-coarse-render-boundary.md). The TypeGPU
host's canvas role retires ([ADR 0007](adrs/0007-typegpu-host.md) reversal,
recorded in ADR 0010, this change's close-out); the host keeps composing the
overlay packet and encoding frames. The reasoning is in
[`wasm-boundary.md`](wasm-boundary.md).

**The renderer is framework-agnostic.** The packet is the contract — no React
host, no product semantics, no chrome assumptions. React is the chrome
implementation today; an agent surface, a headless exporter or a future
code-IDE frontend are the same renderer behind a different caller. Nothing in
this pipeline may assume a React tree exists above it (roadmap: "Crafty
visualizes the codebase").

## The draw protocol

`packages/scene-renderer/src/draw-protocol.ts`. Version **5**; versions 1–4 are
still accepted (`isSupportedDrawProtocolVersion`).

```ts
interface RenderFrame {
  protocolVersion: number;
  frameId: string;
  viewport: { panX; panY; zoom; width; height; pixelRatio };
  commands: DrawCommand[];
  glassSurfaces?: DrawGlassSurface[]; // v4: backdrop-sampled surfaces
  chromeGlass?: DrawChromeGlassSurface[]; // v5: screen-anchored chrome
  selectionBounds?: Bounds;
  documentRevision?: number;
  packetRevision?: number;
  changedNodeIds?: string[]; // v2 delta
  dirtyRegion?: Bounds; // declared, not yet produced
  overlay?: DrawOverlayPacket;
}

interface DrawCommand {
  geometry: "rect" | "path";
  nodeId: string;
  bounds;
  transform;
  fill: [r, g, b, a];
  opacity: number;
  zIndex: number;
  order: number;
  path?: {
    // v3, path geometry only: node-local point
    points: Record<
      string, // records with cubic handles (handleMode
      { id; subpathId; order; x; y; handleMode; handleIn?; handleOut? }
    >;
    subpaths: Record<string, { id; closed }>; // closure is per-subpath
  };
  fillRule?: "nonzero" | "evenodd"; // v3, path commands
  stroke?: {
    // v3, optional: without it a path renders
    width;
    caps;
    joins;
    dash; // filled only
  };
}
```

Paths ride the same command as rects: the node's bounds, transform, fill
colour, opacity and `(zIndex, order)` fields are identical for both kinds.
The path point records, handle modes, closure and fill-rule vocabulary mirror
the authored kernel types **structurally** — `draw-protocol.ts` never imports
the editor kernel (the overlay packet sets the precedent). `"rect"` stays a
first-class geometry forever: overlays (selection, grid, guides) remain
rect-based renderer state composed after the authored packet, and the rect
fast path is a Vello fast path. The v3 packet's paths render through the Vello
scene encoder (fill and stroke), and the encode-level parity harness
(`packages/scene-renderer/benchmarks/encode-parity.test.ts`) pins rect
and path fixtures to recorded stream fingerprints; on-screen pixels are
pending the real-browser spike.

**The production channel is packet-composed** (ADR 0014, advanced by the packet
convergence migration). The editor stage builds one `RenderFrame` before
submission: `sceneToRenderFrame` adapts the remaining legacy rect projection,
`composeRenderFrame` appends path/text commands (resolved geometry + composed
world transform, `harness.ts` `projectPathCommands`), glass/chrome records,
grid/guide overlay data and editing overlays. `SceneRenderer.renderFrame` relays
that packet directly to `render_packet`. The compatibility `SceneRenderer.render`
path still accepts `Scene` bytes for legacy callers and tests, but the editor
loop no longer sends path commands or overlays as renderer-owned side channels.
The module re-sorts every packet by `(zIndex, order)`, so the merge is order-safe.

The encoder applies the packet viewport as
the root of every encoded transform — `screen = world × zoom + pan`, the
retired host's `encodeCommandsVertices` convention — so authored commands and
overlays alike land where the harness's pointer math says they are. The
surface is sized in device pixels (`CSS size × pixelRatio`), so the root
affine maps `device = (world × zoom + pan) × pixelRatio`; presented at CSS
size, that is the pointer position on any display
(`viewport_pixel_ratio_scales_the_root_transform` pins the factor at dpr = 2).

### Glass surfaces (v4)

A glass fill (ADR 0012) renders the scene content behind it — blurred,
tinted, saturation-adjusted, refraction-offset — through a module-owned
composite pass. The packet carries glass as `DrawGlassSurface` records
(structural, kernel-neutral): world bounds, composed world transform, the
authored parameters and explicit `(zIndex, order)`. Surfaces are validated at
the boundary (`RENDER_PACKET_INVALID:glassSurfaces.<field>`) and the module
re-sorts by `(zIndex, order)` — array order is never trusted (I33). The host
enforces the surface budget (`MAX_GLASS_SURFACES`): surfaces past the cap
stay in the packet flagged `flat` — they render as plain tint, visible and
ordered — and the render result reports `GLASS_SURFACES_CAPPED:<n>` (the
overlay budget precedent; the module mirrors the cap defensively).

Glass frames split the single encoding: `encode_scene_frame` (authored
commands) and `encode_overlay_frame` (selection + grid/guides) render on
either side of the composite, so overlays always draw above glass and are
never blurred by it. Non-glass frames keep the single-encoding path
unchanged.

### Chrome glass (v5, ADR 0021)

The floating chrome's pills draw in-frame through the same composite:
`RenderFrame.chromeGlass` carries screen-anchored surfaces (canvas-relative
CSS-px bounds, corner radius, host-integrated spring `scaleX`/`scaleY` and
`pressed`/`hovered` 0..1, host-marked `flat`). The chrome fragment applies
the liquid light model — edge-progressive blur sampled per-fragment from
the pyramid, Snell bezel refraction over the squircle-lip profile, the
directional specular, chromatic RGB split at the edges, spring-scaled SDF
and a soft offset shadow; the look constants are module-side defaults. The
authored path (screen = 0) is untouched. Chrome surfaces are budgeted
separately (`MAX_CHROME_GLASS_SURFACES`, 16, host-capped first,
`CHROME_GLASS_SURFACES_CAPPED`), draw in array order, and composite **after**
the overlay blit, sampling the scene-only pyramid — grid and selection stay
sharp through chrome v1 (the recorded gap; the second-pyramid fix is the
triggered follow-up). The DOM pills go transparent under the `glass-active`
class the canvas stage manages; the plain CSS appearance is the no-GPU
fallback (the degradation doctrine). Every chrome frame takes the split
encoding, so the split is the every-frame path while chrome exists.

What the packet deliberately does **not** contain: component references, tokens,
library state, history, prototype triggers, editor state. Those are resolved
before encoding (I30). Adding any of them to this type is an ADR-level change.

Ordering is explicit `(zIndex, order)` — never derived from map iteration or
object identity (I33). The Rust encoder re-sorts every packet by the same key,
so the scene ALWAYS draws in `(zIndex, order)` sequence regardless of packet
order (witnessed headlessly by the COLOR-tag order tests in `vello_encoder.rs`).

### Incremental updates

`computeSceneDelta(previousScene, nextScene, frameId)` (`wasm-bridge.ts`) remains
on the compatibility `render(scene)` path. The editor's current packet path sends
full packets produced by `sceneToRenderFrame`; full rebuild is still the
correctness reference while the remaining legacy Scene adapter is retired.

Vello is immediate-mode: the scene re-encodes **every frame** in Rust from the
packet, so the host-side retained command map and the changed-node merge
retired with the TypeGPU submission path (the batch-vs-full decision now lives
in the v2 encoder: a batch packet is re-requested as a full packet, and the
delta merge contract is pinned in `benchmarks/protocol-v2-batch.test.ts`).
**Full rebuild is always available and is the correctness reference.**

## The module-owned GPU path

The WASM module owns device, surface, render and present end to end
(`lib.rs` `wgpu_present`, wasm32-only). The host's `webgpu-renderer.ts` is a
packet relay: it composes the overlay packet, serializes, and submits one
packet per frame via `render_packet` — the only crossing, JS → WASM, one-way.

**One device per module instance.** The first `init_canvas` builds the
device/queue/renderer (the singleton in `wgpu_present`, serialized by an
async init lock); later calls — the editor remounting and re-acquiring the
runtime — reuse it and create only a surface for their canvas. Two
concurrent `requestAdapter` chains are the mechanism behind the
"closure invoked recursively or after being dropped" panic (the browser
cancels the in-flight request; the cancelled promise fires a JsFuture
closure freed at settlement) — observed in the browser with two init
sequences per page load. `recover_canvas` (device loss) resets the
singleton explicitly; the recovery chain runs after the original settled,
so it cannot race.

- **Init** (`init_canvas`, called once with the canvas element) — wgpu
  instance restricted to `BROWSER_WEBGPU` (the no-fallback invariant I32:
  on a browser without `navigator.gpu`, adapter request fails loudly), a
  high-performance adapter compatible with the surface, a device with
  default limits, and Vello's renderer with `AaSupport::area_only()`
  (the MSAA permutations are never compiled — the react-vello research
  finding). The surface format is Rgba8Unorm when offered, Bgra8Unorm
  otherwise; alpha mode PreMultiplied (matching the retired host's
  `context.configure`). Re-running `init_canvas` after device loss is the
  recovery path — the module rebuilds device and resources without
  rebuilding the module.
- **Render + present** (`render_packet`) — the encoder decodes the packet
  into a `vello_encoding::Encoding`; Vello renders into an offscreen
  Rgba8Unorm storage texture; the module's own present pipeline
  (`present.wgsl`, a fullscreen triangle sampling the offscreen) draws to
  the surface. The offscreen and surface configuration are recreated only
  when the packet's device size changes (configure is a GPU sync point).
  Present mode is Fifo — the only mode the WebGPU spec guarantees, and the
  browser default the retired host never overrode. **Glass frames** (packet
  carries glass surfaces) insert two module-owned passes between the scene
  render and the overlay render: the **blur pyramid** (`glass-blur.wgsl`,
  two-pass separable 25-tap Gaussian over the offscreen into five levels
  0/8/16/32/64 device px) and the **composite** (`glass-composite.wgsl`,
  per-surface quads sampling the pyramid progressively — radius maps to an
  adjacent level pair, interpolated — with per-surface tint/saturation/
  refraction/opacity uniforms, drawn in `(zIndex, order)`). The pyramid is
  skipped entirely when the frame has no glass.
- **Present is the commit point** — if any step fails, nothing is
  presented, so the surface keeps showing the last valid frame by
  construction.
- **The retired TypeGPU host** (`capacity-resource-cache.ts`,
  `ordered-submission-batches.ts`, `typegpu-rectangle-host.ts`) is gone
  with the submission path; it remains reachable in git history. Its
  compositing order — per layer, `scene → grid → selection → preview →
guide` — is NOT the scene's order; see [Overlays](#overlays).

### Runtime proof

`loadWasmWebGpuRuntime` (`scene-renderer/src/wasm/index.ts:11`) refuses to
return a runtime unless WebGPU exists, the module instantiates, the error
callback is registered, and `init_canvas` succeeds — which IS the
device+surface+renderer verification: there is no host-side readback anymore
(the module owns the GPU), so the proof chip records ownership
(`device: "module-owned"`, `surface: "module-owned"`) instead of a 1×1 pixel
check. A WebGL context is never requested. On a device loss the app rebuilds
the runtime (re-running the whole load, which re-runs `init_canvas`).

The pattern stands: the renderer proves it works rather than assuming it
does — with the honest caveat that the full proof (real pixels on hardware)
is pending the real-browser spike in this environment.

## Overlays

Overlays are **renderer state, never authored geometry** (I31). Their
_composition_ stays in the host: the overlay packet is projected from kernel
`PageCanvas` records by the editor overlay module and carried on
the frame. Their _drawing_ moved into the scene: the Rust encoder decodes the
packet into the same `vello_encoding::Encoding` **after the authored content**
(`vello_encoder.rs` `encode_frame` → `encode_scene_into` → `encode_grid_bottom`
→ `encode_guides_top`, witnessed headlessly by the COLOR-tag order test
`grid_draws_over_the_authored_packet_and_guides_on_top`).
The transient preview (draft bounds / paste preview) has no scene concept, so
it stays host-composed draw commands appended to the packet (`withOverlays`) —
as do the pen/node editing overlays (`editing-overlays.ts`, ADR 0014):
grippies, handle lines, the point marquee and the in-progress pen session are
plain rect commands composed fresh per frame, screen-constant sizes divided by
zoom at the point of use.

One deliberate compositing-order difference from the retired host is on
record: the old host submitted per layer (scene → grid → selection → preview →
guide), while the scene draws authored + preview commands, then the selection
outline, then grid/guides — **grid now composites above selection chrome and
the preview instead of below them**. Overlay composition stays host-side
(I31); the relative draw order is renderer state, and the real-browser spike's
pixel references must witness it as expected, not "fix" it as a regression
(`benchmarks/pixel-parity-recording.md`).

### The overlay packet

`DrawOverlayPacket` is **kernel-neutral**: it is projected from kernel
`PageCanvas` records by the editor overlay module, but its types are
declared structurally in `draw-protocol.ts` so the WASM host never imports the
editor kernel. That is the right shape for every future overlay.

| Field                         | Source                                                                       | Drawing behaviour (Rust mirror of the retired host's policy)                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `grid.lines`                  | kernel `gridPlan`; the current host reveals its fixed plan strictly above `510%` and settles at `600%` zoom | projected to world rects and re-culled in screen space as defence in depth |
| `grid.dots`                   | kernel `gridPlan.dots`                                                       | bounded per frame (2000)                                                                                                                       |
| `guides`                      | authored `GuideRecord`s                                                      | `visible: false` draws nothing                                                                                                                 |

The host-side policy mirror (`src/grid-overlay.ts`) survives with its tests:
its budgets, drop order and colours stay in lockstep with the Rust mirror by
test, so a policy drift between the two implementations fails loudly.

### Overlay budget

Bounded per frame, with an explicit drop order rather than silent truncation
(mirrored in `grid-overlay.ts` and `vello_encoder.rs` `encode_grid`):

- `MAX_GRID_OVERLAY_LINES = 2000` (grid lines and guides combined),
  `MAX_GRID_OVERLAY_DOTS = 2000` (separate budget).
- Drop order when the budget is exceeded: pixel lines → minor lines → major
  lines → axes → guides. **Guides survive longest.**
- `buildGridOverlayCommands` reports `capped` for diagnostics (host mirror);
  the Rust encoder drops silently in the same priority order.

Every line is culled in screen space with a 2px margin, and non-finite positions
are rejected at the boundary — fail closed.

**Zoom-safe rendering**: every overlay line and dot is device-pixel snapped in
the Rust encoder — the world rect is solved back from an integer device-px
span under the root affine, so lines land on exact physical pixels at any
zoom, pan and DPR (a fractional device position rasterizes soft and shimmers
while panning). Grid axes carry `weight` on the wire like every line record
(the module's `OverlayLine` requires it; without it, frames dropped while the
grid origin was on screen — fixed 2026-08-10).

**Current:** one fixed `gridPlan` is projected by the editor host. It becomes
visible strictly above `510%` zoom and reaches its capped `0.60` opacity at `600%`; the
host reveals or reverses it over 450 ms. The encoder emits authored commands,
then grid, then guides, so grid composites above authored content and guides
composite above grid.

**Target:** an adaptive nice-number LOD ladder may own all zoom levels and hold
a stable screen-pixel spacing band. That future ladder is not current behavior.

Style: 1px screen thickness (1.25px major, 2px axes), neutral colours distinct
from authored fills — subtle by design (minor α 0.16, major 0.3, axes 0.45,
pixel 0.1 / 0.16 at CSS-px boundaries); guides an accent at α 0.95.

### Measured overlay cost

Deterministic, asserted in `src/grid-overlay.test.ts` at the 10k-rect fixture
viewport (1000×800, 8px nominal minor spacing):

| Zoom | Grid lines | Axes | Total overlay commands |
| ---: | ---------: | ---: | ---------------------: |
|  0.5 |        227 |    2 |                    229 |
|    1 |        227 |    2 |                    229 |
|    2 |        227 |    2 |                    229 |
|    4 |        227 |    2 |                    229 |
|    8 |        227 |    2 |                    229 |
|   16 |        227 |    2 |                    229 |
|   32 |        227 |    2 |                    229 |

Re-recorded when rulers were removed. The fixture's contract shape (minor
step = 8 / zoom ticks over the 1000×800 world) yields 126 + 101 lines plus
the two origin axes at every zoom level — 229 — because the LOD ladder
holds the same screen density at all zooms (there is no pixel grid). Worst
case adds 4,086 vertices against the fixture's 60,000 authored vertices —
about 7% — and every level is well under the 2,000-command cap. The overlay
is excluded from the encode-level parity references by construction: parity
fixtures carry no overlay (the overlay draw order has its own COLOR-tag
witness in `vello_encoder.rs`).

## Failure policy

`packages/scene-renderer/src/failure-policy.ts`. Every failure is a structured
diagnostic carrying a stable code, stage, severity, recovery action, and the
guarantee `preservation: "authored-state-and-last-valid-packet"`.

| Condition                | Stage             | Code                            | Recovery                                       |
| ------------------------ | ----------------- | ------------------------------- | ---------------------------------------------- |
| WebGPU unavailable       | `typegpu-init`    | `WEBGPU_UNAVAILABLE`            | retry initialization                           |
| TypeGPU init failure     | `typegpu-init`    | `TYPEGPU_INITIALIZATION_FAILED` | retry initialization                           |
| Shader/pipeline failure  | `pipeline`        | `WEBGPU_PIPELINE_FAILED`        | recreate host and pipeline                     |
| Buffer upload failure    | `buffer-upload`   | `WEBGPU_BUFFER_UPLOAD_FAILED`   | preserve packet, retry render                  |
| Queue submission failure | `submit`          | `WEBGPU_SUBMISSION_FAILED`      | preserve packet, retry render                  |
| Device loss              | `device-loss`     | `WEBGPU_DEVICE_LOST`            | recreate device and all device-owned resources |
| Invalid packet version   | `buffer-upload`   | `RENDER_PACKET_INVALID`         | update producer or consumer; do not submit     |
| Encode failure           | `vello-encode`    | `VELLO_ENCODE_FAILED`           | preserve packet, retry render                  |
| Render/present failure   | `vello-render`    | `VELLO_RENDER_FAILED`           | preserve packet, retry render                  |
| Glass pyramid failure    | `glass-pyramid`   | `GLASS_PYRAMID_FAILED`          | preserve packet, retry render                  |
| Glass composite failure  | `glass-composite` | `GLASS_COMPOSITE_FAILED`        | preserve packet, retry render                  |

The module reports **strings**, not diagnostics: `VELLO_ENCODE_FAILED:<node>:<field>`
(a non-finite or out-of-range value the encoder rejects — the vello#470
failure class), `VELLO_RENDER_FAILED:<stage>[:<detail>]` (init/render/present
steps), and `WEBGPU_DEVICE_LOST:<reason>: <message>` from the device-loss
callback. `diagnosticFromModuleError` (`failure-policy.ts:64`) is the single
place those strings become vocabulary diagnostics; the policy file is the
only producer of codes. The TypeGPU-era codes above remain in the vocabulary
for the legacy stages.

Rules:

- **Renderer failure never writes back to the document** (I28).
- **An invalid packet cannot replace the last valid packet** (I29). On a
  render failure nothing is presented — the surface keeps showing the last
  valid frame by construction (present is the commit point).
- Messages never include adapter internals, shader source, packet contents, or
  arbitrary thrown values.
- **No fallback backend** (I32). `createSceneRenderer` returns an
  `unavailableRenderer` that reports `WASM_MODULE_UNAVAILABLE` and draws nothing.
  Introducing a fallback is an ADR-level decision.

Device loss is handled end to end in the browser: the app disposes the
renderer and re-acquires the runtime (which re-runs `init_canvas` — the
module's recovery path), retrying up to three times.

## What the renderer must never own

- Component semantics, tokens, variants, states, libraries.
- Document identity. `nodeId` is a **cache and diff key**, not the product's
  notion of identity. GPU buffers, atlas slots and bind groups are addressed by
  stable keys derived from document ids; they are not themselves identity.
- History, undo, selection _semantics_ (it draws an outline; it does not decide
  what is selected).
- Product-level animation triggers. It renders evaluated state.

## Gaps

Ordered by how much they block the product.

1. **Paint vocabulary is flat colour.** Paths and rects render filled and
   stroked; there are no gradients, shadows, masks or blend modes, and
   `cornerRadius` is authored and ignored. **Glass rects now render** (ADR
   0012: blur pyramid + composite); path glass, glass strokes, bezel/specular
   highlights and the rest of the vocabulary remain deferred.
2. **No text.** Text nodes draw as rectangles. This is the single largest visible
   gap. See [`typography.md`](typography.md).
3. **No images.** No decode, upload, atlas or sampler path.
4. **No clipping.** Frames do not clip their children.
5. **JSON transport.** `RendererCore.render()` returns a JSON string, parsed per
   frame. Documented as a proof transport ([ADR 0003](adrs/0003-coarse-render-boundary.md));
   a binary packet is a _measured_ optimisation, not a prerequisite.
6. **No viewport culling for authored content.** Every visible node in the frame
   is encoded regardless of whether it intersects the viewport (the overlay
   drawer does cull; authored geometry does not yet).
7. **`dirtyRegion` is declared and never produced.**
8. **Browser/GPU validation is incomplete.** Encode-level parity (rects, paths,
   overlays, failure boundary) is proven headless. Real GPU submission,
   on-screen pixel parity — including the rect-only pixel-identity check and
   the deliberate compositing-order difference — first-frame timings, and
   device-loss recovery on hardware are **unproven**: pending the real-browser
   spike and task 7.3 (`benchmarks/pixel-parity-recording.md`), no results are
   fabricated. See [`performance.md`](performance.md).
9. **No offscreen/headless render path**, so no server-side thumbnails or export.
   The encoder is deliberately reusable for this — the prototype measured
   `vello_cpu` as a headless/export candidate (its scene model diverges from
   the interactive `vello_encoding` line; it stays a candidate, evaluated
   separately).

## Extending the renderer

- Adding geometry means adding a `DrawGeometry` variant, a Rust encoder branch
  (a `vello_encoding` scene call), and encode-level parity tests against a
  recorded reference (recorded with the environment, re-recorded only as an
  explicit isolated act — `benchmarks/pixel-parity-recording.md`). It does
  **not** mean adding product concepts to the packet. Protocol v3 added
  `"path"` this way: packet change, then the encoder branch, with parity
  witnesses at each step.
- Adding an overlay means extending `DrawOverlayPacket` with structural types
  that do not import the kernel, projecting it in `overlay.ts`, mirroring the
  record in the Rust encoder's `OverlayPacket`, and giving it a bounded budget
  with an explicit drop order (mirrored in both `grid-overlay.ts` and
  `vello_encoder.rs`, kept in lockstep by test).
- GPU resources are keyed by **stable keys** derived from document ids — never
  by array index or object identity — and every cache needs an eviction story
  before it ships.
- Any change to the packet shape bumps `DRAW_PROTOCOL_VERSION` and keeps the
  previous version accepted for at least one release.
