"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { Redo2, Undo2 } from "lucide-react";

import { cn } from "../lib/cn.js";
import { Button } from "../primitives/button.js";
import { useEditor, useEditorSelector } from "../editor/editor-context.js";
import { selectHistory } from "./selectors.js";

/** Undo / redo, disabled when the respective stack is empty. */
const EditorHistoryActions = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const editor = useEditor();
  const history = useEditorSelector(selectHistory);
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Undo (Cmd/Ctrl+Z)"
        title="Undo"
        onClick={() => editor.undo()}
        disabled={history[0] === "0"}
      >
        <Undo2 aria-hidden="true" size={15} />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Redo (Cmd/Ctrl+Shift+Z)"
        title="Redo"
        onClick={() => editor.redo()}
        disabled={history[1] === "0"}
      >
        <Redo2 aria-hidden="true" size={15} />
      </Button>
    </div>
  );
});
EditorHistoryActions.displayName = "EditorHistoryActions";

export { EditorHistoryActions };
