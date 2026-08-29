import Foundation

struct ValidatedNativeActionGrant: Sendable {
  let actionId: String
  let attemptId: String
  let callId: String
  let catalogDigest: String
  let deadlineAt: Date
  let executionId: String
  let generation: Int
  let grantId: String
  let inputDigest: String
  let requestDigest: String
  let requestedCapabilities: [String]
  let resource: String
  let toolId: String
  let toolVersion: String
}

enum NativeDocumentInput: Sendable {
  case list(rootId: String, maxResults: Int)
  case read(rootId: String, documentId: String, maxBytes: Int)
  case search(
    rootId: String,
    query: String,
    maxResults: Int,
    maxFiles: Int,
    maxBytesPerFile: Int
  )
}

struct ValidatedNativeDocumentRequest: Sendable {
  let grant: ValidatedNativeActionGrant
  let input: NativeDocumentInput
}

struct NativeDocumentDescriptor: Sendable {
  let byteCount: Int
  let documentId: String
  let modifiedAt: String?
  let name: String
}

struct NativeDocumentMatch: Sendable {
  let documentId: String
  let excerpt: String
  let line: Int
}

enum NativeDocumentOutput: Sendable {
  case list(documents: [NativeDocumentDescriptor], rootId: String, truncated: Bool)
  case read(
    byteCount: Int,
    content: String,
    contentDigest: String,
    documentId: String,
    rootId: String
  )
  case search(
    filesScanned: Int,
    matches: [NativeDocumentMatch],
    rootId: String,
    truncated: Bool
  )
}

struct NativeDocumentReceipt: Sendable {
  let actionId: String
  let attemptId: String
  let callId: String
  let generation: Int
  let grantId: String
  let inputDigest: String
  let output: NativeDocumentOutput
  let toolId: String
  let toolVersion: String
}

enum NativeDocumentFailure: String, Error {
  case actionGrantInvalid = "ACTION_GRANT_INVALID"
  case actionGrantStale = "ACTION_GRANT_STALE"
  case actionCancelled = "ACTION_CANCELLED"
  case dispatchDenied = "NATIVE_TOOL_DISPATCH_DENIED"
  case dispatchReplay = "NATIVE_TOOL_DISPATCH_REPLAY"
  case documentNotFound = "NATIVE_DOCUMENT_NOT_FOUND"
  case inputInvalid = "NATIVE_DOCUMENT_INPUT_INVALID"
  case notUTF8 = "NATIVE_DOCUMENT_NOT_UTF8"
  case pathUnsafe = "NATIVE_DOCUMENT_PATH_UNSAFE"
  case readFailed = "NATIVE_DOCUMENT_READ_FAILED"
  case rootMismatch = "NATIVE_DOCUMENT_ROOT_MISMATCH"
  case tooLarge = "NATIVE_DOCUMENT_TOO_LARGE"
}
