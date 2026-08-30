import Foundation

enum CodexHTTPFailure: Error {
  case response(String)
  case status(Int)
  case transport(String)
}

final class CodexHTTPClient: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
  private lazy var session: URLSession = {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData
    configuration.timeoutIntervalForRequest = 30
    configuration.timeoutIntervalForResource = 300
    configuration.urlCache = nil
    configuration.httpCookieStorage = nil
    configuration.httpShouldSetCookies = false
    return URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
  }()

  func exchange(code: String, request: CodexOAuthRequest) async throws -> CodexSession {
    let fields = [
      "grant_type": "authorization_code",
      "code": code,
      "redirect_uri": request.redirectURI,
      "client_id": CodexConnectionPolicy.clientID,
      "code_verifier": request.codeVerifier,
    ]
    return try await tokenRequest(body: formBody(fields), contentType: "application/x-www-form-urlencoded")
  }

  func refresh(_ existing: CodexSession) async throws -> CodexSession {
    let body = try JSONSerialization.data(withJSONObject: [
      "grant_type": "refresh_token",
      "refresh_token": existing.refreshToken,
      "client_id": CodexConnectionPolicy.clientID,
    ])
    return try await tokenRequest(body: body, contentType: "application/json", existing: existing)
  }

  func models(session: CodexSession) async throws -> [CodexModel] {
    var components = URLComponents(
      url: try CodexConnectionPolicy.backendEndpoint("/backend-api/codex/models"),
      resolvingAgainstBaseURL: false
    )
    components?.queryItems = [
      URLQueryItem(name: "client_version", value: CodexConnectionPolicy.clientVersion)
    ]
    guard let url = components?.url else { throw CodexConnectionFailure.requestFailed }
    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.timeoutInterval = 30
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    applyProviderHeaders(&request, session: session)
    let (data, response) = try await boundedData(request, maximumBytes: 2 * 1_024 * 1_024)
    guard response.statusCode == 200 else { throw CodexHTTPFailure.status(response.statusCode) }
    guard
      let object = try JSONSerialization.jsonObject(with: data) as? [String: Any],
      let values = object["models"] as? [[String: Any]],
      !values.isEmpty,
      values.count <= 1_024
    else { throw CodexConnectionFailure.responseInvalid }
    let models = values.compactMap { value -> CodexModel? in
      guard
        let slug = value["slug"] as? String,
        codexIdentifier(slug, maximumBytes: 256),
        value["supported_in_api"] as? Bool != false,
        value["visibility"] == nil || value["visibility"] as? String == "list"
      else { return nil }
      let displayName = value["display_name"] as? String
      let name = displayName.flatMap {
        $0.utf8.count <= 320 && !$0.isEmpty ? $0 : nil
      } ?? slug
      return CodexModel(id: slug, name: name)
    }
    guard !models.isEmpty else { throw CodexConnectionFailure.responseInvalid }
    return models
  }

  func generate(
    _ input: CodexGenerationRequest,
    session providerSession: CodexSession
  ) async throws -> CodexGenerationResult {
    let body: [String: Any] = [
      "include": ["reasoning.encrypted_content"],
      "input": [[
        "content": [["text": input.prompt, "type": "input_text"]],
        "role": "user",
      ]],
      "instructions": "",
      "model": input.modelId,
      "parallel_tool_calls": false,
      "store": false,
      "stream": true,
    ]
    var request = URLRequest(
      url: try CodexConnectionPolicy.backendEndpoint("/backend-api/codex/responses")
    )
    request.httpMethod = "POST"
    request.timeoutInterval = 300
    request.httpBody = try JSONSerialization.data(withJSONObject: body)
    request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(input.callId, forHTTPHeaderField: "x-client-request-id")
    applyProviderHeaders(&request, session: providerSession)

    let (bytes, response): (URLSession.AsyncBytes, URLResponse)
    do {
      (bytes, response) = try await session.bytes(for: request)
    } catch is CancellationError {
      throw CancellationError()
    } catch {
      throw CodexHTTPFailure.transport(transportDiagnostic(error, phase: "connect"))
    }
    guard
      let http = response as? HTTPURLResponse,
      responseMatches(http, expected: request.url!)
    else { throw CodexHTTPFailure.transport("response:mismatch") }
    guard http.statusCode == 200 else {
      try await drain(bytes, maximumBytes: 64 * 1_024)
      throw CodexHTTPFailure.status(http.statusCode)
    }

    var accumulator = CodexSSEAccumulator(
      maximumTextBytes: min(
        2 * 1_024 * 1_024,
        max(64 * 1_024, input.maximumOutputTokens * 64)
      )
    )
    do {
      for try await byte in bytes {
        try Task.checkCancellation()
        try accumulator.consume(byte: byte)
        if accumulator.completed { break }
      }
      try accumulator.finish()
    } catch is CancellationError {
      throw CancellationError()
    } catch let failure as CodexSSEFailure {
      throw CodexHTTPFailure.response(failure.diagnostic)
    } catch let failure as CodexConnectionFailure {
      throw failure
    } catch {
      let output = accumulator.text.isEmpty ? "none" : "partial"
      throw CodexHTTPFailure.transport(
        "\(transportDiagnostic(error, phase: "stream")):output=\(output)"
      )
    }
    return CodexGenerationResult(
      callId: input.callId,
      finishReason: "stop",
      maxRetries: 0,
      modelId: input.modelId,
      text: accumulator.text,
      transportAttempts: 1
    )
  }

  func urlSession(
    _: URLSession,
    task _: URLSessionTask,
    willPerformHTTPRedirection _: HTTPURLResponse,
    newRequest _: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    completionHandler(nil)
  }

  private func tokenRequest(
    body: Data,
    contentType: String,
    existing: CodexSession? = nil
  ) async throws -> CodexSession {
    var request = URLRequest(url: try CodexConnectionPolicy.authEndpoint("/oauth/token"))
    request.httpMethod = "POST"
    request.timeoutInterval = 30
    request.httpBody = body
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    request.setValue(contentType, forHTTPHeaderField: "Content-Type")
    let (data, response) = try await boundedData(request, maximumBytes: 64 * 1_024)
    guard response.statusCode == 200 else { throw CodexHTTPFailure.status(response.statusCode) }
    guard let payload = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      throw CodexConnectionFailure.responseInvalid
    }
    guard
      let accessToken = boundedSecret(payload["access_token"] as? String),
      let refreshToken = boundedSecret(payload["refresh_token"] as? String)
        ?? existing?.refreshToken
    else { throw CodexConnectionFailure.responseInvalid }
    let idToken = boundedSecret(payload["id_token"] as? String) ?? existing?.idToken
    guard
      let accountId = CodexOAuth.accountId(idToken: idToken, accessToken: accessToken)
        ?? existing?.accountId
    else { throw CodexConnectionFailure.responseInvalid }
    let expires = (payload["expires_in"] as? NSNumber)?.doubleValue ?? 3_600
    return CodexSession(
      accessToken: accessToken,
      accountId: accountId,
      expiresAt: Date().timeIntervalSince1970 + min(max(expires, 60), 30 * 24 * 60 * 60),
      idToken: idToken,
      isFedRamp: CodexOAuth.isFedRamp(idToken: idToken, accessToken: accessToken),
      refreshToken: refreshToken
    )
  }

  private func boundedData(
    _ request: URLRequest,
    maximumBytes: Int
  ) async throws -> (Data, HTTPURLResponse) {
    let (bytes, response): (URLSession.AsyncBytes, URLResponse)
    do {
      (bytes, response) = try await session.bytes(for: request)
    } catch {
      throw CodexHTTPFailure.transport(transportDiagnostic(error, phase: "connect"))
    }
    guard
      let http = response as? HTTPURLResponse,
      let expected = request.url,
      responseMatches(http, expected: expected)
    else { throw CodexHTTPFailure.transport("response:mismatch") }
    var data = Data()
    data.reserveCapacity(min(maximumBytes, 64 * 1_024))
    for try await byte in bytes {
      guard data.count < maximumBytes else {
        throw CodexConnectionFailure.responseInvalid
      }
      data.append(byte)
    }
    return (data, http)
  }

  private func drain(_ bytes: URLSession.AsyncBytes, maximumBytes: Int) async throws {
    var count = 0
    for try await _ in bytes {
      count += 1
      guard count <= maximumBytes else { throw CodexConnectionFailure.responseInvalid }
    }
  }

  private func responseMatches(_ response: HTTPURLResponse, expected: URL) -> Bool {
    guard let actual = response.url else { return false }
    return CodexConnectionPolicy.sameOrigin(actual, expected)
      && actual.path == expected.path
  }

  private func applyProviderHeaders(_ request: inout URLRequest, session: CodexSession) {
    request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    request.setValue(session.accountId, forHTTPHeaderField: "ChatGPT-Account-ID")
    request.setValue(CodexConnectionPolicy.originator, forHTTPHeaderField: "originator")
    request.setValue(CodexConnectionPolicy.clientVersion, forHTTPHeaderField: "version")
    request.setValue(
      "Curiosity/0.1 Codex/\(CodexConnectionPolicy.clientVersion)",
      forHTTPHeaderField: "User-Agent"
    )
    if session.isFedRamp {
      request.setValue("true", forHTTPHeaderField: "X-OpenAI-Fedramp")
    }
  }

  private func formBody(_ fields: [String: String]) -> Data {
    var components = URLComponents()
    components.queryItems = fields.sorted { $0.key < $1.key }.map {
      URLQueryItem(name: $0.key, value: $0.value)
    }
    return Data((components.percentEncodedQuery ?? "").utf8)
  }

  private func boundedSecret(_ value: String?) -> String? {
    guard
      let value,
      !value.isEmpty,
      value.utf8.count <= 16 * 1_024,
      !value.unicodeScalars.contains(where: { $0.value <= 0x1f || $0.value == 0x7f })
    else { return nil }
    return value
  }

  private func transportDiagnostic(_ error: Error, phase: String) -> String {
    if let error = error as? URLError {
      return "\(phase):url:\(error.code.rawValue)"
    }
    let error = error as NSError
    let domain = error.domain == NSURLErrorDomain ? "url" : "other"
    return "\(phase):\(domain):\(error.code)"
  }
}
