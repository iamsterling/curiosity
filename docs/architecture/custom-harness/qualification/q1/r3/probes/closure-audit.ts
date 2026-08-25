import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const value = (name: string) => {
  const index = args.indexOf(name);
  if (index < 0 || index === args.length - 1) {
    throw new Error(`missing ${name}`);
  }
  return args[index + 1];
};
const packageRoot = realpathSync(resolve(value("--package-root")));
const outputPath = resolve(value("--output"));
const packageJson = JSON.parse(
  readFileSync(join(packageRoot, "package.json"), "utf8"),
);
const selected = [
  "effect/Context",
  "effect/Effect",
  "effect/Layer",
  "effect/ManagedRuntime",
];
const wildcard = packageJson.exports["./*"];
if (typeof wildcard !== "string") throw new Error("wildcard export is absent");

const exportPath = (specifier: string) => {
  if (specifier === "effect")
    return resolve(packageRoot, packageJson.exports["."]);
  if (!specifier.startsWith("effect/")) return null;
  return resolve(
    packageRoot,
    wildcard.replace("*", specifier.slice("effect/".length)),
  );
};
const lineAndColumn = (source: string, index: number) => {
  const prefix = source.slice(0, index);
  const lines = prefix.split("\n");
  return { line: lines.length, column: lines.at(-1)!.length + 1 };
};
const oldPattern =
  /(?:from\s*|import\s*\(|export\s+[^;]*?from\s*)["']([^"']+)["']/gu;
const transpiler = new Bun.Transpiler({ loader: "js" });
const pending = selected.map((specifier) => ({
  path: exportPath(specifier)!,
  reachedBy: { rule: "public-package-export", specifier },
}));
const visited = new Set<string>();
const syntaxImports: Array<Record<string, unknown>> = [];
const syntaxExternal: Array<Record<string, unknown>> = [];
const syntaxSelfReferences: Array<Record<string, unknown>> = [];
const oldRuleOffenders: Array<Record<string, unknown>> = [];

while (pending.length > 0) {
  const current = pending.pop()!;
  const path = realpathSync(current.path);
  if (!path.startsWith(`${packageRoot}/`)) {
    throw new Error(`resolved closure escaped package: ${path}`);
  }
  if (visited.has(path)) continue;
  visited.add(path);
  const source = readFileSync(path, "utf8");
  for (const match of source.matchAll(oldPattern)) {
    const specifier = match[1];
    if (specifier.startsWith(".")) continue;
    const location = lineAndColumn(source, match.index);
    oldRuleOffenders.push({
      path,
      specifier,
      rule: "receipt-036-regex-non-relative-is-external",
      matchText: match[0],
      ...location,
    });
  }
  for (const scanned of transpiler.scanImports(source)) {
    const specifier = scanned.path;
    const record = {
      importer: path,
      specifier,
      kind: scanned.kind,
      rule: "bun-transpiler-static-import-scan",
    };
    syntaxImports.push(record);
    if (specifier.startsWith(".")) {
      const target = resolve(dirname(path), specifier);
      if (!target.startsWith(`${packageRoot}/`)) {
        syntaxExternal.push({
          ...record,
          classification: "relative-package-escape",
          resolved: target,
        });
      } else {
        pending.push({ path: target, reachedBy: record });
      }
      continue;
    }
    const selfTarget = exportPath(specifier);
    if (selfTarget) {
      syntaxSelfReferences.push({
        ...record,
        classification: "same-package-public-self-reference",
        resolved: selfTarget,
      });
      pending.push({ path: selfTarget, reachedBy: record });
      continue;
    }
    syntaxExternal.push({
      ...record,
      classification: "external-bare-runtime-import",
    });
  }
}

const oldOnly = oldRuleOffenders.filter(
  (offender) =>
    !syntaxExternal.some(
      (actual) =>
        actual.importer === offender.path &&
        actual.specifier === offender.specifier,
    ),
);
const summary = {
  schemaVersion: "custom-harness-q1-r3-closure-diagnostic/v2",
  event: "summary",
  verdict: syntaxExternal.length === 0 ? "PASS" : "REAL_CANDIDATE_VIOLATION",
  packageRoot,
  selected,
  visitedFileCount: visited.size,
  syntaxImportCount: syntaxImports.length,
  syntaxExternalCount: syntaxExternal.length,
  syntaxSelfReferenceCount: syntaxSelfReferences.length,
  receipt036RegexOffenderCount: oldRuleOffenders.length,
  receipt036FalsePositiveCount: oldOnly.length,
  correctedRule:
    "Use Bun.Transpiler.scanImports; relative imports must remain under the export-resolved package root, same-package public self-references resolve through package exports, and every other bare specifier is a candidate violation.",
};
const records = [
  summary,
  ...oldRuleOffenders.map((entry) => ({
    event: "receipt036-regex-offender",
    ...entry,
  })),
  ...syntaxExternal.map((entry) => ({ event: "syntax-external", ...entry })),
  ...syntaxSelfReferences.map((entry) => ({
    event: "syntax-self-reference",
    ...entry,
  })),
  ...syntaxImports.map((entry) => ({ event: "syntax-import", ...entry })),
];
writeFileSync(
  outputPath,
  `${records.map((record) => JSON.stringify(record)).join("\n")}\n`,
  { flag: "wx", mode: 0o600 },
);
console.log(JSON.stringify(summary));
if (syntaxExternal.length > 0) process.exitCode = 1;
