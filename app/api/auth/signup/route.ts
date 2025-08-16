import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  accountName: z.string().min(2, 'Account name must be at least 2 characters'),
  accountDescription: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = SignupSchema.parse(body)

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const users = db.collection('users')
    const accounts = db.collection('accounts')

    // Check if user already exists
    const existingUser = await users.findOne({ email: parsed.email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ detail: 'User with this email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(parsed.password, 12)

    // Create account first
    const accountDoc = {
      name: parsed.accountName,
      description: parsed.accountDescription || '',
      createdAt: new Date(),
      createdBy: '', // Will be updated after user creation
      settings: {
        currency: 'CAD',
        timezone: 'America/Toronto',
        allowInvites: true,
        maxUsers: 10
      }
    }

    const accountResult = await accounts.insertOne(accountDoc)
    const accountId = accountResult.insertedId

    // Create user
    const userDoc = {
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      password: hashedPassword,
      accountId: accountId,
      role: 'admin' as const,
      createdAt: new Date(),
      emailVerified: false
    }

    const userResult = await users.insertOne(userDoc)

    // Update account with creator info
    await accounts.updateOne(
      { _id: accountId },
      { $set: { createdBy: userResult.insertedId.toString() } }
    )

    return NextResponse.json({ 
      message: 'Account created successfully',
      userId: userResult.insertedId.toString(),
      accountId: accountId.toString()
    })

  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json({ detail: e.errors[0].message }, { status: 400 })
    }
    
    console.error('Signup error:', e)
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
