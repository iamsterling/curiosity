import { runCraftyKernelPortabilityGate } from "./crafty-kernel-portability";
import { loadCraftyKernelPortabilityFixture } from "./crafty-ui-fixture";

export type CraftyKernelPortabilityStatus =
  | "checking"
  | "failed"
  | "verified";

let status: CraftyKernelPortabilityStatus = "checking";
const listeners = new Set<() => void>();

const updateStatus = (next: CraftyKernelPortabilityStatus): void => {
  status = next;
  for (const listener of listeners) listener();
};

void loadCraftyKernelPortabilityFixture()
  .then((uiPackage) => runCraftyKernelPortabilityGate(uiPackage))
  .then(() => updateStatus("verified"))
  .catch(() => updateStatus("failed"));

export const getCraftyKernelPortabilityStatus = () => status;

export const subscribeToCraftyKernelPortabilityStatus = (
  listener: () => void,
) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
