"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { ZoomOut } from "lucide-react";

import { Button } from "../primitives/button.js";
import { useEditor } from "../editor/editor-context.js";
import { canvasCenter } from "./canvas-center.js";

/** Zoom out one step — the left flank of the zoom button group. */
const EditorZoomOutButton = forwardRef<
  HTMLButtonElement,
  HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const editor = useEditor();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon-sm"
      aria-label="Zoom out (Cmd/Ctrl+−)"
      title="Zoom out (Cmd/Ctrl+−)"
      onClick={() => editor.zoomBy(0.8, canvasCenter())}
      className={className}
      {...props}
    >
      <ZoomOut aria-hidden="true" size={15} />
    </Button>
  );
});
EditorZoomOutButton.displayName = "EditorZoomOutButton";

export { EditorZoomOutButton };
