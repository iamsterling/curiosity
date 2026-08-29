#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.dirname(new URL(import.meta.url).pathname);
const rosterPath = path.join(root, "ROSTER.md");
const dossiersDir = path.join(root, "dossiers");
const requireAll = process.argv.includes("--require-all");

const headings = [
  "Metadata and scope",
  "Executive summary",
  "Product identity, history, and market position",
  "Workflow and conceptual model",
  "Publicly documented architecture",
  "Audio engine",
  "Tracks, timeline, clips, and editing",
  "MIDI, sequencing, notation, and expression",
  "Routing, mixer, automation, and control",
  "Recording, comping, and media handling",
  "Instruments, effects, content, and native devices",
  "Third-party plugin hosting",
  "Extensibility and integration",
  "Project format, persistence, interoperability, and collaboration",
  "Delivery, live, post-production, and specialized workflows",
  "Performance, reliability, security, and accessibility",
  "Licensing, ecosystem, and implementation constraints",
  "Strengths, liabilities, and architecture lessons",
  "Transferable patterns",
  "Rejected patterns and CURIOSITY_NO_GO",
  "Falsifiable hypotheses and adversarial checks",
  "Claims register",
  "Source ledger and adaptive bibliography",
  "Unknowns and next discriminating probes",
  "Curiosity pass and stop decision",
  "Completion checklist",
];

const formats = [
  "VST2",
  "VST3",
  "AUv2",
  "AUv3",
  "AAX",
  "CLAP",
  "LV2",
  "LADSPA",
  "DSSI",
  "JSFX",
  "DirectX/DXi",
  "Rack Extension",
  "Product-native/other",
];
const hostingSubsections = [1, 2, 3, 4, 5, 6];

const roster = await readFile(rosterPath, "utf8");
const rosterPaths = [...roster.matchAll(/`(dossiers\/[a-z0-9-]+\.md)`/g)].map(
  (match) => match[1],
);
const uniquePaths = [...new Set(rosterPaths)];
const duplicatePaths = rosterPaths.filter(
  (item, index) => rosterPaths.indexOf(item) !== index,
);

const errors = [];
const warnings = [];
const results = [];

if (duplicatePaths.length > 0) {
  errors.push(`duplicate roster paths: ${[...new Set(duplicatePaths)].join(", ")}`);
}

for (const relativePath of uniquePaths) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    const message = `missing ${relativePath}`;
    (requireAll ? errors : warnings).push(message);
    results.push({ path: relativePath, state: "MISSING" });
    continue;
  }

  const markdown = await readFile(absolutePath, "utf8");
  const fileErrorCount = errors.length;
  const missingHeadings = headings.filter(
    (heading, index) =>
      !new RegExp(`^##\\s+${index}\\.\\s+${escapeRegExp(heading)}\\s*$`, "m").test(
        markdown,
      ),
  );
  const missingFormats = formats.filter(
    (format) =>
      !new RegExp(`^\\|\\s*${escapeRegExp(format)}\\s*\\|`, "m").test(markdown),
  );
  const hasClaim = /\bC-\d{3}\b/.test(markdown);
  const hasSource = /\bS-\d{3}\b/.test(markdown);
  const hasClassification = /\b(?:DOCUMENTED|OBSERVED|INFERENCE|UNKNOWN)\b/.test(
    markdown,
  );
  const missingHostingSubsections = hostingSubsections.filter(
    (number) => !new RegExp(`^###\\s+11\\.${number}\\s+`, "m").test(markdown),
  );

  if (missingHeadings.length > 0) {
    errors.push(`${relativePath}: missing headings: ${missingHeadings.join(", ")}`);
  }
  if (missingFormats.length > 0) {
    errors.push(`${relativePath}: missing plugin rows: ${missingFormats.join(", ")}`);
  }
  if (missingHostingSubsections.length > 0) {
    errors.push(
      `${relativePath}: missing hosting subsections: ${missingHostingSubsections
        .map((number) => `11.${number}`)
        .join(", ")}`,
    );
  }
  if (!hasClaim) errors.push(`${relativePath}: no C-nnn claim ID`);
  if (!hasSource) errors.push(`${relativePath}: no S-nnn source ID`);
  if (!hasClassification) errors.push(`${relativePath}: no claim classification`);

  const matrixSection = extractSection(markdown, "### 11.1", "### 11.2");
  const matrixRows = matrixSection
    .split("\n")
    .filter((line) => line.trimStart().startsWith("|"))
    .map(parseMarkdownCells)
    .filter((cells) => formats.includes(cells[0]));
  const duplicateFormats = matrixRows
    .map((cells) => cells[0])
    .filter((format, index, rows) => rows.indexOf(format) !== index);
  if (duplicateFormats.length > 0) {
    errors.push(
      `${relativePath}: duplicate plugin rows: ${[
        ...new Set(duplicateFormats),
      ].join(", ")}`,
    );
  }
  for (const cells of matrixRows) {
    if (cells.length !== 8) {
      errors.push(
        `${relativePath}: ${cells[0]} row has ${cells.length} cells; expected 8`,
      );
      continue;
    }
    if (cells.some((cell) => cell.length === 0)) {
      errors.push(`${relativePath}: ${cells[0]} row has a blank cell`);
    }
  }

  const claimsSection = extractSection(markdown, "## 21.", "## 22.");
  const claimRows = new Map();
  for (const line of claimsSection.split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    const cells = parseMarkdownCells(line);
    if (!/^C-\d{3}$/.test(cells[0] ?? "")) continue;
    if (claimRows.has(cells[0])) {
      errors.push(`${relativePath}: duplicate claim definition ${cells[0]}`);
    }
    claimRows.set(cells[0], cells);
    if (cells.length !== 8) {
      errors.push(
        `${relativePath}: ${cells[0]} claim row has ${cells.length} cells; expected 8`,
      );
      continue;
    }
    if (!/DOCUMENTED|OBSERVED|INFERENCE|UNKNOWN/.test(cells[1])) {
      errors.push(`${relativePath}: ${cells[0]} has invalid classification`);
    }
    if (
      /DOCUMENTED|OBSERVED/.test(cells[1]) &&
      collectIds(cells[5], "S").size === 0
    ) {
      errors.push(
        `${relativePath}: ${cells[0]} is documented/observed without a source ID`,
      );
    }
  }

  const definedClaims = new Set(claimRows.keys());
  const undefinedClaims = setDifference(collectIds(markdown, "C"), definedClaims);
  if (undefinedClaims.size > 0) {
    errors.push(
      `${relativePath}: undefined claim references: ${[...undefinedClaims]
        .sort()
        .join(", ")}`,
    );
  }

  const sourceSection = extractSection(markdown, "## 22.", "## 23.");
  const sourceEntries = parseSourceEntries(sourceSection);
  const sourceIds = sourceEntries.map((entry) => entry.id);
  const definedSources = new Set(sourceIds);
  if (definedSources.size !== sourceIds.length) {
    errors.push(`${relativePath}: duplicate source definitions`);
  }
  for (const entry of sourceEntries) {
    if (collectIds(entry.text, "C").size === 0) {
      errors.push(
        `${relativePath}: ${entry.id} source entry has no supported claim ID`,
      );
    }
  }
  const undefinedSourceClaims = setDifference(
    collectIds(sourceSection, "C"),
    definedClaims,
  );
  if (undefinedSourceClaims.size > 0) {
    errors.push(
      `${relativePath}: source ledger cites undefined claims: ${[
        ...undefinedSourceClaims,
      ]
        .sort()
        .join(", ")}`,
    );
  }
  const undefinedSources = setDifference(collectIds(markdown, "S"), definedSources);
  if (undefinedSources.size > 0) {
    errors.push(
      `${relativePath}: undefined source references: ${[...undefinedSources]
        .sort()
        .join(", ")}`,
    );
  }
  if (/[ \t]+$/m.test(markdown)) {
    errors.push(`${relativePath}: trailing whitespace`);
  }
  if (markdown.includes("[ ]")) {
    errors.push(`${relativePath}: unchecked completion item`);
  }

  results.push({
    path: relativePath,
    state: errors.length > fileErrorCount ? "INVALID" : "STRUCTURE_OK",
  });
}

const diskFiles = (await readdir(dossiersDir))
  .filter((name) => name.endsWith(".md") && name !== "README.md")
  .map((name) => `dossiers/${name}`);
const unrostered = diskFiles.filter((name) => !uniquePaths.includes(name));
if (unrostered.length > 0) {
  warnings.push(`unrostered dossiers: ${unrostered.join(", ")}`);
}

const counts = Object.groupBy
  ? Object.groupBy(results, (result) => result.state)
  : results.reduce((groups, result) => {
      (groups[result.state] ??= []).push(result);
      return groups;
    }, {});

console.log(`Roster targets: ${uniquePaths.length}`);
for (const state of ["STRUCTURE_OK", "INVALID", "MISSING"]) {
  console.log(`${state}: ${(counts[state] ?? []).length}`);
}
for (const warning of warnings) console.warn(`WARN: ${warning}`);
for (const error of errors) console.error(`ERROR: ${error}`);

process.exitCode = errors.length > 0 ? 1 : 0;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSection(markdown, startMarker, endMarker) {
  const start = markdown.indexOf(startMarker);
  if (start === -1) return "";
  const end = markdown.indexOf(endMarker, start + startMarker.length);
  return markdown.slice(start, end === -1 ? markdown.length : end);
}

function parseMarkdownCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function collectIds(text, prefix) {
  const ids = new Set();
  const rangePattern = new RegExp(
    `(?<![A-Za-z0-9])${prefix}-(\\d{3})\\s*[–—-]\\s*${prefix}-(\\d{3})(?!\\d)`,
    "g",
  );
  for (const match of text.matchAll(rangePattern)) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (end < start || end - start > 500) continue;
    for (let number = start; number <= end; number += 1) {
      ids.add(`${prefix}-${String(number).padStart(3, "0")}`);
    }
  }
  const idPattern = new RegExp(
    `(?<![A-Za-z0-9])${prefix}-(\\d{3})(?!\\d)`,
    "g",
  );
  for (const match of text.matchAll(idPattern)) {
    ids.add(`${prefix}-${match[1]}`);
  }
  return ids;
}

function parseSourceEntries(sourceSection) {
  const entries = [];
  for (const line of sourceSection.split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    const cells = parseMarkdownCells(line);
    if (/^S-\d{3}$/.test(cells[0] ?? "")) {
      entries.push({ id: cells[0], text: line });
    }
  }
  entries.push(...parseSourceBlocks(sourceSection, /^###\s+(S-\d{3})\b/gm));
  entries.push(
    ...parseSourceBlocks(sourceSection, /^\s*[-*]\s+\*\*(S-\d{3})\b/gm),
  );
  entries.push(
    ...parseSourceBlocks(
      sourceSection,
      /^(?!\s*[-*]\s)\s*\*\*(S-\d{3})\b/gm,
    ),
  );
  return entries;
}

function parseSourceBlocks(sourceSection, pattern) {
  const matches = [...sourceSection.matchAll(pattern)];
  return matches.map((match, index) => ({
    id: match[1],
    text: sourceSection.slice(
      match.index,
      matches[index + 1]?.index ?? sourceSection.length,
    ),
  }));
}

function setDifference(left, right) {
  return new Set([...left].filter((value) => !right.has(value)));
}
