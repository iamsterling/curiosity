import {
  multiplyTransforms,
  transformBounds,
  type Bounds,
  type Frame,
  type Layer,
  type Scene,
  type Transform2D,
} from "@crafty/scene-model";
import { DRAW_PROTOCOL_VERSION, type DrawCommand, type RenderFrame } from "./draw-protocol.js";
import type { Viewport } from "./index.js";

const identityTransform: Transform2D = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

const localBounds = (bounds: Bounds): Bounds => ({
  x: 0,
  y: 0,
  width: bounds.width,
  height: bounds.height,
});

const placementTransform = (bounds: Bounds): Transform2D => ({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: bounds.x,
  f: bounds.y,
});

const parseHex = (value: string, fallback: [number, number, number]): [number, number, number] => {
  const hex = value.startsWith("#") ? value.slice(1) : undefined;
  if (!hex || hex.length !== 6 || !/^[\da-f]+$/iu.test(hex)) return fallback;
  return [0, 2, 4].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255) as [number, number, number];
};

const intersectsViewport = (bounds: Bounds, viewport: RenderFrame["viewport"]): boolean => {
  const zoom = Math.max(viewport.zoom, Number.EPSILON);
  const worldLeft = -viewport.panX / zoom;
  const worldTop = -viewport.panY / zoom;
  const worldRight = worldLeft + viewport.width / zoom;
  const worldBottom = worldTop + viewport.height / zoom;
  return bounds.x < worldRight && bounds.x + bounds.width > worldLeft && bounds.y < worldBottom && bounds.y + bounds.height > worldTop;
};

const buildDraw = (layer: Layer, bounds: Bounds, transform: Transform2D, order: number): DrawCommand => {
  const opacity = Math.min(1, Math.max(0, layer.opacity));
  const fill = parseHex(layer.fill, [0.4, 0.4, 0.42]);
  return {
    geometry: "rect",
    nodeId: layer.id,
    bounds,
    transform,
    fill: [fill[0], fill[1], fill[2], opacity],
    opacity,
    zIndex: layer.zIndex,
    order,
    ...(layer.cornerRadius !== undefined ? { cornerRadius: layer.cornerRadius } : {}),
  };
};

const encodeLayers = (
  layers: Layer[],
  inheritedVisible: boolean,
  parentTransform: Transform2D,
  selectedLayerId: string | undefined,
  viewport: RenderFrame["viewport"],
  orderRef: { value: number },
  commands: DrawCommand[],
  selection: { bounds?: Bounds },
): void => {
  for (const layer of layers) {
    const visible = inheritedVisible && layer.visible;
    const transform = multiplyTransforms(
      parentTransform,
      multiplyTransforms(placementTransform(layer.bounds), layer.transform),
    );
    const local = localBounds(layer.bounds);
    const culled = selectedLayerId !== layer.id && !intersectsViewport(transformBounds(local, transform), viewport);
    if (visible) {
      if (layer.type !== "text" && !culled) commands.push(buildDraw(layer, local, transform, orderRef.value));
      orderRef.value += 1;
    }
    if (selectedLayerId === layer.id && visible) selection.bounds = transformBounds(local, transform);
    encodeLayers(layer.children ?? [], visible, transform, selectedLayerId, viewport, orderRef, commands, selection);
  }
};

export const sceneToRenderFrame = (
  scene: Scene,
  frameId: string,
  viewport: Viewport & { width: number; height: number; pixelRatio: number },
  selectedLayerId?: string,
  packetRevision = 1,
): RenderFrame => {
  const frame: Frame | undefined = scene.frames.find((candidate) => candidate.id === frameId);
  if (!frame) throw new Error(`SCENE_FRAME_MISSING:${frameId}`);
  const commands: DrawCommand[] = [
    {
      geometry: "rect",
      nodeId: frame.id,
      bounds: frame.bounds,
      transform: identityTransform,
      fill: [0.11, 0.11, 0.12, 1],
      opacity: 1,
      zIndex: -Number.MAX_SAFE_INTEGER,
      order: 0,
    },
  ];
  const order = { value: 1 };
  const selection: { bounds?: Bounds } = {};
  encodeLayers(frame.layers, true, identityTransform, selectedLayerId, viewport, order, commands, selection);
  commands.sort((left, right) => left.zIndex - right.zIndex || left.order - right.order);
  return {
    protocolVersion: DRAW_PROTOCOL_VERSION,
    frameId,
    viewport,
    commands,
    ...(selection.bounds ? { selectionBounds: selection.bounds } : {}),
    documentRevision: scene.revision,
    packetRevision,
    packetKind: "full",
  };
};

const appendOverlay = (
  commands: DrawCommand[],
  nodeId: string,
  bounds: Bounds,
  fill: [number, number, number, number],
  order: number,
  transform: Transform2D = identityTransform,
  cornerRadius?: number,
): number => {
  commands.push({
    geometry: "rect",
    nodeId,
    bounds,
    transform,
    fill,
    opacity: 1,
    zIndex: Number.MAX_SAFE_INTEGER,
    order,
    ...(cornerRadius !== undefined ? { cornerRadius } : {}),
  });
  return order + 1;
};

const appendSelectionBox = (
  commands: DrawCommand[],
  box: { bounds: Bounds; transform: Transform2D },
  viewport: RenderFrame["viewport"],
  order: number,
): number => {
  const accent: [number, number, number, number] = [0.25, 0.78, 0.91, 1];
  const white: [number, number, number, number] = [1, 1, 1, 1];
  const { bounds, transform } = box;
  const scaleX = Math.max(Math.hypot(transform.a, transform.b), 1e-9);
  const scaleY = Math.max(Math.hypot(transform.c, transform.d), 1e-9);
  const thicknessX = 1.5 / viewport.zoom / scaleX;
  const thicknessY = 1.5 / viewport.zoom / scaleY;
  const handleWidth = 8 / viewport.zoom / scaleX;
  const handleHeight = 8 / viewport.zoom / scaleY;
  const innerWidth = 5 / viewport.zoom / scaleX;
  const innerHeight = 5 / viewport.zoom / scaleY;
  const edge = (name: string, edgeBounds: Bounds): void => {
    order = appendOverlay(
      commands,
      `selection-outline-${name}`,
      edgeBounds,
      accent,
      order,
      transform,
    );
  };
  edge("top", {
    x: bounds.x - thicknessX,
    y: bounds.y - thicknessY,
    width: bounds.width + thicknessX * 2,
    height: thicknessY,
  });
  edge("bottom", {
    x: bounds.x - thicknessX,
    y: bounds.y + bounds.height,
    width: bounds.width + thicknessX * 2,
    height: thicknessY,
  });
  edge("left", {
    x: bounds.x - thicknessX,
    y: bounds.y,
    width: thicknessX,
    height: bounds.height,
  });
  edge("right", {
    x: bounds.x + bounds.width,
    y: bounds.y,
    width: thicknessX,
    height: bounds.height,
  });

  const positions = [
    ["nw", bounds.x, bounds.y],
    ["n", bounds.x + bounds.width / 2, bounds.y],
    ["ne", bounds.x + bounds.width, bounds.y],
    ["e", bounds.x + bounds.width, bounds.y + bounds.height / 2],
    ["se", bounds.x + bounds.width, bounds.y + bounds.height],
    ["s", bounds.x + bounds.width / 2, bounds.y + bounds.height],
    ["sw", bounds.x, bounds.y + bounds.height],
    ["w", bounds.x, bounds.y + bounds.height / 2],
  ] as const;
  for (const [name, x, y] of positions) {
    order = appendOverlay(
      commands,
      `selection-handle-${name}-outer`,
      {
        x: x - handleWidth / 2,
        y: y - handleHeight / 2,
        width: handleWidth,
        height: handleHeight,
      },
      accent,
      order,
      transform,
      Math.min(handleWidth, handleHeight) / 2,
    );
    order = appendOverlay(
      commands,
      `selection-handle-${name}-inner`,
      {
        x: x - innerWidth / 2,
        y: y - innerHeight / 2,
        width: innerWidth,
        height: innerHeight,
      },
      white,
      order,
      transform,
      Math.min(innerWidth, innerHeight) / 2,
    );
  }
  return order;
};

const appendOutline = (
  commands: DrawCommand[],
  prefix: string,
  bounds: Bounds,
  viewport: RenderFrame["viewport"],
  color: [number, number, number, number],
  order: number,
): number => {
  const thickness = 3 / viewport.zoom;
  order = appendOverlay(commands, `${prefix}-top`, { x: bounds.x - thickness, y: bounds.y - thickness, width: bounds.width + thickness * 2, height: thickness }, color, order);
  order = appendOverlay(commands, `${prefix}-bottom`, { x: bounds.x - thickness, y: bounds.y + bounds.height, width: bounds.width + thickness * 2, height: thickness }, color, order);
  order = appendOverlay(commands, `${prefix}-left`, { x: bounds.x - thickness, y: bounds.y, width: thickness, height: bounds.height }, color, order);
  return appendOverlay(commands, `${prefix}-right`, { x: bounds.x + bounds.width, y: bounds.y, width: thickness, height: bounds.height }, color, order);
};

export const composeRenderFrame = (
  frame: RenderFrame,
  options: {
    pathCommands?: DrawCommand[];
    previewBounds?: Bounds;
    overlayCommands?: DrawCommand[];
    selectionBox?: { bounds: Bounds; transform: Transform2D };
    overlay?: RenderFrame["overlay"];
    glassSurfaces?: RenderFrame["glassSurfaces"];
    chromeGlass?: RenderFrame["chromeGlass"];
  },
): RenderFrame => {
  const commands = [...frame.commands, ...(options.pathCommands ?? [])];
  let order = commands.reduce((highest, command) => Math.max(highest, command.order), -1) + 1;
  if (options.selectionBox) {
    order = appendSelectionBox(commands, options.selectionBox, frame.viewport, order);
  } else if (frame.selectionBounds) {
    order = appendOutline(commands, "selection-outline", frame.selectionBounds, frame.viewport, [0.25, 0.78, 0.91, 1], order);
  }
  if (options.previewBounds) {
    order = appendOverlay(commands, "preview", options.previewBounds, [0.27, 0.29, 0.48, 1], order);
    order = appendOutline(commands, "preview-outline", options.previewBounds, frame.viewport, [0.88, 0.78, 0.48, 1], order);
  }
  for (const command of options.overlayCommands ?? []) {
    commands.push({ ...command, zIndex: Number.MAX_SAFE_INTEGER, order });
    order += 1;
  }
  return {
    ...frame,
    commands,
    ...(options.overlay ? { overlay: options.overlay } : {}),
    ...(options.glassSurfaces ? { glassSurfaces: options.glassSurfaces } : {}),
    ...(options.chromeGlass ? { chromeGlass: options.chromeGlass } : {}),
  };
};
