import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import {
  createMobileAgentKernel,
  type MobileAgentKernelConfig,
} from "./mobile-agent-kernel.ts";
import { createFrontierAgentStep } from "./frontier-agent-step-port.ts";

export const createNativeAgentKernel = (
  config: Omit<MobileAgentKernelConfig, "agentStep" | "native">,
) =>
  createMobileAgentKernel({
    ...config,
    agentStep: createFrontierAgentStep(CuriosityRuntimeModule),
    native: CuriosityRuntimeModule,
  });
