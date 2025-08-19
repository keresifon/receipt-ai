import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (consider Redis for production)
const store: RateLimitStore = {}

export function rateLimit(config: RateLimitConfig) {
  return function(req: NextRequest) {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    // Clean up expired entries
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < now) {
        delete store[key]
      }
    })
    
    // Get or create rate limit entry
    if (!store[ip]) {
      store[ip] = {
        count: 0,
        resetTime: now + config.windowMs
      }
    }
    
    // Check if rate limit exceeded
    if (store[ip].count >= config.maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
    
    // Increment counter
    store[ip].count++
    
    return null // Continue with request
  }
}

// Predefined rate limit configurations
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 attempts per 15 minutes
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100 // 100 requests per minute
})
