import type { CanvasEditor } from "./harness.js";

export interface AutosaveOptions {
  /** Quiet window after the last document change before a save fires. */
  debounceMs?: number;
  save: () => Promise<void> | void;
}

export interface AutosaveHandle {
  dispose: () => void;
}

/**
 * Debounced document autosave. Subscribes to the editor and fires `save()`
 * after `debounceMs` of quiet following the last document change, so an edit
 * burst collapses to one save.
 *
 * The document's own revision counter (`documentRevision`) — not the editor's
 * emit channel — is the dirty signal: the harness emits for camera moves,
 * selection and draft geometry too, and those must never schedule a save.
 * The baseline advances when a save fires and when the document changes, so
 * a camera-only emit after a save stays silent.
 *
 * Manual saves run outside this module and are unaffected: they never wait
 * on the debounce, and they never reset it.
 */
export const createAutosave = (editor: CanvasEditor, options: AutosaveOptions): AutosaveHandle => {
  const debounceMs = options.debounceMs ?? 800;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastDocumentRevision = editor.getSnapshot().documentRevision;

  const onChange = (): void => {
    const current = editor.getSnapshot().documentRevision;
    if (current === lastDocumentRevision) return;
    lastDocumentRevision = current;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      lastDocumentRevision = editor.getSnapshot().documentRevision;
      void options.save();
    }, debounceMs);
  };

  const unsubscribe = editor.subscribe(onChange);

  return {
    dispose(): void {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      unsubscribe();
    }
  };
};
