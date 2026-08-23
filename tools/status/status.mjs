#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkGeneratedOutputs,
  createFileRepository,
  renderOutputs,
  validateCatalog,
  verifySourceContracts,
  writeGeneratedOutputs,
} from "./status-model.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const arguments_ = process.argv.slice(2);
if (arguments_.some((argument) => argument !== "--write") || arguments_.length > 1) {
  console.error("usage: node tools/status/status.mjs [--write]");
  process.exitCode = 2;
} else {
  try {
    const catalog = validateCatalog(JSON.parse(await readFile(path.join(root, "docs/status/capabilities.json"), "utf8")));
    const repository = createFileRepository(root);
    await verifySourceContracts(catalog, repository);
    const outputs = await renderOutputs(catalog, repository);
    if (arguments_[0] === "--write") await writeGeneratedOutputs(outputs, root);
    else await checkGeneratedOutputs(outputs, repository);
    console.log(`status ${arguments_[0] === "--write" ? "write" : "check"} passed (${catalog.capabilities.length} capabilities)`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
