import {
  canonicalJson,
  PortableAuthorityError,
  utf8ByteLength,
  type AgentKernelChildToolBinding,
  type Sha256,
} from "@curiosity/authority";
import {
  mobileAgentAllowsChild,
  mobileDelegationToolDefinition,
  mobileAgentPolicies,
  mobileAgentPolicyVersion,
  type MobileAgentId,
  type MobileSubagentId,
} from "./mobile-agent-catalog.ts";

interface MobileDelegationTask {
  readonly acceptanceChecks: readonly string[];
  readonly deliverable: string;
  readonly nonGoals: readonly string[];
  readonly objective: string;
}

interface MobileDelegationRequest {
  readonly agentId: MobileSubagentId;
  readonly description: string;
  readonly task: MobileDelegationTask;
}

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const exactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  Object.keys(value).sort().join("\u0000") === [...keys].sort().join("\u0000");

const boundedText = (value: unknown, maximumBytes: number): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  utf8ByteLength(value) <= maximumBytes;

const boundedTexts = (
  value: unknown,
  minimum: number,
  maximum: number,
): value is readonly string[] =>
  Array.isArray(value) &&
  value.length >= minimum &&
  value.length <= maximum &&
  value.every((item) => boundedText(item, 512)) &&
  new Set(value).size === value.length;

const decodeRequest = (
  value: unknown,
  parentAgentId: MobileAgentId,
): MobileDelegationRequest => {
  const input = record(value);
  const task = record(input?.task);
  if (
    !input ||
    !task ||
    !exactKeys(input, ["agentId", "description", "task"]) ||
    !exactKeys(task, [
      "acceptanceChecks",
      "deliverable",
      "nonGoals",
      "objective",
    ]) ||
    typeof input.agentId !== "string" ||
    !(input.agentId in mobileAgentPolicies) ||
    !mobileAgentAllowsChild(parentAgentId, input.agentId as MobileAgentId) ||
    !boundedText(input.description, 256) ||
    !boundedTexts(task.acceptanceChecks, 1, 4) ||
    !boundedText(task.deliverable, 512) ||
    !boundedTexts(task.nonGoals, 0, 4) ||
    !boundedText(task.objective, 1_024)
  )
    throw new PortableAuthorityError("MOBILE_DELEGATION_REQUEST_INVALID");
  return Object.freeze({
    agentId: input.agentId as MobileSubagentId,
    description: input.description,
    task: Object.freeze({
      acceptanceChecks: Object.freeze([...task.acceptanceChecks]),
      deliverable: task.deliverable,
      nonGoals: Object.freeze([...task.nonGoals]),
      objective: task.objective,
    }),
  });
};

export const mobileAgentDelegationBinding = (
  parentAgentId: MobileAgentId,
  sha256: Sha256,
): AgentKernelChildToolBinding => ({
  allocate: async (input, context) => {
    if (context.parentDepth !== 0)
      throw new PortableAuthorityError("MOBILE_DELEGATION_DEPTH_EXCEEDED");
    const request = decodeRequest(input, parentAgentId);
    const identity = await sha256(
      canonicalJson({
        callKey: context.callKey,
        parentRunId: context.parentRunId,
        stepId: context.stepId,
      }),
    );
    const childKey = `child:${identity}`;
    return Object.freeze({
      capabilityCeiling: Object.freeze(["provider.generate"]),
      childKey,
      contributionId: `curiosity.agent.${request.agentId}`,
      contributionVersion: mobileAgentPolicyVersion,
      executionId: `agent-execution:${identity}`,
      initialState: Object.freeze({
        delegation: Object.freeze({
          ...request,
          callKey: context.callKey,
          ordinal: context.ordinal,
          parentExecutionId: context.executionId,
          parentRunId: context.parentRunId,
          stepId: context.stepId,
        }),
        phase: "ready",
        schemaVersion: 1,
      }),
      limits: Object.freeze({
        maxActions: 2,
        maxChildren: 0,
        maxDelegationDepth: 0,
        maxNoProgress: 1,
        maxSteps: 4,
      }),
      pluginId: "curiosity.agent.runtime",
      runId: `agent-run:${identity}`,
      workflowName: request.agentId,
    });
  },
  definition: mobileDelegationToolDefinition,
  kind: "child",
  pluginId: "curiosity.stock.delegation",
  reactorId: parentAgentId,
});
