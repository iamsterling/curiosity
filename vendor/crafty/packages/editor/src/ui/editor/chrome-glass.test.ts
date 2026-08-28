import { describe, expect, it } from "vitest";

import {
  ChromeGlassTracker,
  CHROME_SPRINGS,
  PRESS_SQUASH,
  chromeGlassSprings,
  integrateChromeGlassSprings,
  integrateSpring,
  springAtRest,
  stepSpring,
  type SpringState,
} from "./chrome-glass.js";

/**
 * The chrome glass springs: the demo's integrator (semi-implicit Euler,
 * sub-stepped at 1/120) re-implemented in the editor's terms. The assertions
 * here pin the behaviour the packet depends on: settle, the underdamped
 * overshoot, press/release round-trips, and the tracker's measurement math.
 */

describe("spring integrator", () => {
  it("settles on its target", () => {
    let state: SpringState = springAtRest(1);
    for (let frame = 0; frame < 60; frame += 1) {
      state = integrateSpring(state, 0.93, 300, 15, 1 / 60);
    }
    expect(state.value).toBeCloseTo(0.93, 3);
    expect(Math.abs(state.velocity)).toBeLessThan(1e-3);
  });

  it("overshoots underdamped (the liquid squash) and settles back", () => {
    let state: SpringState = springAtRest(1);
    let min = 1;
    for (let frame = 0; frame < 90; frame += 1) {
      state = integrateSpring(state, 0.93, CHROME_SPRINGS.scale.stiffness, CHROME_SPRINGS.scale.damping, 1 / 60);
      min = Math.min(min, state.value);
    }
    // damping 15 with stiffness 300 is underdamped: it must cross the target.
    expect(min).toBeLessThan(0.93);
    expect(state.value).toBeCloseTo(0.93, 3);
  });

  it("is frame-rate independent within a tolerance (sub-stepping)", () => {
    const target = 0.93;
    let slow: SpringState = springAtRest(1);
    let fast: SpringState = springAtRest(1);
    for (let frame = 0; frame < 30; frame += 1) {
      slow = integrateSpring(slow, target, 300, 15, 1 / 30);
      fast = integrateSpring(fast, target, 300, 15, 1 / 120);
    }
    // The same elapsed time integrated at different frame rates must land
    // near the same value (the substep keeps fast springs stable).
    expect(Math.abs(slow.value - fast.value)).toBeLessThan(0.01);
  });

  it("clamps pathological dt (tab-away bursts) without exploding", () => {
    let state: SpringState = springAtRest(1);
    state = integrateSpring(state, 0.93, 300, 15, 5);
    expect(Number.isFinite(state.value)).toBe(true);
    expect(Number.isFinite(state.velocity)).toBe(true);
  });
});

describe("chrome glass springs", () => {
  it("press squashes the pill, release restores it", () => {
    const springs = chromeGlassSprings();
    springs.pressedTarget = 1;
    for (let frame = 0; frame < 30; frame += 1) {
      integrateChromeGlassSprings(springs, 1 / 60);
    }
    expect(springs.scaleX.value).toBeLessThan(1);
    expect(springs.pressed.value).toBeGreaterThan(0.99);
    springs.pressedTarget = 0;
    for (let frame = 0; frame < 30; frame += 1) {
      integrateChromeGlassSprings(springs, 1 / 60);
    }
    expect(springs.scaleX.value).toBeCloseTo(1, 2);
    expect(springs.pressed.value).toBeCloseTo(0, 1);
  });

  it("hover lifts the specular spring, leave drops it", () => {
    const springs = chromeGlassSprings();
    springs.hoveredTarget = 1;
    for (let frame = 0; frame < 20; frame += 1) {
      integrateChromeGlassSprings(springs, 1 / 60);
    }
    expect(springs.hovered.value).toBeGreaterThan(0.9);
    springs.hoveredTarget = 0;
    for (let frame = 0; frame < 20; frame += 1) {
      integrateChromeGlassSprings(springs, 1 / 60);
    }
    expect(springs.hovered.value).toBeLessThan(0.1);
  });

  it("parks settled springs exactly on their targets (the draw loop idles)", () => {
    const springs = chromeGlassSprings();
    for (let frame = 0; frame < 600; frame += 1) {
      integrateChromeGlassSprings(springs, 1 / 60);
    }
    expect(springs.scaleX.value).toBe(1);
    expect(springs.scaleY.value).toBe(1);
    expect(springs.pressed.value).toBe(0);
    expect(springs.hovered.value).toBe(0);
    springs.pressedTarget = 1;
    for (let frame = 0; frame < 600; frame += 1) {
      integrateChromeGlassSprings(springs, 1 / 60);
    }
    expect(springs.pressed.value).toBe(1);
    expect(springs.scaleX.value).toBe(PRESS_SQUASH);
  });

  it("single Euler step matches the documented form", () => {
    const state = springAtRest(0);
    const next = stepSpring(state, 1, 800, 50, 1 / 60);
    // v = 0 + (1-0)*800/60 - 0*50/60 = 13.33; x = 0 + 13.33/60 = 0.222
    expect(next.velocity).toBeCloseTo(13.333, 2);
    expect(next.value).toBeCloseTo(0.2222, 2);
  });
});

describe("chrome glass tracker measurement", () => {
  it("measures canvas-relative rects and packs radius from the attribute", () => {
    const tracker = new ChromeGlassTracker();
    const canvas = { left: 40, top: 20 } as DOMRect;
    const pill = {
      isConnected: true,
      id: "topbar",
      dataset: {},
      getAttribute: (name: string) => (name === "data-chrome-radius" ? "999" : null),
      getBoundingClientRect: () => ({ left: 100, top: 30, width: 600, height: 42 }),
      addEventListener: () => undefined,
    } as unknown as HTMLElement;
    tracker.attach(pill);
    const surfaces = tracker.measure(canvas);
    expect(surfaces).toHaveLength(1);
    expect(surfaces[0]).toMatchObject({
      id: "topbar",
      bounds: { x: 60, y: 10, width: 600, height: 42 },
      radius: 999,
      scaleX: 1,
      scaleY: 1,
      pressed: 0,
      hovered: 0,
    });
  });

  it("drops disconnected elements and stays ordered", () => {
    const tracker = new ChromeGlassTracker();
    const canvas = { left: 0, top: 0 } as DOMRect;
    const make = (id: string, connected: boolean, left: number): HTMLElement =>
      ({
        id,
        isConnected: connected,
        dataset: {},
        getAttribute: () => null,
        getBoundingClientRect: () => ({ left, top: 0, width: 100, height: 40 }),
        addEventListener: () => undefined,
      }) as unknown as HTMLElement;
    tracker.attach(make("a", true, 10));
    tracker.attach(make("b", false, 10));
    tracker.attach(make("c", true, 10));
    expect(tracker.measure(canvas).map((surface) => surface.id)).toEqual(["a", "c"]);
  });
});
