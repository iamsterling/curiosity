import CryptoKit
import Foundation

actor CodexConnectionHost {
  private let http = CodexHTTPClient()
  private let keychain = CodexSessionKeychain()
  private let ledger = CodexGenerationLedger()
  private var authenticating = false
  private var generationTasks: [String: Task<CodexGenerationResult, Error>] = [:]
  private var lastDiagnostic: String?
  private var modelCache: (expiresAt: Date, models: [CodexModel])?
  private var refreshTask: Task<CodexSession, Error>?

  func status() -> [String: Any] {
    var result: [String: Any] = ["hasSession": (try? keychain.read()) != nil]
    if let lastDiagnostic { result["lastDiagnostic"] = lastDiagnostic }
    return result
  }

  func catalog() async throws -> CodexCatalogResult {
    guard (try keychain.read()) != nil else { return try disconnectedCatalog() }
    let models = try await discoveredModels()
    return try connectedCatalog(models)
  }

  func authenticate(providerID: String) async throws -> CodexCatalogResult {
    guard providerID == "openai-oauth", !authenticating else {
      throw CodexConnectionFailure.authenticationFailed
    }
    authenticating = true
    defer { authenticating = false }

    let listener = try await CodexOAuthLoopbackListener.start()
    let oauth = try CodexOAuth.request(port: listener.port)
    try listener.prepare(expectedState: oauth.state)
    let callbackTask = Task { try await listener.callback() }
    let presenter = await MainActor.run { CodexAuthenticationPresenter() }
    do {
      try await presenter.open(oauth.authorizationURL, expectedState: oauth.state)
      let code = try await callbackTask.value
      let session = try await http.exchange(code: code, request: oauth)
      try keychain.save(session)
      modelCache = nil
      return try connectedCatalog(try await discoveredModels())
    } catch {
      listener.stop()
      _ = try? await callbackTask.value
      if let failure = error as? CodexConnectionFailure { throw failure }
      throw CodexConnectionFailure.authenticationFailed
    }
  }

  func disconnect(providerID: String) async throws -> CodexCatalogResult {
    guard providerID == "openai-oauth" else {
      throw CodexConnectionFailure.requestFailed
    }
    cancelAllGenerations()
    try keychain.clear()
    modelCache = nil
    return try disconnectedCatalog()
  }

  func generate(_ request: CodexGenerationRequest) async throws -> CodexGenerationResult {
    guard generationTasks[request.callId] == nil else {
      throw CodexConnectionFailure.generationInvalid
    }
    let providerSession = try await activeSession()
    let models = try await discoveredModels(session: providerSession)
    guard models.contains(where: { $0.id == request.modelId }) else {
      throw CodexConnectionFailure.generationRouteUnavailable
    }
    switch try ledger.allocate(request) {
    case .completed(let result):
      return result
    case .dispatch:
      break
    }

    let task = Task {
      try await http.generate(request, session: providerSession)
    }
    generationTasks[request.callId] = task
    defer { generationTasks.removeValue(forKey: request.callId) }
    do {
      let result = try await task.value
      try ledger.complete(request, result: result)
      return result
    } catch is CancellationError {
      throw CancellationError()
    } catch CodexHTTPFailure.transport(let diagnostic) {
      lastDiagnostic = diagnostic
      throw CodexConnectionFailure.deliveryUnknown
    } catch CodexHTTPFailure.response(let diagnostic) {
      lastDiagnostic = diagnostic
      throw CodexConnectionFailure.responseInvalid
    } catch CodexHTTPFailure.status(let status) {
      if status == 401 || status == 403 { try? keychain.clear() }
      throw status == 401 || status == 403
        ? CodexConnectionFailure.sessionRequired
        : CodexConnectionFailure.generationFailed
    } catch let failure as CodexConnectionFailure {
      throw failure
    } catch {
      throw CodexConnectionFailure.generationFailed
    }
  }

  func cancelGeneration(callID: String) {
    generationTasks[callID]?.cancel()
  }

  func cancelAllGenerations() {
    for task in generationTasks.values { task.cancel() }
  }

  private func activeSession() async throws -> CodexSession {
    guard let existing = try keychain.read() else {
      throw CodexConnectionFailure.sessionRequired
    }
    if existing.expiresAt > Date().timeIntervalSince1970 + 60 { return existing }
    if let refreshTask { return try await refreshTask.value }
    let task = Task { [http, keychain] in
      let refreshed = try await http.refresh(existing)
      try keychain.save(refreshed)
      return refreshed
    }
    refreshTask = task
    defer { refreshTask = nil }
    do {
      return try await task.value
    } catch CodexHTTPFailure.status(let status) where status == 400 || status == 401 {
      try? keychain.clear()
      throw CodexConnectionFailure.sessionRequired
    } catch let failure as CodexConnectionFailure {
      throw failure
    } catch {
      throw CodexConnectionFailure.requestFailed
    }
  }

  private func discoveredModels(session: CodexSession? = nil) async throws -> [CodexModel] {
    if let cache = modelCache, cache.expiresAt > Date() { return cache.models }
    let providerSession: CodexSession
    if let session {
      providerSession = session
    } else {
      providerSession = try await activeSession()
    }
    do {
      let models = try await http.models(session: providerSession)
      modelCache = (Date().addingTimeInterval(5 * 60), models)
      return models
    } catch CodexHTTPFailure.status(let status) {
      if status == 401 || status == 403 { try? keychain.clear() }
      throw status == 401 || status == 403
        ? CodexConnectionFailure.sessionRequired
        : CodexConnectionFailure.requestFailed
    } catch let failure as CodexConnectionFailure {
      throw failure
    } catch {
      throw CodexConnectionFailure.requestFailed
    }
  }

  private func connectedCatalog(_ models: [CodexModel]) throws -> CodexCatalogResult {
    let publicModels: [[String: Any]] = models.map {
      [
        "id": $0.id,
        "name": $0.name,
        "reasoning": true,
        "source": "provider-api",
        "toolCall": true,
      ]
    }
    return try catalog(connectionState: "connected", models: publicModels, source: "provider-api")
  }

  private func disconnectedCatalog() throws -> CodexCatalogResult {
    try catalog(connectionState: "disconnected", models: [], source: "cache")
  }

  private func catalog(
    connectionState: String,
    models: [[String: Any]],
    source: String
  ) throws -> CodexCatalogResult {
    let modelData = try JSONSerialization.data(withJSONObject: models, options: [.sortedKeys])
    let digest = SHA256.hash(data: modelData).prefix(16)
      .map { String(format: "%02x", $0) }.joined()
    let snapshot: [String: Any] = [
      "providers": [[
        "authenticationMethods": ["oauth-pkce"],
        "connectionState": connectionState,
        "experimental": true,
        "id": "openai-oauth",
        "models": models,
        "name": "ChatGPT / Codex",
      ]],
      "revision": "native-codex:\(digest)",
      "schemaVersion": 1,
    ]
    let data = try JSONSerialization.data(withJSONObject: snapshot, options: [.sortedKeys])
    guard let json = String(data: data, encoding: .utf8) else {
      throw CodexConnectionFailure.responseInvalid
    }
    return CodexCatalogResult(snapshotJSON: json, source: source)
  }
}
