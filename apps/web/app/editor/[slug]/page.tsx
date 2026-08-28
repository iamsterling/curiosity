import { CanvasContextMenu, KeyboardBindings } from "@crafty/editor/ui";
import { CanvasStageWithRuntime } from "./canvas-stage-with-runtime";

export default function CraftCanvasPage() {
  return (
    <>
      <KeyboardBindings />
      <CanvasContextMenu>
        <CanvasStageWithRuntime />
      </CanvasContextMenu>
    </>
  );
}
