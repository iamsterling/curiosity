import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import {
  createMobileAgentKernel,
  type MobileAgentKernelConfig,
} from "./mobile-agent-kernel.ts";
import { createFrontierAgentStep } from "./frontier-agent-step-port.ts";

export interface NativeAgentKernelConfig extends Omit<
  MobileAgentKernelConfig,
  "agentStep" | "native"
> {
  readonly publishDelta?: (runId: string, delta: string) => void;
}

export const createNativeAgentKernel = (config: NativeAgentKernelConfig) =>
  createMobileAgentKernel({
    ...config,
    agentStep: createFrontierAgentStep(
      CuriosityRuntimeModule,
      config.publishDelta,
    ),
    native: CuriosityRuntimeModule,
  });
