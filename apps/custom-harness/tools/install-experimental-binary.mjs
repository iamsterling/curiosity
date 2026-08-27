#!/usr/bin/env bun
import { createHash, randomBytes } from "node:crypto";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  open,
  readdir,
  readFile,
  readlink,
  rename,
  symlink,
  unlink,
} from "node:fs/promises";
import { constants } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "dist/curiosity");
const values = new Map();
const allowedArguments = new Set([
  "--bin-dir",
  "--data-dir",
  "--expected-current",
  "--rollback-to",
]);
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (!key || !allowedArguments.has(key) || !value || values.has(key))
    throw new Error("INSTALL_ARGUMENT_INVALID");
  values.set(key, value);
}
const dataHome = path.resolve(
  values.get("--data-dir") ??
    process.env.XDG_DATA_HOME ??
    path.join(homedir(), ".local", "share"),
);
const binDirectory = path.resolve(
  values.get("--bin-dir") ??
    process.env.XDG_BIN_HOME ??
    path.join(homedir(), ".local", "bin"),
);
const versionsDirectory = path.join(dataHome, "curiosity", "versions");
const receiptsDirectory = path.join(dataHome, "curiosity", "selection-receipts");
const launcher = path.join(binDirectory, "curiosity");
await mkdir(binDirectory, { mode: 0o700, recursive: true });

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const syncDirectory = async (directory) => {
  const handle = await open(directory, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
};
const syncFile = async (file) => {
  const handle = await open(file, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
};
const syncDirectoryChain = async (directory) => {
  let current = path.resolve(directory);
  while (true) {
    await syncDirectory(current);
    const parent = path.dirname(current);
    if (parent === current) return;
    current = parent;
  }
};
await syncDirectoryChain(binDirectory);
const launcherDetails = await lstat(launcher).catch(() => undefined);
const selectedBefore = launcherDetails?.isSymbolicLink()
  ? await readlink(launcher)
  : undefined;
const expectedCurrent = values.get("--expected-current");
if (expectedCurrent) {
  if (!path.isAbsolute(expectedCurrent))
    throw new Error("INSTALL_SELECTION_PRECONDITION_INVALID");
  if (selectedBefore !== expectedCurrent)
    throw new Error("INSTALL_SELECTION_PRECONDITION_FAILED");
}
if (launcherDetails && !launcherDetails.isSymbolicLink())
  throw new Error("INSTALL_LAUNCHER_OCCUPIED");

const select = async (target, operation) => {
  const receipt = {
    launcher,
    operation,
    previous: selectedBefore ?? null,
    schemaVersion: 1,
    selected: target,
    selectedSha256: digest(await readFile(target)),
  };
  const receiptBytes = `${JSON.stringify(receipt)}\n`;
  const receiptId = digest(receiptBytes);
  await mkdir(receiptsDirectory, { mode: 0o700, recursive: true });
  const receiptPath = path.join(receiptsDirectory, `${receiptId}.json`);
  try {
    const receiptHandle = await open(receiptPath, "wx", 0o600);
    try {
      await receiptHandle.writeFile(receiptBytes);
      await receiptHandle.sync();
    } finally {
      await receiptHandle.close();
    }
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "EEXIST" ||
      (await readFile(receiptPath, "utf8")) !== receiptBytes
    )
      throw error;
  }
  await syncFile(receiptPath);
  await syncDirectoryChain(receiptsDirectory);
  const temporary = path.join(
    binDirectory,
    `.curiosity-${process.pid}-${randomBytes(8).toString("hex")}`,
  );
  try {
    await symlink(target, temporary);
    await rename(temporary, launcher);
    await syncDirectoryChain(binDirectory);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
  process.stdout.write(`${launcher}\n${receiptPath}\n`);
};

const installationReceipt = async (target, targetDigest) => {
  const names = await readdir(receiptsDirectory).catch(() => []);
  for (const name of names) {
    if (!/^[a-f0-9]{64}\.json$/u.test(name)) continue;
    const receiptPath = path.join(receiptsDirectory, name);
    const bytes = await readFile(receiptPath, "utf8").catch(() => undefined);
    if (!bytes || `${digest(bytes)}.json` !== name) continue;
    let receipt;
    try {
      receipt = JSON.parse(bytes);
    } catch {
      continue;
    }
    if (
      receipt &&
      typeof receipt === "object" &&
      !Array.isArray(receipt) &&
      Object.keys(receipt).sort().join(",") ===
        "launcher,operation,previous,schemaVersion,selected,selectedSha256" &&
      receipt.schemaVersion === 1 &&
      receipt.operation === "install" &&
      receipt.launcher === launcher &&
      receipt.selected === target &&
      receipt.selectedSha256 === targetDigest &&
      (receipt.previous === null || typeof receipt.previous === "string")
    )
      return receiptPath;
  }
  return undefined;
};

const rollbackTo = values.get("--rollback-to");
if (rollbackTo) {
  if (!path.isAbsolute(rollbackTo))
    throw new Error("INSTALL_ROLLBACK_TARGET_INVALID");
  const relative = path.relative(versionsDirectory, rollbackTo);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    path.basename(rollbackTo) !== "curiosity" ||
    path.dirname(relative) === "."
  )
    throw new Error("INSTALL_ROLLBACK_TARGET_INVALID");
  const details = await lstat(rollbackTo).catch(() => undefined);
  if (!details?.isFile() || details.isSymbolicLink())
    throw new Error("INSTALL_ROLLBACK_TARGET_INVALID");
  const rollbackDigest = digest(await readFile(rollbackTo));
  const qualifyingReceipt = await installationReceipt(
    rollbackTo,
    rollbackDigest,
  );
  if (!qualifyingReceipt)
    throw new Error("INSTALL_ROLLBACK_RECEIPT_REQUIRED");
  await syncFile(rollbackTo);
  await syncDirectoryChain(path.dirname(rollbackTo));
  await syncFile(qualifyingReceipt);
  await syncDirectoryChain(receiptsDirectory);
  const versionCheck = Bun.spawnSync([rollbackTo, "--version"], {
    stderr: "pipe",
    stdout: "pipe",
  });
  if (versionCheck.exitCode !== 0)
    throw new Error("INSTALL_ROLLBACK_TARGET_NOT_STARTABLE");
  await select(rollbackTo, "rollback");
  process.exit(0);
}

const versionResult = Bun.spawnSync([source, "--version"], {
  stderr: "pipe",
  stdout: "pipe",
});
if (versionResult.exitCode !== 0) throw new Error("INSTALL_BINARY_INVALID");
const version = JSON.parse(versionResult.stdout.toString()).version;
if (typeof version !== "string" || !/^[A-Za-z0-9.+-]+$/u.test(version))
  throw new Error("INSTALL_VERSION_INVALID");
const versionDirectory = path.join(dataHome, "curiosity", "versions", version);
const installed = path.join(versionDirectory, "curiosity");
await mkdir(versionDirectory, { mode: 0o700, recursive: true });

const sourceDigest = digest(await readFile(source));
const installedDetails = await lstat(installed).catch(() => undefined);
if (installedDetails) {
  if (!installedDetails.isFile() || installedDetails.isSymbolicLink())
    throw new Error("INSTALL_VERSION_PATH_INVALID");
  if (digest(await readFile(installed)) !== sourceDigest)
    throw new Error("INSTALL_VERSION_COLLISION");
} else {
  await copyFile(source, installed, constants.COPYFILE_EXCL);
  await chmod(installed, 0o755);
}
await syncFile(installed);
await syncDirectoryChain(versionDirectory);

if (selectedBefore === installed) {
  process.stdout.write(`${launcher}\n`);
  process.exit(0);
}
await select(installed, "install");
