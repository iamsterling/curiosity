"use client";

import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";
import { Button } from "../primitives/button.js";
import { useEditorSelector } from "../editor/editor-context.js";
import { selectZoom } from "./selectors.js";

/**
 * The menu trigger: the current zoom percentage. The width is fixed (not
 * content-sized) so the surrounding chrome — the inspector header it lives
 * in — never resizes as the digits change.
 */
const EditorZoomTrigger = forwardRef<
  HTMLButtonElement,
  HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const zoom = useEditorSelector(selectZoom);
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className={cn("tabular-nums w-16", className)}
      {...props}
    >
      {Math.round(zoom * 100)}%
    </Button>
  );
});
EditorZoomTrigger.displayName = "EditorZoomTrigger";

export { EditorZoomTrigger };
