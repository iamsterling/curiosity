import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import {
  KERNEL_PLUGIN_API_VERSION,
  StaticPluginCatalog,
  type CuriosityPluginV2,
  type PluginDependency,
} from "../src/kernel/plugin.js";

const plugin = (
  id: `curiosity.${string}`,
  commandKind: string,
  requires: readonly PluginDependency[] = [],
): CuriosityPluginV2 => ({
  manifest: {
    capabilities: [],
    class: "semantic",
    id,
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned",
      revision: "test",
      source: `tests/${id}`,
    },
    requires,
    schemaVersion: 2,
    version: "1.0.0",
  },
  commandDeciders: [
    {
      commandKinds: [commandKind],
      decide: () =>
        Effect.succeed([
          { body: { id }, streamId: id, type: `${id}.accepted` },
        ]),
      id: `${id}.commands.main`,
      schemaVersion: 1,
    },
  ],
});

describe("sealed plugin catalog", () => {
  test("orders dependencies deterministically and derives one stable digest", () => {
    const base = plugin("curiosity.test.base", "test.base");
    const dependent = plugin("curiosity.test.dependent", "test.dependent", [
      { pluginId: base.manifest.id, version: base.manifest.version },
    ]);

    const left = new StaticPluginCatalog([dependent, base]);
    const right = new StaticPluginCatalog([base, dependent]);

    expect(left.pluginIds).toEqual([
      "curiosity.test.base",
      "curiosity.test.dependent",
    ]);
    expect(left.pluginIds).toEqual(right.pluginIds);
    expect(left.catalogDigest).toBe(right.catalogDigest);
    expect(left.catalogDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(left.find("test.dependent")).toMatchObject({
      contributionId: "curiosity.test.dependent.commands.main",
      pluginId: "curiosity.test.dependent",
    });
    expect(Object.isFrozen(left)).toBe(true);
    expect(Object.isFrozen(left.pluginIds)).toBe(true);
    expect("register" in left).toBe(false);
  });

  test("rejects duplicate plugin, contribution, and command ownership", () => {
    const first = plugin("curiosity.test.first", "test.command");
    const duplicatePlugin = plugin("curiosity.test.first", "test.other");
    expect(() => new StaticPluginCatalog([first, duplicatePlugin])).toThrow(
      "DUPLICATE_PLUGIN_ID:curiosity.test.first",
    );

    const duplicateContribution = {
      ...plugin("curiosity.test.second", "test.second"),
      commandDeciders: first.commandDeciders!,
    } satisfies CuriosityPluginV2;
    expect(
      () => new StaticPluginCatalog([first, duplicateContribution]),
    ).toThrow("DUPLICATE_CONTRIBUTION_ID:curiosity.test.first.commands.main");

    expect(
      () =>
        new StaticPluginCatalog([
          first,
          plugin("curiosity.test.third", "test.command"),
        ]),
    ).toThrow("DUPLICATE_COMMAND_OWNER:test.command");
  });

  test("rejects missing, mismatched, and cyclic dependencies", () => {
    expect(
      () =>
        new StaticPluginCatalog([
          plugin("curiosity.test.missing", "test.missing", [
            { pluginId: "curiosity.test.absent", version: "1.0.0" },
          ]),
        ]),
    ).toThrow(
      "PLUGIN_DEPENDENCY_MISSING:curiosity.test.missing:curiosity.test.absent",
    );

    const base = plugin("curiosity.test.versioned", "test.versioned");
    const mismatch = plugin("curiosity.test.mismatch", "test.mismatch", [
      { pluginId: base.manifest.id, version: "2.0.0" },
    ]);
    expect(() => new StaticPluginCatalog([base, mismatch])).toThrow(
      "PLUGIN_DEPENDENCY_VERSION_MISMATCH:curiosity.test.mismatch:curiosity.test.versioned:2.0.0:1.0.0",
    );

    const first = plugin("curiosity.test.cycle-a", "test.cycle-a", [
      { pluginId: "curiosity.test.cycle-b", version: "1.0.0" },
    ]);
    const second = plugin("curiosity.test.cycle-b", "test.cycle-b", [
      { pluginId: "curiosity.test.cycle-a", version: "1.0.0" },
    ]);
    expect(() => new StaticPluginCatalog([first, second])).toThrow(
      "PLUGIN_DEPENDENCY_CYCLE:curiosity.test.cycle-a,curiosity.test.cycle-b",
    );
  });

  test("rejects unsupported APIs and unknown manifest fields", () => {
    const unsupported = plugin(
      "curiosity.test.unsupported",
      "test.unsupported",
    );
    const changedApi = {
      ...unsupported,
      manifest: { ...unsupported.manifest, kernelApi: "3.0.0" },
    } satisfies CuriosityPluginV2;
    expect(() => new StaticPluginCatalog([changedApi])).toThrow(
      "PLUGIN_KERNEL_API_UNSUPPORTED:curiosity.test.unsupported:3.0.0",
    );

    const malformed = {
      ...plugin("curiosity.test.malformed", "test.malformed"),
      manifest: {
        ...plugin("curiosity.test.malformed", "test.malformed").manifest,
        unexpected: true,
      },
    } as CuriosityPluginV2;
    expect(() => new StaticPluginCatalog([malformed])).toThrow(
      "PLUGIN_MANIFEST_UNKNOWN_FIELD:curiosity.test.malformed:unexpected",
    );
  });

  test("rejects tool capabilities outside an agent ceiling and missing command routes", () => {
    const base = plugin("curiosity.test.policy", "test.policy");
    const tool = {
      ...base,
      agents: [
        {
          childAgents: [],
          default: true,
          description: "Test agent",
          id: "test-agent",
          maxDelegationDepth: 0,
          mode: "primary",
          requestedCapabilities: ["provider.generate"],
          requestedTools: ["test_search"],
          schemaVersion: 1,
          system: "Test policy",
          version: "1.0.0",
        },
      ],
      tools: [
        {
          actionType: "search.test",
          description: "Test search",
          id: "curiosity.test.policy.tools.test_search",
          inputSchema: { additionalProperties: false, type: "object" },
          name: "test_search",
          outputProvenance: "untrusted-evidence",
          propose: (_input: unknown, subject: { executionId: string; resource: string }) =>
            Effect.succeed({
              actionSchemaVersion: 1 as const,
              actionType: "search.test",
              deadlineClass: "interactive" as const,
              gateClass: "none-requested" as const,
              input: {},
              requestedCapabilities: ["network.search"],
              schemaVersion: 1 as const,
              subject,
            }),
          readOnly: true,
          requestedCapabilities: ["network.search"],
          schemaVersion: 1,
          version: "1.0.0",
        },
      ],
    } satisfies CuriosityPluginV2;
    expect(() => new StaticPluginCatalog([tool])).toThrow(
      "PLUGIN_AGENT_TOOL_CAPABILITY_MISSING:test-agent:test_search:network.search",
    );

    const routed = {
      ...base,
      agents: [
        {
          childAgents: [],
          default: true,
          description: "Test agent",
          id: "test-agent",
          maxDelegationDepth: 0,
          mode: "primary",
          requestedCapabilities: [],
          requestedTools: [],
          schemaVersion: 1,
          system: "Test policy",
          version: "1.0.0",
        },
      ],
      promptCommands: [
        {
          agentId: "missing-agent",
          description: "Missing route",
          id: "curiosity.test.policy.prompt-commands.missing-route",
          instructions: "Route nowhere",
          name: "missing-route",
          schemaVersion: 1,
          skillName: null,
          status: "active",
          version: "1.0.0",
        },
      ],
    } satisfies CuriosityPluginV2;
    expect(() => new StaticPluginCatalog([routed])).toThrow(
      "PLUGIN_PROMPT_COMMAND_AGENT_MISSING:curiosity.test.policy.prompt-commands.missing-route:missing-agent",
    );
  });

  test("registers event reactors deterministically without granting execution", () => {
    const base = plugin("curiosity.test.reactive", "test.reactive");
    const reactive = {
      ...base,
      eventReactors: [
        {
          eventTypes: ["test.source"],
          id: "curiosity.test.reactive.reactors.source",
          react: () =>
            Effect.succeed({
              actions: [
                {
                  actionSchemaVersion: 1,
                  actionType: "test.action",
                  deadlineClass: "interactive",
                  gateClass: "none-requested",
                  input: { value: "proposal-only" },
                  requestedCapabilities: [],
                  schemaVersion: 1,
                  subject: {
                    executionId: "test-execution",
                    resource: "test:resource",
                  },
                },
              ],
              events: [],
            }),
          schemaVersion: 1,
        },
      ],
    } satisfies CuriosityPluginV2;

    const first = new StaticPluginCatalog([reactive]);
    const second = new StaticPluginCatalog([reactive]);
    expect(first.reactorsFor("test.source")).toEqual([
      expect.objectContaining({
        contributionId: "curiosity.test.reactive.reactors.source",
        pluginId: "curiosity.test.reactive",
      }),
    ]);
    expect(first.catalogDigest).toBe(second.catalogDigest);
    expect("execute" in first.reactorsFor("test.source")[0]!).toBe(false);
  });
});
