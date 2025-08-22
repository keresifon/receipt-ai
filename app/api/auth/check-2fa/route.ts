import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { apiRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = apiRateLimit(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    // Find user by email
    const user = await db.collection('users').findOne({ 
      email: email.toLowerCase() 
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has 2FA enabled
    const twoFactorData = await db.collection('two_factor_auth').findOne({
      userId: user._id,
      enabled: true
    })

    return NextResponse.json({
      requires2FA: !!twoFactorData,
      userId: user._id.toString()
    })

  } catch (error) {
    console.error('Check 2FA error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
