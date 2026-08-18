import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { digestCanonical } from "../../core/canonical/index.js";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
const owned = new Map<string, { before: string; afterDigest: string }>();
export const writeOwnedWorkspaceFile = async (root: string, relative: string, content: string) => {
  throw new DiagnosticError("ENGINEERING_WORKSPACE_MUTATION_DISABLED");
  /* c8 ignore start -- retained contract cannot be reached until a race-resistant adapter exists */
  const file = path.resolve(root, relative);
  if (!file.startsWith(`${path.resolve(root)}${path.sep}`))
    throw new DiagnosticError("ENGINEERING_EFFECT_SCOPE_DENIED");
  const before = await readFile(file, "utf8").catch((e) => {
    if (e.code === "ENOENT") return "";
    throw e;
  });
  await writeFile(file, content);
  owned.set(file, { before, afterDigest: digestCanonical(content) });
  return {
    code: "ENGINEERING_LOCAL_EFFECT_COMPLETED" as const,
    outputDigest: digestCanonical(content),
    locator: `workspace:${relative}`,
  };
};
/* c8 ignore stop */
export const revertOwnedWorkspaceFile = async (root: string, relative: string) => {
  const file = path.resolve(root, relative),
    record = owned.get(file);
  if (!record) throw new DiagnosticError("ENGINEERING_REVERT_NOT_OWNED");
  const current = await readFile(file, "utf8");
  if (digestCanonical(current) !== record.afterDigest) throw new DiagnosticError("ENGINEERING_REVERT_DIRTY_COLLISION");
  await writeFile(file, record.before);
  owned.delete(file);
};
