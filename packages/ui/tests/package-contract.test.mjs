import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("UI wildcard exports resolve only to the reviewed starter source modules", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.deepEqual(manifest.exports, { "./*": "./src/*.tsx" });
  for (const module of ["button", "card", "code"]) await access(new URL(`../src/${module}.tsx`, import.meta.url));
});
