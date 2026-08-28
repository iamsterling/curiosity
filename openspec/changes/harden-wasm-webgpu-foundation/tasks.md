## 1. Stop the renderer from wedging

- [ ] 1.1 Add a failing regression test that constructs the editor harness, applies a real mutation, and asserts the value passed as the render revision equals the value the packet echoes
- [ ] 1.2 Add a failing regression test that drives the real compiled module through a discarded frame and asserts the next matching request is drawn
- [x] 1.3 Stamp the kernel's document revision onto the projected scene, replacing the persistence revision, and stop passing the persistence revision as a render input
- [x] 1.4 Advance the packet-sequencing cursor as soon as a packet is decoded, before any staleness verdict
- [x] 1.5 Confirm 1.1 and 1.2 now pass, and that no existing test was weakened to make them pass
- [x] 1.6 Add a test asserting the persistence revision still governs save/load conflict detection

## 2. Make the build reproducible

- [x] 2.1 Add `rust-toolchain.toml` declaring the compiler version and the `wasm32-unknown-unknown` target
- [x] 2.2 Pin `wasm-bindgen` to the exact version matching the CLI, and document that the two must match
- [x] 2.3 Add `[profile.release]` with `opt-level = 3`, `lto = "fat"`, `codegen-units = 1`, `strip = true`
- [x] 2.4 Resolve `cargo` and `wasm-bindgen` from `PATH` with an env override, removing the hard-coded home-directory paths
- [x] 2.5 Add `wasm-opt` to the build after `wasm-bindgen`, and record the before/after module size
- [ ] 2.6 Verify a clean checkout builds using only the declared toolchain

## 3. Turn on CI

- [x] 3.1 Land a clippy-clean commit so the first enforced run is green
- [x] 3.2 Add a path-filtered, concurrency-cancelled workflow running `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test`, the wasm build, `tsc`, and `vitest`
- [ ] 3.3 Confirm the workflow fails on a deliberately broken encoder test, then revert the break
- [ ] 3.4 Confirm the workflow fails on a deliberately broken module build, then revert the break

## 4. Protocol v3: explicit packet kind and removals

- [x] 4.1 Add a failing encoder test asserting that hiding a node names it in the changed-node list and emits no command for it
- [x] 4.2 Add a failing encoder test for an ancestor becoming invisible, covering its previously drawn descendants
- [x] 4.3 Add a failing host test asserting a removal-only batch merges onto retained state instead of replacing it
- [x] 4.4 Bump the protocol version to 3 and add the explicit packet-kind field, keeping version 2 accepted
- [x] 4.5 Record a changed node when it stops being drawn, regardless of its visibility branch
- [x] 4.6 Make the host branch on the packet-kind field instead of inferring from the changed-node list length
- [x] 4.7 Add a property-style test asserting that any sequence of batches merged onto retained state equals a full re-encode of the final state, covering value changes, nested changes, deletions and visibility transitions
- [x] 4.8 Add a test asserting a version 2 packet is still accepted and rendered

## 5. Composite opacity

- [x] 5.1 Declare straight-alpha source-over (`ALPHA_BLENDING`) on the Vello-overlay blit pipeline
- [ ] 5.2 Record and assert that Vello's transparent target stores straight RGBA; surface alpha mode does not establish the sampled texture convention
- [ ] 5.3 Assert the preferred canvas format is a non-sRGB variant, so the no-conversion colour decision fails loudly if that ever changes
- [ ] 5.4 Re-record invalidated parity references in an isolated commit that changes nothing else, diffing the rendered images before accepting them
- [ ] 5.5 Add a rendered-pixel check that fails when blending is removed

## 6. One diagnostic vocabulary

- [x] 6.1 Merge the declared and emitted diagnostic code sets into one vocabulary the renderer actually produces
- [x] 6.2 Add a recoverable/critical severity to every diagnostic
- [ ] 6.3 Make the canvas surface choose recovery from severity rather than matching individual codes
- [ ] 6.4 Add an `uncapturederror` listener and error scopes around pipeline creation and submission, mapping failures to vocabulary codes
- [ ] 6.5 Install `console_error_panic_hook` so an encoder panic carries a message
- [ ] 6.6 Add a test enumerating the vocabulary and asserting every code has at least one check that produces it
- [x] 6.7 Add a test asserting no diagnostic message contains adapter internals, shader source, or packet or document contents

## 7. Verify on a real GPU

- [ ] 7.1 Add a Playwright project for the renderer, with a first-render barrier helper and a canvas locator
- [ ] 7.2 Add a committed fixture and record its first reference image, noting the capture environment
- [ ] 7.3 Add a reference for a translucent fixture that would fail without blending
- [ ] 7.4 Declare the pixel tolerance and document that raising it needs the same justification as raising a performance budget
- [ ] 7.5 Assert the check fails, rather than passing vacuously, when a fixture has no recorded reference
- [ ] 7.6 Add the renderer project to CI on the runner image chosen for the references

## 8. Correct the documentation

- [ ] 8.1 Correct the claim that the dirty region is never produced — it is produced and never consumed
- [ ] 8.2 Correct the claim that the vertex layout uses instance stepping
- [ ] 8.3 Replace the failure-policy table with the merged vocabulary and its severity classes
- [ ] 8.4 Record the blend and colour-space decisions, and the re-recorded parity references with their environment
- [ ] 8.5 Update the verification status: what is now proven on hardware and what remains headless
- [ ] 8.6 Delete the empty `crates/crafty-renderer-wasm/` leftover already flagged as a delete candidate
- [ ] 8.7 Record the deferred items from design.md Decision 10 and the trigger that would un-defer each
