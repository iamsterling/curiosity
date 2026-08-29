export interface NativeGenerationMessage {
  readonly content: string;
  readonly role: "assistant" | "user";
}

export interface NativeGenerationRequest {
  readonly maximumResponseTokens: number;
  readonly messages: readonly NativeGenerationMessage[];
  readonly toolCount: number;
  readonly turnId: string;
}

export interface NativeGenerationResult {
  readonly durationMs: number;
  readonly effort: string;
  readonly modelId: string;
  readonly text: string;
}

export interface NativeAgentStepContextBlock {
  readonly blockId: string;
  readonly content: string;
  readonly contentDigest: string;
  readonly kind: string;
  readonly provenance: string;
  readonly sourceEventIds: readonly string[];
}

export interface NativeAgentStepContextPlan {
  readonly blocks: readonly NativeAgentStepContextBlock[];
  readonly contextPlanId: string;
  readonly estimatedTokens: number;
  readonly policyId: string;
  readonly schemaVersion: 1;
  readonly utf8Bytes: number;
}

export interface NativeAgentStepTool {
  readonly description: string;
  readonly inputSchemaJSON: string;
  readonly toolId: string;
  readonly version: string;
}

export interface NativeAgentStepRoute {
  readonly adapterVersion: string;
  readonly contextPlanId: string;
  readonly locality: "device";
  readonly modelId: string;
  readonly providerId: "apple";
  readonly purpose: "agent.step";
  readonly requestedRouteId: "on-device.apple";
  readonly routeId: "on-device.apple";
  readonly selectionId: string;
  readonly selectionPolicyId: string;
}

export interface NativeAgentStepRequest {
  readonly agent: { readonly id: string; readonly version: string };
  readonly availableTools: readonly NativeAgentStepTool[];
  readonly contextPlan: NativeAgentStepContextPlan;
  readonly finalizationOnly: boolean;
  readonly maximumResponseTokens: number;
  readonly observedRunRevision: number;
  readonly observedStateDigest: string;
  readonly route: NativeAgentStepRoute;
  readonly runId: string;
  readonly stepId: string;
  readonly stepNumber: number;
}

export interface NativeAgentStepResult {
  readonly contextPlanId: string;
  readonly durationMs: number;
  readonly modelId: string;
  readonly observedRunRevision: number;
  readonly observedStateDigest: string;
  readonly proposal: unknown;
  readonly runId: string;
  readonly selectionId: string;
  readonly stepId: string;
  readonly stepNumber: number;
}

export interface FoundationModelStatus {
  readonly availability: "available" | "unavailable";
  readonly modelId: string;
  readonly reason:
    | "APPLE_INTELLIGENCE_NOT_ENABLED"
    | "DEVICE_NOT_ELIGIBLE"
    | "MODEL_NOT_READY"
    | "NONE"
    | "OS_UNSUPPORTED"
    | "UNKNOWN";
}

export interface NativeMemoryCurationMessage {
  readonly content: string;
  readonly messageId: string;
  readonly role: "assistant" | "user";
}

export interface NativeMemoryCurationObservedMemory {
  readonly content: string;
  readonly kind: string;
  readonly memoryId: string;
  readonly version: number;
}

export interface NativeMemoryCurationRoute {
  readonly adapterVersion: string;
  readonly contextPlanId: string;
  readonly locality: "device";
  readonly modelId: string;
  readonly providerId: "apple";
  readonly purpose: "memory.curate";
  readonly requestedRouteId: "on-device.apple";
  readonly routeId: "on-device.apple";
  readonly selectionId: string;
  readonly selectionPolicyId: string;
}

export interface NativeMemoryCurationRequest {
  readonly activeMemories: readonly NativeMemoryCurationObservedMemory[];
  readonly jobId: string;
  readonly maximumResponseTokens: number;
  readonly messages: readonly NativeMemoryCurationMessage[];
  readonly policyId: string;
  readonly route: NativeMemoryCurationRoute;
  readonly sourceDigest: string;
  readonly sourceMessageIds: readonly string[];
}

export interface NativeMemoryCurationResult {
  readonly durationMs: number;
  readonly jobId: string;
  readonly modelId: string;
  readonly policyId: string;
  readonly proposals: readonly unknown[];
  readonly selectionId: string;
  readonly sourceDigest: string;
}

export interface GenerationDeltaEvent {
  readonly delta: string;
  readonly turnId: string;
}

export interface NativeJournalStatus {
  readonly abiVersion: number;
  readonly schemaVersion: number;
}

export interface NativeActionGateReceipt {
  readonly gateId: string;
  readonly payloadDigest: string;
  readonly proposalRevision: number;
}

export interface NativeActionGrant {
  readonly actionId: string;
  readonly attemptId: string;
  readonly callId: string;
  readonly catalogDigest: string;
  readonly deadlineAt: string;
  readonly executionId: string;
  readonly gateReceipt?: NativeActionGateReceipt;
  readonly generation: number;
  readonly grantId: string;
  readonly inputDigest: string;
  readonly requestDigest: string;
  readonly requestedCapabilities: readonly string[];
  readonly resource: string;
  readonly schemaVersion: 1;
  readonly toolId: string;
  readonly toolVersion: string;
}

export interface NativeDocumentToolRequest {
  readonly grant: NativeActionGrant;
  readonly inputJSON: string;
}

export interface NativeDocumentToolReceipt {
  readonly actionId: string;
  readonly attemptId: string;
  readonly callId: string;
  readonly generation: number;
  readonly grantId: string;
  readonly inputDigest: string;
  readonly output: unknown;
  readonly toolId: string;
  readonly toolVersion: string;
}

export type CuriosityRuntimeModuleEvents = {
  onGenerationDelta: (event: GenerationDeltaEvent) => void;
};
