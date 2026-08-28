import {
  canonicalSceneBytes,
  type Bounds,
  type Layer,
  type Scene,
  type Transform2D,
} from "@crafty/scene-model";
import { chromeGlassSurfaceError, glassSurfaceError } from "./failure-policy.js";
import {
  MAX_CHROME_GLASS_SURFACES,
  MAX_GLASS_SURFACES,
  type DrawChromeGlassSurface,
  type DrawCommand,
  type DrawGlassSurface,
  type DrawOverlayPacket,
  type RenderFrame,
  type RendererResult,
  type SceneDelta,
  type SceneRenderer,
  type Viewport,
} from "./index.js";

export interface RendererProof {
  wasm: {
    verified: true;
    exports: string[];
    memoryBytes: number;
  };
  webgpu: {
    verified: true;
    format: string;
    // The module owns the device and the surface (react-vello model): the
    // host never touches the GPU line, so verification is `init_canvas`
    // succeeding — recorded as ownership, not a host-side readback.
    device: "module-owned";
    surface: "module-owned";
  };
}

export interface WasmRendererInstance {
  setScene(sceneBytes: Uint8Array, frameId: string, deltaJson?: string): void;
  setViewport(
    viewport: Viewport,
    size: { width: number; height: number; pixelRatio: number },
  ): void;
  render(
    selectedLayerId?: string,
    previewBounds?: Bounds,
    requestSequence?: number,
    documentRevision?: number,
    overlay?: DrawOverlayPacket,
    glassSurfaces?: DrawGlassSurface[],
    chromeGlass?: DrawChromeGlassSurface[],
    pathCommands?: DrawCommand[],
    overlayCommands?: DrawCommand[],
  ): RendererResult;
  renderFrame(frame: RenderFrame): RendererResult;
  dispose(): void;
}

export interface WasmRendererRuntime {
  proof: RendererProof;
  resolveLayout?: (inputJson: string) => string;
  create(canvas: HTMLCanvasElement): WasmRendererInstance;
  /**
   * The device-loss recovery path: re-runs the module's `init_canvas` on the
   * SAME RendererCore (the module's documented recovery) so the runtime and
   * its error relay stay authoritative. The previous device is retained
   * module-side, never dropped — wgpu's wasm backend cannot unregister the
   * browser-side error listeners, and a dropped closure slot throws
   * wasm-bindgen's "closure invoked recursively or after being dropped" when
   * the browser fires a late event on the old device (wasm-bindgen#3294).
   * Resolves when the new device is ready; rejects with the module's
   * structured init error string.
   */
  recover(): Promise<void>;
}

const layoutSize = (
  canvas: HTMLCanvasElement,
): { width: number; height: number } | undefined => {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.clientWidth;
  const height = rect.height || canvas.clientHeight;
  return width > 0 && height > 0 ? { width, height } : undefined;
};

const boundsEqual = (left: Bounds, right: Bounds): boolean =>
  left.x === right.x &&
  left.y === right.y &&
  left.width === right.width &&
  left.height === right.height;

const transformEqual = (left: Transform2D, right: Transform2D): boolean =>
  left.a === right.a &&
  left.b === right.b &&
  left.c === right.c &&
  left.d === right.d &&
  left.e === right.e &&
  left.f === right.f;

const layerFieldsChanged = (left: Layer, right: Layer): boolean =>
  left.name !== right.name ||
  left.type !== right.type ||
  left.fill !== right.fill ||
  left.stroke !== right.stroke ||
  left.opacity !== right.opacity ||
  left.cornerRadius !== right.cornerRadius ||
  left.visible !== right.visible ||
  left.zIndex !== right.zIndex ||
  left.text !== right.text ||
  !boundsEqual(left.bounds, right.bounds) ||
  !transformEqual(left.transform, right.transform);

const subtreeChanged = (left: Layer, right: Layer): boolean => {
  if (layerFieldsChanged(left, right)) return true;
  const leftChildren = left.children ?? [];
  const rightChildren = right.children ?? [];
  if (leftChildren.length !== rightChildren.length) return true;
  const rightById = new Map(rightChildren.map((child) => [child.id, child]));
  for (const child of leftChildren) {
    const counterpart = rightById.get(child.id);
    if (!counterpart || subtreeChanged(child, counterpart)) return true;
  }
  return false;
};

const collectChangedLayers = (
  previous: Layer[],
  next: Layer[],
  changed: string[],
): void => {
  const previousById = new Map(previous.map((layer) => [layer.id, layer]));
  const nextById = new Map(next.map((layer) => [layer.id, layer]));
  for (const layer of next) {
    const prior = previousById.get(layer.id);
    if (!prior || subtreeChanged(prior, layer)) {
      changed.push(layer.id);
      continue;
    }
    collectChangedLayers(prior.children ?? [], layer.children ?? [], changed);
  }
  for (const layer of previous) {
    if (!nextById.has(layer.id)) changed.push(layer.id);
  }
};

/**
 * Computes the protocol v2 delta between the previous and next scene for the
 * active frame. Lists every node whose subtree changed (structural or value).
 * Returns undefined when no delta can be derived (no previous scene, unknown
 * frame, or no changes), which forces a full re-encode in the Rust encoder.
 */
export const computeSceneDelta = (
  previous: Scene | undefined,
  next: Scene,
  frameId: string,
): SceneDelta | undefined => {
  if (!previous) return undefined;
  const previousFrame = previous.frames.find((frame) => frame.id === frameId);
  const nextFrame = next.frames.find((frame) => frame.id === frameId);
  if (!previousFrame || !nextFrame) return undefined;
  const changed: string[] = [];
  if (!boundsEqual(previousFrame.bounds, nextFrame.bounds))
    changed.push(frameId);
  collectChangedLayers(previousFrame.layers, nextFrame.layers, changed);
  return changed.length > 0 ? { changedNodeIds: changed } : undefined;
};

/**
 * The glass surface budget (host-side policy, the overlay precedent). Every
 * surface past the cap stays in the packet — visible, ordered — but renders
 * as flat tint; the module mirrors the cap defensively. Malformed surfaces
 * fail the frame at the boundary (they can never reach the module).
 */
export const budgetGlassSurfaces = (
  surfaces: DrawGlassSurface[] | undefined,
): { surfaces: DrawGlassSurface[]; capped: number } => {
  if (!surfaces || surfaces.length === 0) return { surfaces: [], capped: 0 };
  for (const surface of surfaces) {
    const error = glassSurfaceError(surface);
    if (error) throw new Error(error);
  }
  const capped = Math.max(0, surfaces.length - MAX_GLASS_SURFACES);
  return {
    surfaces: surfaces.map((surface, index) =>
      index >= MAX_GLASS_SURFACES ? { ...surface, flat: true } : surface,
    ),
    capped,
  };
};

/** The chrome glass budget, the authored-surface precedent: the host caps
 *  first (16 surfaces; past the cap chrome surfaces render flat tint —
 *  visible and ordered, never vanishing) and the module mirrors the cap
 *  defensively. Malformed surfaces fail the frame at the boundary. */
export const budgetChromeGlassSurfaces = (
  surfaces: DrawChromeGlassSurface[] | undefined,
): { surfaces: DrawChromeGlassSurface[]; capped: number } => {
  if (!surfaces || surfaces.length === 0) return { surfaces: [], capped: 0 };
  for (const [index, surface] of surfaces.entries()) {
    const error = chromeGlassSurfaceError(surface, index);
    if (error) throw new Error(error);
  }
  const capped = Math.max(0, surfaces.length - MAX_CHROME_GLASS_SURFACES);
  return {
    surfaces: surfaces.map((surface, index) =>
      index >= MAX_CHROME_GLASS_SURFACES ? { ...surface, flat: true } : surface,
    ),
    capped,
  };
};

export const createWasmSceneRenderer = (
  canvas: HTMLCanvasElement,
  runtime: WasmRendererRuntime,
): SceneRenderer => {
  let instance: WasmRendererInstance | undefined;
  let initializationError: string | undefined;
  try {
    instance = runtime.create(canvas);
  } catch (error: unknown) {
    initializationError =
      error instanceof Error
        ? error.message
        : "WASM renderer initialization failed.";
  }

  let lastScene: Scene | undefined;
  let lastFrameId: string | undefined;
  let requestSequence = 0;

  return {
    backend: "wasm",
    render(scene, frameId, viewport, selectedLayerId, previewBounds, options) {
      if (initializationError || !instance)
        return {
          ok: false,
          diagnostics: [
            {
              code: "WASM_MODULE_FAILED",
              message:
                initializationError ?? "The WASM renderer did not initialize.",
            },
          ],
        };
      const size = layoutSize(canvas);
      if (!size)
        return {
          ok: false,
          diagnostics: [
            {
              code: "CANVAS_NOT_READY",
              message:
                "WASM is waiting for the canvas layout before rendering.",
            },
          ],
        };
      try {
        const ratio =
          typeof window !== "undefined" &&
          Number.isFinite(window.devicePixelRatio)
            ? Math.max(1, window.devicePixelRatio)
            : 1;
        const documentRevision = options?.documentRevision ?? scene.revision;
        const sequence = options?.requestSequence ?? ++requestSequence;
        const sceneUnchanged = lastScene === scene && lastFrameId === frameId;
        const delta = sceneUnchanged
          ? undefined
          : computeSceneDelta(lastScene, scene, frameId);
        lastScene = scene;
        lastFrameId = frameId;
        if (!sceneUnchanged)
          instance.setScene(
            canonicalSceneBytes(scene),
            frameId,
            delta ? JSON.stringify(delta) : undefined,
          );
        instance.setViewport(viewport, { ...size, pixelRatio: ratio });
        const glass = budgetGlassSurfaces(options?.glassSurfaces);
        const chrome = budgetChromeGlassSurfaces(options?.chromeGlass);
        const result = instance.render(
          selectedLayerId,
          previewBounds,
          sequence,
          documentRevision,
          options?.overlay,
          glass.surfaces,
          chrome.surfaces,
          options?.pathCommands,
          options?.overlayCommands,
        );
        if (glass.capped > 0 && result.ok) {
          result.diagnostics.push({
            code: "GLASS_SURFACES_CAPPED" as const,
            message: `The glass surface budget (${MAX_GLASS_SURFACES}) was exceeded; ${String(glass.capped)} surface(s) render as flat tint.`,
          });
        }
        if (chrome.capped > 0 && result.ok) {
          result.diagnostics.push({
            code: "CHROME_GLASS_SURFACES_CAPPED" as const,
            message: `The chrome glass budget (${MAX_CHROME_GLASS_SURFACES}) was exceeded; ${String(chrome.capped)} surface(s) render as flat tint.`,
          });
        }
        return result;
      } catch {
        return {
          ok: false,
          diagnostics: [
            {
              code: "WASM_RENDER_FAILED",
              message:
                "The WASM renderer failed safely; edit state was preserved.",
            },
          ],
        };
      }
    },
    renderFrame(frame) {
      if (initializationError || !instance)
        return {
          ok: false,
          diagnostics: [
            {
              code: "WASM_MODULE_FAILED",
              message:
                initializationError ?? "The WASM renderer did not initialize.",
            },
          ],
        };
      const size = layoutSize(canvas);
      if (!size)
        return {
          ok: false,
          diagnostics: [
            {
              code: "CANVAS_NOT_READY",
              message:
                "WASM is waiting for the canvas layout before rendering.",
            },
          ],
        };
      try {
        const glass = budgetGlassSurfaces(frame.glassSurfaces);
        const chrome = budgetChromeGlassSurfaces(frame.chromeGlass);
        const result = instance.renderFrame({
          ...frame,
          ...(glass.surfaces.length > 0 ? { glassSurfaces: glass.surfaces } : {}),
          ...(chrome.surfaces.length > 0 ? { chromeGlass: chrome.surfaces } : {}),
        });
        if (glass.capped > 0 && result.ok) {
          result.diagnostics.push({
            code: "GLASS_SURFACES_CAPPED" as const,
            message: `The glass surface budget (${MAX_GLASS_SURFACES}) was exceeded; ${String(glass.capped)} surface(s) render as flat tint.`,
          });
        }
        if (chrome.capped > 0 && result.ok) {
          result.diagnostics.push({
            code: "CHROME_GLASS_SURFACES_CAPPED" as const,
            message: `The chrome glass budget (${MAX_CHROME_GLASS_SURFACES}) was exceeded; ${String(chrome.capped)} surface(s) render as flat tint.`,
          });
        }
        return result;
      } catch {
        return {
          ok: false,
          diagnostics: [
            {
              code: "WASM_RENDER_FAILED",
              message:
                "The WASM renderer failed safely; edit state was preserved.",
            },
          ],
        };
      }
    },
    dispose() {
      instance?.dispose();
    },
  };
};
