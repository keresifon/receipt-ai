import Foundation
import CoreData

// MARK: - Core Data Models
@objc(ReceiptEntity)
public class ReceiptEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var date: Date
    @NSManaged public var merchant: String
    @NSManaged public var notes: String?
    @NSManaged public var totals: Data?
    @NSManaged public var createdAt: Date
    @NSManaged public var syncStatus: String
    @NSManaged public var lineItems: NSSet?
}

@objc(LineItemEntity)
public class LineItemEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var description: String
    @NSManaged public var category: String?
    @NSManaged public var quantity: Double
    @NSManaged public var unitPrice: Double
    @NSManaged public var totalPrice: Double
    @NSManaged public var hst: Double
    @NSManaged public var discount: Double
    @NSManaged public var receipt: ReceiptEntity?
}

@objc(UserEntity)
public class UserEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var email: String
    @NSManaged public var name: String
    @NSManaged public var accountId: String
    @NSManaged public var role: String
    @NSManaged public var lastSync: Date
}

@objc(SyncStatusEntity)
public class SyncStatusEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var entityType: String
    @NSManaged public var entityId: String
    @NSManaged public var lastSync: Date
    @NSManaged public var status: String
}

// MARK: - Swift Models
struct Receipt: Codable, Identifiable {
    let id: String
    let date: String
    let merchant: String
    let notes: String?
    let totals: ReceiptTotals
    let lineItems: [LineItem]
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case date, merchant, notes, totals
        case lineItems = "line_items"
        case createdAt = "createdAt"
    }
}

struct ReceiptTotals: Codable {
    let subtotal: Double?
    let tax: Double?
    let total: Double?
    let currency: String?
}

struct LineItem: Codable, Identifiable {
    let id: String
    let description: String
    let category: String?
    let quantity: Double?
    let unitPrice: Double?
    let totalPrice: Double
    let hst: Double?
    let discount: Double?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case description, category, quantity
        case unitPrice = "unit_price"
        case totalPrice = "total_price"
        case hst, discount
    }
}

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

// MARK: - Extensions
extension ReceiptEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<ReceiptEntity> {
        return NSFetchRequest<ReceiptEntity>(entityName: "ReceiptEntity")
    }
}

extension LineItemEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<LineItemEntity> {
        return NSFetchRequest<LineItemEntity>(entityName: "LineItemEntity")
    }
}

extension UserEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<UserEntity> {
        return NSFetchRequest<UserEntity>(entityName: "UserEntity")
    }
}

extension SyncStatusEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<SyncStatusEntity> {
        return NSFetchRequest<SyncStatusEntity>(entityName: "SyncStatusEntity")
    }
}

// MARK: - Model Converters
extension ReceiptEntity {
    func toReceipt() -> Receipt {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        let createdAtFormatter = DateFormatter()
        createdAtFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
        var totals = ReceiptTotals(subtotal: nil, tax: nil, total: nil, currency: nil)
        if let totalsData = self.totals,
           let decodedTotals = try? JSONDecoder().decode(ReceiptTotals.self, from: totalsData) {
            totals = decodedTotals
        }
        
        let lineItems = (self.lineItems as? Set<LineItemEntity>)?.map { $0.toLineItem() } ?? []
        
        return Receipt(
            id: self.id,
            date: dateFormatter.string(from: self.date),
            merchant: self.merchant,
            notes: self.notes,
            totals: totals,
            lineItems: lineItems,
            createdAt: createdAtFormatter.string(from: self.createdAt)
        )
    }
}

extension LineItemEntity {
    func toLineItem() -> LineItem {
        return LineItem(
            id: self.id,
            description: self.description,
            category: self.category,
            quantity: self.quantity,
            unitPrice: self.unitPrice,
            totalPrice: self.totalPrice,
            hst: self.hst,
            discount: self.discount
        )
    }
}

extension UserEntity {
    func toUser() -> User {
        return User(
            id: self.id,
            email: self.email,
            name: self.name,
            accountId: self.accountId,
            role: self.role
        )
    }
}

