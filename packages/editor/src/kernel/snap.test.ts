import { describe, expect, it } from "vitest";
import type { EditorDocument } from "./document.js";
import { migrateDocument, sceneToEditorDocument } from "./index.js";
import { objectSnapPositions, snapCorner, snapMove, snapPenPoint } from "./snap.js";
import type { Scene } from "@crafty/scene-model";

/** A minimal two-rectangle scene — one target node and one "other" node the
 *  snap families see. Positions are on round numbers so the expectations are
 *  exact. */
const scene = (): Scene => ({
  schemaVersion: 1,
  id: "scene-snap",
  name: "Snap",
  revision: 0,
  frames: [
    {
      id: "frame-home",
      name: "Page 1",
      bounds: { x: 0, y: 0, width: 1280, height: 800 },
      stories: [],
      layers: [
        {
          id: "layer-a",
          name: "A",
          type: "rectangle",
          bounds: { x: 100, y: 100, width: 200, height: 100 },
          transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
          fill: "#ff0000",
          stroke: "#00000000",
          opacity: 1,
          cornerRadius: 0,
          visible: true,
          zIndex: 0,
        },
        {
          id: "layer-b",
          name: "B",
          type: "rectangle",
          bounds: { x: 400, y: 250, width: 80, height: 60 },
          transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
          fill: "#00ff00",
          stroke: "#00000000",
          opacity: 1,
          cornerRadius: 0,
          visible: true,
          zIndex: 1,
        },
        {
          id: "layer-c",
          name: "C",
          type: "rectangle",
          bounds: { x: 460, y: 250, width: 60, height: 40 },
          transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
          fill: "#0000ff",
          stroke: "#00000000",
          opacity: 1,
          cornerRadius: 0,
          visible: true,
          zIndex: 2,
        },
      ],
    },
  ],
});

const document = (): EditorDocument => {
  const migrated = migrateDocument(sceneToEditorDocument(scene()));
  if (!migrated.ok || !migrated.document) throw new Error("seed failed to migrate");
  return migrated.document;
};

const page = (): {
  document: EditorDocument;
  pageId: string;
  zoom: number;
} => ({
  document: document(),
  pageId: "page-frame-home",
  zoom: 1,
});

const options = (doc: EditorDocument, excludeA = false) => ({
  zoom: 1,
  snap: doc.pages["page-frame-home"]!.canvas.snap,
  grid: doc.pages["page-frame-home"]!.canvas.grid,
  guides: doc.pages["page-frame-home"]!.canvas.guides,
  objects: objectSnapPositions(doc, "page-frame-home", excludeA ? new Set(["layer-a"]) : undefined),
});

describe("objectSnapPositions", () => {
  it("emits each visible node's left/center/right and top/center/bottom world edges", () => {
    const doc = document();
    const positions = objectSnapPositions(doc, "page-frame-home");
    expect(positions.x).toEqual([100, 200, 300, 400, 440, 480, 460, 490, 520]);
    expect(positions.xGroups).toEqual([[100, 200, 300], [400, 440, 480], [460, 490, 520]]);
    expect(positions.y).toEqual([100, 150, 200, 250, 280, 310, 250, 270, 290]);
    expect(positions.yGroups).toEqual([[100, 150, 200], [250, 280, 310], [250, 270, 290]]);
  });

  it("excludes the named nodes (the moving selection must not magnetize to itself)", () => {
    const doc = document();
    const positions = objectSnapPositions(doc, "page-frame-home", new Set(["layer-a"]));
    expect(positions.x).toEqual([400, 440, 480, 460, 490, 520]);
    expect(positions.y).toEqual([250, 280, 310, 250, 270, 290]);
  });

  it("skips locked and invisible nodes", () => {
    const doc = document();
    doc.nodes["layer-b"] = { ...doc.nodes["layer-b"]!, locked: true };
    const positions = objectSnapPositions(doc, "page-frame-home");
    expect(positions.x).toEqual([100, 200, 300, 460, 490, 520]);
  });
});

describe("snapPenPoint", () => {
  it("snaps an anchor onto an existing path anchor within tolerance (path-point)", () => {
    const doc = document();
    const { text: _text, ...layer } = doc.nodes["layer-a"]!;
    doc.nodes["layer-a"] = {
      ...layer,
      kind: "path",
      path: {
        points: {
          p1: {
            id: "p1",
            subpathId: "s1",
            order: "00000000",
            x: 0,
            y: 0,
            handleMode: "corner",
          },
        },
        subpaths: { s1: { id: "s1", closed: false } },
        fillRule: "nonzero",
      },
    };
    // The anchor sits at world (100, 100) (bounds placement + local 0,0);
    // the cursor 5 units off snaps onto it.
    const result = snapPenPoint(doc, "page-frame-home", { x: 105, y: 100 }, options(doc));
    expect(result.point).toEqual({ x: 100, y: 100 });
    expect(result.snap?.kind).toBe("path-point");
  });

  it("snaps onto the nearest point of a path segment and carries its midpoint", () => {
    const doc = document();
    const { text: _text, ...layer } = doc.nodes["layer-a"]!;
    doc.nodes["layer-a"] = {
      ...layer,
      kind: "path",
      path: {
        points: {
          p1: {
            id: "p1",
            subpathId: "s1",
            order: "00000000",
            x: 0,
            y: 0,
            handleMode: "corner",
          },
          p2: {
            id: "p2",
            subpathId: "s1",
            order: "00010000",
            x: 200,
            y: 0,
            handleMode: "corner",
          },
        },
        subpaths: { s1: { id: "s1", closed: false } },
        fillRule: "nonzero",
      },
    };
    // The segment runs world (100,100) → (300,100); the cursor is 8 units
    // above it. The anchor snaps down onto the line at the cursor's x, and
    // the half-way indicator is the segment's midpoint (200, 100). The
    // closest point carries the hit test's sampling precision (the search
    // grid is the same one the pointer-down hit tests use).
    const result = snapPenPoint(doc, "page-frame-home", { x: 140, y: 92 }, options(doc));
    expect(result.point.y).toBe(100);
    expect(Math.abs(result.point.x - 140)).toBeLessThan(3);
    expect(result.snap?.kind).toBe("path-segment");
    expect(result.snap?.midpoint).toEqual({ x: 200, y: 100 });
  });

  it("falls back to per-axis families (object edges) when no path geometry is near", () => {
    const doc = document();
    // 10 units from layer-b's left edge (400): the x axis snaps, the y stays.
    const result = snapPenPoint(doc, "page-frame-home", { x: 410, y: 123 }, options(doc));
    expect(result.point.x).toBe(400);
    expect(result.point.y).toBe(123);
    expect(result.snap?.kind).toBe("axis");
  });

  it("reports no snap beyond tolerance", () => {
    const doc = document();
    // (600, 560) is beyond every family: objects end at x 520 / y 290, the
    // rhythm ladders stop at 700 / 400.
    const result = snapPenPoint(doc, "page-frame-home", { x: 600, y: 560 }, options(doc));
    expect(result.point).toEqual({ x: 600, y: 560 });
    expect(result.snap).toBeUndefined();
  });
});

describe("snapCorner", () => {
  it("snaps each axis independently to the nearest visible target", () => {
    const doc = document();
    const snapped = snapCorner({ x: 408, y: 255 }, options(doc));
    expect(snapped.x).toBe(400);
    expect(snapped.y).toBe(250);
  });
});

describe("snapMove", () => {
  const bounds = { x: 100, y: 100, width: 200, height: 100 };

  it("aligns the nearest edge onto a candidate and reports the guide position", () => {
    const doc = document();
    // The drag's right edge target is 395 (300 + 95), 5 from layer-b's left
    // edge (400): the delta snaps to 100 and the guide reports 400.
    const result = snapMove(bounds, { x: 95, y: 30 }, options(doc, true));
    expect(result.delta.x).toBe(100);
    expect(result.guides.x).toBe(400);
    expect(result.choices.x).toEqual({ family: "object", axis: "x", value: 400, source: "right" });
    expect(result.delta.y).toBe(30);
    expect(result.guides.y).toBeUndefined();
  });

  it("identifies the deterministic nearest source feature", () => {
    const doc = document();
    const result = snapMove(bounds, { x: 195, y: 0 }, options(doc, true));
    expect(result.delta.x).toBe(200);
    expect(result.choices.x).toEqual({ family: "object", axis: "x", value: 400, source: "center-x" });
  });

  it("never reports a guide for a no-op snap (the edge already sat on the candidate)", () => {
    const doc = document();
    // A zero drag on a selection whose edges coincide with candidate lines
    // (the no-op case) must not draw a line on the box itself.
    const result = snapMove(bounds, { x: 0, y: 0 }, options(doc, true));
    expect(result.delta).toEqual({ x: 0, y: 0 });
    expect(result.guides).toEqual({});
  });

  it("snaps the southeast resize handle instead of unrelated edges", () => {
    const doc = document();
    // Corner target (396, 246) is 4 units from layer-b's corner (400, 250):
    // both axes snap.
    const result = snapMove(bounds, { x: 96, y: 46 }, { ...options(doc, true), resizeHandle: "se" });
    expect(result.delta.x).toBe(100);
    expect(result.delta.y).toBe(50);
    expect(result.guides).toEqual({ x: 400, y: 250 });
  });

  it.each([
    ["n", undefined, "top"],
    ["ne", "right", "top"],
    ["e", "right", undefined],
    ["se", "right", "bottom"],
    ["s", undefined, "bottom"],
    ["sw", "left", "bottom"],
    ["w", "left", undefined],
    ["nw", "left", "top"],
  ] as const)("reports only the moving features for resize handle %s", (resizeHandle, xSource, ySource) => {
    const delta = {
      x: xSource === "left" ? 299 : xSource === "right" ? 99 : 0,
      y: ySource === "top" ? 149 : ySource === "bottom" ? 49 : 0,
    };
    const result = snapMove(bounds, delta, { ...options(document(), true), resizeHandle });
    expect(result.choices.x?.source).toBe(xSource);
    expect(result.choices.y?.source).toBe(ySource);
  });

  it("keeps the pixel family out of moves: a sub-pixel delta is left exact when nothing visible is near", () => {
    const doc = document();
    // At zoom 1 a 0.5-unit drag would round to a pixel; the move snap must
    // leave it exact (no silent correction, no guide line).
    const result = snapMove(bounds, { x: 60.5, y: 0 }, options(doc, true));
    expect(result.delta.x).toBe(60.5);
    expect(result.guides).toEqual({});
  });

  it("respects the screen-space tolerance (12 px / zoom)", () => {
    const doc = document();
    // The right edge target 380 is 20 units from layer-b's left edge (400):
    // beyond tolerance, no snap.
    const result = snapMove(bounds, { x: 80, y: 0 }, options(doc, true));
    expect(result.delta).toEqual({ x: 80, y: 0 });
    expect(result.guides).toEqual({});
  });

  it("continues an equal gap (the rhythm family) when the edge passes near it", () => {
    const doc = document();
    // The remaining objects' left edges are 400 (b) and 460 (c) — one gap
    // of 60. Dragging layer-a's right edge (300 + dx) toward 345 lands
    // within tolerance of 340 = 400 − 60: the rhythm line that continues
    // the gap BEFORE the first object. Nothing in the object family is near
    // (400 is 55 away), so the rhythm family catches it.
    const result = snapMove(bounds, { x: 45, y: 0 }, options(doc, true));
    expect(result.delta.x).toBe(40);
    expect(result.guides.x).toBe(340);
  });

  it("never lets the rhythm family beat a real object alignment", () => {
    const doc = document();
    // Right-edge target 398: the object family's 400 (2 away) must win over
    // any rhythm line — same landing, but the object alignment is the
    // certain one.
    const result = snapMove(bounds, { x: 98, y: 0 }, options(doc, true));
    expect(result.delta.x).toBe(100);
    expect(result.guides.x).toBe(400);
  });

  it("keeps rhythm quiet when the object family is off", () => {
    const doc = document();
    const off = { ...options(doc, true), snap: { ...doc.pages["page-frame-home"]!.canvas.snap, objects: false } };
    const result = snapMove(bounds, { x: 45, y: 0 }, off);
    expect(result.delta.x).toBe(45);
    expect(result.guides).toEqual({});
  });
});
