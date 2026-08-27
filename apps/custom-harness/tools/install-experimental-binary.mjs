#!/usr/bin/env bun
import { createHash, randomBytes } from "node:crypto";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
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
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (!key?.startsWith("--") || !value) throw new Error("INSTALL_ARGUMENT_INVALID");
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
const launcher = path.join(binDirectory, "curiosity");
await mkdir(versionDirectory, { mode: 0o700, recursive: true });
await mkdir(binDirectory, { mode: 0o700, recursive: true });

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
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

const launcherDetails = await lstat(launcher).catch(() => undefined);
if (launcherDetails && !launcherDetails.isSymbolicLink())
  throw new Error("INSTALL_LAUNCHER_OCCUPIED");
if (launcherDetails?.isSymbolicLink() && (await readlink(launcher)) === installed) {
  process.stdout.write(`${launcher}\n`);
  process.exit(0);
}
const temporary = path.join(
  binDirectory,
  `.curiosity-${process.pid}-${randomBytes(8).toString("hex")}`,
);
try {
  await symlink(installed, temporary);
  await rename(temporary, launcher);
} finally {
  await unlink(temporary).catch(() => undefined);
}
process.stdout.write(`${launcher}\n`);
