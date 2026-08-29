import { describe, expect, it } from "vitest";

import { createFoundationDocument } from "./document.js";
import { createEditorKernel } from "./kernel.js";

const style = { fill: "#123456", stroke: "#abcdef" } as const;

describe("kernel shape creation", () => {
  it.each([
    ["rectangle", "rectangle", "New rectangle"],
    ["ellipse", "path", "Ellipse"],
  ] as const)(
    "creates, selects, and round-trips one %s history entry",
    (tool, kind, name) => {
      const kernel = createEditorKernel(createFoundationDocument());
      const before = kernel.serialize();
      const nodeId = kernel.createShape(
        {
          tool,
          bounds: { x: 20, y: 30, width: 120, height: 80 },
        },
        style,
      );

      expect(nodeId).toBeDefined();
      expect(kernel.getDocument().nodes[nodeId!]).toMatchObject({
        bounds: { x: 20, y: 30, width: 120, height: 80 },
        fill: style.fill,
        kind,
        name,
        parentId: "page-root-home",
        stroke: style.stroke,
      });
      expect(kernel.getState().selectedIds).toEqual([nodeId]);
      expect(kernel.getHistoryDepths()).toEqual({ undo: 1, redo: 0 });

      const after = kernel.serialize();
      expect(kernel.undo()).toBe(true);
      expect(kernel.serialize()).toBe(before);
      expect(kernel.redo()).toBe(true);
      expect(kernel.serialize()).toBe(after);
      expect(kernel.getState().selectedIds).toEqual([nodeId]);
    },
  );

  it("authors ellipse and line geometry with node-unique point identities", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const ellipseId = kernel.createShape(
      {
        tool: "ellipse",
        bounds: { x: 20, y: 30, width: 120, height: 80 },
      },
      style,
    )!;
    const lineId = kernel.createShape(
      {
        tool: "line",
        start: { x: 200, y: 100 },
        end: { x: 320, y: 100 },
      },
      style,
    )!;
    const ellipse = kernel.getDocument().nodes[ellipseId]!;
    const line = kernel.getDocument().nodes[lineId]!;

    expect(Object.keys(ellipse.path!.points)).toHaveLength(4);
    expect(Object.keys(line.path!.points)).toHaveLength(2);
    expect(line.path!.subpaths[`${lineId}-subpath`]?.closed).toBe(false);
    expect(line.bounds).toEqual({ x: 200, y: 100, width: 120, height: 0 });
    expect(
      new Set([
        ...Object.keys(ellipse.path!.points),
        ...Object.keys(line.path!.points),
      ]).size,
    ).toBe(6);
  });

  it("creates a frame and absorbs contained top-level nodes in one entry", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const before = kernel.serialize();
    const frameId = kernel.createShape(
      {
        tool: "frame",
        bounds: { x: 100, y: 80, width: 700, height: 500 },
      },
      style,
    )!;
    const document = kernel.getDocument();

    expect(document.nodes[frameId]?.childIds).toEqual(["frame-foundation"]);
    expect(document.nodes["frame-foundation"]).toMatchObject({
      parentId: frameId,
      bounds: { x: 80, y: 40, width: 520, height: 320 },
    });
    expect(kernel.getHistoryDepths()).toEqual({ undo: 1, redo: 0 });
    expect(kernel.undo()).toBe(true);
    expect(kernel.serialize()).toBe(before);
  });

  it("rejects sub-minimum geometry without document or history changes", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    const before = kernel.serialize();

    expect(
      kernel.createShape(
        {
          tool: "rectangle",
          bounds: { x: 0, y: 0, width: 0.5, height: 10 },
        },
        style,
      ),
    ).toBeUndefined();
    expect(
      kernel.createShape(
        {
          tool: "line",
          start: { x: 0, y: 0 },
          end: { x: 0.5, y: 0.5 },
        },
        style,
      ),
    ).toBeUndefined();
    expect(kernel.serialize()).toBe(before);
    expect(kernel.canUndo()).toBe(false);
  });
});
