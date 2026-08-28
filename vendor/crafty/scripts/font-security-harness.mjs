import { createHash } from "node:crypto";
import { constants } from "node:fs";
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

export const CEILINGS = Object.freeze({
  inputFileBytes: 1 * 1024 * 1024,
  inputTotalBytes: 4 * 1024 * 1024,
  uploadTotalBytes: 8 * 1024 * 1024,
  wallMilliseconds: 5_000,
  cpuSoftSeconds: 1,
  cpuHardSeconds: 2,
  addressSpaceBytes: 1536 * 1024 * 1024,
  monitoredRssBytes: 1024 * 1024 * 1024,
  outputBytes: 256 * 1024,
  fileSizeBytes: 16 * 1024 * 1024,
  openFiles: 128,
  gpuBufferBytes: 64 * 1024 * 1024,
  gpuBufferTotalBytes: 256 * 1024 * 1024,
  gpuTextureDimension: 4096,
  gpuTextureTotalBytes: 128 * 1024 * 1024,
  gpuAllocationCount: 1024,
  fixtureCount: 128,
  concurrency: 1,
  killGraceMilliseconds: 250,
});

const root = path.resolve(import.meta.dirname, "..");
const launcher = path.join(root, "scripts", "font-harness-limit-exec.py");
const pythonProbe = spawnSync(
  "/usr/bin/python3",
  ["-c", "import sys; print(sys.executable)"],
  { encoding: "utf8" },
);
const pythonExecutable =
  pythonProbe.status === 0 ? pythonProbe.stdout.trim() : "/usr/bin/python3";
export const HARNESS_LOCK_PATH = path.join(
  os.tmpdir(),
  `crafty-font-security-harness-${process.getuid?.() ?? "user"}.lock`,
);

export class HarnessRejection extends Error {
  constructor(diagnostic, details) {
    super(diagnostic);
    this.diagnostic = diagnostic;
    this.details = details;
  }
}

function reject(diagnostic, details) {
  throw new HarnessRejection(diagnostic, details);
}

function integer(value, diagnostic) {
  if (!Number.isSafeInteger(value) || value < 0) reject(diagnostic);
  return value;
}

async function attestOuterBoundary(request) {
  if (
    !["benign-control", "adversarial-font"].includes(request.executionClass)
  ) {
    reject("HARNESS_EXECUTION_CLASS_REQUIRED");
  }
  // A process group and sandbox-exec are not an unescapable boundary. In particular,
  // macOS has no controller-verifiable cgroup/job primitive, so adversarial bytes are
  // never admitted there.
  const attestationPath = process.env.CRAFTY_FONT_HARNESS_BOUNDARY_ATTESTATION;
  if (request.executionClass === "benign-control") return;
  if (process.platform !== "linux")
    reject("HARNESS_ADVERSARIAL_BOUNDARY_UNATTESTED");
  if (!attestationPath || !path.isAbsolute(attestationPath))
    reject("HARNESS_ADVERSARIAL_BOUNDARY_UNATTESTED");
  const metadata = await lstat(attestationPath).catch(() => undefined);
  if (
    !metadata?.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.uid !== 0 ||
    (metadata.mode & 0o777) !== 0o444
  ) {
    reject("HARNESS_ADVERSARIAL_BOUNDARY_UNATTESTED");
  }
  let attestation;
  try {
    attestation = JSON.parse(await readFile(attestationPath, "utf8"));
  } catch {
    reject("HARNESS_ADVERSARIAL_BOUNDARY_UNATTESTED");
  }
  if (
    attestation?.version !== 3 ||
    attestation?.platform !== "linux" ||
    attestation?.boundary !== "cgroup-v2" ||
    attestation?.provider !== "docker-desktop-cgroup-v2" ||
    attestation?.cgroupPath !== "/" ||
    attestation?.uid !== 65532 ||
    attestation?.gid !== 65532 ||
    !Array.isArray(attestation?.requiredControllers) ||
    !Array.isArray(attestation?.environmentNames)
  ) {
    reject("HARNESS_ADVERSARIAL_BOUNDARY_UNATTESTED");
  }
  try {
    const [
      cgroup,
      controllers,
      mountinfo,
      status,
      cpuMax,
      memoryMax,
      memorySwapMax,
      pidsMax,
      networkInterfaces,
      ipv4Routes,
      ipv6Routes,
      deviceEntries,
    ] = await Promise.all([
      readFile("/proc/self/cgroup", "utf8"),
      readFile("/sys/fs/cgroup/cgroup.controllers", "utf8"),
      readFile("/proc/self/mountinfo", "utf8"),
      readFile("/proc/self/status", "utf8"),
      readFile("/sys/fs/cgroup/cpu.max", "utf8"),
      readFile("/sys/fs/cgroup/memory.max", "utf8"),
      readFile("/sys/fs/cgroup/memory.swap.max", "utf8"),
      readFile("/sys/fs/cgroup/pids.max", "utf8"),
      readFile("/proc/net/dev", "utf8"),
      readFile("/proc/net/route", "utf8"),
      readFile("/proc/net/ipv6_route", "utf8"),
      readdir("/dev"),
    ]);
    const actualControllers = new Set(controllers.trim().split(/\s+/u));
    const statusValue = (name) =>
      status.match(new RegExp(`^${name}:\\s*(\\S+)`, "mu"))?.[1];
    const identityValues = (name) =>
      status
        .match(new RegExp(`^${name}:\\s*(.+)$`, "mu"))?.[1]
        ?.trim()
        .split(/\s+/u)
        .map(Number);
    const capabilityFields = ["CapInh", "CapPrm", "CapEff", "CapBnd", "CapAmb"];
    const environmentNames = Object.keys(process.env).sort();
    const mounts = parseMountInfo(mountinfo);
    const ipv4RouteInterfaces = ipv4Routes
      .trim()
      .split("\n")
      .slice(1)
      .map((line) => line.trim().split(/\s+/u)[0])
      .filter(Boolean);
    const ipv6RouteInterfaces = ipv6Routes
      .trim()
      .split("\n")
      .map((line) => line.trim().split(/\s+/u).at(-1))
      .filter(Boolean);
    const interfaceNames = networkInterfaces
      .trim()
      .split("\n")
      .slice(2)
      .map((line) => line.split(":", 1)[0].trim())
      .filter(Boolean)
      .sort();
    const failures = [];
    if (cgroup.trim() !== "0::/") failures.push("cgroup-path");
    if (!liveFilesystemIsolated(mounts)) failures.push("filesystem-mounts");
    if (interfaceNames.join(",") !== "lo") failures.push("network-interfaces");
    if (
      [...ipv4RouteInterfaces, ...ipv6RouteInterfaces].some(
        (name) => name !== "lo",
      )
    )
      failures.push("network-routes");
    if (deviceEntries.sort().join(",") !== ALLOWED_DEVICE_ENTRIES.join(","))
      failures.push("device-inventory");
    if (
      attestation.requiredControllers.some(
        (controller) =>
          typeof controller !== "string" || !actualControllers.has(controller),
      )
    ) {
      failures.push("cgroup-controllers");
    }
    if (
      identityValues("Uid")?.some((uid) => uid !== attestation.uid) ||
      identityValues("Gid")?.some((gid) => gid !== attestation.gid) ||
      identityValues("Uid")?.length !== 4 ||
      identityValues("Gid")?.length !== 4
    )
      failures.push("identity");
    if (statusValue("NoNewPrivs") !== "1") failures.push("no-new-privileges");
    if (
      capabilityFields.some(
        (field) => statusValue(field) !== "0000000000000000",
      )
    )
      failures.push("capabilities");
    if (
      cpuMax.trim() !== attestation.cpuMax ||
      memoryMax.trim() !== attestation.memoryMax ||
      memorySwapMax.trim() !== attestation.memorySwapMax ||
      pidsMax.trim() !== attestation.pidsMax
    )
      failures.push("cgroup-limits");
    if (
      JSON.stringify(environmentNames) !==
      JSON.stringify([...attestation.environmentNames].sort())
    )
      failures.push("environment");
    if (failures.length > 0)
      reject("HARNESS_ADVERSARIAL_LIVE_ISOLATION_MISMATCH", { failures });
  } catch (error) {
    if (error instanceof HarnessRejection) throw error;
    reject("HARNESS_ADVERSARIAL_LIVE_ISOLATION_MISMATCH");
  }
}

const ALLOWED_DEVICE_ENTRIES = [
  "core",
  "fd",
  "full",
  "mqueue",
  "null",
  "ptmx",
  "pts",
  "random",
  "shm",
  "stderr",
  "stdin",
  "stdout",
  "tty",
  "urandom",
  "zero",
].sort();

function parseSize(raw) {
  const match = /^(\d+)([kKmMgG]?)$/u.exec(raw ?? "");
  if (match === null) return undefined;
  const scale = {
    "": 1,
    k: 1024,
    K: 1024,
    m: 1024 ** 2,
    M: 1024 ** 2,
    g: 1024 ** 3,
    G: 1024 ** 3,
  }[match[2]];
  return Number(match[1]) * scale;
}

export function parseMountInfo(text) {
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const fields = line.split(" ");
      const separator = fields.indexOf("-");
      if (separator < 6) return undefined;
      return {
        root: fields[3],
        mountPoint: fields[4],
        options: new Set(fields[5].split(",")),
        fsType: fields[separator + 1],
        source: fields[separator + 2],
        superOptions: new Set((fields[separator + 3] ?? "").split(",")),
      };
    })
    .filter(Boolean);
}

export function liveFilesystemIsolated(mounts) {
  const exact = new Map([
    ["/", ["overlay", "ro"]],
    ["/proc", ["proc", "rw"]],
    ["/dev", ["tmpfs", "rw"]],
    ["/dev/pts", ["devpts", "rw"]],
    ["/sys", ["sysfs", "ro"]],
    ["/sys/fs/cgroup", ["cgroup2", "ro"]],
    ["/dev/mqueue", ["mqueue", "rw"]],
    ["/dev/shm", ["tmpfs", "rw"]],
    ["/tmp", ["tmpfs", "rw"]],
    ["/etc/resolv.conf", ["ext4", "ro"]],
    ["/etc/hostname", ["ext4", "ro"]],
    ["/etc/hosts", ["ext4", "ro"]],
    ["/proc/bus", ["proc", "ro"]],
    ["/proc/fs", ["proc", "ro"]],
    ["/proc/irq", ["proc", "ro"]],
    ["/proc/sys", ["proc", "ro"]],
    ["/proc/sysrq-trigger", ["proc", "ro"]],
    ["/proc/interrupts", ["tmpfs", "rw"]],
    ["/proc/kcore", ["tmpfs", "rw"]],
    ["/proc/keys", ["tmpfs", "rw"]],
    ["/proc/timer_list", ["tmpfs", "rw"]],
    ["/proc/scsi", ["tmpfs", "ro"]],
    ["/sys/firmware", ["tmpfs", "ro"]],
  ]);
  if (mounts.length !== exact.size) return false;
  for (const mount of mounts) {
    const expected = exact.get(mount.mountPoint);
    if (
      expected === undefined ||
      mount.fsType !== expected[0] ||
      !mount.options.has(expected[1])
    )
      return false;
    if (mount.fsType === "tmpfs") {
      const sizeOption = [...mount.superOptions].find((option) =>
        option.startsWith("size="),
      );
      const size = parseSize(sizeOption?.slice(5));
      const maximum =
        mount.mountPoint === "/tmp"
          ? 16 * 1024 * 1024
          : mount.options.has("ro")
            ? 4096
            : 64 * 1024 * 1024;
      if (size === undefined || size > maximum) return false;
    }
  }
  const temporary = mounts.find((mount) => mount.mountPoint === "/tmp");
  return (
    cgroupV2MountIsReadonly(mounts) &&
    temporary?.options.has("nosuid") === true &&
    temporary.options.has("nodev") &&
    temporary.options.has("noexec")
  );
}

export function cgroupV2MountIsReadonly(mounts) {
  const cgroup = mounts.find((mount) => mount.mountPoint === "/sys/fs/cgroup");
  return (
    cgroup?.fsType === "cgroup2" &&
    cgroup.options.has("ro") &&
    !cgroup.options.has("rw")
  );
}

function validateGpu(gpu = {}) {
  const buffers = gpu.buffers ?? [];
  const textures = gpu.textures ?? [];
  if (!Array.isArray(buffers) || !Array.isArray(textures))
    reject("HARNESS_REQUEST_INVALID");
  const derivedAllocationCount = buffers.length + textures.length;
  if (gpu.allocationCount !== undefined) {
    const declared = integer(
      gpu.allocationCount,
      "HARNESS_GPU_DECLARATION_INVALID",
    );
    if (declared < derivedAllocationCount)
      reject("HARNESS_GPU_ALLOCATION_UNDERDECLARED");
    if (declared !== derivedAllocationCount)
      reject("HARNESS_GPU_ALLOCATION_PLAN_INCONSISTENT");
  }
  if (derivedAllocationCount > CEILINGS.gpuAllocationCount)
    reject("HARNESS_GPU_ALLOCATION_COUNT_EXCEEDED");
  const bufferTotal = buffers.reduce((total, rawBytes) => {
    const bytes = integer(rawBytes, "HARNESS_GPU_DECLARATION_INVALID");
    if (bytes > CEILINGS.gpuBufferBytes)
      reject("HARNESS_GPU_BUFFER_BYTES_EXCEEDED");
    return total + bytes;
  }, 0);
  if (
    !Number.isSafeInteger(bufferTotal) ||
    bufferTotal > CEILINGS.gpuBufferTotalBytes
  ) {
    reject("HARNESS_GPU_BUFFER_TOTAL_EXCEEDED");
  }
  let textureTotal = 0;
  for (const texture of textures) {
    const width = integer(texture?.width, "HARNESS_GPU_DECLARATION_INVALID");
    const height = integer(texture?.height, "HARNESS_GPU_DECLARATION_INVALID");
    const depth = integer(
      texture?.depth ?? 1,
      "HARNESS_GPU_DECLARATION_INVALID",
    );
    const bytesPerPixel = integer(
      texture?.bytesPerPixel,
      "HARNESS_GPU_DECLARATION_INVALID",
    );
    if (Math.max(width, height, depth) > CEILINGS.gpuTextureDimension) {
      reject("HARNESS_GPU_TEXTURE_DIMENSION_EXCEEDED");
    }
    textureTotal += width * height * depth * bytesPerPixel;
    if (
      !Number.isSafeInteger(textureTotal) ||
      textureTotal > CEILINGS.gpuTextureTotalBytes
    ) {
      reject("HARNESS_GPU_TEXTURE_BYTES_EXCEEDED");
    }
  }
  return derivedAllocationCount;
}

async function validateRequest(request) {
  await attestOuterBoundary(request);
  if (request?.version !== 1 || !["native", "browser"].includes(request.mode))
    reject("HARNESS_REQUEST_INVALID");
  if (
    !Array.isArray(request.command) ||
    request.command.length === 0 ||
    request.command.some((part) => typeof part !== "string")
  ) {
    reject("HARNESS_REQUEST_INVALID");
  }
  if (!path.isAbsolute(request.command[0]))
    reject("HARNESS_EXECUTABLE_NOT_ABSOLUTE");
  const inputs = request.inputs ?? [];
  const uploads = request.uploads ?? [];
  if (
    !Array.isArray(inputs) ||
    !Array.isArray(uploads) ||
    [...inputs, ...uploads].some((file) => typeof file !== "string")
  ) {
    reject("HARNESS_REQUEST_INVALID");
  }
  // One fixture is one array entry staged for this invocation. Repeated paths count
  // repeatedly because each entry creates independently consumable candidate input.
  if (request.fixtureCount !== undefined)
    reject("HARNESS_FIXTURE_COUNT_CALLER_DECLARATION_REJECTED");
  const fixtureCount = inputs.length + uploads.length;
  if (fixtureCount > CEILINGS.fixtureCount)
    reject("HARNESS_FIXTURE_COUNT_EXCEEDED");
  validateGpu(request.gpu);
  return { inputs, uploads, fixtureCount };
}

async function acquireLock() {
  try {
    const handle = await open(
      HARNESS_LOCK_PATH,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
      0o600,
    );
    await handle.writeFile(`${process.pid}\n`);
    await handle.close();
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const owner = Number.parseInt(
      await readFile(HARNESS_LOCK_PATH, "utf8").catch(() => "0"),
      10,
    );
    try {
      process.kill(owner, 0);
      reject("HARNESS_CONCURRENCY_EXCEEDED");
    } catch (probe) {
      if (probe instanceof HarnessRejection) throw probe;
      await rm(HARNESS_LOCK_PATH, { force: true });
      return acquireLock();
    }
  }
}

function sandboxProfile(tempDirectory) {
  const escaped = tempDirectory.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return `(version 1)\n(deny default)\n(allow process*)\n(allow file-read*)\n(allow file-write* (literal "/dev/null") (subpath "${escaped}"))\n(allow sysctl-read)\n(deny network*)\n`;
}

async function stageOne(source, target, perFileCeiling, perFileDiagnostic) {
  let sourceHandle;
  let targetHandle;
  try {
    sourceHandle = await open(
      source,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    );
    const before = await sourceHandle.stat();
    if (!before.isFile()) reject("HARNESS_INPUT_TYPE_REJECTED");
    if (before.size > perFileCeiling) reject(perFileDiagnostic);
    targetHandle = await open(
      target,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
      0o400,
    );
    const hash = createHash("sha256");
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let copied = 0;
    for (;;) {
      const { bytesRead } = await sourceHandle.read(
        buffer,
        0,
        buffer.length,
        copied,
      );
      if (bytesRead === 0) break;
      copied += bytesRead;
      if (copied > perFileCeiling || copied > before.size)
        reject("HARNESS_STAGED_INPUT_CHANGED");
      hash.update(buffer.subarray(0, bytesRead));
      await targetHandle.write(buffer, 0, bytesRead, copied - bytesRead);
    }
    await targetHandle.sync();
    const after = await sourceHandle.stat();
    if (
      copied !== before.size ||
      after.size !== before.size ||
      after.dev !== before.dev ||
      after.ino !== before.ino ||
      after.mtimeNs !== before.mtimeNs ||
      after.ctimeNs !== before.ctimeNs
    )
      reject("HARNESS_STAGED_INPUT_CHANGED");
    return { target, size: copied, sha256: hash.digest("hex") };
  } catch (error) {
    if (error?.code === "ELOOP") reject("HARNESS_INPUT_TYPE_REJECTED");
    throw error;
  } finally {
    await targetHandle?.close().catch(() => {});
    await sourceHandle?.close().catch(() => {});
  }
}

async function stageFiles(
  files,
  destination,
  prefix,
  perFileCeiling,
  perFileDiagnostic,
  totalCeiling,
  totalDiagnostic,
) {
  const staged = [];
  let total = 0;
  for (const [index, source] of files.entries()) {
    const entry = await stageOne(
      source,
      path.join(destination, `${prefix}-${index}`),
      perFileCeiling,
      perFileDiagnostic,
    );
    total += entry.size;
    if (!Number.isSafeInteger(total) || total > totalCeiling)
      reject(totalDiagnostic);
    staged.push(entry);
  }
  return staged;
}

async function revalidateStaged(entries, totalCeiling, totalDiagnostic) {
  let total = 0;
  for (const entry of entries) {
    const metadata = await lstat(entry.target);
    if (!metadata.isFile() || metadata.isSymbolicLink())
      reject("HARNESS_STAGED_INPUT_CHANGED");
    if (metadata.size !== entry.size) reject("HARNESS_STAGED_INPUT_CHANGED");
    const bytes = await readFile(entry.target);
    if (
      bytes.byteLength !== entry.size ||
      createHash("sha256").update(bytes).digest("hex") !== entry.sha256
    ) {
      reject("HARNESS_STAGED_INPUT_CHANGED");
    }
    total += bytes.byteLength;
    if (total > totalCeiling) reject(totalDiagnostic);
  }
  return total;
}

function substituteArguments(command, inputs, uploads) {
  return command.map((argument) =>
    argument.replaceAll(
      /\{(input|upload):(\d+)\}/gu,
      (_match, kind, rawIndex) => {
        const selected = (kind === "input" ? inputs : uploads)[
          Number.parseInt(rawIndex, 10)
        ];
        if (selected === undefined) reject("HARNESS_ARGUMENT_TOKEN_INVALID");
        return selected.target;
      },
    ),
  );
}

function signalPid(pid, signal) {
  try {
    process.kill(pid, signal);
    return true;
  } catch (error) {
    if (error?.code === "ESRCH") return false;
    throw error;
  }
}

function signalGroup(pid, signal) {
  try {
    process.kill(-pid, signal);
    return true;
  } catch (error) {
    if (error?.code === "ESRCH") return false;
    throw error;
  }
}

async function execute(
  command,
  environment,
  tempDirectory,
  signal,
  knownEscapeRegistry,
  revalidate,
) {
  const limitConfig = JSON.stringify({
    cpuSoftSeconds: CEILINGS.cpuSoftSeconds,
    cpuHardSeconds: CEILINGS.cpuHardSeconds,
    addressSpaceBytes: CEILINGS.addressSpaceBytes,
    enforceAddressSpace: process.platform === "linux",
    fileSizeBytes: CEILINGS.fileSizeBytes,
    openFiles: CEILINGS.openFiles,
  });
  const profile = path.join(tempDirectory, "sandbox.sb");
  await writeFile(profile, sandboxProfile(tempDirectory), { mode: 0o600 });
  // Chromium's Mach services are incompatible with this deprecated profile.
  // Browser controls on macOS are benign-only and deliberately make no host
  // containment claim; adversarial browser execution is rejected at admission.
  const useMacSandbox =
    process.platform === "darwin" &&
    !command.some((part) => part.startsWith("--user-data-dir="));
  const boundedCommand = useMacSandbox
    ? ["/usr/bin/sandbox-exec", "-f", profile, ...command]
    : command;
  // Keep this as the final asynchronous operation before spawn. The candidate
  // never receives the original caller path, only this freshly verified copy.
  await revalidate();
  const child = spawn(
    pythonExecutable,
    [launcher, limitConfig, ...boundedCommand],
    {
      cwd: tempDirectory,
      detached: true,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let outputBytes = 0;
  let diagnostic;
  let peakRssBytes = 0;
  const chunks = [];
  let terminationStarted = false;
  const terminate = (reason) => {
    diagnostic ??= reason;
    if (!terminationStarted) {
      terminationStarted = true;
      signalGroup(child.pid, "SIGTERM");
    }
  };
  const consume = (chunk) => {
    outputBytes += chunk.byteLength;
    if (outputBytes <= CEILINGS.outputBytes) chunks.push(chunk);
    else terminate("HARNESS_OUTPUT_BYTES_EXCEEDED");
  };
  child.stdout.on("data", consume);
  child.stderr.on("data", consume);
  const timer = setTimeout(
    () => terminate("HARNESS_WALL_TIME_EXCEEDED"),
    CEILINGS.wallMilliseconds,
  );
  const rssTimer = setInterval(() => {
    const sample = spawnSync("/bin/ps", ["-axo", "pgid=,rss="], {
      encoding: "utf8",
    });
    if (sample.status !== 0) return;
    const rssBytes = sample.stdout
      .trim()
      .split("\n")
      .reduce((total, line) => {
        const [rawPgid, rawRss] = line.trim().split(/\s+/u);
        return Number.parseInt(rawPgid, 10) === child.pid
          ? total + Number.parseInt(rawRss, 10) * 1024
          : total;
      }, 0);
    if (!Number.isFinite(rssBytes)) return;
    peakRssBytes = Math.max(peakRssBytes, rssBytes);
    if (rssBytes > CEILINGS.monitoredRssBytes)
      terminate("HARNESS_RSS_SAMPLED_EXCEEDED");
  }, 100);
  const abort = () => terminate("HARNESS_CONTROLLER_CANCELLED");
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  const outcome = await new Promise((resolve, rejectPromise) => {
    child.once("error", rejectPromise);
    child.once("exit", (code, exitSignal) =>
      resolve({ code, signal: exitSignal }),
    );
  });
  clearTimeout(timer);
  clearInterval(rssTimer);
  signal?.removeEventListener("abort", abort);
  signalGroup(child.pid, "SIGTERM");
  await new Promise((resolve) =>
    setTimeout(resolve, CEILINGS.killGraceMilliseconds),
  );
  signalGroup(child.pid, "SIGKILL");
  let groupAlive = signalGroup(child.pid, 0);
  let escapedPid;
  let knownEscapeAlive = false;
  if (knownEscapeRegistry !== undefined) {
    escapedPid = Number.parseInt(
      await readFile(knownEscapeRegistry, "utf8").catch(() => ""),
      10,
    );
    if (Number.isSafeInteger(escapedPid) && escapedPid > 1) {
      // This is cleanup of a benign, controller-instrumented proof only. It is not
      // evidence that unknown adversarial escapees can be enumerated or contained.
      signalPid(escapedPid, "SIGTERM");
      await new Promise((resolve) =>
        setTimeout(resolve, CEILINGS.killGraceMilliseconds),
      );
      signalPid(escapedPid, "SIGKILL");
      await new Promise((resolve) =>
        setTimeout(resolve, CEILINGS.killGraceMilliseconds),
      );
      knownEscapeAlive = signalPid(escapedPid, 0);
      diagnostic = "HARNESS_PROCESS_GROUP_ESCAPE_DETECTED";
    }
  }
  groupAlive = signalGroup(child.pid, 0);
  if (groupAlive || knownEscapeAlive) diagnostic = "HARNESS_CLEANUP_FAILED";
  else if (diagnostic === undefined && outcome.signal === "SIGXCPU")
    diagnostic = "HARNESS_CPU_TIME_EXCEEDED";
  else if (diagnostic === undefined && outcome.signal === "SIGXFSZ")
    diagnostic = "HARNESS_FILE_SIZE_EXCEEDED";
  else if (diagnostic === undefined && outcome.code !== 0)
    diagnostic = "HARNESS_CHILD_EXIT_NONZERO";
  else diagnostic ??= "HARNESS_OK";
  return {
    diagnostic,
    exitCode: outcome.code,
    signal: outcome.signal,
    outputBytes,
    output: Buffer.concat(chunks).toString("utf8"),
    peakRssBytes,
    processGroupCleaned: !groupAlive,
    knownHelpersCleaned: !groupAlive && !knownEscapeAlive,
    escapedCleanupGuaranteed: escapedPid === undefined ? null : false,
  };
}

export async function runHarness(request, options = {}) {
  const admitted = await validateRequest(request);
  await acquireLock();
  let tempDirectory;
  let cleaned = false;
  const cleanup = async () => {
    if (cleaned) return;
    cleaned = true;
    if (tempDirectory !== undefined)
      await rm(tempDirectory, { recursive: true, force: true });
    await rm(HARNESS_LOCK_PATH, { force: true });
  };
  try {
    tempDirectory = await realpath(
      await mkdtemp(path.join(os.tmpdir(), "crafty-font-harness-")),
    );
    const inputs = await stageFiles(
      admitted.inputs,
      tempDirectory,
      "input",
      CEILINGS.inputFileBytes,
      "HARNESS_INPUT_BYTES_EXCEEDED",
      CEILINGS.inputTotalBytes,
      "HARNESS_INPUT_TOTAL_BYTES_EXCEEDED",
    );
    const uploads = await stageFiles(
      admitted.uploads,
      tempDirectory,
      "upload",
      CEILINGS.uploadTotalBytes,
      "HARNESS_UPLOAD_BYTES_EXCEEDED",
      CEILINGS.uploadTotalBytes,
      "HARNESS_UPLOAD_BYTES_EXCEEDED",
    );
    await options.beforeLaunch?.({
      tempDirectory,
      inputs: inputs.map((entry) => entry.target),
      uploads: uploads.map((entry) => entry.target),
    });
    const command = substituteArguments(request.command, inputs, uploads);
    if (request.mode === "browser") {
      command.push(
        `--user-data-dir=${path.join(tempDirectory, "browser-profile")}`,
        "--no-first-run",
        "--disable-background-networking",
        "--disable-component-update",
      );
    }
    await mkdir(path.join(tempDirectory, "home"), { recursive: true });
    await mkdir(path.join(tempDirectory, "tmp"), { recursive: true });
    const knownEscapeRegistry = options.proveProcessGroupEscape
      ? path.join(tempDirectory, "known-escape.pid")
      : undefined;
    const environment = {
      HOME: path.join(tempDirectory, "home"),
      TMPDIR: path.join(tempDirectory, "tmp"),
      PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
      LANG: "C.UTF-8",
      ...(knownEscapeRegistry === undefined
        ? {}
        : { CRAFTY_BENIGN_ESCAPE_PID_FILE: knownEscapeRegistry }),
    };
    return await execute(
      command,
      environment,
      tempDirectory,
      options.signal,
      knownEscapeRegistry,
      async () => {
        await revalidateStaged(
          inputs,
          CEILINGS.inputTotalBytes,
          "HARNESS_INPUT_TOTAL_BYTES_EXCEEDED",
        );
        await revalidateStaged(
          uploads,
          CEILINGS.uploadTotalBytes,
          "HARNESS_UPLOAD_BYTES_EXCEEDED",
        );
      },
    );
  } finally {
    await cleanup();
  }
}

async function main() {
  const controller = new AbortController();
  let interruptedSignal;
  const interrupt = (signal) => {
    interruptedSignal ??= signal;
    controller.abort();
  };
  const onSigint = () => interrupt("SIGINT");
  const onSigterm = () => interrupt("SIGTERM");
  process.on("SIGINT", onSigint);
  process.on("SIGTERM", onSigterm);
  try {
    const requestPath = process.argv[2];
    if (requestPath === undefined) reject("HARNESS_REQUEST_MISSING");
    const request = JSON.parse(await readFile(requestPath, "utf8"));
    const result = await runHarness(request, { signal: controller.signal });
    process.stdout.write(`${JSON.stringify({ ceilings: CEILINGS, result })}\n`);
    process.exitCode =
      interruptedSignal === "SIGINT"
        ? 130
        : interruptedSignal === "SIGTERM"
          ? 143
          : result.diagnostic === "HARNESS_OK"
            ? 0
            : 2;
  } catch (error) {
    const diagnostic =
      error instanceof HarnessRejection
        ? error.diagnostic
        : "HARNESS_CONTROLLER_FAILED";
    process.stdout.write(
      `${JSON.stringify({ ceilings: CEILINGS, result: { diagnostic } })}\n`,
    );
    process.exitCode =
      interruptedSignal === "SIGINT"
        ? 130
        : interruptedSignal === "SIGTERM"
          ? 143
          : 2;
  } finally {
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
  }
}

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename)
)
  await main();
