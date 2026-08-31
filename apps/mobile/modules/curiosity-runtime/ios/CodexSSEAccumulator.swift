import Foundation

struct CodexSSEFailure: Error {
  let diagnostic: String
}

struct CodexSSEAccumulator {
  private(set) var text = ""
  private(set) var completed = false
  private(set) var pendingDelta: String?
  private var dataLines: [String] = []
  private var lineBytes = Data()
  private var totalBytes = 0
  private let maximumBodyBytes = 8 * 1_024 * 1_024
  private let maximumTextBytes: Int

  init(maximumTextBytes: Int) {
    self.maximumTextBytes = maximumTextBytes
  }

  mutating func consume(byte: UInt8) throws {
    totalBytes += 1
    guard totalBytes <= maximumBodyBytes else {
      throw CodexConnectionFailure.responseInvalid
    }
    guard byte == 0x0a else {
      guard lineBytes.count < 1 * 1_024 * 1_024 else {
        throw CodexConnectionFailure.responseInvalid
      }
      lineBytes.append(byte)
      return
    }
    try consumeBufferedLine()
  }

  mutating func finish() throws {
    if !lineBytes.isEmpty { try consumeBufferedLine() }
    if !dataLines.isEmpty { try consumeEvent() }
    guard completed, !text.isEmpty else {
      throw CodexSSEFailure(
        diagnostic: "stream:missing-completion:output=\(text.isEmpty ? "none" : "partial")"
      )
    }
  }

  private mutating func consumeBufferedLine() throws {
    if lineBytes.last == 0x0d { lineBytes.removeLast() }
    guard let line = String(data: lineBytes, encoding: .utf8) else {
      throw CodexConnectionFailure.responseInvalid
    }
    lineBytes.removeAll(keepingCapacity: true)
    if line.isEmpty {
      try consumeEvent()
      return
    }
    if line.hasPrefix("data:") {
      dataLines.append(
        String(line.dropFirst(5))
          .trimmingCharacters(in: .whitespacesAndNewlines)
      )
    }
  }

  private mutating func consumeEvent() throws {
    let lineCount = dataLines.count
    let data = dataLines.joined(separator: "\n")
    dataLines.removeAll(keepingCapacity: true)
    guard !data.isEmpty, data != "[DONE]" else { return }
    let decoded: Any
    do {
      decoded = try JSONSerialization.jsonObject(with: Data(data.utf8))
    } catch {
      let scalars = data.unicodeScalars
      let first = scalars.first?.value ?? 0
      let last = scalars.last?.value ?? 0
      let code = (error as NSError).code
      throw CodexSSEFailure(
        diagnostic: "json:bytes=\(data.utf8.count):lines=\(lineCount):first=\(first):last=\(last):code=\(code)"
      )
    }
    guard let value = decoded as? [String: Any] else {
      throw CodexSSEFailure(
        diagnostic: "json-shape:bytes=\(data.utf8.count):lines=\(lineCount)"
      )
    }
    let type = value["type"] as? String
    if type == "response.output_text.delta", let delta = value["delta"] as? String {
      try append(delta)
      pendingDelta = delta
      return
    }
    if type == "response.completed" {
      if text.isEmpty, let response = value["response"] as? [String: Any] {
        try append(outputText(response))
      }
      completed = true
      return
    }
    if [
      "error", "response.failed", "response.cancelled", "response.canceled",
      "response.incomplete",
    ].contains(type) {
      throw CodexSSEFailure(diagnostic: "stream:\(type ?? "unknown-terminal")")
    }
  }

  mutating func takeDelta() -> String? {
    defer { pendingDelta = nil }
    return pendingDelta
  }

  private mutating func append(_ value: String) throws {
    guard text.utf8.count + value.utf8.count <= maximumTextBytes else {
      throw CodexConnectionFailure.responseInvalid
    }
    text.append(value)
  }

  private func outputText(_ response: [String: Any]) -> String {
    guard let output = response["output"] as? [[String: Any]] else { return "" }
    return output.compactMap { item -> String? in
      guard let content = item["content"] as? [[String: Any]] else { return nil }
      return content.compactMap { part in
        part["type"] as? String == "output_text" ? part["text"] as? String : nil
      }.joined()
    }.joined()
  }
}
