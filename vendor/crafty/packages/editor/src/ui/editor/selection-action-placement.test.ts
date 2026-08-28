import { describe, expect, it } from "vitest";

import {
  SelectionActionPlacementCoordinator,
  placeSelectionActions,
  positionSelectionActionElement,
  projectSelectionScreenAabb,
} from "./selection-action-placement.js";

const viewport = { panX: 0, panY: 0, zoom: 1, devicePixelRatio: 1 };
const surface = { width: 80, height: 30 };
const stage = { width: 300, height: 200 };

describe("selection action placement", () => {
  it("projects all four transformed corners into one screen AABB", () => {
    const box = projectSelectionScreenAabb(
      {
        bounds: { x: 0, y: 0, width: 20, height: 10 },
        transform: { a: 0, b: 2, c: -1, d: 0, e: 100, f: 50 },
      },
      viewport,
    );
    expect(box).toEqual({ x: 90, y: 50, width: 10, height: 40 });
  });

  it("preserves an authoritative multi-selection world AABB and viewport scale", () => {
    expect(
      projectSelectionScreenAabb(
        {
          bounds: { x: 20, y: 30, width: 100, height: 60 },
          transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
        },
        { ...viewport, panX: 5, panY: 7, zoom: 2 },
      ),
    ).toEqual({ x: 45, y: 67, width: 200, height: 120 });
  });

  it.each([
    ["no selection", undefined, { hidden: true }],
    [
      "10px above",
      { bounds: { x: 100, y: 80, width: 40, height: 20 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } },
      { hidden: false, x: 80, y: 40, side: "above" },
    ],
    [
      "below flip",
      { bounds: { x: 100, y: 5, width: 40, height: 20 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } },
      { hidden: false, x: 80, y: 35, side: "below" },
    ],
    [
      "left clamp",
      { bounds: { x: -10, y: 80, width: 30, height: 20 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } },
      { hidden: false, x: 0, y: 40, side: "above" },
    ],
    [
      "right clamp",
      { bounds: { x: 285, y: 80, width: 30, height: 20 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } },
      { hidden: false, x: 220, y: 40, side: "above" },
    ],
    [
      "fully offscreen",
      { bounds: { x: 301, y: 80, width: 30, height: 20 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } },
      { hidden: true },
    ],
  ])("handles %s", (_name, selectionBox, expected) => {
    expect(placeSelectionActions(selectionBox, viewport, stage, surface)).toEqual(expected);
  });

  it("hides invalid zoom and preserves partial positive-area visibility", () => {
    const selection = {
      bounds: { x: -20, y: 50, width: 25, height: 20 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    };
    expect(placeSelectionActions(selection, viewport, stage, surface)).toMatchObject({ hidden: false, x: 0 });
    expect(placeSelectionActions(selection, { ...viewport, zoom: 0 }, stage, surface)).toEqual({ hidden: true });
  });

  it("updates a registered element imperatively without React state", () => {
    const element = {
      offsetWidth: 80,
      offsetHeight: 30,
      style: { visibility: "", transform: "" },
    } as unknown as HTMLElement;
    positionSelectionActionElement(
      element,
      {
        bounds: { x: 100, y: 80, width: 40, height: 20 },
        transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      },
      viewport,
      stage,
      { width: 80, height: 30 },
    );
    expect(element.style.visibility).toBe("visible");
    expect(element.style.transform).toBe("translate3d(80px, 40px, 0)");
    positionSelectionActionElement(element, undefined, viewport, stage, { width: 80, height: 30 });
    expect(element.style.visibility).toBe("hidden");
  });

  it("does no placement work on unchanged idle frames and invalidates each changed input once", () => {
    const writes: string[] = [];
    const element = {
      style: {
        set visibility(value: string) { writes.push(`visibility:${value}`); },
        set transform(value: string) { writes.push(`transform:${value}`); },
      },
    } as unknown as HTMLElement;
    const coordinator = new SelectionActionPlacementCoordinator();
    const selectionBox = {
      bounds: { x: 100, y: 80, width: 40, height: 20 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    };
    const base = { element, selectionBox, viewport, stage, surface };

    expect(coordinator.update(base)).toBe(true);
    expect(writes).toEqual([
      "visibility:visible",
      "transform:translate3d(80px, 40px, 0)",
    ]);
    expect(coordinator.update(base)).toBe(false);
    expect(coordinator.update({ ...base, stage: { ...stage } })).toBe(false);
    expect(coordinator.update({ ...base, stage: { width: 280, height: 200 } })).toBe(true);
    expect(coordinator.update({ ...base, surface: { width: 90, height: 30 } })).toBe(true);
    expect(coordinator.update({ ...base, viewport: { ...viewport, panX: 1 } })).toBe(true);
    expect(coordinator.update({
      ...base,
      selectionBox: { ...selectionBox, bounds: { ...selectionBox.bounds, x: 101 } },
    })).toBe(true);
  });

  it("invalidates element identity and hides deletion exactly once", () => {
    const firstWrites: string[] = [];
    const secondWrites: string[] = [];
    const element = (writes: string[]) => ({
      style: {
        set visibility(value: string) { writes.push(`visibility:${value}`); },
        set transform(value: string) { writes.push(`transform:${value}`); },
      },
    }) as unknown as HTMLElement;
    const coordinator = new SelectionActionPlacementCoordinator();
    const selectionBox = {
      bounds: { x: 100, y: 80, width: 40, height: 20 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    };
    const first = element(firstWrites);
    const second = element(secondWrites);

    expect(coordinator.update({ element: first, selectionBox, viewport, stage, surface })).toBe(true);
    expect(coordinator.update({ element: second, selectionBox, viewport, stage, surface })).toBe(true);
    expect(secondWrites).toHaveLength(2);
    expect(coordinator.update({ element: second, selectionBox: undefined, viewport, stage, surface })).toBe(true);
    expect(secondWrites.at(-1)).toBe("visibility:hidden");
    expect(coordinator.update({ element: second, selectionBox: undefined, viewport, stage, surface })).toBe(false);
    expect(secondWrites.filter((write) => write === "visibility:hidden")).toHaveLength(1);
    expect(coordinator.update({ element: null, selectionBox: undefined, viewport, stage, surface })).toBe(true);
    expect(coordinator.update({ element: null, selectionBox: undefined, viewport, stage, surface })).toBe(false);
  });
});
