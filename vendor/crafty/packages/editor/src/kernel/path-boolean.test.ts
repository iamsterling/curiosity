import { describe, expect, it } from "vitest";
import { booleanOperate, BOOLEAN_NO_AREA_EPS, windingNumberAt, type BooleanOperation } from "./boolean.js";
import { applyDocumentCommand } from "./commands.js";
import { canonicalEditorDocumentString, createFoundationDocument, type DocumentNode, type PathGeometry, type PathPoint, type Rect } from "./document.js";
import { createEditorKernel } from "./kernel.js";
import { computePathBounds, cubicAt, cubicCubicIntersections, ORDER_KEY_STEP, orderKeyForSigned, pointsOfSubpath, type Cubic } from "./path-geometry.js";

/**
 * The boolean engine (the `vector-editing` change, section 4): table-driven
 * fixtures with known results for all four operations, curve-fragment
 * re-emission, the precondition codes, nonzero-vs-evenodd fill-rule
 * behavior, determinism, and the destructive command's exact inverse.
 */

const corner = (id: string, x: number, y: number, subpathId: string, index: number): PathPoint => ({
  id, subpathId, order: orderKeyForSigned(index * ORDER_KEY_STEP), x, y, handleMode: "corner",
});

/** A pinned rectangle-as-path (min corner at (0,0), placement carried by the node/operand). */
const rectGeometry = (width: number, height: number, subpathId = "s1"): PathGeometry => ({
  points: {
    [corner("p0", 0, 0, subpathId, 0).id]: corner("p0", 0, 0, subpathId, 0),
    [corner("p1", width, 0, subpathId, 1).id]: corner("p1", width, 0, subpathId, 1),
    [corner("p2", width, height, subpathId, 2).id]: corner("p2", width, height, subpathId, 2),
    [corner("p3", 0, height, subpathId, 3).id]: corner("p3", 0, height, subpathId, 3),
  },
  subpaths: { [subpathId]: { id: subpathId, closed: true } },
  fillRule: "nonzero",
});

const rectOperand = (width: number, height: number, placement: { x: number; y: number }): Parameters<typeof booleanOperate>[0][number] => ({
  geometry: rectGeometry(width, height),
  placement,
});

const circleGeometry = (radius: number, center: { x: number; y: number }): PathGeometry => {
  const kappa = radius * 0.5522847498307936;
  return {
    points: {
      p0: { id: "p0", subpathId: "s1", order: orderKeyForSigned(0 * ORDER_KEY_STEP), x: center.x, y: center.y - radius, handleMode: "free", handleOut: { dx: kappa, dy: 0 } },
      p1: { id: "p1", subpathId: "s1", order: orderKeyForSigned(1 * ORDER_KEY_STEP), x: center.x + radius, y: center.y, handleMode: "free", handleIn: { dx: 0, dy: -kappa }, handleOut: { dx: 0, dy: kappa } },
      p2: { id: "p2", subpathId: "s1", order: orderKeyForSigned(2 * ORDER_KEY_STEP), x: center.x, y: center.y + radius, handleMode: "free", handleIn: { dx: kappa, dy: 0 }, handleOut: { dx: -kappa, dy: 0 } },
      p3: { id: "p3", subpathId: "s1", order: orderKeyForSigned(3 * ORDER_KEY_STEP), x: center.x - radius, y: center.y, handleMode: "free", handleIn: { dx: 0, dy: kappa }, handleOut: { dx: 0, dy: -kappa } },
    },
    subpaths: { s1: { id: "s1", closed: true } },
    fillRule: "nonzero",
  };
};

const positionsOf = (geometry: PathGeometry, subpathId: string): Array<{ x: number; y: number }> =>
  pointsOfSubpath(geometry, subpathId).map((point) => ({ x: point.x, y: point.y }));

/** Whether `candidate` equals `expected` up to a cyclic rotation (walks start at their lowest-index fragment). */
const isCyclicRotation = (candidate: Array<{ x: number; y: number }>, expected: Array<{ x: number; y: number }>): boolean => {
  if (candidate.length !== expected.length) return false;
  const key = (point: { x: number; y: number }): string => `${point.x}:${point.y}`;
  const doubled = [...expected.map(key), ...expected.map(key)];
  const candidateKey = candidate.map(key).join("|");
  for (let start = 0; start < expected.length; start += 1) {
    if (doubled.slice(start, start + expected.length).join("|") === candidateKey) return true;
  }
  return false;
};

const modeCounts = (geometry: PathGeometry): { corner: number; free: number } => {
  let cornerCount = 0;
  let freeCount = 0;
  for (const point of Object.values(geometry.points)) {
    if (point.handleMode === "corner") cornerCount += 1;
    else if (point.handleMode === "free") freeCount += 1;
  }
  return { corner: cornerCount, free: freeCount };
};

/** Point-list equality within `epsilon` per coordinate (the cut points carry
 *  sub-1e-13 float noise from the parameter inversion, never more). */
const positionsCloseTo = (candidate: Array<{ x: number; y: number }>, expected: Array<{ x: number; y: number }>, epsilon = 1e-9): boolean =>
  candidate.length === expected.length && candidate.every((point, i) => {
    const target = expected[i]!;
    return Math.abs(point.x - target.x) <= epsilon && Math.abs(point.y - target.y) <= epsilon;
  });

/** Cyclic-rotation equality within `epsilon` per coordinate. */
const isCyclicRotationCloseTo = (candidate: Array<{ x: number; y: number }>, expected: Array<{ x: number; y: number }>, epsilon = 1e-9): boolean => {
  if (candidate.length !== expected.length) return false;
  for (let start = 0; start < expected.length; start += 1) {
    const rotated = expected.map((_, i) => expected[(start + i) % expected.length]!);
    if (positionsCloseTo(candidate, rotated, epsilon)) return true;
  }
  return false;
};

const pathNodeWith = (id: string, geometry: PathGeometry, bounds: Rect, zIndex = 3): DocumentNode => ({
  id, kind: "path", name: id, parentId: "frame-foundation", childIds: [],
  bounds, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex, path: geometry,
});

const kernelWithPaths = (nodes: Array<{ node: DocumentNode }>): ReturnType<typeof createEditorKernel> => {
  const kernel = createEditorKernel(createFoundationDocument());
  for (const { node } of nodes) kernel.dispatch({ type: "create-node", node }, "Add path");
  return kernel;
};

const boundsOf = (geometry: PathGeometry): Rect => {
  const bbox = computePathBounds(geometry);
  return { x: 0, y: 0, width: bbox.maxX - bbox.minX, height: bbox.maxY - bbox.minY };
};

describe("boolean engine: the four operations on overlapping rectangles", () => {
  const a = rectOperand(100, 100, { x: 0, y: 0 });
  const b = rectOperand(100, 100, { x: 50, y: 50 });

  it("union is the 8-point L-outline", () => {
    const { geometry, placement } = booleanOperate([a, b], "union");
    expect(Object.keys(geometry.subpaths)).toHaveLength(1);
    const subpathId = Object.keys(geometry.subpaths)[0]!;
    expect(positionsOf(geometry, subpathId)).toEqual([
      { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 150, y: 50 },
      { x: 150, y: 150 }, { x: 50, y: 150 }, { x: 50, y: 100 }, { x: 0, y: 100 },
    ]);
    expect(modeCounts(geometry)).toEqual({ corner: 8, free: 0 });
    expect(boundsOf(geometry)).toEqual({ x: 0, y: 0, width: 150, height: 150 });
    expect(placement).toEqual({ x: 0, y: 0 });
  });

  it("intersect is the 50x50 overlap rectangle", () => {
    const { geometry, placement } = booleanOperate([a, b], "intersect");
    expect(Object.keys(geometry.subpaths)).toHaveLength(1);
    const subpathId = Object.keys(geometry.subpaths)[0]!;
    expect(positionsOf(geometry, subpathId)).toEqual([
      { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 }, { x: 0, y: 0 },
    ]);
    expect(modeCounts(geometry)).toEqual({ corner: 4, free: 0 });
    expect(boundsOf(geometry)).toEqual({ x: 0, y: 0, width: 50, height: 50 });
    expect(placement).toEqual({ x: 50, y: 50 });
  });

  it("subtract is the 6-point notch", () => {
    const { geometry, placement } = booleanOperate([a, b], "subtract");
    expect(Object.keys(geometry.subpaths)).toHaveLength(1);
    const subpathId = Object.keys(geometry.subpaths)[0]!;
    expect(positionsOf(geometry, subpathId)).toEqual([
      { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 100 },
    ]);
    expect(modeCounts(geometry)).toEqual({ corner: 6, free: 0 });
    expect(boundsOf(geometry)).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    expect(placement).toEqual({ x: 0, y: 0 });
  });

  it("exclude is the two disjoint L-shapes", () => {
    const { geometry, placement } = booleanOperate([a, b], "exclude");
    expect(Object.keys(geometry.subpaths)).toHaveLength(2);
    const [first, second] = Object.keys(geometry.subpaths);
    // Each lobe's walk starts at its lowest-index kept fragment, so the
    // contours are known up to cyclic rotation.
    expect(isCyclicRotation(positionsOf(geometry, first!), [
      { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 100 },
    ])).toBe(true);
    expect(isCyclicRotation(positionsOf(geometry, second!), [
      { x: 100, y: 50 }, { x: 150, y: 50 }, { x: 150, y: 150 }, { x: 50, y: 150 }, { x: 50, y: 100 }, { x: 100, y: 100 },
    ])).toBe(true);
    expect(modeCounts(geometry)).toEqual({ corner: 12, free: 0 });
    expect(boundsOf(geometry)).toEqual({ x: 0, y: 0, width: 150, height: 150 });
    expect(placement).toEqual({ x: 0, y: 0 });
  });

  it("is deterministic: two runs produce byte-identical geometry", () => {
    const first = booleanOperate([a, b], "union");
    const second = booleanOperate([a, b], "union");
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("handles the shared-edge case: adjacent rectangles union into the 2x1 outline", () => {
    const { geometry } = booleanOperate([rectOperand(100, 100, { x: 0, y: 0 }), rectOperand(100, 100, { x: 100, y: 0 })], "union");
    expect(Object.keys(geometry.subpaths)).toHaveLength(1);
    const subpathId = Object.keys(geometry.subpaths)[0]!;
    expect(positionsOf(geometry, subpathId)).toEqual([
      { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 100 }, { x: 100, y: 100 }, { x: 0, y: 100 },
    ]);
    expect(boundsOf(geometry)).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });

  it("handles the corner-touch case: the touching squares trace as two loops", () => {
    const { geometry } = booleanOperate([rectOperand(100, 100, { x: 0, y: 0 }), rectOperand(100, 100, { x: 100, y: 100 })], "union");
    expect(Object.keys(geometry.subpaths)).toHaveLength(2);
    const loops = Object.keys(geometry.subpaths).map((subpathId) => positionsOf(geometry, subpathId)).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    expect(loops).toEqual([
      [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 },
      ],
      [
        { x: 100, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 }, { x: 100, y: 200 },
      ],
    ]);
    expect(boundsOf(geometry)).toEqual({ x: 0, y: 0, width: 200, height: 200 });
  });
});

describe("boolean engine: generic T-junction overlaps (non-midpoint crossings)", () => {
  // Two 100×100 squares, the second offset (25,25): every crossing lands at
  // non-midpoint parameters (t = 1/4 and 3/4) on both edges — the failure
  // family the section-4 fixture matrix missed (the engine resolved empty).
  const a = rectOperand(100, 100, { x: 0, y: 0 });
  const b = rectOperand(100, 100, { x: 25, y: 25 });

  it("union is the 8-point L-outline", () => {
    const { geometry, placement } = booleanOperate([a, b], "union");
    expect(Object.keys(geometry.subpaths)).toHaveLength(1);
    const subpathId = Object.keys(geometry.subpaths)[0]!;
    // The crossing points carry sub-1e-13 noise from the parameter inversion;
    // the authored corners are exact.
    expect(positionsCloseTo(positionsOf(geometry, subpathId), [
      { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 25 }, { x: 125, y: 25 },
      { x: 125, y: 125 }, { x: 25, y: 125 }, { x: 25, y: 100 }, { x: 0, y: 100 },
    ])).toBe(true);
    expect(modeCounts(geometry)).toEqual({ corner: 8, free: 0 });
    expect(boundsOf(geometry)).toEqual({ x: 0, y: 0, width: 125, height: 125 });
    expect(placement).toEqual({ x: 0, y: 0 });
  });

  it("intersect is the 75x75 overlap", () => {
    const { geometry, placement } = booleanOperate([a, b], "intersect");
    expect(Object.keys(geometry.subpaths)).toHaveLength(1);
    const subpathId = Object.keys(geometry.subpaths)[0]!;
    expect(isCyclicRotationCloseTo(positionsOf(geometry, subpathId), [
      { x: 0, y: 0 }, { x: 75, y: 0 }, { x: 75, y: 75 }, { x: 0, y: 75 },
    ])).toBe(true);
    expect(modeCounts(geometry)).toEqual({ corner: 4, free: 0 });
    expect(boundsOf(geometry)).toEqual({ x: 0, y: 0, width: 75, height: 75 });
    // The placement is the world-bbox min corner; the rebase subtracts it, so
    // it carries the same sub-1e-13 noise as the cut positions.
    expect(Math.abs(placement.x - 25)).toBeLessThan(1e-9);
    expect(Math.abs(placement.y - 25)).toBeLessThan(1e-9);
  });

  it("subtract is the 6-point L", () => {
    const { geometry, placement } = booleanOperate([a, b], "subtract");
    expect(Object.keys(geometry.subpaths)).toHaveLength(1);
    const subpathId = Object.keys(geometry.subpaths)[0]!;
    expect(positionsCloseTo(positionsOf(geometry, subpathId), [
      { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 25 }, { x: 25, y: 25 },
      { x: 25, y: 100 }, { x: 0, y: 100 },
    ])).toBe(true);
    expect(modeCounts(geometry)).toEqual({ corner: 6, free: 0 });
    expect(boundsOf(geometry)).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    expect(placement).toEqual({ x: 0, y: 0 });
  });

  it("exclude is the two disjoint L-lobes", () => {
    const { geometry, placement } = booleanOperate([a, b], "exclude");
    expect(Object.keys(geometry.subpaths)).toHaveLength(2);
    const [first, second] = Object.keys(geometry.subpaths);
    expect(isCyclicRotationCloseTo(positionsOf(geometry, first!), [
      { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 25 }, { x: 25, y: 25 },
      { x: 25, y: 100 }, { x: 0, y: 100 },
    ])).toBe(true);
    expect(isCyclicRotationCloseTo(positionsOf(geometry, second!), [
      { x: 100, y: 25 }, { x: 125, y: 25 }, { x: 125, y: 125 }, { x: 25, y: 125 },
      { x: 25, y: 100 }, { x: 100, y: 100 },
    ])).toBe(true);
    expect(modeCounts(geometry)).toEqual({ corner: 12, free: 0 });
    expect(boundsOf(geometry)).toEqual({ x: 0, y: 0, width: 125, height: 125 });
    expect(placement).toEqual({ x: 0, y: 0 });
  });

  it("is deterministic: two runs produce byte-identical geometry", () => {
    const first = booleanOperate([a, b], "union");
    const second = booleanOperate([a, b], "union");
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("handles the corner-on-edge T: a square corner landing on the other's edge", () => {
    // B's top-right corner (100,50) lands on A's right edge interior, and B's
    // right edge runs coincident with A's right edge below it — the corner
    // dedupe must merge A's continuing edge with B's edge-crossing.
    const c = rectOperand(100, 100, { x: 0, y: 0 });
    const d = rectOperand(75, 25, { x: 25, y: 50 });
    const union = booleanOperate([c, d], "union");
    expect(Object.keys(union.geometry.subpaths)).toHaveLength(1);
    const unionId = Object.keys(union.geometry.subpaths)[0]!;
    expect(positionsOf(union.geometry, unionId)).toEqual([
      { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 },
    ]);
    const intersect = booleanOperate([c, d], "intersect");
    const intersectId = Object.keys(intersect.geometry.subpaths)[0]!;
    expect(isCyclicRotation(positionsOf(intersect.geometry, intersectId), [
      { x: 0, y: 0 }, { x: 75, y: 0 }, { x: 75, y: 25 }, { x: 0, y: 25 },
    ])).toBe(true);
    expect(intersect.placement).toEqual({ x: 25, y: 50 });
    const subtract = booleanOperate([c, d], "subtract");
    expect(Object.keys(subtract.geometry.subpaths)).toHaveLength(1);
    const subtractId = Object.keys(subtract.geometry.subpaths)[0]!;
    expect(positionsOf(subtract.geometry, subtractId)).toEqual([
      { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 25, y: 50 },
      { x: 25, y: 75 }, { x: 100, y: 75 }, { x: 100, y: 100 }, { x: 0, y: 100 },
    ]);
    expect(subtract.placement).toEqual({ x: 0, y: 0 });
    const exclude = booleanOperate([c, d], "exclude");
    expect(Object.keys(exclude.geometry.subpaths)).toHaveLength(1);
    const excludeId = Object.keys(exclude.geometry.subpaths)[0]!;
    expect(positionsOf(exclude.geometry, excludeId)).toEqual([
      { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 25, y: 50 },
      { x: 25, y: 75 }, { x: 100, y: 75 }, { x: 100, y: 100 }, { x: 0, y: 100 },
    ]);
  });

  it("handles a curved-vs-straight mid-edge crossing (non-midpoint curve cuts)", () => {
    // A circle whose arcs cross a rect's edges at interior points of BOTH:
    // the rect's top edge y=25 meets the circle's upper-right arc at x =
    // 50 + sqrt(50² − 25²) = 93.3 (t = 0.83 on the rect edge, mid-arc on the
    // circle), and the rect's bottom edge y=70 meets the lower-right arc at
    // x = 50 + sqrt(50² − 20²) = 95.8 (t = 0.87 on the rect edge) — neither
    // a midpoint, a corner nor a shared edge. The rect's left edge stays
    // fully inside the circle, so the union outline is 4 circle runs + 3
    // rect edges.
    const circle = circleGeometry(50, { x: 50, y: 50 });
    const result = booleanOperate([{ geometry: circle, placement: { x: 0, y: 0 } }, rectOperand(70, 45, { x: 35, y: 25 })], "union");
    expect(Object.keys(result.geometry.subpaths)).toHaveLength(1);
    const subpathId = Object.keys(result.geometry.subpaths)[0]!;
    const positions = positionsOf(result.geometry, subpathId);
    // The cut positions carry the near-linear approximation error of the
    // recursion's closed form (a fraction of the topology cell), so the
    // crossings are asserted within 0.05; the authored corners are exact.
    expect(positionsCloseTo(positions, [
      { x: 50, y: 0 }, { x: 50 + Math.sqrt(1875), y: 25 }, { x: 105, y: 25 }, { x: 105, y: 70 },
      { x: 50 + Math.sqrt(2100), y: 70 }, { x: 50, y: 100 }, { x: 0, y: 50 },
    ], 0.05)).toBe(true);
    expect(boundsOf(result.geometry)).toEqual({ x: 0, y: 0, width: 105, height: 100 });
    // The two rect corners poking out of the circle are exact corners; the
    // arc crossings are free points.
    expect(modeCounts(result.geometry).corner).toBe(2);
  });
});

describe("boolean engine: curve fragments", () => {
  it("re-emits the original circle when the other operand is fully inside it", () => {
    const circle = circleGeometry(50, { x: 50, y: 50 });
    const result = booleanOperate([{ geometry: circle, placement: { x: 0, y: 0 } }, rectOperand(60, 60, { x: 20, y: 20 })], "union");
    expect(Object.keys(result.geometry.subpaths)).toHaveLength(1);
    const subpathId = Object.keys(result.geometry.subpaths)[0]!;
    // Four merged runs — the whole segments, cut fragments merged back — so
    // the re-emission reproduces the authored circle up to float round-trip
    // through the control-point representation.
    const emitted = pointsOfSubpath(result.geometry, subpathId);
    const expected = ["p0", "p1", "p2", "p3"].map((id) => circle.points[id]!);
    expect(emitted.map((point) => ({ x: point.x, y: point.y, handleMode: point.handleMode })))
      .toEqual(expected.map((point) => ({ x: point.x, y: point.y, handleMode: point.handleMode })));
    for (let i = 0; i < emitted.length; i += 1) {
      const out = emitted[i]!.handleOut;
      const expectedOut = expected[i]!.handleOut!;
      expect(out!.dx).toBeCloseTo(expectedOut.dx, 10);
      expect(out!.dy).toBeCloseTo(expectedOut.dy, 10);
    }
  });

  it("keeps bezier arcs and exact linear corners on a partial overlap", () => {
    const circle = circleGeometry(50, { x: 50, y: 50 });
    const result = booleanOperate([{ geometry: circle, placement: { x: 0, y: 0 } }, rectOperand(90, 50, { x: 30, y: 30 })], "union");
    expect(Object.keys(result.geometry.subpaths)).toHaveLength(1);
    const subpathId = Object.keys(result.geometry.subpaths)[0]!;
    const positions = positionsOf(result.geometry, subpathId);
    expect(positions).toHaveLength(7);
    const modes = modeCounts(result.geometry);
    // The two rect corners poking out of the circle are exact corners; the
    // five surviving pieces (3 arcs + 2 merged runs) carry real handles.
    expect(modes.corner).toBe(2);
    expect(modes.free).toBe(5);
    const corners = pointsOfSubpath(result.geometry, subpathId).filter((point) => point.handleMode === "corner").map((point) => ({ x: point.x, y: point.y }));
    expect(corners).toEqual([{ x: 120, y: 30 }, { x: 120, y: 80 }]);
    expect(positions[0]).toEqual({ x: 50, y: 0 });
    expect(positions[1]!.x).toBeCloseTo(95.826, 1);
    expect(positions[1]!.y).toBeCloseTo(30, 1);
    for (const point of pointsOfSubpath(result.geometry, subpathId)) {
      if (point.handleMode === "free") {
        expect(Math.hypot(point.handleOut?.dx ?? 0, point.handleOut?.dy ?? 0)).toBeGreaterThan(1);
      }
    }
    expect(boundsOf(result.geometry)).toEqual({ x: 0, y: 0, width: 120, height: 100 });
  });
});

describe("boolean engine: preconditions", () => {
  const a = rectOperand(100, 100, { x: 0, y: 0 });
  const b = rectOperand(100, 100, { x: 50, y: 50 });

  it("refuses fewer than two operands", () => {
    expect(() => booleanOperate([a], "union")).toThrow("VECTOR_BOOLEAN_MIN_OPERANDS");
  });

  it("refuses an open subpath", () => {
    const open = { ...a.geometry, subpaths: { s1: { id: "s1", closed: false } } };
    expect(() => booleanOperate([{ geometry: open, placement: a.placement }, b], "union")).toThrow("VECTOR_BOOLEAN_OPEN_SUBPATH");
  });

  it("refuses an operand that encloses no area", () => {
    const degenerate: PathGeometry = {
      points: {
        p0: corner("p0", 0, 0, "s1", 0),
        p1: corner("p1", 100, 0, "s1", 1),
        p2: corner("p2", 100, 0, "s1", 2),
        p3: corner("p3", 0, 0, "s1", 3),
      },
      subpaths: { s1: { id: "s1", closed: true } },
      fillRule: "nonzero",
    };
    expect(() => booleanOperate([{ geometry: degenerate, placement: { x: 0, y: 0 } }, b], "union")).toThrow("VECTOR_BOOLEAN_NO_AREA");
    expect(Math.abs(0)).toBeLessThan(BOOLEAN_NO_AREA_EPS);
  });
});

describe("boolean engine: per-operand fill rule", () => {
  it("honors a nonzero hole: union with a square inside the hole keeps the square", () => {
    const holeRing: PathGeometry = {
      points: {
        p0: corner("p0", 0, 0, "outer", 0),
        p1: corner("p1", 200, 0, "outer", 1),
        p2: corner("p2", 200, 200, "outer", 2),
        p3: corner("p3", 0, 200, "outer", 3),
        // The inner subpath traversed opposite to the outer: nonzero reads a hole.
        p4: corner("p4", 50, 150, "inner", 0),
        p5: corner("p5", 150, 150, "inner", 1),
        p6: corner("p6", 150, 50, "inner", 2),
        p7: corner("p7", 50, 50, "inner", 3),
      },
      subpaths: { outer: { id: "outer", closed: true }, inner: { id: "inner", closed: true } },
      fillRule: "nonzero",
    };
    const result = booleanOperate([{ geometry: holeRing, placement: { x: 0, y: 0 } }, rectOperand(50, 50, { x: 75, y: 75 })], "union");
    // Ring outer + ring inner + the square: three contours.
    expect(Object.keys(result.geometry.subpaths)).toHaveLength(3);
    expect(Object.values(result.geometry.points)).toHaveLength(12);
    const all = Object.values(result.geometry.points).map((point) => ({ x: point.x, y: point.y }));
    for (const position of [{ x: 75, y: 75 }, { x: 125, y: 75 }, { x: 125, y: 125 }, { x: 75, y: 125 }]) {
      expect(all).toContainEqual(position);
    }
    expect(boundsOf(result.geometry)).toEqual({ x: 0, y: 0, width: 200, height: 200 });
  });

  it("distinguishes evenodd from nonzero on a same-orientation hole", () => {
    const sameOrientation: PathGeometry = {
      points: {
        p0: corner("p0", 0, 0, "outer", 0),
        p1: corner("p1", 200, 0, "outer", 1),
        p2: corner("p2", 200, 200, "outer", 2),
        p3: corner("p3", 0, 200, "outer", 3),
        p4: corner("p4", 50, 50, "inner", 0),
        p5: corner("p5", 150, 50, "inner", 1),
        p6: corner("p6", 150, 150, "inner", 2),
        p7: corner("p7", 50, 150, "inner", 3),
      },
      subpaths: { outer: { id: "outer", closed: true }, inner: { id: "inner", closed: true } },
      fillRule: "evenodd",
    };
    const square = rectOperand(200, 200, { x: 0, y: 0 });
    const evenodd = booleanOperate([{ geometry: sameOrientation, placement: { x: 0, y: 0 } }, square], "intersect");
    // Even-odd reads the inner subpath as a hole: two contours.
    expect(Object.keys(evenodd.geometry.subpaths)).toHaveLength(2);
    expect(Object.values(evenodd.geometry.points)).toHaveLength(8);
    // The same geometry with nonzero fills the "hole": one contour.
    const nonzero = booleanOperate([{ geometry: { ...sameOrientation, fillRule: "nonzero" }, placement: { x: 0, y: 0 } }, square], "intersect");
    expect(Object.keys(nonzero.geometry.subpaths)).toHaveLength(1);
    expect(Object.values(nonzero.geometry.points)).toHaveLength(4);
  });
});

describe("winding number", () => {
  it("counts signed crossings on a square", () => {
    const geometry = rectGeometry(100, 100);
    expect(windingNumberAt(geometry, "s1", { x: 50, y: 50 })).not.toBe(0);
    expect(windingNumberAt(geometry, "s1", { x: 150, y: 50 })).toBe(0);
    expect(windingNumberAt(geometry, "s1", { x: 50, y: -1 })).toBe(0);
  });

  it("reports zero in a nonzero hole", () => {
    const geometry: PathGeometry = {
      points: {
        p0: corner("p0", 0, 0, "outer", 0),
        p1: corner("p1", 100, 0, "outer", 1),
        p2: corner("p2", 100, 100, "outer", 2),
        p3: corner("p3", 0, 100, "outer", 3),
        p4: corner("p4", 40, 40, "inner", 0),
        p5: corner("p5", 60, 40, "inner", 1),
        p6: corner("p6", 60, 60, "inner", 2),
        p7: corner("p7", 40, 60, "inner", 3),
      },
      subpaths: { outer: { id: "outer", closed: true }, inner: { id: "inner", closed: true } },
      fillRule: "nonzero",
    };
    expect(windingNumberAt(geometry, "outer", { x: 50, y: 50 })).not.toBe(0);
    // The inner subpath is traversed the same way, so nonzero winding inside
    // it is 2 — the hole only exists for even-odd. The union value is what
    // the engine classifies; here we pin the raw primitive.
    expect(Math.abs(windingNumberAt(geometry, "inner", { x: 50, y: 50 }))).toBe(1);
  });
});

describe("cubic-cubic intersections", () => {
  const seg = (p0: [number, number], p1: [number, number]): Cubic => [{ x: p0[0], y: p0[1] }, { x: p0[0], y: p0[1] }, { x: p1[0], y: p1[1] }, { x: p1[0], y: p1[1] }];

  it("finds the exact crossing of two linear segments", () => {
    const hits = cubicCubicIntersections(seg([0, 0], [100, 100]), seg([0, 100], [100, 0]));
    expect(hits).toEqual([{ tA: 0.5, tB: 0.5 }]);
  });

  it("returns nothing for parallel or disjoint segments", () => {
    expect(cubicCubicIntersections(seg([0, 0], [100, 0]), seg([0, 10], [100, 10]))).toEqual([]);
    expect(cubicCubicIntersections(seg([0, 0], [100, 0]), seg([200, 0], [300, 0]))).toEqual([]);
  });

  it("returns the overlap endpoints for collinear overlapping segments", () => {
    const hits = cubicCubicIntersections(seg([0, 0], [100, 0]), seg([50, 0], [150, 0]));
    expect(hits).toEqual([{ tA: 0.5, tB: 0 }, { tA: 1, tB: 0.5 }]);
  });

  it("returns the single touching point for collinear segments sharing an endpoint", () => {
    const hits = cubicCubicIntersections(seg([100, 0], [100, 100]), seg([100, 100], [100, 200]));
    expect(hits).toEqual([{ tA: 1, tB: 0 }]);
  });

  it("finds a curve-line crossing", () => {
    const arc = circleGeometry(50, { x: 50, y: 50 });
    const ordered = pointsOfSubpath(arc, "s1");
    const cubic: Cubic = [
      { x: ordered[0]!.x, y: ordered[0]!.y },
      { x: ordered[0]!.x + (ordered[0]!.handleOut?.dx ?? 0), y: ordered[0]!.y + (ordered[0]!.handleOut?.dy ?? 0) },
      { x: ordered[1]!.x + (ordered[1]!.handleIn?.dx ?? 0), y: ordered[1]!.y + (ordered[1]!.handleIn?.dy ?? 0) },
      { x: ordered[1]!.x, y: ordered[1]!.y },
    ];
    const line = seg([0, 30], [120, 30]);
    const hits = cubicCubicIntersections(cubic, line, 1e-4);
    expect(hits).toHaveLength(1);
    const point = cubicAt(cubic, hits[0]!.tA);
    expect(point.x).toBeCloseTo(95.826, 1);
    expect(point.y).toBeCloseTo(30, 1);
    const linePoint = cubicAt(line, hits[0]!.tB);
    expect(linePoint.x).toBeCloseTo(point.x, 3);
    expect(linePoint.y).toBe(30);
  });
});

describe("boolean commands", () => {
  const makeNode = (id: string, geometry: PathGeometry, placement: { x: number; y: number }, zIndex: number): { node: DocumentNode } => ({
    node: pathNodeWith(id, geometry, { x: placement.x, y: placement.y, width: 100, height: 100 }, zIndex),
  });

  it("unions two paths into one node with the topmost fill and zIndex", () => {
    const kernel = kernelWithPaths([
      makeNode("path-a", rectGeometry(100, 100), { x: 0, y: 0 }, 2),
      makeNode("path-b", rectGeometry(100, 100), { x: 50, y: 50 }, 5),
    ]);
    kernel.setSelection(["path-a", "path-b"]);
    kernel.dispatch({ type: "boolean-operate", nodeIds: ["path-a", "path-b"], operation: "union" }, "Union");
    const document = kernel.getDocument();
    expect(document.nodes["boolean-0"]).toBeDefined();
    expect(document.nodes["path-a"]).toBeUndefined();
    expect(document.nodes["path-b"]).toBeUndefined();
    const result = document.nodes["boolean-0"]!;
    expect(result.kind).toBe("path");
    expect(result.zIndex).toBe(5);
    expect(result.bounds).toEqual({ x: 0, y: 0, width: 150, height: 150 });
    expect(Object.values(result.path!.points)).toHaveLength(8);
    expect(kernel.getState().selectedIds).toEqual([]);
  });

  it("undo restores the operands byte-exactly; redo recomputes the result", () => {
    const kernel = kernelWithPaths([
      makeNode("path-a", rectGeometry(100, 100), { x: 0, y: 0 }, 2),
      makeNode("path-b", rectGeometry(100, 100), { x: 50, y: 50 }, 3),
    ]);
    const before = kernel.serialize();
    kernel.dispatch({ type: "boolean-operate", nodeIds: ["path-a", "path-b"], operation: "intersect" }, "Intersect");
    expect(kernel.getDocument().nodes["path-a"]).toBeUndefined();
    kernel.undo();
    expect(kernel.serialize()).toBe(before);
    expect(kernel.getDocument().nodes["path-a"]).toBeDefined();
    expect(kernel.getDocument().nodes["path-b"]).toBeDefined();
    kernel.redo();
    const result = kernel.getDocument().nodes["boolean-0"];
    expect(result).toBeDefined();
    expect(result!.bounds).toEqual({ x: 50, y: 50, width: 50, height: 50 });
    expect(kernel.getDocument().nodes["path-a"]).toBeUndefined();
  });

  it("occupies exactly one history entry", () => {
    const kernel = kernelWithPaths([
      makeNode("path-a", rectGeometry(100, 100), { x: 0, y: 0 }, 2),
      makeNode("path-b", rectGeometry(100, 100), { x: 50, y: 50 }, 3),
    ]);
    const before = kernel.serialize();
    kernel.dispatch({ type: "boolean-operate", nodeIds: ["path-a", "path-b"], operation: "exclude" }, "Exclude");
    expect(kernel.canUndo()).toBe(true);
    kernel.undo();
    expect(kernel.serialize()).toBe(before);
    kernel.undo();
    // The next entry is the last create-node: one boolean, not two.
    expect(kernel.getDocument().nodes["path-a"]).toBeDefined();
    expect(kernel.getDocument().nodes["path-b"]).toBeUndefined();
    expect(kernel.getDocument().nodes["boolean-0"]).toBeUndefined();
  });

  it("failed preconditions leave the document unchanged", () => {
    const kernel = kernelWithPaths([
      makeNode("path-a", rectGeometry(100, 100), { x: 0, y: 0 }, 2),
      makeNode("path-open", { ...rectGeometry(100, 100), subpaths: { s1: { id: "s1", closed: false } } }, { x: 50, y: 50 }, 3),
    ]);
    const before = kernel.serialize();
    expect(() => kernel.dispatch({ type: "boolean-operate", nodeIds: ["path-a", "path-open"], operation: "union" }, "Union")).toThrow("VECTOR_BOOLEAN_OPEN_SUBPATH");
    expect(kernel.serialize()).toBe(before);
    expect(() => kernel.dispatch({ type: "boolean-operate", nodeIds: ["path-a"], operation: "union" }, "Union")).toThrow("VECTOR_BOOLEAN_MIN_OPERANDS");
    expect(kernel.serialize()).toBe(before);
  });

  it("refuses operands from different parents", () => {
    const kernel = kernelWithPaths([
      makeNode("path-a", rectGeometry(100, 100), { x: 0, y: 0 }, 2),
      makeNode("path-b", rectGeometry(100, 100), { x: 50, y: 50 }, 3),
    ]);
    const group: DocumentNode = {
      id: "group-1", kind: "group", name: "Group", parentId: "frame-foundation", childIds: [],
      bounds: { x: 0, y: 0, width: 100, height: 100 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 4,
    };
    kernel.dispatch({ type: "create-node", node: group }, "Add group");
    kernel.dispatch({ type: "reparent-node", nodeId: "path-b", parentId: "group-1", index: 0 }, "Reparent");
    expect(() => kernel.dispatch({ type: "boolean-operate", nodeIds: ["path-a", "path-b"], operation: "union" }, "Union")).toThrow("VECTOR_BOOLEAN_PARENTS_DIFFER");
  });

  it("applies through the raw command machinery with a byte-exact inverse", () => {
    const document = createFoundationDocument();
    const a = pathNodeWith("path-a", rectGeometry(100, 100), { x: 0, y: 0, width: 100, height: 100 });
    const b = pathNodeWith("path-b", rectGeometry(100, 100), { x: 50, y: 50, width: 100, height: 100 });
    document.nodes[a.id] = a;
    document.nodes[b.id] = b;
    document.nodes["frame-foundation"]!.childIds = ["path-a", "path-b"];
    const forward = applyDocumentCommand(document, { type: "boolean-operate", nodeIds: ["path-a", "path-b"], operation: "subtract" });
    expect(forward.document.nodes["boolean-0"]).toBeDefined();
    expect(forward.document.nodes["path-a"]).toBeUndefined();
    const restored = applyDocumentCommand(forward.document, forward.inverse);
    expect(restored.document.nodes["path-a"]).toEqual(a);
    expect(restored.document.nodes["path-b"]).toEqual(b);
    expect(restored.document.nodes["frame-foundation"]!.childIds).toEqual(["path-a", "path-b"]);
    const redone = applyDocumentCommand(restored.document, restored.inverse);
    expect(redone.document.nodes["boolean-0"]).toBeDefined();
    expect(redone.document.nodes["path-a"]).toBeUndefined();
  });
});
