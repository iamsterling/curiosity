import { describe, expect, it } from "vitest";
import { DRAW_PROTOCOL_VERSION, type DrawGlassSurface, type RenderFrame } from "./draw-protocol.js";
import {
  createRendererFailureState,
  decideRendererCapabilities,
  diagnosticFromModuleError,
  recordRendererFailure,
  retainValidPacket,
  unavailableWebGpuDiagnostic,
} from "./failure-policy.js";

const frame = (frameId: string): RenderFrame => ({
  protocolVersion: 1,
  frameId,
  viewport: {
    width: 640,
    height: 360,
    pixelRatio: 1,
    panX: 0,
    panY: 0,
    zoom: 1,
  },
  commands: [],
});

const glassSurface = (overrides: Partial<DrawGlassSurface> = {}): DrawGlassSurface => ({
  nodeId: "glass-panel",
  bounds: { x: 0, y: 0, width: 100, height: 80 },
  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  blurRadius: 24,
  tint: [1, 1, 1, 0.6],
  saturation: 1.4,
  refraction: 0.15,
  opacity: 1,
  zIndex: 1,
  order: 1,
  ...overrides,
});

describe("renderer capability policy", () => {
  it("supports the TypeGPU host only when WebGPU and the candidate are available", () => {
    expect(
      decideRendererCapabilities({
        webgpu: true,
        typegpuHost: true,
        approvedFallback: "none",
      }),
    ).toEqual({
      availability: "supported",
      backend: "typegpu",
      canRender: true,
      reason: "native-supported",
    });
  });

  it("blocks unavailable WebGPU without claiming an alternate backend", () => {
    expect(
      decideRendererCapabilities({
        webgpu: false,
        typegpuHost: true,
        approvedFallback: "current-webgpu-host",
      }),
    ).toEqual({
      availability: "blocked",
      backend: "none",
      canRender: false,
      reason: "webgpu-unavailable",
    });
    expect(unavailableWebGpuDiagnostic()).toMatchObject({
      code: "WEBGPU_UNAVAILABLE",
      stage: "typegpu-init",
      preservation: "authored-state-and-last-valid-packet",
    });
  });

  it("uses only the explicitly approved current WebGPU host as a degraded fallback", () => {
    expect(
      decideRendererCapabilities({
        webgpu: true,
        typegpuHost: false,
        approvedFallback: "current-webgpu-host",
      }),
    ).toEqual({
      availability: "degraded",
      backend: "current-webgpu-host",
      canRender: true,
      reason: "approved-fallback",
    });
    expect(
      decideRendererCapabilities({
        webgpu: true,
        typegpuHost: false,
        approvedFallback: "none",
      }),
    ).toMatchObject({
      availability: "blocked",
      backend: "none",
      canRender: false,
    });
  });
});

describe("renderer failure state", () => {
  it.each([
    ["typegpu-init", "TYPEGPU_INITIALIZATION_FAILED"],
    ["pipeline", "WEBGPU_PIPELINE_FAILED"],
    ["buffer-upload", "WEBGPU_BUFFER_UPLOAD_FAILED"],
    ["submit", "WEBGPU_SUBMISSION_FAILED"],
    ["device-loss", "WEBGPU_DEVICE_LOST"],
    ["vello-encode", "VELLO_ENCODE_FAILED"],
    ["vello-render", "VELLO_RENDER_FAILED"],
  ] as const)(
    "classifies %s failures and preserves the last valid packet",
    (stage, code) => {
      const valid = frame("last-valid");
      const failed = recordRendererFailure(
        retainValidPacket(createRendererFailureState(), valid),
        stage,
      );
      expect(failed).toMatchObject({
        availability: "degraded",
        diagnostic: {
          code,
          stage,
        severity: stage === "device-loss" || stage === "pipeline" || stage === "typegpu-init" ? "critical" : "recoverable",
          preservation: "authored-state-and-last-valid-packet",
        },
      });
      expect(failed.lastValidPacket).toBe(valid);
    },
  );

  it("rejects an invalid packet without replacing the last valid packet", () => {
    const valid = frame("last-valid");
    const invalid = {
      ...frame("invalid"),
      protocolVersion: 6,
    } as unknown as RenderFrame;
    const result = retainValidPacket(
      retainValidPacket(createRendererFailureState(), valid),
      invalid,
    );
    expect(result.lastValidPacket).toBe(valid);
    expect(result).toMatchObject({
      availability: "degraded",
      diagnostic: { code: "RENDER_PACKET_INVALID", recovery: "update-client" },
    });
  });

  it("rejects a malformed glass surface with a stable code and keeps the last valid packet", () => {
    const valid = frame("last-valid");
    const bad = { ...frame("invalid"), glassSurfaces: [{ ...glassSurface(), blurRadius: -1 }] } as unknown as RenderFrame;
    const rejected = retainValidPacket(retainValidPacket(createRendererFailureState(), valid), bad);
    expect(rejected.availability).toBe("degraded");
    expect(rejected.diagnostic?.code).toBe("RENDER_PACKET_INVALID");
    expect(rejected.diagnostic?.message).toBe("RENDER_PACKET_INVALID:glassSurfaces.blurRadius");
    expect(rejected.lastValidPacket).toBe(valid);
  });

  it("accepts a glass surface whose flat flag is a boolean", () => {
    const accepted = retainValidPacket(createRendererFailureState(), {
      ...frame("valid"),
      glassSurfaces: [{ ...glassSurface(), flat: true }],
    } as unknown as RenderFrame);
    expect(accepted.availability).toBe("supported");
  });

  it("accepts protocol v1, v2, v3 and v4 packets as the retained protocol", () => {
    const v1 = retainValidPacket(createRendererFailureState(), frame("v1"));
    expect(v1.availability).toBe("supported");
    expect(v1.lastValidPacket).toEqual(frame("v1"));
    const v2 = retainValidPacket(createRendererFailureState(), {
      ...frame("v2"),
      protocolVersion: 2,
      documentRevision: 4,
      packetRevision: 1,
    });
    expect(v2.availability).toBe("supported");
    expect(v2.lastValidPacket).toMatchObject({
      protocolVersion: 2,
      documentRevision: 4,
      packetRevision: 1,
    });
    const v3 = retainValidPacket(createRendererFailureState(), {
      ...frame("v3"),
      protocolVersion: 3,
    });
    expect(v3.availability).toBe("supported");
    expect(v3.lastValidPacket).toMatchObject({ protocolVersion: 3 });
    const v4 = retainValidPacket(createRendererFailureState(), {
      ...frame("v4"),
      protocolVersion: DRAW_PROTOCOL_VERSION,
    });
    expect(v4.availability).toBe("supported");
    expect(v4.lastValidPacket).toMatchObject({ protocolVersion: DRAW_PROTOCOL_VERSION });
  });
});

describe("module error mapping", () => {
  it.each([
    ["VELLO_ENCODE_FAILED:node-7:geometry", "VELLO_ENCODE_FAILED", "vello-encode", "retry-render"],
    ["VELLO_RENDER_FAILED:device-not-initialized", "VELLO_RENDER_FAILED", "vello-render", "retry-render"],
    ["VELLO_RENDER_FAILED:present:timeout", "VELLO_RENDER_FAILED", "vello-render", "retry-render"],
    ["GLASS_PYRAMID_FAILED:copy", "GLASS_PYRAMID_FAILED", "glass-pyramid", "retry-render"],
    ["GLASS_COMPOSITE_FAILED:pyramid-missing", "GLASS_COMPOSITE_FAILED", "glass-composite", "retry-render"],
    ["WEBGPU_DEVICE_LOST:Unknown: device removed", "WEBGPU_DEVICE_LOST", "device-loss", "recreate-device"],
  ] as const)(
    "maps the module string %s onto the %s vocabulary diagnostic",
      (message, code, stage, recovery) => {
      const diagnostic = diagnosticFromModuleError(message);
      expect(diagnostic).toMatchObject({
        code,
        stage,
        recovery,
        preservation: "authored-state-and-last-valid-packet",
      });
      expect(diagnostic?.message).not.toContain("node-7");
      expect(diagnostic?.message).not.toContain("device removed");
      expect(diagnostic?.severity).toBe(code === "WEBGPU_DEVICE_LOST" ? "critical" : "recoverable");
    },
  );

  it("does not claim strings the module does not own", () => {
    expect(diagnosticFromModuleError("Scene decode failed: unexpected end of input")).toBeUndefined();
    expect(diagnosticFromModuleError("")).toBeUndefined();
  });
});
