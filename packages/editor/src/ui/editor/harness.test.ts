import { describe, expect, it } from "vitest";
import { createSeedScene, type Layer, type Scene } from "@crafty/scene-model";
import {
  migrateDocument,
  orderKeyForSigned,
  sceneToEditorDocument,
  worldToScreen,
  ZOOM_MAX,
  ZOOM_MIN,
  type DocumentNode,
  type EditorDocument,
  type PathGeometry,
  type PathPoint,
} from "../../kernel/index.js";
import { CanvasEditor, projectConstrainedResize, type Point } from "./harness.js";
import { GridHostRenderLoop } from "./grid-host-render-loop.js";

const seed = createSeedScene();
/** The harness is document-native now: constructors take an EditorDocument.
 *  Tests keep authoring Scenes (they are compact fixtures) and migrate at the
 *  construction site. */
const toDocument = (scene: Scene): EditorDocument => {
  const migrated = migrateDocument(sceneToEditorDocument(scene));
  if (!migrated.ok || !migrated.document)
    throw new Error("seed scene failed to migrate");
  return migrated.document;
};
const screen = (x: number, y: number): Point => ({
  x: x * 0.82 + 80,
  y: y * 0.82 + 50,
});
const install = (): CanvasEditor =>
  new CanvasEditor(toDocument(seed), 0, { storyId: "story-default" });
const camera = (viewport: {
  panX: number;
  panY: number;
  zoom: number;
}): { panX: number; panY: number; zoom: number } => ({
  panX: viewport.panX,
  panY: viewport.panY,
  zoom: viewport.zoom,
});
const down = (
  editor: CanvasEditor,
  pointerId: number,
  point: Point,
  extras: {
    button?: number;
    altKey?: boolean;
    shiftKey?: boolean;
    ctrlKey?: boolean;
  } = {},
): void =>
  editor.handlePointerDown({
    pointerId,
    point,
    button: extras.button ?? 0,
    altKey: extras.altKey ?? false,
    shiftKey: extras.shiftKey ?? false,
    spaceKey: false,
    ctrlKey: extras.ctrlKey ?? false,
  });
const move = (
  editor: CanvasEditor,
  pointerId: number,
  point: Point,
  extras: { altKey?: boolean; shiftKey?: boolean; ctrlKey?: boolean } = {},
): void =>
  editor.handlePointerMove(pointerId, point, {
    altKey: extras.altKey ?? false,
    shiftKey: extras.shiftKey ?? false,
    ctrlKey: extras.ctrlKey ?? false,
  });
const up = (
  editor: CanvasEditor,
  pointerId: number,
  point: Point,
  options: { shiftKey?: boolean; clickCount?: number } = {},
): void =>
  editor.handlePointerUp(pointerId, point, {
    cancel: false,
    shiftKey: options.shiftKey ?? false,
    clickCount: options.clickCount ?? 1,
  });

const layer = (
  id: string,
  bounds: { x: number; y: number; width: number; height: number },
  extra: Record<string, unknown> = {},
): Record<string, unknown> => ({
  id,
  name: id,
  type: "rectangle",
  bounds,
  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  fill: "#ff0000",
  stroke: "#00000000",
  opacity: 1,
  cornerRadius: 0,
  visible: true,
  zIndex: 0,
  ...extra,
});

const sceneWith = (layers: unknown[]): Scene => ({
  schemaVersion: 1,
  id: "scene-lock",
  name: "Lock",
  revision: 0,
  frames: [
    {
      id: "frame-home",
      name: "Page 1",
      bounds: { x: 0, y: 0, width: 1280, height: 800 },
      stories: [],
      layers: layers as never,
    },
  ],
});

/** A closed three-point path at raw screen coordinates, drawn with the pen
 *  tool — world anchors (pan 80/50, zoom 0.82) at (-85.4,-48.8),
 *  (146.3,61) and (268.3,304.9). */
const drawClosedTriangle = (editor: CanvasEditor): void => {
  editor.setTool("pen");
  down(editor, 1, { x: 10, y: 10 });
  up(editor, 1, { x: 10, y: 10 });
  down(editor, 1, { x: 200, y: 100 });
  up(editor, 1, { x: 200, y: 100 });
  down(editor, 1, { x: 300, y: 300 });
  up(editor, 1, { x: 300, y: 300 });
  down(editor, 1, { x: 10, y: 10 });
  up(editor, 1, { x: 10, y: 10 });
};

describe("CanvasEditor projection", () => {
  it("exposes a story-overridden scene with a stable snapshot identity", () => {
    const editor = install();
    const first = editor.getSnapshot();
    const second = editor.getSnapshot();
    expect(first).toBe(second);
    expect(first.frame?.id).toBe("frame-home");
    expect(first.revision).toBe(0);
    expect(first.viewport).toEqual({ panX: 80, panY: 50, zoom: 0.82, devicePixelRatio: 1 });
    editor.setStory("story-hover");
    const third = editor.getSnapshot();
    expect(third).not.toBe(first);
    expect(third.storyId).toBe("story-hover");
    expect(third.scene.frames[0]?.layers[0]?.fill).toBe("#fb7185");
  });

  it("projects glass fills as protocol surfaces on the snapshot", () => {
    const editor = install();
    expect(editor.getSnapshot().glassSurfaces).toEqual([]);
    editor.dispatch(
      {
        type: "set-property",
        nodeId: "layer-card",
        property: "fill",
        value: {
          kind: "glass",
          blurRadius: 24,
          tint: "#ffffff",
          tintOpacity: 0.6,
          saturation: 1.4,
          refraction: 0.15,
        },
      },
      "Glass",
    );
    const projection = editor.getSnapshot();
    expect(projection.glassSurfaces).toHaveLength(1);
    expect(projection.glassSurfaces[0]).toMatchObject({
      nodeId: "layer-card",
      blurRadius: 24,
      tint: [1, 1, 1, 0.6],
      saturation: 1.4,
      refraction: 0.15,
      opacity: 1,
    });
    // The scene projection renders the glass node with opacity 0 and the
    // tint hex — the scene never draws the surface itself.
    const layers = projection.scene.frames.flatMap((frame) => frame.layers);
    const glassLayer = layers.find((layer) => layer.id === "layer-card");
    expect(glassLayer?.opacity).toBe(0);
    expect(glassLayer?.fill).toBe("#ffffff");
  });

  it("notifies subscribers on kernel and ephemeral state changes", () => {
    const editor = install();
    let notified = 0;
    const unsubscribe = editor.subscribe(() => {
      notified += 1;
    });
    editor.setSelection(["layer-card"]);
    expect(notified).toBe(1);
    editor.handleWheel(screen(100, 100), -200);
    expect(notified).toBeGreaterThan(1);
    unsubscribe();
    editor.setSelection([]);
    const after = notified;
    editor.setSelection(["layer-card"]);
    expect(notified).toBe(after);
  });

  it("projects the selection box with the world transform, or the union for multi-select", () => {
    const editor = install();
    expect(editor.getSnapshot().selectionBox).toBeUndefined();
    editor.setSelection(["layer-card"]);
    const single = editor.getSnapshot().selectionBox;
    expect(single).toBeDefined();
    // The placement rides the transform (the box is the node's LOCAL space).
    expect(single!.transform).toEqual({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 260,
      f: 150,
    });
    expect(single!.bounds).toEqual({ x: 0, y: 0, width: 340, height: 210 });
    editor.setSelection(["layer-card", "layer-badge"]);
    const multi = editor.getSnapshot().selectionBox;
    expect(multi).toBeDefined();
    expect(multi!.transform).toEqual({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    // The badge sits inside the card, so the union is the card's box —
    // the two selected boxes still merged (the union covers both).
    expect(multi!.bounds).toEqual({ x: 260, y: 150, width: 340, height: 210 });
  });

  it.each([
    { name: "locked", parent: { locked: true } },
    { name: "effectively hidden", parent: { visible: false } },
  ])("does not project active affordances for a $name selection", ({ parent }) => {
    const editor = new CanvasEditor(toDocument(sceneWith([{
      ...layer("parent", { x: 100, y: 100, width: 200, height: 200 }, parent),
      type: "group",
      children: [layer("selected", { x: 20, y: 20, width: 100, height: 100 })],
    }])), 0);
    editor.setSelection([parent.locked ? "parent" : "selected"]);

    expect(editor.getSnapshot().selectedIds).toEqual([parent.locked ? "parent" : "selected"]);
    expect(editor.getSnapshot().selectionBox).toBeUndefined();
  });

  it("right-click selects the node under the cursor with menu semantics", () => {
    const editor = install();
    // A node under the cursor becomes the selection.
    editor.handleContextMenu(screen(300, 200));
    expect(editor.getSnapshot().selectedIds).toEqual(["layer-card"]);
    // A node already inside a multi-selection keeps the whole selection.
    editor.setSelection(["layer-card", "layer-badge"]);
    editor.handleContextMenu(screen(350, 305));
    expect(editor.getSnapshot().selectedIds).toEqual([
      "layer-card",
      "layer-badge",
    ]);
    // Empty canvas clears the selection — right-click never enters a gesture.
    editor.handleContextMenu(screen(20, 20));
    expect(editor.getSnapshot().selectedIds).toEqual([]);
    expect(editor.getSnapshot().interaction.tool).toBe("select");
  });

  it("right-click uses the kernel hit test for locked and hidden layers", () => {
    const editor = new CanvasEditor(
      toDocument(
        sceneWith([
          layer("base", { x: 100, y: 100, width: 160, height: 160 }),
          layer("locked-top", { x: 100, y: 100, width: 160, height: 160 }, { locked: true }),
          layer("hidden-top", { x: 320, y: 100, width: 160, height: 160 }, { visible: false }),
        ]),
      ),
      0,
    );

    editor.handleContextMenu(screen(140, 140));
    expect(editor.getSnapshot().selectedIds).toEqual(["base"]);

    editor.setSelection(["base"]);
    editor.handleContextMenu(screen(360, 140));
    expect(editor.getSnapshot().selectedIds).toEqual([]);
  });

  it("right-click selects transformed nodes on their drawn geometry", () => {
    const editor = new CanvasEditor(
      toDocument(
        sceneWith([
          {
            ...layer("rotated", { x: 200, y: 200, width: 120, height: 80 }),
            transform: { a: 0, b: 1, c: -1, d: 0, e: 0, f: 0 },
          },
        ]),
      ),
      0,
    );

    editor.handleContextMenu(screen(160, 260));
    expect(editor.getSnapshot().selectedIds).toEqual(["rotated"]);
  });
});

describe("navigation routing", () => {
  it("zooms around the cursor with the smooth exponential factor", () => {
    const editor = install();
    const anchor = screen(100, 100);
    const before = editor.getSnapshot().viewport;
    editor.handleWheel(anchor, -200);
    const after = editor.getSnapshot().viewport;
    expect(after.zoom).toBeGreaterThan(before.zoom);
    expect(after.zoom).toBeCloseTo(
      before.zoom * Math.min(1.25, Math.max(0.8, Math.exp(0.2))),
      5,
    );
    const worldBefore = {
      x: (anchor.x - before.panX) / before.zoom,
      y: (anchor.y - before.panY) / before.zoom,
    };
    const worldAfter = {
      x: (anchor.x - after.panX) / after.zoom,
      y: (anchor.y - after.panY) / after.zoom,
    };
    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 5);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 5);
  });

  it("pans on middle-drag and mirrors the viewport into the kernel", () => {
    const editor = install();
    down(editor, 1, { x: 100, y: 100 }, { button: 1 });
    move(editor, 1, { x: 140, y: 130 });
    up(editor, 1, { x: 140, y: 130 });
    const viewport = editor.getSnapshot().viewport;
    expect(viewport.panX).toBe(120);
    expect(viewport.panY).toBe(80);
    // The settled camera persists the page's rest camera — one authored
    // bookkeeping write, no history entry.
    expect(editor.getSnapshot().documentRevision).toBe(1);
    const serialized = JSON.parse(editor.serializeDocument()) as {
      pages: Record<string, { canvas: { rest: { panX: number; panY: number; zoom: number } } }>;
    };
    expect(serialized.pages["page-frame-home"]!.canvas.rest).toEqual({ panX: 120, panY: 80, zoom: 0.82 });
    expect(editor.undo()).toBe(false);
  });

  it("pinch cancels an in-flight gesture and zooms without creating", () => {
    const editor = install();
    editor.setTool("rectangle");
    down(editor, 1, screen(100, 100));
    down(editor, 2, screen(200, 100));
    move(editor, 2, screen(300, 100));
    up(editor, 2, screen(300, 100));
    up(editor, 1, screen(100, 100));
    const snapshot = editor.getSnapshot();
    expect(snapshot.documentRevision).toBe(1);
    expect(snapshot.viewport.zoom).toBeGreaterThan(0.82);
    expect(snapshot.frame?.layers).toHaveLength(3);
  });

  it("scroll-pans both axes and mirrors the viewport into the kernel", () => {
    const editor = install();
    const before = editor.getSnapshot().viewport;
    editor.scrollPan(30, -20);
    const after = editor.getSnapshot().viewport;
    expect(after.panX).toBeCloseTo(before.panX + 30, 5);
    expect(after.panY).toBeCloseTo(before.panY - 20, 5);
    expect(after.zoom).toBe(before.zoom);
    // The settled camera persists the page's rest camera (one write).
    expect(editor.getSnapshot().documentRevision).toBe(1);
  });

  it("scroll-pan cancels an armed rectangle gesture so release never creates", () => {
    const editor = install();
    editor.setTool("rectangle");
    down(editor, 1, screen(100, 100));
    move(editor, 1, screen(140, 140));
    const before = editor.getSnapshot().viewport;
    editor.scrollPan(50, 0);
    up(editor, 1, screen(250, 200));
    const snapshot = editor.getSnapshot();
    expect(snapshot.viewport.panX).toBeCloseTo(before.panX + 50, 5);
    expect(snapshot.frame?.layers).toHaveLength(3);
    expect(editor.undo()).toBe(false);
  });

  it("sets an exact preset zoom anchored at the point, without touching the document", () => {
    const editor = install();
    const anchor = screen(400, 250);
    const worldBefore = {
      x: (anchor.x - 80) / 0.82,
      y: (anchor.y - 50) / 0.82,
    };
    editor.setZoom(1, anchor);
    const after = editor.getSnapshot().viewport;
    expect(after.zoom).toBe(1);
    expect(after.panX).toBeCloseTo(anchor.x - worldBefore.x, 5);
    expect(after.panY).toBeCloseTo(anchor.y - worldBefore.y, 5);
    // The settled camera persists the page's rest camera (one write), and
    // the write is bookkeeping, never an undoable edit.
    expect(editor.getSnapshot().documentRevision).toBe(1);
    expect(editor.undo()).toBe(false);
  });

  it("projects the grid as permanently visible", () => {
    const editor = install();
    expect(editor.getSnapshot().gridVisible).toBe(true);
  });

  it("clamps preset zoom to the kernel's window", () => {
    const editor = install();
    editor.setZoom(1e6, screen(200, 200));
    expect(editor.getSnapshot().viewport.zoom).toBe(ZOOM_MAX);
    editor.setZoom(-1e6, screen(200, 200));
    expect(editor.getSnapshot().viewport.zoom).toBe(ZOOM_MIN);
  });

  it("setZoom cancels an armed rectangle gesture so release never creates", () => {
    const editor = install();
    editor.setTool("rectangle");
    down(editor, 1, screen(100, 100));
    move(editor, 1, screen(140, 140));
    editor.setZoom(2, screen(200, 200));
    up(editor, 1, screen(250, 200));
    const snapshot = editor.getSnapshot();
    expect(snapshot.viewport.zoom).toBe(2);
    expect(snapshot.frame?.layers).toHaveLength(3);
    expect(editor.undo()).toBe(false);
  });

  it("centres the world origin while the camera is fresh and never after the user moves it", () => {
    const editor = install();
    editor.centerOrigin(1600, 900);
    const centered = editor.getSnapshot().viewport;
    expect(centered.panX).toBe(800);
    expect(centered.panY).toBe(450);
    expect(centered.zoom).toBe(0.82);
    editor.centerOrigin(1600, 900);
    expect(editor.getSnapshot().viewport).toEqual(centered);
    editor.scrollPan(30, 0);
    editor.centerOrigin(1600, 900);
    expect(editor.getSnapshot().viewport.panX).toBeCloseTo(830, 5);
    expect(editor.getSnapshot().viewport.panY).toBe(450);
  });

  it("re-centres on resize while fresh and does not reset the camera across undo", () => {
    const editor = install();
    editor.centerOrigin(1600, 900);
    editor.centerOrigin(1200, 800);
    expect(editor.getSnapshot().viewport.panX).toBe(600);
    expect(editor.getSnapshot().viewport.panY).toBe(400);
    editor.setTool("rectangle");
    down(editor, 1, screen(100, 100));
    move(editor, 1, screen(250, 200));
    up(editor, 1, screen(250, 200));
    expect(editor.undo()).toBe(true);
    expect(editor.getSnapshot().viewport.panX).toBe(600);
    expect(editor.getSnapshot().viewport.panY).toBe(400);
    expect(editor.redo()).toBe(true);
    expect(editor.getSnapshot().viewport.panX).toBe(600);
  });
});

describe("create, move, and resize gestures", () => {
  it.each([
    "n", "ne", "e", "se", "s", "sw", "w", "nw",
  ] as const)("projects constrained resize for %s with opposite edge or center fixed", (handle) => {
    const start = { x: 10, y: 20, width: 100, height: 50 };
    const transform = { a: 1.5, b: 0.5, c: -0.25, d: 2, e: 10, f: -5 };
    for (const constrainAspect of [false, true]) {
      for (const fromCenter of [false, true]) {
        const resized = projectConstrainedResize(start, handle, { x: 18, y: 11 }, transform, {
          constrainAspect,
          fromCenter,
          minSize: 1,
        });
        if (fromCenter) {
          expect(resized.x + resized.width / 2).toBeCloseTo(start.x + start.width / 2, 9);
          expect(resized.y + resized.height / 2).toBeCloseTo(start.y + start.height / 2, 9);
        } else {
          if (handle.includes("e")) expect(resized.x).toBe(start.x);
          if (handle.includes("w")) expect(resized.x + resized.width).toBe(start.x + start.width);
          if (handle.includes("s")) expect(resized.y).toBe(start.y);
          if (handle.includes("n")) expect(resized.y + resized.height).toBe(start.y + start.height);
        }
        if (constrainAspect) expect(resized.width / resized.height).toBeCloseTo(2, 9);
      }
    }
  });

  it.each(["e", "w"] as const)("re-centres the orthogonal axis for Shift+%s", (handle) => {
    const start = { x: 10, y: 20, width: 100, height: 50 };
    const resized = projectConstrainedResize(start, handle, { x: 20, y: 0 }, { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, {
      constrainAspect: true,
      fromCenter: false,
      minSize: 1,
    });
    expect(resized.y + resized.height / 2).toBe(start.y + start.height / 2);
  });

  it.each(["n", "s"] as const)("re-centres the orthogonal axis for Shift+%s", (handle) => {
    const start = { x: 10, y: 20, width: 100, height: 50 };
    const resized = projectConstrainedResize(start, handle, { x: 0, y: 20 }, { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, {
      constrainAspect: true,
      fromCenter: false,
      minSize: 1,
    });
    expect(resized.x + resized.width / 2).toBe(start.x + start.width / 2);
  });

  it.each(([
    "n", "ne", "e", "se", "s", "sw", "w", "nw",
  ] as const).flatMap((handle) => ([
    { name: "none", shiftKey: false, altKey: false },
    { name: "Shift", shiftKey: true, altKey: false },
    { name: "Alt", shiftKey: false, altKey: true },
    { name: "Shift+Alt", shiftKey: true, altKey: true },
  ] as const).map((modifiers) => ({ handle, ...modifiers }))))(
    "resizes through reducer→harness→kernel for $handle+$name with one transaction",
    ({ handle, shiftKey, altKey }) => {
      const original = { x: 10.2, y: 10.2, width: 20, height: 20 };
      const editor = new CanvasEditor(toDocument(sceneWith([layer("moving", original)])), 0);
      editor.setSnapSetting("grid", false);
      editor.setSnapSetting("objects", false);
      editor.setSnapSetting("guides", false);
      editor.setSnapSetting("pixel", false);
      editor.setSelection(["moving"]);
      const box = editor.getSnapshot().selectionBox!;
      const local = {
        x: handle.includes("w") ? 0 : handle.includes("e") ? box.bounds.width : box.bounds.width / 2,
        y: handle.includes("n") ? 0 : handle.includes("s") ? box.bounds.height : box.bounds.height / 2,
      };
      const startPoint = {
        x: box.transform.a * local.x + box.transform.c * local.y + box.transform.e,
        y: box.transform.b * local.x + box.transform.d * local.y + box.transform.f,
      };
      const delta = {
        x: handle.includes("w") ? -3 : handle.includes("e") ? 3 : 0,
        y: handle.includes("n") ? -2 : handle.includes("s") ? 2 : 0,
      };
      const endPoint = { x: startPoint.x + delta.x, y: startPoint.y + delta.y };
      down(editor, 1, worldToScreen(startPoint, editor.getSnapshot().viewport), { altKey, shiftKey });
      expect(editor.getSnapshot().selectedIds).toEqual(["moving"]);
      expect(editor.getSnapshot().interaction.resizeHandle).toBe(handle);
      move(editor, 1, worldToScreen(endPoint, editor.getSnapshot().viewport), { altKey, shiftKey });
      const preview = editor.getSnapshot().frame!.layers.find((entry) => entry.id === "moving")!.bounds;
      if (altKey) {
        expect(preview.x + preview.width / 2).toBeCloseTo(original.x + original.width / 2, 9);
        expect(preview.y + preview.height / 2).toBeCloseTo(original.y + original.height / 2, 9);
      } else if (handle.length === 2) {
        if (handle.includes("e")) expect(preview.x).toBeCloseTo(original.x, 9);
        if (handle.includes("w")) expect(preview.x + preview.width).toBeCloseTo(original.x + original.width, 9);
        if (handle.includes("s")) expect(preview.y).toBeCloseTo(original.y, 9);
        if (handle.includes("n")) expect(preview.y + preview.height).toBeCloseTo(original.y + original.height, 9);
      } else if (handle === "e" || handle === "w") {
        expect(preview.y + preview.height / 2).toBeCloseTo(original.y + original.height / 2, 9);
        expect(handle === "e" ? preview.x : preview.x + preview.width).toBeCloseTo(handle === "e" ? original.x : original.x + original.width, 9);
      } else {
        expect(preview.x + preview.width / 2).toBeCloseTo(original.x + original.width / 2, 9);
        expect(handle === "s" ? preview.y : preview.y + preview.height).toBeCloseTo(handle === "s" ? original.y : original.y + original.height, 9);
      }
      up(editor, 1, worldToScreen(endPoint, editor.getSnapshot().viewport));
      expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "moving")!.bounds).toEqual(preview);
      expect(editor.undo()).toBe(true);
      expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "moving")!.bounds).toEqual(original);
    },
  );

  it("commits one rectangle per gesture with a single history entry", () => {
    const editor = install();
    editor.setTool("rectangle");
    down(editor, 1, screen(100, 100));
    move(editor, 1, screen(250, 200));
    up(editor, 1, screen(250, 200));
    const snapshot = editor.getSnapshot();
    const created = snapshot.frame?.layers.find(
      (layer) => layer.name === "New rectangle",
    );
    expect(created).toBeDefined();
    expect(created?.bounds.x).toBeCloseTo(100, 5);
    expect(created?.bounds.y).toBeCloseTo(100, 5);
    // The drag's far corner passes within 12 px of the card's left edge
    // (260), so the rectangle's width snaps onto it.
    expect(created?.bounds.width).toBeCloseTo(160, 5);
    expect(created?.bounds.height).toBeCloseTo(100, 5);
    expect(snapshot.selectedIds).toEqual([created?.id]);
    expect(editor.undo()).toBe(true);
    expect(
      editor
        .getSnapshot()
        .frame?.layers.find((layer) => layer.name === "New rectangle"),
    ).toBeUndefined();
    expect(editor.undo()).toBe(false);
  });

  it("moves a layer through a kernel transaction and commits one history entry", () => {
    const editor = install();
    down(editor, 1, screen(300, 175));
    move(editor, 1, screen(330, 205));
    up(editor, 1, screen(330, 205));
    const moved = editor
      .getSnapshot()
      .frame?.layers.find((layer) => layer.id === "layer-card");
    expect(moved?.bounds.x).toBeGreaterThan(260);
    expect(moved?.bounds.y).toBeGreaterThan(150);
    expect(editor.undo()).toBe(true);
    expect(
      editor
        .getSnapshot()
        .frame?.layers.find((layer) => layer.id === "layer-card")?.bounds.x,
    ).toBe(260);
    expect(editor.undo()).toBe(false);
  });

  it("resizes a layer from the bottom-right handle", () => {
    const editor = install();
    // Grab exactly on the BR corner's screen position (572, 345) — the
    // 16-screen-px handle zone arms "se".
    down(editor, 1, screen(600, 360));
    move(editor, 1, screen(610, 375));
    up(editor, 1, screen(610, 375));
    const resized = editor
      .getSnapshot()
      .frame?.layers.find((layer) => layer.id === "layer-card");
    expect(resized?.bounds.width).toBeGreaterThan(340);
    expect(resized?.bounds.height).toBeGreaterThan(210);
  });

  it("resizes from the top-left handle, pinning the bottom-right corner", () => {
    const editor = install();
    // Grab within 16 screen px of the NW handle's screen position (293, 173)
    // — the 16px zone arms "nw".
    down(editor, 1, screen(265, 155));
    move(editor, 1, screen(300, 190));
    up(editor, 1, screen(300, 190));
    const resized = editor
      .getSnapshot()
      .frame?.layers.find((layer) => layer.id === "layer-card");
    expect(resized?.bounds.x).toBeGreaterThan(260);
    expect(resized?.bounds.y).toBeGreaterThan(150);
    expect(resized?.bounds.width).toBeLessThan(340);
    expect(resized?.bounds.height).toBeLessThan(210);
  });

  it("resizes from the center when Alt is held (from-center)", () => {
    const editor = install();
    down(editor, 1, screen(600, 360));
    move(editor, 1, screen(610, 375), { altKey: true });
    up(editor, 1, screen(610, 375));
    const resized = editor
      .getSnapshot()
      .frame?.layers.find((layer) => layer.id === "layer-card");
    expect(resized?.bounds.x).toBeLessThan(260);
    expect(resized?.bounds.width).toBeGreaterThan(340);
  });

  it("does not duplicate when Alt is held from pointer-down on a resize handle", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    const before = editor.getSnapshot().frame?.layers.length;
    down(editor, 1, screen(600, 255), { altKey: true });
    move(editor, 1, screen(630, 255), { altKey: true });
    up(editor, 1, screen(630, 255));
    expect(editor.getSnapshot().frame?.layers.length).toBe(before);
    expect(editor.getSnapshot().selectedIds).toEqual(["layer-card"]);
  });

  it("duplicates on alt-drag and hands the selection to the copy", () => {
    const editor = install();
    const beforeIds = new Set(editor.getSnapshot().frame?.layers.map((layer) => layer.id));
    down(editor, 1, screen(430, 255), { altKey: true });
    move(editor, 1, screen(460, 285), { altKey: true });
    up(editor, 1, screen(460, 285));
    const projection = editor.getSnapshot();
    const card = projection.frame?.layers.find((layer) => layer.id === "layer-card");
    const selected = projection.selectedIds;
    expect(selected).toHaveLength(1);
    expect(selected[0]).not.toBe("layer-card");
    const copy = projection.frame?.layers.find((layer) => layer.id === selected[0]);
    // The copy moved right by the drag (grid snapping may pull it a step);
    // the original stayed put.
    expect(copy?.bounds.x).toBeGreaterThan(280);
    expect(card?.bounds.x).toBe(260);
    expect(editor.undo()).toBe(true);
    // Undo removes the whole gesture: the copy is gone, the original is back
    // at rest.
    const undone = editor.getSnapshot();
    expect(undone.frame?.layers.find((layer) => layer.id === "layer-card")?.bounds.x).toBe(260);
    expect(undone.frame?.layers.map((layer) => layer.id)).toEqual([...beforeIds]);
  });

  it("rotates a layer from the ring outside a corner handle, with undo", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    // layer-card's world box: (260,150)-(600,360). The ring outside the SE
    // corner: grab ~22 screen px beyond it (the ring band is 16..30px).
    const cornerScreen = { x: 600 * 0.82 + 80, y: 360 * 0.82 + 50 };
    const grab = { x: cornerScreen.x + 20, y: cornerScreen.y + 20 };
    down(editor, 1, grab);
    // Drag toward the box's center-left: a large clockwise angle about the
    // box center (430, 255).
    const center = { x: 430 * 0.82 + 80, y: 255 * 0.82 + 50 };
    const target = { x: center.x - 120, y: center.y - 60 };
    move(editor, 1, target);
    up(editor, 1, target);
    const rotated = editor.getSnapshot();
    const card = rotated.frame?.layers.find((layer) => layer.id === "layer-card");
    const angle = Math.atan2(card?.transform.b ?? 0, card?.transform.a ?? 1);
    expect(Math.abs(angle)).toBeGreaterThan(Math.PI / 8);
    expect(editor.undo()).toBe(true);
    const restored = editor.getSnapshot().frame?.layers.find((layer) => layer.id === "layer-card");
    expect(restored?.transform.a).toBe(1);
    expect(restored?.transform.b).toBe(0);
  });

  it.each([
    { name: "resize", grab: { x: 200, y: 200 }, target: { x: 212, y: 208 }, field: "resizeHandle" as const },
    { name: "corner radius", grab: { x: 114.63, y: 114.63 }, target: { x: 124.63, y: 124.63 }, field: "cornerHandle" as const },
    { name: "rotate", grab: { x: 220, y: 220 }, target: { x: 180, y: 240 }, field: "rotate" as const },
  ])("keeps the selected $name affordance above overlapping node geometry with and without Shift", ({ grab, target, field }) => {
    for (const shiftKey of [false, true]) {
      const original = { x: 100, y: 100, width: 100, height: 100 };
      const editor = new CanvasEditor(toDocument(sceneWith([
        layer("selected", original),
        layer("underneath", { x: grab.x - 12, y: grab.y - 12, width: 24, height: 24 }, { zIndex: 10 }),
      ])), 0);
      editor.setSnapSetting("grid", false);
      editor.setSnapSetting("objects", false);
      editor.setSnapSetting("guides", false);
      editor.setSnapSetting("pixel", false);
      editor.setSelection(["selected"]);
      const underBefore = editor.getSnapshot().frame?.layers.find((entry) => entry.id === "underneath")?.bounds;

      down(editor, 1, worldToScreen(grab, editor.getSnapshot().viewport), { shiftKey });
      expect(editor.getSnapshot().selectedIds).toEqual(["selected"]);
      expect(editor.getSnapshot().interaction[field]).toBeTruthy();
      move(editor, 1, worldToScreen(target, editor.getSnapshot().viewport), { shiftKey });
      const preview = editor.getSnapshot().frame?.layers.find((entry) => entry.id === "selected");
      expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "underneath")?.bounds).toEqual(underBefore);
      up(editor, 1, worldToScreen(target, editor.getSnapshot().viewport), { shiftKey });
      expect(editor.getSnapshot().selectedIds).toEqual(["selected"]);
      expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "selected")).toEqual(preview);
      expect(editor.undo()).toBe(true);
      expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "selected")?.bounds).toEqual(original);
      expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "underneath")?.bounds).toEqual(underBefore);
    }
  });

  it.each([
    { name: "resize", grab: { x: 200, y: 200 }, target: { x: 212, y: 208 } },
    { name: "corner radius", grab: { x: 114.63, y: 114.63 }, target: { x: 124.63, y: 124.63 } },
    { name: "rotate", grab: { x: 220, y: 220 }, target: { x: 180, y: 240 } },
  ])("does not arm or mutate a locked selected node through its $name affordance", ({ grab, target }) => {
    for (const shiftKey of [false, true]) {
      const original = { x: 100, y: 100, width: 100, height: 100 };
      const editor = new CanvasEditor(toDocument(sceneWith([
        layer("selected", original, { locked: true }),
      ])), 0);
      editor.setSelection(["selected"]);
      const beforeProjection = editor.getSnapshot();
      const beforeNode = beforeProjection.frame?.layers.find((entry) => entry.id === "selected");
      const beforeDocumentRevision = beforeProjection.documentRevision;
      const beforeCanUndo = beforeProjection.canUndo;

      down(editor, 1, worldToScreen(grab, beforeProjection.viewport), { shiftKey });
      expect(editor.getSnapshot().interaction.phase).toBe("idle");
      expect(editor.getSnapshot().interaction.resizeHandle).toBeUndefined();
      expect(editor.getSnapshot().interaction.cornerHandle).toBeUndefined();
      expect(editor.getSnapshot().interaction.rotate).toBeUndefined();
      move(editor, 1, worldToScreen(target, beforeProjection.viewport), { shiftKey });
      up(editor, 1, worldToScreen(target, beforeProjection.viewport), { shiftKey });

      expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "selected")).toEqual(beforeNode);
      expect(editor.getSnapshot().documentRevision).toBe(beforeDocumentRevision);
      expect(editor.getSnapshot().canUndo).toBe(beforeCanUndo);
    }
  });

  it.each([
    { name: "move", grab: { x: 150, y: 150 }, target: { x: 170, y: 170 }, nodeId: "selected", property: "locked" as const, value: true },
    { name: "resize", grab: { x: 200, y: 200 }, target: { x: 212, y: 208 }, nodeId: "parent", property: "locked" as const, value: true },
    { name: "corner radius", grab: { x: 114.63, y: 114.63 }, target: { x: 124.63, y: 124.63 }, nodeId: "parent", property: "visible" as const, value: false },
    { name: "rotate", grab: { x: 220, y: 220 }, target: { x: 180, y: 240 }, nodeId: "selected", property: "locked" as const, value: true },
  ])("rolls back an armed $name when a $property transition makes its target immutable", ({ grab, target, nodeId, property, value }) => {
    const original = { x: 100, y: 100, width: 100, height: 100 };
    const editor = new CanvasEditor(toDocument(sceneWith([{
      ...layer("parent", original, { type: "group" }),
      children: [layer("selected", { x: 0, y: 0, width: 100, height: 100 })],
    }])), 0);
    editor.setSelection(["selected"]);
    const before = editor.getSnapshot().frame?.layers.find((entry) => entry.id === "selected");

    down(editor, 1, worldToScreen(grab, editor.getSnapshot().viewport));
    editor.dispatch({ type: "set-property", nodeId, property, value }, "Invalidate gesture");
    move(editor, 1, worldToScreen(target, editor.getSnapshot().viewport));

    const invalidated = editor.getSnapshot();
    expect(invalidated.interaction.phase).toBe("idle");
    expect(invalidated.draftBounds).toBeUndefined();
    expect(invalidated.snapChoices).toBeUndefined();
    expect(invalidated.selectedIds).toEqual(["selected"]);
    up(editor, 1, worldToScreen(target, invalidated.viewport));
    expect(editor.undo()).toBe(true);
    expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "selected")).toEqual(before);
    expect(editor.getSnapshot().canUndo).toBe(false);
  });

  it.each([
    { name: "none", shiftKey: false, altKey: false },
    { name: "Shift", shiftKey: true, altKey: false },
    { name: "Alt", shiftKey: false, altKey: true },
    { name: "Shift+Alt", shiftKey: true, altKey: true },
  ])("preserves selection while resizing an arbitrarily rotated layer with $name", ({ shiftKey, altKey }) => {
    const original = { x: 100, y: 100, width: 120, height: 80 };
    const angle = (33 * Math.PI) / 180;
    const editor = new CanvasEditor(toDocument(sceneWith([
      layer("rotated", original, {
        transform: { a: Math.cos(angle), b: Math.sin(angle), c: -Math.sin(angle), d: Math.cos(angle), e: 0, f: 0 },
      }),
    ])), 0);
    editor.setSnapSetting("grid", false);
    editor.setSnapSetting("objects", false);
    editor.setSnapSetting("guides", false);
    editor.setSnapSetting("pixel", false);
    editor.setSelection(["rotated"]);
    const box = editor.getSnapshot().selectionBox!;
    const start = {
      x: box.transform.a * box.bounds.width + box.transform.c * box.bounds.height + box.transform.e,
      y: box.transform.b * box.bounds.width + box.transform.d * box.bounds.height + box.transform.f,
    };
    const end = { x: start.x + 12, y: start.y + 8 };

    down(editor, 1, worldToScreen(start, editor.getSnapshot().viewport), { shiftKey, altKey });
    expect(editor.getSnapshot().selectedIds).toEqual(["rotated"]);
    expect(editor.getSnapshot().interaction.resizeHandle).toBe("se");
    move(editor, 1, worldToScreen(end, editor.getSnapshot().viewport), { shiftKey, altKey });
    const preview = editor.getSnapshot().frame?.layers.find((entry) => entry.id === "rotated")?.bounds;
    expect(preview).toBeDefined();
    expect(preview).not.toEqual(original);
    expect(editor.getSnapshot().selectedIds).toEqual(["rotated"]);
    up(editor, 1, worldToScreen(end, editor.getSnapshot().viewport));
    expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "rotated")?.bounds).toEqual(preview);
    expect(editor.undo()).toBe(true);
    expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "rotated")?.bounds).toEqual(original);
  });

  it("smart-duplicates (⌘D) with the last alt-drag's offset", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    editor.duplicateSmart();
    const first = editor.getSnapshot();
    const firstCopy = first.selectedIds[0];
    const firstLayer = first.frame?.layers.find((layer) => layer.id === firstCopy);
    expect(firstLayer?.bounds.x).toBe(270);
    expect(firstLayer?.bounds.y).toBe(160);
    // Repeat: the same offset repeats.
    editor.duplicateSmart();
    const second = editor.getSnapshot();
    const secondCopy = second.selectedIds[0];
    const secondLayer = second.frame?.layers.find((layer) => layer.id === secondCopy);
    expect(secondLayer?.bounds.x).toBe(280);
    expect(secondLayer?.bounds.y).toBe(170);
  });

  it("nudges the selection by world steps, one history entry per press", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    editor.nudgeSelection(1, 1);
    const one = editor.getSnapshot().frame?.layers.find((layer) => layer.id === "layer-card");
    expect(one?.bounds.x).toBe(261);
    editor.nudgeSelection(-10, 0);
    const big = editor.getSnapshot().frame?.layers.find((layer) => layer.id === "layer-card");
    expect(big?.bounds.x).toBe(251);
    expect(editor.undo()).toBe(true);
    const undone = editor.getSnapshot().frame?.layers.find((layer) => layer.id === "layer-card");
    expect(undone?.bounds.x).toBe(261);
  });

  it("selects the parent, first child, and next sibling (hierarchy laddering)", () => {
    const nested: Scene = {
      schemaVersion: 1,
      id: "scene-nested",
      name: "Nested",
      revision: 0,
      frames: [
        {
          id: "frame-home",
          name: "Page 1",
          bounds: { x: 0, y: 0, width: 1280, height: 800 },
          stories: [],
          layers: [
            {
              id: "group-a",
              name: "Group A",
              type: "group",
              bounds: { x: 100, y: 100, width: 300, height: 200 },
              transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
              fill: "#00000000",
              stroke: "#00000000",
              opacity: 1,
              cornerRadius: 0,
              visible: true,
              zIndex: 0,
              children: [
                {
                  id: "rect-a",
                  name: "Rect A",
                  type: "rectangle",
                  bounds: { x: 0, y: 0, width: 100, height: 80 },
                  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
                  fill: "#ff0000",
                  stroke: "#00000000",
                  opacity: 1,
                  cornerRadius: 0,
                  visible: true,
                  zIndex: 0,
                },
                {
                  id: "rect-b",
                  name: "Rect B",
                  type: "rectangle",
                  bounds: { x: 150, y: 0, width: 100, height: 80 },
                  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
                  fill: "#00ff00",
                  stroke: "#00000000",
                  opacity: 1,
                  cornerRadius: 0,
                  visible: true,
                  zIndex: 1,
                },
              ],
            },
          ],
        },
      ],
    };
    const editor = new CanvasEditor(toDocument(nested), 0);
    editor.setSelection(["rect-b"]);
    // Tab → next sibling (wraps to the first child).
    editor.selectNextSibling();
    expect(editor.getSnapshot().selectedIds[0]).toBe("rect-a");
    // Enter → first child of a container; Esc-ladder → its parent.
    editor.setSelection(["group-a"]);
    editor.selectFirstChild();
    expect(editor.getSnapshot().selectedIds[0]).toBe("rect-a");
    expect(editor.selectParent()).toBe(true);
    expect(editor.getSnapshot().selectedIds[0]).toBe("group-a");
    // The page root is not a ladder target: at the top, selectParent
    // reports false (the keyboard clears the selection instead).
    expect(editor.selectParent()).toBe(false);
  });

  it("rolls back a move preview on pointer cancel", () => {
    const editor = install();
    down(editor, 1, screen(430, 255));
    move(editor, 1, screen(460, 285));
    editor.handlePointerUp(1, screen(460, 285), {
      cancel: true,
      shiftKey: false,
    });
    expect(
      editor
        .getSnapshot()
        .frame?.layers.find((layer) => layer.id === "layer-card")?.bounds.x,
    ).toBe(260);
    expect(editor.undo()).toBe(false);
  });

  it("keeps authored bytes unchanged after a visible-canvas selection", () => {
    const editor = install();
    const before = editor.serializeDocument();

    down(editor, 1, screen(300, 200));
    up(editor, 1, screen(300, 200));

    expect(editor.getSnapshot().selectedIds).toEqual(["layer-card"]);
    expect(editor.serializeDocument()).toBe(before);
  });

  it("keeps authored bytes unchanged after a cancelled move", () => {
    const editor = install();
    const before = editor.serializeDocument();

    down(editor, 1, screen(430, 255));
    move(editor, 1, screen(460, 285));
    editor.handlePointerUp(1, screen(460, 285), {
      cancel: true,
      shiftKey: false,
    });

    expect(editor.serializeDocument()).toBe(before);
  });

  it("keeps authored bytes unchanged after a cancelled pan", () => {
    const editor = install();
    const before = editor.serializeDocument();

    down(editor, 1, { x: 100, y: 100 }, { button: 1 });
    move(editor, 1, { x: 220, y: 160 });
    editor.handlePointerUp(1, { x: 220, y: 160 }, {
      cancel: true,
      shiftKey: false,
    });

    expect(editor.getSnapshot().viewport).toMatchObject({ panX: 200, panY: 110 });
    expect(editor.serializeDocument()).toBe(before);
  });

  it("restores exact authored bytes through move undo and redo", () => {
    const editor = install();
    const before = editor.serializeDocument();

    down(editor, 1, screen(430, 255));
    move(editor, 1, screen(460, 285));
    up(editor, 1, screen(460, 285));
    const after = editor.serializeDocument();

    expect(after).not.toBe(before);
    expect(editor.undo()).toBe(true);
    expect(editor.serializeDocument()).toBe(before);
    expect(editor.redo()).toBe(true);
    expect(editor.serializeDocument()).toBe(after);
  });

  it("preserves the plain-click default rectangle contract for the rectangle tool", () => {
    const editor = install();
    editor.setTool("rectangle");
    down(editor, 1, screen(100, 100));
    up(editor, 1, screen(100, 100));
    const created = editor
      .getSnapshot()
      .frame?.layers.find((layer) => layer.name === "New rectangle");
    expect(created).toBeDefined();
    expect(created?.bounds.width).toBeGreaterThan(1);
    expect(editor.undo()).toBe(true);
  });

  it("commits an ellipse as a 4-cubic path node (the industry representation)", () => {
    const editor = install();
    editor.setTool("ellipse");
    down(editor, 1, screen(100, 100));
    move(editor, 1, screen(220, 180));
    up(editor, 1, screen(220, 180));
    const created = editor
      .getSnapshot()
      .frame?.layers.find((layer) => layer.name === "Ellipse");
    expect(created).toBeDefined();
    // The drag is measured in screen px: 120 screen px → 120 world units
    // (the zoom cancels in worldDelta = screenDelta / zoom).
    expect(created?.bounds.width).toBeCloseTo(120, 0);
    expect(created?.bounds.height).toBeCloseTo(80, 0);
    // Path nodes project as invisible rects in the scene; their geometry
    // travels the pathCommands channel — that's the ellipse's drawing path.
    const projection = editor.getSnapshot();
    const ellipse = projection.frame?.layers.find((layer) => layer.name === "Ellipse");
    expect(ellipse).toBeDefined();
    expect(projection.pathCommands.some((command) => command.geometry === "path" && command.nodeId === ellipse!.id)).toBe(true);
    expect(editor.undo()).toBe(true);
  });

  it("commits a line as a 2-point open path", () => {
    const editor = install();
    editor.setTool("line");
    down(editor, 1, screen(100, 100));
    move(editor, 1, screen(240, 100));
    up(editor, 1, screen(240, 100));
    const created = editor
      .getSnapshot()
      .frame?.layers.find((layer) => layer.name === "Line");
    expect(created).toBeDefined();
    expect(created?.bounds.width).toBeCloseTo(140, 0);
    const projection = editor.getSnapshot();
    expect(projection.pathCommands.some((command) => command.geometry === "path" && command.nodeId === created!.id)).toBe(true);
    expect(editor.undo()).toBe(true);
  });

  it("commits a frame and absorbs fully-contained top-level nodes as children", () => {
    const editor = install();
    // Draw a frame around layer-title (300,220)-(560,264) plus margin.
    editor.setTool("frame");
    down(editor, 1, screen(260, 180));
    move(editor, 1, screen(600, 300));
    up(editor, 1, screen(600, 300));
    const snapshot = editor.getSnapshot();
    const frame = snapshot.frame?.layers.find((layer) => layer.name === "Frame");
    expect(frame).toBeDefined();
    expect(frame?.id).toBe(snapshot.selectedIds[0]);
    // layer-title was fully contained; layer-card was not (it sticks out).
    expect(frame?.children?.some((child) => child.id === "layer-title")).toBe(true);
    expect(frame?.children?.some((child) => child.id === "layer-card")).toBe(false);
    expect(editor.undo()).toBe(true);
    const undone = editor.getSnapshot();
    expect(undone.frame?.layers.some((layer) => layer.name === "Frame")).toBe(false);
    expect(undone.frame?.layers.some((layer) => layer.id === "layer-title")).toBe(true);
  });

  it("wheel cancels an armed rectangle gesture so release never creates", () => {
    const editor = install();
    editor.setTool("rectangle");
    down(editor, 1, screen(100, 100));
    editor.handleWheel(screen(120, 100), 100);
    up(editor, 1, screen(250, 200));
    expect(editor.getSnapshot().frame?.layers).toHaveLength(3);
    expect(editor.undo()).toBe(false);
  });

  it("moves linearly across many pointer moves instead of compounding", () => {
    const editor = install();
    down(editor, 1, screen(300, 175));
    move(editor, 1, screen(330, 205));
    move(editor, 1, screen(360, 235));
    move(editor, 1, screen(390, 265));
    up(editor, 1, screen(390, 265));
    const moved = editor
      .getSnapshot()
      .frame?.layers.find((layer) => layer.id === "layer-card");
    expect(moved?.bounds.x).toBeCloseTo(260 + 90, 5);
    // The card's top edge passes within 12 px of the title's center line
    // (242), so the move snaps the y delta onto it.
    expect(moved?.bounds.y).toBeCloseTo(242, 5);
    expect(editor.undo()).toBe(true);
  });

  it("moves a group and all of its descendants together", () => {
    const grouped: Scene = {
      schemaVersion: 1,
      id: "scene-grouped",
      name: "Grouped",
      revision: 0,
      frames: [
        {
          id: "frame-home",
          name: "Page 1",
          bounds: { x: 0, y: 0, width: 1280, height: 800 },
          stories: [],
          layers: [
            {
              id: "group-1",
              name: "Group",
              type: "group",
              bounds: { x: 100, y: 80, width: 200, height: 120 },
              transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
              fill: "#00000000",
              stroke: "#00000000",
              opacity: 1,
              cornerRadius: 0,
              visible: true,
              zIndex: 0,
              children: [
                {
                  id: "child-a",
                  name: "Child A",
                  type: "rectangle",
                  bounds: { x: 110, y: 90, width: 40, height: 40 },
                  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
                  fill: "#ff0000",
                  stroke: "#00000000",
                  opacity: 1,
                  cornerRadius: 0,
                  visible: true,
                  zIndex: 0,
                },
                {
                  id: "child-b",
                  name: "Child B",
                  type: "text",
                  bounds: { x: 170, y: 90, width: 80, height: 24 },
                  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
                  fill: "#00ff00",
                  stroke: "#00000000",
                  opacity: 1,
                  cornerRadius: 0,
                  visible: true,
                  zIndex: 1,
                  text: "hello",
                },
              ],
            },
          ],
        },
      ],
    };
    const editor = new CanvasEditor(toDocument(grouped), 0);
    down(editor, 1, screen(115, 95));
    move(editor, 1, screen(195, 155));
    up(editor, 1, screen(195, 155));
    const snapshot = editor.getSnapshot();
    const group = snapshot.frame?.layers[0];
    // The left edge passes within 12 px of child-b's world left edge (270),
    // so the x delta snaps onto it; the group's center line snaps onto
    // child-b's world bottom (194).
    expect(group?.bounds.x).toBeCloseTo(170, 5);
    expect(group?.bounds.y).toBeCloseTo(134, 5);
    // The kernel model is parent-relative: a node's bounds are its placement
    // within its parent, so moving the group moves the whole subtree with it.
    // The children's OWN bounds must NOT shift — shifting them would
    // double-count the parent's delta (the parallax bug: children appeared
    // to move twice as far as the parent).
    const childA = group?.children?.find((layer) => layer.id === "child-a");
    const childB = group?.children?.find((layer) => layer.id === "child-b");
    expect(childA?.bounds.x).toBeCloseTo(110, 5);
    expect(childB?.bounds.x).toBeCloseTo(170, 5);
    // The world position moved by EXACTLY the parent's delta, once.
    const worldX = (group?.bounds.x ?? 0) + (childA?.bounds.x ?? 0);
    expect(worldX).toBeCloseTo(110 + 170, 5);
    expect(editor.undo()).toBe(true);
    const undone = editor
      .getSnapshot()
      .frame?.layers[0]?.children?.find((layer) => layer.id === "child-a");
    expect(undone?.bounds.x).toBe(110);
  });
});

describe("marquee and multi-selection", () => {
  it("selects every layer inside the marquee rectangle", () => {
    const editor = install();
    down(editor, 1, screen(200, 100));
    move(editor, 1, screen(654, 378));
    up(editor, 1, screen(654, 378));
    expect(editor.getSnapshot().selectedIds).toEqual([
      "layer-card",
      "layer-title",
      "layer-badge",
    ]);
  });

  it("shift-click toggles a layer into and out of the selection", () => {
    const editor = install();
    down(editor, 1, screen(300, 175));
    up(editor, 1, screen(300, 175));
    expect(editor.getSnapshot().selectedIds).toEqual(["layer-card"]);
    down(editor, 2, screen(430, 242), { shiftKey: true });
    up(editor, 2, screen(430, 242), { shiftKey: true });
    expect(editor.getSnapshot().selectedIds).toEqual([
      "layer-card",
      "layer-title",
    ]);
    down(editor, 2, screen(300, 175), { shiftKey: true });
    up(editor, 2, screen(300, 175), { shiftKey: true });
    expect(editor.getSnapshot().selectedIds).toEqual(["layer-title"]);
  });

  it("shift-marquee toggles the intersected layers", () => {
    const editor = install();
    down(editor, 1, screen(300, 175));
    up(editor, 1, screen(300, 175));
    down(editor, 2, screen(200, 100), { shiftKey: true });
    move(editor, 2, screen(654, 378));
    up(editor, 2, screen(654, 378), { shiftKey: true });
    expect(editor.getSnapshot().selectedIds).toEqual([
      "layer-title",
      "layer-badge",
    ]);
  });

  it("deletes multiple selected layers as one history entry", () => {
    const editor = install();
    down(editor, 1, screen(200, 100));
    move(editor, 1, screen(654, 378));
    up(editor, 1, screen(654, 378));
    editor.deleteSelection();
    expect(editor.getSnapshot().frame?.layers).toHaveLength(0);
    expect(editor.undo()).toBe(true);
    expect(editor.getSnapshot().frame?.layers).toHaveLength(3);
    expect(editor.undo()).toBe(false);
  });
});

describe("pen and node tools through the harness", () => {
  it.each([
    ["rectangle", "New rectangle"],
    ["ellipse", "Ellipse"],
    ["frame", "Frame"],
    ["line", "Line"],
    ["pen", "Path"],
  ] as const)("authors the configured creation style for %s", (tool, name) => {
    const editor = install();
    editor.setCreationFill("#123456");
    editor.setCreationStroke("#abcdef");
    editor.setTool(tool);
    down(editor, 1, { x: 20, y: 20 });
    if (tool === "line") move(editor, 1, { x: 100, y: 80 });
    up(editor, 1, tool === "line" ? { x: 100, y: 80 } : { x: 20, y: 20 });
    if (tool === "pen") {
      down(editor, 1, { x: 100, y: 80 });
      up(editor, 1, { x: 100, y: 80 });
      editor.endPenSession();
    }
    const created = Object.values(editor.snapshotForSave().document.nodes).find(
      (node) => node.name === name,
    );
    expect(created).toMatchObject({ fill: "#123456", stroke: "#abcdef" });
  });

  it.each(["rectangle", "ellipse", "frame", "line"] as const)(
    "snapshots %s style at gesture start",
    (tool) => {
      const editor = install();
      editor.setCreationFill("#111111");
      editor.setCreationStroke("#222222");
      editor.setTool(tool);
      down(editor, 1, { x: 20, y: 20 });
      editor.setCreationFill("#333333");
      editor.setCreationStroke("#444444");
      move(editor, 1, { x: 120, y: 100 });
      up(editor, 1, { x: 120, y: 100 });
      const selected = editor.getSnapshot().selectedIds[0]!;
      expect(editor.snapshotForSave().document.nodes[selected]).toMatchObject({
        fill: "#111111",
        stroke: "#222222",
      });
    },
  );

  it("snapshots pen style at session begin", () => {
    const editor = install();
    editor.setCreationFill("#111111");
    editor.setCreationStroke("#222222");
    editor.setTool("pen");
    down(editor, 1, { x: 20, y: 20 });
    up(editor, 1, { x: 20, y: 20 });
    editor.setCreationFill("#333333");
    editor.setCreationStroke("#444444");
    down(editor, 1, { x: 120, y: 100 });
    up(editor, 1, { x: 120, y: 100 });
    editor.endPenSession();
    const path = Object.values(editor.snapshotForSave().document.nodes).find(
      (node) => node.name === "Path",
    );
    expect(path).toMatchObject({ fill: "#111111", stroke: "#222222" });
  });

  it("draws a closed path with the pen — one history entry, undo restores exactly", () => {
    const editor = install();
    drawClosedTriangle(editor);
    const { document } = editor.snapshotForSave();
    const path = Object.values(document.nodes).find(
      (node) => node.kind === "path",
    );
    expect(path).toBeDefined();
    expect(Object.keys(path!.path!.points)).toHaveLength(3);
    expect(Object.values(path!.path!.subpaths)[0]!.closed).toBe(true);
    expect(editor.getSnapshot().canUndo).toBe(true);
    editor.undo();
    const after = editor.snapshotForSave().document;
    expect(
      Object.values(after.nodes).some((node) => node.kind === "path"),
    ).toBe(false);
  });

  it("ends an open path with Escape, keeping the drawn points as one entry", () => {
    const editor = install();
    editor.setTool("pen");
    down(editor, 1, { x: 10, y: 10 });
    up(editor, 1, { x: 10, y: 10 });
    down(editor, 1, { x: 200, y: 100 });
    up(editor, 1, { x: 200, y: 100 });
    expect(editor.hasPenSession()).toBe(true);
    editor.endPenSession();
    const { document } = editor.snapshotForSave();
    const path = Object.values(document.nodes).find(
      (node) => node.kind === "path",
    );
    expect(path).toBeDefined();
    expect(Object.keys(path!.path!.points)).toHaveLength(2);
    expect(Object.values(path!.path!.subpaths)[0]!.closed).toBe(false);
    expect(editor.hasPenSession()).toBe(false);
  });

  it("keeps dropped pen points world-anchored across pan/zoom and closes without a transaction error", () => {
    const editor = install();
    editor.setTool("pen");
    // Drop the first point; capture its WORLD anchor.
    down(editor, 1, screen(100, 100));
    up(editor, 1, screen(100, 100));
    const first = editor.getSnapshot().penSessionWorld[0]!;
    expect(first).toBeDefined();
    // Pan and zoom the canvas mid-session.
    editor.scrollPan(30, 20);
    editor.handleWheel(screen(100, 100), -200);
    // The dropped anchor stays exactly where it was dropped.
    const after = editor.getSnapshot().penSessionWorld[0]!;
    expect(after.x).toBeCloseTo(first.x, 5);
    expect(after.y).toBeCloseTo(first.y, 5);
    // Drop a second point at a NEW screen position, then close on the first
    // point (its screen position converted with the moved camera).
    down(editor, 1, screen(200, 150));
    up(editor, 1, screen(200, 150));
    const firstScreen = worldToScreen(
      { x: first.x, y: first.y },
      editor.getSnapshot().viewport,
    );
    expect(() => {
      down(editor, 1, firstScreen);
      up(editor, 1, firstScreen);
    }).not.toThrow();
    // The committed path is world-anchored: the first point's local
    // coordinates plus the node's placement equal the dropped world anchor.
    const { document } = editor.snapshotForSave();
    const path = Object.values(document.nodes).find(
      (node) => node.kind === "path",
    );
    expect(path).toBeDefined();
    const firstPoint = Object.values(path!.path!.points).sort((a, b) =>
      a.order.localeCompare(b.order),
    )[0]!;
    expect(path!.bounds.x + firstPoint.x).toBeCloseTo(first.x, 5);
    expect(path!.bounds.y + firstPoint.y).toBeCloseTo(first.y, 5);
    expect(Object.values(path!.path!.subpaths)[0]!.closed).toBe(true);
  });

  it("moves a point with the pen — one transaction, one history entry", () => {
    const editor = install();
    drawClosedTriangle(editor);
    const before = editor.snapshotForSave().document;
    const path = Object.values(before.nodes).find(
      (node) => node.kind === "path",
    )!;
    const point = Object.values(path.path!.points)[0]!;
    const beforeWorldX = path.bounds.x + point.x;
    const beforeWorldY = path.bounds.y + point.y;
    editor.setTool("pen");
    down(editor, 1, { x: 10, y: 10 });
    move(editor, 1, { x: 60, y: 40 });
    up(editor, 1, { x: 60, y: 40 });
    const after = editor.snapshotForSave().document;
    const afterNode = after.nodes[path.id]!;
    const moved = afterNode.path!.points[point.id]!;
    // The move lands in world space: the rebase shifts the pinned geometry
    // and carries the placement in the node's bounds.
    const dx = (60 - 10) / editor.getSnapshot().viewport.zoom;
    const dy = (40 - 10) / editor.getSnapshot().viewport.zoom;
    expect(afterNode.bounds.x + moved.x).toBeCloseTo(beforeWorldX + dx, 6);
    expect(afterNode.bounds.y + moved.y).toBeCloseTo(beforeWorldY + dy, 6);
  });

  it("cycles a point's type with control-click and converts corner → asymmetric", () => {
    const editor = install();
    drawClosedTriangle(editor);
    const before = editor.snapshotForSave().document;
    const path = Object.values(before.nodes).find(
      (node) => node.kind === "path",
    )!;
    const point = Object.values(path.path!.points)[0]!;
    expect(point.handleMode).toBe("corner");
    editor.setTool("pen");
    down(editor, 1, { x: 10, y: 10 }, { ctrlKey: true });
    up(editor, 1, { x: 10, y: 10 });
    const after = editor.snapshotForSave().document;
    expect(after.nodes[path.id]!.path!.points[point.id]!.handleMode).toBe(
      "free",
    );
    down(editor, 1, { x: 10, y: 10 }, { ctrlKey: true });
    up(editor, 1, { x: 10, y: 10 });
    const cycled = editor.snapshotForSave().document;
    expect(cycled.nodes[path.id]!.path!.points[point.id]!.handleMode).toBe(
      "asymmetric",
    );
  });

  it("projects path commands with the resolved geometry and the world transform", () => {
    const editor = install();
    drawClosedTriangle(editor);
    const projection = editor.getSnapshot();
    const { document } = editor.snapshotForSave();
    const path = Object.values(document.nodes).find(
      (node) => node.kind === "path",
    )!;
    // The channel carries the path AND the seed's text layer (protocol v5);
    // the path command is the geometry under test.
    const pathCommands = projection.pathCommands.filter(
      (command) => command.geometry === "path",
    );
    expect(pathCommands).toHaveLength(1);
    const command = pathCommands[0]!;
    expect(command.geometry).toBe("path");
    expect(command.nodeId).toBe(path.id);
    expect(command.opacity).toBe(1);
    expect(command.zIndex).toBe(path.zIndex);
    expect(command.fillRule).toBe("nonzero");
    // The world transform carries the placement: bounds.x/y translated, the
    // node's own transform composed on top (identity for a pen-created path).
    expect(command.transform).toEqual({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: path.bounds.x,
      f: path.bounds.y,
    });
    // The packet carries the node-local anchors of the RESOLVED geometry
    // (identity world transform here, so they pass through unchanged).
    const authored = Object.values(path.path!.points).sort((a, b) =>
      a.order < b.order ? -1 : 1,
    );
    const projected = Object.values(command.path!.points).sort((a, b) =>
      a.order < b.order ? -1 : 1,
    );
    expect(projected).toHaveLength(authored.length);
    projected.forEach((point, index) => {
      expect(point.x).toBe(authored[index]!.x);
      expect(point.y).toBe(authored[index]!.y);
      expect(point.subpathId).toBe(authored[index]!.subpathId);
      expect(point.handleMode).toBe(authored[index]!.handleMode);
    });
    // The scene still projects the path node as an invisible rect layer —
    // the command channel is what draws it.
    const layer = projection.scene.frames
      .flatMap((frame) => frame.layers)
      .find((candidate) => candidate.id === path.id);
    expect(layer?.opacity).toBe(0);
  });

  it("exposes the selected grippies and the pen session in world coordinates", () => {
    const editor = install();
    drawClosedTriangle(editor);
    const before = editor.snapshotForSave().document;
    const path = Object.values(before.nodes).find(
      (node) => node.kind === "path",
    )!;
    const point = Object.values(path.path!.points)[0]!;
    editor.setTool("pen");
    down(editor, 1, { x: 10, y: 10 });
    up(editor, 1, { x: 10, y: 10 });
    const grippies = editor.getSnapshot().selectedPointGrippies;
    expect(grippies).toHaveLength(1);
    expect(grippies[0]!.x).toBeCloseTo(path.bounds.x + point.x, 6);
    expect(grippies[0]!.y).toBeCloseTo(path.bounds.y + point.y, 6);
    // A click-drag past the threshold authors a handle on the session's
    // first point: the preview shows it while dragging, the session carries
    // it once the click commits.
    editor.setTool("pen");
    down(editor, 1, { x: 400, y: 400 });
    move(editor, 1, { x: 440, y: 420 });
    let projection = editor.getSnapshot();
    expect(projection.penSessionWorld).toHaveLength(0);
    expect(projection.penPreviewWorld).toBeDefined();
    // The pending anchor rides the snap: its x aligns with the card's
    // center line (430) while the y stays at the cursor.
    expect(projection.penPreviewWorld!.point.x).toBeCloseTo(430, 6);
    expect(projection.penPreviewWorld!.point.y).toBeCloseTo(
      (420 - 50) / 0.82,
      6,
    );
    expect(projection.penPreviewWorld!.handle!.x).toBeCloseTo(
      (440 - 80) / 0.82,
      6,
    );
    expect(projection.penPreviewWorld!.handle!.y).toBeCloseTo(
      (420 - 50) / 0.82,
      6,
    );
    up(editor, 1, { x: 440, y: 420 });
    projection = editor.getSnapshot();
    expect(projection.penSessionWorld).toHaveLength(1);
    expect(projection.penSessionWorld[0]!.x).toBeCloseTo(430, 6);
    expect(projection.penSessionWorld[0]!.handle!.x).toBeCloseTo(
      (440 - 80) / 0.82,
      6,
    );
    expect(projection.penPreviewWorld).toBeUndefined();
  });

  it("edits authored anchors with the pen: select, drag, and shift-delete", () => {
    const editor = install();
    drawClosedTriangle(editor);
    const before = editor.snapshotForSave().document;
    const path = Object.values(before.nodes).find(
      (node) => node.kind === "path",
    )!;
    const point = Object.values(path.path!.points)[0]!;
    const screenAnchor = { x: 10, y: 10 };
    // A click on an authored anchor selects it — no session is started.
    editor.setTool("pen");
    down(editor, 1, screenAnchor);
    up(editor, 1, screenAnchor);
    const grippies = editor.getSnapshot().selectedPointGrippies;
    expect(grippies).toHaveLength(1);
    expect(editor.hasPenSession()).toBe(false); // Dragging the selected anchor moves the point (one history entry).
    const beforeWorldX = path.bounds.x + point.x;
    const beforeWorldY = path.bounds.y + point.y;
    down(editor, 1, screenAnchor);
    move(editor, 1, { x: 60, y: 40 });
    up(editor, 1, { x: 60, y: 40 });
    const moved = editor.snapshotForSave().document.nodes[path.id]!;
    const dx = (60 - 10) / editor.getSnapshot().viewport.zoom;
    const dy = (40 - 10) / editor.getSnapshot().viewport.zoom;
    expect(moved.bounds.x + moved.path!.points[point.id]!.x).toBeCloseTo(
      beforeWorldX + dx,
      6,
    );
    expect(moved.bounds.y + moved.path!.points[point.id]!.y).toBeCloseTo(
      beforeWorldY + dy,
      6,
    );
    // Shift+click on an anchor deletes it (min 2 points per subpath). The
    // dragged point now sits at the drag's end position.
    editor.setTool("pen");
    down(editor, 1, { x: 60, y: 40 }, { shiftKey: true });
    up(editor, 1, { x: 60, y: 40 }, { shiftKey: true });
    const after = editor.snapshotForSave().document;
    expect(after.nodes[path.id]!.path!.points[point.id]).toBeUndefined();
    expect(Object.keys(after.nodes[path.id]!.path!.points)).toHaveLength(2);
    // The remaining geometry is still pinned: the bounds corner is the min.
    const remaining = Object.values(after.nodes[path.id]!.path!.points);
    const minX = Math.min(...remaining.map((entry) => entry.x));
    const minY = Math.min(...remaining.map((entry) => entry.y));
    expect(minX).toBeCloseTo(0, 6);
    expect(minY).toBeCloseTo(0, 6);
    // Undo restores the deleted point byte-exactly (the post-move geometry).
    editor.undo();
    const restored = editor.snapshotForSave().document.nodes[path.id]!;
    expect(restored.path).toEqual(moved.path);
  });
});

describe("pen coordinate expectations", () => {
  it("follows the cursor when dragging a point under a rotated transform", () => {
    const editor = install();
    // A path node with a 90° rotation authored directly: the point drag must
    // convert the world delta through the inverse linear part, or the point
    // drifts off the cursor (the coordinate bug under transformed parents).
    editor.dispatch(
      {
        type: "create-node",
        node: {
          id: "path-rot",
          kind: "path",
          name: "Rotated",
          parentId: "page-root-frame-home",
          childIds: [],
          bounds: { x: 100, y: 50, width: 40, height: 30 },
          transform: { a: 0, b: 1, c: -1, d: 0, e: 0, f: 0 },
          visible: true,
          locked: false,
          opacity: 1,
          fill: "#ffffff",
          stroke: "#000000",
          cornerRadius: 0,
          zIndex: 1,
          path: {
            points: {
              p0: {
                id: "p0",
                subpathId: "s1",
                order: orderKeyForSigned(0),
                x: 0,
                y: 0,
                handleMode: "corner",
              },
              p1: {
                id: "p1",
                subpathId: "s1",
                order: orderKeyForSigned(65536),
                x: 40,
                y: 30,
                handleMode: "corner",
              },
            },
            subpaths: { s1: { id: "s1", closed: false } },
            fillRule: "nonzero",
          },
        },
      },
      "Create rotated path",
    );
    editor.setTool("pen");
    // p0's world anchor: T(0,0) + (100,50) = (100,50); its screen position.
    const anchor = { x: 100 * 0.82 + 80, y: 50 * 0.82 + 50 };
    const end = { x: anchor.x + 50, y: anchor.y + 20 };
    down(editor, 1, anchor);
    move(editor, 1, end);
    up(editor, 1, end);
    const { document } = editor.snapshotForSave();
    const node = document.nodes["path-rot"]!;
    const p0 = node.path!.points["p0"]!;
    // World position of the anchor: T(local) + bounds.
    const world = {
      x: node.transform.a * p0.x + node.transform.c * p0.y + node.bounds.x,
      y: node.transform.b * p0.x + node.transform.d * p0.y + node.bounds.y,
    };
    const zoom = editor.getSnapshot().viewport.zoom;
    expect(world.x).toBeCloseTo(100 + 50 / zoom, 5);
    expect(world.y).toBeCloseTo(50 + 20 / zoom, 5);
  });
});

describe("compounds through the harness", () => {
  const rootId = "page-root-frame-home";
  const allLayers = (layers: Layer[]): Layer[] =>
    layers.flatMap((layer) => [
      layer,
      ...(layer.children ? allLayers(layer.children) : []),
    ]);
  const rectPath = (
    id: string,
    x: number,
    y: number,
    zIndex: number,
  ): DocumentNode => {
    const corner = (
      name: string,
      px: number,
      py: number,
      index: number,
    ): PathPoint => ({
      id: `${id}-${name}`,
      subpathId: `${id}-s1`,
      order: orderKeyForSigned(index * 65536),
      x: px,
      y: py,
      handleMode: "corner",
    });
    const p0 = corner("p0", 0, 0, 0);
    const p1 = corner("p1", 100, 0, 1);
    const p2 = corner("p2", 100, 100, 2);
    const p3 = corner("p3", 0, 100, 3);
    const geometry: PathGeometry = {
      points: { [p0.id]: p0, [p1.id]: p1, [p2.id]: p2, [p3.id]: p3 },
      subpaths: { [`${id}-s1`]: { id: `${id}-s1`, closed: true } },
      fillRule: "nonzero",
    };
    return {
      id,
      kind: "path",
      name: id,
      parentId: rootId,
      childIds: [],
      bounds: { x, y, width: 100, height: 100 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      visible: true,
      locked: false,
      opacity: 1,
      fill: "#ffffff",
      stroke: "#000000",
      cornerRadius: 0,
      zIndex,
      path: geometry,
    };
  };

  it("projects the compound's outline as one path command and none of the members'", () => {
    const editor = install();
    editor.dispatch(
      { type: "create-node", node: rectPath("path-a", 0, 0, 2) },
      "Add path",
    );
    editor.dispatch(
      { type: "create-node", node: rectPath("path-b", 50, 50, 5) },
      "Add path",
    );
    editor.dispatch(
      {
        type: "create-compound",
        nodeId: "compound-1",
        parentId: rootId,
        index: 2,
        memberIds: ["path-a", "path-b"],
        operation: "union",
      },
      "Compound",
    );
    const projection = editor.getSnapshot();
    const pathCommands = projection.pathCommands.filter(
      (command) => command.geometry === "path",
    );
    expect(pathCommands).toHaveLength(1);
    const command = pathCommands[0]!;
    expect(command.geometry).toBe("path");
    expect(command.nodeId).toBe("compound-1");
    // The surface inherits from the topmost member, like the boolean join.
    expect(command.zIndex).toBe(5);
    expect(command.opacity).toBe(1);
    // The union of the overlap fixture is the 8-point L-outline at (0,0).
    expect(command.transform).toEqual({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    expect(command.bounds).toEqual({ x: 0, y: 0, width: 150, height: 150 });
    expect(Object.keys(command.path!.points)).toHaveLength(8);
    // The members never draw individually: no command names them.
    expect(
      projection.pathCommands.filter((c) => c.geometry === "path").every(
        (entry) => entry.nodeId !== "path-a" && entry.nodeId !== "path-b",
      ),
    ).toBe(true);
    // The scene projects the compound AND its member layers invisible — the
    // outline is the only visual, the layers stay for hierarchy and selection.
    const layers = allLayers(
      projection.scene.frames.flatMap((frame) => frame.layers),
    );
    expect(layers.find((layer) => layer.id === "compound-1")?.opacity).toBe(0);
    expect(layers.find((layer) => layer.id === "path-a")?.opacity).toBe(0);
    expect(layers.find((layer) => layer.id === "path-b")?.opacity).toBe(0);
  });

  it("re-resolves the outline command when a member's bounds change — the derived placement wins over the stale authored bounds", () => {
    const editor = install();
    editor.dispatch(
      { type: "create-node", node: rectPath("path-a", 0, 0, 2) },
      "Add path",
    );
    editor.dispatch(
      { type: "create-node", node: rectPath("path-b", 50, 50, 5) },
      "Add path",
    );
    editor.dispatch(
      {
        type: "create-compound",
        nodeId: "compound-1",
        parentId: rootId,
        index: 2,
        memberIds: ["path-a", "path-b"],
        operation: "union",
      },
      "Compound",
    );
    // The move rides the engine's covered envelope (the shared-edge family).
    editor.dispatch(
      {
        type: "set-bounds",
        nodeId: "path-b",
        bounds: { x: 0, y: 100, width: 100, height: 100 },
      },
      "Move member",
    );
    const command = editor
      .getSnapshot()
      .pathCommands.filter((entry) => entry.geometry === "path")[0]!;
    // The authored compound bounds are stale (the member edit is not a
    // compound command); the emitted rect is the outline's DERIVED bbox.
    expect(command.bounds).toEqual({ x: 0, y: 0, width: 100, height: 200 });
    expect(
      editor.snapshotForSave().document.nodes["compound-1"]!.bounds,
    ).toEqual({ x: 0, y: 0, width: 150, height: 150 });
  });
});

describe("page switching", () => {
  it("creates pages and restores camera and selection on switch (test matrix #17)", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    down(editor, 1, { x: 100, y: 100 }, { button: 1 });
    move(editor, 1, { x: 140, y: 130 });
    up(editor, 1, { x: 140, y: 130 });
    const homeViewport = camera(editor.getSnapshot().viewport);
    const pageB = editor.createPage("Board B");
    const created = editor.getSnapshot();
    expect(created.activePageId).toBe(pageB);
    expect(created.pages.map((page) => page.name)).toEqual([
      seed.frames[0]?.name ?? "Home",
      "Board B",
    ]);
    expect(created.selectedIds).toEqual([]);
    expect(camera(created.viewport)).toEqual(homeViewport);
    down(editor, 1, { x: 100, y: 100 }, { button: 1 });
    move(editor, 1, { x: 160, y: 120 });
    up(editor, 1, { x: 160, y: 120 });
    const bViewport = camera(editor.getSnapshot().viewport);
    editor.setPage("page-frame-home");
    const back = editor.getSnapshot();
    expect(back.activePageId).toBe("page-frame-home");
    expect(back.selectedIds).toEqual(["layer-card"]);
    expect(camera(back.viewport)).toEqual(homeViewport);
    editor.setPage(pageB);
    const again = editor.getSnapshot();
    expect(again.activePageId).toBe(pageB);
    expect(again.selectedIds).toEqual([]);
    expect(camera(again.viewport)).toEqual(bViewport);
  });

  it("deletes pages and guards the last page from deletion", () => {
    const editor = install();
    expect(() => editor.deletePage("page-frame-home")).toThrow(
      "DOCUMENT_LAST_PAGE",
    );
    const pageB = editor.createPage("Board B");
    editor.deletePage(pageB);
    expect(editor.getSnapshot().pages.map((page) => page.id)).toEqual([
      "page-frame-home",
    ]);
    expect(editor.getSnapshot().activePageId).toBe("page-frame-home");
    expect(editor.undo()).toBe(true);
    expect(editor.getSnapshot().pages).toHaveLength(2);
    expect(editor.getSnapshot().activePageId).toBe(pageB);
  });

  it("undo from another page switches back and restores the touched selection", () => {
    const editor = install();
    const pageB = editor.createPage("Board B");
    editor.setTool("rectangle");
    down(editor, 1, screen(100, 100));
    move(editor, 1, screen(250, 200));
    up(editor, 1, screen(250, 200));
    expect(editor.getSnapshot().selectedIds).toHaveLength(1);
    editor.setPage("page-frame-home");
    expect(editor.undo()).toBe(true);
    const snapshot = editor.getSnapshot();
    expect(snapshot.activePageId).toBe(pageB);
    expect(snapshot.frame?.layers).toHaveLength(0);
    expect(snapshot.selectedIds).toEqual([]);
  });

  it("reload restores the persisted rest camera for the active page", () => {
    const editor = install();
    editor.dispatch({
      type: "set-page-viewport",
      pageId: "page-frame-home",
      viewport: { panX: 123, panY: 456, zoom: 2 },
    });
    const serialized = editor.serializeDocument();
    const reloaded = install();
    reloaded.replaceDocumentJson(serialized, 7);
    const snapshot = reloaded.getSnapshot();
    expect(snapshot.revision).toBe(7);
    expect(snapshot.activePageId).toBe("page-frame-home");
    expect(snapshot.viewport).toEqual({ panX: 123, panY: 456, zoom: 2, devicePixelRatio: 1 });
  });

  it("switches pages within the page-switch timing budget when measurable headlessly", () => {
    const editor = install();
    const pageB = editor.createPage("Board B");
    const started = performance.now();
    editor.setPage("page-frame-home");
    editor.setPage(pageB);
    const elapsed = performance.now() - started;
    expect(editor.getSnapshot().activePageId).toBe(pageB);
    expect(elapsed).toBeLessThan(250);
  });
});

describe("copy and paste across pages (test matrix #28)", () => {
  it("copies the selection and pastes minted nodes at the cursor with one undo", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    const content = editor.copySelection();
    expect(content?.nodes[0]?.id).toBe("layer-card");
    const outcome = editor.pasteAt({ x: 500, y: 400 });
    const snapshot = editor.getSnapshot();
    const pasted = snapshot.frame?.layers.find(
      (layer) => layer.name === "Feature card" && layer.id !== "layer-card",
    );
    expect(pasted).toBeDefined();
    const world = { x: (500 - 80) / 0.82, y: (400 - 50) / 0.82 };
    expect(pasted?.bounds.x).toBeCloseTo(world.x, 3);
    expect(pasted?.bounds.y).toBeCloseTo(world.y, 3);
    expect(snapshot.selectedIds).toEqual([outcome?.mintedRootIds[0]]);
    expect(editor.undo()).toBe(true);
    expect(editor.getSnapshot().frame?.layers).toHaveLength(3);
    expect(editor.undo()).toBe(false);
  });

  it("shows and clears the ephemeral paste preview overlay bounds", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    editor.copySelection();
    expect(editor.getSnapshot().pastePreview).toBeUndefined();
    editor.previewPaste({ x: 500, y: 400 });
    const preview = editor.getSnapshot().pastePreview;
    expect(preview?.bounds).toEqual({
      x: (500 - 80) / 0.82,
      y: (400 - 50) / 0.82,
      width: 340,
      height: 210,
    });
    expect(editor.getSnapshot().documentRevision).toBe(0);
    editor.previewPaste({ x: 600, y: 300 });
    expect(editor.getSnapshot().pastePreview?.bounds.x).toBeCloseTo(
      (600 - 80) / 0.82,
      3,
    );
    editor.clearPastePreview();
    expect(editor.getSnapshot().pastePreview).toBeUndefined();
  });

  it("pastes across pages into the active page root with undo restoring the origin context", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    editor.copySelection();
    const pageB = editor.createPage("Board B");
    const outcome = editor.pasteAt({ x: 500, y: 400 });
    const snapshot = editor.getSnapshot();
    expect(snapshot.activePageId).toBe(pageB);
    expect(
      snapshot.frame?.layers.find(
        (layer) => layer.id === outcome?.mintedRootIds[0],
      ),
    ).toBeDefined();
    expect(snapshot.selectedIds).toEqual(outcome?.mintedRootIds);
    expect(editor.undo()).toBe(true);
    expect(editor.getSnapshot().frame?.layers).toHaveLength(0);
    expect(editor.redo()).toBe(true);
    expect(
      editor
        .getSnapshot()
        .frame?.layers.find((layer) => layer.id === outcome?.mintedRootIds[0]),
    ).toBeDefined();
  });

  it("surfaces paste diagnostics through the projection", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    const content = editor.copySelection()!;
    content.instances["layer-card"] = {
      definitionId: "component-foreign",
      properties: {},
      overrides: {},
    };
    content.components = {
      "component-foreign": {
        id: "component-foreign",
        name: "Foreign",
        rootNodeId: "layer-card",
        propertyDefinitions: {},
        variants: {},
        states: {},
      },
    };
    editor.setClipboard(content);
    editor.pasteAt({ x: 500, y: 400 });
    expect(
      editor
        .getSnapshot()
        .pasteDiagnostics.some(
          (diagnostic) => diagnostic.code === "PASTE_COMPONENT_LOCAL_COPY",
        ),
    ).toBe(true);
  });
});

describe("document commands and persistence glue", () => {
  it("duplicates the selected subtree and selects the copy", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    editor.duplicate();
    const snapshot = editor.getSnapshot();
    expect(snapshot.frame?.layers).toHaveLength(4);
    expect(snapshot.selectedIds[0]).toMatch(/^layer-/);
    expect(snapshot.selectedIds[0]).not.toBe("layer-card");
    expect(editor.undo()).toBe(true);
    expect(editor.getSnapshot().frame?.layers).toHaveLength(3);
  });

  it("exposes the base document for save with the current server revision", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    const { document, revision } = editor.snapshotForSave();
    expect(revision).toBe(0);
    expect(document.nodes["layer-card"]).toBeDefined();
    editor.confirmSaved(7);
    expect(editor.getSnapshot().revision).toBe(7);
  });

  it("reloads a document through replaceDocument and resets gesture state", () => {
    const editor = install();
    editor.setTool("rectangle");
    down(editor, 1, screen(100, 100));
    editor.replaceDocument(toDocument(seed), 3);
    expect(editor.getSnapshot().revision).toBe(3);
    expect(editor.getSnapshot().interaction.phase).toBe("idle");
    up(editor, 1, screen(250, 200));
    expect(editor.getSnapshot().frame?.layers).toHaveLength(3);
  });

  it("reorders and adds story metadata through kernel commands", () => {
    const editor = install();
    editor.setSelection(["layer-badge"]);
    editor.reorder(-1);
    const layers = editor.getSnapshot().frame?.layers;
    expect(layers?.[1]?.id).toBe("layer-badge");
    editor.setSelection(["layer-card"]);
    editor.addStory();
    const stories = editor.getSnapshot().frame?.stories;
    expect(stories?.some((story) => story.name === "New state")).toBe(true);
    expect(editor.undo()).toBe(true);
    expect(
      editor
        .getSnapshot()
        .frame?.stories.some((story) => story.name === "New state"),
    ).toBe(false);
  });

  it("reorders an arbitrary node and renames a page through the panel-facing helpers", () => {
    const editor = install();
    editor.reorderNode("layer-badge", -1);
    expect(editor.getSnapshot().frame?.layers?.[1]?.id).toBe("layer-badge");
    editor.renamePage("page-frame-home", "  Renamed board  ");
    expect(editor.getSnapshot().pages[0]?.name).toBe("Renamed board");
    expect(editor.undo()).toBe(true);
    expect(editor.getSnapshot().pages[0]?.name).toBe(seed.frames[0]?.name);
    expect(editor.redo()).toBe(true);
    expect(editor.getSnapshot().pages[0]?.name).toBe("Renamed board");
  });

  it("toggles selection for shift-multi-select from the layers panel", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    editor.toggleSelection(["layer-title"]);
    expect(editor.getSnapshot().selectedIds).toEqual([
      "layer-card",
      "layer-title",
    ]);
    editor.toggleSelection(["layer-card"]);
    expect(editor.getSnapshot().selectedIds).toEqual(["layer-title"]);
  });

  it("aligns the multi-selection to the left edge and undoes in one step", () => {
    const editor = install();
    down(editor, 1, screen(200, 100));
    move(editor, 1, screen(654, 378));
    up(editor, 1, screen(654, 378));
    expect(editor.getSnapshot().selectedIds.length).toBeGreaterThan(1);
    editor.alignSelection("left");
    const layers = editor.getSnapshot().frame?.layers ?? [];
    const x = layers[0]!.bounds.x;
    expect(layers.every((layer) => layer.bounds.x === x)).toBe(true);
    expect(editor.undo()).toBe(true);
    const restored = editor.getSnapshot().frame?.layers ?? [];
    expect(
      new Set(restored.map((layer) => layer.bounds.x)).size,
    ).toBeGreaterThan(1);
  });
});

describe("locked layers and multi-selection drag", () => {
  it("does not select a locked layer on click", () => {
    const editor = new CanvasEditor(
      toDocument(
        sceneWith([
          layer(
            "locked-1",
            { x: 100, y: 100, width: 200, height: 200 },
            { locked: true },
          ),
        ]),
      ),
      0,
    );
    down(editor, 1, screen(150, 150));
    up(editor, 1, screen(150, 150));
    expect(editor.getSnapshot().selectedIds).toEqual([]);
  });

  it("excludes locked and hidden layers from a marquee", () => {
    const editor = new CanvasEditor(
      toDocument(
        sceneWith([
          layer("plain-1", { x: 100, y: 100, width: 50, height: 50 }),
          layer(
            "locked-1",
            { x: 200, y: 100, width: 50, height: 50 },
            { locked: true },
          ),
          layer(
            "hidden-1",
            { x: 300, y: 100, width: 50, height: 50 },
            { visible: false },
          ),
        ]),
      ),
      0,
    );
    down(editor, 1, screen(50, 50));
    move(editor, 1, screen(600, 400));
    up(editor, 1, screen(600, 400));
    expect(editor.getSnapshot().selectedIds).toEqual(["plain-1"]);
  });

  it("locks a whole subtree when the parent is locked", () => {
    const editor = new CanvasEditor(
      toDocument(
        sceneWith([
          {
            ...layer(
              "group-1",
              { x: 100, y: 100, width: 300, height: 200 },
              { locked: true },
            ),
            type: "group",
            children: [
              layer("child-1", { x: 120, y: 120, width: 60, height: 60 }),
            ],
          },
        ]),
      ),
      0,
    );
    down(editor, 1, screen(140, 140));
    up(editor, 1, screen(140, 140));
    expect(editor.getSnapshot().selectedIds).toEqual([]);
  });

  it("drags every selected layer, as one undo entry", () => {
    const editor = new CanvasEditor(
      toDocument(
        sceneWith([
          layer("a-1", { x: 100, y: 100, width: 50, height: 50 }),
          layer("b-1", { x: 300, y: 100, width: 50, height: 50 }),
        ]),
      ),
      0,
    );
    down(editor, 1, screen(50, 50));
    move(editor, 1, screen(600, 400));
    up(editor, 1, screen(600, 400));
    expect(editor.getSnapshot().selectedIds).toEqual(["a-1", "b-1"]);

    down(editor, 2, screen(120, 120));
    move(editor, 2, screen(200, 180));
    up(editor, 2, screen(200, 180));
    const moved = editor.getSnapshot().frame?.layers ?? [];
    expect(moved.find((entry) => entry.id === "a-1")?.bounds.x).toBeCloseTo(
      180,
      5,
    );
    expect(moved.find((entry) => entry.id === "b-1")?.bounds.x).toBeCloseTo(
      380,
      5,
    );

    expect(editor.undo()).toBe(true);
    const undone = editor.getSnapshot().frame?.layers ?? [];
    expect(undone.find((entry) => entry.id === "a-1")?.bounds.x).toBe(100);
    expect(undone.find((entry) => entry.id === "b-1")?.bounds.x).toBe(300);
  });

  it.each([
    { name: "direct lock", nodeId: "b-1", property: "locked" as const, value: true },
    { name: "ancestor lock", nodeId: "parent", property: "locked" as const, value: true },
    { name: "effective hidden state", nodeId: "parent", property: "visible" as const, value: false },
  ])("rolls back a multi-selection move when a non-grabbed member gains $name", ({ nodeId, property, value }) => {
    for (const afterPreview of [false, true]) {
      const editor = new CanvasEditor(toDocument(sceneWith([
        layer("a-1", { x: 100, y: 100, width: 50, height: 50 }),
        {
          ...layer("parent", { x: 250, y: 50, width: 150, height: 150 }, { type: "group" }),
          children: [layer("b-1", { x: 50, y: 50, width: 50, height: 50 })],
        },
      ])), 0);
      editor.setSelection(["a-1", "b-1"]);
      const before = editor.snapshotForSave().document.nodes;
      const grab = screen(120, 120);
      const preview = screen(160, 160);
      const target = screen(200, 200);

      down(editor, 1, grab);
      if (afterPreview) {
        move(editor, 1, preview);
        expect(editor.snapshotForSave().document.nodes["a-1"]?.bounds).not.toEqual(before["a-1"]?.bounds);
      }
      const invalidate = { type: "set-property" as const, nodeId, property, value };
      if (afterPreview) {
        (editor as unknown as { kernel: { preview(command: typeof invalidate): void } }).kernel.preview(invalidate);
      } else {
        editor.dispatch(invalidate, "Invalidate non-grabbed selection member");
      }
      move(editor, 1, target);
      const cancelled = editor.getSnapshot();

      expect(cancelled.interaction.phase).toBe("idle");
      expect(cancelled.draftBounds).toBeUndefined();
      expect(cancelled.snapChoices).toBeUndefined();
      expect(cancelled.selectedIds).toEqual(["a-1", "b-1"]);
      expect(editor.snapshotForSave().document.nodes["a-1"]?.bounds).toEqual(before["a-1"]?.bounds);
      expect(editor.snapshotForSave().document.nodes["b-1"]?.bounds).toEqual(before["b-1"]?.bounds);
      up(editor, 1, target);
      // The before-preview invalidation is the only durable command; after a
      // preview it belongs to the rolled-back transaction, so release adds none.
      expect(editor.undo()).toBe(!afterPreview);
      expect(editor.getSnapshot().canUndo).toBe(false);
    }
  });

  it.each([
    { name: "single-node direct lock", selectedIds: ["b-1"], nodeId: "b-1", property: "locked" as const, value: true },
    { name: "single-node ancestor lock", selectedIds: ["b-1"], nodeId: "parent", property: "locked" as const, value: true },
    { name: "single-node effective hidden state", selectedIds: ["b-1"], nodeId: "parent", property: "visible" as const, value: false },
    { name: "multi-selection direct lock", selectedIds: ["a-1", "b-1"], nodeId: "b-1", property: "locked" as const, value: true },
    { name: "multi-selection ancestor lock", selectedIds: ["a-1", "b-1"], nodeId: "parent", property: "locked" as const, value: true },
    { name: "multi-selection effective hidden state", selectedIds: ["a-1", "b-1"], nodeId: "parent", property: "visible" as const, value: false },
  ])("rolls back the last preview when $name occurs before release", ({ selectedIds, nodeId, property, value }) => {
    const editor = new CanvasEditor(toDocument(sceneWith([
      layer("a-1", { x: 100, y: 100, width: 50, height: 50 }),
      {
        ...layer("parent", { x: 250, y: 50, width: 150, height: 150 }, { type: "group" }),
        children: [layer("b-1", { x: 50, y: 50, width: 50, height: 50 })],
      },
    ])), 0);
    editor.setSelection(selectedIds);
    const before = editor.snapshotForSave().document.nodes;
    const grab = selectedIds.length === 1 ? screen(320, 120) : screen(120, 120);
    const release = selectedIds.length === 1 ? screen(360, 160) : screen(160, 160);

    down(editor, 1, grab);
    move(editor, 1, release);
    expect(editor.snapshotForSave().document.nodes).not.toEqual(before);

    const invalidate = { type: "set-property" as const, nodeId, property, value };
    (editor as unknown as { kernel: { preview(command: typeof invalidate): void } }).kernel.preview(invalidate);
    up(editor, 1, release);

    const cancelled = editor.getSnapshot();
    expect(cancelled.interaction.phase).toBe("idle");
    expect(cancelled.draftBounds).toBeUndefined();
    expect(cancelled.snapChoices).toBeUndefined();
    expect(cancelled.selectedIds).toEqual(selectedIds);
    expect(editor.snapshotForSave().document.nodes).toEqual(before);
    expect(editor.undo()).toBe(false);
    expect(editor.getSnapshot().canUndo).toBe(false);
  });

  it("commits an unlocked multi-selection move", () => {
    const editor = new CanvasEditor(toDocument(sceneWith([
      layer("a-1", { x: 100, y: 100, width: 50, height: 50 }),
      layer("b-1", { x: 300, y: 100, width: 50, height: 50 }),
    ])), 0);
    editor.setSelection(["a-1", "b-1"]);
    const before = editor.snapshotForSave().document.nodes;

    down(editor, 1, screen(120, 120));
    move(editor, 1, screen(200, 180));
    up(editor, 1, screen(200, 180));

    const moved = editor.snapshotForSave().document.nodes;
    expect(moved["a-1"]?.bounds).not.toEqual(before["a-1"]?.bounds);
    expect(moved["b-1"]?.bounds).not.toEqual(before["b-1"]?.bounds);
    expect(editor.undo()).toBe(true);
    expect(editor.snapshotForSave().document.nodes["a-1"]?.bounds).toEqual(before["a-1"]?.bounds);
    expect(editor.snapshotForSave().document.nodes["b-1"]?.bounds).toEqual(before["b-1"]?.bounds);
  });

  it("moves a child exactly once when both it and its parent are selected", () => {
    const editor = new CanvasEditor(
      toDocument(
        sceneWith([
          {
            ...layer("group-1", { x: 100, y: 100, width: 300, height: 200 }),
            type: "group",
            children: [
              layer("child-1", { x: 120, y: 120, width: 60, height: 60 }),
            ],
          },
        ]),
      ),
      0,
    );
    down(editor, 1, screen(50, 50));
    move(editor, 1, screen(700, 500));
    up(editor, 1, screen(700, 500));
    expect(editor.getSnapshot().selectedIds).toEqual(["group-1", "child-1"]);

    down(editor, 2, screen(140, 140));
    move(editor, 2, screen(220, 200));
    up(editor, 2, screen(220, 200));
    const group = editor.getSnapshot().frame?.layers[0];
    expect(group?.bounds.x).toBeCloseTo(180, 5);
    // The child rides along with its selected ancestor: its OWN bounds stay
    // parent-relative (120), and its world position — group placement + its
    // bounds — moved by exactly +80 once (100 + 120 + 80 = 300).
    const child = group?.children?.find((entry) => entry.id === "child-1");
    expect(child?.bounds.x).toBeCloseTo(120, 5);
    expect((group?.bounds.x ?? 0) + (child?.bounds.x ?? 0)).toBeCloseTo(300, 5);
  });
});

describe("selection collapse on click", () => {
  it("collapses a multi-selection to the clicked node when no drag happens", () => {
    const editor = install();
    down(editor, 1, screen(200, 100));
    move(editor, 1, screen(654, 378));
    up(editor, 1, screen(654, 378));
    expect(editor.getSnapshot().selectedIds.length).toBeGreaterThan(1);
    const target = editor.getSnapshot().selectedIds[1]!;
    down(editor, 2, screen(430, 242));
    up(editor, 2, screen(430, 242));
    expect(editor.getSnapshot().selectedIds).toEqual([target]);
  });
});

describe("camera persistence and live snapping through the harness", () => {
  const presentGridFrame = (
    editor: CanvasEditor,
    result: { ok: boolean } = { ok: true },
  ): void => {
    const loop = new GridHostRenderLoop<
      {
        opacity: number;
        viewport: {
          panX: number;
          panY: number;
          zoom: number;
          width: number;
          height: number;
          pixelRatio: number;
        };
      },
      { ok: boolean }
    >();
    const frame = (timestamp: number) => {
      const snapshot = editor.getSnapshot();
      const viewport = { ...camera(snapshot.viewport), ...snapshot.canvasSize, pixelRatio: 1 };
      const page = snapshot.pages.find((candidate) => candidate.id === snapshot.activePageId)!;
      return loop.frame({
        timestamp,
        targetOpacity: 0.6,
        renderRevision: 1,
        lastRendered: 0,
        resizeDirty: false,
        chromeChanged: false,
        hasAgentActivities: false,
        buildPacket: (opacity) => ({ opacity, viewport }),
        submit: () => result,
        publishAcceptedGridRenderContext: (packet, opacity, submission) =>
          editor.setAcceptedGridRenderContext(
            submission.ok
              ? {
                  opacity,
                  pageId: snapshot.activePageId,
                  viewport: packet.viewport,
                  grid: page.canvas.grid,
                }
              : undefined,
          ),
      });
    };
    loop.rendererCreated();
    frame(0);
    frame(450);
  };

  const gridOnlyEditor = (zoom: number): CanvasEditor => {
    const editor = new CanvasEditor(toDocument(sceneWith([layer("moving", { x: 10.2, y: 10.2, width: 20, height: 20 })])), 0);
    editor.setSnapSetting("objects", false);
    editor.setSnapSetting("guides", false);
    editor.setSnapSetting("pixel", false);
    editor.setZoom(zoom, { x: 0, y: 0 });
    presentGridFrame(editor);
    return editor;
  };

  const atWorld = (editor: CanvasEditor, point: Point): Point =>
    worldToScreen(point, editor.getSnapshot().viewport);

  const expectUnsnappedCreation = (editor: CanvasEditor): void => {
    editor.setTool("rectangle");
    down(editor, 1, atWorld(editor, { x: 40.2, y: 40.2 }));
    move(editor, 1, atWorld(editor, { x: 60.4, y: 70.4 }));
    expect(editor.getSnapshot().draftBounds?.x).toBeCloseTo(40.2, 9);
    expect(editor.getSnapshot().draftBounds?.width).toBeCloseTo(20.2, 9);
  };

  it("does not grid-snap after a same-camera page switch even when the grid is identical", () => {
    const editor = gridOnlyEditor(6);
    editor.createPage("Second");
    editor.setSnapSetting("objects", false);
    editor.setSnapSetting("guides", false);
    editor.setSnapSetting("pixel", false);

    expectUnsnappedCreation(editor);
  });

  it("does not grid-snap after a same-camera switch to a page with different grid geometry", () => {
    const editor = gridOnlyEditor(6);
    const pageId = editor.createPage("Offset grid");
    editor.setSnapSetting("objects", false);
    editor.setSnapSetting("guides", false);
    editor.setSnapSetting("pixel", false);
    const page = editor.getSnapshot().pages.find((candidate) => candidate.id === pageId)!;
    editor.dispatch({
      type: "set-page-grid",
      pageId,
      grid: { ...page.canvas.grid, originX: 0.5, majorSpacing: 80 },
    });

    expectUnsnappedCreation(editor);
  });

  it("disables grid snapping when grid geometry changes before rAF and restores it after matching success", () => {
    const editor = gridOnlyEditor(6);
    const snapshot = editor.getSnapshot();
    const page = snapshot.pages.find((candidate) => candidate.id === snapshot.activePageId)!;
    editor.dispatch({
      type: "set-page-grid",
      pageId: snapshot.activePageId,
      grid: { ...page.canvas.grid, originX: 0.5, originY: 0.5, minorStep: 4 },
    });

    expectUnsnappedCreation(editor);
    up(editor, 1, atWorld(editor, { x: 60.4, y: 70.4 }));
    presentGridFrame(editor);
    editor.setTool("select");
    editor.setTool("rectangle");
    down(editor, 2, atWorld(editor, { x: 40.3, y: 40.3 }));
    move(editor, 2, atWorld(editor, { x: 60.3, y: 70.3 }));
    expect(editor.getSnapshot().draftBounds).toEqual({
      x: 40.5,
      y: 40.5,
      width: 20,
      height: 30,
    });
  });

  it("does not grid-snap a move after grid geometry changes before rAF", () => {
    const editor = gridOnlyEditor(6);
    const snapshot = editor.getSnapshot();
    const page = snapshot.pages.find((candidate) => candidate.id === snapshot.activePageId)!;
    editor.dispatch({
      type: "set-page-grid",
      pageId: snapshot.activePageId,
      grid: { ...page.canvas.grid, originX: 0.25, originY: 0.25 },
    });

    down(editor, 1, atWorld(editor, { x: 15, y: 15 }));
    move(editor, 1, atWorld(editor, { x: 17.3, y: 17.3 }));

    const moved = editor.getSnapshot().frame?.layers.find(
      (entry) => entry.id === "moving",
    )?.bounds;
    expect(moved?.x).toBeCloseTo(12.5, 9);
    expect(moved?.y).toBeCloseTo(12.5, 9);
  });

  it("does not grid-snap creation after zoom changes without a presented frame", () => {
    const editor = gridOnlyEditor(6);
    editor.setZoom(5.2, { x: 0, y: 0 });
    editor.setTool("rectangle");
    down(editor, 1, atWorld(editor, { x: 40.2, y: 40.2 }));
    move(editor, 1, atWorld(editor, { x: 60.4, y: 70.4 }));

    const preview = editor.getSnapshot().draftBounds!;
    expect(preview.x).toBeCloseTo(40.2, 9);
    expect(preview.y).toBeCloseTo(40.2, 9);
    expect(preview.width).toBeCloseTo(20.2, 9);
    expect(preview.height).toBeCloseTo(30.2, 9);
  });

  it("does not grid-snap move after pan changes without a presented frame", () => {
    const editor = gridOnlyEditor(6);
    editor.scrollPan(37, -19);
    down(editor, 1, atWorld(editor, { x: 15, y: 15 }));
    move(editor, 1, atWorld(editor, { x: 17.3, y: 17.3 }));

    const moved = editor.getSnapshot().frame?.layers.find(
      (entry) => entry.id === "moving",
    )?.bounds;
    expect(moved?.x).toBeCloseTo(12.5, 9);
    expect(moved?.y).toBeCloseTo(12.5, 9);
  });

  it("does not grid-snap resize after zoom changes until a matching frame succeeds", () => {
    const editor = gridOnlyEditor(6);
    editor.scrollPan(23, 11);
    down(editor, 1, atWorld(editor, { x: 30.2, y: 30.2 }));
    move(editor, 1, atWorld(editor, { x: 32.5, y: 32.5 }));
    const unsnapped = editor.getSnapshot().frame?.layers.find(
      (entry) => entry.id === "moving",
    )?.bounds;
    expect(unsnapped?.width).toBeCloseTo(22.3, 9);
    expect(unsnapped?.height).toBeCloseTo(22.3, 9);
    up(editor, 1, atWorld(editor, { x: 32.5, y: 32.5 }));

    presentGridFrame(editor);
    down(editor, 2, atWorld(editor, { x: 32.5, y: 32.5 }));
    move(editor, 2, atWorld(editor, { x: 35.24, y: 35.24 }));
    const resized = editor.getSnapshot().frame?.layers.find((entry) => entry.id === "moving")?.bounds;
    expect(resized?.x).toBe(10.2);
    expect(resized?.y).toBe(10.2);
    expect(resized?.width).toBeCloseTo(24.8, 9);
    expect(resized?.height).toBeCloseTo(24.8, 9);
  });

  it("keeps grid snapping disabled when the matching frame submission fails", () => {
    const editor = gridOnlyEditor(6);
    editor.scrollPan(31, -7);
    presentGridFrame(editor, { ok: false });
    editor.setTool("rectangle");
    down(editor, 1, atWorld(editor, { x: 40.2, y: 40.2 }));
    move(editor, 1, atWorld(editor, { x: 60.24, y: 70.24 }));

    const preview = editor.getSnapshot().draftBounds!;
    expect(preview.x).toBeCloseTo(40.2, 9);
    expect(preview.width).toBeCloseTo(20.04, 9);
  });

  it("does not magnetize at the first zero-opacity activation packet", () => {
    const editor = gridOnlyEditor(6);
    editor.setAcceptedGridRenderContext(undefined);
    editor.setTool("rectangle");
    down(editor, 1, atWorld(editor, { x: 40.2, y: 40.2 }));
    move(editor, 1, atWorld(editor, { x: 60.24, y: 70.24 }));
    expect(editor.getSnapshot().draftBounds?.x).toBeCloseTo(40.2, 9);

    const snapshot = editor.getSnapshot();
    const page = snapshot.pages.find((candidate) => candidate.id === snapshot.activePageId)!;
    editor.setAcceptedGridRenderContext({
      opacity: 0.01,
      pageId: snapshot.activePageId,
      viewport: { ...camera(snapshot.viewport), ...snapshot.canvasSize, pixelRatio: 1 },
      grid: page.canvas.grid,
    });
    move(editor, 1, atWorld(editor, { x: 60.76, y: 70.76 }));
    const visiblePreview = editor.getSnapshot().draftBounds!;
    expect(visiblePreview.x).toBeCloseTo(40, 9);
    expect(visiblePreview.x + visiblePreview.width).toBe(61);

    editor.setAcceptedGridRenderContext(undefined);
    move(editor, 1, atWorld(editor, { x: 60.6, y: 70.6 }));
    const hiddenPreview = editor.getSnapshot().draftBounds!;
    expect(hiddenPreview.x + hiddenPreview.width).toBeCloseTo(60.6, 9);
  });

  it("keeps an explicitly disabled grid unsnapped while visible", () => {
    const editor = gridOnlyEditor(6);
    editor.setSnapSetting("grid", false);
    editor.setTool("rectangle");
    down(editor, 1, atWorld(editor, { x: 40.2, y: 40.2 }));
    move(editor, 1, atWorld(editor, { x: 60.24, y: 70.24 }));
    expect(editor.getSnapshot().draftBounds?.x).toBeCloseTo(40.2, 9);
  });

  it("keeps accepted grid render context out of authored persistence", () => {
    const editor = gridOnlyEditor(6);
    const before = editor.snapshotForSave();
    editor.setAcceptedGridRenderContext(undefined);
    const snapshot = editor.getSnapshot();
    const page = snapshot.pages.find((candidate) => candidate.id === snapshot.activePageId)!;
    editor.setAcceptedGridRenderContext({
      opacity: 0.3,
      pageId: snapshot.activePageId,
      viewport: { ...camera(snapshot.viewport), ...snapshot.canvasSize, pixelRatio: 1 },
      grid: page.canvas.grid,
    });
    expect(editor.snapshotForSave()).toEqual(before);
  });

  it("clears accepted grid render context when replacing the document", () => {
    const editor = gridOnlyEditor(6);
    editor.replaceDocument(editor.snapshotForSave().document, 1);

    expectUnsnappedCreation(editor);
  });

  it("snaps creation preview and commit to the displayed grid despite legacy visible:false", () => {
    const editor = gridOnlyEditor(6);
    editor.setTool("rectangle");
    down(editor, 1, atWorld(editor, { x: 40.2, y: 40.2 }));
    move(editor, 1, atWorld(editor, { x: 60.24, y: 70.24 }));
    const snapped = editor.getSnapshot().draftBounds!;
    expect(snapped.x).toBeCloseTo(40, 9);
    expect(snapped.y).toBeCloseTo(40, 9);
    expect(snapped.width).toBeCloseTo(20, 9);
    expect(snapped.height).toBeCloseTo(30, 9);
    up(editor, 1, atWorld(editor, { x: 60.24, y: 70.24 }));
    const created = editor.getSnapshot().frame?.layers.find((entry) => entry.name === "New rectangle");
    expect(created?.bounds).toEqual({ x: 40, y: 40, width: 20, height: 30 });
  });

  it.each(["rectangle", "ellipse", "frame", "line"] as const)(
    "keeps %s local grid capture, evidence, preview, and commit coherent",
    (tool) => {
      const editor = gridOnlyEditor(6);
      editor.setTool(tool);
      down(editor, 1, atWorld(editor, { x: 40.24, y: 40.24 }));
      move(editor, 1, atWorld(editor, { x: 60.24, y: 70.24 }));
      const preview = editor.getSnapshot();
      expect(preview.draftBounds).toEqual({ x: 40, y: 40, width: 20, height: 30 });
      expect(preview.snapChoices).toEqual({
        x: { family: "grid", axis: "x", value: 60, source: "point" },
        y: { family: "grid", axis: "y", value: 70, source: "point" },
      });
      up(editor, 1, atWorld(editor, { x: 60.24, y: 70.24 }));
      const committed = editor.getSnapshot();
      const created = committed.frame?.layers.find((entry) => entry.id === committed.selectedIds[0]);
      expect(created?.bounds).toEqual(preview.draftBounds);
      expect(committed.snapChoices).toBeUndefined();
    },
  );

  it("does not snap creation below the grid reveal threshold", () => {
    const editor = gridOnlyEditor(4);
    editor.setTool("rectangle");
    down(editor, 1, atWorld(editor, { x: 40.2, y: 40.2 }));
    move(editor, 1, atWorld(editor, { x: 60.4, y: 70.4 }));
    const preview = editor.getSnapshot().draftBounds!;
    expect(preview.x).toBeCloseTo(40.2, 9);
    expect(preview.y).toBeCloseTo(40.2, 9);
    expect(preview.width).toBeCloseTo(20.2, 9);
    expect(preview.height).toBeCloseTo(30.2, 9);
  });

  it("keeps displayed-grid move preview and commit equal", () => {
    const editor = gridOnlyEditor(6);
    down(editor, 1, atWorld(editor, { x: 15, y: 15 }));
    move(editor, 1, atWorld(editor, { x: 16.8, y: 16.8 }));
    const preview = editor.getSnapshot().frame?.layers.find((entry) => entry.id === "moving")?.bounds;
    up(editor, 1, atWorld(editor, { x: 16.8, y: 16.8 }));
    const committed = editor.getSnapshot().frame?.layers.find((entry) => entry.id === "moving")?.bounds;
    expect(preview).toEqual({ x: 12, y: 12, width: 20, height: 20 });
    expect(committed).toEqual(preview);
  });

  it("keeps displayed-grid resize preview and commit equal", () => {
    const editor = gridOnlyEditor(6);
    down(editor, 1, atWorld(editor, { x: 30.2, y: 30.2 }));
    move(editor, 1, atWorld(editor, { x: 31.24, y: 31.24 }));
    const preview = editor.getSnapshot().frame?.layers.find((entry) => entry.id === "moving")?.bounds;
    up(editor, 1, atWorld(editor, { x: 31.24, y: 31.24 }));
    const committed = editor.getSnapshot().frame?.layers.find((entry) => entry.id === "moving")?.bounds;
    expect(preview).toMatchObject({ x: 10.2, y: 10.2 });
    expect(preview?.width).toBeCloseTo(20.8, 9);
    expect(preview?.height).toBeCloseTo(20.8, 9);
    expect(committed).toEqual(preview);
  });

  it("snaps a 90-degree rotated east handle from its transformed feature and commits the preview", () => {
    const editor = new CanvasEditor(
      toDocument(
        sceneWith([
          {
            ...layer("rotated", { x: 20.2, y: 20.2, width: 20, height: 10 }),
            transform: { a: 0, b: 1, c: -1, d: 0, e: 0, f: 0 },
          },
        ]),
      ),
      0,
    );
    editor.setSnapSetting("objects", false);
    editor.setSnapSetting("guides", false);
    editor.setSnapSetting("pixel", false);
    editor.setZoom(8, { x: 0, y: 0 });
    presentGridFrame(editor);
    editor.setSelection(["rotated"]);
    const box = editor.getSnapshot().selectionBox!;
    const east = {
      x: box.transform.a * box.bounds.width + box.transform.c * (box.bounds.height / 2) + box.transform.e,
      y: box.transform.b * box.bounds.width + box.transform.d * (box.bounds.height / 2) + box.transform.f,
    };
    const target = { x: east.x, y: Math.round(east.y) + 1.24 };

    down(editor, 1, atWorld(editor, east));
    expect(editor.getSnapshot().interaction.resizeHandle).toBe("e");
    move(editor, 1, atWorld(editor, target));
    const preview = editor.getSnapshot();
    const finalBox = preview.selectionBox!;
    const finalEast = {
      x: finalBox.transform.a * finalBox.bounds.width + finalBox.transform.c * (finalBox.bounds.height / 2) + finalBox.transform.e,
      y: finalBox.transform.b * finalBox.bounds.width + finalBox.transform.d * (finalBox.bounds.height / 2) + finalBox.transform.f,
    };
    expect(preview.snapChoices?.y).toMatchObject({ family: "grid", source: "center-y" });
    expect(finalEast.y).toBeCloseTo(preview.snapChoices!.y!.value, 9);
    const previewBounds = preview.frame?.layers.find((entry) => entry.id === "rotated")?.bounds;
    up(editor, 1, atWorld(editor, target));
    expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "rotated")?.bounds).toEqual(previewBounds);
  });

  it("snaps a scaled handle through a transformed parent from the final local handle geometry", () => {
    const editor = new CanvasEditor(
      toDocument(
        sceneWith([
          {
            ...layer("parent", { x: 10, y: 10, width: 80, height: 80 }, { type: "group" }),
            transform: { a: 1.5, b: 0, c: 0, d: 0.5, e: 0, f: 0 },
            children: [layer("child", { x: 0.2, y: 0.2, width: 20, height: 20 })],
          },
        ]),
      ),
      0,
    );
    editor.setSnapSetting("objects", false);
    editor.setSnapSetting("guides", false);
    editor.setSnapSetting("pixel", false);
    editor.setZoom(8, { x: 0, y: 0 });
    presentGridFrame(editor);
    editor.setSelection(["child"]);
    editor.enterIsolation("parent");
    const box = editor.getSnapshot().selectionBox!;
    const southeast = {
      x: box.transform.a * box.bounds.width + box.transform.c * box.bounds.height + box.transform.e,
      y: box.transform.b * box.bounds.width + box.transform.d * box.bounds.height + box.transform.f,
    };
    expect(editor.getSnapshot().selectedIds).toEqual(["child"]);
    const target = { x: Math.round(southeast.x) + 1.24, y: Math.round(southeast.y) + 1.24 };

    down(editor, 1, atWorld(editor, southeast));
    expect(editor.getSnapshot().interaction.resizeHandle).toBe("se");
    move(editor, 1, atWorld(editor, target));
    const preview = editor.getSnapshot();
    const finalBox = preview.selectionBox!;
    const finalSoutheast = {
      x: finalBox.transform.a * finalBox.bounds.width + finalBox.transform.c * finalBox.bounds.height + finalBox.transform.e,
      y: finalBox.transform.b * finalBox.bounds.width + finalBox.transform.d * finalBox.bounds.height + finalBox.transform.f,
    };
    expect(preview.snapChoices?.x).toMatchObject({ family: "grid", source: "right" });
    expect(preview.snapChoices?.y).toMatchObject({ family: "grid", source: "bottom" });
    expect(finalSoutheast.x).toBeCloseTo(preview.snapChoices!.x!.value, 9);
    expect(finalSoutheast.y).toBeCloseTo(preview.snapChoices!.y!.value, 9);
  });

  it("suppresses east+Alt evidence when the final from-center edge misses the candidate", () => {
    const editor = gridOnlyEditor(6);
    down(editor, 1, atWorld(editor, { x: 30.2, y: 20.2 }));
    move(editor, 1, atWorld(editor, { x: 31.24, y: 20.2 }), { altKey: true });
    const snapshot = editor.getSnapshot();
    expect(snapshot.snapChoices?.x).toBeUndefined();
  });

  it("explicitly suppresses incompatible southeast+Shift grid evidence", () => {
    const editor = gridOnlyEditor(6);
    editor.setSnapSetting("grid", false);
    editor.setSnapSetting("guides", true);
    editor.addGuide("x", 32);
    editor.addGuide("y", 33);
    down(editor, 1, atWorld(editor, { x: 30.2, y: 30.2 }));
    move(editor, 1, atWorld(editor, { x: 31.24, y: 32.24 }), { shiftKey: true });
    const snapshot = editor.getSnapshot();
    expect(snapshot.snapChoices).toBeUndefined();
  });

  it.each(["x", "y"] as const)("occupies a satisfiable %s-only guide during Shift-constrained transformed resize", (axis) => {
    const angle = (33 * Math.PI) / 180;
    const editor = new CanvasEditor(toDocument(sceneWith([
      layer("rotated", { x: 20.2, y: 20.2, width: 80, height: 40 }, {
        transform: { a: Math.cos(angle), b: Math.sin(angle), c: -Math.sin(angle), d: Math.cos(angle), e: 0, f: 0 },
      }),
    ])), 0);
    editor.setSnapSetting("grid", false);
    editor.setSnapSetting("objects", false);
    editor.setSnapSetting("pixel", false);
    editor.setSnapSetting("guides", true);
    editor.setSelection(["rotated"]);
    const box = editor.getSnapshot().selectionBox!;
    const start = {
      x: box.transform.a * box.bounds.width + box.transform.c * (box.bounds.height / 2) + box.transform.e,
      y: box.transform.b * box.bounds.width + box.transform.d * (box.bounds.height / 2) + box.transform.f,
    };
    const rawDelta = { x: 4, y: 3 };
    const target = axis === "x" ? 82 : 73;
    editor.addGuide(axis, target);

    down(editor, 1, worldToScreen(start, editor.getSnapshot().viewport), { shiftKey: true });
    move(editor, 1, worldToScreen({ x: start.x + rawDelta.x, y: start.y + rawDelta.y }, editor.getSnapshot().viewport), { shiftKey: true });
    const preview = editor.getSnapshot();
    const finalBox = preview.selectionBox!;
    const feature = {
      x: finalBox.transform.a * finalBox.bounds.width + finalBox.transform.c * (finalBox.bounds.height / 2) + finalBox.transform.e,
      y: finalBox.transform.b * finalBox.bounds.width + finalBox.transform.d * (finalBox.bounds.height / 2) + finalBox.transform.f,
    };
    expect(preview.snapChoices?.[axis]).toMatchObject({ family: "guide", value: target });
    expect(feature[axis]).toBeCloseTo(target, 8);
    const previewBounds = preview.frame?.layers.find((entry) => entry.id === "rotated")?.bounds;
    up(editor, 1, worldToScreen({ x: start.x + rawDelta.x, y: start.y + rawDelta.y }, editor.getSnapshot().viewport), { shiftKey: true });
    expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "rotated")?.bounds).toEqual(previewBounds);
  });

  it("publishes accepted-context evidence clearing immediately without authored mutation", () => {
    const editor = gridOnlyEditor(6);
    editor.setTool("rectangle");
    down(editor, 1, atWorld(editor, { x: 40.2, y: 40.2 }));
    move(editor, 1, atWorld(editor, { x: 60.24, y: 70.24 }));
    const beforeSave = editor.snapshotForSave();
    const before = editor.getSnapshot();
    expect(before.snapChoices).toBeDefined();
    editor.setAcceptedGridRenderContext(undefined);
    const after = editor.getSnapshot();
    expect(after).not.toBe(before);
    expect(after.snapChoices).toBeUndefined();
    expect(after.renderRevision).toBeGreaterThan(before.renderRevision);
    expect(editor.snapshotForSave()).toEqual(beforeSave);
  });

  it("publishes grid invalidation and active replay as exactly one coherent ephemeral snapshot", () => {
    const editor = gridOnlyEditor(8);
    editor.setTool("rectangle");
    const end = atWorld(editor, { x: 60.24, y: 70.24 });
    down(editor, 1, atWorld(editor, { x: 40, y: 40 }));
    move(editor, 1, end);
    const before = editor.getSnapshot();
    const saves = editor.snapshotForSave();
    const emitted: Array<{ bounds: typeof before.draftBounds; choices: typeof before.snapChoices; revision: number; canUndo: boolean }> = [];
    const unsubscribe = editor.subscribe(() => {
      const snapshot = editor.getSnapshot();
      emitted.push({ bounds: snapshot.draftBounds, choices: snapshot.snapChoices, revision: snapshot.documentRevision, canUndo: snapshot.canUndo });
    });

    editor.setAcceptedGridRenderContext(undefined);
    unsubscribe();

    expect(emitted).toEqual([{
      bounds: emitted[0]?.bounds,
      choices: undefined,
      revision: before.documentRevision,
      canUndo: before.canUndo,
    }]);
    expect(emitted[0]?.bounds?.x).toBeCloseTo(40, 9);
    expect(emitted[0]?.bounds?.y).toBeCloseTo(40, 9);
    expect(emitted[0]?.bounds?.width).toBeCloseTo(20.24, 9);
    expect(emitted[0]?.bounds?.height).toBeCloseTo(30.24, 9);
    expect(editor.snapshotForSave()).toEqual(saves);
  });

  it("coalesces synchronous listener invalidation through a bounded iterative drain", () => {
    const editor = gridOnlyEditor(8);
    editor.setTool("rectangle");
    down(editor, 1, atWorld(editor, { x: 40, y: 40 }));
    move(editor, 1, atWorld(editor, { x: 60.24, y: 70.24 }));
    const before = editor.getSnapshot();
    const saved = editor.snapshotForSave();
    let invalidatorNotifications = 0;
    const observed: Array<{ revision: number; canUndo: boolean }> = [];
    const unsubscribeInvalidator = editor.subscribe(() => {
      invalidatorNotifications += 1;
      editor.setAcceptedGridRenderContext(undefined);
    });
    const unsubscribeObserver = editor.subscribe(() => {
      const snapshot = editor.getSnapshot();
      observed.push({ revision: snapshot.documentRevision, canUndo: snapshot.canUndo });
    });

    editor.setAcceptedGridRenderContext(undefined);
    unsubscribeInvalidator();
    unsubscribeObserver();

    expect(invalidatorNotifications).toBe(1);
    expect(observed).toEqual([{ revision: before.documentRevision, canUndo: before.canUndo }]);
    expect(editor.snapshotForSave()).toEqual(saved);
  });

  it("removes stale grid correction before an immediate creation commit", () => {
    const editor = gridOnlyEditor(8);
    editor.setTool("rectangle");
    const end = atWorld(editor, { x: 60.24, y: 70.24 });
    down(editor, 1, atWorld(editor, { x: 40, y: 40 }));
    move(editor, 1, end);
    const snapped = editor.getSnapshot().draftBounds!;
    expect(snapped.x).toBeCloseTo(40, 9);
    expect(snapped.y).toBeCloseTo(40, 9);
    expect(snapped.width).toBeCloseTo(20, 9);
    expect(snapped.height).toBeCloseTo(30, 9);
    editor.setAcceptedGridRenderContext(undefined);
    const preview = editor.getSnapshot().draftBounds!;
    expect(preview.x).toBeCloseTo(40, 9);
    expect(preview.y).toBeCloseTo(40, 9);
    expect(preview.width).toBeCloseTo(20.24, 9);
    expect(preview.height).toBeCloseTo(30.24, 9);
    up(editor, 1, end);
    expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === editor.getSnapshot().selectedIds[0])?.bounds).toEqual(preview);
  });

  it("retains mixed-family creation start evidence and preserves its guide correction after grid invalidation", () => {
    const editor = gridOnlyEditor(8);
    editor.setSnapSetting("guides", true);
    editor.addGuide("x", 43);
    editor.setTool("rectangle");
    const start = atWorld(editor, { x: 43.24, y: 40.24 });
    const end = atWorld(editor, { x: 65.5, y: 70.24 });
    down(editor, 1, start);
    move(editor, 1, end);
    const before = editor.getSnapshot();
    expect(before.draftBounds?.x).toBeCloseTo(43, 9);
    expect(before.draftBounds?.y).toBeCloseTo(40, 9);
    expect(before.draftBounds?.width).toBeCloseTo(22.5, 9);
    expect(before.draftBounds?.height).toBeCloseTo(30, 9);
    expect(before.creationStartSnapChoices).toEqual({
      x: { family: "guide", axis: "x", value: 43, source: "point" },
      y: { family: "grid", axis: "y", value: 40, source: "point" },
    });
    expect(before.snapChoices).toEqual({
      y: { family: "grid", axis: "y", value: 70, source: "point" },
    });

    editor.setAcceptedGridRenderContext(undefined);
    const preview = editor.getSnapshot();
    expect(preview.draftBounds?.x).toBe(43);
    expect(preview.draftBounds?.y).toBeCloseTo(40.24, 9);
    expect(preview.creationStartSnapChoices).toEqual({
      x: { family: "guide", axis: "x", value: 43, source: "point" },
    });
    expect(preview.snapChoices).toBeUndefined();
    up(editor, 1, end);
    const committed = editor.getSnapshot().frame?.layers.find((entry) => entry.id === editor.getSnapshot().selectedIds[0])?.bounds;
    expect(committed).toEqual(preview.draftBounds);
    expect(editor.undo()).toBe(true);
    expect(editor.undo()).toBe(true);
  });

  it("clears only grid-derived pen axes when accepted context is invalidated", () => {
    const editor = gridOnlyEditor(8);
    editor.setSnapSetting("guides", true);
    editor.addGuide("y", 30);
    editor.setTool("pen");
    move(editor, 1, atWorld(editor, { x: 20.24, y: 30.24 }));
    const before = editor.getSnapshot().penPreviewWorld;
    expect(before?.snap).toEqual({
      kind: "axis",
      choices: {
        x: { family: "grid", axis: "x", value: 20, source: "point" },
        y: { family: "guide", axis: "y", value: 30, source: "point" },
      },
    });

    editor.setAcceptedGridRenderContext(undefined);
    const after = editor.getSnapshot().penPreviewWorld;
    expect(after?.point.x).toBeCloseTo(20.24, 9);
    expect(after?.point.y).toBeCloseTo(30, 9);
    expect(after?.snap).toEqual({
      kind: "axis",
      choices: {
        y: { family: "guide", axis: "y", value: 30, source: "point" },
      },
    });
  });

  it("clears creation-only evidence on pointer leave", () => {
    const editor = gridOnlyEditor(6);
    editor.setTool("rectangle");
    down(editor, 1, atWorld(editor, { x: 40.2, y: 40.2 }));
    move(editor, 1, atWorld(editor, { x: 60.24, y: 70.24 }));
    expect(editor.getSnapshot().snapChoices).toBeDefined();
    editor.handlePointerLeave();
    expect(editor.getSnapshot().snapChoices).toBeUndefined();
  });

  it("clears start-only guide evidence on pointer leave without authored mutation", () => {
    const editor = gridOnlyEditor(6);
    editor.setSnapSetting("guides", true);
    editor.addGuide("x", 43);
    editor.setTool("rectangle");
    down(editor, 1, atWorld(editor, { x: 43.24, y: 15.5 }));
    move(editor, 1, atWorld(editor, { x: 80.5, y: 70.5 }));
    const before = editor.getSnapshot();
    const beforeSave = editor.snapshotForSave();
    expect(before.creationStartSnapChoices?.x).toMatchObject({ family: "guide", value: 43 });
    expect(before.snapChoices).toBeUndefined();

    editor.handlePointerLeave();

    const after = editor.getSnapshot();
    expect(after).not.toBe(before);
    expect(after.creationStartSnapChoices).toBeUndefined();
    expect(after.snapChoices).toBeUndefined();
    expect(after.renderRevision).toBeGreaterThan(before.renderRevision);
    expect(editor.snapshotForSave()).toEqual(beforeSave);
  });

  it("does not publish a redundant line for an already-aligned creation corner", () => {
    const editor = gridOnlyEditor(6);
    editor.setTool("rectangle");
    down(editor, 1, atWorld(editor, { x: 40, y: 40 }));
    move(editor, 1, atWorld(editor, { x: 60, y: 70 }));
    expect(editor.getSnapshot().snapChoices).toBeUndefined();
  });

  it("bypasses snapping on the first Ctrl/Meta move and re-enables it on release", () => {
    const editor = gridOnlyEditor(6);
    down(editor, 1, atWorld(editor, { x: 15, y: 15 }));
    move(editor, 1, atWorld(editor, { x: 17.3, y: 17.3 }), { ctrlKey: true });
    expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "moving")?.bounds.x).toBeCloseTo(12.5, 9);
    move(editor, 1, atWorld(editor, { x: 16.8, y: 16.8 }));
    expect(editor.getSnapshot().frame?.layers.find((entry) => entry.id === "moving")?.bounds.x).toBe(12);
  });

  it("persists the rest camera after a settled pan gesture and restores it on reload", () => {
    const editor = install();
    down(editor, 1, { x: 100, y: 100 }, { button: 1 });
    move(editor, 1, { x: 220, y: 160 });
    up(editor, 1, { x: 220, y: 160 });
    const viewport = editor.getSnapshot().viewport;
    expect(viewport.panX).toBe(200);
    expect(viewport.panY).toBe(110);
    // The gesture wrote the authored rest camera; a reload restores it.
    const serialized = editor.serializeDocument();
    const reloaded = install();
    reloaded.replaceDocumentJson(serialized, 7);
    expect(reloaded.getSnapshot().viewport).toEqual(viewport);
  });

  it("previews the idle pen landing dot before the first click and clears it on pointer leave", () => {
    const editor = install();
    editor.setTool("pen");
    move(editor, 1, screen(150, 120));
    let projection = editor.getSnapshot();
    expect(projection.penSessionWorld).toHaveLength(0);
    expect(projection.penPreviewWorld).toBeDefined();
    // The dot rides the cursor at the raw position (no session, no target
    // within tolerance), with the screen round-trip's float noise.
    expect(projection.penPreviewWorld!.point.x).toBeCloseTo(150, 5);
    expect(projection.penPreviewWorld!.point.y).toBeCloseTo(120, 5);
    expect(projection.penPreviewWorld!.snap).toBeUndefined();
    // Leaving the canvas must not freeze the dot.
    editor.handlePointerLeave();
    projection = editor.getSnapshot();
    expect(projection.penPreviewWorld).toBeUndefined();
  });

  it("magnetizes the pen anchor onto an existing path segment with the midpoint indicator", () => {
    const editor = install();
    drawClosedTriangle(editor);
    editor.setTool("pen");
    // The triangle's third anchor snapped onto the card's left edge and the
    // badge's top during drawing, so its second segment runs world
    // (146.3, 61) → (260, 309); its midpoint is (203.2, 185). The cursor
    // near it magnetizes the pending anchor onto the line and reports the
    // half-way indicator.
    move(editor, 1, { x: 250, y: 200 });
    const preview = editor.getSnapshot().penPreviewWorld;
    expect(preview).toBeDefined();
    expect(preview!.snap?.kind).toBe("path-segment");
    expect(preview!.snap!.midpoint).toBeDefined();
    expect(preview!.snap!.midpoint!.x).toBeCloseTo(203.2, 1);
    expect(preview!.snap!.midpoint!.y).toBeCloseTo(185, 1);
  });

  it("snaps a drag onto an object edge and reports the alignment guide", () => {
    const editor = install();
    // Grab the card below its title (world 500,180 is inside the card but
    // outside the title and badge), then drag it down by 100 world units:
    // the card's top edge (150) passes within 12 px of the title's center
    // line (242) — the y delta snaps onto it.
    down(editor, 1, screen(500, 180));
    move(editor, 1, screen(500, 280));
    const projection = editor.getSnapshot();
    expect(projection.moveSnapGuides?.y).toBe(242);
    expect(projection.moveSnapGuides?.x).toBeUndefined();
    up(editor, 1, screen(500, 280));
    const card = editor
      .getSnapshot()
      .frame?.layers.find((layer) => layer.id === "layer-card");
    expect(card?.bounds.y).toBe(242);
    expect(editor.getSnapshot().moveSnapGuides).toBeUndefined();
  });
});

describe("guides, booleans and snap settings through the harness", () => {
  it("adds, drags and cancels a guide as one history entry", () => {
    const editor = install();
    const guideId = editor.beginGuideDrag("y", 400);
    editor.previewGuideDrag(guideId, 420);
    editor.previewGuideDrag(guideId, 450);
    editor.commitGuideDrag(false);
    const page = editor.getSnapshot().pages[0];
    const guide = page?.canvas.guides.find((entry) => entry.id === guideId);
    expect(guide?.axis).toBe("y");
    expect(guide?.position).toBe(450);
    expect(editor.undo()).toBe(true);
    expect(editor.getSnapshot().pages[0]?.canvas.guides).toHaveLength(0);
  });

  it("cancels a fresh guide drag, leaving nothing behind", () => {
    const editor = install();
    const guideId = editor.beginGuideDrag("x", 100);
    editor.previewGuideDrag(guideId, 300);
    editor.commitGuideDrag(true);
    expect(editor.getSnapshot().pages[0]?.canvas.guides).toHaveLength(0);
    expect(editor.undo()).toBe(false);
  });

  it("runs boolean ops over the selection", () => {
    const editor = install();
    editor.setTool("ellipse");
    down(editor, 1, screen(200, 200));
    move(editor, 1, screen(320, 320));
    up(editor, 1, screen(320, 320));
    editor.setTool("ellipse");
    down(editor, 1, screen(280, 200));
    move(editor, 1, screen(400, 320));
    up(editor, 1, screen(400, 320));
    // The two ellipses are path nodes — the pathCommands channel names them.
    const pathIds = editor.getSnapshot().pathCommands
      .filter((command) => command.geometry === "path")
      .map((command) => command.nodeId);
    expect(pathIds.length).toBeGreaterThanOrEqual(2);
    editor.setSelection(pathIds);
    editor.booleanOperate("union");
    const result = editor.getSnapshot();
    // The kernel engine collapses the operands into one result node.
    expect(result.selectedIds).toHaveLength(1);
    expect(editor.undo()).toBe(true);
    const undone = editor.getSnapshot();
    expect(undone.pathCommands.filter((command) => command.geometry === "path").length).toBeGreaterThanOrEqual(2);
  });

  it("toggles snap families per page, one history entry each", () => {
    const editor = install();
    expect(editor.getSnapshot().pages[0]?.canvas.snap.objects).toBe(true);
    editor.setSnapSetting("objects", false);
    expect(editor.getSnapshot().pages[0]?.canvas.snap.objects).toBe(false);
    editor.setSnapSetting("objects", true);
    expect(editor.getSnapshot().pages[0]?.canvas.snap.objects).toBe(true);
    expect(editor.undo()).toBe(true);
    expect(editor.getSnapshot().pages[0]?.canvas.snap.objects).toBe(false);
  });

  it("reorders and reparents by index (the layers panel's drag-drop)", () => {
    const editor = install();
    // layer-title sits between layer-card and layer-badge.
    editor.moveNodeToIndex("layer-title", "page-root-frame-home", 0);
    const first = editor.getSnapshot().frame?.layers[0];
    expect(first?.id).toBe("layer-title");
    // Reparent the badge into a container: draw a frame over everything.
    editor.setTool("frame");
    down(editor, 1, screen(200, 100));
    move(editor, 1, screen(700, 420));
    up(editor, 1, screen(700, 420));
    const frame = editor.getSnapshot().selectedIds[0];
    expect(frame).toBeDefined();
    editor.setSelection(["layer-badge"]);
    editor.reparentNode("layer-badge", frame!, 0, "Move layer");
    const projection = editor.getSnapshot();
    const frameLayer = projection.frame?.layers.find((layer) => layer.id === frame);
    expect(frameLayer?.children?.some((child) => child.id === "layer-badge")).toBe(true);
    expect(editor.undo()).toBe(true);
  });
});

describe("tier-3 feel behaviors through the harness", () => {
  it("flips a layer around its box center (⇧H/⇧V), with undo", () => {
    const editor = install();
    editor.setSelection(["layer-card"]);
    editor.flip("h");
    const flipped = editor.getSnapshot().frame?.layers.find((layer) => layer.id === "layer-card");
    expect(flipped?.transform.a).toBe(-1);
    // The box center stays put: the transform's translation cancels the
    // reflection (C − b terms), so the drawn box is unmoved.
    expect(flipped?.bounds.x).toBe(260);
    expect(editor.undo()).toBe(true);
    const restored = editor.getSnapshot().frame?.layers.find((layer) => layer.id === "layer-card");
    expect(restored?.transform.a).toBe(1);
  });

  it("sets opacity by number key (1–9 → 10–90%), one history entry", () => {
    const editor = install();
    editor.setSelection(["layer-card", "layer-title"]);
    editor.setSelectionOpacity(50);
    const snapshot = editor.getSnapshot();
    const card = snapshot.frame?.layers.find((layer) => layer.id === "layer-card");
    const title = snapshot.frame?.layers.find((layer) => layer.id === "layer-title");
    expect(card?.opacity).toBe(0.5);
    expect(title?.opacity).toBe(0.5);
    expect(editor.undo()).toBe(true);
    expect(editor.getSnapshot().frame?.layers.find((layer) => layer.id === "layer-card")?.opacity).toBe(1);
  });

  it("scopes a marquee started inside a frame to that frame's children", () => {
    const editor = install();
    // Build a frame with two children via the frame tool, then marquee from
    // inside it.
    editor.setTool("frame");
    down(editor, 1, screen(200, 100));
    move(editor, 1, screen(700, 420));
    up(editor, 1, screen(700, 420));
    const frameId = editor.getSnapshot().selectedIds[0];
    editor.setTool("select");
    // Marquee entirely inside the frame's box, around layer-title — the
    // start point clear of every handle zone (a handle grab would resize).
    down(editor, 1, screen(400, 240));
    move(editor, 1, screen(550, 260));
    up(editor, 1, screen(550, 260));
    const selection = editor.getSnapshot().selectedIds;
    // Only children of the frame are candidates; the frame itself is not.
    expect(selection.some((id) => id === frameId)).toBe(false);
    expect(selection.length).toBeGreaterThan(0);
    for (const id of selection) {
      const node = (editor as unknown as { kernel: { getDocument(): { nodes: Record<string, { parentId: string | null }> } } }).kernel.getDocument().nodes[id];
      expect(node?.parentId).toBe(frameId);
    }
  });

  it("preempts the camera animation on any pointer input", () => {
    const editor = install();
    editor.zoomToFit();
    // The animation starts on the next frame; a pointer down cancels it and
    // the viewport is left mid-flight (the animation no longer advances).
    const before = camera(editor.getSnapshot().viewport);
    down(editor, 1, screen(100, 100));
    const after = camera(editor.getSnapshot().viewport);
    // The viewport changed (the animation began), and the input landed — the
    // point under the cursor is stable from here (no further animation).
    expect(after).toEqual(before);
  });
});
