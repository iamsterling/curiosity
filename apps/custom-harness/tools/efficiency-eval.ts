#!/usr/bin/env bun
import { cpus, totalmem } from "node:os";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  flattenMetricValues,
  evaluateMetrics,
  loadBudgetFile,
} from "./efficiency/metrics.js";
import {
  runKernelTurnWorkload,
  runResearchTurnWorkload,
} from "./efficiency/kernel-workloads.js";
import {
  runEventLoopWorkload,
  runTuiRenderWorkload,
} from "./efficiency/tui-workloads.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argumentsList = process.argv.slice(2);
let baselinePath: string | undefined;
let enforce = false;
let outputPath: string | undefined;
let samples = 7;
for (let index = 0; index < argumentsList.length; index += 1) {
  const argument = argumentsList[index];
  if (argument === "--enforce") {
    enforce = true;
    continue;
  }
  if (argument === "--baseline" || argument === "--output" || argument === "--samples") {
    const value = argumentsList[index + 1];
    if (!value) throw new Error("EFFICIENCY_ARGUMENT_VALUE_REQUIRED");
    index += 1;
    if (argument === "--baseline") baselinePath = path.resolve(value);
    else if (argument === "--output") outputPath = path.resolve(value);
    else samples = Number(value);
    continue;
  }
  throw new Error(`EFFICIENCY_ARGUMENT_UNSUPPORTED:${argument}`);
}
if (!Number.isSafeInteger(samples) || samples < 1 || samples > 30)
  throw new Error("EFFICIENCY_SAMPLE_COUNT_INVALID");

const budgetPath = path.join(root, "tools", "efficiency-budgets.json");
const budgets = await loadBudgetFile(budgetPath);
const baselineReport = baselinePath
  ? (JSON.parse(await readFile(baselinePath, "utf8")) as {
      readonly metricValues?: Readonly<Record<string, number>>;
    })
  : undefined;
if (
  baselineReport &&
  (!baselineReport.metricValues ||
    typeof baselineReport.metricValues !== "object" ||
    Array.isArray(baselineReport.metricValues) ||
    Object.values(baselineReport.metricValues).some(
      (value) => typeof value !== "number" || !Number.isFinite(value),
    ))
)
  throw new Error("EFFICIENCY_BASELINE_INVALID");
const revision = Bun.spawnSync(["git", "rev-parse", "--short", "HEAD"], {
  cwd: root,
  stderr: "pipe",
  stdout: "pipe",
});
if (revision.exitCode !== 0) throw new Error("EFFICIENCY_REVISION_UNAVAILABLE");
const status = Bun.spawnSync(["git", "status", "--porcelain", "--", "."], {
  cwd: root,
  stderr: "pipe",
  stdout: "pipe",
});
if (status.exitCode !== 0) throw new Error("EFFICIENCY_STATUS_UNAVAILABLE");

const workloads = {
  event_loop: await runEventLoopWorkload(),
  kernel_turn: await runKernelTurnWorkload(
    path.join(root, "native", "supervisor", "target", "debug", "curiosity-supervisor"),
  ),
  research_turn: await runResearchTurnWorkload(
    path.join(root, "native", "supervisor", "target", "debug", "curiosity-supervisor"),
  ),
  tui_render: runTuiRenderWorkload(samples),
};
const metrics = evaluateMetrics(
  workloads,
  budgets.value.budgets,
  baselineReport?.metricValues,
);
const failed = metrics.filter(({ passed }) => !passed);
const report = Object.freeze({
  budget: { digest: budgets.digest, path: "tools/efficiency-budgets.json" },
  environment: {
    architecture: process.arch,
    bunVersion: Bun.version,
    cpuCount: cpus().length,
    cpuModel: cpus()[0]?.model ?? "unknown",
    platform: process.platform,
    totalMemoryBytes: totalmem(),
  },
  generatedAt: new Date().toISOString(),
  metricValues: flattenMetricValues(workloads),
  metrics,
  samples,
  schemaVersion: 1,
  source: {
    dirty: status.stdout.length > 0,
    revision: revision.stdout.toString().trim(),
  },
  verdict: failed.length === 0 ? "PASS" : "FAIL",
  workloads,
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serialized);
}
process.stdout.write(serialized);
if (enforce && failed.length > 0) process.exitCode = 1;
