import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";

export interface LeaseToken {
  readonly root: string;
  readonly epoch: number;
  readonly token: string;
}

export type JSONDecoder<T> = (value: unknown, path: string) => T;

const leases = new AsyncLocalStorage<LeaseToken>();
const lockName = ".writer-lock";
const checkpointFor = (target: string) => `${target}.checkpoint`;
const blockedFor = (target: string) => `${target}.blocked`;

const syncDirectory = async (directoryPath: string): Promise<void> => {
  const directory = await open(directoryPath, "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
};

const writeAtomic = async (target: string, content: string): Promise<void> => {
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary, target);
  await syncDirectory(path.dirname(target));
};

const exists = async (target: string): Promise<boolean> => {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
};

const corrupt = async (target: string): Promise<never> => {
  const quarantine = `${target}.corrupt.${randomUUID()}`;
  try {
    await rename(target, quarantine);
    await syncDirectory(path.dirname(target));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await writeAtomic(blockedFor(target), `${quarantine}\n`);
  throw new DiagnosticError("PERSISTENCE_CORRUPT", target);
};

export const acquireLease = async (root: string): Promise<LeaseToken> => {
  const lock = path.join(root, lockName);
  await mkdir(root, { recursive: true });
  try {
    await mkdir(lock, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new DiagnosticError("LEDGER_WRITER_BUSY", lock);
    throw new DiagnosticError("PERSISTENCE_FENCE_UNAVAILABLE", lock);
  }
  try {
    let epoch = 0;
    try {
      epoch = Number((await readFile(path.join(root, ".writer-epoch"), "utf8")).trim());
      if (!Number.isSafeInteger(epoch) || epoch < 0) throw new Error("invalid epoch");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        throw new DiagnosticError("PERSISTENCE_FENCE_UNAVAILABLE", root);
    }
    const lease = { root, epoch: epoch + 1, token: randomUUID() };
    await writeAtomic(path.join(root, ".writer-epoch"), `${lease.epoch}\n`);
    await writeAtomic(path.join(lock, "lease.json"), `${JSON.stringify(lease)}\n`);
    return lease;
  } catch (error) {
    await rm(lock, { recursive: true, force: true });
    throw error;
  }
};

export const assertLease = async (lease: LeaseToken): Promise<void> => {
  const leasePath = path.join(lease.root, lockName, "lease.json");
  try {
    const actual = JSON.parse(await readFile(leasePath, "utf8")) as Partial<LeaseToken>;
    if (actual.root !== lease.root || actual.epoch !== lease.epoch || actual.token !== lease.token)
      throw new DiagnosticError("PERSISTENCE_LEASE_STALE", leasePath);
  } catch (error) {
    if (error instanceof DiagnosticError) throw error;
    throw new DiagnosticError("PERSISTENCE_LEASE_STALE", leasePath);
  }
};

export const releaseLease = async (lease: LeaseToken): Promise<void> => {
  const lock = path.join(lease.root, lockName);
  try {
    await assertLease(lease);
  } catch (error) {
    if ((error as DiagnosticError).code === "PERSISTENCE_LEASE_STALE") return;
    throw error;
  }
  try {
    await rm(lock, { recursive: true });
    await syncDirectory(lease.root);
  } catch {
    throw new DiagnosticError("PERSISTENCE_FENCE_UNAVAILABLE", lock);
  }
};

export const atomicWrite = async (target: string, content: string, lease = leases.getStore()): Promise<void> => {
  if (lease) await assertLease(lease);
  if (await exists(blockedFor(target))) throw new DiagnosticError("PERSISTENCE_CORRUPT_BLOCKED", target);
  if (await exists(target)) {
    try {
      const current = await readFile(target, "utf8");
      JSON.parse(current);
      if (!lease) await writeAtomic(checkpointFor(target), current);
    } catch (error) {
      if (error instanceof SyntaxError) await corrupt(target);
      throw new DiagnosticError("PERSISTENCE_CHECKPOINT_FAILED", target);
    }
  }
  if (lease) {
    await assertLease(lease);
    throw new DiagnosticError("PERSISTENCE_AUTOMATION_UNSUPPORTED", target);
  }
  await writeAtomic(target, content);
};

export const writeObservation = async (target: string, content: string): Promise<void> => {
  await writeAtomic(target, content);
};

/** Single-record Ledger transactions use the active lease and one atomic rename. */
export const writeLeasedRecord = async (target: string, content: string, lease: LeaseToken): Promise<void> => {
  await assertLease(lease);
  if (await exists(target)) throw new DiagnosticError("PERSISTENCE_RECORD_EXISTS", target);
  await writeAtomic(target, content);
  await assertLease(lease);
};

export const withLease = async <T>(root: string, operation: (lease?: LeaseToken) => Promise<T>): Promise<T> => {
  const lease = await acquireLease(root);
  try {
    return await leases.run(lease, () => operation(lease));
  } finally {
    await releaseLease(lease);
  }
};

export const readJSON = async <T = unknown>(target: string, decode?: JSONDecoder<T>): Promise<T | undefined> => {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(target, "utf8"));
  } catch (error) {
    try {
      value = JSON.parse(await readFile(checkpointFor(target), "utf8"));
      await writeAtomic(target, `${JSON.stringify(value)}\n`);
    } catch {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      return corrupt(target);
    }
  }
  if (!decode) return value as T;
  try {
    return decode(value, target);
  } catch (error) {
    const diagnosticPath =
      error instanceof DiagnosticError
        ? error.path
        : error instanceof Error && error.message.startsWith(target)
          ? error.message
          : target;
    try {
      await corrupt(target);
    } catch (corruption) {
      if (corruption instanceof DiagnosticError && corruption.code === "PERSISTENCE_CORRUPT")
        throw new DiagnosticError("PERSISTENCE_SCHEMA_INVALID", diagnosticPath);
      throw corruption;
    }
    throw error;
  }
};

export const listJSON = async (directory: string): Promise<string[]> => {
  try {
    return (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
};
