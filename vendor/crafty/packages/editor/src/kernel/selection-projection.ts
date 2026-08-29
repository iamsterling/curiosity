import {
  identityTransform,
  multiplyTransforms,
  transformPoint,
  transformRect,
  type Point,
} from "./coordinates.js";
import type {
  AffineTransform,
  DocumentId,
  EditorDocument,
  Rect,
} from "./document.js";

export interface SelectionProjectionBox {
  bounds: Rect;
  transform: AffineTransform;
  cornerRadius?: number;
}

const placementTransform = (bounds: Rect): AffineTransform => ({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: bounds.x,
  f: bounds.y,
});

const nodeChain = (
  document: EditorDocument,
  pageId: DocumentId,
  nodeId: DocumentId,
): DocumentId[] | undefined => {
  const page = document.pages[pageId];
  if (!page || nodeId === page.rootId) return undefined;
  const chain: DocumentId[] = [];
  let cursor = document.nodes[nodeId];
  while (cursor && cursor.id !== page.rootId) {
    chain.unshift(cursor.id);
    cursor = cursor.parentId ? document.nodes[cursor.parentId] : undefined;
  }
  return cursor?.id === page.rootId ? chain : undefined;
};

/** The authoritative document-node transform walk:
 * parent × translate(bounds) × authored transform. */
export const projectNodeWorldTransform = (
  document: EditorDocument,
  pageId: DocumentId,
  nodeId: DocumentId,
  boundsOverride?: Rect,
): AffineTransform | undefined => {
  const chain = nodeChain(document, pageId, nodeId);
  if (!chain) return undefined;
  let world = identityTransform();
  for (const id of chain) {
    const node = document.nodes[id];
    if (!node) return undefined;
    const bounds = id === nodeId && boundsOverride ? boundsOverride : node.bounds;
    world = multiplyTransforms(
      world,
      multiplyTransforms(placementTransform(bounds), node.transform),
    );
  }
  return world;
};

const selectableNodeWorldTransform = (
  document: EditorDocument,
  pageId: DocumentId,
  nodeId: DocumentId,
): AffineTransform | undefined => {
  const chain = nodeChain(document, pageId, nodeId);
  if (!chain) return undefined;
  if (
    chain.some((id) => {
      const node = document.nodes[id];
      return !node || !node.visible || node.locked;
    })
  ) {
    return undefined;
  }
  return projectNodeWorldTransform(document, pageId, nodeId);
};

/** Disposable selection geometry. A single node keeps its oriented world box;
 * multiple nodes use the union of their world AABBs. */
export const projectSelectionBox = (
  document: EditorDocument,
  pageId: DocumentId,
  selectedIds: readonly DocumentId[],
): SelectionProjectionBox | undefined => {
  if (selectedIds.length === 0) return undefined;
  if (selectedIds.length === 1) {
    const node = document.nodes[selectedIds[0]!];
    const transform = node
      ? selectableNodeWorldTransform(document, pageId, node.id)
      : undefined;
    if (!node || !transform) return undefined;
    return {
      bounds: { x: 0, y: 0, width: node.bounds.width, height: node.bounds.height },
      transform,
      ...(node.kind === "rectangle" || node.kind === "frame"
        ? { cornerRadius: node.cornerRadius }
        : {}),
    };
  }

  let union: Rect | undefined;
  for (const nodeId of selectedIds) {
    const node = document.nodes[nodeId];
    const transform = node
      ? selectableNodeWorldTransform(document, pageId, node.id)
      : undefined;
    if (!node || !transform) continue;
    const box = transformRect(
      { x: 0, y: 0, width: node.bounds.width, height: node.bounds.height },
      transform,
    );
    union = union
      ? {
          x: Math.min(union.x, box.x),
          y: Math.min(union.y, box.y),
          width:
            Math.max(union.x + union.width, box.x + box.width) -
            Math.min(union.x, box.x),
          height:
            Math.max(union.y + union.height, box.y + box.height) -
            Math.min(union.y, box.y),
        }
      : box;
  }
  return union
    ? { bounds: union, transform: identityTransform() }
    : undefined;
};

/** The eight overlay and reducer handle positions, clockwise from NW. */
export const selectionHandlePositions = (
  box: SelectionProjectionBox,
): Point[] => {
  const { width, height } = box.bounds;
  return [
    { x: 0, y: 0 },
    { x: width / 2, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height / 2 },
    { x: width, y: height },
    { x: width / 2, y: height },
    { x: 0, y: height },
    { x: 0, y: height / 2 },
  ].map((point) => transformPoint(point, box.transform));
};
