import type { PointerInput } from "@crafty/editor/kernel";
import type { CanvasPointerInput } from "../../modules/curiosity-canvas";

const pointerType = Object.freeze({
  cancel: "pointer-cancel",
  down: "pointer-down",
  move: "pointer-move",
  up: "pointer-up",
} as const);

export const toCraftyPointerInput = (
  input: CanvasPointerInput,
): PointerInput => ({
  altKey: input.altKey ?? false,
  button: 0,
  ...(input.clickCount !== undefined ? { clickCount: input.clickCount } : {}),
  ctrlKey: input.ctrlKey ?? false,
  point: { x: input.x, y: input.y },
  pointerId: input.pointerId,
  shiftKey: input.shiftKey ?? false,
  spaceKey: false,
  type: pointerType[input.phase],
});
