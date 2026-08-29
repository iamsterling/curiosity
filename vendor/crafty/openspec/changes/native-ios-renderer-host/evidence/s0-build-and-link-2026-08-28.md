# S0 build and link evidence — 2026-08-28

Scope: encoder factoring, native C ABI, arm64 Apple static-library builds, and
application link/launch. This is not packet presentation or pixel evidence; S1
remains open.

## Rust boundary

`cargo test --locked -p crafty-renderer-native-ffi`:

```text
running 5 tests
test tests::abi_version_matches_the_public_header ... ok
test tests::null_input_and_null_result_access_are_defined ... ok
test tests::malformed_utf8_fails_closed ... ok
test tests::malformed_packet_fails_closed ... ok
test tests::whole_frame_encode_returns_deterministic_evidence ... ok

test result: ok. 5 passed; 0 failed
```

Both pinned Apple targets produced static libraries:

```text
./scripts/build-scene-renderer-ios.sh aarch64-apple-ios-sim
CRAFTY_RENDERER_IOS_LIBRARY=.../aarch64-apple-ios-sim/release/libcrafty_renderer_native_ffi.a

./scripts/build-scene-renderer-ios.sh aarch64-apple-ios
CRAFTY_RENDERER_IOS_LIBRARY=.../aarch64-apple-ios/release/libcrafty_renderer_native_ffi.a
```

## Application integration

The generated Xcode workspace was built in Release through XcodeBuildMCP. No
development-team value was written to the project; physical-device signing was
provided only as a local build argument.

```text
simulator: SUCCEEDED in 32946 ms
app: Release-iphonesimulator/Curiosity.app
process: 56927
architecture: Mach-O 64-bit executable arm64

physical iPad: SUCCEEDED in 60762 ms
app: Release-iphoneos/Curiosity.app
process: 9485
architecture: Mach-O 64-bit executable arm64
```

The first physical build populated React Native's generated `RNScreens` headers
but failed while resolving them. An immediate rebuild, with no source change,
succeeded. This was generated build state, not a renderer or signing failure.
Changing the native build script then retriggered the CocoaPods phase through
its declared Rust input files; the subsequent simulator build above succeeded.

The final device executable contains the Swift-called ABI symbol:

```text
0000000100004000 T _crafty_renderer_native_abi_version
```

## Existing parity and web build

`bun run test && bun run build` in `packages/scene-renderer`:

```text
Rust core: 65 passed, 0 failed
Canonical evidence contract: 1 passed, 0 failed
Vello prototype: 3 passed, 0 failed, 1 ignored
Vitest: 9 files passed; 102 tests passed
wasm32 release build: succeeded
TypeScript build: succeeded
```

The web export and native ABI both call
`encode_frame_evidence_json`; the existing deterministic fingerprint and
canonical evidence tests remained green after that factoring.
