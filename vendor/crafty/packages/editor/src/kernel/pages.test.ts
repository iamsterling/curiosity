import { describe, expect, it } from "vitest";
import { canonicalEditorDocumentString, createDefaultPageCanvas, createFoundationDocument, migrateDocument, type DocumentNode, type PageRecord } from "./document.js";
import { initialInteractionState } from "./interaction.js";
import { createEditorKernel } from "./kernel.js";

const page = (id: string, name = id): PageRecord => ({ id, name, rootId: `page-root-${id.replace(/^page-/u, "")}`, canvas: createDefaultPageCanvas() });

const rectangleNode = (id: string, parentId: string): DocumentNode => ({ id, kind: "rectangle", name: id, parentId, childIds: [], bounds: { x: 0, y: 0, width: 100, height: 80 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 0 });

describe("rest camera rule (test matrix #2)", () => {
  it("writes the durable rest camera via set-page-viewport without creating a history entry", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setViewport({ panX: 77, panY: 88, zoom: 3, devicePixelRatio: 2 });
    expect(kernel.serialize()).not.toContain("77");
    expect(kernel.serialize()).not.toContain("88");
    kernel.dispatch({ type: "set-page-viewport", pageId: "page-home", viewport: { panX: 100, panY: 200, zoom: 2 } });
    expect(kernel.getDocument().pages["page-home"]!.canvas.rest).toEqual({ panX: 100, panY: 200, zoom: 2 });
    expect(kernel.serialize()).toContain("100");
    expect(kernel.getState().viewport).toEqual({ panX: 100, panY: 200, zoom: 2, devicePixelRatio: 2 });
    // The live camera is ephemeral editor state: persisting it into the rest
    // camera is bookkeeping, never an undoable edit, so it must not pollute
    // the undo stack or clear the redo stack.
    expect(kernel.canUndo()).toBe(false);
    expect(kernel.undo()).toBe(false);
    expect(kernel.getDocument().pages["page-home"]!.canvas.rest).toEqual({ panX: 100, panY: 200, zoom: 2 });
    expect(kernel.redo()).toBe(false);
  });

  it("rejects set-page-viewport and set-page mid-gesture without touching the rest camera", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const gesture = { ...initialInteractionState("hand"), phase: "captured", pointerId: 1, start: { x: 0, y: 0 }, current: { x: 10, y: 10 }, navigation: true } as const;
    kernel.setInteraction(gesture);
    expect(() => kernel.dispatch({ type: "set-page-viewport", pageId: "page-home", viewport: { panX: 1, panY: 2, zoom: 1 } })).toThrow("EDITOR_VIEWPORT_GESTURE_ACTIVE");
    expect(() => kernel.dispatch({ type: "set-page", pageId: "page-home" })).toThrow("EDITOR_VIEWPORT_GESTURE_ACTIVE");
    expect(kernel.getDocument().pages["page-home"]!.canvas.rest).toEqual({ panX: 0, panY: 0, zoom: 1 });
    kernel.setInteraction(initialInteractionState("hand"));
    kernel.dispatch({ type: "set-page-viewport", pageId: "page-home", viewport: { panX: 1, panY: 2, zoom: 1 } });
    expect(kernel.getDocument().pages["page-home"]!.canvas.rest).toEqual({ panX: 1, panY: 2, zoom: 1 });
  });
});

describe("page switch restores camera and selection (test matrix #3)", () => {
  it("restores per-page session cameras and selections across set-page", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "set-page-viewport", pageId: "page-home", viewport: { panX: 100, panY: 200, zoom: 2 } });
    kernel.setSelection(["rectangle-foundation"]);
    kernel.dispatch({ type: "create-page", page: page("page-b") });
    kernel.dispatch({ type: "set-page", pageId: "page-b" });
    expect(kernel.getState().currentPageId).toBe("page-b");
    expect(kernel.getState().selectedIds).toEqual([]);
    expect(kernel.getState().viewport).toEqual({ panX: 0, panY: 0, zoom: 1, devicePixelRatio: 1 });
    kernel.dispatch({ type: "create-node", node: rectangleNode("rectangle-b", "page-root-b") });
    kernel.setViewport({ panX: 5, panY: 5, zoom: 0.5, devicePixelRatio: 1 });
    kernel.setSelection(["rectangle-b"]);
    kernel.dispatch({ type: "set-page", pageId: "page-home" });
    expect(kernel.getState().viewport).toEqual({ panX: 100, panY: 200, zoom: 2, devicePixelRatio: 1 });
    expect(kernel.getState().selectedIds).toEqual(["rectangle-foundation"]);
    kernel.dispatch({ type: "set-page", pageId: "page-b" });
    expect(kernel.getState().viewport).toEqual({ panX: 5, panY: 5, zoom: 0.5, devicePixelRatio: 1 });
    expect(kernel.getState().selectedIds).toEqual(["rectangle-b"]);
  });

  it("scopes set-selection to the active page", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "create-page", page: page("page-b") });
    kernel.dispatch({ type: "set-page", pageId: "page-b" });
    kernel.dispatch({ type: "create-node", node: rectangleNode("rectangle-b", "page-root-b") });
    kernel.setSelection(["rectangle-b"]);
    kernel.dispatch({ type: "set-page", pageId: "page-home" });
    kernel.setSelection(["rectangle-foundation"]);
    kernel.dispatch({ type: "set-page", pageId: "page-b" });
    expect(kernel.getState().selectedIds).toEqual(["rectangle-b"]);
    kernel.dispatch({ type: "set-page", pageId: "page-home" });
    expect(kernel.getState().selectedIds).toEqual(["rectangle-foundation"]);
  });
});

describe("undo across pages (test matrix #4)", () => {
  it("undoes a gesture on page B from page A, switching to B and restoring the touched selection", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "create-page", page: page("page-b") });
    kernel.dispatch({ type: "set-page", pageId: "page-b" });
    kernel.dispatch({ type: "create-node", node: rectangleNode("rectangle-b", "page-root-b") });
    kernel.setSelection(["rectangle-b"]);
    kernel.dispatch({ type: "set-bounds", nodeId: "rectangle-b", bounds: { x: 40, y: 50, width: 100, height: 80 } });
    kernel.dispatch({ type: "set-page", pageId: "page-home" });
    expect(kernel.getState().currentPageId).toBe("page-home");
    expect(kernel.undo()).toBe(true);
    expect(kernel.getState().currentPageId).toBe("page-b");
    expect(kernel.getState().selectedIds).toEqual(["rectangle-b"]);
    expect(kernel.getDocument().nodes["rectangle-b"]!.bounds).toEqual({ x: 0, y: 0, width: 100, height: 80 });
    expect(kernel.undo()).toBe(true);
    expect(kernel.getState().selectedIds).toEqual([]);
    expect(kernel.getDocument().nodes["rectangle-b"]).toBeUndefined();
    expect(kernel.redo()).toBe(true);
    expect(kernel.getDocument().nodes["rectangle-b"]).toBeDefined();
    expect(kernel.redo()).toBe(true);
    expect(kernel.getState().selectedIds).toEqual(["rectangle-b"]);
    expect(kernel.getDocument().nodes["rectangle-b"]!.bounds).toEqual({ x: 40, y: 50, width: 100, height: 80 });
  });

  it("undo and redo on the current page keep the live viewport untouched", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setViewport({ panX: 321, panY: 123, zoom: 1.25, devicePixelRatio: 1 });
    kernel.dispatch({ type: "create-node", node: rectangleNode("rectangle-b", "page-root-home") });
    const before = kernel.getState().viewport;
    expect(kernel.undo()).toBe(true);
    expect(kernel.getState().viewport).toEqual(before);
    expect(kernel.getDocument().nodes["rectangle-b"]).toBeUndefined();
    expect(kernel.redo()).toBe(true);
    expect(kernel.getState().viewport).toEqual(before);
    expect(kernel.getDocument().nodes["rectangle-b"]).toBeDefined();
  });

  it("undo of an edit made on another page navigates back and restores that page's session camera", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setViewport({ panX: 111, panY: 222, zoom: 2, devicePixelRatio: 1 });
    kernel.dispatch({ type: "create-page", page: page("page-b") });
    kernel.dispatch({ type: "set-page", pageId: "page-b" });
    kernel.setViewport({ panX: 333, panY: 444, zoom: 0.5, devicePixelRatio: 1 });
    kernel.dispatch({ type: "create-node", node: rectangleNode("rectangle-b", "page-root-b") });
    kernel.dispatch({ type: "set-page", pageId: "page-home" });
    expect(kernel.getState().viewport).toEqual({ panX: 111, panY: 222, zoom: 2, devicePixelRatio: 1 });
    expect(kernel.undo()).toBe(true);
    expect(kernel.getState().currentPageId).toBe("page-b");
    expect(kernel.getState().viewport).toEqual({ panX: 333, panY: 444, zoom: 0.5, devicePixelRatio: 1 });
    expect(kernel.redo()).toBe(true);
    expect(kernel.getState().currentPageId).toBe("page-b");
    expect(kernel.getState().viewport).toEqual({ panX: 333, panY: 444, zoom: 0.5, devicePixelRatio: 1 });
  });
});

describe("page CRUD and reorder commands", () => {
  it("renames a page with undo and redo, trimming and validating the name", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "set-page-name", pageId: "page-home", name: "  Home sweet  " });
    expect(kernel.getDocument().pages["page-home"]!.name).toBe("Home sweet");
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().pages["page-home"]!.name).toBe("Home");
    expect(kernel.redo()).toBe(true);
    expect(kernel.getDocument().pages["page-home"]!.name).toBe("Home sweet");
    expect(() => kernel.dispatch({ type: "set-page-name", pageId: "page-home", name: "   " })).toThrow("DOCUMENT_PAGE_NAME_INVALID");
    expect(() => kernel.dispatch({ type: "set-page-name", pageId: "page-missing", name: "X" })).toThrow("DOCUMENT_PAGE_MISSING");
  });

  it("creates pages with default canvases and guards the last page from deletion", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    expect(() => kernel.dispatch({ type: "delete-page", pageId: "page-home" })).toThrow("DOCUMENT_LAST_PAGE");
    kernel.dispatch({ type: "create-page", page: page("page-b") });
    expect(kernel.getDocument().pageOrder).toEqual(["page-home", "page-b"]);
    expect(kernel.getDocument().pages["page-b"]!.canvas).toEqual(createDefaultPageCanvas());
    expect(kernel.getDocument().nodes["page-root-b"]!.kind).toBe("page-root");
    expect(() => kernel.dispatch({ type: "create-page", page: page("page-b") })).toThrow("DOCUMENT_PAGE_EXISTS");
  });

  it("deletes a page with its subtree and restores it on undo across a switch", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "create-page", page: page("page-b") });
    kernel.dispatch({ type: "set-page", pageId: "page-b" });
    kernel.dispatch({ type: "create-node", node: rectangleNode("rectangle-b", "page-root-b") });
    kernel.dispatch({ type: "delete-page", pageId: "page-b" });
    expect(kernel.getDocument().pages["page-b"]).toBeUndefined();
    expect(kernel.getDocument().nodes["rectangle-b"]).toBeUndefined();
    expect(kernel.getDocument().nodes["page-root-b"]).toBeUndefined();
    expect(kernel.getState().currentPageId).toBe("page-home");
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().pages["page-b"]).toBeDefined();
    expect(kernel.getDocument().nodes["rectangle-b"]).toBeDefined();
    expect(kernel.getState().currentPageId).toBe("page-b");
    expect(kernel.redo()).toBe(true);
    expect(kernel.getDocument().pages["page-b"]).toBeUndefined();
    expect(kernel.getState().currentPageId).toBe("page-home");
    expect(kernel.redo()).toBe(false);
  });

  it("reorders pages with undo and redo and validates the target index", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "create-page", page: page("page-b") });
    kernel.dispatch({ type: "create-page", page: page("page-c") });
    kernel.dispatch({ type: "reorder-page", pageId: "page-c", index: 0 });
    expect(kernel.getDocument().pageOrder).toEqual(["page-c", "page-home", "page-b"]);
    expect(() => kernel.dispatch({ type: "reorder-page", pageId: "page-c", index: 9 })).toThrow("DOCUMENT_PAGE_INDEX_INVALID");
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().pageOrder).toEqual(["page-home", "page-b", "page-c"]);
    expect(kernel.redo()).toBe(true);
    expect(kernel.getDocument().pageOrder).toEqual(["page-c", "page-home", "page-b"]);
  });

  it("rejects page commands for missing pages", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    expect(() => kernel.dispatch({ type: "set-page", pageId: "page-missing" })).toThrow("DOCUMENT_PAGE_MISSING");
    expect(() => kernel.dispatch({ type: "delete-page", pageId: "page-missing" })).toThrow("DOCUMENT_PAGE_MISSING");
    expect(() => kernel.dispatch({ type: "reorder-page", pageId: "page-missing", index: 0 })).toThrow("DOCUMENT_PAGE_MISSING");
  });
});

describe("migration completeness with page CRUD (test matrix #5)", () => {
  it("round-trips page CRUD and reorder through the migration with stable canonical bytes", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "create-page", page: page("page-b") });
    kernel.dispatch({ type: "create-page", page: page("page-c") });
    kernel.dispatch({ type: "reorder-page", pageId: "page-c", index: 0 });
    kernel.dispatch({ type: "set-page-viewport", pageId: "page-c", viewport: { panX: 12, panY: 34, zoom: 3 } });
    kernel.dispatch({ type: "delete-page", pageId: "page-b" });
    const serialized = kernel.serialize();
    const first = migrateDocument(JSON.parse(serialized) as unknown);
    const second = migrateDocument(JSON.parse(serialized) as unknown);
    expect(first.ok).toBe(true);
    expect(first.applied).toEqual([]);
    expect(canonicalEditorDocumentString(first.document!)).toBe(canonicalEditorDocumentString(second.document!));
    expect(first.document!.pageOrder).toEqual(["page-c", "page-home"]);
    expect(first.document!.pages["page-c"]!.canvas.rest).toEqual({ panX: 12, panY: 34, zoom: 3 });
  });

  it("rejects corrupt v2 input without coercion and preserves the previous document", () => {
    const corrupt = { schemaVersion: 2, id: "doc-x", pages: {}, pageOrder: ["ghost"], nodes: {} };
    const result = migrateDocument(corrupt);
    expect(result.ok).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    const previous = createFoundationDocument();
    const kept = result.ok && result.document ? result.document : previous;
    expect(canonicalEditorDocumentString(kept)).toBe(canonicalEditorDocumentString(previous));
  });

  it("restores the persisted rest camera for the active page at the kernel load boundary", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatch({ type: "set-page-viewport", pageId: "page-home", viewport: { panX: 123, panY: 456, zoom: 2 } });
    const serialized = kernel.serialize();
    const reloaded = createEditorKernel(JSON.parse(serialized) as never);
    expect(reloaded.getState().viewport).toEqual({ panX: 123, panY: 456, zoom: 2, devicePixelRatio: 1 });
  });
});
