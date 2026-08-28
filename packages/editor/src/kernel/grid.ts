import type {
  DocumentId,
  GridDescriptor,
  GuideRecord,
  SnapSettings,
} from "./document.js";
import { SNAP_TOLERANCE_SCREEN_PX } from "./coordinates.js";

/**
 * Fixed-world grid service: a pure function of (viewport, grid descriptor,
 * world limit) producing a render plan and snap decisions.
 *
 * Pixel grid: the visible grid is always 1x1 world units, with major lines
 * every five units. Visibility is zoom-driven; there is no adaptive spacing
 * ladder or second pixel scale.
 *
 */
export const MAX_GRID_DOTS = 262_144 as const;
export const GRID_VISIBILITY_START_ZOOM = 5.1 as const;
export const GRID_VISIBILITY_END_ZOOM = 6 as const;
export const GRID_MAX_OPACITY = 0.6 as const;

export interface GridViewport {
  panX: number;
  panY: number;
  zoom: number;
  width: number;
  height: number;
}

export interface AcceptedGridViewport extends GridViewport {
  pixelRatio: number;
}

export interface AcceptedGridRenderContext {
  readonly opacity: number;
  readonly pageId: DocumentId;
  readonly viewport: Readonly<AcceptedGridViewport>;
  readonly grid: Readonly<GridDescriptor>;
}

export const snapshotGridDescriptor = (
  grid: GridDescriptor,
): Readonly<GridDescriptor> => ({
  mode: grid.mode,
  majorSpacing: grid.majorSpacing,
  minorStep: grid.minorStep,
  originX: grid.originX,
  originY: grid.originY,
  ...(grid.visible !== undefined ? { visible: grid.visible } : {}),
});

const gridDescriptorsEqual = (
  left: Readonly<GridDescriptor>,
  right: Readonly<GridDescriptor>,
): boolean =>
  left.mode === right.mode &&
  left.majorSpacing === right.majorSpacing &&
  left.minorStep === right.minorStep &&
  left.originX === right.originX &&
  left.originY === right.originY &&
  left.visible === right.visible;

/** A grid packet is a valid interaction target only while the live page,
 * camera, and grid descriptor exactly match that accepted packet. */
export const acceptedGridOpacityForViewport = (
  pageId: DocumentId,
  viewport: AcceptedGridViewport,
  grid: GridDescriptor,
  accepted: AcceptedGridRenderContext | undefined,
): number =>
  accepted &&
  accepted.pageId === pageId &&
  accepted.viewport.panX === viewport.panX &&
  accepted.viewport.panY === viewport.panY &&
  accepted.viewport.zoom === viewport.zoom &&
  accepted.viewport.width === viewport.width &&
  accepted.viewport.height === viewport.height &&
  accepted.viewport.pixelRatio === viewport.pixelRatio &&
  gridDescriptorsEqual(accepted.grid, grid)
    ? Math.min(GRID_MAX_OPACITY, Math.max(0, accepted.opacity))
    : 0;

/** Product display policy for the fixed pixel grid. `grid.visible` remains
 * readable legacy authored intent, but zoom currently owns whether the grid is
 * displayed. Overlay projection and snapping must both call this policy. */
export const gridVisibilityProgressAt = (
  viewport: Pick<GridViewport, "zoom">,
): number =>
  Math.max(
    0,
    Math.min(
      1,
      (viewport.zoom - GRID_VISIBILITY_START_ZOOM) /
        (GRID_VISIBILITY_END_ZOOM - GRID_VISIBILITY_START_ZOOM),
    ),
  );

export const isZoomDrivenGridDisplayed = (
  viewport: Pick<GridViewport, "zoom">,
  grid: GridDescriptor,
): boolean => {
  // Deliberately consume the descriptor at the policy boundary: no current
  // descriptor field overrides zoom, including legacy `visible`.
  void grid;
  return gridVisibilityProgressAt(viewport) > 0;
};

export interface GridLine {
  axis: "x" | "y";
  position: number;
  weight: "minor" | "major";
  /** 0..1 draw opacity — 1 at rest; a level cross-fade lowers it (the host
   *  drives the fade progress; the kernel stays pure). */
  alpha?: number;
}

export interface GridDot {
  x: number;
  y: number;
  weight: "minor" | "major";
  alpha?: number;
}

export interface GridPlan {
  level: number;
  minorStep: number;
  majorStep: number;
  lines: GridLine[];
  dots: GridDot[] | undefined;
  axes: GridLine[];
}

export const gridStepForZoom = (_grid: GridDescriptor, _zoom: number): number => 1;

const clampToWorld = (value: number, worldLimit: number): number => Math.max(-worldLimit, Math.min(worldLimit, value));

const visibleRange = (viewport: GridViewport, worldLimit: number, axis: "x" | "y"): { min: number; max: number } | undefined => {
  if (!Number.isFinite(viewport.zoom) || viewport.zoom <= 0 || !Number.isFinite(worldLimit) || worldLimit <= 0) return undefined;
  if (axis === "x") {
    if (!Number.isFinite(viewport.width) || viewport.width <= 0) return undefined;
    return { min: clampToWorld(-viewport.panX / viewport.zoom, worldLimit), max: clampToWorld((viewport.width - viewport.panX) / viewport.zoom, worldLimit) };
  }
  if (!Number.isFinite(viewport.height) || viewport.height <= 0) return undefined;
  return { min: clampToWorld(-viewport.panY / viewport.zoom, worldLimit), max: clampToWorld((viewport.height - viewport.panY) / viewport.zoom, worldLimit) };
};

const rangeStepBounds = (min: number, max: number, step: number, origin: number): { first: number; last: number } => ({
  first: Math.ceil((min - origin) / step),
  last: Math.floor((max - origin) / step),
});

export const gridPlan = (
  viewport: GridViewport,
  grid: GridDescriptor,
  worldLimit: number,
): GridPlan => {
  const base = 1;
  const level = 0;
  const minorStep = base;
  const majorDivisions = 5;
  const majorStep = minorStep * majorDivisions;
  const visible = true;
  const lines: GridLine[] = [];
  let dots: GridDot[] | undefined;
  const axes: GridLine[] = [];
  if (visible) {
    const xRange = visibleRange(viewport, worldLimit, "x");
    const yRange = visibleRange(viewport, worldLimit, "y");
    const emit = (axis: "x" | "y", range: { min: number; max: number }): void => {
      const origin = axis === "x" ? grid.originX : grid.originY;
      const { first, last } = rangeStepBounds(range.min, range.max, minorStep, origin);
      for (let k = first; k <= last; k += 1) {
        lines.push({ axis, position: origin + k * minorStep, weight: k % majorDivisions === 0 ? "major" : "minor" });
      }
    };
    if (xRange) {
      emit("x", xRange);
      if (grid.originX >= xRange.min && grid.originX <= xRange.max) axes.push({ axis: "x", position: grid.originX, weight: "major" });
    }
    if (yRange) {
      emit("y", yRange);
      if (grid.originY >= yRange.min && grid.originY <= yRange.max) axes.push({ axis: "y", position: grid.originY, weight: "major" });
    }
    if (grid.mode === "dots" && xRange && yRange) {
      const xSteps = rangeStepBounds(xRange.min, xRange.max, minorStep, grid.originX);
      const ySteps = rangeStepBounds(yRange.min, yRange.max, minorStep, grid.originY);
      const xCount = xSteps.last - xSteps.first + 1;
      const yCount = ySteps.last - ySteps.first + 1;
      const count = xCount * yCount;
      if (count > 0 && count <= MAX_GRID_DOTS) {
        dots = [];
        for (let x = xSteps.first; x <= xSteps.last; x += 1) {
          const xPosition = grid.originX + x * minorStep;
          const xMajor = x % majorDivisions === 0;
          for (let y = ySteps.first; y <= ySteps.last; y += 1) {
            dots.push({ x: xPosition, y: grid.originY + y * minorStep, weight: xMajor || y % majorDivisions === 0 ? "major" : "minor" });
          }
        }
      }
    }
  }
  return { level, minorStep, majorStep, lines, dots, axes };
};

export type SnapFamily = "pixel" | "guide" | "object" | "rhythm" | "grid";

export interface SnapCandidate {
  family: SnapFamily;
  axis: "x" | "y";
  value: number;
}

export const gridCaptureRadius = (zoom: number, gridStep: number): number =>
  Math.min(
    SNAP_TOLERANCE_SCREEN_PX / Math.max(Number.EPSILON, zoom),
    gridStep / 4,
  );

export interface SnapDecision {
  value: number;
  snapped: SnapCandidate | undefined;
}

/**
 * Family priority — snapValue walks it in order, so the FIRST family with a
 * candidate within tolerance wins. The device-pixel family is LAST: a
 * pixel-aligned cursor would otherwise shadow every visible target (its
 * candidate sits at distance ~0), and "snap to pixel" is a refinement when
 * no object, guide or grid line is near — never a replacement for alignment.
 * The rhythm family ranks just below objects: a direct edge alignment is
 * certain, continuing an inferred equal gap is a heuristic — it must never
 * beat a real alignment, only catch the "pattern" the user is dragging
 * toward.
 */
export const SNAP_FAMILY_PRIORITY: readonly SnapFamily[] = ["guide", "object", "rhythm", "grid", "pixel"];

/**
 * Selects the snap target by priority, choosing the nearest candidate within
 * tolerance inside the highest-priority family. The pen tool passes its own
 * priority (path geometry beats guides); every other tool uses the default.
 */
export const snapValue = (value: number, axis: "x" | "y", candidates: SnapCandidate[], tolerance: number, priority: readonly SnapFamily[] = SNAP_FAMILY_PRIORITY, gridTolerance = tolerance): SnapDecision => {
  for (const family of priority) {
    let best: SnapCandidate | undefined;
    for (const candidate of candidates) {
      if (candidate.family !== family || candidate.axis !== axis) continue;
      if (Math.abs(candidate.value - value) > (family === "grid" ? gridTolerance : tolerance)) continue;
      if (!best || Math.abs(candidate.value - value) < Math.abs(best.value - value)) best = candidate;
    }
    if (best) return { value: best.value, snapped: best };
  }
  return { value, snapped: undefined };
};

export interface SnapAxisOptions {
  axis: "x" | "y";
  value: number;
  zoom: number;
  /** Host-driven rendered grid opacity for this interaction frame. Grid
   * candidates are ineligible at exactly zero. */
  gridOpacity?: number;
  snap: SnapSettings;
  grid?: GridDescriptor;
  guides?: GuideRecord[];
  objectPositions?: number[];
  /** The per-object edge triples — the rhythm family's input (one outer
   *  edge per object). */
  objectGroups?: number[][];
  magnetPositions?: number[];
}

/**
 * Kernel snap service. Only VISIBLE targets participate: an invisible grid or
 * guide never snaps — snapping to something the user cannot see feels sticky and
 * unpredictable (the authored settings gate each family independently, but
 * visibility is the final gate). Tolerance is screen-space
 * (SNAP_TOLERANCE_SCREEN_PX / zoom — the 10–15 px design-tool proximity band).
 */
export const snapAxis = (options: SnapAxisOptions): SnapDecision => {
  const tolerance = SNAP_TOLERANCE_SCREEN_PX / Math.max(Number.EPSILON, options.zoom);
  const candidates: SnapCandidate[] = [];
  if (options.snap.pixel) {
    const step = options.grid && options.grid.majorSpacing > 0 ? gridStepForZoom(options.grid, options.zoom) : 1;
    const origin = options.axis === "x" ? options.grid?.originX ?? 0 : options.grid?.originY ?? 0;
    candidates.push({ family: "pixel", axis: options.axis, value: Math.round((options.value - origin) / step) * step + origin });
  }
  if (options.snap.guides) {
    for (const guide of options.guides ?? []) if (guide.visible && guide.axis === options.axis) candidates.push({ family: "guide", axis: options.axis, value: guide.position });
    for (const position of options.magnetPositions ?? []) candidates.push({ family: "guide", axis: options.axis, value: position });
  }
  if (options.snap.objects) for (const position of options.objectPositions ?? []) candidates.push({ family: "object", axis: options.axis, value: position });
  // The rhythm family: the pattern detector reads one edge PER OBJECT (the
  // left/top edge of each group), sorts them, and every consecutive pair
  // defines a gap — the "continue the spacing" target is that gap extended
  // beyond each pair's far edge. Using only the outer edge keeps a single
  // object's own dimensions from masquerading as a rhythm. The tolerance
  // filter downstream keeps only the near targets. Part of the object
  // family's spirit: when objects are off, rhythm is off.
  if (options.snap.objects && (options.objectGroups?.length ?? 0) >= 2) {
    const outerEdges = (options.objectGroups ?? [])
      .map((group) => group[0])
      .filter((value): value is number => Number.isFinite(value));
    const sorted = [...new Set(outerEdges)].sort((left, right) => left - right);
    for (let index = 0; index + 1 < sorted.length; index += 1) {
      const gap = sorted[index + 1]! - sorted[index]!;
      if (!Number.isFinite(gap) || gap <= 0) continue;
      candidates.push({ family: "rhythm", axis: options.axis, value: sorted[index + 1]! + gap });
      candidates.push({ family: "rhythm", axis: options.axis, value: sorted[index]! - gap });
    }
  }
  let gridTolerance = tolerance;
  if (options.snap.grid && options.grid && options.grid.majorSpacing > 0 && (options.gridOpacity ?? 0) > 0 && isZoomDrivenGridDisplayed(options, options.grid)) {
    const step = gridStepForZoom(options.grid, options.zoom);
    gridTolerance = gridCaptureRadius(options.zoom, step);
    const origin = options.axis === "x" ? options.grid.originX : options.grid.originY;
    const nearest = Math.round((options.value - origin) / step) * step + origin;
    candidates.push({ family: "grid", axis: options.axis, value: nearest });
  }
  return snapValue(options.value, options.axis, candidates, tolerance, SNAP_FAMILY_PRIORITY, gridTolerance);
};
