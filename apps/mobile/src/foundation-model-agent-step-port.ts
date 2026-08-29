import {
  agentStepMaximumResponseTokens,
  assertAgentStepEnvelope,
  canonicalJson,
  decodeAgentStepProposal,
  PortableAuthorityError,
  type AgentStepPort,
  type AgentStepRequest,
  type AgentStepResult,
} from "@curiosity/authority";
import type {
  NativeAgentStepRequest,
  NativeAgentStepResult,
} from "../modules/curiosity-runtime/src/CuriosityRuntime.types";

export interface AgentStepNativePort {
  agentStep(request: NativeAgentStepRequest): Promise<NativeAgentStepResult>;
  cancelAgentStep(stepId: string): Promise<void>;
}

const codes = new Set([
  "ACTION_CANCELLED",
  "AGENT_STEP_DUPLICATE",
  "AGENT_STEP_PROPOSAL_INVALID",
  "AGENT_STEP_REQUEST_INVALID",
  "FOUNDATION_MODEL_CONTEXT_EXCEEDED",
  "FOUNDATION_MODEL_GENERATION_FAILED",
  "FOUNDATION_MODEL_GUARDRAIL_VIOLATION",
  "FOUNDATION_MODEL_LOCALE_UNSUPPORTED",
  "FOUNDATION_MODEL_RATE_LIMITED",
  "FOUNDATION_MODEL_REFUSAL",
  "FOUNDATION_MODEL_UNAVAILABLE",
]);

const code = (error: unknown): string => {
  if (error && typeof error === "object") {
    const value = (error as { readonly code?: unknown }).code;
    if (typeof value === "string" && codes.has(value)) return value;
  }
  if (error instanceof Error && codes.has(error.message)) return error.message;
  return "FOUNDATION_MODEL_GENERATION_FAILED";
};

const routeMatches = (request: AgentStepRequest): boolean =>
  request.route.adapterVersion === "foundation-models-v1" &&
  request.route.contextPlanId === request.contextPlan.contextPlanId &&
  request.route.locality === "device" &&
  request.route.modelId === "apple:system-language-model" &&
  request.route.providerId === "apple" &&
  request.route.purpose === "agent.step" &&
  request.route.requestedRouteId === "on-device.apple" &&
  request.route.routeId === "on-device.apple";

const nativeRequest = (request: AgentStepRequest): NativeAgentStepRequest => ({
  agent: request.agent,
  availableTools: request.availableTools.map((tool) => ({
    description: tool.description,
    inputSchemaJSON: canonicalJson(tool.inputSchema),
    toolId: tool.toolId,
    version: tool.version,
  })),
  contextPlan: request.contextPlan,
  finalizationOnly: request.finalizationOnly,
  maximumResponseTokens: agentStepMaximumResponseTokens,
  observedRunRevision: request.observedRunRevision,
  observedStateDigest: request.observedStateDigest,
  route: {
    adapterVersion: "foundation-models-v1",
    contextPlanId: request.route.contextPlanId,
    locality: "device",
    modelId: "apple:system-language-model",
    providerId: "apple",
    purpose: "agent.step",
    requestedRouteId: "on-device.apple",
    routeId: "on-device.apple",
    selectionId: request.route.selectionId,
    selectionPolicyId: request.route.selectionPolicyId,
  },
  runId: request.runId,
  stepId: request.stepId,
  stepNumber: request.stepNumber,
});

const validateIdentity = (
  result: NativeAgentStepResult,
  request: AgentStepRequest,
): void => {
  if (
    result.contextPlanId !== request.contextPlan.contextPlanId ||
    result.modelId !== request.route.modelId ||
    result.observedRunRevision !== request.observedRunRevision ||
    result.observedStateDigest !== request.observedStateDigest ||
    result.runId !== request.runId ||
    result.selectionId !== request.route.selectionId ||
    result.stepId !== request.stepId ||
    result.stepNumber !== request.stepNumber
  )
    throw new PortableAuthorityError("AGENT_STEP_RESULT_STALE");
};

const validateProposalAuthority = (
  result: AgentStepResult,
  request: AgentStepRequest,
): void => {
  const { proposal } = result;
  if (request.finalizationOnly && proposal.kind === "actions")
    throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
  if (proposal.kind === "actions") {
    const tools = new Map(
      request.availableTools.map((tool) => [tool.toolId, tool.version]),
    );
    if (
      proposal.actions.some(
        (action) => tools.get(action.toolId) !== action.toolVersion,
      )
    )
      throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
  }
  if (proposal.kind === "final") {
    const sources = new Set(
      request.contextPlan.blocks.flatMap((block) => [
        block.blockId,
        ...block.sourceEventIds,
      ]),
    );
    if (proposal.citations.some(({ sourceId }) => !sources.has(sourceId)))
      throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
  }
};

export const createFoundationModelAgentStep = (
  native: AgentStepNativePort,
): AgentStepPort => ({
  step: async (request): Promise<AgentStepResult> => {
    if (request.signal.aborted)
      throw new PortableAuthorityError("ACTION_CANCELLED");
    if (!routeMatches(request))
      throw new PortableAuthorityError("GENERATION_ROUTE_MISMATCH");
    assertAgentStepEnvelope(request);
    const cancel = () => {
      void native.cancelAgentStep(request.stepId);
    };
    request.signal.addEventListener("abort", cancel, { once: true });
    try {
      const nativeResult = await native.agentStep(nativeRequest(request));
      if (request.signal.aborted)
        throw new PortableAuthorityError("ACTION_CANCELLED");
      validateIdentity(nativeResult, request);
      const result: AgentStepResult = {
        ...nativeResult,
        proposal: decodeAgentStepProposal(nativeResult.proposal),
      };
      validateProposalAuthority(result, request);
      return result;
    } catch (error) {
      if (request.signal.aborted)
        throw new PortableAuthorityError("ACTION_CANCELLED");
      if (error instanceof PortableAuthorityError) throw error;
      throw new PortableAuthorityError(code(error));
    } finally {
      request.signal.removeEventListener("abort", cancel);
    }
  },
});
