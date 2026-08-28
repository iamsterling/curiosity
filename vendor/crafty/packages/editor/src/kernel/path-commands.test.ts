import { describe, expect, it } from "vitest";
import { applyDocumentCommand } from "./commands.js";
import { createFoundationDocument, type DocumentNode, type PathGeometry, type PathPoint, PATH_BOUNDS_TOLERANCE, type Rect } from "./document.js";
import { computePathBounds, ORDER_KEY_STEP, orderKeyBetween, orderKeyForSigned, splitSegment } from "./path-geometry.js";
import { createEditorKernel } from "./kernel.js";

/**
 * Path command round-trips. Every command is absolute-valued with an exact
 * inverse; the kernel recomputes inverses against the before-document, so
 * undo must restore exact geometry, exact ids, and exact handle assignments.
 */

const curvedGeometry = (): PathGeometry => ({
  points: {
    p0: { id: "p0", subpathId: "s1", order: orderKeyForSigned(0 * ORDER_KEY_STEP), x: 0, y: 0, handleMode: "free", handleOut: { dx: 0, dy: 100 } },
    p1: { id: "p1", subpathId: "s1", order: orderKeyForSigned(1 * ORDER_KEY_STEP), x: 100, y: 0, handleMode: "free", handleIn: { dx: 0, dy: 100 } },
  },
  subpaths: { s1: { id: "s1", closed: false } },
  fillRule: "nonzero",
});

const mixedGeometry = (): PathGeometry => ({
  points: {
    a: { id: "a", subpathId: "ring", order: orderKeyForSigned(0 * ORDER_KEY_STEP), x: 0, y: 0, handleMode: "corner" },
    b: { id: "b", subpathId: "ring", order: orderKeyForSigned(1 * ORDER_KEY_STEP), x: 50, y: 0, handleMode: "free", handleIn: { dx: 0, dy: 20 }, handleOut: { dx: 0, dy: -20 } },
    c: { id: "c", subpathId: "ring", order: orderKeyForSigned(2 * ORDER_KEY_STEP), x: 100, y: 0, handleMode: "mirrored", handleOut: { dx: 0, dy: 40 } },
  },
  subpaths: { ring: { id: "ring", closed: true } },
  fillRule: "nonzero",
});

const pathNodeWith = (id: string, geometry: PathGeometry, bounds: Rect): DocumentNode => ({
  id, kind: "path", name: "Curve", parentId: "frame-foundation", childIds: [],
  bounds, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 3, path: geometry,
});

const makeKernel = (raw: PathGeometry): { kernel: ReturnType<typeof createEditorKernel>; node: DocumentNode } => {
  const document = createFoundationDocument();
  const firstBbox = computePathBounds(raw);
  const shiftX = Math.abs(firstBbox.minX) > PATH_BOUNDS_TOLERANCE ? firstBbox.minX : 0;
  const shiftY = Math.abs(firstBbox.minY) > PATH_BOUNDS_TOLERANCE ? firstBbox.minY : 0;
  const geometry: PathGeometry = shiftX !== 0 || shiftY !== 0
    ? { ...raw, points: Object.fromEntries(Object.entries(raw.points).map(([id, point]) => [id, { ...point, x: point.x - shiftX, y: point.y - shiftY }])) }
    : raw;
  const bbox = computePathBounds(geometry);
  const node = pathNodeWith("path-curve", geometry, { x: 64, y: 84, width: bbox.maxX - bbox.minX, height: bbox.maxY - bbox.minY });
  document.nodes[node.id] = node;
  const kernel = createEditorKernel(document);
  return { kernel, node };
};

/** The bounds a command's payload must carry for a target geometry, mirroring the command's own rebase rule. */
const expectedBoundsFor = (node: DocumentNode, geometry: PathGeometry): Rect => {
  const bbox = computePathBounds(geometry);
  const shiftX = Math.abs(bbox.minX) > PATH_BOUNDS_TOLERANCE ? bbox.minX : 0;
  const shiftY = Math.abs(bbox.minY) > PATH_BOUNDS_TOLERANCE ? bbox.minY : 0;
  return { x: node.bounds.x - shiftX, y: node.bounds.y - shiftY, width: bbox.maxX - bbox.minX, height: bbox.maxY - bbox.minY };
};

describe("path commands", () => {
  it("moves points with absolute records; undo restores coordinates and bounds", () => {
    const { kernel } = makeKernel(curvedGeometry());
    const moved: PathPoint = { ...kernel.getDocument().nodes["path-curve"]!.path!.points["p1"]!, x: 120, y: 10 };
    const target: PathGeometry = { ...kernel.getDocument().nodes["path-curve"]!.path!, points: { ...kernel.getDocument().nodes["path-curve"]!.path!.points, p1: moved } };
    const node = kernel.getDocument().nodes["path-curve"]!;
    kernel.dispatch({ type: "set-path-points", nodeId: node.id, pointRecords: { p1: moved }, bounds: expectedBoundsFor(node, target) }, "Move point");
    const after = kernel.getDocument().nodes["path-curve"]!;
    expect(after.path!.points["p1"]!.x).toBe(120);
    expect(after.path!.points["p1"]!.y).toBe(10);
    expect(after.bounds).toEqual(expectedBoundsFor(node, target));
    kernel.undo();
    const restored = kernel.getDocument().nodes["path-curve"]!;
    expect(restored.path).toEqual(node.path);
    expect(restored.bounds).toEqual(node.bounds);
    kernel.redo();
    expect(kernel.getDocument().nodes["path-curve"]!.path!.points["p1"]!.x).toBe(120);
  });

  it("rebases the whole path when a point crosses the left edge, keeping the on-screen position", () => {
    const { kernel } = makeKernel(curvedGeometry());
    const node = kernel.getDocument().nodes["path-curve"]!;
    // The caller shifts the touched records and the placement so the geometry
    // min corner stays at (0,0): dragging the right point 5 past the left
    // edge rebases the geometry by +5 and moves the placement to 64 - 5.
    const records = {
      p0: { ...node.path!.points["p0"]!, x: node.path!.points["p0"]!.x + 5, y: node.path!.points["p0"]!.y },
      p1: { ...node.path!.points["p1"]!, x: node.path!.points["p1"]!.x - 100, y: node.path!.points["p1"]!.y },
    };
    kernel.dispatch({ type: "set-path-points", nodeId: node.id, pointRecords: records, bounds: { x: 59, y: 84, width: 5, height: 75 } }, "Move point");
    const after = kernel.getDocument().nodes["path-curve"]!;
    expect(after.path!.points["p0"]!.x).toBe(5);
    expect(after.path!.points["p1"]!.x).toBe(0);
    expect(after.bounds.x).toBe(59);
    expect(after.bounds.width).toBeCloseTo(5);
    expect(after.bounds.y).toBe(84);
    kernel.undo();
    expect(kernel.getDocument().nodes["path-curve"]!.path).toEqual(node.path);
    expect(kernel.getDocument().nodes["path-curve"]!.bounds).toEqual(node.bounds);
  });

  it("rejects a stale bounds payload instead of silently corrupting", () => {
    const { kernel } = makeKernel(curvedGeometry());
    const node = kernel.getDocument().nodes["path-curve"]!;
    const moved: PathPoint = { ...node.path!.points["p1"]!, x: -5, y: 0 };
    expect(() => kernel.dispatch({ type: "set-path-points", nodeId: node.id, pointRecords: { p1: moved }, bounds: { ...node.bounds, width: 100 } }, "Move point")).toThrow("DOCUMENT_PATH_BOUNDS_STALE");
  });

  it("inserts a point by splitting a curved segment; undo restores the pre-split tangents exactly", () => {
    const { kernel } = makeKernel(curvedGeometry());
    const node = kernel.getDocument().nodes["path-curve"]!;
    const geometry = node.path!;
    const p0 = geometry.points["p0"]!;
    const p1 = geometry.points["p1"]!;
    const split = splitSegment(p0, p1, 0.5);
    const inserted: PathPoint = {
      id: "p-mid", subpathId: "s1", order: orderKeyBetween(p0.order, p1.order),
      x: split.point.x, y: split.point.y, handleMode: "free",
      handleIn: { dx: split.point.x - 75, dy: split.point.y - 75 },
      handleOut: { dx: split.point.x - 25, dy: split.point.y - 75 },
    };
    const prev: PathPoint = { ...p0, handleOut: split.prevHandleOut };
    const next: PathPoint = { ...p1, handleIn: split.nextHandleIn };
    kernel.dispatch({ type: "insert-path-point", nodeId: node.id, point: inserted, prev, next, bounds: node.bounds }, "Insert point");
    const after = kernel.getDocument().nodes["path-curve"]!;
    expect(Object.keys(after.path!.points)).toHaveLength(3);
    expect(after.path!.points["p-mid"]).toBeDefined();
    expect(after.path!.points["p0"]!.handleOut).toEqual(split.prevHandleOut);
    expect(after.path!.points["p1"]!.handleIn).toEqual(split.nextHandleIn);
    kernel.undo();
    const restored = kernel.getDocument().nodes["path-curve"]!;
    expect(restored.path).toEqual(geometry);
    expect(restored.path!.points["p0"]!.handleOut).toEqual({ dx: 0, dy: 100 });
    expect(restored.path!.points["p1"]!.handleIn).toEqual({ dx: 0, dy: 100 });
  });

  it("removes a point and reconnects its neighbours; undo restores the exact point", () => {
    const { kernel } = makeKernel(mixedGeometry());
    const node = kernel.getDocument().nodes["path-curve"]!;
    const geometry = node.path!;
    const b = geometry.points["b"]!;
    // The caller rebases the reduced geometry (min corner at (0,0)) and the
    // placement, exactly as a tool would before dispatching.
    const reducedPoints = { a: geometry.points["a"]!, c: geometry.points["c"]! };
    const reducedBbox = computePathBounds({ ...geometry, points: reducedPoints });
    const shiftX = Math.abs(reducedBbox.minX) > PATH_BOUNDS_TOLERANCE ? reducedBbox.minX : 0;
    const shiftY = Math.abs(reducedBbox.minY) > PATH_BOUNDS_TOLERANCE ? reducedBbox.minY : 0;
    const shiftedA = { ...reducedPoints.a, x: reducedPoints.a.x - shiftX, y: reducedPoints.a.y - shiftY };
    const shiftedC = { ...reducedPoints.c, x: reducedPoints.c.x - shiftX, y: reducedPoints.c.y - shiftY };
    const bounds = { x: node.bounds.x - shiftX, y: node.bounds.y - shiftY, width: reducedBbox.maxX - reducedBbox.minX, height: reducedBbox.maxY - reducedBbox.minY };
    kernel.dispatch({ type: "remove-path-point", nodeId: node.id, point: b, prev: shiftedA, next: shiftedC, bounds }, "Remove point");
    const after = kernel.getDocument().nodes[node.id]!;
    expect(after.path!.points["b"]).toBeUndefined();
    kernel.undo();
    const restored = kernel.getDocument().nodes[node.id]!;
    expect(restored.path).toEqual(geometry);
    expect(restored.path!.points["b"]).toEqual(b);
  });

  it("rejects removing the second-to-last point (minimum subpath length)", () => {
    const { kernel } = makeKernel(curvedGeometry());
    const node = kernel.getDocument().nodes["path-curve"]!;
    const geometry = node.path!;
    expect(() => kernel.dispatch({ type: "remove-path-point", nodeId: node.id, point: geometry.points["p1"]!, prev: geometry.points["p0"]!, next: geometry.points["p0"]!, bounds: node.bounds }, "Remove point")).toThrow("DOCUMENT_PATH_MIN_POINTS");
  });

  it("closes a subpath and restores end anchors on undo", () => {
    const { kernel } = makeKernel(curvedGeometry());
    const node = kernel.getDocument().nodes["path-curve"]!;
    const geometry = node.path!;
    const first = geometry.points["p0"]!;
    const last = geometry.points["p1"]!;
    kernel.dispatch({ type: "set-subpath-closed", nodeId: node.id, subpathId: "s1", closed: true, endAnchors: { first, last }, bounds: node.bounds }, "Close subpath");
    const after = kernel.getDocument().nodes["path-curve"]!;
    expect(after.path!.subpaths["s1"]!.closed).toBe(true);
    kernel.undo();
    const restored = kernel.getDocument().nodes["path-curve"]!;
    expect(restored.path).toEqual(geometry);
    expect(restored.path!.subpaths["s1"]!.closed).toBe(false);
  });

  it("reverses a subpath as a self-inverse, swapping order and handles exactly", () => {
    const { kernel } = makeKernel(mixedGeometry());
    const node = kernel.getDocument().nodes["path-curve"]!;
    const geometry = node.path!;
    kernel.dispatch({ type: "reverse-subpath", nodeId: node.id, subpathId: "ring" }, "Reverse subpath");
    const once = kernel.getDocument().nodes["path-curve"]!.path!;
    expect(once.subpaths["ring"]!.closed).toBe(true);
    // b is now last: its free handles swapped.
    expect(once.points["b"]!.handleIn).toEqual({ dx: 0, dy: -20 });
    expect(once.points["b"]!.handleOut).toEqual({ dx: 0, dy: 20 });
    // mirrored c stores the negated outgoing handle; incoming stays derived.
    expect(once.points["c"]!.handleOut).toEqual({ dx: 0, dy: -40 });
    expect(once.points["c"]!.handleIn).toBeUndefined();
    kernel.dispatch({ type: "reverse-subpath", nodeId: node.id, subpathId: "ring" }, "Reverse subpath");
    expect(kernel.getDocument().nodes["path-curve"]!.path).toEqual(geometry);
    expect(kernel.getDocument().nodes["path-curve"]!.path!.points).toEqual(geometry.points);
  });

  it("round-trips the fill rule without touching geometry or bounds", () => {
    const { kernel } = makeKernel(curvedGeometry());
    const node = kernel.getDocument().nodes["path-curve"]!;
    kernel.dispatch({ type: "set-path-fill-rule", nodeId: node.id, fillRule: "evenodd" }, "Set fill rule");
    const after = kernel.getDocument().nodes["path-curve"]!;
    expect(after.path!.fillRule).toBe("evenodd");
    expect(after.path!.points).toEqual(node.path!.points);
    expect(after.bounds).toEqual(node.bounds);
    kernel.undo();
    expect(kernel.getDocument().nodes["path-curve"]!.path!.fillRule).toBe("nonzero");
  });

  it("replaces whole geometry with an exact inverse including ids", () => {
    const { kernel } = makeKernel(curvedGeometry());
    const node = kernel.getDocument().nodes["path-curve"]!;
    const replacement: PathGeometry = {
      points: {
        x1: { id: "x1", subpathId: "flat", order: orderKeyForSigned(0 * ORDER_KEY_STEP), x: 0, y: 0, handleMode: "corner" },
        x2: { id: "x2", subpathId: "flat", order: orderKeyForSigned(1 * ORDER_KEY_STEP), x: 30, y: 0, handleMode: "corner" },
        x3: { id: "x3", subpathId: "flat", order: orderKeyForSigned(2 * ORDER_KEY_STEP), x: 30, y: 20, handleMode: "corner" },
      },
      subpaths: { flat: { id: "flat", closed: true } },
      fillRule: "evenodd",
    };
    kernel.dispatch({ type: "replace-path-geometry", nodeId: node.id, geometry: replacement, bounds: expectedBoundsFor(node, replacement) }, "Replace geometry");
    const after = kernel.getDocument().nodes["path-curve"]!;
    expect(after.path).toEqual(replacement);
    kernel.undo();
    expect(kernel.getDocument().nodes["path-curve"]!.path).toEqual(node.path);
  });

  it("rejects path commands on non-path nodes", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    expect(() => kernel.dispatch({ type: "set-path-fill-rule", nodeId: "rectangle-foundation", fillRule: "evenodd" }, "Set fill rule")).toThrow("DOCUMENT_PATH_GEOMETRY_MISSING");
  });

  it("applies an inverse that itself runs through validation (every command is validated both ways)", () => {
    const { kernel } = makeKernel(mixedGeometry());
    const node = kernel.getDocument().nodes["path-curve"]!;
    const geometry = node.path!;
    const result = applyDocumentCommand(kernel.getDocument(), { type: "reverse-subpath", nodeId: node.id, subpathId: "ring" });
    expect(applyDocumentCommand(result.document, result.inverse).document).toEqual(kernel.getDocument());
  });
});
