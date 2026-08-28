import type {
  DrawCommand,
  DrawPathGeometry,
  DrawPathPoint,
  DrawStrokeDescriptor,
  RenderFrame,
} from "@crafty/scene-renderer";
import { createComparisonFixtures } from "./renderer-comparison-fixtures.js";

/**
 * The committed fixture set for encode-level parity (openspec change
 * vector-path-rendering, tasks 7.1–7.2). Generated code, never stored blobs
 * (`docs/architecture/testing.md`): every fixture is built here from its
 * parameters, and every fixture name MUST have a recorded reference in
 * `parity-references.ts` — the harness fails loudly when one is missing.
 *
 * The three rect fixtures are reused from `renderer-comparison-fixtures.ts`
 * (the fixture source section 6 kept when the TypeGPU comparison host
 * retired); the fourth is the bezier/self-intersecting figure from
 * `tests/vello-prototype.rs` expressed in the authored packet vocabulary
 * (`DrawPathPoint` records with cubic handles, per-subpath closure, fill
 * rule, optional stroke — the packet mirrors the kernel's path model
 * structurally, draw-protocol.ts).
 */
export const PARITY_FIXTURE_NAMES = [
  "representative",
  "translucent",
  "ten-thousand-rectangles",
  "bezier-self-intersecting",
] as const;

export type ParityFixtureName = (typeof PARITY_FIXTURE_NAMES)[number];

/** The deterministic encode evidence the module's `encode_frame` returns. */
export interface EncodeEvidence {
  bytes: number;
  fingerprint: string;
  paths: number;
  segments: number;
}

// The cubic-circle constant of tests/vello-prototype.rs
// `overlapping_circle_figure`, carried over verbatim so the figure's curves
// are byte-identical between the prototype and this fixture.
const K = 0.552_284_749_830_793_6;

const point = (
  id: string,
  subpathId: string,
  order: string,
  x: number,
  y: number,
  handleIn: { dx: number; dy: number },
  handleOut: { dx: number; dy: number },
): DrawPathPoint => ({
  id,
  subpathId,
  order,
  x,
  y,
  handleMode: "free",
  handleIn,
  handleOut,
});

/**
 * One closed subpath of the overlapping-circle figure: four points with the
 * exact endpoints and control points of the prototype's four `curve_to`
 * calls, translated into the authored point+handle model (segment control
 * points are point + handle delta, exactly as `segmentControlPoints`
 * computes them). The figure's overlap lens has winding number 2, so
 * nonzero fills it and evenodd cuts a hole — the canonical fill-rule
 * witness (vello-vector-rasterization.md §5).
 */
const circlePoints = (cx: number, cy: number, r: number, subpathId: string): DrawPathPoint[] => [
  point(`${subpathId}-e`, subpathId, "00000000", cx + r, cy, { dx: 0, dy: K * r }, { dx: 0, dy: -K * r }),
  point(`${subpathId}-nw`, subpathId, "00000001", cx - r, cy - r, { dx: r * (1 + K), dy: 0 }, { dx: r * (1 - K), dy: 0 }),
  point(`${subpathId}-w`, subpathId, "00000002", cx - r, cy, { dx: 0, dy: -K * r }, { dx: 0, dy: K * r }),
  point(`${subpathId}-se`, subpathId, "00000003", cx + r, cy + r, { dx: -r * (1 + K), dy: 0 }, { dx: -r * (1 - K), dy: 0 }),
];

const CIRCLE_CENTERS = [[120, 100], [180, 100]] as const;

const overlappingCircles = (): DrawPathGeometry => {
  const points: Record<string, DrawPathPoint> = {};
  const subpaths: Record<string, { id: string; closed: boolean }> = {};
  for (const [index, [cx, cy]] of CIRCLE_CENTERS.entries()) {
    const subpathId = index === 0 ? "circle-a" : "circle-b";
    for (const p of circlePoints(cx, cy, 45, subpathId)) points[p.id] = p;
    subpaths[subpathId] = { id: subpathId, closed: true };
  }
  return { points, subpaths };
};

/** An open two-point arc with free handles, for the stroke descriptor. */
const strokeArc = (): DrawPathGeometry => ({
  points: {
    "arc-a": point("arc-a", "arc", "00000000", 40, 60, { dx: 0, dy: 0 }, { dx: 30, dy: -20 }),
    "arc-b": point("arc-b", "arc", "00000001", 120, 60, { dx: -30, dy: -20 }, { dx: 0, dy: 0 }),
  },
  subpaths: { arc: { id: "arc", closed: false } },
});

const pathCommand = (
  nodeId: string,
  zIndex: number,
  order: number,
  fill: [number, number, number, number],
  geometry: DrawPathGeometry,
  fillRule: "nonzero" | "evenodd",
  stroke?: DrawStrokeDescriptor,
): DrawCommand => ({
  geometry: "path",
  nodeId,
  bounds: { x: 0, y: 0, width: 300, height: 200 },
  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  fill,
  opacity: fill[3],
  zIndex,
  order,
  path: geometry,
  fillRule,
  ...(stroke ? { stroke } : {}),
});

/**
 * The bezier/self-intersecting mixed packet: the overlapping-circle figure
 * under both fill rules, one stroked open path, and one rect — paths and
 * rects coexist in one encoding, exactly as protocol v3 promises. The
 * viewport matches the prototype's 300×200 figure target.
 */
export const createBezierSelfIntersectingFrame = (): RenderFrame => ({
  protocolVersion: 3,
  frameId: "bezier-self-intersecting",
  viewport: { panX: 0, panY: 0, zoom: 1, width: 300, height: 200, pixelRatio: 1 },
  documentRevision: 1,
  packetRevision: 1,
  commands: [
    pathCommand("figure-nonzero", 0, 1, [0, 0.5, 1, 1], overlappingCircles(), "nonzero"),
    pathCommand("figure-evenodd", 1, 1, [0, 0.5, 1, 1], overlappingCircles(), "evenodd"),
    pathCommand("stroke-arc", 2, 1, [1, 0.2, 0.1, 1], strokeArc(), "nonzero", {
      width: 4,
      caps: "round",
      joins: "round",
      dash: [],
    }),
    {
      geometry: "rect",
      nodeId: "rect-baseline",
      bounds: { x: 200, y: 140, width: 60, height: 40 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      fill: [0.2, 0.8, 0.3, 1],
      opacity: 1,
      zIndex: 3,
      order: 1,
    },
  ],
});

/**
 * The parity fixtures as v3 packets. The rect fixtures are the historical
 * comparison frames re-stamped v3 (the harness tests the v3 pipeline; the
 * packet's protocol version does not reach the encoder's streams).
 */
export const createParityFixtures = (): Record<ParityFixtureName, RenderFrame> => {
  const comparison = createComparisonFixtures();
  return {
    representative: {
      ...comparison.representative,
      protocolVersion: 3,
      documentRevision: 1,
      packetRevision: 1,
    },
    translucent: {
      ...comparison.translucent,
      protocolVersion: 3,
      documentRevision: 1,
      packetRevision: 1,
    },
    "ten-thousand-rectangles": {
      ...comparison.tenThousandRectangles,
      protocolVersion: 3,
      documentRevision: 1,
      packetRevision: 1,
    },
    "bezier-self-intersecting": createBezierSelfIntersectingFrame(),
  };
};
