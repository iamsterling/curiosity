export type MobileAgentDeltaListener = (delta: string) => void;

export interface MobileAgentDeltaBroker {
  readonly publish: (runId: string, delta: string) => void;
  readonly subscribe: (
    runId: string,
    listener: MobileAgentDeltaListener,
  ) => () => void;
}

export const createMobileAgentDeltaBroker = (): MobileAgentDeltaBroker => {
  const listeners = new Map<string, Set<MobileAgentDeltaListener>>();
  return Object.freeze({
    publish: (runId: string, delta: string): void => {
      if (!delta) return;
      for (const listener of listeners.get(runId) ?? []) listener(delta);
    },
    subscribe: (
      runId: string,
      listener: MobileAgentDeltaListener,
    ): (() => void) => {
      const runListeners = listeners.get(runId) ?? new Set();
      runListeners.add(listener);
      listeners.set(runId, runListeners);
      return () => {
        runListeners.delete(listener);
        if (runListeners.size === 0) listeners.delete(runId);
      };
    },
  });
};
