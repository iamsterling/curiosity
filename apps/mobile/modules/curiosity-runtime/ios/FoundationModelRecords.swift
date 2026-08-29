import ExpoModulesCore
import Foundation

struct FoundationModelMessageRecord: Record {
  @Field var content = ""
  @Field var role = ""
}

struct FoundationModelGenerationRecord: Record {
  @Field var maximumResponseTokens = 2_048
  @Field var messages: [FoundationModelMessageRecord] = []
  @Field var toolCount = 0
  @Field var turnId = ""
}

func validateFoundationModelGenerationRecord(
  _ input: FoundationModelGenerationRecord
) throws -> FoundationModelGenerationRequest {
  guard
    !input.turnId.isEmpty,
    input.turnId.utf8.count <= 256,
    input.maximumResponseTokens >= 1,
    input.maximumResponseTokens <= 4_096,
    input.messages.count <= 64,
    input.messages.allSatisfy({ message in
      (message.role == "assistant" || message.role == "user") &&
        !message.content.isEmpty && message.content.utf8.count <= 65_536
    })
  else { throw FoundationModelFailure.generationFailed }
  return FoundationModelGenerationRequest(
    maximumResponseTokens: input.maximumResponseTokens,
    messages: input.messages.map {
      FoundationModelMessage(content: $0.content, role: $0.role)
    },
    toolCount: input.toolCount,
    turnId: input.turnId
  )
}
