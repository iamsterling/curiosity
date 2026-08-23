import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const workflow = await readFile(new URL("../../../../../.github/workflows/opencode2.yml", import.meta.url), "utf8")

test("third-party CI actions are pinned to immutable commit SHAs", () => {
  for (const line of workflow.split("\n").filter((value) => value.includes("uses:"))) {
    assert.match(line, /@[0-9a-f]{40}\s+#\s+v\d+(?:\.\d+(?:\.\d+)?)?$/)
  }
})
