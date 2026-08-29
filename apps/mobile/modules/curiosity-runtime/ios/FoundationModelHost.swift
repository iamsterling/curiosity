import Foundation
import FoundationModels

struct FoundationModelGenerationRequest: Sendable {
  let maximumResponseTokens: Int
  let messages: [FoundationModelMessage]
  let toolCount: Int
  let turnId: String
}

struct FoundationModelMessage: Sendable {
  let content: String
  let role: String
}

struct FoundationModelGenerationResult: Sendable {
  let durationMs: Int
  let effort: String
  let modelId: String
  let text: String
}

enum FoundationModelFailure: String, Error {
  case actionCancelled = "ACTION_CANCELLED"
  case contextExceeded = "FOUNDATION_MODEL_CONTEXT_EXCEEDED"
  case generationFailed = "FOUNDATION_MODEL_GENERATION_FAILED"
  case guardrailViolation = "FOUNDATION_MODEL_GUARDRAIL_VIOLATION"
  case localeUnsupported = "FOUNDATION_MODEL_LOCALE_UNSUPPORTED"
  case modelUnavailable = "FOUNDATION_MODEL_UNAVAILABLE"
  case rateLimited = "FOUNDATION_MODEL_RATE_LIMITED"
  case refusal = "FOUNDATION_MODEL_REFUSAL"
  case toolBridgeUnavailable = "FOUNDATION_MODEL_TOOL_BRIDGE_UNAVAILABLE"
}

actor FoundationModelHost {
  typealias DeltaSink = @Sendable (_ turnId: String, _ delta: String) -> Void

  private var generations: [String: Task<FoundationModelGenerationResult, Error>] = [:]
  private var pendingCancellations: Set<String> = []

  func status() -> [String: String] {
    guard #available(iOS 26.0, *) else {
      return statusRecord(availability: "unavailable", reason: "OS_UNSUPPORTED")
    }
    switch SystemLanguageModel.default.availability {
    case .available:
      return statusRecord(availability: "available", reason: "NONE")
    case .unavailable(.deviceNotEligible):
      return statusRecord(availability: "unavailable", reason: "DEVICE_NOT_ELIGIBLE")
    case .unavailable(.appleIntelligenceNotEnabled):
      return statusRecord(
        availability: "unavailable",
        reason: "APPLE_INTELLIGENCE_NOT_ENABLED"
      )
    case .unavailable(.modelNotReady):
      return statusRecord(availability: "unavailable", reason: "MODEL_NOT_READY")
    @unknown default:
      return statusRecord(availability: "unavailable", reason: "UNKNOWN")
    }
  }

  func generate(
    _ request: FoundationModelGenerationRequest,
    emit: @escaping DeltaSink
  ) async throws -> FoundationModelGenerationResult {
    guard request.toolCount == 0 else {
      throw FoundationModelFailure.toolBridgeUnavailable
    }
    guard #available(iOS 26.0, *) else {
      throw FoundationModelFailure.modelUnavailable
    }
    guard case .available = SystemLanguageModel.default.availability else {
      throw FoundationModelFailure.modelUnavailable
    }
    guard generations[request.turnId] == nil else {
      throw FoundationModelFailure.generationFailed
    }
    if pendingCancellations.remove(request.turnId) != nil {
      throw FoundationModelFailure.actionCancelled
    }

    let task = Task<FoundationModelGenerationResult, Error> {
      try await Self.performGeneration(request, emit: emit)
    }
    generations[request.turnId] = task
    defer { generations.removeValue(forKey: request.turnId) }
    do {
      return try await task.value
    } catch is CancellationError {
      throw FoundationModelFailure.actionCancelled
    } catch let failure as FoundationModelFailure {
      throw failure
    } catch {
      throw Self.map(error)
    }
  }

  func cancel(turnId: String) {
    if let generation = generations[turnId] {
      generation.cancel()
      return
    }
    if pendingCancellations.count < 64 {
      pendingCancellations.insert(turnId)
    }
  }

  func cancelAll() {
    for task in generations.values { task.cancel() }
  }

  private func statusRecord(
    availability: String,
    reason: String
  ) -> [String: String] {
    [
      "availability": availability,
      "modelId": "apple:system-language-model",
      "reason": reason,
    ]
  }

  @available(iOS 26.0, *)
  private static func performGeneration(
    _ request: FoundationModelGenerationRequest,
    emit: @escaping DeltaSink
  ) async throws -> FoundationModelGenerationResult {
    let prompt = request.messages.map { message in
      "\(message.role.uppercased()):\n\(message.content)"
    }.joined(separator: "\n\n")
    let instructions = """
      You are Curiosity's bounded on-device drafting model. Follow the supplied
      conversation, do not claim tool use or external retrieval, distinguish
      known context from uncertainty, and never invent completion evidence.
      """
    let session = LanguageModelSession(
      model: SystemLanguageModel.default,
      tools: [],
      instructions: instructions
    )
    let options = GenerationOptions(
      maximumResponseTokens: request.maximumResponseTokens
    )
    let started = Date()
    var previous = ""
    for try await snapshot in session.streamResponse(to: prompt, options: options) {
      try Task.checkCancellation()
      let current = snapshot.content
      let delta = current.hasPrefix(previous)
        ? String(current.dropFirst(previous.count))
        : current
      if !delta.isEmpty { emit(request.turnId, delta) }
      previous = current
    }
    try Task.checkCancellation()
    return FoundationModelGenerationResult(
      durationMs: Int(Date().timeIntervalSince(started) * 1_000),
      effort: "on-device-bounded",
      modelId: "apple:system-language-model",
      text: previous
    )
  }

  @available(iOS 26.0, *)
  static func map(_ error: Error) -> FoundationModelFailure {
    if error is CancellationError { return .actionCancelled }
    if #available(iOS 27.0, *) {
      if let modelError = error as? LanguageModelError {
        switch modelError {
        case .contextSizeExceeded: return .contextExceeded
        case .rateLimited: return .rateLimited
        case .guardrailViolation: return .guardrailViolation
        case .refusal: return .refusal
        case .unsupportedLanguageOrLocale: return .localeUnsupported
        default: return .generationFailed
        }
      }
      if error is SystemLanguageModel.Error { return .modelUnavailable }
    }
    if let generation = error as? LanguageModelSession.GenerationError {
      switch generation {
      case .exceededContextWindowSize: return .contextExceeded
      case .assetsUnavailable: return .modelUnavailable
      case .guardrailViolation: return .guardrailViolation
      case .unsupportedLanguageOrLocale: return .localeUnsupported
      case .rateLimited: return .rateLimited
      case .refusal: return .refusal
      default: return .generationFailed
      }
    }
    return .generationFailed
  }
}
