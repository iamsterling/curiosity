import AuthenticationServices
import Foundation
import UIKit

@MainActor
final class CodexAuthenticationPresenter: NSObject, ASWebAuthenticationPresentationContextProviding {
  private var session: ASWebAuthenticationSession?

  func open(_ url: URL, expectedState: String) async throws {
    guard session == nil else { throw CodexConnectionFailure.authenticationFailed }
    try await withCheckedThrowingContinuation {
      (continuation: CheckedContinuation<Void, Error>) in
      let session = ASWebAuthenticationSession(
        url: url,
        callbackURLScheme: "curiosity"
      ) { [weak self] callback, error in
        Task { @MainActor in
          self?.session = nil
          if let authenticationError = error as? ASWebAuthenticationSessionError,
            authenticationError.code == .canceledLogin
          {
            continuation.resume(throwing: CodexConnectionFailure.authenticationCancelled)
            return
          }
          guard error == nil, let callback, validCallback(callback, state: expectedState) else {
            continuation.resume(throwing: CodexConnectionFailure.authenticationFailed)
            return
          }
          continuation.resume()
        }
      }
      session.presentationContextProvider = self
      session.prefersEphemeralWebBrowserSession = false
      self.session = session
      guard session.start() else {
        self.session = nil
        continuation.resume(throwing: CodexConnectionFailure.authenticationFailed)
        return
      }
    }
  }

  func presentationAnchor(for _: ASWebAuthenticationSession) -> ASPresentationAnchor {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
    return scene?.windows.first { $0.isKeyWindow } ?? ASPresentationAnchor()
  }
}

private func validCallback(_ callback: URL, state: String) -> Bool {
  guard callback.scheme == "curiosity", callback.host == "oauth-complete" else {
    return false
  }
  let states = URLComponents(url: callback, resolvingAgainstBaseURL: false)?
    .queryItems?.filter { $0.name == "state" }.compactMap(\.value)
  return states == [state]
}
