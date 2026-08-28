import assert from "node:assert/strict";
import test from "node:test";

import { validateDashboardRequest } from "../app/api/curiosity/chat/request.ts";

test("dashboard chat denies cross-origin command admission", async () => {
  const result = await validateDashboardRequest(
    new Request("http://localhost/api/curiosity/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
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
