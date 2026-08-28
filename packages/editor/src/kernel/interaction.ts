import type { DocumentId, EditorDocument, PathHandleMode, PathPoint, PointId, Rect, SubpathId } from "./document.js";
import { inverseTransformPoint, multiplyTransforms, identityTransform, screenToWorld, transformPoint, transformRect, type Point, type Viewport } from "./coordinates.js";
import { pointInSubpath, resolveAutoHandles, segmentControlPoints } from "./path-geometry.js";
import type { PenSnapPayload, SnapChoicesPayload, SnapGuidesPayload } from "./snap.js";

/** Flattening tolerance for the path hit-test narrow phase, in world units. */
const HIT_TEST_FLATNESS = 0.25 as const;
/** Point/handle hit tolerance, in world units — screen-constant at use (÷zoom). */
const POINT_HIT_TOLERANCE = 6 as const;
/** Resize-handle corner tolerance, in screen px — world at use (÷zoom). */
const RESIZE_HANDLE_SCREEN_PX = 16 as const;
/** The rotate ring: the band just OUTSIDE the corner handles, in screen px —
 *  world at use (÷zoom). Narrow on purpose: rotation must never arm from a
 *  click inside the box — only from just past the corner. */
const ROTATE_RING_SCREEN_PX = 14 as const;
const CORNER_RADIUS_HANDLE_SCREEN_PX = 8 as const;

/** The eight selection-box handle zones — each a circle of `tolerance`
 *  around one of the OVERLAY-DRAWN handle positions (world space), so the
 *  arm zones match the drawn handles under any rotation or scale. */
const handleAt = (
  point: Point,
  positions: readonly Point[],
  tolerance: number,
): ResizeHandle | undefined => {
  const names: readonly ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
  let best: ResizeHandle | undefined;
  let bestDistance = tolerance;
  positions.forEach((at, index) => {
    const d = Math.hypot(at.x - point.x, at.y - point.y);
    if (d <= bestDistance) {
      bestDistance = d;
      best = names[index];
    }
  });
  return best;
};

const cornerHandleAt = (
  point: Point,
  positions: readonly { handle: CornerHandle; point: Point }[],
  tolerance: number,
): CornerHandle | undefined => {
  let best: CornerHandle | undefined;
  let bestDistance = tolerance;
  for (const entry of positions) {
    const current = distance(point, entry.point);
    if (current <= bestDistance) {
      bestDistance = current;
      best = entry.handle;
    }
  }
  return best;
};

/** Whether the cursor sits in the rotate ring: the band between the corner
 *  handle zone and `tolerance + ring`, around the box's corners, and ONLY
 *  outside the box's own outline (a click inside the box is a move, never a
 *  rotation). */
const rotateZoneAt = (
  point: Point,
  positions: readonly Point[],
  tolerance: number,
  ring: number,
): boolean => {
  if (positions.length < 8) return false;
  const corners = [positions[0]!, positions[2]!, positions[4]!, positions[6]!];
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY)
    return false;
  return corners.some((corner) => {
    const d = Math.hypot(corner.x - point.x, corner.y - point.y);
    return d > tolerance && d <= tolerance + ring;
  });
};

export type EditorTool = "select" | "rectangle" | "ellipse" | "line" | "frame" | "hand" | "pen";
export type InteractionPhase = "idle" | "armed" | "captured" | "preview" | "committed" | "cancelled";
/** The eight selection-handle zones (compass names), plus the rotate ring
 *  just outside the corner handles. `move` carries the armed handle so the
 *  harness resizes from the correct side. */
export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
export type CornerHandle = "nw" | "ne" | "se" | "sw";
export interface PointerInput { type: "pointer-down" | "pointer-move" | "pointer-up" | "pointer-cancel"; pointerId: number; point: Point; button: number; altKey: boolean; shiftKey: boolean; spaceKey: boolean; ctrlKey?: boolean; clickCount?: number; }
export interface WheelInput { type: "wheel"; point: Point; deltaY: number; ctrlKey: boolean; metaKey: boolean; factor?: number; }
export type InteractionInput = PointerInput | WheelInput;
export interface InteractionState { tool: EditorTool; phase: InteractionPhase; pointerId?: number; start?: Point; current?: Point; rawStart?: Point; rawCurrent?: Point; startSnapChoices?: SnapChoicesPayload; targetId?: DocumentId; mutationNodeIds?: DocumentId[]; draftBounds?: Rect; navigation: boolean; pendingSelect?: boolean; resizeHandle?: ResizeHandle; cornerHandle?: CornerHandle; rotate?: boolean; duplicate?: boolean; pathTarget?: { nodeId: DocumentId; pointId: PointId; kind: "point" | "handle"; handle?: "in" | "out" }; }
export interface InteractionContext {
  viewport: Viewport;
  dragThreshold: number;
  hitTest: (point: Point) => DocumentId | undefined;
  /** The DEEPEST visible node under the cursor — the ⌘-click target. */
  hitTestDeep?: (point: Point) => DocumentId | undefined;
  selectedIds?: readonly DocumentId[];
  /** Whether the authored node and its ancestry currently permit mutation.
   *  Affordance callbacks are disposable projection data and may be stale, so
   *  the reducer checks this independently before granting precedence. */
  canMutateNode?: (nodeId: DocumentId) => boolean;
  /** The single selection's authored bounds (world/local), when the
   *  selection is exactly one node — the resize-arming corner test target. */
  selectedBounds?: { x: number; y: number; width: number; height: number };
  /** A node's eight selection-handle positions in WORLD space — the exact
   *  points the overlay draws, in `[nw, n, ne, e, se, s, sw, w]` order — so
   *  the handle zones and rotate ring arm against the TARGET's drawn box at
   *  pointer-down (the selection lands after the arm effect), and rotated or
   *  scaled nodes arm exactly where their handles are drawn. */
  handlePositionsOf?: (nodeId: DocumentId) => Point[] | undefined;
  /** The four inset corner-radius handle positions in WORLD space. */
  cornerHandlePositionsOf?: (nodeId: DocumentId) => { handle: CornerHandle; point: Point }[] | undefined;
  /** The pen session's first point in world coordinates, when the harness has
   *  an in-progress path — the close target. */
  penSessionFirstPoint?: Point;
  /** The kernel's current point selection for the node tool's drag set. */
  selectedPointIds?: readonly PointId[];
  /** The handle mode of a point, for the drag-constraint grammar. */
  pathPointMode?: (nodeId: DocumentId, pointId: PointId) => PathHandleMode | undefined;
  /** Path-level hit tests for the node/pen tools, in world coordinates. */
  hitTestPathPoint?: (point: Point, tolerance: number) => PathPointHit | undefined;
  hitTestPathHandle?: (point: Point, tolerance: number) => PathHandleHit | undefined;
  hitTestPathSegment?: (point: Point, tolerance: number) => PathSegmentHit | undefined;
  /** The open endpoint of any other path, for pen joins. */
  hitTestPathEndpoint?: (point: Point, tolerance: number) => PathPointHit | undefined;
  /**
   * Snap services — the kernel's pure snap over the harness viewport. Each
   * consumes a SCREEN point and returns screen coordinates, so the reducer's
   * arithmetic stays in its own space.
   */
  snapPenPoint?: (point: Point) => { point: Point; snap: PenSnapPayload | undefined };
  snapCornerPoint?: (point: Point) => { point: Point; choices: SnapChoicesPayload };
  snapMoveDelta?: (delta: Point, nodeIds: DocumentId[], resizeHandle: ResizeHandle | undefined, bypass: boolean, modifiers: { shiftKey: boolean; altKey: boolean }) => { delta: Point; guides: SnapGuidesPayload; choices: SnapChoicesPayload };
}

/**
 * Effect vocabulary. Each tool owns a disjoint subset: creation effects only
 * exist for the rectangle tool, selection/marquee/move effects only for the
 * select tool, navigation (pan/zoom/cancel) is shared, and the pen/node
 * tools own the path-editing effects. This is the accidental-rectangle
 * regression contract: a wheel or pinch navigation can never produce a
 * create effect, and pointer-down on a miss never arms creation outside the
 * rectangle tool.
 */
export type InteractionEffect =
  | { type: "select"; nodeId?: DocumentId; additive: boolean }
  | { type: "begin-marquee"; start: Point }
  | { type: "update-marquee"; bounds: Rect }
  | { type: "commit-marquee"; bounds: Rect; additive: boolean }
  | { type: "begin-pan" }
  | { type: "pan"; delta: Point }
  | { type: "preview-rectangle"; bounds: Rect; snapChoices?: SnapChoicesPayload; startSnapChoices?: SnapChoicesPayload }
  | { type: "commit-rectangle"; bounds: Rect }
  | { type: "commit-ellipse"; bounds: Rect }
  | { type: "commit-line"; start: Point; end: Point }
  | { type: "commit-frame"; bounds: Rect }
  | { type: "move"; nodeIds: DocumentId[]; delta: Point; resize?: boolean; handle?: ResizeHandle; duplicate?: boolean; shiftKey?: boolean; altKey?: boolean; ctrlKey?: boolean; guides?: SnapGuidesPayload; snapChoices?: SnapChoicesPayload }
  | { type: "corner-radius"; nodeId: DocumentId; delta: Point; handle: CornerHandle }
  | { type: "rotate"; point: Point; shiftKey: boolean }
  | { type: "cancel" }
  | { type: "zoom"; point: Point; factor: number }
  | { type: "pen-begin"; point: Point; handle?: Point }
  | { type: "pen-add-point"; point: Point; handle?: Point }
  | { type: "pen-preview"; point: Point; handle?: Point; snap?: PenSnapPayload }
  | { type: "pen-close" }
  | { type: "pen-join"; nodeId: DocumentId; pointId: PointId }
  | { type: "pen-end" }
  // The pen tool is also the path-editing tool (Photoshop's model): clicking
  // an existing anchor grabs it (drag moves it or its handle), ctrl+click
  // cycles its type, shift+click deletes it.
  | { type: "pen-select-points"; nodeId: DocumentId; pointIds: PointId[]; additive: boolean }
  | { type: "pen-move-points"; nodeId: DocumentId; pointIds: PointId[]; delta: Point }
  | { type: "pen-move-handle"; nodeId: DocumentId; pointId: PointId; handle: "in" | "out"; delta: Point; shiftKey: boolean; altKey: boolean; ctrlKey: boolean }
  | { type: "pen-cycle-type"; nodeId: DocumentId; pointId: PointId }
  | { type: "pen-delete-point"; nodeId: DocumentId; pointId: PointId };

export const TOOL_EFFECT_VOCABULARIES: Record<EditorTool, ReadonlySet<InteractionEffect["type"]>> = {
  select: new Set(["select", "begin-marquee", "update-marquee", "commit-marquee", "move", "corner-radius", "rotate", "begin-pan", "pan", "cancel", "zoom"]),
  rectangle: new Set(["begin-pan", "pan", "preview-rectangle", "commit-rectangle", "cancel", "zoom"]),
  ellipse: new Set(["begin-pan", "pan", "preview-rectangle", "commit-ellipse", "cancel", "zoom"]),
  line: new Set(["begin-pan", "pan", "preview-rectangle", "commit-line", "cancel", "zoom"]),
  frame: new Set(["begin-pan", "pan", "preview-rectangle", "commit-frame", "cancel", "zoom"]),
  hand: new Set(["begin-pan", "pan", "cancel", "zoom"]),
  pen: new Set(["begin-pan", "pan", "cancel", "zoom", "pen-begin", "pen-add-point", "pen-preview", "pen-close", "pen-join", "pen-end", "pen-select-points", "pen-move-points", "pen-move-handle", "pen-cycle-type", "pen-delete-point"])
};

const distance = (left: Point, right: Point): number => Math.hypot(left.x - right.x, left.y - right.y);
const bounds = (start: Point, end: Point): Rect => ({ x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y) });
/** Screen-constant hit tolerance converted to world units at the point of use. */
const screenTolerance = (context: InteractionContext): number => POINT_HIT_TOLERANCE / context.viewport.zoom;

/** The armed resize handle: the cursor must sit on one of the eight zones
 *  around the TARGET's drawn handle positions (which follow the node's
 *  transform, so rotated nodes resize exactly where the overlay draws). */
const armedResizeHandle = (point: Point, positions: readonly Point[], context: InteractionContext): ResizeHandle | undefined => {
  const world = screenToWorld(point, context.viewport);
  return handleAt(world, positions, RESIZE_HANDLE_SCREEN_PX / context.viewport.zoom);
};

/** The rotate ring around the box's drawn corners, in WORLD space. */
const armedRotate = (point: Point, positions: readonly Point[], context: InteractionContext): boolean => {
  const world = screenToWorld(point, context.viewport);
  return rotateZoneAt(world, positions, RESIZE_HANDLE_SCREEN_PX / context.viewport.zoom, ROTATE_RING_SCREEN_PX / context.viewport.zoom);
};

export const initialInteractionState = (tool: EditorTool = "select"): InteractionState => ({ tool, phase: "idle", navigation: false });
export const setInteractionTool = (state: InteractionState, tool: EditorTool): InteractionState => ({ tool, phase: "idle", navigation: false });

/** Validation and the emitted move share this target/selection rule, so a
 * continuation never validates a narrower set than the effect mutates. */
const mutationNodeIds = (state: InteractionState, context: InteractionContext): DocumentId[] => {
  if (state.mutationNodeIds) return state.mutationNodeIds;
  if (state.pathTarget) return [state.pathTarget.nodeId];
  if (!state.targetId) return [];
  if (state.resizeHandle || state.cornerHandle || state.rotate) return [state.targetId];
  const selection = context.selectedIds ?? [];
  return selection.includes(state.targetId) ? [...selection] : [state.targetId];
};

export const transitionInteraction = (state: InteractionState, input: InteractionInput, context: InteractionContext): { state: InteractionState; effects: InteractionEffect[] } => {
  if (input.type === "wheel") {
    const factor = input.factor ?? (input.deltaY > 0 ? 0.9 : 1.1);
    const zoom: InteractionEffect = { type: "zoom", point: input.point, factor };
    // Wheel/pinch is classified as navigation before any creation session:
    // it cancels an in-flight gesture and can never arm or commit creation.
    if (state.phase !== "idle") return { state: initialInteractionState(state.tool), effects: [zoom] };
    return { state, effects: [zoom] };
  }
  if (input.type === "pointer-down") {
    // The modifier grammar (ratified 2026-08-09): Alt means duplicate /
    // measure / from-center — NEVER pan. Space, middle-button and the hand
    // tool own panning (three redundant ways already exist).
    const navigation = state.tool === "hand" || input.button === 1 || input.spaceKey;
    if (navigation) return { state: { ...state, phase: "captured", pointerId: input.pointerId, start: input.point, current: input.point, navigation: true }, effects: [{ type: "begin-pan" }] };
    let targetId: DocumentId | undefined;
    let selectedHandle: ResizeHandle | undefined;
    let selectedCornerHandle: CornerHandle | undefined;
    let selectedRotate = false;
    // Selection affordances are chrome owned by the selected node, not scene
    // geometry. Arbitrate them before ordinary hit testing so a node drawn
    // underneath a visible handle cannot steal its gesture.
    if (state.tool === "select" && (context.selectedIds?.length ?? 0) === 1) {
      const selected = context.selectedIds![0]!;
      const mutable = context.canMutateNode?.(selected) ?? true;
      const positions = mutable ? context.handlePositionsOf?.(selected) : undefined;
      const cornerPositions = mutable ? context.cornerHandlePositionsOf?.(selected) : undefined;
      selectedCornerHandle = cornerPositions
        ? cornerHandleAt(screenToWorld(input.point, context.viewport), cornerPositions, CORNER_RADIUS_HANDLE_SCREEN_PX / context.viewport.zoom)
        : undefined;
      selectedHandle = selectedCornerHandle ? undefined : positions ? armedResizeHandle(input.point, positions, context) : undefined;
      selectedRotate = !selectedCornerHandle && !selectedHandle && positions !== undefined && armedRotate(input.point, positions, context);
      if (selectedCornerHandle || selectedHandle || selectedRotate) {
        targetId = selected;
      }
    }
    targetId ??= context.hitTest(input.point);
    if (
      state.tool === "select" &&
      !targetId &&
      context.selectedIds?.length === 1 &&
      !(context.canMutateNode?.(context.selectedIds[0]!) ?? true)
    ) {
      return { state, effects: [] };
    }
    if (state.tool === "rectangle" || state.tool === "ellipse" || state.tool === "frame") {
      // The drag's first corner snaps at arm time, so a click without a
      // drag already lands on the target the preview showed.
      const snapped = context.snapCornerPoint?.(input.point);
      const start = snapped?.point ?? input.point;
      return { state: { ...state, phase: "armed", pointerId: input.pointerId, start, current: input.point, rawStart: input.point, rawCurrent: input.point, ...(snapped && (snapped.choices.x || snapped.choices.y) ? { startSnapChoices: snapped.choices } : {}), navigation: false }, effects: [] };
    }
    if (state.tool === "line") {
      // A line's endpoints are points, not corners: snap both, and keep the
      // start un-armed so a plain click cannot commit a zero-length line.
      const snapped = context.snapCornerPoint?.(input.point);
      const start = snapped?.point ?? input.point;
      return { state: { ...state, phase: "armed", pointerId: input.pointerId, start, current: input.point, rawStart: input.point, rawCurrent: input.point, ...(snapped && (snapped.choices.x || snapped.choices.y) ? { startSnapChoices: snapped.choices } : {}), navigation: false }, effects: [] };
    }
    if (state.tool === "pen") {
      const first = context.penSessionFirstPoint;
      const tolerance = screenTolerance(context);
      // An ACTIVE session takes priority: close on its first point, join an
      // open endpoint of another path.
      if (first && distance(input.point, first) < tolerance) {
        return { state: initialInteractionState(state.tool), effects: [{ type: "pen-close" }] };
      }
      const endpoint = context.hitTestPathEndpoint?.(input.point, tolerance);
      if (endpoint && first) {
        return { state: initialInteractionState(state.tool), effects: [{ type: "pen-join", nodeId: endpoint.nodeId, pointId: endpoint.pointId }] };
      }
      // Path editing — Photoshop's pen edits existing anchors directly:
      // a handle grab arms a handle drag, a point grab arms a point drag,
      // shift+click deletes the point, ctrl+click cycles its type.
      const handleHit = context.hitTestPathHandle?.(input.point, tolerance);
      if (handleHit) {
        return { state: { ...state, phase: "armed", pointerId: input.pointerId, start: input.point, current: input.point, navigation: false, mutationNodeIds: [handleHit.nodeId], pathTarget: { nodeId: handleHit.nodeId, pointId: handleHit.pointId, kind: "handle", handle: handleHit.handle } }, effects: [{ type: "pen-select-points", nodeId: handleHit.nodeId, pointIds: [handleHit.pointId], additive: input.shiftKey ?? false }] };
      }
      const pointHit = context.hitTestPathPoint?.(input.point, tolerance);
      if (pointHit) {
        if (input.shiftKey) {
          return { state: initialInteractionState(state.tool), effects: [{ type: "pen-delete-point", nodeId: pointHit.nodeId, pointId: pointHit.pointId }] };
        }
        if (input.ctrlKey) return { state: initialInteractionState(state.tool), effects: [{ type: "pen-cycle-type", nodeId: pointHit.nodeId, pointId: pointHit.pointId }] };
        return { state: { ...state, phase: "armed", pointerId: input.pointerId, start: input.point, current: input.point, navigation: false, mutationNodeIds: [pointHit.nodeId], pathTarget: { nodeId: pointHit.nodeId, pointId: pointHit.pointId, kind: "point" } }, effects: [{ type: "pen-select-points", nodeId: pointHit.nodeId, pointIds: [pointHit.pointId], additive: input.shiftKey ?? false }] };
      }
      // A miss arms a new anchor: the first click of a session. The start
      // snaps so the placed anchor lands on the target the dot previewed.
      const snap = context.snapPenPoint?.(input.point);
      return { state: { ...state, phase: "armed", pointerId: input.pointerId, start: snap?.point ?? input.point, current: input.point, navigation: false }, effects: [] };
    }
    // Grabbing a node that is already selected must not collapse the selection
    // on pointer-down, or a multi-selection drag would only ever move one node.
    // The collapse is deferred to pointer-up, and only if no drag happened.
    const pendingSelect = Boolean(targetId) && !input.shiftKey && (context.selectedIds ?? []).includes(targetId!) && (context.selectedIds ?? []).length > 1;
    // ⌘-click selects the DEEPEST node under the cursor (hierarchy laddering
    // down through overlapping containers) instead of the topmost.
    const selectedAffordance = selectedHandle !== undefined || selectedCornerHandle !== undefined || selectedRotate;
    if (targetId && !selectedAffordance && (input.ctrlKey ?? false)) {
      const deep = context.hitTestDeep?.(input.point) ?? targetId;
      return { state: { ...state, phase: "armed", pointerId: input.pointerId, start: input.point, current: input.point, navigation: false, targetId: deep }, effects: [{ type: "select", nodeId: deep, additive: false }] };
    }
    // Double-click descends one level: the deepest child under the cursor
    // replaces the topmost hit (the enter-the-group half of laddering).
    if (targetId && !selectedAffordance && (input.clickCount ?? 0) >= 2) {
      const deep = context.hitTestDeep?.(input.point) ?? targetId;
      const descend = deep !== targetId ? deep : targetId;
      return { state: { ...state, phase: "armed", pointerId: input.pointerId, start: input.point, current: input.point, navigation: false, targetId: descend }, effects: [{ type: "select", nodeId: descend, additive: false }] };
    }
    const targetMutable = targetId ? (context.canMutateNode?.(targetId) ?? true) : false;
    const handlePositions = targetId && targetMutable ? context.handlePositionsOf?.(targetId) : undefined;
    const cornerPositions = targetId && targetMutable && context.selectedIds?.length === 1 && context.selectedIds[0] === targetId
      ? context.cornerHandlePositionsOf?.(targetId)
      : undefined;
    const cornerHandle = selectedCornerHandle ?? (cornerPositions
      ? cornerHandleAt(screenToWorld(input.point, context.viewport), cornerPositions, CORNER_RADIUS_HANDLE_SCREEN_PX / context.viewport.zoom)
      : undefined);
    const handle = selectedHandle ?? (handlePositions ? armedResizeHandle(input.point, handlePositions, context) : undefined);
    const rotate = selectedRotate || (!cornerHandle && !handle && handlePositions !== undefined && armedRotate(input.point, handlePositions, context));
    // Alt means from-centre when a resize handle is armed; only a body drag
    // duplicates. Arbitration happens here so the harness never sees both
    // vocabularies for one pointer-down.
    const duplicate = input.altKey && Boolean(targetId);
    const armed = {
      ...state,
      phase: "armed" as const,
      pointerId: input.pointerId,
      start: input.point,
      current: input.point,
      navigation: false,
      ...(targetId ? { targetId } : {}),
      ...(handle ? { resizeHandle: handle } : {}),
      ...(cornerHandle ? { cornerHandle } : {}),
      ...(rotate ? { rotate: true } : {}),
      ...(duplicate ? { duplicate: true } : {}),
    };
    const armedMutationNodeIds = mutationNodeIds(armed, context);
    if (armedMutationNodeIds.length > 0) armed.mutationNodeIds = armedMutationNodeIds;
    if (pendingSelect) return { state: { ...armed, pendingSelect: true }, effects: [] };
    // Affordances belong to the current selection. Shift constrains their
    // gesture; it must not also toggle their selected node off.
    if ((handle || cornerHandle || rotate) && targetId && (context.selectedIds ?? []).includes(targetId)) return { state: armed, effects: [] };
    return { state: armed, effects: [{ type: "select", additive: input.shiftKey, ...(targetId ? { nodeId: targetId } : {}) }] };
  }
  if (state.pointerId !== input.pointerId || !state.start) {
    // The idle pen cursor preview: a dot rides the cursor (snapped when a
    // target is in range) so the next anchor's landing spot is visible
    // before the click. Only the pen tool previews idle hovers.
    if (input.type === "pointer-move" && state.tool === "pen" && state.phase === "idle") {
      const snap = context.snapPenPoint?.(input.point);
      return {
        state,
        effects: [
          {
            type: "pen-preview",
            point: snap?.point ?? input.point,
            ...(snap?.snap ? { snap: snap.snap } : {}),
          },
        ],
      };
    }
    return { state, effects: [] };
  }
  if (input.type === "pointer-move") {
    const next = { ...state, current: input.point, rawCurrent: input.point };
    if (state.phase === "armed" && distance(state.start, input.point) < context.dragThreshold) return { state: next, effects: [] };
    if (state.navigation) return { state: { ...next, phase: "preview" }, effects: [{ type: "pan", delta: { x: input.point.x - state.start.x, y: input.point.y - state.start.y } }] };
    // The document may change between pointer events, so every node an effect
    // will mutate must remain mutable before a preview can be emitted.
    const effectNodeIds = mutationNodeIds(state, context);
    if (effectNodeIds.some((nodeId) => !(context.canMutateNode?.(nodeId) ?? true))) {
      return { state: { ...initialInteractionState(state.tool), phase: "cancelled" }, effects: [{ type: "cancel" }] };
    }
    if (state.tool === "rectangle" || state.tool === "ellipse" || state.tool === "frame") {
      const snappedStart = state.rawStart ? context.snapCornerPoint?.(state.rawStart) : undefined;
      const start = snappedStart?.point ?? state.rawStart ?? state.start;
      const snapped = context.snapCornerPoint?.(input.point);
      const end = snapped?.point ?? input.point;
      const startSnapChoices = snappedStart && (snappedStart.choices.x || snappedStart.choices.y) ? snappedStart.choices : undefined;
      return { state: { ...next, start, ...(startSnapChoices ? { startSnapChoices } : {}), phase: "preview", draftBounds: bounds(start, end) }, effects: [{ type: "preview-rectangle", bounds: bounds(start, end), ...(snapped && (snapped.choices.x || snapped.choices.y) ? { snapChoices: snapped.choices } : {}), ...(startSnapChoices ? { startSnapChoices } : {}) }] };
    }
    if (state.tool === "line") {
      const snappedStart = state.rawStart ? context.snapCornerPoint?.(state.rawStart) : undefined;
      const start = snappedStart?.point ?? state.rawStart ?? state.start;
      const snapped = context.snapCornerPoint?.(input.point);
      const end = snapped?.point ?? input.point;
      const startSnapChoices = snappedStart && (snappedStart.choices.x || snappedStart.choices.y) ? snappedStart.choices : undefined;
      return { state: { ...next, start, current: end, ...(startSnapChoices ? { startSnapChoices } : {}), phase: "preview", draftBounds: bounds(start, end) }, effects: [{ type: "preview-rectangle", bounds: bounds(start, end), ...(snapped && (snapped.choices.x || snapped.choices.y) ? { snapChoices: snapped.choices } : {}), ...(startSnapChoices ? { startSnapChoices } : {}) }] };
    }
    if (state.tool === "pen") {
      if (state.phase === "armed" && distance(state.start ?? input.point, input.point) < context.dragThreshold) return { state: next, effects: [] };
      const delta = { x: input.point.x - (state.start?.x ?? 0), y: input.point.y - (state.start?.y ?? 0) };
      // A grabbed anchor drags its handle or the point (the path-editing
      // half of the pen); otherwise the pending anchor's handle preview.
      if (state.pathTarget?.kind === "handle") {
        return { state: { ...next, phase: "preview" }, effects: [{ type: "pen-move-handle", nodeId: state.pathTarget.nodeId, pointId: state.pathTarget.pointId, handle: state.pathTarget.handle ?? "out", delta, shiftKey: input.shiftKey, altKey: input.altKey, ctrlKey: input.ctrlKey ?? false }] };
      }
      if (state.pathTarget?.kind === "point") {
        // Dragging a point in the selection drags the whole selection;
        // grabbing outside it drags only that point (the select tool's rule).
        const selected = context.selectedPointIds ?? [];
        const pointIds = selected.includes(state.pathTarget.pointId) ? [...selected] : [state.pathTarget.pointId];
        return { state: { ...next, phase: "preview" }, effects: [{ type: "pen-move-points", nodeId: state.pathTarget.nodeId, pointIds, delta }] };
      }
      // The pending anchor is the click's start; a drag past the threshold
      // pulls its outgoing handle. Preview is ephemeral — the harness draws
      // it, never the document. The anchor SNAPS when a target is in range
      // (the dot shows where it will land); otherwise it stays where the
      // click landed. The handle stays free at the raw cursor.
      const snap = context.snapPenPoint?.(input.point);
      const handle = state.start && distance(state.start, input.point) >= context.dragThreshold ? input.point : undefined;
      return {
        state: { ...next, phase: "preview" },
        effects: [
          {
            type: "pen-preview",
            point: snap?.point ?? state.start ?? input.point,
            ...(handle ? { handle } : {}),
            ...(snap?.snap ? { snap: snap.snap } : {}),
          },
        ],
      };
    }
    if (state.targetId) {
      // Drag moves the whole selection when the grabbed node belongs to it;
      // grabbing outside the selection moves only that node. A drag that
      // armed a resize handle resizes from that handle; one that armed the
      // rotate ring rotates around the box center; an alt-drag duplicates
      // the dragged set at gesture start — all decided here at arm time so
      // the harness never infers them.
      const nodeIds = effectNodeIds;
      if (state.cornerHandle) {
        return { state: { ...next, phase: "preview" }, effects: [{ type: "corner-radius", nodeId: state.targetId, delta: { x: input.point.x - state.start.x, y: input.point.y - state.start.y }, handle: state.cornerHandle }] };
      }
      if (state.rotate) {
        return { state: { ...next, phase: "preview" }, effects: [{ type: "rotate", point: input.point, shiftKey: input.shiftKey }] };
      }
      const resize = nodeIds.length === 1 && state.resizeHandle !== undefined;
      const rawDelta = { x: input.point.x - state.start.x, y: input.point.y - state.start.y };
      // The move/resize delta snaps so the selection's edges (or its resize
      // corner) align with visible targets; the payload carries the aligned
      // positions for the guide overlay.
      const snapped = context.snapMoveDelta?.(
        rawDelta,
        nodeIds,
        resize ? state.resizeHandle : undefined,
        input.ctrlKey ?? false,
        { shiftKey: input.shiftKey, altKey: input.altKey },
      );
      return {
        state: { ...next, phase: "preview" },
        effects: [
          {
            type: "move",
            nodeIds,
            delta: snapped?.delta ?? rawDelta,
            ...(resize && state.resizeHandle ? { resize: true, handle: state.resizeHandle } : {}),
            ...(state.duplicate && !resize ? { duplicate: true } : {}),
            ...(input.shiftKey ? { shiftKey: true } : {}),
            ...(input.altKey ? { altKey: true } : {}),
            ...(input.ctrlKey ? { ctrlKey: true } : {}),
            ...(snapped && (snapped.guides.x !== undefined || snapped.guides.y !== undefined) ? { guides: snapped.guides } : {}),
            ...(snapped && (snapped.choices.x || snapped.choices.y) ? { snapChoices: snapped.choices } : {}),
          },
        ],
      };
    }
    if (state.phase === "armed") return { state: { ...next, phase: "preview", draftBounds: bounds(state.start, input.point) }, effects: [{ type: "begin-marquee", start: state.start }] };
    return { state: { ...next, draftBounds: bounds(state.start, input.point) }, effects: [{ type: "update-marquee", bounds: bounds(state.start, input.point) }] };
  }
  if (input.type === "pointer-cancel") return { state: { ...initialInteractionState(state.tool), phase: "cancelled" }, effects: [{ type: "cancel" }] };
  if (
    state.phase === "preview" &&
    mutationNodeIds(state, context).some((nodeId) => !(context.canMutateNode?.(nodeId) ?? true))
  ) {
    return { state: { ...initialInteractionState(state.tool), phase: "cancelled" }, effects: [{ type: "cancel" }] };
  }
  if (state.tool === "pen") {
    // A click (or click-drag) commits the pending anchor when no anchor was
    // grabbed; a grabbed anchor's drag commits through the harness's gesture
    // finish (the point-move transaction). The harness owns the session: a
    // first point begins the path, later points extend it — each a single
    // history entry once the session ends.
    if (state.phase === "armed" || state.phase === "preview") {
      if (!state.pathTarget) {
        // The up position equals the last previewed position, so re-snapping
        // here lands the anchor exactly where the dot showed it; without a
        // snap the anchor stays at the click's start (the handle pull's
        // origin).
        const snapped = context.snapPenPoint?.(input.point);
        const point = snapped?.point ?? state.start ?? input.point;
        const handle = state.start && distance(state.start, input.point) >= context.dragThreshold ? input.point : undefined;
        const effect: InteractionEffect = context.penSessionFirstPoint
          ? { type: "pen-add-point", point, ...(handle ? { handle } : {}) }
          : { type: "pen-begin", point, ...(handle ? { handle } : {}) };
        return { state: initialInteractionState(state.tool), effects: [effect] };
      }
      return { state: initialInteractionState(state.tool), effects: [] };
    }
    return { state: initialInteractionState(state.tool), effects: [] };
  }
  if (state.tool === "rectangle" || state.tool === "ellipse" || state.tool === "frame") {
    // A dragged box commits the LAST PREVIEWED bounds (already corner-snapped
    // on every move — what the outline showed); a plain click falls back to
    // the default-size box centered on the snapped start.
    const draftBounds = state.draftBounds ?? { x: state.start.x - 60, y: state.start.y - 40, width: 120, height: 80 };
    if (draftBounds.width >= context.dragThreshold && draftBounds.height >= context.dragThreshold) {
      const commit =
        state.tool === "ellipse"
          ? { type: "commit-ellipse" as const, bounds: draftBounds }
          : state.tool === "frame"
            ? { type: "commit-frame" as const, bounds: draftBounds }
            : { type: "commit-rectangle" as const, bounds: draftBounds };
      return { state: { ...initialInteractionState(state.tool), phase: "committed" }, effects: [commit] };
    }
    return { state: { ...initialInteractionState(state.tool), phase: "committed" }, effects: [] };
  }
  if (state.tool === "line") {
    // A dragged line commits the last previewed endpoint; a plain click
    // falls back to a default-length line to the right of the snapped start.
    const start = state.start ?? input.point;
    const end = state.current ?? { x: start.x + 120, y: start.y };
    return { state: { ...initialInteractionState(state.tool), phase: "committed" }, effects: [{ type: "commit-line", start, end }] };
  }
  if (!state.targetId && state.draftBounds) {
    if (state.draftBounds.width >= context.dragThreshold && state.draftBounds.height >= context.dragThreshold) return { state: { ...initialInteractionState(state.tool), phase: "committed" }, effects: [{ type: "commit-marquee", bounds: state.draftBounds, additive: input.shiftKey }] };
    return { state: { ...initialInteractionState(state.tool), phase: "committed" }, effects: [] };
  }
  // A click on an already-selected node with no drag collapses the selection to
  // that node — the deferred half of the pointer-down rule above.
  if (state.pendingSelect && state.phase === "armed" && state.targetId) return { state: { ...initialInteractionState(state.tool), phase: "committed" }, effects: [{ type: "select", nodeId: state.targetId, additive: false }] };
  return { state: { ...initialInteractionState(state.tool), phase: "committed" }, effects: [] };
};

export const documentHitTest = (document: EditorDocument, pageId: DocumentId, point: Point, scopeId?: DocumentId): DocumentId | undefined => {
  const page = document.pages[pageId];
  if (!page) return undefined;
  const hits: Array<{ id: DocumentId; depth: number }> = [];
  const withinScope = (id: DocumentId): boolean => {
    if (!scopeId) return true;
    let cursor = document.nodes[id];
    while (cursor) {
      if (cursor.id === scopeId) return id !== scopeId;
      cursor = cursor.parentId ? document.nodes[cursor.parentId] : undefined;
    }
    return false;
  };
  const visit = (id: DocumentId, parentTransform: ReturnType<typeof identityTransform>, depth: number): void => {
    const node = document.nodes[id];
    if (!node || !node.visible || node.locked) return;
    const position = { a: 1, b: 0, c: 0, d: 1, e: node.bounds.x, f: node.bounds.y };
    const transform = multiplyTransforms(parentTransform, multiplyTransforms(position, node.transform));
    const local = inverseTransformPoint(point, transform);
    // Broad phase: the node-local AABB. For path nodes this is followed by a
    // geometry narrow phase, so clicking inside a curve's bbox but outside
    // the curve does not select it.
    if (withinScope(id) && local && local.x >= 0 && local.x <= node.bounds.width && local.y >= 0 && local.y <= node.bounds.height && node.kind !== "page-root") {
      if (node.kind === "path" && node.path) {
        const inside = Object.keys(node.path.subpaths).some((subpathId) => pointInSubpath(node.path!, subpathId, { x: local.x, y: local.y }, HIT_TEST_FLATNESS));
        if (inside) hits.push({ id, depth });
      } else {
        hits.push({ id, depth });
      }
    }
    for (const childId of node.childIds) visit(childId, transform, depth + 1);
  };
  visit(page.rootId, identityTransform(), 0);
  return hits.at(-1)?.id;
};

/** The DEEPEST visible node under the cursor — ⌘-click's target. The painter's
 *  topmost hit (`documentHitTest`) is the last pre-order hit, which is usually
 *  but not always the deepest; laddering down must pick the max-depth hit. */
export const documentDeepHitTest = (document: EditorDocument, pageId: DocumentId, point: Point, scopeId?: DocumentId): DocumentId | undefined => {
  const page = document.pages[pageId];
  if (!page) return undefined;
  let best: { id: DocumentId; depth: number } | undefined;
  const withinScope = (id: DocumentId): boolean => {
    if (!scopeId) return true;
    let cursor = document.nodes[id];
    while (cursor) {
      if (cursor.id === scopeId) return id !== scopeId;
      cursor = cursor.parentId ? document.nodes[cursor.parentId] : undefined;
    }
    return false;
  };
  const visit = (id: DocumentId, parentTransform: ReturnType<typeof identityTransform>, depth: number): void => {
    const node = document.nodes[id];
    if (!node || !node.visible || node.locked) return;
    const position = { a: 1, b: 0, c: 0, d: 1, e: node.bounds.x, f: node.bounds.y };
    const transform = multiplyTransforms(parentTransform, multiplyTransforms(position, node.transform));
    const local = inverseTransformPoint(point, transform);
    if (withinScope(id) && local && local.x >= 0 && local.x <= node.bounds.width && local.y >= 0 && local.y <= node.bounds.height && node.kind !== "page-root") {
      if (node.kind === "path" && node.path) {
        const inside = Object.keys(node.path.subpaths).some((subpathId) => pointInSubpath(node.path!, subpathId, { x: local.x, y: local.y }, HIT_TEST_FLATNESS));
        if (inside && (!best || depth > best.depth)) best = { id, depth };
      } else if (!best || depth > best.depth) {
        best = { id, depth };
      }
    }
    for (const childId of node.childIds) visit(childId, transform, depth + 1);
  };
  visit(page.rootId, identityTransform(), 0);
  return best?.id;
};

/** The ids of selectable nodes whose WORLD bounds intersect the marquee —
 *  visibility- and lock-inheriting, pre-order, page-root excluded. The
 *  document-native selection rule (the projected-scene walk in the harness
 *  was the third duplicate of this composition). With a `scopeId`, only the
 *  scope container's subtree is considered — a marquee started INSIDE a
 *  frame selects only that frame's children (the frame's own box is
 *  excluded: the marquee must not select the very container it scopes to). */
export const marqueeSelectableIds = (document: EditorDocument, pageId: DocumentId, world: Rect, scopeId?: DocumentId): DocumentId[] => {
  const page = document.pages[pageId];
  if (!page) return [];
  const ids: DocumentId[] = [];
  const visit = (id: DocumentId, parentTransform: ReturnType<typeof identityTransform>): void => {
    const node = document.nodes[id];
    if (!node || !node.visible || node.locked) return;
    const position = { a: 1, b: 0, c: 0, d: 1, e: node.bounds.x, f: node.bounds.y };
    const transform = multiplyTransforms(parentTransform, multiplyTransforms(position, node.transform));
    if (node.kind !== "page-root" && node.id !== scopeId) {
      // The placement folds into the transform's e/f (the same fold the
      // spatial index and the selection box use), so the world box is the
      // LOCAL rect transformed — keeping marquee, click, rendered rects and
      // the selection outline on the same coordinates.
      const box = transformRect({ x: 0, y: 0, width: node.bounds.width, height: node.bounds.height }, transform);
      if (box.x < world.x + world.width && box.x + box.width > world.x && box.y < world.y + world.height && box.y + box.height > world.y) ids.push(node.id);
    }
    if (!scopeId || id === scopeId) {
      for (const childId of node.childIds) visit(childId, transform);
    }
  };
  visit(page.rootId, identityTransform());
  return ids;
};

// -- Path-level hit testing (the node and pen tools) --------------------------

export interface PathPointHit { nodeId: DocumentId; pointId: PointId; at: Point; }
export interface PathHandleHit { nodeId: DocumentId; pointId: PointId; handle: "in" | "out"; }
export interface PathSegmentHit { nodeId: DocumentId; subpathId: SubpathId; prevId: PointId; nextId: PointId; t: number; at: Point; midpoint: Point; }

interface PathHitShape {
  nodeId: DocumentId;
  transform: ReturnType<typeof identityTransform>;
  points: Record<string, PathPoint>;
  subpaths: Record<string, { id: string; closed: boolean }>;
}

/** The world transforms of visible path nodes, deepest last (topmost first for
 *  hit testing), with their RESOLVED geometry (auto handles materialized). */
const visiblePathNodes = (document: EditorDocument, pageId: DocumentId): PathHitShape[] => {
  const page = document.pages[pageId];
  if (!page) return [];
  const found: PathHitShape[] = [];
  const visit = (id: DocumentId, parentTransform: ReturnType<typeof identityTransform>): void => {
    const node = document.nodes[id];
    if (!node || !node.visible || node.locked) return;
    const position = { a: 1, b: 0, c: 0, d: 1, e: node.bounds.x, f: node.bounds.y };
    const transform = multiplyTransforms(parentTransform, multiplyTransforms(position, node.transform));
    if (node.kind === "path" && node.path) {
      const resolved = resolveAutoHandles(node.path);
      found.push({ nodeId: node.id, transform, points: resolved.points, subpaths: resolved.subpaths });
    }
    for (const childId of node.childIds) visit(childId, transform);
  };
  visit(page.rootId, identityTransform());
  return found;
};

const localPoint = (hit: PathHitShape, point: Point): Point | undefined => inverseTransformPoint(point, hit.transform);
const worldPoint = (hit: PathHitShape, local: Point): Point => transformPoint(local, hit.transform);

const orderedPoints = (hit: PathHitShape, subpathId: string): PathPoint[] =>
  Object.values(hit.points)
    .filter((point) => point.subpathId === subpathId)
    .sort((left, right) => (left.order < right.order ? -1 : left.order > right.order ? 1 : 0));

/** Nearest point or handle of any visible path, within `tolerance` world units. */
export const hitTestPathPoint = (document: EditorDocument, pageId: DocumentId, point: Point, tolerance: number): PathPointHit | undefined => {
  let best: { hit: PathPointHit; distance: number } | undefined;
  for (const path of visiblePathNodes(document, pageId)) {
    const local = localPoint(path, point);
    if (!local) continue;
    for (const subpath of Object.values(path.subpaths)) {
      for (const candidate of orderedPoints(path, subpath.id)) {
        const anchor = worldPoint(path, { x: candidate.x, y: candidate.y });
        const distance = Math.hypot(anchor.x - point.x, anchor.y - point.y);
        if (distance <= tolerance && (!best || distance < best.distance)) best = { hit: { nodeId: path.nodeId, pointId: candidate.id, at: anchor }, distance };
      }
    }
  }
  return best?.hit;
};

/** An open subpath's first or last point, within `tolerance` — the pen join
 *  target. Closed subpaths have no endpoint. */
export const hitTestPathEndpoint = (document: EditorDocument, pageId: DocumentId, point: Point, tolerance: number): PathPointHit | undefined => {
  let best: { hit: PathPointHit; distance: number } | undefined;
  for (const path of visiblePathNodes(document, pageId)) {
    const local = localPoint(path, point);
    if (!local) continue;
    for (const subpath of Object.values(path.subpaths)) {
      if (subpath.closed) continue;
      const ordered = orderedPoints(path, subpath.id);
      for (const candidate of [ordered[0], ordered[ordered.length - 1]]) {
        if (!candidate) continue;
        const anchor = worldPoint(path, { x: candidate.x, y: candidate.y });
        const distance = Math.hypot(anchor.x - point.x, anchor.y - point.y);
        if (distance <= tolerance && (!best || distance < best.distance)) best = { hit: { nodeId: path.nodeId, pointId: candidate.id, at: anchor }, distance };
      }
    }
  }
  return best?.hit;
};

/** A point's handle (in or out), world position, within `tolerance`. */
export const hitTestPathHandle = (document: EditorDocument, pageId: DocumentId, point: Point, tolerance: number): PathHandleHit | undefined => {
  let best: { hit: PathHandleHit; distance: number } | undefined;
  for (const path of visiblePathNodes(document, pageId)) {
    const local = localPoint(path, point);
    if (!local) continue;
    for (const subpath of Object.values(path.subpaths)) {
      for (const candidate of orderedPoints(path, subpath.id)) {
        const resolved = path.points[candidate.id]!;
        for (const [name, handle] of [["in", resolved.handleIn], ["out", resolved.handleOut]] as const) {
          if (!handle) continue;
          const position = worldPoint(path, { x: candidate.x + handle.dx, y: candidate.y + handle.dy });
          const distance = Math.hypot(position.x - point.x, position.y - point.y);
          if (distance <= tolerance && (!best || distance < best.distance)) best = { hit: { nodeId: path.nodeId, pointId: candidate.id, handle: name }, distance };
        }
      }
    }
  }
  return best?.hit;
};

/** The nearest segment of any visible path, with the parameter `t` of the
 *  closest point — the insert-on-segment and pen-snap target. `at` is the
 *  closest point in world units; `midpoint` is the segment's half-way point
 *  (t = 0.5) in world units — the pen's half-way indicator. */
export const hitTestPathSegment = (document: EditorDocument, pageId: DocumentId, point: Point, tolerance: number): PathSegmentHit | undefined => {
  let best: { hit: PathSegmentHit; distance: number } | undefined;
  for (const path of visiblePathNodes(document, pageId)) {
    const local = localPoint(path, point);
    if (!local) continue;
    for (const subpath of Object.values(path.subpaths)) {
      const ordered = orderedPoints(path, subpath.id);
      for (let i = 0; i < ordered.length; i += 1) {
        const p0 = ordered[i]!;
        const p1 = ordered[(i + 1) % ordered.length]!;
        if (i === ordered.length - 1 && !subpath.closed) break;
        const [a, c1, c2, b] = segmentControlPoints(p0, p1);
        // Coarse 8-sample scan then a fine local search on the segment.
        let bestT = 0;
        let bestDistance = Infinity;
        for (let step = 0; step <= 8; step += 1) {
          const t = step / 8;
          const at = cubicAt(a, c1, c2, b, t);
          const d = Math.hypot(at.x - local.x, at.y - local.y);
          if (d < bestDistance) { bestDistance = d; bestT = t; }
        }
        for (let step = 1; step <= 8; step += 1) {
          const t = Math.min(1, Math.max(0, bestT + (step / 8) * 0.125 - 0.0625));
          const at = cubicAt(a, c1, c2, b, t);
          const d = Math.hypot(at.x - local.x, at.y - local.y);
          if (d < bestDistance) { bestDistance = d; bestT = t; }
        }
        const nearest = cubicAt(a, c1, c2, b, bestT);
        const worldNearest = worldPoint(path, nearest);
        const worldDistance = Math.hypot(worldNearest.x - point.x, worldNearest.y - point.y);
        if (worldDistance <= tolerance && (!best || worldDistance < best.distance)) {
          const half = cubicAt(a, c1, c2, b, 0.5);
          best = { hit: { nodeId: path.nodeId, subpathId: subpath.id, prevId: p0.id, nextId: p1.id, t: bestT, at: worldNearest, midpoint: worldPoint(path, half) }, distance: worldDistance };
        }
      }
    }
  }
  return best?.hit;
};

const cubicAt = (p0: Point, c1: Point, c2: Point, p1: Point, t: number): Point => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * c1.x + c * c2.x + d * p1.x,
    y: a * p0.y + b * c1.y + c * c2.y + d * p1.y,
  };
};
