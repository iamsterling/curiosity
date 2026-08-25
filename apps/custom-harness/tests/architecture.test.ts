import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(import.meta.dir, "../src");
const sources = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sources(target)
      : target.endsWith(".ts")
        ? [target]
        : [];
  });

describe("architecture boundary", () => {
  test("keeps SQLite writes inside the sealed authority boundary", () => {
    const files = sources(sourceRoot);
    const sqliteImports = files.filter((file) =>
      readFileSync(file, "utf8").includes('from "bun:sqlite"'),
    );
    const commitCallers = files.filter((file) =>
      /\.admit\(/u.test(readFileSync(file, "utf8")),
    );

    expect(
      sqliteImports.map((file) => path.relative(sourceRoot, file)).sort(),
    ).toEqual([
      "storage/action-journal.ts",
      "storage/attempt-journal.ts",
      "storage/event-append.ts",
      "storage/event-journal.ts",
      "storage/thread-projection-reader.ts",
      "storage/workflow-journal.ts",
    ]);
    expect(
      commitCallers.map((file) => path.relative(sourceRoot, file)),
    ).toEqual(["kernel/authority.ts"]);

    const reader = readFileSync(
      path.join(sourceRoot, "storage/thread-projection-reader.ts"),
      "utf8",
    );
    const nodeReader = readFileSync(
      path.join(sourceRoot, "storage/node-thread-projection-reader.ts"),
      "utf8",
    );
    expect(reader).toMatch(/readonly:\s*true/u);
    expect(nodeReader).toMatch(/readOnly:\s*true/u);
    for (const source of [reader, nodeReader])
      expect(source).not.toMatch(/\.(?:exec|run|transaction)\(/u);
  });

  test("registers stock plugins statically and exposes no dynamic loader", () => {
    const files = sources(sourceRoot);
    const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
    const registry = readFileSync(
      path.join(sourceRoot, "plugins/registry.ts"),
      "utf8",
    );

    expect(registry).toContain('from "./thread.js"');
    expect(registry).toContain("new StaticPluginCatalog(stockPlugins)");
    expect(source).not.toMatch(/\bimport\s*\(/u);
    expect(source).not.toContain("Plugin.define");
    expect(source).not.toContain("StaticPluginRegistry");
    expect(source).not.toContain("AuthorityPlugin");
  });

  test("keeps semantic plugins capability-free", () => {
    const semanticPlugins = sources(path.join(sourceRoot, "plugins")).filter(
      (file) => path.basename(file) !== "registry.ts",
    );
    const forbiddenImport =
      /from "(?:bun:[^"]+|node:[^"]+|ai|@ai-sdk\/[^"/]+|@openai-oauth\/[^"/]+|(?:\.\.\/)+(?:providers|storage|supervisor)\/|(?:\.\.\/)+kernel\/(?!(?:errors|plugin)\.js")[^"]+)/u;
    const forbiddenAmbientEffect =
      /\b(?:Date\.now|Math\.random|process\.|Bun\.|Deno\.|fetch\s*\(|WebSocket|EventSource|globalThis)/u;

    for (const file of semanticPlugins) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(forbiddenImport);
      expect(source).not.toMatch(forbiddenAmbientEffect);
      expect(source).toContain("manifest:");
    }
  });

  test("keeps chat workflow out of the authority and provider streams behind the gateway", () => {
    const authority = readFileSync(
      path.join(sourceRoot, "kernel/authority.ts"),
      "utf8",
    );
    const files = sources(sourceRoot);
    const streamConsumers = files
      .filter((file) => /\.stream\(\{/u.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(sourceRoot, file));

    expect(authority).not.toContain("chat.turn");
    expect(authority).not.toContain("decodeChatTurnPayload");
    expect(authority).not.toMatch(
      /(?:message\.appended|turn\.(?:failed|requested))/u,
    );
    expect(streamConsumers).toEqual(["kernel/provider-gateway.ts"]);
  });
});
