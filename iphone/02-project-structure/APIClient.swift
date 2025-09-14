import Foundation
import Alamofire

class APIClient {
    static let shared = APIClient()
    
    private let baseURL = "https://no-wahala.net/api"
    private let session: Session
    
    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        
        self.session = Session(configuration: configuration)
    }
    
    // MARK: - Authentication
    func authenticate(email: String, password: String, twoFactorToken: String? = nil) async throws -> AuthResponse {
        let parameters: [String: Any] = [
            "email": email,
            "password": password,
            "twoFactorToken": twoFactorToken as Any
        ]
        
        return try await performRequest(
            endpoint: "/auth/signin",
            method: .post,
            parameters: parameters,
            responseType: AuthResponse.self
        )
    }
    
    // MARK: - Receipt Upload
    func uploadReceipt(imageData: Data, date: String?, merchant: String?, notes: String?) async throws -> UploadResponse {
        let multipartFormData = MultipartFormData()
        multipartFormData.append(imageData, withName: "file", fileName: "receipt.jpg", mimeType: "image/jpeg")
        
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
    
    // MARK: - Analytics
    func getAnalytics(month: String? = nil) async throws -> AnalyticsResponse {
        var endpoint = "/analytics"
        if let month = month {
            endpoint += "?month=\(month)"
        }
        
        return try await performRequest(
            endpoint: endpoint,
            method: .get,
            responseType: AnalyticsResponse.self
        )
    }
    
    // MARK: - Records
    func getRecords(page: Int = 1, search: String? = nil, month: String? = nil) async throws -> RecordsResponse {
        var parameters: [String: Any] = ["page": page]
        if let search = search {
            parameters["search"] = search
        }
        if let month = month {
            parameters["month"] = month
        }
        
        return try await performRequest(
            endpoint: "/records",
            method: .get,
            parameters: parameters,
            responseType: RecordsResponse.self
        )
    }
    
    // MARK: - Categories
    func getCategories() async throws -> CategoriesResponse {
        return try await performRequest(
            endpoint: "/categories",
            method: .get,
            responseType: CategoriesResponse.self
        )
    }
    
    // MARK: - Stores
    func getStores() async throws -> StoresResponse {
        return try await performRequest(
            endpoint: "/stores",
            method: .get,
            responseType: StoresResponse.self
        )
    }
    
    // MARK: - Months
    func getMonths() async throws -> MonthsResponse {
        return try await performRequest(
            endpoint: "/months",
            method: .get,
            responseType: MonthsResponse.self
        )
    }
    
    // MARK: - Items
    func updateItem(id: String, updates: [String: Any]) async throws -> ItemResponse {
        return try await performRequest(
            endpoint: "/items/\(id)",
            method: .put,
            parameters: updates,
            responseType: ItemResponse.self
        )
    }
    
    func deleteItem(id: String) async throws -> DeleteResponse {
        return try await performRequest(
            endpoint: "/items/\(id)",
            method: .delete,
            responseType: DeleteResponse.self
        )
    }
    
    // MARK: - Account
    func getAccountInfo() async throws -> AccountResponse {
        return try await performRequest(
            endpoint: "/accounts/me",
            method: .get,
            responseType: AccountResponse.self
        )
    }
    
    // MARK: - Private Methods
    private func performRequest<T: Codable>(
        endpoint: String,
        method: HTTPMethod,
        parameters: [String: Any]? = nil,
        responseType: T.Type
    ) async throws -> T {
        let url = baseURL + endpoint
        let headers = getAuthHeaders()
        
        return try await withCheckedThrowingContinuation { continuation in
            session.request(
                url,
                method: method,
                parameters: parameters,
                headers: headers
            )
            .validate()
            .responseData { response in
                switch response.result {
                case .success(let data):
                    do {
                        let decoded = try JSONDecoder().decode(T.self, from: data)
                        continuation.resume(returning: decoded)
                    } catch {
                        continuation.resume(throwing: error)
                    }
                case .failure(let error):
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    private func performMultipartRequest<T: Codable>(
        endpoint: String,
        multipartFormData: MultipartFormData,
        responseType: T.Type
    ) async throws -> T {
        let url = baseURL + endpoint
        let headers = getAuthHeaders()
        
        return try await withCheckedThrowingContinuation { continuation in
            session.upload(
                multipartFormData: multipartFormData,
                to: url,
                headers: headers
            )
            .validate()
            .responseData { response in
                switch response.result {
                case .success(let data):
                    do {
                        let decoded = try JSONDecoder().decode(T.self, from: data)
                        continuation.resume(returning: decoded)
                    } catch {
                        continuation.resume(throwing: error)
                    }
                case .failure(let error):
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    private func getAuthHeaders() -> HTTPHeaders {
        var headers = HTTPHeaders()
        
        if let token = AuthService.shared.authToken {
            headers.add(.authorization(bearerToken: token))
        }
        
        headers.add(.init(name: "x-mobile-app", value: "ios"))
        headers.add(.init(name: "x-app-version", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"))
        
        return headers
    }
}

// MARK: - Response Models
struct AuthResponse: Codable {
    let token: String
    let user: User
    let expiresAt: Date
}

struct UploadResponse: Codable {
    let appended: Bool
    let receipt_id: String
    let line_items: [LineItem]
}

struct AnalyticsResponse: Codable {
    let monthly: [MonthlyData]
    let byCategory: [CategoryData]
    let byStore: [StoreData]
    let recent: [RecentItem]
    let totals: TotalsData
}

struct RecordsResponse: Codable {
    let records: [Record]
    let pagination: PaginationInfo
}

struct CategoriesResponse: Codable {
    let categories: [String]
}

struct StoresResponse: Codable {
    let stores: [String]
}

struct MonthsResponse: Codable {
    let months: [String]
}

struct ItemResponse: Codable {
    let success: Bool
    let item: LineItem
}

struct DeleteResponse: Codable {
    let success: Bool
    let message: String
}

struct AccountResponse: Codable {
    let user: User
    let account: Account
    let settings: AccountSettings
}

// MARK: - Data Models
struct User: Codable {
    let id: String
    let email: String
    let name: String
    let accountId: String
    let role: String
}

struct Account: Codable {
    let id: String
    let name: String
    let members: [AccountMember]
}

struct AccountMember: Codable {
    let id: String
    let email: String
    let role: String
    let status: String
}

struct AccountSettings: Codable {
    let currency: String
    let timezone: String
    let notifications: NotificationSettings
}

struct NotificationSettings: Codable {
    let email: Bool
    let push: Bool
    let weeklyReport: Bool
}

struct Record: Codable, Identifiable {
    let id: String
    let receipt_id: String
    let date: String
    let store: String
    let description: String
    let category: String?
    let quantity: Double?
    let unit_price: Double?
    let total_price: Double
    let hst: Double?
    let discount: Double?
}

struct LineItem: Codable, Identifiable {
    let id: String
    let description: String
    let category: String?
    let quantity: Double?
    let unit_price: Double?
    let total_price: Double
    let hst: Double?
    let discount: Double?
}

struct MonthlyData: Codable {
    let month: String
    let total: Double
}

struct CategoryData: Codable {
    let category: String
    let total: Double
}

struct StoreData: Codable {
    let store: String
    let total: Double
}

struct RecentItem: Codable, Identifiable {
    let id: String
    let date: String
    let store: String
    let description: String
    let category: String?
    let total_price: Double
}

struct TotalsData: Codable {
    let total: Double
    let count: Int
}

struct PaginationInfo: Codable {
    let currentPage: Int
    let totalPages: Int
    let totalCount: Int
    let hasNext: Bool
    let hasPrev: Bool
}

