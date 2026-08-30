import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import { createFoundationModelAgentStep } from "./foundation-model-agent-step-port.ts";

export const foundationModelAgentStep = createFoundationModelAgentStep(
  CuriosityRuntimeModule,
);
