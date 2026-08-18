import { realpath } from "node:fs/promises";
import path from "node:path";
import type { OpenCodeContext } from "./contracts.js";

const configuredRoot = (context: OpenCodeContext): string | undefined => {
  if (typeof context.options.directory === "string") return context.options.directory;
  if (typeof context.options.projectDirectory === "string") return context.options.projectDirectory;
  return undefined;
};

export const projectRootKey = async (context: OpenCodeContext): Promise<string> => {
  const resolved = path.resolve(configuredRoot(context) ?? process.cwd());
  try {
    return await realpath(resolved);
  } catch {
    return resolved;
  }
};

export const runAllReverse = async (operations: readonly (() => Promise<void> | void)[]): Promise<void> => {
  const errors: unknown[] = [];
  for (const operation of [...operations].reverse()) {
    try {
      await operation();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) throw new AggregateError(errors, "OPENCODE2_CLEANUP_FAILED");
};

export const preservePrimaryError = (primary: unknown, cleanup: unknown): unknown => {
  if (primary instanceof Error) {
    if (primary.cause === undefined) primary.cause = cleanup;
    return primary;
  }
  return new AggregateError([primary, cleanup], "OPENCODE2_REGISTRATION_AND_CLEANUP_FAILED");
};
