import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import {
  AgentReadToolKernel,
  canonicalJson,
  type AgentJournalArmDispatch,
  type AgentJournalRunnableToolAction,
  type AgentJournalSettleAttempt,
  type AgentToolJournalPort,
} from "../src/index.js";

const sha256 = async (value: string): Promise<string> =>
  createHash("sha256").update(value).digest("hex");

const action = async (): Promise<AgentJournalRunnableToolAction> => {
  const input = {
    documentId: "notes.txt",
    maxBytes: 4096,
    rootId: "app-documents-v1",
  };
  return {
    actionId: "action-1",
    actionSchemaVersion: 1,
    actionType: "document.read",
    createdAt: "2026-08-30T10:00:00.000Z",
    deadlineClass: "interactive",
    executionGeneration: 0,
    executionId: "execution-1",
    gateClass: "none-requested",
    input,
    inputDigest: await sha256(canonicalJson(input)),
    pluginId: "curiosity.documents",
    reactorId: "generalist",
    requestedCapabilities: ["documents.read"],
    resource: "document:notes.txt",
    runId: "run-1",
    sourceEventId: "event-1",
  };
};

const fixture = async (execute: (signal: AbortSignal) => Promise<unknown>) => {
  const runnable = await action();
  let allocation:
    | Extract<AgentJournalArmDispatch, { readonly phase: "allocate" }>
    | undefined;
  let settlement: AgentJournalSettleAttempt | undefined;
  const journal: AgentToolJournalPort = {
    armDispatch: async (input) => {
      if (input.phase === "allocate") allocation = input;
      return {
        actionId: input.actionId,
        attemptId: input.attemptId,
        callId: input.callId,
        disposition: "armed",
        generation: input.generation,
      };
    },
    runnableToolActions: async () => [runnable],
    settleAttempt: async (input) => {
      settlement = input;
      return {
        actionId: input.actionId,
        attemptId: input.attemptId,
        callId: input.callId,
        disposition: "committed",
        generation: input.generation,
      };
    },
  };
  const kernel = new AgentReadToolKernel({
    catalogDigest: "0".repeat(64),
    grantedCapabilities: ["documents.read"],
    journal,
    now: () => "2026-08-30T10:00:01.000Z",
    ownerId: "mobile-kernel",
    sha256,
    tools: [
      {
        effectClass: "read-only",
        execute: ({ signal }) => execute(signal),
        toolId: "document.read",
        toolVersion: "1",
      },
    ],
  });
  return { allocation: () => allocation, kernel, settlement: () => settlement };
};

describe("AgentReadToolKernel", () => {
  test("allocates one exact native tool attempt and settles its receipt", async () => {
    const value = await fixture(async () => ({ content: "durable evidence" }));
    await expect(value.kernel.drainOne(new AbortController().signal)).resolves.toEqual({
      actionId: "action-1",
      kind: "succeeded",
    });
    expect(value.allocation()?.phase).toBe("allocate");
    expect(value.allocation()?.dispatch).toMatchObject({
      kind: "tool",
      toolName: "document.read",
      toolVersion: "1",
    });
    expect(value.settlement()).toMatchObject({
      actionId: "action-1",
      kind: "tool",
      status: "succeeded",
    });
    expect(value.settlement()?.events[0]?.type).toBe("action.succeeded");
  });

  test("settles a cancelled native call without retrying", async () => {
    let calls = 0;
    const controller = new AbortController();
    const value = await fixture(async () => {
      calls += 1;
      controller.abort();
      throw new Error("ignored-after-cancel");
    });
    await expect(value.kernel.drainOne(controller.signal)).resolves.toEqual({
      actionId: "action-1",
      errorCode: "ACTION_CANCELLED",
      kind: "failed",
    });
    expect(calls).toBe(1);
    expect(value.settlement()).toMatchObject({
      errorCode: "ACTION_CANCELLED",
      status: "cancelled",
    });
  });
});
