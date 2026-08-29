import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import {
  decodeMemoryProposals,
  evaluateMemoryProposals,
  projectActiveMemories,
  type MemoryAdmissionPolicy,
} from "../src/index.js";

const sha256 = async (value: string) =>
  createHash("sha256").update(value).digest("hex");
const sourceDigest = "a".repeat(64);
const policy: MemoryAdmissionPolicy = {
  autoAdmitSensitivities: ["ordinary"],
  policyId: "memory-policy-v1",
  retentionBySensitivity: {
    ordinary: ["session", "bounded", "durable"],
    private: ["session", "bounded"],
    restricted: ["session"],
  },
  reviewSensitivities: ["private", "restricted"],
  sensitivityFloorByKind: {
    commitment: "ordinary",
    decision: "ordinary",
    fact: "ordinary",
    preference: "ordinary",
    "project-summary": "private",
  },
};

const proposal = (content: string, overrides = {}) => ({
  confidence: 0.9,
  content,
  kind: "fact",
  operation: "create",
  proposedRetention: "bounded",
  proposedSensitivity: "ordinary",
  sourceMessageIds: ["message-001"],
  ...overrides,
});

describe("governed memory policy", () => {
  test("bounds and strictly decodes model proposals", () => {
    const decoded = decodeMemoryProposals([
      proposal("Launch is September 5"),
    ]);
    expect(decoded).toHaveLength(1);
    expect(decoded[0]?.content).toBe("Launch is September 5");
    expect(decoded[0]?.kind).toBe("fact");
    expect(() =>
      decodeMemoryProposals([proposal("Invalid", { unexpected: true })]),
    ).toThrow("MEMORY_PROPOSAL_INVALID");
    expect(() =>
      decodeMemoryProposals(Array.from({ length: 9 }, () => proposal("Fact"))),
    ).toThrow("MEMORY_PROPOSALS_INVALID");
    expect(() =>
      decodeMemoryProposals([
        proposal("Invalid confidence", { confidence: Number.NaN }),
      ]),
    ).toThrow("MEMORY_PROPOSAL_INVALID");
  });

  test("admits ordinary memory, reviews private memory, and omits secrets", async () => {
    const proposals = decodeMemoryProposals([
      proposal("Launch is September 5"),
      proposal("Email me at owner@example.com"),
      proposal("api_key = sk-super-secret-value-123456"),
      proposal("Launch is September 5"),
    ]);
    const result = await evaluateMemoryProposals(
      {
        activeMemories: [],
        jobId: "memory-job-001",
        policy,
        proposals,
        sourceDigest,
        sourceMessageIds: ["message-001"],
      },
      sha256,
    );

    expect(result.decisions.map(({ kind }) => kind)).toEqual([
      "admitted",
      "review",
      "rejected",
      "rejected",
    ]);
    expect(result.decisions[2]).toEqual({
      code: "MEMORY_SECRET_LIKE",
      kind: "rejected",
    });
    expect(result.decisions[3]).toEqual({
      code: "MEMORY_DUPLICATE",
      kind: "rejected",
    });
    expect(result.events.map(({ type }) => type)).toEqual([
      "memory.recorded",
      "memory.review.requested",
    ]);
    expect(JSON.stringify(result.events)).not.toContain("sk-super-secret");
  });

  test("rejects stale supersession and logically retires exact active versions", async () => {
    const initial = await evaluateMemoryProposals(
      {
        activeMemories: [],
        jobId: "memory-job-initial",
        policy,
        proposals: decodeMemoryProposals([proposal("Launch is September 5")]),
        sourceDigest,
        sourceMessageIds: ["message-001"],
      },
      sha256,
    );
    const active = projectActiveMemories(initial.events);
    const stale = await evaluateMemoryProposals(
      {
        activeMemories: active,
        jobId: "memory-job-stale",
        policy,
        proposals: decodeMemoryProposals([
          proposal("Launch is September 6", {
            observedMemory: {
              memoryId: active[0]!.memoryId,
              version: 2,
            },
            operation: "supersede",
          }),
        ]),
        sourceDigest,
        sourceMessageIds: ["message-001"],
      },
      sha256,
    );
    expect(stale.events).toEqual([]);
    expect(stale.decisions).toEqual([
      { code: "MEMORY_VERSION_STALE", kind: "rejected" },
    ]);

    expect(
      projectActiveMemories([
        ...initial.events,
        {
          body: {
            memoryId: active[0]!.memoryId,
            schemaVersion: 1,
            version: 1,
          },
          type: "memory.retired",
        },
      ]),
    ).toEqual([]);
    expect(() =>
      projectActiveMemories([
        ...initial.events,
        {
          body: {
            memoryId: active[0]!.memoryId,
            schemaVersion: 1,
            version: 2,
          },
          type: "memory.retired",
        },
      ]),
    ).toThrow("MEMORY_EVENT_VERSION_CONFLICT");
  });
});
