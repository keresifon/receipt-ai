import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session in verification-status:', session)
    
    if (!session?.user?.id) {
      console.log('No session or user ID found')
      return NextResponse.json({ 
        detail: 'Authentication required' 
      }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const users = db.collection('users')
    
    console.log('Looking for user with ID:', session.user.id)
    const user = await users.findOne({ _id: new ObjectId(session.user.id) })
    console.log('User found:', user ? 'Yes' : 'No')
    
    if (!user) {
      return NextResponse.json({ 
        detail: 'User not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      emailVerified: user.emailVerified || false,
      hasVerificationToken: !!user.emailVerificationToken,
      verificationExpires: user.emailVerificationExpires,
      createdAt: user.createdAt
    })

  } catch (error) {
    console.error('Verification status error:', error)
    return NextResponse.json({ 
      detail: 'Internal server error' 
    }, { status: 500 })
  }
}
