import { describe, expect, it } from "vitest";
import type { DrawCommand, DrawOverlayPacket, RenderFrame } from "../index.js";
import {
  buildGridOverlayCommands,
  MAX_GRID_OVERLAY_DOTS,
  MAX_GRID_OVERLAY_LINES,
} from "./grid-overlay.js";
import { withOverlays } from "./webgpu-renderer.js";

const authored = (nodeId = "rect-1"): DrawCommand => ({
  geometry: "rect",
  nodeId,
  bounds: { x: 10, y: 20, width: 30, height: 40 },
  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  fill: [0.1, 0.2, 0.3, 1],
  opacity: 1,
  zIndex: 0,
  order: 0,
});

const frameWith = (overlay: DrawOverlayPacket | undefined, overrides: Partial<RenderFrame> = {}): RenderFrame => ({
  protocolVersion: 2,
  frameId: "grid-overlay-frame",
  viewport: { panX: 0, panY: 0, zoom: 1, width: 1_000, height: 800, pixelRatio: 1 },
  commands: [authored()],
  ...overrides,
  ...(overlay !== undefined ? { overlay } : {}),
});

const lines = (positions: number[], weight: "minor" | "major" = "minor", axis: "x" | "y" = "x"): Array<{ axis: "x" | "y"; position: number; weight: "minor" | "major" }> =>
  positions.map((position) => ({ axis, position, weight }));

const fullGrid = (): DrawOverlayPacket => ({
  grid: {
    mode: "lines",
    level: 0,
    minorStep: 8,
    majorStep: 40,
    lines: [
      ...lines([0, 8, 16, 24, 32, 40], "minor"),
      ...lines([0, 40], "major"),
      ...lines([0, 8, 16, 24, 32, 40], "minor", "y"),
      ...lines([0, 40], "major", "y"),
    ],
    axes: [
      { axis: "x", position: 0 , weight: "major" },
      { axis: "y", position: 0 , weight: "major" },
    ],
  },
  guides: [
    { id: "guide-a", axis: "x", position: 120, visible: true },
    { id: "guide-hidden", axis: "y", position: 240, visible: false },
  ],
});

describe("grid overlay host consumption", () => {
  it("produces overlay commands with distinct nodeIds", () => {
    const { commands } = buildGridOverlayCommands(frameWith(fullGrid()));

    for (const command of commands) {
      expect(command.nodeId).toMatch(/^(grid-|pixel-|guide-)/);
      expect(command.nodeId).not.toBe(frameWith(fullGrid()).commands[0]?.nodeId);
    }
    expect(commands.map((command) => command.nodeId)).toEqual([
      "grid-minor-0",
      "grid-minor-1",
      "grid-minor-2",
      "grid-minor-3",
      "grid-minor-4",
      "grid-minor-5",
      "grid-minor-6",
      "grid-minor-7",
      "grid-minor-8",
      "grid-minor-9",
      "grid-minor-10",
      "grid-minor-11",
      "grid-major-0",
      "grid-major-1",
      "grid-major-2",
      "grid-major-3",
      "grid-axis-x",
      "grid-axis-y",
      "guide-guide-a",
    ]);
  });

  it("does not mutate the authored packet when composing overlays", () => {
    const frame = frameWith(fullGrid());
    const authoredBefore = structuredClone(frame.commands);
    buildGridOverlayCommands(frame);
    withOverlays(frame, undefined);
    expect(frame.commands).toEqual(authoredBefore);
    expect(frame.overlay).toEqual(fullGrid());
  });

  it("produces zero overlay commands for an absent, empty, or hidden overlay", () => {
    expect(buildGridOverlayCommands(frameWith(undefined))).toMatchObject({ commands: [], lineCount: 0, dotCount: 0, capped: false });
    expect(buildGridOverlayCommands(frameWith({}))).toMatchObject({ commands: [], lineCount: 0, dotCount: 0, capped: false });
    const hidden: DrawOverlayPacket = {
      grid: { mode: "lines", level: 0, minorStep: 8, majorStep: 40, lines: [], axes: [] },
      guides: [{ id: "hidden-guide", axis: "x", position: 10, visible: false }],
    };
    expect(buildGridOverlayCommands(frameWith(hidden))).toMatchObject({ commands: [], lineCount: 0, dotCount: 0 });
    const gridOnly = buildGridOverlayCommands(frameWith({ grid: fullGrid().grid! }));
    expect(gridOnly.commands).toHaveLength(18);
    expect(gridOnly.commands.every((command) => command.nodeId.startsWith("grid-"))).toBe(true);
  });

  it("culls grid lines outside the visible viewport region", () => {
    const grid: DrawOverlayPacket = {
      grid: {
        mode: "lines",
        level: 0,
        minorStep: 8,
        majorStep: 40,
        lines: [
          { axis: "x", position: 10_000, weight: "minor" },
          { axis: "x", position: -1_000, weight: "minor" },
          { axis: "x", position: -5, weight: "minor" },
          { axis: "x", position: -1.5, weight: "minor" },
          { axis: "x", position: 1001.5, weight: "minor" },
          { axis: "x", position: 1003, weight: "minor" },
          { axis: "y", position: -900, weight: "minor" },
          { axis: "y", position: 790, weight: "minor" },
          { axis: "y", position: 801.5, weight: "minor" },
          { axis: "y", position: 900, weight: "minor" },
        ],
      },
    };
    const { commands } = buildGridOverlayCommands(frameWith(grid));
    expect(commands.map((command) => command.nodeId)).toEqual(["grid-minor-0", "grid-minor-1", "grid-minor-2", "grid-minor-3"]);
    for (const command of commands) {
      expect(command.bounds.x).toBeGreaterThanOrEqual(-2.5);
      expect(command.bounds.y).toBeGreaterThanOrEqual(-2.5);
    }
  });

  /** The encoder's root affine — the exact device projection the overlay
   *  commands render under (identity transform, world bounds). */
  const deviceSpanOf = (command: DrawCommand, viewport: RenderFrame["viewport"]): { start: number; end: number } => {
    const { zoom, pixelRatio, panX, panY } = viewport;
    if (command.bounds.width > command.bounds.height) {
      return {
        start: (command.bounds.y * zoom + panY) * pixelRatio,
        end: ((command.bounds.y + command.bounds.height) * zoom + panY) * pixelRatio,
      };
    }
    return {
      start: (command.bounds.x * zoom + panX) * pixelRatio,
      end: ((command.bounds.x + command.bounds.width) * zoom + panX) * pixelRatio,
    };
  };

  it("snaps every line to integer device pixels at fractional pan, zoom and DPR", () => {
    const grid: DrawOverlayPacket = {
      grid: {
        mode: "lines",
        level: 0,
        minorStep: 8,
        majorStep: 40,
        lines: [
          ...lines([0, 8, 16, 24, 32, 40], "minor"),
          ...lines([0, 40], "major"),
          ...lines([0, 8, 16], "minor", "y"),
        ],
        axes: [
          { axis: "x", position: 0 , weight: "major" },
          { axis: "y", position: 0 , weight: "major" },
        ],
      },
    };
    for (const viewport of [
      { panX: 3.7, panY: -11.3, zoom: 1, width: 1_000, height: 800, pixelRatio: 2 },
      { panX: 13.33, panY: -7.77, zoom: 1.37, width: 1_000, height: 800, pixelRatio: 1.5 },
      { panX: -120.25, panY: 64.5, zoom: 4.25, width: 1_000, height: 800, pixelRatio: 1 },
      { panX: 0.5, panY: 0.5, zoom: 0.25, width: 1_000, height: 800, pixelRatio: 3 },
    ]) {
      const { commands } = buildGridOverlayCommands(frameWith(grid, { viewport }));
      for (const command of commands) {
        if (command.nodeId.startsWith("grid-dot")) continue;
        const span = deviceSpanOf(command, viewport);
        // The world rect is the inverse of the encoder's affine, so the
        // device projection round-trips to the snapped integers with only
        // f64 noise (~1e-14 device px) — sub-pixel, never a raster boundary.
        const subPixel = (value: number): number => Math.abs(value - Math.round(value));
        expect(subPixel(span.start), `${command.nodeId} start ${span.start}`).toBeLessThan(1e-6);
        expect(subPixel(span.end), `${command.nodeId} end ${span.end}`).toBeLessThan(1e-6);
      }
    }
  });

  it("renders lines at exact integer device thickness across zooms and DPRs", () => {
    const grid: DrawOverlayPacket = {
      grid: {
        mode: "lines",
        level: 0,
        minorStep: 8,
        majorStep: 40,
        lines: [...lines([0, 8], "minor"), ...lines([0], "major")],
        axes: [{ axis: "x", position: 0 , weight: "major" }],
      },
    };
    for (const viewport of [
      { panX: 3.7, panY: 0, zoom: 1, width: 1_000, height: 800, pixelRatio: 2 },
      { panX: 13.33, panY: 0, zoom: 1.37, width: 1_000, height: 800, pixelRatio: 1.5 },
      { panX: 0, panY: 0, zoom: 4.25, width: 1_000, height: 800, pixelRatio: 1 },
    ]) {
      const { commands } = buildGridOverlayCommands(frameWith(grid, { viewport }));
      const thicknesses = commands.map((command) => {
        const span = deviceSpanOf(command, viewport);
        return span.end - span.start;
      });
      // Minor 1px, major 1.25px, axis 2px — each rounded to whole device pixels.
      expect(thicknesses.every((thickness) => Number.isInteger(thickness) && thickness >= 1)).toBe(true);
    }
  });

  it("snaps dots to whole device pixels with integer device size", () => {
    const grid: DrawOverlayPacket = {
      grid: {
        mode: "dots",
        level: 0,
        minorStep: 8,
        majorStep: 40,
        lines: [],
        dots: [
          { x: 40, y: 40, weight: "major" },
          { x: 48, y: 48, weight: "minor" },
          { x: 56.5, y: 64.25, weight: "minor" },
        ],
      },
    };
    for (const viewport of [
      { panX: 3.7, panY: -11.3, zoom: 1, width: 1_000, height: 800, pixelRatio: 2 },
      { panX: 13.33, panY: -7.77, zoom: 1.37, width: 1_000, height: 800, pixelRatio: 1.5 },
    ]) {
      const { commands } = buildGridOverlayCommands(frameWith(grid, { viewport }));
      expect(commands.length).toBe(3);
      for (const command of commands) {
        const span = deviceSpanOf(command, viewport);
        const subPixel = (value: number): number => Math.abs(value - Math.round(value));
        expect(subPixel(span.start)).toBeLessThan(1e-6);
        expect(subPixel(span.end)).toBeLessThan(1e-6);
        expect(span.end - span.start).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("renders the LOD grid at every zoom — no pixel grid, no suppression", () => {
    const grid: DrawOverlayPacket = {
      grid: {
        mode: "lines",
        level: 0,
        minorStep: 2,
        majorStep: 10,
        lines: [
          ...lines([0, 2, 4, 6, 8], "minor"),
          ...lines([0, 10], "major"),
        ],
        axes: [
          { axis: "x", position: 0, weight: "major" },
          { axis: "y", position: 0, weight: "major" },
        ],
      },
    };
    // The former pixel-grid gate (zoom 4) and beyond: minor/major lines and
    // axes all draw — the LOD ladder owns every zoom, one grid, no second
    // scale to beat against it.
    for (const zoom of [0.5, 1, 2, 4, 8, 16]) {
      const result = buildGridOverlayCommands(frameWith(grid, { viewport: { panX: 0, panY: 0, zoom, width: 1_000, height: 800, pixelRatio: 1 } }));
      expect(result.commands.some((command) => command.nodeId.startsWith("grid-minor-"))).toBe(true);
      expect(result.commands.some((command) => command.nodeId.startsWith("grid-major-"))).toBe(true);
      expect(result.commands.some((command) => command.nodeId.startsWith("grid-axis-"))).toBe(true);
    }
  });

  it("caps the shared line budget and drops minor, then major, then axes, then guides", () => {
    const manyMinor = Array.from({ length: 2_000 }, (_, index) => ({ axis: "x" as const, position: index * 0.5, weight: "minor" as const }));
    const overBudget: DrawOverlayPacket = {
      grid: { mode: "lines", level: 0, minorStep: 0.5, majorStep: 2.5, lines: manyMinor, axes: [{ axis: "x", position: 0 , weight: "major" }] },
      guides: [
        { id: "kept-guide-a", axis: "x", position: 100, visible: true },
        { id: "kept-guide-b", axis: "x", position: 200, visible: true },
      ],
    };
    const { commands, lineCount, capped } = buildGridOverlayCommands(frameWith(overBudget, { viewport: { panX: 0, panY: 0, zoom: 0.5, width: 1_000, height: 800, pixelRatio: 1 } }));
    expect(capped).toBe(true);
    expect(lineCount).toBe(MAX_GRID_OVERLAY_LINES);
    expect(commands).toHaveLength(MAX_GRID_OVERLAY_LINES);
    expect(commands.some((command) => command.nodeId.startsWith("pixel-"))).toBe(false);
    expect(commands.filter((command) => command.nodeId.startsWith("grid-minor-"))).toHaveLength(MAX_GRID_OVERLAY_LINES);
    expect(commands.some((command) => command.nodeId.startsWith("grid-axis-"))).toBe(false);
    expect(commands.some((command) => command.nodeId.startsWith("guide-"))).toBe(false);
  });

  it("caps dots separately and keeps the dot budget out of the line cap", () => {
    const dots = Array.from({ length: MAX_GRID_OVERLAY_DOTS + 50 }, (_, index) => ({ x: index % 100, y: Math.floor(index / 100), weight: "minor" as const }));
    const grid: DrawOverlayPacket = { grid: { mode: "dots", level: 0, minorStep: 8, majorStep: 40, lines: [], dots } };
    const { commands, dotCount, lineCount } = buildGridOverlayCommands(frameWith(grid));
    expect(dotCount).toBe(MAX_GRID_OVERLAY_DOTS);
    expect(commands.filter((command) => command.nodeId.startsWith("grid-dot-"))).toHaveLength(MAX_GRID_OVERLAY_DOTS);
    expect(lineCount).toBe(0);
  });

  it("ignores non-finite positions defensively (fail closed)", () => {
    const dirty: DrawOverlayPacket = {
      grid: {
        mode: "lines",
        level: 0,
        minorStep: 8,
        majorStep: 40,
        lines: [
          { axis: "x", position: Number.NaN, weight: "minor" },
          { axis: "x", position: Number.POSITIVE_INFINITY, weight: "minor" },
        ],
        axes: [{ axis: "y", position: Number.NaN , weight: "major" }],
      },
      guides: [{ id: "dirty-guide", axis: "x", position: Number.NaN, visible: true }],
    };
    expect(buildGridOverlayCommands(frameWith(dirty))).toMatchObject({ commands: [], lineCount: 0, dotCount: 0 });
  });
});

describe("grid overlay draw-count measurements at the 10k-rect fixture viewport", () => {
  const fixtureViewport = (zoom: number): RenderFrame["viewport"] => ({ panX: 0, panY: 0, zoom, width: 1_000, height: 800, pixelRatio: 1 });

  const tickList = (limit: number, step: number, axis: "x" | "y"): Array<{ axis: "x" | "y"; position: number; weight: "minor" | "major" }> => {
    const list: Array<{ axis: "x" | "y"; position: number; weight: "minor" | "major" }> = [];
    for (let k = 0; k * step <= limit; k += 1) list.push({ axis, position: k * step, weight: k % 5 === 0 ? "major" : "minor" });
    return list;
  };

  // Contract-shaped packet: kernel plans keep tick spacing in [6, 32] screen px
  // at every zoom (8 px nominal), so minorStep = 8 / zoom keeps the packet
  // inside the density contract while the visible world range shrinks.
  const contractPacket = (zoom: number): DrawOverlayPacket => {
    const minorStep = 8 / zoom;
    const xLines = tickList(1_000 / zoom, minorStep, "x");
    const yLines = tickList(800 / zoom, minorStep, "y");
    return {
      grid: {
        mode: "lines",
        level: 0,
        minorStep,
        majorStep: minorStep * 5,
        lines: [...xLines, ...yLines],
        axes: [
          { axis: "x", position: 0 , weight: "major" },
          { axis: "y", position: 0 , weight: "major" },
        ],
      },
    };
  };

  const measureAt = (zoom: number): { lineCount: number; dotCount: number; capped: boolean } =>
    buildGridOverlayCommands(frameWith(contractPacket(zoom), { viewport: fixtureViewport(zoom) }));

  it("stays within the overlay line budget at every zoom level and is deterministic", () => {
    for (const zoom of [0.5, 1, 2, 4, 8, 16, 32]) {
      const measurement = measureAt(zoom);
      expect(measurement.capped).toBe(false);
      expect(measurement.lineCount).toBeLessThanOrEqual(MAX_GRID_OVERLAY_LINES);
      expect(measurement.dotCount).toBe(0);
      expect(measureAt(zoom)).toEqual(measurement);
    }
  });

  it("records the measured overlay draw counts at the 10k-rect fixture zoom levels", () => {
    // The LOD ladder owns every zoom — no pixel grid at any level. The
    // fixture's contract shape (minorStep = 8 / zoom ticks over the 1000×800
    // world) produces 126 + 101 lines plus the two origin axes at every
    // zoom: 229 — the LOD keeps the same screen density at all levels.
    expect(measureAt(0.5).lineCount).toBe(229);
    expect(measureAt(1).lineCount).toBe(229);
    expect(measureAt(2).lineCount).toBe(229);
    expect(measureAt(4).lineCount).toBe(229);
    expect(measureAt(8).lineCount).toBe(229);
    expect(measureAt(16).lineCount).toBe(229);
    expect(measureAt(32).lineCount).toBe(229);
  });

  it("caps dots at the 10k fixture viewport before any dot budget is exhausted", () => {
    expect(MAX_GRID_OVERLAY_DOTS).toBeGreaterThanOrEqual(2_000);
  });
});
