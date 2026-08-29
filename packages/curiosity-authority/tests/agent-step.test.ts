import { describe, expect, test } from "bun:test";
import {
  assertAgentStepEnvelope,
  createContextPlan,
  createGenerationRouteReceipt,
  decodeAgentStepProposal,
  appleOnDeviceGenerationSelection,
  type Sha256,
} from "../src/index.js";

const { createHash } = await import("node:crypto");
const sha256: Sha256 = async (value) =>
  createHash("sha256").update(value).digest("hex");

describe("bounded agent steps", () => {
  test("decodes the four closed proposal branches", () => {
    expect(
      decodeAgentStepProposal({ citations: [], kind: "final", text: "Done" }),
    ).toEqual({ citations: [], kind: "final", text: "Done" });
    expect(
      decodeAgentStepProposal({
        actions: [
          {
            callKey: "read-1",
            input: { documentId: "one" },
            toolId: "document.read",
            toolVersion: "1",
          },
        ],
        kind: "actions",
      }).kind,
    ).toBe("actions");
    expect(
      decodeAgentStepProposal({
        kind: "question",
        question: {
          allowFreeText: false,
          options: ["A", "B"],
          prompt: "Choose",
        },
      }).kind,
    ).toBe("question");
    expect(
      decodeAgentStepProposal({ kind: "no-go", reasonCode: "POLICY_BLOCKED" }),
    ).toEqual({ kind: "no-go", reasonCode: "POLICY_BLOCKED" });
  });

  test("rejects extra fields, duplicate action keys, and oversized envelopes", async () => {
    expect(() =>
      decodeAgentStepProposal({
        citations: [],
        hiddenEffect: true,
        kind: "final",
        text: "Done",
      }),
    ).toThrow("AGENT_STEP_PROPOSAL_INVALID");
    expect(() =>
      decodeAgentStepProposal({
        assistantState: { content: "x".repeat(8_193) },
        citations: [],
        kind: "final",
        text: "Done",
      }),
    ).toThrow("AGENT_STEP_PROPOSAL_INVALID");
    expect(() =>
      decodeAgentStepProposal({
        assistantState: undefined,
        citations: [],
        kind: "final",
        text: "Done",
      }),
    ).toThrow("AGENT_STEP_PROPOSAL_INVALID");
    expect(() =>
      decodeAgentStepProposal({
        actions: [
          { callKey: "same", input: {}, toolId: "read", toolVersion: "1" },
          { callKey: "same", input: {}, toolId: "read", toolVersion: "1" },
        ],
        kind: "actions",
      }),
    ).toThrow("AGENT_STEP_PROPOSAL_INVALID");

    const contextPlan = await createContextPlan(
      [
        {
          blockId: "conversation-1",
          content: "x".repeat(8_000),
          kind: "conversation",
          provenance: "untrusted-evidence",
          sourceEventIds: ["event-1"],
        },
      ],
      "agent-step-v1",
      sha256,
    );
    const route = await createGenerationRouteReceipt(
      appleOnDeviceGenerationSelection("agent.step"),
      "step-1",
      contextPlan.contextPlanId,
      sha256,
    );
    expect(() =>
      assertAgentStepEnvelope({
        agent: { id: "generalist", version: "1" },
        availableTools: [],
        contextPlan,
        finalizationOnly: false,
        observedRunRevision: 0,
        observedStateDigest: "0".repeat(64),
        route,
        runId: "run-1",
        stepId: "step-1",
        stepNumber: 1,
      }),
    ).toThrow("FOUNDATION_MODEL_CONTEXT_EXCEEDED");
  });
});
