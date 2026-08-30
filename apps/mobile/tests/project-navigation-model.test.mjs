import assert from "node:assert/strict";
import test from "node:test";
import { projectNavigationSections } from "../src/project-navigation-model.ts";

const threads = [
  { sequence: 1, threadId: "thread-1", title: "First" },
  { sequence: 2, threadId: "thread-2", title: "Second" },
];

test("sessions expose only session navigation items", () => {
  const sections = projectNavigationSections("sessions", undefined, threads);
  assert.deepEqual(
    sections.flatMap(({ data }) => data).map(({ id }) => id),
    ["new-session", "thread-1", "thread-2"],
  );
});

test("project collections replace the session list with their own landing item", () => {
  for (const [collectionId, itemId] of [
    ["craft", "project-craft"],
    ["memory", "project-memory"],
    ["audio", "project-audio"],
  ]) {
    const sections = projectNavigationSections(collectionId, "thread-1", threads);
    assert.equal(sections.length, 1);
    assert.equal(sections[0].data.length, 1);
    assert.equal(sections[0].data[0].id, itemId);
    assert.equal(sections[0].data[0].collectionId, collectionId);
    assert.equal(sections[0].data[0].threadId, undefined);
  }
});
