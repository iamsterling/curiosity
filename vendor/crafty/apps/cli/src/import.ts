import { readFileSync } from "node:fs";

import { importPenDocument } from "@crafty/pen-import";
import { dataDirectory, importPen, isValidSlug, packageDirectory } from "@crafty/scene-store";

const printDiagnostics = (diagnostics: Array<{ code: string; message: string; path: string }>): void => {
  for (const item of diagnostics) process.stdout.write(`warning: [${item.code}] ${item.message} (${item.path})\n`);
};

const pushToRunningInstance = async (pen: unknown, slug: string): Promise<number | undefined> => {
  try {
    const response = await fetch(`http://127.0.0.1:4173/api/files/${slug}/import`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pen }),
      signal: AbortSignal.timeout(1500)
    });
    if (!response.ok) return undefined;
    const body = (await response.json()) as { revision?: number };
    return body.revision;
  } catch {
    return undefined;
  }
};

export const runPenImport = async (args: string[]): Promise<number> => {
  const [file, slugArg] = args;
  const slug = slugArg ?? "untitled";
  if (!file || !isValidSlug(slug)) {
    process.stderr.write("Usage: crafty import <file.pen> [file-slug]\n");
    return 1;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch (error) {
    process.stderr.write(`Could not read ${file}: ${error instanceof Error ? error.message : "invalid JSON"}\n`);
    return 1;
  }
  const result = importPenDocument(parsed);
  if (!result.ok || !result.document) {
    process.stderr.write("The .pen document could not be imported:\n");
    for (const item of result.diagnostics) process.stderr.write(`- [${item.code}] ${item.message} (${item.path})\n`);
    return 1;
  }
  printDiagnostics(result.diagnostics);
  const revision = await pushToRunningInstance(parsed, slug);
  if (revision !== undefined) {
    process.stdout.write(`Imported into the running Crafty instance as /files/${slug} (revision ${revision}). Open the file to see it.\n`);
    return 0;
  }
  const directory = dataDirectory();
  const stored = importPen(directory, slug, parsed);
  if (!stored.ok) {
    process.stderr.write(`The .pen document could not be written to the store: [${stored.error.code}] ${stored.error.message}\n`);
    return 1;
  }
  process.stdout.write(`No running Crafty instance was found. Wrote the imported document to ${packageDirectory(directory, slug)} — start crafty to see it.\n`);
  return 0;
};
