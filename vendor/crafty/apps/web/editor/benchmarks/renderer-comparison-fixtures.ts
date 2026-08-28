import type { DrawCommand, RenderFrame } from "@crafty/scene-renderer";

export const RENDERER_BUDGETS_MS = {
  tenThousandRectangles: 50,
  thousandNodeChangedBatch: 16,
} as const;

const commandAt = (index: number): DrawCommand => ({
  geometry: "rect",
  nodeId: `rect-${index.toString().padStart(5, "0")}`,
  bounds: {
    x: (index % 125) * 8,
    y: Math.floor(index / 125) * 8,
    width: 6,
    height: 6,
  },
  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  fill: [((index * 17) % 256) / 255, ((index * 31) % 256) / 255, ((index * 47) % 256) / 255, 1],
  opacity: 1,
  zIndex: index,
  order: index,
});

export const createRectangleFrame = (count: number, frameId = `rectangles-${count}`): RenderFrame => ({
  protocolVersion: 1,
  frameId,
  viewport: { panX: 0, panY: 0, zoom: 1, width: 1_000, height: 800, pixelRatio: 1 },
  commands: Array.from({ length: count }, (_, index) => commandAt(index)),
});

export const createComparisonFixtures = () => {
  const representative = createRectangleFrame(12, "representative");
  const translucent: RenderFrame = {
    ...createRectangleFrame(1, "translucent"),
    commands: [{ ...commandAt(0), fill: [0.2, 0.4, 0.6, 0.5], opacity: 0.5 }],
  };
  const tenThousandRectangles = createRectangleFrame(10_000, "ten-thousand-rectangles");
  const thousandNodeChangedBatch: RenderFrame = {
    ...tenThousandRectangles,
    frameId: "thousand-node-changed-batch",
    commands: tenThousandRectangles.commands.slice(4_500, 5_500).map((command, index) => ({
      ...command,
      bounds: { ...command.bounds, x: command.bounds.x + (index % 3) },
    })),
  };
  return { representative, translucent, tenThousandRectangles, thousandNodeChangedBatch };
};
