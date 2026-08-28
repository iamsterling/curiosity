"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { ZoomIn } from "lucide-react";

import { Button } from "../primitives/button.js";
import { useEditor } from "../editor/editor-context.js";
import { canvasCenter } from "./canvas-center.js";

/** Zoom in one step — the right flank of the zoom button group. */
const EditorZoomInButton = forwardRef<
  HTMLButtonElement,
  HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const editor = useEditor();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon-sm"
      aria-label="Zoom in (Cmd/Ctrl++)"
      title="Zoom in (Cmd/Ctrl++)"
      onClick={() => editor.zoomBy(1.25, canvasCenter())}
      className={className}
      {...props}
    >
      <ZoomIn aria-hidden="true" size={15} />
    </Button>
  );
});
EditorZoomInButton.displayName = "EditorZoomInButton";

export { EditorZoomInButton };
