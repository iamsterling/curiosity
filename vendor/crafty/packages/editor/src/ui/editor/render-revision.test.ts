import { describe, expect, it } from "vitest";
import { createSeedScene } from "@crafty/scene-model";
import { migrateDocument, sceneToEditorDocument, type EditorDocument } from "../../kernel/index.js";
import { committedPacketRevisionAfterRender } from "./canvas-stage.js";
import { CanvasEditor } from "./harness.js";

/**
 * The renderer discards any packet whose document revision is not the one the
 * caller asked for. That guard is only meaningful if the revision stamped on
 * the projected scene comes from the same counter the canvas passes down.
 *
 * It did not. The projection carried the PERSISTENCE revision, which only moves
 * on save, while the canvas passed the kernel's documentRevision, which moves on
 * every command — so every frame after the first edit was thrown away and the
 * canvas stopped updating.
 */
describe("projected scene revision", () => {
  const seedDocument = (): EditorDocument => {
    const migrated = migrateDocument(sceneToEditorDocument(createSeedScene()));
    if (!migrated.ok || !migrated.document) throw new Error("seed scene failed to migrate");
    return migrated.document;
  };

  const seeded = () => new CanvasEditor(seedDocument(), 0, { storyId: "story-default" });

  const mutate = (editor: CanvasEditor): void => {
    const projection = editor.getSnapshot();
    const target = projection.frame?.layers[0]?.id;
    if (!target) throw new Error("The seed scene is expected to have a layer to select.");
    editor.setSelection([target]);
    editor.duplicate();
  };

  it("matches the kernel document revision before any edit", () => {
    const projection = seeded().getSnapshot();
    expect(projection.scene.revision).toBe(projection.documentRevision);
  });

  it("still matches after an edit", () => {
    const editor = seeded();
    mutate(editor);
    const projection = editor.getSnapshot();
    expect(projection.documentRevision).toBeGreaterThan(0);
    expect(projection.scene.revision).toBe(projection.documentRevision);
  });

  it("still matches after several edits and an undo", () => {
    const editor = seeded();
    mutate(editor);
    mutate(editor);
    editor.undo();
    const projection = editor.getSnapshot();
    expect(projection.scene.revision).toBe(projection.documentRevision);
  });

  it("matches for a document loaded at a non-zero persistence revision", () => {
    // The worst case: a saved file opened fresh. Before the fix the very first
    // frame mismatched, so nothing ever rendered at all.
    const editor = new CanvasEditor(seedDocument(), 42, { storyId: "story-default" });
    const projection = editor.getSnapshot();
    expect(projection.scene.revision).toBe(projection.documentRevision);
    mutate(editor);
    const next = editor.getSnapshot();
    expect(next.scene.revision).toBe(next.documentRevision);
  });

  it("keeps the persistence revision on the save snapshot", () => {
    // The save path checks the snapshot's revision against the store's
    // expected revision, so this one must NOT follow the kernel counter.
    const editor = new CanvasEditor(seedDocument(), 42, { storyId: "story-default" });
    mutate(editor);
    const snapshot = editor.snapshotForSave();
    expect(snapshot.revision).toBe(42);
    expect(snapshot.document).toBeDefined();
    expect(editor.getSnapshot().documentRevision).not.toBe(42);
  });
});

describe("render packet revision submission cursor", () => {
  it("does not consume a packet revision when the canvas is not ready", () => {
    expect(
      committedPacketRevisionAfterRender(7, 8, {
        ok: false,
        diagnostics: [
          {
            code: "CANVAS_NOT_READY",
            message: "WASM is waiting for the canvas layout before rendering.",
          },
        ],
      }),
    ).toBe(7);
  });

  it("commits the attempted packet revision only after accepted renderer processing", () => {
    expect(
      committedPacketRevisionAfterRender(7, 8, { ok: true, diagnostics: [] }),
    ).toBe(8);
    for (const code of [
      "STALE_REVISION",
      "WEBGPU_DEVICE_LOST",
      "VELLO_RENDER_FAILED",
    ] as const) {
      expect(
        committedPacketRevisionAfterRender(8, 9, {
          ok: false,
          diagnostics: [
            {
              code,
              message: "The frame was not accepted.",
            },
          ],
        }),
      ).toBe(8);
    }
  });
});
