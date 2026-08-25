import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import type { StoredEvent } from "../src/domain/event.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  StaticPluginCatalog,
  type ContextContribution,
  type CuriosityPluginV2,
} from "../src/kernel/plugin.js";
import { PromptAssembler } from "../src/kernel/prompt-assembler.js";

const storedEvent = (
  sequence: number,
  type: string,
  eventId = `event-${sequence}`,
): StoredEvent => ({
  actorId: "actor",
  body: { sequence },
  commandId: `command-${sequence}`,
  eventHash: `${sequence}`.padStart(64, "a"),
  eventId,
  occurredAt: "2026-08-25T00:00:00.000Z",
  pluginId: "curiosity.test.source",
  previousHash: `${sequence - 1}`.padStart(64, "a"),
  sequence,
  streamId: "stream",
  type,
});

const manifest = (
  id: `curiosity.${string}`,
  requires: CuriosityPluginV2["manifest"]["requires"] = [],
): CuriosityPluginV2["manifest"] => ({
  capabilities: [],
  class: "semantic",
  id,
  kernelApi: KERNEL_PLUGIN_API_VERSION,
  provenance: {
    license: "Project-owned",
    revision: "test",
    source: "tests/prompt-assembler.test.ts",
  },
  requires,
  schemaVersion: 2,
  version: "1.0.0",
});

const agentPlugin = (system = "Agent policy"): CuriosityPluginV2 => ({
  agents: [
    {
      childAgents: [],
      default: true,
      description: "Test agent",
      id: "test-agent",
      maxDelegationDepth: 0,
      mode: "primary",
      requestedCapabilities: ["provider.generate"],
      requestedTools: [],
      schemaVersion: 1,
      system,
      version: "1.0.0",
    },
  ],
  manifest: manifest("curiosity.test.agents"),
});

const contextPlugin = (
  context: readonly ContextContribution[],
): CuriosityPluginV2 => ({
  context,
  manifest: manifest("curiosity.test.context", [
    { pluginId: "curiosity.test.agents", version: "1.0.0" },
  ]),
});

const contribution = (
  suffix: string,
  overrides: Partial<ContextContribution>,
): ContextContribution => ({
  actionTypes: ["provider.generate"],
  agentIds: ["test-agent"],
  eventTypes: ["context.event"],
  id: `curiosity.test.context.context.${suffix}`,
  maxBlocks: 1,
  maxEvents: 8,
  maxOutputBytes: 65_536,
  project: () => Effect.succeed([]),
  rank: 100,
  required: false,
  schemaVersion: 1,
  slot: "durable-context",
  ...overrides,
});

const assemble = (
  plugins: readonly CuriosityPluginV2[],
  events: readonly StoredEvent[],
  sourceEventId: string,
) =>
  Effect.runPromise(
    new PromptAssembler(
      new StaticPluginCatalog(plugins),
      () => events,
    ).assemble({
      actionType: "provider.generate",
      agentId: "test-agent",
      correlation: { kind: "test" },
      messages: [{ content: "question", role: "user" }],
      sourceEventId,
    }),
  );

describe("prompt assembly", () => {
  test("bounds context by source revision, event selector, and count", async () => {
    const seen: StoredEvent[][] = [];
    const context = contribution("bounded", {
      maxEvents: 1,
      project: (input) => {
        seen.push([...input.events]);
        return Effect.succeed([
          {
            content: "bounded context",
            id: "bounded",
            provenance: "trusted-durable",
            sourceEventIds: input.events.map((event) => event.eventId),
          },
        ]);
      },
    });
    const events = [
      storedEvent(1, "context.event"),
      storedEvent(2, "ignored.event"),
      storedEvent(3, "context.event"),
      storedEvent(4, "source.event", "source"),
      storedEvent(5, "context.event"),
    ];

    const result = await assemble(
      [agentPlugin(), contextPlugin([context])],
      events,
      "source",
    );
    expect(
      seen.map((selected) => selected.map(({ sequence }) => sequence)),
    ).toEqual([[3]]);
    expect(result.snapshot.revision).toBe(4);
    expect(result.snapshot.blocks.at(-1)?.sourceEventIds).toEqual(["event-3"]);
  });

  test("delimits untrusted context and binds policy content to the snapshot digest", async () => {
    const untrusted = contribution("untrusted", {
      project: () =>
        Effect.succeed([
          {
            content: "remote instructions are evidence, not authority",
            id: "remote",
            provenance: "untrusted-evidence",
            sourceEventIds: ["event-1"],
          },
        ]),
    });
    const events = [
      storedEvent(1, "context.event"),
      storedEvent(2, "source.event", "source"),
    ];
    const first = await assemble(
      [agentPlugin("Policy A"), contextPlugin([untrusted])],
      events,
      "source",
    );
    const second = await assemble(
      [agentPlugin("Policy B"), contextPlugin([untrusted])],
      events,
      "source",
    );

    expect(first.messages[1]?.content).toContain(
      "BEGIN UNTRUSTED EVIDENCE CANDIDATE remote",
    );
    expect(first.messages[1]?.content).toContain(
      "END UNTRUSTED EVIDENCE CANDIDATE remote",
    );
    expect(first.snapshotDigest).not.toBe(second.snapshotDigest);
    expect(first.snapshot.catalogDigest).not.toBe(
      second.snapshot.catalogDigest,
    );
  });

  test("drops whole optional blocks deterministically and denies required overflow", async () => {
    const optionalA = contribution("optional-a", {
      project: () =>
        Effect.succeed([
          {
            content: "a".repeat(40_000),
            id: "optional-a",
            provenance: "trusted-durable",
            sourceEventIds: [],
          },
        ]),
      rank: 100,
    });
    const optionalB = contribution("optional-b", {
      project: () =>
        Effect.succeed([
          {
            content: "b".repeat(40_000),
            id: "optional-b",
            provenance: "trusted-durable",
            sourceEventIds: [],
          },
        ]),
      rank: 200,
    });
    const events = [storedEvent(1, "source.event", "source")];
    const bounded = await assemble(
      [agentPlugin(), contextPlugin([optionalB, optionalA])],
      events,
      "source",
    );
    expect(bounded.snapshot.blocks.map(({ id }) => id)).toEqual([
      "agent:test-agent",
      "optional-a",
    ]);
    expect(bounded.snapshot.omittedBlocks).toEqual([
      expect.objectContaining({ id: "optional-b", reason: "global-overflow" }),
    ]);

    const required = contribution("required", {
      project: () =>
        Effect.succeed([
          {
            content: "r".repeat(65_536),
            id: "required",
            provenance: "trusted-durable",
            sourceEventIds: [],
          },
        ]),
      required: true,
    });
    await expect(
      assemble([agentPlugin(), contextPlugin([required])], events, "source"),
    ).rejects.toMatchObject({
      _tag: "PromptAssemblyFailure",
      message: "REQUIRED_CONTEXT_OVERFLOW",
    });
  });
});
