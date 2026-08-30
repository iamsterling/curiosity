import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "bun:test";
import {
  appleOnDeviceGenerationSelection,
  canonicalJson,
  createContextPlan,
  createGenerationRouteReceipt,
} from "@curiosity/authority";
import { createFoundationModelAgentStep } from "../src/foundation-model-agent-step-port.ts";
import { createMobileAgentKernel } from "../src/mobile-agent-kernel.ts";

const catalogDigest = "0".repeat(64);
const sha256 = async (value) =>
  createHash("sha256").update(value).digest("hex");

const fixture = async ({ staleStep = false } = {}) => {
  const state = { phase: "ready", schemaVersion: 1 };
  let run = {
    actionCount: 0,
    capabilityCeiling: ["provider.generate"],
    childCount: 0,
    contributionId: "generalist",
    contributionVersion: "1",
    createdAt: "2026-08-29T20:00:00.000Z",
    depth: 0,
    executionGeneration: 0,
    executionId: "run-1",
    input: { objective: "Answer" },
    limits: {
      maxActions: 4,
      maxChildren: 0,
      maxDelegationDepth: 0,
      maxNoProgress: 2,
      maxSteps: 8,
    },
    noProgressCount: 0,
    pluginId: "curiosity.agent",
    providerAction: null,
    revision: 0,
    runId: "run-1",
    sourceEventId: "event-1",
    state,
    stateDigest: await sha256(canonicalJson(state)),
    status: "running",
    updatedAt: "2026-08-29T20:00:00.000Z",
    workflowName: "generalist",
  };
  const contextPlan = await createContextPlan(
    [
      {
        blockId: "workflow-1",
        content: "Answer from durable context.",
        kind: "workflow",
        provenance: "trusted-durable",
        sourceEventIds: ["event-1"],
      },
    ],
    "agent-step-v1",
    sha256,
  );
  const route = await createGenerationRouteReceipt(
    appleOnDeviceGenerationSelection("agent.step"),
    "kernel-step",
    contextPlan.contextPlanId,
    sha256,
  );
  const journalOperations = [];
  const nativeSteps = [];
  const native = {
    agentJournalCall: async (inputJSON) => {
      const request = JSON.parse(inputJSON);
      journalOperations.push(request.operation);
      if (request.operation === "runnableRuns")
        return JSON.stringify(run.status === "running" ? [run] : []);
      if (request.operation === "readRunProjection") return JSON.stringify(run);
      if (request.operation === "commitTransition") {
        assert.equal(request.transition.expectedRevision, run.revision);
        const provider = request.transition.actions.find(
          ({ actionType }) => actionType === "provider.generate",
        );
        run = {
          ...run,
          actionCount: run.actionCount + request.transition.actions.length,
          providerAction: provider
            ? {
                actionId: provider.actionId,
                call: null,
                errorCode: null,
                input: provider.input,
                inputDigest: provider.inputDigest,
                outputDigest: null,
                status: "proposed",
              }
            : null,
          revision: run.revision + 1,
          state: request.transition.nextState,
          stateDigest: await sha256(
            canonicalJson(request.transition.nextState),
          ),
          status: request.transition.terminalRequested
            ? "completion-requested"
            : "running",
          updatedAt: request.transition.committedAt,
        };
        return JSON.stringify({
          disposition: "accepted",
          revision: run.revision,
          runId: run.runId,
        });
      }
      if (request.operation === "armDispatch") {
        const dispatch = request.dispatch;
        if (dispatch.phase === "allocate") {
          run = {
            ...run,
            executionGeneration: dispatch.generation,
            providerAction: {
              ...run.providerAction,
              call: {
                allocatedAt: dispatch.allocatedAt,
                attemptId: dispatch.attemptId,
                callId: dispatch.callId,
                completedAt: null,
                dispatchState: "armed",
                dispatchedAt: null,
                errorCode: null,
                generation: dispatch.generation,
                modelId: dispatch.dispatch.modelId,
                outputDigest: null,
                promptSnapshotDigest: dispatch.dispatch.promptSnapshotDigest,
                requestDigest: dispatch.dispatch.requestDigest,
                sourceRevision: dispatch.dispatch.sourceRevision,
                status: "allocated",
                terminalEvent: null,
              },
              status: "running",
            },
          };
          return JSON.stringify({
            actionId: dispatch.actionId,
            attemptId: dispatch.attemptId,
            callId: dispatch.callId,
            disposition: "armed",
            generation: dispatch.generation,
          });
        }
        run.providerAction.call.dispatchState = "dispatched";
        run.providerAction.call.dispatchedAt = dispatch.authorizedAt;
        return JSON.stringify({
          actionId: dispatch.actionId,
          attemptId: dispatch.attemptId,
          callId: dispatch.callId,
          disposition: "authorized",
          generation: dispatch.generation,
        });
      }
      if (request.operation === "settleAttempt") {
        const settlement = request.settlement;
        const status =
          settlement.status === "cancelled" ? "failed" : settlement.status;
        run.providerAction = {
          ...run.providerAction,
          call: {
            ...run.providerAction.call,
            completedAt: settlement.completedAt,
            errorCode: settlement.errorCode ?? null,
            outputDigest: settlement.outputDigest,
            status,
            terminalEvent: settlement.events[0],
          },
          errorCode: settlement.errorCode ?? null,
          outputDigest: settlement.outputDigest,
          status,
        };
        return JSON.stringify({
          actionId: settlement.actionId,
          attemptId: settlement.attemptId,
          callId: settlement.callId,
          disposition: "committed",
          generation: settlement.generation,
        });
      }
      if (request.operation === "reconcileInterrupted")
        return JSON.stringify({ attempts: [] });
      throw new Error(`unexpected:${request.operation}`);
    },
    agentStep: async (request) => {
      nativeSteps.push(request);
      return {
        contextPlanId: request.contextPlan.contextPlanId,
        durationMs: 1,
        modelId: request.route.modelId,
        observedRunRevision: staleStep
          ? request.observedRunRevision + 1
          : request.observedRunRevision,
        observedStateDigest: request.observedStateDigest,
        proposal: { citations: [], kind: "final", text: "Done" },
        runId: request.runId,
        selectionId: request.route.selectionId,
        stepId: request.stepId,
        stepNumber: request.stepNumber,
      };
    },
    cancelAgentStep: async () => {},
  };
  const kernel = createMobileAgentKernel({
    agentStep: createFoundationModelAgentStep(native),
    catalogDigest,
    eligibleActorId: "local-ipad-owner",
    native,
    now: () => "2026-08-29T20:00:01.000Z",
    planner: {
      plan: () => ({
        agent: { id: "generalist", version: "1" },
        contextPlan,
        finalizationOnly: false,
        route,
        tools: [],
      }),
    },
    sha256,
  });
  return { journalOperations, kernel, nativeSteps, run: () => run };
};

test("mobile kernel durably settles native generation before applying it", async () => {
  const value = await fixture();
  assert.equal(
    (await value.kernel.drainOne(new AbortController().signal)).kind,
    "provider-settled",
  );
  assert.deepEqual(value.journalOperations, [
    "runnableRuns",
    "commitTransition",
    "readRunProjection",
    "armDispatch",
    "armDispatch",
    "settleAttempt",
  ]);
  assert.equal(value.nativeSteps.length, 1);
  assert.equal(
    (await value.kernel.drainOne(new AbortController().signal)).kind,
    "committed",
  );
  assert.equal(value.nativeSteps.length, 1);
  assert.equal(value.run().revision, 2);
  assert.equal(value.run().status, "completion-requested");
});

test("mobile kernel settles stale native identity as a terminal run failure", async () => {
  const value = await fixture({ staleStep: true });
  assert.match(
    (await value.kernel.drainOne(new AbortController().signal)).kind,
    /committed/u,
  );
  assert.equal(value.nativeSteps.length, 1);
  assert.equal(value.run().status, "completion-requested");
  assert.equal(value.run().state.errorCode, "AGENT_STEP_RESULT_STALE");
  assert.equal(value.run().state.phase, "failed");
  assert.equal(value.nativeSteps.length, 1);
});
