import ExpoModulesCore
import Foundation

struct MemoryCurationMessageRecord: Record {
  @Field var content = ""
  @Field var messageId = ""
  @Field var role = ""
}

struct MemoryCurationObservedRecord: Record {
  @Field var content = ""
  @Field var kind = ""
  @Field var memoryId = ""
  @Field var version = 0
}

struct MemoryCurationRouteRecord: Record {
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

struct MemoryCurationRecord: Record {
  @Field var activeMemories: [MemoryCurationObservedRecord] = []
  @Field var jobId = ""
  @Field var maximumResponseTokens = 768
  @Field var messages: [MemoryCurationMessageRecord] = []
  @Field var policyId = ""
  @Field var route = MemoryCurationRouteRecord()
  @Field var sourceDigest = ""
  @Field var sourceMessageIds: [String] = []
}

let nativeIdentifierPattern = try! NSRegularExpression(
  pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$"
)
let nativeDigestPattern = try! NSRegularExpression(pattern: "^[a-f0-9]{64}$")

func matchesNativePattern(_ value: String, pattern: NSRegularExpression) -> Bool {
  let range = NSRange(value.startIndex..<value.endIndex, in: value)
  return pattern.firstMatch(in: value, range: range)?.range == range
}

func validNativeIdentifier(_ value: String) -> Bool {
  matchesNativePattern(value, pattern: nativeIdentifierPattern)
}

func validNativeDigest(_ value: String) -> Bool {
  matchesNativePattern(value, pattern: nativeDigestPattern)
}

func validateMemoryCurationRecord(
  _ input: MemoryCurationRecord
) throws -> MemoryCurationRequest {
  let route = input.route
  guard
    validNativeIdentifier(input.jobId),
    validNativeIdentifier(input.policyId),
    validNativeDigest(input.sourceDigest),
    input.maximumResponseTokens >= 1,
    input.maximumResponseTokens <= 1_024,
    input.messages.count >= 1,
    input.messages.count <= 16,
    input.activeMemories.count <= 16,
    input.sourceMessageIds.count >= 1,
    input.sourceMessageIds.count <= 16,
    Set(input.sourceMessageIds).count == input.sourceMessageIds.count,
    input.sourceMessageIds.allSatisfy(validNativeIdentifier),
    route.adapterVersion == "foundation-models-v1",
    validNativeDigest(route.contextPlanId),
    route.locality == "device",
    route.modelId == "apple:system-language-model",
    route.providerId == "apple",
    route.purpose == "memory.curate",
    route.requestedRouteId == "on-device.apple",
    route.routeId == "on-device.apple",
    validNativeDigest(route.selectionId),
    validNativeIdentifier(route.selectionPolicyId)
  else { throw MemoryCuratorFailure.invalidRequest }

  let sourceIds = Set(input.sourceMessageIds)
  let messages = try input.messages.map { message in
    guard
      validNativeIdentifier(message.messageId),
      sourceIds.contains(message.messageId),
      message.role == "assistant" || message.role == "user",
      !message.content.isEmpty,
      message.content.utf8.count <= 8_192
    else { throw MemoryCuratorFailure.invalidRequest }
    return MemoryCurationMessage(
      content: message.content,
      messageId: message.messageId,
      role: message.role
    )
  }
  guard
    Set(messages.map(\.messageId)).count == messages.count,
    Set(messages.map(\.messageId)) == sourceIds
  else { throw MemoryCuratorFailure.invalidRequest }

  let activeMemories = try input.activeMemories.map { memory in
    guard
      validNativeIdentifier(memory.memoryId),
      memory.version >= 1,
      !memory.content.isEmpty,
      memory.content.utf8.count <= 4_096,
      ["commitment", "decision", "fact", "preference", "project-summary"]
        .contains(memory.kind)
    else { throw MemoryCuratorFailure.invalidRequest }
    return MemoryCurationObservedMemory(
      content: memory.content,
      kind: memory.kind,
      memoryId: memory.memoryId,
      version: memory.version
    )
  }
  guard Set(activeMemories.map(\.memoryId)).count == activeMemories.count else {
    throw MemoryCuratorFailure.invalidRequest
  }

  return MemoryCurationRequest(
    activeMemories: activeMemories,
    contextPlanId: route.contextPlanId,
    jobId: input.jobId,
    maximumResponseTokens: input.maximumResponseTokens,
    messages: messages,
    policyId: input.policyId,
    selectionId: route.selectionId,
    sourceDigest: input.sourceDigest,
    sourceMessageIds: input.sourceMessageIds
  )
}

func memoryCurationResultRecord(
  _ result: MemoryCurationGenerationResult
) -> [String: Any] {
  [
    "durationMs": result.durationMs,
    "jobId": result.jobId,
    "modelId": result.modelId,
    "policyId": result.policyId,
    "proposals": result.proposals.map { proposal in
      var record: [String: Any] = [
        "confidence": proposal.confidence,
        "content": proposal.content,
        "kind": proposal.kind,
        "operation": proposal.operation,
        "proposedRetention": proposal.proposedRetention,
        "proposedSensitivity": proposal.proposedSensitivity,
        "sourceMessageIds": proposal.sourceMessageIds,
      ]
      if let memoryId = proposal.observedMemoryId,
        let version = proposal.observedMemoryVersion
      {
        record["observedMemory"] = ["memoryId": memoryId, "version": version]
      }
      return record
    },
    "selectionId": result.selectionId,
    "sourceDigest": result.sourceDigest,
  ]
}
