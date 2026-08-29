import {
  PortableAuthorityError,
  decodeMemoryCurationResult,
  type MemoryCurationResult,
  type MemoryCuratorPort,
  type MemoryCuratorRequest,
} from "@curiosity/authority";
import type {
  NativeMemoryCurationRequest,
  NativeMemoryCurationResult,
} from "../modules/curiosity-runtime/src/CuriosityRuntime.types";

export interface MemoryCuratorNativePort {
  cancelMemoryCuration(jobId: string): Promise<void>;
  curateMemory(
    request: NativeMemoryCurationRequest,
  ): Promise<NativeMemoryCurationResult>;
}

const stableNativeCodes = new Set([
  "ACTION_CANCELLED",
  "FOUNDATION_MODEL_CONTEXT_EXCEEDED",
  "FOUNDATION_MODEL_GUARDRAIL_VIOLATION",
  "FOUNDATION_MODEL_LOCALE_UNSUPPORTED",
  "FOUNDATION_MODEL_RATE_LIMITED",
  "FOUNDATION_MODEL_REFUSAL",
  "MEMORY_CURATION_CONTEXT_EXCEEDED",
  "MEMORY_CURATION_DUPLICATE_JOB",
  "MEMORY_CURATION_GENERATION_FAILED",
  "MEMORY_CURATION_REQUEST_INVALID",
  "MEMORY_CURATION_RESULT_INVALID",
  "MEMORY_CURATION_UNAVAILABLE",
]);

const errorCode = (error: unknown): string => {
  if (error && typeof error === "object") {
    const code = (error as { readonly code?: unknown }).code;
    if (typeof code === "string" && stableNativeCodes.has(code)) return code;
  }
  if (error instanceof Error && stableNativeCodes.has(error.message))
    return error.message;
  return "MEMORY_CURATION_GENERATION_FAILED";
};

const validateRoute = (request: MemoryCuratorRequest): void => {
  const { route } = request;
  if (
    route.adapterVersion !== "foundation-models-v1" ||
    route.locality !== "device" ||
    route.modelId !== "apple:system-language-model" ||
    route.providerId !== "apple" ||
    route.purpose !== "memory.curate" ||
    route.requestedRouteId !== "on-device.apple" ||
    route.routeId !== "on-device.apple"
  )
    throw new PortableAuthorityError("GENERATION_ROUTE_MISMATCH");
};

const nativeRequest = (
  request: MemoryCuratorRequest,
): NativeMemoryCurationRequest => ({
  activeMemories: request.activeMemories.map(
    ({ content, kind, memoryId, version }) => ({
      content,
      kind,
      memoryId,
      version,
    }),
  ),
  jobId: request.job.jobId,
  maximumResponseTokens: 768,
  messages: request.messages,
  policyId: request.job.policyId,
  route: {
    adapterVersion: request.route.adapterVersion,
    contextPlanId: request.route.contextPlanId,
    locality: "device",
    modelId: request.route.modelId,
    providerId: "apple",
    purpose: "memory.curate",
    requestedRouteId: "on-device.apple",
    routeId: "on-device.apple",
    selectionId: request.route.selectionId,
    selectionPolicyId: request.route.selectionPolicyId,
  },
  sourceDigest: request.job.sourceDigest,
  sourceMessageIds: request.job.sourceMessageIds,
});

const decodeResult = (
  result: NativeMemoryCurationResult,
  request: MemoryCuratorRequest,
): MemoryCurationResult => {
  if (
    result.jobId !== request.job.jobId ||
    result.modelId !== request.route.modelId ||
    result.policyId !== request.job.policyId ||
    result.selectionId !== request.route.selectionId ||
    result.sourceDigest !== request.job.sourceDigest
  )
    throw new PortableAuthorityError("MEMORY_CURATION_RESULT_STALE");
  return decodeMemoryCurationResult(
    {
      jobId: result.jobId,
      policyId: result.policyId,
      proposals: result.proposals,
      sourceDigest: result.sourceDigest,
    },
    request.job,
  );
};

export const createFoundationModelMemoryCurator = (
  nativeModule: MemoryCuratorNativePort,
): MemoryCuratorPort =>
  Object.freeze({
    curate: async (
      request: MemoryCuratorRequest,
    ): Promise<MemoryCurationResult> => {
      if (request.signal.aborted)
        throw new PortableAuthorityError("ACTION_CANCELLED");
      validateRoute(request);
      const onAbort = () => {
        void nativeModule.cancelMemoryCuration(request.job.jobId);
      };
      request.signal.addEventListener("abort", onAbort, { once: true });
      try {
        const result = await nativeModule.curateMemory(nativeRequest(request));
        if (request.signal.aborted)
          throw new PortableAuthorityError("ACTION_CANCELLED");
        return decodeResult(result, request);
      } catch (error) {
        if (request.signal.aborted)
          throw new PortableAuthorityError("ACTION_CANCELLED");
        if (error instanceof PortableAuthorityError) throw error;
        throw new PortableAuthorityError(errorCode(error));
      } finally {
        request.signal.removeEventListener("abort", onAbort);
      }
    },
  });
