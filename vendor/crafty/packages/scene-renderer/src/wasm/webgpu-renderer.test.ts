import { describe, expect, it } from "vitest";
import type { DrawCommand, RenderFrame } from "../index.js";
import { withOverlays, withPathCommands } from "./webgpu-renderer.js";

const frame: RenderFrame = {
  protocolVersion: 1,
  frameId: "overlay-frame",
  viewport: {
    panX: 0,
    panY: 0,
    zoom: 1,
    width: 200,
    height: 100,
    pixelRatio: 1,
  },
  commands: [
    {
      geometry: "rect",
      nodeId: "rect-1",
      bounds: { x: 10, y: 20, width: 30, height: 40 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      fill: [0.1, 0.2, 0.3, 1],
      opacity: 1,
      zIndex: 0,
      order: 0,
    },
  ],
  selectionBounds: { x: 10, y: 20, width: 30, height: 40 },
};

describe("host overlay composition", () => {
  it("preserves the Rust frame and appends the preview overlay as draw commands", () => {
    const result = withOverlays(frame, { x: 60, y: 30, width: 20, height: 10 });

    expect(result.protocolVersion).toBe(frame.protocolVersion);
    expect(result.commands).toHaveLength(6);
    expect(result.commands[0]).toEqual(frame.commands[0]);
    expect(result.commands.slice(1).map((command) => command.nodeId)).toEqual([
      "preview",
      "preview-outline-top",
      "preview-outline-bottom",
      "preview-outline-left",
      "preview-outline-right",
    ]);
    expect(result.commands[1]?.fill).toEqual([0.27, 0.29, 0.48, 1]);
  });

  it("does not add overlays when the frame has no preview", () => {
    const result = withOverlays(
      {
        protocolVersion: frame.protocolVersion,
        frameId: frame.frameId,
        viewport: frame.viewport,
        commands: frame.commands,
      },
      undefined,
    );

    expect(result.commands).toEqual(frame.commands);
  });

  it("folds editing overlay commands above the preview overlays, re-basing their keys", () => {
    const overlayCommand: DrawCommand = {
      geometry: "rect",
      nodeId: "edit-grippy",
      bounds: { x: 5, y: 5, width: 6, height: 6 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      fill: [1, 1, 1, 1],
      opacity: 1,
      zIndex: 0,
      order: 0,
    };
    const result = withOverlays(
      frame,
      { x: 60, y: 30, width: 20, height: 10 },
      [overlayCommand],
    );

    expect(result.commands).toHaveLength(7);
    const last = result.commands[6]!;
    expect(last.nodeId).toBe("edit-grippy");
    expect(last.zIndex).toBe(Number.MAX_SAFE_INTEGER);
    expect(last.order).toBeGreaterThan(result.commands[5]!.order);
    expect(last.bounds).toEqual(overlayCommand.bounds);
    expect(last.fill).toEqual(overlayCommand.fill);
  });
});

describe("authored path command channel", () => {
  const pathCommand: DrawCommand = {
    geometry: "path",
    nodeId: "path-1",
    bounds: { x: 0, y: 0, width: 10, height: 10 },
    transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    fill: [1, 0, 0, 1],
    opacity: 1,
    zIndex: 5,
    order: 3,
    path: {
      points: {
        "p-1": {
          id: "p-1",
          subpathId: "s-1",
          order: "00000000",
          x: 0,
          y: 0,
          handleMode: "corner",
        },
        "p-2": {
          id: "p-2",
          subpathId: "s-1",
          order: "00000001",
          x: 10,
          y: 10,
          handleMode: "corner",
        },
      },
      subpaths: { "s-1": { id: "s-1", closed: false } },
    },
    fillRule: "nonzero",
  };

  it("appends path commands to the authored list, keeping their ordering keys", () => {
    const result = withPathCommands({ ...frame }, [pathCommand]);

    expect(result.commands).toHaveLength(2);
    expect(result.commands[0]).toEqual(frame.commands[0]);
    expect(result.commands[1]).toBe(pathCommand);
    expect(result.commands[1]?.zIndex).toBe(5);
    expect(result.commands[1]?.order).toBe(3);
  });

  it("leaves the frame untouched without path commands", () => {
    const result = withPathCommands({ ...frame }, undefined);

    expect(result.commands).toEqual(frame.commands);
  });

  it("composes path commands into the packet the module re-sorts", () => {
    // The module's `(zIndex, order)` re-sort is what interleaves the appended
    // commands with the rect layers — the composition must not re-key them.
    const composed = withOverlays(
      withPathCommands({ ...frame }, [pathCommand]),
      undefined,
    );

    expect(composed.commands).toHaveLength(2);
    expect(composed.commands[1]?.zIndex).toBe(5);
    expect(composed.commands[1]?.order).toBe(3);
  });
});
