import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
import { verifyReleaseManifest, type ReleaseManifest } from "../release/index.js";

const pluginName = "opencode2-config";
const wrapperName = `${pluginName}.js`;
const wrapperFor = (entry: string): string => `export { default } from "./opencode2-config/dist/${entry}"\n`;
const receiptName = `${pluginName}.receipt.json`;
const releaseDir = (configRoot: string): string => path.join(configRoot, "plugins", pluginName);
const previousDir = (configRoot: string): string => path.join(configRoot, "plugins", `.${pluginName}.previous`);

export interface InstallReceipt {
  readonly schemaVersion: 1;
  readonly entry: string;
  readonly loadPaths: readonly [string];
  readonly files: readonly { readonly path: string; readonly sha256: string }[];
  readonly manifest: ReleaseManifest;
}
export interface StagedInstall {
  readonly configRoot: string;
  readonly source: string;
  readonly manifest: ReleaseManifest;
  readonly fault?: "config" | "plugin" | "before-commit" | "wrapper";
}

const exists = async (target: string): Promise<boolean> => {
  try {
    await readFile(target);
    return true;
  } catch {
    return false;
  }
};
const isManagedWrapper = async (target: string): Promise<boolean> => {
  try {
    return /^export \{ default \} from "\.\/opencode2-config\/dist\/[A-Za-z0-9._/-]+"\n$/u.test(
      await readFile(target, "utf8"),
    );
  } catch {
    return false;
  }
};
const failDuplicateLoadPath = async (plugins: string): Promise<void> => {
  const paths = [path.join(plugins, `${pluginName}.ts`), path.join(plugins, wrapperName)];
  if (await exists(paths[0]!)) throw new DiagnosticError("RELEASE_LOAD_PATH_DUPLICATE", paths[0]);
  if ((await exists(paths[1]!)) && !(await isManagedWrapper(paths[1]!)))
    throw new DiagnosticError("RELEASE_LOAD_PATH_DUPLICATE", paths[1]);
};
const receiptFor = (manifest: ReleaseManifest): InstallReceipt => ({
  schemaVersion: 1,
  entry: manifest.entry,
  loadPaths: [`plugins/${wrapperName}`],
  files: manifest.files,
  manifest,
});
const receiptTextFor = (receipt: InstallReceipt): string => `${JSON.stringify(receipt)}\n`;
const sameManifest = (left: ReleaseManifest, right: ReleaseManifest): boolean =>
  JSON.stringify(left) === JSON.stringify(right);
const parseReceipt = (text: string): InstallReceipt => {
  try {
    const receipt = JSON.parse(text) as Partial<InstallReceipt>;
    if (
      receipt.schemaVersion !== 1 ||
      typeof receipt.entry !== "string" ||
      !Array.isArray(receipt.loadPaths) ||
      receipt.loadPaths.length !== 1 ||
      receipt.loadPaths[0] !== `plugins/${wrapperName}` ||
      !Array.isArray(receipt.files) ||
      !receipt.manifest ||
      receipt.manifest.schemaVersion !== 1 ||
      receipt.entry !== receipt.manifest.entry ||
      JSON.stringify(receipt.files) !== JSON.stringify(receipt.manifest.files)
    )
      throw new Error("invalid receipt");
    return receipt as InstallReceipt;
  } catch {
    throw new DiagnosticError("RELEASE_RECEIPT_INVALID");
  }
};
const repairCommittedRelease = async (plugins: string, configRoot: string): Promise<InstallReceipt | undefined> => {
  const current = releaseDir(configRoot);
  const stagedReceipt = path.join(current, "receipt.json");
  if (!(await exists(stagedReceipt))) return undefined;
  const receiptText = await readFile(stagedReceipt, "utf8");
  const receipt = parseReceipt(receiptText);
  await verifyReleaseManifest(path.join(current, "dist"), receipt.manifest);
  const wrapper = path.join(plugins, wrapperName);
  const publishedReceipt = path.join(plugins, receiptName);
  const wrapperMatches = (await exists(wrapper)) && (await readFile(wrapper, "utf8")) === wrapperFor(receipt.entry);
  const receiptMatches = (await exists(publishedReceipt)) && (await readFile(publishedReceipt, "utf8")) === receiptText;
  if (wrapperMatches && receiptMatches) return undefined;
  await writeFile(wrapper, wrapperFor(receipt.entry), "utf8");
  await writeFile(publishedReceipt, receiptText, "utf8");
  return receipt;
};

export const installStagedRelease = async ({
  configRoot,
  source,
  manifest,
  fault,
}: StagedInstall): Promise<InstallReceipt> => {
  const plugins = path.join(configRoot, "plugins");
  await mkdir(plugins, { recursive: true });
  await failDuplicateLoadPath(plugins);
  const repaired = await repairCommittedRelease(plugins, configRoot);
  if (repaired && sameManifest(repaired.manifest, manifest)) return repaired;
  await verifyReleaseManifest(source, manifest);
  const stage = path.join(plugins, `.${pluginName}.stage-${process.pid}`);
  const current = releaseDir(configRoot);
  const previous = previousDir(configRoot);
  const wrapper = path.join(plugins, wrapperName);
  const receipt = receiptFor(manifest);
  await rm(stage, { recursive: true, force: true });
  try {
    if (fault === "config") throw new DiagnosticError("RELEASE_INSTALL_INTERRUPTED");
    await mkdir(path.join(stage, "dist"), { recursive: true });
    for (const file of manifest.files)
      await cp(path.join(source, file.path), path.join(stage, "dist", file.path), { force: false, errorOnExist: true });
    if (fault === "plugin") throw new DiagnosticError("RELEASE_INSTALL_INTERRUPTED");
    await writeFile(path.join(stage, "receipt.json"), receiptTextFor(receipt), "utf8");
    if (fault === "before-commit") throw new DiagnosticError("RELEASE_INSTALL_INTERRUPTED");
    await rm(previous, { recursive: true, force: true });
    try {
      await rename(current, previous);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    try {
      await rename(stage, current);
    } catch (error) {
      try {
        await rename(previous, current);
      } catch {}
      throw error;
    }
    if (fault === "wrapper") throw new DiagnosticError("RELEASE_INSTALL_INTERRUPTED");
    await writeFile(wrapper, wrapperFor(manifest.entry), "utf8");
    await writeFile(path.join(plugins, receiptName), receiptTextFor(receipt), "utf8");
    return receipt;
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
};

export const rollbackStagedRelease = async (
  configRoot: string,
  options: { fault?: "before-commit" | "wrapper" | "receipt" } = {},
): Promise<void> => {
  const current = releaseDir(configRoot);
  const previous = previousDir(configRoot);
  const previousReceiptText = await readFile(path.join(previous, "receipt.json"), "utf8").catch(() => undefined);
  if (!previousReceiptText) throw new DiagnosticError("RELEASE_ROLLBACK_UNAVAILABLE");
  const receipt = parseReceipt(previousReceiptText);
  await verifyReleaseManifest(path.join(previous, "dist"), receipt.manifest);
  if (options.fault === "before-commit") throw new DiagnosticError("RELEASE_ROLLBACK_INTERRUPTED");
  const displaced = `${current}.rollback-${process.pid}`;
  const plugins = path.join(configRoot, "plugins");
  const wrapper = path.join(plugins, wrapperName);
  const publishedReceipt = path.join(plugins, receiptName);
  const currentWrapper = await readFile(wrapper, "utf8").catch(() => undefined);
  const currentReceipt = await readFile(publishedReceipt, "utf8").catch(() => undefined);
  try {
    await rename(current, displaced);
    await rename(previous, current);
    if (options.fault === "wrapper") throw new DiagnosticError("RELEASE_ROLLBACK_INTERRUPTED");
    await writeFile(wrapper, wrapperFor(receipt.entry), "utf8");
    if (options.fault === "receipt") throw new DiagnosticError("RELEASE_ROLLBACK_INTERRUPTED");
    await writeFile(publishedReceipt, previousReceiptText, "utf8");
  } catch (error) {
    try {
      if (await exists(path.join(current, "receipt.json"))) await rename(current, previous);
      if (await exists(path.join(displaced, "receipt.json"))) await rename(displaced, current);
      if (currentWrapper === undefined) await rm(wrapper, { force: true });
      else await writeFile(wrapper, currentWrapper, "utf8");
      if (currentReceipt === undefined) await rm(publishedReceipt, { force: true });
      else await writeFile(publishedReceipt, currentReceipt, "utf8");
    } catch {}
    throw error;
  }
  await rm(displaced, { recursive: true, force: true });
};
