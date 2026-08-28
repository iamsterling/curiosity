import { describe, expect, it } from "vitest";
import { measureDistances, measureToParentEdges } from "./measure-distances.js";

describe("measureDistances", () => {
  it("reports facing gaps in world units", () => {
    expect(measureDistances({ x: 0, y: 0, width: 20, height: 10 }, { x: 44, y: 0, width: 10, height: 10 }).horizontal).toMatchObject({ relation: "gap", distance: 24, from: 20, to: 44 });
  });

  it("reports overlap and touching without signed ambiguity", () => {
    expect(measureDistances({ x: 0, y: 0, width: 20, height: 10 }, { x: 10, y: 12, width: 20, height: 10 })).toMatchObject({
      horizontal: { relation: "overlap", distance: 10 },
      vertical: { relation: "gap", distance: 2 },
    });
    expect(measureDistances({ x: 0, y: 0, width: 20, height: 10 }, { x: 20, y: 10, width: 2, height: 2 })).toMatchObject({
      horizontal: { relation: "touching", distance: 0 },
      vertical: { relation: "touching", distance: 0 },
    });
  });
});

describe("measureToParentEdges", () => {
  it("measures all four inner edges", () => {
    expect(measureToParentEdges({ x: 12, y: 8, width: 20, height: 10 }, { x: 0, y: 0, width: 100, height: 60 })).toMatchObject({
      left: { distance: 12 },
      right: { distance: 68 },
      top: { distance: 8 },
      bottom: { distance: 42 },
    });
  });
});
