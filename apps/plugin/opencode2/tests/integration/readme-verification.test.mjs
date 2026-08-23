import assert from "node:assert/strict"
import { access, readFile, readdir, writeFile } from "node:fs/promises"
import os from "node:os"
import test from "node:test"

import { verifyManagedReadmePluginList } from "../../tools/ephemeral-container/readme-verification.mjs"
import { createManagedServiceProcessTracker } from "../../tools/ephemeral-container/managed-service-cleanup.mjs"
import { EXPECTED_README_PLUGIN_IDS } from "../../tools/ephemeral-container/validation-contract.mjs"
import {
  cleanupManagedProcessFixture,
  createLongLivedChild,
  createManagedProcessFixture,
  fixtureEvents,
  fixtureProcessGroupIsPresent,
  fixtureProcessIsPresent,
  fixtureProcessRecord,
  releasePeriodicCommand,
  requestFixtureSupervisor,
  spawnLongLivedFixtureProcess,
  stopFixtureProcess,
  waitForFixtureEvent,
  waitForTrackedPids,
} from "./fixtures/managed-process-fixture.mjs"

const argv = ["opencode2", "plugin", "list"]
const cwd = "/isolated/project"
const env = Object.freeze({ HOME: "/isolated/home", PATH: "/isolated/bin:/usr/bin:/bin" })
const expected = `${EXPECTED_README_PLUGIN_IDS.join("\n")}\n`
const empty = "No plugins loaded\n"
const result = (stdout, overrides = {}) => ({ code: 0, signal: null, stderr: "", stdout, ...overrides })

const deterministic = (outputs, options = {}) => {
  let current = 0
  let cleanupCalls = 0
  const invocations = []
  const processTracker = { observe: async () => undefined }
  return {
    context: {
      argv,
      cwd,
      env,
      execute: async (actual) => {
        invocations.push(actual)
        return outputs[Math.min(invocations.length - 1, outputs.length - 1)]
      },
      cleanup: async (actual) => {
        cleanupCalls += 1
        assert.deepEqual(actual, { argv, cwd, env, processTracker })
        return { stopped: true, survivorPids: [] }
      },
      createProcessTracker: async (actual) => {
        assert.deepEqual(actual, { argv, cwd, env })
        return processTracker
      },
      now: () => current,
      sleep: async (milliseconds) => { current += milliseconds },
      retryIntervalMs: 100,
      timeoutMs: 250,
      ...options,
    },
    get cleanupCalls() { return cleanupCalls },
    invocations,
    processTracker,
  }
}

test("README plugin verification retries exact cold-empty output then accepts only the expected inventory", async () => {
  const fixture = deterministic([result(empty), result(expected)])
  const evidence = await verifyManagedReadmePluginList(fixture.context)
  assert.equal(fixture.cleanupCalls, 1)
  assert.deepEqual(fixture.invocations, [
    { argv, cwd, env, processTracker: fixture.processTracker, timeoutMs: 250 },
    { argv, cwd, env, processTracker: fixture.processTracker, timeoutMs: 150 },
  ])
  assert.deepEqual(evidence, {
    attempts: [
      { attempt: 1, code: 0, outcome: "cold-empty", signal: null, stderrBytes: 0, stdoutBytes: 18 },
      { attempt: 2, code: 0, outcome: "expected-inventory", signal: null, stderrBytes: 0, stdoutBytes: 1_895 },
    ],
    elapsedMs: 100,
    inventory: [...EXPECTED_README_PLUGIN_IDS],
    managedService: { stopped: true, survivorPids: [] },
  })
})

test("README plugin verification retries only a known built-in subset before product activation", async () => {
  const fixture = deterministic([result("opencode.agent\nopencode.command\n"), result(expected)])
  const evidence = await verifyManagedReadmePluginList(fixture.context)
  assert.equal(evidence.attempts[0].outcome, "cold-builtins")
  assert.equal(evidence.attempts[1].outcome, "expected-inventory")
  assert.equal(fixture.cleanupCalls, 1)
})

test("README plugin verification fails after the bounded perpetual-empty interval", async () => {
  const fixture = deterministic([result(empty)])
  await assert.rejects(verifyManagedReadmePluginList(fixture.context), (error) => {
    assert.equal(error.message, 'OPENCODE2_README_VERIFICATION_TIMEOUT:{"attempts":3,"elapsedMs":250}')
    return true
  })
  assert.equal(fixture.invocations.length, 3)
  assert.equal(fixture.cleanupCalls, 1)
})

test("README plugin verification fails immediately on a nonzero command without exposing output", async () => {
  const secret = ["verification", "token", "must", "stay", "redacted"].join("-")
  const fixture = deterministic([result(`unexpected ${secret}\n`, { code: 7, stderr: `failure ${secret}\n` })])
  await assert.rejects(verifyManagedReadmePluginList(fixture.context), (error) => {
    assert.match(error.message, /^OPENCODE2_README_VERIFICATION_COMMAND_FAILED:/u)
    assert.doesNotMatch(error.message, new RegExp(secret, "u"))
    return true
  })
  assert.equal(fixture.invocations.length, 1)
  assert.equal(fixture.cleanupCalls, 1)
})

test("README plugin verification cleans up after bounded output overflow", async () => {
  const fixture = deterministic([result("x".repeat(8_192), { outputOverflow: true })])
  await assert.rejects(verifyManagedReadmePluginList(fixture.context), (error) => {
    assert.equal(error.code, "OPENCODE2_README_VERIFICATION_COMMAND_FAILED")
    assert.match(error.message, /"outputOverflow":true/u)
    return true
  })
  assert.equal(fixture.cleanupCalls, 1)
})

test("README plugin verification fails immediately on an unexpected inventory", async () => {
  const fixture = deterministic([result(`${expected}other.plugin\n`)])
  await assert.rejects(verifyManagedReadmePluginList(fixture.context), (error) => {
    assert.match(error.message, /^OPENCODE2_README_VERIFICATION_INVENTORY_MISMATCH:/u)
    return true
  })
  assert.equal(fixture.invocations.length, 1)
  assert.equal(fixture.cleanupCalls, 1)
})

test("README plugin verification fails immediately when an exit-zero command writes stderr", async () => {
  const fixture = deterministic([result(expected, { stderr: "unexpected diagnostic\n" })])
  await assert.rejects(verifyManagedReadmePluginList(fixture.context), (error) => {
    assert.match(error.message, /^OPENCODE2_README_VERIFICATION_STDERR:/u)
    return true
  })
  assert.equal(fixture.invocations.length, 1)
  assert.equal(fixture.cleanupCalls, 1)
})

test("README plugin verification preserves its original failure and appends bounded cleanup diagnostics", async () => {
  const fixture = deterministic([result("", { code: 7 })], {
    cleanup: async () => {
      const error = new Error("OPENCODE2_README_SERVICE_SURVIVOR:{\"survivorPids\":[123]}")
      error.code = "OPENCODE2_README_SERVICE_SURVIVOR"
      throw error
    },
  })
  await assert.rejects(verifyManagedReadmePluginList(fixture.context), (error) => {
    assert.equal(error.code, "OPENCODE2_README_VERIFICATION_COMMAND_FAILED")
    assert.match(error.message, /^OPENCODE2_README_VERIFICATION_COMMAND_FAILED:/u)
    assert.match(error.message, /cleanup.*OPENCODE2_README_SERVICE_SURVIVOR/u)
    assert.equal(Buffer.byteLength(error.message) <= 2_048, true)
    return true
  })
})

const exists = (target) => access(target).then(() => true, () => false)

const trackerFactory = (lifecycle) => async (context) => {
  lifecycle.tracker = await createManagedServiceProcessTracker(context)
  lifecycle.trackerReady = true
  return lifecycle.tracker
}

const servicePids = (event) => [event.servicePid, event.workerPid].sort((left, right) => left - right)

const assertServiceHandshake = (fixture, event) => {
  assert.equal(event.serviceReportedParentPid, fixture.supervisorPid)
  assert.equal(event.workerReportedParentPid, event.servicePid)
  assert.equal(event.servicePgid, event.servicePid)
  assert.equal(event.workerPgid, event.servicePid)
}

const assertProcessesAbsent = async (pids) => {
  for (const pid of pids) {
    assert.equal(await fixtureProcessIsPresent(pid), false, `PID ${pid} must be absent, not zombie or alive`)
    assert.equal(await fixtureProcessRecord(pid), undefined)
  }
}

const assertSupervisorReapedService = async (fixture, event) => {
  const events = await fixtureEvents(fixture)
  assert.equal(events.some(({ type, workerPid }) => type === "worker-reaped" && workerPid === event.workerPid), true)
  assert.equal(events.some(({ servicePid, type }) => type === "service-reaped" && servicePid === event.servicePid), true)
  assert.deepEqual((await requestFixtureSupervisor(fixture, { type: "status" })).activePids, [])
  await assertProcessesAbsent(servicePids(event))
}

const assertCapturedCommandsReaped = async (fixture) => {
  const commandPids = [...new Set((await fixtureEvents(fixture)).map(({ commandPid }) => commandPid).filter(Number.isSafeInteger))]
  assert.equal(commandPids.length > 0, true)
  await assertProcessesAbsent(commandPids)
}

test("long-lived child handshake failures reap the spawned process before rejecting", { skip: process.platform === "win32" }, async (context) => {
  const original = new Error("OPENCODE2_MANAGED_PROCESS_FIXTURE_POST_HANDSHAKE_REJECTION")
  const cases = [
    { fault: "timeout", options: { fault: "timeout", handshakeTimeoutMs: 50 }, validate: (error) => assert.match(error.message, /HANDSHAKE_TIMEOUT/u) },
    { fault: "stream error", options: { fault: "stream-error" }, validate: (error) => assert.equal(error.message, "OPENCODE2_MANAGED_PROCESS_FIXTURE_STREAM_ERROR") },
    { fault: "malformed JSON", options: { fault: "malformed-json" }, validate: (error) => assert.equal(error instanceof SyntaxError, true) },
    { fault: "PID validation", options: { fault: "pid-invalid" }, validate: (error) => assert.match(error.message, /_PID_INVALID:/u) },
    { fault: "PPID validation", options: { fault: "ppid-invalid" }, validate: (error) => assert.match(error.message, /_PPID_INVALID:/u) },
    { fault: "other rejection", options: { beforeReturn: async () => { throw original } }, validate: (error) => assert.equal(error, original) },
  ]
  const before = (await readdir(os.tmpdir())).filter((entry) => entry.startsWith("opencode2-managed-")).sort()
  for (const fault of cases) {
    await context.test(fault.fault, async () => {
      let child
      try {
        await assert.rejects(
          createLongLivedChild(`handshake-${fault.fault}`, { ...fault.options, onSpawn: (spawned) => { child = spawned } }),
          (error) => {
            fault.validate(error)
            return true
          },
        )
        assert.equal(await fixtureProcessIsPresent(child.pid), false)
        assert.equal(fixtureProcessGroupIsPresent(child.pid), false)
      } finally {
        await stopFixtureProcess(child)
      }
    })
  }
  const after = (await readdir(os.tmpdir())).filter((entry) => entry.startsWith("opencode2-managed-")).sort()
  assert.deepEqual(after, before)
})

test("production capture success observes and normally stops an exact supervised service process group", { skip: process.platform === "win32" }, async (context) => {
  const fixture = await createManagedProcessFixture("capture-success", expected)
  try {
    assert.equal(await exists(fixture.registration), false)
    const evidence = await verifyManagedReadmePluginList({
      argv,
      cwd: fixture.cwd,
      env: fixture.env,
      timeoutMs: 5_000,
    })
    const event = (await fixtureEvents(fixture)).find(({ type }) => type === "command-service-ready")
    assertServiceHandshake(fixture, event)
    assert.equal(evidence.managedService.baselineRegistration, false)
    assert.equal(evidence.managedService.discoveredCount, 2)
    assert.deepEqual(evidence.managedService.discoveredPids, servicePids(event))
    assert.equal(evidence.managedService.normalStop.succeeded, true)
    assert.deepEqual(evidence.managedService.survivorPids, [])
    assert.equal(await exists(fixture.registration), false)
    await assertSupervisorReapedService(fixture, event)
    await assertCapturedCommandsReaped(fixture)
    context.diagnostic(`captured command PID ${event.commandPid}; service group PIDs ${servicePids(event).join(",")} reaped`)
  } finally {
    await cleanupManagedProcessFixture(fixture)
  }
})

test("production capture nonzero failure preserves its primary diagnostic while fallback reaps the exact process group", { skip: process.platform === "win32" }, async (context) => {
  const fixture = await createManagedProcessFixture("capture-failure", expected)
  const env = { ...fixture.env, OPENCODE2_FIXTURE_MODE: "failure", OPENCODE2_FIXTURE_STOP_MODE: "fail" }
  let failure
  try {
    assert.equal(await exists(fixture.registration), false)
    await assert.rejects(
      verifyManagedReadmePluginList({
        argv,
        cwd: fixture.cwd,
        env,
        timeoutMs: 5_000,
      }),
      (error) => {
        failure = error
        assert.equal(error.code, "OPENCODE2_README_VERIFICATION_COMMAND_FAILED")
        assert.match(error.message, /^OPENCODE2_README_VERIFICATION_COMMAND_FAILED:/u)
        assert.doesNotMatch(error.message, /:cleanup:/u)
        assert.doesNotMatch(error.message, new RegExp(fixture.env.OPENCODE2_FIXTURE_SECRET, "u"))
        assert.equal(error.cleanup.discoveredCount, 2)
        assert.equal(error.cleanup.normalStop.code, 9)
        assert.equal(error.cleanup.normalStop.succeeded, false)
        assert.deepEqual(error.cleanup.survivorPids, [])
        return true
      },
    )
    const event = (await fixtureEvents(fixture)).find(({ type }) => type === "command-service-ready")
    assertServiceHandshake(fixture, event)
    assert.deepEqual(failure.cleanup.discoveredPids, servicePids(event))
    const commandFailure = (await fixtureEvents(fixture)).find(({ type }) => type === "normal-stop-invoked")
    assert.ok(commandFailure)
    await assertSupervisorReapedService(fixture, event)
    await assertCapturedCommandsReaped(fixture)
    assert.equal(await exists(fixture.registration), false)
    context.diagnostic(`failed command PID ${event.commandPid}; fallback-reaped service group PIDs ${servicePids(event).join(",")}`)
  } finally {
    await cleanupManagedProcessFixture(fixture)
  }
})

test("production capture timeout kills and reaps the exact command without descendants or diagnostic replacement", { skip: process.platform === "win32" }, async (context) => {
  const fixture = await createManagedProcessFixture("capture-timeout", expected)
  const env = { ...fixture.env, OPENCODE2_FIXTURE_MODE: "timeout" }
  try {
    await assert.rejects(
      verifyManagedReadmePluginList({ argv, cwd: fixture.cwd, env, timeoutMs: 1_000 }),
      (error) => {
        assert.equal(error.code, "OPENCODE2_README_VERIFICATION_COMMAND_FAILED")
        assert.match(error.message, /^OPENCODE2_README_VERIFICATION_COMMAND_FAILED:/u)
        assert.match(error.message, /"timedOut":true/u)
        assert.doesNotMatch(error.message, /:cleanup:/u)
        assert.equal(error.cleanup.discoveredCount, 0)
        assert.deepEqual(error.cleanup.discoveredPids, [])
        assert.equal(error.cleanup.normalStop.succeeded, true)
        assert.deepEqual(error.cleanup.survivorPids, [])
        return true
      },
    )
    const event = (await fixtureEvents(fixture)).find(({ type }) => type === "timeout-command-ready")
    await assertCapturedCommandsReaped(fixture)
    context.diagnostic(`timed-out captured command PID ${event.commandPid} killed and reaped`)
  } finally {
    await cleanupManagedProcessFixture(fixture)
  }
})

test("production capture periodically records a supervised process group that exits before command close", { skip: process.platform === "win32" }, async (context) => {
  const fixture = await createManagedProcessFixture("capture-periodic", expected)
  const lifecycle = {}
  const env = { ...fixture.env, OPENCODE2_FIXTURE_MODE: "periodic" }
  const verification = verifyManagedReadmePluginList({
    argv,
    createProcessTracker: trackerFactory(lifecycle),
    cwd: fixture.cwd,
    env,
    timeoutMs: 5_000,
  })
  const control = (async () => {
    const event = await waitForFixtureEvent(fixture, ({ type }) => type === "command-service-ready", "periodic service handshake")
    assertServiceHandshake(fixture, event)
    assert.equal(lifecycle.trackerReady, true)
    await waitForTrackedPids(lifecycle.tracker, servicePids(event))
    const stopped = await requestFixtureSupervisor(fixture, { type: "stop-all" })
    assert.deepEqual(stopped.activePids, [])
    await assertProcessesAbsent(servicePids(event))
    await releasePeriodicCommand(fixture)
    return event
  })()
  try {
    const [evidence, event] = await Promise.all([verification, control])
    assert.equal(evidence.managedService.discoveredCount, 2)
    assert.deepEqual(evidence.managedService.discoveredPids, servicePids(event))
    assert.equal(evidence.managedService.normalStop.succeeded, true)
    assert.deepEqual(evidence.managedService.survivorPids, [])
    await assertSupervisorReapedService(fixture, event)
    await assertCapturedCommandsReaped(fixture)
    context.diagnostic(`periodic observer retained exited service group PIDs ${servicePids(event).join(",")}`)
  } finally {
    await Promise.allSettled([verification, control])
    await cleanupManagedProcessFixture(fixture)
  }
})

test("baseline registration skips normal stop while production capture leaves new process-group cleanup eligible", { skip: process.platform === "win32" }, async (context) => {
  const fixture = await createManagedProcessFixture("baseline-registration", expected)
  const lifecycle = {}
  let baseline
  let unrelated
  try {
    baseline = await spawnLongLivedFixtureProcess("registered-baseline")
    unrelated = await spawnLongLivedFixtureProcess("unrelated-baseline")
    await writeFile(fixture.registration, `${JSON.stringify({ pid: baseline.pid })}\n`, { mode: 0o600 })
    const evidence = await verifyManagedReadmePluginList({
      argv,
      createProcessTracker: trackerFactory(lifecycle),
      cwd: fixture.cwd,
      env: fixture.env,
      timeoutMs: 5_000,
    })
    const event = (await fixtureEvents(fixture)).find(({ type }) => type === "command-service-ready")
    assertServiceHandshake(fixture, event)
    assert.equal(lifecycle.tracker.baselineRegistrationPid, baseline.pid)
    assert.equal(evidence.managedService.baselineRegistration, true)
    assert.equal(evidence.managedService.discoveredCount, 2)
    assert.deepEqual(evidence.managedService.discoveredPids, servicePids(event))
    assert.deepEqual(evidence.managedService.normalStop, { skippedBaseline: true, succeeded: false })
    assert.deepEqual(evidence.managedService.survivorPids, [])
    assert.equal(JSON.parse(await readFile(fixture.registration, "utf8")).pid, baseline.pid)
    assert.equal((await fixtureEvents(fixture)).some(({ type }) => type === "normal-stop-invoked"), false)
    await assertSupervisorReapedService(fixture, event)
    await assertCapturedCommandsReaped(fixture)
    const baselineRecord = await fixtureProcessRecord(baseline.pid)
    const unrelatedRecord = await fixtureProcessRecord(unrelated.pid)
    assert.ok(baselineRecord)
    assert.ok(unrelatedRecord)
    assert.equal(baselineRecord.state.startsWith("Z"), false)
    assert.equal(unrelatedRecord.state.startsWith("Z"), false)
    context.diagnostic(`eligible service group PIDs ${servicePids(event).join(",")} reaped; baseline PIDs ${baseline.pid},${unrelated.pid} preserved`)
  } finally {
    await stopFixtureProcess(baseline)
    await stopFixtureProcess(unrelated)
    await cleanupManagedProcessFixture(fixture)
  }
})
