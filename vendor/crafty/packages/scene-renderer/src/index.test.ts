import { describe, expect, it } from "vitest";
import { createSceneSpatialIndex, createSeedScene } from "@crafty/scene-model";
import { createSceneRenderer, defaultViewport, hasMinimumBounds, hitTestScene, normalizeBounds, sceneToRenderFrame, screenToWorld, worldToScreen, ZOOM_MAX, ZOOM_MIN, zoomAt, zoomTo } from "./index.js";

const fakeCanvas = (size: { width: number; height: number }): HTMLCanvasElement => {
  const canvas = {
    get clientWidth() { return size.width; },
    get clientHeight() { return size.height; },
    getBoundingClientRect: () => ({ width: size.width, height: size.height })
  };
  return canvas as unknown as HTMLCanvasElement;
};

const fakeProof = { wasm: { verified: true as const, exports: ["RendererCore"], memoryBytes: 1024 }, webgpu: { verified: true as const, format: "rgba8unorm", device: "module-owned" as const, surface: "module-owned" as const } };

describe("scene renderer transforms", () => {
  it("round-trips world and screen coordinates", () => {
    const viewport = defaultViewport();
    const world = { x: 240, y: 120 };
    const roundTrip = screenToWorld(worldToScreen(world, viewport), viewport);
    expect(roundTrip.x).toBeCloseTo(world.x);
    expect(roundTrip.y).toBeCloseTo(world.y);
  });

  it("keeps the zoom anchor stable", () => {
    const viewport = defaultViewport();
    const anchor = worldToScreen({ x: 320, y: 200 }, viewport);
    for (const factor of [0.25, 0.5, 1.5, 4]) {
      const zoomed = zoomAt(viewport, anchor, factor);
      expect(screenToWorld(anchor, zoomed).x).toBeCloseTo(320);
      expect(screenToWorld(anchor, zoomed).y).toBeCloseTo(200);
    }
  });

  it("sets an exact zoom through zoomTo while keeping the anchor stable", () => {
    const viewport = { ...defaultViewport(), panX: 120, panY: -40, zoom: 0.25 };
    const anchor = { x: 400, y: 250 };
    const zoomed = zoomTo(viewport, anchor, 1);
    expect(zoomed.zoom).toBe(1);
    expect(screenToWorld(anchor, zoomed).x).toBeCloseTo(screenToWorld(anchor, viewport).x);
    expect(screenToWorld(anchor, zoomed).y).toBeCloseTo(screenToWorld(anchor, viewport).y);
    expect(viewport).toEqual({ panX: 120, panY: -40, zoom: 0.25 });
  });

  it("clamps zoomTo to the zoom window and rejects non-finite targets", () => {
    const viewport = defaultViewport();
    expect(zoomTo(viewport, { x: 0, y: 0 }, 1e6).zoom).toBe(ZOOM_MAX);
    expect(zoomTo(viewport, { x: 0, y: 0 }, -1e6).zoom).toBe(ZOOM_MIN);
    expect(zoomTo(viewport, { x: 0, y: 0 }, Number.NaN).zoom).toBe(viewport.zoom);
    expect(zoomTo(viewport, { x: 0, y: 0 }, Number.POSITIVE_INFINITY).zoom).toBe(viewport.zoom);
  });

  it("zooms in and back out to the same viewport through zoomAt", () => {
    const viewport = zoomTo(defaultViewport(), { x: 300, y: 220 }, 2);
    const restored = zoomTo(viewport, { x: 300, y: 220 }, 1);
    expect(restored.zoom).toBe(1);
  });

  it("keeps pan and zoom transforms invertible without mutation", () => {
    const viewport = { ...defaultViewport(), panX: -140, panY: 270, zoom: 1.75 };
    const world = { x: 240, y: 120 };
    const roundTrip = screenToWorld(worldToScreen(world, viewport), viewport);
    expect(roundTrip.x).toBeCloseTo(world.x);
    expect(roundTrip.y).toBeCloseTo(world.y);
    expect(viewport).toEqual({ panX: -140, panY: 270, zoom: 1.75 });
  });

  it("keeps layer bounds unchanged across viewport changes and hit-tests at pan and zoom", () => {
    const scene = createSeedScene();
    const before = structuredClone(scene);
    const viewport = zoomAt({ ...defaultViewport(), panX: 120, panY: -40 }, { x: 400, y: 250 }, 1.5);
    expect(hitTestScene(scene, "frame-home", worldToScreen({ x: 320, y: 300 }, viewport), viewport)).toBe("layer-badge");
    expect(scene).toEqual(before);
  });

  it("normalizes drafts and accepts the 1x1 minimum size", () => {
    const bounds = normalizeBounds({ x: 300, y: 220 }, { x: 240, y: 160 });
    expect(bounds).toEqual({ x: 240, y: 160, width: 60, height: 60 });
    expect(hasMinimumBounds(bounds)).toBe(true);
    expect(hasMinimumBounds(normalizeBounds({ x: 0, y: 0 }, { x: 1, y: 1 }))).toBe(true);
  });

  it("hit-tests the highest z layer", () => {
    const scene = createSeedScene();
    const viewport = defaultViewport();
    expect(hitTestScene(scene, "frame-home", worldToScreen({ x: 320, y: 300 }, viewport), viewport)).toBe("layer-badge");
    expect(hitTestScene(scene, "frame-home", { x: 0, y: 0 }, viewport)).toBeUndefined();
  });

  it("uses a model-owned spatial index with visibility and z-order", () => {
    const scene = createSeedScene();
    const index = createSceneSpatialIndex(scene, "frame-home");
    expect(index.queryCandidates({ x: 320, y: 300 })).toEqual(["layer-badge", "layer-card"]);
    expect(index.query({ x: 0, y: 0 })).toBeUndefined();

    scene.frames[0]!.layers[2]!.visible = false;
    const hiddenIndex = createSceneSpatialIndex(scene, "frame-home");
    expect(hiddenIndex.query({ x: 320, y: 300 })).toBe("layer-card");
  });

  it("fails closed when no WASM runtime is provided", () => {
    const canvas = fakeCanvas({ width: 640, height: 360 });
    const renderer = createSceneRenderer(canvas);
    expect(renderer.backend).toBe("unavailable");
    expect(renderer.render(createSeedScene(), "frame-home", defaultViewport())).toEqual({ ok: false, diagnostics: [{ code: "WASM_MODULE_UNAVAILABLE", message: "The WASM renderer is unavailable; no fallback renderer is permitted." }] });
  });

  it("waits for canvas layout through the WASM bridge", () => {
    const renderer = createSceneRenderer(fakeCanvas({ width: 0, height: 0 }), { wasmRuntime: { proof: fakeProof, create: () => ({ setScene: () => undefined, setViewport: () => undefined, render: () => ({ ok: true, diagnostics: [] }), renderFrame: () => ({ ok: true, diagnostics: [] }), dispose: () => undefined }), recover: async () => undefined } });
    expect(renderer.render(createSeedScene(), "frame-home", defaultViewport())).toEqual({ ok: false, diagnostics: [{ code: "CANVAS_NOT_READY", message: "WASM is waiting for the canvas layout before rendering." }] });
  });

  it("does not submit renderFrame packets while waiting for canvas layout", () => {
    const size = { width: 640, height: 360 };
    const submitted: number[] = [];
    const renderer = createSceneRenderer(fakeCanvas(size), {
      wasmRuntime: {
        proof: fakeProof,
        create: () => ({
          setScene: () => undefined,
          setViewport: () => undefined,
          render: () => ({ ok: true, diagnostics: [] }),
          renderFrame: (frame) => {
            if (frame.packetRevision !== undefined)
              submitted.push(frame.packetRevision);
            return { ok: true, diagnostics: [] };
          },
          dispose: () => undefined,
        }),
        recover: async () => undefined,
      },
    });
    const scene = createSeedScene();
    const viewport = { ...defaultViewport(), width: 640, height: 360, pixelRatio: 1 };

    expect(renderer.renderFrame(sceneToRenderFrame(scene, "frame-home", viewport, undefined, 1)).ok).toBe(true);
    size.width = 0;
    expect(
      renderer.renderFrame(sceneToRenderFrame(scene, "frame-home", viewport, undefined, 2))
        .diagnostics[0]?.code,
    ).toBe("CANVAS_NOT_READY");
    size.width = 640;
    expect(renderer.renderFrame(sceneToRenderFrame(scene, "frame-home", viewport, undefined, 2)).ok).toBe(true);

    expect(submitted).toEqual([1, 2]);
  });

  it("passes canonical scene bytes and viewport state through the WASM bridge", () => {
    const size = { width: 640, height: 360 };
    const canvas = fakeCanvas(size);
    const calls: { bytes?: Uint8Array; frameId?: string; viewport?: unknown; size?: unknown } = {};
    const renderer = createSceneRenderer(canvas, {
      wasmRuntime: {
        proof: fakeProof,
        create: () => ({
          setScene: (bytes, frameId) => { calls.bytes = bytes; calls.frameId = frameId; },
          setViewport: (viewport, viewportSize) => { calls.viewport = viewport; calls.size = viewportSize; },
          render: () => ({ ok: true, diagnostics: [] }),
          renderFrame: () => ({ ok: true, diagnostics: [] }),
          dispose: () => undefined
        }),
        recover: async () => undefined
      }
    });
    const result = renderer.render(createSeedScene(), "frame-home", defaultViewport());
    expect(renderer.backend).toBe("wasm");
    expect(result.ok).toBe(true);
    expect(calls.bytes).toBeInstanceOf(Uint8Array);
    expect(calls.frameId).toBe("frame-home");
    expect(calls.viewport).toEqual(defaultViewport());
    expect(calls.size).toEqual({ width: 640, height: 360, pixelRatio: 1 });
  });

  it("projects a legacy scene into the same full packet shape the renderer consumes", () => {
    const scene = createSeedScene();
    const viewport = { ...defaultViewport(), width: 640, height: 360, pixelRatio: 1 };
    const packet = sceneToRenderFrame(scene, "frame-home", viewport, "layer-card", 7);

    expect(packet.protocolVersion).toBe(5);
    expect(packet.frameId).toBe("frame-home");
    expect(packet.viewport).toEqual(viewport);
    expect(packet.documentRevision).toBe(scene.revision);
    expect(packet.packetRevision).toBe(7);
    expect(packet.packetKind).toBe("full");
    expect(packet.commands.map((command) => command.nodeId)).toEqual([
      "frame-home",
      "layer-card",
      "layer-badge",
    ]);
    expect(packet.commands[0]?.zIndex).toBe(-Number.MAX_SAFE_INTEGER);
    expect(packet.commands[1]).toMatchObject({
      nodeId: "layer-card",
      bounds: { x: 0, y: 0, width: 340, height: 210 },
      transform: { a: 1, b: 0, c: 0, d: 1, e: 260, f: 150 },
      order: 1,
    });
    expect(packet.selectionBounds).toEqual({ x: 260, y: 150, width: 340, height: 210 });
  });
});
