import assert from "node:assert/strict";
import test from "node:test";
import { resolveNestedSidebarLayout } from "../src/components/nested-sidebar-layout.ts";

test("Notes shell keeps both navigation levels visible in wide windows", () => {
  assert.deepEqual(resolveNestedSidebarLayout(1_200, "content"), {
    artifacts: true,
    content: true,
    source: true,
  });
});

test("Notes shell reveals its parent without crushing regular-width content", () => {
  assert.deepEqual(resolveNestedSidebarLayout(1_024, "content"), {
    artifacts: true,
    content: true,
    source: false,
  });
  assert.deepEqual(resolveNestedSidebarLayout(744, "collections"), {
    artifacts: true,
    content: false,
    source: true,
  });
  assert.deepEqual(resolveNestedSidebarLayout(744, "content"), {
    artifacts: true,
    content: true,
    source: false,
  });
});

test("Notes shell progressively replaces columns on compact screens", () => {
  assert.deepEqual(resolveNestedSidebarLayout(500, "artifacts"), {
    artifacts: true,
    content: false,
    source: false,
  });
  assert.deepEqual(resolveNestedSidebarLayout(500, "content"), {
    artifacts: false,
    content: true,
    source: false,
  });
});
