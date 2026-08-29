import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import {
  createActionGrant,
  createToolRequestDigest,
  verifyActionGrant,
  type Sha256,
} from "../src/index.js";

const sha256: Sha256 = async (value) =>
  createHash("sha256").update(value).digest("hex");
const input = { documentId: "notes/one.txt", rootId: "app-documents-v1" };

const fixture = async () =>
  createActionGrant(
    {
      actionId: "action-1",
      attemptId: "attempt-1",
      callId: "call-1",
      catalogDigest: "1".repeat(64),
      deadlineAt: "2026-08-29T22:00:00.000Z",
      executionId: "run-1",
      generation: 1,
      inputDigest: "2".repeat(64),
      requestDigest: await createToolRequestDigest(
        "document.read",
        "1",
        input,
        sha256,
      ),
      requestedCapabilities: ["documents.read"],
      resource: "document:notes/one.txt",
      toolId: "document.read",
      toolVersion: "1",
    },
    sha256,
  );

describe("exact native action grants", () => {
  test("creates and verifies one bounded immutable grant", async () => {
    const grant = await fixture();
    expect(
      await verifyActionGrant(grant, sha256, Date.parse("2026-08-29T21:00:00Z")),
    ).toEqual(grant);
    expect(grant.grantId).toMatch(/^[a-f0-9]{64}$/u);
  });

  test("rejects changed, expired, widened, and unordered grants", async () => {
    const grant = await fixture();
    await expect(
      verifyActionGrant(
        { ...grant, resource: "document:other.txt" },
        sha256,
        Date.parse("2026-08-29T21:00:00Z"),
      ),
    ).rejects.toThrow("ACTION_GRANT_STALE");
    await expect(
      verifyActionGrant(grant, sha256, Date.parse(grant.deadlineAt)),
    ).rejects.toThrow("ACTION_GRANT_STALE");
    await expect(
      verifyActionGrant(
        {
          ...grant,
          requestedCapabilities: ["documents.write", "documents.read"],
        },
        sha256,
        Date.parse("2026-08-29T21:00:00Z"),
      ),
    ).rejects.toThrow("ACTION_GRANT_INVALID");
    await expect(
      verifyActionGrant(
        { ...grant, requestedCapabilities: ["documents.read", "documents.write"] },
        sha256,
        Date.parse("2026-08-29T21:00:00Z"),
      ),
    ).rejects.toThrow("ACTION_GRANT_STALE");
  });
});
