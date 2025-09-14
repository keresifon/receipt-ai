import Foundation
import Security

class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var requiresTwoFactor = false
    
    private let keychain = Keychain(service: "com.yourcompany.receiptai")
    
    var authToken: String? {
        get { keychain["auth_token"] }
        set { 
            if let token = newValue {
                keychain["auth_token"] = token
            } else {
                keychain["auth_token"] = nil
            }
        }
    }
    
    private init() {
        checkAuthenticationStatus()
    }
    
    // MARK: - Authentication Methods
    func signIn(email: String, password: String, twoFactorToken: String? = nil) async throws {
        let response = try await APIClient.shared.authenticate(
            email: email,
            password: password,
            twoFactorToken: twoFactorToken
        )
        
        authToken = response.token
        currentUser = response.user
        isAuthenticated = true
        requiresTwoFactor = false
        
        // Store user data securely
        if let userData = try? JSONEncoder().encode(response.user) {
            keychain["user_data"] = String(data: userData, encoding: .utf8)
        }
    }
    
    func signOut() {
        authToken = nil
        currentUser = nil
        isAuthenticated = false
        requiresTwoFactor = false
        keychain["user_data"] = nil
    }
    
    func verifyTwoFactor(token: String) async throws {
        guard let user = currentUser else {
            throw AuthError.noUser
        }
        
        try await signIn(
            email: user.email,
            password: "", // This would need to be stored securely or re-entered
            twoFactorToken: token
        )
    }
    
    // MARK: - Private Methods
    private func checkAuthenticationStatus() {
        if let token = authToken, !token.isEmpty {
            isAuthenticated = true
            
            // Restore user data
            if let userDataString = keychain["user_data"],
               let userData = userDataString.data(using: .utf8),
               let user = try? JSONDecoder().decode(User.self, from: userData) {
                currentUser = user
            }
        }
    }
}

// MARK: - Keychain Wrapper
class Keychain {
    private let service: String
    
    init(service: String) {
        self.service = service
    }
    
    subscript(key: String) -> String? {
        get {
            let query: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: key,
                kSecReturnData as String: true
            ]
            
            var result: AnyObject?
            let status = SecItemCopyMatching(query as CFDictionary, &result)
            
            if status == errSecSuccess,
               let data = result as? Data,
               let string = String(data: data, encoding: .utf8) {
                return string
            }
            
            return nil
        }
        set {
            if let value = newValue {
                let data = value.data(using: .utf8)!
                
                let query: [String: Any] = [
                    kSecClass as String: kSecClassGenericPassword,
                    kSecAttrService as String: service,
                    kSecAttrAccount as String: key,
                    kSecValueData as String: data
                ]
                
                SecItemDelete(query as CFDictionary)
                SecItemAdd(query as CFDictionary, nil)
            } else {
                let query: [String: Any] = [
                    kSecClass as String: kSecClassGenericPassword,
                    kSecAttrService as String: service,
                    kSecAttrAccount as String: key
                ]
                
                SecItemDelete(query as CFDictionary)
            }
        }
    }
}

// MARK: - Auth Errors
enum AuthError: Error, LocalizedError {
    case noUser
    case invalidCredentials
    case twoFactorRequired
    case twoFactorFailed
    case networkError
    
    var errorDescription: String? {
        switch self {
        case .noUser:
            return "No user found"
        case .invalidCredentials:
            return "Invalid email or password"
        case .twoFactorRequired:
            return "Two-factor authentication required"
        case .twoFactorFailed:
            return "Two-factor authentication failed"
        case .networkError:
            return "Network error occurred"
        }
    }
}

