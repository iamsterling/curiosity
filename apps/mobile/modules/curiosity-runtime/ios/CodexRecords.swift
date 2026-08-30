import ExpoModulesCore
import Foundation

final class CodexGenerationRecord: Record {
  @Field var callId: String = ""
  @Field var maximumOutputTokens: Int = 0
  @Field var modelId: String = ""
  @Field var prompt: String = ""
  @Field var providerId: String = ""
}

struct CodexGenerationRequest: Sendable {
  let callId: String
  let maximumOutputTokens: Int
  let modelId: String
  let prompt: String
}

struct CodexGenerationResult: Codable, Sendable {
  let callId: String
  let finishReason: String
  let maxRetries: Int
  let modelId: String
  let text: String
  let transportAttempts: Int
}

struct CodexCatalogResult: Sendable {
  let snapshotJSON: String
  let source: String
}

struct CodexModel: Codable, Sendable {
  let id: String
  let name: String
}

func validateCodexGenerationRecord(
  _ input: CodexGenerationRecord
) throws -> CodexGenerationRequest {
  guard
    codexIdentifier(input.callId, maximumBytes: 256),
    input.maximumOutputTokens > 0,
    input.maximumOutputTokens <= 8_192,
    codexIdentifier(input.modelId, maximumBytes: 256),
    input.prompt.utf8.count > 0,
    input.prompt.utf8.count <= 512 * 1_024,
    input.providerId == "openai-oauth"
  else { throw CodexConnectionFailure.generationInvalid }

  return CodexGenerationRequest(
    callId: input.callId,
    maximumOutputTokens: input.maximumOutputTokens,
    modelId: input.modelId,
    prompt: input.prompt
  )
}

func codexIdentifier(_ value: String, maximumBytes: Int) -> Bool {
  guard !value.isEmpty, value.utf8.count <= maximumBytes else { return false }
  return !value.unicodeScalars.contains { scalar in
    scalar.value <= 0x20 || scalar.value == 0x7f
  }
}
