"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";
import { useEditorChrome } from "../editor/chrome.js";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../primitives/sheet.js";

/**
 * The floating panel surfaces over the canvas. The layout (a Server
 * Component) composes the content — the LayersPanel and InspectorPanel
 * primitives are passed in as `layers` and `inspector` — while this client
 * leaf owns the only client bit: whether each surface is open. Panels render
 * nothing when dismissed, so the canvas is the default focus and the chrome
 * never reflows around them. Positioning and sizing are the layout's job.
 */
const EditorFloatingPanels = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { layers?: ReactNode; inspector?: ReactNode }
>(({ className, layers, inspector, ...props }, ref) => {
  const { openPanels, togglePanel } = useEditorChrome();
  return (
    <div ref={ref} className={cn("pointer-events-none editor-floating-panels", className)} {...props}>
      {openPanels.layers ? layers : null}
      {openPanels.inspector ? inspector : null}
      {layers ? (
        <div className="editor-mobile-structure">
          <Sheet open={openPanels.layers} onOpenChange={(open) => { if (open !== openPanels.layers) togglePanel("layers"); }}>
            <SheetContent side="bottom" className="structure-sheet-content">
              <SheetHeader className="sr-only">
                <SheetTitle>Structure</SheetTitle>
                <SheetDescription>Browse and edit the current page hierarchy.</SheetDescription>
              </SheetHeader>
              {layers}
            </SheetContent>
          </Sheet>
        </div>
      ) : null}
    </div>
  );
});
EditorFloatingPanels.displayName = "EditorFloatingPanels";

export { EditorFloatingPanels };
