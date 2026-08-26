import { Effect } from "effect";
import { PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type ActionProposal,
  type CuriosityPluginV2,
  type ToolContribution,
} from "../kernel/plugin.js";

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("TOOL_INPUT_INVALID");
  if (JSON.stringify(value).length > 65_536)
    throw new Error("TOOL_INPUT_TOO_LARGE");
  return value as Record<string, unknown>;
};

const nested = (
  input: Record<string, unknown>,
  key: string,
): Record<string, unknown> => record(input[key]);

const closedSchema = (
  properties: Record<string, unknown>,
  required: readonly string[] = [],
) => ({
  additionalProperties: false,
  properties,
  required,
  type: "object",
});

const text = { maxLength: 4_096, minLength: 1, type: "string" };
const identity = {
  maxLength: 128,
  minLength: 1,
  pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$",
  type: "string",
};

type ToolRoute = (
  input: Record<string, unknown>,
  subject: ActionProposal["subject"],
) => { readonly kind: string; readonly payload: unknown };

const semanticTool = (
  name: string,
  description: string,
  inputSchema: unknown,
  route: ToolRoute,
): ToolContribution => ({
  actionType: "semantic.command",
  description,
  id: `curiosity.stock.compatibility-tools.tools.${name}`,
  inputSchema,
  name,
  outputProvenance: "trusted-durable",
  propose: (input, subject) =>
    Effect.try({
      try: () => ({
        actionSchemaVersion: 1 as const,
        actionType: "semantic.command",
        deadlineClass: "interactive" as const,
        gateClass: "none-requested" as const,
        input: route(record(input), subject),
        requestedCapabilities: ["semantic.command"],
        schemaVersion: 1 as const,
        subject,
      }),
      catch: () =>
        new PluginFailure({
          message: "TOOL_INPUT_INVALID",
          pluginId: "curiosity.stock.compatibility-tools",
        }),
    }),
  readOnly: false,
  requestedCapabilities: ["semantic.command"],
  schemaVersion: 1,
  version: "1.0.0",
});

const diagnosticTool = (
  name: string,
  description: string,
  code: string,
  readOnly = false,
): ToolContribution => ({
  actionType: "diagnostic.report",
  description,
  id: `curiosity.stock.compatibility-tools.tools.${name}`,
  inputSchema: closedSchema({}, []),
  name,
  outputProvenance: "trusted-durable",
  propose: (input, subject) =>
    Effect.try({
      try: () => ({
        actionSchemaVersion: 1 as const,
        actionType: "diagnostic.report",
        deadlineClass: "interactive" as const,
        gateClass: "none-requested" as const,
        input: {
          authority: "none",
          code,
          input: record(input),
          toolName: name,
        },
        requestedCapabilities: [],
        schemaVersion: 1 as const,
        subject,
      }),
      catch: () =>
        new PluginFailure({
          message: "TOOL_INPUT_INVALID",
          pluginId: "curiosity.stock.compatibility-tools",
        }),
    }),
  readOnly,
  requestedCapabilities: [],
  schemaVersion: 1,
  version: "1.0.0",
});

const intentSchema = closedSchema({ intent: { type: "object" } }, ["intent"]);
const workSchema = closedSchema({ work: { type: "object" } }, ["work"]);
const evidenceSchema = closedSchema(
  { evidence: { type: "object" } },
  ["evidence"],
);

export const compatibilityToolContributions: readonly ToolContribution[] = [
  semanticTool(
    "ledger_intent_propose",
    "Propose and durably record a root-scoped intent without granting approval.",
    intentSchema,
    (input) => ({
      kind: "ledger.intent.record",
      payload: { ...nested(input, "intent"), schemaVersion: 1 },
    }),
  ),
  diagnosticTool(
    "ledger_intent_frame",
    "Report the explicit native criterion-recording route.",
    "CURIOSITY_LEDGER_FRAME_REQUIRES_NATIVE_CRITERION_COMMANDS",
  ),
  diagnosticTool(
    "ledger_intent_activate",
    "Activation requires a separately bound root-user gate decision.",
    "LEDGER_BOUNDED_ROOT_CONFIRMATION_REQUIRED",
  ),
  semanticTool(
    "ledger_work_propose",
    "Propose an independently claimable work item.",
    workSchema,
    (input) => {
      const work = nested(input, "work");
      return {
        kind: "ledger.work.record",
        payload: {
          criterionIds: work.criterionIDs,
          id: work.id,
          intentId: work.intentID,
          intentRevision: work.intentRevision,
          schemaVersion: 1,
          state: work.state,
          writableScope: work.writableScope,
        },
      };
    },
  ),
  diagnosticTool(
    "ledger_claim_request",
    "Claims remain unavailable until expiring lease qualification is complete.",
    "LEDGER_CLAIM_RUNTIME_UNAVAILABLE",
  ),
  diagnosticTool(
    "ledger_claim_release",
    "Claim release remains unavailable until expiring lease qualification is complete.",
    "LEDGER_CLAIM_RUNTIME_UNAVAILABLE",
  ),
  semanticTool(
    "ledger_evidence_submit",
    "Submit immutable typed evidence bound to native event identities.",
    evidenceSchema,
    (input) => {
      const evidence = nested(input, "evidence");
      return {
        kind: "evidence.record",
        payload: {
          criterionId: evidence.criterionID,
          criterionRevision: evidence.criterionRevision,
          environmentDigest: evidence.environmentDigest,
          executionId: evidence.executionID,
          ...(evidence.expiresAt === undefined
            ? {}
            : { expiresAt: evidence.expiresAt }),
          id: evidence.id,
          inputDigest: evidence.inputDigest,
          intentId: evidence.intentID,
          kind: evidence.kind,
          observedAt: evidence.observedAt,
          outputDigest: evidence.outputDigest,
          schemaVersion: 1,
          sourceEventIds: evidence.eventIDs,
          status: evidence.status,
          workId: evidence.workID,
        },
      };
    },
  ),
  diagnosticTool(
    "ledger_fact_record",
    "Facts remain non-authoritative proposal data.",
    "LEDGER_FACT_PROPOSAL_ONLY",
  ),
  diagnosticTool(
    "ledger_progress_propose",
    "Progress remains proposal-only and cannot complete work.",
    "LEDGER_PROGRESS_PROPOSAL_ONLY",
  ),
  semanticTool(
    "ledger_resolution_propose",
    "Propose semantic resolution; kernel reconciliation remains authoritative.",
    closedSchema(
      {
        evidenceIDs: { items: identity, maxItems: 128, type: "array" },
        intentID: identity,
        rationale: text,
        verdict: { enum: ["accept", "blocked", "reject"] },
      },
      ["intentID", "verdict", "rationale", "evidenceIDs"],
    ),
    (input, subject) => ({
      kind: "ledger.resolution.propose",
      payload: {
        evidenceIds: input.evidenceIDs,
        id: `resolution:${subject.executionId}`,
        intentId: input.intentID,
        rationale: input.rationale,
        schemaVersion: 1,
        verdict: input.verdict,
      },
    }),
  ),
  diagnosticTool(
    "ledger_review_propose",
    "Review input remains a sanitized non-authoritative proposal.",
    "LEDGER_REVIEW_PROPOSAL_ONLY",
  ),
  diagnosticTool(
    "ledger_approval_request",
    "Approval creation requires a native bound-gate command.",
    "LEDGER_BOUNDED_ROOT_CONFIRMATION_REQUIRED",
  ),
  diagnosticTool(
    "ledger_approval_status",
    "Report bounded approval authority without confirming approval.",
    "LEDGER_APPROVAL_CONFIRMATION_VIA_TOOL_FORBIDDEN",
    true,
  ),
  semanticTool(
    "native_loop_start",
    "Start an explicitly bounded native workflow from supplied claim metadata.",
    closedSchema(
      {
        budgets: { type: "object" },
        claim: { type: "object" },
        dispatch: { type: "object" },
      },
      ["claim", "dispatch", "budgets"],
    ),
    (input) => {
      const claim = nested(input, "claim");
      const dispatch = nested(input, "dispatch");
      if (typeof claim.workID !== "string" || typeof dispatch.id !== "string")
        throw new Error("TOOL_INPUT_INVALID");
      return {
        kind: "workflow.start",
        payload: {
          capabilityRequests: [],
          instanceId: dispatch.id,
          objective: `Continue accepted claim ${claim.workID}`,
          schemaVersion: 1,
          workflowName: "goal-loop",
        },
      };
    },
  ),
  diagnosticTool(
    "native_loop_pause",
    "Pause is fail-closed until a durable native pause state is qualified.",
    "CURIOSITY_WORKFLOW_PAUSE_UNAVAILABLE",
  ),
  diagnosticTool(
    "native_loop_resume",
    "Resume is fail-closed until a durable native pause state is qualified.",
    "CURIOSITY_WORKFLOW_RESUME_UNAVAILABLE",
  ),
  diagnosticTool(
    "native_loop_stop",
    "Use the kernel execution-cancellation command for the exact workflow execution.",
    "CURIOSITY_USE_EXECUTION_CANCEL",
  ),
  diagnosticTool(
    "native_loop_status",
    "Read the native workflow projection without changing lifecycle state.",
    "CURIOSITY_USE_WORKFLOW_PROJECTION",
    true,
  ),
];

export const compatibilityToolsPlugin: CuriosityPluginV2 = {
  manifest: {
    capabilities: ["semantic.command"],
    class: "semantic",
    id: "curiosity.stock.compatibility-tools",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned clean-room translation",
      revision: "1.0.0",
      source: "apps/custom-harness/src/plugins/compatibility-tools.ts",
    },
    requires: [
      { pluginId: "curiosity.stock.evidence", version: "1.0.0" },
      { pluginId: "curiosity.stock.ledger", version: "1.0.0" },
      { pluginId: "curiosity.stock.loop", version: "1.0.0" },
    ],
    schemaVersion: 2,
    version: "1.0.0",
  },
  tools: compatibilityToolContributions,
};
