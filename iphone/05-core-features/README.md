# 📱 Core Features Implementation

Complete guide to implement the main features of your ReceiptAI iOS app.

## 🎯 Overview

This section covers:
- Camera integration for receipt scanning
- Dashboard with analytics
- Records management
- Settings and account management
- Offline support and sync

## 📸 Camera Integration

### Camera View Implementation
```swift
// File: Views/Camera/CameraView.swift
import SwiftUI
import AVFoundation

struct CameraView: UIViewControllerRepresentable {
    @Binding var capturedImage: UIImage?
    @Environment(\.presentationMode) var presentationMode
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .camera
        picker.cameraCaptureMode = .photo
        picker.allowsEditing = true
        picker.cameraFlashMode = .auto
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraView
        
        init(_ parent: CameraView) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.editedImage] as? UIImage ?? info[.originalImage] as? UIImage {
                parent.capturedImage = image
            }
            parent.presentationMode.wrappedValue.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}
```

### Receipt Upload View
```swift
// File: Views/Camera/ReceiptUploadView.swift
import SwiftUI

struct ReceiptUploadView: View {
    @StateObject private var viewModel = CameraViewModel()
    @State private var capturedImage: UIImage?
    @State private var showingCamera = false
    @State private var showingImagePicker = false
    
    @State private var date = Date()
    @State private var merchant = ""
    @State private var notes = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Image preview or capture button
                if let image = capturedImage {
                    ImagePreviewView(image: image) {
                        capturedImage = nil
                    }
                } else {
                    CaptureButtonView {
                        showingCamera = true
                    }
                }
                
                // Upload form
                if capturedImage != nil {
                    UploadFormView(
                        date: $date,
                        merchant: $merchant,
                        notes: $notes,
                        isUploading: viewModel.isUploading,
                        onUpload: uploadReceipt
                    )
                }
                
                // Error message
                if let error = viewModel.error {
                    Text(error)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                        .padding()
                }
            }
            .navigationTitle("Upload Receipt")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showingCamera) {
                CameraView(capturedImage: $capturedImage)
            }
            .sheet(isPresented: $showingImagePicker) {
                ImagePickerView(selectedImage: $capturedImage)
            }
        }
    }
    
    private func uploadReceipt() {
        guard let image = capturedImage else { return }
        
        Task {
            await viewModel.uploadReceipt(
                image: image,
                date: date,
                merchant: merchant,
                notes: notes
            )
            
            if viewModel.uploadSuccess {
                // Reset form
                capturedImage = nil
                merchant = ""
                notes = ""
                date = Date()
            }
        }
    }
}
```

### Camera ViewModel
```swift
// File: ViewModels/CameraViewModel.swift
import SwiftUI
import UIKit

class CameraViewModel: ObservableObject {
    @Published var isUploading = false
    @Published var uploadSuccess = false
    @Published var error: String?
    
    func uploadReceipt(image: UIImage, date: Date, merchant: String, notes: String) async {
        isUploading = true
        error = nil
        uploadSuccess = false
        
        do {
            // Compress image
            let imageData = compressImage(image)
            
            // Format date
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            let dateString = dateFormatter.string(from: date)
            
            // Upload to API
            let response = try await APIClient.shared.uploadReceipt(
                imageData: imageData,
                date: dateString,
                merchant: merchant.isEmpty ? nil : merchant,
                notes: notes.isEmpty ? nil : notes
            )
            
            await MainActor.run {
                uploadSuccess = true
                isUploading = false
            }
            
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                isUploading = false
            }
        }
    }
    
    private func compressImage(_ image: UIImage) -> Data {
        // Resize image if too large
        let maxSize: CGFloat = 1024
        let resizedImage = image.resized(to: CGSize(width: maxSize, height: maxSize))
        
        // Compress with quality
        return resizedImage.jpegData(compressionQuality: 0.8) ?? Data()
    }
}

// UIImage extension for resizing
extension UIImage {
    func resized(to size: CGSize) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            self.draw(in: CGRect(origin: .zero, size: size))
        }
    }
}
```

## 📊 Dashboard Implementation

### Dashboard View
```swift
// File: Views/Dashboard/DashboardView.swift
import SwiftUI
import Charts

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @State private var selectedMonth = ""
    @State private var showingMonthPicker = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Summary cards
                    SummaryCardsView(analytics: viewModel.analytics)
                    
                    // Month filter
                    MonthFilterView(
                        selectedMonth: $selectedMonth,
                        availableMonths: viewModel.availableMonths
                    ) {
                        Task {
                            await viewModel.loadAnalytics(month: selectedMonth.isEmpty ? nil : selectedMonth)
                        }
                    }
                    
                    // Charts
                    if let analytics = viewModel.analytics {
                        ChartsView(analytics: analytics)
                    }
                    
                    // Today's purchases
                    TodaysPurchasesView(analytics: viewModel.analytics)
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .refreshable {
                await viewModel.loadAnalytics()
            }
            .task {
                await viewModel.loadAnalytics()
            }
        }
    }
}
```

### Dashboard ViewModel
```swift
// File: ViewModels/DashboardViewModel.swift
import SwiftUI

class DashboardViewModel: ObservableObject {
    @Published var analytics: AnalyticsResponse?
    @Published var availableMonths: [String] = []
    @Published var isLoading = false
    @Published var error: String?
    
    func loadAnalytics(month: String? = nil) async {
        isLoading = true
        error = nil
        
        do {
            // Load analytics and months in parallel
            async let analyticsTask = APIClient.shared.getAnalytics(month: month)
            async let monthsTask = APIClient.shared.getMonths()
            
            let (analytics, months) = try await (analyticsTask, monthsTask)
            
            await MainActor.run {
                self.analytics = analytics
                self.availableMonths = months.months
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                self.isLoading = false
            }
        }
    }
}
```

### Summary Cards View
```swift
// File: Views/Dashboard/SummaryCardsView.swift
import SwiftUI

struct SummaryCardsView: View {
    let analytics: AnalyticsResponse?
    
    var body: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            SummaryCard(
                title: "Total Spend",
                value: formatCurrency(analytics?.totals.total ?? 0),
                icon: "dollarsign.circle.fill",
                color: .green
            )
            
            SummaryCard(
                title: "Total Items",
                value: "\(analytics?.totals.count ?? 0)",
                icon: "receipt.fill",
                color: .blue
            )
            
            SummaryCard(
                title: "Categories",
                value: "\(analytics?.byCategory.count ?? 0)",
                icon: "tag.fill",
                color: .orange
            )
            
            SummaryCard(
                title: "Stores",
                value: "\(Set(analytics?.byStore.map { $0.store } ?? []).count)",
                icon: "building.2.fill",
                color: .purple
            )
        }
    }
    
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "CAD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

struct SummaryCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}
```

## 📝 Records Management

### Records View
```swift
// File: Views/Records/RecordsView.swift
import SwiftUI

struct RecordsView: View {
    @StateObject private var viewModel = RecordsViewModel()
    @State private var searchText = ""
    @State private var selectedMonth = ""
    @State private var showingFilters = false
    
    var body: some View {
        NavigationView {
            VStack {
                // Search and filters
                SearchAndFiltersView(
                    searchText: $searchText,
                    selectedMonth: $selectedMonth,
                    availableMonths: viewModel.availableMonths,
                    showingFilters: $showingFilters
                )
                
                // Records list
                if viewModel.isLoading {
                    ProgressView("Loading records...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.records.isEmpty {
                    EmptyStateView()
                } else {
                    RecordsListView(
                        records: viewModel.records,
                        onEdit: { record in
                            // Handle edit
                        },
                        onDelete: { record in
                            Task {
                                await viewModel.deleteRecord(record)
                            }
                        }
                    )
                }
            }
            .navigationTitle("Records")
            .searchable(text: $searchText)
            .onChange(of: searchText) { newValue in
                Task {
                    await viewModel.searchRecords(query: newValue)
                }
            }
            .onChange(of: selectedMonth) { newValue in
                Task {
                    await viewModel.filterByMonth(newValue.isEmpty ? nil : newValue)
                }
            }
            .task {
                await viewModel.loadRecords()
            }
        }
    }
}
```

### Records ViewModel
```swift
// File: ViewModels/RecordsViewModel.swift
import SwiftUI

class RecordsViewModel: ObservableObject {
    @Published var records: [Record] = []
    @Published var availableMonths: [String] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var currentPage = 1
    @Published var hasMorePages = true
    
    func loadRecords() async {
        isLoading = true
        error = nil
        
        do {
            async let recordsTask = APIClient.shared.getRecords(page: currentPage)
            async let monthsTask = APIClient.shared.getMonths()
            
            let (recordsResponse, monthsResponse) = try await (recordsTask, monthsTask)
            
            await MainActor.run {
                self.records = recordsResponse.records
                self.availableMonths = monthsResponse.months
                self.hasMorePages = recordsResponse.pagination.hasNext
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    func loadMoreRecords() async {
        guard hasMorePages && !isLoading else { return }
        
        currentPage += 1
        
        do {
            let response = try await APIClient.shared.getRecords(page: currentPage)
            
            await MainActor.run {
                self.records.append(contentsOf: response.records)
                self.hasMorePages = response.pagination.hasNext
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                self.currentPage -= 1 // Revert page increment
            }
        }
    }
    
    func searchRecords(query: String) async {
        isLoading = true
        
        do {
            let response = try await APIClient.shared.getRecords(search: query)
            
            await MainActor.run {
                self.records = response.records
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    func filterByMonth(_ month: String?) async {
        isLoading = true
        
        do {
            let response = try await APIClient.shared.getRecords(month: month)
            
            await MainActor.run {
                self.records = response.records
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    func deleteRecord(_ record: Record) async {
        do {
            try await APIClient.shared.deleteItem(id: record.id)
            
            await MainActor.run {
                self.records.removeAll { $0.id == record.id }
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
            }
        }
    }
}
```

## ⚙️ Settings Implementation

### Settings View
```swift
// File: Views/Settings/SettingsView.swift
import SwiftUI

struct SettingsView: View {
    @StateObject private var viewModel = SettingsViewModel()
    @State private var showingAccountSettings = false
    @State private var showingAbout = false
    @State private var showingSignOutAlert = false
    
    var body: some View {
        NavigationView {
            List {
                // Account section
                Section("Account") {
                    Button("Account Settings") {
                        showingAccountSettings = true
                    }
                    
                    Button("Notifications") {
                        // Handle notifications
                    }
                }
                
                // App section
                Section("App") {
                    Button("About") {
                        showingAbout = true
                    }
                    
                    Button("Privacy Policy") {
                        // Open privacy policy
                    }
                    
                    Button("Terms of Service") {
                        // Open terms of service
                    }
                }
                
                // Data section
                Section("Data") {
                    Button("Export Data") {
                        Task {
                            await viewModel.exportData()
                        }
                    }
                    
                    Button("Sync Data") {
                        Task {
                            await viewModel.syncData()
                        }
                    }
                }
                
                // Sign out section
                Section {
                    Button("Sign Out", role: .destructive) {
                        showingSignOutAlert = true
                    }
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showingAccountSettings) {
                AccountSettingsView()
            }
            .sheet(isPresented: $showingAbout) {
                AboutView()
            }
            .alert("Sign Out", isPresented: $showingSignOutAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Sign Out", role: .destructive) {
                    viewModel.signOut()
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
    }
}
```

## 🔄 Offline Support

### Sync Service
```swift
// File: Services/SyncService.swift
import SwiftUI

class SyncService: ObservableObject {
    @Published var isSyncing = false
    @Published var lastSyncDate: Date?
    @Published var syncStatus: String = "Ready"
    
    private let coreDataStack = CoreDataStack.shared
    
    func syncData() async {
        isSyncing = true
        syncStatus = "Syncing..."
        
        do {
            // Fetch latest data from server
            let analytics = try await APIClient.shared.getAnalytics()
            let records = try await APIClient.shared.getRecords()
            
            // Update local storage
            await updateLocalData(analytics: analytics, records: records)
            
            // Sync pending changes
            await syncPendingChanges()
            
            await MainActor.run {
                lastSyncDate = Date()
                syncStatus = "Synced"
            }
        } catch {
            await MainActor.run {
                syncStatus = "Sync failed: \(error.localizedDescription)"
            }
        }
        
        isSyncing = false
    }
    
    private func updateLocalData(analytics: AnalyticsResponse, records: RecordsResponse) async {
        // Update Core Data with latest server data
        // This would involve updating existing records and adding new ones
    }
    
    private func syncPendingChanges() async {
        let pendingSyncs = coreDataStack.fetchPendingSyncs()
        
        for sync in pendingSyncs {
            // Upload pending changes to server
            // Mark as synced when successful
        }
    }
}
```

## 🧪 Testing Core Features

### Camera Tests
```swift
// File: ReceiptAITests/CameraViewModelTests.swift
import XCTest
@testable import ReceiptAI

class CameraViewModelTests: XCTestCase {
    var viewModel: CameraViewModel!
    
    override func setUp() {
        super.setUp()
        viewModel = CameraViewModel()
    }
    
    func testImageCompression() {
        // Test image compression logic
        let testImage = UIImage(systemName: "photo")!
        let compressedData = viewModel.compressImage(testImage)
        
        XCTAssertFalse(compressedData.isEmpty)
    }
    
    func testUploadReceipt() async {
        // Test receipt upload
        let testImage = UIImage(systemName: "photo")!
        
        await viewModel.uploadReceipt(
            image: testImage,
            date: Date(),
            merchant: "Test Store",
            notes: "Test receipt"
        )
        
        // Verify upload state
        XCTAssertFalse(viewModel.isUploading)
    }
}
```

## 🎯 Next Steps

Once core features are implemented:
1. Move to `../06-testing/` to set up comprehensive testing
2. Implement unit and UI tests
3. Add performance testing

## 🚨 Troubleshooting

### Common Issues

**Camera Permission:**
```swift
// Check camera permission
AVCaptureDevice.requestAccess(for: .video) { granted in
    if !granted {
        // Show permission denied alert
    }
}
```

**Image Upload Failures:**
```swift
// Handle upload errors
if let error = viewModel.error {
    // Show error message
    // Retry option
}
```

**Data Sync Issues:**
```swift
// Check network connectivity
if NetworkMonitor.shared.isConnected {
    await SyncService.shared.syncData()
} else {
    // Show offline message
}
```

---

**Ready for testing?** Proceed to `../06-testing/README.md`!

