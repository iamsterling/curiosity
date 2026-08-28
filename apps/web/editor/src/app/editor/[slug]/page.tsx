import { CanvasContextMenu } from "@crafty/editor/ui";
import { KeyboardBindings } from "@crafty/editor/ui";

import { CanvasStageWithRuntime } from "../../../components/editor/canvas-stage-with-runtime";

/**
 * The editor content: the WebGPU stage and the keyboard bindings, composed
 * into the layout's `EditorContent` slot. Both leaves wire themselves from the
 * chrome context — nothing is drilled through a wrapper. The scene is read in
 * the layout; nothing to fetch here. The context menu wraps the stage: a
 * right-click selects the node under the cursor and shows its actions.
 */

export default function EditorPage() {
  return (
    <>
      <KeyboardBindings />
      <CanvasContextMenu>
        <CanvasStageWithRuntime />
      </CanvasContextMenu>
    </>
  );
}
