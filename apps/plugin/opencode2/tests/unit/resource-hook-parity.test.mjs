import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import test from "node:test"

const root = process.cwd()
const baseline = JSON.parse(await readFile(path.join(root, "provenance/manifests/resource-baseline-74fe8c5.json"), "utf8"))
const baselineFiles = new Map(baseline.files.map((file) => [file.path, file]))
const prompt = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8")).system ?? ""
const oldPrompt = async (file) => {
  const entry = baselineFiles.get(file.replace(/^assets\//, ""))
  assert.ok(entry, `missing preserved baseline entry for ${file}`)
  return JSON.parse(await readFile(path.join(root, "provenance/objects/sha256", entry.sha256), "utf8")).system ?? ""
}

test("agent prompt source bytes are lower than the preserved baseline", async () => {
  const files = (await readdir(path.join(root, "assets/config/agents"))).filter((name) => name.endsWith(".json"))
  const current = (await Promise.all(files.map((name) => prompt(`assets/config/agents/${name}`)))).join("")
  const previous = (await Promise.all(files.map((name) => oldPrompt(`assets/config/agents/${name}`)))).join("")
  assert.ok(Buffer.byteLength(current) < Buffer.byteLength(previous), `${Buffer.byteLength(current)} must be below ${Buffer.byteLength(previous)}`)
})

test("all prompt and resource source bytes are lower than the preserved baseline", async () => {
  const paths = []
  const walk = async (relative) => {
    for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
      const child = path.join(relative, entry.name)
      if (entry.isDirectory()) await walk(child)
      else paths.push(child)
    }
  }
  for (const directory of ["assets/config/agents", "assets/commands", "assets/skills"]) await walk(directory)
  const current = (await Promise.all(paths.map((file) => readFile(path.join(root, file))))).reduce((sum, body) => sum + body.byteLength, 0)
  const previous = paths.reduce((sum, file) => sum + (baselineFiles.get(file.replace(/^assets\//, ""))?.size ?? 0), 0)
  assert.ok(current < previous, `${current} must be below ${previous}`)
})

test("reviewer is a mechanical findings allowlist without rationale or suspected-defect prose", async () => {
  const system = await prompt("assets/config/agents/reviewer.json")
  assert.match(system, /allowlist/i)
  assert.doesNotMatch(system, /rationale|suspect(?:ed)? defects?/i)
  assert.match(system, /file:line|stable category/i)
})

test("research keeps bounded curiosity semantics and rejects live autonomous curiosity", async () => {
  const researcher = await prompt("assets/config/agents/researcher.json")
  assert.match(researcher, /curiosity/i)
  assert.match(researcher, /CURIOSITY_NO_GO/)
  assert.match(researcher, /no live autonomous curiosity/i)
})

test("command and help inventory is filesystem-generatable", async () => {
  const commands = (await readdir(path.join(root, "assets/commands"))).filter((name) => name.endsWith(".md")).sort()
  assert.ok(commands.includes("loop-help.md"))
  assert.equal(new Set(commands.map((name) => name.slice(0, -3))).size, commands.length)
  for (const name of commands) assert.match(await readFile(path.join(root, "assets/commands", name), "utf8"), /^---\n/)
})
