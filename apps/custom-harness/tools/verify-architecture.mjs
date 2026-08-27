#!/usr/bin/env node
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "src");
const walk = async (directory, extension = ".ts") =>
  (
    await Promise.all(
      (await readdir(directory, { withFileTypes: true })).map((entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory()
          ? walk(target, extension)
          : target.endsWith(extension)
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
    "storage/delegation-journal.ts",
    "storage/event-append.ts",
    "storage/event-journal.ts",
    "storage/research-evidence-reader.ts",
    "storage/thread-projection-reader.ts",
    "storage/workflow-journal.ts",
  ],
  "SQLite must remain behind sealed journals and read-only projection readers",
);
const projectionReader = texts.get(
  path.join(sourceRoot, "storage/thread-projection-reader.ts"),
);
assert.match(projectionReader, /readonly:\s*true/u);
const researchEvidenceReader = texts.get(
  path.join(sourceRoot, "storage/research-evidence-reader.ts"),
);
assert.match(researchEvidenceReader, /readonly:\s*true/u);
const nodeProjectionReader = texts.get(
  path.join(sourceRoot, "storage/node-thread-projection-reader.ts"),
);
assert.match(nodeProjectionReader, /readOnly:\s*true/u);
for (const reader of [
  projectionReader,
  nodeProjectionReader,
  researchEvidenceReader,
])
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
const ambientRuntimeReference = (file, source) => {
  const parsed = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let found;
  const visit = (node) => {
    if (found) return;
    if (
      ts.isPropertyAccessExpression(node) &&
      ((ts.isIdentifier(node.expression) &&
        ["Bun", "Deno", "process"].includes(node.expression.text)) ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "Date" &&
          node.name.text === "now") ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "Math" &&
          node.name.text === "random"))
    )
      found = node.getText(parsed);
    if (
      ts.isIdentifier(node) &&
      ["EventSource", "WebSocket", "fetch", "globalThis"].includes(node.text)
    )
      found = node.text;
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  return found;
};
for (const file of semanticPlugins) {
  assert.doesNotMatch(
    texts.get(file),
    forbiddenSemanticImport,
    `${relative(file)} must remain capability-free`,
  );
  assert.equal(
    ambientRuntimeReference(file, texts.get(file)),
    undefined,
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
const nativeTuiRoot = path.join(root, "native/tui");
const goFiles = await walk(nativeTuiRoot, ".go");
const goTexts = await Promise.all(goFiles.map((file) => readFile(file, "utf8")));
const forbiddenGoAuthority =
  /"(?:database\/sql|os\/exec|net\/http|crypto\/(?:ed25519|hmac|rsa))"|CURIOSITY_AUTH_SECRET|event\.append|tool\.dispatch/u;
for (const [index, text] of goTexts.entries())
  assert.doesNotMatch(
    text,
    forbiddenGoAuthority,
    `${path.relative(nativeTuiRoot, goFiles[index])} must remain presentation-only`,
  );
const goModule = await readFile(path.join(nativeTuiRoot, "go.mod"), "utf8");
for (const dependency of [
  "charm.land/bubbles/v2 v2.2.1",
  "charm.land/bubbletea/v2 v2.0.9",
  "charm.land/lipgloss/v2 v2.0.6",
])
  assert.match(goModule, new RegExp(`^\\s*${dependency.replaceAll(".", "\\.")}$`, "mu"));
console.log(
  `custom harness architecture verified (${files.length} TypeScript and ${goFiles.length} Go source files)`,
);
