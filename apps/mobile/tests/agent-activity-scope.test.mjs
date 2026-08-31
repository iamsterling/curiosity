import assert from "node:assert/strict";
import test from "node:test";
import {
  agentOperatorRequestsForRuns,
  agentRunTerminalError,
  agentRunTerminalKey,
  agentRunsForProjects,
  agentRunsForThread,
  latestRootRun,
  pendingAgentQuestionMessages,
  projectIdForAgentRun,
} from "../src/agent-activity-scope.ts";

const run = (runId, input) => ({ input, runId });

test("agent activity follows project and organization ownership", () => {
  const runs = [
    run("default", { goal: "one" }),
    run("alpha", { projectId: "alpha" }),
    run("beta", { projectId: "beta" }),
  ];
  assert.equal(projectIdForAgentRun(runs[0]), "curiosity");
  assert.deepEqual(
    agentRunsForProjects(runs, ["alpha"]).map(({ runId }) => runId),
    ["alpha"],
  );
  assert.deepEqual(
    agentRunsForProjects(runs, ["curiosity", "beta"]).map(({ runId }) => runId),
    ["default", "beta"],
  );
  const requests = agentOperatorRequestsForRuns(
    {
      gates: [
        { gateId: "gate-alpha", runId: "alpha" },
        { gateId: "gate-beta", runId: "beta" },
      ],
      questions: [
        { questionId: "question-alpha", runId: "alpha" },
        { questionId: "question-beta", runId: "beta" },
      ],
    },
    agentRunsForProjects(runs, ["alpha"]),
  );
  assert.deepEqual(
    requests.gates.map(({ gateId }) => gateId),
    ["gate-alpha"],
  );
  assert.deepEqual(
    requests.questions.map(({ questionId }) => questionId),
    ["question-alpha"],
  );
  assert.ok(Object.isFrozen(requests));
});

test("conversation operator requests include only its run family", () => {
  const runs = [
    { ...run("root-alpha", { projectId: "alpha", threadId: "thread-1" }) },
    {
      ...run("child-alpha", { task: "delegated" }),
      parentRunId: "root-alpha",
    },
    { ...run("other-thread", { projectId: "alpha", threadId: "thread-2" }) },
    { ...run("other-project", { projectId: "beta", threadId: "thread-1" }) },
  ];

  assert.deepEqual(
    agentRunsForThread(runs, "alpha", "thread-1").map(({ runId }) => runId),
    ["root-alpha", "child-alpha"],
  );
  assert.deepEqual(agentRunsForThread(runs, "alpha", undefined), []);
});

test("latest root terminal status refreshes or surfaces its durable failure", () => {
  const failed = {
    ...run("root-failed", { projectId: "alpha", threadId: "thread-1" }),
    errorCode: "PROVIDER_ROUTE_UNAVAILABLE",
    revision: 3,
    status: "failed",
  };
  const child = {
    ...run("child-newer", { task: "delegated" }),
    parentRunId: "root-failed",
    revision: 4,
    status: "completed",
  };

  const latest = latestRootRun([child, failed]);

  assert.equal(latest.runId, "root-failed");
  assert.equal(agentRunTerminalError(latest), "PROVIDER_ROUTE_UNAVAILABLE");
  assert.equal(agentRunTerminalKey(latest), "root-failed:3:failed");
  assert.equal(
    agentRunTerminalKey({ ...failed, status: "running" }),
    undefined,
  );
});

test("pending questions project as ordinary assistant messages", () => {
  const messages = pendingAgentQuestionMessages([
    {
      options: ["Amber", "Blue"],
      prompt: "Which color?",
      questionId: "question-1",
      status: "pending",
    },
    {
      options: [],
      prompt: "Old question",
      questionId: "question-2",
      status: "answered",
    },
  ]);

  assert.deepEqual(messages, [
    {
      messageId: "agent-question:question-1",
      role: "assistant",
      text: "Which color?\n\nOptions: Amber · Blue",
    },
  ]);
  assert.ok(Object.isFrozen(messages));
  assert.ok(Object.isFrozen(messages[0]));
});
