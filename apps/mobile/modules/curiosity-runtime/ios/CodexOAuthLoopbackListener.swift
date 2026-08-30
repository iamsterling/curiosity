import Foundation
import Network

private final class CodexListenerStartGate: @unchecked Sendable {
  private let lock = NSLock()
  private var resumed = false

  func resumeOnce(_ operation: () -> Void) {
    lock.lock()
    defer { lock.unlock() }
    guard !resumed else { return }
    resumed = true
    operation()
  }
}

final class CodexOAuthLoopbackListener: @unchecked Sendable {
  let port: UInt16

  private let listener: NWListener
  private let lock = NSLock()
  private let queue = DispatchQueue(label: "com.iamsterling.curiosity.codex-oauth-loopback")
  private var callbackContinuation: CheckedContinuation<String, Error>?
  private var callbackResult: Result<String, Error>?
  private var expectedState: String?

  private init(listener: NWListener, port: UInt16) {
    self.listener = listener
    self.port = port
  }

  static func start() async throws -> CodexOAuthLoopbackListener {
    for port: UInt16 in [1455, 1457] {
      do { return try await start(port: port) } catch { continue }
    }
    throw CodexConnectionFailure.authenticationFailed
  }

  func prepare(expectedState: String) throws {
    guard codexIdentifier(expectedState, maximumBytes: 512) else {
      throw CodexConnectionFailure.authenticationFailed
    }
    lock.lock()
    defer { lock.unlock() }
    guard self.expectedState == nil else {
      throw CodexConnectionFailure.authenticationFailed
    }
    self.expectedState = expectedState
  }

  func callback() async throws -> String {
    return try await withCheckedThrowingContinuation { continuation in
      lock.lock()
      defer { lock.unlock() }
      guard expectedState != nil, callbackContinuation == nil else {
        continuation.resume(throwing: CodexConnectionFailure.authenticationFailed)
        return
      }
      if let result = callbackResult {
        continuation.resume(with: result)
      } else {
        callbackContinuation = continuation
      }
    }
  }

  func stop() {
    listener.cancel()
    resolve(.failure(CodexConnectionFailure.authenticationCancelled))
  }

  private static func start(port: UInt16) async throws -> CodexOAuthLoopbackListener {
    guard
      let networkPort = NWEndpoint.Port(rawValue: port),
      let loopback = IPv4Address("127.0.0.1")
    else { throw CodexConnectionFailure.authenticationFailed }
    let parameters = NWParameters.tcp
    parameters.allowLocalEndpointReuse = false
    parameters.requiredLocalEndpoint = .hostPort(
      host: .ipv4(loopback),
      port: networkPort
    )
    let listener = try NWListener(using: parameters)
    let server = CodexOAuthLoopbackListener(listener: listener, port: port)
    try await server.startAndWaitUntilReady()
    return server
  }

  private func startAndWaitUntilReady() async throws {
    try await withCheckedThrowingContinuation { continuation in
      let gate = CodexListenerStartGate()
      listener.stateUpdateHandler = { state in
        switch state {
        case .ready:
          gate.resumeOnce { continuation.resume() }
        case .failed:
          gate.resumeOnce {
            continuation.resume(throwing: CodexConnectionFailure.authenticationFailed)
          }
        case .cancelled:
          gate.resumeOnce {
            continuation.resume(throwing: CodexConnectionFailure.authenticationFailed)
          }
        default:
          break
        }
      }
      listener.newConnectionHandler = { [weak self] connection in
        self?.receive(connection)
      }
      listener.start(queue: queue)
    }
  }

  private func receive(_ connection: NWConnection) {
    connection.stateUpdateHandler = { [weak self, weak connection] state in
      guard case .ready = state, let self, let connection else { return }
      self.receiveRequest(connection, data: Data())
    }
    connection.start(queue: queue)
  }

  private func receiveRequest(_ connection: NWConnection, data: Data) {
    connection.receive(minimumIncompleteLength: 1, maximumLength: 4_096) {
      [weak self, weak connection] chunk, _, isComplete, error in
      guard let self, let connection else { return }
      var request = data
      if let chunk { request.append(chunk) }
      guard request.count <= 16 * 1_024 else {
        self.send(status: "413 Payload Too Large", connection: connection)
        return
      }
      if request.range(of: Data("\r\n\r\n".utf8)) != nil {
        self.handle(request, connection: connection)
        return
      }
      if isComplete || error != nil {
        self.send(status: "400 Bad Request", connection: connection)
        return
      }
      self.receiveRequest(connection, data: request)
    }
  }

  private func handle(_ data: Data, connection: NWConnection) {
    guard
      let request = String(data: data, encoding: .utf8),
      let firstLine = request.components(separatedBy: "\r\n").first
    else {
      send(status: "400 Bad Request", connection: connection)
      return
    }
    let parts = firstLine.split(separator: " ", omittingEmptySubsequences: false)
    guard
      parts.count == 3,
      parts[0] == "GET",
      parts[2] == "HTTP/1.1" || parts[2] == "HTTP/1.0",
      let components = URLComponents(string: "http://localhost\(parts[1])"),
      components.path == "/auth/callback"
    else {
      send(status: "404 Not Found", connection: connection)
      return
    }
    let items = components.queryItems ?? []
    let states = items.filter { $0.name == "state" }.compactMap(\.value)
    lock.lock()
    let expectedState = self.expectedState
    lock.unlock()
    guard
      states.count == 1,
      let state = states.first,
      state == expectedState
    else {
      send(status: "400 Bad Request", connection: connection)
      return
    }
    let errors = items.filter { $0.name == "error" }.compactMap(\.value)
    if errors.count == 1 {
      resolve(.failure(CodexConnectionFailure.authenticationFailed))
      redirect(state: state, connection: connection)
      return
    }
    let codes = items.filter { $0.name == "code" }.compactMap(\.value)
    guard
      codes.count == 1,
      let code = codes.first,
      codexIdentifier(code, maximumBytes: 2_048)
    else {
      send(status: "400 Bad Request", connection: connection)
      return
    }
    resolve(.success(code))
    redirect(state: state, connection: connection)
  }

  private func redirect(state: String, connection: NWConnection) {
    var callback = URLComponents()
    callback.scheme = "curiosity"
    callback.host = "oauth-complete"
    callback.queryItems = [URLQueryItem(name: "state", value: state)]
    guard let location = callback.url?.absoluteString else {
      send(status: "500 Internal Server Error", connection: connection)
      return
    }
    let response = [
      "HTTP/1.1 302 Found",
      "Location: \(location)",
      "Cache-Control: no-store",
      "Connection: close",
      "Content-Length: 0",
      "",
      "",
    ].joined(separator: "\r\n")
    connection.send(
      content: Data(response.utf8),
      contentContext: .finalMessage,
      isComplete: true,
      completion: .contentProcessed { [weak self, weak connection] _ in
        connection?.cancel()
        self?.listener.cancel()
      }
    )
  }

  private func send(status: String, connection: NWConnection) {
    let body = "Authentication callback rejected."
    let response = [
      "HTTP/1.1 \(status)",
      "Content-Type: text/plain; charset=utf-8",
      "Cache-Control: no-store",
      "Connection: close",
      "Content-Length: \(body.utf8.count)",
      "",
      body,
    ].joined(separator: "\r\n")
    connection.send(
      content: Data(response.utf8),
      contentContext: .finalMessage,
      isComplete: true,
      completion: .contentProcessed { [weak connection] _ in connection?.cancel() }
    )
  }

  private func resolve(_ result: Result<String, Error>) {
    lock.lock()
    guard callbackResult == nil else {
      lock.unlock()
      return
    }
    callbackResult = result
    let continuation = callbackContinuation
    callbackContinuation = nil
    lock.unlock()
    continuation?.resume(with: result)
  }
}
