import { describe, expect, test } from "bun:test";
import { readFile, realpath } from "node:fs/promises";
import { dirname, join, normalize, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dir, "../../../../../..");
const effectRoot = join(
  repositoryRoot,
  "node_modules/.bun/effect@4.0.0-beta.107/node_modules/effect",
);
const selectedEntries = [
  "Context.js",
  "Effect.js",
  "Layer.js",
  "ManagedRuntime.js",
];

const transpiler = new Bun.Transpiler({ loader: "js" });
const staticSpecifiers = (source: string) =>
  transpiler.scanImports(source).map((entry) => entry.path);

const selectedImportClosure = async () => {
  const pending = selectedEntries.map((entry) =>
    join(effectRoot, "dist", entry),
  );
  const visited = new Set<string>();
  const bare = new Set<string>();

  while (pending.length > 0) {
    const file = normalize(pending.pop()!);
    if (visited.has(file)) continue;
    visited.add(file);
    const source = await readFile(file, "utf8");
    for (const specifier of staticSpecifiers(source)) {
      if (!specifier.startsWith(".")) {
        bare.add(specifier);
        continue;
      }
      const dependency = resolve(dirname(file), specifier);
      if (!dependency.startsWith(join(effectRoot, "dist") + "/")) {
        bare.add(`outside:${specifier}`);
        continue;
      }
      pending.push(dependency);
    }
  }

  return { bare: [...bare].sort(), files: [...visited].sort() };
};

describe("Q1-W02 Effect dependency boundary", () => {
  test("the selected stable composition subpaths have no external runtime import", async () => {
    const closure = await selectedImportClosure();
    expect(closure.files.length).toBeGreaterThan(20);
    expect(closure.bare).toEqual([]);
  });

  test("the plugin pin and lock artifact resolve to one physical Effect package", async () => {
    const direct = await realpath(effectRoot);
    const plugin = await realpath(
      join(repositoryRoot, "apps/plugin/opencode2/node_modules/effect"),
    );
    expect(plugin).toBe(direct);

    const lock = await readFile(join(repositoryRoot, "bun.lock"), "utf8");
    const packageEntries = [
      ...lock.matchAll(/^\s+"effect": \["effect@([^"]+)"/gm),
    ].map((match) => match[1]);
    expect(packageEntries).toEqual(["4.0.0-beta.107"]);
  });
});
