import Foundation

struct MemoryCurationMessage: Codable, Sendable {
  let content: String
  let messageId: String
  let role: String
}

struct MemoryCurationObservedMemory: Codable, Sendable {
  let content: String
  let kind: String
  let memoryId: String
  let version: Int
}

struct MemoryCurationRequest: Sendable {
  let activeMemories: [MemoryCurationObservedMemory]
  let contextPlanId: String
  let jobId: String
  let maximumResponseTokens: Int
  let messages: [MemoryCurationMessage]
  let policyId: String
  let selectionId: String
  let sourceDigest: String
  let sourceMessageIds: [String]
}

struct MemoryCurationProposalResult: Sendable {
  let confidence: Double
  let content: String
  let kind: String
  let observedMemoryId: String?
  let observedMemoryVersion: Int?
  let operation: String
  let proposedRetention: String
  let proposedSensitivity: String
  let sourceMessageIds: [String]
}

struct MemoryCurationGenerationResult: Sendable {
  let durationMs: Int
  let jobId: String
  let modelId: String
  let policyId: String
  let proposals: [MemoryCurationProposalResult]
  let selectionId: String
  let sourceDigest: String
}

enum MemoryCuratorFailure: String, Error {
  case contextExceeded = "MEMORY_CURATION_CONTEXT_EXCEEDED"
  case duplicateJob = "MEMORY_CURATION_DUPLICATE_JOB"
  case generationFailed = "MEMORY_CURATION_GENERATION_FAILED"
  case invalidRequest = "MEMORY_CURATION_REQUEST_INVALID"
  case resultInvalid = "MEMORY_CURATION_RESULT_INVALID"
  case unavailable = "MEMORY_CURATION_UNAVAILABLE"
}

struct MemoryCurationPrompt: Codable {
  let activeMemories: [MemoryCurationObservedMemory]
  let messages: [MemoryCurationMessage]
  let sourceMessageIds: [String]
}
