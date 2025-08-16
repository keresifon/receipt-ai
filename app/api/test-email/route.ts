import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ detail: 'Email is required' }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    
    console.log('🧪 Testing email delivery to:', email)
    console.log('🔑 Using API key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing')
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [email],
      subject: '🧪 Test Email from Receipt AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d6efd;">🧪 Test Email</h2>
          <p>This is a test email to verify Resend is working.</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>To:</strong> ${email}</p>
          <p>If you receive this, Resend is working correctly!</p>
        </div>
      `
    })
    
    console.log('✅ Test email sent successfully:', result)
    
    return NextResponse.json({ 
      message: 'Test email sent successfully',
      result: result
    })
    
  } catch (error: any) {
    console.error('❌ Test email failed:', error)
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    })
    
    return NextResponse.json({ 
      detail: 'Failed to send test email',
      error: error.message
    }, { status: 500 })
  }
}
