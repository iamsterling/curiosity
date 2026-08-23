#!/usr/bin/env node
const { appendFileSync, existsSync } = require("node:fs")
const { connect } = require("node:net")

const appendEvent = (event) => appendFileSync(process.env.OPENCODE2_FIXTURE_EVENTS, `${JSON.stringify(event)}\n`)

const requestSupervisor = (request) => new Promise((resolve, reject) => {
  const socket = connect(Number(process.env.OPENCODE2_FIXTURE_PORT), "127.0.0.1")
  let response = ""
  socket.setEncoding("utf8")
  socket.once("connect", () => socket.write(`${JSON.stringify(request)}\n`))
  socket.on("data", (chunk) => {
    response += chunk
    if (!response.includes("\n")) return
    socket.end()
    try { resolve(JSON.parse(response.slice(0, response.indexOf("\n")))) } catch (error) { reject(error) }
  })
  socket.once("error", reject)
})

const waitForRelease = () => new Promise((resolve) => {
  const check = () => {
    if (existsSync(process.env.OPENCODE2_FIXTURE_RELEASE)) return resolve()
    setTimeout(check, 10)
  }
  check()
})

const run = async () => {
  const command = process.argv.slice(2)
  if (command[0] === "service" && command[1] === "stop") {
    appendEvent({ commandPid: process.pid, type: "normal-stop-invoked" })
    if (process.env.OPENCODE2_FIXTURE_STOP_MODE === "fail") process.exit(9)
    const stopped = await requestSupervisor({ type: "stop-all" })
    appendEvent({ ...stopped, commandPid: process.pid, type: "normal-stop-complete" })
    return
  }
  if (command[0] !== "plugin" || command[1] !== "list") process.exit(64)

  const mode = process.env.OPENCODE2_FIXTURE_MODE
  if (mode === "timeout") {
    appendEvent({ commandPid: process.pid, type: "timeout-command-ready" })
    setInterval(() => {}, 1_000)
    return
  }

  const service = await requestSupervisor({ type: "start-service" })
  appendEvent({ ...service, commandPid: process.pid, type: "command-service-ready" })
  if (mode === "periodic") await waitForRelease()
  if (mode === "failure") {
    process.stdout.write(`unexpected ${process.env.OPENCODE2_FIXTURE_SECRET}\n`)
    process.stderr.write(`failure ${process.env.OPENCODE2_FIXTURE_SECRET}\n`)
    process.exit(7)
  }
  process.stdout.write(process.env.OPENCODE2_FIXTURE_EXPECTED)
}

run().catch((error) => {
  appendEvent({ code: error?.code ?? "UNKNOWN", commandPid: process.pid, type: "command-fixture-failed" })
  process.exit(70)
})
