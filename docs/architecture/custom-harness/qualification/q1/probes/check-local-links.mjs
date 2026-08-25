import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const markdownFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.isFile() && entry.name.endsWith(".md") ? [path] : [];
  });

let checked = 0;
const failures = [];
for (const file of markdownFiles(root)) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].trim();
    if (
      !target ||
      target.startsWith("#") ||
      target.includes("://") ||
      target.startsWith("mailto:")
    )
      continue;
    const withoutAnchor = target.split("#", 1)[0];
    const path = resolve(dirname(file), decodeURIComponent(withoutAnchor));
    checked += 1;
    if (
      !existsSync(path) ||
      (!lstatSync(path).isFile() && !lstatSync(path).isDirectory())
    ) {
      failures.push(`${file}: ${target}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Q1 local links checked: ${checked}; failures: 0`);
