import type { ContextContribution, ContextSlot } from "./plugin-contract.js";
import {
  exactObjectKeys,
  nonEmptyString,
  plainRecord,
  uniqueStringArray,
} from "./plugin-validation-primitives.js";

const contextKeys = [
  "actionTypes",
  "agentIds",
  "eventTypes",
  "id",
  "maxBlocks",
  "maxEvents",
  "maxOutputBytes",
  "project",
  "rank",
  "required",
  "schemaVersion",
  "slot",
] as const;
const contextIdPattern =
  /^curiosity\.[a-z0-9][a-z0-9.-]*\.context\.[a-z0-9][a-z0-9.-]*$/u;
const slots = new Set<ContextSlot>([
  "agent-policy",
  "skills",
  "durable-context",
  "workflow",
  "kernel-notice",
]);

const boundedInteger = (
  value: unknown,
  minimum: number,
  maximum: number,
  code: string,
): number => {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  )
    throw new Error(code);
  return value;
};

export const validateContextContribution = (
  value: unknown,
  ownerId: string,
): ContextContribution => {
  const context = plainRecord(value, `PLUGIN_CONTEXT_INVALID:${ownerId}`);
  exactObjectKeys(
    context,
    contextKeys,
    `PLUGIN_CONTEXT_UNKNOWN_FIELD:${ownerId}`,
  );
  const id = nonEmptyString(
    context.id,
    `PLUGIN_CONTRIBUTION_ID_INVALID:${ownerId}`,
  );
  if (!contextIdPattern.test(id))
    throw new Error(`PLUGIN_CONTRIBUTION_ID_INVALID:${id}`);
  if (!id.startsWith(`${ownerId}.context.`))
    throw new Error(`PLUGIN_CONTRIBUTION_OWNER_MISMATCH:${ownerId}:${id}`);
  if (context.schemaVersion !== 1)
    throw new Error(`PLUGIN_CONTRIBUTION_SCHEMA_UNSUPPORTED:${id}`);
  if (typeof context.project !== "function")
    throw new Error(`PLUGIN_CONTEXT_PROJECTOR_MISSING:${id}`);
  if (typeof context.required !== "boolean")
    throw new Error(`PLUGIN_CONTEXT_REQUIRED_INVALID:${id}`);
  if (!slots.has(context.slot as ContextSlot))
    throw new Error(`PLUGIN_CONTEXT_SLOT_INVALID:${id}`);
  return {
    actionTypes: uniqueStringArray(
      context.actionTypes,
      `PLUGIN_CONTEXT_ACTION_TYPES_INVALID:${id}`,
    ),
    agentIds: uniqueStringArray(
      context.agentIds,
      `PLUGIN_CONTEXT_AGENT_IDS_INVALID:${id}`,
    ),
    eventTypes: uniqueStringArray(
      context.eventTypes,
      `PLUGIN_CONTEXT_EVENT_TYPES_INVALID:${id}`,
    ),
    id: id as ContextContribution["id"],
    maxBlocks: boundedInteger(
      context.maxBlocks,
      0,
      64,
      `PLUGIN_CONTEXT_MAX_BLOCKS_INVALID:${id}`,
    ),
    maxEvents: boundedInteger(
      context.maxEvents,
      0,
      1_024,
      `PLUGIN_CONTEXT_MAX_EVENTS_INVALID:${id}`,
    ),
    maxOutputBytes: boundedInteger(
      context.maxOutputBytes,
      1,
      1_048_576,
      `PLUGIN_CONTEXT_MAX_BYTES_INVALID:${id}`,
    ),
    project: context.project as ContextContribution["project"],
    rank: boundedInteger(
      context.rank,
      0,
      10_000,
      `PLUGIN_CONTEXT_RANK_INVALID:${id}`,
    ),
    required: context.required,
    schemaVersion: 1,
    slot: context.slot as ContextSlot,
  };
};
