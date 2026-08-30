import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import { createNativeProviderConnections } from "./provider-connections-port";

export const providerConnections = createNativeProviderConnections(
  CuriosityRuntimeModule,
);
