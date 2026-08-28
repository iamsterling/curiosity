import {
  DRAW_PROTOCOL_VERSION,
  type DrawCommand,
  type DrawStrokeDescriptor,
  type RenderFrame,
  type Viewport,
} from "@crafty/scene-renderer";
import type { Bounds, Transform2D } from "@crafty/scene-model";
import type { Color, SceneDescription, SceneNode } from "./description.js";

export type SceneViewport = Viewport & { width: number; height: number; pixelRatio: number };
const MAX = 1e6;
const fail = (path: string, message: string): never => { throw new Error(`SCENE_API_INVALID:${path}:${message}`); };
const finite = (n: number, path: string): number => Number.isFinite(n) && Math.abs(n) <= MAX ? n : fail(path, "must be finite and bounded");
const color = (value: Color, path: string): Color => {
  if (!Array.isArray(value) || value.length !== 4 || value.some((n) => !Number.isFinite(n) || n < 0 || n > 1)) fail(path, "must contain four colour channels between zero and one");
  return value;
};
const bounds = (value: Bounds, path: string): Bounds => {
  for (const key of ["x", "y", "width", "height"] as const) finite(value[key], `${path}.${key}`);
  if (value.width <= 0 || value.height <= 0) fail(path, "must have positive dimensions");
  return value;
};
const transform = (value: Transform2D | undefined, path: string): Transform2D => {
  const t = value ?? { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  for (const key of ["a", "b", "c", "d", "e", "f"] as const) finite(t[key], `${path}.${key}`);
  return t;
};
const multiply = (p: Transform2D, c: Transform2D): Transform2D => ({ a: p.a * c.a + p.c * c.b, b: p.b * c.a + p.d * c.b, c: p.a * c.c + p.c * c.d, d: p.b * c.c + p.d * c.d, e: p.a * c.e + p.c * c.f + p.e, f: p.b * c.e + p.d * c.f + p.f });
const stroke = (candidate: DrawStrokeDescriptor, path: string): void => {
  finite(candidate.width, `${path}.width`);
  if (candidate.width < 0 || !Array.isArray(candidate.dash) || candidate.dash.some((n) => !Number.isFinite(n) || n < 0 || n > MAX)) fail(path, "has invalid stroke values");
};
const clone = <T>(value: T): T => structuredClone(value);

export const resolveScene = (description: SceneDescription, viewport: SceneViewport): RenderFrame => {
  if (!description || !description.canvas) fail("/canvas", "is required");
  const canvas = description.canvas;
  if (typeof canvas.id !== "string" || canvas.id.length === 0) fail("/canvas/id", "must be a non-empty string");
  finite(canvas.width, "/canvas/width"); finite(canvas.height, "/canvas/height");
  if (canvas.width <= 0 || canvas.height <= 0) fail("/canvas", "dimensions must be positive");
  if (!Number.isFinite(canvas.pixelRatio) || canvas.pixelRatio <= 0 || canvas.pixelRatio > 8) fail("/canvas/pixelRatio", "must be between zero and eight");
  color(canvas.background, "/canvas/background");
  for (const key of ["panX", "panY", "zoom", "width", "height", "pixelRatio"] as const) finite(viewport[key], `/viewport/${key}`);
  if (viewport.zoom <= 0 || viewport.width <= 0 || viewport.height <= 0 || viewport.pixelRatio <= 0) fail("/viewport", "dimensions and zoom must be positive");
  const commands: DrawCommand[] = [];
  const ids = new Set<string>();
  let order = 0;
  const visit = (node: SceneNode, parentTransform: Transform2D, parentOpacity: number): void => {
    if (typeof node.id !== "string" || node.id.length === 0 || ids.has(node.id)) fail(`/nodes/${node.id}`, "must have a unique non-empty id");
    ids.add(node.id);
    const t = multiply(parentTransform, transform(node.transform, `/nodes/${node.id}/transform`));
    for (const key of ["a", "b", "c", "d", "e", "f"] as const) finite(t[key], `/nodes/${node.id}/resolvedTransform.${key}`);
    const opacity = parentOpacity * (node.opacity ?? 1);
    if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) fail(`/nodes/${node.id}/opacity`, "must resolve between zero and one");
    if (node.kind === "group") { visitChildren(node.children, t, opacity); return; }
    bounds(node.bounds, `/nodes/${node.id}/bounds`); color(node.fill, `/nodes/${node.id}/fill`);
    if (node.kind !== "text" && node.stroke) stroke(node.stroke, `/nodes/${node.id}/stroke`);
    const base = { nodeId: node.id, bounds: clone(node.bounds), transform: clone(t), fill: [...node.fill] as Color, opacity, zIndex: node.zIndex ?? 0, order: order++ };
    if (node.kind === "rect") commands.push({ ...base, geometry: "rect", ...(node.cornerRadius === undefined ? {} : { cornerRadius: finite(node.cornerRadius, `/nodes/${node.id}/cornerRadius`) }), ...(node.stroke ? { stroke: clone(node.stroke) } : {}) });
    else if (node.kind === "path") {
      for (const point of Object.values(node.geometry.points)) { finite(point.x, `/nodes/${node.id}/path/point/x`); finite(point.y, `/nodes/${node.id}/path/point/y`); }
      commands.push({ ...base, geometry: "path", path: clone(node.geometry), fillRule: node.fillRule ?? "nonzero", ...(node.stroke ? { stroke: clone(node.stroke) } : {}) });
    } else commands.push({ ...base, geometry: "text", text: node.text, ...(node.fontSize === undefined ? {} : { fontSize: finite(node.fontSize, `/nodes/${node.id}/fontSize`) }) });
  };
  const visitChildren = (nodes: SceneNode[], t: Transform2D, opacity: number): void => { if (!Array.isArray(nodes)) fail("/children", "must be an array"); for (const node of nodes) visit(node, t, opacity); };
  visitChildren(description.children, { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, 1);
  commands.sort((a, b) => a.zIndex - b.zIndex || a.order - b.order);
  return { protocolVersion: DRAW_PROTOCOL_VERSION, frameId: canvas.id, viewport: { ...viewport }, commands };
};
