import type { PathFillRule, PathGeometry, PathPoint, SubpathId } from "./document.js";
import {
  ORDER_KEY_STEP,
  computePathBounds,
  cubicAt,
  cubicCubicIntersections,
  flattenSubpathWithBackdata,
  orderKeyForSigned,
  pointsOfSubpath,
  segmentControlPoints,
  type Cubic,
  type FlattenedEdge,
  type Point2,
} from "./path-geometry.js";

/**
 * The boolean engine (the `vector-editing` change, section 4): the
 * Inkscape-reference pipeline — exact curve intersections → flatten with
 * backdata → combine with winding numbers vs per-operand fill rule → re-emit
 * the ORIGINAL curve fragments between cuts. Results keep bezier pieces,
 * never pure polylines.
 *
 * The combine is split-then-classify, not a Bentley–Ottmann sweep: compute
 * all pairwise intersections, split every segment at every cut, classify each
 * resulting edge by the selected region's status on its two sides, and trace
 * the surviving boundary with the region on the left. A sweepline is the
 * measured optimisation for large inputs, not the v1 (the same topology
 * grid the sweep would use is already here: coordinates are quantized to
 * 1/512 of the operands' union extent — the published robustness strategy,
 * features below the grid resolution are unstable by design).
 *
 * Preconditions gate entry (closed, ≥ 2 operands, area-enclosing — "if it
 * doesn't fill it won't work"): failures are diagnostic codes, never silent
 * no-ops or geometry repair.
 */

export type BooleanOperation = "union" | "intersect" | "subtract" | "exclude";

export interface BooleanOperand {
  /** The authored geometry in its pinned form (min corner at (0,0)). */
  geometry: PathGeometry;
  /** The world placement of the geometry (the node's `bounds.x/y`). */
  placement: { x: number; y: number };
}

export interface BooleanResult {
  /** The merged geometry, pinned (min corner at (0,0)) — the caller carries the placement. */
  geometry: PathGeometry;
  /** Where the result sits in world coordinates: its own bbox minimum corner. */
  placement: { x: number; y: number };
}

/** The topology grid: 1/512 of the operands' union extent (Inkscape's published constant). */
export const BOOLEAN_TOPOLOGY_DIVISIONS = 512 as const;
/** Classification samples sit one grid unit off the edge. */
const SAMPLE_OFFSET_GRID_UNITS = 1 as const;
/** The topology phase flattens at one grid unit per edge, so flattened vertices
 *  stay roughly one cell apart and the quantized vertex keys do not collapse. */
const TOPOLOGY_FLATTEN_GRID_UNITS = 1 as const;
/** Winding tests flatten at a quarter grid unit so the ray cast stays accurate
 *  well within the sample offset. */
const WINDING_FLATTEN_GRID_FRACTION = 1 / 4;
/** Intersection positions are resolved to a sixteenth of a grid unit. */
const INTERSECTION_EPSILON_GRID_FRACTION = 1 / 16;
/** A subpath whose flattened signed area is below this encloses "no area" (VECTOR_BOOLEAN_NO_AREA). */
export const BOOLEAN_NO_AREA_EPS = 1e-6 as const;
/** A re-emitted fragment whose control points are within this of the chord is a straight edge (corner point). */
const LINEAR_FRAGMENT_EPS = 1e-9 as const;

interface WorldOperand {
  geometry: PathGeometry;
  fillRule: PathFillRule;
  subpaths: Array<{
    id: SubpathId;
    ordered: PathPoint[];
    /** The fine edges used for winding tests. */
    windingEdges: FlattenedEdge[];
    /** The coarse edges used for the topology phase (fragment construction). */
    edges: FlattenedEdge[];
  }>;
}

interface Fragment {
  operand: number;
  subpathId: string;
  segmentIndex: number;
  tStart: number;
  tEnd: number;
  startKey: string;
  endKey: string;
  start: Point2;
  end: Point2;
  /** Whether the selected region is on the left when traversing start → end (kept fragments only). */
  insideLeft: boolean;
}

interface VertexEntry { fragment: number; angle: number; }
interface Vertex { position: Point2; entries: VertexEntry[]; }
interface Walk { fragments: number[]; vertices: string[]; }

const lerp = (a: Point2, b: Point2, t: number): Point2 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

const splitCubic = (cubic: Cubic, t: number): [Cubic, Cubic] => {
  const [p0, c1, c2, p1] = cubic;
  const e1 = lerp(p0, c1, t);
  const e2 = lerp(c1, c2, t);
  const e3 = lerp(c2, p1, t);
  const f1 = lerp(e1, e2, t);
  const f2 = lerp(e2, e3, t);
  const m = lerp(f1, f2, t);
  return [[p0, e1, f1, m], [m, f2, e3, p1]];
};

/** The original curve's fragment between t1 and t2 (de Casteljau, exact parameter re-mapping). */
const cubicFragment = (cubic: Cubic, t1: number, t2: number): Cubic => {
  let current = cubic;
  if (t1 > 0) current = splitCubic(current, t1)[1]!;
  if (t2 < 1) current = splitCubic(current, (t2 - t1) / (1 - t1))[0]!;
  return current;
};

const worldify = (operand: BooleanOperand): PathGeometry => {
  const { geometry, placement } = operand;
  if (placement.x === 0 && placement.y === 0) return geometry;
  const points: Record<string, PathPoint> = {};
  for (const [id, point] of Object.entries(geometry.points)) {
    points[id] = { ...point, x: point.x + placement.x, y: point.y + placement.y };
  }
  return { ...geometry, points };
};

const quantizeKey = (point: Point2, grid: number): string => `${Math.round(point.x / grid)}:${Math.round(point.y / grid)}`;

const quantizePoint = (point: Point2, grid: number): Point2 => ({ x: Math.round(point.x / grid) * grid + 0, y: Math.round(point.y / grid) * grid + 0 });

const signedArea = (edges: FlattenedEdge[]): number => {
  let area = 0;
  for (const edge of edges) area += edge.a.x * edge.b.y - edge.b.x * edge.a.y;
  return area / 2;
};

const assertBooleanPreconditions = (operands: BooleanOperand[], flattenTolerance: number): void => {
  if (operands.length < 2) throw new Error("VECTOR_BOOLEAN_MIN_OPERANDS");
  for (const operand of operands) {
    for (const [subpathId, subpath] of Object.entries(operand.geometry.subpaths)) {
      if (!subpath.closed) throw new Error("VECTOR_BOOLEAN_OPEN_SUBPATH");
      const area = Math.abs(signedArea(flattenSubpathWithBackdata(operand.geometry, subpathId, flattenTolerance)));
      if (area < BOOLEAN_NO_AREA_EPS) throw new Error("VECTOR_BOOLEAN_NO_AREA");
    }
  }
};

/**
 * The signed winding number of one subpath at a point: a directional ray cast
 * over the flattened edges — +1 for upward crossings, −1 for downward.
 * Nonzero fill is winding ≠ 0; the even-odd path is parity of |winding|.
 */
const windingOfEdges = (edges: FlattenedEdge[], point: Point2): number => {
  let winding = 0;
  for (const edge of edges) {
    if ((edge.a.y > point.y) !== (edge.b.y > point.y)) {
      const xAt = ((edge.b.x - edge.a.x) * (point.y - edge.a.y)) / (edge.b.y - edge.a.y) + edge.a.x;
      if (point.x < xAt) winding += edge.b.y > edge.a.y ? -1 : 1;
    }
  }
  return winding;
};

/**
 * The signed winding number of one subpath at a point (the engine's
 * per-operand winding primitive, exported for hit testing and tests).
 */
export const windingNumberAt = (geometry: PathGeometry, subpathId: string, point: Point2, tolerance = 1e-3): number =>
  windingOfEdges(flattenSubpathWithBackdata(geometry, subpathId, tolerance), point);

/** Per-operand containment, honoring the operand's own fill rule (nonzero: Σ winding ≠ 0; even-odd: parity of |Σ| winding |). */
const insideOperand = (operand: WorldOperand, point: Point2): boolean => {
  let winding = 0;
  for (const subpath of operand.subpaths) {
    const value = windingOfEdges(subpath.windingEdges, point);
    winding += operand.fillRule === "evenodd" ? Math.abs(value) : value;
  }
  return operand.fillRule === "evenodd" ? winding % 2 === 1 : winding !== 0;
};

const select = (insides: boolean[], operation: BooleanOperation): boolean => {
  switch (operation) {
    case "union": return insides.some((value) => value);
    // Every operand contains the point — the pairwise "≥ 2" rule for the
    // two-operand case, correct for any operand count (an "≥ 2" test would
    // wrongly admit points inside two of three operands).
    case "intersect": return insides.every((value) => value);
    case "subtract": return insides[0]! && insides.slice(1).every((value) => !value);
    case "exclude": return insides.filter((value) => value).length % 2 === 1;
  }
};

const dedupeCuts = (cuts: number[], segment: Cubic, grid: number): number[] => {
  const seen = new Set<string>();
  const out: number[] = [];
  for (const t of [...cuts].sort((left, right) => left - right)) {
    if (t <= 0 || t >= 1) continue;
    const key = quantizeKey(cubicAt(segment, t), grid);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
};

const addVertex = (vertices: Map<string, Vertex>, key: string, position: Point2, fragment: number, otherEnd: Point2): void => {
  let vertex = vertices.get(key);
  if (!vertex) {
    vertex = { position: { x: position.x + 0, y: position.y + 0 }, entries: [] };
    vertices.set(key, vertex);
  }
  const angle = Math.atan2(otherEnd.y - position.y, otherEnd.x - position.x);
  vertex.entries.push({ fragment, angle: angle < 0 ? angle + Math.PI * 2 : angle });
};

/**
 * Traces the kept boundary with the selected region on the left: at each
 * vertex, the boundary continues along the first unused kept fragment
 * COUNTERCLOCKWISE from the incoming direction (the standard region tracing
 * rule — the region stays on the left of both the incoming and the outgoing
 * edge; the clockwise alternative jumps lobes and produces contours that
 * enclose non-region pockets, as the two-L-shapes exclude fixture shows).
 * Walks that cannot close (numerical degeneracy beyond the topology grid)
 * are dropped. A fragment whose quantized endpoints collapse into one grid
 * cell is not a closed loop: the walk always takes at least one step before
 * closing, so the boundary passes through such vertices like any other.
 */
const traceContours = (fragments: Fragment[], kept: boolean[], vertices: Map<string, Vertex>): Walk[] => {
  const used = new Array<boolean>(fragments.length).fill(false);
  const walks: Walk[] = [];
  for (let first = 0; first < fragments.length; first += 1) {
    if (!kept[first] || used[first]) continue;
    const startFragment = fragments[first]!;
    const startKey = startFragment.insideLeft ? startFragment.startKey : startFragment.endKey;
    let currentKey = startFragment.insideLeft ? startFragment.endKey : startFragment.startKey;
    const path = [first];
    const vertexPath = [currentKey];
    used[first] = true;
    let prev = first;
    let guard = fragments.length + 1;
    while (true) {
      if (currentKey === startKey && path.length > 1 && noCandidatesAt(vertices, currentKey, prev, used)) break;
      if (guard <= 0) break;
      guard -= 1;
      const vertex = vertices.get(currentKey);
      if (!vertex) break;
      const arriving = vertex.entries.find((entry) => entry.fragment === prev);
      if (!arriving) break;
      const incoming = (arriving.angle + Math.PI) % (Math.PI * 2);
      const next = nextEntry(vertex, incoming, arriving.fragment, used);
      if (next === undefined) break;
      path.push(next.fragment);
      used[next.fragment] = true;
      const fragment = fragments[next.fragment]!;
      currentKey = fragment.startKey === currentKey ? fragment.endKey : fragment.startKey;
      vertexPath.push(currentKey);
      prev = next.fragment;
    }
    if (currentKey === startKey && path.length > 1 && noCandidatesAt(vertices, currentKey, path[path.length - 1]!, used)) {
      walks.push({ fragments: path, vertices: vertexPath });
    }
  }
  return walks;
};

/** Whether the walk has truly completed the loop: no unused continuation remains at the start vertex. */
const noCandidatesAt = (vertices: Map<string, Vertex>, key: string, arrivingFragment: number, used: boolean[]): boolean => {
  const vertex = vertices.get(key);
  if (!vertex) return true;
  return vertex.entries.every((entry) => entry.fragment === arrivingFragment || used[entry.fragment]);
};

const nextEntry = (vertex: Vertex, incoming: number, arrivingFragment: number, used: boolean[]): VertexEntry | undefined => {
  const n = vertex.entries.length;
  // The scan starts strictly ABOVE the incoming direction: an entry exactly
  // at the incoming angle is the straight-through continuation, which is only
  // correct when no proper turn exists (it is still reachable via the wrap).
  let index = vertex.entries.findIndex((entry) => entry.angle > incoming);
  if (index === -1) index = 0;
  for (let step = 0; step < n; step += 1) {
    const entry = vertex.entries[(index + step) % n]!;
    if (entry.fragment === arrivingFragment) continue;
    if (used[entry.fragment]) continue;
    return entry;
  }
  return undefined;
};

const segmentCubicOf = (operands: WorldOperand[], fragment: Pick<Fragment, "operand" | "subpathId" | "segmentIndex">): Cubic => {
  const subpath = operands[fragment.operand]!.subpaths.find((candidate) => candidate.id === fragment.subpathId)!;
  const n = subpath.ordered.length;
  return segmentControlPoints(subpath.ordered[fragment.segmentIndex]!, subpath.ordered[(fragment.segmentIndex + 1) % n]!);
};

/**
 * The boolean combine: `booleanOperate` computes the merged `PathGeometry`
 * of the operands under `operation` in the operands' world frame, and rebases
 * the result so its bbox minimum corner is (0,0) (the pinned form — the
 * caller carries the placement). The `pointIdPrefix` keeps the fresh point
 * and subpath ids collision-free in the caller's id space.
 */
export const booleanOperate = (operands: BooleanOperand[], operation: BooleanOperation, pointIdPrefix = "boolean"): BooleanResult => {
  const worldGeometries = operands.map(worldify);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const geometry of worldGeometries) {
    const bbox = computePathBounds(geometry);
    minX = Math.min(minX, bbox.minX);
    minY = Math.min(minY, bbox.minY);
    maxX = Math.max(maxX, bbox.maxX);
    maxY = Math.max(maxY, bbox.maxY);
  }
  const extent = Math.max(maxX - minX, maxY - minY);
  const grid = extent / BOOLEAN_TOPOLOGY_DIVISIONS;
  const windingFlattenTolerance = grid * WINDING_FLATTEN_GRID_FRACTION;
  const topologyFlattenTolerance = grid * TOPOLOGY_FLATTEN_GRID_UNITS;
  const intersectionEpsilon = grid * INTERSECTION_EPSILON_GRID_FRACTION;
  assertBooleanPreconditions(operands, windingFlattenTolerance);
  const worldOperands: WorldOperand[] = worldGeometries.map((geometry) => ({
    geometry,
    fillRule: geometry.fillRule,
    subpaths: Object.keys(geometry.subpaths).map((subpathId) => ({
      id: subpathId,
      ordered: pointsOfSubpath(geometry, subpathId),
      windingEdges: flattenSubpathWithBackdata(geometry, subpathId, windingFlattenTolerance),
      edges: flattenSubpathWithBackdata(geometry, subpathId, topologyFlattenTolerance),
    })),
  }));
  // Intersections: every segment pair between different operands; each hit
  // contributes a cut parameter to both segments.
  const cutsByOperand = new Map<number, Map<string, Map<number, number[]>>>();
  for (let operand = 0; operand < worldOperands.length; operand += 1) {
    const bySubpath = new Map<string, Map<number, number[]>>();
    for (const subpath of worldOperands[operand]!.subpaths) {
      const bySegment = new Map<number, number[]>();
      for (let segment = 0; segment < subpath.ordered.length; segment += 1) bySegment.set(segment, []);
      bySubpath.set(subpath.id, bySegment);
    }
    cutsByOperand.set(operand, bySubpath);
  }
  for (let a = 0; a < worldOperands.length; a += 1) {
    for (let b = a + 1; b < worldOperands.length; b += 1) {
      const operandA = worldOperands[a]!;
      const operandB = worldOperands[b]!;
      for (const subpathA of operandA.subpaths) {
        const countA = subpathA.ordered.length;
        for (const subpathB of operandB.subpaths) {
          const countB = subpathB.ordered.length;
          for (let i = 0; i < countA; i += 1) {
            const cubicA = segmentControlPoints(subpathA.ordered[i]!, subpathA.ordered[(i + 1) % countA]!);
            for (let k = 0; k < countB; k += 1) {
              const cubicB = segmentControlPoints(subpathB.ordered[k]!, subpathB.ordered[(k + 1) % countB]!);
              for (const hit of cubicCubicIntersections(cubicA, cubicB, intersectionEpsilon)) {
                cutsByOperand.get(a)!.get(subpathA.id)!.get(i)!.push(hit.tA);
                cutsByOperand.get(b)!.get(subpathB.id)!.get(k)!.push(hit.tB);
              }
            }
          }
        }
      }
    }
  }
  // Split every segment at its cuts and build the fragments (with backdata).
  const fragments: Fragment[] = [];
  for (let operand = 0; operand < worldOperands.length; operand += 1) {
    for (const subpath of worldOperands[operand]!.subpaths) {
      const count = subpath.ordered.length;
      const edgesBySegment: FlattenedEdge[][] = [];
      for (const edge of subpath.edges) {
        (edgesBySegment[edge.back.segmentIndex] ??= []).push(edge);
      }
      for (let segment = 0; segment < count; segment += 1) {
        const segmentCubic = segmentControlPoints(subpath.ordered[segment]!, subpath.ordered[(segment + 1) % count]!);
        const cuts = dedupeCuts(cutsByOperand.get(operand)!.get(subpath.id)!.get(segment) ?? [], segmentCubic, grid);
        for (const edge of edgesBySegment[segment] ?? []) {
          let t = edge.back.tStart;
          for (const cut of cuts) {
            if (cut <= t) continue;
            if (cut >= edge.back.tEnd) break;
            pushFragment(fragments, operand, subpath.id, segment, t, cut, segmentCubic, grid);
            t = cut;
          }
          pushFragment(fragments, operand, subpath.id, segment, t, edge.back.tEnd, segmentCubic, grid);
        }
      }
    }
  }
  // Classify: a fragment survives when the selected region differs across it.
  const kept = new Array<boolean>(fragments.length).fill(false);
  const selectAt = (point: Point2): boolean => select(worldOperands.map((operand) => insideOperand(operand, point)), operation);
  for (let i = 0; i < fragments.length; i += 1) {
    const fragment = fragments[i]!;
    const dx = fragment.end.x - fragment.start.x;
    const dy = fragment.end.y - fragment.start.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) continue;
    const midX = (fragment.start.x + fragment.end.x) / 2;
    const midY = (fragment.start.y + fragment.end.y) / 2;
    const offset = grid * SAMPLE_OFFSET_GRID_UNITS;
    const left = quantizePoint({ x: midX - (dy / length) * offset, y: midY + (dx / length) * offset }, grid);
    const right = quantizePoint({ x: midX + (dy / length) * offset, y: midY - (dx / length) * offset }, grid);
    const leftInside = selectAt(left);
    fragment.insideLeft = leftInside;
    if (leftInside !== selectAt(right)) kept[i] = true;
  }
  // Dedupe coincident kept fragments: two operands can contribute the same
  // boundary piece (identical quantized endpoints, the selected region on the
  // same world side — e.g. the ring outer edge and an identical square
  // operand). Without this the walk traces the piece twice.
  const boundarySeen = new Set<string>();
  for (let i = 0; i < fragments.length; i += 1) {
    if (!kept[i]) continue;
    const fragment = fragments[i]!;
    const key = fragment.startKey <= fragment.endKey
      ? `${fragment.startKey}|${fragment.endKey}|${fragment.insideLeft}`
      : `${fragment.endKey}|${fragment.startKey}|${!fragment.insideLeft}`;
    if (boundarySeen.has(key)) {
      kept[i] = false;
      continue;
    }
    boundarySeen.add(key);
  }
  // Build the topology vertices (quantized identity, first-writer position)
  // and trace the boundary with the selected region on the left.
  const vertices = new Map<string, Vertex>();
  for (let i = 0; i < fragments.length; i += 1) {
    if (!kept[i]) continue;
    const fragment = fragments[i]!;
    addVertex(vertices, fragment.startKey, fragment.start, i, fragment.end);
    addVertex(vertices, fragment.endKey, fragment.end, i, fragment.start);
  }
  for (const vertex of vertices.values()) {
    vertex.entries.sort((left, right) => left.angle - right.angle || left.fragment - right.fragment);
  }
  const walks = traceContours(fragments, kept, vertices);
  // Re-emit: each run of contiguous surviving fragments from the same
  // original segment merges back into ONE cubic fragment between the run's
  // extreme cut parameters — results keep bezier pieces, seams dedupe.
  const points: Record<string, PathPoint> = {};
  const subpaths: Record<string, { id: string; closed: boolean }> = {};
  let pointIndex = 0;
  let contourIndex = 0;
  interface Run {
    operand: number;
    subpathId: string;
    segmentIndex: number;
    tMin: number;
    tMax: number;
    startVertex: string;
    endVertex: string;
  }
  for (const walk of walks) {
    const runs: Run[] = [];
    for (let i = 0; i < walk.fragments.length; i += 1) {
      const fragment = fragments[walk.fragments[i]!]!;
      const runStart = i === 0 ? (fragment.insideLeft ? fragment.startKey : fragment.endKey) : walk.vertices[i - 1]!;
      const runEnd = walk.vertices[i]!;
      const last = runs[runs.length - 1];
      if (last && last.operand === fragment.operand && last.subpathId === fragment.subpathId && last.segmentIndex === fragment.segmentIndex) {
        last.tMin = Math.min(last.tMin, fragment.tStart, fragment.tEnd);
        last.tMax = Math.max(last.tMax, fragment.tStart, fragment.tEnd);
        last.endVertex = runEnd;
      } else {
        runs.push({ operand: fragment.operand, subpathId: fragment.subpathId, segmentIndex: fragment.segmentIndex, tMin: Math.min(fragment.tStart, fragment.tEnd), tMax: Math.max(fragment.tStart, fragment.tEnd), startVertex: runStart, endVertex: runEnd });
      }
    }
    if (runs.length < 2) continue;
    const subpathId = `${pointIdPrefix}-s${contourIndex}`;
    const contour: PathPoint[] = [];
    for (let r = 0; r < runs.length; r += 1) {
      const run = runs[r]!;
      const prevRun = runs[(r - 1 + runs.length) % runs.length]!;
      const position = vertices.get(run.startVertex)!.position;
      // The re-emitted cubic is computed from the MERGED t-range — the run
      // spans the whole surviving fragment chain of the original segment.
      const runCubic = cubicFragment(segmentCubicOf(worldOperands, run), run.tMin, run.tMax);
      const prevCubic = cubicFragment(segmentCubicOf(worldOperands, prevRun), prevRun.tMin, prevRun.tMax);
      const handleOut = { dx: runCubic[1]!.x - runCubic[0]!.x + 0, dy: runCubic[1]!.y - runCubic[0]!.y + 0 };
      const handleIn = { dx: prevCubic[2]!.x - prevCubic[3]!.x + 0, dy: prevCubic[2]!.y - prevCubic[3]!.y + 0 };
      const order = orderKeyForSigned(contour.length * ORDER_KEY_STEP);
      const point: PathPoint = isLinearFragment(runCubic) && isLinearFragment(prevCubic)
        ? { id: `${pointIdPrefix}-p${pointIndex}`, subpathId, order, x: position.x, y: position.y, handleMode: "corner" }
        : { id: `${pointIdPrefix}-p${pointIndex}`, subpathId, order, x: position.x, y: position.y, handleMode: "free", handleIn, handleOut };
      pointIndex += 1;
      contour.push(point);
    }
    for (const point of contour) points[point.id] = point;
    subpaths[subpathId] = { id: subpathId, closed: true };
    contourIndex += 1;
  }
  // Rebasing: contours are traced with the selected region consistently on
  // the left, so outer contours and holes are oppositely oriented and the
  // nonzero fill rule renders holes as holes — the result is always nonzero.
  const geometry: PathGeometry = { points, subpaths, fillRule: "nonzero" };
  const bbox = computePathBounds(geometry);
  if (bbox.minX !== 0 || bbox.minY !== 0) {
    for (const point of Object.values(points)) {
      point.x -= bbox.minX;
      point.y -= bbox.minY;
    }
  }
  return { geometry, placement: { x: bbox.minX + 0, y: bbox.minY + 0 } };
};

/** Whether a re-emitted fragment is a straight edge: its inner control points
 *  lie on the chord (a de Casteljau split of a degenerate linear cubic has
 *  control points off the endpoints, so handle deltas alone cannot detect it). */
const isLinearFragment = (cubic: Cubic): boolean => {
  const [a, c1, c2, b] = cubic;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const scale = Math.max(1, Math.hypot(dx, dy));
  const offChord1 = Math.abs((c1.x - a.x) * dy - (c1.y - a.y) * dx);
  const offChord2 = Math.abs((c2.x - b.x) * dy - (c2.y - b.y) * dx);
  return offChord1 < LINEAR_FRAGMENT_EPS * scale && offChord2 < LINEAR_FRAGMENT_EPS * scale;
};

const pushFragment = (fragments: Fragment[], operand: number, subpathId: string, segmentIndex: number, tStart: number, tEnd: number, cubic: Cubic, grid: number): void => {
  if (tEnd - tStart <= 0) return;
  const start = cubicAt(cubic, tStart);
  const end = cubicAt(cubic, tEnd);
  fragments.push({
    operand, subpathId, segmentIndex, tStart, tEnd,
    start, end,
    startKey: quantizeKey(start, grid),
    endKey: quantizeKey(end, grid),
    insideLeft: false,
  });
};
