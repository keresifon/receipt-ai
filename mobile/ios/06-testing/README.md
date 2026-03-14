# 🧪 Testing Implementation

Complete guide to implement comprehensive testing for your ReceiptAI iOS app.

## 🎯 Overview

This section covers:
- Unit testing setup
- UI testing implementation
- Mock services and data
- Performance testing
- Test automation

## 🔧 Testing Setup

### Test Target Configuration
```swift
// File: ReceiptAITests/ReceiptAITests.swift
import XCTest
@testable import ReceiptAI

class ReceiptAITests: XCTestCase {
    override func setUpWithError() throws {
        // Put setup code here
    }
    
    override func tearDownWithError() throws {
        // Put teardown code here
    }
    
    func testExample() throws {
        // This is an example of a functional test case
        XCTAssertTrue(true)
    }
}
```

### Test Dependencies
```swift
// File: Podfile (for CocoaPods)
target 'ReceiptAITests' do
  pod 'Quick', '~> 7.0'
  pod 'Nimble', '~> 12.0'
  pod 'Mockingbird', '~> 0.20'
end

// File: Package.swift (for SPM)
dependencies: [
    .package(url: "https://github.com/Quick/Quick", from: "7.0.0"),
    .package(url: "https://github.com/Quick/Nimble", from: "12.0.0"),
    .package(url: "https://github.com/birdrides/mockingbird", from: "0.20.0")
]
```

## 🔬 Unit Testing

### API Client Tests
```swift
// File: ReceiptAITests/APIClientTests.swift
import XCTest
@testable import ReceiptAI

class APIClientTests: XCTestCase {
    var apiClient: APIClient!
    var mockSession: MockURLSession!
    
    override func setUp() {
        super.setUp()
        mockSession = MockURLSession()
        apiClient = APIClient(session: mockSession)
    }
    
    override func tearDown() {
        apiClient = nil
        mockSession = nil
        super.tearDown()
    }
    
    func testAuthenticationSuccess() async throws {
        // Given
        let mockResponse = AuthResponse(
            token: "test_token",
            user: User(id: "1", email: "test@example.com", name: "Test User", accountId: "1", role: "admin"),
            expiresAt: Date().addingTimeInterval(3600)
        )
        mockSession.mockResponse = try JSONEncoder().encode(mockResponse)
        
        // When
        let response = try await apiClient.authenticate(email: "test@example.com", password: "password")
        
        // Then
        XCTAssertEqual(response.token, "test_token")
        XCTAssertEqual(response.user.email, "test@example.com")
    }
    
    func testAuthenticationFailure() async {
        // Given
        mockSession.mockError = NetworkError.unauthorized
        
        // When & Then
        do {
            _ = try await apiClient.authenticate(email: "test@example.com", password: "wrongpassword")
            XCTFail("Expected authentication to fail")
        } catch {
            XCTAssertTrue(error is NetworkError)
        }
    }
    
    func testReceiptUpload() async throws {
        // Given
        let mockResponse = UploadResponse(
            appended: true,
            receipt_id: "receipt_123",
            line_items: []
        )
        mockSession.mockResponse = try JSONEncoder().encode(mockResponse)
        
        let imageData = Data("test_image_data".utf8)
        
        // When
        let response = try await apiClient.uploadReceipt(
            imageData: imageData,
            date: "2024-01-15",
            merchant: "Test Store",
            notes: "Test receipt"
        )
        
        // Then
        XCTAssertTrue(response.appended)
        XCTAssertEqual(response.receipt_id, "receipt_123")
    }
}

// Mock URLSession for testing
class MockURLSession: URLSessionProtocol {
    var mockResponse: Data?
    var mockError: Error?
    var lastRequest: URLRequest?
    
    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        lastRequest = request
        
        if let error = mockError {
            throw error
        }
        
        guard let data = mockResponse else {
            throw NetworkError.invalidResponse
        }
        
        let response = HTTPURLResponse(
            url: request.url!,
            statusCode: 200,
            httpVersion: nil,
            headerFields: nil
        )!
        
        return (data, response)
    }
}
```

### Authentication Service Tests
```swift
// File: ReceiptAITests/AuthServiceTests.swift
import XCTest
@testable import ReceiptAI

class AuthServiceTests: XCTestCase {
    var authService: AuthService!
    var mockKeychain: MockKeychain!
    
    override func setUp() {
        super.setUp()
        mockKeychain = MockKeychain()
        authService = AuthService(keychain: mockKeychain)
    }
    
    override func tearDown() {
        authService = nil
        mockKeychain = nil
        super.tearDown()
    }
    
    func testSignInSuccess() async throws {
        // Given
        let mockResponse = AuthResponse(
            token: "test_token",
            user: User(id: "1", email: "test@example.com", name: "Test User", accountId: "1", role: "admin"),
            expiresAt: Date().addingTimeInterval(3600)
        )
        
        // When
        try await authService.signIn(email: "test@example.com", password: "password")
        
        // Then
        XCTAssertTrue(authService.isAuthenticated)
        XCTAssertEqual(authService.authToken, "test_token")
        XCTAssertEqual(authService.currentUser?.email, "test@example.com")
    }
    
    func testSignOut() {
        // Given
        authService.isAuthenticated = true
        authService.authToken = "test_token"
        
        // When
        authService.signOut()
        
        // Then
        XCTAssertFalse(authService.isAuthenticated)
        XCTAssertNil(authService.authToken)
        XCTAssertNil(authService.currentUser)
    }
    
    func testTokenStorage() {
        // Given
        let token = "test_token"
        
        // When
        authService.authToken = token
        
        // Then
        XCTAssertEqual(mockKeychain.storedValues["auth_token"], token)
    }
}

// Mock Keychain for testing
class MockKeychain: KeychainProtocol {
    var storedValues: [String: String] = [:]
    
    subscript(key: String) -> String? {
        get { storedValues[key] }
        set { storedValues[key] = newValue }
    }
}
```

### Core Data Tests
```swift
// File: ReceiptAITests/CoreDataTests.swift
import XCTest
import CoreData
@testable import ReceiptAI

class CoreDataTests: XCTestCase {
    var coreDataStack: CoreDataStack!
    var context: NSManagedObjectContext!
    
    override func setUp() {
        super.setUp()
        coreDataStack = CoreDataStack()
        context = coreDataStack.context
    }
    
    override func tearDown() {
        context = nil
        coreDataStack = nil
        super.tearDown()
    }
    
    func testSaveReceipt() {
        // Given
        let receipt = Receipt(
            id: "receipt_123",
            date: "2024-01-15",
            merchant: "Test Store",
            notes: "Test receipt",
            totals: ReceiptTotals(subtotal: 10.0, tax: 1.3, total: 11.3, currency: "CAD"),
            lineItems: [],
            createdAt: "2024-01-15T10:00:00Z"
        )
        
        // When
        coreDataStack.saveReceipt(receipt)
        
        // Then
        let savedReceipt = coreDataStack.fetchReceipt(by: "receipt_123")
        XCTAssertNotNil(savedReceipt)
        XCTAssertEqual(savedReceipt?.merchant, "Test Store")
    }
    
    func testFetchReceipts() {
        // Given
        let receipt1 = Receipt(
            id: "receipt_1",
            date: "2024-01-15",
            merchant: "Store 1",
            notes: nil,
            totals: ReceiptTotals(subtotal: 10.0, tax: 1.3, total: 11.3, currency: "CAD"),
            lineItems: [],
            createdAt: "2024-01-15T10:00:00Z"
        )
        
        let receipt2 = Receipt(
            id: "receipt_2",
            date: "2024-01-16",
            merchant: "Store 2",
            notes: nil,
            totals: ReceiptTotals(subtotal: 20.0, tax: 2.6, total: 22.6, currency: "CAD"),
            lineItems: [],
            createdAt: "2024-01-16T10:00:00Z"
        )
        
        coreDataStack.saveReceipt(receipt1)
        coreDataStack.saveReceipt(receipt2)
        
        // When
        let receipts = coreDataStack.fetchReceipts()
        
        // Then
        XCTAssertEqual(receipts.count, 2)
        XCTAssertEqual(receipts.first?.merchant, "Store 2") // Should be sorted by date desc
    }
}
```

## 🎭 UI Testing

### Authentication UI Tests
```swift
// File: ReceiptAIUITests/AuthenticationUITests.swift
import XCTest

class AuthenticationUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    func testLoginFlow() throws {
        // Test login screen elements
        XCTAssertTrue(app.textFields["Email"].exists)
        XCTAssertTrue(app.secureTextFields["Password"].exists)
        XCTAssertTrue(app.buttons["Sign In"].exists)
        
        // Test login with valid credentials
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("test@example.com")
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("password123")
        
        app.buttons["Sign In"].tap()
        
        // Verify dashboard appears
        XCTAssertTrue(app.navigationBars["Dashboard"].waitForExistence(timeout: 5))
    }
    
    func testSignupFlow() throws {
        // Navigate to signup
        app.buttons["Sign Up"].tap()
        
        // Test signup screen elements
        XCTAssertTrue(app.textFields["Full Name"].exists)
        XCTAssertTrue(app.textFields["Email"].exists)
        XCTAssertTrue(app.secureTextFields["Password"].exists)
        XCTAssertTrue(app.secureTextFields["Confirm Password"].exists)
        
        // Fill signup form
        app.textFields["Full Name"].tap()
        app.textFields["Full Name"].typeText("Test User")
        
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("newuser@example.com")
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("password123")
        
        app.secureTextFields["Confirm Password"].tap()
        app.secureTextFields["Confirm Password"].typeText("password123")
        
        app.buttons["Create Account"].tap()
        
        // Verify dashboard appears
        XCTAssertTrue(app.navigationBars["Dashboard"].waitForExistence(timeout: 5))
    }
    
    func testTwoFactorAuthentication() throws {
        // Test 2FA flow
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("2fa@example.com")
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("password123")
        
        app.buttons["Sign In"].tap()
        
        // Verify 2FA screen appears
        XCTAssertTrue(app.textFields["000000"].waitForExistence(timeout: 5))
        
        // Enter 2FA code
        app.textFields["000000"].tap()
        app.textFields["000000"].typeText("123456")
        
        // Verify dashboard appears
        XCTAssertTrue(app.navigationBars["Dashboard"].waitForExistence(timeout: 5))
    }
}
```

### Camera UI Tests
```swift
// File: ReceiptAIUITests/CameraUITests.swift
import XCTest

class CameraUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    func testReceiptUploadFlow() throws {
        // Navigate to upload screen
        app.tabBars.buttons["Upload"].tap()
        
        // Test camera button
        XCTAssertTrue(app.buttons["Take Photo"].exists)
        
        // Tap camera button
        app.buttons["Take Photo"].tap()
        
        // In simulator, camera won't work, but we can test the flow
        // In real device testing, you'd interact with the camera
        
        // Test upload form elements
        XCTAssertTrue(app.textFields["Merchant"].exists)
        XCTAssertTrue(app.textFields["Notes"].exists)
        XCTAssertTrue(app.buttons["Upload Receipt"].exists)
    }
    
    func testImagePickerFlow() throws {
        // Navigate to upload screen
        app.tabBars.buttons["Upload"].tap()
        
        // Test image picker button
        XCTAssertTrue(app.buttons["Choose from Library"].exists)
        
        // Tap image picker button
        app.buttons["Choose from Library"].tap()
        
        // Test image picker interface
        // In simulator, you'd select a test image
    }
}
```

### Dashboard UI Tests
```swift
// File: ReceiptAIUITests/DashboardUITests.swift
import XCTest

class DashboardUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
        
        // Login first
        login()
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    private func login() {
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("test@example.com")
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("password123")
        
        app.buttons["Sign In"].tap()
        
        // Wait for dashboard
        XCTAssertTrue(app.navigationBars["Dashboard"].waitForExistence(timeout: 5))
    }
    
    func testDashboardElements() throws {
        // Test summary cards
        XCTAssertTrue(app.staticTexts["Total Spend"].exists)
        XCTAssertTrue(app.staticTexts["Total Items"].exists)
        XCTAssertTrue(app.staticTexts["Categories"].exists)
        XCTAssertTrue(app.staticTexts["Stores"].exists)
        
        // Test charts
        XCTAssertTrue(app.otherElements["Monthly Spend Chart"].exists)
        XCTAssertTrue(app.otherElements["Category Chart"].exists)
        XCTAssertTrue(app.otherElements["Store Chart"].exists)
        
        // Test today's purchases
        XCTAssertTrue(app.staticTexts["Today's Purchases"].exists)
    }
    
    func testMonthFilter() throws {
        // Test month filter
        XCTAssertTrue(app.buttons["All Months"].exists)
        
        app.buttons["All Months"].tap()
        
        // Test month selection
        XCTAssertTrue(app.buttons["January 2024"].exists)
        app.buttons["January 2024"].tap()
        
        // Verify filter is applied
        XCTAssertTrue(app.buttons["January 2024"].exists)
    }
    
    func testRefresh() throws {
        // Test pull to refresh
        let dashboard = app.navigationBars["Dashboard"]
        dashboard.swipeDown()
        
        // Verify refresh indicator appears
        XCTAssertTrue(app.activityIndicators.firstMatch.waitForExistence(timeout: 2))
    }
}
```

## 🎭 Mock Services

### Mock API Client
```swift
// File: ReceiptAITests/MockAPIClient.swift
import Foundation
@testable import ReceiptAI

class MockAPIClient: APIClientProtocol {
    var mockAuthResponse: AuthResponse?
    var mockAnalyticsResponse: AnalyticsResponse?
    var mockUploadResponse: UploadResponse?
    var mockError: Error?
    
    func authenticate(email: String, password: String, twoFactorToken: String? = nil) async throws -> AuthResponse {
        if let error = mockError {
            throw error
        }
        
        return mockAuthResponse ?? AuthResponse(
            token: "mock_token",
            user: User(id: "1", email: email, name: "Test User", accountId: "1", role: "admin"),
            expiresAt: Date().addingTimeInterval(3600)
        )
    }
    
    func getAnalytics(month: String? = nil) async throws -> AnalyticsResponse {
        if let error = mockError {
            throw error
        }
        
        return mockAnalyticsResponse ?? AnalyticsResponse(
            monthly: [
                MonthlyData(month: "2024-01", total: 100.0),
                MonthlyData(month: "2024-02", total: 150.0)
            ],
            byCategory: [
                CategoryData(category: "Food", total: 80.0),
                CategoryData(category: "Transport", total: 20.0)
            ],
            byStore: [
                StoreData(store: "Grocery Store", total: 60.0),
                StoreData(store: "Gas Station", total: 20.0)
            ],
            recent: [
                RecentItem(id: "1", date: "2024-01-15", store: "Grocery Store", description: "Milk", category: "Food", total_price: 5.0)
            ],
            totals: TotalsData(total: 250.0, count: 10)
        )
    }
    
    func uploadReceipt(imageData: Data, date: String?, merchant: String?, notes: String?) async throws -> UploadResponse {
        if let error = mockError {
            throw error
        }
        
        return mockUploadResponse ?? UploadResponse(
            appended: true,
            receipt_id: "mock_receipt_123",
            line_items: []
        )
    }
}
```

### Mock Data Generator
```swift
// File: ReceiptAITests/MockDataGenerator.swift
import Foundation
@testable import ReceiptAI

class MockDataGenerator {
    static func generateReceipts(count: Int) -> [Receipt] {
        let merchants = ["Grocery Store", "Gas Station", "Restaurant", "Pharmacy", "Hardware Store"]
        let categories = ["Food", "Transport", "Healthcare", "Home", "Entertainment"]
        let descriptions = ["Milk", "Gas", "Lunch", "Medicine", "Tools"]
        
        return (1...count).map { index in
            Receipt(
                id: "receipt_\(index)",
                date: "2024-01-\(String(format: "%02d", index))",
                merchant: merchants.randomElement() ?? "Store",
                notes: "Test receipt \(index)",
                totals: ReceiptTotals(
                    subtotal: Double.random(in: 10...100),
                    tax: Double.random(in: 1...10),
                    total: Double.random(in: 11...110),
                    currency: "CAD"
                ),
                lineItems: [],
                createdAt: "2024-01-\(String(format: "%02d", index))T10:00:00Z"
            )
        }
    }
    
    static func generateAnalytics() -> AnalyticsResponse {
        return AnalyticsResponse(
            monthly: [
                MonthlyData(month: "2024-01", total: 100.0),
                MonthlyData(month: "2024-02", total: 150.0),
                MonthlyData(month: "2024-03", total: 120.0)
            ],
            byCategory: [
                CategoryData(category: "Food", total: 80.0),
                CategoryData(category: "Transport", total: 20.0),
                CategoryData(category: "Healthcare", total: 15.0)
            ],
            byStore: [
                StoreData(store: "Grocery Store", total: 60.0),
                StoreData(store: "Gas Station", total: 20.0),
                StoreData(store: "Restaurant", total: 30.0)
            ],
            recent: generateReceipts(count: 5).map { receipt in
                RecentItem(
                    id: receipt.id,
                    date: receipt.date,
                    store: receipt.merchant,
                    description: "Test item",
                    category: "Food",
                    total_price: receipt.totals.total ?? 0
                )
            },
            totals: TotalsData(total: 370.0, count: 15)
        )
    }
}
```

## ⚡ Performance Testing

### Performance Tests
```swift
// File: ReceiptAITests/PerformanceTests.swift
import XCTest
@testable import ReceiptAI

class PerformanceTests: XCTestCase {
    func testImageCompressionPerformance() {
        let testImage = UIImage(systemName: "photo")!
        
        measure {
            let compressedData = testImage.jpegData(compressionQuality: 0.8)
            XCTAssertNotNil(compressedData)
        }
    }
    
    func testCoreDataPerformance() {
        let coreDataStack = CoreDataStack()
        
        measure {
            let receipts = MockDataGenerator.generateReceipts(count: 100)
            
            for receipt in receipts {
                coreDataStack.saveReceipt(receipt)
            }
            
            let fetchedReceipts = coreDataStack.fetchReceipts()
            XCTAssertEqual(fetchedReceipts.count, 100)
        }
    }
    
    func testAPIClientPerformance() {
        let apiClient = MockAPIClient()
        
        measure {
            Task {
                do {
                    let analytics = try await apiClient.getAnalytics()
                    XCTAssertNotNil(analytics)
                } catch {
                    XCTFail("API call failed: \(error)")
                }
            }
        }
    }
}
```

## 🤖 Test Automation

### CI/CD Integration
```yaml
# File: .github/workflows/ios-tests.yml
name: iOS Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Xcode
      uses: maxim-lobanov/setup-xcode@v1
      with:
        xcode-version: latest-stable
    
    - name: Install dependencies
      run: |
        cd ReceiptAI
        pod install
    
    - name: Run unit tests
      run: |
        cd ReceiptAI
        xcodebuild test \
          -workspace ReceiptAI.xcworkspace \
          -scheme ReceiptAI \
          -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
          -only-testing:ReceiptAITests
    
    - name: Run UI tests
      run: |
        cd ReceiptAI
        xcodebuild test \
          -workspace ReceiptAI.xcworkspace \
          -scheme ReceiptAI \
          -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
          -only-testing:ReceiptAIUITests
```

### Test Scripts
```bash
#!/bin/bash
# File: scripts/run-tests.sh

echo "Running iOS Tests..."

# Clean build
xcodebuild clean -workspace ReceiptAI.xcworkspace -scheme ReceiptAI

# Run unit tests
echo "Running unit tests..."
xcodebuild test \
  -workspace ReceiptAI.xcworkspace \
  -scheme ReceiptAI \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  -only-testing:ReceiptAITests

# Run UI tests
echo "Running UI tests..."
xcodebuild test \
  -workspace ReceiptAI.xcworkspace \
  -scheme ReceiptAI \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  -only-testing:ReceiptAIUITests

echo "Tests completed!"
```

## 📊 Test Coverage

### Coverage Configuration
```swift
// File: ReceiptAI.xcodeproj/project.pbxproj
// Add to build settings:
// Code Coverage: Yes
// Instrument Program Flow: Yes
```

### Coverage Reports
```bash
# Generate coverage report
xcodebuild test \
  -workspace ReceiptAI.xcworkspace \
  -scheme ReceiptAI \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  -enableCodeCoverage YES

# View coverage report
xcrun xccov view --report ReceiptAI.xcresult
```

## 🎯 Next Steps

Once testing is implemented:
1. Move to `../07-deployment/` to prepare for App Store submission
2. Set up App Store Connect
3. Configure app metadata and screenshots

## 🚨 Troubleshooting

### Common Test Issues

**Simulator Issues:**
```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all
```

**Test Failures:**
```swift
// Add proper async/await handling
func testAsyncFunction() async throws {
    let result = try await asyncFunction()
    XCTAssertNotNil(result)
}
```

**UI Test Timing:**
```swift
// Use proper waits
XCTAssertTrue(app.buttons["Submit"].waitForExistence(timeout: 5))
```

---

**Ready for deployment?** Proceed to `../07-deployment/README.md`!



















