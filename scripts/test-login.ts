#!/usr/bin/env tsx

import { config } from 'dotenv'

// Load environment variables
config()

const TEST_EMAIL = 'test@no-wahala.net'
const TEST_PASSWORD = 'test1234'
const API_URL = process.env.NEXTAUTH_URL || 'https://no-wahala.net'

async function testLogin() {
  try {
    console.log('🧪 Testing login with:', TEST_EMAIL)
    console.log('🌐 API URL:', API_URL)
    
    const response = await fetch(`${API_URL}/api/auth/mobile-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    })
    
    const data = await response.json()
    
    console.log('📊 Response Status:', response.status)
    console.log('📄 Response Data:', JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('✅ Login successful!')
      if (data.token) {
        console.log('🔑 Auth token received')
      }
      if (data.user) {
        console.log('👤 User data:', data.user.email)
      }
    } else {
      console.log('❌ Login failed:', data.detail || 'Unknown error')
    }
    
  } catch (error) {
    console.error('❌ Network error:', error)
  }
}

testLogin()







