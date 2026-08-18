import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
import type { FeatureRegistration, OpenCodeContext } from "../../plugin/contracts.js";
import {
  Ledger,
  type Actor,
  type Criterion,
  type EvidenceInput,
  type IntentInput,
  type WorkItem,
} from "../ledger/index.js";
import { NativeLoopEngine } from "../loop-engine/index.js";
import { projectRootKey } from "../../plugin/lifecycle.js";
import { createSearchDefinitions } from "../search/index.js";
import type { SearchBackendOptions } from "../search/index.js";

const schema = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});
const text = { type: "string", minLength: 1, maxLength: 4096 };
const id = { type: "string", pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$" };
const strings = { type: "array", maxItems: 128, items: text };
const result = (value: unknown) => ({ content: JSON.stringify(value), metadata: { title: "Ledger proposal" } });
const actor = (context: { sessionID: unknown }, kind: Actor["kind"] = "model"): Actor => ({
  kind,
  sessionID: String(context.sessionID),
});

const definitions = (
  ledger: Ledger,
  loop: NativeLoopEngine,
  searchDefinitions: ReturnType<typeof createSearchDefinitions>,
) => [
  ...searchDefinitions,
  {
    name: "ledger_intent_propose",
    description: "Propose and capture a root-scoped intent. This does not grant approval.",
    input: schema(
      {
        intent: {
          type: "object",
          additionalProperties: false,
          required: ["id", "objective", "invariant", "scope", "nonGoals", "rigor", "revision"],
          properties: {
            id,
            objective: text,
            invariant: text,
            scope: strings,
            nonGoals: strings,
            rigor: { enum: ["mechanical", "behavioral", "security", "schema", "destructive", "irreversible"] },
            revision: { type: "integer", minimum: 1 },
          },
        },
      },
      ["intent"],
    ),
    execute: async (input: { intent: IntentInput }, context: { sessionID: unknown }) => {
      await ledger.captureIntent(input.intent, actor(context));
      return result({ accepted: true, intentID: input.intent.id });
    },
  },
  {
    name: "ledger_intent_frame",
    description: "Propose criteria framing for an intent.",
    input: schema(
      {
        intentID: id,
        criteria: {
          type: "array",
          minItems: 1,
          maxItems: 128,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "revision", "observable", "oracle", "requiredEvidence", "scenarios"],
            properties: {
              id,
              revision: { type: "integer", minimum: 1 },
              observable: text,
              oracle: text,
              requiredEvidence: strings,
              scenarios: strings,
            },
          },
        },
      },
      ["intentID", "criteria"],
    ),
    execute: async (input: { intentID: string; criteria: Criterion[] }, context: { sessionID: unknown }) => {
      await ledger.frameIntent(input.intentID, input.criteria, actor(context));
      return result({ accepted: true });
    },
  },
  {
    name: "ledger_intent_activate",
    description: "Request activation within root-user scope; reducer validates authority.",
    input: schema({ intentID: id }, ["intentID"]),
    execute: async (input: { intentID: string }, context: { sessionID: unknown }) => {
      return result({ accepted: false, diagnostic: { code: "LEDGER_BOUNDED_ROOT_CONFIRMATION_REQUIRED" } });
    },
  },
  {
    name: "ledger_work_propose",
    description: "Propose an independently claimable work item.",
    input: schema(
      {
        work: {
          type: "object",
          additionalProperties: false,
          required: ["id", "intentID", "intentRevision", "criterionIDs", "writableScope", "state"],
          properties: {
            id,
            intentID: id,
            intentRevision: { type: "integer", minimum: 1 },
            criterionIDs: strings,
            writableScope: strings,
            state: { enum: ["pending", "blocked", "resolved"] },
          },
        },
      },
      ["work"],
    ),
    execute: async (input: { work: WorkItem }) => {
      await ledger.proposeWork(input.work);
      return result({ accepted: true });
    },
  },
  {
    name: "ledger_claim_request",
    description: "Atomically claim ready work.",
    input: schema({ workID: id, rootSessionID: id, token: id }, ["workID", "rootSessionID", "token"]),
    execute: async (input: { workID: string; rootSessionID: string; token: string }, context: { sessionID: unknown }) =>
      result(await ledger.claimReady(input.workID, { ...input, sessionID: String(context.sessionID) })),
  },
  {
    name: "ledger_claim_release",
    description: "Release a claim using its lease token.",
    input: schema({ workID: id, token: id }, ["workID", "token"]),
    execute: async (input: { workID: string; token: string }) => {
      await ledger.releaseClaim(input.workID, input.token);
      return result({ accepted: true });
    },
  },
  {
    name: "ledger_evidence_submit",
    description: "Submit immutable typed evidence bound to revisions and event IDs.",
    input: schema(
      {
        evidence: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "kind",
            "intentID",
            "criterionID",
            "criterionRevision",
            "workID",
            "executionID",
            "environmentDigest",
            "inputDigest",
            "outputDigest",
            "status",
            "eventIDs",
            "observedAt",
          ],
          properties: {
            id,
            kind: {
              enum: [
                "test-red",
                "test-green",
                "command-result",
                "static-analysis",
                "build-result",
                "diff-observation",
                "review-finding",
                "runtime-probe",
                "user-observation",
                "source-citation",
              ],
            },
            intentID: id,
            criterionID: id,
            criterionRevision: { type: "integer", minimum: 1 },
            workID: id,
            executionID: id,
            environmentDigest: text,
            inputDigest: text,
            outputDigest: text,
            status: { enum: ["passed", "failed", "observed"] },
            eventIDs: strings,
            observedAt: text,
            expiresAt: text,
          },
        },
      },
      ["evidence"],
    ),
    execute: async (input: { evidence: Omit<EvidenceInput, "producer"> }, context: { sessionID: unknown }) => {
      await ledger.submitEvidence({ ...input.evidence, producer: actor(context, "tool") });
      return result({ accepted: true });
    },
  },
  {
    name: "ledger_fact_record",
    description: "Record a provenance-labelled non-authoritative fact proposal.",
    input: schema({ intentID: id, statement: text, provenance: text, digest: text }, [
      "intentID",
      "statement",
      "provenance",
      "digest",
    ]),
    execute: async (input: unknown) => result({ accepted: true, authority: "none", proposal: input }),
  },
  {
    name: "ledger_progress_propose",
    description: "Propose progress or blocking without changing completion state.",
    input: schema({ workID: id, state: { enum: ["progress", "blocked"] }, summary: text, next: text }, [
      "workID",
      "state",
      "summary",
      "next",
    ]),
    execute: async (input: unknown) => result({ accepted: true, proposal: input }),
  },
  {
    name: "ledger_resolution_propose",
    description: "Propose a semantic resolution; Ledger still validates evidence and policy.",
    input: schema(
      { intentID: id, verdict: { enum: ["accept", "reject", "blocked"] }, rationale: text, evidenceIDs: strings },
      ["intentID", "verdict", "rationale", "evidenceIDs"],
    ),
    execute: async (
      input: { intentID: string; verdict: "accept" | "reject" | "blocked"; rationale: string; evidenceIDs: string[] },
      context: { sessionID: unknown },
    ) => {
      await ledger.proposeResolution(input, actor(context));
      await ledger.reconcile(input.intentID);
      return result({ accepted: true });
    },
  },
  {
    name: "ledger_review_propose",
    description: "Submit a sanitized review request or result proposal without worker rationale.",
    input: schema(
      {
        intentID: id,
        kind: { enum: ["request", "result"] },
        criterionIDs: strings,
        artifactDigests: strings,
        invariant: text,
        findingCodes: strings,
      },
      ["intentID", "kind", "criterionIDs", "artifactDigests", "invariant"],
    ),
    execute: async (input: unknown) => result({ accepted: true, proposal: input }),
  },
  {
    name: "ledger_approval_request",
    description: "Create a correlated bounded-root-input approval request.",
    input: schema({ intentID: id, reason: text, rootSessionID: id }, ["intentID", "reason", "rootSessionID"]),
    execute: async (input: { intentID: string; reason: string; rootSessionID: string }) =>
      result(await ledger.requestApproval(input.intentID, input.reason, input.rootSessionID)),
  },
  {
    name: "ledger_approval_status",
    description: "Return bounded approval status; this tool cannot confirm approval.",
    input: schema({}, []),
    execute: async () => result({ authority: "bounded-root-input", confirmationViaTool: false }),
  },
  {
    name: "native_loop_start",
    description: "Start native continuation from an accepted Ledger claim and immutable dispatch capsule.",
    input: schema(
      {
        claim: {
          type: "object",
          additionalProperties: false,
          required: ["workID", "token", "revision", "digest"],
          properties: { workID: id, token: id, revision: { type: "integer", minimum: 1 }, digest: text },
        },
        dispatch: {
          type: "object",
          additionalProperties: false,
          required: ["id", "digest"],
          properties: { id, digest: text },
        },
        budgets: {
          type: "object",
          additionalProperties: false,
          required: ["maxIterations", "maxNoProgress", "maxChildren", "maxTools"],
          properties: {
            maxIterations: { type: "integer", minimum: 1, maximum: 100 },
            maxNoProgress: { type: "integer", minimum: 1, maximum: 10 },
            maxChildren: { type: "integer", minimum: 0, maximum: 32 },
            maxTools: { type: "integer", minimum: 1, maximum: 1000 },
          },
        },
      },
      ["claim", "dispatch", "budgets"],
    ),
    execute: async (
      input: Omit<Parameters<NativeLoopEngine["start"]>[0], "rootSessionID">,
      context: { sessionID: unknown },
    ) => {
      await ledger.requireClaim(input.claim);
      return result(await loop.start({ ...input, rootSessionID: String(context.sessionID) }));
    },
  },
  ...(["pause", "resume", "stop", "status"] as const).map((operation) => ({
    name: `native_loop_${operation}`,
    description: `${operation} the native loop journal.`,
    input: schema({}, []),
    execute: async () => {
      if (operation === "status") return result(await loop.status());
      await loop[operation]();
      return result({ accepted: true });
    },
  })),
];

export const structuredToolsFeature: FeatureRegistration = {
  id: "structured-tools",
  register: async (context) => {
    const root = await projectRootKey(context);
    const ledger = await Ledger.open(root);
    const loop = await NativeLoopEngine.open(root, {
      prompt: async (input) => context.session.prompt(input as never),
      interrupt: async (input) => context.session.interrupt(input as never),
    });
    const configured = (context.options as Record<string, unknown>).search;
    const searchOptions =
      typeof configured === "object" && configured !== null
        ? (configured as SearchBackendOptions)
        : ({} as SearchBackendOptions);
    const runtimeOwnedByEffectPlugin = (searchOptions as { backend?: unknown }).backend === "runtime";
    const searchDefinitions = runtimeOwnedByEffectPlugin
      ? (Object.assign([], { cleanup: () => undefined }) as ReturnType<typeof createSearchDefinitions>)
      : createSearchDefinitions(searchOptions);
    const allDefinitions = definitions(ledger, loop, searchDefinitions);
    const registration = await context.tool.transform((draft) => {
      for (const definition of allDefinitions) draft.add(definition as never);
    });
    return () => {
      searchDefinitions.cleanup();
      return registration.dispose();
    };
  },
};

export const stableToolError = (error: unknown): { code: string } => ({
  code: error instanceof DiagnosticError ? error.code : "OPENCODE2_TOOL_FAILURE",
});
