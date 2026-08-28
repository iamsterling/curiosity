"use client"

import { forwardRef, useState, type HTMLAttributes } from "react"
import type { RendererEvidence, RendererProof, SceneRenderer } from "@crafty/scene-renderer"

/**
 * Renderer proof surface. `VERIFIED` requires all three checks: the Rust/WASM
 * module instantiated and exposed `RendererCore`, the module created its own
 * WebGPU device, surface and present pipeline (`init_canvas` succeeded), and
 * the current frame reported draw commands through the versioned protocol. A
 * WebGL context is never requested.
 */
const RendererProofChip = forwardRef<HTMLButtonElement, { backend: SceneRenderer["backend"]; proof: RendererProof | undefined; evidence: RendererEvidence | undefined } & HTMLAttributes<HTMLButtonElement>>(
  ({ backend, proof, evidence, ...props }, ref) => {
    const [open, setOpen] = useState(false)
    const verified = Boolean(proof && evidence)
    return (
      <>
        <button ref={ref} className={`proof-chip ${verified ? "verified" : "pending"}`} data-testid="renderer-proof" aria-expanded={open} onClick={() => setOpen((value) => !value)} {...props}>
          <span className="live-dot" aria-hidden="true" /> {verified ? "VERIFIED" : "PENDING"} · {backend === "wasm" ? "WASM" : "unavailable"}
          {evidence ? ` · v${evidence.protocolVersion} · ${evidence.commandCount} cmds` : ""}
        </button>
        {open ? (
          <section className="renderer-proof" aria-label="Renderer proof">
            <div className="proof-heading">
              <span>Runtime proof</span>
              <strong className={verified ? "proof-verified" : "proof-pending"}>{verified ? "VERIFIED" : "PENDING"}</strong>
            </div>
            <div className="proof-row">
              <strong>WASM</strong><span>{proof ? "Rust module instantiated" : "Waiting for module"}</span>
              <code>{proof?.wasm.exports.join(", ") || "RendererCore"}</code>
            </div>
            <div className="proof-row">
              <strong>WebGPU</strong><span>{proof ? "Module-owned device + surface" : "Waiting for module"}</span>
              <code>{proof ? `${proof.webgpu.format} · device, surface, render, present in Rust` : "No WebGL fallback"}</code>
            </div>
            <div className="proof-row">
              <strong>Draw path</strong><span>{evidence ? `${evidence.commandCount} commands submitted` : "Waiting for frame"}</span>
              <code>{evidence ? `protocol v${evidence.protocolVersion} -> WebGPU` : "WASM -> WebGPU"}</code>
            </div>
          </section>
        ) : null}
      </>
    )
  }
)
RendererProofChip.displayName = "RendererProofChip"

export { RendererProofChip }
