import { describe, expect, it } from "vitest";

import { oklchToRgba, parseOklch } from "./theme-accent.js";

describe("theme-accent", () => {
  it("parses the oklch token form the CSS variables use", () => {
    expect(parseOklch("oklch(0.62 0.11 85)")).toEqual({
      l: 0.62,
      c: 0.11,
      h: 85,
      a: 1,
    });
    expect(parseOklch("oklch(0.76 0.09 85 / 0.9)")).toEqual({
      l: 0.76,
      c: 0.09,
      h: 85,
      a: 0.9,
    });
    expect(parseOklch("not a color")).toBeUndefined();
  });

  it("converts the dark brass accent to its sRGB form", () => {
    const [r, g, b, a] = oklchToRgba("oklch(0.76 0.09 85)")!;
    expect(r).toBeCloseTo(0.8, 2);
    expect(g).toBeCloseTo(0.68, 2);
    expect(b).toBeCloseTo(0.43, 2);
    expect(a).toBe(1);
  });

  it("clamps out-of-gamut channels", () => {
    const [r] = oklchToRgba("oklch(1 0 0)")!;
    expect(r).toBeLessThanOrEqual(1);
  });
});
