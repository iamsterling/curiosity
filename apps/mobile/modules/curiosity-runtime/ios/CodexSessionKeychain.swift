import Foundation
import Security

struct CodexSession: Codable, Sendable {
  let accessToken: String
  let accountId: String
  let expiresAt: TimeInterval
  let idToken: String?
  let isFedRamp: Bool
  let refreshToken: String
}

struct CodexSessionKeychain: Sendable {
  private let account = "https://auth.openai.com|app_EMoamEEZ73f0CkXaXp7hrann"
  private let service = "com.iamsterling.curiosity.provider.openai-oauth"

  func read() throws -> CodexSession? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: account,
      kSecAttrService as String: service,
      kSecMatchLimit as String: kSecMatchLimitOne,
      kSecReturnData as String: true,
    ]
    var result: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    if status == errSecItemNotFound { return nil }
    guard status == errSecSuccess, let data = result as? Data else {
      throw CodexConnectionFailure.sessionRequired
    }
    do {
      let session = try JSONDecoder().decode(CodexSession.self, from: data)
      try validateCodexSession(session)
      return session
    } catch {
      try? clear()
      throw CodexConnectionFailure.sessionRequired
    }
  }

  func save(_ session: CodexSession) throws {
    try validateCodexSession(session)
    let data = try JSONEncoder().encode(session)
    guard data.count <= 64 * 1_024 else {
      throw CodexConnectionFailure.responseInvalid
    }
    let identity: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: account,
      kSecAttrService as String: service,
    ]
    let update: [String: Any] = [kSecValueData as String: data]
    let updated = SecItemUpdate(identity as CFDictionary, update as CFDictionary)
    if updated == errSecSuccess { return }
    guard updated == errSecItemNotFound else {
      throw CodexConnectionFailure.requestFailed
    }
    var insertion = identity
    insertion[kSecValueData as String] = data
    insertion[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    guard SecItemAdd(insertion as CFDictionary, nil) == errSecSuccess else {
      throw CodexConnectionFailure.requestFailed
    }
  }

  func clear() throws {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: account,
      kSecAttrService as String: service,
    ]
    let status = SecItemDelete(query as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else {
      throw CodexConnectionFailure.requestFailed
    }
  }
}

private func validateCodexSession(_ session: CodexSession) throws {
  guard
    codexSecret(session.accessToken),
    codexIdentifier(session.accountId, maximumBytes: 2_048),
    session.expiresAt.isFinite,
    session.expiresAt > 0,
    session.idToken.map(codexSecret) ?? true,
    codexSecret(session.refreshToken)
  else { throw CodexConnectionFailure.responseInvalid }
}

private func codexSecret(_ value: String) -> Bool {
  !value.isEmpty
    && value.utf8.count <= 16 * 1_024
    && !value.unicodeScalars.contains { $0.value <= 0x1f || $0.value == 0x7f }
}
