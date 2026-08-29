## Why

Crafty's Rust encoder already builds the Vello scene consumed by the browser GPU
host, but the crate produces only WASM/rlib artifacts and exposes only a
wasm-bindgen edge (`packages/scene-renderer/rust/Cargo.toml:6-9`,
`src/lib.rs:952-1333`). Curiosity's iPad canvas is currently a separate,
hardcoded Swift/Metal proof. This improvement establishes the smallest native
boundary needed to test reuse of the existing encoder before any product feature
is added to that proof.

This is not a confirmed renderer defect. Native iOS viability is unknown until
the static library links, a packet presents through the existing Core Animation
layer, and physical-device lifecycle/pixel evidence exists.

## What Changes

- Keep the existing safe encoder crate and its web API intact.
- Add a dedicated native FFI crate that contains the unsafe C pointer boundary
  and produces an iOS static library.
- Expose one whole-frame encode call plus explicit result access/destruction;
  never add per-node calls.
- Add a deterministic Apple-target build script and link the static library into
  Curiosity's local Expo canvas pod.
- Record runtime presentation, pixels, recovery, latency, and memory as later
  gated tasks rather than claiming them from a successful link.

Explicitly out of scope: changing the draw protocol, changing packet
fingerprints, adding document/product semantics to Rust, replacing the current
Swift renderer before a packet-driven frame exists, text/assets/collaboration,
or inventing performance budgets.

## Capabilities

### New Capabilities

- `renderer/native-ios-host`: versioned coarse C ABI, Apple static-library build,
  native link proof, then packet-driven Core Animation presentation evidence.

## Impact

- `packages/scene-renderer/rust/` — safe encode seam and native FFI workspace
  member.
- `scripts/build-scene-renderer-ios.sh` — deterministic device/simulator build.
- `apps/mobile/modules/curiosity-canvas/ios/` — pod build/link integration and
  ABI compatibility proof only during S0.
- No document schema or draw-protocol change.
