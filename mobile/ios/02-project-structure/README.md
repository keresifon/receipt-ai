# 📁 Project Structure & Setup

Complete guide to create and organize your ReceiptAI iOS project.

## 🎯 Project Overview

This section covers:
- Creating the Xcode project
- Setting up folder structure
- Configuring dependencies
- Initial project configuration

## 🚀 Step 1: Create Xcode Project

### Project Creation
```bash
# 1. Open Xcode
open -a Xcode

# 2. Click "Create a new Xcode project"
# 3. Choose "iOS" → "App"
# 4. Fill in project details:
```

**Project Configuration:**
- **Product Name**: ReceiptAI
- **Bundle Identifier**: com.yourcompany.receiptai
- **Language**: Swift
- **Interface**: SwiftUI
- **Use Core Data**: Yes (for offline storage)
- **Include Tests**: Yes
- **Use Core Data**: Yes

### Project Location
```bash
# Create project in organized location
mkdir ~/iOS-Projects
cd ~/iOS-Projects
mkdir ReceiptAI
cd ReceiptAI

# Create Xcode project here
```

## 📂 Step 2: Folder Structure

### Recommended Project Structure
```
ReceiptAI/
├── ReceiptAI/
│   ├── App/
│   │   ├── ReceiptAIApp.swift
│   │   └── ContentView.swift
│   ├── Models/
│   │   ├── Receipt.swift
│   │   ├── User.swift
│   │   ├── Analytics.swift
│   │   └── LineItem.swift
│   ├── Services/
│   │   ├── APIClient.swift
│   │   ├── AuthService.swift
│   │   ├── ImageService.swift
│   │   └── SyncService.swift
│   ├── Views/
│   │   ├── Authentication/
│   │   │   ├── LoginView.swift
│   │   │   ├── SignupView.swift
│   │   │   └── TwoFactorView.swift
│   │   ├── Dashboard/
│   │   │   ├── DashboardView.swift
│   │   │   ├── AnalyticsView.swift
│   │   │   └── TodayView.swift
│   │   ├── Camera/
│   │   │   ├── CameraView.swift
│   │   │   ├── ReceiptUploadView.swift
│   │   │   └── ImagePreviewView.swift
│   │   ├── Records/
│   │   │   ├── RecordsView.swift
│   │   │   ├── RecordDetailView.swift
│   │   │   └── RecordEditView.swift
│   │   └── Settings/
│   │       ├── SettingsView.swift
│   │       ├── AccountView.swift
│   │       └── AboutView.swift
│   ├── ViewModels/
│   │   ├── DashboardViewModel.swift
│   │   ├── RecordsViewModel.swift
│   │   ├── CameraViewModel.swift
│   │   └── AuthViewModel.swift
│   ├── Utils/
│   │   ├── Constants.swift
│   │   ├── Extensions.swift
│   │   ├── Keychain.swift
│   │   └── NetworkMonitor.swift
│   └── Resources/
│       ├── Assets.xcassets
│       ├── Info.plist
│       └── ReceiptAI.xcdatamodeld
├── ReceiptAITests/
│   ├── ReceiptAITests.swift
│   ├── APIClientTests.swift
│   └── AuthServiceTests.swift
├── ReceiptAIUITests/
│   ├── ReceiptAIUITests.swift
│   └── AuthenticationUITests.swift
├── ReceiptAI.xcodeproj
└── Podfile
```

## 📦 Step 3: Dependencies Setup

### Option A: Swift Package Manager (Recommended)

Create `Package.swift`:
```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ReceiptAI",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(name: "ReceiptAI", targets: ["ReceiptAI"])
    ],
    dependencies: [
        .package(url: "https://github.com/Alamofire/Alamofire", from: "5.8.0"),
        .package(url: "https://github.com/realm/realm-swift", from: "10.0.0"),
        .package(url: "https://github.com/onevcat/Kingfisher", from: "7.0.0"),
        .package(url: "https://github.com/SwiftyJSON/SwiftyJSON", from: "5.0.0")
    ],
    targets: [
        .target(
            name: "ReceiptAI",
            dependencies: [
                "Alamofire",
                "RealmSwift",
                "Kingfisher",
                "SwiftyJSON"
            ]
        )
    ]
)
```

### Option B: CocoaPods

Create `Podfile`:
```ruby
# File: Podfile
platform :ios, '17.0'
use_frameworks!

target 'ReceiptAI' do
  pod 'Alamofire', '~> 5.8'
  pod 'RealmSwift', '~> 10.0'
  pod 'Kingfisher', '~> 7.0'
  pod 'SwiftyJSON', '~> 5.0'
end

target 'ReceiptAITests' do
  pod 'Quick', '~> 7.0'
  pod 'Nimble', '~> 12.0'
end
```

Install dependencies:
```bash
# For CocoaPods
pod install

# Open workspace (not project)
open ReceiptAI.xcworkspace
```

## ⚙️ Step 4: Project Configuration

### Info.plist Configuration
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>ReceiptAI</string>
    <key>CFBundleIdentifier</key>
    <string>com.yourcompany.receiptai</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>NSCameraUsageDescription</key>
    <string>This app needs camera access to capture receipt photos for expense tracking.</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>This app needs photo library access to select receipt images for expense tracking.</string>
    <key>NSFaceIDUsageDescription</key>
    <string>This app uses Face ID for secure authentication.</string>
    <key>UILaunchScreen</key>
    <dict>
        <key>UIImageName</key>
        <string>LaunchImage</string>
    </dict>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>
```

### Build Settings
```bash
# In Xcode, go to Project Settings → Build Settings
# Set the following:

# Deployment Target: iOS 17.0
# Swift Language Version: Swift 5
# Build Active Architecture Only: Debug: Yes, Release: No
# Code Signing: Automatic
```

## 🔧 Step 5: Core Data Setup

### Data Model Configuration
```bash
# 1. In Xcode, select ReceiptAI.xcdatamodeld
# 2. Add entities:
#    - Receipt (id, date, merchant, notes, totals, createdAt)
#    - LineItem (id, description, category, quantity, unitPrice, totalPrice)
#    - User (id, email, name, accountId, role)
#    - SyncStatus (id, entityType, entityId, lastSync, status)
```

### Core Data Stack
Create `CoreDataStack.swift`:
```swift
import CoreData
import Foundation

class CoreDataStack {
    static let shared = CoreDataStack()
    
    private init() {}
    
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "ReceiptAI")
        container.loadPersistentStores { _, error in
            if let error = error {
                fatalError("Core Data error: \(error)")
            }
        }
        return container
    }()
    
    var context: NSManagedObjectContext {
        return persistentContainer.viewContext
    }
    
    func saveContext() {
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("Save error: \(error)")
            }
        }
    }
}
```

## 🎨 Step 6: Assets Setup

### App Icon
```bash
# 1. Create app icon in various sizes:
#    - 20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5, 1024x1024
# 2. Add to Assets.xcassets → AppIcon
# 3. Use your existing logo or create new one
```

### Launch Screen
```bash
# 1. Create launch screen image
# 2. Add to Assets.xcassets → LaunchImage
# 3. Configure in Info.plist
```

## 🔐 Step 7: Security Configuration

### Keychain Setup
```swift
// File: Utils/Keychain.swift
import Security
import Foundation

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
```

## 📱 Step 8: Initial App Structure

### Main App File
```swift
// File: App/ReceiptAIApp.swift
import SwiftUI

@main
struct ReceiptAIApp: App {
    @StateObject private var authService = AuthService.shared
    @StateObject private var coreDataStack = CoreDataStack.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authService)
                .environment(\.managedObjectContext, coreDataStack.context)
        }
    }
}
```

### Content View
```swift
// File: App/ContentView.swift
import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authService: AuthService
    
    var body: some View {
        Group {
            if authService.isAuthenticated {
                MainTabView()
            } else {
                AuthenticationView()
            }
        }
        .animation(.easeInOut, value: authService.isAuthenticated)
    }
}
```

## ✅ Step 9: Verification

### Test Project Build
```bash
# 1. Select iPhone 15 Pro simulator
# 2. Press Cmd + B to build
# 3. Press Cmd + R to run
# 4. Verify app launches without errors
```

### Check Dependencies
```bash
# Verify all dependencies are properly linked
# Check that imports work in Swift files
# Ensure no build errors
```

## 🎯 Next Steps

Once your project structure is set up:
1. Move to `../03-api-integration/` to implement the API client
2. Set up network communication with your backend
3. Configure authentication flow

## 🚨 Common Issues

### Build Errors
```bash
# Clean build folder
Cmd + Shift + K

# Reset package cache
File → Packages → Reset Package Caches

# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### Dependency Issues
```bash
# For CocoaPods
pod deintegrate
pod install

# For SPM
File → Packages → Reset Package Caches
```

---

**Ready for API integration?** Proceed to `../03-api-integration/README.md`!
