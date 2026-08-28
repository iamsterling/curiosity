import { describe, expect, it } from "vitest";
import { composeEditingOverlays, composeSelectionOverlay } from "./editing-overlays.js";
import type { EditorProjection, Point } from "./harness.js";

/** The composer reads a small slice of the projection; the fixture covers
 *  that slice. Casts keep the fixture honest without building a whole Scene. */
const projection = (overrides: Partial<EditorProjection>): EditorProjection =>
  ({
    scene: undefined,
    frame: undefined,
    pages: [],
    activePageId: "page-a",
    gridVisible: false,
    selectedId: undefined,
    selectedIds: [],
    viewport: { panX: 0, panY: 0, zoom: 1 },
    draftBounds: undefined,
    revision: 0,
    documentRevision: 0,
    storyId: "story-default",
    canUndo: false,
    canRedo: false,
    interaction: { tool: "pen", phase: "idle", navigation: false },
    pastePreview: undefined,
    pasteDiagnostics: [],
    glassSurfaces: [],
    pathCommands: [],
    selectionBox: undefined,
    selectedPointGrippies: [],
    penSessionWorld: [],
    penPreviewWorld: undefined,
    moveSnapGuides: undefined,
    snapChoices: undefined,
    creationStartSnapChoices: undefined,
    renderRevision: 0,
    ...overrides,
  }) as unknown as EditorProjection;

const point = (x: number, y: number): Point => ({ x, y });

const ids = (commands: ReturnType<typeof composeEditingOverlays>): string[] =>
  commands.map((command) => command.nodeId);

describe("composeEditingOverlays", () => {
  it("keeps corner-radius handles in the selected node's transformed space", () => {
    const commands = composeSelectionOverlay(
      {
        bounds: { x: 0, y: 0, width: 100, height: 80 },
        transform: { a: 1, b: 0, c: 0, d: 1, e: 240, f: 160 },
        cornerRadius: 12,
      },
      1,
      [1, 1, 1, 1],
    );
    const handle = commands.find((command) => command.nodeId === "radius-nw-outer");
    expect(handle?.transform).toEqual({ a: 1, b: 0, c: 0, d: 1, e: 240, f: 160 });
  });

  it("draws the idle pen landing dot before the first click", () => {
    const commands = composeEditingOverlays(projection({ penPreviewWorld: { point: point(40, 50) } }));
    expect(ids(commands)).toContain("pen-pending-point");
    const dot = commands.find((command) => command.nodeId === "pen-pending-point")!;
    // The dot sits at the preview point, screen-constant size.
    expect(dot.bounds.x).toBeCloseTo(40 - 2.5, 5);
    expect(dot.bounds.y).toBeCloseTo(50 - 2.5, 5);
  });

  it("draws the half-way indicator when the anchor snaps onto a path segment", () => {
    const commands = composeEditingOverlays(
      projection({
        penPreviewWorld: {
          point: point(120, 100),
          snap: { kind: "path-segment", midpoint: point(100, 100) },
        },
      }),
    );
    const ring = commands.find((command) => command.nodeId === "pen-midpoint-ring");
    expect(ring).toBeDefined();
    expect(ring!.bounds.x).toBeCloseTo(100 - 3.5, 5);
    expect(ring!.bounds.y).toBeCloseTo(100 - 3.5, 5);
    expect(ids(commands)).toContain("pen-midpoint-core");
  });

  it("gives every session anchor its dot and the accent core only to the active (last) one", () => {
    const commands = composeEditingOverlays(
      projection({
        penSessionWorld: [point(0, 0), point(50, 0), point(50, 50)],
      }),
    );
    const active = commands.filter((command) => command.nodeId.includes("pen-anchor-active"));
    expect(active).toHaveLength(1);
    expect(active[0]!.bounds.x).toBeCloseTo(50 - 1.5, 5);
    expect(active[0]!.bounds.y).toBeCloseTo(50 - 1.5, 5);
    const rings = commands.filter((command) => command.nodeId.startsWith("pen-anchor-ring"));
    expect(rings).toHaveLength(3);
  });

  it("draws the move snap's alignment guides full-bleed across the visible area", () => {
    const commands = composeEditingOverlays(
      projection({
        interaction: { tool: "select", phase: "preview", navigation: false },
        moveSnapGuides: { x: 100, y: 200 },
      }),
      { width: 1000, height: 800 },
    );
    const x = commands.find((command) => command.nodeId === "snap-guide-x");
    const y = commands.find((command) => command.nodeId === "snap-guide-y");
    expect(x).toBeDefined();
    // The x guide spans the visible world y-range at x = 100 (pan 0, zoom 1).
    expect(x!.bounds.y).toBeCloseTo(0, 5);
    expect(x!.bounds.height).toBe(800);
    expect(y!.bounds.x).toBeCloseTo(0, 5);
    expect(y!.bounds.width).toBe(1000);
    expect(y!.bounds.y).toBeCloseTo(200 - 0.625, 5);
  });

  it("lights the exact candidate carried by chosen snap evidence", () => {
    const commands = composeEditingOverlays(
      projection({
        snapChoices: { x: { family: "grid", axis: "x", value: 10, source: "right" } },
      }),
      { width: 100, height: 100 },
    );
    expect(commands.find((command) => command.nodeId === "snap-guide-x")?.bounds.x).toBeCloseTo(10 - 0.625, 5);
  });

  it("lights the exact pointer-down creation target separately", () => {
    const commands = composeEditingOverlays(
      projection({
        creationStartSnapChoices: { y: { family: "guide", axis: "y", value: 24, source: "point" } },
      }),
      { width: 100, height: 100 },
    );
    expect(commands.find((command) => command.nodeId === "snap-start-guide-y")?.bounds.y).toBeCloseTo(24 - 0.625, 5);
  });

  it("omits the snap guides without a viewport size", () => {
    const commands = composeEditingOverlays(
      projection({
        interaction: { tool: "select", phase: "preview", navigation: false },
        moveSnapGuides: { x: 100 },
      }),
    );
    expect(ids(commands)).not.toContain("snap-guide-x");
  });

  it("draws nothing for a non-pen tool with no snap guides", () => {
    const commands = composeEditingOverlays(
      projection({
        interaction: { tool: "select", phase: "idle", navigation: false },
      }),
    );
    expect(commands).toEqual([]);
  });
});
