import {
  PortableAuthorityError,
  type DurableAgentLoop,
  type DurableAgentLoopDrainResult,
  type DurableAgentLoopRecoveryResult,
  type PortableAuthority,
} from "@curiosity/authority";
import type { DurableAgentAdmission } from "./durable-agent-admission.ts";

export interface DurableAgentSchedulerConfig {
  readonly admission: Pick<DurableAgentAdmission, "reconcile">;
  readonly createAuthority: () => Promise<Pick<PortableAuthority, "events">>;
  readonly loop: Pick<DurableAgentLoop, "drainOne" | "recover">;
  readonly maximumUnitsPerWake?: number;
}

export interface DurableAgentWakeResult {
  readonly admittedRuns: number;
  readonly drains: readonly DurableAgentLoopDrainResult[];
  readonly recovered?: DurableAgentLoopRecoveryResult;
  readonly stopped: "blocked" | "budget" | "idle" | "inactive";
}

const maximumWakeBudget = 128;

export class DurableAgentScheduler {
  readonly #config: DurableAgentSchedulerConfig;
  readonly #maximumUnitsPerWake: number;
  #active = true;
  #controller?: AbortController;
  #recovered = false;
  #serial: Promise<void> = Promise.resolve();

  constructor(config: DurableAgentSchedulerConfig) {
    const maximumUnitsPerWake = config.maximumUnitsPerWake ?? 32;
    if (
      !Number.isSafeInteger(maximumUnitsPerWake) ||
      maximumUnitsPerWake < 1 ||
      maximumUnitsPerWake > maximumWakeBudget
    )
      throw new PortableAuthorityError("AGENT_SCHEDULER_CONFIG_INVALID");
    this.#config = config;
    this.#maximumUnitsPerWake = maximumUnitsPerWake;
  }

  setActive(active: boolean): Promise<DurableAgentWakeResult | undefined> {
    this.#active = active;
    if (!active) {
      this.#controller?.abort();
      return Promise.resolve(undefined);
    }
    return this.wake();
  }

  wake(): Promise<DurableAgentWakeResult> {
    return this.#serialize(async () => {
      if (!this.#active)
        return { admittedRuns: 0, drains: [], stopped: "inactive" };
      const controller = new AbortController();
      this.#controller = controller;
      try {
        let recovered: DurableAgentLoopRecoveryResult | undefined;
        if (!this.#recovered) {
          recovered = await this.#config.loop.recover();
          this.#recovered = true;
        }
        const authority = await this.#config.createAuthority();
        const admitted = await this.#config.admission.reconcile(authority);
        const drains: DurableAgentLoopDrainResult[] = [];
        for (let index = 0; index < this.#maximumUnitsPerWake; index += 1) {
          if (!this.#active || controller.signal.aborted)
            return {
              admittedRuns: admitted.length,
              drains,
              ...(recovered ? { recovered } : {}),
              stopped: "inactive",
            };
          const result = await this.#config.loop.drainOne(controller.signal);
          drains.push(result);
          if (result.kind === "idle")
            return {
              admittedRuns: admitted.length,
              drains,
              ...(recovered ? { recovered } : {}),
              stopped: "idle",
            };
          if (
            result.kind === "agent" &&
            result.agent.kind === "provider-blocked"
          )
            return {
              admittedRuns: admitted.length,
              drains,
              ...(recovered ? { recovered } : {}),
              stopped: "blocked",
            };
        }
        return {
          admittedRuns: admitted.length,
          drains,
          ...(recovered ? { recovered } : {}),
          stopped: "budget",
        };
      } finally {
        if (this.#controller === controller) this.#controller = undefined;
      }
    });
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
