import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSeedScene } from "@crafty/scene-model";
import { migrateDocument, sceneToEditorDocument, type EditorDocument } from "../../kernel/index.js";
import { createAutosave } from "./autosave.js";
import { CanvasEditor } from "./harness.js";

const seedDocument = (): EditorDocument => {
  const migrated = migrateDocument(sceneToEditorDocument(createSeedScene()));
  if (!migrated.ok || !migrated.document) throw new Error("seed scene failed to migrate");
  return migrated.document;
};

const edit = (editor: CanvasEditor, label: number): void => {
  editor.dispatch({ type: "set-page-name", pageId: "page-frame-home", name: `Edited ${label}` });
};

const cameraMove = (editor: CanvasEditor): void => editor.scrollPan(30, -20);

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe("createAutosave", () => {
  it("collapses an edit burst into one save after the debounce window", () => {
    const editor = new CanvasEditor(seedDocument(), 0);
    const save = vi.fn(async () => {});
    const { dispose } = createAutosave(editor, { save });
    for (let i = 0; i < 5; i += 1) {
      edit(editor, i);
      vi.advanceTimersByTime(50);
    }
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(749);
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2000);
    expect(save).toHaveBeenCalledTimes(1);
    dispose();
  });

  it("saves once when a camera settles, never for live emits or selection", () => {
    const editor = new CanvasEditor(seedDocument(), 0);
    const save = vi.fn(async () => {});
    const { dispose } = createAutosave(editor, { save });
    cameraMove(editor);
    editor.setSelection(["layer-card"]);
    vi.advanceTimersByTime(2000);
    // The settled camera persists the page's rest camera — one authored
    // write, one save; the selection emit saves nothing.
    expect(save).toHaveBeenCalledTimes(1);
    dispose();
  });

  it("leaves manual saves unaffected and stays quiet after a save", () => {
    const editor = new CanvasEditor(seedDocument(), 0);
    const save = vi.fn(async () => {});
    const { dispose } = createAutosave(editor, { save });
    edit(editor, 1);
    vi.advanceTimersByTime(100);
    // The chrome's manual save runs immediately, outside the debounce.
    const manual = editor.snapshotForSave();
    editor.confirmSaved(manual.revision + 1);
    expect(editor.getSnapshot().revision).toBe(1);
    // The pending autosave for the edit still fires exactly once.
    vi.advanceTimersByTime(700);
    expect(save).toHaveBeenCalledTimes(1);
    // After a save, a camera settle still persists the rest camera once.
    cameraMove(editor);
    vi.advanceTimersByTime(2000);
    expect(save).toHaveBeenCalledTimes(2);
    dispose();
  });

  it("fires again for a new edit after a completed save", () => {
    const editor = new CanvasEditor(seedDocument(), 0);
    const save = vi.fn(async () => {});
    const { dispose } = createAutosave(editor, { save });
    edit(editor, 1);
    vi.advanceTimersByTime(800);
    expect(save).toHaveBeenCalledTimes(1);
    edit(editor, 2);
    vi.advanceTimersByTime(800);
    expect(save).toHaveBeenCalledTimes(2);
    dispose();
  });

  it("dispose cancels the pending save", () => {
    const editor = new CanvasEditor(seedDocument(), 0);
    const save = vi.fn(async () => {});
    const { dispose } = createAutosave(editor, { save });
    edit(editor, 1);
    dispose();
    vi.advanceTimersByTime(2000);
    expect(save).not.toHaveBeenCalled();
  });
});
