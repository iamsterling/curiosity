import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import { createFoundationModelGeneration } from "./foundation-model-generation-port.ts";

export const foundationModelGeneration = createFoundationModelGeneration(
  CuriosityRuntimeModule,
);

export const foundationModelStatus = () =>
  CuriosityRuntimeModule.foundationModelStatus();
