import { mkdir } from "node:fs/promises";
import path from "node:path";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
import { atomicWrite, readJSON, withLease } from "../../platform/persistence/atomic-store.js";
import { decodeLoopJournal, iterationIdentity, type DispatchState, type LoopJournal } from "./journal.js";
export { decodeLoopJournal, type DispatchState, type LoopJournal } from "./journal.js";
export type { IterationBudget, LoopContinuationPort } from "./ports.js";

interface ContinuationAuthority {
  readonly claim: "current" | "stale" | "unknown";
  readonly fence: "current" | "stale" | "unknown";
}
interface Effects {
  prompt(input: {
    sessionID: string;
    text: string;
    id: string;
    metadata: Record<string, string>;
    resume: true;
  }): Promise<unknown>;
  interrupt(input: { sessionID: string }): Promise<unknown>;
  validateContinuation?(input: {
    claim: LoopJournal["claim"];
    journalRevision: number;
  }): Promise<ContinuationAuthority>;
  reconcileDispatch?(input: {
    sessionID: string;
    promptID: string;
    iterationID: string;
  }): Promise<DispatchState | "unknown">;
}
export interface TerminalObservation {
  readonly id: string;
  readonly sessionID: string;
  readonly evidenceCursor: number;
  readonly ledgerRevision?: number;
  readonly ledgerAdvanceAccepted?: boolean;
  readonly retryPermitted?: boolean;
  readonly descendantsTerminal: boolean;
  readonly toolsTerminal: boolean;
  readonly lineageProven?: boolean;
  readonly captureContinuous?: boolean;
  readonly interrupted?: boolean;
  readonly captureWatermark?: number;
  readonly failureSignature?: string;
  readonly actionSignature?: string;
}

const promptFor = (journal: LoopJournal): Parameters<Effects["prompt"]>[0] => ({
  sessionID: journal.rootSessionID,
  text: `Continue accepted claim ${journal.claim.workID} at revision ${journal.claim.revision}. Use Ledger tools for all lifecycle proposals.`,
  id: journal.promptID,
  metadata: {
    "opencode2-config": "native-loop-v1",
    iteration: String(journal.iteration),
    claim: journal.claim.digest,
    causation: journal.currentIterationID,
  },
  resume: true,
});
const iterationFields = (claim: LoopJournal["claim"], dispatch: LoopJournal["dispatch"], iteration: number) => ({
  currentIterationID: iterationIdentity(claim.digest, dispatch.digest, iteration),
  promptID: `opencode2-loop-${claim.workID}-${iteration}`,
});

export class NativeLoopEngine {
  private readonly journalPath: string;
  private constructor(
    readonly root: string,
    private readonly effects: Effects,
  ) {
    this.journalPath = path.join(root, "journal.json");
  }

  static async open(projectDirectory: string, effects: Effects): Promise<NativeLoopEngine> {
    const root = path.join(projectDirectory, ".opencode/opencode2-config/execution-journal/v1");
    await mkdir(root, { recursive: true });
    const engine = new NativeLoopEngine(root, effects);
    await engine.reconcileRestart();
    return engine;
  }

  async status(): Promise<LoopJournal> {
    const value = await readJSON(this.journalPath);
    if (!value) throw new DiagnosticError("LOOP_NOT_STARTED");
    return decodeLoopJournal(value);
  }

  async start(input: Pick<LoopJournal, "claim" | "rootSessionID" | "dispatch" | "budgets">): Promise<LoopJournal> {
    if (!this.effects.validateContinuation)
      throw new DiagnosticError("PERSISTENCE_AUTOMATION_UNSUPPORTED", this.journalPath);
    const authority = await this.effects.validateContinuation({ claim: input.claim, journalRevision: 0 });
    if (authority.claim !== "current" || authority.fence !== "current")
      throw new DiagnosticError("PERSISTENCE_AUTOMATION_UNSUPPORTED", this.journalPath);
    let journal!: LoopJournal;
    await withLease(this.root, async () => {
      const existing = await readJSON(this.journalPath);
      if (existing && ["running", "stopping"].includes(decodeLoopJournal(existing).mode))
        throw new DiagnosticError("LOOP_ALREADY_RUNNING");
      journal = {
        schemaVersion: 1,
        revision: 1,
        ...input,
        dispatchState: "prepared",
        mode: "running",
        usageBudgetsDisabled: true,
        iteration: 1,
        ...iterationFields(input.claim, input.dispatch, 1),
        noProgress: 0,
        evidenceCursor: 0,
        ledgerRevision: input.claim.revision,
        terminalEventIDs: [],
        childSessionIDs: [],
        captureWatermark: 0,
        compaction: { state: "none", references: [], beforeWatermark: 0, afterWatermark: 0 },
        breaker: { repeatedFailures: 0, repeatedActions: 0 },
      };
      await this.write(journal);
    });
    await this.dispatchPrepared(journal);
    return this.status();
  }

  async markExecuting(promptID: string): Promise<void> {
    await this.update((current) =>
      current.mode === "running" && current.promptID === promptID && current.dispatchState === "dispatched"
        ? { ...current, revision: current.revision + 1, dispatchState: "executing" }
        : current,
    );
  }

  async observeTerminal(input: TerminalObservation): Promise<void> {
    let nextPrompt: LoopJournal | undefined;
    await withLease(this.root, async () => {
      const current = await this.status();
      if (current.terminalEventIDs.includes(input.id)) return;
      if (current.mode === "stopping") {
        if (input.sessionID !== current.rootSessionID) return;
        await this.write({
          ...current,
          revision: current.revision + 1,
          dispatchState: "terminal",
          mode: "stopped",
          stopReason: "LOOP_INTERRUPTED",
          terminalEventIDs: [...current.terminalEventIDs, input.id],
        });
        return;
      }
      if (current.mode !== "running") return;
      const terminal = {
        ...current,
        revision: current.revision + 1,
        dispatchState: "terminal" as const,
        terminalEventIDs: [...current.terminalEventIDs, input.id],
      };
      const rejection = await this.continuationRejection(current, input);
      if (rejection) {
        await this.write({ ...terminal, mode: "ambiguous", stopReason: rejection });
        return;
      }
      const breaker = this.nextBreaker(current, input);
      const noProgress = input.evidenceCursor > current.evidenceCursor ? 0 : current.noProgress + 1;
      const stopReason =
        breaker.repeatedFailures >= current.budgets.maxNoProgress
          ? "LOOP_REPEATED_FAILURE_LIMIT"
          : breaker.repeatedActions >= current.budgets.maxNoProgress
            ? "LOOP_REPEATED_ACTION_LIMIT"
            : noProgress >= current.budgets.maxNoProgress
              ? "LOOP_NO_PROGRESS_LIMIT"
              : current.iteration >= current.budgets.maxIterations
                ? "LOOP_ITERATION_LIMIT"
                : undefined;
      if (stopReason) {
        await this.write({ ...terminal, mode: "stopped", stopReason, noProgress, breaker });
        return;
      }
      const iteration = current.iteration + 1;
      nextPrompt = {
        ...terminal,
        dispatchState: "prepared",
        iteration,
        ...iterationFields(current.claim, current.dispatch, iteration),
        noProgress,
        evidenceCursor: input.evidenceCursor,
        ledgerRevision: input.ledgerRevision ?? current.ledgerRevision,
        captureWatermark: input.captureWatermark ?? current.captureWatermark,
        breaker,
      };
      await this.write(nextPrompt);
    });
    if (nextPrompt) await this.dispatchPrepared(nextPrompt);
  }

  async observeUserInput(input: { sessionID: string; inputID: string; type: "user" | "synthetic" }): Promise<void> {
    if (input.type !== "user") return;
    await this.update((current) =>
      current.mode === "running" && input.sessionID === current.rootSessionID && input.inputID !== current.promptID
        ? { ...current, revision: current.revision + 1, mode: "paused", stopReason: "LOOP_USER_INTERRUPTION" }
        : current,
    );
  }
  async prepareCompaction(references: readonly string[], watermark: number): Promise<void> {
    if (!references.length || new Set(references).size !== references.length)
      throw new DiagnosticError("LOOP_COMPACTION_REFERENCES_REQUIRED");
    await this.update((current) => ({
      ...current,
      revision: current.revision + 1,
      compaction: {
        state: "prepared",
        references: [...references].sort(),
        beforeWatermark: watermark,
        afterWatermark: 0,
      },
    }));
  }
  async completeCompaction(references: readonly string[], afterWatermark: number): Promise<void> {
    await this.update((current) => {
      if (
        current.compaction.state !== "prepared" ||
        JSON.stringify([...references].sort()) !== JSON.stringify(current.compaction.references) ||
        afterWatermark < current.compaction.beforeWatermark
      )
        return {
          ...current,
          revision: current.revision + 1,
          mode: "ambiguous",
          stopReason: "LOOP_COMPACTION_CONTINUITY_AMBIGUOUS",
        };
      return {
        ...current,
        revision: current.revision + 1,
        compaction: { ...current.compaction, state: "complete", afterWatermark },
      };
    });
  }
  async pause(): Promise<void> {
    await this.setMode("paused", "LOOP_PAUSED");
  }
  async resume(): Promise<void> {
    const current = await this.status();
    if (current.mode !== "paused") throw new DiagnosticError("LOOP_RESUME_INVALID_STATE");
    if (!this.effects.validateContinuation) throw new DiagnosticError("LOOP_AUTHORITY_UNSUPPORTED");
    const authority = await this.effects.validateContinuation({
      claim: current.claim,
      journalRevision: current.revision,
    });
    if (authority.claim !== "current" || authority.fence !== "current")
      throw new DiagnosticError("LOOP_AUTHORITY_AMBIGUOUS");
    if (!["dispatched", "executing"].includes(current.dispatchState))
      throw new DiagnosticError("LOOP_RESUME_OUTCOME_AMBIGUOUS");
    const { stopReason: _stopReason, ...withoutReason } = current;
    await this.update(() => ({ ...withoutReason, revision: current.revision + 1, mode: "running" }));
  }
  async stop(): Promise<void> {
    throw new DiagnosticError("REAL_HOST_INTERRUPT_UNPROVEN");
  }

  private async continuationRejection(current: LoopJournal, input: TerminalObservation): Promise<string | undefined> {
    if (current.dispatchState !== "dispatched" && current.dispatchState !== "executing")
      return "LOOP_ROOT_STATE_AMBIGUOUS";
    if (
      input.sessionID !== current.rootSessionID ||
      !input.descendantsTerminal ||
      !input.toolsTerminal ||
      input.lineageProven !== true
    )
      return "LOOP_LINEAGE_AMBIGUOUS";
    if (input.interrupted !== false) return "LOOP_INTERRUPTION_AMBIGUOUS";
    if (input.captureContinuous !== true) return "LOOP_CAPTURE_CONTINUITY_AMBIGUOUS";
    if (
      current.compaction.state === "prepared" ||
      (current.compaction.state === "complete" &&
        (input.captureWatermark === undefined || input.captureWatermark < current.compaction.afterWatermark))
    )
      return "LOOP_COMPACTION_CONTINUITY_AMBIGUOUS";
    if (!this.effects.validateContinuation) return "LOOP_AUTHORITY_UNSUPPORTED";
    const authority = await this.effects.validateContinuation({
      claim: current.claim,
      journalRevision: current.revision,
    });
    if (authority.claim !== "current" || authority.fence !== "current") return "LOOP_AUTHORITY_AMBIGUOUS";
    const advanced =
      input.ledgerAdvanceAccepted === true &&
      input.ledgerRevision !== undefined &&
      input.ledgerRevision > current.ledgerRevision &&
      input.evidenceCursor > current.evidenceCursor;
    if (!advanced && input.retryPermitted !== true) return "LOOP_LEDGER_ADVANCE_REQUIRED";
    return undefined;
  }
  private nextBreaker(current: LoopJournal, input: TerminalObservation): LoopJournal["breaker"] {
    const repeatedFailures = input.failureSignature
      ? input.failureSignature === current.breaker.lastFailure
        ? current.breaker.repeatedFailures + 1
        : 1
      : 0;
    const repeatedActions = input.actionSignature
      ? input.actionSignature === current.breaker.lastAction
        ? current.breaker.repeatedActions + 1
        : 1
      : 0;
    return {
      ...(input.failureSignature ? { lastFailure: input.failureSignature } : {}),
      repeatedFailures,
      ...(input.actionSignature ? { lastAction: input.actionSignature } : {}),
      repeatedActions,
    };
  }
  private async dispatchPrepared(journal: LoopJournal): Promise<void> {
    try {
      await this.effects.prompt(promptFor(journal));
      await this.update((current) =>
        current.promptID === journal.promptID && current.dispatchState === "prepared"
          ? { ...current, revision: current.revision + 1, dispatchState: "dispatched" }
          : current,
      );
    } catch (error) {
      await this.setMode("ambiguous", "LOOP_DISPATCH_AMBIGUOUS");
      throw error;
    }
  }
  private async reconcileRestart(): Promise<void> {
    const raw = await readJSON(this.journalPath);
    if (!raw) return;
    const current = decodeLoopJournal(raw);
    if (current.mode !== "running") return;
    if (!this.effects.reconcileDispatch) {
      await this.write({
        ...current,
        revision: current.revision + 1,
        mode: "ambiguous",
        stopReason: "LOOP_RESTART_OUTCOME_AMBIGUOUS",
      });
      return;
    }
    const observed = await this.effects.reconcileDispatch({
      sessionID: current.rootSessionID,
      promptID: current.promptID,
      iterationID: current.currentIterationID,
    });
    const forward = current.dispatchState === "dispatched" && observed === "executing";
    if (
      observed === "unknown" ||
      (current.dispatchState !== "prepared" && observed !== current.dispatchState && !forward)
    ) {
      await this.write({
        ...current,
        revision: current.revision + 1,
        mode: "ambiguous",
        stopReason: "LOOP_RESTART_OUTCOME_AMBIGUOUS",
      });
      return;
    }
    if (current.dispatchState === "prepared" && observed === "prepared") await this.dispatchPrepared(current);
    if (forward) await this.write({ ...current, revision: current.revision + 1, dispatchState: "executing" });
  }
  private async setMode(mode: LoopJournal["mode"], stopReason: string | undefined): Promise<void> {
    await this.update((current) => {
      const { stopReason: _stopReason, ...withoutReason } = current;
      return {
        ...withoutReason,
        revision: current.revision + 1,
        mode,
        ...(stopReason === undefined ? {} : { stopReason }),
      };
    });
  }
  private async update(change: (current: LoopJournal) => LoopJournal): Promise<void> {
    await withLease(this.root, async () => {
      const current = await this.status();
      const next = change(current);
      if (next !== current) await this.write(next);
    });
  }
  private async write(journal: LoopJournal): Promise<void> {
    decodeLoopJournal(journal);
    await atomicWrite(this.journalPath, `${JSON.stringify(journal)}\n`);
  }
}
