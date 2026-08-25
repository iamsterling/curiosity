import { canonicalJson } from "./canonical-json.js";
import { validateReactionProposal } from "./action-proposal.js";
import type {
  WorkflowChildProposal,
  WorkflowTransition,
} from "./plugin-contract.js";
import {
  exactObjectKeys,
  nonEmptyString,
  plainRecord,
  uniqueStringArray,
} from "./plugin-validation-primitives.js";

const transitionKeys = [
  "actions",
  "children",
  "nextState",
  "progressKey",
  "terminalRequested",
] as const;
const childKeys = ["id", "requestedCapabilities", "workflowName"] as const;

const validateChild = (value: unknown): WorkflowChildProposal => {
  const child = plainRecord(value, "WORKFLOW_CHILD_PROPOSAL_INVALID");
  exactObjectKeys(child, childKeys, "WORKFLOW_CHILD_PROPOSAL_INVALID");
  const id = nonEmptyString(child.id, "WORKFLOW_CHILD_ID_INVALID");
  if (id.length > 128) throw new Error("WORKFLOW_CHILD_ID_INVALID");
  return {
    id,
    requestedCapabilities: uniqueStringArray(
      child.requestedCapabilities,
      "WORKFLOW_CHILD_CAPABILITIES_INVALID",
    ),
    workflowName: nonEmptyString(
      child.workflowName,
      "WORKFLOW_CHILD_NAME_INVALID",
    ),
  };
};

export const validateWorkflowTransition = (
  value: unknown,
): WorkflowTransition => {
  const transition = plainRecord(value, "WORKFLOW_TRANSITION_INVALID");
  exactObjectKeys(transition, transitionKeys, "WORKFLOW_TRANSITION_INVALID");
  if (!Array.isArray(transition.actions))
    throw new Error("WORKFLOW_ACTIONS_INVALID");
  if (!Array.isArray(transition.children))
    throw new Error("WORKFLOW_CHILDREN_INVALID");
  const actions = validateReactionProposal({
    actions: transition.actions,
    events: [],
  }).actions;
  const children = transition.children.map(validateChild);
  if (new Set(children.map(({ id }) => id)).size !== children.length)
    throw new Error("WORKFLOW_CHILD_ID_DUPLICATE");
  const progressKey = nonEmptyString(
    transition.progressKey,
    "WORKFLOW_PROGRESS_KEY_INVALID",
  );
  if (progressKey.length > 256)
    throw new Error("WORKFLOW_PROGRESS_KEY_INVALID");
  if (typeof transition.terminalRequested !== "boolean")
    throw new Error("WORKFLOW_TERMINAL_REQUEST_INVALID");
  if (Buffer.byteLength(canonicalJson(transition.nextState)) > 65_536)
    throw new Error("WORKFLOW_STATE_TOO_LARGE");
  return {
    actions,
    children,
    nextState: transition.nextState,
    progressKey,
    terminalRequested: transition.terminalRequested,
  };
};
