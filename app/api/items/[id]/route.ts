import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  total_price: z.union([z.string(), z.number()]).optional(),
  hst: z.union([z.string(), z.number()]).optional(),
  discount: z.union([z.string(), z.number()]).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  quantity: z.union([z.string(), z.number()]).optional(),
  unit_price: z.union([z.string(), z.number()]).optional(),
  store: z.string().optional(),
  date: z.string().optional(),
}).strict()

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication - support both NextAuth and JWT
    const authHeader = req.headers.get('authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
        user = { accountId: decoded.accountId, email: decoded.email }
      } catch (error) {
        // JWT verification failed, try NextAuth session
        const session = await getServerSession(authOptions)
        user = session?.user
      }
    } else {
      // No JWT token, try NextAuth session
      const session = await getServerSession(authOptions)
      user = session?.user
    }
    
    if (!user || !('accountId' in user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const id = params.id
    if (!id) return NextResponse.json({ detail: 'Missing id' }, { status: 400 })
    const body = await req.json()
    const parsed = PatchSchema.parse(body)

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    const update: Record<string, any> = {}
    if (parsed.total_price !== undefined) update.total_price = parsed.total_price
    if (parsed.hst !== undefined) update.hst = parsed.hst
    if (parsed.discount !== undefined) update.discount = parsed.discount
    if (parsed.category !== undefined) update.category = parsed.category
    if (parsed.description !== undefined) update.description = parsed.description
    if (parsed.quantity !== undefined) update.quantity = parsed.quantity
    if (parsed.unit_price !== undefined) update.unit_price = parsed.unit_price
    if (parsed.store !== undefined) update.store = parsed.store
    if (parsed.date !== undefined) update.date = parsed.date

    const { matchedCount } = await items.updateOne({ _id: new ObjectId(id) }, { $set: update })
    if (!matchedCount) return NextResponse.json({ detail: 'Item not found' }, { status: 404 })
    return NextResponse.json({ updated: true })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication - support both NextAuth and JWT
    const authHeader = req.headers.get('authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
        user = { accountId: decoded.accountId, email: decoded.email }
      } catch (error) {
        // JWT verification failed, try NextAuth session
        const session = await getServerSession(authOptions)
        user = session?.user
      }
    } else {
      // No JWT token, try NextAuth session
      const session = await getServerSession(authOptions)
      user = session?.user
    }
    
    if (!user || !('accountId' in user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const id = params.id
    if (!id) return NextResponse.json({ detail: 'Missing id' }, { status: 400 })

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    const { deletedCount } = await items.deleteOne({ _id: new ObjectId(id) })
    if (!deletedCount) return NextResponse.json({ detail: 'Item not found' }, { status: 404 })
    return NextResponse.json({ deleted: true })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}


