import type { SceneDescription } from "./description.js";

/** Small stable scene used by resolver consumers as a smoke fixture. */
export const chromeFixture: SceneDescription = {
  canvas: { id: "chrome-fixture", width: 320, height: 180, pixelRatio: 1, background: [0.05, 0.06, 0.08, 1] },
  children: [
    { kind: "group", id: "panel", opacity: 0.9, children: [
      { kind: "rect", id: "card", bounds: { x: 16, y: 16, width: 288, height: 148 }, fill: [0.12, 0.14, 0.18, 1], cornerRadius: 12, zIndex: 0 },
      { kind: "path", id: "accent", bounds: { x: 32, y: 32, width: 48, height: 48 }, fill: [0.2, 0.8, 0.7, 1], geometry: { points: {}, subpaths: {} }, zIndex: 1 },
    ] },
  ],
};
