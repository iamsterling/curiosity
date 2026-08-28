"use client";

import {
  useCallback,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDown,
  ArrowUp,
  Clipboard,
  Copy,
  CopyPlus,
  Trash2,
} from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../primitives/context-menu.js";
import { useEditor, useEditorSelector } from "../editor/editor-context.js";
import { useEditorChrome } from "../editor/chrome.js";
import type { EditorProjection, Point } from "../editor/harness.js";
import type { Layer } from "@crafty/scene-model";

/**
 * The canvas element context menu (the design-tool standard): right-click
 * selects the node under the cursor — the harness's `handleContextMenu` — and
 * every item dispatches the same kernel command the keyboard and panels use.
 * The menu itself is chrome: it reads the selection from the projection and
 * wires the shadcn primitives to editor actions, nothing more.
 */

const selectSelectedIds = (projection: EditorProjection): readonly string[] =>
  projection.selectedIds;

/** "s" for a single selection, "g" when any selected layer is a group (its
 *  scene layer has children), "m" for multi — the menu's enabled states. */
const selectSelectionShape = (projection: EditorProjection): string => {
  const ids = projection.selectedIds;
  if (ids.length === 0) return "";
  if (ids.length > 1) return "m";
  const selected = new Set(ids);
  const walk = (layers: readonly Layer[]): boolean => {
    for (const layer of layers) {
      if (selected.has(layer.id)) {
        if (layer.children && layer.children.length > 0) return true;
      }
      if (layer.children && walk(layer.children)) return true;
    }
    return false;
  };
  return walk(
    projection.scene.frames.find((frame) => frame.id === projection.frame?.id)
      ?.layers ?? [],
  )
    ? "g"
    : "s";
};

export function CanvasContextMenu({ children }: { children: ReactNode }) {
  const editor = useEditor();
  const { pasteArmedRef } = useEditorChrome();
  const selectedIds = useEditorSelector(selectSelectedIds);
  const shape = useEditorSelector(selectSelectionShape);
  const hasSelection = selectedIds.length > 0;
  const multi = selectedIds.length > 1;
  const [point, setPoint] = useState<Point | undefined>(undefined);

  const onContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLElement>): void => {
      const rect = event.currentTarget.getBoundingClientRect();
      const at = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      setPoint(at);
      editor.handleContextMenu(at);
    },
    [editor],
  );

  const paste = useCallback((): void => {
    if (!point) return;
    const at = point;
    // The keyboard's paste contract: the OS clipboard wins, the armed flow
    // keeps the preview honest. The menu pastes at the right-click point.
    pasteArmedRef.current = true;
    editor.previewPaste(at);
    void editor.readOsClipboard().then((content) => {
      if (content) editor.setClipboard(content);
      if (pasteArmedRef.current) {
        editor.pasteAt(at);
        pasteArmedRef.current = false;
      }
    });
  }, [editor, pasteArmedRef, point]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild onContextMenu={onContextMenu}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-60">
        <ContextMenuItem
          onSelect={() => editor.copySelection()}
          disabled={!hasSelection}
        >
          <Copy aria-hidden="true" className="size-4" />
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={paste}>
          <Clipboard aria-hidden="true" className="size-4" />
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => editor.duplicate()}
          disabled={!hasSelection}
        >
          <CopyPlus aria-hidden="true" className="size-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => editor.deleteSelection()}
          disabled={!hasSelection}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Delete
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={() => editor.reorder(1)}
          disabled={!hasSelection}
        >
          <ArrowUp aria-hidden="true" className="size-4" />
          Bring forward
          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => editor.reorder(-1)}
          disabled={!hasSelection}
        >
          <ArrowDown aria-hidden="true" className="size-4" />
          Send backward
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={!multi}>Align</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onSelect={() => editor.alignSelection("left")}>
              <AlignStartHorizontal aria-hidden="true" className="size-4" />
              Left
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.alignSelection("centerX")}>
              <AlignCenterHorizontal aria-hidden="true" className="size-4" />
              Horizontal centers
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.alignSelection("right")}>
              <AlignEndHorizontal aria-hidden="true" className="size-4" />
              Right
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => editor.alignSelection("top")}>
              <AlignStartVertical aria-hidden="true" className="size-4" />
              Top
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.alignSelection("centerY")}>
              <AlignCenterVertical aria-hidden="true" className="size-4" />
              Vertical centers
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.alignSelection("bottom")}>
              <AlignEndVertical aria-hidden="true" className="size-4" />
              Bottom
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem
          onSelect={() => editor.groupSelection()}
          disabled={!hasSelection}
        >
          Group
          <ContextMenuShortcut>⌘G</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => editor.ungroupSelection()}
          disabled={shape !== "g"}
        >
          Ungroup
          <ContextMenuShortcut>⌘⇧G</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={!multi}>Booleans</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onSelect={() => editor.booleanOperate("union")}>
              Union
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.booleanOperate("subtract")}>
              Subtract
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.booleanOperate("intersect")}>
              Intersect
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.booleanOperate("exclude")}>
              Exclude
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
