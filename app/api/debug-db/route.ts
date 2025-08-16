import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    // Check line_items collection
    const lineItems = db.collection('line_items')
    const totalLineItems = await lineItems.countDocuments()
    const sampleLineItems = await lineItems.find({}).limit(3).toArray()
    
    // Check receipts collection
    const receipts = db.collection('receipts')
    const totalReceipts = await receipts.countDocuments()
    const sampleReceipts = await receipts.find({}).limit(3).toArray()
    
    // Check users collection
    const users = db.collection('users')
    const totalUsers = await users.countDocuments()
    const sampleUsers = await users.find({}).limit(3).toArray()
    
    // Check accounts collection
    const accounts = db.collection('accounts')
    const totalAccounts = await accounts.countDocuments()
    const sampleAccounts = await accounts.find({}).limit(3).toArray()

    return NextResponse.json({
      database: {
        name: db.databaseName,
        collections: {
          line_items: {
            total: totalLineItems,
            sample: sampleLineItems.map(item => ({
              id: item._id.toString(),
              description: item.description,
              date: item.date,
              store: item.store,
              hasAccountId: 'accountId' in item,
              accountId: item.accountId
            }))
          },
          receipts: {
            total: totalReceipts,
            sample: sampleReceipts.map(receipt => ({
              id: receipt._id.toString(),
              date: receipt.date,
              merchant: receipt.merchant,
              hasAccountId: 'accountId' in receipt,
              accountId: receipt.accountId
            }))
          },
          users: {
            total: totalUsers,
            sample: sampleUsers.map(user => ({
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              hasAccountId: 'accountId' in user,
              accountId: user.accountId
            }))
          },
          accounts: {
            total: totalAccounts,
            sample: sampleAccounts.map(account => ({
              id: account._id.toString(),
              name: account.name,
              description: account.description
            }))
          }
        }
      }
    })

  } catch (e: any) {
    console.error('Debug DB error:', e)
    return NextResponse.json({ detail: 'Debug DB failed: ' + e.message }, { status: 500 })
  }
}
