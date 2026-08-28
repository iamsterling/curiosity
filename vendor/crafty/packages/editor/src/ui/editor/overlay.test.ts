import { describe, expect, it } from "vitest";
import {
  createDefaultPageCanvas,
  type PageRecord,
} from "../../kernel/index.js";
import type { Viewport } from "@crafty/scene-renderer";
import {
  GridOpacityTransition,
  gridOpacityAt,
  pageOverlay,
} from "./overlay.js";

const page = (overrides: Partial<PageRecord["canvas"]> = {}): PageRecord => ({
  id: "page-a",
  name: "A",
  rootId: "page-root-a",
  canvas: { ...createDefaultPageCanvas(), ...overrides },
});

const viewport: Viewport = { panX: 0, panY: 0, zoom: 2 };
const size = { width: 1000, height: 800 };

describe("page overlay adapter", () => {
  it("reveals the grid over the host-timed transition instead of at its settled brightness", () => {
    const transition = new GridOpacityTransition();
    const settled = gridOpacityAt(6);

    expect(transition.advance(settled, 0)).toBeLessThan(settled);
    expect(transition.isActive).toBe(true);

    const intermediate = transition.advance(settled, 0.225);
    expect(intermediate).toBeGreaterThan(0);
    expect(intermediate).toBeLessThan(settled);

    expect(transition.advance(settled, 0.225)).toBe(settled);
    expect(settled).toBe(0.6);
    expect(settled).toBeLessThan(1);
    expect(transition.isActive).toBe(false);
    expect(transition.needsRender).toBe(true);
    transition.markSubmitted();
    expect(transition.needsRender).toBe(false);
  });

  it("reverses an active grid reveal when zooming out", () => {
    const transition = new GridOpacityTransition();
    const settled = gridOpacityAt(6);
    transition.advance(settled, 0);
    transition.advance(settled, 0.225);
    const beforeZoomOut = transition.opacity;

    const lowerTarget = gridOpacityAt(5.3);
    const afterZoomOut = transition.advance(lowerTarget, 0.1);

    expect(afterZoomOut).toBeLessThan(beforeZoomOut);
    expect(afterZoomOut).toBeGreaterThan(lowerTarget);
    expect(transition.isActive).toBe(true);
    const continuing = transition.advance(lowerTarget, 0.225);
    expect(continuing).toBeLessThan(afterZoomOut);
    expect(continuing).toBeGreaterThanOrEqual(lowerTarget);
  });

  it("decreases on the next frame when an early zoom-out still has a higher target", () => {
    const transition = new GridOpacityTransition();
    transition.advance(gridOpacityAt(6), 0);
    transition.advance(gridOpacityAt(6), 0.1);
    const beforeZoomOut = transition.opacity;

    const afterZoomOut = transition.advance(gridOpacityAt(5.8), 0.01);

    expect(gridOpacityAt(5.8)).toBeGreaterThan(beforeZoomOut);
    expect(afterZoomOut).toBeLessThan(beforeZoomOut);
    expect(afterZoomOut).toBeGreaterThan(0);
  });

  it("keeps a max-dt reversal above zero instead of overshooting and rebounding", () => {
    const transition = new GridOpacityTransition();
    transition.advance(gridOpacityAt(6), 0);
    transition.advance(gridOpacityAt(6), 0.1);
    const beforeZoomOut = transition.opacity;
    const lowerTargetAboveCurrent = gridOpacityAt(5.8);

    const reversed = transition.advance(lowerTargetAboveCurrent, 0.25);
    const continuing = transition.advance(lowerTargetAboveCurrent, 0.1);

    expect(lowerTargetAboveCurrent).toBeGreaterThan(beforeZoomOut);
    expect(reversed).toBeGreaterThan(0);
    expect(reversed).toBeLessThan(beforeZoomOut);
    expect(continuing).toBeLessThan(reversed);
    expect(continuing).toBeGreaterThanOrEqual(0);

    transition.advance(lowerTargetAboveCurrent, 0.1);
    const descendingEndpoint = transition.advance(lowerTargetAboveCurrent, 0.1);
    const settlingTowardTarget = transition.advance(
      lowerTargetAboveCurrent,
      0.1,
    );
    expect(settlingTowardTarget).toBeGreaterThan(descendingEndpoint);
    expect(settlingTowardTarget).toBeLessThan(lowerTargetAboveCurrent);
  });

  it("does not cross a lower descending target at max dt", () => {
    const transition = new GridOpacityTransition();
    transition.advance(gridOpacityAt(6), 0);
    transition.advance(gridOpacityAt(6), 0.3);
    const beforeZoomOut = transition.opacity;
    const lowerTargetBelowCurrent = gridOpacityAt(5.3);

    const reversed = transition.advance(lowerTargetBelowCurrent, 0.25);

    expect(reversed).toBeLessThan(beforeZoomOut);
    expect(reversed).toBeGreaterThanOrEqual(lowerTargetBelowCurrent);
  });

  it("uses the repository-grounded 450 ms duration for a full reveal", () => {
    const transition = new GridOpacityTransition();
    const settled = gridOpacityAt(6);

    transition.advance(settled, 0);
    expect(transition.advance(settled, 0.3375)).toBeLessThan(settled);
    expect(transition.advance(settled, 0.1125)).toBe(settled);
  });

  it("returns undefined without an active page", () => {
    expect(pageOverlay(undefined, viewport, size)).toBeUndefined();
  });

  it("starts the grid opacity ramp strictly above 510%", () => {
    const legacyHidden = pageOverlay(
      page({ grid: { ...createDefaultPageCanvas().grid, visible: false } }),
      viewport,
      size,
    );
    expect(legacyHidden?.packet.grid).toBeUndefined();
  });

  it("includes visible guides and hides invisible ones", () => {
    const overlay = pageOverlay(
      page({
        guides: [
          { id: "g1", axis: "x", position: 40, visible: true },
          { id: "g2", axis: "y", position: 90, visible: false },
        ],
      }),
      viewport,
      size,
    );
    expect(overlay?.packet.guides).toEqual([
      { id: "g1", axis: "x", position: 40, visible: true },
    ]);
  });

  it("keeps the grid invisible through 510% and settles at 600%", () => {
    const grid = { ...createDefaultPageCanvas().grid, visible: false };
    const hidden = pageOverlay(page({ grid }), { ...viewport, zoom: 5.1 }, size)
      ?.packet.grid;
    expect(hidden).toBeUndefined();
    const entering = pageOverlay(
      page({ grid }),
      { ...viewport, zoom: 5.55 },
      size,
    )?.packet.grid;
    expect(entering).toBeDefined();
    expect(entering?.lines[0]?.alpha).toBeCloseTo(0.3, 4);
    const distant = pageOverlay(
      page({ grid }),
      { ...viewport, zoom: 6.4 },
      size,
    )?.packet.grid;
    expect(distant).toBeDefined();
    expect(
      distant?.lines.find((line) => line.weight === "minor")?.alpha,
    ).toBeCloseTo(0.6, 4);
    expect(
      distant?.lines.find((line) => line.weight === "major")?.alpha,
    ).toBeCloseTo(0.6, 4);
    expect(
      pageOverlay(page({ grid }), { ...viewport, zoom: 5.1 }, size)?.packet
        .grid,
    ).toBeUndefined();
  });

  it("distinguishes a zero-opacity activation packet from a dim positive grid", () => {
    const gridPage = page();
    const dotsPage = page({
      grid: { ...createDefaultPageCanvas().grid, mode: "dots" },
    });
    const revealedViewport = { ...viewport, zoom: 6 };

    expect(
      pageOverlay(gridPage, revealedViewport, size, 0)?.packet.grid,
    ).toBeUndefined();
    expect(
      pageOverlay(gridPage, revealedViewport, size, 0.01)?.packet.grid?.lines[0]
        ?.alpha,
    ).toBeCloseTo(0.01, 12);
    expect(
      pageOverlay(dotsPage, revealedViewport, size, 0.01)?.packet.grid?.dots?.[0]
        ?.alpha,
    ).toBeCloseTo(0.01, 12);
  });

  it("caps every fixed-grid line and axis at the settled opacity", () => {
    const fading = pageOverlay(page(), { ...viewport, zoom: 7.8 }, size)?.packet
      .grid;
    expect(
      fading?.lines.find((line) => line.weight === "minor")?.alpha,
    ).toBeGreaterThan(0);
    expect(
      fading?.lines.find((line) => line.weight === "minor")?.alpha,
    ).toBeCloseTo(0.6, 4);
    expect(
      fading?.lines.find((line) => line.weight === "major")?.alpha,
    ).toBeGreaterThan(0.2);
    expect(
      fading?.lines.find((line) => line.weight === "major")?.alpha,
    ).toBeCloseTo(0.6, 4);
    expect(fading?.axes?.[0]?.alpha).toBeCloseTo(0.6, 3);
  });

  it("uses the same authored grid scale at high zoom", () => {
    for (const zoom of [16, 32, 256]) {
      const grid = pageOverlay(page(), { ...viewport, zoom }, size)?.packet
        .grid;
      expect(grid?.minorStep).toBe(1);
      expect(grid?.majorStep).toBe(5);
    }
  });

  it("keeps the fixed grid level stable across renders", () => {
    const first = pageOverlay(page(), viewport, size);
    const second = pageOverlay(page(), viewport, size);
    expect(second?.level).toBe(first?.level);
  });

  it("switches to dots mode when the page grid is dots and visible", () => {
    const overlay = pageOverlay(
      page({
        grid: {
          ...createDefaultPageCanvas().grid,
          mode: "dots",
          visible: true,
        },
      }),
      { ...viewport, zoom: 7.4 },
      size,
    );
    expect(overlay?.packet.grid?.mode).toBe("dots");
  });
});
