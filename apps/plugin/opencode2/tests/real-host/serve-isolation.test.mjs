import assert from "node:assert/strict"
import { execFile } from "node:child_process"
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

test("isolated exact host invokes and registers the Promise plugin", async () => {
  const { stdout } = await execute("node", ["tools/real-host-suite.mjs"], { cwd: process.cwd(), timeout: 30_000 })
  const result = JSON.parse(stdout)
  if (!result.supported) return
  assert.deepEqual(result.serve, { status: "confirmed", code: "REAL_HOST_SERVE_CONFIRMED" })
  assert.equal(result.network.successfulExternalEgressPrevented, true)
  assert.equal(result.network.successfulExternalEgressCount, 0)
  assert.equal(result.network.observedProxyAttempts, result.network.catalogMetadata.attempts)
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
  assert.deepEqual(result.discovery, { status: "invoked", code: "REAL_HOST_PLUGIN_SETUP_INVOKED", invoked: true })
  assert.deepEqual(result.activation, { method: "GET", path: "/api/plugin", query: { "location[directory]": "<disposable-project>" }, authenticated: true })
  assert.deepEqual(result.http, { status: 200, path: "/api/plugin", authenticated: true })
  assert.equal(result.setupCount, 1)
  assert.equal(result.cleanupCount, 1)
  assert.equal(new Set(result.registrations).size, 4)
  assert.deepEqual([...result.tools].sort(), EXPECTED_TOOL_IDS)
  assert.equal(result.artifact.copied, true)
  assert.equal(result.artifact.entrypoint, "artifact/dist/index.js")
  assert.ok(result.projectWrites.includes("plugins"))
  assert.equal(result.output, "[captured output withheld]")
  assert.equal(result.credentials.providerCredentialsInherited, false)
  assert.match(result.hostVersion, /^\d+\.\d+\.\d+/)
  assert.equal(result.capabilities.authoritativePersistence.status, "disabled")
})
