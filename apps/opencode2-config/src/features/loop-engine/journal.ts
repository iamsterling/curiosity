import { digestCanonical } from "../../core/canonical/index.js";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";

export type DispatchState = "prepared" | "dispatched" | "executing" | "terminal";
export type LoopMode = "running" | "paused" | "stopping" | "stopped" | "ambiguous";

export interface LoopJournal {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly rootSessionID: string;
  readonly claim: {
    readonly workID: string;
    readonly token: string;
    readonly revision: number;
    readonly digest: string;
  };
  readonly dispatch: { readonly id: string; readonly digest: string };
  readonly dispatchState: DispatchState;
  readonly mode: LoopMode;
  readonly budgets: {
    readonly maxIterations: number;
    readonly maxNoProgress: number;
    readonly maxChildren: number;
    readonly maxTools: number;
  };
  readonly usageBudgetsDisabled: true;
  readonly iteration: number;
  readonly currentIterationID: string;
  readonly promptID: string;
  readonly noProgress: number;
  readonly evidenceCursor: number;
  readonly ledgerRevision: number;
  readonly terminalEventIDs: readonly string[];
  readonly childSessionIDs: readonly string[];
  readonly captureWatermark: number;
  readonly compaction: {
    readonly state: "none" | "prepared" | "complete";
    readonly references: readonly string[];
    readonly beforeWatermark: number;
    readonly afterWatermark: number;
  };
  readonly breaker: {
    readonly lastFailure?: string;
    readonly repeatedFailures: number;
    readonly lastAction?: string;
    readonly repeatedActions: number;
  };
  readonly stopReason?: string;
}

const fail = (path: string): never => {
  throw new DiagnosticError("LOOP_JOURNAL_SCHEMA_INVALID", path);
};
const object = (value: unknown, path: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail(path);
  return value as Record<string, unknown>;
};
const exact = (value: Record<string, unknown>, keys: readonly string[], path: string): void => {
  const unknown = Object.keys(value).find((key) => !keys.includes(key));
  if (unknown) fail(`${path}.${unknown}`);
};
const text = (value: unknown, path: string): string =>
  typeof value === "string" && value.length > 0 ? value : fail(path);
const integer = (value: unknown, path: string, minimum = 0): number =>
  Number.isSafeInteger(value) && (value as number) >= minimum ? (value as number) : fail(path);
const strings = (value: unknown, path: string): readonly string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.length === 0)) fail(path);
  const items = value as string[];
  if (new Set(items).size !== items.length) fail(path);
  return items;
};

export const iterationIdentity = (claimDigest: string, dispatchDigest: string, iteration: number): string =>
  digestCanonical({ claimDigest, dispatchDigest, iteration });

export const decodeLoopJournal = (value: unknown): LoopJournal => {
  const root = object(value, "$journal");
  if (root.schemaVersion !== 1) throw new DiagnosticError("LOOP_VERSION_UNSUPPORTED");
  exact(
    root,
    [
      "schemaVersion",
      "revision",
      "rootSessionID",
      "claim",
      "dispatch",
      "dispatchState",
      "mode",
      "budgets",
      "usageBudgetsDisabled",
      "iteration",
      "currentIterationID",
      "promptID",
      "noProgress",
      "evidenceCursor",
      "ledgerRevision",
      "terminalEventIDs",
      "childSessionIDs",
      "captureWatermark",
      "compaction",
      "breaker",
      "stopReason",
    ],
    "$journal",
  );
  const claim = object(root.claim, "$journal.claim");
  exact(claim, ["workID", "token", "revision", "digest"], "$journal.claim");
  text(claim.workID, "$journal.claim.workID");
  text(claim.token, "$journal.claim.token");
  integer(claim.revision, "$journal.claim.revision", 1);
  text(claim.digest, "$journal.claim.digest");
  const dispatch = object(root.dispatch, "$journal.dispatch");
  exact(dispatch, ["id", "digest"], "$journal.dispatch");
  text(dispatch.id, "$journal.dispatch.id");
  text(dispatch.digest, "$journal.dispatch.digest");
  const budgets = object(root.budgets, "$journal.budgets");
  exact(budgets, ["maxIterations", "maxNoProgress", "maxChildren", "maxTools"], "$journal.budgets");
  integer(budgets.maxIterations, "$journal.budgets.maxIterations", 1);
  integer(budgets.maxNoProgress, "$journal.budgets.maxNoProgress", 1);
  integer(budgets.maxChildren, "$journal.budgets.maxChildren");
  integer(budgets.maxTools, "$journal.budgets.maxTools", 1);
  const compaction = object(root.compaction, "$journal.compaction");
  exact(compaction, ["state", "references", "beforeWatermark", "afterWatermark"], "$journal.compaction");
  if (!["none", "prepared", "complete"].includes(String(compaction.state))) fail("$journal.compaction.state");
  strings(compaction.references, "$journal.compaction.references");
  integer(compaction.beforeWatermark, "$journal.compaction.beforeWatermark");
  integer(compaction.afterWatermark, "$journal.compaction.afterWatermark");
  const breaker = object(root.breaker, "$journal.breaker");
  exact(breaker, ["lastFailure", "repeatedFailures", "lastAction", "repeatedActions"], "$journal.breaker");
  if (breaker.lastFailure !== undefined) text(breaker.lastFailure, "$journal.breaker.lastFailure");
  if (breaker.lastAction !== undefined) text(breaker.lastAction, "$journal.breaker.lastAction");
  integer(breaker.repeatedFailures, "$journal.breaker.repeatedFailures");
  integer(breaker.repeatedActions, "$journal.breaker.repeatedActions");
  integer(root.revision, "$journal.revision", 1);
  text(root.rootSessionID, "$journal.rootSessionID");
  if (!["prepared", "dispatched", "executing", "terminal"].includes(String(root.dispatchState)))
    fail("$journal.dispatchState");
  if (!["running", "paused", "stopping", "stopped", "ambiguous"].includes(String(root.mode))) fail("$journal.mode");
  if (root.usageBudgetsDisabled !== true) fail("$journal.usageBudgetsDisabled");
  const iteration = integer(root.iteration, "$journal.iteration", 1);
  if (root.currentIterationID !== iterationIdentity(String(claim.digest), String(dispatch.digest), iteration))
    fail("$journal.currentIterationID");
  if (root.promptID !== `opencode2-loop-${String(claim.workID)}-${iteration}`) fail("$journal.promptID");
  integer(root.noProgress, "$journal.noProgress");
  integer(root.evidenceCursor, "$journal.evidenceCursor");
  integer(root.ledgerRevision, "$journal.ledgerRevision");
  strings(root.terminalEventIDs, "$journal.terminalEventIDs");
  const children = strings(root.childSessionIDs, "$journal.childSessionIDs");
  if (children.length > Number(budgets.maxChildren)) fail("$journal.childSessionIDs");
  integer(root.captureWatermark, "$journal.captureWatermark");
  if (root.stopReason !== undefined) text(root.stopReason, "$journal.stopReason");
  return root as unknown as LoopJournal;
};
