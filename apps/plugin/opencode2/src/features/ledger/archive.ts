import { link, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { digestCanonical } from "../../core/canonical/index.js";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";

export interface ArchiveBundleInput {
  readonly schemaVersion: 1;
  readonly intentID: string;
  readonly intentRevision: number;
  readonly lineageDigest: string;
  readonly entities: readonly unknown[];
}
export type ArchiveFaultBoundary = "write" | "validate" | "commit";

export const createArchiveTransaction = async (
  root: string,
  input: ArchiveBundleInput,
  options: { faultAt?: ArchiveFaultBoundary } = {},
): Promise<{ path: string; digest: string }> => {
  const directory = path.join(root, input.intentID);
  const target = path.join(directory, `${input.intentRevision}.json`);
  const temporary = path.join(directory, `.${input.intentRevision}.${process.pid}.tmp`);
  const base = { ...input, committed: true };
  const bundle = { ...base, digest: digestCanonical(base) };
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporary, `${JSON.stringify(bundle)}\n`, { flag: "wx" });
    if (options.faultAt === "write") throw new Error("fault:write");
    const decoded = JSON.parse(await readFile(temporary, "utf8")) as Record<string, unknown>;
    const { digest, ...payload } = decoded;
    if (digest !== digestCanonical(payload)) throw new DiagnosticError("LEDGER_ARCHIVE_DIGEST_INVALID", temporary);
    if (options.faultAt === "validate") throw new Error("fault:validate");
    if (options.faultAt === "commit") throw new Error("fault:commit");
    await link(temporary, target);
    await rm(temporary, { force: true });
    return { path: target, digest: bundle.digest };
  } catch (error) {
    await rm(temporary, { force: true });
    if (error instanceof DiagnosticError) throw error;
    throw new DiagnosticError("LEDGER_ARCHIVE_TRANSACTION_FAILED", options.faultAt ?? "write");
  }
};
