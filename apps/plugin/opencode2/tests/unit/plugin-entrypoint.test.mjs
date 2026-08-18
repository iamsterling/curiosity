import assert from "node:assert/strict"
import test from "node:test"
import plugin from "../../dist/index.js"

test("entrypoint exports only the default Promise plugin module", async () => {
  assert.deepEqual(Object.keys(await import("../../dist/index.js")), ["default"])
  assert.equal(plugin.id, "iamsterling.opencode2-config")
  assert.equal(typeof plugin.setup, "function")
  assert.deepEqual(Object.keys(plugin).sort(), ["id", "setup"])
  assert.equal("server" in plugin, false)
  assert.equal("effect" in plugin, false)
})
