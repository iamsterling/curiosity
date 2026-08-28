import { WORLD_LIMIT, ZOOM_MAX, ZOOM_MIN } from "@crafty/scene-model";
import {
  createSceneSpatialIndex,
  type Bounds,
  type Scene,
} from "@crafty/scene-model";
import type { DrawCommand, DrawOverlayPacket, RenderFrame } from "./draw-protocol.js";
import {
  createWasmSceneRenderer,
  type WasmRendererRuntime,
} from "./wasm-bridge.js";
import {
  createRendererFailureState,
  diagnosticFromModuleError,
  recordRendererFailure,
  type RendererDiagnostic,
} from "./failure-policy.js";

export type {
  RendererProof,
  WasmRendererInstance,
  WasmRendererRuntime,
} from "./wasm-bridge.js";
export {
  createRendererFailureState,
  diagnosticFromModuleError,
  recordRendererFailure,
  type RendererDiagnostic,
} from "./failure-policy.js";
export type {
  DrawCommand,
  DrawFillRule,
  DrawChromeGlassSurface,
  DrawGlassSurface,
  DrawLineCap,
  DrawLineJoin,
  DrawOverlayPacket,
  DrawPathGeometry,
  DrawPathHandle,
  DrawPathHandleMode,
  DrawPathPoint,
  DrawPathSubpath,
  DrawStrokeDescriptor,
  RenderFrame,
  RenderPacketKind,
  SceneDelta,
} from "./draw-protocol.js";
export { composeRenderFrame, sceneToRenderFrame } from "./scene-packet.js";
export {
  DRAW_PROTOCOL_VERSION,
  DRAW_PROTOCOL_V1,
  DRAW_PROTOCOL_V2,
  DRAW_PROTOCOL_V3,
  MAX_CHROME_GLASS_SURFACES,
  MAX_GLASS_SURFACES,
  isSupportedDrawProtocolVersion,
} from "./draw-protocol.js";
export { WORLD_LIMIT, ZOOM_MAX, ZOOM_MIN } from "@crafty/scene-model";
import type { DrawChromeGlassSurface, DrawGlassSurface } from "./draw-protocol.js";

export interface Viewport {
  panX: number;
  panY: number;
  zoom: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface RendererCacheEvidence {
  resources: number;
  capacity: number;
}

export interface RendererResult {
  ok: boolean;
  diagnostics: Array<{
    code:
      | "CANVAS_NOT_READY"
      | "WASM_MODULE_UNAVAILABLE"
      | "WASM_MODULE_FAILED"
      | "WASM_RENDER_FAILED"
      | "WEBGPU_DEVICE_LOST"
      | "STALE_REVISION"
      | "VELLO_ENCODE_FAILED"
      | "VELLO_RENDER_FAILED"
      | "GLASS_SURFACES_CAPPED"
      | "CHROME_GLASS_SURFACES_CAPPED";
    message: string;
  }>;
  selectionBounds?: Bounds;
  evidence?: RendererEvidence;
}

export interface RendererEvidence {
  backend: "webgpu";
  protocolVersion: number;
  commandCount: number;
  documentRevision?: number;
  packetRevision?: number;
  cache?: RendererCacheEvidence;
}

export interface SceneRenderer {
  backend: "wasm" | "unavailable";
  render(
    scene: Scene,
    frameId: string,
    viewport: Viewport,
    selectedLayerId?: string,
    previewBounds?: Bounds,
    options?: {
      documentRevision?: number;
      requestSequence?: number;
      overlay?: DrawOverlayPacket;
      glassSurfaces?: DrawGlassSurface[];
      /** Chrome glass surfaces: the floating chrome's pills, screen-anchored
       *  in canvas-relative CSS px, drawn by the module's composite after
       *  the overlay blit (host-measured + spring-integrated per frame). */
      chromeGlass?: DrawChromeGlassSurface[];
      /** Authored path commands the Scene cannot carry (protocol v3). The
       *  host appends them to the frame's command list; the module re-sorts
       *  by `(zIndex, order)`, so they interleave with the rect layers. */
      pathCommands?: DrawCommand[];
      /** Ephemeral editing overlays (grippies, pen preview, rubber band) —
       *  host-composed renderer state, folded above the preview overlays,
       *  never authored geometry. */
      overlayCommands?: DrawCommand[];
    },
  ): RendererResult;
  renderFrame(frame: RenderFrame): RendererResult;
  dispose(): void;
}

export const defaultViewport = (): Viewport => ({
  panX: 80,
  panY: 50,
  zoom: 0.82,
});

export const worldToScreen = (
  point: ScreenPoint,
  viewport: Viewport,
): ScreenPoint => ({
  x: point.x * viewport.zoom + viewport.panX,
  y: point.y * viewport.zoom + viewport.panY,
});
export const screenToWorld = (
  point: ScreenPoint,
  viewport: Viewport,
): ScreenPoint => ({
  x: (point.x - viewport.panX) / viewport.zoom,
  y: (point.y - viewport.panY) / viewport.zoom,
});

export const zoomAt = (
  viewport: Viewport,
  point: ScreenPoint,
  factor: number,
): Viewport => {
  const safeFactor = Number.isFinite(factor)
    ? Math.min(4, Math.max(0.25, factor))
    : 1;
  const world = screenToWorld(point, viewport);
  const zoom = Math.min(
    ZOOM_MAX,
    Math.max(ZOOM_MIN, viewport.zoom * safeFactor),
  );
  const panX = Math.min(
    WORLD_LIMIT,
    Math.max(-WORLD_LIMIT, point.x - world.x * zoom),
  );
  const panY = Math.min(
    WORLD_LIMIT,
    Math.max(-WORLD_LIMIT, point.y - world.y * zoom),
  );
  return { ...viewport, zoom, panX, panY };
};

/**
 * Absolute zoom: set the viewport zoom to exactly `zoom` (clamped to the same
 * [ZOOM_MIN, ZOOM_MAX] window) while keeping the world point under `point`
 * anchored. The per-step factor clamp in `zoomAt` makes presets like 25% ->
 * 100% unreachable through relative zooming; this is the one authoritative
 * implementation of an absolute zoom.
 */
export const zoomTo = (
  viewport: Viewport,
  point: ScreenPoint,
  zoom: number,
): Viewport => {
  const target = Number.isFinite(zoom)
    ? Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom))
    : viewport.zoom;
  const world = screenToWorld(point, viewport);
  const panX = Math.min(
    WORLD_LIMIT,
    Math.max(-WORLD_LIMIT, point.x - world.x * target),
  );
  const panY = Math.min(
    WORLD_LIMIT,
    Math.max(-WORLD_LIMIT, point.y - world.y * target),
  );
  return { ...viewport, zoom: target, panX, panY };
};

export const normalizeBounds = (
  start: ScreenPoint,
  end: ScreenPoint,
): Bounds => ({
  x: Math.min(start.x, end.x),
  y: Math.min(start.y, end.y),
  width: Math.abs(end.x - start.x),
  height: Math.abs(end.y - start.y),
});
export const hasMinimumBounds = (bounds: Bounds, minimumSize = 1): boolean =>
  bounds.width >= minimumSize && bounds.height >= minimumSize;

export const hitTestScene = (
  scene: Scene,
  frameId: string,
  screenPoint: ScreenPoint,
  viewport: Viewport,
): string | undefined =>
  createSceneSpatialIndex(scene, frameId).query(
    screenToWorld(screenPoint, viewport),
  );

const unavailableRenderer = (): SceneRenderer => ({
  backend: "unavailable",
  render() {
    return {
      ok: false,
      diagnostics: [
        {
          code: "WASM_MODULE_UNAVAILABLE",
          message:
            "The WASM renderer is unavailable; no fallback renderer is permitted.",
        },
      ],
    };
  },
  renderFrame() {
    return {
      ok: false,
      diagnostics: [
        {
          code: "WASM_MODULE_UNAVAILABLE",
          message:
            "The WASM renderer is unavailable; no fallback renderer is permitted.",
        },
      ],
    };
  },
  dispose() {
    return undefined;
  },
});

export const createSceneRenderer = (
  canvas: HTMLCanvasElement,
  options: { wasmRuntime?: WasmRendererRuntime } = {},
): SceneRenderer =>
  options.wasmRuntime
    ? createWasmSceneRenderer(canvas, options.wasmRuntime)
    : unavailableRenderer();
