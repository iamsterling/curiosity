import { Plugin } from "@opencode-ai/plugin";

export type OpenCodeContext = Parameters<ReturnType<(typeof Plugin)["define"]>["setup"]>[0];
export type FeatureCleanup = () => Promise<void> | void;
export interface FeatureRegistration {
  readonly id: string;
  readonly register: (context: OpenCodeContext) => Promise<FeatureCleanup | void> | FeatureCleanup | void;
}
