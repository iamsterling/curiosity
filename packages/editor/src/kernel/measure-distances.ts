import type { Rect } from "./document.js";

export type MeasurementAxis = "x" | "y";
export type MeasurementRelation = "gap" | "overlap" | "touching";

export interface DistanceFact {
  axis: MeasurementAxis;
  /** The positive extent of the gap/overlap in world units. */
  distance: number;
  relation: MeasurementRelation;
  /** The facing edges, useful to an overlay without redoing geometry. */
  from: number;
  to: number;
}

export interface ParentEdgeFacts {
  left: DistanceFact;
  right: DistanceFact;
  top: DistanceFact;
  bottom: DistanceFact;
}

const axisFact = (axis: MeasurementAxis, aStart: number, aSize: number, bStart: number, bSize: number): DistanceFact => {
  const aEnd = aStart + aSize;
  const bEnd = bStart + bSize;
  if (aEnd < bStart) return { axis, distance: bStart - aEnd, relation: "gap", from: aEnd, to: bStart };
  if (bEnd < aStart) return { axis, distance: aStart - bEnd, relation: "gap", from: bEnd, to: aStart };
  const overlap = Math.min(aEnd, bEnd) - Math.max(aStart, bStart);
  if (overlap === 0) return { axis, distance: 0, relation: "touching", from: Math.max(aStart, bStart), to: Math.min(aEnd, bEnd) };
  return { axis, distance: overlap, relation: "overlap", from: Math.max(aStart, bStart), to: Math.min(aEnd, bEnd) };
};

/** Pure world-space facts between two rectangles. */
export const measureDistances = (a: Rect, b: Rect): { horizontal: DistanceFact; vertical: DistanceFact } => ({
  horizontal: axisFact("x", a.x, a.width, b.x, b.width),
  vertical: axisFact("y", a.y, a.height, b.y, b.height),
});

/** Distances from a child rectangle to each inner edge of its container. */
export const measureToParentEdges = (child: Rect, container: Rect): ParentEdgeFacts => ({
  left: { axis: "x", distance: child.x - container.x, relation: child.x >= container.x ? "gap" : "overlap", from: container.x, to: child.x },
  right: { axis: "x", distance: container.x + container.width - (child.x + child.width), relation: child.x + child.width <= container.x + container.width ? "gap" : "overlap", from: child.x + child.width, to: container.x + container.width },
  top: { axis: "y", distance: child.y - container.y, relation: child.y >= container.y ? "gap" : "overlap", from: container.y, to: child.y },
  bottom: { axis: "y", distance: container.y + container.height - (child.y + child.height), relation: child.y + child.height <= container.y + container.height ? "gap" : "overlap", from: child.y + child.height, to: container.y + container.height },
});
