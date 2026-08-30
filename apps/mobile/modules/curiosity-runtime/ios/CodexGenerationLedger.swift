import CryptoKit
import Foundation

enum CodexGenerationAllocation {
  case completed(CodexGenerationResult)
  case dispatch
}

final class CodexGenerationLedger {
  private struct Entry: Codable {
    let maxRetries: Int
    let requestDigest: String
    let result: CodexGenerationResult?
    let state: String
    let updatedAt: TimeInterval
  }

  private let fileURL: URL
  private var entries: [String: Entry]?

  init(fileManager: FileManager = .default) {
    let base = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    let directory = base.appendingPathComponent("Curiosity", isDirectory: true)
    try? fileManager.createDirectory(
      at: directory,
      withIntermediateDirectories: true,
      attributes: [.protectionKey: FileProtectionType.complete]
    )
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    var protectedDirectory = directory
    try? protectedDirectory.setResourceValues(values)
    fileURL = directory.appendingPathComponent("CodexGenerationLedger-v1.json")
  }

  func allocate(_ request: CodexGenerationRequest) throws -> CodexGenerationAllocation {
    try load()
    let digest = try requestDigest(request)
    if let existing = entries?[request.callId] {
      guard existing.requestDigest == digest else {
        throw CodexConnectionFailure.generationInvalid
      }
      if existing.state == "completed", let result = existing.result {
        return .completed(result)
      }
      throw CodexConnectionFailure.deliveryUnknown
    }
    entries?[request.callId] = Entry(
      maxRetries: 0,
      requestDigest: digest,
      result: nil,
      state: "allocated",
      updatedAt: Date().timeIntervalSince1970
    )
    try persist()
    return .dispatch
  }

  func complete(_ request: CodexGenerationRequest, result: CodexGenerationResult) throws {
    try load()
    let digest = try requestDigest(request)
    guard entries?[request.callId]?.requestDigest == digest else {
      throw CodexConnectionFailure.generationInvalid
    }
    entries?[request.callId] = Entry(
      maxRetries: 0,
      requestDigest: digest,
      result: result,
      state: "completed",
      updatedAt: Date().timeIntervalSince1970
    )
    try persist()
  }

  private func load() throws {
    guard entries == nil else { return }
    guard FileManager.default.fileExists(atPath: fileURL.path) else {
      entries = [:]
      return
    }
    let data = try Data(contentsOf: fileURL, options: .mappedIfSafe)
    guard data.count <= 16 * 1_024 * 1_024 else {
      throw CodexConnectionFailure.generationFailed
    }
    do {
      entries = try JSONDecoder().decode([String: Entry].self, from: data)
    } catch {
      throw CodexConnectionFailure.generationFailed
    }
  }

  private func persist() throws {
    guard var entries else { throw CodexConnectionFailure.generationFailed }
    if entries.count > 32 {
      for entry in entries.sorted(by: { $0.value.updatedAt < $1.value.updatedAt })
        .prefix(entries.count - 32)
      {
        entries.removeValue(forKey: entry.key)
      }
      self.entries = entries
    }
    let data = try JSONEncoder().encode(entries)
    guard data.count <= 16 * 1_024 * 1_024 else {
      throw CodexConnectionFailure.generationFailed
    }
    try data.write(to: fileURL, options: [.atomic, .completeFileProtection])
  }

  private func requestDigest(_ request: CodexGenerationRequest) throws -> String {
    let data = try JSONSerialization.data(
      withJSONObject: [
        "callId": request.callId,
        "maximumOutputTokens": request.maximumOutputTokens,
        "modelId": request.modelId,
        "prompt": request.prompt,
        "providerId": "openai-oauth",
      ],
      options: [.sortedKeys]
    )
    return SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
  }
}
