import {
  PortableAuthorityError,
  type AgentControlJournalPort,
  type AgentJournalControlMutationResult,
  type AgentJournalDecideGate,
  type AgentJournalOperatorRequests,
} from "@curiosity/authority";
import type { DurableAgentScheduler } from "./durable-agent-scheduler.ts";

export interface DurableAgentControlConfig {
  readonly actorId: string;
  readonly createId: () => string;
  readonly journal: AgentControlJournalPort;
  readonly now: () => string;
  readonly scheduler: Pick<DurableAgentScheduler, "wake">;
}

export interface DurableGateDecisionTarget {
  readonly gateId: string;
  readonly payloadDigest: string;
  readonly proposalRevision: number;
}

export interface DurableAgentControlPort {
  readonly answerQuestion: (
    questionId: string,
    answer: string,
  ) => Promise<AgentJournalControlMutationResult>;
  readonly decideGate: (
    target: DurableGateDecisionTarget,
    decision: AgentJournalDecideGate["decision"],
  ) => Promise<AgentJournalControlMutationResult>;
  readonly listOperatorRequests: () => Promise<AgentJournalOperatorRequests>;
}

const identifier = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;

export class DurableAgentControl implements DurableAgentControlPort {
  readonly #config: DurableAgentControlConfig;
  #serial: Promise<void> = Promise.resolve();

  constructor(config: DurableAgentControlConfig) {
    if (!identifier.test(config.actorId))
      throw new PortableAuthorityError("AGENT_CONTROL_CONFIG_INVALID");
    this.#config = config;
  }

  answerQuestion(
    questionId: string,
    answer: string,
  ): Promise<AgentJournalControlMutationResult> {
    return this.#serialize(async () => {
      const result = await this.#config.journal.answerQuestion({
        actorId: this.#config.actorId,
        answer,
        answeredAt: this.#config.now(),
        commandId: this.#config.createId(),
        questionId,
      });
      await this.#config.scheduler.wake();
      return result;
    });
  }

  decideGate(
    target: DurableGateDecisionTarget,
    decision: AgentJournalDecideGate["decision"],
  ): Promise<AgentJournalControlMutationResult> {
    return this.#serialize(async () => {
      const result = await this.#config.journal.decideGate({
        actorId: this.#config.actorId,
        commandId: this.#config.createId(),
        decidedAt: this.#config.now(),
        decision,
        gateId: target.gateId,
        payloadDigest: target.payloadDigest,
        proposalRevision: target.proposalRevision,
      });
      await this.#config.scheduler.wake();
      return result;
    });
  }

  listOperatorRequests(): Promise<AgentJournalOperatorRequests> {
    return Promise.resolve(this.#config.journal.listOperatorRequests(32));
  }

  #serialize<T>(work: () => Promise<T>): Promise<T> {
    const result = this.#serial.then(work, work);
    this.#serial = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
