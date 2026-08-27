import {
  materializeEmbeddedExecutable,
  type MaterializedExecutable,
} from "./executable-materializer.js";

export type MaterializedSupervisor = MaterializedExecutable;

export interface SupervisorMaterializationOptions {
  readonly dataHome?: string;
  readonly homeDirectory?: string;
}

export const materializeEmbeddedSupervisor = (
  embeddedPath: string,
  options: SupervisorMaterializationOptions = {},
): Promise<MaterializedSupervisor> =>
  materializeEmbeddedExecutable(embeddedPath, {
    ...options,
    errorPrefix: "SUPERVISOR",
    executableName: "curiosity-supervisor",
  });
