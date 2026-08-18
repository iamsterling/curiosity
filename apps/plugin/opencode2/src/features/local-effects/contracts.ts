import type { ProposedEffect } from "../engineering-intent/index.js";
export interface LocalEffectRequest extends ProposedEffect {
  readonly argv?: readonly string[];
  readonly content?: string;
  readonly expectedDirtyDigest?: string;
}
export interface LocalEffectResult {
  readonly code: "ENGINEERING_LOCAL_EFFECT_COMPLETED";
  readonly outputDigest: string;
  readonly locator: string;
}
export const localEffectToolNames = new Set([
  "engineering_local_read",
  "engineering_local_check",
  "engineering_workspace_edit",
]);
