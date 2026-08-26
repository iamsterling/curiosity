import type { PromptMessage } from "../kernel/text-generator.js";

export type PromptSnapshotSlot =
  "agent-policy" | "skills" | "durable-context" | "workflow" | "kernel-notice";

export interface PromptSnapshotBlock {
  readonly content: string;
  readonly contributionId: string;
  readonly contributionVersion: string;
  readonly digest: string;
  readonly encodedBytes: number;
  readonly id: string;
  readonly pluginId: string;
  readonly pluginVersion: string;
  readonly provenance: "trusted-durable" | "untrusted-evidence";
  readonly rank: number;
  readonly required: boolean;
  readonly slot: PromptSnapshotSlot;
  readonly sourceEventIds: readonly string[];
}

export interface OmittedPromptBlock {
  readonly digest: string;
  readonly id: string;
  readonly reason: "contributor-overflow" | "global-overflow";
}

export interface PromptSnapshotTool {
  readonly description: string;
  readonly digest: string;
  readonly inputSchema: unknown;
  readonly name: string;
  readonly outputProvenance: "trusted-durable" | "untrusted-evidence";
  readonly pluginId: string;
  readonly pluginVersion: string;
  readonly readOnly: boolean;
  readonly requestedCapabilities: readonly string[];
  readonly version: string;
}

export interface PromptSnapshot {
  readonly agent: {
    readonly contentDigest: string;
    readonly id: string;
    readonly pluginId: string;
    readonly pluginVersion: string;
    readonly version: string;
  };
  readonly blocks: readonly PromptSnapshotBlock[];
  readonly catalogDigest: string;
  readonly conversation: {
    readonly includedDigest: string;
    readonly includedMessages: number;
    readonly omittedDigests: readonly string[];
  };
  readonly messages: readonly PromptMessage[];
  readonly omittedBlocks: readonly OmittedPromptBlock[];
  readonly revision: number;
  readonly schemaVersion: 1;
  readonly tools: readonly PromptSnapshotTool[];
}

export interface AssembledPrompt {
  readonly messages: readonly PromptMessage[];
  readonly snapshot: PromptSnapshot;
  readonly snapshotDigest: string;
  readonly tools: readonly PromptSnapshotTool[];
}
