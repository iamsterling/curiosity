import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"
import test from "node:test"

const EXPECTED_TOOL_IDS = [
  "formerhuman_search",
  "ledger_approval_request", "ledger_approval_status", "ledger_claim_release", "ledger_claim_request",
  "ledger_evidence_submit", "ledger_fact_record", "ledger_intent_activate", "ledger_intent_frame",
  "ledger_intent_propose", "ledger_progress_propose", "ledger_resolution_propose", "ledger_review_propose",
  "ledger_work_propose", "native_loop_pause", "native_loop_resume", "native_loop_start", "native_loop_status",
  "native_loop_stop", "web_search",
]

const execute = promisify(execFile)

test("repeated isolated exact-host smokes import, set up, and register the exported Effect plugin", async () => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
  const { stdout } = await execute("node", ["tools/real-host-suite.mjs"], { cwd: process.cwd(), timeout: 60_000 })
  const result = JSON.parse(stdout)
  if (!result.supported) return
  assert.deepEqual(result.serve, { status: "confirmed", code: "REAL_HOST_SERVE_CONFIRMED" })
  assert.equal(result.network.successfulExternalEgressPrevented, true)
  assert.equal(result.network.successfulExternalEgressCount, 0)
  assert.equal(result.network.observedProxyAttempts, 0)
  assert.equal(result.network.observedProxyAttempts, result.network.catalogMetadata.attempts)
  assert.equal(result.network.modelCatalogAttempts, 0)
  assert.equal(result.network.githubAttempts, 0)
  assert.deepEqual(result.network.catalogMetadata.method, "CONNECT")
  assert.deepEqual(result.network.catalogMetadata.authority, "models.opencode.ai:443")
  assert.deepEqual(result.network.catalogMetadata.disposition, "rejected")
  assert.equal(result.network.providerInferenceAttempts, 0)
  assert.equal(result.network.successfulInferenceCount, 0)
  assert.equal(result.network.unknownAuthorityAttempts, 0)
  assert.deepEqual(result.filesystem.outsideWritesPrevented, true)
  assert.equal(result.credentials.retainedRawMatches, 0)
  assert.equal(result.credentials.outputRawMatches, 0)
  assert.equal(result.processes.forkPrevented, true)
  assert.deepEqual(result.fixtures, { network: "caught", proxy: "caught", outsideWrite: "caught", secretPersistence: "caught", detachedChild: "caught" })
  assert.ok(["artifact", "cache", "config", "data", "home", "project", "sandbox.sb"].every((name) => result.topLevelWrites.includes(name)))
  assert.deepEqual(result.discovery, { status: "invoked", code: "REAL_HOST_PLUGIN_EFFECT_INVOKED", invoked: true, lifecycle: "effect" })
  assert.deepEqual(result.activation, { method: "GET", path: "/api/plugin", query: { "location[directory]": "<disposable-project>" }, authenticated: true, source: "OPENCODE_CONFIG_CONTENT", projectConfig: false })
  assert.deepEqual(result.http, { status: 200, path: "/api/plugin", authenticated: true })
  assert.equal(result.setupCount, 1)
  assert.equal(result.cleanupCount, 1)
  assert.equal(new Set(result.registrations).size, 4)
  assert.deepEqual([...result.tools].sort(), EXPECTED_TOOL_IDS)
  assert.equal(result.artifact.copied, true)
  assert.equal(result.artifact.entrypoint, "artifact/plugin/index.js")
  assert.ok(!result.projectWrites.includes("plugins"))
  assert.equal(result.output, "[captured output withheld]")
  assert.equal(result.credentials.providerCredentialsInherited, false)
  assert.match(result.hostVersion, /^\d+\.\d+\.\d+/)
  assert.equal(result.capabilities.authoritativePersistence.status, "disabled")
  }
})

test("exact-host smoke fails on plugin import, setup, and duplicate activation errors", async () => {
  for (const [failure, code] of [["import", "REAL_HOST_TEST_IMPORT_FAILED"], ["setup", "REAL_HOST_TEST_SETUP_FAILED"], ["duplicate", "REAL_HOST_TEST_DUPLICATE_FAILED"]]) {
    const evidence = await mkdtemp(path.join(os.tmpdir(), "real-host-failure-evidence-")); const pidFile = path.join(evidence, "pid")
    const started = Date.now()
    try {
      await assert.rejects(execute("node", ["tools/real-host-suite.mjs"], {
        cwd: process.cwd(), env: { ...process.env, REAL_HOST_FORCED_FAILURE: failure, REAL_HOST_TEST_PID_FILE: pidFile }, timeout: 60_000,
      }), (error) => String(error.stderr).includes(code))
      assert.ok(Date.now() - started < 45_000, `${failure} probe did not fail fast`)
      const pid = Number(await readFile(pidFile, "utf8")); assert.ok(Number.isInteger(pid))
      assert.throws(() => process.kill(pid, 0), undefined, `${failure} host survived rejection`)
    } finally { await rm(evidence, { recursive: true, force: true }) }
  }
})
