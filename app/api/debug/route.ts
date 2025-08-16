import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    // Check line_items collection
    const lineItems = db.collection('line_items')
    const totalLineItems = await lineItems.countDocuments()
    const lineItemsWithAccountId = await lineItems.countDocuments({ accountId: { $exists: true } })
    const lineItemsWithoutAccountId = await lineItems.countDocuments({ accountId: { $exists: false } })
    
    // Check receipts collection
    const receipts = db.collection('receipts')
    const totalReceipts = await receipts.countDocuments()
    const receiptsWithAccountId = await receipts.countDocuments({ accountId: { $exists: true } })
    const receiptsWithoutAccountId = await receipts.countDocuments({ accountId: { $exists: false } })
    
    // Check users collection
    const users = db.collection('users')
    const totalUsers = await users.countDocuments()
    const currentUser = await users.findOne({ _id: session.user.id })
    
    // Check accounts collection
    const accounts = db.collection('accounts')
    const totalAccounts = await accounts.countDocuments()
    const currentAccount = await accounts.findOne({ _id: session.user.accountId })
    
    // Sample records without accountId
    const sampleLineItems = await lineItems.find({ accountId: { $exists: false } }).limit(3).toArray()
    const sampleReceipts = await receipts.find({ accountId: { $exists: false } }).limit(3).toArray()

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        accountId: session.user.accountId,
        role: session.user.role
      },
      database: {
        name: db.databaseName,
        collections: {
          line_items: {
            total: totalLineItems,
            withAccountId: lineItemsWithAccountId,
            withoutAccountId: lineItemsWithoutAccountId
          },
          receipts: {
            total: totalReceipts,
            withAccountId: receiptsWithAccountId,
            withoutAccountId: receiptsWithoutAccountId
          },
          users: {
            total: totalUsers
          },
          accounts: {
            total: totalAccounts
          }
        }
      },
      currentUser: currentUser ? {
        id: currentUser._id.toString(),
        email: currentUser.email,
        accountId: currentUser.accountId?.toString(),
        role: currentUser.role
      } : null,
      currentAccount: currentAccount ? {
        id: currentAccount._id.toString(),
        name: currentAccount.name,
        description: currentAccount.description
      } : null,
      sampleRecords: {
        lineItems: sampleLineItems.map(item => ({
          id: item._id.toString(),
          description: item.description,
          date: item.date,
          store: item.store,
          hasAccountId: 'accountId' in item
        })),
        receipts: sampleReceipts.map(receipt => ({
          id: receipt._id.toString(),
          date: receipt.date,
          merchant: receipt.merchant,
          hasAccountId: 'accountId' in receipt
        }))
      }
    })

  } catch (e: any) {
    console.error('Debug error:', e)
    return NextResponse.json({ detail: 'Debug failed: ' + e.message }, { status: 500 })
  }
}
