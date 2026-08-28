import { describe, expect, it, vi } from "vitest";

import { createFoundationDocument } from "./document.js";
import { createEditorKernel } from "./kernel.js";

describe("kernel creation style", () => {
  it("starts with the grounded defaults and emits only for independent real changes", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const listener = vi.fn();
    kernel.subscribe(listener);

    expect(kernel.getProjection().state.creationStyle).toEqual({
      fill: "#818cf8",
      stroke: "#c4b5fd",
    });
    const initial = kernel.getProjection();
    kernel.setCreationFill("#112233");
    expect(kernel.getProjection().state.creationStyle).toEqual({
      fill: "#112233",
      stroke: "#c4b5fd",
    });
    expect(kernel.getProjection()).not.toBe(initial);
    expect(listener).toHaveBeenCalledTimes(1);

    const changed = kernel.getProjection();
    kernel.setCreationFill("#112233");
    expect(kernel.getProjection()).toBe(changed);
    expect(listener).toHaveBeenCalledTimes(1);

    kernel.setCreationStroke("#445566");
    expect(kernel.getProjection().state.creationStyle).toEqual({
      fill: "#112233",
      stroke: "#445566",
    });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("does not affect authored bytes, revision, history, selection, undo, or redo", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setSelection(["rectangle-foundation"]);
    kernel.dispatch(
      {
        type: "set-property",
        nodeId: "rectangle-foundation",
        property: "opacity",
        value: 0.5,
      },
      "Change opacity",
    );
    expect(kernel.undo()).toBe(true);
    const before = {
      serialized: kernel.serialize(),
      document: kernel.getDocument(),
      revision: kernel.getState().documentRevision,
      selection: kernel.getState().selectedIds,
      canUndo: kernel.canUndo(),
      canRedo: kernel.canRedo(),
    };

    kernel.setCreationFill("#abcdef");
    kernel.setCreationStroke("#123456");

    expect(kernel.serialize()).toBe(before.serialized);
    expect(kernel.getDocument()).toEqual(before.document);
    expect(kernel.getState().documentRevision).toBe(before.revision);
    expect(kernel.getState().selectedIds).toEqual(before.selection);
    expect(kernel.canUndo()).toBe(before.canUndo);
    expect(kernel.canRedo()).toBe(before.canRedo);
    expect(kernel.redo()).toBe(true);
    expect(kernel.getState().creationStyle).toEqual({
      fill: "#abcdef",
      stroke: "#123456",
    });
    expect(kernel.undo()).toBe(true);
    expect(kernel.getState().creationStyle).toEqual({
      fill: "#abcdef",
      stroke: "#123456",
    });
    kernel.setTool("rectangle");
    kernel.setSelection([]);
    expect(kernel.getState().creationStyle).toEqual({
      fill: "#abcdef",
      stroke: "#123456",
    });
    kernel.dispatch({
      type: "create-page",
      page: {
        id: "page-second",
        name: "Second",
        rootId: "page-root-second",
        canvas: before.document.pages[before.document.pageOrder[0]!]!.canvas,
      },
    });
    kernel.dispatch({ type: "set-page", pageId: "page-second" });
    expect(kernel.getState().creationStyle).toEqual({
      fill: "#abcdef",
      stroke: "#123456",
    });
  });
});
