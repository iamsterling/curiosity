"use client";

import { CanvasStage, type CanvasStageRuntime } from "@crafty/editor/ui";
import {
  loadWasmWebGpuRuntime,
  recoverAfterDeviceLoss,
} from "@crafty/scene-renderer/wasm";

const runtime: CanvasStageRuntime = {
  load: loadWasmWebGpuRuntime,
  recoverAfterDeviceLoss,
};

export const CanvasStageWithRuntime = () => <CanvasStage runtime={runtime} />;
