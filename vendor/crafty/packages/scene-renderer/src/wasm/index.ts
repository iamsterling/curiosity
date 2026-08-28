import init, { RendererCore, resolve_layout } from "../../pkg/crafty_renderer_wasm.js";
import type { RendererProof, WasmRendererRuntime } from "../index.js";
import { createModuleErrorRelay, createWebGpuRendererInstance, recoverAfterDeviceLoss, type RecoveryOutcome } from "./webgpu-renderer.js";

/**
 * The raw wasm-bindgen glue, re-exported for headless consumers (the app's
 * renderer regression benchmarks) that need the module without a canvas —
 * `loadWasmWebGpuRuntime` below is the browser path.
 */
export { default as initWasm, RendererCore } from "../../pkg/crafty_renderer_wasm.js";
export { serializeRenderPacket } from "./webgpu-renderer.js";

interface NavigatorWithGpu extends Navigator {
  gpu?: {
    getPreferredCanvasFormat(): string;
  };
}

export const loadWasmWebGpuRuntime = async (canvas: HTMLCanvasElement): Promise<WasmRendererRuntime> => {
  const gpu = (navigator as NavigatorWithGpu).gpu;
  if (!gpu) throw new Error("WebGPU is unavailable; Crafty does not use a WebGL fallback.");
  const wasmOutput = await init();
  const core = new RendererCore();
  const relay = createModuleErrorRelay();
  // The callback must be registered before init_canvas: device loss can fire
  // at any point after requestDevice, and a renderer that loses its device
  // silently is a blank canvas with no diagnostic. The module reports
  // strings; the relay maps them onto the failure-policy vocabulary.
  core.set_error_callback((message: string) => relay.receive(message));
  try {
    // The canvas is handed over once: from here on the module owns device,
    // surface, render and present (the react-vello model), and the only
    // per-frame crossing is the packet. Re-running this whole runtime load
    // after a device loss is the recovery path.
    await core.init_canvas(canvas);
  } catch (error: unknown) {
    // The module rejects with a structured `VELLO_RENDER_FAILED:init:<stage>`
    // string; surface it as-is so the app's diagnostic shows the stage.
    throw new Error(error instanceof Error ? error.message : "The WebGPU renderer could not initialize.");
  }
  const proof: RendererProof = {
    wasm: { verified: true, exports: Object.keys(wasmOutput).filter((key) => key.toLowerCase().includes("renderercore")), memoryBytes: wasmOutput.memory.buffer.byteLength },
    webgpu: {
      verified: true,
      format: gpu.getPreferredCanvasFormat(),
      // The host no longer touches the GPU line: init_canvas succeeding IS the
      // device+surface+renderer verification, so the proof records ownership
      // instead of a host-side readback that no longer exists.
      device: "module-owned",
      surface: "module-owned",
    },
  };
  return {
    proof,
    resolveLayout: resolve_layout,
    create(candidate) {
      if (candidate !== canvas) throw new Error("WASM renderer runtime is bound to a different canvas.");
      return createWebGpuRendererInstance(core, relay);
    },
    // Device-loss recovery on the same core: `recover_canvas` resets the
    // module's shared GPU stack and builds a fresh device (a plain re-init
    // would REUSE the shared device — correct for a remount, wrong for a dead
    // one). The host keeps this runtime's relay as the single diagnostic owner.
    recover: () => core.recover_canvas(canvas),
  };
};

export { recoverAfterDeviceLoss };
export type { RecoveryOutcome };
