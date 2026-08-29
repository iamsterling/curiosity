import Foundation
import FoundationModels

@available(iOS 26.0, *)
@Generable(description: "A citation grounded in one supplied context source.")
struct GeneratedAgentCitation {
  @Guide(description: "An optional short exact excerpt from the source.")
  var excerpt: String?

  @Guide(description: "An optional location within the source.")
  var locator: String?

  @Guide(description: "An exact block or source-event identifier from the prompt.")
  var sourceId: String
}

@available(iOS 26.0, *)
@Generable(description: "One proposed call to an explicitly available tool.")
struct GeneratedAgentAction {
  @Guide(description: "A stable unique key for this call within the step.")
  var callKey: String

  @Guide(description: "A JSON value matching the selected tool input schema.")
  var inputJSON: String

  @Guide(description: "The exact available tool identifier.")
  var toolId: String

  @Guide(description: "The exact available tool version.")
  var toolVersion: String
}

@available(iOS 26.0, *)
@Generable(description: "A bounded non-approval question for the user.")
struct GeneratedAgentQuestion {
  @Guide(description: "Whether a free-text answer is allowed.")
  var allowFreeText: Bool

  @Guide(description: "Zero to eight concise answer options.", .maximumCount(8))
  var options: [String]

  @Guide(description: "The concise question to display.")
  var prompt: String
}

@available(iOS 26.0, *)
@Generable(description: "A final grounded answer proposal.")
struct GeneratedAgentFinalProposal {
  @Guide(description: "Optional compact JSON assistant state for the next step.")
  var assistantStateJSON: String?

  @Guide(description: "Zero to eight grounded citations.", .maximumCount(8))
  var citations: [GeneratedAgentCitation]

  @Guide(description: "The grounded answer text.")
  var text: String
}

@available(iOS 26.0, *)
@Generable(description: "A proposal for one to eight available tool calls.")
struct GeneratedAgentActionsProposal {
  @Guide(
    description: "One to eight proposed calls to explicitly available tools.",
    .minimumCount(1),
    .maximumCount(8)
  )
  var actions: [GeneratedAgentAction]

  @Guide(description: "Optional compact JSON assistant state for the next step.")
  var assistantStateJSON: String?
}

@available(iOS 26.0, *)
@Generable(description: "A proposal for one bounded non-approval question.")
struct GeneratedAgentQuestionProposal {
  @Guide(description: "Optional compact JSON assistant state for the next step.")
  var assistantStateJSON: String?

  @Guide(description: "The bounded user question.")
  var question: GeneratedAgentQuestion
}

@available(iOS 26.0, *)
@Generable(description: "A proposal to stop because progress is not authorized or supported.")
struct GeneratedAgentNoGoProposal {
  @Guide(description: "Optional compact JSON assistant state for the next step.")
  var assistantStateJSON: String?

  @Guide(description: "A stable policy, evidence, or capability reason code.")
  var reasonCode: String
}

@available(iOS 26.0, *)
@Generable(description: "Exactly one bounded agent-step proposal branch.")
enum GeneratedAgentStepEnvelope {
  case final(GeneratedAgentFinalProposal)

  case actions(GeneratedAgentActionsProposal)

  case question(GeneratedAgentQuestionProposal)

  case noGo(GeneratedAgentNoGoProposal)
}
