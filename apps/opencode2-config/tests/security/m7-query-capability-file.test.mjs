import assert from "node:assert/strict"
import { chmod, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { createSearchDefinitions } from "../../dist/features/search/index.js"

const configuration = (queryCapabilityFile, seen = []) => ({
  backend: "runtime",
  runtime: {
    stateRoot: "/operator/state",
    workspaceScope: "/operator/workspace",
    queryCapabilityFile,
    instance: {
      webSearch: (_request, principal) => { seen.push([...principal.queryCapability]); return { status: "ok", results: [] } },
      close: () => {},
    },
  },
  controlledPluginIds: ["iamsterling.opencode2-config"],
})

test("M7 capability file is canonical, regular, owned, 0600, bounded, copied once, and redacted", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "m7-capability-")))
  await chmod(root, 0o700)
  const good = join(root, "query.cap")
  const link = join(root, "query-link.cap")
  const credential = ["m7", "credential", "canary", "never", "disclosed"].join("_")
  try {
    await writeFile(good, credential, { mode: 0o600 })
    const seen = []
    const definitions = createSearchDefinitions(configuration(good, seen))
    await writeFile(good, "changed", { mode: 0o600 })
    await definitions[0].execute({ query: "x" }, { agent: "researcher" }).pipe((effect) => import("effect").then(({ Effect }) => Effect.runPromise(effect)))
    assert.deepEqual(seen, [[...Buffer.from(credential)]], "authority bytes are read and copied exactly once")
    definitions.cleanup()

    await symlink(good, link)
    for (const [candidate, prepare] of [
      [link],
      [good, () => chmod(good, 0o640)],
      [good, async () => { await chmod(good, 0o600); await writeFile(good, Buffer.alloc(257), { mode: 0o600 }) }],
      [join(root, "missing")],
      ["relative.cap"],
    ]) {
      if (prepare) await prepare()
      assert.throws(() => createSearchDefinitions(configuration(candidate)), (error) => {
        assert.equal(error.code, "WEB_SEARCH_RUNTIME_CONFIG_INVALID")
        assert.equal(error.message, "WEB_SEARCH_RUNTIME_CONFIG_INVALID")
        assert.doesNotMatch(`${error.stack}`, new RegExp(`${credential}|query-link|query\\.cap`, "u"))
        return true
      })
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("M7 deployment configuration refuses credential bytes alongside a capability file", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "m7-capability-both-")))
  const file = join(root, "query.cap")
  try {
    await chmod(root, 0o700)
    await writeFile(file, "x", { mode: 0o600 })
    const options = configuration(file)
    options.runtime.queryCapability = new Uint8Array([1])
    assert.throws(() => createSearchDefinitions(options), { code: "WEB_SEARCH_RUNTIME_CONFIG_INVALID" })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
