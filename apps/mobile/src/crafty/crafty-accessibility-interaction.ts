import type { EditorKernel } from "@crafty/editor/kernel";
import type { CanvasAccessibilityCommand } from "../../modules/curiosity-canvas";

export const applyCraftyAccessibilityCommand = (
  kernel: EditorKernel,
  nodeId: string,
  command: CanvasAccessibilityCommand,
): boolean => {
  if (!kernel.getDocument().nodes[nodeId]) return false;
  if (command === "activate") {
    kernel.setSelection([nodeId]);
    return true;
  }
  if (!kernel.getState().selectedIds.includes(nodeId)) return false;
  kernel.dispatch(
    {
      delta: { dx: command === "increment" ? 1 : -1, dy: 0 },
      nodeIds: [nodeId],
      type: "move-nodes",
    },
    "Nudge layer",
  );
  return true;
};
