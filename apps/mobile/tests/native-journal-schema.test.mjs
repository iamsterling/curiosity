import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "bun:test";

test("mobile native journal re-hosts the exact desktop schema v15 SQL", async () => {
  const [desktopSource, mobileSchema] = await Promise.all([
    readFile(
      new URL(
        "../../custom-harness/src/storage/event-schema.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/curiosity-runtime/native/src/schema-v15.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  const firstBacktick = desktopSource.indexOf("`");
  const lastBacktick = desktopSource.lastIndexOf("`");
  assert.notEqual(firstBacktick, -1);
  assert.ok(lastBacktick > firstBacktick);
  const desktopSchema = desktopSource
    .slice(firstBacktick + 1, lastBacktick)
    .trim();

  assert.equal(mobileSchema.trim(), desktopSchema);
  assert.match(mobileSchema, /schema_version', '15'/u);
});
