import { describe, expect, it } from "vitest";
import type { GridDescriptor, GuideRecord, SnapSettings } from "./document.js";
import {
  acceptedGridOpacityForViewport,
  gridVisibilityProgressAt,
  isZoomDrivenGridDisplayed,
  gridPlan,
  gridStepForZoom,
  snapAxis,
  snapValue,
  type SnapCandidate,
} from "./grid.js";
import { WORLD_LIMIT, SNAP_TOLERANCE_SCREEN_PX } from "./coordinates.js";

const grid = (overrides: Partial<GridDescriptor> = {}): GridDescriptor => ({ mode: "lines", majorSpacing: 40, minorStep: 5, originX: 0, originY: 0, ...overrides });
const snapAll: SnapSettings = { grid: true, guides: true, objects: true, pixel: true };
const viewport = (zoom: number): { panX: number; panY: number; zoom: number; width: number; height: number } => ({ panX: 0, panY: 0, zoom, width: 1920, height: 1080 });
const sweepViewport = (zoom: number): { panX: number; panY: number; zoom: number; width: number; height: number } => ({ panX: 0, panY: 0, zoom, width: 320, height: 180 });

describe("fixed pixel grid", () => {
  it("uses the authoritative 5.1x to 6x visibility ramp", () => {
    expect(gridVisibilityProgressAt({ zoom: 5.1 })).toBe(0);
    expect(gridVisibilityProgressAt({ zoom: 5.55 })).toBeCloseTo(0.5, 12);
    expect(gridVisibilityProgressAt({ zoom: 6 })).toBe(1);
  });
  it("uses one authored grid scale at every zoom", () => {
    for (let step = 0; step < 60; step += 1) {
      const zoom = 0.05 * (3.9 / 0.05) ** (step / 59);
      const plan = gridPlan(sweepViewport(zoom), grid(), WORLD_LIMIT);
      expect(plan.level).toBe(0);
      expect(plan.minorStep).toBe(1);
      expect(plan.majorStep).toBe(5);
      for (const line of plan.lines) {
        const multiple = (line.position - 0) / plan.minorStep;
        expect(Math.abs(multiple - Math.round(multiple))).toBeLessThan(1e-9);
      }
    }
  });

  it("keeps the authored grid scale stable across a zoom sweep", () => {
    for (let step = 0; step < 500; step += 1) {
      const zoom = 3.9 * (0.05 / 3.9) ** (step / 499);
      expect(gridPlan(sweepViewport(zoom), grid(), WORLD_LIMIT).minorStep).toBe(1);
    }
  });

  it("does not introduce a separate fine grid at high zoom", () => {
    for (const zoom of [16, 42, 64]) expect(gridPlan(sweepViewport(zoom), grid(), WORLD_LIMIT).minorStep).toBe(1);
  });

  it("keeps the plan independent of previous render state", () => {
    expect(gridPlan(sweepViewport(16), grid(), WORLD_LIMIT).level).toBe(0);
    expect(gridPlan(sweepViewport(16), grid(), WORLD_LIMIT).minorStep).toBe(1);
  });

  it("keeps line positions stable across zoom", () => {
    const coarse = gridPlan(sweepViewport(3.9), grid(), WORLD_LIMIT);
    const fine = gridPlan(sweepViewport(16), grid(), WORLD_LIMIT);
    const fineX = new Set(fine.lines.filter((line) => line.axis === "x").map((line) => line.position));
    const coarseX = coarse.lines.filter((line) => line.axis === "x").map((line) => line.position);
    const sharedMaxX = Math.min(sweepViewport(3.9).width / 3.9, sweepViewport(16).width / 16);
    expect(coarse.minorStep).toBe(1);
    expect(fine.minorStep).toBe(1);
    for (const position of coarseX.filter((position) => position <= sharedMaxX)) expect(fineX.has(position)).toBe(true);
  });

  it("plans the LOD grid at every zoom, including the pixel regime", () => {
    // One ladder, every zoom: the plan carries the minor/major lines and
    // axes at every zoom — the fine descent (zoom >= 16) takes the minors
    // to ~1 px, never a second scale.
    for (const zoom of [0.5, 1, 2, 4, 8, 16]) {
      const plan = gridPlan(sweepViewport(zoom), grid(), WORLD_LIMIT);
      expect(plan.lines.length).toBeGreaterThan(0);
      expect(plan.axes.length).toBeGreaterThan(0);
    }
    expect(gridPlan(sweepViewport(16), grid(), WORLD_LIMIT).minorStep).toBe(1);
  });

  it("keeps one fixed plan regardless of legacy fade inputs", () => {
    const plan = gridPlan(sweepViewport(16), grid(), WORLD_LIMIT);
    expect(plan.level).toBe(0);
    expect(plan.minorStep).toBe(1);
    expect(plan.lines.every((line) => line.alpha === undefined)).toBe(true);
  });

  it("clips grid lines to the viewport and world limit and emits axes at the origin", () => {
    const plan = gridPlan(viewport(1), grid({ originX: 40, originY: 40 }), 1000);
    expect(plan.lines.length).toBeGreaterThan(0);
    for (const line of plan.lines) {
      if (line.axis === "x") expect(line.position).toBeGreaterThanOrEqual(0);
      if (line.axis === "x") expect(line.position).toBeLessThanOrEqual(1920);
      if (line.axis === "y") expect(line.position).toBeGreaterThanOrEqual(0);
      if (line.axis === "y") expect(line.position).toBeLessThanOrEqual(1080);
    }
    expect(plan.axes).toEqual([
      { axis: "x", position: 40, weight: "major" },
      { axis: "y", position: 40, weight: "major" },
    ]);
  });

  it("marks major lines every authored subdivision and aligns to the grid origin", () => {
    const plan = gridPlan(viewport(1), grid({ majorSpacing: 40, minorStep: 5, originX: 8, originY: 8 }), WORLD_LIMIT);
    const xMajor = plan.lines.filter((line) => line.axis === "x" && line.weight === "major");
    expect(xMajor.length).toBeGreaterThan(0);
    for (const line of xMajor) expect((line.position - 8) % 5).toBeCloseTo(0, 9);
    const xMinor = plan.lines.filter((line) => line.axis === "x" && line.weight === "minor");
    expect(xMinor.length).toBeGreaterThan(0);
    for (const line of xMinor) expect((line.position - 8) % 1).toBeCloseTo(0, 9);
  });
});

describe("snap service", () => {
  it("accepts grid opacity only for an exactly matching packet page, viewport, and grid", () => {
    const acceptedGrid = grid({ originX: 3, originY: -2 });
    const accepted = {
      opacity: 0.6,
      pageId: "page-a",
      viewport: { panX: 12, panY: -4, zoom: 6, width: 800, height: 600, pixelRatio: 2 },
      grid: acceptedGrid,
    };
    expect(
      acceptedGridOpacityForViewport(
        "page-a",
        { panX: 12, panY: -4, zoom: 6, width: 800, height: 600, pixelRatio: 2 },
        acceptedGrid,
        accepted,
      ),
    ).toBe(0.6);
    expect(
      acceptedGridOpacityForViewport(
        "page-a",
        { panX: 12, panY: -4, zoom: 6, width: 800, height: 600, pixelRatio: 2 },
        acceptedGrid,
        { ...accepted, opacity: 1 },
      ),
    ).toBe(0.6);
    expect(
      acceptedGridOpacityForViewport(
        "page-a",
        { panX: 12, panY: -4, zoom: 5.999999999999999, width: 800, height: 600, pixelRatio: 2 },
        acceptedGrid,
        accepted,
      ),
    ).toBe(0);
    expect(
      acceptedGridOpacityForViewport(
        "page-a",
        { panX: 12.000000000000002, panY: -4, zoom: 6, width: 800, height: 600, pixelRatio: 2 },
        acceptedGrid,
        accepted,
      ),
    ).toBe(0);
    expect(
      acceptedGridOpacityForViewport(
        "page-a",
        { panX: 12, panY: -4, zoom: 6, width: 801, height: 600, pixelRatio: 2 },
        acceptedGrid,
        accepted,
      ),
    ).toBe(0);
    expect(
      acceptedGridOpacityForViewport(
        "page-a",
        { panX: 12, panY: -4, zoom: 6, width: 800, height: 600, pixelRatio: 1 },
        acceptedGrid,
        accepted,
      ),
    ).toBe(0);
    expect(
      acceptedGridOpacityForViewport(
        "page-b",
        { panX: 12, panY: -4, zoom: 6, width: 800, height: 600, pixelRatio: 2 },
        acceptedGrid,
        accepted,
      ),
    ).toBe(0);
    expect(
      acceptedGridOpacityForViewport(
        "page-a",
        { panX: 12, panY: -4, zoom: 6, width: 800, height: 600, pixelRatio: 2 },
        { ...acceptedGrid, originX: 4 },
        accepted,
      ),
    ).toBe(0);
    expect(
      acceptedGridOpacityForViewport(
        "page-a",
        { panX: 12, panY: -4, zoom: 6, width: 800, height: 600, pixelRatio: 2 },
        acceptedGrid,
        undefined,
      ),
    ).toBe(0);
  });

  it("uses the zoom-driven display policy for grid snap eligibility", () => {
    const gridOnly: SnapSettings = { grid: true, guides: false, objects: false, pixel: false };
    const authoredHidden = grid({ visible: false });

    expect(isZoomDrivenGridDisplayed({ zoom: 5.1 }, authoredHidden)).toBe(false);
    expect(isZoomDrivenGridDisplayed({ zoom: 5.1001 }, authoredHidden)).toBe(true);
    expect(snapAxis({ axis: "x", value: 12.4, zoom: 5.1, snap: gridOnly, grid: authoredHidden }).snapped).toBeUndefined();
    expect(snapAxis({ axis: "x", value: 12.4, zoom: 5.1001, gridOpacity: 0, snap: gridOnly, grid: authoredHidden }).snapped).toBeUndefined();
    expect(snapAxis({ axis: "x", value: 12.24, zoom: 5.1001, gridOpacity: 0.01, snap: gridOnly, grid: authoredHidden })).toMatchObject({
      value: 12,
      snapped: { family: "grid" },
    });
    expect(snapAxis({ axis: "x", value: 12.4, zoom: 5.1001, gridOpacity: 0.01, snap: { ...gridOnly, grid: false }, grid: authoredHidden }).snapped).toBeUndefined();
  });

  it("snaps only to displayed grids and visible guides (test matrix #8)", () => {
    const noPixel: SnapSettings = { grid: true, guides: true, objects: false, pixel: false };
    // Legacy authored visibility no longer controls the zoom-driven grid.
    // Below reveal it never participates; above reveal it snaps.
    const hiddenGrid = grid({ visible: false });
    const hidden = snapAxis({ axis: "x", value: 12.4, zoom: 4, snap: noPixel, grid: hiddenGrid });
    expect(hidden.snapped?.family).toBeUndefined();
    expect(hidden.value).toBe(12.4);
    const visibleGrid = grid({ visible: true });
    const visible = snapAxis({ axis: "x", value: 12.24, zoom: 8, gridOpacity: 0.65, snap: noPixel, grid: visibleGrid });
    expect(visible.snapped?.family).toBe("grid");
    expect(visible.value).toBe(12);
    // The same rule for guides.
    const hiddenGuide: GuideRecord = { id: "guide-hidden", axis: "x", position: 30, visible: false };
    const guideHidden = snapAxis({ axis: "x", value: 30.4, zoom: 1, snap: noPixel, guides: [hiddenGuide] });
    expect(guideHidden.snapped).toBeUndefined();
    const visibleGuide: GuideRecord = { id: "guide-visible", axis: "x", position: 30, visible: true };
    const guideSnap = snapAxis({ axis: "x", value: 30.4, zoom: 1, snap: noPixel, guides: [visibleGuide] });
    expect(guideSnap.snapped?.family).toBe("guide");
    expect(guideSnap.value).toBe(30);
  });

  it("grid snap eligibility follows reveal zoom rather than legacy authored visibility", () => {
    const noPixel: SnapSettings = { grid: true, guides: false, objects: false, pixel: false };
    const visible = snapAxis({ axis: "y", value: 20.2, zoom: 8, gridOpacity: 0.65, snap: noPixel, grid: grid({ visible: false }) });
    const hidden = snapAxis({ axis: "y", value: 20.2, zoom: 4, snap: noPixel, grid: grid({ visible: true }) });
    expect(visible.snapped?.family).toBe("grid");
    expect(visible.value).toBe(20);
    expect(hidden.snapped).toBeUndefined();
    expect(hidden.value).toBe(20.2);
  });

  it("snaps by priority guide > object > grid > pixel within tolerance (test matrix #9)", () => {
    const axis = "x";
    const candidates: SnapCandidate[] = [
      { family: "pixel", axis, value: 101 },
      { family: "grid", axis, value: 100 },
      { family: "object", axis, value: 99.9 },
      { family: "guide", axis, value: 99.7 }
    ];
    // The pixel family is a REFINEMENT, not an alignment target: a
    // pixel-aligned cursor would otherwise shadow every visible target.
    expect(snapValue(100, axis, candidates, 6).snapped?.family).toBe("guide");
    expect(snapValue(100, axis, candidates.filter((candidate) => candidate.family !== "guide"), 6).snapped?.family).toBe("object");
    expect(snapValue(100, axis, candidates.filter((candidate) => candidate.family === "object" || candidate.family === "grid"), 6).snapped?.family).toBe("object");
    expect(snapValue(100, axis, candidates.filter((candidate) => candidate.family === "grid" || candidate.family === "pixel"), 6).snapped?.family).toBe("grid");
    expect(snapValue(100, axis, candidates.filter((candidate) => candidate.family === "pixel"), 6).snapped?.family).toBe("pixel");
  });

  it("chooses the nearest candidate within a family", () => {
    const axis = "y";
    const decision = snapValue(100, axis, [
      { family: "guide", axis, value: 96 },
      { family: "guide", axis, value: 103 }
    ], 6);
    expect(decision.value).toBe(103);
    expect(snapValue(100, axis, [{ family: "grid", axis, value: 50 }], 6).snapped).toBeUndefined();
  });

  it("snaps to the active pixel-grid LOD only when snap.pixel is enabled (test matrix #10)", () => {
    const on = snapAxis({ axis: "x", value: 12.37, zoom: 2, snap: { ...snapAll, pixel: true } });
    expect(on.snapped?.family).toBe("pixel");
    expect(on.value).toBe(12);
    const off = snapAxis({ axis: "x", value: 12.37, zoom: 2, snap: { ...snapAll, pixel: false } });
    expect(off.snapped?.family).not.toBe("pixel");
    expect(off.value).toBe(12.37);
    const aligned = snapAxis({ axis: "x", value: 12.37, zoom: 4, snap: { ...snapAll, pixel: true }, grid: grid() });
    expect(aligned.value).toBe(12);
    const offsetOrigin = snapAxis({ axis: "x", value: 13.37, zoom: 4, snap: { ...snapAll, pixel: true }, grid: grid({ originX: 0.5 }) });
    expect(offsetOrigin.value).toBe(13.5);
    expect(gridStepForZoom(grid(), 2)).toBe(1);
    const activeGrid = snapAxis({ axis: "x", value: 12.24, zoom: 8, gridOpacity: 0.65, snap: { ...snapAll, grid: true, pixel: false }, grid: grid({ visible: true }) });
    expect(activeGrid.value).toBe(12);
  });

  it("scales the snap tolerance to the screen-space 12 px constant (test matrix #9)", () => {
    const axis = "x";
    const candidate: SnapCandidate = { family: "guide", axis, value: 100 };
    const tolerance = SNAP_TOLERANCE_SCREEN_PX / 2;
    expect(snapValue(106.1, axis, [candidate], tolerance).snapped).toBeUndefined();
    expect(snapValue(105.9, axis, [candidate], tolerance).snapped?.value).toBe(100);
  });

  it("locally captures visible fine-grid lines while leaving a free interval", () => {
    const gridOnly: SnapSettings = { grid: true, guides: false, objects: false, pixel: false };
    const values = [9.7, 9.76, 10, 10.24, 10.26, 10.74, 10.76];
    const decisions = values.map((value) =>
      snapAxis({ axis: "x", value, zoom: 8, gridOpacity: 0.65, snap: gridOnly, grid: grid() }),
    );
    expect(decisions.map((decision) => decision.snapped?.value)).toEqual([
      undefined,
      10,
      10,
      10,
      undefined,
      undefined,
      11,
    ]);
    expect(decisions.map((decision) => decision.value)).toEqual([
      9.7,
      10,
      10,
      10,
      10.26,
      10.74,
      11,
    ]);
  });

  it.each([5.1001, 6, 12, 24, 48, 60])(
    "includes the quarter-step boundary and excludes points just outside at zoom %s",
    (zoom) => {
      const gridOnly: SnapSettings = { grid: true, guides: false, objects: false, pixel: false };
      const input = { axis: "x" as const, zoom, gridOpacity: 0.01, snap: gridOnly, grid: grid() };
      const radius = Math.min(12 / zoom, 0.25);
      expect(snapAxis({ ...input, value: 10 + radius }).snapped?.value).toBe(10);
      expect(snapAxis({ ...input, value: 10 + radius + 0.000001 }).snapped).toBeUndefined();
      expect(snapAxis({ ...input, value: 10.5 }).snapped).toBeUndefined();
    },
  );

  it("keeps the grid ineligible at exactly 5.1 zoom", () => {
    const snap: SnapSettings = { grid: true, guides: false, objects: false, pixel: false };
    expect(snapAxis({ axis: "x", value: 10.1, zoom: 5.1, gridOpacity: 0.6, snap, grid: grid() }).snapped).toBeUndefined();
  });
});
