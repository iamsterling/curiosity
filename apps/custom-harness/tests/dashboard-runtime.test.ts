import { describe, expect, test } from "bun:test";
import { submitDashboardTurn } from "../src/dashboard-runtime.js";

describe("dashboard runtime admission", () => {
  test("rejects an empty turn before starting the kernel", async () => {
    await expect(submitDashboardTurn({ text: "   " })).rejects.toThrow(
      "DASHBOARD_MESSAGE_INVALID",
    );
  });

  test("rejects malformed thread and agent identifiers", async () => {
    await expect(
      submitDashboardTurn({ text: "hello", threadId: "not allowed" }),
    ).rejects.toThrow("DASHBOARD_THREAD_ID_INVALID");
    await expect(
      submitDashboardTurn({ agentId: "../../escape", text: "hello" }),
    ).rejects.toThrow("DASHBOARD_AGENT_ID_INVALID");
  });
});
