import { cpSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { parseDocument } from "@crafty/editor/kernel";
import { dataDirectory, entryFile, isValidSlug, packageDirectory, parseUiManifest, UI_DOCUMENT_FORMAT, UI_DOCUMENT_ROLE } from "@crafty/scene-store";

const saveUsage = "Usage: crafty save <slug> [dir.ui]\n";
const loadUsage = "Usage: crafty load <slug> [dir.ui]\n";

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);

/** Pre-copy gate: the source must be a valid `.ui` package — manifest marker,
 *  version and entries, then the document entry marker and a kernel-valid
 *  document. The store's own read path validates again on next open; this is
 *  the guard against clobbering a stored package with garbage. */
const validatePackage = (packageDir: string): string | undefined => {
  const manifestPath = path.join(packageDir, "manifest.ui");
  if (!existsSync(manifestPath)) return "the package has no manifest.ui";
  let manifest;
  try {
    manifest = parseUiManifest(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return error instanceof Error ? error.message : "manifest.ui could not be read";
  }
  if (!manifest.ok) return manifest.message;
  let documentPath: string;
  try {
    documentPath = entryFile(packageDir, manifest.value, UI_DOCUMENT_ROLE);
  } catch (error) {
    return error instanceof Error ? error.message : "the document entry path is invalid";
  }
  if (!existsSync(documentPath)) return `the package has no ${UI_DOCUMENT_ROLE} entry`;
  let envelope: unknown;
  try {
    envelope = JSON.parse(readFileSync(documentPath, "utf8")) as unknown;
  } catch {
    return `the ${UI_DOCUMENT_ROLE} entry is not valid JSON`;
  }
  if (!record(envelope) || envelope.format !== UI_DOCUMENT_FORMAT) return `the ${UI_DOCUMENT_ROLE} entry lacks the crafty.ui-document marker`;
  const document = parseDocument(JSON.stringify(envelope.document) ?? "");
  if (!document.ok || !document.document) {
    const first = document.diagnostics[0];
    return first === undefined ? "the document failed validation" : `[${first.code}] ${first.message} (${first.path})`;
  }
  return undefined;
};

export const runSave = (args: string[]): number => {
  const [slug, targetArg] = args;
  if (args.length > 2 || slug === undefined || !isValidSlug(slug)) {
    process.stderr.write(saveUsage);
    return 1;
  }
  const directory = dataDirectory();
  const source = packageDirectory(directory, slug);
  if (!existsSync(source)) {
    process.stderr.write(`No stored file ${slug} was found at ${source}\n`);
    return 1;
  }
  const target = path.resolve(targetArg ?? `${slug}.ui`);
  try {
    cpSync(source, target, { recursive: true });
  } catch (error) {
    process.stderr.write(`Could not copy ${source} to ${target}: ${error instanceof Error ? error.message : "unknown error"}\n`);
    return 1;
  }
  process.stdout.write(`${target}\n`);
  return 0;
};

export const runLoad = (args: string[]): number => {
  const [slug, sourceArg] = args;
  if (args.length > 2 || slug === undefined || !isValidSlug(slug)) {
    process.stderr.write(loadUsage);
    return 1;
  }
  const source = path.resolve(sourceArg ?? `${slug}.ui`);
  if (!existsSync(source)) {
    process.stderr.write(`No .ui package found at ${source}\n`);
    return 1;
  }
  const invalid = validatePackage(source);
  if (invalid !== undefined) {
    process.stderr.write(`Refusing to load ${source}: ${invalid}\n`);
    return 1;
  }
  const directory = dataDirectory();
  const target = packageDirectory(directory, slug);
  try {
    cpSync(source, target, { recursive: true, force: true });
  } catch (error) {
    process.stderr.write(`Could not copy ${source} to ${target}: ${error instanceof Error ? error.message : "unknown error"}\n`);
    return 1;
  }
  process.stdout.write(`${slug}\n`);
  return 0;
};
