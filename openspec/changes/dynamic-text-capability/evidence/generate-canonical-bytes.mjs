import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSeedScene } from "../../../../packages/scene-model/src/index.ts";
import { sceneToEditorDocument } from "../../../../packages/editor/src/kernel/scene-adapter.ts";
import {
  canonicalEditorDocumentString,
  createFoundationDocument,
  migrateDocument,
  v1ToV2DocumentMigration,
  v2ToV3DocumentMigration,
  v3ToV4DocumentMigration,
  validateEditorDocumentV4,
} from "../../../../packages/editor/src/kernel/document.ts";
import { createLossListDocument } from "../../../../packages/scene-store/src/fixtures/loss-list-document.ts";

const directory = dirname(fileURLToPath(import.meta.url));
const output = join(directory, "canonical-bytes");
const check = process.argv.includes("--check");
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value !== null && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const historicalBytes = (value) => JSON.stringify(canonical(value));

const v1 = sceneToEditorDocument(createSeedScene());
const v4 = v3ToV4DocumentMigration.apply(
  v2ToV3DocumentMigration.apply(v1ToV2DocumentMigration.apply(v1).document)
    .document,
).document;
delete v4.nodes["layer-title"].text;
if (!validateEditorDocumentV4(v4).ok) throw new Error("V4_FIXTURE_INVALID");
const migrated = migrateDocument(v4);
if (!migrated.ok || !migrated.document)
  throw new Error("V4_TO_V5_MIGRATION_FAILED");
if (JSON.stringify(migrated.applied) !== '["v4-to-v5-require-text-content"]')
  throw new Error("V4_TO_V5_SEQUENCE_CHANGED");

const foundation = createFoundationDocument();
const lossList = createLossListDocument();
const foundationV4 = structuredClone(foundation);
const lossListV4 = structuredClone(lossList);
foundationV4.schemaVersion = 4;
lossListV4.schemaVersion = 4;
const files = {
  "migration-v4-before.json": historicalBytes(v4),
  "migration-v5-after.json": canonicalEditorDocumentString(migrated.document),
  "foundation-v4-before.json": historicalBytes(foundationV4),
  "foundation-v5-after.json": canonicalEditorDocumentString(foundation),
  "loss-list-v4-before.json": historicalBytes(lossListV4),
  "loss-list-v5-after.json": canonicalEditorDocumentString(lossList),
};

for (const [name, bytes] of Object.entries(files)) {
  const path = join(output, name);
  if (check && readFileSync(path, "utf8") !== bytes)
    throw new Error(`CANONICAL_EVIDENCE_STALE:${name}`);
  if (!check) writeFileSync(path, bytes);
  process.stdout.write(
    `${name} bytes=${Buffer.byteLength(bytes)} sha256=${createHash("sha256").update(bytes).digest("hex")}\n`,
  );
}
