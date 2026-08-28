import type { OrderKey, PathGeometry, PathHandle, PathHandleMode, PathPoint } from "./document.js";

/**
 * Path geometry math, kept out of document.ts so validation stays readable
 * and the command layer has one authoritative source for derived geometry.
 *
 * Order keys: fixed-width base-62 signed integers. String comparison of a
 * fixed-width encoding over an ordered alphabet IS numeric comparison, so
 * "sort by order key" is a plain string sort, while the encoding stays an
 * involution under reversal — `reverseOrderKey` is an order-reversing
 * bijection, which makes `reverse-subpath` literally self-inverse (applied
 * twice, every key returns to its exact original value).
 *
 * The BOUNDS rule: the geometry's bounding box is pinned so its minimum
 * corner is (0,0) in node-local space; `bounds.x/y` on the node carry
 * authored placement. `computePathBounds` uses true bezier extrema (the
 * derivative solved, not the control-point hull).
 */

export const ORDER_KEY_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const ORDER_KEY_WIDTH = 8 as const;
export const ORDER_KEY_SPACE = 62 ** ORDER_KEY_WIDTH;
const ORDER_KEY_HALF = ORDER_KEY_SPACE / 2;
/**
 * Fresh points are minted with keys spaced by this step, so insertion between
 * two neighbours halves the gap each time — about 16 nested insertions at the
 * same spot before the space between a pair is genuinely exhausted, at which
 * point `orderKeyBetween` fails loudly rather than renumbering.
 */
export const ORDER_KEY_STEP = 65536 as const;

const encodeBase62 = (n: number): string => {
  let value = n;
  let out = "";
  for (let i = 0; i < ORDER_KEY_WIDTH; i += 1) {
    out = ORDER_KEY_ALPHABET[value % 62]! + out;
    value = Math.floor(value / 62);
  }
  return out;
};

const decodeBase62 = (key: string): number => {
  if (key.length !== ORDER_KEY_WIDTH) return NaN;
  let value = 0;
  for (const char of key) {
    const index = ORDER_KEY_ALPHABET.indexOf(char);
    if (index < 0) return NaN;
    value = value * 62 + index;
  }
  return value;
};

/** Encodes a signed integer in [-SPACE/2, SPACE/2 - 1]; string order = numeric order. */
export const orderKeyForSigned = (n: number): OrderKey => {
  if (!Number.isSafeInteger(n) || n < -ORDER_KEY_HALF || n >= ORDER_KEY_HALF) throw new Error("DOCUMENT_ORDER_KEY_RANGE");
  return encodeBase62(n + ORDER_KEY_HALF);
};

/** Decodes an order key to its signed integer; NaN when the key is not a valid encoding. */
export const orderKeyToSigned = (key: string): number => {
  const value = decodeBase62(key);
  if (!Number.isSafeInteger(value)) return NaN;
  return value - ORDER_KEY_HALF;
};

/** Strictly between two keys (requires left < right); insertion never renumbers anything. */
export const orderKeyBetween = (left: OrderKey, right: OrderKey): OrderKey => {
  const a = decodeBase62(left);
  const b = decodeBase62(right);
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a >= b) throw new Error("DOCUMENT_ORDER_KEY_ORDER");
  const mid = a + Math.floor((b - a) / 2);
  if (mid <= a || mid >= b) throw new Error("DOCUMENT_ORDER_KEY_SPACE_EXHAUSTED");
  return encodeBase62(mid);
};

/** Involutive, order-reversing bijection: R(R(k)) === k, and k1 < k2 implies R(k1) > R(k2). */
export const reverseOrderKey = (key: OrderKey): OrderKey => {
  const value = decodeBase62(key);
  if (!Number.isSafeInteger(value)) throw new Error("DOCUMENT_ORDER_KEY_INVALID");
  return encodeBase62(ORDER_KEY_SPACE - 1 - value);
};

export const isValidOrderKey = (key: string): boolean => Number.isSafeInteger(decodeBase62(key));

/** The points of one subpath, in order-key order. Membership is the point's own subpathId. */
export const pointsOfSubpath = (geometry: PathGeometry, subpathId: string): PathPoint[] =>
  Object.values(geometry.points)
    .filter((point) => point.subpathId === subpathId)
    .sort((left, right) => (left.order < right.order ? -1 : left.order > right.order ? 1 : 0));

export interface Point2 { x: number; y: number; }
export type Cubic = [Point2, Point2, Point2, Point2];
interface Delta { dx: number; dy: number; }

const scale = (direction: Point2, length: number): Delta => ({
  // `+ 0` normalizes -0 to 0 — a zero component must equal zero (Object.is
  // distinguishes -0 from 0, and serialized determinism demands one of them).
  dx: direction.x * length + 0,
  dy: direction.y * length + 0,
});
const normalize = (value: Point2): Point2 => {
  const length = Math.hypot(value.x, value.y);
  return length > 0 ? { x: value.x / length, y: value.y / length } : { x: 0, y: 0 };
};
const distance = (a: Point2, b: Point2): number => Math.hypot(b.x - a.x, b.y - a.y);

const handleOut = (point: PathPoint): Delta | undefined => {
  if (point.handleMode === "corner") return undefined;
  return point.handleOut;
};

const handleIn = (point: PathPoint): Delta | undefined => {
  if (point.handleMode === "corner") return undefined;
  if (point.handleMode === "mirrored") {
    const out = point.handleOut;
    return out ? { dx: -out.dx, dy: -out.dy } : undefined;
  }
  return point.handleIn;
};

/** Cubic control points for the segment p0 → p1; a segment with no handles is linear (degenerate cubic). */
export const segmentControlPoints = (p0: PathPoint, p1: PathPoint): Cubic => {
  const out = handleOut(p0);
  const inn = handleIn(p1);
  return [
    { x: p0.x, y: p0.y },
    { x: p0.x + (out?.dx ?? 0), y: p0.y + (out?.dy ?? 0) },
    { x: p1.x + (inn?.dx ?? 0), y: p1.y + (inn?.dy ?? 0) },
    { x: p1.x, y: p1.y },
  ];
};

/** Evaluates the cubic at parameter t. */
export const cubicAt = (cubic: Cubic, t: number): Point2 => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  const [p0, c1, c2, p1] = cubic;
  return {
    x: a * p0.x + b * c1.x + c * c2.x + d * p1.x,
    y: a * p0.y + b * c1.y + c * c2.y + d * p1.y,
  };
};

/** Cubic extrema on one axis: roots of the derivative (3a t² + 2b t + c) within (0,1). */
const cubicExtremaT = ([p0, c1, c2, p1]: [Point2, Point2, Point2, Point2], axis: "x" | "y"): number[] => {
  const p = [p0[axis], c1[axis], c2[axis], p1[axis]] as const;
  // Power-basis coefficients of the cubic: y(t) = d + c t + b t² + a t³
  const a = -p[0]! + 3 * p[1]! - 3 * p[2]! + p[3]!;
  const b = 3 * p[0]! - 6 * p[1]! + 3 * p[2]!;
  const c = -3 * p[0]! + 3 * p[1]!;
  const roots: number[] = [];
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) roots.push(-c / (2 * b));
  } else {
    const discriminant = b * b - 3 * a * c;
    if (discriminant >= 0) {
      const sqrt = Math.sqrt(discriminant);
      roots.push((-b + sqrt) / (3 * a), (-b - sqrt) / (3 * a));
    }
  }
  return roots.filter((t) => t > 0 && t < 1);
};

/**
 * The tight bounding box of the geometry in node-local space, computed from
 * true bezier extrema. The result's minimum corner is (0,0) when the
 * geometry is in its canonical pinned form; callers that move points past an
 * edge must rebase. Returns a zero box at the origin for empty geometry.
 */
export const computePathBounds = (geometry: PathGeometry): { minX: number; minY: number; maxX: number; maxY: number } => {
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  let first = true;
  for (const subpath of Object.values(geometry.subpaths)) {
    const ordered = pointsOfSubpath(geometry, subpath.id);
    const count = ordered.length;
    for (let i = 0; i < count; i += 1) {
      const p0 = ordered[i]!;
      const p1 = ordered[(i + 1) % count]!;
      if (i === count - 1 && !subpath.closed) break;
      const cubic = segmentControlPoints(p0, p1);
      const samples: number[] = [0, 1, ...cubicExtremaT(cubic, "x"), ...cubicExtremaT(cubic, "y")];
      for (const t of samples) {
        const point = cubicAt(cubic, t);
        if (first) {
          minX = point.x; maxX = point.x; minY = point.y; maxY = point.y;
          first = false;
        } else {
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
          minY = Math.min(minY, point.y);
          maxY = Math.max(maxY, point.y);
        }
      }
    }
  }
  return { minX, minY, maxX, maxY };
};

export interface CubicSplit {
  point: Point2;
  prevHandleOut: Delta;
  nextHandleIn: Delta;
  /** The new anchor's own post-split handles, anchor-relative — `f1 − m` and
   *  `f2 − m` from the de Casteljau split (the end control of the first half
   *  and the start control of the second). The caller chooses the mode. */
  pointHandleIn: Delta;
  pointHandleOut: Delta;
}

/**
 * De Casteljau split of the segment p0 → p1 at parameter t. Returns the new
 * anchor (a point on the curve) and the post-split tangent deltas for the two
 * neighbours, anchor-relative exactly like authored handles. The new point's
 * own handle deltas are `pointHandleIn`/`pointHandleOut` — the caller chooses
 * the mode.
 */
export const splitSegment = (p0: PathPoint, p1: PathPoint, t: number): CubicSplit => {
  if (!(t > 0 && t < 1)) throw new Error("DOCUMENT_SPLIT_PARAMETER");
  const [a, b, c, d] = segmentControlPoints(p0, p1);
  const e1 = lerp(a, b, t);
  const e2 = lerp(b, c, t);
  const e3 = lerp(c, d, t);
  const f1 = lerp(e1, e2, t);
  const f2 = lerp(e2, e3, t);
  const m = lerp(f1, f2, t);
  return {
    point: m,
    prevHandleOut: { dx: e1.x - a.x, dy: e1.y - a.y },
    nextHandleIn: { dx: e3.x - d.x, dy: e3.y - d.y },
    pointHandleIn: { dx: f1.x - m.x, dy: f1.y - m.y },
    pointHandleOut: { dx: f2.x - m.x, dy: f2.y - m.y },
  };
};

const lerp = (a: Point2, b: Point2, t: number): Point2 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/**
 * The closed auto-handle derivation (the vector-editing change): an auto
 * point's handles lie on the chord through its neighbours — direction
 * outward from the point along the neighbour chord (FontForge's
 * secant-tangent), length one third of the adjacent segment (the Inkscape
 * rule, research `docs/research/vector-editing.md`). Endpoints derive from
 * the single neighbour chord; a point with no neighbour derives no handles
 * (unreachable — subpaths require at least two points). Pure and
 * deterministic: the same inputs always derive the same handles.
 */
export const deriveAutoHandle = (
  point: PathPoint,
  prev: PathPoint | undefined,
  next: PathPoint | undefined,
): { handleIn?: PathHandle; handleOut?: PathHandle } => {
  if (prev && next) {
    const direction = normalize({ x: next.x - prev.x, y: next.y - prev.y });
    return {
      handleOut: scale(direction, distance(point, next) / 3),
      handleIn: scale(direction, -distance(point, prev) / 3),
    };
  }
  if (next) {
    const direction = normalize({ x: next.x - point.x, y: next.y - point.y });
    return { handleOut: scale(direction, distance(point, next) / 3) };
  }
  if (prev) {
    const direction = normalize({ x: prev.x - point.x, y: prev.y - point.y });
    return { handleIn: scale(direction, distance(point, prev) / 3) };
  }
  return {};
};

/**
 * The point-type conversion matrix (the vector-editing change): the
 * deterministic target handles for converting `point` to `mode`, derived
 * from its neighbours when needed. Crafty's corner stores NO handles (the
 * no-handle state, Sketch's "straight"): conversions INTO corner discard
 * handles (invertible at the command level, never lossless), conversions
 * OUT of corner derive them from the adjacent segments (chord direction,
 * one third of the adjacent segment length). `auto` stores none; `mirrored`
 * stores only the outgoing (its incoming is derived as the negation, the
 * kernel's invariant). The demote rule (auto → any other mode) materializes
 * the derived handles first, then applies the target rule.
 */
export const convertPointType = (
  point: PathPoint,
  prev: PathPoint | undefined,
  next: PathPoint | undefined,
  mode: PathHandleMode,
): { handleIn?: PathHandle; handleOut?: PathHandle } => {
  const derived = deriveAutoHandle(point, prev, next);
  switch (mode) {
    case "auto":
    case "corner":
      return {};
    case "mirrored": {
      // The kernel's mirrored stores only the outgoing handle; the incoming
      // is derived as its negation, so lengths are equal by construction.
      const out = point.handleOut ?? derived.handleOut;
      return out ? { handleOut: out } : {};
    }
    case "asymmetric":
    case "free": {
      // The constraint (collinear for asymmetric, none for free) applies at
      // edit time, never at conversion. Corner and auto derive both handles
      // from the adjacent segments; mirrored materializes its derived
      // incoming (the negation invariant) so the curve survives the mode
      // change; other modes pass their stored handles through.
      const handleIn = point.handleMode === "auto" || point.handleMode === "corner"
        ? derived.handleIn
        : point.handleMode === "mirrored" && point.handleOut
          ? { dx: -point.handleOut.dx + 0, dy: -point.handleOut.dy + 0 }
          : point.handleIn;
      const handleOut = point.handleMode === "auto" || point.handleMode === "corner"
        ? derived.handleOut
        : point.handleOut;
      return {
        ...(handleIn !== undefined ? { handleIn } : {}),
        ...(handleOut !== undefined ? { handleOut } : {}),
      };
    }
  }
};

/**
 * The handle-drag constraint grammar (the vector-editing change, from the
 * research: Krita's command-enforced constraints, Inkscape's modifier
 * grammar). The point's mode is the base constraint; the keys override or
 * refine it. Applied at the mutation boundary — the document stores intent,
 * the drag semantics live here.
 *
 * - base `mirrored` / shift: the other handle mirrors the dragged one
 *   (equal length, exact opposite);
 * - base `asymmetric`: the other handle projects onto the dragged line
 *   keeping its own length (collinear, opposite side);
 * - base `free`/`corner`: the other handle is untouched;
 * - alt: the dragged handle keeps its length, only its angle follows;
 * - ctrl: the dragged handle's direction snaps to 45° multiples.
 */
export const constrainHandleDrag = (
  point: PathPoint,
  handle: "in" | "out",
  delta: PathHandle,
  keys: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean },
): { handleIn?: PathHandle; handleOut?: PathHandle } => {
  const current = handle === "out" ? point.handleOut ?? { dx: 0, dy: 0 } : point.handleIn ?? { dx: 0, dy: 0 };
  let moved: PathHandle = { dx: current.dx + delta.dx + 0, dy: current.dy + delta.dy + 0 };
  if (keys.altKey) {
    const length = Math.hypot(current.dx, current.dy);
    moved = scale(normalize({ x: moved.dx, y: moved.dy }), length);
  }
  if (keys.ctrlKey) {
    const length = Math.hypot(moved.dx, moved.dy);
    const snapped = Math.round(Math.atan2(moved.dy, moved.dx) / (Math.PI / 4)) * (Math.PI / 4);
    moved = { dx: Math.cos(snapped) * length + 0, dy: Math.sin(snapped) * length + 0 };
  }
  const mirror = keys.shiftKey || point.handleMode === "mirrored";
  if (handle === "out") {
    const other = mirror
      ? { dx: -moved.dx + 0, dy: -moved.dy + 0 }
      : point.handleMode === "asymmetric" && point.handleIn
        ? collinearWith(point.handleIn, moved)
        : point.handleIn;
    return { handleOut: moved, ...(other !== undefined ? { handleIn: other } : {}) };
  }
  const other = mirror
    ? { dx: -moved.dx + 0, dy: -moved.dy + 0 }
    : point.handleMode === "asymmetric" && point.handleOut
      ? collinearWith(point.handleOut, moved)
      : point.handleOut;
  return { handleIn: moved, ...(other !== undefined ? { handleOut: other } : {}) };
};

/** `other` projected onto the line through the moved handle, keeping its own
 *  length, on the opposite side — the collinear (G1) constraint. */
const collinearWith = (other: PathHandle, moved: PathHandle): PathHandle =>
  scale(normalize({ x: moved.dx, y: moved.dy }), -Math.hypot(other.dx, other.dy));

/**
 * The resolved geometry projection (the vector-editing change): materializes
 * auto points' derived handles without touching authored state. The result
 * is disposable — consumed by the renderer packet, hit testing and the
 * editing overlays; never validated as a document, never written back.
 * Returns the input unchanged when no auto point exists.
 */
export const resolveAutoHandles = (geometry: PathGeometry): PathGeometry => {
  const hasAuto = Object.values(geometry.points).some((point) => point.handleMode === "auto");
  if (!hasAuto) return geometry;
  const points: Record<string, PathPoint> = {};
  for (const subpath of Object.values(geometry.subpaths)) {
    const ordered = pointsOfSubpath(geometry, subpath.id);
    for (let i = 0; i < ordered.length; i += 1) {
      const point = ordered[i]!;
      if (point.handleMode !== "auto") {
        points[point.id] = point;
        continue;
      }
      const hasPrev = subpath.closed || i > 0;
      const hasNext = subpath.closed || i < ordered.length - 1;
      const prev = ordered[(i - 1 + ordered.length) % ordered.length]!;
      const next = ordered[(i + 1) % ordered.length]!;
      const derived = deriveAutoHandle(point, hasPrev ? prev : undefined, hasNext ? next : undefined);
      points[point.id] = {
        ...point,
        // The materialized handles are collinear by construction — the
        // resolved mode is `asymmetric`, which is what the renderer packet
        // vocabulary knows; the document keeps the authored `auto`.
        handleMode: "asymmetric",
        ...(derived.handleIn !== undefined ? { handleIn: derived.handleIn } : {}),
        ...(derived.handleOut !== undefined ? { handleOut: derived.handleOut } : {}),
      };
    }
  }
  return { ...geometry, points };
};

/**
 * Provenance of one flattened edge: which segment of which subpath it came
 * from, and the parameter range of the original cubic it spans. The boolean
 * engine uses it to re-emit the original curve fragments between cuts.
 */
export interface EdgeBackdata {
  subpathId: string;
  segmentIndex: number;
  tStart: number;
  tEnd: number;
}

/** One flattened edge: the chord endpoints plus its provenance. */
export interface FlattenedEdge { a: Point2; b: Point2; back: EdgeBackdata; }

/**
 * Flattens one subpath into edges WITH backdata (closed subpaths include the
 * closing segment). The recursive de Casteljau flattening carries the
 * parameter range of the original cubic down the recursion, so every emitted
 * edge knows exactly which curve fragment it approximates.
 */
export const flattenSubpathWithBackdata = (geometry: PathGeometry, subpathId: string, tolerance: number): FlattenedEdge[] => {
  const ordered = pointsOfSubpath(geometry, subpathId);
  const subpath = geometry.subpaths[subpathId];
  if (!subpath || ordered.length < 2) return [];
  return flattenCubicChainWithBackdata(ordered, subpath.closed, tolerance);
};

const flattenCubicChainWithBackdata = (ordered: PathPoint[], closed: boolean, tolerance: number): FlattenedEdge[] => {
  const out: FlattenedEdge[] = [];
  const count = ordered.length;
  for (let i = 0; i < count; i += 1) {
    const p0 = ordered[i]!;
    const p1 = ordered[(i + 1) % count]!;
    if (i === count - 1 && !closed) break;
    flattenCubicWithBackdata(segmentControlPoints(p0, p1), tolerance, out, { subpathId: p0.subpathId, segmentIndex: i, tStart: 0, tEnd: 1 });
  }
  return out;
};

const flattenCubicWithBackdata = (cubic: Cubic, tolerance: number, out: FlattenedEdge[], back: EdgeBackdata): void => {
  const [p0, c1, c2, p1] = cubic;
  const chord = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const flatEnough = chord < tolerance || (Math.abs(c1.x - p0.x) + Math.abs(c1.y - p0.y) + Math.abs(c2.x - p1.x) + Math.abs(c2.y - p1.y)) < tolerance * 4;
  if (flatEnough) {
    out.push({ a: { x: p0.x, y: p0.y }, b: { x: p1.x, y: p1.y }, back });
    return;
  }
  const half = 0.5;
  const e1 = lerp(p0, c1, half);
  const e2 = lerp(c1, c2, half);
  const e3 = lerp(c2, p1, half);
  const f1 = lerp(e1, e2, half);
  const f2 = lerp(e2, e3, half);
  const m = lerp(f1, f2, half);
  const midT = (back.tStart + back.tEnd) / 2;
  flattenCubicWithBackdata([p0, e1, f1, m], tolerance, out, { ...back, tEnd: midT });
  flattenCubicWithBackdata([m, f2, e3, p1], tolerance, out, { ...back, tStart: midT });
};

/**
 * Flattens the geometry into polylines per subpath (closed subpaths include
 * the closing segment), for hit testing and anything that needs segments —
 * the points-only projection of the backdata flattener.
 */
export const flattenSubpath = (geometry: PathGeometry, subpathId: string, tolerance: number): Point2[][] => {
  const edges = flattenSubpathWithBackdata(geometry, subpathId, tolerance);
  if (edges.length === 0) return [];
  return [[edges[0]!.a, ...edges.map((edge) => edge.b)]];
};

export interface CubicIntersection { tA: number; tB: number; }

const cubicBBox = (cubic: Cubic): { minX: number; minY: number; maxX: number; maxY: number } => {
  let minX = Math.min(cubic[0]!.x, cubic[3]!.x);
  let maxX = Math.max(cubic[0]!.x, cubic[3]!.x);
  let minY = Math.min(cubic[0]!.y, cubic[3]!.y);
  let maxY = Math.max(cubic[0]!.y, cubic[3]!.y);
  for (const point of [cubic[1]!, cubic[2]!]) {
    minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y); maxY = Math.max(maxY, point.y);
  }
  return { minX, minY, maxX, maxY };
};

const bboxesOverlap = (a: { minX: number; minY: number; maxX: number; maxY: number }, b: { minX: number; minY: number; maxX: number; maxY: number }, slack: number): boolean =>
  a.minX - slack <= b.maxX && b.minX - slack <= a.maxX && a.minY - slack <= b.maxY && b.minY - slack <= a.maxY;

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

/** Distance of the two inner control points from the chord, scaled by the chord length. */
const chordDeviation = (cubic: Cubic): number => {
  const [p0, , , p1] = cubic;
  const chord = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  if (chord === 0) return Infinity;
  const distance = (point: Point2): number => Math.abs((p1.x - p0.x) * (point.y - p0.y) - (p1.y - p0.y) * (point.x - p0.x)) / chord;
  return Math.max(distance(cubic[1]!), distance(cubic[2]!));
};

/**
 * Exact intersection parameters of two cubic segments (the boolean engine's
 * first stage, Inkscape-style). Recursive bezier clipping: both curves are
 * subdivided until the pair's bounding boxes separate, a parameter interval
 * or box size falls below the epsilon, or a work budget runs out; a pair of
 * near-linear curves is solved in closed form instead (which also handles
 * collinear overlap exactly — the shared-edge case that recursion cannot
 * bound). Results are merged within an epsilon and sorted per segment.
 * This is deliberately pragmatic — the topology grid, not exact arithmetic,
 * is the robustness strategy.
 */
export const cubicCubicIntersections = (a: Cubic, b: Cubic, epsilon = 1e-4): CubicIntersection[] => {
  const out: CubicIntersection[] = [];
  const MAX_BUDGET = 8192;
  const MAX_DEPTH = 18;
  let budget = MAX_BUDGET;
  const recurse = (ca: Cubic, cb: Cubic, ta0: number, ta1: number, tb0: number, tb1: number, depth: number): void => {
    if (budget <= 0) return;
    budget -= 1;
    if (depth >= MAX_DEPTH) {
      out.push({ tA: (ta0 + ta1) / 2, tB: (tb0 + tb1) / 2 });
      return;
    }
    // Prune disjoint pairs before any fallback fires: the interval and size
    // stops below must only fire for pairs that still overlap.
    const ba = cubicBBox(ca);
    const bb = cubicBBox(cb);
    if (!bboxesOverlap(ba, bb, epsilon)) return;
    const deviationA = chordDeviation(ca);
    const deviationB = chordDeviation(cb);
    if (deviationA < epsilon && deviationB < epsilon) {
      // The closed-form solver returns parameters in the SUB-CURVE's local
      // space; map them back onto the original segments.
      for (const hit of collectLinearIntersections(ca, cb)) {
        out.push({ tA: cubicTAtFraction(ta0, ta1, hit.tA), tB: cubicTAtFraction(tb0, tb1, hit.tB) });
      }
      return;
    }
    if (ta1 - ta0 < 1e-4 && tb1 - tb0 < 1e-4) {
      out.push({ tA: (ta0 + ta1) / 2, tB: (tb0 + tb1) / 2 });
      return;
    }
    const size = Math.max(ba.maxX - ba.minX, ba.maxY - ba.minY, bb.maxX - bb.minX, bb.maxY - bb.minY);
    if (size < epsilon) {
      out.push({ tA: (ta0 + ta1) / 2, tB: (tb0 + tb1) / 2 });
      return;
    }
    const [a1, a2] = splitCubic(ca, 0.5);
    const [b1, b2] = splitCubic(cb, 0.5);
    const taMid = (ta0 + ta1) / 2;
    const tbMid = (tb0 + tb1) / 2;
    recurse(a1, b1, ta0, taMid, tb0, tbMid, depth + 1);
    recurse(a1, b2, ta0, taMid, tbMid, tb1, depth + 1);
    recurse(a2, b1, taMid, ta1, tb0, tbMid, depth + 1);
    recurse(a2, b2, taMid, ta1, tbMid, tb1, depth + 1);
  };
  recurse(a, b, 0, 1, 0, 1, 0);
  // Merge parameters within the epsilon of each other, then sort by tA.
  out.sort((left, right) => left.tA - right.tA || left.tB - right.tB);
  const merged: CubicIntersection[] = [];
  for (const hit of out) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(last.tA - hit.tA) < 1e-3 && Math.abs(last.tB - hit.tB) < 1e-3) continue;
    merged.push(hit);
  }
  return merged;
};

/**
 * The chord fraction of the point at parameter t on a degenerate-linear cubic
 * (all control points on the chord — what every straight segment of a corner
 * path produces): cubicAt(t) = P0 + (P1 − P0)·S(t), so the parametrization is
 * nonlinear in t and only s ∈ {0, 0.5, 1} are fixed points of S.
 */
const degenerateChordFraction = (t: number): number => 3 * t * t - 2 * t * t * t;

/**
 * The true cubic parameter of the point at sub-interval chord fraction s
 * within [t0, t1]: the de Casteljau split preserves the parameter, so a
 * degenerate segment's sub-curve has chord-fraction mapping
 * (S(t0 + w·u) − S(t0)) / (S(t1) − S(t0)) with w = t1 − t0, and the global
 * parameter is S⁻¹(S(t0) + s·ΔS), Newton-solved.
 *
 * The closed-form intersection solver works in chord fractions (a linear
 * parametrization), but the consumers split and evaluate by the CUBIC
 * parameter — a linear fraction fed straight through splits at the wrong
 * point, and the two operands' cuts never meet. That is the T-junction
 * emptiness: a crossing at the geometric quarter of a corner path sits at
 * the cubic parameter where the curve is only an eighth of the way along,
 * and the only surviving families were the ones whose crossings align with
 * the fixed points (midpoints, shared edges, containment, corner touch).
 * Newton from the linear start is exact at the fixed points (the first
 * residual is exactly zero there), so the midpoint fixtures round-trip
 * byte-identically.
 */
const cubicTAtFraction = (t0: number, t1: number, s: number): number => {
  if (s <= 0) return t0;
  if (s >= 1) return t1;
  const target = degenerateChordFraction(t0) + s * (degenerateChordFraction(t1) - degenerateChordFraction(t0));
  let t = t0 + (t1 - t0) * s;
  for (let i = 0; i < 10; i += 1) {
    const residual = degenerateChordFraction(t) - target;
    if (Math.abs(residual) <= 1e-15) break;
    t -= residual / (6 * t * (1 - t));
  }
  return t;
};

/**
 * Closed-form intersection of two near-linear cubics, in the LOCAL parameter
 * space of each sub-curve (the recursion maps the results back). Collinear
 * overlap (the shared-edge case — two rectangles touching along a side) is
 * handled exactly: the overlap interval's two endpoints are the intersections.
 */
const collectLinearIntersections = (a: Cubic, b: Cubic): CubicIntersection[] => {
  const out: CubicIntersection[] = [];
  const da = { x: a[3]!.x - a[0]!.x, y: a[3]!.y - a[0]!.y };
  const db = { x: b[3]!.x - b[0]!.x, y: b[3]!.y - b[0]!.y };
  const ab = { x: b[0]!.x - a[0]!.x, y: b[0]!.y - a[0]!.y };
  const cross = da.x * db.y - da.y * db.x;
  const scale = Math.hypot(da.x, da.y) * Math.hypot(db.x, db.y);
  if (scale === 0) return out;
  if (Math.abs(cross) < 1e-10 * scale) {
    // Parallel: collinear only when b's start lies on a's line.
    const crossCollinear = da.x * ab.y - da.y * ab.x;
    if (Math.abs(crossCollinear) >= 1e-10 * Math.hypot(da.x, da.y) * Math.hypot(ab.x, ab.y)) return out;
    const len2 = da.x * da.x + da.y * da.y;
    if (len2 === 0) return out;
    const along = (point: Point2): number => ((point.x - a[0]!.x) * da.x + (point.y - a[0]!.y) * da.y) / len2;
    const sB0 = along(b[0]!);
    const sB1 = along(b[3]!);
    const start = Math.max(0, Math.min(sB0, sB1));
    const end = Math.min(1, Math.max(sB0, sB1));
    if (start > end) return out;
    out.push({ tA: start, tB: (start - sB0) / (sB1 - sB0 || 1) });
    if (start !== end) out.push({ tA: end, tB: (end - sB0) / (sB1 - sB0 || 1) });
    return out;
  }
  const tA = (ab.x * db.y - ab.y * db.x) / cross;
  const tB = (ab.x * da.y - ab.y * da.x) / cross;
  if (tA >= -1e-9 && tA <= 1 + 1e-9 && tB >= -1e-9 && tB <= 1 + 1e-9) {
    out.push({ tA: Math.min(1, Math.max(0, tA)), tB: Math.min(1, Math.max(0, tB)) });
  }
  return out;
};

/** Even-odd ray-cast containment over flattened geometry (the fill-rule-independent default for hit testing). */
export const pointInSubpath = (geometry: PathGeometry, subpathId: string, point: Point2, tolerance: number): boolean => {
  const polylines = flattenSubpath(geometry, subpathId, tolerance);
  let inside = false;
  for (const polyline of polylines) {
    for (let i = 0; i < polyline.length - 1; i += 1) {
      const a = polyline[i]!;
      const b = polyline[i + 1]!;
      if ((a.y > point.y) !== (b.y > point.y)) {
        const xAt = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
        if (point.x < xAt) inside = !inside;
      }
    }
  }
  return inside;
};
