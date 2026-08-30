import assert from "node:assert/strict";
import test from "node:test";
import { resolveProjectPaneLayout } from "../src/components/project-pane-layout.ts";

test("workspace child keeps artifact and content columns in wide windows", () => {
  assert.deepEqual(resolveProjectPaneLayout(1_200, "content"), {
    canvas: true,
    sessions: true,
  });
});

test("project route alternates between its session sidebar and canvas below wide width", () => {
  assert.deepEqual(resolveProjectPaneLayout(1_024, "content"), {
    canvas: true,
    sessions: false,
  });
  assert.deepEqual(resolveProjectPaneLayout(744, "artifacts"), {
    canvas: false,
    sessions: true,
  });
  assert.deepEqual(resolveProjectPaneLayout(744, "content"), {
    canvas: true,
    sessions: false,
  });
});

test("Notes shell progressively replaces columns on compact screens", () => {
  assert.deepEqual(resolveProjectPaneLayout(500, "artifacts"), {
    canvas: false,
    sessions: true,
  });
  assert.deepEqual(resolveProjectPaneLayout(500, "content"), {
    canvas: true,
    sessions: false,
  });
});
