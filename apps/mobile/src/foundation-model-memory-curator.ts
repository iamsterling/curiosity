import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import { createFoundationModelMemoryCurator } from "./foundation-model-memory-curator-port.ts";

export const foundationModelMemoryCurator =
  createFoundationModelMemoryCurator(CuriosityRuntimeModule);
