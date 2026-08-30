import Foundation

enum CodexConnectionFailure: String, Error {
  case authenticationCancelled = "CODEX_AUTHENTICATION_CANCELLED"
  case authenticationFailed = "CODEX_AUTHENTICATION_FAILED"
  case deliveryUnknown = "CODEX_DELIVERY_UNKNOWN"
  case generationFailed = "CODEX_GENERATION_FAILED"
  case generationInvalid = "CODEX_GENERATION_INVALID"
  case generationRouteUnavailable = "CODEX_GENERATION_ROUTE_UNAVAILABLE"
  case requestFailed = "CODEX_REQUEST_FAILED"
  case responseInvalid = "CODEX_RESPONSE_INVALID"
  case sessionRequired = "CODEX_SESSION_REQUIRED"
}

enum CodexConnectionPolicy {
  static let authOrigin = URL(string: "https://auth.openai.com")!
  static let backendOrigin = URL(string: "https://chatgpt.com")!
  static let clientID = "app_EMoamEEZ73f0CkXaXp7hrann"
  static let clientVersion = "0.151.0"
  static let originator = "curiosity-ipad"

  static func authEndpoint(_ path: String) throws -> URL {
    try endpoint(origin: authOrigin, path: path)
  }

  static func backendEndpoint(_ path: String) throws -> URL {
    try endpoint(origin: backendOrigin, path: path)
  }

  static func sameOrigin(_ candidate: URL, _ origin: URL) -> Bool {
    candidate.scheme?.lowercased() == origin.scheme?.lowercased()
      && candidate.host?.lowercased() == origin.host?.lowercased()
      && effectivePort(candidate) == effectivePort(origin)
  }

  private static func endpoint(origin: URL, path: String) throws -> URL {
    guard path.hasPrefix("/"), !path.contains("..") else {
      throw CodexConnectionFailure.requestFailed
    }
    var components = URLComponents(url: origin, resolvingAgainstBaseURL: false)
    components?.path = path
    guard let url = components?.url, sameOrigin(url, origin) else {
      throw CodexConnectionFailure.requestFailed
    }
    return url
  }

  private static func effectivePort(_ url: URL) -> Int {
    url.port ?? (url.scheme?.lowercased() == "https" ? 443 : -1)
  }
}
