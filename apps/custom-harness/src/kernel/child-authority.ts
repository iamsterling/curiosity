import type { StaticPluginCatalog } from "./plugin.js";

export interface ChildRunAuthority {
  readonly capabilities: ReadonlySet<string>;
  readonly tools: ReadonlySet<string>;
}

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const uniqueStrings = (
  value: unknown,
  maximum: number,
): readonly string[] | undefined => {
  if (
    !Array.isArray(value) ||
    value.length > maximum ||
    value.some((item) => typeof item !== "string" || !item) ||
    new Set(value).size !== value.length
  )
    return undefined;
  return value as string[];
};

export const childRunAuthority = (input: {
  readonly agentId: string;
  readonly catalog: StaticPluginCatalog;
  readonly correlation: unknown;
  readonly grantedCapabilities: ReadonlySet<string>;
}): ChildRunAuthority | undefined => {
  const correlation = record(input.correlation);
  if (correlation?.kind !== "curiosity.child.run") return undefined;
  const parentAgentId = correlation.parentAgentId;
  const depth = correlation.depth;
  const capabilities = uniqueStrings(correlation.capabilityCeiling, 32);
  const tools = uniqueStrings(correlation.toolCeiling, 64);
  if (
    correlation.agentId !== input.agentId ||
    typeof parentAgentId !== "string" ||
    depth !== 1 ||
    !capabilities ||
    !tools ||
    [
      "agentSessionId",
      "agentRunId",
      "childExecutionId",
      "delegationActionId",
      "delegationGroupId",
      "parentExecutionId",
      "rootExecutionId",
    ].some((key) => typeof correlation[key] !== "string" || !correlation[key])
  )
    return undefined;
  const parent = input.catalog.agent(parentAgentId);
  const child = input.catalog.agent(input.agentId);
  if (
    !parent ||
    !child ||
    child.mode !== "subagent" ||
    !parent.childAgents.includes(child.id) ||
    parent.maxDelegationDepth < depth ||
    !parent.requestedCapabilities.includes("child.propose") ||
    !capabilities.includes("provider.generate") ||
    capabilities.some(
      (capability) =>
        !input.grantedCapabilities.has(capability) ||
        !parent.requestedCapabilities.includes(capability) ||
        !child.requestedCapabilities.includes(capability),
    )
  )
    return undefined;
  for (const toolName of tools) {
    const tool = input.catalog.tool(toolName);
    if (
      !tool ||
      !parent.requestedTools.includes(toolName) ||
      !child.requestedTools.includes(toolName) ||
      tool.requestedCapabilities.some(
        (capability) => !capabilities.includes(capability),
      )
    )
      return undefined;
  }
  return {
    capabilities: new Set(capabilities),
    tools: new Set(tools),
  };
};
