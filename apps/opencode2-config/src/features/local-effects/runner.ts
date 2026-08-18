import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
import type { LocalEffectResult } from "./contracts.js";
export interface LocalCheckExecutor {
  run(root: string, argv: readonly string[]): Promise<LocalEffectResult>;
}
export const runBoundedLocalCheck = async (
  root: string,
  argv: readonly string[],
  executor?: LocalCheckExecutor,
): Promise<LocalEffectResult> => {
  if (argv.length === 0 || argv.some((x) => x.includes("\0")))
    throw new DiagnosticError("ENGINEERING_LOCAL_CHECK_INVALID");
  if (!executor) throw new DiagnosticError("ENGINEERING_LOCAL_CHECK_EXECUTOR_DISABLED");
  return executor.run(root, argv);
};
