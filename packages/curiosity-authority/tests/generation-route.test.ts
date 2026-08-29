import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import {
  createGenerationRouteReceipt,
  onDeviceAppleGenerationSelection,
  validateGenerationRouteReceipt,
  validateGenerationSelection,
} from "../src/index.js";

const sha256 = async (value: string) =>
  createHash("sha256").update(value).digest("hex");

describe("exact generation routes", () => {
  test("creates one deterministic route receipt for a turn", async () => {
    const receipt = await createGenerationRouteReceipt(
      onDeviceAppleGenerationSelection,
      "turn-001",
      "b".repeat(64),
      sha256,
    );
    expect(receipt).toEqual({
      ...onDeviceAppleGenerationSelection,
      contextPlanId: "b".repeat(64),
      selectionId:
        "405570b48f7564b0d3efddb30d0554344ead780ab9dc9147841c4d8803f50e6e",
    });
    expect(validateGenerationRouteReceipt(receipt)).toEqual(receipt);
  });

  test("rejects unknown fields, malformed identifiers, and receipt digests", () => {
    expect(() =>
      validateGenerationSelection({
        ...onDeviceAppleGenerationSelection,
        fallbackRouteId: "frontier.other",
      }),
    ).toThrow("GENERATION_SELECTION_INVALID");
    expect(() =>
      validateGenerationSelection({
        ...onDeviceAppleGenerationSelection,
        routeId: "invalid route",
      }),
    ).toThrow("GENERATION_SELECTION_INVALID");
    expect(() =>
      validateGenerationRouteReceipt({
        ...onDeviceAppleGenerationSelection,
        contextPlanId: "b".repeat(64),
        selectionId: "not-a-digest",
      }),
    ).toThrow("GENERATION_ROUTE_RECEIPT_INVALID");
  });
});
