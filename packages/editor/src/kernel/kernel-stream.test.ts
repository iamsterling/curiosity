import { describe, expect, it } from "vitest";
import { createFoundationDocument } from "./document.js";
import { createEditorKernel } from "./kernel.js";

describe("kernel revision stream and projection", () => {
  it("notifies subscribers on committed document and state changes", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    let notified = 0;
    const unsubscribe = kernel.subscribe(() => { notified += 1; });
    kernel.dispatch({ type: "set-bounds", nodeId: "rectangle-foundation", bounds: { x: 1, y: 2, width: 240, height: 132 } });
    expect(notified).toBe(1);
    kernel.setSelection(["rectangle-foundation"]);
    expect(notified).toBe(2);
    kernel.setTool("hand");
    expect(notified).toBe(3);
    kernel.setViewport({ panX: 10, panY: 20, zoom: 2, devicePixelRatio: 2 });
    expect(notified).toBe(4);
    unsubscribe();
    kernel.dispatch({ type: "set-bounds", nodeId: "rectangle-foundation", bounds: { x: 3, y: 4, width: 240, height: 132 } });
    expect(notified).toBe(4);
  });

  it("returns a stable projection snapshot within one revision", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const first = kernel.getProjection();
    const second = kernel.getProjection();
    expect(first).toBe(second);
    expect(first.document).toBe(second.document);
    expect(first.documentRevision).toBe(0);
    kernel.dispatch({ type: "set-property", nodeId: "rectangle-foundation", property: "fill", value: "#123456" });
    const third = kernel.getProjection();
    expect(third.documentRevision).toBe(1);
    expect(third).not.toBe(first);
    expect(third.document.nodes["rectangle-foundation"]?.fill).toBe("#123456");
    // The committed-revision clone is isolated from later mutation.
    expect(first.document.nodes["rectangle-foundation"]?.fill).not.toBe("#123456");
  });

  it("bumps the revision for previews but not for no-op commands", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.beginTransaction("Move");
    kernel.preview({ type: "set-bounds", nodeId: "rectangle-foundation", bounds: { x: 88, y: 92, width: 240, height: 132 } });
    expect(kernel.getProjection().documentRevision).toBe(1);
    kernel.commit();
    const afterCommit = kernel.getProjection().documentRevision;
    expect(afterCommit).toBe(1);
    const beforeNoop = kernel.getProjection().documentRevision;
    kernel.dispatch({ type: "set-bounds", nodeId: "rectangle-foundation", bounds: { x: 88, y: 92, width: 240, height: 132 } });
    expect(kernel.getProjection().documentRevision).toBe(beforeNoop);
  });

  it("toggles selection membership and never duplicates ids", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.toggleSelection(["rectangle-foundation"]);
    kernel.toggleSelection(["text-foundation"]);
    expect(kernel.getState().selectedIds).toEqual(["rectangle-foundation", "text-foundation"]);
    kernel.toggleSelection(["rectangle-foundation"]);
    expect(kernel.getState().selectedIds).toEqual(["text-foundation"]);
    kernel.toggleSelection(["missing-node", "rectangle-foundation", "rectangle-foundation"]);
    expect(kernel.getState().selectedIds).toEqual(["text-foundation", "rectangle-foundation"]);
  });

  it("keeps getDocument and getState deep-clone behavior unchanged", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const document = kernel.getDocument();
    document.nodes["rectangle-foundation"]!.bounds.x = 999;
    expect(kernel.getDocument().nodes["rectangle-foundation"]?.bounds.x).toBe(64);
    expect(kernel.serialize()).not.toContain("999");
  });
});
