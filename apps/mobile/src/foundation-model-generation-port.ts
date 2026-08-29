import {
  PortableAuthorityError,
  type GenerationPort,
  type GenerationRequest,
} from "@curiosity/authority";
import type {
  GenerationDeltaEvent,
  NativeGenerationRequest,
  NativeGenerationResult,
} from "../modules/curiosity-runtime/src/CuriosityRuntime.types";

interface NativeSubscription {
  remove(): void;
}

export interface FoundationModelNativePort {
  addListener(
    event: "onGenerationDelta",
    listener: (event: GenerationDeltaEvent) => void,
  ): NativeSubscription;
  cancelGeneration(turnId: string): Promise<void>;
  generate(request: NativeGenerationRequest): Promise<NativeGenerationResult>;
}

const stableNativeCodes = new Set([
  "ACTION_CANCELLED",
  "FOUNDATION_MODEL_CONTEXT_EXCEEDED",
  "FOUNDATION_MODEL_GENERATION_FAILED",
  "FOUNDATION_MODEL_GUARDRAIL_VIOLATION",
  "FOUNDATION_MODEL_LOCALE_UNSUPPORTED",
  "FOUNDATION_MODEL_RATE_LIMITED",
  "FOUNDATION_MODEL_REFUSAL",
  "FOUNDATION_MODEL_TOOL_BRIDGE_UNAVAILABLE",
  "FOUNDATION_MODEL_UNAVAILABLE",
  "GENERATION_ROUTE_MISMATCH",
]);

const errorCode = (error: unknown): string => {
  if (error && typeof error === "object") {
    const code = (error as { readonly code?: unknown }).code;
    if (typeof code === "string" && stableNativeCodes.has(code)) return code;
  }
  if (error instanceof Error && stableNativeCodes.has(error.message))
    return error.message;
  return "FOUNDATION_MODEL_GENERATION_FAILED";
};

export const createFoundationModelGeneration = (
  nativeModule: FoundationModelNativePort,
): GenerationPort =>
  Object.freeze({
    generate: async (
      request: GenerationRequest,
      onDelta?: (delta: string) => void,
    ) => {
      if (request.signal.aborted)
        throw new PortableAuthorityError("ACTION_CANCELLED");
      if (
        request.route.contextPlanId !== request.contextPlan.contextPlanId ||
        request.route.locality !== "device" ||
        request.route.providerId !== "apple" ||
        request.route.routeId !== "on-device.apple" ||
        request.route.requestedRouteId !== "on-device.apple" ||
        request.route.modelId !== "apple:system-language-model"
      )
        throw new PortableAuthorityError("GENERATION_ROUTE_MISMATCH");
      if (request.tools.length > 0)
        throw new PortableAuthorityError(
          "FOUNDATION_MODEL_TOOL_BRIDGE_UNAVAILABLE",
        );

      const turnId = request.turnId;
      const subscription = nativeModule.addListener(
        "onGenerationDelta",
        (event) => {
          if (event.turnId === turnId) onDelta?.(event.delta);
        },
      );
      let rejectCancellation: ((error: PortableAuthorityError) => void) | undefined;
      const cancellation = new Promise<never>((_resolve, reject) => {
        rejectCancellation = reject;
      });
      const cancel = () => {
        void nativeModule.cancelGeneration(turnId).then(
          () => rejectCancellation?.(new PortableAuthorityError("ACTION_CANCELLED")),
          (error: unknown) =>
            rejectCancellation?.(new PortableAuthorityError(errorCode(error))),
        );
      };
      request.signal.addEventListener("abort", cancel, { once: true });
      try {
        const result = await Promise.race([
          nativeModule.generate({
            maximumResponseTokens: 2_048,
            messages: request.messages,
            toolCount: request.tools.length,
            turnId,
          }),
          cancellation,
        ]);
        if (request.signal.aborted)
          throw new PortableAuthorityError("ACTION_CANCELLED");
        if (result.modelId !== request.route.modelId)
          throw new PortableAuthorityError("GENERATION_ROUTE_MISMATCH");
        return result;
      } catch (error) {
        throw new PortableAuthorityError(errorCode(error));
      } finally {
        request.signal.removeEventListener("abort", cancel);
        subscription.remove();
      }
    },
  });
