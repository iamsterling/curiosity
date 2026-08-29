import Foundation

func nativeDocumentReceiptRecord(
  _ receipt: NativeDocumentReceipt
) -> [String: Any] {
  [
    "actionId": receipt.actionId,
    "attemptId": receipt.attemptId,
    "callId": receipt.callId,
    "generation": receipt.generation,
    "grantId": receipt.grantId,
    "inputDigest": receipt.inputDigest,
    "output": nativeDocumentOutputRecord(receipt.output),
    "toolId": receipt.toolId,
    "toolVersion": receipt.toolVersion,
  ]
}

private func nativeDocumentOutputRecord(
  _ output: NativeDocumentOutput
) -> [String: Any] {
  switch output {
  case let .list(documents, rootId, truncated):
    return [
      "documents": documents.map { document in
        var value: [String: Any] = [
          "byteCount": document.byteCount,
          "documentId": document.documentId,
          "name": document.name,
        ]
        if let modifiedAt = document.modifiedAt {
          value["modifiedAt"] = modifiedAt
        }
        return value
      },
      "kind": "list",
      "provenance": "untrusted-evidence",
      "rootId": rootId,
      "truncated": truncated,
    ]
  case let .read(byteCount, content, contentDigest, documentId, rootId):
    return [
      "byteCount": byteCount,
      "content": content,
      "contentDigest": contentDigest,
      "documentId": documentId,
      "kind": "read",
      "provenance": "untrusted-evidence",
      "rootId": rootId,
    ]
  case let .search(filesScanned, matches, rootId, truncated):
    return [
      "filesScanned": filesScanned,
      "kind": "search",
      "matches": matches.map { match in
        [
          "documentId": match.documentId,
          "excerpt": match.excerpt,
          "line": match.line,
        ]
      },
      "provenance": "untrusted-evidence",
      "rootId": rootId,
      "truncated": truncated,
    ]
  }
}
