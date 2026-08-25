#!/usr/bin/env node

import { readFileSync } from "node:fs";
import {
  expectedDimensions,
  expectedHeadings,
  requiredSourceFields,
} from "./dossier-schema.mjs";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node research/harnesses/validate-dossiers.mjs <dossier.md> [...]");
  process.exit(2);
}

let failureCount = 0;

function addFailure(failures, message) {
  failures.push(message);
}

function sectionSlices(text, headings) {
  return headings.map((heading, index) => {
    const start = heading.index;
    const end = headings[index + 1]?.index ?? text.length;
    return text.slice(start, end);
  });
}

function definitions(section, key) {
  const yaml = [...section.matchAll(new RegExp(`^\\s*(?:-\\s+)?${key}:\\s*(C-\\d{3}|S-\\d{3})\\s*$`, "gm"))]
    .map((match) => match[1]);
  const table = [...section.matchAll(/^\|\s*(C-\d{3}|S-\d{3})\s*\|/gm)].map(
    (match) => match[1],
  );
  return new Set([...yaml, ...table]);
}

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const failures = [];
  const headings = [...text.matchAll(/^##\s+(\d{1,2})\.\s+(.+?)\s*(?:\{#[^}]+\})?\s*$/gm)].map(
    (match) => ({ number: Number(match[1]), title: match[2].trim(), index: match.index }),
  );

  if (headings.length !== 30) {
    addFailure(failures, `expected 30 numbered H2 headings, found ${headings.length}`);
  }

  for (let index = 0; index < expectedHeadings.length; index += 1) {
    const observed = headings[index];
    if (!observed || observed.number !== index) {
      addFailure(failures, `missing or out-of-order section ${index}`);
      continue;
    }
    if (observed.title !== expectedHeadings[index]) {
      addFailure(
        failures,
        `section ${index} title is "${observed.title}", expected "${expectedHeadings[index]}"`,
      );
    }
  }

  if (headings.length === 30) {
    const slices = sectionSlices(text, headings);
    for (let index = 1; index <= 25; index += 1) {
      const section = slices[index];
      if (!/\bStatus\b/i.test(section)) {
        addFailure(failures, `section ${index} has no Status field`);
      }
      if (!/C-\d{3}/.test(section)) {
        addFailure(failures, `section ${index} has no substantive claim citation`);
      }
      if (!/S-\d{3}/.test(section)) {
        addFailure(failures, `section ${index} has no source citation`);
      }
    }

    const claimDefinitions = definitions(slices[26], "claim_id");
    const sourceDefinitions = definitions(slices[27], "source_id");
    if (claimDefinitions.size === 0) {
      addFailure(failures, "claims register has no machine-detectable claim definitions");
    }
    if (sourceDefinitions.size === 0) {
      addFailure(failures, "source ledger has no machine-detectable source definitions");
    }

    const substantive = slices.slice(1, 26).join("\n");
    for (const claimId of claimDefinitions) {
      if (!substantive.includes(claimId)) {
        addFailure(failures, `${claimId} is orphaned from substantive sections 1-25`);
      }
    }

    const citedSources = new Set(text.match(/S-\d{3}/g) ?? []);
    for (const sourceId of citedSources) {
      if (!sourceDefinitions.has(sourceId)) {
        addFailure(failures, `${sourceId} is cited but not defined in the source ledger`);
      }
    }

    for (const field of requiredSourceFields) {
      if (!new RegExp(`\\b${field}\\b`).test(slices[27])) {
        addFailure(failures, `source ledger does not expose required field ${field}`);
      }
    }

    for (let index = 1; index <= 14; index += 1) {
      const probeId = `P-${String(index).padStart(2, "0")}`;
      const probeLine = slices[25]
        .split("\n")
        .find((line) => line.includes(probeId));
      if (!probeLine) {
        addFailure(failures, `missing adversarial probe ${probeId}`);
      } else if (!/\b(PASS|FAIL|INCONCLUSIVE|NOT_RUN_UNSAFE|NOT_APPLICABLE:)/.test(probeLine)) {
        addFailure(failures, `${probeId} has no allowed result on its record line`);
      }
    }

    for (const dimension of expectedDimensions) {
      const matches = slices[28].match(new RegExp(`dimension:\\s*["']?${dimension}["']?`, "g")) ?? [];
      if (matches.length !== 1) {
        addFailure(
          failures,
          `normalized record dimension ${dimension} appears ${matches.length} times`,
        );
      }
    }
  }

  if (!/RESEARCH_ONLY_NO_DESIGN_AUTHORITY|research-only[^\n]*no[- ]design[- ]authority/i.test(text)) {
    addFailure(failures, "missing explicit research-only/no-design-authority declaration");
  }
  if (!/CURIOSITY_NO_GO/.test(text)) {
    addFailure(failures, "missing CURIOSITY_NO_GO record");
  }
  if (!/URL(?:\/link)?[- ]check/i.test(text)) {
    addFailure(failures, "missing URL/link-check result");
  }
  if (/C-000|S-000|<stable kebab-case ID>|<canonical target>/.test(text)) {
    addFailure(failures, "contains an unresolved contract placeholder");
  }
  if (/classification:\s*UNKNOWN/.test(text)) {
    for (const field of [
      "attempted_methods=",
      "blocker=",
      "impact=",
      "available_evidence=",
      "next_probe=",
    ]) {
      if (!text.includes(field)) {
        addFailure(failures, `UNKNOWN claims exist but ${field} is absent`);
      }
    }
  }

  if (failures.length === 0) {
    console.log(`PASS ${file}`);
  } else {
    failureCount += failures.length;
    console.error(`FAIL ${file}`);
    for (const failure of failures) console.error(`  - ${failure}`);
  }
}

if (failureCount > 0) {
  console.error(`\n${failureCount} validation failure(s)`);
  process.exit(1);
}

console.log(`\nvalidated ${files.length} dossier(s)`);
