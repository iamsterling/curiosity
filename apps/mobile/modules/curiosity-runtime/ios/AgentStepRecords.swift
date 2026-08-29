import CryptoKit
import ExpoModulesCore
import Foundation

struct AgentStepIdentityRecord: Record {
  @Field var id = ""
  @Field var version = ""
}

struct AgentStepContextBlockRecord: Record {
  @Field var blockId = ""
  @Field var content = ""
  @Field var contentDigest = ""
  @Field var kind = ""
  @Field var provenance = ""
  @Field var sourceEventIds: [String] = []
}

struct AgentStepContextPlanRecord: Record {
  @Field var blocks: [AgentStepContextBlockRecord] = []
  @Field var contextPlanId = ""
  @Field var estimatedTokens = 0
  @Field var policyId = ""
  @Field var schemaVersion = 0
  @Field var utf8Bytes = 0
}

struct AgentStepToolRecord: Record {
  @Field var description = ""
  @Field var inputSchemaJSON = ""
  @Field var toolId = ""
  @Field var version = ""
}

struct AgentStepRouteRecord: Record {
  @Field var adapterVersion = ""
  @Field var contextPlanId = ""
  @Field var locality = ""
  @Field var modelId = ""
  @Field var providerId = ""
  @Field var purpose = ""
  @Field var requestedRouteId = ""
  @Field var routeId = ""
  @Field var selectionId = ""
  @Field var selectionPolicyId = ""
}

struct AgentStepRecord: Record {
  @Field var agent = AgentStepIdentityRecord()
  @Field var availableTools: [AgentStepToolRecord] = []
  @Field var contextPlan = AgentStepContextPlanRecord()
  @Field var finalizationOnly = false
  @Field var maximumResponseTokens = 768
  @Field var observedRunRevision = 0
  @Field var observedStateDigest = ""
  @Field var route = AgentStepRouteRecord()
  @Field var runId = ""
  @Field var stepId = ""
  @Field var stepNumber = 0
}

private func sha256(_ value: String) -> String {
  SHA256.hash(data: Data(value.utf8)).map { String(format: "%02x", $0) }.joined()
}

private func validJSON(_ value: String, maximumBytes: Int) -> Bool {
  guard
    !value.isEmpty,
    value.utf8.count <= maximumBytes,
    let data = value.data(using: .utf8)
  else { return false }
  return (try? JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed])) != nil
}

func validateAgentStepRecord(_ input: AgentStepRecord) throws -> AgentStepRequest {
  let route = input.route
  let plan = input.contextPlan
  guard
    validNativeIdentifier(input.agent.id),
    validNativeIdentifier(input.agent.version),
    validNativeIdentifier(input.runId),
    validNativeIdentifier(input.stepId),
    input.stepNumber >= 1,
    input.observedRunRevision >= 0,
    validNativeDigest(input.observedStateDigest),
    input.maximumResponseTokens >= 1,
    input.maximumResponseTokens <= 1_024,
    route.adapterVersion == "foundation-models-v1",
    route.contextPlanId == plan.contextPlanId,
    route.locality == "device",
    route.modelId == "apple:system-language-model",
    route.providerId == "apple",
    route.purpose == "agent.step",
    route.requestedRouteId == "on-device.apple",
    route.routeId == "on-device.apple",
    validNativeDigest(route.selectionId),
    validNativeIdentifier(route.selectionPolicyId),
    plan.schemaVersion == 1,
    validNativeDigest(plan.contextPlanId),
    validNativeIdentifier(plan.policyId),
    plan.blocks.count <= 32,
    input.availableTools.count <= 8
  else { throw AgentStepFailure.invalidRequest }

  let blocks = try plan.blocks.map { block in
    guard
      validNativeIdentifier(block.blockId),
      block.content.utf8.count <= 64 * 1_024,
      sha256(block.content) == block.contentDigest,
      ["agent-policy", "conversation", "kernel-notice", "memory", "tool-evidence", "workflow"]
        .contains(block.kind),
      ["trusted-durable", "untrusted-evidence"].contains(block.provenance),
      block.sourceEventIds.count <= 64,
      Set(block.sourceEventIds).count == block.sourceEventIds.count,
      block.sourceEventIds.allSatisfy(validNativeIdentifier)
    else { throw AgentStepFailure.invalidRequest }
    return AgentStepContextBlock(
      blockId: block.blockId,
      content: block.content,
      contentDigest: block.contentDigest,
      kind: block.kind,
      provenance: block.provenance,
      sourceEventIds: block.sourceEventIds
    )
  }
  let utf8Bytes = blocks.reduce(0) { $0 + $1.content.utf8.count }
  let contextPlanDigest = try contextPlanDigest(
    blocks: blocks,
    estimatedTokens: plan.estimatedTokens,
    policyId: plan.policyId,
    schemaVersion: plan.schemaVersion,
    utf8Bytes: plan.utf8Bytes
  )
  guard
    Set(blocks.map(\.blockId)).count == blocks.count,
    utf8Bytes == plan.utf8Bytes,
    plan.estimatedTokens == Int(ceil(Double(utf8Bytes) / 3.0)),
    contextPlanDigest == plan.contextPlanId
  else { throw AgentStepFailure.invalidRequest }

  let tools = try input.availableTools.map { tool in
    guard
      validNativeIdentifier(tool.toolId),
      validNativeIdentifier(tool.version),
      !tool.description.isEmpty,
      tool.description.utf8.count <= 4_096,
      validJSON(tool.inputSchemaJSON, maximumBytes: 32 * 1_024)
    else { throw AgentStepFailure.invalidRequest }
    return AgentStepToolDefinition(
      description: tool.description,
      inputSchemaJSON: tool.inputSchemaJSON,
      toolId: tool.toolId,
      version: tool.version
    )
  }
  guard Set(tools.map(\.toolId)).count == tools.count else {
    throw AgentStepFailure.invalidRequest
  }
  return AgentStepRequest(
    agent: AgentStepIdentity(id: input.agent.id, version: input.agent.version),
    availableTools: tools,
    contextPlan: AgentStepContextPlan(
      blocks: blocks,
      contextPlanId: plan.contextPlanId,
      estimatedTokens: plan.estimatedTokens,
      policyId: plan.policyId,
      schemaVersion: plan.schemaVersion,
      utf8Bytes: plan.utf8Bytes
    ),
    diagnosticExpectedKind: nil,
    finalizationOnly: input.finalizationOnly,
    maximumResponseTokens: input.maximumResponseTokens,
    observedRunRevision: input.observedRunRevision,
    observedStateDigest: input.observedStateDigest,
    runId: input.runId,
    selectionId: route.selectionId,
    stepId: input.stepId,
    stepNumber: input.stepNumber
  )
}

private func contextPlanDigest(
  blocks: [AgentStepContextBlock],
  estimatedTokens: Int,
  policyId: String,
  schemaVersion: Int,
  utf8Bytes: Int
) throws -> String {
  let value: [String: Any] = [
    "blocks": blocks.map { block in
      [
        "blockId": block.blockId,
        "content": block.content,
        "contentDigest": block.contentDigest,
        "kind": block.kind,
        "provenance": block.provenance,
        "sourceEventIds": block.sourceEventIds,
      ]
    },
    "estimatedTokens": estimatedTokens,
    "policyId": policyId,
    "schemaVersion": schemaVersion,
    "utf8Bytes": utf8Bytes,
  ]
  let data = try JSONSerialization.data(
    withJSONObject: value,
    options: [.sortedKeys, .withoutEscapingSlashes]
  )
  guard let json = String(data: data, encoding: .utf8) else {
    throw AgentStepFailure.invalidRequest
  }
  return sha256(json)
}
