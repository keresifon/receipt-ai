import Foundation
import Security
import Alamofire

class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var requiresTwoFactor = false
    @Published var requiresEmailVerification = false
    
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
        do {
            let response = try await APIClient.shared.authenticate(
                email: email,
                password: password,
                twoFactorToken: twoFactorToken
            )
            
            authToken = response.token
            currentUser = response.user
            isAuthenticated = true
            requiresTwoFactor = false
            requiresEmailVerification = response.user.requiresVerification ?? false
            
            // Store user data securely
            if let userData = try? JSONEncoder().encode(response.user) {
                keychain["user_data"] = String(data: userData, encoding: .utf8)
            }
        } catch {
            // Check if it's a verification required error
            if let afError = error as? AFError,
               let responseData = afError.responseData,
               let errorResponse = try? JSONDecoder().decode(VerificationErrorResponse.self, from: responseData),
               errorResponse.requiresVerification == true {
                requiresEmailVerification = true
                throw AuthError.emailVerificationRequired
            }
            throw error
        }
    }
    
    func signOut() {
        authToken = nil
        currentUser = nil
        isAuthenticated = false
        requiresTwoFactor = false
        requiresEmailVerification = false
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
    
    // MARK: - Email Verification
    func resendVerificationEmail() async throws {
        let response = try await APIClient.shared.resendVerificationEmail()
        // Handle response if needed
    }
    
    func checkVerificationStatus() async throws {
        let response = try await APIClient.shared.checkVerificationStatus()
        requiresEmailVerification = response.requiresVerification
        
        // Update current user if verification status changed
        if var user = currentUser {
            // Create updated user with new verification status
            let updatedUser = User(
                id: user.id,
                email: user.email,
                name: user.name,
                accountId: user.accountId,
                role: user.role,
                emailVerified: response.emailVerified,
                requiresVerification: response.requiresVerification
            )
            currentUser = updatedUser
            
            // Store updated user data
            if let userData = try? JSONEncoder().encode(updatedUser) {
                keychain["user_data"] = String(data: userData, encoding: .utf8)
            }
        }
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
    case emailVerificationRequired
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
        case .emailVerificationRequired:
            return "Email verification required"
        case .networkError:
            return "Network error occurred"
        }
    }
}

// MARK: - Error Response Models
struct VerificationErrorResponse: Codable {
    let detail: String
    let requiresVerification: Bool
    let emailVerified: Bool
    let verificationUrl: String?
}

