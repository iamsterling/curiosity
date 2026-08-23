import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("every ESLint configuration export loads its exact named array", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const expected = {
    "./base": { target: "./base.js", name: "config" },
    "./next-js": { target: "./next.js", name: "nextJsConfig" },
    "./react-internal": { target: "./react-internal.js", name: "config" },
  };
  assert.deepEqual(manifest.exports, Object.fromEntries(
    Object.entries(expected).map(([subpath, { target }]) => [subpath, target]),
  ));
  for (const { target, name } of Object.values(expected)) {
    const loaded = await import(new URL(`..${target.slice(1)}`, import.meta.url));
    assert.deepEqual(Object.keys(loaded), [name], target);
    assert.equal(Array.isArray(loaded[name]), true, target);
  }
});
