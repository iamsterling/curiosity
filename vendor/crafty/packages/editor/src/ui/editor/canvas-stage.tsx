"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  composeRenderFrame,
  createSceneRenderer,
  sceneToRenderFrame,
  screenToWorld,
  worldToScreen,
  type RendererEvidence,
  type RendererProof,
  type RendererResult,
  type SceneRenderer,
  type WasmRendererRuntime,
} from "@crafty/scene-renderer";
import {
  multiplyTransforms,
  transformBounds,
  type Bounds,
  type Layer,
} from "@crafty/scene-model";

import { useEditor, useEditorSelector } from "./editor-context.js";
import { useEditorChrome } from "./chrome.js";
import {
  composeEditingOverlays,
  composeHoverOverlay,
  composeSelectionOverlay,
} from "./editing-overlays.js";
import { composeAgentActivityOverlay } from "./agent-activity-overlay.js";
import { oklchToRgba, type Rgba } from "./theme-accent.js";
import { gridOpacityAt, pageOverlay } from "./overlay.js";
import {
  GridHostRenderLoop,
  RendererLifecycleCoordinator,
  type RendererCreationCause,
} from "./grid-host-render-loop.js";
import { CHROME_GLASS_SELECTOR, ChromeGlassTracker } from "./chrome-glass.js";
import {
  CanvasRenderContextLifecycle,
  type CanvasRenderSize,
} from "./canvas-render-context-lifecycle.js";
import type { EditorProjection, Point } from "./harness.js";
import { RendererProofChip } from "../editor-primitives/renderer-proof-chip.js";
import { useStagePositioning } from "./stage-positioning.js";
import {
  projectSelectionScreenAabb,
  SelectionActionPlacementCoordinator,
} from "./selection-action-placement.js";

/**
 * The canvas stage owns the renderer: the WebGPU device, the WASM runtime, and
 * a requestAnimationFrame loop that reads `editor.getSnapshot()` DIRECTLY.
 *
 * React does not drive rendering. A pointer move mutates the kernel, the kernel
 * bumps `renderRevision`, and the next animation frame draws it. No component
 * in this tree re-renders during a drag — the only React state here is renderer
 * status, and it is written solely when the message actually changes.
 */

interface RendererStatus {
  message: string;
  backend: SceneRenderer["backend"];
  proof: RendererProof | undefined;
  evidence: RendererEvidence | undefined;
}

const EMPTY_STATUS: RendererStatus = {
  message: "",
  backend: "unavailable",
  proof: undefined,
  evidence: undefined,
};

const selectTool = (projection: { interaction: { tool: string } }) =>
  projection.interaction.tool;

const selectSelectionHud = (projection: EditorProjection) => ({
  box: projection.selectionBox,
  viewport: projection.viewport,
});

/** The selection accent fallback — the dark brass `--ring` value — until the
 *  first computed-style read lands; the read is cached and refreshed when
 *  the `dark` class flips, never per frame. */
const DEFAULT_ACCENT: Rgba = [0.8, 0.68, 0.43, 1];

const readCanvasRenderSize = (
  canvas: HTMLCanvasElement,
): CanvasRenderSize => {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio =
    typeof window !== "undefined" && Number.isFinite(window.devicePixelRatio)
      ? Math.max(1, window.devicePixelRatio)
      : 1;
  return {
    width: rect.width || canvas.clientWidth,
    height: rect.height || canvas.clientHeight,
    pixelRatio,
  };
};

export const committedPacketRevisionAfterRender = (
  currentRevision: number,
  attemptedRevision: number,
  result: Pick<RendererResult, "diagnostics" | "ok">,
): number => (result.ok ? attemptedRevision : currentRevision);

/**
 * The WASM/WebGPU runtime loader is injected rather than imported: the wasm
 * package depends on the editor kernel (via pen-import), so importing it here
 * would make the editor package depend on a package that depends on it. The
 * app — the composition site — imports the loader from the wasm package and
 * passes it in.
 */
export interface CanvasStageRuntime {
  load: (canvas: HTMLCanvasElement) => Promise<WasmRendererRuntime>;
  recoverAfterDeviceLoss: (
    runtime: WasmRendererRuntime | undefined,
  ) => Promise<"device-recreated" | "runtime-reacquired">;
}

export function CanvasStage({
  runtime: runtimeLoader,
}: {
  runtime: CanvasStageRuntime;
}) {
  const editor = useEditor();
  const { preferencesRef, pasteArmedRef } = useEditorChrome();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { actionElementRef, actionSizeRef, registerHost } = useStagePositioning();
  const selectionActionPlacementRef = useRef(
    new SelectionActionPlacementCoordinator(),
  );
  // The chrome glass tracker: measures `[data-chrome-glass]` pills and
  // integrates their press/hover springs on rAF dt — framework-free, one per
  // stage mount. The `glass-active` class on <html> gates the DOM chrome's
  // transparent appearance (the CSS pill look is the no-GPU fallback).
  const chromeTrackerRef = useRef<ChromeGlassTracker>(new ChromeGlassTracker());
  const [runtime, setRuntime] = useState<WasmRendererRuntime>();
  const [status, setStatus] = useState<RendererStatus>(EMPTY_STATUS);
  const [retry, setRetry] = useState(0);
  // Same-core recovery tick: bumped when `runtime.recover()` succeeds so the
  // draw-loop effect re-creates the renderer instance on the SAME runtime.
  // Kept separate from `retry` — bumping `retry` would re-run the runtime
  // acquisition effect and build a new core, defeating the same-core recovery.
  const recoveringRef = useRef(false);
  const statusRef = useRef<RendererStatus>(EMPTY_STATUS);
  const resizeDirtyRef = useRef(true);
  const renderContextLifecycleRef = useRef<
    CanvasRenderContextLifecycle | undefined
  >(undefined);
  const gridHostLoopRef = useRef(
    new GridHostRenderLoop<
      ReturnType<typeof composeRenderFrame>,
      RendererResult
    >(),
  );
  const rendererLifecycleRef = useRef(
    new RendererLifecycleCoordinator(() => {
      editor.setAcceptedGridRenderContext(undefined);
      gridHostLoopRef.current.rendererCreated();
    }),
  );
  const rendererCreatedRef = useRef(false);
  const nextRendererCauseRef =
    useRef<RendererCreationCause>("initial-creation");
  const activeTool = useEditorSelector(selectTool);
  // The selection accent, read from the theme's `--ring` token (oklch) and
  // converted to sRGB. Cached; a MutationObserver on the html class refreshes
  // it when next-themes flips the mode — the selection indicator is
  // theme-dynamic without a per-frame style query.
  const accentRef = useRef<Rgba>(DEFAULT_ACCENT);

  useEffect(() => {
    const read = (): void => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue("--ring")
        .trim();
      const rgba = oklchToRgba(value);
      if (rgba) accentRef.current = rgba;
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const publishStatus = (next: Partial<RendererStatus>): void => {
    const merged = { ...statusRef.current, ...next };
    if (
      merged.message === statusRef.current.message &&
      merged.backend === statusRef.current.backend &&
      merged.proof === statusRef.current.proof &&
      merged.evidence?.commandCount ===
        statusRef.current.evidence?.commandCount &&
      merged.evidence?.protocolVersion ===
        statusRef.current.evidence?.protocolVersion
    )
      return;
    statusRef.current = merged;
    setStatus(merged);
  };

  // -- WASM + WebGPU runtime acquisition ---------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    runtimeLoader
      .load(canvas)
      .then((next) => {
        if (cancelled) return;
        editor.setLayoutEvaluator(next.resolveLayout);
        setRuntime(next);
        publishStatus({ proof: next.proof, message: "" });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          publishStatus({
            message:
              error instanceof Error
                ? error.message
                : "WASM/WebGPU renderer initialization failed.",
          });
      });
    return () => {
      cancelled = true;
      editor.setLayoutEvaluator(undefined);
    };
    // `retry` is a dependency on purpose: a device-loss recovery re-acquires the runtime.
  }, [retry]);

  // -- The render loop ----------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: SceneRenderer | undefined;
    let frame = 0;
    let lastRendered = -1;
    let packetRevision = 0;
    let lastTimestamp = -1;
    let lastChromeKey = "";
    let disposed = false;

    const draw = (timestamp: number): void => {
      renderContextLifecycleRef.current?.observeFramePixelRatio();
      const projection = editor.getSnapshot();
      const frameRecord = projection.frame;
      if (!frameRecord) return;

      const gridHostLoop = gridHostLoopRef.current;
      if (!renderer) {
        if (recoveringRef.current) return;
        renderer = createSceneRenderer(
          canvas,
          runtime ? { wasmRuntime: runtime } : {},
        );
        const cause = rendererCreatedRef.current
          ? nextRendererCauseRef.current
          : "initial-creation";
        if (cause === "initial-creation") {
          rendererLifecycleRef.current.rendererInitiallyCreated();
        } else if (cause === "device-recovery") {
          rendererLifecycleRef.current.rendererRecovered();
        } else {
          rendererLifecycleRef.current.rendererRecreated();
        }
        rendererCreatedRef.current = true;
        nextRendererCauseRef.current = "recreation";
      }
      const activeRenderer = renderer;
      const rect = canvas.getBoundingClientRect();
      const canvasSize = readCanvasRenderSize(canvas);
      selectionActionPlacementRef.current.update({
        element: actionElementRef.current,
        selectionBox: projection.selectionBox,
        viewport: projection.viewport,
        stage: canvasSize,
        surface: actionSizeRef.current,
      });
      // Chrome glass: measure the pills, integrate the springs with rAF dt,
      // and render when the chrome moved even if the document did not (a
      // panel toggle is chrome state, not a document change).
      const tracker = chromeTrackerRef.current;
      const dt =
        lastTimestamp >= 0
          ? Math.min(0.25, (timestamp - lastTimestamp) / 1000)
          : 0;
      lastTimestamp = timestamp;
      for (const element of document.querySelectorAll<HTMLElement>(
        CHROME_GLASS_SELECTOR,
      )) {
        tracker.attach(element);
      }
      tracker.update(dt);
      const chromeGlass = tracker.measure(rect);
      // The change key is quantized: settled springs converge asymptotically
      // and rects jitter sub-pixel, so full-precision keys would make the
      // draw loop render every frame at rest. Renders happen while values
      // move beyond the epsilon — and stop once they settle.
      const chromeKey = JSON.stringify(chromeGlass, (key, value) =>
        typeof value === "number" ? Math.round(value * 1000) / 1000 : value,
      );
      // A fresh camera (nobody has panned or zoomed) keeps the world origin
      // centred in the viewport; re-measuring on every draw keeps it centred
      // across resizes until the user takes the camera.
      editor.centerOrigin(
        canvasSize.width,
        canvasSize.height,
      );
      editor.setCanvasSize(
        canvasSize.width,
        canvasSize.height,
        canvasSize.pixelRatio,
      );
      const current = editor.getSnapshot();
      const attemptedPacketRevision = packetRevision + 1;
      let packetGridContext:
        | {
            pageId: string;
            viewport: {
              panX: number;
              panY: number;
              zoom: number;
              width: number;
              height: number;
              pixelRatio: number;
            };
            grid: NonNullable<(typeof current.pages)[number]>["canvas"]["grid"];
          }
        | undefined;
      const submission = gridHostLoop.frame({
        timestamp,
        targetOpacity: gridOpacityAt(current.viewport.zoom),
        publishAcceptedGridRenderContext: (packet, opacity, result) =>
          editor.setAcceptedGridRenderContext(
            result.ok && packetGridContext
              ? {
                  opacity,
                  pageId: packetGridContext.pageId,
                  viewport: { ...packet.viewport },
                  grid: packetGridContext.grid,
                }
              : undefined,
          ),
        renderRevision: projection.renderRevision,
        lastRendered,
        resizeDirty: resizeDirtyRef.current,
        chromeChanged: chromeKey !== lastChromeKey,
        hasAgentActivities: projection.agentActivities.length > 0,
        buildPacket: (gridOpacity) => {
          const activePage = current.pages.find(
            (page) => page.id === current.activePageId,
          );
          if (activePage) {
            packetGridContext = {
              pageId: activePage.id,
              viewport: {
                panX: current.viewport.panX,
                panY: current.viewport.panY,
                zoom: current.viewport.zoom,
                ...canvasSize,
              },
              grid: { ...activePage.canvas.grid },
            };
          }
          const overlay = pageOverlay(
            activePage,
            current.viewport,
            {
              width: canvasSize.width,
              height: canvasSize.height,
            },
            gridOpacity,
          );
          // Ephemeral editing chrome is packet-only work. Keeping all of it in
          // this lazy branch means an unchanged rAF never traverses overlays.
          const overlayCommands = [
            ...composeEditingOverlays(current, {
              width: canvasSize.width,
              height: canvasSize.height,
            }),
            ...composeSelectionOverlay(
              current.selectionBox,
              current.viewport.zoom,
              accentRef.current,
              current.selectedIds.length === 1
                ? current.selectionBox?.cornerRadius
                : undefined,
            ),
            ...composeHoverOverlay(
              current.hoverBox,
              current.viewport.zoom,
              accentRef.current,
            ),
            ...composeAgentActivityOverlay(
              frameRecord.layers,
              current.agentActivities,
              timestamp,
            ),
          ];
          const previewBounds =
            current.draftBounds ?? current.pastePreview?.bounds;
          return composeRenderFrame(
            sceneToRenderFrame(
              current.scene,
              frameRecord.id,
              {
                ...current.viewport,
                ...canvasSize,
              },
              current.selectedId,
              attemptedPacketRevision,
            ),
            {
              glassSurfaces: current.glassSurfaces,
              chromeGlass,
              pathCommands: current.pathCommands,
              overlayCommands,
              ...(previewBounds ? { previewBounds } : {}),
              ...(overlay ? { overlay: overlay.packet } : {}),
            },
          );
        },
        submit: (packet) => activeRenderer.renderFrame(packet),
      });
      if (!submission.emitted) return;
      lastChromeKey = chromeKey;
      const result = submission.result;

      const diagnostic = result.diagnostics[0];
      packetRevision = committedPacketRevisionAfterRender(
        packetRevision,
        attemptedPacketRevision,
        result,
      );
      resizeDirtyRef.current = false;
      lastRendered = current.renderRevision;
      // The chrome's DOM appearance is the no-GPU fallback; once a frame
      // renders with the module, the pills go transparent and the GPU glass
      // owns the look. A failure drops the class and the CSS appearance
      // returns — the degradation doctrine, never a blank pill.
      document.documentElement.classList.toggle("glass-active", result.ok);

      if (
        !result.ok &&
        diagnostic?.code === "WEBGPU_DEVICE_LOST" &&
        retry < 3 &&
        !recoveringRef.current
      ) {
        recoveringRef.current = true;
        editor.setAcceptedGridRenderContext(undefined);
        const recoveryToken =
          rendererLifecycleRef.current.beginDeviceRecovery();
        renderer.dispose();
        renderer = undefined;
        // Same-core recovery: re-run the module's `init_canvas` on the SAME
        // RendererCore — the module retains the failed device, never dropping
        // it, because its browser-side error listeners stay registered and a
        // dropped closure slot throws wasm-bindgen's "closure invoked
        // recursively or after being dropped" on the next late event. Only a
        // failed re-init discards the runtime and re-acquires a new core.
        void runtimeLoader.recoverAfterDeviceLoss(runtime).then((outcome) => {
          if (
            disposed ||
            !rendererLifecycleRef.current.completeDeviceRecovery(recoveryToken)
          )
            return;
          recoveringRef.current = false;
          if (outcome === "device-recreated") {
            nextRendererCauseRef.current = "device-recovery";
            publishStatus({
              message: "WebGPU device lost — device recreated.",
            });
          } else {
            setRuntime(undefined);
            setRetry((value) => value + 1);
            publishStatus({
              message: "WebGPU device lost — recreating the renderer.",
            });
          }
        });
        return;
      }
      publishStatus({
        backend: renderer.backend,
        message: result.ok
          ? ""
          : (diagnostic?.message ?? "WebGPU rendering failed."),
        ...(result.evidence ? { evidence: result.evidence } : {}),
      });
    };

    const tick = (timestamp: number): void => {
      if (disposed) return;
      frame = window.requestAnimationFrame(tick);
      try {
        draw(timestamp);
      } catch (error: unknown) {
        publishStatus({
          message:
            error instanceof Error ? error.message : "WebGPU renderer failed.",
        });
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      disposed = true;
      recoveringRef.current = false;
      rendererLifecycleRef.current.replace();
      editor.setAcceptedGridRenderContext(undefined);
      window.cancelAnimationFrame(frame);
      renderer?.dispose();
      chromeTrackerRef.current.dispose();
    };
  }, [editor, runtime, retry]);

  // -- Canvas resize ------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const lifecycle = new CanvasRenderContextLifecycle({
      readPixelRatio: () => window.devicePixelRatio,
      readRenderSize: () => readCanvasRenderSize(canvas),
      matchMedia: (query) => window.matchMedia(query),
      invalidateAcceptedContext: () =>
        editor.setAcceptedGridRenderContext(undefined),
      markResizeDirty: () => {
        resizeDirtyRef.current = true;
      },
    });
    renderContextLifecycleRef.current = lifecycle;
    const markDirty = (): void => lifecycle.canvasResized();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", markDirty);
      return () => {
        window.removeEventListener("resize", markDirty);
        lifecycle.dispose();
        if (renderContextLifecycleRef.current === lifecycle)
          renderContextLifecycleRef.current = undefined;
      };
    }
    const observer = new ResizeObserver(markDirty);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      lifecycle.dispose();
      if (renderContextLifecycleRef.current === lifecycle)
        renderContextLifecycleRef.current = undefined;
    };
  }, [editor]);

  // -- Wheel, trackpad and Safari pinch gestures -------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let pending:
      | {
          point: Point;
          deltaY: number;
          panX: number;
          panY: number;
          ctrlKey: boolean;
        }
      | undefined;
    let scheduled: number | undefined;

    const pointAt = (clientX: number, clientY: number): Point => {
      const bounds = canvas.getBoundingClientRect();
      return { x: clientX - bounds.left, y: clientY - bounds.top };
    };

    const flush = (): void => {
      scheduled = undefined;
      const next = pending;
      pending = undefined;
      if (!next) return;
      if (next.ctrlKey)
        editor.handleWheel(next.point, next.deltaY, { ctrlKey: true });
      else editor.scrollPan(-next.panX, -next.panY);
    };

    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      if (editor.isPinching()) return;
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? canvas.clientHeight
            : 1;
      const sensitivity = preferencesRef.current.gestureSensitivity;
      const dx = event.deltaX * unit * sensitivity;
      const dy = event.deltaY * unit * sensitivity;
      const point = pointAt(event.clientX, event.clientY);
      if (event.ctrlKey || event.metaKey)
        pending = {
          point,
          deltaY: (pending?.deltaY ?? 0) + dy,
          panX: 0,
          panY: 0,
          ctrlKey: true,
        };
      else if (event.shiftKey)
        pending = {
          point,
          deltaY: 0,
          panX: (pending?.panX ?? 0) + (dy !== 0 ? dy : dx),
          panY: 0,
          ctrlKey: false,
        };
      else
        pending = {
          point,
          deltaY: 0,
          panX: (pending?.panX ?? 0) + dx,
          panY: (pending?.panY ?? 0) + dy,
          ctrlKey: false,
        };
      scheduled ??= window.requestAnimationFrame(flush);
    };

    let gestureScale = 1;
    const onGestureStart = (event: Event): void => {
      event.preventDefault();
      gestureScale = 1;
    };
    const onGestureChange = (event: Event): void => {
      event.preventDefault();
      const gesture = event as Event & {
        scale?: number;
        clientX: number;
        clientY: number;
      };
      const scale = gesture.scale ?? 1;
      const previous = gestureScale;
      gestureScale = scale;
      if (
        previous <= 0 ||
        scale <= 0 ||
        Math.abs(scale - previous) < 0.001 ||
        editor.isPinching()
      )
        return;
      editor.zoomBy(
        scale / previous,
        pointAt(gesture.clientX, gesture.clientY),
      );
    };
    const onGestureEnd = (event: Event): void => {
      event.preventDefault();
      gestureScale = 1;
    };
    const preventBrowserZoomWheel = (event: WheelEvent): void => {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("wheel", preventBrowserZoomWheel, {
      passive: false,
    });
    document.addEventListener("gesturestart", onGestureStart, {
      passive: false,
    });
    document.addEventListener("gesturechange", onGestureChange, {
      passive: false,
    });
    document.addEventListener("gestureend", onGestureEnd, { passive: false });
    return () => {
      if (scheduled !== undefined) window.cancelAnimationFrame(scheduled);
      canvas.removeEventListener("wheel", onWheel);
      document.removeEventListener("wheel", preventBrowserZoomWheel);
      document.removeEventListener("gesturestart", onGestureStart);
      document.removeEventListener("gesturechange", onGestureChange);
      document.removeEventListener("gestureend", onGestureEnd);
    };
  }, [editor, preferencesRef]);

  // -- Pointer plumbing ---------------------------------------------------

  const canvasPoint = (event: { clientX: number; clientY: number }): Point => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    return bounds
      ? { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
      : { x: 0, y: 0 };
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    renderContextLifecycleRef.current?.beforeInteraction();
    if (pasteArmedRef.current) {
      editor.pasteAt(canvasPoint(event));
      pasteArmedRef.current = false;
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    editor.handlePointerDown({
      pointerId: event.pointerId,
      point: canvasPoint(event),
      button: event.button,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      spaceKey: false,
      ctrlKey: event.ctrlKey || event.metaKey,
    });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    renderContextLifecycleRef.current?.beforeInteraction();
    if (pasteArmedRef.current) editor.previewPaste(canvasPoint(event));
    editor.handlePointerMove(event.pointerId, canvasPoint(event), {
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey || event.metaKey,
    });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    editor.handlePointerUp(event.pointerId, canvasPoint(event), {
      cancel: event.type === "pointercancel",
      shiftKey: event.shiftKey,
    });
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onPointerLeave = (): void => {
    editor.handlePointerLeave();
  };

  return (
    <section className="stage" aria-label="Crafty design surface">
      <canvas
        ref={canvasRef}
        className={`scene-canvas tool-${activeTool}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
        aria-label="Interactive WebGPU scene"
      />
      <div ref={registerHost} data-stage-positioning-host className="pointer-events-none absolute inset-0" />
      <RendererProofChip
        backend={status.backend}
        proof={status.proof}
        evidence={status.evidence}
      />
      {status.message ? (
        <div className="renderer-warning" role="status">
          {status.message}
        </div>
      ) : null}
      <SelectionHud />
      <GuideStrips />
      <BackToContent />
    </section>
  );
}

/** A lightweight, read-only canvas label for the selected geometry. Exact
 * edits remain in the inspector; this keeps the high-frequency visual answer
 * next to the object without adding a second mutation path. */
function SelectionHud() {
  const { box, viewport } = useEditorSelector(
    selectSelectionHud,
    selectionHudEqual,
  );
  if (!box || viewport.zoom <= 0) return null;
  const screenBox = projectSelectionScreenAabb(box, viewport);
  const left = screenBox.x + screenBox.width / 2;
  const top = screenBox.y + screenBox.height + 10;
  return (
    <div
      className="selection-dimensions"
      style={{ left, top }}
      role="status"
      aria-label={`Selection dimensions ${Math.round(box.bounds.width)} by ${Math.round(box.bounds.height)}`}
    >
      {Math.round(box.bounds.width)} x {Math.round(box.bounds.height)}
    </div>
  );
}

const selectionHudEqual = (
  left: ReturnType<typeof selectSelectionHud>,
  right: ReturnType<typeof selectSelectionHud>,
): boolean => {
  if (left.box === right.box && left.viewport === right.viewport) return true;
  if (!left.box || !right.box) return left.box === right.box;
  return (
    left.box.bounds === right.box.bounds &&
    left.box.transform === right.box.transform &&
    left.viewport.panX === right.viewport.panX &&
    left.viewport.panY === right.viewport.panY &&
    left.viewport.zoom === right.viewport.zoom
  );
};

/** The Back-to-Content affordance (tldraw's): appears only when NO authored
 *  content intersects the viewport — the #1 infinite-canvas failure is
 *  getting lost in empty space, and this is the one-click recovery. The
 *  emptiness check is renderer-independent: scene layer world boxes vs the
 *  viewport's world rect, computed in a selector. */
function BackToContent() {
  const editor = useEditor();
  const empty = useEditorSelector(selectViewportEmptyOfContent);
  if (!empty) return null;
  return (
    <button
      type="button"
      className="back-to-content"
      onClick={() => editor.zoomToFit()}
    >
      Back to content
    </button>
  );
}

/** True when no visible layer's WORLD box intersects the viewport's world
 *  rect — the Back-to-Content trigger. Frames are content too (their box is
 *  the page canvas), but the page root is not. */
const selectViewportEmptyOfContent = (
  projection: EditorProjection,
): boolean => {
  const layers = projection.frame?.layers ?? [];
  const zoom = projection.viewport.zoom;
  const panX = projection.viewport.panX;
  const panY = projection.viewport.panY;
  const width = projection.canvasSize.width / zoom;
  const height = projection.canvasSize.height / zoom;
  const world = { x: -panX / zoom, y: -panY / zoom };
  const intersects = (box: Bounds): boolean =>
    box.x < world.x + width &&
    box.x + box.width > world.x &&
    box.y < world.y + height &&
    box.y + box.height > world.y;
  const visit = (entries: Layer[]): boolean => {
    for (const layer of entries) {
      if (!layer.visible) continue;
      const position = {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: layer.bounds.x,
        f: layer.bounds.y,
      };
      const worldTransform = multiplyTransforms(position, layer.transform);
      const box = transformBounds(
        { x: 0, y: 0, width: layer.bounds.width, height: layer.bounds.height },
        worldTransform,
      );
      if (intersects(box)) return true;
      if (layer.children && visit(layer.children)) return true;
    }
    return false;
  };
  return !visit(layers);
};

/**
 * The guide chrome: two edge strips (top and left) that create guides by
 * dragging into the canvas, plus transparent handles ON the rendered guides
 * that drag them. Both are DOM interaction chrome over the renderer's guide
 * lines — the drawn guide stays the authority; these strips only carry
 * pointer events. One history entry per gesture.
 */
function GuideStrips() {
  const editor = useEditor();
  const guides = useEditorSelector(selectGuides);
  const viewport = useEditorSelector(selectViewport);
  const dragRef = useRef<{ axis: "x" | "y"; guideId: string } | undefined>(
    undefined,
  );

  const worldPosition = (
    event: { clientX: number; clientY: number; currentTarget: HTMLElement },
    axis: "x" | "y",
  ): number => {
    // The strips and handles have their own rects; the world math needs the
    // CANVAS rect, which the stage section shares.
    const bounds =
      event.currentTarget.closest(".stage")?.getBoundingClientRect() ??
      event.currentTarget.getBoundingClientRect();
    const point = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    const world = screenToWorld(point, viewport);
    return axis === "y" ? world.y : world.x;
  };

  const onStripDown =
    (axis: "x" | "y") =>
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (dragRef.current) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const guideId = editor.beginGuideDrag(axis, worldPosition(event, axis));
      dragRef.current = { axis, guideId };
    };

  const onStripMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (!drag || event.buttons === 0) return;
    editor.previewGuideDrag(drag.guideId, worldPosition(event, drag.axis));
  };

  const endDrag =
    (cancelled: boolean) =>
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (!dragRef.current) return;
      event.preventDefault();
      editor.commitGuideDrag(cancelled);
      dragRef.current = undefined;
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
    };

  return (
    <>
      <div
        className="guide-strip guide-strip-top"
        aria-hidden="true"
        onPointerDown={onStripDown("y")}
        onPointerMove={onStripMove}
        onPointerUp={endDrag(false)}
        onPointerCancel={endDrag(true)}
      />
      <div
        className="guide-strip guide-strip-left"
        aria-hidden="true"
        onPointerDown={onStripDown("x")}
        onPointerMove={onStripMove}
        onPointerUp={endDrag(false)}
        onPointerCancel={endDrag(true)}
      />
      {guides.map((guide) => {
        const position = worldToScreen(
          {
            x: guide.axis === "x" ? guide.position : 0,
            y: guide.axis === "y" ? guide.position : 0,
          },
          viewport,
        );
        return (
          <div
            key={guide.id}
            className={`guide-handle guide-handle-${guide.axis}`}
            style={
              guide.axis === "x"
                ? { left: position.x, top: 0, bottom: 0 }
                : { top: position.y, left: 0, right: 0 }
            }
            aria-hidden="true"
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              const guideId = editor.beginGuideDrag(
                guide.axis,
                guide.position,
                guide.id,
              );
              dragRef.current = { axis: guide.axis, guideId };
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current;
              if (!drag || event.buttons === 0) return;
              editor.previewGuideDrag(
                drag.guideId,
                worldPosition(event, drag.axis),
              );
            }}
            onPointerUp={endDrag(false)}
            onPointerCancel={endDrag(true)}
          />
        );
      })}
    </>
  );
}

const selectGuides = (
  projection: EditorProjection,
): Array<{ id: string; axis: "x" | "y"; position: number }> =>
  projection.pages.find((page) => page.id === projection.activePageId)?.canvas
    .guides ?? [];
const selectViewport = (
  projection: EditorProjection,
): { panX: number; panY: number; zoom: number } => projection.viewport;

const selectPasteDiagnostics = (projection: {
  pasteDiagnostics: Array<{ message: string }>;
}) => projection.pasteDiagnostics;

function PasteDiagnostics() {
  const diagnostics = useEditorSelector(selectPasteDiagnostics);
  if (diagnostics.length === 0) return null;
  return (
    <div className="renderer-warning" role="status">
      {diagnostics.map((diagnostic) => diagnostic.message).join(" / ")}
    </div>
  );
}
