import { describe, expect, it } from "vitest";
import { applyDocumentCommand } from "./commands.js";
import { canonicalEditorDocumentString, createFoundationDocument, migrateDocument, parseEditorDocument, validateEditorDocument } from "./document.js";
import { screenToWorld, worldToScreen, zoomAt } from "./coordinates.js";
import { createEditorKernel } from "./kernel.js";
import { documentHitTest, initialInteractionState, transitionInteraction } from "./interaction.js";
import { editorDocumentToScene, sceneToEditorDocument } from "./scene-adapter.js";
import { createTenThousandNodeDocument } from "./stress-fixtures.js";
import { createSeedScene } from "@crafty/scene-model";

describe("editor kernel foundation", () => {
  it("validates a stable-id hierarchy and rejects parent cycles", () => {
    const document = createFoundationDocument();
    expect(validateEditorDocument(document).ok).toBe(true);
    const cyclic = structuredClone(document);
    cyclic.nodes["page-root-home"]!.childIds = [];
    cyclic.nodes["frame-foundation"]!.parentId = "rectangle-foundation";
    cyclic.nodes["rectangle-foundation"]!.parentId = "frame-foundation";
    cyclic.nodes["rectangle-foundation"]!.childIds = ["frame-foundation"];
    expect(validateEditorDocument(cyclic).diagnostics[0]?.code).toBe("DOCUMENT_CYCLE");
  });

  it("serializes and reloads the canonical document without runtime state", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setSelection(["rectangle-foundation"]);
    const parsed = parseEditorDocument(kernel.serialize());
    expect(parsed.ok).toBe(true);
    expect(kernel.serialize()).not.toContain("selectedIds");
  });

  it("commits one semantic transaction and restores it with undo and redo", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.beginTransaction("Move rectangle");
    kernel.preview({ type: "set-bounds", nodeId: "rectangle-foundation", bounds: { x: 88, y: 92, width: 240, height: 132 } });
    kernel.commit();
    expect(kernel.getDocument().nodes["rectangle-foundation"]?.bounds.x).toBe(88);
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes["rectangle-foundation"]?.bounds.x).toBe(64);
    expect(kernel.redo()).toBe(true);
    expect(kernel.getDocument().nodes["rectangle-foundation"]?.bounds.x).toBe(88);
  });

  it("rolls back a cancelled transaction without a persistent mutation", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const before = kernel.serialize();
    kernel.beginTransaction("Cancelled rectangle");
    kernel.preview({ type: "set-bounds", nodeId: "rectangle-foundation", bounds: { x: 500, y: 500, width: 40, height: 40 } });
    kernel.rollback();
    expect(kernel.serialize()).toBe(before);
    expect(kernel.undo()).toBe(false);
  });

  it("keeps zoom anchored and hit tests the topmost unlocked node", () => {
    const viewport = { panX: 80, panY: 40, zoom: 0.8, devicePixelRatio: 2 };
    const screen = worldToScreen({ x: 100, y: 100 }, viewport);
    const next = zoomAt(viewport, screen, 2);
    expect(screenToWorld(screen, next)).toEqual({ x: 100, y: 100 });
    expect(documentHitTest(createFoundationDocument(), "page-home", { x: 250, y: 220 })).toBe("rectangle-foundation");
  });

  it("scopes hit testing and select-all to an isolation root", () => {
    const document = createFoundationDocument();
    const kernel = createEditorKernel(document);
    expect(kernel.enterIsolation("frame-foundation")).toBe(true);
    expect(documentHitTest(document, "page-home", { x: 50, y: 50 }, "frame-foundation")).toBeUndefined();
    kernel.selectAll();
    expect(kernel.getState().selectedIds).toEqual(["rectangle-foundation", "text-foundation"]);
    expect(kernel.serialize()).not.toContain("isolationRootId");
    expect(kernel.undo()).toBe(false);
  });

  it("never arms rectangle creation for navigation or selection tools", () => {
    const context = { viewport: { panX: 0, panY: 0, zoom: 1, devicePixelRatio: 1 }, dragThreshold: 4, hitTest: () => undefined };
    const hand = transitionInteraction({ ...initialInteractionState("hand") }, { type: "pointer-down", pointerId: 1, point: { x: 0, y: 0 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context);
    expect(hand.effects[0]).toEqual({ type: "begin-pan" });
    expect(hand.state.navigation).toBe(true);
    const select = transitionInteraction({ ...initialInteractionState("select") }, { type: "pointer-down", pointerId: 1, point: { x: 0, y: 0 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context);
    expect(select.effects[0]).toEqual({ type: "select", nodeId: undefined, additive: false });
    expect(select.state.tool).toBe("select");
  });

  it("does not commit a rectangle until the drag threshold is crossed", () => {
    const context = { viewport: { panX: 0, panY: 0, zoom: 1, devicePixelRatio: 1 }, dragThreshold: 4, hitTest: () => undefined };
    let state = initialInteractionState("rectangle");
    ({ state } = transitionInteraction(state, { type: "pointer-down", pointerId: 1, point: { x: 10, y: 10 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context));
    ({ state } = transitionInteraction(state, { type: "pointer-move", pointerId: 1, point: { x: 12, y: 12 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context));
    expect(state.phase).toBe("armed");
    ({ state } = transitionInteraction(state, { type: "pointer-move", pointerId: 1, point: { x: 40, y: 30 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context));
    const result = transitionInteraction(state, { type: "pointer-up", pointerId: 1, point: { x: 40, y: 30 }, button: 0, altKey: false, shiftKey: false, spaceKey: false }, context);
    expect(result.effects).toEqual([{ type: "commit-rectangle", bounds: { x: 10, y: 10, width: 30, height: 20 } }]);
  });

  it("rejects invalid command output before it can become document state", () => {
    const document = createFoundationDocument();
    expect(() => applyDocumentCommand(document, { type: "delete-node", nodeId: "frame-foundation" })).toThrow("DOCUMENT_DELETE_NON_LEAF");
  });

  it("round-trips the legacy scene through the canonical document adapter", () => {
    const scene = createSeedScene();
    const migrated = migrateDocument(sceneToEditorDocument(scene));
    expect(migrated.ok).toBe(true);
    const document = migrated.document!;
    expect(validateEditorDocument(document).ok).toBe(true);
    expect(editorDocumentToScene(document, scene.revision)).toEqual(scene);
  });

  it("keeps subtree creation, reorder, metadata, and history semantic", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatchBatch([
      { type: "create-node", node: { id: "group-copy", kind: "group", name: "Group copy", parentId: "page-root-home", childIds: [], bounds: { x: 10, y: 10, width: 200, height: 120 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#111111", stroke: "#ffffff", cornerRadius: 8, zIndex: 1 } },
      { type: "create-node", node: { id: "group-copy-child", kind: "rectangle", name: "Child", parentId: "group-copy", childIds: [], bounds: { x: 20, y: 20, width: 40, height: 40 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#222222", stroke: "#ffffff", cornerRadius: 4, zIndex: 1 } }
    ], "Duplicate subtree");
    expect(kernel.getDocument().nodes["group-copy"]?.childIds).toEqual(["group-copy-child"]);
    kernel.dispatch({ type: "reorder-node", nodeId: "text-foundation", parentId: "frame-foundation", index: 0 });
    expect(kernel.getDocument().nodes["text-foundation"]?.zIndex).toBe(1);
    kernel.dispatch({ type: "set-metadata", key: "storyData", value: { enabled: true } });
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().metadata.storyData).toBeUndefined();
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes["text-foundation"]?.parentId).toBe("frame-foundation");
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes["group-copy-child"]).toBeUndefined();
    expect(kernel.getDocument().nodes["group-copy"]).toBeUndefined();
  });

  it("provides a reproducible 10,000-node stress fixture", () => {
    const document = createTenThousandNodeDocument();
    expect(Object.keys(document.nodes)).toHaveLength(10_004);
    expect(validateEditorDocument(document).ok).toBe(true);
  });
});

describe("reparent-node", () => {
  it("reparents a node between parents and restores both parent and index on undo", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "reparent-node", nodeId: "rectangle-foundation", parentId: "page-root-home", index: 0 });
    const moved = kernel.getDocument();
    expect(moved.nodes["rectangle-foundation"]?.parentId).toBe("page-root-home");
    expect(moved.nodes["page-root-home"]?.childIds).toEqual(["rectangle-foundation", "frame-foundation"]);
    expect(moved.nodes["frame-foundation"]?.childIds).toEqual(["text-foundation"]);
    expect(moved.nodes["rectangle-foundation"]?.zIndex).toBe(1);
    expect(kernel.undo()).toBe(true);
    const restored = kernel.getDocument();
    expect(restored.nodes["rectangle-foundation"]?.parentId).toBe("frame-foundation");
    expect(restored.nodes["frame-foundation"]?.childIds).toEqual(["rectangle-foundation", "text-foundation"]);
    expect(restored.nodes["page-root-home"]?.childIds).toEqual(["frame-foundation"]);
    expect(kernel.redo()).toBe(true);
    expect(kernel.getDocument().nodes["rectangle-foundation"]?.parentId).toBe("page-root-home");
  });

  it("rejects reparenting a node into its own subtree and leaves the document untouched", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const before = canonicalEditorDocumentString(kernel.getDocument());
    expect(() => kernel.dispatch({ type: "reparent-node", nodeId: "frame-foundation", parentId: "rectangle-foundation", index: 0 })).toThrow("DOCUMENT_REPARENT_CYCLE");
    expect(() => kernel.dispatch({ type: "reparent-node", nodeId: "frame-foundation", parentId: "frame-foundation", index: 0 })).toThrow("DOCUMENT_REPARENT_CYCLE");
    expect(canonicalEditorDocumentString(kernel.getDocument())).toBe(before);
    expect(kernel.canUndo()).toBe(false);
  });

  it("rejects reparenting a page root, an unknown parent, an unknown node, and an out-of-range index", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    expect(() => kernel.dispatch({ type: "reparent-node", nodeId: "page-root-home", parentId: "frame-foundation", index: 0 })).toThrow("DOCUMENT_REPARENT_ROOT");
    expect(() => kernel.dispatch({ type: "reparent-node", nodeId: "rectangle-foundation", parentId: "missing-parent", index: 0 })).toThrow("DOCUMENT_PARENT_MISSING:missing-parent");
    expect(() => kernel.dispatch({ type: "reparent-node", nodeId: "missing-node", parentId: "frame-foundation", index: 0 })).toThrow("DOCUMENT_NODE_MISSING:missing-node");
    expect(() => kernel.dispatch({ type: "reparent-node", nodeId: "rectangle-foundation", parentId: "page-root-home", index: 5 })).toThrow("DOCUMENT_REPARENT_INDEX_INVALID");
  });

  it("reorders within the same parent without losing the node", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "reparent-node", nodeId: "rectangle-foundation", parentId: "frame-foundation", index: 1 });
    expect(kernel.getDocument().nodes["frame-foundation"]?.childIds).toEqual(["text-foundation", "rectangle-foundation"]);
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes["frame-foundation"]?.childIds).toEqual(["rectangle-foundation", "text-foundation"]);
  });
});

describe("dispatchBatch atomicity", () => {
  it("rolls the document back when a command partway through the batch throws", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const before = canonicalEditorDocumentString(kernel.getDocument());
    const revisionBefore = kernel.getState().documentRevision;
    expect(() => kernel.dispatchBatch([
      { type: "set-property", nodeId: "rectangle-foundation", property: "name", value: "Renamed" },
      { type: "reparent-node", nodeId: "frame-foundation", parentId: "rectangle-foundation", index: 0 }
    ], "Half-valid batch")).toThrow("DOCUMENT_REPARENT_CYCLE");
    expect(canonicalEditorDocumentString(kernel.getDocument())).toBe(before);
    expect(kernel.getDocument().nodes["rectangle-foundation"]?.name).toBe("Foundation rectangle");
    expect(kernel.getState().documentRevision).toBe(revisionBefore);
    expect(kernel.canUndo()).toBe(false);
  });

  it("still applies and records a fully valid batch as one undo entry", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatchBatch([
      { type: "set-property", nodeId: "rectangle-foundation", property: "name", value: "Renamed" },
      { type: "reparent-node", nodeId: "rectangle-foundation", parentId: "page-root-home", index: 0 }
    ], "Rename and reparent");
    expect(kernel.getDocument().nodes["rectangle-foundation"]?.name).toBe("Renamed");
    expect(kernel.getDocument().nodes["rectangle-foundation"]?.parentId).toBe("page-root-home");
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes["rectangle-foundation"]?.name).toBe("Foundation rectangle");
    expect(kernel.getDocument().nodes["rectangle-foundation"]?.parentId).toBe("frame-foundation");
    expect(kernel.canUndo()).toBe(false);
  });
});

describe("duplicateSelection", () => {
  it("creates a copy with fresh ids, offset bounds, and the copy selected", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setSelection(["rectangle-foundation"]);
    kernel.duplicateSelection();
    const document = kernel.getDocument();
    const copyId = kernel.getState().selectedIds[0]!;
    expect(copyId).toMatch(/^layer-/);
    expect(copyId).not.toBe("rectangle-foundation");
    const copy = document.nodes[copyId];
    expect(copy?.name).toBe("Foundation rectangle copy");
    expect(copy?.bounds).toEqual({ x: 88, y: 108, width: 240, height: 132 });
    expect(copy?.parentId).toBe("frame-foundation");
    expect(document.nodes["frame-foundation"]?.childIds).toEqual(["rectangle-foundation", copyId, "text-foundation"]);
  });

  it("removes the whole copy with a single undo and restores the selection", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setSelection(["frame-foundation"]);
    kernel.duplicateSelection();
    const copyId = kernel.getState().selectedIds[0]!;
    expect(copyId).not.toBe("frame-foundation");
    expect(kernel.getDocument().nodes[copyId]?.childIds).toHaveLength(2);
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes[copyId]).toBeUndefined();
    expect(kernel.getDocument().nodes["frame-foundation"]?.childIds).toEqual(["rectangle-foundation", "text-foundation"]);
    expect(kernel.getState().selectedIds).toEqual(["frame-foundation"]);
    expect(kernel.canUndo()).toBe(false);
  });

  it("recreates the copy on redo", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setSelection(["rectangle-foundation"]);
    kernel.duplicateSelection();
    const firstCopyId = kernel.getState().selectedIds[0]!;
    kernel.undo();
    expect(kernel.redo()).toBe(true);
    const document = kernel.getDocument();
    expect(document.nodes[firstCopyId]).toBeDefined();
  });

  it("clones nested children with remapped ids and intact parent relationships", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setSelection(["frame-foundation"]);
    kernel.duplicateSelection();
    const document = kernel.getDocument();
    const frameCopyId = kernel.getState().selectedIds[0]!;
    expect(frameCopyId).not.toBe("frame-foundation");
    const frameCopy = document.nodes[frameCopyId]!;
    expect(frameCopy.name).toBe("Foundation frame copy");
    expect(frameCopy.bounds).toEqual({ x: 204, y: 144, width: 520, height: 320 });
    const [rectCopyId, textCopyId] = frameCopy.childIds as [string, string];
    expect(rectCopyId).not.toBe("rectangle-foundation");
    expect(textCopyId).not.toBe("text-foundation");
    expect(document.nodes[rectCopyId]?.name).toBe("Foundation rectangle");
    expect(document.nodes[rectCopyId]?.parentId).toBe(frameCopyId);
    expect(document.nodes[rectCopyId]?.bounds).toEqual({ x: 64, y: 84, width: 240, height: 132 });
    expect(document.nodes[textCopyId]?.parentId).toBe(frameCopyId);
    for (const id of [frameCopyId, rectCopyId, textCopyId]) {
      expect(["frame-foundation", "rectangle-foundation", "text-foundation"]).not.toContain(id);
    }
  });

  it("is a no-op with an empty selection and records no history entry", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const before = canonicalEditorDocumentString(kernel.getDocument());
    kernel.duplicateSelection();
    expect(canonicalEditorDocumentString(kernel.getDocument())).toBe(before);
    expect(kernel.canUndo()).toBe(false);
  });
});
