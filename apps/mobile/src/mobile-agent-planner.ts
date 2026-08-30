import {
  agentStepAllocatableTokens,
  agentStepMaximumResponseTokens,
  canonicalJson,
  createContextPlan,
  createGenerationRouteReceipt,
  estimateAgentStepInputTokens,
  PortableAuthorityError,
  projectActiveMemories,
  utf8ByteLength,
  type AgentKernelPlanPort,
  type AgentRunProjection,
  type ContextBlockInput,
  type GenerationSelectionPort,
  type Sha256,
  type StoredEvent,
} from "@curiosity/authority";
import {
  mobileAgentPolicies,
  mobileAgentToolBindings,
  mobileAgentCatalogVersion,
  type MobileAgentId,
} from "./mobile-agent-catalog.ts";

export interface MobileAgentPlannerConfig {
  readonly events: () => Promise<readonly StoredEvent[]>;
  readonly generationSelection: GenerationSelectionPort;
  readonly sha256: Sha256;
}

const conversationBudget = 1_200;
const evidenceBudget = 700;
const memoryBudget = 400;
const stateBudget = 400;
const maximumConversationMessages = 8;
const maximumEvidenceEvents = 4;

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const truncateUtf8 = (value: string, maximumBytes: number): string => {
  if (utf8ByteLength(value) <= maximumBytes) return value;
  let result = "";
  for (const character of value) {
    const candidate = `${result}${character}`;
    if (utf8ByteLength(candidate) > maximumBytes - 16) break;
    result = candidate;
  }
  return `${result}\n[truncated]`;
};

const runInput = (run: AgentRunProjection) => {
  const input = record(run.input);
  if (
    !input ||
    input.kind !== "chat.turn" ||
    input.schemaVersion !== 1 ||
    typeof input.threadId !== "string" ||
    typeof input.turnId !== "string"
  )
    throw new PortableAuthorityError("AGENT_PLANNER_RUN_INPUT_INVALID");
  return {
    ...(typeof input.projectId === "string"
      ? { projectId: input.projectId }
      : {}),
    threadId: input.threadId,
    turnId: input.turnId,
  };
};

const conversationBlock = (
  events: readonly StoredEvent[],
  threadId: string,
): ContextBlockInput | undefined => {
  const messages = events
    .filter((event) => event.type === "message.appended")
    .flatMap((event) => {
      const body = record(event.body);
      if (
        body?.threadId !== threadId ||
        (body.role !== "assistant" && body.role !== "user") ||
        typeof body.text !== "string"
      )
        return [];
      return [{ event, role: body.role, text: body.text }];
    })
    .slice(-maximumConversationMessages);
  if (messages.length === 0) return undefined;
  const content = truncateUtf8(
    messages.map(({ role, text }) => `${role}: ${text}`).join("\n\n"),
    conversationBudget,
  );
  return {
    blockId: "conversation-tail",
    content,
    kind: "conversation",
    provenance: "trusted-durable",
    sourceEventIds: messages.map(({ event }) => event.eventId),
  };
};

const evidenceBlock = (
  events: readonly StoredEvent[],
  executionId: string,
): ContextBlockInput | undefined => {
  const evidence = events
    .filter(
      (event) =>
        event.childExecutionId === executionId &&
        (event.type === "action.succeeded" || event.type === "action.failed"),
    )
    .slice(-maximumEvidenceEvents);
  if (evidence.length === 0) return undefined;
  return {
    blockId: "tool-evidence-tail",
    content: truncateUtf8(
      evidence
        .map((event) => `${event.type}: ${canonicalJson(event.body)}`)
        .join("\n"),
      evidenceBudget,
    ),
    kind: "tool-evidence",
    provenance: "untrusted-evidence",
    sourceEventIds: evidence.map(({ eventId }) => eventId),
  };
};

const memoryBlock = (
  events: readonly StoredEvent[],
  projectId: string | undefined,
): ContextBlockInput | undefined => {
  if (!projectId) return undefined;
  const projectByTurn = new Map<string, string>();
  for (const event of events) {
    if (event.type !== "turn.requested") continue;
    const body = record(event.body);
    if (typeof body?.turnId === "string" && typeof body.projectId === "string")
      projectByTurn.set(body.turnId, body.projectId);
  }
  const projectByMessage = new Map<string, string>();
  for (const event of events) {
    if (event.type !== "message.appended") continue;
    const body = record(event.body);
    if (typeof body?.messageId !== "string" || typeof body.turnId !== "string")
      continue;
    const sourceProject = projectByTurn.get(body.turnId);
    if (sourceProject) projectByMessage.set(body.messageId, sourceProject);
  }
  const memories = projectActiveMemories(events)
    .filter(({ sensitivity }) => sensitivity === "ordinary")
    .filter(({ sourceMessageIds }) =>
      sourceMessageIds.every(
        (messageId) => projectByMessage.get(messageId) === projectId,
      ),
    )
    .slice(0, 4);
  if (memories.length === 0) return undefined;
  const memoryEvents = new Map<string, string>();
  for (const event of events) {
    if (event.type !== "memory.recorded" && event.type !== "memory.superseded")
      continue;
    const memory = record(record(event.body)?.memory);
    if (typeof memory?.memoryId === "string")
      memoryEvents.set(memory.memoryId, event.eventId);
  }
  return {
    blockId: "active-project-memory",
    content: truncateUtf8(
      memories.map(({ content, kind }) => `${kind}: ${content}`).join("\n"),
      memoryBudget,
    ),
    kind: "memory",
    provenance: "trusted-durable",
    sourceEventIds: memories.flatMap(({ memoryId }) => {
      const eventId = memoryEvents.get(memoryId);
      return eventId ? [eventId] : [];
    }),
  };
};

const blocksFor = (
  run: AgentRunProjection,
  events: readonly StoredEvent[],
  agentId: MobileAgentId,
): readonly ContextBlockInput[] => {
  const input = runInput(run);
  const conversation = conversationBlock(events, input.threadId);
  const evidence = evidenceBlock(events, run.executionId);
  const memory = memoryBlock(events, input.projectId);
  return [
    {
      blockId: "agent-policy",
      content: mobileAgentPolicies[agentId],
      kind: "agent-policy" as const,
      provenance: "trusted-durable" as const,
      sourceEventIds: [],
    },
    ...(conversation ? [conversation] : []),
    ...(memory ? [memory] : []),
    {
      blockId: "workflow-state",
      content: truncateUtf8(canonicalJson(run.state), stateBudget),
      kind: "workflow" as const,
      provenance: "trusted-durable" as const,
      sourceEventIds: [run.sourceEventId],
    },
    ...(evidence ? [evidence] : []),
  ];
};

const checkedAgentId = (run: AgentRunProjection): MobileAgentId => {
  if (!(run.workflowName in mobileAgentPolicies))
    throw new PortableAuthorityError("AGENT_PLANNER_ROLE_UNAVAILABLE");
  return run.workflowName as MobileAgentId;
};

export const createMobileAgentPlanner = (
  config: MobileAgentPlannerConfig,
): AgentKernelPlanPort => ({
  plan: async (run, signal) => {
    if (signal.aborted) throw new PortableAuthorityError("ACTION_CANCELLED");
    const agentId = checkedAgentId(run);
    const events = await config.events();
    if (signal.aborted) throw new PortableAuthorityError("ACTION_CANCELLED");
    const contextPlan = await createContextPlan(
      blocksFor(run, events, agentId),
      "ipados-durable-agent-context-v1",
      config.sha256,
    );
    const selection = await config.generationSelection.select({
      contextPlanId: contextPlan.contextPlanId,
      purpose: "agent.step",
      turnId: run.runId,
    });
    const route = await createGenerationRouteReceipt(
      selection,
      run.runId,
      contextPlan.contextPlanId,
      config.sha256,
    );
    const finalizationOnly = run.actionCount + 1 >= run.limits.maxActions;
    const tools = run.capabilityCeiling.includes("documents.read")
      ? mobileAgentToolBindings(agentId)
      : [];
    const estimated = estimateAgentStepInputTokens({
      agent: { id: agentId, version: mobileAgentCatalogVersion },
      availableTools: tools.map(({ definition }) => definition),
      contextPlan,
      finalizationOnly,
      observedRunRevision: run.revision,
      observedStateDigest: run.stateDigest,
      route,
      runId: run.runId,
      stepId: "0".repeat(64),
      stepNumber: run.revision + 1,
    });
    if (estimated + agentStepMaximumResponseTokens > agentStepAllocatableTokens)
      throw new PortableAuthorityError("AGENT_PLANNER_CONTEXT_EXCEEDED");
    return {
      agent: { id: agentId, version: mobileAgentCatalogVersion },
      contextPlan,
      finalizationOnly,
      route,
      tools,
    };
  },
});
