import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { buildProvenance } from "./provenance-manifest.mjs"

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"))
const PIN = pkg.dependencies["@opencode-ai/plugin"]
assert.equal(pkg.dependencies["@opencode-ai/plugin"], PIN)
assert.equal(pkg.devDependencies["@opencode-ai/cli"], PIN)
assert.deepEqual(pkg.exports["."], pkg.exports["./server"])

const root = await import("@iamsterling/opencode2-config")
const server = await import("@iamsterling/opencode2-config/server")
assert.strictEqual(root.default, server.default, "root and ./server must resolve to the same runtime object")
assert.deepEqual(Object.keys(root), ["default"])
assert.equal(root.default.id, "iamsterling.opencode2-config")
assert.deepEqual(Object.keys(root.default).sort(), ["effect", "id", "setup"])
assert.equal(typeof root.default.setup, "function")
assert.equal(typeof root.default.effect, "function")

const recorded = JSON.parse(await readFile(new URL("../dist/provenance.json", import.meta.url), "utf8"))
const measured = await buildProvenance()
assert.deepEqual(recorded, measured, "source/build/package/lock provenance is stale")
assert.equal(recorded.package.version, pkg.version)
assert.equal(recorded.resolutions.plugin.pin, PIN)
assert.equal(recorded.resolutions.plugin.lock, PIN)
assert.equal(recorded.resolutions.host.pin, PIN)
assert.equal(recorded.resolutions.host.lock, PIN)
assert.ok(recorded.inputs.some(({ file }) => file === "src/features/ledger/domain.ts"), "formerly omitted transitive source must be attributable")
assert.ok(recorded.inputs.some(({ file }) => file === "src/features/handoff/compiler.mjs"), "tracked runtime modules must be attributable regardless of extension")
assert.match(recorded.resolutions.plugin.integrity, /^sha512-/u)
assert.match(recorded.resolutions.host.integrity, /^sha512-/u)
assert.ok(recorded.outputs.some(({ file }) => file === "dist/index.js"))
assert.deepEqual(recorded.compiledEntrypoint, recorded.outputs.find(({ file }) => file === recorded.entrypoint))
console.log("Built Effect artifact identity and runtime/source/output/package/lock provenance verified")
