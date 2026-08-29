## Context

The packet and Vello encoder are already framework-neutral. wgpu 29 exposes a
Metal `CoreAnimationLayer` surface target and its Metal backend retains the
layer. The unmodified renderer dependency graph compiles for
`aarch64-apple-ios`; runtime presentation remains unknown until device evidence.

## Goals / Non-Goals

**Goals:** preserve one packet boundary and one encoder; keep unsafe pointer
handling outside the safe encoder crate; produce a reproducible static library;
prove Curiosity links the ABI before implementing native presentation.

**Non-goals:** a second scene model, a Swift packet decoder, per-shape FFI,
sharing Swift Metal command resources with wgpu, protocol changes, or claiming
runtime behavior from compile evidence.

## Decisions

### 1. A sibling FFI crate owns all unsafe code

The encoder crate retains `#![forbid(unsafe_code)]`. A small `staticlib`/`rlib`
workspace member validates byte pointers, catches panics at the foreign edge,
returns owned opaque results, and provides one destruction function.

Rejected: placing raw-pointer code in `lib.rs`, because it weakens the encoder's
existing compile-time safety invariant. Rejected: Swift reimplementation of the
packet encoder, because it creates a second renderer contract.

### 2. The whole JSON packet remains the proof transport

S0 exposes whole-frame encode evidence through C ABI. This preserves the current
coarse boundary and allows fingerprints to prove the native build uses the same
encoder. Binary transport is deferred until a measured serialization cost
justifies it.

Rejected: per-node FFI and a speculative binary layout.

### 3. Rust will own the native wgpu device and retained layer surface

S1 will pass the existing canvas layer to wgpu's Metal surface constructor. The
host keeps the layer alive; wgpu retains it. Rust creates the adapter/device,
Vello renderer, and present path. Swift owns UIKit lifecycle and input, not GPU
scene semantics.

Rejected: extending the direct Swift/Metal proof. Rejected: forcing wgpu to use
the proof renderer's `MTLDevice`; that couples two owners without decision value.

### 4. Build from source in the local pod during the spike

The pod runs the pinned Cargo build for the active Apple target and links the
result from Xcode's build products. No machine-specific binary or signing value
is committed. Packaging as an XCFramework is deferred until S0/S1 prove the
route and distribution requirements are known.

## Evidence boundary

Compile/link evidence can pass S0 only. Pixels, resize/background behavior,
device loss, latency, and memory require the physical-iPad S1-S6 gates.
