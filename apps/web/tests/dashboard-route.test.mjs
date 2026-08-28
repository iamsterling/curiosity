import assert from "node:assert/strict";
import test from "node:test";

import { validateDashboardRequest } from "../app/api/curiosity/chat/request.ts";
import { readDashboardResponse } from "../app/dashboard-response.ts";

test("dashboard chat accepts the browser host behind a wildcard bind", async () => {
  const wildcard = await validateDashboardRequest(
    new Request("http://0.0.0.0:3000/api/curiosity/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({ text: "hello" }),
    }),
  );
  assert.deepEqual(wildcard, {
    input: { text: "hello" },
    ok: true,
  });
});

test("dashboard chat denies cross-origin command admission", async () => {
  const result = await validateDashboardRequest(
    new Request("http://localhost/api/curiosity/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost",
        origin: "https://attacker.example",
      },
      body: JSON.stringify({ text: "hello" }),
    }),
  );
  assert.deepEqual(result, {
    code: "DASHBOARD_ORIGIN_DENIED",
    ok: false,
    status: 403,
  });
});

test("dashboard chat does not trust client-supplied forwarding headers", async () => {
  const result = await validateDashboardRequest(
    new Request("http://0.0.0.0:3000/api/curiosity/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "https://attacker.example",
        "x-forwarded-host": "attacker.example",
        "x-forwarded-proto": "https",
      },
      body: JSON.stringify({ text: "hello" }),
    }),
  );
  assert.deepEqual(result, {
    code: "DASHBOARD_ORIGIN_DENIED",
    ok: false,
    status: 403,
  });
});

test("dashboard chat requires a narrow JSON envelope", async () => {
  const wrongType = await validateDashboardRequest(
    new Request("http://localhost/api/curiosity/chat", {
      method: "POST",
      body: "text=hello",
    }),
  );
  assert.deepEqual(wrongType, {
    code: "DASHBOARD_CONTENT_TYPE_INVALID",
    ok: false,
    status: 415,
  });

  const unknownField = await validateDashboardRequest(
    new Request("http://localhost/api/curiosity/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: "not-allowed", text: "hello" }),
    }),
  );
  assert.deepEqual(unknownField, {
    code: "DASHBOARD_BODY_INVALID",
    ok: false,
    status: 400,
  });
});

test("dashboard client preserves stable API failures and bounds invalid responses", async () => {
  await assert.rejects(
    readDashboardResponse(
      Response.json(
        { error: { code: "DASHBOARD_ORIGIN_DENIED" } },
        { status: 403 },
      ),
      "DASHBOARD_RESPONSE_INVALID",
    ),
    { message: "DASHBOARD_ORIGIN_DENIED" },
  );
  await assert.rejects(
    readDashboardResponse(
      new Response("upstream failure", { status: 502 }),
      "DASHBOARD_RESPONSE_INVALID",
    ),
    { message: "DASHBOARD_HTTP_502" },
  );
  await assert.rejects(
    readDashboardResponse(
      new Response("not json", { status: 200 }),
      "DASHBOARD_RESPONSE_INVALID",
    ),
    { message: "DASHBOARD_RESPONSE_INVALID" },
  );
});
