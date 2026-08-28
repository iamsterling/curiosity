import { describe, expect, it } from "vitest";
import { createFoundationDocument, type DocumentNode, type PathGeometry, type PathPoint } from "./document.js";
import { computePathBounds, ORDER_KEY_STEP, orderKeyForSigned } from "./path-geometry.js";
import { createEditorKernel } from "./kernel.js";
import { documentHitTest, initialInteractionState, TOOL_EFFECT_VOCABULARIES, transitionInteraction, type InteractionContext } from "./interaction.js";

/**
 * Path editor surfaces: point selection and history, the pen/node tools'
 * closed effect vocabularies, clipboard path carrying with fresh id minting,
 * and the geometry narrow phase in document hit testing.
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

const makeKernel = (geometry: PathGeometry): ReturnType<typeof createEditorKernel> => {
  const document = createFoundationDocument();
  const firstBbox = computePathBounds(geometry);
  const shiftX = Math.abs(firstBbox.minX) > 1e-6 ? firstBbox.minX : 0;
  const shiftY = Math.abs(firstBbox.minY) > 1e-6 ? firstBbox.minY : 0;
  const rebased: PathGeometry = shiftX !== 0 || shiftY !== 0
    ? { ...geometry, points: Object.fromEntries(Object.entries(geometry.points).map(([id, point]) => [id, { ...point, x: point.x - shiftX, y: point.y - shiftY }])) }
    : geometry;
  const bbox = computePathBounds(rebased);
  const node: DocumentNode = {
    id: "path-curve", kind: "path", name: "Curve", parentId: "frame-foundation", childIds: [],
    bounds: { x: 64, y: 84, width: bbox.maxX - bbox.minX, height: bbox.maxY - bbox.minY },
    transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 3, path: rebased,
  };
  document.nodes[node.id] = node;
  document.nodes["frame-foundation"] = { ...document.nodes["frame-foundation"]!, childIds: [...document.nodes["frame-foundation"]!.childIds, node.id] };
  return createEditorKernel(document);
};

const context = (hitTest: (point: { x: number; y: number }) => string | undefined): InteractionContext => ({
  viewport: { panX: 0, panY: 0, zoom: 1, devicePixelRatio: 1 },
  dragThreshold: 4,
  hitTest,
  selectedIds: [],
});

describe("point selection", () => {
  it("selects points only when they exist in live geometry and never serializes them", () => {
    const kernel = makeKernel(mixedGeometry());
    kernel.setPointSelection(["a", "b", "ghost"]);
    expect(kernel.getState().selectedPointIds).toEqual(["a", "b"]);
    expect(kernel.serialize()).not.toContain("selectedPointIds");
  });

  it("drops deleted points from the selection and restores them on undo", () => {
    const kernel = makeKernel(mixedGeometry());
    kernel.setPointSelection(["b"]);
    const node = kernel.getDocument().nodes["path-curve"]!;
    const geometry = node.path!;
    // Caller-side rebase of the reduced {a, c} geometry, as a tool would do.
    const reducedPoints = { a: geometry.points["a"]!, c: geometry.points["c"]! };
    const reducedBbox = computePathBounds({ ...geometry, points: reducedPoints });
    const shiftX = Math.abs(reducedBbox.minX) > 1e-6 ? reducedBbox.minX : 0;
    const shiftY = Math.abs(reducedBbox.minY) > 1e-6 ? reducedBbox.minY : 0;
    const bounds = { x: node.bounds.x - shiftX, y: node.bounds.y - shiftY, width: reducedBbox.maxX - reducedBbox.minX, height: reducedBbox.maxY - reducedBbox.minY };
    kernel.dispatch({ type: "remove-path-point", nodeId: node.id, point: geometry.points["b"]!, prev: { ...reducedPoints.a, x: reducedPoints.a.x - shiftX, y: reducedPoints.a.y - shiftY }, next: { ...reducedPoints.c, x: reducedPoints.c.x - shiftX, y: reducedPoints.c.y - shiftY }, bounds }, "Remove point");
    expect(kernel.getState().selectedPointIds).toEqual([]);
    kernel.undo();
    expect(kernel.getState().selectedPointIds).toEqual(["b"]);
  });

  it("clears point selection on page switch", () => {
    const kernel = makeKernel(mixedGeometry());
    kernel.setPointSelection(["a"]);
    const secondPage = kernel.getDocument().pages["page-home"]!;
    kernel.dispatch({ type: "create-page", page: { id: "page-2", name: "Two", rootId: "page-root-2", canvas: { ...kernel.getDocument().pages["page-home"]!.canvas } } }, "Create page");
    kernel.dispatch({ type: "set-page", pageId: "page-2" }, "Switch page");
    expect(kernel.getState().selectedPointIds).toEqual([]);
    expect(kernel.getState().currentPageId).toBe("page-2");
    void secondPage;
  });
});

describe("pen and node tools", () => {
  it("keep effect vocabularies disjoint from rectangle and select", () => {
    const pen = TOOL_EFFECT_VOCABULARIES.pen;
    const rectangle = TOOL_EFFECT_VOCABULARIES.rectangle;
    const select = TOOL_EFFECT_VOCABULARIES.select;
    // Navigation is shared by design; what must never leak across is each
    // tool's owned effects: the pen may not emit rectangle creation or
    // selection effects.
    for (const tool of [pen]) {
      expect(tool.has("preview-rectangle")).toBe(false);
      expect(tool.has("commit-rectangle")).toBe(false);
      expect(tool.has("select")).toBe(false);
      expect(tool.has("begin-marquee")).toBe(false);
      expect(tool.has("commit-marquee")).toBe(false);
      expect(tool.has("move")).toBe(false);
      for (const effect of tool) expect(rectangle.has(effect) || select.has(effect)).toBe(effect === "begin-pan" || effect === "pan" || effect === "cancel" || effect === "zoom");
    }
  });

  it("arms a pen drag and emits the pen vocabulary, never select or creation", () => {
    const down = transitionInteraction(initialInteractionState("pen"), { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context(() => "layer-a"));
    expect(down.effects).toEqual([]);
    const move = transitionInteraction(down.state, { type: "pointer-move", pointerId: 1, point: { x: 40, y: 40 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context(() => "layer-a"));
    expect(move.effects).toEqual([{ type: "pen-preview", point: { x: 10, y: 10 }, handle: { x: 40, y: 40 } }]);
    const up = transitionInteraction(move.state, { type: "pointer-up", pointerId: 1, point: { x: 40, y: 40 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context(() => "layer-a"));
    expect(up.effects).toEqual([{ type: "pen-begin", point: { x: 10, y: 10 }, handle: { x: 40, y: 40 } }]);
    for (const effect of [...down.effects, ...move.effects, ...up.effects]) expect(TOOL_EFFECT_VOCABULARIES.pen.has(effect.type)).toBe(true);
    expect(TOOL_EFFECT_VOCABULARIES.pen.has("select")).toBe(false);
    expect(TOOL_EFFECT_VOCABULARIES.pen.has("commit-rectangle")).toBe(false);
  });

  it("closes an active pen session when the pointer lands on its first point", () => {
    const withSession: InteractionContext = { ...context(() => undefined), penSessionFirstPoint: { x: 10, y: 10 } };
    const down = transitionInteraction(initialInteractionState("pen"), { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, withSession);
    expect(down.effects).toEqual([{ type: "pen-close" }]);
  });

  it("emits pen path-editing effects for a point hit and ctrl-cycle, and deletes with shift", () => {
    const penContext: InteractionContext = {
      ...context(() => undefined),
      selectedPointIds: [],
      hitTestPathPoint: () => ({ nodeId: "path-1", pointId: "p1", at: { x: 10, y: 10 } }),
      hitTestPathHandle: () => undefined,
    };
    const down = transitionInteraction(initialInteractionState("pen"), { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, penContext);
    expect(down.effects).toEqual([{ type: "pen-select-points", nodeId: "path-1", pointIds: ["p1"], additive: false }]);
    const shiftDown = transitionInteraction(initialInteractionState("pen"), { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: true, spaceKey: false }, penContext);
    expect(shiftDown.effects).toEqual([{ type: "pen-delete-point", nodeId: "path-1", pointId: "p1" }]);
    const ctrlDown = transitionInteraction(initialInteractionState("pen"), { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false, ctrlKey: true }, penContext);
    expect(ctrlDown.effects).toEqual([{ type: "pen-cycle-type", nodeId: "path-1", pointId: "p1" }]);
    for (const effect of [...down.effects, ...shiftDown.effects, ...ctrlDown.effects]) expect(TOOL_EFFECT_VOCABULARIES.pen.has(effect.type)).toBe(true);
  });
});

describe("clipboard path carrying", () => {
  it("round-trips path geometry exactly through copy and paste", () => {
    const kernel = makeKernel(mixedGeometry());
    kernel.setSelection(["path-curve"]);
    const content = kernel.copySelection();
    expect(content).toBeDefined();
    const pasted = kernel.paste(content, { x: 400, y: 400 });
    expect(pasted).toBeDefined();
    const pastedNode = Object.values(kernel.getDocument().nodes).find((node) => node.id !== "path-curve" && node.kind === "path")!;
    expect(pastedNode).toBeDefined();
    const original = kernel.getDocument().nodes["path-curve"]!.path!;
    const copy = pastedNode.path!;
    // Geometry is preserved exactly modulo the minted ids (points, subpaths,
    // and each point's subpath reference all remap together).
    const stripIds = (point: PathPoint) => {
      const { id: _id, subpathId: _subpathId, ...rest } = point;
      return rest;
    };
    expect(Object.values(copy.points).map(stripIds)).toEqual(Object.values(original.points).map(stripIds));
    expect(Object.values(copy.subpaths).map(({ id: _id, ...rest }) => rest)).toEqual(Object.values(original.subpaths).map(({ id: _id, ...rest }) => rest));
    expect(copy.fillRule).toBe(original.fillRule);
    expect(Object.keys(copy.points).sort()).not.toEqual(Object.keys(original.points).sort());
  });

  it("mints fresh point and subpath ids so two pasted copies share none", () => {
    const kernel = makeKernel(mixedGeometry());
    kernel.setSelection(["path-curve"]);
    const content = kernel.copySelection();
    kernel.paste(content, { x: 300, y: 300 });
    kernel.paste(content, { x: 500, y: 300 });
    const paths = Object.values(kernel.getDocument().nodes).filter((node) => node.kind === "path");
    expect(paths).toHaveLength(3);
    const [first, second] = [paths[1]!.path!, paths[2]!.path!];
    const firstPointIds = new Set(Object.keys(first.points));
    const firstSubpathIds = new Set(Object.keys(first.subpaths));
    for (const pointId of Object.keys(second.points)) expect(firstPointIds.has(pointId)).toBe(false);
    for (const subpathId of Object.keys(second.subpaths)) expect(firstSubpathIds.has(subpathId)).toBe(false);
    for (const point of Object.values(second.points)) expect(firstSubpathIds.has(point.subpathId)).toBe(false);
  });
});

describe("path hit testing", () => {
  const geometryAt = (x: number, y: number): { document: ReturnType<typeof createFoundationDocument>; pageId: string } => {
    const document = createFoundationDocument();
    const node: DocumentNode = {
      id: "path-curve", kind: "path", name: "Curve", parentId: "frame-foundation", childIds: [],
      bounds: { x, y, width: 100, height: 75 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 3, path: curvedGeometry(),
    };
    document.nodes[node.id] = node;
    document.nodes["frame-foundation"] = { ...document.nodes["frame-foundation"]!, childIds: [...document.nodes["frame-foundation"]!.childIds, node.id] };
    return { document, pageId: "page-home" };
  };

  it("does not select a point inside the curve bbox but outside the geometry", () => {
    // Path at frame (180,120) + bounds (0,500): world (180,620)-(280,695),
    // clear of the foundation rectangle's world area.
    const { document, pageId } = geometryAt(0, 500);
    expect(documentHitTest(document, pageId, { x: 190, y: 690 })).toBeUndefined();
  });

  it("selects a point on the geometry", () => {
    const { document, pageId } = geometryAt(0, 500);
    // Local (10, 45): below the curve at x=10 (~46).
    expect(documentHitTest(document, pageId, { x: 190, y: 665 })).toBe("path-curve");
  });
});
