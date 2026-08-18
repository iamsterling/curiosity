import { expect, test } from "bun:test";
import { resolve } from "node:path";
import * as query from "../src/query.js";

test("query-only package surface has no administrative capability or mutation API", () => {
  expect(Object.keys(query).sort()).toEqual(["createQueryRuntime", "queryRuntimeCapabilities"]);
  expect("createCorpusAdmin" in query).toBe(false);
  expect("AdminCapability" in query).toBe(false);
});

test("query runtime rejects non-canonical, in-package, and unbounded authority configuration before opening", () => {
  const outside = resolve(import.meta.dir, "../../../query-runtime-state");
  const workspace = resolve(import.meta.dir, "../../../../workspace");
  const valid = { stateRoot: outside, workspaceScope: workspace, queryCapability: new Uint8Array([1]) };
  for (const options of [
    { ...valid, stateRoot: "relative" },
    { ...valid, stateRoot: `${outside}/../query-runtime-state` },
    { ...valid, stateRoot: resolve(import.meta.dir, "../state") },
    { ...valid, workspaceScope: "relative" },
    { ...valid, workspaceScope: `${workspace}/../workspace` },
    { ...valid, workspaceScope: `/${"x".repeat(4096)}` },
    { ...valid, queryCapability: new Uint8Array() },
    { ...valid, queryCapability: new Uint8Array(257) },
  ]) expect(() => query.createQueryRuntime(options)).toThrow("QUERY_RUNTIME_CONFIG_INVALID");
});
