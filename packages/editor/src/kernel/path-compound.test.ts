import { describe, expect, it } from "vitest";
import { applyDocumentCommand } from "./commands.js";
import { createFoundationDocument, validateEditorDocument, type CompoundOperation, type DocumentNode, type PathGeometry, type PathPoint, type Rect } from "./document.js";
import { createEditorKernel } from "./kernel.js";
import { ORDER_KEY_STEP, orderKeyForSigned } from "./path-geometry.js";
import { resolveCompoundOutline, resolveCompoundOutlineResult } from "./compound.js";
import { parseClipboardPayload, serializeClipboardPayload } from "./clipboard.js";

/**
 * The compound (the `vector-editing` change, section 5): the non-destructive
 * boolean group. Commands round-trip with exact inverses, the outline is a
 * re-resolving projection, flatten is the destructive bake (multi-subpath
 * results fully representable), and the clipboard carries the record.
 */

const corner = (id: string, x: number, y: number, subpathId: string, index: number): PathPoint => ({
  id, subpathId, order: orderKeyForSigned(index * ORDER_KEY_STEP), x, y, handleMode: "corner",
});

/** A pinned rectangle-as-path (min corner at (0,0), placement carried by the node). */
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

const pathNodeWith = (id: string, geometry: PathGeometry, bounds: Rect, zIndex = 3, fill = "#ffffff"): DocumentNode => ({
  id, kind: "path", name: id, parentId: "frame-foundation", childIds: [],
  bounds, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  visible: true, locked: false, opacity: 1, fill, stroke: "#000000", cornerRadius: 0, zIndex, path: geometry,
});

const kernelWithPaths = (nodes: Array<{ node: DocumentNode }>): ReturnType<typeof createEditorKernel> => {
  const kernel = createEditorKernel(createFoundationDocument());
  for (const { node } of nodes) kernel.dispatch({ type: "create-node", node }, "Add path");
  return kernel;
};

const makeNode = (id: string, placement: { x: number; y: number }, zIndex: number, fill = "#ffffff"): { node: DocumentNode } => ({
  node: pathNodeWith(id, rectGeometry(100, 100), { x: placement.x, y: placement.y, width: 100, height: 100 }, zIndex, fill),
});

/** The overlap fixture from the boolean section: two 100x100 squares at
 *  (0,0) and (50,50). Union = the 8-point L-outline, 150x150 at (0,0). */
const overlapKernel = (): ReturnType<typeof createEditorKernel> =>
  kernelWithPaths([
    makeNode("path-a", { x: 0, y: 0 }, 2, "#ffffff"),
    makeNode("path-b", { x: 50, y: 50 }, 5, "#ff00ff"),
  ]);

const createUnion = (kernel: ReturnType<typeof createEditorKernel>, nodeId = "compound-1"): void => {
  kernel.dispatch({ type: "create-compound", nodeId, parentId: "frame-foundation", index: 2, memberIds: ["path-a", "path-b"], operation: "union" }, "Compound");
};

describe("create-compound", () => {
  it("wraps the members, derives the outline bounds, and the inverse restores byte-exactly", () => {
    const kernel = overlapKernel();
    const before = kernel.serialize();
    createUnion(kernel);
    const document = kernel.getDocument();
    const compound = document.nodes["compound-1"]!;
    expect(compound.kind).toBe("compound");
    expect(compound.compound).toEqual({ operation: "union" });
    // The members are the ordered childIds; subtract/exclude read the order.
    expect(compound.childIds).toEqual(["path-a", "path-b"]);
    // Bounds are DERIVED: the tight bounds of the resolved outline (the
    // 8-point L, 150x150 at (0,0) — auto-fit, Figma's published behavior).
    expect(compound.bounds).toEqual({ x: 0, y: 0, width: 150, height: 150 });
    // The surface inherits from the topmost member (the boolean precedent).
    expect(compound.zIndex).toBe(5);
    expect(compound.fill).toBe("#ff00ff");
    for (const memberId of ["path-a", "path-b"]) expect(document.nodes[memberId]!.parentId).toBe("compound-1");
    expect(document.nodes["frame-foundation"]!.childIds).toEqual(["rectangle-foundation", "text-foundation", "compound-1"]);
    kernel.undo();
    expect(kernel.serialize()).toBe(before);
    expect(kernel.getDocument().nodes["path-a"]!.parentId).toBe("frame-foundation");
  });

  it("applies through the raw command machinery: forward, inverse, and the redo recomputes the compound", () => {
    const document = createFoundationDocument();
    const a = pathNodeWith("path-a", rectGeometry(100, 100), { x: 0, y: 0, width: 100, height: 100 }, 2);
    const b = pathNodeWith("path-b", rectGeometry(100, 100), { x: 50, y: 50, width: 100, height: 100 }, 3);
    document.nodes[a.id] = a;
    document.nodes[b.id] = b;
    document.nodes["frame-foundation"]!.childIds = ["rectangle-foundation", "text-foundation", "path-a", "path-b"];
    const forward = applyDocumentCommand(document, { type: "create-compound", nodeId: "compound-1", parentId: "frame-foundation", index: 2, memberIds: ["path-a", "path-b"], operation: "union" });
    expect(forward.document.nodes["compound-1"]).toBeDefined();
    expect(forward.document.nodes["path-a"]!.parentId).toBe("compound-1");
    const restored = applyDocumentCommand(forward.document, forward.inverse);
    expect(restored.document.nodes["path-a"]).toEqual(a);
    expect(restored.document.nodes["path-b"]).toEqual(b);
    expect(restored.document.nodes["frame-foundation"]!.childIds).toEqual(["rectangle-foundation", "text-foundation", "path-a", "path-b"]);
    expect(restored.document.nodes["compound-1"]).toBeUndefined();
    const redone = applyDocumentCommand(restored.document, restored.inverse);
    expect(redone.document.nodes["compound-1"]!.bounds).toEqual({ x: 0, y: 0, width: 150, height: 150 });
    expect(redone.document.nodes["path-a"]!.parentId).toBe("compound-1");
  });

  it("refuses an invalid operation, fewer than two members, and unsupported member kinds — document unchanged", () => {
    const kernel = overlapKernel();
    const group: DocumentNode = {
      id: "group-1", kind: "group", name: "Group", parentId: "frame-foundation", childIds: [],
      bounds: { x: 0, y: 0, width: 100, height: 100 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 4,
    };
    kernel.dispatch({ type: "create-node", node: group }, "Add group");
    const before = kernel.serialize();
    expect(() => kernel.dispatch({ type: "create-compound", nodeId: "compound-1", parentId: "frame-foundation", index: 0, memberIds: ["path-a"], operation: "union" }, "Compound")).toThrow("COMPOUND_MIN_MEMBERS");
    expect(kernel.serialize()).toBe(before);
    expect(() => kernel.dispatch({ type: "create-compound", nodeId: "compound-1", parentId: "frame-foundation", index: 0, memberIds: ["path-a", "path-b"], operation: "xor" as CompoundOperation }, "Compound")).toThrow("COMPOUND_OPERATION_INVALID");
    expect(kernel.serialize()).toBe(before);
    expect(() => kernel.dispatch({ type: "create-compound", nodeId: "compound-1", parentId: "frame-foundation", index: 0, memberIds: ["path-a", "group-1"], operation: "union" }, "Compound")).toThrow("COMPOUND_MEMBER_KIND_UNSUPPORTED:group-1");
    expect(kernel.serialize()).toBe(before);
  });

  it("refuses members from different parents (the single-parent inverse cannot represent them)", () => {
    const kernel = overlapKernel();
    const group: DocumentNode = {
      id: "group-1", kind: "group", name: "Group", parentId: "frame-foundation", childIds: [],
      bounds: { x: 0, y: 0, width: 100, height: 100 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 4,
    };
    kernel.dispatch({ type: "create-node", node: group }, "Add group");
    kernel.dispatch({ type: "reparent-node", nodeId: "path-b", parentId: "group-1", index: 0 }, "Reparent");
    expect(() => kernel.dispatch({ type: "create-compound", nodeId: "compound-1", parentId: "frame-foundation", index: 0, memberIds: ["path-a", "path-b"], operation: "union" }, "Compound")).toThrow("COMPOUND_MEMBERS_PARENTS_DIFFER");
  });

  it("surfaces the engine's precondition codes and refuses an area-less aggregate", () => {
    const kernel = kernelWithPaths([
      makeNode("path-a", { x: 0, y: 0 }, 2),
      makeNode("path-open", { x: 50, y: 50 }, 3),
    ]);
    const open = kernel.getDocument().nodes["path-open"]!;
    kernel.dispatch({ type: "replace-path-geometry", nodeId: "path-open", geometry: { ...open.path!, subpaths: { s1: { id: "s1", closed: false } } }, bounds: open.bounds }, "Open");
    expect(() => kernel.dispatch({ type: "create-compound", nodeId: "compound-1", parentId: "frame-foundation", index: 2, memberIds: ["path-a", "path-open"], operation: "union" }, "Compound")).toThrow("VECTOR_BOOLEAN_OPEN_SUBPATH");
    const disjoint = kernelWithPaths([
      makeNode("path-a", { x: 0, y: 0 }, 2),
      makeNode("path-b", { x: 200, y: 200 }, 3),
    ]);
    const before = disjoint.serialize();
    expect(() => disjoint.dispatch({ type: "create-compound", nodeId: "compound-1", parentId: "frame-foundation", index: 2, memberIds: ["path-a", "path-b"], operation: "intersect" }, "Compound")).toThrow("VECTOR_BOOLEAN_NO_AREA");
    expect(disjoint.serialize()).toBe(before);
  });
});

describe("set-compound-op and reorder-compound-member", () => {
  it("re-derives the outline bounds on an operation change; the inverse carries the previous operation", () => {
    const kernel = overlapKernel();
    createUnion(kernel);
    const afterCreate = kernel.serialize();
    kernel.dispatch({ type: "set-compound-op", nodeId: "compound-1", operation: "intersect" }, "Set op");
    const compound = kernel.getDocument().nodes["compound-1"]!;
    expect(compound.compound).toEqual({ operation: "intersect" });
    expect(compound.bounds).toEqual({ x: 50, y: 50, width: 50, height: 50 });
    kernel.undo();
    expect(kernel.serialize()).toBe(afterCreate);
  });

  it("is a no-op on the same operation — changed honesty, no history entry", () => {
    const kernel = overlapKernel();
    createUnion(kernel);
    kernel.dispatch({ type: "set-compound-op", nodeId: "compound-1", operation: "union" }, "Set op");
    kernel.undo();
    // The undo skips straight past the compound: the no-op added no entry.
    expect(kernel.getDocument().nodes["compound-1"]).toBeUndefined();
  });

  it("reorders members (subtract reads the order): the outline flips, the inverse swaps back", () => {
    const kernel = overlapKernel();
    createUnion(kernel);
    kernel.dispatch({ type: "set-compound-op", nodeId: "compound-1", operation: "subtract" }, "Set op");
    const notch = kernel.getDocument().nodes["compound-1"]!;
    // A - B is the notch in A's corner: 100x100 at (0,0).
    expect(notch.bounds).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    const before = kernel.serialize();
    const outlineBefore = resolveCompoundOutline(kernel.getDocument(), "compound-1");
    kernel.dispatch({ type: "reorder-compound-member", nodeId: "compound-1", fromIndex: 0, toIndex: 1 }, "Reorder member");
    const reordered = kernel.getDocument().nodes["compound-1"]!;
    expect(reordered.childIds).toEqual(["path-b", "path-a"]);
    // B - A is the notch in B's corner: the outline re-resolved, the bounds
    // re-derived from it.
    expect(reordered.bounds).toEqual({ x: 50, y: 50, width: 100, height: 100 });
    expect(JSON.stringify(resolveCompoundOutline(kernel.getDocument(), "compound-1"))).not.toBe(JSON.stringify(outlineBefore));
    kernel.undo();
    expect(kernel.serialize()).toBe(before);
    expect(kernel.getDocument().nodes["compound-1"]!.childIds).toEqual(["path-a", "path-b"]);
  });

  it("is a no-op when the index does not move", () => {
    const kernel = overlapKernel();
    createUnion(kernel);
    kernel.dispatch({ type: "reorder-compound-member", nodeId: "compound-1", fromIndex: 1, toIndex: 1 }, "Reorder member");
    expect(kernel.getDocument().nodes["compound-1"]!.childIds).toEqual(["path-a", "path-b"]);
    kernel.undo();
    expect(kernel.getDocument().nodes["compound-1"]).toBeUndefined();
  });

  it("refuses an out-of-range index", () => {
    const kernel = overlapKernel();
    createUnion(kernel);
    expect(() => kernel.dispatch({ type: "reorder-compound-member", nodeId: "compound-1", fromIndex: 0, toIndex: 2 }, "Reorder member")).toThrow("COMPOUND_MEMBER_INDEX_INVALID");
  });
});

describe("the resolved outline projection", () => {
  it("re-resolves when a member's set-bounds lands — the projection is computed per call", () => {
    const kernel = overlapKernel();
    createUnion(kernel);
    const first = resolveCompoundOutlineResult(kernel.getDocument(), "compound-1")!;
    expect(first.placement).toEqual({ x: 0, y: 0 });
    // The move rides the engine's covered envelope (the shared-edge family:
    // B shares A's x-range, touching its bottom edge).
    kernel.dispatch({ type: "set-bounds", nodeId: "path-b", bounds: { x: 0, y: 100, width: 100, height: 100 } }, "Move");
    const second = resolveCompoundOutlineResult(kernel.getDocument(), "compound-1")!;
    expect(JSON.stringify(second)).not.toBe(JSON.stringify(first));
    expect(resolveCompoundOutlineBounds(second)).toEqual({ x: 0, y: 0, width: 100, height: 200 });
    // The member edit did NOT recompute the compound's authored bounds: the
    // derived value refreshes in compound commands and at projection time.
    expect(kernel.getDocument().nodes["compound-1"]!.bounds).toEqual({ x: 0, y: 0, width: 150, height: 150 });
  });

  it("is deterministic: byte-identical across calls", () => {
    const kernel = overlapKernel();
    createUnion(kernel);
    const first = resolveCompoundOutline(kernel.getDocument(), "compound-1");
    const second = resolveCompoundOutline(kernel.getDocument(), "compound-1");
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(Object.keys(first!.subpaths)).toHaveLength(1);
    expect(Object.values(first!.points)).toHaveLength(8);
  });
});

describe("flatten-compound", () => {
  it("bakes the outline into ONE path node; undo restores the compound + members byte-exactly", () => {
    const kernel = overlapKernel();
    createUnion(kernel);
    const before = kernel.serialize();
    kernel.dispatch({ type: "flatten-compound", nodeId: "compound-1" }, "Flatten");
    const document = kernel.getDocument();
    expect(document.nodes["compound-1"]).toBeUndefined();
    expect(document.nodes["path-a"]).toBeUndefined();
    expect(document.nodes["path-b"]).toBeUndefined();
    const flattened = document.nodes["flatten-0"]!;
    expect(flattened.kind).toBe("path");
    expect(flattened.bounds).toEqual({ x: 0, y: 0, width: 150, height: 150 });
    expect(flattened.zIndex).toBe(5);
    expect(flattened.fill).toBe("#ff00ff");
    // The known union fixture: the 8-point L-outline.
    const positions = Object.values(flattened.path!.points).sort((left, right) => (left.order < right.order ? -1 : 1)).map((point) => ({ x: point.x, y: point.y }));
    expect(positions).toEqual([
      { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 150, y: 50 },
      { x: 150, y: 150 }, { x: 50, y: 150 }, { x: 50, y: 100 }, { x: 0, y: 100 },
    ]);
    kernel.undo();
    expect(kernel.serialize()).toBe(before);
    expect(kernel.getDocument().nodes["compound-1"]).toBeDefined();
    expect(kernel.getDocument().nodes["path-a"]).toBeDefined();
    kernel.redo();
    expect(kernel.getDocument().nodes["flatten-0"]).toBeDefined();
    expect(kernel.getDocument().nodes["compound-1"]).toBeUndefined();
  });

  it("represents multi-subpath results fully — holes and disjoint contours are ordinary subpaths", () => {
    const kernel = overlapKernel();
    createUnion(kernel);
    kernel.dispatch({ type: "set-compound-op", nodeId: "compound-1", operation: "exclude" }, "Set op");
    kernel.dispatch({ type: "flatten-compound", nodeId: "compound-1" }, "Flatten");
    const flattened = kernel.getDocument().nodes["flatten-0"]!;
    // The exclude of the overlap fixture is the two disjoint L-lobes: two
    // contours, twelve points — never the unrepresentable diagnostic.
    expect(Object.keys(flattened.path!.subpaths)).toHaveLength(2);
    expect(Object.values(flattened.path!.points)).toHaveLength(12);
  });

  it("bakes member subtrees too — a frame member's children go with the bake, and undo restores them byte-exactly", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "create-node", node: pathNodeWith("path-a", rectGeometry(100, 100), { x: 0, y: 0, width: 100, height: 100 }, 2) }, "Add path");
    const frame: DocumentNode = {
      id: "frame-member", kind: "frame", name: "Frame member", parentId: "frame-foundation", childIds: [],
      bounds: { x: 50, y: 50, width: 100, height: 100 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 3,
    };
    const inner: DocumentNode = {
      id: "inner-rect", kind: "rectangle", name: "Inner", parentId: "frame-member", childIds: [],
      bounds: { x: 10, y: 10, width: 20, height: 20 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 1,
    };
    kernel.dispatch({ type: "create-node", node: frame }, "Add frame");
    kernel.dispatch({ type: "create-node", node: inner }, "Add inner");
    kernel.dispatch({ type: "create-compound", nodeId: "compound-1", parentId: "frame-foundation", index: 2, memberIds: ["path-a", "frame-member"], operation: "union" }, "Compound");
    const before = kernel.serialize();
    kernel.dispatch({ type: "flatten-compound", nodeId: "compound-1" }, "Flatten");
    const document = kernel.getDocument();
    expect(document.nodes["compound-1"]).toBeUndefined();
    expect(document.nodes["path-a"]).toBeUndefined();
    expect(document.nodes["frame-member"]).toBeUndefined();
    expect(document.nodes["inner-rect"]).toBeUndefined();
    expect(document.nodes["flatten-0"]).toBeDefined();
    kernel.undo();
    expect(kernel.serialize()).toBe(before);
    expect(kernel.getDocument().nodes["frame-member"]!.childIds).toEqual(["inner-rect"]);
  });

  it("fires VECTOR_FLATTEN_UNREPRESENTABLE when the outline cannot be produced at all", () => {
    const document = createFoundationDocument();
    document.nodes["path-a"] = pathNodeWith("path-a", rectGeometry(100, 100), { x: 0, y: 0, width: 100, height: 100 }, 2);
    document.nodes["path-b"] = pathNodeWith("path-b", rectGeometry(200, 200), { x: 0, y: 0, width: 200, height: 200 }, 3);
    document.nodes["compound-degenerate"] = {
      id: "compound-degenerate", kind: "compound", name: "Degenerate", parentId: "frame-foundation", childIds: ["path-a", "path-b"],
      bounds: { x: 0, y: 0, width: 100, height: 100 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 4,
      compound: { operation: "subtract" },
    };
    document.nodes["path-a"]!.parentId = "compound-degenerate";
    document.nodes["path-b"]!.parentId = "compound-degenerate";
    document.nodes["frame-foundation"]!.childIds = ["rectangle-foundation", "text-foundation", "compound-degenerate"];
    // The document is VALID (validation is shape-only); the outline of
    // A - B with A fully inside B is empty — the derived-bounds model cannot
    // hold it, so the bake is refused loudly.
    const validated = validateEditorDocument(document);
    expect(validated.ok).toBe(true);
    expect(() => applyDocumentCommand(document, { type: "flatten-compound", nodeId: "compound-degenerate" })).toThrow("VECTOR_FLATTEN_UNREPRESENTABLE");
  });

  it("surfaces the engine's precondition codes as-is", () => {
    const document = createFoundationDocument();
    document.nodes["path-a"] = pathNodeWith("path-a", rectGeometry(100, 100), { x: 0, y: 0, width: 100, height: 100 }, 2);
    document.nodes["path-open"] = pathNodeWith("path-open", { ...rectGeometry(100, 100), subpaths: { s1: { id: "s1", closed: false } } }, { x: 50, y: 50, width: 100, height: 100 }, 3);
    document.nodes["compound-open"] = {
      id: "compound-open", kind: "compound", name: "Open", parentId: "frame-foundation", childIds: ["path-a", "path-open"],
      bounds: { x: 0, y: 0, width: 150, height: 150 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 4,
      compound: { operation: "union" },
    };
    document.nodes["path-a"]!.parentId = "compound-open";
    document.nodes["path-open"]!.parentId = "compound-open";
    document.nodes["frame-foundation"]!.childIds = ["rectangle-foundation", "text-foundation", "compound-open"];
    expect(validateEditorDocument(document).ok).toBe(true);
    expect(() => applyDocumentCommand(document, { type: "flatten-compound", nodeId: "compound-open" })).toThrow("VECTOR_BOOLEAN_OPEN_SUBPATH");
    // The projection never throws on the same valid document: it reports no
    // outline, and the consumers draw nothing.
    expect(resolveCompoundOutline(document, "compound-open")).toBeUndefined();
  });
});

describe("compound document validation", () => {
  const compoundNode = (id: string, operation: CompoundOperation, childIds: string[]): DocumentNode => ({
    id, kind: "compound", name: id, parentId: "frame-foundation", childIds,
    bounds: { x: 0, y: 0, width: 100, height: 100 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 1,
    compound: { operation },
  });

  it("rejects an invalid operation with the fine code in the coarse message", () => {
    const document = createFoundationDocument();
    document.nodes["compound-bad"] = compoundNode("compound-bad", "xor" as CompoundOperation, ["rectangle-foundation", "text-foundation"]);
    document.nodes["frame-foundation"]!.childIds = ["compound-bad"];
    const result = validateEditorDocument(document);
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]!.message).toContain("COMPOUND_OPERATION_INVALID");
  });

  it("rejects fewer than two members", () => {
    const document = createFoundationDocument();
    document.nodes["compound-bad"] = compoundNode("compound-bad", "union", ["rectangle-foundation"]);
    document.nodes["frame-foundation"]!.childIds = ["compound-bad"];
    const result = validateEditorDocument(document);
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]!.message).toContain("COMPOUND_MIN_MEMBERS");
  });

  it("rejects a member that is not a shape-producing kind", () => {
    const document = createFoundationDocument();
    document.nodes["compound-bad"] = compoundNode("compound-bad", "union", ["rectangle-foundation", "text-foundation"]);
    document.nodes["frame-foundation"]!.childIds = ["compound-bad"];
    document.nodes["text-foundation"]!.parentId = "compound-bad";
    document.nodes["rectangle-foundation"]!.parentId = "compound-bad";
    const result = validateEditorDocument(document);
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]!.message).toContain("COMPOUND_MEMBER_KIND_UNSUPPORTED:text-foundation");
  });
});

describe("compound clipboard carry", () => {
  it("carries the operation record through copy, serialization, and paste", () => {
    const kernel = overlapKernel();
    createUnion(kernel);
    kernel.setSelection(["compound-1"]);
    const content = kernel.copySelection();
    expect(content!.nodes[0]!.compound).toEqual({ operation: "union" });
    // The members ride the recursion as the clipboard node's children.
    expect(content!.nodes[0]!.children).toHaveLength(2);
    const parsed = parseClipboardPayload(serializeClipboardPayload(content!));
    expect(parsed!.nodes[0]!.compound).toEqual({ operation: "union" });
    const target = createEditorKernel(createFoundationDocument());
    const outcome = target.paste(parsed, { x: 0, y: 0 });
    expect(outcome).toBeDefined();
    const document = target.getDocument();
    const pasted = Object.values(document.nodes).find((node) => node.kind === "compound")!;
    expect(pasted.compound).toEqual({ operation: "union" });
    expect(pasted.childIds).toHaveLength(2);
    for (const childId of pasted.childIds) expect(document.nodes[childId]!.parentId).toBe(pasted.id);
  });
});

/** The derived world bbox of a resolved outline result. */
const resolveCompoundOutlineBounds = (result: { geometry: PathGeometry; placement: { x: number; y: number } }): Rect => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of Object.values(result.geometry.points)) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return { x: result.placement.x + minX, y: result.placement.y + minY, width: maxX - minX, height: maxY - minY };
};
