import { describe, expect, it } from "vitest";
import { applyDocumentCommand, createEditorKernel, createFoundationDocument } from "../../kernel/index.js";
import { buildStructureProjection } from "./structure-projection.js";

describe("structure projection", () => {
  it("preserves authored child order and permits empty containers", () => {
    let document = createFoundationDocument();
    document = applyDocumentCommand(document, {
      type: "create-node",
      node: { id: "empty", kind: "frame", name: "Empty", parentId: "page-root-home", childIds: [], bounds: { x: 0, y: 0, width: 10, height: 10 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 0 },
    }).document;
    const projection = buildStructureProjection(document, "page-home", undefined, document.pages["page-home"] ? 1 : 0);
    const empty = projection.roots.flatMap((row) => [row, ...row.children]).find((row) => row.authoredId === "empty");
    expect(empty?.canContain).toBe(true);
    expect(empty?.children).toEqual([]);
  });

  it("keeps isolation metadata out of authored row identity", () => {
    const document = createFoundationDocument();
    const projection = buildStructureProjection(document, "page-home", "frame-foundation", 2);
    expect(projection.isolation).toMatchObject({ rootId: "frame-foundation", canExit: true });
    expect(projection.roots.every((row) => row.rowId === row.authoredId)).toBe(true);
  });

  it("keeps isolation ephemeral and scopes selection", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    expect(kernel.enterIsolation("frame-foundation")).toBe(true);
    kernel.setSelection(["frame-foundation"]);
    expect(kernel.getState().selectedIds).toEqual(["frame-foundation"]);
    expect(kernel.serialize()).not.toContain("isolationRootId");
    expect(kernel.exitIsolation()).toBe(true);
    expect(kernel.getState().isolationRootId).toBeUndefined();
  });

  it("offers inside destinations for empty containers and rejects cycles", () => {
    let document = createFoundationDocument();
    document = applyDocumentCommand(document, {
      type: "create-node",
      node: { id: "child", kind: "rectangle", name: "Child", parentId: "frame-foundation", childIds: [], bounds: { x: 0, y: 0, width: 10, height: 10 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 0 },
    }).document;
    const kernel = createEditorKernel(document);
    expect(kernel.legalDropDestinations("child").some((destination) => destination.parentId === "frame-foundation" && destination.position === "inside")).toBe(true);
    expect(kernel.legalDropDestinations("frame-foundation").some((destination) => destination.parentId === "child")).toBe(false);
  });

  it("keeps authored order, stable ids, and diagnostics in the projection", () => {
    const document = createFoundationDocument();
    const projection = buildStructureProjection(document, "page-home", undefined, 7, [{ code: "TEST_DIAGNOSTIC", path: "/nodes", message: "fixture" }]);
    const frame = projection.roots.find((row) => row.authoredId === "frame-foundation");
    expect(frame?.children.map((row) => row.authoredId)).toEqual(["rectangle-foundation", "text-foundation"]);
    expect(frame?.children.every((row) => row.rowId === row.authoredId)).toBe(true);
    expect(projection.diagnostics.map((entry) => entry.code)).toEqual(["TEST_DIAGNOSTIC"]);
  });

  it("rejects an invalid move without changing the document", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const before = kernel.serialize();
    expect(() => kernel.dispatch({ type: "reparent-node", nodeId: "frame-foundation", parentId: "rectangle-foundation", index: 0 }, "Invalid drop")).toThrow();
    expect(kernel.serialize()).toBe(before);
    expect(kernel.canUndo()).toBe(false);
  });

  it("restores a reorder and selection in one undo entry", () => {
    let document = createFoundationDocument();
    document = applyDocumentCommand(document, {
      type: "create-node",
      node: { id: "second-child", kind: "rectangle", name: "Second", parentId: "frame-foundation", childIds: [], bounds: { x: 20, y: 20, width: 10, height: 10 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: "#ffffff", stroke: "#000000", cornerRadius: 0, zIndex: 0 },
    }).document;
    const kernel = createEditorKernel(document);
    kernel.setSelection(["second-child"]);
    const beforeOrder = kernel.getDocument().nodes["frame-foundation"]?.childIds;
    kernel.dispatch({ type: "reorder-node", nodeId: "second-child", parentId: "frame-foundation", index: 0 }, "Reorder layer");
    expect(kernel.canUndo()).toBe(true);
    expect(kernel.undo()).toBe(true);
    expect(kernel.getDocument().nodes["frame-foundation"]?.childIds).toEqual(beforeOrder);
    expect(kernel.getState().selectedIds).toEqual(["second-child"]);
    expect(kernel.canUndo()).toBe(false);
  });
});
