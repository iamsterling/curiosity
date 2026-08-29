import { canonicalJson } from "./canonical-json.js";
import type { Sha256 } from "./domain.js";
import type {
  StoredWorkflowInstance,
  WorkflowActionRecord,
  WorkflowDefinitionSnapshot,
} from "./workflow-domain.js";
import type {
  WorkflowCatalogPort,
  WorkflowChildAllocation,
} from "./workflow-port.js";
import type { WorkflowTransition } from "./workflow-transition.js";

export interface WorkflowRequest {
  readonly capabilityRequests: readonly string[];
  readonly input: unknown;
  readonly instanceId: string;
  readonly workflowName: string;
}

export interface WorkflowTransitionPlan {
  readonly actions: readonly WorkflowActionRecord[];
  readonly children: readonly WorkflowChildAllocation[];
  readonly transitionDigest: string;
}

const digest = (value: unknown, sha256: Sha256): Promise<string> =>
  sha256(canonicalJson(value));

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

export const decodeWorkflowRequest = (
  body: unknown,
): WorkflowRequest => {
  const value = record(body);
  if (
    !value ||
    Object.keys(value).sort().join(",") !==
      "capabilityRequests,input,instanceId,schemaVersion,workflowName" ||
    value.schemaVersion !== 1 ||
    typeof value.instanceId !== "string" ||
    !value.instanceId ||
    value.instanceId.length > 256 ||
    typeof value.workflowName !== "string" ||
    !value.workflowName ||
    !Array.isArray(value.capabilityRequests) ||
    value.capabilityRequests.some(
      (capability) => typeof capability !== "string" || !capability,
    ) ||
    new Set(value.capabilityRequests).size !== value.capabilityRequests.length
  )
    throw new Error("WORKFLOW_REQUEST_INVALID");
  canonicalJson(value.input);
  return {
    capabilityRequests: value.capabilityRequests as string[],
    input: value.input,
    instanceId: value.instanceId,
    workflowName: value.workflowName,
  };
};

const snapshot = (
  definition: WorkflowDefinitionSnapshot,
): WorkflowDefinitionSnapshot => ({
  id: definition.id,
  initialState: definition.initialState,
  limits: definition.limits,
  name: definition.name,
  pluginId: definition.pluginId,
  version: definition.version,
});

const actionRecord = async (
  instance: StoredWorkflowInstance,
  ordinal: number,
  proposal: WorkflowTransition["actions"][number],
  sha256: Sha256,
): Promise<WorkflowActionRecord> => {
  if (proposal.subject.executionId !== instance.executionId)
    throw new Error("WORKFLOW_ACTION_EXECUTION_MISMATCH");
  if (
    proposal.requestedCapabilities.some(
      (capability) => !instance.capabilityCeiling.includes(capability),
    )
  )
    throw new Error("WORKFLOW_ACTION_CEILING_EXCEEDED");
  const inputDigest = await digest(proposal.input, sha256);
  const actionId = await digest(
    {
      inputDigest,
      instanceId: instance.instanceId,
      ordinal,
      step: instance.stepCount + 1,
      type: proposal.actionType,
      version: proposal.actionSchemaVersion,
    },
    sha256,
  );
  return {
    actionId,
    actionSchemaVersion: proposal.actionSchemaVersion,
    actionType: proposal.actionType,
    deadlineClass: proposal.deadlineClass,
    executionId: proposal.subject.executionId,
    gateClass: proposal.gateClass,
    input: proposal.input,
    inputDigest,
    pluginId: instance.pluginId,
    reactorId: instance.contributionId,
    requestedCapabilities: proposal.requestedCapabilities,
    resource: proposal.subject.resource,
    sourceEventId: instance.sourceEventId,
  };
};

const childRecord = async (
  instance: StoredWorkflowInstance,
  child: WorkflowTransition["children"][number],
  catalog: WorkflowCatalogPort,
  sha256: Sha256,
): Promise<WorkflowChildAllocation> => {
  if (instance.depth >= instance.limits.maxDelegationDepth)
    throw new Error("WORKFLOW_DELEGATION_DEPTH_EXCEEDED");
  if (
    child.requestedCapabilities.some(
      (capability) => !instance.capabilityCeiling.includes(capability),
    )
  )
    throw new Error("WORKFLOW_CHILD_CEILING_EXCEEDED");
  const contribution = catalog.workflow(child.workflowName);
  if (!contribution) throw new Error("WORKFLOW_CHILD_DEFINITION_NOT_FOUND");
  const instanceId = `child:${await digest(
    {
      childKey: child.id,
      parent: instance.instanceId,
      workflowName: child.workflowName,
    },
    sha256,
  )}`;
  return {
    capabilityCeiling: [...child.requestedCapabilities].sort(),
    childKey: child.id,
    contribution: snapshot(contribution),
    executionId: instanceId,
    instanceId,
  };
};

export const planWorkflowTransition = async (
  instance: StoredWorkflowInstance,
  output: WorkflowTransition,
  catalog: WorkflowCatalogPort,
  sha256: Sha256,
): Promise<WorkflowTransitionPlan> => {
  const actions: WorkflowActionRecord[] = [];
  for (const [ordinal, action] of output.actions.entries())
    actions.push(await actionRecord(instance, ordinal, action, sha256));
  const children: WorkflowChildAllocation[] = [];
  for (const child of output.children)
    children.push(await childRecord(instance, child, catalog, sha256));
  const transitionDigest = await digest(
    {
      actions,
      children: children.map((child) => ({
        capabilityCeiling: child.capabilityCeiling,
        childKey: child.childKey,
        contributionId: child.contribution.id,
        contributionVersion: child.contribution.version,
        instanceId: child.instanceId,
      })),
      instanceId: instance.instanceId,
      nextState: output.nextState,
      progressKey: output.progressKey,
      step: instance.stepCount + 1,
      terminalRequested: output.terminalRequested,
    },
    sha256,
  );
  return { actions, children, transitionDigest };
};
