import SwiftUI

struct EmailVerificationBanner: View {
    @StateObject private var authService = AuthService.shared
    @State private var showVerificationView = false
    
    var body: some View {
        if let user = authService.currentUser,
           user.emailVerified == false,
           user.requiresVerification == false {
            VStack(spacing: 0) {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Email Verification Recommended")
                            .font(.caption)
                            .fontWeight(.medium)
                        
                        Text("Verify your email to secure your account")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Button("Verify") {
                        showVerificationView = true
                    }
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(4)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color.orange.opacity(0.1))
                
                Divider()
            }
            .sheet(isPresented: $showVerificationView) {
                NavigationView {
                    EmailVerificationView()
                }
            }
        }
    }
}

#Preview {
    VStack {
        EmailVerificationBanner()
        Spacer()
    }
}
