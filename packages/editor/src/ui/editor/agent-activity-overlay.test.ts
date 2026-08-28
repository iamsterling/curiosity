import { describe, expect, it } from "vitest";
import { composeAgentActivityOverlay } from "./agent-activity-overlay.js";

describe("agent activity overlay", () => {
  const layers = [
    {
      id: "frame-1",
      name: "Frame",
      type: "frame" as const,
      bounds: { x: 10, y: 20, width: 100, height: 60 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      fill: "#000000",
      stroke: "none",
      opacity: 1,
      cornerRadius: 0,
      visible: true,
      zIndex: 0,
    },
  ];

  it("resolves stable node ids to generic edge commands", () => {
    const commands = composeAgentActivityOverlay(
      layers,
      [{ operationId: "op-1", nodeIds: ["frame-1"], phase: "previewing", intensity: 1, seed: 1 }],
      100,
    );

    expect(commands).toHaveLength(4);
    expect(commands[0]?.nodeId).toBe("agent:op-1:frame-1:top");
    expect(commands[0]?.bounds).toEqual({ x: 7, y: 17, width: 106, height: 1.188 });
  });

  it("ignores unknown nodes and caps active operations", () => {
    const commands = composeAgentActivityOverlay(
      layers,
      Array.from({ length: 10 }, (_, index) => ({
        operationId: `op-${index}`,
        nodeIds: ["unknown"],
        phase: "thinking" as const,
        intensity: 1,
        seed: index,
      })),
      100,
    );

    expect(commands).toEqual([]);
  });
});
