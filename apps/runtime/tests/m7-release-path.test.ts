import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("M7 release native lookup is release-relative and never falls back to target/debug", () => {
  const source = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
  expect(source).toContain("native/libcuriosity_runtime_native");
  expect(source).toContain('nativeProfile?: "development" | "release"');
  expect(source).not.toMatch(/libraryPath\s*\?\?\s*nativeLibraryPath\(\)/);
});
