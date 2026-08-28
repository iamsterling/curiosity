"use client";

import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";
import { Kbd } from "../primitives/kbd.js";
import { useEditorSelector } from "../editor/editor-context.js";
import { TOOL_LABELS, TOOL_SHORTCUTS } from "../editor/tool-shortcuts.js";
import { selectTool } from "./selectors.js";

/**
 * The current-tool pill: the active tool's name and its shortcut key, read
 * from the kernel projection. Composed beside or above the tool group — the
 * layout decides where — so the active tool is always legible at a glance.
 */
const EditorActiveToolPill = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const tool = useEditorSelector(selectTool);
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-full h-9 px-3.5 text-xs font-medium border border-border bg-card text-foreground",
        className,
      )}
      {...props}
    >
      <span className="text-foreground">{TOOL_LABELS[tool]}</span>
      <Kbd size="sm">{TOOL_SHORTCUTS[tool]}</Kbd>
    </div>
  );
});
EditorActiveToolPill.displayName = "EditorActiveToolPill";

export { EditorActiveToolPill };
