export { signCommand } from "./kernel/authenticator.js";
export { createCuriosityHarness } from "./kernel/runtime.js";
export type {
  CommandInput,
  SignedCommandEnvelope,
  UnsignedCommandEnvelope,
} from "./domain/command.js";
export type { CommandAcknowledgement } from "./domain/event.js";
export type {
  CapabilityMaturity,
  CapabilityStatusEntry,
  CapabilityStatusReport,
} from "./domain/capability-status.js";
export type { ChatMessageProjection } from "./projection/chat-projection.js";
export type { ThreadProjection } from "./projection/thread-projection.js";
export type {
  PromptMessage,
  ProviderRouteConfig,
  TextGenerationRequest,
  TextGenerator,
} from "./kernel/text-generator.js";
export type { ChatTurnResult } from "./domain/chat.js";
export type {
  ResearchAdapter,
  ResearchAdapterReceipt,
  ResearchFetchRequest,
  ResearchFetchResponse,
  ResearchSearchRequest,
  ResearchSearchResponse,
  ResearchSearchResult,
} from "./research/adapter.js";
export { createRuntimeQueryResearchAdapter } from "./research/runtime-query-adapter.js";
export { createBoundedHttpResearchAdapter } from "./research/bounded-http-adapter.js";
export type {
  BoundedHttpResearchAdapterOptions,
  BoundedHttpTransportRequest,
  BoundedHttpTransportResponse,
} from "./research/bounded-http-adapter.js";
export type {
  CuriosityQueryRuntimePort,
  RuntimeQueryResearchAdapterOptions,
} from "./research/runtime-query-adapter.js";
export type {
  CuriosityHarness,
  CuriosityHarnessConfig,
  CuriosityPluginCatalogProjection,
  PrimaryRoleId,
  RolePolicyConfig,
  SubagentRoleId,
} from "./kernel/runtime.js";
export type {
  GitProfileConfig,
  ProcessProfileConfig,
} from "./supervisor/client.js";
