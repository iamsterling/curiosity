import Foundation

private struct StoredCodexRoutePreferences: Codable {
  let modelsByAgent: [String: String]
  let schemaVersion: Int
}

struct CodexRoutePreference: Sendable {
  let agentId: String
  let modelId: String

  var record: [String: String] {
    [
      "agentId": agentId,
      "modelId": modelId,
      "providerId": "openai-oauth",
      "routeId": "frontier.openai-oauth",
      "selectionPolicyId": "apple-operator-role-route-v1",
    ]
  }
}

final class CodexRoutePreferences {
  private let defaults: UserDefaults
  private let key = "curiosity.provider-route-preferences.v1"
  private let roles = Set([
    "analyst",
    "generalist",
    "implementer",
    "orchestrator",
    "researcher",
    "reviewer",
    "strategist",
    "worker",
  ])

  init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }

  func all() throws -> [CodexRoutePreference] {
    try read().map { CodexRoutePreference(agentId: $0.key, modelId: $0.value) }
      .sorted { $0.agentId < $1.agentId }
  }

  func preference(agentId: String) throws -> CodexRoutePreference? {
    guard roles.contains(agentId) else {
      throw CodexConnectionFailure.generationInvalid
    }
    guard let modelId = try read()[agentId] else { return nil }
    return CodexRoutePreference(agentId: agentId, modelId: modelId)
  }

  func set(agentId: String, modelId: String) throws {
    guard roles.contains(agentId), codexIdentifier(modelId, maximumBytes: 256) else {
      throw CodexConnectionFailure.generationInvalid
    }
    var values = try read()
    values[agentId] = modelId
    let stored = StoredCodexRoutePreferences(modelsByAgent: values, schemaVersion: 1)
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys]
    defaults.set(try encoder.encode(stored), forKey: key)
  }

  private func read() throws -> [String: String] {
    guard let data = defaults.data(forKey: key) else { return [:] }
    guard
      let stored = try? JSONDecoder().decode(StoredCodexRoutePreferences.self, from: data),
      stored.schemaVersion == 1,
      stored.modelsByAgent.count <= roles.count,
      stored.modelsByAgent.allSatisfy({
        roles.contains($0.key) && codexIdentifier($0.value, maximumBytes: 256)
      })
    else { throw CodexConnectionFailure.responseInvalid }
    return stored.modelsByAgent
  }
}
