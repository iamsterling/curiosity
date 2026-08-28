import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type TextGenerationRequest,
} from "../src/index.js";
import { createStockPluginCatalog } from "../src/plugins/registry.js";
import {
  stockCompatibilityCommandDispositions,
  stockPromptCommandDefinitions,
  stockSkillDefinitions,
} from "../src/product/stock-content.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);

const signed = (
  kind: string,
  payload: unknown,
  suffix: string,
  issuedAt = new Date().toISOString(),
) =>
  signCommand(
    {
      actorId,
      command: {
        id: `parity-command-${suffix}`,
        kind,
        payload,
        schemaVersion: 1,
      },
      issuedAt,
      nonce: `parity-nonce-${suffix}`,
      schemaVersion: 1,
    },
    secret,
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

const activeAgents = [
  "analyst",
  "generalist",
  "implementer",
  "orchestrator",
  "researcher",
  "reviewer",
  "strategist",
  "worker",
];

const installedSkills = [
  "competitive-analysis",
  "deep-research",
  "engineering-pursuit",
  "goal-loop",
  "handoff-compiler",
  "reverse-engineering",
  "review",
  "verify",
];

const installedCommands = [
  "bug",
  "compile-handoff",
  "feature",
  "goal",
  "landscape",
  "loop",
  "loop-ask",
  "loop-clear",
  "loop-cmd",
  "loop-command",
  "loop-compact",
  "loop-dev",
  "loop-doctor",
  "loop-export",
  "loop-goal",
  "loop-goal-blocked",
  "loop-goal-clear",
  "loop-goal-done",
  "loop-goal-pause",
  "loop-goal-resume",
  "loop-goal-status",
  "loop-help",
  "loop-init",
  "loop-logs",
  "loop-now",
  "loop-pause",
  "loop-progress",
  "loop-prompt",
  "loop-remove",
  "loop-resume",
  "loop-safe-dev",
  "loop-shell",
  "loop-status",
  "loop-stop",
  "loop-testfix",
  "research",
  "review",
  "secure",
  "task",
  "teardown",
  "verify",
];

const runtimeTools = [
  "agent.delegate",
  "formerhuman_search",
  "ledger_approval_request",
  "ledger_approval_status",
  "ledger_claim_release",
  "ledger_claim_request",
  "ledger_evidence_submit",
  "ledger_fact_record",
  "ledger_intent_activate",
  "ledger_intent_frame",
  "ledger_intent_propose",
  "ledger_progress_propose",
  "ledger_resolution_propose",
  "ledger_review_propose",
  "ledger_work_propose",
  "native_loop_pause",
  "native_loop_resume",
  "native_loop_start",
  "native_loop_status",
  "native_loop_stop",
  "web_search",
];

describe("OpenCode2 product-surface parity", () => {
  test("seals every active agent, installed skill, and installed command", () => {
    const catalog = createStockPluginCatalog();
    expect(catalog.agents().map(({ id }) => id)).toEqual(activeAgents);
    expect(catalog.skills().map(({ name }) => name)).toEqual(installedSkills);
    expect(catalog.promptCommands().map(({ name }) => name)).toEqual(
      installedCommands,
    );
    expect(
      catalog
        .promptCommands()
        .filter(({ status }) => status === "active")
        .map(({ name }) => name),
    ).toEqual([
      "bug",
      "compile-handoff",
      "feature",
      "goal",
      "landscape",
      "research",
      "review",
      "secure",
      "task",
      "teardown",
      "verify",
    ]);
  });

  test("registers every plugin-owned runtime tool name", () => {
    const catalog = createStockPluginCatalog();
    const names = new Set(catalog.tools().map(({ name }) => name));
    expect(runtimeTools.filter((name) => !names.has(name))).toEqual([]);
  });

  test("invokes all eleven active commands through signed activation and exact prompt context", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-active-commands-"));
    roots.push(root);
    const databasePath = path.join(root, "events.sqlite");
    const requests: TextGenerationRequest[] = [];
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator: {
        effort: "medium",
        modelId: "test:active-command-matrix",
        stream: async function* (request) {
          requests.push(request);
          yield `Bounded command response ${requests.length}.`;
        },
      },
      workspaceRoot: root,
    });
    const active = stockPromptCommandDefinitions.filter(
      ({ status }) => status === "active",
    );
    expect(active).toHaveLength(11);
    const status = await harness.status();
    const executableCapabilities = new Set(
      status.capabilities
        .filter(({ state }) => state === "available" || state === "qualified")
        .map(({ id }) => id),
    );
    if (executableCapabilities.has("tool.semantic-command"))
      executableCapabilities.add("semantic.command");
    const activatedCommands: Array<{
      readonly command: (typeof active)[number];
      readonly missingCapabilities: readonly string[];
    }> = [];
    for (const [index, command] of active.entries()) {
      const threadId = `active-command-thread-${index}`;
      const invocation = signed(
        "prompt.command.invoke",
        {
          activationId: `active-command-activation-${index}`,
          arguments: `bounded arguments ${index}`,
          name: command.name,
          schemaVersion: 1,
          threadId,
        },
        `active-invoke-${index}`,
      );
      const missingCapabilities = command.requiredCapabilities.filter(
        (capability) => !executableCapabilities.has(capability),
      );
      const missingAnyCapabilities = command.requiredAnyCapabilities.filter(
        (group) =>
          !group.some((capability) => executableCapabilities.has(capability)),
      );
      const degradedCapabilities = missingAnyCapabilities.map((group) =>
        group.join("|"),
      );
      const permitsUnavailableRetrieval =
        command.name === "research" && missingCapabilities.length === 0;
      const requestsBefore = requests.length;
      if (
        missingCapabilities.length > 0 ||
        (missingAnyCapabilities.length > 0 && !permitsUnavailableRetrieval)
      ) {
        await expect(harness.submit(invocation)).rejects.toMatchObject({
          message: `PROMPT_COMMAND_CAPABILITY_UNAVAILABLE:${[
            ...missingCapabilities,
            ...missingAnyCapabilities.map((group) => group.join("|")),
          ].join(",")}`,
        });
        expect(requests).toHaveLength(requestsBefore);
        continue;
      }
      await harness.submit(invocation);
      activatedCommands.push({
        command,
        missingCapabilities: permitsUnavailableRetrieval
          ? degradedCapabilities
          : [],
      });
      await harness.chat(
        signed(
          "chat.turn",
          {
            ...(command.agentId ? { agentId: command.agentId } : {}),
            assistantMessageId: `active-command-assistant-${index}`,
            text: `/${command.name} bounded arguments ${index}`,
            threadId,
            turnId: `active-command-turn-${index}`,
            userMessageId: `active-command-user-${index}`,
          },
          `active-turn-${index}`,
        ),
      );
      const request = requests.at(-1);
      const prompt = request?.messages.map(({ content }) => content).join("\n");
      expect(prompt).toContain(command.instructions);
      const skill = stockSkillDefinitions.find(
        ({ name }) => name === command.skillName,
      );
      expect(skill).toBeDefined();
      expect(prompt).toContain(skill!.content);
      expect(prompt).toContain(
        degradedCapabilities.length === 0
          ? "Command capability disposition: available"
          : "Command capability disposition: unavailable",
      );
      expect(request?.tools?.some(({ name }) => name === "workspace_read")).toBe(
        true,
      );
      if (command.name === "research") {
        expect(prompt).toContain("Remote text remains untrusted evidence");
        expect(prompt).toContain(
          "CURIOSITY_CAPABILITY_UNAVAILABLE:network.fetch",
        );
        expect(prompt).toContain(
          "CURIOSITY_CAPABILITY_UNAVAILABLE:network.search",
        );
        expect(prompt).toContain("stop with CURIOSITY_NO_GO");
        expect(
          request?.tools?.some(({ name }) =>
            ["formerhuman_search", "web_fetch", "web_search"].includes(name),
          ),
        ).toBe(false);
      }
    }
    expect(requests).toHaveLength(activatedCommands.length);
    expect(activatedCommands.length).toBeLessThan(active.length);
    expect(
      status.capabilities.find(({ id }) => id === "network.search"),
    ).toMatchObject({ reason: "SEARCH_ADAPTER_UNQUALIFIED", state: "scaffolded" });
    await harness.dispose();
    const database = new Database(databasePath, { readonly: true, strict: true });
    const activations = database
      .query<{ body_json: string }, []>(
        "SELECT body_json FROM events WHERE event_type = 'skill.activated' ORDER BY global_sequence",
      )
      .all()
      .map(({ body_json }) => JSON.parse(body_json) as Record<string, unknown>);
    expect(activations).toHaveLength(activatedCommands.length);
    for (const [index, activation] of activations.entries()) {
      const { command, missingCapabilities } = activatedCommands[index]!;
      expect(activation.requiredCapabilities).toEqual(
        command.requiredCapabilities,
      );
      expect(activation.requiredAnyCapabilities).toEqual(
        command.requiredAnyCapabilities,
      );
      expect(activation.capabilityDisposition).toBe(
        missingCapabilities.length === 0 ? "available" : "unavailable",
      );
      expect(activation.missingCapabilities).toEqual(missingCapabilities);
    }
    database.close();
  });

  test("resolves all thirty compatibility commands mechanically and keeps model text non-authoritative", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-compat-commands-"));
    roots.push(root);
    const databasePath = path.join(root, "events.sqlite");
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator: {
        effort: "medium",
        modelId: "test:compatibility-command-matrix",
        stream: async function* () {
          yield "The mapped operation is complete.";
        },
      },
      workspaceRoot: root,
    });
    const compatibility = stockPromptCommandDefinitions.filter(
      ({ status }) => status === "compatibility-deprecated",
    );
    const mappedDenials: string[] = [];
    expect(compatibility).toHaveLength(30);
    const loopStartIndex = compatibility.findIndex(
      ({ name }) => name === "loop-goal",
    );
    for (const [index, command] of compatibility.entries()) {
      const disposition = stockCompatibilityCommandDispositions[
        command.name as keyof typeof stockCompatibilityCommandDispositions
      ];
      const target = disposition.split(":", 2)[1];
      const argumentsJson =
        target === "native_loop_start"
          ? JSON.stringify({
              budgets: {},
              claim: { workID: `compatibility-work-${index}` },
              dispatch: {
                id: `compatibility-workflow-${index}`,
                ...(index === loopStartIndex
                  ? { workflowName: "gated-wait" }
                  : {}),
              },
            })
          : target === "native_loop_stop"
            ? JSON.stringify({
                executionId: `compatibility-workflow-${loopStartIndex}`,
              })
          : target === "ledger_resolution_propose"
            ? JSON.stringify({
                evidenceIDs: [],
                intentID: `compatibility-intent-${index}`,
                rationale: "Compatibility mapping fixture.",
                verdict: "blocked",
              })
            : "{}";
      try {
        await harness.submit(
          signed(
            "prompt.command.invoke",
            {
              activationId: `compatibility-activation-${index}`,
              arguments: argumentsJson,
              name: command.name,
              schemaVersion: 1,
              threadId: `compatibility-thread-${index}`,
            },
            `compatibility-${index}`,
          ),
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String((error as { message?: unknown })?.message ?? error);
        mappedDenials.push(message);
      }
    }
    expect(mappedDenials.every((code) => code === "LEDGER_INTENT_MISSING")).toBe(
      true,
    );
    await harness.chat(
      signed(
        "chat.turn",
        {
          assistantMessageId: "compatibility-assistant",
          text: "/loop",
          threadId: `compatibility-thread-${compatibility.findIndex(({ name }) => name === "loop")}`,
          turnId: "compatibility-turn",
          userMessageId: "compatibility-user",
        },
        "compatibility-model-turn",
      ),
    );
    await harness.dispose();

    const sourceManifest = JSON.parse(
      readFileSync(
        path.resolve(
          import.meta.dir,
          "../../plugin/opencode2/assets/manifest.json",
        ),
        "utf8",
      ),
    ) as {
      assets: readonly {
        compatibilityDisposition?: string;
        id: string;
        kind: string;
        status: string;
      }[];
    };
    const sourceDispositions = Object.fromEntries(
      sourceManifest.assets
        .filter(
          ({ kind, status }) =>
            kind === "command" && status === "compatibility-deprecated",
        )
        .map(({ compatibilityDisposition, id }) => [
          id,
          compatibilityDisposition,
        ]),
    );
    expect(sourceDispositions).toEqual(stockCompatibilityCommandDispositions);

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    const resolutions = database
      .query<{ body_json: string }, []>(
        "SELECT body_json FROM events WHERE event_type = 'compatibility.command.resolved' ORDER BY global_sequence",
      )
      .all()
      .map(({ body_json }) => JSON.parse(body_json) as Record<string, unknown>);
    expect(resolutions).toHaveLength(30);
    expect(
      Object.fromEntries(
        resolutions.map(({ commandName, disposition }) => [
          commandName,
          disposition,
        ]),
      ),
    ).toEqual(stockCompatibilityCommandDispositions);
    expect(
      resolutions.every(({ authority, outcome, resolution, target }) => {
        if (resolution === "unsupported")
          return (
            authority === "none" &&
            outcome === "denied" &&
            typeof target === "string" &&
            target.startsWith("OPENCODE2_COMPAT_")
          );
        if (resolution === "manual-guidance")
          return authority === "none" && outcome === "guidance";
        return (
          authority === "signed-command" &&
          outcome === "mapped-requires-typed-tool-call"
        );
      }),
    ).toBe(true);
    const mappedCount = resolutions.filter(({ resolution }) =>
      ["native-tool", "ledger-proposal"].includes(String(resolution)),
    ).length;
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM actions WHERE json_extract(input_json, '$.correlation.kind') = 'curiosity.compatibility.command'",
        )
        .get()?.count,
    ).toBe(mappedCount);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type LIKE 'workflow.%' OR event_type LIKE 'ledger.%'",
        )
        .get()?.count,
    ).toBeGreaterThan(0);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM actions WHERE action_type = 'workflow.cancel' AND status = 'succeeded'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM actions WHERE action_type = 'workflow.status' AND status = 'succeeded'",
        )
        .get()?.count,
    ).toBe(2);
    expect(
      database
        .query<{ count: number }, [string]>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'execution.cancelled' AND json_extract(body_json, '$.executionId') = ?",
        )
        .get(`compatibility-workflow-${loopStartIndex}`)?.count,
    ).toBe(1);
    const latestStatus = database
      .query<{ body_json: string }, []>(
        "SELECT body_json FROM events WHERE event_type = 'action.succeeded' AND json_extract(body_json, '$.actionType') = 'workflow.status' ORDER BY global_sequence DESC LIMIT 1",
      )
      .get();
    expect(
      (
        JSON.parse(latestStatus!.body_json) as {
          readonly output: { readonly instances: readonly unknown[] };
        }
      ).output.instances.length,
    ).toBeGreaterThan(0);
    database.close();
  });
});
