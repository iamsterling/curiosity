const { appendFileSync, readFileSync } = require("node:fs")
const { createServer } = require("node:net")
const { execFile, spawn } = require("node:child_process")

const [serviceScript, executable, eventFile] = process.argv.slice(2)
const services = new Map()
const reapedServicePids = []
const appendEvent = (event) => appendFileSync(eventFile, `${JSON.stringify(event)}\n`)

const processGroup = (pid) => new Promise((resolve, reject) => {
  if (process.platform === "linux") {
    const stat = readFileSync(`/proc/${pid}/stat`, "utf8")
    const fields = stat.slice(stat.lastIndexOf(")") + 1).trim().split(/\s+/u)
    resolve(Number(fields[2]))
    return
  }
  execFile("ps", ["-o", "pgid=", "-p", String(pid)], (error, stdout) => {
    if (error) return reject(error)
    resolve(Number(stdout.trim()))
  })
})

const waitForLine = (stream) => new Promise((resolve, reject) => {
  let value = ""
  stream.setEncoding("utf8")
  stream.on("data", (chunk) => {
    value += chunk
    const newline = value.indexOf("\n")
    if (newline === -1) return
    try { resolve(JSON.parse(value.slice(0, newline))) } catch (error) { reject(error) }
  })
  stream.once("error", reject)
})

const startService = async () => {
  const child = spawn(process.execPath, [serviceScript, "serve", "--service"], {
    argv0: executable,
    detached: true,
    env: { ...process.env, OPENCODE2_FIXTURE_EVENTS: eventFile },
    stdio: ["ignore", "pipe", "pipe"],
  })
  let closeService
  const closed = new Promise((resolve) => { closeService = resolve })
  const record = { child, closed, ready: undefined }
  services.set(child.pid, record)
  child.once("close", (code, signal) => {
    services.delete(child.pid)
    reapedServicePids.push(child.pid)
    appendEvent({ code, servicePid: child.pid, signal, type: "service-reaped" })
    closeService()
  })
  record.ready = await waitForLine(child.stdout)
  record.ready.servicePgid = await processGroup(record.ready.servicePid)
  record.ready.workerPgid = await processGroup(record.ready.workerPid)
  appendEvent({ ...record.ready, supervisorPid: process.pid, type: "service-ready" })
  return record.ready
}

const stopAll = async () => {
  const records = [...services.values()]
  for (const { child } of records) {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM")
  }
  await Promise.all(records.map(({ closed }) => closed))
  return { activePids: [], reapedServicePids: [...reapedServicePids] }
}

const server = createServer((socket) => {
  let value = ""
  let handled = false
  socket.setEncoding("utf8")
  socket.on("data", async (chunk) => {
    value += chunk
    if (handled || !value.includes("\n")) return
    handled = true
    try {
      const request = JSON.parse(value.slice(0, value.indexOf("\n")))
      if (request.type === "start-service") socket.end(`${JSON.stringify(await startService())}\n`)
      else if (request.type === "stop-all") socket.end(`${JSON.stringify(await stopAll())}\n`)
      else if (request.type === "status") socket.end(`${JSON.stringify({ activePids: [...services.keys()], reapedServicePids })}\n`)
      else if (request.type === "shutdown") {
        socket.end(`${JSON.stringify(await stopAll())}\n`, () => server.close(() => process.exit(0)))
      } else socket.end(`${JSON.stringify({ error: "unknown-request" })}\n`)
    } catch (error) {
      socket.end(`${JSON.stringify({ error: error?.code ?? "UNKNOWN" })}\n`)
    }
  })
})

server.listen(0, "127.0.0.1", () => {
  process.stdout.write(`${JSON.stringify({ port: server.address().port, supervisorPid: process.pid })}\n`)
})

process.once("SIGTERM", () => void stopAll().then(() => server.close(() => process.exit(0))))
