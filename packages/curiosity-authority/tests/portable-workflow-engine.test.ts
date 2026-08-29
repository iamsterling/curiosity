import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import {
  PortableWorkflowEngine,
  planWorkflowTransition,
  validateWorkflowTransition,
  type StoredWorkflowInstance,
  type WorkflowCatalogPort,
  type WorkflowCommitTransitionInput,
  type WorkflowDefinition,
  type WorkflowJournalPort,
} from "../src/index.js";

const limits = {
  maxActions: 4,
  maxChildren: 2,
  maxDelegationDepth: 1,
  maxNoProgress: 2,
  maxSteps: 4,
} as const;
const sha256 = async (value: string) =>
  createHash("sha256").update(value).digest("hex");

const definition = (
  transition: WorkflowDefinition["transition"],
): WorkflowDefinition => ({
  id: "curiosity.test.workflows.root",
  initialState: { phase: "queued" },
  limits,
  name: "root",
  pluginId: "curiosity.test",
  transition,
  version: "1.0.0",
});

const journalFixture = () => {
  let instance: StoredWorkflowInstance | undefined;
  const commits: WorkflowCommitTransitionInput[] = [];
  const failures: string[] = [];
  const journal: WorkflowJournalPort = {
    children: () => [],
    commitTransition: (input) => {
      if (!instance || instance.stepCount !== input.expectedStep)
        throw new Error("WORKFLOW_STEP_FENCED");
      commits.push(input);
      instance = {
        ...instance,
        actionCount: instance.actionCount + input.actions.length,
        childCount: instance.childCount + input.children.length,
        state: input.nextState,
        status: input.terminalRequested ? "completion-requested" : "running",
        stepCount: instance.stepCount + 1,
        updatedAt: input.committedAt,
      };
    },
    ensureRoot: (input) => {
      if (instance) return "existing";
      instance = {
        actionCount: 0,
        capabilityCeiling: input.capabilityCeiling,
        childCount: 0,
        contributionId: input.contribution.id,
        contributionVersion: input.contribution.version,
        createdAt: input.startedAt,
        depth: 0,
        executionId: input.instanceId,
        input: input.input,
        instanceId: input.instanceId,
        limits: input.contribution.limits,
        noProgressCount: 0,
        pluginId: input.contribution.pluginId,
        sourceEventId: input.sourceEventId,
        state: input.contribution.initialState,
        status: "running",
        stepCount: 0,
        updatedAt: input.startedAt,
        workflowName: input.contribution.name,
      };
      return "created";
    },
    fail: (_instance, errorCode, at) => {
      failures.push(errorCode);
      if (instance)
        instance = { ...instance, errorCode, status: "failed", updatedAt: at };
    },
    readEvents: () => [
      {
        body: {
          capabilityRequests: ["document.read", "denied"],
          input: { objective: "Read the document" },
          instanceId: "workflow-root",
          schemaVersion: 1,
          workflowName: "root",
        },
        eventId: "event-request",
        pluginId: "curiosity.test",
        type: "workflow.requested",
      },
    ],
    reconcileTerminals: () => {
      if (instance?.status !== "completion-requested") return 0;
      instance = { ...instance, status: "completed" };
      return 1;
    },
    runnable: () => (instance?.status === "running" ? [instance] : []),
  };
  return {
    commits,
    failures,
    instance: () => instance,
    journal,
  };
};

describe("portable workflow engine", () => {
  test("drains a two-step workflow through only portable ports", async () => {
    const fixture = journalFixture();
    const root = definition(({ step }) => ({
      actions: [],
      children: [],
      nextState: { phase: step === 0 ? "working" : "done" },
      progressKey: step === 0 ? "planned" : "completed",
      terminalRequested: step === 1,
    }));
    const engine = new PortableWorkflowEngine({
      catalog: { workflow: (name) => (name === "root" ? root : undefined) },
      eligibleActorId: "local-owner",
      grantedCapabilities: new Set(["document.read"]),
      journal: fixture.journal,
      now: () => 1_725_000_000_000,
      sha256,
    });

    expect(await engine.drain()).toBe(4);
    expect(fixture.commits.map(({ progressKey }) => progressKey)).toEqual([
      "planned",
      "completed",
    ]);
    expect(fixture.instance()).toMatchObject({
      capabilityCeiling: ["document.read"],
      state: { phase: "done" },
      status: "completed",
      stepCount: 2,
    });
    expect(fixture.failures).toEqual([]);
  });

  test("rejects malformed transition output without committing it", async () => {
    const fixture = journalFixture();
    const root = definition(() => ({ unexpected: true }));
    const engine = new PortableWorkflowEngine({
      catalog: { workflow: () => root },
      eligibleActorId: "local-owner",
      grantedCapabilities: new Set(),
      journal: fixture.journal,
      now: () => 1_725_000_000_000,
      sha256,
    });

    await expect(engine.drain()).rejects.toMatchObject({
      code: "WORKFLOW_TRANSITION_INVALID",
      pluginId: "curiosity.test",
    });
    expect(fixture.commits).toEqual([]);
    expect(fixture.instance()?.status).toBe("running");
  });

  test("produces stable action, child, and transition identities", async () => {
    const instance: StoredWorkflowInstance = {
      actionCount: 0,
      capabilityCeiling: ["document.read"],
      childCount: 0,
      contributionId: "curiosity.test.workflows.root",
      contributionVersion: "1.0.0",
      createdAt: "2026-08-29T00:00:00.000Z",
      depth: 0,
      executionId: "workflow-root",
      input: { objective: "read" },
      instanceId: "workflow-root",
      limits,
      noProgressCount: 0,
      pluginId: "curiosity.test",
      sourceEventId: "event-request",
      state: { phase: "queued" },
      status: "running",
      stepCount: 0,
      updatedAt: "2026-08-29T00:00:00.000Z",
      workflowName: "root",
    };
    const child = {
      ...definition(() => ({})),
      id: "curiosity.test.workflows.child",
      name: "child",
    };
    const catalog: WorkflowCatalogPort = {
      workflow: (name) => (name === "child" ? child : undefined),
    };
    const output = validateWorkflowTransition({
      actions: [
        {
          actionSchemaVersion: 1,
          actionType: "document.read",
          deadlineClass: "interactive",
          gateClass: "none-requested",
          input: { documentId: "document-001" },
          requestedCapabilities: ["document.read"],
          schemaVersion: 1,
          subject: {
            executionId: "workflow-root",
            resource: "document:document-001",
          },
        },
      ],
      children: [
        {
          id: "review",
          requestedCapabilities: ["document.read"],
          workflowName: "child",
        },
      ],
      nextState: { phase: "waiting" },
      progressKey: "allocated",
      terminalRequested: false,
    });

    const plan = await planWorkflowTransition(instance, output, catalog, sha256);
    expect(plan.actions[0]?.actionId).toBe(
      "83d3f00588e0ab7d47acaa00a813de5c373923210656b5a00ae4c13e1ef030d7",
    );
    expect(plan.children[0]?.instanceId).toBe(
      "child:79f46c6ff711d9fcefa02355122f91ae7e40b274f853b6f14ada91120db40e5b",
    );
    expect(plan.transitionDigest).toBe(
      "481db2959db2b4202e942436bd8231e33ae928a5d438dfcc76e12e4d81bb027b",
    );
  });
});
