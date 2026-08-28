import type { Bounds } from "@crafty/scene-model";
import type { RendererCore } from "../../pkg/crafty_renderer_wasm.js";
import {
  createRendererFailureState,
  diagnosticFromModuleError,
  recordRendererFailure,
  isSupportedDrawProtocolVersion,
  type DrawCommand,
  type RendererDiagnostic,
  type RenderFrame,
  type RendererResult,
  type Viewport,
  type WasmRendererRuntime,
  type WasmRendererInstance,
} from "../index.js";

const identityTransform: DrawCommand["transform"] = {
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 0,
  f: 0,
};

const appendOverlay = (
  commands: DrawCommand[],
  nodeId: string,
  bounds: Bounds,
  fill: [number, number, number, number],
  order: number,
): number => {
  commands.push({
    geometry: "rect",
    nodeId,
    bounds,
    transform: identityTransform,
    fill,
    opacity: 1,
    zIndex: Number.MAX_SAFE_INTEGER,
    order,
  });
  return order + 1;
};

const appendOutline = (
  commands: DrawCommand[],
  prefix: string,
  bounds: Bounds,
  viewport: RenderFrame["viewport"],
  color: [number, number, number, number],
  order: number,
): number => {
  const thickness = 3 / viewport.zoom;
  order = appendOverlay(
    commands,
    `${prefix}-top`,
    {
      x: bounds.x - thickness,
      y: bounds.y - thickness,
      width: bounds.width + thickness * 2,
      height: thickness,
    },
    color,
    order,
  );
  order = appendOverlay(
    commands,
    `${prefix}-bottom`,
    {
      x: bounds.x - thickness,
      y: bounds.y + bounds.height,
      width: bounds.width + thickness * 2,
      height: thickness,
    },
    color,
    order,
  );
  order = appendOverlay(
    commands,
    `${prefix}-left`,
    {
      x: bounds.x - thickness,
      y: bounds.y,
      width: thickness,
      height: bounds.height,
    },
    color,
    order,
  );
  return appendOverlay(
    commands,
    `${prefix}-right`,
    {
      x: bounds.x + bounds.width,
      y: bounds.y,
      width: thickness,
      height: bounds.height,
    },
    color,
    order,
  );
};

/**
 * Host overlay composition. The selection chrome and the grid/guide overlay
 * are now scene-encoded renderer state: the module draws them from the
 * packet's `selectionBounds` and `overlay` fields, after the authored
 * content. Only the transient preview (draft bounds / paste preview) and the
 * editing overlays have no scene concept, so they stay host-composed draw
 * commands — composition stays in the host, drawing is the module's.
 */
export const withOverlays = (
  frame: RenderFrame,
  previewBounds: Bounds | undefined,
  overlayCommands: DrawCommand[] = [],
): RenderFrame => {
  const commands = [...frame.commands];
  let order =
    commands.reduce(
      (highest, command) => Math.max(highest, command.order),
      -1,
    ) + 1;
  if (previewBounds) {
    order = appendOverlay(
      commands,
      "preview",
      previewBounds,
      [0.27, 0.29, 0.48, 1],
      order,
    );
    order = appendOutline(
      commands,
      "preview-outline",
      previewBounds,
      frame.viewport,
      [0.88, 0.78, 0.48, 1],
      order,
    );
  }
  // Editing overlays (grippies, pen preview, rubber band) draw above the
  // preview, sharing its (zIndex, order) normalization — the composer's own
  // keys are never trusted, the fold-in re-bases them like every overlay.
  for (const command of overlayCommands) {
    commands.push({ ...command, zIndex: Number.MAX_SAFE_INTEGER, order });
    order += 1;
  }
  return { ...frame, commands };
};

/**
 * Appends the authored path commands to the frame's command list. Path
 * geometry cannot travel through the legacy Scene, so the harness projects it
 * through this second channel; the module re-sorts every command by
 * `(zIndex, order)` before encoding, so the appended commands interleave
 * exactly where their invisible rect layers sit.
 */
export const withPathCommands = (
  frame: RenderFrame,
  pathCommands: DrawCommand[] | undefined,
): RenderFrame => {
  if (!pathCommands || pathCommands.length === 0) return frame;
  return { ...frame, commands: [...frame.commands, ...pathCommands] };
};

export interface ModuleErrorRelay {
  readonly deviceLost: boolean;
  readonly deviceLossMessage: string;
  receive(message: string): void;
  takePending(): RendererDiagnostic | undefined;
}

/**
 * The host side of `set_error_callback` (must be registered before
 * `init_canvas`). The module reports strings; this relay is the single place
 * those strings become vocabulary diagnostics in the host, and the policy
 * file stays the only producer of codes. Device loss is fatal state — the
 * renderer must be recreated, which is the module's documented recovery path
 * (re-running `init_canvas`). Uncaptured render errors are surfaced once on
 * the next render and retried afterwards (retry-render).
 */
export const createModuleErrorRelay = (): ModuleErrorRelay => {
  let deviceLost = false;
  let deviceLossMessage = "The WebGPU device was lost.";
  const failureState = createRendererFailureState();
  const pending: RendererDiagnostic[] = [];
  return {
    get deviceLost() {
      return deviceLost;
    },
    get deviceLossMessage() {
      return deviceLossMessage;
    },
    receive(message: string) {
      const mapped = diagnosticFromModuleError(message);
      if (!mapped) {
        // A string the module does not own still comes from the module-owned
        // wgpu error surfaces, so it is recorded as a render-stage failure
        // with the vocabulary message.
        const recorded = recordRendererFailure(
          failureState,
          "vello-render",
        ).diagnostic;
        if (recorded) pending.push(recorded);
        return;
      }
      if (mapped.code === "WEBGPU_DEVICE_LOST") {
        deviceLost = true;
        deviceLossMessage = mapped.message;
        return;
      }
      pending.push(mapped);
    },
    takePending() {
      return pending.shift();
    },
  };
};

/**
 * Serializes the composed packet for submission. The encoder's own output
 * carries a frame-background sentinel zIndex of i64::MIN; a JS JSON
 * round-trip cannot preserve it (the parsed double re-serializes as
 * -9223372036854776000, which the module rejects for its i64 field). Any
 * integer outside ±2^53 is clamped to the nearest representable bound: the
 * sentinel stays below every zIndex the kernel can author (JS cannot
 * represent such values distinctly), so draw order holds.
 */
const replaceUnrepresentableInteger = (
  _key: string,
  value: unknown,
): unknown => {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    !Number.isSafeInteger(value)
  ) {
    return value < 0 ? -Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
  }
  return value;
};

export const serializeRenderPacket = (frame: RenderFrame): string =>
  JSON.stringify(frame, replaceUnrepresentableInteger);

export const createWebGpuRendererInstance = (
  core: RendererCore,
  relay: ModuleErrorRelay,
): WasmRendererInstance => {
  let disposed = false;
  let lastAcceptedPacketRevision: number | undefined;
  let lastGeneratedPacketRevision: number | undefined;
  let lastRequestSequence = 0;
  let lastScene: { bytes: Uint8Array; frameId: string } | undefined;

  const staleRevision = (
    message: string,
  ): RendererResult => ({
    ok: false,
    diagnostics: [{ code: "STALE_REVISION", message }],
  });

  const recordGeneratedPacketRevision = (
    packetRevision: number | undefined,
  ): RendererResult | undefined => {
    if (packetRevision === undefined) return undefined;
    const previous = lastGeneratedPacketRevision;
    if (previous !== undefined && packetRevision !== previous + 1) {
      return staleRevision(
        `The render packet revision ${packetRevision} is not contiguous with ${previous}; the stale frame was discarded.`,
      );
    }
    lastGeneratedPacketRevision = packetRevision;
    return undefined;
  };

  const validateUnacceptedPacketRevision = (
    packetRevision: number | undefined,
  ): RendererResult | undefined => {
    if (
      packetRevision !== undefined &&
      lastAcceptedPacketRevision !== undefined &&
      packetRevision <= lastAcceptedPacketRevision
    ) {
      return staleRevision(
        `The render packet revision ${packetRevision} is not newer than accepted revision ${lastAcceptedPacketRevision}; the stale frame was discarded.`,
      );
    }
    return undefined;
  };

  const acceptPacketRevision = (packetRevision: number | undefined): void => {
    if (packetRevision === undefined) return;
    lastAcceptedPacketRevision = packetRevision;
    if (
      lastGeneratedPacketRevision === undefined ||
      packetRevision > lastGeneratedPacketRevision
    ) {
      lastGeneratedPacketRevision = packetRevision;
    }
  };

  const submitFrame = (frame: RenderFrame): RendererResult => {
    if (disposed)
      return {
        ok: false,
        diagnostics: [
          {
            code: "WASM_RENDER_FAILED",
            message: "The WASM/WebGPU renderer has been disposed.",
          },
        ],
      };
    if (relay.deviceLost)
      return {
        ok: false,
        diagnostics: [
          { code: "WEBGPU_DEVICE_LOST", message: relay.deviceLossMessage },
        ],
      };
    const pending = relay.takePending();
    if (pending) {
      const code =
        pending.code === "VELLO_ENCODE_FAILED"
          ? "VELLO_ENCODE_FAILED"
          : "VELLO_RENDER_FAILED";
      return { ok: false, diagnostics: [{ code, message: pending.message }] };
    }
    try {
      if (!isSupportedDrawProtocolVersion(frame.protocolVersion))
        throw new Error(
          `Unsupported draw protocol version ${frame.protocolVersion}.`,
        );
      const stalePacket = validateUnacceptedPacketRevision(frame.packetRevision);
      if (stalePacket) return stalePacket;
      core.render_packet(serializeRenderPacket(frame));
      acceptPacketRevision(frame.packetRevision);
      return {
        ok: true,
        diagnostics: [],
        evidence: {
          backend: "webgpu",
          protocolVersion: frame.protocolVersion,
          commandCount: frame.commands.length,
          ...(frame.documentRevision !== undefined
            ? { documentRevision: frame.documentRevision }
            : {}),
          ...(frame.packetRevision !== undefined
            ? { packetRevision: frame.packetRevision }
            : {}),
        },
        ...(frame.selectionBounds ? { selectionBounds: frame.selectionBounds } : {}),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const mapped = diagnosticFromModuleError(message);
      if (
        mapped?.code === "VELLO_ENCODE_FAILED" ||
        mapped?.code === "VELLO_RENDER_FAILED"
      ) {
        return {
          ok: false,
          diagnostics: [{ code: mapped.code, message: mapped.message }],
        };
      }
      return {
        ok: false,
        diagnostics: [
          {
            code: "WASM_RENDER_FAILED",
            message:
              "The WASM/WebGPU renderer failed safely; edit state was preserved.",
          },
        ],
      };
    }
  };

  return {
    setScene(sceneBytes, frameId, deltaJson) {
      // Remembered so a v2 batch packet can be re-encoded as a full packet:
      // the delta merge retired with the TypeGPU submission path.
      lastScene = { bytes: sceneBytes, frameId };
      core.set_scene(sceneBytes, frameId, deltaJson ?? null);
    },
    setViewport(viewport: Viewport, size) {
      // The canvas backing store is module-owned: the packet's viewport
      // drives the surface size (`device_size` mirrors the retired host's
      // Math.max(1, floor(css * pixelRatio)) rule), so the host only forwards
      // the layout size into the encoder.
      core.set_viewport(
        viewport.panX,
        viewport.panY,
        viewport.zoom,
        size.width,
        size.height,
        size.pixelRatio,
      );
    },
    render(
      selectedLayerId,
      previewBounds,
      requestSequence,
      documentRevision,
      overlay,
      glassSurfaces,
      chromeGlass,
      pathCommands,
      overlayCommands,
    ): RendererResult {
      if (disposed)
        return {
          ok: false,
          diagnostics: [
            {
              code: "WASM_RENDER_FAILED",
              message: "The WASM/WebGPU renderer has been disposed.",
            },
          ],
        };
      if (relay.deviceLost)
        return {
          ok: false,
          diagnostics: [
            { code: "WEBGPU_DEVICE_LOST", message: relay.deviceLossMessage },
          ],
        };
      const pending = relay.takePending();
      if (pending) {
        // An uncaptured module failure reported between frames: surfaced once,
        // then the next render retries (retry-render recovery).
        const code =
          pending.code === "VELLO_ENCODE_FAILED"
            ? "VELLO_ENCODE_FAILED"
            : "VELLO_RENDER_FAILED";
        return { ok: false, diagnostics: [{ code, message: pending.message }] };
      }
      try {
        if (requestSequence !== undefined) {
          if (requestSequence < lastRequestSequence) {
            return {
              ok: false,
              diagnostics: [
                {
                  code: "STALE_REVISION",
                  message:
                    "The render request was superseded by a newer request; the stale frame was discarded.",
                },
              ],
            };
          }
          lastRequestSequence = requestSequence;
        }
        core.set_selection(selectedLayerId ?? null);
        let frame = JSON.parse(core.render()) as RenderFrame;
        // Protocol v5 is explicit: a removal-only batch has an empty command
        // list and must still be merged/re-encoded. v2 packets predate the
        // field, so retain the compatibility inference only for old packets.
        const isBatch =
          frame.packetKind === "batch" ||
          (frame.packetKind === undefined &&
            frame.protocolVersion < 5 &&
            Boolean(frame.changedNodeIds?.length));
        if (isBatch) {
          // A v2 batch packet names only its changed nodes; submitting it
          // as-is would draw a partial scene. The scene re-encodes every
          // frame in Rust (the retained command map / changed-node merge
          // retired), so the host re-requests the full packet instead.
          if (!lastScene) {
            const staleBatch = recordGeneratedPacketRevision(frame.packetRevision);
            if (staleBatch) return staleBatch;
            return staleRevision(
              "A batch packet arrived without the retained scene needed to re-encode it; the frame was discarded.",
            );
          }
          const staleBatch = recordGeneratedPacketRevision(frame.packetRevision);
          if (staleBatch) return staleBatch;
          core.set_scene(lastScene.bytes, lastScene.frameId, undefined);
          frame = JSON.parse(core.render()) as RenderFrame;
        }
        if (!isSupportedDrawProtocolVersion(frame.protocolVersion))
          throw new Error(
            `Unsupported draw protocol version ${frame.protocolVersion}.`,
          );

        const staleGenerated = recordGeneratedPacketRevision(
          frame.packetRevision,
        );
        if (staleGenerated) return staleGenerated;

        if (
          frame.documentRevision !== undefined &&
          documentRevision !== undefined &&
          frame.documentRevision !== documentRevision
        ) {
          return staleRevision(
            `The render packet document revision ${frame.documentRevision} does not match ${documentRevision}; the stale frame was discarded.`,
          );
        }
        const stalePacket = validateUnacceptedPacketRevision(frame.packetRevision);
        if (stalePacket) return stalePacket;

        // The only per-frame crossing: the composed packet, JS → WASM. The
        // module renders and presents; on failure nothing is presented, so
        // the surface keeps showing the last valid frame. Path commands enter
        // the authored command list first (the module re-sorts by
        // (zIndex, order)), then the overlays fold in above them.
        const authored = withPathCommands(
          {
            ...frame,
            ...(overlay ? { overlay } : {}),
            ...(glassSurfaces ? { glassSurfaces } : {}),
            ...(chromeGlass ? { chromeGlass } : {}),
          },
          pathCommands,
        );
        const composed = withOverlays(authored, previewBounds, overlayCommands);
        core.render_packet(serializeRenderPacket(composed));
        acceptPacketRevision(frame.packetRevision);
        return {
          ok: true,
          diagnostics: [],
          evidence: {
            backend: "webgpu",
            protocolVersion: frame.protocolVersion,
            commandCount: composed.commands.length,
            ...(frame.documentRevision !== undefined
              ? { documentRevision: frame.documentRevision }
              : {}),
            ...(frame.packetRevision !== undefined
              ? { packetRevision: frame.packetRevision }
              : {}),
          },
          ...(frame.selectionBounds
            ? { selectionBounds: frame.selectionBounds }
            : {}),
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const mapped = diagnosticFromModuleError(message);
        if (
          mapped?.code === "VELLO_ENCODE_FAILED" ||
          mapped?.code === "VELLO_RENDER_FAILED"
        ) {
          return {
            ok: false,
            diagnostics: [{ code: mapped.code, message: mapped.message }],
          };
        }
        return {
          ok: false,
          diagnostics: [
            {
              code: "WASM_RENDER_FAILED",
              message:
                "The WASM/WebGPU renderer failed safely; edit state was preserved.",
            },
          ],
        };
      }
    },
    renderFrame(frame) {
      return submitFrame(frame);
    },
    dispose() {
      disposed = true;
    },
  };
};

/**
 * The device-loss recovery decision. Same-core recovery (re-running the
 * module's `init_canvas` on the SAME RendererCore) is preferred: the module
 * retains the failed device — never dropping it, because wgpu's wasm backend
 * cannot unregister the browser-side error listeners and a dropped closure
 * slot throws wasm-bindgen's "closure invoked recursively or after being
 * dropped" when the browser fires a late event on the old device
 * (wasm-bindgen#3294). Only a failed re-init falls back to discarding the
 * runtime so the app re-acquires a new core.
 */
export type RecoveryOutcome = "device-recreated" | "runtime-reacquired";

export const recoverAfterDeviceLoss = async (
  runtime: WasmRendererRuntime | undefined,
): Promise<RecoveryOutcome> => {
  if (!runtime) return "runtime-reacquired";
  try {
    await runtime.recover();
    return "device-recreated";
  } catch {
    return "runtime-reacquired";
  }
};
