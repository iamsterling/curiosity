import assert from "node:assert/strict";
import test from "node:test";
import {
  assignThreadToProject,
  projectIdForThread,
  threadsForProject,
  threadsForProjects,
} from "../src/project-session-index.ts";

const threads = [
  { sequence: 1, threadId: "default-thread", title: "Default" },
  { sequence: 2, threadId: "other-thread", title: "Other" },
];

test("unassigned durable threads belong to the default project", () => {
  assert.equal(projectIdForThread({}, "default-thread"), "curiosity");
  assert.deepEqual(
    threadsForProject({}, "curiosity", threads).map(({ threadId }) => threadId),
    ["default-thread", "other-thread"],
  );
});

test("thread ownership isolates project session lists", () => {
  const ownership = assignThreadToProject({}, "project:other", "other-thread");
  assert.deepEqual(
    threadsForProject(ownership, "curiosity", threads).map(
      ({ threadId }) => threadId,
    ),
    ["default-thread"],
  );
  assert.deepEqual(
    threadsForProject(ownership, "project:other", threads).map(
      ({ threadId }) => threadId,
    ),
    ["other-thread"],
  );
});

test("organization session lists include only their projects", () => {
  const ownership = assignThreadToProject({}, "project:other", "other-thread");
  assert.deepEqual(
    threadsForProjects(ownership, ["project:other"], threads).map(
      ({ threadId }) => threadId,
    ),
    ["other-thread"],
  );
});
