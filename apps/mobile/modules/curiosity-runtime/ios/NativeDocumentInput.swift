import Foundation

private let nativeDocumentRootId = "app-documents-v1"

func decodeNativeDocumentInput(
  _ input: [String: Any],
  grant: ValidatedNativeActionGrant
) throws -> NativeDocumentInput {
  switch grant.toolId {
  case "document.list":
    guard
      exactNativeDocumentKeys(input, ["maxResults", "rootId"]),
      input["rootId"] as? String == nativeDocumentRootId,
      grant.resource == "documents:\(nativeDocumentRootId)",
      let maxResults = strictNativeInteger(input["maxResults"]),
      (1 ... 128).contains(maxResults)
    else { throw NativeDocumentFailure.inputInvalid }
    return .list(rootId: nativeDocumentRootId, maxResults: maxResults)
  case "document.read":
    guard
      exactNativeDocumentKeys(
        input,
        ["documentId", "maxBytes", "rootId"]
      ),
      input["rootId"] as? String == nativeDocumentRootId,
      let documentId = input["documentId"] as? String,
      validNativeDocumentId(documentId),
      grant.resource == "document:\(documentId)",
      let maxBytes = strictNativeInteger(input["maxBytes"]),
      (1 ... 262_144).contains(maxBytes)
    else { throw NativeDocumentFailure.inputInvalid }
    return .read(
      rootId: nativeDocumentRootId,
      documentId: documentId,
      maxBytes: maxBytes
    )
  case "document.search":
    guard
      exactNativeDocumentKeys(
        input,
        ["maxBytesPerFile", "maxFiles", "maxResults", "query", "rootId"]
      ),
      input["rootId"] as? String == nativeDocumentRootId,
      grant.resource == "documents:\(nativeDocumentRootId)",
      let query = input["query"] as? String,
      !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
      query.utf8.count <= 256,
      let maxResults = strictNativeInteger(input["maxResults"]),
      (1 ... 64).contains(maxResults),
      let maxFiles = strictNativeInteger(input["maxFiles"]),
      (1 ... 128).contains(maxFiles),
      let maxBytes = strictNativeInteger(input["maxBytesPerFile"]),
      (1 ... 131_072).contains(maxBytes)
    else { throw NativeDocumentFailure.inputInvalid }
    return .search(
      rootId: nativeDocumentRootId,
      query: query,
      maxResults: maxResults,
      maxFiles: maxFiles,
      maxBytesPerFile: maxBytes
    )
  default:
    throw NativeDocumentFailure.inputInvalid
  }
}

private func strictNativeInteger(_ value: Any?) -> Int? {
  guard
    let number = value as? NSNumber,
    CFGetTypeID(number) != CFBooleanGetTypeID(),
    !CFNumberIsFloatType(number),
    number.int64Value >= Int64(Int.min),
    number.int64Value <= Int64(Int.max)
  else { return nil }
  return Int(number.int64Value)
}

private func exactNativeDocumentKeys(
  _ value: [String: Any],
  _ keys: Set<String>
) -> Bool {
  Set(value.keys) == keys
}

private func validNativeDocumentId(_ value: String) -> Bool {
  guard
    !value.isEmpty,
    value.utf8.count <= 512,
    !value.hasPrefix("/"),
    !value.contains("\\"),
    !value.unicodeScalars.contains(where: { $0.value == 0 })
  else { return false }
  let components = value.split(separator: "/", omittingEmptySubsequences: false)
  return components.allSatisfy { component in
    !component.isEmpty && component != "." && component != ".."
  }
}
