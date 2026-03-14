import SwiftUI

struct MainAppView: View {
    @StateObject private var authService = AuthService.shared
    @State private var isCheckingVerification = false
    
    var body: some View {
        Group {
            if !authService.isAuthenticated {
                // Show sign in view
                SignInView()
            } else if authService.requiresEmailVerification {
                // Show email verification view
                EmailVerificationView()
            } else {
                // Show main app content
                TabView {
                    DashboardView()
                        .tabItem {
                            Image(systemName: "chart.bar.fill")
                            Text("Dashboard")
                        }
                    
                    UploadView()
                        .tabItem {
                            Image(systemName: "camera.fill")
                            Text("Upload")
                        }
                    
                    RecordsView()
                        .tabItem {
                            Image(systemName: "list.bullet")
                            Text("Records")
                        }
                    
                    AccountView()
                        .tabItem {
                            Image(systemName: "person.fill")
                            Text("Account")
                        }
                }
                .overlay(alignment: .top) {
                    EmailVerificationBanner()
                }
            }
        }
        .onAppear {
            checkVerificationStatus()
        }
    }
    
    private func checkVerificationStatus() {
        guard authService.isAuthenticated else { return }
        
        isCheckingVerification = true
        
        Task {
            do {
                try await authService.checkVerificationStatus()
            } catch {
                print("Failed to check verification status: \(error)")
            }
            
            await MainActor.run {
                isCheckingVerification = false
            }
        }
    }
}

// Placeholder views - these would be implemented in your actual app
struct SignInView: View {
    var body: some View {
        VStack {
            Text("Sign In View")
                .font(.title)
            Text("This would be your actual sign-in implementation")
                .foregroundColor(.secondary)
        }
    }
}

struct DashboardView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Dashboard")
                    .font(.title)
                Text("Your receipt analytics and overview")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Dashboard")
        }
    }
}

struct UploadView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Upload Receipt")
                    .font(.title)
                Text("Camera and photo picker for receipts")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Upload")
        }
    }
}

struct RecordsView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Records")
                    .font(.title)
                Text("List of all your receipts")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Records")
        }
    }
}

struct AccountView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Account Settings")
                    .font(.title)
                Text("User profile and app settings")
                    .foregroundColor(.secondary)
                
                Button("Sign Out") {
                    AuthService.shared.signOut()
                }
                .padding()
                .background(Color.red)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            .navigationTitle("Account")
        }
    }
}

#Preview {
    MainAppView()
}
