import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import {
  createMemoryCurationJob,
  decodeMemoryCurationResult,
  memoryCurationCompletedEvent,
  memoryCurationRequestedEvent,
  projectMemoryCurationJobStatus,
} from "../src/index.js";

const sha256 = async (value: string) =>
  createHash("sha256").update(value).digest("hex");
const input = {
  policyId: "memory-policy-v1",
  sourceDigest: "a".repeat(64),
  sourceMessageIds: ["message-001"],
  sourceTurnId: "turn-001",
} as const;

describe("memory curation jobs", () => {
  test("derives one idempotent job identity and lifecycle", async () => {
    const first = await createMemoryCurationJob(input, sha256);
    const second = await createMemoryCurationJob(input, sha256);
    expect(first).toEqual(second);
    expect(first.jobId).toBe(
      "memory-curation:619fc850511c3758e03385790a7027e9db3d78feb724199e69596589044e8662",
    );
    const requested = memoryCurationRequestedEvent(first);
    const completed = memoryCurationCompletedEvent(first, {
      decisions: [{ code: "MEMORY_SECRET_LIKE", kind: "rejected" }],
      events: [],
      proposalDigest: "b".repeat(64),
    });
    expect(projectMemoryCurationJobStatus([], first.jobId)).toBe("absent");
    expect(projectMemoryCurationJobStatus([requested], first.jobId)).toBe(
      "requested",
    );
    expect(
      projectMemoryCurationJobStatus([requested, completed], first.jobId),
    ).toBe("completed");
    expect(() =>
      projectMemoryCurationJobStatus([completed], first.jobId),
    ).toThrow("MEMORY_CURATION_EVENT_CONFLICT");
  });

  test("rejects stale native result identities before policy evaluation", async () => {
    const job = await createMemoryCurationJob(input, sha256);
    const result = {
      jobId: job.jobId,
      policyId: job.policyId,
      proposals: [
        {
          confidence: 0.8,
          content: "Launch is September 5",
          kind: "fact",
          operation: "create",
          proposedRetention: "bounded",
          proposedSensitivity: "ordinary",
          sourceMessageIds: ["message-001"],
        },
      ],
      sourceDigest: job.sourceDigest,
    };
    expect(decodeMemoryCurationResult(result, job).proposals).toHaveLength(1);
    expect(() =>
      decodeMemoryCurationResult(
        { ...result, sourceDigest: "c".repeat(64) },
        job,
      ),
    ).toThrow("MEMORY_CURATION_RESULT_STALE");
    expect(() =>
      decodeMemoryCurationResult(
        { ...result, policyId: "memory-policy-v2" },
        job,
      ),
    ).toThrow("MEMORY_CURATION_RESULT_STALE");
  });
});
