# 🔌 API Integration Guide

Complete guide to integrate your iOS app with the ReceiptAI backend API.

## 🎯 Overview

This section covers:
- API client implementation
- Authentication flow
- Data synchronization
- Error handling
- Network monitoring

## 📡 API Client Implementation

### Base API Client
The `APIClient.swift` file provides a comprehensive interface to your backend API.

**Key Features:**
- JWT token authentication
- Automatic retry logic
- Request/response logging
- Error handling
- Mobile-specific headers

### Authentication Flow
```swift
// 1. Sign in with credentials
let response = try await APIClient.shared.authenticate(
    email: "user@example.com",
    password: "password123"
)

// 2. Store token securely
AuthService.shared.authToken = response.token

// 3. Use token for subsequent requests
let analytics = try await APIClient.shared.getAnalytics()
```

## 🔐 Authentication Integration

### JWT Token Management
```swift
// Automatic token inclusion in requests
private func getAuthHeaders() -> HTTPHeaders {
    var headers = HTTPHeaders()
    
    if let token = AuthService.shared.authToken {
        headers.add(.authorization(bearerToken: token))
    }
    
    headers.add(.init(name: "x-mobile-app", value: "ios"))
    headers.add(.init(name: "x-app-version", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"))
    
    return headers
}
```

### Two-Factor Authentication
```swift
// Check if 2FA is required
if response.requiresTwoFactor {
    // Show 2FA input screen
    showTwoFactorView()
} else {
    // Proceed with normal flow
    completeAuthentication()
}
```

## 📊 Data Synchronization

### Real-time Sync
```swift
class SyncService: ObservableObject {
    @Published var isSyncing = false
    @Published var lastSyncDate: Date?
    
    func syncData() async {
        isSyncing = true
        
        do {
            // Fetch latest data
            let analytics = try await APIClient.shared.getAnalytics()
            let records = try await APIClient.shared.getRecords()
            
            // Update local storage
            await updateLocalData(analytics: analytics, records: records)
            
            lastSyncDate = Date()
        } catch {
            print("Sync error: \(error)")
        }
        
        isSyncing = false
    }
}
```

### Offline Support
```swift
// Store data locally for offline access
func storeReceiptLocally(_ receipt: Receipt) {
    CoreDataStack.shared.saveReceipt(receipt)
    CoreDataStack.shared.markForSync(entityType: "receipt", entityId: receipt.id)
}

// Sync when connection is restored
func syncPendingChanges() async {
    let pendingSyncs = CoreDataStack.shared.fetchPendingSyncs()
    
    for sync in pendingSyncs {
        // Upload pending changes
        try await uploadPendingChange(sync)
    }
}
```

## 🌐 Network Monitoring

### Connection Status
```swift
import Network

class NetworkMonitor: ObservableObject {
    @Published var isConnected = false
    @Published var connectionType: NWInterface.InterfaceType?
    
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")
    
    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied
                self?.connectionType = path.availableInterfaces.first?.type
            }
        }
        monitor.start(queue: queue)
    }
}
```

### Retry Logic
```swift
func performRequestWithRetry<T: Codable>(
    endpoint: String,
    method: HTTPMethod,
    parameters: [String: Any]? = nil,
    responseType: T.Type,
    maxRetries: Int = 3
) async throws -> T {
    var lastError: Error?
    
    for attempt in 1...maxRetries {
        do {
            return try await performRequest(
                endpoint: endpoint,
                method: method,
                parameters: parameters,
                responseType: responseType
            )
        } catch {
            lastError = error
            
            if attempt < maxRetries {
                // Exponential backoff
                let delay = pow(2.0, Double(attempt)) * 1000 // milliseconds
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000))
            }
        }
    }
    
    throw lastError ?? NetworkError.unknown
}
```

## 📱 Mobile-Specific Features

### Image Upload Optimization
```swift
func uploadReceipt(imageData: Data, date: String?, merchant: String?, notes: String?) async throws -> UploadResponse {
    // Compress image for mobile upload
    let compressedData = compressImage(imageData)
    
    let multipartFormData = MultipartFormData()
    multipartFormData.append(compressedData, withName: "file", fileName: "receipt.jpg", mimeType: "image/jpeg")
    
    // Add metadata
    if let date = date {
        multipartFormData.append(date.data(using: .utf8)!, withName: "date")
    }
    if let merchant = merchant {
        multipartFormData.append(merchant.data(using: .utf8)!, withName: "merchant")
    }
    if let notes = notes {
        multipartFormData.append(notes.data(using: .utf8)!, withName: "notes")
    }
    
    return try await performMultipartRequest(
        endpoint: "/upload",
        multipartFormData: multipartFormData,
        responseType: UploadResponse.self
    )
}

private func compressImage(_ imageData: Data) -> Data {
    guard let image = UIImage(data: imageData) else { return imageData }
    
    // Resize image if too large
    let maxSize: CGFloat = 1024
    let resizedImage = image.resized(to: CGSize(width: maxSize, height: maxSize))
    
    // Compress with quality
    return resizedImage.jpegData(compressionQuality: 0.8) ?? imageData
}
```

### Background Sync
```swift
class BackgroundSyncService {
    func scheduleBackgroundSync() {
        let request = BGAppRefreshTaskRequest(identifier: "com.receiptai.sync")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        try? BGTaskScheduler.shared.submit(request)
    }
    
    func handleBackgroundSync(task: BGAppRefreshTask) {
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }
        
        Task {
            do {
                await SyncService.shared.syncData()
                task.setTaskCompleted(success: true)
            } catch {
                task.setTaskCompleted(success: false)
            }
        }
    }
}
```

## 🚨 Error Handling

### Network Errors
```swift
enum NetworkError: Error, LocalizedError {
    case noConnection
    case timeout
    case serverError(Int)
    case invalidResponse
    case unauthorized
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .noConnection:
            return "No internet connection"
        case .timeout:
            return "Request timed out"
        case .serverError(let code):
            return "Server error: \(code)"
        case .invalidResponse:
            return "Invalid response format"
        case .unauthorized:
            return "Authentication required"
        case .unknown:
            return "Unknown error occurred"
        }
    }
}
```

### Error Recovery
```swift
func handleAPIError(_ error: Error) {
    if let networkError = error as? NetworkError {
        switch networkError {
        case .noConnection:
            showOfflineMode()
        case .unauthorized:
            AuthService.shared.signOut()
            showLoginScreen()
        case .serverError(let code):
            if code >= 500 {
                showRetryOption()
            } else {
                showErrorMessage(networkError.localizedDescription)
            }
        default:
            showErrorMessage(networkError.localizedDescription)
        }
    }
}
```

## 📊 Analytics Integration

### Dashboard Data
```swift
class DashboardViewModel: ObservableObject {
    @Published var analytics: AnalyticsResponse?
    @Published var isLoading = false
    @Published var error: String?
    
    func loadAnalytics(month: String? = nil) async {
        isLoading = true
        error = nil
        
        do {
            analytics = try await APIClient.shared.getAnalytics(month: month)
        } catch {
            error = error.localizedDescription
        }
        
        isLoading = false
    }
}
```

### Real-time Updates
```swift
func startRealTimeUpdates() {
    Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { _ in
        Task {
            await self.loadAnalytics()
        }
    }
}
```

## 🔄 Data Caching

### Local Storage Strategy
```swift
class CacheManager {
    private let cache = NSCache<NSString, NSData>()
    
    func cacheData<T: Codable>(_ data: T, for key: String) {
        if let encoded = try? JSONEncoder().encode(data) {
            cache.setObject(encoded as NSData, forKey: key as NSString)
        }
    }
    
    func getCachedData<T: Codable>(_ type: T.Type, for key: String) -> T? {
        guard let data = cache.object(forKey: key as NSString) as Data else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }
}
```

## 🧪 Testing API Integration

### Mock API Client
```swift
class MockAPIClient: APIClientProtocol {
    func authenticate(email: String, password: String) async throws -> AuthResponse {
        return AuthResponse(
            token: "mock_token",
            user: User(id: "1", email: email, name: "Test User", accountId: "1", role: "admin"),
            expiresAt: Date().addingTimeInterval(3600)
        )
    }
    
    func getAnalytics() async throws -> AnalyticsResponse {
        return AnalyticsResponse(
            monthly: [],
            byCategory: [],
            byStore: [],
            recent: [],
            totals: TotalsData(total: 0, count: 0)
        )
    }
}
```

### Unit Tests
```swift
class APIClientTests: XCTestCase {
    func testAuthentication() async throws {
        let client = MockAPIClient()
        let response = try await client.authenticate(email: "test@example.com", password: "password")
        
        XCTAssertEqual(response.user.email, "test@example.com")
        XCTAssertNotNil(response.token)
    }
}
```

## 🎯 Next Steps

Once API integration is complete:
1. Move to `../04-authentication/` to implement the authentication UI
2. Build login and signup screens
3. Add two-factor authentication flow

## 🚨 Troubleshooting

### Common Issues

**Authentication Failures:**
```swift
// Check token validity
if AuthService.shared.authToken?.isEmpty == true {
    // Redirect to login
    AuthService.shared.signOut()
}
```

**Network Timeouts:**
```swift
// Increase timeout for large uploads
configuration.timeoutIntervalForRequest = 60
configuration.timeoutIntervalForResource = 120
```

**Data Sync Issues:**
```swift
// Check sync status
let pendingSyncs = CoreDataStack.shared.fetchPendingSyncs()
if !pendingSyncs.isEmpty {
    // Retry sync
    await SyncService.shared.syncPendingChanges()
}
```

---

**Ready for authentication UI?** Proceed to `../04-authentication/README.md`!


