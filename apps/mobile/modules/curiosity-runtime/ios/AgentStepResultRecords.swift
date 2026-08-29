import Foundation

func agentStepResultRecord(_ result: AgentStepGenerationResult) throws -> [String: Any] {
  [
    "contextPlanId": result.contextPlanId,
    "durationMs": result.durationMs,
    "modelId": result.modelId,
    "observedRunRevision": result.observedRunRevision,
    "observedStateDigest": result.observedStateDigest,
    "proposal": try proposalRecord(result.proposal),
    "runId": result.runId,
    "selectionId": result.selectionId,
    "stepId": result.stepId,
    "stepNumber": result.stepNumber,
  ]
}

private func proposalRecord(_ proposal: AgentStepProposalResult) throws -> [String: Any] {
  switch proposal {
  case let .final(text, citations, assistantStateJSON):
    var value: [String: Any] = [
      "citations": citations.map { citation in
        var item: [String: Any] = ["sourceId": citation.sourceId]
        if let excerpt = citation.excerpt { item["excerpt"] = excerpt }
        if let locator = citation.locator { item["locator"] = locator }
        return item
      },
      "kind": "final",
      "text": text,
    ]
    try addAssistantState(assistantStateJSON, to: &value)
    return value
  case let .actions(actions, assistantStateJSON):
    var value: [String: Any] = [
      "actions": try actions.map { action in
        [
          "callKey": action.callKey,
          "input": try jsonObject(action.inputJSON),
          "toolId": action.toolId,
          "toolVersion": action.toolVersion,
        ]
      },
      "kind": "actions",
    ]
    try addAssistantState(assistantStateJSON, to: &value)
    return value
  case let .question(question, assistantStateJSON):
    var value: [String: Any] = [
      "kind": "question",
      "question": [
        "allowFreeText": question.allowFreeText,
        "options": question.options,
        "prompt": question.prompt,
      ],
    ]
    try addAssistantState(assistantStateJSON, to: &value)
    return value
  case let .noGo(reasonCode, assistantStateJSON):
    var value: [String: Any] = [
      "kind": "no-go",
      "reasonCode": reasonCode,
    ]
    try addAssistantState(assistantStateJSON, to: &value)
    return value
  }
}

private func addAssistantState(
  _ json: String?,
  to value: inout [String: Any]
) throws {
  guard let json else { return }
  value["assistantState"] = try jsonObject(json)
}

private func jsonObject(_ value: String) throws -> Any {
  guard let data = value.data(using: .utf8) else {
    throw AgentStepFailure.invalidResult
  }
  return try JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed])
}
