import type { DocumentCommand } from "./commands.js";
import type {
  AffineTransform,
  DocumentId,
  DocumentNode,
  EditorDocument,
  PathPoint,
  Rect,
} from "./document.js";
import { orderKeyForSigned } from "./path-geometry.js";
import type { Point } from "./coordinates.js";

const MIN_LAYER_SIZE = 1;
const ELLIPSE_CONTROL_RATIO = 0.5522847498;
const identity = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });

interface ShapeNodeBase {
  id: DocumentId;
  parentId: DocumentId;
  childIds: DocumentId[];
  bounds: Rect;
  transform: AffineTransform;
  visible: boolean;
  locked: boolean;
  opacity: number;
  fill: string;
  stroke: string;
  cornerRadius: number;
  zIndex: number;
}

export interface ShapeCreationStyle {
  fill: string;
  stroke: string;
}

export type ShapeCreationRequest =
  | {
      tool: "rectangle" | "ellipse" | "frame";
      bounds: Rect;
    }
  | {
      tool: "line";
      start: Point;
      end: Point;
    };

export interface ShapeCreationPlan {
  commands: DocumentCommand[];
  label: string;
  nodeId: DocumentId;
}

const hasMinimumBox = (bounds: Rect): boolean =>
  Number.isFinite(bounds.x) &&
  Number.isFinite(bounds.y) &&
  Number.isFinite(bounds.width) &&
  Number.isFinite(bounds.height) &&
  bounds.width >= MIN_LAYER_SIZE &&
  bounds.height >= MIN_LAYER_SIZE;

const baseNode = (
  id: DocumentId,
  parentId: DocumentId,
  bounds: Rect,
  zIndex: number,
  style: ShapeCreationStyle,
): ShapeNodeBase => ({
  id,
  parentId,
  childIds: [],
  bounds: { ...bounds },
  transform: identity(),
  visible: true,
  locked: false,
  opacity: 1,
  fill: style.fill,
  stroke: style.stroke,
  cornerRadius: 0,
  zIndex,
});

const ellipseNode = (
  id: DocumentId,
  parentId: DocumentId,
  bounds: Rect,
  zIndex: number,
  style: ShapeCreationStyle,
): DocumentNode => {
  const subpathId = `${id}-subpath`;
  const kx = (bounds.width / 2) * ELLIPSE_CONTROL_RATIO;
  const ky = (bounds.height / 2) * ELLIPSE_CONTROL_RATIO;
  const point = (suffix: string): string => `${id}-${suffix}`;
  const points: Record<string, PathPoint> = {
    [point("top")]: {
      id: point("top"),
      subpathId,
      order: orderKeyForSigned(0),
      x: bounds.width / 2,
      y: 0,
      handleMode: "mirrored",
      handleOut: { dx: kx, dy: 0 },
    },
    [point("right")]: {
      id: point("right"),
      subpathId,
      order: orderKeyForSigned(65_536),
      x: bounds.width,
      y: bounds.height / 2,
      handleMode: "mirrored",
      handleOut: { dx: 0, dy: ky },
    },
    [point("bottom")]: {
      id: point("bottom"),
      subpathId,
      order: orderKeyForSigned(131_072),
      x: bounds.width / 2,
      y: bounds.height,
      handleMode: "mirrored",
      handleOut: { dx: -kx, dy: 0 },
    },
    [point("left")]: {
      id: point("left"),
      subpathId,
      order: orderKeyForSigned(196_608),
      x: 0,
      y: bounds.height / 2,
      handleMode: "mirrored",
      handleOut: { dx: 0, dy: -ky },
    },
  };
  return {
    ...baseNode(id, parentId, bounds, zIndex, style),
    kind: "path",
    name: "Ellipse",
    path: {
      points,
      subpaths: { [subpathId]: { id: subpathId, closed: true } },
      fillRule: "nonzero",
    },
  };
};

const lineNode = (
  id: DocumentId,
  parentId: DocumentId,
  start: Point,
  end: Point,
  zIndex: number,
  style: ShapeCreationStyle,
): DocumentNode | undefined => {
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  if (
    ![minX, minY, width, height].every(Number.isFinite) ||
    (width < MIN_LAYER_SIZE && height < MIN_LAYER_SIZE)
  ) {
    return undefined;
  }
  const bounds = { x: minX, y: minY, width, height };
  const subpathId = `${id}-subpath`;
  const firstId = `${id}-a`;
  const secondId = `${id}-b`;
  return {
    ...baseNode(id, parentId, bounds, zIndex, style),
    kind: "path",
    name: "Line",
    path: {
      points: {
        [firstId]: {
          id: firstId,
          subpathId,
          order: orderKeyForSigned(0),
          x: start.x - minX,
          y: start.y - minY,
          handleMode: "corner",
        },
        [secondId]: {
          id: secondId,
          subpathId,
          order: orderKeyForSigned(65_536),
          x: end.x - minX,
          y: end.y - minY,
          handleMode: "corner",
        },
      },
      subpaths: { [subpathId]: { id: subpathId, closed: false } },
      fillRule: "nonzero",
    },
  };
};

const frameCommands = (
  document: EditorDocument,
  frame: DocumentNode,
): DocumentCommand[] => {
  const commands: DocumentCommand[] = [{ type: "create-node", node: frame }];
  const parent = frame.parentId ? document.nodes[frame.parentId] : undefined;
  const bounds = frame.bounds;
  const contained =
    parent?.childIds
      .map((id) => document.nodes[id])
      .filter(
        (node): node is DocumentNode =>
          node !== undefined &&
          node.visible &&
          !node.locked &&
          node.bounds.x >= bounds.x &&
          node.bounds.y >= bounds.y &&
          node.bounds.x + node.bounds.width <= bounds.x + bounds.width &&
          node.bounds.y + node.bounds.height <= bounds.y + bounds.height,
      ) ?? [];
  contained.forEach((node, index) => {
    commands.push(
      {
        type: "set-bounds",
        nodeId: node.id,
        bounds: {
          x: node.bounds.x - bounds.x,
          y: node.bounds.y - bounds.y,
          width: node.bounds.width,
          height: node.bounds.height,
        },
      },
      {
        type: "reparent-node",
        nodeId: node.id,
        parentId: frame.id,
        index,
      },
    );
  });
  return commands;
};

/**
 * Plans one canonical basic-shape edit in WORLD coordinates. Both browser and
 * native hosts consume this operation; platform adapters only translate input
 * coordinates before calling it.
 */
export const planShapeCreation = (
  document: EditorDocument,
  pageId: DocumentId,
  nodeId: DocumentId,
  request: ShapeCreationRequest,
  style: ShapeCreationStyle,
): ShapeCreationPlan | undefined => {
  const page = document.pages[pageId];
  if (!page) throw new Error(`DOCUMENT_PAGE_MISSING:${pageId}`);
  const parent = document.nodes[page.rootId];
  if (!parent) throw new Error(`DOCUMENT_PARENT_MISSING:${page.rootId}`);
  const zIndex = parent.childIds.length;

  if (request.tool === "line") {
    const node = lineNode(
      nodeId,
      parent.id,
      request.start,
      request.end,
      zIndex,
      style,
    );
    if (!node) return undefined;
    return {
      commands: [{ type: "create-node", node }],
      label: "Create line",
      nodeId,
    };
  }

  if (!hasMinimumBox(request.bounds)) return undefined;
  if (request.tool === "ellipse") {
    const node = ellipseNode(nodeId, parent.id, request.bounds, zIndex, style);
    return {
      commands: [{ type: "create-node", node }],
      label: "Create ellipse",
      nodeId,
    };
  }

  const node: DocumentNode = {
    ...baseNode(nodeId, parent.id, request.bounds, zIndex, style),
    kind: request.tool,
    name: request.tool === "frame" ? "Frame" : "New rectangle",
    cornerRadius: request.tool === "rectangle" ? 16 : 0,
  };
  return {
    commands:
      request.tool === "frame"
        ? frameCommands(document, node)
        : [{ type: "create-node", node }],
    label: request.tool === "frame" ? "Create frame" : "Create rectangle",
    nodeId,
  };
};
