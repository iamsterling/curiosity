import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import {
  AgentKernel,
  appleOnDeviceGenerationSelection,
  canonicalJson,
  createContextPlan,
  createGenerationRouteReceipt,
  type AgentJournalCommitTransition,
  type AgentJournalPort,
  type AgentRunProjection,
  type AgentStepPort,
  type Sha256,
} from "../src/index.js";

const catalogDigest = "0".repeat(64);
const sha256: Sha256 = async (value) =>
  createHash("sha256").update(value).digest("hex");

const projection = async (): Promise<AgentRunProjection> => {
  const state = { phase: "ready", schemaVersion: 1 };
  return {
    actionCount: 0,
    capabilityCeiling: ["documents.read", "provider.generate"],
    childCount: 0,
    contributionId: "generalist",
    contributionVersion: "1",
    createdAt: "2026-08-29T20:00:00.000Z",
    depth: 0,
    executionGeneration: 0,
    executionId: "run-1",
    input: { objective: "Read the note" },
    limits: {
      maxActions: 4,
      maxChildren: 0,
      maxDelegationDepth: 0,
      maxNoProgress: 2,
      maxSteps: 8,
    },
    noProgressCount: 0,
    pluginId: "curiosity.agent",
    revision: 0,
    runId: "run-1",
    sourceEventId: "event-1",
    state,
    stateDigest: await sha256(canonicalJson(state)),
    status: "running",
    updatedAt: "2026-08-29T20:00:00.000Z",
    workflowName: "generalist",
  };
};

const journalFixture = async () => {
  let run = await projection();
  let commits = 0;
  let commitMode: "normal" | "throw-after" | "throw-before" = "normal";
  let reconciliations = 0;
  let settleMode: "normal" | "throw-after" | "throw-before" = "normal";
  const operations: string[] = [];

  const apply = async (input: AgentJournalCommitTransition) => {
    if (
      input.runId !== run.runId ||
      input.expectedRevision !== run.revision ||
      input.observedStateDigest !== run.stateDigest
    )
      throw new Error("NATIVE_AGENT_REVISION_FENCED");
    commits += 1;
    const provider = input.actions.find(
      ({ actionType }) => actionType === "provider.generate",
    );
    const next: AgentRunProjection = {
      ...run,
      actionCount: run.actionCount + input.actions.length,
      revision: run.revision + 1,
      state: input.nextState,
      stateDigest: await sha256(canonicalJson(input.nextState)),
      status: input.terminalRequested ? "completion-requested" : "running",
      updatedAt: input.committedAt,
    };
    if (provider) {
      run = {
        ...next,
        providerAction: {
          actionId: provider.actionId,
          input: provider.input,
          inputDigest: provider.inputDigest,
          status: "proposed",
        },
      };
    } else {
      const { providerAction: _providerAction, ...withoutProvider } = next;
      run = withoutProvider;
    }
    return {
      disposition: "accepted" as const,
      revision: run.revision,
      runId: run.runId,
    };
  };

  const journal: AgentJournalPort = {
    armDispatch: async (input) => {
      operations.push(`arm:${input.phase}`);
      const action = run.providerAction;
      if (!action) throw new Error("missing provider action");
      if (input.phase === "allocate") {
        run = {
          ...run,
          executionGeneration: input.generation,
          providerAction: {
            ...action,
            call: {
              allocatedAt: input.allocatedAt,
              attemptId: input.attemptId,
              callId: input.callId,
              dispatchState: "armed",
              generation: input.generation,
              modelId:
                input.dispatch.kind === "provider"
                  ? input.dispatch.modelId
                  : "invalid",
              promptSnapshotDigest:
                input.dispatch.kind === "provider"
                  ? input.dispatch.promptSnapshotDigest
                  : "invalid",
              requestDigest: input.dispatch.requestDigest,
              sourceRevision:
                input.dispatch.kind === "provider"
                  ? input.dispatch.sourceRevision
                  : -1,
              status: "allocated",
            },
            status: "running",
          },
        };
        return {
          actionId: input.actionId,
          attemptId: input.attemptId,
          callId: input.callId,
          disposition: "armed",
          generation: input.generation,
        };
      }
      const call = action.call;
      if (!call) throw new Error("missing provider call");
      run = {
        ...run,
        providerAction: {
          ...action,
          call: {
            ...call,
            dispatchState: "dispatched",
            dispatchedAt: input.authorizedAt,
          },
        },
      };
      return {
        actionId: input.actionId,
        attemptId: input.attemptId,
        callId: input.callId,
        disposition: "authorized",
        generation: input.generation,
      };
    },
    commitTransition: async (input) => {
      operations.push("commit");
      if (commitMode === "throw-before") {
        commitMode = "normal";
        throw new Error("SIMULATED_CRASH_BEFORE_COMMIT");
      }
      const result = await apply(input);
      if (commitMode === "throw-after") {
        commitMode = "normal";
        throw new Error("SIMULATED_CRASH_AFTER_COMMIT");
      }
      return result;
    },
    readRunProjection: async (runId) => {
      operations.push("read");
      return runId === run.runId ? run : undefined;
    },
    reconcileInterrupted: async (reconciledAt) => {
      operations.push("reconcile");
      reconciliations += 1;
      const action = run.providerAction;
      const call = action?.call;
      if (!action || action.status !== "running" || !call) return [];
      const dispatched = call.dispatchState === "dispatched";
      run = {
        ...run,
        providerAction: {
          ...action,
          call: {
            ...call,
            completedAt: reconciledAt,
            errorCode: dispatched
              ? "INTERRUPTED_DELIVERY_UNKNOWN"
              : "INTERRUPTED_NOT_DISPATCHED",
            status: dispatched ? "delivery-unknown" : "failed",
          },
          errorCode: dispatched
            ? "INTERRUPTED_DELIVERY_UNKNOWN"
            : "INTERRUPTED_NOT_DISPATCHED",
          status: dispatched ? "delivery-unknown" : "proposed",
        },
      };
      return [
        {
          actionId: action.actionId,
          attemptId: call.attemptId,
          callId: call.callId,
          classification: dispatched
            ? ("delivery-unknown" as const)
            : ("not-dispatched" as const),
          generation: call.generation,
          kind: "provider" as const,
        },
      ];
    },
    runnableRuns: async () => {
      operations.push("runnable");
      if (run.status !== "running") return [];
      if ((run.state as { phase?: string }).phase === "waiting-actions")
        return [];
      return [run];
    },
    settleAttempt: async (input) => {
      operations.push("settle");
      if (settleMode === "throw-before") {
        settleMode = "normal";
        throw new Error("SIMULATED_CRASH_BEFORE_SETTLEMENT");
      }
      const action = run.providerAction;
      const call = action?.call;
      if (!action || !call) throw new Error("missing provider attempt");
      const terminalEvent = input.events[0];
      if (!terminalEvent) throw new Error("missing terminal event");
      const status = input.status === "cancelled" ? "failed" : input.status;
      run = {
        ...run,
        providerAction: {
          ...action,
          call: {
            ...call,
            completedAt: input.completedAt,
            ...(input.errorCode ? { errorCode: input.errorCode } : {}),
            outputDigest: input.outputDigest,
            status,
            terminalEvent,
          },
          ...(input.errorCode ? { errorCode: input.errorCode } : {}),
          outputDigest: input.outputDigest,
          status,
        },
      };
      const result = {
        actionId: input.actionId,
        attemptId: input.attemptId,
        callId: input.callId,
        disposition: "committed" as const,
        generation: input.generation,
      };
      if (settleMode === "throw-after") {
        settleMode = "normal";
        throw new Error("SIMULATED_CRASH_AFTER_SETTLEMENT");
      }
      return result;
    },
    startRun: async () => {
      throw new Error("unexpected startRun");
    },
  };

  return {
    bumpRevision: async () => {
      run = {
        ...run,
        revision: run.revision + 1,
        stateDigest: await sha256(`new-state-${run.revision + 1}`),
      };
    },
    commits: () => commits,
    journal,
    operations,
    reconciliations: () => reconciliations,
    run: () => run,
    setCommitMode: (mode: typeof commitMode) => {
      commitMode = mode;
    },
    setSettleMode: (mode: typeof settleMode) => {
      settleMode = mode;
    },
  };
};

const kernelFixture = async (
  journalValue: Awaited<ReturnType<typeof journalFixture>>,
  proposal: unknown,
  onStep?: () => Promise<void>,
) => {
  const contextPlan = await createContextPlan(
    [
      {
        blockId: "objective-1",
        content: "Read the governed note.",
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
  const stepIds: string[] = [];
  let steps = 0;
  const agentStep: AgentStepPort = {
    step: async (request) => {
      journalValue.operations.push("model");
      steps += 1;
      stepIds.push(request.stepId);
      await onStep?.();
      return {
        contextPlanId: request.contextPlan.contextPlanId,
        durationMs: 1,
        modelId: request.route.modelId,
        observedRunRevision: request.observedRunRevision,
        observedStateDigest: request.observedStateDigest,
        proposal: proposal as never,
        runId: request.runId,
        selectionId: request.route.selectionId,
        stepId: request.stepId,
        stepNumber: request.stepNumber,
      };
    },
  };
  const planner = {
    plan: () => ({
      agent: { id: "generalist", version: "1" },
      contextPlan,
      finalizationOnly: false,
      route,
      tools: [
        {
          definition: {
            description: "Read one governed app document.",
            inputSchema: { type: "object" },
            toolId: "document.read",
            version: "1",
          },
          pluginId: "curiosity.documents",
          propose: (
            input: unknown,
            { executionId }: { executionId: string },
          ) => ({
            actionSchemaVersion: 1,
            actionType: "document.read",
            deadlineClass: "interactive" as const,
            gateClass: "none-requested" as const,
            input,
            requestedCapabilities: ["documents.read"],
            schemaVersion: 1 as const,
            subject: {
              executionId,
              resource: `document:${(input as { documentId: string }).documentId}`,
            },
          }),
          reactorId: "generalist",
        },
      ],
    }),
  };
  const kernel = () =>
    new AgentKernel({
      agentStep,
      catalogDigest,
      eligibleActorId: "local-ipad-owner",
      journal: journalValue.journal,
      now: () => "2026-08-29T20:00:01.000Z",
      planner,
      sha256,
    });
  return { agentStep, kernel, planner, stepIds, steps: () => steps };
};

describe("serialized portable agent kernel", () => {
  test("allocates, arms, authorizes, invokes once, and settles before applying", async () => {
    const journal = await journalFixture();
    const fixture = await kernelFixture(journal, {
      citations: [],
      kind: "final",
      text: "Done",
    });
    const generated = await fixture
      .kernel()
      .drainOne(new AbortController().signal);
    expect(generated.kind).toBe("provider-settled");
    expect(journal.operations).toEqual([
      "runnable",
      "commit",
      "read",
      "arm:allocate",
      "arm:authorize",
      "model",
      "settle",
    ]);
    expect(journal.run().status).toBe("running");
    const applied = await fixture
      .kernel()
      .drainOne(new AbortController().signal);
    expect(applied.kind).toBe("committed");
    expect(fixture.steps()).toBe(1);
    expect(journal.commits()).toBe(2);
    expect(journal.run().status).toBe("completion-requested");
  });

  test("applies a settled action proposal without invoking the model again", async () => {
    const journal = await journalFixture();
    const fixture = await kernelFixture(journal, {
      actions: [
        {
          callKey: "read-note",
          input: { documentId: "notes/one.txt" },
          toolId: "document.read",
          toolVersion: "1",
        },
      ],
      kind: "actions",
    });
    await fixture.kernel().drainOne(new AbortController().signal);
    const applied = await fixture
      .kernel()
      .drainOne(new AbortController().signal);
    expect(applied.kind).toBe("committed");
    expect(journal.run().actionCount).toBe(2);
    expect((journal.run().state as { phase: string }).phase).toBe(
      "waiting-actions",
    );
    expect(fixture.steps()).toBe(1);
  });

  test("settles model failure once and never hides a retry", async () => {
    const journal = await journalFixture();
    let calls = 0;
    const fixture = await kernelFixture(journal, {
      citations: [],
      kind: "final",
      text: "unused",
    });
    const failing = new AgentKernel({
      agentStep: {
        step: async () => {
          calls += 1;
          throw new Error("MODEL_FAILED");
        },
      },
      catalogDigest,
      eligibleActorId: "local-ipad-owner",
      journal: journal.journal,
      now: () => "2026-08-29T20:00:01.000Z",
      planner: fixture.planner,
      sha256,
    });
    await expect(
      failing.drainOne(new AbortController().signal),
    ).rejects.toThrow("MODEL_FAILED");
    expect(calls).toBe(1);
    expect(journal.run().providerAction?.status).toBe("failed");
    expect(await failing.drainOne(new AbortController().signal)).toMatchObject({
      kind: "provider-blocked",
      reason: "failed",
    });
    expect(calls).toBe(1);
  });

  test("reuses durable allocation after crashes before and after its acknowledgement", async () => {
    const before = await journalFixture();
    before.setCommitMode("throw-before");
    const beforeFixture = await kernelFixture(before, {
      citations: [],
      kind: "final",
      text: "Done",
    });
    await expect(
      beforeFixture.kernel().drainOne(new AbortController().signal),
    ).rejects.toThrow("SIMULATED_CRASH_BEFORE_COMMIT");
    await beforeFixture.kernel().drainOne(new AbortController().signal);
    expect(beforeFixture.steps()).toBe(1);

    const after = await journalFixture();
    after.setCommitMode("throw-after");
    const afterFixture = await kernelFixture(after, {
      citations: [],
      kind: "final",
      text: "Done",
    });
    await expect(
      afterFixture.kernel().drainOne(new AbortController().signal),
    ).rejects.toThrow("SIMULATED_CRASH_AFTER_COMMIT");
    await afterFixture.kernel().drainOne(new AbortController().signal);
    expect(afterFixture.steps()).toBe(1);
  });

  test("does not replay a dispatched call after crash before settlement", async () => {
    const journal = await journalFixture();
    journal.setSettleMode("throw-before");
    const fixture = await kernelFixture(journal, {
      citations: [],
      kind: "final",
      text: "Done",
    });
    await expect(
      fixture.kernel().drainOne(new AbortController().signal),
    ).rejects.toThrow("SIMULATED_CRASH_BEFORE_SETTLEMENT");
    expect(fixture.steps()).toBe(1);
    await fixture.kernel().recover("2026-08-29T20:00:02.000Z");
    expect(
      await fixture.kernel().drainOne(new AbortController().signal),
    ).toMatchObject({
      kind: "provider-blocked",
      reason: "delivery-unknown",
    });
    expect(fixture.steps()).toBe(1);
  });

  test("applies a settled result after acknowledgement loss without a second call", async () => {
    const journal = await journalFixture();
    journal.setSettleMode("throw-after");
    const fixture = await kernelFixture(journal, {
      citations: [],
      kind: "final",
      text: "Done",
    });
    await expect(
      fixture.kernel().drainOne(new AbortController().signal),
    ).rejects.toThrow("SIMULATED_CRASH_AFTER_SETTLEMENT");
    expect(
      await fixture.kernel().drainOne(new AbortController().signal),
    ).toMatchObject({ kind: "committed", proposalKind: "final" });
    expect(fixture.steps()).toBe(1);
  });

  test("rejects a revision changed after generation without applying the proposal", async () => {
    const journal = await journalFixture();
    const fixture = await kernelFixture(
      journal,
      { citations: [], kind: "final", text: "Stale" },
      journal.bumpRevision,
    );
    await fixture.kernel().drainOne(new AbortController().signal);
    await expect(
      fixture.kernel().drainOne(new AbortController().signal),
    ).rejects.toThrow("AGENT_KERNEL_STALE_STEP");
    expect(fixture.steps()).toBe(1);
    expect(journal.run().status).toBe("running");
  });

  test("delegates relaunch reconciliation exactly once", async () => {
    const journal = await journalFixture();
    const fixture = await kernelFixture(journal, {
      citations: [],
      kind: "final",
      text: "Done",
    });
    await fixture.kernel().recover("2026-08-29T20:00:02.000Z");
    expect(journal.reconciliations()).toBe(1);
    expect(fixture.steps()).toBe(0);
  });
});
