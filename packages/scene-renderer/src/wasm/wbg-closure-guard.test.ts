import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Build-invariant test: the generated wasm-bindgen glue must carry the
 * zeroed-slot guard (scripts/patch-wbg-closures.mjs). wasm-bindgen-futures
 * frees a JsFuture's once-closures at settlement; a browser firing a cleared
 * reaction again calls the freed wrapper, which calls into wasm with a
 * zeroed slot pointer and wasm throws "closure invoked recursively or after
 * being dropped". The guard turns that into a logged no-op. Every
 * `build:wasm` regenerates the glue and re-applies the patch; this test
 * fails loudly if a build ever ships the raw (unguarded) shape.
 */

const pkgPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../pkg/crafty_renderer_wasm.js",
);
const glue = readFileSync(pkgPath, "utf8");

describe("wasm-bindgen zeroed-slot guard (build invariant)", () => {
  it("the generated glue carries the guard before the wasm invocation", () => {
    expect(glue).toContain("wbg-closure-guard");
    const guard = glue.indexOf("wbg-closure-guard");
    const invocation = glue.indexOf("return f(a, state.b, ...args)");
    expect(invocation).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(invocation);
  });

  it("a zeroed slot returns without calling into wasm", () => {
    const guardBlock = glue.slice(glue.indexOf("wbg-closure-guard"), glue.indexOf("wbg-closure-guard") + 600);
    expect(guardBlock).toContain("if (a === 0) {");
    expect(guardBlock).toContain("return;");
  });
});
