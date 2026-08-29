import { canonicalJson, utf8ByteLength } from "./canonical-json.js";
import type { ProposedEvent } from "./domain.js";

const maximumReactionItems = 64;
const maximumReactionBytes = 1_048_576;
const actionTypePattern = /^[a-z][a-z0-9.-]{0,127}$/u;
const capabilityPattern = /^[a-z][a-z0-9.-]{0,127}$/u;

export interface ActionProposal {
  readonly actionSchemaVersion: number;
  readonly actionType: string;
  readonly deadlineClass: "interactive" | "background";
  readonly gateClass: "none-requested" | "binding-human-requested";
  readonly input: unknown;
  readonly requestedCapabilities: readonly string[];
  readonly schemaVersion: 1;
  readonly subject: {
    readonly executionId: string;
    readonly resource: string;
  };
}

export interface ReactionProposal {
  readonly actions: readonly ActionProposal[];
  readonly events: readonly ProposedEvent[];
}

const record = (value: unknown, code: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(code);
  return value as Record<string, unknown>;
};

const validateEvent = (value: unknown): ProposedEvent => {
  const event = record(value, "REACTION_EVENT_INVALID");
  if (Object.keys(event).sort().join(",") !== "body,streamId,type")
    throw new Error("REACTION_EVENT_FIELDS_INVALID");
  if (
    typeof event.type !== "string" ||
    !event.type ||
    typeof event.streamId !== "string" ||
    !event.streamId
  )
    throw new Error("REACTION_EVENT_IDENTITY_INVALID");
  canonicalJson(event.body);
  return { body: event.body, streamId: event.streamId, type: event.type };
};

const validateSubject = (
  value: unknown,
): ActionProposal["subject"] => {
  const subject = record(value, "REACTION_ACTION_SUBJECT_INVALID");
  if (
    Object.keys(subject).sort().join(",") !== "executionId,resource" ||
    typeof subject.executionId !== "string" ||
    !subject.executionId ||
    typeof subject.resource !== "string" ||
    !subject.resource
  )
    throw new Error("REACTION_ACTION_SUBJECT_INVALID");
  return {
    executionId: subject.executionId,
    resource: subject.resource,
  };
};

const validateCapabilities = (value: unknown): readonly string[] => {
  if (!Array.isArray(value))
    throw new Error("REACTION_ACTION_CAPABILITIES_INVALID");
  const capabilities = value.map((capability) => {
    if (typeof capability !== "string" || !capabilityPattern.test(capability))
      throw new Error("REACTION_ACTION_CAPABILITY_INVALID");
    return capability;
  });
  if (new Set(capabilities).size !== capabilities.length)
    throw new Error("REACTION_ACTION_CAPABILITY_DUPLICATE");
  return capabilities;
};

const validateAction = (value: unknown): ActionProposal => {
  const action = record(value, "REACTION_ACTION_INVALID");
  if (
    Object.keys(action).sort().join(",") !==
    "actionSchemaVersion,actionType,deadlineClass,gateClass,input,requestedCapabilities,schemaVersion,subject"
  )
    throw new Error("REACTION_ACTION_FIELDS_INVALID");
  if (action.schemaVersion !== 1 || action.actionSchemaVersion !== 1)
    throw new Error("REACTION_ACTION_SCHEMA_UNSUPPORTED");
  if (
    typeof action.actionType !== "string" ||
    !actionTypePattern.test(action.actionType)
  )
    throw new Error("REACTION_ACTION_TYPE_INVALID");
  if (
    action.deadlineClass !== "interactive" &&
    action.deadlineClass !== "background"
  )
    throw new Error("REACTION_ACTION_DEADLINE_INVALID");
  if (
    action.gateClass !== "none-requested" &&
    action.gateClass !== "binding-human-requested"
  )
    throw new Error("REACTION_ACTION_GATE_INVALID");
  const subject = validateSubject(action.subject);
  const requestedCapabilities = validateCapabilities(
    action.requestedCapabilities,
  );
  canonicalJson(action.input);
  return {
    actionSchemaVersion: 1,
    actionType: action.actionType,
    deadlineClass: action.deadlineClass,
    gateClass: action.gateClass,
    input: action.input,
    requestedCapabilities,
    schemaVersion: 1,
    subject,
  };
};

export const validateReactionProposal = (value: unknown): ReactionProposal => {
  const proposal = record(value, "REACTION_PROPOSAL_INVALID");
  if (Object.keys(proposal).sort().join(",") !== "actions,events")
    throw new Error("REACTION_PROPOSAL_FIELDS_INVALID");
  if (!Array.isArray(proposal.events) || !Array.isArray(proposal.actions))
    throw new Error("REACTION_PROPOSAL_COLLECTION_INVALID");
  if (
    proposal.events.length > maximumReactionItems ||
    proposal.actions.length > maximumReactionItems
  )
    throw new Error("REACTION_PROPOSAL_TOO_MANY_ITEMS");
  const validated = {
    actions: proposal.actions.map(validateAction),
    events: proposal.events.map(validateEvent),
  };
  if (utf8ByteLength(canonicalJson(validated)) > maximumReactionBytes)
    throw new Error("REACTION_PROPOSAL_TOO_LARGE");
  return validated;
};
