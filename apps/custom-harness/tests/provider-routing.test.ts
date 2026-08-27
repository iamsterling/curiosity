import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type ProviderRouteConfig,
  type TextGenerator,
} from "../src/index.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);
const roleIds = [
  "analyst",
  "generalist",
  "implementer",
  "orchestrator",
  "researcher",
  "reviewer",
  "strategist",
  "worker",
] as const;

const delegateInput = {
  agentId: "reviewer",
  description: "Independent route check",
  ownership: { readOnly: true, resources: ["workspace:route-check"] },
  requested: {
    capabilities: ["provider.generate"],
    maximumProviderCalls: 1,
    maximumToolCalls: 0,
    tools: [],
  },
  schemaVersion: 1,
  task: {
    acceptanceChecks: ["Report the selected child route."],
    contextRefs: [],
    deliverable: "One route verdict",
    nonGoals: ["Do not mutate."],
    objective: "Check child provider routing.",
  },
};

const turn = () =>
  signCommand(
    {
      actorId,
      command: {
        id: "command-provider-routing",
        kind: "chat.turn",
        payload: {
          assistantMessageId: "assistant-provider-routing",
          text: "Delegate one route check.",
          threadId: "thread-provider-routing",
          turnId: "turn-provider-routing",
          userMessageId: "user-provider-routing",
        },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: "nonce-provider-routing",
      schemaVersion: 1,
    },
    secret,
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("role-specific provider routing", () => {
  test("selects primary and child generators mechanically and persists one route policy", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-provider-routes-"));
    roots.push(root);
    const databasePath = path.join(root, "events.sqlite");
    const calls: string[] = [];
    let generalistCalls = 0;
    const routes = Object.fromEntries(
      roleIds.map((role): readonly [string, ProviderRouteConfig] => {
        const generator: TextGenerator = {
          effort: role === "reviewer" ? "high" : "medium",
          modelId: `test:${role}`,
          stream: async function* (request) {
            calls.push(role);
            if (role === "generalist") {
              generalistCalls += 1;
              if (generalistCalls === 1) {
                yield {
                  input: delegateInput,
                  toolCallId: "delegate-provider-route",
                  toolName: "agent.delegate",
                  type: "tool-call",
                } as never;
                return;
              }
              expect(request.messages.at(-1)?.content).toContain(
                "Reviewer route selected.",
              );
              yield "Primary route resumed.";
              return;
            }
            if (role === "reviewer") {
              yield "Reviewer route selected.";
              return;
            }
            throw new Error(`UNEXPECTED_ROUTE:${role}`);
          },
        };
        return [
          role,
          {
            adapterVersion: "test-adapter-v1",
            generator,
            routeId: `route:${role}`,
          },
        ];
      }),
    );
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      providerRoutes: routes,
      supervisorPath,
      workspaceRoot: root,
    });
    expect(await harness.chat(turn())).toMatchObject({
      modelId: "test:generalist",
      text: "Primary route resumed.",
    });
    expect(calls).toEqual(["generalist", "reviewer", "generalist"]);
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    const snapshots = database
      .query<
        {
          agent_id: string;
          adapter_version: string;
          config_digest: string;
          model_id: string;
          policy_digest: string;
          purpose: string;
          route_id: string;
        },
        []
      >(
        "SELECT json_extract(actions.input_json,'$.agentId') AS agent_id,json_extract(attempts.snapshot_json,'$.route.adapterVersion') AS adapter_version,json_extract(attempts.snapshot_json,'$.configDigest') AS config_digest,provider_calls.model_id,json_extract(attempts.snapshot_json,'$.route.policyDigest') AS policy_digest,provider_calls.purpose,json_extract(attempts.snapshot_json,'$.route.routeId') AS route_id FROM provider_calls JOIN attempts ON attempts.attempt_id = provider_calls.attempt_id JOIN actions ON actions.action_id = provider_calls.action_id ORDER BY provider_calls.allocated_at,provider_calls.call_id",
      )
      .all();
    expect(snapshots.map(({ agent_id, model_id, purpose, route_id }) => ({
      agent_id,
      model_id,
      purpose,
      route_id,
    }))).toEqual([
      {
        agent_id: "generalist",
        model_id: "test:generalist",
        purpose: "normal",
        route_id: "route:generalist",
      },
      {
        agent_id: "reviewer",
        model_id: "test:reviewer",
        purpose: "child",
        route_id: "route:reviewer",
      },
      {
        agent_id: "generalist",
        model_id: "test:generalist",
        purpose: "normal",
        route_id: "route:generalist",
      },
    ]);
    expect(new Set(snapshots.map(({ policy_digest }) => policy_digest)).size).toBe(
      1,
    );
    expect(new Set(snapshots.map(({ config_digest }) => config_digest)).size).toBe(
      1,
    );
    expect(snapshots[0]?.config_digest).toMatch(/^[a-f0-9]{64}$/u);
    expect(
      snapshots.every(
        ({ adapter_version, policy_digest }) =>
          adapter_version === "test-adapter-v1" &&
          /^[a-f0-9]{64}$/u.test(policy_digest),
      ),
    ).toBe(true);
    database.close();
  });

  test("rejects incomplete route coverage before supervisor startup", () => {
    expect(() =>
      createCuriosityHarness({
        actorId,
        authenticationSecret: secret,
        databasePath: ":memory:",
        providerRoutes: {},
        supervisorPath,
        workspaceRoot: import.meta.dir,
      }),
    ).toThrow("PROVIDER_ROUTE_COVERAGE_INVALID");
    expect(() =>
      createCuriosityHarness({
        actorId,
        authenticationSecret: secret,
        databasePath: ":memory:",
        supervisorPath,
        workspaceRoot: import.meta.dir,
        unexpectedGrant: true,
      } as never),
    ).toThrow("HARNESS_CONFIG_UNKNOWN_FIELD");
  });

  test("enforces one closed enabled-role policy at admission, catalog, and route resolution", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-role-policy-"));
    roots.push(root);
    const calls: string[] = [];
    const generator = (role: "orchestrator" | "reviewer"): TextGenerator => ({
      effort: "medium",
      modelId: `test:${role}`,
      stream: async function* () {
        calls.push(role);
        yield `${role} selected`;
      },
    });
    const rolePolicy = {
      defaultPrimaryRole: "orchestrator",
        enabledPrimaryRoles: ["orchestrator"],
        enabledSubagentRoles: ["reviewer"],
        maximumChildrenPerTurn: 2,
        maximumConcurrentChildren: 1,
      maximumDelegationDepth: 1,
      schemaVersion: 1,
    } as const;
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath: path.join(root, "events.sqlite"),
      providerRoutes: {
        orchestrator: {
          adapterVersion: "test-adapter-v1",
          generator: generator("orchestrator"),
          routeId: "route:orchestrator",
        },
        reviewer: {
          adapterVersion: "test-adapter-v1",
          generator: generator("reviewer"),
          routeId: "route:reviewer",
        },
      },
      rolePolicy,
      supervisorPath,
      workspaceRoot: root,
    });
    expect(harness.catalog.defaultPrimaryRole).toBe("orchestrator");
    expect(harness.catalog.agents.map(({ id }) => id).sort()).toEqual([
      "orchestrator",
      "reviewer",
    ]);
    expect(
      harness.catalog.promptCommands.some(({ agentId }) => agentId === "researcher"),
    ).toBe(false);
    expect(await harness.chat(turn())).toMatchObject({
      modelId: "test:orchestrator",
      text: "orchestrator selected",
    });
    const disabled = signCommand(
      {
        actorId,
        command: {
          id: "command-provider-routing-disabled",
          kind: "chat.turn",
          payload: {
            agentId: "generalist",
            assistantMessageId: "assistant-provider-routing-disabled",
            text: "Use a disabled role.",
            threadId: "thread-provider-routing-disabled",
            turnId: "turn-provider-routing-disabled",
            userMessageId: "user-provider-routing-disabled",
          },
          schemaVersion: 1,
        },
        issuedAt: new Date().toISOString(),
        nonce: "nonce-provider-routing-disabled",
        schemaVersion: 1,
      },
      secret,
    );
    await expect(
      harness.submit(disabled),
    ).rejects.toMatchObject({ message: "CHAT_AGENT_UNKNOWN" });
    expect(calls).toEqual(["orchestrator"]);
    await harness.dispose();

    expect(() =>
      createCuriosityHarness({
        actorId,
        authenticationSecret: secret,
        databasePath: ":memory:",
        providerRoutes: {},
        rolePolicy: {
          ...rolePolicy,
          defaultPrimaryRole: "generalist",
        } as never,
        supervisorPath,
        workspaceRoot: root,
      }),
    ).toThrow("ROLE_POLICY_INVALID");
  });
});
