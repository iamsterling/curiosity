import { describe, expect, it } from "vitest";
import type { RenderFrame, WasmRendererRuntime } from "../index.js";
import type { RendererCore } from "../../pkg/crafty_renderer_wasm.js";
import { createModuleErrorRelay, createWebGpuRendererInstance, recoverAfterDeviceLoss, type ModuleErrorRelay } from "./webgpu-renderer.js";

/**
 * Host-side half of the render-failure guarantees (task 5.4). The module
 * seam is a programmable fake: "presenting" happens only when
 * `render_packet` returns, so the fake's `presented` history is exactly the
 * set of frames that reached the surface. The module-side half — nothing is
 * presented on failure, by construction (present is the commit point) — is
 * proven in lib.rs; these tests prove the host reports failures with
 * vocabulary diagnostics and never loses the last presented frame.
 */

const commandAt = (index: number): RenderFrame["commands"][number] => ({
  geometry: "rect",
  nodeId: `rect-${index.toString().padStart(5, "0")}`,
  bounds: { x: index * 10, y: 0, width: 8, height: 8 },
  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  fill: [0.2, 0.4, 0.6, 1],
  opacity: 1,
  zIndex: index,
  order: index,
});

const frameAt = (revision: number, extras: Partial<RenderFrame> = {}): RenderFrame => ({
  protocolVersion: 2,
  frameId: "host-frame",
  viewport: { panX: 0, panY: 0, zoom: 1, width: 640, height: 480, pixelRatio: 1 },
  commands: [commandAt(revision)],
  documentRevision: 1,
  packetRevision: revision,
  ...extras,
});

interface FakeCore {
  core: RendererCore;
  presented: RenderFrame[];
  setSceneCalls: Array<{ bytes: Uint8Array; frameId: string; delta: string | null | undefined }>;
  queue(...packets: RenderFrame[]): void;
  rejectNext(message: string): void;
}

const createFakeCore = (): FakeCore => {
  let queue: string[] = [];
  let rejection: string | undefined;
  const presented: RenderFrame[] = [];
  const setSceneCalls: FakeCore["setSceneCalls"] = [];
  return {
    core: {
      set_scene: (bytes: Uint8Array, frameId: string, delta: string | null | undefined) => { setSceneCalls.push({ bytes, frameId, delta }); },
      set_viewport: () => undefined,
      set_selection: () => undefined,
      render: () => queue.shift() ?? JSON.stringify(frameAt(1)),
      render_packet: (json: string) => {
        if (rejection !== undefined) {
          const message = rejection;
          rejection = undefined;
          throw new Error(message);
        }
        presented.push(JSON.parse(json) as RenderFrame);
      },
    } as unknown as RendererCore,
    presented,
    setSceneCalls,
    queue(...packets) { queue = packets.map((packet) => JSON.stringify(packet)); },
    rejectNext(message) { rejection = message; },
  };
};

const newInstance = (fake: FakeCore, relay = createModuleErrorRelay()) =>
  createWebGpuRendererInstance(fake.core, relay);

describe("module render failures preserve the last valid frame (host half)", () => {
  it("diagnoses a failed render with the vocabulary code and keeps the last presented frame", () => {
    const fake = createFakeCore();
    const instance = newInstance(fake);
    fake.queue(frameAt(1));
    const first = instance.render(undefined, undefined, 1, 1);
    expect(first.ok).toBe(true);
    expect(fake.presented).toHaveLength(1);

    fake.queue(frameAt(2));
    fake.rejectNext("VELLO_ENCODE_FAILED:rect-00002:bounds.x");
    const failed = instance.render(undefined, undefined, 2, 1);
    expect(failed.ok).toBe(false);
    expect(failed.diagnostics[0]?.code).toBe("VELLO_ENCODE_FAILED");
    // Nothing new presented: the failing packet never reached the surface
    // (presenting is the module's commit point), so the last valid frame —
    // the host's and the surface's — is still frame 1.
    expect(fake.presented.map((frame) => frame.packetRevision)).toEqual([1]);

    const retriedFailedRevision = instance.renderFrame(frameAt(2));
    expect(retriedFailedRevision.ok).toBe(true);
    expect(fake.presented.map((frame) => frame.packetRevision)).toEqual([1, 2]);

    fake.queue(frameAt(3));
    const recovered = instance.render(undefined, undefined, 3, 1);
    expect(recovered.ok).toBe(true);
    expect(fake.presented.map((frame) => frame.packetRevision)).toEqual([1, 2, 3]);
  });

  it("maps VELLO_RENDER_FAILED module strings onto the vocabulary diagnostic", () => {
    const fake = createFakeCore();
    const instance = newInstance(fake);
    fake.queue(frameAt(1));
    fake.rejectNext("VELLO_RENDER_FAILED:present:timeout");
    const result = instance.render(undefined, undefined, 1, 1);
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("VELLO_RENDER_FAILED");
    expect(result.diagnostics[0]?.message).toBe("The Vello render or present step failed.");
    expect(fake.presented).toHaveLength(0);
  });
});

describe("stale frames are still discarded before submission", () => {
  it("discards a mismatched document revision without calling the module", () => {
    const fake = createFakeCore();
    const instance = newInstance(fake);
    fake.queue(frameAt(1));
    const result = instance.render(undefined, undefined, 1, 99);
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("STALE_REVISION");
    expect(fake.presented).toHaveLength(0);
  });

  it("discards a non-contiguous packet revision and a superseded request sequence", () => {
    const fake = createFakeCore();
    const instance = newInstance(fake);
    fake.queue(frameAt(1));
    expect(instance.render(undefined, undefined, 5, 1).ok).toBe(true);

    fake.queue(frameAt(3));
    const gap = instance.render(undefined, undefined, 6, 1);
    expect(gap.ok).toBe(false);
    expect(gap.diagnostics[0]?.code).toBe("STALE_REVISION");
    expect(fake.presented).toHaveLength(1);

    fake.queue(frameAt(2));
    expect(instance.render(undefined, undefined, 6, 1).ok).toBe(true);
    expect(fake.presented.map((frame) => frame.packetRevision)).toEqual([1, 2]);

    const stale = instance.render(undefined, undefined, 5, 1);
    expect(stale.ok).toBe(false);
    expect(stale.diagnostics[0]?.message).toContain("superseded");
    expect(fake.presented).toHaveLength(2);

    fake.queue(frameAt(3));
    expect(instance.render(undefined, undefined, 7, 1).ok).toBe(true);
  });

  it("does not let rejected document revisions advance the accepted packet cursor", () => {
    const fake = createFakeCore();
    const instance = newInstance(fake);
    fake.queue(frameAt(1));
    expect(instance.render(undefined, undefined, 1, 1).ok).toBe(true);

    fake.queue(frameAt(2));
    const staleDocument = instance.render(undefined, undefined, 2, 99);
    expect(staleDocument.ok).toBe(false);
    expect(staleDocument.diagnostics[0]?.code).toBe("STALE_REVISION");
    expect(fake.presented.map((frame) => frame.packetRevision)).toEqual([1]);

    const retriedRejectedRevision = instance.renderFrame(frameAt(2));
    expect(retriedRejectedRevision.ok).toBe(true);
    expect(fake.presented.map((frame) => frame.packetRevision)).toEqual([1, 2]);
  });
});

describe("module diagnostics wiring", () => {
  it("surfaces device loss from the error callback until the renderer is recreated", () => {
    const fake = createFakeCore();
    const relay = createModuleErrorRelay();
    const instance = newInstance(fake, relay);
    fake.queue(frameAt(1));
    expect(instance.render(undefined, undefined, 1, 1).ok).toBe(true);

    relay.receive("WEBGPU_DEVICE_LOST:Unknown: GPU was removed");
    const result = instance.render(undefined, undefined, 2, 1);
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("WEBGPU_DEVICE_LOST");
    expect(result.diagnostics[0]?.message).toBe("The WebGPU device was lost.");
    // The lost device blocks rendering entirely: no frame is submitted.
    expect(fake.presented).toHaveLength(1);
  });

  it("reports an uncaptured module error once, then retries the next render", () => {
    const fake = createFakeCore();
    const relay = createModuleErrorRelay();
    const instance = newInstance(fake, relay);
    fake.queue(frameAt(1));
    expect(instance.render(undefined, undefined, 1, 1).ok).toBe(true);

    relay.receive("VELLO_RENDER_FAILED:uncaptured:Validation Error C0DE: something broke");

    fake.queue(frameAt(2));
    const reported = instance.render(undefined, undefined, 2, 1);
    expect(reported.ok).toBe(false);
    expect(reported.diagnostics[0]?.code).toBe("VELLO_RENDER_FAILED");
    expect(reported.diagnostics[0]?.message).toBe("The Vello render or present step failed.");

    fake.queue(frameAt(2));
    const retried = instance.render(undefined, undefined, 3, 1);
    expect(retried.ok).toBe(true);
    expect(fake.presented.map((frame) => frame.packetRevision)).toEqual([1, 2]);
  });

  it("falls back to the failure-policy diagnostic for foreign callback strings", () => {
    const fake = createFakeCore();
    const relay = createModuleErrorRelay();
    const instance = newInstance(fake, relay);
    relay.receive("something the module never reports");

    fake.queue(frameAt(1));
    const result = instance.render(undefined, undefined, 1, 1);
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("VELLO_RENDER_FAILED");
    expect(result.diagnostics[0]?.message).toBe("The Vello render or present step failed.");
  });
});

describe("packet composition and batch re-encode", () => {
  it("submits the host-composed packet: overlay field, selection bounds and preview commands", () => {
    const fake = createFakeCore();
    const instance = newInstance(fake);
    fake.queue(frameAt(1, { selectionBounds: { x: 0, y: 0, width: 8, height: 8 } }));
    const overlay = { grid: { mode: "lines" as const, level: 0, minorStep: 8, majorStep: 40, lines: [{ axis: "x" as const, position: 0, weight: "minor" as const }] } };
    const preview = { x: 60, y: 30, width: 20, height: 10 };

    const result = instance.render("rect-00001", preview, 1, 1, overlay);
    expect(result.ok).toBe(true);
    expect(result.selectionBounds).toEqual({ x: 0, y: 0, width: 8, height: 8 });
    expect(result.evidence).toEqual({
      backend: "webgpu",
      protocolVersion: 2,
      commandCount: 6,
      documentRevision: 1,
      packetRevision: 1,
    });

    const submitted = fake.presented[0];
    expect(submitted?.overlay).toEqual(overlay);
    expect(submitted?.selectionBounds).toEqual({ x: 0, y: 0, width: 8, height: 8 });
    expect(submitted?.commands.map((command) => command.nodeId)).toEqual([
      "rect-00001",
      "preview",
      "preview-outline-top",
      "preview-outline-bottom",
      "preview-outline-left",
      "preview-outline-right",
    ]);
  });

  it("submits a caller-composed full packet without setting a legacy scene", () => {
    const fake = createFakeCore();
    const instance = newInstance(fake);
    const packet = frameAt(1, {
      commands: [commandAt(1), commandAt(2)],
      selectionBounds: { x: 10, y: 0, width: 8, height: 8 },
    });

    const result = instance.renderFrame(packet);

    expect(result.ok).toBe(true);
    expect(fake.setSceneCalls).toEqual([]);
    expect(fake.presented).toEqual([packet]);
    expect(result.selectionBounds).toEqual(packet.selectionBounds);
    expect(result.evidence?.commandCount).toBe(2);
  });

  it("re-encodes a v2 batch packet as a full packet before submission", () => {
    const fake = createFakeCore();
    const instance = newInstance(fake);
    const bytes = new TextEncoder().encode("{}");
    instance.setScene(bytes, "frame-1", JSON.stringify({ changedNodeIds: ["rect-00001"] }));
    fake.queue(
      frameAt(1, { changedNodeIds: ["rect-00001"], commands: [commandAt(1)] }),
      frameAt(2, { commands: [commandAt(1), commandAt(2)] }),
    );

    const result = instance.render(undefined, undefined, 1, 1);
    expect(result.ok).toBe(true);
    // The host re-requested a full re-encode from the encoder with no delta.
    expect(fake.setSceneCalls[1]).toEqual({ bytes, frameId: "frame-1", delta: undefined });
    const submitted = fake.presented[0];
    expect(submitted?.changedNodeIds).toBeUndefined();
    expect(submitted?.commands.map((command) => command.nodeId)).toEqual(["rect-00001", "rect-00002"]);
    expect(submitted?.packetRevision).toBe(2);
  });

  it("discards a batch packet that arrives without a remembered scene", () => {
    const fake = createFakeCore();
    const instance = newInstance(fake);
    fake.queue(frameAt(1, { changedNodeIds: ["rect-00001"], commands: [commandAt(1)] }));
    const result = instance.render(undefined, undefined, 1, 1);
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("STALE_REVISION");
    expect(fake.presented).toHaveLength(0);
  });

  it("treats an explicit removal-only batch as a batch", () => {
    const fake = createFakeCore();
    const instance = newInstance(fake);
    const bytes = new TextEncoder().encode("scene");
    instance.setScene(bytes, "frame-1");
    fake.queue(
      frameAt(1, {
        protocolVersion: 5,
        packetKind: "batch",
        commands: [],
        changedNodeIds: ["rect-00001"],
      }),
      frameAt(2, { protocolVersion: 5, commands: [commandAt(2)] }),
    );

    const result = instance.render(undefined, undefined, 1, 1);
    expect(result.ok).toBe(true);
    expect(fake.setSceneCalls[1]).toEqual({
      bytes,
      frameId: "frame-1",
      delta: undefined,
    });
    expect(fake.presented[0]?.packetKind).toBeUndefined();
    expect(fake.presented[0]?.commands).toEqual([commandAt(2)]);
  });
});

describe("device-loss recovery prefers same-core re-init", () => {
  const runtimeWithRecover = (recover: () => Promise<void>): WasmRendererRuntime => ({
    proof: { wasm: { verified: true, exports: [], memoryBytes: 0 }, webgpu: { verified: true, format: "bgra8unorm", device: "module-owned", surface: "module-owned" } },
    create: () => { throw new Error("unused"); },
    recover,
  });

  it("re-runs init_canvas on the same runtime and reports device-recreated", async () => {
    let initCalls = 0;
    const outcome = await recoverAfterDeviceLoss(
      runtimeWithRecover(async () => { initCalls += 1; }),
    );
    expect(outcome).toBe("device-recreated");
    expect(initCalls).toBe(1);
  });

  it("falls back to runtime re-acquisition when the same-core re-init fails", async () => {
    let initCalls = 0;
    const outcome = await recoverAfterDeviceLoss(
      runtimeWithRecover(async () => { initCalls += 1; throw new Error("VELLO_RENDER_FAILED:init:device:request rejected"); }),
    );
    expect(outcome).toBe("runtime-reacquired");
    expect(initCalls).toBe(1);
  });

  it("re-acquires when no runtime exists yet", async () => {
    expect(await recoverAfterDeviceLoss(undefined)).toBe("runtime-reacquired");
  });
});
