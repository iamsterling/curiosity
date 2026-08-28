import assert from "node:assert/strict";
import test from "node:test";
import { removeAndVerify } from "./font-harness-docker-provider.mjs";

test("docker rm --force failure is fatal even when inspect reports absence", () => {
  assert.throws(
    () =>
      removeAndVerify("test-container", (args) => {
        if (args[0] === "rm")
          throw new Error("DOCKER_COMMAND_FAILED:rm:injected");
        return { status: 1 };
      }),
    /DOCKER_COMMAND_FAILED:rm:injected/u,
  );
});

test("successful removal still fails unless absence is verified", () => {
  assert.throws(
    () =>
      removeAndVerify("test-container", (args) => ({
        status: args[0] === "rm" ? 0 : 0,
      })),
    /WATCHDOG_CONTAINER_STILL_PRESENT:test-container/u,
  );
});

test("successful removal and verified absence return explicit cleanup proof", () => {
  assert.deepEqual(
    removeAndVerify("test-container", (args) => ({
      status: args[0] === "rm" ? 0 : 1,
    })),
    { attempted: true, commandSucceeded: true, absent: true },
  );
});
