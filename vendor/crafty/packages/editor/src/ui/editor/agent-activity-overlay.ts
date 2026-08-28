import type { Bounds, Layer, Transform2D } from "@crafty/scene-model";
import { transformBounds } from "@crafty/scene-model";
import type { AgentActivity } from "../../kernel/index.js";
import type { DrawCommand } from "@crafty/scene-renderer";

const IDENTITY: Transform2D = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
const MAX_ACTIVITY_OVERLAYS = 8;
const COLORS: Record<AgentActivity["phase"], [number, number, number]> = {
  thinking: [0.34, 0.72, 1],
  previewing: [0.72, 0.42, 1],
  committing: [1, 0.67, 0.24],
  committed: [0.31, 0.95, 0.68],
  "rolled-back": [0.55, 0.6, 0.72],
  failed: [1, 0.3, 0.36],
  expired: [0.55, 0.6, 0.72],
};

const flattenLayers = (
  layers: readonly Layer[],
  output: Map<string, Layer>,
): void => {
  for (const layer of layers) {
    output.set(layer.id, layer);
    if (layer.children) flattenLayers(layer.children, output);
  }
};

const appendEdge = (
  commands: DrawCommand[],
  id: string,
  bounds: Bounds,
  fill: [number, number, number, number],
  order: number,
): void => {
  const thickness = Math.max(1, Math.min(bounds.width, bounds.height) * 0.018);
  commands.push(
    {
      geometry: "rect",
      nodeId: `${id}:top`,
      bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: thickness },
      transform: IDENTITY,
      fill,
      opacity: 1,
      zIndex: Number.MAX_SAFE_INTEGER,
      order,
    },
    {
      geometry: "rect",
      nodeId: `${id}:bottom`,
      bounds: { x: bounds.x, y: bounds.y + bounds.height - thickness, width: bounds.width, height: thickness },
      transform: IDENTITY,
      fill,
      opacity: 1,
      zIndex: Number.MAX_SAFE_INTEGER,
      order: order + 1,
    },
    {
      geometry: "rect",
      nodeId: `${id}:left`,
      bounds: { x: bounds.x, y: bounds.y, width: thickness, height: bounds.height },
      transform: IDENTITY,
      fill,
      opacity: 1,
      zIndex: Number.MAX_SAFE_INTEGER,
      order: order + 2,
    },
    {
      geometry: "rect",
      nodeId: `${id}:right`,
      bounds: { x: bounds.x + bounds.width - thickness, y: bounds.y, width: thickness, height: bounds.height },
      transform: IDENTITY,
      fill,
      opacity: 1,
      zIndex: Number.MAX_SAFE_INTEGER,
      order: order + 3,
    },
  );
};

/** Resolves product activity into generic renderer geometry. */
export const composeAgentActivityOverlay = (
  layers: readonly Layer[],
  activities: readonly AgentActivity[],
  timestamp: number,
): DrawCommand[] => {
  const byId = new Map<string, Layer>();
  flattenLayers(layers, byId);
  const commands: DrawCommand[] = [];
  let order = 0;

  for (const activity of activities.slice(-MAX_ACTIVITY_OVERLAYS)) {
    const [red, green, blue] = COLORS[activity.phase];
    const pulse = 0.55 + Math.sin(timestamp / 260 + activity.seed) * 0.2;
    const alpha = Math.max(0.12, Math.min(0.9, activity.intensity * pulse));
    for (const nodeId of activity.nodeIds) {
      const layer = byId.get(nodeId);
      if (!layer) continue;
      const bounds = transformBounds(layer.bounds, layer.transform);
      const pad = Math.max(3, Math.min(bounds.width, bounds.height) * 0.04);
      appendEdge(
        commands,
        `agent:${activity.operationId}:${nodeId}`,
        {
          x: bounds.x - pad,
          y: bounds.y - pad,
          width: bounds.width + pad * 2,
          height: bounds.height + pad * 2,
        },
        [red, green, blue, alpha],
        order,
      );
      order += 4;
    }
  }
  return commands;
};
