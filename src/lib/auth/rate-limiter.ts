import { NextRequest } from 'next/server'

interface RateLimitRecord {
  attempts: number
  resetTime: number
}

// In-memory store (sliding window per key)
const rateLimitStore = new Map<string, RateLimitRecord>()

// Bersihkan memori setiap 10 menit
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 10 * 60 * 1000)
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return '127.0.0.1'
}

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000 // 15 menit
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      attempts: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    }
  }

  if (record.attempts >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(0, Math.ceil((record.resetTime - now) / 1000)),
    }
  }

  record.attempts += 1
  return {
    allowed: true,
    remaining: maxAttempts - record.attempts,
    resetInSeconds: Math.max(0, Math.ceil((record.resetTime - now) / 1000)),
  }
}

export function resetRateLimit(key: string) {
  rateLimitStore.delete(key)
}

