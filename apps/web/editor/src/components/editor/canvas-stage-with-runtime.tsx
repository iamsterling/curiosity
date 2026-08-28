"use client";

import { CanvasStage, type CanvasStageRuntime } from "@crafty/editor/ui";
import { loadWasmWebGpuRuntime, recoverAfterDeviceLoss } from "@crafty/scene-renderer/wasm";

/**
 * Wires the WASM/WebGPU runtime loader into the canvas stage. The stage is a
 * client component receiving the runtime as a prop — the wasm package depends
 * on the editor kernel, so the loader is composed here (the app), not imported
 * by the editor package.
 */
const runtime: CanvasStageRuntime = {
  load: loadWasmWebGpuRuntime,
  recoverAfterDeviceLoss,
};

export function CanvasStageWithRuntime() {
  return <CanvasStage runtime={runtime} />;
}
