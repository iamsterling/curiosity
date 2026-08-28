"use client";

import { forwardRef, type ReactNode } from "react";

import type { EditorTool } from "../../kernel/index.js";
import { ToggleGroup } from "../primitives/toggle-group.js";
import { useEditor, useEditorSelector } from "../editor/editor-context.js";
import { selectTool } from "./selectors.js";

/**
 * The state-bound single-select group for tools. It exists only because the
 * toggle group needs the kernel's `interaction.tool` as its controlled value,
 * and the layout that composes it is a Server Component. It arranges nothing:
 * children are `EditorToolButton`s, and the caller decides which tools exist
 * and their order.
 */
const EditorToolToggleGroup = forwardRef<
  HTMLDivElement,
  { className?: string; children: ReactNode; "aria-label": string }
>(({ className, children, "aria-label": ariaLabel }, ref) => {
  const editor = useEditor();
  const activeTool = useEditorSelector(selectTool);
  return (
    <ToggleGroup
      ref={ref}
      type="single"
      size="sm"
      aria-label={ariaLabel}
      value={activeTool}
      onValueChange={(value) => {
        if (value) editor.setTool(value as EditorTool);
      }}
      className={className}
    >
      {children}
    </ToggleGroup>
  );
});
EditorToolToggleGroup.displayName = "EditorToolToggleGroup";

export { EditorToolToggleGroup };
