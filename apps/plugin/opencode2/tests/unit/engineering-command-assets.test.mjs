import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
test("engineering commands are thin shared-skill entrypoints", async () => {
  for (const kind of ["bug","feature","secure"]) { const text=await readFile(new URL(`../../assets/commands/${kind}.md`,import.meta.url),"utf8"); assert.match(text,/skill: engineering-pursuit/); assert.ok(text.length<900); assert.doesNotMatch(text,/gpt-|agent table|github api|octokit|step 1/i) }
})
