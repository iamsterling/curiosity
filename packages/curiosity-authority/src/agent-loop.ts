import type {
  AgentJournalReconciledAttempt,
  AgentJournalTerminalRun,
  AgentTerminalJournalPort,
} from "./agent-journal-port.js";
import type { AgentKernel, AgentKernelDrainResult } from "./agent-kernel.js";
import type {
  AgentReadToolDrainResult,
  AgentReadToolKernel,
} from "./agent-tool-kernel.js";
import { PortableAuthorityError } from "./domain.js";

export interface DurableAgentLoopConfig {
  readonly agent: Pick<AgentKernel, "drainOne" | "recover">;
  readonly journal: AgentTerminalJournalPort;
  readonly now: () => string;
  readonly terminalLimit?: number;
  readonly tools: Pick<AgentReadToolKernel, "drainOne">;
}

export type DurableAgentLoopDrainResult =
  | { readonly kind: "idle" }
  | {
      readonly kind: "terminal-reconciled";
      readonly terminals: readonly AgentJournalTerminalRun[];
    }
  | {
      readonly agent: AgentKernelDrainResult;
      readonly kind: "agent";
      readonly terminals: readonly AgentJournalTerminalRun[];
    }
  | {
      readonly kind: "tool";
      readonly tool: Exclude<AgentReadToolDrainResult, { readonly kind: "idle" }>;
    };

export interface DurableAgentLoopRecoveryResult {
  readonly attempts: readonly AgentJournalReconciledAttempt[];
  readonly terminals: readonly AgentJournalTerminalRun[];
}

const maximumTerminalBatch = 128;

export class DurableAgentLoop {
  readonly #config: DurableAgentLoopConfig;
  readonly #terminalLimit: number;
  #draining = false;

  constructor(config: DurableAgentLoopConfig) {
    const terminalLimit = config.terminalLimit ?? 32;
    if (
      !Number.isSafeInteger(terminalLimit) ||
      terminalLimit < 1 ||
      terminalLimit > maximumTerminalBatch
    )
      throw new PortableAuthorityError("AGENT_LOOP_CONFIG_INVALID");
    this.#config = config;
    this.#terminalLimit = terminalLimit;
  }

  async drainOne(signal: AbortSignal): Promise<DurableAgentLoopDrainResult> {
    if (this.#draining) throw new PortableAuthorityError("AGENT_LOOP_BUSY");
    if (signal.aborted) throw new PortableAuthorityError("ACTION_CANCELLED");
    this.#draining = true;
    try {
      const terminals = await this.#reconcileTerminals();
      if (terminals.length > 0)
        return { kind: "terminal-reconciled", terminals };
      const tool = await this.#config.tools.drainOne(signal);
      if (tool.kind !== "idle") return { kind: "tool", tool };
      const agent = await this.#config.agent.drainOne(signal);
      if (agent.kind === "idle") return { kind: "idle" };
      return {
        agent,
        kind: "agent",
        terminals:
          agent.kind === "committed" &&
          (agent.proposalKind === "final" || agent.proposalKind === "no-go")
            ? await this.#reconcileTerminals()
            : [],
      };
    } finally {
      this.#draining = false;
    }
  }

  async recover(): Promise<DurableAgentLoopRecoveryResult> {
    const attempts = await this.#config.agent.recover(this.#config.now());
    const terminals = await this.#reconcileTerminals();
    return { attempts, terminals };
  }

  #reconcileTerminals(): Promise<readonly AgentJournalTerminalRun[]> {
    return Promise.resolve(
      this.#config.journal.reconcileTerminalRuns(
        this.#config.now(),
        this.#terminalLimit,
      ),
    );
  }
}
