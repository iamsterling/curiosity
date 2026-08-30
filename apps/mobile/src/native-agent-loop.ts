import {
  DurableAgentLoop,
  type AgentKernelPlanPort,
  type Sha256,
} from "@curiosity/authority";
import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import { createMobileAgentReadToolKernel } from "./mobile-agent-tool-kernel.ts";
import { createNativeAgentJournal } from "./native-agent-journal-port.ts";
import { createNativeAgentKernel } from "./native-agent-kernel.ts";

export interface NativeDurableAgentLoopConfig {
  readonly catalogDigest: string;
  readonly eligibleActorId: string;
  readonly grantedCapabilities: readonly string[];
  readonly now: () => string;
  readonly ownerId: string;
  readonly planner: AgentKernelPlanPort;
  readonly sha256: Sha256;
}

export const createNativeDurableAgentLoop = (
  config: NativeDurableAgentLoopConfig,
): DurableAgentLoop => {
  const journal = createNativeAgentJournal(CuriosityRuntimeModule);
  return new DurableAgentLoop({
    agent: createNativeAgentKernel({
      catalogDigest: config.catalogDigest,
      eligibleActorId: config.eligibleActorId,
      now: config.now,
      ownerId: config.ownerId,
      planner: config.planner,
      sha256: config.sha256,
    }),
    journal,
    now: config.now,
    tools: createMobileAgentReadToolKernel({
      catalogDigest: config.catalogDigest,
      grantedCapabilities: config.grantedCapabilities,
      native: CuriosityRuntimeModule,
      now: config.now,
      ownerId: config.ownerId,
      sha256: config.sha256,
    }),
  });
};
