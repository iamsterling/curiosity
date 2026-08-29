import Foundation

actor NativeDocumentStore {
  private static let rootId = "app-documents-v1"
  private static let maximumSearchBytes = 1_048_576

  func list(maxResults: Int) async throws -> NativeDocumentOutput {
    let entries = try documentEntries(limit: maxResults + 1)
    try Task.checkCancellation()
    let documents = try entries.prefix(maxResults).map(descriptor)
    return .list(
      documents: documents,
      rootId: Self.rootId,
      truncated: entries.count > maxResults
    )
  }

  func read(documentId: String, maxBytes: Int) async throws -> NativeDocumentOutput {
    let url = try documentURL(documentId)
    let data = try coordinatedData(url, maxBytes: maxBytes)
    try Task.checkCancellation()
    guard let content = String(data: data, encoding: .utf8) else {
      throw NativeDocumentFailure.notUTF8
    }
    return .read(
      byteCount: data.count,
      content: content,
      contentDigest: nativeSHA256(content),
      documentId: documentId,
      rootId: Self.rootId
    )
  }

  func search(
    query: String,
    maxResults: Int,
    maxFiles: Int,
    maxBytesPerFile: Int
  ) async throws -> NativeDocumentOutput {
    let entries = try documentEntries(limit: maxFiles + 1)
    var bytesRead = 0
    var filesScanned = 0
    var matches: [NativeDocumentMatch] = []
    var truncated = entries.count > maxFiles
    for url in entries.prefix(maxFiles) {
      try Task.checkCancellation()
      guard let data = try? coordinatedData(url, maxBytes: maxBytesPerFile) else {
        truncated = true
        continue
      }
      if bytesRead + data.count > Self.maximumSearchBytes {
        truncated = true
        break
      }
      bytesRead += data.count
      filesScanned += 1
      guard let content = String(data: data, encoding: .utf8) else { continue }
      let documentId = try relativeDocumentId(url)
      for (index, line) in content.split(
        separator: "\n",
        omittingEmptySubsequences: false
      ).enumerated() where line.range(
        of: query,
        options: [.caseInsensitive, .diacriticInsensitive]
      ) != nil {
        matches.append(
          NativeDocumentMatch(
            documentId: documentId,
            excerpt: String(line.prefix(512)),
            line: index + 1
          )
        )
        if matches.count == maxResults {
          truncated = true
          break
        }
      }
      if matches.count == maxResults { break }
    }
    return .search(
      filesScanned: filesScanned,
      matches: matches,
      rootId: Self.rootId,
      truncated: truncated
    )
  }

  private func documentEntries(limit: Int) throws -> [URL] {
    let root = try rootURL()
    let keys: [URLResourceKey] = [
      .fileSizeKey,
      .isRegularFileKey,
      .isSymbolicLinkKey,
      .contentModificationDateKey,
    ]
    guard let enumerator = FileManager.default.enumerator(
      at: root,
      includingPropertiesForKeys: keys,
      options: [.skipsHiddenFiles, .skipsPackageDescendants]
    ) else { throw NativeDocumentFailure.readFailed }
    var result: [URL] = []
    for case let url as URL in enumerator {
      let values = try url.resourceValues(forKeys: Set(keys))
      if values.isSymbolicLink == true {
        enumerator.skipDescendants()
        continue
      }
      guard values.isRegularFile == true else { continue }
      result.append(url)
      if result.count == limit { break }
    }
    return result.sorted { left, right in
      left.path.compare(right.path, options: .literal) == .orderedAscending
    }
  }

  private func descriptor(_ url: URL) throws -> NativeDocumentDescriptor {
    let values = try url.resourceValues(forKeys: [
      .contentModificationDateKey,
      .fileSizeKey,
    ])
    return NativeDocumentDescriptor(
      byteCount: values.fileSize ?? 0,
      documentId: try relativeDocumentId(url),
      modifiedAt: values.contentModificationDate.map(iso8601),
      name: url.lastPathComponent
    )
  }

  private func rootURL() throws -> URL {
    let root = try FileManager.default.url(
      for: .documentDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    )
    return root.standardizedFileURL
  }

  private func documentURL(_ documentId: String) throws -> URL {
    let root = try rootURL()
    var candidate = root
    for component in documentId.split(separator: "/") {
      candidate.appendPathComponent(String(component), isDirectory: false)
      let values = try candidate.resourceValues(forKeys: [
        .isRegularFileKey,
        .isSymbolicLinkKey,
      ])
      if values.isSymbolicLink == true { throw NativeDocumentFailure.pathUnsafe }
    }
    let standardized = candidate.standardizedFileURL
    guard standardized.path.hasPrefix(root.path + "/") else {
      throw NativeDocumentFailure.pathUnsafe
    }
    let values = try standardized.resourceValues(forKeys: [.isRegularFileKey])
    guard values.isRegularFile == true else {
      throw NativeDocumentFailure.documentNotFound
    }
    return standardized
  }

  private func relativeDocumentId(_ url: URL) throws -> String {
    let rootPath = try rootURL().path + "/"
    guard url.standardizedFileURL.path.hasPrefix(rootPath) else {
      throw NativeDocumentFailure.pathUnsafe
    }
    return String(url.standardizedFileURL.path.dropFirst(rootPath.count))
  }

  private func coordinatedData(_ url: URL, maxBytes: Int) throws -> Data {
    let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
    guard size <= maxBytes else { throw NativeDocumentFailure.tooLarge }
    var coordinationError: NSError?
    var outcome: Result<Data, Error>?
    NSFileCoordinator().coordinate(
      readingItemAt: url,
      options: .withoutChanges,
      error: &coordinationError
    ) { coordinatedURL in
      outcome = Result { try Data(contentsOf: coordinatedURL, options: .mappedIfSafe) }
    }
    if coordinationError != nil { throw NativeDocumentFailure.readFailed }
    guard let outcome else { throw NativeDocumentFailure.readFailed }
    let data: Data
    do {
      data = try outcome.get()
    } catch {
      throw NativeDocumentFailure.readFailed
    }
    guard data.count <= maxBytes else { throw NativeDocumentFailure.tooLarge }
    return data
  }

  private func iso8601(_ date: Date) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter.string(from: date)
  }
}
