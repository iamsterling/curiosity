import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import inventory from "../../../packages/curiosity-authority/tests/fixtures/kernel-semantics-v1.json" with {
  type: "json",
};

describe("desktop semantic golden oracles", () => {
  test("keeps every H0 inventory entry bound to a named executable desktop test", () => {
    for (const golden of inventory.cases) {
      const source = readFileSync(
        path.join(import.meta.dir, golden.desktopOracle.file),
        "utf8",
      );
      expect(source).toContain(`test("${golden.desktopOracle.test}"`);
    }
  });
});
