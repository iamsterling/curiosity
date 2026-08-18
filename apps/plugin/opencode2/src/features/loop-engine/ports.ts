/** OpenCode-native execution only: no timers, polling, daemon, lifecycle authority, or evidence decisions. */
export interface LoopContinuationPort {
  continueParent(input: {
    readonly sessionID: string;
    readonly prompt: string;
    readonly promptID: string;
    readonly metadata: Readonly<Record<string, string>>;
  }): Promise<void>;
  interrupt(input: { readonly sessionID: string }): Promise<void>;
}
export interface IterationBudget {
  readonly maximumIterations: number;
}
