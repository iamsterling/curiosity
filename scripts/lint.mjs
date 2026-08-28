import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignored = new Set(["node_modules", ".git", ".turbo", ".next", ".aidlc", ".opencode", "aidlc", "dist", "build"]);
const failures = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(filePath);
    else if (/\.(mjs|ts|tsx)$/u.test(entry.name)) {
      const source = await readFile(filePath, "utf8");
      if (/console\.log\s*\(/u.test(source)) failures.push(`${path.relative(root, filePath)}: console.log is not permitted`);
      if (/TODO\s*:\s*(?:stub|implement)/iu.test(source)) failures.push(`${path.relative(root, filePath)}: unresolved implementation TODO`);
      const relative = path.relative(root, filePath);
      // The kernel subpath is the React-free half of the editor package. A
      // react import here would drag the DOM into the logic that scene-model
      // consumers (renderer, store, CLI) depend on — and invite chrome state
      // into the document. Fail loudly.
      if (relative.startsWith("packages/editor/src/kernel/") && /from ["']react(?:-dom)?["']/u.test(source)) {
        failures.push(`${relative}: react import in the kernel subpath is not permitted`);
      }
    }
  }
}

await walk(root);
if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
}
