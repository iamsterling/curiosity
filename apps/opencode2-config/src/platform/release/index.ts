import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";

export interface ReleaseFile {
  readonly path: string;
  readonly sha256: string;
}
export interface ReleaseManifest {
  readonly schemaVersion: 1;
  readonly entry: string;
  readonly files: readonly ReleaseFile[];
}

const digest = (contents: Buffer): string => createHash("sha256").update(contents).digest("hex");
const safeRelativePath = (value: string): boolean =>
  value.length > 0 && !path.isAbsolute(value) && !value.split(/[\\/]/u).includes("..") && !value.includes("\\");

export const verifyReleaseManifest = async (source: string, manifest: ReleaseManifest): Promise<void> => {
  if (manifest.schemaVersion !== 1 || !safeRelativePath(manifest.entry) || !manifest.entry.endsWith(".js"))
    throw new DiagnosticError("RELEASE_MANIFEST_INVALID");
  if (!manifest.files.length || new Set(manifest.files.map((file) => file.path)).size !== manifest.files.length)
    throw new DiagnosticError("RELEASE_MANIFEST_INVALID");
  if (!manifest.files.some((file) => file.path === manifest.entry)) throw new DiagnosticError("RELEASE_ENTRY_MISSING");
  for (const file of manifest.files) {
    if (!safeRelativePath(file.path) || !file.path.endsWith(".js") || !/^[a-f0-9]{64}$/u.test(file.sha256))
      throw new DiagnosticError("RELEASE_MANIFEST_INVALID", file.path);
    const target = path.resolve(source, file.path);
    if (!target.startsWith(`${path.resolve(source)}${path.sep}`))
      throw new DiagnosticError("RELEASE_MANIFEST_INVALID", file.path);
    let contents: Buffer;
    try {
      const details = await lstat(target);
      if (details.isSymbolicLink()) throw new DiagnosticError("RELEASE_FILE_NOT_REGULAR", file.path);
      if (!details.isFile()) throw new DiagnosticError("RELEASE_FILE_NOT_REGULAR", file.path);
      contents = await readFile(target);
    } catch (error) {
      if (error instanceof DiagnosticError) throw error;
      throw new DiagnosticError("RELEASE_FILE_MISSING", file.path);
    }
    if (digest(contents) !== file.sha256) throw new DiagnosticError("RELEASE_HASH_MISMATCH", file.path);
  }
};

export const createReleaseManifest = async ({
  source,
  files,
  entry,
}: {
  source: string;
  files: readonly string[];
  entry: string;
}): Promise<ReleaseManifest> => {
  const manifest: ReleaseManifest = {
    schemaVersion: 1,
    entry,
    files: await Promise.all(
      files
        .slice()
        .sort()
        .map(async (file) => ({ path: file, sha256: digest(await readFile(path.join(source, file))) })),
    ),
  };
  await verifyReleaseManifest(source, manifest);
  return manifest;
};
