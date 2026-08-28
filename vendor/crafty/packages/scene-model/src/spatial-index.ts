import { inverseTransformPoint, multiplyTransforms, transformBounds, identityTransform, type Bounds, type Layer, type Scene, type Transform2D } from "./index.js";

export interface WorldPoint {
  x: number;
  y: number;
}

export interface SceneSpatialIndex {
  queryCandidates(point: WorldPoint): string[];
  query(point: WorldPoint): string | undefined;
}

interface SpatialEntry {
  id: string;
  bounds: Bounds;
  localBounds: Bounds;
  transform: Transform2D;
  zIndex: number;
  order: number;
  visible: boolean;
  locked: boolean;
}

const CELL_SIZE = 256;

const contains = (bounds: Bounds, point: WorldPoint): boolean => point.x >= bounds.x && point.y >= bounds.y && point.x <= bounds.x + bounds.width && point.y <= bounds.y + bounds.height;
const cellKey = (x: number, y: number): string => `${x}:${y}`;
const cellRange = (bounds: Bounds): { minX: number; maxX: number; minY: number; maxY: number } => ({
  minX: Math.floor(bounds.x / CELL_SIZE),
  maxX: Math.floor((bounds.x + bounds.width) / CELL_SIZE),
  minY: Math.floor(bounds.y / CELL_SIZE),
  maxY: Math.floor((bounds.y + bounds.height) / CELL_SIZE)
});

const visitLayers = (layers: Layer[], inheritedVisible: boolean, inheritedLocked: boolean, parentTransform: Transform2D, visit: (layer: Layer, visible: boolean, locked: boolean, transform: Transform2D) => void): void => {
  for (const layer of layers) {
    const visible = inheritedVisible && layer.visible;
    const locked = inheritedLocked || (layer.locked ?? false);
    // The kernel's authoritative composition (interaction.ts): the content is
    // LOCAL geometry, the world transform is parent × translate(bounds.x, y)
    // × transform — the legacy Scene shape keeps the placement in the bounds,
    // so it is folded into the transform here, exactly like the render
    // encoder folds it at encode time. This is what keeps the index's hits,
    // the rendered rects and the selection box on the same coordinates.
    const placement = { a: 1, b: 0, c: 0, d: 1, e: layer.bounds.x, f: layer.bounds.y };
    const transform = multiplyTransforms(parentTransform, multiplyTransforms(placement, layer.transform));
    const localBounds = { x: 0, y: 0, width: layer.bounds.width, height: layer.bounds.height };
    visit({ ...layer, bounds: localBounds }, visible, locked, transform);
    if (layer.children) visitLayers(layer.children, visible, locked, transform, visit);
  }
};

export const createSceneSpatialIndex = (scene: Scene, frameId: string): SceneSpatialIndex => {
  const frame = scene.frames.find((candidate) => candidate.id === frameId);
  const buckets = new Map<string, SpatialEntry[]>();
  let order = 0;

  if (frame) visitLayers(frame.layers, true, false, identityTransform(), (layer, visible, locked, transform) => {
    const entry = { id: layer.id, bounds: transformBounds(layer.bounds, transform), localBounds: { ...layer.bounds }, transform, zIndex: layer.zIndex, order: order++, visible, locked };
    const range = cellRange(entry.bounds);
    for (let x = range.minX; x <= range.maxX; x += 1) {
      for (let y = range.minY; y <= range.maxY; y += 1) {
        const key = cellKey(x, y);
        const bucket = buckets.get(key);
        if (bucket) bucket.push(entry);
        else buckets.set(key, [entry]);
      }
    }
  });

  const candidates = (point: WorldPoint): SpatialEntry[] => {
    const bucket = buckets.get(cellKey(Math.floor(point.x / CELL_SIZE), Math.floor(point.y / CELL_SIZE))) ?? [];
    return bucket.filter((entry) => entry.visible && !entry.locked && contains(entry.bounds, point) && Boolean(inverseTransformPoint(point, entry.transform)) && contains(entry.localBounds, inverseTransformPoint(point, entry.transform)!)).sort((left, right) => right.zIndex - left.zIndex || right.order - left.order);
  };

  return {
    queryCandidates(point) {
      return candidates(point).map((entry) => entry.id);
    },
    query(point) {
      return candidates(point)[0]?.id;
    }
  };
};
