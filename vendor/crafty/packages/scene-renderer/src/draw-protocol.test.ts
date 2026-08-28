import { describe, expect, it } from "vitest";
import {
  DRAW_PROTOCOL_V1,
  DRAW_PROTOCOL_V2,
  DRAW_PROTOCOL_V3,
  DRAW_PROTOCOL_VERSION,
  isSupportedDrawProtocolVersion,
  type DrawCommand,
  type DrawFillRule,
  type DrawGlassSurface,
  type DrawOverlayPacket,
  type DrawStrokeDescriptor,
  type RenderFrame,
} from "./draw-protocol.js";
import {
  retainValidPacket,
  createRendererFailureState,
  glassSurfaceError,
} from "./failure-policy.js";

const currentFrame: RenderFrame = {
  protocolVersion: DRAW_PROTOCOL_VERSION,
  frameId: "frame-home",
  viewport: {
    panX: 0,
    panY: 0,
    zoom: 1,
    width: 640,
    height: 360,
    pixelRatio: 1,
  },
  commands: [],
  documentRevision: 7,
  packetRevision: 3,
  changedNodeIds: ["layer-a", "layer-b"],
  dirtyRegion: { x: 0, y: 0, width: 40, height: 40 },
  selectionBounds: { x: 4, y: 4, width: 8, height: 8 },
};

describe("draw protocol v3", () => {
  it("is additive over v1: v3 packets carry revision and batch fields", () => {
    expect(DRAW_PROTOCOL_VERSION).toBe(5);
    expect(DRAW_PROTOCOL_V3).toBe(3);
    expect(DRAW_PROTOCOL_V2).toBe(2);
    expect(DRAW_PROTOCOL_V1).toBe(1);
    expect(currentFrame).toMatchObject({
      protocolVersion: 5,
      documentRevision: 7,
      packetRevision: 3,
      changedNodeIds: ["layer-a", "layer-b"],
      dirtyRegion: { x: 0, y: 0, width: 40, height: 40 },
    });
  });

  it("keeps every v3 field optional so v1-shaped packets remain valid", () => {
    const v1Shaped: RenderFrame = {
      protocolVersion: DRAW_PROTOCOL_V1,
      frameId: "frame-home",
      viewport: {
        panX: 0,
        panY: 0,
        zoom: 1,
        width: 640,
        height: 360,
        pixelRatio: 1,
      },
      commands: [],
    };
    expect(v1Shaped.documentRevision).toBeUndefined();
    expect(v1Shaped.packetRevision).toBeUndefined();
    expect(v1Shaped.changedNodeIds).toBeUndefined();
    expect(v1Shaped.dirtyRegion).toBeUndefined();
    expect(v1Shaped.overlay).toBeUndefined();
    expect(v1Shaped.glassSurfaces).toBeUndefined();
    expect(isSupportedDrawProtocolVersion(DRAW_PROTOCOL_V1)).toBe(true);
    expect(isSupportedDrawProtocolVersion(DRAW_PROTOCOL_V2)).toBe(true);
    expect(isSupportedDrawProtocolVersion(DRAW_PROTOCOL_V3)).toBe(true);
    expect(isSupportedDrawProtocolVersion(DRAW_PROTOCOL_VERSION)).toBe(true);
    expect(isSupportedDrawProtocolVersion(0)).toBe(false);
    expect(isSupportedDrawProtocolVersion(6)).toBe(false);
    expect(isSupportedDrawProtocolVersion(Number.NaN)).toBe(false);
  });

  it("carries an optional kernel-neutral overlay packet without breaking v2", () => {
    const overlay: DrawOverlayPacket = {
      grid: {
        mode: "lines",
        level: 2,
        minorStep: 16,
        majorStep: 80,
        lines: [
          { axis: "x", position: 0, weight: "major" },
          { axis: "y", position: 80, weight: "minor" },
        ],
        axes: [{ axis: "x", position: 0 , weight: "major" }],
      },
      guides: [{ id: "guide-a", axis: "x", position: 120, visible: true }],
    };
    const frame: RenderFrame = { ...currentFrame, overlay };
    expect(frame.overlay?.grid?.minorStep).toBe(16);
    expect(frame.overlay?.guides?.length).toBe(1);
    expect(isSupportedDrawProtocolVersion(frame.protocolVersion)).toBe(true);
  });
});

const rectCommand = (
  nodeId: string,
  zIndex: number,
  order: number,
): DrawCommand => ({
  geometry: "rect",
  nodeId,
  bounds: { x: 0, y: 0, width: 100, height: 80 },
  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  fill: [1, 0.5, 0.25, 1],
  opacity: 1,
  zIndex,
  order,
});

const pathGeometry = {
  points: {
    "point-a": {
      id: "point-a",
      subpathId: "loop",
      order: "00000001",
      x: 0,
      y: 0,
      handleMode: "mirrored" as const,
      handleOut: { dx: 24, dy: 0 },
    },
    "point-b": {
      id: "point-b",
      subpathId: "loop",
      order: "00000002",
      x: 80,
      y: 0,
      handleMode: "free" as const,
      handleIn: { dx: -8, dy: 12 },
      handleOut: { dx: 8, dy: 12 },
    },
    "point-c": {
      id: "point-c",
      subpathId: "loop",
      order: "00000003",
      x: 40,
      y: 96,
      handleMode: "corner" as const,
    },
    "point-d": {
      id: "point-d",
      subpathId: "stroke-line",
      order: "00000001",
      x: 0,
      y: 0,
      handleMode: "corner" as const,
    },
    "point-e": {
      id: "point-e",
      subpathId: "stroke-line",
      order: "00000002",
      x: 120,
      y: 64,
      handleMode: "asymmetric" as const,
      handleIn: { dx: -16, dy: 0 },
      handleOut: { dx: 32, dy: 0 },
    },
  },
  subpaths: {
    loop: { id: "loop", closed: true },
    "stroke-line": { id: "stroke-line", closed: false },
  },
};

const pathCommand = (
  nodeId: string,
  zIndex: number,
  order: number,
  options: { fillRule?: DrawFillRule; stroke?: DrawStrokeDescriptor } = {},
): DrawCommand => {
  const command: DrawCommand = {
    geometry: "path",
    nodeId,
    bounds: { x: 0, y: 0, width: 160, height: 120 },
    transform: { a: 1, b: 0, c: 0, d: 1, e: 40, f: 24 },
    fill: [0.1, 0.2, 0.3, 1],
    opacity: 0.8,
    zIndex,
    order,
    path: structuredClone(pathGeometry),
    fillRule: options.fillRule ?? "nonzero",
  };
  if (options.stroke !== undefined) command.stroke = options.stroke;
  return command;
};

const roundTrip = (frame: RenderFrame): RenderFrame =>
  JSON.parse(JSON.stringify(frame)) as RenderFrame;

describe("draw protocol v3 paths", () => {
  it("still renders a v2 packet with established v2 behaviour, reinterpreted as nothing", () => {
    const v2Commands: DrawCommand[] = [
      rectCommand("layer-a", 1, 0),
      rectCommand("layer-b", 1, 1),
    ];
    const v2: RenderFrame = {
      protocolVersion: DRAW_PROTOCOL_V2,
      frameId: "frame-home",
      viewport: {
        panX: 0,
        panY: 0,
        zoom: 1,
        width: 640,
        height: 360,
        pixelRatio: 1,
      },
      commands: v2Commands,
      documentRevision: 7,
      packetRevision: 3,
      changedNodeIds: ["layer-a", "layer-b"],
      dirtyRegion: { x: 0, y: 0, width: 40, height: 40 },
    };
    expect(isSupportedDrawProtocolVersion(DRAW_PROTOCOL_V2)).toBe(true);
    const accepted = retainValidPacket(createRendererFailureState(), v2);
    expect(accepted.availability).toBe("supported");
    expect(accepted.lastValidPacket).toBe(v2);
    expect(accepted.lastValidPacket?.commands).toEqual(v2Commands);
  });

  it("carries path point records with cubic handles and subpath closure", () => {
    const command = pathCommand("path-bezier", 2, 0);
    expect(command.geometry).toBe("path");
    expect(command.path?.points["point-b"]).toEqual({
      id: "point-b",
      subpathId: "loop",
      order: "00000002",
      x: 80,
      y: 0,
      handleMode: "free",
      handleIn: { dx: -8, dy: 12 },
      handleOut: { dx: 8, dy: 12 },
    });
    expect(command.path?.subpaths.loop).toEqual({ id: "loop", closed: true });
    expect(command.path?.subpaths["stroke-line"]).toEqual({
      id: "stroke-line",
      closed: false,
    });
    const frame: RenderFrame = { ...currentFrame, commands: [command] };
    expect(roundTrip(frame).commands[0]).toEqual(command);
  });

  it("carries the fill rule verbatim for nonzero and evenodd paths", () => {
    const nonzero = pathCommand("path-nonzero", 2, 0, { fillRule: "nonzero" });
    const evenodd = pathCommand("path-evenodd", 2, 1, { fillRule: "evenodd" });
    const frame: RenderFrame = {
      ...currentFrame,
      commands: [nonzero, evenodd],
    };
    expect(roundTrip(frame).commands[0]?.fillRule).toBe("nonzero");
    expect(roundTrip(frame).commands[1]?.fillRule).toBe("evenodd");
  });

  it("carries a stroke descriptor when present and declares fill-only otherwise", () => {
    const stroked = pathCommand("path-stroked", 2, 0, {
      stroke: { width: 4, caps: "round", joins: "bevel", dash: [6, 2, 4, 2] },
    });
    expect(stroked.stroke).toEqual({
      width: 4,
      caps: "round",
      joins: "bevel",
      dash: [6, 2, 4, 2],
    });
    const filledOnly = pathCommand("path-filled", 2, 1);
    expect(filledOnly.stroke).toBeUndefined();
    const frame: RenderFrame = {
      ...currentFrame,
      commands: [stroked, filledOnly],
    };
    const rt = roundTrip(frame);
    expect(rt.commands[0]?.stroke).toEqual({
      width: 4,
      caps: "round",
      joins: "bevel",
      dash: [6, 2, 4, 2],
    });
    expect(rt.commands[1]).not.toHaveProperty("stroke");
  });

  it("keeps rects first-class: rect and path commands coexist and rect layout is untouched", () => {
    const rect = rectCommand("layer-rect", 1, 0);
    const path = pathCommand("path-curve", 1, 1);
    expect(rect).not.toHaveProperty("path");
    expect(rect).not.toHaveProperty("fillRule");
    expect(rect).not.toHaveProperty("stroke");
    expect(rect.geometry).toBe("rect");
    const frame: RenderFrame = { ...currentFrame, commands: [rect, path] };
    expect(roundTrip(frame).commands).toEqual([rect, path]);
  });

  it("orders mixed-geometry commands by (zIndex, order) regardless of kind", () => {
    const commands = [
      rectCommand("rect-top", 3, 0),
      pathCommand("path-mid", 2, 1),
      rectCommand("rect-mid", 2, 0),
      pathCommand("path-low", 1, 5),
      pathCommand("path-hi", 3, 1),
    ];
    const sorted = [...commands].sort(
      (left, right) => left.zIndex - right.zIndex || left.order - right.order,
    );
    expect(sorted.map((command) => command.nodeId)).toEqual([
      "path-low",
      "rect-mid",
      "path-mid",
      "rect-top",
      "path-hi",
    ]);
    expect(sorted).toEqual([
      commands[3],
      commands[2],
      commands[1],
      commands[0],
      commands[4],
    ]);
  });

  it("carries no product semantics: no components, tokens or variants in the packet", () => {
    const fromInstance = pathCommand("resolved-node", 1, 0, {
      fillRule: "evenodd",
    });
    const frame: RenderFrame = {
      ...currentFrame,
      commands: [rectCommand("layer-rect", 1, 1), fromInstance],
    };
    const serialized = JSON.stringify(frame);
    expect(serialized).not.toMatch(
      /component|token|variant|instance|library|history|trigger/i,
    );
    const allowedCommandKeys = new Set([
      "geometry",
      "nodeId",
      "bounds",
      "transform",
      "fill",
      "opacity",
      "zIndex",
      "order",
      "path",
      "fillRule",
      "stroke",
    ]);
    for (const command of frame.commands) {
      for (const key of Object.keys(command)) {
        expect(allowedCommandKeys.has(key)).toBe(true);
      }
    }
    const allowedFrameKeys = new Set([
      "protocolVersion",
      "frameId",
      "viewport",
      "commands",
      "glassSurfaces",
      "selectionBounds",
      "documentRevision",
      "packetRevision",
      "changedNodeIds",
      "dirtyRegion",
      "overlay",
    ]);
    for (const key of Object.keys(frame)) {
      expect(allowedFrameKeys.has(key)).toBe(true);
    }
  });
});

describe("draw protocol v4 glass surfaces", () => {
  const glassSurface = (overrides: Partial<DrawGlassSurface> = {}): DrawGlassSurface => ({
    nodeId: "glass-panel",
    bounds: { x: 40, y: 24, width: 240, height: 160 },
    transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    blurRadius: 24,
    tint: [1, 1, 1, 0.6],
    saturation: 1.4,
    refraction: 0.15,
    opacity: 1,
    zIndex: 5,
    order: 12,
    ...overrides,
  });

  it("carries kernel-neutral glass surfaces on the frame", () => {
    const surfaces = [glassSurface(), glassSurface({ nodeId: "glass-card", order: 13 })];
    const frame: RenderFrame = { ...currentFrame, glassSurfaces: surfaces };
    expect(roundTrip(frame).glassSurfaces).toEqual(surfaces);
    expect(retainValidPacket(createRendererFailureState(), frame).availability).toBe("supported");
  });

  it("accepts a v3 frame with no glass surfaces unchanged", () => {
    const v3: RenderFrame = { ...currentFrame, protocolVersion: DRAW_PROTOCOL_V3 };
    const accepted = retainValidPacket(createRendererFailureState(), v3);
    expect(accepted.availability).toBe("supported");
    expect(accepted.lastValidPacket?.glassSurfaces).toBeUndefined();
  });

  it("rejects each malformed glass field at the boundary with a stable code", () => {
    const cases: Array<[Partial<DrawGlassSurface>, string]> = [
      [{ nodeId: "" }, "RENDER_PACKET_INVALID:glassSurfaces.nodeId"],
      [{ bounds: { x: Number.NaN, y: 0, width: 10, height: 10 } }, "RENDER_PACKET_INVALID:glassSurfaces.bounds"],
      [{ bounds: { x: 0, y: 0, width: -1, height: 10 } }, "RENDER_PACKET_INVALID:glassSurfaces.bounds"],
      [{ transform: { a: Number.POSITIVE_INFINITY, b: 0, c: 0, d: 1, e: 0, f: 0 } }, "RENDER_PACKET_INVALID:glassSurfaces.transform"],
      [{ blurRadius: -1 }, "RENDER_PACKET_INVALID:glassSurfaces.blurRadius"],
      [{ blurRadius: Number.NaN }, "RENDER_PACKET_INVALID:glassSurfaces.blurRadius"],
      [{ tint: [1, 0, 0, 2] }, "RENDER_PACKET_INVALID:glassSurfaces.tint"],
      [{ saturation: -0.5 }, "RENDER_PACKET_INVALID:glassSurfaces.saturation"],
      [{ refraction: 1.5 }, "RENDER_PACKET_INVALID:glassSurfaces.refraction"],
      [{ opacity: 1.1 }, "RENDER_PACKET_INVALID:glassSurfaces.opacity"],
      [{ zIndex: 1.5 }, "RENDER_PACKET_INVALID:glassSurfaces.zIndex"],
      [{ order: -1 }, "RENDER_PACKET_INVALID:glassSurfaces.order"],
    ];
    for (const [patch, code] of cases) {
      expect(glassSurfaceError(glassSurface(patch))).toBe(code);
      const frame: RenderFrame = { ...currentFrame, glassSurfaces: [glassSurface(patch)] };
      const rejected = retainValidPacket(createRendererFailureState(), frame);
      expect(rejected.availability).toBe("degraded");
      expect(rejected.diagnostic?.code).toBe("RENDER_PACKET_INVALID");
      expect(rejected.lastValidPacket).toBeUndefined();
    }
  });

  it("keeps the last valid packet when a later frame's glass is malformed", () => {
    const state = retainValidPacket(createRendererFailureState(), { ...currentFrame, glassSurfaces: [glassSurface()] });
    const bad: RenderFrame = { ...currentFrame, glassSurfaces: [glassSurface({ blurRadius: -4 })] };
    const rejected = retainValidPacket(state, bad);
    expect(rejected.availability).toBe("degraded");
    expect(rejected.lastValidPacket).toBe(state.lastValidPacket);
    expect(rejected.lastValidPacket?.glassSurfaces?.[0]?.blurRadius).toBe(24);
  });
});

describe("draw protocol v5 text", () => {
  it("carries a text command with its string and size", () => {
    const textCommand = {
      geometry: "text" as const,
      nodeId: "text-1",
      bounds: { x: 0, y: 0, width: 120, height: 24 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 10, f: 20 },
      fill: [0.1, 0.2, 0.3, 1] as [number, number, number, number],
      opacity: 1,
      zIndex: 2,
      order: 3,
      text: "Design the state",
      fontSize: 24,
    };
    expect(isSupportedDrawProtocolVersion(5)).toBe(true);
    expect(JSON.parse(JSON.stringify(textCommand))).toMatchObject({
      geometry: "text",
      text: "Design the state",
      fontSize: 24,
    });
  });
});
