import { NextResponse } from 'next/server'
import { resetAllRateLimits } from '@/lib/auth/rate-limiter'

export async function GET() {
  resetAllRateLimits()
  return NextResponse.json({ success: true, message: 'Rate limits successfully cleared' })
}

export async function POST() {
  resetAllRateLimits()
  return NextResponse.json({ success: true, message: 'Rate limits successfully cleared' })
}
