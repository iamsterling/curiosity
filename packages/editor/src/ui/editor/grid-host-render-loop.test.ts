import { describe, expect, it } from "vitest";
import {
  GridHostRenderLoop,
  RendererLifecycleCoordinator,
} from "./grid-host-render-loop.js";
import { gridOpacityAt } from "./overlay.js";

interface Packet {
  opacity: number;
  viewport?: { panX: number; panY: number; zoom: number };
}

const unchanged = {
  renderRevision: 4,
  lastRendered: 4,
  resizeDirty: false,
  chromeChanged: false,
  hasAgentActivities: false,
  publishAcceptedGridRenderContext: (_packet: Packet, _opacity: number, _result: unknown): void => {},
};

describe("grid host render loop", () => {
  it.each([
    { zoom: 4, opacity: 0 },
    { zoom: 5.1, opacity: 0 },
    { zoom: 5.55, opacity: 0.3 },
    { zoom: 6, opacity: 0.6 },
    { zoom: 7, opacity: 0.6 },
    { zoom: 8, opacity: 0.6 },
  ])("projects the 5.1x-to-6x grid opacity curve at $zoom", ({ zoom, opacity }) => {
    expect(gridOpacityAt(zoom)).toBeCloseTo(opacity, 12);
  });

  it("does not build packet-only overlays while idle and builds once when emitting", () => {
    const loop = new GridHostRenderLoop<Packet, { ok: boolean }>();
    let overlayBuilds = 0;
    const frame = (renderRevision: number, lastRendered: number) =>
      loop.frame({
        ...unchanged,
        renderRevision,
        lastRendered,
        timestamp: 0,
        targetOpacity: 0,
        buildPacket: (opacity) => {
          overlayBuilds += 1;
          return { opacity };
        },
        submit: () => ({ ok: true }),
      });

    loop.rendererCreated();
    expect(frame(4, 4).emitted).toBe(true);
    expect(overlayBuilds).toBe(1);
    expect(frame(4, 4).emitted).toBe(false);
    expect(overlayBuilds).toBe(1);
    expect(frame(5, 4).emitted).toBe(true);
    expect(overlayBuilds).toBe(2);
  });

  it("submits activation, intermediate, and terminal packets once before idling", () => {
    const packets: Packet[] = [];
    const acceptedOpacities: number[] = [];
    const loop = new GridHostRenderLoop<Packet, { ok: boolean }>();
    const frame = (timestamp: number) =>
      loop.frame({
        ...unchanged,
        timestamp,
        targetOpacity: gridOpacityAt(6),
        publishAcceptedGridRenderContext: (_packet, opacity) =>
          acceptedOpacities.push(opacity),
        buildPacket: (opacity) => ({ opacity }),
        submit: (packet) => {
          packets.push(packet);
          return { ok: true };
        },
      });

    loop.rendererCreated();
    expect(frame(0).emitted).toBe(true);
    expect(frame(225).emitted).toBe(true);
    expect(frame(450).emitted).toBe(true);
    expect(frame(466).emitted).toBe(false);
    expect(packets).toHaveLength(3);
    expect(packets.map((packet) => packet.opacity)).toEqual([0, 0.3, 0.6]);
    expect(acceptedOpacities.slice(0, 3)).toEqual([0, 0.3, 0.6]);
  });

  it("publishes the exact packet viewport only after synchronous submission", () => {
    const events: string[] = [];
    const accepted: Packet[] = [];
    const loop = new GridHostRenderLoop<Packet, { ok: boolean }>();
    loop.rendererCreated();

    loop.frame({
      ...unchanged,
      timestamp: 0,
      targetOpacity: 0.6,
      buildPacket: (opacity) => ({
        opacity,
        viewport: { panX: 17, panY: -9, zoom: 6 },
      }),
      submit: (packet) => {
        events.push("submit");
        expect(packet.viewport).toEqual({ panX: 17, panY: -9, zoom: 6 });
        return { ok: true };
      },
      publishAcceptedGridRenderContext: (packet, _opacity, result) => {
        events.push("publish");
        if (result.ok) accepted.push(packet);
      },
    });

    expect(events).toEqual(["submit", "publish"]);
    expect(accepted[0]?.viewport).toEqual({ panX: 17, panY: -9, zoom: 6 });
  });

  it.each([
    { ok: false, code: "CANVAS_NOT_READY" },
    { ok: false, code: "VELLO_RENDER_FAILED" },
  ])(
    "consumes terminal submission after $code and idles next frame",
    (result) => {
      const packets: Packet[] = [];
      const acceptedOpacities: number[] = [];
      const loop = new GridHostRenderLoop<Packet, typeof result>();
      const input = (timestamp: number) => ({
        ...unchanged,
        timestamp,
        targetOpacity: gridOpacityAt(6),
        publishAcceptedGridRenderContext: (_packet: Packet, opacity: number, submission: typeof result) =>
          acceptedOpacities.push(submission.ok ? opacity : 0),
        buildPacket: (opacity: number) => ({ opacity }),
        submit: (packet: Packet) => {
          packets.push(packet);
          return result;
        },
      });

      loop.rendererCreated();
      loop.frame(input(0));
      loop.frame(input(250));
      loop.frame(input(450));
      expect(loop.frame(input(466)).emitted).toBe(false);
      expect(packets).toHaveLength(3);
      expect(acceptedOpacities).toEqual([0, 0, 0]);
    },
  );

  it.each([
    "initial-creation" as const,
    "recreation" as const,
    "device-recovery" as const,
  ])("reconciles exactly one packet after %s", (cause) => {
    const packets: Packet[] = [];
    const loop = new GridHostRenderLoop<Packet, { ok: boolean }>();
    const observedCauses: string[] = [];
    const acceptedOpacities = [0.6];
    const lifecycle = new RendererLifecycleCoordinator((observedCause) => {
      observedCauses.push(observedCause);
      acceptedOpacities.push(0);
      loop.rendererCreated();
    });
    const frame = (timestamp: number) =>
      loop.frame({
        ...unchanged,
        timestamp,
        targetOpacity: 0,
        buildPacket: (opacity) => ({ opacity }),
        submit: (packet) => {
          packets.push(packet);
          return { ok: true };
        },
      });

    if (cause === "initial-creation") lifecycle.rendererInitiallyCreated();
    else if (cause === "recreation") lifecycle.rendererRecreated();
    else lifecycle.rendererRecovered();
    expect(frame(0).emitted).toBe(true);
    expect(frame(16).emitted).toBe(false);
    expect(packets).toHaveLength(1);
    expect(observedCauses).toEqual([cause]);
    expect(acceptedOpacities).toEqual([0.6, 0]);
  });

  it("ignores stale device recovery after lifecycle replacement", () => {
    const loop = new GridHostRenderLoop<Packet, { ok: boolean }>();
    const lifecycle = new RendererLifecycleCoordinator(() =>
      loop.rendererCreated(),
    );
    const staleRecovery = lifecycle.beginDeviceRecovery();

    lifecycle.replace();

    expect(lifecycle.completeDeviceRecovery(staleRecovery)).toBe(false);
  });

  it("caps a large wall-clock jump to exactly 0.25 seconds", () => {
    const loop = new GridHostRenderLoop<Packet, { ok: boolean }>();
    const opacities: number[] = [];
    const frame = (timestamp: number) =>
      loop.frame({
        ...unchanged,
        timestamp,
        targetOpacity: gridOpacityAt(6),
        buildPacket: (opacity) => ({ opacity }),
        submit: (packet) => {
          opacities.push(packet.opacity);
          return { ok: true };
        },
      });

    loop.rendererCreated();
    frame(0);
    frame(10_000);

    expect(opacities[1]).toBeCloseTo(0.6 * (0.25 / 0.45), 12);
  });
});
