import { orderKeyForSigned } from "../../kernel/index.js";
import type { DrawCommand, DrawPathPoint } from "@crafty/scene-renderer";
import type { EditorProjection, Point, SelectedPointGrippy } from "./harness.js";

/**
 * Editing overlays for the pen and node tools: grippies with their handles,
 * the in-progress pen session, and the node tool's point marquee. Composed
 * fresh every frame from the projection — ephemeral renderer state, never
 * authored geometry, never stored. The renderer folds these plain rect draw
 * commands into the frame above the preview overlays (the `overlayCommands`
 * channel, mirroring the preview-commands precedent); the module draws them
 * like every command. Screen-constant sizes divide by zoom at the point of
 * use — the composition lives here, in the host.
 *
 * Indicators are CIRCLES — the modern design-tool look. Filled dots are
 * rect commands with a corner radius (the encoder clamps to the half
 * extents, so radius = size/2 is an exact circle); true rings (a visible
 * backdrop inside) are stroked circle paths, whose centers stay transparent.
 */

type Rgba = [number, number, number, number];

const IDENTITY = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } as const;

const MARQUEE_FILL: Rgba = [0.27, 0.29, 0.48, 1];
const ACCENT: Rgba = [0.88, 0.78, 0.48, 1];
const HANDLE_LINE: Rgba = [0.42, 0.48, 0.62, 1];
const PEN_SEGMENT: Rgba = [0.36, 0.44, 0.68, 1];
const PENDING_SEGMENT: Rgba = [0.55, 0.62, 0.8, 1];
const GRIPPY_FILL: Rgba = [1, 1, 1, 1];
const GRIPPY_RING: Rgba = [0.09, 0.1, 0.14, 1];
/** The move/resize alignment guide — the accent at near-full opacity, drawn
 *  as a thin full-bleed line. */
const SNAP_GUIDE: Rgba = [0.88, 0.78, 0.48, 0.9];
/** The active anchor's inner dot — the accent, smaller than the white dot it
 *  sits inside (the design-tool active/inactive anchor convention). */
const ANCHOR_ACTIVE: Rgba = ACCENT;

interface OverlayBuilder {
  commands: DrawCommand[];
  order: number;
}

/** One rect (optionally rounded — radius = half the minor axis is a circle);
 *  the zIndex/order are normalized by the renderer's fold-in, but kept
 *  self-consistent here so the array is always drawable. */
const pushRect = (
  builder: OverlayBuilder,
  nodeId: string,
  bounds: { x: number; y: number; width: number; height: number },
  transform: DrawCommand["transform"],
  fill: Rgba,
  radius?: number,
): void => {
  builder.commands.push({
    geometry: "rect",
    nodeId,
    bounds,
    transform,
    fill,
    opacity: 1,
    zIndex: Number.MAX_SAFE_INTEGER,
    order: builder.order,
    ...(radius !== undefined && radius > 0 ? { cornerRadius: radius } : {}),
  });
  builder.order += 1;
};

/** A filled circle centered on `center` — a rounded rect with the radius at
 *  half the minor axis, so the encoder's clamp makes it an exact circle. */
const pushCircle = (
  builder: OverlayBuilder,
  nodeId: string,
  center: Point,
  size: number,
  color: Rgba,
): void => {
  pushRect(
    builder,
    nodeId,
    {
      x: center.x - size / 2,
      y: center.y - size / 2,
      width: size,
      height: size,
    },
    IDENTITY,
    color,
    size / 2,
  );
};

/** A stroked circle ring — a 4-cubic circle path with the stroke descriptor,
 *  so the center stays transparent (a filled ring would hide the backdrop).
 *  The standard circle approximation (k = 0.55228r) with mirrored handles. */
const pushRing = (
  builder: OverlayBuilder,
  nodeId: string,
  center: Point,
  size: number,
  thickness: number,
  color: Rgba,
): void => {
  const radius = size / 2;
  const k = radius * 0.5522847498;
  const subpathId = `sub-${builder.order}`;
  const points: Record<string, DrawPathPoint> = {};
  const anchors = [
    { x: center.x, y: center.y - radius, out: { dx: k, dy: 0 } },
    { x: center.x + radius, y: center.y, out: { dx: 0, dy: k } },
    { x: center.x, y: center.y + radius, out: { dx: -k, dy: 0 } },
    { x: center.x - radius, y: center.y, out: { dx: 0, dy: -k } },
  ];
  anchors.forEach((anchor, index) => {
    const id = `pt-${index}`;
    points[id] = {
      id,
      subpathId,
      order: orderKeyForSigned(index * 65536),
      x: anchor.x,
      y: anchor.y,
      handleMode: "mirrored",
      handleOut: anchor.out,
    };
  });
  builder.commands.push({
    geometry: "path",
    nodeId,
    bounds: {
      x: center.x - radius,
      y: center.y - radius,
      width: size,
      height: size,
    },
    transform: IDENTITY,
    fill: color,
    opacity: 1,
    zIndex: Number.MAX_SAFE_INTEGER,
    order: builder.order,
    path: {
      points,
      subpaths: { [subpathId]: { id: subpathId, closed: true } },
    },
    fillRule: "nonzero",
    stroke: { width: thickness, caps: "round", joins: "round", dash: [] },
  });
  builder.order += 1;
};

/** The edge outline of a rectangle — the `appendOutline` pattern, applied to
 *  arbitrary world bounds (the node tool's point marquee). */
const pushOutline = (
  builder: OverlayBuilder,
  prefix: string,
  bounds: { x: number; y: number; width: number; height: number },
  thickness: number,
  color: Rgba,
): void => {
  pushRect(
    builder,
    `${prefix}-top`,
    {
      x: bounds.x - thickness,
      y: bounds.y - thickness,
      width: bounds.width + thickness * 2,
      height: thickness,
    },
    IDENTITY,
    color,
  );
  pushRect(
    builder,
    `${prefix}-bottom`,
    {
      x: bounds.x - thickness,
      y: bounds.y + bounds.height,
      width: bounds.width + thickness * 2,
      height: thickness,
    },
    IDENTITY,
    color,
  );
  pushRect(
    builder,
    `${prefix}-left`,
    {
      x: bounds.x - thickness,
      y: bounds.y,
      width: thickness,
      height: bounds.height,
    },
    IDENTITY,
    color,
  );
  pushRect(
    builder,
    `${prefix}-right`,
    {
      x: bounds.x + bounds.width,
      y: bounds.y,
      width: thickness,
      height: bounds.height,
    },
    IDENTITY,
    color,
  );
};

/** A line from `from` to `to`: a unit local rect under a transform whose
 *  x-axis spans the segment and whose y-axis is its normal at `thickness`.
 *  Degenerate segments are skipped — a zero-length line would encode NaN. */
const pushLine = (
  builder: OverlayBuilder,
  nodeId: string,
  from: Point,
  to: Point,
  thickness: number,
  color: Rgba,
): void => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (!(length > 0)) return;
  const direction = { x: dx / length, y: dy / length };
  pushRect(
    builder,
    nodeId,
    { x: 0, y: -0.5, width: 1, height: 1 },
    {
      a: direction.x * length,
      b: direction.y * length,
      c: -direction.y * thickness,
      d: direction.x * thickness,
      e: from.x,
      f: from.y,
    },
    color,
  );
};

const appendGrippy = (
  builder: OverlayBuilder,
  grippy: SelectedPointGrippy,
  zoom: number,
  active: boolean,
): void => {
  const ringSize = 7 / zoom;
  const ringThickness = 1.5 / zoom;
  const fillSize = 5 / zoom;
  const innerSize = 3 / zoom;
  const handleThickness = 1.5 / zoom;
  const handleSize = 3 / zoom;
  const anchor = { x: grippy.x, y: grippy.y };
  pushRing(
    builder,
    `grippy-ring-${builder.order}`,
    anchor,
    ringSize,
    ringThickness,
    GRIPPY_RING,
  );
  pushCircle(builder, `grippy-${builder.order}`, anchor, fillSize, GRIPPY_FILL);
  // The active anchor reads as a colored core inside the white dot; the
  // inactive anchors stay plain white (the design-tool convention).
  if (active)
    pushCircle(builder, `grippy-active-${builder.order}`, anchor, innerSize, ANCHOR_ACTIVE);
  if (grippy.handleIn) {
    pushLine(
      builder,
      `handle-in-${builder.order}`,
      anchor,
      grippy.handleIn,
      handleThickness,
      HANDLE_LINE,
    );
    pushCircle(
      builder,
      `handle-in-end-${builder.order}`,
      grippy.handleIn,
      handleSize,
      HANDLE_LINE,
    );
  }
  if (grippy.handleOut) {
    pushLine(
      builder,
      `handle-out-${builder.order}`,
      anchor,
      grippy.handleOut,
      handleThickness,
      HANDLE_LINE,
    );
    pushCircle(
      builder,
      `handle-out-end-${builder.order}`,
      grippy.handleOut,
      handleSize,
      HANDLE_LINE,
    );
  }
};

const appendPenSession = (
  builder: OverlayBuilder,
  projection: EditorProjection,
  zoom: number,
): void => {
  const session = projection.penSessionWorld;
  const preview = projection.penPreviewWorld;
  const thickness = 1.5 / zoom;
  const dotSize = 5 / zoom;
  const ringSize = 7 / zoom;
  const ringThickness = 1.25 / zoom;
  const innerSize = 3 / zoom;
  if (session.length > 0) {
    for (let i = 0; i < session.length - 1; i += 1) {
      const from = session[i]!;
      const to = session[i + 1]!;
      pushLine(
        builder,
        `pen-segment-${i}`,
        { x: from.x, y: from.y },
        { x: to.x, y: to.y },
        thickness,
        PEN_SEGMENT,
      );
    }
    const first = session[0]!;
    if (first.handle)
      pushLine(
        builder,
        "pen-first-handle",
        { x: first.x, y: first.y },
        first.handle,
        thickness,
        PEN_SEGMENT,
      );
    // Every dropped anchor gets its dot — the pen's points stay visible while
    // the session is open, so the drawn path reads as a connected set of
    // handles, not a mystery stroke. Inactive anchors are plain white; the
    // ACTIVE anchor (the last placed) carries the accent core inside it.
    const active = session[session.length - 1]!;
    for (const anchor of session) {
      const isActive = anchor === active;
      pushRing(
        builder,
        `pen-anchor-ring-${builder.order}`,
        { x: anchor.x, y: anchor.y },
        ringSize,
        ringThickness,
        GRIPPY_RING,
      );
      pushCircle(
        builder,
        `pen-anchor-${builder.order}`,
        { x: anchor.x, y: anchor.y },
        dotSize,
        GRIPPY_FILL,
      );
      if (isActive)
        pushCircle(
          builder,
          `pen-anchor-active-${builder.order}`,
          { x: anchor.x, y: anchor.y },
          innerSize,
          ANCHOR_ACTIVE,
        );
    }
    if (preview) {
      const last = session[session.length - 1]!;
      pushLine(
        builder,
        "pen-pending",
        { x: last.x, y: last.y },
        { x: preview.point.x, y: preview.point.y },
        thickness,
        PENDING_SEGMENT,
      );
      if (preview.handle) {
        pushLine(
          builder,
          "pen-pending-handle",
          { x: preview.point.x, y: preview.point.y },
          preview.handle,
          thickness,
          PENDING_SEGMENT,
        );
        pushCircle(
          builder,
          "pen-pending-handle-end",
          preview.handle,
          3 / zoom,
          PENDING_SEGMENT,
        );
      }
    }
    // The close target: a ring around the session's first point. The pen tool
    // owns the session, so it only draws while the pen tool is active.
    pushRing(
      builder,
      "pen-close",
      { x: first.x, y: first.y },
      12 / zoom,
      1.5 / zoom,
      ACCENT,
    );
  }
  // The pending anchor dot: the idle pen cursor's landing spot BEFORE the
  // first click, and the live preview during a drag. Accent when snapped —
  // the dot IS the snap indicator — neutral when free.
  if (preview) {
    pushCircle(
      builder,
      "pen-pending-point",
      preview.point,
      dotSize,
      preview.snap ? ACCENT : PENDING_SEGMENT,
    );
    // The half-way indicator: a white ring at the snapped segment's midpoint,
    // with the accent core — the line's magnetic point, visible while the
    // anchor is pulled onto it.
    if (preview.snap?.kind === "path-segment" && preview.snap.midpoint) {
      const mid = preview.snap.midpoint;
      pushRing(
        builder,
        "pen-midpoint-ring",
        { x: mid.x, y: mid.y },
        ringSize,
        ringThickness,
        GRIPPY_RING,
      );
      pushCircle(
        builder,
        "pen-midpoint-core",
        { x: mid.x, y: mid.y },
        innerSize,
        ANCHOR_ACTIVE,
      );
    }
  }
};

/** The selection indicator, aligned with the design-tool standard (Figma,
 *  Penpot): an accent outline around the selection box plus 8 screen-constant
 *  handles — 4 corners and 4 edge midpoints — each a white square with an
 *  accent border. For a single selection the box follows the node's world
 *  transform (rotation and scale); a multi-selection box is the axis-aligned
 *  union. Everything is drawn in the box's LOCAL space under its world
 *  transform, so the encoder rotates and scales the whole indicator with the
 *  node; screen-constant sizes divide by zoom (and by the transform's scale,
 *  so the handles read constant on screen regardless of the authored scale).
 *  The accent comes from the theme's `--ring` token (theme-dynamic). */
const HANDLE_SCREEN = 8;
const OUTLINE_SCREEN = 1.5;
const HANDLE_BORDER_SCREEN = 1.25;

export const composeSelectionOverlay = (
  box:
   | {
         bounds: { x: number; y: number; width: number; height: number };
         transform: DrawCommand["transform"];
         cornerRadius?: number;
       }
    | undefined,
  zoom: number,
  accent: Rgba,
  cornerRadius?: number,
): DrawCommand[] => {  if (!box || zoom <= 0) return [];
  const builder: OverlayBuilder = { commands: [], order: 0 };
  const { bounds, transform } = box;
  const width = bounds.width;
  const height = bounds.height;
  // The transform's per-axis scale: local units become world units at this
  // factor, so screen-constant sizes divide by it too.
  const sx = Math.max(Math.hypot(transform.a, transform.b), 1e-9);
  const sy = Math.max(Math.hypot(transform.c, transform.d), 1e-9);
  const tx = OUTLINE_SCREEN / zoom / sx;
  const ty = OUTLINE_SCREEN / zoom / sy;
  const hx = HANDLE_SCREEN / zoom / sx;
  const hy = HANDLE_SCREEN / zoom / sy;
  const innerX = Math.max(hx - (HANDLE_BORDER_SCREEN / zoom / sx) * 2, 0);
  const innerY = Math.max(hy - (HANDLE_BORDER_SCREEN / zoom / sy) * 2, 0);
  const edge = (
    name: string,
    rect: { x: number; y: number; width: number; height: number },
  ): void => pushRect(builder, name, rect, transform, accent);
  // The four box edges, slightly overlapping at the corners.
  edge("selection-edge-top", {
    x: -tx,
    y: -ty,
    width: width + tx * 2,
    height: ty,
  });
  edge("selection-edge-bottom", {
    x: -tx,
    y: height,
    width: width + tx * 2,
    height: ty,
  });
  edge("selection-edge-left", {
    x: -tx,
    y: -ty,
    width: tx,
    height: height + ty * 2,
  });
  edge("selection-edge-right", {
    x: width,
    y: -ty,
    width: tx,
    height: height + ty * 2,
  });
  // The handles: an accent circle with a white inner dot — circles keep the
  // modern look and read on any backdrop (the inner dot is the fill, the
  // accent shows as the rim).
  const handle = (name: string, cx: number, cy: number): void => {
    pushRect(
      builder,
      `${name}-fill`,
      { x: cx - hx / 2, y: cy - hy / 2, width: hx, height: hy },
      transform,
      accent,
      Math.min(hx, hy) / 2,
    );
    pushRect(
      builder,
      `${name}-inner`,
      { x: cx - innerX / 2, y: cy - innerY / 2, width: innerX, height: innerY },
      transform,
      GRIPPY_FILL,
      Math.min(innerX, innerY) / 2,
    );
  };
  handle("selection-corner-tl", 0, 0);
  handle("selection-corner-tr", width, 0);
  handle("selection-corner-bl", 0, height);
  handle("selection-corner-br", width, height);
  handle("selection-edge-mid-t", width / 2, 0);
  handle("selection-edge-mid-b", width / 2, height);
  handle("selection-edge-mid-l", 0, height / 2);
  handle("selection-edge-mid-r", width, height / 2);
  if (Math.min(width, height) * zoom >= 40) {
    const inset = Math.max(
      Math.min(cornerRadius ?? 0, Math.min(width, height) / 2),
      Math.min(12 / zoom / Math.max(sx, 1e-9), Math.min(width, height) / 4),
    );
    const radiusHandle = (name: string, cx: number, cy: number): void => {
      const outerX = 7 / zoom / Math.max(sx, 1e-9);
      const outerY = 7 / zoom / Math.max(sy, 1e-9);
      const innerX = 4 / zoom / Math.max(sx, 1e-9);
      const innerY = 4 / zoom / Math.max(sy, 1e-9);
      pushRect(builder, `${name}-outer`, { x: cx - outerX / 2, y: cy - outerY / 2, width: outerX, height: outerY }, transform, accent, Math.min(outerX, outerY) / 2);
      pushRect(builder, `${name}-inner`, { x: cx - innerX / 2, y: cy - innerY / 2, width: innerX, height: innerY }, transform, GRIPPY_FILL, Math.min(innerX, innerY) / 2);
    };
    radiusHandle("radius-nw", inset, inset);
    radiusHandle("radius-ne", width - inset, inset);
    radiusHandle("radius-se", width - inset, height - inset);
    radiusHandle("radius-sw", inset, height - inset);
  }
  return builder.commands;
};

/** The hover highlight: the selection outline's four edges, no handles, in a
 *  subdued accent — the select tool's "what am I about to click" affordance,
 *  the layers panel's mirror. */
export const composeHoverOverlay = (
  box:
    | {
        bounds: { x: number; y: number; width: number; height: number };
        transform: DrawCommand["transform"];
      }
    | undefined,
  zoom: number,
  accent: Rgba,
): DrawCommand[] => {
  if (!box || zoom <= 0) return [];
  const builder: OverlayBuilder = { commands: [], order: 0 };
  const { bounds, transform } = box;
  const sx = Math.max(Math.hypot(transform.a, transform.b), 1e-9);
  const sy = Math.max(Math.hypot(transform.c, transform.d), 1e-9);
  const t = OUTLINE_SCREEN / zoom / sx;
  const u = OUTLINE_SCREEN / zoom / sy;
  const edge = (name: string, rect: { x: number; y: number; width: number; height: number }): void =>
    pushRect(builder, name, rect, transform, accent);
  edge("hover-edge-top", { x: -t, y: -u, width: bounds.width + t * 2, height: u });
  edge("hover-edge-bottom", { x: -t, y: bounds.height, width: bounds.width + t * 2, height: u });
  edge("hover-edge-left", { x: -t, y: -u, width: t, height: bounds.height + u * 2 });
  edge("hover-edge-right", { x: bounds.width, y: -u, width: t, height: bounds.height + u * 2 });
  return builder.commands;
};

export const composeEditingOverlays = (
  projection: EditorProjection,
  viewportSize?: { width: number; height: number },
): DrawCommand[] => {
  const zoom = projection.viewport.zoom;
  const builder: OverlayBuilder = { commands: [], order: 0 };
  if (projection.interaction.tool === "pen") {
    // The active anchor is the last selected grippy — it carries the accent
    // core; the rest stay plain white.
    const grippies = projection.selectedPointGrippies;
    const active = grippies[grippies.length - 1];
    for (const grippy of grippies)
      appendGrippy(builder, grippy, zoom, grippy === active);
    appendPenSession(builder, projection, zoom);
  }
  // The move/resize alignment guides — accent lines at the snapped
  // positions, full-bleed across the visible area.
  const choices = projection.snapChoices;
  const startChoices = projection.creationStartSnapChoices;
  const guides = {
    ...(projection.moveSnapGuides ?? {}),
    ...(choices?.x ? { x: choices.x.value } : {}),
    ...(choices?.y ? { y: choices.y.value } : {}),
  };
  if ((guides.x !== undefined || guides.y !== undefined) && viewportSize) {
    const thickness = 1.25 / zoom;
    const left = -projection.viewport.panX / zoom;
    const top = -projection.viewport.panY / zoom;
    const right = left + viewportSize.width / zoom;
    const bottom = top + viewportSize.height / zoom;
    if (guides.x !== undefined)
      pushRect(
        builder,
        "snap-guide-x",
        { x: guides.x - thickness / 2, y: top, width: thickness, height: bottom - top },
        IDENTITY,
        SNAP_GUIDE,
      );
    if (guides.y !== undefined)
      pushRect(
        builder,
        "snap-guide-y",
        { x: left, y: guides.y - thickness / 2, width: right - left, height: thickness },
        IDENTITY,
        SNAP_GUIDE,
      );
  }
  if (startChoices && viewportSize) {
    const thickness = 1.25 / zoom;
    const left = -projection.viewport.panX / zoom;
    const top = -projection.viewport.panY / zoom;
    const right = left + viewportSize.width / zoom;
    const bottom = top + viewportSize.height / zoom;
    if (startChoices.x)
      pushRect(builder, "snap-start-guide-x", { x: startChoices.x.value - thickness / 2, y: top, width: thickness, height: bottom - top }, IDENTITY, SNAP_GUIDE);
    if (startChoices.y)
      pushRect(builder, "snap-start-guide-y", { x: left, y: startChoices.y.value - thickness / 2, width: right - left, height: thickness }, IDENTITY, SNAP_GUIDE);
  }
  return builder.commands;
};
