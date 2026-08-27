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
import { skillsPlugin } from "../src/plugins/skills.js";

const storedEvent = (
  sequence: number,
  type: string,
  eventId = `event-${sequence}`,
): StoredEvent => ({
  aggregateVersion: sequence,
  actorId: "actor",
  body: { sequence },
  catalogDigest: "c".repeat(64),
  causationId: `command-${sequence}`,
  childExecutionId: "stream",
  commandId: `command-${sequence}`,
  contributionId: "curiosity.test.source",
  contributionVersion: "1",
  correlationId: "stream",
  eventHash: `${sequence}`.padStart(64, "a"),
  eventId,
  eventSchemaVersion: 1,
  occurredAt: "2026-08-25T00:00:00.000Z",
  parentExecutionId: "stream",
  pluginId: "curiosity.test.source",
  previousHash: `${sequence - 1}`.padStart(64, "a"),
  rootExecutionId: "stream",
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
      grantedCapabilities: new Set(["provider.generate"]),
      messages: [{ content: "question", role: "user" }],
      sourceEventId,
    }),
  );

describe("prompt assembly", () => {
  test("projects legacy version-one skill activations without newer capability fields", async () => {
    const threadId = "legacy-thread";
    const activation: StoredEvent = {
      ...storedEvent(1, "skill.activated"),
      body: {
        activationId: "legacy-activation",
        arguments: "Compare releases",
        commandName: "research",
        commandVersion: "1.0.0",
        schemaVersion: 1,
        skillName: "deep-research",
        skillVersion: "1.0.0",
        status: "active",
        threadId,
      },
      streamId: threadId,
    };
    const source = storedEvent(2, "source.event", "source");
    const agents = agentPlugin();
    const testAgent = agents.agents![0]!;
    const result = await Effect.runPromise(
      new PromptAssembler(
        new StaticPluginCatalog([
          {
            ...agents,
            agents: [
              testAgent,
              {
                ...testAgent,
                default: false,
                id: "researcher",
                mode: "subagent",
              },
            ],
          },
          skillsPlugin,
        ]),
        () => [activation, source],
      ).assemble({
        actionType: "provider.generate",
        agentId: "test-agent",
        correlation: { threadId },
        grantedCapabilities: new Set(["provider.generate"]),
        messages: [{ content: "question", role: "user" }],
        sourceEventId: "source",
      }),
    );
    const prompt = result.messages.map(({ content }) => content).join("\n");
    expect(prompt).toContain("Before retrieval, state the decision");
    expect(prompt).toContain("Command capability disposition: available");
  });

  test("reports every unavailable requested capability with a stable kernel code", async () => {
    const events = [storedEvent(1, "source.event", "source")];
    const result = await Effect.runPromise(
      new PromptAssembler(new StaticPluginCatalog([agentPlugin()]), () => events)
        .assemble({
          actionType: "provider.generate",
          agentId: "test-agent",
          correlation: { kind: "test" },
          grantedCapabilities: new Set(),
          messages: [{ content: "question", role: "user" }],
          sourceEventId: "source",
        }),
    );
    expect(result.messages[1]?.content).toContain(
      "CURIOSITY_CAPABILITY_UNAVAILABLE:provider.generate",
    );
  });

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
