import assert from "node:assert/strict";
import test from "node:test";
import { resolveNestedSidebarLayout } from "../src/components/nested-sidebar-layout.ts";

test("nested sidebar keeps both navigation levels visible in wide windows", () => {
  assert.deepEqual(resolveNestedSidebarLayout(1_200, "content"), {
    content: true,
    organizations: true,
    sessions: true,
  });
});

test("nested sidebar progressively replaces navigation in smaller windows", () => {
  assert.deepEqual(resolveNestedSidebarLayout(900, "organizations"), {
    content: true,
    organizations: true,
    sessions: false,
  });
  assert.deepEqual(resolveNestedSidebarLayout(500, "sessions"), {
    content: false,
    organizations: false,
    sessions: true,
  });
  assert.deepEqual(resolveNestedSidebarLayout(500, "content"), {
    content: true,
    organizations: false,
    sessions: false,
  });
});
