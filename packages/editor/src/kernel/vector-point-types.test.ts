import { describe, expect, it } from "vitest";
import { createFoundationDocument, type DocumentNode, type PathGeometry, type PathPoint, type Rect } from "./document.js";
import { createEditorKernel } from "./kernel.js";
import { ORDER_KEY_STEP, computePathBounds, convertPointType, deriveAutoHandle, orderKeyForSigned, resolveAutoHandles } from "./path-geometry.js";

/**
 * Point types (the `vector-editing` change, section 1): the conversion
 * matrix, the auto-handle derivation, the resolved projection, and the
 * `set-point-type` command with its byte-exact inverse.
 */

const cornerPoint = (id: string, x: number, y: number, subpathId = "s1", order = 1): PathPoint => ({
  id, subpathId, order: orderKeyForSigned(order * ORDER_KEY_STEP), x, y, handleMode: "corner",
});

const geometryWith = (points: PathPoint[], closed = true): PathGeometry => ({
  points: Object.fromEntries(points.map((point) => [point.id, point])),
  subpaths: { s1: { id: "s1", closed } },
  fillRule: "nonzero",
});

const pathNodeWith = (id: string, geometry: PathGeometry, bounds: Rect): DocumentNode => ({
  id, kind: "path", name: id, parentId: "frame-foundation", childIds: [],
  bounds, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 3, path: geometry,
});

describe("auto-handle derivation", () => {
  it("derives collinear handles with one-third lengths for interior points", () => {
    const a = cornerPoint("a", 0, 0);
    const b = cornerPoint("b", 30, 0);
    const c = cornerPoint("c", 60, 0);
    const { handleIn, handleOut } = deriveAutoHandle(b, a, c);
    // Chord through the neighbours: (60,0) − (0,0) → direction +x.
    expect(handleOut).toEqual({ dx: 10, dy: 0 });
    expect(handleIn).toEqual({ dx: -10, dy: 0 });
  });

  it("derives from the single neighbour chord at open endpoints", () => {
    const a = cornerPoint("a", 0, 0);
    const b = cornerPoint("b", 30, 0);
    const fromFirst = deriveAutoHandle(a, undefined, b);
    expect(fromFirst.handleOut).toEqual({ dx: 10, dy: 0 });
    expect(fromFirst.handleIn).toBeUndefined();
    const fromLast = deriveAutoHandle(b, a, undefined);
    expect(fromLast.handleIn).toEqual({ dx: -10, dy: 0 });
    expect(fromLast.handleOut).toBeUndefined();
  });

  it("is deterministic across calls", () => {
    const a = cornerPoint("a", 5, 7);
    const b = cornerPoint("b", 41, -3);
    const c = cornerPoint("c", 20, 90);
    expect(deriveAutoHandle(b, a, c)).toEqual(deriveAutoHandle(b, a, c));
  });
});

describe("conversion matrix", () => {
  const a = cornerPoint("a", 0, 0);
  const b = cornerPoint("b", 30, 0);
  const c = cornerPoint("c", 60, 0);
  const asymmetric = { handleMode: "asymmetric" as const, handleIn: { dx: -10, dy: 0 }, handleOut: { dx: 10, dy: 0 } };

  it("derives both handles out of a corner", () => {
    const converted = convertPointType(b, a, c, "asymmetric");
    expect(converted).toEqual({ handleIn: { dx: -10, dy: 0 }, handleOut: { dx: 10, dy: 0 } });
  });

  it("converting into corner discards handles (invertible, never lossless)", () => {
    const point: PathPoint = { ...b, ...asymmetric };
    expect(convertPointType(point, a, c, "corner")).toEqual({});
  });

  it("mirrored → asymmetric materializes the derived incoming handle", () => {
    const point: PathPoint = { ...b, handleMode: "mirrored", handleOut: { dx: 10, dy: 0 } };
    expect(convertPointType(point, a, c, "asymmetric")).toEqual({ handleIn: { dx: -10, dy: 0 }, handleOut: { dx: 10, dy: 0 } });
  });

  it("asymmetric → mirrored keeps only the outgoing handle", () => {
    const point: PathPoint = { ...b, ...asymmetric };
    expect(convertPointType(point, a, c, "mirrored")).toEqual({ handleOut: { dx: 10, dy: 0 } });
  });

  it("auto derives through the target rule", () => {
    const auto: PathPoint = { ...b, handleMode: "auto" };
    expect(convertPointType(auto, a, c, "mirrored")).toEqual({ handleOut: { dx: 10, dy: 0 } });
    expect(convertPointType(auto, a, c, "asymmetric")).toEqual({ handleIn: { dx: -10, dy: 0 }, handleOut: { dx: 10, dy: 0 } });
    expect(convertPointType(auto, a, c, "corner")).toEqual({});
  });

  it("free ↔ asymmetric preserves handle data", () => {
    const point: PathPoint = { ...b, ...asymmetric };
    expect(convertPointType(point, a, c, "free")).toEqual({ handleIn: { dx: -10, dy: 0 }, handleOut: { dx: 10, dy: 0 } });
  });
});

describe("resolved auto-handle projection", () => {
  it("materializes auto points as asymmetric without touching the document", () => {
    const geometry = geometryWith([
      cornerPoint("a", 0, 0),
      { ...cornerPoint("b", 30, 0), handleMode: "auto" },
      cornerPoint("c", 60, 0),
    ]);
    const resolved = resolveAutoHandles(geometry);
    const auto = resolved.points["b"]!;
    expect(auto.handleMode).toBe("asymmetric");
    expect(auto.handleIn).toEqual({ dx: -10, dy: 0 });
    expect(auto.handleOut).toEqual({ dx: 10, dy: 0 });
    // The authored geometry is untouched: the auto point still stores nothing.
    expect(geometry.points["b"]).toEqual({ ...cornerPoint("b", 30, 0), handleMode: "auto" });
  });

  it("returns the input unchanged when no auto point exists", () => {
    const geometry = geometryWith([cornerPoint("a", 0, 0), cornerPoint("b", 30, 0)]);
    expect(resolveAutoHandles(geometry)).toBe(geometry);
  });

  it("resolves deterministically", () => {
    const geometry = geometryWith([
      cornerPoint("a", 5, 7),
      { ...cornerPoint("b", 41, -3), handleMode: "auto" },
      cornerPoint("c", 20, 90),
    ]);
    expect(resolveAutoHandles(geometry)).toEqual(resolveAutoHandles(geometry));
  });
});

describe("set-point-type command", () => {
  const installPath = (): ReturnType<typeof createEditorKernel> => {
    const kernel = createEditorKernel(createFoundationDocument());
    const geometry = geometryWith([cornerPoint("a", 0, 0), cornerPoint("b", 30, 0), cornerPoint("c", 60, 0)]);
    const bounds = computePathBounds(geometry);
    kernel.dispatch({ type: "create-node", node: pathNodeWith("path-edit", geometry, { x: 0, y: 0, width: bounds.maxX, height: bounds.maxY }) }, "Create path");
    return kernel;
  };

  it("converts a point's mode and restores byte-exactly on undo", () => {
    const kernel = installPath();
    const geometry = kernel.getDocument().nodes["path-edit"]!.path!;
    const point = geometry.points["b"]!;
    const prev = geometry.points["a"]!;
    const next = geometry.points["c"]!;
    const converted = convertPointType(point, prev, next, "asymmetric");
    const target: PathGeometry = {
      ...geometry,
      points: { ...geometry.points, b: { ...point, handleMode: "asymmetric", ...converted } },
    };
    const bounds = computePathBounds(target);
    kernel.dispatch({ type: "set-point-type", nodeId: "path-edit", pointId: "b", mode: "asymmetric", ...converted, bounds: { x: 0, y: 0, width: bounds.maxX, height: bounds.maxY } }, "Convert point");
    const after = kernel.getDocument().nodes["path-edit"]!.path!.points["b"]!;
    expect(after.handleMode).toBe("asymmetric");
    expect(after.handleOut).toEqual({ dx: 10, dy: 0 });
    expect(after.handleIn).toEqual({ dx: -10, dy: 0 });
    kernel.undo();
    expect(kernel.getDocument().nodes["path-edit"]!.path!.points["b"]).toEqual(point);
  });

  it("refuses handles a mode forbids", () => {
    const kernel = installPath();
    expect(() => kernel.dispatch({ type: "set-point-type", nodeId: "path-edit", pointId: "b", mode: "auto", handleOut: { dx: 1, dy: 0 }, bounds: { x: 0, y: 0, width: 60, height: 0 } }, "Bad auto")).toThrow("VECTOR_POINT_AUTO_HANDLES");
    expect(() => kernel.dispatch({ type: "set-point-type", nodeId: "path-edit", pointId: "b", mode: "mirrored", handleIn: { dx: 1, dy: 0 }, handleOut: { dx: 1, dy: 0 }, bounds: { x: 0, y: 0, width: 60, height: 0 } }, "Bad mirror")).toThrow("DOCUMENT_PATH_MIRRORED_HANDLE_IN");
  });

  it("rejects an auto point carrying stored handles in a document", () => {
    const kernel = installPath();
    expect(() => kernel.dispatch({ type: "set-path-points", nodeId: "path-edit", pointRecords: { b: { ...cornerPoint("b", 30, 0), handleMode: "auto", handleOut: { dx: 1, dy: 0 } } }, bounds: { x: 0, y: 0, width: 60, height: 0 } }, "Auto with handles")).toThrow("VECTOR_POINT_AUTO_HANDLES");
  });

  it("recomputes the tight bounds when handles extend the curve", () => {
    const kernel = installPath();
    const point = kernel.getDocument().nodes["path-edit"]!.path!.points["b"]!;
    // Handles stay inside the pinned (0,0) min-corner form: the incoming
    // handle reaches x=0, the outgoing extends past the last point to x=70.
    const extended: PathPoint = { ...point, handleMode: "free", handleOut: { dx: 40, dy: 20 }, handleIn: { dx: -30, dy: 0 } };
    const target: PathGeometry = {
      ...kernel.getDocument().nodes["path-edit"]!.path!,
      points: { ...kernel.getDocument().nodes["path-edit"]!.path!.points, b: extended },
    };
    const bounds = computePathBounds(target);
    kernel.dispatch({ type: "set-point-type", nodeId: "path-edit", pointId: "b", mode: "free", handleOut: { dx: 40, dy: 20 }, handleIn: { dx: -30, dy: 0 }, bounds: { x: 0, y: 0, width: bounds.maxX, height: bounds.maxY } }, "Extend handles");
    const node = kernel.getDocument().nodes["path-edit"]!;
    expect(node.bounds.width).toBeGreaterThan(60);
  });
});
