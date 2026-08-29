import CryptoKit
import Foundation

#if DEBUG
func runAgentStepDiagnostics(host: AgentStepHost) async {
  guard #available(iOS 26.0, *) else {
    print("CURIOSITY_AGENT_STEP_FIXTURE status=FAIL error=OS_UNSUPPORTED")
    return
  }
  for kind in ["final", "actions", "question", "no-go"] {
    do {
      let request = try diagnosticRequest(kind: kind)
      let result = try await host.step(request)
      let actual = proposalKind(result.proposal)
      guard actual == kind else {
        print(
          "CURIOSITY_AGENT_STEP_FIXTURE kind=\(kind) status=FAIL actual=\(actual)"
        )
        continue
      }
      print(
        "CURIOSITY_AGENT_STEP_FIXTURE kind=\(kind) status=PASS durationMs=\(result.durationMs)"
      )
    } catch let failure as FoundationModelFailure {
      print(
        "CURIOSITY_AGENT_STEP_FIXTURE kind=\(kind) status=FAIL error=\(failure.rawValue)"
      )
    } catch let failure as AgentStepFailure {
      print(
        "CURIOSITY_AGENT_STEP_FIXTURE kind=\(kind) status=FAIL error=\(failure.rawValue)"
      )
    } catch {
      print("CURIOSITY_AGENT_STEP_FIXTURE kind=\(kind) status=FAIL error=UNKNOWN")
    }
  }
  await runOverflowDiagnostic(host: host)
  await runCancellationDiagnostic(host: host)
}

private func diagnosticRequest(
  kind: String,
  suffix: String = "",
  content overrideContent: String? = nil
) throws -> AgentStepRequest {
  let content = overrideContent ?? diagnosticContent(kind: kind)
  let block = AgentStepContextBlock(
    blockId: "diagnostic-policy-\(kind)",
    content: content,
    contentDigest: diagnosticSHA256(content),
    kind: "agent-policy",
    provenance: "trusted-durable",
    sourceEventIds: ["diagnostic-event-\(kind)"]
  )
  let estimatedTokens = Int(ceil(Double(content.utf8.count) / 3.0))
  let contextPlanId = try diagnosticContextPlanId(
    block: block,
    estimatedTokens: estimatedTokens
  )
  let tools = kind == "actions"
    ? [
      AgentStepToolDefinition(
        description: "Read one governed diagnostic document.",
        inputSchemaJSON: """
          {"additionalProperties":false,"properties":{"documentId":{"type":"string"}},"required":["documentId"],"type":"object"}
          """,
        toolId: "document.read",
        version: "1"
      ),
    ]
    : []
  return AgentStepRequest(
    agent: AgentStepIdentity(id: "diagnostic-agent", version: "1"),
    availableTools: tools,
    contextPlan: AgentStepContextPlan(
      blocks: [block],
      contextPlanId: contextPlanId,
      estimatedTokens: estimatedTokens,
      policyId: "agent-step-diagnostic-v1",
      schemaVersion: 1,
      utf8Bytes: content.utf8.count
    ),
    diagnosticExpectedKind: kind,
    finalizationOnly: false,
    maximumResponseTokens: 768,
    observedRunRevision: 0,
    observedStateDigest: String(repeating: "0", count: 64),
    runId: "diagnostic-run-\(kind)\(suffix)",
    selectionId: String(repeating: "1", count: 64),
    stepId: "diagnostic-step-\(kind)\(suffix)",
    stepNumber: 1
  )
}

private func runOverflowDiagnostic(host: AgentStepHost) async {
  do {
    let request = try diagnosticRequest(
      kind: "final",
      suffix: "-overflow",
      content: String(repeating: "bounded-overflow-evidence ", count: 400)
    )
    _ = try await host.step(request)
    print("CURIOSITY_AGENT_STEP_FIXTURE kind=overflow status=FAIL error=DISPATCHED")
  } catch FoundationModelFailure.contextExceeded {
    print(
      "CURIOSITY_AGENT_STEP_FIXTURE kind=overflow status=PASS error=FOUNDATION_MODEL_CONTEXT_EXCEEDED"
    )
  } catch let failure as FoundationModelFailure {
    print(
      "CURIOSITY_AGENT_STEP_FIXTURE kind=overflow status=FAIL error=\(failure.rawValue)"
    )
  } catch {
    print("CURIOSITY_AGENT_STEP_FIXTURE kind=overflow status=FAIL error=UNKNOWN")
  }
}

private func runCancellationDiagnostic(host: AgentStepHost) async {
  do {
    let request = try diagnosticRequest(
      kind: "final",
      suffix: "-cancel",
      content: String(repeating: "Produce a careful bounded diagnostic. ", count: 30)
    )
    let task = Task { try await host.step(request) }
    try await Task.sleep(nanoseconds: 100_000_000)
    await host.cancelAll()
    do {
      _ = try await task.value
      print("CURIOSITY_AGENT_STEP_FIXTURE kind=cancel status=FAIL error=COMPLETED")
    } catch FoundationModelFailure.actionCancelled {
      print(
        "CURIOSITY_AGENT_STEP_FIXTURE kind=cancel status=PASS error=ACTION_CANCELLED"
      )
    } catch let failure as FoundationModelFailure {
      print(
        "CURIOSITY_AGENT_STEP_FIXTURE kind=cancel status=FAIL error=\(failure.rawValue)"
      )
    }
  } catch {
    print("CURIOSITY_AGENT_STEP_FIXTURE kind=cancel status=FAIL error=UNKNOWN")
  }
}

private func diagnosticContent(kind: String) -> String {
  switch kind {
  case "actions":
    return "The governed diagnostic document must be read before answering."
  case "question":
    return "Progress requires the user to choose between diagnostic mode A and B."
  case "no-go":
    return "Kernel policy explicitly prohibits this diagnostic operation. The prohibition is final; no clarification can authorize progress."
  default:
    return "The diagnostic completed successfully and requires no tool or question."
  }
}

private func diagnosticContextPlanId(
  block: AgentStepContextBlock,
  estimatedTokens: Int
) throws -> String {
  let value: [String: Any] = [
    "blocks": [
      [
        "blockId": block.blockId,
        "content": block.content,
        "contentDigest": block.contentDigest,
        "kind": block.kind,
        "provenance": block.provenance,
        "sourceEventIds": block.sourceEventIds,
      ],
    ],
    "estimatedTokens": estimatedTokens,
    "policyId": "agent-step-diagnostic-v1",
    "schemaVersion": 1,
    "utf8Bytes": block.content.utf8.count,
  ]
  let data = try JSONSerialization.data(
    withJSONObject: value,
    options: [.sortedKeys, .withoutEscapingSlashes]
  )
  guard let json = String(data: data, encoding: .utf8) else {
    throw AgentStepFailure.invalidRequest
  }
  return diagnosticSHA256(json)
}

private func diagnosticSHA256(_ value: String) -> String {
  SHA256.hash(data: Data(value.utf8)).map { String(format: "%02x", $0) }.joined()
}

private func proposalKind(_ proposal: AgentStepProposalResult) -> String {
  switch proposal {
  case .actions: return "actions"
  case .final: return "final"
  case .noGo: return "no-go"
  case .question: return "question"
  }
}
#endif
