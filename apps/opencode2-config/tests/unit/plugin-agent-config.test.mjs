import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { bundledAgentDefinitions } from "../../dist/features/config/agents.js"

test("compiled plugin agent definitions match the reviewed bundle assets", async () => {
  const assets = Object.fromEntries(await Promise.all(Object.keys(bundledAgentDefinitions).map(async (id) => {
    const definition = JSON.parse(await readFile(new URL(`../../assets/config/agents/${id}.json`, import.meta.url), "utf8"))
    delete definition.modelKey
    return [id, definition]
  })))
  assert.deepEqual(bundledAgentDefinitions, assets)
})
