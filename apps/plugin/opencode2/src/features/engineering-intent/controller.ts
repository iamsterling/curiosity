import { randomUUID } from "node:crypto";
import { digestCanonical } from "../../core/canonical/index.js";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
import type { EngineeringIntentProfileV1 } from "./codec.js";
import { TrustedObservationStore } from "./observations.js";

export type PursuitAction =
  | "research"
  | "specialist-analysis"
  | "bounded-experiment"
  | "implementation"
  | "verification"
  | "independent-review"
  | "ask-escalate"
  | "stop";
export interface ActionTicket {
  readonly id: string;
  readonly intentID: string;
  readonly intentRevision: number;
  readonly iteration: number;
  readonly gap: { readonly criterionID: string };
  readonly hypothesisRevision: number;
  readonly strategyRevision: number;
  readonly selectedAction: PursuitAction;
  readonly expectedEvidence: readonly string[];
  readonly repositoryRootIdentity: string;
  readonly canonicalScope: readonly string[];
  readonly policyVersion: "1";
  readonly expiresAt: string;
}
export class EngineeringPursuitController {
  private iteration = 0;
  private actions = 0;
  private noProgress = 0;
  private strategyRevision = 1;
  private hypothesisRevision = 1;
  private active: ActionTicket | undefined;
  private readonly evidenced = new Set<string>();
  private readonly evidenceExpiry = new Map<string, number>();
  private terminal: { outcome: "blocked" | "stopped" | "satisfaction-proposed"; code: string } | undefined;
  private lastFailure = false;
  private readonly attemptedActions = new Map<string, Set<PursuitAction>>();
  constructor(
    readonly profile: EngineeringIntentProfileV1,
    readonly budgets: {
      maxIterations: number;
      maxNoProgress: number;
      maxActions: number;
      deadline: string;
      curiosityBreadth: number;
    },
    private readonly observations = new TrustedObservationStore(),
  ) {}
  next(input: { now: string }): ActionTicket {
    if (this.terminal) throw new DiagnosticError(this.terminal.code);
    if (this.active) throw new DiagnosticError("ENGINEERING_ACTION_ALREADY_ACTIVE");
    if (Date.parse(input.now) >= Date.parse(this.budgets.deadline)) return this.stop("ENGINEERING_TIME_BUDGET_STOP");
    if (this.iteration >= this.budgets.maxIterations) return this.stop("ENGINEERING_ITERATION_BUDGET_STOP");
    if (this.actions >= this.budgets.maxActions) return this.stop("ENGINEERING_ACTION_BUDGET_STOP");
    if (this.budgets.curiosityBreadth < 1) return this.stop("ENGINEERING_RESOURCE_BUDGET_STOP");
    for (const [criterion, expiry] of this.evidenceExpiry)
      if (expiry <= Date.parse(input.now)) {
        this.evidenced.delete(criterion);
        this.evidenceExpiry.delete(criterion);
      }
    const criterion = this.profile.completionCriteria.find((item) => !this.evidenced.has(item.id));
    if (!criterion) {
      this.terminal = { outcome: "satisfaction-proposed", code: "ENGINEERING_SATISFACTION_PROPOSED" };
      throw new DiagnosticError(this.terminal.code);
    }
    this.iteration++;
    const preferred: PursuitAction[] = criterion.expectedEvidence.includes("review-observation")
      ? ["independent-review", "research", "specialist-analysis", "bounded-experiment"]
      : criterion.expectedEvidence.some((item) => item === "test-green" || item === "command-result")
        ? ["verification", "research", "specialist-analysis", "bounded-experiment"]
        : ["research", "specialist-analysis", "bounded-experiment", "independent-review"];
    const attempted = this.attemptedActions.get(criterion.id) ?? new Set<PursuitAction>();
    const selectedAction = preferred.find((action) => !attempted.has(action));
    if (!selectedAction) return this.stop("ENGINEERING_ACTION_DIVERSITY_EXHAUSTED");
    this.active = Object.freeze({
      id: randomUUID(),
      intentID: this.profile.intentID,
      intentRevision: this.profile.intentRevision,
      iteration: this.iteration,
      gap: Object.freeze({ criterionID: criterion.id }),
      hypothesisRevision: this.hypothesisRevision,
      strategyRevision: this.strategyRevision,
      selectedAction,
      expectedEvidence: criterion.expectedEvidence,
      repositoryRootIdentity: this.profile.repository.rootIdentity,
      canonicalScope: this.profile.scope.paths,
      policyVersion: this.profile.policyVersion,
      expiresAt: new Date(Math.min(Date.parse(this.budgets.deadline), Date.parse(input.now) + 300000)).toISOString(),
    });
    return this.active;
  }
  observe(input: {
    actionTicketID: string;
    observedToolCallIDs: readonly string[];
    claim?: { outcome: "passed" | "failed" | "blocked"; code: string };
    now: string;
  }): void {
    const ticket = this.active;
    if (!ticket || ticket.id !== input.actionTicketID) throw new DiagnosticError("ENGINEERING_ACTION_TICKET_MISMATCH");
    this.active = undefined;
    this.actions++;
    const valid = input.observedToolCallIDs
      .map((id) => this.observations.resolve(id))
      .filter(
        (observation) =>
          observation &&
          observation.actionTicketID === ticket.id &&
          observation.intentID === ticket.intentID &&
          observation.intentRevision === ticket.intentRevision &&
          observation.criterionID === ticket.gap.criterionID &&
          observation.criterionRevision === 1 &&
          ticket.expectedEvidence.includes(observation.evidenceKind) &&
          observation.status === "passed" &&
          observation.repositoryRevision === this.profile.repository.rootIdentity &&
          observation.environmentDigest ===
            digestCanonical({ root: this.profile.repository.rootIdentity, policy: this.profile.policyVersion }) &&
          (!observation.expiresAt || Date.parse(observation.expiresAt) > Date.parse(input.now)),
      );
    const observedKinds = new Set(valid.map((observation) => observation?.evidenceKind));
    if (ticket.expectedEvidence.every((kind) => observedKinds.has(kind as never))) {
      this.evidenced.add(ticket.gap.criterionID);
      this.evidenceExpiry.set(
        ticket.gap.criterionID,
        Math.min(...valid.map((observation) => Date.parse(observation?.expiresAt ?? ticket.expiresAt))),
      );
      this.noProgress = 0;
      this.lastFailure = false;
    } else {
      this.noProgress++;
      const attempted = this.attemptedActions.get(ticket.gap.criterionID) ?? new Set<PursuitAction>();
      attempted.add(ticket.selectedAction);
      this.attemptedActions.set(ticket.gap.criterionID, attempted);
      if (input.claim?.outcome === "blocked") {
        this.terminal = { outcome: "blocked", code: "ENGINEERING_ACTION_BLOCKED" };
        return;
      }
      if (input.claim?.outcome === "failed") {
        this.hypothesisRevision++;
        this.strategyRevision++;
        this.lastFailure = true;
      }
    }
    if (this.noProgress >= this.budgets.maxNoProgress)
      this.terminal = { outcome: "stopped", code: "ENGINEERING_NO_PROGRESS_STOP" };
  }
  stopByUser(): void {
    this.active = undefined;
    this.terminal = { outcome: "stopped", code: "ENGINEERING_USER_STOP" };
  }
  status() {
    return (
      this.terminal ?? {
        outcome: "pursuing" as const,
        code: "ENGINEERING_PURSUING",
        completionGap: this.profile.completionCriteria.find((item) => !this.evidenced.has(item.id))?.id,
        evidenceCount: this.evidenced.size,
        tokenAccounting: "unsupported" as const,
      }
    );
  }
  private stop(code: string): never {
    this.terminal = { outcome: "stopped", code };
    throw new DiagnosticError(code);
  }
}
