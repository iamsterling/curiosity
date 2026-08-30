import CryptoKit
import Foundation
import Security

struct CodexOAuthRequest: Sendable {
  let authorizationURL: URL
  let codeVerifier: String
  let redirectURI: String
  let state: String
}

enum CodexOAuth {
  static func request(port: UInt16) throws -> CodexOAuthRequest {
    let state = try randomURLSafe(byteCount: 32)
    let verifier = try randomURLSafe(byteCount: 64)
    let challenge = base64URL(Data(SHA256.hash(data: Data(verifier.utf8))))
    let redirectURI = "http://localhost:\(port)/auth/callback"
    var components = URLComponents(
      url: try CodexConnectionPolicy.authEndpoint("/oauth/authorize"),
      resolvingAgainstBaseURL: false
    )
    components?.queryItems = [
      URLQueryItem(name: "response_type", value: "code"),
      URLQueryItem(name: "client_id", value: CodexConnectionPolicy.clientID),
      URLQueryItem(name: "redirect_uri", value: redirectURI),
      URLQueryItem(name: "scope", value: "openid profile email offline_access"),
      URLQueryItem(name: "state", value: state),
      URLQueryItem(name: "code_challenge", value: challenge),
      URLQueryItem(name: "code_challenge_method", value: "S256"),
      URLQueryItem(name: "id_token_add_organizations", value: "true"),
      URLQueryItem(name: "codex_cli_simplified_flow", value: "true"),
    ]
    guard let authorizationURL = components?.url else {
      throw CodexConnectionFailure.authenticationFailed
    }
    return CodexOAuthRequest(
      authorizationURL: authorizationURL,
      codeVerifier: verifier,
      redirectURI: redirectURI,
      state: state
    )
  }

  static func accountId(idToken: String?, accessToken: String) -> String? {
    accountId(token: idToken) ?? accountId(token: accessToken)
  }

  static func isFedRamp(idToken: String?, accessToken: String) -> Bool {
    fedRamp(token: idToken) || fedRamp(token: accessToken)
  }

  private static func randomURLSafe(byteCount: Int) throws -> String {
    var bytes = [UInt8](repeating: 0, count: byteCount)
    guard SecRandomCopyBytes(kSecRandomDefault, byteCount, &bytes) == errSecSuccess else {
      throw CodexConnectionFailure.authenticationFailed
    }
    return base64URL(Data(bytes))
  }

  private static func base64URL(_ data: Data) -> String {
    data.base64EncodedString()
      .replacingOccurrences(of: "+", with: "-")
      .replacingOccurrences(of: "/", with: "_")
      .replacingOccurrences(of: "=", with: "")
  }

  private static func claims(_ token: String?) -> [String: Any]? {
    guard let token else { return nil }
    let parts = token.split(separator: ".", omittingEmptySubsequences: false)
    guard parts.count == 3 else { return nil }
    var encoded = String(parts[1]).replacingOccurrences(of: "-", with: "+")
      .replacingOccurrences(of: "_", with: "/")
    encoded += String(repeating: "=", count: (4 - encoded.count % 4) % 4)
    guard
      let data = Data(base64Encoded: encoded),
      data.count <= 64 * 1_024,
      let value = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return nil }
    return value
  }

  private static func accountId(token: String?) -> String? {
    guard let claims = claims(token) else { return nil }
    if
      let auth = claims["https://api.openai.com/auth"] as? [String: Any],
      let value = auth["chatgpt_account_id"] as? String,
      codexIdentifier(value, maximumBytes: 2_048)
    { return value }
    if
      let value = claims["chatgpt_account_id"] as? String,
      codexIdentifier(value, maximumBytes: 2_048)
    { return value }
    if
      let organizations = claims["organizations"] as? [[String: Any]],
      let value = organizations.first?["id"] as? String,
      codexIdentifier(value, maximumBytes: 2_048)
    { return value }
    return nil
  }

  private static func fedRamp(token: String?) -> Bool {
    guard
      let auth = claims(token)?["https://api.openai.com/auth"] as? [String: Any]
    else { return false }
    return auth["chatgpt_account_is_fedramp"] as? Bool == true
  }
}
