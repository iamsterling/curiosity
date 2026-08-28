import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const capsule = path.join(root, "scripts", "font-harness-capsule");
const evidence = path.join(
  root,
  "openspec",
  "changes",
  "dynamic-text-capability",
  "evidence",
);
const pythonSourceImageId =
  "sha256:655d35e6c06b6a1ac5ada097eec6b69df545d4bbc5f3135874cf351f20c4a03b";
const pythonSourceTag = "crafty-font-harness-python-source:655d35e6";
const runtimeImageId =
  "sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2";
const runtimeTag = "crafty-font-harness-runtime:16e22a55";
const tag = "crafty-font-harness-capsule:local";
const outputLimit = 256 * 1024;

function docker(args, options = {}) {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
    ...options,
  });
  if (result.status !== 0 && !options.allowFailure)
    throw new Error(`DOCKER_COMMAND_FAILED:${args[0]}:${result.stderr.trim()}`);
  return result;
}

async function buildCapsule() {
  for (const [imageId, imageTag] of [
    [pythonSourceImageId, pythonSourceTag],
    [runtimeImageId, runtimeTag],
  ]) {
    assert.equal(
      docker([
        "image",
        "inspect",
        imageId,
        "--format",
        "{{.Id}}",
      ]).stdout.trim(),
      imageId,
    );
    docker(["tag", imageId, imageTag]);
    assert.equal(
      docker([
        "image",
        "inspect",
        imageTag,
        "--format",
        "{{.Id}}",
      ]).stdout.trim(),
      imageId,
    );
  }
  for (const file of [
    "font-security-harness.mjs",
    "font-harness-limit-exec.py",
  ]) {
    await copyFile(path.join(root, "scripts", file), path.join(capsule, file));
  }
  docker(["build", "--pull=false", "--network=none", "--tag", tag, capsule]);
  const imageId = docker([
    "image",
    "inspect",
    tag,
    "--format",
    "{{.Id}}",
  ]).stdout.trim();
  const lock = {
    version: 1,
    runtimeImageId,
    pythonSourceImageId,
    capsuleImageId: imageId,
    tag,
  };
  await writeFile(
    path.join(capsule, "capsule.lock.json"),
    `${JSON.stringify(lock, null, 2)}\n`,
  );
  return lock;
}

export function createArgs(name, imageId, mode, variation = {}) {
  const args = [
    "create",
    "--pull=never",
    "--name",
    name,
    "--label",
    "crafty.font-harness=true",
    "--init",
    "--user",
    "65532:65532",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges:true",
    `--network=${variation.network ?? "none"}`,
  ];
  if (variation.writableRoot !== true) args.push("--read-only");
  args.push(
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,nodev,size=16m,mode=1777",
    "--cgroupns=private",
    "--pids-limit=32",
    "--memory=256m",
    "--memory-swap=256m",
    "--cpus=0.5",
    "--ulimit",
    "nofile=128:128",
    "--ulimit",
    "fsize=16777216:16777216",
    ...(variation.extraArgs ?? []),
    imageId,
    mode,
  );
  return args;
}

function verifyAbsent(containerId) {
  const inspection = docker(["inspect", containerId], { allowFailure: true });
  if (inspection.status === 0)
    throw new Error(`WATCHDOG_CONTAINER_STILL_PRESENT:${containerId}`);
  return true;
}

export function removeAndVerify(containerId, runDocker = docker) {
  const removal = runDocker(["rm", "--force", containerId]);
  if (removal?.status !== undefined && removal.status !== 0)
    throw new Error(`WATCHDOG_REMOVE_FAILED:${containerId}`);
  const inspection = runDocker(["inspect", containerId], {
    allowFailure: true,
  });
  if (inspection.status === 0)
    throw new Error(`WATCHDOG_CONTAINER_STILL_PRESENT:${containerId}`);
  return { attempted: true, commandSucceeded: true, absent: true };
}

function verifyOuter(inspected, imageId) {
  assert.equal(inspected.Image, imageId);
  assert.equal(inspected.Config.User, "65532:65532");
  assert.equal(inspected.HostConfig.NetworkMode, "none");
  assert.equal(inspected.HostConfig.ReadonlyRootfs, true);
  assert.equal(inspected.HostConfig.CgroupnsMode, "private");
  assert.equal(inspected.HostConfig.Init, true);
  assert.deepEqual(inspected.HostConfig.CapDrop, ["ALL"]);
  assert.ok(
    inspected.HostConfig.SecurityOpt.includes("no-new-privileges:true"),
  );
  assert.equal(inspected.HostConfig.PidsLimit, 32);
  assert.equal(inspected.HostConfig.Memory, 268435456);
  assert.equal(inspected.HostConfig.MemorySwap, 268435456);
  assert.equal(inspected.HostConfig.NanoCpus, 500000000);
  assert.deepEqual(inspected.HostConfig.Binds ?? [], []);
  assert.equal(inspected.HostConfig.Privileged, false);
  assert.deepEqual(inspected.HostConfig.Devices ?? [], []);
  assert.deepEqual(inspected.HostConfig.VolumesFrom ?? [], []);
  assert.equal(inspected.Mounts?.length ?? 0, 0);
}

export async function runWatched(imageId, mode, options = {}) {
  const timeoutMilliseconds = options.timeoutMilliseconds ?? 10_000;
  const name = `crafty-font-${randomBytes(8).toString("hex")}`;
  const containerId = docker(
    createArgs(name, imageId, mode, options.variation),
  ).stdout.trim();
  let removalReason = "normal-exit";
  let timeout;
  let interrupted;
  let removalEvidence;
  let cleanupError;
  let primaryError;
  let result;
  let wait;
  let rejectAbnormal;
  const cleanup = () => {
    if (removalEvidence !== undefined || cleanupError !== undefined) return;
    try {
      removalEvidence = removeAndVerify(containerId);
    } catch (error) {
      cleanupError = error;
    }
  };
  const onSignal = (signal) => {
    interrupted ??= signal;
    removalReason = `signal:${signal}`;
    cleanup();
    rejectAbnormal?.(new Error(`WATCHDOG_INTERRUPTED:${signal}`));
  };
  const onSigint = () => onSignal("SIGINT");
  const onSigterm = () => onSignal("SIGTERM");
  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigterm);
  try {
    const inspected = JSON.parse(docker(["inspect", containerId]).stdout)[0];
    if (options.verifyOuter !== false) verifyOuter(inspected, imageId);
    docker(["start", containerId]);
    options.onStarted?.({ containerId });
    wait = spawn("docker", ["wait", containerId], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const waitOutcome = new Promise((resolve, reject) => {
      wait.once("error", reject);
      wait.once("exit", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`WATCHDOG_WAIT_FAILED:${code}`)),
      );
    });
    const abnormalOutcome = new Promise((_resolve, reject) => {
      rejectAbnormal = reject;
    });
    timeout = setTimeout(() => {
      removalReason = "timeout";
      cleanup();
      rejectAbnormal?.(new Error("WATCHDOG_TIMEOUT"));
    }, timeoutMilliseconds);
    await Promise.race([waitOutcome, abnormalOutcome]);
    const exitCode = JSON.parse(
      docker(["inspect", containerId, "--format", "{{json .State.ExitCode}}"])
        .stdout,
    );
    const logs = docker(["logs", containerId], { allowFailure: true });
    const bytes =
      Buffer.byteLength(logs.stdout) + Buffer.byteLength(logs.stderr);
    if (bytes > outputLimit) throw new Error("WATCHDOG_OUTPUT_EXCEEDED");
    const expectedExitCode = options.expectedExitCode ?? 0;
    if (exitCode !== expectedExitCode)
      throw new Error(
        `WATCHDOG_CONTAINER_NONZERO:${exitCode}:${logs.stderr.trim()}`,
      );
    result = {
      containerId,
      imageId,
      removalReason,
      stdout: logs.stdout.trim(),
      stderr: logs.stderr.trim(),
      inspected,
      exitCode,
    };
  } catch (error) {
    primaryError = error;
  } finally {
    clearTimeout(timeout);
    wait?.kill("SIGKILL");
    cleanup();
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
  }
  const cleanupProof = {
    containerId,
    removalReason,
    ...(removalEvidence ?? {
      attempted: true,
      commandSucceeded: false,
      absent: false,
    }),
  };
  if (cleanupError !== undefined) {
    const combined =
      primaryError === undefined
        ? cleanupError
        : new AggregateError(
            [primaryError, cleanupError],
            `WATCHDOG_PRIMARY_AND_CLEANUP_FAILED:${primaryError.message}:${cleanupError.message}`,
          );
    combined.watchdogEvidence = cleanupProof;
    throw combined;
  }
  verifyAbsent(containerId);
  if (primaryError !== undefined) {
    primaryError.watchdogEvidence = cleanupProof;
    throw primaryError;
  }
  return { ...result, cleanup: cleanupProof };
}

function isolationSummary(result) {
  return {
    user: result.inspected.Config.User,
    networkMode: result.inspected.HostConfig.NetworkMode,
    readonlyRootfs: result.inspected.HostConfig.ReadonlyRootfs,
    cgroupnsMode: result.inspected.HostConfig.CgroupnsMode,
    capDrop: result.inspected.HostConfig.CapDrop,
    securityOpt: result.inspected.HostConfig.SecurityOpt,
    init: result.inspected.HostConfig.Init,
    pidsLimit: result.inspected.HostConfig.PidsLimit,
    memory: result.inspected.HostConfig.Memory,
    memorySwap: result.inspected.HostConfig.MemorySwap,
    nanoCpus: result.inspected.HostConfig.NanoCpus,
    tmpfs: result.inspected.HostConfig.Tmpfs,
    binds: result.inspected.HostConfig.Binds,
    devices: result.inspected.HostConfig.Devices,
    mounts: result.inspected.Mounts,
  };
}

async function negativeMatrix(imageId) {
  const hostDirectory = await mkdtemp(
    path.join(os.tmpdir(), "crafty-font-bind-control-"),
  );
  const cases = [
    ["bridge-network", { network: "bridge" }, "network-routes"],
    ["writable-root", { writableRoot: true }, "filesystem-mounts"],
    [
      "extra-tmpfs",
      {
        extraArgs: [
          "--tmpfs",
          "/unapproved-tmpfs:rw,noexec,nosuid,nodev,size=1m",
        ],
      },
      "filesystem-mounts",
    ],
    [
      "extra-bind",
      {
        extraArgs: [
          "--mount",
          `type=bind,src=${hostDirectory},dst=/unapproved-bind,readonly`,
        ],
      },
      "filesystem-mounts",
    ],
    [
      "extra-device",
      { extraArgs: ["--device", "/dev/zero:/dev/crafty-extra:r"] },
      "device-inventory",
    ],
  ];
  const results = [];
  try {
    for (const [name, variation, requiredFailure] of cases) {
      const result = await runWatched(imageId, "admission-probe", {
        variation,
        verifyOuter: false,
        expectedExitCode: 65,
      });
      const response = JSON.parse(result.stdout.split("\n").at(-1));
      assert.equal(
        response.diagnostic,
        "HARNESS_ADVERSARIAL_LIVE_ISOLATION_MISMATCH",
      );
      assert.ok(
        response.failures.includes(requiredFailure),
        `${name} did not independently trigger ${requiredFailure}`,
      );
      results.push({
        name,
        diagnostic: response.diagnostic,
        failures: response.failures,
        containerId: result.containerId,
        cleanup: result.cleanup,
      });
    }
  } finally {
    await rm(hostDirectory, { recursive: true, force: true });
  }
  return results;
}

async function abnormalCleanup(imageId, scenario) {
  try {
    if (scenario === "timeout")
      await runWatched(imageId, "hang", { timeoutMilliseconds: 250 });
    else if (["SIGINT", "SIGTERM"].includes(scenario)) {
      await runWatched(imageId, "hang", {
        onStarted: () =>
          setTimeout(() => process.kill(process.pid, scenario), 100),
      });
    } else if (scenario === "error") await runWatched(imageId, "unknown-mode");
    else throw new Error(`WATCHDOG_SCENARIO_UNKNOWN:${scenario}`);
    throw new Error(`WATCHDOG_SCENARIO_DID_NOT_FAIL:${scenario}`);
  } catch (error) {
    assert.equal(error.watchdogEvidence?.absent, true);
    return {
      scenario,
      diagnostic: error.message,
      cleanup: error.watchdogEvidence,
    };
  }
}

async function loadLock() {
  const lock = JSON.parse(
    await readFile(path.join(capsule, "capsule.lock.json"), "utf8"),
  );
  assert.equal(
    docker([
      "image",
      "inspect",
      lock.capsuleImageId,
      "--format",
      "{{.Id}}",
    ]).stdout.trim(),
    lock.capsuleImageId,
  );
  return lock;
}

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename)
) {
  const command = process.argv[2] ?? "self-test";
  if (command === "build") {
    await mkdir(evidence, { recursive: true });
    process.stdout.write(`${JSON.stringify(await buildCapsule())}\n`);
  } else {
    const lock = await loadLock();
    if (command === "negative-matrix") {
      process.stdout.write(
        `${JSON.stringify({ diagnostic: "LIVE_ISOLATION_NEGATIVE_MATRIX_OK", noFontBytesLoaded: true, lock, results: await negativeMatrix(lock.capsuleImageId) }, null, 2)}\n`,
      );
    } else if (command === "watchdog-test") {
      const scenario = process.argv[3] ?? "timeout";
      process.stdout.write(
        `${JSON.stringify({ diagnostic: "WATCHDOG_ABNORMAL_CLEANUP_OK", noFontBytesLoaded: true, lock, result: await abnormalCleanup(lock.capsuleImageId, scenario) }, null, 2)}\n`,
      );
    } else {
      const modes =
        command === "self-test"
          ? ["attest", "controller-loss", "controls"]
          : [command];
      const results = [];
      for (const mode of modes) {
        const result = await runWatched(lock.capsuleImageId, mode);
        results.push({
          mode,
          containerId: result.containerId,
          imageId: result.imageId,
          removalReason: result.removalReason,
          stdout: result.stdout,
          cleanup: result.cleanup,
          isolation: isolationSummary(result),
        });
      }
      const report = {
        diagnostic: "DOCKER_PROVIDER_SELF_TEST_OK",
        noFontBytesLoaded: true,
        lock,
        results,
      };
      const rendered = `${JSON.stringify(report, null, 2)}\n`;
      if (command === "self-test") {
        await writeFile(
          path.join(evidence, "3.1-docker-provider-self-test.json"),
          rendered,
        );
      }
      process.stdout.write(rendered);
    }
  }
}
