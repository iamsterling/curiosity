import type { ConversationMode } from "./workspace-types.ts";

export const commandText = (mode: ConversationMode, text: string): string => {
  if (mode === "research") return `/research ${text}`;
  if (mode === "build") return `/task ${text}`;
  return text;
};

export interface CuriosityThread {
  readonly sequence: number;
  readonly threadId: string;
  readonly title: string;
}

export interface CuriosityMessage {
  readonly messageId: string;
  readonly role: "assistant" | "user";
  readonly text: string;
}

export interface CuriositySession {
  readonly messages: readonly CuriosityMessage[];
  readonly threads: readonly CuriosityThread[];
}

export interface CuriositySubmit {
  readonly mode: ConversationMode;
  readonly text: string;
  readonly threadId?: string;
}

export interface CuriosityTurn {
  readonly assistantMessageId: string;
  readonly text: string;
  readonly threadId: string;
  readonly threads: readonly CuriosityThread[];
  readonly turnId?: string;
}

export type CapabilityAvailability =
  "available" | "starting" | "unavailable" | "unknown";

export interface CuriosityRuntimeStatus {
  readonly localRuntime: CapabilityAvailability;
  readonly mainProvider: CapabilityAvailability;
  readonly onDeviceModel: CapabilityAvailability;
  readonly profile: "local" | "remote";
  readonly researchProvider: CapabilityAvailability;
  readonly storage: "durable" | "ephemeral" | "unavailable";
}

export interface CuriosityClient {
  readonly cancel: (turnId: string) => Promise<void>;
  readonly session: (threadId?: string) => Promise<CuriositySession>;
  readonly status: () => Promise<CuriosityRuntimeStatus>;
  readonly submit: (
    input: CuriositySubmit,
    onDelta?: (text: string) => void,
  ) => Promise<CuriosityTurn>;
}

export const startingRuntimeStatus: CuriosityRuntimeStatus = Object.freeze({
  localRuntime: "starting",
  mainProvider: "unknown",
  onDeviceModel: "unknown",
  profile: "local",
  researchProvider: "unknown",
  storage: "ephemeral",
});

export const runtimeStatusLabel = (status: CuriosityRuntimeStatus): string => {
  if (status.profile === "remote") return "Explicit remote adapter";
  if (status.localRuntime === "starting") return "Local runtime starting";
  if (status.localRuntime !== "available") return "Local runtime unavailable";
  if (status.onDeviceModel === "available")
    return "Local runtime · On-device model";
  return "Local runtime ready · Model unavailable";
};
