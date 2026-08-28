import assert from "node:assert/strict";
import { constants } from "node:fs";
import { access, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { CEILINGS, HARNESS_LOCK_PATH, runHarness } from "./font-security-harness.mjs";

const directory = await mkdtemp(path.join(os.tmpdir(), "crafty-font-harness-test-"));
const python = spawnSync("/usr/bin/python3", ["-c", "import sys; print(sys.executable)"], { encoding: "utf8" }).stdout.trim();

const base = (input) => ({
  version: 1,
  executionClass: "benign-control",
  mode: "native",
  command: [python, "{input:0}"],
  inputs: [input],
  uploads: [],
  gpu: { buffers: [1024], textures: [] },
});

async function expectDiagnostic(request, expected, options) {
  let observed;
  await assert.rejects(runHarness(request, options), (error) => {
    observed = error?.diagnostic;
    return observed === expected;
  });
  return observed;
}

async function tempResidue(before) {
  return (await readdir(os.tmpdir())).filter(
    (entry) => entry.startsWith("crafty-font-harness-") && !before.has(entry) && entry !== path.basename(directory),
  );
}

async function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

try {
  const tiny = path.join(directory, "benign-control.txt");
  const upload = path.join(directory, "benign-upload-control.bin");
  const cpu = path.join(directory, "benign-cpu-control.py");
  const sleep = path.join(directory, "benign-sleep-control.py");
  const escape = path.join(directory, "benign-escape-control.py");
  await writeFile(tiny, "synthetic control; this is not font data\n");
  await writeFile(upload, Buffer.alloc(CEILINGS.uploadTotalBytes + 1, 0x41));
  await writeFile(cpu, "value=0\nwhile True:\n value=(value+1)%1000003\n");
  await writeFile(sleep, "import time\ntime.sleep(60)\n");
  await writeFile(escape, [
    "import os, time",
    "pid=os.fork()",
    "if pid == 0:",
    " os.setsid()",
    " with open(os.environ['CRAFTY_BENIGN_ESCAPE_PID_FILE'], 'w') as f: f.write(str(os.getpid()))",
    " time.sleep(60)",
    "else:",
    " time.sleep(0.25)",
    "",
  ].join("\n"));

  const adversarialDiagnostic = await expectDiagnostic(
    { ...base(tiny), executionClass: "adversarial-font" },
    "HARNESS_ADVERSARIAL_BOUNDARY_UNATTESTED",
  );
  const callerFixtureDiagnostic = await expectDiagnostic(
    { ...base(tiny), fixtureCount: 1 },
    "HARNESS_FIXTURE_COUNT_CALLER_DECLARATION_REJECTED",
  );
  const fixtureDiagnostic = await expectDiagnostic(
    { ...base(tiny), inputs: Array.from({ length: CEILINGS.fixtureCount + 1 }, () => tiny) },
    "HARNESS_FIXTURE_COUNT_EXCEEDED",
  );
  const uploadDiagnostic = await expectDiagnostic(
    { ...base(tiny), uploads: [upload] },
    "HARNESS_UPLOAD_BYTES_EXCEEDED",
  );
  const gpuDiagnostic = await expectDiagnostic(
    { ...base(tiny), gpu: { buffers: [CEILINGS.gpuBufferBytes + 1], textures: [] } },
    "HARNESS_GPU_BUFFER_BYTES_EXCEEDED",
  );
  const gpuUnderdeclaredDiagnostic = await expectDiagnostic(
    { ...base(tiny), gpu: { buffers: [1], textures: [{ width: 1, height: 1, bytesPerPixel: 4 }], allocationCount: 1 } },
    "HARNESS_GPU_ALLOCATION_UNDERDECLARED",
  );
  const gpuCountDiagnostic = await expectDiagnostic(
    { ...base(tiny), gpu: { buffers: Array.from({ length: CEILINGS.gpuAllocationCount + 1 }, () => 0), textures: [] } },
    "HARNESS_GPU_ALLOCATION_COUNT_EXCEEDED",
  );
  const stagedReplacementDiagnostic = await expectDiagnostic(base(tiny), "HARNESS_STAGED_INPUT_CHANGED", {
    beforeLaunch: async ({ inputs }) => {
      await rm(inputs[0]);
      await writeFile(inputs[0], "replacement grew after descriptor-backed staging\n");
    },
  });

  const before = new Set((await readdir(os.tmpdir())).filter((entry) => entry.startsWith("crafty-font-harness-")));
  const cpuResult = await runHarness(base(cpu));
  assert.equal(cpuResult.diagnostic, "HARNESS_CPU_TIME_EXCEEDED");
  assert.equal(cpuResult.signal, "SIGXCPU");
  assert.equal(cpuResult.processGroupCleaned, true);

  const escapeResult = await runHarness(base(escape), { proveProcessGroupEscape: true });
  assert.equal(escapeResult.diagnostic, "HARNESS_PROCESS_GROUP_ESCAPE_DETECTED");
  assert.equal(escapeResult.processGroupCleaned, true);
  assert.equal(escapeResult.knownHelpersCleaned, true);
  assert.equal(escapeResult.escapedCleanupGuaranteed, false);

  const cancellation = new AbortController();
  setTimeout(() => cancellation.abort(), 250);
  const cancelledResult = await runHarness(base(sleep), { signal: cancellation.signal });
  assert.equal(cancelledResult.diagnostic, "HARNESS_CONTROLLER_CANCELLED");
  assert.equal(cancelledResult.processGroupCleaned, true);

  const requestPath = path.join(directory, "interrupt-request.json");
  await writeFile(requestPath, JSON.stringify(base(sleep)));
  const controller = spawn(process.execPath, [path.join(import.meta.dirname, "font-security-harness.mjs"), requestPath], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  controller.kill("SIGINT");
  const interrupted = await waitForExit(controller);
  assert.equal(interrupted.code, 130);
  await assert.rejects(access(HARNESS_LOCK_PATH, constants.F_OK));
  assert.deepEqual(await tempResidue(before), []);

  let browserControl = { status: "not-run", reason: "BROWSER_BINARY_UNAVAILABLE" };
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  try {
    await access(chrome, constants.X_OK);
    const browserCancellation = new AbortController();
    setTimeout(() => browserCancellation.abort(), 50);
    const browserResult = await runHarness({
      ...base(tiny),
      mode: "browser",
      command: [chrome, "--headless=new", "--enable-unsafe-webgpu", "--disable-software-rasterizer", "--remote-debugging-port=0", "about:blank"],
    }, { signal: browserCancellation.signal });
    assert.equal(browserResult.diagnostic, "HARNESS_CONTROLLER_CANCELLED");
    assert.equal(browserResult.processGroupCleaned, true);
    assert.equal(browserResult.knownHelpersCleaned, true);
    assert.deepEqual(await tempResidue(before), []);
    browserControl = {
      status: "passed",
      diagnostic: browserResult.diagnostic,
      processGroupCleaned: browserResult.processGroupCleaned,
      knownHelpersCleaned: browserResult.knownHelpersCleaned,
      fontBytesLoaded: false,
      environmentEvidence: "evidence/adr-0024-vello-pixel-oracle-2026-08-16.json",
      containmentClaim: false,
    };
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  process.stdout.write(`${JSON.stringify({
    diagnostic: "HARNESS_SELF_TEST_OK",
    noFontBytesLoaded: true,
    admission: {
      adversarialDiagnostic, callerFixtureDiagnostic, fixtureDiagnostic, uploadDiagnostic, gpuDiagnostic,
      gpuUnderdeclaredDiagnostic, gpuCountDiagnostic, stagedReplacementDiagnostic,
    },
    termination: { cpuResult, escapeResult, cancelledResult, interrupted },
    browserControl,
  })}\n`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
