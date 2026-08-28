import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type TextGenerator,
} from "../../src/index.js";
import { percentile, type EfficiencyWorkload } from "./metrics.js";
import {
  deterministicGenerator,
  efficiencyActorId,
  researchAdapter,
  signedTurn,
} from "./kernel-fixtures.js";

export const runKernelTurnWorkload = async (
  supervisorPath: string,
): Promise<EfficiencyWorkload> => {
  Bun.gc(true);
  const heapBefore = process.memoryUsage().heapUsed;
  const root = await mkdtemp(path.join(tmpdir(), "curiosity-efficiency-"));
  const secret = randomBytes(32).toString("hex");
  const harness = createCuriosityHarness({
    actorId: efficiencyActorId,
    authenticationSecret: secret,
    databasePath: path.join(root, "events.sqlite"),
    supervisorPath,
    textGenerator: deterministicGenerator,
    workspaceRoot: root,
  });
  const startupStarted = performance.now();
  try {
    await harness.status();
    const startupMs = performance.now() - startupStarted;
    const turnDurations: number[] = [];
    let deltaCount = 0;
    for (let index = 0; index < 5; index += 1) {
      const started = performance.now();
      await harness.chat(signedTurn(secret, `efficiency turn ${index}`), () => {
        deltaCount += 1;
      });
      turnDurations.push(performance.now() - started);
    }
    Bun.gc(true);
    return {
      metrics: {
        delta_count: deltaCount,
        heap_delta_bytes: Math.max(0, process.memoryUsage().heapUsed - heapBefore),
        startup_ms: startupMs,
        turn_p50_ms: percentile(turnDurations, 0.5),
        turn_p95_ms: percentile(turnDurations, 0.95),
      },
      units: {
        delta_count: "count",
        heap_delta_bytes: "bytes",
        startup_ms: "ms",
        turn_p50_ms: "ms",
        turn_p95_ms: "ms",
      },
    };
  } finally {
    await harness.dispose();
    await rm(root, { force: true, recursive: true });
  }
};

export const runResearchTurnWorkload = async (
  supervisorPath: string,
): Promise<EfficiencyWorkload> => {
  const root = await mkdtemp(path.join(tmpdir(), "curiosity-research-efficiency-"));
  const secret = randomBytes(32).toString("hex");
  let generation = 0;
  let activeSearches = 0;
  let maximumActiveSearches = 0;
  const delayedResearchAdapter = {
    ...researchAdapter,
    search: async (
      request: Parameters<NonNullable<typeof researchAdapter.search>>[0],
    ) => {
      activeSearches += 1;
      maximumActiveSearches = Math.max(maximumActiveSearches, activeSearches);
      try {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return await researchAdapter.search!(request);
      } finally {
        activeSearches -= 1;
      }
    },
  };
  const generator: TextGenerator = {
    effort: "high",
    modelId: "benchmark:research",
    stream: async function* () {
      generation += 1;
      if (generation === 1) {
        for (let ordinal = 0; ordinal < 4; ordinal += 1)
          yield {
            input: {
              maxResults: 2,
              query: `primary evidence ${ordinal}`,
              schemaVersion: 1,
            },
            toolCallId: `efficiency-search-${ordinal}`,
            toolName: "web_search",
            type: "tool-call",
          } as never;
        return;
      }
      if (generation === 2) {
        yield {
          input: {
            maxBytes: 4_096,
            schemaVersion: 1,
            url: "https://example.com/primary",
          },
          toolCallId: "efficiency-fetch",
          toolName: "web_fetch",
          type: "tool-call",
        } as never;
        return;
      }
      yield "Finding [Primary source](https://example.com/primary).";
    },
  };
  const harness = createCuriosityHarness({
    actorId: efficiencyActorId,
    authenticationSecret: secret,
    databasePath: path.join(root, "events.sqlite"),
    researchAdapter: delayedResearchAdapter,
    supervisorPath,
    textGenerator: generator,
    workspaceRoot: root,
  });
  try {
    await harness.submit(
      signCommand(
        {
          actorId: efficiencyActorId,
          command: {
            id: randomUUID(),
            kind: "prompt.command.invoke",
            payload: {
              activationId: randomUUID(),
              arguments: "Find primary evidence",
              name: "research",
              schemaVersion: 1,
              threadId: "efficiency-thread",
            },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: randomUUID(),
          schemaVersion: 1,
        },
        secret,
      ),
    );
    const started = performance.now();
    const result = await harness.chat(
      signedTurn(secret, "/research Find primary evidence", "researcher"),
    );
    return {
      metrics: {
        duration_ms: performance.now() - started,
        generation_count: generation,
        maximum_active_searches: maximumActiveSearches,
        source_count: result.researchReceipt?.sourceCount ?? 0,
        tool_call_count: result.researchReceipt?.toolCallCount ?? 0,
      },
      units: {
        duration_ms: "ms",
        generation_count: "count",
        maximum_active_searches: "count",
        source_count: "count",
        tool_call_count: "count",
      },
    };
  } finally {
    await harness.dispose();
    await rm(root, { force: true, recursive: true });
  }
};
