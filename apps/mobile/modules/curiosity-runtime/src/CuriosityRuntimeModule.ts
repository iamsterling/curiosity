import { NativeModule, requireNativeModule } from "expo";
import type {
  CuriosityRuntimeModuleEvents,
  FoundationModelStatus,
  NativeAgentStepRequest,
  NativeAgentStepResult,
  NativeDocumentToolReceipt,
  NativeDocumentToolRequest,
  NativeFrontierGenerationRequest,
  NativeFrontierGenerationResult,
  NativeGenerationRequest,
  NativeGenerationResult,
  NativeJournalStatus,
  NativeMemoryCurationRequest,
  NativeMemoryCurationResult,
  NativeProviderConnectionStatus,
  NativeProviderCatalogResult,
  NativeProviderRoutePreferences,
  NativeProviderRouteSelection,
} from "./CuriosityRuntime.types";

declare class CuriosityRuntimeModule extends NativeModule<CuriosityRuntimeModuleEvents> {
  authenticateProvider(
    providerId: string,
  ): Promise<NativeProviderCatalogResult>;
  agentStep(request: NativeAgentStepRequest): Promise<NativeAgentStepResult>;
  agentJournalCall(inputJson: string): Promise<string>;
  cancelAgentStep(stepId: string): Promise<void>;
  cancelDocumentTool(callId: string): Promise<void>;
  cancelGeneration(turnId: string): Promise<void>;
  cancelFrontierGeneration(callId: string): Promise<void>;
  cancelMemoryCuration(jobId: string): Promise<void>;
  curateMemory(
    request: NativeMemoryCurationRequest,
  ): Promise<NativeMemoryCurationResult>;
  executeDocumentTool(
    request: NativeDocumentToolRequest,
  ): Promise<NativeDocumentToolReceipt>;
  foundationModelStatus(): Promise<FoundationModelStatus>;
  generate(request: NativeGenerationRequest): Promise<NativeGenerationResult>;
  generateFrontier(
    request: NativeFrontierGenerationRequest,
  ): Promise<NativeFrontierGenerationResult>;
  disconnectProvider(providerId: string): Promise<NativeProviderCatalogResult>;
  journalAdmit(inputJson: string): Promise<string>;
  journalOpen(catalogDigest: string): Promise<NativeJournalStatus>;
  journalRead(afterSequence: number, limit: number): Promise<string>;
  providerConnectionStatus(): Promise<NativeProviderConnectionStatus>;
  providerCatalogSnapshot(): Promise<NativeProviderCatalogResult>;
  providerRoutePreferences(): Promise<NativeProviderRoutePreferences>;
  providerRouteSelection(
    agentId: string,
  ): Promise<NativeProviderRouteSelection>;
  setProviderRoutePreference(
    agentId: string,
    providerId: string,
    modelId: string,
  ): Promise<NativeProviderRoutePreferences>;
}

export default requireNativeModule<CuriosityRuntimeModule>("CuriosityRuntime");
