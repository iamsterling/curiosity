import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import {
  createMobileAgentKernel,
  type MobileAgentKernelConfig,
} from "./mobile-agent-kernel.ts";

export const createNativeAgentKernel = (
  config: Omit<MobileAgentKernelConfig, "native">,
) => createMobileAgentKernel({ ...config, native: CuriosityRuntimeModule });
