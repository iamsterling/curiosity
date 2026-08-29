import { canonicalJson, utf8ByteLength } from "./canonical-json.js";
import { PortableAuthorityError } from "./domain.js";
import type { ContextPlan } from "./context-plan.js";
import type { GenerationRouteReceipt } from "./generation-route.js";

export const agentStepAllocatableTokens = 3_480;
export const agentStepMaximumResponseTokens = 768;
export const agentStepPromptReserveTokens = 768;

export interface AgentIdentitySnapshot {
  readonly id: string;
  readonly version: string;
}

export interface AgentToolDefinitionSnapshot {
  readonly description: string;
  readonly inputSchema: unknown;
  readonly toolId: string;
  readonly version: string;
}

export interface AgentStepRequest {
  readonly agent: AgentIdentitySnapshot;
  readonly availableTools: readonly AgentToolDefinitionSnapshot[];
  readonly contextPlan: ContextPlan;
  readonly finalizationOnly: boolean;
  readonly observedRunRevision: number;
  readonly observedStateDigest: string;
  readonly route: GenerationRouteReceipt;
  readonly runId: string;
  readonly signal: AbortSignal;
  readonly stepId: string;
  readonly stepNumber: number;
}

export interface AgentCitationProposal {
  readonly excerpt?: string;
  readonly locator?: string;
  readonly sourceId: string;
}

export interface AgentToolCallProposal {
  readonly callKey: string;
  readonly input: unknown;
  readonly toolId: string;
  readonly toolVersion: string;
}

export interface AgentQuestionProposal {
  readonly allowFreeText: boolean;
  readonly options: readonly string[];
  readonly prompt: string;
}

export type AgentStepProposal =
  | {
      readonly assistantState?: unknown;
      readonly citations: readonly AgentCitationProposal[];
      readonly kind: "final";
      readonly text: string;
    }
  | {
      readonly actions: readonly AgentToolCallProposal[];
      readonly assistantState?: unknown;
      readonly kind: "actions";
    }
  | {
      readonly assistantState?: unknown;
      readonly kind: "question";
      readonly question: AgentQuestionProposal;
    }
  | {
      readonly assistantState?: unknown;
      readonly kind: "no-go";
      readonly reasonCode: string;
    };

export interface AgentStepResult {
  readonly contextPlanId: string;
  readonly durationMs: number;
  readonly modelId: string;
  readonly observedRunRevision: number;
  readonly observedStateDigest: string;
  readonly proposal: AgentStepProposal;
  readonly runId: string;
  readonly selectionId: string;
  readonly stepId: string;
  readonly stepNumber: number;
}

export interface AgentStepPort {
  readonly step: (request: AgentStepRequest) => Promise<AgentStepResult>;
}

const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;
const digestPattern = /^[a-f0-9]{64}$/u;

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const exactKeys = (
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean => {
  const keys = Object.keys(value);
  return (
    required.every((key) => keys.includes(key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key))
  );
};

const identifier = (value: unknown): value is string =>
  typeof value === "string" && identifierPattern.test(value);

const boundedText = (
  value: unknown,
  maximumBytes: number,
): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  utf8ByteLength(value) <= maximumBytes;

const assistantState = (
  value: Record<string, unknown>,
): { readonly assistantState?: unknown } => {
  if (!("assistantState" in value)) return {};
  try {
    if (utf8ByteLength(canonicalJson(value.assistantState)) > 8_192)
      throw new Error("oversized");
  } catch {
    throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
  }
  return { assistantState: value.assistantState };
};

const decodeCitation = (value: unknown): AgentCitationProposal => {
  const item = record(value);
  if (
    !item ||
    !exactKeys(item, ["sourceId"], ["excerpt", "locator"]) ||
    !identifier(item.sourceId) ||
    (item.excerpt !== undefined && !boundedText(item.excerpt, 4_096)) ||
    (item.locator !== undefined && !boundedText(item.locator, 2_048))
  )
    throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
  return Object.freeze({
    ...(item.excerpt === undefined ? {} : { excerpt: item.excerpt as string }),
    ...(item.locator === undefined ? {} : { locator: item.locator as string }),
    sourceId: item.sourceId,
  });
};

const decodeAction = (value: unknown): AgentToolCallProposal => {
  const item = record(value);
  if (
    !item ||
    !exactKeys(item, ["callKey", "input", "toolId", "toolVersion"]) ||
    !identifier(item.callKey) ||
    !identifier(item.toolId) ||
    !identifier(item.toolVersion)
  )
    throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
  canonicalJson(item.input);
  return Object.freeze({
    callKey: item.callKey,
    input: item.input,
    toolId: item.toolId,
    toolVersion: item.toolVersion,
  });
};

const decodeQuestion = (value: unknown): AgentQuestionProposal => {
  const item = record(value);
  if (
    !item ||
    !exactKeys(item, ["allowFreeText", "options", "prompt"]) ||
    typeof item.allowFreeText !== "boolean" ||
    !Array.isArray(item.options) ||
    item.options.length > 8 ||
    item.options.some((option) => !boundedText(option, 1_024)) ||
    new Set(item.options).size !== item.options.length ||
    (!item.allowFreeText && item.options.length === 0) ||
    !boundedText(item.prompt, 4_096)
  )
    throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
  return Object.freeze({
    allowFreeText: item.allowFreeText,
    options: Object.freeze([...(item.options as string[])]),
    prompt: item.prompt,
  });
};

export const decodeAgentStepProposal = (
  value: unknown,
): AgentStepProposal => {
  const proposal = record(value);
  if (!proposal || typeof proposal.kind !== "string")
    throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
  if (proposal.kind === "final") {
    if (
      !exactKeys(proposal, ["citations", "kind", "text"], ["assistantState"]) ||
      !boundedText(proposal.text, 16_384) ||
      !Array.isArray(proposal.citations) ||
      proposal.citations.length > 8
    )
      throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
    return Object.freeze({
      ...assistantState(proposal),
      citations: Object.freeze(proposal.citations.map(decodeCitation)),
      kind: "final",
      text: proposal.text,
    });
  }
  if (proposal.kind === "actions") {
    if (
      !exactKeys(proposal, ["actions", "kind"], ["assistantState"]) ||
      !Array.isArray(proposal.actions) ||
      proposal.actions.length < 1 ||
      proposal.actions.length > 8
    )
      throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
    const actions = proposal.actions.map(decodeAction);
    if (new Set(actions.map(({ callKey }) => callKey)).size !== actions.length)
      throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
    return Object.freeze({
      actions: Object.freeze(actions),
      ...assistantState(proposal),
      kind: "actions",
    });
  }
  if (proposal.kind === "question") {
    if (
      !exactKeys(proposal, ["kind", "question"], ["assistantState"])
    )
      throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
    return Object.freeze({
      ...assistantState(proposal),
      kind: "question",
      question: decodeQuestion(proposal.question),
    });
  }
  if (proposal.kind === "no-go") {
    if (
      !exactKeys(proposal, ["kind", "reasonCode"], ["assistantState"]) ||
      !identifier(proposal.reasonCode)
    )
      throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
    return Object.freeze({
      ...assistantState(proposal),
      kind: "no-go",
      reasonCode: proposal.reasonCode,
    });
  }
  throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
};

export const estimateAgentStepInputTokens = (
  request: Omit<AgentStepRequest, "signal">,
): number =>
  Math.ceil(
    utf8ByteLength(
      canonicalJson({
        agent: request.agent,
        availableTools: request.availableTools,
        contextPlan: request.contextPlan,
        finalizationOnly: request.finalizationOnly,
        observedRunRevision: request.observedRunRevision,
        observedStateDigest: request.observedStateDigest,
        runId: request.runId,
        stepId: request.stepId,
        stepNumber: request.stepNumber,
      }),
    ) / 3,
  ) + agentStepPromptReserveTokens;

export const assertAgentStepEnvelope = (
  request: Omit<AgentStepRequest, "signal">,
): void => {
  if (
    !identifier(request.runId) ||
    !identifier(request.stepId) ||
    !identifier(request.agent.id) ||
    !identifier(request.agent.version) ||
    !Number.isSafeInteger(request.stepNumber) ||
    request.stepNumber < 1 ||
    !Number.isSafeInteger(request.observedRunRevision) ||
    request.observedRunRevision < 0 ||
    !digestPattern.test(request.observedStateDigest) ||
    request.contextPlan.contextPlanId !== request.route.contextPlanId ||
    request.availableTools.length > 8 ||
    new Set(request.availableTools.map(({ toolId }) => toolId)).size !==
      request.availableTools.length ||
    request.availableTools.some(
      (tool) =>
        !identifier(tool.toolId) ||
        !identifier(tool.version) ||
        !boundedText(tool.description, 4_096),
    )
  )
    throw new PortableAuthorityError("AGENT_STEP_REQUEST_INVALID");
  for (const tool of request.availableTools) canonicalJson(tool.inputSchema);
  if (
    estimateAgentStepInputTokens(request) + agentStepMaximumResponseTokens >
    agentStepAllocatableTokens
  )
    throw new PortableAuthorityError("FOUNDATION_MODEL_CONTEXT_EXCEEDED");
};
