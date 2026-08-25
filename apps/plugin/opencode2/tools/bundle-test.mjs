import assert from "node:assert/strict"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { exportBundle, validateBundle } from "./bundle-assets.mjs"

const overlay = {
  host: { apiVersion: "1" }, defaultAgent: "generalist",
  enabledAgents: ["orchestrator", "generalist", "analyst", "implementer", "strategist", "reviewer", "researcher", "worker"],
  models: Object.fromEntries(["orchestrator", "generalist", "analyst", "implementer", "strategist", "reviewer", "researcher", "worker"].map((role) => [role, "operator/test-model"])),
  permissions: [{ action: "read", resource: "*", effect: "allow" }], plugins: ["test/plugin"], experimental: { subagent_depth: 3 },
}

test("exports a stable manifest and validates the isolated destination", async () => {
  const destination = await mkdtemp(join(tmpdir(), "generic-bundle-"))
  try {
    assert.deepEqual(await exportBundle(destination, { overlay }), [])
    assert.deepEqual(await validateBundle(destination), [])
    const first = await readFile(join(destination, ".generic-bundle-manifest.json"), "utf8")
    assert.deepEqual(await exportBundle(destination, { overlay }), [])
    assert.equal(await readFile(join(destination, ".generic-bundle-manifest.json"), "utf8"), first)
  } finally {
    await rm(destination, { recursive: true, force: true })
  }
})

test("example recommends bounded depth 3 via the OpenCode 2 key, not stale depth 2", async () => {
  const destination = await mkdtemp(join(tmpdir(), "generic-bundle-"))
  try {
    await exportBundle(destination, { overlay })
    const example = JSON.parse(await readFile(join(destination, "assets", "config", "overlay.example.json"), "utf8"))
    assert.equal(example.experimental.subagent_depth, 3)
    const schema = JSON.parse(await readFile(join(destination, "assets", "config", "overlay.schema.json"), "utf8"))
    assert.equal(schema.properties.experimental.properties.subagent_depth.maximum, 3)
  } finally {
    await rm(destination, { recursive: true, force: true })
  }
})

test("export requires an explicit operator overlay", async () => {
  const destination = await mkdtemp(join(tmpdir(), "generic-bundle-"))
  try { await assert.rejects(() => exportBundle(destination), /BUNDLE_OPERATOR_OVERLAY_REQUIRED/) }
  finally { await rm(destination, { recursive: true, force: true }) }
})

test("reports stale exported assets with a stable code", async () => {
  const destination = await mkdtemp(join(tmpdir(), "generic-bundle-"))
  try {
    await exportBundle(destination, { overlay })
    await writeFile(join(destination, "assets", "commands", "verify.md"), "stale", "utf8")
    assert.ok((await validateBundle(destination)).some((item) => item.code === "BUNDLE_ASSET_STALE"))
  } finally {
    await rm(destination, { recursive: true, force: true })
  }
})

test("detects missing assets, bad command references, leakage, and invalid overlay policy", async () => {
  const destination = await mkdtemp(join(tmpdir(), "generic-bundle-"))
  try {
    await exportBundle(destination, { overlay })
    await rm(join(destination, "assets", "skills", "verify", "SKILL.md"))
    await writeFile(join(destination, "assets", "commands", "task.md"), "skill: absent-skill\nCrafty", "utf8")
    await writeFile(join(destination, "assets", "config", "overlay.json"), JSON.stringify({
      host: { apiVersion: "999" }, defaultAgent: "absent", enabledAgents: ["worker"], models: { worker: "provider/model" }, permissions: [], plugins: ["plugin", "plugin"], experimental: { subagent_depth: 4 }
    }), "utf8")
    const codes = new Set((await validateBundle(destination)).map((item) => item.code))
    for (const code of ["BUNDLE_ASSET_MISSING", "BUNDLE_COMMAND_SKILL_MISSING", "BUNDLE_PRODUCT_LEAKAGE", "BUNDLE_HOST_API_UNSUPPORTED", "BUNDLE_NESTED_DEPTH_INVALID", "BUNDLE_PLUGIN_DUPLICATE", "BUNDLE_DEFAULT_AGENT_INVALID", "BUNDLE_PERMISSIONS_REQUIRED"]) assert.ok(codes.has(code), code)
  } finally {
    await rm(destination, { recursive: true, force: true })
  }
})
