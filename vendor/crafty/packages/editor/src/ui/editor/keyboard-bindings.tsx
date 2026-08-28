"use client";

import { useEffect, useRef, useState } from "react";
import type { EditorTool } from "../../kernel/index.js";

import { useEditor } from "./editor-context.js";
import { useEditorChrome } from "./chrome.js";
import { canvasCenter } from "../editor-primitives/canvas-center.js";
import { TOOL_BY_KEY } from "./tool-shortcuts.js";
import { EditorCommandPalette } from "../editor-primitives/command-palette.js";

/**
 * One place that maps keys to editor commands. Keeping this out of the canvas
 * and the panels is what stops tool behaviour leaking into unrelated handlers
 * (see docs/architecture/input-and-tools.md).
 *
 * Renders nothing.
 */

const isTextEntry = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable);

export function KeyboardBindings() {
  const editor = useEditor();
  const { pasteArmedRef, setStatus: onStatus } = useEditorChrome();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const spaceRef = useRef<{ active: boolean; previousTool: EditorTool }>({
    active: false,
    previousTool: "select",
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const command = event.metaKey || event.ctrlKey;
      const editing = isTextEntry(event.target);

      // ⌘K opens the command palette — the discovery surface for the
      // shortcuts this file binds.
      if (command && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }

      if (command && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) editor.redo();
        else editor.undo();
        return;
      }
      if (command && event.key.toLowerCase() === "y") {
        event.preventDefault();
        editor.redo();
        return;
      }
      if (command && event.key.toLowerCase() === "c") {
        if (editing) return;
        event.preventDefault();
        editor.copySelection();
        onStatus("Copied selection to clipboard");
        return;
      }
      if (command && event.key.toLowerCase() === "v") {
        if (editing) return;
        event.preventDefault();
        if (pasteArmedRef.current) {
          editor.pasteAt();
          pasteArmedRef.current = false;
          return;
        }
        pasteArmedRef.current = true;
        editor.previewPaste();
        void editor.readOsClipboard().then((content) => {
          if (!content) return;
          editor.setClipboard(content);
          if (pasteArmedRef.current) editor.previewPaste();
        });
        return;
      }
      if (
        event.key.toLowerCase() === "v" &&
        pasteArmedRef.current &&
        !editing
      ) {
        editor.pasteAt();
        pasteArmedRef.current = false;
        return;
      }
      if ((event.key === "Backspace" || event.key === "Delete") && !editing) {
        event.preventDefault();
        editor.deleteSelection();
        return;
      }
      if (event.key === "Escape") {
        // An in-progress pen path ends (one history entry); an in-flight
        // gesture cancels; otherwise Esc LADDERS OUT — selecting the parent —
        // and deselects at the top (the hierarchy-traversal half of the
        // grammar, mirrored by Enter/Tab).
        if (editor.hasPenSession()) editor.endPenSession();
        if (editor.getSnapshot().interaction.phase !== "idle") {
          editor.cancelGesture();
        }
        editor.clearPastePreview();
        pasteArmedRef.current = false;
        if (!editor.hasPenSession() && editor.getSnapshot().selectedIds.length > 0) {
          if (editor.selectParent()) {
            event.preventDefault();
            return;
          }
          editor.setSelection([]);
        }
        editor.setTool("select");
        return;
      }
      if (editing) return;
      if (command && (event.key === "=" || event.key === "+")) {
        event.preventDefault();
        editor.zoomBy(1.25, canvasCenter());
        return;
      }
      if (command && (event.key === "-" || event.key === "_")) {
        event.preventDefault();
        editor.zoomBy(0.8, canvasCenter());
        return;
      }
      if (command && event.key === "0") {
        event.preventDefault();
        editor.setZoom(1, canvasCenter());
        return;
      }
      // Camera jumps: ⇧1 zoom-to-fit, ⇧2 zoom-to-selection.
      if (event.shiftKey && event.key === "1") {
        event.preventDefault();
        editor.zoomToFit();
        return;
      }
      if (event.shiftKey && event.key === "2") {
        event.preventDefault();
        editor.zoomToSelection();
        return;
      }
      if (command && event.key.toLowerCase() === "a") {
        event.preventDefault();
        editor.selectAll();
        return;
      }
      if (command && event.key.toLowerCase() === "d") {
        event.preventDefault();
        editor.duplicateSmart();
        return;
      }
      // Nudge: arrows 1px, ⇧-arrows 10px — in WORLD units, never snapped.
      const nudgeStep = event.shiftKey ? 10 : 1;
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          editor.nudgeSelection(-nudgeStep, 0);
          return;
        case "ArrowRight":
          event.preventDefault();
          editor.nudgeSelection(nudgeStep, 0);
          return;
        case "ArrowUp":
          event.preventDefault();
          editor.nudgeSelection(0, -nudgeStep);
          return;
        case "ArrowDown":
          event.preventDefault();
          editor.nudgeSelection(0, nudgeStep);
          return;
      }
      // Hierarchy traversal: Enter steps INTO a container, Tab cycles
      // siblings (Esc ladders out, above).
      if (event.key === "Enter") {
        event.preventDefault();
        editor.selectFirstChild();
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        editor.selectNextSibling();
        return;
      }
      // Number-key opacity: 1–9 → 10–90% (the beloved micro-shortcut).
      if (/^[1-9]$/u.test(event.key) && !command) {
        event.preventDefault();
        editor.setSelectionOpacity(Number(event.key) * 10);
        return;
      }
      // ⇧H / ⇧V flip the selection around its box center.
      if (event.shiftKey && event.key.toLowerCase() === "h") {
        event.preventDefault();
        editor.flip("h");
        return;
      }
      if (event.shiftKey && event.key.toLowerCase() === "v") {
        event.preventDefault();
        editor.flip("v");
        return;
      }
      if (command && event.key.toLowerCase() === "g") {
        if (editing) return;
        event.preventDefault();
        if (event.shiftKey) editor.ungroupSelection();
        else editor.groupSelection();
        return;
      }
      if (command && (event.key === "]" || event.key === "}")) {
        if (editing) return;
        event.preventDefault();
        editor.reorder(1);
        return;
      }
      if (command && (event.key === "[" || event.key === "{")) {
        if (editing) return;
        event.preventDefault();
        editor.reorder(-1);
        return;
      }
      if (command && event.shiftKey && event.key.toLowerCase() === "v") {
        if (editing) return;
        event.preventDefault();
        if (pasteArmedRef.current) {
          editor.pasteInPlace();
          pasteArmedRef.current = false;
          return;
        }
        pasteArmedRef.current = true;
        editor.previewPasteInPlace();
        void editor.readOsClipboard().then((content) => {
          if (!content) return;
          editor.setClipboard(content);
          if (pasteArmedRef.current) editor.previewPasteInPlace();
        });
        return;
      }
      // Tool keys come from the one tool-shortcut map the pills render — a
      // tool can never bind differently in the two places.
      const tool = TOOL_BY_KEY[event.key.toLowerCase()];
      if (tool) {
        editor.setTool(tool);
        return;
      }
      if (event.code === "Space" && !spaceRef.current.active) {
        event.preventDefault();
        spaceRef.current = {
          active: true,
          previousTool: editor.getSnapshot().interaction.tool,
        };
        editor.setTool("hand");
      }
    };

    const onKeyUp = (event: KeyboardEvent): void => {
      if (event.code !== "Space" || !spaceRef.current.active) return;
      const previous = spaceRef.current.previousTool;
      spaceRef.current = { active: false, previousTool: "select" };
      editor.setTool(previous);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [editor, pasteArmedRef, onStatus]);

  return (
    <EditorCommandPalette
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
    />
  );
}
