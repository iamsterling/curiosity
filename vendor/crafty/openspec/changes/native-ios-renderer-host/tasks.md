## 1. S0 — factor, build, and link

- [x] 1.1 Add a safe whole-frame encode-evidence function shared by WASM and native callers without changing fingerprints.
- [x] 1.2 Add a dedicated native FFI static-library crate with ABI/version, whole-frame encode, stable status codes, opaque result access, and explicit destruction.
- [x] 1.3 Add Rust tests for success, malformed UTF-8, malformed packet, null input, and result lifetime.
- [x] 1.4 Add a deterministic device/simulator build script using the pinned Cargo lockfile.
- [x] 1.5 Link the static library into the Curiosity canvas pod and prove the ABI version is callable from Swift.
- [x] 1.6 Build the app for arm64 simulator and physical iPad Release; record exact blockers rather than adding Swift renderer features.
- [x] 1.7 Run the existing encoder/parity suite and prove web packet fingerprints are unchanged.

## 2. S1 — present one packet

- [x] 2.1 Add the native Rust wgpu host over the existing Core Animation layer.
- [x] 2.2 Present one canonical rectangle `RenderFrame` with no hardcoded Swift scene contribution.
- [x] 2.3 Record physical-iPad pixels plus simulator pixels where supported or the exact simulator presentation blocker, then retire the corresponding hardcoded scene ownership.

## 3. S2–S6 evidence

- [ ] 3.1 Run fixture/pixel parity with declared scale, color space, tolerance, and raw diffs.
- [ ] 3.2 Exercise resize, scale, appearance, background/foreground, and mount lifecycle.
- [ ] 3.3 Exercise memory warning/device loss and last-valid-frame recovery.
- [ ] 3.4 Record latency/frame/memory distributions on the physical iPad.
- [ ] 3.5 Audit the boundary and record accept-Rust or exact fallback-trigger evidence.
