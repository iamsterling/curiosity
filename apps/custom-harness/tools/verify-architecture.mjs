#!/usr/bin/env node
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "src");
const walk = async (directory) =>
  (
    await Promise.all(
      (await readdir(directory, { withFileTypes: true })).map((entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory()
          ? walk(target)
          : target.endsWith(".ts")
            ? [target]
            : [];
      }),
    )
  ).flat();

const files = await walk(sourceRoot);
const texts = new Map(
  await Promise.all(
    files.map(async (file) => [file, await readFile(file, "utf8")]),
  ),
);
const relative = (file) =>
  path.relative(sourceRoot, file).replaceAll("\\", "/");

assert.deepEqual(
  files
    .filter((file) => texts.get(file).includes('from "bun:sqlite"'))
    .map(relative)
    .sort(),
  [
    "storage/action-journal.ts",
    "storage/attempt-journal.ts",
    "storage/event-append.ts",
    "storage/event-journal.ts",
    "storage/thread-projection-reader.ts",
    "storage/workflow-journal.ts",
  ],
  "SQLite must remain behind sealed journals and read-only projection readers",
);
const projectionReader = texts.get(
  path.join(sourceRoot, "storage/thread-projection-reader.ts"),
);
assert.match(projectionReader, /readonly:\s*true/u);
const nodeProjectionReader = texts.get(
  path.join(sourceRoot, "storage/node-thread-projection-reader.ts"),
);
assert.match(nodeProjectionReader, /readOnly:\s*true/u);
for (const reader of [projectionReader, nodeProjectionReader])
  assert.doesNotMatch(
    reader,
    /\.(?:exec|run|transaction)\(/u,
    "a projection reader may not expose a SQLite write operation",
  );
assert.deepEqual(
  files.filter((file) => /\.admit\(/u.test(texts.get(file))).map(relative),
  ["kernel/authority.ts"],
  "only the Effect authority may admit durable commands",
);
assert.deepEqual(
  files
    .filter((file) =>
      /from "(?:ai|@ai-sdk\/[^"/]+|@openai-oauth\/[^"/]+)"/u.test(
        texts.get(file),
      ),
    )
    .map(relative),
  ["providers/ai-sdk.ts"],
  "AI SDK and provider packages must remain behind the provider adapter",
);
assert.deepEqual(
  files
    .filter((file) =>
      /from "(?:marked|marked-terminal)"/u.test(texts.get(file)),
    )
    .map(relative),
  ["tui/markdown.ts", "types/marked-terminal.d.ts"],
  "Markdown packages must remain behind terminal projection adapters",
);
assert.equal(
  [...texts.values()].some((text) => /@?opentui/u.test(text)),
  false,
  "the independent terminal client must not import OpenTUI",
);
assert.deepEqual(
  files.filter((file) => /\.stream\(\{/u.test(texts.get(file))).map(relative),
  ["kernel/provider-gateway.ts"],
  "only the provider gateway may consume provider streams",
);
const authority = texts.get(path.join(sourceRoot, "kernel/authority.ts"));
assert.doesNotMatch(authority, /chat\.turn|decodeChatTurnPayload/u);
assert.doesNotMatch(
  authority,
  /(?:message\.appended|turn\.(?:failed|requested))/u,
  "chat workflow events must remain plugin-owned",
);
assert.equal(
  [...texts.values()].some((text) => /\bimport\s*\(/u.test(text)),
  false,
  "dynamic imports are forbidden",
);
const semanticPlugins = files.filter(
  (file) =>
    path.dirname(file) === path.join(sourceRoot, "plugins") &&
    path.basename(file) !== "registry.ts",
);
const forbiddenSemanticImport =
  /from "(?:bun:[^"]+|node:[^"]+|ai|@ai-sdk\/[^"/]+|@openai-oauth\/[^"/]+|(?:\.\.\/)+(?:providers|storage|supervisor)\/|(?:\.\.\/)+kernel\/(?!(?:errors|plugin)\.js")[^"]+)/u;
const forbiddenSemanticAmbientEffect =
  /\b(?:Date\.now|Math\.random|process\.|Bun\.|Deno\.|fetch\s*\(|WebSocket|EventSource|globalThis)/u;
for (const file of semanticPlugins) {
  assert.doesNotMatch(
    texts.get(file),
    forbiddenSemanticImport,
    `${relative(file)} must remain capability-free`,
  );
  assert.doesNotMatch(
    texts.get(file),
    forbiddenSemanticAmbientEffect,
    `${relative(file)} must not read ambient runtime state`,
  );
  assert.match(texts.get(file), /manifest:/u);
}
assert.equal(
  [...texts.values()].some((text) =>
    /(?:StaticPluginRegistry|AuthorityPlugin)/u.test(text),
  ),
  false,
  "the v1 plugin contract must not remain in the harness",
);
assert.match(
  texts.get(path.join(sourceRoot, "plugins/registry.ts")),
  /from "\.\/chat\.js"/u,
);
assert.match(
  texts.get(path.join(sourceRoot, "plugins/registry.ts")),
  /from "\.\/thread\.js"/u,
);
assert.match(
  texts.get(path.join(sourceRoot, "plugins/registry.ts")),
  /new StaticPluginCatalog\(stockPlugins\)/u,
);
console.log(
  `custom harness architecture verified (${files.length} source files)`,
);
