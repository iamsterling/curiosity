import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const sourceRoot = new URL("../src/", import.meta.url);
const forbidden =
  /(?:from\s+|import\s*\(|require\s*\()["'](?:node:|bun:|next(?:\/|["'])|ai(?:\/|["']))/u;

const files = (await readdir(sourceRoot, { recursive: true }))
  .filter((file) => file.endsWith(".ts"))
  .sort();
for (const file of files) {
  const source = await readFile(new URL(file, sourceRoot), "utf8");
  if (forbidden.test(source)) {
    console.error(`forbidden portable import: ${path.join("src", file)}`);
    process.exitCode = 1;
  }
}
