"use client";

import { forwardRef, useState, type HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";
import { useEditor, useEditorSelector } from "../editor/editor-context.js";
import { canvasCenter } from "./canvas-center.js";
import { selectZoom } from "./selectors.js";

/**
 * The typed-zoom entry at the top of the menu: a draft input, committed on
 * Enter or blur, that always reflects the live zoom while not being edited.
 */
const EditorZoomInput = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const editor = useEditor();
  const zoom = useEditorSelector(selectZoom);
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const commit = (): void => {
    const value = Number(draft);
    if (draft !== undefined && Number.isFinite(value) && value > 0) {
      editor.setZoom(value / 100, canvasCenter());
    }
    setDraft(undefined);
  };
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 px-2 py-1.5", className)}
      {...props}
    >
      <span className="flex-1 text-xs text-muted-foreground">Zoom</span>
      <div className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
        <input
          type="number"
          min={0}
          className="w-12 bg-transparent text-right text-xs tabular-nums outline-none"
          value={draft ?? Math.round(zoom * 100)}
          aria-label="Zoom percentage"
          onChange={(event) => setDraft(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
            if (event.key === "Escape") setDraft(undefined);
          }}
        />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );
});
EditorZoomInput.displayName = "EditorZoomInput";

export { EditorZoomInput };
