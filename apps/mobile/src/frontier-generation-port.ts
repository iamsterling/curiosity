import {
  PortableAuthorityError,
  type GenerationPort,
  type GenerationRequest,
} from "@curiosity/authority";
import type {
  NativeFrontierGenerationRequest,
  NativeFrontierGenerationResult,
} from "../modules/curiosity-runtime/src/CuriosityRuntime.types";

export interface FrontierGenerationNativePort {
  cancelFrontierGeneration(callId: string): Promise<void>;
  generateFrontier(
    request: NativeFrontierGenerationRequest,
  ): Promise<NativeFrontierGenerationResult>;
}

const stableCodes = new Set([
  "ACTION_CANCELLED",
  "CODEX_DELIVERY_UNKNOWN",
  "CODEX_GENERATION_FAILED",
  "CODEX_GENERATION_INVALID",
  "CODEX_GENERATION_ROUTE_UNAVAILABLE",
  "CODEX_REQUEST_FAILED",
  "CODEX_RESPONSE_INVALID",
  "CODEX_SESSION_REQUIRED",
  "FRONTIER_CONTEXT_EXCEEDED",
  "GENERATION_ROUTE_MISMATCH",
]);

const failureCode = (error: unknown): string => {
  if (error && typeof error === "object") {
    const value = (error as { readonly code?: unknown }).code;
    if (typeof value === "string" && stableCodes.has(value)) return value;
  }
  if (error instanceof Error && stableCodes.has(error.message))
    return error.message;
  return "CODEX_GENERATION_FAILED";
};

const frontierPrompt = (request: GenerationRequest): string => {
  const context = request.contextPlan.blocks
    .map(({ content }) => content)
    .join("\n\n");
  const prompt = [
    "Answer the final user message using the durable conversation below.",
    "Return only the assistant response.",
    "",
    context,
  ].join("\n");
  if (new TextEncoder().encode(prompt).byteLength > 512 * 1_024)
    throw new PortableAuthorityError("FRONTIER_CONTEXT_EXCEEDED");
  return prompt;
};

const routeMatches = (request: GenerationRequest): boolean =>
  request.route.adapterVersion === "codex-direct-native-v1" &&
  request.route.contextPlanId === request.contextPlan.contextPlanId &&
  request.route.locality === "frontier" &&
  request.route.modelId.length > 0 &&
  request.route.modelId.length <= 256 &&
  !/[\u0000-\u0020\u007f]/u.test(request.route.modelId) &&
  request.route.providerId === "openai-oauth" &&
  request.route.purpose === "turn.answer" &&
  request.route.requestedRouteId === "frontier.openai-oauth" &&
  request.route.routeId === "frontier.openai-oauth" &&
  request.route.selectionPolicyId === "apple-operator-role-route-v1";

export const createFrontierGeneration = (
  native: FrontierGenerationNativePort,
): GenerationPort =>
  Object.freeze({
    generate: async (request: GenerationRequest) => {
      if (request.signal.aborted)
        throw new PortableAuthorityError("ACTION_CANCELLED");
      if (!routeMatches(request))
        throw new PortableAuthorityError("GENERATION_ROUTE_MISMATCH");
      if (request.tools.length > 0)
        throw new PortableAuthorityError("GENERATION_ROUTE_MISMATCH");

      let rejectCancellation:
        ((error: PortableAuthorityError) => void) | undefined;
      const cancellation = new Promise<never>((_resolve, reject) => {
        rejectCancellation = reject;
      });
      const cancel = () => {
        void native.cancelFrontierGeneration(request.turnId).finally(() => {
          rejectCancellation?.(new PortableAuthorityError("ACTION_CANCELLED"));
        });
      };
      request.signal.addEventListener("abort", cancel, { once: true });
      const startedAt = Date.now();
      try {
        const result = await Promise.race([
          native.generateFrontier({
            callId: request.turnId,
            maximumOutputTokens: 2_048,
            modelId: request.route.modelId,
            prompt: frontierPrompt(request),
            providerId: "openai-oauth",
          }),
          cancellation,
        ]);
        if (request.signal.aborted)
          throw new PortableAuthorityError("ACTION_CANCELLED");
        if (
          result.callId !== request.turnId ||
          result.maxRetries !== 0 ||
          result.modelId !== request.route.modelId ||
          result.transportAttempts !== 1
        )
          throw new PortableAuthorityError("GENERATION_ROUTE_MISMATCH");
        return Object.freeze({
          durationMs: Math.max(Date.now() - startedAt, 0),
          effort: "frontier",
          modelId: result.modelId,
          text: result.text,
          transportReceipt: Object.freeze({
            callId: result.callId,
            maxRetries: result.maxRetries,
            transportAttempts: result.transportAttempts,
          }),
        });
      } catch (error) {
        if (error instanceof PortableAuthorityError) throw error;
        throw new PortableAuthorityError(failureCode(error));
      } finally {
        request.signal.removeEventListener("abort", cancel);
      }
    },
  });
