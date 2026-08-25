export { signCommand } from "./kernel/authenticator.js";
export { createCuriosityHarness } from "./kernel/runtime.js";
export type {
  CommandInput,
  SignedCommandEnvelope,
  UnsignedCommandEnvelope,
} from "./domain/command.js";
export type { CommandAcknowledgement } from "./domain/event.js";
export type {
  CapabilityAvailability,
  CapabilityStatusEntry,
  CapabilityStatusReport,
} from "./domain/capability-status.js";
export type { ChatMessageProjection } from "./projection/chat-projection.js";
export type { ThreadProjection } from "./projection/thread-projection.js";
export type {
  PromptMessage,
  TextGenerationRequest,
  TextGenerator,
} from "./kernel/text-generator.js";
export type { ChatTurnResult } from "./domain/chat.js";
export type {
  CuriosityHarness,
  CuriosityHarnessConfig,
  CuriosityPluginCatalogProjection,
} from "./kernel/runtime.js";
