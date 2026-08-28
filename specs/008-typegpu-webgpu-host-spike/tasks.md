# Tasks: TypeGPU WebGPU Host Spike

## T001 - OpenSpec change record

- **Files:** `specs/008-typegpu-webgpu-host-spike/*`
- **Output:** bounded TypeGPU adoption gate and preserved Rust/WASM boundary
- **Verification:** spec, plan, research, contracts, and tasks exist and cross-reference the current renderer contract

## T002 - Build compatibility gate

- **Files:** web build configuration, package manifests, renderer package boundary
- **Output:** pinned TypeGPU version and a reproducible supported build path, or a documented no-go for shader transforms in Next/Turbopack
- **Verification:** clean install, build, and typecheck of the candidate host without weakening the existing web build

## T003 - Typed host prototype

- **Files:** `packages/scene-renderer-wasm/src/webgpu-renderer.ts` or an isolated candidate host package, tests
- **Output:** TypeGPU-backed typed rectangle vertex schema and explicit pipeline/resource setup consuming the existing `RenderFrame`
- **Verification:** candidate host renders the representative frame and retains the current protocol version

## T004 - Batching and resource reuse

- **Files:** candidate host, draw protocol evidence, tests
- **Output:** capacity-based reusable vertex buffer, cached pipeline/resources, and batched compatible submission
- **Verification:** repeated renders do not create an unbounded resource count; command ordering and overlay separation remain stable

## T005 - Failure and fallback policy

- **Files:** renderer diagnostics, host lifecycle, browser tests, docs
- **Output:** structured initialization/device-loss behavior and an explicit supported/degraded capability matrix
- **Verification:** unavailable WebGPU, lost device, invalid packet, and submission failure preserve authored state and last valid packet

## T006 - Performance and visual comparison

- **Files:** benchmark harness, snapshots, comparison tests, `docs/editor/*`
- **Output:** TypeGPU versus current-host evidence for representative scenes and changed batches
- **Verification:** existing budgets are measured with browser, OS, GPU, and build versions recorded; no regression is hidden by an unapproved fallback

## T007 - Adoption decision and handoff

- **Files:** `docs/editor/research-ledger.md`, `docs/editor/final-gap-analysis.md`, implementation roadmap
- **Output:** adopt, defer, or reject decision with residual risks and next migration boundary
- **Verification:** full repository checks and OpenSpec artifact review
