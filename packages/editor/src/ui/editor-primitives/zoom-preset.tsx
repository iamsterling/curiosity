"use client";

import { forwardRef } from "react";

import { cn } from "../lib/cn.js";
import { DropdownMenuItem } from "../primitives/dropdown-menu.js";
import { useEditor } from "../editor/editor-context.js";
import { canvasCenter } from "./canvas-center.js";

/** A preset percentage item, e.g. `<EditorZoomPreset value={1} />` → "100%". */
const EditorZoomPreset = forwardRef<
  HTMLDivElement,
  { value: number; className?: string }
>(({ value, className }, ref) => {
  const editor = useEditor();
  return (
    <DropdownMenuItem
      ref={ref}
      className={cn("justify-between text-xs tabular-nums", className)}
      onSelect={() => editor.setZoom(value, canvasCenter())}
    >
      {value * 100}%
    </DropdownMenuItem>
  );
});
EditorZoomPreset.displayName = "EditorZoomPreset";

export { EditorZoomPreset };
