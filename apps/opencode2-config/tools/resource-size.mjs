import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { verifyProvenanceObject } from "./provenance-objects.mjs"

const root = path.resolve(import.meta.dirname, "..")
const baselineName = process.argv[2] ?? "74fe8c5"
const baseline = JSON.parse(await readFile(path.join(root, `provenance/manifests/resource-baseline-${baselineName}.json`), "utf8"))
const prefixes = ["agents/", "commands/", "config/agents/", "skills/"]
const baselineFiles = baseline.files.filter(({ path: name }) => prefixes.some((prefix) => name.startsWith(prefix)))
const baselineObjects = await Promise.all(baselineFiles.map((file) => verifyProvenanceObject(root, `resource-baseline-${baselineName}.json`, file, { requireSize: true })))
const baselineBytes = baselineObjects.reduce((sum, bytes) => sum + bytes.byteLength, 0)
const walk = async (directory) => (await Promise.all((await readdir(directory, { withFileTypes: true })).map(async (entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat()
const currentFiles = (await walk(path.join(root, "assets"))).filter((name) => /assets\/(?:commands|config\/agents|skills)\//.test(name))
const currentBytes = (await Promise.all(currentFiles.map(async (name) => (await readFile(name)).byteLength))).reduce((sum, size) => sum + size, 0)
process.stdout.write(`${JSON.stringify({ metric: "source-size-only", baseline: baseline.baselineCommit, baselineFiles: baselineFiles.length, baselineBytes, currentFiles: currentFiles.length, currentBytes, reductionBytes: baselineBytes - currentBytes, reductionPercent: Number((((baselineBytes - currentBytes) / baselineBytes) * 100).toFixed(2)) }, null, 2)}\n`)
if (currentBytes >= baselineBytes) process.exitCode = 1
