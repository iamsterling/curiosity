import { spawn } from "node:child_process"
import { constants } from "node:fs"
import { access, readFile, readdir, realpath } from "node:fs/promises"
import path from "node:path"

const CLEANUP_GRACE_MS = 2_000
const CLEANUP_FORCE_MS = 2_000
const PROCESS_POLL_MS = 25

const failure = (code, detail) => {
  const error = new Error(`${code}${detail === undefined ? "" : `:${JSON.stringify(detail)}`}`)
  error.code = code
  return error
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const inspectProcessTableFromPS = () => new Promise((resolve, reject) => {
  const child = spawn("ps", ["-axo", "pid=,ppid=,pgid=,command="], { stdio: ["ignore", "pipe", "pipe"] })
  const stdout = []
  const stderr = []
  child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
  child.once("error", reject)
  child.once("close", (code) => {
    if (code !== 0) {
      reject(failure("OPENCODE2_README_PROCESS_INSPECTION_FAILED", { code }))
      return
    }
    const records = Buffer.concat(stdout).toString("utf8").split("\n").flatMap((line) => {
      const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/u)
      if (!match) return []
      return [{ command: match[4], pgid: Number(match[3]), pid: Number(match[1]), ppid: Number(match[2]) }]
    })
    resolve(records)
  })
})

const inspectProcessTable = async () => {
  const entries = await readdir("/proc", { withFileTypes: true }).catch((error) => error.code === "ENOENT" ? undefined : Promise.reject(error))
  if (entries === undefined) return inspectProcessTableFromPS()
  const records = []
  for (const entry of entries.filter((item) => item.isDirectory() && /^\d+$/u.test(item.name))) {
    const [stat, command] = await Promise.all([
      readFile(path.join("/proc", entry.name, "stat"), "utf8").catch(() => undefined),
      readFile(path.join("/proc", entry.name, "cmdline")).catch(() => undefined),
    ])
    if (stat === undefined || command === undefined) continue
    const fields = stat.slice(stat.lastIndexOf(")") + 1).trim().split(/\s+/u)
    if (fields.length < 3) continue
    records.push({
      command: command.toString("utf8").replaceAll("\0", " ").trim(),
      pgid: Number(fields[2]),
      pid: Number(entry.name),
      ppid: Number(fields[1]),
    })
  }
  return records
}

const resolveExecutable = async ({ argv, cwd, env }) => {
  const command = argv[0]
  const candidates = command.includes(path.sep)
    ? [path.resolve(cwd, command)]
    : String(env.PATH ?? "").split(path.delimiter).filter(Boolean).map((directory) => path.join(directory, command))
  for (const candidate of candidates) {
    if (await access(candidate, constants.X_OK).then(() => true, () => false)) return realpath(candidate)
  }
  throw failure("OPENCODE2_README_EXECUTABLE_NOT_FOUND")
}

const stateFile = (env) => {
  const root = env.XDG_STATE_HOME ?? (typeof env.HOME === "string" ? path.join(env.HOME, ".local", "state") : undefined)
  return root && path.isAbsolute(root) ? path.join(root, "opencode", "service.json") : undefined
}

const registrationPid = async (env) => {
  const file = stateFile(env)
  if (!file) return undefined
  const text = await readFile(file, "utf8").catch((error) => error.code === "ENOENT" ? undefined : Promise.reject(error))
  if (text === undefined) return undefined
  try {
    const record = JSON.parse(text)
    return Number.isSafeInteger(record?.pid) && record.pid > 0 ? record.pid : undefined
  } catch {
    return undefined
  }
}

const descendants = (records, seeds, baselinePids) => {
  const found = new Set(seeds)
  let changed = true
  while (changed) {
    changed = false
    for (const record of records) {
      if (baselinePids.has(record.pid) || found.has(record.pid) || !found.has(record.ppid)) continue
      found.add(record.pid)
      changed = true
    }
  }
  return found
}

export const createManagedServiceProcessTracker = async ({ argv, cwd, env, inspect = inspectProcessTable }) => {
  const executable = await resolveExecutable({ argv, cwd, env })
  const baseline = await inspect()
  const baselineRegistrationPid = await registrationPid(env)
  const baselinePids = new Set(baseline.map(({ pid }) => pid))
  const baselineGroups = new Set(baseline.map(({ pgid }) => pgid))
  const tracked = new Map()
  const commandPids = new Set()
  let observationError
  const isService = ({ command }) => command.startsWith(`${executable} `) && /\sserve\s+--service(?:\s|$)/u.test(command)

  const observe = async (commandPid) => {
    if (Number.isSafeInteger(commandPid)) commandPids.add(commandPid)
    const records = await inspect()
    const byPid = new Map(records.map((record) => [record.pid, record]))
    const seeds = new Set(records.filter((record) => !baselinePids.has(record.pid) && isService(record)).map(({ pid }) => pid))
    const registered = await registrationPid(env)
    if (registered !== undefined && !baselinePids.has(registered) && byPid.has(registered)) seeds.add(registered)
    for (const pid of tracked.keys()) if (byPid.has(pid)) seeds.add(pid)
    const commandDescendants = descendants(records, commandPids, baselinePids)
    for (const pid of commandDescendants) if (!commandPids.has(pid) && pid !== process.pid) seeds.add(pid)
    const discovered = descendants(records, seeds, baselinePids)
    const trackedGroups = new Set([...tracked.values()].map(({ pgid }) => pgid).filter((pgid) => !baselineGroups.has(pgid)))
    for (const record of records) {
      if (!baselinePids.has(record.pid) && (discovered.has(record.pid) || trackedGroups.has(record.pgid))) {
        tracked.set(record.pid, record)
      }
    }
    return records
  }

  const survivors = async () => {
    if (observationError) throw observationError
    const records = await observe()
    const groups = new Set([...tracked.values()].map(({ pgid }) => pgid).filter((pgid) => !baselineGroups.has(pgid)))
    for (const record of records) {
      if (!baselinePids.has(record.pid) && groups.has(record.pgid)) tracked.set(record.pid, record)
    }
    return records.filter(({ pid }) => tracked.has(pid) && !baselinePids.has(pid)).sort((left, right) => left.pid - right.pid)
  }

  return {
    baselineRegistrationPid,
    baselineServicePids: baseline.filter(isService).map(({ pid }) => pid).sort((left, right) => left - right),
    observe,
    recordObservationError: (error) => { observationError ??= error },
    survivors,
    trackedCount: () => tracked.size,
    trackedGroups: () => new Set([...tracked.values()].map(({ pgid }) => pgid).filter((pgid) => !baselineGroups.has(pgid))),
    trackedPids: () => [...tracked.keys()].sort((left, right) => left - right),
  }
}

const signalProcesses = (records, groups, signal) => {
  const grouped = new Set(records.filter(({ pgid }) => groups.has(pgid)).map(({ pgid }) => pgid))
  for (const pgid of grouped) {
    try { process.kill(-pgid, signal) } catch (error) { if (error.code !== "ESRCH") throw error }
  }
  for (const { pgid, pid } of records) {
    if (grouped.has(pgid)) continue
    try { process.kill(pid, signal) } catch (error) { if (error.code !== "ESRCH") throw error }
  }
}

const waitForExit = async (processTracker, timeoutMs) => {
  const deadline = Date.now() + timeoutMs
  let survivors = await processTracker.survivors()
  while (survivors.length > 0 && Date.now() < deadline) {
    await delay(PROCESS_POLL_MS)
    survivors = await processTracker.survivors()
  }
  return survivors
}

export const terminateTrackedServiceProcesses = async (processTracker) => {
  let survivors = await processTracker.survivors()
  const discoveredPids = processTracker.trackedPids()
  if (survivors.length === 0) return { discoveredPids, forced: false, survivorPids: [] }
  signalProcesses(survivors, processTracker.trackedGroups(), "SIGTERM")
  survivors = await waitForExit(processTracker, CLEANUP_GRACE_MS)
  if (survivors.length === 0) return { discoveredPids, forced: false, survivorPids: [] }
  signalProcesses(survivors, processTracker.trackedGroups(), "SIGKILL")
  survivors = await waitForExit(processTracker, CLEANUP_FORCE_MS)
  const survivorPids = survivors.map(({ pid }) => pid)
  if (survivorPids.length > 0) throw failure("OPENCODE2_README_SERVICE_SURVIVOR", { survivorPids })
  return { discoveredPids, forced: true, survivorPids }
}
