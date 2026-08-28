import { describe, expect, it } from "vitest";
import {
  MAX_CHROME_GLASS_SURFACES,
  MAX_GLASS_SURFACES,
  type DrawChromeGlassSurface,
  type DrawGlassSurface,
} from "./draw-protocol.js";
import { budgetChromeGlassSurfaces, budgetGlassSurfaces } from "./wasm-bridge.js";

/**
 * Glass budget policy (the `glass-fills` change, sections 3–4): the host caps
 * surfaces past the budget by marking them flat — visible, ordered, never
 * vanished — and counts the degradation; malformed surfaces fail the frame at
 * the boundary.
 */

const surface = (
  overrides: Partial<DrawGlassSurface> = {},
): DrawGlassSurface => ({
  nodeId: "glass-panel",
  bounds: { x: 0, y: 0, width: 100, height: 80 },
  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  blurRadius: 24,
  tint: [1, 1, 1, 0.6],
  saturation: 1.4,
  refraction: 0.15,
  opacity: 1,
  zIndex: 1,
  order: 1,
  ...overrides,
});

describe("glass surface budget", () => {
  it("passes surfaces under the cap through untouched", () => {
    const { surfaces, capped } = budgetGlassSurfaces([surface()]);
    expect(capped).toBe(0);
    expect(surfaces).toEqual([surface()]);
  });

  it("keeps over-cap surfaces in the packet, degraded to flat tint", () => {
    const many = Array.from({ length: MAX_GLASS_SURFACES + 4 }, (_, index) =>
      surface({ nodeId: `glass-${index}`, order: index }),
    );
    const { surfaces, capped } = budgetGlassSurfaces(many);
    expect(capped).toBe(4);
    expect(surfaces).toHaveLength(MAX_GLASS_SURFACES + 4);
    expect(
      surfaces.slice(0, MAX_GLASS_SURFACES).every((item) => item.flat !== true),
    ).toBe(true);
    const degraded = surfaces.slice(MAX_GLASS_SURFACES);
    expect(degraded).toHaveLength(4);
    expect(degraded.every((item) => item.flat === true)).toBe(true);
    // Degradation preserves every authored field — only the flag changes.
    expect(degraded[0]).toMatchObject({
      nodeId: `glass-${MAX_GLASS_SURFACES}`,
      blurRadius: 24,
      order: MAX_GLASS_SURFACES,
    });
  });

  it("returns empty for undefined or empty input", () => {
    expect(budgetGlassSurfaces(undefined)).toEqual({ surfaces: [], capped: 0 });
    expect(budgetGlassSurfaces([])).toEqual({ surfaces: [], capped: 0 });
  });

  it("rejects a malformed surface loudly at the boundary", () => {
    expect(() => budgetGlassSurfaces([surface({ blurRadius: -1 })])).toThrow(
      "RENDER_PACKET_INVALID:glassSurfaces.blurRadius",
    );
    expect(() =>
      budgetGlassSurfaces([surface({ flat: "yes" as unknown as boolean })]),
    ).toThrow("RENDER_PACKET_INVALID:glassSurfaces.flat");
  });
});

const chrome = (overrides: Partial<DrawChromeGlassSurface> = {}): DrawChromeGlassSurface => ({
  id: "chrome-topbar",
  bounds: { x: 12, y: 12, width: 600, height: 42 },
  radius: 999,
  scaleX: 1,
  scaleY: 1,
  pressed: 0,
  hovered: 0,
  ...overrides,
});

describe("chrome glass budget", () => {
  it("passes surfaces under the cap through untouched", () => {
    const { surfaces, capped } = budgetChromeGlassSurfaces([chrome()]);
    expect(capped).toBe(0);
    expect(surfaces).toEqual([chrome()]);
  });

  it("keeps over-cap surfaces in the packet, degraded to flat tint", () => {
    const many = Array.from({ length: MAX_CHROME_GLASS_SURFACES + 3 }, (_, index) =>
      chrome({ id: `chrome-${index}` }),
    );
    const { surfaces, capped } = budgetChromeGlassSurfaces(many);
    expect(capped).toBe(3);
    expect(surfaces).toHaveLength(MAX_CHROME_GLASS_SURFACES + 3);
    expect(
      surfaces.slice(0, MAX_CHROME_GLASS_SURFACES).every((item) => item.flat !== true),
    ).toBe(true);
    expect(surfaces.slice(MAX_CHROME_GLASS_SURFACES).every((item) => item.flat === true)).toBe(true);
    // Degradation preserves every measured field — only the flag changes.
    expect(surfaces[MAX_CHROME_GLASS_SURFACES]).toMatchObject({
      id: `chrome-${MAX_CHROME_GLASS_SURFACES}`,
      radius: 999,
      scaleX: 1,
    });
  });

  it("returns empty for undefined or empty input", () => {
    expect(budgetChromeGlassSurfaces(undefined)).toEqual({ surfaces: [], capped: 0 });
    expect(budgetChromeGlassSurfaces([])).toEqual({ surfaces: [], capped: 0 });
  });

  it("rejects a malformed surface loudly at the boundary", () => {
    expect(() => budgetChromeGlassSurfaces([chrome({ radius: -1 })])).toThrow(
      "RENDER_PACKET_INVALID:chromeGlass[0].radius",
    );
    expect(() => budgetChromeGlassSurfaces([chrome({ pressed: 1.5 })])).toThrow(
      "RENDER_PACKET_INVALID:chromeGlass[0].pressed",
    );
    expect(() =>
      budgetChromeGlassSurfaces([chrome({ scaleX: 0 })])
    ).toThrow("RENDER_PACKET_INVALID:chromeGlass[0].scale");
    expect(() =>
      budgetChromeGlassSurfaces([chrome({ flat: "yes" as unknown as boolean })]),
    ).toThrow("RENDER_PACKET_INVALID:chromeGlass[0].flat");
  });
});
