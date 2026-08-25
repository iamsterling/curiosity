import { canonicalJson } from "./canonical-json.js";
import type { WorkflowContribution } from "./plugin-contract.js";
import {
  exactObjectKeys,
  nonEmptyString,
  plainRecord,
} from "./plugin-validation-primitives.js";

const workflowKeys = [
  "id",
  "initialState",
  "limits",
  "name",
  "schemaVersion",
  "transition",
  "version",
] as const;
const limitKeys = [
  "maxActions",
  "maxChildren",
  "maxDelegationDepth",
  "maxNoProgress",
  "maxSteps",
] as const;
const namePattern = /^[a-z][a-z0-9-]{0,63}$/u;
const versionPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u;

const bounded = (
  value: unknown,
  minimum: number,
  maximum: number,
  code: string,
): number => {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  )
    throw new Error(code);
  return value;
};

export const validateWorkflow = (
  value: unknown,
  ownerId: string,
): WorkflowContribution => {
  const workflow = plainRecord(value, `PLUGIN_WORKFLOW_INVALID:${ownerId}`);
  exactObjectKeys(
    workflow,
    workflowKeys,
    `PLUGIN_WORKFLOW_UNKNOWN_FIELD:${ownerId}`,
  );
  const id = nonEmptyString(
    workflow.id,
    `PLUGIN_CONTRIBUTION_ID_INVALID:${ownerId}`,
  );
  if (!id.startsWith(`${ownerId}.workflows.`))
    throw new Error(`PLUGIN_CONTRIBUTION_OWNER_MISMATCH:${ownerId}:${id}`);
  if (workflow.schemaVersion !== 1)
    throw new Error(`PLUGIN_CONTRIBUTION_SCHEMA_UNSUPPORTED:${id}`);
  const name = nonEmptyString(
    workflow.name,
    `PLUGIN_WORKFLOW_NAME_INVALID:${id}`,
  );
  if (!namePattern.test(name))
    throw new Error(`PLUGIN_WORKFLOW_NAME_INVALID:${id}`);
  const version = nonEmptyString(
    workflow.version,
    `PLUGIN_WORKFLOW_VERSION_INVALID:${id}`,
  );
  if (!versionPattern.test(version))
    throw new Error(`PLUGIN_WORKFLOW_VERSION_INVALID:${id}`);
  const limits = plainRecord(
    workflow.limits,
    `PLUGIN_WORKFLOW_LIMITS_INVALID:${id}`,
  );
  exactObjectKeys(limits, limitKeys, `PLUGIN_WORKFLOW_LIMITS_INVALID:${id}`);
  if (typeof workflow.transition !== "function")
    throw new Error(`PLUGIN_WORKFLOW_TRANSITION_MISSING:${id}`);
  if (Buffer.byteLength(canonicalJson(workflow.initialState)) > 65_536)
    throw new Error(`PLUGIN_WORKFLOW_INITIAL_STATE_TOO_LARGE:${id}`);
  return {
    id: id as WorkflowContribution["id"],
    initialState: workflow.initialState,
    limits: {
      maxActions: bounded(
        limits.maxActions,
        0,
        64,
        `PLUGIN_WORKFLOW_MAX_ACTIONS_INVALID:${id}`,
      ),
      maxChildren: bounded(
        limits.maxChildren,
        0,
        32,
        `PLUGIN_WORKFLOW_MAX_CHILDREN_INVALID:${id}`,
      ),
      maxDelegationDepth: bounded(
        limits.maxDelegationDepth,
        0,
        8,
        `PLUGIN_WORKFLOW_MAX_DEPTH_INVALID:${id}`,
      ),
      maxNoProgress: bounded(
        limits.maxNoProgress,
        0,
        16,
        `PLUGIN_WORKFLOW_MAX_NO_PROGRESS_INVALID:${id}`,
      ),
      maxSteps: bounded(
        limits.maxSteps,
        1,
        128,
        `PLUGIN_WORKFLOW_MAX_STEPS_INVALID:${id}`,
      ),
    },
    name,
    schemaVersion: 1,
    transition: workflow.transition as WorkflowContribution["transition"],
    version,
  };
};
