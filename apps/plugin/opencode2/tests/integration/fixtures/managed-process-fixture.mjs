import { spawn } from "node:child_process"
import { chmod, copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises"
import { connect } from "node:net"
import os from "node:os"
import path from "node:path"

const FIXTURE_TIMEOUT_MS = 5_000
const POLL_INTERVAL_MS = 10
const fixtureRoot = import.meta.dirname
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const waitFor = async (description, inspect, accept) => {
  const deadline = Date.now() + FIXTURE_TIMEOUT_MS
  let value
  do {
    value = await inspect()
    if (accept(value)) return value
    await delay(POLL_INTERVAL_MS)
  } while (Date.now() < deadline)
  throw new Error(`OPENCODE2_MANAGED_PROCESS_FIXTURE_TIMEOUT:${JSON.stringify({ description, value })}`)
}

const waitForJsonLine = (stream, description, timeoutMs = FIXTURE_TIMEOUT_MS) => new Promise((resolve, reject) => {
  let value = ""
  const cleanup = () => {
    clearTimeout(timeout)
    stream.off("data", onData)
    stream.off("error", onError)
    stream.off("close", onClose)
  }
  const finish = (operation, result) => {
    cleanup()
    operation(result)
  }
  const onData = (chunk) => {
    value += chunk
    const newline = value.indexOf("\n")
    if (newline === -1) return
    try { finish(resolve, JSON.parse(value.slice(0, newline))) } catch (error) { finish(reject, error) }
  }
  const onError = (error) => finish(reject, error)
  const onClose = () => finish(reject, new Error(`OPENCODE2_MANAGED_PROCESS_FIXTURE_HANDSHAKE_CLOSED:${description}`))
  const timeout = setTimeout(() => finish(reject, new Error(`OPENCODE2_MANAGED_PROCESS_FIXTURE_HANDSHAKE_TIMEOUT:${description}`)), timeoutMs)
  stream.setEncoding("utf8")
  stream.on("data", onData)
  stream.once("error", onError)
  stream.once("close", onClose)
})

const waitForChildClose = (child) => {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`OPENCODE2_MANAGED_PROCESS_FIXTURE_EXIT_TIMEOUT:${child.pid}`)), FIXTURE_TIMEOUT_MS)
    child.once("error", reject)
    child.once("close", () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

const fixtureProcessRecordFromPS = (pid) => new Promise((resolve, reject) => {
  const child = spawn("ps", ["-o", "ppid=,pgid=,state=", "-p", String(pid)], { stdio: ["ignore", "pipe", "pipe"] })
  const stdout = []
  const stderr = []
  child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
  child.once("error", reject)
  child.once("close", (code) => {
    if (code === 1) return resolve(undefined)
    if (code !== 0) return reject(new Error(`OPENCODE2_MANAGED_PROCESS_FIXTURE_PS_FAILED:${JSON.stringify({ code, stderr: Buffer.concat(stderr).toString("utf8") })}`))
    const [ppid, pgid, state] = Buffer.concat(stdout).toString("utf8").trim().split(/\s+/u)
    resolve({ pgid: Number(pgid), pid, ppid: Number(ppid), state })
  })
})

export const fixtureProcessRecord = async (pid) => {
  if (process.platform !== "linux") return fixtureProcessRecordFromPS(pid)
  const stat = await readFile(`/proc/${pid}/stat`, "utf8").catch((error) => error.code === "ENOENT" ? undefined : Promise.reject(error))
  if (stat === undefined) return undefined
  const fields = stat.slice(stat.lastIndexOf(")") + 1).trim().split(/\s+/u)
  return { pgid: Number(fields[2]), pid, ppid: Number(fields[1]), state: fields[0] }
}

export const fixtureProcessIsPresent = async (pid) => Number.isSafeInteger(pid) && (await fixtureProcessRecord(pid)) !== undefined

export const fixtureProcessGroupIsPresent = (pgid) => {
  if (!Number.isSafeInteger(pgid) || pgid < 1) return false
  try {
    process.kill(-pgid, 0)
    return true
  } catch (error) {
    if (error.code === "ESRCH") return false
    if (error.code === "EPERM") return true
    throw error
  }
}

const signalFixtureProcessGroup = (child, signal) => {
  if (!Number.isSafeInteger(child?.pid)) return
  try {
    process.kill(-child.pid, signal)
  } catch (error) {
    if (error.code !== "ESRCH") throw error
    try { child.kill(signal) } catch (childError) { if (childError.code !== "ESRCH") throw childError }
  }
}

const waitForReap = (closed, timeoutMs) => new Promise((resolve) => {
  const timeout = setTimeout(() => resolve(false), timeoutMs)
  closed.then(() => {
    clearTimeout(timeout)
    resolve(true)
  })
})

const terminateAndReapChild = async (child, closed) => {
  if (!child) return
  if (child.exitCode === null && child.signalCode === null) signalFixtureProcessGroup(child, "SIGTERM")
  let reaped = await waitForReap(closed, 500)
  if (!reaped) {
    signalFixtureProcessGroup(child, "SIGKILL")
    reaped = await waitForReap(closed, FIXTURE_TIMEOUT_MS)
  }
  if (!reaped) throw new Error(`OPENCODE2_MANAGED_PROCESS_FIXTURE_REAP_TIMEOUT:${child.pid}`)
  await waitFor(
    `PID and process group ${child.pid} to be absent`,
    async () => ({ group: fixtureProcessGroupIsPresent(child.pid), process: await fixtureProcessIsPresent(child.pid) }),
    ({ group, process: present }) => !group && !present,
  )
}

const appendCleanupContext = (original, cleanupError) => {
  if (!(original instanceof Error)) return original
  const cleanup = typeof cleanupError?.code === "string" ? cleanupError.code : "UNKNOWN"
  const suffix = `:cleanup:${JSON.stringify({ cleanup })}`
  const available = 2_048 - Buffer.byteLength(suffix)
  let prefix = ""
  let prefixBytes = 0
  for (const character of original.message) {
    const characterBytes = Buffer.byteLength(character)
    if (prefixBytes + characterBytes > available) break
    prefix += character
    prefixBytes += characterBytes
  }
  original.message = `${prefix}${suffix}`
  original.cleanupError = cleanupError
  return original
}

export const requestFixtureSupervisor = (fixture, request) => new Promise((resolve, reject) => {
  const socket = connect(fixture.port, "127.0.0.1")
  let response = ""
  const timeout = setTimeout(() => {
    socket.destroy()
    reject(new Error(`OPENCODE2_MANAGED_PROCESS_FIXTURE_REQUEST_TIMEOUT:${request.type}`))
  }, FIXTURE_TIMEOUT_MS)
  socket.setEncoding("utf8")
  socket.once("connect", () => socket.write(`${JSON.stringify(request)}\n`))
  socket.on("data", (chunk) => {
    response += chunk
    const newline = response.indexOf("\n")
    if (newline === -1) return
    clearTimeout(timeout)
    socket.end()
    try { resolve(JSON.parse(response.slice(0, newline))) } catch (error) { reject(error) }
  })
  socket.once("error", (error) => {
    clearTimeout(timeout)
    reject(error)
  })
})

export const fixtureEvents = async (fixture) => (await readFile(fixture.eventFile, "utf8"))
  .split("\n").filter(Boolean).map((line) => JSON.parse(line))

export const waitForFixtureEvent = (fixture, predicate, description) => waitFor(
  description,
  () => fixtureEvents(fixture).then((events) => events.find(predicate)),
  (event) => event !== undefined,
)

export const waitForTrackedPids = (tracker, pids) => waitFor(
  `periodic observation of ${pids.join(",")}`,
  () => tracker?.trackedPids() ?? [],
  (tracked) => JSON.stringify(tracked) === JSON.stringify([...pids].sort((left, right) => left - right)),
)

export const createManagedProcessFixture = async (name, expected) => {
  const root = await mkdtemp(path.join(os.tmpdir(), `opencode2-managed-${name}-`))
  const roots = Object.fromEntries(["bin", "home", "project", "state"].map((entry) => [entry, path.join(root, entry)]))
  await Promise.all(Object.values(roots).map((directory) => mkdir(directory, { recursive: true })))
  await mkdir(path.join(roots.state, "opencode"), { recursive: true })
  const executable = path.join(roots.bin, "opencode2")
  const eventFile = path.join(root, "events.jsonl")
  const releaseFile = path.join(root, "release")
  await copyFile(path.join(fixtureRoot, "managed-command.cjs"), executable)
  await chmod(executable, 0o700)
  await writeFile(eventFile, "", { mode: 0o600 })
  const canonicalExecutable = await realpath(executable)
  const supervisor = spawn(process.execPath, [
    path.join(fixtureRoot, "managed-supervisor.cjs"),
    path.join(fixtureRoot, "managed-service.cjs"),
    canonicalExecutable,
    eventFile,
  ], { stdio: ["ignore", "pipe", "pipe"] })
  let ready
  try {
    ready = await waitForJsonLine(supervisor.stdout, "supervisor-ready")
  } catch (error) {
    if (supervisor.exitCode === null && supervisor.signalCode === null) supervisor.kill("SIGTERM")
    await waitForChildClose(supervisor)
    await rm(root, { recursive: true, force: true })
    throw error
  }
  const sensitiveKey = ["OPENCODE2", "FIXTURE", ["SE", "CRET"].join("")].join("_")
  return {
    cwd: roots.project,
    env: {
      HOME: roots.home,
      OPENCODE2_FIXTURE_EVENTS: eventFile,
      OPENCODE2_FIXTURE_EXPECTED: expected,
      OPENCODE2_FIXTURE_MODE: "success",
      OPENCODE2_FIXTURE_PORT: String(ready.port),
      OPENCODE2_FIXTURE_RELEASE: releaseFile,
      [sensitiveKey]: ["managed", "fixture", "canary"].join("-"),
      OPENCODE2_FIXTURE_STOP_MODE: "success",
      PATH: `${roots.bin}:${path.dirname(process.execPath)}:/usr/bin:/bin`,
      XDG_STATE_HOME: roots.state,
    },
    eventFile,
    executable,
    port: ready.port,
    registration: path.join(roots.state, "opencode", "service.json"),
    releaseFile,
    root,
    supervisor,
    supervisorPid: ready.supervisorPid,
  }
}

const eventPids = (events) => [...new Set(events.flatMap((event) => [event.commandPid, event.servicePid, event.workerPid]).filter(Number.isSafeInteger))]

export const cleanupManagedProcessFixture = async (fixture) => {
  let shutdownError
  try { await requestFixtureSupervisor(fixture, { type: "shutdown" }) } catch (error) { shutdownError = error }
  if (shutdownError) {
    const events = await fixtureEvents(fixture)
    const servicePids = [...new Set(events.map(({ servicePid }) => servicePid).filter(Number.isSafeInteger))]
    for (const servicePid of servicePids) {
      if (!Number.isSafeInteger(servicePid) || !(await fixtureProcessIsPresent(servicePid))) continue
      try { process.kill(-servicePid, "SIGTERM") } catch (error) { if (error.code !== "ESRCH") throw error }
    }
    const descendantPids = eventPids(events).filter((pid) => pid !== fixture.supervisorPid)
    await waitFor("fallback fixture descendants to be absent", async () => Promise.all(descendantPids.map(fixtureProcessIsPresent)), (present) => present.every((value) => !value))
  }
  if (fixture.supervisor.exitCode === null && fixture.supervisor.signalCode === null && shutdownError) fixture.supervisor.kill("SIGTERM")
  await waitForChildClose(fixture.supervisor)
  const pids = eventPids(await fixtureEvents(fixture))
  await waitFor("fixture PIDs to be absent", async () => Promise.all(pids.map(fixtureProcessIsPresent)), (present) => present.every((value) => !value))
  await rm(fixture.root, { recursive: true, force: true })
}

export const createLongLivedChild = async (label, options = {}) => {
  const source = `
const fault = process.argv[2]
if (fault === "malformed-json") process.stdout.write("{malformed\\n")
else if (fault !== "timeout" && fault !== "stream-error") process.stdout.write(JSON.stringify({
  label: process.argv[1],
  pid: process.pid + (fault === "pid-invalid" ? 1 : 0),
  ppid: process.ppid + (fault === "ppid-invalid" ? 1 : 0),
}) + "\\n")
process.on("SIGTERM", () => process.exit(0))
setInterval(() => {}, 1_000)
`
  let child
  let closed
  try {
    child = spawn(process.execPath, ["-e", source, label, options.fault ?? "success"], { detached: true, stdio: ["ignore", "pipe", "pipe"] })
    closed = new Promise((resolve) => child.once("close", resolve))
    options.onSpawn?.(child)
    const handshake = waitForJsonLine(child.stdout, label, options.handshakeTimeoutMs)
    if (options.fault === "stream-error") queueMicrotask(() => child.stdout.destroy(new Error("OPENCODE2_MANAGED_PROCESS_FIXTURE_STREAM_ERROR")))
    const ready = await handshake
    if (ready.label !== label) throw new Error(`OPENCODE2_MANAGED_PROCESS_FIXTURE_LABEL_INVALID:${label}`)
    if (ready.pid !== child.pid) throw new Error(`OPENCODE2_MANAGED_PROCESS_FIXTURE_PID_INVALID:${label}`)
    if (ready.ppid !== process.pid) throw new Error(`OPENCODE2_MANAGED_PROCESS_FIXTURE_PPID_INVALID:${label}`)
    await options.beforeReturn?.({ child, ready })
    return child
  } catch (original) {
    try {
      await terminateAndReapChild(child, closed ?? Promise.resolve())
    } catch (cleanupError) {
      throw appendCleanupContext(original, cleanupError)
    }
    throw original
  }
}

export const spawnLongLivedFixtureProcess = createLongLivedChild

export const stopFixtureProcess = async (child) => {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  const closed = new Promise((resolve) => child.once("close", resolve))
  await terminateAndReapChild(child, closed)
}

export const releasePeriodicCommand = (fixture) => writeFile(fixture.releaseFile, "release\n", { flag: "wx" })
