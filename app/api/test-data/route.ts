import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    // Get all users and add test data for each
    const usersCol = db.collection('users')
    const users = await usersCol.find({}).toArray()
    
    if (users.length === 0) {
      return NextResponse.json({ detail: 'No users found' }, { status: 404 })
    }
    
    console.log(`Found ${users.length} users, adding test data for all`)
    
    const receiptsCol = db.collection('receipts')
    const itemsCol = db.collection('line_items')
    
    // Sample receipt data template (accountId will be set per user)
    const sampleReceiptsTemplate = [
      {
        date: '2024-09-12',
        merchant: 'Starbucks',
        notes: 'Morning coffee',
        source: 'test-data',
        createdAt: new Date(),
        totals: {
          subtotal: 5.50,
          tax: 0.72,
          total: 6.22,
          currency: 'CAD'
        }
      },
      {
        date: '2024-09-11',
        merchant: 'Walmart',
        notes: 'Grocery shopping',
        source: 'test-data',
        createdAt: new Date(),
        totals: {
          subtotal: 45.67,
          tax: 5.94,
          total: 51.61,
          currency: 'CAD'
        }
      },
      {
        date: '2024-09-10',
        merchant: 'Shell Gas Station',
        notes: 'Fuel',
        source: 'test-data',
        createdAt: new Date(),
        totals: {
          subtotal: 65.00,
          tax: 8.45,
          total: 73.45,
          currency: 'CAD'
        }
      }
    ]
    
    const sampleLineItemsTemplate = [
      // Starbucks items
      {
        receipt_id: null, // Will be set after receipt insertion
        date: '2024-09-12',
        store: 'Starbucks',
        description: 'Grande Latte',
        category: 'Food & Beverage',
        quantity: 1,
        unit_price: 5.50,
        total_price: 5.50,
        hst: 0.72,
        discount: null
      },
      // Walmart items
      {
        receipt_id: null,
        date: '2024-09-11',
        store: 'Walmart',
        description: 'Milk 2L',
        category: 'Groceries',
        quantity: 1,
        unit_price: 4.99,
        total_price: 4.99,
        hst: 0.65,
        discount: null
      },
      {
        receipt_id: null,
        date: '2024-09-11',
        store: 'Walmart',
        description: 'Bread Loaf',
        category: 'Groceries',
        quantity: 1,
        unit_price: 2.99,
        total_price: 2.99,
        hst: 0.39,
        discount: null
      },
      {
        receipt_id: null,
        date: '2024-09-11',
        store: 'Walmart',
        description: 'Apples 3lbs',
        category: 'Groceries',
        quantity: 1,
        unit_price: 4.99,
        total_price: 4.99,
        hst: 0.65,
        discount: null
      },
      {
        receipt_id: null,
        date: '2024-09-11',
        store: 'Walmart',
        description: 'Chicken Breast',
        category: 'Groceries',
        quantity: 2,
        unit_price: 8.99,
        total_price: 17.98,
        hst: 2.34,
        discount: null
      },
      {
        receipt_id: null,
        date: '2024-09-11',
        store: 'Walmart',
        description: 'Rice 5kg',
        category: 'Groceries',
        quantity: 1,
        unit_price: 7.99,
        total_price: 7.99,
        hst: 1.04,
        discount: null
      },
      {
        receipt_id: null,
        date: '2024-09-11',
        store: 'Walmart',
        description: 'Pasta 500g',
        category: 'Groceries',
        quantity: 2,
        unit_price: 1.99,
        total_price: 3.98,
        hst: 0.52,
        discount: null
      },
      {
        receipt_id: null,
        date: '2024-09-11',
        store: 'Walmart',
        description: 'Cheese Block',
        category: 'Groceries',
        quantity: 1,
        unit_price: 4.99,
        total_price: 4.99,
        hst: 0.65,
        discount: null
      },
      // Shell items
      {
        receipt_id: null,
        date: '2024-09-10',
        store: 'Shell Gas Station',
        description: 'Regular Gas 40L',
        category: 'Transportation',
        quantity: 40,
        unit_price: 1.625,
        total_price: 65.00,
        hst: 8.45,
        discount: null
      }
    ]
    
    let totalReceipts = 0
    let totalLineItems = 0
    
    // Add test data for each user
    for (const user of users) {
      const accountId = user.accountId || user._id
      console.log(`Adding test data for user: ${user.email} (accountId: ${accountId})`)
      
      // Clear existing test data for this user
      await receiptsCol.deleteMany({ source: 'test-data', accountId: accountId })
      await itemsCol.deleteMany({ 
        store: { $in: ['Starbucks', 'Walmart', 'Shell Gas Station'] },
        accountId: accountId
      })
      
      // Create receipts for this user
      const userReceipts = sampleReceiptsTemplate.map(receipt => ({
        ...receipt,
        accountId: accountId
      }))
      
      // Insert receipts and get their IDs
      const receiptIds: any[] = []
      for (const receipt of userReceipts) {
        const { insertedId } = await receiptsCol.insertOne(receipt)
        receiptIds.push(insertedId)
      }
      
      // Update line items with receipt IDs and user account
      const userLineItems = sampleLineItemsTemplate.map((item) => {
        let receiptId
        if (item.store === 'Starbucks') {
          receiptId = receiptIds[0]
        } else if (item.store === 'Walmart') {
          receiptId = receiptIds[1]
        } else if (item.store === 'Shell Gas Station') {
          receiptId = receiptIds[2]
        }
        return { 
          ...item, 
          receipt_id: receiptId,
          accountId: accountId
        }
      })
      
      // Insert line items for this user
      await itemsCol.insertMany(userLineItems)
      
      totalReceipts += receiptIds.length
      totalLineItems += userLineItems.length
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Test data added successfully for ${users.length} users`,
      users: users.length,
      receipts: totalReceipts,
      lineItems: totalLineItems
    })
    
  } catch (error: any) {
    console.error('Test data error:', error)
    return NextResponse.json({ 
      detail: error?.message || 'Server error' 
    }, { status: 500 })
  }
}
