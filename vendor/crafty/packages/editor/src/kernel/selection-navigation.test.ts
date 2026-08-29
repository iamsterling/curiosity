import { describe, expect, it } from "vitest";

import { createFoundationDocument } from "./document.js";
import { createEditorKernel } from "./kernel.js";

describe("kernel selection navigation", () => {
  it("deep-selects into a selected container and enters its isolation scope", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setSelection(["frame-foundation"]);

    expect(kernel.deepSelectAt({ x: 250, y: 210 })).toBe(true);
    expect(kernel.getState()).toMatchObject({
      isolationRootId: "frame-foundation",
      selectedIds: ["rectangle-foundation"],
    });
    expect(kernel.serialize()).not.toContain("isolationRootId");
  });

  it("exits isolation only outside the transformed container", () => {
    const document = createFoundationDocument();
    document.nodes["frame-foundation"]!.transform = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 100,
      f: 50,
    };
    const kernel = createEditorKernel(document);
    expect(kernel.enterIsolation("frame-foundation")).toBe(true);

    expect(kernel.exitIsolationAt({ x: 300, y: 200 })).toBe(false);
    expect(kernel.getState().isolationRootId).toBe("frame-foundation");
    expect(kernel.exitIsolationAt({ x: 200, y: 130 })).toBe(true);
    expect(kernel.getState().isolationRootId).toBeUndefined();
  });

  it("does nothing when the deepest hit has no selected container ancestor", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setSelection(["text-foundation"]);

    expect(kernel.deepSelectAt({ x: 250, y: 210 })).toBe(false);
    expect(kernel.getState()).toMatchObject({
      selectedIds: ["text-foundation"],
    });
    expect(kernel.getState().isolationRootId).toBeUndefined();
  });

  it("ladders through every nested isolation scope missed by one point", () => {
    const document = createFoundationDocument();
    document.nodes["group-nested"] = {
      id: "group-nested",
      kind: "group",
      name: "Nested group",
      parentId: "frame-foundation",
      childIds: ["rectangle-foundation"],
      bounds: { x: 50, y: 50, width: 200, height: 100 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true,
      locked: false,
      opacity: 1,
      fill: "#000000",
      stroke: "#000000",
      cornerRadius: 0,
      zIndex: 1,
    };
    document.nodes["frame-foundation"]!.childIds = [
      "group-nested",
      "text-foundation",
    ];
    document.nodes["rectangle-foundation"]!.parentId = "group-nested";
    const kernel = createEditorKernel(document);
    expect(kernel.enterIsolation("frame-foundation")).toBe(true);
    expect(kernel.enterIsolation("group-nested")).toBe(true);

    expect(kernel.exitIsolationAt({ x: 100, y: 100 })).toBe(true);
    expect(kernel.getState().isolationRootId).toBeUndefined();
  });
});
