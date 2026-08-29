import {
  validateReactionProposal,
  type ActionProposal,
} from "./action-proposal.js";
import { canonicalJson, utf8ByteLength } from "./canonical-json.js";

const transitionKeys = [
  "actions",
  "children",
  "nextState",
  "progressKey",
  "terminalRequested",
] as const;
const childKeys = ["id", "requestedCapabilities", "workflowName"] as const;

export interface WorkflowChildProposal {
  readonly id: string;
  readonly requestedCapabilities: readonly string[];
  readonly workflowName: string;
}

export interface WorkflowTransitionInput {
  readonly children: readonly {
    readonly id: string;
    readonly status: "cancelled" | "completed" | "failed" | "running";
  }[];
  readonly input: unknown;
  readonly instanceId: string;
  readonly state: unknown;
  readonly step: number;
}

export interface WorkflowTransition {
  readonly actions: readonly ActionProposal[];
  readonly children: readonly WorkflowChildProposal[];
  readonly nextState: unknown;
  readonly progressKey: string;
  readonly terminalRequested: boolean;
}

const plainRecord = (
  value: unknown,
  code: string,
): Record<string, unknown> => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    throw new Error(code);
  return value as Record<string, unknown>;
};

const exactObjectKeys = (
  value: Record<string, unknown>,
  allowed: readonly string[],
  code: string,
): void => {
  const unknown = Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .sort()[0];
  if (unknown) throw new Error(`${code}:${unknown}`);
  const missing = allowed.find((key) => !(key in value));
  if (missing) throw new Error(`${code}_MISSING:${missing}`);
};

const nonEmptyString = (value: unknown, code: string): string => {
  if (typeof value !== "string" || value.length === 0) throw new Error(code);
  return value;
};

const uniqueStringArray = (
  value: unknown,
  code: string,
): readonly string[] => {
  if (!Array.isArray(value)) throw new Error(code);
  const values = value.map((item) => nonEmptyString(item, code));
  if (new Set(values).size !== values.length)
    throw new Error(`${code}_DUPLICATE`);
  return values;
};

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
  if (utf8ByteLength(canonicalJson(transition.nextState)) > 65_536)
    throw new Error("WORKFLOW_STATE_TOO_LARGE");
  return {
    actions,
    children,
    nextState: transition.nextState,
    progressKey,
    terminalRequested: transition.terminalRequested,
  };
};
