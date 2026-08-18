import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("runtime adapter imports only the query package and contains no admin surface", async () => {
  const source = await readFile(new URL("../../src/features/search/runtime-adapter.ts", import.meta.url), "utf8")
  assert.match(source, /@curiosity\/runtime\/query/u)
  assert.doesNotMatch(source, /createCorpusAdmin|AdminCapability|importFixture|\.activate\(|\.withdraw\(|\.delete\(/u)
})
