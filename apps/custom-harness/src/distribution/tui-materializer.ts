import {
  materializeEmbeddedExecutable,
  type MaterializedExecutable,
} from "./executable-materializer.js";

export type MaterializedTui = MaterializedExecutable;

export interface TuiMaterializationOptions {
  readonly dataHome?: string;
  readonly homeDirectory?: string;
}

export const materializeEmbeddedTui = (
  embeddedPath: string,
  options: TuiMaterializationOptions = {},
): Promise<MaterializedTui> =>
  materializeEmbeddedExecutable(embeddedPath, {
    ...options,
    errorPrefix: "TUI",
    executableName: "curiosity-tui",
  });
