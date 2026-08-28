import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export interface EfficiencyBudget {
  readonly maximum?: number;
  readonly minimum?: number;
}

export interface EfficiencyMetric {
  readonly baselineDeltaPercent?: number;
  readonly budget?: EfficiencyBudget;
  readonly id: string;
  readonly passed: boolean;
  readonly unit: string;
  readonly value: number;
}

export interface EfficiencyWorkload {
  readonly metrics: Readonly<Record<string, number>>;
  readonly units: Readonly<Record<string, string>>;
}

export interface EfficiencyBudgetFile {
  readonly budgets: Readonly<Record<string, EfficiencyBudget>>;
  readonly schemaVersion: 1;
}

export const percentile = (values: readonly number[], ratio: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1),
  );
  return sorted[index]!;
};

export const rounded = (value: number, places = 3): number =>
  Number(value.toFixed(places));

export const loadBudgetFile = async (
  path: string,
): Promise<{ readonly digest: string; readonly value: EfficiencyBudgetFile }> => {
  const bytes = await readFile(path);
  const value = JSON.parse(bytes.toString()) as EfficiencyBudgetFile;
  if (
    value.schemaVersion !== 1 ||
    !value.budgets ||
    typeof value.budgets !== "object" ||
    Array.isArray(value.budgets)
  )
    throw new Error("EFFICIENCY_BUDGET_INVALID");
  for (const [id, budget] of Object.entries(value.budgets)) {
    if (
      !id ||
      !budget ||
      typeof budget !== "object" ||
      Array.isArray(budget) ||
      Object.keys(budget).some((key) => key !== "maximum" && key !== "minimum") ||
      (budget.maximum !== undefined && !Number.isFinite(budget.maximum)) ||
      (budget.minimum !== undefined && !Number.isFinite(budget.minimum)) ||
      (budget.maximum === undefined && budget.minimum === undefined) ||
      (budget.maximum !== undefined &&
        budget.minimum !== undefined &&
        budget.minimum > budget.maximum)
    )
      throw new Error(`EFFICIENCY_BUDGET_INVALID:${id}`);
  }
  return {
    digest: createHash("sha256").update(bytes).digest("hex"),
    value,
  };
};

export const evaluateMetrics = (
  workloads: Readonly<Record<string, EfficiencyWorkload>>,
  budgets: Readonly<Record<string, EfficiencyBudget>>,
  baseline: Readonly<Record<string, number>> = {},
): readonly EfficiencyMetric[] => {
  const observed = Object.fromEntries(
    Object.entries(workloads).flatMap(([workloadId, workload]) =>
      Object.entries(workload.metrics).map(([metricId, value]) => [
        `${workloadId}.${metricId}`,
        { unit: workload.units[metricId] ?? "count", value },
      ]),
    ),
  );
  for (const budgetId of Object.keys(budgets))
    if (!(budgetId in observed)) throw new Error(`EFFICIENCY_METRIC_MISSING:${budgetId}`);
  return Object.entries(observed)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, observation]) => {
      const budget = budgets[id];
      const baselineValue = baseline[id];
      const passed =
        (!budget || budget.maximum === undefined ||
          observation.value <= budget.maximum) &&
        (!budget || budget.minimum === undefined ||
          observation.value >= budget.minimum);
      return Object.freeze({
        ...(baselineValue !== undefined && baselineValue !== 0
          ? {
              baselineDeltaPercent: rounded(
                ((observation.value - baselineValue) / Math.abs(baselineValue)) *
                  100,
              ),
            }
          : {}),
        ...(budget ? { budget } : {}),
        id,
        passed,
        unit: observation.unit,
        value: rounded(observation.value),
      });
    });
};

export const flattenMetricValues = (
  workloads: Readonly<Record<string, EfficiencyWorkload>>,
): Readonly<Record<string, number>> =>
  Object.fromEntries(
    Object.entries(workloads).flatMap(([workloadId, workload]) =>
      Object.entries(workload.metrics).map(([metricId, value]) => [
        `${workloadId}.${metricId}`,
        rounded(value),
      ]),
    ),
  );
