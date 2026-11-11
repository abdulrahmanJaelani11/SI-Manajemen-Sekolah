import { NextResponse } from 'next/server'

export interface ApiResponseOptions<T = any> {
  data?: T
  message?: string
  meta?: Record<string, any>
  status?: number
}

export function apiSuccess<T = any>({
  data,
  message = 'Berhasil',
  meta,
  status = 200,
}: ApiResponseOptions<T>) {
  return NextResponse.json(
    {
      success: true,
      message,
      data: data ?? null,
      meta,
    },
    { status }
  )
}

export function apiError(
  message: string = 'Terjadi kesalahan internal server',
  status: number = 500,
  errors?: any
) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors: errors ?? null,
    },
    { status }
  )
}
