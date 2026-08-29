import Foundation

actor NativeDocumentHost {
  private let journalHost: NativeJournalHost
  private let store = NativeDocumentStore()
  private var pendingCancellations: Set<String> = []
  private var tools: [String: Task<NativeDocumentReceipt, Error>] = [:]

  init(journalHost: NativeJournalHost) {
    self.journalHost = journalHost
  }

  func execute(
    _ request: ValidatedNativeDocumentRequest
  ) async throws -> NativeDocumentReceipt {
    let callId = request.grant.callId
    guard tools[callId] == nil else {
      throw NativeDocumentFailure.dispatchReplay
    }
    if pendingCancellations.remove(callId) != nil {
      throw NativeDocumentFailure.actionCancelled
    }
    let task = Task<NativeDocumentReceipt, Error> {
      try await perform(request)
    }
    tools[callId] = task
    defer { tools.removeValue(forKey: callId) }
    do {
      return try await task.value
    } catch is CancellationError {
      throw NativeDocumentFailure.actionCancelled
    }
  }

  func cancel(callId: String) {
    if let tool = tools[callId] {
      tool.cancel()
      return
    }
    if pendingCancellations.count < 64 {
      pendingCancellations.insert(callId)
    }
  }

  func cancelAll() {
    for tool in tools.values { tool.cancel() }
  }

  private func perform(
    _ request: ValidatedNativeDocumentRequest
  ) async throws -> NativeDocumentReceipt {
    try Task.checkCancellation()
    guard request.grant.deadlineAt > Date() else {
      throw NativeDocumentFailure.actionGrantStale
    }
    let disposition = try await journalHost.authorizeToolDispatch(request.grant)
    guard disposition == "authorized" else {
      if disposition == "duplicate" {
        throw NativeDocumentFailure.dispatchReplay
      }
      throw NativeDocumentFailure.dispatchDenied
    }
    try Task.checkCancellation()
    guard request.grant.deadlineAt > Date() else {
      throw NativeDocumentFailure.actionGrantStale
    }
    let output: NativeDocumentOutput
    switch request.input {
    case let .list(_, maxResults):
      output = try await store.list(maxResults: maxResults)
    case let .read(_, documentId, maxBytes):
      output = try await store.read(documentId: documentId, maxBytes: maxBytes)
    case let .search(_, query, maxResults, maxFiles, maxBytesPerFile):
      output = try await store.search(
        query: query,
        maxResults: maxResults,
        maxFiles: maxFiles,
        maxBytesPerFile: maxBytesPerFile
      )
    }
    try Task.checkCancellation()
    return NativeDocumentReceipt(
      actionId: request.grant.actionId,
      attemptId: request.grant.attemptId,
      callId: request.grant.callId,
      generation: request.grant.generation,
      grantId: request.grant.grantId,
      inputDigest: request.grant.inputDigest,
      output: output,
      toolId: request.grant.toolId,
      toolVersion: request.grant.toolVersion
    )
  }
}
