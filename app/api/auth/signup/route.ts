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
  accountName: z.string().min(2, 'Account name must be at least 2 characters').optional(),
  accountDescription: z.string().optional(),
  invite: z.string().optional(),
  accountId: z.string().optional()
}).refine((data) => {
  // If it's an invitation, accountName is not required
  if (data.invite && data.accountId) {
    return true
  }
  // If it's not an invitation, accountName is required
  return data.accountName && data.accountName.length >= 2
}, {
  message: "Account name is required for new accounts",
  path: ["accountName"]
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
      if (parsed.invite && parsed.accountId) {
        // User exists and has invitation - allow them to join the account
        try {
          const accountId = new ObjectId(parsed.accountId)
          
          // Verify the invite exists and is valid
          const invites = db.collection('account_invites')
          const invite = await invites.findOne({ 
            token: parsed.invite,
            email: parsed.email.toLowerCase(),
            accountId: accountId,
            status: 'pending'
          })
          
          if (!invite) {
            return NextResponse.json({ detail: 'Invalid or expired invitation' }, { status: 400 })
          }
          
          // Check if user is already a member of this account
          const accountMembers = db.collection('account_members')
          const existingMembership = await accountMembers.findOne({ 
            accountId: accountId, 
            userId: existingUser._id 
          })
          
          if (existingMembership) {
            return NextResponse.json({ 
              detail: 'You are already a member of this account' 
            }, { status: 400 })
          }
          
          // Add user to account as member
          await accountMembers.insertOne({
            accountId: accountId,
            userId: existingUser._id,
            role: invite.role,
            joinedAt: new Date()
          })
          
          // Mark invite as accepted
          await invites.updateOne(
            { _id: invite._id },
            { $set: { status: 'accepted', acceptedAt: new Date() } }
          )
          
          return NextResponse.json({ 
            message: 'Successfully joined account',
            userId: existingUser._id.toString(),
            accountId: accountId.toString()
          })
          
        } catch (error) {
          return NextResponse.json({ detail: 'Invalid account ID' }, { status: 400 })
        }
      } else {
        // User exists but no invitation - return error
        return NextResponse.json({ detail: 'User with this email already exists' }, { status: 400 })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(parsed.password, 12)

    let accountId: ObjectId
    let userRole: 'admin' | 'member' | 'viewer' = 'admin'

    if (parsed.invite && parsed.accountId) {
      // Handle invitation - join existing account
      try {
        accountId = new ObjectId(parsed.accountId)
        
        // Verify the invite exists and is valid
        const invites = db.collection('account_invites')
        const invite = await invites.findOne({ 
          token: parsed.invite,
          email: parsed.email.toLowerCase(),
          accountId: accountId,
          status: 'pending'
        })
        
        if (!invite) {
          return NextResponse.json({ detail: 'Invalid or expired invitation' }, { status: 400 })
        }
        
        // Set role based on invitation
        userRole = invite.role
        
        // Mark invite as accepted
        await invites.updateOne(
          { _id: invite._id },
          { $set: { status: 'accepted', acceptedAt: new Date() } }
        )
        
      } catch (error) {
        return NextResponse.json({ detail: 'Invalid account ID' }, { status: 400 })
      }
    } else {
      // Create new account
      // Note: accountName validation is handled by the schema above
      const accountDoc = {
        name: parsed.accountName!,
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
      accountId = accountResult.insertedId

      // Update account with creator info after user creation
      // (We'll do this below)
    }

    // Create user
    const userDoc = {
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      password: hashedPassword,
      accountId: accountId,
      role: userRole,
      createdAt: new Date(),
      emailVerified: false
    }

    const userResult = await users.insertOne(userDoc)

    // If this was a new account, update it with creator info
    if (!parsed.invite) {
      await accounts.updateOne(
        { _id: accountId },
        { $set: { createdBy: userResult.insertedId.toString() } }
      )
    }

    return NextResponse.json({ 
      message: parsed.invite ? 'Account joined successfully' : 'Account created successfully',
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
