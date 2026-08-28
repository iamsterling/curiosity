import type { Point } from "../editor/harness.js";

/** The canvas centre in screen pixels — where menu zooms anchor. */
export const canvasCenter = (): Point => {
  const canvas = document.querySelector<HTMLCanvasElement>(
    "canvas.scene-canvas",
  );
  const bounds = canvas?.getBoundingClientRect();
  return bounds
    ? { x: bounds.width / 2, y: bounds.height / 2 }
    : { x: 0, y: 0 };
};
