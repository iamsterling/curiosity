import Foundation

enum NativeJournalFailure: String, Error {
  case abiUnsupported = "NATIVE_JOURNAL_ABI_UNSUPPORTED"
  case commandDigestConflict = "COMMAND_DIGEST_CONFLICT"
  case integrityInvalid = "EVENT_HASH_CHAIN_INVALID"
  case identityConflict = "NATIVE_AGENT_IDENTITY_CONFLICT"
  case recordNotFound = "NATIVE_AGENT_RECORD_NOT_FOUND"
  case revisionFenced = "NATIVE_AGENT_REVISION_FENCED"
  case requestInvalid = "NATIVE_JOURNAL_REQUEST_INVALID"
  case responseInvalid = "NATIVE_JOURNAL_RESPONSE_INVALID"
  case responseTooLarge = "NATIVE_JOURNAL_RESPONSE_TOO_LARGE"
  case schemaUnsupported = "EVENT_SCHEMA_VERSION_UNSUPPORTED"
  case storageProtectionFailed = "NATIVE_JOURNAL_STORAGE_PROTECTION_FAILED"
  case storageUnavailable = "NATIVE_JOURNAL_STORAGE_UNAVAILABLE"
  case transactionFailed = "NATIVE_JOURNAL_TRANSACTION_FAILED"
}

actor NativeJournalHost {
  private static let agentABIVersion: UInt32 = 2
  private static let eventABIVersion: UInt32 = 1
  private static let maximumResponseBytes = 16 * 1_024 * 1_024
  private static let maximumRequestBytes = 1_024 * 1_024

  private var catalogDigest: String?
  private var databaseURL: URL?

  func open(catalogDigest: String) throws -> [String: Int] {
    guard curiosity_journal_abi_version() >= Self.eventABIVersion else {
      throw NativeJournalFailure.abiUnsupported
    }
    let root = try journalDirectory()
    let databaseURL = root.appendingPathComponent(
      "authority-v15.sqlite3",
      isDirectory: false
    )
    let response = try call([
      "abiVersion": Int(Self.eventABIVersion),
      "catalogDigest": catalogDigest,
      "databasePath": databaseURL.path,
      "operation": "open",
    ])
    try protect(databaseURL)
    guard
      let result = response as? [String: Any],
      let abiVersion = result["abiVersion"] as? Int,
      let schemaVersion = result["schemaVersion"] as? Int
    else { throw NativeJournalFailure.responseInvalid }
    self.catalogDigest = catalogDigest
    self.databaseURL = databaseURL
    return [
      "abiVersion": abiVersion,
      "schemaVersion": schemaVersion,
    ]
  }

  func read(afterSequence: Int, limit: Int) throws -> String {
    let context = try openedContext()
    let response = try call([
      "abiVersion": Int(Self.eventABIVersion),
      "afterSequence": afterSequence,
      "catalogDigest": context.catalogDigest,
      "databasePath": context.databaseURL.path,
      "limit": limit,
      "operation": "readEvents",
    ])
    return try jsonString(response)
  }

  func admit(inputJSON: String) throws -> String {
    guard
      let data = inputJSON.data(using: .utf8),
      data.count <= Self.maximumRequestBytes,
      let admission = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { throw NativeJournalFailure.requestInvalid }
    let context = try openedContext()
    let response = try call([
      "abiVersion": Int(Self.eventABIVersion),
      "admission": admission,
      "catalogDigest": context.catalogDigest,
      "databasePath": context.databaseURL.path,
      "operation": "admit",
    ])
    return try jsonString(response)
  }

  func agentCall(inputJSON: String) throws -> String {
    guard curiosity_journal_abi_version() >= Self.agentABIVersion else {
      throw NativeJournalFailure.abiUnsupported
    }
    guard
      let data = inputJSON.data(using: .utf8),
      data.count <= Self.maximumRequestBytes,
      var input = try JSONSerialization.jsonObject(with: data) as? [String: Any],
      let operation = input["operation"] as? String,
      [
        "armDispatch",
        "commitTransition",
        "readRunProjection",
        "reconcileInterrupted",
        "runnableRuns",
        "settleAttempt",
        "startRun",
      ].contains(operation),
      input["abiVersion"] == nil,
      input["catalogDigest"] == nil,
      input["databasePath"] == nil
    else { throw NativeJournalFailure.requestInvalid }
    let context = try openedContext()
    input["abiVersion"] = Int(Self.agentABIVersion)
    input["catalogDigest"] = context.catalogDigest
    input["databasePath"] = context.databaseURL.path
    return try jsonString(call(input))
  }

  func authorizeToolDispatch(
    _ grant: ValidatedNativeActionGrant
  ) throws -> String {
    guard curiosity_journal_abi_version() >= Self.agentABIVersion else {
      throw NativeJournalFailure.abiUnsupported
    }
    let context = try openedContext()
    guard context.catalogDigest == grant.catalogDigest else {
      throw NativeJournalFailure.revisionFenced
    }
    let input: [String: Any] = [
      "dispatch": [
        "actionId": grant.actionId,
        "attemptId": grant.attemptId,
        "authorizedAt": currentTimestamp(),
        "callId": grant.callId,
        "generation": grant.generation,
        "kind": "tool",
        "phase": "authorize",
        "requestDigest": grant.requestDigest,
      ],
      "operation": "armDispatch",
    ]
    let response = try callAgentObject(input)
    guard
      let value = response as? [String: Any],
      value["actionId"] as? String == grant.actionId,
      value["attemptId"] as? String == grant.attemptId,
      value["callId"] as? String == grant.callId,
      value["generation"] as? Int == grant.generation,
      let disposition = value["disposition"] as? String
    else { throw NativeJournalFailure.responseInvalid }
    return disposition
  }

  private func openedContext() throws -> (
    catalogDigest: String,
    databaseURL: URL
  ) {
    guard let catalogDigest, let databaseURL else {
      throw NativeJournalFailure.storageUnavailable
    }
    return (catalogDigest, databaseURL)
  }

  private func callAgentObject(_ input: [String: Any]) throws -> Any {
    var request = input
    let context = try openedContext()
    request["abiVersion"] = Int(Self.agentABIVersion)
    request["catalogDigest"] = context.catalogDigest
    request["databasePath"] = context.databaseURL.path
    return try call(request)
  }

  private func currentTimestamp() -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter.string(from: Date())
  }

  private func call(_ request: [String: Any]) throws -> Any {
    let input = try JSONSerialization.data(
      withJSONObject: request,
      options: [.sortedKeys, .withoutEscapingSlashes]
    )
    guard input.count <= Self.maximumRequestBytes else {
      throw NativeJournalFailure.requestInvalid
    }
    let outputCapacity = Self.maximumResponseBytes
    var output = [UInt8](
      repeating: 0,
      count: outputCapacity
    )
    let length = input.withUnsafeBytes { inputBytes in
      output.withUnsafeMutableBytes { outputBytes in
        curiosity_journal_call(
          inputBytes.bindMemory(to: UInt8.self).baseAddress,
          input.count,
          outputBytes.bindMemory(to: UInt8.self).baseAddress,
          outputCapacity
        )
      }
    }
    guard length >= 0 else { throw failure(for: length) }
    guard length <= output.count else {
      throw NativeJournalFailure.responseTooLarge
    }
    return try JSONSerialization.jsonObject(
      with: Data(output.prefix(Int(length)))
    )
  }

  private func failure(for code: Int64) -> NativeJournalFailure {
    switch code {
    case -1: return .requestInvalid
    case -2: return .responseTooLarge
    case -3: return .storageUnavailable
    case -4: return .abiUnsupported
    case -5: return .schemaUnsupported
    case -6: return .integrityInvalid
    case -7: return .commandDigestConflict
    case -9: return .revisionFenced
    case -10: return .identityConflict
    case -11: return .recordNotFound
    default: return .transactionFailed
    }
  }

  private func jsonString(_ value: Any) throws -> String {
    let data = try JSONSerialization.data(
      withJSONObject: value,
      options: [.sortedKeys, .withoutEscapingSlashes]
    )
    guard let result = String(data: data, encoding: .utf8) else {
      throw NativeJournalFailure.responseInvalid
    }
    return result
  }

  private func journalDirectory() throws -> URL {
    let fileManager = FileManager.default
    let applicationSupport = try fileManager.url(
      for: .applicationSupportDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    )
    let root = applicationSupport.appendingPathComponent(
      "CuriosityAuthority",
      isDirectory: true
    )
    do {
      try fileManager.createDirectory(
        at: root,
        withIntermediateDirectories: true,
        attributes: nil
      )
      try fileManager.setAttributes(
        [
          .protectionKey: FileProtectionType.completeUntilFirstUserAuthentication,
        ],
        ofItemAtPath: root.path
      )
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      var mutableRoot = root
      try mutableRoot.setResourceValues(values)
      return root
    } catch {
      throw NativeJournalFailure.storageProtectionFailed
    }
  }

  private func protect(_ databaseURL: URL) throws {
    do {
      try FileManager.default.setAttributes(
        [
          .protectionKey: FileProtectionType.completeUntilFirstUserAuthentication,
        ],
        ofItemAtPath: databaseURL.path
      )
    } catch {
      throw NativeJournalFailure.storageProtectionFailed
    }
  }
}
