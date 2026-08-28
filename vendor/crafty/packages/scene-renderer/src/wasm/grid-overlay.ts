import type { Bounds } from "@crafty/scene-model";
import type { DrawCommand, RenderFrame } from "../index.js";

/**
 * Host-side grid/guide overlay builder, kernel-neutral: it consumes the
 * optional `overlay` packet carried by a render frame and produces rect draw
 * commands that compose at the host boundary AFTER authored commands. Authored
 * packets are never mutated (the composition pattern mirrors `withOverlays`).
 *
 * Consumption contract (documented in `docs/architecture/renderer.md`):
 * - `overlay.grid.lines` are the kernel `gridPlan` minor/major lines (already
 *   LOD-resolved to [6, 32] screen px at every zoom — the ladder's
  *   nice-number world steps halve per octave past 400%, so the LOD grid owns
 *   every zoom; there is no pixel grid); the host re-culls them in screen
 *   space.
 * - `overlay.grid.dots` are the kernel dot-mode dots (bounded host-side).
 * - `overlay.guides` are authored position lines; hidden guides draw nothing.
 *
 * Budget: line commands (grid + guides combined) are capped at
 * MAX_GRID_OVERLAY_LINES per frame, dots at MAX_GRID_OVERLAY_DOTS. When the
 * shared line budget is exceeded, commands are dropped in priority order:
 * minor lines, then major lines, then grid axes, then guides (guides survive
 * longest).
 */

export const MAX_GRID_OVERLAY_LINES = 2000 as const;
export const MAX_GRID_OVERLAY_DOTS = 2000 as const;
export const OVERLAY_CULL_MARGIN_PX = 2 as const;
const GRID_MINOR_COLOR: [number, number, number, number] = [0.58, 0.58, 0.66, 0.06];
const GRID_MAJOR_COLOR: [number, number, number, number] = [0.58, 0.58, 0.66, 0.12];
const GRID_AXIS_COLOR: [number, number, number, number] = [0.58, 0.58, 0.66, 0.12];
const GRID_DOT_MINOR_COLOR: [number, number, number, number] = [0.58, 0.58, 0.66, 0.16];
const GRID_DOT_MAJOR_COLOR: [number, number, number, number] = [0.58, 0.58, 0.66, 0.4];
const GUIDE_COLOR: [number, number, number, number] = [0.93, 0.4, 0.38, 0.95];

export interface GridOverlayBuildResult {
  readonly commands: DrawCommand[];
  readonly lineCount: number;
  readonly dotCount: number;
  readonly capped: boolean;
}

const identityTransform: DrawCommand["transform"] = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

const overlayCommand = (
  nodeId: string,
  bounds: Bounds,
  fill: [number, number, number, number],
  order: number,
): DrawCommand => ({
  geometry: "rect",
  nodeId,
  bounds,
  transform: identityTransform,
  fill,
  opacity: 1,
  zIndex: Number.MAX_SAFE_INTEGER,
  order,
});

const screenXOf = (worldX: number, viewport: RenderFrame["viewport"]): number => worldX * viewport.zoom + viewport.panX;
const screenYOf = (worldY: number, viewport: RenderFrame["viewport"]): number => worldY * viewport.zoom + viewport.panY;

const worldSpanX = (viewport: RenderFrame["viewport"]): number => viewport.width / viewport.zoom;
const worldSpanY = (viewport: RenderFrame["viewport"]): number => viewport.height / viewport.zoom;
const worldMinX = (viewport: RenderFrame["viewport"]): number => -viewport.panX / viewport.zoom;
const worldMinY = (viewport: RenderFrame["viewport"]): number => -viewport.panY / viewport.zoom;

const cullScreenX = (screenX: number, viewport: RenderFrame["viewport"]): boolean =>
  screenX < -OVERLAY_CULL_MARGIN_PX || screenX > viewport.width + OVERLAY_CULL_MARGIN_PX;

const cullScreenY = (screenY: number, viewport: RenderFrame["viewport"]): boolean =>
  screenY < -OVERLAY_CULL_MARGIN_PX || screenY > viewport.height + OVERLAY_CULL_MARGIN_PX;

/**
 * A vertical line at world position `p` (axis "x") or horizontal line (axis
 * "y"), as a rect of `thicknessPx` screen px spanning the visible viewport.
 * Returns undefined when the line is culled off-screen.
 *
 * ZOOM-SAFE: the rect is solved BACK from a device-pixel-snapped span, so the
 * line lands on exact physical pixels at every zoom, pan and DPR — a
 * fractional device position would rasterize soft and shimmer while panning
 * (measured: at pan 3.7 / DPR 2 a "1px" line spanned device px [22.40,
 * 24.40]). The device span is `deviceThickness` whole pixels wide, and the
 * world rect is the exact inverse of the encoder's root affine
 * (device = (world × zoom + pan) × pixelRatio), so the encoder's projection
 * reproduces the snapped integers bit-for-bit.
 */
const lineCommand = (
  axis: "x" | "y",
  position: number,
  thicknessPx: number,
  nodeId: string,
  fill: [number, number, number, number],
  viewport: RenderFrame["viewport"],
): DrawCommand | undefined => {
  if (!Number.isFinite(position)) return undefined;
  const { zoom, pixelRatio, panX, panY } = viewport;
  if (axis === "x") {
    const screenX = screenXOf(position, viewport);
    if (cullScreenX(screenX, viewport)) return undefined;
    const deviceCenter = (position * zoom + panX) * pixelRatio;
    const deviceThickness = Math.max(1, Math.round(thicknessPx * pixelRatio));
    const deviceStart = Math.round(deviceCenter) - Math.floor(deviceThickness / 2);
    const worldStart = (deviceStart / pixelRatio - panX) / zoom;
    return overlayCommand(
      nodeId,
      { x: worldStart, y: worldMinY(viewport), width: deviceThickness / (pixelRatio * zoom), height: worldSpanY(viewport) },
      fill,
      0,
    );
  }
  const screenY = screenYOf(position, viewport);
  if (cullScreenY(screenY, viewport)) return undefined;
  const deviceCenter = (position * zoom + panY) * pixelRatio;
  const deviceThickness = Math.max(1, Math.round(thicknessPx * pixelRatio));
  const deviceStart = Math.round(deviceCenter) - Math.floor(deviceThickness / 2);
  const worldStart = (deviceStart / pixelRatio - panY) / zoom;
  return overlayCommand(
    nodeId,
    { x: worldMinX(viewport), y: worldStart, width: worldSpanX(viewport), height: deviceThickness / (pixelRatio * zoom) },
    fill,
    0,
  );
};

const dotCommand = (
  x: number,
  y: number,
  major: boolean,
  alpha: number,
  nodeId: string,
  viewport: RenderFrame["viewport"],
): DrawCommand | undefined => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  const { zoom, pixelRatio, panX, panY } = viewport;
  const sizePx = major ? 3 : 2;
  const screenX = screenXOf(x, viewport);
  const screenY = screenYOf(y, viewport);
  if (screenX < -sizePx / 2 || screenX > viewport.width + sizePx / 2 || screenY < -sizePx / 2 || screenY > viewport.height + sizePx / 2) return undefined;
  // Same zoom-safe discipline as the lines: an integer device-size square
  // anchored at a whole device pixel — crisp at any pan/zoom/DPR. Odd
  // sizes drift the centre by half a pixel (unavoidable, invisible), they
  // never rasterize soft.
  const deviceSize = Math.max(1, Math.round(sizePx * pixelRatio));
  const deviceX = Math.round((x * zoom + panX) * pixelRatio);
  const deviceY = Math.round((y * zoom + panY) * pixelRatio);
  const deviceStartX = deviceX - Math.floor(deviceSize / 2);
  const deviceStartY = deviceY - Math.floor(deviceSize / 2);
  const worldX = (deviceStartX / pixelRatio - panX) / zoom;
  const worldY = (deviceStartY / pixelRatio - panY) / zoom;
  const size = deviceSize / (pixelRatio * zoom);
  const base = major ? GRID_DOT_MAJOR_COLOR : GRID_DOT_MINOR_COLOR;
  return overlayCommand(nodeId, { x: worldX, y: worldY, width: size, height: size }, [base[0], base[1], base[2], base[3] * alpha], 0);
};

const guideCommands = (frame: RenderFrame): DrawCommand[] => {
  const { guides } = frame.overlay ?? {};
  const viewport = frame.viewport;
  if (!guides) return [];
  const commands: DrawCommand[] = [];
  for (const guide of guides) {
    if (!guide.visible) continue;
    const command = lineCommand(guide.axis, guide.position, 1.5, `guide-${guide.id}`, GUIDE_COLOR, viewport);
    if (command) commands.push(command);
  }
  return commands;
};

const gridCommands = (frame: RenderFrame): { dots: DrawCommand[]; minor: DrawCommand[]; major: DrawCommand[]; axes: DrawCommand[] } => {
  const { grid } = frame.overlay ?? {};
  const viewport = frame.viewport;
  const dots: DrawCommand[] = [];
  const minor: DrawCommand[] = [];
  const major: DrawCommand[] = [];
  const axes: DrawCommand[] = [];
  if (!grid) return { dots, minor, major, axes };

  // The LOD ladder owns every zoom: minor/major lines and dots draw
  // unconditionally — there is no pixel grid to replace them (the ladder's
  // nice-number steps hold the [6, 32] screen-px band to any zoom, so a
  // second scale would only beat against it).
  let dotIndex = 0;
  for (const dot of grid.dots ?? []) {
    if (dots.length >= MAX_GRID_OVERLAY_DOTS) break;
    const command = dotCommand(dot.x, dot.y, dot.weight === "major", dot.alpha ?? 1, `grid-dot-${dotIndex}`, viewport);
    if (command) {
      dots.push(command);
      dotIndex += 1;
    }
  }

  let minorIndex = 0;
  let majorIndex = 0;
  for (const line of grid.lines ?? []) {
    const base = line.weight === "major" ? GRID_MAJOR_COLOR : GRID_MINOR_COLOR;
    // The cross-fade: per-line alpha scales the weight colour.
    const fill: [number, number, number, number] =
      line.alpha !== undefined && line.alpha < 1
        ? [base[0], base[1], base[2], base[3] * line.alpha]
        : base;
    const command = lineCommand(line.axis, line.position, line.weight === "major" ? 1.25 : 1, line.weight === "major" ? `grid-major-${majorIndex}` : `grid-minor-${minorIndex}`, fill, viewport);
    if (!command) continue;
    if (line.weight === "major") {
      major.push(command);
      majorIndex += 1;
    } else {
      minor.push(command);
      minorIndex += 1;
    }
  }

  for (const axis of grid.axes ?? []) {
    const command = lineCommand(
      axis.axis,
      axis.position,
      2,
      `grid-axis-${axis.axis}`,
      [GRID_AXIS_COLOR[0], GRID_AXIS_COLOR[1], GRID_AXIS_COLOR[2], GRID_AXIS_COLOR[3] * (axis.alpha ?? 1)],
      viewport,
    );
    if (command) axes.push(command);
  }

  return { dots, minor, major, axes };
};

export const buildGridOverlayCommands = (frame: RenderFrame, startOrder = 0): GridOverlayBuildResult => {
  const overlay = frame.overlay;
  if (!overlay) return { commands: [], lineCount: 0, dotCount: 0, capped: false };
  const { zoom, width, height } = frame.viewport;
  if (!Number.isFinite(zoom) || zoom <= 0 || !Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return { commands: [], lineCount: 0, dotCount: 0, capped: false };
  }

  const { dots, minor, major, axes } = gridCommands(frame);
  const guides = guideCommands(frame);

  const minorLines = minor;
  const majorLines = major;
  const totalCandidates = minorLines.length + majorLines.length + axes.length + guides.length;

  // The shared line budget, dropped in priority order: minor, major, axes,
  // guides (guides survive longest).
  let budget = MAX_GRID_OVERLAY_LINES;
  const take = (commands: readonly DrawCommand[]): DrawCommand[] => {
    if (budget <= 0) return [];
    const kept = commands.slice(0, budget);
    budget -= kept.length;
    return kept;
  };

  const keptMinor = take(minorLines);
  const keptMajor = take(majorLines);
  const keptAxes = take(axes);
  const keptGuides = take(guides);

  const ordered = [...dots, ...keptMinor, ...keptMajor, ...keptAxes, ...keptGuides];
  const commands = ordered.map((command, index) => ({ ...command, order: startOrder + index }));
  return {
    commands,
    lineCount: keptMinor.length + keptMajor.length + keptAxes.length + keptGuides.length,
    dotCount: dots.length,
    capped: totalCandidates > MAX_GRID_OVERLAY_LINES,
  };
};
