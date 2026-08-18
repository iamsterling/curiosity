import { lstat, open, realpath } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";

const within = (root: string, target: string): boolean => target === root || target.startsWith(`${root}${path.sep}`);
const identity = async (target: string): Promise<string> => {
  const stat = await lstat(target);
  return `${stat.dev}:${stat.ino}:${stat.mode}:${stat.size}:${stat.mtimeMs}`;
};
export const canonicalPath = async (rootInput: string, relative: string, mode: "existing" | "create") => {
  const root = await realpath(rootInput);
  if (!relative || path.isAbsolute(relative) || relative.split(/[\\/]/).some((part) => part === ".."))
    throw new DiagnosticError("ENGINEERING_PATH_SCOPE_DENIED");
  const lexical = path.resolve(root, relative);
  if (!within(root, lexical)) throw new DiagnosticError("ENGINEERING_PATH_SCOPE_DENIED");
  let canonical: string;
  let admittedIdentity: string;
  let admittedParentCanonical: string | undefined;
  if (mode === "existing") {
    canonical = await realpath(lexical).catch(() => {
      throw new DiagnosticError("ENGINEERING_PATH_MISSING");
    });
    if (!within(root, canonical)) throw new DiagnosticError("ENGINEERING_PATH_SYMLINK_ESCAPE");
    admittedIdentity = await identity(canonical);
  } else {
    const parent = path.dirname(lexical);
    const parentCanonical = await realpath(parent).catch(() => {
      throw new DiagnosticError("ENGINEERING_PATH_PARENT_AMBIGUOUS");
    });
    if (!within(root, parentCanonical)) throw new DiagnosticError("ENGINEERING_PATH_SYMLINK_ESCAPE");
    await lstat(lexical)
      .then(() => {
        throw new DiagnosticError("ENGINEERING_PATH_CREATE_EXISTS");
      })
      .catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
    canonical = lexical;
    admittedParentCanonical = parentCanonical;
    admittedIdentity = await identity(parentCanonical);
  }
  return Object.freeze({
    root,
    canonical,
    identity: admittedIdentity,
    async revalidate() {
      try {
        if (mode === "create") {
          const exists = await lstat(lexical)
            .then(() => true)
            .catch((error: NodeJS.ErrnoException) => {
              if (error.code === "ENOENT") return false;
              throw error;
            });
          if (exists) throw new DiagnosticError("ENGINEERING_PATH_CHANGED");
        }
        const currentParent = mode === "existing" ? undefined : await realpath(path.dirname(lexical));
        const currentCanonical = mode === "existing" ? await realpath(lexical) : lexical;
        const currentIdentity = await identity(mode === "existing" ? currentCanonical : currentParent!);
        if (
          !within(root, currentCanonical) ||
          currentCanonical !== canonical ||
          currentIdentity !== admittedIdentity ||
          (mode === "create" && currentParent !== admittedParentCanonical)
        )
          throw new DiagnosticError("ENGINEERING_PATH_CHANGED");
      } catch (error) {
        if (error instanceof DiagnosticError) throw error;
        throw new DiagnosticError("ENGINEERING_PATH_CHANGED");
      }
    },
    async readUtf8() {
      if (mode !== "existing") throw new DiagnosticError("ENGINEERING_PATH_MODE_INVALID");
      const handle = await open(canonical, constants.O_RDONLY | constants.O_NOFOLLOW).catch(() => {
        throw new DiagnosticError("ENGINEERING_PATH_CHANGED");
      });
      try {
        const stat = await handle.stat();
        const handleIdentity = `${stat.dev}:${stat.ino}:${stat.mode}:${stat.size}:${stat.mtimeMs}`;
        if (handleIdentity !== admittedIdentity) throw new DiagnosticError("ENGINEERING_PATH_CHANGED");
        return handle.readFile("utf8");
      } finally {
        await handle.close();
      }
    },
  });
};
