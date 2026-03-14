import SwiftUI

struct EmailVerificationView: View {
    @StateObject private var authService = AuthService.shared
    @State private var isResending = false
    @State private var message = ""
    @State private var showAlert = false
    
    var body: some View {
        VStack(spacing: 24) {
            // Header
            VStack(spacing: 16) {
                Image(systemName: "envelope.badge")
                    .font(.system(size: 64))
                    .foregroundColor(.blue)
                
                Text("Email Verification Required")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("Please verify your email address to continue using No-wahala.net")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            // User Email
            if let user = authService.currentUser {
                VStack(spacing: 8) {
                    Text("We've sent a verification email to:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(user.email)
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }
            
            // Instructions
            VStack(alignment: .leading, spacing: 8) {
                Text("Next Steps:")
                    .font(.headline)
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("1.")
                            .fontWeight(.medium)
                        Text("Check your email inbox (and spam folder)")
                    }
                    HStack {
                        Text("2.")
                            .fontWeight(.medium)
                        Text("Click the verification link in the email")
                    }
                    HStack {
                        Text("3.")
                            .fontWeight(.medium)
                        Text("Return to the app to continue")
                    }
                }
                .font(.body)
                .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemBlue).opacity(0.1))
            .cornerRadius(8)
            
            // Message
            if !message.isEmpty {
                Text(message)
                    .font(.body)
                    .foregroundColor(message.contains("sent") ? .green : .red)
                    .padding()
                    .background(message.contains("sent") ? Color.green.opacity(0.1) : Color.red.opacity(0.1))
                    .cornerRadius(8)
            }
            
            // Action Buttons
            VStack(spacing: 12) {
                Button(action: resendVerification) {
                    HStack {
                        if isResending {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "arrow.clockwise")
                        }
                        Text(isResending ? "Sending..." : "Resend Verification Email")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
                .disabled(isResending)
                
                Button(action: {
                    authService.signOut()
                }) {
                    Text("Sign Out")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemGray5))
                        .foregroundColor(.primary)
                        .cornerRadius(8)
                }
            }
            
            Spacer()
            
            // Footer
            Text("Having trouble? Check your spam folder or contact support.")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .navigationTitle("Email Verification")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Verification Email", isPresented: $showAlert) {
            Button("OK") { }
        } message: {
            Text(message)
        }
    }
    
    private func resendVerification() {
        isResending = true
        message = ""
        
        Task {
            do {
                try await authService.resendVerificationEmail()
                await MainActor.run {
                    message = "Verification email sent! Check your inbox."
                    showAlert = true
                }
            } catch {
                await MainActor.run {
                    message = "Failed to send verification email. Please try again."
                    showAlert = true
                }
            }
            
            await MainActor.run {
                isResending = false
            }
        }
    }
}

#Preview {
    NavigationView {
        EmailVerificationView()
    }
}
