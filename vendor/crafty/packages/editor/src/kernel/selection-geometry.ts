import {
  inverseTransform,
  multiplyTransforms,
  transformPoint,
  type Point,
} from "./coordinates.js";
import type { AffineTransform, Rect } from "./document.js";
import type { ResizeHandle } from "./interaction.js";
import type { SelectionProjectionBox } from "./selection-projection.js";

export interface ResizeOptions {
  constrainAspect: boolean;
  fromCenter: boolean;
  minSize: number;
}

/** Resizes local bounds from one handle after converting the world delta
 * through the node's composed transform. */
export const projectConstrainedResize = (
  start: Rect,
  handle: ResizeHandle,
  worldDelta: Point,
  worldTransform: AffineTransform,
  options: ResizeOptions,
): Rect => {
  const det =
    worldTransform.a * worldTransform.d - worldTransform.b * worldTransform.c;
  const dx =
    det !== 0
      ? (worldTransform.d * worldDelta.x - worldTransform.c * worldDelta.y) /
        det
      : worldDelta.x;
  const dy =
    det !== 0
      ? (-worldTransform.b * worldDelta.x + worldTransform.a * worldDelta.y) /
        det
      : worldDelta.y;
  const east = handle === "e" || handle === "ne" || handle === "se";
  const west = handle === "w" || handle === "nw" || handle === "sw";
  const south = handle === "s" || handle === "se" || handle === "sw";
  const north = handle === "n" || handle === "ne" || handle === "nw";
  let width = start.width + (east ? dx : west ? -dx : 0);
  let height = start.height + (south ? dy : north ? -dy : 0);
  if (options.constrainAspect && start.width > 0 && start.height > 0) {
    const ratio = start.width / start.height;
    const relativeX = Math.abs(width - start.width) / start.width;
    const relativeY = Math.abs(height - start.height) / start.height;
    if (relativeX >= relativeY) height = width / ratio;
    else width = height * ratio;
  }
  width = Math.max(options.minSize, width);
  height = Math.max(options.minSize, height);
  if (options.fromCenter) {
    return {
      x: start.x + (start.width - width) / 2,
      y: start.y + (start.height - height) / 2,
      width,
      height,
    };
  }
  const horizontalSide = (east || west) && !north && !south;
  const verticalSide = (north || south) && !east && !west;
  return {
    x:
      verticalSide && options.constrainAspect
        ? start.x + (start.width - width) / 2
        : east
          ? start.x
          : west
            ? start.x + (start.width - width)
            : start.x,
    y:
      horizontalSide && options.constrainAspect
        ? start.y + (start.height - height) / 2
        : south
          ? start.y
          : north
            ? start.y + (start.height - height)
            : start.y,
    width,
    height,
  };
};

const translation = (x: number, y: number): AffineTransform => ({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: x,
  f: y,
});

const rotation = (radians: number): AffineTransform => {
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return { a: cosine, b: sine, c: -sine, d: cosine, e: 0, f: 0 };
};

/** Projects an absolute authored transform from a fixed gesture start, so
 * repeated preview samples cannot accumulate rotation. */
export const projectRotatedTransform = (
  startTransform: AffineTransform,
  startBox: SelectionProjectionBox,
  startWorldPoint: Point,
  currentWorldPoint: Point,
  constrainTo15Degrees: boolean,
): AffineTransform => {
  const center = transformPoint(
    {
      x: startBox.bounds.x + startBox.bounds.width / 2,
      y: startBox.bounds.y + startBox.bounds.height / 2,
    },
    startBox.transform,
  );
  const startAngle = Math.atan2(
    startWorldPoint.y - center.y,
    startWorldPoint.x - center.x,
  );
  const currentAngle = Math.atan2(
    currentWorldPoint.y - center.y,
    currentWorldPoint.x - center.x,
  );
  let delta = currentAngle - startAngle;
  if (constrainTo15Degrees) {
    const step = Math.PI / 12;
    delta = Math.round(delta / step) * step;
  }
  const inverseStart = inverseTransform(startTransform);
  if (!inverseStart) return startTransform;
  const placement = multiplyTransforms(startBox.transform, inverseStart);
  const inversePlacement = inverseTransform(placement);
  if (!inversePlacement) return startTransform;
  const worldRotation = multiplyTransforms(
    translation(center.x, center.y),
    multiplyTransforms(rotation(delta), translation(-center.x, -center.y)),
  );
  return multiplyTransforms(
    inversePlacement,
    multiplyTransforms(worldRotation, startBox.transform),
  );
};
