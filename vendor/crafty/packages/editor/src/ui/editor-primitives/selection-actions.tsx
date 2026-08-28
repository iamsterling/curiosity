"use client";

import {
  forwardRef,
  useEffect,
  useState,
  type HTMLAttributes,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Copy, Trash2 } from "lucide-react";

import { cn } from "../lib/cn.js";
import { Button } from "../primitives/button.js";
import { useEditor, useEditorSelector } from "../editor/editor-context.js";
import { selectHasSelection } from "./selectors.js";
import {
  useOptionalStagePositioning,
  useStagePositioning,
} from "../editor/stage-positioning.js";

/** Duplicate and delete for the current selection. */
export const stopSelectionActionPointerDown = (event: Pick<PointerEvent, "stopPropagation">): void =>
  event.stopPropagation();

const focusStageCanvas = (element: HTMLElement): void => {
  element.closest(".stage")?.querySelector<HTMLCanvasElement>("canvas")?.focus();
};

const EditorSelectionActions = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => {
  const positioning = useOptionalStagePositioning();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !positioning?.host) return null;
  return createPortal(
    <SelectionActionsSurface ref={ref} className={className} style={style} {...props} />,
    positioning.host,
  );
});

const SelectionActionsSurface = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => {
  const editor = useEditor();
  const hasSelection = useEditorSelector(selectHasSelection);
  const positioning = useStagePositioning();
  useEffect(() => {
    const element = positioning.actionElementRef.current;
    if (!element) return;
    const measure = (): void => {
      positioning.actionSizeRef.current = {
        width: element.offsetWidth,
        height: element.offsetHeight,
      };
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasSelection, positioning]);
  if (!hasSelection) return null;
  return (
    <div
      ref={(element) => {
        positioning.registerActionElement(element);
        if (typeof ref === "function") ref(element);
        else if (ref) ref.current = element;
      }}
      className={cn("pointer-events-auto absolute left-0 top-0 z-30 flex items-center gap-1 rounded-full border border-border bg-card/95 p-1 shadow-lg", className)}
      {...props}
      style={{ visibility: "hidden", ...style }}
      role="toolbar"
      aria-label="Selection actions"
      onPointerDown={stopSelectionActionPointerDown}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Duplicate"
        title="Duplicate"
        onClick={() => editor.duplicate()}
      >
        <Copy aria-hidden="true" size={15} />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete (Del)"
        title="Delete"
        onClick={(event) => {
          editor.deleteSelection();
          focusStageCanvas(event.currentTarget);
        }}
      >
        <Trash2 aria-hidden="true" size={15} />
      </Button>
    </div>
  );
});
EditorSelectionActions.displayName = "EditorSelectionActions";
SelectionActionsSurface.displayName = "SelectionActionsSurface";

export { EditorSelectionActions };
