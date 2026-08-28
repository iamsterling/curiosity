"use client";

import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  CaseSensitive,
  CopyPlus,
  Hand,
  Layers,
  Minus,
  MousePointer2,
  PenTool,
  Plus,
  Search,
  Square,
  Circle,
  Slash,
  Frame as FrameIcon,
  Undo2,
  Redo2,
  Shapes,
  Scan,
  Crosshair,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "../primitives/command.js";
import { useEditor, useEditorSelector } from "../editor/editor-context.js";
import type { EditorProjection } from "../editor/harness.js";
import { canvasCenter } from "./canvas-center.js";
import { selectHasSelection } from "./selectors.js";

/**
 * The ⌘K palette: the discovery mechanism that teaches the shortcuts (the
 * Figma quick-actions pattern). Every item dispatches the same kernel
 * command the toolbar, keyboard and context menu use — the palette is chrome
 * over the existing editor surface, nothing more. It opens with ⌘K (the
 * keyboard binding owns the trigger; the component owns the dialog).
 */
const selectMultiSelection = (projection: EditorProjection): boolean =>
  projection.selectedIds.length > 1;
const selectCanUndo = (projection: EditorProjection): boolean =>
  projection.canUndo;
const selectCanRedo = (projection: EditorProjection): boolean =>
  projection.canRedo;

export function EditorCommandPalette({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const editor = useEditor();
  const hasSelection = useEditorSelector(selectHasSelection);
  const multi = useEditorSelector(selectMultiSelection);
  const canUndo = useEditorSelector(selectCanUndo);
  const canRedo = useEditorSelector(selectCanRedo);

  const run = (action: () => void): void => {
    action();
    onOpenChange?.(false);
  };

  return (
    <CommandDialog
      open={open ?? false}
      onOpenChange={(next) => onOpenChange?.(next)}
    >
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Tools">
          <CommandItem onSelect={() => run(() => editor.setTool("select"))}>
            <MousePointer2 aria-hidden="true" className="size-4" />
            Select
            <CommandShortcut>V</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.setTool("rectangle"))}>
            <Square aria-hidden="true" className="size-4" />
            Rectangle
            <CommandShortcut>R</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.setTool("ellipse"))}>
            <Circle aria-hidden="true" className="size-4" />
            Ellipse
            <CommandShortcut>O</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.setTool("line"))}>
            <Slash aria-hidden="true" className="size-4" />
            Line
            <CommandShortcut>L</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.setTool("frame"))}>
            <FrameIcon aria-hidden="true" className="size-4" />
            Frame
            <CommandShortcut>F</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.setTool("hand"))}>
            <Hand aria-hidden="true" className="size-4" />
            Hand
            <CommandShortcut>H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.setTool("pen"))}>
            <PenTool aria-hidden="true" className="size-4" />
            Pen
            <CommandShortcut>P</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Canvas">
          <CommandItem onSelect={() => run(() => editor.zoomToFit())}>
            <Scan aria-hidden="true" className="size-4" />
            Zoom to fit
            <CommandShortcut>⇧1</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => editor.zoomToSelection())}
            disabled={!hasSelection}
          >
            <Crosshair aria-hidden="true" className="size-4" />
            Zoom to selection
            <CommandShortcut>⇧2</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.setZoom(1, canvasCenter()))}>
            <Search aria-hidden="true" className="size-4" />
            Zoom to 100%
            <CommandShortcut>⌘0</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.selectAll())}>
            <Layers aria-hidden="true" className="size-4" />
            Select all layers
            <CommandShortcut>⌘A</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Edit">
          <CommandItem onSelect={() => run(() => editor.undo())} disabled={!canUndo}>
            <Undo2 aria-hidden="true" className="size-4" />
            Undo
            <CommandShortcut>⌘Z</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.redo())} disabled={!canRedo}>
            <Redo2 aria-hidden="true" className="size-4" />
            Redo
            <CommandShortcut>⇧⌘Z</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.duplicateSmart())} disabled={!hasSelection}>
            <CopyPlus aria-hidden="true" className="size-4" />
            Duplicate
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.groupSelection())} disabled={!hasSelection}>
            <Shapes aria-hidden="true" className="size-4" />
            Group selection
            <CommandShortcut>⌘G</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.ungroupSelection())} disabled={!hasSelection}>
            <CaseSensitive aria-hidden="true" className="size-4" />
            Ungroup selection
            <CommandShortcut>⇧⌘G</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Arrange">
          <CommandItem onSelect={() => run(() => editor.alignSelection("left"))} disabled={!multi}>
            <AlignHorizontalJustifyStart aria-hidden="true" className="size-4" />
            Align left
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.alignSelection("centerX"))} disabled={!multi}>
            <AlignHorizontalJustifyCenter aria-hidden="true" className="size-4" />
            Align horizontal centers
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.alignSelection("right"))} disabled={!multi}>
            <AlignHorizontalJustifyEnd aria-hidden="true" className="size-4" />
            Align right
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.alignSelection("top"))} disabled={!multi}>
            <AlignVerticalJustifyStart aria-hidden="true" className="size-4" />
            Align top
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.alignSelection("centerY"))} disabled={!multi}>
            <AlignVerticalJustifyCenter aria-hidden="true" className="size-4" />
            Align vertical centers
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.alignSelection("bottom"))} disabled={!multi}>
            <AlignVerticalJustifyEnd aria-hidden="true" className="size-4" />
            Align bottom
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.reorder(1))} disabled={!hasSelection}>
            <Plus aria-hidden="true" className="size-4" />
            Bring forward
            <CommandShortcut>⌘]</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => editor.reorder(-1))} disabled={!hasSelection}>
            <Minus aria-hidden="true" className="size-4" />
            Send backward
            <CommandShortcut>⌘[</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
