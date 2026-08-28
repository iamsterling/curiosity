import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const modulePath = process.env.CRAFTY_FONT_HARNESS_MODULE ?? "./font-security-harness.mjs";
const { CEILINGS, runHarness } = await import(modulePath);
const directory = await mkdtemp(path.join(os.tmpdir(), "crafty-font-control-acceptance-"));
const tiny = path.join(directory, "control.py");
const sleep = path.join(directory, "sleep.py");
await writeFile(tiny, "pass\n");
await writeFile(sleep, "import time\ntime.sleep(60)\n");
const base = (input) => ({
  version: 1,
  executionClass: "benign-control",
  mode: "native",
  command: ["/usr/bin/python3", "{input:0}"],
  inputs: [input],
  uploads: [],
  gpu: { buffers: [], textures: [] },
});

test("derives and enforces fixture admission", async () => {
  await assert.rejects(
    runHarness({ ...base(tiny), inputs: Array.from({ length: CEILINGS.fixtureCount + 1 }, () => tiny) }),
    (error) => error?.diagnostic === "HARNESS_FIXTURE_COUNT_EXCEEDED",
  );
});

test("controller cancellation terminates the process group", async () => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 100);
  const result = await runHarness(base(sleep), { signal: controller.signal });
  assert.equal(result.diagnostic, "HARNESS_CONTROLLER_CANCELLED");
  assert.equal(result.processGroupCleaned, true);
  assert.equal(result.knownHelpersCleaned, true);
});

test.after(async () => rm(directory, { recursive: true, force: true }));
