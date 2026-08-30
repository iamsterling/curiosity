import {
  AgentKernel,
  type AgentKernelPlanPort,
  type AgentStepPort,
  type Sha256,
} from "@curiosity/authority";
import {
  createNativeAgentJournal,
  type NativeAgentJournalModule,
} from "./native-agent-journal-port.ts";

export interface MobileAgentKernelConfig {
  readonly agentStep: AgentStepPort;
  readonly catalogDigest: string;
  readonly eligibleActorId: string;
  readonly native: NativeAgentJournalModule;
  readonly now: () => string;
  readonly ownerId?: string;
  readonly planner: AgentKernelPlanPort;
  readonly sha256: Sha256;
}

export const createMobileAgentKernel = (
  config: MobileAgentKernelConfig,
): AgentKernel =>
  new AgentKernel({
    agentStep: config.agentStep,
    catalogDigest: config.catalogDigest,
    eligibleActorId: config.eligibleActorId,
    journal: createNativeAgentJournal(config.native),
    now: config.now,
    ...(config.ownerId ? { ownerId: config.ownerId } : {}),
    planner: config.planner,
    sha256: config.sha256,
  });
