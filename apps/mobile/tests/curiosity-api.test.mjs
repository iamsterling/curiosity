import assert from "node:assert/strict";
import test from "node:test";

import {
  commandText,
  createCuriosityApi,
  normalizeCuriosityUrl,
} from "../src/curiosity-api.ts";

const threads = [{ sequence: 7, threadId: "thread-1", title: "Hello" }];

test("mobile API normalizes only credential-free HTTP endpoints", () => {
  assert.equal(normalizeCuriosityUrl(" http://10.1.0.121:3000/ "), "http://10.1.0.121:3000");
  assert.throws(() => normalizeCuriosityUrl("file:///private/data"), {
    message: "MOBILE_SERVER_URL_INVALID",
  });
  assert.throws(() => normalizeCuriosityUrl("https://user:secret@example.com"), {
    message: "MOBILE_SERVER_URL_INVALID",
  });
});

test("mobile API preserves mode command routing", () => {
  assert.equal(commandText("ask", "hello"), "hello");
  assert.equal(commandText("research", "sources"), "/research sources");
  assert.equal(commandText("build", "ship it"), "/task ship it");
});

test("mobile API loads sessions and submits server-owned thread identities", async () => {
  const requests = [];
  const api = createCuriosityApi("http://10.1.0.121:3000", async (url, init) => {
    requests.push({ init, url: String(url) });
    if (!init?.method)
      return Response.json({
        messages: [{ messageId: "message-1", role: "user", text: "Hello" }],
        threads,
      });
    return Response.json({
      assistantMessageId: "message-2",
      text: "Hi",
      threadId: "server-thread",
      threads,
    });
  });

  const session = await api.session("thread-1");
  const turn = await api.submit({ mode: "overview", text: "Hello" });

  assert.equal(session.messages[0]?.text, "Hello");
  assert.equal(turn.threadId, "server-thread");
  assert.equal(requests[0]?.url, "http://10.1.0.121:3000/api/curiosity/session?threadId=thread-1");
  assert.deepEqual(JSON.parse(requests[1]?.init?.body), { text: "Hello" });
});

test("mobile API keeps stable server failures", async () => {
  const api = createCuriosityApi("https://curiosity.example", async () =>
    Response.json({ error: { code: "PROMPT_COMMAND_UNKNOWN" } }, { status: 400 }),
  );
  await assert.rejects(
    api.submit({ mode: "ask", text: "/missing" }),
    { message: "PROMPT_COMMAND_UNKNOWN", status: 400 },
  );
});

test("mobile API bounds responses before parsing", async () => {
  const api = createCuriosityApi("https://curiosity.example", async () =>
    new Response("{}", { headers: { "content-length": "524289" } }),
  );
  await assert.rejects(api.session(), { message: "MOBILE_RESPONSE_TOO_LARGE" });
});

test("mobile API turns stalled and failed fetches into stable errors", async () => {
  const stalled = createCuriosityApi(
    "https://curiosity.example",
    async (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new Error("abort")));
      }),
    1,
  );
  const failed = createCuriosityApi(
    "https://curiosity.example",
    async () => {
      throw new Error("socket details must not escape");
    },
  );

  await assert.rejects(stalled.session(), { message: "MOBILE_REQUEST_TIMEOUT" });
  await assert.rejects(failed.session(), {
    message: "MOBILE_NETWORK_UNAVAILABLE",
  });
});
