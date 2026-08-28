# Browser readiness evidence — incomplete contour oracle

Date: 2026-08-16

> **Superseded later on 2026-08-16.** This file preserves the earlier readiness
> checkpoint. The completed 36-row exact-RGBA result is recorded in
> `adr-0024-vello-pixel-oracle-2026-08-16.json`; ADR 0024 is implemented.

This records only the repaired fail-closed readiness barrier. It is **not**
pixel-oracle evidence and does not complete tasks 2.5–2.7.

## Fresh build and served artifact

```sh
bun run build:browser
PORT=4178 bun run start
node scripts/vello-browser-spike.mjs \
  --url http://127.0.0.1:4178 --route /editor/:slug --slug card-demo \
  --timeout 60000
```

The first command had previously failed because `build:browser` targeted the
retired `@crafty/crafty-web` workspace. After that target was corrected, its
raw terminal result was `Tasks: 7 successful, 7 total` and exit code 0.

The browser command returned exit code 0 with:

```json
{
  "status": "ready",
  "wasmHash": "513420b6f53a8b5bec13e9b9f20cda76099fb6b99eb7dbe2d99e27cdc2702f04",
  "browserArgs": "--enable-unsafe-webgpu,--disable-software-rasterizer",
  "state": {
    "gpu": "object",
    "chip": "VERIFIED · WASM · v5 · 9 cmds",
    "warning": null,
    "canvas": { "width": 1280, "height": 577, "cssWidth": 1280, "cssHeight": 577 },
    "dpr": 1,
    "colorSpace": "srgb",
    "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/152.0.0.0 Safari/537.36"
  }
}
```

The harness uses a fresh agent-browser namespace per invocation, explicitly
enables WebGPU, disables Chromium's software rasterizer, accepts explicit
URL/route/slug/port inputs, checks every browser subprocess status/stderr, and
records the built WASM SHA-256. It rejects a missing proof chip, no WebGPU,
missing/non-positive canvas, diagnostics, or missing draw-command evidence.

## Remaining blocker

This surface renders the normal editor only. There is no test-only WASM fixture
which emits an independently collected raw-source reference beside the
production contour geometry, nor does the readiness result expose adapter
backend/driver fields. Consequently there is no O/B/8 × 16/32/64 × transform
matrix, no paired RGBA capture or exact comparison, and no admissible Metal
pixel-oracle claim.
