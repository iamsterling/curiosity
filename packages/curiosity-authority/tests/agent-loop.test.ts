import { describe, expect, test } from "bun:test";
import {
  DurableAgentLoop,
  type AgentJournalReconciledAttempt,
  type AgentJournalTerminalRun,
} from "../src/index.js";

describe("DurableAgentLoop", () => {
  test("drains terminal, tool, then one agent transition without a hidden loop", async () => {
    const order: string[] = [];
    let reconciliations = 0;
    const loop = new DurableAgentLoop({
      agent: {
        drainOne: async () => {
          order.push("agent");
          return {
            commit: { disposition: "accepted", revision: 2, runId: "run-1" },
            kind: "committed",
            proposalKind: "final",
            runId: "run-1",
            stepId: "step-1",
          };
        },
        recover: async () => [],
      },
      journal: {
        reconcileTerminalRuns: async () => {
          order.push("terminal");
          reconciliations += 1;
          return reconciliations === 2
            ? [{ runId: "run-1", status: "completed" }]
            : [];
        },
      },
      now: () => "2026-08-30T10:00:00.000Z",
      tools: {
        drainOne: async () => {
          order.push("tool");
          return { kind: "idle" };
        },
      },
    });
    const result = await loop.drainOne(new AbortController().signal);
    expect(order).toEqual(["terminal", "tool", "agent", "terminal"]);
    expect(result).toMatchObject({
      kind: "agent",
      terminals: [{ runId: "run-1", status: "completed" }],
    });
  });

  test("gives a pending tool exclusive ownership of one drain", async () => {
    let agentCalls = 0;
    const loop = new DurableAgentLoop({
      agent: {
        drainOne: async () => {
          agentCalls += 1;
          return { kind: "idle" };
        },
        recover: async () => [],
      },
      journal: { reconcileTerminalRuns: async () => [] },
      now: () => "2026-08-30T10:00:00.000Z",
      tools: {
        drainOne: async () => ({ actionId: "action-1", kind: "succeeded" }),
      },
    });
    await expect(loop.drainOne(new AbortController().signal)).resolves.toEqual({
      kind: "tool",
      tool: { actionId: "action-1", kind: "succeeded" },
    });
    expect(agentCalls).toBe(0);
  });

  test("reconciles interrupted attempts before terminal runs on recovery", async () => {
    const attempts: readonly AgentJournalReconciledAttempt[] = [
      {
        actionId: "action-1",
        attemptId: "attempt-1",
        callId: "call-1",
        classification: "not-dispatched",
        generation: 1,
        kind: "tool",
      },
    ];
    const terminals: readonly AgentJournalTerminalRun[] = [
      { runId: "run-1", status: "completed" },
    ];
    const order: string[] = [];
    const loop = new DurableAgentLoop({
      agent: {
        drainOne: async () => ({ kind: "idle" }),
        recover: async () => {
          order.push("attempts");
          return attempts;
        },
      },
      journal: {
        reconcileTerminalRuns: async () => {
          order.push("terminals");
          return terminals;
        },
      },
      now: () => "2026-08-30T10:00:00.000Z",
      tools: { drainOne: async () => ({ kind: "idle" }) },
    });
    await expect(loop.recover()).resolves.toEqual({ attempts, terminals });
    expect(order).toEqual(["attempts", "terminals"]);
  });
});
