import {
  DRAW_PROTOCOL_VERSION,
  isSupportedDrawProtocolVersion,
  type DrawChromeGlassSurface,
  type DrawGlassSurface,
  type RenderFrame,
} from "./draw-protocol.js";

export type RendererFailureStage =
  | "typegpu-init"
  | "pipeline"
  | "buffer-upload"
  | "submit"
  | "device-loss"
  | "vello-encode"
  | "vello-render"
  | "glass-pyramid"
  | "glass-composite";
export type RendererDiagnosticCode =
  | "WEBGPU_UNAVAILABLE"
  | "TYPEGPU_INITIALIZATION_FAILED"
  | "WEBGPU_PIPELINE_FAILED"
  | "WEBGPU_BUFFER_UPLOAD_FAILED"
  | "WEBGPU_SUBMISSION_FAILED"
  | "WEBGPU_DEVICE_LOST"
  | "RENDER_PACKET_INVALID"
  | "VELLO_ENCODE_FAILED"
  | "VELLO_RENDER_FAILED"
  | "GLASS_PYRAMID_FAILED"
  | "GLASS_COMPOSITE_FAILED"
  | "GLASS_SURFACES_CAPPED"
  | "CHROME_GLASS_SURFACES_CAPPED";

export type RendererDiagnosticSeverity = "recoverable" | "critical";

export interface RendererDiagnostic {
  code: RendererDiagnosticCode;
  stage: RendererFailureStage;
  severity: RendererDiagnosticSeverity;
  message: string;
  recovery:
    | "retry-initialization"
    | "retry-render"
    | "recreate-device"
    | "update-client";
  preservation: "authored-state-and-last-valid-packet";
}

export type RendererAvailability = "supported" | "degraded" | "blocked";

export interface RendererCapabilities {
  webgpu: boolean;
  typegpuHost: boolean;
  approvedFallback: "none" | "current-webgpu-host";
}

export interface RendererCapabilityDecision {
  availability: RendererAvailability;
  backend: "typegpu" | "current-webgpu-host" | "none";
  canRender: boolean;
  reason:
    | "native-supported"
    | "approved-fallback"
    | "webgpu-unavailable"
    | "typegpu-host-unavailable";
}

export interface RendererFailureState {
  availability: RendererAvailability;
  lastValidPacket?: Readonly<RenderFrame>;
  diagnostic?: RendererDiagnostic;
}

const failureDetails: Record<
  RendererFailureStage,
  Pick<RendererDiagnostic, "code" | "message" | "recovery">
> = {
  "typegpu-init": {
    code: "TYPEGPU_INITIALIZATION_FAILED",
    message: "The TypeGPU renderer could not initialize.",
    recovery: "retry-initialization",
  },
  pipeline: {
    code: "WEBGPU_PIPELINE_FAILED",
    message: "The WebGPU render pipeline could not be created.",
    recovery: "retry-initialization",
  },
  "buffer-upload": {
    code: "WEBGPU_BUFFER_UPLOAD_FAILED",
    message: "The render packet could not be uploaded to the GPU.",
    recovery: "retry-render",
  },
  submit: {
    code: "WEBGPU_SUBMISSION_FAILED",
    message: "The WebGPU command submission failed.",
    recovery: "retry-render",
  },
  "device-loss": {
    code: "WEBGPU_DEVICE_LOST",
    message: "The WebGPU device was lost.",
    recovery: "recreate-device",
  },
  "vello-encode": {
    code: "VELLO_ENCODE_FAILED",
    message: "The render packet could not be encoded into the Vello scene.",
    recovery: "retry-render",
  },
  "vello-render": {
    code: "VELLO_RENDER_FAILED",
    message: "The Vello render or present step failed.",
    recovery: "retry-render",
  },
  "glass-pyramid": {
    code: "GLASS_PYRAMID_FAILED",
    message: "The glass blur pyramid could not be built.",
    recovery: "retry-render",
  },
  "glass-composite": {
    code: "GLASS_COMPOSITE_FAILED",
    message: "The glass composite pass failed.",
    recovery: "retry-render",
  },
};

/**
 * Maps the module's structured error strings onto the vocabulary diagnostics.
 * The WASM module only ever reports strings (`VELLO_ENCODE_FAILED:<node>:<field>`,
 * `VELLO_RENDER_FAILED:<stage>[:<detail>]`, `WEBGPU_DEVICE_LOST:<detail>` from
 * the device-loss callback); this function is the single place those strings
 * become vocabulary diagnostics, so the policy file stays the only producer
 * of codes. Returns undefined for strings the module does not own — callers
 * fall back to `recordRendererFailure`.
 */
export const diagnosticFromModuleError = (
  message: string,
): RendererDiagnostic | undefined => {
  if (message.startsWith("VELLO_ENCODE_FAILED:")) {
    return {
      code: "VELLO_ENCODE_FAILED",
      stage: "vello-encode",
      severity: "recoverable",
      message: "The render packet could not be encoded into the Vello scene.",
      recovery: "retry-render",
      preservation: "authored-state-and-last-valid-packet",
    };
  }
  if (message.startsWith("VELLO_RENDER_FAILED:")) {
    return {
      code: "VELLO_RENDER_FAILED",
      stage: "vello-render",
      severity: "recoverable",
      message: "The Vello render or present step failed.",
      recovery: "retry-render",
      preservation: "authored-state-and-last-valid-packet",
    };
  }
  if (message.startsWith("GLASS_PYRAMID_FAILED:")) {
    return {
      code: "GLASS_PYRAMID_FAILED",
      stage: "glass-pyramid",
      severity: "recoverable",
      message: "The glass blur pyramid could not be built.",
      recovery: "retry-render",
      preservation: "authored-state-and-last-valid-packet",
    };
  }
  if (message.startsWith("GLASS_COMPOSITE_FAILED:")) {
    return {
      code: "GLASS_COMPOSITE_FAILED",
      stage: "glass-composite",
      severity: "recoverable",
      message: "The glass composite pass failed.",
      recovery: "retry-render",
      preservation: "authored-state-and-last-valid-packet",
    };
  }
  if (message.startsWith("WEBGPU_DEVICE_LOST:")) {
    return {
      code: "WEBGPU_DEVICE_LOST",
      stage: "device-loss",
      severity: "critical",
      message: "The WebGPU device was lost.",
      recovery: "recreate-device",
      preservation: "authored-state-and-last-valid-packet",
    };
  }
  return undefined;
};

export const decideRendererCapabilities = (
  capabilities: RendererCapabilities,
): RendererCapabilityDecision => {
  if (!capabilities.webgpu)
    return {
      availability: "blocked",
      backend: "none",
      canRender: false,
      reason: "webgpu-unavailable",
    };
  if (capabilities.typegpuHost)
    return {
      availability: "supported",
      backend: "typegpu",
      canRender: true,
      reason: "native-supported",
    };
  if (capabilities.approvedFallback === "current-webgpu-host")
    return {
      availability: "degraded",
      backend: "current-webgpu-host",
      canRender: true,
      reason: "approved-fallback",
    };
  return {
    availability: "blocked",
    backend: "none",
    canRender: false,
    reason: "typegpu-host-unavailable",
  };
};

export const createRendererFailureState = (): RendererFailureState => ({
  availability: "supported",
});

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/**
 * The first failing field of a glass surface, as a stable code
 * (`RENDER_PACKET_INVALID:glassSurfaces.<field>`), or undefined when the
 * surface is well-formed. The boundary validator for glass: a malformed
 * surface must fail the frame, never render a partial or corrupt surface.
 */
export const glassSurfaceError = (
  surface: DrawGlassSurface,
): string | undefined => {
  if (typeof surface.nodeId !== "string" || !surface.nodeId)
    return "RENDER_PACKET_INVALID:glassSurfaces.nodeId";
  const { x, y, width, height } = surface.bounds;
  if (![x, y, width, height].every(finite) || width < 0 || height < 0)
    return "RENDER_PACKET_INVALID:glassSurfaces.bounds";
  const transform = surface.transform;
  if (
    ![
      transform.a,
      transform.b,
      transform.c,
      transform.d,
      transform.e,
      transform.f,
    ].every(finite)
  )
    return "RENDER_PACKET_INVALID:glassSurfaces.transform";
  if (!finite(surface.blurRadius) || surface.blurRadius < 0)
    return "RENDER_PACKET_INVALID:glassSurfaces.blurRadius";
  if (
    !surface.tint.every(finite) ||
    surface.tint.some((channel) => channel < 0 || channel > 1)
  )
    return "RENDER_PACKET_INVALID:glassSurfaces.tint";
  if (!finite(surface.saturation) || surface.saturation < 0)
    return "RENDER_PACKET_INVALID:glassSurfaces.saturation";
  if (
    !finite(surface.refraction) ||
    surface.refraction < 0 ||
    surface.refraction > 1
  )
    return "RENDER_PACKET_INVALID:glassSurfaces.refraction";
  if (!finite(surface.opacity) || surface.opacity < 0 || surface.opacity > 1)
    return "RENDER_PACKET_INVALID:glassSurfaces.opacity";
  if (!Number.isSafeInteger(surface.zIndex))
    return "RENDER_PACKET_INVALID:glassSurfaces.zIndex";
  if (!Number.isSafeInteger(surface.order) || surface.order < 0)
    return "RENDER_PACKET_INVALID:glassSurfaces.order";
  if (surface.flat !== undefined && typeof surface.flat !== "boolean")
    return "RENDER_PACKET_INVALID:glassSurfaces.flat";
  return undefined;
};

export const chromeGlassSurfaceError = (
  surface: DrawChromeGlassSurface,
  index: number,
): string | undefined => {
  const field = (name: string): string => `RENDER_PACKET_INVALID:chromeGlass[${index}].${name}`;
  if (typeof surface.id !== "string" || !surface.id) return field("id");
  const { x, y, width, height } = surface.bounds;
  if (![x, y, width, height].every(finite) || width < 0 || height < 0)
    return field("bounds");
  if (!finite(surface.radius) || surface.radius < 0) return field("radius");
  if (![surface.scaleX, surface.scaleY].every(finite) || surface.scaleX <= 0 || surface.scaleY <= 0)
    return field("scale");
  if (!finite(surface.pressed) || surface.pressed < 0 || surface.pressed > 1)
    return field("pressed");
  if (!finite(surface.hovered) || surface.hovered < 0 || surface.hovered > 1)
    return field("hovered");
  if (surface.flat !== undefined && typeof surface.flat !== "boolean")
    return field("flat");
  return undefined;
};

export const retainValidPacket = (
  state: RendererFailureState,
  packet: RenderFrame,
): RendererFailureState => {
  if (isSupportedDrawProtocolVersion(packet.protocolVersion)) {
    const glassError = packet.glassSurfaces
      ?.map(glassSurfaceError)
      .find((error) => error !== undefined);
    if (glassError) {
      return {
        ...state,
        availability: "degraded",
        diagnostic: {
          code: "RENDER_PACKET_INVALID",
          stage: "buffer-upload",
           severity: "recoverable",
          message: glassError,
          recovery: "update-client",
          preservation: "authored-state-and-last-valid-packet",
        },
      };
    }
    const chromeError = packet.chromeGlass
      ?.map(chromeGlassSurfaceError)
      .find((error) => error !== undefined);
    if (chromeError) {
      return {
        ...state,
        availability: "degraded",
        diagnostic: {
          code: "RENDER_PACKET_INVALID",
          stage: "buffer-upload",
           severity: "recoverable",
          message: chromeError,
          recovery: "update-client",
          preservation: "authored-state-and-last-valid-packet",
        },
      };
    }
    return { availability: "supported", lastValidPacket: packet };
  }
  return {
    ...state,
    availability: "degraded",
    diagnostic: {
      code: "RENDER_PACKET_INVALID",
      stage: "buffer-upload",
      severity: "recoverable",
      message: `Render packet protocol ${String(packet.protocolVersion)} is unsupported; expected ${DRAW_PROTOCOL_VERSION}.`,
      recovery: "update-client",
      preservation: "authored-state-and-last-valid-packet",
    },
  };
};

export const recordRendererFailure = (
  state: RendererFailureState,
  stage: RendererFailureStage,
): RendererFailureState => ({
  ...state,
  availability: "degraded",
  diagnostic: {
    ...failureDetails[stage],
    stage,
    severity: stage === "device-loss" || stage === "pipeline" || stage === "typegpu-init" ? "critical" : "recoverable",
    preservation: "authored-state-and-last-valid-packet",
  },
});

export const unavailableWebGpuDiagnostic = (): RendererDiagnostic => ({
  code: "WEBGPU_UNAVAILABLE",
  stage: "typegpu-init",
  severity: "critical",
  message: "WebGPU is unavailable and no renderer backend can be initialized.",
  recovery: "retry-initialization",
  preservation: "authored-state-and-last-valid-packet",
});
