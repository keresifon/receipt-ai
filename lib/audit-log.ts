import { NextRequest } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export interface AuditLogEntry {
  timestamp: Date
  userId?: string
  accountId?: string
  action: string
  resource: string
  resourceId?: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
}

export class AuditLogger {
  private static instance: AuditLogger
  private db: any = null

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  private async getDb() {
    if (!this.db) {
      const client = await clientPromise
      this.db = client.db(process.env.MONGODB_DB || 'expenses')
    }
    return this.db
  }

  async log(entry: Omit<AuditLogEntry, 'timestamp'>) {
    try {
      const db = await this.getDb()
      const auditCollection = db.collection('audit_logs')
      
      const logEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date()
      }

      await auditCollection.insertOne(logEntry)
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.error('Audit logging failed:', error)
    }
  }

  // Convenience methods for common security events
  async logLogin(userId: string, accountId: string, success: boolean, req: NextRequest, errorMessage?: string) {
    await this.log({
      userId,
      accountId,
      action: 'LOGIN',
      resource: 'auth',
      details: { method: 'credentials' },
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      success,
      errorMessage
    })
  }

  async logLogout(userId: string, accountId: string, req: NextRequest) {
    await this.log({
      userId,
      accountId,
      action: 'LOGOUT',
      resource: 'auth',
      details: {},
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true
    })
  }

  async logFileUpload(userId: string, accountId: string, receiptId: string, success: boolean, req: NextRequest, errorMessage?: string) {
    await this.log({
      userId,
      accountId,
      action: 'FILE_UPLOAD',
      resource: 'receipts',
      resourceId: receiptId,
      details: { fileType: 'receipt_image' },
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      success,
      errorMessage
    })
  }

  async logDataAccess(userId: string, accountId: string, resource: string, success: boolean, req: NextRequest, errorMessage?: string) {
    await this.log({
      userId,
      accountId,
      action: 'DATA_ACCESS',
      resource,
      details: { method: req.method, path: req.nextUrl?.pathname },
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      success,
      errorMessage
    })
  }

  async logDataModification(userId: string, accountId: string, resource: string, resourceId: string, details: Record<string, any>, success: boolean, req: NextRequest, errorMessage?: string) {
    await this.log({
      userId,
      accountId,
      action: 'DATA_MODIFICATION',
      resource,
      resourceId,
      details,
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      success,
      errorMessage
    })
  }

  async logSecurityEvent(userId: string | undefined, accountId: string | undefined, action: string, details: Record<string, any>, req: NextRequest, success: boolean, errorMessage?: string) {
    await this.log({
      userId,
      accountId,
      action,
      resource: 'security',
      details,
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      success,
      errorMessage
    })
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance()

