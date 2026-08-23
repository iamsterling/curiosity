import { createHash } from "node:crypto"
import { spawn } from "node:child_process"
import path from "node:path"

import { createManagedServiceProcessTracker, terminateTrackedServiceProcesses } from "./managed-service-cleanup.mjs"
import { EXPECTED_README_PLUGIN_IDS } from "./validation-contract.mjs"

const EXACT_EMPTY_INVENTORY = "No plugins loaded\n"
const EXPECTED_INVENTORY = `${EXPECTED_README_PLUGIN_IDS.join("\n")}\n`
const EXPECTED_INVENTORY_IDS = new Set(EXPECTED_README_PLUGIN_IDS)
const PRODUCT_PLUGIN_ID = "iamsterling.opencode2-config"
const MAX_CAPTURE_BYTES = 8_192
const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_RETRY_INTERVAL_MS = 100
const CLEANUP_TIMEOUT_MS = 5_000
const PROCESS_OBSERVE_INTERVAL_MS = 25

const failure = (code, detail) => {
  const error = new Error(`${code}${detail === undefined ? "" : `:${JSON.stringify(detail)}`}`)
  error.code = code
  return error
}

const outputSummary = (value) => ({
  bytes: Buffer.byteLength(value),
  sha256: createHash("sha256").update(value).digest("hex"),
})

const resultDetail = (result, attempt) => ({
  attempt,
  code: result.code,
  signal: result.signal,
  stderr: outputSummary(result.stderr),
  stdout: outputSummary(result.stdout),
  ...(result.outputOverflow ? { outputOverflow: true } : {}),
  ...(result.timedOut ? { timedOut: true } : {}),
})

const inventoryDetail = (value) => {
  if (!value.endsWith("\n")) return undefined
  const ids = value.slice(0, -1).split("\n")
  return ids.length > 0 && new Set(ids).size === ids.length && ids.every((id) => /^[a-z0-9][a-z0-9._-]*$/u.test(id)) ? ids : undefined
}

const coldBuiltInInventory = (value) => {
  const ids = inventoryDetail(value)
  return ids !== undefined && !ids.includes(PRODUCT_PLUGIN_ID) && ids.every((id) => EXPECTED_INVENTORY_IDS.has(id))
}

const attemptEvidence = (result, attempt, outcome) => ({
  attempt,
  code: result.code,
  outcome,
  signal: result.signal,
  stderrBytes: Buffer.byteLength(result.stderr),
  stdoutBytes: Buffer.byteLength(result.stdout),
})

const validateArguments = ({ argv, cwd, env, retryIntervalMs, timeoutMs }) => {
  if (JSON.stringify(argv) !== JSON.stringify(["opencode2", "plugin", "list"])) {
    throw failure("OPENCODE2_README_VERIFICATION_ARGV_INVALID")
  }
  if (typeof cwd !== "string" || !path.isAbsolute(cwd) || typeof env !== "object" || env === null) {
    throw failure("OPENCODE2_README_VERIFICATION_CONTEXT_INVALID")
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || !Number.isSafeInteger(retryIntervalMs) || retryIntervalMs < 1) {
    throw failure("OPENCODE2_README_VERIFICATION_BOUND_INVALID")
  }
}

const verifyReadmePluginList = async ({
  argv,
  cwd,
  env,
  execute,
  now,
  retryIntervalMs,
  sleep,
  timeoutMs,
}) => {
  validateArguments({ argv, cwd, env, retryIntervalMs, timeoutMs })
  const started = now()
  const deadline = started + timeoutMs
  const maximumAttempts = Math.ceil(timeoutMs / retryIntervalMs) + 1
  const attempts = []
  const timeout = () => {
    throw failure("OPENCODE2_README_VERIFICATION_TIMEOUT", {
      attempts: attempts.length,
      elapsedMs: Math.min(timeoutMs, Math.max(0, now() - started)),
    })
  }

  while (attempts.length < maximumAttempts) {
    if (attempts.length > 0 && now() >= deadline) timeout()
    let result
    try {
      result = await execute({ argv, cwd, env, timeoutMs: Math.max(1, deadline - now()) })
    } catch (error) {
      throw failure("OPENCODE2_README_VERIFICATION_SPAWN_FAILED", {
        attempt: attempts.length + 1,
        causeCode: typeof error?.code === "string" ? error.code : "UNKNOWN",
      })
    }
    const attempt = attempts.length + 1
    if (!result || typeof result.stdout !== "string" || typeof result.stderr !== "string") {
      throw failure("OPENCODE2_README_VERIFICATION_RESULT_INVALID", { attempt })
    }
    if (result.code !== 0 || result.signal !== null || result.timedOut || result.outputOverflow) {
      attempts.push(attemptEvidence(result, attempt, "command-failed"))
      throw failure("OPENCODE2_README_VERIFICATION_COMMAND_FAILED", resultDetail(result, attempt))
    }
    if (result.stderr !== "") {
      attempts.push(attemptEvidence(result, attempt, "stderr"))
      throw failure("OPENCODE2_README_VERIFICATION_STDERR", resultDetail(result, attempt))
    }
    if (result.stdout === EXPECTED_INVENTORY) {
      attempts.push(attemptEvidence(result, attempt, "expected-inventory"))
      return {
        attempts,
        elapsedMs: Math.min(timeoutMs, Math.max(0, now() - started)),
        inventory: [...EXPECTED_README_PLUGIN_IDS],
      }
    }
    if (result.stdout !== EXACT_EMPTY_INVENTORY && !coldBuiltInInventory(result.stdout)) {
      attempts.push(attemptEvidence(result, attempt, "inventory-mismatch"))
      throw failure("OPENCODE2_README_VERIFICATION_INVENTORY_MISMATCH", {
        ...resultDetail(result, attempt),
        actualInventory: inventoryDetail(result.stdout),
      })
    }
    attempts.push(attemptEvidence(result, attempt, result.stdout === EXACT_EMPTY_INVENTORY ? "cold-empty" : "cold-builtins"))
    const remaining = deadline - now()
    if (remaining <= 0 || attempts.length >= maximumAttempts) timeout()
    await sleep(Math.min(retryIntervalMs, remaining))
  }
  timeout()
}

const appendBounded = (state, chunk, terminate) => {
  const value = Buffer.from(chunk)
  const available = Math.max(0, MAX_CAPTURE_BYTES - state.bytes)
  if (available > 0) state.chunks.push(value.subarray(0, available))
  state.bytes += value.length
  if (state.bytes > MAX_CAPTURE_BYTES) {
    state.overflow = true
    terminate()
  }
}

const terminateCommand = (child) => {
  if (!Number.isSafeInteger(child.pid)) return
  try {
    process.kill(-child.pid, "SIGKILL")
  } catch (error) {
    if (error.code !== "ESRCH") child.kill("SIGKILL")
  }
}

export const captureReadmeVerificationCommand = ({ argv, cwd, env, processTracker, timeoutMs }) => new Promise((resolve, reject) => {
  const child = spawn(argv[0], argv.slice(1), { cwd, detached: true, env, stdio: ["ignore", "pipe", "pipe"] })
  const stdout = { bytes: 0, chunks: [], overflow: false }
  const stderr = { bytes: 0, chunks: [], overflow: false }
  let timedOut = false
  let settled = false
  let observation = Promise.resolve()
  const observe = () => {
    if (!processTracker) return
    observation = observation.then(() => processTracker.observe(child.pid)).catch((error) => processTracker.recordObservationError?.(error))
  }
  observe()
  const observer = setInterval(observe, PROCESS_OBSERVE_INTERVAL_MS)
  const timer = setTimeout(() => {
    timedOut = true
    terminateCommand(child)
  }, timeoutMs)
  const finish = async (operation, value) => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    clearInterval(observer)
    observe()
    await observation
    operation(value)
  }
  child.stdout.on("data", (chunk) => appendBounded(stdout, chunk, () => terminateCommand(child)))
  child.stderr.on("data", (chunk) => appendBounded(stderr, chunk, () => terminateCommand(child)))
  child.once("error", (error) => void finish(reject, error))
  child.once("close", (code, signal) => void finish(resolve, {
      code,
      signal,
      stderr: Buffer.concat(stderr.chunks).toString("utf8"),
      stdout: Buffer.concat(stdout.chunks).toString("utf8"),
      outputOverflow: stdout.overflow || stderr.overflow,
      timedOut,
    }))
})

export const cleanupReadmeVerificationService = async ({ argv, cwd, env, processTracker }) => {
  const command = [argv[0], "service", "stop"]
  let result
  let stopSpawnCode
  if (processTracker.baselineRegistrationPid === undefined) {
    try {
      result = await captureReadmeVerificationCommand({ argv: command, cwd, env, timeoutMs: CLEANUP_TIMEOUT_MS })
    } catch (error) {
      stopSpawnCode = typeof error?.code === "string" ? error.code : "UNKNOWN"
    }
  }
  const terminated = await terminateTrackedServiceProcesses(processTracker)
  const normalStop = processTracker.baselineRegistrationPid !== undefined
    ? { skippedBaseline: true, succeeded: false }
    : result === undefined
    ? { spawnCode: stopSpawnCode, succeeded: false }
    : {
        code: result.code,
        signal: result.signal,
        stderr: outputSummary(result.stderr),
        stdout: outputSummary(result.stdout),
        succeeded: result.code === 0 && result.signal === null && result.stderr === "" && !result.timedOut && !result.outputOverflow,
        ...(result.outputOverflow ? { outputOverflow: true } : {}),
        ...(result.timedOut ? { timedOut: true } : {}),
      }
  return {
    baselineRegistration: processTracker.baselineRegistrationPid !== undefined,
    baselineServicePids: processTracker.baselineServicePids,
    command,
    discoveredCount: processTracker.trackedCount(),
    discoveredPids: terminated.discoveredPids,
    forced: terminated.forced,
    normalStop,
    stopped: true,
    survivorPids: terminated.survivorPids,
  }
}

const appendCleanupDiagnostic = (verificationError, cleanupError) => {
  const diagnostic = JSON.stringify({ cleanup: typeof cleanupError?.code === "string" ? cleanupError.code : "UNKNOWN" })
  verificationError.message = `${verificationError.message}:cleanup:${diagnostic}`
  verificationError.cleanupError = cleanupError
  return verificationError
}

export const verifyManagedReadmePluginList = async ({
  argv,
  cwd,
  env,
  execute = captureReadmeVerificationCommand,
  cleanup = cleanupReadmeVerificationService,
  createProcessTracker = createManagedServiceProcessTracker,
  now = Date.now,
  retryIntervalMs = DEFAULT_RETRY_INTERVAL_MS,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) => {
  const processTracker = await createProcessTracker({ argv, cwd, env })
  let verification
  let verificationError
  try {
    verification = await verifyReadmePluginList({
      argv,
      cwd,
      env,
      execute: (input) => execute({ ...input, processTracker }),
      now,
      retryIntervalMs,
      sleep,
      timeoutMs,
    })
  } catch (error) {
    verificationError = error
  }
  let managedService
  try {
    managedService = await cleanup({ argv, cwd, env, processTracker })
  } catch (cleanupError) {
    if (verificationError) throw appendCleanupDiagnostic(verificationError, cleanupError)
    throw failure("OPENCODE2_README_VERIFICATION_CLEANUP_FAILED", { cleanup: typeof cleanupError?.code === "string" ? cleanupError.code : "UNKNOWN" })
  }
  if (verificationError) {
    verificationError.cleanup = managedService
    throw verificationError
  }
  return { ...verification, managedService }
}
