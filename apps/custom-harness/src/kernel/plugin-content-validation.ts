import { canonicalJson } from "./canonical-json.js";
import type {
  PromptCommandContribution,
  SkillContribution,
  ToolContribution,
} from "./plugin-contract.js";
import {
  exactObjectKeys,
  nonEmptyString,
  plainRecord,
  uniqueStringArray,
} from "./plugin-validation-primitives.js";

const skillKeys = [
  "content",
  "description",
  "id",
  "name",
  "schemaVersion",
  "version",
] as const;
const promptCommandKeys = [
  "agentId",
  "description",
  "id",
  "instructions",
  "name",
  "schemaVersion",
  "skillName",
  "status",
  "version",
] as const;
const toolKeys = [
  "actionType",
  "description",
  "id",
  "inputSchema",
  "name",
  "outputProvenance",
  "propose",
  "readOnly",
  "requestedCapabilities",
  "schemaVersion",
  "version",
] as const;
const namePattern = /^[a-z][a-z0-9_-]{0,63}$/u;
const toolNamePattern = /^[a-z][a-z0-9_.-]{0,63}$/u;
const versionPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u;

const contributionId = (
  value: unknown,
  ownerId: string,
  kind: "prompt-commands" | "skills" | "tools",
): string => {
  const id = nonEmptyString(value, `PLUGIN_CONTRIBUTION_ID_INVALID:${ownerId}`);
  if (!id.startsWith(`${ownerId}.${kind}.`))
    throw new Error(`PLUGIN_CONTRIBUTION_OWNER_MISMATCH:${ownerId}:${id}`);
  return id;
};

const name = (value: unknown, code: string): string => {
  const result = nonEmptyString(value, code);
  if (!namePattern.test(result)) throw new Error(code);
  return result;
};

const version = (value: unknown, code: string): string => {
  const result = nonEmptyString(value, code);
  if (!versionPattern.test(result)) throw new Error(code);
  return result;
};

export const validateSkill = (
  value: unknown,
  ownerId: string,
): SkillContribution => {
  const skill = plainRecord(value, `PLUGIN_SKILL_INVALID:${ownerId}`);
  exactObjectKeys(skill, skillKeys, `PLUGIN_SKILL_UNKNOWN_FIELD:${ownerId}`);
  const id = contributionId(skill.id, ownerId, "skills");
  if (skill.schemaVersion !== 1)
    throw new Error(`PLUGIN_CONTRIBUTION_SCHEMA_UNSUPPORTED:${id}`);
  const content = nonEmptyString(
    skill.content,
    `PLUGIN_SKILL_CONTENT_INVALID:${id}`,
  );
  if (Buffer.byteLength(content) > 65_536)
    throw new Error(`PLUGIN_SKILL_CONTENT_TOO_LARGE:${id}`);
  return {
    content,
    description: nonEmptyString(
      skill.description,
      `PLUGIN_SKILL_DESCRIPTION_INVALID:${id}`,
    ),
    id: id as SkillContribution["id"],
    name: name(skill.name, `PLUGIN_SKILL_NAME_INVALID:${id}`),
    schemaVersion: 1,
    version: version(skill.version, `PLUGIN_SKILL_VERSION_INVALID:${id}`),
  };
};

export const validatePromptCommand = (
  value: unknown,
  ownerId: string,
): PromptCommandContribution => {
  const command = plainRecord(
    value,
    `PLUGIN_PROMPT_COMMAND_INVALID:${ownerId}`,
  );
  exactObjectKeys(
    command,
    promptCommandKeys,
    `PLUGIN_PROMPT_COMMAND_UNKNOWN_FIELD:${ownerId}`,
  );
  const id = contributionId(command.id, ownerId, "prompt-commands");
  if (command.schemaVersion !== 1)
    throw new Error(`PLUGIN_CONTRIBUTION_SCHEMA_UNSUPPORTED:${id}`);
  if (
    command.status !== "active" &&
    command.status !== "compatibility-deprecated"
  )
    throw new Error(`PLUGIN_PROMPT_COMMAND_STATUS_INVALID:${id}`);
  if (command.skillName !== null && typeof command.skillName !== "string")
    throw new Error(`PLUGIN_PROMPT_COMMAND_SKILL_INVALID:${id}`);
  if (command.agentId !== null && typeof command.agentId !== "string")
    throw new Error(`PLUGIN_PROMPT_COMMAND_AGENT_INVALID:${id}`);
  return {
    agentId:
      command.agentId === null
        ? null
        : name(
            command.agentId,
            `PLUGIN_PROMPT_COMMAND_AGENT_INVALID:${id}`,
          ),
    description: nonEmptyString(
      command.description,
      `PLUGIN_PROMPT_COMMAND_DESCRIPTION_INVALID:${id}`,
    ),
    id: id as PromptCommandContribution["id"],
    instructions: nonEmptyString(
      command.instructions,
      `PLUGIN_PROMPT_COMMAND_INSTRUCTIONS_INVALID:${id}`,
    ),
    name: name(command.name, `PLUGIN_PROMPT_COMMAND_NAME_INVALID:${id}`),
    schemaVersion: 1,
    skillName:
      command.skillName === null
        ? null
        : name(
            command.skillName,
            `PLUGIN_PROMPT_COMMAND_SKILL_INVALID:${id}`,
          ),
    status: command.status,
    version: version(
      command.version,
      `PLUGIN_PROMPT_COMMAND_VERSION_INVALID:${id}`,
    ),
  };
};

export const validateTool = (
  value: unknown,
  ownerId: string,
): ToolContribution => {
  const tool = plainRecord(value, `PLUGIN_TOOL_INVALID:${ownerId}`);
  exactObjectKeys(tool, toolKeys, `PLUGIN_TOOL_UNKNOWN_FIELD:${ownerId}`);
  const id = contributionId(tool.id, ownerId, "tools");
  if (tool.schemaVersion !== 1)
    throw new Error(`PLUGIN_CONTRIBUTION_SCHEMA_UNSUPPORTED:${id}`);
  if (typeof tool.propose !== "function")
    throw new Error(`PLUGIN_TOOL_PROPOSER_MISSING:${id}`);
  if (typeof tool.readOnly !== "boolean")
    throw new Error(`PLUGIN_TOOL_READ_ONLY_INVALID:${id}`);
  if (
    tool.outputProvenance !== "trusted-durable" &&
    tool.outputProvenance !== "untrusted-evidence"
  )
    throw new Error(`PLUGIN_TOOL_PROVENANCE_INVALID:${id}`);
  canonicalJson(tool.inputSchema);
  return {
    actionType: nonEmptyString(
      tool.actionType,
      `PLUGIN_TOOL_ACTION_TYPE_INVALID:${id}`,
    ),
    description: nonEmptyString(
      tool.description,
      `PLUGIN_TOOL_DESCRIPTION_INVALID:${id}`,
    ),
    id: id as ToolContribution["id"],
    inputSchema: tool.inputSchema,
    name: (() => {
      const result = nonEmptyString(
        tool.name,
        `PLUGIN_TOOL_NAME_INVALID:${id}`,
      );
      if (!toolNamePattern.test(result))
        throw new Error(`PLUGIN_TOOL_NAME_INVALID:${id}`);
      return result;
    })(),
    outputProvenance: tool.outputProvenance,
    propose: tool.propose as ToolContribution["propose"],
    readOnly: tool.readOnly,
    requestedCapabilities: uniqueStringArray(
      tool.requestedCapabilities,
      `PLUGIN_TOOL_CAPABILITIES_INVALID:${id}`,
    ),
    schemaVersion: 1,
    version: version(tool.version, `PLUGIN_TOOL_VERSION_INVALID:${id}`),
  };
};
