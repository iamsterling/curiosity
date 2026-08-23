#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { verifyInventory } from "./inventory-model.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
try {
  const inventory = JSON.parse(await readFile(path.join(root, "docs/verification/inventory.json"), "utf8"));
  await verifyInventory(inventory);
  const requiredProfiles = new Set(Object.entries(inventory.testProfiles)
    .filter(([, profile]) => profile.disposition === "required")
    .map(([name]) => name));
  const requiredTests = inventory.tests.filter(({ profiles }) => profiles.some((profile) => requiredProfiles.has(profile))).length;
  console.log(`verification inventory passed (${inventory.packages.length} packages, ${inventory.verificationTools.length} verification tools, ${inventory.tests.length} test files, ${inventory.workflows.length} workflow; ${requiredTests} required test files; 0 unexecuted required tests)`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
