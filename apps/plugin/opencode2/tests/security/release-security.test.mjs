import assert from "node:assert/strict"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "../..")
const walk = async (directory) => (await Promise.all((await readdir(directory, { withFileTypes: true })).map(async (entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat()

test("product has no autonomous or imported lifecycle runtime", async () => {
  const product = [...await walk(path.join(root, "src")), ...await walk(path.join(root, "assets"))]
  for (const file of product.filter((item) => /\.(?:ts|mjs|js|md|json)$/.test(item))) {
    const source = await readFile(file, "utf8")
    const relative = path.relative(root, file)
    assert.doesNotMatch(source, /child_process|\bspawn\s*\(|\bexecFile\s*\(|setInterval\s*\(|fs\.watch\s*\(|simple-git|nodegit/, relative)
    assert.equal((source.match(/setTimeout\s*\(/gu) ?? []).length, relative === "src/features/search/searxng-adapter.ts" ? 1 : 0, relative)
    if (relative === "src/features/search/searxng-adapter.ts") {
      assert.match(source, /controller\.abort\(\)/u)
      assert.match(source, /finally \{\s+clearTimeout\(timer\)/u)
    }
    assert.doesNotMatch(source, /opencode-loop-local|\[opencode-loop:/, relative)
  }
})

test("release artifact excludes TypeScript source", async () => {
  const release = await walk(path.join(root, "dist"))
  assert.equal(release.some((file) => file.endsWith(".ts") && !file.endsWith(".d.ts")), false)
})
