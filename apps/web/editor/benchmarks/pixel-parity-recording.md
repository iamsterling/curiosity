# Pixel Parity Recording Procedure

Procedure for recording **pixel references** from the real-device path of the
Vello wgpu renderer (openspec change `vector-path-rendering`, task 7.3). This
document specifies *how* recording happens; the recording itself is **pending
the real-browser spike** (tasks 2.3–2.6) because no browser/GPU exists in the
development environment — **no pixel result is recorded or fabricated here**.
The encode-level half of parity is already wired and passing
(`benchmarks/encode-parity.test.ts`); this procedure is the pixel half.

## Status

- **Encode-level parity (headless): recorded and wired.** `benchmarks/encode-parity.test.ts`
  encodes the committed fixtures through the compiled module (`encode_frame`,
  GPU-less) and compares against the recorded stream fingerprints in
  `benchmarks/parity-references.ts` (recording environment noted there).
- **Pixel parity (real device): pending.** Requires the present spike's
  recorded environment (device + surface + Vello render + present on a real
  browser). Marked pending in `tasks.md` exactly as task 6.4's on-screen half
  is (they share the same gate).

## What a pixel reference records

A pixel reference is the rendered output of the module-owned present path for
one committed fixture: the authored packet and the overlay packet decoded into
the Vello scene, rendered into the offscreen target, presented to the surface,
captured at the canvas. It is recorded as a hash of the captured pixel buffer
(sha256 of RGBA bytes) plus the environment, and is committed beside the
fixture in committed code — never stored as an image blob
(`docs/architecture/testing.md`: fixtures are code, not blobs).

## Required environment fields

Every reference records all of:

- Platform: OS, CPU, GPU, browser name + version.
- Module build: toolchain (`rust-toolchain.toml`), wasm-bindgen version, release
  profile, and the pinned dependency versions (vello, vello_encoding, wgpu —
  currently 0.9.0 / 0.9.0 / 29.0.4, see `benchmarks/vello-wgpu-dependency-cost.md`).
- Packet: fixture name, viewport (`pan`, `zoom`, CSS size, `pixelRatio`), and
  the surface format actually configured (Rgba8Unorm preferred, Bgra8Unorm
  fallback — `lib.rs` `pick_surface_format`).
- Capture method (below) and the diff tool + tolerance used before accepting.

## How to capture the module's presented output

The surface is module-owned and **no pixels cross back to the host** (the
packet is the only per-frame crossing; readback is not a per-frame path). The
capture must therefore happen browser-side, on the recorded environment:

1. Drive the editor (or the spike's fixture harness page) to the fixture frame
   on the recorded environment — same packets the headless harness encodes.
2. Capture the canvas element as presented, e.g. a headless-browser
   element screenshot (`page.screenshot` clipped to the canvas) or a
   compositor-level capture of the surface. A WebGPU canvas has no readable
   drawing buffer via `toDataURL`/`toBlob`, so those APIs are not a capture
   path.
3. Hash the captured RGBA buffer and record the environment fields above.

**Do not add a per-frame pixel readback export to the module to make capture
easier.** "No pixel readback to the host" is a ratified boundary (the packet is
the only per-frame crossing); a *debug-only* readback export for recording
would still be a new crossing and needs an ADR-level decision, not an
implementation shortcut.

## Rect-only pixel identity against the pre-change host (task 6.4)

The rect-only path SHALL render pixel-identically to the pre-change TypeGPU
host on the recorded environment. The old host is retired (section 6) and its
pixel references were retired with it, so the identity check is:

- **Encode-level identity — already verified headless:** v2 packets (the only
  packets the interactive encoder produces) flow through the v3 pipeline with
  identical stream fingerprints, and the rect fast path holds
  (`benchmarks/protocol-v2-batch.test.ts`).
- **On-screen identity — spike task:** capture the new host's rect-only output
  on the spike environment and diff against the pre-change host's output. The
  pre-change host is still available in git history (before the section-6
  retirement commit); running it on the same environment is the only honest
  way to produce its pixels now that its committed references are gone.

### The one deliberate compositing difference the spike must witness

The retired host drew per layer (`scene → grid → selection → preview → guide`).
The scene-encoded path draws authored + preview commands, then the selection
outline, then grid/guides — **grid now composites above selection chrome and
the preview instead of below them**. This was verified against the code:
`ordered-submission-batches` layer order in the retired
`webgpu-renderer.ts` (`submissionLayers = ["scene", "grid", "selection",
"preview", "guide", "ruler"]`) vs the encoder's `encode_overlays` (selection
outline, then grid, then guides, after the authored command list — witnessed
headlessly by the COLOR-tag order test in `lib.rs`). It is a deliberate
renderer-state choice; the spike's pixel diff must record it as expected, not
"fix" it as a regression.

## Diff before accepting

A candidate reference is accepted only after a pixel diff against the current
reference (or against the pre-change host for the 6.4 check) with a declared
tolerance, and the diff result is recorded beside the reference:

- Identical within tolerance → the candidate *replaces* the reference only when
  the change was deliberate (dependency bump, encoder change); otherwise the
  diff is a regression and the harness must fail (spec: "A rendering regression
  fails the harness").
- Any change beyond the recorded tolerance that was not part of an explicit,
  justified re-recording act is a regression, not a re-record.

## Re-recording is an explicit, isolated act

- Re-recording happens only with a justification (a deliberate encoder or
  dependency change that legitimately alters output), and the commit that
  changes the references contains **nothing else** — no code, no docs, no other
  fixtures.
- The commit message records the environment, the toolchain, the pinned
  versions and the reason (the same fields the references file records).
- A reference change without that justification fails review.

## Runbook

```sh
# Encode-level recording (headless, already wired):
cd packages/scene-renderer-wasm
CRAFTY_RECORD_PARITY_REFERENCES=1 npx vitest run benchmarks/encode-parity.test.ts
# prints PARITY_REFERENCE_* lines for transcription into parity-references.ts
# — commit containing nothing else.

# Browser readiness barrier (does not record or fabricate pixel evidence):
node scripts/vello-browser-spike.mjs --url https://127.0.0.1:4173
# Exit 0 means the page has a sized canvas, WebGPU, module-owned runtime,
# and a submitted frame. Exit 2 prints structured blockers and is expected on
# machines without a real browser/GPU.

# Pixel-level recording: still pending the real-browser spike (tasks 2.3–2.6).
# Once the readiness command passes, capture/diff on that recorded environment;
# record environment and diff results beside the hashes in an isolated change.
```
