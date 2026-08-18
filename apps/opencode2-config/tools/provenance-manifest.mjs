import { createHash } from "node:crypto"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { findWorkspaceRoot } from "./workspace-root.mjs"

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex")
const walk = async (root, relative = "") => {
  const entries = await readdir(path.join(root, relative), { withFileTypes: true })
  const files = []
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const child = path.join(relative, entry.name)
    if (entry.isDirectory()) files.push(...await walk(root, child))
    else if (entry.isFile()) files.push(child.split(path.sep).join("/"))
  }
  return files
}
const records = async (root, files) => Promise.all(files.map(async (file) => ({ file, sha256: hash(await readFile(path.join(root, file))) })))
const digestRecords = (items) => hash(Buffer.from(items.map(({ file, sha256 }) => `${file}\0${sha256}\n`).join("")))
/** Runtime inputs are the actual source tree, not the repository's index. */
const runtimeInputs = async (root) => [
  ...(await walk(path.join(root, "src"))).map((file) => `src/${file}`),
  "package.json",
  "tsconfig.json",
  "tsconfig.build.json",
].sort()

const parseLock = (lock) => JSON.parse(lock.replace(/,\s*([}\]])/gu, "$1"))

export const buildProvenance = async (root = repositoryRoot) => {
  const workspaceRoot = await findWorkspaceRoot(root)
  const buildInputFiles = await runtimeInputs(root)
  const outputFiles = (await walk(path.join(root, "dist"))).filter((file) => file !== "provenance.json").map((file) => `dist/${file}`)
  const [packageInputs, outputs, lock] = await Promise.all([
    records(root, buildInputFiles),
    records(root, outputFiles),
    readFile(path.join(workspaceRoot, "bun.lock"), "utf8"),
  ])
  const inputs = [...packageInputs, { file: "workspace:bun.lock", sha256: hash(lock) }]
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"))
  const parsedLock = parseLock(lock)
  const workspacePackage = parsedLock.workspaces?.[path.relative(workspaceRoot, root).split(path.sep).join("/")]
  const pluginPin = pkg.dependencies["@opencode-ai/plugin"]
  const hostPin = pkg.devDependencies["@opencode-ai/cli"]
  return {
    schemaVersion: 1,
    inputs,
    inputDigest: digestRecords(inputs),
    outputs,
    outputDigest: digestRecords(outputs),
    compiledEntrypoint: outputs.find(({ file }) => file === "dist/index.js"),
    package: { name: pkg.name, version: pkg.version, exports: pkg.exports },
    resolutions: {
      plugin: { pin: pluginPin, lock: workspacePackage?.dependencies?.["@opencode-ai/plugin"], integrity: parsedLock.packages?.["@opencode-ai/plugin"]?.[3] },
      host: { pin: hostPin, lock: workspacePackage?.devDependencies?.["@opencode-ai/cli"], integrity: parsedLock.packages?.["@opencode-ai/cli"]?.[3] },
    },
    entrypoint: "dist/index.js",
  }
}
