import assert from "node:assert/strict"
import test from "node:test"
import { Effect } from "effect"
import plugin from "../../dist/index.js"

test("entrypoint exports the default Effect plugin with a compatibility setup seam", async () => {
  assert.deepEqual(Object.keys(await import("../../dist/index.js")), ["default"])
  assert.equal(plugin.id, "iamsterling.opencode2-config")
  assert.equal(typeof plugin.setup, "function")
  assert.equal(typeof plugin.effect, "function")
  assert.deepEqual(Object.keys(plugin).sort(), ["effect", "id", "setup"])
  assert.equal("server" in plugin, false)
  assert.equal("server" in plugin, false)
})

test("entrypoint redacts a hostile search configuration getter before setup", async () => {
  const secret = ["plugin", "config", "probe", "never", "returned"].join("_")
  const context = { options: new Proxy({}, { get: () => { throw new Error(secret) } }) }
  await assert.rejects(Effect.runPromise(plugin.effect(context)), (error) => {
    assert.equal(error.code, "WEB_SEARCH_RUNTIME_CONFIG_INVALID")
    assert.equal(error.message, "WEB_SEARCH_RUNTIME_CONFIG_INVALID")
    assert.doesNotMatch(`${error.stack}`, new RegExp(secret, "u"))
    return true
  })
})
