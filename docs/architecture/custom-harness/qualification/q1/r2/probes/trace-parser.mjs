import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  if (index < 0 || index === args.length - 1) {
    throw new Error(`missing ${name}`);
  }
  return args[index + 1];
};

const planPath = resolve(value("--plan"));
const outputPath = resolve(value("--output"));
const q1EntryPath = resolve(value("--q1-entry"));
const r2EntryPath = resolve(value("--r2-entry"));
const expectedPlanSha256 = value("--plan-sha256");
const sourceHead = value("--source-head");
const plan = readFileSync(planPath);
const actualPlanSha256 = sha256(plan);
if (actualPlanSha256 !== expectedPlanSha256) {
  throw new Error(
    `plan hash mismatch: expected ${expectedPlanSha256}, got ${actualPlanSha256}`,
  );
}
for (const path of [q1EntryPath, r2EntryPath]) {
  if (!existsSync(path)) throw new Error(`entry evidence is absent: ${path}`);
}

const rows = plan
  .toString("utf8")
  .split("\n")
  .map((line, index) => ({ line, lineNumber: index + 1 }))
  .flatMap(({ line, lineNumber }) => {
    const match = line.match(
      /^\|\s*((?:ADR-\d{3}|PKG)-(?:I|AC)\d{2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/u,
    );
    if (!match) return [];
    return [
      {
        id: match[1],
        work: match[2].split(",").map((entry) => entry.trim()),
        testEvidence: match[3].split(",").map((entry) => entry.trim()),
        lineNumber,
        sourceLine: line,
      },
    ];
  });
if (rows.length !== 120) {
  throw new Error(`trace row count mismatch: expected 120, got ${rows.length}`);
}
if (new Set(rows.map(({ id }) => id)).size !== rows.length) {
  throw new Error("trace IDs are not unique");
}

const expectedSectionCounts = {
  "ADR-001": 12,
  "ADR-002": 13,
  "ADR-003": 10,
  "ADR-004": 12,
  "ADR-005": 10,
  "ADR-006": 10,
  "ADR-007": 11,
  "ADR-008": 8,
  "ADR-009": 9,
  "ADR-010": 8,
  PKG: 17,
};
for (const [section, count] of Object.entries(expectedSectionCounts)) {
  const actual = rows.filter(({ id }) => id.startsWith(section)).length;
  if (actual !== count) {
    throw new Error(`${section} row count mismatch: expected ${count}, got ${actual}`);
  }
}
const workPattern = /^(?:Q[1-4]|I(?:[1-9]|10))-W\d{2}$/u;
const evidencePattern =
  /^(?:(?:Q[1-4]|I(?:[1-9]|10))-[TE]\d{2}|PLAN-E0[12])$/u;
for (const row of rows) {
  for (const reference of row.work) {
    if (!workPattern.test(reference)) {
      throw new Error(`invalid work reference ${reference} in ${row.id}`);
    }
  }
  for (const reference of row.testEvidence) {
    if (!evidencePattern.test(reference)) {
      throw new Error(`invalid evidence reference ${reference} in ${row.id}`);
    }
  }
}

const entryEvidence = {
  Q1: { path: q1EntryPath, sha256: sha256(readFileSync(q1EntryPath)) },
  "Q1-R2": { path: r2EntryPath, sha256: sha256(readFileSync(r2EntryPath)) },
};
const records = rows.map((row, index) => ({
  schemaVersion: "custom-harness-plan-e02-trace-row/v1",
  ordinal: index + 1,
  ...row,
  source: { planPath, planSha256: actualPlanSha256, sourceHead },
  executionEntryAudit: {
    entered: ["Q1", "Q1-R2"],
    entryEvidence,
    unentered: [
      "Q2",
      "Q3",
      "Q4",
      "I1",
      "I2",
      "I3",
      "I4",
      "I5",
      "I6",
      "I7",
      "I8",
      "I9",
      "I10",
    ],
    note:
      "Trace references are future mappings, not evidence that an unentered tranche began.",
  },
}));
writeFileSync(
  outputPath,
  `${records.map((record) => JSON.stringify(record)).join("\n")}\n`,
  { flag: "wx", mode: 0o600 },
);
console.log(
  JSON.stringify({
    verdict: "PASS",
    exactRowCount: records.length,
    uniqueIdCount: new Set(records.map(({ id }) => id)).size,
    planSha256: actualPlanSha256,
    outputPath,
    outputSha256: sha256(readFileSync(outputPath)),
    enteredTranches: ["Q1", "Q1-R2"],
    laterTranchesEntered: false,
  }),
);
