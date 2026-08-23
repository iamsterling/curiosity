import { randomBytes } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, realpath, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { assertRepositoryPath, statusFailure } from "./status-validation.mjs";

const GENERATED_OUTPUTS = ["README.md", "docs/status/current.md"];
const GENERATED_MODE = 0o644;

export const noFollowFlag = (values = constants) => Number.isInteger(values.O_NOFOLLOW) ? values.O_NOFOLLOW : 0;

const sameFile = (left, right) => left.dev === right.dev && left.ino === right.ino;
const inside = (root, target) => {
  const relative = path.relative(root, target);
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
};
const generatedFailure = (code, detail) => statusFailure(`STATUS_GENERATED_WRITE_${code}`, detail);

const canonicalRoot = async (root) => {
  const absolute = path.resolve(root);
  const info = await lstat(absolute).catch((error) => {
    statusFailure("STATUS_GENERATED_WRITE", `root:${error?.code ?? "unknown"}`);
  });
  if (info.isSymbolicLink()) generatedFailure("SYMLINK", "root");
  if (!info.isDirectory()) generatedFailure("PARENT", "root");
  const canonical = await realpath(absolute).catch((error) => {
    statusFailure("STATUS_GENERATED_WRITE", `root:${error?.code ?? "unknown"}`);
  });
  const confirmed = await lstat(canonical).catch((error) => {
    statusFailure("STATUS_GENERATED_WRITE", `root:${error?.code ?? "unknown"}`);
  });
  if (!confirmed.isDirectory() || !sameFile(info, confirmed)) generatedFailure("CHANGED", "root");
  return canonical;
};

const inspectParent = async (root, relative) => {
  const parentRelative = path.posix.dirname(relative);
  const components = parentRelative === "." ? [] : parentRelative.split("/");
  let current = root;
  let info = await lstat(current).catch((error) => {
    statusFailure("STATUS_GENERATED_WRITE", `${relative}:${error?.code ?? "unknown"}`);
  });
  if (info.isSymbolicLink()) generatedFailure("SYMLINK", relative);
  if (!info.isDirectory()) generatedFailure("PARENT", relative);
  const resolvedRoot = await realpath(current).catch((error) => {
    statusFailure("STATUS_GENERATED_WRITE", `${relative}:${error?.code ?? "unknown"}`);
  });
  if (resolvedRoot !== current) generatedFailure("SYMLINK", relative);
  for (const component of components) {
    current = path.join(current, component);
    info = await lstat(current).catch((error) => {
      statusFailure("STATUS_GENERATED_WRITE", `${relative}:${error?.code ?? "unknown"}`);
    });
    if (info.isSymbolicLink()) generatedFailure("SYMLINK", relative);
    if (!info.isDirectory()) generatedFailure("PARENT", relative);
    const resolved = await realpath(current).catch((error) => {
      statusFailure("STATUS_GENERATED_WRITE", `${relative}:${error?.code ?? "unknown"}`);
    });
    if (!inside(root, resolved) || resolved !== current) generatedFailure("SYMLINK", relative);
  }
  return { absolute: current, info };
};

const inspectTarget = async (root, relative) => {
  const parent = await inspectParent(root, relative);
  const absolute = path.join(parent.absolute, path.posix.basename(relative));
  const info = await lstat(absolute).catch((error) => {
    statusFailure("STATUS_GENERATED_WRITE", `${relative}:${error?.code ?? "unknown"}`);
  });
  if (info.isSymbolicLink()) generatedFailure("SYMLINK", relative);
  if (!info.isFile()) generatedFailure("TARGET", relative);
  const resolved = await realpath(absolute).catch((error) => {
    statusFailure("STATUS_GENERATED_WRITE", `${relative}:${error?.code ?? "unknown"}`);
  });
  if (!inside(root, resolved) || resolved !== absolute) generatedFailure("SYMLINK", relative);
  return { relative, absolute, parent, info };
};

const revalidate = async (root, target) => {
  const parent = await inspectParent(root, target.relative);
  if (!sameFile(parent.info, target.parent.info)) generatedFailure("CHANGED", target.relative);
  const info = await lstat(target.absolute).catch((error) => {
    statusFailure("STATUS_GENERATED_WRITE", `${target.relative}:${error?.code ?? "unknown"}`);
  });
  if (info.isSymbolicLink()) generatedFailure("SYMLINK", target.relative);
  if (!info.isFile()) generatedFailure("TARGET", target.relative);
  if (!sameFile(info, target.info)) generatedFailure("CHANGED", target.relative);
};

const temporaryPath = (parent, target) => path.join(
  parent,
  `.${path.basename(target)}.status-write-${process.pid}-${randomBytes(12).toString("hex")}.tmp`,
);

const replaceGeneratedFile = async (root, target, content, operations) => {
  const temporary = temporaryPath(target.parent.absolute, target.absolute);
  let handle;
  let opened;
  let renamed = false;
  try {
    handle = await open(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollowFlag(constants),
      0o600,
    );
    opened = await handle.stat();
    if (!opened.isFile()) generatedFailure("TARGET", target.relative);
    await handle.writeFile(content, "utf8");
    await handle.chmod(GENERATED_MODE);
    await handle.sync();
    await handle.close();
    handle = undefined;

    await revalidate(root, target);
    const temporaryInfo = await lstat(temporary);
    if (temporaryInfo.isSymbolicLink() || !temporaryInfo.isFile() || !sameFile(temporaryInfo, opened))
      generatedFailure("CHANGED", target.relative);
    await operations.rename(temporary, target.absolute);
    renamed = true;

    const replaced = await lstat(target.absolute);
    if (replaced.isSymbolicLink() || !replaced.isFile() || !sameFile(replaced, opened))
      generatedFailure("CHANGED", target.relative);
    const resolved = await realpath(target.absolute);
    if (!inside(root, resolved) || resolved !== target.absolute) generatedFailure("SYMLINK", target.relative);
  } catch (error) {
    if (String(error?.message).startsWith("STATUS_")) throw error;
    statusFailure("STATUS_GENERATED_WRITE", `${target.relative}:${error?.code ?? "unknown"}`);
  } finally {
    if (handle) await handle.close().catch(() => undefined);
    if (!renamed && opened) {
      const parent = await lstat(target.parent.absolute).catch(() => undefined);
      const temporaryInfo = parent && sameFile(parent, target.parent.info)
        ? await lstat(temporary).catch(() => undefined)
        : undefined;
      if (temporaryInfo && sameFile(temporaryInfo, opened))
        await unlink(temporary).catch((error) => {
          if (error?.code !== "ENOENT")
            statusFailure("STATUS_GENERATED_WRITE", `${target.relative}:cleanup:${error?.code ?? "unknown"}`);
        });
    }
  }
};

export const writeGeneratedOutputs = async (outputs, root, overrides = {}) => {
  const keys = [...outputs.keys()];
  if (keys.length !== GENERATED_OUTPUTS.length || GENERATED_OUTPUTS.some((relative) => !outputs.has(relative))
    || keys.some((relative) => !GENERATED_OUTPUTS.includes(relative)))
    generatedFailure("ALLOWLIST", keys.join(","));
  for (const [relative, content] of outputs) {
    assertRepositoryPath(relative);
    if (typeof content !== "string") generatedFailure("CONTENT", relative);
  }

  const canonical = await canonicalRoot(root);
  const targets = new Map();
  for (const relative of GENERATED_OUTPUTS) targets.set(relative, await inspectTarget(canonical, relative));
  const operations = { rename, ...overrides };
  for (const relative of GENERATED_OUTPUTS)
    await replaceGeneratedFile(canonical, targets.get(relative), outputs.get(relative), operations);
};
