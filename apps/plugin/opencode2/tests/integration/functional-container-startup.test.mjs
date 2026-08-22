import assert from "node:assert/strict"
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { validateFunctionalHost } from "../../tools/ephemeral-container/functional-validation.mjs"

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const waitFor = async (operation, timeout = 2_000) => {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const value = await operation()
    if (value !== undefined) return value
    await delay(25)
  }
  assert.fail("bounded process-state poll timed out")
}

const processAlive = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error.code === "ESRCH") return false
    throw error
  }
}

const faultHost = async (temporary, fault) => {
  const executable = path.join(temporary, "fault-host.mjs")
  const leader = path.join(temporary, `${fault}-leader.pid`)
  const descendant = path.join(temporary, `${fault}-descendant.pid`)
  const faultSecret = ["startup", "credential", "must", "not", "leak"].join("-")
  await writeFile(executable, `#!/usr/bin/env node
import { spawn } from "node:child_process"
import { existsSync, writeFileSync } from "node:fs"

if (process.argv[2] === "--version") {
  console.log("opencode2 vtest-host")
  process.exit(0)
}
writeFileSync(process.env.FAULT_LEADER, String(process.pid))
const descendant = spawn(process.execPath, ["-e", "require('node:fs').writeFileSync(process.env.FAULT_DESCENDANT, String(process.pid)); setInterval(() => {}, 1000)"], {
  env: process.env,
  stdio: "ignore",
})
descendant.unref()
const deadline = Date.now() + 2000
while (!existsSync(process.env.FAULT_DESCENDANT) && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 10))
if (!existsSync(process.env.FAULT_DESCENDANT)) process.exit(24)
if (process.env.FAULT_KIND === "early-exit") {
  console.error("malformed startup output")
  process.exit(23)
}
if (process.env.FAULT_KIND === "malformed-timeout") {
  console.error("x".repeat(12000))
  console.error(["malformed startup output", "to" + "ken", process.env.FAULT_SECRET].join(":"))
}
await new Promise(() => setInterval(() => {}, 1000))
`)
  await chmod(executable, 0o755)
  return {
    descendant,
    executable,
    faultSecret,
    leader,
    profile: {
      env: { ...process.env, FAULT_DESCENDANT: descendant, FAULT_KIND: fault, FAULT_LEADER: leader, FAULT_SECRET: faultSecret },
      project: temporary,
    },
  }
}

const readPID = async (file) => waitFor(async () => {
  const value = await readFile(file, "utf8").catch((error) => error.code === "ENOENT" ? undefined : Promise.reject(error))
  return value === undefined ? undefined : Number(value)
})

const killFaultProcesses = async (...files) => {
  for (const file of files) {
    const pid = await readFile(file, "utf8").then(Number).catch(() => undefined)
    if (pid === undefined) continue
    try {
      process.kill(pid, "SIGKILL")
    } catch (error) {
      if (error.code !== "ESRCH") throw error
    }
  }
}

for (const fault of ["timeout", "early-exit", "malformed-timeout"]) {
  test(`functional host ${fault} startup rejection leaves no detached process-group survivor`, { skip: process.platform === "win32" }, async () => {
    const temporary = await mkdtemp(path.join(os.tmpdir(), `opencode2-host-${fault}-`))
    const fixture = await faultHost(temporary, fault)
    try {
      await assert.rejects(
        () => validateFunctionalHost({
          configRoot: temporary,
          disabled: fixture.profile,
          enabled: fixture.profile,
          host: fixture.executable,
          hostVersion: "test-host",
        }),
        (error) => {
          if (fault === "malformed-timeout") {
            const prefix = "CONTAINER_HOST_START_TIMEOUT:"
            assert.equal(error.message.startsWith(prefix), true)
            const detail = JSON.parse(error.message.slice(prefix.length))
            assert.equal(detail.truncated, true)
            assert.match(detail.output, /malformed startup output/u)
            assert.match(detail.output, /\[REDACTED\]/u)
            assert.doesNotMatch(detail.output, new RegExp(fixture.faultSecret, "u"))
            assert.equal(Buffer.byteLength(detail.output) <= 8_192, true)
            return true
          }
          assert.equal(
            error.message,
            fault === "timeout" ? "CONTAINER_HOST_START_TIMEOUT" : 'CONTAINER_HOST_EARLY_EXIT:{"code":23,"output":"malformed startup output\\n"}',
          )
          return true
        },
      )
      const leader = await readPID(fixture.leader)
      const descendant = await readPID(fixture.descendant)
      await waitFor(() => !processAlive(leader) && !processAlive(descendant) ? true : undefined)
    } finally {
      try {
        await killFaultProcesses(fixture.leader, fixture.descendant)
      } finally {
        await rm(temporary, { recursive: true, force: true })
      }
    }
  })
}
