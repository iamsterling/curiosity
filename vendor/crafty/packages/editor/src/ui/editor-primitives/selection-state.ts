import type { Layer } from "@crafty/scene-model";
import type { EditorProjection } from "../editor/harness.js";

const flattenLayers = (layers: Layer[]): Layer[] =>
  layers.flatMap((layer) => [layer, ...(layer.children ? flattenLayers(layer.children) : [])]);

export const selectSelectedLayer = (projection: EditorProjection): Layer | undefined => {
  const id = projection.selectedIds[0];
  if (!id || !projection.frame) return undefined;
  return flattenLayers(projection.frame.layers).find((layer) => layer.id === id);
};

export const selectSelectedLayout = (projection: EditorProjection) => projection.selectedLayout;

export const layerEqual = (left: Layer | undefined, right: Layer | undefined): boolean =>
  left === right ||
  (left !== undefined && right !== undefined &&
    left.id === right.id &&
    left.name === right.name &&
    left.fill === right.fill &&
    left.stroke === right.stroke &&
    left.opacity === right.opacity &&
    left.cornerRadius === right.cornerRadius &&
    left.visible === right.visible &&
    left.locked === right.locked &&
    left.text === right.text &&
    left.bounds.x === right.bounds.x &&
    left.bounds.y === right.bounds.y &&
    left.bounds.width === right.bounds.width &&
    left.bounds.height === right.bounds.height);
