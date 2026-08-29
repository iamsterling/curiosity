import { describe, expect, it } from "vitest";
import { clampViewport, clampWorldLimit, inverseTransform, multiplyTransforms, resizeRect, screenToWorld, type Viewport, viewportCenteredAt, WORLD_LIMIT, ZOOM_MAX, ZOOM_MIN, worldToScreen, zoomAt, zoomTo } from "./coordinates.js";
import { createFoundationDocument } from "./document.js";
import { createEditorKernel } from "./kernel.js";

describe("unified zoom clamp and world pan limit", () => {
  it("centres one world point through the authoritative viewport transform", () => {
    const viewport = viewportCenteredAt({ x: 400, y: 250 }, { width: 1_000, height: 800 }, 0.75, 2);
    expect(worldToScreen({ x: 400, y: 250 }, viewport)).toEqual({ x: 500, y: 400 });
    expect(viewport).toEqual({ panX: 200, panY: 212.5, zoom: 0.75, devicePixelRatio: 2 });
  });

  it("inverts an affine transform for selection gesture projection", () => {
    const transform = { a: 0, b: 2, c: -3, d: 0, e: 40, f: -20 };
    const inverse = inverseTransform(transform);
    expect(inverse).toBeDefined();
    expect(multiplyTransforms(transform, inverse!)).toEqual({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0,
    });
    expect(inverseTransform({ ...transform, b: 0 })).toBeUndefined();
  });

  it("resizes from every handle while anchoring the opposite edge", () => {
    const start = { x: 10, y: 20, width: 100, height: 80 };
    expect(resizeRect(start, "nw", -5, -10, 10)).toEqual({ x: 5, y: 10, width: 105, height: 90 });
    expect(resizeRect(start, "n", 0, 10, 10)).toEqual({ x: 10, y: 30, width: 100, height: 70 });
    expect(resizeRect(start, "ne", 5, -10, 10)).toEqual({ x: 10, y: 10, width: 105, height: 90 });
    expect(resizeRect(start, "e", 5, 0, 10).width).toBe(105);
    expect(resizeRect(start, "se", 5, 10, 10)).toEqual({ x: 10, y: 20, width: 105, height: 90 });
    expect(resizeRect(start, "s", 0, 10, 10).height).toBe(90);
    expect(resizeRect(start, "sw", -5, 10, 10)).toEqual({ x: 5, y: 20, width: 105, height: 90 });
    expect(resizeRect(start, "w", 5, 0, 10)).toEqual({ x: 15, y: 20, width: 95, height: 80 });
    expect(resizeRect(start, "w", 200, 0, 10).width).toBe(10);
  });
  it("exports one documented zoom clamp range and world limit used by kernel and renderer", () => {
    expect(ZOOM_MIN).toBe(0.01);
    expect(ZOOM_MAX).toBe(256);
    expect(WORLD_LIMIT).toBe(1e6);
    expect(ZOOM_MIN).toBeLessThan(ZOOM_MAX);
  });

  it("keeps the zoom anchor invariant across factors, anchors, and zooms (test matrix #1)", () => {
    const baseViewports = [
      { panX: 0, panY: 0, zoom: 1, devicePixelRatio: 1 },
      { panX: 1234, panY: -5678, zoom: 0.25, devicePixelRatio: 2 },
      { panX: -99, panY: 88, zoom: 4, devicePixelRatio: 1 },
      { panX: 1e5, panY: -2e5, zoom: 12, devicePixelRatio: 1.5 }
    ];
    const anchors = [{ x: 0, y: 0 }, { x: 10, y: -10 }, { x: 640, y: 360 }, { x: -300, y: 500 }];
    const factors = [0.25, 0.5, 1, 1.5, 2, 4];
    for (const base of baseViewports) {
      for (const factor of factors) {
        for (const anchor of anchors) {
          const expectedWorld = screenToWorld(anchor, base);
          const next = zoomAt(base, anchor, factor);
          const world = screenToWorld(anchor, next);
          expect(world.x).toBeCloseTo(expectedWorld.x, 9);
          expect(world.y).toBeCloseTo(expectedWorld.y, 9);
          expect(next.zoom).toBeGreaterThanOrEqual(ZOOM_MIN);
          expect(next.zoom).toBeLessThanOrEqual(ZOOM_MAX);
          expect(Math.abs(next.panX)).toBeLessThanOrEqual(WORLD_LIMIT);
          expect(Math.abs(next.panY)).toBeLessThanOrEqual(WORLD_LIMIT);
        }
      }
    }
  });

  it("clamps zoom to the unified range in both directions", () => {
    const base = { panX: 0, panY: 0, zoom: 1, devicePixelRatio: 1 };
    let zoomedIn = base;
    let zoomedOut = base;
    for (let index = 0; index < 8; index += 1) {
      zoomedIn = zoomAt(zoomedIn, { x: 10, y: 10 }, 4);
      zoomedOut = zoomAt(zoomedOut, { x: 10, y: 10 }, 0.25);
    }
    expect(zoomedIn.zoom).toBe(ZOOM_MAX);
    expect(zoomedOut.zoom).toBe(ZOOM_MIN);
    expect(zoomAt(base, { x: 10, y: 10 }, Number.NaN).zoom).toBe(1);
    const factorCapped = zoomAt(base, { x: 10, y: 10 }, 1000);
    expect(factorCapped.zoom).toBe(4);
    expect(Math.abs(factorCapped.panX)).toBeLessThanOrEqual(WORLD_LIMIT);
  });

  it("sets an exact zoom through the kernel helper while keeping the anchor stable", () => {
    const viewport = { panX: 120, panY: -40, zoom: 0.25, devicePixelRatio: 2 };
    const anchor = { x: 400, y: 250 };
    const zoomed = zoomTo(viewport, anchor, 1);
    expect(zoomed.zoom).toBe(1);
    expect(screenToWorld(anchor, zoomed).x).toBeCloseTo(screenToWorld(anchor, viewport).x);
    expect(screenToWorld(anchor, zoomed).y).toBeCloseTo(screenToWorld(anchor, viewport).y);
    expect(viewport).toEqual({ panX: 120, panY: -40, zoom: 0.25, devicePixelRatio: 2 });
  });

  it("clamps zoomTo to the shared zoom window and rejects non-finite targets", () => {
    const viewport = { panX: 0, panY: 0, zoom: 1, devicePixelRatio: 1 };
    expect(zoomTo(viewport, { x: 0, y: 0 }, 1e6).zoom).toBe(ZOOM_MAX);
    expect(zoomTo(viewport, { x: 0, y: 0 }, -1e6).zoom).toBe(ZOOM_MIN);
    expect(zoomTo(viewport, { x: 0, y: 0 }, Number.NaN).zoom).toBe(viewport.zoom);
    expect(zoomTo(viewport, { x: 0, y: 0 }, Number.POSITIVE_INFINITY).zoom).toBe(viewport.zoom);
  });

  it("clamps pan at the viewport boundary to +/-WORLD_LIMIT", () => {
    expect(clampWorldLimit(WORLD_LIMIT + 1)).toBe(WORLD_LIMIT);
    expect(clampWorldLimit(-WORLD_LIMIT - 1)).toBe(-WORLD_LIMIT);
    expect(clampWorldLimit(42)).toBe(42);
    const clamped = clampViewport({ panX: 2e6, panY: -2e6, zoom: 1000, devicePixelRatio: 2 });
    expect(clamped.panX).toBe(WORLD_LIMIT);
    expect(clamped.panY).toBe(-WORLD_LIMIT);
    expect(clamped.zoom).toBe(ZOOM_MAX);
    expect(clamped.devicePixelRatio).toBe(2);
  });

  it("keeps pan within the world limit across repeated extreme zooms", () => {
    let viewport: Viewport = { panX: WORLD_LIMIT, panY: -WORLD_LIMIT, zoom: ZOOM_MIN, devicePixelRatio: 1 };
    for (let index = 0; index < 20; index += 1) {
      viewport = zoomAt(viewport, { x: 800, y: 400 }, index % 2 === 0 ? 4 : 0.25);
      expect(Math.abs(viewport.panX)).toBeLessThanOrEqual(WORLD_LIMIT);
      expect(Math.abs(viewport.panY)).toBeLessThanOrEqual(WORLD_LIMIT);
      expect(viewport.zoom).toBeGreaterThanOrEqual(ZOOM_MIN);
      expect(viewport.zoom).toBeLessThanOrEqual(ZOOM_MAX);
    }
  });

  it("sanitizes non-finite viewport values through the kernel setViewport path", () => {
    const kernel = createEditorKernel(createFoundationDocument());
    kernel.setViewport({ panX: Number.NaN, panY: 50, zoom: Number.POSITIVE_INFINITY, devicePixelRatio: 1 });
    const viewport = kernel.getState().viewport;
    expect(viewport.panX).toBe(0);
    expect(viewport.zoom).toBe(1);
    expect(viewport.panY).toBe(50);
    kernel.setViewport({ panX: 3e6, panY: -3e6, zoom: 0.001, devicePixelRatio: 1 });
    const clamped = kernel.getState().viewport;
    expect(clamped.panX).toBe(1e6);
    expect(clamped.panY).toBe(-1e6);
    expect(clamped.zoom).toBe(0.01);
  });
});
