import type { DocumentId, EditorDocument, GridDescriptor, GuideRecord, Rect, SnapSettings } from "./document.js";
import { identityTransform, multiplyTransforms, transformRect, type Point } from "./coordinates.js";
import { SNAP_TOLERANCE_SCREEN_PX } from "./coordinates.js";
import { SNAP_FAMILY_PRIORITY, snapAxis } from "./grid.js";
import { hitTestPathPoint, hitTestPathSegment } from "./interaction.js";

/**
 * The kernel's live snap service — pure functions over (document, viewport
 * page settings, candidate positions), the single authoritative
 * implementation for every tool. Coordinate conversion happens at the call
 * site: the reducer consumes screen points and the harness converts to
 * world before entering this module.
 *
 * Three shapes of snap:
 *  - `snapPenPoint` — a 2D anchor snap that prefers exact path geometry
 *    (an existing anchor, then the nearest point ON a segment, carrying the
 *    segment's midpoint for the half-way indicator) before falling back to
 *    per-axis families.
 *  - `snapCorner` — a per-axis point snap (rectangle corners, resize
 *    corners): pixel, guide, object, grid.
 *  - `snapMove` — a delta snap that aligns the moved selection's edges (or
 *    its resize corner) onto per-axis candidates and reports the aligned
 *    positions for the guide overlay.
 *
 * Visibility is the final gate for every family: a hidden grid or guide
 * never snaps, so the canvas never feels sticky against something the user
 * cannot see (grid.test.ts covers the policy).
 */

/** The snap payload a pen preview carries: what the pending anchor snapped
 *  to, plus the half-way indicator position for a segment snap. */
export interface PenSnapPayload {
  kind: "path-point" | "path-segment" | "axis";
  choices?: SnapChoicesPayload;
  /** The snapped segment's midpoint in world units — the half-way indicator
   *  the overlay draws while the anchor is magnetized to the line. */
  midpoint?: Point;
}

/** The aligned positions of a move/resize snap, in world units — the guide
 *  overlay's lines. An undefined axis means that axis did not snap. */
export interface SnapGuidesPayload {
  x?: number;
  y?: number;
}

export type SnapSourceFeature = "point" | "left" | "center-x" | "right" | "top" | "center-y" | "bottom";

export interface ChosenSnap {
  family: import("./grid.js").SnapFamily;
  axis: "x" | "y";
  value: number;
  source: SnapSourceFeature;
}

export interface SnapChoicesPayload {
  x?: ChosenSnap;
  y?: ChosenSnap;
}

/** World edge positions of the page's visible nodes — the object family's
 *  candidates. Left/center/right and top/center/bottom per node. The
 *  per-object GROUPS carry each node's own triple, so the rhythm family can
 *  tell "a spacing gap between two objects" from "one object's own
 *  height" — the pattern detector must never read a single object's
 *  dimensions as a rhythm. */
export interface SnapObjectPositions {
  x: number[];
  y: number[];
  xGroups: number[][];
  yGroups: number[][];
}

/** Candidate budget per axis: beyond this many positions the service stops
 *  adding (the nearest ones are still a sample, and the tolerance filter
 *  does the rest). */
const MAX_SNAP_OBJECT_POSITIONS = 1024 as const;

const edgeTriple = (box: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { x: [number, number, number]; y: [number, number, number] } => ({
  x: [box.x, box.x + box.width / 2, box.x + box.width],
  y: [box.y, box.y + box.height / 2, box.y + box.height],
});

/** The world boxes of the page's visible, unlocked nodes — the object
 *  family's candidates. `excludeIds` drops the moving selection so a drag
 *  never magnetizes to its own edges. */
export const objectSnapPositions = (
  document: EditorDocument,
  pageId: DocumentId,
  excludeIds?: ReadonlySet<DocumentId>,
): SnapObjectPositions => {
  const page = document.pages[pageId];
  const out: SnapObjectPositions = { x: [], y: [], xGroups: [], yGroups: [] };
  if (!page) return out;
  const visit = (id: DocumentId, parentTransform: ReturnType<typeof identityTransform>): void => {
    const node = document.nodes[id];
    if (!node || !node.visible || node.locked) return;
    const position = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: node.bounds.x,
      f: node.bounds.y,
    };
    const transform = multiplyTransforms(parentTransform, multiplyTransforms(position, node.transform));
    if (node.kind !== "page-root" && !excludeIds?.has(id) && out.x.length < MAX_SNAP_OBJECT_POSITIONS) {
      const box = transformRect({ x: 0, y: 0, width: node.bounds.width, height: node.bounds.height }, transform);
      const edges = edgeTriple(box);
      out.x.push(...edges.x);
      out.y.push(...edges.y);
      out.xGroups.push(edges.x);
      out.yGroups.push(edges.y);
    }
    for (const childId of node.childIds) visit(childId, transform);
  };
  visit(page.rootId, identityTransform());
  return out;
};

/** The union of the named nodes' world boxes — the moving selection's drag
 *  bounds. Undefined when none of the ids resolve. */
export const unionWorldBounds = (
  document: EditorDocument,
  pageId: DocumentId,
  ids: readonly DocumentId[],
): Rect | undefined => {
  const page = document.pages[pageId];
  if (!page || ids.length === 0) return undefined;
  let union: Rect | undefined;
  const visit = (id: DocumentId, parentTransform: ReturnType<typeof identityTransform>): void => {
    const node = document.nodes[id];
    if (!node || !node.visible) return;
    const position = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: node.bounds.x,
      f: node.bounds.y,
    };
    const transform = multiplyTransforms(parentTransform, multiplyTransforms(position, node.transform));
    if (node.kind !== "page-root") {
      const box = transformRect({ x: 0, y: 0, width: node.bounds.width, height: node.bounds.height }, transform);
      if (ids.includes(id)) {
        union = union
          ? {
              x: Math.min(union.x, box.x),
              y: Math.min(union.y, box.y),
              width: Math.max(union.x + union.width, box.x + box.width) - Math.min(union.x, box.x),
              height: Math.max(union.y + union.height, box.y + box.height) - Math.min(union.y, box.y),
            }
          : { x: box.x, y: box.y, width: box.width, height: box.height };
      }
    }
    for (const childId of node.childIds) visit(childId, transform);
  };
  visit(page.rootId, identityTransform());
  return union;
};

export interface SnapTargetsOptions {
  zoom: number;
  gridOpacity?: number;
  snap: SnapSettings;
  grid?: GridDescriptor | undefined;
  guides?: GuideRecord[] | undefined;
  objects?: SnapObjectPositions | undefined;
  /** The pen session's anchors — the magnet family (guide priority), so new
   *  anchors align with the path being drawn. Per-axis lists. */
  magnets?: { x: number[]; y: number[] } | undefined;
}

const toleranceOf = (zoom: number): number => SNAP_TOLERANCE_SCREEN_PX / Math.max(Number.EPSILON, zoom);

/** Builds a SnapAxisOptions literal without undefined optional keys —
 *  exactOptionalPropertyTypes forbids explicit undefined. Flat parameters so
 *  callers can vary the settings (snapMove drops the pixel family). */
const axisOptions = (
  axis: "x" | "y",
  value: number,
  zoom: number,
  gridOpacity: number | undefined,
  snap: SnapSettings,
  grid: GridDescriptor | undefined,
  guides: GuideRecord[] | undefined,
  objectPositions?: number[],
  objectGroups?: number[][],
  magnetPositions?: number[],
): Parameters<typeof snapAxis>[0] => ({
  axis,
  value,
  zoom,
  ...(gridOpacity !== undefined ? { gridOpacity } : {}),
  snap,
  ...(grid ? { grid } : {}),
  ...(guides ? { guides } : {}),
  ...(objectPositions !== undefined ? { objectPositions } : {}),
  ...(objectGroups !== undefined ? { objectGroups } : {}),
  ...(magnetPositions !== undefined ? { magnetPositions } : {}),
});

/** Per-axis snap over the pixel/guide/object/grid families. Returns the
 *  snapped value and whether each axis actually snapped. */
const snapPointAxis = (point: Point, options: SnapTargetsOptions): { point: Point; choices: SnapChoicesPayload } => {
  const x = snapAxis(
    axisOptions(
      "x",
      point.x,
      options.zoom,
      options.gridOpacity,
      options.snap,
      options.grid,
      options.guides,
      options.objects?.x,
      options.objects?.xGroups,
      options.magnets?.x,
    ),
  );
  const y = snapAxis(
    axisOptions(
      "y",
      point.y,
      options.zoom,
      options.gridOpacity,
      options.snap,
      options.grid,
      options.guides,
      options.objects?.y,
      options.objects?.yGroups,
      options.magnets?.y,
    ),
  );
  return {
    point: { x: x.value, y: y.value },
    choices: {
      ...(x.snapped && Math.abs(x.value - point.x) > 1e-9 ? { x: { ...x.snapped, source: "point" as const } } : {}),
      ...(y.snapped && Math.abs(y.value - point.y) > 1e-9 ? { y: { ...y.snapped, source: "point" as const } } : {}),
    },
  };
};

/** Per-axis point snap — rectangle corners and resize corners. */
export const snapCorner = (point: Point, options: SnapTargetsOptions): Point => snapPointAxis(point, options).point;

export const snapCornerDecision = (point: Point, options: SnapTargetsOptions): { point: Point; choices: SnapChoicesPayload } =>
  snapPointAxis(point, options);

/** The pen anchor snap: exact path geometry first (an existing anchor, then
 *  the nearest point ON a segment with its half-way midpoint), then the
 *  per-axis families. The payload is undefined when nothing snapped. The
 *  pixel family is excluded — the dot's accent is reserved for a visible
 *  target, and a sub-pixel correction is not an alignment (same rule as
 *  snapMove). */
export const snapPenPoint = (
  document: EditorDocument,
  pageId: DocumentId,
  point: Point,
  options: SnapTargetsOptions,
): { point: Point; snap: PenSnapPayload | undefined } => {
  const tolerance = toleranceOf(options.zoom);
  const anchor = hitTestPathPoint(document, pageId, point, tolerance);
  if (anchor) return { point: anchor.at, snap: { kind: "path-point" } };
  const segment = hitTestPathSegment(document, pageId, point, tolerance);
  if (segment)
    return {
      point: segment.at,
      snap: { kind: "path-segment", midpoint: segment.midpoint },
    };
  const visible = { ...options, snap: { ...options.snap, pixel: false } };
  const axis = snapPointAxis(point, visible);
  // A snap must actually MOVE the anchor: a pixel-aligned cursor is not a
  // snap (the dot stays neutral), only a correction is.
  const moved = Math.abs(axis.point.x - point.x) > 1e-9 || Math.abs(axis.point.y - point.y) > 1e-9;
  return {
    point: axis.point,
    snap: (axis.choices.x || axis.choices.y) && moved ? { kind: "axis", choices: axis.choices } : undefined,
  };
};

/** The move/resize delta snap. `bounds` is the selection's PRE-drag world
 *  box and `delta` the cumulative world delta, so the adjusted delta lands
 *  the edges (or the resize corner) on candidates. `guides` reports the
 *  aligned positions for the guide overlay. The pixel family is excluded:
 *  moves align to what the user can SEE (objects, guides, a visible grid),
 *  and a silent sub-pixel correction would flash a guide line on every drag
 *  (the overlay's alignment line is the move snap's indicator, not the
 *  device grid's). */
export const snapMove = (
  bounds: Rect,
  delta: Point,
  options: SnapTargetsOptions & { resizeHandle?: import("./interaction.js").ResizeHandle },
): { delta: Point; guides: SnapGuidesPayload; choices: SnapChoicesPayload } => {
  const tolerance = toleranceOf(options.zoom);
  const visible = { ...options, snap: { ...options.snap, pixel: false } };
  if (options.resizeHandle) {
    const handle = options.resizeHandle;
    const movesLeft = handle.includes("w");
    const movesRight = handle.includes("e");
    const movesTop = handle.includes("n");
    const movesBottom = handle.includes("s");
    const point = {
      x: movesLeft ? bounds.x + delta.x : movesRight ? bounds.x + bounds.width + delta.x : bounds.x,
      y: movesTop ? bounds.y + delta.y : movesBottom ? bounds.y + bounds.height + delta.y : bounds.y,
    };
    const target = snapPointAxis(point, visible);
    const xChoice = movesLeft || movesRight ? target.choices.x : undefined;
    const yChoice = movesTop || movesBottom ? target.choices.y : undefined;
    const x = xChoice ? target.point.x - (movesLeft ? bounds.x : bounds.x + bounds.width) : delta.x;
    const y = yChoice ? target.point.y - (movesTop ? bounds.y : bounds.y + bounds.height) : delta.y;
    const choices: SnapChoicesPayload = {
      ...(xChoice && Math.abs(x - delta.x) > 1e-9 ? { x: { ...xChoice, source: movesLeft ? "left" as const : "right" as const } } : {}),
      ...(yChoice && Math.abs(y - delta.y) > 1e-9 ? { y: { ...yChoice, source: movesTop ? "top" as const : "bottom" as const } } : {}),
    };
    return {
      delta: { x, y },
      guides: {
        ...(xChoice && Math.abs(x - delta.x) > 1e-9 ? { x: xChoice.value } : {}),
        ...(yChoice && Math.abs(y - delta.y) > 1e-9 ? { y: yChoice.value } : {}),
      },
      choices,
    };
  }
  const snapEdgeAxis = (axis: "x" | "y"): { delta: number; choice: ChosenSnap | undefined } => {
    const edges =
      axis === "x"
        ? [bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width]
        : [bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height];
    // Best across edges ranks by FAMILY first, then distance: a real object
    // alignment on one edge must beat a rhythm inference on another (the
    // pattern detector is a fallback, never a replacement).
    let best: { delta: number; choice: ChosenSnap; rank: number; distance: number } | undefined;
    for (const [index, edge] of edges.entries()) {
      const target = edge + delta[axis];
      const decision = snapAxis(
        axisOptions(
          axis,
          target,
          visible.zoom,
          visible.gridOpacity,
          visible.snap,
          visible.grid,
          visible.guides,
          visible.objects?.[axis],
          axis === "x" ? visible.objects?.xGroups : visible.objects?.yGroups,
          visible.magnets?.[axis],
        ),
      );
      if (!decision.snapped) continue;
      const adjust = decision.value - edge;
      const distance = Math.abs(adjust - delta[axis]);
      const rank = SNAP_FAMILY_PRIORITY.indexOf(decision.snapped.family);
      if (!best || rank < best.rank || (rank === best.rank && distance < best.distance)) {
        const source = axis === "x" ? (["left", "center-x", "right"] as const)[index]! : (["top", "center-y", "bottom"] as const)[index]!;
        best = { delta: adjust, choice: { ...decision.snapped, source }, rank, distance };
      }
    }
    return best ? { delta: best.delta, choice: best.choice } : { delta: delta[axis], choice: undefined };
  };
  const x = snapEdgeAxis("x");
  const y = snapEdgeAxis("y");
  return {
    delta: { x: x.delta, y: y.delta },
    guides: {
      // A no-op snap (adjust 0 — the edge already sat on the candidate)
      // reports no guide: the line would sit on the moving box itself.
      ...(x.choice !== undefined && Math.abs(x.delta - delta.x) > 1e-9 ? { x: x.choice.value } : {}),
      ...(y.choice !== undefined && Math.abs(y.delta - delta.y) > 1e-9 ? { y: y.choice.value } : {}),
    },
    choices: {
      ...(x.choice && Math.abs(x.delta - delta.x) > 1e-9 ? { x: x.choice } : {}),
      ...(y.choice && Math.abs(y.delta - delta.y) > 1e-9 ? { y: y.choice } : {}),
    },
  };
};
