import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import {
  PortableAuthority,
  PortableAuthorityError,
  canonicalJson,
  type GenerationSelection,
  type MemoryAdmissionPolicy,
  projectTurnStatus,
  type GenerationPort,
} from "../src/index.js";

const sha256 = async (value: string) =>
  createHash("sha256").update(value).digest("hex");
const catalogDigest = await sha256(
  canonicalJson({ profile: "portable-authority-golden-v1" }),
);
const now = () => "2026-08-29T12:00:00.000Z";
let nextId = 0;
const createId = () => `generated-${++nextId}`;
const generationSelection: GenerationSelection = {
  adapterVersion: "test-adapter-v1",
  locality: "device",
  modelId: "test:local",
  providerId: "test",
  purpose: "turn.answer",
  requestedRouteId: "test.local",
  routeId: "test.local",
  selectionPolicyId: "test-policy-v1",
};
const memoryPolicy: MemoryAdmissionPolicy = {
  autoAdmitSensitivities: ["ordinary"],
  policyId: "memory-policy-v1",
  retentionBySensitivity: {
    ordinary: ["bounded"],
    private: ["bounded"],
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

const turn = (id = "command-chat-001") => ({
  id,
  kind: "chat.turn",
  payload: {
    assistantMessageId: "message-assistant-001",
    text: "Hello Curiosity",
    threadId: "thread-chat-001",
    turnId: "turn-001",
    userMessageId: "message-user-001",
  },
  schemaVersion: 1 as const,
});

describe("portable authority", () => {
  test("admits deterministic canonical chat events and projections", async () => {
    const authority = new PortableAuthority({
      actorId: "local-owner",
      catalogDigest,
      createId,
      now,
      sha256,
    });

    const acknowledgement = await authority.submit(turn());

    expect(acknowledgement).toEqual({
      actorId: "local-owner",
      commandId: "command-chat-001",
      disposition: "accepted",
      eventCount: 3,
      firstSequence: 1,
      lastSequence: 3,
    });
    expect(
      authority.events().map(({ body, eventHash, previousHash, type }) => ({
        body,
        eventHash,
        previousHash,
        type,
      })),
    ).toEqual([
      {
        body: {
          schemaVersion: 1,
          threadId: "thread-chat-001",
          title: "Hello Curiosity",
        },
        eventHash:
          "79db874fce570cc9ce2338df8cd25ac662d837837ea3ceba39e8be42779aa920",
        previousHash: "0".repeat(64),
        type: "thread.opened",
      },
      {
        body: {
          messageId: "message-user-001",
          role: "user",
          schemaVersion: 1,
          text: "Hello Curiosity",
          threadId: "thread-chat-001",
          turnId: "turn-001",
        },
        eventHash:
          "4435f5784a5b9038ad1a547832b4a9c8529ca512f7ce708ad2094124b12e7a02",
        previousHash:
          "79db874fce570cc9ce2338df8cd25ac662d837837ea3ceba39e8be42779aa920",
        type: "message.appended",
      },
      {
        body: {
          assistantMessageId: "message-assistant-001",
          agentId: "generalist",
          schemaVersion: 1,
          threadId: "thread-chat-001",
          turnId: "turn-001",
        },
        eventHash:
          "155907a0c7e717147ad9ffe3f59de0ed58f77f910bcaabc0539123695f81827d",
        previousHash:
          "4435f5784a5b9038ad1a547832b4a9c8529ca512f7ce708ad2094124b12e7a02",
        type: "turn.requested",
      },
    ]);
    expect(authority.threads()).toEqual([
      {
        openedBy: "local-owner",
        sequence: 1,
        threadId: "thread-chat-001",
        title: "Hello Curiosity",
      },
    ]);
    expect(authority.messages("thread-chat-001")).toEqual([
      {
        messageId: "message-user-001",
        role: "user",
        sequence: 2,
        text: "Hello Curiosity",
        threadId: "thread-chat-001",
        turnId: "turn-001",
      },
    ]);
  });

  test("deduplicates exact commands and rejects changed command identities", async () => {
    const authority = new PortableAuthority({
      actorId: "local-owner",
      catalogDigest,
      createId,
      now,
      sha256,
    });
    await authority.submit(turn());
    expect((await authority.submit(turn())).disposition).toBe("duplicate");
    await expect(
      authority.submit({
        ...turn(),
        payload: { ...turn().payload, text: "changed" },
      }),
    ).rejects.toMatchObject({ code: "COMMAND_DIGEST_CONFLICT" });
  });

  test("starts without capability or generation hosts and fails closed", async () => {
    const authority = new PortableAuthority({
      actorId: "local-owner",
      catalogDigest,
      createId,
      now,
      sha256,
    });

    await expect(authority.runTurn(turn())).rejects.toMatchObject({
      code: "PROVIDER_ROUTE_UNAVAILABLE",
    });
    expect(projectTurnStatus(authority.events(), "turn-001")).toBe("failed");
  });

  test("streams a tool-free generation and records terminal completion", async () => {
    const deltas: string[] = [];
    const generation: GenerationPort = {
      generate: async (request, onDelta) => {
        expect(request.tools).toEqual([]);
        expect(request.route.modelId).toBe("test:local");
        expect(request.route.requestedRouteId).toBe("test.local");
        expect(request.route.routeId).toBe("test.local");
        expect(request.route.selectionId).toMatch(/^[a-f0-9]{64}$/u);
        onDelta?.("Hi");
        return {
          durationMs: 12,
          effort: "bounded",
          modelId: "test:local",
          text: "Hi from iPad",
        };
      },
    };
    const authority = new PortableAuthority({
      actorId: "local-owner",
      catalogDigest,
      createId,
      generation,
      generationSelection,
      now,
      sha256,
    });

    const result = await authority.runTurn(turn(), (delta) =>
      deltas.push(delta),
    );

    expect(result.text).toBe("Hi from iPad");
    expect(deltas).toEqual(["Hi"]);
    expect(projectTurnStatus(authority.events(), "turn-001")).toBe("completed");
    expect(authority.messages("thread-chat-001").at(-1)).toMatchObject({
      messageId: "message-assistant-001",
      role: "assistant",
      routeReceipt: {
        modelId: "test:local",
        routeId: "test.local",
        selectionId: expect.stringMatching(/^[a-f0-9]{64}$/u),
      },
      text: "Hi from iPad",
    });
    expect(authority.events().map(({ type }) => type).slice(-3)).toEqual([
      "generation.route.selected",
      "message.appended",
      "turn.completed",
    ]);
  });

  test("requires an exact route before a configured adapter can dispatch", () => {
    const generation: GenerationPort = {
      generate: async () => ({
        durationMs: 1,
        effort: "bounded",
        modelId: "test:local",
        text: "unreachable",
      }),
    };
    expect(
      () =>
        new PortableAuthority({
          actorId: "local-owner",
          catalogDigest,
          createId,
          generation,
          now,
          sha256,
        }),
    ).toThrow("GENERATION_ROUTE_SELECTION_REQUIRED");
  });

  test("fails a mismatched model without completing or selecting a fallback", async () => {
    let calls = 0;
    const generation: GenerationPort = {
      generate: async () => {
        calls += 1;
        return {
          durationMs: 1,
          effort: "bounded",
          modelId: "test:different-model",
          text: "must not complete",
        };
      },
    };
    const authority = new PortableAuthority({
      actorId: "local-owner",
      catalogDigest,
      createId,
      generation,
      generationSelection,
      now,
      sha256,
    });

    await expect(authority.runTurn(turn())).rejects.toMatchObject({
      code: "GENERATION_ROUTE_MISMATCH",
    });
    expect(calls).toBe(1);
    expect(authority.events().map(({ type }) => type).slice(-2)).toEqual([
      "generation.route.selected",
      "turn.failed",
    ]);
    expect(projectTurnStatus(authority.events(), "turn-001")).toBe("failed");
  });

  test("admits one idempotent governed memory curation result", async () => {
    const generation: GenerationPort = {
      generate: async () => ({
        durationMs: 1,
        effort: "bounded",
        modelId: "test:local",
        text: "The launch date is September 5.",
      }),
    };
    const authority = new PortableAuthority({
      actorId: "local-owner",
      catalogDigest,
      createId,
      generation,
      generationSelection,
      memoryPolicy,
      now,
      sha256,
    });
    await authority.runTurn(turn());
    const job = await authority.requestMemoryCuration("turn-001");
    expect(await authority.requestMemoryCuration("turn-001")).toEqual(job);
    const curationResult = {
      jobId: job.jobId,
      policyId: job.policyId,
      proposals: [
        {
          confidence: 0.9,
          content: "The launch date is September 5",
          kind: "fact",
          operation: "create",
          proposedRetention: "bounded",
          proposedSensitivity: "ordinary",
          sourceMessageIds: ["message-user-001", "message-assistant-001"],
        },
      ],
      sourceDigest: job.sourceDigest,
    };
    const result = await authority.applyMemoryCurationResult(curationResult);

    expect(result?.decisions[0]?.kind).toBe("admitted");
    expect(authority.memories()).toHaveLength(1);
    expect(authority.memories()[0]).toMatchObject({
      content: "The launch date is September 5",
      sourceMessageIds: ["message-user-001", "message-assistant-001"],
      version: 1,
    });
    expect(
      await authority.applyMemoryCurationResult(curationResult),
    ).toBeUndefined();
    await expect(
      authority.applyMemoryCurationResult({
        jobId: job.jobId,
        policyId: job.policyId,
        proposals: [],
        sourceDigest: job.sourceDigest,
      }),
    ).rejects.toMatchObject({ code: "MEMORY_CURATION_RESULT_CONFLICT" });
    expect(
      authority.events().filter(({ type }) => type === "memory.recorded"),
    ).toHaveLength(1);
  });

  test("cancels active generation without publishing assistant success", async () => {
    let started!: () => void;
    const generationStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const generation: GenerationPort = {
      generate: (request) =>
        new Promise((_resolve, reject) => {
          started();
          request.signal.addEventListener("abort", () =>
            reject(new Error("abort")),
          );
        }),
    };
    const authority = new PortableAuthority({
      actorId: "local-owner",
      catalogDigest,
      createId,
      generation,
      generationSelection,
      now,
      sha256,
    });
    const pending = authority.runTurn(turn());
    await generationStarted;

    await authority.cancel("turn-001");

    await expect(pending).rejects.toBeInstanceOf(PortableAuthorityError);
    expect(projectTurnStatus(authority.events(), "turn-001")).toBe("cancelled");
    expect(
      authority
        .messages("thread-chat-001")
        .some(({ role }) => role === "assistant"),
    ).toBe(false);
  });

  test("does not dispatch a duplicate command while its turn is active", async () => {
    let started!: () => void;
    const generationStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const generation: GenerationPort = {
      generate: (request) =>
        new Promise((_resolve, reject) => {
          started();
          request.signal.addEventListener("abort", () =>
            reject(new Error("abort")),
          );
        }),
    };
    const authority = new PortableAuthority({
      actorId: "local-owner",
      catalogDigest,
      createId,
      generation,
      generationSelection,
      now,
      sha256,
    });
    const pending = authority.runTurn(turn());
    await generationStarted;

    await expect(authority.runTurn(turn())).rejects.toMatchObject({
      code: "CHAT_TURN_ALREADY_ACTIVE",
    });
    await authority.cancel("turn-001");
    await expect(pending).rejects.toMatchObject({ code: "ACTION_CANCELLED" });
  });
});
