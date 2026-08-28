import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignored = new Set(["node_modules", ".git", ".turbo", ".next", ".aidlc", ".opencode", "aidlc", "dist", "build", "webview/dist"]);
const failures = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(filePath);
    else if (/\.(mjs|ts|tsx|json)$/u.test(entry.name)) {
      const source = await readFile(filePath, "utf8");
      if (source.includes("\r\n") || /[ \t]+$/mu.test(source)) failures.push(`${path.relative(root, filePath)}: non-canonical whitespace`);
    }
  }
}

await walk(root);
if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
}
