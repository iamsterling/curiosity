import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "bun:test";
import { canonicalJson } from "@curiosity/authority";
import {
  mobileAgentCatalogIdentity,
  mobileAgentPolicyVersion,
} from "../src/mobile-agent-catalog.ts";
import { createMobileAgentPlanner } from "../src/mobile-agent-planner.ts";

const sha256 = async (value) =>
  createHash("sha256").update(value).digest("hex");

const event = (sequence, type, body, childExecutionId = "turn-1") => ({
  actorId: "local-ipad-owner",
  aggregateVersion: sequence,
  body,
  catalogDigest: "0".repeat(64),
  causationId: `cause-${sequence}`,
  childExecutionId,
  commandId: `command-${sequence}`,
  contributionId: "curiosity.stock.chat",
  contributionVersion: "1",
  correlationId: "thread-1",
  eventHash: String(sequence).repeat(64).slice(0, 64),
  eventId: `event-${sequence}`,
  eventSchemaVersion: 1,
  occurredAt: "2026-08-30T12:00:00.000Z",
  parentExecutionId: "turn-1",
  pluginId: "curiosity.stock.chat",
  previousHash: "0".repeat(64),
  rootExecutionId: "turn-1",
  sequence,
  streamId: "thread-1",
  type,
});

const state = { phase: "waiting-actions", schemaVersion: 1 };
const run = async () => ({
  actionCount: 2,
  capabilityCeiling: ["documents.read", "provider.generate"],
  childCount: 0,
  contributionId: "curiosity.agent.generalist",
  contributionVersion: "1",
  createdAt: "2026-08-30T12:00:00.000Z",
  depth: 0,
  executionGeneration: 1,
  executionId: "agent-execution:turn-1",
  input: {
    agentId: "generalist",
    assistantMessageId: "assistant-1",
    kind: "chat.turn",
    projectId: "project-1",
    schemaVersion: 1,
    text: "Read it",
    threadId: "thread-1",
    turnId: "turn-1",
    userMessageId: "user-1",
  },
  limits: {
    maxActions: 6,
    maxChildren: 2,
    maxDelegationDepth: 1,
    maxNoProgress: 2,
    maxSteps: 12,
  },
  noProgressCount: 0,
  pluginId: "curiosity.agent.runtime",
  revision: 2,
  runId: "agent-run:turn-1",
  sourceEventId: "event-2",
  state,
  stateDigest: await sha256(canonicalJson(state)),
  status: "running",
  updatedAt: "2026-08-30T12:00:02.000Z",
  workflowName: "generalist",
});

test("delegation advances role policy without changing the pinned catalog identity", () => {
  assert.equal(mobileAgentPolicyVersion, "2");
  assert.deepEqual(mobileAgentCatalogIdentity, {
    agents: [
      "analyst",
      "generalist",
      "implementer",
      "orchestrator",
      "researcher",
      "reviewer",
      "strategist",
      "worker",
    ],
    profile: "curiosity.ipados.durable-agent.v1",
    semanticCommands: ["chat.turn", "execution.cancel", "thread.open"],
    tools: [
      { toolId: "document.list", version: "1" },
      { toolId: "document.read", version: "1" },
      { toolId: "document.search", version: "1" },
    ],
    version: "1",
  });
});

test("static planner assembles bounded durable context and exact read tools", async () => {
  const events = [
    event(1, "message.appended", {
      messageId: "user-1",
      role: "user",
      text: "x".repeat(20_000),
      threadId: "thread-1",
      turnId: "turn-1",
    }),
    event(
      2,
      "action.succeeded",
      { receipt: { output: { content: "evidence" } }, schemaVersion: 1 },
      "agent-execution:turn-1",
    ),
    event(3, "turn.requested", {
      agentId: "generalist",
      assistantMessageId: "assistant-1",
      projectId: "project-1",
      schemaVersion: 1,
      threadId: "thread-1",
      turnId: "turn-1",
    }),
    event(4, "memory.recorded", {
      memory: {
        content: "The project uses a durable Curiosity-owned loop.",
        contentDigest: "a".repeat(64),
        jobId: "memory-job-1",
        kind: "decision",
        memoryId: "memory-1",
        policyId: "memory-policy-1",
        retention: "durable",
        sensitivity: "ordinary",
        sourceDigest: "b".repeat(64),
        sourceMessageIds: ["user-1"],
        version: 1,
      },
      schemaVersion: 1,
    }),
  ];
  let selections = 0;
  let selectedAgentId;
  const planner = createMobileAgentPlanner({
    events: async () => events,
    generationSelection: {
      select: async ({ agentId, purpose }) => {
        selections += 1;
        selectedAgentId = agentId;
        return {
          adapterVersion: "codex-direct-native-v1",
          locality: "frontier",
          modelId: "gpt-5.4-mini",
          providerId: "openai-oauth",
          purpose,
          requestedRouteId: "frontier.openai-oauth",
          routeId: "frontier.openai-oauth",
          selectionPolicyId: "ipados-frontier-connected-v1",
        };
      },
    },
    sha256,
  });

  const plan = await planner.plan(await run(), new AbortController().signal);

  assert.equal(selections, 1);
  assert.equal(selectedAgentId, "generalist");
  assert.equal(plan.agent.id, "generalist");
  assert.equal(plan.route.purpose, "agent.step");
  assert.deepEqual(
    plan.tools.map(({ definition }) => definition.toolId),
    ["document.list", "document.read", "document.search", "agent.delegate"],
  );
  assert.match(
    plan.contextPlan.blocks.find(
      ({ blockId }) => blockId === "conversation-tail",
    ).content,
    /\[truncated\]$/u,
  );
  assert.equal(
    plan.contextPlan.blocks.find(
      ({ blockId }) => blockId === "tool-evidence-tail",
    ).provenance,
    "untrusted-evidence",
  );
  assert.match(
    plan.contextPlan.blocks.find(
      ({ blockId }) => blockId === "active-project-memory",
    ).content,
    /durable Curiosity-owned loop/u,
  );

  const read = plan.tools.find(
    ({ definition }) => definition.toolId === "document.read",
  );
  assert.equal(
    (
      await read.propose(
        {
          documentId: "notes/project.txt",
          maxBytes: 4096,
          rootId: "app-documents-v1",
        },
        {
          callKey: "read-1",
          executionId: "agent-execution:turn-1",
          runId: "agent-run:turn-1",
        },
      )
    ).subject.resource,
    "document:notes/project.txt",
  );

  const delegate = plan.tools.find(
    ({ definition }) => definition.toolId === "agent.delegate",
  );
  const child = await delegate.allocate(
    {
      agentId: "reviewer",
      description: "Independent review",
      task: {
        acceptanceChecks: ["Return one verdict."],
        deliverable: "One verdict",
        nonGoals: ["Do not mutate files."],
        objective: "Review the bounded evidence.",
      },
    },
    {
      callKey: "delegate-1",
      executionId: "agent-execution:turn-1",
      ordinal: 0,
      parentDepth: 0,
      parentRunId: "agent-run:turn-1",
      sourceEventId: "event-2",
      stepId: "1".repeat(64),
    },
  );
  assert.deepEqual(child.capabilityCeiling, ["provider.generate"]);
  assert.equal(child.workflowName, "reviewer");
  assert.equal(child.initialState.delegation.parentRunId, "agent-run:turn-1");
  assert.equal(child.limits.maxDelegationDepth, 0);
  await assert.rejects(
    delegate.allocate(
      {
        agentId: "generalist",
        description: "Invalid primary child",
        task: {
          acceptanceChecks: ["Must not run."],
          deliverable: "Nothing",
          nonGoals: [],
          objective: "Attempt an invalid role.",
        },
      },
      {
        callKey: "delegate-invalid",
        executionId: "agent-execution:turn-1",
        ordinal: 0,
        parentDepth: 0,
        parentRunId: "agent-run:turn-1",
        sourceEventId: "event-2",
        stepId: "2".repeat(64),
      },
    ),
    /MOBILE_DELEGATION_REQUEST_INVALID/u,
  );
  await assert.rejects(
    delegate.allocate(
      {
        agentId: "reviewer",
        description: "Nested child",
        task: {
          acceptanceChecks: ["Must not run."],
          deliverable: "Nothing",
          nonGoals: [],
          objective: "Attempt nested delegation.",
        },
      },
      {
        callKey: "delegate-nested",
        executionId: "agent-execution:child",
        ordinal: 0,
        parentDepth: 1,
        parentRunId: "agent-run:child",
        sourceEventId: "event-child",
        stepId: "3".repeat(64),
      },
    ),
    /MOBILE_DELEGATION_DEPTH_EXCEEDED/u,
  );
});

test("answered agent question becomes explicit current operator content", async () => {
  const waitingQuestion = {
    phase: "waiting-question",
    questionActionId: "question-action-1",
    schemaVersion: 1,
  };
  const resumed = {
    ...(await run()),
    state: waitingQuestion,
    stateDigest: await sha256(canonicalJson(waitingQuestion)),
  };
  const events = [
    event(1, "message.appended", {
      messageId: "user-1",
      role: "user",
      text: "Hello",
      threadId: "thread-1",
      turnId: "turn-1",
    }),
    event(
      2,
      "question.asked",
      {
        actionId: "question-action-1",
        prompt: "What would you like help with?",
        questionId: "question:question-action-1:1",
        schemaVersion: 1,
      },
      "agent-execution:turn-1",
    ),
    event(
      3,
      "question.answered",
      {
        answer: "State one fact about the Moon in one sentence.",
        provenance: "untrusted-user-answer",
        questionId: "question:question-action-1:1",
        schemaVersion: 1,
      },
      "agent-execution:turn-1",
    ),
    event(
      4,
      "action.succeeded",
      {
        actionId: "question-action-1",
        actionType: "question.ask",
        output: {
          answer: "State one fact about the Moon in one sentence.",
          provenance: "untrusted-user-answer",
          questionId: "question:question-action-1:1",
          schemaVersion: 1,
        },
        schemaVersion: 1,
      },
      "agent-execution:turn-1",
    ),
  ];
  const planner = createMobileAgentPlanner({
    events: async () => events,
    generationSelection: {
      select: async ({ purpose }) => ({
        adapterVersion: "codex-direct-native-v1",
        locality: "frontier",
        modelId: "gpt-5.4-mini",
        providerId: "openai-oauth",
        purpose,
        requestedRouteId: "frontier.openai-oauth",
        routeId: "frontier.openai-oauth",
        selectionPolicyId: "apple-operator-role-route-v1",
      }),
    },
    sha256,
  });

  const plan = await planner.plan(resumed, new AbortController().signal);
  const answer = plan.contextPlan.blocks.find(
    ({ blockId }) => blockId === "operator-question-answer",
  );

  assert.equal(answer.kind, "conversation");
  assert.equal(answer.provenance, "trusted-durable");
  assert.deepEqual(JSON.parse(answer.content), {
    answer: "State one fact about the Moon in one sentence.",
    prompt: "What would you like help with?",
    relationship: "operator-answer-to-agent-question",
    schemaVersion: 1,
  });
  assert.deepEqual(answer.sourceEventIds, ["event-2", "event-3"]);
  assert.equal(
    plan.contextPlan.blocks.some(
      ({ blockId }) => blockId === "tool-evidence-tail",
    ),
    false,
  );
});

test("child planning receives a fresh bounded task and no parent tools or transcript", async () => {
  const root = await run();
  const childState = {
    delegation: {
      agentId: "reviewer",
      callKey: "delegate-1",
      description: "Independent review",
      ordinal: 0,
      parentExecutionId: root.executionId,
      parentRunId: root.runId,
      stepId: "1".repeat(64),
      task: {
        acceptanceChecks: ["Return one verdict."],
        deliverable: "One verdict",
        nonGoals: ["Do not mutate files."],
        objective: "Review the bounded evidence.",
      },
    },
    phase: "ready",
    schemaVersion: 1,
  };
  const child = {
    ...root,
    actionCount: 0,
    capabilityCeiling: ["provider.generate"],
    childKey: "child:one",
    contributionId: "curiosity.agent.reviewer",
    depth: 1,
    executionId: "agent-execution:child-1",
    input: { childKey: "child:one", parentInstanceId: root.runId },
    limits: {
      maxActions: 2,
      maxChildren: 0,
      maxDelegationDepth: 0,
      maxNoProgress: 1,
      maxSteps: 4,
    },
    parentRunId: root.runId,
    revision: 0,
    runId: "agent-run:child-1",
    state: childState,
    stateDigest: await sha256(canonicalJson(childState)),
    workflowName: "reviewer",
  };
  const planner = createMobileAgentPlanner({
    events: async () => [
      event(1, "message.appended", {
        messageId: "user-1",
        role: "user",
        text: "Parent transcript must not leak",
        threadId: "thread-1",
        turnId: "turn-1",
      }),
    ],
    generationSelection: {
      select: async ({ purpose }) => ({
        adapterVersion: "codex-direct-native-v1",
        locality: "frontier",
        modelId: "gpt-5.4-mini",
        providerId: "openai-oauth",
        purpose,
        requestedRouteId: "frontier.openai-oauth",
        routeId: "frontier.openai-oauth",
        selectionPolicyId: "ipados-frontier-connected-v1",
      }),
    },
    sha256,
  });

  const plan = await planner.plan(child, new AbortController().signal);

  assert.equal(plan.agent.id, "reviewer");
  assert.deepEqual(plan.tools, []);
  assert.equal(
    plan.contextPlan.blocks.some(
      ({ blockId }) => blockId === "conversation-tail",
    ),
    false,
  );
  assert.match(
    plan.contextPlan.blocks.find(({ blockId }) => blockId === "delegated-task")
      .content,
    /Review the bounded evidence/u,
  );
});

test("parent planning projects terminal child results in allocation order", async () => {
  const parent = await run();
  const waiting = {
    children: [
      {
        childKey: "child:first",
        ordinal: 0,
        runId: "agent-run:child-first",
        workflowName: "reviewer",
      },
      {
        childKey: "child:second",
        ordinal: 1,
        runId: "agent-run:child-second",
        workflowName: "analyst",
      },
    ],
    phase: "waiting-children",
    schemaVersion: 1,
  };
  const childEvent = (sequence, runId, type, body) => ({
    ...event(sequence, type, body, `execution:${runId}`),
    eventId: `child-event-${sequence}`,
    parentExecutionId: parent.executionId,
    streamId: runId,
  });
  const events = [
    childEvent(1, "agent-run:child-first", "workflow.child-created", {
      childKey: "child:first",
      parentInstanceId: parent.runId,
      workflowName: "reviewer",
    }),
    childEvent(2, "agent-run:child-second", "workflow.child-created", {
      childKey: "child:second",
      parentInstanceId: parent.runId,
      workflowName: "analyst",
    }),
    childEvent(3, "agent-run:child-second", "workflow.advanced", {
      state: {
        final: { citations: [], text: "Second result" },
        phase: "final",
        schemaVersion: 1,
      },
    }),
    childEvent(4, "agent-run:child-second", "workflow.completed", {
      status: "completed",
    }),
    childEvent(5, "agent-run:child-first", "workflow.advanced", {
      state: {
        final: { citations: [], text: "First result" },
        phase: "final",
        schemaVersion: 1,
      },
    }),
    childEvent(6, "agent-run:child-first", "workflow.completed", {
      status: "completed",
    }),
  ];
  const planner = createMobileAgentPlanner({
    events: async () => events,
    generationSelection: {
      select: async ({ purpose }) => ({
        adapterVersion: "codex-direct-native-v1",
        locality: "frontier",
        modelId: "gpt-5.4-mini",
        providerId: "openai-oauth",
        purpose,
        requestedRouteId: "frontier.openai-oauth",
        routeId: "frontier.openai-oauth",
        selectionPolicyId: "ipados-frontier-connected-v1",
      }),
    },
    sha256,
  });

  const plan = await planner.plan(
    {
      ...parent,
      childCount: 2,
      state: waiting,
      stateDigest: await sha256(canonicalJson(waiting)),
    },
    new AbortController().signal,
  );
  const childResults = plan.contextPlan.blocks.find(
    ({ blockId }) => blockId === "child-results",
  );

  assert.equal(childResults.provenance, "untrusted-evidence");
  assert.ok(childResults.content.indexOf("First result") > -1);
  assert.ok(
    childResults.content.indexOf("Second result") >
      childResults.content.indexOf("First result"),
  );
  assert.deepEqual(childResults.sourceEventIds, [
    "child-event-1",
    "child-event-5",
    "child-event-6",
    "child-event-2",
    "child-event-3",
    "child-event-4",
  ]);
  assert.equal(
    plan.tools.some(({ definition }) => definition.toolId === "agent.delegate"),
    false,
  );
});
