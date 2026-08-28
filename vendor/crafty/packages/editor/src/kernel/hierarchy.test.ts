import { describe, expect, it } from "vitest";
import { canonicalEditorDocumentString, createFoundationDocument } from "./document.js";
import { planGroup, planUngroup } from "./hierarchy.js";
import { createEditorKernel } from "./kernel.js";

// Foundation fixture: page-root-home > frame-foundation > [rectangle-foundation, text-foundation]
const kernelWithGroup = (): ReturnType<typeof createEditorKernel> => {
  const kernel = createEditorKernel(createFoundationDocument());
  kernel.dispatchBatch(planGroup(kernel.getDocument(), ["rectangle-foundation", "text-foundation"], "group-1"), "Group");
  return kernel;
};

describe("planGroup", () => {
  it("wraps siblings in a group, preserving order and taking the lowest member's slot", () => {
    const kernel = kernelWithGroup();
    const document = kernel.getDocument();
    expect(document.nodes["group-1"]?.parentId).toBe("frame-foundation");
    expect(document.nodes["frame-foundation"]?.childIds).toEqual(["group-1"]);
    expect(document.nodes["group-1"]?.childIds).toEqual(["rectangle-foundation", "text-foundation"]);
    expect(document.nodes["rectangle-foundation"]?.parentId).toBe("group-1");
    expect(document.nodes["text-foundation"]?.parentId).toBe("group-1");
  });

  it("sizes the group to the union of its members' bounds", () => {
    const document = kernelWithGroup().getDocument();
    // rectangle {64,84,240x132} ∪ text {64,240,340x42}
    expect(document.nodes["group-1"]?.bounds).toEqual({ x: 64, y: 84, width: 340, height: 198 });
  });

  it("groups in document order regardless of the order ids are passed in", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatchBatch(planGroup(kernel.getDocument(), ["text-foundation", "rectangle-foundation"], "group-1"), "Group");
    expect(kernel.getDocument().nodes["group-1"]?.childIds).toEqual(["rectangle-foundation", "text-foundation"]);
  });

  it("undoes the whole group as one history entry", () => {
    const kernel = kernelWithGroup();
    expect(kernel.undo()).toBe(true);
    const restored = kernel.getDocument();
    expect(restored.nodes["group-1"]).toBeUndefined();
    expect(restored.nodes["frame-foundation"]?.childIds).toEqual(["rectangle-foundation", "text-foundation"]);
    expect(restored.nodes["rectangle-foundation"]?.parentId).toBe("frame-foundation");
    expect(kernel.canUndo()).toBe(false);
  });

  it("rejects an empty selection, a missing node, a page root, and mixed parents", () => {
    const document = createFoundationDocument();
    expect(() => planGroup(document, [], "group-1")).toThrow("DOCUMENT_GROUP_EMPTY");
    expect(() => planGroup(document, ["missing-node"], "group-1")).toThrow("DOCUMENT_NODE_MISSING:missing-node");
    expect(() => planGroup(document, ["page-root-home"], "group-1")).toThrow("DOCUMENT_GROUP_ROOT");
    expect(() => planGroup(document, ["frame-foundation", "rectangle-foundation"], "group-1")).toThrow("DOCUMENT_GROUP_MIXED_PARENTS");
    expect(() => planGroup(document, ["rectangle-foundation"], "frame-foundation")).toThrow("DOCUMENT_NODE_EXISTS:frame-foundation");
  });

  it("leaves the document untouched when the batch is rejected", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const before = canonicalEditorDocumentString(kernel.getDocument());
    expect(() => planGroup(kernel.getDocument(), ["frame-foundation", "rectangle-foundation"], "group-1")).toThrow();
    expect(canonicalEditorDocumentString(kernel.getDocument())).toBe(before);
    expect(kernel.canUndo()).toBe(false);
  });
});

describe("planUngroup", () => {
  it("lifts children into the parent at the group's position, in order", () => {
    const kernel = kernelWithGroup();
    kernel.dispatchBatch(planUngroup(kernel.getDocument(), "group-1"), "Ungroup");
    const document = kernel.getDocument();
    expect(document.nodes["group-1"]).toBeUndefined();
    expect(document.nodes["frame-foundation"]?.childIds).toEqual(["rectangle-foundation", "text-foundation"]);
    expect(document.nodes["rectangle-foundation"]?.parentId).toBe("frame-foundation");
  });

  it("keeps surrounding siblings in place", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    // frame > [rectangle, text]; group only the rectangle so text stays a sibling.
    kernel.dispatchBatch(planGroup(kernel.getDocument(), ["rectangle-foundation"], "group-1"), "Group");
    expect(kernel.getDocument().nodes["frame-foundation"]?.childIds).toEqual(["group-1", "text-foundation"]);
    kernel.dispatchBatch(planUngroup(kernel.getDocument(), "group-1"), "Ungroup");
    expect(kernel.getDocument().nodes["frame-foundation"]?.childIds).toEqual(["rectangle-foundation", "text-foundation"]);
  });

  it("round-trips group then ungroup back to the original document", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const before = canonicalEditorDocumentString(kernel.getDocument());
    kernel.dispatchBatch(planGroup(kernel.getDocument(), ["rectangle-foundation", "text-foundation"], "group-1"), "Group");
    kernel.dispatchBatch(planUngroup(kernel.getDocument(), "group-1"), "Ungroup");
    expect(canonicalEditorDocumentString(kernel.getDocument())).toBe(before);
  });

  it("undoes an ungroup as one history entry", () => {
    const kernel = kernelWithGroup();
    kernel.dispatchBatch(planUngroup(kernel.getDocument(), "group-1"), "Ungroup");
    expect(kernel.undo()).toBe(true);
    const document = kernel.getDocument();
    expect(document.nodes["group-1"]?.childIds).toEqual(["rectangle-foundation", "text-foundation"]);
    expect(document.nodes["frame-foundation"]?.childIds).toEqual(["group-1"]);
  });

  it("rejects a missing node, a non-group, and a page root", () => {
    const document = createFoundationDocument();
    expect(() => planUngroup(document, "missing-node")).toThrow("DOCUMENT_NODE_MISSING:missing-node");
    expect(() => planUngroup(document, "frame-foundation")).toThrow("DOCUMENT_UNGROUP_NOT_A_GROUP:frame");
    expect(() => planUngroup(document, "page-root-home")).toThrow("DOCUMENT_UNGROUP_NOT_A_GROUP:page-root");
  });

  it("handles an empty group by deleting it", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.dispatchBatch(planGroup(kernel.getDocument(), ["rectangle-foundation"], "group-1"), "Group");
    kernel.dispatchBatch(planUngroup(kernel.getDocument(), "group-1"), "Ungroup");
    kernel.dispatchBatch(planGroup(kernel.getDocument(), ["rectangle-foundation"], "group-2"), "Group");
    kernel.dispatchBatch(planUngroup(kernel.getDocument(), "group-2"), "Ungroup");
    expect(kernel.getDocument().nodes["frame-foundation"]?.childIds).toEqual(["rectangle-foundation", "text-foundation"]);
  });
});
