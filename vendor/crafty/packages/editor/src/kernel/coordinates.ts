import type { AffineTransform, Rect } from "./document.js";
import { WORLD_LIMIT, ZOOM_MAX, ZOOM_MIN } from "@crafty/scene-model";

export type CoordinateSpace = "screen" | "editor-shell" | "viewport" | "world" | "page" | "parent-local" | "node-local" | "device-pixel";
export interface Point { x: number; y: number }
export interface Viewport { panX: number; panY: number; zoom: number; devicePixelRatio: number; }

export { WORLD_LIMIT, ZOOM_MAX, ZOOM_MIN } from "@crafty/scene-model";

export const SNAP_TOLERANCE_SCREEN_PX = 12 as const;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const clampWorldLimit = (value: number): number => clamp(Number.isFinite(value) ? value : 0, -WORLD_LIMIT, WORLD_LIMIT);

export const clampViewport = (viewport: Viewport): Viewport => {
  const zoom = Number.isFinite(viewport.zoom) ? clamp(viewport.zoom, ZOOM_MIN, ZOOM_MAX) : 1;
  return { ...viewport, zoom, panX: clampWorldLimit(viewport.panX), panY: clampWorldLimit(viewport.panY) };
};

export const identityTransform = (): AffineTransform => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
export const multiplyTransforms = (parent: AffineTransform, child: AffineTransform): AffineTransform => ({ a: parent.a * child.a + parent.c * child.b, b: parent.b * child.a + parent.d * child.b, c: parent.a * child.c + parent.c * child.d, d: parent.b * child.c + parent.d * child.d, e: parent.a * child.e + parent.c * child.f + parent.e, f: parent.b * child.e + parent.d * child.f + parent.f });
export const transformPoint = (point: Point, transform: AffineTransform): Point => ({ x: transform.a * point.x + transform.c * point.y + transform.e, y: transform.b * point.x + transform.d * point.y + transform.f });
export const inverseTransformPoint = (point: Point, transform: AffineTransform): Point | undefined => {
  const determinant = transform.a * transform.d - transform.b * transform.c;
  if (Math.abs(determinant) < 1e-9) return undefined;
  const x = point.x - transform.e;
  const y = point.y - transform.f;
  return { x: (transform.d * x - transform.c * y) / determinant, y: (-transform.b * x + transform.a * y) / determinant };
};
export const inverseTransform = (transform: AffineTransform): AffineTransform | undefined => {
  const determinant = transform.a * transform.d - transform.b * transform.c;
  if (Math.abs(determinant) < 1e-9) return undefined;
  return {
    a: transform.d / determinant,
    b: -transform.b / determinant,
    c: -transform.c / determinant,
    d: transform.a / determinant,
    e: (transform.c * transform.f - transform.d * transform.e) / determinant,
    f: (transform.b * transform.e - transform.a * transform.f) / determinant,
  };
};
export const worldToScreen = (point: Point, viewport: Viewport): Point => ({ x: point.x * viewport.zoom + viewport.panX, y: point.y * viewport.zoom + viewport.panY });
export const screenToWorld = (point: Point, viewport: Viewport): Point => ({ x: (point.x - viewport.panX) / viewport.zoom, y: (point.y - viewport.panY) / viewport.zoom });
export const worldToDevice = (point: Point, viewport: Viewport): Point => ({ x: worldToScreen(point, viewport).x * viewport.devicePixelRatio, y: worldToScreen(point, viewport).y * viewport.devicePixelRatio });
export const viewportCenteredAt = (center: Point, size: { width: number; height: number }, zoom: number, devicePixelRatio: number): Viewport => clampViewport({ panX: size.width / 2 - center.x * zoom, panY: size.height / 2 - center.y * zoom, zoom, devicePixelRatio });
export const zoomAt = (viewport: Viewport, anchor: Point, factor: number): Viewport => {
  const safeFactor = Number.isFinite(factor) ? Math.min(4, Math.max(0.25, factor)) : 1;
  const nextZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, viewport.zoom * safeFactor));
  const world = screenToWorld(anchor, viewport);
  return clampViewport({ ...viewport, zoom: nextZoom, panX: anchor.x - world.x * nextZoom, panY: anchor.y - world.y * nextZoom });
};
export const zoomTo = (viewport: Viewport, anchor: Point, zoom: number): Viewport => {
  const nextZoom = Number.isFinite(zoom) ? Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)) : viewport.zoom;
  const world = screenToWorld(anchor, viewport);
  return clampViewport({ ...viewport, zoom: nextZoom, panX: anchor.x - world.x * nextZoom, panY: anchor.y - world.y * nextZoom });
};
export const transformRect = (rect: Rect, transform: AffineTransform): Rect => {
  const points = [{ x: rect.x, y: rect.y }, { x: rect.x + rect.width, y: rect.y }, { x: rect.x, y: rect.y + rect.height }, { x: rect.x + rect.width, y: rect.y + rect.height }].map((point) => transformPoint(point, transform));
  const x = Math.min(...points.map((point) => point.x));
  const y = Math.min(...points.map((point) => point.y));
  return { x, y, width: Math.max(...points.map((point) => point.x)) - x, height: Math.max(...points.map((point) => point.y)) - y };
};

/** Resize in parent-local space while keeping the opposite edge anchored. */
export const resizeRect = (start: Rect, handle: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w", dx: number, dy: number, minSize: number): Rect => {
  const minimum = Math.max(0, Number.isFinite(minSize) ? minSize : 0);
  let left = start.x;
  let right = start.x + start.width;
  let top = start.y;
  let bottom = start.y + start.height;
  if (handle.includes("w")) left = Math.min(start.x + dx, right - minimum);
  if (handle.includes("e")) right = Math.max(start.x + start.width + dx, left + minimum);
  if (handle.includes("n")) top = Math.min(start.y + dy, bottom - minimum);
  if (handle.includes("s")) bottom = Math.max(start.y + start.height + dy, top + minimum);
  return { x: left, y: top, width: right - left, height: bottom - top };
};
