import type { ProposedEvent } from "../domain/event.js";
import type { ActionProposal, ReactionProposal } from "./plugin-contract.js";
import { canonicalJson } from "./canonical-json.js";

const maximumReactionItems = 64;
const maximumReactionBytes = 1_048_576;
const actionTypePattern = /^[a-z][a-z0-9.-]{0,127}$/u;
const capabilityPattern = /^[a-z][a-z0-9.-]{0,127}$/u;

const plainRecord = (value: unknown, code: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(code);
  return value as Record<string, unknown>;
};

const validateEvent = (value: unknown): ProposedEvent => {
  const event = plainRecord(value, "REACTION_EVENT_INVALID");
  const keys = Object.keys(event).sort();
  if (keys.join(",") !== "body,streamId,type")
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

const validateAction = (value: unknown): ActionProposal => {
  const action = plainRecord(value, "REACTION_ACTION_INVALID");
  const keys = Object.keys(action).sort();
  if (
    keys.join(",") !==
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
  const subject = plainRecord(
    action.subject,
    "REACTION_ACTION_SUBJECT_INVALID",
  );
  if (
    Object.keys(subject).sort().join(",") !== "executionId,resource" ||
    typeof subject.executionId !== "string" ||
    !subject.executionId ||
    typeof subject.resource !== "string" ||
    !subject.resource
  )
    throw new Error("REACTION_ACTION_SUBJECT_INVALID");
  if (!Array.isArray(action.requestedCapabilities))
    throw new Error("REACTION_ACTION_CAPABILITIES_INVALID");
  const requestedCapabilities = action.requestedCapabilities.map(
    (capability) => {
      if (typeof capability !== "string" || !capabilityPattern.test(capability))
        throw new Error("REACTION_ACTION_CAPABILITY_INVALID");
      return capability;
    },
  );
  if (new Set(requestedCapabilities).size !== requestedCapabilities.length)
    throw new Error("REACTION_ACTION_CAPABILITY_DUPLICATE");
  canonicalJson(action.input);
  return {
    actionSchemaVersion: 1,
    actionType: action.actionType,
    deadlineClass: action.deadlineClass,
    gateClass: action.gateClass,
    input: action.input,
    requestedCapabilities,
    schemaVersion: 1,
    subject: {
      executionId: subject.executionId,
      resource: subject.resource,
    },
  };
};

export const validateReactionProposal = (value: unknown): ReactionProposal => {
  const proposal = plainRecord(value, "REACTION_PROPOSAL_INVALID");
  const keys = Object.keys(proposal).sort();
  if (keys.join(",") !== "actions,events")
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
  if (Buffer.byteLength(canonicalJson(validated)) > maximumReactionBytes)
    throw new Error("REACTION_PROPOSAL_TOO_LARGE");
  return validated;
};
