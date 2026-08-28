import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Kernel and services are zero-IO and stable-module-only: `effect/unstable/*`
 * imports are confined to the http/ adapter layer (design §2). This test
 * enforces that boundary by scanning the source tree.
 */

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (entry.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

describe("module boundaries", () => {
  for (const area of ["kernel", "services"]) {
    const dir = path.join(__dirname, "..", "..", "src", area);
    if (!statSync(dir).isDirectory()) continue;
    const files = walk(dir).filter((f) => !f.endsWith(".test.ts"));
    it(`${area} imports no effect/unstable modules`, () => {
      const offenders = files.filter((f) => readFileSync(f, "utf8").includes("effect/unstable"));
      expect(offenders, offenders.join("\n")).toEqual([]);
    });
  }
});
