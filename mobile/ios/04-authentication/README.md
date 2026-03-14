# 🔐 Authentication Implementation

Complete guide to implement authentication flow in your ReceiptAI iOS app.

## 🎯 Overview

This section covers:
- Login and signup screens
- Two-factor authentication
- Biometric authentication
- Secure token storage
- Authentication state management

## 📱 Authentication Views

### Login View
```swift
// File: Views/Authentication/LoginView.swift
import SwiftUI

struct LoginView: View {
    @StateObject private var viewModel = AuthViewModel()
    @State private var email = ""
    @State private var password = ""
    @State private var showingSignup = false
    @State private var showingTwoFactor = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Logo and title
                VStack(spacing: 16) {
                    Image(systemName: "receipt")
                        .font(.system(size: 60))
                        .foregroundColor(.blue)
                    
                    Text("ReceiptAI")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Smart Family Receipt Management")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 40)
                
                // Login form
                VStack(spacing: 16) {
                    TextField("Email", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(.roundedBorder)
                    
                    if viewModel.isLoading {
                        ProgressView("Signing in...")
                    } else {
                        Button("Sign In") {
                            Task {
                                await viewModel.signIn(email: email, password: password)
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                        .disabled(email.isEmpty || password.isEmpty)
                    }
                }
                .padding(.horizontal, 32)
                
                // Error message
                if let error = viewModel.error {
                    Text(error)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
                
                Spacer()
                
                // Sign up link
                HStack {
                    Text("Don't have an account?")
                    Button("Sign Up") {
                        showingSignup = true
                    }
                    .foregroundColor(.blue)
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showingSignup) {
                SignupView()
            }
            .sheet(isPresented: $showingTwoFactor) {
                TwoFactorView(email: email)
            }
            .onChange(of: viewModel.requiresTwoFactor) { requires in
                if requires {
                    showingTwoFactor = true
                }
            }
        }
    }
}
```

### Signup View
```swift
// File: Views/Authentication/SignupView.swift
import SwiftUI

struct SignupView: View {
    @StateObject private var viewModel = AuthViewModel()
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 16) {
                    Image(systemName: "person.badge.plus")
                        .font(.system(size: 50))
                        .foregroundColor(.green)
                    
                    Text("Create Account")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                }
                .padding(.top, 40)
                
                // Signup form
                VStack(spacing: 16) {
                    TextField("Full Name", text: $name)
                        .textFieldStyle(.roundedBorder)
                    
                    TextField("Email", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(.roundedBorder)
                    
                    SecureField("Confirm Password", text: $confirmPassword)
                        .textFieldStyle(.roundedBorder)
                    
                    if viewModel.isLoading {
                        ProgressView("Creating account...")
                    } else {
                        Button("Create Account") {
                            Task {
                                await viewModel.signUp(name: name, email: email, password: password)
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                        .disabled(!isFormValid)
                    }
                }
                .padding(.horizontal, 32)
                
                // Error message
                if let error = viewModel.error {
                    Text(error)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
                
                Spacer()
                
                // Login link
                HStack {
                    Text("Already have an account?")
                    Button("Sign In") {
                        presentationMode.wrappedValue.dismiss()
                    }
                    .foregroundColor(.blue)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden(true)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
            .onChange(of: viewModel.isAuthenticated) { isAuth in
                if isAuth {
                    presentationMode.wrappedValue.dismiss()
                }
            }
        }
    }
    
    private var isFormValid: Bool {
        !name.isEmpty &&
        !email.isEmpty &&
        !password.isEmpty &&
        password == confirmPassword &&
        password.count >= 8
    }
}
```

### Two-Factor Authentication View
```swift
// File: Views/Authentication/TwoFactorView.swift
import SwiftUI

struct TwoFactorView: View {
    @StateObject private var viewModel = AuthViewModel()
    @State private var token = ""
    @State private var showingBiometric = false
    let email: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack(spacing: 32) {
                // Header
                VStack(spacing: 16) {
                    Image(systemName: "shield.checkered")
                        .font(.system(size: 50))
                        .foregroundColor(.orange)
                    
                    Text("Two-Factor Authentication")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Enter the 6-digit code from your authenticator app")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 40)
                
                // Token input
                VStack(spacing: 24) {
                    TextField("000000", text: $token)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.center)
                        .font(.title2)
                        .onChange(of: token) { newValue in
                            if newValue.count == 6 {
                                Task {
                                    await viewModel.verifyTwoFactor(token: newValue)
                                }
                            }
                        }
                    
                    if viewModel.isLoading {
                        ProgressView("Verifying...")
                    } else {
                        Button("Verify") {
                            Task {
                                await viewModel.verifyTwoFactor(token: token)
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                        .disabled(token.count != 6)
                    }
                }
                .padding(.horizontal, 32)
                
                // Biometric option
                if BiometricAuth.isAvailable {
                    Divider()
                        .padding(.horizontal, 32)
                    
                    Button(action: {
                        showingBiometric = true
                    }) {
                        HStack {
                            Image(systemName: BiometricAuth.iconName)
                            Text("Use \(BiometricAuth.typeName)")
                        }
                    }
                    .buttonStyle(.bordered)
                }
                
                // Error message
                if let error = viewModel.error {
                    Text(error)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
                
                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden(true)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
            .onChange(of: viewModel.isAuthenticated) { isAuth in
                if isAuth {
                    presentationMode.wrappedValue.dismiss()
                }
            }
            .sheet(isPresented: $showingBiometric) {
                BiometricAuthView()
            }
        }
    }
}
```

## 🔐 Authentication ViewModel

### AuthViewModel Implementation
```swift
// File: ViewModels/AuthViewModel.swift
import SwiftUI
import Combine

class AuthViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var isAuthenticated = false
    @Published var requiresTwoFactor = false
    
    private let authService = AuthService.shared
    
    init() {
        // Listen to authentication state changes
        authService.$isAuthenticated
            .assign(to: &$isAuthenticated)
    }
    
    func signIn(email: String, password: String) async {
        isLoading = true
        error = nil
        
        do {
            try await authService.signIn(email: email, password: password)
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func signUp(name: String, email: String, password: String) async {
        isLoading = true
        error = nil
        
        do {
            // Call signup API endpoint
            let response = try await APIClient.shared.signUp(
                name: name,
                email: email,
                password: password
            )
            
            // Automatically sign in after successful signup
            try await authService.signIn(email: email, password: password)
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func verifyTwoFactor(token: String) async {
        isLoading = true
        error = nil
        
        do {
            try await authService.verifyTwoFactor(token: token)
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func signOut() {
        authService.signOut()
    }
}
```

## 🔒 Biometric Authentication

### BiometricAuth Implementation
```swift
// File: Utils/BiometricAuth.swift
import LocalAuthentication
import SwiftUI

class BiometricAuth: ObservableObject {
    static let shared = BiometricAuth()
    
    @Published var isAvailable = false
    @Published var type: LABiometryType = .none
    
    private init() {
        checkAvailability()
    }
    
    private func checkAvailability() {
        let context = LAContext()
        var error: NSError?
        
        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            isAvailable = true
            type = context.biometryType
        }
    }
    
    func authenticate() async throws -> Bool {
        let context = LAContext()
        let reason = "Authenticate to access your receipts"
        
        do {
            let result = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            return result
        } catch {
            throw error
        }
    }
    
    var iconName: String {
        switch type {
        case .faceID:
            return "faceid"
        case .touchID:
            return "touchid"
        default:
            return "lock"
        }
    }
    
    var typeName: String {
        switch type {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        default:
            return "Biometric"
        }
    }
}

// BiometricAuthView
struct BiometricAuthView: View {
    @StateObject private var biometricAuth = BiometricAuth.shared
    @State private var isAuthenticating = false
    @State private var error: String?
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        VStack(spacing: 32) {
            Image(systemName: biometricAuth.iconName)
                .font(.system(size: 60))
                .foregroundColor(.blue)
            
            Text("Authenticate with \(biometricAuth.typeName)")
                .font(.title2)
                .fontWeight(.semibold)
            
            if isAuthenticating {
                ProgressView("Authenticating...")
            } else {
                Button("Authenticate") {
                    authenticate()
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
            
            if let error = error {
                Text(error)
                    .foregroundColor(.red)
                    .multilineTextAlignment(.center)
            }
            
            Spacer()
        }
        .padding()
        .navigationTitle("Biometric Authentication")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }
            }
        }
    }
    
    private func authenticate() {
        isAuthenticating = true
        error = nil
        
        Task {
            do {
                let success = try await biometricAuth.authenticate()
                if success {
                    await MainActor.run {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            } catch {
                await MainActor.run {
                    self.error = error.localizedDescription
                }
            }
            
            await MainActor.run {
                isAuthenticating = false
            }
        }
    }
}
```

## 🔑 Secure Token Storage

### Enhanced Keychain Implementation
```swift
// File: Utils/SecureStorage.swift
import Security
import Foundation

class SecureStorage {
    private let service: String
    
    init(service: String) {
        self.service = service
    }
    
    func store(_ data: Data, for key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Delete existing item
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw SecureStorageError.storeFailed
        }
    }
    
    func retrieve(for key: String) throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        if status == errSecSuccess {
            return result as? Data
        } else if status == errSecItemNotFound {
            return nil
        } else {
            throw SecureStorageError.retrieveFailed
        }
    }
    
    func delete(for key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw SecureStorageError.deleteFailed
        }
    }
}

enum SecureStorageError: Error {
    case storeFailed
    case retrieveFailed
    case deleteFailed
}
```

## 🎨 Authentication UI Components

### Custom Button Styles
```swift
// File: Utils/ButtonStyles.swift
import SwiftUI

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(.white)
            .padding()
            .background(Color.blue)
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(.blue)
            .padding()
            .background(Color.blue.opacity(0.1))
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}
```

### Loading States
```swift
// File: Utils/LoadingView.swift
import SwiftUI

struct LoadingView: View {
    let message: String
    
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
}

struct LoadingOverlay: View {
    let isShowing: Bool
    let message: String
    
    var body: some View {
        if isShowing {
            ZStack {
                Color.black.opacity(0.3)
                    .ignoresSafeArea()
                
                LoadingView(message: message)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(12)
            }
        }
    }
}
```

## 🧪 Testing Authentication

### Authentication Tests
```swift
// File: ReceiptAITests/AuthViewModelTests.swift
import XCTest
@testable import ReceiptAI

class AuthViewModelTests: XCTestCase {
    var viewModel: AuthViewModel!
    var mockAuthService: MockAuthService!
    
    override func setUp() {
        super.setUp()
        mockAuthService = MockAuthService()
        viewModel = AuthViewModel()
    }
    
    func testSignInSuccess() async {
        // Given
        let email = "test@example.com"
        let password = "password123"
        
        // When
        await viewModel.signIn(email: email, password: password)
        
        // Then
        XCTAssertTrue(viewModel.isAuthenticated)
        XCTAssertNil(viewModel.error)
    }
    
    func testSignInFailure() async {
        // Given
        let email = "invalid@example.com"
        let password = "wrongpassword"
        
        // When
        await viewModel.signIn(email: email, password: password)
        
        // Then
        XCTAssertFalse(viewModel.isAuthenticated)
        XCTAssertNotNil(viewModel.error)
    }
}
```

## 🎯 Next Steps

Once authentication is implemented:
1. Move to `../05-core-features/` to build the main app features
2. Implement camera functionality
3. Create dashboard and analytics views

## 🚨 Troubleshooting

### Common Issues

**Biometric Authentication Not Working:**
```swift
// Check device capabilities
if !BiometricAuth.shared.isAvailable {
    // Hide biometric option
    showingBiometric = false
}
```

**Token Storage Issues:**
```swift
// Verify keychain access
do {
    try secureStorage.store(tokenData, for: "auth_token")
} catch {
    print("Token storage failed: \(error)")
}
```

**Two-Factor Authentication:**
```swift
// Handle 2FA flow
if response.requiresTwoFactor {
    // Show 2FA input screen
    showingTwoFactor = true
} else {
    // Complete authentication
    isAuthenticated = true
}
```

---

**Ready for core features?** Proceed to `../05-core-features/README.md`!

