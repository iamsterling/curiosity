import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "bun:test";
import { createLocalCuriosityClient } from "../src/local-curiosity-client.ts";
import { InMemoryJournal } from "@curiosity/authority";

const sha256 = async (value) =>
  createHash("sha256").update(value).digest("hex");

const fixture = (generation) => {
  let id = 0;
  return createLocalCuriosityClient({
    createId: () => `local-${++id}`,
    generation,
    now: () => "2026-08-29T12:00:00.000Z",
    sha256,
  });
};

test("local client preserves session and submit behavior without HTTP", async () => {
  const deltas = [];
  const client = fixture({
    generate: async (request, onDelta) => {
      assert.deepEqual(request.tools, []);
      assert.equal(request.messages.at(-1)?.content, "Hello");
      onDelta?.("Hi");
      return {
        durationMs: 4,
        effort: "bounded",
        modelId: "apple:system-language-model",
        text: "Hi locally",
      };
    },
  });

  assert.deepEqual(await client.session(), { messages: [], threads: [] });
  const turn = await client.submit(
    { mode: "overview", text: "Hello" },
    (delta) => deltas.push(delta),
  );
  const session = await client.session(turn.threadId);

  assert.equal(turn.text, "Hi locally");
  assert.deepEqual(deltas, ["Hi"]);
  assert.deepEqual(
    session.messages.map(({ role, text }) => ({ role, text })),
    [
      { role: "user", text: "Hello" },
      { role: "assistant", text: "Hi locally" },
    ],
  );
  assert.equal(session.threads[0]?.title, "Hello");
  assert.deepEqual(await client.status(), {
    localRuntime: "available",
    mainProvider: "unavailable",
    onDeviceModel: "available",
    profile: "local",
    researchProvider: "unavailable",
    storage: "ephemeral",
  });
});

test("local client exposes generation unavailability without a Mac fallback", async () => {
  const client = fixture();

  await assert.rejects(client.submit({ mode: "ask", text: "Hello" }), {
    message: "PROVIDER_ROUTE_UNAVAILABLE",
  });
  assert.deepEqual(await client.status(), {
    localRuntime: "available",
    mainProvider: "unavailable",
    onDeviceModel: "unavailable",
    profile: "local",
    researchProvider: "unavailable",
    storage: "ephemeral",
  });
});

test("local client restores projections from an injected durable journal", async () => {
  let journal;
  const generation = {
    generate: async () => ({
      durationMs: 2,
      effort: "bounded",
      modelId: "apple:system-language-model",
      text: "Persisted locally",
    }),
  };
  let id = 0;
  const config = {
    createId: () => `durable-${++id}`,
    generation,
    now: () => "2026-08-29T12:00:00.000Z",
    openJournal: async (catalogDigest) => {
      journal ??= new InMemoryJournal({ catalogDigest, sha256 });
      return journal;
    },
    sha256,
  };
  const first = createLocalCuriosityClient(config);
  const turn = await first.submit({ mode: "ask", text: "Remember this" });

  const relaunched = createLocalCuriosityClient(config);
  const restored = await relaunched.session(turn.threadId);

  assert.deepEqual(
    restored.messages.map(({ role, text }) => ({ role, text })),
    [
      { role: "user", text: "Remember this" },
      { role: "assistant", text: "Persisted locally" },
    ],
  );
  assert.equal((await relaunched.status()).storage, "durable");
});

test("local client persists a dynamically selected frontier receipt", async () => {
  let id = 0;
  let selected = 0;
  const client = createLocalCuriosityClient({
    createId: () => `frontier-${++id}`,
    generation: {
      generate: async (request) => ({
        durationMs: 8,
        effort: "frontier",
        modelId: request.route.modelId,
        text: "Durable frontier answer",
        transportReceipt: {
          callId: request.turnId,
          maxRetries: 0,
          transportAttempts: 1,
        },
      }),
    },
    generationSelection: {
      select: async () => {
        selected += 1;
        return {
          adapterVersion: "codex-direct-native-v1",
          locality: "frontier",
          modelId: "gpt-5.4-mini",
          providerId: "openai-oauth",
          purpose: "turn.answer",
          requestedRouteId: "frontier.openai-oauth",
          routeId: "frontier.openai-oauth",
          selectionPolicyId: "ipados-frontier-connected-v1",
        };
      },
    },
    now: () => "2026-08-29T12:00:00.000Z",
    sha256,
  });

  const turn = await client.submit({ mode: "ask", text: "Use frontier" });
  assert.equal(turn.text, "Durable frontier answer");
  assert.deepEqual(turn.transportReceipt, {
    callId: turn.turnId,
    maxRetries: 0,
    transportAttempts: 1,
  });
  const persisted = await client.session(turn.threadId);
  assert.deepEqual(persisted.messages.at(-1)?.transportReceipt, {
    callId: turn.turnId,
    maxRetries: 0,
    transportAttempts: 1,
  });
  assert.equal(selected, 1);
});
