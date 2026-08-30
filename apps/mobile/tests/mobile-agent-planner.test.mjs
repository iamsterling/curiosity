import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "bun:test";
import { canonicalJson } from "@curiosity/authority";
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
    maxChildren: 0,
    maxDelegationDepth: 0,
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
  const planner = createMobileAgentPlanner({
    events: async () => events,
    generationSelection: {
      select: async ({ purpose }) => {
        selections += 1;
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
  assert.equal(plan.agent.id, "generalist");
  assert.equal(plan.route.purpose, "agent.step");
  assert.deepEqual(
    plan.tools.map(({ definition }) => definition.toolId),
    ["document.list", "document.read", "document.search"],
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
});
