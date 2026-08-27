import { describe, expect, test } from "bun:test";
import { createStockPluginCatalog } from "../src/plugins/registry.js";

const activeAgents = [
  "analyst",
  "generalist",
  "implementer",
  "orchestrator",
  "researcher",
  "reviewer",
  "strategist",
  "worker",
];

const installedSkills = [
  "competitive-analysis",
  "deep-research",
  "engineering-pursuit",
  "goal-loop",
  "handoff-compiler",
  "reverse-engineering",
  "review",
  "verify",
];

const installedCommands = [
  "bug",
  "compile-handoff",
  "feature",
  "goal",
  "landscape",
  "loop",
  "loop-ask",
  "loop-clear",
  "loop-cmd",
  "loop-command",
  "loop-compact",
  "loop-dev",
  "loop-doctor",
  "loop-export",
  "loop-goal",
  "loop-goal-blocked",
  "loop-goal-clear",
  "loop-goal-done",
  "loop-goal-pause",
  "loop-goal-resume",
  "loop-goal-status",
  "loop-help",
  "loop-init",
  "loop-logs",
  "loop-now",
  "loop-pause",
  "loop-progress",
  "loop-prompt",
  "loop-remove",
  "loop-resume",
  "loop-safe-dev",
  "loop-shell",
  "loop-status",
  "loop-stop",
  "loop-testfix",
  "research",
  "review",
  "secure",
  "task",
  "teardown",
  "verify",
];

const runtimeTools = [
  "agent.delegate",
  "formerhuman_search",
  "ledger_approval_request",
  "ledger_approval_status",
  "ledger_claim_release",
  "ledger_claim_request",
  "ledger_evidence_submit",
  "ledger_fact_record",
  "ledger_intent_activate",
  "ledger_intent_frame",
  "ledger_intent_propose",
  "ledger_progress_propose",
  "ledger_resolution_propose",
  "ledger_review_propose",
  "ledger_work_propose",
  "native_loop_pause",
  "native_loop_resume",
  "native_loop_start",
  "native_loop_status",
  "native_loop_stop",
  "web_search",
];

describe("OpenCode2 product-surface parity", () => {
  test("seals every active agent, installed skill, and installed command", () => {
    const catalog = createStockPluginCatalog();
    expect(catalog.agents().map(({ id }) => id)).toEqual(activeAgents);
    expect(catalog.skills().map(({ name }) => name)).toEqual(installedSkills);
    expect(catalog.promptCommands().map(({ name }) => name)).toEqual(
      installedCommands,
    );
    expect(
      catalog
        .promptCommands()
        .filter(({ status }) => status === "active")
        .map(({ name }) => name),
    ).toEqual([
      "bug",
      "compile-handoff",
      "feature",
      "goal",
      "landscape",
      "research",
      "review",
      "secure",
      "task",
      "teardown",
      "verify",
    ]);
  });

  test("registers every plugin-owned runtime tool name", () => {
    const catalog = createStockPluginCatalog();
    const names = new Set(catalog.tools().map(({ name }) => name));
    expect(runtimeTools.filter((name) => !names.has(name))).toEqual([]);
  });
});
