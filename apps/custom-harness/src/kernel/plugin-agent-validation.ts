import type { AgentContribution } from "./plugin-contract.js";
import {
  exactObjectKeys,
  nonEmptyString,
  plainRecord,
  uniqueStringArray,
} from "./plugin-validation-primitives.js";

const agentKeys = [
  "childAgents",
  "default",
  "description",
  "id",
  "maxDelegationDepth",
  "mode",
  "requestedCapabilities",
  "requestedTools",
  "schemaVersion",
  "system",
  "version",
] as const;
const idPattern = /^[a-z][a-z0-9.-]{0,127}$/u;
const versionPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u;

export const validateAgent = (value: unknown): AgentContribution => {
  const agent = plainRecord(value, "PLUGIN_AGENT_INVALID");
  exactObjectKeys(agent, agentKeys, "PLUGIN_AGENT_UNKNOWN_FIELD");
  const id = nonEmptyString(agent.id, "PLUGIN_AGENT_ID_INVALID");
  const version = nonEmptyString(
    agent.version,
    `PLUGIN_AGENT_VERSION_INVALID:${id}`,
  );
  const description = nonEmptyString(
    agent.description,
    `PLUGIN_AGENT_DESCRIPTION_INVALID:${id}`,
  );
  const system = nonEmptyString(
    agent.system,
    `PLUGIN_AGENT_SYSTEM_INVALID:${id}`,
  );
  if (!idPattern.test(id)) throw new Error(`PLUGIN_AGENT_ID_INVALID:${id}`);
  if (!versionPattern.test(version))
    throw new Error(`PLUGIN_AGENT_VERSION_INVALID:${id}:${version}`);
  if (Buffer.byteLength(system) > 32_768)
    throw new Error(`PLUGIN_AGENT_SYSTEM_TOO_LARGE:${id}`);
  if (agent.mode !== "primary" && agent.mode !== "subagent")
    throw new Error(`PLUGIN_AGENT_MODE_INVALID:${id}`);
  if (typeof agent.default !== "boolean")
    throw new Error(`PLUGIN_AGENT_DEFAULT_INVALID:${id}`);
  if (
    typeof agent.maxDelegationDepth !== "number" ||
    !Number.isInteger(agent.maxDelegationDepth) ||
    agent.maxDelegationDepth < 0 ||
    agent.maxDelegationDepth > 8
  )
    throw new Error(`PLUGIN_AGENT_DELEGATION_DEPTH_INVALID:${id}`);
  if (agent.schemaVersion !== 1)
    throw new Error(`PLUGIN_AGENT_SCHEMA_UNSUPPORTED:${id}`);
  return {
    childAgents: uniqueStringArray(
      agent.childAgents,
      `PLUGIN_AGENT_CHILDREN_INVALID:${id}`,
    ),
    default: agent.default,
    description,
    id,
    maxDelegationDepth: agent.maxDelegationDepth,
    mode: agent.mode,
    requestedCapabilities: uniqueStringArray(
      agent.requestedCapabilities,
      `PLUGIN_AGENT_CAPABILITIES_INVALID:${id}`,
    ),
    requestedTools: uniqueStringArray(
      agent.requestedTools,
      `PLUGIN_AGENT_TOOLS_INVALID:${id}`,
    ),
    schemaVersion: 1,
    system,
    version,
  };
};
