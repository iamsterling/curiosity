import { NativeModule, requireNativeModule } from "expo";
import type {
  CuriosityRuntimeModuleEvents,
  FoundationModelStatus,
  NativeAgentStepRequest,
  NativeAgentStepResult,
  NativeDocumentToolReceipt,
  NativeDocumentToolRequest,
  NativeGenerationRequest,
  NativeGenerationResult,
  NativeJournalStatus,
  NativeMemoryCurationRequest,
  NativeMemoryCurationResult,
} from "./CuriosityRuntime.types";

declare class CuriosityRuntimeModule extends NativeModule<CuriosityRuntimeModuleEvents> {
  agentStep(request: NativeAgentStepRequest): Promise<NativeAgentStepResult>;
  agentJournalCall(inputJson: string): Promise<string>;
  cancelAgentStep(stepId: string): Promise<void>;
  cancelDocumentTool(callId: string): Promise<void>;
  cancelGeneration(turnId: string): Promise<void>;
  cancelMemoryCuration(jobId: string): Promise<void>;
  curateMemory(
    request: NativeMemoryCurationRequest,
  ): Promise<NativeMemoryCurationResult>;
  executeDocumentTool(
    request: NativeDocumentToolRequest,
  ): Promise<NativeDocumentToolReceipt>;
  foundationModelStatus(): Promise<FoundationModelStatus>;
  generate(request: NativeGenerationRequest): Promise<NativeGenerationResult>;
  journalAdmit(inputJson: string): Promise<string>;
  journalOpen(catalogDigest: string): Promise<NativeJournalStatus>;
  journalRead(afterSequence: number, limit: number): Promise<string>;
}

export default requireNativeModule<CuriosityRuntimeModule>("CuriosityRuntime");
