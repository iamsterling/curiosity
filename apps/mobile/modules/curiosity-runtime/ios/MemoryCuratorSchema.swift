import Foundation
import FoundationModels

@available(iOS 26.0, *)
@Generable(description: "A previously observed memory and its exact version.")
struct GeneratedObservedMemory {
  @Guide(description: "The exact memory identifier supplied in the prompt.")
  var memoryId: String

  @Guide(description: "The exact positive version supplied in the prompt.", .minimum(1))
  var version: Int
}

@available(iOS 26.0, *)
@Generable(description: "One bounded proposal for deterministic memory policy review.")
struct GeneratedMemoryProposal {
  @Guide(description: "Confidence from zero through one.", .range(0.0...1.0))
  var confidence: Double

  @Guide(description: "A concise normalized statement. Never include secrets or credentials.")
  var content: String

  @Guide(
    description: "The semantic memory kind.",
    .anyOf(["commitment", "decision", "fact", "preference", "project-summary"])
  )
  var kind: String

  @Guide(description: "Required for every operation except create.")
  var observedMemory: GeneratedObservedMemory?

  @Guide(
    description: "The proposed operation. Retirement is advisory only.",
    .anyOf(["create", "retain", "supersede", "suggest-retire"])
  )
  var operation: String

  @Guide(
    description: "Requested retention; deterministic policy makes the decision.",
    .anyOf(["session", "bounded", "durable"])
  )
  var proposedRetention: String

  @Guide(
    description: "Requested sensitivity; deterministic policy may raise it.",
    .anyOf(["ordinary", "private", "restricted"])
  )
  var proposedSensitivity: String

  @Guide(
    description: "One or more exact source message identifiers from the prompt.",
    .count(1...16)
  )
  var sourceMessageIds: [String]
}

@available(iOS 26.0, *)
@Generable(description: "Zero to eight memory proposals. An empty list is valid.")
struct GeneratedMemoryCuration {
  @Guide(description: "Only durable, source-grounded candidates.", .maximumCount(8))
  var proposals: [GeneratedMemoryProposal]
}
