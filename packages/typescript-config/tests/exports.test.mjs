import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("every TypeScript configuration export loads as JSON with compiler options", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.deepEqual(manifest.exports, {
    "./base.json": "./base.json",
    "./nextjs.json": "./nextjs.json",
    "./react-library.json": "./react-library.json",
  });
  for (const target of Object.values(manifest.exports)) {
    const configuration = JSON.parse(await readFile(new URL(`..${target.slice(1)}`, import.meta.url), "utf8"));
    assert.equal(typeof configuration.compilerOptions, "object", target);
  }
});
