import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CreateSchema = z.object({
  receipt_id: z.string(),
  date: z.string(),
  store: z.string(),
  description: z.string(), // e.g., "HST" or "Discount"
  category: z.string().optional(),
  total_price: z.union([z.string(), z.number()])
})

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || !('accountId' in session.user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = CreateSchema.parse(body)

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    const doc = {
      receipt_id: new ObjectId(parsed.receipt_id),
      date: parsed.date,
      store: parsed.store,
      description: parsed.description,
      category: parsed.category ?? '',
      total_price: parsed.total_price,
      accountId: new ObjectId(session.user.accountId),
    }
    const res = await items.insertOne(doc)
    return NextResponse.json({ insertedId: res.insertedId.toString() })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}


