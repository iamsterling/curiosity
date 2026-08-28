import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourcePath = path.join(import.meta.dirname, "font-security-harness.mjs");
const outputPath = process.argv[2] ?? path.join(import.meta.dirname, "font-security-harness.mutant.mjs");
let source = await readFile(sourcePath, "utf8");
const mutations = [
  [
    'if (fixtureCount > CEILINGS.fixtureCount) reject("HARNESS_FIXTURE_COUNT_EXCEEDED");',
    'if (false && fixtureCount > CEILINGS.fixtureCount) reject("HARNESS_FIXTURE_COUNT_EXCEEDED");',
  ],
  [
    'const abort = () => terminate("HARNESS_CONTROLLER_CANCELLED");',
    'const abort = () => {}; // MUTATION: cancellation control bypassed',
  ],
];
for (const [before, after] of mutations) {
  if (!source.includes(before)) throw new Error(`MUTATION_TARGET_MISSING:${before}`);
  source = source.replace(before, after);
}
await writeFile(outputPath, source);
process.stdout.write(`${JSON.stringify({ diagnostic: "HARNESS_MUTANT_WRITTEN", outputPath, controlsRemoved: ["fixture-admission", "controller-cancellation"] })}\n`);
