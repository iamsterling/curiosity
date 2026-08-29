import Foundation

struct AgentStepIdentity: Codable, Sendable {
  let id: String
  let version: String
}

struct AgentStepContextBlock: Codable, Sendable {
  let blockId: String
  let content: String
  let contentDigest: String
  let kind: String
  let provenance: String
  let sourceEventIds: [String]
}

struct AgentStepContextPlan: Codable, Sendable {
  let blocks: [AgentStepContextBlock]
  let contextPlanId: String
  let estimatedTokens: Int
  let policyId: String
  let schemaVersion: Int
  let utf8Bytes: Int
}

struct AgentStepToolDefinition: Sendable {
  let description: String
  let inputSchemaJSON: String
  let toolId: String
  let version: String
}

struct AgentStepRequest: Sendable {
  let agent: AgentStepIdentity
  let availableTools: [AgentStepToolDefinition]
  let contextPlan: AgentStepContextPlan
  let diagnosticExpectedKind: String?
  let finalizationOnly: Bool
  let maximumResponseTokens: Int
  let observedRunRevision: Int
  let observedStateDigest: String
  let runId: String
  let selectionId: String
  let stepId: String
  let stepNumber: Int
}

struct AgentStepCitationResult: Sendable {
  let excerpt: String?
  let locator: String?
  let sourceId: String
}

struct AgentStepActionResult: Sendable {
  let callKey: String
  let inputJSON: String
  let toolId: String
  let toolVersion: String
}

struct AgentStepQuestionResult: Sendable {
  let allowFreeText: Bool
  let options: [String]
  let prompt: String
}

enum AgentStepProposalResult: Sendable {
  case actions([AgentStepActionResult], assistantStateJSON: String?)
  case final(String, [AgentStepCitationResult], assistantStateJSON: String?)
  case noGo(String, assistantStateJSON: String?)
  case question(AgentStepQuestionResult, assistantStateJSON: String?)
}

struct AgentStepGenerationResult: Sendable {
  let contextPlanId: String
  let durationMs: Int
  let modelId: String
  let observedRunRevision: Int
  let observedStateDigest: String
  let proposal: AgentStepProposalResult
  let runId: String
  let selectionId: String
  let stepId: String
  let stepNumber: Int
}

enum AgentStepFailure: String, Error {
  case duplicateStep = "AGENT_STEP_DUPLICATE"
  case invalidRequest = "AGENT_STEP_REQUEST_INVALID"
  case invalidResult = "AGENT_STEP_PROPOSAL_INVALID"
}
