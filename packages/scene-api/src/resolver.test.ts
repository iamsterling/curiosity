import { describe, expect, it } from "vitest";
import { resolveScene, type SceneDescription, type SceneViewport } from "./index.js";

const viewport: SceneViewport = { panX: 4, panY: 8, zoom: 1, width: 400, height: 300, pixelRatio: 2 };
const canvas = { id: "test", width: 400, height: 300, pixelRatio: 2, background: [0, 0, 0, 1] as [number, number, number, number] };
const path = { points: { p: { id: "p", subpathId: "s", order: "0", x: 1, y: 2, handleMode: "corner" as const } }, subpaths: { s: { id: "s", closed: true } } };

const scene: SceneDescription = { canvas, children: [
  { kind: "group", id: "outer", transform: { a: 1, b: 0, c: 0, d: 1, e: 10, f: 20 }, opacity: 0.5, children: [
    { kind: "group", id: "inner", transform: { a: 2, b: 0, c: 0, d: 2, e: 1, f: 2 }, opacity: 0.5, children: [
      { kind: "rect", id: "r", bounds: { x: 0, y: 0, width: 10, height: 10 }, fill: [1, 0, 0, 1], zIndex: 2 },
      { kind: "path", id: "p", bounds: { x: 0, y: 0, width: 4, height: 4 }, geometry: path, fill: [0, 1, 0, 1], zIndex: 1 },
    ] },
  ] },
] };

describe("resolveScene", () => {
  it("is deterministic and does not mutate input", () => {
    const before = structuredClone(scene);
    const first = resolveScene(scene, viewport);
    const second = resolveScene(scene, viewport);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(scene).toEqual(before);
  });
  it("composes transforms, opacity, and explicit ordering", () => {
    const frame = resolveScene(scene, viewport);
    expect(frame.commands.map((command) => command.nodeId)).toEqual(["p", "r"]);
    expect(frame.commands[1]?.transform).toEqual({ a: 2, b: 0, c: 0, d: 2, e: 11, f: 22 });
    expect(frame.commands[1]?.opacity).toBe(0.25);
  });
  it("carries path geometry without conversion", () => {
    const command = resolveScene(scene, viewport).commands[0];
    expect(command?.path).toEqual(path);
  });
  it("rejects non-finite and unbounded values", () => {
    expect(() => resolveScene({ ...scene, canvas: { ...canvas, width: Number.NaN } }, viewport)).toThrow("SCENE_API_INVALID");
    expect(() => resolveScene({ ...scene, children: [{ ...scene.children[0]!, opacity: 2 }] }, viewport)).toThrow("SCENE_API_INVALID");
  });
});
