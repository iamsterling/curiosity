"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { Layers3, PanelRight } from "lucide-react";

import { cn } from "../lib/cn.js";
import { Button } from "../primitives/button.js";
import { useEditorChrome } from "../editor/chrome.js";

/**
 * The top-bar buttons that open and dismiss the floating layers and inspector
 * surfaces. Each panel consumes its own open state from the chrome context —
 * the toggle and the surface it opens agree without anything being drilled
 * through the shell. Canvas-first: both panels start closed.
 */

const EditorLayersToggle = forwardRef<
  HTMLButtonElement,
  HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { openPanels, togglePanel } = useEditorChrome();
  const open = openPanels.layers;
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      aria-pressed={open}
      aria-label={open ? "Hide layers" : "Show layers"}
      title={open ? "Hide layers" : "Show layers"}
      onClick={() => togglePanel("layers")}
      className={cn(
        "h-8 w-8 rounded-full p-0",
        open && "bg-accent text-accent-foreground",
        className,
      )}
      {...props}
    >
      <Layers3 aria-hidden="true" size={15} />
    </Button>
  );
});
EditorLayersToggle.displayName = "EditorLayersToggle";

const EditorInspectorToggle = forwardRef<
  HTMLButtonElement,
  HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { openPanels, togglePanel } = useEditorChrome();
  const open = openPanels.inspector;
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      aria-pressed={open}
      aria-label={open ? "Hide inspector" : "Show inspector"}
      title={open ? "Hide inspector" : "Show inspector"}
      onClick={() => togglePanel("inspector")}
      className={cn(
        "h-8 w-8 rounded-full p-0",
        open && "bg-accent text-accent-foreground",
        className,
      )}
      {...props}
    >
      <PanelRight aria-hidden="true" size={15} />
    </Button>
  );
});
EditorInspectorToggle.displayName = "EditorInspectorToggle";

export { EditorLayersToggle, EditorInspectorToggle };
