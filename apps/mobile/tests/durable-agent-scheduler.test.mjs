import assert from "node:assert/strict";
import { test } from "bun:test";
import { DurableAgentScheduler } from "../src/durable-agent-scheduler.ts";

test("scheduler recovers once, reconciles admission, and serially drains to idle", async () => {
  const order = [];
  const results = [
    { kind: "tool", tool: { actionId: "action-1", kind: "succeeded" } },
    { kind: "idle" },
    { kind: "idle" },
  ];
  const scheduler = new DurableAgentScheduler({
    admission: {
      reconcile: async () => {
        order.push("admit");
        return [{ disposition: "accepted", revision: 0, runId: "run-1" }];
      },
    },
    createAuthority: async () => {
      order.push("authority");
      return { events: () => [] };
    },
    loop: {
      drainOne: async () => {
        order.push("drain");
        return results.shift();
      },
      recover: async () => {
        order.push("recover");
        return { attempts: [], terminals: [] };
      },
    },
  });

  const [first, second] = await Promise.all([
    scheduler.wake(),
    scheduler.wake(),
  ]);

  assert.equal(first.stopped, "idle");
  assert.equal(first.admittedRuns, 1);
  assert.equal(second.stopped, "idle");
  assert.deepEqual(order, [
    "recover",
    "authority",
    "admit",
    "drain",
    "drain",
    "authority",
    "admit",
    "drain",
  ]);
});

test("scheduler aborts its owned drain when the app becomes inactive", async () => {
  let entered;
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  const scheduler = new DurableAgentScheduler({
    admission: { reconcile: async () => [] },
    createAuthority: async () => ({ events: () => [] }),
    loop: {
      drainOne: (signal) =>
        new Promise((resolve) => {
          entered();
          signal.addEventListener("abort", () => resolve({ kind: "idle" }), {
            once: true,
          });
        }),
      recover: async () => ({ attempts: [], terminals: [] }),
    },
  });

  const wake = scheduler.wake();
  await started;
  await scheduler.setActive(false);
  assert.equal((await wake).stopped, "idle");
  assert.equal((await scheduler.wake()).stopped, "inactive");
});
