const { appendFileSync } = require("node:fs")
const { spawn } = require("node:child_process")

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

const workerSource = `
process.stdout.write(JSON.stringify({ pid: process.pid, ppid: process.ppid }) + "\\n")
process.on("SIGTERM", () => process.exit(0))
setInterval(() => {}, 1_000)
`

const worker = spawn(process.execPath, ["-e", workerSource], { stdio: ["ignore", "pipe", "ignore"] })
const workerClosed = new Promise((resolve) => worker.once("close", resolve))
let stopping = false

const stop = async () => {
  if (stopping) return
  stopping = true
  if (worker.exitCode === null && worker.signalCode === null) worker.kill("SIGTERM")
  await workerClosed
  appendFileSync(process.env.OPENCODE2_FIXTURE_EVENTS, `${JSON.stringify({ servicePid: process.pid, type: "worker-reaped", workerPid: worker.pid })}\n`)
  process.exit(0)
}

process.once("SIGTERM", () => void stop())
process.once("SIGINT", () => void stop())

void (async () => {
  const ready = await waitForLine(worker.stdout)
  process.stdout.write(`${JSON.stringify({
    servicePid: process.pid,
    serviceReportedParentPid: process.ppid,
    workerPid: worker.pid,
    workerReportedParentPid: ready.ppid,
  })}\n`)
})()

setInterval(() => {}, 1_000)
