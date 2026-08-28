import {
  lstat,
  mkdtemp,
  readFile,
  readlink,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CEILINGS, runHarness } from "./font-security-harness.mjs";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const mode = process.argv[2] ?? "attest";
const directory = await mkdtemp(path.join(os.tmpdir(), "capsule-control-"));
const control = path.join(directory, "control.py");
const request = (input = control, executionClass = "benign-control") => ({
  version: 1,
  executionClass,
  mode: "native",
  command: ["/usr/bin/python3", "{input:0}"],
  inputs: [input],
  uploads: [],
  gpu: { buffers: [], textures: [] },
});

try {
  if (mode === "controller-loss") {
    const child = spawn("/bin/sh", ["-c", "sleep 60"], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    process.stdout.write(
      `${JSON.stringify({ diagnostic: "CAPSULE_CONTROLLER_EXIT", descendantPid: child.pid, noFontBytesLoaded: true })}\n`,
    );
    process.exit(0);
  }
  await writeFile(control, "pass\n", { mode: 0o400 });
  if (mode === "attest") {
    const result = await runHarness(request(control, "adversarial-font"));
    if (result.diagnostic !== "HARNESS_OK")
      process.stderr.write(`${JSON.stringify(result)}\n`);
    assert.equal(result.diagnostic, "HARNESS_OK");
    const attestationStat = await lstat("/capsule/attestation.json");
    const [
      cgroup,
      controllers,
      mountinfo,
      status,
      cpuMax,
      memoryMax,
      memorySwapMax,
      pidsMax,
    ] = await Promise.all([
      readFile("/proc/self/cgroup", "utf8"),
      readFile("/sys/fs/cgroup/cgroup.controllers", "utf8"),
      readFile("/proc/self/mountinfo", "utf8"),
      readFile("/proc/self/status", "utf8"),
      readFile("/sys/fs/cgroup/cpu.max", "utf8"),
      readFile("/sys/fs/cgroup/memory.max", "utf8"),
      readFile("/sys/fs/cgroup/memory.swap.max", "utf8"),
      readFile("/sys/fs/cgroup/pids.max", "utf8"),
    ]);
    const namespaceKinds = [
      "cgroup",
      "ipc",
      "mnt",
      "net",
      "pid",
      "user",
      "uts",
    ];
    const namespaces = Object.fromEntries(
      await Promise.all(
        namespaceKinds.map(async (kind) => [
          kind,
          await readlink(`/proc/self/ns/${kind}`),
        ]),
      ),
    );
    process.stdout.write(
      `${JSON.stringify({
        diagnostic: "CAPSULE_ATTESTED",
        result,
        noFontBytesLoaded: true,
        boundary: {
          cgroup: cgroup.trim(),
          controllers: controllers.trim().split(/\s+/u),
          cgroupMount: mountinfo
            .split("\n")
            .find(
              (line) =>
                line.includes(" /sys/fs/cgroup ") &&
                line.includes(" - cgroup2 "),
            ),
          status: status
            .split("\n")
            .filter((line) =>
              /^(Uid|Gid|Cap(Inh|Prm|Eff|Bnd|Amb)|NoNewPrivs):/u.test(line),
            ),
          cpuMax: cpuMax.trim(),
          memoryMax: memoryMax.trim(),
          memorySwapMax: memorySwapMax.trim(),
          pidsMax: pidsMax.trim(),
          environmentNames: Object.keys(process.env).sort(),
          namespaces,
          attestation: {
            uid: attestationStat.uid,
            mode: (attestationStat.mode & 0o777).toString(8),
          },
        },
      })}\n`,
    );
  } else if (mode === "admission-probe") {
    try {
      const result = await runHarness(request(control, "adversarial-font"));
      process.stdout.write(
        `${JSON.stringify({ diagnostic: result.diagnostic, noFontBytesLoaded: true })}\n`,
      );
      process.exitCode = result.diagnostic === "HARNESS_OK" ? 0 : 65;
    } catch (error) {
      process.stdout.write(
        `${JSON.stringify({ diagnostic: error?.diagnostic ?? "HARNESS_CONTROLLER_FAILED", failures: error?.details?.failures, noFontBytesLoaded: true })}\n`,
      );
      process.exitCode = 65;
    }
  } else if (mode === "hang") {
    process.stdout.write(
      `${JSON.stringify({ diagnostic: "CAPSULE_HANG_STARTED", noFontBytesLoaded: true })}\n`,
    );
    await new Promise((resolve) => setInterval(resolve, 60_000));
  } else if (mode === "controls") {
    const oversized = path.join(directory, "oversized-upload.bin");
    await writeFile(
      oversized,
      Buffer.alloc(CEILINGS.uploadTotalBytes + 1, 0x41),
    );
    let uploadDiagnostic;
    try {
      await runHarness({ ...request(), uploads: [oversized] });
    } catch (error) {
      uploadDiagnostic = error?.diagnostic;
    }
    let gpuDiagnostic;
    try {
      await runHarness({
        ...request(),
        gpu: { buffers: [CEILINGS.gpuBufferBytes + 1], textures: [] },
      });
    } catch (error) {
      gpuDiagnostic = error?.diagnostic;
    }
    const sleeper = path.join(directory, "sleep.py");
    await writeFile(sleeper, "import time\ntime.sleep(60)\n", { mode: 0o400 });
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 100);
    const cancellation = await runHarness(request(sleeper), {
      signal: controller.signal,
    });
    const escape = path.join(directory, "escape.py");
    await writeFile(
      escape,
      [
        "import os, time",
        "pid=os.fork()",
        "if pid == 0:",
        " os.setsid()",
        " with open(os.environ['CRAFTY_BENIGN_ESCAPE_PID_FILE'], 'w') as f: f.write(str(os.getpid()))",
        " time.sleep(60)",
        "else: time.sleep(0.25)",
        "",
      ].join("\n"),
      { mode: 0o400 },
    );
    const escapeResult = await runHarness(request(escape), {
      proveProcessGroupEscape: true,
    });
    assert.equal(uploadDiagnostic, "HARNESS_UPLOAD_BYTES_EXCEEDED");
    assert.equal(gpuDiagnostic, "HARNESS_GPU_BUFFER_BYTES_EXCEEDED");
    assert.equal(cancellation.diagnostic, "HARNESS_CONTROLLER_CANCELLED");
    assert.equal(
      escapeResult.diagnostic,
      "HARNESS_PROCESS_GROUP_ESCAPE_DETECTED",
    );
    assert.equal(escapeResult.knownHelpersCleaned, true);
    process.stdout.write(
      `${JSON.stringify({
        diagnostic: "CAPSULE_CONTROLS_OK",
        noFontBytesLoaded: true,
        uploadDiagnostic,
        gpuDiagnostic,
        cancellation: cancellation.diagnostic,
        escape: escapeResult.diagnostic,
      })}\n`,
    );
  } else {
    process.stderr.write("CAPSULE_MODE_REJECTED\n");
    process.exitCode = 64;
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
