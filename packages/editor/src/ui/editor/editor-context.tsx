"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { EditorDocument } from "../../kernel/index.js";

import { CanvasEditor, type EditorProjection } from "./harness.js";

/**
 * The kernel lives outside React. This context carries the CanvasEditor
 * instance only — a stable handle, never a state object — so mounting a new
 * subscriber never re-renders existing ones, and a change never re-renders
 * every consumer of the context.
 *
 * Components read state through `useEditorSelector`, which subscribes to the
 * external store and re-renders only when its own slice changes. Nothing in
 * this file drives the canvas: the render loop reads `getSnapshot()` directly
 * (see `canvas-stage.tsx`).
 */

const EditorContext = createContext<CanvasEditor | undefined>(undefined);

/**
 * Boots the editor kernel from the server-read document. `initialConverted`
 * is part of the boot contract (the layout's `readDocument` payload); the
 * chrome provider consumes it through its own prop.
 */
export function EditorProvider({ initialDocument, initialRevision, initialConverted, children }: { initialDocument: EditorDocument; initialRevision: number; initialConverted: boolean; children: ReactNode }) {
  const [editor] = useState(
    () => new CanvasEditor(initialDocument, initialRevision, { devicePixelRatio: typeof window === "undefined" ? 1 : window.devicePixelRatio })
  );
  void initialConverted;
  return <EditorContext.Provider value={editor}>{children}</EditorContext.Provider>;
}

export function useEditor(): CanvasEditor {
  const editor = useContext(EditorContext);
  if (!editor) throw new Error("EDITOR_CONTEXT_MISSING: wrap the tree in <EditorProvider>.");
  return editor;
}

/**
 * Subscribe to one slice of the projection. The selected value is cached per
 * projection identity and compared with `isEqual`, so a pointer move that
 * changes only the draft geometry does not re-render the layers panel.
 *
 * Selectors must be referentially stable (module scope or `useCallback`).
 */
export function useEditorSelector<T>(select: (projection: EditorProjection) => T, isEqual: (left: T, right: T) => boolean = Object.is): T {
  const editor = useEditor();
  const cache = useRef<{ projection: EditorProjection; value: T } | undefined>(undefined);

  const read = useCallback((): T => {
    const projection = editor.getSnapshot();
    const previous = cache.current;
    if (previous && previous.projection === projection) return previous.value;
    const next = select(projection);
    if (previous && isEqual(previous.value, next)) {
      cache.current = { projection, value: previous.value };
      return previous.value;
    }
    cache.current = { projection, value: next };
    return next;
  }, [editor, select, isEqual]);

  const subscribe = useCallback((listener: () => void) => editor.subscribe(listener), [editor]);
  return useSyncExternalStore(subscribe, read, read);
}

export const shallowArrayEqual = <T,>(left: readonly T[], right: readonly T[]): boolean =>
  left.length === right.length && left.every((value, index) => Object.is(value, right[index]));

/** Convenience selectors shared by more than one panel. */
export const useSelectedIds = (): string[] => useEditorSelector(selectSelectedIds, shallowArrayEqual);
export const useActiveTool = () => useEditorSelector(selectActiveTool);

const selectSelectedIds = (projection: EditorProjection): string[] => projection.selectedIds;
const selectActiveTool = (projection: EditorProjection) => projection.interaction.tool;

export function useEditorMemo<T>(select: (projection: EditorProjection) => T, deps: readonly unknown[], isEqual?: (left: T, right: T) => boolean): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stable = useMemo(() => select, deps);
  return useEditorSelector(stable, isEqual);
}
