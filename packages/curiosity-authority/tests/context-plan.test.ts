import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import {
  createContextPlan,
  validateContextPlan,
  verifyContextPlan,
} from "../src/index.js";

const sha256 = async (value: string) =>
  createHash("sha256").update(value).digest("hex");

describe("portable context plans", () => {
  test("creates a deterministic provenance-labelled plan", async () => {
    const plan = await createContextPlan(
      [
        {
          blockId: "message:user-001",
          content: "user: Remember the launch date",
          kind: "conversation",
          provenance: "trusted-durable",
          sourceEventIds: ["event-001"],
        },
      ],
      "ipados-chat-context-v1",
      sha256,
    );

    expect(plan.contextPlanId).toBe(
      "3b42cc9939c11bb22b18a66e065b9e0ae4fe3de8b495af790bebc18910f9d1a7",
    );
    expect(plan.blocks[0]).toMatchObject({
      contentDigest:
        "604af775962fc7cd1effbe2079b0cfaaee3e37c511eb016480df3b4f5d5e48eb",
      provenance: "trusted-durable",
      sourceEventIds: ["event-001"],
    });
    expect(validateContextPlan(plan)).toEqual(plan);
    expect(await verifyContextPlan(plan, sha256)).toEqual(plan);
  });

  test("rejects duplicate blocks and inconsistent size claims", async () => {
    const plan = await createContextPlan(
      [
        {
          blockId: "message:user-001",
          content: "user: hello",
          kind: "conversation",
          provenance: "trusted-durable",
          sourceEventIds: [],
        },
      ],
      "ipados-chat-context-v1",
      sha256,
    );
    expect(() =>
      validateContextPlan({
        ...plan,
        blocks: [plan.blocks[0], plan.blocks[0]],
        utf8Bytes: plan.utf8Bytes * 2,
      }),
    ).toThrow("CONTEXT_BLOCK_ID_DUPLICATE");
    expect(() => validateContextPlan({ ...plan, utf8Bytes: 0 })).toThrow(
      "CONTEXT_PLAN_SIZE_INVALID",
    );
    await expect(
      verifyContextPlan(
        {
          ...plan,
          blocks: [{ ...plan.blocks[0], content: "user: changed" }],
          estimatedTokens: Math.ceil("user: changed".length / 3),
          utf8Bytes: "user: changed".length,
        },
        sha256,
      ),
    ).rejects.toThrow("CONTEXT_BLOCK_DIGEST_MISMATCH");
  });
});
