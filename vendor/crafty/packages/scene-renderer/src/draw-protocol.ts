import type { Bounds, Transform2D } from "@crafty/scene-model";
import type { Viewport } from "./index.js";

export const DRAW_PROTOCOL_V1 = 1 as const;
export const DRAW_PROTOCOL_V2 = 2 as const;
export const DRAW_PROTOCOL_V3 = 3 as const;
export const DRAW_PROTOCOL_V4 = 4 as const;
export const DRAW_PROTOCOL_V5 = 5 as const;
export const DRAW_PROTOCOL_VERSION = 5 as const;
export type DrawGeometry = "rect" | "path" | "text";
export type RenderPacketKind = "full" | "batch";

export interface DrawCommand {
  geometry: DrawGeometry;
  nodeId: string;
  bounds: Bounds;
  transform: Transform2D;
  fill: [number, number, number, number];
  opacity: number;
  zIndex: number;
  order: number;
  path?: DrawPathGeometry;
  fillRule?: DrawFillRule;
  stroke?: DrawStrokeDescriptor;
  /** Corner radius, in the command's local units (clamped to the half
   *  extents by the encoder). Authored on rounded rects; chrome overlays use
   *  it for circle indicators (radius = half the minor axis). */
  cornerRadius?: number;
  /** Protocol v5 text: the string to draw. The encoder tessellates glyphs
   *  from its embedded font — the packet never carries outlines. */
  text?: string;
  /** The text's size in local units (the box height). */
  fontSize?: number;
}

export type DrawFillRule = "nonzero" | "evenodd";
export type DrawPathHandleMode = "corner" | "free" | "asymmetric" | "mirrored";
export type DrawLineCap = "butt" | "round" | "square";
export type DrawLineJoin = "miter" | "round" | "bevel";

export interface DrawPathHandle {
  dx: number;
  dy: number;
}

/**
 * Protocol v3 path geometry: node-local point records with cubic handles and
 * subpath closure, mirroring the authored vocabulary the kernel validates.
 * Kernel-neutral — declared structurally here so the WASM host can consume it
 * without importing the editor kernel (the overlay packet above sets the
 * precedent). `handleMode` mirrors the authored modes; `mirrored` stores only
 * `handleOut` and `corner` stores neither, exactly as authored.
 */
export interface DrawPathPoint {
  id: string;
  subpathId: string;
  order: string;
  x: number;
  y: number;
  handleMode: DrawPathHandleMode;
  handleIn?: DrawPathHandle;
  handleOut?: DrawPathHandle;
}

export interface DrawPathSubpath {
  id: string;
  closed: boolean;
}

export interface DrawPathGeometry {
  points: Record<string, DrawPathPoint>;
  subpaths: Record<string, DrawPathSubpath>;
}

/**
 * Optional stroke descriptor on a path command. A path without one renders
 * filled only, so consumers never invent stroke state that was not encoded.
 */
export interface DrawStrokeDescriptor {
  width: number;
  caps: DrawLineCap;
  joins: DrawLineJoin;
  dash: number[];
}

/**
 * Additive protocol v2 delta carried by a render packet. `changedNodeIds`
 * lists every re-encoded node; consumers replace retained commands for those
 * ids (and drop retained entries whose id is absent from the batch commands).
 */
export interface SceneDelta {
  changedNodeIds: string[];
}

/**
 * Optional overlay packet (additive over v2, consumed by the host in a later
 * task): grid/guide render data projected from the kernel's page-canvas
 * records. Kernel-neutral — defined by its own structural types so the WASM
 * host can consume it without importing the editor kernel. Overlays never
 * mutate authored packets.
 */
export interface DrawOverlayLine {
  axis: "x" | "y";
  position: number;
  weight: "minor" | "major";
  /** 0..1 draw opacity (1 at rest) — the level cross-fade lowers it. */
  alpha?: number;
}

export interface DrawOverlayDot {
  x: number;
  y: number;
  weight: "minor" | "major";
  /** 0..1 draw opacity, shared with overlay lines. */
  alpha?: number;
}

export interface DrawOverlayGrid {
  mode: "lines" | "dots";
  level: number;
  minorStep: number;
  majorStep: number;
  lines: DrawOverlayLine[];
  dots?: DrawOverlayDot[];
  /** Origin axes. Weight-carrying like every line record: the module's
   *  OverlayLine requires it (axes without weight dropped every frame while
   *  the grid origin was on-screen — the decode mismatch this field fixes). */
  axes?: DrawOverlayLine[];
}

export interface DrawOverlayGuide {
  id: string;
  axis: "x" | "y";
  position: number;
  visible: boolean;
}

export interface DrawOverlayPacket {
  grid?: DrawOverlayGrid;
  guides?: DrawOverlayGuide[];
}

/**
 * Protocol v4 glass surface: a rect-geometry node whose fill samples the
 * frame's already-rendered scene content, blurred to `blurRadius` (authored
 * world units; the module converts to device pixels via `zoom × pixelRatio`),
 * tinted, saturation-adjusted and refraction-offset. Kernel-neutral, declared
 * structurally here so the WASM host consumes it without importing the editor
 * kernel (the overlay packet precedent). The surface is drawn by the module's
 * composite pass — it is never part of the scene encoding — so it carries its
 * own world `bounds`/`transform` and explicit `(zIndex, order)`, matching the
 * scene's draw-sequence keys.
 */
export interface DrawGlassSurface {
  nodeId: string;
  bounds: Bounds;
  transform: Transform2D;
  blurRadius: number;
  tint: [number, number, number, number];
  saturation: number;
  refraction: number;
  opacity: number;
  zIndex: number;
  order: number;
  /** Budget degradation: `true` draws the surface as plain tint — visible
   *  and ordered, never vanished. Marked by the host past the budget cap. */
  flat?: boolean;
}

/** The glass surface budget per frame. Surfaces beyond the cap stay in the
 *  packet but render as flat tint (the host's explicit degradation, the
 *  overlay budget precedent); the module mirrors this with its own hard cap. */
export const MAX_GLASS_SURFACES = 64 as const;

/**
 * Protocol v5 chrome glass surface: a screen-anchored glass surface for the
 * floating chrome. `bounds` are canvas-relative CSS px — the vertex shader
 * maps them straight to device px via `pixelRatio`, no world affine — and the
 * pill's corner `radius` and spring-integrated `scaleX`/`scaleY` squash are
 * host-side state. `pressed`/`hovered` (0..1, host-integrated from DOM
 * listeners) lift the glass opacity and specular. The module's chrome
 * fragment applies the light model; the authored-glass path (no `screen`)
 * is untouched. Chrome surfaces composite after the overlay blit, sampling
 * the scene-only pyramid — grid and selection stay sharp through chrome v1
 * (the recorded fidelity gap; the second-pyramid fix is the triggered
 * follow-up). Chrome surfaces carry chrome keys, never document ids.
 */
export interface DrawChromeGlassSurface {
  id: string;
  bounds: Bounds;
  radius: number;
  scaleX: number;
  scaleY: number;
  pressed: number;
  hovered: number;
  /** Budget degradation: `true` draws the surface as plain tint — visible
   *  and ordered, never vanished. Marked by the host past the budget cap. */
  flat?: boolean;
}

/** The chrome glass budget per frame: 16 surfaces, host-capped first; past
 *  the cap chrome surfaces draw flat tint — visible and ordered, never
 *  vanishing. The module mirrors the cap defensively. */
export const MAX_CHROME_GLASS_SURFACES = 16 as const;

export interface RenderFrame {
  protocolVersion: number;
  frameId: string;
  viewport: Viewport & { width: number; height: number; pixelRatio: number };
  commands: DrawCommand[];
  glassSurfaces?: DrawGlassSurface[];
  chromeGlass?: DrawChromeGlassSurface[];
  selectionBounds?: Bounds;
  documentRevision?: number;
  packetRevision?: number;
  /** Protocol v5 makes full-vs-delta explicit. Older packets omit this field. */
  packetKind?: RenderPacketKind;
  changedNodeIds?: string[];
  dirtyRegion?: Bounds;
  overlay?: DrawOverlayPacket;
}

export const isSupportedDrawProtocolVersion = (version: number): boolean =>
  version === DRAW_PROTOCOL_V1 ||
  version === DRAW_PROTOCOL_V2 ||
  version === DRAW_PROTOCOL_V3 ||
  version === DRAW_PROTOCOL_V4 ||
  version === DRAW_PROTOCOL_VERSION;
