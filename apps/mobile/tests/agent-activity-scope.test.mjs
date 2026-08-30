import assert from "node:assert/strict";
import test from "node:test";
import {
  agentRunsForProjects,
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
});
