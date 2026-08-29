import CryptoKit
import ExpoModulesCore
import Foundation

struct NativeActionGateReceiptRecord: Record {
  @Field var gateId = ""
  @Field var payloadDigest = ""
  @Field var proposalRevision = 0
}

struct NativeActionGrantRecord: Record {
  @Field var actionId = ""
  @Field var attemptId = ""
  @Field var callId = ""
  @Field var catalogDigest = ""
  @Field var deadlineAt = ""
  @Field var executionId = ""
  @Field var gateReceipt: NativeActionGateReceiptRecord?
  @Field var generation = 0
  @Field var grantId = ""
  @Field var inputDigest = ""
  @Field var requestDigest = ""
  @Field var requestedCapabilities: [String] = []
  @Field var resource = ""
  @Field var schemaVersion = 0
  @Field var toolId = ""
  @Field var toolVersion = ""
}

struct NativeDocumentRequestRecord: Record {
  @Field var grant = NativeActionGrantRecord()
  @Field var inputJSON = ""
}

func validateNativeDocumentRequest(
  _ request: NativeDocumentRequestRecord
) throws -> ValidatedNativeDocumentRequest {
  guard
    request.inputJSON.utf8.count <= 256 * 1_024,
    let data = request.inputJSON.data(using: .utf8),
    let input = try JSONSerialization.jsonObject(with: data) as? [String: Any]
  else { throw NativeDocumentFailure.inputInvalid }
  let canonicalInput = try canonicalNativeJSON(input)
  let grant = try validateNativeActionGrant(request.grant, input: input)
  guard nativeSHA256(canonicalInput) == grant.inputDigest else {
    throw NativeDocumentFailure.actionGrantInvalid
  }
  let requestJSON = try canonicalNativeJSON([
    "input": input,
    "toolId": grant.toolId,
    "toolVersion": grant.toolVersion,
  ])
  guard nativeSHA256(requestJSON) == grant.requestDigest else {
    throw NativeDocumentFailure.actionGrantInvalid
  }
  return ValidatedNativeDocumentRequest(
    grant: grant,
    input: try decodeNativeDocumentInput(input, grant: grant)
  )
}

private func validateNativeActionGrant(
  _ grant: NativeActionGrantRecord,
  input: [String: Any]
) throws -> ValidatedNativeActionGrant {
  let capabilities = grant.requestedCapabilities
  guard
    grant.schemaVersion == 1,
    validNativeIdentifier(grant.actionId),
    validNativeIdentifier(grant.attemptId),
    validNativeIdentifier(grant.callId),
    validNativeDigest(grant.catalogDigest),
    validNativeIdentifier(grant.executionId),
    grant.generation >= 1,
    validNativeDigest(grant.grantId),
    validNativeDigest(grant.inputDigest),
    validNativeDigest(grant.requestDigest),
    capabilities.count <= 32,
    capabilities.allSatisfy(validNativeIdentifier),
    capabilities == capabilities.sorted(),
    Set(capabilities).count == capabilities.count,
    capabilities == ["documents.read"],
    !grant.resource.isEmpty,
    grant.resource.utf8.count <= 2_048,
    ["document.list", "document.read", "document.search"].contains(grant.toolId),
    grant.toolVersion == "1",
    let deadline = nativeTimestamp(grant.deadlineAt)
  else { throw NativeDocumentFailure.actionGrantInvalid }
  guard deadline > Date() else { throw NativeDocumentFailure.actionGrantStale }
  let base = try nativeActionGrantBase(grant, input: input)
  guard nativeSHA256(try canonicalNativeJSON(base)) == grant.grantId else {
    throw NativeDocumentFailure.actionGrantStale
  }
  return ValidatedNativeActionGrant(
    actionId: grant.actionId,
    attemptId: grant.attemptId,
    callId: grant.callId,
    catalogDigest: grant.catalogDigest,
    deadlineAt: deadline,
    executionId: grant.executionId,
    generation: grant.generation,
    grantId: grant.grantId,
    inputDigest: grant.inputDigest,
    requestDigest: grant.requestDigest,
    requestedCapabilities: capabilities,
    resource: grant.resource,
    toolId: grant.toolId,
    toolVersion: grant.toolVersion
  )
}

private func nativeActionGrantBase(
  _ grant: NativeActionGrantRecord,
  input _: [String: Any]
) throws -> [String: Any] {
  var base: [String: Any] = [
    "actionId": grant.actionId,
    "attemptId": grant.attemptId,
    "callId": grant.callId,
    "catalogDigest": grant.catalogDigest,
    "deadlineAt": grant.deadlineAt,
    "executionId": grant.executionId,
    "generation": grant.generation,
    "inputDigest": grant.inputDigest,
    "requestDigest": grant.requestDigest,
    "requestedCapabilities": grant.requestedCapabilities,
    "resource": grant.resource,
    "schemaVersion": grant.schemaVersion,
    "toolId": grant.toolId,
    "toolVersion": grant.toolVersion,
  ]
  if let gate = grant.gateReceipt {
    guard
      validNativeIdentifier(gate.gateId),
      validNativeDigest(gate.payloadDigest),
      gate.proposalRevision >= 1
    else { throw NativeDocumentFailure.actionGrantInvalid }
    base["gateReceipt"] = [
      "gateId": gate.gateId,
      "payloadDigest": gate.payloadDigest,
      "proposalRevision": gate.proposalRevision,
    ]
  }
  return base
}

func nativeSHA256(_ value: String) -> String {
  SHA256.hash(data: Data(value.utf8)).map { String(format: "%02x", $0) }.joined()
}

func canonicalNativeJSON(_ value: Any) throws -> String {
  guard JSONSerialization.isValidJSONObject(value) else {
    throw NativeDocumentFailure.inputInvalid
  }
  let data = try JSONSerialization.data(
    withJSONObject: value,
    options: [.sortedKeys, .withoutEscapingSlashes]
  )
  guard let json = String(data: data, encoding: .utf8) else {
    throw NativeDocumentFailure.inputInvalid
  }
  return json
}

private func nativeTimestamp(_ value: String) -> Date? {
  guard value.range(
    of: #"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$"#,
    options: .regularExpression
  ) != nil else { return nil }
  let formatter = ISO8601DateFormatter()
  formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
  if let date = formatter.date(from: value) { return date }
  formatter.formatOptions = [.withInternetDateTime]
  return formatter.date(from: value)
}
