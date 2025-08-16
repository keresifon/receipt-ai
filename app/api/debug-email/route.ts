import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Resend } from 'resend'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    // Check environment variables
    const envCheck = {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Configured' : 'Missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
      SITE_URL: process.env.SITE_URL || 'Not set'
    }

    // Test Resend connection
    let resendStatus = 'Not tested'
    let emailTest = null
    
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        // Test sending a simple email
        const result = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: [session.user.email || 'test@example.com'],
          subject: 'Debug Test Email',
          html: '<p>This is a debug test email</p>'
        })
        
        resendStatus = 'Connected and working'
        emailTest = result
      } catch (error: any) {
        resendStatus = `Error: ${error.message}`
        emailTest = { error: error.message }
      }
    }

    return NextResponse.json({
      message: 'Email configuration debug info',
      environment: envCheck,
      resendStatus,
      emailTest,
      session: {
        user: session.user.email,
        accountId: (session.user as any).accountId
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      message: 'Debug failed',
      error: error.message
    }, { status: 500 })
  }
}
