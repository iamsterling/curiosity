import ExpoModulesCore
import Foundation

private let generationDeltaEvent = "onGenerationDelta"

public final class CuriosityRuntimeModule: Module {
  private let modelHost = FoundationModelHost()
  private let agentStepHost = AgentStepHost()
  private let memoryCuratorHost = MemoryCuratorHost()
  private let journalHost = NativeJournalHost()
  private lazy var documentHost = NativeDocumentHost(journalHost: journalHost)

  public func definition() -> ModuleDefinition {
    Name("CuriosityRuntime")
    Events(generationDeltaEvent)

    OnCreate {
      #if DEBUG
      let arguments = ProcessInfo.processInfo.arguments
      if arguments.contains("--curiosity-agent-step-fixtures") {
        Task<Void, Never> {
          await runAgentStepDiagnostics(host: self.agentStepHost)
        }
      }
      if arguments.contains("--curiosity-document-tool-fixtures") {
        Task<Void, Never> {
          await runNativeDocumentDiagnostics(
            journalHost: self.journalHost,
            documentHost: self.documentHost
          )
        }
      }
      #endif
    }

    AsyncFunction("foundationModelStatus") { (promise: Promise) in
      Task<Void, Never> {
        promise.resolve(await self.modelHost.status())
      }
    }

    AsyncFunction("agentStep") { (input: AgentStepRecord, promise: Promise) in
      Task<Void, Never> {
        do {
          let request = try validateAgentStepRecord(input)
          let result = try await self.agentStepHost.step(request)
          promise.resolve(try agentStepResultRecord(result))
        } catch let failure as AgentStepFailure {
          promise.reject(failure.rawValue, failure.rawValue)
        } catch let failure as FoundationModelFailure {
          promise.reject(failure.rawValue, failure.rawValue)
        } catch {
          promise.reject(
            FoundationModelFailure.generationFailed.rawValue,
            FoundationModelFailure.generationFailed.rawValue
          )
        }
      }
    }

    AsyncFunction("cancelAgentStep") { (stepId: String, promise: Promise) in
      Task<Void, Never> {
        await self.agentStepHost.cancel(stepId: stepId)
        promise.resolve()
      }
    }

    AsyncFunction("generate") {
      (input: FoundationModelGenerationRecord, promise: Promise) in
      Task<Void, Never> {
        do {
          let request = try validateFoundationModelGenerationRecord(input)
          let result = try await self.modelHost.generate(request) {
            [weak self] turnId, delta in
            self?.sendEvent(generationDeltaEvent, [
              "delta": delta,
              "turnId": turnId,
            ])
          }
          promise.resolve([
            "durationMs": result.durationMs,
            "effort": result.effort,
            "modelId": result.modelId,
            "text": result.text,
          ])
        } catch let failure as FoundationModelFailure {
          promise.reject(failure.rawValue, failure.rawValue)
        } catch {
          promise.reject(
            FoundationModelFailure.generationFailed.rawValue,
            FoundationModelFailure.generationFailed.rawValue
          )
        }
      }
    }

    AsyncFunction("cancelGeneration") { (turnId: String, promise: Promise) in
      Task<Void, Never> {
        await self.modelHost.cancel(turnId: turnId)
        promise.resolve()
      }
    }

    AsyncFunction("curateMemory") {
      (input: MemoryCurationRecord, promise: Promise) in
      Task<Void, Never> {
        do {
          let request = try validateMemoryCurationRecord(input)
          let result = try await self.memoryCuratorHost.curate(request)
          promise.resolve(memoryCurationResultRecord(result))
        } catch let failure as MemoryCuratorFailure {
          promise.reject(failure.rawValue, failure.rawValue)
        } catch let failure as FoundationModelFailure {
          promise.reject(failure.rawValue, failure.rawValue)
        } catch {
          promise.reject(
            MemoryCuratorFailure.generationFailed.rawValue,
            MemoryCuratorFailure.generationFailed.rawValue
          )
        }
      }
    }

    AsyncFunction("cancelMemoryCuration") { (jobId: String, promise: Promise) in
      Task<Void, Never> {
        await self.memoryCuratorHost.cancel(jobId: jobId)
        promise.resolve()
      }
    }

    AsyncFunction("executeDocumentTool") {
      (input: NativeDocumentRequestRecord, promise: Promise) in
      Task<Void, Never> {
        do {
          let request = try validateNativeDocumentRequest(input)
          let receipt = try await self.documentHost.execute(request)
          promise.resolve(nativeDocumentReceiptRecord(receipt))
        } catch let failure as NativeDocumentFailure {
          promise.reject(failure.rawValue, failure.rawValue)
        } catch let failure as NativeJournalFailure {
          promise.reject(failure.rawValue, failure.rawValue)
        } catch is CancellationError {
          promise.reject(
            NativeDocumentFailure.actionCancelled.rawValue,
            NativeDocumentFailure.actionCancelled.rawValue
          )
        } catch {
          promise.reject(
            NativeDocumentFailure.readFailed.rawValue,
            NativeDocumentFailure.readFailed.rawValue
          )
        }
      }
    }

    AsyncFunction("cancelDocumentTool") { (callId: String, promise: Promise) in
      Task<Void, Never> {
        await self.documentHost.cancel(callId: callId)
        promise.resolve()
      }
    }

    AsyncFunction("journalOpen") {
      (catalogDigest: String, promise: Promise) in
      Task<Void, Never> {
        await self.resolveJournal(promise) {
          try await self.journalHost.open(catalogDigest: catalogDigest)
        }
      }
    }

    AsyncFunction("journalRead") {
      (afterSequence: Int, limit: Int, promise: Promise) in
      Task<Void, Never> {
        await self.resolveJournal(promise) {
          try await self.journalHost.read(
            afterSequence: afterSequence,
            limit: limit
          )
        }
      }
    }

    AsyncFunction("journalAdmit") { (inputJSON: String, promise: Promise) in
      Task<Void, Never> {
        await self.resolveJournal(promise) {
          try await self.journalHost.admit(inputJSON: inputJSON)
        }
      }
    }

    AsyncFunction("agentJournalCall") { (inputJSON: String, promise: Promise) in
      Task<Void, Never> {
        await self.resolveJournal(promise) {
          try await self.journalHost.agentCall(inputJSON: inputJSON)
        }
      }
    }

    OnAppEntersBackground {
      Task<Void, Never> { await self.cancelAllGenerations() }
    }

    OnDestroy {
      Task<Void, Never> { await self.cancelAllGenerations() }
    }
  }

  private func cancelAllGenerations() async {
    await agentStepHost.cancelAll()
    await documentHost.cancelAll()
    await modelHost.cancelAll()
    await memoryCuratorHost.cancelAll()
  }

  private func resolveJournal<T: AnyArgument>(
    _ promise: Promise,
    operation: () async throws -> T
  ) async {
    do {
      promise.resolve(try await operation())
    } catch let failure as NativeJournalFailure {
      promise.reject(failure.rawValue, failure.rawValue)
    } catch {
      promise.reject(
        NativeJournalFailure.transactionFailed.rawValue,
        NativeJournalFailure.transactionFailed.rawValue
      )
    }
  }

}
