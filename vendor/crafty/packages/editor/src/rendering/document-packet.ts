import {
  computePathBounds,
  identityTransform,
  multiplyTransforms,
  projectGlassRecords,
  resolveAutoHandles,
  resolveCompoundOutlineResult,
  type AffineTransform,
  type DocumentId,
  type DocumentNode,
  type EditorDocument,
  type PathGeometry,
} from "../kernel/index.js";
import type {
  DrawCommand,
  DrawGlassSurface,
  DrawPathPoint,
  DrawPathSubpath,
} from "@crafty/scene-renderer";

const hexToRgba = (hex: string): [number, number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 0xff) / 255,
    ((value >> 8) & 0xff) / 255,
    (value & 0xff) / 255,
    1,
  ];
};

export const projectDocumentGlassSurfaces = (
  document: EditorDocument,
): DrawGlassSurface[] =>
  projectGlassRecords(document).map((record) => {
    const tint = hexToRgba(record.tint);
    return {
      nodeId: record.nodeId,
      bounds: record.bounds,
      transform: record.transform,
      blurRadius: record.blurRadius,
      tint: [tint[0], tint[1], tint[2], record.tintOpacity],
      saturation: record.saturation,
      refraction: record.refraction,
      opacity: record.opacity,
      zIndex: record.zIndex,
      order: record.order,
    };
  });

const drawPathCommand = (
  node: DocumentNode,
  resolved: PathGeometry,
  bounds: { x: number; y: number; width: number; height: number },
  transform: AffineTransform,
  order: number,
): DrawCommand => {
  if (typeof node.fill !== "string") {
    throw new Error(`SCENE_ADAPTER_INVALID_FILL:${node.id}`);
  }
  const points: Record<string, DrawPathPoint> = {};
  for (const point of Object.values(resolved.points)) {
    points[point.id] = {
      id: point.id,
      subpathId: point.subpathId,
      order: point.order,
      x: point.x,
      y: point.y,
      handleMode: point.handleMode as DrawPathPoint["handleMode"],
      ...(point.handleIn !== undefined
        ? { handleIn: { ...point.handleIn } }
        : {}),
      ...(point.handleOut !== undefined
        ? { handleOut: { ...point.handleOut } }
        : {}),
    };
  }
  const subpaths: Record<string, DrawPathSubpath> = {};
  for (const subpath of Object.values(resolved.subpaths)) {
    subpaths[subpath.id] = { id: subpath.id, closed: subpath.closed };
  }
  return {
    geometry: "path",
    nodeId: node.id,
    bounds,
    transform,
    fill: hexToRgba(node.fill),
    opacity: node.opacity,
    zIndex: node.zIndex,
    order,
    path: { points, subpaths },
    fillRule: resolved.fillRule,
  };
};

const pathCommandFor = (
  node: DocumentNode,
  transform: AffineTransform,
  order: number,
): DrawCommand =>
  drawPathCommand(
    node,
    resolveAutoHandles(node.path!),
    { ...node.bounds },
    transform,
    order,
  );

const textCommandFor = (
  node: DocumentNode,
  transform: AffineTransform,
  order: number,
): DrawCommand | undefined => {
  if (typeof node.fill !== "string") return undefined;
  return {
    geometry: "text",
    nodeId: node.id,
    bounds: {
      x: 0,
      y: 0,
      width: node.bounds.width,
      height: node.bounds.height,
    },
    transform,
    fill: hexToRgba(node.fill),
    opacity: node.opacity,
    zIndex: node.zIndex,
    order,
    ...(node.text !== undefined ? { text: node.text } : {}),
    fontSize: Math.max(node.bounds.height, 1),
  };
};

const compoundCommandFor = (
  node: DocumentNode,
  outline: { geometry: PathGeometry; placement: { x: number; y: number } },
  transform: AffineTransform,
  order: number,
): DrawCommand => {
  const resolved = resolveAutoHandles(outline.geometry);
  const bbox = computePathBounds(resolved);
  return drawPathCommand(
    node,
    resolved,
    {
      x: outline.placement.x,
      y: outline.placement.y,
      width: bbox.maxX - bbox.minX,
      height: bbox.maxY - bbox.minY,
    },
    transform,
    order,
  );
};

/**
 * Projects vector and text nodes from one resolved page into renderer packet
 * commands. This adapter is shared by browser and native hosts; neither host
 * reinterprets authored path, compound, text, visibility, or ordering rules.
 */
export const projectDocumentDrawCommands = (
  document: EditorDocument,
  pageId: DocumentId,
): DrawCommand[] => {
  const commands: DrawCommand[] = [];
  let order = 0;
  const walk = (
    parentId: DocumentId,
    inheritedVisible: boolean,
    parentWorld: AffineTransform,
  ): void => {
    const parent = document.nodes[parentId];
    if (!parent) return;
    for (const childId of parent.childIds) {
      const node = document.nodes[childId];
      if (!node) continue;
      const visible = inheritedVisible && node.visible;
      const position = {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: node.bounds.x,
        f: node.bounds.y,
      };
      const world = multiplyTransforms(
        parentWorld,
        multiplyTransforms(position, node.transform),
      );
      if (visible) {
        order += 1;
        const isMember = parent.kind === "compound";
        if (node.kind === "path" && node.path && !isMember) {
          commands.push(pathCommandFor(node, world, order));
        } else if (node.kind === "text" && node.text && !isMember) {
          const textCommand = textCommandFor(node, world, order);
          if (textCommand) commands.push(textCommand);
        } else if (node.kind === "compound" && !isMember) {
          const outline = resolveCompoundOutlineResult(document, node.id);
          if (outline) {
            const placement = {
              a: 1,
              b: 0,
              c: 0,
              d: 1,
              e: outline.placement.x,
              f: outline.placement.y,
            };
            const outlineWorld = multiplyTransforms(
              parentWorld,
              multiplyTransforms(placement, node.transform),
            );
            commands.push(
              compoundCommandFor(node, outline, outlineWorld, order),
            );
          }
        }
      }
      walk(childId, visible, world);
    }
  };
  const page = document.pages[pageId];
  if (page) walk(page.rootId, true, identityTransform());
  return commands;
};
