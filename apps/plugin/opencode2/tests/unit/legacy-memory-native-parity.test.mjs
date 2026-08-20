import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("legacy native parity remains a private verification-only seam", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../../package.json", import.meta.url)),
  );
  assert.ok(
    !Object.keys(manifest.exports).some((name) => name.includes("parity")),
  );
  assert.ok(!manifest.files.some((name) => name.includes("legacy-memory")));
  const source = await readFile(
    new URL(
      "../../tools/verify-legacy-memory-native-parity.mjs",
      import.meta.url,
    ),
    "utf8",
  );
  assert.doesNotMatch(source, /node:net|node:http|node:https|fetch\s*\(/);
});
