import assert from "node:assert/strict";
import test from "node:test";
import {
  initialCuriosityWorkspaceState,
  projectWorkspaceState,
  updateProjectWorkspaceState,
} from "../src/curiosity-workspace-state.ts";

test("project workspace state starts isolated and empty", () => {
  assert.deepEqual(projectWorkspaceState(initialCuriosityWorkspaceState, "one"), {
    busy: false,
    messages: [],
  });
  assert.deepEqual(projectWorkspaceState(initialCuriosityWorkspaceState, "two"), {
    busy: false,
    messages: [],
  });
});

test("updating one project preserves every other project session", () => {
  const one = updateProjectWorkspaceState(
    initialCuriosityWorkspaceState,
    "one",
    () => ({
      activeThreadId: "thread-one",
      busy: false,
      messages: [{ messageId: "message-one", role: "user", text: "One" }],
    }),
  );
  const two = updateProjectWorkspaceState(one, "two", () => ({
    activeThreadId: "thread-two",
    busy: false,
    messages: [{ messageId: "message-two", role: "user", text: "Two" }],
  }));

  assert.equal(projectWorkspaceState(two, "one").activeThreadId, "thread-one");
  assert.equal(projectWorkspaceState(two, "two").activeThreadId, "thread-two");
  assert.equal(projectWorkspaceState(two, "one").messages[0]?.text, "One");
  assert.equal(projectWorkspaceState(two, "two").messages[0]?.text, "Two");
});
